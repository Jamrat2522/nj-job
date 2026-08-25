-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-02_CHARGE_SET_DOC_FIELDS.sql
-- ส่งคอลัมน์เอกสารงานเข้าหน้ารายการ (เพิ่ม projection เท่านั้น)
--
-- ═══ ทำไมต้องมีไฟล์นี้ ════════════════════════════════════════════════════
--   หน้ารายการ DOCUMENT ดึงข้อมูลจาก njacc_charge_page_bundle
--   -> เรียก njacc_build_charge_set(p) สร้าง TEMP TABLE _njacc_l
--   SELECT ชั้นสุดท้ายของ build_charge_set ระบุคอลัมน์ไว้ชัดเจน (ไม่ใช่ j.*)
--   ตรวจ definition จริงแล้ว "ไม่มี" คอลัมน์เหล่านี้ใน projection:
--       job_date
--       lift_on_wharf_flag / lift_on_wharf_note
--       storage_charge_flag / storage_charge_note
--       overtime_flag / overtime_date / overtime_slot_1..3
--       truck_card_flag / truck_card_no / truck_card_contact
--       doc_exempt / doc_inspect / cargo_fcl / cargo_lcl / cargo_fz / cargo_fz_fz
--   -> ถ้าไม่เพิ่ม คอลัมน์ใหม่ใน "จัดการคอลัมน์" จะเปิดได้แต่แสดงเป็น '-' ทุกแถว
--   (data_type อยู่ใน projection อยู่แล้ว -> คอลัมน์ "โหมด" ใช้ได้ทันที ไม่ต้องแก้)
--
-- ═══ ขอบเขต — เพิ่มบรรทัด projection อย่างเดียว ═══════════════════════════
--   ยกนิยาม njacc_build_charge_set จาก Production มาทั้งตัว (pg_get_functiondef)
--   แล้วเติมชื่อคอลัมน์ใน SELECT ชั้นสุดท้ายเท่านั้น
--   base CTE ใช้ j.* อยู่แล้ว -> คอลัมน์เหล่านี้มีอยู่ใน CTE ครบ ไม่ต้อง JOIN เพิ่ม
--   ไม่แตะ: WHERE / queue / filter / สิทธิ์ / njacc_charge_page_bundle /
--           njacc_save_job / ตาราง / RLS / policy / index
--   ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE / UPDATE ข้อมูล
--
-- ═══ ลำดับการรัน ══════════════════════════════════════════════════════════
--   ต้องรัน RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql ก่อน (สร้าง 18 คอลัมน์)
--   แล้วจึงรันไฟล์นี้ · ถ้ารันสลับกันจะ error ว่าไม่พบคอลัมน์
--   PREFLIGHT ด้านล่างตรวจให้แล้ว จะหยุดเองถ้ายังไม่ได้รัน RUN-01
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE v_n int;
BEGIN
  SELECT count(*) INTO v_n FROM pg_attribute a
    JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname='njacc_jobs' AND a.attnum>0 AND NOT a.attisdropped
     AND a.attname IN ('lift_on_wharf_flag','lift_on_wharf_note','storage_charge_flag',
       'storage_charge_note','overtime_flag','overtime_date','overtime_slot_1',
       'overtime_slot_2','overtime_slot_3','truck_card_flag','truck_card_no',
       'truck_card_contact','doc_exempt','doc_inspect','cargo_fcl','cargo_lcl',
       'cargo_fz','cargo_fz_fz');
  IF v_n <> 18 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — พบคอลัมน์เอกสารงาน % จาก 18 · ต้องรัน RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql ก่อน', v_n;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_build_charge_set') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_build_charge_set';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $$;

/* ⚠️ วิธีใช้ไฟล์นี้
   njacc_build_charge_set ตัวจริงยาวมาก (มี WHERE/queue/filter ทั้งชุด)
   เพื่อไม่ให้ไฟล์นี้ไปทับ logic ที่อาจถูกแก้ไปแล้ว จึงใช้วิธี
   "อ่านนิยามจริงจาก DB แล้วเติมเฉพาะบรรทัด projection" แบบอัตโนมัติ
   -> ปลอดภัยกว่าการ copy นิยามทั้งก้อนมาแปะในไฟล์
   ถ้า pattern ที่ค้นหาไม่เจอ จะ RAISE แล้วไม่แก้อะไรเลย */
