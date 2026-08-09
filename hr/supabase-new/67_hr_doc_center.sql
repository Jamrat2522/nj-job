-- ============================================================
-- NJ HR V.10 — 67_hr_doc_center.sql
-- ศูนย์จัดการเอกสาร HR (HR Document Center)
--
-- ต่อยอดจาก 60_emp_documents.sql ที่ติดตั้งไว้แล้ว (ตาราง + การรับทราบ + เวอร์ชัน)
-- ไม่สร้างระบบซ้ำ · ไม่ย้ายข้อมูล · ไม่ลบเอกสารเดิมแม้แต่ฉบับเดียว
--
-- ทำอะไร
--   1) ขยายประเภทเอกสาร 4 → 7 (เพิ่ม COE · SALARY_CERT · SEPARATION)
--   2) ขยายสถานะให้ครบ Workflow: DRAFT → PENDING_APPROVAL → APPROVED → SENT
--      → VIEWED → ACKNOWLEDGED / REJECTED → ARCHIVED   (ค่าเดิมทุกค่ายังใช้ได้)
--   3) เลขที่เอกสารอัตโนมัติแยกตามประเภท: EMP/WR/SUS/PAS/COE/SAL/SEP-YYYY-000001
--      ⚠ นับเฉพาะเลขรูปแบบใหม่ → เอกสารเดิมรูปแบบ NJ-YYYYMMDD#### ไม่ถูกแตะและไม่ชนกัน
--   4) ตารางประวัติเหตุการณ์ njhr_emp_doc_events (สร้าง/แก้/ส่ง/เปิดอ่าน/รับทราบ/ยกเลิก)
--   5) ข้อมูลบริษัทสำหรับหัวเอกสาร njhr_org_profile (โลโก้ · ที่อยู่ · เบอร์โทร · ผู้ลงนาม)
--   6) RPC ใหม่: save · flow · respond(ยืนยันรหัสผ่าน) · center_list · detail · emp_profile · org
--
-- ไม่แตะ
--   · employee_documents / documents / sa_documents / signatures (ของแอปอื่น)
--   · njhr_doc_issue / njhr_doc_ack / njhr_doc_cancel / njhr_doc_ack_report ของเดิม — คงไว้ทั้งหมด
--   · ระบบลา · OT · เงินเดือน · ตั้งค่าการอนุมัติ · leave_approvers
--
-- ต้องรัน 60_emp_documents.sql มาก่อน · รันซ้ำได้ (idempotent)
-- ============================================================


-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents — ต้องรัน 60_emp_documents.sql ก่อน';
  end if;
  if to_regclass('public.njhr_emp_doc_acks') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_doc_acks';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_guard';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · เอกสารเดิมในระบบ % ฉบับ (จะไม่ถูกแตะ)',
    (select count(*) from public.njhr_emp_documents);
end $$;


-- ─── 1) ขยายประเภทเอกสารเป็น 7 ประเภท ────────────────────────
do $$
declare cn text;
begin
  for cn in select con.conname from pg_constraint con
             join pg_class r on r.oid = con.conrelid
            where r.relname = 'njhr_emp_documents' and con.contype = 'c'
              and pg_get_constraintdef(con.oid) ilike '%doc_type%'
  loop
    execute format('alter table public.njhr_emp_documents drop constraint %I', cn);
  end loop;
  alter table public.njhr_emp_documents
    add constraint njhr_empdoc_type_chk check (doc_type in
      ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','COE','SALARY_CERT','SEPARATION'));
end $$;


-- ─── 2) ขยายสถานะให้ครบ Workflow (ค่าเดิมยังใช้ได้ทั้งหมด) ───
do $$
declare cn text;
begin
  for cn in select con.conname from pg_constraint con
             join pg_class r on r.oid = con.conrelid
            where r.relname = 'njhr_emp_documents' and con.contype = 'c'
              and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.njhr_emp_documents drop constraint %I', cn);
  end loop;
  alter table public.njhr_emp_documents
    add constraint njhr_empdoc_status_chk check (status in
      ('DRAFT','PENDING','PENDING_APPROVAL','APPROVED','SENT','VIEWED',
       'ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED','CANCELLED','SUPERSEDED'));
end $$;


