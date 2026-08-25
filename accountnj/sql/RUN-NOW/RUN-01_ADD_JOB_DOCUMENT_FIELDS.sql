-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql
-- เพิ่มฟิลด์เอกสารงาน (DOCUMENT) ที่ยังไม่มีในฐานข้อมูล + RPC สำหรับบันทึก
--
-- ═══ ตรวจก่อนเขียนไฟล์นี้ (read-only query จริง) ══════════════════════════
--   SELECT attname FROM pg_attribute ... WHERE relname='njacc_jobs'
--     AND attname ~ 'lift|wharf|storage|overtime|ot_|truck|card|exempt|inspect|fcl|lcl|fz|cargo'
--   -> ผลลัพธ์ = [] (ว่าง)  จึงยืนยันว่า "ยังไม่มี field เดิมรองรับ"
--   คอลัมน์ทั้งหมดของ njacc_jobs ปัจจุบัน 39 คอลัมน์ ไม่มีตัวใดใช้แทนได้
--   *** ไม่สร้าง field ซ้ำ ***
--
-- ═══ ทำไม "ไม่แตะ" njacc_save_job ═════════════════════════════════════════
--   1) njacc_save_job เป็นที่ออกเลขงาน (job_no/open_no) — ห้ามเปลี่ยน Logic เลขงาน
--   2) มี Migration อีกชุดที่ค้างอยู่ (RUN-01_document_number_migration.sql)
--      ซึ่ง CREATE OR REPLACE njacc_save_job เหมือนกัน
--      ถ้าไฟล์นี้ไปแทนที่ด้วย จะเกิดปัญหา "ไฟล์ไหนรันทีหลังทับไฟล์ก่อนหน้า"
--   => จึงแยกเป็น RPC ใหม่ njacc_save_job_doc_fields ที่ UPDATE เฉพาะคอลัมน์ใหม่
--      -> ไม่มีทางชนกัน ไม่ว่าจะรันไฟล์ไหนก่อน-หลัง
--      -> njacc_save_job / เลขงาน / คอลัมน์เดิมทั้งหมด ไม่ถูกแตะเลย
--   ฝั่งอ่าน: njacc_job_detail ใช้ to_jsonb(j) อยู่แล้ว -> คอลัมน์ใหม่กลับมาเอง ไม่ต้องแก้
--
-- ═══ ลำดับการรัน ══════════════════════════════════════════════════════════
--   รันไฟล์นี้ "ก่อน Deploy HTML"  (หน้าเว็บใหม่จะเรียก njacc_save_job_doc_fields)
--   ถ้า Deploy HTML ก่อนแล้วยังไม่รัน SQL: การบันทึกงานยังสำเร็จตามปกติ
--   แต่ฟิลด์ใหม่จะไม่ถูกบันทึก และมี toast เตือน (frontend จับ error ไว้แล้ว)
--   ไม่เกี่ยวกับลำดับของ RUN-01_document_number_migration.sql (คนละเรื่อง รันเมื่อไหร่ก็ได้)
--
--   ไม่มี DROP / DELETE / TRUNCATE / UPDATE ข้อมูลเดิม — เพิ่มคอลัมน์อย่างเดียว
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. PREFLIGHT ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname='public' AND c.relname='njacc_jobs') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบตาราง njacc_jobs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_can') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_can (ด่านสิทธิ์)';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $$;

