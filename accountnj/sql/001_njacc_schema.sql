-- =====================================================================
-- BILLING NJ — 001_njacc_schema.sql
-- NEW SYSTEM · prefix njacc_ · ห้ามแตะตาราง Billing เดิม
-- รันโดยคุณน้อยเท่านั้น · รันตามลำดับ 001→007
-- =====================================================================

-- ============================ PREFLIGHT ==============================
-- ตรวจชื่อชนก่อนสร้าง: ต้องคืน 0 แถวทั้งหมด ถ้ามีแถว = หยุด อย่ารันต่อ
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';
SELECT routine_name FROM information_schema.routines
 WHERE routine_schema='public' AND routine_name LIKE 'njacc\_%' ESCAPE '\';
-- ยืนยันว่าตาราง Billing เดิมยังอยู่ครบ (READ-ONLY เท่านั้น):
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public'
   AND table_name IN ('service_charge_records','advance_charge_records','app_users');
-- REFERENCE ONLY: ตรวจว่าตารางของ BILLING เดิมยังอยู่ครบและไม่ถูกแตะ — BILLING NJ ไม่ได้อ่าน/เขียนตารางเหล่านี้
-- =====================================================================

BEGIN;

-- ---------- 1. PROFILES ----------
CREATE TABLE public.njacc_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id     uuid UNIQUE,                 -- link auth.users (bootstrap ทีหลัง)
  employee_code    text NOT NULL,
  full_name        text NOT NULL,
  department       text,
  login_name       text NOT NULL,               -- เช่น jamrat30 (แสดงได้ — ใช้ Login)
  -- auth_identity: ตัวตนสำหรับ Supabase Auth แบบ opaque (ไม่มีชื่อ/รหัสพนักงาน/เลข 80)
  -- อีเมลที่ใช้กับ GoTrue = auth_identity || '@auth.billing.local'
  -- SERVER-ONLY: ห้าม GRANT ตารางนี้ให้ authenticated และห้าม RPC ใด ๆ คืนค่านี้
  auth_identity    text NOT NULL DEFAULT ('njacc-auth-'||gen_random_uuid()::text),
  internal_username text,                       -- metadata ภายในเท่านั้น (เช่น jamrat80) — ไม่ใช้ authenticate
  role             text NOT NULL DEFAULT 'USER',-- SUPER_ADMIN | ADMIN | USER
  -- active = true ได้เฉพาะเมื่อ provision สำเร็จ (บังคับด้วย CHECK ใน 002)
  active           boolean NOT NULL DEFAULT false,
  -- provisioning: ใช้กับ Create User flow (PENDING → ACTIVE) เพื่อกัน orphan/ทำ retry ได้
  -- PENDING | AUTH_CREATED | ACTIVE | FAILED_CLEANUP
  provisioning_status     text NOT NULL DEFAULT 'PENDING',
  provisioning_request_id text,        -- request_id ที่สร้างแถวนี้ (ownership)
  provisioning_auth_user_id uuid,      -- auth user ที่ request นี้สร้าง (ติดตามกัน orphan) SERVER-ONLY
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- 2. USER ACCESS (permission ราย user × charge_type × group) ----------
CREATE TABLE public.njacc_user_access (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid NOT NULL REFERENCES public.njacc_profiles(id) ON DELETE CASCADE,
  charge_type         text NOT NULL,            -- SERVICE | ADVANCE | * (ทุกประเภท)
  company_group       text NOT NULL,            -- NJ | DSV | MAERSK | KUEHNE | RHENUS | *
  can_view            boolean NOT NULL DEFAULT false,
  can_create          boolean NOT NULL DEFAULT false,
  can_edit            boolean NOT NULL DEFAULT false,
  can_invoice         boolean NOT NULL DEFAULT false,
  can_receive_payment boolean NOT NULL DEFAULT false,
  can_issue_receipt   boolean NOT NULL DEFAULT false,
  can_export          boolean NOT NULL DEFAULT false,
  can_void            boolean NOT NULL DEFAULT false,
  can_manage_users    boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------- 3. MASTER: CUSTOMERS ----------
CREATE TABLE public.njacc_customers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code    text,
  customer_name    text NOT NULL,
  tax_id           text,
  branch_code      text,
  address          text,
  contact_name     text,
  email            text,
  phone            text,
  credit_term_days integer NOT NULL DEFAULT 30,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- 4. MASTER: COMPANY INVOICES ----------
CREATE TABLE public.njacc_company_invoices (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code text,
  company_name text NOT NULL,
  contact_name text,                          -- จาก LIST NAME (Company Invoice → Contact)
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- 5. MASTER: SERVICE CODES ----------
CREATE TABLE public.njacc_service_codes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL,
  description    text NOT NULL,
  default_cost   numeric(18,2) NOT NULL DEFAULT 0,
  default_charge numeric(18,2) NOT NULL DEFAULT 0,
  vat_applicable boolean NOT NULL DEFAULT true,
  wht_applicable boolean NOT NULL DEFAULT false,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------- 6. JOBS ----------
CREATE TABLE public.njacc_jobs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no                  text NOT NULL,
  charge_type             text NOT NULL,        -- SERVICE | ADVANCE
  company_group           text NOT NULL,        -- NJ | DSV | MAERSK | KUEHNE | RHENUS
  data_type               text,                 -- IMPORT | EXPORT
  reference_no            text,
  reference_date          date,
  company_invoice_id      uuid REFERENCES public.njacc_company_invoices(id),
  customer_id             uuid REFERENCES public.njacc_customers(id),
  customs_declaration_no  text,
  source_invoice_no       text,                 -- invoice ต้นทาง (ไม่ใช่ accounting invoice)
  house_bl_no             text,
  master_bl_no            text,
  booking_no              text,
  vessel_name             text,
  qty_container           integer,
  etd                     date,
  eta                     date,
  delivery_date           date,
  customer_job_no         text,
  credit_term_days        integer,
  due_date                date,
  note                    text,
  operational_status      text NOT NULL DEFAULT 'OPEN',  -- OPEN|PROCESSING|CLOSE|CANCELED
  invoice_id              uuid,                 -- NULL จนบัญชีออก INVOICE (FK ใน 002)
  created_by              uuid REFERENCES public.njacc_profiles(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_by              uuid REFERENCES public.njacc_profiles(id),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ---------- 7. JOB CONTAINERS ----------
CREATE TABLE public.njacc_job_containers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         uuid NOT NULL REFERENCES public.njacc_jobs(id) ON DELETE CASCADE,
  container_no   text NOT NULL,
  container_type text,
  sequence_no    integer NOT NULL DEFAULT 1
);

-- ---------- 8. INVOICES ----------
CREATE TABLE public.njacc_invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no     text NOT NULL,
  job_id         uuid NOT NULL REFERENCES public.njacc_jobs(id),
  customer_id    uuid NOT NULL REFERENCES public.njacc_customers(id),
  charge_type    text NOT NULL,
  company_group  text NOT NULL,
  invoice_date   date NOT NULL DEFAULT current_date,
  due_date       date,
  subtotal       numeric(18,2) NOT NULL DEFAULT 0,
  vat_base       numeric(18,2) NOT NULL DEFAULT 0,
  vat_rate       numeric(6,3)  NOT NULL DEFAULT 0,
  vat_amount     numeric(18,2) NOT NULL DEFAULT 0,
  wht_amount     numeric(18,2) NOT NULL DEFAULT 0,
  total_amount   numeric(18,2) NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'ISSUED', -- DRAFT|ISSUED|VOID
  payment_status text NOT NULL DEFAULT 'UNPAID', -- UNPAID|PARTIAL|PAID
  issued_by      uuid REFERENCES public.njacc_profiles(id),
  issued_at      timestamptz,
  voided_by      uuid REFERENCES public.njacc_profiles(id),
  voided_at      timestamptz,
  void_reason    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------- 9. INVOICE ITEMS ----------
CREATE TABLE public.njacc_invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES public.njacc_invoices(id) ON DELETE CASCADE,
  line_no     integer NOT NULL,
  code        text,
  description text NOT NULL,
  amount      numeric(18,2) NOT NULL DEFAULT 0,
  cost        numeric(18,2) NOT NULL DEFAULT 0,
  charge      numeric(18,2) NOT NULL DEFAULT 0,
  vat_rate    numeric(6,3)  NOT NULL DEFAULT 0,
  vat_amount  numeric(18,2) NOT NULL DEFAULT 0,
  wht_rate    numeric(6,3)  NOT NULL DEFAULT 0,
  wht_amount  numeric(18,2) NOT NULL DEFAULT 0,
  line_total  numeric(18,2) NOT NULL DEFAULT 0
);

-- ---------- 10. PAYMENTS ----------
CREATE TABLE public.njacc_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no      text NOT NULL,
  customer_id     uuid NOT NULL REFERENCES public.njacc_customers(id),
  payment_date    date NOT NULL DEFAULT current_date,
  amount_received numeric(18,2) NOT NULL,
  method          text,
  reference_no    text,
  note            text,
  status          text NOT NULL DEFAULT 'POSTED', -- POSTED|VOID
  created_by      uuid REFERENCES public.njacc_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  voided_by       uuid REFERENCES public.njacc_profiles(id),
  voided_at       timestamptz,
  void_reason     text
);

