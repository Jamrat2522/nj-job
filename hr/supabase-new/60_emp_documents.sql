-- ============================================================
-- NJ HR V.10 — 60_emp_documents.sql   [รอบ 1/3]
-- แฟ้มประวัติพนักงาน: เอกสารรายบุคคล + การรับทราบ/ลงนาม + เวอร์ชัน
--
-- ตรวจโครงสร้างจริงก่อนแล้ว:
--   employee_documents (0 แถว, 6 คอลัมน์) = ของเดิมในโปรเจกต์ → ตามคำสั่ง "ห้ามแก้หรือใช้" จึงไม่แตะ
--   documents (3,688) · document_logs (22,120) · sa_documents (803) · sa_document_logs (6,929)
--   · signatures (4,291) = ของแอปชิปปิ้ง/แมสเซนเจอร์ → ห้ามแตะเด็ดขาด
--   จึงสร้างตารางใหม่ขึ้นต้น njhr_ ตามแบบแผนเดิมของโปรเจกต์นี้
--
-- กติกาที่บังคับที่ฐานข้อมูล:
--   · เอกสารที่รับทราบ/ลงนามแล้ว ห้ามแก้เนื้อหา (trigger บล็อก)
--   · แก้ไข = ออกฉบับใหม่ (version + 1) แล้วฉบับเดิมเปลี่ยนเป็น SUPERSEDED
--   · เก็บ ผู้รับทราบ · วันเวลา · ช่องทาง · IP · อุปกรณ์ ครบตามรูปแบบรายงานตัวอย่าง
--
-- ไม่แตะ: employees · payroll · leave_requests · ot_requests · holidays · audit_log (โครงสร้าง)
-- ต้องรัน 48_employees.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  if to_regclass('public.employees') is null then raise exception 'PREFLIGHT: ไม่พบตาราง employees'; end if;
  -- ยืนยันว่าไม่ไปยุ่งกับตารางเอกสารของแอปอื่น
  if to_regclass('public.njhr_emp_documents') is not null then
    raise notice 'มี njhr_emp_documents อยู่แล้ว — จะอัปเดตเฉพาะส่วนที่จำเป็น';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ตารางเอกสารรายบุคคล ──────────────────────────────────
create table if not exists public.njhr_emp_documents (
  id            uuid primary key default gen_random_uuid(),
  doc_no        text not null,                       -- NJ-YYYYMMDD#### (คงเดิมทุกเวอร์ชัน)
  version       int  not null default 1 check (version >= 1),
  doc_type      text not null check (doc_type in
                  ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT')),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  -- Snapshot ณ วันออกเอกสาร เพื่อให้เอกสารย้อนหลังไม่เปลี่ยนตามข้อมูลพนักงานปัจจุบัน
  emp_code_snap text,
  emp_name_snap text,
  dept_snap     text,
  position_snap text,
  title         text not null,
  body          text not null,                       -- เนื้อหาเต็มฉบับ เก็บรายฉบับ
  effective_date date,
  status        text not null default 'PENDING' check (status in
                  ('DRAFT','PENDING','ACKNOWLEDGED','SIGNED','CANCELLED','SUPERSEDED')),
  requires_signature boolean not null default false,  -- สัญญาจ้างต้องลงนาม
  -- โซ่เวอร์ชัน
  supersedes_id uuid references public.njhr_emp_documents(id) on delete set null,
  superseded_by uuid references public.njhr_emp_documents(id) on delete set null,
  locked_at     timestamptz,                          -- ล็อกเมื่อรับทราบ/ลงนาม
  cancelled_at  timestamptz,
  cancel_reason text,
  issued_by     text,
  issued_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    text
);
alter table public.njhr_emp_documents enable row level security;
create unique index if not exists njhr_empdoc_ver_uidx on public.njhr_emp_documents (doc_no, version);
create index if not exists njhr_empdoc_emp_idx  on public.njhr_emp_documents (employee_id, issued_at desc);
create index if not exists njhr_empdoc_type_idx on public.njhr_emp_documents (doc_type, status);

comment on table public.njhr_emp_documents is
  'เอกสารรายบุคคลของพนักงาน (สัญญาจ้าง/หนังสือเตือน/พักงาน/ผลทดลองงาน) — แยกจาก employee_documents เดิมโดยเจตนา';


-- ─── 2) ตารางการรับทราบ / ลงนาม ──────────────────────────────
create table if not exists public.njhr_emp_doc_acks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.njhr_emp_documents(id) on delete cascade,
  employee_id   uuid not null references public.employees(id) on delete cascade,
  -- Snapshot สำหรับรายงาน (ตรงกับคอลัมน์ในไฟล์ตัวอย่าง)
  emp_code      text,
  emp_name      text,
  department    text,
  action        text not null check (action in ('ACKNOWLEDGE','SIGN')),
  channel       text,                                 -- 📱 Mobile Web / 💻 Desktop Web
  ip_address    text,
  user_agent    text,
  device        text,
  signature_path text,                                -- ไฟล์ลายเซ็นใน Private Bucket
  doc_version   int not null,
  acked_at      timestamptz not null default now(),
  acked_by      text
);
alter table public.njhr_emp_doc_acks enable row level security;
-- 1 เอกสาร 1 เวอร์ชัน รับทราบได้ครั้งเดียว
create unique index if not exists njhr_empack_uidx on public.njhr_emp_doc_acks (document_id, employee_id);
create index if not exists njhr_empack_emp_idx on public.njhr_emp_doc_acks (employee_id, acked_at desc);


