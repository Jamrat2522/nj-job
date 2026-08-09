-- ============================================================
-- NJ HR V.10 — 92_face_attendance.sql
-- ลงเวลาด้วยการสแกนใบหน้า — ชั้นฐานข้อมูล
--
-- ตรวจแล้ว: ไม่มีระบบ Face เดิมในโปรเจกต์นี้ (ค้น face/descriptor/embedding/liveness = 0)
--            ตาราง face_scan_logs ที่มีอยู่เป็นของแอปอื่น (ขึ้นต้น nj_v6) จึงไม่แตะ
--
-- ของเดิมที่ต่อยอด (ไม่สร้างซ้ำ ไม่แก้ตรรกะ)
--   njhr_att_punch(p_token,p_action,p_at,p_lat,p_lng,p_accuracy)
--     → ตรวจ Geofence + เขียน attendance + njhr_att_punch_log  (68_geofence_locations.sql)
--   njhr_att_punch_log : employee_id · work_date · action · punched_at
--                        geofence_id · geofence_name · lat · lng · distance_m · accuracy_m
--   attendance_corrections (79) : ใช้เป็นช่องทาง "ลงเวลาโดยอนุมัติพิเศษ" ไม่ต้องสร้างระบบใหม่
--
-- หลักการสำคัญด้านความปลอดภัย
--   Face Descriptor "ไม่เคยถูกส่งออกไปที่เบราว์เซอร์เลย"
--   เบราว์เซอร์คำนวณ descriptor ของภาพสด แล้วส่งมาให้ฐานข้อมูลเทียบ
--   ฐานข้อมูลคืนเฉพาะคะแนนความเหมือนกับผลผ่าน/ไม่ผ่าน
--   → ตอบข้อ "ห้ามแสดง Face Descriptor ในหน้าเว็บหรือ Console" ได้จริงระดับสถาปัตยกรรม
--
-- ต้องรัน 41 · 42 · 48 · 64 · 68 · 78 · 79 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare miss text; act text;
begin
  if to_regclass('public.njhr_att_punch_log') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_att_punch_log — รัน 68_geofence_locations.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_att_punch') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_att_punch — รัน 68 ก่อน';
  end if;
  if to_regclass('public.attendance_corrections') is null then
    raise exception 'PREFLIGHT: ไม่พบ attendance_corrections — รัน 79_att_corrections.sql ก่อน';
  end if;

  select string_agg(c, ', ') into miss from unnest(array[
    'employee_id','work_date','action','punched_at','geofence_id','lat','lng',
    'distance_m','accuracy_m']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='njhr_att_punch_log'
                        and column_name=c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='njhr_att_punch_log';
    raise exception 'PREFLIGHT: njhr_att_punch_log ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  -- กันสร้างซ้ำกับระบบใบหน้าที่อาจมีอยู่ภายใต้ชื่ออื่นในสคีมาเดียวกัน
  -- ต้องยกเว้น "ทุกตารางที่ไฟล์นี้สร้างเอง" ไม่งั้นจะบล็อกตัวเองตอนรันซ้ำ
  select string_agg(table_name, ', ') into act from information_schema.tables
   where table_schema='public'
     and table_name not in ('njhr_emp_faces','njhr_emp_face_events','njhr_face_attempts')
     and table_name like 'njhr\_%' and (table_name ilike '%face%' or table_name ilike '%biometric%');
  if act is not null then
    raise exception 'PREFLIGHT: พบตารางใบหน้าของ HR อยู่แล้ว [%] — หยุดเพื่อไม่ให้สร้างซ้ำ', act;
  end if;

  raise notice 'PREFLIGHT ผ่าน · พนักงานที่ปฏิบัติงาน % คน · ประวัติลงเวลา % แถว',
    (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
    (select count(*) from public.njhr_att_punch_log);
end $$;


-- ─── 1) ทะเบียนใบหน้า ───────────────────────────────────────
--  1 พนักงาน = 1 แถว · เก็บหลาย descriptor (หน้าตรง / ซ้าย / ขวา) ในคอลัมน์เดียว
create table if not exists public.njhr_emp_faces (
  employee_id     uuid primary key references public.employees(id) on delete cascade,
  descriptors     jsonb  not null,          -- [[128 floats], [128 floats], ...]
  descriptor_len  int    not null,          -- ความยาวเวกเตอร์ (ปกติ 128)
  sample_count    int    not null default 0,
  model           text   not null default 'face-api/ssd_mobilenetv1+68+recognition',
  quality         jsonb  not null default '{}'::jsonb,   -- แสง/ความชัด/ขนาดใบหน้า ตอนลงทะเบียน
  enroll_snapshot text,                     -- path ใน bucket njhr-face (private)
  is_active       boolean not null default true,
  enrolled_at     timestamptz not null default now(),
  enrolled_by     text,
  updated_at      timestamptz not null default now(),
  updated_by      text
);
alter table public.njhr_emp_faces enable row level security;
create index if not exists njhr_face_active_idx on public.njhr_emp_faces (is_active);

comment on table public.njhr_emp_faces is
  'ข้อมูลใบหน้าพนักงาน (ข้อมูลชีวมิติ) — อ่านได้เฉพาะภายในฐานข้อมูล ห้ามส่งออกไปเบราว์เซอร์';

-- ประวัติทุกครั้งที่ลงทะเบียน/ลบ เพื่อตรวจย้อนหลัง
create table if not exists public.njhr_emp_face_events (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  action      text not null,                -- ENROLL · RE_ENROLL · DELETE · DISABLE · ENABLE
  detail      text,
  actor       text,
  created_at  timestamptz not null default now()
);
alter table public.njhr_emp_face_events enable row level security;
create index if not exists njhr_face_ev_idx on public.njhr_emp_face_events (employee_id, created_at desc);

-- ปิด policy ที่เปิดให้ anon ทั้งตาราง (ถ้ามี) — เข้าถึงผ่าน RPC security definer เท่านั้น
do $$
declare pn text; tb text;
begin
  foreach tb in array array['njhr_emp_faces','njhr_emp_face_events'] loop
    for pn in select policyname from pg_policies
               where schemaname='public' and tablename=tb
                 and 'anon' = any(roles) and (qual='true' or qual is null)
    loop execute format('drop policy %I on public.%I', pn, tb); end loop;
  end loop;
end $$;


-- ─── 2) คอลัมน์ผลการสแกนบนประวัติลงเวลา (additive) ──────────
alter table public.njhr_att_punch_log add column if not exists verify_method    text;
alter table public.njhr_att_punch_log add column if not exists face_similarity  numeric(6,4);
alter table public.njhr_att_punch_log add column if not exists face_distance    numeric(6,4);
alter table public.njhr_att_punch_log add column if not exists liveness_passed  boolean;
alter table public.njhr_att_punch_log add column if not exists liveness_method  text;
alter table public.njhr_att_punch_log add column if not exists snapshot_path    text;
alter table public.njhr_att_punch_log add column if not exists device           text;
alter table public.njhr_att_punch_log add column if not exists browser          text;
alter table public.njhr_att_punch_log add column if not exists os               text;
alter table public.njhr_att_punch_log add column if not exists user_agent       text;

