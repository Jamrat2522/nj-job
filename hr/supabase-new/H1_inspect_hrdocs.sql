-- ═══════════════════════════════════════════════════════════════════
--  H1_inspect_hrdocs.sql — ตรวจของจริงของระบบ "เอกสาร HR" ก่อน Migration
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  statement เดียว คืน JSON ก้อนเดียว (Supabase SQL Editor แสดงเฉพาะ statement สุดท้าย)
--
--  ตอบให้ครบก่อนเขียน H2:
--   A) คอลัมน์จริงของ njhr_emp_documents · มี content_hash / hash อะไรอยู่แล้วหรือยัง
--   B) คอลัมน์จริงของ njhr_emp_doc_acks · มี confirmation_text / doc_hash อยู่แล้วหรือยัง
--   C) Constraint + Unique Index จริง (Idempotency กัน ACK ซ้ำ)
--   D) Trigger จริงทั้งหมดบน 2 ตารางนี้ + นิยาม lock guard ตัวจริง
--   E) มี Function เกี่ยวกับ hash / digest / pgcrypto อยู่แล้วหรือไม่ (ห้ามสร้างซ้ำ)
--   F) RPC ของระบบเอกสารที่มีอยู่จริง + GRANT
--   G) RLS / Policy
--   H) ข้อมูลจริงในระบบ (จำนวนเอกสาร แยกตาม status / type / version)
--   I) ชื่อ RPC ใหม่ที่ตั้งใจสร้าง ชนของเดิมหรือไม่
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── A) คอลัมน์ทั้งหมดของ njhr_emp_documents ────────────────────
  'A1_documents_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name, 'type', data_type,
             'nullable', is_nullable, 'default', coalesce(column_default,'—'))
           order by ordinal_position), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'njhr_emp_documents'),

  -- ─── A2) มีคอลัมน์เกี่ยวกับ hash อยู่แล้วหรือยัง (ห้ามสร้างซ้ำ) ──
  'A2_hash_columns_existing', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', table_name, 'column', column_name, 'type', data_type)
           order by table_name, column_name), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public'
       and table_name in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')
       and (column_name ilike '%hash%' or column_name ilike '%digest%'
            or column_name ilike '%checksum%' or column_name ilike '%signature%')),

  -- ─── A3) คอลัมน์ที่ H2 ตั้งใจจะเพิ่ม — มีอยู่แล้วไหม ─────────────
  'A3_planned_columns_check', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', w.tbl, 'column', w.col,
             'exists', (c.column_name is not null),
             'type', coalesce(c.data_type,'—')) order by w.ord), '[]'::jsonb)
      from (values (1,'njhr_emp_documents','content_hash'),
                   (2,'njhr_emp_documents','content_hash_at'),
                   (3,'njhr_emp_doc_acks','doc_hash'),
                   (4,'njhr_emp_doc_acks','confirmation_text')) w(ord, tbl, col)
      left join information_schema.columns c
             on c.table_schema = 'public' and c.table_name = w.tbl and c.column_name = w.col),

  -- ─── B) คอลัมน์ทั้งหมดของ njhr_emp_doc_acks ────────────────────
  'B1_acks_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name, 'type', data_type,
             'nullable', is_nullable, 'default', coalesce(column_default,'—'))
           order by ordinal_position), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'njhr_emp_doc_acks'),

  -- ─── B2) คอลัมน์ njhr_emp_doc_events (ไทม์ไลน์/Audit เดิม) ──────
  'B2_events_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name, 'type', data_type)
           order by ordinal_position), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'njhr_emp_doc_events'),

  -- ─── C1) Constraint จริงของทั้ง 3 ตาราง ────────────────────────
  'C1_constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', rel.relname, 'name', con.conname,
             'type', case con.contype when 'p' then 'PRIMARY KEY' when 'f' then 'FOREIGN KEY'
                                      when 'u' then 'UNIQUE' when 'c' then 'CHECK' else con.contype::text end,
             'def', pg_get_constraintdef(con.oid))
           order by rel.relname, con.conname), '[]'::jsonb)
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public'
       and rel.relname in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')),

  -- ─── C2) Index ทั้งหมด (ดู Unique ที่กัน ACK ซ้ำ) ───────────────
  'C2_indexes', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', tablename, 'name', indexname, 'def', indexdef)
           order by tablename, indexname), '[]'::jsonb)
      from pg_indexes
     where schemaname = 'public'
       and tablename in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')),

  -- ─── D1) Trigger จริงบน 2 ตารางหลัก ────────────────────────────
  'D1_triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', c.relname, 'name', t.tgname,
             'enabled', t.tgenabled, 'def', pg_get_triggerdef(t.oid))
           order by c.relname, t.tgname), '[]'::jsonb)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and c.relname in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')),

  -- ─── D2) นิยามตัวจริงของ lock guard + doc_event ────────────────
  'D2_guard_functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'definition', pg_get_functiondef(p.oid))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_empdoc_lock_guard','njhr_doc_event','njhr_doc_guard')),

  -- ─── E1) มีกลไก hash เดิมในระบบหรือไม่ (ห้ามสร้างซ้ำ) ──────────
  'E1_hash_functions_existing', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'schema', n.nspname, 'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid))
           order by n.nspname, p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where (p.proname ilike '%hash%' or p.proname in ('digest','encode','gen_random_uuid'))
       and n.nspname in ('public','extensions')
       and p.proname not ilike '%password%'),

  -- ─── E2) Extension ที่ติดตั้งแล้ว (pgcrypto ให้ digest/sha256) ──
  'E2_extensions', (
    select coalesce(jsonb_object_agg(e.extname, n.nspname), '{}'::jsonb)
      from pg_extension e join pg_namespace n on n.oid = e.extnamespace),

  -- ─── E3) ทดสอบว่าเรียก sha256 ได้จริงจาก schema ไหน ────────────
  'E3_sha256_probe', (
    select jsonb_build_object(
      'public_digest', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'digest'),
      'extensions_digest', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'extensions' and p.proname = 'digest'),
      'builtin_sha256', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                          where n.nspname = 'pg_catalog' and p.proname = 'sha256'))),

  -- ─── F) RPC ของระบบเอกสาร + GRANT ──────────────────────────────
  'F1_doc_rpcs', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'returns', pg_get_function_result(p.oid),
             'secdef', p.prosecdef,
             'acl', coalesce(array_to_string(p.proacl::text[], ' | '), 'default'))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'njhr\_doc\_%'),

  -- ─── F2) นิยามตัวจริงของ RPC ที่ H2 จะต้องแก้ ──────────────────
  'F2_rpcs_to_modify', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'definition', pg_get_functiondef(p.oid))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in ('njhr_doc_flow','njhr_doc_respond')),

  -- ─── G) RLS / Policy ───────────────────────────────────────────
  'G1_rls', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', c.relname, 'rls_enabled', c.relrowsecurity,
             'policies', (select count(*) from pg_policies p
                           where p.schemaname = 'public' and p.tablename = c.relname))
           order by c.relname), '[]'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events','njhr_org_profile')),

  'G2_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', tablename, 'name', policyname, 'cmd', cmd, 'roles', roles::text)
           order by tablename, policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'public'
       and tablename in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')),

  -- ─── G3) bucket ลายเซ็น ────────────────────────────────────────
  'G3_signature_bucket', coalesce((
    select jsonb_build_object('id', b.id, 'public', b.public)
      from storage.buckets b where b.id = 'njhr-signatures'), 'null'::jsonb),

  -- ─── H) ข้อมูลจริงในระบบ (ไม่ดึงเนื้อหาเอกสารออกมา) ────────────
  'H1_documents_by_status', (
    select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) n from public.njhr_emp_documents group by status) s),

  'H2_documents_by_type', (
    select coalesce(jsonb_object_agg(doc_type, n), '{}'::jsonb)
      from (select doc_type, count(*) n from public.njhr_emp_documents group by doc_type) s),

  'H3_data_summary', (
    select jsonb_build_object(
      'documents_total',      (select count(*) from public.njhr_emp_documents),
      'documents_locked',     (select count(*) from public.njhr_emp_documents where locked_at is not null),
      'documents_sent',       (select count(*) from public.njhr_emp_documents where sent_at is not null),
      'documents_version_gt1',(select count(*) from public.njhr_emp_documents where version > 1),
      'acks_total',           (select count(*) from public.njhr_emp_doc_acks),
      'acks_by_action',       coalesce((select jsonb_object_agg(action, n)
                                          from (select action, count(*) n
                                                  from public.njhr_emp_doc_acks group by action) t), '{}'::jsonb),
      'events_total',         (select count(*) from public.njhr_emp_doc_events),
      'employees_with_docs',  (select count(distinct employee_id) from public.njhr_emp_documents))),

  -- ─── H4) สถานะที่ควรนับเป็น Pending ของพนักงาน (ดูของจริงก่อน) ──
  'H4_pending_candidates', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'status', s.status, 'requires_signature', s.requires_signature, 'count', s.n)
           order by s.status, s.requires_signature), '[]'::jsonb)
      from (select status, requires_signature, count(*) n
              from public.njhr_emp_documents
             where status in ('SENT','VIEWED')
             group by status, requires_signature) s),

  -- ─── I) ชื่อ RPC ใหม่ที่ตั้งใจสร้าง ชนของเดิมหรือไม่ ────────────
  'I1_name_collision', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'candidate', w.candidate,
             'taken', (p.proname is not null),
             'existing_args', coalesce(pg_get_function_identity_arguments(p.oid),'—'))
           order by w.candidate), '[]'::jsonb)
      from (values ('njhr_doc_my_pending'), ('njhr_doc_confirm_text'),
                   ('njhr_doc_content_hash'), ('njhr_docack_immutable_guard')) w(candidate)
      left join pg_proc p on p.proname = w.candidate
           and p.pronamespace = 'public'::regnamespace),

  -- ─── I2) ยืนยันว่าไม่มีตาราง "เอกสารของฉัน" แยกอยู่แล้ว ─────────
  'I2_no_separate_user_doc_table', (
    select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and (c.relname ilike '%my_doc%' or c.relname ilike '%user_doc%'
            or c.relname ilike '%self_doc%' or c.relname ilike '%doc_mine%')),

  'meta', jsonb_build_object('file','H1_inspect_hrdocs.sql','read_only', true,'generated_at', now())
)) as result;
