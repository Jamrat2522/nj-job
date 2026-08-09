-- ============================================================
-- NJ HR V2 — F3_correction_workflow.sql
-- "ลงชื่อย้อนหลัง" ผ่าน Workflow จริง (Multi-step · ANY/ALL · Priority)
--
-- ขอบเขต — แตะเฉพาะสิ่งที่จำเป็นกับ CORRECTION เท่านั้น
--   1) CHECK request_type เพิ่มค่า 'CORRECTION'   (Trigger njhr_wf_depts_sync ไม่ต้องแก้
--      เพราะใช้ else array[new.request_type] อยู่แล้ว)
--   2) njhr_wf_resolve / njhr_wf_route  รับค่า 'CORRECTION' เพิ่ม
--      → ตรรกะ Priority 1→2→3 · การตรวจขั้น/ผู้อนุมัติ คงเดิมทุกบรรทัด
--      → LEAVE / OT ได้ผลลัพธ์เหมือนเดิมทุกประการ
--   3) attendance_corrections เพิ่ม 3 คอลัมน์ (nullable) สำหรับสถานะขั้น
--   4) njhr_att_correction_submit  → บังคับผ่าน njhr_wf_route ก่อนสร้างคำขอ
--   5) njhr_att_correction_approve → อนุมัติทีละขั้นตาม Workflow
--      เขียน attendance เฉพาะเมื่อครบทุกขั้นเท่านั้น
--   6) njhr_att_correction_reject  → ไม่แตะ attendance (เดิมถูกอยู่แล้ว เพิ่มบันทึกขั้น)
--   7) njhr_att_correction_list    → คืนข้อมูลขั้นปัจจุบัน + กรองเฉพาะที่ถึงคิวตน
--
--   ไม่แตะ: njhr_leave_submit · njhr_leave_decide · njhr_leave_queue · njhr_ot_* 
--           njhr_att_punch · njhr_att_report · njhr_shift_at · attendance · Payroll
--           njhr_wf_save · njhr_wf_step_save · njhr_wf_list · njhr_wf_depts_sync
--
-- อ้างอิงผลตรวจจริง F1 + F2 (2026-08-08):
--   attendance_corrections มี 25 คอลัมน์ · status CHECK (DRAFT/PENDING/APPROVED/REJECTED/CANCELLED)
--   njhr_attc_open_uidx UNIQUE(employee_id, work_date) WHERE status IN (DRAFT,PENDING)
--   njhr_attc_need_time_chk CHECK (requested_check_in IS NOT NULL OR requested_check_out IS NOT NULL)
--   request_type CHECK ('LEAVE','OT','BOTH') · ใช้อยู่ LEAVE 2 · OT 1 · BOTH 3
--   njhr_wf_route คืน (ok, reason, data{workflow_id, steps[{step_id,step_no,mode,approvers[]}]})
--   njhr_att_correction_approve เดิมเขียน attendance ด้วย njhr_shift_at + on conflict — คงสูตรเดิมทุกบรรทัด
--
-- รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  foreach n in array array[1] loop end loop;
  if to_regclass('public.attendance_corrections') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง attendance_corrections'; end if;
  if to_regclass('public.njhr_approval_workflows') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_approval_workflows'; end if;
  foreach n in array array[1] loop end loop;

  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_attc_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_attc_guard — รัน 79_att_corrections.sql ก่อน'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_wf_route') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_wf_route — รัน 44/66 ก่อน'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_shift_at') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_shift_at — สูตรสายของระบบ'; end if;

  select count(*) into n from public.attendance_corrections where status = 'PENDING';
  if n > 0 then
    raise notice 'เตือน: มีคำขอ PENDING ค้างอยู่ % รายการ — จะถูกตั้งขั้นปัจจุบันเป็น 1 อัตโนมัติ', n;
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create table if not exists njhr_bk_attc_20260808 as
  select *, now() as backed_up_at from public.attendance_corrections;


-- ─── 1) เปิดรับ request_type = 'CORRECTION' ─────────────────
-- Trigger njhr_wf_depts_sync ใช้ else array[new.request_type] จึงรองรับค่าใหม่เองอยู่แล้ว
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
    add constraint njhr_wf_reqtype_chk
    check (request_type in ('LEAVE','OT','BOTH','CORRECTION'));
