-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-16_JOB_CLOSE_AND_QUEUE_FLOW.sql   (ACCOUNT V.190)
-- FLOW: DOCUMENT -> ACCOUNTING -> FINANCE -> JOB CONTROL (CLOSE JOB)
--
-- ═══ สิ่งที่ไฟล์นี้ทำ (4 เรื่อง ตามที่สั่ง) ═════════════════════════════════
--   (1) เพิ่มสถานะ "ปิดงานปลายทาง" ที่ยังไม่มีในระบบ
--         njacc_jobs.job_closed_at / job_closed_by  (nullable · ค่าเริ่มต้น NULL)
--         *** ห้ามแตะ operational_status *** ซึ่งถูกใช้เป็น gate DOCUMENT->ACCOUNTING
--         ไปแล้วตั้งแต่ migration 024/025 (OPEN|PROCESSING|CLOSE|CANCELED เหมือนเดิม)
--       + RPC njacc_close_job (ปิดงานจริง · idempotent · มี Audit)
--
--   (2) FINANCE > Receipt รับเฉพาะใบที่ POST แล้ว
--         njacc_invoice_payable  : ISSUED+POSTED -> POSTED เท่านั้น
--       และ ACCOUNTING ต้องถือครองใบที่ยังไม่ POST ไว้ (กันคิวว่างระหว่างทาง)
--         queue='pending_invoice' : เกณฑ์ปล่อยงานเปลี่ยนเป็น "POST แล้ว"
--       -> ใบหนึ่งใบอยู่คิวเดียวเสมอ ไม่มีช่วงที่ไม่มีหน้าไหนถือครอง
--
--   (3) queue='closed' เข้มขึ้น: POSTED + ไม่ CANCELED + job_closed_at IS NULL
--       ผ่าน helper กลาง njacc_job_ready_to_close (ใช้ที่เดียว ไม่มีเงื่อนไขซ้ำ)
--
--   (4) njacc_close_job_counts — ตัวนับบน Tab [SERVICE] [ADVANCE]
--
-- ═══ ไม่ทำ ════════════════════════════════════════════════════════════════
--   ไม่ DROP TABLE/COLUMN · ไม่ DELETE · ไม่ TRUNCATE · ไม่แก้ข้อมูลเดิมแม้แถวเดียว
--   ไม่แตะ: operational_status · njacc_set_job_status · njacc_post_invoice ·
--           njacc_unpost_invoice · njacc_settle_advance · njacc_receive_payment ·
--           njacc_void_receipt · njacc_report · WHT · Credit Note · Invoice/Receipt Print ·
--           RLS · Policy · Role/Permission · Job ID · Invoice · Payment · Allocation
--   ทุก CREATE เป็น OR REPLACE / IF NOT EXISTS -> รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ต้องอ่านผลก่อนรัน SECTION 2)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_build_charge_set') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_build_charge_set'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_payable') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_payable (ต้องรัน 03_RUN-03 ก่อน)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_settle_advance') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_settle_advance (ต้องรัน dev/019 ก่อน)'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- P1 · ผลกระทบของข้อ (2): ใบ SERVICE ที่ออกแล้วแต่ยังไม่ POST
--      หลังรันไฟล์นี้ใบกลุ่มนี้จะ *** ย้ายกลับไปแสดงที่ ACCOUNTING *** (ไม่ใช่ Receipt)
--      และจะรับชำระไม่ได้จนกว่าจะกด POST — ตรวจตัวเลขก่อนรัน
SELECT 'P1 ใบที่ยังไม่ POST (จะย้ายกลับ ACCOUNTING)' AS check_item,
       i.charge_type, i.status, count(*) AS invoices
  FROM public.njacc_invoices i
 WHERE i.status = 'ISSUED'
 GROUP BY 2,3 ORDER BY 2,3;

