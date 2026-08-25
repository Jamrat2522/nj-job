-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-28 · เลขงานอัตโนมัติ: กันชน / กันข้าม / กัน Retry สร้างงานซ้ำ
--   Source of Truth ของ njacc_save_job เวอร์ชันที่ใช้จริงบน Production
--   *** ไฟล์นี้แทนที่ njacc_save_job ของ 005_njacc_rpc.sql และ
--       008_njacc_features_v11.sql *** (ลำดับ Migration: 005 -> 008 -> RUN-28)
--
-- ⚠️ ลำดับรัน : ต้องรัน 005_njacc_rpc.sql · 008_njacc_features_v11.sql ·
--    02_RUN-01_FINAL_DOCUMENT_NUMBERS.sql มาก่อน
--
-- ═══ ปัญหาที่แก้ ═══════════════════════════════════════════════════════════
--   njacc_save_job เดิม *** ไม่มี Idempotency เลย ***
--   -> Double Click / Network Retry / Refresh ส่งซ้ำ / Direct RPC
--      = สร้าง Job ใหม่ + กินเลขใหม่ทุกครั้ง ทั้งที่เป็น Intent เดียวกัน
--
-- ═══ สิ่งที่ตรวจแล้วว่าปลอดภัยอยู่แล้ว — ไม่แตะ ══════════════════════════
--   njacc_next_month_no / njacc_next_doc_no :
--     INSERT ON CONFLICT DO NOTHING + UPDATE last_number+1 RETURNING
--     = Atomic row lock  *** ไม่ใช่ MAX()+1 ***  -> concurrent ปลอดภัย
--   njacc_jobs_no_uq            = UNIQUE (job_no)
--   njacc_idempotency_requests  = PRIMARY KEY (request_id)
--   -> ไม่สร้างตารางใหม่ · ไม่เพิ่มคอลัมน์ · ไม่เพิ่ม Index
--
-- ═══ สิ่งที่เพิ่มในไฟล์นี้ ════════════════════════════════════════════════
--   1) บังคับ request_id สำหรับ CREATE  -> NJACC_REQUEST_ID_REQUIRED
--   2) ตรวจรูปแบบ request_id            -> NJACC_BAD_REQUEST_ID
--   3) Idempotency Gate ก่อนแตะ Counter -> ซ้ำ = คืนงานเดิม + idempotent:true
--   *** ไม่เปลี่ยน signature *** รับผ่าน payload เดิม p->>'request_id'
--   *** EDIT (มี id) ไม่ต้องมี request_id และไม่แตะ Counter ***
--
-- ═══ ลำดับใน Transaction เดียว ════════════════════════════════════════════
--   Permission -> charge/group -> request_id -> Gate -> Counter -> INSERT Job
--   -> UPDATE result_id -> COMMIT
--   พังก่อน COMMIT = ROLLBACK ทั้งหมด (Counter + request_id + Job) -> ไม่กินเลข
--
--   *** ON CONFLICT DO NOTHING จะ block จน transaction แรก commit/rollback ***
--     tx แรก commit   -> ได้ 0 แถว + เห็น result_id -> คืนงานเดิม
--     tx แรก rollback -> conflict หายไป -> INSERT สำเร็จ ออกเลขตามปกติ
--
-- ═══ ห้ามเปลี่ยน ══════════════════════════════════════════════════════════
--   Prefix (NJL/ANJ) · รูปแบบเลข · Scope เดือน/ปี · SERVICE/ADVANCE ·
--   Permission · Role · Job Flow
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ── SECTION 1 · ยืนยันโครงสร้างที่จำเป็น (ไม่สร้างใหม่ถ้ามีแล้ว) ─────────────
CREATE TABLE IF NOT EXISTS public.njacc_idempotency_requests(
  request_id  text PRIMARY KEY,
  operation   text NOT NULL,
  profile_id  uuid,
  result_type text,
  result_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS njacc_jobs_no_uq ON public.njacc_jobs(job_no);

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
        v_ins int; v_prev uuid;
BEGIN
  pr := public.njacc_req_profile();
  IF v_new AND NOT public.njacc_can(v_charge,v_group,'create') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF NOT v_new AND NOT public.njacc_can(v_charge,v_group,'edit') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_charge NOT IN ('SERVICE','ADVANCE') OR v_group NOT IN ('NJ','DSV','MAERSK','KUEHNE','RHENUS') THEN
    RAISE EXCEPTION 'NJACC_BAD_GROUP';
  END IF;

  IF v_new THEN
    /* *** ตรวจ request_id ก่อนเรียก Running Number เสมอ ***
       -> ไม่มี / รูปแบบผิด = ไม่มีทางแตะ counter ได้เลย */
    IF v_req IS NULL THEN RAISE EXCEPTION 'NJACC_REQUEST_ID_REQUIRED'; END IF;
    IF v_req !~ '^[A-Za-z0-9_-]{8,64}$' THEN RAISE EXCEPTION 'NJACC_BAD_REQUEST_ID'; END IF;

    INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type)
    VALUES (v_req,'CREATE_JOB',pr.id,'job')
    ON CONFLICT (request_id) DO NOTHING;
    GET DIAGNOSTICS v_ins = ROW_COUNT;
    IF v_ins = 0 THEN
      /* request_id นี้เคยใช้แล้ว -> คืนงานเดิม ห้ามออกเลขใหม่ ห้าม INSERT ใหม่ */
      SELECT result_id INTO v_prev FROM public.njacc_idempotency_requests
       WHERE request_id = v_req AND operation = 'CREATE_JOB';
      IF v_prev IS NULL THEN RAISE EXCEPTION 'NJACC_REQUEST_IN_PROGRESS'; END IF;
      RETURN (SELECT jsonb_build_object('id',j.id,'job_no',j.job_no,'open_no',j.open_no,
                                        'idempotent',true)
                FROM public.njacc_jobs j WHERE j.id = v_prev);
    END IF;

    v_base := coalesce((p->>'job_date')::date, (p->>'reference_date')::date, current_date);
    IF v_charge = 'ADVANCE' THEN
      v_no := public.njacc_next_month_no('ANJ_MONTH', 'ANJ', v_base, 5);   -- ANJ202608-00001
    ELSE
      v_no := public.njacc_next_month_no('NJL_MONTH', 'NJL', v_base, 5);   -- NJL202608-00001
    END IF;

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

    UPDATE public.njacc_idempotency_requests SET result_id = v_id WHERE request_id = v_req;

    PERFORM public.njacc_audit(pr.id,'CREATE_JOB','job',v_id::text,
      jsonb_build_object('job_no',v_no,'open_no',v_open,'request_id',v_req));
  ELSE
    /* ── EDIT — ไม่ต้องมี request_id · ไม่แตะ Counter · ไม่สร้าง Idempotency Row ── */
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