-- บันทึกความพยายามสแกนที่ "ไม่ผ่าน" ด้วย (ใช้ตรวจการสวมรอยและปรับ threshold)
create table if not exists public.njhr_face_attempts (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid references public.employees(id) on delete set null,
  action          text,                     -- IN · OUT · ENROLL
  passed          boolean not null default false,
  fail_reason     text,
  face_similarity numeric(6,4),
  face_distance   numeric(6,4),
  liveness_passed boolean,
  faces_found     int,
  lat             double precision,
  lng             double precision,
  accuracy_m      numeric,
  snapshot_path   text,
  device          text,
  browser         text,
  os              text,
  created_at      timestamptz not null default now()
);
alter table public.njhr_face_attempts enable row level security;
create index if not exists njhr_face_att_idx on public.njhr_face_attempts (employee_id, created_at desc);
create index if not exists njhr_face_att_fail_idx on public.njhr_face_attempts (passed, created_at desc);

do $$
declare pn text;
begin
  for pn in select policyname from pg_policies
             where schemaname='public' and tablename='njhr_face_attempts'
               and 'anon' = any(roles) and (qual='true' or qual is null)
  loop execute format('drop policy %I on public.njhr_face_attempts', pn); end loop;
end $$;


-- ─── 3) ค่าตั้งต้นของระบบใบหน้า (ไม่ทับค่าเดิม) ──────────────
insert into public.system_settings(key, value, category, is_public, updated_at)
select v.k, v.val::jsonb, 'attendance', v.pub, now()
  from (values
    ('face_match_max_distance', '0.50',  true),   -- ระยะยุคลิดสูงสุดที่ถือว่าเป็นคนเดียวกัน
    ('face_min_similarity',     '0.55',  true),   -- คะแนนความเหมือนขั้นต่ำ (1 - distance)
    ('face_enroll_samples',     '3',     true),   -- จำนวนมุมที่ต้องเก็บตอนลงทะเบียน
    ('face_max_attempts',       '3',     true),   -- สแกนไม่ผ่านกี่ครั้งจึงเสนอส่งคำขออนุมัติ
    ('face_require_liveness',   'true',  true)
  ) as v(k, val, pub)
 where not exists (select 1 from public.system_settings s where s.key = v.k);