-- ── 2. คอลัมน์ใหม่ (ADD COLUMN IF NOT EXISTS = รันซ้ำได้ ปลอดภัย) ─────────
--   boolean ปล่อยเป็น NULL ได้ (NULL = ยังไม่เคยกรอก · false = ติ๊กออก)
--   ไม่ใส่ DEFAULT เพื่อไม่ให้ต้อง rewrite ตารางและไม่เปลี่ยนความหมายของงานเดิม
ALTER TABLE public.njacc_jobs
  ADD COLUMN IF NOT EXISTS lift_on_wharf_flag   boolean,   -- ติ๊ก "ออกใบเสร็จค่า LIFT ON/WHARF ตาม"
  ADD COLUMN IF NOT EXISTS lift_on_wharf_note   text,      -- ข้อความต่อท้าย
  ADD COLUMN IF NOT EXISTS storage_charge_flag  boolean,   -- ติ๊ก "ออกใบเสร็จค่า STORAGE CHARGE ตาม"
  ADD COLUMN IF NOT EXISTS storage_charge_note  text,      -- ข้อความต่อท้าย
  ADD COLUMN IF NOT EXISTS overtime_flag        boolean,   -- ติ๊ก "ขอล่วงเวลาวันที่"
  ADD COLUMN IF NOT EXISTS overtime_date        date,      -- วันที่ขอล่วงเวลา
  ADD COLUMN IF NOT EXISTS overtime_slot_1      boolean,   -- ช่วง 08.30-16.30
  ADD COLUMN IF NOT EXISTS overtime_slot_2      boolean,   -- ช่วง 16.30-24.00
  ADD COLUMN IF NOT EXISTS overtime_slot_3      boolean,   -- ช่วง 24.00-08.00
  ADD COLUMN IF NOT EXISTS truck_card_flag      boolean,   -- ติ๊ก "ให้การ์ดหัวลาก"
  ADD COLUMN IF NOT EXISTS truck_card_no        text,      -- ข้อมูลการ์ดหัวลาก
  ADD COLUMN IF NOT EXISTS truck_card_contact   text,      -- เบอร์และชื่อโทร
  ADD COLUMN IF NOT EXISTS doc_exempt           boolean,   -- ยกเว้น
  ADD COLUMN IF NOT EXISTS doc_inspect          boolean,   -- เปิดตรวจ
  ADD COLUMN IF NOT EXISTS cargo_fcl            boolean,   -- FCL
  ADD COLUMN IF NOT EXISTS cargo_lcl            boolean,   -- LCL
  ADD COLUMN IF NOT EXISTS cargo_fz             boolean,   -- FZ
  ADD COLUMN IF NOT EXISTS cargo_fz_fz          boolean;   -- FZ+FZ

COMMENT ON COLUMN public.njacc_jobs.lift_on_wharf_note IS
  'DOCUMENT > เปิดงาน — ออกใบเสร็จค่า LIFT ON/WHARF ตาม (ใช้ใน Job Form A4)';
COMMENT ON COLUMN public.njacc_jobs.overtime_date IS
  'DOCUMENT > เปิดงาน — ขอล่วงเวลาวันที่ (ใช้ใน Job Form A4)';

-- ── 3. RPC บันทึกเฉพาะฟิลด์ใหม่ ───────────────────────────────────────────
--   ใช้ด่านสิทธิ์ชุดเดิม njacc_req_profile() + njacc_can(charge, group, 'edit')
--   อ่าน charge_type / company_group จากแถวจริง ไม่เชื่อค่าที่ client ส่งมา
--   งานที่ถูกยกเลิกแล้วแก้ไม่ได้ (เงื่อนไขเดียวกับ njacc_save_job)
CREATE OR REPLACE FUNCTION public.njacc_save_job_doc_fields(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_id uuid; j public.njacc_jobs;
BEGIN
  pr := public.njacc_req_profile();
  v_id := nullif(p->>'id','')::uuid;
  IF v_id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_ID_REQUIRED'; END IF;

  SELECT * INTO j FROM public.njacc_jobs WHERE id = v_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type, j.company_group, 'edit') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN';
  END IF;
  IF j.operational_status = 'CANCELED' THEN RAISE EXCEPTION 'NJACC_JOB_CANCELED'; END IF;

  /* เขียนเฉพาะคีย์ที่ client ส่งมาจริง (p ? 'key')
     -> ผู้เรียกที่ไม่รู้จักฟิลด์ใหม่ จะไม่ทำให้ค่าเดิมหาย */
  UPDATE public.njacc_jobs SET
    lift_on_wharf_flag  = CASE WHEN p ? 'lift_on_wharf_flag'  THEN (p->>'lift_on_wharf_flag')::boolean  ELSE lift_on_wharf_flag  END,
    lift_on_wharf_note  = CASE WHEN p ? 'lift_on_wharf_note'  THEN p->>'lift_on_wharf_note'             ELSE lift_on_wharf_note  END,
    storage_charge_flag = CASE WHEN p ? 'storage_charge_flag' THEN (p->>'storage_charge_flag')::boolean ELSE storage_charge_flag END,
    storage_charge_note = CASE WHEN p ? 'storage_charge_note' THEN p->>'storage_charge_note'            ELSE storage_charge_note END,
    overtime_flag       = CASE WHEN p ? 'overtime_flag'       THEN (p->>'overtime_flag')::boolean       ELSE overtime_flag       END,
    overtime_date       = CASE WHEN p ? 'overtime_date'       THEN nullif(p->>'overtime_date','')::date ELSE overtime_date       END,
    overtime_slot_1     = CASE WHEN p ? 'overtime_slot_1'     THEN (p->>'overtime_slot_1')::boolean     ELSE overtime_slot_1     END,
    overtime_slot_2     = CASE WHEN p ? 'overtime_slot_2'     THEN (p->>'overtime_slot_2')::boolean     ELSE overtime_slot_2     END,
    overtime_slot_3     = CASE WHEN p ? 'overtime_slot_3'     THEN (p->>'overtime_slot_3')::boolean     ELSE overtime_slot_3     END,
    truck_card_flag     = CASE WHEN p ? 'truck_card_flag'     THEN (p->>'truck_card_flag')::boolean     ELSE truck_card_flag     END,
    truck_card_no       = CASE WHEN p ? 'truck_card_no'       THEN p->>'truck_card_no'                  ELSE truck_card_no       END,
    truck_card_contact  = CASE WHEN p ? 'truck_card_contact'  THEN p->>'truck_card_contact'             ELSE truck_card_contact  END,
    doc_exempt          = CASE WHEN p ? 'doc_exempt'          THEN (p->>'doc_exempt')::boolean          ELSE doc_exempt          END,
    doc_inspect         = CASE WHEN p ? 'doc_inspect'         THEN (p->>'doc_inspect')::boolean         ELSE doc_inspect         END,
    cargo_fcl           = CASE WHEN p ? 'cargo_fcl'           THEN (p->>'cargo_fcl')::boolean           ELSE cargo_fcl           END,
    cargo_lcl           = CASE WHEN p ? 'cargo_lcl'           THEN (p->>'cargo_lcl')::boolean           ELSE cargo_lcl           END,
    cargo_fz            = CASE WHEN p ? 'cargo_fz'            THEN (p->>'cargo_fz')::boolean            ELSE cargo_fz            END,
    cargo_fz_fz         = CASE WHEN p ? 'cargo_fz_fz'         THEN (p->>'cargo_fz_fz')::boolean         ELSE cargo_fz_fz         END,
    updated_by = pr.id
  WHERE id = v_id;

  PERFORM public.njacc_audit(pr.id, 'EDIT_JOB_DOC_FIELDS', 'job', v_id::text, NULL);
  RETURN jsonb_build_object('id', v_id);
