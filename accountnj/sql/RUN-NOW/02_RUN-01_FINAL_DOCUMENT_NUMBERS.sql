-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_FINAL_DOCUMENT_NUMBERS.sql
-- เลขเอกสาร FINAL — 4 Sequence แยกกัน 100% · Scope รายเดือน · Running 5 หลัก
--
-- ⚠️ ยังไม่รัน — รอคำสั่ง "รันได้"
--
-- ═══ ผลลัพธ์ที่ต้องได้ ═══════════════════════════════════════════════════
--     INVOICE          NJ{YYYYMM}-#####      เช่น NJ202608-00001
--     RECEIPT          RCP{YYYYMM}-#####     เช่น RCP202608-00001
--     CREDIT NOTE      CN{YYYYMM}-#####      เช่น CN202608-00001
--     ADVANCE PAYMENT  ADV{YYYYMM}-#####     เช่น ADV202608-00001
--   เริ่มใหม่ทุกเดือน · แยกกันคนละ counter · ไม่ชนกัน
--
-- ═══ PRE-FLIGHT ที่ตรวจ Production จริงแล้ว (17/08/2026) ═══════════════════
--   njacc_document_sequences มีอยู่ 2 แถว: JOB / JOB_OPEN (scope SERVICE-NJ-2026)
--     -> *** ยังไม่เคยมี counter ของ INVOICE / RECEIPT / CREDIT_NOTE / ADVANCE ***
--   njacc_invoices  : DRAFT 1 ใบ (SERVICE) · ISSUED 0 · POSTED 0 · ADVANCE 0
--   njacc_receipts  : 0 แถว
--   njacc_credit_notes : 0 แถว
--   => ไม่มีเอกสารจริงที่ถูกออกเลขไปแล้ว
--      *** จึงไม่ต้อง rewrite เลขเก่า และไม่ต้อง reset counter ที่มีเอกสารจริง ***
--      (ข้อ 8 / ข้อ 38 ผ่านโดยไม่ต้องแตะข้อมูลเดิม)
--
-- ═══ ของเดิมบน Production (ก่อนแก้) ═══════════════════════════════════════
--   njacc_issue_invoice      njacc_next_doc_no('INVOICE', 'YYYY', 'INV'||'YY'||'-')
--   njacc_post_draft_invoice njacc_next_doc_no('INVOICE', 'YYYY', 'INV'||'YY'||'-')
--   njacc_receive_payment    njacc_next_doc_no('RECEIPT', 'YYYY', 'RC'||'YY'||'-')
--                            *** ย้ายไปแก้ที่ RUN-03 ทั้งตัว (ดู SECTION 2.5) ***
--   njacc_next_credit_note_no  'CD'||YYYYMM||'-'||lpad(n,5,'0')
--   ADVANCE                  *** ไม่มี sequence แยก *** ใช้ INVOICE counter ร่วมกัน
--                            -> เอกสารทดรองจ่ายเอา invoice_no มาโชว์เป็น Advance No.
--
-- ═══ ขอบเขต — แก้เฉพาะ "บรรทัดที่ออกเลข" เท่านั้น ═════════════════════════
--   ยกนิยามฟังก์ชันจาก Production มาทั้งตัว (pg_get_functiondef) แล้วเปลี่ยน
--   เฉพาะบรรทัดที่เรียก njacc_next_doc_no -> njacc_next_month_doc_no
--   ตรรกะอื่นทุกบรรทัดเหมือนเดิมเป๊ะ: สิทธิ์ · lock · idempotency · VAT/WHT ·
--   allocation · payment_status · audit · ค่าที่ return
--
--   ไม่แตะ: njacc_next_doc_no (JOB / JOB_OPEN / WHT / PAYMENT ยังใช้ของเดิม)
--           njacc_save_job · njacc_import_jobs_batch · njacc_create_wht
--           njacc_save_invoice_draft (DRAFT-xxxx เหมือนเดิม — ข้อ 5)
--           ตาราง · คอลัมน์ · RLS · policy · trigger · Permission · Role
--   ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE / UPDATE ข้อมูลเดิม
--
-- ═══ ADVANCE ได้เลขแยกอย่างไร (อ่านก่อน) ═════════════════════════════════
--   ระบบเก็บงานทดรองจ่ายเป็นแถวใน njacc_invoices (charge_type='ADVANCE')
--   และ invoice_no เป็น NOT NULL + UNIQUE
--   วิธีที่เลือก: ให้ใบ ADVANCE ดึงเลขจาก counter ADVANCE_MONTH แทน INVOICE_MONTH
--     -> invoice_no ของใบ ADVANCE = ADV202608-00001  (ไม่ใช่ NJ...)
--     -> counter 2 ตัวเดินแยกกันสนิท ใบบริการไม่กินเลขทดรองจ่าย และกลับกัน
--     -> ไม่ต้อง ALTER TABLE เพิ่มคอลัมน์ ไม่มีเลข 2 ชุดในแถวเดียวให้สับสน
--     -> advance-doc.js แสดง inv.invoice_no เป็น "Advance Payment No." ได้ถูกต้อง
--        เพราะค่านั้นคือเลขทดรองจ่ายจริงแล้ว
--   *** ถ้าคุณน้อยต้องการคอลัมน์ advance_no แยกจริง ๆ บอกได้ จะทำเป็น
--       migration เพิ่มให้ แต่จะทำให้ใบ ADVANCE กินเลขทั้ง 2 ชุด ซึ่งขัดข้อ 4 ***
--
-- ⚠️ ลำดับรันบังคับ : RUN-01 (ไฟล์นี้) -> RUN-03_FINAL_RECEIPT_PAYMENT.sql
--    ไฟล์นี้ไม่แตะ njacc_receive_payment เลย -> รันซ้ำไม่ย้อน Logic ของ RUN-03
--
-- ROLLBACK : รัน block CREATE OR REPLACE ของฟังก์ชันเหล่านี้จากไฟล์เดิม
--            njacc_issue_invoice                         -> sql/005_njacc_rpc.sql
--            njacc_post_draft_invoice                    -> sql/dev/022_*.sql
--            njacc_next_credit_note_no                   -> RUN_3_CREDIT_NOTE.sql
--            counter ที่ถูกสร้างใหม่จะค้างอยู่แต่ไม่มีผล (ไม่มีใครเรียก)
--            *** ไม่ต้องลบแถว counter *** ลบแล้วเลขจะเริ่มใหม่ทับของเดิม
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ไม่เปลี่ยนอะไร)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
DECLARE v_issued int; v_rc int; v_cn int;
BEGIN
  FOR v_issued IN SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_issue_invoice','njacc_post_draft_invoice',
                                       'njacc_receive_payment','njacc_next_credit_note_no')
                   HAVING count(*) <> 4 LOOP
    RAISE EXCEPTION 'PREFLIGHT FAIL — ฟังก์ชันที่ต้องแก้ไม่ครบ 4 ตัว (ต้องรัน RUN_3_CREDIT_NOTE.sql ก่อน)';
  END LOOP;

  /* เตือนถ้ามีเอกสารจริงที่ออกเลขไปแล้ว — เลขเก่าจะไม่ถูกแตะ แต่ต้องรู้ตัว */
  SELECT count(*) INTO v_issued FROM public.njacc_invoices WHERE status IN ('ISSUED','POSTED');
  SELECT count(*) INTO v_rc     FROM public.njacc_receipts;
  SELECT count(*) INTO v_cn     FROM public.njacc_credit_notes WHERE status='POSTED';
  IF v_issued > 0 OR v_rc > 0 OR v_cn > 0 THEN
    RAISE WARNING 'มีเอกสารที่ออกเลขแล้ว (invoice=% receipt=% credit_note=%) — เลขเดิมจะคงไว้ไม่ถูกแก้ เอกสารใหม่จะใช้รูปแบบใหม่',
      v_issued, v_rc, v_cn;
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

