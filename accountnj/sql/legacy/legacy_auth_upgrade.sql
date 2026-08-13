-- =====================================================================
-- BILLING NJ — legacy_auth_upgrade.sql        [LEGACY ONLY — ห้ามรันบน Fresh Install]
-- ---------------------------------------------------------------------
-- ไฟล์นี้ **ไม่อยู่ใน Fresh Install chain**
-- Fresh Install ที่ถูกต้องคือ: 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
--
-- ใช้เฉพาะกรณีเดียว: ฐานข้อมูลที่เคยติดตั้ง BILLING NJ รุ่นเก่า (≤ v1.1.0)
-- ซึ่งใช้ Auth model แบบเก่า  internal_username || '@billing.app'
-- และมี seed ผู้ใช้ชุดเก่า (EMP-0001 / EMP-0002 / benjawan30)
--
-- สิ่งที่ไฟล์นี้ทำ (ทั้งหมดมี guard และรันซ้ำได้):
--   1) ล้าง seed ผู้ใช้ชุดเก่าที่ผิด แล้ว upsert SUPER ADMIN 2 คนให้ถูกต้อง
--   2) ถอนสิทธิ์ njacc_resolve_login จาก anon (ถ้ายังมีฟังก์ชันอยู่)
--   3) LEGACY LINK: ผูก profile กับ auth.users แบบเก่า เฉพาะเมื่อเข้าเงื่อนไขครบทุกข้อ
--
-- ► ระบบปัจจุบันใช้ opaque identity เท่านั้น (njacc-auth-<uuid>@auth.billing.local)
--   หลังรันไฟล์นี้ ให้ทำตาม 009 (ย้าย email ใน Dashboard เป็น opaque) เพื่อจบการอัปเกรด
-- ไม่แตะตาราง BILLING เดิม (service_charge_records / advance_charge_records / app_users)
-- =====================================================================

-- ► PREFLIGHT: ยืนยันว่าเป็นระบบเก่าจริง (ถ้าได้ 0 แถว = ไม่ต้องรันไฟล์นี้)
SELECT count(*) AS legacy_auth_users FROM auth.users WHERE lower(email) LIKE '%@billing.app';
SELECT count(*) AS legacy_profiles FROM public.njacc_profiles
 WHERE login_name = 'benjawan30' OR employee_code IN ('EMP-0001','EMP-0002');

BEGIN;

-- ---------------------------------------------------------------
-- 1) SUPER ADMIN 2 คน (แก้ seed ชุดเก่าที่ผิด)
-- ---------------------------------------------------------------
DELETE FROM public.njacc_user_access WHERE profile_id IN
  (SELECT id FROM public.njacc_profiles
    WHERE login_name IN ('benjawan30') OR employee_code IN ('EMP-0001','EMP-0002'));
DELETE FROM public.njacc_profiles
  WHERE login_name = 'benjawan30'
     OR (employee_code IN ('EMP-0001','EMP-0002') AND login_name <> 'jamrat30');

INSERT INTO public.njacc_profiles(employee_code,full_name,department,login_name,internal_username,
  role,active,provisioning_status)
VALUES
  ('0001','Jamrat Phathep','MANAGER','jamrat30','jamrat80','SUPER_ADMIN',false,'PENDING'),
  ('0002','SOONTAREE TIRANUKUL','MANAGER','soontaree30','soontaree80','SUPER_ADMIN',false,'PENDING')
ON CONFLICT (login_name) DO UPDATE SET
  employee_code = EXCLUDED.employee_code,
  full_name     = EXCLUDED.full_name,
  department    = EXCLUDED.department,
  internal_username = EXCLUDED.internal_username,   -- metadata เท่านั้น ไม่ใช้ authenticate
  role          = 'SUPER_ADMIN';
  -- ไม่ตั้ง active ที่นี่: active=true ได้เฉพาะเมื่อ provision สำเร็จ (บังคับด้วย CHECK)
  -- แถวที่ link แล้วจะถูกตั้ง ACTIVE ในบล็อก LEGACY LINK ด้านล่าง

