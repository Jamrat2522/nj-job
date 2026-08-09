-- ============================================================
-- NJ HR V.10 — 81_verify_backend.sql   [อ่านอย่างเดียว 100%]
--
-- ตรวจว่าไฟล์ 76 · 77 · 78 · 79 · 80 ถูกรันสำเร็จจริงหรือยัง
-- รันไฟล์นี้ไฟล์เดียว แล้วส่งผลทั้งก้อนกลับมา
-- ผมจะใช้ผลนี้ยืนยัน signature ของ RPC ทุกตัวก่อนเริ่มแก้ Frontend
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete / drop แม้แต่คำเดียว
-- ============================================================

select jsonb_pretty(jsonb_build_object(

-- ── 1) เวอร์ชันที่ติดตั้งสำเร็จแล้ว ──────────────────────────
'1_schema_versions', (select jsonb_agg(jsonb_build_object('v', version, 'note', note)
                                order by version) from public.njhr_schema_version),
'1_expected', jsonb_build_array(
  'v13.0-shift-rpc', 'v13.1-announcements', 'v13.2-system-settings',
  'v13.3-att-corrections', 'v13.4-dashboard'),

-- ── 2) RPC ใหม่ครบไหม + signature จริง (สำคัญที่สุด) ─────────
--     ผมต้องเห็น argument list ของจริงก่อนเขียนโค้ดเรียก
'2_new_rpc', coalesce((
  select jsonb_agg(jsonb_build_object(
           'name', p.proname,
           'args', pg_get_function_arguments(p.oid),
           'returns', pg_get_function_result(p.oid))
           order by p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (p.proname like 'njhr\_shift\_%'
       or p.proname like 'njhr\_announcement\_%'
       or p.proname like 'njhr\_setting\_%'
       or p.proname like 'njhr\_att\_correction\_%'
       or p.proname like 'njhr\_dashboard\_%')), '[]'::jsonb),

-- ── 3) ตารางที่ควรมีหลังรันครบ ──────────────────────────────
'3_tables', (
  select jsonb_object_agg(t, jsonb_build_object(
    'exists', to_regclass('public.'||t) is not null,
    'rows', (select n_live_tup from pg_stat_user_tables
              where schemaname='public' and relname = t)))
  from unnest(array['work_shifts','employee_shifts','system_settings',
                    'announcements','attendance_corrections']) t),

-- ── 4) คอลัมน์ที่ 76 / 78 เพิ่มเข้าไป (ยืนยันว่า alter สำเร็จ) ─
'4_added_columns', jsonb_build_object(
  'work_shifts.is_active', exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='work_shifts' and column_name='is_active'),
  'employee_shifts.status', exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='employee_shifts' and column_name='status'),
  'employee_shifts.assigned_by', exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='employee_shifts' and column_name='assigned_by'),
  'system_settings.category', exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='system_settings' and column_name='category'),
  'system_settings.is_public', exists (select 1 from information_schema.columns
     where table_schema='public' and table_name='system_settings' and column_name='is_public')),

-- ── 5) Index และ Constraint ที่ควรถูกสร้าง ──────────────────
'5_indexes', coalesce((
  select jsonb_agg(indexname order by indexname) from pg_indexes
   where schemaname='public'
     and indexname in ('njhr_ws_active_idx','njhr_attc_emp_idx','njhr_attc_status_idx',
                       'njhr_attc_open_uidx','njhr_setting_cat_idx','njhr_ann_live_idx')), '[]'::jsonb),
'5_constraints', coalesce((
  select jsonb_agg(conname order by conname) from pg_constraint
   where conname in ('njhr_attc_status_chk','njhr_attc_need_time_chk','njhr_ann_priority_chk')), '[]'::jsonb),

-- ── 6) RLS ของตารางใหม่ ─────────────────────────────────────
'6_rls', coalesce((
  select jsonb_agg(jsonb_build_object('table', c.relname, 'rls', c.relrowsecurity))
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname='public'
     and c.relname in ('announcements','attendance_corrections','system_settings',
                       'work_shifts','employee_shifts')), '[]'::jsonb),
'6_anon_open_policies', coalesce((
  select jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname, 'cmd', cmd))
    from pg_policies
   where schemaname='public' and 'anon' = any(roles)
     and (qual = 'true' or qual is null)), '[]'::jsonb),

-- ── 7) สิทธิ์เรียก RPC — guard ต้องไม่เปิดให้ anon ──────────
'7_guard_grants', coalesce((
  select jsonb_agg(jsonb_build_object('name', p.proname,
           'anon_can_execute', has_function_privilege('anon', p.oid, 'EXECUTE'))
           order by p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname in ('njhr_shift_guard','njhr_ann_guard','njhr_setting_guard',
                       'njhr_attc_guard','njhr_dashboard_announcements',
                       'njhr_empfile_access','njhr_empfile_upload_path')), '[]'::jsonb),

-- ── 8) ข้อมูลจริงที่ Frontend จะได้เห็น (ใช้ตรวจตอนต่อ UI) ───
'8_data_snapshot', jsonb_build_object(
  'work_shifts', coalesce((select jsonb_agg(jsonb_build_object(
       'shift_name', w.shift_name,
       'time', w.start_time::text || '–' || w.end_time::text) order by w.shift_name)
       from public.work_shifts w), '[]'::jsonb),
  'employees_active', (select count(*) from public.employees where status::text='ACTIVE'),
  'employees_probation', (select count(*) from public.employees where status::text='PROBATION'),
  'employees_with_shift', (select count(distinct employee_id) from public.employee_shifts),
  'setting_keys', coalesce((select jsonb_agg(s.key order by s.key)
                              from public.system_settings s), '[]'::jsonb)),

-- ── 9) สถานะเรื่องประกาศ (ยังค้างรอ 77a) ────────────────────
'9_announcement_status', jsonb_build_object(
  'njhr_announcements_created', to_regclass('public.announcements') is not null,
  'existing_other_tables', coalesce((
    select jsonb_agg(table_name order by table_name) from information_schema.tables
     where table_schema='public'
       and (table_name ilike '%announce%' or table_name ilike '%notice%')), '[]'::jsonb))

)) as verify_report;
