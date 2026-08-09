-- ============================================================
-- NJ HR V.10 — 88_wf_scope_employee.sql
-- ขอบเขตการใช้งาน Workflow: ทุกแผนก / เลือกแผนก / เลือกพนักงาน
--
-- โครงสร้างเดิมที่ยืนยันแล้ว (ไม่ทำลาย ไม่ลบข้อมูล)
--   njhr_approval_workflows      : request_type('LEAVE','OT','BOTH') · department(anchor)
--                                  scope('ALL','SELECTED') · name · active · deleted_at
--   njhr_approval_workflow_depts : workflow_id · request_type · department
--                                  unique (request_type, department)
--   njhr_approval_steps / _step_approvers : ไม่แตะเลย
--
-- เพิ่มใหม่
--   1) scope รับค่า 'EMPLOYEE' เพิ่มอีกหนึ่งค่า (ของเดิม ALL/SELECTED ยังใช้ได้เหมือนเดิม)
--   2) ตารางลูกใหม่ njhr_approval_workflow_emps  (workflow_id · request_type · employee_id)
--      unique (request_type, employee_id) → พนักงาน 1 คนผูกกับ Workflow ของประเภทนั้นได้ชุดเดียว
--   3) njhr_wf_resolve() เลือก Workflow ที่ "ตรงที่สุด" ตาม Priority
--        1 = EMPLOYEE · 2 = SELECTED (แผนก) · 3 = ALL   → คืนชุดเดียวเสมอ
--
-- ไม่แตะ: ขั้นอนุมัติ · ผู้อนุมัติ · ANY/ALL · ลำดับการอนุมัติ · Permission
-- ต้องรัน 44 · 66 · 86 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_approval_workflows') is null
     or to_regclass('public.njhr_approval_workflow_depts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง Workflow — รัน 44 และ 66 ก่อน';
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.njhr_approval_workflows'::regclass
                    and conname = 'njhr_wf_reqtype_chk') then
    raise exception 'PREFLIGHT: ยังไม่ได้รัน 86_wf_multi_type.sql (ไม่พบ njhr_wf_reqtype_chk)';
  end if;
  raise notice 'ก่อนแก้ · Workflow % ชุด · ผูกแผนกไว้ % แถว',
    (select count(*) from public.njhr_approval_workflows where deleted_at is null),
    (select count(*) from public.njhr_approval_workflow_depts);
end $$;


-- ─── 1) scope รับค่า EMPLOYEE เพิ่ม ─────────────────────────
do $$
declare cn text;
begin
  for cn in select con.conname from pg_constraint con
             where con.conrelid = 'public.njhr_approval_workflows'::regclass
               and con.contype = 'c'
               and pg_get_constraintdef(con.oid) ilike '%scope%'
  loop
    execute format('alter table public.njhr_approval_workflows drop constraint %I', cn);
  end loop;
  alter table public.njhr_approval_workflows
    add constraint njhr_wf_scope_chk check (scope in ('ALL','SELECTED','EMPLOYEE'));
end $$;


-- ─── 2) ตารางลูก: พนักงานที่ Workflow ครอบคลุม ──────────────
create table if not exists public.njhr_approval_workflow_emps (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references public.njhr_approval_workflows(id) on delete cascade,
  request_type text not null,
  employee_id  uuid not null references public.employees(id) on delete cascade,
  created_at   timestamptz not null default now(),
  created_by   text
);
alter table public.njhr_approval_workflow_emps enable row level security;
-- พนักงาน 1 คน + ประเภทคำขอ 1 ประเภท = Workflow ชุดเดียว (กันทับซ้อนที่ฐานข้อมูล)
create unique index if not exists njhr_wfe_uidx
  on public.njhr_approval_workflow_emps (request_type, employee_id);
create index if not exists njhr_wfe_wf_idx
  on public.njhr_approval_workflow_emps (workflow_id);

comment on table public.njhr_approval_workflow_emps is
  'พนักงานที่ Workflow ครอบคลุม (ใช้กับ scope = EMPLOYEE) — จัดการผ่าน njhr_wf_save เท่านั้น';