end $$;


-- ─── 2) คอลัมน์สถานะขั้นของคำขอ ─────────────────────────────
-- nullable ทั้งหมด → แถวเดิมไม่กระทบ · ไม่มี default → ไม่ rewrite ตาราง
alter table public.attendance_corrections
  add column if not exists workflow_id  uuid,
  add column if not exists current_step int,
  add column if not exists approvals    jsonb;

comment on column public.attendance_corrections.workflow_id is
  'Workflow ที่ njhr_wf_route เลือกให้ตอนยื่นคำขอ (ตรึงไว้ ไม่เปลี่ยนตามการแก้ผังภายหลัง)';
comment on column public.attendance_corrections.current_step is
  'ลำดับขั้นที่รออนุมัติอยู่ · null = จบแล้ว';
comment on column public.attendance_corrections.approvals is
  'ประวัติการอนุมัติรายขั้น รูปแบบเดียวกับ leave_requests.approvals';

-- คำขอ PENDING ที่ค้างจากก่อนมี Workflow → ตั้งขั้นเริ่มต้นเป็น 1 เพื่อไม่ให้ค้างในระบบ
update public.attendance_corrections
   set current_step = 1
 where status = 'PENDING' and current_step is null;

insert into public.njhr_schema_version(version, note)
values ('v12.2-correction-workflow', 'ลงชื่อย้อนหลังผ่าน Workflow จริง (Multi-step)')
on conflict (version) do nothing;


-- ─── 3) njhr_wf_resolve — รับ CORRECTION เพิ่ม ──────────────
-- เปลี่ยนเฉพาะรายการค่าที่อนุญาต · SQL ค้นหา Priority คงเดิมทุกบรรทัด
create or replace function public.njhr_wf_resolve(p_token text, p_type text, p_employee uuid)
returns table (workflow_id uuid, scope text, priority int, anchor_dept text,
               wf_name text, step_count int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,'LEAVE'))); v_dept text;
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT','CORRECTION') then
    raise exception 'ประเภทคำขอต้องเป็น LEAVE, OT หรือ CORRECTION' using errcode='22023';
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


