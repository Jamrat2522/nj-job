-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_027_invoice_doc_fields.sql
--
-- ⚠️ ยังไม่ได้รัน — รอคุณน้อยอนุมัติ (ตามข้อ 34 ของโจทย์)
--    เอกสาร INVOICE ใหม่ "ทำงานได้ทันทีโดยไม่ต้องรันไฟล์นี้"
--    แต่ช่องที่ RPC ยังไม่ส่งมาจะแสดง "-" (ไม่ใช่ค่ามั่ว) ได้แก่:
--      Decl No. · Master · Customer Tel. · REMARKS · Created By
--      + Branch/House/Company Invoice (ขาดคนละฝั่งกันระหว่าง 2 RPC)
--    รันไฟล์นี้แล้วช่องเหล่านั้นจะมีค่าจริงครบตามใบตัวอย่าง
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ทำไมถึงจำเป็น (ตรวจจาก pg_get_functiondef ของ Production จริง ไม่ได้เดา)
-- ═══════════════════════════════════════════════════════════════════════════
--   njacc_invoice_view(uuid)        คืน customer{name,tax_id,address,branch_code}
--                                   และ job{job_no,customer_job_no,house_bl_no,source_invoice_no}
--     ขาด: customer.phone · job.customs_declaration_no · job.master_bl_no · job.note
--          company_invoice · ชื่อผู้สร้างเอกสาร
--
--   njacc_invoice_draft_view(uuid)  คืน customer_name/code/address/tax_id ·
--                                   company_invoice · job_no · customer_job_no
--     ขาด: customer.branch_code · customer.phone · customs_declaration_no ·
--          master_bl_no · house_bl_no · job.note · ชื่อผู้สร้างเอกสาร
--
--   ข้อมูลทั้งหมดนี้ "มีอยู่แล้วในตาราง" (njacc_customers.phone,
--   njacc_jobs.customs_declaration_no / master_bl_no / house_bl_no / note,
--   njacc_profiles.full_name) แค่ยังไม่ถูกส่งออกมาที่ RPC
--   -> Frontend จึงไม่มีทางแสดงได้ถ้าไม่แก้ RPC (และห้ามไปดึงตารางตรงเพราะ RLS/สิทธิ์)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ขอบเขตของไฟล์นี้ — READ PATH เท่านั้น
-- ═══════════════════════════════════════════════════════════════════════════
--   เพิ่ม "คีย์ใน jsonb ที่คืนกลับ" ของ 2 RPC เท่านั้น
--   ไม่แตะ: ตาราง · คอลัมน์ · index · RLS · policy · trigger · sequence
--           Invoice Calculation / VAT / WHT / POST / UNPOST / Draft Save /
--           Document Number / Service Master / Customer Master / Permission / Role
--   ไม่ INSERT / UPDATE / DELETE / DROP / TRUNCATE ข้อมูลใด ๆ
--   คีย์เดิมทุกตัวยังอยู่ครบ -> โค้ดเดิมที่อ่าน RPC นี้อยู่ไม่พัง (เพิ่มอย่างเดียว)
--   การตรวจสิทธิ์ njacc_can(...,'view') เดิมยังอยู่ทุกบรรทัด
--
-- ROLLBACK: รัน block CREATE OR REPLACE ของ 2 ฟังก์ชันนี้จากไฟล์เดิม
--           (njacc_invoice_view = sql/005_njacc_rpc.sql ·
--            njacc_invoice_draft_view = sql/dev/022_*.sql)
--           เอกสารจะกลับไปแสดง "-" ในช่องที่เพิ่ม ไม่มีข้อมูลเสียหาย
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_view') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_view'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_invoice_draft_view') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_draft_view'; END IF;
  -- คอลัมน์ที่จะดึงเพิ่ม ต้องมีอยู่จริงทั้งหมด
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers' AND column_name='phone') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.phone'; END IF;
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema='public' AND table_name='njacc_jobs'
         AND column_name IN ('customs_declaration_no','master_bl_no','house_bl_no','note')) <> 4 THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — คอลัมน์อ้างอิงใน njacc_jobs ไม่ครบ'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS — พร้อมเพิ่มฟิลด์เอกสาร (read path เท่านั้น)';
END $preflight$;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · njacc_invoice_view — ยกของเดิมมาทั้งตัว เพิ่มเฉพาะคีย์ใหม่
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
       'note',note)                                      /* ← เพิ่ม: REMARKS */
       FROM public.njacc_jobs WHERE id=i.job_id),
    /* ← เพิ่ม: Company Invoice (ของเดิมมีเฉพาะฝั่ง draft_view) */
    'company_invoice', (SELECT ci.company_name
       FROM public.njacc_jobs j2
       JOIN public.njacc_company_invoices ci ON ci.id = j2.company_invoice_id
      WHERE j2.id = i.job_id),
    /* ← เพิ่ม: Created By — ชื่อผู้ออกใบ ถ้าไม่มีใช้ผู้สร้าง record */
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


-- 2.2 · njacc_invoice_draft_view — ยกของเดิมมาทั้งตัว เพิ่มเฉพาะคีย์ใหม่
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
-- SECTION 3 · VERIFY (READ ONLY)
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
SELECT 'V8 ข้อมูลไม่ถูกแตะ',
       'invoices='||(SELECT count(*) FROM public.njacc_invoices)::text
     ||' items='||(SELECT count(*) FROM public.njacc_invoice_items)::text
     ||' jobs='||(SELECT count(*) FROM public.njacc_jobs)::text;