do $$
declare pn text;
begin
  for pn in select policyname from pg_policies
             where schemaname='public' and tablename='njhr_approval_workflow_emps'
               and 'anon' = any(roles) and (qual='true' or qual is null)
  loop execute format('drop policy %I on public.njhr_approval_workflow_emps', pn); end loop;
end $$;


-- ─── 3) Trigger: scope=EMPLOYEE ไม่ต้องผูกแผนก ──────────────
create or replace function public.njhr_wf_depts_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if TG_OP = 'INSERT' then
    if new.scope <> 'EMPLOYEE' and coalesce(btrim(new.department),'') <> '' then
      foreach t in array (case when new.request_type = 'BOTH'
                               then array['LEAVE','OT'] else array[new.request_type] end)
      loop
        insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
        values (new.id, t, btrim(new.department), coalesce(new.created_by,'trigger'))
        on conflict (request_type, department) do nothing;
      end loop;
    end if;
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if old.deleted_at is not null and new.deleted_at is null
       and new.scope <> 'EMPLOYEE' and coalesce(btrim(new.department),'') <> '' then
      foreach t in array (case when new.request_type = 'BOTH'
                               then array['LEAVE','OT'] else array[new.request_type] end)
      loop
        insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
        values (new.id, t, btrim(new.department), 'trigger_restore')
        on conflict (request_type, department) do nothing;
      end loop;
    end if;
    if old.deleted_at is null and new.deleted_at is not null then
      delete from public.njhr_approval_workflow_depts where workflow_id = new.id;
      delete from public.njhr_approval_workflow_emps  where workflow_id = new.id;
    end if;
    return new;
  end if;

  return coalesce(new, old);
end $$;


-- ─── 4) njhr_wf_save — เพิ่ม scope EMPLOYEE ─────────────────
drop function if exists public.njhr_wf_save(text,uuid,text,text,text,text[],text[]);
create or replace function public.njhr_wf_save(
  p_token text, p_id uuid default null, p_type text default null,
  p_name text default null, p_scope text default null, p_departments text[] default null,
  p_types text[] default null, p_employees uuid[] default null)
