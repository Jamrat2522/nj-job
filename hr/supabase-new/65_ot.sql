-- ============================================================
-- NJ HR V.10 — 65_ot.sql   [รอบ 3/3 ของการย้ายไป Supabase]
-- ระบบขอ OT + อนุมัติ + รายงาน OT: ย้ายจาก localStorage ไปฐานข้อมูลจริง
--
-- โครงสร้างจริงที่ตรวจแล้ว (ห้ามเปลี่ยน):
--   ot_requests = id uuid PK · employee_id uuid · ot_date date NOT NULL
--                 start_time time · end_time time · ot_hours numeric
--                 ot_rate numeric · ot_amount numeric · reason text
--                 approver_id uuid · status request_status · created_at timestamptz
--                 approvals jsonb · spans_next_day bool NOT NULL
--   njhr_ot_jobs = ตารางลูก (1 คำขอ = หลายรายการงาน) FK → ot_requests.id ON DELETE CASCADE
--                  job_no · job_code · detail · job_type · job_date · start_time · end_time
--                  spans_next_day · end_date (generated) · ot_hours · dept_snap · position_snap
--   request_status = PENDING · APPROVED · REJECTED · CANCELLED
--
-- ⚠️ ไม่คำนวณเงิน OT ที่นี่ — ot_rate / ot_amount ปล่อยให้ระบบเงินเดือนเดิมจัดการเหมือนเดิม
--    RPC นี้เก็บเฉพาะ "ชั่วโมง" และ "ประเภทวัน" ไม่แตะสูตร rpOtSplit / smOtSplit
--
-- ใช้ของเดิม: njhr_shift_at() · holidays (ผ่านการตรวจวันหยุด) · njhr_audit_write
-- ต้องรัน 48_employees.sql · 51_core_schema.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.ot_requests') is null then raise exception 'PREFLIGHT: ไม่พบตาราง ot_requests'; end if;
  if to_regclass('public.njhr_ot_jobs') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ot_jobs — รัน 51_core_schema.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='ot_requests'
     and column_name in ('employee_id','ot_date','start_time','end_time','ot_hours',
                         'reason','status','spans_next_day');
  if n <> 8 then raise exception 'PREFLIGHT: ot_requests ขาดคอลัมน์ที่ต้องใช้ (พบ %)', n; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create index if not exists njhr_ot_date_idx on public.ot_requests (ot_date desc);
create index if not exists njhr_ot_emp_idx  on public.ot_requests (employee_id, ot_date desc);
create index if not exists njhr_otjobs_ot_idx on public.njhr_ot_jobs (ot_id, job_no);

insert into public.njhr_schema_version(version, note)
values ('v12.0-ot', 'ขอ OT + อนุมัติ + รายงาน OT อ่านเขียนบน Supabase')
on conflict (version) do nothing;


-- ─── 1) สิทธิ์ ───────────────────────────────────────────────
create or replace function public.njhr_ot_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid,
               is_manager boolean, can_approve boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER')),
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER'));
end $$;

-- วันหยุด/เสาร์อาทิตย์ ใช้ตัดสิน "ประเภทวัน" ของ OT (ชุดเดียวกับระบบลา)
create or replace function public.njhr_ot_is_holiday(p_date date)
returns boolean language sql stable security definer set search_path = public as $$
  select extract(dow from p_date)::int in (0, 6)
      or exists (select 1 from public.holidays h where h.holiday_date = p_date);
$$;


-- ─── 2) ส่งคำขอ OT (คำขอ + รายการงาน ในธุรกรรมเดียว) ─────────
-- p_jobs: [{"job_code":"JB-1","detail":"...","job_type":"ตรวจปล่อย","note":""}, ...]
-- วันที่/เวลาอยู่ระดับคำขอ (ตรงกับฟอร์มปัจจุบัน) ชั่วโมงหารเฉลี่ยลงแต่ละรายการ
create or replace function public.njhr_ot_submit(
  p_token text, p_date date, p_start time, p_end time, p_next_day boolean,
  p_jobs jsonb, p_reason text default null)
