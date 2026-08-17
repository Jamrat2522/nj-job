-- ═══════════════════════════════════════════════════════════════════════════
-- 06_RUN-05_WHT_CERTIFICATE.sql
-- บันทึกหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) ที่ได้รับจากลูกค้า — Backend
--
-- *** ระบบนี้คือ "ทะเบียนรับ" ไม่ใช่ระบบที่ N.J. ออกหนังสือรับรอง ***
--     Customer = ผู้มีหน้าที่หักภาษี · ผู้จ่ายเงิน · ผู้ออกและลงนาม 50 ทวิ
--     N.J.     = ผู้ถูกหักภาษี · ผู้ได้รับหนังสือรับรอง · เป็นเพียงผู้บันทึกข้อมูล
--     สถานะ 'ISSUED' ในฐานข้อมูลคงชื่อเดิมไว้เพื่อ Compatibility
--     แต่ความหมายคือ "บันทึกจริงแล้ว / ได้รับเอกสารแล้ว" ไม่ใช่ "N.J. ออกเอกสาร"
--
-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  PRODUCTION: ALREADY APPLIED  (17/08/2026)                           ║
-- ║  *** DO NOT RUN AGAIN ***                                            ║
-- ║  VERIFY SECTION (SECTION 3) MAY BE RUN READ-ONLY                     ║
-- ╚══════════════════════════════════════════════════════════════════════╝
--
-- ไฟล์นี้เก็บไว้เพื่อ Reference / Fresh Install เท่านั้น
-- Production ปัจจุบันมีอ็อบเจกต์ทั้งหมดของไฟล์นี้ครบแล้ว (ตรวจสดยืนยันแล้ว) :
--     ตาราง njacc_wht_items · คอลัมน์ certificate_no / direction
--     status CHECK รองรับ DRAFT · RPC ใหม่ครบ 5 ตัว
--     njacc_create_wht ถูกปิด (authenticated = false)
--     njacc_list_wht คืน certificate_no
--
-- ถ้ารัน SECTION 2 ซ้ำ: PREFLIGHT จะไม่หยุด (ใช้ IF NOT EXISTS) แต่ไม่มีประโยชน์
-- และเสี่ยงเขียนทับฟังก์ชันโดยไม่จำเป็น -> *** ห้ามรันซ้ำ ***
--
-- ⚠️ ประวัติบั๊กของไฟล์นี้ (แก้แล้ว)
--    ตอนรันจริง SECTION 3 · V13 เคยขึ้น ERROR 42601:
--        subquery must return only one column
--    สาเหตุ: (a, b) IS DISTINCT FROM (SELECT x, y FROM ...)
--            PostgreSQL ไม่รับ row-comparison กับ subquery หลายคอลัมน์
--    VERIFY อยู่หลัง COMMIT -> MIGRATION สำเร็จ ไม่มีข้อมูลเสียหาย
--    ฉบับนี้แก้ V13 เป็น scalar subquery แยกคอลัมน์แล้ว · รันซ้ำได้ปลอดภัย
--
-- Dependency : ไม่ผูกกับไฟล์ 02 / 03 / 04 / 05
--
-- ═══════════════════════════════════════════════════════════════════════════
-- PRE-FLIGHT — สภาพจริงบน Production (ตรวจ 17/08/2026 · READ ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
--   ตาราง njacc_withholding_docs  มีอยู่แล้ว · 18 คอลัมน์ · *** 0 แถว ***
--     document_no · customer_id · invoice_id · payment_id · document_date ·
--     wht_type · tax_base · rate · amount · reference_no · attachment_path ·
--     status · created_by/at · voided_by/at · void_reason
--   RPC เดิม : njacc_create_wht(p, p_request_id) · njacc_list_wht(...) · njacc_void_wht(...)
--   เลขเอกสาร: njacc_next_doc_no('WHT', to_char(now(),'YYYY'), 'WHT'||YY||'-')
--              -> รูปแบบ WHT26-0001   *** มีระบบอยู่แล้ว ใช้ของเดิม ไม่ประดิษฐ์ใหม่ ***
--              counter doc_type='WHT' ยังไม่ถูกสร้าง (ยังไม่เคยออกเอกสาร)
--   status CHECK เดิม : ('ISSUED','VOID')   -> ไม่มี DRAFT
--
--   *** สิ่งที่ขาดและเป็นเหตุให้ต้องมีไฟล์นี้ ***
--     1) เก็บได้ 1 รายการต่อ 1 ใบเท่านั้น (tax_base/rate/amount เป็นคอลัมน์เดี่ยว)
--        -> ออกหนังสือรับรองที่มีหลายรายการเงินได้ไม่ได้
--     2) ไม่มีสถานะ DRAFT -> บันทึกร่างแล้วกลับมาแก้ก่อนออกจริงไม่ได้
--     3) njacc_list_wht ไม่คืน tax_id / branch_code / address / phone ของผู้ถูกหัก
--        และไม่คืน reference_no / invoice_id -> เอกสาร 50 ทวิ ประกอบไม่ครบ
--     4) ไม่มี RPC สำหรับเลือก Invoice มาอ้างอิงพร้อมอัตรา WHT จริง
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ทิศทางภาษี (สำคัญที่สุด) — RECEIVED WHT เท่านั้น
-- ═══════════════════════════════════════════════════════════════════════════
--   Business Flow เดิมของหน้านี้ผูกกับ Customer + Sales Invoice ของ N.J. :
--       N.J. ออก Invoice ขายบริการให้ Customer
--       -> Customer จ่ายเงิน และเป็นผู้ "หักภาษี ณ ที่จ่าย"
--       -> N.J. รับยอด Net (ยืนยันแล้วที่ njacc_invoice_net_receivable ใน RUN-03)
--       -> Customer ออกหนังสือรับรอง 50 ทวิ ให้ N.J.
--
--   ดังนั้นบทบาทที่ถูกต้องคือ
--       ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย  = Customer   (njacc_customers)
--       ข. ผู้ถูกหักภาษี ณ ที่จ่าย        = N.J.       (Company Config กลาง)
--   *** ห้ามสลับเป็น ผู้หัก = N.J. / ผู้ถูกหัก = Customer ***
--
--   คอลัมน์ direction ถูกเพิ่มและล็อกไว้ที่ 'RECEIVED' ด้วย CHECK
--   ถ้าอนาคตต้องการให้ N.J. เป็นผู้หัก (จ่ายให้ Supplier) ต้องมี migration ใหม่
--   และต้องมี Supplier/Vendor/AP Master จริงก่อน — ดูหัวข้อถัดไป
--
--   *** BACKEND REQUIRED — OUTBOUND WHT / SUPPLIER MASTER ***
--   ตรวจ information_schema แล้วยืนยันว่า Production "ไม่มี" ตารางใดที่เป็น
--   Supplier Master / Vendor Master / Accounts Payable / Supplier Invoice
--   (ที่ชื่อคล้ายเป็นของแอป HR และ mapping คนละระบบ ไม่ใช่เจ้าหนี้การค้า)
--   จึงยังทำ Flow Outbound ไม่ได้ในรอบนี้ และห้ามเอา Customer มาแทน Supplier
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ปิด Legacy Issuance Path
-- ═══════════════════════════════════════════════════════════════════════════
--   njacc_create_wht(p, p_request_id) เดิม:
--     - authenticated ยัง EXECUTE ได้จริง (ตรวจ has_function_privilege แล้ว = true)
--     - สร้างแถวสถานะ ISSUED ทันที ข้าม DRAFT/POST
--     - มี coalesce((p->>'rate')::numeric, 3)  <-- Default 3% ที่ต้องกำจัด
--   => มี 2 ทางออกเอกสาร ซึ่งขัดกับ Flow Final
--
--   ไฟล์นี้เลือกแนวทาง A : REVOKE EXECUTE จาก authenticated (และ anon/PUBLIC)
--   ไม่ DROP ฟังก์ชันทิ้ง เพื่อไม่ทำลายประวัติ/สิทธิ์ service_role ที่อาจมีการใช้เชิงระบบ
--   Final UI ไม่เรียกฟังก์ชันนี้แล้ว (ตรวจ withholding-api.js — เหลือไว้เพื่อความเข้ากันได้
--   แต่หน้าเว็บใหม่ไม่มีปุ่มใดเรียก)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- การตัดสินใจที่ต้องรู้ก่อนรัน
-- ═══════════════════════════════════════════════════════════════════════════
--   เลขเอกสาร : *** แยก 2 ชุดชัดเจน ***
--     document_no    = เลขบันทึกภายในของ N.J.  WHT{YY}-####  (ระบบเดิม)
--                      ใช้อ้างอิงในระบบ ไม่ใช่เลขบนหนังสือรับรองของ Customer
--     certificate_no = เลขหนังสือรับรองจริงที่ Customer เป็นผู้ออก
--                      *** ผู้ใช้กรอกเองเท่านั้น · ระบบไม่สร้างให้อัตโนมัติ ***
--                      เพราะ N.J. ไม่มีสิทธิ์ออกเลขในนามผู้หัก
--                      ปล่อยว่างได้ (บางใบยังไม่ได้รับเอกสารตัวจริง)
--     เอกสาร 50 ทวิ แสดง certificate_no เป็นเลขหลัก
--     และแสดง document_no เป็น "เลขอ้างอิงภายใน" แยกบรรทัด
--
--   เลขภายใน  : ใช้ของเดิม WHT{YY}-####  ไม่เปลี่ยนรูปแบบ
--     *** หมายเหตุ *** รูปแบบนี้ไม่เหมือนตระกูลใหม่ (NJ/RCP/CN/ADV {YYYYMM}-#####)
--     แต่โจทย์ระบุว่า "ถ้ามีระบบเลขอยู่แล้วให้ใช้ของเดิม" จึงไม่แตะ
--     ถ้าต้องการเปลี่ยนเป็น WHT{YYYYMM}-##### ให้สั่งแยกรอบ จะทำเป็น migration ต่างหาก
--     (เปลี่ยนได้ปลอดภัยตอนนี้เพราะยังมี 0 แถว และยังไม่มี counter)
--
--   สถานะ : เพิ่ม 'DRAFT' เข้า CHECK เดิม -> ('DRAFT','ISSUED','VOID')
--     *** ไม่สร้างสถานะ POSTED ใหม่ *** ใช้ 'ISSUED' เดิมเป็นสถานะ "ออกจริงแล้ว"
--     เพื่อไม่ให้ชนกับ Business Logic เดิมของ njacc_void_wht ที่อ้าง ISSUED อยู่
--     ต้อง DROP + ADD CHECK constraint (ตารางมี 0 แถว -> ไม่มีข้อมูลใดขัดกฎใหม่)
--     *** ไม่ใช่ DROP TABLE *** เป็นการเปลี่ยนกฎของคอลัมน์ status เท่านั้น
--
--   ร่างไม่กินเลขจริง : DRAFT ใช้ 'WHTDRAFT-'||left(id::text,8)
--     เลขจริงดึงตอน POST เท่านั้น ด้วย njacc_next_doc_no ตัวเดิม พารามิเตอร์เดิม
--     (นโยบายเดียวกับ Invoice DRAFT ใน migration 022 และ Credit Note)
--
-- ═══════════════════════════════════════════════════════════════════════════
-- ขอบเขต
-- ═══════════════════════════════════════════════════════════════════════════
--   สร้างใหม่ : ตาราง njacc_wht_items
--               RPC njacc_wht_invoice_options · njacc_save_wht_draft ·
--                   njacc_post_wht · njacc_wht_view · njacc_delete_wht_draft
--   แก้       : njacc_list_wht (READ PATH เท่านั้น · เพิ่มคีย์ · signature เดิม)
--               CHECK constraint ของ status
--               ALTER TABLE ADD COLUMN (additive ล้วน)
--   ไม่แตะ    : njacc_create_wht (RPC เดิมยังใช้ได้ · ไม่ลบ ไม่แก้)
--               njacc_void_wht · njacc_next_doc_no · njacc_invoices ·
--               njacc_invoice_items · njacc_receipts · njacc_credit_notes ·
--               njacc_customers · Permission · Role · RLS ของตารางอื่น
--   ไม่มี DROP TABLE / DELETE ข้อมูล / TRUNCATE / RESET SEQUENCE
--
--   *** ห้ามแก้ยอด Invoice ต้นฉบับจากหน้า 50 ทวิ ***
--   ทุก RPC ในไฟล์นี้อ่าน njacc_invoices / njacc_invoice_items อย่างเดียว
--   ไม่มี UPDATE/INSERT/DELETE ลงตารางเหล่านั้นแม้แต่บรรทัดเดียว
--
-- ROLLBACK :
--   ALTER TABLE public.njacc_withholding_docs DROP CONSTRAINT njacc_wht_status_ck;
--   ALTER TABLE public.njacc_withholding_docs
--     ADD CONSTRAINT njacc_wht_status_ck CHECK (status IN ('ISSUED','VOID'));
--   DROP TABLE public.njacc_wht_items;
--   ALTER TABLE public.njacc_withholding_docs
--     DROP COLUMN pay_date, DROP COLUMN note, DROP COLUMN posted_at, DROP COLUMN posted_by,
--     DROP COLUMN draft_saved_at, DROP COLUMN draft_saved_by, DROP COLUMN updated_at;
--   DROP FUNCTION njacc_wht_invoice_options(jsonb) / njacc_save_wht_draft(jsonb) /
--                 njacc_post_wht(uuid,text) / njacc_wht_view(uuid) /
--                 njacc_delete_wht_draft(uuid,text);
--   + CREATE OR REPLACE njacc_list_wht จาก sql/005_njacc_rpc.sql
--   + GRANT EXECUTE ON FUNCTION public.njacc_create_wht(jsonb,text) TO authenticated;
--     (ถ้าต้องการเปิด Legacy Path กลับ — ไม่แนะนำ)
--   + ALTER TABLE public.njacc_withholding_docs DROP CONSTRAINT njacc_wht_direction_ck,
--     DROP COLUMN certificate_no, DROP COLUMN direction;
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
DECLARE v_rows int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema='public' AND table_name='njacc_withholding_docs') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_withholding_docs'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_next_doc_no') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_next_doc_no'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_invoice_items'
                    AND column_name='wht_rate') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_items.wht_rate (ต้องรัน 018 ก่อน)';
  END IF;
  SELECT count(*) INTO v_rows FROM public.njacc_withholding_docs;
  IF v_rows > 0 THEN
    RAISE WARNING 'มีเอกสารหัก ณ ที่จ่ายอยู่แล้ว % ใบ — เอกสารเดิมจะกลายเป็นสถานะ ISSUED ตามเดิม และไม่มีรายการย่อย (items) ระบบจะถอยไปแสดงจาก tax_base/rate/amount ของหัวใบ', v_rows;
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

