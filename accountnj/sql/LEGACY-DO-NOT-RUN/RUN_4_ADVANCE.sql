-- ═══════════════════════════════════════════════════════════════════════════
-- RUN_4_ADVANCE.sql       ★ ฟอร์ม: ADVANCE PAYMENT / ใบรับชำระเงินล่วงหน้า (ทดรองจ่าย)
-- ═══════════════════════════════════════════════════════════════════════════
-- รันไฟล์นี้ไฟล์เดียวจบ (มี PREFLIGHT + MIGRATION + VERIFY ในตัว)
-- ความเสี่ยง : ต่ำมาก — READ PATH ล้วน
--              ไม่มี ALTER TABLE / INSERT / UPDATE / DELETE / DROP / TRUNCATE
-- รันซ้ำได้  : ได้ ไม่จำกัดครั้ง
-- ลำดับ      : รันก่อน/หลังไฟล์อื่นก็ได้ ไม่ผูกกัน
--
-- ── ได้อะไร ────────────────────────────────────────────────────────────────
--   ช่องบนเอกสารทดรองจ่ายที่ตอนนี้ขึ้น "-" จะมีค่าจริง:
--     Customer Tel.  (njacc_customers.phone)
--     NOTE / หมายเหตุ (njacc_jobs.note)
--   (ตรวจจาก assets/js/finance/advance-doc.js จริง: ใช้ inv.customer_phone
--    และ inv.job_note ซึ่ง RPC ปัจจุบันยังไม่ส่งมา จึงซ่อน Section ไว้)
--
-- ⚠️⚠️ อ่านก่อนรัน — ไฟล์นี้ใช้ RPC ตัวเดียวกับ INVOICE ⚠️⚠️
--   ระบบไม่มี RPC แยกของทดรองจ่าย  ทั้ง 2 ฟอร์มอ่าน njacc_invoice_view ตัวเดียวกัน
--     INVOICE  : assets/js/invoices/invoice-view.js       -> api.invoiceView()
--     ADVANCE  : assets/js/charges/charge-page.js act='apdoc' -> api.invoiceView()
--
--   ผลที่ตามมา (ตั้งใจ ไม่ใช่ผลข้างเคียงที่ควบคุมไม่ได้):
--     • รันไฟล์นี้ -> ใบ INVOICE ที่ POST แล้ว จะได้ Decl No./Master B/L/
--       Company Invoice/Created By เพิ่มไปด้วย  (เป็นการ "เพิ่มคีย์" ไม่ลบของเดิม)
--     • หน้าต่างร่าง/ออกวางบิลของ INVOICE ยังไม่ครบ ต้องรัน RUN_1_INVOICE.sql
--     • BLOCK njacc_invoice_view ในไฟล์นี้ "เหมือน RUN_1 ทุกตัวอักษร"
--       -> รัน RUN_1 แล้วรันไฟล์นี้ หรือสลับกัน ผลลัพธ์เท่ากันเป๊ะ ไม่พัง
--
--   ถ้าจะรันแค่ไฟล์เดียวให้ครบทั้ง INVOICE และ ทดรองจ่าย -> รัน RUN_1_INVOICE.sql
--
-- ── สิ่งที่ไม่แตะ ───────────────────────────────────────────────────────────
--   ตาราง · คอลัมน์ · index · RLS · policy · trigger · sequence
--   njacc_settle_advance (PENDING/PAID/SETTLED) · advance_status · Advance Master
--   njacc_invoice_draft_view · Receipt · Credit Note · Permission · Role · Auth
--
-- ROLLBACK : รัน block CREATE OR REPLACE ของ njacc_invoice_view จากไฟล์เดิม
--            sql/005_njacc_rpc.sql — เอกสารกลับไปแสดง "-" · ไม่มีข้อมูลเสียหาย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ไม่เปลี่ยนอะไร)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_view') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_view'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers' AND column_name='phone') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.phone'; END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_jobs'
         AND column_name IN ('customs_declaration_no','master_bl_no','house_bl_no','note')) <> 4 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — คอลัมน์อ้างอิงใน njacc_jobs ไม่ครบ'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_jobs' AND column_name='advance_status') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_jobs.advance_status (ต้องรัน 019 ก่อน)'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS — พร้อมเพิ่มฟิลด์เอกสารทดรองจ่าย (read path เท่านั้น)';
END $preflight$;

SELECT 'P1 งานทดรองจ่ายปัจจุบัน' AS check_name,
       count(*)                                            AS advance_invoices,
       count(*) FILTER (WHERE status='POSTED')             AS posted,
       (SELECT count(*) FROM public.njacc_invoices)        AS all_invoices
  FROM public.njacc_invoices WHERE charge_type='ADVANCE';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ═══ BLOCK ที่ใช้ร่วมกันระหว่าง RUN_1_INVOICE.sql และ RUN_4_ADVANCE.sql ═══
