-- ============================================================
-- F2_inspect_correction_rpc.sql
-- อ่าน RPC "ลงชื่อย้อนหลัง" ที่มีอยู่แล้วบน Production + ตัวจัดเส้นทาง Workflow
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--
-- ทำไมต้องมีรอบนี้:
--   F1 บล็อก 6b พบว่ามี njhr_att_correction_approve(p_token, p_id, p_note) อยู่แล้ว
--   และเขียนลง attendance ได้จริง → แปลว่าระบบหลังบ้านมีอยู่แล้ว
--   ต้องอ่าน Signature และ Body ของทั้งชุดก่อน ห้ามสร้างซ้ำ
--
--   njhr_wf_route(p_token, p_type, p_employee) → (ok, reason, data)
--   คือตัวจัดเส้นทางกลางที่ต้องใช้ ห้าม Hard-code ผู้อนุมัติ
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON กลับมา
-- ============================================================

with

-- ─── 1) RPC ทั้งหมดที่แตะ attendance_corrections ────────────
--     **ชี้ขาด** ว่ามีอะไรให้ใช้ต่อบ้าง ไม่ต้องสร้างใหม่
b1 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function',  p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns',   pg_get_function_result(p.oid),
           'security_definer', p.prosecdef,
           'reads',  pg_get_functiondef(p.oid) ~* 'from\s+(public\.)?attendance_corrections\y',
           'writes', pg_get_functiondef(p.oid) ~* '(insert into|update|delete from)\s+(public\.)?attendance_corrections\y',
           'uses_wf_route',   pg_get_functiondef(p.oid) ilike '%njhr_wf_route%',
           'uses_wf_resolve', pg_get_functiondef(p.oid) ilike '%njhr_wf_resolve%',
           'uses_wf_steps',   pg_get_functiondef(p.oid) ilike '%njhr_approval_step%',
           'writes_attendance', pg_get_functiondef(p.oid) ~* '(insert into|update)\s+(public\.)?attendance\y')
         order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
     and pg_get_functiondef(p.oid) ~* 'attendance_corrections\y'),

-- ─── 2) Source เต็มของชุด correction ────────────────────────
b2 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname, 'source', pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
     and p.proname like 'njhr_att_correction%'),

-- ─── 3) Source ของตัวจัดเส้นทาง Workflow ────────────────────
--     ต้องอ่านกฎ Priority/Matching เดิม ห้ามสร้างกฎใหม่
b3 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname, 'source', pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('njhr_wf_route','njhr_wf_resolve')),

-- ─── 4) Source ของ trigger ที่แตกประเภทลงตารางลูก ───────────
--     ถ้าเพิ่มประเภทที่ 4 ต้องไม่ทำของเดิมพัง
b4 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname, 'source', pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('njhr_wf_depts_sync','njhr_wf_depts_follow_dept')),

-- ─── 5) CHECK ของตารางลูก Workflow ──────────────────────────
b5 as (
  select jsonb_build_object(
    'workflow_depts', (select coalesce(jsonb_agg(jsonb_build_object(
                         'name', con.conname, 'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
                         from pg_constraint con
                        where con.conrelid='public.njhr_approval_workflow_depts'::regclass),
    'workflow_emps',  (select coalesce(jsonb_agg(jsonb_build_object(
                         'name', con.conname, 'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
                         from pg_constraint con
                        where con.conrelid='public.njhr_approval_workflow_emps'::regclass),
    'steps',          (select coalesce(jsonb_agg(jsonb_build_object(
                         'name', con.conname, 'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
                         from pg_constraint con
                        where con.conrelid='public.njhr_approval_steps'::regclass)
  ) as j),

-- ─── 6) ตาราง approval_settings / approval_type_rules ───────
--      F1 พบสองตารางนี้ ต้องรู้ว่าเกี่ยวกับประเภทคำขอหรือไม่
b6 as (
  select jsonb_build_object(
    'approval_settings', (select coalesce(jsonb_agg(jsonb_build_object(
                            'column', c.column_name, 'type', c.data_type) order by c.ordinal_position), '[]'::jsonb)
                            from information_schema.columns c
                           where c.table_schema='public' and c.table_name='approval_settings'),
    'approval_type_rules', (select coalesce(jsonb_agg(jsonb_build_object(
                              'column', c.column_name, 'type', c.data_type) order by c.ordinal_position), '[]'::jsonb)
                              from information_schema.columns c
                             where c.table_schema='public' and c.table_name='approval_type_rules'),
    'approval_type_rules_rows', (select count(*) from public.approval_type_rules),
    'approval_settings_rows',   (select count(*) from public.approval_settings)
  ) as j),

-- ─── 7) สรุปให้ตัดสินใจได้ทันที ─────────────────────────────
b7 as (
  select jsonb_build_object(
    'has_submit',  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                           where n.nspname='public' and p.proname ilike 'njhr_att_correction%'
                             and pg_get_functiondef(p.oid) ~* 'insert into\s+(public\.)?attendance_corrections\y'),
    'has_list',    exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                           where n.nspname='public' and p.proname ilike 'njhr_att_correction%'
                             and pg_get_function_result(p.oid) ilike 'TABLE%'),
    'has_approve', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                           where n.nspname='public' and p.proname='njhr_att_correction_approve'),
    'has_reject',  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                           where n.nspname='public' and p.proname ilike '%correction%reject%'),
    'approve_uses_workflow', (select pg_get_functiondef(p.oid) ilike '%njhr_approval_step%'
                                  or pg_get_functiondef(p.oid) ilike '%njhr_wf_%'
                                from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                               where n.nspname='public' and p.proname='njhr_att_correction_approve' limit 1),
    'correction_rpc_names', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                               from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                              where n.nspname='public' and p.proname ilike '%correction%')
  ) as j)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',            now(),
  '7_SUMMARY',               (select j from b7),
  '1_rpcs_touching_table',   (select j from b1),
  '2_correction_rpc_source', (select j from b2),
  '3_wf_route_source',       (select j from b3),
  '4_wf_trigger_source',     (select j from b4),
  '5_child_table_checks',    (select j from b5),
  '6_approval_setting_tables', (select j from b6)
)) as inspection_report;
