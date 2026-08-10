-- ============================================================
-- NJ HR V2 — M2_rollback.sql
-- ย้อนกลับ Cutover จากสำเนาที่ M2 สร้างไว้
--
-- ใช้เมื่อ: รัน M2 แล้ว COMMIT ไปแล้ว และต้องการกลับสู่สภาพก่อน Cutover
-- ถ้ายังไม่ COMMIT ให้พิมพ์ ROLLBACK; ในหน้าต่างเดิมพอ ไม่ต้องใช้ไฟล์นี้
--
-- คืนค่าจาก 3 ตารางสำเนา:
--   njhr_m2_bk_app_users · njhr_m2_bk_sessions · njhr_m2_bk_activation
--
-- ⚠️ สิ่งที่ไฟล์นี้ย้อนกลับได้:
--     · status · is_active · username · email · password_hash · password · updated_at ของ app_users
--     · revoked ของ njhr_sessions
--     · status · decided_at · reject_reason ของ njhr_activation_requests
--
-- ⚠️ สิ่งที่ไฟล์นี้ย้อนกลับให้ไม่ได้ ต้องตัดสินใจเอง:
--     · คำขอสมัครใหม่ที่พนักงานยื่นหลัง Cutover (แถวใหม่ใน njhr_activation_requests)
--       ไฟล์นี้ไม่ลบทิ้ง เพราะเป็นข้อมูลจริงที่พนักงานกรอกเอง
--     · การแก้ employees (first_name_en · last_name_en · nickname · email)
--       ที่เกิดจากการกด "เชื่อม" หลัง Cutover — ตรวจจาก audit log แล้วแก้เป็นรายคน
--     · บัญชีใหม่ที่ถูกสร้างขึ้นหลัง Cutover (ไม่มีใน backup) — ไฟล์นี้ไม่แตะ
--
-- ฟังก์ชัน 5 ตัวที่ M2 เขียนทับ ต้องคืนโดยรันไฟล์ต้นทางเดิมซ้ำ (ดูหมวด 3 ท้ายไฟล์)
-- ============================================================

-- หมายเหตุการรัน: Supabase SQL Editor ห่อทั้งไฟล์เป็น Transaction เดียวและ COMMIT ให้เอง
-- ถ้ามีคำสั่งใดโยน exception จะ ROLLBACK ทั้งไฟล์ · ไม่ใช้ \set / BEGIN / COMMIT

-- ════════════════════════════════════════════════════════════
-- 0) PREFLIGHT — ต้องมีสำเนาครบก่อนจึงย้อนกลับได้
-- ════════════════════════════════════════════════════════════
do $$
declare n int;
begin
  if to_regclass('public.njhr_m2_bk_app_users') is null
     or to_regclass('public.njhr_m2_bk_sessions') is null
     or to_regclass('public.njhr_m2_bk_activation') is null then
    raise exception 'ROLLBACK PREFLIGHT: ไม่พบตารางสำเนาของ M2 — ย้อนกลับไม่ได้';
  end if;
  select count(*) into n from public.njhr_m2_bk_app_users;
  if n = 0 then
    raise exception 'ROLLBACK PREFLIGHT: สำเนา app_users ว่าง — ย้อนกลับไม่ได้';
  end if;
  raise notice 'ROLLBACK PREFLIGHT ผ่าน · สำเนา app_users % แถว', n;
end $$;


-- ════════════════════════════════════════════════════════════
-- 1) คืนค่า app_users จากสำเนา (เฉพาะแถวที่มีในสำเนา)
--    บัญชีที่สร้างใหม่หลัง Cutover ไม่ถูกแตะและไม่ถูกลบ
-- ════════════════════════════════════════════════════════════
update public.app_users u
   set username      = b.username,
       email         = b.email,
       role          = b.role,
       employee_id   = b.employee_id,
       is_active     = b.is_active,
       status        = b.status,
       password      = b.password,
       password_hash = b.password_hash,
       updated_at    = now()
  from public.njhr_m2_bk_app_users b
 where u.id = b.id
   and (u.username      is distinct from b.username
     or u.email         is distinct from b.email
     or u.role          is distinct from b.role
     or u.employee_id   is distinct from b.employee_id
     or u.is_active     is distinct from b.is_active
     or u.status        is distinct from b.status
     or u.password      is distinct from b.password
     or u.password_hash is distinct from b.password_hash);


-- ════════════════════════════════════════════════════════════
-- 2) คืนสถานะ session และคำขอสมัคร
--    session ที่ออกใหม่หลัง Cutover ไม่มีในสำเนา จึงไม่ถูกแตะ
-- ════════════════════════════════════════════════════════════
update public.njhr_sessions s
   set revoked = b.revoked
  from public.njhr_m2_bk_sessions b
 where s.token = b.token and s.revoked is distinct from b.revoked;

