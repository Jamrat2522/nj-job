-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_ADD_JOB_MODE.sql
-- โหมดงาน (IMPORT / EXPORT / FORM) — ใช้คอลัมน์เดิม ไม่สร้างคอลัมน์ใหม่
--
-- ═══ ผลการตรวจ Source/DB จริงก่อนเขียนไฟล์นี้ ═════════════════════════════
--   คอลัมน์      public.njacc_jobs.data_type   type text        <- มีอยู่แล้ว
--   CHECK เดิม   njacc_jobs_dtype_ck
--                CHECK (data_type IS NULL OR data_type = ANY (ARRAY['IMPORT','EXPORT']))
--   ข้อมูลจริง   data_type = NULL ทั้ง 2 แถว (ยังไม่มีใครกรอก)
--   RPC บันทึก   njacc_save_job  เขียน data_type = p->>'data_type' อยู่แล้ว (INSERT + UPDATE)
--   RPC อ่าน     njacc_job_detail ใช้ to_jsonb(j) -> คืน data_type มาอยู่แล้ว
--   Frontend     job-form.js บรรทัด 55/219 (ฟอร์มเต็มหน้า) ใช้ #jf-dtype อยู่แล้ว
--                Modal เปิดงานส่ง data_type ต่อค่าเดิม (บรรทัด 523) แต่ยังไม่มีช่องให้เลือก
--
--   => *** ไม่สร้าง field ซ้ำ · ไม่แก้ njacc_save_job · ไม่แก้ njacc_job_detail ***
--      สิ่งเดียวที่ DB ต้องเปลี่ยน = ขยาย CHECK ให้รับค่า 'FORM' เพิ่ม
--
-- ═══ เรื่อง DROP ══════════════════════════════════════════════════════════
--   PostgreSQL แก้ CHECK constraint ในที่เดิมไม่ได้ ต้อง DROP แล้ว ADD ใหม่
--   ไฟล์นี้จึง DROP เฉพาะ "njacc_jobs_dtype_ck ตัวเดิม" แล้วสร้างทับด้วยตัวที่กว้างขึ้น
--   (IMPORT · EXPORT · FORM · NULL)  ค่าที่เคยผ่านเดิมยังผ่านทั้งหมด
--   *** ไม่ DROP TABLE / COLUMN / INDEX / ข้อมูล ใด ๆ ***
--   *** ไม่มี DELETE / TRUNCATE / UPDATE ข้อมูลเดิม ***
--
-- ลำดับ: รันไฟล์นี้ "ก่อน Deploy HTML"
--   ถ้า Deploy HTML ก่อน: เลือก IMPORT/EXPORT บันทึกได้ปกติ
--   แต่เลือก FORM แล้วบันทึกจะติด CHECK เดิม (งานไม่ถูกบันทึก + ขึ้น error)
-- ไม่เกี่ยวกับ RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql และ RUN-01_document_number_migration.sql
--   (คนละคอลัมน์ คนละ object) จะรันไฟล์ไหนก่อน-หลังก็ได้
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. PREFLIGHT ──────────────────────────────────────────────────────────
DO $$
DECLARE v_bad int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute a
                   JOIN pg_class c ON c.oid=a.attrelid
                   JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname='public' AND c.relname='njacc_jobs'
                    AND a.attname='data_type' AND NOT a.attisdropped) THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบคอลัมน์ njacc_jobs.data_type';
  END IF;
  /* ข้อมูลเดิมทุกแถวต้องผ่าน CHECK ตัวใหม่ ไม่งั้นหยุดทันที */
  SELECT count(*) INTO v_bad FROM public.njacc_jobs
   WHERE data_type IS NOT NULL AND data_type NOT IN ('IMPORT','EXPORT','FORM');
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — มี data_type นอกรายการ % แถว', v_bad;
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS — data_type ที่ไม่เข้าเงื่อนไข = 0 แถว';
END $$;

-- ── 2. ขยาย CHECK ให้รับ FORM (drop เฉพาะ constraint ตัวเดิมตัวเดียว) ─────
ALTER TABLE public.njacc_jobs DROP CONSTRAINT IF EXISTS njacc_jobs_dtype_ck;

ALTER TABLE public.njacc_jobs
  ADD CONSTRAINT njacc_jobs_dtype_ck
  CHECK (data_type IS NULL OR data_type = ANY (ARRAY['IMPORT','EXPORT','FORM']));

COMMENT ON COLUMN public.njacc_jobs.data_type IS
  'โหมดงาน — IMPORT / EXPORT / FORM (Dropdown "โหมด" ในหน้าเปิดงาน)';

-- ── 3. VERIFY (อ่านอย่างเดียว) ────────────────────────────────────────────
SELECT 'V1 CHECK njacc_jobs_dtype_ck รับ IMPORT/EXPORT/FORM/NULL' AS check_item,
       CASE WHEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conrelid='public.njacc_jobs'::regclass
                     AND conname='njacc_jobs_dtype_ck')
                 ILIKE '%IMPORT%' AND
            (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conrelid='public.njacc_jobs'::regclass
                     AND conname='njacc_jobs_dtype_ck')
                 ILIKE '%FORM%'
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 คอลัมน์ data_type ยังเป็น text ตัวเดิม (ไม่ได้สร้างคอลัมน์ใหม่)',
       CASE WHEN (SELECT count(*) FROM pg_attribute a
                    JOIN pg_class c ON c.oid=a.attrelid
                    JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname='public' AND c.relname='njacc_jobs'
                     AND NOT a.attisdropped
                     AND a.attname IN ('data_type','job_mode','mode')) = 1
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 njacc_save_job ยังเขียน data_type เหมือนเดิม (ไม่ถูกแตะ)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%data_type%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 njacc_job_detail คืน data_type (to_jsonb)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) ILIKE '%to_jsonb(j)%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_job_detail')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 ไม่มีแถวใดผิดเงื่อนไขใหม่',
       CASE WHEN (SELECT count(*) FROM public.njacc_jobs
                   WHERE data_type IS NOT NULL
                     AND data_type NOT IN ('IMPORT','EXPORT','FORM')) = 0
            THEN 'PASS' ELSE 'FAIL' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   ต้องไม่มีแถวที่ data_type='FORM' ค้างอยู่ก่อน (ไม่งั้น ADD CONSTRAINT จะ fail)
--   SELECT count(*) FROM public.njacc_jobs WHERE data_type='FORM';   -- ต้องได้ 0
--   ALTER TABLE public.njacc_jobs DROP CONSTRAINT IF EXISTS njacc_jobs_dtype_ck;
--   ALTER TABLE public.njacc_jobs
--     ADD CONSTRAINT njacc_jobs_dtype_ck
--     CHECK (data_type IS NULL OR data_type = ANY (ARRAY['IMPORT','EXPORT']));
