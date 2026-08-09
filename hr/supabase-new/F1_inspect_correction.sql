-- ============================================================
-- F1_inspect_correction.sql
-- ตรวจก่อนทำระบบ "ลงชื่อย้อนหลัง" + Workflow อนุมัติ
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--
-- ทำไมต้องตรวจ:
--   · พบตาราง attendance_corrections อยู่บน Production แล้ว (จากผลตรวจ B1)
--     ต้องรู้โครงสร้างจริงก่อน ห้ามสร้างตารางซ้ำ
--   · request_type ของ Workflow เป็น CHECK constraint ไม่ใช่ enum
--     ต้องอ่านค่าที่อนุญาตจริงก่อนเพิ่มประเภทที่ 3
--   · ต้องดู RPC ของ LEAVE/OT เพื่อทำตามรูปแบบเดิม ไม่สร้างกฎใหม่
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON กลับมา
-- ============================================================

with

-- ─── 1) ตาราง attendance_corrections มีจริงหรือไม่ + โครงสร้าง ──
b1 as (
  select jsonb_build_object(
    'exists', to_regclass('public.attendance_corrections') is not null,
    'columns', (select coalesce(jsonb_agg(jsonb_build_object(
                  'column', c.column_name, 'type', c.data_type,
                  'nullable', c.is_nullable, 'default', c.column_default)
                order by c.ordinal_position), '[]'::jsonb)
                  from information_schema.columns c
                 where c.table_schema='public' and c.table_name='attendance_corrections'),
    'rows', (select count(*) from public.attendance_corrections)
  ) as j),

-- ─── 1b) Constraint / Index ของตารางนั้น ────────────────────
b1b as (
  select jsonb_build_object(
    'constraints', (select coalesce(jsonb_agg(jsonb_build_object(
                      'name', con.conname, 'type', con.contype,
                      'definition', pg_get_constraintdef(con.oid)) order by con.conname), '[]'::jsonb)
                      from pg_constraint con
                     where con.conrelid = 'public.attendance_corrections'::regclass),
    'indexes', (select coalesce(jsonb_agg(jsonb_build_object(
                  'name', i.relname, 'unique', idx.indisunique,
                  'definition', pg_get_indexdef(idx.indexrelid)) order by i.relname), '[]'::jsonb)
                  from pg_index idx join pg_class i on i.oid = idx.indexrelid
                 where idx.indrelid = 'public.attendance_corrections'::regclass)
  ) as j),

-- ─── 1c) ตารางอื่นที่อาจเกี่ยวกับการแก้ไขเวลา ───────────────
b1c as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', t.table_name,
           'rows', 0) order by t.table_name), '[]'::jsonb) as j
    from information_schema.tables t
   where t.table_schema='public' and t.table_type='BASE TABLE'
     and (t.table_name ilike '%correction%' or t.table_name ilike '%att%fix%'
       or t.table_name ilike '%retro%' or t.table_name ilike '%backdate%')),

-- ─── 2) request_type ของ Workflow — ค่าที่อนุญาตจริง ────────
--     **ชี้ขาด** ว่าต้องเพิ่มค่าใหม่แบบไหน
b2 as (
  select jsonb_build_object(
    'column', (select jsonb_build_object('type', c.data_type, 'udt', c.udt_name,
                                         'nullable', c.is_nullable)
                 from information_schema.columns c
                where c.table_schema='public' and c.table_name='njhr_approval_workflows'
                  and c.column_name='request_type'),
    'check_constraints', (select coalesce(jsonb_agg(jsonb_build_object(
                            'name', con.conname, 'definition', pg_get_constraintdef(con.oid))), '[]'::jsonb)
                            from pg_constraint con
                           where con.conrelid='public.njhr_approval_workflows'::regclass
                             and con.contype='c'
                             and pg_get_constraintdef(con.oid) ilike '%request_type%'),
    'values_in_use', (select coalesce(jsonb_object_agg(t.rt, t.n), '{}'::jsonb)
                        from (select request_type rt, count(*) n
                                from public.njhr_approval_workflows
                               where deleted_at is null group by request_type) t),
    'child_table_check', (select coalesce(jsonb_agg(pg_get_constraintdef(con.oid)), '[]'::jsonb)
                            from pg_constraint con
                           where con.conrelid='public.njhr_approval_workflow_depts'::regclass
                             and con.contype='c')
  ) as j),

