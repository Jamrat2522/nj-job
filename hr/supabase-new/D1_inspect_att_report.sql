-- ============================================================
-- D1_inspect_att_report.sql
-- ตรวจก่อนเพิ่มคอลัมน์ "แผนก" และ Filter "สถานะ" ในรายงานการลงเวลา
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--   รันซ้ำได้ไม่จำกัด · ไม่แตะข้อมูล Production
--
-- ต้องตรวจเพราะ:
--   Prompt ห้ามกำหนดค่า status จาก Prompt เอง ต้องอ่านของจริง
--   Frontend map ไว้ 5 ค่า (NORMAL·LATE·ABSENT·LEAVE·HOLIDAY)
--   ถ้าฐานข้อมูลมีค่าอื่น จะแสดงเป็นรหัสดิบและกรองไม่ได้
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON กลับมา
-- ============================================================

with

-- ─── 1) ชนิดของ attendance.status + ค่าที่เป็นไปได้ทั้งหมด ──
b1 as (
  select jsonb_build_object(
    'column_type', (select jsonb_build_object(
                      'udt_schema', c.udt_schema, 'udt_name', c.udt_name,
                      'data_type', c.data_type, 'nullable', c.is_nullable)
                      from information_schema.columns c
                     where c.table_schema='public' and c.table_name='attendance'
                       and c.column_name='status'),
    'enum_labels', (select coalesce(jsonb_agg(e.enumlabel order by e.enumsortorder), '[]'::jsonb)
                      from pg_enum e
                     where e.enumtypid = (select a.atttypid from pg_attribute a
                                           where a.attrelid='public.attendance'::regclass
                                             and a.attname='status')),
    'check_constraints', (select coalesce(jsonb_agg(pg_get_constraintdef(con.oid)), '[]'::jsonb)
                            from pg_constraint con
                           where con.conrelid='public.attendance'::regclass and con.contype='c')
  ) as j),

-- ─── 2) ค่า status ที่ "มีอยู่จริง" ในข้อมูล ────────────────
--     สำคัญกว่า enum เพราะบอกว่า Dropdown ควรมีตัวเลือกอะไร
b2 as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'rows')::int desc), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'status', a.status::text,
                   'rows', count(*),
                   'first_seen', min(a.work_date),
                   'last_seen',  max(a.work_date)) o
            from public.attendance a
           group by a.status::text) x),

-- ─── 2b) ค่า status ในช่วง 90 วันล่าสุด (ที่ผู้ใช้เห็นจริง) ──
b2b as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'rows')::int desc), '[]'::jsonb) as j
    from (select jsonb_build_object('status', a.status::text, 'rows', count(*)) o
            from public.attendance a
           where a.work_date >= current_date - 90
           group by a.status::text) x),

-- ─── 3) แหล่งของ "แผนก" ที่ njhr_att_report ใช้ ─────────────
--     RPC JOIN employees แล้วอ่าน e.department_name (ไม่ใช่ role/username)
b3 as (
  select jsonb_build_object(
    'source_column', 'public.employees.department_name',
    'column_exists', exists(select 1 from information_schema.columns
                             where table_schema='public' and table_name='employees'
                               and column_name='department_name'),
    'employees_total',        (select count(*) from public.employees),
    'department_name_empty',  (select count(*) from public.employees
                                where coalesce(btrim(department_name),'') = ''),
    'department_id_null',     (select count(*) from public.employees where department_id is null),
    'distinct_departments',   (select count(distinct department_name) from public.employees
                                where coalesce(btrim(department_name),'') <> '')
  ) as j),

-- ─── 3b) รายชื่อแผนกที่มีจริงใน employees ───────────────────
b3b as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'employees')::int desc), '[]'::jsonb) as j
    from (select jsonb_build_object('department', e.department_name, 'employees', count(*)) o
            from public.employees e
           where coalesce(btrim(e.department_name),'') <> ''
           group by e.department_name) x),

-- ─── 4) แถวลงเวลาที่พนักงานไม่มีแผนก → ต้องแสดง "-" ─────────
b4 as (
  select jsonb_build_object(
    'attendance_rows_90d',        (select count(*) from public.attendance
                                    where work_date >= current_date - 90),
    'rows_without_department_90d', (select count(*) from public.attendance a
                                     join public.employees e on e.id = a.employee_id
                                    where a.work_date >= current_date - 90
                                      and coalesce(btrim(e.department_name),'') = '')
  ) as j),

-- ─── 5) Signature ของ RPC ที่รายงานใช้ ──────────────────────
b5 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function',  p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns',   pg_get_function_result(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.proname in ('njhr_att_report','njhr_att_summary','njhr_emp_departments')),

-- ─── 6) ยืนยันว่า RPC คืน department มาให้แล้ว (ไม่ต้อง N+1) ─
b6 as (
  select jsonb_build_object(
    'att_report_returns_department',
      (select pg_get_function_result(p.oid) ilike '%department text%'
         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname='njhr_att_report' limit 1),
    'att_report_returns_status',
      (select pg_get_function_result(p.oid) ilike '%status text%'
         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname='njhr_att_report' limit 1),
    'att_report_has_p_status_param',
      (select pg_get_function_identity_arguments(p.oid) ilike '%p_status%'
         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname='njhr_att_report' limit 1)
  ) as j)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',            now(),
  '1_status_column',         (select j from b1),
  '2_status_values_all',     (select j from b2),
  '2b_status_values_90d',    (select j from b2b),
  '3_department_source',     (select j from b3),
  '3b_departments',          (select j from b3b),
  '4_rows_without_dept',     (select j from b4),
  '5_report_rpcs',           (select j from b5),
  '6_rpc_capability',        (select j from b6),
  'FRONTEND_MAPPED_NOW',     jsonb_build_object(
     'NORMAL','ปกติ','LATE','มาสาย','ABSENT','ขาดงาน','LEAVE','ลา','HOLIDAY','วันหยุด'),
  'ACTION_needed_if_extra_status',
     'ถ้า 2b มีค่าที่ไม่อยู่ใน FRONTEND_MAPPED_NOW ต้องเพิ่ม label ก่อน มิฉะนั้นจะแสดงเป็นรหัสดิบ'
)) as inspection_report;
