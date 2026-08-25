-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-29 · DOCUMENT > SERVICE : บันทึก = DRAFT (ไม่กินเลข) · POST = ออกเลขจริง
--   Source of Truth ของ njacc_save_job + njacc_post_job ที่ใช้จริงบน Production
--   Migration Chain : 005 -> 008 -> RUN-28 -> RUN-29
--
-- ⚠️ *** DOCUMENT > ADVANCE ไม่เปลี่ยนพฤติกรรมแม้แต่นิดเดียว ***
--     ADVANCE : CREATE -> ออก ANJ ทันที + operational_status = 'OPEN' (เดิม)
--     SERVICE : CREATE -> job_no NULL · open_no NULL · status 'DRAFT' (ใหม่)
--               POST   -> ออก NJL + open_no + status 'POSTED'
--
-- โครงสร้างที่แก้ (ตรวจ Production จริงก่อนแก้) :
--   njacc_jobs.job_no  text NOT NULL -> DROP NOT NULL
--     *** ไม่ DROP COLUMN · ไม่แตะข้อมูลเดิม ***
--     njacc_jobs_no_uq = UNIQUE(job_no) คงไว้ — Postgres ยอมให้ NULL ซ้ำได้
--     -> DRAFT หลายใบอยู่ร่วมกันได้ · เลขจริงยังห้ามซ้ำ
--   njacc_jobs_ostatus_ck : เพิ่ม 'DRAFT' และ 'POSTED'
--   njacc_jobs_draft_no_number_ck (ใหม่) : DRAFT ต้องไม่มี job_no
--
-- ตัวกรองรายการ : njacc_build_charge_set queue='document' ใช้
--   operational_status <> 'CLOSE' -> DRAFT/POSTED โผล่ในรายการอยู่แล้ว
--   *** ไม่ต้องแก้ตัวกรอง ***
--
-- Idempotency (สืบทอดจาก RUN-28) :
--   CREATE : บังคับ request_id + Gate ก่อนแตะ Counter
--   POST   : request_id เช่นกัน -> กดรัว/Retry ได้เลขเดิม Counter ไม่เดินเพิ่ม
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── SECTION 1 · โครงสร้าง ────────────────────────────────────────────────────
ALTER TABLE public.njacc_jobs ALTER COLUMN job_no DROP NOT NULL;

ALTER TABLE public.njacc_jobs DROP CONSTRAINT IF EXISTS njacc_jobs_ostatus_ck;
ALTER TABLE public.njacc_jobs
  ADD CONSTRAINT njacc_jobs_ostatus_ck
  CHECK (operational_status = ANY (ARRAY[
    'DRAFT'::text, 'POSTED'::text,
    'OPEN'::text, 'PROCESSING'::text, 'CLOSE'::text, 'CANCELED'::text]));

ALTER TABLE public.njacc_jobs DROP CONSTRAINT IF EXISTS njacc_jobs_draft_no_number_ck;
ALTER TABLE public.njacc_jobs
  ADD CONSTRAINT njacc_jobs_draft_no_number_ck
  CHECK (operational_status <> 'DRAFT' OR job_no IS NULL);

