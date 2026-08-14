-- NJHR role matrix hardening
-- USER        = self-service
-- ADMIN       = self-service + approval queue only
-- HR          = HR management, no destructive/delete actions
-- SUPER_ADMIN = full access including destructive/delete actions
--
-- This migration changes authorization only. It does not rewrite employee,
-- attendance, payroll, leave, OT, correction, or existing app_user role rows.

-- ---------------------------------------------------------------------------
-- Temporary patch helper (dropped at end of migration)
-- ---------------------------------------------------------------------------
create or replace function public._njhr_role101_replace(
  p_sig regprocedure,
  p_old text,
  p_new text
) returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare v_def text; v_old text; v_new text;
begin
  select replace(pg_get_functiondef(p_sig::oid), E'\r\n', E'\n') into v_def;
  v_old := replace(p_old, E'\r\n', E'\n');
  v_new := replace(p_new, E'\r\n', E'\n');
  if position(v_new in v_def) > 0 then
    return; -- already patched
  end if;
  if position(v_old in v_def) = 0 then
    raise exception 'ROLE101 patch precondition failed for %', p_sig using errcode='P0001';
  end if;
  execute replace(v_def, v_old, v_new);
end
$fn$;
revoke all on function public._njhr_role101_replace(regprocedure,text,text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Central guards
-- ---------------------------------------------------------------------------
create or replace function public.njhr_emp_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, emp_name text, can_salary boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    if p_write then
      raise exception 'คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน' using errcode='42501';
    else
      raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลพนักงาน' using errcode='42501';
    end if;
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_doc_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write and c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการเอกสารพนักงาน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_empfile_guard(p_token text, p_employee uuid, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean, can_delete boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record; v_mgr boolean; v_own boolean;
begin
  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','HR');
  v_own := (c.employee_id is not null and p_employee is not null and p_employee = c.employee_id);
  if p_write and not (v_mgr or v_own) then
    raise exception 'คุณไม่มีสิทธิ์จัดการเอกสารพนักงาน' using errcode='42501';
  end if;
  if not (v_mgr or v_own) then
    raise exception 'คุณดูได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      v_mgr, (c.role = 'SUPER_ADMIN');
end
$fn$;

create or replace function public.njhr_pay_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลเงินเดือน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, true;
end
$fn$;

create or replace function public.njhr_rpt_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายงานนี้' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end
$fn$;

create or replace function public.njhr_rptmenu_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายงานนี้' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end
$fn$;

create or replace function public.njhr_setting_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, is_manager boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write and c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่าระบบ' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_shift_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c is null or c.role is null then
    raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode='28000';
  end if;
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการกะทำงาน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, true;
end
$fn$;

create or replace function public.njhr_wf_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าการอนุมัติ' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end
$fn$;

create or replace function public.njhr_gf_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer
set search_path = public
as $fn$
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการพื้นที่ลงเวลา' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end
$fn$;

create or replace function public.njhr_face_guard(p_token text, p_manage boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_manage and c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการข้อมูลใบหน้าพนักงาน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_user_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    if p_write then
      raise exception 'คุณไม่มีสิทธิ์เพิ่มหรือแก้ไขผู้ใช้งาน' using errcode='42501';
    else
      raise exception 'คุณไม่มีสิทธิ์ดูรายชื่อผู้ใช้งาน' using errcode='42501';
    end if;
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id;
end
$fn$;

create or replace function public.njhr_ann_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write and c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการประกาศ' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_mc_guard(p_token text, p_manage boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_manage and c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการประกาศและปฏิทินบริษัท' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_att_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_attc_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean, can_approve boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR')),
                      (c.role in ('SUPER_ADMIN','HR','ADMIN'));
end
$fn$;

create or replace function public.njhr_ot_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean, can_approve boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR')),
                      (c.role in ('SUPER_ADMIN','HR','ADMIN'));
end
$fn$;

create or replace function public.njhr_slip_guard(p_token text)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','HR'));
end
$fn$;

create or replace function public.njhr_wht50_guard(p_token text, p_write boolean default false)
returns table(app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์เข้าถึงหนังสือรับรองการหักภาษี ณ ที่จ่าย' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, true;
end
$fn$;

create or replace function public.njhr_doc_can_approve(p_role text)
returns boolean
language sql immutable
as $fn$
  select upper(coalesce(p_role,'')) in ('SUPER_ADMIN','HR');
$fn$;

-- ---------------------------------------------------------------------------
-- Calendar privacy: USER/ADMIN = holidays only; HR/SUPER_ADMIN = full calendar
-- ---------------------------------------------------------------------------
create or replace function public.njhr_calendar_month(p_token text, p_from date, p_to date, p_dept uuid default null)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $fn$
declare v_uid uuid; v_role text; v_dept_name text; v_full boolean := false;
begin
  if p_from is null or p_to is null then
    raise exception 'กรุณาระบุช่วงวันที่ของปฏิทิน' using errcode='22023';
  end if;
  if p_from > p_to then
    raise exception 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' using errcode='22023';
  end if;
  if (p_to - p_from) > 61 then
    raise exception 'ช่วงวันที่ของปฏิทินต้องไม่เกิน 62 วัน' using errcode='22023';
  end if;

  select u.id, public.njhr_norm_role(u.role::text)
    into v_uid, v_role
    from public.njhr_sessions s
    join public.app_users u on u.id = s.app_user_id
   where s.token = p_token
     and not s.revoked
     and s.expires_at > now()
     and u.app_code = 'salary'
     and coalesce(u.is_active, true)
   limit 1;
  if v_uid is null then
    raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode='28000';
  end if;

  v_full := v_role in ('SUPER_ADMIN','HR');
  if v_full and p_dept is not null then
    select d.name into v_dept_name from public.departments d where d.id = p_dept;
  end if;

  return jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'departments', case when not v_full then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'code', coalesce(d.code,''), 'name', d.name) order by d.name)
      from public.departments d), '[]'::jsonb) end,
    'holidays', coalesce((
      select jsonb_agg(jsonb_build_object('holiday_date', h.holiday_date, 'name', h.name) order by h.holiday_date)
      from public.holidays h where h.holiday_date between p_from and p_to), '[]'::jsonb),
    'leaves', case when not v_full then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'start_date', r.start_date,
               'end_date', r.end_date,
               'display_name', coalesce(nullif(btrim(coalesce(e.nickname,'')),''), btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,''))),
               'department', coalesce(e.department_name,'')) order by r.start_date, e.id)
      from public.leave_requests r
      join public.employees e on e.id=r.employee_id
      where r.status::text='APPROVED'
        and r.start_date <= p_to and r.end_date >= p_from
        and (p_dept is null or e.department_id=p_dept or
             (e.department_id is null and v_dept_name is not null and e.department_name=v_dept_name))), '[]'::jsonb) end,
    'ot', case when not v_full then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'ot_date', o.ot_date,
               'display_name', coalesce(nullif(btrim(coalesce(e.nickname,'')),''), btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,''))),
               'department', coalesce(e.department_name,'')) order by o.ot_date, e.id)
      from public.ot_requests o
      join public.employees e on e.id=o.employee_id
      where o.status::text='APPROVED'
        and o.ot_date between p_from and p_to
        and (p_dept is null or e.department_id=p_dept or
             (e.department_id is null and v_dept_name is not null and e.department_name=v_dept_name))), '[]'::jsonb) end
  );
