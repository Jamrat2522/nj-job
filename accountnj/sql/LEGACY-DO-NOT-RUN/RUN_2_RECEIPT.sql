-- ═══════════════════════════════════════════════════════════════════════════
-- RUN_2_RECEIPT.sql       ★ ฟอร์ม: RECEIPT / ใบเสร็จรับเงิน
-- ═══════════════════════════════════════════════════════════════════════════
-- รันไฟล์นี้ไฟล์เดียวจบ (มี PREFLIGHT + MIGRATION + VERIFY ในตัว)
-- ความเสี่ยง : ต่ำมาก — READ PATH ล้วน
--              ไม่มี ALTER TABLE / INSERT / UPDATE / DELETE / DROP / TRUNCATE
-- รันซ้ำได้  : ได้ ไม่จำกัดครั้ง
-- ลำดับ      : รันก่อน/หลังไฟล์อื่นก็ได้ ไม่ผูกกัน
-- อิสระ 100% : แก้ RPC njacc_list_receipts ตัวเดียว ไม่ใช้ร่วมกับฟอร์มอื่นเลย
--
-- ── ได้อะไร ────────────────────────────────────────────────────────────────
--   ช่องบนใบเสร็จที่ตอนนี้ขึ้น "-" จะมีค่าจริง:
--     Customer Tax ID · Branch · Address · Tel.
--     Invoice Date · Description ในตารางอ้างอิงใบแจ้งหนี้
--     SubTotal · VAT % · Withholding Tax  (Summary ปัจจุบันเหลือ Total อย่างเดียว)
--
-- ── ทำไมถึงจำเป็น (ตรวจ pg_get_functiondef ของ Production จริง ไม่ได้เดา) ──
--   njacc_list_receipts เวอร์ชันที่รันอยู่ คืนต่อ 1 ใบเสร็จเพียง:
--     id · receipt_no · receipt_date · total_received · status ·
--     customer_name · payment_no · method · invoices=[{invoice_no, amount}]
--   ข้อมูลที่ขาดมีอยู่ครบในตารางแล้ว (njacc_customers / njacc_invoices /
--   njacc_invoice_items) แค่ไม่ถูก select ออกมา
--   -> Frontend ไม่มีทางแสดงได้ถ้าไม่แก้ RPC (ห้ามยิงตารางตรงเพราะ RLS/สิทธิ์)
--
--   charge_type ใช้ทำอะไร: กันรายการ ADVANCE ไม่ให้ขึ้นเป็นรายการขายในใบเสร็จ
--     โดยตัดสินจากค่าจริงในฐานข้อมูล ไม่ใช่เดาจากข้อความ
--
-- ── สิ่งที่ไม่แตะ ───────────────────────────────────────────────────────────
--   ตาราง · คอลัมน์ · index · RLS · policy · trigger · sequence
--   Receipt Number Logic (njacc_receive_payment) · Invoice Number Logic
--   VAT/WHT Business Logic · POST/UNPOST · Payment Allocation
--   Customer/Service/Advance Master · DOCUMENT/ACCOUNTING Workflow
--   Permission · Role · Auth · RPC อื่นทุกตัว
--   คีย์เดิมทุกตัวยังอยู่ครบ (รวม method/payment_no ที่หน้าตารางใช้อยู่)
--   -> receipt-page.js เดิมไม่พัง
--
-- ROLLBACK : รัน block CREATE OR REPLACE ของ njacc_list_receipts จากไฟล์เดิม
--            sql/005_njacc_rpc.sql — เอกสารกลับไปแสดง "-" · ไม่มีข้อมูลเสียหาย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_list_receipts') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_list_receipts'; END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_customers'
         AND column_name IN ('tax_id','branch_code','address','phone')) <> 4 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — คอลัมน์ลูกค้าไม่ครบ'; END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_invoices'
         AND column_name IN ('invoice_date','charge_type','subtotal','vat_amount',
                             'vat_rate','wht_amount','total_amount')) <> 7 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — คอลัมน์ใบแจ้งหนี้ไม่ครบ'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_invoice_items'
                    AND column_name='description') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_items.description'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS — พร้อมเพิ่มฟิลด์เอกสารใบเสร็จ (read path เท่านั้น)';
END $preflight$;

SELECT 'P1 ใบเสร็จปัจจุบัน' AS check_name, count(*) AS receipts,
       count(*) FILTER (WHERE status='VOID') AS voided
  FROM public.njacc_receipts;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