-- ---------- 11. PAYMENT ALLOCATIONS (1 payment → N invoices) ----------
CREATE TABLE public.njacc_payment_allocations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       uuid NOT NULL REFERENCES public.njacc_payments(id) ON DELETE CASCADE,
  invoice_id       uuid NOT NULL REFERENCES public.njacc_invoices(id),
  allocated_amount numeric(18,2) NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- 12. RECEIPTS ----------
CREATE TABLE public.njacc_receipts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no     text NOT NULL,
  customer_id    uuid NOT NULL REFERENCES public.njacc_customers(id),
  payment_id     uuid NOT NULL REFERENCES public.njacc_payments(id),
  receipt_date   date NOT NULL DEFAULT current_date,
  total_received numeric(18,2) NOT NULL,
  status         text NOT NULL DEFAULT 'ISSUED', -- ISSUED|VOID
  issued_by      uuid REFERENCES public.njacc_profiles(id),
  issued_at      timestamptz NOT NULL DEFAULT now(),
  voided_by      uuid REFERENCES public.njacc_profiles(id),
  voided_at      timestamptz,
  void_reason    text
);

-- ---------- 13. RECEIPT ALLOCATIONS ----------
CREATE TABLE public.njacc_receipt_allocations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.njacc_receipts(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.njacc_invoices(id),
  amount     numeric(18,2) NOT NULL
);

