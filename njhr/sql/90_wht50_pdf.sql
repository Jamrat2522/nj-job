-- ============================================================
-- NJ HR V2 — 90_wht50_pdf.sql  (ฉบับแก้ให้ตรง Production)
-- PDF Pipeline สำหรับ 50 ทวิ + แยก wht50_id / document_id ในหน้า Admin
--
-- ⚠⚠ ไฟล์นี้ยังไม่ได้รัน — ส่งมาให้ตรวจก่อนเท่านั้น ⚠⚠
--
-- แก้จากฉบับก่อนหน้าตามที่ตรวจพบว่าไม่ตรง Production
--   ✗ seq_in_form            → ✓ seq_no
--   ✗ final_pdf_size         → ✓ final_pdf_bytes
--   ✗ payer_mode / payer_mode_other / total_gpf → ตัดออก (Production ไม่มีคอลัมน์เหล่านี้)
--   ✗ c.user_id              → ✓ c.app_user_id       (njhr_ctx คืน app_user_id)
--   ✗ final_pdf_status = 'BUILDING' → ✓ 'PENDING'    (constraint อนุญาต PENDING/READY/FAILED)
--   ✗ RPC แยก njhr_wht50_pdf_* ที่ Edge Function ไม่ได้เรียก
--     → ✓ เพิ่ม branch WHT50 ใน njhr_doc_pdf_claim / _commit / _status เดิม
--   ✗ can_generate เป็นจริงเฉพาะ ACKNOWLEDGED/SIGNED → ✓ WHT50 ใช้ SENT/VIEWED
--       Edge Function จึงใช้ Pipeline เดียว ไม่มีสองระบบที่ไม่ต่อกัน
--
-- ⚠ ไฟล์นี้ CREATE OR REPLACE ฟังก์ชันกลาง 2 ตัว
--   เนื้อหาส่วนที่ไม่ใช่ WHT50 คัดลอกจาก I2_finalpdf.sql มาทั้งหมดโดยไม่แก้แม้แต่บรรทัดเดียว
--   เอกสาร CONTRACT / WARNING / COE / SALARY_CERT ฯลฯ จึงทำงานเหมือนเดิม 100%
--   ทางแยก WHT50 ถูกคั่นด้วยคอมเมนต์ ══════ ให้ตรวจง่าย
--
-- SQL เชื่อมที่ Production มีแล้ว — ไฟล์นี้ไม่แตะเลย
--   WHT50 ใน njhr_empdoc_type_chk · njhr_wht50.document_id · FK ·
--   njhr_wht50_send · Notification · njhr_wht50_opened_trg · njhr_wht50_sync_opened
--
-- เพิ่มในรอบนี้
--   · branch WHT50 ใน njhr_doc_pdf_status (can_generate)
--   · คอลัมน์ tax_payment_mode / tax_payment_mode_other + CHECK
--   · njhr_wht50_update รับ 2 คีย์ใหม่ (ตรวจ OTHER ต้องมีรายละเอียด)
--   · trigger บังคับให้ระบุวิธีออกภาษีก่อนเปลี่ยนสถานะเป็น CONFIRMED
--
-- ต้องรัน I2_finalpdf.sql · 67 · 87 · 88 · 89 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare v_def text;
begin
  if to_regclass('public.njhr_wht50') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_wht50 — ต้องรัน 87_wht50.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_wht50'
                    and column_name='document_id') then
    raise exception 'PREFLIGHT: njhr_wht50 ยังไม่มี document_id — ต้องรัน 89_wht50_deliver.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_wht50'
                    and column_name='seq_no') then
    raise exception 'PREFLIGHT: njhr_wht50 ไม่มีคอลัมน์ seq_no — โครงสร้างไม่ตรงกับที่คาดไว้ หยุดก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_emp_documents'
                    and column_name='final_pdf_bytes') then
    raise exception 'PREFLIGHT: njhr_emp_documents ไม่มี final_pdf_bytes — ต้องรัน I2_finalpdf.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_pdf_claim') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_pdf_claim — ต้องรัน I2_finalpdf.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_pdf_status') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_pdf_status — ต้องรัน I2_finalpdf.sql ก่อน';
  end if;
  /* กันแก้ทับของที่เปลี่ยนไปแล้ว: ถ้ามี branch WHT50 อยู่แล้วก็ยังรันซ้ำได้ ไม่เป็นไร */
  select pg_get_functiondef(p.oid) into v_def from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.proname='njhr_doc_pdf_claim' limit 1;
  if v_def is null then
    raise exception 'PREFLIGHT: อ่านนิยาม njhr_doc_pdf_claim ไม่ได้';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


