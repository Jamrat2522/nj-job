-- ═══════════════════════════════════════════════════════════════════
--  H2_hrdocs.sql — เอกสาร HR: Hash · Confirmation Text · Lock · Pending · ปิด Legacy RPC
--
--  ทำ 9 อย่าง ไม่มีมากกว่านี้:
--    1) ALTER  เพิ่ม 4 คอลัมน์ (nullable ทั้งหมด ไม่แตะข้อมูลเดิม)
--    2) CREATE njhr_doc_content_hash(uuid)        — Canonical Snapshot → sha256 hex
--    3) CREATE njhr_doc_confirm_text(text,bool,text) — ข้อความมาตรฐานฝั่ง DB
--    4) REPLACE njhr_empdoc_lock_guard()          — ขยายให้ครบ
--    5) CREATE njhr_docack_immutable_guard() + trigger — หลักฐาน ACK/SIGN แก้/ลบไม่ได้
--    6) REPLACE njhr_doc_flow                     — SEND คำนวณ content_hash ครั้งเดียว
--    7) REPLACE njhr_doc_respond                  — snapshot doc_hash + confirmation_text
--    8) CREATE njhr_doc_my_pending(text)          — Pending Count สำหรับ Badge
--    9) REVOKE Legacy RPC 6 ตัว จาก PUBLIC / anon / authenticated
--
--  ข้อ 6–7 คัดลอกเนื้อในของจริงจาก DB (pg_get_functiondef เมื่อ 2026-08-08 05:20)
--  มาทั้งดุ้น แล้วเพิ่มเฉพาะบรรทัดที่จำเป็น ตรรกะเดิมไม่ถูกแตะ
--
--  ยืนยันจาก H1 — ของที่ "มีอยู่แล้ว" จึงไม่สร้างซ้ำ:
--    · Idempotency  : njhr_empack_uidx UNIQUE (document_id, employee_id) — เพียงพอ
--                     เพราะแต่ละ Version เป็นแถวใหม่ใน njhr_emp_documents (document_id ต่างกัน)
--    · Version chain: version + supersedes_id / superseded_by + UNIQUE (doc_no, version)
--    · Audit        : njhr_emp_doc_events + njhr_doc_event() + njhr_audit_write()
--    · RLS          : เปิดครบ 4 ตาราง · policy = 0 → PostgREST เข้าตรงไม่ได้ ต้องผ่าน RPC
--    · Ownership    : njhr_doc_respond เทียบ d.employee_id กับ c.employee_id จาก token
--
--  ไม่ทำ:
--    · ไม่ DROP function ใด ๆ (REVOKE เท่านั้น)
--    · ไม่สร้างตารางใหม่ · ไม่สร้างระบบ "เอกสารของฉัน" แยก
--    · ไม่แตะ Frontend · ไม่แตะ Login/Attendance/Face/GPS/Leave/OT/Payroll/REPORT
--    · ไม่แตะ RPC ชุดปัจจุบันที่ระบบใช้อยู่ (center_list · detail · save · view · org · ฯลฯ)
--
--  รันทั้งไฟล์ครั้งเดียว · idempotent · statement สุดท้ายคืน JSON ตรวจสอบ
-- ═══════════════════════════════════════════════════════════════════


