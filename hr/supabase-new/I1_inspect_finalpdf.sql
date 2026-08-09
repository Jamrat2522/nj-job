-- ═══════════════════════════════════════════════════════════════════
--  I1_inspect_finalpdf.sql — ตรวจของจริงก่อนทำ Final PDF Backend
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  statement เดียว คืน JSON ก้อนเดียว (Supabase SQL Editor แสดงเฉพาะ statement สุดท้าย)
--
--  ไม่อ้างตารางตรง ๆ ที่อาจไม่มีอยู่ (บทเรียนจาก H4) — ใช้ pg_class / information_schema
--
--  ตอบให้ครบก่อนเขียน I2:
--   A) njhr_emp_documents มีคอลัมน์ final_pdf_* อยู่แล้วหรือยัง · คอลัมน์ที่ I2 จะเพิ่ม
--   B) njhr_emp_doc_acks — คอลัมน์ปัจจุบันครบตาม H2 หรือไม่ (doc_hash · confirmation_text)
--   C) Storage bucket ทั้งหมด · ชื่อ bucket ที่ตั้งใจจะสร้างชนของเดิมไหม
--   D) policy njhr_sig_no_public ตัวจริง + policy อื่นบน storage.objects (ต้องแก้ให้น้อยที่สุด)
--   E) ชื่อ RPC ใหม่ชนของเดิมหรือไม่ · ACL ของ RPC ที่มีอยู่
--   F) njhr_doc_respond ตัวจริง (I2 ต้อง REPLACE ทับเพื่อตั้ง final_pdf_status = PENDING)
--   G) Trigger + Constraint ปัจจุบันบนตารางเอกสาร
--   H) ข้อมูลจริง — ยืนยันว่ายังไม่มีเอกสารที่ ACK/SIGN (จะได้ไม่ต้อง backfill)
--   I) Edge Function ที่มี + วิธีที่ระบบเดิมออก Signed URL (ต้อง reuse pattern เดิม)
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── A) คอลัมน์ final_pdf_* มีอยู่แล้วหรือยัง ───────────────────
  'A1_planned_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', w.tbl, 'column', w.col,
             'exists', (c.column_name is not null),
             'type', coalesce(c.data_type::text, '—')) order by w.ord), '[]'::jsonb)
      from (values (1,'njhr_emp_documents','final_pdf_status'),
                   (2,'njhr_emp_documents','final_pdf_path'),
                   (3,'njhr_emp_documents','final_pdf_hash'),
                   (4,'njhr_emp_documents','final_pdf_at'),
                   (5,'njhr_emp_documents','final_pdf_error'),
                   (6,'njhr_emp_documents','final_pdf_bytes')) w(ord, tbl, col)
      left join information_schema.columns c
             on c.table_schema = 'public' and c.table_name = w.tbl and c.column_name = w.col),

  -- ─── A2) คอลัมน์ที่มีคำว่า pdf / file อยู่แล้วในตารางเอกสาร ─────
  'A2_existing_pdf_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', table_name::text, 'column', column_name::text, 'type', data_type::text)
           order by table_name, column_name), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public'
       and table_name in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')
       and (column_name ilike '%pdf%' or column_name ilike '%file%'
            or column_name ilike '%path%' or column_name ilike '%storage%')),

  -- ─── B) ยืนยันผลของ H2 ยังอยู่ครบ ───────────────────────────────
  'B1_h2_columns_intact', (
    select coalesce(jsonb_object_agg(c.table_name::text || '.' || c.column_name::text,
             '✅ ' || c.data_type::text), '{}'::jsonb)
      from information_schema.columns c
     where c.table_schema = 'public'
       and ((c.table_name = 'njhr_emp_documents' and c.column_name in ('content_hash','content_hash_at'))
         or (c.table_name = 'njhr_emp_doc_acks'  and c.column_name in ('doc_hash','confirmation_text')))),

  -- ─── C) Storage bucket ทั้งหมด ───────────────────────────────────
  'C1_all_buckets', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', b.id, 'public', b.public,
             'size_limit', b.file_size_limit,
             'mime', to_jsonb(b.allowed_mime_types)) order by b.id), '[]'::jsonb)
      from storage.buckets b),

  'C2_target_bucket_free', (
    select case when exists (select 1 from storage.buckets where id = 'njhr-doc-pdf')
                then '⚠ มี bucket njhr-doc-pdf อยู่แล้ว — ต้องตรวจก่อนใช้ซ้ำ'
                else '✅ ว่าง สร้างใหม่ได้' end),

  -- ─── D) Policy บน storage.objects (ต้องแก้ให้น้อยที่สุด) ─────────
  'D1_storage_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', policyname::text, 'cmd', cmd, 'roles', roles::text,
             'using', coalesce(qual,'—'), 'with_check', coalesce(with_check,'—'))
           order by policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'storage' and tablename = 'objects'),

  -- ─── D2) เจาะจง njhr_sig_no_public — ตัวที่จะต้องแก้ ─────────────
  'D2_sig_no_public', coalesce((
    select jsonb_build_object(
             'exists', true, 'cmd', cmd, 'roles', roles::text,
             'using', coalesce(qual,'—'), 'with_check', coalesce(with_check,'—'),
             'permissive', permissive)
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname = 'njhr_sig_no_public'), jsonb_build_object('exists', false)),

  -- ─── D3) bucket ที่ policy public อ่านได้อยู่ตอนนี้ (ผลกระทบจริง) ─
  'D3_public_readable_buckets', (
    select coalesce(jsonb_agg(b.id order by b.id), '[]'::jsonb)
      from storage.buckets b
     where exists (
       select 1 from pg_policies p
        where p.schemaname = 'storage' and p.tablename = 'objects'
          and p.cmd in ('SELECT','ALL')
          and (p.roles::text like '%public%' or p.roles::text like '%anon%'))),

  -- ─── E) ชื่อ RPC ใหม่ชนของเดิมหรือไม่ ────────────────────────────
  'E1_name_collision', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'candidate', w.candidate,
             'taken', (p.proname is not null),
             'existing_args', coalesce(pg_get_function_identity_arguments(p.oid),'—'))
           order by w.candidate), '[]'::jsonb)
      from (values ('njhr_doc_pdf_claim'), ('njhr_doc_pdf_commit'),
                   ('njhr_doc_pdf_fail'), ('njhr_doc_pdf_access'),
                   ('njhr_doc_pdf_status'), ('njhr_doc_pdf_snapshot'),
                   ('njhr_docpdf_immutable_guard')) w(candidate)
      left join pg_proc p on p.proname = w.candidate
           and p.pronamespace = 'public'::regnamespace),

  -- ─── E2) ACL ของ RPC ที่ I2 จะอ้างอิงหรือแก้ ─────────────────────
  'E2_related_rpc_acl', (
    select coalesce(jsonb_object_agg(p.proname::text,
             jsonb_build_object(
               'args', pg_get_function_identity_arguments(p.oid),
               'secdef', p.prosecdef,
               'acl', coalesce(array_to_string(p.proacl::text[], ' | '), 'default'))), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_doc_respond','njhr_doc_detail','njhr_doc_center_list',
                         'njhr_doc_guard','njhr_ctx','njhr_doc_event','njhr_audit_write',
                         'njhr_empfile_access','njhr_empfile_upload_path')),

  -- ─── F) njhr_doc_respond ตัวจริง (I2 ต้อง REPLACE ทับ) ───────────
  'F1_doc_respond_def', (
    select pg_get_functiondef(p.oid)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_doc_respond' and p.prokind = 'f'
     limit 1),

  -- ─── G) Trigger + Constraint ปัจจุบันบนตารางเอกสาร ───────────────
  'G1_triggers', (
    select coalesce(jsonb_object_agg(c.relname::text || '.' || t.tgname::text,
             pg_get_triggerdef(t.oid)), '{}'::jsonb)
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and c.relname in ('njhr_emp_documents','njhr_emp_doc_acks')),

  'G2_check_constraints', (
    select coalesce(jsonb_object_agg(con.conname::text, pg_get_constraintdef(con.oid)), '{}'::jsonb)
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public' and con.contype = 'c'
       and rel.relname in ('njhr_emp_documents','njhr_emp_doc_acks')),

  -- ─── H) ข้อมูลจริง — ยืนยันว่ายังไม่ต้อง backfill ────────────────
  'H1_data_state', (
    select jsonb_build_object(
      'documents_total',   (select count(*) from public.njhr_emp_documents),
      'by_status', coalesce((select jsonb_object_agg(status, n)
                               from (select status, count(*) n
                                       from public.njhr_emp_documents group by status) s), '{}'::jsonb),
      'acked_or_signed',   (select count(*) from public.njhr_emp_documents
                             where status in ('ACKNOWLEDGED','SIGNED')),
      'content_hash_set',  (select count(*) from public.njhr_emp_documents where content_hash is not null),
      'acks_total',        (select count(*) from public.njhr_emp_doc_acks),
      'events_total',      (select count(*) from public.njhr_emp_doc_events),
      'note', 'ถ้า acked_or_signed = 0 แปลว่าไม่ต้อง backfill Final PDF ให้เอกสารเดิม')),

  -- ─── I) รูปแบบ Signed URL ที่ระบบเดิมใช้ (ต้อง reuse) ────────────
  --      njhr_empfile_access เป็นตัวอย่างที่ Edge Function njhr-emp-file เรียกใช้
  'I1_access_pattern', (
    select pg_get_functiondef(p.oid)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_empfile_access' and p.prokind = 'f'
     limit 1),

  -- ─── J) RLS ของตารางที่เกี่ยวข้อง ───────────────────────────────
  'J1_rls', (
    select coalesce(jsonb_object_agg(c.relname::text,
             jsonb_build_object('rls', c.relrowsecurity,
               'policies', (select count(*) from pg_policies p
                             where p.schemaname = 'public' and p.tablename = c.relname))), '{}'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and c.relname in ('njhr_emp_documents','njhr_emp_doc_acks','njhr_emp_doc_events')),

  -- ─── K) Extension — ยืนยันว่าไม่มี pg_net / pg_cron ─────────────
  'K1_extensions', (
    select coalesce(jsonb_object_agg(e.extname, n.nspname), '{}'::jsonb)
      from pg_extension e join pg_namespace n on n.oid = e.extnamespace),

  'K2_net_cron_absent', (
    select case when exists (select 1 from pg_extension where extname in ('pg_net','pg_cron'))
                then '⚠ มี pg_net/pg_cron — ทบทวนสถาปัตยกรรมได้'
                else '✅ ไม่มีทั้งคู่ — ยืนยันต้องใช้แบบ (B) Frontend เรียก Edge Function' end),

  'meta', jsonb_build_object('file','I1_inspect_finalpdf.sql','read_only', true,'at', now())
)) as result;
