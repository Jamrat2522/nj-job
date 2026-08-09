-- ============================================================
-- NJ HR V.10 — 66_approval_scope.sql
-- ตั้งค่าการอนุมัติ (Approval Workflow) — ขอบเขตแบบ "ทุกแผนก / เลือกหลายแผนก"
--
-- ทำอะไร
--   1) เพิ่มคอลัมน์ njhr_approval_workflows.scope ('ALL' | 'SELECTED') และ .name
--   2) เพิ่มตารางลูก njhr_approval_workflow_depts = รายชื่อแผนกที่ Workflow ชุดนี้ครอบคลุม
--   3) ย้ายข้อมูลเดิมเข้าตารางลูกอัตโนมัติ (1 workflow เดิม = 1 แผนก) — ไม่มีข้อมูลสูญหาย
--   4) Trigger ให้ตารางลูกตามทันเสมอเมื่อเปลี่ยนชื่อแผนก / ลบแผนก / ลบ Workflow
--   5) RPC ใหม่: njhr_wf_list · njhr_wf_save · njhr_wf_delete · njhr_wf_dept_pool
--   6) แทนที่ njhr_wf_overview ให้รู้จัก scope + fallback "ทุกแผนก"
--
-- ไม่ทำอะไร (สำคัญ)
--   · ไม่แตะ check constraint request_type — ยังเป็น ('LEAVE','OT') ตามเดิม
--   · ไม่แตะเอนจินอนุมัติจริง: leave_approvers / njhr_leave_approvers /
--     njhr_leave_submit / njhr_leave_decide / njhr_leave_queue ไม่ถูกแก้แม้แต่บรรทัดเดียว
--   · ไม่แตะ njhr_wf_steps / _step_save / _step_move / _step_toggle / _step_delete /
--     _approver_add / _approver_remove / _candidates / _validate  (ยังใช้ "แผนกหลัก" เชื่อมเหมือนเดิม)
--   · ไม่แตะ 55_departments.sql — RPC แผนกเดิมยังทำงานได้ครบผ่าน Trigger ที่เพิ่มให้
--
-- รันได้ซ้ำ (idempotent) · ปลอดภัยกับข้อมูลเดิม
-- ============================================================


-- ─── 0) PREFLIGHT ────────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_approval_workflows') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_approval_workflows — ต้องรัน 44_approval_workflow.sql ก่อน';
  end if;
  if to_regclass('public.njhr_approval_steps') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_approval_steps';
  end if;
  if to_regclass('public.departments') is null then
    raise warning 'PREFLIGHT: ไม่พบตาราง departments — Trigger ซิงก์ชื่อแผนกจะถูกข้าม';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) คอลัมน์ใหม่บน Workflow ───────────────────────────────
-- scope   : ALL = ใช้กับทุกแผนก · SELECTED = ใช้เฉพาะแผนกที่เลือก
-- name    : ชื่อชุด Workflow (ไม่บังคับ) — เดิมไม่มี จึงตั้ง default ว่างไว้
-- department (คอลัมน์เดิม) ยังอยู่ครบ ทำหน้าที่เป็น "แผนกหลัก / anchor"
--   → RPC เดิมทุกตัวที่ค้นด้วย w.department ยังทำงานได้เหมือนเดิม ไม่ต้องแก้
alter table public.njhr_approval_workflows
  add column if not exists scope text not null default 'SELECTED';
alter table public.njhr_approval_workflows
  add column if not exists name text;

do $$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.njhr_approval_workflows'::regclass
                    and conname = 'njhr_wf_scope_chk') then
    alter table public.njhr_approval_workflows
      add constraint njhr_wf_scope_chk check (scope in ('ALL','SELECTED'));
  end if;
end $$;


