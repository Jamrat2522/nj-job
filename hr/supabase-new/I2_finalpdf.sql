-- ═══════════════════════════════════════════════════════════════════
--  I2_finalpdf.sql — Final PDF Backend (Migration)
--  Build: NJ HR V2
--
--  ทำ 11 อย่าง ไม่มีมากกว่านี้:
--    1) ALTER  เพิ่ม 6 คอลัมน์ final_pdf_* (nullable ทั้งหมด)
--    2) CHECK  constraint ของ final_pdf_status
--    3) CREATE bucket njhr-doc-pdf แบบ private (mime = application/pdf เท่านั้น)
--    4) REPLACE policy njhr_sig_no_public — ปิด public SELECT ของ 4 bucket กลุ่ม HR
--    5) CREATE njhr_doc_pdf_claim   — service_role · จองสิทธิ์สร้าง + คืน snapshot
--    6) CREATE njhr_doc_pdf_commit  — service_role · บันทึก path/hash/bytes ครั้งเดียว
--    7) CREATE njhr_doc_pdf_fail    — service_role · บันทึกความล้มเหลว + audit
--    8) CREATE njhr_doc_pdf_access  — service_role · ตรวจสิทธิ์แล้วคืน storage_path
--    9) CREATE njhr_doc_pdf_status  — client · ใช้ทำ Recovery / Retry
--   10) REPLACE njhr_empdoc_lock_guard — final_pdf_* เขียนได้ครั้งเดียว
--   11) REPLACE njhr_doc_respond   — ACKNOWLEDGE สำเร็จ → final_pdf_status = 'PENDING'
--
--  ข้อ 10–11 คัดลอกเนื้อในของจริงจาก DB (pg_get_functiondef เมื่อ 2026-08-08 06:02)
--  มาทั้งดุ้น แล้วเพิ่มเฉพาะบรรทัดที่จำเป็น
--
--  ยืนยันจาก I1 — ของที่มีอยู่แล้วจึงไม่สร้างซ้ำ:
--    · content_hash / content_hash_at / doc_hash / confirmation_text (H2) ครบ
--    · njhr_empfile_access = pattern การออก Signed URL ที่ Edge Function ใช้อยู่
--      (ACL = postgres | service_role เท่านั้น) → njhr_doc_pdf_access ทำตาม pattern เดียวกัน
--    · njhr_doc_event / njhr_audit_write ใช้ต่อ ไม่สร้าง Event table ใหม่
--    · ไม่มี pg_net / pg_cron → ใช้สถาปัตยกรรมแบบ (B) Frontend เรียก Edge Function
--
--  ไม่ทำ:
--    · ไม่สร้าง PDF ให้ REJECT (ข้อ 18 ของ PROMPT 3)
--    · ไม่ backfill เอกสารเดิม (I1 ยืนยัน acked_or_signed = 0)
--    · ไม่แตะ bucket ของแอปอื่น · ไม่แตะ policy อื่นทั้ง 24 ตัว
--    · ไม่แตะ Attendance / Login / Leave / OT / Payroll / Reports
--    · ไม่ DROP function ใด ๆ
--
--  รันทั้งไฟล์ครั้งเดียว · idempotent · statement สุดท้ายคืน JSON ตรวจสอบ
-- ═══════════════════════════════════════════════════════════════════


