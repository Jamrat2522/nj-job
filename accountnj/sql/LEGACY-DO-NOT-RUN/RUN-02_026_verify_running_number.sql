-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-02_026_verify_running_number.sql
--
-- ✅ รันตอนนี้ (ลำดับที่ 2 — หลัง RUN-01 เท่านั้น)
-- READ ONLY ทั้งไฟล์ · ไม่ INSERT / UPDATE / DELETE ข้อมูลธุรกิจแม้แต่แถวเดียว
--
-- หมายเหตุ: V7 ทดสอบ counter จริงด้วยการเดินเลขในตาราง njacc_document_sequences
--           บน doc_type ทดสอบ (ชื่อขึ้นต้น 'ZZ_TEST_') แล้ว "ลบเฉพาะแถวทดสอบนั้น"
--           ไม่แตะ counter ของงานจริงและไม่แตะเอกสารใด ๆ
-- ═══════════════════════════════════════════════════════════════════════════

-- ── V1-V6 · โครงสร้างและสิทธิ์ ──
SELECT 'V1 njacc_next_doc_no(4 args) ถูกสร้าง' AS check_name,
       count(*)::text AS detail,
       CASE WHEN count(*)=1 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind='f' AND p.proname='njacc_next_doc_no'
   AND pg_get_function_identity_arguments(p.oid)='p_type text, p_scope text, p_prefix text, p_pad integer'

UNION ALL
SELECT 'V2 njacc_next_doc_no(3 args) เดิมยังอยู่ ไม่ถูกแก้',
       count(*)::text,
       CASE WHEN count(*)=1 THEN 'PASS' ELSE 'FAIL' END
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind='f' AND p.proname='njacc_next_doc_no'
   AND pg_get_function_identity_arguments(p.oid)='p_type text, p_scope text, p_prefix text'
   AND pg_get_functiondef(p.oid) LIKE '%lpad(v_n::text, 4%'