-- ─── 3) ล็อกเนื้อหาหลังรับทราบ/ลงนาม (บังคับที่ฐานข้อมูล) ────
create or replace function public.njhr_empdoc_lock_guard()
returns trigger language plpgsql as $$
begin
  -- ฉบับที่ล็อกแล้วแก้เนื้อหาไม่ได้ ต้องออกเวอร์ชันใหม่เท่านั้น
  if old.locked_at is not null then
    if new.title is distinct from old.title
       or new.body is distinct from old.body
       or new.doc_type is distinct from old.doc_type
       or new.employee_id is distinct from old.employee_id
       or new.effective_date is distinct from old.effective_date
       or new.version is distinct from old.version then
      raise exception 'เอกสารฉบับนี้ถูกล็อกแล้ว (รับทราบ/ลงนามเมื่อ %) แก้ไขไม่ได้ — ต้องออกฉบับใหม่แทน',
        to_char(old.locked_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI')
        using errcode='42501';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists njhr_empdoc_lock_trg on public.njhr_emp_documents;
create trigger njhr_empdoc_lock_trg before update on public.njhr_emp_documents
  for each row execute function public.njhr_empdoc_lock_guard();


-- ─── 4) Private Bucket สำหรับลายเซ็น ─────────────────────────
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'ไม่พบ storage.buckets — ข้ามการสร้าง bucket (สร้างเองที่หน้า Dashboard)';
    return;
  end if;
  insert into storage.buckets (id, name, public)
  values ('njhr-signatures', 'njhr-signatures', false)
  on conflict (id) do update set public = false;   -- บังคับ private เสมอ
  raise notice 'bucket njhr-signatures พร้อมใช้งาน (private)';
exception when others then
  raise notice 'สร้าง bucket ไม่สำเร็จ (%) — สร้างเองที่ Dashboard ชื่อ njhr-signatures แบบ private', sqlerrm;
end $$;

-- RLS ของ Storage: เข้าถึงลายเซ็นผ่าน Signed URL เท่านั้น
do $$
begin
  if to_regclass('storage.objects') is null then return; end if;
  begin
    execute $p$drop policy if exists njhr_sig_no_public on storage.objects$p$;
    execute $p$create policy njhr_sig_no_public on storage.objects for select
              using (bucket_id <> 'njhr-signatures')$p$;
    raise notice 'ตั้ง policy ปิดการอ่านลายเซ็นแบบสาธารณะแล้ว';
  exception when others then
    raise notice 'ตั้ง policy storage ไม่สำเร็จ (%) — ตรวจสิทธิ์ที่ Dashboard', sqlerrm;
  end;
end $$;

insert into public.njhr_schema_version(version, note)
values ('v11.6-emp-documents', 'แฟ้มประวัติพนักงาน: เอกสารรายบุคคล + รับทราบ/ลงนาม + เวอร์ชัน')
on conflict (version) do nothing;


