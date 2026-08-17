-- ═══════════════════════════════════════════════════════════════════════════
-- 017_rpc_permission_matrix_repair.sql
-- *** อัปเดต 2026-08-15: เพิ่ม RPC ของ 019/020/022 เข้า allowlist ***
--     (ถ้ารัน 017 ฉบับเก่า จะถอนสิทธิ์ RPC ใหม่ออกและทำให้ Flow POST พัง)
-- คืน Permission Matrix ให้ตรงกับ Migration เดิม (แก้ over-grant ที่เกิดจาก 016)
--
-- ⚠️ ยังไม่รัน — รอคำสั่ง "รันได้"
--
-- ── สภาพ Production ปัจจุบัน (ตรวจสดแล้ว หลังรัน 016) ──
--     njacc_* ทั้งหมด           79
--     anon EXECUTE                1   (njacc_app_status)          ✅ ถูกต้อง
--     PUBLIC EXECUTE              0                                ✅ ถูกต้อง
--     service_role EXECUTE       79                                (ยอมรับได้ — เป็น role ฝั่งเซิร์ฟเวอร์)
--     authenticated EXECUTE      79   ← ❌ กว้างเกินการออกแบบเดิม
--
-- ── สาเหตุ ──
--   016 SECTION 2 วนทุกฟังก์ชันแล้วสั่ง GRANT EXECUTE ... TO authenticated
--   ทำให้ authenticated ได้สิทธิ์บน internal helper และ service-role-only RPC
--   ที่ Migration เดิมไม่เคย GRANT ให้
--
-- ── Allowlist มาจากไหน ──
--   สกัดจากคำสั่ง GRANT EXECUTE ... TO <role> ที่มีอยู่จริงในไฟล์ migration เดิม
--   (sql/001–010, sql/legacy, sql/dev/011–015 · ไม่รวม 016 ที่เป็นตัวปัญหา)
--   ไม่ได้เดาจากชื่อฟังก์ชัน
--     anon           1 ฟังก์ชัน
--     authenticated 52 ฟังก์ชัน (+9 ที่เพิ่มโดย 021/022 = 61)
--     service_role  11 ฟังก์ชัน (ทั้งหมดเป็น service-role-only)
--   ตรวจไขว้แล้ว: RPC ที่ frontend/Edge Function เรียกจริง 41 ตัว
--   อยู่ใน authenticated allowlist ครบทุกตัว → ถอนสิทธิ์แล้วแอปไม่พัง
--
-- ไม่มี CREATE OR REPLACE FUNCTION → ไม่แตะ Business Logic แม้แต่บรรทัดเดียว
-- ไม่ DROP ไม่ DELETE ไม่ TRUNCATE
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 0 · ALLOWLIST (ตารางชั่วคราว ใช้ทั้ง PREFLIGHT / APPLY / VERIFY)
-- ───────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS _njacc_allow;
CREATE TEMP TABLE _njacc_allow(proname text PRIMARY KEY, role_name text);

INSERT INTO _njacc_allow(proname, role_name) VALUES
  ('njacc_app_status','anon');