end
$fn$;

-- ---------------------------------------------------------------------------
-- Dashboard: ADMIN is self-service; HR/SUPER_ADMIN see company/admin data
-- ---------------------------------------------------------------------------
select public._njhr_role101_replace(
  'public.njhr_dashboard_summary(text)'::regprocedure,
  $$v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER');$$,
  $$v_mgr := c.role in ('SUPER_ADMIN','HR');$$
);
select public._njhr_role101_replace(
  'public.njhr_dashboard_summary(text)'::regprocedure,
  $$v_pay := c.role in ('SUPER_ADMIN','ADMIN','ACCOUNT');$$,
  $$v_pay := c.role in ('SUPER_ADMIN','HR');$$
);

-- ---------------------------------------------------------------------------
-- Approval membership helper for ADMIN (internal only)
-- ADMIN may approve only requests whose resolved workflow contains that employee.
-- Existing HR/SUPER_ADMIN management semantics are unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.njhr_request_approver_member(
  p_type text,
  p_request_employee uuid,
  p_actor_employee uuid
) returns boolean
language plpgsql stable security definer
set search_path = public
as $fn$
declare v_type text := upper(btrim(coalesce(p_type,''))); v_dept text; v_wf uuid;
begin
  if p_request_employee is null or p_actor_employee is null or v_type not in ('LEAVE','OT','CORRECTION') then
    return false;
  end if;
  select e.department_name into v_dept from public.employees e where e.id=p_request_employee;
  select x.wid into v_wf from (
    select w.id wid, 1 pr
      from public.njhr_approval_workflow_emps m
      join public.njhr_approval_workflows w on w.id=m.workflow_id
     where m.request_type=v_type and m.employee_id=p_request_employee
       and w.deleted_at is null and w.active
    union all
    select w.id, 2
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w on w.id=d.workflow_id
     where d.request_type=v_type and d.department=v_dept
       and w.deleted_at is null and w.active
    union all
    select w.id, 3
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w on w.id=d.workflow_id
     where d.request_type=v_type and d.department='*'
       and w.deleted_at is null and w.active
  ) x order by x.pr limit 1;
  if v_wf is null then return false; end if;
  return exists (
    select 1
      from public.njhr_approval_steps s
      join public.njhr_approval_step_approvers a on a.step_id=s.id and a.active
     where s.workflow_id=v_wf and s.deleted_at is null and s.active
       and a.employee_id=p_actor_employee
  );