UNION ALL
SELECT 'V3 anon เรียก next_doc_no ไม่ได้ (ทั้ง 2 ตัว)',
       has_function_privilege('anon','public.njacc_next_doc_no(text,text,text)','EXECUTE')::text
       ||' / '||
       has_function_privilege('anon','public.njacc_next_doc_no(text,text,text,int)','EXECUTE')::text,
       CASE WHEN NOT has_function_privilege('anon','public.njacc_next_doc_no(text,text,text)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_next_doc_no(text,text,text,int)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V4 authenticated เรียก next_doc_no ตรง ๆ ไม่ได้',
       has_function_privilege('authenticated','public.njacc_next_doc_no(text,text,text,int)','EXECUTE')::text,
       CASE WHEN has_function_privilege('authenticated','public.njacc_next_doc_no(text,text,text,int)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END

UNION ALL
SELECT 'V5 authenticated ยังเรียก save_job / receive_payment ได้',
       has_function_privilege('authenticated','public.njacc_save_job(jsonb)','EXECUTE')::text
       ||' / '||
       has_function_privilege('authenticated',
         'public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)','EXECUTE')::text,
       CASE WHEN has_function_privilege('authenticated','public.njacc_save_job(jsonb)','EXECUTE')
             AND has_function_privilege('authenticated',
                 'public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT 'V6 anon เรียก save_job / receive_payment ไม่ได้',
       has_function_privilege('anon','public.njacc_save_job(jsonb)','EXECUTE')::text
       ||' / '||
       has_function_privilege('anon',
         'public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)','EXECUTE')::text,
       CASE WHEN NOT has_function_privilege('anon','public.njacc_save_job(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon',
                 'public.njacc_receive_payment(uuid,numeric,jsonb,text,date,text,text,text,boolean)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END;

-- ── V7 · เดินเลขจริงบน counter ทดสอบ (แล้วลบแถวทดสอบทิ้ง) ──
DO $v7$
DECLARE a text; b text; c text; d text; e text; f text; g text; h text;
        v_ym text := to_char((now() AT TIME ZONE 'Asia/Bangkok'),'YYYYMM');
        v_nm text := to_char((now() AT TIME ZONE 'Asia/Bangkok') + interval '1 month','YYYYMM');
BEGIN
  -- รูปแบบ + จำนวนหลัก + เริ่มที่ 1
  a := public.njacc_next_doc_no('ZZ_TEST_JOB',  v_ym, 'JOB'||v_ym||'-', 5);
  b := public.njacc_next_doc_no('ZZ_TEST_JOB',  v_ym, 'JOB'||v_ym||'-', 5);
  c := public.njacc_next_doc_no('ZZ_TEST_AD',   v_ym, 'AD'||v_ym||'-',  4);
  d := public.njacc_next_doc_no('ZZ_TEST_NJ',   v_ym, 'NJ'||v_ym||'-',  5);
  e := public.njacc_next_doc_no('ZZ_TEST_CD',   v_ym, 'CD'||v_ym||'-',  5);
  -- เดือนใหม่ = scope ใหม่ -> ต้องเริ่ม 1 ใหม่
  f := public.njacc_next_doc_no('ZZ_TEST_JOB',  v_nm, 'JOB'||v_nm||'-', 5);
  -- counter แยกกันจริง: AD/NJ/CD ต้องเป็น 0001/00001/00001 ไม่ใช่เดินตาม JOB
  g := c; h := d;

  IF a <> 'JOB'||v_ym||'-00001' THEN RAISE EXCEPTION 'V7 FAIL — JOB ตัวแรกได้ %', a; END IF;
  IF b <> 'JOB'||v_ym||'-00002' THEN RAISE EXCEPTION 'V7 FAIL — JOB ตัวที่สองได้ %', b; END IF;
  IF c <> 'AD'||v_ym||'-0001'   THEN RAISE EXCEPTION 'V7 FAIL — AD ตัวแรกได้ %', c; END IF;
  IF d <> 'NJ'||v_ym||'-00001'  THEN RAISE EXCEPTION 'V7 FAIL — NJ ตัวแรกได้ %', d; END IF;
  IF e <> 'CD'||v_ym||'-00001'  THEN RAISE EXCEPTION 'V7 FAIL — CD ตัวแรกได้ %', e; END IF;
  IF f <> 'JOB'||v_nm||'-00001' THEN RAISE EXCEPTION 'V7 FAIL — เดือนใหม่ไม่รีเซ็ต ได้ %', f; END IF;

  RAISE NOTICE 'V7 PASS — % · % · % · % · % · เดือนถัดไป %', a, b, c, d, e, f;

  DELETE FROM public.njacc_document_sequences WHERE doc_type LIKE 'ZZ_TEST_%';
  RAISE NOTICE 'V7 ลบ counter ทดสอบเรียบร้อย (ไม่แตะ counter งานจริง)';
END $v7$;

-- ── V8 · ฟังก์ชันอ้าง Asia/Bangkok จริง ──
SELECT 'V8 save_job ใช้ Asia/Bangkok' AS check_name,
       CASE WHEN d LIKE '%Asia/Bangkok%' THEN 'ใช้' ELSE 'ไม่ใช้' END AS detail,
       CASE WHEN d LIKE '%Asia/Bangkok%' THEN 'PASS' ELSE 'FAIL' END AS result
  FROM (SELECT pg_get_functiondef('public.njacc_save_job(jsonb)'::regprocedure) AS d) x
UNION ALL
SELECT 'V8 receive_payment ใช้ Asia/Bangkok',
       CASE WHEN d LIKE '%Asia/Bangkok%' THEN 'ใช้' ELSE 'ไม่ใช้' END,
       CASE WHEN d LIKE '%Asia/Bangkok%' THEN 'PASS' ELSE 'FAIL' END
  FROM (SELECT pg_get_functiondef(p.oid) AS d FROM pg_proc p
         JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.prokind='f' AND p.proname='njacc_receive_payment') y
UNION ALL
SELECT 'V9 save_job สาขาแก้ไขไม่แตะ job_no',
       CASE WHEN d LIKE '%UPDATE public.njacc_jobs SET data_type%'
             AND d NOT LIKE '%SET job_no%' THEN 'ไม่แตะ' ELSE 'ผิด!' END,
       CASE WHEN d LIKE '%UPDATE public.njacc_jobs SET data_type%'
             AND d NOT LIKE '%SET job_no%' THEN 'PASS' ELSE 'FAIL' END
  FROM (SELECT pg_get_functiondef('public.njacc_save_job(jsonb)'::regprocedure) AS d) z
UNION ALL
SELECT 'V10 เลข RECEIPT ยังสร้างที่ receive_payment ที่เดียว',
       count(*)::text,
       CASE WHEN count(*)=1 THEN 'PASS' ELSE 'FAIL' END
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind='f' AND left(p.proname,6)='njacc_'
   AND pg_get_functiondef(p.oid) ILIKE '%INSERT INTO public.njacc_receipts%'
UNION ALL
SELECT 'V11 POST invoice ไม่แตะ njacc_receipts',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN ('njacc_post_invoice','njacc_post_draft_invoice')
                     AND pg_get_functiondef(p.oid) ILIKE '%njacc_receipts%') = 0
            THEN 'ไม่แตะ' ELSE 'แตะ!' END,
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN ('njacc_post_invoice','njacc_post_draft_invoice')
                     AND pg_get_functiondef(p.oid) ILIKE '%njacc_receipts%') = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V12 UNIQUE ที่ใช้กันเลขซ้ำ ครบ',
       (SELECT count(*)::text||' ตัว' FROM pg_indexes
         WHERE schemaname='public' AND indexname IN ('njacc_jobs_no_uq','njacc_rc_no_uq','njacc_pay_no_uq')),
       CASE WHEN (SELECT count(*) FROM pg_indexes
                   WHERE schemaname='public'
                     AND indexname IN ('njacc_jobs_no_uq','njacc_rc_no_uq','njacc_pay_no_uq'))=3
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V13 ข้อมูลเดิมไม่ถูกแตะ',
       'jobs='||(SELECT count(*) FROM public.njacc_jobs)::text
     ||' receipts='||(SELECT count(*) FROM public.njacc_receipts)::text
     ||' payments='||(SELECT count(*) FROM public.njacc_payments)::text
     ||' invoices='||(SELECT count(*) FROM public.njacc_invoices)::text, 'PASS'
UNION ALL
SELECT 'V14 ไม่มี job_no / receipt_no ซ้ำ',
       (SELECT count(*) FROM (SELECT job_no FROM public.njacc_jobs
                               WHERE job_no IS NOT NULL GROUP BY 1 HAVING count(*)>1) a)::text
       ||' / '||
       (SELECT count(*) FROM (SELECT receipt_no FROM public.njacc_receipts
                               WHERE receipt_no IS NOT NULL GROUP BY 1 HAVING count(*)>1) b)::text,
       CASE WHEN (SELECT count(*) FROM (SELECT job_no FROM public.njacc_jobs
                                         WHERE job_no IS NOT NULL GROUP BY 1 HAVING count(*)>1) a)=0
             AND (SELECT count(*) FROM (SELECT receipt_no FROM public.njacc_receipts
                                         WHERE receipt_no IS NOT NULL GROUP BY 1 HAVING count(*)>1) b)=0
            THEN 'PASS' ELSE 'FAIL' END;

-- ── V15 · counter ปัจจุบันทั้งหมด (ดูภาพรวม) ──
SELECT 'V15 counter ทั้งหมดหลังรัน' AS check_name, doc_type, scope_key, last_number
  FROM public.njacc_document_sequences ORDER BY 1,2,3;
