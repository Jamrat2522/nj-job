-- ============================================================
-- NJ HR — Login ด้วย USER จริงจาก app_users (app_code='salary')
-- ตรวจรหัสผ่านฝั่ง Server ผ่าน RPC · ไม่ส่ง password/hash มาที่ Browser
-- ไม่สร้าง USER ใหม่ · ไม่แก้ username/role/status/employee_id ของใคร
-- ============================================================

-- ─── ส่วนที่ 1: BACKUP ก่อนทำอะไรทั้งสิ้น (รันก่อนเสมอ) ───────────
create table if not exists njhr_appusers_backup_20260727 as
  select *, now() as backed_up_at from public.app_users where app_code = 'salary';
select count(*) as "สำรอง app_users (salary)" from njhr_appusers_backup_20260727;


-- ─── ส่วนที่ 2: ตรวจว่ารหัสผ่านเก็บรูปแบบไหน (อ่านอย่างเดียว) ────────
-- ผลลัพธ์นี้จำเป็นก่อนใช้ RPC — ถ้ามีทั้ง 2 แบบ RPC ด้านล่างรองรับทั้งคู่
select
  count(*)                                                            as total,
  count(*) filter (where password is not null and password <> '')     as has_password,
  count(*) filter (where password_hash is not null)                   as has_hash,
  count(*) filter (where password_hash like '$2%')                    as bcrypt_hash,
  count(*) filter (where (password is null or password = '')
                     and password_hash is null)                       as no_credential
from public.app_users where app_code = 'salary';


-- ─── ส่วนที่ 3: RPC Login (SECURITY DEFINER — ตรวจฝั่งเซิร์ฟเวอร์) ───
create extension if not exists pgcrypto;

create or replace function public.njhr_login(p_username text, p_password text)
returns table (
  user_id uuid, username text, internal_username text, email text,
  full_name text, department text, role text, status text,
  employee_id uuid, emp_code text, emp_name text, emp_department text,
  emp_position text, emp_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare u public.app_users; ok boolean := false;
begin
  select * into u from public.app_users
   where app_code = 'salary'
     and (lower(username) = lower(trim(p_username))
       or lower(coalesce(internal_username,'')) = lower(trim(p_username)))
   limit 1;

  if not found then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode = '28000'; end if;

  -- ตรวจรหัสผ่านตามรูปแบบที่พบจริงในข้อมูล (bcrypt ก่อน ถ้าไม่มีจึงเทียบ plaintext)
  if u.password_hash is not null and u.password_hash like '$2%' then
    ok := (u.password_hash = crypt(p_password, u.password_hash));
  elsif u.password is not null and u.password <> '' then
    ok := (u.password = p_password);
  end if;
  if not ok then raise exception 'รหัสผ่านไม่ถูกต้อง' using errcode = '28P01'; end if;

  -- สถานะบัญชี: คงพฤติกรรมตามค่าที่มีอยู่จริง ไม่เปลี่ยนสถานะใคร
  if coalesce(u.is_active, true) = false then
    raise exception 'บัญชีถูกปิดใช้งาน' using errcode = '28000';
  end if;
  if lower(coalesce(u.status,'active')) = 'pending' then
    raise exception 'บัญชีรออนุมัติ กรุณาติดต่อผู้ดูแลระบบ' using errcode = '28000';
  end if;
  if lower(coalesce(u.status,'active')) not in ('active','') then
    raise exception 'บัญชีไม่พร้อมใช้งาน (สถานะ: %)', u.status using errcode = '28000';
  end if;
  if u.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อ HR' using errcode = '28000';
  end if;

  update public.app_users set updated_at = now() where id = u.id;   -- แตะเฉพาะ updated_at

  return query
    select u.id, u.username, u.internal_username, u.email, u.full_name, u.department,
           u.role::text, coalesce(u.status,'active'), u.employee_id,
           e.emp_code, (coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,'')),
           e.department_name, e.position_name, e.status::text
      from public.employees e where e.id = u.employee_id;
end $$;

revoke all on function public.njhr_login(text, text) from public;
grant execute on function public.njhr_login(text, text) to anon, authenticated;


-- ─── ส่วนที่ 4: รายงานตามข้อ 17 ของสเปก ─────────────────────────
select
  (select count(*) from public.app_users where app_code='salary')                              as "USER salary ทั้งหมด",
  (select count(*) from public.app_users where app_code='salary' and employee_id is not null)   as "มี employee_id",
  (select count(*) from public.app_users where app_code='salary' and employee_id is null)       as "ยังไม่มี employee_id",
  (select count(*) from (select lower(username) un from public.app_users where app_code='salary'
                          group by 1 having count(*)>1) d)                                      as "username ซ้ำ",
  (select count(*) from public.app_users where app_code='salary'
     and (coalesce(is_active,true)=false or lower(coalesce(status,'active'))<>'active'))        as "pending/disabled",
  (select count(*) from public.app_users a join public.app_users b
     on a.employee_id = b.employee_id and a.id < b.id
    where a.app_code='salary' and b.app_code='salary' and a.employee_id is not null)            as "employee ถูกผูกซ้ำ";

-- รายชื่อที่ Admin/HR ต้องยืนยัน Mapping (ห้ามจับคู่เอง)
select username, internal_username, department, role::text as role, coalesce(status,'active') as status
from public.app_users
where app_code='salary' and employee_id is null
order by username;


-- ─── ส่วนที่ 5: ทดสอบ RPC (แทน 'xxx' ด้วยรหัสผ่านจริงของบัญชีทดสอบ) ──
-- select * from public.njhr_login('jamrat', 'xxx');


-- ─── ส่วนที่ 6: ROLLBACK ─────────────────────────────────────────
-- drop function if exists public.njhr_login(text, text);
-- update public.app_users a set employee_id = b.employee_id, status = b.status,
--        is_active = b.is_active, role = b.role
--   from njhr_appusers_backup_20260727 b where a.id = b.id;