SELECT 'P1 ข้อมูลก่อนแก้' AS check_name,
       (SELECT count(*) FROM public.njacc_withholding_docs)                       AS wht_docs,
       (SELECT count(*) FROM public.njacc_withholding_docs WHERE status='ISSUED') AS issued,
       coalesce((SELECT last_number::text FROM public.njacc_document_sequences
                  WHERE doc_type='WHT' LIMIT 1),'(ยังไม่มี counter)')             AS wht_counter,
       (SELECT count(*) FROM public.njacc_invoices)                               AS invoices;

SELECT 'P2 อัตรา WHT จริงในระบบ' AS check_name,
       coalesce(wht_rate,0) AS wht_rate, count(*) AS item_lines
  FROM public.njacc_invoice_items WHERE coalesce(wht_amount,0) <> 0
 GROUP BY coalesce(wht_rate,0) ORDER BY 2;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ══ 2.1 · คอลัมน์เพิ่ม (additive ล้วน · ไม่แตะคอลัมน์เดิม) ═════════════════
ALTER TABLE public.njacc_withholding_docs
  /* เลขหนังสือรับรองจริงที่ Customer (ผู้หัก) เป็นผู้ออก — ผู้ใช้กรอกเอง ไม่ auto-gen */
  ADD COLUMN IF NOT EXISTS certificate_no text,
  /* ทิศทางภาษี — ล็อก RECEIVED ไว้ก่อน (Customer หัก · N.J. ถูกหัก)
     OUTBOUND ต้องมี Supplier Master จริงก่อน ซึ่ง Production ยังไม่มี */
  ADD COLUMN IF NOT EXISTS direction      text NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN IF NOT EXISTS pay_date       date,          /* วันที่จ่ายเงิน (ระดับใบ) */
  ADD COLUMN IF NOT EXISTS note           text,
  ADD COLUMN IF NOT EXISTS posted_at      timestamptz,
  ADD COLUMN IF NOT EXISTS posted_by      uuid REFERENCES public.njacc_profiles(id),
  ADD COLUMN IF NOT EXISTS draft_saved_at timestamptz,
  ADD COLUMN IF NOT EXISTS draft_saved_by uuid REFERENCES public.njacc_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

