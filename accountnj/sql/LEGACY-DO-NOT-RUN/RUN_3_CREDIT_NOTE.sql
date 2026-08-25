-- ═══════════════════════════════════════════════════════════════════════════
-- RUN_3_CREDIT_NOTE.sql   ★ ฟอร์ม: CREDIT NOTE / ใบลดหนี้
-- ═══════════════════════════════════════════════════════════════════════════
-- รันไฟล์นี้ไฟล์เดียวจบ (มี PREFLIGHT + MIGRATION + VERIFY เต็มในตัว)
-- ความเสี่ยง : ปานกลาง — เป็นไฟล์เดียวในชุดนี้ที่ "สร้างของใหม่" (2 ตาราง + 10 ฟังก์ชัน)
--              แต่เป็นของใหม่ล้วน 100% ไม่ทับของเก่าสักตัว
--              ไม่มี DROP / DELETE / TRUNCATE / UPDATE ข้อมูลเดิมใด ๆ
-- รันซ้ำได้  : ❌ ไม่ได้ — PREFLIGHT จะหยุดให้เองถ้ามีตารางอยู่แล้ว (กันรันทับ)
-- ลำดับ      : รันก่อน/หลังไฟล์อื่นก็ได้ ไม่ผูกกับ RUN_1 / RUN_2 / RUN_4
--
-- ── ทำไมต้องรัน ────────────────────────────────────────────────────────────
--   ตรวจ Production (sytgqjglcnsabcszbngg) สดเมื่อ 17/08/2026 พบว่า:
--     • ไม่มีตาราง njacc_credit_notes / njacc_credit_note_items
--     • ไม่มี RPC njacc_*credit* แม้แต่ตัวเดียว
--     • njacc_document_sequences ไม่มี doc_type ของใบลดหนี้
--   -> เมนู FINANCE > Credit Note จะขึ้นกล่อง "BACKEND REQUIRED" จนกว่าจะรันไฟล์นี้
--
-- ── ได้อะไร ────────────────────────────────────────────────────────────────
--   เปิดใช้งานเมนู FINANCE > Credit Note เต็มรูปแบบ:
--     เลือก INVOICE -> เลือกรายการที่จะลด -> ระบุเหตุผล -> บันทึกร่าง ->
--     Preview -> POST (ออกเลข CD{YYYYMM}-#####) -> Print / Save PDF
--
-- ── กติกาสำคัญที่บังคับไว้ในไฟล์นี้ ─────────────────────────────────────────
--   • ห้ามลดเกิน : บังคับที่ SQL 2 ชั้น (ตอนบันทึกร่าง + ตอน POST)
--                  remaining = ยอดบรรทัด Invoice − Σ ที่ลดไปแล้วเฉพาะใบที่ POSTED
--                  เกิน -> NJACC_CN_EXCEEDS_CREDITABLE (Frontend อย่างเดียวไม่พอ)
--   • VAT       : ใช้ vat_rate ของบรรทัด Invoice ต้นฉบับ ไม่ hardcode 7
--                 VAT 0% เก็บ 0 ตามจริง · Frontend ไม่ส่งตัวเลขภาษีมาเลย
--   • เลขเอกสาร : CD{YYYYMM}-##### ออกตอน POST เท่านั้น -> ร่างที่ทิ้งไม่กินเลข
--                 ใช้ฟังก์ชันใหม่ njacc_next_credit_note_no()
--                 *** ไม่แตะ njacc_next_doc_no *** (ตัวนั้น pad 4 หลักตายตัว
--                 ถ้าไปแก้จะกระทบเลข JOB / INVOICE / RECEIPT ที่ใช้อยู่จริง)
--   • Invoice ต้นฉบับ : อ่านอย่างเดียว 100% + เก็บ FK credit_note -> invoice
--                       เพื่อ Audit ย้อนหลัง
--
-- ── สิ่งที่ไม่แตะ ───────────────────────────────────────────────────────────
--   njacc_next_doc_no · njacc_invoices · njacc_invoice_items · njacc_jobs
--   njacc_receipts · njacc_payments · njacc_withholding_docs
--   njacc_user_access (ใช้สิทธิ์ can_invoice / can_void เดิม ไม่เพิ่มคอลัมน์)
--   RPC เดิมทุกตัว (ไม่มี CREATE OR REPLACE ทับของเก่าเลย)
--
-- ROLLBACK : ของใหม่ล้วน -> ถอนได้ด้วยการ DROP เฉพาะของใหม่
--            DROP TABLE public.njacc_credit_note_items;
--            DROP TABLE public.njacc_credit_notes;
--            DROP FUNCTION ทั้ง 10 ตัวที่ขึ้นต้น njacc_*credit*
--            ข้อมูลเดิมของระบบไม่ถูกแตะแม้แต่แถวเดียว
--
-- ⚠️ ถ้าในอนาคตรัน 017_rpc_permission_matrix_repair.sql ซ้ำ
--    ต้องใช้ฉบับล่าสุดที่มีชื่อ RPC 8 ตัวของไฟล์นี้อยู่ใน allowlist แล้ว
--    (แนบมาใน ZIP source รอบนี้) มิฉะนั้นสิทธิ์จะถูกถอนและหน้า Credit Note พัง
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — ไม่เปลี่ยนอะไร)
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='njacc_credit_notes') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — มีตาราง njacc_credit_notes อยู่แล้ว หยุดก่อน อย่ารันทับ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_invoice_items'
                    AND column_name='vat_rate') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_invoice_items.vat_rate (ต้องรัน 018 ก่อน)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers'
                    AND column_name='phone') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.phone';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $$;

