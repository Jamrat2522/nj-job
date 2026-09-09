-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-69  ·  V.345  ·  ใบหัก ณ ที่จ่าย : อ่านข้อมูลลูกค้าจาก Master ล่าสุด
-- ═══════════════════════════════════════════════════════════════════════════
-- ปัญหา (ตรวจจาก Source จริงและจากนิยามบน Production แล้ว ไม่ได้เดา)
--   SYSTEM > ตั้งค่า > ตั้งค่าลูกค้า -> แก้ CODE / ชื่อ / Tax ID / สาขา / ที่อยู่
--   njacc_customers ถูก UPDATE ถูกต้อง และ masters(true) refresh แล้ว
--   แต่ REPORT > ใบหัก ณ ที่จ่าย ยังแสดงข้อมูลเก่า
--
-- ── Root Cause ──────────────────────────────────────────────────────────────
--   njacc_list_wht / njacc_list_wht_f SELECT ค่าจาก *** Snapshot บนตัวเอกสาร ***
--     w.payer_code · w.payer_name · w.payer_tax_id · w.payer_branch · w.payer_address
--     w.payee_code · w.payee_name · w.payee_tax_id · w.payee_branch · w.payee_address
--   njacc_wht_view ก็คืน to_jsonb(w) ซึ่งมี Snapshot ชุดเดียวกัน
--     (มี key 'payer' ที่อ่านจาก njacc_customers อยู่แล้ว แต่ Frontend
--      ใช้ prev.payer_name / prev.payer_tax_id ... ระดับบนสุดเป็นหลัก)
--   -> แก้ Master ภายหลังจึงไม่มีผลกับเอกสารเก่า
--
-- ── สิ่งที่ RUN-69 ทำ ───────────────────────────────────────────────────────
--   *** เปลี่ยนเฉพาะ \"ตอนอ่าน/แสดงผล\" *** ไม่เขียนทับเอกสารย้อนหลังแม้แถวเดียว
--   เอกสารที่ยังผูก Master อยู่ -> แสดงค่าล่าสุดจาก njacc_customers ทันที
--     ฝั่ง ก. ผู้มีหน้าที่หักภาษี ใช้ w.customer_id
--     ฝั่ง ข. ผู้ถูกหักภาษี      ใช้ w.payee_customer_id
--   เอกสารที่ไม่ผูก Master (customer_id / payee_customer_id เป็น NULL)
--   หรือค่าใน Master ว่าง -> ถอยไปใช้ Snapshot เดิม 100% *** ข้อมูลห้ามหาย ***
--
--   สูตรที่ใช้ทุกช่อง :
--     coalesce(nullif(btrim(<master>), ''), <snapshot>)
--   -> Master เป็น NULL หรือช่องว่างล้วน ก็ยังถอยไปใช้ Snapshot ได้อย่างปลอดภัย
--
--   Mapping (ตรงตามข้อกำหนด)
--     payer_code    <- njacc_customers.customer_code   (ผ่าน w.customer_id)
--     payer_name    <- njacc_customers.customer_name
--     payer_tax_id  <- njacc_customers.tax_id
--     payer_branch  <- njacc_customers.branch_code
--     payer_address <- njacc_customers.address
--     customer_phone<- njacc_customers.phone           (Live อยู่แล้วก่อนหน้านี้)
--     payee_code    <- njacc_customers.customer_code   (ผ่าน w.payee_customer_id)
--     payee_name    <- njacc_customers.customer_name
--     payee_tax_id  <- njacc_customers.tax_id
--     payee_branch  <- njacc_customers.branch_code
--     payee_address <- njacc_customers.address
--
--   ฟังก์ชันที่ถูก CREATE OR REPLACE (Signature เดิมทั้งหมด ไม่มีตัวใหม่)
--     1) public.njacc_list_wht(uuid,date,date,integer,integer,text,text)
--     2) public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,
--                                text,text,text,date)          -- RUN-68
--     3) public.njacc_wht_view(uuid)
--
-- ── เรื่อง JOIN / Performance ───────────────────────────────────────────────
--   ฝั่งผู้หักฯ ใช้ LEFT JOIN njacc_customers c ON c.id=w.customer_id
--     *** ที่มีอยู่เดิมอยู่แล้ว *** ไม่ได้เพิ่ม JOIN ใหม่
--   เพิ่มใหม่เพียงตัวเดียว : LEFT JOIN njacc_customers pc ON pc.id=w.payee_customer_id
--   JOIN บน Primary Key -> Index Scan · ทำครั้งเดียวต่อ 1 Query
--   *** ไม่มี N+1 · ไม่ยิง RPC ต่อแถว · ไม่ loop njacc_masters() ***
--
-- ── ตัวกรอง 4 ช่องของ RUN-68 ────────────────────────────────────────────────
--   p_payer / p_payee เปลี่ยนไปกรองบน *** ค่าเดียวกับที่แสดงบนหน้าจอ ***
--   (coalesce Master -> Snapshot) ไม่งั้นค้นด้วยชื่อใหม่จะไม่เจอ ทั้งที่ตาราง
--   แสดงชื่อใหม่อยู่ = ขัดแย้งกันเอง · p_cert_no / p_cert_date ไม่ถูกแตะ
--
-- ── สิ่งที่ RUN-69 ไม่ทำ ────────────────────────────────────────────────────
--   *** ไม่ DROP / ไม่ DELETE / ไม่ TRUNCATE / ไม่ ALTER TABLE ***
--   *** ไม่ UPDATE ข้อมูลในตารางแม้แถวเดียว · ไม่ Mass Update Snapshot ***
--   ไม่แตะ ORDER BY ของ RUN-65 (certificate_no ASC · document_date ASC · document_no ASC)
--   ไม่แตะ Pagination · Permission · RLS · SECURITY DEFINER · GRANT · Role
--   ไม่แตะ Relationship : customer_id · payee_customer_id ยังเก็บ UUID เหมือนเดิม
--   ไม่แตะ njacc_save_wht_draft · njacc_post_wht · njacc_void_wht ·
--          njacc_upsert_customer · njacc_masters · njacc_wht_export_page
--   ไม่แตะ Reference No. · เล่มที่ · has_acting_agent · agent_* ·
--          3 โหมด (กระทำการแทน / ไม่กระทำการ / NJ TRANS)
--   ไม่แตะ Layout / แบบฟอร์ม 50 ทวิ / ตำแหน่งข้อความ — แก้เฉพาะ Data Source
--   ไม่เพิ่ม RPC ใหม่ · ไม่เพิ่ม Index
--
-- idempotent : CREATE OR REPLACE ทั้งหมด · รันซ้ำได้ · ไม่ต้องรอ Deploy ไฟล์
--   งานนี้แก้ที่ SQL ล้วน -> รันแล้วเห็นผลทันทีทั้งหน้ารายการ ฟอร์ม และ Print
-- ═══════════════════════════════════════════════════════════════════════════


