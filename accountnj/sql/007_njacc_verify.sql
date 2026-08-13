-- =====================================================================
-- BILLING NJ — 007_njacc_verify.sql   (อ่านอย่างเดียว — รันได้ทุกเมื่อ)
-- ► ใช้ตรวจ FINAL STATE หลังรันครบ 001 → 009
--   (รันตอนอยู่ระหว่างติดตั้งก็ได้ แต่บางข้อจะยังไม่ผ่านจนกว่าจะรัน 008/009)
-- =====================================================================

-- ---------- STRUCTURE ----------
-- 1) ตาราง njacc_ ครบ 19 (18 หลัก + financial snapshot)
SELECT count(*) AS tables_expected_19 FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';

-- 2) PRIMARY KEY ครบทุกตาราง (ต้องได้ 19 แถว)
SELECT t.table_name, c.constraint_name
  FROM information_schema.tables t
  LEFT JOIN information_schema.table_constraints c
    ON c.table_name=t.table_name AND c.constraint_type='PRIMARY KEY'
 WHERE t.table_schema='public' AND t.table_name LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY t.table_name;

-- 3) FOREIGN KEY ทั้งหมด
SELECT tc.table_name, tc.constraint_name, kcu.column_name,
       ccu.table_name AS ref_table, ccu.column_name AS ref_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name
 WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_name LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY tc.table_name, tc.constraint_name;

-- 4) UNIQUE ที่ต้องมีแน่นอน (ต้องเห็นครบทุกชื่อด้านล่าง)
SELECT conname, conrelid::regclass AS table_name FROM pg_constraint
 WHERE contype='u' AND conname IN (
   'njacc_profiles_login_uq','njacc_profiles_empcode_uq','njacc_profiles_authid_uq',
   'njacc_profiles_internal_uq','njacc_jobs_no_uq','njacc_inv_no_uq',
   'njacc_pay_no_uq','njacc_rc_no_uq','njacc_wht_no_uq','njacc_scode_uq')
 ORDER BY conname;

-- 5) CHECK constraints
SELECT conname, conrelid::regclass AS table_name FROM pg_constraint
 WHERE contype='c' AND conrelid::regclass::text LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY conrelid::regclass::text, conname;

-- 6) INDEX (รวม GIN trigram สำหรับ Search)
SELECT count(*) AS njacc_indexes FROM pg_indexes
 WHERE schemaname='public' AND indexname LIKE 'njacc\_%' ESCAPE '\';
SELECT indexname FROM pg_indexes
 WHERE schemaname='public' AND indexdef ILIKE '%gin_trgm_ops%' ORDER BY indexname;
-- Expected: 11 trigram indexes (jobs 8 + invoices 1 + customers 1 + containers 1)
SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm','pgcrypto');

-- ---------- SECURITY ----------
-- 7) RLS เปิดครบทุกตาราง (rowsecurity = t ทั้งหมด)
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname='public' AND tablename LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY tablename;

-- 8) policy ทั้งหมดต้องเป็น SELECT เท่านั้น และต้องไม่มีบน profiles / user_access
SELECT tablename, polname, cmd FROM pg_policies
 WHERE schemaname='public' AND tablename LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY tablename, polname;
-- Expected: ไม่มีแถวของ njacc_profiles / njacc_user_access · cmd = SELECT ทั้งหมด

-- 9) TABLE GRANTS: anon ต้องไม่มีสิทธิ์ใด ๆ · authenticated ต้องไม่มีบน profiles/user_access
SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
 WHERE table_name LIKE 'njacc\_%' ESCAPE '\' AND grantee IN ('anon','authenticated')
 ORDER BY grantee, table_name, privilege_type;
-- Expected: ไม่มี anon เลย · authenticated มีเฉพาะ SELECT บน customers/company_invoices/service_codes/settings

-- 10) ROUTINE GRANTS: auth/provisioning RPC ต้องเป็น service_role เท่านั้น
SELECT routine_name, grantee FROM information_schema.routine_privileges
 WHERE routine_name IN ('njacc_auth_lookup','njacc_admin_auth_identity','njacc_admin_complete_user','njacc_admin_rollback_user','njacc_admin_safe_profile',
   'njacc_admin_mark_auth_deleted',
   'njacc_admin_mark_auth_created','njacc_admin_provision_state','njacc_admin_mark_failed_cleanup',
   'njacc_admin_find_auth_user','njacc_log_login_success','njacc_sanitize_detail')
 ORDER BY routine_name, grantee;
