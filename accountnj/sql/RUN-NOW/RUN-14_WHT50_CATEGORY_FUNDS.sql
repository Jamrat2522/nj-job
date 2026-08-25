-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-14_WHT50_CATEGORY_FUNDS.sql
-- ใบหัก ณ ที่จ่าย 50 ทวิ — หมวดเงินได้ตามแบบราชการ + เงินกองทุน 3 ช่อง
--
-- ═══ ที่มา (ผู้ใช้อนุมัติแล้ว) ═════════════════════════════════════════════
--   1) wht_income_category ต่อ "รายการเงินได้" — เก็บหมวดของแบบ 50 ทวิ จริง
--      *** ห้าม Auto เดาจาก income_type เดิม ***
--      SERVICE / TRANSPORT / RENT -> Default = ข้อ 5 (ม.3 เตรส) แต่แก้ได้
--      OTHER -> ผู้ใช้เลือกเอง (ไม่มี Default)
--      *** income_type เดิมคงไว้ทั้งหมด ห้ามลบ *** (Logic เดิมของระบบยังใช้)
--   2) เงินกองทุน 3 ช่องบนแบบ 50 ทวิ:
--      gpf_amount               = กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน
--      social_security_amount   = กองทุนประกันสังคม
--      provident_fund_amount    = กองทุนสำรองเลี้ยงชีพ
--
-- ═══ ตรวจ Schema จริงก่อนเขียน ════════════════════════════════════════════
--   njacc_wht_items : id · wht_id · line_no · pay_date · income_type ·
--                     description · tax_base · rate · amount
--                     *** ยังไม่มี wht_income_category ***
--   njacc_withholding_docs : ไม่มีคอลัมน์ fund/pension/social/gpf/provident
--                     (ค้น information_schema แล้วได้ผลลัพธ์ว่าง)
--   njacc_save_wht_draft(jsonb) : signature เดิม -> CREATE OR REPLACE ได้
--
-- ═══ ขอบเขต ═══════════════════════════════════════════════════════════════
--   ไม่มี DO block · ไม่มี DROP / DELETE ข้อมูลธุรกิจ / TRUNCATE
--   (DELETE FROM njacc_wht_items ในตัวฟังก์ชันเป็นตรรกะเดิม — ล้างรายการก่อนเขียนใหม่)
--   ไม่แตะ: njacc_post_wht · njacc_unpost_wht · njacc_void_wht · njacc_wht_view ·
--           njacc_list_wht · njacc_wht_export_page · njacc_delete_wht_draft ·
--           income_type เดิม · การคำนวณภาษี · RLS / Role / Permission
--   Signature เดิมทุกตัว · รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. PREFLIGHT (อ่านอย่างเดียว) ─────────────────────────────────────────
SELECT 'P1 RUN-08/09/10 รันครบแล้ว' AS check_item,
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name IN ('payer_name','form_type','pay_method',
                                         'invoice_no_text','payee_code','payment_by')) = 6
            THEN 'PASS' ELSE 'FAIL — ต้องรัน RUN-08/10 ก่อน' END AS result
UNION ALL
SELECT 'P2 njacc_save_wht_draft signature เดิม',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_wht_draft') = 1
            THEN 'PASS' ELSE 'STOP' END
UNION ALL
SELECT 'P3 income_type เดิมยังอยู่ (ห้ามลบ)',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema='public' AND table_name='njacc_wht_items'
                            AND column_name='income_type')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'P4 ข้อมูลปัจจุบัน (อ้างอิง)',
       (SELECT count(*)::text FROM public.njacc_withholding_docs) || ' ใบ · รายการ ' ||
       (SELECT count(*)::text FROM public.njacc_wht_items) || ' แถว';


-- ── 2. คอลัมน์ใหม่ ────────────────────────────────────────────────────────
--    เงินกองทุน — numeric(14,2) เหมือน tax_base/amount ของระบบ · NULL ได้
ALTER TABLE public.njacc_withholding_docs
  ADD COLUMN IF NOT EXISTS gpf_amount             numeric(14,2),
  ADD COLUMN IF NOT EXISTS social_security_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS provident_fund_amount  numeric(14,2);

COMMENT ON COLUMN public.njacc_withholding_docs.gpf_amount IS
  'เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน (บาท) — บรรทัดกองทุนบนแบบ 50 ทวิ';
