-- ============================================================
-- NJ HR V.10 — 75_inspect_legacy_gap.sql   [อ่านอย่างเดียว ไม่แก้ไขอะไรทั้งสิ้น]
--
-- วัตถุประสงค์: ดูโครงสร้างจริงของตารางที่ยังไม่มี RPC รองรับ
-- ก่อนย้ายโมดูลที่ยังใช้ db.* ใน localStorage ขึ้น Supabase
--
-- ⚠ ไฟล์นี้ไม่มีคำสั่ง create / alter / insert / update / delete แม้แต่คำเดียว
--   รันได้ปลอดภัย ไม่กระทบข้อมูล
--
-- วิธีใช้: รันบน Supabase SQL Editor แล้วคัดลอกผลลัพธ์ทั้งก้อนส่งกลับมา
-- ============================================================

select jsonb_pretty(jsonb_build_object(

-- ── 1) ตารางเป้าหมายมีจริงหรือไม่ + จำนวนแถว ─────────────────
'1_tables', (
  select jsonb_object_agg(t, jsonb_build_object(
    'exists', to_regclass('public.'||t) is not null,
    'rows', case when to_regclass('public.'||t) is null then null
                 else (select n_live_tup from pg_stat_user_tables
                        where schemaname='public' and relname=t) end))
  from unnest(array['announcements','system_settings','work_shifts','employee_shifts',
                    'attendance','payroll','payslips','employees','departments',
                    'notifications','audit_log','holidays','leave_requests','ot_requests',
                    'njhr_ot_jobs','app_users','geofence','njhr_geofences']) t),

-- ── 2) คอลัมน์จริงของตารางที่ยังไม่มี RPC รองรับ ─────────────
'2_columns', (
  select jsonb_object_agg(table_name, cols) from (
    select table_name, jsonb_agg(jsonb_build_object(
             'col', column_name, 'type', data_type,
             'null', is_nullable, 'default', column_default)
             order by ordinal_position) cols
      from information_schema.columns
     where table_schema='public'
       and table_name in ('announcements','system_settings','work_shifts',
                          'employee_shifts','attendance','payroll','payslips')
     group by table_name) x),

-- ── 3) มีตารางคำขอแก้ไขเวลา (corrections) อยู่แล้วหรือยัง ────
'3_correction_like_tables', coalesce((
  select jsonb_agg(jsonb_build_object('table', table_name, 'rows',
           (select n_live_tup from pg_stat_user_tables
             where schemaname='public' and relname=table_name)))
    from information_schema.tables
   where table_schema='public'
     and (table_name ilike '%correct%' or table_name ilike '%amend%'
          or table_name ilike '%time_edit%' or table_name ilike '%att_edit%')), '[]'::jsonb),

-- ── 4) system_settings เก็บ key อะไรไว้บ้าง (ไม่แสดงค่า secret) ──
'4_settings_keys', case when to_regclass('public.system_settings') is null then null
  else (select jsonb_agg(jsonb_build_object('key', s.key,
          'value_preview', left(s.value::text, 120)) order by s.key)
          from public.system_settings s) end,

-- ── 5) กะทำงานจริงในระบบ ────────────────────────────────────
'5_work_shifts', case when to_regclass('public.work_shifts') is null then null
  else (select jsonb_agg(to_jsonb(w) order by w.id) from public.work_shifts w) end,
'5_employee_shifts_count', case when to_regclass('public.employee_shifts') is null then null
  else (select count(*) from public.employee_shifts) end,
'5_employees_with_shift', case when to_regclass('public.employee_shifts') is null then null
  else (select count(distinct employee_id) from public.employee_shifts) end,
'5_employees_total', (select count(*) from public.employees),

-- ── 6) ประกาศบริษัท: โครงสร้างและตัวอย่าง 1 แถว ─────────────
'6_announcement_sample', case when to_regclass('public.announcements') is null then null
  else (select to_jsonb(a) from public.announcements a limit 1) end,

-- ── 7) RPC njhr_* ที่มีอยู่จริงทั้งหมด ───────────────────────
'7_existing_rpc', (
  select jsonb_agg(p.proname order by p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'njhr\_%'),

-- ── 8) RLS: ตารางที่เปิด RLS แต่มี policy อนุญาต anon ทั้งตาราง ──
--     (ประเด็นความปลอดภัยที่ต้องปิดควบคู่กับการย้ายข้อมูล)
'8_open_anon_policies', coalesce((
  select jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname,
           'cmd', cmd, 'using', qual, 'roles', roles))
    from pg_policies
   where schemaname='public'
     and (qual = 'true' or qual is null)
     and 'anon' = any(roles)), '[]'::jsonb),

'9_rls_disabled_tables', coalesce((
  select jsonb_agg(c.relname order by c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r' and not c.relrowsecurity), '[]'::jsonb),

'10_schema_versions', (select jsonb_agg(version order by version)
                         from public.njhr_schema_version)

)) as inspect_report;