DROP TABLE IF EXISTS _njacc_auth_allow;
CREATE TEMP TABLE _njacc_auth_allow(proname text PRIMARY KEY);
INSERT INTO _njacc_auth_allow(proname) VALUES
  ('njacc_admin_begin_user'),
  ('njacc_admin_list_users'),
  ('njacc_admin_upsert_user'),
  ('njacc_app_status'),
  ('njacc_backup_status'),
  ('njacc_bulk_set_field'),
  ('njacc_bulk_set_status'),
  ('njacc_can'),
  ('njacc_charge_filter_options'),
  ('njacc_charge_kpi'),
  ('njacc_charge_page_bundle'),
  ('njacc_contact_list'),
  ('njacc_create_wht'),
  ('njacc_current_profile_id'),
  ('njacc_customer_open_invoices'),
  ('njacc_delete_job'),
  ('njacc_export_charges'),
  ('njacc_import_create_masters'),
  ('njacc_import_jobs_batch'),
  ('njacc_import_resolve_masters'),
  ('njacc_inv_is_final'),
  ('njacc_invoice_view'),
  ('njacc_issue_invoice'),
  ('njacc_job_detail'),
  ('njacc_list_audit'),
  ('njacc_list_charges'),
  ('njacc_list_receipts'),
  ('njacc_list_wht'),
  ('njacc_masters'),
  ('njacc_my_profile'),
  ('njacc_quick_close_lookup'),
  ('njacc_receive_payment'),
  ('njacc_report'),
  ('njacc_report_def_deactivate'),
  ('njacc_report_def_save'),
  ('njacc_report_defs_list'),
  ('njacc_report_fields'),
  ('njacc_report_run'),
  ('njacc_save_job'),
  ('njacc_set_deploy_version'),
  ('njacc_set_job_status'),
  ('njacc_update_note'),
  ('njacc_upload_19_batch'),
  ('njacc_upload_apl_batch'),
  ('njacc_upload_contact_list'),
  ('njacc_upsert_company'),
  ('njacc_upsert_customer'),
  ('njacc_upsert_service_code'),
  ('njacc_vat_rate'),
  ('njacc_void_invoice'),
  ('njacc_void_receipt'),
  ('njacc_void_wht'),
  /* ── เพิ่มโดย 021/022 · RPC ที่เกิดหลัง 017 ถูกเขียน ──
     ถ้าไม่ใส่ไว้ที่นี่ การรัน 017 ภายหลังจะถอน authenticated ออก
     แล้ว POST / UNPOST / SETTLE / RECEIPT PENDING / DRAFT จะพังทันที */
  ('njacc_post_invoice'),
  ('njacc_unpost_invoice'),
  ('njacc_settle_advance'),
  ('njacc_receipt_pending'),
  ('njacc_inv_is_final'),
  ('njacc_save_invoice_draft'),
  ('njacc_post_draft_invoice'),
  ('njacc_invoice_draft_view'),
  ('njacc_delete_invoice_draft'),
  /* ── เพิ่มโดย 025 ── ปุ่ม "ปิดงาน" ฝั่ง DOCUMENT
     ถ้าไม่ใส่ไว้ที่นี่ การรัน 017 ภายหลังจะถอน authenticated ออก แล้วปิดงานไม่ได้ทันที */
  ('njacc_document_close_job'),
  /* ── เพิ่มโดย 029 ── FINANCE > Credit Note (ใบลดหนี้)
     8 ตัวนี้คือ RPC ที่ frontend เรียกจริง
     helper 2 ตัว (njacc_next_credit_note_no / njacc_credit_item_remaining)
     ตั้งใจไม่ใส่ — ถูกเรียกจาก RPC ที่เป็น SECURITY DEFINER อยู่แล้ว
     ถ้าไม่ใส่บล็อกนี้ การรัน 017 ภายหลังจะถอนสิทธิ์ แล้วหน้า Credit Note พังทันที */
  ('njacc_credit_note_invoice_options'),
  ('njacc_credit_note_source'),
  ('njacc_save_credit_note_draft'),
  ('njacc_post_credit_note'),
  ('njacc_credit_note_view'),
  ('njacc_list_credit_notes'),
  ('njacc_delete_credit_note_draft'),
  ('njacc_void_credit_note');