-- ─── PREFLIGHT ─────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents';
  end if;
  if to_regclass('public.njhr_emp_doc_acks') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_doc_acks';
  end if;
  if to_regprocedure('public.njhr_ctx(text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx';
  end if;
  if to_regprocedure('public.njhr_doc_event(uuid,text,text,text,text,jsonb)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_event';
  end if;
  if to_regprocedure('public.njhr_doc_can_approve(text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_can_approve';
  end if;
  -- sha256() เป็น built-in ของ PostgreSQL 11+ (H1 ยืนยัน builtin_sha256 = 1)
  -- จึงไม่ต้องพึ่ง extensions.digest และไม่ชนกับ search_path = public
  if to_regprocedure('pg_catalog.sha256(bytea)') is null then
    raise exception 'PREFLIGHT: ไม่พบ sha256() ใน pg_catalog — PostgreSQL เก่าเกินไป';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ═══ 1) คอลัมน์ใหม่ 4 ตัว ════════════════════════════════════════
--   ทั้งหมด nullable ไม่มี default ไม่แตะ 18 แถวเดิม (H1: ทุกแถวเป็น DRAFT · acks = 0)
alter table public.njhr_emp_documents add column if not exists content_hash    text;
alter table public.njhr_emp_documents add column if not exists content_hash_at timestamptz;
alter table public.njhr_emp_doc_acks  add column if not exists doc_hash          text;
alter table public.njhr_emp_doc_acks  add column if not exists confirmation_text text;

comment on column public.njhr_emp_documents.content_hash is
  'SHA-256 ของ Canonical Snapshot ของเอกสารฉบับนี้ — คำนวณครั้งเดียวตอนเปลี่ยนเป็น SENT ห้ามเปลี่ยนอีก';
comment on column public.njhr_emp_doc_acks.doc_hash is
  'สำเนา content_hash ณ วินาทีที่พนักงานรับทราบ/ลงนาม (พิสูจน์ว่าลงนามกับเนื้อหาชุดใด)';
comment on column public.njhr_emp_doc_acks.confirmation_text is
  'ข้อความยืนยันที่ระบบกำหนด ณ เวลานั้น — มาจาก njhr_doc_confirm_text ฝั่ง DB ไม่รับจาก client';


-- ═══ 2) njhr_doc_content_hash — Canonical Snapshot Hash ═══════════
--   ใช้ jsonb_build_object แทนการต่อ string ด้วย '|'
--   เหตุผล: jsonb เรียงคีย์เองและ escape ค่าเอง ทำให้ค่าที่มีเครื่องหมาย/ขึ้นบรรทัดใหม่
--           ใน title/body ไม่ทำให้ hash เพี้ยน และผลลัพธ์ deterministic เสมอ
--   ครอบคลุมข้อมูลที่เป็นสาระของเอกสารฉบับนั้นตามที่ตกลง
create or replace function public.njhr_doc_content_hash(p_id uuid)
returns text
language sql stable security definer set search_path = public as $$
  select encode(sha256(convert_to(
    jsonb_build_object(
      'doc_no',             d.doc_no,
      'version',            d.version,
      'doc_type',           d.doc_type,
      'employee_id',        d.employee_id::text,
      'title',              d.title,
      'body',               d.body,
      'effective_date',     coalesce(d.effective_date::text, ''),
      'requires_signature', d.requires_signature,
      'emp_code_snap',      coalesce(d.emp_code_snap, ''),
      'emp_name_snap',      coalesce(d.emp_name_snap, ''),
      'dept_snap',          coalesce(d.dept_snap, ''),
      'position_snap',      coalesce(d.position_snap, ''),
      'doc_meta',           d.doc_meta
    )::text, 'UTF8')), 'hex')
    from public.njhr_emp_documents d where d.id = p_id;
$$;

comment on function public.njhr_doc_content_hash(uuid) is
  'Canonical Snapshot Hash (SHA-256 hex) — ตัวช่วยภายใน เรียกจาก njhr_doc_flow ตอน SEND เท่านั้น';


-- ═══ 3) njhr_doc_confirm_text — ข้อความมาตรฐานฝั่ง DB ═════════════
--   Source of Truth ของข้อความยืนยันอยู่ที่นี่ที่เดียว
--   Frontend มีหน้าที่ "แสดงข้อความเดียวกับที่ Server กำหนด" เท่านั้น
--   njhr_doc_respond จะ snapshot ข้อความนี้ลง njhr_emp_doc_acks.confirmation_text
--   → พิสูจน์ได้ว่าพนักงานกดยืนยัน "ข้อความอะไร" ณ เวลานั้น
--   doc_type อ้างอิงค่าจริงทั้ง 8 ตัวจาก njhr_empdoc_type_chk
create or replace function public.njhr_doc_confirm_text(
  p_doc_type text, p_requires_signature boolean, p_action text default 'ACKNOWLEDGE')
