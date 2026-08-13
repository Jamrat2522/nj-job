-- =====================================================================
-- BILLING NJ — 002_njacc_constraints.sql  (รันหลัง 001)
-- =====================================================================
-- PREFLIGHT: ต้องมี 19 ตาราง njacc_
SELECT count(*) FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';

BEGIN;

-- ENUM-like CHECK constraints
ALTER TABLE public.njacc_profiles
  ADD CONSTRAINT njacc_profiles_role_ck CHECK (role IN ('SUPER_ADMIN','ADMIN','USER')),
  ADD CONSTRAINT njacc_profiles_login_uq UNIQUE (login_name),
  ADD CONSTRAINT njacc_profiles_internal_uq UNIQUE (internal_username),
  ADD CONSTRAINT njacc_profiles_authid_uq UNIQUE (auth_identity),
  ADD CONSTRAINT njacc_profiles_empcode_uq UNIQUE (employee_code),
  ADD CONSTRAINT njacc_profiles_prov_ck CHECK (provisioning_status IN
    ('PENDING','AUTH_CREATED','ACTIVE','FAILED_CLEANUP')),
  -- INVARIANT A: ACTIVE ต้องมี auth_user_id เสมอ
  ADD CONSTRAINT njacc_profiles_prov_active_ck CHECK (
    provisioning_status <> 'ACTIVE' OR auth_user_id IS NOT NULL),
  -- INVARIANT B: AUTH_CREATED ต้องมี provisioning_auth_user_id เสมอ
  ADD CONSTRAINT njacc_profiles_prov_authid_ck CHECK (
    provisioning_status <> 'AUTH_CREATED' OR provisioning_auth_user_id IS NOT NULL),
  -- INVARIANT C: active=true ได้เฉพาะโปรไฟล์ที่ provision สำเร็จแล้ว
  ADD CONSTRAINT njacc_profiles_active_ck CHECK (
    active = false OR (provisioning_status = 'ACTIVE' AND auth_user_id IS NOT NULL));

