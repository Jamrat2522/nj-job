-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-12_WHT_LIST_FULL_COLUMNS.sql
-- REPORT > ใบหัก ณ ที่จ่าย — ให้ njacc_list_wht คืน "ทุกคอลัมน์ที่บันทึกไว้"
--
-- ═══ ROOT CAUSE ══════════════════════════════════════════════════════════
--   RUN-10 เพิ่ม 3 คอลัมน์ (invoice_no_text · payee_code · payment_by)
--   และ RUN-08 เพิ่มอีก 22 คอลัมน์
--   แต่ *** njacc_list_wht ไม่เคยถูกต่อสาย *** projection ยังคืนไม่ครบ
--   -> หน้ารายการจึงแสดงคอลัมน์เหล่านั้นไม่ได้ ต่อให้เพิ่ม <th> ก็ได้ค่าว่าง
--   ตรวจจาก pg_get_functiondef จริงแล้ว คอลัมน์ที่ยังขาด:
--     invoice_no_text · payee_code · payment_by
--     payer_branch · payer_address · payee_branch · payee_address
--     agent_name · agent_tax_id · agent_branch · agent_address
--     form_seq · pay_method_other · signer_position · payee_customer_id
--
-- ═══ ขอบเขต ═══════════════════════════════════════════════════════════════
--   *** แก้ฟังก์ชันเดียว: njacc_list_wht *** และแก้เฉพาะ "รายชื่อคอลัมน์ที่ SELECT"
--   ไม่แตะ: สิทธิ์ · เงื่อนไข WHERE · ORDER BY · Pagination · การนับ total
--           njacc_save_wht_draft · njacc_post_wht · njacc_unpost_wht ·
--           njacc_void_wht · njacc_wht_view · njacc_delete_wht_draft ·
--           njacc_wht_export · njacc_wht_export_page · ตาราง · ข้อมูล
--   ไม่มี DO block · ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE
--   *** Signature เดิมทุกตัวอักษร *** (uuid,date,date,integer,integer,text)
--   -> CREATE OR REPLACE ทับได้เลย ไม่เกิด overload ไม่ต้อง DROP
--   รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. PREFLIGHT (อ่านอย่างเดียว) ─────────────────────────────────────────
SELECT 'P1 njacc_list_wht มีตัวเดียว signature 6 อาร์กิวเมนต์' AS check_item,
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_wht') = 1
             AND (SELECT pg_get_function_identity_arguments(p.oid) FROM pg_proc p
                    JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_wht')
                 = 'p_customer uuid, p_from date, p_to date, p_page integer, p_size integer, p_direction text'
            THEN 'PASS' ELSE 'STOP — signature ไม่ตรง ให้แจ้งก่อน' END AS result
UNION ALL
SELECT 'P2 คอลัมน์ปลายทางมีจริงครบ (RUN-08 + RUN-10)',
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name IN ('invoice_no_text','payee_code','payment_by',
                       'payer_branch','payer_address','payee_branch','payee_address',
                       'agent_name','agent_tax_id','agent_branch','agent_address',
                       'form_seq','pay_method_other','signer_position','payee_customer_id')) = 15
            THEN 'PASS' ELSE 'FAIL — ต้องรัน RUN-08 และ RUN-10 ก่อน' END;