-- ─── 3) คอลัมน์เพิ่มสำหรับ Workflow ──────────────────────────
alter table public.njhr_emp_documents add column if not exists submitted_at   timestamptz;
alter table public.njhr_emp_documents add column if not exists submitted_by   text;
alter table public.njhr_emp_documents add column if not exists approver_id    uuid references public.employees(id) on delete set null;
alter table public.njhr_emp_documents add column if not exists approver_name  text;
alter table public.njhr_emp_documents add column if not exists approved_at    timestamptz;
alter table public.njhr_emp_documents add column if not exists approved_by    text;
alter table public.njhr_emp_documents add column if not exists approval_note  text;
alter table public.njhr_emp_documents add column if not exists sent_at        timestamptz;
alter table public.njhr_emp_documents add column if not exists sent_by        text;
alter table public.njhr_emp_documents add column if not exists viewed_at      timestamptz;
alter table public.njhr_emp_documents add column if not exists responded_at   timestamptz;
alter table public.njhr_emp_documents add column if not exists reject_reason  text;
alter table public.njhr_emp_documents add column if not exists archived_at    timestamptz;
alter table public.njhr_emp_documents add column if not exists archived_by    text;
-- doc_meta = ค่าที่เติมลง Template (snapshot วันออกเอกสาร) เช่น เงินเดือน ผู้บังคับบัญชา ผู้จัดทำ
alter table public.njhr_emp_documents add column if not exists doc_meta       jsonb not null default '{}'::jsonb;

create index if not exists njhr_empdoc_status_idx on public.njhr_emp_documents (status, issued_at desc);


-- ─── 4) ประวัติเหตุการณ์ของเอกสาร ────────────────────────────
create table if not exists public.njhr_emp_doc_events (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.njhr_emp_documents(id) on delete cascade,
  event        text not null,          -- CREATE/EDIT/SUBMIT/APPROVE/REJECT_APPROVAL/SEND/VIEW/ACKNOWLEDGE/REJECT/ARCHIVE/CANCEL
  actor        text,
  actor_role   text,
  detail       text,
  ip_address   text,
  user_agent   text,
  device       text,
  channel      text,
  at           timestamptz not null default now()
);
alter table public.njhr_emp_doc_events enable row level security;
create index if not exists njhr_docev_doc_idx on public.njhr_emp_doc_events (document_id, at desc);

create or replace function public.njhr_doc_event(
  p_doc uuid, p_event text, p_actor text, p_role text,
  p_detail text default null, p_ctx jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.njhr_emp_doc_events
    (document_id, event, actor, actor_role, detail, ip_address, user_agent, device, channel)
  values (p_doc, upper(p_event), p_actor, p_role, p_detail,
          nullif(btrim(coalesce(p_ctx->>'ip','')),''),
          left(nullif(btrim(coalesce(p_ctx->>'user_agent','')),''), 400),
          nullif(btrim(coalesce(p_ctx->>'device','')),''),
          nullif(btrim(coalesce(p_ctx->>'channel','')),''));
end $$;


-- ─── 5) ข้อมูลบริษัทสำหรับหัวเอกสาร (แถวเดียว) ───────────────
create table if not exists public.njhr_org_profile (
  id           int primary key default 1 check (id = 1),
  company_name text,
  address      text,
  phone        text,
  email        text,
  tax_id       text,
  logo_url     text,
  footer_note  text,
  hr_signer    text,     -- ชื่อผู้ลงนามฝ่ายบุคคล
  hr_position  text,
  ceo_signer   text,     -- ผู้อนุมัติ/ผู้บริหาร
  ceo_position text,
  updated_at   timestamptz not null default now(),
  updated_by   text
);
alter table public.njhr_org_profile enable row level security;
insert into public.njhr_org_profile (id, company_name)
values (1, 'N.J. LOGISTICS & FRUITS CO., LTD.')
on conflict (id) do nothing;

create or replace function public.njhr_doc_org(p_token text)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.njhr_ctx(p_token);            -- ผู้ใช้ที่ล็อกอินแล้วอ่านได้ทุกคน (ใช้ทำหัวเอกสาร)
  return query select to_jsonb(o) from public.njhr_org_profile o where o.id = 1;
end $$;

create or replace function public.njhr_doc_org_save(p_token text, p_data jsonb)
returns table (data jsonb)
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.njhr_doc_guard(p_token, true);   -- SUPER_ADMIN/ADMIN/HR เท่านั้น
  update public.njhr_org_profile set
    company_name = coalesce(nullif(btrim(p_data->>'company_name'),''), company_name),
    address      = case when p_data ? 'address'      then nullif(btrim(p_data->>'address'),'')      else address end,
    phone        = case when p_data ? 'phone'        then nullif(btrim(p_data->>'phone'),'')        else phone end,
    email        = case when p_data ? 'email'        then nullif(btrim(p_data->>'email'),'')        else email end,
    tax_id       = case when p_data ? 'tax_id'       then nullif(btrim(p_data->>'tax_id'),'')       else tax_id end,
    logo_url     = case when p_data ? 'logo_url'     then nullif(btrim(p_data->>'logo_url'),'')     else logo_url end,
    footer_note  = case when p_data ? 'footer_note'  then nullif(btrim(p_data->>'footer_note'),'')  else footer_note end,
    hr_signer    = case when p_data ? 'hr_signer'    then nullif(btrim(p_data->>'hr_signer'),'')    else hr_signer end,
    hr_position  = case when p_data ? 'hr_position'  then nullif(btrim(p_data->>'hr_position'),'')  else hr_position end,
    ceo_signer   = case when p_data ? 'ceo_signer'   then nullif(btrim(p_data->>'ceo_signer'),'')   else ceo_signer end,
    ceo_position = case when p_data ? 'ceo_position' then nullif(btrim(p_data->>'ceo_position'),'') else ceo_position end,
    updated_at = now(), updated_by = c.username
   where njhr_org_profile.id = 1;

  perform public.njhr_audit_write(p_token, 'DOC_ORG_SAVE', 'document', 'njhr_org_profile', '1',
                                  'แก้ไขข้อมูลบริษัทบนหัวเอกสาร', null, p_data, null);
  return query select to_jsonb(o) from public.njhr_org_profile o where o.id = 1;