begin;

-- ─── 1) njhr_doc_pdf_claim — เพิ่มทางแยก WHT50 ──────────────
create or replace function public.njhr_doc_pdf_claim(p_token text, p_id uuid)
returns table (claimed boolean, already_ready boolean, data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; a record; o record; w record; v_mgr boolean;
begin
  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');

  select * into d from public.njhr_emp_documents where id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode = 'P0002'; end if;

  -- เจ้าของเอกสาร หรือผู้มีสิทธิ์บริหารเท่านั้น
  if not v_mgr and d.employee_id is distinct from c.employee_id then
    raise exception 'ดำเนินการได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
  end if;

  -- READY แล้ว = ไม่สร้างซ้ำ ไม่ overwrite (ใช้ร่วมทุกประเภทเอกสาร)
  if d.final_pdf_status = 'READY' and d.final_pdf_path is not null then
    return query select false, true, jsonb_build_object(
      'id', d.id, 'final_pdf_path', d.final_pdf_path, 'final_pdf_hash', d.final_pdf_hash);
    return;
  end if;

  -- ══════════════ ทางแยก WHT50 (50 ทวิ) ══════════════
  -- 50 ทวิ เป็นเอกสารแจ้งให้ทราบ requires_signature = false และไม่มีแถวรับทราบ
  -- จึงไม่บังคับ ACKNOWLEDGED/SIGNED · Snapshot มาจาก njhr_wht50 ไม่ใช่ body
  -- เอกสารประเภทอื่นไม่เข้าทางนี้ และใช้เงื่อนไขเดิมทุกบรรทัดด้านล่าง
  if d.doc_type = 'WHT50' then
    select * into w from public.njhr_wht50 where document_id = p_id;
    if not found then
      raise exception 'เอกสารนี้ไม่ได้ผูกกับข้อมูล 50 ทวิ' using errcode = 'P0002';
    end if;
    if w.status <> 'CONFIRMED' then
      raise exception 'สร้าง Final PDF ได้เฉพาะ 50 ทวิ ที่ยืนยันแล้ว (สถานะปัจจุบัน %)', w.status
        using errcode = '22023';
    end if;

    update public.njhr_emp_documents
       set final_pdf_status = 'PENDING', final_pdf_error = null
     where njhr_emp_documents.id = p_id;

    perform public.njhr_doc_event(p_id, 'FINAL_PDF_CLAIM', c.username, c.role,
      'เริ่มสร้าง Final PDF (50 ทวิ)', null);

    return query select true, false, jsonb_build_object(
      'doc', jsonb_build_object(
        'id', d.id, 'doc_no', d.doc_no, 'version', d.version, 'doc_type', d.doc_type,
        'title', d.title, 'status', d.status,
        'emp_code_snap', coalesce(d.emp_code_snap,''),
        'emp_name_snap', coalesce(d.emp_name_snap,''),
        'doc_meta', d.doc_meta),
      'wht50', jsonb_build_object(
        'id', w.id, 'tax_year', w.tax_year,
        'doc_no', w.doc_no, 'book_no', w.book_no, 'seq_no', w.seq_no,
        'form_type', w.form_type, 'income_section', w.income_section,
        'payer_snapshot', w.payer_snapshot, 'payee_snapshot', w.payee_snapshot,
        'income_final', w.income_final,
        'total_income', w.total_income, 'total_tax', w.total_tax,
        'total_sso', w.total_sso, 'total_pvd', w.total_pvd,
        'issue_date', w.issue_date,
        'tax_payment_mode', w.tax_payment_mode,
        'tax_payment_mode_other', w.tax_payment_mode_other,
        'signer_name', w.signer_name, 'signer_position', w.signer_position,
        'amend_seq', w.amend_seq),
      'storage_path', 'wht50/' || w.tax_year::text || '/' || d.id::text || '.pdf',
      'hash_match', true);
    return;
  end if;
  -- ══════════════ จบทางแยก WHT50 ══════════════

  -- สร้างได้เฉพาะเอกสารที่รับทราบ/ลงนามสำเร็จแล้ว (ข้อ 6 ของ PROMPT 3)
  if d.status not in ('ACKNOWLEDGED','SIGNED') then
    raise exception 'สร้าง Final PDF ได้เฉพาะเอกสารที่รับทราบ/ลงนามแล้ว (สถานะปัจจุบัน %)', d.status
      using errcode = '22023';
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

-- ─── 2) njhr_doc_pdf_commit — เพิ่มทางแยก WHT50 ─────────────
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
  -- 50 ทวิ บันทึกได้ขณะ SENT / VIEWED โดยไม่ต้อง ACK/SIGN
  -- เอกสารประเภทอื่นใช้เงื่อนไขเดิมทุกประการ
  if d.doc_type = 'WHT50' then
    if d.status not in ('SENT','VIEWED') then
      raise exception 'บันทึก Final PDF ของ 50 ทวิ ได้เมื่อสถานะเป็น SENT หรือ VIEWED (ปัจจุบัน %)', d.status
        using errcode = '22023';
    end if;
  elsif d.status not in ('ACKNOWLEDGED','SIGNED') then
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