returns table (workflow_id uuid, anchor_dept text, dept_count int, emp_count int, request_type text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; v_anchor text; v_clash text; t text;
        v_scope text := upper(btrim(coalesce(p_scope,'SELECTED')));
        v_depts text[]; v_emps uuid[]; v_types text[]; v_stored text; oldrow jsonb;
begin
  select * into c from public.njhr_wf_guard(p_token);

  select array_agg(distinct upper(btrim(x))) into v_types
    from unnest(coalesce(p_types, case when coalesce(btrim(p_type),'') = ''
                                       then '{}'::text[] else array[p_type] end)) x
   where upper(btrim(x)) in ('LEAVE','OT');
  if v_types is null or array_length(v_types,1) is null then
    raise exception 'กรุณาเลือกประเภทคำขออย่างน้อย 1 ประเภท (การลางาน / การขอ OT)' using errcode='22023';
  end if;
  v_stored := case when array_length(v_types,1) = 2 then 'BOTH' else v_types[1] end;

  if v_scope not in ('ALL','SELECTED','EMPLOYEE') then
    raise exception 'ขอบเขตต้องเป็น ALL / SELECTED / EMPLOYEE' using errcode='22023';
  end if;

  if v_scope = 'ALL' then
    v_depts := array['*']; v_emps := null;
  elsif v_scope = 'SELECTED' then
    select array_agg(distinct btrim(t2.x)) into v_depts
      from unnest(coalesce(p_departments, '{}'::text[])) as t2(x)
     where btrim(t2.x) <> '' and btrim(t2.x) <> '*';
    if v_depts is null or array_length(v_depts,1) is null then
      raise exception 'กรุณาเลือกอย่างน้อย 1 แผนก' using errcode='22023';
    end if;
    v_emps := null;
  else
    select array_agg(distinct x) into v_emps
      from unnest(coalesce(p_employees, '{}'::uuid[])) as x
     where x is not null;
    if v_emps is null or array_length(v_emps,1) is null then
      raise exception 'กรุณาเลือกอย่างน้อย 1 พนักงาน' using errcode='22023';
    end if;
    if exists (select 1 from unnest(v_emps) x
                where not exists (select 1 from public.employees e where e.id = x)) then
      raise exception 'มีพนักงานที่เลือกไม่อยู่ในทะเบียนพนักงาน' using errcode='P0002';
    end if;
    v_depts := null;
  end if;

  -- แผนกหลัก (anchor) — RPC ขั้นอนุมัติเดิมค้นด้วยค่านี้ จึงต้องไม่ซ้ำกันทุกชุด
  if v_scope = 'EMPLOYEE' then
    v_anchor := coalesce((select w.department from public.njhr_approval_workflows w
                           where w.id = p_id and w.department like '@EMP:%'),
                         '@EMP:' || replace(gen_random_uuid()::text, '-', ''));
  else
    v_anchor := v_depts[1];
  end if;

  -- ตรวจทับซ้อนก่อนบันทึก แล้วแจ้งให้ชัดว่าชนอะไร
  if v_scope = 'SELECTED' then
    select string_agg(distinct
             (case d.request_type when 'LEAVE' then 'การลางาน' else 'การขอ OT' end)
             || ': ' || d.department, ' · ') into v_clash
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w on w.id = d.workflow_id
     where d.request_type = any(v_types) and d.department = any(v_depts)
       and w.deleted_at is null and (p_id is null or d.workflow_id <> p_id);
    if v_clash is not null then
      raise exception 'แผนกนี้ถูกใช้ใน Workflow ชุดอื่นแล้ว — %', v_clash using errcode='23505';
    end if;
  elsif v_scope = 'EMPLOYEE' then
    select string_agg(distinct
             (case m.request_type when 'LEAVE' then 'การลางาน' else 'การขอ OT' end)
             || ': ' || e.emp_code, ' · ') into v_clash
      from public.njhr_approval_workflow_emps m
      join public.njhr_approval_workflows w on w.id = m.workflow_id
      join public.employees e on e.id = m.employee_id
     where m.request_type = any(v_types) and m.employee_id = any(v_emps)
       and w.deleted_at is null and (p_id is null or m.workflow_id <> p_id);
    if v_clash is not null then
      raise exception 'พนักงานรายนี้ถูกใช้ใน Workflow ชุดอื่นแล้ว — %', v_clash using errcode='23505';
    end if;
  elsif v_scope = 'ALL' then
    select string_agg(distinct
             (case d.request_type when 'LEAVE' then 'การลางาน' else 'การขอ OT' end), ' · ') into v_clash
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w on w.id = d.workflow_id
     where d.request_type = any(v_types) and d.department = '*'
       and w.deleted_at is null and (p_id is null or d.workflow_id <> p_id);
    if v_clash is not null then
      raise exception 'มีชุด "ทุกแผนก" ของประเภทคำขอนี้อยู่แล้ว — %', v_clash using errcode='23505';
    end if;
  end if;

  if p_id is null then
    insert into public.njhr_approval_workflows
           (request_type, department, scope, name, created_by, updated_by)
    values (v_stored, v_anchor, v_scope, nullif(btrim(coalesce(p_name,'')),''), c.username, c.username)
    returning njhr_approval_workflows.id into v_id;
  else
    select to_jsonb(w) into oldrow from public.njhr_approval_workflows w
     where w.id = p_id and w.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบ Workflow ชุดนี้' using errcode='P0002'; end if;
    v_id := p_id;
    delete from public.njhr_approval_workflow_depts where workflow_id = v_id;
    delete from public.njhr_approval_workflow_emps  where workflow_id = v_id;
    update public.njhr_approval_workflows
       set request_type = v_stored, department = v_anchor, scope = v_scope,
           name = nullif(btrim(coalesce(p_name,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_approval_workflows.id = v_id;
  end if;

  if v_scope = 'EMPLOYEE' then
    foreach t in array v_types loop
      insert into public.njhr_approval_workflow_emps (workflow_id, request_type, employee_id, created_by)
      select v_id, t, x, c.username from unnest(v_emps) x
      on conflict (request_type, employee_id) do nothing;
    end loop;
  else
    foreach t in array v_types loop
      insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
      select v_id, t, d, c.username from unnest(v_depts) d
      on conflict (request_type, department) do nothing;
    end loop;
  end if;

  perform public.njhr_audit_write(p_token,
    case when p_id is null then 'WF_ADD' else 'WF_EDIT' end,
    'approval', 'njhr_approval_workflows', v_id::text,
    array_to_string(v_types, '+') || ' · ' ||
    case v_scope when 'ALL' then 'ทุกแผนก'
                 when 'EMPLOYEE' then 'เลือกพนักงาน ' || array_length(v_emps,1) || ' คน'
                 else array_to_string(v_depts, ', ') end,
    oldrow, (select to_jsonb(w) from public.njhr_approval_workflows w where w.id = v_id), null);

  return query
  select v_id, v_anchor,
         (select count(distinct d2.department)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = v_id and d2.department <> '*'),
         (select count(distinct m2.employee_id)::int from public.njhr_approval_workflow_emps m2
           where m2.workflow_id = v_id),
         v_stored;
end $$;


-- ─── 5) njhr_wf_list — คืนข้อมูลขอบเขตทั้งสองแบบ ────────────
drop function if exists public.njhr_wf_list(text,text);
create or replace function public.njhr_wf_list(p_token text, p_type text default 'LEAVE')
returns table (workflow_id uuid, request_type text, request_types jsonb, wf_name text, scope text,
               anchor_dept text, departments jsonb, dept_count int,
               employees jsonb, emp_count int,
               step_count int, approver_count int, active boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE')));
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT','ALL') then v_type := 'LEAVE'; end if;
  return query
  select w.id, w.request_type,
         case w.request_type when 'BOTH' then '["LEAVE","OT"]'::jsonb
                             else to_jsonb(array[w.request_type]) end,
         coalesce(w.name,''), w.scope, w.department,
         coalesce((select jsonb_agg(distinct d.department)
                     from public.njhr_approval_workflow_depts d
                    where d.workflow_id = w.id and d.department <> '*'), '[]'::jsonb),
         (select count(distinct d2.department)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = w.id and d2.department <> '*'),
         coalesce((select jsonb_agg(jsonb_build_object(
                     'employee_id', e.id, 'emp_code', e.emp_code,
                     'name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                     'nickname', coalesce(e.nickname,''),
                     'department', coalesce(e.department_name,'')) order by e.emp_code)
                     from (select distinct m.employee_id from public.njhr_approval_workflow_emps m
                            where m.workflow_id = w.id) mm
                     join public.employees e on e.id = mm.employee_id), '[]'::jsonb),
         (select count(distinct m2.employee_id)::int from public.njhr_approval_workflow_emps m2
           where m2.workflow_id = w.id),
         (select count(*)::int from public.njhr_approval_steps s
           where s.workflow_id = w.id and s.deleted_at is null),
         (select count(*)::int from public.njhr_approval_step_approvers a
            join public.njhr_approval_steps s2 on s2.id = a.step_id
           where s2.workflow_id = w.id and s2.deleted_at is null),
         w.active, w.updated_at
    from public.njhr_approval_workflows w
   where w.deleted_at is null
     and (v_type = 'ALL' or w.request_type = v_type or w.request_type = 'BOTH')
   order by case w.scope when 'EMPLOYEE' then 0 when 'SELECTED' then 1 else 2 end,
            coalesce(w.name,''), w.department;
end $$;


-- ─── 6) njhr_wf_emp_pool — รายชื่อพนักงานสำหรับเลือก ────────
create or replace function public.njhr_wf_emp_pool(
  p_token text, p_type text default 'LEAVE', p_q text default null,
  p_exclude_workflow uuid default null, p_limit int default 300)
returns table (employee_id uuid, emp_code text, full_name text, nickname text,
               department_name text, position_name text, taken_by uuid)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE')));
        q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,300),1),1000);
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT') then v_type := 'LEAVE'; end if;
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''), coalesce(e.position_name,''),
         (select m.workflow_id from public.njhr_approval_workflow_emps m
            join public.njhr_approval_workflows w on w.id = m.workflow_id
           where m.request_type = v_type and m.employee_id = e.id and w.deleted_at is null
             and (p_exclude_workflow is null or m.workflow_id <> p_exclude_workflow)
           limit 1)
    from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit lim;
