-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-01_document_number_migration.sql
-- เลขเอกสารรายเดือนของงาน (DOCUMENT) — JOB / AD
--   DOCUMENT > SERVICE   JOB{YYYYMM}-#####   เช่น JOB202608-00001   (5 หลัก)
--   DOCUMENT > ADVANCE   AD{YYYYMM}-####     เช่น AD202608-0001     (4 หลัก)
-- จุดออกเลข: บันทึกงานครั้งแรก (v_new) — ตรวจ Flow จริงแล้ว DOCUMENT ไม่มี POST
--   charge-page.js ALLOW.document = ['view','close','delete','note']  (ไม่มี post)
--   ปุ่ม POST/UNPOST มีเฉพาะฝั่ง ACCOUNTING (ใบแจ้งหนี้) เท่านั้น
--
-- ═══ ขอบเขต — แก้เฉพาะ "บรรทัดที่ออกเลขงาน" ═══════════════════════════════
--   ยกนิยาม njacc_save_job จาก Production มาทั้งตัว (pg_get_functiondef)
--   แล้วเปลี่ยนเฉพาะบรรทัด v_no := ...  ตรรกะอื่นเหมือนเดิมทุกบรรทัด:
--   สิทธิ์ · validation · INSERT/UPDATE ทุกคอลัมน์ · containers · audit · ค่าที่ return
--
--   ไม่แตะ: njacc_next_doc_no · njacc_next_month_doc_no · njacc_issue_invoice ·
--           njacc_post_draft_invoice · njacc_receive_payment ·
--           njacc_next_credit_note_no · ตาราง · RLS · policy · trigger · Permission
--   ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE / UPDATE ข้อมูลเดิม ในไฟล์นี้
--   (การปรับเลขเดิมอยู่ใน RUN-03 แยกไฟล์)
--
-- ═══ ทำไมไม่เปลี่ยนชื่อ counter เดิมเป็น NJ_MONTH / ADV_MONTH / ... ═══════
--   Production ใช้ doc_type = INVOICE_MONTH / ADVANCE_MONTH / RECEIPT_MONTH /
--   CREDIT_NOTE_MONTH อยู่แล้ว และ "แยกกันครบทุก prefix" ตามข้อกำหนดข้อ 4 แล้ว
--   ถ้าเปลี่ยนชื่อ doc_type จะกลายเป็นแถว counter ใหม่ที่ last_number = 0
--   -> เลขจะเริ่มที่ 1 ใหม่ และชนกับเอกสารที่ออกไปแล้วในเดือนเดียวกัน
--   จึงคงชื่อเดิมไว้ และเพิ่มเฉพาะ JOB_MONTH / AD_MONTH ที่ยังไม่มี
--
-- ลำดับการรัน:  RUN-01 (ไฟล์นี้)  ->  RUN-03 (backfill)  ->  RUN-02 (verify)
-- Rollback:     ดูท้ายไฟล์
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. PREFLIGHT ──────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_save_job') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_save_job';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname='public' AND c.relname='njacc_document_sequences') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบตาราง njacc_document_sequences';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='njacc_jobs_no_uq') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ UNIQUE njacc_jobs_no_uq (กันเลขซ้ำ)';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $$;

-- ── 2. ตัวออกเลขรายเดือนแบบกำหนดจำนวนหลักได้ ──────────────────────────────
--   ทำไมต้องมีตัวใหม่: njacc_next_month_doc_no เดิม lpad คงที่ 5 หลัก
--   แต่ AD ต้องเป็น 4 หลักตามสเปก -> สร้างฟังก์ชันใหม่ "คนละชื่อ"
--   เพื่อไม่แตะของเดิมที่ NJ / ADV / RCP / CN ใช้อยู่จริง
--   Atomic แบบเดียวกันเป๊ะ:
--     INSERT ... ON CONFLICT DO NOTHING   สร้างแถว counter ถ้ายังไม่มี
--     UPDATE ... RETURNING                จับ row lock -> 2 session พร้อมกันเข้าคิว
--   ไม่ใช้ MAX()+1 · ไม่ใช้ random · ไม่ใช้ now() เป็นเลข
CREATE OR REPLACE FUNCTION public.njacc_next_month_no(
  p_type text, p_prefix text, p_date date DEFAULT NULL, p_pad int DEFAULT 5)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_scope text; v_n bigint;
