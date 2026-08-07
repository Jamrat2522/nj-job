-- ============================================================
-- SHIPPING FZ · 030_user_admin_rpc.sql
-- ============================================================
-- RPC สำหรับ "เพิ่ม / แก้ไขผู้ใช้" จากหน้า จัดการผู้ใช้งาน ของ SHIPPING FZ
--
-- ทำไมต้องเป็น RPC ไม่ INSERT ตรงจาก Browser:
--   · ตรวจสิทธิ์ SUPER_ADMIN ที่ฝั่งฐานข้อมูล ไม่ใช่แค่ซ่อนปุ่ม
--   · ตรวจ username ซ้ำ / role / status ที่ฝั่งฐานข้อมูล
--   · คืน error code ที่ระบุสาเหตุจริงกลับไปแสดงบนหน้าจอ
--
-- ⛔ ไม่ DROP / ไม่ TRUNCATE / ไม่ DELETE บัญชีเดิม
-- ⛔ ไม่แก้ RLS / policy / grant ของตาราง users เดิม (ระบบอื่นใช้ร่วมกันอยู่)
-- ⛔ ไม่แตะ sa_documents (SHIPPING AIR) · sfz_* · ระบบ HR
-- ✅ รันซ้ำได้ (CREATE OR REPLACE)
--
-- โครงสร้างที่ใช้ อ้างอิงจาก Source จริงของระบบ (ไฟล์ SHIPPING AIR ต้นฉบับ บรรทัด 4006-4040):
--   table  : public.users
--   columns: app_code, username, full_name, display_user, department, role,
--            status, password_display, avatar_color, terminals
--   roles  : STAFF · MESSENGER · SHIPPING · ADMIN · SUPER_ADMIN   (USER_ROLES)
--   app_code ที่ใช้ = 'massenger' (LOGIN_APP_CODE ของ SHIPPING FZ — บัญชีกลางร่วมกับ MASSENGER)
--
-- หมายเหตุ: คอลัมน์ที่ไม่มีจริงในตาราง จะถูกข้ามอัตโนมัติ (เช่น terminals ในบาง environment)
-- ============================================================

-- ------------------------------------------------------------
-- helper: ตรวจว่าผู้กดเป็น SUPER_ADMIN จริง
-- ------------------------------------------------------------
create or replace function public.sfz_is_super_admin(p_actor_id text, p_app_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id::text = p_actor_id
      and u.app_code = p_app_code
      and upper(coalesce(u.role,'')) = 'SUPER_ADMIN'
  );
$$;

-- ------------------------------------------------------------
-- เพิ่มผู้ใช้ใหม่
-- ------------------------------------------------------------
create or replace function public.sfz_admin_create_user(
  p_actor_id    text,
  p_app_code    text,
  p_username    text,
  p_password    text,
  p_full_name   text,
  p_department  text default null,
  p_role        text default 'STAFF',
  p_status      text default 'active',
  p_terminals   text default null,
  p_avatar      text default '#0EA672'
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_data jsonb;
  v_cols text;
  v_vals text;
  v_id   text;
begin
  if not public.sfz_is_super_admin(p_actor_id, p_app_code) then
    raise exception 'permission_denied' using hint = 'เฉพาะ SUPER ADMIN เท่านั้นที่เพิ่มผู้ใช้ได้';
  end if;

  if coalesce(btrim(p_full_name),'') = '' then raise exception 'missing_required_field:full_name'; end if;
  if coalesce(btrim(p_username),'')  = '' then raise exception 'missing_required_field:username';  end if;
  if coalesce(p_password,'')         = '' then raise exception 'missing_required_field:password';  end if;

  if upper(p_role) not in ('STAFF','MESSENGER','SHIPPING','ADMIN','SUPER_ADMIN') then
    raise exception 'invalid_role:%', p_role;
  end if;
  if lower(p_status) not in ('active','pending','inactive','suspended') then
    raise exception 'invalid_status:%', p_status;
  end if;

  if exists (select 1 from public.users u
             where u.app_code = p_app_code
               and lower(btrim(u.username)) = lower(btrim(p_username))) then
    raise exception 'username_already_exists:%', p_username;
  end if;

  v_data := jsonb_build_object(
    'app_code',         p_app_code,
    'username',         btrim(p_username),
    'full_name',        btrim(p_full_name),
    'display_user',     btrim(p_full_name),
    'department',       p_department,
    'role',             upper(p_role),
    'status',           lower(p_status),
    'password_display', p_password,
    'avatar_color',     p_avatar,
    'terminals',        p_terminals
  );

  -- ใส่เฉพาะคอลัมน์ที่มีอยู่จริงในตาราง users (กันกรณี environment ไม่มี terminals/avatar_color)
  select string_agg(quote_ident(t.k), ',' order by t.k),
         string_agg(quote_nullable(t.v), ',' order by t.k)
    into v_cols, v_vals
  from jsonb_each_text(v_data) as t(k,v)
  where exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='users' and c.column_name = t.k
  );

  if v_cols is null then raise exception 'users_table_columns_not_found'; end if;

  execute format('insert into public.users(%s) values(%s) returning id::text', v_cols, v_vals)
    into v_id;

  return json_build_object('ok', true, 'id', v_id, 'username', btrim(p_username));
