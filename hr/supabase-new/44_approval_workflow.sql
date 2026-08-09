-- ============================================================
-- NJ HR V.10 — 44_approval_workflow.sql
-- ตั้งค่าการอนุมัติ: Workflow / ขั้นอนุมัติ / ผู้อนุมัติ (แยกตามประเภทคำขอ + แผนก)
--
-- ตารางใหม่ล้วน ขึ้นต้น njhr_ กันชนกับอีก 6 แอปในโปรเจกต์เดียวกัน
-- ⚠️ ไม่แตะตาราง leave_approvers เดิม (ยังใช้แสดงผู้อนุมัติในฟอร์มลาตามเดิม)
-- ⚠️ ไม่แตะ leave_requests / njhr_leave_decide / njhr_leave_queue ในไฟล์นี้
--    (การบังคับใช้ Workflow หลายขั้นเป็นงานรอบถัดไป — ดูหมายเหตุท้ายไฟล์)
--
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name='department_name') then
    raise exception 'PREFLIGHT: ไม่พบ employees.department_name';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ตาราง ────────────────────────────────────────────────
-- Workflow: 1 ชุดต่อ (ประเภทคำขอ + แผนก)
create table if not exists public.njhr_approval_workflows (
  id            uuid primary key default gen_random_uuid(),
  request_type  text not null check (request_type in ('LEAVE','OT')),
  department    text not null,                       -- ตรงกับ employees.department_name
  version       int  not null default 1,
  active        boolean not null default true,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  created_by    text,
  updated_at    timestamptz not null default now(),
  updated_by    text
);
alter table public.njhr_approval_workflows enable row level security;
create unique index if not exists njhr_wf_uidx
  on public.njhr_approval_workflows (request_type, department) where deleted_at is null;

-- ขั้นอนุมัติ
create table if not exists public.njhr_approval_steps (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references public.njhr_approval_workflows(id) on delete cascade,
  step_no      int  not null check (step_no >= 1),
  name         text not null,
  mode         text not null default 'ANY' check (mode in ('ANY','ALL')),
  -- เงื่อนไข: LEAVE = ALL/DAYS_GT/DAYS_GTE/LEAVE_TYPE/SPECIAL/ADJACENT_HOLIDAY/BACKDATED
  --           OT    = ALL/HOURS_GT/JOB_TYPE/JOB_COUNT_GT/HOLIDAY/PUBLIC_HOLIDAY
  cond_type    text not null default 'ALL',
  cond_value   text,
  active       boolean not null default true,
  note         text,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  created_by   text,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
alter table public.njhr_approval_steps enable row level security;
create unique index if not exists njhr_wfstep_uidx
  on public.njhr_approval_steps (workflow_id, step_no) where deleted_at is null;
create index if not exists njhr_wfstep_wf_idx on public.njhr_approval_steps (workflow_id, step_no);

-- ผู้อนุมัติในแต่ละขั้น
create table if not exists public.njhr_approval_step_approvers (
  id           uuid primary key default gen_random_uuid(),
  step_id      uuid not null references public.njhr_approval_steps(id) on delete cascade,
  employee_id  uuid not null references public.employees(id) on delete cascade,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   text
);
alter table public.njhr_approval_step_approvers enable row level security;
create unique index if not exists njhr_wfappr_uidx
  on public.njhr_approval_step_approvers (step_id, employee_id);
create index if not exists njhr_wfappr_step_idx on public.njhr_approval_step_approvers (step_id);
create index if not exists njhr_wfappr_emp_idx  on public.njhr_approval_step_approvers (employee_id);

insert into public.njhr_schema_version(version, note)
values ('v10.4-approval-workflow', 'ตั้งค่าการอนุมัติ: workflow / steps / approvers')
on conflict (version) do nothing;


-- ─── 2) ตัวช่วยสิทธิ์ ────────────────────────────────────────
-- ตั้งค่า Workflow ได้เฉพาะ SUPER_ADMIN / ADMIN (ตรวจฝั่งเซิร์ฟเวอร์ ไม่เชื่อค่าจาก browser)
create or replace function public.njhr_wf_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, emp_name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN') then
    raise exception 'คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าการอนุมัติ' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name;
end $$;


-- ─── 3) อ่าน Workflow ────────────────────────────────────────
-- โฟลว์ของ (ประเภทคำขอ + แผนก) หนึ่งชุด — 1 ขั้น = 1 แถว พร้อมรายชื่อผู้อนุมัติ
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
                     'employee_id', a.employee_id, 'emp_code', e.emp_code,
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
     and w.request_type = upper(p_type) and w.department = p_dept
   order by s.step_no;
end $$;