SELECT 'P1 counter ปัจจุบัน' AS check_name, doc_type, scope_key, last_number
  FROM public.njacc_document_sequences ORDER BY doc_type, scope_key;

SELECT 'P2 เอกสารที่ออกเลขแล้ว' AS check_name,
       (SELECT count(*) FROM public.njacc_invoices WHERE status IN ('ISSUED','POSTED')) AS invoices_numbered,
       (SELECT count(*) FROM public.njacc_invoices WHERE status='DRAFT')                AS invoices_draft,
       (SELECT count(*) FROM public.njacc_receipts)                                     AS receipts,
       (SELECT count(*) FROM public.njacc_credit_notes WHERE status='POSTED')           AS credit_notes;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ── 2.1 ตัวออกเลขรายเดือนตัวกลาง (ของใหม่ · ไม่ทับ njacc_next_doc_no) ──────
--   Atomic อย่างไร:
--     INSERT ... ON CONFLICT DO NOTHING  สร้างแถว counter ถ้ายังไม่มี
--     UPDATE ... RETURNING               จับ row lock ของแถวนั้น
--     -> transaction ที่มาพร้อมกันจะเข้าคิวรอ lock ทีละราย เลขจึงไม่ซ้ำ
--     (รูปแบบเดียวกับ njacc_next_doc_no เดิมที่ใช้อยู่จริงในระบบ)
--   ไม่ใช้ random · ไม่ใช้ now() เป็นเลข · ไม่ใช้ uuid
CREATE OR REPLACE FUNCTION public.njacc_next_month_doc_no(
  p_type text, p_prefix text, p_date date DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_scope text; v_n bigint;
BEGIN
  IF p_type IS NULL OR p_prefix IS NULL THEN RAISE EXCEPTION 'NJACC_SEQ_BAD_ARGS'; END IF;
  v_scope := to_char(coalesce(p_date, current_date), 'YYYYMM');
  INSERT INTO public.njacc_document_sequences(doc_type, scope_key, last_number)
  VALUES (p_type, v_scope, 0)
  ON CONFLICT (doc_type, scope_key) DO NOTHING;
  UPDATE public.njacc_document_sequences
     SET last_number = last_number + 1
   WHERE doc_type = p_type AND scope_key = v_scope
   RETURNING last_number INTO v_n;
  IF v_n IS NULL THEN RAISE EXCEPTION 'NJACC_SEQ_FAILED: % %', p_type, v_scope; END IF;
  RETURN p_prefix || v_scope || '-' || lpad(v_n::text, 5, '0');
END $fn$;
REVOKE ALL ON FUNCTION public.njacc_next_month_doc_no(text, text, date)
  FROM PUBLIC, anon, authenticated;
/* helper ภายใน — ถูกเรียกจาก RPC ที่เป็น SECURITY DEFINER owner=postgres เท่านั้น
   ไม่ GRANT ให้ผู้ใช้ เพื่อไม่ให้ยิงตรงแล้วเดินเลขทิ้งเปล่า */


-- ── 2.2 CREDIT NOTE : CD -> CN ─────────────────────────────────────────────
--   คง signature เดิม (p_date date) เพื่อไม่ต้องแก้ njacc_post_credit_note
CREATE OR REPLACE FUNCTION public.njacc_next_credit_note_no(p_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  RETURN public.njacc_next_month_doc_no('CREDIT_NOTE_MONTH', 'CN', p_date);
END $fn$;
REVOKE ALL ON FUNCTION public.njacc_next_credit_note_no(date)
  FROM PUBLIC, anon, authenticated;


-- ── 2.3 INVOICE + ADVANCE : njacc_post_draft_invoice ───────────────────────
--   ยกของเดิมมาทั้งตัว เปลี่ยนเฉพาะบรรทัด v_no := ...
CREATE OR REPLACE FUNCTION public.njacc_post_draft_invoice(p_invoice uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; inv public.njacc_invoices; v_prev uuid; v_no text; v_items int;
        v_reused boolean := false;
BEGIN
  pr := public.njacc_req_profile();
  v_prev := public.njacc_idem_check(p_request_id,'POST_DRAFT_INVOICE',pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id',v_prev,'idempotent',true,
      'invoice_no',(SELECT invoice_no FROM public.njacc_invoices WHERE id=v_prev),
      'status',(SELECT status FROM public.njacc_invoices WHERE id=v_prev));
  END IF;

  SELECT * INTO inv FROM public.njacc_invoices WHERE id=p_invoice FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(inv.charge_type, inv.company_group, 'invoice') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF inv.status = 'POSTED' THEN RAISE EXCEPTION 'NJACC_INVOICE_ALREADY_POSTED'; END IF;
  IF inv.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_DRAFT'; END IF;

  SELECT count(*) INTO v_items FROM public.njacc_invoice_items WHERE invoice_id=inv.id;
  IF v_items = 0 THEN RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  /* ── เลขจริง ──
     เคยได้เลขจริงแล้ว (ไม่ได้ขึ้นต้นด้วย DRAFT-) → ใช้เลขเดิม ไม่ดึงใหม่
     กรณีนี้คือใบที่ POST แล้ว UNPOST กลับมาแก้ แล้ว POST ใหม่
     → ป้องกันเลขขาดช่วงจากการ POST/UNPOST ซ้ำ ๆ
     ยังไม่เคยได้เลข → ดึงจาก counter รายเดือน "แยกตามประเภทเอกสาร"
       ADVANCE → ADVANCE_MONTH  ให้เลข ADV{YYYYMM}-#####
       อื่น ๆ   → INVOICE_MONTH  ให้เลข NJ{YYYYMM}-#####
     ใช้ invoice_date เป็นตัวกำหนดเดือน (ไม่ใช่ now()) เพื่อให้เลขตรงกับวันที่บนเอกสาร */
  IF inv.invoice_no IS NOT NULL AND inv.invoice_no NOT LIKE 'DRAFT-%' THEN
    v_no := inv.invoice_no; v_reused := true;
  ELSIF inv.charge_type = 'ADVANCE' THEN
    v_no := public.njacc_next_month_doc_no('ADVANCE_MONTH', 'ADV', inv.invoice_date);
  ELSE
    v_no := public.njacc_next_month_doc_no('INVOICE_MONTH', 'NJ', inv.invoice_date);
  END IF;

  UPDATE public.njacc_invoices
     SET invoice_no=v_no, status='POSTED',
         issued_by=coalesce(issued_by,pr.id), issued_at=coalesce(issued_at,now()),
         posted_at=now(), posted_by=pr.id,
         unposted_at=NULL, unposted_by=NULL, unpost_reason=NULL,
         unposted_to_draft_at=NULL, unposted_to_draft_by=NULL
   WHERE id=inv.id;

  IF inv.charge_type = 'ADVANCE' THEN
    UPDATE public.njacc_jobs SET advance_status=coalesce(advance_status,'PENDING'), updated_by=pr.id
     WHERE id=inv.job_id;
  END IF;

  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'POST_DRAFT_INVOICE',pr.id,'invoice',inv.id);
  PERFORM public.njacc_audit(pr.id,'POST_DRAFT_INVOICE','invoice',inv.id::text,
    jsonb_build_object('invoice_no',v_no,'charge_type',inv.charge_type,'items',v_items,
                       'reused_number',v_reused));
  RETURN jsonb_build_object('id',inv.id,'invoice_no',v_no,'status','POSTED','reused_number',v_reused,
    'queue', CASE WHEN inv.charge_type='ADVANCE' THEN 'advance_active' ELSE 'receipt_active' END);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_post_draft_invoice(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_post_draft_invoice(uuid, text) FROM PUBLIC, anon;


-- ── 2.4 INVOICE + ADVANCE : njacc_issue_invoice (route เดิมที่ยังคงไว้) ─────
CREATE OR REPLACE FUNCTION public.njacc_issue_invoice(
  p_job uuid, p_items jsonb, p_request_id text,
  p_invoice_date date DEFAULT NULL::date, p_due_date date DEFAULT NULL::date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; j public.njacc_jobs; v_prev uuid;
        v_no text; v_id uuid; v_rate numeric; it jsonb; v_line int := 0; v_seq int;
        v_amt numeric; v_vat_ap boolean; v_wht_ap boolean; v_wht_rate numeric; v_kind text;
        v_sub numeric := 0; v_vbase numeric := 0; v_vat numeric := 0; v_wht numeric := 0;
        v_svc numeric := 0; v_adv numeric := 0; v_lvat numeric; v_lwht numeric;
        v_seen int[] := '{}'; v_lrate numeric; v_date date;
BEGIN
  pr := public.njacc_req_profile();
  v_prev := public.njacc_idem_check(p_request_id,'ISSUE_INVOICE',pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id',v_prev,'idempotent',true,
      'invoice_no',(SELECT invoice_no FROM public.njacc_invoices WHERE id=v_prev));
  END IF;
  SELECT * INTO j FROM public.njacc_jobs WHERE id=p_job FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type,j.company_group,'invoice') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF j.invoice_id IS NOT NULL THEN RAISE EXCEPTION 'NJACC_JOB_ALREADY_INVOICED'; END IF;
  IF j.customer_id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NO_CUSTOMER'; END IF;
  IF j.operational_status='CANCELED' THEN RAISE EXCEPTION 'NJACC_JOB_CANCELED'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  v_rate := public.njacc_vat_rate();
  v_date := coalesce(p_invoice_date, current_date);
  /* เลขแยกตามประเภทเอกสาร — เหมือน njacc_post_draft_invoice ทุกประการ */
  IF j.charge_type = 'ADVANCE' THEN
    v_no := public.njacc_next_month_doc_no('ADVANCE_MONTH', 'ADV', v_date);
  ELSE
    v_no := public.njacc_next_month_doc_no('INVOICE_MONTH', 'NJ', v_date);
  END IF;
  INSERT INTO public.njacc_invoices(invoice_no,job_id,customer_id,charge_type,company_group,
    invoice_date,due_date,vat_rate,status,issued_by,issued_at)
  VALUES (v_no,j.id,j.customer_id,j.charge_type,j.company_group,
    v_date,coalesce(p_due_date,j.due_date),
    v_rate,'ISSUED',pr.id,now())
  RETURNING id INTO v_id;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_line := v_line + 1;
    v_seq := nullif(it->>'line_no','')::int;
    IF v_seq IS NULL OR v_seq <= 0 THEN v_seq := v_line; END IF;
    IF v_seq = ANY(v_seen) THEN RAISE EXCEPTION 'NJACC_DUP_LINE_NO'; END IF;
    v_seen := v_seen || v_seq;

    v_amt := round(coalesce((it->>'amount')::numeric,0),2);
    IF v_amt < 0 THEN RAISE EXCEPTION 'NJACC_NEGATIVE_AMOUNT'; END IF;
    v_kind := CASE WHEN upper(coalesce(it->>'charge_kind','')) = 'ADVANCE' THEN 'ADVANCE' ELSE 'SERVICE' END;
    v_vat_ap := coalesce((it->>'vat_applicable')::boolean,true);
    v_wht_ap := coalesce((it->>'wht_applicable')::boolean,false);

    /* อัตรา VAT ของบรรทัด: ใช้ค่าที่ส่งมา (จาก Service Master) ถ้ามี
       ไม่ส่ง -> พฤติกรรมเดิม = อัตรากลาง เมื่อ vat_applicable, มิฉะนั้น 0 */
    v_lrate := nullif(it->>'vat_rate','')::numeric;
    IF v_lrate IS NULL THEN
      v_lrate := CASE WHEN v_vat_ap THEN v_rate ELSE 0 END;
    END IF;
    IF v_lrate < 0 OR v_lrate > 100 THEN RAISE EXCEPTION 'NJACC_BAD_TAX_RATE'; END IF;

    v_wht_rate := nullif(it->>'wht_rate','')::numeric;
    IF v_wht_rate IS NULL THEN
      v_wht_rate := CASE WHEN v_wht_ap THEN 3 ELSE 0 END;
    END IF;
    IF v_wht_rate < 0 OR v_wht_rate > 100 THEN RAISE EXCEPTION 'NJACC_BAD_TAX_RATE'; END IF;

    v_lvat := round(v_amt * v_lrate / 100, 2);
    v_lwht := round(v_amt * v_wht_rate / 100, 2);
    INSERT INTO public.njacc_invoice_items(invoice_id,line_no,code,description,amount,cost,charge,
      vat_rate,vat_amount,wht_rate,wht_amount,line_total,charge_kind,qty,unit_price)
    VALUES (v_id,v_seq,it->>'code',coalesce(it->>'description','-'),v_amt,
      round(coalesce((it->>'cost')::numeric,0),2),round(coalesce((it->>'charge')::numeric,0),2),
      v_lrate,v_lvat,v_wht_rate,v_lwht,v_amt+v_lvat,v_kind,
      nullif(it->>'qty','')::numeric, nullif(it->>'price','')::numeric);
    v_sub := v_sub + v_amt;
    IF v_kind='ADVANCE' THEN v_adv := v_adv + v_amt; ELSE v_svc := v_svc + v_amt; END IF;
    IF v_lrate > 0 THEN v_vbase := v_vbase + v_amt; END IF;
    v_vat := v_vat + v_lvat; v_wht := v_wht + v_lwht;
  END LOOP;

  UPDATE public.njacc_invoices SET subtotal=v_sub, vat_base=v_vbase, vat_amount=v_vat,
    wht_amount=v_wht, total_amount=v_sub+v_vat,
    service_amount=v_svc, advance_amount=v_adv WHERE id=v_id;
  UPDATE public.njacc_jobs SET invoice_id=v_id, updated_by=pr.id WHERE id=j.id;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'ISSUE_INVOICE',pr.id,'invoice',v_id);
  PERFORM public.njacc_audit(pr.id,'ISSUE_INVOICE','invoice',v_id::text,
    jsonb_build_object('invoice_no',v_no,'job_no',j.job_no,'total',v_sub+v_vat));
  RETURN jsonb_build_object('id',v_id,'invoice_no',v_no,'total_amount',v_sub+v_vat);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_issue_invoice(uuid, jsonb, text, date, date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_issue_invoice(uuid, jsonb, text, date, date) FROM PUBLIC, anon;


-- ── 2.5 RECEIPT ─────────────────────────────────────────────────────────────
--   *** ตั้งใจไม่นิยาม njacc_receive_payment ในไฟล์นี้ ***
--
--   เหตุผล: njacc_receive_payment ต้องแก้ 2 เรื่องพร้อมกัน
--       (ก) เลขใบเสร็จ RCP{YYYYMM}-#####          <- เรื่องของไฟล์นี้
--       (ข) Single Payment Rule / WHT / สถานะ POSTED  <- เรื่องของ RUN-03
--   ถ้าไฟล์นี้นิยามฟังก์ชันไว้ด้วย การรันไฟล์นี้ซ้ำในอนาคตจะเขียนทับ
--   ตรรกะที่แก้ไว้ใน RUN-03 กลับไปเป็นของเก่าโดยไม่มีใครรู้ตัว
--
--   จึงยกฟังก์ชันทั้งตัวไปไว้ที่ RUN-03_FINAL_RECEIPT_PAYMENT.sql ที่เดียว
--   (นิยามเลขใบเสร็จอยู่ในนั้นครบแล้ว ใช้ njacc_next_month_doc_no ของไฟล์นี้)
--
--   *** ลำดับรันบังคับ:  RUN-01 (ไฟล์นี้)  ->  RUN-03  ***
--   รัน RUN-01 ซ้ำกี่ครั้งก็ได้ ไม่ย้อน Logic ของ RUN-03 เพราะไม่ได้แตะฟังก์ชันนั้นเลย

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
WITH d AS (
  SELECT p.proname, pg_get_functiondef(p.oid) AS c
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public'
     AND p.proname IN ('njacc_post_draft_invoice','njacc_issue_invoice',
                       'njacc_receive_payment','njacc_next_credit_note_no',
                       'njacc_next_month_doc_no'))
SELECT 'V1 INVOICE ใช้ NJ + INVOICE_MONTH' AS check_name,
       CASE WHEN (SELECT bool_and(c LIKE '%''INVOICE_MONTH'', ''NJ''%') FROM d
                   WHERE proname IN ('njacc_post_draft_invoice','njacc_issue_invoice'))
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 ADVANCE ใช้ ADV + ADVANCE_MONTH',
       CASE WHEN (SELECT bool_and(c LIKE '%''ADVANCE_MONTH'', ''ADV''%') FROM d
                   WHERE proname IN ('njacc_post_draft_invoice','njacc_issue_invoice'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 RECEIPT (ต้องรัน RUN-03 ต่อ)',
       CASE WHEN (SELECT c LIKE '%''RECEIPT_MONTH'',''RCP''%' FROM d WHERE proname='njacc_receive_payment')
            THEN 'PASS' ELSE 'ยังไม่ได้รัน RUN-03_FINAL_RECEIPT_PAYMENT.sql — ใบเสร็จยังใช้เลขเก่า' END
UNION ALL
SELECT 'V4 CREDIT NOTE ใช้ CN',
       CASE WHEN (SELECT c LIKE '%''CREDIT_NOTE_MONTH'', ''CN''%' FROM d WHERE proname='njacc_next_credit_note_no')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 ไม่มี prefix เก่าหลงเหลือ (INVyy / RCyy / CD)',
       CASE WHEN (SELECT bool_and(c NOT LIKE '%''INV''||%' AND c NOT LIKE '%''RC''||%'
                                   AND c NOT LIKE '%''CD'' ||%' AND c NOT LIKE '%''CD''%') FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 DRAFT ไม่กินเลขจริง (save_invoice_draft ยังใช้ DRAFT-)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%''DRAFT-''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_invoice_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 njacc_next_doc_no เดิมไม่ถูกแตะ (JOB/WHT/PAYMENT ยังใช้ได้)',
       CASE WHEN (SELECT pg_get_function_identity_arguments(p.oid)='p_type text, p_scope text, p_prefix text'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_next_doc_no')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 SECURITY DEFINER + search_path ครบทุกตัวที่แก้',
       CASE WHEN (SELECT bool_and(p.prosecdef AND p.proconfig::text LIKE '%search_path%')
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_post_draft_invoice','njacc_issue_invoice',
                                       'njacc_receive_payment','njacc_next_credit_note_no',
                                       'njacc_next_month_doc_no'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V9 anon เรียกไม่ได้ทุกตัวที่แก้',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_post_draft_invoice','njacc_issue_invoice',
                                       'njacc_receive_payment','njacc_next_credit_note_no',
                                       'njacc_next_month_doc_no')
                     AND has_function_privilege('anon',p.oid,'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V10 helper ออกเลขไม่เปิดให้ authenticated ยิงตรง',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_next_month_doc_no','njacc_next_credit_note_no')
                     AND has_function_privilege('authenticated',p.oid,'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11 authenticated ยังเรียก RPC หลักได้ (แอปไม่พัง)',
       CASE WHEN (SELECT bool_and(has_function_privilege('authenticated',p.oid,'EXECUTE'))
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_post_draft_invoice','njacc_issue_invoice',
                                       'njacc_receive_payment'))
            THEN 'PASS' ELSE 'FAIL' END;

-- V12 · เลขเอกสารเดิมไม่ถูกแก้แม้แต่ใบเดียว
SELECT 'V12 เอกสารเดิมไม่ถูก rewrite' AS check_name,
       (SELECT count(*) FROM public.njacc_invoices WHERE status IN ('ISSUED','POSTED')) AS invoices_numbered,
       (SELECT count(*) FROM public.njacc_receipts)                                     AS receipts,
       (SELECT count(*) FROM public.njacc_credit_notes WHERE status='POSTED')           AS credit_notes,
       'เทียบกับ P2 ต้องเท่าเดิมทุกช่อง' AS note;

-- V13 · counter หลังรัน (ยังไม่มีแถวใหม่จนกว่าจะออกเอกสารใบแรก = ถูกต้อง)
SELECT 'V13 counter' AS check_name, doc_type, scope_key, last_number
  FROM public.njacc_document_sequences ORDER BY doc_type, scope_key;