end $$;


-- ─── 6) เลขที่เอกสารอัตโนมัติแยกตามประเภท ────────────────────
-- EMP-2026-000001 / WR- / SUS- / PAS- / COE- / SAL- / SEP-
-- นับเฉพาะเลขรูปแบบใหม่ของ "ประเภทและปีเดียวกัน" เท่านั้น
-- → เอกสารเดิมรูปแบบ NJ-YYYYMMDD#### ไม่ถูกนับ ไม่ถูกแก้ และไม่ทำให้เลขชนกัน
create or replace function public.njhr_doc_prefix(p_type text)
returns text language sql immutable as $$
  select case upper(coalesce(p_type,''))
    when 'CONTRACT'         then 'EMP'
    when 'WARNING'          then 'WR'
    when 'SUSPENSION'       then 'SUS'
    when 'PROBATION_RESULT' then 'PAS'
    when 'COE'              then 'COE'
    when 'SALARY_CERT'      then 'SAL'
    when 'SEPARATION'       then 'SEP'
    else 'DOC' end;
$$;

create or replace function public.njhr_doc_next_no(p_type text)
returns text language plpgsql security definer set search_path = public as $$
declare px text := public.njhr_doc_prefix(p_type);
        yy text := to_char(now() at time zone 'Asia/Bangkok','YYYY');
        n  int;
begin
  select coalesce(max(substring(doc_no from '\d{6}$')::int), 0) + 1 into n
    from public.njhr_emp_documents
   where doc_no ~ ('^' || px || '-' || yy || '-\d{6}$');
  return px || '-' || yy || '-' || lpad(n::text, 6, '0');
end $$;


-- ─── 7) ตัวช่วยสิทธิ์เพิ่มเติม ───────────────────────────────
-- อนุมัติเอกสารได้: SUPER_ADMIN / ADMIN / HR / MANAGER (หัวหน้างาน)
create or replace function public.njhr_doc_can_approve(p_role text)
returns boolean language sql immutable as $$
  select upper(coalesce(p_role,'')) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');
$$;


-- ─── 8) สร้าง / แก้ไขเอกสาร (Draft) ──────────────────────────
create or replace function public.njhr_doc_save(
  p_token text, p_id uuid default null, p_type text default null,
  p_employee uuid default null, p_title text default null, p_body text default null,
  p_effective_date date default null, p_meta jsonb default null,
  p_approver uuid default null)