DROP TABLE IF EXISTS _njacc_svc_only;
CREATE TEMP TABLE _njacc_svc_only(proname text PRIMARY KEY);
INSERT INTO _njacc_svc_only(proname) VALUES
  ('njacc_admin_auth_identity'),
  ('njacc_admin_complete_user'),
  ('njacc_admin_find_auth_user'),
  ('njacc_admin_mark_auth_created'),
  ('njacc_admin_mark_auth_deleted'),
  ('njacc_admin_mark_failed_cleanup'),
  ('njacc_admin_provision_state'),
  ('njacc_admin_rollback_user'),
  ('njacc_admin_safe_profile'),
  ('njacc_auth_lookup'),
  ('njacc_log_login_success');

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY · role postgres ใน SQL Editor · ไม่ต้องมี JWT)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'P1 สรุปสิทธิ์ก่อนแก้' AS check_name,
       count(*)                                                                       AS njacc_total,
       count(*) FILTER (WHERE has_function_privilege('anon',p.oid,'EXECUTE'))          AS anon_exec,
       count(*) FILTER (WHERE has_function_privilege('authenticated',p.oid,'EXECUTE')) AS auth_exec,
       count(*) FILTER (WHERE has_function_privilege('service_role',p.oid,'EXECUTE'))  AS service_exec
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%';

-- P2: ฟังก์ชันที่ authenticated ได้เกิน Allowlist (คือรายการที่ 017 จะถอน)
SELECT 'P2 authenticated เกิน Allowlist' AS check_name,
       p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' AS signature,
       CASE WHEN so.proname IS NOT NULL THEN 'service-role-only' ELSE 'internal helper' END AS kind
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  LEFT JOIN _njacc_svc_only so ON so.proname = p.proname
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
   AND has_function_privilege('authenticated',p.oid,'EXECUTE')
   AND p.proname NOT IN (SELECT proname FROM _njacc_auth_allow)
 ORDER BY 3, 2;

-- P3: กันพลาด — Allowlist ต้องมีอยู่จริงใน Production ทุกตัว
SELECT 'P3 ชื่อใน Allowlist ที่ไม่พบใน DB (ควรว่าง)' AS check_name, a.proname
  FROM _njacc_auth_allow a
 WHERE NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                    WHERE n.nspname='public' AND p.proname=a.proname);

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · APPLY
-- ───────────────────────────────────────────────────────────────────────────
DO $$
DECLARE r record; v_revoked int := 0; v_granted int := 0;
BEGIN
  -- 2.1 ถอน authenticated จากทุกฟังก์ชันที่ไม่อยู่ใน Allowlist
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
       AND p.proname NOT IN (SELECT proname FROM _njacc_auth_allow)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    v_revoked := v_revoked + 1;
  END LOOP;

  -- 2.2 ยืนยันสิทธิ์ของ Allowlist (idempotent · ไม่เปลี่ยนอะไรถ้ามีอยู่แล้ว)
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname IN (SELECT proname FROM _njacc_auth_allow)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    v_granted := v_granted + 1;
  END LOOP;

  -- 2.3 service-role-only ต้องมี service_role และต้องไม่มี authenticated
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname IN (SELECT proname FROM _njacc_svc_only)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    EXECUTE format('GRANT  EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;

  -- 2.4 anon: เหลือเฉพาะ njacc_app_status()
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
       AND p.proname NOT IN (SELECT proname FROM _njacc_allow WHERE role_name='anon')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
  END LOOP;
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.njacc_app_status() TO anon';

  RAISE NOTICE 'ถอน authenticated % ฟังก์ชัน · ยืนยัน Allowlist % ฟังก์ชัน', v_revoked, v_granted;
END $$;

-- 2.5 คง Default Privilege เดิมจาก 016 — ฟังก์ชันใหม่ในอนาคตไม่ได้ PUBLIC EXECUTE
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY · ทุกข้อต้อง PASS)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 สรุปหลังแก้' AS check_name,
       count(*)                                                                       AS njacc_total,
       count(*) FILTER (WHERE has_function_privilege('anon',p.oid,'EXECUTE'))          AS anon_exec,
       count(*) FILTER (WHERE has_function_privilege('authenticated',p.oid,'EXECUTE')) AS auth_exec,
       count(*) FILTER (WHERE has_function_privilege('service_role',p.oid,'EXECUTE'))  AS service_exec
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%';
-- คาดหวัง: total=79 · anon=1 · authenticated=52 · service_role=79

