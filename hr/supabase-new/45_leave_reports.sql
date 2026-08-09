-- ============================================================
-- NJ HR V.10 — 45_leave_reports.sql
-- รายงานการลา + รายงานวันลาคงเหลือ (อ่านข้อมูลจริงจาก leave_requests / employees)
--
-- ตารางใหม่ 1 ตาราง: njhr_leave_adjustments (วันลายกมา / วันลาเพิ่ม-ลดโดยผู้ดูแล)
--   เพราะ employees มีเฉพาะสิทธิ์ต่อปี (leave_sick / leave_personal / leave_vacation)
--   ไม่มีคอลัมน์ "ยกมา" และ "เพิ่ม" มาก่อน — เพิ่มเป็นตารางแยก ไม่แตะ employees
--
-- ไม่แตะ leave_requests / leave_attachments / njhr_leave_* เดิม
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_leave_workdays') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_leave_workdays — รัน 41_leave_rpc.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='employees'
     and column_name in ('emp_code','prefix','first_name','last_name','nickname',
                         'department_name','start_date','status','leave_sick','leave_personal','leave_vacation');
  if n <> 11 then raise exception 'PREFLIGHT: employees คอลัมน์ที่ต้องใช้ไม่ครบ 11 (พบ %)', n; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='leave_requests'
     and column_name in ('employee_id','leave_type','start_date','end_date','leave_unit',
                         'start_time','end_time','hours','is_halfday','total_days','reason',
                         'approver_id','status','approved_at','created_at','approvals');
  if n <> 16 then raise exception 'PREFLIGHT: leave_requests คอลัมน์ไม่ครบ 16 (พบ %)', n; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ตารางปรับปรุงวันลา (ยกมา / เพิ่ม-ลด) ─────────────────
create table if not exists public.njhr_leave_adjustments (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  year         int  not null check (year between 2000 and 2100),
  leave_type   public.leave_type not null,
  carry_over   numeric(6,2) not null default 0,      -- วันลายกมาจากปีก่อน
  extra_days   numeric(6,2) not null default 0,      -- วันลาเพิ่ม/ลดโดยผู้ดูแล (ติดลบได้)
  note         text,
  created_at   timestamptz not null default now(),
  created_by   text,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
alter table public.njhr_leave_adjustments enable row level security;
create unique index if not exists njhr_lvadj_uidx
  on public.njhr_leave_adjustments (employee_id, year, leave_type);
create index if not exists njhr_lvadj_year_idx on public.njhr_leave_adjustments (year);

insert into public.njhr_schema_version(version, note)
values ('v10.5-leave-reports', 'รายงานการลา + วันลาคงเหลือ + ตารางปรับปรุงวันลา')
on conflict (version) do nothing;


-- ─── 2) ตัวช่วย ──────────────────────────────────────────────
-- สิทธิ์ดูรายงาน = สิทธิ์เดียวกับหน้า "รายงาน" เดิม
create or replace function public.njhr_rpt_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายงานนี้' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end $$;

-- จำนวนวันของใบลาที่ตกอยู่ใน "ปี" ที่ระบุ (รองรับลาข้ามปี)
create or replace function public.njhr_leave_days_in_year(
  p_start date, p_end date, p_unit text, p_total numeric, p_year int)
returns numeric language sql stable security definer set search_path = public as $$
  select case
    when coalesce(p_unit,'day') <> 'day' then
      case when extract(year from p_start) = p_year then coalesce(p_total,0) else 0 end
    when p_end < make_date(p_year,1,1) or p_start > make_date(p_year,12,31) then 0
    else public.njhr_leave_workdays(greatest(p_start, make_date(p_year,1,1)),
                                    least(p_end,  make_date(p_year,12,31)))
  end $$;

-- ชั่วโมงลาที่ตกอยู่ในปีที่ระบุ (ลารายชั่วโมงอยู่ในวันเดียว)
create or replace function public.njhr_leave_hours_in_year(p_start date, p_hours numeric, p_year int)
returns numeric language sql immutable as $$
  select case when extract(year from p_start) = p_year then coalesce(p_hours,0) else 0 end $$;


-- ─── 3) รายงานการลา ──────────────────────────────────────────
create or replace function public.njhr_leave_report(
  p_token text, p_from date, p_to date, p_dept text default null,
  p_q text default null, p_type text default null, p_status text default null)
