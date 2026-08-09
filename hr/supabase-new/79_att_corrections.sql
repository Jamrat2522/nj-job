-- ============================================================
-- NJ HR V.10 — 79_att_corrections.sql
-- D) คำขอแก้ไขเวลา — ตาราง attendance_corrections + 6 RPC
--
-- ตรวจก่อนสร้าง: PREFLIGHT ไล่หาตารางคำขอแก้เวลาภายใต้ชื่ออื่น
--   (%correct% · %amend% · time_edit% · att_edit%) ถ้าเจอจะหยุดทันที
--
-- คอลัมน์ attendance ที่ยืนยันแล้วจากโค้ดจริง (64_attendance.sql)
--   employee_id · work_date · check_in · check_out · status (enum attendance_status) · work_hours
--   unique (employee_id, work_date)
--
-- กติกาที่บังคับที่ฐานข้อมูล
--   · APPROVED เท่านั้นที่แก้ attendance จริง และแก้ใน transaction เดียวกับการอนุมัติ
--   · เก็บค่าก่อนแก้ (original_*) และค่าหลังแก้ (requested_*) ครบทุกใบ
--   · กันอนุมัติซ้ำ (สถานะต้องเป็น PENDING เท่านั้น)
--   · กันยื่นซ้ำวันเดียวกัน (unique partial index เฉพาะใบที่ยังไม่จบ)
--   · ทุกการกระทำเขียน audit_log + notifications ผ่านระบบเดิม
--
-- ต้องรัน 41 · 42 · 48 · 64 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
--  ตรวจตารางคำขอแก้เวลาที่อาจมีอยู่แล้ว โดยตัดสินจาก "คอลัมน์จริง" ไม่ใช่ชื่อตารางอย่างเดียว
--  ชื่อที่คล้ายกันแต่คนละเรื่อง (เช่น amend_refund_records ของแอป AMEND) จะไม่ถูกนับเป็นของซ้ำ
do $$
declare cand text; conflict text; miss text; act text;
begin
  -- ตารางที่ "ชื่อคล้าย" — แจ้งให้ทราบเฉย ๆ ไม่บล็อก
  select string_agg(table_name, ', ' order by table_name) into cand
    from information_schema.tables
   where table_schema='public' and table_name <> 'attendance_corrections'
     and (table_name ilike '%correct%' or table_name ilike '%amend%'
          or table_name ilike 'time\_edit%' or table_name ilike 'att\_edit%');
  if cand is not null then
    raise notice 'พบตารางชื่อคล้าย (ตรวจคอลัมน์ต่อ): [%]', cand;
  end if;

  -- ของซ้ำจริง = ต้องเป็น "ตารางคำขอ" ไม่ใช่ตารางลงเวลาเอง
  --   เงื่อนไข: มี work_date + มีคอลัมน์ที่มีเฉพาะในใบคำขอ (requested_* หรือ attendance_id)
  --   ตาราง attendance ตัวจริงถูกกันออกไว้ชัดเจน ไม่งั้นจะบล็อกตัวเอง
  select string_agg(t.table_name, ', ' order by t.table_name) into conflict
    from information_schema.tables t
   where t.table_schema='public'
     and t.table_name not in ('attendance','attendance_corrections')
     and (t.table_name ilike '%correct%' or t.table_name ilike '%amend%'
          or t.table_name ilike 'time\_edit%' or t.table_name ilike 'att\_edit%'
          or t.table_name ilike '%attendance%')
     and exists (select 1 from information_schema.columns c
                  where c.table_schema='public' and c.table_name = t.table_name
                    and c.column_name = 'work_date')
     and exists (select 1 from information_schema.columns c
                  where c.table_schema='public' and c.table_name = t.table_name
                    and c.column_name in ('requested_check_in','requested_check_out','attendance_id'));
  if conflict is not null then
    raise exception 'PREFLIGHT: พบตารางคำขอแก้เวลาของจริงอยู่แล้ว [%] — หยุดเพื่อไม่ให้สร้างซ้ำ ส่งโครงสร้างกลับมาก่อน', conflict;
  end if;

  if to_regclass('public.attendance') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง attendance';
  end if;
  select string_agg(c, ', ') into miss from unnest(array[
    'employee_id','work_date','check_in','check_out','status']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='attendance' and column_name=c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns where table_schema='public' and table_name='attendance';
    raise exception 'PREFLIGHT: attendance ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;
  raise notice 'PREFLIGHT ผ่าน · attendance % แถว', (select count(*) from public.attendance);
end $$;


-- ─── 1) ตาราง ───────────────────────────────────────────────
create table if not exists public.attendance_corrections (
  id                   uuid primary key default gen_random_uuid(),
  employee_id          uuid not null references public.employees(id) on delete cascade,
  attendance_id        uuid,                       -- อ้างอิงแถว attendance ถ้ามี id
  work_date            date not null,
  original_check_in    timestamptz,
  original_check_out   timestamptz,
  requested_check_in   timestamptz,
  requested_check_out  timestamptz,
  applied_check_in     timestamptz,                -- ค่าที่ถูกเขียนลง attendance จริงตอนอนุมัติ
  applied_check_out    timestamptz,
  reason               text not null,
  attachment_name      text,
  attachment_path      text,
  attachment_mime      text,
  attachment_size      bigint,
  status               text not null default 'PENDING',
  submitted_at         timestamptz,
  approved_at          timestamptz,
  approved_by          text,
  rejection_reason     text,
  cancelled_at         timestamptz,
  created_by           text,
  created_at           timestamptz not null default now(),
  updated_by           text,
  updated_at           timestamptz not null default now()
);
alter table public.attendance_corrections enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_attc_status_chk') then
    alter table public.attendance_corrections add constraint njhr_attc_status_chk
      check (status in ('DRAFT','PENDING','APPROVED','REJECTED','CANCELLED'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_attc_need_time_chk') then
    alter table public.attendance_corrections add constraint njhr_attc_need_time_chk
      check (requested_check_in is not null or requested_check_out is not null);
  end if;
end $$;

create index if not exists njhr_attc_emp_idx
  on public.attendance_corrections (employee_id, work_date desc);
create index if not exists njhr_attc_status_idx
  on public.attendance_corrections (status, submitted_at desc);
-- กันยื่นซ้ำวันเดียวกัน เฉพาะใบที่ยังไม่จบเรื่อง
create unique index if not exists njhr_attc_open_uidx
  on public.attendance_corrections (employee_id, work_date)
  where status in ('DRAFT','PENDING');

comment on table public.attendance_corrections is
  'คำขอแก้ไขเวลาเข้า-ออก — attendance จริงจะถูกแก้เมื่ออนุมัติเท่านั้น ผ่าน njhr_att_correction_approve';

-- RLS: ไม่เปิด policy ให้ anon → เข้าถึงผ่าน RPC security definer เท่านั้น
do $$
declare pn text;
begin
  for pn in select policyname from pg_policies
             where schemaname='public' and tablename='attendance_corrections'
               and 'anon' = any(roles) and (qual='true' or qual is null)
  loop execute format('drop policy %I on public.attendance_corrections', pn); end loop;
end $$;


-- ─── 2) ตัวตรวจสิทธิ์ ───────────────────────────────────────
create or replace function public.njhr_attc_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid,
               is_manager boolean, can_approve boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER')),
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER'));
end $$;


-- ─── 3) njhr_att_correction_list ────────────────────────────
create or replace function public.njhr_att_correction_list(
  p_token text, p_employee uuid default null, p_status text default null,
  p_from date default null, p_to date default null,
  p_limit int default 200, p_offset int default 0)