DO $$
DECLARE
  v_def  text;
  v_new  text;
  v_anchor text := 'invoice_date, posted_at, advance_status, advance_settled_at';
  v_add  text := 'invoice_date, posted_at, advance_status, advance_settled_at,'
              || ' job_date,'
              || ' lift_on_wharf_flag, lift_on_wharf_note,'
              || ' storage_charge_flag, storage_charge_note,'
              || ' overtime_flag, overtime_date,'
              || ' overtime_slot_1, overtime_slot_2, overtime_slot_3,'
              || ' truck_card_flag, truck_card_no, truck_card_contact,'
              || ' doc_exempt, doc_inspect,'
              || ' cargo_fcl, cargo_lcl, cargo_fz, cargo_fz_fz';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='njacc_build_charge_set';

  IF position('job_date,' in v_def) > 0 AND position('cargo_fz_fz' in v_def) > 0 THEN
    RAISE NOTICE 'ข้ามการแก้ — projection มีคอลัมน์เอกสารงานอยู่แล้ว (รันซ้ำได้)';
    RETURN;
  END IF;
  IF position(v_anchor in v_def) = 0 THEN
    RAISE EXCEPTION 'ABORT — ไม่พบจุดอ้างอิงใน projection (นิยามถูกแก้ไปแล้ว) · ต้องแก้ด้วยมือ';
  END IF;

  v_new := replace(v_def, v_anchor, v_add);
  EXECUTE v_new;
  RAISE NOTICE 'อัปเดต njacc_build_charge_set — เพิ่ม 19 คอลัมน์ใน projection แล้ว';
END $$;

-- ── VERIFY (อ่านอย่างเดียว) ───────────────────────────────────────────────
WITH d AS (
  SELECT pg_get_functiondef(p.oid) AS c
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='njacc_build_charge_set'
)
SELECT 'V1 projection มี job_date' AS check_item,
       CASE WHEN (SELECT c LIKE '%job_date,%' FROM d) THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 projection มีคอลัมน์เอกสารงานครบ 18',
       CASE WHEN (SELECT c LIKE '%lift_on_wharf_flag%' AND c LIKE '%lift_on_wharf_note%'
                   AND c LIKE '%storage_charge_flag%' AND c LIKE '%storage_charge_note%'
                   AND c LIKE '%overtime_flag%' AND c LIKE '%overtime_date%'
                   AND c LIKE '%overtime_slot_1%' AND c LIKE '%overtime_slot_2%'
                   AND c LIKE '%overtime_slot_3%' AND c LIKE '%truck_card_flag%'
                   AND c LIKE '%truck_card_no%' AND c LIKE '%truck_card_contact%'
                   AND c LIKE '%doc_exempt%' AND c LIKE '%doc_inspect%'
                   AND c LIKE '%cargo_fcl%' AND c LIKE '%cargo_lcl%'
                   AND c LIKE '%cargo_fz,%' AND c LIKE '%cargo_fz_fz%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 queue/filter เดิมยังอยู่ครบ (ไม่ถูกแตะ)',
       CASE WHEN (SELECT c LIKE '%''queue'' = ''document''%' AND c LIKE '%pending_invoice%'
                   AND c LIKE '%receipt_active%' AND c LIKE '%advance_active%'
                   AND c LIKE '%''queue'' = ''closed''%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 ด่านสิทธิ์ + ตัวกรองเดิมยังอยู่',
       CASE WHEN (SELECT c LIKE '%njacc_can(j.charge_type, j.company_group, ''view'')%'
                   AND c LIKE '%NJACC_BAD_GROUP%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_build_charge_set')
            THEN 'PASS' ELSE 'FAIL' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   ลบชื่อคอลัมน์ที่เพิ่มออกจาก projection แล้ว CREATE OR REPLACE ใหม่
--   หรือกู้จากนิยามเดิมที่เก็บไว้ก่อนรัน:
--     SELECT pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure);
--   (แนะนำให้ SELECT เก็บข้อความไว้ก่อนรันไฟล์นี้)
--   ฝั่งหน้าเว็บ: ถ้าไม่ rollback frontend ด้วย คอลัมน์ใหม่จะแสดง '-' ทุกแถว
--   แต่ตารางยังทำงานปกติ ไม่ error