-- ─── 2b) njhr_doc_pdf_status — can_generate ของ WHT50 ───────
--  เดิม can_generate เป็นจริงเฉพาะ ACKNOWLEDGED/SIGNED
--  ทำให้หน้าเว็บเห็นว่า 50 ทวิ สร้าง PDF ไม่ได้ทั้งที่ Pipeline รองรับแล้ว
--  เนื้อหาส่วนอื่นคัดลอกจาก I2_finalpdf.sql มาทั้งหมด ไม่แก้บรรทัดอื่น
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
    -- ══ WHT50: สร้างได้เมื่อ SENT/VIEWED (ไม่ต้อง ACK/SIGN) · อื่น ๆ เงื่อนไขเดิม ══
    'can_generate', (case when d.doc_type = 'WHT50'
                          then d.status in ('SENT','VIEWED')
                          else d.status in ('ACKNOWLEDGED','SIGNED') end
                     and coalesce(d.final_pdf_status,'') <> 'READY'),
    'can_download', (d.final_pdf_status = 'READY' and d.final_pdf_path is not null));
end $$;

-- ─── 3) แยก wht50_id ออกจาก document_id ในรายการหน้า Admin ───
--  ปัญหาเดิม: njhr_wht50_send_list คืน doc_id ซึ่งเป็น njhr_wht50.id
--  แต่หน้า Admin ต้องใช้ 2 ค่าคนละตัว
--    wht50_id     → njhr_wht50_draft / _get / _update / _confirm / _send
--    document_id  → njhr_doc_pdf_access / njhr_doc_get / ดาวน์โหลด
--  ถ้าใช้ค่าเดียวกันจะเรียก RPC ผิดตัวและเกิดข้อผิดพลาดที่หาสาเหตุยาก
--
--  ⚠ ต้อง DROP ก่อน CREATE เพราะเปลี่ยนชนิดคอลัมน์ที่คืน (RETURNS TABLE)
--    PostgreSQL ไม่อนุญาตให้ CREATE OR REPLACE เปลี่ยนโครงสร้างผลลัพธ์
drop function if exists public.njhr_wht50_send_list(text, int, text, text, text);

create or replace function public.njhr_wht50_send_list(
  p_token text, p_year int, p_q text default null,
  p_send_status text default null, p_dept text default null)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  national_id_masked text, has_national_id boolean, has_address boolean,
  department_name text, position_name text, emp_status text,
  periods int, total_income numeric, total_tax numeric, total_sso numeric,
  wht50_id uuid, document_id uuid,
  doc_no text, doc_status text, issue_date date, amend_seq int,
  send_status text, sent_at timestamptz, sent_by text, opened_at timestamptz,
  send_count int, is_ready boolean)