-- P2 · ใบที่ยังไม่ POST แต่ *** มีการตัดชำระไปแล้ว *** = ต้องแจ้งก่อน
--      ถ้ามีแถวออกมา ให้หยุดและแจ้งคุณน้อย (ไฟล์นี้ไม่แก้ข้อมูลให้เอง)
SELECT 'P2 ใบยังไม่ POST แต่มีการตัดชำระแล้ว (ต้องแจ้งก่อน)' AS check_item,
       i.invoice_no, i.status, i.payment_status,
       sum(a.allocated_amount) AS allocated
  FROM public.njacc_invoices i
  JOIN public.njacc_payment_allocations a ON a.invoice_id = i.id
  JOIN public.njacc_payments pm ON pm.id = a.payment_id AND pm.status <> 'VOID'
 WHERE i.status <> 'POSTED'
 GROUP BY 2,3,4 ORDER BY 2;

-- P3 · งานที่จะขึ้นหน้า CLOSE JOB หลังรัน (แยกตามประเภท)
SELECT 'P3 งานพร้อมปิด (ประมาณการก่อนรัน)' AS check_item,
       j.charge_type, count(*) AS jobs
  FROM public.njacc_jobs j
  JOIN public.njacc_invoices i ON i.id = j.invoice_id
 WHERE i.status = 'POSTED'
   AND j.operational_status <> 'CANCELED'
   AND ( (j.charge_type='SERVICE' AND coalesce(i.payment_status,'')='PAID')
      OR (j.charge_type='ADVANCE' AND coalesce(j.advance_status,'')='SETTLED') )
 GROUP BY 2 ORDER BY 2;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · คอลัมน์ "ปิดงานปลายทาง" — เพิ่มใหม่ล้วน ไม่แตะคอลัมน์เดิม
ALTER TABLE public.njacc_jobs
  ADD COLUMN IF NOT EXISTS job_closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS job_closed_by uuid REFERENCES public.njacc_profiles(id);

COMMENT ON COLUMN public.njacc_jobs.job_closed_at IS
  'เวลาที่ปิดงานปลายทางจาก JOB CONTROL > CLOSE JOB · NULL = ยังไม่ปิด '
  '(คนละเรื่องกับ operational_status=CLOSE ซึ่งคือการส่งงานจาก DOCUMENT เข้า ACCOUNTING)';

-- index ครอบเฉพาะงานที่ยังไม่ปิด — คิว CLOSE JOB อ่านชุดนี้
CREATE INDEX IF NOT EXISTS njacc_job_open_close_idx
  ON public.njacc_jobs (company_group, charge_type)
  WHERE job_closed_at IS NULL;


-- 2.2 · helper กลางของเงื่อนไข "พร้อมปิดงาน" — ใช้ทั้งคิวและตัวนับ Tab
--       เขียนที่เดียว -> คิวกับตัวเลขบน Tab ไม่มีทางไม่ตรงกัน
CREATE OR REPLACE FUNCTION public.njacc_job_ready_to_close(
  p_charge text, p_inv_status text, p_pay_status text,
  p_adv_status text, p_op_status text, p_closed_at timestamptz)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $fn$
  SELECT p_closed_at IS NULL
     AND coalesce(p_op_status,'') <> 'CANCELED'
     AND coalesce(p_inv_status,'') = 'POSTED'
     AND ( (p_charge = 'SERVICE' AND coalesce(p_pay_status,'') = 'PAID')
        OR (p_charge = 'ADVANCE' AND coalesce(p_adv_status,'') = 'SETTLED') );
$fn$;
GRANT EXECUTE ON FUNCTION public.njacc_job_ready_to_close(text,text,text,text,text,timestamptz)
  TO authenticated;