returns table (id uuid, ot_date date, ot_hours numeric, jobs_count int, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; v_id uuid; r jsonb; i int := 0; n int;
        v_mins int; v_hours numeric; v_per numeric; v_used numeric := 0; v_h numeric;
begin
  select * into c from public.njhr_ot_guard(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงขอ OT ไม่ได้' using errcode='28000';
  end if;
  if p_date is null then raise exception 'กรุณาเลือกวันที่' using errcode='22023'; end if;
  if p_start is null or p_end is null then
    raise exception 'กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด' using errcode='22023';
  end if;
  v_mins := (extract(epoch from p_end) - extract(epoch from p_start))::int / 60
            + (case when coalesce(p_next_day,false) then 24 * 60 else 0 end);
  if v_mins <= 0 then
    raise exception 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น หรือเลือก "สิ้นสุดวัน = วันถัดไป"' using errcode='22023';
  end if;
  if v_mins > 24 * 60 then
    raise exception 'ช่วงเวลา OT ยาวเกิน 24 ชั่วโมง' using errcode='22023';
  end if;
  if p_jobs is null or jsonb_typeof(p_jobs) <> 'array' or jsonb_array_length(p_jobs) = 0 then
    raise exception 'กรุณาเพิ่มรายการงาน OT อย่างน้อย 1 รายการ' using errcode='22023';
  end if;
  n := jsonb_array_length(p_jobs);
  if n > 50 then raise exception 'เพิ่มรายการงานได้ไม่เกิน 50 รายการต่อคำขอ' using errcode='22023'; end if;

  -- ตรวจข้อมูลบังคับของทุกรายการก่อน แล้วค่อยบันทึก
  for r in select * from jsonb_array_elements(p_jobs) loop
    i := i + 1;
    if coalesce(btrim(r->>'job_code'),'') = '' then
      raise exception 'รายการที่ %: กรุณาระบุเลข JOB', i using errcode='22023'; end if;
    if coalesce(btrim(r->>'detail'),'') = '' then
      raise exception 'รายการที่ %: กรุณาระบุรายละเอียดงาน', i using errcode='22023'; end if;
    if coalesce(btrim(r->>'job_type'),'') = '' then
      raise exception 'รายการที่ %: กรุณาเลือกประเภทงาน', i using errcode='22023'; end if;
  end loop;

  -- ทับช่วงเวลากับคำขอที่ยังมีผลของคนเดียวกัน
  if exists (
    select 1 from public.ot_requests o
     where o.employee_id = c.employee_id
       and o.status in ('PENDING','APPROVED')
       and o.ot_date = p_date
       and tstzrange(
             (o.ot_date::text || ' ' || o.start_time::text)::timestamptz,
             ((o.ot_date + (case when o.spans_next_day then 1 else 0 end))::text || ' ' || o.end_time::text)::timestamptz)
           && tstzrange(
             (p_date::text || ' ' || p_start::text)::timestamptz,
             ((p_date + (case when coalesce(p_next_day,false) then 1 else 0 end))::text || ' ' || p_end::text)::timestamptz)
  ) then
    raise exception 'ช่วงเวลานี้ทับกับคำขอ OT ที่ยังมีผลอยู่' using errcode='22023';
  end if;

  select * into e from public.employees where id = c.employee_id;
  v_hours := round((v_mins / 60.0)::numeric, 2);

  insert into public.ot_requests (employee_id, ot_date, start_time, end_time,
                                  ot_hours, reason, status, spans_next_day)
  values (c.employee_id, p_date, p_start, p_end, v_hours,
          nullif(btrim(coalesce(p_reason,'')),''), 'PENDING', coalesce(p_next_day,false))
  returning ot_requests.id into v_id;

  -- ชั่วโมงหารเฉลี่ยลงแต่ละรายการงาน รายการสุดท้ายรับเศษ ผลรวมจึงเท่ากับช่วงเวลาจริงพอดี
  v_per := round((v_hours / n)::numeric, 2);
  i := 0;
  for r in select * from jsonb_array_elements(p_jobs) loop
    i := i + 1;
    v_h := case when i = n then round((v_hours - v_used)::numeric, 2) else v_per end;
    v_used := v_used + v_h;
    insert into public.njhr_ot_jobs (
      ot_id, job_no, job_code, detail, job_type, job_date, start_time, end_time,
      spans_next_day, ot_hours, dept_snap, position_snap, note, created_by, updated_by)
    values (v_id, i, btrim(r->>'job_code'), btrim(r->>'detail'), btrim(r->>'job_type'),
            p_date, p_start, p_end, coalesce(p_next_day,false), v_h,
            e.department_name, e.position_name,
            nullif(btrim(coalesce(r->>'note','')),''), c.username, c.username);
  end loop;

  perform public.njhr_audit_write(p_token, 'OT_REQ', 'ot', 'ot_requests', v_id::text,
    'ส่งคำขอ OT ' || to_char(p_date,'DD/MM/YYYY') || ' ' || p_start::text || '–' || p_end::text ||
    ' · ' || n || ' รายการ · ' || v_hours || ' ชม.', null, null, null);

  -- แจ้งผู้อนุมัติผ่านตาราง notifications เดิม
  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอ OT ใหม่',
         coalesce(btrim(coalesce(e.first_name,'') || ' ' || coalesce(e.last_name,'')), c.username) ||
         ' ขอ OT ' || v_hours || ' ชม. (' || n || ' รายการ)', 'timer'
    from public.app_users u
   where u.app_code = 'salary' and coalesce(u.is_active,true)
     and public.njhr_norm_role(u.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');

  return query select o.id, o.ot_date, o.ot_hours, n, o.status::text
                 from public.ot_requests o where o.id = v_id;
end $$;


-- ─── 3) รายการคำขอ OT ────────────────────────────────────────
create or replace function public.njhr_ot_list(
  p_token text, p_from date default null, p_to date default null,
  p_status text default null, p_dept text default null, p_employee uuid default null,
  p_q text default null, p_mine boolean default false,
  p_limit int default 200, p_offset int default 0)
returns table (
  id uuid, ot_date date, start_time time, end_time time, spans_next_day boolean,
  ot_hours numeric, reason text, status text, created_at timestamptz,
  employee_id uuid, emp_code text, prefix text, emp_name text, nickname text,
  department text, position_name text,
  jobs_count int, is_holiday boolean, files_count int, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,''))); st text := upper(btrim(coalesce(p_status,'')));
        has_files boolean := to_regclass('public.njhr_ot_attachments') is not null;
