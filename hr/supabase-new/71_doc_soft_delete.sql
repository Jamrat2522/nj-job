-- ============================================================
-- NJ HR V.10 — 71_doc_soft_delete.sql
-- ลบเอกสาร HR แบบ Soft Delete (ไม่ลบข้อมูลจริงออกจากฐานข้อมูล)
--
-- ทำอะไร
--   1) เพิ่มคอลัมน์ deleted_at / deleted_by / delete_reason ให้ njhr_emp_documents
--   2) RPC njhr_doc_delete  — ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์ + บันทึก Audit Log + ประวัติเอกสาร
--   3) กรองเอกสารที่ถูกลบออกจาก njhr_doc_center_list และ njhr_doc_detail
--
-- สิทธิ์ (ตรวจซ้ำฝั่งเซิร์ฟเวอร์ ไม่เชื่อฝั่งหน้าเว็บ)
--   · เอกสารร่าง (DRAFT / PENDING_APPROVAL ที่ยังไม่อนุมัติ)
--       → ผู้สร้างเอกสาร (issued_by) · ADMIN · SUPER_ADMIN
--   · เอกสารที่อนุมัติ/ออกใช้งานแล้ว (APPROVED เป็นต้นไป)
--       → SUPER_ADMIN เท่านั้น และต้องระบุเหตุผล
--
-- ไม่แตะ: ข้อมูลเอกสารเดิม · การรับทราบ · ประวัติเหตุการณ์ · Audit Log · RPC อื่น
-- ต้องรัน 67_hr_doc_center.sql มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_center_list') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_center_list — ต้องรัน 67_hr_doc_center.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · เอกสารในระบบ % ฉบับ (ไม่มีฉบับใดถูกลบจากการติดตั้งนี้)',
    (select count(*) from public.njhr_emp_documents);
end $$;


-- ─── 1) คอลัมน์สำหรับ Soft Delete ────────────────────────────
alter table public.njhr_emp_documents add column if not exists deleted_at    timestamptz;
alter table public.njhr_emp_documents add column if not exists deleted_by    text;
alter table public.njhr_emp_documents add column if not exists delete_reason text;
create index if not exists njhr_empdoc_alive_idx
  on public.njhr_emp_documents (issued_at desc) where deleted_at is null;


-- ─── 2) เอกสารถือว่า "ออกใช้งานแล้ว" หรือยัง ─────────────────
create or replace function public.njhr_doc_is_issued(p_status text)
returns boolean language sql immutable as $$
  select upper(coalesce(p_status,'')) not in ('DRAFT','PENDING','PENDING_APPROVAL');
$$;


-- ─── 3) ลบเอกสาร (Soft Delete) ──────────────────────────────
create or replace function public.njhr_doc_delete(
  p_token text, p_id uuid, p_reason text default null)
returns table (deleted boolean, doc_no text, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; v_issued boolean; v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_ctx(p_token);
  select * into d from public.njhr_emp_documents where id = p_id and deleted_at is null;
  if not found then raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode='P0002'; end if;

  v_issued := public.njhr_doc_is_issued(d.status);

  if v_issued then
    -- อนุมัติ/ออกใช้งานแล้ว → เฉพาะ SUPER_ADMIN และต้องมีเหตุผล
    if c.role <> 'SUPER_ADMIN' then
      raise exception 'เอกสารที่ออกใช้งานแล้ว เฉพาะ Super Admin เท่านั้นที่ลบได้' using errcode='42501';
    end if;
    if v_reason is null then
      raise exception 'กรุณาระบุเหตุผลการลบเอกสารที่ออกใช้งานแล้ว' using errcode='22023';
    end if;
  else
    -- เอกสารร่าง → ผู้สร้างเอกสาร / ADMIN / SUPER_ADMIN
    if c.role not in ('SUPER_ADMIN','ADMIN')
       and lower(coalesce(d.issued_by,'')) <> lower(coalesce(c.username,'')) then
      raise exception 'คุณลบได้เฉพาะเอกสารร่างที่ตนเองสร้างเท่านั้น' using errcode='42501';
    end if;
  end if;

  update public.njhr_emp_documents
     set deleted_at = now(), deleted_by = c.username, delete_reason = v_reason,
         updated_at = now(), updated_by = c.username
   where njhr_emp_documents.id = p_id;

  -- ประวัติเอกสารและ Audit Log ยังเก็บครบ (ข้อมูลไม่ถูกลบจริง)
  perform public.njhr_doc_event(p_id, 'DELETE', c.username, c.role,
    coalesce(v_reason, 'ลบเอกสารร่าง'), null);
  perform public.njhr_audit_write(p_token, 'DOC_DELETE', 'document', 'njhr_emp_documents',
    p_id::text, d.doc_no || ' · ' || d.doc_type || ' · ' || coalesce(d.emp_name_snap,'') ||
    coalesce(' · เหตุผล: ' || v_reason, ''), to_jsonb(d),
    (select to_jsonb(x) from public.njhr_emp_documents x where x.id = p_id), null);

  return query select true, d.doc_no, d.status;
end $$;


-- ─── 4) กรองเอกสารที่ถูกลบออกจากรายการและหน้ารายละเอียด ─────
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
     where d.deleted_at is null                                     -- ← ซ่อนเอกสารที่ถูกลบ
       and (c.is_manager or d.employee_id = c.employee_id)
       and (p_employee is null or d.employee_id = p_employee)
       and (p_type   is null or p_type   = '' or d.doc_type = upper(p_type))
       and (p_status is null or p_status = '' or d.status   = upper(p_status))
       and (p_dept   is null or p_dept   = '' or d.dept_snap = p_dept)
       and (p_from is null or (d.issued_at at time zone 'Asia/Bangkok')::date >= p_from)
       and (p_to   is null or (d.issued_at at time zone 'Asia/Bangkok')::date <= p_to)
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

