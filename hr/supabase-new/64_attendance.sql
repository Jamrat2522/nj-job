-- ============================================================
-- NJ HR V.10 — 64_attendance.sql   [รอบ 1/3 ของการย้ายไป Supabase]
-- ระบบลงเวลา + รายงานลงเวลา/มาสาย: ย้ายจาก localStorage ไปฐานข้อมูลจริง
--
-- โครงสร้างจริงที่ตรวจแล้ว (ห้ามเปลี่ยน):
--   attendance = id uuid PK · employee_id uuid FK→employees ON DELETE CASCADE
--                work_date date NOT NULL · check_in timestamptz · check_out timestamptz
--                work_hours numeric · status attendance_status · created_at
--                UNIQUE (employee_id, work_date)
--   attendance_status = NORMAL · LATE · ABSENT · LEAVE · HOLIDAY
--   ⚠️ ไม่มีคอลัมน์ shift_id / source / note → ข้อมูลเดิมใน localStorage ส่วนนี้จะไม่ถูกย้าย
--
-- ใช้ของเดิม: njhr_shift_at() นับนาทีสายต่อกะ (51_core_schema) · holidays ผ่าน njhr_leave_workdays
-- ไม่แตะ: employees · payroll · leave_requests · ot_requests · โครงสร้าง attendance
-- ต้องรัน 48_employees.sql และ 51_core_schema.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.attendance') is null then raise exception 'PREFLIGHT: ไม่พบตาราง attendance'; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='attendance'
     and column_name in ('employee_id','work_date','check_in','check_out','work_hours','status');
  if n <> 6 then raise exception 'PREFLIGHT: attendance ขาดคอลัมน์ที่ต้องใช้ (พบ %)', n; end if;
  if not exists (select 1 from pg_constraint c join pg_class r on r.oid=c.conrelid
                  where r.relname='attendance' and c.contype='u') then
    raise exception 'PREFLIGHT: attendance ไม่มี UNIQUE key — ต้องมี (employee_id, work_date)';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_shift_at') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_shift_at — รัน 51_core_schema.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create index if not exists njhr_att_date_idx on public.attendance (work_date desc);
create index if not exists njhr_att_emp_idx  on public.attendance (employee_id, work_date desc);

insert into public.njhr_schema_version(version, note)
values ('v11.9-attendance', 'ลงเวลา + รายงานลงเวลา/มาสาย อ่านเขียนบน Supabase')
on conflict (version) do nothing;


-- ─── 1) สิทธิ์ ───────────────────────────────────────────────
-- ผู้ดูแลดูได้ทุกคน · พนักงานทั่วไปดูได้เฉพาะของตนเอง
create or replace function public.njhr_att_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER'));
end $$;

-- นาทีสายของวันหนึ่ง: อ่านกะที่มีผล ณ วันนั้น + นาทีอนุโลมของกะนั้น (ไม่ Hardcode 15 นาที)
create or replace function public.njhr_att_late_min(p_employee uuid, p_date date, p_in timestamptz)
returns int language plpgsql stable security definer set search_path = public as $$
declare sh record; v_start timestamptz; v_lim timestamptz;
begin
  if p_in is null then return 0; end if;
  select * into sh from public.njhr_shift_at(p_employee, p_date);
  if not found then return 0; end if;
  v_start := (p_date::text || ' ' || sh.start_time::text)::timestamp at time zone 'Asia/Bangkok';
  v_lim := v_start + make_interval(mins => coalesce(sh.late_allow_minutes, 0));
  if p_in <= v_lim then return 0; end if;
  return greatest(0, (extract(epoch from (p_in - v_start)) / 60)::int);
end $$;


-- ─── 2) ลงเวลาเข้า / ออก (upsert ผ่าน UNIQUE key) ────────────
create or replace function public.njhr_att_punch(
  p_token text, p_action text, p_at timestamptz default null)
