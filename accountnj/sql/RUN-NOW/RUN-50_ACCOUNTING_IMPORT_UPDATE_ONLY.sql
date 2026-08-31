-- ══════════════════════════════════════════════════════════════════════════
-- RUN-50 — ACCOUNTING Upload : UPDATE EXISTING ONLY (Role ACCOUNT ใช้ได้)
--   Migration Chain : … -> RUN-47 -> RUN-48 -> RUN-49 -> RUN-50
--
-- ROOT CAUSE ที่แก้
--   หน้า ACCOUNTING (SERVICE/ADVANCE) กดปุ่ม 📁 Upload -> charge-import.js
--   เรียก njacc_import_resolve_masters + njacc_import_jobs_batch
--   แต่ RUN-35 ผูก RPC 2 ตัวนี้ไว้กับ Module 'DOCUMENT' เท่านั้น
--     ('njacc_import_jobs_batch',      'DOCUMENT')
--     ('njacc_import_resolve_masters', 'DOCUMENT')
--   njacc_module_allowed() ของ RUN-33 : ACCOUNT -> เฉพาะ 'ACCOUNTING'
--   -> Role ACCOUNT ยิงแล้วได้ NJACC_MODULE_FORBIDDEN เสมอ · Upload ใช้ไม่ได้
--   ซ้ำ : njacc_import_jobs_batch ตรวจ njacc_can(...,'create') ซึ่ง ACCOUNT
--         ไม่มีสิทธิ์นี้ (RUN-33 : ACCOUNT = view/edit/invoice/receive_payment/
--         issue_receipt/void/export)
--
-- *** ห้ามแก้ด้วยการเปิด njacc_import_jobs_batch เดิมให้ ACCOUNTING ***
--   เพราะ RPC เดิมมี branch  IF v_id IS NULL THEN INSERT INTO njacc_jobs …
--   -> ACCOUNT จะสร้าง Job ใหม่ได้ ซึ่งผิดกฎธุรกิจ
--      (งานต้องเปิดจาก DOCUMENT แล้วกด "ปิดงาน" ส่งเข้ามาเท่านั้น)
--
-- ที่ทำ — เพิ่ม RPC ใหม่ 2 ตัว ชื่อบอกชัดว่าเป็น ACCOUNTING + UPDATE ONLY
--   A) njacc_acc_import_resolve_masters(jsonb)  READ ONLY (Preview)
--   B) njacc_acc_import_jobs_batch(jsonb)       UPDATE EXISTING ONLY
--
-- ข้อบังคับที่บังคับฝั่ง Server (Browser ปลอมไม่ได้)
--   ─ Module Guard : njacc_module_allowed('ACCOUNTING')  -> ACCOUNT ผ่าน
--   ─ Action Guard : njacc_can(charge, group, 'edit')    -> ไม่ใช้ 'create'
--   ─ *** ไม่มี INSERT INTO njacc_jobs ในไฟล์นี้ *** NOT_FOUND = รายงานอย่างเดียว
--   ─ *** ไม่มี INSERT INTO njacc_customers / njacc_company_invoices ***
--   ─ AMBIGUOUS (job ซ้ำ >1) = รายงาน ไม่แตะข้อมูล
--   ─ scope charge_type + company_group บังคับจากหน้าที่กด Upload
--     match เฉพาะ  charge_type = v_charge AND company_group = v_group
--     -> SERVICE ไม่ข้ามไป ADVANCE · ADVANCE ไม่ข้ามไป SERVICE
--   ─ CANCELED Guard เดิม : UPDATE … WHERE operational_status <> 'CANCELED'
--   ─ INVOICED JOB Guard เดิม : ยกมาครบทั้ง locked_fields + financial_blocked
--   ─ FILE AUTHORITY เดิม : update เฉพาะ field ที่มีใน header (f ? 'x')
--
-- ไม่ทำ
--   ─ ไม่แตะ njacc_import_resolve_masters / njacc_import_jobs_batch /
--     njacc_import_create_masters  -> DOCUMENT Import Flow เดิมเหมือนเดิม 100%
--   ─ ไม่แตะ njacc_can / njacc_module_allowed / njacc_require_queue
--   ─ ไม่แตะตาราง · ไม่แตะ RLS · ไม่แตะเลขเอกสาร · ไม่แตะ Invoice/POST/UNPOST
--   ─ ไม่มี DROP / DELETE / TRUNCATE / ALTER · ไม่แก้ข้อมูล Production
-- ══════════════════════════════════════════════════════════════════════════

