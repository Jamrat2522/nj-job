-- =====================================================================
-- BILLING NJ — 004_njacc_rls.sql  (รันหลัง 003)
-- หลักการ: RLS เปิดทุกตาราง · deny-by-default
--  · เขียนทุกอย่างผ่าน SECURITY DEFINER RPC (005) เท่านั้น — ไม่มี write policy
--  · SELECT: masters/settings อ่านได้เมื่อมี active profile
--            transaction tables อ่านผ่าน permission check
--  · ไม่มี USING(true) ให้ anon/authenticated เขียนเด็ดขาด
-- =====================================================================
BEGIN;

-- helper: profile ปัจจุบันจาก auth.uid()
CREATE OR REPLACE FUNCTION public.njacc_current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.njacc_profiles
   WHERE auth_user_id = auth.uid() AND active = true LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.njacc_current_profile_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_current_profile_id() TO authenticated;

-- helper: มีสิทธิ์ perm ใน charge_type×group หรือไม่ (SUPER_ADMIN = ทุกอย่าง)
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
      WHEN 'manage_users' THEN 'can_manage_users'
      ELSE 'can_view' END)
  INTO v_ok USING v_pid, coalesce(p_charge,'*'), coalesce(p_group,'*');
  RETURN coalesce(v_ok,false);
END $$;
REVOKE ALL ON FUNCTION public.njacc_can(text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_can(text,text,text) TO authenticated;

-- เปิด RLS ทุกตาราง
ALTER TABLE public.njacc_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_user_access           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_company_invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_service_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_jobs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_job_containers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_invoice_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_payment_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_receipts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_receipt_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_withholding_docs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_document_sequences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_idempotency_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_job_financial_snapshot ENABLE ROW LEVEL SECURITY;

-- ถอน default privileges ของ PostgREST roles — ระบุชื่อ 19 ตาราง njacc_ เท่านั้น
-- (ห้ามแตะสิทธิ์ของตารางอื่นใน public schema เช่น service_charge_records / advance_charge_records / app_users)
REVOKE ALL ON public.njacc_profiles, public.njacc_user_access, public.njacc_customers,
  public.njacc_company_invoices, public.njacc_service_codes, public.njacc_jobs,
  public.njacc_job_containers, public.njacc_invoices, public.njacc_invoice_items,
  public.njacc_payments, public.njacc_payment_allocations, public.njacc_receipts,
  public.njacc_receipt_allocations, public.njacc_withholding_docs,
  public.njacc_document_sequences, public.njacc_audit_logs, public.njacc_settings,
  public.njacc_idempotency_requests, public.njacc_job_financial_snapshot
FROM anon;

-- njacc_profiles: ไม่ GRANT SELECT ให้ authenticated เด็ดขาด
-- (ตารางนี้มี auth_identity / internal_username → เบราว์เซอร์ต้องอ่านผ่าน njacc_my_profile() เท่านั้น)
REVOKE ALL ON public.njacc_profiles, public.njacc_user_access FROM authenticated;
GRANT SELECT ON public.njacc_customers,
  public.njacc_company_invoices, public.njacc_service_codes,
  public.njacc_settings TO authenticated;
-- transaction tables: ไม่ grant ตรง — อ่านผ่าน RPC เท่านั้น
-- ► ห้ามใช้ "ON ALL TABLES IN SCHEMA public" เด็ดขาด
--   public schema ของโปรเจกต์นี้ใช้ร่วมกับระบบอื่น (รวม BILLING เดิม) การ REVOKE แบบ global
--   จะไปเปลี่ยนสิทธิ์ของตารางที่ไม่ใช่ของ BILLING NJ
--   REVOKE ALL ... FROM anon ด้านบนครอบ 19 ตาราง njacc_ แบบระบุชื่อชัดเจนอยู่แล้ว
REVOKE INSERT, UPDATE, DELETE ON
  public.njacc_profiles, public.njacc_user_access, public.njacc_customers,
  public.njacc_company_invoices, public.njacc_service_codes, public.njacc_jobs,
  public.njacc_job_containers, public.njacc_invoices, public.njacc_invoice_items,
  public.njacc_payments, public.njacc_payment_allocations, public.njacc_receipts,
  public.njacc_receipt_allocations, public.njacc_withholding_docs,
  public.njacc_document_sequences, public.njacc_audit_logs, public.njacc_settings,
  public.njacc_idempotency_requests, public.njacc_job_financial_snapshot
FROM anon, authenticated;

-- ---------- SELECT policies ----------
-- njacc_profiles / njacc_user_access: ไม่มี policy สำหรับ authenticated เลย
-- → supabase.from('njacc_profiles').select() จากเบราว์เซอร์อ่านไม่ได้ (ทั้ง grant และ policy ปิด)
--   เข้าถึงได้เฉพาะผ่าน RPC njacc_my_profile() / njacc_admin_list_users() ซึ่งคืนเฉพาะ safe fields

-- masters: อ่านได้เมื่อมี active profile
CREATE POLICY njacc_customers_sel ON public.njacc_customers
  FOR SELECT TO authenticated USING (public.njacc_current_profile_id() IS NOT NULL);
CREATE POLICY njacc_companies_sel ON public.njacc_company_invoices
  FOR SELECT TO authenticated USING (public.njacc_current_profile_id() IS NOT NULL);
CREATE POLICY njacc_scodes_sel ON public.njacc_service_codes
  FOR SELECT TO authenticated USING (public.njacc_current_profile_id() IS NOT NULL);

-- settings: อ่านได้เฉพาะ key ที่ไม่ sensitive
CREATE POLICY njacc_settings_sel ON public.njacc_settings
  FOR SELECT TO authenticated
  USING (public.njacc_current_profile_id() IS NOT NULL AND key NOT LIKE 'secret_%');

-- ไม่มี INSERT/UPDATE/DELETE policy ใด ๆ → เขียนตรงไม่ได้ ต้องผ่าน RPC (005)
COMMIT;

-- VERIFICATION
SELECT tablename, rowsecurity FROM pg_tables
 WHERE schemaname='public' AND tablename LIKE 'njacc\_%' ESCAPE '\' ORDER BY tablename;
SELECT polname, tablename FROM pg_policies p JOIN pg_tables t
  ON t.tablename = p.tablename WHERE p.schemaname='public'
  AND p.tablename LIKE 'njacc\_%' ESCAPE '\' ORDER BY p.tablename;
-- ตรวจว่าไม่มี write policy: query ด้านบนต้องมีเฉพาะ policy _sel