SELECT 'BEFORE' AS phase,
       (SELECT count(*) FROM public.njacc_invoices WHERE status IN ('ISSUED','POSTED')) AS invoices_creditable,
       (SELECT count(*) FROM public.njacc_document_sequences
         WHERE doc_type='CREDIT_NOTE_MONTH')                                            AS cn_sequences,
       (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit_note%')              AS cn_functions;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- ── 2.1 ตารางหัวใบลดหนี้ ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.njacc_credit_notes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_no   text        NOT NULL,
  credit_note_date date        NOT NULL DEFAULT current_date,
  status           text        NOT NULL DEFAULT 'DRAFT',
  /* ความสัมพันธ์กลับ INVOICE ต้นฉบับ — ห้ามลบ Invoice ทิ้งขณะมีใบลดหนี้อ้างอยู่ */
  invoice_id       uuid        NOT NULL REFERENCES public.njacc_invoices(id),
  customer_id      uuid        NOT NULL REFERENCES public.njacc_customers(id),
  charge_type      text        NOT NULL,
  company_group    text        NOT NULL,
  reason           text,
  subtotal         numeric(14,2) NOT NULL DEFAULT 0,   -- รวมก่อน VAT
  vat_amount       numeric(14,2) NOT NULL DEFAULT 0,
  total_amount     numeric(14,2) NOT NULL DEFAULT 0,   -- subtotal + vat_amount
  created_by       uuid REFERENCES public.njacc_profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  draft_saved_at   timestamptz,
  draft_saved_by   uuid REFERENCES public.njacc_profiles(id),
  posted_at        timestamptz,
  posted_by        uuid REFERENCES public.njacc_profiles(id),
  voided_at        timestamptz,
  voided_by        uuid REFERENCES public.njacc_profiles(id),
  void_reason      text,
  CONSTRAINT njacc_cn_status_ck CHECK (status IN ('DRAFT','POSTED','VOID')),
  CONSTRAINT njacc_cn_amount_ck CHECK (subtotal >= 0 AND vat_amount >= 0 AND total_amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS njacc_cn_no_uq  ON public.njacc_credit_notes (credit_note_no);
CREATE INDEX        IF NOT EXISTS njacc_cn_inv_ix ON public.njacc_credit_notes (invoice_id);
CREATE INDEX        IF NOT EXISTS njacc_cn_cus_ix ON public.njacc_credit_notes (customer_id, credit_note_date DESC);
CREATE INDEX        IF NOT EXISTS njacc_cn_st_ix  ON public.njacc_credit_notes (status, credit_note_date DESC);
/* 1 INVOICE = ร่างค้างได้ 1 ใบ → กดบันทึกร่างซ้ำแล้วร่างไม่งอก (นโยบายเดียวกับ 022) */
CREATE UNIQUE INDEX IF NOT EXISTS njacc_cn_draft_per_invoice_uq
  ON public.njacc_credit_notes (invoice_id) WHERE status = 'DRAFT';

-- ── 2.2 ตารางรายการลดหนี้ ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.njacc_credit_note_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id  uuid NOT NULL REFERENCES public.njacc_credit_notes(id) ON DELETE CASCADE,
  line_no         int  NOT NULL,
  /* ผูกกลับบรรทัด Invoice ต้นฉบับ — ใช้คำนวณ "ลดได้อีกเท่าไร" */
  invoice_item_id uuid REFERENCES public.njacc_invoice_items(id),
  description     text NOT NULL,
  amount          numeric(14,2) NOT NULL DEFAULT 0,   -- ยอดลดก่อน VAT
  vat_rate        numeric(6,2)  NOT NULL DEFAULT 0,
  vat_amount      numeric(14,2) NOT NULL DEFAULT 0,
  credit_amount   numeric(14,2) NOT NULL DEFAULT 0,
  CONSTRAINT njacc_cni_line_uq   UNIQUE (credit_note_id, line_no),
  CONSTRAINT njacc_cni_lineno_ck CHECK (line_no > 0),
  CONSTRAINT njacc_cni_amount_ck CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS njacc_cni_src_ix ON public.njacc_credit_note_items (invoice_item_id);

-- ── 2.3 RLS ── ปิดทางเข้าตรงทั้งหมด · เข้าถึงได้ผ่าน RPC (SECURITY DEFINER) เท่านั้น
--     รูปแบบเดียวกับ njacc_invoices / njacc_receipts บน Production (RLS on · 0 policy)
ALTER TABLE public.njacc_credit_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.njacc_credit_note_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.njacc_credit_notes      FROM anon, authenticated;
REVOKE ALL ON public.njacc_credit_note_items FROM anon, authenticated;

-- ── 2.4 updated_at trigger (ใช้ฟังก์ชันเดิมของระบบ ไม่สร้างใหม่) ────────────
DROP TRIGGER IF EXISTS njacc_cn_touch ON public.njacc_credit_notes;
CREATE TRIGGER njacc_cn_touch BEFORE UPDATE ON public.njacc_credit_notes
  FOR EACH ROW EXECUTE FUNCTION public.njacc_touch_updated_at();

-- ── 2.5 เลขที่เอกสาร CD{YYYYMM}-##### ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_next_credit_note_no(p_date date)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_scope text; v_n bigint;
BEGIN
  v_scope := to_char(coalesce(p_date, current_date), 'YYYYMM');
  INSERT INTO public.njacc_document_sequences(doc_type, scope_key, last_number)
  VALUES ('CREDIT_NOTE_MONTH', v_scope, 0)
  ON CONFLICT (doc_type, scope_key) DO NOTHING;
  UPDATE public.njacc_document_sequences
     SET last_number = last_number + 1
   WHERE doc_type='CREDIT_NOTE_MONTH' AND scope_key=v_scope
   RETURNING last_number INTO v_n;
  RETURN 'CD' || v_scope || '-' || lpad(v_n::text, 5, '0');
END $$;

-- ── 2.6 ยอดที่ยัง "ลดได้อีก" ของบรรทัด Invoice หนึ่งบรรทัด ──────────────────
--     นับเฉพาะใบลดหนี้ที่ POSTED · ข้ามใบที่ระบุใน p_exclude (ใบที่กำลังแก้อยู่)
CREATE OR REPLACE FUNCTION public.njacc_credit_item_remaining(
  p_invoice_item uuid, p_exclude uuid DEFAULT NULL)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT round(
    coalesce((SELECT ii.amount FROM public.njacc_invoice_items ii WHERE ii.id = p_invoice_item), 0)
    - coalesce((SELECT sum(ci.amount)
                  FROM public.njacc_credit_note_items ci
                  JOIN public.njacc_credit_notes cn ON cn.id = ci.credit_note_id
                 WHERE ci.invoice_item_id = p_invoice_item
                   AND cn.status = 'POSTED'
                   AND (p_exclude IS NULL OR cn.id <> p_exclude)), 0)
  , 2)
$$;

-- ── 2.7 เลือก INVOICE ที่ออกใบลดหนี้ได้ ─────────────────────────────────────
--     เฉพาะ ISSUED / POSTED · ไม่เอา DRAFT · ไม่เอา VOID
--     credited = ยอดก่อน VAT ที่ถูกลดไปแล้ว (POSTED เท่านั้น)
CREATE OR REPLACE FUNCTION public.njacc_credit_note_invoice_options(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
        v_q text        := nullif(btrim(coalesce(p->>'q','')), '');
        v_cus uuid      := nullif(p->>'customer_id','')::uuid;
        v_page int      := greatest(coalesce((p->>'page')::int, 1), 1);
        v_size int      := least(greatest(coalesce((p->>'size')::int, 20), 1), 100);
        v_total int; v_rows jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','invoice') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  WITH base AS (
    SELECT i.id, i.invoice_no, i.invoice_date, i.charge_type, i.company_group,
           i.status, i.total_amount, i.subtotal, i.vat_rate,
           c.customer_name,
           coalesce((SELECT sum(ci.amount)
                       FROM public.njacc_credit_note_items ci
                       JOIN public.njacc_credit_notes cn ON cn.id = ci.credit_note_id
                      WHERE cn.invoice_id = i.id AND cn.status='POSTED'), 0) AS credited,
           coalesce((SELECT sum(ii.amount) FROM public.njacc_invoice_items ii
                      WHERE ii.invoice_id = i.id), 0)                        AS items_subtotal
      FROM public.njacc_invoices i
      JOIN public.njacc_customers c ON c.id = i.customer_id
     WHERE i.status IN ('ISSUED','POSTED')
       AND public.njacc_can(i.charge_type, i.company_group, 'invoice')
       AND (v_cus IS NULL OR i.customer_id = v_cus)
       AND (v_q IS NULL OR i.invoice_no ILIKE '%'||v_q||'%' OR c.customer_name ILIKE '%'||v_q||'%')
  )
  SELECT count(*)::int,
         coalesce(jsonb_agg(x ORDER BY x->>'invoice_date' DESC, x->>'invoice_no' DESC), '[]'::jsonb)
    INTO v_total, v_rows
    FROM (SELECT jsonb_build_object(
            'id', b.id, 'invoice_no', b.invoice_no, 'invoice_date', b.invoice_date,
            'customer_name', b.customer_name, 'charge_type', b.charge_type,
            'company_group', b.company_group, 'status', b.status,
            'total_amount', b.total_amount, 'subtotal', b.items_subtotal,
            'credited', b.credited,
            'creditable_remaining', round(b.items_subtotal - b.credited, 2)) AS x
            FROM base b) s;

  /* pagination ทำหลังนับ total เพื่อให้เลขหน้าถูกต้อง */
  RETURN jsonb_build_object(
    'total', v_total, 'page', v_page, 'size', v_size,
    'rows', coalesce((SELECT jsonb_agg(e) FROM (
              SELECT e FROM jsonb_array_elements(v_rows) e
               OFFSET (v_page-1)*v_size LIMIT v_size) t), '[]'::jsonb));
END $$;

-- ── 2.8 โหลดข้อมูลต้นทางของ INVOICE ที่เลือก ────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_credit_note_source(p_invoice uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; inv public.njacc_invoices; v jsonb; v_draft uuid;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO inv FROM public.njacc_invoices WHERE id = p_invoice;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(inv.charge_type, inv.company_group, 'invoice') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF inv.status NOT IN ('ISSUED','POSTED') THEN
    RAISE EXCEPTION 'NJACC_CN_INVOICE_NOT_CREDITABLE'; END IF;

  SELECT id INTO v_draft FROM public.njacc_credit_notes
   WHERE invoice_id = inv.id AND status='DRAFT' LIMIT 1;

  SELECT jsonb_build_object(
    'invoice', jsonb_build_object(
        'id', inv.id, 'invoice_no', inv.invoice_no, 'invoice_date', inv.invoice_date,
        'status', inv.status, 'charge_type', inv.charge_type, 'company_group', inv.company_group,
        'vat_rate', inv.vat_rate, 'subtotal', inv.subtotal, 'vat_amount', inv.vat_amount,
        'total_amount', inv.total_amount, 'payment_status', inv.payment_status),
    'customer', (SELECT jsonb_build_object(
        'id', c.id, 'name', c.customer_name, 'tax_id', c.tax_id, 'branch_code', c.branch_code,
        'address', c.address, 'phone', c.phone)
       FROM public.njacc_customers c WHERE c.id = inv.customer_id),
    'job', (SELECT jsonb_build_object('job_no', j.job_no, 'customer_job_no', j.customer_job_no)
       FROM public.njacc_jobs j WHERE j.id = inv.job_id),
    'existing_draft_id', v_draft,
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'invoice_item_id', ii.id, 'line_no', ii.line_no, 'description', ii.description,
          'code', ii.code, 'charge_kind', ii.charge_kind,
          'qty', ii.qty, 'unit_price', ii.unit_price,
          'amount', ii.amount, 'vat_rate', coalesce(ii.vat_rate, 0),
          'credited', round(ii.amount - public.njacc_credit_item_remaining(ii.id, v_draft), 2),
          'remaining', public.njacc_credit_item_remaining(ii.id, v_draft))
        ORDER BY ii.line_no), '[]'::jsonb)
       FROM public.njacc_invoice_items ii WHERE ii.invoice_id = inv.id))
  INTO v;
  RETURN v;