-- ภาพรวม: แผนกไหนตั้ง Workflow แล้ว / ยังไม่ได้ตั้ง (ใช้แสดงคำเตือน)
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
                     join public.njhr_approval_workflows w on w.id = s.workflow_id
                    where w.request_type='LEAVE' and w.department = d.dname
                      and s.deleted_at is null and w.deleted_at is null and s.active), 0),
         coalesce((select count(*)::int from public.njhr_approval_steps s
                     join public.njhr_approval_workflows w on w.id = s.workflow_id
                    where w.request_type='OT' and w.department = d.dname
                      and s.deleted_at is null and w.deleted_at is null and s.active), 0),
         (select count(*)::int from public.employees e2
           where e2.department_name = d.dname and e2.status::text='ACTIVE')
    from deps d order by d.dname;
end $$;

-- ค้นหาผู้อนุมัติจากพนักงานจริง (รหัส / ชื่อ / นามสกุล / ชื่อเล่น / ตำแหน่ง / แผนก)
create or replace function public.njhr_wf_candidates(p_token text, p_q text default null, p_limit int default 20)
returns table (employee_id uuid, emp_code text, name text, position_name text, department text, status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_wf_guard(p_token);
  return query
  select e.id, e.emp_code,
         (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
         coalesce(e.position_name,''), coalesce(e.department_name,''), e.status::text
    from public.employees e
   where e.status::text = 'ACTIVE'                       -- ไม่ให้เลือกพนักงานที่ลาออก/พ้นสภาพ
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.position_name,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit least(greatest(coalesce(p_limit,20),1),50);
end $$;


-- ─── 4) แก้ไข Workflow ───────────────────────────────────────
-- เพิ่ม/แก้ขั้นอนุมัติ (ไม่มี Workflow ของแผนกนี้จะสร้างให้อัตโนมัติ)
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
    raise exception 'ประเภทคำขอไม่ถูกต้อง (%)', p_type using errcode='22023';
  end if;
  if coalesce(btrim(p_dept),'') = '' then
    raise exception 'กรุณาเลือกแผนก' using errcode='22023';
  end if;
  if p_mode is not null and upper(p_mode) not in ('ANY','ALL') then
    raise exception 'รูปแบบการอนุมัติต้องเป็น ANY หรือ ALL' using errcode='22023';
  end if;

  if p_step_id is null then
    -- สร้าง Workflow ถ้ายังไม่มี
    select w.id into v_wf from public.njhr_approval_workflows w
     where w.request_type = v_type and w.department = btrim(p_dept) and w.deleted_at is null;
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
  else
    select to_jsonb(s) into oldrow from public.njhr_approval_steps s
     where s.id = p_step_id and s.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002'; end if;
    update public.njhr_approval_steps set
      name       = coalesce(nullif(btrim(p_name),''), name),
      mode       = coalesce(upper(p_mode), mode),
      cond_type  = coalesce(upper(nullif(btrim(coalesce(p_cond_type,'')),'')), cond_type),
      cond_value = case when p_cond_value is null then cond_value
                        else nullif(btrim(p_cond_value),'') end,
      active     = coalesce(p_active, active),
      note       = case when p_note is null then note else nullif(btrim(p_note),'') end,
      updated_at = now(), updated_by = c.username
     where njhr_approval_steps.id = p_step_id;
    v_id := p_step_id;
  end if;

  perform public.njhr_audit_write(p_token,
    case when p_step_id is null then 'WF_STEP_ADD' else 'WF_STEP_EDIT' end,
    'approval', 'njhr_approval_steps', v_id::text,
    v_type || ' · ' || btrim(p_dept) || ' · ' || coalesce(btrim(p_name),'(ไม่เปลี่ยนชื่อ)'),
    oldrow, (select to_jsonb(s) from public.njhr_approval_steps s where s.id = v_id), null);

  return query select s.id, s.step_no, s.name from public.njhr_approval_steps s where s.id = v_id;
end $$;

-- เปิด/ปิดขั้น
create or replace function public.njhr_wf_step_toggle(p_token text, p_step_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v boolean;
begin
  select * into c from public.njhr_wf_guard(p_token);
  update public.njhr_approval_steps set active = not active, updated_at = now(), updated_by = c.username
   where njhr_approval_steps.id = p_step_id and deleted_at is null
  returning active into v;
  if v is null then raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002'; end if;
  perform public.njhr_audit_write(p_token, 'WF_STEP_TOGGLE', 'approval', 'njhr_approval_steps',
                                  p_step_id::text, case when v then 'เปิดใช้งานขั้น' else 'ปิดใช้งานขั้น' end, null, null, null);
  return v;
end $$;

-- เลื่อนลำดับขั้น (dir = -1 ขึ้น / 1 ลง)
create or replace function public.njhr_wf_step_move(p_token text, p_step_id uuid, p_dir int)
returns int language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; s record; other record;
begin
  select * into c from public.njhr_wf_guard(p_token);
  select * into s from public.njhr_approval_steps where id = p_step_id and deleted_at is null;
  if not found then raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002'; end if;
  select * into other from public.njhr_approval_steps o
   where o.workflow_id = s.workflow_id and o.deleted_at is null
     and (case when p_dir < 0 then o.step_no < s.step_no else o.step_no > s.step_no end)
   order by case when p_dir < 0 then -o.step_no else o.step_no end
   limit 1;
  if not found then return s.step_no; end if;                 -- อยู่หัว/ท้ายแล้ว
  -- สลับลำดับผ่านค่าชั่วคราว กัน unique index ชน (ต้อง >= 1 ตาม CHECK constraint)
  update public.njhr_approval_steps set step_no = 9000 + s.step_no where id = s.id;
  update public.njhr_approval_steps set step_no = s.step_no, updated_by = c.username where id = other.id;
  update public.njhr_approval_steps set step_no = other.step_no, updated_by = c.username where id = s.id;
  perform public.njhr_audit_write(p_token, 'WF_STEP_MOVE', 'approval', 'njhr_approval_steps',
                                  p_step_id::text, 'ย้ายขั้นจาก ' || s.step_no || ' เป็น ' || other.step_no, null, null, null);
  return other.step_no;
end $$;

-- ลบขั้น (Soft Delete) + แจ้งผลกระทบกับคำขอที่รออนุมัติ
create or replace function public.njhr_wf_step_delete(p_token text, p_step_id uuid, p_confirm boolean default false)
returns table (deleted boolean, pending_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; s record; w record; n int;
begin
  select * into c from public.njhr_wf_guard(p_token);
  select * into s from public.njhr_approval_steps where id = p_step_id and deleted_at is null;
  if not found then raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002'; end if;
  select * into w from public.njhr_approval_workflows where id = s.workflow_id;

  -- คำขอที่ยังรออนุมัติของแผนกนี้ (เฉพาะ LEAVE ที่อยู่บน Supabase แล้ว)
  n := 0;
  if w.request_type = 'LEAVE' then
    select count(*)::int into n from public.leave_requests r
      join public.employees e on e.id = r.employee_id
     where r.status = 'PENDING' and e.department_name = w.department;
  end if;
  if n > 0 and not coalesce(p_confirm,false) then
    return query select false, n;                            -- ให้หน้าจอถามยืนยันพร้อมบอกผลกระทบ
    return;
  end if;

  update public.njhr_approval_steps set deleted_at = now(), active = false,
         updated_at = now(), updated_by = c.username
   where id = p_step_id;
  -- เรียงลำดับที่เหลือใหม่ให้ต่อเนื่อง
  with ord as (
    select id, row_number() over (order by step_no) rn
      from public.njhr_approval_steps
     where workflow_id = s.workflow_id and deleted_at is null)
  update public.njhr_approval_steps t set step_no = ord.rn from ord where t.id = ord.id;

  perform public.njhr_audit_write(p_token, 'WF_STEP_DELETE', 'approval', 'njhr_approval_steps',
                                  p_step_id::text, 'ลบขั้น ' || s.name || ' (' || w.request_type || ' · ' || w.department || ')',
                                  to_jsonb(s), null, null);
  return query select true, n;
end $$;

-- เพิ่มผู้อนุมัติในขั้น
create or replace function public.njhr_wf_approver_add(p_token text, p_step_id uuid, p_employee uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record;
begin
  select * into c from public.njhr_wf_guard(p_token);
  if not exists (select 1 from public.njhr_approval_steps where id = p_step_id and deleted_at is null) then
    raise exception 'ไม่พบขั้นอนุมัตินี้' using errcode='P0002';
  end if;
  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
  if e.status::text <> 'ACTIVE' then
    raise exception 'พนักงาน % ไม่ได้อยู่ในสถานะปฏิบัติงาน จึงกำหนดเป็นผู้อนุมัติไม่ได้', e.emp_code using errcode='22023';
  end if;
  if exists (select 1 from public.njhr_approval_step_approvers
              where step_id = p_step_id and employee_id = p_employee) then
    raise exception 'พนักงานคนนี้อยู่ในขั้นนี้แล้ว' using errcode='23505';
  end if;
  insert into public.njhr_approval_step_approvers(step_id, employee_id, created_by)
  values (p_step_id, p_employee, c.username);
  perform public.njhr_audit_write(p_token, 'WF_APPROVER_ADD', 'approval', 'njhr_approval_step_approvers',
                                  p_step_id::text, 'เพิ่มผู้อนุมัติ ' || e.emp_code, null, null, null);
  return true;
end $$;

create or replace function public.njhr_wf_approver_remove(p_token text, p_step_id uuid, p_employee uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_wf_guard(p_token);
  delete from public.njhr_approval_step_approvers
   where step_id = p_step_id and employee_id = p_employee;
  if not found then raise exception 'ไม่พบผู้อนุมัติรายนี้ในขั้นนี้' using errcode='P0002'; end if;
  perform public.njhr_audit_write(p_token, 'WF_APPROVER_REMOVE', 'approval', 'njhr_approval_step_approvers',
                                  p_step_id::text, 'ลบผู้อนุมัติออกจากขั้น', null, null, null);
  return true;
end $$;

-- ตรวจก่อนบันทึก: ขั้นที่เปิดใช้งานต้องมีผู้อนุมัติอย่างน้อย 1 คน
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
   where w.request_type = upper(p_type) and w.department = p_dept
     and s.deleted_at is null and w.deleted_at is null and s.active
     and not exists (select 1 from public.njhr_approval_step_approvers a
                      where a.step_id = s.id and a.active)
   order by s.step_no;
end $$;


-- ─── 5) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_wf_guard(text) from public, anon, authenticated;

grant execute on function public.njhr_wf_steps(text,text,text)                       to anon, authenticated;
grant execute on function public.njhr_wf_overview(text)                              to anon, authenticated;
grant execute on function public.njhr_wf_candidates(text,text,int)                   to anon, authenticated;
grant execute on function public.njhr_wf_step_save(text,text,text,uuid,text,text,text,text,boolean,text) to anon, authenticated;
grant execute on function public.njhr_wf_step_toggle(text,uuid)                      to anon, authenticated;
grant execute on function public.njhr_wf_step_move(text,uuid,int)                    to anon, authenticated;
grant execute on function public.njhr_wf_step_delete(text,uuid,boolean)              to anon, authenticated;
grant execute on function public.njhr_wf_approver_add(text,uuid,uuid)                to anon, authenticated;
grant execute on function public.njhr_wf_approver_remove(text,uuid,uuid)             to anon, authenticated;
grant execute on function public.njhr_wf_validate(text,text,text)                    to anon, authenticated;


-- ─── 6) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', (select jsonb_agg(table_name order by table_name) from information_schema.tables
              where table_schema='public' and table_name like 'njhr\_approval\_%'),
  'rls', (select jsonb_object_agg(c.relname, c.relrowsecurity) from pg_class c
           join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public' and c.relname like 'njhr\_approval\_%'),
  'unique_indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
                      where schemaname='public' and indexdef like 'CREATE UNIQUE%'
                        and tablename like 'njhr\_approval\_%'),
  'foreign_keys', (select jsonb_agg(r.relname || ': ' || pg_get_constraintdef(con.oid))
                     from pg_constraint con join pg_class r on r.oid=con.conrelid
                    where r.relname like 'njhr\_approval\_%' and con.contype='f'),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_wf\_%'),
  'leave_approvers_untouched', (select count(*) from public.leave_approvers),
  'leave_requests_untouched',  (select count(*) from public.leave_requests)
)) as install_report;


