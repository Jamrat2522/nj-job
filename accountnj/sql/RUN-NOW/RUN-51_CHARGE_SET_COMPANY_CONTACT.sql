-- ══════════════════════════════════════════════════════════════════════════
-- RUN-51 — ส่ง company_contact ออกจาก List RPC (Data Contract ของ SOA Column S)
--   Migration Chain : … -> RUN-48 -> RUN-49 -> RUN-50 -> RUN-51
--
-- ROOT CAUSE ที่แก้
--   njacc_build_charge_set มี company_contact อยู่แล้วใน CTE `base`
--     ci.contact_name AS company_contact
--   แต่ final projection ของ temp table _njacc_l ส่งออกเพียง
--     coalesce(contact, company_contact) AS contact
--   *** ไม่เคย project company_contact ออกมาเป็น field แยก ***
--   -> charge-export.js:401 อ่าน r.company_contact -> undefined
--      SOA Column S "Contact person" ว่างเสมอบน Production
--   -> ใช้ r.contact แทนไม่ได้ เพราะ contact ถูก coalesce กับ job override
--      (njacc_jobs.contact) ซึ่งคนละความหมายกับ LIST NAME ของ Company Invoice
--
-- ที่ทำ
--   patch เพิ่ม 1 คอลัมน์ใน SELECT list ของ njacc_build_charge_set
--     coalesce(contact, company_contact) AS contact,
--   ->  coalesce(contact, company_contact) AS contact, company_contact,
--   ใช้รูปแบบเดียวกับ RUN-38 (อ่าน pg_get_functiondef จริง -> replace marker
--   -> EXECUTE) ไม่พิมพ์ body ใหม่ทับ -> patch ของ RUN-02/04/33/35/38 คงอยู่ครบ
--   ถ้าหา marker ไม่พบ -> RAISE EXCEPTION หยุดทันที *** ห้ามเดาตำแหน่ง ***
--
-- ทำไมปลอดภัย
--   ─ contact เดิมยังอยู่ ความหมายเดิมไม่เปลี่ยน (job override -> LIST NAME)
--   ─ ผู้บริโภคทุกตัว (njacc_list_charges · njacc_charge_page_bundle ·
--     njacc_export_charges) ใช้ SELECT * + jsonb_agg -> เพิ่มคอลัมน์เป็น
--     additive ล้วน ไม่มี signature/ลำดับคอลัมน์ที่ถูกอ้างด้วยตำแหน่ง
--   ─ base CTE มี company_contact อยู่แล้ว · calc CTE ใช้ b.* -> ไม่ต้องแก้ JOIN
--   ─ ไม่แตะ WHERE / queue / filter / ORDER / KPI
--
-- ไม่ทำ
--   ─ ไม่ลบ / ไม่เปลี่ยน coalesce(contact, company_contact) AS contact
--   ─ ไม่แตะ njacc_contact_list · njacc_upload_contact_list · njacc_job_detail
--   ─ ไม่มี DROP / DELETE / TRUNCATE / ALTER · ไม่แก้ข้อมูล Production
-- ══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE d text;
        marker text := 'coalesce(contact, company_contact) AS contact,';
        n int;
BEGIN
  d := pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure);

  IF position('AS contact, company_contact,' in d) > 0 THEN
    RAISE NOTICE 'RUN-51 : build_charge_set ส่ง company_contact แล้ว — ข้าม';
    RETURN;
  END IF;

  n := (length(d) - length(replace(d, marker, ''))) / length(marker);
  IF n = 0 THEN
    RAISE EXCEPTION 'RUN-51 : หา marker ใน njacc_build_charge_set ไม่พบ — หยุด ห้ามเดา';
  END IF;
  IF n > 1 THEN
    RAISE EXCEPTION 'RUN-51 : marker ซ้ำ % ครั้ง — หยุด ห้ามเดา', n;
  END IF;

  d := replace(d, marker, 'coalesce(contact, company_contact) AS contact, company_contact,');
  EXECUTE d;
  RAISE NOTICE 'RUN-51 : เพิ่ม company_contact เข้า build_charge_set แล้ว';
END $$;

-- ── VERIFY (READ ONLY) ────────────────────────────────────────────────────
SELECT 'C1 List RPC ส่ง company_contact แยกออกมา' AS check_name,
  CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
            LIKE '%AS contact, company_contact,%'
       THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'C2 contact เดิมยังอยู่ ความหมายไม่เปลี่ยน',
  CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
            LIKE '%coalesce(contact, company_contact) AS contact%'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'C3 แหล่งข้อมูลยังเป็น Company Invoice (LIST NAME)',
  CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
            LIKE '%ci.contact_name AS company_contact%'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'C4 Module/Queue Guard เดิมไม่ถูกถอด',
  CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
            LIKE '%njacc_require_queue%'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'C5 job_category ของ RUN-38 ยังอยู่ (patch ไม่ทับกัน)',
  CASE WHEN pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure)
            LIKE '%job_category%'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'C6 Grant : authenticated=yes · anon=no',
  CASE WHEN has_function_privilege('authenticated','public.njacc_build_charge_set(jsonb)','EXECUTE')
        AND NOT has_function_privilege('anon','public.njacc_build_charge_set(jsonb)','EXECUTE')
       THEN 'PASS' ELSE 'FAIL' END;