returns text
language sql immutable as $$
  select case upper(coalesce(p_action,''))
    when 'REJECT' then
      'ข้าพเจ้าได้อ่านเอกสารฉบับนี้ครบถ้วนแล้ว และขอปฏิเสธการรับทราบพร้อมระบุเหตุผลตามที่แจ้งไว้ ' ||
      'การกดปุ่มนี้เป็นการยืนยันตัวตนของข้าพเจ้าและบันทึกเป็นหลักฐานในระบบ'
    else
      case when coalesce(p_requires_signature, false) then
        case upper(coalesce(p_doc_type,''))
          when 'CONTRACT' then
            'ข้าพเจ้าได้อ่านสัญญาจ้างฉบับนี้ครบถ้วนแล้ว เข้าใจและตกลงยอมรับข้อกำหนดทั้งหมด ' ||
            'และขอลงนามอิเล็กทรอนิกส์เพื่อผูกพันตามสัญญาฉบับนี้'
          when 'CONTRACT_PROBATION' then
            'ข้าพเจ้าได้อ่านข้อตกลงทดลองงานฉบับนี้ครบถ้วนแล้ว เข้าใจและตกลงยอมรับเงื่อนไขทั้งหมด ' ||
            'และขอลงนามอิเล็กทรอนิกส์เพื่อผูกพันตามข้อตกลงฉบับนี้'
          else
            'ข้าพเจ้าได้อ่านเอกสารฉบับนี้ครบถ้วนแล้ว เข้าใจและตกลงยอมรับข้อกำหนดทั้งหมด ' ||
            'และขอลงนามอิเล็กทรอนิกส์เพื่อผูกพันตามเอกสารฉบับนี้'
        end
      else
        case upper(coalesce(p_doc_type,''))
          when 'WARNING' then
            'ข้าพเจ้าได้อ่านหนังสือเตือนฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง ' ||
            'การกดปุ่ม "รับทราบ" เป็นการยืนยันว่าได้รับเอกสารแล้ว ' ||
            'มิใช่การยอมรับหรือยินยอมต่อเนื้อหาทั้งหมดของเอกสาร'
          when 'SUSPENSION' then
            'ข้าพเจ้าได้อ่านหนังสือพักงานฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง ' ||
            'การกดปุ่ม "รับทราบ" เป็นการยืนยันว่าได้รับเอกสารแล้ว ' ||
            'มิใช่การยอมรับหรือยินยอมต่อเนื้อหาทั้งหมดของเอกสาร'
          when 'PROBATION_RESULT' then
            'ข้าพเจ้าได้อ่านหนังสือแจ้งผลการทดลองงานฉบับนี้ครบถ้วนแล้ว ' ||
            'และรับทราบผลการประเมินตามที่บริษัทแจ้ง'
          when 'COE' then
            'ข้าพเจ้าได้รับหนังสือรับรองการทำงานฉบับนี้แล้ว และได้ตรวจสอบความถูกต้องของข้อมูลเรียบร้อย'
          when 'SALARY_CERT' then
            'ข้าพเจ้าได้รับหนังสือรับรองเงินเดือนฉบับนี้แล้ว และได้ตรวจสอบความถูกต้องของข้อมูลเรียบร้อย'
          when 'SEPARATION' then
            'ข้าพเจ้าได้รับหนังสือรับรองการทำงานพ้นสภาพฉบับนี้แล้ว ' ||
            'และได้ตรวจสอบความถูกต้องของข้อมูลเรียบร้อย'
          else
            'ข้าพเจ้าได้อ่านเอกสารฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง ' ||
            'การกดปุ่ม "รับทราบ" เป็นการยืนยันว่าได้รับเอกสารแล้ว ' ||
            'มิใช่การยอมรับหรือยินยอมต่อเนื้อหาทั้งหมดของเอกสาร'
        end
      end
  end;
$$;

comment on function public.njhr_doc_confirm_text(text, boolean, text) is
  'ข้อความยืนยันมาตรฐานฝั่ง DB — Frontend แสดงข้อความนี้ให้พนักงานอ่าน · client ส่งข้อความเองไม่ได้';


