-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-68  ·  V.344  ·  njacc_list_wht : ตัวกรองใต้หัวคอลัมน์ 4 ช่อง
-- ═══════════════════════════════════════════════════════════════════════════
-- ปัญหา / ที่มา (ตรวจจาก Source จริง ไม่ได้เดา)
--   หน้ารายการใบหัก ณ ที่จ่าย เรียก public.njacc_list_wht(...) overload 7 อาร์กิวเมนต์
--     assets/js/withholding/withholding-api.js : listWht()
--     assets/js/withholding/withholding-page.js : load() · whtFetchAll()
--   Filter ที่ SQL รองรับตอนนี้มีแค่ p_customer / p_from / p_to / p_direction / p_mode
--   -> เพิ่มช่องค้นหา 4 ช่องตามข้อกำหนดไม่ได้ ถ้าไม่กรองที่ SQL
--      (ข้อกำหนดห้ามดึงทั้งหมดมา .filter() ใน Browser)
--
-- ── Field Mapping (ยืนยันจาก Source จริงแล้วทั้ง Frontend และ Database) ─────
--   ผู้มีหน้าที่หักภาษี ณ ที่จ่าย -> njacc_withholding_docs.payer_name
--        WHT_COLS 'ก. ผู้มีหน้าที่หักภาษี' · ฟอร์ม Section เดียวกัน
--   ผู้ถูกหักภาษี ณ ที่จ่าย      -> njacc_withholding_docs.payee_name
--        WHT_COLS 'ข. ผู้ถูกหักภาษี'
--   เลขที่ *                     -> njacc_withholding_docs.certificate_no
--        ฟอร์ม #wh-cert (บล็อก "เล่มที่ / เลขที่") · WHT_COLS 'เลขที่หนังสือรับรอง'
--        *** ไม่ใช่ reference_no *** (คนละคอลัมน์ คนละความหมาย)
--   วันที่ออกหนังสือรับรอง *     -> njacc_withholding_docs.document_date
--        ฟอร์ม #wh-ddate -> ed.document_date -> payload.document_date
--        *** ไม่ใช่ pay_date (วันที่จ่ายเงินจริง) · ไม่ใช่ ref_date ***
--        *** ไม่ใช่ created_at · ไม่ใช่ updated_at ***
--
-- ── สิ่งที่ RUN-68 ทำ ───────────────────────────────────────────────────────
--   สร้าง *** ฟังก์ชันใหม่ชื่อ public.njacc_list_wht_f *** (11 พารามิเตอร์)
--   เนื้อในคัดลอกจาก njacc_list_wht (7 อาร์กิวเมนต์) ที่มีอยู่จริงบน Production ทุกบรรทัด
--     Projection · JOIN · Permission · ORDER BY (RUN-65) · LIMIT/OFFSET เหมือนกันเป๊ะ
--   เพิ่มเฉพาะ 4 เงื่อนไขใน WHERE ทั้งของ count(*) และของ SELECT แถว
--   -> total ของ Pagination ตรงกับจำนวนแถวที่กรองได้จริงเสมอ
--
-- ── *** ทำไมต้องตั้งชื่อใหม่ ไม่ทำเป็น overload ของ njacc_list_wht *** ───────
--   ทดสอบจริงบน Database นี้แล้ว (BEGIN/ROLLBACK) : ถ้าสร้างเป็น overload
--   njacc_list_wht(...,11 args) ควบคู่กับตัวเดิม 7 args
--   -> การเรียกด้วย 7 อาร์กิวเมนต์เดิมจะ error ทันที :
--        ERROR 42725 : function public.njacc_list_wht(uuid,date,date,integer,
--                      integer,text,text) is not unique
--      เพราะ 4 พารามิเตอร์ใหม่มี DEFAULT -> ตัวใหม่ "รับได้" ด้วย -> Planner เลือกไม่ได้
--      (PostgREST ก็เจอปัญหาเดียวกัน เพราะสุดท้ายก็เรียกผ่าน SQL)
--   *** = จะทำให้หน้ารายการเดิมพังทั้งหน้าทันทีที่รันไฟล์นี้ ***
--   ทางเลือกอีกทาง คือ DROP ตัวเดิมแล้วสร้าง 11 args ทับ -> *** ห้าม DROP ***
--   จึงใช้ชื่อใหม่ : ตัวเดิมไม่ถูกแตะเลยแม้แต่ไบต์เดียว · ไม่ต้อง DROP · ย้อนกลับง่าย
--
-- ── สิ่งที่ RUN-68 ไม่ทำ ────────────────────────────────────────────────────
--   *** ไม่ DROP / ไม่ DELETE / ไม่ TRUNCATE / ไม่ ALTER TABLE / ไม่ UPDATE ข้อมูล ***
--   ไม่แตะ overload 7 อาร์กิวเมนต์เดิม (ยังอยู่ครบ · ผู้เรียกเก่าไม่พัง)
--   ไม่แตะ ORDER BY ของ RUN-65 · Projection ของ RUN-66 · Pagination
--   ไม่แตะ Permission / RLS / SECURITY DEFINER / GRANT / Role
--   ไม่แตะ njacc_wht_export_page · njacc_save_wht_draft · njacc_post_wht ·
--          njacc_void_wht · njacc_wht_view · Reference No. · เล่มที่ · Print A4
--   ไม่แตะ has_acting_agent / agent_* (กระทำการแทน · ไม่กระทำการ · NJ TRANS)
--   ไม่แตะ DOCUMENT / ACCOUNTING / HR
--   ไม่สร้าง Index ใหม่ (ข้อมูลจริง 418 แถว — Planner ใช้ Seq Scan อยู่แล้ว)
--
-- ── เรื่อง ILIKE ────────────────────────────────────────────────────────────
--   ค้นบางส่วน + ไม่สนตัวพิมพ์ใหญ่/เล็ก -> ILIKE '%...%'
--   *** Escape % _ \ ที่ผู้ใช้พิมพ์ *** ไม่งั้นพิมพ์ % จะกลายเป็น "ตรงทุกแถว"
--   ค่าว่าง / ช่องว่างล้วน = ไม่กรอง (เหมือนไม่ได้ส่งมา)
--
-- idempotent : CREATE OR REPLACE · รันซ้ำได้ · รันก่อนหรือหลังอัปไฟล์ก็ได้
--   ยังไม่รัน -> หน้ารายการทำงานปกติ ช่องกรองถูกปิดพร้อมข้อความแจ้ง (ไม่พัง)
--   รันแล้ว   -> ช่องกรองทำงานครบ 4 ช่อง (ต้อง Reload หน้า 1 ครั้ง)
-- ═══════════════════════════════════════════════════════════════════════════


