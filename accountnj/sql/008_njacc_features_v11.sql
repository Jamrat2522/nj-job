-- =====================================================================
-- BILLING NJ — 008_njacc_features_v11.sql       [FRESH INSTALL: REQUIRED]
-- Feature migration ของ v1.1 (ไม่มี Auth logic ใด ๆ ในไฟล์นี้)
--   A. คอลัมน์เพิ่ม: case_no / contact / cs_name / i_billing_apl บน job
--      + charge_kind บน invoice item + service_amount/advance_amount บน invoice
--   B. สิทธิ์ can_delete (njacc_can รองรับ perm 'delete')
--   C. list/kpi/export/bulk tools/delete job (Data Isolation ที่ server)
--   D. issue_invoice แยกยอด SERVICE/ADVANCE
--
-- ► ไม่มี @billing.app / internal_username / resolve_login / seed ผู้ใช้ ในไฟล์นี้
--   งาน Auth ทั้งหมดอยู่ใน 009_njacc_auth_hardening.sql
--   งาน Upgrade ระบบเก่าอยู่ใน sql/legacy/legacy_auth_upgrade.sql (ไม่อยู่ใน Fresh chain)
-- ไม่แตะตาราง BILLING เดิม (service_charge_records / advance_charge_records / app_users)
-- =====================================================================

-- ► PREFLIGHT (ต้องได้ 19 = ติดตั้ง 001–006 แล้ว)
SELECT count(*) AS njacc_tables_expected_19 FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';

BEGIN;

-- ---------------------------------------------------------------
-- A. COLUMNS
-- ---------------------------------------------------------------
ALTER TABLE public.njacc_jobs
  ADD COLUMN IF NOT EXISTS case_no        text,
  ADD COLUMN IF NOT EXISTS contact        text,
  ADD COLUMN IF NOT EXISTS cs_name        text,
  ADD COLUMN IF NOT EXISTS i_billing_apl  text;

ALTER TABLE public.njacc_invoice_items
  ADD COLUMN IF NOT EXISTS charge_kind text NOT NULL DEFAULT 'SERVICE';

ALTER TABLE public.njacc_invoices
  ADD COLUMN IF NOT EXISTS service_amount numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_amount numeric(18,2) NOT NULL DEFAULT 0;

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='njacc_items_kind_ck') THEN
    ALTER TABLE public.njacc_invoice_items
      ADD CONSTRAINT njacc_items_kind_ck CHECK (charge_kind IN ('SERVICE','ADVANCE'));
  END IF;
END $mig$;

-- B. สิทธิ์ลบข้อมูล (ตรวจจริงฝั่ง DB — ไม่ใช่แค่ซ่อนปุ่ม)
ALTER TABLE public.njacc_user_access
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS njacc_jobs_case_idx ON public.njacc_jobs(company_group, charge_type, case_no);
CREATE INDEX IF NOT EXISTS njacc_jobs_cs_idx   ON public.njacc_jobs(company_group, charge_type, cs_name);

-- ---------------------------------------------------------------
-- C. njacc_can รองรับ perm 'delete'
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_can(p_charge text, p_group text, p_perm text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid uuid; v_role text; v_ok boolean;
BEGIN
  SELECT id, role INTO v_pid, v_role FROM public.njacc_profiles
   WHERE auth_user_id = auth.uid() AND active = true LIMIT 1;
  IF v_pid IS NULL THEN RETURN false; END IF;
  IF v_role = 'SUPER_ADMIN' THEN RETURN true; END IF;
  EXECUTE format(
    'SELECT bool_or(%I) FROM public.njacc_user_access
      WHERE profile_id=$1 AND (charge_type=$2 OR charge_type=''*'')
        AND (company_group=$3 OR company_group=''*'')',
    CASE p_perm
      WHEN 'view' THEN 'can_view' WHEN 'create' THEN 'can_create'
      WHEN 'edit' THEN 'can_edit' WHEN 'invoice' THEN 'can_invoice'
      WHEN 'receive_payment' THEN 'can_receive_payment'
      WHEN 'issue_receipt' THEN 'can_issue_receipt'
      WHEN 'export' THEN 'can_export' WHEN 'void' THEN 'can_void'
      WHEN 'delete' THEN 'can_delete'
      WHEN 'manage_users' THEN 'can_manage_users'
      ELSE 'can_view' END)
  INTO v_ok USING v_pid, coalesce(p_charge,'*'), coalesce(p_group,'*');
  RETURN coalesce(v_ok,false);
END $$;

-- my_profile: ส่ง can_delete ให้ UI ด้วย (ยังไม่ส่ง internal_username ตามเดิม)
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
      'can_void',can_void,'can_delete',can_delete,
      'can_manage_users',can_manage_users)),'[]'::jsonb)
  INTO v_acc FROM public.njacc_user_access WHERE profile_id = p.id;
  -- READ-ONLY: ไม่เขียน audit ที่นี่ (LOGIN audit เกิดครั้งเดียวตอน login สำเร็จ ผ่าน njacc_log_login_success)
  RETURN jsonb_build_object('id',p.id,'employee_code',p.employee_code,
    'full_name',p.full_name,'department',p.department,'login_name',p.login_name,
    'role',p.role,'access',v_acc);
END $$;

-- หมายเหตุ: njacc_admin_upsert_user เวอร์ชันสุดท้าย (safe — ไม่รับ internal identity จาก Browser)
-- ถูกนิยามใน 009_njacc_auth_hardening.sql พร้อมรองรับ can_delete
-- ไฟล์นี้จึงไม่นิยามซ้ำ เพื่อไม่ให้เกิด function เวอร์ชันที่รับ internal_username ใน Fresh Install