ALTER TABLE public.njacc_user_access
  ADD CONSTRAINT njacc_ua_charge_ck CHECK (charge_type IN ('SERVICE','ADVANCE','*')),
  ADD CONSTRAINT njacc_ua_group_ck  CHECK (company_group IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS','*')),
  ADD CONSTRAINT njacc_ua_uq UNIQUE (profile_id, charge_type, company_group);

ALTER TABLE public.njacc_jobs
  ADD CONSTRAINT njacc_jobs_no_uq UNIQUE (job_no),
  ADD CONSTRAINT njacc_jobs_charge_ck CHECK (charge_type IN ('SERVICE','ADVANCE')),
  ADD CONSTRAINT njacc_jobs_group_ck  CHECK (company_group IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS')),
  ADD CONSTRAINT njacc_jobs_dtype_ck  CHECK (data_type IS NULL OR data_type IN ('IMPORT','EXPORT')),
  ADD CONSTRAINT njacc_jobs_ostatus_ck CHECK (operational_status IN ('OPEN','PROCESSING','CLOSE','CANCELED')),
  ADD CONSTRAINT njacc_jobs_qtyc_ck CHECK (qty_container IS NULL OR qty_container >= 0);

-- FK jobs.invoice_id → invoices (สร้างหลังมีทั้งสองตาราง)
ALTER TABLE public.njacc_jobs
  ADD CONSTRAINT njacc_jobs_invoice_fk FOREIGN KEY (invoice_id)
  REFERENCES public.njacc_invoices(id);

ALTER TABLE public.njacc_job_containers
  ADD CONSTRAINT njacc_jc_uq UNIQUE (job_id, sequence_no);

ALTER TABLE public.njacc_invoices
  ADD CONSTRAINT njacc_inv_no_uq UNIQUE (invoice_no),
  ADD CONSTRAINT njacc_inv_status_ck CHECK (status IN ('DRAFT','ISSUED','VOID')),
  ADD CONSTRAINT njacc_inv_paystatus_ck CHECK (payment_status IN ('UNPAID','PARTIAL','PAID')),
  ADD CONSTRAINT njacc_inv_charge_ck CHECK (charge_type IN ('SERVICE','ADVANCE')),
  ADD CONSTRAINT njacc_inv_group_ck  CHECK (company_group IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS')),
  ADD CONSTRAINT njacc_inv_amounts_ck CHECK (subtotal >= 0 AND vat_amount >= 0 AND wht_amount >= 0);

ALTER TABLE public.njacc_invoice_items
  ADD CONSTRAINT njacc_ii_line_uq UNIQUE (invoice_id, line_no),
  ADD CONSTRAINT njacc_ii_lineno_ck CHECK (line_no > 0);

ALTER TABLE public.njacc_payments
  ADD CONSTRAINT njacc_pay_no_uq UNIQUE (payment_no),
  ADD CONSTRAINT njacc_pay_status_ck CHECK (status IN ('POSTED','VOID')),
  ADD CONSTRAINT njacc_pay_amount_ck CHECK (amount_received > 0);

ALTER TABLE public.njacc_payment_allocations
  ADD CONSTRAINT njacc_pa_amount_ck CHECK (allocated_amount > 0),
  ADD CONSTRAINT njacc_pa_uq UNIQUE (payment_id, invoice_id);

ALTER TABLE public.njacc_receipts
  ADD CONSTRAINT njacc_rc_no_uq UNIQUE (receipt_no),
  ADD CONSTRAINT njacc_rc_status_ck CHECK (status IN ('ISSUED','VOID')),
  ADD CONSTRAINT njacc_rc_payment_uq UNIQUE (payment_id);

ALTER TABLE public.njacc_receipt_allocations
  ADD CONSTRAINT njacc_ra_amount_ck CHECK (amount > 0),
  ADD CONSTRAINT njacc_ra_uq UNIQUE (receipt_id, invoice_id);

ALTER TABLE public.njacc_withholding_docs
  ADD CONSTRAINT njacc_wht_no_uq UNIQUE (document_no),
  ADD CONSTRAINT njacc_wht_status_ck CHECK (status IN ('ISSUED','VOID')),
  ADD CONSTRAINT njacc_wht_amounts_ck CHECK (tax_base >= 0 AND amount >= 0 AND rate >= 0);

ALTER TABLE public.njacc_service_codes
  ADD CONSTRAINT njacc_scode_uq UNIQUE (code);

-- updated_at trigger (เฉพาะตาราง njacc_ ใหม่)
CREATE OR REPLACE FUNCTION public.njacc_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE TRIGGER njacc_profiles_touch  BEFORE UPDATE ON public.njacc_profiles
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();
CREATE TRIGGER njacc_customers_touch BEFORE UPDATE ON public.njacc_customers
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();
CREATE TRIGGER njacc_jobs_touch      BEFORE UPDATE ON public.njacc_jobs
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();
CREATE TRIGGER njacc_invoices_touch  BEFORE UPDATE ON public.njacc_invoices
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();
CREATE TRIGGER njacc_settings_touch  BEFORE UPDATE ON public.njacc_settings
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();

ALTER TABLE public.njacc_invoice_items
  ADD CONSTRAINT njacc_items_kind_ck CHECK (charge_kind IN ('SERVICE','ADVANCE'));

ALTER TABLE public.njacc_job_financial_snapshot
  ADD CONSTRAINT njacc_fs_source_ck CHECK (source_type IN ('IMPORT_OLD_BILLING','MANUAL'));

COMMIT;

-- VERIFICATION
SELECT conname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
 WHERE t.relname LIKE 'njacc\_%' ESCAPE '\' AND conname LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY conname;
-- Rollback: ใช้ Rollback ของ 001 (drop ทั้งชุด) หรือ ALTER TABLE ... DROP CONSTRAINT รายตัว