-- ── 2. njacc_list_wht — เพิ่มคอลัมน์ใน projection ─────────────────────────
--    ยกนิยามจริงจาก Production มาทั้งดุ้น เปลี่ยนเฉพาะบล็อก SELECT ของ subquery t
CREATE OR REPLACE FUNCTION public.njacc_list_wht(
    p_customer uuid DEFAULT NULL::uuid, p_from date DEFAULT NULL::date,
    p_to date DEFAULT NULL::date, p_page integer DEFAULT 1,
    p_size integer DEFAULT 20, p_direction text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
        v_dir text := nullif(btrim(coalesce(p_direction,'')),'');
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
     AND (v_dir IS NULL OR w.direction=v_dir);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no,
           w.customer_id, w.invoice_id, w.reference_no, w.pay_date, w.note,
           w.certificate_no, w.direction,
           /* ── snapshot จาก RUN-08 ── */
           w.book_no, w.ref_date, w.job_no,
           w.payer_name, w.payer_tax_id, w.payee_name, w.payee_tax_id,
           w.form_type, w.pay_method, w.signer_name,
           /* ── เพิ่มใน RUN-12: คอลัมน์ที่บันทึกไว้แต่ยังไม่เคยถูกส่งกลับ ──
              หน้ารายการต้องแสดงได้ครบทุกคอลัมน์ที่ผู้ใช้กรอก */
           w.invoice_no_text, w.payee_code, w.payment_by,
           w.payer_branch, w.payer_address,
           w.payee_branch, w.payee_address, w.payee_customer_id,
           w.agent_name, w.agent_tax_id, w.agent_branch, w.agent_address,
           w.form_seq, w.pay_method_other, w.signer_position,
           w.posted_at,
           c.tax_id      AS customer_tax_id,
           c.branch_code AS customer_branch_code,
           c.address     AS customer_address,
           c.phone       AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
       AND (v_dir IS NULL OR w.direction=v_dir)
     ORDER BY w.document_date DESC, w.document_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer,text) FROM PUBLIC, anon;


-- ── VERIFY (อ่านอย่างเดียว) ───────────────────────────────────────────────
SELECT 'V1 คืนคอลัมน์ใหม่ครบ 15 ตัว' AS check_item,
       CASE WHEN (SELECT bool_and(
                    pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                    LIKE '%w.' || col || '%')
                    FROM unnest(ARRAY['invoice_no_text','payee_code','payment_by',
                      'payer_branch','payer_address','payee_branch','payee_address',
                      'payee_customer_id','agent_name','agent_tax_id','agent_branch',
                      'agent_address','form_seq','pay_method_other','signer_position']) AS col)
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 คอลัมน์เดิมยังอยู่ครบ (ไม่มีอะไรหาย)',
       CASE WHEN (SELECT bool_and(
                    pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure)
                    LIKE '%' || col || '%')
                    FROM unnest(ARRAY['w.document_no','w.document_date','w.wht_type','w.tax_base',
                      'w.rate','w.amount','w.status','c.customer_name','i.invoice_no',
                      'w.reference_no','w.pay_date','w.note','w.certificate_no','w.direction',
                      'w.book_no','w.ref_date','w.job_no','w.payer_name','w.payer_tax_id',
                      'w.payee_name','w.payee_tax_id','w.form_type','w.pay_method',
                      'w.signer_name','w.posted_at','item_count']) AS col)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 Signature เดิม — ไม่มี overload ซ้อน',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_wht') = 1
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 สิทธิ์ / WHERE / ORDER BY / Pagination ไม่ถูกแตะ',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure))
                   LIKE '%njacc_can(''*'',''*'',''view'')%'
            AND (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure))
                   LIKE '%ORDER BY w.document_date DESC, w.document_no DESC OFFSET v_off LIMIT v_size%'
            AND (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure))
                   LIKE '%v_size := least(greatest(coalesce(p_size,20),1),100)%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 LEFT JOIN ยังอยู่ (ใบที่ไม่มี customer_id ไม่หาย)',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure))
                   LIKE '%LEFT JOIN public.njacc_customers c%'
            AND (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure))
                   LIKE '%LEFT JOIN public.njacc_invoices i%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_wht')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 สิทธิ์ RPC: authenticated ใช้ได้ · anon ใช้ไม่ได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_list_wht(uuid,date,date,integer,integer,text)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_list_wht(uuid,date,date,integer,integer,text)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 RPC ชุด WHT ยังครบ 10 ตัว (ไม่มีตัวไหนหาย)',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname IN
                     ('njacc_save_wht_draft','njacc_post_wht','njacc_wht_view',
                      'njacc_delete_wht_draft','njacc_wht_invoice_options',
                      'njacc_list_wht','njacc_void_wht','njacc_unpost_wht',
                      'njacc_wht_export','njacc_wht_export_page')) = 10
            THEN 'PASS' ELSE 'FAIL' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   เก็บนิยามเดิมไว้ก่อนรัน:
--     SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text)'::regprocedure);
--   แล้ว EXECUTE ข้อความเดิมกลับ (Signature เดียวกัน ทับได้ทันที)
--   ไม่มีการเปลี่ยนโครงตารางหรือข้อมูล จึงไม่มีอะไรต้องกู้คืน