end
$fn$;
revoke all on function public.njhr_request_approver_member(text,uuid,uuid) from public, anon, authenticated;

-- Approval settings route lookup: only HR/SUPER_ADMIN may inspect another employee's route.
select public._njhr_role101_replace(
  'public.njhr_wf_route(text,text,uuid)'::regprocedure,
  $$and c.role not in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER') then$$,
  $$and c.role not in ('SUPER_ADMIN','HR') then$$
);

-- Leave approval role + ADMIN membership restriction.
select public._njhr_role101_replace(
  'public.njhr_leave_queue(text,integer,integer)'::regprocedure,
  $$if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then$$,
  $$if c.role not in ('SUPER_ADMIN','HR','ADMIN') then$$
);
select public._njhr_role101_replace(
  'public.njhr_leave_queue(text,integer,integer)'::regprocedure,
  $$with base as (select r.* from public.leave_requests r where r.status = 'PENDING'),$$,
  $$with base as (select r.* from public.leave_requests r
                  where r.status = 'PENDING'
                    and (c.role in ('SUPER_ADMIN','HR')
                         or (c.role='ADMIN' and public.njhr_request_approver_member('LEAVE', r.employee_id, c.employee_id)))),$$
);
select public._njhr_role101_replace(
  'public.njhr_leave_decide(text,uuid,text,text)'::regprocedure,
  $$if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then$$,
  $$if c.role not in ('SUPER_ADMIN','HR','ADMIN') then$$
);
select public._njhr_role101_replace(
  'public.njhr_leave_decide(text,uuid,text,text)'::regprocedure,
  $$if r.status <> 'PENDING' then
    raise exception 'ใบลานี้ถูกดำเนินการไปแล้ว (สถานะ: %)', r.status using errcode='55000';
  end if;$$,
  $$if r.status <> 'PENDING' then
    raise exception 'ใบลานี้ถูกดำเนินการไปแล้ว (สถานะ: %)', r.status using errcode='55000';
  end if;
  if c.role='ADMIN' and not public.njhr_request_approver_member('LEAVE', r.employee_id, c.employee_id) then
    raise exception 'รายการนี้ไม่ได้อยู่ในผังอนุมัติของคุณ' using errcode='42501';
  end if;$$
);