-- ══ 2.2 · สถานะ DRAFT ═══════════════════════════════════════════════════════
--   เปลี่ยนกฎของคอลัมน์ status เท่านั้น · ไม่แตะข้อมูล · ไม่ DROP TABLE
ALTER TABLE public.njacc_withholding_docs DROP CONSTRAINT IF EXISTS njacc_wht_status_ck;
ALTER TABLE public.njacc_withholding_docs
  ADD CONSTRAINT njacc_wht_status_ck CHECK (status IN ('DRAFT','ISSUED','VOID'));

/* ทิศทางภาษี — รอบนี้รองรับเฉพาะ RECEIVED
   ถ้าจะเปิด OUTBOUND ต้องแก้ CHECK นี้พร้อมสร้าง Supplier Master ในรอบแยก */
ALTER TABLE public.njacc_withholding_docs DROP CONSTRAINT IF EXISTS njacc_wht_direction_ck;
ALTER TABLE public.njacc_withholding_docs
  ADD CONSTRAINT njacc_wht_direction_ck CHECK (direction IN ('RECEIVED'));

/* เลขหนังสือรับรองของผู้หักรายเดียวกันต้องไม่ซ้ำ — ต่างผู้หักซ้ำกันได้ (คนละผู้ออก) */
CREATE UNIQUE INDEX IF NOT EXISTS njacc_wht_cert_no_uq
  ON public.njacc_withholding_docs (customer_id, certificate_no)
  WHERE certificate_no IS NOT NULL AND status <> 'VOID';

