-- ============================================================
-- NJ HR V.10 — 86_wf_multi_type.sql
-- Workflow ชุดเดียวใช้ได้ทั้ง "การลางาน" และ "การขอ OT"
--
-- โครงสร้างเดิมที่ยืนยันแล้ว
--   njhr_approval_workflows      : request_type text check in ('LEAVE','OT') · department (anchor)
--                                  scope('ALL'|'SELECTED') · name · active · deleted_at
--                                  unique (request_type, department) where deleted_at is null
--   njhr_approval_workflow_depts : workflow_id · request_type · department
--                                  unique (request_type, department)      ← กันทับซ้อนอยู่แล้ว
--   njhr_approval_steps          : workflow_id · step_no · mode('ANY'|'ALL') · cond_type · cond_value
--   njhr_approval_step_approvers : step_id · employee_id
--
-- แนวทางที่เลือก (แตะน้อยที่สุด ไม่สร้างตารางใหม่)
--   เพิ่มค่า request_type = 'BOTH' บนตารางแม่
--   ส่วนตารางลูก "แตกเป็น 2 แถว" เสมอ (LEAVE + OT) ต่อ 1 แผนก
--   → unique index (request_type, department) เดิมกันทับซ้อนข้ามประเภทให้อัตโนมัติ
--     โดยไม่ต้องเขียนตรรกะกันซ้ำเพิ่มแม้แต่บรรทัดเดียว
--   → RPC ที่ค้นจากตารางลูก (njhr_wf_dept_pool) ทำงานได้เหมือนเดิม ไม่ต้องแก้
--
-- ไม่แตะ: ขั้นอนุมัติ · ผู้อนุมัติ · ตาราง leave_requests / ot_requests · สถานะและประวัติอนุมัติ
-- ต้องรัน 44 · 55 · 66 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_approval_workflows') is null
     or to_regclass('public.njhr_approval_workflow_depts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง Workflow — รัน 44 และ 66 ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_approval_workflows'
                    and column_name='scope') then
    raise exception 'PREFLIGHT: njhr_approval_workflows ยังไม่มีคอลัมน์ scope — รัน 66_approval_scope.sql ก่อน';
  end if;
  raise notice 'ก่อนแก้ · Workflow ทั้งหมด % ชุด (LEAVE % · OT %)',
    (select count(*) from public.njhr_approval_workflows where deleted_at is null),
    (select count(*) from public.njhr_approval_workflows where deleted_at is null and request_type='LEAVE'),
    (select count(*) from public.njhr_approval_workflows where deleted_at is null and request_type='OT');
end $$;


-- ─── 1) เปิดรับค่า BOTH ─────────────────────────────────────
do $$
declare cn text;
begin
  for cn in select con.conname from pg_constraint con
             where con.conrelid = 'public.njhr_approval_workflows'::regclass
               and con.contype = 'c'
               and pg_get_constraintdef(con.oid) ilike '%request_type%'
  loop
    execute format('alter table public.njhr_approval_workflows drop constraint %I', cn);
  end loop;
  alter table public.njhr_approval_workflows
    add constraint njhr_wf_reqtype_chk check (request_type in ('LEAVE','OT','BOTH'));
end $$;


-- ─── 2) Trigger: BOTH แตกเป็น 2 แถวในตารางลูก ───────────────
create or replace function public.njhr_wf_depts_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if TG_OP = 'INSERT' then
    if coalesce(btrim(new.department),'') <> '' then
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
    -- คืนชีพจากการลบ → ใส่แผนกหลักกลับเข้าตารางลูก
    if old.deleted_at is not null and new.deleted_at is null
       and coalesce(btrim(new.department),'') <> '' then
      foreach t in array (case when new.request_type = 'BOTH'
                               then array['LEAVE','OT'] else array[new.request_type] end)
      loop
        insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
        values (new.id, t, btrim(new.department), 'trigger_restore')
        on conflict (request_type, department) do nothing;
      end loop;
    end if;
    -- ถูกลบ → เก็บกวาดขอบเขตออก
    if old.deleted_at is null and new.deleted_at is not null then
      delete from public.njhr_approval_workflow_depts where workflow_id = new.id;
    end if;
    return new;
  end if;

  return coalesce(new, old);