-- ─── PREFLIGHT ─────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_emp_documents'
                    and column_name='content_hash') then
    raise exception 'PREFLIGHT: ไม่พบ content_hash — ต้องรัน H2_hrdocs.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_emp_doc_acks'
                    and column_name='confirmation_text') then
    raise exception 'PREFLIGHT: ไม่พบ confirmation_text — ต้องรัน H2_hrdocs.sql ก่อน';
  end if;
  if to_regprocedure('public.njhr_ctx(text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx';
  end if;
  if to_regprocedure('public.njhr_doc_event(uuid,text,text,text,text,jsonb)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_event';
  end if;
  if to_regclass('storage.buckets') is null then
    raise exception 'PREFLIGHT: ไม่พบ storage.buckets';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ═══ 1) คอลัมน์ Final PDF ═══════════════════════════════════════
--   nullable ทั้งหมด ไม่มี default ที่เปลี่ยนข้อมูลเดิม
--   I1 ยืนยัน acked_or_signed = 0 → เอกสารเดิม 18 ฉบับไม่ต้อง backfill
alter table public.njhr_emp_documents add column if not exists final_pdf_status text;
alter table public.njhr_emp_documents add column if not exists final_pdf_path   text;
alter table public.njhr_emp_documents add column if not exists final_pdf_hash   text;
alter table public.njhr_emp_documents add column if not exists final_pdf_bytes  bigint;
alter table public.njhr_emp_documents add column if not exists final_pdf_at     timestamptz;
alter table public.njhr_emp_documents add column if not exists final_pdf_error  text;

comment on column public.njhr_emp_documents.final_pdf_status is
  'NULL = ยังไม่ถึงขั้นสร้าง · PENDING = รอ Edge Function · READY = สร้างแล้ว · FAILED = สร้างไม่สำเร็จ';
comment on column public.njhr_emp_documents.final_pdf_hash is
  'SHA-256 hex ของ bytes ไฟล์ PDF จริง — คำนวณฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามรับจาก client';


-- ═══ 2) CHECK constraint ของสถานะ ══════════════════════════════
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'njhr_empdoc_pdfstatus_chk') then
    alter table public.njhr_emp_documents
      add constraint njhr_empdoc_pdfstatus_chk
      check (final_pdf_status is null or final_pdf_status in ('PENDING','READY','FAILED'));
  end if;
  -- READY ต้องมี path + hash ครบเสมอ (กันสถานะหลอกว่าพร้อมแต่ไม่มีไฟล์)
  if not exists (select 1 from pg_constraint where conname = 'njhr_empdoc_pdfready_chk') then
    alter table public.njhr_emp_documents
      add constraint njhr_empdoc_pdfready_chk
      check (final_pdf_status is distinct from 'READY'
             or (final_pdf_path is not null and final_pdf_hash is not null));
  end if;
end $$;

create index if not exists njhr_empdoc_pdf_pending_idx
  on public.njhr_emp_documents (final_pdf_status, responded_at desc)
  where final_pdf_status in ('PENDING','FAILED');


-- ═══ 3) Bucket njhr-doc-pdf (private 100%) ═════════════════════
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('njhr-doc-pdf', 'njhr-doc-pdf', false, 20971520, array['application/pdf'])
  on conflict (id) do nothing;
  raise notice 'bucket njhr-doc-pdf พร้อมใช้งาน (private · เฉพาะ application/pdf · ไม่เกิน 20 MB)';
exception when others then
  raise notice 'สร้าง bucket ไม่สำเร็จ (%) — สร้างเองที่ Dashboard ชื่อ njhr-doc-pdf แบบ private', sqlerrm;
end $$;


-- ═══ 4) ปิด public SELECT ของ 4 bucket กลุ่ม HR ════════════════
--   policy เดิม (จับจาก I1 · D2_sig_no_public):
--     name: njhr_sig_no_public · cmd: SELECT · roles: {public} · PERMISSIVE
--     using: (bucket_id <> 'njhr-signatures'::text)
--
--   ปัญหา: ชื่อสื่อว่า "กัน njhr-signatures" แต่ผลจริงคือ
--          เปิด SELECT ให้ทุก bucket ยกเว้นตัวเดียว → njhr-emp-files / njhr-face
--          / njhr-doc-pdf ที่กำลังจะสร้าง จะถูก public อ่านได้ทันที
--
--   ตรวจแล้วว่า policy อื่นทั้ง 24 ตัวบน storage.objects ผูกกับ bucket เฉพาะของแอปอื่น
--   ไม่มีตัวใดครอบ 4 bucket นี้ (face-scans ≠ njhr-face · signature ≠ njhr-signatures)
--   จึงแก้ที่ policy เดียวนี้พอ และ behavior ของ bucket อื่นไม่เปลี่ยนแม้แต่ตัวเดียว
do $$
begin
  if exists (select 1 from pg_policies
              where schemaname = 'storage' and tablename = 'objects'
                and policyname = 'njhr_sig_no_public') then
    execute $q$
      alter policy njhr_sig_no_public on storage.objects
        using (bucket_id <> all (array['njhr-signatures','njhr-doc-pdf',
                                       'njhr-emp-files','njhr-face']))
    $q$;
    raise notice 'แก้ policy njhr_sig_no_public — ปิด public SELECT ของ 4 bucket กลุ่ม HR';
  else
    raise notice 'ไม่พบ policy njhr_sig_no_public — ข้ามขั้นนี้ (ตรวจด้วยมือที่ Dashboard)';
  end if;
end $$;