language plpgsql stable security definer set search_path = public as $function$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        ss text := nullif(upper(btrim(coalesce(p_send_status,''))),'');
begin
  select * into c from public.njhr_wht50_guard(p_token, false);
  if p_year is null then raise exception 'กรุณาเลือกปีภาษี' using errcode='22023'; end if;
  if ss is not null and ss not in ('NOT_SENT','SENT','OPENED') then
    raise exception 'สถานะการส่งไม่ถูกต้อง (%)', p_send_status using errcode='22023';
  end if;

  return query
  with inc as (
    select p.employee_id eid, count(*)::int n,
           round(coalesce(sum(p.total_income),0),2) ti,
           round(coalesce(sum(p.tax),0),2) tx,
           round(coalesce(sum(p.social_security),0),2) so
      from public.payroll p
     where p.period_year = p_year
       and upper(coalesce(p.status::text,'')) in ('CALCULATED','PAID')
     group by p.employee_id
  ), doc as (
    select d.employee_id eid, d.id wid, d.document_id did, d.doc_no dno, d.status dst,
           d.issue_date idt, d.amend_seq aseq,
           d.send_status sst, d.sent_at sat, d.sent_by sby,
           d.opened_at oat, d.send_count scn
      from public.njhr_wht50 d
     where d.tax_year = p_year and d.status in ('DRAFT','CONFIRMED')
  )
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.nickname,''),
         public.njhr_wht50_mask_id(e.national_id),
         coalesce(btrim(e.national_id),'') <> '',
         coalesce(btrim(e.address),'') <> '',
         coalesce(e.department_name,''), coalesce(e.position_name,''), e.status::text,
         coalesce(inc.n, 0), coalesce(inc.ti, 0), coalesce(inc.tx, 0), coalesce(inc.so, 0),
         doc.wid,                                    -- wht50_id  → draft/confirm/send
         doc.did,                                    -- document_id → pdf access/download
         coalesce(doc.dno,''), coalesce(doc.dst,'NONE'), doc.idt, coalesce(doc.aseq,0),
         coalesce(doc.sst,'NOT_SENT'), doc.sat, coalesce(doc.sby,''), doc.oat,
         coalesce(doc.scn,0),
         (coalesce(doc.dst,'NONE') = 'CONFIRMED'
          and coalesce(doc.sst,'NOT_SENT') = 'NOT_SENT'
          and coalesce(btrim(e.national_id),'') <> '')
    from public.employees e
    left join inc on inc.eid = e.id
    left join doc on doc.eid = e.id
   where coalesce(inc.n,0) > 0
     and (p_dept is null or p_dept = '' or e.department_name = p_dept)
     and (ss is null or coalesce(doc.sst,'NOT_SENT') = ss)
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code;
end $function$;

revoke all on function public.njhr_wht50_send_list(text,int,text,text,text) from public;
grant execute on function public.njhr_wht50_send_list(text,int,text,text,text) to anon, authenticated;

-- ─── 4) วิธีออกภาษี (ช่อง "ผู้จ่ายเงิน" ตามแบบกรมสรรพากร) ───
--  แบบฟอร์ม 50 ทวิ บังคับให้ทำเครื่องหมายว่าภาษีนี้
--    (1) หัก ณ ที่จ่าย  (2) ออกให้ตลอดไป  (3) ออกให้ครั้งเดียว  (4) อื่น ๆ
--  Production ยังไม่มีคอลัมน์เก็บ Renderer จึงติ๊กไม่ได้และไม่ยอมออกเอกสาร
--  ใช้ text + CHECK ตามแบบเดียวกับ status / form_type ของตารางนี้ (ไม่สร้าง enum ใหม่)
alter table public.njhr_wht50
  add column if not exists tax_payment_mode text,
  add column if not exists tax_payment_mode_other text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'njhr_wht50_paymode_chk') then
    alter table public.njhr_wht50
      add constraint njhr_wht50_paymode_chk
      check (tax_payment_mode is null or tax_payment_mode in
             ('WITHHOLD','PAID_CONTINUOUS','PAID_ONCE','OTHER'));
  end if;
end $$;

comment on column public.njhr_wht50.tax_payment_mode is
  'วิธีออกภาษีตามแบบ 50 ทวิ: WITHHOLD=หัก ณ ที่จ่าย · PAID_CONTINUOUS=ออกให้ตลอดไป · PAID_ONCE=ออกให้ครั้งเดียว · OTHER=อื่น ๆ';
comment on column public.njhr_wht50.tax_payment_mode_other is
  'รายละเอียดเมื่อ tax_payment_mode = OTHER';