/* 1 ใบแจ้งหนี้ = ร่างค้างได้ 1 ใบ (นโยบายเดียวกับ Invoice/Credit Note)
   ใบที่ไม่ผูก invoice_id ไม่ถูกจำกัด */
CREATE UNIQUE INDEX IF NOT EXISTS njacc_wht_draft_per_invoice_uq
  ON public.njacc_withholding_docs (invoice_id)
  WHERE status='DRAFT' AND invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS njacc_wht_status_ix
  ON public.njacc_withholding_docs (status, document_date DESC);

DROP TRIGGER IF EXISTS njacc_wht_touch ON public.njacc_withholding_docs;
CREATE TRIGGER njacc_wht_touch BEFORE UPDATE ON public.njacc_withholding_docs
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();

-- ══ 2.3 · รายการเงินได้ (หลายรายการต่อ 1 ใบ) ═══════════════════════════════
CREATE TABLE IF NOT EXISTS public.njacc_wht_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wht_id      uuid NOT NULL REFERENCES public.njacc_withholding_docs(id) ON DELETE CASCADE,
  line_no     int  NOT NULL,
  pay_date    date,                                   /* วันที่จ่ายของรายการนั้น */
  income_type text NOT NULL,                          /* ประเภทเงินได้ */
  description text,
  tax_base    numeric(14,2) NOT NULL DEFAULT 0,       /* จำนวนเงินที่จ่าย */
  rate        numeric(6,2)  NOT NULL DEFAULT 0,       /* อัตราหัก % */
  amount      numeric(14,2) NOT NULL DEFAULT 0,       /* ภาษีที่หัก = base × rate/100 */
  CONSTRAINT njacc_wi_line_uq   UNIQUE (wht_id, line_no),
  CONSTRAINT njacc_wi_lineno_ck CHECK (line_no > 0),
  CONSTRAINT njacc_wi_amount_ck CHECK (tax_base > 0 AND rate >= 0 AND amount >= 0)
);
CREATE INDEX IF NOT EXISTS njacc_wi_doc_ix ON public.njacc_wht_items (wht_id, line_no);

ALTER TABLE public.njacc_wht_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.njacc_wht_items FROM anon, authenticated;
/* เข้าถึงได้ผ่าน RPC (SECURITY DEFINER) เท่านั้น — รูปแบบเดียวกับตารางอื่นในระบบ */