/* สิทธิ์เดิม — authenticated เท่านั้น (anon / PUBLIC ไม่เปิด) */
REVOKE ALL     ON FUNCTION public.njacc_save_job(jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.njacc_save_job(jsonb) TO authenticated;

COMMIT;

-- ── SECTION 3 · VERIFY (READ ONLY — รันซ้ำได้ทุกเมื่อ) ───────────────────────
--   ตัดคอมเมนต์ก่อนตรวจเสมอ (pg_get_functiondef คืนคอมเมนต์มาด้วย)
WITH code AS (
  SELECT regexp_replace(regexp_replace(
    pg_get_functiondef('public.njacc_save_job(jsonb)'::regprocedure),
    '/\*.*?\*/',' ','g'), '--[^\n]*',' ','g') AS c
)
SELECT 'J1  CREATE บังคับ request_id' AS check_name,
       CASE WHEN c LIKE '%NJACC_REQUEST_ID_REQUIRED%' THEN 'PASS' ELSE 'FAIL' END AS result FROM code
UNION ALL SELECT 'J2  ตรวจรูปแบบ request_id',
       CASE WHEN c LIKE '%NJACC_BAD_REQUEST_ID%' THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J3  *** ตรวจ request_id ก่อนแตะ Counter ***',
       CASE WHEN position('NJACC_REQUEST_ID_REQUIRED' in c) < position('njacc_next_month_no' in c)
            AND  position('NJACC_BAD_REQUEST_ID'      in c) < position('njacc_next_month_no' in c)
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J4  Idempotency Gate อยู่ก่อน Counter',
       CASE WHEN position('ON CONFLICT (request_id) DO NOTHING' in c) < position('njacc_next_month_no' in c)
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J5  ซ้ำ -> คืนงานเดิม + idempotent',
       CASE WHEN c LIKE '%''idempotent'',true%' THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J6  Counter ยังเป็น Atomic (ไม่ใช่ MAX+1)',
       CASE WHEN (SELECT regexp_replace(regexp_replace(
                    pg_get_functiondef('public.njacc_next_month_no(text,text,date,integer)'::regprocedure),
                    '/\*.*?\*/',' ','g'), '--[^\n]*',' ','g'))
                 LIKE '%SET last_number = last_number + 1%'
            AND  (SELECT regexp_replace(regexp_replace(
                    pg_get_functiondef('public.njacc_next_month_no(text,text,date,integer)'::regprocedure),
                    '/\*.*?\*/',' ','g'), '--[^\n]*',' ','g'))
                 NOT LIKE '%max(%' THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J7  EDIT ไม่บังคับ request_id / ไม่แตะ Counter',
       CASE WHEN c LIKE '%NJACC_JOB_NOT_FOUND%'
            AND  position('ELSE' in c) > position('NJACC_REQUEST_ID_REQUIRED' in c)
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J8  Prefix / Scope เดิมไม่เปลี่ยน',
       CASE WHEN c LIKE '%njacc_next_month_no(''ANJ_MONTH'', ''ANJ''%'
            AND  c LIKE '%njacc_next_month_no(''NJL_MONTH'', ''NJL''%' THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J9  UNIQUE (job_no) มีอยู่',
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
                          AND tablename='njacc_jobs' AND indexname='njacc_jobs_no_uq')
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J10 PRIMARY KEY (request_id) มีอยู่',
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint
                          WHERE conrelid='public.njacc_idempotency_requests'::regclass
                            AND contype='p' AND pg_get_constraintdef(oid)='PRIMARY KEY (request_id)')
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J11 สิทธิ์ : authenticated ได้ · anon ไม่ได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_save_job(jsonb)','EXECUTE')
            AND  NOT has_function_privilege('anon','public.njacc_save_job(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END FROM code
UNION ALL SELECT 'J12 Duplicate job_no ในตาราง (ต้อง 0)',
       (SELECT count(*)::text FROM (SELECT job_no FROM public.njacc_jobs
          GROUP BY job_no HAVING count(*)>1) t) FROM code;
