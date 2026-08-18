-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-02_document_number_verify.sql
-- อ่านอย่างเดียว 100% — ไม่มี INSERT/UPDATE/DELETE/DDL
-- รันเป็นไฟล์สุดท้าย:  RUN-01 -> RUN-03 -> RUN-02 (ไฟล์นี้)
-- ต้องได้ PASS ทุกบรรทัด
-- ═══════════════════════════════════════════════════════════════════════════
WITH d AS (
  SELECT p.proname, pg_get_functiondef(p.oid) AS c
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
)
SELECT 'V1  njacc_next_month_no มีจริง + รับ p_pad' AS check_item,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_next_month_no'
                            AND pg_get_function_identity_arguments(p.oid)
                                = 'text, text, date, integer')
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2  save_job ออกเลข SERVICE = JOB_MONTH/JOB pad 5',
       CASE WHEN (SELECT c LIKE '%''JOB_MONTH'', ''JOB'', v_base, 5%' FROM d WHERE proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3  save_job ออกเลข ADVANCE = AD_MONTH/AD pad 4',
       CASE WHEN (SELECT c LIKE '%''AD_MONTH'',  ''AD'',  v_base, 4%' FROM d WHERE proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4  save_job อิงวันที่เอกสาร (job_date -> reference_date -> current_date)',
       CASE WHEN (SELECT c LIKE '%coalesce((p->>''job_date'')::date, (p->>''reference_date'')::date, current_date)%'
                    FROM d WHERE proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5  save_job ออกเลขเฉพาะตอนสร้างใหม่ (v_new) — แก้ไขไม่เปลี่ยนเลข',
       CASE WHEN (SELECT c NOT LIKE '%job_no=%' FROM d WHERE proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6  counter แยกกันครบ 6 ชุด (ไม่แชร์ running number)',
       CASE WHEN (SELECT c LIKE '%''INVOICE_MONTH'', ''NJ''%'  FROM d WHERE proname='njacc_post_draft_invoice')
             AND (SELECT c LIKE '%''ADVANCE_MONTH'', ''ADV''%' FROM d WHERE proname='njacc_post_draft_invoice')
             AND (SELECT c LIKE '%''RECEIPT_MONTH'',''RCP''%'  FROM d WHERE proname='njacc_receive_payment')
             AND (SELECT c LIKE '%''CREDIT_NOTE_MONTH'', ''CN''%' FROM d WHERE proname='njacc_next_credit_note_no')
             AND (SELECT c LIKE '%''JOB_MONTH''%' AND c LIKE '%''AD_MONTH''%' FROM d WHERE proname='njacc_save_job')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7  ไม่แตะตัวออกเลขเดิม (njacc_next_doc_no / njacc_next_month_doc_no)',
       CASE WHEN (SELECT pg_get_function_identity_arguments(p.oid)='p_type text, p_scope text, p_prefix text'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_next_doc_no')
             AND (SELECT pg_get_function_identity_arguments(p.oid)='p_type text, p_prefix text, p_date date'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_next_month_doc_no')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8  SECURITY DEFINER + search_path ครบทุกตัวที่แก้',
       CASE WHEN (SELECT bool_and(p.prosecdef AND p.proconfig::text LIKE '%search_path%')
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_save_job','njacc_next_month_no'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V9  njacc_next_month_no ไม่เปิดให้ anon/authenticated เรียกตรง',
       CASE WHEN NOT has_function_privilege('authenticated',
              'public.njacc_next_month_no(text,text,date,integer)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V10 njacc_save_job ยังเรียกได้จาก authenticated',
       CASE WHEN has_function_privilege('authenticated','public.njacc_save_job(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11 UNIQUE กันเลขซ้ำครบทุกชุด (job/invoice/receipt/credit note)',
       CASE WHEN (SELECT count(*) FROM pg_constraint
                   WHERE conname IN ('njacc_jobs_no_uq','njacc_inv_no_uq','njacc_rc_no_uq')) = 3
             AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
                          AND indexdef ILIKE '%UNIQUE%credit_note_no%')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V12 ไม่เหลือเลขงานรูปแบบเก่า (JSxx / JAxx)',
       CASE WHEN (SELECT count(*) FROM public.njacc_jobs
                   WHERE job_no ~ '^J[SA][A-Z]{2}[0-9]{2}-[0-9]+$') = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V13 เลขงานทุกแถวตรง Format ใหม่',
       CASE WHEN (SELECT count(*) FROM public.njacc_jobs
                   WHERE job_no !~ '^JOB[0-9]{6}-[0-9]{5}$'
                     AND job_no !~ '^AD[0-9]{6}-[0-9]{4}$') = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V14 ไม่มีเลขงานซ้ำ',
       CASE WHEN (SELECT count(*) FROM (SELECT job_no FROM public.njacc_jobs
                    GROUP BY job_no HAVING count(*)>1) x) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V15 counter JOB_MONTH/AD_MONTH >= จำนวนเอกสารจริงของเดือนนั้น',
       CASE WHEN NOT EXISTS (
              SELECT 1
                FROM (SELECT CASE WHEN charge_type='ADVANCE' THEN 'AD_MONTH' ELSE 'JOB_MONTH' END AS dt,
                             substring(job_no from '[0-9]{6}') AS sk, count(*) AS n
                        FROM public.njacc_jobs
                       WHERE job_no ~ '^(JOB|AD)[0-9]{6}-' GROUP BY 1,2) a
                LEFT JOIN public.njacc_document_sequences s
                       ON s.doc_type=a.dt AND s.scope_key=a.sk
               WHERE coalesce(s.last_number,0) < a.n)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V16 INVOICE ที่ POST แล้วตรง Format NJ/ADV (DRAFT- ไม่นับ)',
       CASE WHEN (SELECT count(*) FROM public.njacc_invoices
                   WHERE invoice_no NOT LIKE 'DRAFT-%'
                     AND invoice_no !~ '^(NJ|ADV)[0-9]{6}-[0-9]{5}$') = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V17 RECEIPT ตรง Format RCP',
       CASE WHEN (SELECT count(*) FROM public.njacc_receipts
                   WHERE receipt_no !~ '^RCP[0-9]{6}-[0-9]{5}$') = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V18 CREDIT NOTE ตรง Format CN (CNDRAFT- ไม่นับ) + ไม่มี CD เก่า',
       CASE WHEN (SELECT count(*) FROM public.njacc_credit_notes
                   WHERE credit_note_no NOT LIKE 'CNDRAFT-%'
                     AND credit_note_no !~ '^CN[0-9]{6}-[0-9]{5}$') = 0
            THEN 'PASS' ELSE 'FAIL' END;

-- ── รายงานประกอบ (ดูด้วยตา ไม่ใช่เกณฑ์ PASS/FAIL) ────────────────────────
SELECT 'jobs' AS src, charge_type, job_no, job_date, reference_date
  FROM public.njacc_jobs ORDER BY job_no;

SELECT doc_type, scope_key, last_number
  FROM public.njacc_document_sequences ORDER BY 1,2;
