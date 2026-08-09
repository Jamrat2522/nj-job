-- ============================================================
-- NJ HR V.10 — โมดูลลางาน: RPC ฝั่งเซิร์ฟเวอร์ทั้งหมด
-- เขียนจากผล 40_leave_inspect.sql ของจริง (ไม่มีคอลัมน์/ตารางที่เดา)
--
-- ตารางที่ใช้ (มีอยู่แล้วทั้งหมด ไม่มี create table ใหม่):
--   leave_requests, leave_attachments, leave_approvers, employees,
--   holidays, notifications, audit_log, app_users, njhr_sessions
-- Storage bucket: leave-attachments (มีอยู่แล้ว)
--
-- ไม่มี drop table · ไม่มี delete · ไม่แตะ nj_v6_anon_all
-- ไม่แก้ njhr_login / njhr_session_check / njhr_logout / njhr_list_users
-- ============================================================


-- ═══ ส่วนที่ 0: PRE-FLIGHT — หยุดทันทีถ้าโครงสร้างไม่ตรงที่ตรวจไว้ ═══
do $$
declare fk record; n int;
begin
  -- 0.1 คอลัมน์ที่ RPC อ้างต้องมีจริงทุกตัว
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='leave_requests'
     and column_name in ('id','employee_id','leave_type','start_date','end_date',
       'leave_unit','start_time','end_time','hours','is_halfday','total_days',
       'reason','approver_id','status','approved_at','created_at','approvals');
  if n <> 17 then raise exception 'PREFLIGHT: leave_requests คอลัมน์ไม่ครบ 17 (พบ %)', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='leave_attachments'
     and column_name in ('id','leave_id','file_name','file_url','file_size','created_at');
  if n <> 6 then raise exception 'PREFLIGHT: leave_attachments คอลัมน์ไม่ครบ 6 (พบ %)', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='notifications'
     and column_name in ('user_id','title','body','icon','is_read');
  if n <> 5 then raise exception 'PREFLIGHT: notifications คอลัมน์ไม่ครบ (พบ %)', n; end if;

  -- 0.2 notifications.user_id ต้องชี้ app_users เท่านั้น ถ้าชี้ตารางอื่น = หยุด (ห้ามเดา)
  for fk in
    select confrelid::regclass::text as target
      from pg_constraint
     where conrelid = 'public.notifications'::regclass and contype='f'
       and conkey = array[(select attnum::smallint from pg_attribute
                            where attrelid='public.notifications'::regclass
                              and attname='user_id')]
  loop
    if fk.target not in ('app_users','public.app_users') then
      raise exception 'PREFLIGHT: notifications.user_id ชี้ไปที่ % ไม่ใช่ app_users — หยุดก่อน แจ้งผู้พัฒนา', fk.target;
    end if;
  end loop;

  -- 0.3 bucket ไฟล์แนบใบลาต้องมีอยู่แล้ว
  if not exists (select 1 from storage.buckets where id='leave-attachments') then
    raise exception 'PREFLIGHT: ไม่พบ storage bucket "leave-attachments"';
  end if;

  raise notice 'PREFLIGHT ผ่านครบทุกข้อ';
end $$;


-- ═══ ส่วนที่ 1: BACKUP ก่อนแตะข้อมูล (รันก่อนเสมอ) ═══
create table if not exists njhr_leave_backup_20260727 as
  select *, now() as backed_up_at from public.leave_requests;
create table if not exists njhr_leaveatt_backup_20260727 as
  select *, now() as backed_up_at from public.leave_attachments;
select (select count(*) from njhr_leave_backup_20260727)    as "สำรอง leave_requests",
       (select count(*) from njhr_leaveatt_backup_20260727) as "สำรอง leave_attachments";


-- ═══ ส่วนที่ 2: INDEX เสริมสำหรับ Pagination/Filter (idempotent, ไม่ล็อกตาราง) ═══
create index if not exists njhr_leave_emp_created_idx
  on public.leave_requests (employee_id, created_at desc);
create index if not exists njhr_leave_status_created_idx
  on public.leave_requests (status, created_at asc);
