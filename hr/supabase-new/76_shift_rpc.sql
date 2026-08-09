-- ============================================================
-- NJ HR V.10 — 76_shift_rpc.sql
-- A) ตั้งค่ากะทำงาน — RPC ครบชุดบนตารางจริง work_shifts / employee_shifts
--
-- คอลัมน์ที่ยืนยันแล้วจากโค้ดจริง (njhr_shift_at ใน 51_core_schema.sql)
--   work_shifts     : id · shift_name · start_time · end_time · break_minutes
--                     late_allow_minutes · ot_start_after · working_days · is_overnight
--   employee_shifts : employee_id · shift_id · effective_date · status
--
-- ทุกอย่างที่ไม่ยืนยัน จะไม่ถูกใช้ และ PREFLIGHT จะหยุดพร้อมพิมพ์คอลัมน์จริงออกมา
-- ไม่มีการเดาชื่อคอลัมน์ · ไม่สร้างตารางซ้ำ · ไม่แตะ njhr_shift_at เดิม
--
-- หมายเหตุเรื่อง auth.uid()
--   ระบบนี้ไม่ได้ใช้ Supabase Auth แต่ใช้ Auth ของตัวเอง (app_users + njhr_sessions)
--   auth.uid() จึงเป็น null เสมอ · การพิสูจน์ตัวตนที่ถูกต้องของโปรเจกต์นี้คือ njhr_ctx(p_token)
--   ซึ่งอ่าน session จากตารางจริงและตรวจวันหมดอายุ — ใช้แบบเดียวกับ RPC เดิมทุกตัว
--
-- ต้องรัน 41 · 42 · 48 · 51 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT — ยืนยันคอลัมน์จริง ห้ามเดา ────────────────
do $$
declare miss text; act text;
begin
  if to_regclass('public.work_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง work_shifts';
  end if;
  if to_regclass('public.employee_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employee_shifts';
  end if;

  select string_agg(c, ', ') into miss from unnest(array[
    'id','shift_name','start_time','end_time','break_minutes',
    'late_allow_minutes','ot_start_after','working_days','is_overnight']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='work_shifts'
                        and column_name = c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='work_shifts';
    raise exception 'PREFLIGHT: work_shifts ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  select string_agg(c, ', ') into miss from unnest(array[
    'employee_id','shift_id','effective_date']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employee_shifts'
                        and column_name = c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='employee_shifts';
    raise exception 'PREFLIGHT: employee_shifts ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  raise notice 'PREFLIGHT ผ่าน · work_shifts % แถว · employee_shifts % แถว',
    (select count(*) from public.work_shifts), (select count(*) from public.employee_shifts);
end $$;


-- ─── 1) คอลัมน์เสริมที่จำเป็น (เพิ่มเฉพาะที่ยังไม่มี) ─────────
-- ระบบเดิมไม่มีธงเปิด/ปิดใช้งานกะ · เพิ่มแบบ additive ค่าเริ่มต้น true
-- กะเดิมทุกแถวจึงยังเปิดใช้งานตามเดิม ไม่มีพฤติกรรมใดเปลี่ยน
alter table public.work_shifts     add column if not exists is_active   boolean not null default true;
alter table public.work_shifts     add column if not exists updated_at  timestamptz;
alter table public.work_shifts     add column if not exists updated_by  text;
alter table public.employee_shifts add column if not exists status      text;
alter table public.employee_shifts add column if not exists assigned_by text;
alter table public.employee_shifts add column if not exists assigned_at timestamptz default now();

create index if not exists njhr_ws_active_idx on public.work_shifts (is_active, shift_name);


-- ─── 2) ตัวตรวจสิทธิ์ (แบบเดียวกับ njhr_*_guard เดิม) ────────
create or replace function public.njhr_shift_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role มาจากฐานข้อมูล ไม่รับจาก Frontend
  if p_write and c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการกะทำงาน' using errcode = '42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER'));
end $$;


-- ─── 3) njhr_shift_list — กะทั้งหมด + จำนวนพนักงานที่ใช้อยู่ ──
create or replace function public.njhr_shift_list(
  p_token text, p_include_inactive boolean default true)