-- ─── 7) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_wf_validate(text,text,text);
-- drop function if exists public.njhr_wf_approver_remove(text,uuid,uuid);
-- drop function if exists public.njhr_wf_approver_add(text,uuid,uuid);
-- drop function if exists public.njhr_wf_step_delete(text,uuid,boolean);
-- drop function if exists public.njhr_wf_step_move(text,uuid,int);
-- drop function if exists public.njhr_wf_step_toggle(text,uuid);
-- drop function if exists public.njhr_wf_step_save(text,text,text,uuid,text,text,text,text,boolean,text);
-- drop function if exists public.njhr_wf_candidates(text,text,int);
-- drop function if exists public.njhr_wf_overview(text);
-- drop function if exists public.njhr_wf_steps(text,text,text);
-- drop function if exists public.njhr_wf_guard(text);
-- drop table if exists public.njhr_approval_step_approvers;
-- drop table if exists public.njhr_approval_steps;
-- drop table if exists public.njhr_approval_workflows;
-- delete from public.njhr_schema_version where version = 'v10.4-approval-workflow';


-- ============================================================
-- หมายเหตุสำคัญ (ยังไม่ทำในไฟล์นี้ — ต้องทำรอบถัดไป)
-- 1) การบังคับใช้ Workflow หลายขั้นตอนกับคำขอลาจริง ต้องแก้ njhr_leave_decide
--    และ njhr_leave_queue ซึ่งปัจจุบันเป็นการอนุมัติชั้นเดียวและใช้งานอยู่จริง
-- 2) คำขอ OT ยังเก็บใน localStorage (db.ots) — ตาราง ot_requests บน Supabase
--    ยังไม่เคยตรวจโครงสร้าง จึงบังคับ Workflow ฝั่งเซิร์ฟเวอร์ไม่ได้
--    → ต้องรัน 42_inspect_remaining.sql แล้วส่งผลกลับก่อน
-- ============================================================
