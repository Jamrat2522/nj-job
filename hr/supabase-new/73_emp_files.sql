-- ============================================================
-- NJ HR V.10 — 73_emp_files.sql
-- แฟ้มไฟล์แนบรายบุคคล: เอกสารส่วนตัวพนักงาน + เอกสารจากบริษัท
--
-- ขอบเขต (ห้ามแตะของเดิม):
--   · employee_documents (0 แถว, ของเดิมในโปรเจกต์)  → ไม่แตะ ตามที่ 60_emp_documents.sql ระบุไว้
--   · njhr_emp_documents (หนังสือ HR ที่ระบบออกเอง)   → ไม่แตะโครงสร้าง อ่านอย่างเดียว
--   · documents / sa_documents / signatures (แอปอื่น)  → ไม่แตะเด็ดขาด
--   จึงสร้างตารางใหม่ njhr_emp_files + njhr_emp_file_versions
--
-- กติกาที่บังคับที่ฐานข้อมูล:
--   · อ่าน   : SUPER_ADMIN / ADMIN / HR = ทุกคน · role อื่น = เฉพาะ employee_id ของตนเอง
--   · แนบ/แก้: SUPER_ADMIN / ADMIN / HR เท่านั้น
--   · ลบ     : SUPER_ADMIN เท่านั้น และต้องระบุเหตุผล (Soft Delete — ไฟล์จริงไม่ถูกทำลาย)
--   · เอกสารจากระบบหนังสือ HR ที่ผูกกับพนักงานแล้ว ดึงจาก njhr_emp_documents โดยตรง
--     (อ่านอย่างเดียว ห้ามอัปโหลดซ้ำ — บังคับที่ njhr_empfile_save)
--
-- Storage: bucket 'njhr-emp-files' แบบ private 100% ไม่มี policy ให้ anon
--          การอัปโหลด/ดาวน์โหลดทำผ่าน Edge Function njhr-emp-file (service_role) เท่านั้น
--
-- ต้องรัน 41_leave_rpc.sql · 42_core_migration.sql · 48_employees.sql · 67_hr_doc_center.sql
-- · 71_doc_soft_delete.sql มาก่อน · รันซ้ำได้ (idempotent)
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employees';
  end if;
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents — รัน 60_emp_documents.sql / 67_hr_doc_center.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                  where ns.nspname = 'public' and p.proname = 'njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                  where ns.nspname = 'public' and p.proname = 'njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'njhr_emp_documents'
                    and column_name = 'deleted_at') then
    raise exception 'PREFLIGHT: njhr_emp_documents ยังไม่มีคอลัมน์ deleted_at — รัน 71_doc_soft_delete.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ตารางไฟล์แนบรายบุคคล ────────────────────────────────
create table if not exists public.njhr_emp_files (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references public.employees(id) on delete cascade,
  category       text not null,                 -- PERSONAL | COMPANY
  doc_kind       text not null,                 -- รหัสหมวดย่อย (ดูข้อ 2)
  file_name      text not null,                 -- ชื่อไฟล์ที่ผู้ใช้เห็น
  storage_path   text not null,                 -- path ภายใน bucket njhr-emp-files
  mime_type      text,
  file_size      bigint,
  document_date  date,                          -- วันที่ออกเอกสาร
  expiry_date    date,                          -- วันที่หมดอายุ
  note           text,                          -- หมายเหตุ
  version        int  not null default 1 check (version >= 1),
  uploaded_by    text not null,
  uploaded_at    timestamptz not null default now(),
  updated_at     timestamptz,
  updated_by     text,
  deleted_at     timestamptz,
  deleted_by     text,
  delete_reason  text
);
alter table public.njhr_emp_files enable row level security;

create index if not exists njhr_empfile_emp_idx
  on public.njhr_emp_files (employee_id, category, doc_kind, uploaded_at desc);
create index if not exists njhr_empfile_live_idx
  on public.njhr_emp_files (employee_id) where deleted_at is null;
create unique index if not exists njhr_empfile_path_uidx
  on public.njhr_emp_files (storage_path);

comment on table public.njhr_emp_files is
  'ไฟล์แนบรายบุคคล (เอกสารส่วนตัว + เอกสารจากบริษัท) — แยกจาก employee_documents เดิมโดยเจตนา';

