-- ============================================================
-- NJ HR V.10 — ตรวจโครงสร้างส่วนที่เหลือทั้งหมด (อ่านอย่างเดียว)
-- ไม่มี create / alter / insert / update / delete / drop ทั้งไฟล์
--
-- จำเป็นก่อนเขียน RPC ของ: ลงเวลา · แก้ไขเวลา · OT · กะทำงาน · เงินเดือน ·
-- สลิป · ตั้งค่าระบบ · วันหยุด · ประกาศ · พื้นที่ลงเวลา · รายงาน
-- เพราะ 7 ตารางนี้ยังไม่เคยถูกตรวจ: work_shifts, employee_shifts, attendance,
-- ot_requests, payroll, payslips, system_settings
--
-- รันครั้งเดียวแล้วส่งผล (ช่องเดียว) กลับมา
-- ============================================================

select jsonb_pretty(jsonb_build_object(

-- (1) รายชื่อตารางทั้งหมดใน public + จำนวนแถวโดยประมาณ (ดูว่ามีตารางอะไรอยู่บ้างจริง ๆ)
'all_tables', (
  select jsonb_agg(jsonb_build_object('t', c.relname, 'rows_est', c.reltuples::bigint,
                                      'rls', c.relrowsecurity)
         order by c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'),

-- (2) คอลัมน์จริงของ 7 ตารางที่ยังไม่เคยตรวจ + ตารางประกอบที่ต้องใช้ร่วม
'columns', (
  select jsonb_object_agg(t, cols) from (
    select c.table_name as t,
           jsonb_agg(jsonb_build_object(
             'col', c.column_name, 'type', c.udt_name,
             'nullable', c.is_nullable, 'default', c.column_default
           ) order by c.ordinal_position) as cols
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name in ('work_shifts','employee_shifts','attendance','ot_requests',
                            'payroll','payslips','system_settings',
                            'announcements','geofence','positions','audit_log',
                            'notifications','leave_types','holidays')
     group by c.table_name
  ) s),

-- (3) enum ทุกตัว (ยืนยันค่าที่ใช้ได้จริงของ attendance_status / payroll_status ฯลฯ)
'enums', (
  select jsonb_object_agg(typname, vals) from (
    select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) as vals
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' group by t.typname
  ) s),

-- (4) PK / FK / UNIQUE / CHECK ของตารางกลุ่มนี้ (ต้องรู้ก่อนเขียน insert/update)
'constraints', (
  select jsonb_agg(jsonb_build_object(
           'table', rel.relname, 'name', con.conname,
           'type', con.contype, 'def', pg_get_constraintdef(con.oid))
         order by rel.relname, con.conname)
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
   where n.nspname = 'public'
     and rel.relname in ('work_shifts','employee_shifts','attendance','ot_requests',
                         'payroll','payslips','system_settings','announcements','geofence')),

-- (5) index ที่มีอยู่ (มีผลกับ pagination / filter ฝั่งเซิร์ฟเวอร์)
'indexes', (
  select jsonb_agg(jsonb_build_object('table', tablename, 'def', indexdef)
         order by tablename, indexname)
    from pg_indexes
   where schemaname = 'public'
     and tablename in ('work_shifts','employee_shifts','attendance','ot_requests',
                       'payroll','payslips','system_settings','announcements','geofence')),

-- (6) จำนวนแถวจริง (นับตรง ไม่ประมาณ) — ยืนยันว่าตารางไหนมีข้อมูลจริงอยู่แล้ว
'counts', (
  select jsonb_object_agg(t, n) from (
    select 'work_shifts' t, (select count(*) from public.work_shifts) n
    union all select 'employee_shifts', (select count(*) from public.employee_shifts)
    union all select 'attendance',      (select count(*) from public.attendance)
    union all select 'ot_requests',     (select count(*) from public.ot_requests)
    union all select 'payroll',         (select count(*) from public.payroll)
    union all select 'payslips',        (select count(*) from public.payslips)
    union all select 'system_settings', (select count(*) from public.system_settings)
    union all select 'holidays',        (select count(*) from public.holidays)
    union all select 'notifications',   (select count(*) from public.notifications)
    union all select 'audit_log',       (select count(*) from public.audit_log)
    union all select 'leave_requests',  (select count(*) from public.leave_requests)
  ) s),

-- (7) ตัวอย่างข้อมูลจริง (จำกัดจำนวน ไม่ดึงคอลัมน์อ่อนไหวเกินจำเป็น)
'work_shifts_rows',     (select jsonb_agg(to_jsonb(x)) from (select * from public.work_shifts) x),
'employee_shifts_rows', (select jsonb_agg(to_jsonb(x)) from (select * from public.employee_shifts limit 3) x),
'attendance_rows',      (select jsonb_agg(to_jsonb(x)) from (select * from public.attendance limit 3) x),
'ot_requests_rows',     (select jsonb_agg(to_jsonb(x)) from (select * from public.ot_requests limit 3) x),
'payroll_rows',         (select jsonb_agg(to_jsonb(x)) from (select * from public.payroll limit 2) x),
'payslips_rows',        (select jsonb_agg(to_jsonb(x)) from (select * from public.payslips limit 2) x),
'system_settings_rows', (select jsonb_agg(to_jsonb(x)) from (select * from public.system_settings limit 20) x),

-- (8) RLS policy ทั้งหมดใน public (ต้องรู้ก่อนแตะ nj_v6_anon_all)
'policies', (
  select jsonb_agg(jsonb_build_object(
           'table', tablename, 'policy', policyname, 'cmd', cmd,
           'roles', roles, 'using', qual, 'check', with_check)
         order by tablename, policyname)
    from pg_policies where schemaname = 'public'),

-- (9) สิทธิ์ที่ anon / authenticated มีต่อ "ตาราง" โดยตรง (ข้อ 19 ของสเปก)
'table_grants_anon', (
  select jsonb_agg(jsonb_build_object('table', table_name, 'grantee', grantee, 'priv', privilege_type)
         order by table_name, privilege_type)
    from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon','authenticated')),

-- (10) ฟังก์ชันทั้งหมดที่มีอยู่ (กันตั้งชื่อชน + รู้ว่า 41 ติดตั้งครบหรือยัง)
'functions', (
  select jsonb_agg(p.proname || '(' || pg_get_function_arguments(p.oid) || ')' order by p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (p.proname like 'njhr\_%' or p.proname like 'current\_%')),

-- (11) Storage bucket + policy (ข้อ 6: ต้องเปลี่ยนเป็น private + signed URL)
'storage_buckets', (select jsonb_agg(jsonb_build_object('id', id, 'public', public)) from storage.buckets),
'storage_policies', (
  select jsonb_agg(jsonb_build_object('policy', policyname, 'cmd', cmd, 'roles', roles,
                                      'using', qual, 'check', with_check) order by policyname)
    from pg_policies where schemaname = 'storage' and tablename = 'objects'),

-- (12) มีตาราง schema version อยู่แล้วหรือยัง
'has_schema_version', (
  select exists(select 1 from information_schema.tables
                 where table_schema='public' and table_name='njhr_schema_version'))

)) as inspect_remaining;