-- ─── 2) ตารางลูก: แผนกที่ Workflow ครอบคลุม ──────────────────
-- department = '*' หมายถึง "ทุกแผนก" (ใช้คู่กับ scope='ALL')
-- request_type เก็บซ้ำไว้ในตารางนี้เพื่อบังคับ unique ได้ตรง ๆ ว่า
--   "1 แผนก ผูกกับ Workflow ของประเภทคำขอนั้นได้ชุดเดียว"
create table if not exists public.njhr_approval_workflow_depts (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references public.njhr_approval_workflows(id) on delete cascade,
  request_type text not null,
  department   text not null,
  created_at   timestamptz not null default now(),
  created_by   text
);
alter table public.njhr_approval_workflow_depts enable row level security;
create unique index if not exists njhr_wfd_uidx
  on public.njhr_approval_workflow_depts (request_type, department);
create index if not exists njhr_wfd_wf_idx
  on public.njhr_approval_workflow_depts (workflow_id);


-- ─── 3) ย้ายข้อมูลเดิมเข้าตารางลูก (ครั้งเดียว ไม่ทับของใหม่) ──
insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
select w.id, w.request_type, w.department, 'migration_66'
  from public.njhr_approval_workflows w
 where w.deleted_at is null
   and coalesce(btrim(w.department),'') <> ''
   and not exists (select 1 from public.njhr_approval_workflow_depts d
                    where d.workflow_id = w.id)
on conflict (request_type, department) do nothing;

insert into public.njhr_schema_version(version, note)
values ('v10.6-approval-scope', 'ตั้งค่าการอนุมัติ: scope ทุกแผนก/หลายแผนก + ตารางลูก workflow_depts')
on conflict (version) do nothing;


-- ─── 4) Trigger: ให้ตารางลูกตามทัน Workflow เสมอ ─────────────
create or replace function public.njhr_wf_depts_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    -- Workflow ที่ถูกสร้างโดย njhr_wf_step_save (โค้ดเดิม) ก็จะมีแผนกหลักเข้าตารางลูกทันที
    if coalesce(btrim(new.department),'') <> '' then
      insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
      values (new.id, new.request_type, btrim(new.department), coalesce(new.created_by,'trigger'))
      on conflict (request_type, department) do nothing;
    end if;
    return new;
  end if;

  -- ลบ Workflow (soft delete) → ปลดแผนกทั้งหมดออก เพื่อให้แผนกไปผูกชุดใหม่ได้
  if new.deleted_at is not null and old.deleted_at is null then
    delete from public.njhr_approval_workflow_depts where workflow_id = new.id;
    return new;
  end if;

  -- กู้คืน Workflow → คืนแผนกหลักให้ (ถ้าแผนกนั้นยังว่างอยู่)
  if new.deleted_at is null and old.deleted_at is not null then
    if coalesce(btrim(new.department),'') <> '' then
      insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
      values (new.id, new.request_type, btrim(new.department), 'trigger_restore')
      on conflict (request_type, department) do nothing;
    end if;
    return new;
  end if;

  -- เปลี่ยนชื่อแผนกหลัก (njhr_dept_save ของ 55_departments.sql ทำแบบนี้)
  if new.department is distinct from old.department and new.deleted_at is null then
    update public.njhr_approval_workflow_depts d
       set department = btrim(new.department)
     where d.workflow_id = new.id
       and d.department = old.department
       and not exists (select 1 from public.njhr_approval_workflow_depts x
                        where x.request_type = new.request_type
                          and x.department = btrim(new.department));
  end if;
  return new;
end $$;

drop trigger if exists njhr_wf_depts_sync_trg on public.njhr_approval_workflows;
create trigger njhr_wf_depts_sync_trg
  after insert or update on public.njhr_approval_workflows
  for each row execute function public.njhr_wf_depts_sync();


