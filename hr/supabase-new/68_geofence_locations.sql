-- ============================================================
-- NJ HR V.10 — 68_geofence_locations.sql
-- พื้นที่ลงเวลาหลายแห่ง + สิทธิ์รายบุคคล (แทนค่าเดียวใน localStorage)
--
-- ทำอะไร
--   1) ตาราง njhr_geofences        = พื้นที่ลงเวลา (ชื่อ · ที่อยู่ · พิกัด · รัศมี · สถานะ)
--   2) ตาราง njhr_geofence_members = พนักงานที่ได้รับอนุญาตในแต่ละพื้นที่ (อ้าง employees.id จริง)
--   3) ตาราง njhr_att_punch_log    = ประวัติการลงเวลาพร้อม Location ID · ชื่อสถานที่ · พิกัดจริง · ระยะห่าง
--   4) RPC จัดการพื้นที่ (เฉพาะ SUPER_ADMIN) + RPC ตรวจสิทธิ์ตอนลงเวลา (พนักงานเห็นเฉพาะพื้นที่ของตน)
--   5) njhr_att_punch เวอร์ชันใหม่: รับพิกัด → ตรวจกับพื้นที่ที่พนักงานได้รับสิทธิ์ → บันทึกลง log
--
-- ไม่แตะ
--   · โครงสร้างตาราง attendance เดิม (ไม่เพิ่ม/ลบคอลัมน์) — เก็บรายละเอียดพิกัดไว้ในตาราง log แยก
--   · employees · leave_requests · ot_requests · payroll · njhr_emp_documents
--   · njhr_att_today / _report / _summary / _migrate / _late_min / _guard  (คงเดิมทั้งหมด)
--
-- ⚠ njhr_att_punch ถูก drop แล้วสร้างใหม่เพื่อเพิ่มพารามิเตอร์พิกัด (พารามิเตอร์เดิมมี default ครบ
--   เรียกแบบเดิม p_token/p_action ยังทำงานได้เหมือนเดิมทุกประการ)
--
-- ต้องรัน 48_employees.sql · 51_core_schema.sql · 64_attendance.sql มาก่อน · รันซ้ำได้
-- ============================================================


-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.employees') is null then raise exception 'PREFLIGHT: ไม่พบตาราง employees'; end if;
  if to_regclass('public.attendance') is null then raise exception 'PREFLIGHT: ไม่พบตาราง attendance'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_att_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_att_guard — รัน 64_attendance.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · การลงเวลาเดิมในระบบ % รายการ (จะไม่ถูกแตะ)',
    (select count(*) from public.attendance);
end $$;


-- ─── 1) ตารางพื้นที่ลงเวลา ───────────────────────────────────
create table if not exists public.njhr_geofences (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  lat          double precision not null,
  lng          double precision not null,
  radius       int  not null default 100,
  max_accuracy int  not null default 50,
  active       boolean not null default true,
  note         text,
  created_at   timestamptz not null default now(),
  created_by   text,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  deleted_at   timestamptz
);
alter table public.njhr_geofences enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_gf_radius_chk') then
    alter table public.njhr_geofences add constraint njhr_gf_radius_chk
      check (radius > 0 and radius <= 20000);
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_gf_acc_chk') then
    alter table public.njhr_geofences add constraint njhr_gf_acc_chk check (max_accuracy > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_gf_latlng_chk') then
    alter table public.njhr_geofences add constraint njhr_gf_latlng_chk
      check (lat between -90 and 90 and lng between -180 and 180);
  end if;
end $$;

create index if not exists njhr_gf_active_idx on public.njhr_geofences (active) where deleted_at is null;


-- ─── 2) พนักงานที่ได้รับอนุญาตในแต่ละพื้นที่ ─────────────────
-- 1 พนักงานอยู่ได้หลายพื้นที่ · 1 พื้นที่มีได้หลายพนักงาน
create table if not exists public.njhr_geofence_members (
  id          uuid primary key default gen_random_uuid(),
  geofence_id uuid not null references public.njhr_geofences(id) on delete cascade,
  employee_id uuid not null references public.employees(id)      on delete cascade,
  created_at  timestamptz not null default now(),
  created_by  text
);
alter table public.njhr_geofence_members enable row level security;
create unique index if not exists njhr_gfm_uidx on public.njhr_geofence_members (geofence_id, employee_id);
create index if not exists njhr_gfm_emp_idx on public.njhr_geofence_members (employee_id);