-- Expected: grantee = service_role (หรือ postgres/owner) เท่านั้น — ห้ามมี anon/authenticated/PUBLIC

-- 11) ต้องไม่มี njacc_resolve_login เหลืออยู่ (ต้องได้ 0)
SELECT count(*) AS resolve_login_left FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_resolve_login';

-- 12) SECURITY DEFINER ทุกตัวต้องมี search_path
SELECT p.proname, p.prosecdef,
       (SELECT string_agg(x,' ') FROM unnest(p.proconfig) x) AS config
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY p.proname;
-- Expected: prosecdef=t และ config มี search_path=public ทุกแถว

-- ---------- DATA ----------
-- 13) SUPER ADMIN 2 คน + auth identity เป็น opaque + link แล้ว
SELECT employee_code, full_name, department, login_name, role, active,
       (auth_identity LIKE 'njacc-auth-%') AS identity_is_opaque,
       (auth_user_id IS NOT NULL) AS linked, provisioning_status
  FROM public.njacc_profiles ORDER BY employee_code;
-- Expected: 0001 Jamrat Phathep / 0002 SOONTAREE TIRANUKUL · SUPER_ADMIN · opaque=t · linked=t

-- 14) ไม่มี login_name / employee_code ซ้ำ (ต้องได้ 0 แถว)
SELECT lower(login_name) AS k, count(*) FROM public.njacc_profiles
 GROUP BY 1 HAVING count(*)>1;
SELECT employee_code AS k, count(*) FROM public.njacc_profiles
 WHERE employee_code IS NOT NULL GROUP BY 1 HAVING count(*)>1;

-- 15a) INVARIANT A: ACTIVE ต้องมี auth_user_id เสมอ (ต้องได้ 0 แถว)
SELECT id, login_name FROM public.njacc_profiles
 WHERE provisioning_status='ACTIVE' AND auth_user_id IS NULL;

-- 15b) INVARIANT B: AUTH_CREATED ต้องมี provisioning_auth_user_id (ต้องได้ 0 แถว)
SELECT id, login_name FROM public.njacc_profiles
 WHERE provisioning_status='AUTH_CREATED' AND provisioning_auth_user_id IS NULL;

-- 15c) INVARIANT G: admin edit RPC ต้องสร้าง profile ใหม่ไม่ได้
--      (ต้องเห็นข้อความ NJACC_CREATE_USER_USE_EDGE ในนิยามฟังก์ชัน)
SELECT p.proname,
       (pg_get_functiondef(p.oid) LIKE '%NJACC_CREATE_USER_USE_EDGE%') AS edit_only_guard,
       (pg_get_functiondef(p.oid) LIKE '%INSERT INTO public.njacc_profiles%') AS can_insert_profile
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_admin_upsert_user';
-- Expected: edit_only_guard = t · can_insert_profile = f

-- 15d) INVARIANT H: audit detail ต้องไม่มีค่าตัวตนภายใน (ต้องได้ 0 แถว)
SELECT id, action, created_at FROM public.njacc_audit_logs
 WHERE detail ?| array['password','temp_password','auth_identity','auth_email',
       'internal_username','auth_user_id','provisioning_auth_user_id','tracked_auth_user_id',
       'access_token','refresh_token','secret','token'];

-- 15e) njacc_my_profile ต้องไม่เขียน audit (ต้องได้ f)
SELECT (pg_get_functiondef(p.oid) LIKE '%njacc_audit%') AS my_profile_writes_audit
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_my_profile';
-- Expected: f

-- 15) provisioning ที่ยังไม่จบ (ตรวจว่าตามได้ทุกแถว)
SELECT id, login_name, provisioning_status, provisioning_request_id,
       provisioning_auth_user_id, (auth_user_id IS NOT NULL) AS linked, created_at
  FROM public.njacc_profiles
 WHERE provisioning_status <> 'ACTIVE'
 ORDER BY created_at;

-- 16) settings หลัก
SELECT key, value FROM public.njacc_settings
 WHERE key IN ('vat_rate','deploy_version','maintenance_active') ORDER BY key;

