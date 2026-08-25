-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-20_WHT_PARTY_CODE_MASTER.sql   (ACCOUNT V.204)
-- REPORT > ใบหัก ณ ที่จ่าย — CODE Master ของผู้มีหน้าที่หักภาษี / ผู้ถูกหักภาษี
--
-- ═══ ตรวจ Database เดิมก่อน (ข้อกำหนดข้อ 10) ══════════════════════════════
--   njacc_customers มีอยู่แล้วและ *** ถูกใช้เป็น Master ร่วมของทั้ง 2 ฝ่าย ***
--   อยู่ก่อนหน้านี้แล้ว (หน้า 50 ทวิ เรียก customerOpts() ตัวเดียวกันทั้ง
--   ช่อง "เลือกลูกค้า" ของผู้หักฯ และ "เลือกลูกค้า/Supplier" ของผู้ถูกหักฯ)
--   คอลัมน์ที่มีอยู่: id · customer_code · customer_name · tax_id · branch_code ·
--                    address · contact_name · email · phone · active ·
--                    created_at · updated_at
--   ขาดเพียง citizen_id -> *** ต่อยอดของเดิม ไม่สร้างตารางซ้ำ ***
--
-- ═══ สิ่งที่ไฟล์นี้ทำ ══════════════════════════════════════════════════════
--   (1) njacc_customers.citizen_id text  (nullable)
--   (2) UNIQUE index บน lower(btrim(customer_code)) — CODE ห้ามซ้ำ
--       *** ข้ามแถวที่ CODE ว่าง/NULL *** เพื่อไม่บล็อกข้อมูลเดิมที่ยังไม่มี CODE
--   (3) njacc_withholding_docs.payer_code text — Snapshot CODE ฝั่งผู้หักฯ
--       (payee_code มีอยู่แล้วตั้งแต่ RUN-10)
--   (4) RPC ใหม่ 2 ตัว (เฉพาะงานนี้ · ไม่แตะ njacc_masters / njacc_upsert_customer
--       ที่หน้าอื่นทั้งระบบใช้ร่วมกันอยู่):
--         njacc_wht_party_search(p)  ค้นหา Master ด้วย CODE / ชื่อ / Tax ID
--         njacc_wht_party_upsert(p)  เพิ่ม/แก้ Master (ADMIN เท่านั้น)
--   (5) njacc_save_wht_draft — รับ/บันทึก payer_code
--   (6) njacc_list_wht       — คืน payer_code ให้หน้ารายการ
--
-- ═══ Snapshot (ข้อกำหนดข้อ 9) ═════════════════════════════════════════════
--   เอกสารเก็บ payer_name/branch/tax_id/citizen_id/address และ payee_* อยู่แล้ว
--   *** เป็น Snapshot จริงตั้งแต่ RUN-08 *** -> แก้ Master ภายหลังไม่กระทบเอกสารเก่า
--   RUN-20 เพิ่มแค่ payer_code เพื่อให้รู้ว่าเอกสารนั้นอ้าง CODE ไหนตอนออก
--
-- ═══ ไม่ทำ ════════════════════════════════════════════════════════════════
--   ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ UPDATE ข้อมูลเดิม
--   *** ไม่สร้าง CODE ให้เอกสาร/ลูกค้าเก่าโดยอัตโนมัติ *** (ข้อกำหนดข้อ 12)
--   ไม่แตะ njacc_masters · njacc_upsert_customer · njacc_wht_view ·
--         has_acting_agent · has_fund · citizen_id ของเอกสาร · การคำนวณภาษี
--   ไม่เปิดสิทธิ์ anon · RPC ใหม่ GRANT ให้ authenticated เท่านั้น
--   *** ต้องรัน RUN-17 · RUN-18 · RUN-19 ก่อน ***
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ต้องอ่านผลก่อนรัน SECTION 2)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                    AND column_name='payer_citizen_id') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN-19'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema='public' AND table_name='njacc_customers') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบตาราง njacc_customers'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- P1 · *** ต้องได้ 0 แถว *** ถ้ามี CODE ซ้ำต้องแก้ข้อมูลก่อน
--      (แก้รหัสให้ต่างกัน — ห้ามลบแถว เพราะถูกอ้างจาก njacc_jobs / njacc_invoices)
SELECT 'P1 CODE ซ้ำใน njacc_customers (ต้องได้ 0 แถว)' AS check_item,
       lower(btrim(customer_code)) AS code, count(*) AS n
  FROM public.njacc_customers
 WHERE nullif(btrim(customer_code),'') IS NOT NULL
 GROUP BY 2 HAVING count(*) > 1;

