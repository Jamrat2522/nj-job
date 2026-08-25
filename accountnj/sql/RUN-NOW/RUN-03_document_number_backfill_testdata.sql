-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-03_document_number_backfill_testdata.sql
-- ปรับเลขงานรูปแบบเก่า -> รูปแบบใหม่ (เฉพาะข้อมูลทดสอบ)
-- รันหลัง RUN-01 · รัน RUN-02 เพื่อ verify หลังจากนี้
--
-- ═══ ข้อมูลจริงที่สำรวจได้ก่อนเขียนไฟล์นี้ (read-only query) ═══════════════
--   njacc_jobs                 2 แถว
--     JSNJ26-0001  SERVICE/NJ  reference_date 2026-08-15  job_date NULL  CLOSE  มี invoice
--     JSNJ26-0002  SERVICE/NJ  reference_date 2026-08-18  job_date NULL  CLOSE  ไม่มี invoice
--   njacc_jobs รูปแบบใหม่แล้ว   0 แถว
--   ADVANCE (JAxx)             0 แถว
--   njacc_invoices             1 แถว (DRAFT-xxxx เท่านั้น · ยังไม่มี NJ/ADV จริง)
--   njacc_receipts             0 แถว
--   njacc_credit_notes         0 แถว   (ไม่มี CD เก่าหลงเหลือ)
--   njacc_document_sequences   JOB / SERVICE-NJ-2026 = 2 · JOB_OPEN / SERVICE-NJ-2026 = 2
--   => ต้อง backfill เฉพาะ njacc_jobs 2 แถว · ตารางอื่นไม่ต้องแตะ
--
-- ═══ ความปลอดภัย ══════════════════════════════════════════════════════════
--   · job_no ไม่ถูกอ้างเป็น FK จากตารางใด (njacc_invoices ผูกด้วย job_id uuid)
--     คอลัมน์ job_no ในตารางอื่น (advance_jobs / do_exchanges / njhr_* / ...)
--     เป็นของคนละแอป ไม่ได้อ้าง njacc_jobs
--   · สำรองก่อนแก้ทุกครั้ง -> ตาราง njacc_jobs_no_backup_<timestamp>
--   · จับคู่เลขใหม่แบบกำหนดได้ (ORDER BY เดิม) ไม่สุ่ม
--   · ถ้าเลขปลายทางชนของเดิม -> RAISE EXCEPTION ยกเลิกทั้งชุด
--   · ไม่แตะ open_no · ไม่แตะ invoice / receipt / credit note
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_backup text := 'njacc_jobs_no_backup_' || to_char(now(),'YYYYMMDD_HH24MISS');
  v_old    int;
  v_dup    int;
  r        record;
  v_new    text;
  v_seq    record;