-- ─── 4) njhr_wf_route — รับ CORRECTION เพิ่ม ────────────────
-- เปลี่ยนเฉพาะรายการค่าที่อนุญาต + ข้อความแจ้ง · ตรรกะที่เหลือคงเดิมทุกบรรทัด
create or replace function public.njhr_wf_route(p_token text, p_type text, p_employee uuid)
returns table (ok boolean, reason text, data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_type text := upper(btrim(coalesce(p_type,''))); v_dept text;
        w record; v_steps jsonb; v_bad text;
begin
  perform public.njhr_wf_guard(p_token);
  if v_type not in ('LEAVE','OT','CORRECTION') then
    raise exception 'ประเภทคำขอต้องเป็น LEAVE, OT หรือ CORRECTION' using errcode='22023';
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
       case v_type when 'LEAVE' then 'การลางาน'
                   when 'OT' then 'การขอ OT'
                   else 'การลงชื่อย้อนหลัง' end ||
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


-- ─── 5) ตัวช่วย: ผู้ใช้คนนี้อนุมัติขั้นปัจจุบันของคำขอนี้ได้ไหม ──
-- ตรวจจากผังจริงเท่านั้น ไม่ดู Role — ห้าม Hard-code ADMIN/SUPER_ADMIN
create or replace function public.njhr_attc_can_act(p_corr_id uuid, p_employee uuid)
returns table (allowed boolean, step_no int, step_name text, mode text,
               approver_total int, approved_in_step int, reason text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare r record; s record; n_appr int; n_done int; v_ok boolean;
begin
  select ac.* into r from public.attendance_corrections ac where ac.id = p_corr_id;
  if not found then
    return query select false, null::int, null::text, null::text, 0, 0, 'ไม่พบคำขอนี้'::text; return;
  end if;
  if r.status <> 'PENDING' then
    return query select false, r.current_step, null::text, null::text, 0, 0,
      ('คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ ' || r.status || ')')::text; return;
  end if;
  if r.workflow_id is null or r.current_step is null then
    return query select false, r.current_step, null::text, null::text, 0, 0,
      'คำขอนี้ไม่มีผังการอนุมัติผูกอยู่'::text; return;
  end if;

  select st.id, st.step_no, st.name, st.mode into s
    from public.njhr_approval_steps st
   where st.workflow_id = r.workflow_id and st.step_no = r.current_step
     and st.deleted_at is null and st.active;
  if not found then
    return query select false, r.current_step, null::text, null::text, 0, 0,
      ('ไม่พบขั้นที่ ' || r.current_step || ' ในผังการอนุมัติ')::text; return;
  end if;

  select count(*)::int into n_appr
    from public.njhr_approval_step_approvers a
    join public.employees e on e.id = a.employee_id
   where a.step_id = s.id and a.active and e.status::text in ('ACTIVE','PROBATION');

  -- ผู้อนุมัติคนนี้อยู่ในขั้นปัจจุบันจริงหรือไม่
  select exists (select 1 from public.njhr_approval_step_approvers a
                  where a.step_id = s.id and a.active and a.employee_id = p_employee)
    into v_ok;

  -- โหมด ALL: นับว่าในขั้นนี้มีคนอนุมัติไปแล้วกี่คน
  select count(*)::int into n_done
    from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x
   where (x->>'step_no')::int = r.current_step and x->>'action' = 'APPROVE';

  -- อนุมัติซ้ำในขั้นเดิมไม่ได้
  if v_ok and exists (select 1 from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x
                       where (x->>'step_no')::int = r.current_step
                         and x->>'action' = 'APPROVE'
                         and (x->>'by_employee') = p_employee::text) then
    return query select false, s.step_no, s.name, s.mode, n_appr, n_done,
      'คุณอนุมัติขั้นนี้ไปแล้ว'::text; return;
  end if;

  return query select v_ok, s.step_no, s.name, s.mode, n_appr, n_done,
    case when v_ok then '' else 'คำขอนี้ยังไม่ถึงคิวอนุมัติของคุณ' end::text;
end $$;


-- ─── 6) SUBMIT — บังคับผ่าน Workflow ────────────────────────
create or replace function public.njhr_att_correction_submit(
  p_token text, p_work_date date,
  p_requested_check_in timestamptz default null,
  p_requested_check_out timestamptz default null,
  p_reason text default null, p_employee uuid default null,
  p_attachment jsonb default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; a record; v_id uuid;
        v_emp uuid; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
        rt record;
begin
  select * into c from public.njhr_attc_guard(p_token);

  -- ยื่นแทนคนอื่นได้เฉพาะผู้ดูแล · พนักงานยื่นได้เฉพาะของตนเอง
  v_emp := coalesce(p_employee, c.employee_id);
  if v_emp is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน จึงยื่นคำขอไม่ได้' using errcode='42501';
  end if;
  if v_emp <> coalesce(c.employee_id, '00000000-0000-0000-0000-000000000000'::uuid)
     and not c.is_manager then
    raise exception 'คุณยื่นคำขอได้เฉพาะของตนเองเท่านั้น' using errcode='42501';
  end if;

  select emp.* into e from public.employees emp where emp.id = v_emp;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  if p_work_date is null then raise exception 'กรุณาระบุวันที่ต้องการแก้ไข' using errcode='22023'; end if;
  if p_work_date > (now() at time zone 'Asia/Bangkok')::date then
    raise exception 'ยื่นคำขอลงชื่อย้อนหลังของวันในอนาคตไม่ได้' using errcode='22023';
  end if;
  if v_reason is null then raise exception 'กรุณาระบุเหตุผล' using errcode='22023'; end if;
  if p_requested_check_in is null and p_requested_check_out is null then
    raise exception 'กรุณาระบุเวลาเข้าหรือเวลาออกอย่างน้อย 1 ค่า' using errcode='22023';
  end if;
  if p_requested_check_in is not null and p_requested_check_out is not null
     and p_requested_check_out <= p_requested_check_in then
    raise exception 'เวลาออกต้องหลังเวลาเข้า' using errcode='22023';
  end if;
  if exists (select 1 from public.attendance_corrections r
              where r.employee_id = v_emp and r.work_date = p_work_date
                and r.status in ('DRAFT','PENDING')) then
    raise exception 'มีคำขอลงชื่อย้อนหลังของวันที่ % ที่ยังไม่ถูกพิจารณาอยู่แล้ว',
      to_char(p_work_date,'DD/MM/YYYY') using errcode='23505';
  end if;

  /* ── บังคับผ่าน Workflow (ขั้นตอนที่ 8 ของสเปก) ──
     ไม่มีผัง / ไม่มีขั้น / ขั้นไม่มีผู้อนุมัติ = ส่งคำขอไม่ได้
     ห้าม Auto Approve และห้ามส่งให้ ADMIN แบบ Hard-code */
  select * into rt from public.njhr_wf_route(p_token, 'CORRECTION', v_emp);
  if not rt.ok then
    raise exception '%', coalesce(nullif(rt.reason,''),
      'ยังไม่ได้ตั้งค่าผู้อนุมัติสำหรับการลงชื่อย้อนหลัง กรุณาติดต่อผู้ดูแลระบบ')
      using errcode='22023';
  end if;

  select att.* into a from public.attendance att
   where att.employee_id = v_emp and att.work_date = p_work_date;

  insert into public.attendance_corrections(
    employee_id, attendance_id, work_date, original_check_in, original_check_out,
    requested_check_in, requested_check_out, reason,
    attachment_name, attachment_path, attachment_mime, attachment_size,
    status, submitted_at, created_by, updated_by,
    workflow_id, current_step, approvals)
  values (v_emp, case when a is null then null else a.id end, p_work_date,
          case when a is null then null else a.check_in end,
          case when a is null then null else a.check_out end,
          p_requested_check_in, p_requested_check_out, v_reason,
          nullif(p_attachment->>'name',''), nullif(p_attachment->>'path',''),
          nullif(p_attachment->>'mime',''), nullif(p_attachment->>'size','')::bigint,
          'PENDING', now(), c.username, c.username,
          (rt.data->>'workflow_id')::uuid,
          ((rt.data->'steps'->0->>'step_no'))::int,
          jsonb_build_array(jsonb_build_object(
            'seq', 1, 'step_no', 0,
            'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
            'by', c.app_user_id, 'by_employee', v_emp, 'by_name', coalesce(e.first_name, c.username),
            'action', 'SUBMIT', 'note', '',
            'meta', jsonb_build_object('workflow_id', rt.data->>'workflow_id',
                                       'workflow_name', rt.data->>'workflow_name',
                                       'priority', rt.data->>'priority',
                                       'step_count', rt.data->>'step_count'))))
  returning attendance_corrections.id into v_id;

  perform public.njhr_audit_write(p_token, 'ATTC_SUBMIT', 'attendance', 'attendance_corrections',
    v_id::text, e.emp_code || ' ขอลงชื่อย้อนหลัง ' || to_char(p_work_date,'DD/MM/YYYY') ||
    ' · ผัง ' || coalesce(rt.data->>'workflow_name','-') ||
    ' (' || coalesce(rt.data->>'step_count','0') || ' ขั้น)',
    null, (select to_jsonb(x) from public.attendance_corrections x where x.id = v_id), null);

  /* แจ้งเตือนเฉพาะผู้อนุมัติของขั้นแรกตามผังจริง — ไม่ยิงหาทุก ADMIN */
  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอลงชื่อย้อนหลังใหม่',
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'') ||
         ' ขอลงชื่อย้อนหลังวันที่ ' || to_char(p_work_date,'DD/MM/YYYY'), 'clock'
    from jsonb_array_elements(rt.data->'steps'->0->'approvers') ap
    join public.app_users u
      on u.app_code = 'salary' and coalesce(u.is_active,true)
     and u.employee_id = (ap->>'employee_id')::uuid;

  return query select r.id, r.status from public.attendance_corrections r where r.id = v_id;