returns table (
  id uuid, employee_id uuid, emp_code text, emp_name text, department_name text,
  work_date date, original_check_in timestamptz, original_check_out timestamptz,
  requested_check_in timestamptz, requested_check_out timestamptz,
  reason text, attachment_name text, status text,
  submitted_at timestamptz, approved_at timestamptz, approved_by text,
  rejection_reason text, created_by text, created_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; st text := nullif(upper(btrim(coalesce(p_status,''))),'');
        lim int := least(greatest(coalesce(p_limit,200),1),500);
begin
  select * into c from public.njhr_attc_guard(p_token);
  return query
  select r.id, r.employee_id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.department_name,''),
         r.work_date, r.original_check_in, r.original_check_out,
         r.requested_check_in, r.requested_check_out,
         r.reason, coalesce(r.attachment_name,''), r.status,
         r.submitted_at, r.approved_at, coalesce(r.approved_by,''),
         coalesce(r.rejection_reason,''), coalesce(r.created_by,''), r.created_at,
         count(*) over () as total_count
    from public.attendance_corrections r
    join public.employees e on e.id = r.employee_id
   where (c.is_manager or r.employee_id = c.employee_id)     -- พนักงานเห็นเฉพาะของตนเอง
     and (p_employee is null or r.employee_id = p_employee)
     and (st is null or r.status = st)
     and (p_from is null or r.work_date >= p_from)
     and (p_to   is null or r.work_date <= p_to)
   order by r.submitted_at desc nulls last, r.created_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 4) njhr_att_correction_get ─────────────────────────────