end $$;


-- ─── 7) njhr_wf_resolve — เลือกชุดที่ตรงที่สุดตาม Priority ───
--  1 = ผูกพนักงานรายคน · 2 = ผูกแผนก · 3 = ทุกแผนก  → คืนชุดเดียวเสมอ
create or replace function public.njhr_wf_resolve(
  p_token text, p_type text, p_employee uuid)
returns table (workflow_id uuid, scope text, priority int, anchor_dept text,
               wf_name text, step_count int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE'))); v_dept text;
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT') then
    raise exception 'ประเภทคำขอต้องเป็น LEAVE หรือ OT' using errcode='22023';
  end if;
  select e.department_name into v_dept from public.employees e where e.id = p_employee;

  return query
  with cand as (
    -- Priority 1: ผูกพนักงานรายคน
    select w.id wid, w.scope sc, 1 pr, w.department ad, coalesce(w.name,'') nm
      from public.njhr_approval_workflow_emps m
      join public.njhr_approval_workflows w on w.id = m.workflow_id
     where m.request_type = v_type and m.employee_id = p_employee and w.deleted_at is null
    union all
    -- Priority 2: ผูกแผนกของพนักงาน
    select w.id, w.scope, 2, w.department, coalesce(w.name,'')
      from public.njhr_approval_workflow_depts d
      join public.njhr_approval_workflows w on w.id = d.workflow_id
     where d.request_type = v_type and d.department = v_dept and w.deleted_at is null
    union all
    -- Priority 3: ทุกแผนก
    select w.id, w.scope, 3, w.department, coalesce(w.name,'')
      from public.njhr_approval_workflow_depts d2
      join public.njhr_approval_workflows w on w.id = d2.workflow_id
     where d2.request_type = v_type and d2.department = '*' and w.deleted_at is null
  )
  select c.wid, c.sc, c.pr, c.ad, c.nm,
         (select count(*)::int from public.njhr_approval_steps s
           where s.workflow_id = c.wid and s.deleted_at is null and s.active)
    from cand c
   order by c.pr
   limit 1;                       -- ห้ามใช้หลาย Workflow พร้อมกัน
end $$;


-- ─── 8) njhr_wf_step_save — ให้หา Workflow แบบ BOTH เจอด้วย ──
--  ของเดิมค้น w.request_type = v_type เท่านั้น ชุด BOTH จึงหาไม่เจอและสร้างชุดใหม่ซ้ำ
--  แก้เฉพาะบรรทัดค้นหา ตรรกะอื่นคงเดิมทั้งหมด
create or replace function public.njhr_wf_step_save(
  p_token text, p_type text, p_dept text, p_step_id uuid default null,
  p_name text default null, p_mode text default null,
  p_cond_type text default null, p_cond_value text default null,
  p_active boolean default null, p_note text default null)