BEGIN
  -- 1) มีของเก่าให้แปลงไหม
  SELECT count(*) INTO v_old FROM public.njacc_jobs
   WHERE job_no ~ '^J[SA][A-Z]{2}[0-9]{2}-[0-9]+$';
  RAISE NOTICE 'พบเลขงานรูปแบบเก่า % แถว', v_old;
  IF v_old = 0 THEN
    RAISE NOTICE 'ไม่มีอะไรต้องแปลง — จบการทำงาน';
    RETURN;
  END IF;

  -- 2) สำรองก่อน (เก็บ id + เลขเก่า + วันที่ ไว้ย้อนกลับได้)
  EXECUTE format(
    'CREATE TABLE public.%I AS SELECT id, job_no AS old_job_no, open_no, charge_type,
       company_group, job_date, reference_date, created_at, now() AS backed_up_at
       FROM public.njacc_jobs WHERE job_no ~ ''^J[SA][A-Z]{2}[0-9]{2}-[0-9]+$''', v_backup);
  RAISE NOTICE 'สำรองแล้วที่ตาราง public.% ', v_backup;

  -- 3) สร้าง mapping ลงตารางชั่วคราวจริง (ไม่ใช้ TEMP — runner แยก session ต่อ ;)
  CREATE TABLE IF NOT EXISTS public.njacc_jobno_map_tmp(
    id uuid PRIMARY KEY, old_no text, new_no text, scope text);
  DELETE FROM public.njacc_jobno_map_tmp;

  FOR r IN
    SELECT id, job_no, charge_type,
           to_char(coalesce(job_date, reference_date, created_at::date),'YYYYMM') AS scope,
           row_number() OVER (
             PARTITION BY charge_type,
                          to_char(coalesce(job_date, reference_date, created_at::date),'YYYYMM')
             ORDER BY created_at, job_no) AS rn
      FROM public.njacc_jobs
     WHERE job_no ~ '^J[SA][A-Z]{2}[0-9]{2}-[0-9]+$'
     ORDER BY created_at, job_no
  LOOP
    v_new := CASE WHEN r.charge_type = 'ADVANCE'
                  THEN 'AD'  || r.scope || '-' || lpad(r.rn::text, 4, '0')
                  ELSE 'JOB' || r.scope || '-' || lpad(r.rn::text, 5, '0') END;
    INSERT INTO public.njacc_jobno_map_tmp(id, old_no, new_no, scope)
    VALUES (r.id, r.job_no, v_new, r.scope);
  END LOOP;

  -- 4) กันชน: เลขใหม่ต้องไม่ซ้ำกันเอง และต้องไม่ชนแถวที่ไม่ได้อยู่ใน mapping
  SELECT count(*) INTO v_dup FROM (
    SELECT new_no FROM public.njacc_jobno_map_tmp GROUP BY new_no HAVING count(*) > 1) x;
  IF v_dup > 0 THEN RAISE EXCEPTION 'ABORT — เลขใหม่ซ้ำกันเอง % ชุด', v_dup; END IF;

  SELECT count(*) INTO v_dup
    FROM public.njacc_jobs j JOIN public.njacc_jobno_map_tmp m ON m.new_no = j.job_no
   WHERE j.id <> m.id;
  IF v_dup > 0 THEN RAISE EXCEPTION 'ABORT — เลขใหม่ชนกับงานที่มีอยู่แล้ว % แถว', v_dup; END IF;

  -- 5) อัปเดตจริง (เฉพาะคอลัมน์ job_no)
  UPDATE public.njacc_jobs j
     SET job_no = m.new_no
    FROM public.njacc_jobno_map_tmp m
   WHERE j.id = m.id;
  RAISE NOTICE 'อัปเดต job_no แล้ว % แถว', v_old;

  -- 6) ตั้ง counter ให้ต่อจากเลขล่าสุดของแต่ละเดือน (ไม่ให้เลขถัดไปชน)
  FOR v_seq IN
    SELECT CASE WHEN j.charge_type='ADVANCE' THEN 'AD_MONTH' ELSE 'JOB_MONTH' END AS doc_type,
           m.scope AS scope_key, count(*)::bigint AS n
      FROM public.njacc_jobno_map_tmp m JOIN public.njacc_jobs j ON j.id = m.id
     GROUP BY 1,2
  LOOP
    INSERT INTO public.njacc_document_sequences(doc_type, scope_key, last_number)
    VALUES (v_seq.doc_type, v_seq.scope_key, v_seq.n)
    ON CONFLICT (doc_type, scope_key) DO UPDATE
      SET last_number = GREATEST(public.njacc_document_sequences.last_number, EXCLUDED.last_number);
    RAISE NOTICE 'counter % / % = %', v_seq.doc_type, v_seq.scope_key, v_seq.n;
  END LOOP;

  DROP TABLE public.njacc_jobno_map_tmp;
  RAISE NOTICE 'BACKFILL DONE — ตารางสำรอง: public.%', v_backup;
END $$;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
-- แทนที่ <backup> ด้วยชื่อตารางสำรองที่ NOTICE แจ้งไว้ แล้วรัน:
--   UPDATE public.njacc_jobs j SET job_no = b.old_job_no
--     FROM public.<backup> b WHERE b.id = j.id;
--   DELETE FROM public.njacc_document_sequences
--    WHERE doc_type IN ('JOB_MONTH','AD_MONTH');
-- (ตารางสำรองเก็บไว้ได้ ไม่ต้องลบ — ไม่มีอะไรอ่านมัน)