END $$;

-- ── 2.9 บันทึกร่าง ──────────────────────────────────────────────────────────
--   p = { credit_note_id?, invoice_id, credit_note_date?, reason,
--         items:[{ invoice_item_id, description, amount }] }
--   vat_rate / vat_amount / credit_amount คำนวณที่ SQL จากบรรทัด Invoice ต้นฉบับ
--   *** ไม่รับตัวเลข VAT จากฝั่ง Browser ***
CREATE OR REPLACE FUNCTION public.njacc_save_credit_note_draft(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; inv public.njacc_invoices; cn public.njacc_credit_notes;
        v_id uuid := nullif(p->>'credit_note_id','')::uuid;
        v_inv uuid := (p->>'invoice_id')::uuid;
        v_date date := coalesce(nullif(p->>'credit_note_date','')::date, current_date);
        v_reason text := nullif(btrim(coalesce(p->>'reason','')), '');
        it jsonb; v_line int := 0; v_src public.njacc_invoice_items;
        v_amt numeric; v_rate numeric; v_vat numeric; v_rem numeric;
        v_sub numeric := 0; v_tvat numeric := 0; v_seen uuid[] := '{}';
BEGIN
  pr := public.njacc_req_profile();

  SELECT * INTO inv FROM public.njacc_invoices WHERE id = v_inv FOR UPDATE;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'NJACC_INVOICE_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(inv.charge_type, inv.company_group, 'invoice') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF inv.status NOT IN ('ISSUED','POSTED') THEN
    RAISE EXCEPTION 'NJACC_CN_INVOICE_NOT_CREDITABLE'; END IF;
  IF v_reason IS NULL THEN RAISE EXCEPTION 'NJACC_CN_REASON_REQUIRED'; END IF;
  IF jsonb_typeof(p->'items') <> 'array' OR jsonb_array_length(p->'items') = 0 THEN
    RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  /* หาใบร่างเดิม: ระบุ id มา → ใช้ตัวนั้น · ไม่ระบุ → ร่างค้างของ Invoice นี้ */
  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.njacc_credit_notes
     WHERE invoice_id = inv.id AND status='DRAFT' LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.njacc_credit_notes(
        credit_note_no, credit_note_date, status, invoice_id, customer_id,
        charge_type, company_group, reason, created_by, draft_saved_at, draft_saved_by)
    VALUES ('CNDRAFT-TMP', v_date, 'DRAFT', inv.id, inv.customer_id,
            inv.charge_type, inv.company_group, v_reason, pr.id, now(), pr.id)
    RETURNING id INTO v_id;
    /* เลขชั่วคราวอิง uuid ของแถวเอง → UNIQUE ไม่ชน และไม่กินเลขจริง */
    UPDATE public.njacc_credit_notes
       SET credit_note_no = 'CNDRAFT-' || left(v_id::text, 8) WHERE id = v_id;
  ELSE
    SELECT * INTO cn FROM public.njacc_credit_notes WHERE id = v_id FOR UPDATE;
    IF cn.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_NOT_FOUND'; END IF;
    IF cn.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_CN_NOT_DRAFT'; END IF;
    IF cn.invoice_id <> inv.id THEN RAISE EXCEPTION 'NJACC_CN_INVOICE_MISMATCH'; END IF;
    UPDATE public.njacc_credit_notes
       SET credit_note_date = v_date, reason = v_reason,
           draft_saved_at = now(), draft_saved_by = pr.id
     WHERE id = v_id;
    DELETE FROM public.njacc_credit_note_items WHERE credit_note_id = v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    SELECT * INTO v_src FROM public.njacc_invoice_items
     WHERE id = (it->>'invoice_item_id')::uuid;
    IF v_src.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_ITEM_NOT_FOUND'; END IF;
    /* บรรทัดต้องเป็นของ Invoice ใบนี้เท่านั้น — กันลดข้ามใบ/ข้ามลูกค้า */
    IF v_src.invoice_id <> inv.id THEN RAISE EXCEPTION 'NJACC_CN_ITEM_NOT_IN_INVOICE'; END IF;
    IF v_src.id = ANY(v_seen) THEN RAISE EXCEPTION 'NJACC_CN_ITEM_DUPLICATE'; END IF;
    v_seen := v_seen || v_src.id;

    v_amt := round(coalesce((it->>'amount')::numeric, 0), 2);
    IF v_amt <= 0 THEN RAISE EXCEPTION 'NJACC_CN_AMOUNT_INVALID'; END IF;

    v_rem := public.njacc_credit_item_remaining(v_src.id, v_id);
    IF v_amt > v_rem THEN RAISE EXCEPTION 'NJACC_CN_EXCEEDS_CREDITABLE'; END IF;

    v_rate := coalesce(v_src.vat_rate, 0);
    v_vat  := round(v_amt * v_rate / 100, 2);
    v_line := v_line + 1;

    INSERT INTO public.njacc_credit_note_items(
        credit_note_id, line_no, invoice_item_id, description,
        amount, vat_rate, vat_amount, credit_amount)
    VALUES (v_id, v_line, v_src.id,
            coalesce(nullif(btrim(coalesce(it->>'description','')), ''), v_src.description),
            v_amt, v_rate, v_vat, round(v_amt + v_vat, 2));

    v_sub  := round(v_sub + v_amt, 2);
    v_tvat := round(v_tvat + v_vat, 2);
  END LOOP;

  UPDATE public.njacc_credit_notes
     SET subtotal = v_sub, vat_amount = v_tvat, total_amount = round(v_sub + v_tvat, 2)
   WHERE id = v_id;

  PERFORM public.njacc_audit(pr.id, 'SAVE_CREDIT_NOTE_DRAFT', 'credit_note', v_id::text,
    jsonb_build_object('invoice_id', inv.id, 'invoice_no', inv.invoice_no,
                       'lines', v_line, 'total', round(v_sub + v_tvat, 2)));

  RETURN jsonb_build_object('id', v_id, 'status', 'DRAFT',
    'credit_note_no', (SELECT credit_note_no FROM public.njacc_credit_notes WHERE id=v_id),
    'subtotal', v_sub, 'vat_amount', v_tvat, 'total_amount', round(v_sub + v_tvat, 2));
END $$;

-- ── 2.10 POST — ออกเลขจริง CD{YYYYMM}-##### ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_post_credit_note(p_id uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; cn public.njacc_credit_notes; v_prev uuid;
        v_no text; v_cnt int; r record; v_reused boolean := false;
BEGIN
  pr := public.njacc_req_profile();
  v_prev := public.njacc_idem_check(p_request_id, 'POST_CREDIT_NOTE', pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_prev, 'idempotent', true,
      'credit_note_no', (SELECT credit_note_no FROM public.njacc_credit_notes WHERE id=v_prev),
      'status', (SELECT status FROM public.njacc_credit_notes WHERE id=v_prev));
  END IF;

  SELECT * INTO cn FROM public.njacc_credit_notes WHERE id = p_id FOR UPDATE;
  IF cn.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(cn.charge_type, cn.company_group, 'invoice') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF cn.status = 'POSTED' THEN RAISE EXCEPTION 'NJACC_CN_ALREADY_POSTED'; END IF;
  IF cn.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_CN_NOT_DRAFT'; END IF;
  IF nullif(btrim(coalesce(cn.reason,'')),'') IS NULL THEN
    RAISE EXCEPTION 'NJACC_CN_REASON_REQUIRED'; END IF;

  SELECT count(*) INTO v_cnt FROM public.njacc_credit_note_items WHERE credit_note_id = cn.id;
  IF v_cnt = 0 THEN RAISE EXCEPTION 'NJACC_NO_ITEMS'; END IF;

  /* ตรวจซ้ำชั้นสุดท้าย — ระหว่างที่ร่างค้างไว้ อาจมีใบอื่น POST ตัดหน้าไปแล้ว */
  FOR r IN SELECT ci.invoice_item_id, ci.amount
             FROM public.njacc_credit_note_items ci WHERE ci.credit_note_id = cn.id LOOP
    IF r.invoice_item_id IS NOT NULL
       AND r.amount > public.njacc_credit_item_remaining(r.invoice_item_id, cn.id) THEN
      RAISE EXCEPTION 'NJACC_CN_EXCEEDS_CREDITABLE';
    END IF;
  END LOOP;

  /* เคยได้เลขจริงแล้วให้ใช้เลขเดิม (กรณี VOID แล้วออกใหม่จะไม่มาถึงตรงนี้)
     ยังไม่เคยได้เลข → ดึงใหม่ตอน POST เท่านั้น → ร่างที่ถูกทิ้งไม่กินเลข */
  IF cn.credit_note_no IS NOT NULL AND cn.credit_note_no NOT LIKE 'CNDRAFT-%' THEN
    v_no := cn.credit_note_no; v_reused := true;
  ELSE
    v_no := public.njacc_next_credit_note_no(cn.credit_note_date);
  END IF;

  UPDATE public.njacc_credit_notes
     SET credit_note_no = v_no, status = 'POSTED', posted_at = now(), posted_by = pr.id
   WHERE id = cn.id;

  INSERT INTO public.njacc_idempotency_requests(request_id, operation, profile_id, result_type, result_id)
  VALUES (p_request_id, 'POST_CREDIT_NOTE', pr.id, 'credit_note', cn.id);
  PERFORM public.njacc_audit(pr.id, 'POST_CREDIT_NOTE', 'credit_note', cn.id::text,
    jsonb_build_object('credit_note_no', v_no, 'invoice_id', cn.invoice_id,
                       'total_amount', cn.total_amount, 'reused_number', v_reused));

  RETURN jsonb_build_object('id', cn.id, 'credit_note_no', v_no, 'status', 'POSTED',
                            'reused_number', v_reused);
END $$;

-- ── 2.11 ดูเอกสารเต็ม (ใช้ทั้ง Preview / Print / PDF) ───────────────────────
CREATE OR REPLACE FUNCTION public.njacc_credit_note_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; cn public.njacc_credit_notes; v jsonb;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO cn FROM public.njacc_credit_notes WHERE id = p_id;
  IF cn.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(cn.charge_type, cn.company_group, 'view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  SELECT to_jsonb(cn) || jsonb_build_object(
    'customer', (SELECT jsonb_build_object('name', c.customer_name, 'tax_id', c.tax_id,
        'branch_code', c.branch_code, 'address', c.address, 'phone', c.phone)
       FROM public.njacc_customers c WHERE c.id = cn.customer_id),
    /* INVOICE REFERENCE — อ่านอย่างเดียว ไม่แตะใบต้นฉบับ */
    'invoice', (SELECT jsonb_build_object('id', i.id, 'invoice_no', i.invoice_no,
        'invoice_date', i.invoice_date, 'status', i.status,
        'subtotal', i.subtotal, 'vat_amount', i.vat_amount, 'total_amount', i.total_amount)
       FROM public.njacc_invoices i WHERE i.id = cn.invoice_id),
    'invoice_items', (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'line_no', ii.line_no, 'description', ii.description, 'amount', ii.amount)
        ORDER BY ii.line_no), '[]'::jsonb)
       FROM public.njacc_invoice_items ii WHERE ii.invoice_id = cn.invoice_id),
    'job', (SELECT jsonb_build_object('job_no', j.job_no, 'customer_job_no', j.customer_job_no)
       FROM public.njacc_jobs j
       JOIN public.njacc_invoices i2 ON i2.job_id = j.id AND i2.id = cn.invoice_id),
    'items', (SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.line_no), '[]'::jsonb)
       FROM public.njacc_credit_note_items x WHERE x.credit_note_id = cn.id))
  INTO v;
  RETURN v;
