-- ═══════════════════════════════════════════════════════════════════════════
-- RUN_1_INVOICE.sql       ★ ฟอร์ม: INVOICE / ใบแจ้งหนี้
-- ═══════════════════════════════════════════════════════════════════════════
-- รันไฟล์นี้ไฟล์เดียวจบ (มี PREFLIGHT + MIGRATION + VERIFY ในตัว)
-- ความเสี่ยง : ต่ำมาก — READ PATH ล้วน
--              ไม่มี ALTER TABLE / INSERT / UPDATE / DELETE / DROP / TRUNCATE
--              เพิ่มเฉพาะ "คีย์ใน jsonb ที่ RPC คืนกลับ" คีย์เดิมอยู่ครบทุกตัว
-- รันซ้ำได้  : ได้ ไม่จำกัดครั้ง
-- ลำดับ      : รันก่อน/หลังไฟล์อื่นก็ได้ ไม่ผูกกัน
--
-- ── ได้อะไร ────────────────────────────────────────────────────────────────
--   ช่องบนเอกสาร INVOICE ที่ตอนนี้ขึ้น "-" จะมีค่าจริง:
--     Decl No. · Master B/L · House B/L · Branch · Customer Tel. ·
--     REMARKS · Created By · Company Invoice
--   มีผลทั้งใบที่ POST แล้ว (njacc_invoice_view)
--   และหน้าต่างร่าง/ออกวางบิล (njacc_invoice_draft_view)
--
-- ⚠️ หมายเหตุสำคัญ — ใช้ RPC ร่วมกับ "ทดรองจ่าย"
--   njacc_invoice_view เป็น RPC ตัวเดียวกับที่หน้า FINANCE > Advance ใช้
--   รันไฟล์นี้แล้ว ฟอร์มทดรองจ่ายจะได้ฟิลด์ครบไปด้วยโดยอัตโนมัติ
--   -> ถ้ารันไฟล์นี้แล้ว RUN_4_ADVANCE.sql จะไม่มีอะไรเปลี่ยนเพิ่ม (รันได้ ไม่พัง)
--
-- ── สิ่งที่ไม่แตะ ───────────────────────────────────────────────────────────
--   ตาราง · คอลัมน์ · index · RLS · policy · trigger · sequence
--   Invoice Number Logic · VAT/WHT Calculation · POST/UNPOST · Draft Save
--   Customer/Service Master · Permission · Role · Auth
--   RPC อื่นทุกตัวของระบบ
--
-- ROLLBACK : รัน block CREATE OR REPLACE ของ 2 ฟังก์ชันนี้จากไฟล์เดิม
--            njacc_invoice_view       -> sql/005_njacc_rpc.sql
--            njacc_invoice_draft_view -> sql/dev/022_njacc_invoice_draft_workflow.sql
--            เอกสารกลับไปแสดง "-" ในช่องที่เพิ่ม · ไม่มีข้อมูลเสียหาย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ไม่เปลี่ยนอะไร)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_view') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_view'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_draft_view') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_draft_view (ต้องรัน 022 ก่อน)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers' AND column_name='phone') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.phone'; END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_jobs'
         AND column_name IN ('customs_declaration_no','master_bl_no','house_bl_no','note')) <> 4 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — คอลัมน์อ้างอิงใน njacc_jobs ไม่ครบ'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_invoices' AND column_name='draft_saved_by') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoices.draft_saved_by (ต้องรัน 022 ก่อน)'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS — พร้อมเพิ่มฟิลด์เอกสาร INVOICE (read path เท่านั้น)';
END $preflight$;

SELECT 'P1 ข้อมูลก่อนแก้' AS check_name,
       (SELECT count(*) FROM public.njacc_invoices)      AS invoices,
       (SELECT count(*) FROM public.njacc_invoice_items) AS items,
       (SELECT count(*) FROM public.njacc_jobs)          AS jobs;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · njacc_invoice_view (ใช้ร่วมกับ ทดรองจ่าย — ดูหมายเหตุด้านบน)