-- P2 · ลูกค้าที่ยังไม่มี CODE — *** ไฟล์นี้ไม่สร้างให้อัตโนมัติ ***
SELECT 'P2 ลูกค้าที่ยังไม่มี CODE (ยังใช้งานได้ตามปกติ)' AS check_item,
       count(*) FILTER (WHERE nullif(btrim(customer_code),'') IS NULL) AS ไม่มี_code,
       count(*) AS ทั้งหมด
  FROM public.njacc_customers;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · Master: เพิ่มเลขบัตรประชาชน (คอลัมน์เดียวที่ขาด)
ALTER TABLE public.njacc_customers
  ADD COLUMN IF NOT EXISTS citizen_id text;
COMMENT ON COLUMN public.njacc_customers.citizen_id IS
  'เลขประจำตัวบัตรประชาชน (13 หลัก · text · ไม่บังคับ) '
  '*** คนละฟิลด์กับ tax_id *** ห้ามใช้แทนกัน';

-- 2.2 · CODE ห้ามซ้ำ (ข้ามค่าว่าง/NULL เพื่อไม่บล็อกข้อมูลเดิม)
CREATE UNIQUE INDEX IF NOT EXISTS njacc_cust_code_uq
  ON public.njacc_customers (lower(btrim(customer_code)))
  WHERE nullif(btrim(customer_code),'') IS NOT NULL;

-- 2.3 · เอกสาร: Snapshot CODE ฝั่งผู้หักฯ (ฝั่งผู้ถูกหักฯ ใช้ payee_code เดิม)
ALTER TABLE public.njacc_withholding_docs
  ADD COLUMN IF NOT EXISTS payer_code text;
COMMENT ON COLUMN public.njacc_withholding_docs.payer_code IS
  'CODE ของ Master ที่เลือกตอนออกเอกสาร (Snapshot) · NULL = เอกสารที่กรอกเองไม่ผ่าน CODE';