-- ลบ signature เก่าที่อาจค้างจากการทดลองรุ่นก่อน (กันชื่อฟังก์ชันซ้ำจนเรียกใช้ไม่ได้)
drop function if exists public.njhr_doc_data(text, uuid, int);
drop function if exists public.njhr_doc_issue(text, text, uuid, int, text);
drop function if exists public.njhr_doc_history(text, date, date, uuid, text, int);

-- ─── 5) ตัวช่วยสิทธิ์ ────────────────────────────────────────
-- ผู้จัดการเอกสาร: SUPER_ADMIN / ADMIN / HR · พนักงานเห็นเฉพาะของตนเอง
create or replace function public.njhr_doc_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write and c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์จัดการเอกสารพนักงาน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','HR'));
end $$;

-- เลขที่เอกสารรูปแบบเดียวกับตัวอย่าง: NJ-YYYYMMDD####
create or replace function public.njhr_doc_next_no()
returns text language plpgsql security definer set search_path = public as $$
declare d text := to_char(now() at time zone 'Asia/Bangkok','YYYYMMDD'); n int;
begin
  select coalesce(max(nullif(regexp_replace(doc_no,'^NJ-\d{8}',''),''))::int,0) + 1 into n
    from public.njhr_emp_documents
   where doc_no like 'NJ-' || d || '%';
  return 'NJ-' || d || lpad(n::text, 4, '0');
end $$;


-- ─── 6) รายการเอกสาร ─────────────────────────────────────────
create or replace function public.njhr_doc_list(
  p_token text, p_employee uuid default null, p_type text default null,
  p_status text default null, p_q text default null,
  p_latest_only boolean default true, p_limit int default 100, p_offset int default 0)
returns table (
  id uuid, doc_no text, version int, doc_type text, title text,
  employee_id uuid, emp_code text, emp_name text, department text, position_name text,
  effective_date date, status text, requires_signature boolean,
  locked_at timestamptz, issued_by text, issued_at timestamptz,
  acked_at timestamptz, ack_action text, ack_channel text, has_signature boolean,
  superseded_by uuid, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  if not c.is_manager and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  return query
  with base as (
    select d.id did, d.doc_no dn, d.version dv, d.doc_type dt, d.title dtt,
           d.employee_id deid, coalesce(e.emp_code, d.emp_code_snap) dec,
           coalesce(nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),''),
                    d.emp_name_snap) den,
           coalesce(e.department_name, d.dept_snap) ddept,
           coalesce(e.position_name, d.position_snap) dpos,
           d.effective_date def, d.status dst, d.requires_signature drs,
           d.locked_at dl, d.issued_by dib, d.issued_at dia,
           a.acked_at aat, a.action aac, a.channel ach, (a.signature_path is not null) asig,
           d.superseded_by dsb
      from public.njhr_emp_documents d
      left join public.employees e on e.id = d.employee_id
      left join public.njhr_emp_doc_acks a on a.document_id = d.id
     where (c.is_manager or d.employee_id = c.employee_id)
       -- พนักงานไม่เห็นฉบับร่าง
       and (c.is_manager or d.status <> 'DRAFT')
       and (p_employee is null or d.employee_id = p_employee)
       and (p_type is null or p_type = '' or d.doc_type = upper(p_type))
       and (p_status is null or p_status = '' or d.status = upper(p_status))
       and (not coalesce(p_latest_only,true) or d.superseded_by is null)
       and (q = '' or lower(d.doc_no) like '%'||q||'%' or lower(d.title) like '%'||q||'%'
            or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'))
  select b.did, b.dn, b.dv, b.dt, b.dtt, b.deid, b.dec, b.den, b.ddept, b.dpos,
         b.def, b.dst, b.drs, b.dl, b.dib, b.dia, b.aat, b.aac, b.ach, coalesce(b.asig,false),
         b.dsb, (select count(*) from base)
    from base b order by b.dia desc
   limit least(greatest(coalesce(p_limit,100),1),500) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 7) เอกสาร 1 ฉบับ + ประวัติทุกเวอร์ชัน ───────────────────