-- ═══ 5) njhr_doc_pdf_claim — จองสิทธิ์สร้าง + คืน Snapshot ═════
--   เรียกจาก Edge Function ด้วย service_role · ส่ง token ของผู้ใช้จริงมาเพื่อตรวจสิทธิ์และ audit
--   Atomic: ล็อกแถวด้วย FOR UPDATE กันสองคำสั่งสร้างพร้อมกัน
--   READY แล้ว → คืน already_ready = true ไม่สร้างซ้ำ (Idempotent ตามข้อ 28)
--   คืน Snapshot ทั้งหมดที่ PDF ต้องใช้ — มาจาก DB ล้วน ไม่ใช้ข้อมูลพนักงานปัจจุบัน
create or replace function public.njhr_doc_pdf_claim(p_token text, p_id uuid)
returns table (claimed boolean, already_ready boolean, data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; a record; o record; v_mgr boolean;
begin
  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');

  select * into d from public.njhr_emp_documents where id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;

  -- เจ้าของเอกสาร หรือผู้มีสิทธิ์บริหารเท่านั้น
  if not v_mgr and d.employee_id is distinct from c.employee_id then
    raise exception 'ดำเนินการได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
  end if;

  -- สร้างได้เฉพาะเอกสารที่รับทราบ/ลงนามสำเร็จแล้ว (ข้อ 6 ของ PROMPT 3)
  if d.status not in ('ACKNOWLEDGED','SIGNED') then
    raise exception 'สร้าง Final PDF ได้เฉพาะเอกสารที่รับทราบ/ลงนามแล้ว (สถานะปัจจุบัน %)', d.status
      using errcode = '22023';
  end if;

  -- READY แล้ว = ไม่สร้างซ้ำ ไม่ overwrite
  if d.final_pdf_status = 'READY' and d.final_pdf_path is not null then
    return query select false, true, jsonb_build_object(
      'id', d.id, 'final_pdf_path', d.final_pdf_path, 'final_pdf_hash', d.final_pdf_hash);
    return;
  end if;

  select * into a from public.njhr_emp_doc_acks
   where document_id = p_id order by acked_at desc limit 1;
  if not found then
    raise exception 'ไม่พบหลักฐานการรับทราบ/ลงนามของเอกสารนี้' using errcode = 'P0002';
  end if;

  select * into o from public.njhr_org_profile where id = 1;

  update public.njhr_emp_documents
     set final_pdf_status = 'PENDING', final_pdf_error = null
   where njhr_emp_documents.id = p_id;

  perform public.njhr_doc_event(p_id, 'FINAL_PDF_CLAIM', c.username, c.role,
    'เริ่มสร้าง Final PDF', null);

  return query select true, false, jsonb_build_object(
    -- ---- Snapshot ของเอกสาร (ห้ามดึงข้อมูลพนักงานปัจจุบันมาแทน) ----
    'doc', jsonb_build_object(
      'id', d.id, 'doc_no', d.doc_no, 'version', d.version, 'doc_type', d.doc_type,
      'title', d.title, 'body', d.body,
      'effective_date', d.effective_date, 'issued_at', d.issued_at,
      'requires_signature', d.requires_signature, 'status', d.status,
      'emp_code_snap', coalesce(d.emp_code_snap,''),
      'emp_name_snap', coalesce(d.emp_name_snap,''),
      'dept_snap', coalesce(d.dept_snap,''),
      'position_snap', coalesce(d.position_snap,''),
      'doc_meta', d.doc_meta,
      'content_hash', d.content_hash,
      'sent_at', d.sent_at, 'responded_at', d.responded_at, 'locked_at', d.locked_at),
    -- ---- หลักฐานการรับทราบ/ลงนาม (เวลาจาก Server เท่านั้น) ----
    'ack', jsonb_build_object(
      'action', a.action, 'emp_code', coalesce(a.emp_code,''),
      'emp_name', coalesce(a.emp_name,''), 'department', coalesce(a.department,''),
      'acked_at', a.acked_at,
      'acked_at_th', to_char(a.acked_at at time zone 'Asia/Bangkok', 'DD/MM/') ||
                     (extract(year from (a.acked_at at time zone 'Asia/Bangkok'))::int + 543)::text ||
                     to_char(a.acked_at at time zone 'Asia/Bangkok', ' HH24:MI'),
      'doc_version', a.doc_version,
      'doc_hash', coalesce(a.doc_hash,''),
      'confirmation_text', coalesce(a.confirmation_text,''),
      'channel', coalesce(a.channel,''), 'device', coalesce(a.device,'')),
      -- หมายเหตุ: ไม่คืน ip_address / user_agent / signature_path ออกไปสร้าง PDF
      --           และไม่มี password / token ใด ๆ ตามข้อ 25
    'org', coalesce(to_jsonb(o), '{}'::jsonb),
    -- ---- ตรวจความสอดคล้องของ Hash (ข้อ 11) ----
    'hash_match', (a.doc_hash is not distinct from d.content_hash),
    -- ---- ชื่อไฟล์ที่กำหนดฝั่งเซิร์ฟเวอร์ (client กำหนดเองไม่ได้) ----
    'storage_path', d.employee_id::text || '/' ||
      regexp_replace(d.doc_no, '[^A-Za-z0-9_-]+', '_', 'g') || '/v' || d.version::text || '/' ||
      regexp_replace(d.doc_no, '[^A-Za-z0-9_-]+', '_', 'g') || '_v' || d.version::text || '_' ||
      case when a.action = 'SIGN' then 'signed' else 'acknowledged' end || '.pdf');
end $$;

comment on function public.njhr_doc_pdf_claim(text, uuid) is
  'Final PDF: จองสิทธิ์สร้าง + คืน Snapshot — เรียกจาก Edge Function ด้วย service_role เท่านั้น';


-- ═══ 6) njhr_doc_pdf_commit — บันทึกผลสำเร็จ (ครั้งเดียว) ═══════
create or replace function public.njhr_doc_pdf_commit(
  p_token text, p_id uuid, p_path text, p_hash text, p_bytes bigint)
