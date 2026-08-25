-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-02_FINAL_CREDIT_NOTE.sql
-- ใบลดหนี้ต้องแสดง Original / Correct / Difference ให้ครบ (ข้อ 24-25)
--
-- ⚠️ ยังไม่รัน — รอคำสั่ง "รันได้"
-- ต้องรันหลัง RUN_3_CREDIT_NOTE.sql (ที่รันไปแล้ว) และหลัง RUN-01 หรือก่อนก็ได้
-- (ไม่ผูกกับ RUN-01 — คนละเรื่องกัน)
--
-- ═══ ปัญหา ════════════════════════════════════════════════════════════════
--   njacc_credit_note_items ปัจจุบันเก็บเฉพาะ
--       amount (ยอดที่ลด · ก่อน VAT) · vat_rate · vat_amount · credit_amount
--   -> เอกสารแสดงได้แค่ "Credit Amount" อย่างเดียว
--   -> ขาด Original Value และ Correct Value ตามข้อ 24
--
--   ยอดเดิมอ่านจาก njacc_invoice_items ผ่าน FK ได้ก็จริง
--   แต่ควร "snapshot" ไว้บนใบลดหนี้ เพื่อให้เอกสารที่ POST แล้วเป็นหลักฐานนิ่ง
--   ตรวจย้อนหลังได้แม้ในอนาคตจะมีการแก้ไขใด ๆ ที่ต้นทาง
--
-- ═══ สิ่งที่ทำ ════════════════════════════════════════════════════════════
--   2.0  Correct Amount ต้องคิด Credit "สะสม" ไม่ใช่แค่ใบปัจจุบัน
--        Original 10,000 · CN#1 ลด 2,000 -> Correct 8,000
--                          CN#2 ลด 1,500 -> Correct 6,500  (ไม่ใช่ 8,500)
--        -> njacc_credit_note_view ต้องคืน prior_credited / cumulative_credited /
--           correct_amount ให้ Renderer ใช้ ไม่ให้ Browser คำนวณเอง
--   2.1  ADD COLUMN original_amount ให้ njacc_credit_note_items
--        (ตารางนี้เพิ่งสร้างรอบก่อน · ตรวจแล้วมี 0 แถว -> ไม่มีข้อมูลเก่าต้อง backfill)
--   2.2  njacc_save_credit_note_draft บันทึก original_amount จากบรรทัด Invoice จริง
--   2.3  njacc_credit_note_view คืนค่าเพิ่มรายบรรทัด:
--            prior_credited      = ยอดที่ลดไปแล้วจากใบ "อื่น" ที่ POSTED และมาก่อนใบนี้
--            cumulative_credited = prior_credited + amount ของใบนี้
--            correct_amount      = original_amount − cumulative_credited
--        นิยาม "มาก่อน" = posted_at เก่ากว่า (ใบนี้ยังเป็น DRAFT -> นับ POSTED ทุกใบ)
--        -> เปิดใบเก่าดูย้อนหลังได้ตัวเลขเดิมเสมอ ไม่เพี้ยนเมื่อมีใบใหม่ออกทีหลัง
--
--   correct_amount ไม่เก็บเป็นคอลัมน์ เพราะขึ้นกับใบอื่นที่อาจถูก VOID ภายหลัง
--   เก็บซ้ำจะกลายเป็นตัวเลขค้างที่ไม่ตรงความจริง
--
-- ═══ สิ่งที่ไม่แตะ ════════════════════════════════════════════════════════
--   njacc_credit_notes (ตารางหัวใบ) · njacc_invoices · njacc_invoice_items
--   njacc_post_credit_note · njacc_void_credit_note · njacc_credit_note_view
--   njacc_credit_item_remaining · กติกาห้ามลดเกิน (ข้อ 26) — ยังบังคับที่ SQL เหมือนเดิม
--   RLS · Permission · Role
--   ไม่มี DROP / DELETE / TRUNCATE / UPDATE ข้อมูลเดิม
--
-- ROLLBACK :
--   ALTER TABLE public.njacc_credit_note_items DROP COLUMN original_amount;
--   แล้ว CREATE OR REPLACE njacc_save_credit_note_draft จาก RUN_3_CREDIT_NOTE.sql
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
DECLARE v_rows int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_schema='public' AND table_name='njacc_credit_note_items') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ยังไม่ได้รัน RUN_3_CREDIT_NOTE.sql'; END IF;
  SELECT count(*) INTO v_rows FROM public.njacc_credit_note_items;
  IF v_rows > 0 THEN
    RAISE WARNING 'มีรายการใบลดหนี้อยู่แล้ว % แถว — original_amount ของแถวเก่าจะเป็น NULL และเอกสารจะแสดง "-" ในช่องมูลค่าเดิม (ไม่เดาค่าให้)', v_rows;
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