-- ══ 1. PREFLIGHT (READ ONLY — ไม่แก้อะไรทั้งสิ้น) ══════════════════════════
SELECT 'P1 มี njacc_list_wht overload 7 อาร์กิวเมนต์ (ตัวที่หน้ารายการใช้อยู่)' AS check_item,
  CASE WHEN to_regprocedure('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)') IS NOT NULL
  THEN 'PASS' ELSE 'STOP — ไม่พบ ให้แจ้งก่อน ห้ามเดา' END AS result
UNION ALL
SELECT 'P2 นิยามเดิมยังเป็นตัวที่ RUN-65 + RUN-66 ทำไว้ (ฐานที่คัดลอกมา)',
  CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)'::regprocedure))
         LIKE '%w.agent_address, w.has_acting_agent,%'
   AND (SELECT pg_get_functiondef('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)'::regprocedure))
         LIKE '%ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC%'
  THEN 'PASS' ELSE 'STOP — นิยามเปลี่ยนไปจากที่ตรวจไว้ ห้ามรันต่อ' END
UNION ALL
SELECT 'P3 คอลัมน์ที่ใช้กรองมีจริงครบ 4 ตัว',
  CASE WHEN (SELECT count(*) FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                AND column_name IN ('payer_name','payee_name','certificate_no','document_date')) = 4
  THEN 'PASS' ELSE 'STOP — คอลัมน์ไม่ครบ' END
UNION ALL
SELECT 'P4 document_date เป็นชนิด date จริง (ไม่ใช่ timestamp)',
  coalesce((SELECT data_type FROM information_schema.columns
             WHERE table_schema='public' AND table_name='njacc_withholding_docs'
               AND column_name='document_date'),'(ไม่พบ)')
UNION ALL
SELECT 'P5 จำนวนเอกสารทั้งหมดก่อนรัน (ต้องไม่เปลี่ยนหลังรัน)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs);