end;
$$;

comment on function public.sfz_admin_create_user(text,text,text,text,text,text,text,text,text,text)
  is 'SHIPPING FZ — เพิ่มบัญชีผู้ใช้ (ตรวจสิทธิ์ SUPER_ADMIN ที่ฝั่ง DB)';

-- ------------------------------------------------------------
-- แก้ไขผู้ใช้เดิม (ชื่อ / แผนก / role / status / รหัสผ่าน / terminals)
-- ------------------------------------------------------------
create or replace function public.sfz_admin_update_user(
  p_actor_id    text,
  p_app_code    text,
  p_user_id     text,
  p_full_name   text default null,
  p_department  text default null,
  p_role        text default null,
  p_status      text default null,
  p_password    text default null,
  p_terminals   text default null,
  p_set_terminals boolean default false
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_data jsonb := '{}'::jsonb;
  v_set  text;
  v_n    int;
begin
  if not public.sfz_is_super_admin(p_actor_id, p_app_code) then
    raise exception 'permission_denied' using hint = 'เฉพาะ SUPER ADMIN เท่านั้นที่แก้ไขผู้ใช้ได้';
  end if;

  if not exists (select 1 from public.users u where u.id::text = p_user_id and u.app_code = p_app_code) then
    raise exception 'user_not_found:%', p_user_id;
  end if;

  if p_role is not null and upper(p_role) not in ('STAFF','MESSENGER','SHIPPING','ADMIN','SUPER_ADMIN') then
    raise exception 'invalid_role:%', p_role;
  end if;
  if p_status is not null and lower(p_status) not in ('active','pending','inactive','suspended') then
    raise exception 'invalid_status:%', p_status;
  end if;

  if p_full_name  is not null and btrim(p_full_name) <> '' then
    v_data := v_data || jsonb_build_object('full_name', btrim(p_full_name), 'display_user', btrim(p_full_name));
  end if;
  if p_department is not null then v_data := v_data || jsonb_build_object('department', p_department); end if;
  if p_role       is not null then v_data := v_data || jsonb_build_object('role',   upper(p_role));    end if;
  if p_status     is not null then v_data := v_data || jsonb_build_object('status', lower(p_status));  end if;
  if p_password   is not null and p_password <> '' then
    v_data := v_data || jsonb_build_object('password_display', p_password);
  end if;
  if p_set_terminals then v_data := v_data || jsonb_build_object('terminals', p_terminals); end if;

  if v_data = '{}'::jsonb then return json_build_object('ok', true, 'changed', 0); end if;

  select string_agg(format('%I = %L', t.k, t.v), ', ' order by t.k) into v_set
  from jsonb_each_text(v_data) as t(k,v)
  where exists (
    select 1 from information_schema.columns c
    where c.table_schema='public' and c.table_name='users' and c.column_name = t.k
  );

  if v_set is null then return json_build_object('ok', true, 'changed', 0); end if;

  execute format('update public.users set %s where id::text = %L and app_code = %L',
                 v_set, p_user_id, p_app_code);
  get diagnostics v_n = row_count;

  return json_build_object('ok', true, 'changed', v_n);
end;
$$;

comment on function public.sfz_admin_update_user(text,text,text,text,text,text,text,text,text,boolean)
  is 'SHIPPING FZ — แก้ไขบัญชีผู้ใช้ (ตรวจสิทธิ์ SUPER_ADMIN ที่ฝั่ง DB)';

-- ------------------------------------------------------------
-- Grant — ให้เรียก RPC ได้ แต่ไม่ได้เปิดสิทธิ์ INSERT/UPDATE ตาราง users เพิ่ม
-- ------------------------------------------------------------
grant execute on function public.sfz_is_super_admin(text,text) to anon, authenticated;
grant execute on function public.sfz_admin_create_user(text,text,text,text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.sfz_admin_update_user(text,text,text,text,text,text,text,text,text,boolean) to anon, authenticated;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- ตรวจผล
-- ------------------------------------------------------------
select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace='public'::regnamespace
  and proname in ('sfz_is_super_admin','sfz_admin_create_user','sfz_admin_update_user')
order by proname;