-- ══ 2.4 · เลือก Invoice มาอ้างอิง (พร้อมอัตรา WHT จริง) ════════════════════
--   READ ONLY ล้วน · ไม่แก้ Invoice ใด ๆ
CREATE OR REPLACE FUNCTION public.njacc_wht_invoice_options(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles;
        v_cus  uuid := nullif(p->>'customer_id','')::uuid;
        v_q    text := nullif(btrim(coalesce(p->>'q','')), '');
        v_page int  := greatest(coalesce((p->>'page')::int,1),1);
        v_size int  := least(greatest(coalesce((p->>'size')::int,20),1),100);
        v_total int; v_rows jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  SELECT count(*)::int INTO v_total
    FROM public.njacc_invoices i JOIN public.njacc_customers c ON c.id=i.customer_id
   WHERE i.status IN ('ISSUED','POSTED')
     AND (v_cus IS NULL OR i.customer_id = v_cus)
     AND (v_q IS NULL OR i.invoice_no ILIKE '%'||v_q||'%' OR c.customer_name ILIKE '%'||v_q||'%');

  SELECT coalesce(jsonb_agg(t ORDER BY t->>'invoice_date' DESC, t->>'invoice_no' DESC),'[]'::jsonb)
    INTO v_rows FROM (
    SELECT jsonb_build_object(
      'id', i.id, 'invoice_no', i.invoice_no, 'invoice_date', i.invoice_date,
      'customer_id', i.customer_id, 'customer_name', c.customer_name,
      'charge_type', i.charge_type, 'status', i.status,
      'subtotal', i.subtotal, 'vat_amount', i.vat_amount, 'total_amount', i.total_amount,
      'wht_amount', coalesce(i.wht_amount,0),
      /* อัตรา WHT จริงรายบรรทัด — 1 ใบมีได้หลายอัตรา · ไม่ hardcode 3 */
      'wht_breakdown', (
         SELECT coalesce(jsonb_agg(jsonb_build_object(
                  'rate', b.rate, 'tax_base', b.base, 'amount', b.amt,
                  'description', b.dsc) ORDER BY b.rate),'[]'::jsonb)
           FROM (SELECT coalesce(x.wht_rate,0) AS rate,
                        round(sum(x.amount),2)     AS base,
                        round(sum(x.wht_amount),2) AS amt,
                        string_agg(x.description, ', ' ORDER BY x.line_no) AS dsc
                   FROM public.njacc_invoice_items x
                  WHERE x.invoice_id = i.id AND coalesce(x.wht_amount,0) <> 0
                  GROUP BY coalesce(x.wht_rate,0)) b),
      'description', (SELECT string_agg(x.description, ', ' ORDER BY x.line_no)
                        FROM public.njacc_invoice_items x WHERE x.invoice_id=i.id),
      /* ── วันที่จ่ายเงินจริง (ห้ามใช้ invoice_date แทน) ──
         มาจาก njacc_payments.payment_date ผ่าน njacc_payment_allocations
         นับเฉพาะ payment ที่ status='POSTED' (VOID ไม่นับ)
         ไม่มี payment -> payments=[] และ payment_date=null
                         -> ผู้ใช้ต้องกรอกวันที่จ่ายเองก่อนบันทึกจริง
         มีหลาย payment -> คืนทั้งรายการให้ผู้ใช้เลือก *** ไม่เดาว่าจะเอาวันไหน ***
                           payment_date จะเป็น null เมื่อมีมากกว่า 1 รายการ */
      'payments', (
         SELECT coalesce(jsonb_agg(jsonb_build_object(
                  'payment_id', pm.id, 'payment_no', pm.payment_no,
                  'payment_date', pm.payment_date,
                  'allocated_amount', pa.allocated_amount,
                  'receipt_no', (SELECT r.receipt_no FROM public.njacc_receipts r
                                  WHERE r.payment_id = pm.id AND r.status <> 'VOID' LIMIT 1))
                ORDER BY pm.payment_date, pm.payment_no), '[]'::jsonb)
           FROM public.njacc_payment_allocations pa
           JOIN public.njacc_payments pm ON pm.id = pa.payment_id AND pm.status = 'POSTED'
          WHERE pa.invoice_id = i.id),
      'payment_date', (
         SELECT CASE WHEN count(*) = 1 THEN min(pm.payment_date) ELSE NULL END
           FROM public.njacc_payment_allocations pa
           JOIN public.njacc_payments pm ON pm.id = pa.payment_id AND pm.status = 'POSTED'
          WHERE pa.invoice_id = i.id)) AS t
      FROM public.njacc_invoices i JOIN public.njacc_customers c ON c.id=i.customer_id
     WHERE i.status IN ('ISSUED','POSTED')
       AND (v_cus IS NULL OR i.customer_id = v_cus)
       AND (v_q IS NULL OR i.invoice_no ILIKE '%'||v_q||'%' OR c.customer_name ILIKE '%'||v_q||'%')
     ORDER BY i.invoice_date DESC, i.invoice_no DESC
     OFFSET (v_page-1)*v_size LIMIT v_size) s;

  RETURN jsonb_build_object('total',v_total,'page',v_page,'size',v_size,'rows',v_rows);
END $fn$;

-- ══ 2.5 · บันทึกร่าง (รองรับหลายรายการ) ════════════════════════════════════
--   p = { wht_id?, customer_id, certificate_no?, document_date?, pay_date?, wht_type?,
--         invoice_id?, reference_no?, note?,
--         items:[{pay_date, income_type, description, tax_base, rate}] }
--   customer_id = ผู้มีหน้าที่หักภาษี (Customer/ผู้จ่ายเงิน) — ไม่ใช่ผู้ถูกหัก
--   certificate_no = เลขหนังสือรับรองจริงของ Customer · ระบบไม่สร้างให้
--   amount ของแต่ละบรรทัด และยอดรวมหัวใบ คำนวณที่ SQL ทั้งหมด
--   *** ไม่รับ total จากฝั่ง Browser *** ยอดรวมผูกกับรายการเสมอ
CREATE OR REPLACE FUNCTION public.njacc_save_wht_draft(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs;
        v_id   uuid := nullif(p->>'wht_id','')::uuid;
        v_cus  uuid := (p->>'customer_id')::uuid;
        v_inv  uuid := nullif(p->>'invoice_id','')::uuid;
        v_date date := coalesce(nullif(p->>'document_date','')::date, current_date);
        v_pay  date := nullif(p->>'pay_date','')::date;
        v_cert text := nullif(btrim(coalesce(p->>'certificate_no','')), '');
        it jsonb; v_line int := 0;
        v_base numeric; v_rate numeric; v_amt numeric;
        v_tbase numeric := 0; v_tamt numeric := 0; v_maxrate numeric := 0;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','issue_receipt') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  /* v_cus = ลูกค้าผู้หักภาษี (ผู้จ่ายเงิน) — ไม่ใช่ผู้ถูกหัก */
  IF v_cus IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_CUSTOMER_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.njacc_customers WHERE id=v_cus) THEN
    RAISE EXCEPTION 'NJACC_WHT_CUSTOMER_NOT_FOUND'; END IF;
  IF jsonb_typeof(p->'items') <> 'array' OR jsonb_array_length(p->'items') = 0 THEN
    RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  /* Invoice ที่อ้างอิงต้องเป็นของลูกค้ารายเดียวกัน — กันอ้างข้ามลูกค้า */
  IF v_inv IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.njacc_invoices
                    WHERE id=v_inv AND customer_id=v_cus) THEN
      RAISE EXCEPTION 'NJACC_WHT_INVOICE_MISMATCH'; END IF;
  END IF;

  IF v_id IS NULL AND v_inv IS NOT NULL THEN
    SELECT id INTO v_id FROM public.njacc_withholding_docs
     WHERE invoice_id=v_inv AND status='DRAFT' LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.njacc_withholding_docs(
        document_no, certificate_no, direction, customer_id, invoice_id,
        document_date, pay_date,
        wht_type, reference_no, note, status, tax_base, rate, amount,
        created_by, draft_saved_at, draft_saved_by)
    VALUES ('WHTDRAFT-TMP', v_cert, 'RECEIVED', v_cus, v_inv, v_date, v_pay,
            p->>'wht_type', nullif(btrim(coalesce(p->>'reference_no','')),''),
            nullif(btrim(coalesce(p->>'note','')),''), 'DRAFT', 0, 0, 0,
            pr.id, now(), pr.id)
    RETURNING id INTO v_id;
    /* เลขชั่วคราวอิง uuid ของแถวเอง -> UNIQUE ไม่ชน และไม่กินเลขจริง */
    UPDATE public.njacc_withholding_docs
       SET document_no = 'WHTDRAFT-'||left(v_id::text,8) WHERE id=v_id;
  ELSE
    SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=v_id FOR UPDATE;
    IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;
    IF w.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_WHT_NOT_DRAFT'; END IF;
    UPDATE public.njacc_withholding_docs
       SET customer_id=v_cus, invoice_id=v_inv, certificate_no=v_cert,
           document_date=v_date, pay_date=v_pay,
           wht_type=p->>'wht_type',
           reference_no=nullif(btrim(coalesce(p->>'reference_no','')),''),
           note=nullif(btrim(coalesce(p->>'note','')),''),
           draft_saved_at=now(), draft_saved_by=pr.id
     WHERE id=v_id;
    DELETE FROM public.njacc_wht_items WHERE wht_id=v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    v_base := round(coalesce((it->>'tax_base')::numeric,0),2);
    /* *** อัตราต้องถูกส่งมาชัดเจนเสมอ *** ไม่มี default 3% ไม่มี default ใด ๆ
       ไม่ส่ง rate มา -> โยน error ให้ผู้ใช้ระบุเอง ดีกว่าคิดภาษีผิดเงียบ ๆ */
    IF (it ? 'rate') = false OR nullif(btrim(coalesce(it->>'rate','')),'') IS NULL THEN
      RAISE EXCEPTION 'NJACC_WHT_RATE_REQUIRED'; END IF;
    v_rate := (it->>'rate')::numeric;
    IF v_base <= 0 THEN RAISE EXCEPTION 'NJACC_WHT_BASE_INVALID'; END IF;
    IF v_rate < 0 OR v_rate > 100 THEN RAISE EXCEPTION 'NJACC_BAD_TAX_RATE'; END IF;
    v_amt  := round(v_base * v_rate / 100, 2);
    v_line := v_line + 1;

    /* *** วันที่จ่ายเงินจริงเท่านั้น ***
       ห้าม fallback เป็น document_date (คนละความหมาย)
       ไม่ระบุทั้งบรรทัดและหัวใบ -> ปล่อย NULL ไว้ในร่าง
       แล้วบล็อกตอนบันทึกจริงที่ njacc_post_wht */
    INSERT INTO public.njacc_wht_items(
        wht_id, line_no, pay_date, income_type, description, tax_base, rate, amount)
    VALUES (v_id, v_line,
            coalesce(nullif(it->>'pay_date','')::date, v_pay),
            coalesce(nullif(btrim(coalesce(it->>'income_type','')),''),'OTHER'),
            nullif(btrim(coalesce(it->>'description','')),''),
            v_base, v_rate, v_amt);

    v_tbase := round(v_tbase + v_base, 2);
    v_tamt  := round(v_tamt + v_amt, 2);
    IF v_rate > v_maxrate THEN v_maxrate := v_rate; END IF;
  END LOOP;

  /* หัวใบเก็บยอดรวมของรายการเสมอ -> ตัวเลขบนหัวกับรายการไม่มีทางไม่ตรงกัน
     rate บนหัวใบเป็นค่าอ้างอิง (อัตราสูงสุดที่ใช้) — เอกสารจริงแสดงรายบรรทัด */
  UPDATE public.njacc_withholding_docs
     SET tax_base=v_tbase, amount=v_tamt, rate=v_maxrate WHERE id=v_id;

  PERFORM public.njacc_audit(pr.id,'SAVE_WHT_DRAFT','wht',v_id::text,
    jsonb_build_object('lines',v_line,'tax_base',v_tbase,'amount',v_tamt,'invoice_id',v_inv));

  RETURN jsonb_build_object('id',v_id,'status','DRAFT',
    'document_no',(SELECT document_no FROM public.njacc_withholding_docs WHERE id=v_id),
    'tax_base',v_tbase,'amount',v_tamt,'lines',v_line);