returns table (
  req_id uuid, emp_code text, prefix text, full_name text, nickname text, department text,
  leave_type text, start_date date, end_date date, leave_unit text, mode_txt text,
  start_time time, end_time time, total_days numeric, hours numeric,
  reason text, file_names text, file_count int, created_at timestamptz,
  status text, approver text, approved_at timestamptz, note text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_rpt_guard(p_token);
  if p_from is null or p_to is null then
    raise exception 'กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดให้ครบ' using errcode='22023';
  end if;
  if p_from > p_to then
    raise exception 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' using errcode='22023';
  end if;
  return query
  select r.id, e.emp_code, coalesce(e.prefix,''),
         (e.first_name || ' ' || coalesce(e.last_name,'')), coalesce(e.nickname,''),
         coalesce(e.department_name,''), r.leave_type::text,
         r.start_date, r.end_date, coalesce(r.leave_unit,'day'),
         case coalesce(r.leave_unit,'day')
           when 'hour' then 'รายชั่วโมง'
           when 'halfday' then case when coalesce(r.approvals->0->'meta'->>'mode','') = 'HALF_PM'
                                    then 'ครึ่งวันบ่าย' else 'ครึ่งวันเช้า' end
           else case when r.end_date > r.start_date then 'หลายวัน' else 'เต็มวัน' end
         end,
         r.start_time, r.end_time, coalesce(r.total_days,0), coalesce(r.hours,0),
         coalesce(r.reason,''),
         coalesce((select string_agg(a.file_name, ', ' order by a.created_at)
                     from public.leave_attachments a where a.leave_id = r.id), ''),
         (select count(*)::int from public.leave_attachments a2 where a2.leave_id = r.id),
         r.created_at, r.status::text,
         coalesce((select coalesce(e2.prefix,'')||e2.first_name||' '||coalesce(e2.last_name,'')
                     from public.employees e2 where e2.id = r.approver_id), ''),
         r.approved_at,
         coalesce((select x->>'note' from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x
                    where coalesce(x->>'note','') <> '' order by (x->>'seq')::int desc limit 1), '')
    from public.leave_requests r
    join public.employees e on e.id = r.employee_id
   where r.start_date <= p_to and r.end_date >= p_from        -- รวมใบที่คาบเกี่ยวช่วงที่เลือก
     and (p_dept is null or p_dept = '' or e.department_name = p_dept)
     and (p_type is null or p_type = '' or r.leave_type::text = upper(p_type))
     and (p_status is null or p_status = '' or r.status::text = upper(p_status))
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by r.start_date desc, e.emp_code;
end $$;


-- ─── 4) รายงานวันลาคงเหลือ ───────────────────────────────────
-- 1 พนักงาน × 1 ประเภทลา = 1 แถว (หน้าจอนำไป pivot เป็น 1 พนักงาน/แถว)
-- สูตร: คงเหลือ = สิทธิ์ประจำปี + ยกมา + เพิ่ม − ใช้แล้ว(อนุมัติแล้วเท่านั้น)
create or replace function public.njhr_leave_balance_report(
  p_token text, p_year int, p_dept text default null,
  p_q text default null, p_emp_status text default 'ACTIVE')
returns table (
  employee_id uuid, emp_code text, prefix text, full_name text, nickname text,
  department text, start_date date, emp_status text, year int,
  leave_type text, quota numeric, carry_over numeric, extra_days numeric,
  used numeric, pending numeric, remaining numeric, unlimited boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_rpt_guard(p_token);
  if p_year is null or p_year < 2000 or p_year > 2100 then
    raise exception 'ปีสิทธิ์การลาไม่ถูกต้อง' using errcode='22023';
  end if;
  return query
  with emps as (
    select e.* from public.employees e
     where (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_emp_status is null or p_emp_status = '' or e.status::text = upper(p_emp_status))
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.department_name,'')) like '%'||q||'%')),
  types as (select unnest(enum_range(null::public.leave_type)) lt),
  grid as (select em.*, t.lt from emps em cross join types t),
  agg as (
    select g.id gid, g.lt glt,
      -- ใช้แล้ว: เฉพาะ APPROVED และนับเฉพาะส่วนที่อยู่ในปีที่เลือก (รองรับลาข้ามปี)
      coalesce(sum(case when r.status = 'APPROVED'
        then public.njhr_leave_days_in_year(r.start_date, r.end_date, r.leave_unit, r.total_days, p_year)
             + public.njhr_leave_hours_in_year(r.start_date, r.hours, p_year)/8
        else 0 end), 0) used_d,
      coalesce(sum(case when r.status = 'PENDING'
        then public.njhr_leave_days_in_year(r.start_date, r.end_date, r.leave_unit, r.total_days, p_year)
             + public.njhr_leave_hours_in_year(r.start_date, r.hours, p_year)/8
        else 0 end), 0) pend_d
      from grid g
      left join public.leave_requests r
        on r.employee_id = g.id and r.leave_type = g.lt
       and r.start_date <= make_date(p_year,12,31) and r.end_date >= make_date(p_year,1,1)
     group by g.id, g.lt)
  select g.id, g.emp_code, coalesce(g.prefix,''),
         (g.first_name || ' ' || coalesce(g.last_name,'')), coalesce(g.nickname,''),
         coalesce(g.department_name,''), g.start_date, g.status::text, p_year,
         g.lt::text,
         qta.v,
         coalesce(adj.carry_over,0), coalesce(adj.extra_days,0),
         round(a.used_d, 2), round(a.pend_d, 2),
         case when qta.v is null then null
              else round(qta.v + coalesce(adj.carry_over,0) + coalesce(adj.extra_days,0) - a.used_d, 2) end,
         (qta.v is null)
    from grid g
    join agg a on a.gid = g.id and a.glt = g.lt
    cross join lateral (select case g.lt::text
                                 when 'SICK' then g.leave_sick::numeric
                                 when 'PERSONAL' then g.leave_personal::numeric
                                 when 'VACATION' then g.leave_vacation::numeric
                                 else null end as v) qta
    left join public.njhr_leave_adjustments adj
      on adj.employee_id = g.id and adj.year = p_year and adj.leave_type = g.lt
   order by g.emp_code, g.lt;