returns table (work_date date, check_in timestamptz, check_out timestamptz,
               status text, work_hours numeric, late_min int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_act text := upper(btrim(coalesce(p_action,'')));
        v_now timestamptz := coalesce(p_at, now()); v_date date; v_late int; sh record; v_row record;
begin
  select * into c from public.njhr_att_guard(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงลงเวลาไม่ได้' using errcode='28000';
  end if;
  if v_act not in ('IN','OUT') then
    raise exception 'การลงเวลาไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;
  v_date := (v_now at time zone 'Asia/Bangkok')::date;

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
    -- กะข้ามวัน: ถ้าวันนี้ยังไม่ลงเข้า ให้ปิดใบของเมื่อวานที่ยังค้าง
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

  perform public.njhr_audit_write(p_token,
    case when v_act = 'IN' then 'CHECK_IN' else 'CHECK_OUT' end, 'attendance', 'attendance', null,
    to_char(v_now at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI'), null, null, null);

  return query
  select a.work_date, a.check_in, a.check_out, a.status::text, a.work_hours,
         public.njhr_att_late_min(a.employee_id, a.work_date, a.check_in)
    from public.attendance a
   where a.employee_id = c.employee_id and a.work_date = v_date;
end $$;


-- ─── 3) สถานะการลงเวลาวันนี้ ─────────────────────────────────
create or replace function public.njhr_att_today(p_token text)
returns table (work_date date, check_in timestamptz, check_out timestamptz,
               status text, work_hours numeric, late_min int,
               shift_name text, shift_start time, shift_end time, late_allow_minutes int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_date date := (now() at time zone 'Asia/Bangkok')::date; sh record;
begin
  select * into c from public.njhr_att_guard(p_token);
  if c.employee_id is null then return; end if;
  select * into sh from public.njhr_shift_at(c.employee_id, v_date);
  return query
  select coalesce(a.work_date, v_date), a.check_in, a.check_out,
         coalesce(a.status::text, ''), a.work_hours,
         public.njhr_att_late_min(c.employee_id, v_date, a.check_in),
         sh.shift_name, sh.start_time, sh.end_time, sh.late_allow_minutes
    from (select v_date d) x
    left join public.attendance a
      on a.employee_id = c.employee_id and a.work_date = v_date;
end $$;


-- ─── 4) รายงานลงเวลา / มาสาย (กรองด้วย SQL ทั้งหมด) ──────────
-- p_type: ATTEND = ลงเวลาทั้งหมด · LATE = เฉพาะที่มาสาย
create or replace function public.njhr_att_report(
  p_token text, p_from date, p_to date, p_type text default 'ATTEND',
  p_dept text default null, p_employee uuid default null, p_q text default null,
  p_limit int default 500, p_offset int default 0)
returns table (
  work_date date, employee_id uuid, emp_code text, prefix text, emp_name text, nickname text,
  department text, position_name text,
  check_in timestamptz, check_out timestamptz, work_hours numeric,
  status text, late_min int, shift_name text, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,''))); ty text := upper(btrim(coalesce(p_type,'ATTEND')));
begin
  select * into c from public.njhr_att_guard(p_token);
  if p_from is null or p_to is null then
    raise exception 'กรุณาเลือกช่วงวันที่' using errcode='22023';
  end if;
  if p_from > p_to then
    raise exception 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' using errcode='22023';
  end if;
  if ty not in ('ATTEND','LATE') then
    raise exception 'ประเภทรายงานไม่ถูกต้อง (%)', p_type using errcode='22023';
  end if;
  if not c.is_manager and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;

  return query
  with base as (
    select a.work_date wd, e.id eid, e.emp_code ec, coalesce(e.prefix,'') epx,
           btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           coalesce(e.nickname,'') enk, coalesce(e.department_name,'') edept,
           coalesce(e.position_name,'') epos,
           a.check_in ci, a.check_out co, a.work_hours wh, a.status::text st,
           public.njhr_att_late_min(a.employee_id, a.work_date, a.check_in) lm,
           (select s.shift_name from public.njhr_shift_at(e.id, a.work_date) s) shn
      from public.attendance a
      join public.employees e on e.id = a.employee_id
     where a.work_date between p_from and p_to
       -- พนักงานทั่วไปเห็นเฉพาะของตนเอง
       and (c.is_manager or a.employee_id = c.employee_id)
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_employee is null or a.employee_id = p_employee)
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            -- รองรับการพิมพ์คำนำหน้าติดมากับชื่อ เช่น "นายสมชาย" (พฤติกรรมเดิมของรายงาน)
            or lower(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%')),
  filtered as (select * from base b where ty = 'ATTEND' or b.lm > 0)
  select f.wd, f.eid, f.ec, f.epx, f.enm, f.enk, f.edept, f.epos,
         f.ci, f.co, f.wh, f.st, f.lm, f.shn, (select count(*) from filtered)
    from filtered f order by f.wd desc, f.ec
   limit least(greatest(coalesce(p_limit,500),1),2000) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 5) สรุปรายงาน (ใช้กับการ์ดสรุป) ─────────────────────────
create or replace function public.njhr_att_summary(
  p_token text, p_from date, p_to date, p_dept text default null, p_employee uuid default null)
returns table (rows_count int, employees_count int, late_count int, late_minutes int,
               no_checkout int, total_hours numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_att_guard(p_token);
  return query
  with base as (
    select a.*, public.njhr_att_late_min(a.employee_id, a.work_date, a.check_in) lm
      from public.attendance a
      join public.employees e on e.id = a.employee_id
     where a.work_date between p_from and p_to
       and (c.is_manager or a.employee_id = c.employee_id)
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_employee is null or a.employee_id = p_employee))
  select count(*)::int, count(distinct b.employee_id)::int,
         count(*) filter (where b.lm > 0)::int,
         coalesce(sum(b.lm) filter (where b.lm > 0), 0)::int,
         count(*) filter (where b.check_in is not null and b.check_out is null)::int,
         coalesce(round(sum(b.work_hours), 2), 0)
    from base b;
end $$;


-- ─── 6) Migration: นำข้อมูลลงเวลาจาก localStorage เข้า Supabase ──
-- p_rows: [{ "emp_code":"0155", "date":"2026-07-24", "in":"08:47", "out":"17:30", "status":"LATE" }, ...]
-- ทำครั้งเดียว · รันซ้ำได้ไม่เกิดข้อมูลซ้ำ (UNIQUE employee_id+work_date)
-- ไม่ทับข้อมูลที่มีอยู่แล้วบน Supabase เว้นแต่สั่ง p_overwrite
create or replace function public.njhr_att_migrate(
  p_token text, p_rows jsonb, p_dry_run boolean default true, p_overwrite boolean default false)
