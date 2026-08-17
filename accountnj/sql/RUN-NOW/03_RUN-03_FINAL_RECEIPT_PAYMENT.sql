-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-03_FINAL_RECEIPT_PAYMENT.sql
-- CRITICAL FIX — Single Payment Rule เดียวกันทั้งระบบ + เลขใบเสร็จ RCP{YYYYMM}-#####
--
-- ⚠️ ยังไม่รัน — รอคำสั่ง "รันได้"
-- ⚠️ ต้องรัน RUN-01_FINAL_DOCUMENT_NUMBERS.sql ก่อน (ต้องมี njacc_next_month_doc_no)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ROOT CAUSE — ตรวจ pg_get_functiondef บน Production จริง 17/08/2026
-- ═══════════════════════════════════════════════════════════════════════════
--   ระบบมี "กติกาการรับชำระ" อยู่ 4 ที่ และทั้ง 4 ที่ไม่ตรงกันเลย
--
--   1) njacc_post_draft_invoice   ตั้ง  status = 'POSTED'
--
--   2) njacc_receipt_pending      หา   status = 'POSTED'
--                                 outstanding = total_amount − wht_amount − paid   (NET)
--                                 paid นับ payment ที่ status <> 'VOID'
--
--   3) njacc_customer_open_invoices  หา status = 'ISSUED'      ← ไม่เจอใบที่ POSTED
--                                 outstanding = total_amount − paid              (GROSS)
--                                 paid นับ payment ที่ status = 'POSTED'
--
--   4) njacc_receive_payment      บังคับ status = 'ISSUED'     ← โยน NJACC_INVOICE_NOT_OPEN
--                                 outstanding = total_amount − paid              (GROSS)
--
--   5) njacc_void_receipt         คำนวณ payment_status ใหม่เทียบกับ total_amount (GROSS)
--
--   6) *** ADVANCE หลุดเข้า Receipt ได้ ***
--      njacc_receipt_pending          กรอง charge_type='SERVICE'   ✅
--      njacc_customer_open_invoices   ไม่กรอง charge_type          ❌
--      njacc_receive_payment          ไม่ตรวจ charge_type          ❌
--      -> คิวไม่โชว์ใบ ADVANCE แต่หน้า "+ รับชำระเงิน" โชว์ให้เลือกได้
--         และ RPC รับไว้จริง -> ออกใบเสร็จ RCP ให้เงินสำรองจ่าย ซึ่งผิดทางบัญชี
--         (ADVANCE ต้องไปทาง FINANCE > Advance เท่านั้น)
--
--   ผลจริงที่เกิดกับผู้ใช้:
--     POST Invoice -> status POSTED -> ขึ้นในคิว "รอรับชำระ" ถูกต้อง
--     แต่กด "+ รับชำระเงิน" -> njacc_customer_open_invoices หา ISSUED -> ไม่เจอใบนั้น
--     ต่อให้เจอ -> njacc_receive_payment บังคับ ISSUED -> RAISE NJACC_INVOICE_NOT_OPEN
--     => Flow POSTED -> รับชำระ ใช้งานไม่ได้เลย
--
--     และต่อให้ผ่าน ยอดก็ยังขัดกัน:
--       คิวบอกต้องรับ 1,560 (Net หัก WHT)
--       หน้ารับชำระบอกต้องรับ 1,605 (Gross)
--       รับ 1,560 -> ระบบมองว่ายังขาด 45 -> ค้าง PARTIAL ตลอดกาล ปิดใบไม่ได้
--
-- ═══════════════════════════════════════════════════════════════════════════
-- SINGLE PAYMENT RULE (กติกาเดียว ใช้ทุกที่)
-- ═══════════════════════════════════════════════════════════════════════════
--   ใบที่รับชำระได้        status IN ('ISSUED','POSTED')
--                          (รับทั้ง 2 เพราะ njacc_issue_invoice ยังออกใบเป็น ISSUED
--                           ส่วน njacc_post_draft_invoice ออกเป็น POSTED —
--                           ทั้งคู่คือ "ใบที่ออกแล้ว" ตามความหมายทางบัญชี)
--   Net Receivable        = total_amount − wht_amount
--   Paid                  = Σ allocated_amount ของ payment ที่ status = 'POSTED'
--                           (VOID ไม่นับ · เลิกใช้เงื่อนไข <> 'VOID' ที่กำกวม)
--   Outstanding           = Net Receivable − Paid
--   ใบที่เข้า Receipt ได้  charge_type = 'SERVICE' เท่านั้น
--                          (njacc_receipt_chargeable) — ADVANCE ถูกปฏิเสธที่ SQL
--   payment_status        Outstanding <= 0.005  -> 'PAID'
--                         Paid        <= 0.005  -> 'UNPAID'
--                         นอกนั้น               -> 'PARTIAL'
--
--   บังคับที่ SQL ผ่าน helper 3 ตัว -> ทุก RPC เรียกตัวเดียวกัน
--   ไม่มีทางที่จุดหนึ่งใช้ Gross อีกจุดใช้ Net อีกต่อไป
--
--   ตัวอย่าง Total 1,605 · WHT 45 -> Net 1,560
--       รับ 1,000 -> Outstanding 560 -> PARTIAL
--       รับ   560 -> Outstanding   0 -> PAID
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ขอบเขต
-- ═══════════════════════════════════════════════════════════════════════════
--   สร้างใหม่ : njacc_invoice_net_receivable / njacc_invoice_paid /
--               njacc_invoice_outstanding / njacc_invoice_payable /
--               njacc_receipt_chargeable
--   แก้       : njacc_receipt_pending · njacc_customer_open_invoices ·
--               njacc_receive_payment (รวมเลข RCP ไว้ในนี้ที่เดียว) · njacc_void_receipt
--   ไม่แตะ    : ตาราง · คอลัมน์ · index · RLS · policy · trigger
--               njacc_post_draft_invoice · njacc_issue_invoice · njacc_unpost_* ·
--               njacc_list_receipts · njacc_void_invoice · Credit Note ·
--               Customer/Service Master · Permission · Role · Auth
--   ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE / UPDATE ข้อมูลเดิม
--
--   *** ไฟล์นี้เป็นเจ้าของ njacc_receive_payment แต่ผู้เดียว ***
--   RUN-01 ถูกถอดฟังก์ชันนี้ออกแล้ว -> รัน RUN-01 ซ้ำไม่ย้อน Logic ที่นี่
--
-- ⚠️ payment_status ของใบเดิมที่มีอยู่ ไฟล์นี้ "ไม่ recompute ย้อนหลัง"
--    (Production ตรวจแล้วมี Invoice ISSUED/POSTED 0 ใบ · Payment 0 · Receipt 0
--     จึงไม่มีข้อมูลเก่าที่ต้องปรับ — ถ้าอนาคตมีข้อมูลแล้วต้องปรับ ให้สั่งแยกอีกไฟล์
--     จะได้ไม่แอบ UPDATE ข้อมูลจริงโดยไม่ได้ขอ)
--
-- ROLLBACK : รัน block CREATE OR REPLACE ของ 4 ฟังก์ชันจากไฟล์เดิม
--            njacc_receipt_pending / njacc_customer_open_invoices /
--            njacc_receive_payment / njacc_void_receipt -> sql/005_njacc_rpc.sql
--            + sql/dev/020_njacc_workflow_queues.sql (receipt_pending)
--            helper 4 ตัวจะค้างอยู่แต่ไม่มีใครเรียก (DROP FUNCTION ได้ถ้าต้องการ)
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_next_month_doc_no') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ต้องรัน RUN-01_FINAL_DOCUMENT_NUMBERS.sql ก่อน';
  END IF;
  IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public'
         AND p.proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                           'njacc_receive_payment','njacc_void_receipt')) <> 4 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ฟังก์ชันที่ต้องแก้ไม่ครบ 4 ตัว';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- ภาพก่อนแก้ — ใช้เทียบกับ VERIFY ท้ายไฟล์