-- Trigger บนตารางแผนก: เปลี่ยนชื่อ/ลบแผนก → ตารางลูกต้องตามทัน
-- (แตะเฉพาะ njhr_approval_workflow_depts เท่านั้น ไม่แก้ข้อมูลแผนก)
do $$
begin
  if to_regclass('public.departments') is null then
    raise notice 'ข้าม Trigger บน departments (ไม่พบตาราง)';
    return;
  end if;

  execute $fn$
    create or replace function public.njhr_wf_depts_follow_dept()
    returns trigger language plpgsql security definer set search_path = public as $body$
    begin
      if TG_OP = 'DELETE' then
        delete from public.njhr_approval_workflow_depts where department = old.name;
        return old;
      end if;
      if new.name is distinct from old.name then
        update public.njhr_approval_workflow_depts d
           set department = new.name
         where d.department = old.name
           and not exists (select 1 from public.njhr_approval_workflow_depts x
                            where x.request_type = d.request_type and x.department = new.name);
      end if;
      return new;
    end $body$;
  $fn$;

  execute 'drop trigger if exists njhr_wf_depts_follow_dept_trg on public.departments';
  execute 'create trigger njhr_wf_depts_follow_dept_trg
             after update or delete on public.departments
             for each row execute function public.njhr_wf_depts_follow_dept()';
end $$;


-- ─── 5) RPC: รายการแผนกจริงสำหรับตัวเลือก ───────────────────
-- ดึงจากทะเบียนแผนกจริง (public.departments) + จำนวนพนักงานที่ยังทำงานอยู่
-- และบอกด้วยว่าแผนกนั้นถูก Workflow ชุดอื่นของประเภทคำขอนี้จองไปแล้วหรือยัง
create or replace function public.njhr_wf_dept_pool(
  p_token text, p_type text default 'LEAVE', p_exclude_workflow uuid default null)
returns table (department text, employees int, taken_by uuid)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE')));
begin
  perform public.njhr_wf_guard(p_token);
  return query
  with names as (
    select d.name as dname from public.departments d
     where coalesce(btrim(d.name),'') <> ''
    union
    select e.department_name from public.employees e
     where coalesce(btrim(e.department_name),'') <> ''
  )
  select n.dname,
         (select count(*)::int from public.employees e2
           where e2.department_name = n.dname and e2.status::text = 'ACTIVE'),
         (select wd.workflow_id from public.njhr_approval_workflow_depts wd
            join public.njhr_approval_workflows w on w.id = wd.workflow_id
           where wd.request_type = v_type and wd.department = n.dname
             and w.deleted_at is null
             and (p_exclude_workflow is null or wd.workflow_id <> p_exclude_workflow)
           limit 1)
    from names n
   order by n.dname;
end $$;


-- ─── 6) RPC: รายการ Workflow ทั้งหมดของประเภทคำขอ ───────────
create or replace function public.njhr_wf_list(p_token text, p_type text default 'LEAVE')
returns table (workflow_id uuid, request_type text, wf_name text, scope text,
               anchor_dept text, departments jsonb, dept_count int,
               step_count int, approver_count int, active boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE')));
begin
  perform public.njhr_wf_guard(p_token);
  return query
  select w.id, w.request_type, coalesce(w.name,''), w.scope, w.department,
         coalesce((select jsonb_agg(d.department order by d.department)
                     from public.njhr_approval_workflow_depts d
                    where d.workflow_id = w.id and d.department <> '*'), '[]'::jsonb),
         (select count(*)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = w.id and d2.department <> '*'),
         (select count(*)::int from public.njhr_approval_steps s
           where s.workflow_id = w.id and s.deleted_at is null),
         (select count(*)::int from public.njhr_approval_step_approvers a
            join public.njhr_approval_steps s2 on s2.id = a.step_id
           where s2.workflow_id = w.id and s2.deleted_at is null),
         w.active, w.updated_at
    from public.njhr_approval_workflows w
   where w.deleted_at is null and w.request_type = v_type
   order by (w.scope = 'ALL') desc, coalesce(w.name,''), w.department;
end $$;


-- ─── 7) RPC: สร้าง/แก้ไข Workflow + ขอบเขตแผนก ───────────────
-- p_scope = 'ALL'      → ใช้กับทุกแผนก (ตารางลูกเก็บ '*' แถวเดียว)
-- p_scope = 'SELECTED' → ใช้เฉพาะแผนกใน p_departments (อย่างน้อย 1 แผนก)
-- แผนกหลัก (anchor) = p_departments[1] เพื่อให้ RPC ขั้นอนุมัติเดิมยังหาชุดนี้เจอ
create or replace function public.njhr_wf_save(
  p_token text, p_id uuid default null, p_type text default null,
  p_name text default null, p_scope text default null, p_departments text[] default null)
