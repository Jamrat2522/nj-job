-- ============================================================
-- NJ HR V.10 — 90_wf_route.sql
-- เส้นทางอนุมัติจริงของพนักงาน 1 คน — ใช้เป็นตัวกลางระหว่าง Workflow กับคำขอลา/OT
--
-- ต่อยอดจาก 86 · 88 (ไม่สร้างตารางใหม่ ไม่แตะโครงสร้างเดิม)
--   njhr_approval_workflows       : request_type('LEAVE','OT','BOTH') · scope('ALL','SELECTED','EMPLOYEE')
--   njhr_approval_workflow_depts  : (request_type, department) unique
--   njhr_approval_workflow_emps   : (request_type, employee_id) unique
--   njhr_approval_steps           : step_no · name · mode('ANY','ALL') · active
--   njhr_approval_step_approvers  : step_id · employee_id · active
--
-- ให้อะไร
--   njhr_wf_route()        คืนเส้นทางเต็ม (ขั้น + ผู้อนุมัติแต่ละขั้น) ตาม Priority 1→2→3
--                          ถ้าไม่พบ Workflow หรือไม่มีขั้น/ผู้อนุมัติ จะคืน ok=false พร้อมเหตุผลชัดเจน
--   njhr_wf_route_check()  ตรวจทั้งบริษัทว่าใครยังหาเส้นทางไม่เจอ (ใช้ก่อนเปิดใช้งานจริง)
--
-- อ่านอย่างเดียวทั้งคู่ ไม่เขียนข้อมูลใด ๆ · ยังไม่ผูกเข้ากับ njhr_leave_submit / njhr_ot_submit
-- (การเปลี่ยนเครื่องยนต์อนุมัติเป็นงานแยก เพราะกระทบคำขอที่ใช้งานอยู่จริง)
--
-- ต้องรัน 44 · 66 · 86 · 88 มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.njhr_approval_workflow_emps') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_approval_workflow_emps — รัน 88_wf_scope_employee.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── njhr_wf_route — เส้นทางอนุมัติของพนักงานรายคน ──────────
create or replace function public.njhr_wf_route(
  p_token text, p_type text, p_employee uuid)
