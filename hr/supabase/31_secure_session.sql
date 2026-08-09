-- ============================================================
-- NJ HR — Session Token ฝั่งเซิร์ฟเวอร์ + Progressive Rehash รหัสผ่าน
-- แก้ตรงข้อ 5 (session ไม่ปลอดภัย), 7 (RLS ยืนยัน USER ไม่ได้), 8 (plaintext)
-- ไม่แตะ username / role / status / department / email / employee_id ของใครทั้งสิ้น
-- ============================================================
create extension if not exists pgcrypto;

-- ─── 1) BACKUP (รันก่อนเสมอ) ─────────────────────────────────
create table if not exists njhr_appusers_backup_pw_20260727 as
  select id, username, password, password_hash, now() as backed_up_at
  from public.app_users where app_code = 'salary';
select count(*) as "สำรองรหัสผ่านเดิม" from njhr_appusers_backup_pw_20260727;

-- ─── 2) ตาราง Session (token ตรวจสอบได้จริง มีอายุ เพิกถอนได้) ──
create table if not exists public.njhr_sessions (
  token       text primary key default encode(gen_random_bytes(32), 'hex'),
  app_user_id uuid not null references public.app_users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '12 hours',
  last_seen   timestamptz not null default now(),
  revoked     boolean not null default false,
  user_agent  text
);
create index if not exists njhr_sessions_user_idx on public.njhr_sessions(app_user_id, revoked, expires_at);
alter table public.njhr_sessions enable row level security;  -- เข้าถึงได้เฉพาะผ่าน RPC เท่านั้น

-- ─── 3) LOGIN v2: ตรวจรหัสผ่าน → rehash → ออก token ────────────
create or replace function public.njhr_login(p_username text, p_password text, p_ua text default null)
returns table (
  session_token text, expires_at timestamptz,
  user_id uuid, username text, internal_username text, email text, full_name text,
  department text, role text, status text, employee_id uuid,
  emp_code text, emp_name text, emp_department text, emp_position text, emp_status text
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare u public.app_users; ok boolean := false; tok text; exp timestamptz;
begin
  select a.* into u from public.app_users a
   where a.app_code = 'salary'
     and (lower(a.username) = lower(trim(p_username))
       or lower(coalesce(a.internal_username,'')) = lower(trim(p_username)))
   limit 1;
  if not found then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='28000'; end if;

  if u.password_hash is not null and u.password_hash like '$2%' then
    ok := (u.password_hash = crypt(p_password, u.password_hash));
  elsif u.password is not null and u.password <> '' then
    ok := (u.password = p_password);
    if ok then   -- Progressive rehash: รหัสผ่านเดิมยังใช้ได้ แต่เก็บเป็น bcrypt แล้วลบ plaintext
      update public.app_users a
         set password_hash = crypt(p_password, gen_salt('bf', 10)), password = null
       where a.id = u.id;
    end if;
  end if;
  if not ok then raise exception 'รหัสผ่านไม่ถูกต้อง' using errcode='28P01'; end if;

  if coalesce(u.is_active,true) = false then raise exception 'บัญชีถูกปิดใช้งาน' using errcode='28000'; end if;
  if lower(coalesce(u.status,'active')) = 'pending' then raise exception 'บัญชีรออนุมัติ กรุณาติดต่อผู้ดูแลระบบ' using errcode='28000'; end if;
  if lower(coalesce(u.status,'active')) <> 'active' then raise exception 'บัญชีไม่พร้อมใช้งาน (สถานะ: %)', u.status using errcode = '28000'; end if;
  if u.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ' using errcode='28000';
  end if;

  update public.njhr_sessions ss set revoked = true
   where ss.app_user_id = u.id and ss.expires_at < now() and not ss.revoked;
  insert into public.njhr_sessions(app_user_id, user_agent) values (u.id, left(coalesce(p_ua,''),200))
    returning njhr_sessions.token, njhr_sessions.expires_at into tok, exp;

  return query
    select tok, exp, u.id, u.username, u.internal_username, u.email, u.full_name, u.department,
           u.role::text, coalesce(u.status,'active'), u.employee_id,
           e.emp_code, (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
           e.department_name, e.position_name, e.status::text
      from public.employees e where e.id = u.employee_id;
end $$;

-- ─── 4) ตรวจ session ทุกครั้งที่เปิดระบบ (บัญชีถูกปิด = ใช้ token เก่าไม่ได้) ──
create or replace function public.njhr_session_check(p_token text)
returns table (user_id uuid, username text, role text, employee_id uuid,
               emp_code text, emp_name text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare s public.njhr_sessions; u public.app_users;
begin
  select ss.* into s from public.njhr_sessions ss where ss.token = p_token;
  if not found or s.revoked or s.expires_at < now() then
    raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode='28000';
  end if;
  select a.* into u from public.app_users a where a.id = s.app_user_id;
  if coalesce(u.is_active,true) = false or lower(coalesce(u.status,'active')) <> 'active'
     or u.employee_id is null then
    update public.njhr_sessions ss set revoked = true where ss.token = p_token;
    raise exception 'บัญชีถูกระงับการใช้งาน' using errcode='28000';
  end if;
  update public.njhr_sessions ss set last_seen = now() where ss.token = p_token;
  return query select u.id, u.username, u.role::text, u.employee_id, e.emp_code,
    (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')), s.expires_at
    from public.employees e where e.id = u.employee_id;
end $$;

create or replace function public.njhr_logout(p_token text)
returns boolean language sql security definer set search_path = public as $$
  update public.njhr_sessions set revoked = true where token = p_token returning true;
$$;

-- ─── 5) ตัวช่วยสำหรับ RLS: อ่าน role/employee_id จาก token (ไม่เชื่อค่าจาก browser) ──
create or replace function public.njhr_token_role(p_token text) returns text
language sql stable security definer set search_path = public as $$
  select u.role::text from public.njhr_sessions s join public.app_users u on u.id = s.app_user_id
   where s.token = p_token and not s.revoked and s.expires_at > now() limit 1 $$;

create or replace function public.njhr_token_employee(p_token text) returns uuid
language sql stable security definer set search_path = public as $$
  select u.employee_id from public.njhr_sessions s join public.app_users u on u.id = s.app_user_id
   where s.token = p_token and not s.revoked and s.expires_at > now() limit 1 $$;

revoke all on function public.njhr_login(text,text,text) from public;
revoke all on function public.njhr_session_check(text) from public;
revoke all on function public.njhr_logout(text) from public;
grant execute on function public.njhr_login(text,text,text),
                       public.njhr_session_check(text),
                       public.njhr_logout(text) to anon, authenticated;

-- ─── 6) รายงานสถานะรหัสผ่าน (ดูความคืบหน้าการ rehash) ──────────
select count(*) filter (where password_hash like '$2%')                      as "เป็น bcrypt แล้ว",
       count(*) filter (where password is not null and password <> '')       as "ยังเป็น plaintext",
       count(*)                                                              as "ทั้งหมด (salary)"
from public.app_users where app_code = 'salary';

-- ─── 7) ROLLBACK ────────────────────────────────────────────
-- update public.app_users a set password = b.password, password_hash = b.password_hash
--   from njhr_appusers_backup_pw_20260727 b where a.id = b.id;
-- drop function if exists public.njhr_session_check(text), public.njhr_logout(text),
--   public.njhr_token_role(text), public.njhr_token_employee(text);
-- drop table if exists public.njhr_sessions;