-- ── SECTION 2 · MIGRATION ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.njacc_save_job(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; v_id uuid; v_no text; v_open text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
        v_new boolean := (p->>'id') IS NULL;
        v_base date;
        v_req text := nullif(btrim(coalesce(p->>'request_id','')),'');
        v_ins int; v_prev uuid; v_st text;
BEGIN
  pr := public.njacc_req_profile();
  IF v_new AND NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF NOT v_new AND NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;

  IF v_new THEN
    /* Idempotency Gate (RUN-28) — ทำก่อนแตะ Counter เสมอ */
    IF v_req IS NULL THEN RAISE EXCEPTION 'NJACC_REQUEST_ID_REQUIRED'; END IF;
    IF v_req !~ '^[A-Za-z0-9_-]{8,64}$' THEN RAISE EXCEPTION 'NJACC_BAD_REQUEST_ID'; END IF;
    INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type)
    VALUES (v_req,'CREATE_JOB',pr.id,'job')
    ON CONFLICT (request_id) DO NOTHING;
    GET DIAGNOSTICS v_ins = ROW_COUNT;
    IF v_ins = 0 THEN
      SELECT result_id INTO v_prev FROM public.njacc_idempotency_requests
       WHERE request_id = v_req AND operation = 'CREATE_JOB';
      IF v_prev IS NULL THEN RAISE EXCEPTION 'NJACC_REQUEST_IN_PROGRESS'; END IF;
      RETURN (SELECT jsonb_build_object('id',j.id,'job_no',j.job_no,'open_no',j.open_no,
                                        'operational_status',j.operational_status,'idempotent',true)
                FROM public.njacc_jobs j WHERE j.id = v_prev);
    END IF;

    IF v_charge = 'SERVICE' THEN
      /* ══ RUN-29 · SERVICE = บันทึกเป็น DRAFT ══════════════════════════════
         *** ไม่เรียก njacc_next_month_no / njacc_next_doc_no เลย ***
         -> Counter ไม่เดิน · Save Draft / COPY / Preview จึงไม่มีทางกินเลข */
      v_no := NULL; v_open := NULL; v_st := 'DRAFT';
    ELSE
      /* ══ ADVANCE = พฤติกรรมเดิมทุกประการ (ออกเลขทันที) ══════════════════ */
      v_base := coalesce((p->>'job_date')::date, (p->>'reference_date')::date, current_date);
      v_no := public.njacc_next_month_no('ANJ_MONTH', 'ANJ', v_base, 5);   -- ANJ202608-00001
      v_open := public.njacc_next_doc_no('JOB_OPEN',
        v_charge||'-'||v_group||'-'||to_char(now(),'YYYY'),
        'OP'||left(v_charge,1)||to_char(now(),'YY')||'-');
      v_st := 'OPEN';
    END IF;

    INSERT INTO public.njacc_jobs(open_no,job_no,charge_type,company_group,data_type,reference_no,
      reference_date,job_date,company_invoice_id,customer_id,customs_declaration_no,source_invoice_no,
      house_bl_no,master_bl_no,booking_no,vessel_name,qty_container,etd,eta,delivery_date,
      customer_job_no,credit_term_days,due_date,note,case_no,contact,cs_name,i_billing_apl,
      operational_status,created_by,updated_by)
    VALUES (v_open,v_no,v_charge,v_group,p->>'data_type',p->>'reference_no',
      (p->>'reference_date')::date,(p->>'job_date')::date,(p->>'company_invoice_id')::uuid,(p->>'customer_id')::uuid,
      p->>'customs_declaration_no',p->>'source_invoice_no',p->>'house_bl_no',p->>'master_bl_no',
      p->>'booking_no',p->>'vessel_name',(p->>'qty_container')::int,(p->>'etd')::date,
      (p->>'eta')::date,(p->>'delivery_date')::date,p->>'customer_job_no',
      (p->>'credit_term_days')::int,(p->>'due_date')::date,p->>'note',
      p->>'case_no',p->>'contact',p->>'cs_name',p->>'i_billing_apl',
      v_st,pr.id,pr.id)
    RETURNING id INTO v_id;

    UPDATE public.njacc_idempotency_requests SET result_id = v_id WHERE request_id = v_req;
    PERFORM public.njacc_audit(pr.id,'CREATE_JOB','job',v_id::text,
      jsonb_build_object('job_no',v_no,'open_no',v_open,'status',v_st,'request_id',v_req));
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
    SELECT job_no, open_no, operational_status INTO v_no, v_open, v_st
      FROM public.njacc_jobs WHERE id=v_id;
    PERFORM public.njacc_audit(pr.id,'EDIT_JOB','job',v_id::text,NULL);
  END IF;

  IF p ? 'containers' THEN
    DELETE FROM public.njacc_job_containers WHERE job_id=v_id;
    INSERT INTO public.njacc_job_containers(job_id,container_no,container_type,sequence_no)
    SELECT v_id, x->>'container_no', x->>'container_type', ord
      FROM jsonb_array_elements(p->'containers') WITH ORDINALITY AS t(x,ord)
     WHERE coalesce(x->>'container_no','') <> '';
  END IF;
  RETURN jsonb_build_object('id',v_id,'job_no',v_no,'open_no',v_open,
                            'operational_status',v_st);
END $function$;

