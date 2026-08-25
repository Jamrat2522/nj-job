-- ═══════════════════════════════════════════════════════════════════════════
-- RUN_3B_CREDIT_NOTE_FIX_GRANTS.sql
-- แก้ผลตรวจ V5 ของ RUN_3_CREDIT_NOTE.sql ที่ขึ้น FAIL
--
-- รันหลังจาก RUN_3_CREDIT_NOTE.sql เท่านั้น
-- ความเสี่ยง : ต่ำมาก — คำสั่ง REVOKE 2 บรรทัด
--              ไม่มี CREATE / ALTER TABLE / INSERT / UPDATE / DELETE / DROP / TRUNCATE
--              ไม่แตะตาราง · ข้อมูล · RPC · Business Logic แม้แต่บรรทัดเดียว
-- รันซ้ำได้  : ได้ ไม่จำกัดครั้ง (REVOKE ที่ถูกถอนไปแล้วไม่ error)
--
-- ═══ ROOT CAUSE ═══════════════════════════════════════════════════════════
--   RUN_3 เขียนว่า  REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon;
--   แต่ Supabase ตั้ง ALTER DEFAULT PRIVILEGES ไว้ให้
--       GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role
--   ฟังก์ชันใหม่จึงได้สิทธิ์ authenticated มา "โดยตรง" ไม่ได้มาผ่าน PUBLIC
--   -> การ REVOKE จาก PUBLIC ไม่ลบสิทธิ์ก้อนนี้
--
--   ACL จริงที่ตรวจพบ (pg_proc.proacl) :
--       postgres=X/postgres | authenticated=X/postgres | service_role=X/postgres
--                             ^^^^^^^^^^^^^ ตัวที่ต้องถอน
--
-- ═══ กระทบอะไร ════════════════════════════════════════════════════════════
--   njacc_next_credit_note_no(date)
--       ผู้ใช้ที่ล็อกอินยิง RPC ตรงได้ -> เดินเลข CD{YYYYMM}-##### ทิ้งเปล่า
--       ทำให้เลขเอกสารขาดช่วงโดยไม่มีใบจริง  ← ปัญหาเชิงความถูกต้องของเลขเอกสาร
--   njacc_credit_item_remaining(uuid, uuid)
--       อ่านอย่างเดียว ไม่มี njacc_can() ในตัว
--       ถ้ารู้ uuid ของบรรทัด Invoice จะอ่านยอดคงเหลือได้  ← ข้อมูลรั่วเล็กน้อย
--
-- ═══ ทำไมถอนแล้วระบบไม่พัง ════════════════════════════════════════════════
--   helper 2 ตัวนี้ถูกเรียกจากภายใน RPC หลัก 8 ตัวเท่านั้น
--   RPC ทั้ง 8 เป็น SECURITY DEFINER · owner = postgres
--   -> ตอนทำงานจริงรันด้วยสิทธิ์ postgres ซึ่งยังมี EXECUTE ครบ
--   -> Frontend ไม่เคยเรียก helper 2 ตัวนี้โดยตรง
--      (ตรวจ assets/js/finance/credit-note-api.js แล้ว มีแค่ 8 RPC หลัก)
--   สอดคล้องกับ 017_rpc_permission_matrix_repair.sql ที่ตั้งใจไม่ใส่ 2 ชื่อนี้
--   ใน authenticated allowlist อยู่แล้ว
--
-- ROLLBACK (ถ้าจำเป็นจริง ๆ) :
--   GRANT EXECUTE ON FUNCTION public.njacc_next_credit_note_no(date) TO authenticated;
--   GRANT EXECUTE ON FUNCTION public.njacc_credit_item_remaining(uuid, uuid) TO authenticated;
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_next_credit_note_no') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN_3_CREDIT_NOTE.sql'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_credit_item_remaining') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN_3_CREDIT_NOTE.sql'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

SELECT 'P1 สิทธิ์ก่อนแก้' AS check_name, p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec_before
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit%'
 ORDER BY p.proname;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · FIX  (REVOKE 2 บรรทัด · ไม่มีคำสั่งอื่นเลย)
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

REVOKE EXECUTE ON FUNCTION public.njacc_next_credit_note_no(date)
  FROM authenticated, anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.njacc_credit_item_remaining(uuid, uuid)
  FROM authenticated, anon, PUBLIC;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V5 auth grants' AS check_name, p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
       CASE WHEN p.proname IN ('njacc_next_credit_note_no','njacc_credit_item_remaining')
            THEN CASE WHEN has_function_privilege('authenticated', p.oid,'EXECUTE')
                      THEN 'FAIL' ELSE 'PASS' END
            ELSE CASE WHEN has_function_privilege('authenticated', p.oid,'EXECUTE')
                      THEN 'PASS' ELSE 'FAIL' END END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit%'
 ORDER BY p.proname;

SELECT 'V4 anon ยังถูกบล็อกครบ' AS check_name,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')) AS anon_exec,
       CASE WHEN count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit%';

SELECT 'V15 owner ยังเรียกได้ (RPC ภายในไม่พัง)' AS check_name, p.proname,
       has_function_privilege('postgres', p.oid, 'EXECUTE') AS owner_exec,
       CASE WHEN has_function_privilege('postgres', p.oid, 'EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
   AND p.proname IN ('njacc_next_credit_note_no','njacc_credit_item_remaining')
 ORDER BY p.proname;

SELECT 'V16 ข้อมูลไม่ถูกแตะ' AS check_name,
       'credit_notes='||(SELECT count(*) FROM public.njacc_credit_notes)::text
     ||' items='||(SELECT count(*) FROM public.njacc_credit_note_items)::text
     ||' invoices='||(SELECT count(*) FROM public.njacc_invoices)::text AS detail;
