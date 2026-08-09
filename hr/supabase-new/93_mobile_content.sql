-- ============================================================
-- NJ HR V.10 — 93_mobile_content.sql
-- ส่วนที่มือถือต้องใช้แต่ฐานข้อมูลยังไม่มี: ผู้รับประกาศ · ประวัติอ่าน/รับทราบ ·
-- ปฏิทินบริษัท · ลบแจ้งเตือน · Web Push Subscription
--
-- ตรวจแล้วก่อนสร้าง (ไม่ทำซ้ำของเดิม)
--   notifications + njhr_notify_list/_unread/_read/_read_all  → มีครบแล้ว (42_core_migration.sql)
--     ขาดเฉพาะ "ลบแจ้งเตือน" จึงเพิ่มให้ตัวเดียว
--   company_announcements  → ตารางประกาศของ HR (77_announcements.sql)
--     ขาด ผู้รับ / ประวัติอ่าน / รับทราบ / รูป / ไฟล์แนบ / ประกาศสำคัญ
--   holidays               → วันหยุดเท่านั้น ไม่ใช่ปฏิทินกิจกรรม จึงสร้าง njhr_events ใหม่
--   announcement / announcement_read (ของแอป MASSENGER) → ห้ามแตะ ไม่เกี่ยวกับ HR
--
-- ไม่แตะ: attendance · leave_requests · ot_requests · payroll · Workflow · สูตรคำนวณใด ๆ
-- ต้องรัน 41 · 42 · 48 · 55 · 77 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.company_announcements') is null then
    raise exception 'PREFLIGHT: ไม่พบ company_announcements — รัน 77_announcements.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='company_announcements'
                    and column_name='is_active') then
    raise exception 'PREFLIGHT: company_announcements ยังไม่ถูกขยายโดย 77_announcements.sql';
  end if;
  if to_regclass('public.notifications') is null then
    raise exception 'PREFLIGHT: ไม่พบ notifications — รัน 42_core_migration.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · ประกาศ % รายการ · แจ้งเตือน % รายการ',
    (select count(*) from public.company_announcements),
    (select count(*) from public.notifications);
end $$;


-- ─── 1) ประกาศ: คอลัมน์เพิ่ม (additive ไม่แตะข้อมูลเดิม) ─────
alter table public.company_announcements add column if not exists is_important boolean not null default false;
alter table public.company_announcements add column if not exists require_ack  boolean not null default false;
alter table public.company_announcements add column if not exists image_path   text;
alter table public.company_announcements add column if not exists file_path    text;
alter table public.company_announcements add column if not exists file_name    text;
alter table public.company_announcements add column if not exists file_size    bigint;


-- ─── 2) ผู้รับประกาศ ────────────────────────────────────────
--  target_type: ALL · DEPARTMENT · POSITION · ROLE · EMPLOYEE
--  ไม่มีแถวเลย = ส่งถึงทุกคน (เท่ากับ ALL) เพื่อให้ประกาศเดิม 2 รายการยังเห็นได้ตามปกติ
create table if not exists public.njhr_ann_targets (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.company_announcements(id) on delete cascade,
  target_type     text not null,
  target_value    text,                       -- ชื่อแผนก / ตำแหน่ง / Role
  employee_id     uuid references public.employees(id) on delete cascade,
  created_at      timestamptz not null default now(),
  created_by      text
);
alter table public.njhr_ann_targets enable row level security;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_anntgt_type_chk') then
    alter table public.njhr_ann_targets add constraint njhr_anntgt_type_chk
      check (target_type in ('ALL','DEPARTMENT','POSITION','ROLE','EMPLOYEE'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_anntgt_value_chk') then
    alter table public.njhr_ann_targets add constraint njhr_anntgt_value_chk
      check ((target_type = 'EMPLOYEE' and employee_id is not null)
          or (target_type = 'ALL')
          or (target_type in ('DEPARTMENT','POSITION','ROLE') and coalesce(btrim(target_value),'') <> ''));
  end if;
end $$;
create index if not exists njhr_anntgt_ann_idx on public.njhr_ann_targets (announcement_id);
create index if not exists njhr_anntgt_emp_idx on public.njhr_ann_targets (employee_id);


-- ─── 3) ประวัติอ่าน / รับทราบ ───────────────────────────────
create table if not exists public.njhr_ann_reads (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.company_announcements(id) on delete cascade,
  employee_id     uuid not null references public.employees(id) on delete cascade,
  app_user_id     uuid,
  first_read_at   timestamptz not null default now(),
  last_read_at    timestamptz not null default now(),
  read_count      int not null default 1,
  acked_at        timestamptz,
  ack_device      text,
  ack_ip          text
);
alter table public.njhr_ann_reads enable row level security;
create unique index if not exists njhr_annread_uidx
  on public.njhr_ann_reads (announcement_id, employee_id);
create index if not exists njhr_annread_emp_idx on public.njhr_ann_reads (employee_id);


-- ─── 4) ปฏิทินบริษัท ────────────────────────────────────────
create table if not exists public.njhr_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  detail       text,
  event_type   text not null default 'ACTIVITY',
                -- HOLIDAY · MEETING · TRAINING · ACTIVITY · PAYROLL_CLOSE · DOC_DUE · OTHER
  start_date   date not null,
  end_date     date,
  start_time   time,
  end_time     time,
  all_day      boolean not null default true,
  location     text,
  color        text,
  file_path    text,
  file_name    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   text,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
