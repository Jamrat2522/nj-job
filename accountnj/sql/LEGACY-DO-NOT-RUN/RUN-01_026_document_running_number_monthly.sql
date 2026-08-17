-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_026_document_running_number_monthly.sql
--
-- ✅ รันตอนนี้ (ลำดับที่ 1)   จากนั้นรัน RUN-02_026_verify_running_number.sql
-- ⛔ ไฟล์อื่นใน sql/ และ sql/dev/ ทั้งหมด = ไม่ต้องรัน (รันไปแล้ว/เป็นประวัติ)
--
-- เป้าหมาย
--   DOCUMENT > Service  บันทึกครั้งแรก -> JOBYYYYMM-#####   เช่น JOB202608-00001
--   DOCUMENT > Advance  บันทึกครั้งแรก -> ADYYYYMM-####     เช่น AD202608-0001
--   FINANCE  > Receipt  ยืนยันรับชำระ   -> NJYYYYMM-#####   เช่น NJ202608-00001
--   FINANCE  > Credit Note -> CDYYYYMM-##### : ยังทำไม่ได้ในรุ่นนี้ (ดูหัวข้อ CN ด้านล่าง)
--   เลข + วันที่เอกสาร เกิดใน Transaction เดียวกัน · timezone Asia/Bangkok
--   Running รีเซ็ตเป็น 1 ทุกเดือน · JOB / AD / NJ / CD ใช้ counter แยกกันคนละแถว
--
-- ═══════════════════════════════════════════════════════════════════════════
-- SOURCE จริงที่ตรวจก่อนแก้ (pg_get_functiondef จาก Production ไม่ได้อ่านจากไฟล์อย่างเดียว)
-- ═══════════════════════════════════════════════════════════════════════════
--   Infrastructure เดิมที่มีอยู่แล้ว -> ใช้ต่อ ไม่สร้างระบบซ้ำ
--     ตาราง public.njacc_document_sequences(doc_type, scope_key, last_number)
--            PRIMARY KEY (doc_type, scope_key)
--     ฟังก์ชัน public.njacc_next_doc_no(p_type, p_scope, p_prefix)
--            INSERT ... ON CONFLICT DO NOTHING แล้ว UPDATE ... RETURNING  (atomic จริง)
--            hard-code lpad(...,4) -> ใช้กับ ##### 5 หลักไม่ได้
--            สิทธิ์: REVOKE ALL FROM public, anon, authenticated (เรียกได้จากใน SECURITY DEFINER เท่านั้น)
--
--   ผู้เรียก njacc_next_doc_no ทั้งหมดใน Production (7 ตัว):
--     njacc_save_job          <- แก้ในไฟล์นี้ (JOB / AD)
--     njacc_receive_payment   <- แก้ในไฟล์นี้ (เฉพาะเลข RECEIPT · เลข PAYMENT คงเดิม)
--     njacc_issue_invoice · njacc_post_draft_invoice · njacc_create_wht ·
--     njacc_import_jobs_batch · njacc_next_doc_no  <- ไม่แตะทั้งหมด
--
--   Unique ที่มีอยู่แล้ว (ตรวจจาก pg_indexes จริง)
--     njacc_jobs_no_uq      UNIQUE (job_no)
--     njacc_rc_no_uq        UNIQUE (receipt_no)
--     njacc_pay_no_uq       UNIQUE (payment_no)
--     njacc_jobs_open_no_uq UNIQUE (open_no) WHERE open_no IS NOT NULL
--   -> ไม่ต้องสร้าง unique เพิ่ม · ของเดิมครอบคลุมแล้ว
--
--   เลข RECEIPT ถูกสร้างที่เดียวจริง: njacc_receive_payment
--     ตรวจแล้วว่าไม่มีฟังก์ชันอื่นใน schema public ที่ INSERT INTO njacc_receipts
--     -> "ห้ามสร้างเลข Receipt ตอน POST Invoice" เป็นจริงอยู่แล้วโดยโครงสร้าง ไม่ต้องแก้
--
-- ═══════════════════════════════════════════════════════════════════════════
-- CREDIT NOTE (CD) — ยังส่งมอบไม่ได้ในรุ่นนี้  *** อ่านก่อน ***
-- ═══════════════════════════════════════════════════════════════════════════
--   ตรวจ Production จริงแล้ว: ไม่มีตาราง njacc_credit_notes · ไม่มี RPC ·
--   assets/js/finance/credit-note.js เป็นหน้า PLACEHOLDER ไม่เรียก RPC ใด ๆ
--   จึงไม่มี Event "ยืนยันออก Credit Note" ให้ผูกเลข
--   การสร้างเลข CD ตอนนี้จะได้เลขที่ไม่มีเอกสารรองรับ (เลขกระโดด/เลขลอย)
--   -> ไฟล์นี้ "เตรียมพร้อม" ไว้ให้แล้วโดยไม่เดา:
--        njacc_next_doc_no(...,p_pad) รองรับ CD ทันที
--        พารามิเตอร์ที่ต้องใช้เมื่อทำ Credit Note จริง:
--          public.njacc_next_doc_no('CREDIT_NOTE_MONTH', v_ym, 'CD'||v_ym||'-', 5)
--        (เรียกภายใน RPC ของ Credit Note ที่จะสร้างขึ้น พร้อม UNIQUE(credit_note_no))
--   สิ่งที่ยังต้องทำก่อนใช้ CD ได้จริง: ตาราง + FK กลับ njacc_invoices + RPC ออก/Void
--   + RLS + permission can_credit_note + ผลต่อ allocation/receivable/report
--   ยังไม่ทำในไฟล์นี้เพราะอยู่นอกขอบเขต "ระบบเลขเอกสาร" และต้องออกแบบร่วมกับผู้ใช้
--
-- ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ UPDATE ข้อมูลเดิมแม้แต่แถวเดียว
-- ไม่แตะ: Invoice Calculation / VAT / WHT / Customer / Service Item /
--         POST / UNPOST / Receipt Allocation / Permission / Role / Auth / RLS
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
DECLARE n_legacy_job int; n_legacy_rc int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_next_doc_no') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_next_doc_no (running number ของเดิม)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='njacc_document_sequences') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบตาราง njacc_document_sequences'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_save_job') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_save_job'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_receive_payment') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_receive_payment'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname='public' AND indexname='njacc_jobs_no_uq') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ UNIQUE njacc_jobs_no_uq (job_no)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname='public' AND indexname='njacc_rc_no_uq') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ UNIQUE njacc_rc_no_uq (receipt_no)'; END IF;

  SELECT count(*) INTO n_legacy_job FROM public.njacc_jobs
   WHERE job_no IS NOT NULL AND job_no !~ '^(JOB|AD)[0-9]{6}-[0-9]+$';
  SELECT count(*) INTO n_legacy_rc FROM public.njacc_receipts
   WHERE receipt_no IS NOT NULL AND receipt_no !~ '^NJ[0-9]{6}-[0-9]+$';

  RAISE NOTICE 'PREFLIGHT PASS';
  RAISE NOTICE 'งานเดิมที่ใช้เลขรูปแบบเก่า = % รายการ (จะไม่ถูกแก้)', n_legacy_job;
  RAISE NOTICE 'ใบเสร็จเดิมที่ใช้เลขรูปแบบเก่า = % รายการ (จะไม่ถูกแก้)', n_legacy_rc;
  RAISE NOTICE '*** ไม่ Backfill ข้อมูลเก่า — เลข/วันที่ของ Record เดิมคงเดิมทุกแถว ***';
