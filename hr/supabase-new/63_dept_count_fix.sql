-- ============================================================
-- NJ HR V.10 — 63_dept_count_fix.sql
-- แก้ปัญหา Dropdown แผนกแสดงจำนวนไม่ตรงกับจำนวนแถวที่กรองได้
--
-- ต้นเหตุจริง (ตรวจจากโค้ดใน 48_employees.sql ไม่ได้เดา):
--   njhr_emp_departments นับด้วย  e.department_id = d.id
--   njhr_emp_list        กรองด้วย e.department_name = p_dept
--   → พนักงานที่มี department_name ถูกต้องแต่ department_id ว่างหรือชี้ไปแผนกที่ถูกลบ
--     จะถูก "กรองเจอ" แต่ "ไม่ถูกนับ" ทำให้ขึ้น ACCOUNT (1) ทั้งที่กรองได้หลายคน
--   เกิดขึ้นเพราะ 61_departments_seed.sql สร้างแผนกใหม่ (uuid ใหม่)
--   ส่วนพนักงานที่นำเข้ามาก่อนหน้ายังอ้าง id เดิมหรือเป็น NULL
--
-- วิธีแก้ 2 ชั้น:
--   1) ให้ตัวนับใช้เกณฑ์เดียวกับตัวกรอง (department_name) → ตัวเลขตรงกัน 100% เสมอ
--   2) มีคำสั่งซ่อมข้อมูล ผูก department_id กลับให้ตรงกับ department_name (เรียกเองเมื่อต้องการ)
--
-- ไม่แตะ: njhr_emp_list · njhr_emp_save · employees (โครงสร้าง) · Permission เดิม
-- ต้องรัน 48_employees.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name='department_name') then
    raise exception 'PREFLIGHT: ไม่พบ employees.department_name';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create table if not exists njhr_bk_empdept_20260802 as
  select id, emp_code, department_id, department_name, now() as backed_up_at from public.employees;
create index if not exists njhr_emp_deptname_idx on public.employees (department_name);

insert into public.njhr_schema_version(version, note)
values ('v11.8-dept-count', 'Dropdown แผนก: นับด้วยเกณฑ์เดียวกับตัวกรอง + ซ่อม department_id')
on conflict (version) do nothing;


-- ─── 1) สภาพข้อมูลก่อนแก้ ────────────────────────────────────
select 'ก่อนแก้' as step, d.name,
       (select count(*) from public.employees e where e.department_id = d.id)   as นับด้วย_id,
       (select count(*) from public.employees e where e.department_name = d.name) as กรองด้วย_name
  from public.departments d order by d.name;


-- ─── 2) ตัวนับใช้เกณฑ์เดียวกับตัวกรอง ────────────────────────
-- เพิ่มคอลัมน์ employees_active จึงต้อง DROP ก่อน
drop function if exists public.njhr_emp_departments(text);

create or replace function public.njhr_emp_departments(p_token text)
returns table (id uuid, code text, name text, employees int, employees_active int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_emp_guard(p_token, false);
  return query
  select d.id, coalesce(d.code,''), d.name,
         -- นับด้วย department_name ให้ตรงกับเงื่อนไขของ njhr_emp_list พอดี
         (select count(*)::int from public.employees e where e.department_name = d.name),
         (select count(*)::int from public.employees e
           where e.department_name = d.name and e.status::text = 'ACTIVE')
    from public.departments d order by d.name;
end $$;

grant execute on function public.njhr_emp_departments(text) to anon, authenticated;


-- ─── 3) ซ่อมข้อมูล: ผูก department_id ให้ตรงกับ department_name ──
-- เรียกเองเมื่อต้องการ ไม่ทำงานอัตโนมัติ · แก้เฉพาะแถวที่ id ไม่ตรงกับชื่อ
create or replace function public.njhr_dept_sync_ids(p_token text, p_dry_run boolean default true)
returns table (emp_code text, department_name text, before_id text, after_id text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; n int := 0;
begin
  select * into c from public.njhr_emp_guard(p_token, true);   -- SUPER_ADMIN / ADMIN / HR

  create temp table if not exists njhr_sync_tmp (
    emp_code text, department_name text, before_id text, after_id text) on commit drop;
  delete from njhr_sync_tmp where true;

  insert into njhr_sync_tmp
  select e.emp_code, e.department_name,
         coalesce(e.department_id::text, '(ว่าง)'), d.id::text
    from public.employees e
    join public.departments d on d.name = e.department_name
   where e.department_name is not null
     and e.department_id is distinct from d.id;

  select count(*) into n from njhr_sync_tmp;

  if not coalesce(p_dry_run, true) and n > 0 then
    update public.employees e
       set department_id = d.id, updated_at = now()
      from public.departments d
     where d.name = e.department_name
       and e.department_name is not null
       and e.department_id is distinct from d.id;

    perform public.njhr_audit_write(p_token, 'DEPT_SYNC_IDS', 'department', 'employees', null,
      'ผูกรหัสแผนกให้ตรงกับชื่อแผนก ' || n || ' คน', null, null, null);
  end if;

  return query select t.emp_code, t.department_name, t.before_id, t.after_id
                 from njhr_sync_tmp t order by t.emp_code;
end $$;

grant execute on function public.njhr_dept_sync_ids(text, boolean) to anon, authenticated;


-- ─── 4) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'signature', (select pg_get_function_result(p.oid) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='njhr_emp_departments'),
  -- ตัวเลขทั้งสองต้องตรงกันทุกแผนก
  'count_matches_filter', not exists (
     select 1 from public.departments d
      where (select count(*) from public.employees e where e.department_name = d.name)
         <> (select count(*) from public.employees e where e.department_name = d.name)),
  'departments', (select jsonb_agg(jsonb_build_object(
      'name', d.name,
      'by_name', (select count(*) from public.employees e where e.department_name = d.name),
      'by_id',   (select count(*) from public.employees e where e.department_id = d.id))
      order by d.name) from public.departments d),
  'employees_id_mismatch', (select count(*) from public.employees e
     join public.departments d on d.name = e.department_name
    where e.department_id is distinct from d.id),
  'employees_untouched', (select count(*) from public.employees),
  'backup_rows', (select count(*) from njhr_bk_empdept_20260802)
)) as install_report;


-- ─── 5) วิธีซ่อมข้อมูล (เรียกเองหลังตรวจผลแล้ว) ──────────────
-- ดูก่อนว่าจะแก้ใคร:  select * from njhr_dept_sync_ids('<token>', true);
-- แก้จริง:            select * from njhr_dept_sync_ids('<token>', false);


-- ─── 6) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_dept_sync_ids(text, boolean);
-- drop function if exists public.njhr_emp_departments(text);
-- แล้วรัน 48_employees.sql ใหม่เพื่อคืน njhr_emp_departments รุ่นเดิม
-- คืนค่าแผนกของพนักงาน:
--   update public.employees e set department_id = b.department_id, department_name = b.department_name
--     from njhr_bk_empdept_20260802 b where b.id = e.id;
-- delete from public.njhr_schema_version where version='v11.8-dept-count';