-- ═══ 4) njhr_empdoc_lock_guard — ขยายให้ครบ ══════════════════════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น แล้วเพิ่ม 3 ส่วน:
--     (1) ขยายรายการ field ที่ห้ามแก้หลัง locked_at (เดิม 6 → 11 field)
--     (2) เพิ่มด่าน "ส่งให้พนักงานแล้ว (sent_at)" — ห้ามแก้สาระสำคัญของฉบับที่พนักงานเห็น
--     (3) content_hash เขียนได้ครั้งเดียว ห้ามเปลี่ยนหลังตั้งค่าแล้ว
--   ยังอนุญาต: เปลี่ยน status · cancelled_at · archived_at · deleted_at · viewed_at
--              responded_at · reject_reason · superseded_by  (Workflow ปกติ)
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
  --     เพราะพนักงานอาจเปิดอ่านไปแล้ว และ content_hash ถูกตรึงไว้ตั้งแต่ตอนส่ง
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

  new.updated_at := now();
  return new;
end $$;


-- ═══ 5) หลักฐาน ACK/SIGN ต้อง Immutable ═══════════════════════════
--   H1 ยืนยันว่า njhr_emp_doc_acks ไม่มี trigger ใดเลย → แก้/ลบหลักฐานได้
--   แม้ SUPER_ADMIN ก็ต้องแก้ไม่ได้: ดูได้ ตรวจได้ ออก Version ใหม่ได้ ยกเลิกตาม Workflow ได้
--   แต่ห้าม UPDATE / DELETE แถวหลักฐานเดิมโดยตรง
--   หมายเหตุ: ON DELETE CASCADE จาก njhr_emp_documents จะถูกบล็อกด้วย ซึ่งเป็นผลที่ตั้งใจ
--             (ลบเอกสารทิ้งทั้งที่มีหลักฐานลงนามแล้วไม่ได้ ต้องใช้ soft delete / CANCEL แทน)
create or replace function public.njhr_docack_immutable_guard()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    raise exception 'หลักฐานการรับทราบ/ลงนาม (เอกสาร %) ลบไม่ได้ — เป็นหลักฐานถาวรของระบบ',
      old.document_id using errcode='42501';
  end if;
  raise exception 'หลักฐานการรับทราบ/ลงนาม (เอกสาร %) แก้ไขไม่ได้ — เป็นหลักฐานถาวรของระบบ',
    old.document_id using errcode='42501';
end $$;

drop trigger if exists njhr_docack_immutable_trg on public.njhr_emp_doc_acks;
create trigger njhr_docack_immutable_trg
  before update or delete on public.njhr_emp_doc_acks
  for each row execute function public.njhr_docack_immutable_guard();


-- ═══ 6) njhr_doc_flow — SEND คำนวณ content_hash ครั้งเดียว ════════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · แก้เฉพาะสาขา SEND
--   สาขา SUBMIT / APPROVE / REJECT_APPROVAL / ARCHIVE / CANCEL — เหมือนเดิมทุกบรรทัด
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
    -- ⭐ เพิ่มใหม่: ตรึง Document Hash ณ วินาทีที่ส่งให้พนักงาน
    --    where content_hash is null → คำนวณครั้งเดียวเท่านั้น
    --    ส่งซ้ำ (SENT → SENT) จะไม่คำนวณใหม่ และ lock guard จะบล็อกถ้ามีการเปลี่ยน
    if d.content_hash is null then
      update public.njhr_emp_documents
         set content_hash = public.njhr_doc_content_hash(p_id), content_hash_at = now()
       where njhr_emp_documents.id = p_id and content_hash is null;
    end if;
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
      raise exception 'เอกสารที่รับทราบ/ลงนามแล้ว ยกเลิกไม่ได้' using errcode='42501';
    end if;
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