/* ══ njacc_post_job — จุดเดียวที่ SERVICE ออก Running Number ═══════════════ */
CREATE OR REPLACE FUNCTION public.njacc_post_job(p_id uuid, p_request_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; j public.njacc_jobs;
        v_no text; v_open text; v_base date; v_ins int; v_prev uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF coalesce(p_request_id,'') !~ '^[A-Za-z0-9_-]{8,64}$' THEN RAISE EXCEPTION 'NJACC_BAD_REQUEST_ID'; END IF;

  /* Idempotency — ยิงซ้ำ/กดรัว ต้องได้เลขเดิม ไม่เดิน Counter เพิ่ม */
  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'POST_JOB',pr.id,'job',p_id)
  ON CONFLICT (request_id) DO NOTHING;
  GET DIAGNOSTICS v_ins = ROW_COUNT;
  IF v_ins = 0 THEN
    SELECT result_id INTO v_prev FROM public.njacc_idempotency_requests
     WHERE request_id = p_request_id AND operation = 'POST_JOB';
    IF v_prev IS NULL THEN RAISE EXCEPTION 'NJACC_REQUEST_IN_PROGRESS'; END IF;
    RETURN (SELECT jsonb_build_object('id',x.id,'job_no',x.job_no,'open_no',x.open_no,
                                      'operational_status',x.operational_status,'idempotent',true)
              FROM public.njacc_jobs x WHERE x.id = v_prev);
  END IF;

  SELECT * INTO j FROM public.njacc_jobs WHERE id = p_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'NJACC_JOB_NOT_FOUND'; END IF;
  IF NOT public.njacc_can(j.charge_type, j.company_group, 'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  /* *** POST ใช้กับ SERVICE เท่านั้น *** ADVANCE ออกเลขตั้งแต่ CREATE อยู่แล้ว */
  IF j.charge_type <> 'SERVICE' THEN RAISE EXCEPTION 'NJACC_POST_SERVICE_ONLY'; END IF;
  IF j.operational_status = 'CANCELED' THEN RAISE EXCEPTION 'NJACC_JOB_CANCELED'; END IF;
  IF j.operational_status <> 'DRAFT' OR j.job_no IS NOT NULL THEN
    RAISE EXCEPTION 'NJACC_JOB_ALREADY_POSTED'; END IF;

  v_base := coalesce(j.job_date, j.reference_date, current_date);
  v_no := public.njacc_next_month_no('NJL_MONTH', 'NJL', v_base, 5);   -- NJL202608-00001
  v_open := public.njacc_next_doc_no('JOB_OPEN',
    j.charge_type||'-'||j.company_group||'-'||to_char(now(),'YYYY'),
    'OP'||left(j.charge_type,1)||to_char(now(),'YY')||'-');

  UPDATE public.njacc_jobs
     SET job_no = v_no, open_no = coalesce(open_no, v_open),
         operational_status = 'POSTED', updated_by = pr.id
   WHERE id = p_id;

  PERFORM public.njacc_audit(pr.id,'POST_JOB','job',p_id::text,
    jsonb_build_object('job_no',v_no,'open_no',v_open,'request_id',p_request_id));
  RETURN jsonb_build_object('id',p_id,'job_no',v_no,'open_no',v_open,
                            'operational_status','POSTED');
END $function$;

REVOKE ALL     ON FUNCTION public.njacc_save_job(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_save_job(jsonb) TO authenticated;
REVOKE ALL     ON FUNCTION public.njacc_post_job(uuid,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_post_job(uuid,text) TO authenticated;

COMMIT;

-- ── SECTION 3 · VERIFY (READ ONLY — รันซ้ำได้ทุกเมื่อ) ───────────────────────
WITH c AS (
  SELECT regexp_replace(regexp_replace(
    pg_get_functiondef('public.njacc_save_job(jsonb)'::regprocedure),
    '/\*.*?\*/',' ','g'), '--[^\n]*',' ','g') AS sv,
  regexp_replace(regexp_replace(
    pg_get_functiondef('public.njacc_post_job(uuid,text)'::regprocedure),
    '/\*.*?\*/',' ','g'), '--[^\n]*',' ','g') AS po
)
SELECT 'K1 job_no รับ NULL ได้ (DRAFT)' AS check_name,
       CASE WHEN (SELECT is_nullable FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='njacc_jobs'
                     AND column_name='job_no') = 'YES' THEN 'PASS' ELSE 'FAIL' END AS result FROM c
UNION ALL SELECT 'K2 UNIQUE(job_no) ยังอยู่',
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
                          AND tablename='njacc_jobs' AND indexname='njacc_jobs_no_uq')
            THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K3 CHECK status รองรับ DRAFT / POSTED',
       CASE WHEN (SELECT pg_get_constraintdef(oid) FROM pg_constraint
                   WHERE conrelid='public.njacc_jobs'::regclass AND conname='njacc_jobs_ostatus_ck')
                 LIKE '%DRAFT%POSTED%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K4 DRAFT ต้องไม่มี job_no (Database บังคับ)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint
                          WHERE conrelid='public.njacc_jobs'::regclass
                            AND conname='njacc_jobs_draft_no_number_ck')
            THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K5 *** SERVICE CREATE ไม่เรียก Counter ***',
       CASE WHEN sv LIKE '%v_no := NULL; v_open := NULL; v_st := ''DRAFT'';%'
            THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K6 ADVANCE CREATE ยังออก ANJ ทันที (เดิม)',
       CASE WHEN sv LIKE '%njacc_next_month_no(''ANJ_MONTH'', ''ANJ''%'
            AND  sv LIKE '%v_st := ''OPEN''%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K7 POST ออก NJL + POSTED',
       CASE WHEN po LIKE '%njacc_next_month_no(''NJL_MONTH'', ''NJL''%'
            AND  po LIKE '%operational_status = ''POSTED''%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K8 POST ใช้กับ SERVICE เท่านั้น',
       CASE WHEN po LIKE '%NJACC_POST_SERVICE_ONLY%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K9 POST กันซ้ำ + idempotent',
       CASE WHEN po LIKE '%NJACC_JOB_ALREADY_POSTED%'
            AND  po LIKE '%ON CONFLICT (request_id) DO NOTHING%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K10 CREATE ยังบังคับ request_id (RUN-28)',
       CASE WHEN sv LIKE '%NJACC_REQUEST_ID_REQUIRED%' THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K11 สิทธิ์ : authenticated ได้ · anon ไม่ได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_post_job(uuid,text)','EXECUTE')
            AND  NOT has_function_privilege('anon','public.njacc_post_job(uuid,text)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END FROM c
UNION ALL SELECT 'K12 Duplicate job_no (ต้อง 0)',
       (SELECT count(*)::text FROM (SELECT job_no FROM public.njacc_jobs
          WHERE job_no IS NOT NULL GROUP BY job_no HAVING count(*)>1) t) FROM c;