returns table (ok boolean, reason text, data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,''))); v_dept text;
        w record; v_steps jsonb; v_bad text;
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT') then
    raise exception 'ประเภทคำขอต้องเป็น LEAVE หรือ OT' using errcode='22023';
  end if;
  if p_employee is null then
    return query select false, 'ไม่พบพนักงานผู้ยื่นคำขอ'::text, '{}'::jsonb; return;
  end if;
  select e.department_name into v_dept from public.employees e where e.id = p_employee;

  -- Priority 1 → 2 → 3 · เลือกได้ชุดเดียวเท่านั้น
  select c.wid, c.sc, c.pr, c.ad, c.nm into w from (
    select w1.id wid, w1.scope sc, 1 pr, w1.department ad, coalesce(w1.name,'') nm
      from public.njhr_approval_workflow_emps m
      join public.njhr_approval_workflows w1 on w1.id = m.workflow_id
     where m.request_type = v_type and m.employee_id = p_employee and w1.deleted_at is null
    union all
    select w2.id, w2.scope, 2, w2.department, coalesce(w2.name,'')
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w2 on w2.id = d.workflow_id
     where d.request_type = v_type and d.department = v_dept and w2.deleted_at is null
    union all
    select w3.id, w3.scope, 3, w3.department, coalesce(w3.name,'')
      from public.njhr_approval_workflow_depts d2
      join public.njhr_approval_workflows w3 on w3.id = d2.workflow_id
     where d2.request_type = v_type and d2.department = '*' and w3.deleted_at is null
  ) c order by c.pr limit 1;

  if w.wid is null then
    return query select false,
      ('ยังไม่ได้ตั้งผังการอนุมัติสำหรับ' ||
       case v_type when 'LEAVE' then 'การลางาน' else 'การขอ OT' end ||
       ' ของแผนก ' || coalesce(nullif(v_dept,''), '(ไม่ระบุแผนก)') ||
       ' — กรุณาติดต่อฝ่ายบุคคล')::text, '{}'::jsonb;
    return;
  end if;

  -- ขั้นที่เปิดใช้งาน พร้อมผู้อนุมัติที่ยัง active และยังเป็นพนักงานปัจจุบัน
  select jsonb_agg(x order by (x->>'step_no')::int) into v_steps from (
    select jsonb_build_object(
             'step_id', s.id, 'step_no', s.step_no, 'name', s.name, 'mode', s.mode,
             'cond_type', s.cond_type, 'cond_value', s.cond_value,
             'approvers', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'employee_id', e.id, 'emp_code', e.emp_code,
                        'name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                        'position', coalesce(e.position_name,''),
                        'department', coalesce(e.department_name,''))
                      order by e.emp_code)
                 from public.njhr_approval_step_approvers a
                 join public.employees e on e.id = a.employee_id
                where a.step_id = s.id and a.active
                  and e.status::text in ('ACTIVE','PROBATION')), '[]'::jsonb)) x
      from public.njhr_approval_steps s
     where s.workflow_id = w.wid and s.deleted_at is null and s.active) t;

  v_steps := coalesce(v_steps, '[]'::jsonb);

  if jsonb_array_length(v_steps) = 0 then
    return query select false,
      ('ผังการอนุมัติ "' || coalesce(nullif(w.nm,''), w.ad) || '" ยังไม่มีขั้นอนุมัติที่เปิดใช้งาน')::text,
      '{}'::jsonb;
    return;
  end if;

  -- ขั้นที่ไม่มีผู้อนุมัติเลย = เส้นทางขาด ส่งคำขอไม่ได้
  select string_agg('ขั้นที่ ' || (s->>'step_no') || ' ' || (s->>'name'), ', ') into v_bad
    from jsonb_array_elements(v_steps) s
   where jsonb_array_length(s->'approvers') = 0;
  if v_bad is not null then
    return query select false,
      ('ยังไม่มีผู้อนุมัติใน ' || v_bad || ' — กรุณาติดต่อฝ่ายบุคคล')::text, '{}'::jsonb;
    return;
  end if;

  return query select true, ''::text, jsonb_build_object(
    'workflow_id', w.wid, 'workflow_name', coalesce(nullif(w.nm,''), w.ad),
    'scope', w.sc, 'priority', w.pr, 'request_type', v_type,
    'employee_id', p_employee, 'department', coalesce(v_dept,''),
    'step_count', jsonb_array_length(v_steps),
    'steps', v_steps,
    'resolved_at', to_char(now() at time zone 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS'));
end $$;


-- ─── njhr_wf_route_check — ตรวจทั้งบริษัทก่อนเปิดใช้งานจริง ──
create or replace function public.njhr_wf_route_check(p_token text)
returns table (request_type text, department text, employees int,
               status text, detail text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_wf_guard(p_token);
  return query
  with emp as (
    select e.id, coalesce(e.department_name,'') dept
      from public.employees e where e.status::text in ('ACTIVE','PROBATION')),
  t as (select unnest(array['LEAVE','OT']) rt),
  pick as (
    select e.id eid, e.dept, t.rt,
           (select c.wid from (
              select w1.id wid, 1 pr from public.njhr_approval_workflow_emps m
                join public.njhr_approval_workflows w1 on w1.id = m.workflow_id
               where m.request_type = t.rt and m.employee_id = e.id and w1.deleted_at is null
              union all
              select w2.id, 2 from public.njhr_approval_workflow_depts d
                join public.njhr_approval_workflows w2 on w2.id = d.workflow_id
               where d.request_type = t.rt and d.department = e.dept and w2.deleted_at is null
              union all
              select w3.id, 3 from public.njhr_approval_workflow_depts d2
                join public.njhr_approval_workflows w3 on w3.id = d2.workflow_id
               where d2.request_type = t.rt and d2.department = '*' and w3.deleted_at is null
            ) c order by c.pr limit 1) wid
      from emp e cross join t)
  select p.rt, nullif(p.dept,''), count(*)::int,
         case when p.wid is null then 'ไม่พบผังการอนุมัติ'
              when (select count(*) from public.njhr_approval_steps s
                     where s.workflow_id = p.wid and s.deleted_at is null and s.active) = 0
                then 'พบผังแต่ไม่มีขั้นอนุมัติ'
              when exists (select 1 from public.njhr_approval_steps s
                            where s.workflow_id = p.wid and s.deleted_at is null and s.active
                              and not exists (select 1 from public.njhr_approval_step_approvers a
                                               join public.employees e2 on e2.id = a.employee_id
                                              where a.step_id = s.id and a.active
                                                and e2.status::text in ('ACTIVE','PROBATION')))
                then 'มีขั้นที่ยังไม่มีผู้อนุมัติ'
              else 'พร้อมใช้งาน' end,
         coalesce((select coalesce(nullif(w.name,''), w.department)
                     from public.njhr_approval_workflows w where w.id = p.wid), '—')
    from pick p
   group by p.rt, p.dept, p.wid
   order by 4 desc, 1, 2;
end $$;


grant execute on function public.njhr_wf_route(text,text,uuid) to anon, authenticated;
grant execute on function public.njhr_wf_route_check(text)     to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.0-wf-route', 'เส้นทางอนุมัติจริงตาม Priority + ตัวตรวจความพร้อมทั้งบริษัท')
on conflict (version) do nothing;


-- ─── VERIFICATION ───────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname in ('njhr_wf_route','njhr_wf_route_check')),
  'workflows_active', (select count(*) from public.njhr_approval_workflows where deleted_at is null),
  'steps_active', (select count(*) from public.njhr_approval_steps
                    where deleted_at is null and active),
  'approvers_active', (select count(*) from public.njhr_approval_step_approvers where active)
)) as install_report;
