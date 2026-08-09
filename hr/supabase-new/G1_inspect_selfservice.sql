-- ═══════════════════════════════════════════════════════════════════
--  G1_inspect_selfservice.sql — ตรวจของจริงก่อนทำ Self Service
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP
--  รันทั้งไฟล์ใน Supabase SQL Editor แล้วส่งผลกลับมา
--
--  ตอบคำถามให้ครบก่อน Migration:
--   A) employees มีคอลัมน์อะไรจริง · มี emergency_phone แล้วหรือยัง
--   B) app_users ผูก employee_id ครบแค่ไหน · role จริงมีค่าอะไรบ้าง
--   C) njhr_ctx / njhr_norm_role คืนค่าอะไร
--   D) guard เดิม (njhr_emp_guard / njhr_empfile_guard) กันใครออกบ้าง
--   E) njhr_emp_files มีคอลัมน์อะไร · ข้อมูลจริงเท่าไหร่ · แยกตาม doc_kind
--   F) Storage bucket njhr-emp-files ตั้งค่าอย่างไร · มี policy กี่ตัว
--   G) RLS / GRANT ของ RPC ที่เกี่ยวข้อง
--   H) ชื่อ RPC ที่จะสร้างใหม่ ชนของเดิมหรือไม่
-- ═══════════════════════════════════════════════════════════════════


-- ─── A1) คอลัมน์ทั้งหมดของ public.employees ────────────────────────
select 'A1_employees_columns' as section,
       ordinal_position as pos, column_name, data_type,
       is_nullable, coalesce(column_default,'—') as col_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'employees'
 order by ordinal_position;


-- ─── A2) เจาะจง: 7 ช่องที่ Self Service จะแก้ได้ มีจริงครบไหม ───────
select 'A2_seven_fields' as section, f.field,
       case when c.column_name is null then '❌ ไม่มีคอลัมน์นี้'
            else '✅ มี · ' || c.data_type || ' · nullable=' || c.is_nullable end as status
  from (values ('nickname'), ('birth_date'), ('national_id'),
               ('phone'), ('email'), ('address'), ('emergency_phone')) f(field)
  left join information_schema.columns c
         on c.table_schema = 'public' and c.table_name = 'employees'
        and c.column_name = f.field
 order by 2 desc, 1;


-- ─── A3) ข้อมูลจริง: แต่ละช่องกรอกแล้วกี่คน (ไม่ดึงค่าจริงออกมา) ───
select 'A3_fill_rate' as section,
       count(*)                                                         as emp_total,
       count(*) filter (where coalesce(btrim(nickname),'')    <> '')    as has_nickname,
       count(*) filter (where birth_date is not null)                   as has_birth_date,
       count(*) filter (where coalesce(btrim(national_id),'') <> '')    as has_national_id,
       count(*) filter (where coalesce(btrim(phone),'')       <> '')    as has_phone,
       count(*) filter (where coalesce(btrim(email),'')       <> '')    as has_email,
       count(*) filter (where coalesce(btrim(address),'')     <> '')    as has_address
  from public.employees;


-- ─── B1) app_users: role จริง + การผูก employee_id ────────────────
select 'B1_users_by_role' as section,
       u.app_code, u.role::text as role_raw,
       public.njhr_norm_role(u.role::text) as role_normalized,
       count(*) as accounts,
       count(*) filter (where u.employee_id is not null) as linked_to_employee,
       count(*) filter (where u.employee_id is null)     as not_linked
  from public.app_users u
 group by 1,2,3,4
 order by u.app_code, 3;


-- ─── B2) บัญชี app_code='salary' ที่ยังไม่ผูก employee_id ──────────
--      บัญชีเหล่านี้จะเปิด Self Service ไม่ได้ ต้องรู้ก่อนว่ามีกี่คน
select 'B2_unlinked_salary_users' as section,
       count(*) as unlinked_accounts
  from public.app_users u
 where u.app_code = 'salary' and u.employee_id is null;


-- ─── B3) employee_id ที่ผูกแล้วแต่ชี้ไปพนักงานที่ไม่มีอยู่จริง ─────
select 'B3_orphan_links' as section, count(*) as orphan_links
  from public.app_users u
 where u.employee_id is not null
   and not exists (select 1 from public.employees e where e.id = u.employee_id);