returns table (ok boolean, final_pdf_path text, final_pdf_hash text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
        v_path text := btrim(coalesce(p_path,''));
        v_hash text := lower(btrim(coalesce(p_hash,'')));
begin
  select * into c from public.njhr_ctx(p_token);

  if v_path = '' then raise exception 'ไม่ได้ระบุ storage path' using errcode = '22023'; end if;
  if v_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'final_pdf_hash ต้องเป็น SHA-256 hex 64 ตัว' using errcode = '22023';
  end if;
  if coalesce(p_bytes, 0) <= 0 then
    raise exception 'ขนาดไฟล์ไม่ถูกต้อง' using errcode = '22023';
  end if;

  select * into d from public.njhr_emp_documents where id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;
  if d.status not in ('ACKNOWLEDGED','SIGNED') then
    raise exception 'บันทึก Final PDF ได้เฉพาะเอกสารที่รับทราบ/ลงนามแล้ว' using errcode = '22023';
  end if;
  -- เขียนได้ครั้งเดียวตลอดอายุของ Version นั้น (ข้อ 16)
  if d.final_pdf_path is not null then
    raise exception 'Final PDF ของฉบับนี้ถูกบันทึกไว้แล้ว เขียนทับไม่ได้' using errcode = '42501';
  end if;

  update public.njhr_emp_documents
     set final_pdf_status = 'READY', final_pdf_path = v_path, final_pdf_hash = v_hash,
         final_pdf_bytes = p_bytes, final_pdf_at = now(), final_pdf_error = null
   where njhr_emp_documents.id = p_id;

  perform public.njhr_doc_event(p_id, 'FINAL_PDF_CREATED', c.username, c.role,
    'สร้าง Final PDF สำเร็จ · ' || p_bytes::text || ' bytes · sha256 ' || left(v_hash, 16) || '…', null);
  perform public.njhr_audit_write(p_token, 'FINAL_PDF_CREATED', 'document',
    'njhr_emp_documents', p_id::text,
    d.doc_no || ' v' || d.version::text || ' → Final PDF READY', null, null, null);

  return query select true, x.final_pdf_path, x.final_pdf_hash
    from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ═══ 7) njhr_doc_pdf_fail — บันทึกความล้มเหลว + audit ═══════════
--   ไม่มีสถานะเงียบ: ACK สำเร็จแต่ PDF พัง จะเห็นเป็น FAILED เสมอ และ Retry ได้
create or replace function public.njhr_doc_pdf_fail(p_token text, p_id uuid, p_error text)
returns table (ok boolean, final_pdf_status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; v_err text := left(coalesce(btrim(p_error),'ไม่ทราบสาเหตุ'), 500);
begin
  select * into c from public.njhr_ctx(p_token);
  select * into d from public.njhr_emp_documents where id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;
  -- READY แล้วห้ามถอยกลับเป็น FAILED
  if d.final_pdf_status = 'READY' then
    raise exception 'Final PDF ของฉบับนี้สร้างสำเร็จแล้ว' using errcode = '42501';
  end if;

  update public.njhr_emp_documents
     set final_pdf_status = 'FAILED', final_pdf_error = v_err
   where njhr_emp_documents.id = p_id;

  perform public.njhr_doc_event(p_id, 'FINAL_PDF_FAILED', c.username, c.role, v_err, null);
  perform public.njhr_audit_write(p_token, 'FINAL_PDF_FAILED', 'document',
    'njhr_emp_documents', p_id::text, d.doc_no || ' — ' || v_err, null, null, null);

  return query select true, x.final_pdf_status from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ═══ 8) njhr_doc_pdf_access — ตรวจสิทธิ์แล้วคืน storage_path ════