-- 16b) GLOBAL SAFETY: object ที่ระบบนี้สร้างต้องเป็น njacc_* เท่านั้น
SELECT 'table' AS kind, table_name AS name FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc%' AND table_name NOT LIKE 'njacc\_%'
UNION ALL
SELECT 'routine', routine_name FROM information_schema.routines
 WHERE routine_schema='public' AND routine_name LIKE 'njacc%' AND routine_name NOT LIKE 'njacc\_%';
-- Expected: 0 rows (ชื่อทุก object ขึ้นต้น njacc_)

-- 16c) policy / trigger / index ทั้งหมดของระบบนี้ต้องอยู่บนตาราง njacc_ เท่านั้น
SELECT tablename, polname FROM pg_policies
 WHERE schemaname='public' AND polname LIKE 'njacc%' AND tablename NOT LIKE 'njacc\_%';
SELECT tgname, tgrelid::regclass::text AS table_name FROM pg_trigger
 WHERE NOT tgisinternal AND tgname LIKE 'njacc%' AND tgrelid::regclass::text NOT LIKE 'njacc\_%';
SELECT indexname, tablename FROM pg_indexes
 WHERE schemaname='public' AND indexname LIKE 'njacc%' AND tablename NOT LIKE 'njacc\_%';
-- Expected: 0 rows ทั้งสามชุด

-- 16d) OLD SYSTEM GRANT SNAPSHOT — รันก่อนและหลัง migration ต้องได้ผลเหมือนกันทุกแถว
SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
 WHERE table_name IN ('service_charge_records','advance_charge_records','app_users')
 ORDER BY table_name, grantee, privilege_type;
-- REFERENCE ONLY: BILLING NJ ไม่มี statement ใดที่ GRANT/REVOKE/ALTER ตารางเหล่านี้

-- 16e) STALE AUTH TRACKING: provisioning_auth_user_id ต้องมีอยู่จริงใน auth.users
SELECT p.id, p.login_name, p.provisioning_status
  FROM public.njacc_profiles p
 WHERE p.provisioning_auth_user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.provisioning_auth_user_id);
-- Expected: 0 rows (ถ้ามี = ต้อง repair ก่อนใช้งานจริง)

-- 16f) INVARIANT C: active=true ต้อง provision สำเร็จเท่านั้น (ต้องได้ 0 แถว)
SELECT id, login_name, provisioning_status FROM public.njacc_profiles
 WHERE active = true AND (provisioning_status <> 'ACTIVE' OR auth_user_id IS NULL);

-- 16g) CHECK constraints ของ provisioning ต้องมีครบ 4 ตัว
SELECT conname FROM pg_constraint
 WHERE conname IN ('njacc_profiles_prov_ck','njacc_profiles_prov_active_ck',
   'njacc_profiles_prov_authid_ck','njacc_profiles_active_ck') ORDER BY conname;

-- 16h) ต้องไม่มี njacc_admin_link_auth (ช่อง link นอก state machine) — Expected 0
SELECT count(*) AS link_auth_left FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_admin_link_auth';

-- 17) ตาราง BILLING เดิมยังอยู่ครบ ไม่ถูกแตะ
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public'
   AND table_name IN ('service_charge_records','advance_charge_records','app_users');
-- REFERENCE ONLY: BILLING NJ ไม่ได้อ่าน/เขียนตารางเหล่านี้

-- 18) เลขเอกสารไม่ซ้ำ (ต้องได้ 0 แถว)
SELECT 'jobs' src, job_no, count(*) FROM public.njacc_jobs GROUP BY job_no HAVING count(*)>1
UNION ALL
SELECT 'invoices', invoice_no, count(*) FROM public.njacc_invoices GROUP BY invoice_no HAVING count(*)>1
UNION ALL
SELECT 'payments', payment_no, count(*) FROM public.njacc_payments GROUP BY payment_no HAVING count(*)>1
UNION ALL
SELECT 'receipts', receipt_no, count(*) FROM public.njacc_receipts GROUP BY receipt_no HAVING count(*)>1;

-- 19) การเงินสอดคล้อง: allocation รวมต่อ invoice ต้องไม่เกิน total (ต้องได้ 0 แถว)
SELECT i.invoice_no, i.total_amount, sum(pa.allocated_amount) AS allocated
  FROM public.njacc_invoices i
  JOIN public.njacc_payment_allocations pa ON pa.invoice_id=i.id
  JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
 GROUP BY i.id, i.invoice_no, i.total_amount
HAVING sum(pa.allocated_amount) > i.total_amount + 0.005;