-- ─── B4) enum ของ role (ห้ามแก้ — ตรวจให้เห็นค่าที่มีจริง) ─────────
select 'B4_role_enum' as section, t.typname as enum_type, e.enumsortorder as ord, e.enumlabel as value
  from pg_type t join pg_enum e on e.enumtypid = t.oid
 where t.typname in ('user_role','app_role','emp_status','leave_type')
 order by t.typname, e.enumsortorder;


-- ─── C1) นิยามจริงของ njhr_norm_role / njhr_ctx ───────────────────
select 'C1_role_ctx_source' as section, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('njhr_norm_role','njhr_ctx')
 order by p.proname;


-- ─── D1) guard เดิมทั้ง 2 ตัว — ดูว่ากันใครออกบ้าง ─────────────────
select 'D1_guard_source' as section, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('njhr_emp_guard','njhr_empfile_guard')
 order by p.proname;


-- ─── E1) คอลัมน์ทั้งหมดของ njhr_emp_files ─────────────────────────
select 'E1_empfiles_columns' as section,
       ordinal_position as pos, column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'njhr_emp_files'
 order by ordinal_position;


-- ─── E2) ยืนยันว่า "ไม่มี" คอลัมน์สถานะการตรวจ (ตามที่ตกลงว่าไม่ต้องทำ) ──
select 'E2_no_review_columns' as section, k.col,
       case when c.column_name is null then '✅ ไม่มี (ถูกต้องตาม Scope)'
            else '⚠ มีอยู่แล้ว — ต้องแจ้งก่อน' end as status
  from (values ('status'), ('submitted_at'), ('reviewed_by'), ('reviewed_at'),
               ('locked'), ('locked_at'), ('return_reason')) k(col)
  left join information_schema.columns c
         on c.table_schema = 'public' and c.table_name = 'njhr_emp_files'
        and c.column_name = k.col
 order by 2;


-- ─── E3) เอกสารจริงในระบบ แยกตาม category / doc_kind ──────────────
select 'E3_files_by_kind' as section,
       f.category, f.doc_kind,
       count(*)                                       as files_total,
       count(*) filter (where f.deleted_at is null)    as files_live,
       count(distinct f.employee_id) filter (where f.deleted_at is null) as employees_with_file
  from public.njhr_emp_files f
 group by 1,2,3
 order by f.category, f.doc_kind;


-- ─── E4) 3 เอกสารบังคับ: มีพนักงานกี่คนที่แนบครบแล้ว ──────────────
with req(doc_kind) as (values ('ID_CARD'), ('HOUSE_REG'), ('EDUCATION')),
have as (
  select f.employee_id, count(distinct f.doc_kind) as n
    from public.njhr_emp_files f
    join req r on r.doc_kind = f.doc_kind
   where f.category = 'PERSONAL' and f.deleted_at is null
   group by 1)
select 'E4_required_docs_progress' as section,
       (select count(*) from public.employees)                  as emp_total,
       count(*) filter (where h.n = 3)                          as complete_3_of_3,
       count(*) filter (where h.n = 2)                          as have_2,
       count(*) filter (where h.n = 1)                          as have_1,
       (select count(*) from public.employees) - count(*)       as have_0
  from have h;


-- ─── E5) หมวดเอกสารที่ constraint อนุญาตจริง (ห้ามเดา) ────────────
select 'E5_kind_ok_source' as section, p.proname as function_name,
       pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'njhr_empfile_kind_ok';


-- ─── E6) constraint ที่ผูกกับ njhr_emp_files ──────────────────────
select 'E6_empfiles_constraints' as section,
       con.conname as constraint_name, con.contype as type,
       pg_get_constraintdef(con.oid) as definition
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
 where n.nspname = 'public' and rel.relname = 'njhr_emp_files'
 order by con.conname;


-- ─── F1) Storage bucket njhr-emp-files ────────────────────────────
select 'F1_bucket' as section, id, name, public as is_public,
       file_size_limit, allowed_mime_types
  from storage.buckets
 where id = 'njhr-emp-files';