END $fn$;

-- ══ 2.6 · POST — ออกเลขจริงด้วยระบบเดิม WHT{YY}-#### ═══════════════════════
CREATE OR REPLACE FUNCTION public.njacc_post_wht(p_id uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs; v_prev uuid;
        v_no text; v_cnt int; v_reused boolean := false;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','issue_receipt') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_prev := public.njacc_idem_check(p_request_id,'POST_WHT',pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id',v_prev,'idempotent',true,
      'document_no',(SELECT document_no FROM public.njacc_withholding_docs WHERE id=v_prev),
      'status',(SELECT status FROM public.njacc_withholding_docs WHERE id=v_prev));
  END IF;

  SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=p_id FOR UPDATE;
  IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;
  IF w.status='ISSUED' THEN RAISE EXCEPTION 'NJACC_WHT_ALREADY_ISSUED'; END IF;
  IF w.status<>'DRAFT' THEN RAISE EXCEPTION 'NJACC_WHT_NOT_DRAFT'; END IF;
  SELECT count(*) INTO v_cnt FROM public.njacc_wht_items WHERE wht_id=w.id;
  IF v_cnt=0 THEN RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  /* ── วันที่จ่ายเงินจริงต้องครบก่อนบันทึกจริง (ข้อ 5) ──
     หัวใบต้องมี pay_date และทุกบรรทัดต้องมีวันที่จ่ายของตัวเอง
     บังคับที่ SQL ไม่ใช่แค่หน้าจอ */
  IF w.pay_date IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_PAY_DATE_REQUIRED'; END IF;
  IF EXISTS (SELECT 1 FROM public.njacc_wht_items x
              WHERE x.wht_id=w.id AND x.pay_date IS NULL) THEN
    RAISE EXCEPTION 'NJACC_WHT_ITEM_PAY_DATE_REQUIRED'; END IF;

  /* เคยได้เลขจริงแล้วใช้เลขเดิม · ยังไม่เคย -> ดึงด้วยระบบเดิมของ WHT ตัวเดิม */
  IF w.document_no IS NOT NULL AND w.document_no NOT LIKE 'WHTDRAFT-%' THEN
    v_no := w.document_no; v_reused := true;
  ELSE
    v_no := public.njacc_next_doc_no('WHT', to_char(now(),'YYYY'), 'WHT'||to_char(now(),'YY')||'-');
  END IF;

  UPDATE public.njacc_withholding_docs
     SET document_no=v_no, status='ISSUED', posted_at=now(), posted_by=pr.id
   WHERE id=w.id;

  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'POST_WHT',pr.id,'wht',w.id);
  PERFORM public.njacc_audit(pr.id,'POST_WHT','wht',w.id::text,
    jsonb_build_object('document_no',v_no,'amount',w.amount,'reused_number',v_reused));

  RETURN jsonb_build_object('id',w.id,'document_no',v_no,'status','ISSUED','reused_number',v_reused);
END $fn$;