-- ══ 1. PRECHECK (READ ONLY — ไม่แก้อะไรทั้งสิ้น) ═══════════════════════════
SELECT 'P1 njacc_list_wht (7 args) มีอยู่' AS check_item,
  CASE WHEN to_regprocedure('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)') IS NOT NULL
  THEN 'PASS' ELSE 'STOP — ไม่พบ ห้ามรันต่อ' END AS result
UNION ALL SELECT 'P2 njacc_list_wht_f (11 params · RUN-68) มีอยู่',
  CASE WHEN to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)') IS NOT NULL
  THEN 'PASS' ELSE 'STOP — ต้องรัน RUN-68 ก่อน' END
UNION ALL SELECT 'P3 njacc_wht_view(uuid) มีอยู่',
  CASE WHEN to_regprocedure('public.njacc_wht_view(uuid)') IS NOT NULL
  THEN 'PASS' ELSE 'STOP' END
UNION ALL SELECT 'P4 คอลัมน์ Master ที่ใช้ mapping ครบ 6 ตัว',
  CASE WHEN (SELECT count(*) FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_customers'
                AND column_name IN ('customer_code','customer_name','tax_id',
                                    'branch_code','address','phone')) = 6
  THEN 'PASS' ELSE 'STOP — คอลัมน์ Master ไม่ครบ' END