end $$;


-- ─── 3) njhr_wf_save — รับได้หลายประเภทในชุดเดียว ───────────
--  p_types = ARRAY['LEAVE','OT'] (ใหม่) · p_type = ค่าเดี่ยว (ของเดิม ยังใช้ได้)
drop function if exists public.njhr_wf_save(text,uuid,text,text,text,text[]);
create or replace function public.njhr_wf_save(
  p_token text, p_id uuid default null, p_type text default null,
  p_name text default null, p_scope text default null, p_departments text[] default null,
  p_types text[] default null)
returns table (workflow_id uuid, anchor_dept text, dept_count int, request_type text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; v_anchor text; v_clash text; t text;
        v_scope text := upper(btrim(coalesce(p_scope,'SELECTED')));
        v_depts text[]; v_types text[]; v_stored text; oldrow jsonb;
begin
  select * into c from public.njhr_wf_guard(p_token);

  -- รวมประเภทคำขอจากทั้งพารามิเตอร์ใหม่และเดิม
  select array_agg(distinct upper(btrim(x))) into v_types
    from unnest(coalesce(p_types, case when coalesce(btrim(p_type),'') = ''
                                       then '{}'::text[] else array[p_type] end)) x
   where upper(btrim(x)) in ('LEAVE','OT');
  if v_types is null or array_length(v_types,1) is null then
    raise exception 'กรุณาเลือกประเภทคำขออย่างน้อย 1 ประเภท (การลางาน / การขอ OT)' using errcode='22023';
  end if;
  v_stored := case when array_length(v_types,1) = 2 then 'BOTH' else v_types[1] end;

  if v_scope not in ('ALL','SELECTED') then
    raise exception 'ขอบเขตต้องเป็น ALL หรือ SELECTED' using errcode='22023';
  end if;
  if v_scope = 'ALL' then
    v_depts := array['*'];
  else
    select array_agg(distinct btrim(t2.x)) into v_depts
      from unnest(coalesce(p_departments, '{}'::text[])) as t2(x)
     where btrim(t2.x) <> '' and btrim(t2.x) <> '*';
    if v_depts is null or array_length(v_depts,1) is null then
      raise exception 'กรุณาเลือกอย่างน้อย 1 แผนก' using errcode='22023';
    end if;
  end if;
  v_anchor := v_depts[1];

  -- ตรวจทับซ้อน "ทุกประเภทที่เลือก" ก่อนบันทึก แล้วแจ้งชื่อแผนกที่ชนให้ชัด
  select string_agg(distinct
           (case d.request_type when 'LEAVE' then 'การลางาน' else 'การขอ OT' end)
           || ': ' || d.department, ' · ') into v_clash
    from public.njhr_approval_workflow_depts d
    join public.njhr_approval_workflows w on w.id = d.workflow_id
   where d.request_type = any(v_types)
     and d.department = any(v_depts)
     and w.deleted_at is null
     and (p_id is null or d.workflow_id <> p_id);
  if v_clash is not null then
    raise exception 'แผนกนี้ถูกใช้ใน Workflow ชุดอื่นแล้ว — %', v_clash using errcode='23505';
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
    update public.njhr_approval_workflows
       set request_type = v_stored, department = v_anchor, scope = v_scope,
           name = nullif(btrim(coalesce(p_name,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_approval_workflows.id = v_id;
  end if;

  -- เขียนขอบเขต: แตกทุกประเภท × ทุกแผนก
  foreach t in array v_types loop
    insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
    select v_id, t, d, c.username from unnest(v_depts) d
    on conflict (request_type, department) do nothing;
  end loop;

  perform public.njhr_audit_write(p_token,
    case when p_id is null then 'WF_ADD' else 'WF_EDIT' end,
    'approval', 'njhr_approval_workflows', v_id::text,
    array_to_string(v_types, '+') || ' · ' ||
    case when v_scope = 'ALL' then 'ทุกแผนก' else array_to_string(v_depts, ', ') end,
    oldrow, (select to_jsonb(w) from public.njhr_approval_workflows w where w.id = v_id), null);

  return query
  select v_id, v_anchor,
         (select count(distinct d2.department)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = v_id and d2.department <> '*'),
         v_stored;
end $$;


-- ─── 4) njhr_wf_list — ชุดที่ครอบคลุมประเภทที่เลือก ─────────
drop function if exists public.njhr_wf_list(text,text);
create or replace function public.njhr_wf_list(p_token text, p_type text default 'LEAVE')
returns table (workflow_id uuid, request_type text, request_types jsonb, wf_name text, scope text,
               anchor_dept text, departments jsonb, dept_count int,
               step_count int, approver_count int, active boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE')));
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT','ALL') then v_type := 'LEAVE'; end if;
  return query
  select w.id, w.request_type,
         case w.request_type
           when 'BOTH' then '["LEAVE","OT"]'::jsonb
           else to_jsonb(array[w.request_type]) end,
         coalesce(w.name,''), w.scope, w.department,
         coalesce((select jsonb_agg(distinct d.department)
                     from public.njhr_approval_workflow_depts d
                    where d.workflow_id = w.id and d.department <> '*'), '[]'::jsonb),
         (select count(distinct d2.department)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = w.id and d2.department <> '*'),
         (select count(*)::int from public.njhr_approval_steps s
           where s.workflow_id = w.id and s.deleted_at is null),
         (select count(*)::int from public.njhr_approval_step_approvers a
            join public.njhr_approval_steps s2 on s2.id = a.step_id
           where s2.workflow_id = w.id and s2.deleted_at is null),
         w.active, w.updated_at
    from public.njhr_approval_workflows w
   where w.deleted_at is null
     and (v_type = 'ALL' or w.request_type = v_type or w.request_type = 'BOTH')
   order by (w.scope = 'ALL') desc, coalesce(w.name,''), w.department;
end $$;


-- ─── 5) njhr_wf_steps / njhr_wf_validate — รับ BOTH ด้วย ────
--  ⚠ คอลัมน์ผลลัพธ์ต้องตรงกับของเดิมทุกตัว (มี workflow_id เป็นคอลัมน์ที่ 2)
--    ถ้าเปลี่ยนโครงผลลัพธ์ Postgres จะฟ้อง 42P13 และหน้าเว็บที่ใช้ workflow_id จะพัง
drop function if exists public.njhr_wf_steps(text,text,text);
create or replace function public.njhr_wf_steps(p_token text, p_type text, p_dept text)
returns table (step_id uuid, workflow_id uuid, step_no int, name text, mode text,
               cond_type text, cond_value text, active boolean, note text,
               approvers jsonb, approver_count int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_wf_guard(p_token);
  return query
  select s.id, s.workflow_id, s.step_no, s.name, s.mode, s.cond_type, s.cond_value, s.active, s.note,
         coalesce((select jsonb_agg(jsonb_build_object(
                     'employee_id', e.id, 'emp_code', e.emp_code,
                     'name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                     'position', coalesce(e.position_name,''), 'department', coalesce(e.department_name,''),
                     'status', e.status::text, 'active', a.active)
                   order by e.emp_code)
                    from public.njhr_approval_step_approvers a
                    join public.employees e on e.id = a.employee_id
                   where a.step_id = s.id), '[]'::jsonb),
         (select count(*)::int from public.njhr_approval_step_approvers a2 where a2.step_id = s.id)
    from public.njhr_approval_steps s
    join public.njhr_approval_workflows w on w.id = s.workflow_id
   where s.deleted_at is null and w.deleted_at is null
     and (w.request_type = upper(p_type) or w.request_type = 'BOTH')
     and w.department = p_dept
   order by s.step_no;
end $$;

create or replace function public.njhr_wf_validate(p_token text, p_type text, p_dept text)
returns table (step_no int, name text, problem text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_wf_guard(p_token);
  return query
  select s.step_no, s.name, 'ขั้นนี้เปิดใช้งานแต่ยังไม่มีผู้อนุมัติ'::text
    from public.njhr_approval_steps s
    join public.njhr_approval_workflows w on w.id = s.workflow_id
   where (w.request_type = upper(p_type) or w.request_type = 'BOTH')
     and w.department = p_dept
     and s.deleted_at is null and w.deleted_at is null and s.active
     and not exists (select 1 from public.njhr_approval_step_approvers a
                      where a.step_id = s.id and a.active)
   order by s.step_no;
end $$;


-- ─── 6) njhr_wf_overview — นับจากตารางลูก (รองรับ BOTH เอง) ──
create or replace function public.njhr_wf_overview(p_token text)
returns table (department text, leave_steps int, ot_steps int, employees int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_wf_guard(p_token);
  return query
  with deps as (
    select distinct e.department_name as dname from public.employees e
     where coalesce(e.department_name,'') <> '' and e.status::text = 'ACTIVE')
  select d.dname,
         coalesce((select count(*)::int from public.njhr_approval_steps s
                     join public.njhr_approval_workflow_depts wd on wd.workflow_id = s.workflow_id
                     join public.njhr_approval_workflows w on w.id = s.workflow_id
                    where wd.request_type = 'LEAVE'
                      and wd.department in (d.dname, '*')
                      and s.deleted_at is null and w.deleted_at is null and s.active), 0),
         coalesce((select count(*)::int from public.njhr_approval_steps s
                     join public.njhr_approval_workflow_depts wd on wd.workflow_id = s.workflow_id
                     join public.njhr_approval_workflows w on w.id = s.workflow_id
                    where wd.request_type = 'OT'
                      and wd.department in (d.dname, '*')
                      and s.deleted_at is null and w.deleted_at is null and s.active), 0),
         (select count(*)::int from public.employees e2
           where e2.department_name = d.dname and e2.status::text = 'ACTIVE')
    from deps d
   order by d.dname;
end $$;


-- ─── 7) GRANT ───────────────────────────────────────────────
grant execute on function public.njhr_wf_save(text,uuid,text,text,text,text[],text[]) to anon, authenticated;
grant execute on function public.njhr_wf_list(text,text)          to anon, authenticated;
grant execute on function public.njhr_wf_steps(text,text,text)    to anon, authenticated;
grant execute on function public.njhr_wf_validate(text,text,text) to anon, authenticated;
grant execute on function public.njhr_wf_overview(text)           to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.7-wf-multi-type', 'Workflow ชุดเดียวใช้ได้ทั้งการลางานและการขอ OT (request_type = BOTH)')
on conflict (version) do nothing;


-- ─── 8) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'constraint', (select pg_get_constraintdef(con.oid) from pg_constraint con
                  where con.conrelid = 'public.njhr_approval_workflows'::regclass
                    and con.conname = 'njhr_wf_reqtype_chk'),
  'workflows', coalesce((select jsonb_agg(jsonb_build_object(
                  'name', coalesce(w.name, w.department), 'type', w.request_type,
                  'scope', w.scope,
                  'depts', (select count(distinct d.department) from public.njhr_approval_workflow_depts d
                             where d.workflow_id = w.id and d.department <> '*'),
                  'steps', (select count(*) from public.njhr_approval_steps s
                             where s.workflow_id = w.id and s.deleted_at is null))
                  order by w.request_type, w.department)
                  from public.njhr_approval_workflows w where w.deleted_at is null), '[]'::jsonb),
  'dept_rows_by_type', coalesce((select jsonb_object_agg(t, n) from
                  (select request_type t, count(*) n from public.njhr_approval_workflow_depts
                    group by request_type) x), '{}'::jsonb),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname in
                   ('njhr_wf_save','njhr_wf_list','njhr_wf_steps','njhr_wf_validate','njhr_wf_overview'))
)) as install_report;