--   ทำตาม pattern เดียวกับ njhr_empfile_access ทุกประการ
--   (service_role เท่านั้น · Edge Function เป็นผู้ออก Signed URL อายุสั้น)
--   USER เปิดของคนอื่นไม่ได้ เพราะ employee_id มาจาก token ไม่ใช่จาก client
create or replace function public.njhr_doc_pdf_access(p_token text, p_id uuid)
returns table (storage_path text, file_name text, mime_type text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; v_mgr boolean;
begin
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;
  if d.final_pdf_status is distinct from 'READY' or d.final_pdf_path is null then
    raise exception 'Final PDF ของเอกสารฉบับนี้ยังไม่พร้อมใช้งาน' using errcode = 'P0002';
  end if;

  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');
  if not v_mgr and d.employee_id is distinct from c.employee_id then
    raise exception 'คุณดาวน์โหลดได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
  end if;

  perform public.njhr_doc_event(p_id, 'FINAL_PDF_DOWNLOADED', c.username, c.role,
    d.doc_no || ' v' || d.version::text, null);

  return query select d.final_pdf_path,
    regexp_replace(d.doc_no, '[^A-Za-z0-9_-]+', '_', 'g') || '_v' || d.version::text || '.pdf',
    'application/pdf'::text;
end $$;


-- ═══ 9) njhr_doc_pdf_status — สำหรับหน้าจอ (Recovery / Retry) ═══
--   เปิดให้ client เรียก · คืนเฉพาะสถานะ ไม่คืน path เพื่อกันเดา path
create or replace function public.njhr_doc_pdf_status(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; v_mgr boolean;
begin
  select * into d from public.njhr_emp_documents where id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;

  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');
  if not v_mgr and d.employee_id is distinct from c.employee_id then
    raise exception 'ดูได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
  end if;

  return query select jsonb_build_object(
    'id', d.id, 'doc_no', d.doc_no, 'version', d.version, 'status', d.status,
    'final_pdf_status', d.final_pdf_status,
    'final_pdf_at', d.final_pdf_at,
    'final_pdf_bytes', d.final_pdf_bytes,
    'final_pdf_hash', d.final_pdf_hash,
    'final_pdf_error', case when v_mgr then d.final_pdf_error else null end,
    -- ควรสั่งสร้างได้ไหม: ตอบแล้วแต่ PDF ยังไม่พร้อม
    'can_generate', (d.status in ('ACKNOWLEDGED','SIGNED')
                     and coalesce(d.final_pdf_status,'') <> 'READY'),
    'can_download', (d.final_pdf_status = 'READY' and d.final_pdf_path is not null));
end $$;


-- ═══ 10) njhr_empdoc_lock_guard — final_pdf_* เขียนได้ครั้งเดียว ═
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · เพิ่มด่านที่ 4 เท่านั้น
--   ด่าน 1–3 (locked_at · sent_at · content_hash) เหมือนเดิมทุกบรรทัด
create or replace function public.njhr_empdoc_lock_guard()
returns trigger language plpgsql as $$
declare v_core boolean;
begin
  -- สาระสำคัญของเอกสาร = สิ่งที่ทำให้ฉบับที่พนักงานเห็นเปลี่ยนความหมาย
  v_core := (new.title              is distinct from old.title
          or new.body               is distinct from old.body
          or new.doc_type           is distinct from old.doc_type
          or new.employee_id        is distinct from old.employee_id
          or new.effective_date     is distinct from old.effective_date
          or new.version            is distinct from old.version
          or new.doc_no             is distinct from old.doc_no
          or new.requires_signature is distinct from old.requires_signature
          or new.doc_meta           is distinct from old.doc_meta
          or new.emp_code_snap      is distinct from old.emp_code_snap
          or new.emp_name_snap      is distinct from old.emp_name_snap);

  -- (1) ฉบับที่รับทราบ/ลงนามแล้ว แก้เนื้อหาไม่ได้ ต้องออกเวอร์ชันใหม่เท่านั้น
  if old.locked_at is not null and v_core then
    raise exception 'เอกสารฉบับนี้ถูกล็อกแล้ว (รับทราบ/ลงนามเมื่อ %) แก้ไขไม่ได้ — ต้องออกฉบับใหม่แทน',
      to_char(old.locked_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI')
      using errcode='42501';
  end if;

  -- (2) ส่งให้พนักงานแล้ว แม้ยังไม่รับทราบ ก็ห้ามแก้สาระสำคัญ
  if old.sent_at is not null and v_core then
    raise exception 'เอกสารฉบับนี้ส่งให้พนักงานแล้วเมื่อ % — แก้สาระสำคัญไม่ได้ ต้องออกฉบับใหม่แทน',
      to_char(old.sent_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI')
      using errcode='42501';
  end if;

  -- (3) content_hash เขียนได้ครั้งเดียวตลอดอายุของ Version นั้น
  if old.content_hash is not null
     and new.content_hash is distinct from old.content_hash then
    raise exception 'Document Hash ของฉบับนี้ถูกตรึงไว้แล้ว เปลี่ยนไม่ได้ — ต้องออกฉบับใหม่แทน'
      using errcode='42501';
  end if;

  -- (4) ⭐ เพิ่มใหม่: Final PDF เขียนได้ครั้งเดียว ห้าม overwrite แม้ SUPER_ADMIN
  if old.final_pdf_path is not null
     and (new.final_pdf_path  is distinct from old.final_pdf_path
       or new.final_pdf_hash  is distinct from old.final_pdf_hash
       or new.final_pdf_bytes is distinct from old.final_pdf_bytes
       or new.final_pdf_at    is distinct from old.final_pdf_at) then
    raise exception 'Final PDF ของฉบับนี้ถูกบันทึกไว้แล้ว (%) แก้/ลบ/เขียนทับไม่ได้ — ต้องออกฉบับใหม่แทน',
      to_char(old.final_pdf_at at time zone 'Asia/Bangkok','DD/MM/YYYY HH24:MI')
      using errcode='42501';
  end if;
  -- READY แล้วห้ามถอยสถานะกลับ
  if old.final_pdf_status = 'READY' and new.final_pdf_status is distinct from 'READY' then
    raise exception 'Final PDF ของฉบับนี้พร้อมใช้งานแล้ว เปลี่ยนสถานะกลับไม่ได้' using errcode='42501';
  end if;

  new.updated_at := now();
  return new;
end $$;


-- ═══ 11) njhr_doc_respond — ACKNOWLEDGE สำเร็จ → PENDING ════════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · เพิ่ม final_pdf_status ในคำสั่ง UPDATE เดิม
--   อยู่ในทรานแซกชันเดียวกับ ACK → ไม่มีทางที่ ACK สำเร็จแล้ว PDF ไม่ถูกคิวไว้
--   REJECT ไม่ตั้ง PENDING (ข้อ 18 — ไม่สร้าง Signed PDF ให้การปฏิเสธ)
create or replace function public.njhr_doc_respond(
  p_token text, p_id uuid, p_action text, p_password text,
  p_ctx jsonb default null, p_reason text default null,
  p_signature_path text default null)
returns table (id uuid, status text, responded_at timestamptz)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; u record; a text := upper(btrim(coalesce(p_action,'')));
        v_new text; v_ok boolean := false; v_confirm text; v_act text;
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
    locked_at = case when a = 'ACKNOWLEDGE' then now() else locked_at end,
    -- ⭐ เพิ่มใหม่: เข้าคิวสร้าง Final PDF ทันทีในทรานแซกชันเดียวกับ ACK
    --    REJECT ไม่ตั้งค่า จึงไม่มี Final PDF ให้การปฏิเสธ
    final_pdf_status = case when a = 'ACKNOWLEDGE' then 'PENDING' else final_pdf_status end
   where njhr_emp_documents.id = p_id;

  if a = 'ACKNOWLEDGE' then
    v_act := case when d.requires_signature then 'SIGN' else 'ACKNOWLEDGE' end;
    -- ⭐ ข้อความยืนยันมาจาก DB ไม่ใช่จาก client
    v_confirm := public.njhr_doc_confirm_text(d.doc_type, d.requires_signature, 'ACKNOWLEDGE');
    insert into public.njhr_emp_doc_acks (
      document_id, employee_id, emp_code, emp_name, department, action,
      channel, ip_address, user_agent, device, signature_path, doc_version, acked_by,
      doc_hash, confirmation_text)
    values (p_id, d.employee_id, d.emp_code_snap, d.emp_name_snap, d.dept_snap, v_act,
      nullif(btrim(coalesce(p_ctx->>'channel','')),''),
      nullif(btrim(coalesce(p_ctx->>'ip','')),''),
      left(nullif(btrim(coalesce(p_ctx->>'user_agent','')),''), 400),
      nullif(btrim(coalesce(p_ctx->>'device','')),''),
      p_signature_path, d.version, c.username,
      d.content_hash, v_confirm)                      -- ⭐ สำเนา hash ที่ตรึงตอน SEND
    on conflict (document_id, employee_id) do nothing;
  end if;

  perform public.njhr_doc_event(p_id, a, c.username, c.role,
    case when a = 'REJECT' then btrim(p_reason) else 'ยืนยันตัวตนสำเร็จและกดรับทราบ' end, p_ctx);
  perform public.njhr_audit_write(p_token, 'DOC_' || a, 'document', 'njhr_emp_documents', p_id::text,
    d.doc_no || ' → ' || v_new, to_jsonb(d),
    (select to_jsonb(x) from public.njhr_emp_documents x where x.id = p_id), null);

  return query select x.id, x.status, x.responded_at from public.njhr_emp_documents x where x.id = p_id;
end $$;


-- ═══ 12) GRANT / REVOKE ════════════════════════════════════════
--   claim / commit / fail / access → service_role เท่านั้น (Edge Function)
--   แนวเดียวกับ njhr_empfile_access · njhr_empfile_upload_path ที่มีอยู่เดิม
revoke all on function public.njhr_doc_pdf_claim(text, uuid)                       from public, anon, authenticated;
revoke all on function public.njhr_doc_pdf_commit(text, uuid, text, text, bigint)  from public, anon, authenticated;
revoke all on function public.njhr_doc_pdf_fail(text, uuid, text)                  from public, anon, authenticated;
revoke all on function public.njhr_doc_pdf_access(text, uuid)                      from public, anon, authenticated;
--   status → เปิดให้หน้าจอเรียก (คืนเฉพาะสถานะ ไม่คืน path)
grant execute on function public.njhr_doc_pdf_status(text, uuid) to anon, authenticated;