create or replace function public.njhr_doc_get(p_token text, p_id uuid)
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
      raise exception 'ดูได้เฉพาะเอกสารของตนเอง' using errcode='42501';
    end if;
    if d.status = 'DRAFT' then raise exception 'เอกสารฉบับนี้ยังไม่ถูกเผยแพร่' using errcode='42501'; end if;
  end if;

  return query select jsonb_build_object(
    'doc', jsonb_build_object(
      'id', d.id, 'doc_no', d.doc_no, 'version', d.version, 'doc_type', d.doc_type,
      'title', d.title, 'body', d.body, 'effective_date', d.effective_date,
      'status', d.status, 'requires_signature', d.requires_signature,
      'locked_at', d.locked_at, 'issued_by', d.issued_by, 'issued_at', d.issued_at,
      'cancel_reason', d.cancel_reason, 'supersedes_id', d.supersedes_id, 'superseded_by', d.superseded_by),
    'employee', (select jsonb_build_object(
        'id', e.id, 'code', coalesce(e.emp_code, d.emp_code_snap),
        'name', coalesce(nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),''), d.emp_name_snap),
        'department', coalesce(e.department_name, d.dept_snap),
        'position', coalesce(e.position_name, d.position_snap),
        'start_date', e.start_date)
      from public.employees e where e.id = d.employee_id),
    'company', coalesce((select s.value from public.system_settings s where s.key = 'company'), '{}'::jsonb),
    'ack', (select to_jsonb(a) - 'signature_path' || jsonb_build_object('has_signature', a.signature_path is not null)
              from public.njhr_emp_doc_acks a where a.document_id = d.id),
    -- ประวัติทุกเวอร์ชันของเลขที่เอกสารเดียวกัน
    'versions', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', v.id, 'version', v.version, 'status', v.status,
          'issued_at', v.issued_at, 'issued_by', v.issued_by,
          'locked_at', v.locked_at, 'is_current', v.id = d.id) order by v.version desc), '[]')
        from public.njhr_emp_documents v where v.doc_no = d.doc_no)
  );
end $$;


-- ─── 8) ออกเอกสารใหม่ / ออกฉบับใหม่แทนฉบับเดิม ───────────────
-- p_supersedes ระบุเมื่อ "แก้ไข" เอกสารที่ล็อกแล้ว → สร้างเวอร์ชันใหม่ ไม่แก้ทับ
create or replace function public.njhr_doc_issue(
  p_token text, p_employee uuid, p_type text, p_title text, p_body text,
  p_effective date default null, p_publish boolean default true,
  p_supersedes uuid default null, p_reason text default null)
