-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-21_WHT_PARTY_DUPLICATE_GUARD.sql
-- ป้องกันข้อมูลซ้ำใน CODE Master ของ REPORT > ใบหัก ณ ที่จ่าย
-- (Master = public.njacc_customers ตัวเดียวกับที่ RUN-20 ใช้)
--
-- ต้องรัน RUN-20_WHT_PARTY_CODE_MASTER.sql ก่อน (ต้องมีคอลัมน์ citizen_id)
--
-- ═══ กติกาที่บังคับ ════════════════════════════════════════════════════════
--   ห้ามซ้ำ   : CODE (case-insensitive) · Tax ID + สาขา · Citizen ID
--   ซ้ำได้    : สาขาอย่างเดียว · ที่อยู่อย่างเดียว · ชื่ออย่างเดียว
--   ค่าว่าง   : *** ไม่นับเป็นซ้ำ *** (partial index ข้ามค่าว่าง/NULL ทั้งหมด)
--
-- ═══ ทำอะไร ════════════════════════════════════════════════════════════════
--   1) รายงาน Index/Constraint ที่มีอยู่จริงบน njacc_customers  (READ ONLY)
--   2) รายงานข้อมูลซ้ำที่ค้างอยู่เดิม                            (READ ONLY)
--   3) สร้าง UNIQUE INDEX 2 ตัว *** แบบมีเงื่อนไข ***
--        njacc_cust_taxbranch_uq  (tax_id + สาขา)
--        njacc_cust_citizen_uq    (citizen_id)
--      ถ้าพบข้อมูลซ้ำค้างอยู่ -> *** ข้ามการสร้าง Index และ RAISE NOTICE ***
--      Migration จะไม่ FAIL กลางทาง (ข้อกำหนดข้อ 13)
--   4) เพิ่มการตรวจซ้ำใน njacc_wht_party_upsert (ยกนิยาม RUN-20 มาทั้งดุ้น)
--
-- ═══ ไม่ทำ ═════════════════════════════════════════════════════════════════
--   ไม่ DROP · ไม่ DELETE · ไม่ TRUNCATE · ไม่ MERGE · ไม่ UPDATE ข้อมูลเดิม
--   *** ไม่ลบและไม่แก้ Index เดิมแม้แต่ตัวเดียว *** (ดู SECTION 4 ถ้าจำเป็น)
--   ไม่แตะ njacc_wht_party_search · njacc_save_wht_draft · njacc_upsert_customer
--   ไม่แตะเอกสาร WHT / Snapshot / การคำนวณภาษี / สิทธิ์ผู้ใช้
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 · PREFLIGHT (READ ONLY — อ่านผลให้ครบก่อนรัน SECTION 2)
-- ───────────────────────────────────────────────────────────────────────────
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='njacc_customers'
                    AND column_name='citizen_id') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_customers.citizen_id (ต้องรัน RUN-20 ก่อน)';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $preflight$;

-- P1 · Index/Constraint ที่มีอยู่จริงบน Master  *** อ่านผลข้อนี้ก่อนเสมอ ***
--      สนใจเป็นพิเศษ: njacc_cust_tax_uq (ถ้ามี = Tax ID ห้ามซ้ำเดี่ยว ๆ
--      ซึ่งจะทำให้บริษัทเดียวกันมีหลายสาขาไม่ได้ -> ดู SECTION 4)
SELECT 'P1 index บน njacc_customers' AS check_item,
       indexname, indexdef
  FROM pg_indexes
 WHERE schemaname='public' AND tablename='njacc_customers'
 ORDER BY indexname;

-- P2 · Tax ID + สาขา ซ้ำที่ค้างอยู่เดิม (ควรได้ 0 แถว)
SELECT 'P2 ซ้ำ tax_id + สาขา' AS check_item,
       regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g') AS tax_key,
       coalesce(nullif(btrim(branch_code),''),'') AS branch_key,
       count(*) AS n,
       string_agg(coalesce(customer_code,'(ไม่มี CODE)')||' · '||customer_name, ' | ') AS รายการ
  FROM public.njacc_customers
 WHERE regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g') <> ''
 GROUP BY 1,2,3 HAVING count(*) > 1;