-- ═══ BLOCK ที่ใช้ร่วมกันระหว่าง RUN_1_INVOICE.sql และ RUN_4_ADVANCE.sql ═══
--   njacc_invoice_view คือ RPC "ตัวเดียวกัน" ที่ทั้ง 2 เอกสารอ่าน
--     INVOICE      : assets/js/invoices/invoice-view.js  -> api.invoiceView()
--     ADVANCE      : assets/js/charges/charge-page.js act='apdoc' -> api.invoiceView()
--   BLOCK นี้ใน 2 ไฟล์ "เหมือนกันทุกตัวอักษร" -> รันไฟล์ไหนก่อนก็ได้
--   รันซ้ำได้ไม่จำกัด (CREATE OR REPLACE ด้วยเนื้อเดียวกัน = ผลลัพธ์เดิม)
CREATE OR REPLACE FUNCTION public.njacc_invoice_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  SELECT to_jsonb(i) || jsonb_build_object(
    'customer', (SELECT jsonb_build_object('name',customer_name,'tax_id',tax_id,
       'address',address,'branch_code',branch_code,
       'phone',phone)                                   /* ← เพิ่ม: Tel. บนเอกสาร */
       FROM public.njacc_customers WHERE id=i.customer_id),
    'job', (SELECT jsonb_build_object('job_no',job_no,'customer_job_no',customer_job_no,
       'house_bl_no',house_bl_no,'source_invoice_no',source_invoice_no,
       'customs_declaration_no',customs_declaration_no,  /* ← เพิ่ม: Decl No. */
       'master_bl_no',master_bl_no,                      /* ← เพิ่ม: Master */
       'note',note)                                      /* ← เพิ่ม: REMARKS / NOTE */
       FROM public.njacc_jobs WHERE id=i.job_id),
    /* ← เพิ่ม: Company Invoice (ของเดิมมีเฉพาะฝั่ง draft_view) */
    'company_invoice', (SELECT ci.company_name
       FROM public.njacc_jobs j2
       JOIN public.njacc_company_invoices ci ON ci.id = j2.company_invoice_id
      WHERE j2.id = i.job_id),
    /* ← เพิ่ม: Created By — ชื่อผู้ออกใบ ถ้าไม่มีใช้ผู้ POST */
    'created_by_name', (SELECT p.full_name FROM public.njacc_profiles p
       WHERE p.id = coalesce(i.issued_by, i.posted_by)),
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.line_no),'[]'::jsonb)
       FROM public.njacc_invoice_items x WHERE x.invoice_id=i.id),
    'paid', coalesce((SELECT sum(allocated_amount) FROM public.njacc_payment_allocations pa
       JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       WHERE pa.invoice_id=i.id),0))
  INTO v FROM public.njacc_invoices i WHERE i.id=p_id;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(v->>'charge_type', v->>'company_group','view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  RETURN v;
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_invoice_view(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_invoice_view(uuid) FROM PUBLIC, anon;

-- 2.2 · njacc_invoice_draft_view — เฉพาะฟอร์ม INVOICE (ร่าง / ออกวางบิล)
--       ยกของเดิมมาทั้งตัว เพิ่มเฉพาะคีย์ใหม่ · ตรรกะเลือกใบ/สิทธิ์เหมือนเดิมทุกบรรทัด
CREATE OR REPLACE FUNCTION public.njacc_invoice_draft_view(p_job uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v jsonb; v_id uuid; j public.njacc_jobs;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO j FROM public.njacc_jobs WHERE id=p_job;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type, j.company_group, 'view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  /* ร่าง หรือ ใบที่ POST แล้ว (Modal ต้องรู้สถานะเพื่อสลับ Footer DRAFT/POSTED) */
  SELECT id INTO v_id FROM public.njacc_invoices
   WHERE job_id=p_job AND status IN ('DRAFT','POSTED')
   ORDER BY CASE status WHEN 'DRAFT' THEN 0 ELSE 1 END LIMIT 1;
  IF v_id IS NULL THEN RETURN NULL; END IF;

  SELECT to_jsonb(i) || jsonb_build_object(
           'customer_name', c.customer_name, 'customer_code', c.customer_code,
           'customer_address', c.address, 'customer_tax_id', c.tax_id,
           'customer_branch_code', c.branch_code,      /* ← เพิ่ม: Branch */
           'customer_phone', c.phone,                  /* ← เพิ่ม: Tel. */
           'company_invoice', ci.company_name, 'job_no', j2.job_no,
           'customer_job_no', j2.customer_job_no,
           'customs_declaration_no', j2.customs_declaration_no,  /* ← เพิ่ม: Decl No. */
           'master_bl_no', j2.master_bl_no,                      /* ← เพิ่ม: Master */
           'house_bl_no', j2.house_bl_no,                        /* ← เพิ่ม: House */
           'job_note', j2.note,                                  /* ← เพิ่ม: REMARKS */
           'created_by_name', (SELECT p.full_name FROM public.njacc_profiles p
                                WHERE p.id = coalesce(i.issued_by, i.draft_saved_by,
                                                      j2.created_by)),  /* ← เพิ่ม */
           'is_draft', (i.status = 'DRAFT'),
           'has_real_no', (i.invoice_no IS NOT NULL AND i.invoice_no NOT LIKE 'DRAFT-%'),
           'items',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.line_no),'[]'::jsonb)
                      FROM public.njacc_invoice_items x WHERE x.invoice_id=i.id))
    INTO v
    FROM public.njacc_invoices i
    JOIN public.njacc_jobs j2 ON j2.id = i.job_id
    LEFT JOIN public.njacc_customers c ON c.id = i.customer_id
    LEFT JOIN public.njacc_company_invoices ci ON ci.id = j2.company_invoice_id
   WHERE i.id = v_id;
  RETURN v;
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_invoice_draft_view(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_invoice_draft_view(uuid) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY)  — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
WITH a AS (SELECT pg_get_functiondef('public.njacc_invoice_view(uuid)'::regprocedure) AS c),
     b AS (SELECT pg_get_functiondef('public.njacc_invoice_draft_view(uuid)'::regprocedure) AS c)