returns table (id uuid, doc_no text, version int, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; d record; v_id uuid; v_no text; oldrow jsonb;
        v_type text := upper(btrim(coalesce(p_type,'')));
        v_appr text;
begin
  select * into c from public.njhr_doc_guard(p_token, true);

  if p_id is null then
    if v_type not in ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','COE','SALARY_CERT','SEPARATION') then
      raise exception 'ประเภทเอกสารไม่ถูกต้อง (%)', p_type using errcode='22023';
    end if;
    select * into e from public.employees where id = p_employee;
    if not found then raise exception 'ไม่พบพนักงานที่เลือก' using errcode='P0002'; end if;
    if coalesce(btrim(p_title),'') = '' then raise exception 'กรุณาระบุหัวข้อเอกสาร' using errcode='22023'; end if;
    if coalesce(btrim(p_body),'')  = '' then raise exception 'กรุณาระบุเนื้อหาเอกสาร' using errcode='22023'; end if;

    v_no := public.njhr_doc_next_no(v_type);
    select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'') into v_appr
      from public.employees s where s.id = p_approver;

    insert into public.njhr_emp_documents (
      doc_no, version, doc_type, employee_id,
      emp_code_snap, emp_name_snap, dept_snap, position_snap,
      title, body, effective_date, status, requires_signature,
      approver_id, approver_name, doc_meta, issued_by, updated_by)
    values (v_no, 1, v_type, p_employee,
      e.emp_code, coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
      e.department_name, e.position_name,
      btrim(p_title), p_body, p_effective_date, 'DRAFT', (v_type = 'CONTRACT'),
      p_approver, v_appr, coalesce(p_meta,'{}'::jsonb), c.username, c.username)
    returning njhr_emp_documents.id into v_id;

    perform public.njhr_doc_event(v_id, 'CREATE', c.username, c.role, 'สร้างเอกสาร ' || v_no, null);
    perform public.njhr_audit_write(p_token, 'DOC_CREATE', 'document', 'njhr_emp_documents', v_id::text,
      v_type || ' · ' || v_no || ' · ' || e.emp_code, null, null, null);
  else
    select * into d from public.njhr_emp_documents where id = p_id;
    if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
    if d.locked_at is not null then
      raise exception 'เอกสารฉบับนี้ถูกล็อกแล้ว (รับทราบ/ลงนามแล้ว) แก้ไขไม่ได้' using errcode='42501';
    end if;
    if d.status not in ('DRAFT','PENDING','PENDING_APPROVAL','REJECTED') then
      raise exception 'เอกสารสถานะ "%" แก้ไขไม่ได้ — ต้องยกเลิกแล้วออกฉบับใหม่', d.status using errcode='22023';
    end if;
    oldrow := to_jsonb(d);
    select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'') into v_appr
      from public.employees s where s.id = coalesce(p_approver, d.approver_id);

    update public.njhr_emp_documents set
      title          = coalesce(nullif(btrim(p_title),''), title),
      body           = coalesce(nullif(p_body,''), body),
      effective_date = case when p_effective_date is null then effective_date else p_effective_date end,
      approver_id    = coalesce(p_approver, approver_id),
      approver_name  = coalesce(v_appr, approver_name),
      doc_meta       = case when p_meta is null then doc_meta else p_meta end,
      updated_by     = c.username
     where njhr_emp_documents.id = p_id;
    v_id := p_id;

    perform public.njhr_doc_event(v_id, 'EDIT', c.username, c.role, 'แก้ไขเนื้อหาเอกสาร', null);
    perform public.njhr_audit_write(p_token, 'DOC_EDIT', 'document', 'njhr_emp_documents', v_id::text,
      d.doc_no, oldrow, (select to_jsonb(x) from public.njhr_emp_documents x where x.id = v_id), null);
  end if;

  return query select x.id, x.doc_no, x.version, x.status
                 from public.njhr_emp_documents x where x.id = v_id;
end $$;