END $$;

-- ── 2.12 รายการใบลดหนี้ ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_list_credit_notes(p jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles;
        v_q text    := nullif(btrim(coalesce(p->>'q','')), '');
        v_cus uuid  := nullif(p->>'customer_id','')::uuid;
        v_st text   := nullif(btrim(coalesce(p->>'status','')), '');
        v_from date := nullif(p->>'from','')::date;
        v_to date   := nullif(p->>'to','')::date;
        v_page int  := greatest(coalesce((p->>'page')::int, 1), 1);
        v_size int  := least(greatest(coalesce((p->>'size')::int, 20), 1), 100);
        v_total int; v_rows jsonb;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  SELECT count(*)::int INTO v_total
    FROM public.njacc_credit_notes cn
    JOIN public.njacc_customers c ON c.id = cn.customer_id
    LEFT JOIN public.njacc_invoices i ON i.id = cn.invoice_id
   WHERE public.njacc_can(cn.charge_type, cn.company_group, 'view')
     AND (v_cus  IS NULL OR cn.customer_id = v_cus)
     AND (v_st   IS NULL OR cn.status = v_st)
     AND (v_from IS NULL OR cn.credit_note_date >= v_from)
     AND (v_to   IS NULL OR cn.credit_note_date <= v_to)
     AND (v_q    IS NULL OR cn.credit_note_no ILIKE '%'||v_q||'%'
          OR c.customer_name ILIKE '%'||v_q||'%' OR i.invoice_no ILIKE '%'||v_q||'%');

  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'credit_note_date') DESC, x->>'credit_note_no' DESC), '[]'::jsonb)
    INTO v_rows
    FROM (SELECT jsonb_build_object(
            'id', cn.id, 'credit_note_no', cn.credit_note_no,
            'credit_note_date', cn.credit_note_date, 'status', cn.status,
            'customer_id', cn.customer_id, 'customer_name', c.customer_name,
            'invoice_id', cn.invoice_id, 'invoice_no', i.invoice_no,
            'invoice_date', i.invoice_date, 'reason', cn.reason,
            'charge_type', cn.charge_type, 'company_group', cn.company_group,
            'subtotal', cn.subtotal, 'vat_amount', cn.vat_amount,
            'total_amount', cn.total_amount) AS x
            FROM public.njacc_credit_notes cn
            JOIN public.njacc_customers c ON c.id = cn.customer_id
            LEFT JOIN public.njacc_invoices i ON i.id = cn.invoice_id
           WHERE public.njacc_can(cn.charge_type, cn.company_group, 'view')
             AND (v_cus  IS NULL OR cn.customer_id = v_cus)
             AND (v_st   IS NULL OR cn.status = v_st)
             AND (v_from IS NULL OR cn.credit_note_date >= v_from)
             AND (v_to   IS NULL OR cn.credit_note_date <= v_to)
             AND (v_q    IS NULL OR cn.credit_note_no ILIKE '%'||v_q||'%'
                  OR c.customer_name ILIKE '%'||v_q||'%' OR i.invoice_no ILIKE '%'||v_q||'%')
           ORDER BY cn.credit_note_date DESC, cn.created_at DESC
           OFFSET (v_page-1)*v_size LIMIT v_size) s;

  RETURN jsonb_build_object('total', v_total, 'page', v_page, 'size', v_size, 'rows', v_rows);