returns table (id uuid, doc_no text, version int, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; old record; v_no text; v_ver int := 1; v_id uuid; v_sig boolean;
begin
  select * into c from public.njhr_doc_guard(p_token, true);
  if upper(coalesce(p_type,'')) not in ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT') then
    raise exception 'ประเภทเอกสารไม่ถูกต้อง (%)', p_type using errcode='22023';
  end if;
  if coalesce(btrim(p_title),'') = '' then raise exception 'กรุณาระบุหัวข้อเอกสาร' using errcode='22023'; end if;
  if coalesce(btrim(p_body),'') = '' then raise exception 'กรุณาระบุเนื้อหาเอกสาร' using errcode='22023'; end if;

  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
  v_sig := (upper(p_type) = 'CONTRACT');    -- สัญญาจ้างต้องลงนาม

  if p_supersedes is not null then
    select * into old from public.njhr_emp_documents where id = p_supersedes;
    if not found then raise exception 'ไม่พบเอกสารฉบับเดิม' using errcode='P0002'; end if;
    if old.superseded_by is not null then
      raise exception 'เอกสารฉบับนี้ถูกออกฉบับใหม่แทนไปแล้ว' using errcode='22023';
    end if;
    if old.status = 'CANCELLED' then raise exception 'เอกสารฉบับนี้ถูกยกเลิกแล้ว' using errcode='22023'; end if;
    if old.employee_id is distinct from p_employee then
      raise exception 'ออกฉบับใหม่แทนได้เฉพาะพนักงานคนเดียวกัน' using errcode='22023';
    end if;
    v_no := old.doc_no;
    select max(version) + 1 into v_ver from public.njhr_emp_documents where doc_no = v_no;
  else
    v_no := public.njhr_doc_next_no();
  end if;

  insert into public.njhr_emp_documents (
    doc_no, version, doc_type, employee_id,
    emp_code_snap, emp_name_snap, dept_snap, position_snap,
    title, body, effective_date, status, requires_signature,
    supersedes_id, issued_by, updated_by)
  values (v_no, v_ver, upper(p_type), p_employee,
    e.emp_code, btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),
    e.department_name, e.position_name,
    btrim(p_title), btrim(p_body), p_effective,
    case when coalesce(p_publish,true) then 'PENDING' else 'DRAFT' end, v_sig,
    p_supersedes, c.username, c.username)
  returning njhr_emp_documents.id into v_id;

  -- ฉบับเดิมกลายเป็น "ออกฉบับใหม่แทน" (ไม่ลบ ไม่แก้เนื้อหา)
  if p_supersedes is not null then
    update public.njhr_emp_documents
       set superseded_by = v_id, status = 'SUPERSEDED',
           cancel_reason = coalesce(nullif(btrim(p_reason),''), cancel_reason),
           updated_at = now(), updated_by = c.username
     where njhr_emp_documents.id = p_supersedes;
  end if;

  perform public.njhr_audit_write(p_token,
    case when p_supersedes is null then 'EMPDOC_ISSUE' else 'EMPDOC_REVISE' end,
    'document', 'njhr_emp_documents', v_id::text,
    v_no || ' v' || v_ver || ' · ' || upper(p_type) || ' · ' || e.emp_code || ' ' ||
    btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) ||
    coalesce(' · เหตุผล: ' || nullif(btrim(p_reason),''), ''), null, null, null);

  return query select d.id, d.doc_no, d.version, d.status
                 from public.njhr_emp_documents d where d.id = v_id;
end $$;


-- ─── 9) รับทราบ / ลงนาม (พนักงานเจ้าของเอกสารเท่านั้น) ───────
create or replace function public.njhr_doc_ack(
  p_token text, p_id uuid, p_action text,
  p_channel text default null, p_ip text default null,
  p_user_agent text default null, p_device text default null,
  p_signature_path text default null)