-- ─── 9) เดิน Workflow (ฝั่งผู้ดูแล/ผู้อนุมัติ) ───────────────
-- SUBMIT · APPROVE · REJECT_APPROVAL · SEND · ARCHIVE · CANCEL
create or replace function public.njhr_doc_flow(
  p_token text, p_id uuid, p_action text,
  p_note text default null, p_ctx jsonb default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; a text := upper(btrim(coalesce(p_action,''))); v_new text;
begin
  select * into c from public.njhr_ctx(p_token);
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status in ('CANCELLED','SUPERSEDED') then
    raise exception 'เอกสารฉบับนี้ถูกยกเลิก/ถูกแทนที่แล้ว' using errcode='22023';
  end if;

  if a = 'SUBMIT' then
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์ส่งเอกสารเข้าอนุมัติ' using errcode='42501'; end if;
    if d.status not in ('DRAFT','REJECTED') then
      raise exception 'ส่งเข้าอนุมัติได้เฉพาะเอกสารสถานะ Draft' using errcode='22023'; end if;
    v_new := 'PENDING_APPROVAL';
    update public.njhr_emp_documents set status = v_new, submitted_at = now(),
           submitted_by = c.username, reject_reason = null, updated_by = c.username
     where njhr_emp_documents.id = p_id;

  elsif a = 'APPROVE' then
    if not public.njhr_doc_can_approve(c.role) then
      raise exception 'คุณไม่มีสิทธิ์อนุมัติเอกสาร' using errcode='42501'; end if;
    if d.status <> 'PENDING_APPROVAL' then
      raise exception 'อนุมัติได้เฉพาะเอกสารที่รออนุมัติ' using errcode='22023'; end if;
    v_new := 'APPROVED';
    update public.njhr_emp_documents set status = v_new, approved_at = now(),
           approved_by = c.username, approval_note = nullif(btrim(p_note),''),
           approver_name = coalesce(approver_name, c.emp_name), updated_by = c.username
     where njhr_emp_documents.id = p_id;

  elsif a = 'REJECT_APPROVAL' then
    if not public.njhr_doc_can_approve(c.role) then
      raise exception 'คุณไม่มีสิทธิ์อนุมัติเอกสาร' using errcode='42501'; end if;
    if d.status <> 'PENDING_APPROVAL' then
      raise exception 'ดำเนินการได้เฉพาะเอกสารที่รออนุมัติ' using errcode='22023'; end if;
    if coalesce(btrim(p_note),'') = '' then
      raise exception 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' using errcode='22023'; end if;
    v_new := 'DRAFT';
    update public.njhr_emp_documents set status = v_new, approval_note = btrim(p_note),
           approved_at = null, approved_by = null, updated_by = c.username
     where njhr_emp_documents.id = p_id;

  elsif a = 'SEND' then
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์ส่งเอกสารให้พนักงาน' using errcode='42501'; end if;
    if d.status not in ('APPROVED','SENT','VIEWED') then
      raise exception 'ส่งได้เฉพาะเอกสารที่อนุมัติแล้ว' using errcode='22023'; end if;
    v_new := 'SENT';
    update public.njhr_emp_documents set status = v_new, sent_at = now(),
           sent_by = c.username, updated_by = c.username
     where njhr_emp_documents.id = p_id;

  elsif a = 'ARCHIVE' then
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์เก็บเอกสารเข้าประวัติ' using errcode='42501'; end if;
    if d.status not in ('ACKNOWLEDGED','SIGNED','REJECTED') then
      raise exception 'เก็บเข้าประวัติได้เมื่อพนักงานตอบรับเอกสารแล้ว' using errcode='22023'; end if;
    v_new := 'ARCHIVED';
    update public.njhr_emp_documents set status = v_new, archived_at = now(),
           archived_by = c.username, updated_by = c.username
     where njhr_emp_documents.id = p_id;

  elsif a = 'CANCEL' then
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์ยกเลิกเอกสาร' using errcode='42501'; end if;
    if coalesce(btrim(p_note),'') = '' then
      raise exception 'กรุณาระบุเหตุผลการยกเลิก' using errcode='22023'; end if;
    if d.locked_at is not null then
      raise exception 'เอกสารที่รับทราบ/ลงนามแล้ว ยกเลิกไม่ได้' using errcode='42501'; end if;
    v_new := 'CANCELLED';
    update public.njhr_emp_documents set status = v_new, cancelled_at = now(),
           cancel_reason = btrim(p_note), updated_by = c.username
     where njhr_emp_documents.id = p_id;

  else
    raise exception 'คำสั่งไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;

  perform public.njhr_doc_event(p_id, a, c.username, c.role, nullif(btrim(p_note),''), p_ctx);
  perform public.njhr_audit_write(p_token, 'DOC_' || a, 'document', 'njhr_emp_documents', p_id::text,
    d.doc_no || ' → ' || v_new, to_jsonb(d),
    (select to_jsonb(x) from public.njhr_emp_documents x where x.id = p_id), null);

  return query select x.id, x.status from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ─── 10) พนักงานเปิดอ่านเอกสาร (SENT → VIEWED) ───────────────
create or replace function public.njhr_doc_view(p_token text, p_id uuid, p_ctx jsonb default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_ctx(p_token);
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  -- นับเป็น "เปิดอ่าน" เฉพาะเจ้าของเอกสารเท่านั้น (ผู้ดูแลเปิดดูไม่นับ)
  if d.employee_id is distinct from c.employee_id then
    return query select d.id, d.status; return;
  end if;
  if d.status = 'SENT' then
    update public.njhr_emp_documents set status = 'VIEWED', viewed_at = now()
     where njhr_emp_documents.id = p_id;
    perform public.njhr_doc_event(p_id, 'VIEW', c.username, c.role, 'พนักงานเปิดอ่านเอกสาร', p_ctx);
  elsif d.viewed_at is null and d.status in ('VIEWED','ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED') then
    update public.njhr_emp_documents set viewed_at = now() where njhr_emp_documents.id = p_id;
  end if;
  return query select x.id, x.status from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ─── 11) พนักงานรับทราบ / ปฏิเสธ (ยืนยันตัวตนด้วยรหัสผ่าน) ───
create or replace function public.njhr_doc_respond(
  p_token text, p_id uuid, p_action text, p_password text,
  p_ctx jsonb default null, p_reason text default null,
  p_signature_path text default null)