create index if not exists njhr_leave_emp_range_idx
  on public.leave_requests (employee_id, start_date, end_date);
create index if not exists njhr_leaveatt_leave_idx
  on public.leave_attachments (leave_id);


-- ═══ ส่วนที่ 3: ตัวช่วยภายใน ═══

-- 3.1 แปลง role ให้ตรงกับที่ระบบเดิมใช้ (ตรงกับ currentUser() ใน app.js เป๊ะ)
create or replace function public.njhr_norm_role(p text)
returns text language sql immutable as $$
  select case upper(coalesce(p,''))
           when 'USER'  then 'EMPLOYEE'
           when 'STAFF' then 'EMPLOYEE'
           else upper(coalesce(p,''))
         end $$;

-- 3.2 บริบทผู้ใช้จาก token (ไม่เชื่อค่าใด ๆ จาก browser)
create or replace function public.njhr_ctx(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
  select u.id, u.username, public.njhr_norm_role(u.role::text), u.employee_id,
         (coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''))
    from public.njhr_sessions s
    join public.app_users u on u.id = s.app_user_id
    left join public.employees e on e.id = u.employee_id
   where s.token = p_token and not s.revoked and s.expires_at > now()
   limit 1;
  if not found then
    raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode='28000';
  end if;
end $$;

-- 3.3 นับวันทำงาน: ตัดเสาร์-อาทิตย์ + วันหยุดบริษัท (ตรงกับ businessDays() เดิม)
create or replace function public.njhr_leave_workdays(p_start date, p_end date)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(count(*),0)::numeric
    from generate_series(p_start, p_end, interval '1 day') g(d)
   where extract(isodow from g.d) < 6
     and not exists (select 1 from public.holidays h where h.holiday_date = g.d::date) $$;

-- 3.4 โควตาลาต่อประเภท: มีเฉพาะ 3 ประเภทที่ employees เก็บจริง นอกนั้น = ไม่จำกัด (null)
create or replace function public.njhr_leave_quota(p_emp uuid, p_type text)
returns numeric language sql stable security definer set search_path = public as $$
  select case upper(p_type)
           when 'SICK'     then e.leave_sick::numeric
           when 'PERSONAL' then e.leave_personal::numeric
           when 'VACATION' then e.leave_vacation::numeric
           else null
         end from public.employees e where e.id = p_emp $$;

-- 3.5 บันทึก audit_log (ตารางกลางที่ทุกแอปใช้ร่วมกัน → app_code='salary')
create or replace function public.njhr_leave_audit(p_actor text, p_action text, p_id uuid, p_detail text)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_log(app_code, actor, action, entity, entity_id, detail)
  values ('salary', p_actor, p_action, 'leave_requests', p_id::text, p_detail) $$;


-- ═══ ส่วนที่ 4: อ่านข้อมูล ═══