returns table (row_no int, emp_code text, work_date date, action text, message text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r jsonb; i int := 0; v_emp uuid; v_code text; v_date date;
        v_in timestamptz; v_out timestamptz; v_st public.attendance_status; v_exist record;
        n_ins int := 0; n_upd int := 0; n_skip int := 0; n_err int := 0; sh record;
begin
  select * into c from public.njhr_emp_guard(p_token, true);   -- SUPER_ADMIN / ADMIN / HR
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'ไม่พบข้อมูลที่จะนำเข้า' using errcode='22023';
  end if;
  if jsonb_array_length(p_rows) > 20000 then
    raise exception 'นำเข้าได้ครั้งละไม่เกิน 20,000 แถว' using errcode='22023';
  end if;

  create temp table if not exists njhr_attmig_tmp (
    row_no int, emp_code text, work_date date, action text, message text) on commit drop;
  delete from njhr_attmig_tmp where true;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_code := upper(btrim(coalesce(r->>'emp_code','')));
    v_emp := null; v_date := null; v_in := null; v_out := null; v_st := null;

    if v_code = '' then
      n_err := n_err + 1;
      insert into njhr_attmig_tmp values (i, null, null, 'ERROR', 'ไม่มีรหัสพนักงาน');
      continue;
    end if;
    select e.id into v_emp from public.employees e where upper(e.emp_code) = v_code;
    if v_emp is null then
      n_err := n_err + 1;
      insert into njhr_attmig_tmp values (i, v_code, null, 'ERROR', 'ไม่พบพนักงานรหัสนี้ในระบบ');
      continue;
    end if;
    if coalesce(r->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then
      n_err := n_err + 1;
      insert into njhr_attmig_tmp values (i, v_code, null, 'ERROR', 'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD');
      continue;
    end if;
    v_date := (r->>'date')::date;

    -- เวลาเดิมเก็บเป็น HH:MM ตามเวลาไทย → แปลงเป็น timestamptz
    begin
      if coalesce(r->>'in','') <> '' then
        v_in := ((r->>'date') || ' ' || (r->>'in'))::timestamp at time zone 'Asia/Bangkok';
      end if;
      if coalesce(r->>'out','') <> '' then
        v_out := ((r->>'date') || ' ' || (r->>'out'))::timestamp at time zone 'Asia/Bangkok';
        -- ออกก่อนเข้า = กะข้ามวัน ให้บวกอีก 1 วัน
        if v_in is not null and v_out < v_in then v_out := v_out + interval '1 day'; end if;
      end if;
    exception when others then
      n_err := n_err + 1;
      insert into njhr_attmig_tmp values (i, v_code, v_date, 'ERROR', 'รูปแบบเวลาไม่ถูกต้อง');
      continue;
    end;

    -- แปลงสถานะเดิม: PRESENT → NORMAL (enum จริงไม่มี PRESENT)
    v_st := case upper(coalesce(btrim(r->>'status'),''))
              when 'PRESENT' then 'NORMAL' when 'NORMAL' then 'NORMAL'
              when 'LATE' then 'LATE' when 'ABSENT' then 'ABSENT'
              when 'LEAVE' then 'LEAVE' when 'HOLIDAY' then 'HOLIDAY'
              else null end::public.attendance_status;
    if v_st is null then
      v_st := (case when public.njhr_att_late_min(v_emp, v_date, v_in) > 0 then 'LATE' else 'NORMAL' end)::public.attendance_status;
    end if;

    select * into v_exist from public.attendance a
     where a.employee_id = v_emp and a.work_date = v_date;

    if v_exist.id is not null and not coalesce(p_overwrite,false) then
      n_skip := n_skip + 1;
      insert into njhr_attmig_tmp values (i, v_code, v_date, 'SKIP', 'มีข้อมูลวันนี้อยู่แล้วในระบบ — ไม่ทับ');
      continue;
    end if;

    if not p_dry_run then
      select * into sh from public.njhr_shift_at(v_emp, v_date);
      insert into public.attendance (employee_id, work_date, check_in, check_out, status, work_hours)
      values (v_emp, v_date, v_in, v_out, v_st,
              case when v_in is not null and v_out is not null
                   then round(greatest(0, extract(epoch from (v_out - v_in))/3600
                        - coalesce(sh.break_minutes,0)/60.0)::numeric, 2) end)
      on conflict (employee_id, work_date) do update
        set check_in = excluded.check_in, check_out = excluded.check_out,
            status = excluded.status, work_hours = excluded.work_hours;
    end if;

    if v_exist.id is null then n_ins := n_ins + 1;
      insert into njhr_attmig_tmp values (i, v_code, v_date, 'INSERT', 'นำเข้าใหม่');
    else n_upd := n_upd + 1;
      insert into njhr_attmig_tmp values (i, v_code, v_date, 'UPDATE', 'เขียนทับข้อมูลเดิม');
    end if;
  end loop;

  if not p_dry_run then
    perform public.njhr_audit_write(p_token, 'ATT_MIGRATE', 'attendance', 'attendance', null,
      'ย้ายข้อมูลลงเวลาจากเครื่องผู้ใช้: ใหม่ ' || n_ins || ' · ทับ ' || n_upd ||
      ' · ข้าม ' || n_skip || ' · ผิดพลาด ' || n_err, null, null, null);
  end if;

  return query select t.row_no, t.emp_code, t.work_date, t.action, t.message
                 from njhr_attmig_tmp t order by t.row_no;
end $$;


-- ─── 7) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_att_guard(text) from public, anon, authenticated;
revoke all on function public.njhr_att_late_min(uuid, date, timestamptz) from public, anon, authenticated;

grant execute on function public.njhr_att_punch(text,text,timestamptz)                          to anon, authenticated;
grant execute on function public.njhr_att_today(text)                                           to anon, authenticated;
grant execute on function public.njhr_att_report(text,date,date,text,text,uuid,text,int,int)     to anon, authenticated;
grant execute on function public.njhr_att_summary(text,date,date,text,uuid)                      to anon, authenticated;
grant execute on function public.njhr_att_migrate(text,jsonb,boolean,boolean)                    to anon, authenticated;


-- ─── 8) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_att\_%'),
  'attendance_rows', (select count(*) from public.attendance),
  'attendance_columns_unchanged', (select jsonb_agg(column_name order by ordinal_position)
     from information_schema.columns where table_schema='public' and table_name='attendance'),
  'unique_key', (select pg_get_constraintdef(c.oid) from pg_constraint c
                   join pg_class r on r.oid=c.conrelid
                  where r.relname='attendance' and c.contype='u' limit 1),
  'uses_shift_late_allow', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='njhr_att_late_min'
       and pg_get_functiondef(p.oid) like '%late_allow_minutes%'),
  'employees_untouched', (select count(*) from public.employees)
)) as install_report;


-- ─── 9) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_att_migrate(text,jsonb,boolean,boolean);
-- drop function if exists public.njhr_att_summary(text,date,date,text,uuid);
-- drop function if exists public.njhr_att_report(text,date,date,text,text,uuid,text,int,int);
-- drop function if exists public.njhr_att_today(text);
-- drop function if exists public.njhr_att_punch(text,text,timestamptz);
-- drop function if exists public.njhr_att_late_min(uuid,date,timestamptz);
-- drop function if exists public.njhr_att_guard(text);
-- drop index if exists public.njhr_att_date_idx;
-- drop index if exists public.njhr_att_emp_idx;
-- delete from public.njhr_schema_version where version='v11.9-attendance';
