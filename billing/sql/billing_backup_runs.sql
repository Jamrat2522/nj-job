/* ═══════════════════════════════════════════════════════════════════════════
   billing_backup_runs — ตาราง Backup History (§18)
   ───────────────────────────────────────────────────────────────────────────
   ⚠ ยังไม่ต้องรัน — ส่งมาให้ตรวจก่อนตามข้อ §18 และ §25
   ───────────────────────────────────────────────────────────────────────────
   รายงานตาม §25 (ต้องระบุก่อนทำ DDL ทุกครั้ง):

   คำสั่งอะไร : CREATE TABLE ใหม่ 1 ตาราง + 2 index + RLS + 1 policy
   ทำไมต้องทำ : เก็บ metadata ของ backup แต่ละรอบ เพื่อให้หน้า Backup ในเว็บ
                แสดง Last Backup / Next Backup / Verify / Restore Test ได้
   กระทบอะไร  : ─ ไม่แตะตารางเดิมแม้แต่ตารางเดียว
                ─ ไม่แตะ policy/grant/RLS ของตารางเดิม
                ─ ไม่แตะ Login flow · ไม่แตะ Billing workflow
                ─ เพิ่ม object ใหม่เท่านั้น
   Lock หรือไม่: CREATE TABLE ตารางใหม่ = ไม่ lock ตารางที่มีอยู่
                รันได้ระหว่างเวลาทำงาน ใช้เวลาไม่ถึง 1 วินาที
   Rollback   : DROP TABLE public.billing_backup_runs;  (อยู่ท้ายไฟล์)
   Secret     : ไม่มีคอลัมน์ใดเก็บ password / token / connection string
   ═══════════════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_backup_runs (
  id                      bigserial PRIMARY KEY,
  backup_type             text        NOT NULL DEFAULT 'daily',   -- daily | manual | baseline
  project_id              text        NOT NULL,
  started_at              timestamptz NOT NULL,
  completed_at            timestamptz,
  status                  text        NOT NULL DEFAULT 'RUNNING', -- RUNNING|SUCCESS|WARNING|FAILED
  database_size_bytes     bigint,
  schema_file_size_bytes  bigint,
  data_file_size_bytes    bigint,
  backup_checksum         text,                                    -- sha256 ของ data.dump
  schema_checksum         text,                                    -- sha256 ของ schema.sql
  service_charge_count    bigint,
  advance_charge_count    bigint,
  app_users_count         bigint,
  financial_aggregate     jsonb,                                   -- sum ต่อคอลัมน์ (§16)
  verification_status     text,                                    -- SUCCESS|WARNING|FAILED
  verification_detail     jsonb,                                   -- ผล 8 ข้อ
  storage_status          text        DEFAULT 'N/A',               -- N/A|OK|FAILED
  restore_test_status     text        DEFAULT 'NOT TESTED',        -- PASS|FAIL|NOT TESTED
  restore_test_detail     jsonb,
  destination_path        text,                                    -- Billing/YYYY/MM/DD/HHMMSS
  runner                  text,                                    -- github-actions
  error_message           text,
  created_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bbr_status_chk
    CHECK (status IN ('RUNNING','SUCCESS','WARNING','FAILED')),
  CONSTRAINT bbr_verify_chk
    CHECK (verification_status IS NULL OR verification_status IN ('SUCCESS','WARNING','FAILED')),
  CONSTRAINT bbr_restore_chk
    CHECK (restore_test_status IN ('PASS','FAIL','NOT TESTED')),
  /* บังคับที่ระดับ DB: ห้าม SUCCESS ถ้า verification ไม่ผ่าน (§14) */
  CONSTRAINT bbr_no_fake_success
    CHECK (status <> 'SUCCESS' OR verification_status = 'SUCCESS')
);

CREATE INDEX IF NOT EXISTS idx_bbr_started
  ON public.billing_backup_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bbr_status
  ON public.billing_backup_runs (status, started_at DESC);

COMMENT ON TABLE public.billing_backup_runs IS
  'Backup metadata only. NEVER store secrets (password/token/connection string).';

/* ── สิทธิ์: หน้าเว็บต้องอ่านได้ (แสดง Last Backup) แต่ห้ามเขียน ──
   การเขียนทำโดย runner ที่ใช้ credential แยก ไม่ใช่ anon key           */
ALTER TABLE public.billing_backup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bbr_read_anon
  ON public.billing_backup_runs
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON public.billing_backup_runs TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.billing_backup_runs_id_seq TO anon, authenticated;

COMMIT;


/* ── VERIFICATION (รันหลัง COMMIT) ─────────────────────────────────────── */
SELECT 'table_exists' AS check,
       to_char(count(*),'FM9') AS n
FROM information_schema.tables
WHERE table_schema='public' AND table_name='billing_backup_runs'
UNION ALL
SELECT 'index_count', count(*)::text FROM pg_indexes
WHERE schemaname='public' AND tablename='billing_backup_runs'
UNION ALL
SELECT 'policy_count', count(*)::text FROM pg_policies
WHERE schemaname='public' AND tablename='billing_backup_runs'
UNION ALL
SELECT 'rls_enabled', relrowsecurity::text FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relname='billing_backup_runs';

-- ทดสอบว่า constraint กัน "SUCCESS ปลอม" ได้จริง (ต้อง ERROR)
-- INSERT INTO public.billing_backup_runs
--   (project_id, started_at, status, verification_status)
-- VALUES ('sytgqjglcnsabcszbngg', now(), 'SUCCESS', 'FAILED');
-- คาดหวัง: ERROR ... violates check constraint "bbr_no_fake_success"


/* ═══════════════════════════════════════════════════════════════════════════
   ROLLBACK — รันกลับได้ 100% ไม่กระทบตารางอื่น
   ───────────────────────────────────────────────────────────────────────────
   BEGIN;
     DROP POLICY IF EXISTS bbr_read_anon ON public.billing_backup_runs;
     DROP TABLE IF EXISTS public.billing_backup_runs;   -- index + sequence หายตาม
   COMMIT;
   ═══════════════════════════════════════════════════════════════════════════ */