-- OT queue/decision: ADMIN is an approver, but never a manager.
select public._njhr_role101_replace(
  'public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,integer,integer)'::regprocedure,
  $$and (case when coalesce(p_mine,false) or not c.is_manager
                 then o.employee_id = c.employee_id else true end)$$,
  $$and (case when coalesce(p_mine,false) then o.employee_id = c.employee_id
                 when c.role in ('SUPER_ADMIN','HR') then true
                 when c.role='ADMIN' then public.njhr_request_approver_member('OT', o.employee_id, c.employee_id)
                 else o.employee_id = c.employee_id end)$$
);
select public._njhr_role101_replace(
  'public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,integer,integer)'::regprocedure,
  $$or c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER')))$$,
  $$or c.role in ('SUPER_ADMIN','HR','ADMIN')))$$
);
select public._njhr_role101_replace(
  'public.njhr_ot_decide(text,uuid,text,text)'::regprocedure,
  $$if not c.can_approve then
      raise exception 'คุณไม่มีสิทธิ์อนุมัติคำขอ OT' using errcode='42501';
    end if;$$,
  $$if not c.can_approve then
      raise exception 'คุณไม่มีสิทธิ์อนุมัติคำขอ OT' using errcode='42501';
    end if;
    if c.role='ADMIN' and not public.njhr_request_approver_member('OT', o.employee_id, c.employee_id) then
      raise exception 'รายการนี้ไม่ได้อยู่ในผังอนุมัติของคุณ' using errcode='42501';
    end if;$$
);

-- Attendance correction: ADMIN can see only its real current workflow queue.
select public._njhr_role101_replace(
  'public.njhr_att_correction_list(text,uuid,text,date,date,integer,integer,boolean)'::regprocedure,
  $$(c.is_manager or r.employee_id = c.employee_id)     -- พนักงานเห็นเฉพาะของตนเอง$$,
  $$(c.is_manager or r.employee_id = c.employee_id
          or (coalesce(p_mine_queue,false) and c.can_approve
              and coalesce((select allowed from public.njhr_attc_can_act(r.id, c.employee_id)), false)))$$
);
select public._njhr_role101_replace(
  'public.njhr_att_correction_approve(text,uuid,text)'::regprocedure,
  $$select * into c from public.njhr_attc_guard(p_token);
  if c.employee_id is null then$$,
  $$select * into c from public.njhr_attc_guard(p_token);
  if not c.can_approve then
    raise exception 'คุณไม่มีสิทธิ์อนุมัติรายการ' using errcode='42501';
  end if;
  if c.employee_id is null then$$
);
select public._njhr_role101_replace(
  'public.njhr_att_correction_reject(text,uuid,text)'::regprocedure,
  $$select * into c from public.njhr_attc_guard(p_token);
  if c.employee_id is null then$$,
  $$select * into c from public.njhr_attc_guard(p_token);
  if not c.can_approve then
    raise exception 'คุณไม่มีสิทธิ์อนุมัติรายการ' using errcode='42501';
  end if;
  if c.employee_id is null then$$
);