alter table public.njhr_events enable row level security;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_event_type_chk') then
    alter table public.njhr_events add constraint njhr_event_type_chk
      check (event_type in ('HOLIDAY','MEETING','TRAINING','ACTIVITY','PAYROLL_CLOSE','DOC_DUE','OTHER'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_event_range_chk') then
    alter table public.njhr_events add constraint njhr_event_range_chk
      check (end_date is null or end_date >= start_date);
  end if;
end $$;
create index if not exists njhr_event_date_idx on public.njhr_events (start_date, is_active);

create table if not exists public.njhr_event_targets (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.njhr_events(id) on delete cascade,
  target_type  text not null,
  target_value text,
  employee_id  uuid references public.employees(id) on delete cascade,
  created_at   timestamptz not null default now()
);
alter table public.njhr_event_targets enable row level security;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_evttgt_type_chk') then
    alter table public.njhr_event_targets add constraint njhr_evttgt_type_chk
      check (target_type in ('ALL','DEPARTMENT','POSITION','ROLE','EMPLOYEE'));
  end if;
end $$;
create index if not exists njhr_evttgt_evt_idx on public.njhr_event_targets (event_id);


-- ─── 5) Web Push Subscription ───────────────────────────────
create table if not exists public.njhr_push_subs (
  id          uuid primary key default gen_random_uuid(),
  app_user_id uuid not null,
  employee_id uuid references public.employees(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  device      text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.njhr_push_subs enable row level security;
create unique index if not exists njhr_push_endpoint_uidx on public.njhr_push_subs (endpoint);
create index if not exists njhr_push_user_idx on public.njhr_push_subs (app_user_id, is_active);


-- ─── 6) ปิด policy ที่เปิดให้ anon ทั้งตาราง ─────────────────
do $$
declare pn text; tb text;
begin
  foreach tb in array array['njhr_ann_targets','njhr_ann_reads','njhr_events',
                            'njhr_event_targets','njhr_push_subs'] loop
    for pn in select policyname from pg_policies
               where schemaname='public' and tablename=tb
                 and 'anon' = any(roles) and (qual='true' or qual is null)
    loop execute format('drop policy %I on public.%I', pn, tb); end loop;
  end loop;
end $$;


-- ─── 7) สิทธิ์ + ตัวช่วยตรวจว่าประกาศ/กิจกรรมถึงพนักงานคนนี้ ─
create or replace function public.njhr_mc_guard(p_token text, p_manage boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);       -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if p_manage and c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการประกาศและปฏิทินบริษัท' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR'));
end $$;

-- ไม่มีแถวผู้รับเลย = ถึงทุกคน (ประกาศเดิมจึงยังเห็นได้ตามปกติ)
create or replace function public.njhr_mc_targeted(
  p_targets jsonb, p_employee uuid, p_dept text, p_position text, p_role text)
returns boolean language sql stable as $$
  select case when p_targets is null or jsonb_array_length(p_targets) = 0 then true
    else exists (
      select 1 from jsonb_array_elements(p_targets) t
       where (t->>'target_type') = 'ALL'
          or ((t->>'target_type') = 'EMPLOYEE' and (t->>'employee_id') = p_employee::text)
          or ((t->>'target_type') = 'DEPARTMENT' and upper(btrim(coalesce(t->>'target_value','')))
                = upper(btrim(coalesce(p_dept,''))))
          or ((t->>'target_type') = 'POSITION' and upper(btrim(coalesce(t->>'target_value','')))
                = upper(btrim(coalesce(p_position,''))))
          or ((t->>'target_type') = 'ROLE' and upper(btrim(coalesce(t->>'target_value','')))
                = upper(btrim(coalesce(p_role,'')))))
  end;