returns table (
  id uuid, shift_name text, start_time time, end_time time,
  break_minutes int, late_allow_minutes int, ot_start_after time,
  working_days text, is_overnight boolean, is_active boolean,
  employee_count bigint, updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select w.id, w.shift_name, w.start_time, w.end_time,
         coalesce(w.break_minutes,0), coalesce(w.late_allow_minutes,0), w.ot_start_after,
         w.working_days, w.is_overnight, w.is_active,
         (select count(distinct es.employee_id) from public.employee_shifts es
            join public.employees e on e.id = es.employee_id
           where es.shift_id = w.id
             and coalesce(es.status,'ACTIVE') = 'ACTIVE'
             and e.status::text in ('ACTIVE','PROBATION')
             -- นับเฉพาะกะที่ "มีผลล่าสุด" ของพนักงานคนนั้น ไม่นับประวัติเก่า
             and es.effective_date = (select max(es2.effective_date)
                                        from public.employee_shifts es2
                                       where es2.employee_id = es.employee_id
                                         and coalesce(es2.status,'ACTIVE') = 'ACTIVE'
                                         and es2.effective_date <= current_date)),
         w.updated_at, w.updated_by
    from public.work_shifts w
   where (coalesce(p_include_inactive,true) or w.is_active)
   order by w.is_active desc, w.start_time, w.shift_name;
end $$;


-- ─── 4) njhr_shift_save — เพิ่ม / แก้ไขกะ ────────────────────
create or replace function public.njhr_shift_save(
  p_token text, p_id uuid default null, p_shift_name text default null,
  p_start_time time default null, p_end_time time default null,
  p_break_minutes int default 0, p_late_allow_minutes int default 0,
  p_ot_start_after time default null, p_working_days text default null)
returns table (id uuid, shift_name text, is_overnight boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; v_id uuid;
        v_name text := btrim(coalesce(p_shift_name,''));
        v_brk int := coalesce(p_break_minutes,0);
        v_late int := coalesce(p_late_allow_minutes,0);
        v_ovn boolean;
begin
  select * into c from public.njhr_shift_guard(p_token, true);

  if v_name = '' then raise exception 'กรุณาระบุชื่อกะ' using errcode='22023'; end if;
  if p_start_time is null or p_end_time is null then
    raise exception 'กรุณาระบุเวลาเริ่มงานและเวลาเลิกงาน' using errcode='22023';
  end if;
  if p_start_time = p_end_time then
    raise exception 'เวลาเริ่มงานและเวลาเลิกงานต้องไม่เท่ากัน' using errcode='22023';
  end if;
  if v_brk < 0 or v_brk > 480 then
    raise exception 'นาทีพักต้องอยู่ระหว่าง 0–480 นาที' using errcode='22023';
  end if;
  if v_late < 0 or v_late > 240 then
    raise exception 'นาทีอนุโลมมาสายต้องอยู่ระหว่าง 0–240 นาที' using errcode='22023';
  end if;

  -- ชื่อกะห้ามซ้ำ (ไม่สนตัวพิมพ์ · ไม่นับตัวเอง)
  if exists (select 1 from public.work_shifts w
              where lower(btrim(w.shift_name)) = lower(v_name)
                and (p_id is null or w.id <> p_id)) then
    raise exception 'มีกะชื่อ "%" อยู่แล้ว', v_name using errcode='23505';
  end if;

  v_ovn := (p_end_time < p_start_time);          -- กะข้ามวัน คำนวณอัตโนมัติแบบเดิม

  if p_id is null then
    insert into public.work_shifts(shift_name, start_time, end_time, break_minutes,
      late_allow_minutes, ot_start_after, working_days, is_overnight, is_active,
      updated_at, updated_by)
    values (v_name, p_start_time, p_end_time, v_brk, v_late, p_ot_start_after,
            p_working_days, v_ovn, true, now(), c.username)
    returning work_shifts.id into v_id;

    perform public.njhr_audit_write(p_token, 'SHIFT_CREATE', 'shift', 'work_shifts', v_id::text,
      'สร้างกะ ' || v_name || ' ' || p_start_time::text || '–' || p_end_time::text,
      null, (select to_jsonb(x) from public.work_shifts x where x.id = v_id), null);
  else
    select * into old from public.work_shifts where work_shifts.id = p_id;
    if not found then raise exception 'ไม่พบกะนี้' using errcode='P0002'; end if;

    update public.work_shifts
       set shift_name = v_name, start_time = p_start_time, end_time = p_end_time,
           break_minutes = v_brk, late_allow_minutes = v_late,
           ot_start_after = p_ot_start_after, working_days = p_working_days,
           is_overnight = v_ovn, updated_at = now(), updated_by = c.username
     where work_shifts.id = p_id;
    v_id := p_id;

    perform public.njhr_audit_write(p_token, 'SHIFT_EDIT', 'shift', 'work_shifts', v_id::text,
      'แก้ไขกะ ' || v_name, to_jsonb(old),
      (select to_jsonb(x) from public.work_shifts x where x.id = v_id), null);
  end if;

  return query select w.id, w.shift_name, w.is_overnight
                 from public.work_shifts w where w.id = v_id;
end $$;


-- ─── 5) njhr_shift_set_active — เปิด/ปิดใช้งานกะ ─────────────
--  ปิดกะที่ยังมีพนักงานใช้อยู่ต้องยืนยันด้วย p_force = true
create or replace function public.njhr_shift_set_active(
  p_token text, p_id uuid, p_active boolean, p_force boolean default false)