returns table (id uuid, status text, responded_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; u record; a text := upper(btrim(coalesce(p_action,'')));
        v_new text; v_ok boolean := false;
begin
  select * into c from public.njhr_ctx(p_token);
  if a not in ('ACKNOWLEDGE','REJECT') then
    raise exception 'การดำเนินการไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;

  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  -- เจ้าของเอกสารเท่านั้น ผู้ดูแลรับทราบแทนไม่ได้
  if d.employee_id is distinct from c.employee_id then
    raise exception 'ดำเนินการได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode='42501';
  end if;
  if d.status not in ('SENT','VIEWED') then
    raise exception 'เอกสารสถานะ "%" ไม่สามารถรับทราบได้', d.status using errcode='22023';
  end if;
  if d.locked_at is not null then
    raise exception 'เอกสารฉบับนี้ดำเนินการไปแล้วเมื่อ %',
      to_char(d.locked_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI') using errcode='22023';
  end if;

  -- ⭐ ยืนยันตัวตน: ตรวจรหัสผ่านของผู้ใช้ที่ล็อกอินอยู่ (bcrypt ชุดเดียวกับหน้า Login)
  select * into u from public.app_users where id = c.app_user_id;
  if not found then raise exception 'ไม่พบบัญชีผู้ใช้' using errcode='P0002'; end if;
  if coalesce(btrim(p_password),'') = '' then
    raise exception 'กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน' using errcode='22023';
  end if;
  if u.password_hash is not null and u.password_hash like '$2%' then
    v_ok := (u.password_hash = extensions.crypt(p_password, u.password_hash));
  end if;
  if not v_ok then
    perform public.njhr_doc_event(p_id, 'VERIFY_FAIL', c.username, c.role, 'ยืนยันตัวตนไม่สำเร็จ', p_ctx);
    raise exception 'รหัสผ่านไม่ถูกต้อง — ยืนยันตัวตนไม่สำเร็จ' using errcode='42501';
  end if;

  if a = 'REJECT' and coalesce(btrim(p_reason),'') = '' then
    raise exception 'กรุณาระบุเหตุผลที่ปฏิเสธการรับทราบ' using errcode='22023';
  end if;

  v_new := case when a = 'ACKNOWLEDGE'
                then (case when d.requires_signature then 'SIGNED' else 'ACKNOWLEDGED' end)
                else 'REJECTED' end;

  update public.njhr_emp_documents set
    status = v_new, responded_at = now(),
    reject_reason = case when a = 'REJECT' then btrim(p_reason) else null end,
    locked_at = case when a = 'ACKNOWLEDGE' then now() else locked_at end
   where njhr_emp_documents.id = p_id;

  if a = 'ACKNOWLEDGE' then
    insert into public.njhr_emp_doc_acks (
      document_id, employee_id, emp_code, emp_name, department, action,
      channel, ip_address, user_agent, device, signature_path, doc_version, acked_by)
    values (p_id, d.employee_id, d.emp_code_snap, d.emp_name_snap, d.dept_snap,
      case when d.requires_signature then 'SIGN' else 'ACKNOWLEDGE' end,
      nullif(btrim(coalesce(p_ctx->>'channel','')),''),
      nullif(btrim(coalesce(p_ctx->>'ip','')),''),
      left(nullif(btrim(coalesce(p_ctx->>'user_agent','')),''), 400),
      nullif(btrim(coalesce(p_ctx->>'device','')),''),
      p_signature_path, d.version, c.username)
    on conflict (document_id, employee_id) do nothing;
  end if;

  perform public.njhr_doc_event(p_id, a, c.username, c.role,
    case when a = 'REJECT' then btrim(p_reason) else 'ยืนยันตัวตนสำเร็จและกดรับทราบ' end, p_ctx);
  perform public.njhr_audit_write(p_token, 'DOC_' || a, 'document', 'njhr_emp_documents', p_id::text,
    d.doc_no || ' → ' || v_new, to_jsonb(d),
    (select to_jsonb(x) from public.njhr_emp_documents x where x.id = p_id), null);

  return query select x.id, x.status, x.responded_at from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ─── 12) รายการเอกสาร (หน้าศูนย์เอกสาร) ──────────────────────
create or replace function public.njhr_doc_center_list(
  p_token text, p_q text default null, p_type text default null,
  p_status text default null, p_dept text default null, p_employee uuid default null,
  p_from date default null, p_to date default null,
  p_limit int default 200, p_offset int default 0)
returns table (
  id uuid, doc_no text, version int, doc_type text, title text,
  employee_id uuid, emp_code text, emp_name text, department text, position_name text,
  issued_at timestamptz, effective_date date, status text, requires_signature boolean,
  approver_name text, approved_at timestamptz, sent_at timestamptz, viewed_at timestamptz,
  acked_by text, acked_at timestamptz, reject_reason text,
  issued_by text, locked_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,200),1),500);
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  return query
  with base as (
    select d.*,
           (select a.emp_name from public.njhr_emp_doc_acks a
             where a.document_id = d.id order by a.acked_at desc limit 1) ack_name,
           (select a.acked_at from public.njhr_emp_doc_acks a
             where a.document_id = d.id order by a.acked_at desc limit 1) ack_at
      from public.njhr_emp_documents d
     where (c.is_manager or d.employee_id = c.employee_id)          -- พนักงานเห็นเฉพาะของตนเอง
       and (not c.is_manager or d.status <> 'DRAFT' or true)
       and (p_employee is null or d.employee_id = p_employee)
       and (p_type   is null or p_type   = '' or d.doc_type = upper(p_type))
       and (p_status is null or p_status = '' or d.status   = upper(p_status))
       and (p_dept   is null or p_dept   = '' or d.dept_snap = p_dept)
       and (p_from is null or (d.issued_at at time zone 'Asia/Bangkok')::date >= p_from)
       and (p_to   is null or (d.issued_at at time zone 'Asia/Bangkok')::date <= p_to)
       -- พนักงานไม่ควรเห็นฉบับที่ยังไม่ถูกส่ง
       and (c.is_manager or d.status in ('SENT','VIEWED','ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED'))
       and (q = '' or lower(d.doc_no) like '%'||q||'%'
            or lower(coalesce(d.title,'')) like '%'||q||'%'
            or lower(coalesce(d.emp_name_snap,'')) like '%'||q||'%'
            or lower(coalesce(d.emp_code_snap,'')) like '%'||q||'%'
            or lower(coalesce(d.dept_snap,'')) like '%'||q||'%')
  )
  select b.id, b.doc_no, b.version, b.doc_type, b.title,
         b.employee_id, coalesce(b.emp_code_snap,''), coalesce(b.emp_name_snap,''),
         coalesce(b.dept_snap,''), coalesce(b.position_snap,''),
         b.issued_at, b.effective_date, b.status, b.requires_signature,
         coalesce(b.approver_name,''), b.approved_at, b.sent_at, b.viewed_at,
         coalesce(b.ack_name,''), b.ack_at, coalesce(b.reject_reason,''),
         coalesce(b.issued_by,''), b.locked_at,
         count(*) over () as total_count
    from base b
   order by b.issued_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 13) รายละเอียดเอกสาร + ไทม์ไลน์ ─────────────────────────