-- ══ 2.7 · ดูเอกสาร 50 ทวิ (ใช้ทั้ง Preview / Print / PDF) ══════════════════
CREATE OR REPLACE FUNCTION public.njacc_wht_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=p_id;
  IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;

  SELECT to_jsonb(w) || jsonb_build_object(
    /* ── ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย = Customer / ผู้จ่ายเงิน ──
       N.J. เป็นผู้ขายและเป็น "ผู้ถูกหัก" (ประกอบจาก Company Config ที่ฝั่ง Renderer)
       *** ห้ามสลับบทบาท *** */
    'payer', (SELECT jsonb_build_object('id',c.id,'name',c.customer_name,'code',c.customer_code,
        'tax_id',c.tax_id,'branch_code',c.branch_code,'address',c.address,'phone',c.phone)
       FROM public.njacc_customers c WHERE c.id=w.customer_id),
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

-- ══ 2.8 · รายการหน้า REPORT (READ PATH · signature เดิมทุกตัว) ═════════════
CREATE OR REPLACE FUNCTION public.njacc_list_wht(
  p_customer uuid DEFAULT NULL::uuid, p_from date DEFAULT NULL::date,
  p_to date DEFAULT NULL::date, p_page integer DEFAULT 1, p_size integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,20),1),100);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  SELECT count(*) INTO v_total FROM public.njacc_withholding_docs w
   WHERE (p_customer IS NULL OR w.customer_id=p_customer)
     AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to);
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT w.id, w.document_no, w.document_date, w.wht_type, w.tax_base, w.rate, w.amount,
           w.status, c.customer_name, i.invoice_no,
           /* ── เพิ่ม: ใช้ในหน้ารายการและปุ่มจัดการ ── */
           w.customer_id, w.invoice_id, w.reference_no, w.pay_date, w.note,
           w.certificate_no, w.direction,
           c.tax_id      AS customer_tax_id,
           c.branch_code AS customer_branch_code,
           c.address     AS customer_address,
           c.phone       AS customer_phone,
           (SELECT count(*) FROM public.njacc_wht_items x WHERE x.wht_id=w.id) AS item_count
      FROM public.njacc_withholding_docs w
      JOIN public.njacc_customers c ON c.id=w.customer_id
      LEFT JOIN public.njacc_invoices i ON i.id=w.invoice_id
     WHERE (p_customer IS NULL OR w.customer_id=p_customer)
       AND (p_from IS NULL OR w.document_date>=p_from) AND (p_to IS NULL OR w.document_date<=p_to)
     ORDER BY w.document_date DESC, w.document_no DESC OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows);
END $fn$;

-- ══ 2.9 · ลบร่าง (เฉพาะ DRAFT) ═════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.njacc_delete_wht_draft(p_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; w public.njacc_withholding_docs;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','issue_receipt') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  SELECT * INTO w FROM public.njacc_withholding_docs WHERE id=p_id FOR UPDATE;
  IF w.id IS NULL THEN RAISE EXCEPTION 'NJACC_WHT_NOT_FOUND'; END IF;
  IF w.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_WHT_NOT_DRAFT'; END IF;
  PERFORM public.njacc_audit(pr.id,'DELETE_WHT_DRAFT','wht',w.id::text,
    jsonb_build_object('reason',p_reason,'amount',w.amount));
  /* ลบเฉพาะ "ร่าง" ที่ยังไม่เคยออกเลขจริง · items ตามด้วย ON DELETE CASCADE
     ไม่แตะ Invoice ต้นฉบับ และไม่แตะใบที่ ISSUED แล้ว */
  DELETE FROM public.njacc_withholding_docs WHERE id=w.id;
  RETURN jsonb_build_object('id',w.id,'deleted',true);
END $fn$;

-- ══ 2.10 · GRANT — authenticated เท่านั้น · anon เรียกไม่ได้ ═══════════════
REVOKE ALL ON FUNCTION public.njacc_wht_invoice_options(jsonb)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_save_wht_draft(jsonb)       FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_post_wht(uuid, text)        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_wht_view(uuid)              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_delete_wht_draft(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.njacc_wht_invoice_options(jsonb)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_save_wht_draft(jsonb)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_post_wht(uuid, text)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_wht_view(uuid)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_delete_wht_draft(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_list_wht(uuid,date,date,integer,integer) TO authenticated;

-- ══ 2.11 · ปิด Legacy Issuance Path (ข้อ 6) ════════════════════════════════
--   njacc_create_wht เดิมสร้างแถว ISSUED ทันที ข้าม DRAFT/POST
--   และมี coalesce(rate, 3) ซึ่งเป็น Default 3% ที่ต้องกำจัด
--   ตรวจ Production แล้ว authenticated ยัง EXECUTE ได้จริง -> ต้องปิด
--
--   *** ไม่ DROP ฟังก์ชัน *** เพื่อไม่ทำลายประวัติและสิทธิ์ service_role
--   เพียงถอนสิทธิ์ผู้ใช้ปลายทาง -> เหลือทางออกเอกสารทางเดียวคือ
--   njacc_save_wht_draft -> njacc_post_wht
REVOKE EXECUTE ON FUNCTION public.njacc_create_wht(jsonb, text)
  FROM authenticated, anon, PUBLIC;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 ตาราง njacc_wht_items' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                          WHERE table_schema='public' AND table_name='njacc_wht_items')
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 คอลัมน์ใหม่ครบ 7',
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name IN ('pay_date','note','posted_at','posted_by',
                                         'draft_saved_at','draft_saved_by','updated_at')) = 7
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 status รองรับ DRAFT/ISSUED/VOID',
       CASE WHEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conname='njacc_wht_status_ck') LIKE '%DRAFT%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 RPC ใหม่ครบ 5',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_wht_invoice_options','njacc_save_wht_draft',
                                       'njacc_post_wht','njacc_wht_view',
                                       'njacc_delete_wht_draft')) = 5
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 list_wht คืนข้อมูลผู้ถูกหักครบ',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%customer_tax_id%'
                    AND pg_get_functiondef(p.oid) LIKE '%customer_branch_code%'
                    AND pg_get_functiondef(p.oid) LIKE '%customer_address%'
                    AND pg_get_functiondef(p.oid) LIKE '%item_count%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_list_wht')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 DRAFT ไม่กินเลขจริง (WHTDRAFT-)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%WHTDRAFT-%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_wht_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 POST ใช้ระบบเลขเดิม njacc_next_doc_no(''WHT'')',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%njacc_next_doc_no(''WHT''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_post_wht')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 ไม่มี RPC ใดเขียนลง njacc_invoices / njacc_invoice_items',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_wht_invoice_options','njacc_save_wht_draft',
                                       'njacc_post_wht','njacc_wht_view',
                                       'njacc_delete_wht_draft','njacc_list_wht')
                     AND (pg_get_functiondef(p.oid) ~* 'UPDATE\s+public\.njacc_invoice'
                       OR pg_get_functiondef(p.oid) ~* 'INSERT\s+INTO\s+public\.njacc_invoice'
                       OR pg_get_functiondef(p.oid) ~* 'DELETE\s+FROM\s+public\.njacc_invoice')) = 0
            THEN 'PASS' ELSE 'FAIL — มี RPC แก้ Invoice ต้นฉบับ' END