CREATE OR REPLACE FUNCTION public.njacc_list_receipts(
  p_customer uuid DEFAULT NULL::uuid, p_from date DEFAULT NULL::date,
  p_to date DEFAULT NULL::date, p_page integer DEFAULT 1, p_size integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_receipts r
   WHERE (p_customer IS NULL OR r.customer_id=p_customer)
     AND (p_from IS NULL OR r.receipt_date>=p_from) AND (p_to IS NULL OR r.receipt_date<=p_to);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT r.id, r.receipt_no, r.receipt_date, r.total_received, r.status,
           c.customer_name, pm.payment_no, pm.method,
           /* ── เพิ่ม: ข้อมูลลูกค้าสำหรับหัวเอกสาร ── */
           c.tax_id      AS customer_tax_id,
           c.branch_code AS customer_branch_code,
           c.address     AS customer_address,
           c.phone       AS customer_phone,
           (SELECT coalesce(jsonb_agg(jsonb_build_object(
                     'invoice_no', i.invoice_no,
                     'amount', ra.amount,
                     /* ── เพิ่ม: ใช้ในตารางอ้างอิงใบแจ้งหนี้ ── */
                     'invoice_date', i.invoice_date,
                     'charge_type',  i.charge_type,
                     /* ── เพิ่ม: ใช้เฉลี่ยภาษีตามสัดส่วนที่ตัดชำระ ── */
                     'subtotal',     i.subtotal,
                     'vat_amount',   i.vat_amount,
                     'vat_rate',     i.vat_rate,
                     'wht_amount',   i.wht_amount,
                     'total_amount', i.total_amount,
                     /* ── เพิ่ม: Description จากรายการจริงของใบนั้น ──
                        1 ใบมีหลายรายการ -> รวมเป็นบรรทัดเดียวคั่นด้วย ", "
                        เรียงตาม line_no เดิม เพื่อให้ตรงกับใบแจ้งหนี้เป๊ะ
                        (ไม่แยก Row เพิ่ม เพราะ 1 แถว = 1 ใบแจ้งหนี้ = 1 ยอดที่ตัดชำระ
                         ทำให้ยอดในตารางกับ receipt_allocations ตรงกัน 1:1 ตรวจสอบย้อนหลังได้) */
                     'description', (SELECT string_agg(x.description, ', ' ORDER BY x.line_no)
                                       FROM public.njacc_invoice_items x
                                      WHERE x.invoice_id = i.id)
                   ) ORDER BY i.invoice_no),'[]'::jsonb)
              FROM public.njacc_receipt_allocations ra
              JOIN public.njacc_invoices i ON i.id=ra.invoice_id WHERE ra.receipt_id=r.id) AS invoices
      FROM public.njacc_receipts r
      JOIN public.njacc_customers c ON c.id=r.customer_id
      JOIN public.njacc_payments pm ON pm.id=r.payment_id
     WHERE (p_customer IS NULL OR r.customer_id=p_customer)
       AND (p_from IS NULL OR r.receipt_date>=p_from) AND (p_to IS NULL OR r.receipt_date<=p_to)
     ORDER BY r.receipt_date DESC, r.receipt_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_list_receipts(uuid,date,date,integer,integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_list_receipts(uuid,date,date,integer,integer) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
WITH a AS (SELECT pg_get_functiondef(p.oid) AS c
             FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='public' AND p.prokind='f' AND p.proname='njacc_list_receipts')
SELECT 'V1 ฟิลด์ลูกค้าครบ' AS check_name,
       CASE WHEN c LIKE '%customer_tax_id%' AND c LIKE '%customer_branch_code%'
             AND c LIKE '%customer_address%' AND c LIKE '%customer_phone%'
            THEN 'PASS' ELSE 'FAIL' END AS result FROM a
UNION ALL
SELECT 'V2 ฟิลด์ใบแจ้งหนี้ครบ',
       CASE WHEN c LIKE '%''invoice_date''%' AND c LIKE '%''charge_type''%'
             AND c LIKE '%''subtotal''%' AND c LIKE '%''vat_amount''%'
             AND c LIKE '%''wht_amount''%' AND c LIKE '%''total_amount''%'
             AND c LIKE '%''description''%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V3 คีย์เดิมยังอยู่ครบ (หน้าตารางไม่พัง)',
       CASE WHEN c LIKE '%payment_no%' AND c LIKE '%pm.method%'
             AND c LIKE '%total_received%' AND c LIKE '%''invoice_no''%'
             AND c LIKE '%''amount'', ra.amount%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V4 ตรวจสิทธิ์เดิมยังอยู่',
       CASE WHEN c LIKE '%NJACC_FORBIDDEN%' AND c LIKE '%SUPER_ADMIN%'
            THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V5 pagination เดิมยังอยู่',
       CASE WHEN c LIKE '%OFFSET v_off LIMIT v_size%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V6 anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('anon',
              'public.njacc_list_receipts(uuid,date,date,integer,integer)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END
UNION ALL
SELECT 'V7 authenticated ยังเรียกได้',
       CASE WHEN has_function_privilege('authenticated',
              'public.njacc_list_receipts(uuid,date,date,integer,integer)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 ข้อมูลไม่ถูกแตะ',
       'receipts='||(SELECT count(*) FROM public.njacc_receipts)::text
     ||' alloc='||(SELECT count(*) FROM public.njacc_receipt_allocations)::text
     ||' payments='||(SELECT count(*) FROM public.njacc_payments)::text;