END $preflight$;

-- P1 · ข้อมูลเก่าที่ยังใช้เลขรูปแบบเดิม (แสดงให้ตัดสินใจ ไม่แก้ไข)
SELECT 'P1 งานเดิม (เลขรูปแบบเก่า)' AS check_name, charge_type, job_no,
       reference_date, operational_status
  FROM public.njacc_jobs
 WHERE job_no IS NOT NULL AND job_no !~ '^(JOB|AD)[0-9]{6}-[0-9]+$'
 ORDER BY job_no;

SELECT 'P2 ใบเสร็จเดิม (เลขรูปแบบเก่า)' AS check_name, receipt_no, receipt_date
  FROM public.njacc_receipts
 WHERE receipt_no IS NOT NULL AND receipt_no !~ '^NJ[0-9]{6}-[0-9]+$'
 ORDER BY receipt_no;

-- P3 · counter ที่มีอยู่เดิม (ของเดิมจะไม่ถูกแตะ · ของใหม่เป็นคนละ doc_type)
SELECT 'P3 counter เดิม' AS check_name, doc_type, scope_key, last_number
  FROM public.njacc_document_sequences ORDER BY 1,2;

-- P4 · วันที่ฝั่ง server เทียบ Asia/Bangkok (ยืนยันว่าเลขเดือนจะถูกต้อง)
SELECT 'P4 timezone' AS check_name,
       now()                                            AS server_now_utc,
       (now() AT TIME ZONE 'Asia/Bangkok')              AS bangkok_now,
       (now() AT TIME ZONE 'Asia/Bangkok')::date        AS bangkok_date,
       to_char((now() AT TIME ZONE 'Asia/Bangkok'),'YYYYMM') AS ym_that_will_be_used;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ═══ 2.1 · njacc_next_doc_no overload ที่กำหนดจำนวนหลักได้ ═══