-- ─── 3) ประวัติการลงเวลาพร้อมพิกัด ──────────────────────────
create table if not exists public.njhr_att_punch_log (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  work_date     date not null,
  action        text not null check (action in ('IN','OUT')),
  punched_at    timestamptz not null default now(),
  geofence_id   uuid references public.njhr_geofences(id) on delete set null,
  geofence_name text,
  lat           double precision,
  lng           double precision,
  distance_m    numeric,
  accuracy_m    numeric,
  created_at    timestamptz not null default now()
);
alter table public.njhr_att_punch_log enable row level security;
create index if not exists njhr_apl_emp_idx on public.njhr_att_punch_log (employee_id, work_date desc);

insert into public.njhr_schema_version(version, note)
values ('v12.0-geofence-multi', 'พื้นที่ลงเวลาหลายแห่ง + สิทธิ์รายบุคคล + ประวัติพิกัดการลงเวลา')
on conflict (version) do nothing;


-- ─── 4) สิทธิ์ ───────────────────────────────────────────────
-- จัดการพื้นที่ = SUPER_ADMIN เท่านั้น (ดูพิกัดบ้านพนักงานได้เฉพาะผู้ดูแลสูงสุด)
create or replace function public.njhr_gf_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะ Super Admin เท่านั้นที่จัดการพื้นที่ลงเวลาได้' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end $$;

-- ระยะทางจริง (Haversine) หน่วยเมตร — สูตรเดียวกับฝั่งหน้าเว็บ
create or replace function public.njhr_gf_dist(
  lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;


-- ─── 5) รายการพื้นที่ทั้งหมด (หน้าตั้งค่า) ───────────────────
create or replace function public.njhr_gf_list(p_token text, p_q text default null)
returns table (id uuid, name text, address text, lat double precision, lng double precision,
               radius int, max_accuracy int, active boolean, member_count int,
               members jsonb, updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_gf_guard(p_token);
  return query
  select g.id, g.name, coalesce(g.address,''), g.lat, g.lng, g.radius, g.max_accuracy, g.active,
         (select count(*)::int from public.njhr_geofence_members m where m.geofence_id = g.id),
         coalesce((select jsonb_agg(jsonb_build_object(
                     'employee_id', e.id, 'emp_code', e.emp_code,
                     'name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                     'nickname', coalesce(e.nickname,''),
                     'department', coalesce(e.department_name,''))
                   order by e.emp_code)
                    from public.njhr_geofence_members m
                    join public.employees e on e.id = m.employee_id
                   where m.geofence_id = g.id), '[]'::jsonb),
         g.updated_at, coalesce(g.updated_by,'')
    from public.njhr_geofences g
   where g.deleted_at is null
     and (q = '' or lower(g.name) like '%'||q||'%' or lower(coalesce(g.address,'')) like '%'||q||'%'
          or exists (select 1 from public.njhr_geofence_members m
                       join public.employees e on e.id = m.employee_id
                      where m.geofence_id = g.id
                        and (lower(coalesce(e.emp_code,'')) like '%'||q||'%'
                             or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
                             or lower(coalesce(e.nickname,'')) like '%'||q||'%')))
   order by g.name;
end $$;


-- ─── 6) สร้าง / แก้ไขพื้นที่ + รายชื่อพนักงาน ────────────────
create or replace function public.njhr_gf_save(
  p_token text, p_id uuid default null, p_name text default null, p_address text default null,
  p_lat double precision default null, p_lng double precision default null,
  p_radius int default null, p_active boolean default true,
  p_employees uuid[] default null, p_max_accuracy int default null)
