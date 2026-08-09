-- ============================================================
-- NJ HR V.10 — 78_system_settings.sql
-- C) ตั้งค่าระบบ — 3 RPC บนตาราง system_settings ที่มีอยู่จริง
--
-- ยืนยันแล้วว่าตารางมีจริงและมีคอลัมน์ key / value
--   หลักฐาน: 51_core_schema.sql บรรทัด 238
--   select value from public.system_settings where key='payroll_state'
--   → ห้ามเปลี่ยนชื่อคอลัมน์เป็น setting_key / setting_value เพราะจะทำให้ของเดิมพัง
--   จึงคงชื่อเดิม key/value ไว้ แล้วเติมเฉพาะคอลัมน์เสริมที่ยังไม่มี
--
-- Geofence: ยังใช้ njhr_geofences + njhr_gf_* เดิมเท่านั้น
--   ไฟล์นี้บล็อกไม่ให้บันทึก key ที่ขึ้นต้น geofence ลง system_settings (กันเก็บพิกัดซ้ำ)
--
-- ต้องรัน 41 · 42 · 51 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare cols text; kcol text; vcol text;
begin
  if to_regclass('public.system_settings') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง system_settings — หยุดเพื่อไม่ให้สร้างซ้ำ ส่งผล 75_inspect_legacy_gap.sql กลับมาก่อน';
  end if;
  select string_agg(column_name, ', ' order by ordinal_position) into cols
    from information_schema.columns
   where table_schema='public' and table_name='system_settings';

  select column_name into kcol from information_schema.columns
   where table_schema='public' and table_name='system_settings' and column_name='key';
  select column_name into vcol from information_schema.columns
   where table_schema='public' and table_name='system_settings' and column_name='value';

  if kcol is null or vcol is null then
    raise exception 'PREFLIGHT: system_settings ไม่มีคอลัมน์ key/value ตามที่โค้ดเดิมใช้ · คอลัมน์จริงคือ [%]', cols;
  end if;
  raise notice 'PREFLIGHT ผ่าน · system_settings คอลัมน์จริง [%] · % แถว', cols,
    (select count(*) from public.system_settings);
end $$;


-- ─── 1) คอลัมน์เสริม (additive เท่านั้น ไม่แตะ key/value เดิม) ─
alter table public.system_settings add column if not exists category   text;
alter table public.system_settings add column if not exists is_public  boolean not null default false;
alter table public.system_settings add column if not exists updated_by text;
alter table public.system_settings add column if not exists updated_at timestamptz default now();

alter table public.system_settings enable row level security;
create index if not exists njhr_setting_cat_idx on public.system_settings (category, key);

-- ปิด policy ที่เปิดให้ anon ทั้งตาราง (ถ้ามี) — เข้าถึงผ่าน RPC เท่านั้น
do $$
declare pn text;
begin
  for pn in select policyname from pg_policies
             where schemaname='public' and tablename='system_settings'
               and 'anon' = any(roles) and (qual = 'true' or qual is null)
  loop
    execute format('drop policy %I on public.system_settings', pn);
    raise notice 'ลบ policy ที่เปิดให้ anon ทั้งตาราง: %', pn;
  end loop;
end $$;


-- ─── 2) ทะเบียน key ที่ระบบ HR รู้จัก (ไม่ทับค่าที่มีอยู่แล้ว) ─
--  ใส่เฉพาะ key ที่ยังไม่มี · ค่าเดิมทุก key รวมถึง payroll_state ไม่ถูกแตะ
insert into public.system_settings(key, value, category, is_public, updated_at)
select v.k, v.val::jsonb, v.cat, v.pub, now()
  from (values
    ('company_name',       '"N.J. LOGISTICS & FRUITS CO., LTD."', 'company',    true),
    ('company_address',    '""',                                  'company',    true),
    ('company_phone',      '""',                                  'company',    true),
    ('company_tax_id',     '""',                                  'company',    false),
    ('work_start_time',    '"08:00"',                             'attendance', true),
    ('work_end_time',      '"17:00"',                             'attendance', true),
    ('late_grace_minutes', '0',                                   'attendance', true),
    ('attendance_mode',    '"GEOFENCE"',                          'attendance', true),
    ('payslip_footer',     '""',                                  'payroll',    false)
  ) as v(k, val, cat, pub)
 where not exists (select 1 from public.system_settings s where s.key = v.k);

-- เติม category ให้ key เดิมที่ยังว่าง โดยไม่แตะ value
update public.system_settings set category = 'system'
 where category is null;


-- ─── 3) ตัวตรวจสิทธิ์ ───────────────────────────────────────
create or replace function public.njhr_setting_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, is_manager boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if p_write and c.role not in ('SUPER_ADMIN','ADMIN') then
    raise exception 'เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขการตั้งค่าระบบได้' using errcode = '42501';
  end if;
  return query select c.app_user_id, c.username, c.role,
                      (c.role in ('SUPER_ADMIN','ADMIN'));