BEGIN
  IF p_type IS NULL OR p_prefix IS NULL THEN RAISE EXCEPTION 'NJACC_SEQ_BAD_ARGS'; END IF;
  IF p_pad IS NULL OR p_pad < 1 OR p_pad > 12 THEN RAISE EXCEPTION 'NJACC_SEQ_BAD_PAD'; END IF;
  v_scope := to_char(coalesce(p_date, current_date), 'YYYYMM');
  INSERT INTO public.njacc_document_sequences(doc_type, scope_key, last_number)
  VALUES (p_type, v_scope, 0)
  ON CONFLICT (doc_type, scope_key) DO NOTHING;
  UPDATE public.njacc_document_sequences
     SET last_number = last_number + 1
   WHERE doc_type = p_type AND scope_key = v_scope
   RETURNING last_number INTO v_n;
  IF v_n IS NULL THEN RAISE EXCEPTION 'NJACC_SEQ_FAILED: % %', p_type, v_scope; END IF;
  RETURN p_prefix || v_scope || '-' || lpad(v_n::text, p_pad, '0');
END $fn$;

REVOKE ALL ON FUNCTION public.njacc_next_month_no(text, text, date, int)
  FROM PUBLIC, anon, authenticated;

-- ── 3. njacc_save_job — เปลี่ยนเฉพาะบรรทัดที่ออกเลขงาน ────────────────────
--   v_base = วันที่เอกสารจริงของงาน  coalesce(job_date, reference_date, current_date)
--   -> ผู้ใช้แก้ "วันที่งาน" เป็นเดือนอื่นก่อนบันทึก เลขจะอิงเดือนของวันที่งาน (ข้อ 9)
--   เลขออกเฉพาะตอน v_new (บันทึกครั้งแรก) — บันทึกซ้ำ/แก้ไข ไม่แตะ job_no เหมือนเดิม
CREATE OR REPLACE FUNCTION public.njacc_save_job(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE pr public.njacc_profiles; v_id uuid; v_no text; v_open text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_new boolean := (p->>'id') IS NULL;
        v_base date;
BEGIN
  pr := public.njacc_req_profile();
  IF v_new AND NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF NOT v_new AND NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;
  IF v_new THEN
    /* ▼▼ เปลี่ยนเฉพาะบล็อกนี้ ▼▼ — เดิมคือ njacc_next_doc_no('JOB', ..., 'J'||...) */
    v_base := coalesce((p->>'job_date')::date, (p->>'reference_date')::date, current_date);
    IF v_charge = 'ADVANCE' THEN
      v_no := public.njacc_next_month_no('AD_MONTH',  'AD',  v_base, 4);   -- AD202608-0001
    ELSE
      v_no := public.njacc_next_month_no('JOB_MONTH', 'JOB', v_base, 5);   -- JOB202608-00001
    END IF;
    /* ▲▲ จบส่วนที่เปลี่ยน ▲▲ */
    /* เลขเปิดงาน — sequence แยกจาก job_no · ไม่อยู่ในสเปกรอบนี้ จึงคงเดิมทุกประการ */
    v_open := public.njacc_next_doc_no('JOB_OPEN',
      v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
      'OP'||left(v_charge,1)||to_char(now(),'YY')||'-');
    INSERT INTO public.njacc_jobs(open_no,job_no,charge_type,company_group,data_type,reference_no,
      reference_date,job_date,company_invoice_id,customer_id,customs_declaration_no,source_invoice_no,
      house_bl_no,master_bl_no,booking_no,vessel_name,qty_container,etd,eta,delivery_date,
      customer_job_no,credit_term_days,due_date,note,case_no,contact,cs_name,i_billing_apl,
      created_by,updated_by)
    VALUES (v_open,v_no,v_charge,v_group,p->>'data_type',p->>'reference_no',
      (p->>'reference_date')::date,(p->>'job_date')::date,(p->>'company_invoice_id')::uuid,(p->>'customer_id')::uuid,
      p->>'customs_declaration_no',p->>'source_invoice_no',p->>'house_bl_no',p->>'master_bl_no',
      p->>'booking_no',p->>'vessel_name',(p->>'qty_container')::int,(p->>'etd')::date,
      (p->>'eta')::date,(p->>'delivery_date')::date,p->>'customer_job_no',
      (p->>'credit_term_days')::int,(p->>'due_date')::date,p->>'note',
      p->>'case_no',p->>'contact',p->>'cs_name',p->>'i_billing_apl',pr.id,pr.id)
    RETURNING id INTO v_id;
    PERFORM public.njacc_audit(pr.id,'CREATE_JOB','job',v_id::text,
      jsonb_build_object('job_no',v_no,'open_no',v_open));
  ELSE
    v_id := (p->>'id')::uuid;
    UPDATE public.njacc_jobs SET data_type=p->>'data_type', reference_no=p->>'reference_no',
      reference_date=(p->>'reference_date')::date,
      job_date=CASE WHEN p ? 'job_date' THEN (p->>'job_date')::date ELSE job_date END,
      company_invoice_id=(p->>'company_invoice_id')::uuid, customer_id=(p->>'customer_id')::uuid,
      customs_declaration_no=p->>'customs_declaration_no', source_invoice_no=p->>'source_invoice_no',
      house_bl_no=p->>'house_bl_no', master_bl_no=p->>'master_bl_no', booking_no=p->>'booking_no',
      vessel_name=p->>'vessel_name', qty_container=(p->>'qty_container')::int,
      etd=(p->>'etd')::date, eta=(p->>'eta')::date, delivery_date=(p->>'delivery_date')::date,
      customer_job_no=p->>'customer_job_no', credit_term_days=(p->>'credit_term_days')::int,
      due_date=(p->>'due_date')::date, note=p->>'note',
      case_no=p->>'case_no', contact=p->>'contact', cs_name=p->>'cs_name',
      i_billing_apl=p->>'i_billing_apl', updated_by=pr.id
    WHERE id=v_id AND charge_type=v_charge AND company_group=v_group
      AND operational_status <> 'CANCELED';
    IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
    PERFORM public.njacc_audit(pr.id,'EDIT_JOB','job',v_id::text,NULL);
  END IF;
  IF p ? 'containers' THEN
    DELETE FROM public.njacc_job_containers WHERE job_id=v_id;
    INSERT INTO public.njacc_job_containers(job_id,container_no,container_type,sequence_no)
    SELECT v_id, x->>'container_no', x->>'container_type', ord
      FROM jsonb_array_elements(p->'containers') WITH ORDINALITY AS t(x,ord)
     WHERE coalesce(x->>'container_no','') <> '';
  END IF;
  RETURN jsonb_build_object('id',v_id,'job_no',v_no,'open_no',v_open);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_save_job(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_save_job(jsonb) FROM PUBLIC, anon;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
-- คืนบล็อกออกเลขกลับเป็นของเดิม (แทนที่บล็อกระหว่าง ▼▼ ▲▲ ด้วยบรรทัดนี้):
--   v_no := public.njacc_next_doc_no('JOB',
--     v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
--     'J'||left(v_charge,1)||left(v_group,2)||to_char(now(),'YY')||'-');
-- แล้วรัน CREATE OR REPLACE FUNCTION njacc_save_job ใหม่ทั้งตัว
-- ฟังก์ชัน njacc_next_month_no ทิ้งไว้ได้ (ไม่มีใครเรียก) หรือ:
--   DROP FUNCTION IF EXISTS public.njacc_next_month_no(text,text,date,int);
-- counter ที่เกิดขึ้นใหม่:
--   DELETE FROM public.njacc_document_sequences WHERE doc_type IN ('JOB_MONTH','AD_MONTH');
--   (ทำเฉพาะตอน rollback และต้องไม่มีเอกสารที่ใช้เลขชุดใหม่ค้างอยู่)