SELECT 'P1 ข้อมูลก่อนแก้' AS check_name,
       (SELECT count(*) FROM public.njacc_invoices WHERE status='ISSUED')  AS inv_issued,
       (SELECT count(*) FROM public.njacc_invoices WHERE status='POSTED')  AS inv_posted,
       (SELECT count(*) FROM public.njacc_payments)                        AS payments,
       (SELECT count(*) FROM public.njacc_receipts)                        AS receipts,
       (SELECT count(*) FROM public.njacc_payment_allocations)             AS allocations;

-- ใบที่ค้างชำระ เทียบ Gross vs Net ให้เห็นก่อนแก้
SELECT 'P2 Gross vs Net' AS check_name, i.invoice_no, i.status, i.payment_status,
       i.total_amount, i.wht_amount,
       round(i.total_amount - i.wht_amount, 2) AS net_receivable
  FROM public.njacc_invoices i
 WHERE i.status IN ('ISSUED','POSTED')
 ORDER BY i.invoice_no;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ══ 2.1 · HELPER — แหล่งความจริงเดียวของกติกาการรับชำระ ═══════════════════

/* ใบนี้รับชำระได้หรือยัง — ออกแล้วทั้ง ISSUED และ POSTED */
CREATE OR REPLACE FUNCTION public.njacc_invoice_payable(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $fn$
  SELECT coalesce(p_status,'') IN ('ISSUED','POSTED')
$fn$;

/* ── ใบนี้เข้า FINANCE > Receipt ได้ไหม ──
   FINANCE > Receipt รับชำระเฉพาะงานบริการเท่านั้น
   งาน ADVANCE (เงินสำรองจ่าย) มี Flow ของตัวเองที่ FINANCE > Advance
   ถ้าปล่อยให้ ADVANCE เข้ามาจะได้ใบเสร็จ RCP ผิดประเภททางบัญชี
   helper ตัวนี้เป็นกติกาเดียวที่ทั้ง 3 RPC เรียกใช้ -> ไม่มีทางกรองไม่ตรงกัน */
CREATE OR REPLACE FUNCTION public.njacc_receipt_chargeable(p_charge_type text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $fn$
  SELECT coalesce(p_charge_type,'') = 'SERVICE'
$fn$;

/* ยอดที่ต้องรับจริง = ยอดสุทธิ − ภาษีหัก ณ ที่จ่าย
   ลูกค้าหัก WHT ไว้แล้วโอนเงินสดมาเท่ากับ Net จึงต้องปิดใบที่ Net ไม่ใช่ Gross */
CREATE OR REPLACE FUNCTION public.njacc_invoice_net_receivable(p_invoice uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT round(coalesce(i.total_amount,0) - coalesce(i.wht_amount,0), 2)
    FROM public.njacc_invoices i WHERE i.id = p_invoice
$fn$;

/* รับมาแล้วเท่าไร — นับเฉพาะ payment ที่ status='POSTED' (VOID ไม่นับ) */
CREATE OR REPLACE FUNCTION public.njacc_invoice_paid(p_invoice uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT coalesce(round(sum(a.allocated_amount), 2), 0)
    FROM public.njacc_payment_allocations a
    JOIN public.njacc_payments pm ON pm.id = a.payment_id AND pm.status = 'POSTED'
   WHERE a.invoice_id = p_invoice
$fn$;

/* ค้างรับอีกเท่าไร */
CREATE OR REPLACE FUNCTION public.njacc_invoice_outstanding(p_invoice uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT round(public.njacc_invoice_net_receivable(p_invoice)
             - public.njacc_invoice_paid(p_invoice), 2)
$fn$;

REVOKE ALL ON FUNCTION public.njacc_invoice_payable(text)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_receipt_chargeable(text)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_invoice_net_receivable(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_invoice_paid(uuid)             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_invoice_outstanding(uuid)      FROM PUBLIC, anon, authenticated;
/* helper ภายในล้วน — เรียกจาก RPC ที่เป็น SECURITY DEFINER owner=postgres เท่านั้น */


-- ══ 2.2 · คิวรอรับชำระ — ใช้ helper · รับทั้ง ISSUED และ POSTED ═══════════
CREATE OR REPLACE FUNCTION public.njacc_receipt_pending(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v_group text := coalesce(p->>'company_group','NJ');
        v_page int := greatest(coalesce((p->>'page')::int,1),1);
        v_size int := least(greatest(coalesce((p->>'size')::int,20),1),200);
        v_q text := nullif(p->>'q',''); v_cust uuid := nullif(p->>'customer_id','')::uuid;
        v_rows jsonb; v_total bigint; v_sum numeric;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('SERVICE', v_group, 'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  WITH q AS (
    SELECT j.id AS job_id, j.job_no, j.customer_job_no, j.house_bl_no,
           i.id AS invoice_id, i.invoice_no, i.invoice_date, i.due_date,
           i.total_amount, i.wht_amount, i.payment_status, i.posted_at,
           c.customer_name,
           public.njacc_invoice_net_receivable(i.id) AS net_receivable,
           public.njacc_invoice_paid(i.id)           AS paid,
           public.njacc_invoice_outstanding(i.id)    AS outstanding
      FROM public.njacc_jobs j
      JOIN public.njacc_invoices i ON i.id = j.invoice_id
      LEFT JOIN public.njacc_customers c ON c.id = j.customer_id
     WHERE j.company_group = v_group
       AND public.njacc_receipt_chargeable(j.charge_type)   /* SERVICE เท่านั้น */
       AND public.njacc_invoice_payable(i.status)          /* ← ISSUED หรือ POSTED */
       AND coalesce(i.payment_status,'UNPAID') <> 'PAID'
       AND j.operational_status <> 'CANCELED'
       AND public.njacc_can(j.charge_type, j.company_group, 'view')
       AND (v_cust IS NULL OR j.customer_id = v_cust)
       AND (v_q IS NULL OR i.invoice_no ILIKE '%'||v_q||'%' OR c.customer_name ILIKE '%'||v_q||'%'
            OR j.job_no ILIKE '%'||v_q||'%' OR j.customer_job_no ILIKE '%'||v_q||'%')
  )
  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.due_date NULLS LAST, t.invoice_no), '[]'::jsonb)
    INTO v_rows
    FROM (SELECT * FROM q ORDER BY due_date NULLS LAST, invoice_no
           OFFSET (v_page-1)*v_size LIMIT v_size) t;

  SELECT count(*), coalesce(sum(outstanding),0) INTO v_total, v_sum
    FROM (SELECT j.id, public.njacc_invoice_outstanding(i.id) AS outstanding
            FROM public.njacc_jobs j
            JOIN public.njacc_invoices i ON i.id=j.invoice_id
            LEFT JOIN public.njacc_customers c ON c.id=j.customer_id
           WHERE j.company_group=v_group
             AND public.njacc_receipt_chargeable(j.charge_type)
             AND public.njacc_invoice_payable(i.status)
             AND coalesce(i.payment_status,'UNPAID')<>'PAID'
             AND j.operational_status<>'CANCELED'
             AND public.njacc_can(j.charge_type,j.company_group,'view')
             AND (v_cust IS NULL OR j.customer_id=v_cust)
             AND (v_q IS NULL OR i.invoice_no ILIKE '%'||v_q||'%' OR c.customer_name ILIKE '%'||v_q||'%'
                  OR j.job_no ILIKE '%'||v_q||'%' OR j.customer_job_no ILIKE '%'||v_q||'%')) z;

  RETURN jsonb_build_object('rows',v_rows,'total',v_total,'outstanding_total',v_sum,
                            'page',v_page,'size',v_size);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_receipt_pending(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_receipt_pending(jsonb) FROM PUBLIC, anon;


-- ══ 2.3 · ใบเปิดของลูกค้า (หน้ารับชำระ) — กติกาเดียวกับคิว ════════════════
CREATE OR REPLACE FUNCTION public.njacc_customer_open_invoices(p_customer uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','receive_payment') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',i.id,'invoice_no',i.invoice_no,'invoice_date',i.invoice_date,'due_date',i.due_date,
      'total_amount',i.total_amount,'payment_status',i.payment_status,
      'charge_type',i.charge_type,'company_group',i.company_group,
      'status',i.status,
      /* ← เพิ่ม: ให้หน้าจอเห็นที่มาของยอด ไม่ต้องเดา */
      'wht_amount',    coalesce(i.wht_amount,0),
      'net_receivable',public.njacc_invoice_net_receivable(i.id),
      'paid',          public.njacc_invoice_paid(i.id),
      'outstanding',   public.njacc_invoice_outstanding(i.id))
      ORDER BY i.invoice_date, i.invoice_no),'[]'::jsonb)
    FROM public.njacc_invoices i
    WHERE i.customer_id = p_customer
      AND public.njacc_invoice_payable(i.status)        /* ← ISSUED หรือ POSTED */
      /* ← FIX: กัน ADVANCE ไม่ให้โผล่ในหน้ารับชำระ
         เดิมไม่มีเงื่อนไขนี้ ทำให้ใบ ADVANCE ขึ้นให้เลือกตัดชำระได้
         ทั้งที่คิว njacc_receipt_pending กรอง SERVICE ไว้แล้ว -> 2 จุดไม่ตรงกัน */
      AND public.njacc_receipt_chargeable(i.charge_type)
      AND public.njacc_invoice_outstanding(i.id) > 0.005);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_customer_open_invoices(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_customer_open_invoices(uuid) FROM PUBLIC, anon;


-- ══ 2.4 · รับชำระเงิน — กติกาเดียวกัน + เลขใบเสร็จ RCP{YYYYMM}-##### ══════
--   *** ฟังก์ชันนี้มีนิยามอยู่ที่ไฟล์นี้ที่เดียวในทั้งระบบ ***
CREATE OR REPLACE FUNCTION public.njacc_receive_payment(
  p_customer uuid, p_amount numeric, p_allocations jsonb, p_request_id text,
  p_date date DEFAULT NULL::date, p_method text DEFAULT NULL::text,
  p_ref text DEFAULT NULL::text, p_note text DEFAULT NULL::text,
  p_issue_receipt boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v_prev uuid; v_pay uuid; v_rc uuid;
        v_payno text; v_rcno text; al jsonb; v_sum numeric := 0;
        v_inv public.njacc_invoices; v_alloc numeric; v_out numeric; v_paid numeric;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','receive_payment') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_prev := public.njacc_idem_check(p_request_id,'RECEIVE_PAYMENT',pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('payment_id',v_prev,'idempotent',true);
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'NJACC_BAD_AMOUNT'; END IF;
  IF p_allocations IS NULL OR jsonb_array_length(p_allocations)=0 THEN
    RAISE EXCEPTION 'NJACC_NO_ALLOCATIONS'; END IF;

  /* payment_no คงรูปแบบเดิม — เป็นเลขภายใน ไม่ใช่เอกสารที่ส่งลูกค้า */
  v_payno := public.njacc_next_doc_no('PAYMENT',to_char(now(),'YYYY'),'PAY'||to_char(now(),'YY')||'-');
  INSERT INTO public.njacc_payments(payment_no,customer_id,payment_date,amount_received,
    method,reference_no,note,created_by)
  VALUES (v_payno,p_customer,coalesce(p_date,current_date),round(p_amount,2),
    p_method,p_ref,p_note,pr.id)
  RETURNING id INTO v_pay;

  FOR al IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    v_alloc := round(coalesce((al->>'amount')::numeric,0),2);
    IF v_alloc <= 0 THEN RAISE EXCEPTION 'NJACC_BAD_ALLOCATION'; END IF;

    /* LOCK invoice — กัน concurrent allocation เกิน outstanding */
    SELECT * INTO v_inv FROM public.njacc_invoices
     WHERE id=(al->>'invoice_id')::uuid FOR UPDATE;
    IF v_inv.id IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_OPEN'; END IF;
    /* ← กติกาเดียวกับคิวและหน้าจอ: รับได้ทั้ง ISSUED และ POSTED */
    IF NOT public.njacc_invoice_payable(v_inv.status) THEN
      RAISE EXCEPTION 'NJACC_INVOICE_NOT_OPEN'; END IF;
    /* ← FIX: ด่านหลักกัน ADVANCE เข้า Receipt
       บังคับที่ SQL เพื่อให้กันได้แม้ยิง RPC ตรงโดยไม่ผ่านหน้าจอ
       อยู่ในลูปเดียวกับ INSERT allocation และทั้งฟังก์ชันเป็น transaction เดียว
       -> ถ้ามี ADVANCE ปนแม้ใบเดียว ทั้งก้อนถูก rollback
          ไม่มีทางที่ SERVICE บางใบถูกบันทึกค้างไว้ */
    IF NOT public.njacc_receipt_chargeable(v_inv.charge_type) THEN
      RAISE EXCEPTION 'NJACC_RECEIPT_SERVICE_ONLY'; END IF;
    IF v_inv.customer_id <> p_customer THEN RAISE EXCEPTION 'NJACC_CUSTOMER_MISMATCH'; END IF;

    /* ← Outstanding แบบ NET (หัก WHT) เหมือนกันทุกจุด */
    v_out := public.njacc_invoice_outstanding(v_inv.id);
    IF v_alloc > v_out + 0.005 THEN RAISE EXCEPTION 'NJACC_ALLOC_EXCEEDS_OUTSTANDING'; END IF;

    INSERT INTO public.njacc_payment_allocations(payment_id,invoice_id,allocated_amount)
    VALUES (v_pay,v_inv.id,v_alloc);
    v_sum := v_sum + v_alloc;

    /* payment_status คำนวณจาก Net Receivable ตัวเดียวกัน
       (allocation แถวนี้ถูก INSERT แล้ว helper จึงนับรวมให้อัตโนมัติ) */
    v_paid := public.njacc_invoice_paid(v_inv.id);
    UPDATE public.njacc_invoices SET payment_status =
      CASE WHEN public.njacc_invoice_outstanding(v_inv.id) <= 0.005 THEN 'PAID'
           WHEN v_paid <= 0.005 THEN 'UNPAID'
           ELSE 'PARTIAL' END
    WHERE id=v_inv.id;
  END LOOP;

  IF abs(v_sum - round(p_amount,2)) > 0.005 THEN
    RAISE EXCEPTION 'NJACC_ALLOCATION_SUM_MISMATCH: sum=% amount=%', v_sum, p_amount;
  END IF;

  IF p_issue_receipt THEN
    /* เลขใบเสร็จรายเดือน RCP{YYYYMM}-##### · อิงวันที่รับชำระจริง ไม่ใช่ now() */
    v_rcno := public.njacc_next_month_doc_no('RECEIPT_MONTH','RCP',coalesce(p_date,current_date));
    INSERT INTO public.njacc_receipts(receipt_no,customer_id,payment_id,receipt_date,
      total_received,issued_by)
    VALUES (v_rcno,p_customer,v_pay,coalesce(p_date,current_date),round(p_amount,2),pr.id)
    RETURNING id INTO v_rc;
    INSERT INTO public.njacc_receipt_allocations(receipt_id,invoice_id,amount)
    SELECT v_rc, invoice_id, allocated_amount FROM public.njacc_payment_allocations
     WHERE payment_id=v_pay;
  END IF;

  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'RECEIVE_PAYMENT',pr.id,'payment',v_pay);
  PERFORM public.njacc_audit(pr.id,'RECEIVE_PAYMENT','payment',v_pay::text,
    jsonb_build_object('payment_no',v_payno,'amount',p_amount,'receipt_no',v_rcno));
  RETURN jsonb_build_object('payment_id',v_pay,'payment_no',v_payno,
    'receipt_id',v_rc,'receipt_no',v_rcno);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)
  FROM PUBLIC, anon;


-- ══ 2.5 · Void ใบเสร็จ — คำนวณสถานะกลับด้วยกติกาเดียวกัน ══════════════════
CREATE OR REPLACE FUNCTION public.njacc_void_receipt(p_id uuid, p_reason text, p_request_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; r public.njacc_receipts; v_inv uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF public.njacc_idem_check(p_request_id,'VOID_RECEIPT',pr.id) IS NOT NULL THEN RETURN; END IF;
  IF NOT public.njacc_can('*','*','void') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF coalesce(p_reason,'')='' THEN RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;
  SELECT * INTO r FROM public.njacc_receipts WHERE id=p_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NJACC_RECEIPT_NOT_FOUND'; END IF;
  IF r.status='VOID' THEN RETURN; END IF;
  UPDATE public.njacc_receipts SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=p_id;
  UPDATE public.njacc_payments SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=r.payment_id;
  /* recompute payment_status ด้วย Net Receivable ตัวเดียวกับตอนรับชำระ
     (payment ถูกตั้ง VOID ไปแล้ว helper จึงหักยอดนี้ออกให้เอง) */
  FOR v_inv IN SELECT DISTINCT invoice_id FROM public.njacc_payment_allocations
               WHERE payment_id=r.payment_id LOOP
    UPDATE public.njacc_invoices i SET payment_status =
      CASE WHEN public.njacc_invoice_paid(v_inv) <= 0.005 THEN 'UNPAID'
           WHEN public.njacc_invoice_outstanding(v_inv) <= 0.005 THEN 'PAID'
           ELSE 'PARTIAL' END
    WHERE i.id=v_inv;
  END LOOP;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'VOID_RECEIPT',pr.id,'receipt',p_id);
  PERFORM public.njacc_audit(pr.id,'VOID_RECEIPT','receipt',p_id::text,
    jsonb_build_object('reason',p_reason));
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_void_receipt(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_void_receipt(uuid, text, text) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
WITH d AS (
  SELECT p.proname, pg_get_functiondef(p.oid) AS c
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                       'njacc_receive_payment','njacc_void_receipt'))
SELECT 'V1 helper ครบ 5 ตัว' AS check_name,
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_invoice_payable','njacc_invoice_net_receivable',
                                       'njacc_invoice_paid','njacc_invoice_outstanding',
                                       'njacc_receipt_chargeable')) = 5
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 ทั้ง 4 RPC ใช้ njacc_invoice_payable (รับ POSTED ได้)',
       CASE WHEN (SELECT bool_and(c LIKE '%njacc_invoice_payable%') FROM d
                   WHERE proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                                     'njacc_receive_payment'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 ทั้ง 4 RPC ใช้ njacc_invoice_outstanding (Net เดียวกัน)',
       CASE WHEN (SELECT bool_and(c LIKE '%njacc_invoice_outstanding%') FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 ไม่มีสูตร Gross เดิมหลงเหลือ',
       CASE WHEN (SELECT bool_and(c NOT LIKE '%i.total_amount - i.wht_amount%'
                              AND c NOT LIKE '%i.total_amount-coalesce(p.paid,0)%'
                              AND c NOT LIKE '%>= i.total_amount - 0.005%') FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 ไม่มีเงื่อนไข status=''ISSUED'' แข็ง ๆ หลงเหลือ',
       CASE WHEN (SELECT bool_and(c NOT LIKE '%status <> ''ISSUED''%'
                              AND c NOT LIKE '%i.status=''ISSUED''%'
                              AND c NOT LIKE '%i.status = ''ISSUED''%') FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5a ทั้ง 3 จุดกรอง SERVICE ด้วย njacc_receipt_chargeable',
       CASE WHEN (SELECT bool_and(c LIKE '%njacc_receipt_chargeable%') FROM d
                   WHERE proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                                     'njacc_receive_payment'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5b receive_payment reject ADVANCE (NJACC_RECEIPT_SERVICE_ONLY)',
       CASE WHEN (SELECT c LIKE '%NJACC_RECEIPT_SERVICE_ONLY%' FROM d
                   WHERE proname='njacc_receive_payment')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5c njacc_receipt_chargeable คืนค่าถูกต้อง',
       CASE WHEN public.njacc_receipt_chargeable('SERVICE')
             AND NOT public.njacc_receipt_chargeable('ADVANCE')
             AND NOT public.njacc_receipt_chargeable(NULL)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 ใบเสร็จใช้ RCP + RECEIPT_MONTH',
       CASE WHEN (SELECT c LIKE '%''RECEIPT_MONTH'',''RCP''%' FROM d WHERE proname='njacc_receive_payment')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 paid นับเฉพาะ payment POSTED (VOID ไม่นับ)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%pm.status = ''POSTED''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_invoice_paid')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 lock FOR UPDATE ยังอยู่ (กัน concurrent)',
       CASE WHEN (SELECT c LIKE '%FOR UPDATE%' FROM d WHERE proname='njacc_receive_payment')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V9 idempotency ยังอยู่ครบ',
       CASE WHEN (SELECT bool_and(c LIKE '%njacc_idem_check%') FROM d
                   WHERE proname IN ('njacc_receive_payment','njacc_void_receipt'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V10 ตรวจสิทธิ์เดิมยังอยู่ครบ',
       CASE WHEN (SELECT bool_and(c LIKE '%NJACC_FORBIDDEN%') FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11 SECURITY DEFINER + search_path ครบ',
       CASE WHEN (SELECT bool_and(p.prosecdef AND p.proconfig::text LIKE '%search_path%')
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                                       'njacc_receive_payment','njacc_void_receipt',
                                       'njacc_invoice_net_receivable','njacc_invoice_paid',
                                       'njacc_invoice_outstanding'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V12 anon เรียกไม่ได้',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND (p.proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                                        'njacc_receive_payment','njacc_void_receipt')
                          OR p.proname LIKE 'njacc_invoice_pay%'
                          OR p.proname LIKE 'njacc_invoice_net%'
                          OR p.proname = 'njacc_invoice_outstanding')
                     AND has_function_privilege('anon',p.oid,'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V13 helper ไม่เปิดให้ authenticated ยิงตรง',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_invoice_payable','njacc_invoice_net_receivable',
                                       'njacc_invoice_paid','njacc_invoice_outstanding',
                                       'njacc_receipt_chargeable')
                     AND has_function_privilege('authenticated',p.oid,'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V14 authenticated ยังเรียก RPC หลักได้ (แอปไม่พัง)',
       CASE WHEN (SELECT bool_and(has_function_privilege('authenticated',p.oid,'EXECUTE'))
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_receipt_pending','njacc_customer_open_invoices',
                                       'njacc_receive_payment','njacc_void_receipt'))
            THEN 'PASS' ELSE 'FAIL' END;

-- V15 · กติกาเดียวกันจริงไหม — เทียบ 3 แหล่งทีละใบ ต้องได้ตัวเลขเท่ากันทุกคอลัมน์
SELECT 'V15 Single Payment Rule' AS check_name,
       i.invoice_no, i.status, i.payment_status,
       i.total_amount, coalesce(i.wht_amount,0) AS wht,
       public.njacc_invoice_net_receivable(i.id) AS net_receivable,
       public.njacc_invoice_paid(i.id)           AS paid,
       public.njacc_invoice_outstanding(i.id)    AS outstanding,
       CASE WHEN public.njacc_invoice_net_receivable(i.id)
                 = round(i.total_amount - coalesce(i.wht_amount,0),2)
            THEN 'PASS' ELSE 'FAIL' END AS net_ok
  FROM public.njacc_invoices i
 WHERE public.njacc_invoice_payable(i.status)
 ORDER BY i.invoice_no;

-- V17 · ต้องไม่มีใบ ADVANCE ผูกอยู่กับใบเสร็จ/การรับชำระใด ๆ
SELECT 'V17 ไม่มี ADVANCE ใน Receipt' AS check_name,
       (SELECT count(*) FROM public.njacc_receipt_allocations ra
          JOIN public.njacc_invoices i ON i.id=ra.invoice_id
         WHERE i.charge_type <> 'SERVICE')                       AS advance_in_receipt,
       (SELECT count(*) FROM public.njacc_payment_allocations pa
          JOIN public.njacc_invoices i ON i.id=pa.invoice_id
         WHERE i.charge_type <> 'SERVICE')                       AS advance_in_payment,
       CASE WHEN (SELECT count(*) FROM public.njacc_receipt_allocations ra
                    JOIN public.njacc_invoices i ON i.id=ra.invoice_id
                   WHERE i.charge_type <> 'SERVICE') = 0
             AND (SELECT count(*) FROM public.njacc_payment_allocations pa
                    JOIN public.njacc_invoices i ON i.id=pa.invoice_id
                   WHERE i.charge_type <> 'SERVICE') = 0
            THEN 'PASS' ELSE 'FAIL — มีข้อมูลเก่าที่ ADVANCE ถูกรับชำระไปแล้ว (แจ้งก่อนแก้)' END AS result;

-- V16 · ข้อมูลไม่ถูกแตะ (เทียบกับ P1 ต้องเท่าเดิมทุกช่อง)
SELECT 'V16 ข้อมูล' AS check_name,
       (SELECT count(*) FROM public.njacc_invoices WHERE status='ISSUED')  AS inv_issued,
       (SELECT count(*) FROM public.njacc_invoices WHERE status='POSTED')  AS inv_posted,
       (SELECT count(*) FROM public.njacc_payments)                        AS payments,
       (SELECT count(*) FROM public.njacc_receipts)                        AS receipts,
       (SELECT count(*) FROM public.njacc_payment_allocations)             AS allocations;