begin
  select * into c from public.njhr_ot_guard(p_token);
  if st <> '' and st not in ('PENDING','APPROVED','REJECTED','CANCELLED') then
    raise exception 'สถานะคำขอไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;
  if not c.is_manager and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  return query
  with base as (
    select o.id oid, o.ot_date od, o.start_time ost, o.end_time oen, o.spans_next_day osp,
           o.ot_hours oh, o.reason orz, o.status::text ostat, o.created_at oca,
           e.id eid, e.emp_code ec, coalesce(e.prefix,'') epx,
           btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           coalesce(e.nickname,'') enk, coalesce(e.department_name,'') edept,
           coalesce(e.position_name,'') epos,
           (select count(*)::int from public.njhr_ot_jobs j where j.ot_id = o.id) jc,
           public.njhr_ot_is_holiday(o.ot_date) hol,
           -- njhr_ot_attachments.ot_id อาจเป็น text หรือ uuid แล้วแต่ลำดับที่รัน 47/51 จึงเทียบแบบ text
           case when has_files then
             (select count(*)::int from public.njhr_ot_attachments a where a.ot_id::text = o.id::text)
             else 0 end fc
      from public.ot_requests o
      join public.employees e on e.id = o.employee_id
     where (p_from is null or o.ot_date >= p_from)
       and (p_to is null or o.ot_date <= p_to)
       -- พนักงานทั่วไปเห็นเฉพาะของตนเอง · ผู้ดูแลขอดูเฉพาะของตนเองได้ด้วย p_mine
       and (case when coalesce(p_mine,false) or not c.is_manager
                 then o.employee_id = c.employee_id else true end)
       and (st = '' or o.status::text = st)
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_employee is null or o.employee_id = p_employee)
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or exists (select 1 from public.njhr_ot_jobs j
                        where j.ot_id = o.id and lower(j.job_code) like '%'||q||'%')))
  select b.oid, b.od, b.ost, b.oen, b.osp, b.oh, b.orz, b.ostat, b.oca,
         b.eid, b.ec, b.epx, b.enm, b.enk, b.edept, b.epos,
         b.jc, b.hol, b.fc, (select count(*) from base)
    from base b order by b.od desc, b.oca desc
   limit least(greatest(coalesce(p_limit,200),1),1000) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 4) รายละเอียดคำขอ + รายการงานทั้งหมด ────────────────────