end $$;


-- ─── 7) APPROVE — ทีละขั้นตาม Workflow ──────────────────────
-- เขียน attendance เฉพาะเมื่อผ่านครบทุกขั้นเท่านั้น
create or replace function public.njhr_att_correction_approve(
  p_token text, p_id uuid, p_note text default null)
returns table (id uuid, status text, attendance_updated boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; e record; a record; sh record; act record;
        v_in timestamptz; v_out timestamptz; v_st text; v_late int := 0; v_hours numeric;
        v_seq int; v_next int; v_done boolean := false; v_applied boolean := false;
begin
  select * into c from public.njhr_attc_guard(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน จึงอนุมัติไม่ได้' using errcode='42501';
  end if;

  -- ล็อกแถวกันอนุมัติซ้ำจากสองหน้าจอพร้อมกัน
  select * into r from public.attendance_corrections
   where attendance_corrections.id = p_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ %)', r.status using errcode='22023';
  end if;
  if r.employee_id = c.employee_id then
    raise exception 'อนุมัติคำขอของตนเองไม่ได้' using errcode='42501';
  end if;

  /* ── ตรวจจากผังจริงเท่านั้น ไม่ดู Role ── */
  select * into act from public.njhr_attc_can_act(p_id, c.employee_id);
  if not act.allowed then
    raise exception '%', coalesce(nullif(act.reason,''), 'คุณไม่มีสิทธิ์อนุมัติขั้นนี้')
      using errcode='42501';
  end if;

  select coalesce(max((x->>'seq')::int),0)+1 into v_seq
    from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x;

  -- บันทึกการอนุมัติของขั้นนี้ก่อนเสมอ
  update public.attendance_corrections
     set approvals = coalesce(approvals,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
           'seq', v_seq, 'step_no', act.step_no, 'step_name', act.step_name,
           'mode', act.mode,
           'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
           'by', c.app_user_id, 'by_employee', c.employee_id, 'by_name', c.username,
           'action', 'APPROVE', 'note', coalesce(btrim(p_note),''))),
         updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  /* โหมด ALL ต้องครบทุกคนในขั้นนี้ก่อนจึงข้ามขั้น · โหมด ANY คนเดียวพอ */
  if act.mode = 'ALL' and (act.approved_in_step + 1) < act.approver_total then
    return query select p_id, 'PENDING'::text, false;   -- ยังอยู่ขั้นเดิม รอคนที่เหลือ
    return;
  end if;

  -- หาขั้นถัดไปที่เปิดใช้งาน
  select min(s.step_no) into v_next from public.njhr_approval_steps s
   where s.workflow_id = r.workflow_id and s.deleted_at is null and s.active
     and s.step_no > act.step_no;

  if v_next is not null then
    -- ยังไม่ครบทุกขั้น — ห้ามแตะ attendance
    update public.attendance_corrections
       set current_step = v_next, updated_by = c.username, updated_at = now()
     where attendance_corrections.id = p_id;

    insert into public.notifications(user_id, title, body, icon)
    select u.id, 'คำขอลงชื่อย้อนหลังรออนุมัติ',
           'มีคำขอรอการอนุมัติในขั้นของคุณ', 'clock'
      from public.njhr_approval_step_approvers ap
      join public.njhr_approval_steps s2 on s2.id = ap.step_id
      join public.app_users u on u.app_code='salary' and coalesce(u.is_active,true)
       and u.employee_id = ap.employee_id
     where s2.workflow_id = r.workflow_id and s2.step_no = v_next and ap.active;

    perform public.njhr_audit_write(p_token, 'ATTC_STEP_APPROVE', 'attendance',
      'attendance_corrections', p_id::text,
      'อนุมัติขั้นที่ ' || act.step_no || ' (' || coalesce(act.step_name,'') || ') → ส่งต่อขั้นที่ ' || v_next,
      null, null, null);

    return query select p_id, 'PENDING'::text, false;
    return;
  end if;

  /* ── ครบทุกขั้นแล้ว จึงเขียน attendance จริง ──
     สูตรด้านล่างคัดลอกจากของเดิมทุกบรรทัด ไม่แก้แม้แต่ตัวอักษรเดียว */
  v_done := true;
  select emp.* into e from public.employees emp where emp.id = r.employee_id;
  select att.* into a from public.attendance att
   where att.employee_id = r.employee_id and att.work_date = r.work_date;

  -- ค่าที่จะเขียนจริง: ใช้ค่าที่ขอ ถ้าไม่ได้ขอให้คงค่าเดิม
  v_in  := coalesce(r.requested_check_in,  case when a is null then null else a.check_in  end);
  v_out := coalesce(r.requested_check_out, case when a is null then null else a.check_out end);

  -- คำนวณสถานะสาย/ชั่วโมงงานจากกะจริงของวันนั้น (ตรรกะเดียวกับ 64_attendance.sql)
  select * into sh from public.njhr_shift_at(r.employee_id, r.work_date);
  if v_in is not null and sh.start_time is not null then
    v_late := greatest(0, (extract(epoch from (
                (v_in at time zone 'Asia/Bangkok')::time - sh.start_time)) / 60)::int
              - coalesce(sh.late_allow_minutes,0));
  end if;
  v_st := case when v_in is null then 'ABSENT'
               when v_late > 0 then 'LATE' else 'NORMAL' end;
  v_hours := case when v_in is not null and v_out is not null
                  then round(greatest(0, extract(epoch from (v_out - v_in))/3600
                       - coalesce(sh.break_minutes,0)/60.0)::numeric, 2) end;

  insert into public.attendance (employee_id, work_date, check_in, check_out, status, work_hours)
  values (r.employee_id, r.work_date, v_in, v_out, v_st::public.attendance_status, v_hours)
  on conflict (employee_id, work_date) do update
    set check_in = excluded.check_in, check_out = excluded.check_out,
        status = excluded.status, work_hours = excluded.work_hours;
  v_applied := true;

  update public.attendance_corrections
     set status = 'APPROVED', approved_at = now(), approved_by = c.username,
         applied_check_in = v_in, applied_check_out = v_out,
         current_step = null, rejection_reason = null,
         updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  perform public.njhr_audit_write(p_token, 'ATTC_APPROVE', 'attendance', 'attendance_corrections',
    p_id::text,
    e.emp_code || ' อนุมัติลงชื่อย้อนหลัง ' || to_char(r.work_date,'DD/MM/YYYY') ||
    ' · เดิม ' || coalesce(r.original_check_in::text,'—') || '/' || coalesce(r.original_check_out::text,'—') ||
    ' → ใหม่ ' || coalesce(v_in::text,'—') || '/' || coalesce(v_out::text,'—') ||
    coalesce(' · ' || nullif(btrim(coalesce(p_note,'')),''), ''),
    to_jsonb(r), (select to_jsonb(x) from public.attendance_corrections x where x.id = p_id), null);

  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอลงชื่อย้อนหลังได้รับอนุมัติ',
         'วันที่ ' || to_char(r.work_date,'DD/MM/YYYY') || ' ถูกแก้ไขเรียบร้อยแล้ว', 'check'
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = r.employee_id and coalesce(u.is_active,true);

  return query select x.id, x.status, v_applied from public.attendance_corrections x where x.id = p_id;