UNION ALL
SELECT 'V9 SECURITY DEFINER + search_path ครบ',
       CASE WHEN (SELECT bool_and(p.prosecdef AND p.proconfig::text LIKE '%search_path%')
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public'
                     AND p.proname IN ('njacc_wht_invoice_options','njacc_save_wht_draft',
                                       'njacc_post_wht','njacc_wht_view',
                                       'njacc_delete_wht_draft','njacc_list_wht'))
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V10 anon เรียกไม่ได้',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname LIKE 'njacc_%wht%'
                     AND has_function_privilege('anon',p.oid,'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11 RLS เปิดบน njacc_wht_items · 0 policy',
       CASE WHEN (SELECT c.relrowsecurity
                    AND (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid=c.oid)=0
                    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname='public' AND c.relname='njacc_wht_items')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11a คอลัมน์ certificate_no + direction',
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                     AND column_name IN ('certificate_no','direction')) = 2
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11b direction ล็อกไว้ที่ RECEIVED',
       CASE WHEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conname='njacc_wht_direction_ck') LIKE '%RECEIVED%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11c wht_view คืน payer (ผู้หัก = Customer)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%''payer''%'
                    AND pg_get_functiondef(p.oid) NOT LIKE '%''payee'', (SELECT%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_wht_view')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11d ไม่มี Default 3% ใน save_wht_draft',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%NJACC_WHT_RATE_REQUIRED%'
                    AND pg_get_functiondef(p.oid) NOT LIKE '%''rate'')::numeric,3)%'
                    AND pg_get_functiondef(p.oid) NOT LIKE '%''rate'')::numeric, 3)%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_wht_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11e *** Legacy njacc_create_wht ถูกปิด ***',
       CASE WHEN (SELECT NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
                    AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_create_wht')
            THEN 'PASS' ELSE 'FAIL — ยังมี 2 ทางออกเอกสาร' END
UNION ALL
SELECT 'V11f invoice_options คืน payment_date จาก Payment จริง',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%njacc_payment_allocations%'
                    AND pg_get_functiondef(p.oid) LIKE '%pm.payment_date%'
                    AND pg_get_functiondef(p.oid) LIKE '%''payments''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_wht_invoice_options')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11g post_wht บังคับวันที่จ่ายเงินจริง',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%NJACC_WHT_PAY_DATE_REQUIRED%'
                    AND pg_get_functiondef(p.oid) LIKE '%NJACC_WHT_ITEM_PAY_DATE_REQUIRED%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_post_wht')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V11h save_draft ไม่ fallback pay_date เป็น document_date',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) NOT LIKE '%it->>''pay_date'')::date, v_pay, v_date%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_wht_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V12 njacc_create_wht เดิมยังอยู่ (ไม่ลบของเก่า)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_create_wht')
            THEN 'PASS' ELSE 'FAIL' END;

-- V13 · หัวใบต้องเท่ากับผลรวมรายการเสมอ
--   *** เขียนด้วย scalar subquery แยกคอลัมน์ ***
--   ห้ามใช้รูปแบบ  (a, b) IS DISTINCT FROM (SELECT x, y FROM ...)
--   PostgreSQL ไม่รับ row-comparison กับ subquery หลายคอลัมน์
--   -> ERROR 42601: subquery must return only one column
SELECT 'V13 หัวใบ = ผลรวมรายการ' AS check_name,
       count(*) AS mismatched,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_withholding_docs w
 WHERE EXISTS (SELECT 1 FROM public.njacc_wht_items x WHERE x.wht_id=w.id)
   AND ( w.tax_base IS DISTINCT FROM
           (SELECT round(sum(x.tax_base),2) FROM public.njacc_wht_items x WHERE x.wht_id=w.id)
      OR w.amount   IS DISTINCT FROM
           (SELECT round(sum(x.amount),2)   FROM public.njacc_wht_items x WHERE x.wht_id=w.id) );

-- V14 · ภาษีรายบรรทัดต้องเท่ากับ base × rate/100
SELECT 'V14 amount = base × rate' AS check_name,
       count(*) AS bad_lines,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_wht_items x
 WHERE abs(x.amount - round(x.tax_base * x.rate / 100, 2)) > 0.005;

-- V16 · ใบที่บันทึกจริงแล้วต้องมีวันที่จ่ายเงินครบทุกบรรทัด
SELECT 'V16 pay_date ครบ' AS check_name,
       count(*) AS missing,
       CASE WHEN count(*)=0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_withholding_docs w
 WHERE w.status='ISSUED'
   AND (w.pay_date IS NULL
        OR EXISTS (SELECT 1 FROM public.njacc_wht_items x
                    WHERE x.wht_id=w.id AND x.pay_date IS NULL));

-- V15 · ข้อมูลหลังรัน (เทียบกับ P1)
SELECT 'V15 ข้อมูล' AS check_name,
       (SELECT count(*) FROM public.njacc_withholding_docs)                     AS wht_docs,
       (SELECT count(*) FROM public.njacc_wht_items)                            AS wht_items,
       (SELECT count(*) FROM public.njacc_invoices)                             AS invoices,
       coalesce((SELECT last_number::text FROM public.njacc_document_sequences
                  WHERE doc_type='WHT' LIMIT 1),'(ยังไม่มี counter)')           AS wht_counter;