$$;


-- ─── 8) ฟีดประกาศของพนักงานคนนี้ ────────────────────────────
create or replace function public.njhr_ann_feed(
  p_token text, p_limit int default 20, p_offset int default 0, p_unread_only boolean default false)
returns table (id uuid, title text, content text, priority text, is_important boolean,
               require_ack boolean, image_path text, file_path text, file_name text,
               publish_at timestamptz, expire_at timestamptz,
               is_read boolean, acked boolean, unread_count bigint, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; lim int := least(greatest(coalesce(p_limit,20),1),100);
        v_now timestamptz := now();
begin
  select * into c from public.njhr_mc_guard(p_token, false);
  select coalesce(em.department_name,'') dept, coalesce(em.position_name,'') pos
    into e from public.employees em where em.id = c.employee_id;

  return query
  with vis as (
    select a.*,
           (select jsonb_agg(jsonb_build_object('target_type', t.target_type,
                     'target_value', t.target_value, 'employee_id', t.employee_id))
              from public.njhr_ann_targets t where t.announcement_id = a.id) tg
      from public.company_announcements a
     where coalesce(a.is_active,true)
       and coalesce(a.published_at, a.created_at, v_now) <= v_now
       and (a.expire_at is null or a.expire_at > v_now)
  ), mine as (
    select v.*, r.first_read_at, r.acked_at
      from vis v
      left join public.njhr_ann_reads r
        on r.announcement_id = v.id and r.employee_id = c.employee_id
     where c.employee_id is not null
       and public.njhr_mc_targeted(v.tg, c.employee_id, e.dept, e.pos, c.role)
  ), agg as (
    select count(*) filter (where first_read_at is null) u, count(*) t from mine
  )
  select m.id, m.title, coalesce(m.body,''), upper(coalesce(m.priority,'NORMAL')),
         coalesce(m.is_important,false), coalesce(m.require_ack,false),
         m.image_path, m.file_path, m.file_name,
         m.published_at, m.expire_at,
         (m.first_read_at is not null), (m.acked_at is not null),
         (select u from agg), (select t from agg)
    from mine m
   where (not coalesce(p_unread_only,false) or m.first_read_at is null)
   order by coalesce(m.is_important,false) desc,
            case upper(coalesce(m.priority,'NORMAL'))
              when 'URGENT' then 0 when 'HIGH' then 1 when 'NORMAL' then 2 else 3 end,
            coalesce(m.published_at, m.created_at) desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 9) เปิดอ่าน / กดรับทราบ ────────────────────────────────