-- ─── F2) Policy บน storage.objects ที่แตะ bucket นี้ ───────────────
select 'F2_bucket_policies' as section,
       policyname, cmd, roles::text, coalesce(qual,'—') as using_expr,
       coalesce(with_check,'—') as with_check_expr
  from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
 order by policyname;


-- ─── F3) จำนวนไฟล์จริงใน bucket ───────────────────────────────────
select 'F3_bucket_object_count' as section, count(*) as objects_in_bucket
  from storage.objects where bucket_id = 'njhr-emp-files';


-- ─── G1) RLS ของตารางที่เกี่ยวข้อง ────────────────────────────────
select 'G1_rls' as section, c.relname as table_name, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('employees','app_users','njhr_emp_files','njhr_emp_file_versions','njhr_sessions')
 order by c.relname;


-- ─── G2) Policy บนตาราง public ที่เกี่ยวข้อง ──────────────────────
select 'G2_public_policies' as section, tablename, policyname, cmd, roles::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('employees','app_users','njhr_emp_files','njhr_emp_file_versions')
 order by tablename, policyname;


-- ─── G3) GRANT ของ RPC ที่เกี่ยวข้องกับ Self Service ──────────────
select 'G3_grants' as section, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       coalesce(array_to_string(p.proacl::text[], ' | '), '— ไม่มี ACL (ใช้ default)') as acl
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('njhr_ctx','njhr_norm_role','njhr_emp_guard','njhr_emp_get','njhr_emp_save',
                     'njhr_emp_list','njhr_emp_departments','njhr_empfile_guard','njhr_empfile_list',
                     'njhr_empfile_save','njhr_empfile_delete','njhr_empfile_access',
                     'njhr_empfile_upload_path','njhr_audit_write')
 order by p.proname;


-- ─── H1) ชื่อ RPC ที่ตั้งใจจะสร้างใหม่ ชนของเดิมหรือไม่ ────────────
select 'H1_name_collision' as section, w.candidate,
       case when p.proname is null then '✅ ว่าง สร้างใหม่ได้'
            else '⚠ มีอยู่แล้ว (' || pg_get_function_identity_arguments(p.oid) || ')' end as status
  from (values ('njhr_me_get'), ('njhr_me_save'), ('njhr_me_files'),
               ('njhr_me_file_save'), ('njhr_me_file_delete'), ('njhr_me_guard')) w(candidate)
  left join pg_proc p on p.proname = w.candidate
       and p.pronamespace = 'public'::regnamespace
 order by 2 desc, 1;


-- ─── H2) รายชื่อ RPC njhr_* ทั้งหมดที่มีอยู่ (กันสร้างซ้ำ) ─────────
select 'H2_existing_rpcs' as section, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'njhr\_%'
 order by p.proname;


-- ─── I1) สรุปสิ่งที่ Migration รอบนี้จะทำ (แสดงให้ยืนยันก่อนรัน) ───
select 'I1_planned_changes' as section, item, detail from (values
  ('1. ALTER TABLE', 'employees ADD COLUMN emergency_phone text  (nullable · ไม่มี default · ไม่แตะข้อมูลเดิม)'),
  ('2. CREATE FUNCTION', 'njhr_me_guard(p_token) — คืน employee_id ของ session พร้อม role ที่ normalize แล้ว'),
  ('3. CREATE FUNCTION', 'njhr_me_get(p_token) — อ่าน Employee ของตัวเอง 1 คน + สรุปความครบถ้วน'),
  ('4. CREATE FUNCTION', 'njhr_me_save(p_token, p_data) — บันทึกได้เฉพาะ 7 field ตาม Allowlist'),
  ('5. ALTER FUNCTION', 'njhr_empfile_guard — ให้เจ้าของเขียนเอกสารของตัวเองได้ (ลบยังเป็น SUPER_ADMIN)'),
  ('6. ไม่ทำ', 'ไม่สร้างตาราง verification · ไม่มี status/submitted/locked · ไม่มีปุ่มส่งตรวจ'),
  ('7. ไม่ทำ', 'ไม่แตะ Payroll / REPORT ALL / Settings / Users / Departments / Shifts / SSO'),
  ('8. ไม่ทำ', 'ไม่แก้ enum role เดิม · ไม่ลดสิทธิ์ ADMIN ทั้งระบบในรอบนี้')
) v(item, detail);