--   njacc_invoice_view คือ RPC "ตัวเดียวกัน" ที่ทั้ง 2 เอกสารอ่าน
--     INVOICE      : assets/js/invoices/invoice-view.js  -> api.invoiceView()
--     ADVANCE      : assets/js/charges/charge-page.js act='apdoc' -> api.invoiceView()
--   BLOCK นี้ใน 2 ไฟล์ "เหมือนกันทุกตัวอักษร" -> รันไฟล์ไหนก่อนก็ได้
--   รันซ้ำได้ไม่จำกัด (CREATE OR REPLACE ด้วยเนื้อเดียวกัน = ผลลัพธ์เดิม)
CREATE OR REPLACE FUNCTION public.njacc_invoice_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  SELECT to_jsonb(i) || jsonb_build_object(
    'customer', (SELECT jsonb_build_object('name',customer_name,'tax_id',tax_id,
       'address',address,'branch_code',branch_code,
       'phone',phone)                                   /* ← เพิ่ม: Tel. บนเอกสาร */
       FROM public.njacc_customers WHERE id=i.customer_id),
    'job', (SELECT jsonb_build_object('job_no',job_no,'customer_job_no',customer_job_no,
       'house_bl_no',house_bl_no,'source_invoice_no',source_invoice_no,
       'customs_declaration_no',customs_declaration_no,  /* ← เพิ่ม: Decl No. */
       'master_bl_no',master_bl_no,                      /* ← เพิ่ม: Master */
       'note',note)                                      /* ← เพิ่ม: REMARKS / NOTE */
       FROM public.njacc_jobs WHERE id=i.job_id),
    /* ← เพิ่ม: Company Invoice (ของเดิมมีเฉพาะฝั่ง draft_view) */
    'company_invoice', (SELECT ci.company_name
       FROM public.njacc_jobs j2
       JOIN public.njacc_company_invoices ci ON ci.id = j2.company_invoice_id
      WHERE j2.id = i.job_id),
    /* ← เพิ่ม: Created By — ชื่อผู้ออกใบ ถ้าไม่มีใช้ผู้ POST */
    'created_by_name', (SELECT p.full_name FROM public.njacc_profiles p
       WHERE p.id = coalesce(i.issued_by, i.posted_by)),
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.line_no),'[]'::jsonb)
       FROM public.njacc_invoice_items x WHERE x.invoice_id=i.id),
    'paid', coalesce((SELECT sum(allocated_amount) FROM public.njacc_payment_allocations pa
       JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       WHERE pa.invoice_id=i.id),0))
  INTO v FROM public.njacc_invoices i WHERE i.id=p_id;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(v->>'charge_type', v->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN v;
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_invoice_view(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_invoice_view(uuid) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY)  — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
WITH a AS (SELECT pg_get_functiondef('public.njacc_invoice_view(uuid)'::regprocedure) AS c)
SELECT 'V1 ฟิลด์ที่ทดรองจ่ายต้องใช้ ครบแล้ว' AS check_name,
       CASE WHEN c LIKE '%''phone'',phone%' AND c LIKE '%''note'',note%'
            THEN 'PASS' ELSE 'FAIL' END AS result FROM a
UNION ALL
SELECT 'V2 ฟิลด์อ้างอิงงาน ครบ',
       CASE WHEN c LIKE '%source_invoice_no%' AND c LIKE '%customs_declaration_no%'
             AND c LIKE '%master_bl_no%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V3 คีย์เดิมยังอยู่ครบ (INVOICE ไม่พัง)',
       CASE WHEN c LIKE '%''paid''%' AND c LIKE '%''items''%'
             AND c LIKE '%NJACC_INVOICE_NOT_FOUND%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V4 ตรวจสิทธิ์เดิมยังอยู่',
       CASE WHEN c LIKE '%njacc_can(v->>''charge_type''%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V5 anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('anon','public.njacc_invoice_view(uuid)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END
UNION ALL
SELECT 'V6 authenticated ยังเรียกได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_invoice_view(uuid)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 njacc_settle_advance ไม่ถูกแตะ',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_settle_advance')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 ข้อมูลไม่ถูกแตะ (เทียบกับ P1 ต้องเท่าเดิม)',
       'advance='||(SELECT count(*) FROM public.njacc_invoices WHERE charge_type='ADVANCE')::text
     ||' all_invoices='||(SELECT count(*) FROM public.njacc_invoices)::text
     ||' jobs='||(SELECT count(*) FROM public.njacc_jobs)::text;