-- ---------------------------------------------------------------
-- D. JOB: บันทึกฟิลด์ใหม่
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
      customer_job_no,credit_term_days,due_date,note,case_no,contact,cs_name,i_billing_apl,
      created_by,updated_by)
    VALUES (v_no,v_charge,v_group,p->>'data_type',p->>'reference_no',
      (p->>'reference_date')::date,(p->>'company_invoice_id')::uuid,(p->>'customer_id')::uuid,
      p->>'customs_declaration_no',p->>'source_invoice_no',p->>'house_bl_no',p->>'master_bl_no',
      p->>'booking_no',p->>'vessel_name',(p->>'qty_container')::int,(p->>'etd')::date,
      (p->>'eta')::date,(p->>'delivery_date')::date,p->>'customer_job_no',
      (p->>'credit_term_days')::int,(p->>'due_date')::date,p->>'note',
      p->>'case_no',p->>'contact',p->>'cs_name',p->>'i_billing_apl',pr.id,pr.id)
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
  RETURN jsonb_build_object('id',v_id);
END $$;

-- ---------------------------------------------------------------
-- E. LIST + KPI (เพิ่มคอลัมน์ + ฟิลเตอร์ CS) — signature เปลี่ยน ต้อง DROP ก่อน
-- ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.njacc_list_charges(text,text,text,text,uuid,text,date,date,text,text,int,int);
DROP FUNCTION IF EXISTS public.njacc_charge_kpi(text,text,text,text,uuid,text,date,date);

CREATE OR REPLACE FUNCTION public.njacc_list_charges(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb;
        v_off int; v_size int; v_order text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce((p->>'size')::int,20),1),100);
  v_off  := (greatest(coalesce((p->>'page')::int,1),1)-1) * v_size;
  -- natural sort: ใช้ invoice_sort_key ที่ pad ตัวเลขไว้แล้ว (INV-2 มาก่อน INV-10)
  v_order := CASE WHEN p->>'sort'='invoice_no'
    THEN 'invoice_sort_key ' ELSE 'date ' END
    || CASE WHEN lower(coalesce(p->>'dir','desc'))='asc' THEN 'ASC NULLS LAST' ELSE 'DESC NULLS LAST' END;

  PERFORM public.njacc_build_charge_set(p);
  SELECT count(*) INTO v_total FROM _njacc_l;
  EXECUTE format('SELECT coalesce(jsonb_agg(t),''[]''::jsonb) FROM
    (SELECT * FROM _njacc_l ORDER BY %s OFFSET %s LIMIT %s) t',
    v_order, v_off, v_size) INTO v_rows;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_list_charges(jsonb) TO authenticated;

-- ตัวสร้าง result set กลาง (ใช้ร่วม list / kpi / export) — DATA ISOLATION ที่ server
-- natural sort key: แปลงตัวเลขในสตริงเป็นบล็อกความกว้างคงที่ (INV-2 < INV-10)
CREATE OR REPLACE FUNCTION public.njacc_natural_key(p text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN p IS NULL THEN NULL ELSE
    regexp_replace(upper(p), '\d+', lpad('\&', 12, '0'), 'g') END
$$;
REVOKE ALL ON FUNCTION public.njacc_natural_key(text) FROM public, anon;

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
     WHERE j.charge_type = v_charge AND j.company_group = v_group   -- ← DATA ISOLATION
  ), calc AS (
    SELECT b.*,
      /* ISSUED invoice = แหล่งข้อมูลการเงินหลัก · รองลงมาคือ snapshot ที่ import เข้ามา
         ถ้าไม่มีทั้งสอง → NULL (แยก "ไม่มีข้อมูล" ออกจาก "ยอดศูนย์") */
      (b.invoice_status = 'ISSUED') AS has_issued_invoice,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_service
           WHEN b.has_snapshot THEN b.s_service END AS service_amount,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_advance
           WHEN b.has_snapshot THEN b.s_advance END AS advance_amount,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_subtotal
           WHEN b.has_snapshot THEN b.s_amount END AS subtotal,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_vat
           WHEN b.has_snapshot THEN b.s_vat END AS vat_amount,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_wht
           WHEN b.has_snapshot THEN b.s_wht END AS wht_amount,
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_gross END AS gross_total,
      /* net_payable = gross - WHT (ความหมายเดียวกับ Total Amount ของ Billing เดิม)
         snapshot ใช้ค่า total_amount จากไฟล์ต้นทางตรง ๆ — ไม่คำนวณแทน */
      CASE WHEN b.invoice_status='ISSUED' THEN b.i_gross - coalesce(b.i_wht,0)
           WHEN b.has_snapshot THEN b.s_total END AS net_payable,
      /* effective due: ใช้ due ของ INVOICE ที่ ISSUED เท่านั้น · VOID/ไม่มี invoice → ใช้ของงาน */
      CASE WHEN b.invoice_status='ISSUED' THEN coalesce(b.invoice_due_date, b.due_date)
           ELSE b.due_date END AS effective_due_date,
      CASE WHEN b.invoice_status='ISSUED' AND coalesce(b.payment_status,'UNPAID') IN ('UNPAID','PARTIAL')
           THEN true ELSE false END AS is_receivable
      FROM base b
  )
  SELECT id, job_no, coalesce(reference_date, created_at::date) AS date,
         invoice_no, source_invoice_no,
         public.njacc_natural_key(coalesce(invoice_no, source_invoice_no)) AS invoice_sort_key,
         customer_name, customer_job_no, company_invoice,
         house_bl_no, master_bl_no, customs_declaration_no,
         service_amount, advance_amount, subtotal, vat_amount, wht_amount,
         gross_total, net_payable,
         i_billing_apl, case_no,
         coalesce(contact, company_contact) AS contact,   -- job override → master LIST NAME
         cs_name, etd, eta, effective_due_date AS due_date, due_date AS job_due_date,
         invoice_due_date, note, operational_status,
         invoice_status, payment_status, is_receivable, has_snapshot,
         invoice_id, customer_id, charge_type, company_group, credit_term_days
    FROM calc j
   WHERE (nullif(p->>'status','') IS NULL OR j.operational_status = p->>'status')
     AND (nullif(p->>'customer_id','') IS NULL OR j.customer_id = (p->>'customer_id')::uuid)
     AND (nullif(p->>'cs','') IS NULL OR j.cs_name = p->>'cs')
     AND (nullif(p->>'payment_status','') IS NULL OR j.payment_status = p->>'payment_status')
     AND (nullif(p->>'from','') IS NULL OR coalesce(j.reference_date,j.created_at::date) >= (p->>'from')::date)
     AND (nullif(p->>'to','')   IS NULL OR coalesce(j.reference_date,j.created_at::date) <= (p->>'to')::date)
     AND (v_q IS NULL OR
          j.invoice_no ILIKE '%'||v_q||'%' OR j.source_invoice_no ILIKE '%'||v_q||'%' OR
          j.customer_name ILIKE '%'||v_q||'%' OR j.customer_job_no ILIKE '%'||v_q||'%' OR
          j.house_bl_no ILIKE '%'||v_q||'%' OR j.master_bl_no ILIKE '%'||v_q||'%' OR
          j.customs_declaration_no ILIKE '%'||v_q||'%' OR j.job_no ILIKE '%'||v_q||'%' OR
          j.case_no ILIKE '%'||v_q||'%' OR j.i_billing_apl ILIKE '%'||v_q||'%' OR
          j.reference_no ILIKE '%'||v_q||'%' OR j.booking_no ILIKE '%'||v_q||'%' OR
          j.vessel_name ILIKE '%'||v_q||'%' OR
          EXISTS (SELECT 1 FROM public.njacc_job_containers jc
                   WHERE jc.job_id = j.id AND jc.container_no ILIKE '%'||v_q||'%'))
     AND (nullif(p->>'due','') IS NULL OR
          -- ใช้ effective due + สถานะการชำระ (CLOSE ไม่ได้แปลว่าชำระแล้ว)
          (p->>'due'='overdue' AND j.effective_due_date <  current_date
             AND j.operational_status <> 'CANCELED'
             AND coalesce(j.payment_status,'UNPAID') <> 'PAID') OR
          (p->>'due'='today'   AND j.effective_due_date =  current_date) OR
          (p->>'due'='1-7'     AND j.effective_due_date >  current_date AND j.effective_due_date <= current_date+7) OR
          (p->>'due'='8-30'    AND j.effective_due_date >  current_date+7 AND j.effective_due_date <= current_date+30) OR
          (p->>'due'='30+'     AND j.effective_due_date >  current_date+30));