create or replace function public.njhr_ot_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; o record;
begin
  select * into c from public.njhr_ot_guard(p_token);
  select * into o from public.ot_requests where id = p_id;
  if not found then raise exception 'ไม่พบคำขอ OT นี้' using errcode='P0002'; end if;
  if not c.is_manager and o.employee_id is distinct from c.employee_id then
    raise exception 'ดูได้เฉพาะคำขอของตนเอง' using errcode='42501';
  end if;
  return query select jsonb_build_object(
    'request', jsonb_build_object(
      'id', o.id, 'ot_date', o.ot_date, 'start_time', o.start_time, 'end_time', o.end_time,
      'spans_next_day', o.spans_next_day, 'ot_hours', o.ot_hours, 'reason', o.reason,
      'status', o.status::text, 'created_at', o.created_at,
      'is_holiday', public.njhr_ot_is_holiday(o.ot_date),
      'approvals', coalesce(o.approvals, '[]'::jsonb)),
    'employee', (select jsonb_build_object(
        'id', e.id, 'emp_code', e.emp_code,
        'name', btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),
        'department', e.department_name, 'position', e.position_name)
      from public.employees e where e.id = o.employee_id),
    'jobs', (select coalesce(jsonb_agg(jsonb_build_object(
        'no', j.job_no, 'job_code', j.job_code, 'detail', j.detail, 'job_type', j.job_type,
        'job_date', j.job_date, 'start_time', j.start_time, 'end_time', j.end_time,
        'spans_next_day', j.spans_next_day, 'end_date', j.end_date,
        'ot_hours', j.ot_hours, 'note', j.note) order by j.job_no), '[]')
      from public.njhr_ot_jobs j where j.ot_id = o.id)
  );
end $$;


-- ─── 5) อนุมัติ / ไม่อนุมัติ / ยกเลิก ────────────────────────
create or replace function public.njhr_ot_decide(
  p_token text, p_id uuid, p_action text, p_note text default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; o record; v_act text := upper(btrim(coalesce(p_action,''))); v_new text;
begin
  select * into c from public.njhr_ot_guard(p_token);
  if v_act not in ('APPROVE','REJECT','CANCEL') then
    raise exception 'การดำเนินการไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;
  select * into o from public.ot_requests where id = p_id;
  if not found then raise exception 'ไม่พบคำขอ OT นี้' using errcode='P0002'; end if;
  if o.status::text <> 'PENDING' then
    raise exception 'คำขอนี้ดำเนินการไปแล้ว (สถานะปัจจุบัน: %)', o.status using errcode='22023';
  end if;

  if v_act = 'CANCEL' then
    -- ยกเลิกได้เฉพาะเจ้าของคำขอ หรือผู้ดูแล
    if o.employee_id is distinct from c.employee_id and not c.is_manager then
      raise exception 'ยกเลิกได้เฉพาะคำขอของตนเอง' using errcode='42501';
    end if;
    v_new := 'CANCELLED';
  else
    if not c.can_approve then
      raise exception 'คุณไม่มีสิทธิ์อนุมัติคำขอ OT' using errcode='42501';
    end if;
    -- อนุมัติคำขอของตัวเองไม่ได้
    if o.employee_id = c.employee_id then
      raise exception 'ไม่สามารถอนุมัติคำขอของตนเองได้' using errcode='42501';
    end if;
    if v_act = 'REJECT' and coalesce(btrim(p_note),'') = '' then
      raise exception 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' using errcode='22023';
    end if;
    v_new := case when v_act = 'APPROVE' then 'APPROVED' else 'REJECTED' end;
  end if;

  update public.ot_requests
     set status = v_new::public.request_status,
         approver_id = case when v_act = 'CANCEL' then approver_id else c.employee_id end,
         approvals = coalesce(approvals, '[]'::jsonb) || jsonb_build_object(
           'at', now(), 'by', c.username, 'role', c.role,
           'action', v_act, 'note', nullif(btrim(coalesce(p_note,'')),''))
   where ot_requests.id = p_id;

  perform public.njhr_audit_write(p_token,
    case v_act when 'APPROVE' then 'OT_APPROVE' when 'REJECT' then 'OT_REJECT' else 'OT_CANCEL' end,
    'ot', 'ot_requests', p_id::text,
    to_char(o.ot_date,'DD/MM/YYYY') || ' · ' || o.ot_hours || ' ชม.' ||
    coalesce(' · ' || nullif(btrim(coalesce(p_note,'')),''), ''), null, null, null);

  -- แจ้งเจ้าของคำขอ
  insert into public.notifications(user_id, title, body, icon)
  select u.id,
         case v_act when 'APPROVE' then 'คำขอ OT ได้รับการอนุมัติ'
                    when 'REJECT'  then 'คำขอ OT ไม่ได้รับการอนุมัติ'
                    else 'คำขอ OT ถูกยกเลิก' end,
         to_char(o.ot_date,'DD/MM/YYYY') || ' · ' || o.ot_hours || ' ชม.' ||
         coalesce(' · ' || nullif(btrim(coalesce(p_note,'')),''), ''), 'timer'
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = o.employee_id;

  return query select r.id, r.status::text from public.ot_requests r where r.id = p_id;
end $$;


-- ─── 6) รายงาน OT (รายรายการงาน) ─────────────────────────────
create or replace function public.njhr_ot_report(
  p_token text, p_from date, p_to date, p_status text default 'APPROVED',
  p_dept text default null, p_employee uuid default null, p_q text default null,
  p_limit int default 2000, p_offset int default 0)
