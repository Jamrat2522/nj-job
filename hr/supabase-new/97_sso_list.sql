-- ============================================================
-- NJ HR V.10 — 97_sso_list.sql
-- หน้าประกันสังคม: รายชื่อพนักงานจริงจากตาราง employees พร้อมฐานเงินเดือน
--
-- ปัญหาเดิม: viewSSO ใน app.js อ่าน db.employees จาก localStorage ทั้งหมด
--            จึงเห็นชื่อและรหัสจำลอง (เช่น NJ-001) ที่ไม่มีในทะเบียนพนักงานจริง
--
-- RPC นี้คืน "ข้อมูลตัวตน + ฐานเงินเดือน" เท่านั้น
--   ไม่คำนวณเงินสมทบให้ เพื่อไม่แตะสูตรเดิมของระบบ (1,650–15,000 · ลูกจ้าง 5% · นายจ้าง 5%)
--   หน้าเว็บยังคำนวณด้วยสูตรเดิมทุกบรรทัด
--
-- สิทธิ์: ใช้ njhr_emp_guard เดิม — เห็นเงินเดือนได้เฉพาะ Role ที่มี can_salary
--         (SUPER_ADMIN / ADMIN / ACCOUNT) คนอื่นเรียกแล้วถูกปฏิเสธ
--
-- ต้องรัน 48_employees.sql มาก่อน · รันซ้ำได้ · อ่านอย่างเดียว ไม่เขียนข้อมูลใด
-- ============================================================

do $$
begin
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employees';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name='base_salary') then
    raise exception 'PREFLIGHT: employees ไม่มีคอลัมน์ base_salary';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · พนักงานปฏิบัติงาน % คน',
    (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION'));
end $$;


create or replace function public.njhr_sso_list(
  p_token text, p_q text default null, p_dept text default null)
returns table (employee_id uuid, emp_code text, full_name text, nickname text,
               department_name text, position_name text, emp_status text,
               base_salary numeric, sso_no text, start_date date)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        has_sso boolean;
begin
  select * into c from public.njhr_emp_guard(p_token);
  if not c.can_salary then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลเงินสมทบประกันสังคม' using errcode='42501';
  end if;

  -- เลขประกันสังคมมีเฉพาะบางสคีมา จึงตรวจก่อนแล้วค่อยอ่าน
  select exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees'
                    and column_name='social_security_no') into has_sso;

  return query execute format($f$
    select e.id, e.emp_code,
           coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
           coalesce(e.nickname,''), coalesce(e.department_name,''),
           coalesce(e.position_name,''), e.status::text,
           coalesce(e.base_salary, 0)::numeric,
           %s, e.start_date
      from public.employees e
     where e.status::text in ('ACTIVE','PROBATION')
       and (%L = '' or lower(coalesce(e.emp_code,'')) like '%%'||%L||'%%'
            or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%%'||%L||'%%'
            or lower(coalesce(e.nickname,'')) like '%%'||%L||'%%'
            or lower(coalesce(e.department_name,'')) like '%%'||%L||'%%')
       and (%L is null or %L = '' or e.department_name = %L)
     order by e.emp_code
  $f$, case when has_sso then 'coalesce(e.social_security_no,'''')' else '''''::text' end,
       q, q, q, q, q, p_dept, p_dept, p_dept);
end $$;

grant execute on function public.njhr_sso_list(text,text,text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.5-sso-list', 'หน้าประกันสังคม: รายชื่อพนักงานจริง + ฐานเงินเดือนจาก employees')
on conflict (version) do nothing;


-- ─── VERIFICATION ───────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function', (select jsonb_build_object('name', p.proname, 'args', pg_get_function_arguments(p.oid))
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='njhr_sso_list'),
  'employees_active', (select count(*) from public.employees
                        where status::text in ('ACTIVE','PROBATION')),
  'with_base_salary', (select count(*) from public.employees
                        where status::text in ('ACTIVE','PROBATION')
                          and coalesce(base_salary,0) > 0),
  'has_social_security_no_column', exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='employees' and column_name='social_security_no')
)) as install_report;