-- ═══ 7) njhr_doc_respond — snapshot doc_hash + confirmation_text ══
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · เพิ่ม 2 ส่วน:
--     (1) ประกาศ v_confirm แล้วดึงข้อความมาตรฐานจาก njhr_doc_confirm_text (ฝั่ง DB)
--     (2) insert หลักฐานพร้อม doc_hash (สำเนา content_hash) + confirmation_text
--   Signature เดิมไม่เปลี่ยน → Frontend ปัจจุบันเรียกได้เหมือนเดิม
--   ตรรกะยืนยันตัวตนด้วย bcrypt · ตรวจ ownership · ตรวจ status · ตรวจ locked_at — เหมือนเดิม
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
    locked_at = case when a = 'ACKNOWLEDGE' then now() else locked_at end
   where njhr_emp_documents.id = p_id;

  if a = 'ACKNOWLEDGE' then
    v_act := case when d.requires_signature then 'SIGN' else 'ACKNOWLEDGE' end;
    -- ⭐ เพิ่มใหม่: ข้อความยืนยันมาจาก DB ไม่ใช่จาก client
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


-- ═══ 8) njhr_doc_my_pending — Pending Count สำหรับ Badge ══════════
--   employee_id มาจาก token เท่านั้น ไม่รับจาก client
--   นับเฉพาะสถานะ SENT / VIEWED = เอกสารที่ส่งถึงพนักงานแล้วแต่ยังไม่ตอบ
--
--   หมายเหตุตามข้อกำหนด "เอกสารดู/ดาวน์โหลดอย่างเดียวไม่ควรนับ":
--   ระบบจริงไม่มีเส้นทาง "ดู/ดาวน์โหลดอย่างเดียว" — เอกสารทุกประเภทต้องผ่าน
--   njhr_doc_respond จึงจะออกจากสถานะ SENT/VIEWED ได้ ดังนั้นทุกฉบับที่ค้างจึงเป็น Pending จริง
--   คืนค่าแยก pending_sign / pending_ack ให้หน้าจอเลือกแสดงได้เองโดยไม่ต้องคำนวณซ้ำ
create or replace function public.njhr_doc_my_pending(p_token text)
returns table (pending int, pending_sign int, pending_ack int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    return query select 0, 0, 0;
    return;
  end if;
  return query
  select count(*)::int,
         count(*) filter (where d.requires_signature)::int,
         count(*) filter (where not d.requires_signature)::int
    from public.njhr_emp_documents d
   where d.employee_id = c.employee_id
     and d.status in ('SENT','VIEWED')
     and d.deleted_at is null;
end $$;

comment on function public.njhr_doc_my_pending(text) is
  'Pending Count ของพนักงานเจ้าของ session — employee_id มาจาก token ไม่รับจาก client';


-- ═══ 9) GRANT / REVOKE ═══════════════════════════════════════════
--   ตัวช่วยภายใน → ปิดไม่ให้ client เรียก (แนวเดียวกับ njhr_ctx / njhr_doc_guard / njhr_doc_event)
revoke all on function public.njhr_doc_content_hash(uuid) from public, anon, authenticated;
--   ข้อความยืนยัน → Frontend ต้องอ่านมาแสดงได้ จึงเปิดให้เรียก (immutable ไม่แตะข้อมูล)
grant execute on function public.njhr_doc_confirm_text(text, boolean, text) to anon, authenticated;
grant execute on function public.njhr_doc_my_pending(text)                  to anon, authenticated;

--   ─── ปิดสิทธิ์ Client ของ Legacy RPC 6 ตัว ───
--   H1 ยืนยันว่า ACL เดิมมี "=X/postgres" ซึ่งคือ GRANT ให้ PUBLIC
--   การ revoke เฉพาะ anon/authenticated จะปิดไม่ครบ → ต้อง revoke จาก PUBLIC ด้วย
--   วนตาม pg_proc จริงเพื่อครอบคลุมทุก overload โดยไม่ต้องพิมพ์ signature เอง (กันพิมพ์ผิด)
--   REVOKE เท่านั้น — ไม่ DROP function เพื่อไม่ทำลายของเดิม
do $$
declare r record; n int := 0;
begin
  for r in
    select p.oid::regprocedure as sig, p.proname
      from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.proname in ('njhr_doc_ack','njhr_doc_issue','njhr_doc_get',
                         'njhr_doc_list','njhr_doc_cancel','njhr_doc_ack_report')
  loop
    execute format('revoke all on function %s from public', r.sig);
    execute format('revoke all on function %s from anon', r.sig);
    execute format('revoke all on function %s from authenticated', r.sig);
    n := n + 1;
    raise notice 'REVOKE: %', r.sig;
  end loop;
  raise notice 'ปิดสิทธิ์ Legacy RPC ทั้งหมด % ตัว (ยังไม่ DROP)', n;