create or replace function public.njhr_doc_detail(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if not c.is_manager then
    if d.employee_id is distinct from c.employee_id then
      raise exception 'คุณไม่มีสิทธิ์เปิดเอกสารฉบับนี้' using errcode='42501';
    end if;
    if d.status not in ('SENT','VIEWED','ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED') then
      raise exception 'เอกสารฉบับนี้ยังไม่ถูกส่งถึงคุณ' using errcode='42501';
    end if;
  end if;

  return query select jsonb_build_object(
    'doc', to_jsonb(d),
    'org', (select to_jsonb(o) from public.njhr_org_profile o where o.id = 1),
    'ack', (select to_jsonb(a) from public.njhr_emp_doc_acks a
             where a.document_id = d.id order by a.acked_at desc limit 1),
    'events', coalesce((select jsonb_agg(to_jsonb(ev) order by ev.at)
                          from public.njhr_emp_doc_events ev where ev.document_id = d.id), '[]'::jsonb),
    'versions', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', v.id, 'version', v.version, 'status', v.status, 'issued_at', v.issued_at)
                            order by v.version)
                          from public.njhr_emp_documents v where v.doc_no = d.doc_no), '[]'::jsonb)
  );
end $$;


-- ─── 14) ข้อมูลพนักงานสำหรับเติมลง Template ──────────────────
create or replace function public.njhr_doc_emp_profile(p_token text, p_employee uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_doc_guard(p_token, true);
  return query
  select jsonb_build_object(
    'id', e.id,
    'emp_code', e.emp_code,
    'prefix', coalesce(e.prefix,''),
    'first_name', e.first_name,
    'last_name', coalesce(e.last_name,''),
    'full_name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
    'nickname', coalesce(e.nickname,''),
    'national_id', coalesce(e.national_id,''),
    'address', coalesce(e.address,''),
    'position_name', coalesce(e.position_name,''),
    'department_name', coalesce(e.department_name,''),
    'start_date', e.start_date,
    'probation_days', e.probation_days,
    'emp_type', e.emp_type,
    'status', e.status::text,
    'resign_date', e.resign_date,
    'base_salary', e.base_salary,
    'supervisor_id', e.supervisor_id,
    'supervisor_name', (select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'')
                          from public.employees s where s.id = e.supervisor_id),
    'supervisor_position', (select coalesce(s.position_name,'')
                              from public.employees s where s.id = e.supervisor_id),
    'company', (select o.company_name from public.njhr_org_profile o where o.id = 1)
  )
  from public.employees e where e.id = p_employee;
end $$;