-- 4.1 วันลาคงเหลือจริง — คำนวณสดจาก leave_requests (ไม่มีตารางสรุป ไม่สร้างใหม่)
--     used = APPROVED ของปีปฏิทินนี้ · pending = PENDING (กันยอดค้างอนุมัติ เหมือน reservedDays เดิม)
create or replace function public.njhr_leave_balances(p_token text)
returns table (leave_type text, quota numeric, used numeric, pending numeric, remaining numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; yr int := extract(year from current_date);
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  return query
  with t(code) as (select unnest(enum_range(null::public.leave_type))::text),
  agg as (
    select r.leave_type::text as code,
           sum(case when r.status='APPROVED' then coalesce(r.total_days,0)+coalesce(r.hours,0)/8 else 0 end) as used,
           sum(case when r.status='PENDING'  then coalesce(r.total_days,0)+coalesce(r.hours,0)/8 else 0 end) as pend
      from public.leave_requests r
     where r.employee_id = c.employee_id
       and extract(year from r.start_date) = yr
     group by 1)
  select t.code,
         public.njhr_leave_quota(c.employee_id, t.code),
         round(coalesce(a.used,0), 2),
         round(coalesce(a.pend,0), 2),
         case when public.njhr_leave_quota(c.employee_id, t.code) is null then null
              else round(public.njhr_leave_quota(c.employee_id, t.code)
                         - coalesce(a.used,0) - coalesce(a.pend,0), 2) end
    from t left join agg a on a.code = t.code
   order by t.code;
end $$;

-- 4.2 รายการลาของตัวเอง (EMPLOYEE เห็นเฉพาะของตน) + pagination ฝั่งเซิร์ฟเวอร์
create or replace function public.njhr_leave_list(
  p_token text, p_status text default null, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, leave_type text, start_date date, end_date date, leave_unit text,
  start_time time, end_time time, hours numeric, is_halfday boolean, total_days numeric,
  reason text, status text, ui_status text, created_at timestamptz,
  file_name text, approvals jsonb, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; lim int := least(greatest(coalesce(p_limit,20),1),100);
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  return query
  with base as (
    select r.* from public.leave_requests r
     where r.employee_id = c.employee_id
       and (p_status is null or p_status = '' or r.status::text = p_status)),
  cnt as (select count(*) n from base)
  select b.id, b.leave_type::text, b.start_date, b.end_date, b.leave_unit,
         b.start_time, b.end_time, b.hours, b.is_halfday, b.total_days,
         b.reason, b.status::text,
         -- สถานะที่ใช้แสดงผล: PENDING ที่ถูก "ขอข้อมูลเพิ่ม" ล่าสุด = NEED_MORE_INFO (เหมือน workflow เดิม)
         case when b.status = 'PENDING'
               and (select x->>'action' from jsonb_array_elements(coalesce(b.approvals,'[]'::jsonb)) x
                     order by (x->>'seq')::int desc limit 1) = 'INFO'
              then 'NEED_MORE_INFO' else b.status::text end,
         b.created_at,
         (select a.file_name from public.leave_attachments a
           where a.leave_id = b.id order by a.created_at limit 1),
         coalesce(b.approvals,'[]'::jsonb),
         (select n from cnt)
    from base b
   order by b.created_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;

-- 4.3 คิวอนุมัติ (สิทธิ์เดิม: SUPER_ADMIN / ADMIN / HR / MANAGER เห็นทุกใบที่ค้าง)
create or replace function public.njhr_leave_queue(
  p_token text, p_limit int default 40, p_offset int default 0)
returns table (
  id uuid, employee_id uuid, emp_code text, emp_name text, department text,
  leave_type text, start_date date, end_date date, leave_unit text,
  start_time time, end_time time, hours numeric, is_halfday boolean, total_days numeric,
  reason text, status text, ui_status text, created_at timestamptz,
  file_name text, remaining numeric, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; lim int := least(greatest(coalesce(p_limit,40),1),200);
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then
    raise exception 'คุณไม่มีสิทธิ์อนุมัติรายการ' using errcode='42501';
  end if;
  return query
  with base as (select r.* from public.leave_requests r where r.status = 'PENDING'),
  cnt as (select count(*) n from base)
  select b.id, b.employee_id, e.emp_code,
         (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
         e.department_name, b.leave_type::text, b.start_date, b.end_date, b.leave_unit,
         b.start_time, b.end_time, b.hours, b.is_halfday, b.total_days,
         b.reason, b.status::text,
         case when (select x->>'action' from jsonb_array_elements(coalesce(b.approvals,'[]'::jsonb)) x
                     order by (x->>'seq')::int desc limit 1) = 'INFO'
              then 'NEED_MORE_INFO' else b.status::text end,
         b.created_at,
         (select a.file_name from public.leave_attachments a
           where a.leave_id = b.id order by a.created_at limit 1),
         case when public.njhr_leave_quota(b.employee_id, b.leave_type::text) is null then null
              else round(public.njhr_leave_quota(b.employee_id, b.leave_type::text)
                   - coalesce((select sum(coalesce(r2.total_days,0)+coalesce(r2.hours,0)/8)
                                 from public.leave_requests r2
                                where r2.employee_id = b.employee_id
                                  and r2.leave_type = b.leave_type
                                  and r2.status in ('APPROVED','PENDING')
                                  and extract(year from r2.start_date) = extract(year from b.start_date)),0), 2) end,
         (select n from cnt)
    from base b left join public.employees e on e.id = b.employee_id
   order by b.created_at asc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;

-- 4.4 รายละเอียด + Timeline + ไฟล์แนบ (EMPLOYEE เห็นเฉพาะของตน · ผู้อนุมัติเห็นได้ตามสิทธิ์เดิม)
create or replace function public.njhr_leave_detail(p_token text, p_leave_id uuid)
returns table (id uuid, employee_id uuid, emp_name text, leave_type text,
               status text, ui_status text, approvals jsonb, attachments jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r public.leave_requests;
begin
  select * into c from public.njhr_ctx(p_token);
  select * into r from public.leave_requests where leave_requests.id = p_leave_id;
  if not found then raise exception 'ไม่พบใบลานี้' using errcode='P0002'; end if;
  if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') and r.employee_id is distinct from c.employee_id then
    raise exception 'คุณไม่มีสิทธิ์ดูใบลาของพนักงานคนอื่น' using errcode='42501';
  end if;
  return query
  select r.id, r.employee_id,
         (select coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')
            from public.employees e where e.id = r.employee_id),
         r.leave_type::text, r.status::text,
         case when r.status='PENDING'
               and (select x->>'action' from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x
                     order by (x->>'seq')::int desc limit 1) = 'INFO'
              then 'NEED_MORE_INFO' else r.status::text end,
         coalesce(r.approvals,'[]'::jsonb),
         coalesce((select jsonb_agg(jsonb_build_object(
                     'name', a.file_name, 'url', a.file_url, 'size', a.file_size)
                   order by a.created_at)
                     from public.leave_attachments a where a.leave_id = r.id), '[]'::jsonb);
end $$;

-- 4.5 ผู้อนุมัติของแผนกตัวเอง (อ่านจาก leave_approvers.config)
--     ยืนยันจากข้อมูลจริง: config เก็บรหัส 4 หลัก = employees.emp_code (เช่น '0001','0002','0155')
create or replace function public.njhr_leave_approvers(p_token text)
returns table (tier text, emp_code text, emp_name text, approval_mode text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; dep text; cfg jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  select e.department_name into dep from public.employees e where e.id = c.employee_id;
  select la.config into cfg from public.leave_approvers la where la.department = dep;
  if cfg is null then return; end if;   -- แผนกนี้ยังไม่ได้ตั้งค่าผู้อนุมัติ → คืนว่าง ไม่ error
  return query
  with codes as (
    select 'SUPERVISOR' t, cfg->>'SUPERVISOR' code where cfg ? 'SUPERVISOR'
    union all
    select 'MANAGER',      cfg->>'MANAGER'    where cfg ? 'MANAGER'
    union all
    select 'EXECUTIVE', jsonb_array_elements_text(cfg->'EXECUTIVE')
      where jsonb_typeof(cfg->'EXECUTIVE') = 'array')
  select k.t, k.code,
         (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
         coalesce(cfg->>'approval_mode','')
    from codes k left join public.employees e on e.emp_code = k.code
   where k.code is not null and k.code <> '';
end $$;


-- ═══ ส่วนที่ 5: เขียนข้อมูล (ทุกตัวตรวจสิทธิ์ + กันกดซ้ำ + อยู่ใน transaction เดียว) ═══

-- 5.1 ส่งใบลา — validation ทั้งหมดอยู่ฝั่งเซิร์ฟเวอร์ + แนบไฟล์ในธุรกรรมเดียวกัน
--     p_mode: FULL | HALF_AM | HALF_PM | HOURLY (คงรูปแบบเดิมของระบบไว้ใน approvals.meta)
--     p_client_key: กันกดส่งซ้ำ (ปุ่มรัว / เน็ตสะดุดแล้วยิงซ้ำ)
create or replace function public.njhr_leave_submit(
  p_token text, p_leave_type text, p_mode text,
  p_start_date date, p_end_date date,
  p_start_time time default null, p_end_time time default null,
  p_reason text default '', p_delegate uuid default null,
  p_file_name text default null, p_file_url text default null, p_file_size int default null,
  p_client_key text default null)
returns table (id uuid, total_days numeric, hours numeric, duplicated boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  c record; v_type public.leave_type; v_end date; v_days numeric := 0; v_hours numeric := 0;
  v_unit text; v_half boolean := false; v_quota numeric; v_usedpend numeric; v_id uuid; v_dup uuid;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;

  -- กันกดส่งซ้ำ: key เดิมภายใน 10 นาที = คืนใบเดิม ไม่สร้างซ้ำ
  if p_client_key is not null and p_client_key <> '' then
    select r.id into v_dup from public.leave_requests r
     where r.employee_id = c.employee_id
       and r.created_at > now() - interval '10 minutes'
       and r.approvals->0->'meta'->>'client_key' = p_client_key
     limit 1;
    if v_dup is not null then
      return query select v_dup, r.total_days, r.hours, true
                     from public.leave_requests r where r.id = v_dup;
      return;
    end if;
  end if;

  begin v_type := upper(p_leave_type)::public.leave_type;
  exception when others then
    raise exception 'ประเภทการลาไม่ถูกต้อง (%)', p_leave_type using errcode='22023';
  end;

  if coalesce(btrim(p_reason),'') = '' then
    raise exception 'กรุณาระบุเหตุผลการลา' using errcode='22023';
  end if;

  v_end := case when upper(p_mode) = 'FULL' then p_end_date else p_start_date end;
  if p_start_date > v_end then
    raise exception 'วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด' using errcode='22023';
  end if;

  if upper(p_mode) = 'FULL' then
    v_unit := 'day';  v_days := public.njhr_leave_workdays(p_start_date, v_end);
    if v_days <= 0 then
      raise exception 'ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)' using errcode='22023';
    end if;
  elsif upper(p_mode) in ('HALF_AM','HALF_PM') then
    v_unit := 'halfday'; v_half := true;
    v_days := case when public.njhr_leave_workdays(p_start_date, p_start_date) > 0 then 0.5 else 0 end;
    if v_days <= 0 then
      raise exception 'ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)' using errcode='22023';
    end if;
  elsif upper(p_mode) = 'HOURLY' then
    v_unit := 'hour';
    if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
      raise exception 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม' using errcode='22023';
    end if;
    v_hours := round(extract(epoch from (p_end_time - p_start_time))/3600.0, 2);
  else
    raise exception 'รูปแบบการลาไม่ถูกต้อง (%)', p_mode using errcode='22023';
  end if;

  -- ห้ามทับช่วงกับใบที่ยังมีผล (เหมือน rangesOverlap เดิม)
  if exists (select 1 from public.leave_requests r
              where r.employee_id = c.employee_id
                and r.status in ('PENDING','APPROVED')
                and p_start_date <= r.end_date and r.start_date <= v_end) then
    raise exception 'ช่วงวันที่นี้ทับกับคำขอลาเดิมที่ยังมีผลอยู่' using errcode='23505';
  end if;

  -- โควตา: ตรวจเฉพาะประเภทที่มีโควตาจริงใน employees
  v_quota := public.njhr_leave_quota(c.employee_id, v_type::text);
  if v_quota is not null then
    select coalesce(sum(coalesce(r.total_days,0)+coalesce(r.hours,0)/8),0) into v_usedpend
      from public.leave_requests r
     where r.employee_id = c.employee_id and r.leave_type = v_type
       and r.status in ('APPROVED','PENDING')
       and extract(year from r.start_date) = extract(year from p_start_date);
    if v_quota - v_usedpend < v_days + v_hours/8 then
      raise exception 'วันลาคงเหลือไม่เพียงพอ (คงเหลือ % วัน)', round(v_quota - v_usedpend, 2)
        using errcode='23514';
    end if;
  end if;

  -- ลาป่วยต้องแนบเอกสาร (กฎเดิมของระบบ — ปรับได้ที่จุดเดียวนี้)
  if v_type = 'SICK' and coalesce(p_file_url,'') = '' then
    raise exception 'ลาป่วยต้องแนบเอกสารประกอบ' using errcode='22023';
  end if;

  insert into public.leave_requests(
    employee_id, leave_type, start_date, end_date, leave_unit,
    start_time, end_time, hours, is_halfday, total_days, reason, status, approvals)
  values (c.employee_id, v_type, p_start_date, v_end, v_unit,
    case when v_unit='hour' then p_start_time end,
    case when v_unit='hour' then p_end_time end,
    v_hours, v_half, v_days, btrim(p_reason), 'PENDING',
    jsonb_build_array(jsonb_build_object(
      'seq', 1, 'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
      'by', c.app_user_id, 'by_name', coalesce(c.emp_name, c.username),
      'action', 'SUBMIT', 'note', '',
      'meta', jsonb_build_object('mode', upper(p_mode), 'delegate', p_delegate,
                                 'client_key', coalesce(p_client_key,'')))))
  returning leave_requests.id into v_id;

  if coalesce(p_file_url,'') <> '' then
    insert into public.leave_attachments(leave_id, file_name, file_url, file_size)
    values (v_id, p_file_name, p_file_url, p_file_size);
  end if;

  -- แจ้งเตือนผู้อนุมัติ (สิทธิ์เดิม) — ตารางกลาง notifications
  insert into public.notifications(user_id, title, body, icon)
  select a.id, 'คำขอลาใหม่',
         coalesce(c.emp_name, c.username) || ' ขอลา ' ||
         case when v_unit='hour' then v_hours || ' ชม.' else v_days || ' วัน' end,
         'leave'
    from public.app_users a
   where a.app_code = 'salary' and coalesce(a.is_active,true)
     and public.njhr_norm_role(a.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');

  perform public.njhr_leave_audit(c.username, 'LEAVE_REQ', v_id,
    'ส่งใบลา ' || v_type::text || ' ' || p_start_date || ' ถึง ' || v_end);

  return query select v_id, v_days, v_hours, false;
end $$;

-- 5.2 อนุมัติ / ไม่อนุมัติ / ขอข้อมูลเพิ่ม — กันกดซ้ำด้วยการล็อกแถว
--     p_action: APPROVE | REJECT | INFO   (INFO คง status=PENDING ตาม enum จริง)
create or replace function public.njhr_leave_decide(
  p_token text, p_leave_id uuid, p_action text, p_note text default '')
returns table (id uuid, status text, ui_status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r public.leave_requests; v_new public.request_status;
        v_seq int; v_act text; v_txt text; v_target uuid;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then
    raise exception 'คุณไม่มีสิทธิ์อนุมัติรายการ' using errcode='42501';
  end if;
  v_act := upper(coalesce(p_action,''));
  if v_act not in ('APPROVE','REJECT','INFO') then
    raise exception 'คำสั่งไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;
  if v_act in ('REJECT','INFO') and coalesce(btrim(p_note),'') = '' then
    raise exception 'กรุณาระบุเหตุผล' using errcode='22023';
  end if;

  -- ล็อกแถว: สองคนกดพร้อมกัน คนที่สองจะเห็นสถานะที่เปลี่ยนแล้วและถูกปฏิเสธ
  select * into r from public.leave_requests
   where leave_requests.id = p_leave_id for update;
  if not found then raise exception 'ไม่พบใบลานี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'ใบลานี้ถูกดำเนินการไปแล้ว (สถานะ: %)', r.status using errcode='55000';
  end if;

  v_new := case v_act when 'APPROVE' then 'APPROVED'::public.request_status
                      when 'REJECT'  then 'REJECTED'::public.request_status
                      else 'PENDING'::public.request_status end;
  v_txt := case v_act when 'APPROVE' then 'อนุมัติ'
                      when 'REJECT'  then 'ไม่อนุมัติ' else 'ขอข้อมูลเพิ่ม' end;
  select coalesce(max((x->>'seq')::int),0)+1 into v_seq
    from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x;

  update public.leave_requests set
    status      = v_new,
    approver_id = case when v_act='INFO' then approver_id else c.employee_id end,
    approved_at = case when v_act='APPROVE' then now() else approved_at end,
    approvals   = coalesce(approvals,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
                    'seq', v_seq,
                    'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
                    'by', c.app_user_id, 'by_name', coalesce(c.emp_name, c.username),
                    'action', v_act, 'action_th', v_txt, 'note', coalesce(btrim(p_note),'')))
   where leave_requests.id = p_leave_id;

  select a.id into v_target from public.app_users a
   where a.app_code='salary' and a.employee_id = r.employee_id limit 1;
  if v_target is not null then
    insert into public.notifications(user_id, title, body, icon)
    values (v_target, v_txt, 'คำขอลาของคุณถูก' || v_txt || 'โดย ' || coalesce(c.emp_name, c.username) ||
            case when coalesce(btrim(p_note),'')='' then '' else ' · ' || btrim(p_note) end, 'leave');
  end if;

  perform public.njhr_leave_audit(c.username,
    case v_act when 'APPROVE' then 'APPROVE' when 'REJECT' then 'REJECT' else 'REQUEST_INFO' end,
    p_leave_id, v_txt || ' ใบลา');

  return query select p_leave_id, v_new::text,
    case when v_act='INFO' then 'NEED_MORE_INFO' else v_new::text end;
end $$;

-- 5.3 ยกเลิกคำขอ — เจ้าของใบเท่านั้น และต้องยัง PENDING
create or replace function public.njhr_leave_cancel(p_token text, p_leave_id uuid)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r public.leave_requests; v_seq int;
begin
  select * into c from public.njhr_ctx(p_token);
  select * into r from public.leave_requests
   where leave_requests.id = p_leave_id for update;
  if not found then raise exception 'ไม่พบใบลานี้' using errcode='P0002'; end if;
  if r.employee_id is distinct from c.employee_id then
    raise exception 'ยกเลิกได้เฉพาะใบลาของตัวเอง' using errcode='42501';
  end if;
  if r.status <> 'PENDING' then
    raise exception 'ยกเลิกได้เฉพาะคำขอที่ยังรออนุมัติ (สถานะ: %)', r.status using errcode='55000';
  end if;
  select coalesce(max((x->>'seq')::int),0)+1 into v_seq
    from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x;
  update public.leave_requests set
    status = 'CANCELLED',
    approvals = coalesce(approvals,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'seq', v_seq, 'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
      'by', c.app_user_id, 'by_name', coalesce(c.emp_name, c.username),
      'action', 'CANCEL', 'action_th', 'ยกเลิกคำขอ', 'note', ''))
   where leave_requests.id = p_leave_id;
  perform public.njhr_leave_audit(c.username, 'CANCEL', p_leave_id, 'ยกเลิกใบลา');
  return query select p_leave_id, 'CANCELLED'::text;
end $$;


-- ═══ ส่วนที่ 6: สิทธิ์เรียกใช้ (anon key เรียกได้เฉพาะ RPC เท่านั้น) ═══
revoke all on function public.njhr_ctx(text) from public, anon, authenticated;
revoke all on function public.njhr_leave_audit(text,text,uuid,text) from public, anon, authenticated;
revoke all on function public.njhr_leave_quota(uuid,text)           from public, anon, authenticated;
revoke all on function public.njhr_leave_workdays(date,date)        from public, anon, authenticated;

grant execute on function public.njhr_leave_balances(text)                       to anon, authenticated;
grant execute on function public.njhr_leave_list(text,text,int,int)              to anon, authenticated;
grant execute on function public.njhr_leave_queue(text,int,int)                  to anon, authenticated;
grant execute on function public.njhr_leave_detail(text,uuid)                    to anon, authenticated;
grant execute on function public.njhr_leave_approvers(text)                      to anon, authenticated;
grant execute on function public.njhr_leave_submit(text,text,text,date,date,time,time,text,uuid,text,text,int,text)
                                                                                 to anon, authenticated;
grant execute on function public.njhr_leave_decide(text,uuid,text,text)          to anon, authenticated;
grant execute on function public.njhr_leave_cancel(text,uuid)                    to anon, authenticated;


-- ═══ ส่วนที่ 7: Storage policy สำหรับ bucket leave-attachments ═══
-- bucket นี้ public=true อยู่แล้ว (อ่านได้ด้วย URL) — เพิ่มเฉพาะสิทธิ์ "อัปโหลด"
-- ไม่แตะ policy ของ bucket อื่น และไม่เปลี่ยน public flag ของ bucket
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname='storage' and tablename='objects'
                    and policyname='njhr_leave_upload') then
    execute $p$create policy njhr_leave_upload on storage.objects
              for insert to anon, authenticated
              with check (bucket_id = 'leave-attachments')$p$;
  end if;
  if not exists (select 1 from pg_policies
                  where schemaname='storage' and tablename='objects'
                    and policyname='njhr_leave_read') then
    execute $p$create policy njhr_leave_read on storage.objects
              for select to anon, authenticated
              using (bucket_id = 'leave-attachments')$p$;
  end if;
exception when insufficient_privilege then
  raise notice 'ข้ามการสร้าง storage policy (สิทธิ์ไม่พอ) — ให้สร้างเองที่ Dashboard > Storage > leave-attachments > Policies';
end $$;


-- ═══ ส่วนที่ 8: SELF-TEST (อ่านอย่างเดียว — ยืนยันว่าติดตั้งครบ) ═══
select jsonb_pretty(jsonb_build_object(
  'functions_installed', (
    select jsonb_agg(p.proname order by p.proname)
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname like 'njhr\_leave\_%'),
  'indexes_installed', (
    select jsonb_agg(indexname order by indexname) from pg_indexes
     where schemaname='public' and indexname like 'njhr\_leave%'),
  'storage_policies', (
    select jsonb_agg(policyname order by policyname) from pg_policies
     where schemaname='storage' and policyname like 'njhr\_leave\_%'),
  'leave_rows_untouched', (select count(*) from public.leave_requests),
  'backup_rows', (select count(*) from njhr_leave_backup_20260727)
)) as install_report;


-- ═══ ส่วนที่ 9: ROLLBACK (คัดลอกไปรันเมื่อต้องการย้อนกลับ) ═══
-- drop function if exists public.njhr_leave_cancel(text,uuid);
-- drop function if exists public.njhr_leave_decide(text,uuid,text,text);
-- drop function if exists public.njhr_leave_submit(text,text,text,date,date,time,time,text,uuid,text,text,int,text);
-- drop function if exists public.njhr_leave_approvers(text);
-- drop function if exists public.njhr_leave_detail(text,uuid);
-- drop function if exists public.njhr_leave_queue(text,int,int);
-- drop function if exists public.njhr_leave_list(text,text,int,int);
-- drop function if exists public.njhr_leave_balances(text);
-- drop function if exists public.njhr_leave_quota(uuid,text);
-- drop function if exists public.njhr_leave_workdays(date,date);
-- drop function if exists public.njhr_leave_audit(text,text,uuid,text);
-- drop function if exists public.njhr_ctx(text);
-- drop function if exists public.njhr_norm_role(text);
-- drop policy if exists njhr_leave_upload on storage.objects;
-- drop policy if exists njhr_leave_read   on storage.objects;
-- drop index if exists public.njhr_leave_emp_created_idx;
-- drop index if exists public.njhr_leave_status_created_idx;
-- drop index if exists public.njhr_leave_emp_range_idx;
-- drop index if exists public.njhr_leaveatt_leave_idx;
-- -- คืนข้อมูลใบลา (เฉพาะกรณีจำเป็นจริง):
-- -- delete from public.leave_requests;
-- -- insert into public.leave_requests select id, employee_id, leave_type, start_date, end_date,
-- --   leave_unit, start_time, end_time, hours, is_halfday, total_days, reason, approver_id,
-- --   status, approved_at, created_at, approvals from njhr_leave_backup_20260727;
