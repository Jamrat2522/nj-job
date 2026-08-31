-- ══════════════════════════════════════════════════════════════════════════
-- RUN-49 — เติม ETD (customer gate) + Bulk Case (Case + ETA ใน operation เดียว)
--   Migration Chain : … -> RUN-46 -> RUN-47 -> RUN-48 -> RUN-49
--
-- ROOT CAUSE ที่แก้
--   (1) เติม ETD : BILLING เดิม (processBulkETD) บังคับ Hard Gate ที่ระดับ query
--         .update({etd}).in('id', ids).eq('customer_name','MAERSK LOGISTICS')
--       ระบบใหม่ยิงผ่าน njacc_bulk_set_field ซึ่งไม่มี gate นี้
--       -> เติม ETD ทับได้ทุกลูกค้า (กว้างกว่าต้นฉบับ)
--   (2) Bulk Case : BILLING เดิม update { case_no, eta? } ใน statement เดียว
--       ระบบใหม่ยิง njacc_bulk_set_field 2 ครั้ง (case_no แล้ว eta)
--       -> เป็นคนละ transaction · ถ้าครั้งที่ 2 ล้ม จะเหลือ case โดยไม่มี eta
--
-- ที่ทำ
--   A) njacc_bulk_set_field : เพิ่มคีย์ optional p->>'customer_gate'
--        ไม่ส่ง / ว่าง -> พฤติกรรมเดิมทุกประการ (ผู้เรียกเดิมไม่กระทบ)
--        ส่งมา        -> update เฉพาะงานที่ชื่อลูกค้าตรง (upper+btrim)
--                        ที่ไม่ตรงคืนใน skipped_customer และไม่ถูกแก้
--   B) njacc_bulk_set_case (ใหม่) : set case_no (+ eta ถ้ามีค่า) ในคำสั่งเดียว
--        eta ว่าง -> ไม่แตะ eta เดิม (ห้ามล้าง)
--
-- *** สำคัญ *** ทั้ง 2 ตัวมี Module Guard ของ RUN-35 อยู่ในตัวฟังก์ชันแล้ว
--   (IF NOT public.njacc_module_allowed('ACCOUNTING') ... NJACC_MODULE_FORBIDDEN)
--   เพราะ CREATE OR REPLACE จะเขียนทับ body ที่ RUN-35 patch ไว้บน Production
--   ถ้าไม่ใส่กลับ = ถอด Module Guard โดยไม่ตั้งใจ
--
-- ไม่ทำ
--   ─ ไม่เปลี่ยน signature ของ njacc_bulk_set_field
--   ─ ไม่ขยาย whitelist field · ไม่แตะ njacc_can / njacc_module_allowed
--   ─ ไม่แตะ njacc_match_job / njacc_bulk_set_status / njacc_upload_*_batch
--   ─ ไม่มี DELETE / DROP / TRUNCATE · ไม่แก้ข้อมูล Production
-- ══════════════════════════════════════════════════════════════════════════

-- ── A) BULK SET FIELD + customer_gate ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_bulk_set_field(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_field text := p->>'field';
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_gate text := nullif(btrim(coalesce(p->>'customer_gate','')),'');
        k text; m jsonb; v_matched int := 0; v_skip int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb;
        v_cust jsonb := '[]'::jsonb; v_req int := 0;
        v_job uuid; v_okgate boolean;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT (public.njacc_module_allowed('ACCOUNTING')) THEN RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_field NOT IN ('case_no','contact','cs_name','i_billing_apl','etd','eta','due_date') THEN
    RAISE EXCEPTION 'NJACC_BAD_FIELD';
  END IF;
  FOR k IN SELECT jsonb_array_elements_text(p->'keys') LOOP
    v_req := v_req + 1;
    m := public.njacc_match_job(v_charge, v_group, k);
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(k); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(k); CONTINUE; END IF;
    v_job := (m->>'job_id')::uuid;

    IF v_gate IS NOT NULL THEN
      SELECT (upper(btrim(c.customer_name)) = upper(v_gate))
        INTO v_okgate
        FROM public.njacc_jobs j
        LEFT JOIN public.njacc_customers c ON c.id = j.customer_id
       WHERE j.id = v_job;
      IF v_okgate IS NOT TRUE THEN v_cust := v_cust || to_jsonb(k); CONTINUE; END IF;
    END IF;

    EXECUTE format('UPDATE public.njacc_jobs SET %I = %s, updated_by=$2 WHERE id = $1 AND operational_status <> ''CANCELED''',
      v_field, CASE WHEN v_field IN ('etd','eta','due_date') THEN '$3::date' ELSE '$3' END)
      USING v_job, pr.id, nullif(p->>'value','');
    IF FOUND THEN v_matched := v_matched + 1; ELSE v_skip := v_skip + 1; END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'BULK_SET_FIELD','job',NULL,
    jsonb_build_object('field',v_field,'value',p->>'value','matched',v_matched,
      'requested',v_req,'charge_type',v_charge,'company_group',v_group,'customer_gate',v_gate));
  RETURN jsonb_build_object('requested',v_req,'matched',v_matched,'skipped',v_skip,
    'not_found',v_nf,'ambiguous',v_amb,'skipped_customer',v_cust);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_bulk_set_field(jsonb) TO authenticated;