-- ─── 15) ตัวเลือกผู้อนุมัติ (พนักงานจริงที่เป็นหัวหน้า/ผู้บริหาร) ──
create or replace function public.njhr_doc_approvers(p_token text, p_q text default null, p_limit int default 10)
returns table (employee_id uuid, emp_code text, name text, position_name text, department text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
begin
  perform public.njhr_doc_guard(p_token, true);
  return query
  select e.id, e.emp_code,
         (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
         coalesce(e.position_name,''), coalesce(e.department_name,'')
    from public.employees e
   where e.status::text = 'ACTIVE'
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.position_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit least(greatest(coalesce(p_limit,10),1),50);
end $$;


-- ─── 16) สิทธิ์เรียกใช้ ──────────────────────────────────────
revoke all on function public.njhr_doc_event(uuid,text,text,text,text,jsonb) from public, anon, authenticated;

grant execute on function public.njhr_doc_prefix(text)                                  to anon, authenticated;
grant execute on function public.njhr_doc_next_no(text)                                 to anon, authenticated;
grant execute on function public.njhr_doc_can_approve(text)                             to anon, authenticated;
grant execute on function public.njhr_doc_org(text)                                     to anon, authenticated;
grant execute on function public.njhr_doc_org_save(text,jsonb)                          to anon, authenticated;
grant execute on function public.njhr_doc_save(text,uuid,text,uuid,text,text,date,jsonb,uuid) to anon, authenticated;
grant execute on function public.njhr_doc_flow(text,uuid,text,text,jsonb)                to anon, authenticated;
grant execute on function public.njhr_doc_view(text,uuid,jsonb)                          to anon, authenticated;
grant execute on function public.njhr_doc_respond(text,uuid,text,text,jsonb,text,text)   to anon, authenticated;
grant execute on function public.njhr_doc_center_list(text,text,text,text,text,uuid,date,date,int,int) to anon, authenticated;
grant execute on function public.njhr_doc_detail(text,uuid)                              to anon, authenticated;
grant execute on function public.njhr_doc_emp_profile(text,uuid)                         to anon, authenticated;
grant execute on function public.njhr_doc_approvers(text,text,int)                       to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v11.7-hr-doc-center', 'ศูนย์จัดการเอกสาร HR: 7 ประเภท + Workflow เต็ม + ยืนยันตัวตน + ประวัติเหตุการณ์')
on conflict (version) do nothing;


-- ─── 17) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'doc_type_constraint',  (select pg_get_constraintdef(con.oid) from pg_constraint con
                             join pg_class r on r.oid=con.conrelid
                            where r.relname='njhr_emp_documents' and con.conname='njhr_empdoc_type_chk'),
  'status_constraint',    (select pg_get_constraintdef(con.oid) from pg_constraint con
                             join pg_class r on r.oid=con.conrelid
                            where r.relname='njhr_emp_documents' and con.conname='njhr_empdoc_status_chk'),
  'events_table',         to_regclass('public.njhr_emp_doc_events') is not null,
  'org_profile',          (select to_jsonb(o) from public.njhr_org_profile o where o.id=1),
  'ตัวอย่างเลขที่ถัดไป', jsonb_build_object(
      'CONTRACT', public.njhr_doc_next_no('CONTRACT'),
      'WARNING',  public.njhr_doc_next_no('WARNING'),
      'COE',      public.njhr_doc_next_no('COE'),
      'SEPARATION', public.njhr_doc_next_no('SEPARATION')),
  'เอกสารเดิมไม่ถูกแตะ',  (select count(*) from public.njhr_emp_documents),
  'การรับทราบเดิมไม่ถูกแตะ', (select count(*) from public.njhr_emp_doc_acks),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_doc\_%'),
  'ระบบอื่นไม่ถูกแตะ', jsonb_build_object(
      'leave_requests', (select count(*) from public.leave_requests),
      'leave_approvers',(select count(*) from public.leave_approvers),
      'employees',      (select count(*) from public.employees))
)) as install_report;


-- ─── 18) ROLLBACK (คัดลอกไปรันถ้าต้องย้อนกลับ) ───────────────
-- drop function if exists public.njhr_doc_approvers(text,text,int);
-- drop function if exists public.njhr_doc_emp_profile(text,uuid);
-- drop function if exists public.njhr_doc_detail(text,uuid);
-- drop function if exists public.njhr_doc_center_list(text,text,text,text,text,uuid,date,date,int,int);
-- drop function if exists public.njhr_doc_respond(text,uuid,text,text,jsonb,text,text);
-- drop function if exists public.njhr_doc_view(text,uuid,jsonb);
-- drop function if exists public.njhr_doc_flow(text,uuid,text,text,jsonb);
-- drop function if exists public.njhr_doc_save(text,uuid,text,uuid,text,text,date,jsonb,uuid);
-- drop function if exists public.njhr_doc_org_save(text,jsonb);
-- drop function if exists public.njhr_doc_org(text);
-- drop function if exists public.njhr_doc_next_no(text);
-- drop function if exists public.njhr_doc_prefix(text);
-- drop function if exists public.njhr_doc_can_approve(text);
-- drop function if exists public.njhr_doc_event(uuid,text,text,text,text,jsonb);
-- drop table if exists public.njhr_emp_doc_events;
-- drop table if exists public.njhr_org_profile;
-- (คอลัมน์ที่เพิ่มและ constraint ใหม่ทิ้งไว้ได้ ไม่กระทบของเดิม)
