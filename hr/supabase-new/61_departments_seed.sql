-- ============================================================
-- NJ HR V.10 — 61_departments_seed.sql
-- ตั้งค่าแผนกจริง 9 แผนก จากไฟล์ "เทมเพลตนำเข้าพนักงาน_2ตำแหน่ง.xlsx"
-- และลบแผนกตั้งต้น Finance / Management / Warehouse
--
-- แผนกจริงที่อ่านได้จากไฟล์ (110 คน · ทุกแถวระบุแผนกครบ):
--   ACCOUNT 12 · CUSTOMER SERVICE EXPORT 10 · CUSTOMER SERVICE IMPORT 38
--   MAID 2 · MANAGER 6 · SHIPPING AIRPORT 11 · SHIPPING BKK 6
--   SHIPPING LBK 2 · SHIPPING LCB 23
--
-- ⚠️ ปลอดภัย: ลบแผนกเดิมเฉพาะเมื่อ "ไม่มีพนักงานผูกอยู่" เท่านั้น
--    ถ้ามีพนักงานจะข้ามการลบและแจ้งเตือน ไม่ทำให้ข้อมูลพนักงานกำพร้า
-- ต้องรัน 55_departments.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.departments') is null then raise exception 'PREFLIGHT: ไม่พบตาราง departments'; end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name='department_id') then
    raise exception 'PREFLIGHT: ไม่พบ employees.department_id';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create table if not exists njhr_bk_dept_seed_20260802 as
  select *, now() as backed_up_at from public.departments;


-- ─── 1) สถานะก่อนแก้ ─────────────────────────────────────────
select 'ก่อนแก้' as step, d.name, count(e.id)::int as employees
  from public.departments d
  left join public.employees e on e.department_id = d.id
 group by d.name order by d.name;


-- ─── 2) เพิ่มแผนกจริง 9 แผนก (ไม่เพิ่มซ้ำถ้ามีอยู่แล้ว) ──────
insert into public.departments (name)
select v from unnest(array[
  'ACCOUNT',
  'CUSTOMER SERVICE EXPORT',
  'CUSTOMER SERVICE IMPORT',
  'MAID',
  'MANAGER',
  'SHIPPING AIRPORT',
  'SHIPPING BKK',
  'SHIPPING LBK',
  'SHIPPING LCB'
]) v
where not exists (
  select 1 from public.departments d where lower(btrim(d.name)) = lower(v));


-- ─── 3) ลบแผนกตั้งต้น เฉพาะที่ไม่มีพนักงานผูกอยู่ ────────────
do $$
declare r record; n_del int := 0; n_skip int := 0;
begin
  for r in
    select d.id, d.name, (select count(*) from public.employees e where e.department_id = d.id) as emp
      from public.departments d
     where d.name in ('Finance','Management','Warehouse')
  loop
    if r.emp > 0 then
      n_skip := n_skip + 1;
      raise notice 'ข้ามการลบ "%": ยังมีพนักงาน % คน — ต้องย้ายพนักงานออกก่อน', r.name, r.emp;
    else
      -- ปิดการตั้งค่าอนุมัติที่ผูกกับชื่อแผนกนี้ (ถ้ามี) ก่อนลบ
      if to_regclass('public.njhr_approval_workflows') is not null then
        update public.njhr_approval_workflows
           set deleted_at = now(), active = false, updated_at = now()
         where department = r.name and deleted_at is null;
      end if;
      delete from public.departments where id = r.id;
      n_del := n_del + 1;
      insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail)
      values ('salary', 'migration', 'SYSTEM', 'DEPT_DELETE', 'department', 'departments', r.id::text,
              'ลบแผนกตั้งต้น ' || r.name || ' (ไม่มีพนักงานผูกอยู่)');
    end if;
  end loop;
  raise notice 'ลบแผนกตั้งต้น % แผนก · ข้าม % แผนก', n_del, n_skip;
end $$;


-- ─── 4) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'departments_total', (select count(*) from public.departments),
  'departments', (select jsonb_agg(name order by name) from public.departments),
  'old_seed_left', (select coalesce(jsonb_agg(name order by name), '[]')
                      from public.departments where name in ('Finance','Management','Warehouse')),
  'missing_from_file', (select coalesce(jsonb_agg(v), '[]') from unnest(array[
      'ACCOUNT','CUSTOMER SERVICE EXPORT','CUSTOMER SERVICE IMPORT','MAID','MANAGER',
      'SHIPPING AIRPORT','SHIPPING BKK','SHIPPING LBK','SHIPPING LCB']) v
     where not exists (select 1 from public.departments d where d.name = v)),
  'employees_without_dept', (select count(*) from public.employees
                              where department_id is null and status::text = 'ACTIVE'),
  'backup_rows', (select count(*) from njhr_bk_dept_seed_20260802)
)) as install_report;

select 'หลังแก้' as step, d.name, count(e.id)::int as employees
  from public.departments d
  left join public.employees e on e.department_id = d.id
 group by d.name order by d.name;


-- ─── 5) ROLLBACK ─────────────────────────────────────────────
-- คืนแผนกเดิมทั้งหมด:
--   insert into public.departments (id, code, name, created_at)
--   select id, code, name, created_at from njhr_bk_dept_seed_20260802
--    where not exists (select 1 from public.departments d where d.id = njhr_bk_dept_seed_20260802.id);
-- ลบ 9 แผนกที่เพิ่ง insert (เฉพาะที่ยังไม่มีพนักงาน):
--   delete from public.departments d
--    where d.name in ('ACCOUNT','CUSTOMER SERVICE EXPORT','CUSTOMER SERVICE IMPORT','MAID','MANAGER',
--                     'SHIPPING AIRPORT','SHIPPING BKK','SHIPPING LBK','SHIPPING LCB')
--      and not exists (select 1 from public.employees e where e.department_id = d.id)
--      and not exists (select 1 from njhr_bk_dept_seed_20260802 b where b.id = d.id);