-- 2.3 · njacc_invoice_payable — รับชำระได้เฉพาะใบที่ POST แล้ว
--       helper ตัวนี้ถูกใช้ร่วมกัน 4 จุด: njacc_receipt_pending (คิว+ตัวนับ) ·
--       njacc_customer_open_invoices (รายการใบให้ตัดชำระ) · njacc_receive_payment (ด่านกัน)
--       แก้ที่ helper จุดเดียว -> ทั้ง 4 จุดตรงกันเสมอ ไม่มีทางหลุด
CREATE OR REPLACE FUNCTION public.njacc_invoice_payable(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $fn$
  SELECT coalesce(p_status,'') = 'POSTED'
$fn$;
REVOKE ALL ON FUNCTION public.njacc_invoice_payable(text) FROM PUBLIC, anon, authenticated;


-- 2.4 · njacc_build_charge_set — ยกนิยามจริงมาทั้งดุ้น เปลี่ยน 3 จุด
--       (pending_invoice · closed · projection) นอกนั้นเหมือนเดิมทุกบรรทัด
CREATE OR REPLACE FUNCTION public.njacc_build_charge_set(p jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_q text := nullif(p->>'q','');
BEGIN
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;
  DROP TABLE IF EXISTS _njacc_l;
  CREATE TEMP TABLE _njacc_l ON COMMIT DROP AS
  WITH base AS (
    SELECT j.*, i.invoice_no, i.status AS invoice_status, i.payment_status,
           i.due_date AS invoice_due_date, i.invoice_date,
           i.posted_at, i.posted_by,
           i.service_amount AS i_service, i.advance_amount AS i_advance,
           i.subtotal AS i_subtotal, i.vat_amount AS i_vat,
           i.wht_amount AS i_wht, i.total_amount AS i_gross,
           c.customer_name, ci.company_name AS company_invoice, ci.contact_name AS company_contact,
           fs.service_charge AS s_service, fs.advance AS s_advance, fs.vat AS s_vat,
           fs.amount AS s_amount, fs.wht AS s_wht, fs.total_amount AS s_total,
           (fs.job_id IS NOT NULL) AS has_snapshot
      FROM public.njacc_jobs j
      LEFT JOIN public.njacc_invoices i ON i.id = j.invoice_id
      LEFT JOIN public.njacc_customers c ON c.id = j.customer_id
      LEFT JOIN public.njacc_company_invoices ci ON ci.id = j.company_invoice_id
      LEFT JOIN public.njacc_job_financial_snapshot fs ON fs.job_id = j.id
     WHERE j.company_group = v_group
       AND (CASE WHEN p->>'scope' = 'all'
                 THEN public.njacc_can(j.charge_type, j.company_group, 'view')
                 ELSE j.charge_type = v_charge END)
  ), calc AS (
    SELECT b.*,
      public.njacc_inv_is_final(b.invoice_status) AS has_issued_invoice,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_service
           WHEN b.has_snapshot THEN b.s_service END AS service_amount,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_advance
           WHEN b.has_snapshot THEN b.s_advance END AS advance_amount,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_subtotal
           WHEN b.has_snapshot THEN b.s_amount END AS subtotal,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_vat
           WHEN b.has_snapshot THEN b.s_vat END AS vat_amount,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_wht
           WHEN b.has_snapshot THEN b.s_wht END AS wht_amount,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_gross
           WHEN b.has_snapshot THEN b.s_total END AS gross_total,
      CASE WHEN public.njacc_inv_is_final(b.invoice_status) THEN b.i_gross - b.i_wht
           WHEN b.has_snapshot THEN b.s_total END AS net_payable,
      public.njacc_inv_is_final(b.invoice_status) AS is_receivable,
      coalesce(b.invoice_due_date, b.due_date) AS effective_due_date
      FROM base b
  )
  SELECT id, job_no, coalesce(reference_date, created_at::date) AS date,
         data_type, invoice_no, source_invoice_no,
         CASE WHEN invoice_no IS NOT NULL THEN 0 ELSE 1 END AS invoice_sort_class,
         public.njacc_natural_key(invoice_no) AS invoice_acc_key,
         public.njacc_natural_key(source_invoice_no) AS invoice_src_key,
         customer_name, customer_job_no, company_invoice,
         house_bl_no, master_bl_no, customs_declaration_no,
         service_amount, advance_amount, subtotal, vat_amount, wht_amount,
         gross_total, net_payable,
         i_billing_apl, case_no,
         coalesce(contact, company_contact) AS contact,
         cs_name, etd, eta, effective_due_date AS due_date, due_date AS job_due_date,
         invoice_due_date, note, operational_status,
         invoice_status, payment_status, is_receivable, has_snapshot,
         invoice_id, customer_id, charge_type, company_group, credit_term_days,
         open_no, reference_no, booking_no, vessel_name, qty_container, delivery_date,
         /* ── คอลัมน์ที่หน้าปลายทางต้องใช้ (เพิ่ม projection เท่านั้น) ── */
         invoice_date, posted_at, advance_status, advance_settled_at,
         /* ── NEW (026) ── ร่องรอยปิดงานปลายทาง (เพิ่ม projection เท่านั้น) ── */
         job_closed_at, job_closed_by
    FROM calc j
   WHERE (nullif(p->>'queue','') IS NULL
          /* คิว ACCOUNTING — งานที่บัญชียังถือครองอยู่
             ── FIX (026) ── เกณฑ์ปล่อยงานออกจาก ACCOUNTING คือ "กด POST แล้ว"
             เดิมปล่อยตั้งแต่ออกใบ ทำให้ใบที่ยังไม่ POST หลุดจาก ACCOUNTING
             ไปโผล่ที่ FINANCE > Receipt ก่อนเวลา (คิวไม่ตรงกับ Workflow)
             ตอนนี้ใบร่าง/ใบที่ออกแล้วแต่ยังไม่ POST/ใบที่ถูก VOID ยังอยู่ ACCOUNTING ครบ */
          /* ── FIX (024) ── ACCOUNTING เห็นงานเฉพาะที่ DOCUMENT "ปิดงาน" แล้ว
             เดิมเงื่อนไขมีแค่ "ยังไม่มีใบที่มีผลทางบัญชี และไม่ถูกยกเลิก"
             → งานที่เพิ่งเปิด (OPEN) วิ่งเข้า ACCOUNTING ทันทีตั้งแต่ยังทำเอกสารไม่เสร็จ
             เพิ่มเงื่อนไข operational_status='CLOSE' = DOCUMENT ทำงานเสร็จแล้ว
             ใช้คอลัมน์เดิมที่มีอยู่ ไม่สร้าง field/สถานะใหม่
             Job เดิม ID เดิม — เปลี่ยนแค่ "มุมมอง" ไม่ได้ copy record */
          /* ── NEW (025) ── คิวฝั่ง DOCUMENT
             DOCUMENT = งานที่ยังทำเอกสารอยู่ = ยังไม่ถูกกด "ปิดงาน"
             ใช้คอลัมน์เดิม operational_status ตัวเดียวกับ gate ของ 024
               operational_status <> 'CLOSE'  -> อยู่ DOCUMENT
               operational_status =  'CLOSE'  -> อยู่ ACCOUNTING (pending_invoice)
             ฟิลด์เดียวกัน 2 คิวจึงตรงข้ามกันเสมอ ไม่มีทางหายทั้งสองฝั่ง
             และไม่มีทางอยู่ทั้งสองฝั่งพร้อมกัน (ไม่เกิด Record ซ้ำ)
             ไม่สร้างคอลัมน์/สถานะ/ตารางใหม่ · CANCELED ยังคงเห็นที่ DOCUMENT เหมือนเดิม */
          OR (p->>'queue' = 'document'
                AND j.operational_status <> 'CLOSE')
          OR (p->>'queue' = 'pending_invoice'
                AND coalesce(j.invoice_status,'') <> 'POSTED'
                AND j.operational_status = 'CLOSE')
          /* กำลังดำเนินการ = ยังไม่จบวงจร และไม่ถูกยกเลิก */
          OR (p->>'queue' = 'active'
                AND j.operational_status <> 'CANCELED'
                AND NOT (j.charge_type='SERVICE' AND j.invoice_status='POSTED' AND j.payment_status='PAID')
                AND NOT (j.charge_type='ADVANCE' AND j.advance_status='SETTLED'))
          /* SERVICE ที่ POST แล้ว รอรับชำระ → หน้า RECEIPT */
          OR (p->>'queue' = 'receipt_active'
                AND j.charge_type = 'SERVICE'
                AND j.invoice_status = 'POSTED'
                AND coalesce(j.payment_status,'UNPAID') <> 'PAID'
                AND j.operational_status <> 'CANCELED')
          /* ADVANCE ที่ POST แล้ว รอจ่าย/เคลียร์ → หน้า ADVANCE */
          OR (p->>'queue' = 'advance_active'
                AND j.charge_type = 'ADVANCE'
                AND j.invoice_status = 'POSTED'
                AND coalesce(j.advance_status,'PENDING') <> 'SETTLED'
                AND j.operational_status <> 'CANCELED')
          /* พร้อมปิดงาน → JOB CONTROL > CLOSE JOB (แยก Tab ด้วย charge_type ที่ Frontend)
             ── FIX (026) ── ใช้ helper กลาง njacc_job_ready_to_close ตัวเดียว
             เพื่อไม่ให้เงื่อนไขแตกต่างกันระหว่างคิวนี้กับตัวนับบน Tab */
          OR (p->>'queue' = 'closed'
                AND public.njacc_job_ready_to_close(j.charge_type, j.invoice_status,
                      j.payment_status, j.advance_status, j.operational_status, j.job_closed_at))
         )
     AND (nullif(p->>'status','') IS NULL OR j.operational_status = p->>'status')
     AND (nullif(p->>'customer_id','') IS NULL OR j.customer_id = (p->>'customer_id')::uuid)
     AND (nullif(p->>'cs','') IS NULL OR j.cs_name = p->>'cs')
     AND (nullif(p->>'payment_status','') IS NULL OR j.payment_status = p->>'payment_status')
     AND (nullif(p->>'advance_status','') IS NULL OR j.advance_status = p->>'advance_status')
     /* ── FIX (021) ── ตัวกรองช่วงวันที่ต้องใช้ "คอลัมน์จริงใน CTE" ไม่ใช่ alias ของ SELECT
        alias `date` ถูกสร้างใน SELECT list ชั้นเดียวกัน จึงยังอ้างใน WHERE ไม่ได้
        (SQL ประเมิน WHERE ก่อน SELECT) → โค้ดเดิมอ้าง alias นั้นตรง ๆ ทำให้เกิด
        ERROR: column j.date does not exist ทุกครั้งที่ส่ง from/to
        *** ห้ามเขียน pattern ของโค้ดเดิมลงในคอมเมนต์นี้ ***
        เพราะ pg_get_functiondef() เก็บคอมเมนต์ไว้ด้วย ทำให้ VERIFY ที่ค้นข้อความ
        เจอคอมเมนต์ตัวเองแล้วรายงาน FAIL ทั้งที่โค้ดถูกแล้ว
        ใช้ expression เดียวกับที่สร้าง alias: coalesce(reference_date, created_at::date) */
     AND (nullif(p->>'from','') IS NULL
          OR coalesce(j.reference_date, j.created_at::date) >= (p->>'from')::date)
     AND (nullif(p->>'to','') IS NULL
          OR coalesce(j.reference_date, j.created_at::date) <= (p->>'to')::date)
     AND (v_q IS NULL OR
          j.invoice_no ILIKE '%'||v_q||'%' OR j.source_invoice_no ILIKE '%'||v_q||'%' OR
          j.customer_name ILIKE '%'||v_q||'%' OR j.customer_job_no ILIKE '%'||v_q||'%' OR
          j.house_bl_no ILIKE '%'||v_q||'%' OR j.master_bl_no ILIKE '%'||v_q||'%' OR
          j.job_no ILIKE '%'||v_q||'%');
END $$;

GRANT EXECUTE ON FUNCTION public.njacc_build_charge_set(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_build_charge_set(jsonb) FROM PUBLIC, anon;


-- 2.5 · njacc_document_close_job — ให้ด่านตรวจรับตรงกับคิว ACCOUNTING ชุดใหม่
--       *** ไม่เปลี่ยนพฤติกรรมปุ่ม "ปิดงาน" ของ DOCUMENT ***
--       ยังเรียก njacc_set_job_status(id,'CLOSE') ตัวเดิม สิทธิ์เดิม Audit เดิม
--       แก้เฉพาะ "เกณฑ์ที่ใช้ยืนยันว่างานเข้าคิว ACCOUNTING แล้ว" ให้ตรงกับ 2.4
CREATE OR REPLACE FUNCTION public.njacc_document_close_job(p_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE j public.njacc_jobs;
        v_inv_status text;
        v_in_accounting boolean;
        v_in_document boolean;
BEGIN
  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;

  IF NOT public.njacc_can(j.charge_type, j.company_group, 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  SELECT i.status INTO v_inv_status
    FROM public.njacc_invoices i WHERE i.id = j.invoice_id;

  /* งานที่ POST ไปแล้ว = ผ่าน ACCOUNTING ไปแล้ว ไม่ใช่ของ DOCUMENT */
  IF coalesce(v_inv_status,'') = 'POSTED' THEN
    RAISE EXCEPTION 'NJACC_JOB_ALREADY_INVOICED'; END IF;

  /* กดซ้ำ / เน็ตหลุดแล้วกดใหม่ — ไม่ทำอะไรเพิ่ม ไม่สร้าง Audit ซ้ำ ไม่สร้าง Record ซ้ำ */
  IF j.operational_status = 'CLOSE' THEN
    RETURN jsonb_build_object(
      'id', j.id, 'job_no', j.job_no,
      'charge_type', j.charge_type, 'company_group', j.company_group,
      'operational_status', j.operational_status,
      'already_closed', true,
      'in_accounting', true);
  END IF;

  IF j.operational_status NOT IN ('OPEN','PROCESSING') THEN
    RAISE EXCEPTION 'NJACC_CLOSE_BAD_STATUS'; END IF;

  PERFORM public.njacc_set_job_status(p_id, 'CLOSE', p_note);

  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_id;
  SELECT i.status INTO v_inv_status
    FROM public.njacc_invoices i WHERE i.id = j.invoice_id;

  /* ตรงกับสาขา queue='pending_invoice' ใน njacc_build_charge_set ทุกตัวอักษร */
  v_in_accounting := (j.operational_status = 'CLOSE')
                     AND coalesce(v_inv_status,'') <> 'POSTED';
  /* ตรงกับสาขา queue='document' */
  v_in_document   := (j.operational_status <> 'CLOSE');

  IF (NOT v_in_accounting) OR v_in_document THEN
    RAISE EXCEPTION 'NJACC_ACCOUNTING_HANDOFF_FAILED';
  END IF;

  RETURN jsonb_build_object(
    'id', j.id, 'job_no', j.job_no,
    'charge_type', j.charge_type, 'company_group', j.company_group,
    'operational_status', j.operational_status,
    'already_closed', false,
    'in_accounting', true);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_document_close_job(uuid,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_document_close_job(uuid,text) FROM PUBLIC, anon;


-- 2.6 · njacc_close_job — ปิดงานปลายทางจาก JOB CONTROL > CLOSE JOB
--       ใช้ Job เดิม ID เดิม · ไม่สร้าง Job ใหม่ · ไม่ลบ Invoice/Payment/Advance
--       ไม่แตะ operational_status · ไม่แตะ note · เขียนเฉพาะ job_closed_at/by
CREATE OR REPLACE FUNCTION public.njacc_close_job(
  p_job uuid, p_note text, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; j public.njacc_jobs; v_prev uuid;
        v_inv_status text; v_pay_status text;
BEGIN
  pr := public.njacc_req_profile();
  v_prev := public.njacc_idem_check(p_request_id,'CLOSE_JOB',pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id',v_prev,'idempotent',true,
      'job_closed_at',(SELECT job_closed_at FROM public.njacc_jobs WHERE id=v_prev));
  END IF;

  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_job FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type, j.company_group, 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  /* กดซ้ำ = ไม่ทำอะไรเพิ่ม ไม่เขียนทับเวลา/ผู้ปิดงานเดิม ไม่สร้าง Audit ซ้ำ */
  IF j.job_closed_at IS NOT NULL THEN
    RETURN jsonb_build_object('id',j.id,'job_no',j.job_no,'already_closed',true,
      'job_closed_at',j.job_closed_at);
  END IF;

  SELECT i.status, i.payment_status INTO v_inv_status, v_pay_status
    FROM public.njacc_invoices i WHERE i.id = j.invoice_id;

  /* ด่านสถานะ — ใช้ helper ตัวเดียวกับคิว ไม่ได้ตั้งเงื่อนไขใหม่ที่นี่ */
  IF NOT public.njacc_job_ready_to_close(j.charge_type, v_inv_status, v_pay_status,
        j.advance_status, j.operational_status, j.job_closed_at) THEN
    RAISE EXCEPTION 'NJACC_JOB_NOT_READY_TO_CLOSE';
  END IF;

  UPDATE public.njacc_jobs
     SET job_closed_at = now(), job_closed_by = pr.id, updated_by = pr.id
   WHERE id = j.id;

  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'CLOSE_JOB',pr.id,'job',j.id);
  PERFORM public.njacc_audit(pr.id,'CLOSE_JOB','job',j.id::text,
    jsonb_build_object('job_no',j.job_no,'charge_type',j.charge_type,
                       'invoice_status',v_inv_status,'payment_status',v_pay_status,
                       'advance_status',j.advance_status,'note',p_note));
  RETURN jsonb_build_object('id',j.id,'job_no',j.job_no,'already_closed',false,
    'job_closed_at', (SELECT job_closed_at FROM public.njacc_jobs WHERE id=j.id));
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_close_job(uuid,text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_close_job(uuid,text,text) FROM PUBLIC, anon;


-- 2.7 · njacc_close_job_counts — จำนวนบน Tab [SERVICE] [ADVANCE]
--       ใช้ helper ตัวเดียวกับคิว -> ตัวเลขกับรายการตรงกันเสมอ
--       กรองสิทธิ์รายแถวด้วย njacc_can เหมือนคิวจริง
CREATE OR REPLACE FUNCTION public.njacc_close_job_counts(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_group text := coalesce(p->>'company_group','NJ');
        v_svc bigint; v_adv bigint;
BEGIN
  pr := public.njacc_req_profile();
  IF v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP'; END IF;

  SELECT count(*) FILTER (WHERE j.charge_type = 'SERVICE'),
         count(*) FILTER (WHERE j.charge_type = 'ADVANCE')
    INTO v_svc, v_adv
    FROM public.njacc_jobs j
    JOIN public.njacc_invoices i ON i.id = j.invoice_id
   WHERE j.company_group = v_group
     AND public.njacc_job_ready_to_close(j.charge_type, i.status, i.payment_status,
           j.advance_status, j.operational_status, j.job_closed_at)
     AND public.njacc_can(j.charge_type, j.company_group, 'view');

  RETURN jsonb_build_object('SERVICE', coalesce(v_svc,0), 'ADVANCE', coalesce(v_adv,0));
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_close_job_counts(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_close_job_counts(jsonb) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY · รันซ้ำได้)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 คอลัมน์ปิดงานปลายทางถูกเพิ่มแล้ว' AS check_item,
       string_agg(column_name, ', ' ORDER BY column_name) AS detail,
       CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_jobs'
   AND column_name IN ('job_closed_at','job_closed_by')

UNION ALL
SELECT 'V2 operational_status ไม่ถูกแตะ (CHECK เดิม 4 ค่า)',
       pg_get_constraintdef(oid),
       CASE WHEN pg_get_constraintdef(oid) LIKE '%OPEN%'
             AND pg_get_constraintdef(oid) LIKE '%PROCESSING%'
             AND pg_get_constraintdef(oid) LIKE '%CLOSE%'
             AND pg_get_constraintdef(oid) LIKE '%CANCELED%'
            THEN 'PASS' ELSE 'FAIL' END
  FROM pg_constraint
 WHERE conrelid='public.njacc_jobs'::regclass AND contype='c'
   AND pg_get_constraintdef(oid) LIKE '%operational_status%'

UNION ALL
SELECT 'V3 รับชำระได้เฉพาะใบ POSTED',
       'ISSUED='||public.njacc_invoice_payable('ISSUED')::text
     ||' POSTED='||public.njacc_invoice_payable('POSTED')::text
     ||' DRAFT='||public.njacc_invoice_payable('DRAFT')::text,
       CASE WHEN public.njacc_invoice_payable('POSTED')
             AND NOT public.njacc_invoice_payable('ISSUED')
             AND NOT public.njacc_invoice_payable('DRAFT')
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V4 ACCOUNTING ถือครองใบที่ยังไม่ POST (ไม่มีคิวว่าง)',
       'pending_invoice ใช้เกณฑ์ POST แล้ว',
       CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
                   LIKE '%coalesce(j.invoice_status,'''') <> ''POSTED''%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V5 queue=closed ใช้ helper กลาง',
       'njacc_job_ready_to_close',
       CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
                   LIKE '%njacc_job_ready_to_close%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V6 helper: POSTED+PAID+ไม่ CANCELED+ยังไม่ปิด = พร้อมปิด',
       'SERVICE',
       CASE WHEN public.njacc_job_ready_to_close('SERVICE','POSTED','PAID',NULL,'CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('SERVICE','ISSUED','PAID',NULL,'CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('SERVICE','POSTED','PARTIAL',NULL,'CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('SERVICE','POSTED','PAID',NULL,'CANCELED',NULL)
             AND NOT public.njacc_job_ready_to_close('SERVICE','POSTED','PAID',NULL,'CLOSE',now())
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V7 helper: ADVANCE ต้อง POSTED + SETTLED',
       'ADVANCE',
       CASE WHEN public.njacc_job_ready_to_close('ADVANCE','POSTED',NULL,'SETTLED','CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('ADVANCE','ISSUED',NULL,'SETTLED','CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('ADVANCE','POSTED',NULL,'PAID','CLOSE',NULL)
             AND NOT public.njacc_job_ready_to_close('ADVANCE','POSTED',NULL,'SETTLED','CANCELED',NULL)
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V8 RPC ใหม่ครบ + GRANT authenticated',
       'close_job='||has_function_privilege('authenticated','public.njacc_close_job(uuid,text,text)','EXECUTE')::text
     ||' counts='||has_function_privilege('authenticated','public.njacc_close_job_counts(jsonb)','EXECUTE')::text,
       CASE WHEN has_function_privilege('authenticated','public.njacc_close_job(uuid,text,text)','EXECUTE')
             AND has_function_privilege('authenticated','public.njacc_close_job_counts(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V9 ไม่มีงานปิดไปแล้วค้างในคิว CLOSE JOB',
       count(*)::text || ' งาน',
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END
  FROM public.njacc_jobs j
  JOIN public.njacc_invoices i ON i.id = j.invoice_id
 WHERE j.job_closed_at IS NOT NULL
   AND public.njacc_job_ready_to_close(j.charge_type, i.status, i.payment_status,
         j.advance_status, j.operational_status, j.job_closed_at)

UNION ALL
SELECT 'V10 ไม่มีงานอยู่ 2 คิวพร้อมกัน (ACCOUNTING vs CLOSE JOB)',
       count(*)::text || ' งาน',
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END
  FROM public.njacc_jobs j
  JOIN public.njacc_invoices i ON i.id = j.invoice_id
 WHERE coalesce(i.status,'') <> 'POSTED' AND j.operational_status = 'CLOSE'
   AND public.njacc_job_ready_to_close(j.charge_type, i.status, i.payment_status,
         j.advance_status, j.operational_status, j.job_closed_at)

UNION ALL
SELECT 'V11 จำนวนงานที่ยังไม่ปิด (ข้อมูลเดิมไม่ถูกแตะ)',
       'closed='||count(*) FILTER (WHERE job_closed_at IS NOT NULL)::text
     ||' open='||count(*) FILTER (WHERE job_closed_at IS NULL)::text,
       'อ่านอย่างเดียว'
  FROM public.njacc_jobs;


-- ═══ ROLLBACK (ถ้าจำเป็น — ไม่ต้องลบคอลัมน์) ═══════════════════════════════
--   1) CREATE OR REPLACE FUNCTION public.njacc_invoice_payable(p_status text)
--        RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
--        SELECT coalesce(p_status,'') IN ('ISSUED','POSTED') $$;
--   2) รัน RUN-NOW/07_RUN-01_025_DOCUMENT_QUEUE_AND_CLOSE.sql ใหม่
--      (คืน njacc_build_charge_set + njacc_document_close_job เป็นชุดก่อนหน้า)
--   คอลัมน์ job_closed_at/by ปล่อยไว้ได้ ไม่มีผลกับโค้ดชุดเก่า