-- ─── 4) สิทธิ์ ──────────────────────────────────────────────
create or replace function public.njhr_face_guard(p_token text, p_manage boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);       -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if p_manage and c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการข้อมูลใบหน้าพนักงาน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR'));
end $$;

-- ระยะยุคลิดระหว่างเวกเตอร์ 2 ตัว (ใช้เทียบใบหน้า — ไม่คืน descriptor ออกไป)
create or replace function public.njhr_face_distance(a jsonb, b float8[])
returns numeric language sql immutable as $$
  select round(sqrt(sum(power((x.v)::numeric - (b[x.i])::numeric, 2)))::numeric, 4)
    from (select (value)::text::numeric v, ordinality i
            from jsonb_array_elements(a) with ordinality) x
   where x.i <= array_length(b, 1);
$$;


-- ─── 5) สถานะการลงทะเบียนใบหน้า ─────────────────────────────
create or replace function public.njhr_face_status(
  p_token text, p_employee uuid default null, p_q text default null)
returns table (employee_id uuid, emp_code text, full_name text, department_name text,
               enrolled boolean, is_active boolean, sample_count int,
               enrolled_at timestamptz, enrolled_by text, last_scan_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
begin
  select * into c from public.njhr_face_guard(p_token, false);
  -- พนักงานทั่วไปดูได้เฉพาะของตนเอง
  if not c.is_admin and (p_employee is null or p_employee is distinct from c.employee_id) then
    p_employee := c.employee_id;
  end if;

  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.department_name,''),
         (f.employee_id is not null), coalesce(f.is_active,false),
         coalesce(f.sample_count,0), f.enrolled_at, coalesce(f.enrolled_by,''),
         (select max(l.punched_at) from public.njhr_att_punch_log l
           where l.employee_id = e.id and l.verify_method = 'FACE')
    from public.employees e
    left join public.njhr_emp_faces f on f.employee_id = e.id
   where e.status::text in ('ACTIVE','PROBATION')
     and (p_employee is null or e.id = p_employee)
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code;
end $$;


-- ─── 6) ลงทะเบียนใบหน้า ─────────────────────────────────────
--  p_descriptors = [[128 floats], ...] อย่างน้อยตามค่า face_enroll_samples
create or replace function public.njhr_face_enroll(
  p_token text, p_employee uuid, p_descriptors jsonb,
  p_quality jsonb default '{}'::jsonb, p_snapshot text default null)
