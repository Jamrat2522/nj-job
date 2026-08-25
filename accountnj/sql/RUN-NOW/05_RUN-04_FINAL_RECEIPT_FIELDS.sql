-- ═══════════════════════════════════════════════════════════════════════════
-- 05_RUN-04_FINAL_RECEIPT_FIELDS.sql
-- njacc_list_receipts — ฟิลด์เอกสารใบเสร็จ + WHT Breakdown ตามอัตราจริง
--
-- ⚠️ ยังไม่รัน — รอคำสั่ง
-- ⚠️ ไฟล์นี้ "แทนที่" sql/LEGACY-DO-NOT-RUN/RUN_2_RECEIPT.sql ทั้งตัว
--    (RUN_2 ยังไม่เคยรัน · เนื้อหาถูกยกมาไว้ที่นี่ครบแล้ว + เพิ่ม wht_breakdown)
--    *** ห้ามรัน RUN_2_RECEIPT.sql ***
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ROOT CAUSE — ทำไมต้องมีไฟล์นี้
-- ═══════════════════════════════════════════════════════════════════════════
--   ตรวจ pg_get_functiondef ของ njacc_list_receipts บน Production จริง
--   ปัจจุบันคืนต่อ 1 ใบเสร็จเพียง:
--     id · receipt_no · receipt_date · total_received · status ·
--     customer_name · payment_no · method · invoices=[{invoice_no, amount}]
--
--   เอกสารใบเสร็จ (assets/js/receipts/receipt-doc.js) ต้องใช้เพิ่ม:
--     ฝั่งลูกค้า    tax_id · branch_code · address · phone
--     ฝั่งใบแจ้งหนี้ invoice_date · charge_type · subtotal · vat_amount ·
--                   vat_rate · wht_amount · total_amount · description
--     *** และ wht_breakdown = WHT แยกตามอัตราจริงรายบรรทัด ***
--
--   ทำไมต้องมี wht_breakdown:
--     njacc_invoices เก็บ wht_amount รวมของทั้งใบ แต่ "ไม่มี" คอลัมน์ wht_rate
--     (ตรวจ information_schema.columns แล้ว — njacc_invoices ไม่มี wht_rate)
--     อัตราจริงอยู่รายบรรทัดที่ njacc_invoice_items.wht_rate (migration 018 · รันแล้ว)
--     1 ใบแจ้งหนี้จึงมีได้หลายอัตราพร้อมกัน เช่น
--         รายการ A ขนส่ง  WHT 1% = 10
--         รายการ B บริการ WHT 3% = 30
--     ถ้าไม่ส่ง breakdown มา เอกสารจะไม่มีทางรู้อัตราจริง
--     -> จะต้องเดา ซึ่งห้ามเด็ดขาด
--
--   โครงสร้างที่ส่งกลับ (ต่อ 1 ใบแจ้งหนี้):
--     "wht_breakdown": [ {"rate":1,"amount":10}, {"rate":3,"amount":30} ]
--     เรียงตาม rate · รวมยอดต่ออัตราแล้ว · ไม่ใส่บรรทัดที่ wht_amount = 0
--     ใบที่ไม่มี WHT เลย -> []
--
--   ฝั่ง Renderer เฉลี่ยตาม ratio = allocation / net_receivable เหมือนช่องอื่น
--   (net_receivable = total_amount − wht_amount) -> Partial Payment ก็ถูกต้อง
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ขอบเขต — READ PATH ล้วน
-- ═══════════════════════════════════════════════════════════════════════════
--   แก้เฉพาะ "คีย์ที่คืนกลับ" ของ njacc_list_receipts ตัวเดียว
--   ไม่แตะ: ตาราง · คอลัมน์ · index · RLS · policy · trigger · sequence
--           njacc_receive_payment · njacc_void_receipt · njacc_receipt_pending
--           njacc_customer_open_invoices · Single Payment Rule ของ RUN-03
--           Receipt Number Logic · Invoice Number Logic · VAT/WHT Business Logic
--           POST/UNPOST · Payment Allocation · Credit Note
--           Customer/Service Master · Permission · Role · Auth
--   ไม่มี INSERT / UPDATE / DELETE / DROP / TRUNCATE / ALTER TABLE
--   คีย์เดิมทุกตัวยังอยู่ครบ (payment_no / method ที่หน้าตารางใช้อยู่)
--   -> receipt-page.js เดิมไม่พัง
--   การตรวจสิทธิ์เดิม njacc_can('*','*','view') + role guard ยังอยู่ทุกบรรทัด
--
-- Dependency : ต้องมี njacc_invoice_items.wht_rate (migration 018 — รันแล้ว)
--              ไม่ผูกกับ 02 / 03 / 04 · รันก่อนหรือหลังก็ได้
--
-- ROLLBACK   : รัน block CREATE OR REPLACE ของ njacc_list_receipts จากไฟล์เดิม
--              sql/005_njacc_rpc.sql
--              เอกสารกลับไปแสดง "-" ในช่องภาษี · ไม่มีข้อมูลเสียหาย
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
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_invoice_items'
         AND column_name IN ('description','wht_rate','wht_amount')) <> 3 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_items.wht_rate (ต้องรัน 018 ก่อน)';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

SELECT 'P1 ใบเสร็จปัจจุบัน' AS check_name, count(*) AS receipts,
       count(*) FILTER (WHERE status='VOID') AS voided
  FROM public.njacc_receipts;

