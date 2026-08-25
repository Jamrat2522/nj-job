-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-18_WHT_HAS_FUND.sql   (ACCOUNT V.198)
-- REPORT > ใบหัก ณ ที่จ่าย — "เงินกองทุน / ประกันสังคม" เป็นตัวเลือกของเอกสาร
--
-- ═══ สิ่งที่ไฟล์นี้ทำ ══════════════════════════════════════════════════════
--   (1) njacc_withholding_docs.has_fund boolean *** NULLABLE ***
--       true  = เอกสารนี้เลือกเงินกองทุน/ประกันสังคม
--       false = ไม่ได้เลือก
--       NULL  = เอกสารที่บันทึกก่อนรันไฟล์นี้ (ยังไม่เคยระบุ)
--       *** ไม่ตั้ง DEFAULT และไม่ UPDATE ข้อมูลเดิมแม้แถวเดียว ***
--       เอกสารเก่าอ่านสถานะจากยอดใน gpf/sso/pvd ที่มีอยู่จริง
--
--   (2) njacc_save_wht_draft — รับ has_fund
--       ไม่ติ๊ก -> เขียน gpf_amount / social_security_amount /
--                 provident_fund_amount เป็น NULL ที่ SQL ด้วย
--       กันยอดเก่าที่ค้างในฟอร์มถูกนำไปพิมพ์ทั้งที่ Checkbox ไม่ได้เลือก
--
--   njacc_wht_view ไม่ต้องแก้ — ใช้ to_jsonb(w) คอลัมน์ใหม่จึงไหลออกไปเอง
--
-- ═══ ไม่ทำ ════════════════════════════════════════════════════════════════
--   ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ UPDATE ข้อมูลเดิม
--   ไม่แตะ: has_acting_agent · agent_* · payer/payee · njacc_wht_items ·
--           การคำนวณภาษี · njacc_post_wht · unpost · delete · list · RLS/Policy
--   *** ต้องรัน RUN-17 ก่อน *** (ไฟล์นี้ต่อยอดจาก save_wht_draft ชุดของ RUN-17)
--   รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                    AND column_name='has_acting_agent') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN-17 (ไม่พบ has_acting_agent)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                    AND column_name='gpf_amount') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบคอลัมน์ gpf_amount (ต้องรัน RUN-14 ก่อน)'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- P1 · เอกสารเดิมที่มียอดกองทุน -> หลังรันจะขึ้น Checkbox ติ๊กให้อัตโนมัติ
SELECT 'P1 เอกสารเดิมที่มียอดกองทุน' AS check_item,
       count(*) FILTER (WHERE coalesce(gpf_amount,0) <> 0
                           OR coalesce(social_security_amount,0) <> 0
                           OR coalesce(provident_fund_amount,0) <> 0) AS มี,
       count(*) AS ทั้งหมด
  FROM public.njacc_withholding_docs;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · คอลัมน์สถานะ — เพิ่มใหม่ล้วน ไม่แตะข้อมูลเดิม
ALTER TABLE public.njacc_withholding_docs
  ADD COLUMN IF NOT EXISTS has_fund boolean;

COMMENT ON COLUMN public.njacc_withholding_docs.has_fund IS
  'เอกสารนี้เลือก "เงินกองทุน / ประกันสังคม" หรือไม่ · NULL = เอกสารก่อน V.198 '
  '(ให้อ่านสถานะจากยอดใน gpf_amount / social_security_amount / provident_fund_amount)';

-- 2.2 · njacc_save_wht_draft — ยกนิยามชุด RUN-17 มาทั้งดุ้น เปลี่ยนเฉพาะส่วนกองทุน
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
        payer_name, payer_tax_id, payer_branch, payer_address,
        has_acting_agent, agent_name, agent_tax_id, agent_branch, agent_address,
        payee_customer_id, payee_name, payee_tax_id, payee_branch, payee_address,
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

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY · รันซ้ำได้)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 คอลัมน์ has_fund ถูกเพิ่มแล้ว' AS check_item,
       data_type || ' · nullable=' || is_nullable ||
       ' · default=' || coalesce(column_default,'(ไม่มี)') AS detail,
       CASE WHEN data_type='boolean' AND is_nullable='YES' AND column_default IS NULL
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs'
   AND column_name='has_fund'

UNION ALL
SELECT 'V2 คอลัมน์ยอดกองทุนเดิมยังอยู่ครบ 3 ตัว',
       string_agg(column_name, ', ' ORDER BY column_name),
       CASE WHEN count(*)=3 THEN 'PASS' ELSE 'FAIL' END
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs'
   AND column_name IN ('gpf_amount','social_security_amount','provident_fund_amount')

UNION ALL
SELECT 'V3 save_wht_draft รับ has_fund และล้างยอดเมื่อไม่ติ๊ก',
       'v_has_fund',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%v_has_fund%'
             AND pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%CASE WHEN v_has_fund THEN nullif(btrim(coalesce(p->>''gpf_amount''%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V4 ของ RUN-17 ยังอยู่ครบ (has_acting_agent ไม่ถูกทับหาย)',
       'has_acting_agent',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%v_has_agent%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V5 เอกสารเก่าไม่ถูกแก้ (has_fund ยังเป็น NULL)',
       count(*)::text || ' ใบ · ในนั้นมียอดกองทุนอยู่ '
         || count(*) FILTER (WHERE coalesce(gpf_amount,0) <> 0
                                OR coalesce(social_security_amount,0) <> 0
                                OR coalesce(provident_fund_amount,0) <> 0)::text || ' ใบ',
       'อ่านอย่างเดียว'
  FROM public.njacc_withholding_docs
 WHERE has_fund IS NULL;


-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   รัน RUN-NOW/RUN-17_WHT_HAS_ACTING_AGENT.sql ใหม่
--   (คืน njacc_save_wht_draft เป็นชุดก่อนหน้า)
--   คอลัมน์ has_fund ปล่อยไว้ได้ ไม่มีผลกับโค้ดชุดเก่า