returns table (employee_id uuid, sample_count int, enrolled_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; v_n int; v_len int; v_need int; v_re boolean;
begin
  select * into c from public.njhr_face_guard(p_token, true);

  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  if e.status::text not in ('ACTIVE','PROBATION') then
    raise exception 'ลงทะเบียนใบหน้าได้เฉพาะพนักงานที่ปฏิบัติงานอยู่' using errcode='22023';
  end if;

  if p_descriptors is null or jsonb_typeof(p_descriptors) <> 'array' then
    raise exception 'ข้อมูลใบหน้าไม่ถูกต้อง' using errcode='22023';
  end if;
  v_n := jsonb_array_length(p_descriptors);
  v_need := coalesce((select (s.value)::text::int from public.system_settings s
                       where s.key = 'face_enroll_samples'), 3);
  if v_n < v_need then
    raise exception 'ต้องเก็บใบหน้าอย่างน้อย % มุม (ได้ % มุม)', v_need, v_n using errcode='22023';
  end if;

  select jsonb_array_length(p_descriptors->0) into v_len;
  if coalesce(v_len,0) < 64 then
    raise exception 'เวกเตอร์ใบหน้าสั้นผิดปกติ (% ค่า)', coalesce(v_len,0) using errcode='22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_descriptors) d
              where jsonb_array_length(d) <> v_len) then
    raise exception 'เวกเตอร์ใบหน้าแต่ละมุมมีความยาวไม่เท่ากัน' using errcode='22023';
  end if;

  v_re := exists (select 1 from public.njhr_emp_faces f where f.employee_id = p_employee);

  insert into public.njhr_emp_faces(employee_id, descriptors, descriptor_len, sample_count,
                                    quality, enroll_snapshot, is_active, enrolled_by, updated_by)
  values (p_employee, p_descriptors, v_len, v_n,
          coalesce(p_quality,'{}'::jsonb), nullif(btrim(coalesce(p_snapshot,'')),''),
          true, c.username, c.username)
  on conflict (employee_id) do update
    set descriptors = excluded.descriptors, descriptor_len = excluded.descriptor_len,
        sample_count = excluded.sample_count, quality = excluded.quality,
        enroll_snapshot = coalesce(excluded.enroll_snapshot, njhr_emp_faces.enroll_snapshot),
        is_active = true, enrolled_at = now(), enrolled_by = c.username,
        updated_at = now(), updated_by = c.username;

  insert into public.njhr_emp_face_events(employee_id, action, detail, actor)
  values (p_employee, case when v_re then 'RE_ENROLL' else 'ENROLL' end,
          e.emp_code || ' · ' || v_n || ' มุม', c.username);

  perform public.njhr_audit_write(p_token,
    case when v_re then 'FACE_RE_ENROLL' else 'FACE_ENROLL' end,
    'attendance', 'njhr_emp_faces', p_employee::text,
    'ลงทะเบียนใบหน้า ' || e.emp_code || ' · ' || v_n || ' มุม', null, null, null);

  return query select f.employee_id, f.sample_count, f.enrolled_at
                 from public.njhr_emp_faces f where f.employee_id = p_employee;
end $$;


-- ─── 7) ลบ / ปิดใช้งานทะเบียนใบหน้า ─────────────────────────
create or replace function public.njhr_face_delete(
  p_token text, p_employee uuid, p_reason text default null)
returns table (deleted boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_face_guard(p_token, true);
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลการลบข้อมูลใบหน้า' using errcode='22023';
  end if;
  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  if not exists (select 1 from public.njhr_emp_faces f where f.employee_id = p_employee) then
    raise exception 'พนักงานรายนี้ยังไม่ได้ลงทะเบียนใบหน้า' using errcode='P0002';
  end if;

  delete from public.njhr_emp_faces where njhr_emp_faces.employee_id = p_employee;

  insert into public.njhr_emp_face_events(employee_id, action, detail, actor)
  values (p_employee, 'DELETE', e.emp_code || ' · เหตุผล: ' || v_reason, c.username);

  perform public.njhr_audit_write(p_token, 'FACE_DELETE', 'attendance', 'njhr_emp_faces',
    p_employee::text, 'ลบข้อมูลใบหน้า ' || e.emp_code || ' · เหตุผล: ' || v_reason,
    null, null, null);

  return query select true;
end $$;


-- ─── 8) เทียบใบหน้า (descriptor ไม่ออกจากฐานข้อมูล) ─────────
create or replace function public.njhr_face_verify(
  p_token text, p_descriptor float8[], p_faces_found int default 1,
  p_liveness boolean default null, p_liveness_method text default null)