END $$;

-- ── 2.13 ลบร่าง (เฉพาะ DRAFT) ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_delete_credit_note_draft(p_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; cn public.njacc_credit_notes;
BEGIN
  pr := public.njacc_req_profile();
  SELECT * INTO cn FROM public.njacc_credit_notes WHERE id = p_id FOR UPDATE;
  IF cn.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_NOT_FOUND'; END IF;
  IF cn.status <> 'DRAFT' THEN RAISE EXCEPTION 'NJACC_CN_NOT_DRAFT'; END IF;
  IF NOT public.njacc_can(cn.charge_type, cn.company_group, 'invoice') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  PERFORM public.njacc_audit(pr.id, 'DELETE_CREDIT_NOTE_DRAFT', 'credit_note', cn.id::text,
    jsonb_build_object('invoice_id', cn.invoice_id, 'reason', p_reason,
                       'total_amount', cn.total_amount));
  /* ลบเฉพาะ "ร่าง" ที่ยังไม่เคยมีผลทางบัญชี · items ตามด้วย ON DELETE CASCADE
     ไม่แตะ INVOICE ต้นฉบับ และไม่แตะใบที่ POSTED แล้ว */
  DELETE FROM public.njacc_credit_notes WHERE id = cn.id;
  RETURN jsonb_build_object('id', cn.id, 'deleted', true);
END $$;

-- ── 2.14 VOID (ใบที่ POST แล้ว) — ไม่ลบทิ้ง เก็บร่องรอยไว้ตรวจย้อนหลัง ──────
CREATE OR REPLACE FUNCTION public.njacc_void_credit_note(p_id uuid, p_reason text, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; cn public.njacc_credit_notes; v_prev uuid;
BEGIN
  pr := public.njacc_req_profile();
  v_prev := public.njacc_idem_check(p_request_id, 'VOID_CREDIT_NOTE', pr.id);
  IF v_prev IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_prev, 'idempotent', true, 'status', 'VOID');
  END IF;
  IF nullif(btrim(coalesce(p_reason,'')),'') IS NULL THEN
    RAISE EXCEPTION 'NJACC_REASON_REQUIRED'; END IF;

  SELECT * INTO cn FROM public.njacc_credit_notes WHERE id = p_id FOR UPDATE;
  IF cn.id IS NULL THEN RAISE EXCEPTION 'NJACC_CN_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(cn.charge_type, cn.company_group, 'void') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF cn.status <> 'POSTED' THEN RAISE EXCEPTION 'NJACC_CN_NOT_POSTED'; END IF;

  UPDATE public.njacc_credit_notes
     SET status='VOID', voided_at=now(), voided_by=pr.id, void_reason=p_reason
   WHERE id = cn.id;

  INSERT INTO public.njacc_idempotency_requests(request_id, operation, profile_id, result_type, result_id)
  VALUES (p_request_id, 'VOID_CREDIT_NOTE', pr.id, 'credit_note', cn.id);
  PERFORM public.njacc_audit(pr.id, 'VOID_CREDIT_NOTE', 'credit_note', cn.id::text,
    jsonb_build_object('credit_note_no', cn.credit_note_no, 'reason', p_reason));

  RETURN jsonb_build_object('id', cn.id, 'status', 'VOID');
END $$;

-- ── 2.15 GRANT — ให้เฉพาะ authenticated · ไม่ให้ anon ────────────────────────
/* helper 2 ตัวนี้ต้องถอนจาก authenticated ด้วย ไม่ใช่แค่ PUBLIC/anon
   เพราะ Supabase ตั้ง ALTER DEFAULT PRIVILEGES ให้ GRANT EXECUTE แก่ authenticated
   "โดยตรง" ทุกฟังก์ชันใหม่ -> REVOKE จาก PUBLIC อย่างเดียวไม่ลบก้อนนี้
   (ตรวจพบจริงบน Production หลังรันครั้งแรก: proacl = authenticated=X/postgres)
   ถอนแล้วไม่พัง เพราะถูกเรียกจาก RPC ที่เป็น SECURITY DEFINER owner=postgres */
REVOKE ALL ON FUNCTION public.njacc_next_credit_note_no(date)              FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_credit_item_remaining(uuid, uuid)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.njacc_credit_note_invoice_options(jsonb)     FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_credit_note_source(uuid)               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_save_credit_note_draft(jsonb)          FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_post_credit_note(uuid, text)           FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_credit_note_view(uuid)                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_list_credit_notes(jsonb)               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_delete_credit_note_draft(uuid, text)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.njacc_void_credit_note(uuid, text, text)     FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.njacc_credit_note_invoice_options(jsonb)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_credit_note_source(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_save_credit_note_draft(jsonb)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_post_credit_note(uuid, text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_credit_note_view(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_list_credit_notes(jsonb)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_delete_credit_note_draft(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_void_credit_note(uuid, text, text)   TO authenticated;
/* njacc_next_credit_note_no / njacc_credit_item_remaining = helper ภายใน
   ถูกเรียกจาก RPC ที่เป็น SECURITY DEFINER อยู่แล้ว → ไม่ต้อง GRANT ให้ผู้ใช้ */

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY 100%)  — ทุกแถวต้องได้ result = 'PASS'
--   ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--   รันซ้ำได้ปลอดภัยทุกเมื่อ
-- ───────────────────────────────────────────────────────────────────────────

-- V1 · ตาราง 2 ตัวถูกสร้าง
SELECT 'V1 tables' AS check_name,
       count(*) AS found, 2 AS expected,
       CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM information_schema.tables
 WHERE table_schema='public'
   AND table_name IN ('njacc_credit_notes','njacc_credit_note_items');

-- V2 · ฟังก์ชันครบ 10 ตัว
SELECT 'V2 functions' AS check_name,
       count(*) AS found, 10 AS expected,
       CASE WHEN count(*) = 10 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
   AND p.proname IN ('njacc_next_credit_note_no','njacc_credit_item_remaining',
                     'njacc_credit_note_invoice_options','njacc_credit_note_source',
                     'njacc_save_credit_note_draft','njacc_post_credit_note',
                     'njacc_credit_note_view','njacc_list_credit_notes',
                     'njacc_delete_credit_note_draft','njacc_void_credit_note');

-- V3 · RLS เปิด และไม่มี policy (เข้าถึงได้ผ่าน RPC เท่านั้น — เหมือน njacc_invoices)
SELECT 'V3 rls' AS check_name, c.relname,
       c.relrowsecurity AS rls_enabled,
       (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid = c.oid) AS policies,
       CASE WHEN c.relrowsecurity
             AND (SELECT count(*) FROM pg_policy pol WHERE pol.polrelid = c.oid) = 0
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('njacc_credit_notes','njacc_credit_note_items');

-- V4 · anon ต้องเรียก RPC ของ Credit Note ไม่ได้เลย
SELECT 'V4 anon blocked' AS check_name,
       count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')) AS anon_exec,
       CASE WHEN count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')) = 0
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit%';

-- V5 · authenticated เรียกได้เฉพาะ 8 RPC ที่ frontend ใช้ (helper 2 ตัวต้องเรียกไม่ได้)
SELECT 'V5 auth grants' AS check_name, p.proname,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
       CASE WHEN p.proname IN ('njacc_next_credit_note_no','njacc_credit_item_remaining')
            THEN CASE WHEN has_function_privilege('authenticated', p.oid,'EXECUTE')
                      THEN 'FAIL' ELSE 'PASS' END
            ELSE CASE WHEN has_function_privilege('authenticated', p.oid,'EXECUTE')
                      THEN 'PASS' ELSE 'FAIL' END END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc_%credit%'
 ORDER BY p.proname;

-- V6 · ดัชนี/ข้อจำกัดสำคัญ
SELECT 'V6 indexes' AS check_name, indexname,
       CASE WHEN indexname IS NOT NULL THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_indexes
 WHERE schemaname='public'
   AND indexname IN ('njacc_cn_no_uq','njacc_cn_draft_per_invoice_uq',
                     'njacc_cn_inv_ix','njacc_cn_cus_ix','njacc_cn_st_ix','njacc_cni_src_ix')
 ORDER BY indexname;

-- V7 · ความสัมพันธ์กลับ INVOICE ต้นฉบับมีจริง (Audit ย้อนหลังได้)
SELECT 'V7 fk to invoice' AS check_name, conname, pg_get_constraintdef(oid) AS def,
       'PASS' AS result
  FROM pg_constraint
 WHERE conrelid = 'public.njacc_credit_notes'::regclass AND contype='f'
   AND pg_get_constraintdef(oid) LIKE '%njacc_invoices%';

-- V8 · *** ยืนยันว่าไม่ได้ไปแตะของเดิม ***
--     njacc_next_doc_no ต้องยังเป็น 3 พารามิเตอร์เท่าเดิม
SELECT 'V8 next_doc_no untouched' AS check_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       CASE WHEN pg_get_function_identity_arguments(p.oid) = 'p_type text, p_scope text, p_prefix text'
            THEN 'PASS' ELSE 'FAIL' END AS result
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_next_doc_no';

-- V9 · njacc_invoices / njacc_invoice_items ต้องไม่ถูกเพิ่มคอลัมน์ใด ๆ
SELECT 'V9 invoice schema untouched' AS check_name,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='njacc_invoices')      AS invoice_cols,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='njacc_invoice_items') AS item_cols,
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_invoices') = 34
             AND (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_invoice_items') = 17
            THEN 'PASS' ELSE 'CHECK (ค่าอ้างอิงวัดเมื่อ 17/08/2026)' END AS result;

-- V10 · counter ของใบลดหนี้ (ยังไม่มีจนกว่าจะ POST ใบแรก = ถูกต้อง)
SELECT 'V10 sequence' AS check_name, doc_type, scope_key, last_number
  FROM public.njacc_document_sequences
 WHERE doc_type='CREDIT_NOTE_MONTH'
 ORDER BY scope_key DESC;

-- V11 · ข้อมูลปัจจุบัน
SELECT 'V11 data' AS check_name,
       (SELECT count(*) FROM public.njacc_credit_notes)                            AS total,
       (SELECT count(*) FROM public.njacc_credit_notes WHERE status='DRAFT')       AS draft,
       (SELECT count(*) FROM public.njacc_credit_notes WHERE status='POSTED')      AS posted,
       (SELECT count(*) FROM public.njacc_credit_notes WHERE status='VOID')        AS void,
       (SELECT count(*) FROM public.njacc_credit_note_items)                       AS items;

-- V12 · *** กติกาห้ามลดเกิน *** — ต้องไม่มีบรรทัดใดที่ยอดลดสะสม (POSTED) เกินยอด Invoice
SELECT 'V12 no over-credit' AS check_name,
       count(*) AS violating_lines,
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL — มีรายการลดเกินยอด' END AS result
  FROM (SELECT ci.invoice_item_id, sum(ci.amount) AS credited,
               (SELECT ii.amount FROM public.njacc_invoice_items ii
                 WHERE ii.id = ci.invoice_item_id) AS original
          FROM public.njacc_credit_note_items ci
          JOIN public.njacc_credit_notes cn ON cn.id = ci.credit_note_id
         WHERE cn.status='POSTED'
         GROUP BY ci.invoice_item_id) t
 WHERE t.credited > t.original;

-- V13 · ยอดหัวใบต้องเท่ากับผลรวมรายการเสมอ
SELECT 'V13 header = lines' AS check_name,
       count(*) AS mismatched,
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_credit_notes cn
 WHERE cn.status <> 'VOID'
   AND (cn.subtotal, cn.vat_amount, cn.total_amount) IS DISTINCT FROM (
        SELECT coalesce(round(sum(ci.amount),2),0),
               coalesce(round(sum(ci.vat_amount),2),0),
               coalesce(round(sum(ci.credit_amount),2),0)
          FROM public.njacc_credit_note_items ci WHERE ci.credit_note_id = cn.id);

-- V14 · เลขที่เอกสารต้องตรงรูปแบบ CD{YYYYMM}-##### เมื่อ POSTED แล้ว
SELECT 'V14 number format' AS check_name,
       count(*) FILTER (WHERE status='POSTED' AND credit_note_no !~ '^CD[0-9]{6}-[0-9]{5}$') AS bad,
       CASE WHEN count(*) FILTER (WHERE status='POSTED'
              AND credit_note_no !~ '^CD[0-9]{6}-[0-9]{5}$') = 0 THEN 'PASS' ELSE 'FAIL' END AS result
  FROM public.njacc_credit_notes;