COMMENT ON COLUMN public.njacc_withholding_docs.social_security_amount IS
  'เงินที่จ่ายเข้ากองทุนประกันสังคม (บาท) — บรรทัดกองทุนบนแบบ 50 ทวิ';
COMMENT ON COLUMN public.njacc_withholding_docs.provident_fund_amount IS
  'เงินที่จ่ายเข้ากองทุนสำรองเลี้ยงชีพ (บาท) — บรรทัดกองทุนบนแบบ 50 ทวิ';

--    หมวดเงินได้ตามแบบ 50 ทวิ — ต่อรายการ
ALTER TABLE public.njacc_wht_items
  ADD COLUMN IF NOT EXISTS wht_income_category text;

COMMENT ON COLUMN public.njacc_wht_items.wht_income_category IS
  'หมวดเงินได้บนแบบ 50 ทวิ: M40_1 · M40_2 · M40_3 · M40_4A · M40_4B · SEC3TER · OTHER
   *** คนละอย่างกับ income_type *** (income_type = ประเภทเชิงธุรกิจของระบบ ยังใช้ตามเดิม)
   ผู้ใช้เลือกเอง — ระบบไม่เดาให้ (SERVICE/TRANSPORT/RENT ตั้งค่าเริ่มต้นเป็น SEC3TER ที่หน้าจอ)';

--    บังคับค่าที่รับได้ — กันข้อมูลพิมพ์ผิดเข้าฐาน
ALTER TABLE public.njacc_wht_items
  DROP CONSTRAINT IF EXISTS njacc_wht_items_category_ck;

ALTER TABLE public.njacc_wht_items
  ADD CONSTRAINT njacc_wht_items_category_ck
  CHECK (wht_income_category IS NULL OR wht_income_category IN
    ('M40_1','M40_2','M40_3','M40_4A','M40_4B','SEC3TER','OTHER'));

--    เงินกองทุนต้องไม่ติดลบ
ALTER TABLE public.njacc_withholding_docs
  DROP CONSTRAINT IF EXISTS njacc_wht_funds_ck;

ALTER TABLE public.njacc_withholding_docs
  ADD CONSTRAINT njacc_wht_funds_ck
  CHECK (coalesce(gpf_amount,0) >= 0
     AND coalesce(social_security_amount,0) >= 0
     AND coalesce(provident_fund_amount,0) >= 0);


