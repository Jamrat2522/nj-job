-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-19_WHT_CITIZEN_ID.sql   (ACCOUNT V.203)
-- REPORT > ใบหัก ณ ที่จ่าย — เลขประจำตัวบัตรประชาชน (ผู้หักฯ / ผู้ถูกหักฯ)
--
-- ═══ ตรวจ Source ก่อนเพิ่ม ═══════════════════════════════════════════════
--   grep citizen / id_card / personal_id / บัตรประชาชน ทั้ง assets/js และ sql
--   -> *** ไม่พบเลย *** ระบบยังไม่มีคอลัมน์ที่ทำหน้าที่นี้
--   คอลัมน์ที่มีอยู่คือ payer_tax_id / payee_tax_id (เลขผู้เสียภาษี 13 หลัก)
--   ซึ่งเป็นคนละความหมาย -> จึงต้องเพิ่มใหม่ ไม่ใช่การสร้าง Field ซ้ำ
--
-- ═══ สิ่งที่ไฟล์นี้ทำ ══════════════════════════════════════════════════════
--   (1) njacc_withholding_docs.payer_citizen_id text  (nullable)
--       njacc_withholding_docs.payee_citizen_id text  (nullable)
--       *** เก็บเป็น text *** เลขศูนย์นำหน้าจึงไม่หาย (เหมือน *_tax_id เดิม)
--       ไม่บังคับกรอก (นิติบุคคลใช้ Tax ID แทน)
--   (2) njacc_save_wht_draft  — รับ/บันทึก 2 คีย์ใหม่ (INSERT + UPDATE)
--   (3) njacc_list_wht        — คืน 2 คอลัมน์ใหม่ให้หน้ารายการ/Column Manager
--   njacc_wht_view ไม่ต้องแก้ — ใช้ to_jsonb(w) คอลัมน์ใหม่ไหลออกไปเอง
--
-- ═══ ไม่ทำ ════════════════════════════════════════════════════════════════
--   ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ UPDATE ข้อมูลเดิม
--   *** ไม่แตะ payer_tax_id / payee_tax_id / agent_* *** สองฟิลด์แยกกันเด็ดขาด
--   ไม่แตะ: has_acting_agent · has_fund · njacc_wht_items · การคำนวณภาษี ·
--           njacc_post_wht · unpost · delete · njacc_wht_view · RLS/Policy
--   *** ต้องรัน RUN-17 และ RUN-18 ก่อน *** (ต่อยอดจาก save_wht_draft ชุด RUN-18)
--   รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                    AND column_name='has_fund') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN-18 (ไม่พบ has_fund)'; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                AND column_name IN ('payer_citizen_id','payee_citizen_id')) THEN
    RAISE NOTICE 'มีคอลัมน์อยู่แล้ว — ไฟล์นี้รันซ้ำได้ ไม่มีผลข้างเคียง';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- P1 · ยืนยันว่ายังไม่มีคอลัมน์ที่ทำหน้าที่นี้อยู่ก่อน (กันสร้างซ้ำ)
SELECT 'P1 คอลัมน์ที่ชื่อคล้ายเลขบัตรประชาชนในตารางนี้' AS check_item,
       coalesce(string_agg(column_name, ', ' ORDER BY column_name), '(ไม่มี)') AS detail
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs'
   AND (column_name ILIKE '%citizen%' OR column_name ILIKE '%personal%'
        OR column_name ILIKE '%id_card%' OR column_name ILIKE '%national%');


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · คอลัมน์ใหม่ 2 ตัว — เพิ่มล้วน ไม่แตะคอลัมน์เดิม
ALTER TABLE public.njacc_withholding_docs
  ADD COLUMN IF NOT EXISTS payer_citizen_id text,
  ADD COLUMN IF NOT EXISTS payee_citizen_id text;