END $$;
REVOKE ALL ON FUNCTION public.njacc_build_charge_set(jsonb) FROM public, anon;

CREATE OR REPLACE FUNCTION public.njacc_charge_kpi(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p->>'charge_type',p->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  PERFORM public.njacc_build_charge_set(p);
  SELECT jsonb_build_object(
    'total_job', count(*),
    -- ลูกหนี้เกินกำหนด: มี INVOICE ที่ยังไม่ชำระครบ + เลย effective due (ไม่ผูกกับ CLOSE)
    'total_overdue', count(*) FILTER (WHERE is_receivable AND due_date < current_date),
    -- งานที่เลย due แต่ยังไม่ออก INVOICE (แยก logic ไม่ปนกับลูกหนี้)
    'job_overdue_no_invoice', count(*) FILTER (
        WHERE invoice_status IS DISTINCT FROM 'ISSUED'
          AND operational_status <> 'CANCELED' AND due_date < current_date),
    'service_charge', coalesce(sum(service_amount),0),
    'advance_charge', coalesce(sum(advance_amount),0),
    'vat', coalesce(sum(vat_amount),0),
    'total_amount', coalesce(sum(net_payable),0),      -- Net after WHT (ความหมายเดียวกับ Billing เดิม)
    'gross_total', coalesce(sum(gross_total),0),       -- Gross ของระบบบัญชีใหม่
    'wht_total', coalesce(sum(wht_amount),0),
    'open_jobs', count(*) FILTER (WHERE operational_status='OPEN'),
    'close_jobs', count(*) FILTER (WHERE operational_status='CLOSE'))
  INTO v FROM _njacc_l;
  RETURN v;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_charge_kpi(jsonb) TO authenticated;

-- Filter options: distinct จากทั้ง scope (ไม่ derive จากหน้าปัจจุบัน)
-- รวม customer ที่ถูก disable แล้วแต่ยังมีงานเก่าอยู่ (historical) ด้วย
CREATE OR REPLACE FUNCTION public.njacc_charge_filter_options(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;
  RETURN jsonb_build_object(
    'customers', (SELECT coalesce(jsonb_agg(t ORDER BY t.name),'[]'::jsonb) FROM (
        SELECT DISTINCT c.id, c.customer_name AS name, c.active
          FROM public.njacc_jobs j JOIN public.njacc_customers c ON c.id = j.customer_id
         WHERE j.charge_type=v_charge AND j.company_group=v_group) t),
    'cs_names', (SELECT coalesce(jsonb_agg(DISTINCT j.cs_name ORDER BY j.cs_name),'[]'::jsonb)
        FROM public.njacc_jobs j
       WHERE j.charge_type=v_charge AND j.company_group=v_group AND coalesce(j.cs_name,'') <> ''));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_charge_filter_options(jsonb) TO authenticated;

-- PAGE BUNDLE: rows + total + kpi (+ filter_options เมื่อขอ) ใน request เดียว
-- สร้าง working set ครั้งเดียวต่อการโหลดหน้า แทนที่จะเรียก build_charge_set ซ้ำจาก list และ kpi
CREATE OR REPLACE FUNCTION public.njacc_charge_page_bundle(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_kpi jsonb; v_opts jsonb := NULL;
        v_off int; v_size int; v_order text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce((p->>'size')::int,20),1),100);
  v_off  := (greatest(coalesce((p->>'page')::int,1),1)-1) * v_size;
  v_order := CASE WHEN p->>'sort'='invoice_no' THEN 'invoice_sort_key ' ELSE 'date ' END
    || CASE WHEN lower(coalesce(p->>'dir','desc'))='asc' THEN 'ASC NULLS LAST' ELSE 'DESC NULLS LAST' END;

  PERFORM public.njacc_build_charge_set(p);
  SELECT count(*) INTO v_total FROM _njacc_l;
  EXECUTE format('SELECT coalesce(jsonb_agg(t),''[]''::jsonb) FROM
    (SELECT * FROM _njacc_l ORDER BY %s OFFSET %s LIMIT %s) t', v_order, v_off, v_size) INTO v_rows;

  SELECT jsonb_build_object(
    'total_job', count(*),
    'total_overdue', count(*) FILTER (WHERE is_receivable AND due_date < current_date),
    'job_overdue_no_invoice', count(*) FILTER (
        WHERE invoice_status IS DISTINCT FROM 'ISSUED'
          AND operational_status <> 'CANCELED' AND due_date < current_date),
    'service_charge', coalesce(sum(service_amount),0),
    'advance_charge', coalesce(sum(advance_amount),0),
    'vat', coalesce(sum(vat_amount),0),
    'total_amount', coalesce(sum(net_payable),0),
    'gross_total', coalesce(sum(gross_total),0),
    'wht_total', coalesce(sum(wht_amount),0),
    'open_jobs', count(*) FILTER (WHERE operational_status='OPEN'),
    'close_jobs', count(*) FILTER (WHERE operational_status='CLOSE'))
  INTO v_kpi FROM _njacc_l;

  IF coalesce((p->>'with_options')::boolean,false) THEN
    v_opts := public.njacc_charge_filter_options(p);
  END IF;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows,'kpi',v_kpi,'filter_options',v_opts);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_charge_page_bundle(jsonb) TO authenticated;

-- Export: คืนทุกแถวตามฟิลเตอร์ (cap 5000) — ต้องมีสิทธิ์ export
CREATE OR REPLACE FUNCTION public.njacc_export_charges(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_rows jsonb; v_cap int := 5000;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p->>'charge_type',p->>'company_group','export') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  PERFORM public.njacc_build_charge_set(p);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT * FROM _njacc_l ORDER BY date DESC, coalesce(invoice_no,source_invoice_no) DESC
    LIMIT v_cap) t;
  PERFORM public.njacc_audit(pr.id,'EXPORT_CHARGES','job',NULL,
    jsonb_build_object('charge_type',p->>'charge_type','company_group',p->>'company_group'));
  RETURN jsonb_build_object('rows',v_rows,'cap',v_cap);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_export_charges(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- F. BULK TOOLS (เขียนใหม่บน njacc_* ทั้งหมด — ไม่แตะตาราง BILLING เดิม)
--    p_keys = เลขอ้างอิงที่ผู้ใช้วาง/อัปโหลด: job_no | invoice_no | source_invoice_no
-- ---------------------------------------------------------------
-- helper: จับคู่ key (job_no / source_invoice_no / accounting invoice_no / customer_job_no)
-- ภายใน scope charge_type + company_group เท่านั้น · คืน job_id เมื่อ match ได้ "หนึ่งเดียว"
CREATE OR REPLACE FUNCTION public.njacc_match_job(p_charge text, p_group text, p_key text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_key text := upper(trim(coalesce(p_key,''))); v_n int; v_id uuid;
BEGIN
  IF v_key = '' THEN RETURN jsonb_build_object('status','NOT_FOUND'); END IF;
  SELECT count(*), min(j.id) INTO v_n, v_id
    FROM public.njacc_jobs j
    LEFT JOIN public.njacc_invoices i ON i.id = j.invoice_id
   WHERE j.charge_type = p_charge AND j.company_group = p_group
     AND (upper(trim(j.job_no)) = v_key
       OR upper(trim(coalesce(j.source_invoice_no,''))) = v_key
       OR upper(trim(coalesce(i.invoice_no,''))) = v_key
       OR upper(trim(coalesce(j.customer_job_no,''))) = v_key);
  IF v_n = 0 THEN RETURN jsonb_build_object('status','NOT_FOUND'); END IF;
  IF v_n > 1 THEN RETURN jsonb_build_object('status','AMBIGUOUS','count',v_n); END IF;
  RETURN jsonb_build_object('status','OK','job_id',v_id);
END $$;
REVOKE ALL ON FUNCTION public.njacc_match_job(text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_match_job(text,text,text) TO authenticated;

-- BULK SET FIELD: คืนผลรายบรรทัด (matched / not_found / ambiguous / skipped)
CREATE OR REPLACE FUNCTION public.njacc_bulk_set_field(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_field text := p->>'field';
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        k text; m jsonb; v_matched int := 0; v_skip int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb; v_req int := 0;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_field NOT IN ('case_no','contact','cs_name','i_billing_apl','etd','eta','due_date') THEN
    RAISE EXCEPTION 'NJACC_BAD_FIELD';
  END IF;
  FOR k IN SELECT jsonb_array_elements_text(p->'keys') LOOP
    v_req := v_req + 1;
    m := public.njacc_match_job(v_charge, v_group, k);
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(k); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(k); CONTINUE; END IF;
    EXECUTE format('UPDATE public.njacc_jobs SET %I = %s, updated_by=$2 WHERE id = $1 AND operational_status <> ''CANCELED''',
      v_field, CASE WHEN v_field IN ('etd','eta','due_date') THEN '$3::date' ELSE '$3' END)
      USING (m->>'job_id')::uuid, pr.id, nullif(p->>'value','');
    IF FOUND THEN v_matched := v_matched + 1; ELSE v_skip := v_skip + 1; END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'BULK_SET_FIELD','job',NULL,
    jsonb_build_object('field',v_field,'value',p->>'value','matched',v_matched,
      'requested',v_req,'charge_type',v_charge,'company_group',v_group));
  RETURN jsonb_build_object('requested',v_req,'matched',v_matched,'skipped',v_skip,
    'not_found',v_nf,'ambiguous',v_amb);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_bulk_set_field(jsonb) TO authenticated;

-- BULK SET STATUS (ตัดจบงาน / คืนงาน) — คืนผลรายบรรทัดเช่นกัน
CREATE OR REPLACE FUNCTION public.njacc_bulk_set_status(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_status text := p->>'status';
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        k text; m jsonb; j public.njacc_jobs; v_req int := 0; v_matched int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb;
        v_same jsonb := '[]'::jsonb; v_cancel jsonb := '[]'::jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF v_status NOT IN ('OPEN','PROCESSING','CLOSE') THEN RAISE EXCEPTION 'NJACC_BAD_STATUS'; END IF;
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR k IN SELECT jsonb_array_elements_text(p->'keys') LOOP
    v_req := v_req + 1;
    m := public.njacc_match_job(v_charge, v_group, k);
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(k); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(k); CONTINUE; END IF;
    SELECT * INTO j FROM public.njacc_jobs WHERE id = (m->>'job_id')::uuid FOR UPDATE;
    IF j.operational_status = 'CANCELED' THEN v_cancel := v_cancel || to_jsonb(k); CONTINUE; END IF;
    IF j.operational_status = v_status THEN v_same := v_same || to_jsonb(k); CONTINUE; END IF;
    UPDATE public.njacc_jobs SET operational_status = v_status, updated_by = pr.id WHERE id = j.id;
    v_matched := v_matched + 1;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'BULK_SET_STATUS','job',NULL,
    jsonb_build_object('status',v_status,'matched',v_matched,'requested',v_req,
      'charge_type',v_charge,'company_group',v_group));
  RETURN jsonb_build_object('requested',v_req,'matched',v_matched,'not_found',v_nf,
    'ambiguous',v_amb,'skipped_same_status',v_same,'skipped_canceled',v_cancel);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_bulk_set_status(jsonb) TO authenticated;

-- QUICK CLOSE lookup (ADVANCE): ค้น key เดียวแบบ exact-normalized ก่อนยืนยันจบงาน
CREATE OR REPLACE FUNCTION public.njacc_quick_close_lookup(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_key text := upper(trim(coalesce(p->>'key','')));
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_key = '' THEN RETURN jsonb_build_object('matches','[]'::jsonb); END IF;
  RETURN jsonb_build_object('matches', (
    SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (
      SELECT j.id, j.job_no, j.source_invoice_no, i.invoice_no, j.customer_job_no,
             c.customer_name, j.operational_status, coalesce(i.due_date, j.due_date) AS due_date
        FROM public.njacc_jobs j
        LEFT JOIN public.njacc_invoices i ON i.id = j.invoice_id
        LEFT JOIN public.njacc_customers c ON c.id = j.customer_id
       WHERE j.charge_type = v_charge AND j.company_group = v_group
         AND (upper(trim(j.job_no)) = v_key
           OR upper(trim(coalesce(j.source_invoice_no,''))) = v_key
           OR upper(trim(coalesce(i.invoice_no,''))) = v_key
           OR upper(trim(coalesce(j.customer_job_no,''))) = v_key)
       LIMIT 20) t));
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_quick_close_lookup(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- IMPORT ENGINE (รูปแบบ BILLING เดิม) — ทำงานฝั่ง DB เป็น batch
-- ► scope บังคับจาก charge_type + company_group ของหน้าที่กด Upload เท่านั้น
--   ห้ามเชื่อค่ากลุ่มจากไฟล์
-- ► Invoice No. ของไฟล์เดิม = source_invoice_no (ไม่ใช่ accounting invoice_no)
-- ► ยอดเงินเก็บลง njacc_job_financial_snapshot (ไม่สร้าง INVOICE ปลอม)
-- ► field ที่ไฟล์ไม่มี header → ห้าม update (ส่งมาเฉพาะ key ที่มีใน header)
-- ---------------------------------------------------------------

-- ตรวจ master ก่อน import (Preview) — exact normalized เท่านั้น ห้าม fuzzy
CREATE OR REPLACE FUNCTION public.njacc_import_resolve_masters(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_cust jsonb := '[]'::jsonb; v_comp jsonb := '[]'::jsonb;
        nm text; v_n int; v_id uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p->>'charge_type',p->>'company_group','create') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'customers') LOOP
    SELECT count(*), min(id) INTO v_n, v_id FROM public.njacc_customers
     WHERE upper(regexp_replace(trim(customer_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'));
    v_cust := v_cust || jsonb_build_object('name',nm,
      'status', CASE WHEN v_n=0 THEN 'NOT_FOUND' WHEN v_n=1 THEN 'OK' ELSE 'AMBIGUOUS' END,
      'id', CASE WHEN v_n=1 THEN v_id::text END);
  END LOOP;
  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'companies') LOOP
    SELECT count(*), min(id) INTO v_n, v_id FROM public.njacc_company_invoices
     WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'))
        OR upper(trim(coalesce(company_code,''))) = upper(trim(nm));
    v_comp := v_comp || jsonb_build_object('name',nm,
      'status', CASE WHEN v_n=0 THEN 'NOT_FOUND' WHEN v_n=1 THEN 'OK' ELSE 'AMBIGUOUS' END,
      'id', CASE WHEN v_n=1 THEN v_id::text END);
  END LOOP;
  RETURN jsonb_build_object('customers',v_cust,'companies',v_comp);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_import_resolve_masters(jsonb) TO authenticated;

-- สร้าง master ที่ยังไม่มี (ADMIN+ เท่านั้น) — ใช้ตอนผู้ใช้ยืนยันใน Preview
CREATE OR REPLACE FUNCTION public.njacc_import_create_masters(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; nm text; v_c int := 0; v_k int := 0;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'customers') LOOP
    IF trim(coalesce(nm,'')) = '' THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.njacc_customers
        WHERE upper(regexp_replace(trim(customer_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'))) THEN
      INSERT INTO public.njacc_customers(customer_name) VALUES (trim(nm));
      v_c := v_c + 1;
    END IF;
  END LOOP;
  FOR nm IN SELECT DISTINCT jsonb_array_elements_text(p->'companies') LOOP
    IF trim(coalesce(nm,'')) = '' THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.njacc_company_invoices
        WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g')) = upper(regexp_replace(trim(nm),'\s+',' ','g'))) THEN
      INSERT INTO public.njacc_company_invoices(company_name) VALUES (trim(nm));
      v_k := v_k + 1;
    END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'IMPORT_CREATE_MASTERS','master',NULL,
    jsonb_build_object('customers_created',v_c,'companies_created',v_k));
  RETURN jsonb_build_object('customers_created',v_c,'companies_created',v_k);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_import_create_masters(jsonb) TO authenticated;

-- IMPORT BATCH: รับ chunk 100–200 แถว · insert/update + snapshot + audit ในทรานแซกชันเดียว
-- rows[i] = { key, fields:{...}, money:{service_charge,advance,vat,amount,wht,total_amount} }
--   key = Invoice No. ของไฟล์เดิม (map เป็น source_invoice_no)
--   fields = เฉพาะคอลัมน์ที่มีอยู่จริงใน header ของไฟล์
CREATE OR REPLACE FUNCTION public.njacc_import_jobs_batch(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        r jsonb; f jsonb; mny jsonb; v_key text; v_n int; v_id uuid; v_no text;
        v_ins int := 0; v_upd int := 0; v_skip int := 0;
        v_amb jsonb := '[]'::jsonb; v_unres jsonb := '[]'::jsonb; v_fail jsonb := '[]'::jsonb;
        v_cust uuid; v_comp uuid; v_has_money boolean;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;

  FOR r IN SELECT jsonb_array_elements(p->'rows') LOOP
    f := coalesce(r->'fields','{}'::jsonb);
    mny := r->'money';
    v_key := upper(trim(coalesce(r->>'key','')));
    v_cust := NULL; v_comp := NULL;

    -- resolve master แบบ exact normalized (ไม่มี fuzzy)
    IF f ? 'customer_name' AND coalesce(f->>'customer_name','') <> '' THEN
      SELECT count(*), min(id) INTO v_n, v_cust FROM public.njacc_customers
       WHERE upper(regexp_replace(trim(customer_name),'\s+',' ','g'))
           = upper(regexp_replace(trim(f->>'customer_name'),'\s+',' ','g'));
      IF v_n <> 1 THEN
        v_unres := v_unres || jsonb_build_object('key',r->>'key','customer',f->>'customer_name',
          'reason', CASE WHEN v_n=0 THEN 'CUSTOMER_NOT_FOUND' ELSE 'CUSTOMER_AMBIGUOUS' END);
        CONTINUE;
      END IF;
    END IF;
    IF f ? 'company_invoice' AND coalesce(f->>'company_invoice','') <> '' THEN
      SELECT count(*), min(id) INTO v_n, v_comp FROM public.njacc_company_invoices
       WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g'))
           = upper(regexp_replace(trim(f->>'company_invoice'),'\s+',' ','g'))
          OR upper(trim(coalesce(company_code,''))) = upper(trim(f->>'company_invoice'));
      IF v_n <> 1 THEN
        v_unres := v_unres || jsonb_build_object('key',r->>'key','company',f->>'company_invoice',
          'reason', CASE WHEN v_n=0 THEN 'COMPANY_NOT_FOUND' ELSE 'COMPANY_AMBIGUOUS' END);
        CONTINUE;
      END IF;
    END IF;

    -- match งานเดิมใน scope นี้เท่านั้น (source_invoice_no) — ซ้ำ >1 = AMBIGUOUS ไม่แตะข้อมูล
    v_id := NULL;
    IF v_key <> '' THEN
      SELECT count(*), min(id) INTO v_n, v_id FROM public.njacc_jobs
       WHERE charge_type = v_charge AND company_group = v_group
         AND upper(trim(coalesce(source_invoice_no,''))) = v_key;
      IF v_n > 1 THEN
        v_amb := v_amb || jsonb_build_object('key',r->>'key','count',v_n);
        CONTINUE;
      END IF;
      IF v_n = 0 THEN v_id := NULL; END IF;
    END IF;

    BEGIN
      IF v_id IS NULL THEN
        v_no := public.njacc_next_doc_no('JOB', v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
                'J'||left(v_charge,1)||left(v_group,2)||to_char(now(),'YY')||'-');
        INSERT INTO public.njacc_jobs(job_no,charge_type,company_group,source_invoice_no,
          data_type,reference_date,customer_id,company_invoice_id,customer_job_no,
          customs_declaration_no,house_bl_no,master_bl_no,etd,eta,due_date,credit_term_days,
          cs_name,i_billing_apl,case_no,contact,note,operational_status,created_by,updated_by)
        VALUES (v_no,v_charge,v_group,nullif(trim(coalesce(r->>'key','')),''),
          f->>'data_type',(nullif(f->>'reference_date',''))::date,v_cust,v_comp,f->>'customer_job_no',
          f->>'customs_declaration_no',f->>'house_bl_no',f->>'master_bl_no',
          (nullif(f->>'etd',''))::date,(nullif(f->>'eta',''))::date,(nullif(f->>'due_date',''))::date,
          (nullif(f->>'credit_term_days',''))::int,f->>'cs_name',f->>'i_billing_apl',
          f->>'case_no',f->>'contact',f->>'note',
          coalesce(nullif(f->>'operational_status',''),'OPEN'),pr.id,pr.id)
        RETURNING id INTO v_id;
        v_ins := v_ins + 1;
      ELSE
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
      END IF;

      -- FINANCIAL SNAPSHOT (ไม่ใช่ INVOICE) — เก็บค่าตามไฟล์ต้นทางตรง ๆ ไม่คำนวณแทน
      v_has_money := mny IS NOT NULL AND jsonb_typeof(mny)='object';
      IF v_has_money THEN
        INSERT INTO public.njacc_job_financial_snapshot(job_id,source_type,service_charge,advance,
          vat,amount,wht,total_amount,imported_by)
        VALUES (v_id,'IMPORT_OLD_BILLING',
          (nullif(mny->>'service_charge',''))::numeric,(nullif(mny->>'advance',''))::numeric,
          (nullif(mny->>'vat',''))::numeric,(nullif(mny->>'amount',''))::numeric,
          (nullif(mny->>'wht',''))::numeric,(nullif(mny->>'total_amount',''))::numeric,pr.id)
        ON CONFLICT (job_id) DO UPDATE SET
          service_charge=EXCLUDED.service_charge, advance=EXCLUDED.advance, vat=EXCLUDED.vat,
          amount=EXCLUDED.amount, wht=EXCLUDED.wht, total_amount=EXCLUDED.total_amount,
          imported_at=now(), imported_by=EXCLUDED.imported_by;
      END IF;
    EXCEPTION WHEN others THEN
      v_fail := v_fail || jsonb_build_object('key',r->>'key','reason',left(SQLERRM,150));
    END;
  END LOOP;

  PERFORM public.njacc_audit(pr.id,'IMPORT_JOBS','job',NULL,
    jsonb_build_object('charge_type',v_charge,'company_group',v_group,
      'inserted',v_ins,'updated',v_upd,'skipped',v_skip));
  RETURN jsonb_build_object('inserted',v_ins,'updated',v_upd,'skipped',v_skip,
    'ambiguous',v_amb,'unresolved_master',v_unres,'failed',v_fail);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_import_jobs_batch(jsonb) TO authenticated;

-- APL BILLING UPLOAD (batch): อัปเดตเฉพาะ i_billing_apl · pairs = [{key,value}]
CREATE OR REPLACE FUNCTION public.njacc_upload_apl_batch(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        r jsonb; m jsonb; v_req int := 0; v_ok int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR r IN SELECT jsonb_array_elements(p->'pairs') LOOP
    v_req := v_req + 1;
    m := public.njacc_match_job(v_charge, v_group, r->>'key');
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(r->>'key'); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(r->>'key'); CONTINUE; END IF;
    UPDATE public.njacc_jobs SET i_billing_apl = nullif(trim(coalesce(r->>'value','')),''), updated_by = pr.id
     WHERE id = (m->>'job_id')::uuid AND operational_status <> 'CANCELED';
    IF FOUND THEN v_ok := v_ok + 1; END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'UPLOAD_APL','job',NULL,
    jsonb_build_object('matched',v_ok,'requested',v_req,'charge_type',v_charge,'company_group',v_group));
  RETURN jsonb_build_object('requested',v_req,'matched',v_ok,'not_found',v_nf,'ambiguous',v_amb);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upload_apl_batch(jsonb) TO authenticated;

-- UPLOAD 1.9 (batch): อัปเดตเฉพาะ ETA / ETD · ค่าว่างห้ามทับของเดิม
-- rows = [{key, eta, etd}]
CREATE OR REPLACE FUNCTION public.njacc_upload_19_batch(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        r jsonb; m jsonb; v_req int := 0; v_ok int := 0;
        v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb; v_bad jsonb := '[]'::jsonb;
        v_eta date; v_etd date;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR r IN SELECT jsonb_array_elements(p->'rows') LOOP
    v_req := v_req + 1;
    BEGIN
      v_eta := (nullif(trim(coalesce(r->>'eta','')),''))::date;
      v_etd := (nullif(trim(coalesce(r->>'etd','')),''))::date;
    EXCEPTION WHEN others THEN
      v_bad := v_bad || to_jsonb(r->>'key'); CONTINUE;
    END;
    m := public.njacc_match_job(v_charge, v_group, r->>'key');
    IF m->>'status' = 'NOT_FOUND' THEN v_nf := v_nf || to_jsonb(r->>'key'); CONTINUE; END IF;
    IF m->>'status' = 'AMBIGUOUS' THEN v_amb := v_amb || to_jsonb(r->>'key'); CONTINUE; END IF;
    UPDATE public.njacc_jobs
       SET eta = coalesce(v_eta, eta),      -- ค่าว่าง → คงของเดิม
           etd = coalesce(v_etd, etd),
           updated_by = pr.id
     WHERE id = (m->>'job_id')::uuid AND operational_status <> 'CANCELED';
    IF FOUND THEN v_ok := v_ok + 1; END IF;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'UPLOAD_19','job',NULL,
    jsonb_build_object('matched',v_ok,'requested',v_req,'charge_type',v_charge,'company_group',v_group));
  RETURN jsonb_build_object('requested',v_req,'matched',v_ok,'not_found',v_nf,
    'ambiguous',v_amb,'invalid_date',v_bad);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upload_19_batch(jsonb) TO authenticated;

-- CONTACT LIST UPLOAD (LIST NAME.xlsx): Company Invoice → Contact (master)
-- pairs = [{company, contact}]
CREATE OR REPLACE FUNCTION public.njacc_upload_contact_list(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; r jsonb; v_n int; v_id uuid;
        v_req int := 0; v_ok int := 0; v_nf jsonb := '[]'::jsonb; v_amb jsonb := '[]'::jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') AND NOT public.njacc_can('*','*','edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  FOR r IN SELECT jsonb_array_elements(p->'pairs') LOOP
    v_req := v_req + 1;
    SELECT count(*), min(id) INTO v_n, v_id FROM public.njacc_company_invoices
     WHERE upper(regexp_replace(trim(company_name),'\s+',' ','g'))
         = upper(regexp_replace(trim(coalesce(r->>'company','')),'\s+',' ','g'))
        OR upper(trim(coalesce(company_code,''))) = upper(trim(coalesce(r->>'company','')));
    IF v_n = 0 THEN v_nf := v_nf || to_jsonb(r->>'company'); CONTINUE; END IF;
    IF v_n > 1 THEN v_amb := v_amb || to_jsonb(r->>'company'); CONTINUE; END IF;
    UPDATE public.njacc_company_invoices
       SET contact_name = nullif(trim(coalesce(r->>'contact','')),'')
     WHERE id = v_id;
    v_ok := v_ok + 1;
  END LOOP;
  PERFORM public.njacc_audit(pr.id,'UPLOAD_CONTACT_LIST','company',NULL,
    jsonb_build_object('matched',v_ok,'requested',v_req));
  RETURN jsonb_build_object('requested',v_req,'matched',v_ok,'not_found',v_nf,'ambiguous',v_amb);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_upload_contact_list(jsonb) TO authenticated;

-- Contact List (อ่าน): Company Invoice → Contact ตาม LIST NAME master
-- แสดง contact ที่ระบบใช้จริง = coalesce(job.contact, company.contact_name)
CREATE OR REPLACE FUNCTION public.njacc_contact_list(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(p->>'charge_type',p->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(t ORDER BY t.company_invoice),'[]'::jsonb) FROM (
    SELECT DISTINCT ci.company_name AS company_invoice,
           ci.company_code, ci.contact_name AS master_contact,
           count(*) OVER (PARTITION BY ci.id) AS job_count
      FROM public.njacc_jobs j
      JOIN public.njacc_company_invoices ci ON ci.id = j.company_invoice_id
     WHERE j.charge_type = p->>'charge_type' AND j.company_group = p->>'company_group') t);
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_contact_list(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- G. DELETE (ตรวจสิทธิ์จริงใน DB) — ห้ามลบเมื่อมีเอกสารการเงินแล้ว
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_delete_job(p_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; j public.njacc_jobs;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO j FROM public.njacc_jobs WHERE id=p_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type,j.company_group,'delete') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF coalesce(p_reason,'')='' THEN RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;
  -- เอกสารการเงินที่ออกแล้วห้าม hard delete
  IF j.invoice_id IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.njacc_invoices WHERE job_id=j.id) THEN
    RAISE EXCEPTION 'NJACC_JOB_HAS_INVOICE';
  END IF;
  PERFORM public.njacc_audit(pr.id,'DELETE_JOB','job',p_id::text,
    jsonb_build_object('job_no',j.job_no,'reason',p_reason,'snapshot',to_jsonb(j)));
  DELETE FROM public.njacc_job_containers WHERE job_id=p_id;
  DELETE FROM public.njacc_jobs WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.njacc_delete_job(uuid,text) TO authenticated;

-- ---------------------------------------------------------------
-- H. ISSUE INVOICE: แยกยอด SERVICE / ADVANCE ต่อรายการ
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_issue_invoice(p_job uuid, p_items jsonb,
  p_request_id text, p_invoice_date date DEFAULT NULL, p_due_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; j public.njacc_jobs; v_prev uuid;
        v_no text; v_id uuid; v_rate numeric; it jsonb; v_line int := 0;
        v_amt numeric; v_vat_ap boolean; v_wht_ap boolean; v_wht_rate numeric; v_kind text;
        v_sub numeric := 0; v_vbase numeric := 0; v_vat numeric := 0; v_wht numeric := 0;
        v_svc numeric := 0; v_adv numeric := 0; v_lvat numeric; v_lwht numeric;
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
    v_kind := CASE WHEN upper(coalesce(it->>'charge_kind','')) = 'ADVANCE'
                   THEN 'ADVANCE' ELSE 'SERVICE' END;
    v_vat_ap := coalesce((it->>'vat_applicable')::boolean,true);
    v_wht_ap := coalesce((it->>'wht_applicable')::boolean,false);
    v_wht_rate := CASE WHEN v_wht_ap THEN coalesce((it->>'wht_rate')::numeric,3) ELSE 0 END;
    v_lvat := CASE WHEN v_vat_ap THEN round(v_amt*v_rate/100,2) ELSE 0 END;
    v_lwht := CASE WHEN v_wht_ap THEN round(v_amt*v_wht_rate/100,2) ELSE 0 END;
    INSERT INTO public.njacc_invoice_items(invoice_id,line_no,code,description,amount,cost,charge,
      vat_rate,vat_amount,wht_rate,wht_amount,line_total,charge_kind)
    VALUES (v_id,v_line,it->>'code',coalesce(it->>'description','-'),v_amt,
      round(coalesce((it->>'cost')::numeric,0),2),round(coalesce((it->>'charge')::numeric,0),2),
      CASE WHEN v_vat_ap THEN v_rate ELSE 0 END,v_lvat,v_wht_rate,v_lwht,v_amt+v_lvat,v_kind);
    v_sub := v_sub + v_amt;
    IF v_kind='ADVANCE' THEN v_adv := v_adv + v_amt; ELSE v_svc := v_svc + v_amt; END IF;
    IF v_vat_ap THEN v_vbase := v_vbase + v_amt; END IF;
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
END $$;

COMMIT;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- 1) คอลัมน์ใหม่ครบ
SELECT column_name FROM information_schema.columns
 WHERE table_name='njacc_jobs' AND column_name IN ('case_no','contact','cs_name','i_billing_apl')
 ORDER BY column_name;                       -- Expected 4 rows
SELECT column_name FROM information_schema.columns
 WHERE table_name='njacc_invoices' AND column_name IN ('service_amount','advance_amount');
SELECT column_name FROM information_schema.columns
 WHERE table_name='njacc_user_access' AND column_name='can_delete';

-- 2) ไฟล์นี้ต้องไม่แตะข้อมูลผู้ใช้เลย (ตรวจว่ายังเป็น 2 SUPER ADMIN จาก 006 ตามเดิม)
SELECT employee_code, full_name, department, login_name, role, active
  FROM public.njacc_profiles ORDER BY employee_code;

-- 3) RPC ใหม่ครบ
SELECT routine_name FROM information_schema.routines
 WHERE routine_schema='public' AND routine_name IN
  ('njacc_build_charge_set','njacc_export_charges','njacc_bulk_set_field',
   'njacc_bulk_set_status','njacc_contact_list','njacc_delete_job')
 ORDER BY routine_name;                      -- Expected 6 rows

-- 4) ไม่แตะตาราง BILLING เดิม (ต้องยังอยู่ครบ ไม่ถูกแก้)
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public'
   AND table_name IN ('service_charge_records','advance_charge_records','app_users');

-- =====================================================================
-- ROLLBACK (ถ้าต้องย้อน)
-- =====================================================================
-- ALTER TABLE public.njacc_jobs DROP COLUMN IF EXISTS case_no, DROP COLUMN IF EXISTS contact,
--   DROP COLUMN IF EXISTS cs_name, DROP COLUMN IF EXISTS i_billing_apl;
-- ALTER TABLE public.njacc_invoices DROP COLUMN IF EXISTS service_amount, DROP COLUMN IF EXISTS advance_amount;
-- ALTER TABLE public.njacc_invoice_items DROP COLUMN IF EXISTS charge_kind;
-- ALTER TABLE public.njacc_user_access DROP COLUMN IF EXISTS can_delete;
-- DROP FUNCTION IF EXISTS public.njacc_export_charges(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_bulk_set_field(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_bulk_set_status(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_contact_list(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_delete_job(uuid,text);
-- DROP FUNCTION IF EXISTS public.njacc_list_charges(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_charge_kpi(jsonb);
-- DROP FUNCTION IF EXISTS public.njacc_build_charge_set(jsonb);
-- (แล้วรัน 005 ใหม่เพื่อคืน list/kpi เวอร์ชันเดิม)