returns table (passed boolean, similarity numeric, distance numeric,
               threshold numeric, reason text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; f record; v_min numeric; v_max numeric; v_need boolean;
begin
  select * into c from public.njhr_face_guard(p_token, false);
  if c.employee_id is null then
    return query select false, null::numeric, null::numeric, null::numeric,
      'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน'::text; return;
  end if;
  if coalesce(p_faces_found,1) <> 1 then
    return query select false, null::numeric, null::numeric, null::numeric,
      ('ต้องพบใบหน้าเพียง 1 คน (พบ ' || coalesce(p_faces_found,0) || ' คน)')::text; return;
  end if;

  v_max  := coalesce((select (s.value)::text::numeric from public.system_settings s
                       where s.key = 'face_match_max_distance'), 0.50);
  v_need := coalesce((select (s.value)::text::boolean from public.system_settings s
                       where s.key = 'face_require_liveness'), true);

  if v_need and coalesce(p_liveness,false) is not true then
    return query select false, null::numeric, null::numeric, v_max,
      'ตรวจไม่พบว่าเป็นบุคคลจริง กรุณาสแกนใหม่'::text; return;
  end if;

  select * into f from public.njhr_emp_faces
   where njhr_emp_faces.employee_id = c.employee_id and is_active;
  if not found then
    return query select false, null::numeric, null::numeric, v_max,
      'ยังไม่ได้ลงทะเบียนใบหน้า กรุณาติดต่อฝ่ายบุคคล'::text; return;
  end if;
  if p_descriptor is null or array_length(p_descriptor,1) is distinct from f.descriptor_len then
    return query select false, null::numeric, null::numeric, v_max,
      'ข้อมูลใบหน้าที่สแกนไม่ถูกต้อง'::text; return;
  end if;

  -- ใช้มุมที่ใกล้ที่สุดจากทุกมุมที่ลงทะเบียนไว้
  select min(public.njhr_face_distance(d, p_descriptor)) into v_min
    from jsonb_array_elements(f.descriptors) d;

  return query select (v_min <= v_max), round(1 - v_min, 4), v_min, v_max,
    case when v_min <= v_max then ''
         else 'ใบหน้าไม่ตรงกับที่ลงทะเบียนไว้' end::text;
end $$;


-- ─── 9) ลงเวลาด้วยใบหน้า — ใช้ njhr_att_punch เดิมทั้งดุ้น ───
create or replace function public.njhr_att_punch_face(
  p_token text, p_action text,
  p_descriptor float8[], p_faces_found int default 1,
  p_liveness boolean default null, p_liveness_method text default null,
  p_lat double precision default null, p_lng double precision default null,
  p_accuracy double precision default null,
  p_snapshot text default null, p_device jsonb default '{}'::jsonb)
returns table (ok boolean, reason text,
               work_date date, check_in timestamptz, check_out timestamptz,
               status text, work_hours numeric, late_min int,
               geofence_name text, distance_m numeric,
               similarity numeric, verify_distance numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v record; r record; v_act text := upper(btrim(coalesce(p_action,'')));
begin
  select * into c from public.njhr_face_guard(p_token, false);
  if v_act not in ('IN','OUT') then
    raise exception 'คำสั่งต้องเป็น IN หรือ OUT' using errcode='22023';
  end if;

  -- 1) ตรวจใบหน้าและ liveness ก่อนเสมอ
  select * into v from public.njhr_face_verify(
    p_token, p_descriptor, p_faces_found, p_liveness, p_liveness_method);

  if not v.passed then
    insert into public.njhr_face_attempts(employee_id, action, passed, fail_reason,
      face_similarity, face_distance, liveness_passed, faces_found,
      lat, lng, accuracy_m, snapshot_path, device, browser, os)
    values (c.employee_id, v_act, false, v.reason, v.similarity, v.distance,
            p_liveness, p_faces_found, p_lat, p_lng, p_accuracy,
            nullif(btrim(coalesce(p_snapshot,'')),''),
            nullif(p_device->>'device',''), nullif(p_device->>'browser',''), nullif(p_device->>'os',''));
    return query select false, v.reason, null::date, null::timestamptz, null::timestamptz,
      null::text, null::numeric, null::int, null::text, null::numeric, v.similarity, v.distance;
    return;
  end if;

  -- 2) ผ่านแล้วจึงเรียกตรรกะลงเวลาเดิม (ตรวจ Geofence + เขียน attendance ในนั้นครบแล้ว)
  select * into r from public.njhr_att_punch(p_token, v_act, null, p_lat, p_lng, p_accuracy);

  -- 3) เติมผลการสแกนลงแถวประวัติที่ njhr_att_punch เพิ่งสร้าง
  update public.njhr_att_punch_log l
     set verify_method = 'FACE', face_similarity = v.similarity, face_distance = v.distance,
         liveness_passed = coalesce(p_liveness,false),
         liveness_method = nullif(btrim(coalesce(p_liveness_method,'')),''),
         snapshot_path = nullif(btrim(coalesce(p_snapshot,'')),''),
         device = nullif(p_device->>'device',''), browser = nullif(p_device->>'browser',''),
         os = nullif(p_device->>'os',''), user_agent = nullif(p_device->>'user_agent','')
   where l.id = (select l2.id from public.njhr_att_punch_log l2
                  where l2.employee_id = c.employee_id and l2.action = v_act
                  order by l2.punched_at desc limit 1);

  insert into public.njhr_face_attempts(employee_id, action, passed,
    face_similarity, face_distance, liveness_passed, faces_found,
    lat, lng, accuracy_m, snapshot_path, device, browser, os)
  values (c.employee_id, v_act, true, v.similarity, v.distance, p_liveness, p_faces_found,
          p_lat, p_lng, p_accuracy, nullif(btrim(coalesce(p_snapshot,'')),''),
          nullif(p_device->>'device',''), nullif(p_device->>'browser',''), nullif(p_device->>'os',''));

  perform public.njhr_audit_write(p_token, 'ATT_PUNCH_FACE', 'attendance', 'njhr_att_punch_log',
    c.employee_id::text,
    'ลงเวลา ' || v_act || ' ด้วยใบหน้า · ความเหมือน ' || coalesce(v.similarity::text,'-') ||
    ' · ' || coalesce(r.geofence_name,'-'), null, null, null);

  return query select true, ''::text, r.work_date, r.check_in, r.check_out,
    r.status, r.work_hours, r.late_min, r.geofence_name, r.distance_m, v.similarity, v.distance;