create or replace function public.njhr_att_correction_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record;
begin
  select * into c from public.njhr_attc_guard(p_token);
  select * into r from public.attendance_corrections where attendance_corrections.id = p_id;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if not c.is_manager and r.employee_id is distinct from c.employee_id then
    raise exception 'คุณดูได้เฉพาะคำขอของตนเองเท่านั้น' using errcode='42501';
  end if;
  return query select to_jsonb(r) ||
    jsonb_build_object('emp_code', e.emp_code,
      'emp_name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
      'department_name', coalesce(e.department_name,''))
    from public.employees e where e.id = r.employee_id;
end $$;


-- ─── 5) njhr_att_correction_submit ──────────────────────────
create or replace function public.njhr_att_correction_submit(
  p_token text, p_work_date date,
  p_requested_check_in timestamptz default null,
  p_requested_check_out timestamptz default null,
  p_reason text default null, p_employee uuid default null,
  p_attachment jsonb default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; a record; v_id uuid;
        v_emp uuid; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_attc_guard(p_token);

  -- ยื่นแทนคนอื่นได้เฉพาะผู้ดูแล · พนักงานยื่นได้เฉพาะของตนเอง
  v_emp := coalesce(p_employee, c.employee_id);
  if v_emp is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน จึงยื่นคำขอไม่ได้' using errcode='42501';
  end if;
  if v_emp <> coalesce(c.employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
     and not c.is_manager then
    raise exception 'คุณยื่นคำขอได้เฉพาะของตนเองเท่านั้น' using errcode='42501';
  end if;

  select * into e from public.employees where id = v_emp;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  if p_work_date is null then raise exception 'กรุณาระบุวันที่ต้องการแก้ไข' using errcode='22023'; end if;
  if p_work_date > (now() at time zone 'Asia/Bangkok')::date then
    raise exception 'ยื่นคำขอแก้ไขเวลาของวันในอนาคตไม่ได้' using errcode='22023';
  end if;
  if v_reason is null then raise exception 'กรุณาระบุเหตุผล' using errcode='22023'; end if;
  if p_requested_check_in is null and p_requested_check_out is null then
    raise exception 'กรุณาระบุเวลาเข้าหรือเวลาออกที่ต้องการแก้ไขอย่างน้อย 1 ค่า' using errcode='22023';
  end if;
  if p_requested_check_in is not null and p_requested_check_out is not null
     and p_requested_check_out <= p_requested_check_in then
    raise exception 'เวลาออกต้องหลังเวลาเข้า' using errcode='22023';
  end if;
  if exists (select 1 from public.attendance_corrections r
              where r.employee_id = v_emp and r.work_date = p_work_date
                and r.status in ('DRAFT','PENDING')) then
    raise exception 'มีคำขอแก้ไขเวลาของวันที่ % ที่ยังไม่ถูกพิจารณาอยู่แล้ว',
      to_char(p_work_date,'DD/MM/YYYY') using errcode='23505';
  end if;

  select * into a from public.attendance att
   where att.employee_id = v_emp and att.work_date = p_work_date;

  insert into public.attendance_corrections(
    employee_id, attendance_id, work_date, original_check_in, original_check_out,
    requested_check_in, requested_check_out, reason,
    attachment_name, attachment_path, attachment_mime, attachment_size,
    status, submitted_at, created_by, updated_by)
  values (v_emp, case when a is null then null else a.id end, p_work_date,
          case when a is null then null else a.check_in end,
          case when a is null then null else a.check_out end,
          p_requested_check_in, p_requested_check_out, v_reason,
          nullif(p_attachment->>'name',''), nullif(p_attachment->>'path',''),
          nullif(p_attachment->>'mime',''), nullif(p_attachment->>'size','')::bigint,
          'PENDING', now(), c.username, c.username)
  returning attendance_corrections.id into v_id;

  perform public.njhr_audit_write(p_token, 'ATTC_SUBMIT', 'attendance', 'attendance_corrections',
    v_id::text, e.emp_code || ' ขอแก้ไขเวลา ' || to_char(p_work_date,'DD/MM/YYYY'),
    null, (select to_jsonb(x) from public.attendance_corrections x where x.id = v_id), null);

  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอแก้ไขเวลาใหม่',
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'') ||
         ' ขอแก้ไขเวลาวันที่ ' || to_char(p_work_date,'DD/MM/YYYY'), 'clock'
    from public.app_users u
   where u.app_code = 'salary' and coalesce(u.is_active,true)
     and public.njhr_norm_role(u.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');

  return query select r.id, r.status from public.attendance_corrections r where r.id = v_id;
end $$;


-- ─── 6) njhr_att_correction_cancel ──────────────────────────
create or replace function public.njhr_att_correction_cancel(
  p_token text, p_id uuid, p_reason text default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record;
begin
  select * into c from public.njhr_attc_guard(p_token);
  select * into r from public.attendance_corrections where attendance_corrections.id = p_id;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if not c.is_manager and r.employee_id is distinct from c.employee_id then
    raise exception 'คุณยกเลิกได้เฉพาะคำขอของตนเองเท่านั้น' using errcode='42501';
  end if;
  if r.status not in ('DRAFT','PENDING') then
    raise exception 'คำขอสถานะ "%" ยกเลิกไม่ได้', r.status using errcode='22023';
  end if;

  update public.attendance_corrections
     set status = 'CANCELLED', cancelled_at = now(),
         rejection_reason = nullif(btrim(coalesce(p_reason,'')),''),
         updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  perform public.njhr_audit_write(p_token, 'ATTC_CANCEL', 'attendance', 'attendance_corrections',
    p_id::text, 'ยกเลิกคำขอแก้ไขเวลา ' || to_char(r.work_date,'DD/MM/YYYY'),
    to_jsonb(r), (select to_jsonb(x) from public.attendance_corrections x where x.id = p_id), null);

  return query select x.id, x.status from public.attendance_corrections x where x.id = p_id;
end $$;


-- ─── 7) njhr_att_correction_approve ─────────────────────────
--  อนุมัติ + แก้ attendance จริง อยู่ใน transaction เดียวกัน (ทั้งฟังก์ชันคือ 1 transaction)
create or replace function public.njhr_att_correction_approve(
  p_token text, p_id uuid, p_note text default null)
returns table (id uuid, status text, attendance_updated boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; e record; a record; sh record;
        v_in timestamptz; v_out timestamptz; v_st text; v_late int := 0; v_hours numeric;
begin
  select * into c from public.njhr_attc_guard(p_token);
  if not c.can_approve then
    raise exception 'คุณไม่มีสิทธิ์อนุมัติคำขอแก้ไขเวลา' using errcode='42501';
  end if;

  -- ล็อกแถวกันอนุมัติซ้ำจากสองหน้าจอพร้อมกัน
  select * into r from public.attendance_corrections
   where attendance_corrections.id = p_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ %)', r.status using errcode='22023';
  end if;
  if r.employee_id = c.employee_id then
    raise exception 'อนุมัติคำขอของตนเองไม่ได้' using errcode='42501';
  end if;

  select * into e from public.employees where id = r.employee_id;
  select * into a from public.attendance att
   where att.employee_id = r.employee_id and att.work_date = r.work_date;

  -- ค่าที่จะเขียนจริง: ใช้ค่าที่ขอ ถ้าไม่ได้ขอให้คงค่าเดิม
  v_in  := coalesce(r.requested_check_in,  case when a is null then null else a.check_in  end);
  v_out := coalesce(r.requested_check_out, case when a is null then null else a.check_out end);

  -- คำนวณสถานะสาย/ชั่วโมงงานจากกะจริงของวันนั้น (ตรรกะเดียวกับ 64_attendance.sql)
  select * into sh from public.njhr_shift_at(r.employee_id, r.work_date);
  if v_in is not null and sh.start_time is not null then
    v_late := greatest(0, (extract(epoch from (
                (v_in at time zone 'Asia/Bangkok')::time - sh.start_time)) / 60)::int
              - coalesce(sh.late_allow_minutes,0));
  end if;
  v_st := case when v_in is null then 'ABSENT'
               when v_late > 0 then 'LATE' else 'NORMAL' end;
  v_hours := case when v_in is not null and v_out is not null
                  then round(greatest(0, extract(epoch from (v_out - v_in))/3600
                       - coalesce(sh.break_minutes,0)/60.0)::numeric, 2) end;

  insert into public.attendance (employee_id, work_date, check_in, check_out, status, work_hours)
  values (r.employee_id, r.work_date, v_in, v_out, v_st::public.attendance_status, v_hours)
  on conflict (employee_id, work_date) do update
    set check_in = excluded.check_in, check_out = excluded.check_out,
        status = excluded.status, work_hours = excluded.work_hours;

  update public.attendance_corrections
     set status = 'APPROVED', approved_at = now(), approved_by = c.username,
         applied_check_in = v_in, applied_check_out = v_out,
         rejection_reason = null, updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  perform public.njhr_audit_write(p_token, 'ATTC_APPROVE', 'attendance', 'attendance_corrections',
    p_id::text,
    e.emp_code || ' อนุมัติแก้ไขเวลา ' || to_char(r.work_date,'DD/MM/YYYY') ||
    ' · เดิม ' || coalesce(r.original_check_in::text,'—') || '/' || coalesce(r.original_check_out::text,'—') ||
    ' → ใหม่ ' || coalesce(v_in::text,'—') || '/' || coalesce(v_out::text,'—') ||
    coalesce(' · ' || nullif(btrim(coalesce(p_note,'')),''), ''),
    to_jsonb(r), (select to_jsonb(x) from public.attendance_corrections x where x.id = p_id), null);

  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอแก้ไขเวลาได้รับอนุมัติ',
         'วันที่ ' || to_char(r.work_date,'DD/MM/YYYY') || ' ถูกแก้ไขเรียบร้อยแล้ว', 'check'
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = r.employee_id and coalesce(u.is_active,true);

  return query select x.id, x.status, true from public.attendance_corrections x where x.id = p_id;
end $$;


-- ─── 8) njhr_att_correction_reject ──────────────────────────
create or replace function public.njhr_att_correction_reject(
  p_token text, p_id uuid, p_reason text)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_attc_guard(p_token);
  if not c.can_approve then
    raise exception 'คุณไม่มีสิทธิ์พิจารณาคำขอแก้ไขเวลา' using errcode='42501';
  end if;
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' using errcode='22023';
  end if;

  select * into r from public.attendance_corrections
   where attendance_corrections.id = p_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ %)', r.status using errcode='22023';
  end if;

  -- ไม่แตะ attendance เด็ดขาดเมื่อไม่อนุมัติ
  update public.attendance_corrections
     set status = 'REJECTED', approved_at = now(), approved_by = c.username,
         rejection_reason = v_reason, updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  perform public.njhr_audit_write(p_token, 'ATTC_REJECT', 'attendance', 'attendance_corrections',
    p_id::text, 'ไม่อนุมัติคำขอแก้ไขเวลา ' || to_char(r.work_date,'DD/MM/YYYY') ||
    ' · เหตุผล: ' || v_reason,
    to_jsonb(r), (select to_jsonb(x) from public.attendance_corrections x where x.id = p_id), null);

  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอแก้ไขเวลาไม่ได้รับอนุมัติ',
         'วันที่ ' || to_char(r.work_date,'DD/MM/YYYY') || ' · ' || v_reason, 'ban'
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = r.employee_id and coalesce(u.is_active,true);

  return query select x.id, x.status from public.attendance_corrections x where x.id = p_id;