END $fn$;

GRANT EXECUTE ON FUNCTION public.njacc_save_job_doc_fields(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_job_doc_fields(jsonb) FROM PUBLIC, anon;

-- ── 4. VERIFY (อ่านอย่างเดียว) ────────────────────────────────────────────
SELECT 'V1 คอลัมน์ใหม่ครบ 18 ตัว' AS check_item,
       CASE WHEN (SELECT count(*) FROM pg_attribute a
                    JOIN pg_class c ON c.oid=a.attrelid
                    JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname='public' AND c.relname='njacc_jobs' AND a.attnum>0
                     AND NOT a.attisdropped
                     AND a.attname IN ('lift_on_wharf_flag','lift_on_wharf_note',
                       'storage_charge_flag','storage_charge_note','overtime_flag','overtime_date',
                       'overtime_slot_1','overtime_slot_2','overtime_slot_3','truck_card_flag',
                       'truck_card_no','truck_card_contact','doc_exempt','doc_inspect',
                       'cargo_fcl','cargo_lcl','cargo_fz','cargo_fz_fz')) = 18
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 njacc_save_job_doc_fields มีจริง + SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_job_doc_fields')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 authenticated เรียกได้ · anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_save_job_doc_fields(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_save_job_doc_fields(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 *** njacc_save_job ไม่ถูกแตะ *** (ยังออกเลขงานด้วย njacc_next_doc_no เดิม)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%njacc_next_doc_no(''JOB''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_job')
            THEN 'PASS' ELSE 'ตรวจเอง — อาจรัน RUN-01_document_number_migration ไปแล้ว' END
UNION ALL
SELECT 'V5 njacc_job_detail คืนคอลัมน์ใหม่อัตโนมัติ (ใช้ to_jsonb)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) ILIKE '%to_jsonb(j)%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_job_detail')
            THEN 'PASS' ELSE 'FAIL' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   DROP FUNCTION IF EXISTS public.njacc_save_job_doc_fields(jsonb);
--   คอลัมน์ที่เพิ่ม: ปล่อยไว้ได้ (ไม่มีผลกับโค้ดเดิม) หรือถ้าต้องลบจริง
--   ต้องแน่ใจว่าไม่มีข้อมูลค้างก่อน:
--   ALTER TABLE public.njacc_jobs
--     DROP COLUMN IF EXISTS lift_on_wharf_flag, DROP COLUMN IF EXISTS lift_on_wharf_note,
--     ... (ทีละคอลัมน์ตามรายการด้านบน)