returns table (id uuid, name text, member_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; oldrow jsonb; n_bad int;
        v_name text := btrim(coalesce(p_name,''));
        v_emps uuid[];
begin
  select * into c from public.njhr_gf_guard(p_token);

  if v_name = '' then raise exception 'กรุณาระบุชื่อสถานที่' using errcode='22023'; end if;
  if p_lat is null or p_lng is null then
    raise exception 'กรุณาปักหมุดตำแหน่งบนแผนที่' using errcode='22023'; end if;
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'พิกัดไม่ถูกต้อง' using errcode='22023'; end if;
  if coalesce(p_radius,0) <= 0 then
    raise exception 'รัศมีต้องมากกว่า 0 เมตร' using errcode='22023'; end if;

  -- รับเฉพาะ Employee ID จริงเท่านั้น (ห้ามกรอกชื่อเป็นข้อความ)
  select array_agg(distinct x) into v_emps
    from unnest(coalesce(p_employees,'{}'::uuid[])) as t(x);
  if v_emps is not null then
    select count(*)::int into n_bad from unnest(v_emps) as t(x)
     where not exists (select 1 from public.employees e where e.id = t.x);
    if n_bad > 0 then
      raise exception 'มีรหัสพนักงานที่ไม่พบในฐานข้อมูล % รายการ', n_bad using errcode='23503';
    end if;
  end if;

  if p_id is null then
    insert into public.njhr_geofences (name, address, lat, lng, radius, max_accuracy, active, created_by, updated_by)
    values (v_name, nullif(btrim(coalesce(p_address,'')),''), p_lat, p_lng, p_radius,
            coalesce(p_max_accuracy, 50), coalesce(p_active, true), c.username, c.username)
    returning njhr_geofences.id into v_id;
  else
    select to_jsonb(g) into oldrow from public.njhr_geofences g where g.id = p_id and g.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบพื้นที่ลงเวลานี้' using errcode='P0002'; end if;
    v_id := p_id;
    update public.njhr_geofences set
      name = v_name, address = nullif(btrim(coalesce(p_address,'')),''),
      lat = p_lat, lng = p_lng, radius = p_radius,
      max_accuracy = coalesce(p_max_accuracy, max_accuracy),
      active = coalesce(p_active, active), updated_at = now(), updated_by = c.username
     where njhr_geofences.id = v_id;
  end if;

  -- เขียนรายชื่อผู้ได้รับอนุญาตใหม่ทั้งชุด (ลบเฉพาะคนที่ถูกเอาออก)
  if p_employees is not null then
    delete from public.njhr_geofence_members m
     where m.geofence_id = v_id
       and (v_emps is null or not (m.employee_id = any(v_emps)));
    if v_emps is not null then
      insert into public.njhr_geofence_members (geofence_id, employee_id, created_by)
      select v_id, x, c.username from unnest(v_emps) as t(x)
      on conflict (geofence_id, employee_id) do nothing;
    end if;
  end if;

  perform public.njhr_audit_write(p_token,
    case when p_id is null then 'GEOFENCE_ADD' else 'GEOFENCE_EDIT' end,
    'attendance', 'njhr_geofences', v_id::text,
    v_name || ' · รัศมี ' || p_radius || ' ม. · พนักงาน ' ||
      coalesce(array_length(v_emps,1), 0) || ' คน',
    oldrow, (select to_jsonb(g) from public.njhr_geofences g where g.id = v_id), null);

  return query
  select g.id, g.name,
         (select count(*)::int from public.njhr_geofence_members m where m.geofence_id = g.id)
    from public.njhr_geofences g where g.id = v_id;
end $$;


-- ─── 7) ลบพื้นที่ (soft delete · ประวัติการลงเวลาไม่หาย) ─────
create or replace function public.njhr_gf_delete(p_token text, p_id uuid, p_confirm boolean default false)
returns table (deleted boolean, member_count int, punch_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; g record; n_mem int; n_pun int;
begin
  select * into c from public.njhr_gf_guard(p_token);
  select * into g from public.njhr_geofences where id = p_id and deleted_at is null;
  if not found then raise exception 'ไม่พบพื้นที่ลงเวลานี้' using errcode='P0002'; end if;

  select count(*)::int into n_mem from public.njhr_geofence_members m where m.geofence_id = p_id;
  select count(*)::int into n_pun from public.njhr_att_punch_log l where l.geofence_id = p_id;

  if (n_mem > 0 or n_pun > 0) and not coalesce(p_confirm,false) then
    return query select false, n_mem, n_pun;
    return;
  end if;

  update public.njhr_geofences
     set deleted_at = now(), active = false, updated_at = now(), updated_by = c.username
   where njhr_geofences.id = p_id;
  delete from public.njhr_geofence_members m where m.geofence_id = p_id;   -- ปลดสิทธิ์ทั้งหมด

  perform public.njhr_audit_write(p_token, 'GEOFENCE_DELETE', 'attendance', 'njhr_geofences',
    p_id::text, 'ลบพื้นที่ ' || g.name || ' (พนักงาน ' || n_mem || ' คน)', to_jsonb(g), null, null);

  return query select true, n_mem, n_pun;
end $$;


-- ─── 8) พื้นที่ของ "ฉัน" — พนักงานเห็นเฉพาะของตนเองเท่านั้น ──
create or replace function public.njhr_gf_mine(p_token text)
returns table (id uuid, name text, address text, lat double precision, lng double precision,
               radius int, max_accuracy int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then return; end if;
  return query
  select g.id, g.name, coalesce(g.address,''), g.lat, g.lng, g.radius, g.max_accuracy
    from public.njhr_geofences g
    join public.njhr_geofence_members m on m.geofence_id = g.id
   where m.employee_id = c.employee_id and g.active and g.deleted_at is null
   order by g.name;
end $$;


-- ─── 9) ตรวจว่าอยู่ในพื้นที่ที่ได้รับสิทธิ์หรือไม่ ───────────
create or replace function public.njhr_gf_check(
  p_token text, p_lat double precision, p_lng double precision, p_accuracy double precision default null)
