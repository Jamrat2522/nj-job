-- ============================================================
-- NJ HR V.10 — 55_departments.sql
-- จัดการแผนก (โครงสร้างองค์กร) เชื่อมกับพนักงานจริงและ "ตั้งค่าการอนุมัติ" เดิม
--
-- โครงสร้างจริงที่ตรวจแล้ว:
--   departments                     = id · code · name · created_at   (ไม่มีคอลัมน์ active)
--   employees.department_id (uuid)  = FK เชิงตรรกะไปยัง departments.id
--   employees.department_name (text)= ชื่อแผนกที่ใช้แสดงผลและใช้กรองทั่วระบบ
--   njhr_approval_workflows.department (text) = อ้างอิงด้วย "ชื่อแผนก" ไม่ใช่ id
--
-- ⚠️ ผลที่ตามมา: การเปลี่ยนชื่อแผนกต้อง sync 3 ที่พร้อมกันในธุรกรรมเดียว
--    departments.name · employees.department_name · njhr_approval_workflows.department
--    มิฉะนั้นการตั้งค่าการอนุมัติของแผนกนั้นจะหลุดการเชื่อมโยงทันที
--
-- ไม่สร้างตารางใหม่ · ไม่เก็บข้อมูลพนักงานซ้ำ · ไม่แตะเมนูหรือ RPC ของตั้งค่าการอนุมัติ
-- ต้องรัน 48_employees.sql มาก่อน (44_approval_workflow.sql ถ้ามี) · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.departments') is null then raise exception 'PREFLIGHT: ไม่พบตาราง departments'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='departments' and column_name in ('id','code','name');
  if n <> 3 then raise exception 'PREFLIGHT: departments ขาดคอลัมน์ id/code/name (พบ %)', n; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='employees' and column_name in ('department_id','department_name');
  if n <> 2 then raise exception 'PREFLIGHT: employees ขาด department_id / department_name'; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create table if not exists njhr_bk_departments_20260802 as select *, now() as backed_up_at from public.departments;

-- ชื่อแผนกห้ามซ้ำ (สร้างเมื่อไม่มีชื่อซ้ำอยู่ก่อน)
do $$
declare dup int;
begin
  select count(*) into dup from (select lower(btrim(name)) n from public.departments group by 1 having count(*)>1) x;
  if dup > 0 then
    raise notice 'ข้ามการสร้าง unique index: มีชื่อแผนกซ้ำ % ชุด', dup;
  else
    create unique index if not exists njhr_dept_name_uidx on public.departments (lower(btrim(name)));
  end if;
end $$;
create index if not exists njhr_emp_deptid_idx on public.employees (department_id);

insert into public.njhr_schema_version(version, note)
values ('v11.4-departments', 'จัดการแผนก + sync ชื่อแผนกกับพนักงานและตั้งค่าการอนุมัติ')
on conflict (version) do nothing;


-- ─── 1) รายการแผนก + จำนวนพนักงานจริง + สถานะการตั้งค่าอนุมัติ ──
create or replace function public.njhr_dept_list(p_token text, p_q text default null)
returns table (id uuid, code text, name text, employees_active int, employees_total int,
               leave_steps int, ot_steps int, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
        has_wf boolean := to_regclass('public.njhr_approval_workflows') is not null;
begin
  perform public.njhr_emp_guard(p_token, false);
  return query
  select d.id, coalesce(d.code,''), d.name,
         (select count(*)::int from public.employees e
           where e.department_id = d.id and e.status::text = 'ACTIVE'),
         (select count(*)::int from public.employees e where e.department_id = d.id),
         case when has_wf then coalesce((
           select count(*)::int from public.njhr_approval_steps s
             join public.njhr_approval_workflows w on w.id = s.workflow_id
            where w.request_type = 'LEAVE' and w.department = d.name
              and s.deleted_at is null and w.deleted_at is null and s.active), 0) else 0 end,
         case when has_wf then coalesce((
           select count(*)::int from public.njhr_approval_steps s
             join public.njhr_approval_workflows w on w.id = s.workflow_id
            where w.request_type = 'OT' and w.department = d.name
              and s.deleted_at is null and w.deleted_at is null and s.active), 0) else 0 end,
         d.created_at
    from public.departments d
   where q = '' or lower(d.name) like '%'||q||'%' or lower(coalesce(d.code,'')) like '%'||q||'%'
   order by d.name;
end $$;


-- ─── 2) พนักงานในแผนก (อ่านจาก employees ตรง ๆ ไม่เก็บซ้ำ) ────
create or replace function public.njhr_dept_employees(
  p_token text, p_dept_id uuid, p_q text default null, p_limit int default 200)
