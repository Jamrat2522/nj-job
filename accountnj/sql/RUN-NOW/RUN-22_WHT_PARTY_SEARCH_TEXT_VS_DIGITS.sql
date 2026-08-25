-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-22_WHT_PARTY_SEARCH_TEXT_VS_DIGITS.sql
-- njacc_wht_party_search — แยกคำค้น "ข้อความ" ออกจาก "ตัวเลข"
--   (1) แก้บั๊ก: ค้นชื่อไทยแล้วคืนทุกแถว
--   (2) เพิ่ม: ค้นด้วย citizen_id
--
-- ต้องรัน RUN-20 ก่อน (นิยามเดิมของ function อยู่ที่นั่น)
--
-- ═══ ROOT CAUSE (ยืนยันบน Production จริงแล้ว) ═════════════════════════════
--   RUN-20 §2.4 เงื่อนไข v_q บรรทัด tax_id:
--       OR regexp_replace(coalesce(c2.tax_id,''),'[^0-9A-Za-z]','','g')
--          ILIKE '%'||regexp_replace(v_q,'[^0-9A-Za-z]','','g')||'%'
--   *** เอา v_q ที่ normalize แล้วไปใช้โดยไม่มี guard ***
--   คำค้นภาษาไทยไม่มี 0-9A-Za-z เลย -> normalize ได้ ''
--   -> ILIKE '%%' -> match ทุกแถวที่ active
--   พิสูจน์: SELECT regexp_replace('เซลล์','[^0-9A-Za-z]','','g')  => ''
--            '0115548012931' ILIKE '%%'                          => true
--   ผล: ค้น 'เซลล์' คืนทุกแถว -> Autocomplete ชื่อใช้งานไม่ได้
--
-- ═══ วิธีแก้ ═══════════════════════════════════════════════════════════════
--   แยกตัวแปรขาดจากกัน
--     v_q        = คำค้นจริง (btrim + nullif)  -> ใช้กับ customer_code / customer_name เท่านั้น
--     v_q_digits = regexp_replace(v_q,'\D','','g') -> ใช้กับ tax_id / citizen_id เท่านั้น
--   ทุก branch ตัวเลขมี guard 2 ชั้น
--     v_q_digits <> ''            (ฝั่งคำค้น)
--     <ตัวเลขของ column> <> ''    (ฝั่งข้อมูล)
--   -> ไม่มีทางประกอบเป็น ILIKE '%%' ได้เลย
--
-- ═══ ไม่เปลี่ยน ════════════════════════════════════════════════════════════
--   signature · RETURNS jsonb · response structure (id/code/name/branch/
--   tax_id/citizen_id/address/active) · เงื่อนไข v_code · active IS NOT FALSE ·
--   ORDER BY · LIMIT v_size · Permission (njacc_can + role) · SECURITY DEFINER ·
--   GRANT/REVOKE · พฤติกรรมเมื่อ q ว่าง (v_q IS NULL -> ไม่กรองด้วย q)
--   ไม่สร้าง RPC/Table/View ใหม่ · ไม่แตะ njacc_wht_party_upsert · ไม่แตะข้อมูล
--
--   หมายเหตุ normalize: RUN-20 ใช้ '[^0-9A-Za-z]' · ไฟล์นี้ใช้ '\D' (ตัวเลขล้วน)
--   ตรวจ Production ก่อนเปลี่ยนแล้ว: tax_with_letters = 0 · citizen_with_letters = 0
--   -> ไม่มีข้อมูลใดได้รับผลกระทบ
-- ═══════════════════════════════════════════════════════════════════════════

DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_wht_party_search') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_wht_party_search (ต้องรัน RUN-20 ก่อน)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers'
                    AND column_name='citizen_id') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.citizen_id (ต้องรัน RUN-20 ก่อน)'; END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- ตรวจผลกระทบของการเปลี่ยน normalize เป็น \D (ควรได้ 0 ทั้งสองคอลัมน์)