create or replace function public.njhr_ann_read(p_token text, p_id uuid)
returns table (is_read boolean, unread_count bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; n bigint;
begin
  select * into c from public.njhr_mc_guard(p_token, false);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน' using errcode='42501';
  end if;
  if not exists (select 1 from public.company_announcements a where a.id = p_id) then
    raise exception 'ไม่พบประกาศนี้' using errcode='P0002';
  end if;

  insert into public.njhr_ann_reads(announcement_id, employee_id, app_user_id)
  values (p_id, c.employee_id, c.app_user_id)
  on conflict (announcement_id, employee_id) do update
    set last_read_at = now(), read_count = njhr_ann_reads.read_count + 1;

  select count(*) into n from public.njhr_ann_feed(p_token, 100, 0, true);
  return query select true, n;
end $$;

create or replace function public.njhr_ann_ack(
  p_token text, p_id uuid, p_device text default null)
returns table (acked boolean, acked_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_mc_guard(p_token, false);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน' using errcode='42501';
  end if;

  insert into public.njhr_ann_reads(announcement_id, employee_id, app_user_id, acked_at, ack_device)
  values (p_id, c.employee_id, c.app_user_id, now(), nullif(btrim(coalesce(p_device,'')),''))
  on conflict (announcement_id, employee_id) do update
    set acked_at = coalesce(njhr_ann_reads.acked_at, now()),
        ack_device = coalesce(njhr_ann_reads.ack_device, excluded.ack_device),
        last_read_at = now();

  perform public.njhr_audit_write(p_token, 'ANN_ACK', 'announcement',
    'company_announcements', p_id::text, 'กดรับทราบประกาศ', null, null, null);

  return query select true, r.acked_at from public.njhr_ann_reads r
   where r.announcement_id = p_id and r.employee_id = c.employee_id;
end $$;


-- ─── 10) ผู้ดูแล: กำหนดผู้รับ + ดูว่าใครอ่าน/รับทราบแล้ว ─────
--  p_targets = [{"target_type":"DEPARTMENT","target_value":"SHIPPING BKK"}, ...]
create or replace function public.njhr_ann_targets_save(
  p_token text, p_id uuid, p_targets jsonb)
returns table (announcement_id uuid, target_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; t jsonb; v_n int := 0;
begin
  select * into c from public.njhr_mc_guard(p_token, true);
  if not exists (select 1 from public.company_announcements a where a.id = p_id) then
    raise exception 'ไม่พบประกาศนี้' using errcode='P0002';
  end if;

  delete from public.njhr_ann_targets where njhr_ann_targets.announcement_id = p_id;
  if p_targets is not null and jsonb_typeof(p_targets) = 'array' then
    for t in select * from jsonb_array_elements(p_targets) loop
      insert into public.njhr_ann_targets(announcement_id, target_type, target_value,
                                          employee_id, created_by)
      values (p_id, upper(btrim(coalesce(t->>'target_type','ALL'))),
              nullif(btrim(coalesce(t->>'target_value','')),''),
              nullif(t->>'employee_id','')::uuid, c.username);
      v_n := v_n + 1;
    end loop;
  end if;

  perform public.njhr_audit_write(p_token, 'ANN_TARGETS', 'announcement',
    'company_announcements', p_id::text, 'กำหนดผู้รับประกาศ ' || v_n || ' เงื่อนไข',
    null, null, null);

  return query select p_id, v_n;
end $$;

create or replace function public.njhr_ann_readers(p_token text, p_id uuid)
returns table (employee_id uuid, emp_code text, full_name text, department_name text,
               read_at timestamptz, acked_at timestamptz, status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_tg jsonb;
begin
  select * into c from public.njhr_mc_guard(p_token, true);
  select jsonb_agg(jsonb_build_object('target_type', t.target_type,
           'target_value', t.target_value, 'employee_id', t.employee_id)) into v_tg
    from public.njhr_ann_targets t where t.announcement_id = p_id;

  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.department_name,''),
         r.first_read_at, r.acked_at,
         case when r.acked_at is not null then 'รับทราบแล้ว'
              when r.first_read_at is not null then 'อ่านแล้ว'
              else 'ยังไม่อ่าน' end
    from public.employees e
    left join public.njhr_ann_reads r
      on r.announcement_id = p_id and r.employee_id = e.id
   where e.status::text in ('ACTIVE','PROBATION')
     and public.njhr_mc_targeted(v_tg, e.id, coalesce(e.department_name,''),
                                 coalesce(e.position_name,''), null)
   order by (r.acked_at is not null), (r.first_read_at is not null), e.emp_code;
end $$;


-- ─── 11) ปฏิทินบริษัท ───────────────────────────────────────
create or replace function public.njhr_event_list(
  p_token text, p_from date default null, p_to date default null, p_limit int default 100)
returns table (id uuid, title text, detail text, event_type text,
               start_date date, end_date date, start_time time, end_time time,
               all_day boolean, location text, color text,
               file_path text, file_name text, source text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; lim int := least(greatest(coalesce(p_limit,100),1),500);
        v_from date := coalesce(p_from, (now() at time zone 'Asia/Bangkok')::date);
        v_to date := coalesce(p_to, v_from + 90);
begin
  select * into c from public.njhr_mc_guard(p_token, false);
  select coalesce(em.department_name,'') dept, coalesce(em.position_name,'') pos
    into e from public.employees em where em.id = c.employee_id;

  return query
  -- กิจกรรมบริษัท
  select v.id, v.title, coalesce(v.detail,''), v.event_type,
         v.start_date, v.end_date, v.start_time, v.end_time,
         v.all_day, coalesce(v.location,''), coalesce(v.color,''),
         v.file_path, v.file_name, 'EVENT'::text
    from (select ev.*,
                 (select jsonb_agg(jsonb_build_object('target_type', t.target_type,
                           'target_value', t.target_value, 'employee_id', t.employee_id))
                    from public.njhr_event_targets t where t.event_id = ev.id) tg
            from public.njhr_events ev
           where ev.is_active
             and ev.start_date <= v_to
             and coalesce(ev.end_date, ev.start_date) >= v_from) v
   where c.is_admin or public.njhr_mc_targeted(v.tg, c.employee_id, e.dept, e.pos, c.role)
  union all
  -- วันหยุดบริษัทจากตาราง holidays เดิม (ไม่ย้ายข้อมูล ไม่สร้างซ้ำ)
  select h.id, h.name, ''::text, 'HOLIDAY'::text,
         h.holiday_date, h.holiday_date, null::time, null::time,
         true, ''::text, ''::text, null::text, null::text, 'HOLIDAY'::text
    from public.holidays h
   where h.holiday_date between v_from and v_to
   order by 5, 7 nulls first
   limit lim;
end $$;

create or replace function public.njhr_event_save(
  p_token text, p_id uuid default null, p_title text default null,
  p_detail text default null, p_event_type text default 'ACTIVITY',
  p_start_date date default null, p_end_date date default null,
  p_start_time time default null, p_end_time time default null,
  p_all_day boolean default true, p_location text default null,
  p_color text default null, p_file jsonb default null,
  p_targets jsonb default null)
returns table (id uuid, title text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; t jsonb; oldrow jsonb;
        v_title text := btrim(coalesce(p_title,''));
        v_type text := upper(btrim(coalesce(p_event_type,'ACTIVITY')));
begin
  select * into c from public.njhr_mc_guard(p_token, true);
  if v_title = '' then raise exception 'กรุณาระบุชื่อกิจกรรม' using errcode='22023'; end if;
  if p_start_date is null then raise exception 'กรุณาระบุวันที่เริ่ม' using errcode='22023'; end if;
  if p_end_date is not null and p_end_date < p_start_date then
    raise exception 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม' using errcode='22023';
  end if;

  if p_id is null then
    insert into public.njhr_events(title, detail, event_type, start_date, end_date,
      start_time, end_time, all_day, location, color, file_path, file_name,
      created_by, updated_by)
    select v_title, nullif(btrim(coalesce(p_detail,'')),''), v_type, p_start_date, p_end_date,
           p_start_time, p_end_time, coalesce(p_all_day,true),
           nullif(btrim(coalesce(p_location,'')),''), nullif(btrim(coalesce(p_color,'')),''),
           nullif(p_file->>'path',''), nullif(p_file->>'name',''),
           c.username, c.username
    returning njhr_events.id into v_id;
  else
    select to_jsonb(x) into oldrow from public.njhr_events x where x.id = p_id;
    if oldrow is null then raise exception 'ไม่พบกิจกรรมนี้' using errcode='P0002'; end if;
    update public.njhr_events
       set title = v_title, detail = nullif(btrim(coalesce(p_detail,'')),''),
           event_type = v_type, start_date = p_start_date, end_date = p_end_date,
           start_time = p_start_time, end_time = p_end_time,
           all_day = coalesce(p_all_day,true),
           location = nullif(btrim(coalesce(p_location,'')),''),
           color = nullif(btrim(coalesce(p_color,'')),''),
           file_path = coalesce(nullif(p_file->>'path',''), file_path),
           file_name = coalesce(nullif(p_file->>'name',''), file_name),
           updated_at = now(), updated_by = c.username
     where njhr_events.id = p_id;
    v_id := p_id;
  end if;

  if p_targets is not null then
    delete from public.njhr_event_targets where event_id = v_id;
    for t in select * from jsonb_array_elements(p_targets) loop
      insert into public.njhr_event_targets(event_id, target_type, target_value, employee_id)
      values (v_id, upper(btrim(coalesce(t->>'target_type','ALL'))),
              nullif(btrim(coalesce(t->>'target_value','')),''),
              nullif(t->>'employee_id','')::uuid);
    end loop;
  end if;

  perform public.njhr_audit_write(p_token,
    case when p_id is null then 'EVENT_ADD' else 'EVENT_EDIT' end,
    'calendar', 'njhr_events', v_id::text, v_title || ' · ' || p_start_date::text,
    oldrow, (select to_jsonb(x) from public.njhr_events x where x.id = v_id), null);

  return query select x.id, x.title from public.njhr_events x where x.id = v_id;
end $$;

create or replace function public.njhr_event_delete(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb;
begin
  select * into c from public.njhr_mc_guard(p_token, true);
  select to_jsonb(x) into oldrow from public.njhr_events x where x.id = p_id;
  if oldrow is null then raise exception 'ไม่พบกิจกรรมนี้' using errcode='P0002'; end if;
  update public.njhr_events set is_active = false, updated_at = now(), updated_by = c.username
   where njhr_events.id = p_id;
  perform public.njhr_audit_write(p_token, 'EVENT_DELETE', 'calendar', 'njhr_events',
    p_id::text, 'ปิดใช้งานกิจกรรม', oldrow, null, null);
  return true;
end $$;


-- ─── 12) แจ้งเตือน: เพิ่มเฉพาะ "ลบ" (ของเดิมมี list/unread/read/read_all แล้ว) ──
create or replace function public.njhr_notify_delete(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  delete from public.notifications
   where notifications.id = p_id and notifications.user_id = c.app_user_id;
  return found;                                  -- ของคนอื่น = ไม่มีผล ไม่ error ให้เดาได้
end $$;


-- ─── 13) Web Push ───────────────────────────────────────────
create or replace function public.njhr_push_subscribe(
  p_token text, p_endpoint text, p_p256dh text, p_auth text,
  p_user_agent text default null, p_device text default null)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if coalesce(btrim(p_endpoint),'') = '' or coalesce(btrim(p_p256dh),'') = ''
     or coalesce(btrim(p_auth),'') = '' then
    raise exception 'ข้อมูลการสมัครรับแจ้งเตือนไม่ครบ' using errcode='22023';
  end if;
  insert into public.njhr_push_subs(app_user_id, employee_id, endpoint, p256dh, auth,
                                    user_agent, device)
  values (c.app_user_id, c.employee_id, btrim(p_endpoint), btrim(p_p256dh), btrim(p_auth),
          nullif(btrim(coalesce(p_user_agent,'')),''), nullif(btrim(coalesce(p_device,'')),''))
  on conflict (endpoint) do update
    set app_user_id = c.app_user_id, employee_id = c.employee_id,
        p256dh = excluded.p256dh, auth = excluded.auth,
        is_active = true, last_seen_at = now();
  return true;
end $$;

create or replace function public.njhr_push_unsubscribe(p_token text, p_endpoint text)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  update public.njhr_push_subs set is_active = false, last_seen_at = now()
   where endpoint = btrim(p_endpoint) and app_user_id = c.app_user_id;
  return found;
end $$;


-- ─── 14) GRANT ──────────────────────────────────────────────
revoke execute on function public.njhr_mc_guard(text, boolean) from public, anon, authenticated;
grant execute on function public.njhr_mc_targeted(jsonb,uuid,text,text,text)   to anon, authenticated;
grant execute on function public.njhr_ann_feed(text,int,int,boolean)           to anon, authenticated;
grant execute on function public.njhr_ann_read(text,uuid)                      to anon, authenticated;
grant execute on function public.njhr_ann_ack(text,uuid,text)                  to anon, authenticated;
grant execute on function public.njhr_ann_targets_save(text,uuid,jsonb)        to anon, authenticated;
grant execute on function public.njhr_ann_readers(text,uuid)                   to anon, authenticated;
grant execute on function public.njhr_event_list(text,date,date,int)           to anon, authenticated;
grant execute on function public.njhr_event_save(text,uuid,text,text,text,date,date,time,time,boolean,text,text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.njhr_event_delete(text,uuid)                  to anon, authenticated;
grant execute on function public.njhr_notify_delete(text,uuid)                 to anon, authenticated;
grant execute on function public.njhr_push_subscribe(text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.njhr_push_unsubscribe(text,text)              to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.2-mobile-content', 'ผู้รับประกาศ + ประวัติอ่าน/รับทราบ + ปฏิทินบริษัท + ลบแจ้งเตือน + Web Push')
on conflict (version) do nothing;


-- ─── 15) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', (select jsonb_object_agg(t, to_regclass('public.'||t) is not null)
               from unnest(array['njhr_ann_targets','njhr_ann_reads','njhr_events',
                                 'njhr_event_targets','njhr_push_subs']) t),
  'ann_columns', (select jsonb_agg(column_name order by ordinal_position)
                    from information_schema.columns
                   where table_schema='public' and table_name='company_announcements'),
  'anon_policies', coalesce((select count(*) from pg_policies
                              where schemaname='public'
                                and tablename in ('njhr_ann_targets','njhr_ann_reads','njhr_events',
                                                  'njhr_event_targets','njhr_push_subs')
                                and 'anon' = any(roles)), 0),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public'
                   and (p.proname like 'njhr\_ann\_%' or p.proname like 'njhr\_event\_%'
                        or p.proname like 'njhr\_push\_%' or p.proname = 'njhr_notify_delete')),
  'announcements', (select count(*) from public.company_announcements),
  'holidays', (select count(*) from public.holidays),
  'schema_versions', (select jsonb_agg(version order by version) from public.njhr_schema_version)
)) as install_report;
