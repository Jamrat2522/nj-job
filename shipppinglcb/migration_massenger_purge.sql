-- ============================================================================
-- MASSENGER — ล้างข้อมูลตามวันที่ (Purge by cutoff date)
-- ----------------------------------------------------------------------------
-- ADDITIVE ล้วน: สร้างตารางใหม่ 2 ตัว + function ใหม่ 2 ตัว
-- ไม่แตะ schema / RLS / trigger / function เดิม / ข้อมูลเดิม
--
-- ⚠️ ก่อนใช้จริงต้องรัน SECTION ตรวจสอบท้ายไฟล์ เพื่อยืนยันว่าไม่มีตารางลูก
--    อื่นที่อ้างถึง jobs / documents นอกเหนือจาก 5 ตารางที่ครอบคลุมไว้
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1) ตาราง Tombstone — กันเอกสารที่ถูกลบถูกสร้างกลับมาอัตโนมัติ
--    (_autoCreateDocumentJob จะสร้างเอกสารใหม่ทันทีถ้าไม่พบ source_job_id เดิม)
--    ใช้ text เพื่อรองรับทั้ง uuid และ bigint โดยไม่ต้องเดาชนิด id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purge_tombstones (
  id            bigserial PRIMARY KEY,
  app_code      text        NOT NULL,
  source_job_id text        NOT NULL,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS purge_tombstones_uq
  ON public.purge_tombstones (app_code, source_job_id);


-- ---------------------------------------------------------------------------
-- 2) ตาราง Audit Log ของการล้างข้อมูล
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purge_audit_log (
  id                     bigserial PRIMARY KEY,
  app_code               text        NOT NULL,
  cutoff_date            date        NOT NULL,
  include_jobs           boolean     NOT NULL,
  include_documents      boolean     NOT NULL,
  jobs_deleted           integer     NOT NULL DEFAULT 0,
  documents_deleted      integer     NOT NULL DEFAULT 0,
  job_logs_deleted       integer     NOT NULL DEFAULT 0,
  document_logs_deleted  integer     NOT NULL DEFAULT 0,
  attachments_deleted    integer     NOT NULL DEFAULT 0,
  signatures_deleted     integer     NOT NULL DEFAULT 0,
  storage_manifest       jsonb,
  performed_by           text,
  performed_by_name      text,
  created_at             timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- 3) PREVIEW — นับอย่างเดียว ไม่ลบอะไรทั้งสิ้น