-- ── 3. njacc_save_wht_draft — รับ 3 กองทุน + หมวดต่อรายการ ────────────────
--    ยกนิยามจริงจาก Production (หลัง RUN-10) มาเติมเฉพาะที่จำเป็น
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
        gpf_amount, social_security_amount, provident_fund_amount,
        payer_name, payer_tax_id, payer_branch, payer_address,
        agent_name, agent_tax_id, agent_branch, agent_address,
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
        nullif(btrim(coalesce(p->>'gpf_amount','')),'')::numeric,
        nullif(btrim(coalesce(p->>'social_security_amount','')),'')::numeric,
        nullif(btrim(coalesce(p->>'provident_fund_amount','')),'')::numeric,
        nullif(btrim(coalesce(p->>'payer_name','')),''),
        nullif(btrim(coalesce(p->>'payer_tax_id','')),''),
        nullif(btrim(coalesce(p->>'payer_branch','')),''),
        nullif(btrim(coalesce(p->>'payer_address','')),''),
        nullif(btrim(coalesce(p->>'agent_name','')),''),
        nullif(btrim(coalesce(p->>'agent_tax_id','')),''),
        nullif(btrim(coalesce(p->>'agent_branch','')),''),
        nullif(btrim(coalesce(p->>'agent_address','')),''),
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
           gpf_amount=nullif(btrim(coalesce(p->>'gpf_amount','')),'')::numeric,
           social_security_amount=nullif(btrim(coalesce(p->>'social_security_amount','')),'')::numeric,
           provident_fund_amount=nullif(btrim(coalesce(p->>'provident_fund_amount','')),'')::numeric,
           payer_name=nullif(btrim(coalesce(p->>'payer_name','')),''),
           payer_tax_id=nullif(btrim(coalesce(p->>'payer_tax_id','')),''),
           payer_branch=nullif(btrim(coalesce(p->>'payer_branch','')),''),
           payer_address=nullif(btrim(coalesce(p->>'payer_address','')),''),
           agent_name=nullif(btrim(coalesce(p->>'agent_name','')),''),
           agent_tax_id=nullif(btrim(coalesce(p->>'agent_tax_id','')),''),
           agent_branch=nullif(btrim(coalesce(p->>'agent_branch','')),''),
           agent_address=nullif(btrim(coalesce(p->>'agent_address','')),''),
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
                       'invoice_id',v_inv,'direction',v_dir));

  RETURN jsonb_build_object('id',v_id,'status','DRAFT','direction',v_dir,
    'document_no',(SELECT document_no FROM public.njacc_withholding_docs WHERE id=v_id),
    'tax_base',v_tbase,'amount',v_tamt,'lines',v_line);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_save_wht_draft(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_wht_draft(jsonb) FROM PUBLIC, anon;


-- ── VERIFY (อ่านอย่างเดียว) ───────────────────────────────────────────────
SELECT 'V1 คอลัมน์กองทุนครบ 3 ตัว (numeric)' AS check_item,
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name IN ('gpf_amount','social_security_amount','provident_fund_amount')
                     AND data_type='numeric') = 3
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 wht_income_category มีใน njacc_wht_items',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema='public' AND table_name='njacc_wht_items'
                            AND column_name='wht_income_category' AND data_type='text')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 *** income_type เดิมยังอยู่ (ไม่ถูกลบ) ***',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema='public' AND table_name='njacc_wht_items'
                            AND column_name='income_type')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 CHECK หมวดรับ 7 ค่า + NULL',
       CASE WHEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conrelid='public.njacc_wht_items'::regclass
                     AND conname='njacc_wht_items_category_ck') LIKE '%SEC3TER%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 CHECK เงินกองทุนห้ามติดลบ',
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint
                          WHERE conrelid='public.njacc_withholding_docs'::regclass
                            AND conname='njacc_wht_funds_ck')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 save_draft รับ 3 กองทุน (INSERT + UPDATE)',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%gpf_amount=nullif%'
            AND (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%social_security_amount=nullif%'
            AND (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%provident_fund_amount=nullif%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 save_draft รับ wht_income_category ต่อรายการ · *** ไม่เดาให้ ***',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%v_cat := nullif(btrim(coalesce(it->>''wht_income_category'','''')),'''')%'
            AND (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   NOT LIKE '%CASE WHEN income_type%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 การคำนวณภาษีไม่ถูกแตะ (ACTING_AGENT ใช้ amount ที่กรอก)',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%IF v_agent AND (it ? ''amount'')%'
            AND (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%ELSE%v_amt := round(v_base * v_rate / 100, 2);%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V9 RECEIVED เดิมไม่กระทบ',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure))
                   LIKE '%NJACC_WHT_CUSTOMER_REQUIRED%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V10 njacc_wht_view ใช้ to_jsonb -> คอลัมน์ใหม่ถูกส่งกลับเอง',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%to_jsonb(%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_wht_view')
            THEN 'PASS' ELSE 'ตรวจเพิ่ม — view อาจต้องเติม projection' END
UNION ALL
SELECT 'V11 RPC ชุด WHT ครบ 10 ตัว · ไม่มี overload',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname IN
                     ('njacc_save_wht_draft','njacc_post_wht','njacc_wht_view',
                      'njacc_delete_wht_draft','njacc_wht_invoice_options',
                      'njacc_list_wht','njacc_void_wht','njacc_unpost_wht',
                      'njacc_wht_export','njacc_wht_export_page')) = 10
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V12 ข้อมูลเดิมไม่ถูกแตะ (คอลัมน์ใหม่เป็น NULL หมด)',
       CASE WHEN (SELECT count(*) FROM public.njacc_wht_items
                   WHERE wht_income_category IS NOT NULL) = 0
            THEN 'PASS' ELSE 'OK (มีข้อมูลแล้ว — ปกติถ้าบันทึกหลังรันไฟล์นี้)' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   *** ห้าม DROP COLUMN *** ข้อมูลที่กรอกไว้จะหายถาวร
--   คืนนิยาม save_draft เดิม: เก็บ pg_get_functiondef ไว้ก่อนรัน แล้ว EXECUTE กลับ
--   ถอด CHECK (ทำได้ ไม่กระทบข้อมูล):
--     ALTER TABLE public.njacc_wht_items DROP CONSTRAINT njacc_wht_items_category_ck;
--     ALTER TABLE public.njacc_withholding_docs DROP CONSTRAINT njacc_wht_funds_ck;