-- ══ 2. APPLY — ฟังก์ชันใหม่ njacc_list_wht_f (ไม่แตะ njacc_list_wht เดิม) ═══
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
        /* ── V.344 ── ตัวกรอง 4 ช่อง · ว่าง/ช่องว่างล้วน = ไม่กรอง
           escape % _ \ ที่ผู้ใช้พิมพ์ก่อนประกอบเป็น pattern ของ ILIKE */
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

  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from)
     AND (p_to IS NULL OR w.document_date<=p_to)
     AND (v_dir IS NULL OR w.direction=v_dir)
     AND (v_mode IS NULL OR coalesce(w.wht_mode,
            public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode)
     AND (v_payer_p IS NULL OR w.payer_name ILIKE v_payer_p)
     AND (v_payee_p IS NULL OR w.payee_name ILIKE v_payee_p)
     AND (v_cert_p  IS NULL OR w.certificate_no ILIKE v_cert_p)
     AND (p_cert_date IS NULL OR w.document_date = p_cert_date);

  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no, w.customer_id, w.invoice_id, w.reference_no,
           w.pay_date, w.note, w.certificate_no, w.direction, w.book_no, w.ref_date, w.job_no,
           w.payer_name, w.payer_tax_id, w.payee_name, w.payee_tax_id, w.form_type, w.pay_method,
           w.signer_name, w.invoice_no_text, w.payee_code, w.payment_by, w.payer_branch,
           w.payer_address, w.payee_branch, w.payee_address, w.payee_customer_id, w.agent_name,
           w.agent_tax_id, w.agent_branch, w.agent_address, w.has_acting_agent, w.form_seq, w.pay_method_other,
           w.signer_position, w.posted_at, w.payer_citizen_id, w.payee_citizen_id, w.payer_code,
           w.void_reason, w.voided_at,
           coalesce(w.wht_mode, public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) AS wht_mode,
           c.tax_id AS customer_tax_id, c.branch_code AS customer_branch_code,
           c.address AS customer_address, c.phone AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      LEFT JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from)
       AND (p_to IS NULL OR w.document_date<=p_to)
       AND (v_dir IS NULL OR w.direction=v_dir)
       AND (v_mode IS NULL OR coalesce(w.wht_mode,
              public.njacc_wht_mode_of(w.has_acting_agent, w.agent_name)) = v_mode)
       AND (v_payer_p IS NULL OR w.payer_name ILIKE v_payer_p)
       AND (v_payee_p IS NULL OR w.payee_name ILIKE v_payee_p)
       AND (v_cert_p  IS NULL OR w.certificate_no ILIKE v_cert_p)
       AND (p_cert_date IS NULL OR w.document_date = p_cert_date)
     ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC
     OFFSET v_off LIMIT v_size) t;

  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $fn$;

REVOKE ALL     ON FUNCTION public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date) TO authenticated;

-- PostgREST ต้องรีเฟรช schema cache ถึงจะเห็น overload ใหม่
NOTIFY pgrst, 'reload schema';


-- ══ 3. VERIFY (READ ONLY) ═════════════════════════════════════════════════
SELECT 'V1 njacc_list_wht เดิม (7 อาร์กิวเมนต์) ยังอยู่ครบ ไม่ถูกลบ/ไม่ถูกแก้' AS check_name,
  CASE WHEN to_regprocedure('public.njacc_list_wht(uuid,date,date,integer,integer,text,text)') IS NOT NULL
  THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'V2 ฟังก์ชันใหม่ njacc_list_wht_f (11 พารามิเตอร์) ถูกสร้างแล้ว',
  CASE WHEN to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)') IS NOT NULL
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V3 ORDER BY ของ RUN-65 เหมือนตัวเดิมเป๊ะ',
  CASE WHEN (SELECT pg_get_functiondef('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)'::regprocedure))
        LIKE '%ORDER BY public.njacc_natural_key(w.certificate_no) ASC NULLS LAST, w.document_date ASC, w.document_no ASC%'
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V4 Projection มี has_acting_agent + agent_* ครบ (RUN-66 ไม่หาย)',
  CASE WHEN (SELECT c LIKE '%w.has_acting_agent%' AND c LIKE '%w.agent_name%'
              AND c LIKE '%w.agent_tax_id%' AND c LIKE '%w.agent_branch%'
              AND c LIKE '%w.agent_address%'
        FROM (SELECT pg_get_functiondef('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)'::regprocedure) AS c) q)
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V5 Permission Guard เดิมครบ (module + can + SECURITY DEFINER)',
  CASE WHEN (SELECT c LIKE '%njacc_module_allowed%' AND c LIKE '%njacc_can%' AND c LIKE '%SECURITY DEFINER%'
        FROM (SELECT pg_get_functiondef('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)'::regprocedure) AS c) q)
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V6 GRANT ถูกต้อง (authenticated=EXECUTE · anon ไม่มีสิทธิ์)',
  CASE WHEN has_function_privilege('authenticated',
              to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)')::oid,'EXECUTE')
        AND NOT has_function_privilege('anon',
              to_regprocedure('public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date)')::oid,'EXECUTE')
  THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V7 จำนวนเอกสารทั้งหมดหลังรัน (ต้องเท่ากับ P5)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs)