returns table (workflow_id uuid, anchor_dept text, dept_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; v_anchor text; v_clash text;
        v_type  text := upper(btrim(coalesce(p_type,'')));
        v_scope text := upper(btrim(coalesce(p_scope,'SELECTED')));
        v_depts text[];
        oldrow jsonb;
begin
  select * into c from public.njhr_wf_guard(p_token);

  if v_type not in ('LEAVE','OT') then
    raise exception 'ประเภทคำขอไม่ถูกต้อง (%)', p_type using errcode='22023';
  end if;
  if v_scope not in ('ALL','SELECTED') then
    raise exception 'ขอบเขตต้องเป็น ALL หรือ SELECTED' using errcode='22023';
  end if;

  if v_scope = 'ALL' then
    v_depts := array['*'];
  else
    select array_agg(distinct btrim(t.x)) into v_depts
      from unnest(coalesce(p_departments, '{}'::text[])) as t(x)
     where btrim(t.x) <> '' and btrim(t.x) <> '*';
    if v_depts is null or array_length(v_depts,1) is null then
      raise exception 'กรุณาเลือกอย่างน้อย 1 แผนก' using errcode='22023';
    end if;
  end if;
  v_anchor := v_depts[1];

  -- แผนกซ้ำกับ Workflow ชุดอื่นของประเภทคำขอเดียวกัน = ไม่อนุญาต (กันคำขอเลือกชุดไม่ได้)
  select string_agg(d.department, ', ' order by d.department) into v_clash
    from public.njhr_approval_workflow_depts d
    join public.njhr_approval_workflows w on w.id = d.workflow_id
   where d.request_type = v_type
     and d.department = any(v_depts)
     and w.deleted_at is null
     and (p_id is null or d.workflow_id <> p_id);
  if v_clash is not null then
    raise exception 'แผนกนี้ถูกใช้ใน Workflow ชุดอื่นแล้ว: %', v_clash using errcode='23505';
  end if;

  if p_id is null then
    insert into public.njhr_approval_workflows
           (request_type, department, scope, name, created_by, updated_by)
    values (v_type, v_anchor, v_scope, nullif(btrim(coalesce(p_name,'')),''), c.username, c.username)
    returning njhr_approval_workflows.id into v_id;
  else
    select to_jsonb(w) into oldrow from public.njhr_approval_workflows w
     where w.id = p_id and w.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบ Workflow ชุดนี้' using errcode='P0002'; end if;
    v_id := p_id;
    -- ล้างขอบเขตเดิมก่อน แล้วค่อยเปลี่ยนแผนกหลัก เพื่อไม่ให้ชนกับ unique index ตอน Trigger ทำงาน
    delete from public.njhr_approval_workflow_depts where workflow_id = v_id;
    update public.njhr_approval_workflows
       set department = v_anchor, scope = v_scope,
           name = nullif(btrim(coalesce(p_name,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_approval_workflows.id = v_id;
  end if;

  -- เขียนขอบเขตแผนกชุดใหม่ (แผนกหลักอาจถูก Trigger ใส่ไว้แล้ว → on conflict do nothing)
  insert into public.njhr_approval_workflow_depts (workflow_id, request_type, department, created_by)
  select v_id, v_type, d, c.username from unnest(v_depts) d
  on conflict (request_type, department) do nothing;

  perform public.njhr_audit_write(p_token,
    case when p_id is null then 'WF_ADD' else 'WF_EDIT' end,
    'approval', 'njhr_approval_workflows', v_id::text,
    v_type || ' · ' || case when v_scope = 'ALL' then 'ทุกแผนก'
                            else array_to_string(v_depts, ', ') end,
    oldrow, (select to_jsonb(w) from public.njhr_approval_workflows w where w.id = v_id), null);

  return query
  select v_id, v_anchor,
         (select count(*)::int from public.njhr_approval_workflow_depts d2
           where d2.workflow_id = v_id and d2.department <> '*');
end $$;


-- ─── 8) RPC: ลบ Workflow ทั้งชุด ─────────────────────────────
-- soft delete เหมือนแนวเดิม (deleted_at) — ขั้นอนุมัติและผู้อนุมัติยังอยู่ในฐานข้อมูล
-- ถ้ามีคำขอค้างอนุมัติของแผนกในขอบเขต จะคืนจำนวนมาให้หน้าจอถามยืนยันก่อน
create or replace function public.njhr_wf_delete(
  p_token text, p_id uuid, p_confirm boolean default false)
returns table (deleted boolean, step_count int, pending_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; w record; n_step int := 0; n_pend int := 0; v_all boolean;
begin
  select * into c from public.njhr_wf_guard(p_token);
  select * into w from public.njhr_approval_workflows where id = p_id and deleted_at is null;
  if not found then raise exception 'ไม่พบ Workflow ชุดนี้' using errcode='P0002'; end if;

  select count(*)::int into n_step from public.njhr_approval_steps s
   where s.workflow_id = w.id and s.deleted_at is null;

  v_all := (w.scope = 'ALL');
  if w.request_type = 'LEAVE' and to_regclass('public.leave_requests') is not null then
    select count(*)::int into n_pend
      from public.leave_requests r
      join public.employees e on e.id = r.employee_id
     where r.status = 'PENDING'
       and (v_all or e.department_name in
            (select d.department from public.njhr_approval_workflow_depts d
              where d.workflow_id = w.id));
  end if;

  if (n_step > 0 or n_pend > 0) and not coalesce(p_confirm,false) then
    return query select false, n_step, n_pend;
    return;
  end if;

  update public.njhr_approval_workflows
     set deleted_at = now(), active = false, updated_at = now(), updated_by = c.username
   where njhr_approval_workflows.id = p_id;   -- Trigger จะปลดแผนกในตารางลูกให้เอง

  perform public.njhr_audit_write(p_token, 'WF_DELETE', 'approval', 'njhr_approval_workflows',
    p_id::text, 'ลบชุดอนุมัติ ' || w.request_type || ' · ' ||
                case when v_all then 'ทุกแผนก' else coalesce(w.name, w.department) end,
    to_jsonb(w), null, null);

  return query select true, n_step, n_pend;
end $$;


-- ─── 9) แทนที่ njhr_wf_overview ให้รู้จัก scope + fallback ───
-- คืนค่าคอลัมน์เดิมทุกตัว (department, leave_steps, ot_steps, employees)
-- ต่างจากเดิมตรงที่: แผนกที่อยู่ในขอบเขตของ Workflow หลายแผนก หรือได้ Workflow
-- "ทุกแผนก" มาใช้ ก็จะนับขั้นอนุมัติให้ถูกต้อง ไม่ขึ้นว่า "ยังไม่ได้ตั้ง"
create or replace function public.njhr_wf_overview(p_token text)
returns table (department text, leave_steps int, ot_steps int, employees int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_wf_guard(p_token);
  return query
  with deps as (
    select distinct e.department_name as dname from public.employees e
     where coalesce(e.department_name,'') <> '' and e.status::text = 'ACTIVE'),
  -- จำนวนขั้นที่เปิดใช้งานของแต่ละ Workflow
  wfsteps as (
    select w.id, w.request_type, w.scope,
           (select count(*)::int from public.njhr_approval_steps s
             where s.workflow_id = w.id and s.deleted_at is null and s.active) n
      from public.njhr_approval_workflows w
     where w.deleted_at is null),
  -- Workflow "ทุกแผนก" ต่อประเภทคำขอ (ใช้เป็น fallback)
  fb as (
    select request_type, max(n) n from wfsteps where scope = 'ALL' group by request_type)
  select d.dname,
         coalesce(
           (select ws.n from public.njhr_approval_workflow_depts wd
              join wfsteps ws on ws.id = wd.workflow_id
             where wd.request_type = 'LEAVE' and wd.department = d.dname limit 1),
           (select n from fb where request_type = 'LEAVE'), 0),
         coalesce(
           (select ws.n from public.njhr_approval_workflow_depts wd
              join wfsteps ws on ws.id = wd.workflow_id
             where wd.request_type = 'OT' and wd.department = d.dname limit 1),
           (select n from fb where request_type = 'OT'), 0),
         (select count(*)::int from public.employees e2
           where e2.department_name = d.dname and e2.status::text='ACTIVE')
    from deps d order by d.dname;
end $$;


-- ─── 10) สิทธิ์เรียกใช้ ──────────────────────────────────────
-- ฟังก์ชัน Trigger ไม่ควรเรียกตรงจากฝั่ง client (ทำงานผ่าน Trigger เท่านั้น)
do $$
begin
  execute 'revoke all on function public.njhr_wf_depts_sync() from public, anon, authenticated';
  if to_regprocedure('public.njhr_wf_depts_follow_dept()') is not null then
    execute 'revoke all on function public.njhr_wf_depts_follow_dept() from public, anon, authenticated';
  end if;
end $$;

grant execute on function public.njhr_wf_dept_pool(text,text,uuid)          to anon, authenticated;
grant execute on function public.njhr_wf_list(text,text)                    to anon, authenticated;
grant execute on function public.njhr_wf_save(text,uuid,text,text,text,text[]) to anon, authenticated;
grant execute on function public.njhr_wf_delete(text,uuid,boolean)          to anon, authenticated;
grant execute on function public.njhr_wf_overview(text)                     to anon, authenticated;


-- ─── 11) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'scope_column',   (select data_type from information_schema.columns
                      where table_schema='public' and table_name='njhr_approval_workflows'
                        and column_name='scope'),
  'child_table',    to_regclass('public.njhr_approval_workflow_depts') is not null,
  'workflows_total',(select count(*) from public.njhr_approval_workflows where deleted_at is null),
  'depts_migrated', (select count(*) from public.njhr_approval_workflow_depts),
  'orphan_check',   (select count(*) from public.njhr_approval_workflows w
                      where w.deleted_at is null
                        and not exists (select 1 from public.njhr_approval_workflow_depts d
                                         where d.workflow_id = w.id)),
  'steps_untouched',    (select count(*) from public.njhr_approval_steps where deleted_at is null),
  'approvers_untouched',(select count(*) from public.njhr_approval_step_approvers),
  'leave_approvers_untouched', (select count(*) from public.leave_approvers),
  'leave_requests_untouched',  (select count(*) from public.leave_requests),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_wf\_%'),
  'triggers', (select jsonb_agg(tgname order by tgname) from pg_trigger
                where not tgisinternal and tgname like 'njhr\_wf\_%')
)) as install_report;
-- คาดหวัง: orphan_check = 0 · depts_migrated = workflows_total (ก่อนเริ่มใช้หลายแผนก)
--          leave_approvers_untouched / leave_requests_untouched เท่าเดิมทุกประการ


-- ─── 12) ROLLBACK (คัดลอกไปรันถ้าต้องย้อนกลับ) ───────────────
-- drop trigger if exists njhr_wf_depts_follow_dept_trg on public.departments;
-- drop function if exists public.njhr_wf_depts_follow_dept();
-- drop trigger if exists njhr_wf_depts_sync_trg on public.njhr_approval_workflows;
-- drop function if exists public.njhr_wf_depts_sync();
-- drop function if exists public.njhr_wf_delete(text,uuid,boolean);
-- drop function if exists public.njhr_wf_save(text,uuid,text,text,text,text[]);
-- drop function if exists public.njhr_wf_list(text,text);
-- drop function if exists public.njhr_wf_dept_pool(text,text,uuid);
-- drop table if exists public.njhr_approval_workflow_depts;
-- alter table public.njhr_approval_workflows drop constraint if exists njhr_wf_scope_chk;
-- alter table public.njhr_approval_workflows drop column if exists scope;
-- alter table public.njhr_approval_workflows drop column if exists name;
-- แล้วรัน 44_approval_workflow.sql ส่วน njhr_wf_overview ใหม่เพื่อคืนเวอร์ชันเดิม