end $$;


-- ═══ ROLLBACK (ไม่รันอัตโนมัติ — คัดลอกไปรันเองเมื่อจำเป็น) ═══════
-- drop trigger if exists njhr_docack_immutable_trg on public.njhr_emp_doc_acks;
-- drop function if exists public.njhr_docack_immutable_guard();
-- drop function if exists public.njhr_doc_my_pending(text);
-- drop function if exists public.njhr_doc_confirm_text(text, boolean, text);
-- drop function if exists public.njhr_doc_content_hash(uuid);
-- alter table public.njhr_emp_doc_acks  drop column if exists confirmation_text;
-- alter table public.njhr_emp_doc_acks  drop column if exists doc_hash;
-- alter table public.njhr_emp_documents drop column if exists content_hash_at;
-- alter table public.njhr_emp_documents drop column if exists content_hash;
-- คืน njhr_doc_flow / njhr_doc_respond / njhr_empdoc_lock_guard เป็นของเดิม:
--   รัน supabase-new/67_hr_doc_center.sql ข้อ 10, 11 และ 60_emp_documents.sql ข้อ 3
-- คืนสิทธิ์ Legacy RPC (ถ้าจำเป็นจริง ๆ):
--   grant execute on function public.njhr_doc_ack(text,uuid,text,text,text,text,text,text) to anon, authenticated;


