-- ============================================================
-- NJ HR V.10 — 62_users_filters.sql
-- หน้า "จัดการสมาชิก": เพิ่มตัวกรอง สิทธิ์ / สถานะบัญชี / แผนก ให้กรองฝั่งเซิร์ฟเวอร์
--
-- แก้เฉพาะ njhr_list_users เท่านั้น (เจ้าของเดิมคือ 52_users.sql)
-- ไม่แตะ: ระบบ Login · njhr_login · njhr_sessions · app_users (โครงสร้าง) · employees · Permission เดิม
-- ข้อมูลพนักงานยัง JOIN สดจาก employees ทุกครั้ง ไม่เก็บสำเนาซ้ำ
-- ต้องรัน 52_users.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_user_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_user_guard — รัน 52_users.sql ก่อน';
  end if;
  if to_regclass('public.app_users') is null then raise exception 'PREFLIGHT: ไม่พบตาราง app_users'; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

insert into public.njhr_schema_version(version, note)
values ('v11.7-users-filter', 'จัดการสมาชิก: ตัวกรองสิทธิ์/สถานะ/แผนก ฝั่งเซิร์ฟเวอร์')
on conflict (version) do nothing;


-- ─── 1) รายชื่อผู้ใช้ + ตัวกรอง ──────────────────────────────
-- เพิ่มพารามิเตอร์ จึงต้อง DROP ของเดิมก่อน (ชนิดผลลัพธ์เท่าเดิม ไม่กระทบผู้เรียกอื่น)
drop function if exists public.njhr_list_users(text, text, int, int);
drop function if exists public.njhr_list_users(text, text, text, text, text, int, int);

create or replace function public.njhr_list_users(
  p_token text, p_q text default null,
  p_role text default null, p_status text default null, p_dept text default null,
  p_limit int default 50, p_offset int default 0)
returns table (
  user_id uuid, username text, internal_username text, email text, department text,
  role text, status text, is_active boolean, employee_id uuid,
  emp_code text, emp_name text, emp_department text, emp_position text, emp_status text,
  mapping_status text, created_at timestamptz, updated_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
        st text := upper(btrim(coalesce(p_status,'')));
begin
  perform public.njhr_user_guard(p_token, false);
  if st <> '' and st not in ('ACTIVE','INACTIVE','LINKED','UNLINKED') then
    raise exception 'ตัวกรองสถานะไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;
  return query
  with base as (
    -- ข้อมูลพนักงานอ่านจาก employees สดทุกครั้ง แก้ที่หน้าพนักงานแล้วหน้านี้เปลี่ยนตาม
    select u.id uid, u.username un, u.internal_username iu, u.email em, u.department ud,
           u.role::text rl, coalesce(u.status,'active') stt, coalesce(u.is_active,true) act,
           u.employee_id eid, e.emp_code ec,
           nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),'') enm,
           e.department_name edept, e.position_name epos, e.status::text estat,
           u.created_at ca, u.updated_at ua
      from public.app_users u
      left join public.employees e on e.id = u.employee_id
     where u.app_code = 'salary'
       and (p_role is null or p_role = '' or public.njhr_norm_role(u.role::text) = upper(p_role))
       and (st = '' or (st = 'ACTIVE'   and coalesce(u.is_active,true))
                    or (st = 'INACTIVE' and not coalesce(u.is_active,true))
                    or (st = 'LINKED'   and u.employee_id is not null)
                    or (st = 'UNLINKED' and u.employee_id is null))
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (q = '' or lower(u.username) like '%'||q||'%'
            or lower(coalesce(u.internal_username,'')) like '%'||q||'%'
            or lower(coalesce(u.email,'')) like '%'||q||'%'
            or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.department_name,'')) like '%'||q||'%'))
  select b.uid, b.un, b.iu, b.em, b.ud, b.rl, b.stt, b.act, b.eid,
         b.ec, b.enm, b.edept, b.epos, b.estat,
         case when b.eid is null then 'ยังไม่เชื่อมพนักงาน'
              when b.ec is null then 'ข้อมูลเชื่อมโยงไม่ถูกต้อง'
              else 'เชื่อมแล้ว' end,
         b.ca, b.ua, (select count(*) from base)
    from base b order by b.un
   limit least(greatest(coalesce(p_limit,50),1),200) offset greatest(coalesce(p_offset,0),0);
end $$;

grant execute on function public.njhr_list_users(text,text,text,text,text,int,int) to anon, authenticated;


-- ─── 2) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'signature', (select pg_get_function_arguments(p.oid) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='njhr_list_users'),
  'overloads', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname='njhr_list_users'),
  'users_total', (select count(*) from public.app_users where app_code='salary'),
  'users_linked', (select count(*) from public.app_users where app_code='salary' and employee_id is not null),
  'login_untouched', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                             where n.nspname='public' and p.proname='njhr_login')
)) as install_report;


-- ─── 3) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_list_users(text,text,text,text,text,int,int);
-- แล้วรัน 52_users.sql ใหม่เพื่อคืน njhr_list_users รุ่นเดิม
-- delete from public.njhr_schema_version where version='v11.7-users-filter';