-- ── A) RESOLVE MASTERS (ACCOUNTING · READ ONLY) ────────────────────────────
--   Logic เดียวกับ njacc_import_resolve_masters ทุกบรรทัด (exact normalized
--   ห้าม fuzzy) ต่างกันแค่ Guard : ACCOUNTING + 'edit'
CREATE OR REPLACE FUNCTION public.njacc_acc_import_resolve_masters(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_cust jsonb := '[]'::jsonb; v_comp jsonb := '[]'::jsonb;
        nm text; v_n int; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_module_allowed('ACCOUNTING') THEN
    RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can(p->>'charge_type', p->>'company_group', 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'customers') LOOP
    SELECT count(*), (array_agg(id))[1] INTO v_n, v_id FROM public.njacc_customers
     WHERE upper(regexp_replace(trim(customer_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'));
    v_cust := v_cust || jsonb_build_object('name',nm,
      'status', CASE WHEN v_n=0 THEN 'NOT_FOUND' WHEN v_n=1 THEN 'OK' ELSE 'AMBIGUOUS' END,
      'id', CASE WHEN v_n=1 THEN v_id::text END);
  END LOOP;
  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'companies') LOOP
    SELECT count(*), (array_agg(id))[1] INTO v_n, v_id FROM public.njacc_company_invoices
     WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'))
        OR upper(trim(coalesce(company_code,''))) = upper(trim(nm));
    v_comp := v_comp || jsonb_build_object('name',nm,
      'status', CASE WHEN v_n=0 THEN 'NOT_FOUND' WHEN v_n=1 THEN 'OK' ELSE 'AMBIGUOUS' END,
      'id', CASE WHEN v_n=1 THEN v_id::text END);
  END LOOP;
  RETURN jsonb_build_object('customers',v_cust,'companies',v_comp,'mode','ACCOUNTING_UPDATE_ONLY');
END $$;
REVOKE ALL     ON FUNCTION public.njacc_acc_import_resolve_masters(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_acc_import_resolve_masters(jsonb) TO authenticated;

-- ── B) IMPORT BATCH (ACCOUNTING · UPDATE EXISTING ONLY) ────────────────────
--   rows[i] = { key, fields:{...}, money:{...} }  โครงเดิมของ charge-import.js
--   คืน inserted = 0 เสมอ (คงคีย์ไว้เพื่อให้ resultDialog เดิมอ่านได้)
--   คืน not_found = [{key, reason:'JOB_NOT_FOUND'}] เพิ่มจากของเดิม
CREATE OR REPLACE FUNCTION public.njacc_acc_import_jobs_batch(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        r jsonb; f jsonb; mny jsonb; v_key text; v_n int; v_id uuid;
        v_upd int := 0; v_skip int := 0;
        v_amb jsonb := '[]'::jsonb; v_unres jsonb := '[]'::jsonb; v_fail jsonb := '[]'::jsonb;
        v_nf jsonb := '[]'::jsonb;
        v_cust uuid; v_comp uuid; v_has_money boolean; v_locked boolean := false;
        v_bad text[]; v_lockrep jsonb := '[]'::jsonb; v_has_money_row boolean := false;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_module_allowed('ACCOUNTING') THEN
    RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can(v_charge, v_group, 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;

  FOR r IN SELECT jsonb_array_elements(p->'rows') LOOP
    f := coalesce(r->'fields','{}'::jsonb);
    mny := r->'money';
    v_has_money_row := mny IS NOT NULL AND jsonb_typeof(mny)='object' AND mny <> '{}'::jsonb;
    v_locked := false; v_bad := NULL;
    v_key := public.njacc_norm_key(r->>'key');
    v_cust := NULL; v_comp := NULL;

    -- resolve master แบบ exact normalized (ไม่มี fuzzy · ไม่สร้างใหม่)
    IF f ? 'customer_name' AND coalesce(f->>'customer_name','') <> '' THEN
      SELECT count(*), (array_agg(id))[1] INTO v_n, v_cust FROM public.njacc_customers
       WHERE upper(regexp_replace(trim(customer_name),'\s+',' ','g'))
           = upper(regexp_replace(trim(f->>'customer_name'),'\s+',' ','g'));
      IF v_n <> 1 THEN
        v_unres := v_unres || jsonb_build_object('key',r->>'key','customer',f->>'customer_name',
          'reason', CASE WHEN v_n=0 THEN 'CUSTOMER_NOT_FOUND' ELSE 'CUSTOMER_AMBIGUOUS' END);
        CONTINUE;
      END IF;
    END IF;
    IF f ? 'company_invoice' AND coalesce(f->>'company_invoice','') <> '' THEN
      SELECT count(*), (array_agg(id))[1] INTO v_n, v_comp FROM public.njacc_company_invoices
       WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g'))
           = upper(regexp_replace(trim(f->>'company_invoice'),'\s+',' ','g'))
          OR upper(trim(coalesce(company_code,''))) = upper(trim(f->>'company_invoice'));
      IF v_n <> 1 THEN
        v_unres := v_unres || jsonb_build_object('key',r->>'key','company',f->>'company_invoice',
          'reason', CASE WHEN v_n=0 THEN 'COMPANY_NOT_FOUND' ELSE 'COMPANY_AMBIGUOUS' END);
        CONTINUE;
      END IF;
    END IF;

    -- match งานเดิมใน scope นี้เท่านั้น — ซ้ำ >1 = AMBIGUOUS · 0 = NOT_FOUND (ห้าม INSERT)
    v_id := NULL;
    IF v_key IS NULL THEN
      v_nf := v_nf || jsonb_build_object('key', r->>'key', 'reason','EMPTY_KEY');
      CONTINUE;
    END IF;
    SELECT count(*), (array_agg(id))[1] INTO v_n, v_id FROM public.njacc_jobs
     WHERE charge_type = v_charge AND company_group = v_group
       AND public.njacc_norm_key(source_invoice_no) = v_key;
    IF v_n > 1 THEN
      v_amb := v_amb || jsonb_build_object('key',r->>'key','count',v_n);
      CONTINUE;
    END IF;
    IF v_n = 0 OR v_id IS NULL THEN
      -- *** UPDATE EXISTING ONLY *** ไม่พบงานเดิม -> รายงาน ห้ามสร้าง Job ใหม่
      v_nf := v_nf || jsonb_build_object('key', r->>'key', 'reason','JOB_NOT_FOUND');
      CONTINUE;
    END IF;

    BEGIN
      /* INVOICED JOB GUARD (ยกจาก njacc_import_jobs_batch ทุกบรรทัด)
         งานที่ออก INVOICE แล้ว ห้าม import แก้ field ที่กระทบบัญชี
         อนุญาตเฉพาะ operational metadata: case_no / contact / cs_name /
         i_billing_apl / eta / etd / note */
      SELECT invoice_id IS NOT NULL INTO v_locked FROM public.njacc_jobs WHERE id = v_id;
      IF v_locked THEN
        v_bad := ARRAY(SELECT k FROM unnest(ARRAY['customer_name','company_invoice','reference_date',
                        'credit_term_days','due_date','data_type','customs_declaration_no',
                        'house_bl_no','master_bl_no','customer_job_no','operational_status']) k
                        WHERE f ? k);
        IF array_length(v_bad,1) > 0 OR v_has_money_row THEN
          v_lockrep := v_lockrep || jsonb_build_object('key', r->>'key',
            'reason','INVOICED_JOB_LOCKED_FIELDS',
            'locked_fields', to_jsonb(coalesce(v_bad, ARRAY[]::text[])),
            'financial_blocked', v_has_money_row);
          f := f - 'customer_name' - 'company_invoice' - 'reference_date' - 'credit_term_days'
                 - 'due_date' - 'data_type' - 'customs_declaration_no' - 'house_bl_no'
                 - 'master_bl_no' - 'customer_job_no' - 'operational_status';
        END IF;
      END IF;

      -- update เฉพาะ field ที่มีใน header (f ? 'x') — field ที่ไฟล์ไม่มี ห้ามถูกล้าง
      UPDATE public.njacc_jobs SET
        data_type = CASE WHEN f ? 'data_type' THEN f->>'data_type' ELSE data_type END,
        reference_date = CASE WHEN f ? 'reference_date' THEN (nullif(f->>'reference_date',''))::date ELSE reference_date END,
        customer_id = CASE WHEN f ? 'customer_name' THEN coalesce(v_cust,customer_id) ELSE customer_id END,
        company_invoice_id = CASE WHEN f ? 'company_invoice' THEN coalesce(v_comp,company_invoice_id) ELSE company_invoice_id END,
        customer_job_no = CASE WHEN f ? 'customer_job_no' THEN f->>'customer_job_no' ELSE customer_job_no END,
        customs_declaration_no = CASE WHEN f ? 'customs_declaration_no' THEN f->>'customs_declaration_no' ELSE customs_declaration_no END,
        house_bl_no = CASE WHEN f ? 'house_bl_no' THEN f->>'house_bl_no' ELSE house_bl_no END,
        master_bl_no = CASE WHEN f ? 'master_bl_no' THEN f->>'master_bl_no' ELSE master_bl_no END,
        etd = CASE WHEN f ? 'etd' THEN (nullif(f->>'etd',''))::date ELSE etd END,
        eta = CASE WHEN f ? 'eta' THEN (nullif(f->>'eta',''))::date ELSE eta END,
        due_date = CASE WHEN f ? 'due_date' THEN (nullif(f->>'due_date',''))::date ELSE due_date END,
        credit_term_days = CASE WHEN f ? 'credit_term_days' THEN (nullif(f->>'credit_term_days',''))::int ELSE credit_term_days END,
        cs_name = CASE WHEN f ? 'cs_name' THEN f->>'cs_name' ELSE cs_name END,
        i_billing_apl = CASE WHEN f ? 'i_billing_apl' THEN f->>'i_billing_apl' ELSE i_billing_apl END,
        case_no = CASE WHEN f ? 'case_no' THEN f->>'case_no' ELSE case_no END,
        contact = CASE WHEN f ? 'contact' THEN f->>'contact' ELSE contact END,
        note = CASE WHEN f ? 'note' THEN f->>'note' ELSE note END,
        operational_status = CASE WHEN f ? 'operational_status' AND coalesce(f->>'operational_status','') <> ''
                                  THEN f->>'operational_status' ELSE operational_status END,
        updated_by = pr.id
      WHERE id = v_id AND operational_status <> 'CANCELED';
      IF FOUND THEN v_upd := v_upd + 1; ELSE v_skip := v_skip + 1; CONTINUE; END IF;

      -- FINANCIAL SNAPSHOT (ไม่ใช่ INVOICE) — เก็บค่าตามไฟล์ต้นทางตรง ๆ
      v_has_money := v_has_money_row AND NOT v_locked;   -- invoiced job → ไม่แตะยอดเงิน
      IF v_has_money THEN
        INSERT INTO public.njacc_job_financial_snapshot(job_id,source_type,service_charge,advance,
          vat,amount,wht,total_amount,imported_by)
        VALUES (v_id,'IMPORT_OLD_BILLING',
          (nullif(mny->>'service_charge',''))::numeric,(nullif(mny->>'advance',''))::numeric,
          (nullif(mny->>'vat',''))::numeric,(nullif(mny->>'amount',''))::numeric,
          (nullif(mny->>'wht',''))::numeric,(nullif(mny->>'total_amount',''))::numeric,pr.id)
        ON CONFLICT (job_id) DO UPDATE SET
          service_charge = CASE WHEN mny ? 'service_charge' THEN EXCLUDED.service_charge
                                ELSE public.njacc_job_financial_snapshot.service_charge END,
          advance = CASE WHEN mny ? 'advance' THEN EXCLUDED.advance
                         ELSE public.njacc_job_financial_snapshot.advance END,
          vat = CASE WHEN mny ? 'vat' THEN EXCLUDED.vat
                     ELSE public.njacc_job_financial_snapshot.vat END,
          amount = CASE WHEN mny ? 'amount' THEN EXCLUDED.amount
                        ELSE public.njacc_job_financial_snapshot.amount END,
          wht = CASE WHEN mny ? 'wht' THEN EXCLUDED.wht
                     ELSE public.njacc_job_financial_snapshot.wht END,
          total_amount = CASE WHEN mny ? 'total_amount' THEN EXCLUDED.total_amount
                              ELSE public.njacc_job_financial_snapshot.total_amount END,
          imported_at=now(), imported_by=EXCLUDED.imported_by;
      END IF;
    EXCEPTION WHEN others THEN
      v_fail := v_fail || jsonb_build_object('key',r->>'key','reason',left(SQLERRM,150));
    END;
  END LOOP;

  PERFORM public.njacc_audit(pr.id,'ACC_IMPORT_JOBS_UPDATE_ONLY','job',NULL,
    jsonb_build_object('charge_type',v_charge,'company_group',v_group,
      'updated',v_upd,'skipped',v_skip,'not_found',jsonb_array_length(v_nf)));
  RETURN jsonb_build_object('inserted',0,'updated',v_upd,'skipped',v_skip,
    'ambiguous',v_amb,'unresolved_master',v_unres,'failed',v_fail,
    'invoiced_locked',v_lockrep,'not_found',v_nf,'mode','ACCOUNTING_UPDATE_ONLY');
END $$;
REVOKE ALL     ON FUNCTION public.njacc_acc_import_jobs_batch(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_acc_import_jobs_batch(jsonb) TO authenticated;

-- ── VERIFY (READ ONLY) ────────────────────────────────────────────────────
SELECT 'A1 acc_import_jobs_batch มี ACCOUNTING Module Guard' AS check_name,
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
     LIKE '%njacc_module_allowed(''ACCOUNTING'')%')::text AS result
UNION ALL SELECT 'A2 *** ไม่มี INSERT INTO njacc_jobs (UPDATE EXISTING ONLY) ***',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
     NOT ILIKE '%INSERT INTO public.njacc_jobs%')::text
UNION ALL SELECT 'A3 *** ไม่สร้าง Customer/Company Master ***',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
       NOT ILIKE '%INSERT INTO public.njacc_customers%'
   AND pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
       NOT ILIKE '%INSERT INTO public.njacc_company_invoices%')::text
UNION ALL SELECT 'A4 ใช้ njacc_can(...,''edit'') ไม่ใช่ ''create''',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
       LIKE '%njacc_can(v_charge, v_group, ''edit'')%'
   AND pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
       NOT LIKE '%''create''%')::text
UNION ALL SELECT 'A5 CANCELED Guard คงเดิม',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
     LIKE '%operational_status <> ''CANCELED''%')::text
UNION ALL SELECT 'A6 SCOPE charge_type + company_group บังคับตอน match',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
     LIKE '%charge_type = v_charge AND company_group = v_group%')::text