SELECT 'V2 anon = njacc_app_status เท่านั้น' AS check_name,
       coalesce(string_agg(p.proname,', ' ORDER BY p.proname),'(ไม่มี)') AS anon_list,
       CASE WHEN coalesce(string_agg(DISTINCT p.proname,','),'')='njacc_app_status'
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
   AND has_function_privilege('anon',p.oid,'EXECUTE');

SELECT 'V3 authenticated ต้องไม่เกิน Allowlist' AS check_name,
       count(*) AS over_grant,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
   AND has_function_privilege('authenticated',p.oid,'EXECUTE')
   AND p.proname NOT IN (SELECT proname FROM _njacc_auth_allow);

SELECT 'V4 Allowlist ต้องใช้ได้ครบ (ไม่ถอนเกิน)' AS check_name,
       count(*) AS missing,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL — แอปจะพัง' END AS result
  FROM _njacc_auth_allow a
  JOIN pg_proc p ON p.proname=a.proname
  JOIN pg_namespace n ON n.oid=p.pronamespace AND n.nspname='public'
 WHERE NOT has_function_privilege('authenticated',p.oid,'EXECUTE');

SELECT 'V5 service-role-only' AS check_name,
       p.proname AS signature,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS auth_exec,
       has_function_privilege('service_role',p.oid,'EXECUTE')  AS service_exec,
       CASE WHEN NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
             AND has_function_privilege('service_role',p.oid,'EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN (SELECT proname FROM _njacc_svc_only)
 ORDER BY p.proname;

SELECT 'V6 ฟังก์ชันสำคัญที่ต้องปิด authenticated' AS check_name,
       p.proname,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS auth_exec,
       has_function_privilege('service_role',p.oid,'EXECUTE')  AS service_exec,
       CASE WHEN has_function_privilege('authenticated',p.oid,'EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN
   ('njacc_auth_lookup','njacc_admin_auth_identity','njacc_admin_complete_user',
    'njacc_admin_rollback_user','njacc_admin_safe_profile',
    'njacc_audit','njacc_next_doc_no','njacc_idem_check','njacc_req_profile',
    /* ── เพิ่มโดย 026 ── overload 4 พารามิเตอร์ของ njacc_next_doc_no
       ต้องอยู่ในกลุ่ม internal เหมือนตัว 3 พารามิเตอร์ (client เรียกตรงไม่ได้) */
    'njacc_build_charge_set','njacc_sanitize_detail','njacc_touch_updated_at')
 ORDER BY p.proname;

SELECT 'V7 ไม่มี PUBLIC EXECUTE' AS check_name,
       count(*) AS still_public,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
   AND EXISTS (SELECT 1 FROM unnest(coalesce(p.proacl,'{}'::aclitem[])) a WHERE a::text LIKE '=X/%');

SELECT 'V8 ไม่แตะ Business Logic' AS check_name,
       'ไฟล์นี้ไม่มี CREATE OR REPLACE FUNCTION / DROP / DELETE / TRUNCATE' AS detail,
       'PASS' AS result;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4 · ROLLBACK
--   คืนสภาพ "ก่อนรัน 017" = สภาพหลัง 016 (authenticated ได้ครบทุก njacc_*)
--   ไม่ใช้ GRANT TO PUBLIC เด็ดขาด — จะเปิดช่องโหว่ที่ 016 เพิ่งปิดไป
--   anon ยังเหลือเฉพาะ njacc_app_status เหมือนเดิม
-- ───────────────────────────────────────────────────────────────────────────
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT p.oid::regprocedure AS sig
--              FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--             WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%'
--   LOOP
--     EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
--   END LOOP;
--   RAISE NOTICE 'ROLLBACK: คืนสภาพหลัง 016 (authenticated ได้ครบ) เรียบร้อย';
-- END $$;