returns table (employee_id uuid, emp_code text, emp_name text, nickname text,
               position_name text, emp_status text, start_date date)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_emp_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),
         coalesce(e.nickname,''), coalesce(e.position_name,''), e.status::text, e.start_date
    from public.employees e
   where e.department_id = p_dept_id
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%')
   order by e.emp_code
   limit least(greatest(coalesce(p_limit,200),1),500);
end $$;


-- ─── 3) เพิ่ม / แก้ไขแผนก (เปลี่ยนชื่อ = sync 3 ที่ในธุรกรรมเดียว) ──
create or replace function public.njhr_dept_save(
  p_token text, p_id uuid, p_name text, p_code text default null)
returns table (id uuid, name text, code text, synced_employees int, synced_workflows int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_name text := btrim(coalesce(p_name,'')); v_code text := btrim(coalesce(p_code,''));
        v_id uuid; v_old text; n_emp int := 0; n_wf int := 0;
        has_wf boolean := to_regclass('public.njhr_approval_workflows') is not null;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if v_name = '' then raise exception 'กรุณาระบุชื่อแผนก' using errcode='22023'; end if;
  if length(v_name) > 100 then raise exception 'ชื่อแผนกยาวเกิน 100 ตัวอักษร' using errcode='22023'; end if;
  if exists (select 1 from public.departments d
              where lower(btrim(d.name)) = lower(v_name) and (p_id is null or d.id <> p_id)) then
    raise exception 'มีแผนกชื่อ "%" อยู่แล้ว', v_name using errcode='23505';
  end if;
  if v_code <> '' and exists (select 1 from public.departments d
              where lower(btrim(coalesce(d.code,''))) = lower(v_code) and (p_id is null or d.id <> p_id)) then
    raise exception 'รหัสแผนก "%" ถูกใช้ไปแล้ว', v_code using errcode='23505';
  end if;

  if p_id is null then
    insert into public.departments (name, code) values (v_name, nullif(v_code,''))
    returning departments.id into v_id;
  else
    select d.name into v_old from public.departments d where d.id = p_id;
    if v_old is null then raise exception 'ไม่พบแผนกนี้' using errcode='P0002'; end if;
    update public.departments set name = v_name, code = nullif(v_code,'') where departments.id = p_id;
    v_id := p_id;
    -- เปลี่ยนชื่อ → ต้องตามไปแก้ทุกที่ที่อ้างด้วย "ชื่อแผนก" มิฉะนั้นข้อมูลหลุดการเชื่อมโยง
    if v_old is distinct from v_name then
      update public.employees set department_name = v_name, updated_at = now()
       where department_id = p_id;
      get diagnostics n_emp = row_count;
      if has_wf then
        update public.njhr_approval_workflows set department = v_name, updated_at = now(), updated_by = c.username
         where department = v_old and deleted_at is null;
        get diagnostics n_wf = row_count;
      end if;
    end if;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail)
  values ('salary', c.username, c.role,
          case when p_id is null then 'DEPT_ADD' else 'DEPT_EDIT' end, 'department', 'departments', v_id::text,
          'แผนก ' || coalesce(v_old || ' → ', '') || v_name ||
          case when n_emp > 0 or n_wf > 0
               then ' · ปรับพนักงาน ' || n_emp || ' คน · ตั้งค่าการอนุมัติ ' || n_wf || ' ชุด' else '' end);

  return query select d.id, d.name, coalesce(d.code,''), n_emp, n_wf
                 from public.departments d where d.id = v_id;
end $$;


-- ─── 4) ลบแผนก (กันข้อมูลกำพร้า) ─────────────────────────────
create or replace function public.njhr_dept_delete(p_token text, p_id uuid, p_confirm boolean default false)
returns table (deleted boolean, employees_count int, workflow_steps int, dept_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_name text; n_emp int; n_step int := 0;
        has_wf boolean := to_regclass('public.njhr_approval_workflows') is not null;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  select d.name into v_name from public.departments d where d.id = p_id;
  if v_name is null then raise exception 'ไม่พบแผนกนี้' using errcode='P0002'; end if;

  select count(*)::int into n_emp from public.employees e where e.department_id = p_id;
  if has_wf then
    select coalesce(count(*)::int,0) into n_step
      from public.njhr_approval_steps s
      join public.njhr_approval_workflows w on w.id = s.workflow_id
     where w.department = v_name and s.deleted_at is null and w.deleted_at is null;
  end if;

  -- มีพนักงานอยู่ = ลบไม่ได้เด็ดขาด ต้องย้ายพนักงานออกก่อน
  if n_emp > 0 then
    return query select false, n_emp, n_step, v_name;
    return;
  end if;
  -- มีการตั้งค่าอนุมัติผูกอยู่ = ต้องยืนยันก่อน
  if n_step > 0 and not coalesce(p_confirm,false) then
    return query select false, n_emp, n_step, v_name;
    return;
  end if;

  if has_wf then
    update public.njhr_approval_workflows set deleted_at = now(), active = false,
           updated_at = now(), updated_by = c.username
     where department = v_name and deleted_at is null;
  end if;
  delete from public.departments where departments.id = p_id;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail)
  values ('salary', c.username, c.role, 'DEPT_DELETE', 'department', 'departments', p_id::text,
          'ลบแผนก ' || v_name || case when n_step > 0 then ' · ปิดตั้งค่าการอนุมัติ ' || n_step || ' ขั้น' else '' end);
  return query select true, n_emp, n_step, v_name;