UNION ALL SELECT 'V8 ไฟล์นี้ไม่มีคำสั่งทำลาย/แก้ไขข้อมูล',
  'PASS (static — มีเฉพาะ SELECT · CREATE OR REPLACE FUNCTION · REVOKE/GRANT · NOTIFY)';

-- V9 · เทียบผลจริงระหว่าง njacc_list_wht เดิม กับ njacc_list_wht_f (ไม่ใส่ตัวกรอง)
--      ต้องได้ total เท่ากันเป๊ะ = พฤติกรรมเดิมไม่เปลี่ยน  (READ ONLY)
--      *** ต้องประกาศตัวตนก่อน *** เพราะ SQL Editor ไม่มี JWT (เหมือน SET_DEPLOY_BUILD)
--      ใส่ auth_user_id ของตัวเอง :
--        Jamrat Phathep       (0001 · jamrat30)    f1edba74-b608-437d-9c82-aafa7bcf3b34
--        SOONTAREE TIRANUKUL  (0002 · soontaree30) 3d9b7b2b-5072-48e1-922d-7930bd85bc32
BEGIN;
SELECT set_config('request.jwt.claim.sub','f1edba74-b608-437d-9c82-aafa7bcf3b34', true);
SELECT 'V9a njacc_list_wht  เดิม  (ไม่ใส่ตัวกรอง)' AS check_name,
  (public.njacc_list_wht(NULL,NULL,NULL,1,20,'ACTING_AGENT','ACTING_AGENT')->>'total') AS total
UNION ALL SELECT 'V9b njacc_list_wht_f ใหม่ (ไม่ใส่ตัวกรอง) — ต้องเท่ากับ V9a',
  (public.njacc_list_wht_f(p_direction=>'ACTING_AGENT',p_mode=>'ACTING_AGENT')->>'total')
UNION ALL SELECT 'V9c แถวแรกของหน้า 1 (เดิม) — ลำดับต้องไม่เปลี่ยน',
  (public.njacc_list_wht(NULL,NULL,NULL,1,1,'ACTING_AGENT','ACTING_AGENT')->'rows'->0->>'certificate_no')
UNION ALL SELECT 'V9d แถวแรกของหน้า 1 (ใหม่) — ต้องเท่ากับ V9c',
  (public.njacc_list_wht_f(p_page=>1,p_size=>1,p_direction=>'ACTING_AGENT',p_mode=>'ACTING_AGENT')->'rows'->0->>'certificate_no')
UNION ALL SELECT 'V9e Escape % — พิมพ์ % ต้องไม่ตรงทุกแถว (ต้องได้ 0)',
  (public.njacc_list_wht_f(p_direction=>'ACTING_AGENT',p_mode=>'ACTING_AGENT',p_payer=>'%')->>'total')
UNION ALL SELECT 'V9f Escape _ — พิมพ์ _ ต้องไม่ตรงทุกแถว (ต้องได้ 0)',
  (public.njacc_list_wht_f(p_direction=>'ACTING_AGENT',p_mode=>'ACTING_AGENT',p_cert_no=>'_')->>'total')
UNION ALL SELECT 'V9g ช่องว่างล้วน = ไม่กรอง — ต้องเท่ากับ V9a',
  (public.njacc_list_wht_f(p_direction=>'ACTING_AGENT',p_mode=>'ACTING_AGENT',p_payer=>'   ',p_payee=>'   ',p_cert_no=>'   ')->>'total');
ROLLBACK;


-- ══ 4. RECOVERY NOTE ══════════════════════════════════════════════════════
-- ย้อนกลับ (Rollback) :
--   DROP FUNCTION public.njacc_list_wht_f(uuid,date,date,integer,integer,text,text,text,text,text,date);
--   *** เป็นการลบเฉพาะ overload ใหม่ที่ไฟล์นี้สร้าง *** ตัวเดิม 7 อาร์กิวเมนต์ไม่ถูกแตะ
--   ไม่ต้องกู้ข้อมูลใด ๆ เพราะไฟล์นี้ไม่เคยเขียน/ลบ/แก้ข้อมูลในตารางเลย
--   หลัง DROP ให้ NOTIFY pgrst, 'reload schema'; แล้วหน้ารายการจะถอยไปใช้ตัวเดิมเอง
--
-- ถ้ารันแล้วหน้าเว็บยังบอกว่าตัวกรองใช้ไม่ได้ :
--   = PostgREST ยังไม่เห็น overload ใหม่ -> รัน NOTIFY pgrst, 'reload schema'; ซ้ำ
--     แล้ว Reload หน้าเว็บ 1 ครั้ง (Frontend ตรวจครั้งเดียวต่อการเปิดหน้า)