end $$;


-- ─── 8) REJECT — ไม่แตะ attendance เด็ดขาด ──────────────────
create or replace function public.njhr_att_correction_reject(
  p_token text, p_id uuid, p_reason text)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; act record; v_seq int;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_attc_guard(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน จึงพิจารณาไม่ได้' using errcode='42501';
  end if;
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' using errcode='22023';
  end if;

  select * into r from public.attendance_corrections
   where attendance_corrections.id = p_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ %)', r.status using errcode='22023';
  end if;

  -- ต้องเป็นผู้อนุมัติของขั้นปัจจุบันจริง
  select * into act from public.njhr_attc_can_act(p_id, c.employee_id);
  if not act.allowed then
    raise exception '%', coalesce(nullif(act.reason,''), 'คุณไม่มีสิทธิ์พิจารณาขั้นนี้')
      using errcode='42501';
  end if;

  select coalesce(max((x->>'seq')::int),0)+1 into v_seq
    from jsonb_array_elements(coalesce(r.approvals,'[]'::jsonb)) x;

  -- ไม่แตะ attendance เด็ดขาดเมื่อไม่อนุมัติ
  update public.attendance_corrections
     set status = 'REJECTED', approved_at = now(), approved_by = c.username,
         rejection_reason = v_reason, current_step = null,
         approvals = coalesce(approvals,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
           'seq', v_seq, 'step_no', act.step_no, 'step_name', act.step_name,
           'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
           'by', c.app_user_id, 'by_employee', c.employee_id, 'by_name', c.username,
           'action', 'REJECT', 'note', v_reason)),
         updated_by = c.username, updated_at = now()
   where attendance_corrections.id = p_id;

  perform public.njhr_audit_write(p_token, 'ATTC_REJECT', 'attendance', 'attendance_corrections',
    p_id::text, 'ไม่อนุมัติคำขอลงชื่อย้อนหลัง ' || to_char(r.work_date,'DD/MM/YYYY') ||
    ' · ขั้นที่ ' || coalesce(act.step_no::text,'-') || ' · เหตุผล: ' || v_reason,
    to_jsonb(r), (select to_jsonb(x) from public.attendance_corrections x where x.id = p_id), null);

  insert into public.notifications(user_id, title, body, icon)
  select u.id, 'คำขอลงชื่อย้อนหลังไม่ได้รับอนุมัติ',
         'วันที่ ' || to_char(r.work_date,'DD/MM/YYYY') || ' · ' || v_reason, 'ban'
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = r.employee_id and coalesce(u.is_active,true);

  return query select x.id, x.status from public.attendance_corrections x where x.id = p_id;