--   ของเดิม 3 พารามิเตอร์ "ไม่ถูกแตะ" (INVOICE / PAYMENT / WHT / JOB_OPEN / import ยังใช้ตัวเดิม)
--   ตัวใหม่เป็น overload 4 พารามิเตอร์ ใช้ตาราง njacc_document_sequences ตัวเดียวกัน
--   กลไก atomic เหมือนเดิมทุกบรรทัด: INSERT ... ON CONFLICT DO NOTHING แล้ว
--   UPDATE ... SET last_number = last_number + 1 ... RETURNING
--     -> UPDATE จับ row lock ของแถว counter · transaction ที่มาพร้อมกันต้องรอคิว
--     -> ได้เลขคนละตัวเสมอ ไม่มี MAX+1 ไม่มีการคำนวณฝั่ง client
CREATE OR REPLACE FUNCTION public.njacc_next_doc_no(
  p_type text, p_scope text, p_prefix text, p_pad int)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_n bigint;
BEGIN
  IF p_pad IS NULL OR p_pad < 1 OR p_pad > 12 THEN RAISE EXCEPTION 'NJACC_BAD_PAD'; END IF;
  INSERT INTO public.njacc_document_sequences(doc_type,scope_key,last_number)
  VALUES (p_type,p_scope,0)
  ON CONFLICT (doc_type,scope_key) DO NOTHING;
  UPDATE public.njacc_document_sequences
     SET last_number = last_number + 1
   WHERE doc_type=p_type AND scope_key=p_scope
   RETURNING last_number INTO v_n;
  IF v_n IS NULL THEN RAISE EXCEPTION 'NJACC_SEQ_FAILED'; END IF;
  RETURN p_prefix || lpad(v_n::text, p_pad, '0');
END $fn$;
-- สิทธิ์เท่ากับตัวเดิมเป๊ะ: เรียกตรงจาก client ไม่ได้ · ใช้ได้เฉพาะภายใน SECURITY DEFINER
REVOKE ALL ON FUNCTION public.njacc_next_doc_no(text,text,text,int) FROM PUBLIC, anon, authenticated;


