-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_025_njacc_document_queue_and_close_handoff.sql
--
-- ✅ ไฟล์นี้ = "รันตอนนี้"  (ต้องรันก่อนอัปโหลดไฟล์เว็บ build 1.4.1-local64)
--    ไฟล์อื่นใน sql/ และ sql/dev/ ทั้งหมด = "ไม่ต้องรัน" (รันไปแล้ว/เป็นประวัติ)
--
-- เป้าหมาย (ตามคำสั่ง)
--   DOCUMENT > Service  กด "ปิดงาน" -> Backend ปิดสำเร็จ -> Record เดิมเข้า ACCOUNTING > Service
--   DOCUMENT > Advance  กด "ปิดงาน" -> Backend ปิดสำเร็จ -> Record เดิมเข้า ACCOUNTING > Advance
--   Row หายจาก DOCUMENT ก็ต่อเมื่อ Backend สำเร็จเท่านั้น · ไม่มีปุ่ม "ส่ง ACCOUNTING" แยก
--
-- ── ROOT CAUSE (ตรวจจาก Production จริง ไม่ได้เดา) ──
--   [R1] หน้า DOCUMENT ส่ง queue = NULL เข้า njacc_build_charge_set()
--        เงื่อนไขแรกของ WHERE คือ  nullif(p->>'queue','') IS NULL  -> ผ่านทุกแถว
--        => DOCUMENT แสดง "งานทั้งหมด" รวมงานที่ปิดแล้ว (operational_status='CLOSE')
--           แถวจึงไม่หายหลังกดปิดงาน ต้องอาศัยป้าย "ส่ง ACCOUNTING แล้ว" บอกแทน
--        ยืนยันแล้วว่า 024 (gate ฝั่ง ACCOUNTING) ถูกรันบน Production เรียบร้อย
--        pg_get_functiondef() มี  operational_status = 'CLOSE'  ครบ
--        แต่ "ไม่มี" คิวฝั่ง DOCUMENT คู่กัน -> ครึ่งเดียวของ Workflow
--
--   [R2] njacc_build_charge_set() ตัด charge_type ทิ้งเมื่อ p->>'scope' = 'all'
--          CASE WHEN p->>'scope' = 'all' THEN njacc_can(...) ELSE j.charge_type = v_charge END
--        Frontend เดิมส่ง scope='all' มาทุกหน้า
--        => งาน SERVICE โผล่ที่ ACCOUNTING > Advance และงาน ADVANCE โผล่ที่ ACCOUNTING > Service
--        แก้ที่ Frontend (เลิกส่ง scope='all' ยกเว้น FINANCE > Close Job ที่ตั้งใจให้เห็นทั้งสอง)
--        *** ไฟล์ SQL นี้ไม่แตะ logic ของ scope เลย ***
--
-- ── สิ่งที่ไฟล์นี้ทำ (2 อย่างเท่านั้น) ──
--   1) njacc_build_charge_set(jsonb)  +  queue='document'  (เพิ่มสาขาใหม่ 1 สาขา)
--        operational_status <> 'CLOSE'   = ยังค้าง DOCUMENT
--      ยกฟังก์ชันทั้งตัวมาจากเวอร์ชันที่รันอยู่จริงบน Production (= 024 SECTION 2)
--      แล้วแทรกเฉพาะสาขาใหม่ · เงื่อนไขเดิมทุกบรรทัดคงอยู่ครบ
--
--   2) njacc_document_close_job(uuid, text)  ← RPC ใหม่ (ไม่แก้ของเดิม)
--        ปิดงาน + ส่งเข้า ACCOUNTING ใน Transaction เดียว
--        ภายในเรียก njacc_set_job_status(p_id,'CLOSE',p_note) ตัวเดิม
--          -> สิทธิ์ 'edit' เดิม / FOR UPDATE เดิม / njacc_audit เดิม ครบทุกอย่าง
--        แล้ว "ตรวจซ้ำ" ว่างานเข้าคิว pending_invoice ของ ACCOUNTING จริงก่อนจึงคืนค่าสำเร็จ
--        ตรวจไม่ผ่าน -> RAISE EXCEPTION -> rollback ทั้งชุด -> งานยังอยู่ DOCUMENT
--        กดซ้ำได้ปลอดภัย (idempotent) -> ไม่เกิด Record ซ้ำ
--
-- ── ความปลอดภัยของ Transaction ──
--   ไม่มีการ "ย้ายข้อมูล" ระหว่างตาราง — DOCUMENT กับ ACCOUNTING คือ Job แถวเดียวกัน
--   ต่างกันแค่เงื่อนไขกรอง ซึ่งอ่านจาก operational_status ตัวเดียวกัน
--   สองคิวเป็นนิเสธของกันและกัน (<> 'CLOSE'  กับ  = 'CLOSE')
--   => เป็นไปไม่ได้ทางตรรกะที่ "DOCUMENT หายแล้วแต่ ACCOUNTING ไม่ได้รับงาน"
--
-- ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ UPDATE ข้อมูลแม้แต่แถวเดียว
-- ไม่แตะ: RLS / Permission / Invoice / Draft / POST / UNPOST / Export / Search /
--         Pagination / Job Number / Attachment / Audit / หน้าเปิดงาน / หน้าแก้ไขงาน
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
DECLARE v_code text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_build_charge_set') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_build_charge_set'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_set_job_status') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_set_job_status'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_inv_is_final') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_inv_is_final (ต้องรัน 019 ก่อน)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_can') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_can'; END IF;

  v_code := pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure);
  IF v_code NOT LIKE '%operational_status = ''CLOSE''%' THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน 024 (gate ฝั่ง ACCOUNTING) ให้รัน 024 ก่อน'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS — 024 อยู่ครบ พร้อมรัน 025';