end $$;


-- ─── 9) LIST — เพิ่มข้อมูลขั้นปัจจุบัน + ตัวกรอง "ถึงคิวฉัน" ──
drop function if exists public.njhr_att_correction_list(text, uuid, text, date, date, int, int);

create or replace function public.njhr_att_correction_list(
  p_token text, p_employee uuid default null, p_status text default null,
  p_from date default null, p_to date default null,
  p_limit int default 200, p_offset int default 0,
  p_mine_queue boolean default false)
returns table (
  id uuid, employee_id uuid, emp_code text, emp_name text, department_name text,
  work_date date, original_check_in timestamptz, original_check_out timestamptz,
  requested_check_in timestamptz, requested_check_out timestamptz,
  reason text, attachment_name text, status text,
  submitted_at timestamptz, approved_at timestamptz, approved_by text,
  rejection_reason text, created_by text, created_at timestamptz,
  workflow_id uuid, workflow_name text, current_step int, step_total int,
  step_name text, step_mode text, can_act boolean, approvals jsonb, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; st text := nullif(upper(btrim(coalesce(p_status,''))),'');
        lim int := least(greatest(coalesce(p_limit,200),1),500);
begin
  select * into c from public.njhr_attc_guard(p_token);
  return query
  select r.id, r.employee_id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.department_name,''),
         r.work_date, r.original_check_in, r.original_check_out,
         r.requested_check_in, r.requested_check_out,
         r.reason, coalesce(r.attachment_name,''), r.status,
         r.submitted_at, r.approved_at, coalesce(r.approved_by,''),
         coalesce(r.rejection_reason,''), coalesce(r.created_by,''), r.created_at,
         r.workflow_id, coalesce(nullif(w.name,''), w.department, ''),
         r.current_step,
         (select count(*)::int from public.njhr_approval_steps s
           where s.workflow_id = r.workflow_id and s.deleted_at is null and s.active),
         coalesce(cs.name,''), coalesce(cs.mode,''),
         coalesce((select allowed from public.njhr_attc_can_act(r.id, c.employee_id)), false),
         coalesce(r.approvals,'[]'::jsonb),
         count(*) over () as total_count
    from public.attendance_corrections r
    join public.employees e on e.id = r.employee_id
    left join public.njhr_approval_workflows w on w.id = r.workflow_id
    left join public.njhr_approval_steps cs
           on cs.workflow_id = r.workflow_id and cs.step_no = r.current_step
          and cs.deleted_at is null and cs.active
   where (c.is_manager or r.employee_id = c.employee_id)     -- พนักงานเห็นเฉพาะของตนเอง
     and (p_employee is null or r.employee_id = p_employee)
     and (st is null or r.status = st)
     and (p_from is null or r.work_date >= p_from)
     and (p_to   is null or r.work_date <= p_to)
     -- "ถึงคิวฉัน": เห็นเฉพาะรายการที่ผังส่งมาถึงตนเองจริง (สเปกข้อ 10)
     and (not coalesce(p_mine_queue,false)
          or coalesce((select allowed from public.njhr_attc_can_act(r.id, c.employee_id)), false))
   order by r.submitted_at desc nulls last, r.created_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;

