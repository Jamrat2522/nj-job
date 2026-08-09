-- ============================================================
-- NJ HR V.10 — 52_users.sql
-- จัดการผู้ใช้: อ่าน/เพิ่ม/แก้ไข USER จริงจาก public.app_users
-- เชื่อมพนักงานด้วย app_users.employee_id = employees.id
--
-- กติกาที่บังคับฝั่งฐานข้อมูล:
--   · พนักงาน 1 คน เชื่อม USER ได้เพียง 1 บัญชี (unique index)
--   · รหัสพนักงาน / ชื่อ / แผนก / ตำแหน่ง / สถานะ อ่านจาก employees เสมอ (JOIN สด)
--     → แก้ข้อมูลพนักงานแล้วหน้าจัดการผู้ใช้เปลี่ยนตามทันที ไม่มีการ copy ค่ามาเก็บ
--   · รหัสผ่านเก็บเป็น bcrypt เท่านั้น (extensions.crypt + gen_salt('bf'))
--     ไม่มีการส่ง hash หรือรหัสผ่านกลับมาที่เบราว์เซอร์
--
-- ต้องรัน 30_login_rpc.sql · 33_users_rpc.sql · 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.app_users') is null then raise exception 'PREFLIGHT: ไม่พบตาราง app_users'; end if;
  if to_regclass('public.employees') is null then raise exception 'PREFLIGHT: ไม่พบตาราง employees'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_token_role') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_token_role — รัน 30_login_rpc.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='app_users'
     and column_name in ('id','username','password_hash','role','app_code','employee_id','is_active','status');
  if n <> 8 then raise exception 'PREFLIGHT: app_users ขาดคอลัมน์ที่ต้องใช้ (พบ % จาก 8)', n; end if;
  -- ต้องมี pgcrypto สำหรับ bcrypt
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where p.proname='gen_salt') then
    raise exception 'PREFLIGHT: ไม่พบ gen_salt — ต้องเปิด extension pgcrypto ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create table if not exists njhr_bk_app_users_20260802 as
  select id, username, role, employee_id, is_active, status, now() as backed_up_at
    from public.app_users where app_code = 'salary';


-- ─── 1) พนักงาน 1 คน = 1 USER (บังคับที่ฐานข้อมูล) ───────────
do $$
declare dup int;
begin
  select count(*) into dup from (
    select employee_id from public.app_users
     where app_code = 'salary' and employee_id is not null
     group by employee_id having count(*) > 1) x;
  if dup > 0 then
    raise notice 'ข้ามการสร้าง unique index: มีพนักงาน % คนที่ผูกกับ USER มากกว่า 1 บัญชี', dup;
    raise notice 'ตรวจด้วย: select employee_id, count(*) from app_users where app_code=''salary'' and employee_id is not null group by 1 having count(*)>1;';
  else
    create unique index if not exists njhr_appusers_emp_uidx
      on public.app_users (employee_id)
      where app_code = 'salary' and employee_id is not null;
    raise notice 'สร้าง unique index สำเร็จ: พนักงาน 1 คนผูกได้ 1 บัญชี';
  end if;
end $$;
create index if not exists njhr_appusers_salary_idx on public.app_users (app_code, username);

insert into public.njhr_schema_version(version, note)
values ('v11.1-users', 'จัดการผู้ใช้: เชื่อม app_users.employee_id = employees.id')
on conflict (version) do nothing;


-- ─── 2) ตัวช่วยสิทธิ์ ────────────────────────────────────────
create or replace function public.njhr_user_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write then
    if c.role not in ('SUPER_ADMIN','ADMIN') then
      raise exception 'คุณไม่มีสิทธิ์เพิ่มหรือแก้ไขผู้ใช้งาน' using errcode='42501';
    end if;
  else
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์ดูรายชื่อผู้ใช้งาน' using errcode='42501';
    end if;
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id;
end $$;


-- ─── 3) รายชื่อผู้ใช้ (JOIN employees สด ทุกครั้ง) ───────────
-- เปลี่ยนชนิดผลลัพธ์ จึงต้อง DROP ของเดิมก่อน
drop function if exists public.njhr_list_users(text, text, int, int);

create or replace function public.njhr_list_users(
  p_token text, p_q text default null, p_limit int default 50, p_offset int default 0)