SELECT 'V1 invoice_view มีฟิลด์ใหม่ครบ' AS check_name,
       CASE WHEN c LIKE '%customs_declaration_no%' AND c LIKE '%master_bl_no%'
             AND c LIKE '%''phone'',phone%' AND c LIKE '%company_invoice%'
             AND c LIKE '%created_by_name%' THEN 'PASS' ELSE 'FAIL' END AS result FROM a
UNION ALL
SELECT 'V2 invoice_view คีย์เดิมยังอยู่ครบ',
       CASE WHEN c LIKE '%''paid''%' AND c LIKE '%source_invoice_no%'
             AND c LIKE '%NJACC_INVOICE_NOT_FOUND%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V3 invoice_view ตรวจสิทธิ์เดิมยังอยู่',
       CASE WHEN c LIKE '%njacc_can(v->>''charge_type''%' THEN 'PASS' ELSE 'FAIL' END FROM a
UNION ALL
SELECT 'V4 draft_view มีฟิลด์ใหม่ครบ',
       CASE WHEN c LIKE '%customer_branch_code%' AND c LIKE '%customer_phone%'
             AND c LIKE '%customs_declaration_no%' AND c LIKE '%master_bl_no%'
             AND c LIKE '%house_bl_no%' AND c LIKE '%job_note%'
             AND c LIKE '%created_by_name%' THEN 'PASS' ELSE 'FAIL' END FROM b
UNION ALL
SELECT 'V5 draft_view คีย์เดิมยังอยู่ครบ',
       CASE WHEN c LIKE '%is_draft%' AND c LIKE '%has_real_no%'
             AND c LIKE '%customer_code%' THEN 'PASS' ELSE 'FAIL' END FROM b
UNION ALL
SELECT 'V6 anon เรียกไม่ได้',
       CASE WHEN NOT has_function_privilege('anon','public.njacc_invoice_view(uuid)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_invoice_draft_view(uuid)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 authenticated ยังเรียกได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_invoice_view(uuid)','EXECUTE')
             AND has_function_privilege('authenticated','public.njacc_invoice_draft_view(uuid)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 ข้อมูลไม่ถูกแตะ (เทียบกับ P1 ต้องเท่าเดิม)',
       'invoices='||(SELECT count(*) FROM public.njacc_invoices)::text
     ||' items='||(SELECT count(*) FROM public.njacc_invoice_items)::text
     ||' jobs='||(SELECT count(*) FROM public.njacc_jobs)::text;