grant execute on function public.njhr_attc_can_act(uuid, uuid) to anon, authenticated;
grant execute on function public.njhr_att_correction_list(text,uuid,text,date,date,int,int,boolean)
  to anon, authenticated;
grant execute on function public.njhr_att_correction_submit(text,date,timestamptz,timestamptz,text,uuid,jsonb)
  to anon, authenticated;
grant execute on function public.njhr_att_correction_approve(text,uuid,text) to anon, authenticated;
grant execute on function public.njhr_att_correction_reject(text,uuid,text) to anon, authenticated;
grant execute on function public.njhr_wf_route(text,text,uuid) to anon, authenticated;
grant execute on function public.njhr_wf_resolve(text,text,uuid) to anon, authenticated;


-- ─── 10) VERIFICATION — อ่านอย่างเดียว ──────────────────────
select jsonb_pretty(jsonb_build_object(
  'reqtype_check', (select pg_get_constraintdef(con.oid) from pg_constraint con
                     where con.conrelid='public.njhr_approval_workflows'::regclass
                       and con.contype='c' and con.conname='njhr_wf_reqtype_chk'),
  'new_columns', (select coalesce(jsonb_agg(column_name order by column_name), '[]'::jsonb)
                    from information_schema.columns
                   where table_schema='public' and table_name='attendance_corrections'
                     and column_name in ('workflow_id','current_step','approvals')),
  'can_act_installed', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                               where n.nspname='public' and p.proname='njhr_attc_can_act'),
  'route_accepts_correction', (select pg_get_functiondef(p.oid) ilike '%''CORRECTION''%'
                                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                where n.nspname='public' and p.proname='njhr_wf_route' limit 1),
  'submit_uses_route', (select pg_get_functiondef(p.oid) ilike '%njhr_wf_route%'
                          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                         where n.nspname='public' and p.proname='njhr_att_correction_submit' limit 1),
  'approve_uses_can_act', (select pg_get_functiondef(p.oid) ilike '%njhr_attc_can_act%'
                             from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                            where n.nspname='public' and p.proname='njhr_att_correction_approve' limit 1),
  'reject_touches_attendance', (select pg_get_functiondef(p.oid) ~* '(insert into|update)\s+(public\.)?attendance\y'
                                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                 where n.nspname='public' and p.proname='njhr_att_correction_reject' limit 1),
  'workflows_by_type', (select coalesce(jsonb_object_agg(t.rt, t.n), '{}'::jsonb)
                          from (select request_type rt, count(*) n from public.njhr_approval_workflows
                                 where deleted_at is null group by request_type) t),
  'untouched', jsonb_build_object(
     'njhr_leave_submit_unchanged', (select pg_get_functiondef(p.oid) not ilike '%CORRECTION%'
                                       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                      where n.nspname='public' and p.proname='njhr_leave_submit' limit 1),
     'njhr_leave_decide_unchanged', (select pg_get_functiondef(p.oid) not ilike '%CORRECTION%'
                                       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                      where n.nspname='public' and p.proname='njhr_leave_decide' limit 1),
     'njhr_att_punch_exists', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                      where n.nspname='public' and p.proname='njhr_att_punch'))
)) as install_report;


-- ─── 11) ROLLBACK ────────────────────────────────────────────
-- drop function if exists public.njhr_attc_can_act(uuid, uuid);
-- drop function if exists public.njhr_att_correction_list(text,uuid,text,date,date,int,int,boolean);
-- แล้วรัน 79_att_corrections.sql ใหม่เพื่อคืน submit/approve/reject/list รุ่นเดิม
-- และรัน 86_wf_multi_type.sql ใหม่เพื่อคืน CHECK เป็น ('LEAVE','OT','BOTH')
-- alter table public.attendance_corrections
--   drop column if exists workflow_id, drop column if exists current_step,
--   drop column if exists approvals;    -- ปล่อยไว้ได้ ไม่กระทบของเดิม
-- delete from public.njhr_schema_version where version='v12.2-correction-workflow';