-- SUPER_ADMIN ไม่ต้องมีแถว access (njacc_can คืน true เสมอ)
DELETE FROM public.njacc_user_access WHERE profile_id IN
  (SELECT id FROM public.njacc_profiles WHERE login_name IN ('jamrat30','soontaree30'));

-- ---------------------------------------------------------------
-- 2) ถอนสิทธิ์ resolve_login ของ anon (ถ้ายังมีฟังก์ชันของรุ่นเก่าอยู่)
--    การ DROP จริงอยู่ใน 009
-- ---------------------------------------------------------------
DO $rl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='njacc_resolve_login') THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.njacc_resolve_login(text) FROM anon, public';
  END IF;
END $rl$;

-- ---------------------------------------------------------------
-- 3) LEGACY LINK (auth model เก่า *80@billing.app)
-- Guard ที่ต้องผ่านครบทุกข้อ:
--   0) มี auth.users แบบเก่าอยู่จริง (ไม่งั้น skip ทั้งบล็อก)
--   1) โปรไฟล์ยังไม่ถูก link (auth_user_id IS NULL)
--   2) โปรไฟล์มี internal_username จริง (record ยุคเก่าเท่านั้น)
--   3) auth.users มีอีเมล legacy pattern ตรงตัว และ match ได้เพียง 1 user
--   4) auth user นั้นยังไม่ถูก link กับโปรไฟล์อื่น
--   5) โปรไฟล์นั้นยังไม่มี opaque auth user ของตัวเอง (ห้าม overwrite auth model ใหม่)
-- ห้าม match ด้วย full_name / employee_code และห้าม overwrite auth_user_id ที่มีอยู่แล้ว
-- ---------------------------------------------------------------
DO $legacy$
DECLARE v_n int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) LIKE '%@billing.app') THEN
    RAISE NOTICE 'LEGACY LINK: skipped (ไม่มี auth user แบบเก่า — ไม่ใช่ระบบ legacy)';
    RETURN;
  END IF;

  UPDATE public.njacc_profiles p
     SET auth_user_id = u.id,
         provisioning_auth_user_id = u.id,
         provisioning_status = 'ACTIVE',
         active = true
    FROM auth.users u
   WHERE p.auth_user_id IS NULL                                       -- guard 1
     AND coalesce(p.internal_username,'') <> ''                       -- guard 2
     AND lower(u.email) = lower(p.internal_username)||'@billing.app'  -- guard 3a
     AND (SELECT count(*) FROM auth.users z                           -- guard 3b: ต้อง match เดียว
           WHERE lower(z.email) = lower(p.internal_username)||'@billing.app') = 1
     AND NOT EXISTS (SELECT 1 FROM public.njacc_profiles x            -- guard 4
                      WHERE x.auth_user_id = u.id)
     AND NOT EXISTS (SELECT 1 FROM auth.users o                       -- guard 5
                      WHERE lower(o.email) = lower(p.auth_identity)||'@auth.billing.local');
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'LEGACY LINK: linked % legacy profile(s)', v_n;
  -- ข้อมูลไม่พอ match แน่นอน → ไม่ link ให้เดา ต้อง Manual Migration (ดู 009 VERIFICATION ข้อ 6)
END $legacy$;

COMMIT;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
SELECT employee_code, full_name, department, login_name, role, active,
       (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;
-- Expected: 0001 jamrat30 / 0002 soontaree30 · ไม่มี benjawan30 / EMP-000x

SELECT count(*) AS profiles_without_link FROM public.njacc_profiles WHERE auth_user_id IS NULL;
-- ถ้า > 0 → ต้อง Manual: ดูอีเมล opaque จาก 009 VERIFICATION ข้อ 6 แล้วสร้าง/แก้ใน Dashboard

-- ขั้นถัดไปของการอัปเกรด: รัน 009 แล้วเปลี่ยน Email ของผู้ใช้เดิมใน Dashboard
-- เป็น opaque identity (njacc-auth-<uuid>@auth.billing.local) — auth_user_id ไม่เปลี่ยน

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- UPDATE public.njacc_profiles SET auth_user_id = NULL WHERE login_name IN ('jamrat30','soontaree30');
-- (ไม่แนะนำ — จะทำให้ผู้ใช้เข้าระบบไม่ได้จนกว่าจะ link ใหม่)