returns table (
  user_id uuid, username text, internal_username text, email text, department text,
  role text, status text, is_active boolean, employee_id uuid,
  emp_code text, emp_name text, emp_department text, emp_position text, emp_status text,
  mapping_status text, created_at timestamptz, updated_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_user_guard(p_token, false);
  return query
  with base as (
    -- ข้อมูลพนักงานอ่านจาก employees โดยตรงเสมอ ไม่เก็บซ้ำใน app_users
    select u.id uid, u.username un, u.internal_username iu, u.email em, u.department ud,
           u.role::text rl, coalesce(u.status,'active') st, coalesce(u.is_active,true) act,
           u.employee_id eid, e.emp_code ec,
           nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),'') enm,
           e.department_name edept, e.position_name epos, e.status::text estat,
           u.created_at ca, u.updated_at ua
      from public.app_users u
      left join public.employees e on e.id = u.employee_id
     where u.app_code = 'salary'
       and (q = '' or lower(u.username) like '%'||q||'%'
            or lower(coalesce(u.internal_username,'')) like '%'||q||'%'
            or lower(coalesce(u.email,'')) like '%'||q||'%'
            or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.department_name,'')) like '%'||q||'%'))
  select b.uid, b.un, b.iu, b.em, b.ud, b.rl, b.st, b.act, b.eid,
         b.ec, b.enm, b.edept, b.epos, b.estat,
         case when b.eid is null then 'ยังไม่เชื่อมพนักงาน'
              when b.ec is null then 'เชื่อมกับพนักงานที่ถูกลบแล้ว'
              when b.estat <> 'ACTIVE' then 'เชื่อมแล้ว (พนักงาน' ||
                   case b.estat when 'RESIGNED' then 'พ้นสภาพ' when 'SUSPENDED' then 'พักงาน'
                                when 'PROBATION' then 'ทดลองงาน' else b.estat end || ')'
              else 'เชื่อมแล้ว' end,
         b.ca, b.ua, (select count(*) from base)
    from base b order by b.un
   limit least(greatest(coalesce(p_limit,50),1),200) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 4) พนักงานที่ยังไม่มี USER (ใช้เติมช่องเชื่อมพนักงาน) ───
create or replace function public.njhr_user_candidates(
  p_token text, p_q text default null, p_current uuid default null, p_limit int default 20)