-- ═══ ROLLBACK (ไม่รันอัตโนมัติ — คัดลอกไปรันเองเมื่อจำเป็น) ═════
-- drop function if exists public.njhr_doc_pdf_status(text, uuid);
-- drop function if exists public.njhr_doc_pdf_access(text, uuid);
-- drop function if exists public.njhr_doc_pdf_fail(text, uuid, text);
-- drop function if exists public.njhr_doc_pdf_commit(text, uuid, text, text, bigint);
-- drop function if exists public.njhr_doc_pdf_claim(text, uuid);
-- alter table public.njhr_emp_documents drop constraint if exists njhr_empdoc_pdfready_chk;
-- alter table public.njhr_emp_documents drop constraint if exists njhr_empdoc_pdfstatus_chk;
-- drop index if exists public.njhr_empdoc_pdf_pending_idx;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_error;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_at;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_bytes;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_hash;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_path;
-- alter table public.njhr_emp_documents drop column if exists final_pdf_status;
-- คืน policy เดิม:
--   alter policy njhr_sig_no_public on storage.objects
--     using (bucket_id <> 'njhr-signatures'::text);
-- คืน njhr_doc_respond / njhr_empdoc_lock_guard: รัน H2_hrdocs.sql ข้อ 4 และ 7 ใหม่