end $$;


-- ─── 5) ย้ายพนักงานเข้าแผนก (อัปเดตทั้ง id และชื่อให้ตรงกันเสมอ) ──
create or replace function public.njhr_dept_move(p_token text, p_employees uuid[], p_dept_id uuid)
returns table (moved int, dept_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_name text; n int;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if p_employees is null or array_length(p_employees,1) is null then
    raise exception 'ยังไม่ได้เลือกพนักงาน' using errcode='22023';
  end if;
  if p_dept_id is not null then
    select d.name into v_name from public.departments d where d.id = p_dept_id;
    if v_name is null then raise exception 'ไม่พบแผนกปลายทาง' using errcode='P0002'; end if;
  end if;
  update public.employees
     set department_id = p_dept_id, department_name = v_name, updated_at = now()
   where id = any(p_employees);
  get diagnostics n = row_count;
  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail)
  values ('salary', c.username, c.role, 'DEPT_MOVE', 'department', 'employees', null,
          'ย้ายพนักงาน ' || n || ' คน ไปแผนก ' || coalesce(v_name, '(ไม่ระบุแผนก)'));
  return query select n, coalesce(v_name, '');
end $$;


-- ─── 6) ตรวจความสอดคล้องของชื่อแผนก ──────────────────────────
create or replace function public.njhr_dept_health(p_token text)
returns table (issue text, detail text, cnt int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare has_wf boolean := to_regclass('public.njhr_approval_workflows') is not null;
begin
  perform public.njhr_emp_guard(p_token, false);
  return query
  select 'ชื่อแผนกในข้อมูลพนักงานไม่ตรงกับตารางแผนก'::text,
         coalesce(e.department_name,'(ว่าง)'), count(*)::int
    from public.employees e
    left join public.departments d on d.id = e.department_id
   where e.department_id is not null and d.name is distinct from e.department_name
   group by 2
  union all
  select 'พนักงานยังไม่ได้ระบุแผนก'::text, '-', count(*)::int
    from public.employees e where e.department_id is null and e.status::text = 'ACTIVE'
   having count(*) > 0
  union all
  select 'ตั้งค่าการอนุมัติอ้างแผนกที่ไม่มีอยู่แล้ว'::text, w.department, count(*)::int
    from public.njhr_approval_workflows w
   where has_wf and w.deleted_at is null
     and not exists (select 1 from public.departments d where d.name = w.department)
   group by 2;
end $$;


-- ─── 7) สิทธิ์เรียกใช้ ───────────────────────────────────────
grant execute on function public.njhr_dept_list(text,text)                to anon, authenticated;
grant execute on function public.njhr_dept_employees(text,uuid,text,int)  to anon, authenticated;
grant execute on function public.njhr_dept_save(text,uuid,text,text)      to anon, authenticated;
grant execute on function public.njhr_dept_delete(text,uuid,boolean)      to anon, authenticated;
grant execute on function public.njhr_dept_move(text,uuid[],uuid)         to anon, authenticated;
grant execute on function public.njhr_dept_health(text)                   to anon, authenticated;


-- ─── 8) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_dept\_%'),
  'name_unique_index', exists(select 1 from pg_indexes
     where schemaname='public' and indexname='njhr_dept_name_uidx'),
  'departments', (select count(*) from public.departments),
  'employees_with_dept', (select count(*) from public.employees where department_id is not null),
  'employees_without_dept', (select count(*) from public.employees
     where department_id is null and status::text='ACTIVE'),
  'approval_workflows_exists', to_regclass('public.njhr_approval_workflows') is not null,
  'dept_names', (select jsonb_agg(name order by name) from public.departments)
)) as install_report;


-- ─── 9) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_dept_health(text);
-- drop function if exists public.njhr_dept_move(text,uuid[],uuid);
-- drop function if exists public.njhr_dept_delete(text,uuid,boolean);
-- drop function if exists public.njhr_dept_save(text,uuid,text,text);
-- drop function if exists public.njhr_dept_employees(text,uuid,text,int);
-- drop function if exists public.njhr_dept_list(text,text);
-- drop index if exists public.njhr_dept_name_uidx;
-- คืนข้อมูล: njhr_bk_departments_20260802
-- delete from public.njhr_schema_version where version='v11.4-departments';