update public.njhr_activation_requests r
   set status        = b.status,
       decided_at    = b.decided_at,
       decided_by    = b.decided_by,
       reject_reason = b.reject_reason,
       linked_user_id = b.linked_user_id
  from public.njhr_m2_bk_activation b
 where r.id = b.id
   and (r.status is distinct from b.status or r.decided_at is distinct from b.decided_at);


-- ════════════════════════════════════════════════════════════
-- 3) ASSERT อัตโนมัติ + สรุปผล — ผิด = raise = ROLLBACK ทั้งไฟล์
-- ════════════════════════════════════════════════════════════
do $$
declare n int;
begin
  select count(*) into n from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where u.username is distinct from b.username
      or u.status   is distinct from b.status
      or u.is_active is distinct from b.is_active
      or u.password_hash is distinct from b.password_hash
      or u.role is distinct from b.role
      or u.employee_id is distinct from b.employee_id;
  if n > 0 then
    raise exception 'ROLLBACK ASSERT ล้มเหลว: ยังต่างจากสำเนา % บัญชี', n;
  end if;
  raise notice 'ROLLBACK สำเร็จ — app_users ตรงกับสำเนาทุกแถว';
end $$;

select jsonb_pretty(jsonb_build_object(
  'accounts_restored_to_active',
    (select count(*) from public.app_users
      where app_code='salary' and coalesce(status,'active')='active'),
  'accounts_still_registration_required',
    (select count(*) from public.app_users
      where app_code='salary' and status='registration_required'),
  'diff_vs_backup', (select count(*) from public.app_users u
     join public.njhr_m2_bk_app_users b on b.id = u.id
    where u.username is distinct from b.username
       or u.status   is distinct from b.status
       or u.is_active is distinct from b.is_active
       or u.password_hash is distinct from b.password_hash),
  'accounts_created_after_cutover',
    (select count(*) from public.app_users u
      where u.app_code='salary'
        and not exists (select 1 from public.njhr_m2_bk_app_users b where b.id = u.id)),
  'activation_requests_after_cutover',
    (select count(*) from public.njhr_activation_requests r
      where not exists (select 1 from public.njhr_m2_bk_activation b where b.id = r.id)),
  'super_admins', (select jsonb_agg(jsonb_build_object(
      'username', username, 'status', status, 'is_active', is_active) order by username)
    from public.app_users where app_code='salary' and role::text='SUPER_ADMIN')
)) as rollback_verification;



-- ════════════════════════════════════════════════════════════
-- 4) คืนฟังก์ชัน 5 ตัวที่ M2 เขียนทับ
--    ไฟล์นี้ไม่คืนให้อัตโนมัติ เพราะต้องใช้ตัวบทเดิมจาก Source ของโปรเจกต์
--    ให้รันไฟล์ต้นทางเหล่านี้ซ้ำ (CREATE OR REPLACE จึงปลอดภัย):
--
--      njhr_login              → supabase/30_login_rpc.sql  (หรือรุ่นล่าสุดที่ติดตั้งอยู่)
--      njhr_member_list        → supabase-new/C2_activation_en.sql
--      njhr_activation_submit  → supabase-new/C2_activation_en.sql
--      njhr_activation_link    → supabase-new/C2_activation_en.sql
--      njhr_user_link          → supabase-new/52_users.sql
--
--    ⚠️ ตรวจก่อนว่า njhr_login ในฐานข้อมูลตรงกับไฟล์ไหน เพราะรุ่นที่ติดตั้งจริง
--       มี progressive rehash + server-side TTL ซึ่งใหม่กว่า 30_login_rpc.sql
--       ถ้าไม่แน่ใจ ให้ดึงตัวบทเดิมเก็บไว้ก่อนรัน M2 ด้วยคำสั่งนี้:
--
--         select pg_get_functiondef(p.oid)
--           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--          where n.nspname = 'public' and p.prokind = 'f'
--            and p.proname in ('njhr_login','njhr_member_list','njhr_activation_submit',
--                              'njhr_activation_link','njhr_user_link');
--
-- 5) ลบตารางสำเนาเมื่อมั่นใจแล้วเท่านั้น (ไม่ใช่ขั้นตอนบังคับ)
--      drop table public.njhr_m2_bk_app_users;
--      drop table public.njhr_m2_bk_sessions;
--      drop table public.njhr_m2_bk_activation;
-- ════════════════════════════════════════════════════════════