-- ---------- 14. WITHHOLDING DOCS ----------
CREATE TABLE public.njacc_withholding_docs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_no     text NOT NULL,
  customer_id     uuid NOT NULL REFERENCES public.njacc_customers(id),
  invoice_id      uuid REFERENCES public.njacc_invoices(id),
  payment_id      uuid REFERENCES public.njacc_payments(id),
  document_date   date NOT NULL DEFAULT current_date,
  wht_type        text,
  tax_base        numeric(18,2) NOT NULL DEFAULT 0,
  rate            numeric(6,3)  NOT NULL DEFAULT 0,
  amount          numeric(18,2) NOT NULL DEFAULT 0,
  reference_no    text,
  attachment_path text,
  status          text NOT NULL DEFAULT 'ISSUED', -- ISSUED|VOID
  created_by      uuid REFERENCES public.njacc_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  voided_by       uuid REFERENCES public.njacc_profiles(id),
  voided_at       timestamptz,
  void_reason     text
);

-- ---------- 15. DOCUMENT SEQUENCES (ห้าม MAX()+1 จาก browser) ----------
-- 19) FINANCIAL SNAPSHOT ของข้อมูลที่ Import จาก Billing รูปแบบเดิม
--     ไม่ใช่เอกสารบัญชี (ไม่ใช่ INVOICE) — ใช้แสดงยอดของงานที่ยังไม่ได้ออก INVOICE ในระบบใหม่
CREATE TABLE public.njacc_job_financial_snapshot (
  job_id         uuid PRIMARY KEY REFERENCES public.njacc_jobs(id) ON DELETE CASCADE,
  source_type    text NOT NULL DEFAULT 'IMPORT_OLD_BILLING',
  service_charge numeric(18,2),
  advance        numeric(18,2),
  vat            numeric(18,2),
  amount         numeric(18,2),   -- ค่า Amount ตามไฟล์ต้นทาง (ไม่คำนวณแทน)
  wht            numeric(18,2),
  total_amount   numeric(18,2),   -- ค่า Total ตามไฟล์ต้นทาง (Net after WHT ในระบบเดิม)
  imported_at    timestamptz NOT NULL DEFAULT now(),
  imported_by    uuid REFERENCES public.njacc_profiles(id)
);

CREATE TABLE public.njacc_document_sequences (
  doc_type    text NOT NULL,     -- JOB|INVOICE|PAYMENT|RECEIPT|WHT
  scope_key   text NOT NULL,     -- เช่น '2026' หรือ 'SERVICE-NJ-2026'
  last_number bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, scope_key)
);

-- ---------- 16. AUDIT LOGS ----------
CREATE TABLE public.njacc_audit_logs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id  uuid REFERENCES public.njacc_profiles(id),
  action      text NOT NULL,
  entity_type text,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- 17. SETTINGS (VAT, deploy version, maintenance ฯลฯ) ----------
CREATE TABLE public.njacc_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.njacc_profiles(id)
);

-- ---------- 18. IDEMPOTENCY ----------
CREATE TABLE public.njacc_idempotency_requests (
  request_id  text PRIMARY KEY,
  operation   text NOT NULL,
  profile_id  uuid,
  result_type text,
  result_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMIT;

-- ========================== VERIFICATION =============================
SELECT count(*) AS njacc_tables_created FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';
-- Expected: 18
-- =====================================================================
-- ROLLBACK (ใช้เฉพาะกรณียกเลิกทั้งชุด — ระบุชื่อชัดเจน ไม่แตะตารางอื่น):
-- DROP TABLE IF EXISTS
--   public.njacc_idempotency_requests, public.njacc_settings, public.njacc_audit_logs,
--   public.njacc_document_sequences, public.njacc_withholding_docs,
--   public.njacc_receipt_allocations, public.njacc_receipts,
--   public.njacc_payment_allocations, public.njacc_payments,
--   public.njacc_invoice_items, public.njacc_invoices,
--   public.njacc_job_containers, public.njacc_jobs,
--   public.njacc_service_codes, public.njacc_company_invoices, public.njacc_customers,
--   public.njacc_user_access, public.njacc_profiles CASCADE;