end $$;

-- ปรับวันลายกมา / วันลาเพิ่ม (SUPER_ADMIN / ADMIN / HR)
create or replace function public.njhr_leave_adj_save(
  p_token text, p_employee uuid, p_year int, p_type text,
  p_carry numeric default null, p_extra numeric default null, p_note text default null)
returns table (employee_id uuid, year int, leave_type text, carry_over numeric, extra_days numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_lt public.leave_type;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์ปรับวันลา' using errcode='42501';
  end if;
  begin v_lt := upper(p_type)::public.leave_type;
  exception when others then
    raise exception 'ประเภทการลาไม่ถูกต้อง (%)', p_type using errcode='22023';
  end;
  if p_year < 2000 or p_year > 2100 then
    raise exception 'ปีไม่ถูกต้อง' using errcode='22023';
  end if;
  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002';
  end if;
  insert into public.njhr_leave_adjustments(employee_id, year, leave_type, carry_over, extra_days, note, created_by, updated_by)
  values (p_employee, p_year, v_lt, coalesce(p_carry,0), coalesce(p_extra,0),
          nullif(btrim(coalesce(p_note,'')),''), c.username, c.username)
  on conflict (employee_id, year, leave_type) do update
    set carry_over = coalesce(p_carry, njhr_leave_adjustments.carry_over),
        extra_days = coalesce(p_extra, njhr_leave_adjustments.extra_days),
        note = coalesce(nullif(btrim(coalesce(p_note,'')),''), njhr_leave_adjustments.note),
        updated_at = now(), updated_by = c.username;
  perform public.njhr_audit_write(p_token, 'LEAVE_ADJ', 'leave', 'njhr_leave_adjustments',
    p_employee::text, 'ปรับวันลา ' || v_lt::text || ' ปี ' || p_year, null, null, null);
  return query select a.employee_id, a.year, a.leave_type::text, a.carry_over, a.extra_days
                 from public.njhr_leave_adjustments a
                where a.employee_id = p_employee and a.year = p_year and a.leave_type = v_lt;
end $$;


-- ─── 5) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_rpt_guard(text) from public, anon, authenticated;
revoke all on function public.njhr_leave_days_in_year(date,date,text,numeric,int) from public, anon, authenticated;
revoke all on function public.njhr_leave_hours_in_year(date,numeric,int) from public, anon, authenticated;

grant execute on function public.njhr_leave_report(text,date,date,text,text,text,text)  to anon, authenticated;
grant execute on function public.njhr_leave_balance_report(text,int,text,text,text)     to anon, authenticated;
grant execute on function public.njhr_leave_adj_save(text,uuid,int,text,numeric,numeric,text) to anon, authenticated;


-- ─── 6) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'table', (select exists(select 1 from information_schema.tables
                           where table_schema='public' and table_name='njhr_leave_adjustments')),
  'rls', (select relrowsecurity from pg_class where oid='public.njhr_leave_adjustments'::regclass),
  'unique_index', (select jsonb_agg(indexname) from pg_indexes
                    where schemaname='public' and tablename='njhr_leave_adjustments' and indexdef like 'CREATE UNIQUE%'),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public'
                   and p.proname in ('njhr_leave_report','njhr_leave_balance_report','njhr_leave_adj_save',
                                     'njhr_leave_days_in_year','njhr_leave_hours_in_year','njhr_rpt_guard')),
  'leave_requests_untouched', (select count(*) from public.leave_requests),
  'employees_untouched',      (select count(*) from public.employees)
)) as install_report;


-- ─── 7) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_leave_adj_save(text,uuid,int,text,numeric,numeric,text);
-- drop function if exists public.njhr_leave_balance_report(text,int,text,text,text);
-- drop function if exists public.njhr_leave_report(text,date,date,text,text,text,text);
-- drop function if exists public.njhr_leave_hours_in_year(date,numeric,int);
-- drop function if exists public.njhr_leave_days_in_year(date,date,text,numeric,int);
-- drop function if exists public.njhr_rpt_guard(text);
-- drop table if exists public.njhr_leave_adjustments;
-- delete from public.njhr_schema_version where version = 'v10.5-leave-reports';