UNION ALL SELECT 'A7 INVOICED JOB Guard คงเดิม',
  (pg_get_functiondef('public.njacc_acc_import_jobs_batch(jsonb)'::regprocedure)
     LIKE '%INVOICED_JOB_LOCKED_FIELDS%')::text
UNION ALL SELECT 'A8 resolve_masters มี ACCOUNTING Guard + READ ONLY',
  (pg_get_functiondef('public.njacc_acc_import_resolve_masters(jsonb)'::regprocedure)
       LIKE '%njacc_module_allowed(''ACCOUNTING'')%'
   AND pg_get_functiondef('public.njacc_acc_import_resolve_masters(jsonb)'::regprocedure)
       NOT ILIKE '%INSERT INTO%')::text
UNION ALL SELECT 'A9 DOCUMENT Import Flow เดิมไม่ถูกแตะ (ยังเป็น DOCUMENT-only)',
  (pg_get_functiondef('public.njacc_import_jobs_batch(jsonb)'::regprocedure)
       LIKE '%njacc_module_allowed(''DOCUMENT'')%'
   AND pg_get_functiondef('public.njacc_import_jobs_batch(jsonb)'::regprocedure)
       ILIKE '%INSERT INTO public.njacc_jobs%')::text
UNION ALL SELECT 'A10 Grant : authenticated=yes · anon=no',
  (has_function_privilege('authenticated','public.njacc_acc_import_jobs_batch(jsonb)','EXECUTE')
   AND NOT has_function_privilege('anon','public.njacc_acc_import_jobs_batch(jsonb)','EXECUTE')
   AND has_function_privilege('authenticated','public.njacc_acc_import_resolve_masters(jsonb)','EXECUTE')
   AND NOT has_function_privilege('anon','public.njacc_acc_import_resolve_masters(jsonb)','EXECUTE'))::text;