-- Attendance evidence is HR management data; HR and SUPER_ADMIN may view it.
create or replace function public.njhr_att_punch_evidence_list(
  p_token text, p_employee uuid, p_from date default null, p_to date default null, p_limit integer default 200
) returns table(
  id uuid, employee_id uuid, emp_code text, emp_name text, work_date date, action text,
  punched_at timestamptz, geofence_name text, lat double precision, lng double precision,
  distance_m numeric, accuracy_m numeric, verify_method text, face_similarity numeric,
  liveness_passed boolean, liveness_method text, snapshot_path text, device text, browser text, os text
)
language plpgsql stable security definer
set search_path = public
as $fn$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if upper(btrim(coalesce(c.role,''))) not in ('SUPER_ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์ดูหลักฐานการลงเวลาของพนักงาน' using errcode='42501';
  end if;
  if p_employee is null then raise exception 'กรุณาระบุพนักงาน' using errcode='22023'; end if;
  if p_from is not null and p_to is not null and p_from > p_to then
    raise exception 'ช่วงวันที่ไม่ถูกต้อง' using errcode='22023';
  end if;
  if not exists(select 1 from public.employees e where e.id=p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002';
  end if;
  return query
  select l.id,l.employee_id,e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         l.work_date,l.action,l.punched_at,coalesce(l.geofence_name,''),
         l.lat,l.lng,l.distance_m,l.accuracy_m,l.verify_method,l.face_similarity,
         l.liveness_passed,l.liveness_method,l.snapshot_path,l.device,l.browser,l.os
    from public.njhr_att_punch_log l
    join public.employees e on e.id=l.employee_id
   where l.employee_id=p_employee
     and (p_from is null or l.work_date>=p_from)
     and (p_to is null or l.work_date<=p_to)
   order by l.punched_at desc
   limit least(greatest(coalesce(p_limit,200),1),1000);
end
$fn$;

-- ---------------------------------------------------------------------------
-- User administration: HR may manage accounts, but cannot control SUPER_ADMIN.
-- Only the four intended roles can be assigned by this UI/API.
-- ---------------------------------------------------------------------------
select public._njhr_role101_replace(
  'public.njhr_user_save(text,uuid,text,text,uuid,text,text,boolean)'::regprocedure,
  $$select * into c from public.njhr_user_guard(p_token, true);$$,
  $$select * into c from public.njhr_user_guard(p_token, true);
  if v_role not in ('SUPER_ADMIN','HR','ADMIN','USER') then
    raise exception 'สิทธิ์ผู้ใช้ต้องเป็น USER, ADMIN, HR หรือ SUPER_ADMIN' using errcode='22023';
  end if;$$
);
select public._njhr_role101_replace(
  'public.njhr_user_save(text,uuid,text,text,uuid,text,text,boolean)'::regprocedure,
  $$if oldrow is null then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002'; end if;$$,
  $$if oldrow is null then raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002'; end if;
    if c.role <> 'SUPER_ADMIN'
       and exists(select 1 from public.app_users x where x.id=p_user_id and x.app_code='salary' and upper(x.role::text)='SUPER_ADMIN') then
      raise exception 'เฉพาะ SUPER_ADMIN เท่านั้นที่แก้ไขบัญชี SUPER_ADMIN ได้' using errcode='42501';
    end if;$$
);
select public._njhr_role101_replace(
  'public.njhr_user_password(text,uuid,text)'::regprocedure,
  $$select * into c from public.njhr_user_guard(p_token, true);$$,
  $$select * into c from public.njhr_user_guard(p_token, true);
  if c.role <> 'SUPER_ADMIN'
     and exists(select 1 from public.app_users x where x.id=p_user_id and x.app_code='salary' and upper(x.role::text)='SUPER_ADMIN') then
    raise exception 'เฉพาะ SUPER_ADMIN เท่านั้นที่ตั้งรหัสผ่านบัญชี SUPER_ADMIN ได้' using errcode='42501';
  end if;$$
);
select public._njhr_role101_replace(
  'public.njhr_user_link(text,uuid,uuid)'::regprocedure,
  $$select * into c from public.njhr_user_guard(p_token, true);$$,
  $$select * into c from public.njhr_user_guard(p_token, true);
  if c.role <> 'SUPER_ADMIN'
     and exists(select 1 from public.app_users x where x.id=p_user_id and x.app_code='salary' and upper(x.role::text)='SUPER_ADMIN') then
    raise exception 'เฉพาะ SUPER_ADMIN เท่านั้นที่แก้ไขการเชื่อมบัญชี SUPER_ADMIN ได้' using errcode='42501';
  end if;$$
);

-- Activation/onboarding is HR work (not deletion).
select public._njhr_role101_replace(
  'public.njhr_activation_list(text,text)'::regprocedure,
  $$if c.role <> 'SUPER_ADMIN' then$$,
  $$if c.role not in ('SUPER_ADMIN','HR') then$$
);
select public._njhr_role101_replace(
  'public.njhr_activation_link(text,uuid,text)'::regprocedure,
  $$if c.role <> 'SUPER_ADMIN' then$$,
  $$if c.role not in ('SUPER_ADMIN','HR') then$$
);
select public._njhr_role101_replace(
  'public.njhr_activation_reject(text,uuid,text)'::regprocedure,
  $$if c.role <> 'SUPER_ADMIN' then$$,
  $$if c.role not in ('SUPER_ADMIN','HR') then$$
);

-- ---------------------------------------------------------------------------
-- Destructive/delete guard: HR is deliberately blocked at the RPC boundary.
-- ---------------------------------------------------------------------------
create or replace function public.njhr_require_super_delete(p_token text)
returns void
language plpgsql stable security definer
set search_path = public
as $fn$
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะ SUPER_ADMIN เท่านั้นที่ลบข้อมูลได้' using errcode='42501';
  end if;
end
$fn$;
revoke all on function public.njhr_require_super_delete(text) from public, anon, authenticated;

-- Bulk payroll delete is action-based rather than a *_delete RPC. HR may
-- ACTIVATE/DEACTIVATE entries but DELETE remains SUPER_ADMIN-only.
select public._njhr_role101_replace(
  'public.njhr_pay_entry_bulk(text,uuid[],text)'::regprocedure,
  $$  if v_act not in ('DELETE','DEACTIVATE','ACTIVATE') then
    raise exception 'คำสั่งไม่ถูกต้อง (DELETE / DEACTIVATE / ACTIVATE)' using errcode='22023';
  end if;$$,
  $$  if v_act not in ('DELETE','DEACTIVATE','ACTIVATE') then
    raise exception 'คำสั่งไม่ถูกต้อง (DELETE / DEACTIVATE / ACTIVATE)' using errcode='22023';
  end if;
  if v_act = 'DELETE' then
    perform public.njhr_require_super_delete(p_token);
  end if;$$
);

-- Inject the server-side delete guard into existing destructive RPCs without
-- rewriting their business logic or return contracts.
do $role101$
declare
  sig text;
  d text;
  sigs text[] := array[
    'public.njhr_dept_delete(text,uuid,boolean)',
    'public.njhr_doc_delete(text,uuid,text)',
    'public.njhr_event_delete(text,uuid)',
    'public.njhr_face_delete(text,uuid,text)',
    'public.njhr_gf_delete(text,uuid,boolean)',
    'public.njhr_holiday_delete(text,uuid)',
    'public.njhr_pay_entry_delete(text,uuid)',
    'public.njhr_pay_item_delete(text,text)',
    'public.njhr_wf_approver_remove(text,uuid,uuid)',
    'public.njhr_wf_delete(text,uuid,boolean)',
    'public.njhr_wf_step_delete(text,uuid,boolean)'
  ];
begin
  foreach sig in array sigs loop
    select replace(pg_get_functiondef(sig::regprocedure::oid), E'\r\n', E'\n') into d;
    if position('perform public.njhr_require_super_delete(p_token);' in d)=0 then
      d := regexp_replace(
        d,
        E'\nbegin\n',
        E'\nbegin\n  perform public.njhr_require_super_delete(p_token);\n',
        ''
      );
      if position('perform public.njhr_require_super_delete(p_token);' in d)=0 then
        raise exception 'ROLE101 delete-guard injection failed for %', sig using errcode='P0001';
      end if;
      execute d;
    end if;
  end loop;
end
$role101$;

-- Already-safe destructive RPCs stay as-is:
-- njhr_user_delete, njhr_announcement_delete, njhr_empfile_delete.

-- ---------------------------------------------------------------------------
-- Internal helper cleanup
-- ---------------------------------------------------------------------------
drop function public._njhr_role101_replace(regprocedure,text,text);

-- === ROLE HARDENING ROUND 2 — ปิดสิทธิ์ ADMIN ที่ฝังตรงใน RPC เก่า; HR เป็นผู้ดูแล, ADMIN = USER + Approval เท่านั้น
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_audit_list(text,text,integer,integer)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_audit_list(text,text,integer,integer)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_leave_adj_save(text,uuid,integer,text,numeric,numeric,text)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_leave_adj_save(text,uuid,integer,text,numeric,numeric,text)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_leave_type_save(text,text,text,text,boolean,boolean,numeric)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_leave_type_save(text,text,text,text,boolean,boolean,numeric)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_pay_item_reorder(text,text[])'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_pay_item_reorder(text,text[])'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_pay_item_save(text,text,text,text,text,numeric,numeric,numeric,text,text,boolean,boolean,boolean,boolean)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_pay_item_save(text,text,text,text,text,numeric,numeric,numeric,text,text,boolean,boolean,boolean,boolean)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_pay_items(text,text,text,boolean)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_pay_items(text,text,text,boolean)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_report_all_employees(text,text,uuid)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_report_all_employees(text,text,uuid)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','ACCOUNT')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_user_stats(text)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_user_stats(text)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_doc_pdf_access(text,uuid)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_doc_pdf_access(text,uuid)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_doc_pdf_claim(text,uuid)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_doc_pdf_claim(text,uuid)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_doc_pdf_status(text,uuid)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_doc_pdf_status(text,uuid)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_doc_flow(text,uuid,text,text,jsonb)'::regprocedure);
  if position($old$('SUPER_ADMIN','ADMIN','HR')$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_doc_flow(text,uuid,text,text,jsonb)'; end if;
  d := replace(d, $old$('SUPER_ADMIN','ADMIN','HR')$old$, $new$('SUPER_ADMIN','HR')$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_me_guard(text)'::regprocedure);
  if position($old$when 'ADMIN'       then 'ADMIN'$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing ADMIN: public.njhr_me_guard(text)'; end if;
  d := replace(d, $old$when 'ADMIN'       then 'ADMIN'$old$, $new$when 'HR'          then 'HR'
      when 'ADMIN'       then 'ADMIN'$new$);
  if position($old$when 'MANAGER'     then 'ADMIN'$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing MANAGER: public.njhr_me_guard(text)'; end if;
  d := replace(d, $old$when 'MANAGER'     then 'ADMIN'$old$, $new$when 'MANAGER'     then 'USER'$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_leave_detail(text,uuid)'::regprocedure);
  if position($old$if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') and r.employee_id is distinct from c.employee_id then$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_leave_detail(text,uuid)'; end if;
  d := replace(d, $old$if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') and r.employee_id is distinct from c.employee_id then$old$, $new$if c.role not in ('SUPER_ADMIN','HR') and r.employee_id is distinct from c.employee_id and not (c.role='ADMIN' and public.njhr_request_approver_member('LEAVE',r.employee_id,c.employee_id)) then$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_ot_attach_list(text,text)'::regprocedure);
  if position($old$or c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER'))$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_ot_attach_list(text,text)'; end if;
  d := replace(d, $old$or c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER'))$old$, $new$or c.role in ('SUPER_ADMIN','HR') or (c.role='ADMIN' and exists (select 1 from public.ot_requests o where o.id::text=btrim(p_ot_id) and public.njhr_request_approver_member('OT',o.employee_id,c.employee_id))))$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_ot_attach_delete(text,text)'::regprocedure);
  if position($old$select * into c from public.njhr_ctx(p_token);$old$ in d)=0 then raise exception 'ROLE_PATCH precondition ctx: public.njhr_ot_attach_delete(text,text)'; end if;
  d := replace(d, $old$select * into c from public.njhr_ctx(p_token);$old$, $new$select * into c from public.njhr_ctx(p_token);
  if c.role = 'HR' then raise exception 'HR ไม่มีสิทธิ์ลบข้อมูล' using errcode='42501'; end if;$new$);
  if position($old$and c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then$old$ in d)=0 then raise exception 'ROLE_PATCH precondition role: public.njhr_ot_attach_delete(text,text)'; end if;
  d := replace(d, $old$and c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then$old$, $new$and c.role <> 'SUPER_ADMIN' then$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_leave_submit_core_v145(text,text,text,date,date,time without time zone,time without time zone,text,uuid,jsonb,text)'::regprocedure);
  if position($old$and public.njhr_norm_role(a.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_leave_submit_core_v145(text,text,text,date,date,time without time zone,time without time zone,text,uuid,jsonb,text)'; end if;
  d := replace(d, $old$and public.njhr_norm_role(a.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');$old$, $new$and (public.njhr_norm_role(a.role::text) in ('SUPER_ADMIN','HR') or (public.njhr_norm_role(a.role::text)='ADMIN' and public.njhr_request_approver_member('LEAVE',c.employee_id,a.employee_id)));$new$);
  execute d;
end
$role_patch$;
do $role_patch$
declare d text;
begin
  d := pg_get_functiondef('public.njhr_ot_submit_core_v145(text,date,time without time zone,time without time zone,boolean,jsonb,text)'::regprocedure);
  if position($old$and public.njhr_norm_role(u.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');$old$ in d)=0 then raise exception 'ROLE_PATCH precondition missing: public.njhr_ot_submit_core_v145(text,date,time without time zone,time without time zone,boolean,jsonb,text)'; end if;
  d := replace(d, $old$and public.njhr_norm_role(u.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');$old$, $new$and (public.njhr_norm_role(u.role::text) in ('SUPER_ADMIN','HR') or (public.njhr_norm_role(u.role::text)='ADMIN' and public.njhr_request_approver_member('OT',c.employee_id,u.employee_id)));$new$);
  execute d;
end
$role_patch$;
revoke all on function public.njhr_request_approver_member(text,uuid,uuid) from public, anon, authenticated;
