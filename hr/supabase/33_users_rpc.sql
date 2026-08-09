-- ============================================================
-- RPC: หน้า "จัดการสมาชิก" อ่าน USER จริงจาก app_users (app_code='salary')
-- ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์จาก token — ไม่เชื่อ role ที่ browser ส่งมา
-- อ่านอย่างเดียว ไม่แก้ข้อมูลใคร
-- ============================================================
create or replace function public.njhr_list_users(
  p_token text, p_q text default null, p_limit int default 50, p_offset int default 0)
returns table (
  user_id uuid, username text, internal_username text, email text, department text,
  role text, status text, is_active boolean, employee_id uuid,
  emp_code text, emp_name text, emp_department text,
  mapping_status text, created_at timestamptz, updated_at timestamptz, total_count bigint)
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  r := public.njhr_token_role(p_token);          -- role จาก token เท่านั้น
  if r is null then raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode='28000'; end if;
  if upper(r) not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'ไม่มีสิทธิ์ดูรายชื่อผู้ใช้งาน' using errcode='42501';
  end if;

  return query
  with base as (
    select u.id, u.username, u.internal_username, u.email, u.department,
           u.role::text rl, coalesce(u.status,'active') st, coalesce(u.is_active,true) act,
           u.employee_id, e.emp_code,
           (coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           e.department_name edept, u.created_at, u.updated_at
    from public.app_users u
    left join public.employees e on e.id = u.employee_id
    where u.app_code = 'salary'
      and (p_q is null or p_q = '' or
           u.username ilike '%'||p_q||'%' or coalesce(u.internal_username,'') ilike '%'||p_q||'%' or
           coalesce(u.email,'') ilike '%'||p_q||'%' or coalesce(e.emp_code,'') ilike '%'||p_q||'%' or
           coalesce(e.first_name,'')||' '||coalesce(e.last_name,'') ilike '%'||p_q||'%'))
  select b.id, b.username, b.internal_username, b.email, b.department, b.rl, b.st, b.act,
         b.employee_id, b.emp_code, nullif(trim(b.enm),''), b.edept,
         case when b.employee_id is null then 'ยังไม่เชื่อมพนักงาน' else 'เชื่อมแล้ว' end,
         b.created_at, b.updated_at, (select count(*) from base)
  from base b order by b.username limit p_limit offset p_offset;
end $$;

-- สรุปตัวเลขสำหรับหัวหน้า (ใช้ token ตรวจสิทธิ์เช่นกัน)
create or replace function public.njhr_user_stats(p_token text)
returns table (total bigint, mapped bigint, unmapped bigint, disabled bigint, dup_username bigint)
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  r := public.njhr_token_role(p_token);
  if r is null or upper(r) not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'ไม่มีสิทธิ์' using errcode='42501';
  end if;
  return query select
    (select count(*) from public.app_users where app_code='salary'),
    (select count(*) from public.app_users where app_code='salary' and employee_id is not null),
    (select count(*) from public.app_users where app_code='salary' and employee_id is null),
    (select count(*) from public.app_users where app_code='salary'
       and (coalesce(is_active,true)=false or lower(coalesce(status,'active'))<>'active')),
    (select count(*) from (select lower(username) un from public.app_users
        where app_code='salary' group by 1 having count(*)>1) d);
end $$;

revoke all on function public.njhr_list_users(text,text,int,int) from public;
revoke all on function public.njhr_user_stats(text) from public;
grant execute on function public.njhr_list_users(text,text,int,int),
                       public.njhr_user_stats(text) to anon, authenticated;

-- ทดสอบ (ใส่ token ที่ได้จาก njhr_login)
-- select * from public.njhr_user_stats('<token>');
-- select username, role, status, emp_code, emp_name, mapping_status
--   from public.njhr_list_users('<token>', null, 20, 0);

-- ROLLBACK
-- drop function if exists public.njhr_list_users(text,text,int,int), public.njhr_user_stats(text);
