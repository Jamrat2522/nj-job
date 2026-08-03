-- ============================================================
-- MASSENGER V3 · Phase 1.1
-- รวม 5 count query ของ loadStatusCounts() ให้เหลือ RPC เดียว
-- ------------------------------------------------------------
-- ⚠️ ADDITIVE เท่านั้น — ไม่แตะตาราง / RLS / policy / ข้อมูลเดิม
-- ⚠️ ถ้าไม่รัน migration นี้ ระบบจะ fallback ไปใช้ 5 query แบบเดิมอัตโนมัติ
--    (app.js ตรวจ error แล้วตั้ง _scRpcOK=false ถาวรใน session นั้น)
-- ============================================================

-- เงื่อนไขทุกข้อคัดลอกมาจาก loadStatusCounts() + _msgCountTerminalFilter() ใน js/app.js
--   category <> exclude_category   ← ตรงกับ PostgREST .neq() (แถว category IS NULL ถูกตัดออกเช่นกัน)
--   messenger_mode + terminals_param IS NOT NULL  → import_terminal IN (terminals)
--   messenger_mode + terminals_param IS NULL      → import_terminal IS NULL
--                                                   OR (import_terminal <> 'BKK' AND import_terminal <> 'LKB')

CREATE OR REPLACE FUNCTION public.massenger_status_counts(
  app_code_param    text,
  exclude_category  text,
  today_from        timestamptz,
  today_to          timestamptz,
  messenger_mode    boolean DEFAULT false,
  terminals_param   text[]  DEFAULT NULL
)
RETURNS TABLE (
  wait_count        bigint,
  going_count       bigint,
  done_count        bigint,
  canceled_count    bigint,
  done_today_count  bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    count(*) FILTER (WHERE j.status = 'WAIT')     AS wait_count,
    count(*) FILTER (WHERE j.status = 'GOING')    AS going_count,
    count(*) FILTER (WHERE j.status = 'DONE')     AS done_count,
    count(*) FILTER (WHERE j.status = 'CANCELED') AS canceled_count,
    count(*) FILTER (
      WHERE j.status = 'DONE'
        AND j.closed_at >= today_from
        AND j.closed_at <= today_to
    ) AS done_today_count
  FROM public.jobs j
  WHERE j.app_code = app_code_param
    AND j.category <> exclude_category
    AND (
      NOT messenger_mode
      OR (
        CASE
          WHEN terminals_param IS NOT NULL
            THEN j.import_terminal = ANY (terminals_param)
          ELSE
            j.import_terminal IS NULL
            OR (j.import_terminal <> 'BKK' AND j.import_terminal <> 'LKB')
        END
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.massenger_status_counts(
  text, text, timestamptz, timestamptz, boolean, text[]
) TO anon, authenticated;

-- ============================================================
-- ตรวจความถูกต้องก่อนใช้จริง (รันเทียบผลกับของเดิม)
-- ============================================================
-- SELECT * FROM public.massenger_status_counts(
--   'massenger', 'ต่อเร้น',
--   date_trunc('day', now()), date_trunc('day', now()) + interval '1 day' - interval '1 millisecond',
--   false, NULL
-- );
--
-- เทียบกับ:
-- SELECT status, count(*) FROM public.jobs
--  WHERE app_code='massenger' AND category <> 'ต่อเร้น'
--  GROUP BY status;
--
-- ============================================================
-- Query Plan — รันก่อนตัดสินใจสร้าง index (ห้ามสร้าง index โดยไม่ดู plan)
-- ============================================================
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM public.massenger_status_counts(
--   'massenger','ต่อเร้น', now()::date, now(), false, NULL);
--
-- ถ้าเห็น Seq Scan บนตาราง jobs ที่มีแถวจำนวนมาก ค่อยพิจารณา:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_appcode_status
--     ON public.jobs (app_code, status);
-- (ยังไม่ต้องสร้างตอนนี้ — รอผล EXPLAIN จริงก่อน)