-- ═══ VERIFICATION — statement สุดท้าย คืน JSON ก้อนเดียว ═════════
select jsonb_pretty(jsonb_build_object(

  '1_new_columns', (
    select coalesce(jsonb_object_agg(table_name::text || '.' || column_name::text,
             '✅ ' || data_type::text || ' · nullable=' || is_nullable::text), '{}'::jsonb)
      from information_schema.columns
     where table_schema = 'public'
       and ((table_name = 'njhr_emp_documents' and column_name in ('content_hash','content_hash_at'))
         or (table_name = 'njhr_emp_doc_acks'  and column_name in ('doc_hash','confirmation_text')))),

  '2_new_functions', (
    select coalesce(jsonb_object_agg(p.proname::text,
             '✅ ' || pg_get_function_identity_arguments(p.oid)), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_doc_content_hash','njhr_doc_confirm_text',
                         'njhr_doc_my_pending','njhr_docack_immutable_guard')),

  '3_triggers', (
    select coalesce(jsonb_object_agg(c.relname::text || '.' || t.tgname::text,
             'enabled=' || t.tgenabled::text), '{}'::jsonb)
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and c.relname in ('njhr_emp_documents','njhr_emp_doc_acks')),

  '4_lock_guard_extended', (
    select case when pg_get_functiondef(p.oid) like '%v_core%'
                 and pg_get_functiondef(p.oid) like '%old.sent_at is not null%'
                 and pg_get_functiondef(p.oid) like '%content_hash%'
                then '✅ ขยายครบ 3 ด่าน' else '❌ ยังเป็นของเดิม' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_empdoc_lock_guard'),

  '5_rpcs_updated', (
    select coalesce(jsonb_object_agg(p.proname::text, chk), '{}'::jsonb) from (
      select p.proname::text as proname,
             case when p.proname = 'njhr_doc_flow'
                    then (case when pg_get_functiondef(p.oid) like '%njhr_doc_content_hash%'
                               then '✅ SEND ตรึง content_hash' else '❌ ยังไม่ได้แก้' end)
                  else (case when pg_get_functiondef(p.oid) like '%njhr_doc_confirm_text%'
                              and pg_get_functiondef(p.oid) like '%confirmation_text%'
                             then '✅ snapshot hash + confirm text' else '❌ ยังไม่ได้แก้' end) end chk
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname in ('njhr_doc_flow','njhr_doc_respond')) p),

  '6_legacy_revoked', (
    select coalesce(jsonb_object_agg(sig, st), '{}'::jsonb) from (
      select p.oid::regprocedure::text sig,
             case when p.proacl is null then '⚠ ACL null (= default ให้ PUBLIC)'
                  when array_to_string(p.proacl::text[], ' ') ~ '(^|[ |])=X'
                    or array_to_string(p.proacl::text[], ' ') like '%anon=X%'
                    or array_to_string(p.proacl::text[], ' ') like '%authenticated=X%'
                  then '❌ ยังเรียกได้: ' || array_to_string(p.proacl::text[], ' | ')
                  else '✅ ปิดแล้ว: ' || array_to_string(p.proacl::text[], ' | ') end st
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('njhr_doc_ack','njhr_doc_issue','njhr_doc_get',
                           'njhr_doc_list','njhr_doc_cancel','njhr_doc_ack_report')) s),

  '7_current_rpcs_still_open', (
    select coalesce(jsonb_object_agg(p.proname::text,
             case when array_to_string(p.proacl::text[], ' ') like '%anon=X%'
                  then '✅ ยังเรียกได้' else '⚠ ถูกปิดโดยไม่ตั้งใจ' end), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_doc_respond','njhr_doc_center_list','njhr_doc_detail',
                         'njhr_doc_save','njhr_doc_flow','njhr_doc_view','njhr_doc_org',
                         'njhr_doc_org_save','njhr_doc_delete','njhr_doc_approvers',
                         'njhr_doc_emp_profile','njhr_doc_salary_items',
                         'njhr_doc_confirm_text','njhr_doc_my_pending')),

  '8_internal_helpers_closed', (
    select coalesce(jsonb_object_agg(p.proname::text,
             case when p.proacl is not null
                   and array_to_string(p.proacl::text[], ' ') not like '%anon=X%'
                  then '✅ ปิดแล้ว' else '⚠ ยังเปิด' end), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_doc_content_hash','njhr_ctx','njhr_doc_guard','njhr_doc_event')),

  '9_confirm_text_sample', (
    select jsonb_object_agg(t.doc_type || (case when t.rs then ' (ลงนาม)' else ' (รับทราบ)' end),
             left(public.njhr_doc_confirm_text(t.doc_type, t.rs, 'ACKNOWLEDGE'), 60) || '…')
      from (values ('CONTRACT', true), ('CONTRACT_PROBATION', true), ('WARNING', false),
                   ('SUSPENSION', false), ('PROBATION_RESULT', false), ('COE', false),
                   ('SALARY_CERT', false), ('SEPARATION', false)) t(doc_type, rs)),

  '10_data_untouched', (
    select jsonb_build_object(
      'documents_total',   (select count(*) from public.njhr_emp_documents),
      'documents_by_status', coalesce((select jsonb_object_agg(status, n)
                                         from (select status, count(*) n
                                                 from public.njhr_emp_documents group by status) s), '{}'::jsonb),
      'content_hash_filled', (select count(*) from public.njhr_emp_documents where content_hash is not null),
      'acks_total',        (select count(*) from public.njhr_emp_doc_acks),
      'events_total',      (select count(*) from public.njhr_emp_doc_events),
      'unique_index_ack',  (select count(*) from pg_indexes
                             where schemaname='public' and indexname='njhr_empack_uidx'))),

  '11_no_new_tables', (
    select coalesce(jsonb_agg(c.relname::text order by c.relname), '[]'::jsonb)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and (c.relname ilike '%my_doc%' or c.relname ilike '%user_doc%'
            or c.relname ilike '%self_doc%' or c.relname ilike '%doc_mine%'
            or c.relname ilike '%doc_verification%')),

  'meta', jsonb_build_object('file','H2_hrdocs.sql','applied_at', now())
)) as result;