returns table (employee_id uuid, emp_code text, emp_name text, department text, position_name text, status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_user_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),
         coalesce(e.department_name,''), coalesce(e.position_name,''), e.status::text
    from public.employees e
   where e.status::text = 'ACTIVE'
     -- ยังไม่ถูกผูกกับ USER อื่น (ยกเว้นคนที่ผูกกับบัญชีที่กำลังแก้อยู่)
     and (not exists (select 1 from public.app_users u
                       where u.app_code = 'salary' and u.employee_id = e.id)
          or (p_current is not null and e.id = p_current))
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%'
          or lower(coalesce(e.position_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit least(greatest(coalesce(p_limit,20),1),50);
end $$;


-- ─── 5) เพิ่ม / แก้ไข USER ───────────────────────────────────
-- p_password: ส่งมาเฉพาะตอนตั้งรหัสใหม่ · null = ไม่เปลี่ยนรหัสเดิม
create or replace function public.njhr_user_save(
  p_token text, p_user_id uuid, p_username text, p_role text,
  p_employee uuid default null, p_email text default null,
  p_password text default null, p_is_active boolean default null)
returns table (user_id uuid, username text, role text, employee_id uuid)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; v_un text := lower(btrim(coalesce(p_username,'')));
        v_role text := upper(btrim(coalesce(p_role,''))); v_id uuid; oldrow jsonb; v_emp record;
begin
  select * into c from public.njhr_user_guard(p_token, true);

  -- ---- ตรวจข้อมูลบังคับ
  if v_un = '' then raise exception 'กรุณาระบุชื่อผู้ใช้' using errcode='22023'; end if;
  if v_un !~ '^[a-z0-9._-]{3,50}$' then
    raise exception 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–50 ตัว' using errcode='22023';
  end if;
  if not exists (select 1 from unnest(enum_range(null::public.user_role)) x where x::text = v_role) then
    raise exception 'สิทธิ์ผู้ใช้ไม่ถูกต้อง (%)', p_role using errcode='22023';
  end if;
  -- ADMIN ตั้ง SUPER_ADMIN ไม่ได้
  if v_role = 'SUPER_ADMIN' and c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะ SUPER_ADMIN เท่านั้นที่กำหนดสิทธิ์ SUPER_ADMIN ได้' using errcode='42501';
  end if;
  if p_email is not null and btrim(p_email) <> ''
     and btrim(p_email) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'รูปแบบอีเมลไม่ถูกต้อง' using errcode='22023';
  end if;
  if p_password is not null and length(p_password) < 8 then
    raise exception 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' using errcode='22023';
  end if;
  if p_user_id is null and coalesce(p_password,'') = '' then
    raise exception 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่' using errcode='22023';
  end if;

  -- ---- ชื่อผู้ใช้ห้ามซ้ำ (ภายใน app_code เดียวกัน)
  if exists (select 1 from public.app_users u
              where u.app_code = 'salary' and lower(u.username) = v_un
                and (p_user_id is null or u.id <> p_user_id)) then
    raise exception 'ชื่อผู้ใช้ % ถูกใช้ไปแล้ว', v_un using errcode='23505';
  end if;

  -- ---- พนักงาน 1 คน = 1 บัญชี
  if p_employee is not null then
    select * into v_emp from public.employees where id = p_employee;
    if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
    if exists (select 1 from public.app_users u
                where u.app_code = 'salary' and u.employee_id = p_employee
                  and (p_user_id is null or u.id <> p_user_id)) then
      raise exception 'พนักงาน % ถูกเชื่อมกับบัญชีผู้ใช้อื่นอยู่แล้ว', v_emp.emp_code using errcode='23505';
    end if;
  end if;

  -- ---- ห้ามปิดบัญชีตัวเอง / ลดสิทธิ์ตัวเอง
  if p_user_id is not null and p_user_id = c.app_user_id then
    if coalesce(p_is_active, true) = false then
      raise exception 'ปิดใช้งานบัญชีของตนเองไม่ได้' using errcode='42501';
    end if;
    if v_role <> c.role then
      raise exception 'เปลี่ยนสิทธิ์ของบัญชีตนเองไม่ได้' using errcode='42501';
    end if;
  end if;

  if p_user_id is null then
    insert into public.app_users (app_code, username, password_hash, role, employee_id,
                                  email, is_active, status, created_at, updated_at)
    values ('salary', v_un, crypt(p_password, gen_salt('bf')),
            v_role::public.user_role, p_employee,
            nullif(btrim(coalesce(p_email,'')),''), coalesce(p_is_active,true),
            case when coalesce(p_is_active,true) then 'active' else 'inactive' end, now(), now())
    returning app_users.id into v_id;
  else
    select to_jsonb(u) - 'password' - 'password_hash' into oldrow
      from public.app_users u where u.id = p_user_id and u.app_code = 'salary';
    if oldrow is null then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002'; end if;
    update public.app_users set
      username      = v_un,
      role          = v_role::public.user_role,
      employee_id   = p_employee,
      email         = case when p_email is null then email else nullif(btrim(p_email),'') end,
      is_active     = coalesce(p_is_active, is_active),
      status        = case when coalesce(p_is_active, is_active) then 'active' else 'inactive' end,
      -- เปลี่ยนรหัสเฉพาะเมื่อส่งมา · เก็บเป็น bcrypt เท่านั้น
      password_hash = case when p_password is null or p_password = '' then password_hash
                           else crypt(p_password, gen_salt('bf')) end,
      -- ล้างรหัสผ่านแบบข้อความธรรมดาทิ้งเมื่อมีการตั้งรหัสใหม่
      password      = case when p_password is null or p_password = '' then password else null end,
      updated_at    = now()
     where app_users.id = p_user_id;
    v_id := p_user_id;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role,
         case when p_user_id is null then 'USER_ADD' else 'USER_EDIT' end,
         'user', 'app_users', v_id::text,
         'ผู้ใช้ ' || v_un || ' · สิทธิ์ ' || v_role ||
         case when p_password is not null and p_password <> '' then ' · ตั้งรหัสผ่านใหม่' else '' end,
         oldrow, (select to_jsonb(u) - 'password' - 'password_hash' from public.app_users u where u.id = v_id);

  return query select u.id, u.username, u.role::text, u.employee_id
                 from public.app_users u where u.id = v_id;
end $$;


-- ─── 6) เชื่อม / ยกเลิกการเชื่อมพนักงาน ──────────────────────
create or replace function public.njhr_user_link(
  p_token text, p_user_id uuid, p_employee uuid default null)