-- ─── 5) njhr_wht50_update — เพิ่ม 2 คีย์ใหม่ ────────────────
--  ⚠ เนื้อหาคัดลอกจาก 87_wht50.sql ทั้งฟังก์ชัน แล้วแทรกเฉพาะ 3 จุดที่ทำเครื่องหมาย ▼
--    Logic เดิมอยู่ครบทุกบรรทัด:
--      · แก้ได้เฉพาะ DRAFT
--      · income_final merge ด้วย ||
--      · ยอดต่างจาก income_source ต้องมี p_reason
--      · คำนวณ total_income / total_tax / total_sso / total_pvd จาก v_final
--      · audit WHT50_EDIT ด้วย njhr_audit_write
--      · updated_at / updated_by
create or replace function public.njhr_wht50_update(
  p_token text, p_id uuid, p_patch jsonb, p_reason text default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $function$
#variable_conflict use_column
declare c record; d record; oldrow jsonb; v_final jsonb;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
        -- ▼ เพิ่มรอบนี้: วิธีออกภาษี
        v_mode text := nullif(btrim(coalesce(p_patch->>'tax_payment_mode','')),'');
        v_other text;
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status <> 'DRAFT' then
    raise exception 'เอกสารสถานะ "%" แก้ไขโดยตรงไม่ได้ — ให้ยกเลิกแล้วออกฉบับแก้ไข', d.status
      using errcode='42501';
  end if;
  oldrow := to_jsonb(d);

  /* ▼ เพิ่มรอบนี้: เลือก "อื่น ๆ" ต้องมีรายละเอียด — ตรวจที่ Server ด้วย
     ไม่พึ่งหน้าเว็บอย่างเดียว กันการยิง RPC ตรง */
  v_other := coalesce(nullif(btrim(coalesce(p_patch->>'tax_payment_mode_other','')),''),
                      d.tax_payment_mode_other);
  if coalesce(v_mode, d.tax_payment_mode) = 'OTHER'
     and coalesce(btrim(coalesce(v_other,'')),'') = '' then
    raise exception 'กรุณาระบุรายละเอียดวิธีออกภาษี' using errcode='22023';
  end if;

  v_final := d.income_final || coalesce(p_patch->'income_final', '{}'::jsonb);
  -- ยอดต่างจากต้นทาง = ต้องมีเหตุผลเสมอ
  if v_final is distinct from d.income_source and v_reason is null and d.adjust_reason is null then
    raise exception 'การแก้ยอดเงินต้องระบุเหตุผล' using errcode='22023';
  end if;

  update public.njhr_wht50 set
    form_type       = coalesce(nullif(btrim(p_patch->>'form_type'),''), form_type),
    income_section  = coalesce(nullif(btrim(p_patch->>'income_section'),''), income_section),
    seq_no          = coalesce(nullif(p_patch->>'seq_no','')::int, seq_no),
    book_no         = coalesce(nullif(btrim(p_patch->>'book_no'),''), book_no),
    issue_date      = coalesce(nullif(p_patch->>'issue_date','')::date, issue_date),
    payee_snapshot  = payee_snapshot || coalesce(p_patch->'payee_snapshot', '{}'::jsonb),
    income_final    = v_final,
    total_income    = coalesce(nullif(v_final->>'total_income','')::numeric, total_income),
    total_tax       = coalesce(nullif(v_final->>'tax','')::numeric, total_tax),
    total_sso       = coalesce(nullif(v_final->>'social_security','')::numeric, total_sso),
    total_pvd       = coalesce(nullif(v_final->>'pvd','')::numeric, total_pvd),
    note            = coalesce(p_patch->>'note', note),
    signer_name     = coalesce(nullif(btrim(p_patch->>'signer_name'),''), signer_name),
    signer_position = coalesce(nullif(btrim(p_patch->>'signer_position'),''), signer_position),
    -- ▼ เพิ่มรอบนี้ 2 บรรทัด (บรรทัดอื่นคัดลอกจาก 87_wht50.sql ทั้งหมด)
    tax_payment_mode       = coalesce(v_mode, tax_payment_mode),
    tax_payment_mode_other = case when coalesce(v_mode, tax_payment_mode) = 'OTHER'
                                  then v_other else null end,
    adjust_reason   = coalesce(v_reason, adjust_reason),
    updated_at = now(), updated_by = c.username
   where njhr_wht50.id = p_id;

  perform public.njhr_audit_write(p_token, 'WHT50_EDIT', 'payroll', 'njhr_wht50', p_id::text,
    'แก้ไขร่าง 50 ทวิ' || coalesce(' · เหตุผล: ' || v_reason, ''), oldrow,
    (select to_jsonb(x) from public.njhr_wht50 x where x.id = p_id), null);

  return query select x.id, x.status from public.njhr_wht50 x where x.id = p_id;
end $function$;


-- ─── 6) บังคับให้ระบุวิธีออกภาษีก่อนยืนยันเอกสาร ───────────
--  ใช้ trigger แทนการแก้ njhr_wht50_confirm ทั้งฟังก์ชัน
--  เหตุผล: confirm ของเดิมยาวและมีการออกเลขที่เอกสาร ถ้าคัดลอกมาแก้เสี่ยงพลาด
--  trigger ดักที่จุดเปลี่ยนสถานะเป็น CONFIRMED จึงกันได้ทุกเส้นทาง
--  รวมถึงกรณีมีใครยิง SQL ตรงข้ามหน้าเว็บ
create or replace function public.njhr_wht50_confirm_chk()
returns trigger language plpgsql as $function$
begin
  if new.status = 'CONFIRMED' and coalesce(old.status,'') <> 'CONFIRMED' then
    if coalesce(btrim(coalesce(new.tax_payment_mode,'')),'') = '' then
      raise exception 'กรุณาระบุวิธีออกภาษีก่อนยืนยันเอกสาร' using errcode='22023';
    end if;
    if new.tax_payment_mode = 'OTHER'
       and coalesce(btrim(coalesce(new.tax_payment_mode_other,'')),'') = '' then
      raise exception 'เลือก "อื่น ๆ" ต้องระบุรายละเอียดวิธีออกภาษี' using errcode='22023';
    end if;
  end if;
  return new;