-- ประวัติไฟล์เดิมเมื่อกด "เปลี่ยนไฟล์" (ไฟล์เก่าไม่ถูกทำลาย ตรวจย้อนหลังได้)
create table if not exists public.njhr_emp_file_versions (
  id            uuid primary key default gen_random_uuid(),
  file_id       uuid not null references public.njhr_emp_files(id) on delete cascade,
  version       int  not null,
  file_name     text not null,
  storage_path  text not null,
  mime_type     text,
  file_size     bigint,
  replaced_by   text,
  replaced_at   timestamptz not null default now()
);
alter table public.njhr_emp_file_versions enable row level security;
create index if not exists njhr_empfilever_idx
  on public.njhr_emp_file_versions (file_id, version desc);


-- ─── 2) หมวดเอกสารที่อนุญาต ─────────────────────────────────
create or replace function public.njhr_empfile_kind_ok(p_category text, p_kind text)
returns boolean language sql immutable as $$
  select case upper(coalesce(p_category,''))
    when 'PERSONAL' then upper(coalesce(p_kind,'')) in
      ('ID_CARD','HOUSE_REG','BANK_BOOK','EDUCATION','DRIVER_LICENSE','WORK_PERMIT','PHOTO','OTHER')
    when 'COMPANY' then upper(coalesce(p_kind,'')) in
      ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','SALARY_CERT','COE','SEPARATION','OTHER')
    else false
  end;
$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'njhr_empfile_cat_chk') then
    alter table public.njhr_emp_files
      add constraint njhr_empfile_cat_chk check (category in ('PERSONAL','COMPANY'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'njhr_empfile_kind_chk') then
    alter table public.njhr_emp_files
      add constraint njhr_empfile_kind_chk check (public.njhr_empfile_kind_ok(category, doc_kind));
  end if;
end $$;


-- ─── 3) ตัวตรวจสิทธิ์กลาง ───────────────────────────────────
--  p_write = true  → ต้องเป็น SUPER_ADMIN / ADMIN / HR
--  role อื่น อ่านได้เฉพาะเอกสารของ employee_id ตนเองเท่านั้น
create or replace function public.njhr_empfile_guard(
  p_token text, p_employee uuid, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid,
               is_manager boolean, can_delete boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_mgr boolean;
begin
  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');

  if p_write and not v_mgr then
    raise exception 'คุณไม่มีสิทธิ์จัดการเอกสารพนักงาน' using errcode = '42501';
  end if;
  if not v_mgr then
    if c.employee_id is null or p_employee is null or p_employee <> c.employee_id then
      raise exception 'คุณดูได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
    end if;
  end if;

  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      v_mgr, (c.role = 'SUPER_ADMIN');
end $$;


-- ─── 4) รายการเอกสารของพนักงาน 1 คน ─────────────────────────
--  คืนทั้ง ไฟล์แนบจริง (files) และ หนังสือที่ระบบ HR ออกให้ (hr_docs — อ่านอย่างเดียว)
create or replace function public.njhr_empfile_list(p_token text, p_employee uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, false);

  return query
  select jsonb_build_object(
    'employee', (
      select jsonb_build_object(
        'id', e.id, 'emp_code', e.emp_code,
        'full_name', coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
        'department_name', coalesce(e.department_name,''),
        'position_name', coalesce(e.position_name,''),
        'status', e.status::text)
        from public.employees e where e.id = p_employee),
    'perm', jsonb_build_object(
      'role', c.role, 'can_write', c.is_manager, 'can_delete', c.can_delete),
    'files', coalesce((
      select jsonb_agg(x order by x->>'uploaded_at' desc) from (
        select jsonb_build_object(
          'id', f.id, 'category', f.category, 'doc_kind', f.doc_kind,
          'file_name', f.file_name, 'mime_type', coalesce(f.mime_type,''),
          'file_size', f.file_size, 'version', f.version,
          'document_date', f.document_date, 'expiry_date', f.expiry_date,
          'note', coalesce(f.note,''),
          'uploaded_by', f.uploaded_by, 'uploaded_at', f.uploaded_at,
          'updated_by', coalesce(f.updated_by,''), 'updated_at', f.updated_at) x
          from public.njhr_emp_files f
         where f.employee_id = p_employee and f.deleted_at is null) s), '[]'::jsonb),
    'hr_docs', coalesce((
      select jsonb_agg(y order by y->>'issued_at' desc) from (
        select jsonb_build_object(
          'id', d.id, 'doc_no', d.doc_no, 'version', d.version,
          'doc_type', d.doc_type, 'title', d.title,
          'issued_at', d.issued_at, 'effective_date', d.effective_date,
          'status', d.status, 'issued_by', coalesce(d.issued_by,'')) y
          from public.njhr_emp_documents d
         where d.employee_id = p_employee
           and d.deleted_at is null
           and (c.is_manager or d.status in
                ('SENT','VIEWED','ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED'))) t), '[]'::jsonb)
  );