COMMENT ON COLUMN public.njacc_withholding_docs.payer_citizen_id IS
  'เลขประจำตัวบัตรประชาชนของผู้มีหน้าที่หักภาษี ณ ที่จ่าย (13 หลัก · text · ไม่บังคับ) '
  '*** คนละฟิลด์กับ payer_tax_id *** ห้ามใช้แทนกัน';
COMMENT ON COLUMN public.njacc_withholding_docs.payee_citizen_id IS
  'เลขประจำตัวบัตรประชาชนของผู้ถูกหักภาษี ณ ที่จ่าย (13 หลัก · text · ไม่บังคับ) '
  '*** คนละฟิลด์กับ payee_tax_id *** ห้ามใช้แทนกัน';

-- 2.2 · njacc_save_wht_draft — ยกนิยามชุด RUN-18 มาทั้งดุ้น เพิ่มเฉพาะ 2 คีย์ใหม่
CREATE OR REPLACE FUNCTION public.njacc_save_wht_draft(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs;
        v_id   uuid := nullif(p->>'wht_id','')::uuid;
        v_cus  uuid := nullif(p->>'customer_id','')::uuid;
        v_inv  uuid := nullif(p->>'invoice_id','')::uuid;
        v_date date := coalesce(nullif(p->>'document_date','')::date, current_date);
        v_pay  date := nullif(p->>'pay_date','')::date;
        v_cert text := nullif(btrim(coalesce(p->>'certificate_no','')), '');
        v_dir  text := upper(coalesce(nullif(btrim(coalesce(p->>'direction','')),''),'RECEIVED'));
        v_agent boolean := (v_dir = 'ACTING_AGENT');
        /* ── NEW (V.196) ── "กระทำการแทนโดย" เป็นตัวเลือกของเอกสาร
           *** คนละเรื่องกับ direction='ACTING_AGENT' *** (นั่นคือทิศทางของใบ)
           ไม่ส่งมา = false · ไม่ติ๊ก -> ล้าง agent_* เป็น NULL ที่ SQL ด้วย
           เพื่อให้เอกสารที่บันทึกไว้ "ไม่มีกระทำการแทน" จริง ไม่ใช่แค่ซ่อน UI */
        v_has_agent boolean := coalesce((p->>'has_acting_agent')::boolean, false);
        /* ── NEW (V.198) ── "เงินกองทุน / ประกันสังคม" เป็นตัวเลือกของเอกสาร
           ไม่ติ๊ก -> ล้างยอดทั้ง 3 ช่องเป็น NULL ที่ SQL ด้วย
           กันยอดเก่าที่ค้างอยู่ถูกนำไปพิมพ์ทั้งที่ Checkbox ไม่ได้เลือก */
        v_has_fund boolean := coalesce((p->>'has_fund')::boolean, false);
        it jsonb; v_line int := 0; v_cat text;
        v_base numeric; v_rate numeric; v_amt numeric;
        v_tbase numeric := 0; v_tamt numeric := 0; v_maxrate numeric := 0;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','issue_receipt') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  IF v_dir NOT IN ('RECEIVED','ACTING_AGENT') THEN
    RAISE EXCEPTION 'NJACC_WHT_BAD_DIRECTION'; END IF;

  IF NOT v_agent AND v_cus IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_CUSTOMER_REQUIRED'; END IF;
  IF v_cus IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.njacc_customers WHERE id=v_cus) THEN
    RAISE EXCEPTION 'NJACC_WHT_CUSTOMER_NOT_FOUND'; END IF;
  IF jsonb_typeof(p->'items') <> 'array' OR jsonb_array_length(p->'items') = 0 THEN
    RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  IF v_inv IS NOT NULL AND v_cus IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.njacc_invoices
                    WHERE id=v_inv AND customer_id=v_cus) THEN
      RAISE EXCEPTION 'NJACC_WHT_INVOICE_MISMATCH'; END IF;
  END IF;

  IF v_id IS NULL AND v_inv IS NOT NULL THEN
    SELECT id INTO v_id FROM public.njacc_withholding_docs
     WHERE invoice_id=v_inv AND status='DRAFT' LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.njacc_withholding_docs(
        document_no, certificate_no, direction, customer_id, invoice_id,
        document_date, pay_date,
        book_no, ref_date, job_no,
        invoice_no_text, payee_code, payment_by,
        has_fund, gpf_amount, social_security_amount, provident_fund_amount,
        payer_name, payer_tax_id, payer_branch, payer_address, payer_citizen_id,
        has_acting_agent, agent_name, agent_tax_id, agent_branch, agent_address,
        payee_customer_id, payee_name, payee_tax_id, payee_branch, payee_address,
        payee_citizen_id,
        form_type, form_seq, pay_method, pay_method_other,
        signer_name, signer_position,
        wht_type, reference_no, note, status, tax_base, rate, amount,
        created_by, draft_saved_at, draft_saved_by)
    VALUES ('WHTDRAFT-TMP', v_cert, v_dir, v_cus, v_inv, v_date, v_pay,
        nullif(btrim(coalesce(p->>'book_no','')),''),
        nullif(p->>'ref_date','')::date,
        nullif(btrim(coalesce(p->>'job_no','')),''),
        nullif(btrim(coalesce(p->>'invoice_no_text','')),''),
        nullif(btrim(coalesce(p->>'payee_code','')),''),
        nullif(btrim(coalesce(p->>'payment_by','')),''),
        v_has_fund,
        CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'gpf_amount','')),'')::numeric END,
        CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'social_security_amount','')),'')::numeric END,
        CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'provident_fund_amount','')),'')::numeric END,
        nullif(btrim(coalesce(p->>'payer_name','')),''),
        nullif(btrim(coalesce(p->>'payer_tax_id','')),''),
        nullif(btrim(coalesce(p->>'payer_branch','')),''),
        nullif(btrim(coalesce(p->>'payer_address','')),''),
        nullif(btrim(coalesce(p->>'payer_citizen_id','')),''),
        v_has_agent,
        CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_name','')),'') END,
        CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_tax_id','')),'') END,
        CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_branch','')),'') END,
        CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_address','')),'') END,
        nullif(p->>'payee_customer_id','')::uuid,
        nullif(btrim(coalesce(p->>'payee_name','')),''),
        nullif(btrim(coalesce(p->>'payee_tax_id','')),''),
        nullif(btrim(coalesce(p->>'payee_branch','')),''),
        nullif(btrim(coalesce(p->>'payee_address','')),''),
        nullif(btrim(coalesce(p->>'payee_citizen_id','')),''),
        nullif(btrim(coalesce(p->>'form_type','')),''),
        nullif(btrim(coalesce(p->>'form_seq','')),''),
        nullif(btrim(coalesce(p->>'pay_method','')),''),
        nullif(btrim(coalesce(p->>'pay_method_other','')),''),
        nullif(btrim(coalesce(p->>'signer_name','')),''),
        nullif(btrim(coalesce(p->>'signer_position','')),''),
        p->>'wht_type', nullif(btrim(coalesce(p->>'reference_no','')),''),
        nullif(btrim(coalesce(p->>'note','')),''), 'DRAFT', 0, 0, 0,
        pr.id, now(), pr.id)
    RETURNING id INTO v_id;
    UPDATE public.njacc_withholding_docs
       SET document_no = 'WHTDRAFT-'||left(v_id::text,8) WHERE id=v_id;
  ELSE
    SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=v_id FOR UPDATE;
    IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;
    IF w.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_WHT_NOT_DRAFT'; END IF;
    UPDATE public.njacc_withholding_docs
       SET customer_id=v_cus, invoice_id=v_inv, certificate_no=v_cert,
           direction=v_dir,
           document_date=v_date, pay_date=v_pay,
           book_no=nullif(btrim(coalesce(p->>'book_no','')),''),
           ref_date=nullif(p->>'ref_date','')::date,
           job_no=nullif(btrim(coalesce(p->>'job_no','')),''),
           invoice_no_text=nullif(btrim(coalesce(p->>'invoice_no_text','')),''),
           payee_code=nullif(btrim(coalesce(p->>'payee_code','')),''),
           payment_by=nullif(btrim(coalesce(p->>'payment_by','')),''),
           has_fund=v_has_fund,
           gpf_amount=CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'gpf_amount','')),'')::numeric END,
           social_security_amount=CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'social_security_amount','')),'')::numeric END,
           provident_fund_amount=CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>'provident_fund_amount','')),'')::numeric END,
           payer_name=nullif(btrim(coalesce(p->>'payer_name','')),''),
           payer_tax_id=nullif(btrim(coalesce(p->>'payer_tax_id','')),''),
           payer_branch=nullif(btrim(coalesce(p->>'payer_branch','')),''),
           payer_address=nullif(btrim(coalesce(p->>'payer_address','')),''),
           payer_citizen_id=nullif(btrim(coalesce(p->>'payer_citizen_id','')),''),
           has_acting_agent=v_has_agent,
           agent_name=CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_name','')),'') END,
           agent_tax_id=CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_tax_id','')),'') END,
           agent_branch=CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_branch','')),'') END,
           agent_address=CASE WHEN v_has_agent THEN nullif(btrim(coalesce(p->>'agent_address','')),'') END,
           payee_customer_id=nullif(p->>'payee_customer_id','')::uuid,
           payee_name=nullif(btrim(coalesce(p->>'payee_name','')),''),
           payee_tax_id=nullif(btrim(coalesce(p->>'payee_tax_id','')),''),
           payee_branch=nullif(btrim(coalesce(p->>'payee_branch','')),''),
           payee_address=nullif(btrim(coalesce(p->>'payee_address','')),''),
           payee_citizen_id=nullif(btrim(coalesce(p->>'payee_citizen_id','')),''),
           form_type=nullif(btrim(coalesce(p->>'form_type','')),''),
           form_seq=nullif(btrim(coalesce(p->>'form_seq','')),''),
           pay_method=nullif(btrim(coalesce(p->>'pay_method','')),''),
           pay_method_other=nullif(btrim(coalesce(p->>'pay_method_other','')),''),
           signer_name=nullif(btrim(coalesce(p->>'signer_name','')),''),
           signer_position=nullif(btrim(coalesce(p->>'signer_position','')),''),
           wht_type=p->>'wht_type',
           reference_no=nullif(btrim(coalesce(p->>'reference_no','')),''),
           note=nullif(btrim(coalesce(p->>'note','')),''),
           draft_saved_at=now(), draft_saved_by=pr.id
     WHERE id=v_id;
    DELETE FROM public.njacc_wht_items WHERE wht_id=v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    v_base := round(coalesce((it->>'tax_base')::numeric,0),2);
    IF (it ? 'rate') = false OR nullif(btrim(coalesce(it->>'rate','')),'') IS NULL THEN
      RAISE EXCEPTION 'NJACC_WHT_RATE_REQUIRED'; END IF;
    v_rate := (it->>'rate')::numeric;
    IF v_base <= 0 THEN RAISE EXCEPTION 'NJACC_WHT_BASE_INVALID'; END IF;
    IF v_rate < 0 OR v_rate > 100 THEN RAISE EXCEPTION 'NJACC_BAD_TAX_RATE'; END IF;

    IF v_agent AND (it ? 'amount') AND nullif(btrim(coalesce(it->>'amount','')),'') IS NOT NULL THEN
      v_amt := round((it->>'amount')::numeric, 2);
      IF v_amt < 0 THEN RAISE EXCEPTION 'NJACC_WHT_AMOUNT_INVALID'; END IF;
      IF v_amt > v_base THEN RAISE EXCEPTION 'NJACC_WHT_AMOUNT_GT_BASE'; END IF;
    ELSE
      v_amt := round(v_base * v_rate / 100, 2);
    END IF;
    v_line := v_line + 1;

    /* ── หมวด 50 ทวิ — *** ระบบไม่เดาให้ *** ──
       ค่าที่หน้าจอส่งมาเท่านั้น · ไม่ส่ง = NULL (บันทึกร่างได้)
       ค่าที่ไม่รู้จักถูกกันด้วย CHECK njacc_wht_items_category_ck */
    v_cat := nullif(btrim(coalesce(it->>'wht_income_category','')),'');

    INSERT INTO public.njacc_wht_items(
        wht_id, line_no, pay_date, income_type, wht_income_category,
        description, tax_base, rate, amount)
    VALUES (v_id, v_line,
            coalesce(nullif(it->>'pay_date','')::date, v_pay),
            /* income_type เดิม *** คงไว้ทั้งหมด ห้ามลบ *** */
            coalesce(nullif(btrim(coalesce(it->>'income_type','')),''),'OTHER'),
            v_cat,
            nullif(btrim(coalesce(it->>'description','')),''),
            v_base, v_rate, v_amt);

    v_tbase := round(v_tbase + v_base, 2);
    v_tamt  := round(v_tamt + v_amt, 2);
    IF v_rate > v_maxrate THEN v_maxrate := v_rate; END IF;
  END LOOP;

  UPDATE public.njacc_withholding_docs
     SET tax_base=v_tbase, amount=v_tamt, rate=v_maxrate WHERE id=v_id;

  PERFORM public.njacc_audit(pr.id,'SAVE_WHT_DRAFT','wht',v_id::text,
    jsonb_build_object('lines',v_line,'tax_base',v_tbase,'amount',v_tamt,
                       'invoice_id',v_inv,'direction',v_dir,
                       'has_acting_agent',v_has_agent,'has_fund',v_has_fund));

  RETURN jsonb_build_object('id',v_id,'status','DRAFT','direction',v_dir,
    'document_no',(SELECT document_no FROM public.njacc_withholding_docs WHERE id=v_id),
    'tax_base',v_tbase,'amount',v_tamt,'lines',v_line);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_save_wht_draft(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_wht_draft(jsonb) FROM PUBLIC, anon;


-- 2.3 · njacc_list_wht — ยกนิยามชุด RUN-12 มาทั้งดุ้น เพิ่มเฉพาะ 2 คอลัมน์ใหม่
CREATE OR REPLACE FUNCTION public.njacc_list_wht(
    p_customer uuid DEFAULT NULL::uuid, p_from date DEFAULT NULL::date,
    p_to date DEFAULT NULL::date, p_page integer DEFAULT 1,
    p_size integer DEFAULT 20, p_direction text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
        v_dir text := nullif(btrim(coalesce(p_direction,'')),'');
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
     AND (v_dir IS NULL OR w.direction=v_dir);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no,
           w.customer_id, w.invoice_id, w.reference_no, w.pay_date, w.note,
           w.certificate_no, w.direction,
           /* ── snapshot จาก RUN-08 ── */
           w.book_no, w.ref_date, w.job_no,
           w.payer_name, w.payer_tax_id, w.payee_name, w.payee_tax_id,
           w.form_type, w.pay_method, w.signer_name,
           /* ── เพิ่มใน RUN-12: คอลัมน์ที่บันทึกไว้แต่ยังไม่เคยถูกส่งกลับ ──
              หน้ารายการต้องแสดงได้ครบทุกคอลัมน์ที่ผู้ใช้กรอก */
           w.invoice_no_text, w.payee_code, w.payment_by,
           w.payer_branch, w.payer_address,
           w.payee_branch, w.payee_address, w.payee_customer_id,
           w.agent_name, w.agent_tax_id, w.agent_branch, w.agent_address,
           w.form_seq, w.pay_method_other, w.signer_position,
           /* ── เพิ่มใน RUN-19 ── เลขประจำตัวบัตรประชาชน 2 ฝ่าย
              Column Manager ตั้งเป็น "ซ่อนโดยค่าเริ่มต้น" เพราะเป็นข้อมูลบุคคล */
           w.payer_citizen_id, w.payee_citizen_id,
           w.posted_at,
           c.tax_id      AS customer_tax_id,
           c.branch_code AS customer_branch_code,
           c.address     AS customer_address,
           c.phone       AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
       AND (v_dir IS NULL OR w.direction=v_dir)
     ORDER BY w.document_date DESC, w.document_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text) FROM PUBLIC, anon;


COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY · รันซ้ำได้)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 คอลัมน์ใหม่ 2 ตัวถูกเพิ่มแล้ว (text · nullable)' AS check_item,
       string_agg(column_name || '=' || data_type || '/' || is_nullable, ', ' ORDER BY column_name) AS detail,
       CASE WHEN count(*) = 2 AND bool_and(data_type='text') AND bool_and(is_nullable='YES')
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs'
   AND column_name IN ('payer_citizen_id','payee_citizen_id')