end $$;


-- ─── 10) Storage bucket สำหรับ Snapshot (private 100%) ──────
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'ไม่พบ storage.buckets — สร้าง bucket เองที่ Dashboard ชื่อ njhr-face แบบ private';
    return;
  end if;
  insert into storage.buckets (id, name, public) values ('njhr-face','njhr-face',false)
  on conflict (id) do update set public = false;
  raise notice 'bucket njhr-face พร้อมใช้งาน (private)';
exception when others then
  raise notice 'สร้าง bucket ไม่สำเร็จ (%) — สร้างเองที่ Dashboard ชื่อ njhr-face แบบ private', sqlerrm;
end $$;


-- ─── 11) GRANT ──────────────────────────────────────────────
revoke execute on function public.njhr_face_guard(text, boolean)       from public, anon, authenticated;
revoke execute on function public.njhr_face_distance(jsonb, float8[])  from public, anon, authenticated;
grant execute on function public.njhr_face_status(text,uuid,text)                        to anon, authenticated;
grant execute on function public.njhr_face_enroll(text,uuid,jsonb,jsonb,text)            to anon, authenticated;
grant execute on function public.njhr_face_delete(text,uuid,text)                        to anon, authenticated;
grant execute on function public.njhr_face_verify(text,float8[],int,boolean,text)        to anon, authenticated;
grant execute on function public.njhr_att_punch_face(text,text,float8[],int,boolean,text,double precision,double precision,double precision,text,jsonb) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.1-face-attendance', 'ลงเวลาด้วยใบหน้า: ทะเบียนใบหน้า + เทียบฝั่งเซิร์ฟเวอร์ + ประวัติการสแกน')
on conflict (version) do nothing;


-- ─── 12) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', jsonb_build_object(
     'njhr_emp_faces', to_regclass('public.njhr_emp_faces') is not null,
     'njhr_emp_face_events', to_regclass('public.njhr_emp_face_events') is not null,
     'njhr_face_attempts', to_regclass('public.njhr_face_attempts') is not null),
  'punch_log_columns', (select jsonb_agg(column_name order by ordinal_position)
                          from information_schema.columns
                         where table_schema='public' and table_name='njhr_att_punch_log'),
  'bucket', (select jsonb_build_object('id', id, 'public', public)
               from storage.buckets where id = 'njhr-face'),
  'anon_policies_on_face', coalesce((select count(*) from pg_policies
                                      where schemaname='public'
                                        and tablename in ('njhr_emp_faces','njhr_emp_face_events','njhr_face_attempts')
                                        and 'anon' = any(roles)), 0),
  'settings', (select jsonb_object_agg(s.key, s.value) from public.system_settings s
                where s.key like 'face\_%'),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public'
                   and (p.proname like 'njhr\_face\_%' or p.proname = 'njhr_att_punch_face')),
  'employees_active', (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
  'faces_enrolled', (select count(*) from public.njhr_emp_faces)
)) as install_report;
