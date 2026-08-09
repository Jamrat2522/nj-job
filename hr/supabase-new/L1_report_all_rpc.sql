-- ============================================================
-- NJ HR V2 — L1_report_all_rpc.sql
-- RPC เฉพาะ REPORT ALL — แก้ 2 ต้นเหตุพร้อมกัน
--   1) njhr_emp_list clamp p_limit ไว้ที่ 100 (48_employees.sql บรรทัด 92)
--      → REPORT ALL ได้พนักงานไม่ครบ และ attendance/leave/OT ของคนที่ 101+ ถูกทิ้ง
--   2) njhr_emp_list ไม่ส่ง base_salary / allowance ออกมาเลย
--      → rpCollect เขียน Number(e.base_salary) || 0 จึงได้ 0 เสมอ ทั้งที่ข้อมูลมีอยู่จริง
--
-- ยืนยันจากฐานข้อมูลจริงก่อนเขียนไฟล์นี้:
--   employees มีคอลัมน์ : salary_type · base_salary · position_allow · diligence_allow
--                         phone_allow · travel_allow · fuel_allow
--   njhr_pay_items code : POSITION_ALLOW · FUEL_ALLOW · PHONE_ALLOW · DILIGENCE · SHIFT_ALLOW
--                         OT · OTHER_EARN · BONUS · COMMISSION · ALLOWANCE (EARNING)
--                         SSO · STUDENT_LOAN · LOAN · COOP · OTHER_DEDUCT · LATE
--                         ABSENT · LEAVE_PERSONAL · LEAVE_SICK · TAX (DEDUCTION)
--   พนักงาน ACTIVE + PROBATION = 105 คน
--
-- ไฟล์นี้:
--   · ไม่แก้ Schema · ไม่สร้างตาราง · ไม่แก้ RPC เดิมแม้แต่ตัวเดียว
--   · เพิ่ม RPC ใหม่ 1 ตัวที่ REPORT ALL ใช้ตัวเดียว ไม่มีหน้าอื่นเรียก
--   · สิทธิ์: ใช้ njhr_emp_guard เดิม และบังคับ role ที่เห็นเงินเดือนได้เท่านั้น
--
-- ต้องรัน 42 · 48 · 51 มาก่อน · รันซ้ำได้
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 0) PREFLIGHT — ไม่ผ่านให้หยุด ยังไม่สร้างอะไร
-- ════════════════════════════════════════════════════════════
do $$
declare miss text; act text;
begin
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employees';
  end if;

  -- คอลัมน์เงินเดือนที่ไฟล์นี้อ่าน ต้องมีจริงทุกตัว
  select string_agg(c, ', ') into miss from unnest(array[
    'id','emp_code','prefix','first_name','last_name','nickname','department_name',
    'position_name','start_date','status','base_salary','position_allow',
    'diligence_allow','phone_allow','travel_allow','fuel_allow']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employees'
                        and column_name = c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='employees';
    raise exception 'PREFLIGHT: employees ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard';
  end if;

  raise notice 'PREFLIGHT ผ่าน · employees % คน (ACTIVE+PROBATION)',
    (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION'));
end $$;


-- ════════════════════════════════════════════════════════════
-- 1) njhr_report_all_employees — พนักงานทั้งหมดพร้อมฐานเงินเดือน
--    ไม่มีเพดาน 100 · คืนครบทุกคนที่เข้าเงื่อนไขในคำขอเดียว
--    ใช้เฉพาะ REPORT ALL — หน้าอื่นยังใช้ njhr_emp_list เดิมไม่เปลี่ยน
-- ════════════════════════════════════════════════════════════
create or replace function public.njhr_report_all_employees(
  p_token text, p_dept text default null, p_employee uuid default null)
returns table (
  id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, start_date date, status text,
  salary_type text, base_salary numeric, position_allow numeric,
  diligence_allow numeric, phone_allow numeric, travel_allow numeric, fuel_allow numeric,
  total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  -- ใช้ตัวตรวจสิทธิ์เดิมของโมดูลพนักงาน · คอลัมน์เงินเดือนเปิดเฉพาะ role ที่เกี่ยวข้อง
  select * into c from public.njhr_emp_guard(p_token, false);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลเงินเดือนใน REPORT ALL' using errcode='42501';
  end if;

  return query
  with base as (
    select e.*
      from public.employees e
     where e.status::text in ('ACTIVE','PROBATION')
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_employee is null or e.id = p_employee)
  )
  select b.id, b.emp_code,
         coalesce(b.prefix,'') || b.first_name || ' ' || coalesce(b.last_name,''),
         coalesce(b.nickname,''), coalesce(b.department_name,''),
         coalesce(b.position_name,''), b.start_date, b.status::text,
         coalesce(b.salary_type,''),
         coalesce(b.base_salary,0), coalesce(b.position_allow,0),
         coalesce(b.diligence_allow,0), coalesce(b.phone_allow,0),
         coalesce(b.travel_allow,0), coalesce(b.fuel_allow,0),
         (select count(*) from base)
    from base b
   order by b.emp_code;                      -- รหัสพนักงานน้อย → มาก ตามแบบ
end $$;

grant execute on function public.njhr_report_all_employees(text, text, uuid) to anon, authenticated;

comment on function public.njhr_report_all_employees(text, text, uuid) is
  'REPORT ALL — พนักงานทั้งหมดพร้อมฐานเงินเดือน ไม่มีเพดาน 100 คน (njhr_emp_list ยังใช้ของเดิม)';


insert into public.njhr_schema_version(version, note)
values ('v2.6-report-all-rpc',
        'njhr_report_all_employees — REPORT ALL ไม่ติดเพดาน 100 คน และได้ฐานเงินเดือนจริง')
on conflict (version) do nothing;


-- ════════════════════════════════════════════════════════════
-- 2) VERIFICATION — เทียบกับ njhr_emp_list เดิมให้เห็นส่วนต่างชัด ๆ
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'employees_active_probation',
    (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
  'report_all_rpc_returns',
    (select count(*) from public.employees e
      where e.status::text in ('ACTIVE','PROBATION')),   -- ตรรกะเดียวกับใน RPC
  'njhr_emp_list_hard_cap', 100,
  'employees_lost_before_fix',
    greatest((select count(*) from public.employees
               where status::text in ('ACTIVE','PROBATION')) - 100, 0),
  'salary_data_present', jsonb_build_object(
    'base_salary_gt0',      (select count(*) from public.employees where coalesce(base_salary,0)      > 0),
    'position_allow_gt0',   (select count(*) from public.employees where coalesce(position_allow,0)   > 0),
    'fuel_allow_gt0',       (select count(*) from public.employees where coalesce(fuel_allow,0)       > 0),
    'phone_allow_gt0',      (select count(*) from public.employees where coalesce(phone_allow,0)      > 0),
    'diligence_allow_gt0',  (select count(*) from public.employees where coalesce(diligence_allow,0)  > 0),
    'travel_allow_gt0',     (select count(*) from public.employees where coalesce(travel_allow,0)     > 0)),
  'pay_item_codes_by_kind', (select jsonb_object_agg(kind, codes) from
    (select kind, jsonb_agg(code order by code) as codes
       from public.njhr_pay_items where active group by kind) x),
  'sample_3_employees', (select jsonb_agg(jsonb_build_object(
      'emp_code', s.emp_code, 'full_name', s.full_name,
      'base_salary', s.base_salary, 'position_allow', s.position_allow,
      'fuel_allow', s.fuel_allow, 'phone_allow', s.phone_allow,
      'diligence_allow', s.diligence_allow) order by s.emp_code)
    from (select e.emp_code,
                 coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'') as full_name,
                 coalesce(e.base_salary,0) base_salary, coalesce(e.position_allow,0) position_allow,
                 coalesce(e.fuel_allow,0) fuel_allow, coalesce(e.phone_allow,0) phone_allow,
                 coalesce(e.diligence_allow,0) diligence_allow
            from public.employees e
           where e.status::text in ('ACTIVE','PROBATION')
           order by e.emp_code limit 3) s)
)) as l1_verification;