-- ═══ VERIFICATION — statement สุดท้าย คืน JSON ก้อนเดียว ═══════
select jsonb_pretty(jsonb_build_object(

  '1_new_columns', (
    select coalesce(jsonb_object_agg(column_name::text,
             '✅ ' || data_type::text || ' · nullable=' || is_nullable::text), '{}'::jsonb)
      from information_schema.columns
     where table_schema = 'public' and table_name = 'njhr_emp_documents'
       and column_name like 'final\_pdf\_%'),

  '2_constraints', (
    select coalesce(jsonb_object_agg(con.conname::text, pg_get_constraintdef(con.oid)), '{}'::jsonb)
      from pg_constraint con join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
     where n.nspname = 'public' and rel.relname = 'njhr_emp_documents'
       and con.conname in ('njhr_empdoc_pdfstatus_chk','njhr_empdoc_pdfready_chk')),

  '3_bucket', coalesce((
    select jsonb_build_object('id', b.id, 'public', b.public,
             'size_limit', b.file_size_limit, 'mime', to_jsonb(b.allowed_mime_types),
             'verdict', case when b.public then '❌ FAIL — ต้องเป็น private' else '✅ private' end)
      from storage.buckets b where b.id = 'njhr-doc-pdf'),
    jsonb_build_object('verdict','❌ ไม่พบ bucket — สร้างเองที่ Dashboard')),

  '4_policy_fixed', coalesce((
    select jsonb_build_object('using', qual, 'roles', roles::text, 'cmd', cmd,
             'verdict', case when qual like '%njhr-doc-pdf%' and qual like '%njhr-emp-files%'
                              and qual like '%njhr-face%' and qual like '%njhr-signatures%'
                             then '✅ ปิดครบทั้ง 4 bucket' else '❌ ยังไม่ครบ' end)
      from pg_policies where schemaname='storage' and tablename='objects'
       and policyname = 'njhr_sig_no_public'),
    jsonb_build_object('verdict','⚠ ไม่พบ policy')),

  '4b_public_readable_now', (
    select coalesce(jsonb_agg(b.id order by b.id), '[]'::jsonb)
      from storage.buckets b
     where b.id in ('njhr-doc-pdf','njhr-emp-files','njhr-face','njhr-signatures')
       and exists (select 1 from pg_policies p
                    where p.schemaname='storage' and p.tablename='objects'
                      and p.cmd in ('SELECT','ALL')
                      and (p.roles::text like '%public%' or p.roles::text like '%anon%')
                      and (p.qual like '%= ''' || b.id || '''%'
                        or (p.qual like '%<> ALL%' and p.qual not like '%' || b.id || '%')
                        or (p.qual like '%<> ''%' and p.qual not like '%' || b.id || '%')))),

  '5_new_functions', (
    select coalesce(jsonb_object_agg(p.proname::text,
             pg_get_function_identity_arguments(p.oid)), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'njhr\_doc\_pdf\_%'),

  '6_acl', (
    select coalesce(jsonb_object_agg(p.proname::text,
             case when has_function_privilege('anon', p.oid, 'EXECUTE')
                    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  then 'client เรียกได้' else 'service_role เท่านั้น' end), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'njhr\_doc\_pdf\_%'),

  '7_lock_guard', (
    select case when pg_get_functiondef(p.oid) like '%final_pdf_path%'
                 and pg_get_functiondef(p.oid) like '%old.content_hash%'
                 and pg_get_functiondef(p.oid) like '%old.sent_at%'
                then '✅ ครบ 4 ด่าน (locked · sent · content_hash · final_pdf)'
                else '❌ ยังไม่ครบ' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_empdoc_lock_guard' and p.prokind = 'f'),

  '8_respond_queues_pdf', (
    select case when pg_get_functiondef(p.oid) like '%final_pdf_status = case when a = ''ACKNOWLEDGE''%'
                then '✅ ACKNOWLEDGE ตั้ง PENDING · REJECT ไม่ตั้ง'
                else '❌ ยังไม่ได้แก้' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_doc_respond' and p.prokind = 'f'),

  '9_untouched', (
    select coalesce(jsonb_object_agg(p.proname::text,
             case when pg_get_functiondef(p.oid) like '%final_pdf%'
                  then '⚠ ถูกแก้โดยไม่ตั้งใจ' else '✅ ไม่ถูกแตะ' end), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname in ('njhr_doc_flow','njhr_doc_center_list','njhr_doc_detail',
                         'njhr_doc_save','njhr_docack_immutable_guard',
                         'njhr_att_punch','njhr_att_report','njhr_leave_submit','njhr_me_save')),

  '10_other_policies_intact', (
    select count(*)::int from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and policyname <> 'njhr_sig_no_public'),

  '11_data_untouched', (
    select jsonb_build_object(
      'documents_total', (select count(*) from public.njhr_emp_documents),
      'by_status', coalesce((select jsonb_object_agg(status, n)
                               from (select status, count(*) n
                                       from public.njhr_emp_documents group by status) s), '{}'::jsonb),
      'final_pdf_set', (select count(*) from public.njhr_emp_documents where final_pdf_path is not null),
      'acks_total', (select count(*) from public.njhr_emp_doc_acks),
      'events_total', (select count(*) from public.njhr_emp_doc_events),
      'expect', 'documents=18 · DRAFT=18 · final_pdf_set=0 · acks=0 · events=63')),

  'meta', jsonb_build_object('file','I2_finalpdf.sql','applied_at', now())
)) as result;