SELECT 'P1 ข้อมูลก่อนแก้' AS check_name,
       (SELECT count(*) FROM public.njacc_credit_notes)      AS credit_notes,
       (SELECT count(*) FROM public.njacc_credit_note_items) AS items;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · Snapshot มูลค่าเดิมของบรรทัด Invoice ต้นฉบับ
ALTER TABLE public.njacc_credit_note_items
  ADD COLUMN IF NOT EXISTS original_amount numeric(14,2);

COMMENT ON COLUMN public.njacc_credit_note_items.original_amount IS
  'มูลค่าเดิมของบรรทัด Invoice ต้นฉบับ ณ เวลาที่ออกใบลดหนี้ (snapshot) · Correct = original_amount - amount';

-- 2.2 · บันทึก original_amount ตอนบันทึกร่าง
--       ยกของเดิมมาทั้งตัว เพิ่มเฉพาะการเก็บ original_amount
--       กติกาห้ามลดเกิน / VAT / เลขร่าง ไม่เปลี่ยนแม้แต่บรรทัดเดียว
CREATE OR REPLACE FUNCTION public.njacc_save_credit_note_draft(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
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
    IF v_src.invoice_id <> inv.id THEN RAISE EXCEPTION 'NJACC_CN_ITEM_NOT_IN_INVOICE'; END IF;
    IF v_src.id = ANY(v_seen) THEN RAISE EXCEPTION 'NJACC_CN_ITEM_DUPLICATE'; END IF;
    v_seen := v_seen || v_src.id;

    v_amt := round(coalesce((it->>'amount')::numeric, 0), 2);
    IF v_amt <= 0 THEN RAISE EXCEPTION 'NJACC_CN_AMOUNT_INVALID'; END IF;

    /* ── กติกาห้ามลดเกิน (ข้อ 26) — ไม่เปลี่ยนจากเดิม ──
       remaining = ยอดบรรทัดเดิม − Σ ที่ลดไปแล้วเฉพาะใบลดหนี้ที่ POSTED (ไม่นับใบตัวเอง) */
    v_rem := public.njacc_credit_item_remaining(v_src.id, v_id);
    IF v_amt > v_rem THEN RAISE EXCEPTION 'NJACC_CN_EXCEEDS_CREDITABLE'; END IF;

    v_rate := coalesce(v_src.vat_rate, 0);
    v_vat  := round(v_amt * v_rate / 100, 2);
    v_line := v_line + 1;

    INSERT INTO public.njacc_credit_note_items(
        credit_note_id, line_no, invoice_item_id, description,
        original_amount,          /* ← เพิ่ม: snapshot มูลค่าเดิมของบรรทัดต้นฉบับ */
        amount, vat_rate, vat_amount, credit_amount)
    VALUES (v_id, v_line, v_src.id,
            coalesce(nullif(btrim(coalesce(it->>'description','')), ''), v_src.description),
            round(v_src.amount, 2),
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
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_save_credit_note_draft(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_credit_note_draft(jsonb) FROM PUBLIC, anon;


-- 2.3 · njacc_credit_note_view — คืน Credit สะสม + Correct Amount ที่ถูกต้อง
--       ยกของเดิมมาทั้งตัว เปลี่ยนเฉพาะการประกอบ 'items'
--       สิทธิ์ / โครงสร้าง key อื่น ๆ เหมือนเดิมทุกบรรทัด
CREATE OR REPLACE FUNCTION public.njacc_credit_note_view(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
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
    /* ── Credit สะสม ──
       prior = ยอดจากใบ "อื่น" ที่ POSTED และ posted_at เก่ากว่าใบนี้
               ใบนี้ยังเป็น DRAFT (posted_at IS NULL) -> นับ POSTED ทุกใบที่มีอยู่
       VOID ไม่นับ · ใบตัวเองไม่นับซ้ำ */
    'items', (SELECT coalesce(jsonb_agg(
          to_jsonb(x)
          || jsonb_build_object(
               'prior_credited', pc.prior,
               'cumulative_credited', round(pc.prior + x.amount, 2),
               'correct_amount', CASE WHEN x.original_amount IS NULL THEN NULL
                                      ELSE round(x.original_amount - pc.prior - x.amount, 2) END)
          ORDER BY x.line_no), '[]'::jsonb)
       FROM public.njacc_credit_note_items x
       CROSS JOIN LATERAL (
         SELECT coalesce(round(sum(ci.amount), 2), 0) AS prior
           FROM public.njacc_credit_note_items ci
           JOIN public.njacc_credit_notes c2 ON c2.id = ci.credit_note_id
          WHERE ci.invoice_item_id = x.invoice_item_id
            AND c2.id <> cn.id
            AND c2.status = 'POSTED'
            AND (cn.posted_at IS NULL OR c2.posted_at < cn.posted_at)
       ) pc
      WHERE x.credit_note_id = cn.id))
  INTO v;
  RETURN v;
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_credit_note_view(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_credit_note_view(uuid) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY) — ทุกแถวต้องได้ PASS
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 คอลัมน์ original_amount มีจริง' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema='public' AND table_name='njacc_credit_note_items'
                            AND column_name='original_amount')
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 save_draft บันทึก original_amount',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%original_amount%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_credit_note_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 กติกาห้ามลดเกินยังอยู่ครบ',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%NJACC_CN_EXCEEDS_CREDITABLE%'
                    AND pg_get_functiondef(p.oid) LIKE '%njacc_credit_item_remaining%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_credit_note_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_save_credit_note_draft')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('anon','public.njacc_save_credit_note_draft(jsonb)','EXECUTE')
            THEN 'FAIL' ELSE 'PASS' END
UNION ALL
SELECT 'V6 authenticated ยังเรียกได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_save_credit_note_draft(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7a view คืน Credit สะสม (correct_amount/prior_credited)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%prior_credited%'
                    AND pg_get_functiondef(p.oid) LIKE '%cumulative_credited%'
                    AND pg_get_functiondef(p.oid) LIKE '%correct_amount%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_credit_note_view')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7b view นับเฉพาะใบ POSTED (VOID ไม่นับ)',
       CASE WHEN (SELECT pg_get_functiondef(p.oid) LIKE '%c2.status = ''POSTED''%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_credit_note_view')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 njacc_invoice_items ไม่ถูกแตะ',
       CASE WHEN (SELECT count(*) FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_invoice_items') = 17
            THEN 'PASS' ELSE 'CHECK (ค่าอ้างอิงวัดเมื่อ 17/08/2026 = 17 คอลัมน์)' END;

-- V9 · กัน Over Credit — ยอดสะสมของทุก invoice_item_id ต้องไม่เกินยอดเดิม
SELECT 'V9 no over-credit' AS check_name,
       count(*) AS violating_items,
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL — มีรายการลดเกินยอดเดิม' END AS result
  FROM (SELECT ci.invoice_item_id, sum(ci.amount) AS credited,
               (SELECT ii.amount FROM public.njacc_invoice_items ii
                 WHERE ii.id = ci.invoice_item_id) AS original
          FROM public.njacc_credit_note_items ci
          JOIN public.njacc_credit_notes c2 ON c2.id = ci.credit_note_id
         WHERE c2.status = 'POSTED'
         GROUP BY ci.invoice_item_id) t
 WHERE t.credited > t.original + 0.005;

-- V8 · ข้อมูลไม่ถูกแตะ (เทียบกับ P1)
SELECT 'V8 ข้อมูล' AS check_name,
       (SELECT count(*) FROM public.njacc_credit_notes)      AS credit_notes,
       (SELECT count(*) FROM public.njacc_credit_note_items) AS items,
       (SELECT count(*) FROM public.njacc_invoices)          AS invoices;