-- ═══ 2.2 · njacc_save_job — JOB / AD + วันที่เปิดงาน (Asia/Bangkok) ═══
--   ยกฟังก์ชันทั้งตัวมาจากเวอร์ชันที่รันอยู่จริงบน Production แล้วแก้เฉพาะสาขา v_new
--   สิ่งที่เปลี่ยน (เฉพาะตอน "สร้างใหม่" เท่านั้น):
--     - v_today / v_ym คิดจาก Asia/Bangkok ที่ฝั่ง database
--     - SERVICE -> JOB{YYYYMM}-{5 หลัก}   counter doc_type='JOB_SERVICE_MONTH' scope=YYYYMM
--     - ADVANCE -> AD{YYYYMM}-{4 หลัก}    counter doc_type='JOB_ADVANCE_MONTH' scope=YYYYMM
--     - reference_date = v_today (วันที่เปิดงานจริงจาก server ไม่เชื่อนาฬิกาเครื่อง client)
--     - job_date = ค่าที่ส่งมา ถ้าไม่ส่งใช้ v_today
--   สาขา ELSE (แก้ไข/บันทึกซ้ำ) ไม่ถูกแตะแม้แต่บรรทัดเดียว -> เลขเดิม/วันที่เดิมเสมอ
--   open_no ยังใช้ JOB_OPEN แบบเดิมทุกอย่าง (ไม่อยู่ในขอบเขตที่สั่ง)
CREATE OR REPLACE FUNCTION public.njacc_save_job(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_id uuid; v_no text; v_open text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_new boolean := (p->>'id') IS NULL;
        v_today date; v_ym text;
BEGIN
  pr := public.njacc_req_profile();
  IF v_new AND NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF NOT v_new AND NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;
  IF v_new THEN
    /* วันที่เปิดงาน + เลขงาน เกิดใน transaction เดียวกัน (คำสั่งข้อ 7) */
    v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;
    v_ym    := to_char(v_today,'YYYYMM');
    IF v_charge = 'SERVICE' THEN
      v_no := public.njacc_next_doc_no('JOB_SERVICE_MONTH', v_ym, 'JOB'||v_ym||'-', 5);
    ELSE
      v_no := public.njacc_next_doc_no('JOB_ADVANCE_MONTH', v_ym, 'AD'||v_ym||'-', 4);
    END IF;
    /* เลขเปิดงาน — sequence แยกจาก job_no · atomic ด้วย UPDATE...RETURNING (ไม่ใช่ MAX+1) */
    v_open := public.njacc_next_doc_no('JOB_OPEN',
      v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
      'OP'||left(v_charge,1)||to_char(now(),'YY')||'-');
    INSERT INTO public.njacc_jobs(open_no,job_no,charge_type,company_group,data_type,reference_no,
      reference_date,job_date,company_invoice_id,customer_id,customs_declaration_no,source_invoice_no,
      house_bl_no,master_bl_no,booking_no,vessel_name,qty_container,etd,eta,delivery_date,
      customer_job_no,credit_term_days,due_date,note,case_no,contact,cs_name,i_billing_apl,
      created_by,updated_by)
    VALUES (v_open,v_no,v_charge,v_group,p->>'data_type',p->>'reference_no',
      v_today,coalesce((p->>'job_date')::date, v_today),
      (p->>'company_invoice_id')::uuid,(p->>'customer_id')::uuid,
      p->>'customs_declaration_no',p->>'source_invoice_no',p->>'house_bl_no',p->>'master_bl_no',
      p->>'booking_no',p->>'vessel_name',(p->>'qty_container')::int,(p->>'etd')::date,
      (p->>'eta')::date,(p->>'delivery_date')::date,p->>'customer_job_no',
      (p->>'credit_term_days')::int,(p->>'due_date')::date,p->>'note',
      p->>'case_no',p->>'contact',p->>'cs_name',p->>'i_billing_apl',pr.id,pr.id)
    RETURNING id INTO v_id;
    PERFORM public.njacc_audit(pr.id,'CREATE_JOB','job',v_id::text,
      jsonb_build_object('job_no',v_no,'open_no',v_open,'job_date',v_today));
  ELSE
    v_id := (p->>'id')::uuid;
    UPDATE public.njacc_jobs SET data_type=p->>'data_type', reference_no=p->>'reference_no',
      reference_date=(p->>'reference_date')::date,
      job_date=CASE WHEN p ? 'job_date' THEN (p->>'job_date')::date ELSE job_date END,
      company_invoice_id=(p->>'company_invoice_id')::uuid, customer_id=(p->>'customer_id')::uuid,
      customs_declaration_no=p->>'customs_declaration_no', source_invoice_no=p->>'source_invoice_no',
      house_bl_no=p->>'house_bl_no', master_bl_no=p->>'master_bl_no', booking_no=p->>'booking_no',
      vessel_name=p->>'vessel_name', qty_container=(p->>'qty_container')::int,
      etd=(p->>'etd')::date, eta=(p->>'eta')::date, delivery_date=(p->>'delivery_date')::date,
      customer_job_no=p->>'customer_job_no', credit_term_days=(p->>'credit_term_days')::int,
      due_date=(p->>'due_date')::date, note=p->>'note',
      case_no=p->>'case_no', contact=p->>'contact', cs_name=p->>'cs_name',
      i_billing_apl=p->>'i_billing_apl', updated_by=pr.id
    WHERE id=v_id AND charge_type=v_charge AND company_group=v_group
      AND operational_status <> 'CANCELED';
    IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
    PERFORM public.njacc_audit(pr.id,'EDIT_JOB','job',v_id::text,NULL);
  END IF;
  IF p ? 'containers' THEN
    DELETE FROM public.njacc_job_containers WHERE job_id=v_id;
    INSERT INTO public.njacc_job_containers(job_id,container_no,container_type,sequence_no)
    SELECT v_id, x->>'container_no', x->>'container_type', ord
      FROM jsonb_array_elements(p->'containers') WITH ORDINALITY AS t(x,ord)
     WHERE coalesce(x->>'container_no','') <> '';
  END IF;
  RETURN jsonb_build_object('id',v_id,'job_no',v_no,'open_no',v_open);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_save_job(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_job(jsonb) FROM PUBLIC, anon;


-- ═══ 2.3 · njacc_receive_payment — เลขใบเสร็จ NJ{YYYYMM}-##### ═══
--   ยกฟังก์ชันทั้งตัวมาจากเวอร์ชันที่รันอยู่จริงบน Production แล้วแก้ 3 จุด:
--     (1) v_today จาก Asia/Bangkok · v_rcdate = วันที่ Receipt (ใช้ค่าที่ผู้ใช้กรอกก่อน)
--     (2) เลขใบเสร็จ -> counter doc_type='RECEIPT_NJ_MONTH' scope = YYYYMM ของ "วันที่ Receipt"
--     (3) payment_date / receipt_date ใช้ v_today แทน current_date (current_date = เวลา UTC ของ server)
--   ไม่แตะ: การตรวจสิทธิ์ · idempotency · การ lock invoice · การคำนวณ outstanding ·
--           payment_status · receipt_allocations · เลข PAYMENT (PAYyy- ของเดิม) · audit
--   เลขใบเสร็จยังถูกสร้าง "เฉพาะเมื่อ p_issue_receipt = true" เหมือนเดิม
--   -> POST Invoice ไม่แตะฟังก์ชันนี้เลย จึงไม่มีทางกินเลข NJ (ยืนยันแล้วว่า
--      njacc_receive_payment เป็นฟังก์ชันเดียวใน schema ที่ INSERT INTO njacc_receipts)
CREATE OR REPLACE FUNCTION public.njacc_receive_payment(
  p_customer uuid, p_amount numeric, p_allocations jsonb, p_request_id text,
  p_date date DEFAULT NULL::date, p_method text DEFAULT NULL::text,
  p_ref text DEFAULT NULL::text, p_note text DEFAULT NULL::text,
  p_issue_receipt boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_prev uuid; v_pay uuid; v_rc uuid;
        v_payno text; v_rcno text; al jsonb; v_sum numeric := 0;
        v_inv public.njacc_invoices; v_alloc numeric; v_out numeric;
        v_today date; v_rcdate date; v_ym text;
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

  /* วันที่เอกสารฝั่ง server (Asia/Bangkok) — ไม่เชื่อนาฬิกาเครื่อง client */
  v_today  := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  v_rcdate := coalesce(p_date, v_today);

  v_payno := public.njacc_next_doc_no('PAYMENT',to_char(now(),'YYYY'),'PAY'||to_char(now(),'YY')||'-');
  INSERT INTO public.njacc_payments(payment_no,customer_id,payment_date,amount_received,
    method,reference_no,note,created_by)
  VALUES (v_payno,p_customer,v_rcdate,round(p_amount,2),
    p_method,p_ref,p_note,pr.id)
  RETURNING id INTO v_pay;

  FOR al IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    v_alloc := round(coalesce((al->>'amount')::numeric,0),2);
    IF v_alloc <= 0 THEN RAISE EXCEPTION 'NJACC_BAD_ALLOCATION'; END IF;
    -- LOCK invoice — กัน concurrent allocation เกิน outstanding (§50)
    SELECT * INTO v_inv FROM public.njacc_invoices
     WHERE id=(al->>'invoice_id')::uuid FOR UPDATE;
    IF v_inv.id IS NULL OR v_inv.status <> 'ISSUED' THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_OPEN'; END IF;
    IF v_inv.customer_id <> p_customer THEN RAISE EXCEPTION 'NJACC_CUSTOMER_MISMATCH'; END IF;
    SELECT v_inv.total_amount - coalesce(sum(pa.allocated_amount),0) INTO v_out
      FROM public.njacc_payment_allocations pa
      JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
     WHERE pa.invoice_id=v_inv.id;
    v_out := coalesce(v_out, v_inv.total_amount);
    IF v_alloc > v_out + 0.005 THEN RAISE EXCEPTION 'NJACC_ALLOC_EXCEEDS_OUTSTANDING'; END IF;
    INSERT INTO public.njacc_payment_allocations(payment_id,invoice_id,allocated_amount)
    VALUES (v_pay,v_inv.id,v_alloc);
    v_sum := v_sum + v_alloc;
    -- update payment_status จากยอดจริงใน SQL
    UPDATE public.njacc_invoices SET payment_status =
      CASE WHEN v_out - v_alloc <= 0.005 THEN 'PAID' ELSE 'PARTIAL' END
    WHERE id=v_inv.id;
  END LOOP;

  IF abs(v_sum - round(p_amount,2)) > 0.005 THEN
    RAISE EXCEPTION 'NJACC_ALLOCATION_SUM_MISMATCH: sum=% amount=%', v_sum, p_amount;
  END IF;

  IF p_issue_receipt THEN
    /* เลข NJ อ้างอิงเดือนของ "วันที่ Receipt" · เลข + วันที่ อยู่ใน transaction เดียวกัน */
    v_ym := to_char(v_rcdate,'YYYYMM');
    v_rcno := public.njacc_next_doc_no('RECEIPT_NJ_MONTH', v_ym, 'NJ'||v_ym||'-', 5);
    INSERT INTO public.njacc_receipts(receipt_no,customer_id,payment_id,receipt_date,
      total_received,issued_by)
    VALUES (v_rcno,p_customer,v_pay,v_rcdate,round(p_amount,2),pr.id)
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

COMMIT;

-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · ROLLBACK (ไม่ลบข้อมูล — คัดลอกไปรันเมื่อจำเป็นเท่านั้น)
-- ───────────────────────────────────────────────────────────────────────────
--   คืน njacc_save_job        : รัน block CREATE OR REPLACE จาก sql/008_njacc_features_v11.sql
--   คืน njacc_receive_payment : รัน block CREATE OR REPLACE จาก sql/005_njacc_rpc.sql
--   njacc_next_doc_no(text,text,text,int) ปล่อยทิ้งไว้ได้ ไม่มีใครเรียกก็ไม่ทำงาน
--     ถ้าต้องการปิดจริง ใช้ REVOKE (ไม่ใช้ DROP เพื่อไม่ให้กระทบ dependency):
--       REVOKE ALL ON FUNCTION public.njacc_next_doc_no(text,text,text,int) FROM PUBLIC;
--   แถว counter ใหม่ใน njacc_document_sequences (JOB_SERVICE_MONTH / JOB_ADVANCE_MONTH /
--     RECEIPT_NJ_MONTH) ห้ามลบ — ถ้าลบแล้วกลับมาใช้ใหม่ เลขจะเริ่ม 1 ซ้ำของเดิมทันที
--   *** Rollback ไม่คืนเลขของเอกสารที่ออกไปแล้ว — เอกสารที่ได้เลขใหม่ไปแล้วจะคงเลขนั้นตลอด ***