create or replace function public.njhr_doc_detail(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_doc_guard(p_token, false);
  select * into d from public.njhr_emp_documents where id = p_id and deleted_at is null;
  if not found then raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode='P0002'; end if;
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
                          from public.njhr_emp_documents v
                         where v.doc_no = d.doc_no and v.deleted_at is null), '[]'::jsonb)
  );
end $$;


-- ─── 5) สิทธิ์เรียกใช้ ──────────────────────────────────────
grant execute on function public.njhr_doc_is_issued(text)          to anon, authenticated;
grant execute on function public.njhr_doc_delete(text,uuid,text)   to anon, authenticated;
grant execute on function public.njhr_doc_center_list(text,text,text,text,text,uuid,date,date,int,int) to anon, authenticated;
grant execute on function public.njhr_doc_detail(text,uuid)        to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v12.3-doc-soft-delete', 'ลบเอกสาร HR แบบ Soft Delete + ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์')
on conflict (version) do nothing;


-- ─── 6) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'columns_added', (select jsonb_agg(column_name order by column_name)
                      from information_schema.columns
                     where table_schema='public' and table_name='njhr_emp_documents'
                       and column_name in ('deleted_at','deleted_by','delete_reason')),
  'เอกสารทั้งหมด',      (select count(*) from public.njhr_emp_documents),
  'เอกสารที่ยังไม่ถูกลบ', (select count(*) from public.njhr_emp_documents where deleted_at is null),
  'เอกสารที่ถูกลบแล้ว',  (select count(*) from public.njhr_emp_documents where deleted_at is not null),
  'การรับทราบไม่ถูกแตะ', (select count(*) from public.njhr_emp_doc_acks),
  'ประวัติเหตุการณ์ไม่ถูกแตะ', (select count(*) from public.njhr_emp_doc_events),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname in
                   ('njhr_doc_delete','njhr_doc_is_issued','njhr_doc_center_list','njhr_doc_detail'))
)) as install_report;
-- คาดหวัง: เอกสารที่ถูกลบแล้ว = 0 และ เอกสารที่ยังไม่ถูกลบ = เอกสารทั้งหมด

-- ─── 7) ROLLBACK ───────────────────────────────────────────
-- update public.njhr_emp_documents set deleted_at = null, deleted_by = null, delete_reason = null; -- กู้คืนทุกฉบับ
-- drop function if exists public.njhr_doc_delete(text,uuid,text);
-- drop function if exists public.njhr_doc_is_issued(text);
-- alter table public.njhr_emp_documents drop column if exists deleted_at;
-- alter table public.njhr_emp_documents drop column if exists deleted_by;
-- alter table public.njhr_emp_documents drop column if exists delete_reason;
-- แล้วรัน njhr_doc_center_list / njhr_doc_detail เวอร์ชันเดิมจาก 67_hr_doc_center.sql