-- 2.4 · ค้นหา Master ด้วย CODE / ชื่อ / Tax ID
CREATE OR REPLACE FUNCTION public.njacc_wht_party_search(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles;
        v_q text := nullif(btrim(coalesce(p->>'q','')), '');
        v_code text := nullif(btrim(coalesce(p->>'code','')), '');
        v_size int := least(greatest(coalesce((p->>'size')::int, 50), 1), 200);
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  RETURN jsonb_build_object('rows', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
             'id', c.id, 'code', c.customer_code, 'name', c.customer_name,
             'branch', c.branch_code, 'tax_id', c.tax_id,
             'citizen_id', c.citizen_id, 'address', c.address,
             'active', c.active) ORDER BY c.customer_code NULLS LAST, c.customer_name)
      FROM (SELECT * FROM public.njacc_customers c2
             WHERE c2.active IS NOT FALSE
               /* code = ค้นแบบตรงตัว (ไม่สนตัวพิมพ์) ใช้ตอนพิมพ์ CODE แล้วกด Enter */
               AND (v_code IS NULL
                    OR lower(btrim(c2.customer_code)) = lower(v_code))
               /* q = ค้นแบบมีบางส่วน ทั้ง CODE / ชื่อ / Tax ID */
               AND (v_q IS NULL
                    OR c2.customer_code ILIKE '%'||v_q||'%'
                    OR c2.customer_name ILIKE '%'||v_q||'%'
                    OR regexp_replace(coalesce(c2.tax_id,''),'[^0-9A-Za-z]','','g')
                       ILIKE '%'||regexp_replace(v_q,'[^0-9A-Za-z]','','g')||'%')
             ORDER BY c2.customer_code NULLS LAST, c2.customer_name
             LIMIT v_size) c), '[]'::jsonb));
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_wht_party_search(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_wht_party_search(jsonb) FROM PUBLIC, anon;

-- 2.5 · เพิ่ม/แก้ Master
--   *** สิทธิ์เท่ากับ njacc_upsert_customer เดิม (SUPER_ADMIN / ADMIN) ***
--   ไม่ผ่อนสิทธิ์ให้ต่ำลงเพื่อความสะดวก
CREATE OR REPLACE FUNCTION public.njacc_wht_party_upsert(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_id uuid;
        v_code text := nullif(btrim(coalesce(p->>'code','')), '');
        v_name text := nullif(btrim(coalesce(p->>'name','')), '');
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_code IS NULL THEN RAISE EXCEPTION 'NJACC_PARTY_CODE_REQUIRED'; END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'NJACC_PARTY_NAME_REQUIRED'; END IF;

  v_id := nullif(p->>'id','')::uuid;

  /* CODE ห้ามซ้ำ — เช็คก่อนเพื่อคืน error ที่อ่านรู้เรื่อง
     (UNIQUE index ข้อ 2.2 กันซ้ำอีกชั้นกรณีกดพร้อมกัน) */
  IF EXISTS (SELECT 1 FROM public.njacc_customers
              WHERE lower(btrim(customer_code)) = lower(v_code)
                AND (v_id IS NULL OR id <> v_id)) THEN
    RAISE EXCEPTION 'NJACC_PARTY_CODE_DUPLICATE';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.njacc_customers(customer_code, customer_name, branch_code,
                                       tax_id, citizen_id, address)
    VALUES (v_code, v_name,
            nullif(btrim(coalesce(p->>'branch','')),''),
            nullif(btrim(coalesce(p->>'tax_id','')),''),
            nullif(btrim(coalesce(p->>'citizen_id','')),''),
            nullif(btrim(coalesce(p->>'address','')),''))
    RETURNING id INTO v_id;
  ELSE
    /* แก้ Master โดยตรงเท่านั้น — *** เอกสารไม่มีทางเรียกทางนี้โดยบังเอิญ ***
       (ข้อกำหนดข้อ 8: แก้ข้อมูลในเอกสารห้าม Update Master) */
    UPDATE public.njacc_customers
       SET customer_code = v_code,
           customer_name = v_name,
           branch_code   = nullif(btrim(coalesce(p->>'branch','')),''),
           tax_id        = nullif(btrim(coalesce(p->>'tax_id','')),''),
           citizen_id    = nullif(btrim(coalesce(p->>'citizen_id','')),''),
           address       = nullif(btrim(coalesce(p->>'address','')),''),
           updated_at    = now()
     WHERE id = v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_PARTY_NOT_FOUND'; END IF;
  END IF;

  PERFORM public.njacc_audit(pr.id,'UPSERT_WHT_PARTY','customer',v_id::text,
    jsonb_build_object('code',v_code,'name',v_name));

  RETURN (SELECT jsonb_build_object('id',c.id,'code',c.customer_code,'name',c.customer_name,
            'branch',c.branch_code,'tax_id',c.tax_id,'citizen_id',c.citizen_id,
            'address',c.address,'active',c.active)
            FROM public.njacc_customers c WHERE c.id = v_id);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_wht_party_upsert(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_wht_party_upsert(jsonb) FROM PUBLIC, anon;

-- 2.6 · njacc_save_wht_draft — ยกนิยามชุด RUN-19 มาทั้งดุ้น เพิ่มเฉพาะ payer_code
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
        payer_code, payer_name, payer_tax_id, payer_branch, payer_address, payer_citizen_id,
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
        nullif(btrim(coalesce(p->>'payer_code','')),''),
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
           payer_code=nullif(btrim(coalesce(p->>'payer_code','')),''),
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


-- 2.7 · njacc_list_wht — ยกนิยามชุด RUN-19 มาทั้งดุ้น เพิ่มเฉพาะ payer_code
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
           /* ── เพิ่มใน RUN-20 ── CODE ของ Master ที่เลือกไว้ตอนออกเอกสาร
              (payee_code มีอยู่แล้วตั้งแต่ RUN-10 · เพิ่มเฉพาะฝั่งผู้หักฯ) */
           w.payer_code,
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
SELECT 'V1 njacc_customers.citizen_id ถูกเพิ่มแล้ว' AS check_item,
       data_type || '/' || is_nullable AS detail,
       CASE WHEN data_type='text' AND is_nullable='YES' THEN 'PASS' ELSE 'FAIL' END AS result
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_customers' AND column_name='citizen_id'

UNION ALL
SELECT 'V2 CODE ห้ามซ้ำ (unique index · ข้ามค่าว่าง)',
       indexdef,
       CASE WHEN indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%lower(btrim(customer_code))%'
            THEN 'PASS' ELSE 'FAIL' END
  FROM pg_indexes WHERE schemaname='public' AND indexname='njacc_cust_code_uq'

UNION ALL
SELECT 'V3 njacc_withholding_docs.payer_code ถูกเพิ่มแล้ว',
       data_type || '/' || is_nullable,
       CASE WHEN data_type='text' AND is_nullable='YES' THEN 'PASS' ELSE 'FAIL' END
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='njacc_withholding_docs' AND column_name='payer_code'

UNION ALL
SELECT 'V4 payee_code เดิมยังอยู่ (ไม่ได้สร้างซ้ำ)',
       'payee_code',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                            AND column_name='payee_code') THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V5 RPC ใหม่ 2 ตัว + GRANT authenticated · ไม่เปิดให้ anon',
       'search=' || has_function_privilege('authenticated','public.njacc_wht_party_search(jsonb)','EXECUTE')::text
     || ' upsert=' || has_function_privilege('authenticated','public.njacc_wht_party_upsert(jsonb)','EXECUTE')::text
     || ' anon_search=' || has_function_privilege('anon','public.njacc_wht_party_search(jsonb)','EXECUTE')::text,
       CASE WHEN has_function_privilege('authenticated','public.njacc_wht_party_search(jsonb)','EXECUTE')
             AND has_function_privilege('authenticated','public.njacc_wht_party_upsert(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_wht_party_search(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_wht_party_upsert(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V6 save_wht_draft รับ payer_code',
       'payer_code',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure)
                   LIKE '%payer_code=nullif(btrim(coalesce(p->>''payer_code''%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V7 ของ RUN-17/18/19 ยังอยู่ครบ (ไม่ถูกทับหาย)',
       'has_acting_agent · has_fund · citizen_id',
       CASE WHEN pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure) LIKE '%v_has_agent%'
             AND pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure) LIKE '%v_has_fund%'
             AND pg_get_functiondef('public.njacc_save_wht_draft(jsonb)'::regprocedure) LIKE '%payer_citizen_id%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V8 list_wht คืน payer_code',
       'w.payer_code',
       CASE WHEN pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                   LIKE '%w.payer_code%'
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V9 *** ไม่มีการสร้าง CODE ให้ลูกค้าเก่าอัตโนมัติ ***',
       count(*)::text || ' รายที่ยังไม่มี CODE (คงไว้ตามเดิม)',
       'อ่านอย่างเดียว'
  FROM public.njacc_customers WHERE nullif(btrim(customer_code),'') IS NULL

UNION ALL
SELECT 'V10 njacc_masters / njacc_upsert_customer ไม่ถูกแตะ',
       'ยังมีอยู่ตามเดิม',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_masters')
             AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_upsert_customer')
            THEN 'PASS' ELSE 'FAIL' END;


-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   1) DROP INDEX IF EXISTS public.njacc_cust_code_uq;   (ถ้าต้องการปลด unique)
--   2) รัน RUN-NOW/RUN-19_WHT_CITIZEN_ID.sql ใหม่
--      (คืน njacc_save_wht_draft และ njacc_list_wht เป็นชุดก่อนหน้า)
--   3) RPC ใหม่ 2 ตัวปล่อยไว้ได้ ไม่มีผลกับโค้ดชุดเก่า
--   คอลัมน์ citizen_id / payer_code ปล่อยไว้ได้ ไม่มีผลกับโค้ดชุดเก่า
