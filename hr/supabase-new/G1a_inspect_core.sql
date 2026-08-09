-- ═══════════════════════════════════════════════════════════════════
--  G1a_inspect_core.sql — ตรวจของจริงก่อนทำ Self Service (ชุดที่ 1/2)
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  เป็น "statement เดียว" คืน JSON ก้อนเดียว เพราะ Supabase SQL Editor
--  แสดงผลเฉพาะ statement สุดท้ายเท่านั้น
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── A1) คอลัมน์ทั้งหมดของ public.employees ────────────────────
  'A1_employees_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name, 'type', data_type,
             'nullable', is_nullable, 'default', coalesce(column_default,'—'))
           order by ordinal_position), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'employees'),

  -- ─── A2) 7 ช่องที่ Self Service จะแก้ได้ มีจริงครบไหม ──────────
  'A2_seven_fields', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'field', f.field,
             'exists', (c.column_name is not null),
             'type', coalesce(c.data_type,'—'),
             'nullable', coalesce(c.is_nullable,'—')) order by f.ord), '[]'::jsonb)
      from (values (1,'nickname'), (2,'birth_date'), (3,'national_id'), (4,'phone'),
                   (5,'email'), (6,'address'), (7,'emergency_phone')) f(ord, field)
      left join information_schema.columns c
             on c.table_schema = 'public' and c.table_name = 'employees'
            and c.column_name = f.field),

  -- ─── A3) แต่ละช่องกรอกแล้วกี่คน (ไม่ดึงค่าจริงออกมา) ───────────
  'A3_fill_rate', (
    select jsonb_build_object(
             'emp_total',       count(*),
             'has_nickname',    count(*) filter (where coalesce(btrim(nickname),'')    <> ''),
             'has_birth_date',  count(*) filter (where birth_date is not null),
             'has_national_id', count(*) filter (where coalesce(btrim(national_id),'') <> ''),
             'has_phone',       count(*) filter (where coalesce(btrim(phone),'')       <> ''),
             'has_email',       count(*) filter (where coalesce(btrim(email),'')       <> ''),
             'has_address',     count(*) filter (where coalesce(btrim(address),'')     <> ''))
      from public.employees),

  -- ─── B1) app_users: role จริง + การผูก employee_id ─────────────
  'B1_users_by_role', (
    select coalesce(jsonb_agg(x order by x->>'app_code', x->>'role_normalized'), '[]'::jsonb)
      from (select jsonb_build_object(
                     'app_code', u.app_code,
                     'role_raw', u.role::text,
                     'role_normalized', public.njhr_norm_role(u.role::text),
                     'accounts', count(*),
                     'linked_to_employee', count(*) filter (where u.employee_id is not null),
                     'not_linked', count(*) filter (where u.employee_id is null)) x
              from public.app_users u
             group by u.app_code, u.role::text) s),

  -- ─── B2) บัญชี app_code='salary' ที่ยังไม่ผูก employee_id ───────
  --       บัญชีเหล่านี้จะเปิด Self Service ไม่ได้ ต้องรู้จำนวนก่อน
  'B2_salary_link_summary', (
    select jsonb_build_object(
             'salary_accounts_total', count(*),
             'linked',   count(*) filter (where u.employee_id is not null),
             'unlinked', count(*) filter (where u.employee_id is null),
             'unlinked_by_role', coalesce((
               select jsonb_object_agg(r, n) from (
                 select public.njhr_norm_role(u2.role::text) r, count(*) n
                   from public.app_users u2
                  where u2.app_code = 'salary' and u2.employee_id is null
                  group by 1) t), '{}'::jsonb))
      from public.app_users u where u.app_code = 'salary'),

  -- ─── B3) employee_id ที่ชี้ไปพนักงานที่ไม่มีอยู่จริง ───────────
  'B3_orphan_links', (
    select count(*) from public.app_users u
     where u.employee_id is not null
       and not exists (select 1 from public.employees e where e.id = u.employee_id)),

  -- ─── B4) enum ที่เกี่ยวข้อง (ห้ามแก้ — ตรวจให้เห็นค่าที่มีจริง) ─
  'B4_enums', (
    select coalesce(jsonb_object_agg(typname, vals), '{}'::jsonb) from (
      select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) vals
        from pg_type t join pg_enum e on e.enumtypid = t.oid
        join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = 'public'
         and t.typname in ('user_role','app_role','emp_status','leave_type')
       group by t.typname) s),

  -- ─── E1) คอลัมน์ทั้งหมดของ njhr_emp_files ──────────────────────
  'E1_empfiles_columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'pos', ordinal_position, 'name', column_name,
             'type', data_type, 'nullable', is_nullable)
           order by ordinal_position), '[]'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'njhr_emp_files'),

  -- ─── E2) ยืนยันว่า "ไม่มี" คอลัมน์สถานะการตรวจ (ตาม Scope) ─────
  'E2_review_columns_present', (
    select coalesce(jsonb_agg(c.column_name order by c.column_name), '[]'::jsonb)
      from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = 'njhr_emp_files'
       and c.column_name in ('status','submitted_at','reviewed_by','reviewed_at',
                             'locked','locked_at','return_reason')),

  -- ─── E3) เอกสารจริงในระบบ แยกตาม category / doc_kind ───────────
  'E3_files_by_kind', (
    select coalesce(jsonb_agg(x order by x->>'category', x->>'doc_kind'), '[]'::jsonb)
      from (select jsonb_build_object(
                     'category', f.category, 'doc_kind', f.doc_kind,
                     'files_total', count(*),
                     'files_live', count(*) filter (where f.deleted_at is null),
                     'employees_with_file',
                       count(distinct f.employee_id) filter (where f.deleted_at is null)) x
              from public.njhr_emp_files f
             group by f.category, f.doc_kind) s),

  -- ─── E4) 3 เอกสารบังคับ: แนบครบแล้วกี่คน ───────────────────────
  'E4_required_docs_progress', (
    with req(doc_kind) as (values ('ID_CARD'), ('HOUSE_REG'), ('EDUCATION')),
    have as (select f.employee_id, count(distinct f.doc_kind) n
               from public.njhr_emp_files f
               join req r on r.doc_kind = f.doc_kind
              where f.category = 'PERSONAL' and f.deleted_at is null
              group by 1)
    select jsonb_build_object(
             'emp_total', (select count(*) from public.employees),
             'complete_3_of_3', (select count(*) from have where n = 3),
             'have_2',          (select count(*) from have where n = 2),
             'have_1',          (select count(*) from have where n = 1),
             'have_0', (select count(*) from public.employees) - (select count(*) from have))),

  -- ─── E6) constraint ที่ผูกกับ njhr_emp_files ───────────────────
  'E6_empfiles_constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', con.conname, 'def', pg_get_constraintdef(con.oid))
           order by con.conname), '[]'::jsonb)
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public' and rel.relname = 'njhr_emp_files'),

  -- ─── F1) Storage bucket njhr-emp-files ─────────────────────────
  'F1_bucket', coalesce((
    select jsonb_build_object('id', b.id, 'public', b.public,
             'file_size_limit', b.file_size_limit,
             'allowed_mime_types', to_jsonb(b.allowed_mime_types))
      from storage.buckets b where b.id = 'njhr-emp-files'), 'null'::jsonb),

  -- ─── F2) Policy บน storage.objects ─────────────────────────────
  'F2_storage_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', policyname, 'cmd', cmd, 'roles', roles::text,
             'using', coalesce(qual,'—'), 'with_check', coalesce(with_check,'—'))
           order by policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'storage' and tablename = 'objects'),

  -- ─── F3) จำนวนไฟล์จริงใน bucket ────────────────────────────────
  'F3_bucket_object_count', (
    select count(*) from storage.objects where bucket_id = 'njhr-emp-files'),

  -- ─── G1) RLS ของตารางที่เกี่ยวข้อง ─────────────────────────────
  'G1_rls', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', c.relname, 'rls_enabled', c.relrowsecurity,
             'policy_count', (select count(*) from pg_policies p
                               where p.schemaname = 'public' and p.tablename = c.relname))
           order by c.relname), '[]'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname in ('employees','app_users','njhr_emp_files',
                         'njhr_emp_file_versions','njhr_sessions')),

  -- ─── G2) Policy บนตาราง public ที่เกี่ยวข้อง ───────────────────
  'G2_public_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', tablename, 'name', policyname, 'cmd', cmd, 'roles', roles::text)
           order by tablename, policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'public'
       and tablename in ('employees','app_users','njhr_emp_files','njhr_emp_file_versions')),

  -- ─── G3) GRANT ของ RPC ที่เกี่ยวข้องกับ Self Service ───────────
  'G3_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'fn', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'acl', coalesce(array_to_string(p.proacl::text[], ' | '), 'default'))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_ctx','njhr_norm_role','njhr_emp_guard','njhr_emp_get',
                         'njhr_emp_save','njhr_emp_list','njhr_emp_departments',
                         'njhr_empfile_guard','njhr_empfile_list','njhr_empfile_save',
                         'njhr_empfile_delete','njhr_empfile_access',
                         'njhr_empfile_upload_path','njhr_audit_write')),

  -- ─── H1) ชื่อ RPC ที่จะสร้างใหม่ ชนของเดิมหรือไม่ ──────────────
  'H1_name_collision', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'candidate', w.candidate,
             'taken', (p.proname is not null),
             'existing_args', coalesce(pg_get_function_identity_arguments(p.oid),'—'))
           order by w.candidate), '[]'::jsonb)
      from (values ('njhr_me_guard'), ('njhr_me_get'), ('njhr_me_save'),
                   ('njhr_me_files'), ('njhr_me_file_save')) w(candidate)
      left join pg_proc p on p.proname = w.candidate
           and p.pronamespace = 'public'::regnamespace),

  -- ─── H2) จำนวน RPC njhr_* ทั้งหมด (กันสร้างซ้ำ) ────────────────
  'H2_njhr_rpc_count', (
    select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'njhr\_%'),

  'meta', jsonb_build_object('file', 'G1a_inspect_core.sql',
                             'read_only', true, 'generated_at', now())
)) as result;