returns table (step_id uuid, step_no int, name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_wf uuid; v_id uuid; v_no int; oldrow jsonb;
        v_type text := upper(btrim(coalesce(p_type,'')));
begin
  select * into c from public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT') then
    raise exception 'ประเภทคำขอไม่ถูกต้อง' using errcode='22023';
  end if;
  if coalesce(btrim(p_dept),'') = '' then
    raise exception 'กรุณาเลือกแผนก' using errcode='22023';
  end if;
  if p_mode is not null and upper(p_mode) not in ('ANY','ALL') then
    raise exception 'รูปแบบการอนุมัติต้องเป็น ANY หรือ ALL' using errcode='22023';
  end if;

  if p_step_id is null then
    select w.id into v_wf from public.njhr_approval_workflows w
     where (w.request_type = v_type or w.request_type = 'BOTH')
       and w.department = btrim(p_dept) and w.deleted_at is null;
    if v_wf is null then
      insert into public.njhr_approval_workflows(request_type, department, created_by, updated_by)
      values (v_type, btrim(p_dept), c.username, c.username)
      returning njhr_approval_workflows.id into v_wf;
    end if;
    if coalesce(btrim(p_name),'') = '' then
      raise exception 'กรุณาระบุชื่อขั้นอนุมัติ' using errcode='22023';
    end if;
    select coalesce(max(s.step_no),0)+1 into v_no from public.njhr_approval_steps s
     where s.workflow_id = v_wf and s.deleted_at is null;
    insert into public.njhr_approval_steps(workflow_id, step_no, name, mode, cond_type, cond_value,
                                           active, note, created_by, updated_by)
    values (v_wf, v_no, btrim(p_name), upper(coalesce(p_mode,'ANY')),
            upper(coalesce(nullif(btrim(coalesce(p_cond_type,'')),''),'ALL')),
            nullif(btrim(coalesce(p_cond_value,'')),''),
            coalesce(p_active,true), nullif(btrim(coalesce(p_note,'')),''), c.username, c.username)
    returning njhr_approval_steps.id into v_id;

    perform public.njhr_audit_write(p_token, 'WF_STEP_ADD', 'approval', 'njhr_approval_steps',
      v_id::text, v_type || ' · ' || btrim(p_dept) || ' · ขั้นที่ ' || v_no || ' ' || btrim(p_name),
      null, (select to_jsonb(x) from public.njhr_approval_steps x where x.id = v_id), null);
  else
    select to_jsonb(s) into oldrow from public.njhr_approval_steps s
     where s.id = p_step_id and s.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002'; end if;
    update public.njhr_approval_steps set
      name       = coalesce(nullif(btrim(coalesce(p_name,'')),''), name),
      mode       = coalesce(upper(nullif(btrim(coalesce(p_mode,'')),'')), mode),
      cond_type  = coalesce(upper(nullif(btrim(coalesce(p_cond_type,'')),'')), cond_type),
      cond_value = case when p_cond_value is null then cond_value
                        else nullif(btrim(p_cond_value),'') end,
      active     = coalesce(p_active, active),
      note       = case when p_note is null then note else nullif(btrim(p_note),'') end,
      updated_at = now(), updated_by = c.username
     where njhr_approval_steps.id = p_step_id;
    v_id := p_step_id;

    perform public.njhr_audit_write(p_token, 'WF_STEP_EDIT', 'approval', 'njhr_approval_steps',
      v_id::text, 'แก้ไขขั้นอนุมัติ', oldrow,
      (select to_jsonb(x) from public.njhr_approval_steps x where x.id = v_id), null);
  end if;

  return query select s.id, s.step_no, s.name from public.njhr_approval_steps s where s.id = v_id;
end $$;


-- ─── 9) GRANT ───────────────────────────────────────────────
grant execute on function public.njhr_wf_save(text,uuid,text,text,text,text[],text[],uuid[]) to anon, authenticated;
grant execute on function public.njhr_wf_list(text,text)                       to anon, authenticated;
grant execute on function public.njhr_wf_emp_pool(text,text,text,uuid,int)      to anon, authenticated;
grant execute on function public.njhr_wf_resolve(text,text,uuid)                to anon, authenticated;
grant execute on function public.njhr_wf_step_save(text,text,text,uuid,text,text,text,text,boolean,text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.9-wf-scope-employee', 'Workflow: ขอบเขต ทุกแผนก/เลือกแผนก/เลือกพนักงาน + Priority resolve')
on conflict (version) do nothing;


-- ─── 10) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'scope_constraint', (select pg_get_constraintdef(con.oid) from pg_constraint con
                        where con.conrelid = 'public.njhr_approval_workflows'::regclass
                          and con.conname = 'njhr_wf_scope_chk'),
  'table_emps', to_regclass('public.njhr_approval_workflow_emps') is not null,
  'workflows', coalesce((select jsonb_agg(jsonb_build_object(
                  'name', coalesce(nullif(w.name,''), w.department), 'type', w.request_type,
                  'scope', w.scope,
                  'depts', (select count(distinct d.department) from public.njhr_approval_workflow_depts d
                             where d.workflow_id = w.id and d.department <> '*'),
                  'emps',  (select count(distinct m.employee_id) from public.njhr_approval_workflow_emps m
                             where m.workflow_id = w.id),
                  'steps', (select count(*) from public.njhr_approval_steps s
                             where s.workflow_id = w.id and s.deleted_at is null))
                  order by w.scope, w.department)
                  from public.njhr_approval_workflows w where w.deleted_at is null), '[]'::jsonb),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname in
                   ('njhr_wf_save','njhr_wf_list','njhr_wf_emp_pool','njhr_wf_resolve','njhr_wf_step_save')),
  'depts_rows', (select count(*) from public.njhr_approval_workflow_depts),
  'emps_rows',  (select count(*) from public.njhr_approval_workflow_emps)
)) as install_report;
