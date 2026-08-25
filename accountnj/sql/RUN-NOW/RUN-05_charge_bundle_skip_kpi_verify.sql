-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-05_charge_bundle_skip_kpi_verify.sql
-- อ่านอย่างเดียว 100% — รันหลัง RUN-04 · ต้องได้ PASS ทุกบรรทัด
-- ═══════════════════════════════════════════════════════════════════════════
WITH d AS (
  SELECT pg_get_functiondef(p.oid) AS c
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='njacc_charge_page_bundle'
)
SELECT 'V1 bundle รองรับ with_kpi และ default = true' AS check_item,
       CASE WHEN (SELECT c LIKE '%coalesce((p->>''with_kpi'')::boolean, true)%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 rows / total / filter_options ไม่ถูกแตะ (ยังคืนครบ)',
       CASE WHEN (SELECT c LIKE '%''total'',v_total%' AND c LIKE '%''rows'',v_rows%'
                       AND c LIKE '%''filter_options'',v_opts%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 คีย์ kpi ยังอยู่ใน response (contract ไม่พัง)',
       CASE WHEN (SELECT c LIKE '%''kpi'',v_kpi%' FROM d) THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 ยังใช้ working set เดิม njacc_build_charge_set',
       CASE WHEN (SELECT c LIKE '%njacc_build_charge_set(p)%' FROM d) THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 ด่านสิทธิ์เดิมยังอยู่ (njacc_can view)',
       CASE WHEN (SELECT c LIKE '%njacc_can(v_charge,v_group,''view'')%' FROM d)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 SECURITY DEFINER + search_path',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_charge_page_bundle')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 authenticated ยังเรียกได้ · anon เรียกไม่ได้',
       CASE WHEN has_function_privilege('authenticated','public.njacc_charge_page_bundle(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_charge_page_bundle(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 njacc_charge_kpi เดิมยังอยู่ (ไม่ได้ลบของหน้าอื่น)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                          WHERE n.nspname='public' AND p.proname='njacc_charge_kpi')
            THEN 'PASS' ELSE 'FAIL' END;

-- ── ทดสอบพฤติกรรมจริง (ต้องรันด้วย session ที่มีสิทธิ์ view) ───────────────
-- with_kpi = false  -> kpi ต้องเป็น null
-- ไม่ส่ง with_kpi   -> kpi ต้องเป็น object (ค่าเดิม)
-- SELECT (public.njacc_charge_page_bundle(
--   '{"charge_type":"SERVICE","company_group":"NJ","queue":"pending_invoice",
--     "page":1,"size":20,"with_kpi":false}'::jsonb) -> 'kpi') IS NULL AS kpi_skipped;
-- SELECT jsonb_typeof(public.njacc_charge_page_bundle(
--   '{"charge_type":"SERVICE","company_group":"NJ","queue":"pending_invoice",
--     "page":1,"size":20}'::jsonb) -> 'kpi') AS kpi_type_default;   -- ต้องได้ 'object'