end $function$;

drop trigger if exists njhr_wht50_confirm_chk_trg on public.njhr_wht50;
create trigger njhr_wht50_confirm_chk_trg
  before update on public.njhr_wht50
  for each row execute function public.njhr_wht50_confirm_chk();

revoke all on function public.njhr_wht50_update(text, uuid, jsonb, text) from public;
grant execute on function public.njhr_wht50_update(text, uuid, jsonb, text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v3.6-wht50-pdf',
        '50 ทวิ — branch WHT50 ใน pdf claim/commit/status · แยก wht50_id/document_id · วิธีออกภาษี')
on conflict (version) do nothing;

commit;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'claim มี branch WHT50',
    (select position('doc_type = ''WHT50''' in pg_get_functiondef(p.oid)) > 0
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_doc_pdf_claim' limit 1),
  'claim ยังบังคับ ACK/SIGN กับเอกสารอื่น',
    (select position('ACKNOWLEDGED' in pg_get_functiondef(p.oid)) > 0
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_doc_pdf_claim' limit 1),
  'commit มี branch WHT50',
    (select position('SENT' in pg_get_functiondef(p.oid)) > 0
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_doc_pdf_commit' limit 1),
  'pdf_status รองรับ WHT50',
    (select position('WHT50' in pg_get_functiondef(p.oid)) > 0
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_doc_pdf_status' limit 1),
  'ไม่มี RPC แยกที่ไม่ได้ใช้',
    (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname like 'njhr_wht50_pdf_%'),
  'send_list คืน wht50_id และ document_id',
    (select pg_get_function_result(p.oid) ilike '%wht50_id uuid%'
        and pg_get_function_result(p.oid) ilike '%document_id uuid%'
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_wht50_send_list' limit 1),
  'RPC เชื่อมเดิมยังอยู่ครบ',
    (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in
        ('njhr_wht50_send','njhr_wht50_send_summary','njhr_wht50_sync_opened')),
  'Trigger เดิมยังอยู่',
    (select count(*) = 1 from pg_trigger where tgname='njhr_wht50_opened_trg'),
  'มีคอลัมน์ tax_payment_mode',
    (select count(*) = 2 from information_schema.columns
      where table_schema='public' and table_name='njhr_wht50'
        and column_name in ('tax_payment_mode','tax_payment_mode_other')),
  'CHECK constraint ของวิธีออกภาษี',
    (select count(*) = 1 from pg_constraint where conname='njhr_wht50_paymode_chk'),
  'Trigger บังคับวิธีออกภาษีก่อน CONFIRMED',
    (select count(*) = 1 from pg_trigger where tgname='njhr_wht50_confirm_chk_trg'),
  'Claim คืนวิธีออกภาษีให้ Renderer',
    (select position('tax_payment_mode' in pg_get_functiondef(p.oid)) > 0
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='njhr_doc_pdf_claim' limit 1),
  'เอกสาร WHT50 ทั้งหมด',
    (select count(*) from public.njhr_emp_documents where doc_type='WHT50')
)) as report;