returns table (pass boolean, geofence_id uuid, geofence_name text,
               distance_m numeric, radius int, reason text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; best record; n int;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงลงเวลาไม่ได้'; return;
  end if;
  if p_lat is null or p_lng is null then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'ไม่สามารถอ่านตำแหน่ง GPS ได้ กรุณาอนุญาตการเข้าถึงตำแหน่งแล้วลองใหม่'; return;
  end if;

  select count(*)::int into n from public.njhr_geofence_members m
    join public.njhr_geofences g on g.id = m.geofence_id
   where m.employee_id = c.employee_id and g.active and g.deleted_at is null;
  if n = 0 then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'ยังไม่ได้กำหนดพื้นที่ลงเวลาให้พนักงานคนนี้ กรุณาติดต่อผู้ดูแลระบบ'; return;
  end if;

  select g.id gid, g.name gname, g.radius grad, g.max_accuracy gacc,
         public.njhr_gf_dist(g.lat, g.lng, p_lat, p_lng) dist
    into best
    from public.njhr_geofences g
    join public.njhr_geofence_members m on m.geofence_id = g.id
   where m.employee_id = c.employee_id and g.active and g.deleted_at is null
   order by public.njhr_gf_dist(g.lat, g.lng, p_lat, p_lng)
   limit 1;

  if p_accuracy is not null and p_accuracy > best.gacc then
    return query select false, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'ตำแหน่ง GPS ยังไม่แม่นยำเพียงพอ (' || round(p_accuracy) || ' ม. · อนุญาตไม่เกิน ' ||
      best.gacc || ' ม.) กรุณารอสัญญาณ GPS แล้วลองใหม่';
    return;
  end if;

  if best.dist <= best.grad + 0.05 then     -- เผื่อคลาดเคลื่อนการปัดพิกัด ~5 ซม.
    return query select true, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'อยู่ในพื้นที่ ' || best.gname || ' · ห่าง ' || round(best.dist) || ' ม. จากรัศมี ' || best.grad || ' ม.';
  else
    return query select false, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'อยู่นอกพื้นที่ที่ได้รับอนุญาต — ใกล้ที่สุดคือ ' || best.gname ||
      ' ห่าง ' || round(best.dist) || ' ม. (รัศมีที่อนุญาต ' || best.grad || ' ม.)';
  end if;
end $$;


-- ─── 10) ลงเวลา (เวอร์ชันรับพิกัด) ──────────────────────────
-- พารามิเตอร์ 3 ตัวแรกเหมือนเดิมทุกประการ · เพิ่มพิกัดเป็น optional
-- ส่งพิกัดมา → ตรวจสิทธิ์พื้นที่ฝั่งเซิร์ฟเวอร์ก่อนเสมอ (กันการข้ามฝั่งหน้าเว็บ)
drop function if exists public.njhr_att_punch(text, text, timestamptz);
create or replace function public.njhr_att_punch(
  p_token text, p_action text, p_at timestamptz default null,
  p_lat double precision default null, p_lng double precision default null,
  p_accuracy double precision default null)