-- P3 · Citizen ID ซ้ำที่ค้างอยู่เดิม (ควรได้ 0 แถว)
SELECT 'P3 ซ้ำ citizen_id' AS check_item,
       regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g') AS citizen_key,
       count(*) AS n,
       string_agg(coalesce(customer_code,'(ไม่มี CODE)')||' · '||customer_name, ' | ') AS รายการ
  FROM public.njacc_customers
 WHERE regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g') <> ''
 GROUP BY 1,2 HAVING count(*) > 1;

-- P4 · จำนวนแถวก่อนรัน (ใช้เทียบหลังรัน — ต้องเท่าเดิมเป๊ะ)
SELECT 'BEFORE' AS phase, count(*) AS customers_total FROM public.njacc_customers;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 · MIGRATION
-- ───────────────────────────────────────────────────────────────────────────
BEGIN;

-- 2.1 · UNIQUE: Tax ID + สาขา
--   *** ไม่ใช่ Tax ID เดี่ยว ๆ *** -> บริษัทเดียวกันมีหลายสาขาได้ (ข้อกำหนดข้อ 4)
--   สาขา NULL และ '' ถือเป็นค่าเดียวกัน (สำนักงานใหญ่ที่ไม่ได้กรอก)
--   partial WHERE -> tax_id ว่าง/NULL ไม่ถูกนับเป็นซ้ำ (ข้อกำหนดข้อ 6)
DO $mk_taxbranch$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.njacc_customers
     WHERE regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g') <> ''
     GROUP BY regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g'),
              coalesce(nullif(btrim(branch_code),''),'')
    HAVING count(*) > 1
  ) THEN
    RAISE NOTICE '⚠️  ข้าม njacc_cust_taxbranch_uq — มีข้อมูล tax_id+สาขา ซ้ำค้างอยู่ (ดูผล P2)';
    RAISE NOTICE '    แก้ข้อมูลเดิมให้ไม่ซ้ำก่อน แล้วรันไฟล์นี้ซ้ำได้ (ห้ามลบแถว — ถูกอ้างจาก njacc_jobs/njacc_invoices)';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS njacc_cust_taxbranch_uq
      ON public.njacc_customers (
           regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g'),
           coalesce(nullif(btrim(branch_code),''),''))
      WHERE regexp_replace(coalesce(tax_id,''),'[^0-9A-Za-z]','','g') <> '';
    RAISE NOTICE '✅ njacc_cust_taxbranch_uq พร้อมใช้งาน';
  END IF;
END $mk_taxbranch$;