-- อัตรา WHT ที่มีอยู่จริงในระบบ — ยืนยันว่าไม่ได้ hardcode 3%
SELECT 'P2 อัตรา WHT จริงในระบบ' AS check_name,
       coalesce(wht_rate,0) AS wht_rate, count(*) AS item_lines,
       round(sum(wht_amount),2) AS total_wht
  FROM public.njacc_invoice_items
 WHERE coalesce(wht_amount,0) <> 0
 GROUP BY coalesce(wht_rate,0) ORDER BY 2;


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
           /* ── ข้อมูลลูกค้าสำหรับหัวเอกสาร ── */
           c.tax_id      AS customer_tax_id,
           c.branch_code AS customer_branch_code,
           c.address     AS customer_address,
           c.phone       AS customer_phone,
           (SELECT coalesce(jsonb_agg(jsonb_build_object(
                     'invoice_no', i.invoice_no,
                     'amount', ra.amount,
                     'invoice_date', i.invoice_date,
                     'charge_type',  i.charge_type,
                     /* ใช้เฉลี่ยภาษีตามสัดส่วนที่ตัดชำระ */
                     'subtotal',     i.subtotal,
                     'vat_amount',   i.vat_amount,
                     'vat_rate',     i.vat_rate,
                     'wht_amount',   i.wht_amount,
                     'total_amount', i.total_amount,
                     /* ── WHT แยกตามอัตราจริงรายบรรทัด ──
                        njacc_invoices ไม่มีคอลัมน์ wht_rate (ตรวจ schema แล้ว)
                        อัตราจริงอยู่ที่ njacc_invoice_items.wht_rate (migration 018)
                        1 ใบมีได้หลายอัตรา -> ส่งเป็น array ให้เอกสารแสดงตามจริง
                        ไม่ใส่บรรทัดที่ wht_amount = 0 · ไม่มี WHT เลย -> [] */
                     'wht_breakdown', (
                        SELECT coalesce(jsonb_agg(jsonb_build_object(
                                 'rate', b.rate, 'amount', b.amt) ORDER BY b.rate),'[]'::jsonb)
                          FROM (SELECT coalesce(x2.wht_rate,0) AS rate,
                                       round(sum(x2.wht_amount),2) AS amt
                                  FROM public.njacc_invoice_items x2
                                 WHERE x2.invoice_id = i.id
                                   AND coalesce(x2.wht_amount,0) <> 0
                                 GROUP BY coalesce(x2.wht_rate,0)) b),
                     /* Description จากรายการจริงของใบนั้น
                        1 ใบมีหลายรายการ -> รวมเป็นบรรทัดเดียวคั่นด้วย ", "
                        เรียงตาม line_no เดิม เพื่อให้ตรงกับใบแจ้งหนี้เป๊ะ
                        (ไม่แยก Row เพิ่ม เพราะ 1 แถว = 1 ใบแจ้งหนี้ = 1 ยอดที่ตัดชำระ
                         ทำให้ยอดในตารางกับ receipt_allocations ตรงกัน 1:1) */
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
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
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
SELECT 'V3 wht_breakdown มีจริง และอ่านจาก invoice_items',
       CASE WHEN c LIKE '%wht_breakdown%'
             AND c LIKE '%njacc_invoice_items x2%'
             AND c LIKE '%x2.wht_rate%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V4 ไม่ hardcode อัตรา WHT ในฟังก์ชัน',
       CASE WHEN c NOT LIKE '%''rate'', 3%' AND c NOT LIKE '%''rate'',3%'
             AND c NOT LIKE '%''rate'', 1%' AND c NOT LIKE '%''rate'',1%'
            THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V5 คีย์เดิมยังอยู่ครบ (หน้าตารางไม่พัง)',
       CASE WHEN c LIKE '%payment_no%' AND c LIKE '%pm.method%'
             AND c LIKE '%total_received%' AND c LIKE '%''invoice_no''%'
             AND c LIKE '%''amount'', ra.amount%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V6 ตรวจสิทธิ์เดิมยังอยู่',
       CASE WHEN c LIKE '%NJACC_FORBIDDEN%' AND c LIKE '%SUPER_ADMIN%'
            THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V7 pagination เดิมยังอยู่',
       CASE WHEN c LIKE '%OFFSET v_off LIMIT v_size%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V8 SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_receipts')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V9 anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('anon',
              'public.njacc_list_receipts(uuid,date,date,integer,integer)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END
UNION ALL
SELECT 'V10 authenticated ยังเรียกได้',
       CASE WHEN has_function_privilege('authenticated',
              'public.njacc_list_receipts(uuid,date,date,integer,integer)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END;

-- V11 · ตัวอย่างผลจริง — ตรวจว่า wht_breakdown ตรงกับ wht_amount ของใบ
SELECT 'V11 wht_breakdown = wht_amount ของใบ' AS check_name,
       i.invoice_no, i.wht_amount AS invoice_wht,
       coalesce((SELECT round(sum(x.wht_amount),2) FROM public.njacc_invoice_items x
                  WHERE x.invoice_id=i.id AND coalesce(x.wht_amount,0)<>0),0) AS items_wht,
       CASE WHEN abs(coalesce(i.wht_amount,0)
                   - coalesce((SELECT sum(x.wht_amount) FROM public.njacc_invoice_items x
                                WHERE x.invoice_id=i.id),0)) <= 0.005
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_invoices i
 WHERE i.status IN ('ISSUED','POSTED')
 ORDER BY i.invoice_no;

-- V12 · ข้อมูลไม่ถูกแตะ
SELECT 'V12 ข้อมูล' AS check_name,
       'receipts='||(SELECT count(*) FROM public.njacc_receipts)::text
     ||' alloc='||(SELECT count(*) FROM public.njacc_receipt_allocations)::text
     ||' payments='||(SELECT count(*) FROM public.njacc_payments)::text AS detail;
