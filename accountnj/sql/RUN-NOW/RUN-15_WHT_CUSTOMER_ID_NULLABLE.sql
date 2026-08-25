-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-15_WHT_CUSTOMER_ID_NULLABLE.sql   *** รันบน Production แล้ว ***
-- แก้บั๊ก: ACTING_AGENT ที่ไม่เลือกลูกค้า บันทึกไม่ได้
--
-- ═══ ROOT CAUSE (พบตอนทดสอบ Save จริง) ════════════════════════════════════
--   RUN-09 ปลดเงื่อนไข customer_id ใน njacc_save_wht_draft แล้ว:
--     IF NOT v_agent AND v_cus IS NULL THEN RAISE 'NJACC_WHT_CUSTOMER_REQUIRED'
--   แต่ *** คอลัมน์ njacc_withholding_docs.customer_id ยังเป็น NOT NULL ***
--   -> RPC ปล่อยผ่าน แต่ INSERT ตายที่ระดับตาราง:
--      ERROR 23502: null value in column "customer_id" violates not-null constraint
--   หน้าเว็บระบุ "เลือกจากลูกค้า (ไม่บังคับ)" อยู่แล้ว
--   -> ผู้ใช้เจอทันทีที่กดบันทึกโดยไม่เลือกลูกค้า (บั๊กบล็อกงานจริง)
--
-- ═══ การแก้ ═══════════════════════════════════════════════════════════════
--   ปลด NOT NULL ที่คอลัมน์ = "ขยายค่าที่รับ" ไม่ใช่การลดการตรวจสอบ
--   ข้อบังคับของ RECEIVED ยังอยู่ครบที่ระดับ RPC ตามเดิมทุกประการ
--   -> RECEIVED ที่ไม่ส่ง customer_id ยังถูกปฏิเสธด้วย NJACC_WHT_CUSTOMER_REQUIRED
--   ไม่มี DROP / DELETE / UPDATE ข้อมูล · แถวเดิมทุกแถวยังมี customer_id ครบ
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.njacc_withholding_docs
  ALTER COLUMN customer_id DROP NOT NULL;

COMMENT ON COLUMN public.njacc_withholding_docs.customer_id IS
  'ลูกค้าอ้างอิง — RECEIVED บังคับมี (ตรวจที่ njacc_save_wht_draft)
   ACTING_AGENT ไม่บังคับ เพราะผู้มีหน้าที่หักภาษีกรอกเองในช่อง payer_*';

-- ── VERIFY ────────────────────────────────────────────────────────────────
SELECT 'V1 customer_id เป็น NULL ได้แล้ว' AS check_item,
       CASE WHEN (SELECT is_nullable FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name='customer_id') = 'YES'
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 RECEIVED ยังบังคับ customer_id ที่ระดับ RPC',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%IF NOT v_agent AND v_cus IS NULL THEN RAISE EXCEPTION ''NJACC_WHT_CUSTOMER_REQUIRED''%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 ข้อมูลเดิมไม่ถูกแตะ (ทุกแถวยังมี customer_id)',
       CASE WHEN (SELECT count(*) FROM public.njacc_withholding_docs
                   WHERE customer_id IS NULL AND direction='RECEIVED') = 0
            THEN 'PASS' ELSE 'FAIL' END;
