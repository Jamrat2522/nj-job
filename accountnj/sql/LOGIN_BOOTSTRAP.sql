-- =====================================================================
-- BILLING NJ — LOGIN_BOOTSTRAP.sql   (อ่านอย่างเดียว + STEP C)
-- ใช้ในรอบ "ให้เข้าระบบได้ก่อน" — รันทีละส่วนตามลำดับ
-- =====================================================================

-- =====================================================================
-- ส่วน A: ตรวจหลังรัน 001–009 (ก่อนไปทำ Auth)   [READ-ONLY]
-- =====================================================================
SELECT 'A1 tables' AS check, count(*) AS value FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'njacc\_%' ESCAPE '\';
-- Expected: 19

SELECT 'A2 app_status_exists', count(*)::text FROM pg_proc WHERE proname='njacc_app_status';
-- Expected: 1   (ถ้าได้ 0 = ยังไม่ได้รัน 005 → หน้าเว็บจะขึ้น 404 njacc_app_status)

SELECT 'A3 app_status_call', public.njacc_app_status()::text;
-- Expected: JSON มี deploy_version / maintenance_active

SELECT 'A4 app_status_grant', grantee FROM information_schema.routine_privileges
 WHERE routine_name='njacc_app_status' AND grantee IN ('anon','authenticated');
-- Expected: มี anon และ authenticated (เบราว์เซอร์เรียกได้ก่อน login)

SELECT 'A5 routines', count(*)::text FROM information_schema.routines
 WHERE routine_schema='public' AND routine_name LIKE 'njacc\_%' ESCAPE '\';
-- Expected: ~67

SELECT 'A6 profile' AS check, employee_code, full_name, department, login_name, role,
       active, provisioning_status, (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;
-- Expected ก่อน link: 0001 Jamrat Phathep / MANAGER / jamrat30 / SUPER_ADMIN
--                     active=f · PENDING · linked=f

-- =====================================================================
-- ส่วน B: อีเมล Auth ที่ต้องสร้างใน Dashboard   [READ-ONLY]
-- ผลลัพธ์นี้อยู่ใน SQL Editor เท่านั้น — ห้ามส่งออกไปที่เบราว์เซอร์แอป
-- =====================================================================
SELECT login_name AS "Login ที่ผู้ใช้พิมพ์",
       auth_identity || '@auth.billing.local' AS "Auth email ที่ต้องสร้างใน Dashboard"
  FROM public.njacc_profiles ORDER BY employee_code;
-- นำอีเมลของ jamrat30 ไปสร้างที่ Dashboard → Authentication → Users → Add user
--   Auto Confirm User = ON · ตั้งรหัสผ่านเอง (ห้ามเขียนรหัสลงไฟล์ใด ๆ)

-- =====================================================================
-- ส่วน C: LINK auth.users → profile   (รันหลังสร้าง user ใน Dashboard)
-- idempotent · guard: ยังไม่ link + match ได้ 1 เดียว + auth user ยังไม่ผูกกับใคร
-- =====================================================================
UPDATE public.njacc_profiles p
   SET auth_user_id = u.id,
       provisioning_auth_user_id = u.id,
       provisioning_status = 'ACTIVE',
       active = true
  FROM auth.users u
 WHERE p.auth_user_id IS NULL
   AND lower(u.email) = lower(p.auth_identity)||'@auth.billing.local'
   AND (SELECT count(*) FROM auth.users z
         WHERE lower(z.email) = lower(p.auth_identity)||'@auth.billing.local') = 1
   AND NOT EXISTS (SELECT 1 FROM public.njacc_profiles x WHERE x.auth_user_id = u.id);

-- =====================================================================
-- ส่วน D: ตรวจหลัง link   [READ-ONLY]
-- =====================================================================
SELECT 'D1 profile' AS check, login_name, role, active, provisioning_status,
       (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;
-- Expected: jamrat30 · SUPER_ADMIN · active=t · ACTIVE · linked=t

SELECT 'D2 invariant_active_without_auth', count(*)::text FROM public.njacc_profiles
 WHERE provisioning_status='ACTIVE' AND auth_user_id IS NULL;
-- Expected: 0

-- D3: จำลองสิ่งที่ Edge Function njacc-login ทำ (resolve ตัวตนภายใน)
--     ต้องคืนค่าได้ = login ผ่านฝั่ง DB แล้ว · ถ้า error NJACC_LOGIN_NOT_FOUND
--     แปลว่า profile ยังไม่ ACTIVE/active/linked
DO $chk$
DECLARE v text;
BEGIN
  BEGIN
    v := public.njacc_auth_lookup('jamrat30');
    RAISE NOTICE 'D4 auth_lookup: OK — ฝั่งฐานข้อมูลพร้อมให้ jamrat30 เข้าสู่ระบบแล้ว';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'D4 auth_lookup: FAIL (%) — profile ยังไม่ ACTIVE / active=false / ยังไม่ link', SQLERRM;
  END;
END $chk$;
-- Expected: NOTICE ... OK

-- =====================================================================
-- ส่วน E: ถ้า login ไม่ผ่าน ใช้ตรวจสาเหตุ   [READ-ONLY]
-- =====================================================================
-- E1) ผู้ใช้พิมพ์ชื่อถูกไหม (ต้องเป็น jamrat30 ไม่ใช่ jamrat)
SELECT login_name FROM public.njacc_profiles;

-- E2) auth user ในระบบยืนยันตัวตน ตรงกับ opaque identity ไหม
SELECT p.login_name, p.auth_identity||'@auth.billing.local' AS expected_email,
       u.email AS actual_email, (u.id IS NOT NULL) AS auth_user_exists
  FROM public.njacc_profiles p
  LEFT JOIN auth.users u ON u.id = p.auth_user_id
 ORDER BY p.employee_code;

-- E3) สิทธิ์ RPC ที่ Edge Function ต้องใช้ (ต้องเป็น service_role เท่านั้น)
SELECT routine_name, grantee FROM information_schema.routine_privileges
 WHERE routine_name IN ('njacc_auth_lookup','njacc_log_login_success')
 ORDER BY routine_name, grantee;

-- E4) RPC ที่เบราว์เซอร์เรียกหลัง login (ต้องมี authenticated)
SELECT routine_name, grantee FROM information_schema.routine_privileges
 WHERE routine_name='njacc_my_profile' ORDER BY grantee;