end $$;


-- ─── 5) บันทึก / แก้ไขข้อมูลเอกสาร ──────────────────────────
--  p_file = { name, path, mime, size }  (ส่งมาเมื่ออัปโหลดใหม่ หรือ "เปลี่ยนไฟล์")
--  p_id   = null → เพิ่มใหม่ · มีค่า → แก้ไขข้อมูล/เปลี่ยนไฟล์
create or replace function public.njhr_empfile_save(
  p_token text, p_employee uuid, p_category text, p_doc_kind text,
  p_file jsonb default null, p_id uuid default null,
  p_document_date date default null, p_expiry_date date default null,
  p_note text default null)
returns table (id uuid, version int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; v_cat text := upper(btrim(coalesce(p_category,'')));
        v_kind text := upper(btrim(coalesce(p_doc_kind,''))); v_id uuid; v_ver int;
        v_path text := btrim(coalesce(p_file->>'path',''));
        v_name text := btrim(coalesce(p_file->>'name',''));
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, true);

  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode = 'P0002';
  end if;
  if not public.njhr_empfile_kind_ok(v_cat, v_kind) then
    raise exception 'หมวดเอกสารไม่ถูกต้อง (%/%)', v_cat, v_kind using errcode = '22023';
  end if;
  if p_expiry_date is not null and p_document_date is not null
     and p_expiry_date < p_document_date then
    raise exception 'วันที่หมดอายุต้องไม่น้อยกว่าวันที่ออกเอกสาร' using errcode = '22023';
  end if;

  -- เพิ่มใหม่
  if p_id is null then
    if v_path = '' or v_name = '' then
      raise exception 'กรุณาแนบไฟล์' using errcode = '22023';
    end if;
    insert into public.njhr_emp_files(
      employee_id, category, doc_kind, file_name, storage_path, mime_type, file_size,
      document_date, expiry_date, note, uploaded_by)
    values (p_employee, v_cat, v_kind, v_name, v_path,
            nullif(p_file->>'mime',''), nullif(p_file->>'size','')::bigint,
            p_document_date, p_expiry_date, nullif(btrim(coalesce(p_note,'')),''), c.username)
    returning njhr_emp_files.id, njhr_emp_files.version into v_id, v_ver;

    perform public.njhr_audit_write(p_token, 'EMPFILE_ADD', 'employee', 'njhr_emp_files',
      v_id::text, v_cat || '/' || v_kind || ' · ' || v_name, null,
      (select to_jsonb(x) from public.njhr_emp_files x where x.id = v_id), null);

    return query select v_id, v_ver;
    return;
  end if;

  -- แก้ไข / เปลี่ยนไฟล์
  select * into old from public.njhr_emp_files
   where njhr_emp_files.id = p_id and deleted_at is null;
  if not found then
    raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode = 'P0002';
  end if;
  if old.employee_id <> p_employee then
    raise exception 'เอกสารนี้ไม่ได้เป็นของพนักงานรายที่เลือก' using errcode = '42501';
  end if;

  if v_path <> '' and v_path <> old.storage_path then
    -- เก็บไฟล์เดิมไว้ในประวัติก่อนเสมอ (ไม่ทำลายของเดิม)
    insert into public.njhr_emp_file_versions(
      file_id, version, file_name, storage_path, mime_type, file_size, replaced_by)
    values (old.id, old.version, old.file_name, old.storage_path,
            old.mime_type, old.file_size, c.username);
    update public.njhr_emp_files
       set file_name = v_name, storage_path = v_path,
           mime_type = nullif(p_file->>'mime',''),
           file_size = nullif(p_file->>'size','')::bigint,
           version = old.version + 1,
           category = v_cat, doc_kind = v_kind,
           document_date = p_document_date, expiry_date = p_expiry_date,
           note = nullif(btrim(coalesce(p_note,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_emp_files.id = p_id;
  else
    update public.njhr_emp_files
       set category = v_cat, doc_kind = v_kind,
           document_date = p_document_date, expiry_date = p_expiry_date,
           note = nullif(btrim(coalesce(p_note,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_emp_files.id = p_id;
  end if;

  perform public.njhr_audit_write(p_token, 'EMPFILE_EDIT', 'employee', 'njhr_emp_files',
    p_id::text, v_cat || '/' || v_kind || ' · ' || coalesce(nullif(v_name,''), old.file_name),
    to_jsonb(old), (select to_jsonb(x) from public.njhr_emp_files x where x.id = p_id), null);

  return query select f.id, f.version from public.njhr_emp_files f where f.id = p_id;
end $$;


-- ─── 6) ลบเอกสาร (Soft Delete — SUPER_ADMIN เท่านั้น) ───────
create or replace function public.njhr_empfile_delete(
  p_token text, p_id uuid, p_reason text default null)
returns table (deleted boolean, file_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; f record; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into f from public.njhr_emp_files
   where njhr_emp_files.id = p_id and deleted_at is null;
  if not found then
    raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode = 'P0002';
  end if;

  select * into c from public.njhr_empfile_guard(p_token, f.employee_id, true);
  if not c.can_delete then
    raise exception 'เฉพาะ Super Admin เท่านั้นที่ลบเอกสารพนักงานได้' using errcode = '42501';
  end if;
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลการลบเอกสาร' using errcode = '22023';
  end if;

  update public.njhr_emp_files
     set deleted_at = now(), deleted_by = c.username, delete_reason = v_reason,
         updated_at = now(), updated_by = c.username
   where njhr_emp_files.id = p_id;

  -- ไฟล์จริงใน Storage ไม่ถูกทำลาย เพื่อให้ตรวจย้อนหลังได้
  perform public.njhr_audit_write(p_token, 'EMPFILE_DELETE', 'employee', 'njhr_emp_files',
    p_id::text, f.category || '/' || f.doc_kind || ' · ' || f.file_name ||
    ' · เหตุผล: ' || v_reason, to_jsonb(f),
    (select to_jsonb(x) from public.njhr_emp_files x where x.id = p_id), null);

  return query select true, f.file_name;
end $$;


-- ─── 7) ขออนุญาตเข้าถึงไฟล์ (Edge Function เรียกด้วย service_role) ──
--  ตรวจสิทธิ์จาก token จริงทุกครั้ง แล้วคืน path ให้ไปออก Signed URL
create or replace function public.njhr_empfile_access(p_token text, p_id uuid)
returns table (storage_path text, file_name text, mime_type text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; f record;
begin
  select * into f from public.njhr_emp_files
   where njhr_emp_files.id = p_id and deleted_at is null;
  if not found then
    raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode = 'P0002';
  end if;

  select * into c from public.njhr_empfile_guard(p_token, f.employee_id, false);

  perform public.njhr_audit_write(p_token, 'EMPFILE_VIEW', 'employee', 'njhr_emp_files',
    p_id::text, f.category || '/' || f.doc_kind || ' · ' || f.file_name, null, null, null);

  return query select f.storage_path, f.file_name, coalesce(f.mime_type,'application/octet-stream');
end $$;


-- ─── 8) ขออนุญาตอัปโหลด (Edge Function เรียกด้วย service_role) ─────
--  คืน path ที่อนุญาตให้เขียนได้ · ผู้ที่ไม่มีสิทธิ์เขียนจะ raise ตั้งแต่ guard
create or replace function public.njhr_empfile_upload_path(
  p_token text, p_employee uuid, p_category text, p_doc_kind text, p_file_name text)
returns table (storage_path text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_cat text := upper(btrim(coalesce(p_category,'')));
        v_kind text := upper(btrim(coalesce(p_doc_kind,'')));
        v_ext text; v_stem text;
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, true);
  if not public.njhr_empfile_kind_ok(v_cat, v_kind) then
    raise exception 'หมวดเอกสารไม่ถูกต้อง (%/%)', v_cat, v_kind using errcode = '22023';
  end if;
  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode = 'P0002';
  end if;

  v_ext  := lower(coalesce((regexp_match(coalesce(p_file_name,''), '(\.[A-Za-z0-9]{1,8})$'))[1], ''));
  v_stem := left(regexp_replace(regexp_replace(coalesce(p_file_name,'file'), '\.[^.]*$', ''),
                                '[^A-Za-z0-9ก-๙_-]+', '_', 'g'), 40);
  if btrim(coalesce(v_stem,'')) = '' then v_stem := 'file'; end if;

  return query select p_employee::text || '/' || lower(v_cat) || '/' || lower(v_kind) || '/' ||
                      to_char(now() at time zone 'Asia/Bangkok', 'YYYYMMDDHH24MISS') || '-' ||
                      replace(gen_random_uuid()::text, '-', '') || '-' || v_stem || v_ext;
end $$;


-- ─── 9) Storage bucket (private 100% — ไม่มี policy ให้ anon) ──────
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'ไม่พบ storage.buckets — สร้าง bucket เองที่ Dashboard ชื่อ njhr-emp-files แบบ private';
    return;
  end if;
  insert into storage.buckets (id, name, public)
       values ('njhr-emp-files', 'njhr-emp-files', false)
  on conflict (id) do update set public = false;
  raise notice 'bucket njhr-emp-files พร้อมใช้งาน (private)';
exception when others then
  raise notice 'สร้าง bucket ไม่สำเร็จ (%) — สร้างเองที่ Dashboard ชื่อ njhr-emp-files แบบ private', sqlerrm;
end $$;


-- ─── 10) GRANT ──────────────────────────────────────────────
--  เฉพาะ RPC ที่เบราว์เซอร์เรียกตรง · ส่วน access/upload_path ให้ service_role เท่านั้น
grant execute on function public.njhr_empfile_list(text,uuid)                        to anon, authenticated;
grant execute on function public.njhr_empfile_save(text,uuid,text,text,jsonb,uuid,date,date,text)
                                                                                     to anon, authenticated;
grant execute on function public.njhr_empfile_delete(text,uuid,text)                 to anon, authenticated;

-- ปิดสิทธิ์เริ่มต้นของ PUBLIC ก่อน มิฉะนั้น anon จะยังเรียกได้ผ่าน PostgREST
revoke execute on function public.njhr_empfile_access(text,uuid)                    from public;
revoke execute on function public.njhr_empfile_upload_path(text,uuid,text,text,text) from public;
revoke execute on function public.njhr_empfile_access(text,uuid)                    from anon, authenticated;
revoke execute on function public.njhr_empfile_upload_path(text,uuid,text,text,text) from anon, authenticated;
grant  execute on function public.njhr_empfile_access(text,uuid)                      to service_role;
grant  execute on function public.njhr_empfile_upload_path(text,uuid,text,text,text)  to service_role;

insert into public.njhr_schema_version(version, note)
values ('v11.9-emp-files', 'แฟ้มไฟล์แนบรายบุคคล: 2 หมวด 16 ประเภท + Private Storage ผ่าน Edge Function')
on conflict (version) do nothing;


-- ─── 11) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'table_files',     to_regclass('public.njhr_emp_files')         is not null,
  'table_versions',  to_regclass('public.njhr_emp_file_versions') is not null,
  'bucket',          (select jsonb_build_object('id', id, 'public', public)
                        from storage.buckets where id = 'njhr-emp-files'),
  'bucket_policies', coalesce((select count(*) from pg_policies
                                where schemaname = 'storage' and tablename = 'objects'
                                  and qual like '%njhr-emp-files%'), 0),
  'functions',       (select jsonb_agg(p.proname order by p.proname)
                        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname like 'njhr\_empfile\_%'),
  'rows',            (select count(*) from public.njhr_emp_files)
)) as install_report;