-- 2.2 · UNIQUE: Citizen ID (บุคคลธรรมดา — ไม่รวมสาขา ตามข้อกำหนดข้อ 5)
DO $mk_citizen$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.njacc_customers
     WHERE regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g') <> ''
     GROUP BY regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g')
    HAVING count(*) > 1
  ) THEN
    RAISE NOTICE '⚠️  ข้าม njacc_cust_citizen_uq — มีข้อมูล citizen_id ซ้ำค้างอยู่ (ดูผล P3)';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS njacc_cust_citizen_uq
      ON public.njacc_customers (
           regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g'))
      WHERE regexp_replace(coalesce(citizen_id,''),'[^0-9A-Za-z]','','g') <> '';
    RAISE NOTICE '✅ njacc_cust_citizen_uq พร้อมใช้งาน';
  END IF;
END $mk_citizen$;

-- 2.3 · njacc_wht_party_upsert — ยกนิยาม RUN-20 มาทั้งดุ้น เพิ่มเฉพาะการตรวจซ้ำ
--   ส่วนที่ *** เหมือน RUN-20 เป๊ะ ***: สิทธิ์ · required · INSERT/UPDATE · audit · RETURN
--   ส่วนที่เพิ่ม: ตรวจ Tax ID+สาขา / Citizen ID + แปลง unique_violation เป็นรหัส error
--   รูปแบบ error: 'NJACC_PARTY_<X>_DUPLICATE|<CODE เดิม>|<ชื่อเดิม>'
--     -> Frontend แยกด้วย '|' เพื่อบอกผู้ใช้ว่าซ้ำกับรายการไหน (ข้อกำหนดข้อ 10)
--   ทุก query ตรวจซ้ำมี  (v_id IS NULL OR id <> v_id)  = ไม่นับตัวเอง (ข้อกำหนดข้อ 9)
CREATE OR REPLACE FUNCTION public.njacc_wht_party_upsert(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE pr public.njacc_profiles; v_id uuid;
        v_code text := nullif(btrim(coalesce(p->>'code','')), '');
        v_name text := nullif(btrim(coalesce(p->>'name','')), '');
        v_branch text := nullif(btrim(coalesce(p->>'branch','')), '');
        v_tax  text := nullif(btrim(coalesce(p->>'tax_id','')), '');
        v_cid  text := nullif(btrim(coalesce(p->>'citizen_id','')), '');
        /* คีย์ที่ Normalize แล้ว — ตรงกับนิยามของ UNIQUE INDEX ข้อ 2.1/2.2 เป๊ะ */
        v_taxk text := regexp_replace(coalesce(v_tax,''),'[^0-9A-Za-z]','','g');
        v_cidk text := regexp_replace(coalesce(v_cid,''),'[^0-9A-Za-z]','','g');
        v_brk  text := coalesce(v_branch,'');
        v_hit  record;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF v_code IS NULL THEN RAISE EXCEPTION 'NJACC_PARTY_CODE_REQUIRED'; END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'NJACC_PARTY_NAME_REQUIRED'; END IF;

  v_id := nullif(p->>'id','')::uuid;

  /* ── (1) CODE ห้ามซ้ำ — ตรรกะเดิมของ RUN-20 คงไว้ เพิ่มแค่ข้อมูลรายการที่ชน ── */
  SELECT c.customer_code AS code, c.customer_name AS name INTO v_hit
    FROM public.njacc_customers c
   WHERE lower(btrim(c.customer_code)) = lower(v_code)
     AND (v_id IS NULL OR c.id <> v_id)
   LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'NJACC_PARTY_CODE_DUPLICATE|%|%',
      coalesce(v_hit.code,''), coalesce(v_hit.name,'');
  END IF;

  /* ── (2) Tax ID + สาขา ห้ามซ้ำ — ข้ามเมื่อ Tax ID ว่าง (ข้อกำหนดข้อ 6) ──
     *** สาขาอย่างเดียวซ้ำได้ *** เพราะต้องมี Tax ID เดียวกันด้วยจึงจะนับว่าซ้ำ */
  IF v_taxk <> '' THEN
    SELECT c.customer_code AS code, c.customer_name AS name INTO v_hit
      FROM public.njacc_customers c
     WHERE regexp_replace(coalesce(c.tax_id,''),'[^0-9A-Za-z]','','g') = v_taxk
       AND coalesce(nullif(btrim(c.branch_code),''),'') = v_brk
       AND (v_id IS NULL OR c.id <> v_id)
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'NJACC_PARTY_TAXBRANCH_DUPLICATE|%|%',
        coalesce(v_hit.code,''), coalesce(v_hit.name,'');
    END IF;
  END IF;

  /* ── (3) Citizen ID ห้ามซ้ำ — ข้ามเมื่อว่าง · ไม่รวมสาขา (ข้อกำหนดข้อ 5) ── */
  IF v_cidk <> '' THEN
    SELECT c.customer_code AS code, c.customer_name AS name INTO v_hit
      FROM public.njacc_customers c
     WHERE regexp_replace(coalesce(c.citizen_id,''),'[^0-9A-Za-z]','','g') = v_cidk
       AND (v_id IS NULL OR c.id <> v_id)
     LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'NJACC_PARTY_CITIZEN_DUPLICATE|%|%',
        coalesce(v_hit.code,''), coalesce(v_hit.name,'');
    END IF;
  END IF;

  /* ── เขียนจริง — ห่อ unique_violation ไว้กันกรณี 2 คนกดพร้อมกัน ──
     ช่วงเวลาระหว่าง SELECT ตรวจซ้ำ กับ INSERT ยังมีโอกาสชนกันได้
     UNIQUE INDEX คือด่านสุดท้าย -> แปลงเป็นรหัสเดียวกับด้านบนให้ Frontend อ่านออก */
  BEGIN
    IF v_id IS NULL THEN
      INSERT INTO public.njacc_customers(customer_code, customer_name, branch_code,
                                         tax_id, citizen_id, address)
      VALUES (v_code, v_name, v_branch, v_tax, v_cid,
              nullif(btrim(coalesce(p->>'address','')),''))
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.njacc_customers
         SET customer_code = v_code,
             customer_name = v_name,
             branch_code   = v_branch,
             tax_id        = v_tax,
             citizen_id    = v_cid,
             address       = nullif(btrim(coalesce(p->>'address','')),''),
             updated_at    = now()
       WHERE id = v_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'NJACC_PARTY_NOT_FOUND'; END IF;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'NJACC_PARTY_DUPLICATE_RACE|%|%',
      coalesce(SQLERRM,''), '';
  END;

  PERFORM public.njacc_audit(pr.id,'UPSERT_WHT_PARTY','customer',v_id::text,
    jsonb_build_object('code',v_code,'name',v_name));

  RETURN (SELECT jsonb_build_object('id',c.id,'code',c.customer_code,'name',c.customer_name,
            'branch',c.branch_code,'tax_id',c.tax_id,'citizen_id',c.citizen_id,
            'address',c.address,'active',c.active)
            FROM public.njacc_customers c WHERE c.id = v_id);
END $fn$;
GRANT EXECUTE ON FUNCTION public.njacc_wht_party_upsert(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_wht_party_upsert(jsonb) FROM PUBLIC, anon;

COMMIT;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 · VERIFY (READ ONLY — รันหลัง COMMIT)
-- ───────────────────────────────────────────────────────────────────────────
SELECT 'AFTER' AS phase, count(*) AS customers_total FROM public.njacc_customers;

SELECT 'V1 index ที่ต้องมี' AS check_item, i.name AS indexname,
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes x
                          WHERE x.schemaname='public' AND x.tablename='njacc_customers'
                            AND x.indexname = i.name) THEN '✅ มี' ELSE '❌ ไม่มี' END AS สถานะ
  FROM (VALUES ('njacc_cust_code_uq'), ('njacc_cust_taxbranch_uq'),
               ('njacc_cust_citizen_uq')) AS i(name);

SELECT 'V2 njacc_wht_party_upsert ตรวจซ้ำครบ 3 แบบ' AS check_item,
       (pg_get_functiondef(p.oid) LIKE '%NJACC_PARTY_CODE_DUPLICATE%')      AS มี_code,
       (pg_get_functiondef(p.oid) LIKE '%NJACC_PARTY_TAXBRANCH_DUPLICATE%') AS มี_taxbranch,
       (pg_get_functiondef(p.oid) LIKE '%NJACC_PARTY_CITIZEN_DUPLICATE%')   AS มี_citizen
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_wht_party_upsert';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4 · ⚠️ ต้องตัดสินใจเอง — ห้ามรันโดยไม่อ่าน
-- ───────────────────────────────────────────────────────────────────────────
-- ถ้าผล P1 พบ index ชื่อ  njacc_cust_tax_uq  (UNIQUE บน tax_id *เดี่ยว ๆ*)
-- แปลว่าตอนนี้ *** บริษัทเดียวกันสร้างหลายสาขาไม่ได้ *** ซึ่งขัดกับข้อกำหนดข้อ 4
--
-- ไฟล์นี้ *** ไม่ DROP ให้อัตโนมัติ *** ตามข้อกำหนดข้อ 12
-- ถ้าตรวจผลกระทบแล้วยืนยันว่าต้องการให้บริษัทเดียวกันมีหลายสาขาได้จริง
-- จึงค่อยรันบรรทัดล่างนี้แยกต่างหาก (njacc_cust_taxbranch_uq ข้อ 2.1 คุมแทนอยู่แล้ว)
--
--   DROP INDEX IF EXISTS public.njacc_cust_tax_uq;
--
-- หมายเหตุเดียวกันสำหรับ  njacc_cust_name_uq  (UNIQUE บนชื่อ)
-- ข้อกำหนดรอบนี้ไม่ได้สั่งให้ชื่อซ้ำได้ จึง *** ไม่แตะ *** ปล่อยไว้ตามเดิม
-- ═══════════════════════════════════════════════════════════════════════════