returns table (work_date date, check_in timestamptz, check_out timestamptz,
               status text, work_hours numeric, late_min int,
               geofence_id uuid, geofence_name text, distance_m numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_act text := upper(btrim(coalesce(p_action,'')));
        v_now timestamptz := coalesce(p_at, now()); v_date date; v_late int; sh record; v_row record;
        gf record;
begin
  select * into c from public.njhr_att_guard(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงลงเวลาไม่ได้' using errcode='28000';
  end if;
  if v_act not in ('IN','OUT') then
    raise exception 'การลงเวลาไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;
  v_date := (v_now at time zone 'Asia/Bangkok')::date;

  -- ตรวจพื้นที่เมื่อมีพิกัดส่งมา (ไม่มีพิกัด = อุปกรณ์ไม่รองรับ/โหมดจำลอง → ไม่บล็อก)
  if p_lat is not null and p_lng is not null then
    select * into gf from public.njhr_gf_check(p_token, p_lat, p_lng, p_accuracy);
    if not gf.pass then raise exception '%', gf.reason using errcode='42501'; end if;
  end if;

  if v_act = 'IN' then
    select * into v_row from public.attendance
     where employee_id = c.employee_id and work_date = v_date;
    if found and v_row.check_in is not null then
      raise exception 'วันนี้ลงเวลาเข้างานไปแล้วเมื่อ %',
        to_char(v_row.check_in at time zone 'Asia/Bangkok','HH24:MI') using errcode='22023';
    end if;
    v_late := public.njhr_att_late_min(c.employee_id, v_date, v_now);
    insert into public.attendance (employee_id, work_date, check_in, status)
    values (c.employee_id, v_date, v_now,
            (case when v_late > 0 then 'LATE' else 'NORMAL' end)::public.attendance_status)
    on conflict (employee_id, work_date) do update
      set check_in = excluded.check_in, status = excluded.status;
  else
    select * into v_row from public.attendance
     where employee_id = c.employee_id and work_date = v_date;
    if not found or v_row.check_in is null then
      select * into v_row from public.attendance
       where employee_id = c.employee_id and work_date = v_date - 1
         and check_in is not null and check_out is null;
      if found then v_date := v_date - 1; end if;
    end if;
    if v_row.id is null or v_row.check_in is null then
      raise exception 'ยังไม่ได้ลงเวลาเข้างาน จึงลงเวลาออกไม่ได้' using errcode='22023';
    end if;
    if v_row.check_out is not null then
      raise exception 'ลงเวลาออกงานไปแล้วเมื่อ %',
        to_char(v_row.check_out at time zone 'Asia/Bangkok','HH24:MI') using errcode='22023';
    end if;
    select * into sh from public.njhr_shift_at(c.employee_id, v_date);
    update public.attendance
       set check_out = v_now,
           work_hours = round(greatest(0,
             extract(epoch from (v_now - v_row.check_in)) / 3600
             - coalesce(sh.break_minutes, 0) / 60.0)::numeric, 2)
     where employee_id = c.employee_id and work_date = v_date;
  end if;

  -- ประวัติการลงเวลาพร้อม Location ID · ชื่อสถานที่ · พิกัดจริง · ระยะห่าง
  insert into public.njhr_att_punch_log
    (employee_id, work_date, action, punched_at, geofence_id, geofence_name, lat, lng, distance_m, accuracy_m)
  values (c.employee_id, v_date, v_act, v_now,
          gf.geofence_id, gf.geofence_name, p_lat, p_lng, gf.distance_m, p_accuracy);

  perform public.njhr_audit_write(p_token,
    case when v_act = 'IN' then 'CHECK_IN' else 'CHECK_OUT' end, 'attendance', 'attendance', null,
    to_char(v_now at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI') ||
      coalesce(' · ' || gf.geofence_name, ''), null, null, null);

  return query
  select a.work_date, a.check_in, a.check_out, a.status::text, a.work_hours,
         public.njhr_att_late_min(a.employee_id, a.work_date, a.check_in),
         gf.geofence_id, gf.geofence_name, gf.distance_m
    from public.attendance a
   where a.employee_id = c.employee_id and a.work_date = v_date;
end $$;


-- ─── 11) ประวัติพิกัดการลงเวลา (ผู้ดูแล / เจ้าของข้อมูล) ────
create or replace function public.njhr_att_punch_history(
  p_token text, p_employee uuid default null, p_from date default null, p_to date default null,
  p_limit int default 200)
returns table (id uuid, employee_id uuid, emp_code text, emp_name text, work_date date,
               action text, punched_at timestamptz, geofence_id uuid, geofence_name text,
               lat double precision, lng double precision, distance_m numeric, accuracy_m numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_att_guard(p_token);
  return query
  select l.id, l.employee_id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         l.work_date, l.action, l.punched_at, l.geofence_id, coalesce(l.geofence_name,''),
         l.lat, l.lng, l.distance_m, l.accuracy_m
    from public.njhr_att_punch_log l
    join public.employees e on e.id = l.employee_id
   where (c.is_manager or l.employee_id = c.employee_id)   -- พนักงานเห็นเฉพาะของตนเอง
     and (p_employee is null or l.employee_id = p_employee)
     and (p_from is null or l.work_date >= p_from)
     and (p_to   is null or l.work_date <= p_to)
   order by l.punched_at desc
   limit least(greatest(coalesce(p_limit,200),1),1000);
end $$;


-- ─── 12) สิทธิ์เรียกใช้ ─────────────────────────────────────
grant execute on function public.njhr_gf_dist(double precision,double precision,double precision,double precision) to anon, authenticated;
grant execute on function public.njhr_gf_guard(text)                        to anon, authenticated;
grant execute on function public.njhr_gf_list(text,text)                    to anon, authenticated;
grant execute on function public.njhr_gf_save(text,uuid,text,text,double precision,double precision,int,boolean,uuid[],int) to anon, authenticated;
grant execute on function public.njhr_gf_delete(text,uuid,boolean)          to anon, authenticated;
grant execute on function public.njhr_gf_mine(text)                         to anon, authenticated;
grant execute on function public.njhr_gf_check(text,double precision,double precision,double precision) to anon, authenticated;
grant execute on function public.njhr_att_punch(text,text,timestamptz,double precision,double precision,double precision) to anon, authenticated;
grant execute on function public.njhr_att_punch_history(text,uuid,date,date,int) to anon, authenticated;


-- ─── 13) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', jsonb_build_object(
    'njhr_geofences',        to_regclass('public.njhr_geofences')        is not null,
    'njhr_geofence_members', to_regclass('public.njhr_geofence_members') is not null,
    'njhr_att_punch_log',    to_regclass('public.njhr_att_punch_log')    is not null),
  'geofences',        (select count(*) from public.njhr_geofences where deleted_at is null),
  'members',          (select count(*) from public.njhr_geofence_members),
  'punch_log',        (select count(*) from public.njhr_att_punch_log),
  'attendance_untouched', (select count(*) from public.attendance),
  'attendance_columns',   (select jsonb_agg(column_name order by ordinal_position)
                             from information_schema.columns
                            where table_schema='public' and table_name='attendance'),
  'employees_untouched',  (select count(*) from public.employees),
  'punch_signature', (select pg_get_function_identity_arguments(p.oid) from pg_proc p
                        join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proname='njhr_att_punch'),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_gf\_%')
)) as install_report;
-- คาดหวัง: attendance_columns ต้องเท่าเดิม (id, employee_id, work_date, check_in, check_out, work_hours, status, created_at)


-- ─── 14) ROLLBACK ───────────────────────────────────────────
-- drop function if exists public.njhr_att_punch_history(text,uuid,date,date,int);
-- drop function if exists public.njhr_gf_check(text,double precision,double precision,double precision);
-- drop function if exists public.njhr_gf_mine(text);
-- drop function if exists public.njhr_gf_delete(text,uuid,boolean);
-- drop function if exists public.njhr_gf_save(text,uuid,text,text,double precision,double precision,int,boolean,uuid[],int);
-- drop function if exists public.njhr_gf_list(text,text);
-- drop function if exists public.njhr_gf_guard(text);
-- drop function if exists public.njhr_gf_dist(double precision,double precision,double precision,double precision);
-- drop table if exists public.njhr_att_punch_log;
-- drop table if exists public.njhr_geofence_members;
-- drop table if exists public.njhr_geofences;
-- แล้วรัน 64_attendance.sql ใหม่เพื่อคืน njhr_att_punch เวอร์ชันเดิม