end $$;


-- ─── 4) njhr_setting_list ───────────────────────────────────
--  ผู้ใช้ทั่วไปเห็นเฉพาะ is_public · ผู้ดูแลเห็นทั้งหมด
create or replace function public.njhr_setting_list(
  p_token text, p_category text default null)
returns table (key text, value jsonb, category text, is_public boolean,
               updated_by text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; cat text := nullif(btrim(lower(coalesce(p_category,''))),'');
begin
  select * into c from public.njhr_setting_guard(p_token, false);
  return query
  select s.key, s.value, coalesce(s.category,'system'), coalesce(s.is_public,false),
         coalesce(s.updated_by,''), s.updated_at
    from public.system_settings s
   where (c.is_manager or coalesce(s.is_public,false))
     and (cat is null or lower(coalesce(s.category,'system')) = cat)
     and s.key not ilike 'geofence%'          -- พิกัดอยู่ที่ njhr_geofences เท่านั้น
   order by coalesce(s.category,'system'), s.key;
end $$;


-- ─── 5) njhr_setting_get ────────────────────────────────────
create or replace function public.njhr_setting_get(p_token text, p_key text)
returns table (key text, value jsonb, category text, is_public boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; k text := btrim(coalesce(p_key,''));
begin
  select * into c from public.njhr_setting_guard(p_token, false);
  if k = '' then raise exception 'กรุณาระบุ key' using errcode='22023'; end if;

  return query
  select s.key, s.value, coalesce(s.category,'system'), coalesce(s.is_public,false)
    from public.system_settings s
   where s.key = k
     and (c.is_manager or coalesce(s.is_public,false))
     and s.key not ilike 'geofence%';
end $$;


-- ─── 6) njhr_setting_save ───────────────────────────────────
create or replace function public.njhr_setting_save(
  p_token text, p_key text, p_value jsonb,
  p_category text default null, p_is_public boolean default null)
returns table (key text, value jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; k text := btrim(coalesce(p_key,''));
begin
  select * into c from public.njhr_setting_guard(p_token, true);

  if k = '' then raise exception 'กรุณาระบุ key' using errcode='22023'; end if;
  if p_value is null then raise exception 'กรุณาระบุค่าที่ต้องการบันทึก' using errcode='22023'; end if;
  if k ilike 'geofence%' then
    raise exception 'พิกัดพื้นที่ลงเวลาต้องบันทึกที่ njhr_geofences ผ่าน njhr_gf_save เท่านั้น'
      using errcode='42501';
  end if;
  -- ค่าที่โมดูลอื่นเป็นเจ้าของ ห้ามแก้ผ่านหน้าตั้งค่าระบบ
  if k = 'payroll_state' then
    raise exception 'payroll_state ถูกจัดการโดยโมดูลเงินเดือน แก้ที่นี่ไม่ได้' using errcode='42501';
  end if;

  select * into old from public.system_settings s where s.key = k;

  insert into public.system_settings(key, value, category, is_public, updated_by, updated_at)
  values (k, p_value, coalesce(nullif(btrim(coalesce(p_category,'')),''), 'system'),
          coalesce(p_is_public, false), c.username, now())
  on conflict (key) do update
    set value = excluded.value,
        category = coalesce(nullif(btrim(coalesce(p_category,'')),''), system_settings.category),
        is_public = coalesce(p_is_public, system_settings.is_public),
        updated_by = c.username, updated_at = now();

  perform public.njhr_audit_write(p_token, 'SETTING_SAVE', 'settings', 'system_settings',
    k, k || ' = ' || left(p_value::text, 200),
    case when old is null then null else to_jsonb(old) end,
    (select to_jsonb(x) from public.system_settings x where x.key = k), null);

  return query select s.key, s.value from public.system_settings s where s.key = k;
end $$;


-- ─── 7) GRANT ───────────────────────────────────────────────
revoke execute on function public.njhr_setting_guard(text, boolean) from public, anon, authenticated;
grant  execute on function public.njhr_setting_list(text,text)                  to anon, authenticated;
grant  execute on function public.njhr_setting_get(text,text)                   to anon, authenticated;
grant  execute on function public.njhr_setting_save(text,text,jsonb,text,boolean) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.2-system-settings', 'ตั้งค่าระบบ: 3 RPC บน system_settings เดิม (key/value) + กัน Geofence ซ้ำ')
on conflict (version) do nothing;


-- ─── 8) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'columns', (select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='system_settings'),
  'keys', (select jsonb_agg(jsonb_build_object('key', s.key, 'category', s.category,
             'public', s.is_public) order by s.key) from public.system_settings s),
  'payroll_state_untouched', (select value from public.system_settings where key='payroll_state'),
  'geofence_keys_leftover', (select count(*) from public.system_settings where key ilike 'geofence%'),
  'functions', (select jsonb_agg(p.proname order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_setting\_%')
)) as install_report;
