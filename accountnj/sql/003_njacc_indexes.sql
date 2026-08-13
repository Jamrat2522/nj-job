-- =====================================================================
-- BILLING NJ — 003_njacc_indexes.sql  (รันหลัง 002)
-- Index ตาม query จริงของ list / kpi / report / receipt
-- =====================================================================
-- ► PREFLIGHT (อ่านอย่างเดียว — ต้องผ่านก่อนรันไฟล์นี้)
-- 1) ต้องมี extension pg_trgm อยู่แล้ว · BILLING NJ ไม่สร้าง/แก้ shared extension เอง
DO $pre$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_trgm') THEN
    RAISE EXCEPTION 'NJACC_REQUIRES_PG_TRGM: ให้ผู้ดูแลฐานข้อมูลติดตั้ง extension pg_trgm ก่อน (CREATE EXTENSION pg_trgm;) แล้วรันไฟล์นี้ใหม่';
  END IF;
END $pre$;
-- 2) คอลัมน์ที่ index ต้องใช้ ต้องมีอยู่แล้วจาก 001
DO $pre2$
DECLARE v_missing text;
BEGIN
  SELECT string_agg(c, ', ') INTO v_missing FROM (
    SELECT c FROM unnest(ARRAY['case_no','i_billing_apl','cs_name','contact']) c
     WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='njacc_jobs' AND column_name=c)) t;
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'NJACC_MISSING_COLUMNS on njacc_jobs: % — ให้รัน 001 เวอร์ชันล่าสุดก่อน', v_missing;
  END IF;
END $pre2$;

BEGIN;

-- jobs: หน้า list กรอง charge_type+company_group เสมอ + เรียง created_at
CREATE INDEX njacc_jobs_ctg_created_idx ON public.njacc_jobs (charge_type, company_group, created_at DESC);
CREATE INDEX njacc_jobs_customer_idx    ON public.njacc_jobs (customer_id);
CREATE INDEX njacc_jobs_due_idx         ON public.njacc_jobs (due_date);
CREATE INDEX njacc_jobs_ostatus_idx     ON public.njacc_jobs (operational_status);
CREATE INDEX njacc_jobs_cjob_idx        ON public.njacc_jobs (customer_job_no);
CREATE INDEX njacc_jobs_ref_idx         ON public.njacc_jobs (reference_no);
CREATE INDEX njacc_jobs_refdate_idx     ON public.njacc_jobs (charge_type, company_group, reference_date DESC);

-- invoices
CREATE INDEX njacc_inv_cust_date_idx ON public.njacc_invoices (customer_id, invoice_date DESC);
CREATE INDEX njacc_inv_ctg_date_idx  ON public.njacc_invoices (charge_type, company_group, invoice_date DESC);
CREATE INDEX njacc_inv_pay_due_idx   ON public.njacc_invoices (payment_status, due_date);
CREATE INDEX njacc_inv_job_idx       ON public.njacc_invoices (job_id);

-- invoice items
CREATE INDEX njacc_ii_inv_idx ON public.njacc_invoice_items (invoice_id);

-- payments / allocations
CREATE INDEX njacc_pay_cust_idx ON public.njacc_payments (customer_id, payment_date DESC);
CREATE INDEX njacc_pa_inv_idx   ON public.njacc_payment_allocations (invoice_id);
CREATE INDEX njacc_pa_pay_idx   ON public.njacc_payment_allocations (payment_id);

-- receipts
CREATE INDEX njacc_rc_cust_date_idx ON public.njacc_receipts (customer_id, receipt_date DESC);
CREATE INDEX njacc_ra_inv_idx       ON public.njacc_receipt_allocations (invoice_id);

-- wht
CREATE INDEX njacc_wht_cust_idx ON public.njacc_withholding_docs (customer_id, document_date DESC);

-- audit
CREATE INDEX njacc_audit_created_idx ON public.njacc_audit_logs (created_at DESC);
CREATE INDEX njacc_audit_entity_idx  ON public.njacc_audit_logs (entity_type, entity_id);

-- user access lookup
CREATE INDEX njacc_ua_profile_idx ON public.njacc_user_access (profile_id);

-- ---------------------------------------------------------------
-- SEARCH: GIN trigram เฉพาะฟิลด์ที่ใช้ ILIKE '%...%' จริงในหน้ารายการ
-- (Production มี pg_trgm ติดตั้งแล้ว — ถ้าไม่มีให้รัน CREATE EXTENSION ก่อน)
-- ---------------------------------------------------------------
CREATE INDEX njacc_jobs_cjob_trgm_idx   ON public.njacc_jobs USING gin (customer_job_no gin_trgm_ops);
CREATE INDEX njacc_jobs_hbl_trgm_idx    ON public.njacc_jobs USING gin (house_bl_no gin_trgm_ops);
CREATE INDEX njacc_jobs_mbl_trgm_idx    ON public.njacc_jobs USING gin (master_bl_no gin_trgm_ops);
CREATE INDEX njacc_jobs_dcl_trgm_idx    ON public.njacc_jobs USING gin (customs_declaration_no gin_trgm_ops);
CREATE INDEX njacc_jobs_srcinv_trgm_idx ON public.njacc_jobs USING gin (source_invoice_no gin_trgm_ops);
CREATE INDEX njacc_jobs_jobno_trgm_idx  ON public.njacc_jobs USING gin (job_no gin_trgm_ops);
CREATE INDEX njacc_jobs_case_trgm_idx   ON public.njacc_jobs USING gin (case_no gin_trgm_ops);
CREATE INDEX njacc_jobs_apl_trgm_idx    ON public.njacc_jobs USING gin (i_billing_apl gin_trgm_ops);
CREATE INDEX njacc_inv_no_trgm_idx      ON public.njacc_invoices USING gin (invoice_no gin_trgm_ops);
CREATE INDEX njacc_cust_name_trgm_idx   ON public.njacc_customers USING gin (customer_name gin_trgm_ops);
-- container: ใช้ EXISTS จากตารางลูก (ไม่โหลดเข้า browser)
CREATE INDEX njacc_jc_no_trgm_idx       ON public.njacc_job_containers USING gin (container_no gin_trgm_ops);

-- filter options / due bucket
CREATE INDEX njacc_jobs_scope_due_idx ON public.njacc_jobs (charge_type, company_group, due_date);
CREATE INDEX njacc_jobs_scope_cust_idx ON public.njacc_jobs (charge_type, company_group, customer_id);

COMMIT;

-- VERIFICATION
SELECT indexname FROM pg_indexes
 WHERE schemaname='public' AND indexname LIKE 'njacc\_%' ESCAPE '\' ORDER BY indexname;
-- Rollback: DROP INDEX รายตัวตามชื่อด้านบน
