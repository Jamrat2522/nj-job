-- =====================================================================
-- BILLING NJ — 006_njacc_seed.sql  (รันหลัง 005)
-- Seed: settings + user เริ่มต้น 2 คน — ไม่มี PASSWORD ในไฟล์นี้ (ตาม §61)
-- =====================================================================
-- ► SECURE AUTH BOOTSTRAP
--   ตัวตนที่ใช้กับ Supabase Auth เป็นแบบ opaque (njacc-auth-<uuid>@auth.billing.local)
--   ไม่มีชื่อจริง / รหัสพนักงาน / เลข 80 อยู่ใน Auth identity หรือใน JWT
--   ขั้นตอน (ทำใน Dashboard/SQL Editor เท่านั้น — ไม่มีรหัสผ่านในไฟล์ใด ๆ ของโปรเจกต์):
--     1) รันไฟล์นี้ (STEP A/B)
--     2) รัน STEP B2 เพื่อดูอีเมล Auth ที่ต้องสร้าง (แสดงเฉพาะใน SQL Editor)
--     3) Dashboard → Authentication → Users → Add user ตามอีเมลนั้น (Auto Confirm ✓)
--        ตั้งรหัสผ่านใน Dashboard เอง
--     4) รัน STEP C เพื่อ link auth_user_id (รันซ้ำได้)
-- =====================================================================
BEGIN;

-- STEP A: settings
INSERT INTO public.njacc_settings(key,value) VALUES
  ('vat_rate','7'),
  ('deploy_version','1.0.0'),
  ('maintenance_active','false'),
  ('maintenance_message','ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที')
ON CONFLICT (key) DO NOTHING;

-- STEP B: profiles (SUPER ADMIN 2 คนตาม Requirement ล็อก)
-- provisioning_status = PENDING และ active = false จนกว่าจะ link auth user สำเร็จ (STEP C)
-- → ไม่มีสถานะ ACTIVE ที่ auth_user_id ยัง NULL
INSERT INTO public.njacc_profiles(employee_code,full_name,department,login_name,internal_username,
  role,active,provisioning_status)
VALUES
  ('0001','Jamrat Phathep','MANAGER','jamrat30','jamrat80','SUPER_ADMIN',false,'PENDING'),
  ('0002','SOONTAREE TIRANUKUL','MANAGER','soontaree30','soontaree80','SUPER_ADMIN',false,'PENDING')
ON CONFLICT (login_name) DO UPDATE SET
  employee_code=EXCLUDED.employee_code, full_name=EXCLUDED.full_name,
  department=EXCLUDED.department, internal_username=EXCLUDED.internal_username,
  role='SUPER_ADMIN';   -- ไม่ยุ่งกับ active/provisioning_status ของแถวที่ link แล้ว
-- SUPER_ADMIN ไม่ต้องมีแถว njacc_user_access (njacc_can คืน true เสมอ)

COMMIT;

-- STEP B2: อีเมล Auth ที่ต้องสร้างใน Dashboard (ผลลัพธ์นี้อยู่ใน SQL Editor เท่านั้น)
SELECT login_name AS "Login ที่ผู้ใช้พิมพ์",
       auth_identity || '@auth.billing.local' AS "Auth email ที่ต้องสร้างใน Dashboard"
  FROM public.njacc_profiles ORDER BY employee_code;

-- STEP C: link auth.users → profiles (รันหลังสร้าง user ใน Dashboard · idempotent)
-- Guard: (1) profile ยังไม่ link (2) match opaque identity ได้ "เพียง 1 user"
--        (3) auth user นั้นยังไม่ถูก link กับ profile อื่น   ห้าม overwrite link เดิม
-- ทำใน operation เดียว: auth_user_id + provisioning_auth_user_id + ACTIVE + active=true
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
-- ถ้ายังมี profile ที่ auth_user_id IS NULL → สร้าง/ตรวจอีเมลใน Dashboard ให้ตรงก่อน แล้วรันซ้ำ

-- VERIFICATION
SELECT login_name, role, active, (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;
-- Expected หลัง STEP C: jamrat30 / soontaree30 · SUPER_ADMIN · active=t · ACTIVE · linked=t
SELECT login_name, role, active, provisioning_status, (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;
-- ต้องไม่มีแถวที่ provisioning_status='ACTIVE' แต่ auth_user_id IS NULL
-- ถ้า linked=f → ยังไม่ได้สร้าง auth user ใน Dashboard → สร้างแล้วรัน STEP C ซ้ำได้ (idempotent)
SELECT key,value FROM public.njacc_settings ORDER BY key;
-- Rollback:
-- DELETE FROM public.njacc_profiles WHERE login_name IN ('jamrat30','soontaree30');
-- DELETE FROM public.njacc_settings WHERE key IN ('vat_rate','deploy_version','maintenance_active','maintenance_message');