UNION ALL SELECT 'P5 คอลัมน์ Snapshot บนเอกสารครบ 10 ตัว (ใช้เป็น Fallback)',
  CASE WHEN (SELECT count(*) FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                AND column_name IN ('payer_code','payer_name','payer_tax_id','payer_branch','payer_address',
                                    'payee_code','payee_name','payee_tax_id','payee_branch','payee_address')) = 10
  THEN 'PASS' ELSE 'STOP' END
UNION ALL SELECT 'P6 คอลัมน์ผูก Master ครบ 2 ตัว',
  CASE WHEN (SELECT count(*) FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                AND column_name IN ('customer_id','payee_customer_id')) = 2
  THEN 'PASS' ELSE 'STOP' END
UNION ALL SELECT 'P7 ORDER BY ของ RUN-65 ยังอยู่ในนิยามเดิม (ฐานที่คัดลอกมา)',
  CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)'::regprocedure))
        LIKE '%ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC%'
  THEN 'PASS' ELSE 'STOP — นิยามเปลี่ยนไปจากที่ตรวจไว้' END
UNION ALL SELECT 'P8 จำนวนเอกสาร WHT ก่อนรัน (ต้องไม่เปลี่ยนหลังรัน)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs)
UNION ALL SELECT 'P9 เอกสารที่ผูก Master ฝั่งผู้หักฯ / ฝั่งผู้ถูกหักฯ',
  (SELECT count(*) FILTER (WHERE customer_id IS NOT NULL)::text || ' / ' ||
          count(*) FILTER (WHERE payee_customer_id IS NOT NULL)::text
     FROM public.njacc_withholding_docs);


-- ══ 2. PATCH ═══════════════════════════════════════════════════════════════

-- ── 2.1 njacc_list_wht — Signature เดิมทุกตัวอักษร ─────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_list_wht(
  p_customer uuid DEFAULT NULL, p_from date DEFAULT NULL, p_to date DEFAULT NULL,
  p_page integer DEFAULT 1, p_size integer DEFAULT 20, p_direction text DEFAULT NULL,
  p_mode text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
        v_dir text := nullif(btrim(coalesce(p_direction,'')),'');
        v_mode text := nullif(btrim(coalesce(p_mode,'')),'');
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_module_allowed('REPORT') THEN RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_mode IS NOT NULL AND v_mode NOT IN ('ACTING_AGENT','NON_ACTING','NJ_TRANS') THEN
    RAISE EXCEPTION 'NJACC_BAD_WHT_MODE'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;

  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from)
     AND (p_to IS NULL OR w.document_date<=p_to)
     AND (v_dir IS NULL OR w.direction=v_dir)
     AND (v_mode IS NULL OR coalesce(w.wht_mode,
            public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode);

  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no, w.customer_id, w.invoice_id, w.reference_no,
           w.pay_date, w.note, w.certificate_no, w.direction, w.book_no, w.ref_date, w.job_no,
           /* ── V.345 ── ผูก Master อยู่ -> ใช้ค่าล่าสุด · ไม่ผูก/ว่าง -> Snapshot เดิม */
           coalesce(nullif(btrim(c.customer_name),''),  w.payer_name)    AS payer_name,
           coalesce(nullif(btrim(c.tax_id),''),         w.payer_tax_id)  AS payer_tax_id,
           coalesce(nullif(btrim(pc.customer_name),''), w.payee_name)    AS payee_name,
           coalesce(nullif(btrim(pc.tax_id),''),        w.payee_tax_id)  AS payee_tax_id,
           w.form_type, w.pay_method,
           w.signer_name, w.invoice_no_text,
           coalesce(nullif(btrim(pc.customer_code),''), w.payee_code)    AS payee_code,
           w.payment_by,
           coalesce(nullif(btrim(c.branch_code),''),    w.payer_branch)  AS payer_branch,
           coalesce(nullif(btrim(c.address),''),        w.payer_address) AS payer_address,
           coalesce(nullif(btrim(pc.branch_code),''),   w.payee_branch)  AS payee_branch,
           coalesce(nullif(btrim(pc.address),''),       w.payee_address) AS payee_address,
           w.payee_customer_id, w.agent_name,
           w.agent_tax_id, w.agent_branch, w.agent_address, w.has_acting_agent, w.form_seq, w.pay_method_other,
           w.signer_position, w.posted_at, w.payer_citizen_id, w.payee_citizen_id,
           coalesce(nullif(btrim(c.customer_code),''),  w.payer_code)    AS payer_code,
           w.void_reason, w.voided_at,
           coalesce(w.wht_mode, public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) AS wht_mode,
           c.tax_id AS customer_tax_id, c.branch_code AS customer_branch_code,
           c.address AS customer_address, c.phone AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_customers pc ON pc.id=w.payee_customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from)
       AND (p_to IS NULL OR w.document_date<=p_to)
       AND (v_dir IS NULL OR w.direction=v_dir)
       AND (v_mode IS NULL OR coalesce(w.wht_mode,
              public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode)
     ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC
     OFFSET v_off LIMIT v_size) t;

  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $fn$;