returns table (
  ot_id uuid, job_no int, job_code text, detail text, job_type text,
  job_date date, start_time time, end_time time, end_date date, spans_next_day boolean,
  job_hours numeric, request_hours numeric, is_holiday boolean,
  employee_id uuid, emp_code text, prefix text, emp_name text,
  department text, position_name text, status text, reason text, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,''))); st text := upper(btrim(coalesce(p_status,'')));
begin
  select * into c from public.njhr_ot_guard(p_token);
  if p_from is null or p_to is null then
    raise exception 'กรุณาเลือกช่วงวันที่' using errcode='22023'; end if;
  if p_from > p_to then
    raise exception 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' using errcode='22023'; end if;
  if st <> '' and st not in ('PENDING','APPROVED','REJECTED','CANCELLED','ALL') then
    raise exception 'สถานะคำขอไม่ถูกต้อง (%)', p_status using errcode='22023'; end if;
  return query
  with base as (
    select o.id oid, j.job_no jn, j.job_code jc, coalesce(j.detail,'') jd,
           coalesce(j.job_type,'') jt, j.job_date jdt, j.start_time jst, j.end_time jen,
           j.end_date jed, j.spans_next_day jsp, j.ot_hours jh, o.ot_hours rh,
           public.njhr_ot_is_holiday(j.job_date) hol,
           e.id eid, e.emp_code ec, coalesce(e.prefix,'') epx,
           btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           -- ใช้ Snapshot ณ วันยื่นก่อน เพื่อให้รายงานย้อนหลังไม่เปลี่ยนตามข้อมูลปัจจุบัน
           coalesce(nullif(j.dept_snap,''), e.department_name, '') edept,
           coalesce(nullif(j.position_snap,''), e.position_name, '') epos,
           o.status::text ostat, coalesce(o.reason,'') orz
      from public.njhr_ot_jobs j
      join public.ot_requests o on o.id = j.ot_id
      join public.employees e on e.id = o.employee_id
     where j.job_date between p_from and p_to
       and (c.is_manager or o.employee_id = c.employee_id)
       and (st = '' or st = 'ALL' or o.status::text = st)
       and (p_dept is null or p_dept = '' or coalesce(nullif(j.dept_snap,''), e.department_name) = p_dept)
       and (p_employee is null or o.employee_id = p_employee)
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(j.job_code) like '%'||q||'%'))
  select b.oid, b.jn, b.jc, b.jd, b.jt, b.jdt, b.jst, b.jen, b.jed, b.jsp,
         b.jh, b.rh, b.hol, b.eid, b.ec, b.epx, b.enm, b.edept, b.epos, b.ostat, b.orz,
         (select count(*) from base)
    from base b order by b.jdt desc, b.ec, b.jn
   limit least(greatest(coalesce(p_limit,2000),1),5000) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 7) Migration: ย้ายคำขอ OT จาก localStorage ───────────────