UNION ALL
SELECT 'V2 *** Tax ID เดิมยังอยู่ ไม่ถูกแทนที่ ***',
       string_agg(column_name, ', ' ORDER BY column_name),
       CASE WHEN count(*) = 3 THEN 'PASS' ELSE 'FAIL' END
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs'
   AND column_name IN ('payer_tax_id','payee_tax_id','agent_tax_id')

UNION ALL
SELECT 'V3 save_wht_draft รับ 2 คีย์ใหม่ (INSERT + UPDATE)',
       'payer_citizen_id · payee_citizen_id',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%payer_citizen_id=nullif(btrim(coalesce(p->>''payer_citizen_id''%'
             AND pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%payee_citizen_id=nullif(btrim(coalesce(p->>''payee_citizen_id''%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V4 ของ RUN-17/RUN-18 ยังอยู่ครบ (ไม่ถูกทับหาย)',
       'has_acting_agent · has_fund',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure) LIKE '%v_has_agent%'
             AND pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure) LIKE '%v_has_fund%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V5 list_wht คืน 2 คอลัมน์ใหม่ให้หน้ารายการ',
       'w.payer_citizen_id · w.payee_citizen_id',
       CASE WHEN pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                   LIKE '%w.payer_citizen_id%'
             AND pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                   LIKE '%w.payee_citizen_id%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V6 list_wht คอลัมน์เดิมของ RUN-12 ยังครบ',
       'ตรวจ 15 คอลัมน์ของ RUN-12',
       CASE WHEN (SELECT bool_and(
                    pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                    LIKE '%w.' || col || '%')
                    FROM unnest(ARRAY['invoice_no_text','payee_code','payment_by',
                      'payer_branch','payer_address','payee_branch','payee_address',
                      'payee_customer_id','agent_name','agent_tax_id','agent_branch',
                      'agent_address','form_seq','pay_method_other','signer_position']) AS col)
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V7 njacc_wht_view ส่งคอลัมน์ใหม่ออกไปเอง (to_jsonb)',
       'to_jsonb(w)',
       CASE WHEN pg_get_functiondef('public.njacc_wht_view(uuid)'::regprocedure) LIKE '%to_jsonb(w)%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V8 เอกสารเก่าไม่ถูกแก้ (คอลัมน์ใหม่เป็น NULL ทั้งหมด)',
       count(*)::text || ' ใบยังเป็น NULL',
       'อ่านอย่างเดียว'
  FROM public.njacc_withholding_docs
 WHERE payer_citizen_id IS NULL AND payee_citizen_id IS NULL;


-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   รัน RUN-NOW/RUN-18_WHT_HAS_FUND.sql ใหม่ (คืน njacc_save_wht_draft ชุดก่อน)
--   และ RUN-NOW/RUN-12_WHT_LIST_FULL_COLUMNS.sql (คืน njacc_list_wht ชุดก่อน)
--   คอลัมน์ payer_citizen_id / payee_citizen_id ปล่อยไว้ได้ ไม่มีผลกับโค้ดชุดเก่า