REVOKE ALL     ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text,text) TO authenticated;


-- ── 2.2 njacc_list_wht_f (RUN-68) — Signature เดิมทุกตัวอักษร ──────────────
CREATE OR REPLACE FUNCTION public.njacc_list_wht_f(
  p_customer uuid DEFAULT NULL, p_from date DEFAULT NULL, p_to date DEFAULT NULL,
  p_page integer DEFAULT 1, p_size integer DEFAULT 20, p_direction text DEFAULT NULL,
  p_mode text DEFAULT NULL,
  p_payer text DEFAULT NULL, p_payee text DEFAULT NULL,
  p_cert_no text DEFAULT NULL, p_cert_date date DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
        v_dir text := nullif(btrim(coalesce(p_direction,'')),'');
        v_mode text := nullif(btrim(coalesce(p_mode,'')),'');
        v_payer text := nullif(btrim(coalesce(p_payer,'')),'');
        v_payee text := nullif(btrim(coalesce(p_payee,'')),'');
        v_cert  text := nullif(btrim(coalesce(p_cert_no,'')),'');
        v_payer_p text; v_payee_p text; v_cert_p text;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_module_allowed('REPORT') THEN RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN'; END IF;
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_mode IS NOT NULL AND v_mode NOT IN ('ACTING_AGENT','NON_ACTING','NJ_TRANS') THEN
    RAISE EXCEPTION 'NJACC_BAD_WHT_MODE'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;

  v_payer_p := CASE WHEN v_payer IS NULL THEN NULL ELSE
    '%' || replace(replace(replace(v_payer,'\','\\'),'%','\%'),'_','\_') || '%' END;
  v_payee_p := CASE WHEN v_payee IS NULL THEN NULL ELSE
    '%' || replace(replace(replace(v_payee,'\','\\'),'%','\%'),'_','\_') || '%' END;
  v_cert_p  := CASE WHEN v_cert  IS NULL THEN NULL ELSE
    '%' || replace(replace(replace(v_cert ,'\','\\'),'%','\%'),'_','\_') || '%' END;

  /* ── V.345 ── นับยอดต้องกรองบน \"ค่าที่แสดงจริง\" (Master ก่อน · Snapshot ถอย)
     ไม่งั้น total ของ Pagination จะไม่ตรงกับจำนวนแถวที่ผู้ใช้เห็น */
  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
    LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
    LEFT JOIN public.njacc_customers pc ON pc.id=w.payee_customer_id
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from)
     AND (p_to IS NULL OR w.document_date<=p_to)
     AND (v_dir IS NULL OR w.direction=v_dir)
     AND (v_mode IS NULL OR coalesce(w.wht_mode,
            public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode)
     AND (v_payer_p IS NULL OR
          coalesce(nullif(btrim(c.customer_name),''),  w.payer_name) ILIKE v_payer_p)
     AND (v_payee_p IS NULL OR
          coalesce(nullif(btrim(pc.customer_name),''), w.payee_name) ILIKE v_payee_p)
     AND (v_cert_p  IS NULL OR w.certificate_no ILIKE v_cert_p)
     AND (p_cert_date IS NULL OR w.document_date = p_cert_date);

  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no, w.customer_id, w.invoice_id, w.reference_no,
           w.pay_date, w.note, w.certificate_no, w.direction, w.book_no, w.ref_date, w.job_no,
           coalesce(nullif(btrim(c.customer_name),''),  w.payer_name)    AS payer_name,
           coalesce(nullif(btrim(c.tax_id),''),         w.payer_tax_id)  AS payer_tax_id,
           coalesce(nullif(btrim(pc.customer_name),''), w.payee_name)    AS payee_name,
           coalesce(nullif(btrim(pc.tax_id),''),        w.payee_tax_id)  AS payee_tax_id,
           w.form_type, w.pay_method,
           w.signer_name, w.invoice_no_text,
           coalesce(nullif(btrim(pc.customer_code),''), w.payee_code)    AS payee_code,
           w.payment_by,
           coalesce(nullif(btrim(c.branch_code),''),    w.payer_branch)  AS payer_branch,
           coalesce(nullif(btrim(c.address),''),        w.payer_address) AS payer_address,
           coalesce(nullif(btrim(pc.branch_code),''),   w.payee_branch)  AS payee_branch,
           coalesce(nullif(btrim(pc.address),''),       w.payee_address) AS payee_address,
           w.payee_customer_id, w.agent_name,
           w.agent_tax_id, w.agent_branch, w.agent_address, w.has_acting_agent, w.form_seq, w.pay_method_other,
           w.signer_position, w.posted_at, w.payer_citizen_id, w.payee_citizen_id,
           coalesce(nullif(btrim(c.customer_code),''),  w.payer_code)    AS payer_code,
           w.void_reason, w.voided_at,
           coalesce(w.wht_mode, public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) AS wht_mode,
           c.tax_id AS customer_tax_id, c.branch_code AS customer_branch_code,
           c.address AS customer_address, c.phone AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_customers pc ON pc.id=w.payee_customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from)
       AND (p_to IS NULL OR w.document_date<=p_to)
       AND (v_dir IS NULL OR w.direction=v_dir)
       AND (v_mode IS NULL OR coalesce(w.wht_mode,
              public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode)
       AND (v_payer_p IS NULL OR
            coalesce(nullif(btrim(c.customer_name),''),  w.payer_name) ILIKE v_payer_p)
       AND (v_payee_p IS NULL OR
            coalesce(nullif(btrim(pc.customer_name),''), w.payee_name) ILIKE v_payee_p)
       AND (v_cert_p  IS NULL OR w.certificate_no ILIKE v_cert_p)
       AND (p_cert_date IS NULL OR w.document_date = p_cert_date)
     ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC
     OFFSET v_off LIMIT v_size) t;

  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $fn$;

REVOKE ALL     ON FUNCTION public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date) TO authenticated;


-- ── 2.3 njacc_wht_view — หน้าต่างแก้ไข + Preview/Print ใช้ตัวนี้ ───────────
--   Frontend อ่าน prev.payer_name / prev.payer_tax_id ... ระดับบนสุดของ jsonb
--   จึงต้อง *** ทับค่าระดับบนสุด *** ไม่ใช่แค่ key 'payer'
--   -> หน้ารายการกับหน้าฟอร์มตรงกันเสมอ ไม่มีกรณี List ใหม่ / Form เก่า
--   key 'payer' · 'invoice' · 'items' · 'created_by_name' คงไว้ครบเหมือนเดิม
CREATE OR REPLACE FUNCTION public.njacc_wht_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs;
        c public.njacc_customers; pc public.njacc_customers; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_module_allowed('REPORT') THEN
    RAISE EXCEPTION 'NJACC_MODULE_FORBIDDEN';
  END IF;
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=p_id;
  IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;

  /* ── V.345 ── Master ล่าสุดของทั้งสองฝั่ง (ไม่ผูก -> ได้ record ว่าง) */
  SELECT * INTO c  FROM public.njacc_customers WHERE id = w.customer_id;
  SELECT * INTO pc FROM public.njacc_customers WHERE id = w.payee_customer_id;

  SELECT to_jsonb(w)
    /* ── V.345 ── ทับด้วยค่าล่าสุดจาก Master · ว่าง/ไม่ผูก -> Snapshot เดิม */
    || jsonb_build_object(
      'payer_code',    coalesce(nullif(btrim(c.customer_code),''),  w.payer_code),
      'payer_name',    coalesce(nullif(btrim(c.customer_name),''),  w.payer_name),
      'payer_tax_id',  coalesce(nullif(btrim(c.tax_id),''),         w.payer_tax_id),
      'payer_branch',  coalesce(nullif(btrim(c.branch_code),''),    w.payer_branch),
      'payer_address', coalesce(nullif(btrim(c.address),''),        w.payer_address),
      'payee_code',    coalesce(nullif(btrim(pc.customer_code),''), w.payee_code),
      'payee_name',    coalesce(nullif(btrim(pc.customer_name),''), w.payee_name),
      'payee_tax_id',  coalesce(nullif(btrim(pc.tax_id),''),        w.payee_tax_id),
      'payee_branch',  coalesce(nullif(btrim(pc.branch_code),''),   w.payee_branch),
      'payee_address', coalesce(nullif(btrim(pc.address),''),       w.payee_address))
    || jsonb_build_object(
    /* ── ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย = Customer / ผู้จ่ายเงิน ──
       N.J. เป็นผู้ขายและเป็น "ผู้ถูกหัก" (ประกอบจาก Company Config ที่ฝั่ง Renderer)
       *** ห้ามสลับบทบาท *** */
    'payer', (SELECT jsonb_build_object('id',x.id,'name',x.customer_name,'code',x.customer_code,
        'tax_id',x.tax_id,'branch_code',x.branch_code,'address',x.address,'phone',x.phone)
       FROM public.njacc_customers x WHERE x.id=w.customer_id),
    /* เอกสารต้นทาง — อ่านอย่างเดียว ไม่แตะ Invoice */
    'invoice', (SELECT jsonb_build_object('id',i.id,'invoice_no',i.invoice_no,
        'invoice_date',i.invoice_date,'total_amount',i.total_amount,
        'wht_amount',coalesce(i.wht_amount,0))
       FROM public.njacc_invoices i WHERE i.id=w.invoice_id),
    'created_by_name', (SELECT pf.full_name FROM public.njacc_profiles pf
       WHERE pf.id = coalesce(w.posted_by, w.created_by)),
    /* รายการเงินได้ · ถ้าไม่มี items (เอกสารเก่าก่อนรันไฟล์นี้)
       ถอยไปสร้าง 1 บรรทัดจากค่าบนหัวใบ -> เอกสารเก่ายังพิมพ์ได้ ไม่ต้องเดาค่า */
    'items', coalesce(
       (SELECT jsonb_agg(to_jsonb(x) ORDER BY x.line_no)
          FROM public.njacc_wht_items x WHERE x.wht_id=w.id),
       CASE WHEN w.tax_base > 0 THEN jsonb_build_array(jsonb_build_object(
              'line_no',1,'pay_date',coalesce(w.pay_date,w.document_date),
              'income_type',coalesce(w.wht_type,'OTHER'),'description',NULL,
              'tax_base',w.tax_base,'rate',w.rate,'amount',w.amount,'legacy',true))
            ELSE '[]'::jsonb END))
  INTO v;
  RETURN v;
END $fn$;

REVOKE ALL     ON FUNCTION public.njacc_wht_view(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_wht_view(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';


-- ══ 3. VERIFY (READ ONLY) ═════════════════════════════════════════════════
SELECT 'V1 njacc_list_wht ยังเป็น 7 อาร์กิวเมนต์ตัวเดียว (ไม่มี overload ซ้ำ)' AS check_name,
  CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='njacc_list_wht') = 1
  THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'V2 njacc_list_wht_f ยังอยู่ (RUN-68 ไม่หาย)',
  CASE WHEN to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)') IS NOT NULL
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V3 ORDER BY ของ RUN-65 ยังเหมือนเดิมทั้ง 2 ฟังก์ชัน',
  CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)'::regprocedure))
        LIKE '%ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC%'
   AND (SELECT pg_get_functiondef('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)'::regprocedure))
        LIKE '%ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC%'
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V4 มี JOIN Master ฝั่งผู้ถูกหักฯ ครบทั้ง 2 ฟังก์ชัน',
  CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)'::regprocedure))
        LIKE '%LEFT JOIN public.njacc_customers pc ON pc.id=w.payee_customer_id%'
   AND (SELECT pg_get_functiondef('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)'::regprocedure))
        LIKE '%LEFT JOIN public.njacc_customers pc ON pc.id=w.payee_customer_id%'
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V5 Permission Guard เดิมครบทั้ง 3 ฟังก์ชัน',
  CASE WHEN (SELECT bool_and(d LIKE '%njacc_module_allowed%' AND d LIKE '%njacc_can%' AND d LIKE '%SECURITY DEFINER%')
        FROM (SELECT pg_get_functiondef(oid) AS d FROM pg_proc p
               JOIN pg_namespace n ON n.oid=p.pronamespace
               WHERE n.nspname='public'
                 AND p.proname IN ('njacc_list_wht','njacc_list_wht_f','njacc_wht_view')) q)
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V6 GRANT ถูกต้องทั้ง 3 ฟังก์ชัน (authenticated ใช้ได้ · anon ใช้ไม่ได้)',
  CASE WHEN has_function_privilege('authenticated', to_regprocedure('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)')::oid,'EXECUTE')
   AND has_function_privilege('authenticated', to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)')::oid,'EXECUTE')
   AND has_function_privilege('authenticated', to_regprocedure('public.njacc_wht_view(uuid)')::oid,'EXECUTE')
   AND NOT has_function_privilege('anon', to_regprocedure('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)')::oid,'EXECUTE')
   AND NOT has_function_privilege('anon', to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)')::oid,'EXECUTE')
   AND NOT has_function_privilege('anon', to_regprocedure('public.njacc_wht_view(uuid)')::oid,'EXECUTE')
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V7 njacc_wht_view ยังคง key payer / invoice / items / created_by_name',
  CASE WHEN (SELECT d LIKE '%''payer''%' AND d LIKE '%''invoice''%' AND d LIKE '%''items''%'
                    AND d LIKE '%''created_by_name''%'
        FROM (SELECT pg_get_functiondef('public.njacc_wht_view(uuid)'::regprocedure) AS d) q)
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V8 จำนวนเอกสาร WHT หลังรัน (ต้องเท่ากับ P8)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs)
UNION ALL SELECT 'V9 ไฟล์นี้ไม่มีคำสั่งทำลาย/แก้ไขข้อมูล',
  'PASS (static — มีเฉพาะ SELECT · CREATE OR REPLACE FUNCTION · REVOKE/GRANT · NOTIFY)';

-- V10 · ทดสอบด้วยข้อมูลจริง (READ ONLY · ต้องประกาศตัวตนก่อนเพราะ SQL Editor ไม่มี JWT)
--   ใส่ auth_user_id ของตัวเอง :
--     Jamrat Phathep       (0001 · jamrat30)    f1edba74-b608-437d-9c82-aafa7bcf3b34
--     SOONTAREE TIRANUKUL  (0002 · soontaree30) 3d9b7b2b-5072-48e1-922d-7930bd85bc32
BEGIN;
SELECT set_config('request.jwt.claim.sub','f1edba74-b608-437d-9c82-aafa7bcf3b34', true);
SELECT 'V10a จำนวนแถวรวมของหน้ารายการ (ต้องเท่ากับก่อนรัน)' AS check_name,
  (public.njacc_list_wht(NULL,NULL,NULL,1,20,'ACTING_AGENT','ACTING_AGENT')->>'total') AS result
UNION ALL SELECT 'V10b ลำดับแถวแรกของหน้า 1 (ORDER BY ต้องไม่เปลี่ยน)',
  (public.njacc_list_wht(NULL,NULL,NULL,1,1,'ACTING_AGENT','ACTING_AGENT')->'rows'->0->>'certificate_no')
UNION ALL SELECT 'V10c ไม่มีแถวใดที่ผู้มีหน้าที่หักภาษีกลายเป็นค่าว่าง (ข้อมูลห้ามหาย)',
  (SELECT count(*)::text FROM jsonb_array_elements(
     public.njacc_list_wht(NULL,NULL,NULL,1,100,'ACTING_AGENT','ACTING_AGENT')->'rows') r
    WHERE coalesce(btrim(r->>'payer_name'),'') = '')
UNION ALL SELECT 'V10d ไม่มีแถวใดที่ผู้ถูกหักภาษีกลายเป็นค่าว่าง',
  (SELECT count(*)::text FROM jsonb_array_elements(
     public.njacc_list_wht(NULL,NULL,NULL,1,100,'ACTING_AGENT','ACTING_AGENT')->'rows') r
    WHERE coalesce(btrim(r->>'payee_name'),'') = '')
UNION ALL SELECT 'V10e หน้ารายการกับหน้าฟอร์มตรงกัน (เทียบ payer_name ของแถวแรก)',
  CASE WHEN (public.njacc_list_wht(NULL,NULL,NULL,1,1,'ACTING_AGENT','ACTING_AGENT')->'rows'->0->>'payer_name')
     IS NOT DISTINCT FROM
     (public.njacc_wht_view(((public.njacc_list_wht(NULL,NULL,NULL,1,1,'ACTING_AGENT','ACTING_AGENT')->'rows'->0->>'id')::uuid))->>'payer_name')
  THEN 'PASS' ELSE 'FAIL' END;
ROLLBACK;


-- ══ 4. RECOVERY NOTE ══════════════════════════════════════════════════════
-- ย้อนกลับ (Rollback) :
--   ไฟล์นี้ *** ไม่เคยเขียน / ลบ / แก้ข้อมูลในตารางเลยแม้แถวเดียว ***
--   จึงไม่มีข้อมูลใดต้องกู้ · ย้อนกลับ = รันนิยามเดิมของ 3 ฟังก์ชันทับกลับ
--   นิยามเดิมอยู่ในไฟล์เหล่านี้ (อยู่ในชุด Source เดียวกัน) :
--     njacc_list_wht    -> RUN-55_WHT_MODE.sql + RUN-65 + RUN-66 (ตามลำดับ)
--     njacc_list_wht_f  -> RUN-68_WHT_LIST_FILTERS.sql
--     njacc_wht_view    -> RUN-05 / RUN-08 / RUN-10 / RUN-14 (ชุดล่าสุดที่ Deploy)
--   หลังย้อนแล้วให้รัน NOTIFY pgrst, 'reload schema'; แล้ว Reload หน้าเว็บ 1 ครั้ง
--
-- ถ้ารันแล้วหน้ารายการยังแสดงข้อมูลเก่า :
--   1) กด Refresh หน้าเว็บ (ข้อมูลถูกอ่านใหม่ทุกครั้งที่โหลดรายการ)
--   2) ตรวจว่าเอกสารใบนั้น *** ผูก Master จริง *** :
--        SELECT customer_id, payee_customer_id, payer_name, payee_name
--          FROM public.njacc_withholding_docs WHERE certificate_no = '<เลขที่>';
--      ถ้าทั้งคู่เป็น NULL = เอกสารกรอกเอง ไม่ได้ผูก Master
--      -> แสดง Snapshot เดิมถูกต้องแล้วตามข้อกำหนด (ห้ามบังคับหา Master)