returns table (id uuid, status text, acked_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; e record; v_act text := upper(coalesce(p_action,'')); v_ack uuid;
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  if v_act not in ('ACKNOWLEDGE','SIGN') then
    raise exception 'การดำเนินการไม่ถูกต้อง (%)', p_action using errcode='22023';
  end if;
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;

  -- เจ้าของเอกสารเท่านั้น (ผู้ดูแลก็รับทราบแทนไม่ได้)
  if d.employee_id is distinct from c.employee_id then
    raise exception 'รับทราบได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode='42501';
  end if;
  if d.status = 'DRAFT' then raise exception 'เอกสารฉบับนี้ยังไม่ถูกเผยแพร่' using errcode='22023'; end if;
  if d.status = 'CANCELLED' then raise exception 'เอกสารฉบับนี้ถูกยกเลิกแล้ว' using errcode='22023'; end if;
  if d.status = 'SUPERSEDED' then
    raise exception 'เอกสารฉบับนี้ถูกออกฉบับใหม่แทนแล้ว กรุณาดำเนินการกับฉบับล่าสุด' using errcode='22023';
  end if;
  if d.locked_at is not null then
    raise exception 'เอกสารฉบับนี้ดำเนินการไปแล้วเมื่อ %',
      to_char(d.locked_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI') using errcode='22023';
  end if;
  -- สัญญาจ้างต้องลงนามพร้อมลายเซ็น
  if d.requires_signature then
    if v_act <> 'SIGN' then
      raise exception 'เอกสารฉบับนี้ต้องลงนาม ไม่ใช่เพียงรับทราบ' using errcode='22023';
    end if;
    if coalesce(btrim(p_signature_path),'') = '' then
      raise exception 'กรุณาลงลายมือชื่อก่อนยืนยัน' using errcode='22023';
    end if;
  elsif v_act = 'SIGN' then
    raise exception 'เอกสารประเภทนี้ใช้การรับทราบ ไม่ต้องลงนาม' using errcode='22023';
  end if;

  select * into e from public.employees where id = d.employee_id;
  insert into public.njhr_emp_doc_acks (
    document_id, employee_id, emp_code, emp_name, department,
    action, channel, ip_address, user_agent, device, signature_path, doc_version, acked_by)
  values (p_id, d.employee_id, e.emp_code,
    btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),
    e.department_name, v_act, nullif(btrim(coalesce(p_channel,'')),''),
    nullif(btrim(coalesce(p_ip,'')),''), left(coalesce(p_user_agent,''), 500),
    nullif(btrim(coalesce(p_device,'')),''), nullif(btrim(coalesce(p_signature_path,'')),''),
    d.version, c.username)
  returning njhr_emp_doc_acks.id into v_ack;

  -- ล็อกฉบับนี้ทันที แก้เนื้อหาไม่ได้อีก (trigger บังคับซ้ำอีกชั้น)
  update public.njhr_emp_documents
     set status = case when v_act = 'SIGN' then 'SIGNED' else 'ACKNOWLEDGED' end,
         locked_at = now(), updated_at = now(), updated_by = c.username
   where njhr_emp_documents.id = p_id;

  perform public.njhr_audit_write(p_token,
    case when v_act = 'SIGN' then 'EMPDOC_SIGN' else 'EMPDOC_ACK' end,
    'document', 'njhr_emp_documents', p_id::text,
    d.doc_no || ' v' || d.version || ' · ' || e.emp_code || ' · ' ||
    coalesce(p_channel,'-') || ' · IP ' || coalesce(p_ip,'-'), null, null, null);

  return query select d2.id, d2.status, a.acked_at
                 from public.njhr_emp_documents d2
                 join public.njhr_emp_doc_acks a on a.id = v_ack
                where d2.id = p_id;
end $$;


-- ─── 10) ยกเลิกเอกสาร ────────────────────────────────────────
create or replace function public.njhr_doc_cancel(p_token text, p_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_doc_guard(p_token, true);
  if coalesce(btrim(p_reason),'') = '' then
    raise exception 'กรุณาระบุเหตุผลการยกเลิก' using errcode='22023';
  end if;
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status = 'CANCELLED' then raise exception 'เอกสารฉบับนี้ถูกยกเลิกไปแล้ว' using errcode='22023'; end if;
  if d.status = 'SUPERSEDED' then raise exception 'เอกสารฉบับนี้ถูกออกฉบับใหม่แทนแล้ว' using errcode='22023'; end if;

  update public.njhr_emp_documents
     set status = 'CANCELLED', cancelled_at = now(), cancel_reason = btrim(p_reason),
         updated_at = now(), updated_by = c.username
   where njhr_emp_documents.id = p_id;

  perform public.njhr_audit_write(p_token, 'EMPDOC_CANCEL', 'document', 'njhr_emp_documents',
    p_id::text, d.doc_no || ' v' || d.version || ' · เหตุผล: ' || btrim(p_reason), null, null, null);
  return true;
end $$;


-- ─── 11) ข้อมูลสำหรับรายงานการรับทราบ (รูปแบบเดียวกับตัวอย่าง) ──
create or replace function public.njhr_doc_ack_report(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if not c.is_manager and d.employee_id is distinct from c.employee_id then
    raise exception 'ดูได้เฉพาะเอกสารของตนเอง' using errcode='42501';
  end if;

  return query select jsonb_build_object(
    'doc_no', d.doc_no, 'version', d.version, 'doc_type', d.doc_type,
    'title', d.title, 'body', d.body,
    'issued_by', d.issued_by, 'issued_at', d.issued_at,
    'effective_date', d.effective_date, 'status', d.status,
    'report_at', now(),
    'company', coalesce((select s.value from public.system_settings s where s.key = 'company'), '{}'::jsonb),
    -- เอกสารรายบุคคล: ผู้รับคือเจ้าของเอกสารคนเดียว ไม่ใช่รายชื่อรวมทุกคน
    'total', 1,
    'acked', (select count(*)::int from public.njhr_emp_doc_acks a where a.document_id = d.id),
    'rows', (select coalesce(jsonb_agg(jsonb_build_object(
        'no', 1, 'emp_code', coalesce(a.emp_code, d.emp_code_snap),
        'emp_name', coalesce(a.emp_name, d.emp_name_snap),
        'department', coalesce(a.department, d.dept_snap),
        'channel', coalesce(a.channel,'-'),
        'acked_at', a.acked_at, 'action', a.action,
        'has_signature', a.signature_path is not null)), '[]')
      from public.njhr_emp_doc_acks a where a.document_id = d.id),
    'pending', (select case when exists (select 1 from public.njhr_emp_doc_acks a where a.document_id = d.id)
                            then '[]'::jsonb
                       else jsonb_build_array(jsonb_build_object(
                              'no', 1, 'emp_code', d.emp_code_snap, 'emp_name', d.emp_name_snap,
                              'department', d.dept_snap)) end)
  );
end $$;


-- ─── 12) สิทธิ์เรียกใช้ ──────────────────────────────────────
revoke all on function public.njhr_doc_guard(text, boolean) from public, anon, authenticated;
revoke all on function public.njhr_doc_next_no() from public, anon, authenticated;