-- ─── 2b) Trigger บนตาราง Workflow (BOTH แตกเป็น 2 แถว) ──────
b2b as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', t.tgname, 'table', cl.relname,
           'definition', pg_get_triggerdef(t.oid)) order by t.tgname), '[]'::jsonb) as j
    from pg_trigger t join pg_class cl on cl.oid = t.tgrelid
    join pg_namespace n on n.oid = cl.relnamespace
   where n.nspname='public' and not t.tgisinternal
     and cl.relname in ('njhr_approval_workflows','njhr_approval_workflow_depts',
                        'njhr_approval_steps','njhr_approval_step_approvers')),

-- ─── 3) RPC ของ Workflow — ตัวที่ต้องรองรับประเภทที่ 3 ──────
b3 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns', pg_get_function_result(p.oid),
           'mentions_LEAVE', pg_get_functiondef(p.oid) ilike '%''LEAVE''%',
           'mentions_OT', pg_get_functiondef(p.oid) ilike '%''OT''%',
           'mentions_BOTH', pg_get_functiondef(p.oid) ilike '%''BOTH''%')
         order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'njhr_wf_%'),

-- ─── 4) RPC ของ "ลา" ที่ต้องทำตามรูปแบบ ─────────────────────
--     submit → queue → decide  คือแม่แบบของ Flow ที่ต้องเลียนแบบ
b4 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns', pg_get_function_result(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public'
     and p.proname in ('njhr_leave_submit','njhr_leave_queue','njhr_leave_decide',
                       'njhr_leave_detail','njhr_ot_list','njhr_ot_get')),

-- ─── 4b) Source เต็มของ njhr_leave_submit + _decide ─────────
--      ต้องอ่านเพื่อทำตามกฎ Priority/Matching เดิม ห้ามสร้างกฎใหม่
b4b as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname, 'source', pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname in ('njhr_leave_submit','njhr_leave_decide')),

-- ─── 5) โครงสร้าง leave_requests — แม่แบบของตารางคำขอ ───────
b5 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type, 'nullable', c.is_nullable)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema='public' and c.table_name='leave_requests'),

-- ─── 6) ตาราง attendance — ปลายทางที่จะเขียนหลังอนุมัติ ─────
b6 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type, 'nullable', c.is_nullable,
           'default', c.column_default)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema='public' and c.table_name='attendance'),

-- ─── 6b) Function ที่เขียนลง attendance อยู่แล้ว ────────────
--      หลังอนุมัติต้องใช้ของเดิม ห้ามสร้างสูตรซ้ำ
b6b as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'writes_attendance', pg_get_functiondef(p.oid) ~* '(insert into|update)\s+(public\.)?attendance\y')
         order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f'
     and pg_get_functiondef(p.oid) ~* '(insert into|update)\s+(public\.)?attendance\y'),

-- ─── 7) สถานะที่ระบบใช้กับคำขอ (ลา/OT) ─────────────────────
b7 as (
  select jsonb_build_object(
    'leave_status_values', (select coalesce(jsonb_object_agg(t.s, t.n), '{}'::jsonb)
                              from (select status s, count(*) n from public.leave_requests
                                     group by status) t),
    'leave_status_check', (select coalesce(jsonb_agg(pg_get_constraintdef(con.oid)), '[]'::jsonb)
                             from pg_constraint con
                            where con.conrelid='public.leave_requests'::regclass and con.contype='c')
  ) as j),

-- ─── 8) ตารางประวัติการอนุมัติ (Audit ของ Flow) ─────────────
b8 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', t.table_name) order by t.table_name), '[]'::jsonb) as j
    from information_schema.tables t
   where t.table_schema='public' and t.table_type='BASE TABLE'
     and (t.table_name ilike '%approval%' or t.table_name ilike '%_timeline'
       or t.table_name ilike '%_events'))

select jsonb_pretty(jsonb_build_object(
  'inspected_at',              now(),
  '1_attendance_corrections',  (select j from b1),
  '1b_constraints',            (select j from b1b),
  '1c_related_tables',         (select j from b1c),
  '2_workflow_request_type',   (select j from b2),
  '2b_workflow_triggers',      (select j from b2b),
  '3_workflow_rpcs',           (select j from b3),
  '4_leave_flow_rpcs',         (select j from b4),
  '4b_leave_submit_decide_src',(select j from b4b),
  '5_leave_requests_columns',  (select j from b5),
  '6_attendance_columns',      (select j from b6),
  '6b_functions_writing_attendance', (select j from b6b),
  '7_status_values',           (select j from b7),
  '8_approval_tables',         (select j from b8)
)) as inspection_report;