end $$;


-- ─── 9) GRANT ───────────────────────────────────────────────
revoke execute on function public.njhr_attc_guard(text) from public, anon, authenticated;
grant  execute on function public.njhr_att_correction_list(text,uuid,text,date,date,int,int)                to anon, authenticated;
grant  execute on function public.njhr_att_correction_get(text,uuid)                                        to anon, authenticated;
grant  execute on function public.njhr_att_correction_submit(text,date,timestamptz,timestamptz,text,uuid,jsonb) to anon, authenticated;
grant  execute on function public.njhr_att_correction_cancel(text,uuid,text)                                to anon, authenticated;
grant  execute on function public.njhr_att_correction_approve(text,uuid,text)                               to anon, authenticated;
grant  execute on function public.njhr_att_correction_reject(text,uuid,text)                                to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.3-att-corrections', 'คำขอแก้ไขเวลา: attendance_corrections + 6 RPC · แก้ attendance เมื่ออนุมัติเท่านั้น')
on conflict (version) do nothing;


-- ─── 10) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'table', to_regclass('public.attendance_corrections') is not null,
  'columns', (select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='attendance_corrections'),
  'constraints', (select jsonb_agg(conname order by conname) from pg_constraint con
                    join pg_class r on r.oid=con.conrelid where r.relname='attendance_corrections'),
  'rls_enabled', (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
                   where n.nspname='public' and c.relname='attendance_corrections'),
  'anon_policies', coalesce((select count(*) from pg_policies
                              where schemaname='public' and tablename='attendance_corrections'
                                and 'anon' = any(roles)), 0),
  'functions', (select jsonb_agg(p.proname order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_att\_correction\_%'),
  'rows', (select count(*) from public.attendance_corrections)
)) as install_report;