returns table (id uuid, is_active boolean, employee_count bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; n bigint;
begin
  select * into c from public.njhr_shift_guard(p_token, true);
  select * into old from public.work_shifts where work_shifts.id = p_id;
  if not found then raise exception 'ไม่พบกะนี้' using errcode='P0002'; end if;

  select count(distinct es.employee_id) into n
    from public.employee_shifts es join public.employees e on e.id = es.employee_id
   where es.shift_id = p_id and coalesce(es.status,'ACTIVE') = 'ACTIVE'
     and e.status::text in ('ACTIVE','PROBATION');

  if p_active is not true and n > 0 and coalesce(p_force,false) is not true then
    raise exception 'กะนี้ยังมีพนักงานใช้งานอยู่ % คน — ย้ายกะให้พนักงานก่อน หรือยืนยันเพื่อปิดใช้งาน', n
      using errcode='23503';
  end if;

  update public.work_shifts
     set is_active = coalesce(p_active,true), updated_at = now(), updated_by = c.username
   where work_shifts.id = p_id;

  perform public.njhr_audit_write(p_token,
    case when p_active then 'SHIFT_ENABLE' else 'SHIFT_DISABLE' end,
    'shift', 'work_shifts', p_id::text,
    old.shift_name || ' · พนักงานที่ใช้กะนี้ ' || n || ' คน', to_jsonb(old),
    (select to_jsonb(x) from public.work_shifts x where x.id = p_id), null);

  return query select w.id, w.is_active, n from public.work_shifts w where w.id = p_id;
end $$;


-- ─── 6) njhr_shift_employee_list — พนักงานในกะที่เลือก ───────
create or replace function public.njhr_shift_employee_list(p_token text, p_shift uuid)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text, effective_date date)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text, cur.effective_date
    from public.employees e
    join lateral (
      select es.shift_id, es.effective_date
        from public.employee_shifts es
       where es.employee_id = e.id
         and coalesce(es.status,'ACTIVE') = 'ACTIVE'
         and (es.effective_date is null or es.effective_date <= current_date)
       order by es.effective_date desc nulls last
       limit 1) cur on true
   where cur.shift_id = p_shift
     and e.status::text in ('ACTIVE','PROBATION')
   order by e.emp_code;
end $$;


-- ─── 7) njhr_shift_assign — ผูกกะ (เพิ่มประวัติใหม่เสมอ) ─────
--  ไม่แก้ทับประวัติเดิม · กันซ้ำวันเดียวกันด้วยการอัปเดตแถวของวันนั้นแทน
create or replace function public.njhr_shift_assign(
  p_token text, p_employee uuid, p_shift uuid, p_effective_date date default null)