SELECT 'P1 ข้อมูลที่มีตัวอักษรปนใน tax_id / citizen_id' AS check_item,
       count(*) FILTER (WHERE tax_id ~ '[A-Za-z]')     AS tax_with_letters,
       count(*) FILTER (WHERE citizen_id ~ '[A-Za-z]') AS citizen_with_letters
  FROM public.njacc_customers;

CREATE OR REPLACE FUNCTION public.njacc_wht_party_search(p jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles;
        v_q text := nullif(btrim(coalesce(p->>'q','')), '');
        v_code text := nullif(btrim(coalesce(p->>'code','')), '');
        v_size int := least(greatest(coalesce((p->>'size')::int, 50), 1), 200);
        /* เฉพาะตัวเลขของคำค้น — ภาษาไทย/ตัวอักษรล้วน จะได้ '' แล้วถูก guard ตัดทิ้ง */
        v_q_digits text := regexp_replace(coalesce(nullif(btrim(coalesce(p->>'q','')), ''),''), '\D', '', 'g');
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can('*','*','view') AND pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;

  RETURN jsonb_build_object('rows', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
             'id', c.id, 'code', c.customer_code, 'name', c.customer_name,
             'branch', c.branch_code, 'tax_id', c.tax_id,
             'citizen_id', c.citizen_id, 'address', c.address,
             'active', c.active) ORDER BY c.customer_code NULLS LAST, c.customer_name)
      FROM (SELECT * FROM public.njacc_customers c2
             WHERE c2.active IS NOT FALSE
               /* code = ค้นแบบตรงตัว (ไม่สนตัวพิมพ์) ใช้ตอนพิมพ์ CODE แล้วกด Enter */
               AND (v_code IS NULL
                    OR lower(btrim(c2.customer_code)) = lower(v_code))
               AND (v_q IS NULL
                    /* ── ข้อความ: ใช้คำค้นจริง (รองรับภาษาไทย) ── */
                    OR c2.customer_code ILIKE '%'||v_q||'%'
                    OR c2.customer_name ILIKE '%'||v_q||'%'
                    /* ── ตัวเลข: ใช้ v_q_digits และค้นเฉพาะเมื่อไม่ว่าง ── */
                    OR (v_q_digits <> ''
                        AND regexp_replace(coalesce(c2.tax_id,''), '\D', '', 'g') <> ''
                        AND regexp_replace(coalesce(c2.tax_id,''), '\D', '', 'g')
                            ILIKE '%'||v_q_digits||'%')
                    OR (v_q_digits <> ''
                        AND regexp_replace(coalesce(c2.citizen_id,''), '\D', '', 'g') <> ''
                        AND regexp_replace(coalesce(c2.citizen_id,''), '\D', '', 'g')
                            ILIKE '%'||v_q_digits||'%'))
             ORDER BY c2.customer_code NULLS LAST, c2.customer_name
             LIMIT v_size) c), '[]'::jsonb));
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_wht_party_search(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_wht_party_search(jsonb) FROM PUBLIC, anon;


-- ───────────────────────────────────────────────────────────────────────────
-- VERIFY (READ ONLY)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'V1 แยกตัวแปรแล้ว' AS check_item,
       (d LIKE '%v_q_digits%')                          AS มีตัวแปรตัวเลข,
       (d LIKE '%v_q_digits <> %')                      AS มี_guard,
       (d LIKE '%customer_name ILIKE ''%''||v_q||''%''%') AS ชื่อใช้คำค้นจริง
  FROM (SELECT pg_get_functiondef(p.oid) AS d
          FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.proname='njacc_wht_party_search') x;

-- V2 · ทุกบรรทัดที่มี ILIKE ต้องไม่มีบรรทัดใดใช้ v_q_digits ร่วมกับ customer_name/code
SELECT 'V2 บรรทัดเงื่อนไข' AS check_item, ln, line
FROM (SELECT row_number() OVER () AS ln, line
        FROM (SELECT unnest(string_to_array(pg_get_functiondef(p.oid), E'\n')) AS line
                FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
               WHERE n.nspname='public' AND p.proname='njacc_wht_party_search') s) t
WHERE line ILIKE '%ILIKE%' OR line ILIKE '%v_q_digits%'
ORDER BY ln;