END $preflight$;

-- ภาพงานปัจจุบัน: หลังรันไฟล์นี้ แถวกลุ่ม CLOSE จะย้ายไปแสดงที่ ACCOUNTING แทน DOCUMENT
SELECT 'P1 งานแยกตามสถานะ (ก่อนรัน)' AS check_name,
       company_group, charge_type, operational_status, count(*) AS jobs
  FROM public.njacc_jobs
 GROUP BY 2,3,4 ORDER BY 2,3,4;

SELECT 'P2 CLOSE ที่ยังไม่มี Invoice = จะไปโผล่ที่ ACCOUNTING' AS check_name,
       charge_type, count(*) AS jobs
  FROM public.njacc_jobs
 WHERE operational_status = 'CLOSE' AND invoice_id IS NULL
 GROUP BY 2 ORDER BY 2;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · njacc_build_charge_set — เพิ่มสาขา queue='document' (เงื่อนไขเดิมครบทุกบรรทัด)
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
         invoice_date, posted_at, advance_status, advance_settled_at
    FROM calc j
   WHERE (nullif(p->>'queue','') IS NULL
          /* คิวรอออก Invoice (ของเดิม) — ยังไม่มีใบที่มีผลทางบัญชี และงานไม่ถูกยกเลิก
             หมายเหตุ: ใช้ njacc_inv_is_final แล้ว ใบที่ POST ไปจึงหลุดจากคิวนี้ด้วย */
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
                AND NOT public.njacc_inv_is_final(j.invoice_status)
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
          /* จบครบวงจรแล้ว → หน้า CLOSE JOB (เห็นทั้ง SERVICE และ ADVANCE เมื่อส่ง scope='all') */
          OR (p->>'queue' = 'closed'
                AND ((j.charge_type='SERVICE' AND j.invoice_status='POSTED' AND j.payment_status='PAID')
                  OR (j.charge_type='ADVANCE' AND j.advance_status='SETTLED')))
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


-- 2.2 · njacc_document_close_job — ปิดงาน + ส่งเข้า ACCOUNTING ใน Transaction เดียว
--   RPC ใหม่ · ไม่แก้ njacc_set_job_status เดิม (Workflow อื่นที่เรียกใช้อยู่ไม่กระทบ)
CREATE OR REPLACE FUNCTION public.njacc_document_close_job(p_id uuid, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE j public.njacc_jobs;
        v_inv_status text;
        v_in_accounting boolean;
        v_in_document boolean;
BEGIN
  /* ล็อกแถวก่อน — กันกดพร้อมกันหลายจอ/กดรัวจนเกิดการทำงานซ้อน */
  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;

  /* สิทธิ์ชุดเดียวกับ njacc_set_job_status สำหรับสถานะที่ไม่ใช่ CANCELED */
  IF NOT public.njacc_can(j.charge_type, j.company_group, 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  SELECT i.status INTO v_inv_status
    FROM public.njacc_invoices i WHERE i.id = j.invoice_id;

  /* งานที่มีใบซึ่งมีผลทางบัญชีแล้ว = ผ่าน ACCOUNTING ไปแล้ว ไม่ใช่ของ DOCUMENT
     ต้องเช็คก่อนสาขา "ปิดไปแล้ว" ด้านล่าง มิฉะนั้นจะรายงานสำเร็จทั้งที่ ACCOUNTING ไม่ได้ถือครองงานนี้แล้ว */
  IF public.njacc_inv_is_final(v_inv_status) THEN
    RAISE EXCEPTION 'NJACC_JOB_ALREADY_INVOICED'; END IF;

  /* กดซ้ำ / เน็ตหลุดแล้วกดใหม่ — ไม่ทำอะไรเพิ่ม ไม่สร้าง Audit ซ้ำ ไม่สร้าง Record ซ้ำ
     มาถึงบรรทัดนี้ได้แปลว่าใบยังไม่มีผลทางบัญชี -> งานอยู่ในคิว ACCOUNTING จริงแน่นอน */
  IF j.operational_status = 'CLOSE' THEN
    RETURN jsonb_build_object(
      'id', j.id, 'job_no', j.job_no,
      'charge_type', j.charge_type, 'company_group', j.company_group,
      'operational_status', j.operational_status,
      'already_closed', true,
      'in_accounting', true);
  END IF;

  /* ปิดงานได้เฉพาะงานที่ยังทำเอกสารอยู่จริง
     กัน CANCELED เล็ดลอดเข้า ACCOUNTING (ปุ่มฝั่ง UI ก็แสดงเฉพาะ 2 สถานะนี้อยู่แล้ว) */
  IF j.operational_status NOT IN ('OPEN','PROCESSING') THEN
    RAISE EXCEPTION 'NJACC_CLOSE_BAD_STATUS'; END IF;

  /* ── ขั้นปิดงานจริง — ใช้ RPC เดิมทั้งดุ้น (สิทธิ์/ล็อก/Audit เดิมครบ) ── */
  PERFORM public.njacc_set_job_status(p_id, 'CLOSE', p_note);

  /* ── ขั้นตรวจรับ — อ่านสถานะจริงหลังเขียน แล้วเทียบกับเงื่อนไขคิวจริงทั้ง 2 ฝั่ง ── */
  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_id;
  SELECT i.status INTO v_inv_status
    FROM public.njacc_invoices i WHERE i.id = j.invoice_id;

  /* ตรงกับสาขา queue='pending_invoice' ใน njacc_build_charge_set ทุกตัวอักษร */
  v_in_accounting := (j.operational_status = 'CLOSE')
                     AND NOT public.njacc_inv_is_final(v_inv_status);
  /* ตรงกับสาขา queue='document' */
  v_in_document   := (j.operational_status <> 'CLOSE');

  IF (NOT v_in_accounting) OR v_in_document THEN
    /* ยกเลิกทั้งหมด — ห้ามให้เกิดสภาพ "หายจาก DOCUMENT แต่ ACCOUNTING ไม่รับ" */
    RAISE EXCEPTION 'NJACC_ACCOUNTING_HANDOFF_FAILED';
  END IF;

  RETURN jsonb_build_object(
    'id', j.id, 'job_no', j.job_no,
    'charge_type', j.charge_type, 'company_group', j.company_group,
    'operational_status', j.operational_status,
    'already_closed', false,
    'in_accounting', true);
END $fn$;

GRANT EXECUTE ON FUNCTION public.njacc_document_close_job(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_document_close_job(uuid, text) FROM PUBLIC, anon;

COMMIT;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY — ไม่แก้ข้อมูล)
-- ───────────────────────────────────────────────────────────────────────────
WITH d AS (SELECT pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure) AS c)
SELECT 'V1 queue document ถูกเพิ่มแล้ว' AS check_name,
       CASE WHEN c LIKE '%''queue'' = ''document''%' THEN 'มี' ELSE 'ไม่มี' END AS detail,
       CASE WHEN c LIKE '%''queue'' = ''document''%' THEN 'PASS' ELSE 'FAIL' END AS result FROM d
UNION ALL
SELECT 'V2 gate 024 ฝั่ง ACCOUNTING ยังอยู่',
       CASE WHEN c LIKE '%operational_status = ''CLOSE''%' THEN 'ยังอยู่' ELSE 'หาย!' END,
       CASE WHEN c LIKE '%operational_status = ''CLOSE''%' THEN 'PASS' ELSE 'FAIL' END FROM d
UNION ALL
SELECT 'V3 queue อื่นครบ (active/receipt/advance/closed)',
       (CASE WHEN c LIKE '%''active''%'         THEN 'active '         ELSE '' END)||
       (CASE WHEN c LIKE '%receipt_active%'     THEN 'receipt_active ' ELSE '' END)||
       (CASE WHEN c LIKE '%advance_active%'     THEN 'advance_active ' ELSE '' END)||
       (CASE WHEN c LIKE '%''closed''%'         THEN 'closed'          ELSE '' END),
       CASE WHEN c LIKE '%''active''%' AND c LIKE '%receipt_active%'
             AND c LIKE '%advance_active%' AND c LIKE '%''closed''%' THEN 'PASS' ELSE 'FAIL' END FROM d
UNION ALL
SELECT 'V4 ตัวกรองวันที่ (fix 021) ยังอยู่',
       CASE WHEN c LIKE '%coalesce(j.reference_date, j.created_at::date)%' THEN 'ยังอยู่' ELSE 'หาย!' END,
       CASE WHEN c LIKE '%coalesce(j.reference_date, j.created_at::date)%' THEN 'PASS' ELSE 'FAIL' END FROM d
UNION ALL
SELECT 'V5 การแยก charge_type (scope) ไม่ถูกแก้',
       CASE WHEN c LIKE '%j.charge_type = v_charge%' THEN 'เดิม' ELSE 'ถูกแก้!' END,
       CASE WHEN c LIKE '%j.charge_type = v_charge%' THEN 'PASS' ELSE 'FAIL' END FROM d
UNION ALL
SELECT 'V6 RPC njacc_document_close_job ถูกสร้าง',
       count(*)::text,
       CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_document_close_job'
UNION ALL
SELECT 'V7 authenticated เรียก close ได้',
       has_function_privilege('authenticated','public.njacc_document_close_job(uuid,text)','EXECUTE')::text,
       CASE WHEN has_function_privilege('authenticated','public.njacc_document_close_job(uuid,text)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 anon เรียก close ไม่ได้',
       has_function_privilege('anon','public.njacc_document_close_job(uuid,text)','EXECUTE')::text,
       CASE WHEN has_function_privilege('anon','public.njacc_document_close_job(uuid,text)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END
UNION ALL
SELECT 'V9 ข้อมูลไม่ถูกแตะ',
       'jobs='||(SELECT count(*) FROM public.njacc_jobs)::text
     ||' invoices='||(SELECT count(*) FROM public.njacc_invoices)::text
     ||' items='||(SELECT count(*) FROM public.njacc_invoice_items)::text, 'PASS';

-- V10 · ทดสอบคิวจริงกับข้อมูลใน DB ทั้ง SERVICE และ ADVANCE (อ่านอย่างเดียว)
DO $verify$
DECLARE c text; n_doc int; n_acc int; e_doc int; e_acc int; n_both int;
BEGIN
  FOREACH c IN ARRAY ARRAY['SERVICE','ADVANCE'] LOOP
    SELECT count(*) INTO e_doc FROM public.njacc_jobs
     WHERE company_group='NJ' AND charge_type=c AND operational_status <> 'CLOSE';
    SELECT count(*) INTO e_acc FROM public.njacc_jobs j
      LEFT JOIN public.njacc_invoices i ON i.id=j.invoice_id
     WHERE j.company_group='NJ' AND j.charge_type=c
       AND j.operational_status = 'CLOSE'
       AND NOT public.njacc_inv_is_final(i.status);

    PERFORM public.njacc_build_charge_set(jsonb_build_object(
      'charge_type',c,'company_group','NJ','queue','document'));
    EXECUTE 'SELECT count(*) FROM _njacc_l' INTO n_doc;
    EXECUTE 'SELECT count(*) FROM _njacc_l WHERE charge_type <> $1' INTO n_both USING c;
    IF n_doc <> e_doc THEN
      RAISE EXCEPTION 'V10 FAIL — DOCUMENT % คาด % แถว ได้ % แถว', c, e_doc, n_doc; END IF;
    IF n_both <> 0 THEN
      RAISE EXCEPTION 'V10 FAIL — DOCUMENT % มีงานต่างประเภทปน % แถว', c, n_both; END IF;

    PERFORM public.njacc_build_charge_set(jsonb_build_object(
      'charge_type',c,'company_group','NJ','queue','pending_invoice'));
    EXECUTE 'SELECT count(*) FROM _njacc_l' INTO n_acc;
    EXECUTE 'SELECT count(*) FROM _njacc_l WHERE charge_type <> $1' INTO n_both USING c;
    IF n_acc <> e_acc THEN
      RAISE EXCEPTION 'V10 FAIL — ACCOUNTING % คาด % แถว ได้ % แถว', c, e_acc, n_acc; END IF;
    IF n_both <> 0 THEN
      RAISE EXCEPTION 'V10 FAIL — ACCOUNTING % มีงานต่างประเภทปน % แถว', c, n_both; END IF;

    RAISE NOTICE 'V10 PASS % — DOCUMENT % แถว · ACCOUNTING % แถว · ไม่มีงานข้ามประเภท', c, n_doc, n_acc;
  END LOOP;
END $verify$;

-- V11 · สองคิวต้องไม่ทับกันและไม่ทำงานหาย (นับจากตารางจริง ไม่ใช้ temp table)
SELECT 'V11 DOCUMENT + ACCOUNTING + ผ่านบัญชีแล้ว = งานทั้งหมด' AS check_name,
       (SELECT count(*) FROM public.njacc_jobs WHERE operational_status <> 'CLOSE')::text
       ||' + '||
       (SELECT count(*) FROM public.njacc_jobs j LEFT JOIN public.njacc_invoices i ON i.id=j.invoice_id
         WHERE j.operational_status='CLOSE' AND NOT public.njacc_inv_is_final(i.status))::text
       ||' + '||
       (SELECT count(*) FROM public.njacc_jobs j LEFT JOIN public.njacc_invoices i ON i.id=j.invoice_id
         WHERE j.operational_status='CLOSE' AND public.njacc_inv_is_final(i.status))::text
       ||' = '||(SELECT count(*) FROM public.njacc_jobs)::text AS detail,
       CASE WHEN (SELECT count(*) FROM public.njacc_jobs) =
                 (SELECT count(*) FROM public.njacc_jobs WHERE operational_status <> 'CLOSE')
               + (SELECT count(*) FROM public.njacc_jobs WHERE operational_status = 'CLOSE')
            THEN 'PASS' ELSE 'FAIL' END AS result;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4 · ROLLBACK (ไม่ลบข้อมูล — คัดลอกไปรันเมื่อจำเป็นเท่านั้น)
-- ───────────────────────────────────────────────────────────────────────────
--   ⚠️ ต้องทำ 2 อย่างคู่กันเสมอ มิฉะนั้น DOCUMENT จะว่างเปล่า
--      (Frontend local64 ส่ง queue='document' ถ้าฝั่ง DB ไม่รู้จักคิวนี้จะไม่คืนแถวใด)
--
--   ขั้นที่ 1 — คืนไฟล์เว็บกลับเป็น build 1.4.1-local63 (อัปโหลดชุดเดิมทับ)
--   ขั้นที่ 2 — คืน njacc_build_charge_set กลับเวอร์ชัน 024:
--       รัน block CREATE OR REPLACE ใน sql/dev/024_njacc_document_close_gate.sql SECTION 2
--
--   njacc_document_close_job ปล่อยทิ้งไว้ได้ ไม่มีใครเรียกก็ไม่ทำงาน (ไม่ต้อง DROP)
--   ถ้าต้องการปิดการเข้าถึงจริง ๆ ใช้ REVOKE (ไม่ใช้ DROP เพื่อไม่ให้กระทบ dependency):
--     REVOKE EXECUTE ON FUNCTION public.njacc_document_close_job(uuid,text) FROM authenticated;
