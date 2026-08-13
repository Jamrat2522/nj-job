-- =====================================================================
-- BILLING NJ — 005_njacc_rpc.sql  (รันหลัง 004)
-- ทุก write ผ่าน RPC · SECURITY DEFINER ทุกตัว: ตรวจ auth.uid()+permission
-- และ SET search_path = public เสมอ (ตามข้อ 60)
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------
-- A. INTERNAL HELPERS (ไม่ grant ให้ client)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_req_profile()
RETURNS public.njacc_profiles LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public AS $$
DECLARE p public.njacc_profiles;
BEGIN
  SELECT * INTO p FROM public.njacc_profiles
   WHERE auth_user_id = auth.uid() AND active = true LIMIT 1;
  IF p.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  RETURN p;
END $$;
REVOKE ALL ON FUNCTION public.njacc_req_profile() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.njacc_audit(p_pid uuid, p_action text,
  p_etype text, p_eid text, p_detail jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.njacc_audit_logs(profile_id,action,entity_type,entity_id,detail)
  VALUES (p_pid,p_action,p_etype,p_eid,p_detail)
$$;
REVOKE ALL ON FUNCTION public.njacc_audit(uuid,text,text,text,jsonb) FROM public, anon, authenticated;

-- เลขเอกสาร: lock แถว sequence ใน transaction — กัน duplicate ตอน concurrent
CREATE OR REPLACE FUNCTION public.njacc_next_doc_no(p_type text, p_scope text, p_prefix text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n bigint;
BEGIN
  INSERT INTO public.njacc_document_sequences(doc_type,scope_key,last_number)
  VALUES (p_type,p_scope,0)
  ON CONFLICT (doc_type,scope_key) DO NOTHING;
  UPDATE public.njacc_document_sequences
     SET last_number = last_number + 1
   WHERE doc_type=p_type AND scope_key=p_scope
   RETURNING last_number INTO v_n;
  RETURN p_prefix || lpad(v_n::text, 4, '0');
END $$;
REVOKE ALL ON FUNCTION public.njacc_next_doc_no(text,text,text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.njacc_vat_rate()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT value::numeric FROM public.njacc_settings WHERE key='vat_rate'), 7)
$$;
REVOKE ALL ON FUNCTION public.njacc_vat_rate() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_vat_rate() TO authenticated;

-- idempotency: ถ้า request เดิม commit แล้ว → คืน result เดิม
CREATE OR REPLACE FUNCTION public.njacc_idem_check(p_req text, p_op text, p_pid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_req IS NULL OR length(p_req) < 8 THEN RAISE EXCEPTION 'NJACC_BAD_REQUEST_ID'; END IF;
  SELECT result_id INTO v_id FROM public.njacc_idempotency_requests
   WHERE request_id=p_req AND operation=p_op;
  RETURN v_id; -- NULL = ยังไม่เคยทำ
END $$;
REVOKE ALL ON FUNCTION public.njacc_idem_check(text,text,uuid) FROM public, anon, authenticated;

-- ---------------------------------------------------------------
-- B. AUTH / APP STATUS
-- ---------------------------------------------------------------
-- resolve login_name → internal auth email (ทีละคน — ไม่ส่ง mapping ทั้งหมด)
-- หมายเหตุความเสี่ยง: anon เรียกได้ก่อน login (จำเป็นสำหรับ flow)
-- แนะนำระยะยาว: ย้ายไป Edge Function + rate limit
-- ---------------------------------------------------------------
-- AUTH LOOKUP (SERVER-ONLY)
-- ไม่มี njacc_resolve_login แบบ anon อีกต่อไป — เบราว์เซอร์ห้าม resolve ตัวตนภายในเอง
-- ฟังก์ชันนี้ GRANT ให้เฉพาะ service_role (Edge Function njacc-login) เท่านั้น
-- คืน auth_identity แบบ opaque (ไม่มีชื่อจริง/รหัสพนักงาน/เลข 80)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_auth_lookup(p_login text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_identity text;
BEGIN
  SELECT auth_identity INTO v_identity FROM public.njacc_profiles
   WHERE lower(login_name) = lower(trim(p_login)) AND active = true LIMIT 1;
  IF v_identity IS NULL THEN RAISE EXCEPTION 'NJACC_LOGIN_NOT_FOUND'; END IF;
  RETURN v_identity;
END $$;
REVOKE ALL ON FUNCTION public.njacc_auth_lookup(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_auth_lookup(text) TO service_role;

-- หมายเหตุ: ไม่มี njacc_admin_link_auth ในระบบ — การผูก auth user กับโปรไฟล์
-- ทำได้ทางเดียวผ่าน njacc_admin_complete_user() (009) ซึ่งตรวจ ownership + auth.users จริง

-- อ่าน auth_identity ของ profile ที่เพิ่งสร้าง (service_role only — ใช้สร้าง auth user)
CREATE OR REPLACE FUNCTION public.njacc_admin_auth_identity(p_profile uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  SELECT auth_identity INTO v FROM public.njacc_profiles WHERE id = p_profile;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_auth_identity(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_auth_identity(uuid) TO service_role;

-- โปรไฟล์ตัวเอง (ไม่คืน internal_username)
CREATE OR REPLACE FUNCTION public.njacc_my_profile()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.njacc_profiles; v_acc jsonb;
BEGIN
  p := public.njacc_req_profile();
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'charge_type',charge_type,'company_group',company_group,
      'can_view',can_view,'can_create',can_create,'can_edit',can_edit,
      'can_invoice',can_invoice,'can_receive_payment',can_receive_payment,
      'can_issue_receipt',can_issue_receipt,'can_export',can_export,
      'can_void',can_void,'can_manage_users',can_manage_users)),'[]'::jsonb)
  INTO v_acc FROM public.njacc_user_access WHERE profile_id = p.id;
  -- READ-ONLY: ไม่เขียน audit ที่นี่ (LOGIN audit เกิดครั้งเดียวตอน login สำเร็จ ผ่าน njacc_log_login_success)
  RETURN jsonb_build_object('id',p.id,'employee_code',p.employee_code,
    'full_name',p.full_name,'department',p.department,'login_name',p.login_name,
    'role',p.role,'access',v_acc);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_my_profile() TO authenticated;

-- app status: version + maintenance (server-controlled) — anon เรียกได้เพื่อ block login
CREATE OR REPLACE FUNCTION public.njacc_app_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'server_time', now(),
    'deploy_version', coalesce((SELECT value FROM public.njacc_settings WHERE key='deploy_version'),'0'),
    'maintenance_active', coalesce((SELECT value FROM public.njacc_settings WHERE key='maintenance_active'),'false')::boolean
      AND coalesce((SELECT value::timestamptz FROM public.njacc_settings WHERE key='maintenance_until'), now()) > now(),
    'maintenance_until', (SELECT value FROM public.njacc_settings WHERE key='maintenance_until'),
    'maintenance_message', coalesce((SELECT value FROM public.njacc_settings WHERE key='maintenance_message'),
      'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที'))
$$;
GRANT EXECUTE ON FUNCTION public.njacc_app_status() TO anon, authenticated;

-- Deploy ใหม่: SUPER_ADMIN เรียกหลังอัปโหลด Release ครบ → ตั้ง version + maintenance 10 นาที
-- เวลาเริ่ม/จบเก็บฝั่ง server ครั้งเดียว — client หลายเครื่องตรวจพบพร้อมกันไม่รีเซ็ต timer
CREATE OR REPLACE FUNCTION public.njacc_set_deploy_version(p_version text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.njacc_profiles; v_cur text;
BEGIN
  p := public.njacc_req_profile();
  IF p.role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  SELECT value INTO v_cur FROM public.njacc_settings WHERE key='deploy_version';
  IF v_cur IS DISTINCT FROM p_version THEN
    INSERT INTO public.njacc_settings(key,value,updated_by) VALUES
      ('deploy_version',p_version,p.id),
      ('maintenance_active','true',p.id),
      ('maintenance_started_at',now()::text,p.id),
      ('maintenance_until',(now()+interval '10 minutes')::text,p.id)
    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by;
    PERFORM public.njacc_audit(p.id,'DEPLOY_VERSION','settings',p_version,NULL);
  END IF;
  RETURN public.njacc_app_status();
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_set_deploy_version(text) TO authenticated;

-- ---------------------------------------------------------------
-- C. MASTERS (อ่านรวม + admin upsert)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_masters()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.njacc_profiles;
BEGIN
  p := public.njacc_req_profile();
  RETURN jsonb_build_object(
    'customers',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',customer_name,
        'code',customer_code,'tax_id',tax_id,'branch_code',branch_code,'address',address,
        'contact_name',contact_name,'email',email,'phone',phone,
        'credit_term_days',credit_term_days,'active',active) ORDER BY customer_name),'[]'::jsonb)
      FROM public.njacc_customers),
    'companies',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',company_name,
        'code',company_code,'contact_name',contact_name,'active',active) ORDER BY company_name),'[]'::jsonb)
      FROM public.njacc_company_invoices),
    'service_codes',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,
        'description',description,'default_cost',default_cost,'default_charge',default_charge,
        'vat_applicable',vat_applicable,'wht_applicable',wht_applicable,'active',active) ORDER BY code),'[]'::jsonb)
      FROM public.njacc_service_codes),
    'vat_rate', public.njacc_vat_rate());
  -- หมายเหตุ: คืนทุกแถวพร้อม active flag — dropdown ฝั่ง client กรองเฉพาะ active
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_masters() TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_upsert_customer(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF p->>'id' IS NOT NULL THEN
    UPDATE public.njacc_customers SET
      customer_name=coalesce(p->>'customer_name',customer_name),
      customer_code=p->>'customer_code', tax_id=p->>'tax_id', branch_code=p->>'branch_code',
      address=p->>'address', contact_name=p->>'contact_name', email=p->>'email', phone=p->>'phone',
      credit_term_days=coalesce((p->>'credit_term_days')::int,credit_term_days),
      active=coalesce((p->>'active')::boolean,active)
    WHERE id=(p->>'id')::uuid RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.njacc_customers(customer_name,customer_code,tax_id,branch_code,address,
      contact_name,email,phone,credit_term_days)
    VALUES (p->>'customer_name',p->>'customer_code',p->>'tax_id',p->>'branch_code',p->>'address',
      p->>'contact_name',p->>'email',p->>'phone',coalesce((p->>'credit_term_days')::int,30))
    RETURNING id INTO v_id;
  END IF;
  PERFORM public.njacc_audit(pr.id,'UPSERT_CUSTOMER','customer',v_id::text,p - 'id');
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upsert_customer(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_upsert_company(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF p->>'id' IS NOT NULL THEN
    UPDATE public.njacc_company_invoices SET company_name=coalesce(p->>'company_name',company_name),
      company_code=p->>'company_code',
      contact_name = CASE WHEN p ? 'contact_name' THEN nullif(trim(p->>'contact_name'),'') ELSE contact_name END,
      active=coalesce((p->>'active')::boolean,active)
    WHERE id=(p->>'id')::uuid RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.njacc_company_invoices(company_name,company_code,contact_name)
    VALUES (p->>'company_name',p->>'company_code',nullif(trim(coalesce(p->>'contact_name','')),''))
    RETURNING id INTO v_id;
  END IF;
  PERFORM public.njacc_audit(pr.id,'UPSERT_COMPANY','company',v_id::text,p - 'id');
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upsert_company(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_upsert_service_code(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF p->>'id' IS NOT NULL THEN
    UPDATE public.njacc_service_codes SET code=coalesce(p->>'code',code),
      description=coalesce(p->>'description',description),
      default_cost=coalesce((p->>'default_cost')::numeric,default_cost),
      default_charge=coalesce((p->>'default_charge')::numeric,default_charge),
      vat_applicable=coalesce((p->>'vat_applicable')::boolean,vat_applicable),
      wht_applicable=coalesce((p->>'wht_applicable')::boolean,wht_applicable),
      active=coalesce((p->>'active')::boolean,active)
    WHERE id=(p->>'id')::uuid RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.njacc_service_codes(code,description,default_cost,default_charge,vat_applicable,wht_applicable)
    VALUES (p->>'code',p->>'description',coalesce((p->>'default_cost')::numeric,0),
      coalesce((p->>'default_charge')::numeric,0),coalesce((p->>'vat_applicable')::boolean,true),
      coalesce((p->>'wht_applicable')::boolean,false)) RETURNING id INTO v_id;
  END IF;
  PERFORM public.njacc_audit(pr.id,'UPSERT_SERVICE_CODE','service_code',v_id::text,p - 'id');
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upsert_service_code(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- D. CHARGE LIST (server-side filter/sort/pagination) + KPI
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_list_charges(
  p_charge text, p_group text, p_q text DEFAULT NULL, p_status text DEFAULT NULL,
  p_customer uuid DEFAULT NULL, p_due text DEFAULT NULL,
  p_from date DEFAULT NULL, p_to date DEFAULT NULL,
  p_sort text DEFAULT 'date', p_dir text DEFAULT 'desc',
  p_page int DEFAULT 1, p_size int DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb;
        v_off int; v_size int; v_order text;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p_charge,p_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off  := (greatest(coalesce(p_page,1),1)-1) * v_size;
  v_order := CASE WHEN p_sort='invoice_no'
    THEN 'coalesce(invoice_no, source_invoice_no) ' ELSE 'date ' END
    || CASE WHEN lower(p_dir)='asc' THEN 'ASC NULLS LAST' ELSE 'DESC NULLS LAST' END;

  DROP TABLE IF EXISTS _njacc_l;
  CREATE TEMP TABLE _njacc_l ON COMMIT DROP AS
  SELECT j.id, j.job_no, coalesce(j.reference_date,j.created_at::date) AS date,
         i.invoice_no, j.source_invoice_no, c.customer_name, j.customer_job_no,
         ci.company_name AS company_invoice, j.house_bl_no,
         coalesce(i.subtotal,0) AS subtotal, coalesce(i.vat_amount,0) AS vat_amount,
         coalesce(i.wht_amount,0) AS wht_amount, coalesce(i.total_amount,0) AS total_amount,
         j.etd, j.eta, j.due_date, j.note, j.operational_status,
         i.status AS invoice_status, i.payment_status, j.invoice_id, j.customer_id,
         j.charge_type, j.company_group
    FROM public.njacc_jobs j
    LEFT JOIN public.njacc_invoices i ON i.id = j.invoice_id
    LEFT JOIN public.njacc_customers c ON c.id = j.customer_id
    LEFT JOIN public.njacc_company_invoices ci ON ci.id = j.company_invoice_id
   WHERE j.charge_type = p_charge AND j.company_group = p_group
     AND (p_status IS NULL OR p_status='' OR j.operational_status = p_status)
     AND (p_customer IS NULL OR j.customer_id = p_customer)
     AND (p_from IS NULL OR coalesce(j.reference_date,j.created_at::date) >= p_from)
     AND (p_to   IS NULL OR coalesce(j.reference_date,j.created_at::date) <= p_to)
     AND (p_q IS NULL OR p_q='' OR
          i.invoice_no ILIKE '%'||p_q||'%' OR j.source_invoice_no ILIKE '%'||p_q||'%' OR
          c.customer_name ILIKE '%'||p_q||'%' OR j.customer_job_no ILIKE '%'||p_q||'%' OR
          j.house_bl_no ILIKE '%'||p_q||'%' OR j.job_no ILIKE '%'||p_q||'%')
     AND (p_due IS NULL OR p_due='' OR
          (p_due='overdue' AND j.due_date <  current_date AND j.operational_status NOT IN ('CLOSE','CANCELED')) OR
          (p_due='today'   AND j.due_date =  current_date) OR
          (p_due='1-7'     AND j.due_date >  current_date AND j.due_date <= current_date+7) OR
          (p_due='8-30'    AND j.due_date >  current_date+7 AND j.due_date <= current_date+30) OR
          (p_due='30+'     AND j.due_date >  current_date+30));

  SELECT count(*) INTO v_total FROM _njacc_l;
  EXECUTE format('SELECT coalesce(jsonb_agg(t),''[]''::jsonb) FROM
    (SELECT * FROM _njacc_l ORDER BY %s OFFSET %s LIMIT %s) t',
    v_order, v_off, v_size) INTO v_rows;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_list_charges(text,text,text,text,uuid,text,date,date,text,text,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_charge_kpi(
  p_charge text, p_group text, p_q text DEFAULT NULL, p_status text DEFAULT NULL,
  p_customer uuid DEFAULT NULL, p_due text DEFAULT NULL,
  p_from date DEFAULT NULL, p_to date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p_charge,p_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'total_job', count(*),
    'total_overdue', count(*) FILTER (WHERE j.due_date < current_date
        AND j.operational_status NOT IN ('CLOSE','CANCELED')),
    'subtotal', coalesce(sum(i.subtotal),0),
    'vat', coalesce(sum(i.vat_amount),0),
    'total_amount', coalesce(sum(i.total_amount),0),
    'open_jobs', count(*) FILTER (WHERE j.operational_status='OPEN'),
    'close_jobs', count(*) FILTER (WHERE j.operational_status='CLOSE'))
  INTO v
  FROM public.njacc_jobs j
  LEFT JOIN public.njacc_invoices i ON i.id=j.invoice_id AND i.status='ISSUED'
  LEFT JOIN public.njacc_customers c ON c.id=j.customer_id
  WHERE j.charge_type=p_charge AND j.company_group=p_group
    AND (p_status IS NULL OR p_status='' OR j.operational_status=p_status)
    AND (p_customer IS NULL OR j.customer_id=p_customer)
    AND (p_from IS NULL OR coalesce(j.reference_date,j.created_at::date) >= p_from)
    AND (p_to   IS NULL OR coalesce(j.reference_date,j.created_at::date) <= p_to)
    AND (p_q IS NULL OR p_q='' OR c.customer_name ILIKE '%'||p_q||'%'
         OR j.customer_job_no ILIKE '%'||p_q||'%' OR j.source_invoice_no ILIKE '%'||p_q||'%'
         OR j.job_no ILIKE '%'||p_q||'%');
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_charge_kpi(text,text,text,text,uuid,text,date,date) TO authenticated;

-- ---------------------------------------------------------------
-- E. JOBS
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_save_job(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid; v_no text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_new boolean := (p->>'id') IS NULL;
BEGIN
  pr := public.njacc_req_profile();
  IF v_new AND NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF NOT v_new AND NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;
  IF v_new THEN
    v_no := public.njacc_next_doc_no('JOB',
      v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
      'J'||left(v_charge,1)||left(v_group,2)||to_char(now(),'YY')||'-');
    INSERT INTO public.njacc_jobs(job_no,charge_type,company_group,data_type,reference_no,
      reference_date,company_invoice_id,customer_id,customs_declaration_no,source_invoice_no,
      house_bl_no,master_bl_no,booking_no,vessel_name,qty_container,etd,eta,delivery_date,
      customer_job_no,credit_term_days,due_date,note,created_by,updated_by)
    VALUES (v_no,v_charge,v_group,p->>'data_type',p->>'reference_no',
      (p->>'reference_date')::date,(p->>'company_invoice_id')::uuid,(p->>'customer_id')::uuid,
      p->>'customs_declaration_no',p->>'source_invoice_no',p->>'house_bl_no',p->>'master_bl_no',
      p->>'booking_no',p->>'vessel_name',(p->>'qty_container')::int,(p->>'etd')::date,
      (p->>'eta')::date,(p->>'delivery_date')::date,p->>'customer_job_no',
      (p->>'credit_term_days')::int,(p->>'due_date')::date,p->>'note',pr.id,pr.id)
    RETURNING id INTO v_id;
    PERFORM public.njacc_audit(pr.id,'CREATE_JOB','job',v_id::text,jsonb_build_object('job_no',v_no));
  ELSE
    v_id := (p->>'id')::uuid;
    UPDATE public.njacc_jobs SET data_type=p->>'data_type', reference_no=p->>'reference_no',
      reference_date=(p->>'reference_date')::date,
      company_invoice_id=(p->>'company_invoice_id')::uuid, customer_id=(p->>'customer_id')::uuid,
      customs_declaration_no=p->>'customs_declaration_no', source_invoice_no=p->>'source_invoice_no',
      house_bl_no=p->>'house_bl_no', master_bl_no=p->>'master_bl_no', booking_no=p->>'booking_no',
      vessel_name=p->>'vessel_name', qty_container=(p->>'qty_container')::int,
      etd=(p->>'etd')::date, eta=(p->>'eta')::date, delivery_date=(p->>'delivery_date')::date,
      customer_job_no=p->>'customer_job_no', credit_term_days=(p->>'credit_term_days')::int,
      due_date=(p->>'due_date')::date, note=p->>'note', updated_by=pr.id
    WHERE id=v_id AND charge_type=v_charge AND company_group=v_group
      AND operational_status <> 'CANCELED';
    IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
    PERFORM public.njacc_audit(pr.id,'EDIT_JOB','job',v_id::text,NULL);
  END IF;
  -- containers (replace ทั้งชุดถ้าส่งมา)
  IF p ? 'containers' THEN
    DELETE FROM public.njacc_job_containers WHERE job_id=v_id;
    INSERT INTO public.njacc_job_containers(job_id,container_no,container_type,sequence_no)
    SELECT v_id, x->>'container_no', x->>'container_type', ord
      FROM jsonb_array_elements(p->'containers') WITH ORDINALITY AS t(x,ord)
     WHERE coalesce(x->>'container_no','') <> '';
  END IF;
  RETURN jsonb_build_object('id',v_id);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_save_job(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_job_detail(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  SELECT to_jsonb(j) || jsonb_build_object(
      'customer_name',c.customer_name,'company_invoice',ci.company_name,
      'containers',(SELECT coalesce(jsonb_agg(jsonb_build_object('container_no',container_no,
        'container_type',container_type) ORDER BY sequence_no),'[]'::jsonb)
        FROM public.njacc_job_containers WHERE job_id=j.id))
  INTO v FROM public.njacc_jobs j
  LEFT JOIN public.njacc_customers c ON c.id=j.customer_id
  LEFT JOIN public.njacc_company_invoices ci ON ci.id=j.company_invoice_id
  WHERE j.id=p_id;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(v->>'charge_type', v->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_job_detail(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_set_job_status(p_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; j public.njacc_jobs;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO j FROM public.njacc_jobs WHERE id=p_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF p_status NOT IN ('OPEN','PROCESSING','CLOSE','CANCELED') THEN RAISE EXCEPTION 'NJACC_BAD_STATUS'; END IF;
  IF p_status='CANCELED' THEN
    IF NOT public.njacc_can(j.charge_type,j.company_group,'void') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
    IF j.invoice_id IS NOT NULL THEN RAISE EXCEPTION 'NJACC_JOB_HAS_INVOICE'; END IF;
  ELSE
    IF NOT public.njacc_can(j.charge_type,j.company_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  END IF;
  UPDATE public.njacc_jobs SET operational_status=p_status,
    note = CASE WHEN p_note IS NULL THEN note ELSE p_note END, updated_by=pr.id WHERE id=p_id;
  PERFORM public.njacc_audit(pr.id,
    CASE WHEN p_status='CANCELED' THEN 'CANCEL_JOB' ELSE 'SET_JOB_STATUS' END,
    'job',p_id::text,jsonb_build_object('status',p_status));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_set_job_status(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_update_note(p_id uuid, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; j public.njacc_jobs;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO j FROM public.njacc_jobs WHERE id=p_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type,j.company_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  UPDATE public.njacc_jobs SET note=p_note, updated_by=pr.id WHERE id=p_id;
  PERFORM public.njacc_audit(pr.id,'EDIT_NOTE','job',p_id::text,NULL);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_update_note(uuid,text) TO authenticated;

-- ---------------------------------------------------------------
-- F. ISSUE INVOICE (transaction ตาม §44) + view + void
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_issue_invoice(p_job uuid, p_items jsonb,
  p_request_id text, p_invoice_date date DEFAULT NULL, p_due_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; j public.njacc_jobs; v_prev uuid;
        v_no text; v_id uuid; v_rate numeric; it jsonb; v_line int := 0;
        v_amt numeric; v_vat_ap boolean; v_wht_ap boolean; v_wht_rate numeric;
        v_sub numeric := 0; v_vbase numeric := 0; v_vat numeric := 0; v_wht numeric := 0;
        v_lvat numeric; v_lwht numeric;
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
  v_no := public.njacc_next_doc_no('INVOICE', to_char(now(),'YYYY'),
          'INV'||to_char(now(),'YY')||'-');
  INSERT INTO public.njacc_invoices(invoice_no,job_id,customer_id,charge_type,company_group,
    invoice_date,due_date,vat_rate,status,issued_by,issued_at)
  VALUES (v_no,j.id,j.customer_id,j.charge_type,j.company_group,
    coalesce(p_invoice_date,current_date),coalesce(p_due_date,j.due_date),
    v_rate,'ISSUED',pr.id,now())
  RETURNING id INTO v_id;

  FOR it IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_line := v_line + 1;
    v_amt := round(coalesce((it->>'amount')::numeric,0),2);
    IF v_amt < 0 THEN RAISE EXCEPTION 'NJACC_NEGATIVE_AMOUNT'; END IF;
    v_vat_ap := coalesce((it->>'vat_applicable')::boolean,true);
    v_wht_ap := coalesce((it->>'wht_applicable')::boolean,false);
    v_wht_rate := CASE WHEN v_wht_ap THEN coalesce((it->>'wht_rate')::numeric,3) ELSE 0 END;
    v_lvat := CASE WHEN v_vat_ap THEN round(v_amt*v_rate/100,2) ELSE 0 END;
    v_lwht := CASE WHEN v_wht_ap THEN round(v_amt*v_wht_rate/100,2) ELSE 0 END;
    INSERT INTO public.njacc_invoice_items(invoice_id,line_no,code,description,amount,cost,charge,
      vat_rate,vat_amount,wht_rate,wht_amount,line_total)
    VALUES (v_id,v_line,it->>'code',coalesce(it->>'description','-'),v_amt,
      round(coalesce((it->>'cost')::numeric,0),2),round(coalesce((it->>'charge')::numeric,0),2),
      CASE WHEN v_vat_ap THEN v_rate ELSE 0 END,v_lvat,v_wht_rate,v_lwht,v_amt+v_lvat);
    v_sub := v_sub + v_amt;
    IF v_vat_ap THEN v_vbase := v_vbase + v_amt; END IF;
    v_vat := v_vat + v_lvat; v_wht := v_wht + v_lwht;
  END LOOP;

  UPDATE public.njacc_invoices SET subtotal=v_sub, vat_base=v_vbase, vat_amount=v_vat,
    wht_amount=v_wht, total_amount=v_sub+v_vat WHERE id=v_id;
  UPDATE public.njacc_jobs SET invoice_id=v_id, updated_by=pr.id WHERE id=j.id;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'ISSUE_INVOICE',pr.id,'invoice',v_id);
  PERFORM public.njacc_audit(pr.id,'ISSUE_INVOICE','invoice',v_id::text,
    jsonb_build_object('invoice_no',v_no,'job_no',j.job_no,'total',v_sub+v_vat));
  RETURN jsonb_build_object('id',v_id,'invoice_no',v_no,'total_amount',v_sub+v_vat);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_issue_invoice(uuid,jsonb,text,date,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_invoice_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  SELECT to_jsonb(i) || jsonb_build_object(
    'customer', (SELECT jsonb_build_object('name',customer_name,'tax_id',tax_id,
       'address',address,'branch_code',branch_code) FROM public.njacc_customers WHERE id=i.customer_id),
    'job', (SELECT jsonb_build_object('job_no',job_no,'customer_job_no',customer_job_no,
       'house_bl_no',house_bl_no,'source_invoice_no',source_invoice_no) FROM public.njacc_jobs WHERE id=i.job_id),
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.line_no),'[]'::jsonb)
       FROM public.njacc_invoice_items x WHERE x.invoice_id=i.id),
    'paid', coalesce((SELECT sum(allocated_amount) FROM public.njacc_payment_allocations pa
       JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       WHERE pa.invoice_id=i.id),0))
  INTO v FROM public.njacc_invoices i WHERE i.id=p_id;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(v->>'charge_type', v->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_invoice_view(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_void_invoice(p_id uuid, p_reason text, p_request_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; i public.njacc_invoices; v_paid numeric;
BEGIN
  pr := public.njacc_req_profile();
  IF public.njacc_idem_check(p_request_id,'VOID_INVOICE',pr.id) IS NOT NULL THEN RETURN; END IF;
  SELECT * INTO i FROM public.njacc_invoices WHERE id=p_id FOR UPDATE;
  IF i.id IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(i.charge_type,i.company_group,'void') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF i.status='VOID' THEN RETURN; END IF;
  SELECT coalesce(sum(allocated_amount),0) INTO v_paid
    FROM public.njacc_payment_allocations pa
    JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
   WHERE pa.invoice_id=p_id;
  IF v_paid > 0 THEN RAISE EXCEPTION 'NJACC_INVOICE_HAS_PAYMENT'; END IF;
  IF coalesce(p_reason,'')='' THEN RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;
  UPDATE public.njacc_invoices SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=p_id;
  UPDATE public.njacc_jobs SET invoice_id=NULL, updated_by=pr.id WHERE invoice_id=p_id;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'VOID_INVOICE',pr.id,'invoice',p_id);
  PERFORM public.njacc_audit(pr.id,'VOID_INVOICE','invoice',p_id::text,
    jsonb_build_object('reason',p_reason));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_void_invoice(uuid,text,text) TO authenticated;

-- ---------------------------------------------------------------
-- G. PAYMENT + ALLOCATION + RECEIPT (transaction เดียว §46–52)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_customer_open_invoices(p_customer uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','receive_payment') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',i.id,'invoice_no',i.invoice_no,'invoice_date',i.invoice_date,'due_date',i.due_date,
      'total_amount',i.total_amount,'payment_status',i.payment_status,
      'charge_type',i.charge_type,'company_group',i.company_group,
      'paid',coalesce(p.paid,0),'outstanding',i.total_amount-coalesce(p.paid,0))
      ORDER BY i.invoice_date, i.invoice_no),'[]'::jsonb)
    FROM public.njacc_invoices i
    LEFT JOIN (SELECT pa.invoice_id, sum(pa.allocated_amount) AS paid
        FROM public.njacc_payment_allocations pa
        JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       GROUP BY pa.invoice_id) p ON p.invoice_id=i.id
    WHERE i.customer_id=p_customer AND i.status='ISSUED'
      AND i.total_amount-coalesce(p.paid,0) > 0);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_customer_open_invoices(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_receive_payment(p_customer uuid, p_amount numeric,
  p_allocations jsonb, p_request_id text, p_date date DEFAULT NULL,
  p_method text DEFAULT NULL, p_ref text DEFAULT NULL, p_note text DEFAULT NULL,
  p_issue_receipt boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_prev uuid; v_pay uuid; v_rc uuid;
        v_payno text; v_rcno text; al jsonb; v_sum numeric := 0;
        v_inv public.njacc_invoices; v_alloc numeric; v_out numeric;
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

  v_payno := public.njacc_next_doc_no('PAYMENT',to_char(now(),'YYYY'),'PAY'||to_char(now(),'YY')||'-');
  INSERT INTO public.njacc_payments(payment_no,customer_id,payment_date,amount_received,
    method,reference_no,note,created_by)
  VALUES (v_payno,p_customer,coalesce(p_date,current_date),round(p_amount,2),
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
    v_rcno := public.njacc_next_doc_no('RECEIPT',to_char(now(),'YYYY'),'RC'||to_char(now(),'YY')||'-');
    INSERT INTO public.njacc_receipts(receipt_no,customer_id,payment_id,receipt_date,
      total_received,issued_by)
    VALUES (v_rcno,p_customer,v_pay,coalesce(p_date,current_date),round(p_amount,2),pr.id)
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
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_void_receipt(p_id uuid, p_reason text, p_request_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; r public.njacc_receipts; v_inv uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF public.njacc_idem_check(p_request_id,'VOID_RECEIPT',pr.id) IS NOT NULL THEN RETURN; END IF;
  IF NOT public.njacc_can('*','*','void') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF coalesce(p_reason,'')='' THEN RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;
  SELECT * INTO r FROM public.njacc_receipts WHERE id=p_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'NJACC_RECEIPT_NOT_FOUND'; END IF;
  IF r.status='VOID' THEN RETURN; END IF;
  UPDATE public.njacc_receipts SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=p_id;
  UPDATE public.njacc_payments SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=r.payment_id;
  -- recompute payment_status ของ invoice ที่เกี่ยวข้อง
  FOR v_inv IN SELECT DISTINCT invoice_id FROM public.njacc_payment_allocations
               WHERE payment_id=r.payment_id LOOP
    UPDATE public.njacc_invoices i SET payment_status = (
      SELECT CASE WHEN coalesce(sum(pa.allocated_amount),0) <= 0.005 THEN 'UNPAID'
                  WHEN coalesce(sum(pa.allocated_amount),0) >= i.total_amount - 0.005 THEN 'PAID'
                  ELSE 'PARTIAL' END
        FROM public.njacc_payment_allocations pa
        JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       WHERE pa.invoice_id=v_inv)
    WHERE i.id=v_inv;
  END LOOP;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'VOID_RECEIPT',pr.id,'receipt',p_id);
  PERFORM public.njacc_audit(pr.id,'VOID_RECEIPT','receipt',p_id::text,
    jsonb_build_object('reason',p_reason));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_void_receipt(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_list_receipts(p_customer uuid DEFAULT NULL,
  p_from date DEFAULT NULL, p_to date DEFAULT NULL, p_page int DEFAULT 1, p_size int DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_receipts r
   WHERE (p_customer IS NULL OR r.customer_id=p_customer)
     AND (p_from IS NULL OR r.receipt_date>=p_from) AND (p_to IS NULL OR r.receipt_date<=p_to);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT r.id, r.receipt_no, r.receipt_date, r.total_received, r.status,
           c.customer_name, pm.payment_no, pm.method,
           (SELECT coalesce(jsonb_agg(jsonb_build_object('invoice_no',i.invoice_no,'amount',ra.amount)),'[]'::jsonb)
              FROM public.njacc_receipt_allocations ra
              JOIN public.njacc_invoices i ON i.id=ra.invoice_id WHERE ra.receipt_id=r.id) AS invoices
      FROM public.njacc_receipts r
      JOIN public.njacc_customers c ON c.id=r.customer_id
      JOIN public.njacc_payments pm ON pm.id=r.payment_id
     WHERE (p_customer IS NULL OR r.customer_id=p_customer)
       AND (p_from IS NULL OR r.receipt_date>=p_from) AND (p_to IS NULL OR r.receipt_date<=p_to)
     ORDER BY r.receipt_date DESC, r.receipt_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_list_receipts(uuid,date,date,int,int) TO authenticated;

-- ---------------------------------------------------------------
-- H. REPORT (§53)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_report(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_kpi jsonb;
        v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(nullif(p->>'charge_type',''),nullif(p->>'company_group',''),'view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce((p->>'size')::int,20),1),100);
  v_off := (greatest(coalesce((p->>'page')::int,1),1)-1)*v_size;

  DROP TABLE IF EXISTS _njacc_r;
  CREATE TEMP TABLE _njacc_r ON COMMIT DROP AS
  SELECT i.id, i.invoice_no, i.invoice_date, i.due_date, i.charge_type, i.company_group,
         i.status, i.payment_status, i.subtotal, i.vat_amount, i.wht_amount, i.total_amount,
         c.customer_name, j.job_no, j.customer_job_no,
         coalesce(pp.paid,0) AS received, i.total_amount-coalesce(pp.paid,0) AS outstanding,
         (i.status='ISSUED' AND i.payment_status<>'PAID' AND i.due_date<current_date) AS overdue
    FROM public.njacc_invoices i
    JOIN public.njacc_customers c ON c.id=i.customer_id
    JOIN public.njacc_jobs j ON j.id=i.job_id
    LEFT JOIN (SELECT pa.invoice_id, sum(pa.allocated_amount) AS paid
        FROM public.njacc_payment_allocations pa
        JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       GROUP BY pa.invoice_id) pp ON pp.invoice_id=i.id
   WHERE (nullif(p->>'charge_type','') IS NULL OR i.charge_type=p->>'charge_type')
     AND (nullif(p->>'company_group','') IS NULL OR i.company_group=p->>'company_group')
     AND (nullif(p->>'customer_id','') IS NULL OR i.customer_id=(p->>'customer_id')::uuid)
     AND (nullif(p->>'status','') IS NULL OR i.status=p->>'status')
     AND (nullif(p->>'payment_status','') IS NULL OR i.payment_status=p->>'payment_status')
     AND (nullif(p->>'from','') IS NULL OR i.invoice_date >= (p->>'from')::date)
     AND (nullif(p->>'to','') IS NULL OR i.invoice_date <= (p->>'to')::date);

  SELECT count(*) INTO v_total FROM _njacc_r;
  SELECT jsonb_build_object(
    'total_invoice', count(*) FILTER (WHERE status='ISSUED'),
    'invoice_amount', coalesce(sum(total_amount) FILTER (WHERE status='ISSUED'),0),
    'received', coalesce(sum(received) FILTER (WHERE status='ISSUED'),0),
    'outstanding', coalesce(sum(outstanding) FILTER (WHERE status='ISSUED'),0),
    'overdue', count(*) FILTER (WHERE overdue),
    'partial', count(*) FILTER (WHERE status='ISSUED' AND payment_status='PARTIAL'),
    'paid', count(*) FILTER (WHERE status='ISSUED' AND payment_status='PAID'),
    'receipt_count', (SELECT count(*) FROM public.njacc_receipts WHERE status='ISSUED'))
  INTO v_kpi FROM _njacc_r;
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT * FROM _njacc_r ORDER BY invoice_date DESC, invoice_no DESC
    OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'kpi',v_kpi,'rows',v_rows);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_report(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- I. WHT (§55–56)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_create_wht(p jsonb, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_prev uuid; v_id uuid; v_no text;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','issue_receipt') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_prev := public.njacc_idem_check(p_request_id,'CREATE_WHT',pr.id);
  IF v_prev IS NOT NULL THEN RETURN jsonb_build_object('id',v_prev,'idempotent',true); END IF;
  v_no := public.njacc_next_doc_no('WHT',to_char(now(),'YYYY'),'WHT'||to_char(now(),'YY')||'-');
  INSERT INTO public.njacc_withholding_docs(document_no,customer_id,invoice_id,payment_id,
    document_date,wht_type,tax_base,rate,amount,reference_no,created_by)
  VALUES (v_no,(p->>'customer_id')::uuid,(p->>'invoice_id')::uuid,(p->>'payment_id')::uuid,
    coalesce((p->>'document_date')::date,current_date),p->>'wht_type',
    round(coalesce((p->>'tax_base')::numeric,0),2),coalesce((p->>'rate')::numeric,3),
    round(coalesce((p->>'amount')::numeric,
      round(coalesce((p->>'tax_base')::numeric,0)*coalesce((p->>'rate')::numeric,3)/100,2)),2),
    p->>'reference_no',pr.id)
  RETURNING id INTO v_id;
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'CREATE_WHT',pr.id,'wht',v_id);
  PERFORM public.njacc_audit(pr.id,'CREATE_WHT','wht',v_id::text,jsonb_build_object('document_no',v_no));
  RETURN jsonb_build_object('id',v_id,'document_no',v_no);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_create_wht(jsonb,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_list_wht(p_customer uuid DEFAULT NULL,
  p_from date DEFAULT NULL, p_to date DEFAULT NULL, p_page int DEFAULT 1, p_size int DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no
      FROM public.njacc_withholding_docs w
      JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
     ORDER BY w.document_date DESC, w.document_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_void_wht(p_id uuid, p_reason text, p_request_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  IF public.njacc_idem_check(p_request_id,'VOID_WHT',pr.id) IS NOT NULL THEN RETURN; END IF;
  IF NOT public.njacc_can('*','*','void') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF coalesce(p_reason,'')='' THEN RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;
  UPDATE public.njacc_withholding_docs SET status='VOID', voided_by=pr.id, voided_at=now(),
    void_reason=p_reason WHERE id=p_id AND status='ISSUED';
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'VOID_WHT',pr.id,'wht',p_id);
  PERFORM public.njacc_audit(pr.id,'VOID_WHT','wht',p_id::text,jsonb_build_object('reason',p_reason));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_void_wht(uuid,text,text) TO authenticated;

-- ---------------------------------------------------------------
-- J. USERS ADMIN + AUDIT VIEW + BACKUP STATUS
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_admin_list_users()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role <> 'SUPER_ADMIN' AND NOT public.njacc_can('*','*','manage_users') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'employee_code',p.employee_code,'full_name',p.full_name,'department',p.department,
    'login_name',p.login_name,'role',p.role,'active',p.active,
    'linked', p.auth_user_id IS NOT NULL,
    'access',(SELECT coalesce(jsonb_agg(to_jsonb(a) - 'id' - 'profile_id' - 'created_at'),'[]'::jsonb)
       FROM public.njacc_user_access a WHERE a.profile_id=p.id)) ORDER BY p.employee_code),'[]'::jsonb)
   FROM public.njacc_profiles p);
   -- หมายเหตุ: ไม่คืน internal_username (§14)
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_admin_list_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_admin_upsert_user(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  -- EDIT ONLY: สร้างผู้ใช้ใหม่ต้องผ่าน Edge Function njacc-admin-user เท่านั้น
  -- (เวอร์ชันสุดท้ายพร้อม guard ครบอยู่ใน 009_njacc_auth_hardening.sql)
  IF p->>'id' IS NULL THEN RAISE EXCEPTION 'NJACC_CREATE_USER_USE_EDGE'; END IF;
  v_id := (p->>'id')::uuid;
  UPDATE public.njacc_profiles SET full_name=coalesce(p->>'full_name',full_name),
    department=coalesce(p->>'department',department),
    role=coalesce(p->>'role',role), active=coalesce((p->>'active')::boolean,active)
  WHERE id=v_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  IF p ? 'access' THEN
    DELETE FROM public.njacc_user_access WHERE profile_id=v_id;
    INSERT INTO public.njacc_user_access(profile_id,charge_type,company_group,can_view,can_create,
      can_edit,can_invoice,can_receive_payment,can_issue_receipt,can_export,can_void,can_manage_users)
    SELECT v_id, x->>'charge_type', x->>'company_group',
      coalesce((x->>'can_view')::boolean,false),coalesce((x->>'can_create')::boolean,false),
      coalesce((x->>'can_edit')::boolean,false),coalesce((x->>'can_invoice')::boolean,false),
      coalesce((x->>'can_receive_payment')::boolean,false),coalesce((x->>'can_issue_receipt')::boolean,false),
      coalesce((x->>'can_export')::boolean,false),coalesce((x->>'can_void')::boolean,false),
      coalesce((x->>'can_manage_users')::boolean,false)
    FROM jsonb_array_elements(p->'access') AS t(x);
  END IF;
  -- audit: ตัด field ที่อ่อนไหวออกก่อนบันทึก
  PERFORM public.njacc_audit(pr.id,'UPSERT_USER','profile',v_id::text,
    ((p - 'internal_username') - 'internal_email') - 'access');
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_admin_upsert_user(jsonb) TO authenticated;

-- ตัด key อ่อนไหวออกจาก audit detail ก่อนส่งให้เบราว์เซอร์ (server-side sanitization)
CREATE OR REPLACE FUNCTION public.njacc_sanitize_detail(p jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN p IS NULL THEN NULL ELSE
    p - 'password' - 'temp_password' - 'new_password' - 'auth_identity' - 'auth_email'
      - 'internal_username' - 'internal_email' - 'auth_user_id' - 'provisioning_auth_user_id'
      - 'tracked_auth_user_id' - 'access_token' - 'refresh_token' - 'service_role'
      - 'secret' - 'apikey' - 'token'
  END
$$;
REVOKE ALL ON FUNCTION public.njacc_sanitize_detail(jsonb) FROM public, anon, authenticated;

-- LOGIN AUDIT: บันทึกครั้งเดียวหลัง authenticate สำเร็จ (เรียกจาก Edge Function njacc-login)
-- best-effort: ถ้าไฟล์นี้ล้ม การ login ยังสำเร็จตามปกติ (Edge Function ไม่ fail ตาม)
-- ไม่บันทึก password / auth email / auth_identity / token ใด ๆ
CREATE OR REPLACE FUNCTION public.njacc_log_login_success(p_login text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.njacc_profiles
   WHERE lower(login_name) = lower(trim(coalesce(p_login,''))) AND active = true LIMIT 1;
  IF v_id IS NULL THEN RETURN; END IF;
  PERFORM public.njacc_audit(v_id,'LOGIN','profile',v_id::text,
    jsonb_build_object('login_name', p_login));
END $$;
REVOKE ALL ON FUNCTION public.njacc_log_login_success(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_log_login_success(text) TO service_role;

CREATE OR REPLACE FUNCTION public.njacc_list_audit(p_page int DEFAULT 1, p_size int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,50),1),200);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  RETURN jsonb_build_object(
    'total',(SELECT count(*) FROM public.njacc_audit_logs),
    'rows',(SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (
      SELECT a.id,a.action,a.entity_type,a.entity_id,
             public.njacc_sanitize_detail(a.detail) AS detail,
             a.created_at,p.full_name
        FROM public.njacc_audit_logs a LEFT JOIN public.njacc_profiles p ON p.id=a.profile_id
       ORDER BY a.id DESC OFFSET v_off LIMIT v_size) t));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_list_audit(int,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.njacc_backup_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  RETURN jsonb_build_object(
    'last_backup_at',(SELECT value FROM public.njacc_settings WHERE key='backup_last_at'),
    'last_backup_status',(SELECT value FROM public.njacc_settings WHERE key='backup_last_status'),
    'last_verify_status',(SELECT value FROM public.njacc_settings WHERE key='backup_verify_status'),
    'last_restore_test',(SELECT value FROM public.njacc_settings WHERE key='backup_restore_test'));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_backup_status() TO authenticated;

COMMIT;

-- VERIFICATION
SELECT routine_name FROM information_schema.routines
 WHERE routine_schema='public' AND routine_name LIKE 'njacc\_%' ESCAPE '\' ORDER BY routine_name;
-- Rollback: DROP FUNCTION รายตัว (ระบุ signature ตามด้านบน)