returns table (employee_id uuid, shift_id uuid, effective_date date, replaced boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; w record; v_date date := coalesce(p_effective_date, current_date);
        old record; v_replaced boolean := false;
begin
  select * into c from public.njhr_shift_guard(p_token, true);

  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  select * into w from public.work_shifts where id = p_shift;
  if not found then raise exception 'ไม่พบกะที่เลือก' using errcode='P0002'; end if;
  if w.is_active is not true then
    raise exception 'กะ "%" ถูกปิดใช้งานอยู่ ผูกพนักงานเข้ากะนี้ไม่ได้', w.shift_name
      using errcode='22023';
  end if;

  -- มีประวัติของวันนั้นอยู่แล้ว → แก้แถวของวันนั้น (ไม่สร้างซ้ำ) · ประวัติวันอื่นไม่ถูกแตะ
  select * into old from public.employee_shifts es
   where es.employee_id = p_employee and es.effective_date = v_date;
  if found then
    if old.shift_id = p_shift and coalesce(old.status,'ACTIVE') = 'ACTIVE' then
      return query select p_employee, p_shift, v_date, false;   -- เหมือนเดิม ไม่ต้องทำอะไร
      return;
    end if;
    update public.employee_shifts
       set shift_id = p_shift, status = 'ACTIVE',
           assigned_by = c.username, assigned_at = now()
     where employee_shifts.employee_id = p_employee
       and employee_shifts.effective_date = v_date;
    v_replaced := true;
  else
    insert into public.employee_shifts(employee_id, shift_id, effective_date,
                                       status, assigned_by, assigned_at)
    values (p_employee, p_shift, v_date, 'ACTIVE', c.username, now());
  end if;

  perform public.njhr_audit_write(p_token, 'SHIFT_ASSIGN', 'shift', 'employee_shifts',
    p_employee::text,
    e.emp_code || ' → กะ ' || w.shift_name || ' มีผล ' || to_char(v_date,'DD/MM/YYYY') ||
    case when v_replaced then ' (แทนที่รายการของวันเดียวกัน)' else '' end,
    case when v_replaced then to_jsonb(old) else null end,
    (select to_jsonb(x) from public.employee_shifts x
      where x.employee_id = p_employee and x.effective_date = v_date), null);

  return query select p_employee, p_shift, v_date, v_replaced;
end $$;


-- ─── 8) njhr_shift_unassigned_employees — ยังไม่มีกะ ─────────
create or replace function public.njhr_shift_unassigned_employees(
  p_token text, p_q text default null, p_limit int default 200)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,200),1),1000);
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text
    from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
     and not exists (
       select 1 from public.employee_shifts es
        where es.employee_id = e.id
          and coalesce(es.status,'ACTIVE') = 'ACTIVE'
          and (es.effective_date is null or es.effective_date <= current_date))
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit lim;
end $$;


-- ─── 9) GRANT ───────────────────────────────────────────────
revoke execute on function public.njhr_shift_guard(text, boolean) from public, anon, authenticated;
grant  execute on function public.njhr_shift_list(text, boolean)                            to anon, authenticated;
grant  execute on function public.njhr_shift_save(text,uuid,text,time,time,int,int,time,text) to anon, authenticated;
grant  execute on function public.njhr_shift_set_active(text,uuid,boolean,boolean)          to anon, authenticated;
grant  execute on function public.njhr_shift_employee_list(text,uuid)                       to anon, authenticated;
grant  execute on function public.njhr_shift_assign(text,uuid,uuid,date)                    to anon, authenticated;
grant  execute on function public.njhr_shift_unassigned_employees(text,text,int)            to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.0-shift-rpc', 'ตั้งค่ากะทำงาน: 6 RPC บน work_shifts / employee_shifts จริง')
on conflict (version) do nothing;


-- ─── 10) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'work_shifts_columns', (select jsonb_agg(column_name order by ordinal_position)
                            from information_schema.columns
                           where table_schema='public' and table_name='work_shifts'),
  'employee_shifts_columns', (select jsonb_agg(column_name order by ordinal_position)
                                from information_schema.columns
                               where table_schema='public' and table_name='employee_shifts'),
  'functions', (select jsonb_agg(p.proname order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_shift\_%'),
  'shifts', (select jsonb_agg(jsonb_build_object('name', w.shift_name,
               'time', w.start_time::text||'–'||w.end_time::text,
               'active', w.is_active) order by w.shift_name) from public.work_shifts w),
  'employees_active', (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
  'employees_with_shift', (select count(distinct employee_id) from public.employee_shifts
                            where coalesce(status,'ACTIVE')='ACTIVE')
)) as install_report;