--    app_code ถูกกำหนดตายตัวใน server ไม่รับจาก client
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.massenger_purge_preview(
  p_cutoff_date       date,
  p_include_jobs      boolean,
  p_include_documents boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app   constant text := 'massenger';
  v_cut   timestamptz;
  v_today date;
  v_res   jsonb;
BEGIN
  IF p_cutoff_date IS NULL THEN
    RAISE EXCEPTION 'cutoff_date is required';
  END IF;
  IF COALESCE(p_include_jobs,false) = false AND COALESCE(p_include_documents,false) = false THEN
    RAISE EXCEPTION 'must select at least one of jobs/documents';
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  IF p_cutoff_date >= v_today THEN
    RAISE EXCEPTION 'cutoff_date must be before today (Asia/Bangkok)';
  END IF;

  -- จบวันที่เลือก รวมทั้งวัน ตามเวลาไทย
  v_cut := ((p_cutoff_date + 1)::timestamp) AT TIME ZONE 'Asia/Bangkok';

  CREATE TEMP TABLE _pv_jobs ON COMMIT DROP AS
    SELECT j.id FROM public.jobs j
     WHERE j.app_code = v_app
       AND COALESCE(p_include_jobs,false)
       AND j.created_at < v_cut;

  CREATE TEMP TABLE _pv_docs ON COMMIT DROP AS
    SELECT DISTINCT d.id, d.created_at, d.source_job_id
      FROM public.documents d
     WHERE d.app_code = v_app
       AND (
             (COALESCE(p_include_documents,false) AND d.created_at < v_cut)
          OR (COALESCE(p_include_jobs,false)
              AND d.source_job_id IS NOT NULL
              AND d.source_job_id IN (SELECT id FROM _pv_jobs))
           );

  SELECT jsonb_build_object(
    'app_code',        v_app,
    'cutoff_date',     p_cutoff_date,
    'cutoff_utc',      v_cut,
    'include_jobs',    COALESCE(p_include_jobs,false),
    'include_documents', COALESCE(p_include_documents,false),
    'jobs',            (SELECT count(*) FROM _pv_jobs),
    'documents',       (SELECT count(*) FROM _pv_docs),
    'documents_linked_after_cutoff',
                       (SELECT count(*) FROM _pv_docs WHERE created_at >= v_cut),
    'job_logs',        (SELECT count(*) FROM public.job_logs      l WHERE l.app_code=v_app AND l.job_id      IN (SELECT id FROM _pv_jobs)),
    'document_logs',   (SELECT count(*) FROM public.document_logs g WHERE g.app_code=v_app AND g.document_id IN (SELECT id FROM _pv_docs)),
    'attachments',     (SELECT count(*) FROM public.attachments   a WHERE a.app_code=v_app AND a.job_id      IN (SELECT id FROM _pv_jobs)),
    'signatures',      (SELECT count(*) FROM public.signatures    s WHERE s.app_code=v_app AND s.job_id      IN (SELECT id FROM _pv_jobs)),
    'storage_bytes',   COALESCE((
        SELECT sum((o.metadata->>'size')::bigint)
          FROM storage.objects o
         WHERE (o.bucket_id='job-attachments' AND o.name IN (
                  SELECT a.storage_path FROM public.attachments a
                   WHERE a.app_code=v_app AND a.storage_path IS NOT NULL
                     AND a.job_id IN (SELECT id FROM _pv_jobs)))
            OR (o.bucket_id='job-signatures'  AND o.name IN (
                  SELECT s.storage_path FROM public.signatures s
                   WHERE s.app_code=v_app AND s.storage_path IS NOT NULL
                     AND s.job_id IN (SELECT id FROM _pv_jobs)))
      ),0),
    'kept_jobs_after_cutoff',      (SELECT count(*) FROM public.jobs      WHERE app_code=v_app AND created_at >= v_cut),
    'kept_documents_after_cutoff', (SELECT count(*) FROM public.documents WHERE app_code=v_app AND created_at >= v_cut)
  ) INTO v_res;

  RETURN v_res;
END;
$$;


-- ---------------------------------------------------------------------------
-- 4) EXECUTE — ลบจริง (ทั้งฟังก์ชันอยู่ใน transaction เดียว · error = rollback ทั้งหมด)
--    ลบตารางลูกก่อนตารางหลักเสมอ · ไม่ใช้ TRUNCATE · ไม่ใช้ CASCADE
--    คืน storage path กลับไปให้ client ลบไฟล์จริงผ่าน Storage API
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.massenger_purge_execute(
  p_cutoff_date       date,
  p_include_jobs      boolean,
  p_include_documents boolean,
  p_actor_id          text DEFAULT NULL,
  p_actor_name        text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app  constant text := 'massenger';
  v_cut  timestamptz;
  v_today date;
  v_att_paths text[] := '{}';
  v_sig_paths text[] := '{}';
  n_jobs int := 0; n_docs int := 0; n_jl int := 0; n_dl int := 0; n_att int := 0; n_sig int := 0;
  v_res jsonb;
BEGIN
  IF p_cutoff_date IS NULL THEN
    RAISE EXCEPTION 'cutoff_date is required';
  END IF;
  IF COALESCE(p_include_jobs,false) = false AND COALESCE(p_include_documents,false) = false THEN
    RAISE EXCEPTION 'must select at least one of jobs/documents';
  END IF;

  v_today := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  IF p_cutoff_date >= v_today THEN
    RAISE EXCEPTION 'cutoff_date must be before today (Asia/Bangkok)';
  END IF;

  v_cut := ((p_cutoff_date + 1)::timestamp) AT TIME ZONE 'Asia/Bangkok';

  -- ---- snapshot เป้าหมาย ----
  CREATE TEMP TABLE _px_jobs ON COMMIT DROP AS
    SELECT j.id FROM public.jobs j
     WHERE j.app_code = v_app
       AND COALESCE(p_include_jobs,false)
       AND j.created_at < v_cut;

  CREATE TEMP TABLE _px_docs ON COMMIT DROP AS
    SELECT DISTINCT d.id, d.source_job_id
      FROM public.documents d
     WHERE d.app_code = v_app
       AND (
             (COALESCE(p_include_documents,false) AND d.created_at < v_cut)
          OR (COALESCE(p_include_jobs,false)
              AND d.source_job_id IS NOT NULL
              AND d.source_job_id IN (SELECT id FROM _px_jobs))
           );

  -- ---- เก็บ storage path ก่อนลบแถว ----
  SELECT COALESCE(array_agg(a.storage_path),'{}') INTO v_att_paths
    FROM public.attachments a
   WHERE a.app_code=v_app AND a.storage_path IS NOT NULL
     AND a.job_id IN (SELECT id FROM _px_jobs);

  SELECT COALESCE(array_agg(s.storage_path),'{}') INTO v_sig_paths
    FROM public.signatures s
   WHERE s.app_code=v_app AND s.storage_path IS NOT NULL
     AND s.job_id IN (SELECT id FROM _px_jobs);

  -- ---- Tombstone: เอกสารที่ถูกลบแต่ "งานต้นทางยังอยู่" ----
  INSERT INTO public.purge_tombstones (app_code, source_job_id, reason)
  SELECT v_app, d.source_job_id::text, 'purge_' || p_cutoff_date::text
    FROM _px_docs d
   WHERE d.source_job_id IS NOT NULL
     AND d.source_job_id NOT IN (SELECT id FROM _px_jobs)
  ON CONFLICT (app_code, source_job_id) DO NOTHING;

  -- ---- ลบลูกของเอกสารก่อน ----
  DELETE FROM public.document_logs g
   WHERE g.app_code=v_app AND g.document_id IN (SELECT id FROM _px_docs);
  GET DIAGNOSTICS n_dl = ROW_COUNT;

  DELETE FROM public.documents d
   WHERE d.app_code=v_app AND d.id IN (SELECT id FROM _px_docs);
  GET DIAGNOSTICS n_docs = ROW_COUNT;

  -- ---- ลบลูกของงาน ----
  DELETE FROM public.attachments a
   WHERE a.app_code=v_app AND a.job_id IN (SELECT id FROM _px_jobs);
  GET DIAGNOSTICS n_att = ROW_COUNT;

  DELETE FROM public.signatures s
   WHERE s.app_code=v_app AND s.job_id IN (SELECT id FROM _px_jobs);
  GET DIAGNOSTICS n_sig = ROW_COUNT;

  DELETE FROM public.job_logs l
   WHERE l.app_code=v_app AND l.job_id IN (SELECT id FROM _px_jobs);
  GET DIAGNOSTICS n_jl = ROW_COUNT;

  DELETE FROM public.jobs j
   WHERE j.app_code=v_app AND j.id IN (SELECT id FROM _px_jobs);
  GET DIAGNOSTICS n_jobs = ROW_COUNT;

  v_res := jsonb_build_object(
    'ok', true,
    'cutoff_date', p_cutoff_date,
    'include_jobs', COALESCE(p_include_jobs,false),
    'include_documents', COALESCE(p_include_documents,false),
    'jobs_deleted', n_jobs,
    'documents_deleted', n_docs,
    'job_logs_deleted', n_jl,
    'document_logs_deleted', n_dl,
    'attachments_deleted', n_att,
    'signatures_deleted', n_sig,
    'storage_attachments', to_jsonb(v_att_paths),
    'storage_signatures',  to_jsonb(v_sig_paths)
  );

  INSERT INTO public.purge_audit_log(
    app_code, cutoff_date, include_jobs, include_documents,
    jobs_deleted, documents_deleted, job_logs_deleted, document_logs_deleted,
    attachments_deleted, signatures_deleted, storage_manifest,
    performed_by, performed_by_name)
  VALUES (v_app, p_cutoff_date, COALESCE(p_include_jobs,false), COALESCE(p_include_documents,false),
    n_jobs, n_docs, n_jl, n_dl, n_att, n_sig,
    jsonb_build_object('job-attachments', to_jsonb(v_att_paths), 'job-signatures', to_jsonb(v_sig_paths)),
    p_actor_id, p_actor_name);

  RETURN v_res;
END;
$$;


GRANT EXECUTE ON FUNCTION public.massenger_purge_preview(date, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.massenger_purge_execute(date, boolean, boolean, text, text) TO anon, authenticated;


-- ============================================================================
-- ตรวจสอบก่อนใช้จริง — ต้องรันและอ่านผล
-- ============================================================================

-- (ก) ตารางลูกทั้งหมดที่อ้างถึง jobs / documents
--     ถ้ามีตารางนอกเหนือจาก documents / job_logs / document_logs / attachments / signatures
--     ต้องหยุดและแจ้ง เพราะฟังก์ชันด้านบนยังไม่ครอบคลุม
SELECT src.relname AS child_table,
       (SELECT string_agg(att.attname, ',' ORDER BY att.attnum)
          FROM unnest(con.conkey) k
          JOIN pg_attribute att ON att.attrelid = src.oid AND att.attnum = k) AS child_columns,
       tgt.relname AS parent_table
FROM pg_constraint con
JOIN pg_class src ON src.oid = con.conrelid
JOIN pg_class tgt ON tgt.oid = con.confrelid
WHERE con.contype='f' AND tgt.relname IN ('jobs','documents')
ORDER BY 3,1;

-- (ข) ทดสอบ Preview (ไม่ลบอะไร)
-- SELECT public.massenger_purge_preview('2026-07-20', true, true);

-- (ค) ทดสอบ Execute แบบ ROLLBACK — ห้ามข้ามขั้นนี้
-- BEGIN;
--   SELECT public.massenger_purge_execute('2026-07-20', true, true, 'test', 'test');
--   SELECT count(*) AS jobs_left FROM public.jobs WHERE app_code='massenger';
-- ROLLBACK;

-- (ง) ตรวจข้อมูลลูกค้างหลังลบจริง — ต้องได้ 0 ทุกบรรทัด
-- SELECT 'orphan job_logs'      t, count(*) c FROM public.job_logs      l WHERE l.app_code='massenger' AND NOT EXISTS (SELECT 1 FROM public.jobs      j WHERE j.id=l.job_id)
-- UNION ALL SELECT 'orphan attachments',  count(*) FROM public.attachments   a WHERE a.app_code='massenger' AND NOT EXISTS (SELECT 1 FROM public.jobs      j WHERE j.id=a.job_id)
-- UNION ALL SELECT 'orphan signatures',   count(*) FROM public.signatures    s WHERE s.app_code='massenger' AND NOT EXISTS (SELECT 1 FROM public.jobs      j WHERE j.id=s.job_id)
-- UNION ALL SELECT 'orphan document_logs',count(*) FROM public.document_logs g WHERE g.app_code='massenger' AND NOT EXISTS (SELECT 1 FROM public.documents d WHERE d.id=g.document_id)
-- UNION ALL SELECT 'orphan documents',    count(*) FROM public.documents     d WHERE d.app_code='massenger' AND d.source_job_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id=d.source_job_id);