-- p_rows: [{ "emp_code":"0155","date":"2026-07-24","start":"17:30","end":"20:30",
--            "next_day":false,"status":"APPROVED","reason":"...",
--            "jobs":[{"job_code":"JB-1","detail":"...","job_type":"ตรวจปล่อย","hours":1.5}] }]
create or replace function public.njhr_ot_migrate(
  p_token text, p_rows jsonb, p_dry_run boolean default true)
returns table (row_no int, emp_code text, ot_date date, action text, message text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r jsonb; j jsonb; i int := 0; k int; v_emp uuid; v_code text;
        v_date date; v_st time; v_en time; v_next boolean; v_hours numeric; v_status text;
        v_id uuid; e record; n_ins int := 0; n_skip int := 0; n_err int := 0; v_mins int;
begin
  select * into c from public.njhr_emp_guard(p_token, true);   -- SUPER_ADMIN / ADMIN / HR
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'ไม่พบข้อมูลที่จะนำเข้า' using errcode='22023';
  end if;
  if jsonb_array_length(p_rows) > 5000 then
    raise exception 'นำเข้าได้ครั้งละไม่เกิน 5,000 รายการ' using errcode='22023';
  end if;

  create temp table if not exists njhr_otmig_tmp (
    row_no int, emp_code text, ot_date date, action text, message text) on commit drop;
  delete from njhr_otmig_tmp where true;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_code := upper(btrim(coalesce(r->>'emp_code','')));
    v_emp := null; v_date := null;

    if v_code = '' then
      n_err := n_err + 1;
      insert into njhr_otmig_tmp values (i, null, null, 'ERROR', 'ไม่มีรหัสพนักงาน'); continue;
    end if;
    select e2.id into v_emp from public.employees e2 where upper(e2.emp_code) = v_code;
    if v_emp is null then
      n_err := n_err + 1;
      insert into njhr_otmig_tmp values (i, v_code, null, 'ERROR', 'ไม่พบพนักงานรหัสนี้ในระบบ'); continue;
    end if;
    if coalesce(r->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then
      n_err := n_err + 1;
      insert into njhr_otmig_tmp values (i, v_code, null, 'ERROR', 'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD'); continue;
    end if;
    v_date := (r->>'date')::date;

    begin
      v_st := (r->>'start')::time; v_en := (r->>'end')::time;
    exception when others then
      n_err := n_err + 1;
      insert into njhr_otmig_tmp values (i, v_code, v_date, 'ERROR', 'รูปแบบเวลาไม่ถูกต้อง'); continue;
    end;
    v_next := coalesce((r->>'next_day')::boolean, false);
    v_mins := (extract(epoch from v_en) - extract(epoch from v_st))::int / 60
              + (case when v_next then 24*60 else 0 end);
    if v_mins <= 0 then
      -- ออกก่อนเข้าโดยไม่ระบุข้ามวัน = ถือว่าข้ามวัน
      v_next := true; v_mins := v_mins + 24*60;
    end if;
    v_hours := round((v_mins / 60.0)::numeric, 2);
    v_status := upper(coalesce(btrim(r->>'status'),'PENDING'));
    if v_status not in ('PENDING','APPROVED','REJECTED','CANCELLED') then v_status := 'PENDING'; end if;

    -- มีคำขอวันเดียวกันช่วงเวลาเดียวกันอยู่แล้ว = ข้าม (รันซ้ำไม่เกิดข้อมูลซ้ำ)
    if exists (select 1 from public.ot_requests o
                where o.employee_id = v_emp and o.ot_date = v_date
                  and o.start_time = v_st and o.end_time = v_en) then
      n_skip := n_skip + 1;
      insert into njhr_otmig_tmp values (i, v_code, v_date, 'SKIP', 'มีคำขอช่วงเวลานี้อยู่แล้ว'); continue;
    end if;

    if not p_dry_run then
      select * into e from public.employees where id = v_emp;
      insert into public.ot_requests (employee_id, ot_date, start_time, end_time,
                                      ot_hours, reason, status, spans_next_day)
      values (v_emp, v_date, v_st, v_en, v_hours,
              nullif(btrim(coalesce(r->>'reason','')),''),
              v_status::public.request_status, v_next)
      returning ot_requests.id into v_id;

      k := 0;
      for j in select * from jsonb_array_elements(coalesce(r->'jobs','[]'::jsonb)) loop
        k := k + 1;
        insert into public.njhr_ot_jobs (
          ot_id, job_no, job_code, detail, job_type, job_date, start_time, end_time,
          spans_next_day, ot_hours, dept_snap, position_snap, created_by, updated_by)
        values (v_id, k, coalesce(nullif(btrim(coalesce(j->>'job_code','')),''), '-'),
                nullif(btrim(coalesce(j->>'detail','')),''),
                nullif(btrim(coalesce(j->>'job_type','')),''),
                v_date, v_st, v_en, v_next,
                coalesce(nullif(j->>'hours','')::numeric, 0),
                e.department_name, e.position_name, c.username, c.username);
      end loop;
    end if;

    n_ins := n_ins + 1;
    insert into njhr_otmig_tmp values (i, v_code, v_date, 'INSERT', 'นำเข้าใหม่');
  end loop;

  if not p_dry_run then
    perform public.njhr_audit_write(p_token, 'OT_MIGRATE', 'ot', 'ot_requests', null,
      'ย้ายคำขอ OT จากเครื่องผู้ใช้: ใหม่ ' || n_ins || ' · ข้าม ' || n_skip ||
      ' · ผิดพลาด ' || n_err, null, null, null);
  end if;

  return query select t.row_no, t.emp_code, t.ot_date, t.action, t.message
                 from njhr_otmig_tmp t order by t.row_no;
end $$;


-- ─── 8) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_ot_guard(text) from public, anon, authenticated;

grant execute on function public.njhr_ot_is_holiday(date)                                     to anon, authenticated;
grant execute on function public.njhr_ot_submit(text,date,time,time,boolean,jsonb,text)        to anon, authenticated;
grant execute on function public.njhr_ot_list(text,date,date,text,text,uuid,text,boolean,int,int) to anon, authenticated;
grant execute on function public.njhr_ot_get(text,uuid)                                        to anon, authenticated;
grant execute on function public.njhr_ot_decide(text,uuid,text,text)                           to anon, authenticated;
grant execute on function public.njhr_ot_report(text,date,date,text,text,uuid,text,int,int)     to anon, authenticated;
grant execute on function public.njhr_ot_migrate(text,jsonb,boolean)                           to anon, authenticated;


-- ─── 9) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_ot\_%'),
  'ot_requests_rows', (select count(*) from public.ot_requests),
  'ot_jobs_rows', (select count(*) from public.njhr_ot_jobs),
  'ot_requests_columns_unchanged', (select jsonb_agg(column_name order by ordinal_position)
     from information_schema.columns where table_schema='public' and table_name='ot_requests'),
  'request_status_values', (select jsonb_agg(e.enumlabel order by e.enumsortorder)
     from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname='request_status'),
  'holiday_shared_with_leave', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='njhr_ot_is_holiday'
       and pg_get_functiondef(p.oid) like '%public.holidays%'),
  'employees_untouched', (select count(*) from public.employees)
)) as install_report;


-- ─── 10) ROLLBACK ────────────────────────────────────────────
-- drop function if exists public.njhr_ot_migrate(text,jsonb,boolean);
-- drop function if exists public.njhr_ot_report(text,date,date,text,text,uuid,text,int,int);
-- drop function if exists public.njhr_ot_decide(text,uuid,text,text);
-- drop function if exists public.njhr_ot_get(text,uuid);
-- drop function if exists public.njhr_ot_list(text,date,date,text,text,uuid,text,boolean,int,int);
-- drop function if exists public.njhr_ot_submit(text,date,time,time,boolean,jsonb,text);
-- drop function if exists public.njhr_ot_is_holiday(date);
-- drop function if exists public.njhr_ot_guard(text);
-- drop index if exists public.njhr_ot_date_idx;
-- drop index if exists public.njhr_ot_emp_idx;
-- drop index if exists public.njhr_otjobs_ot_idx;
-- delete from public.njhr_schema_version where version='v12.0-ot';