returns table (user_id uuid, employee_id uuid, emp_code text, emp_name text)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; v_emp record; v_msg text;
begin
  select * into c from public.njhr_user_guard(p_token, true);
  if not exists (select 1 from public.app_users u where u.id = p_user_id and u.app_code = 'salary') then
    raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002';
  end if;
  if p_employee is not null then
    select * into v_emp from public.employees where id = p_employee;
    if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
    if v_emp.status::text <> 'ACTIVE' then
      raise exception 'พนักงาน % ไม่ได้อยู่ในสถานะปฏิบัติงาน', v_emp.emp_code using errcode='22023';
    end if;
    if exists (select 1 from public.app_users u
                where u.app_code = 'salary' and u.employee_id = p_employee and u.id <> p_user_id) then
      raise exception 'พนักงาน % ถูกเชื่อมกับบัญชีผู้ใช้อื่นอยู่แล้ว', v_emp.emp_code using errcode='23505';
    end if;
  end if;
  update public.app_users set employee_id = p_employee, updated_at = now()
   where app_users.id = p_user_id;
  -- สร้างข้อความก่อน: อ้าง v_emp ตอน p_employee เป็น null ไม่ได้ (record ยังไม่ถูกกำหนดค่า)
  if p_employee is null then v_msg := 'ยกเลิกการเชื่อมพนักงาน';
  else v_msg := 'เชื่อมกับพนักงาน ' || v_emp.emp_code; end if;
  perform public.njhr_audit_write(p_token,
    case when p_employee is null then 'USER_UNLINK' else 'USER_LINK' end,
    'user', 'app_users', p_user_id::text, v_msg, null, null, null);
  return query
  select u.id, u.employee_id, e.emp_code,
         btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,''))
    from public.app_users u left join public.employees e on e.id = u.employee_id
   where u.id = p_user_id;
end $$;


-- ─── 7) ตั้งรหัสผ่านใหม่ ─────────────────────────────────────
create or replace function public.njhr_user_password(p_token text, p_user_id uuid, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; v_un text;
begin
  select * into c from public.njhr_user_guard(p_token, true);
  if coalesce(p_password,'') = '' or length(p_password) < 8 then
    raise exception 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' using errcode='22023';
  end if;
  select u.username into v_un from public.app_users u
   where u.id = p_user_id and u.app_code = 'salary';
  if v_un is null then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002'; end if;
  update public.app_users
     set password_hash = crypt(p_password, gen_salt('bf')),
         password = null, updated_at = now()
   where app_users.id = p_user_id;
  -- ยกเลิกเซสชันเดิมทั้งหมดของบัญชีนั้น
  update public.njhr_sessions set revoked = true where app_user_id = p_user_id and not revoked;
  perform public.njhr_audit_write(p_token, 'USER_PASSWORD', 'user', 'app_users', p_user_id::text,
    'ตั้งรหัสผ่านใหม่ให้ ' || v_un || ' และยกเลิกเซสชันเดิม', null, null, null);
  return true;
end $$;


-- ─── 8) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_user_guard(text, boolean) from public, anon, authenticated;

grant execute on function public.njhr_list_users(text,text,int,int)                to anon, authenticated;
grant execute on function public.njhr_user_candidates(text,text,uuid,int)          to anon, authenticated;
grant execute on function public.njhr_user_save(text,uuid,text,text,uuid,text,text,boolean) to anon, authenticated;
grant execute on function public.njhr_user_link(text,uuid,uuid)                    to anon, authenticated;
grant execute on function public.njhr_user_password(text,uuid,text)                to anon, authenticated;


-- ─── 9) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'unique_employee_index', exists(select 1 from pg_indexes
     where schemaname='public' and indexname='njhr_appusers_emp_uidx'),
  'duplicate_employee_links', (select count(*) from (
     select employee_id from public.app_users
      where app_code='salary' and employee_id is not null
      group by employee_id having count(*)>1) x),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_user\_%' or p.proname='njhr_list_users'),
  'users_total', (select count(*) from public.app_users where app_code='salary'),
  'users_linked', (select count(*) from public.app_users where app_code='salary' and employee_id is not null),
  'users_plaintext_password', (select count(*) from public.app_users
     where app_code='salary' and password is not null and password <> ''),
  'employees_total', (select count(*) from public.employees),
  'employees_without_user', (select count(*) from public.employees e
     where e.status::text='ACTIVE'
       and not exists (select 1 from public.app_users u where u.app_code='salary' and u.employee_id=e.id))
)) as install_report;


-- ─── 10) ROLLBACK ────────────────────────────────────────────
-- drop function if exists public.njhr_user_password(text,uuid,text);
-- drop function if exists public.njhr_user_link(text,uuid,uuid);
-- drop function if exists public.njhr_user_save(text,uuid,text,text,uuid,text,text,boolean);
-- drop function if exists public.njhr_user_candidates(text,text,uuid,int);
-- drop function if exists public.njhr_user_guard(text,boolean);
-- drop index if exists public.njhr_appusers_emp_uidx;
-- แล้วรัน 33_users_rpc.sql ใหม่เพื่อคืน njhr_list_users รุ่นเดิม
-- คืนข้อมูล role/employee_id: njhr_bk_app_users_20260802