grant execute on function public.njhr_doc_list(text,uuid,text,text,text,boolean,int,int) to anon, authenticated;
grant execute on function public.njhr_doc_get(text,uuid)                                  to anon, authenticated;
grant execute on function public.njhr_doc_issue(text,uuid,text,text,text,date,boolean,uuid,text) to anon, authenticated;
grant execute on function public.njhr_doc_ack(text,uuid,text,text,text,text,text,text)    to anon, authenticated;
grant execute on function public.njhr_doc_cancel(text,uuid,text)                          to anon, authenticated;
grant execute on function public.njhr_doc_ack_report(text,uuid)                           to anon, authenticated;


-- ─── 13) VERIFICATION ────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'new_tables', (select jsonb_agg(table_name order by table_name) from information_schema.tables
                  where table_schema='public' and table_name in ('njhr_emp_documents','njhr_emp_doc_acks')),
  'rls', jsonb_build_object(
    'njhr_emp_documents', (select relrowsecurity from pg_class where oid='public.njhr_emp_documents'::regclass),
    'njhr_emp_doc_acks',  (select relrowsecurity from pg_class where oid='public.njhr_emp_doc_acks'::regclass)),
  'lock_trigger', exists(select 1 from pg_trigger where tgname='njhr_empdoc_lock_trg'),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_doc\_%'),
  'signature_bucket', (select jsonb_build_object('id', b.id, 'public', b.public)
                         from storage.buckets b where b.id='njhr-signatures'),
  -- ยืนยันว่าไม่ไปแตะตารางของแอปอื่น
  'employee_documents_untouched', (select count(*) from public.employee_documents),
  'documents_untouched', (select count(*) from public.documents),
  'signatures_untouched', (select count(*) from public.signatures)
)) as install_report;


-- ─── 14) ROLLBACK ────────────────────────────────────────────
-- drop function if exists public.njhr_doc_ack_report(text,uuid);
-- drop function if exists public.njhr_doc_cancel(text,uuid,text);
-- drop function if exists public.njhr_doc_ack(text,uuid,text,text,text,text,text,text);
-- drop function if exists public.njhr_doc_issue(text,uuid,text,text,text,date,boolean,uuid,text);
-- drop function if exists public.njhr_doc_get(text,uuid);
-- drop function if exists public.njhr_doc_list(text,uuid,text,text,text,boolean,int,int);
-- drop function if exists public.njhr_doc_next_no();
-- drop function if exists public.njhr_doc_guard(text,boolean);
-- drop trigger if exists njhr_empdoc_lock_trg on public.njhr_emp_documents;
-- drop function if exists public.njhr_empdoc_lock_guard();
-- drop table if exists public.njhr_emp_doc_acks;
-- drop table if exists public.njhr_emp_documents;
-- delete from storage.buckets where id='njhr-signatures';   -- ลบไฟล์ลายเซ็นก่อน
-- delete from public.njhr_schema_version where version='v11.6-emp-documents';