-- ── B) BULK SET CASE : case_no (+ eta ถ้ามี) ใน statement เดียว ───────────
CREATE OR REPLACE FUNCTION public.njacc_bulk_set_case(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_case text := nullif(btrim(coalesce(p->>'case_no','')),'');
        v_eta_raw text := nullif(btrim(coalesce(p->>'eta','')),'');
        v_eta date; k text; m jsonb; v_job uuid;
        v_req int := 0; v_matched int := 0; v_skip int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT (public.njacc_module_allowed('ACCOUNTING')) THEN RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_case IS NULL THEN RAISE EXCEPTION 'NJACC_BAD_VALUE'; END IF;
  BEGIN
    v_eta := v_eta_raw::date;                       -- ว่าง -> NULL -> ไม่แตะของเดิม
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'NJACC_BAD_DATE';
  END;
  FOR k IN SELECT jsonb_array_elements_text(p->'keys') LOOP
    v_req := v_req + 1;
    m := public.njacc_match_job(v_charge, v_group, k);
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(k); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(k); CONTINUE; END IF;
    v_job := (m->>'job_id')::uuid;
    UPDATE public.njacc_jobs
       SET case_no = v_case,
           eta     = coalesce(v_eta, eta),          -- ETA ว่าง = คงค่าเดิม ห้ามล้าง
           updated_by = pr.id
     WHERE id = v_job AND operational_status <> 'CANCELED';
    IF FOUND THEN v_matched := v_matched + 1; ELSE v_skip := v_skip + 1; END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'BULK_SET_CASE','job',NULL,
    jsonb_build_object('case_no',v_case,'eta',v_eta,'matched',v_matched,
      'requested',v_req,'charge_type',v_charge,'company_group',v_group));
  RETURN jsonb_build_object('requested',v_req,'matched',v_matched,'skipped',v_skip,
    'not_found',v_nf,'ambiguous',v_amb);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_bulk_set_case(jsonb) TO authenticated;

-- ── VERIFY (READ ONLY) ────────────────────────────────────────────────────
SELECT 'V1 bulk_set_field ยังมี Module Guard' AS check_name,
  (pg_get_functiondef('public.njacc_bulk_set_field(jsonb)'::regprocedure)
     LIKE '%NJACC_MODULE_FORBIDDEN%')::text AS result
UNION ALL SELECT 'V2 bulk_set_case มี Module Guard',
  (pg_get_functiondef('public.njacc_bulk_set_case(jsonb)'::regprocedure)
     LIKE '%NJACC_MODULE_FORBIDDEN%')::text
UNION ALL SELECT 'V3 bulk_set_field รับ customer_gate',
  (pg_get_functiondef('public.njacc_bulk_set_field(jsonb)'::regprocedure)
     LIKE '%customer_gate%')::text
UNION ALL SELECT 'V4 bulk_set_case ไม่ล้าง ETA เดิม',
  (pg_get_functiondef('public.njacc_bulk_set_case(jsonb)'::regprocedure)
     LIKE '%coalesce(v_eta, eta)%')::text;
