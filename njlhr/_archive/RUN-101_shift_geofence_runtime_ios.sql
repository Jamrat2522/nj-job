-- RUN-101 — Shift ↔ Geofence runtime source-of-truth + shift UI RPCs
-- Production-safe: no DROP, no DELETE of attendance/geofence/member data.
-- Existing geofences remain the source of coordinates/radius/max_accuracy.

create table if not exists public.njhr_shift_geofence_map (
  shift_id uuid primary key references public.work_shifts(id) on delete cascade,
  geofence_id uuid not null references public.njhr_geofences(id) on delete cascade,
  display_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.njhr_shift_geofence_options(p_token text)
returns table(
  geofence_id uuid,
  geofence_name text,
  address text,
  radius integer,
  max_accuracy integer
)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  perform public.njhr_shift_guard(p_token, false);
  return query
  select g.id, g.name, coalesce(g.address,''), g.radius, g.max_accuracy
    from public.njhr_geofences g
   where g.active is true and g.deleted_at is null
   order by g.name;
end
$function$;

create or replace function public.njhr_shift_geofence_list(p_token text)
returns table(
  shift_id uuid,
  geofence_id uuid,
  geofence_name text,
  address text,
  radius integer,
  max_accuracy integer
)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
begin
  perform public.njhr_shift_guard(p_token, false);
  return query
  select m.shift_id, g.id, g.name, coalesce(g.address,''), g.radius, g.max_accuracy
    from public.njhr_shift_geofence_map m
    join public.njhr_geofences g on g.id = m.geofence_id
   where g.active is true and g.deleted_at is null
   order by g.name;
end
$function$;

create or replace function public.njhr_shift_geofence_set(
  p_token text,
  p_shift uuid,
  p_geofence uuid
)
returns table(
  shift_id uuid,
  geofence_id uuid,
  geofence_name text,
  radius integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c record;
  v_shift_name text;
  v_geofence_name text;
  v_date date := (now() at time zone 'Asia/Bangkok')::date;
begin
  select * into c from public.njhr_shift_guard(p_token, true);

  if p_shift is null or p_geofence is null then
    raise exception 'กรุณาเลือกกะและพื้นที่ลงเวลา' using errcode='22023';
  end if;

  select w.shift_name into v_shift_name
    from public.work_shifts w
   where w.id = p_shift;
  if not found then
    raise exception 'ไม่พบกะทำงานนี้' using errcode='P0002';
  end if;

  select g.name into v_geofence_name
    from public.njhr_geofences g
   where g.id = p_geofence
     and g.active is true
     and g.deleted_at is null;
  if not found then
    raise exception 'ไม่พบพื้นที่ลงเวลาที่เปิดใช้งาน' using errcode='P0002';
  end if;

  insert into public.njhr_shift_geofence_map(shift_id, geofence_id, display_name, updated_at)
  values (p_shift, p_geofence, v_geofence_name, now())
  on conflict (shift_id) do update
    set geofence_id = excluded.geofence_id,
        display_name = excluded.display_name,
        updated_at = now();

  -- Backfill เพื่อให้หน้าจอรายชื่อสมาชิกเดิมเห็นทันทีด้วย
  -- Runtime security ไม่พึ่ง row ชุดนี้เพียงอย่างเดียว: njhr_gf_check คำนวณจากกะปัจจุบันซ้ำทุกครั้ง
  insert into public.njhr_geofence_members(geofence_id, employee_id, created_by)
  select p_geofence, e.id, 'AUTO_SHIFT_GEOFENCE'
    from public.employees e
    cross join lateral public.njhr_shift_state_at(e.id, v_date) st
   where st.status = 'ACTIVE'
     and st.shift_id = p_shift
     and e.status::text in ('ACTIVE','PROBATION')
  on conflict (geofence_id, employee_id) do nothing;

  perform public.njhr_audit_write(
    p_token, 'SHIFT_GEOFENCE_SET', 'shift', 'njhr_shift_geofence_map', p_shift::text,
    'กะ ' || v_shift_name || ' → พื้นที่ ' || v_geofence_name,
    null, null, null
  );

  return query
  select m.shift_id, g.id, g.name, g.radius
    from public.njhr_shift_geofence_map m
    join public.njhr_geofences g on g.id = m.geofence_id
   where m.shift_id = p_shift;
end
$function$;

-- Runtime geofence permission = manual membership + geofence mapped from CURRENT effective shift.
-- AUTO/BACKFILL membership rows are mirrors for UI only and are not trusted as independent permission,
-- preventing stale access after a future shift change takes effect.
create or replace function public.njhr_gf_check(
  p_token text,
  p_lat double precision,
  p_lng double precision,
  p_accuracy double precision default null::double precision
)
returns table(
  pass boolean,
  geofence_id uuid,
  geofence_name text,
  distance_m numeric,
  radius integer,
  reason text
)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  c record;
  best record;
  v_allowed uuid[];
  v_date date := (now() at time zone 'Asia/Bangkok')::date;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงลงเวลาไม่ได้';
    return;
  end if;
  if p_lat is null or p_lng is null then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'ไม่สามารถอ่านตำแหน่ง GPS ได้ กรุณาอนุญาตการเข้าถึงตำแหน่งแล้วลองใหม่';
    return;
  end if;

  select array_agg(x.geofence_id) into v_allowed
    from (
      select m.geofence_id
        from public.njhr_geofence_members m
       where m.employee_id = c.employee_id
         and coalesce(m.created_by,'') not like 'AUTO_SHIFT_%'
         and coalesce(m.created_by,'') not like 'BACKFILL_SHIFT_%'
      union
      select sm.geofence_id
        from public.njhr_shift_state_at(c.employee_id, v_date) st
        join public.njhr_shift_geofence_map sm on sm.shift_id = st.shift_id
       where st.status = 'ACTIVE'
    ) x;

  if coalesce(cardinality(v_allowed), 0) = 0 then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'ยังไม่ได้กำหนดพื้นที่ลงเวลาให้พนักงานคนนี้ กรุณาติดต่อผู้ดูแลระบบ';
    return;
  end if;

  select g.id gid, g.name gname, g.radius grad, g.max_accuracy gacc,
         public.njhr_gf_dist(g.lat, g.lng, p_lat, p_lng) dist
    into best
    from public.njhr_geofences g
   where g.id = any(v_allowed)
     and g.active is true
     and g.deleted_at is null
   order by public.njhr_gf_dist(g.lat, g.lng, p_lat, p_lng)
   limit 1;

  if best.gid is null then
    return query select false, null::uuid, null::text, null::numeric, null::int,
      'ยังไม่ได้กำหนดพื้นที่ลงเวลาให้พนักงานคนนี้ กรุณาติดต่อผู้ดูแลระบบ';
    return;
  end if;

  if p_accuracy is not null and p_accuracy > best.gacc then
    return query select false, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'ตำแหน่ง GPS ยังไม่แม่นยำเพียงพอ (' || round(p_accuracy) || ' ม. · อนุญาตไม่เกิน ' ||
      best.gacc || ' ม.) กรุณารอสัญญาณ GPS แล้วลองใหม่';
    return;
  end if;

  if best.dist <= best.grad + 0.05 then
    return query select true, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'อยู่ในพื้นที่ ' || best.gname || ' · ห่าง ' || round(best.dist) || ' ม. จากรัศมี ' || best.grad || ' ม.';
  else
    return query select false, best.gid, best.gname, round(best.dist::numeric, 1), best.grad,
      'อยู่นอกพื้นที่ที่ได้รับอนุญาต — ใกล้ที่สุดคือ ' || best.gname ||
      ' ห่าง ' || round(best.dist) || ' ม. (รัศมีที่อนุญาต ' || best.grad || ' ม.)';
  end if;
end
$function$;

-- Geofence admin list mirrors CURRENT shift-derived permissions too, without trusting stale AUTO rows.
create or replace function public.njhr_gf_list(p_token text, p_q text default null::text)
returns table(
  id uuid,
  name text,
  address text,
  lat double precision,
  lng double precision,
  radius integer,
  max_accuracy integer,
  active boolean,
  member_count integer,
  members jsonb,
  updated_at timestamp with time zone,
  updated_by text
)
language plpgsql
stable security definer
set search_path to 'public'
as $function$
#variable_conflict use_column
declare
  q text := lower(btrim(coalesce(p_q,'')));
  v_date date := (now() at time zone 'Asia/Bangkok')::date;
begin
  perform public.njhr_gf_guard(p_token);

  return query
  with derived as (
    select distinct sm.geofence_id, e.id as employee_id
      from public.employees e
      cross join lateral public.njhr_shift_state_at(e.id, v_date) st
      join public.njhr_shift_geofence_map sm on sm.shift_id = st.shift_id
     where st.status = 'ACTIVE'
       and e.status::text in ('ACTIVE','PROBATION')
  ), direct_member as (
    select m.geofence_id, m.employee_id
      from public.njhr_geofence_members m
     where coalesce(m.created_by,'') not like 'AUTO_SHIFT_%'
       and coalesce(m.created_by,'') not like 'BACKFILL_SHIFT_%'
  ), effective_member as (
    select geofence_id, employee_id from direct_member
    union
    select geofence_id, employee_id from derived
  )
  select g.id, g.name, coalesce(g.address,''), g.lat, g.lng, g.radius, g.max_accuracy, g.active,
         (select count(*)::int from effective_member em where em.geofence_id = g.id),
         coalesce((
           select jsonb_agg(jsonb_build_object(
                    'employee_id', e.id,
                    'emp_code', e.emp_code,
                    'name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                    'nickname', coalesce(e.nickname,''),
                    'department', coalesce(e.department_name,''))
                  order by e.emp_code)
             from effective_member em
             join public.employees e on e.id = em.employee_id
            where em.geofence_id = g.id
         ), '[]'::jsonb),
         g.updated_at, coalesce(g.updated_by,'')
    from public.njhr_geofences g
   where g.deleted_at is null
     and (
       q = ''
       or lower(g.name) like '%'||q||'%'
       or lower(coalesce(g.address,'')) like '%'||q||'%'
       or exists (
         select 1
           from effective_member em
           join public.employees e on e.id = em.employee_id
          where em.geofence_id = g.id
            and (
              lower(coalesce(e.emp_code,'')) like '%'||q||'%'
              or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
              or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            )
       )
     )
   order by g.name;
end
$function$;
