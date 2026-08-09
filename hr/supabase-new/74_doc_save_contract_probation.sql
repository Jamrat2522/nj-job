-- ============================================================
-- NJ HR V.10 — 74_doc_save_contract_probation.sql   [ฉบับซ่อมตัวเองได้]
-- แก้บั๊ก: บันทึกเอกสาร "สัญญาจ้างงานและข้อตกลงทดลองงาน" ไม่ได้
--          ขึ้นข้อความ "ประเภทเอกสารไม่ถูกต้อง (CONTRACT_PROBATION)"
--
-- สาเหตุที่แท้จริง (2 ชั้น)
--   ชั้นที่ 1  njhr_doc_save (67_hr_doc_center.sql บรรทัด 248) มี whitelist 7 ประเภท
--             และ 69_doc_type_contract_probation.sql ระบุไว้เองว่า "ไม่แตะ njhr_doc_save"
--             → บล็อกตั้งแต่ก่อนถึง INSERT constraint ไม่มีโอกาสทำงาน
--   ชั้นที่ 2  ของที่ 69 ทำไว้ถูกลบทิ้งได้ง่าย เพราะ 67 ข้อ 1 สั่ง drop constraint
--             ทุกตัวที่มีคำว่า doc_type แล้วสร้างใหม่เป็น 7 ประเภท และ create or replace
--             ทับ njhr_doc_prefix ด้วย → รัน 67 ซ้ำเมื่อไร CONTRACT_PROBATION หายทันที
--
-- ไฟล์นี้จึงซ่อมครบทั้ง 3 จุดในครั้งเดียว รันซ้ำได้ ไม่ต้องรัน 69 ก่อน
--   1) check constraint njhr_empdoc_type_chk  → 8 ประเภท
--   2) njhr_doc_prefix                        → รู้จัก CTP
--   3) njhr_doc_save                          → whitelist 8 ประเภท
--
-- ไม่ทำอะไร
--   · ไม่แตะตรรกะอื่นใน njhr_doc_save เลยแม้แต่บรรทัดเดียว (diff = 1 เงื่อนไข)
--   · ไม่แตะ requires_signature (true เฉพาะ CONTRACT ตามเดิม — ดูหมายเหตุท้ายไฟล์)
--   · ไม่แตะโครงตาราง ไม่แตะ RPC อื่น ไม่แตะเอกสารที่ออกไปแล้วทุกฉบับ
--   · ไม่แตะ constraint ของ status (คนละตัว)
--
-- ต้องรัน 67_hr_doc_center.sql มาก่อน · รันซ้ำได้
-- ⚠ ถ้าในอนาคตรัน 67 ซ้ำอีก ต้องกลับมารันไฟล์นี้ทุกครั้ง
-- ============================================================

-- ─── 0) PRE-FLIGHT + รายงานสภาพก่อนแก้ ──────────────────────
do $$
declare v_con text; v_pre text;
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents — ต้องรัน 60/67 ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'njhr_doc_save') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_save — ต้องรัน 67_hr_doc_center.sql ก่อน';
  end if;

  select pg_get_constraintdef(con.oid) into v_con from pg_constraint con
    join pg_class r on r.oid = con.conrelid
   where r.relname = 'njhr_emp_documents' and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%doc_type%' limit 1;
  begin
    v_pre := public.njhr_doc_prefix('CONTRACT_PROBATION');
  exception when others then v_pre := '(ไม่มีฟังก์ชัน)';
  end;

  raise notice 'ก่อนแก้ · constraint = %', coalesce(v_con, '(ไม่มี)');
  raise notice 'ก่อนแก้ · prefix CONTRACT_PROBATION = %', v_pre;
  raise notice 'ก่อนแก้ · เอกสารเดิมในระบบ % ฉบับ (จะไม่ถูกแตะ)',
    (select count(*) from public.njhr_emp_documents);
end $$;


-- ─── 1) ประเภทเอกสาร 8 ประเภท (เหมือน 69 ข้อ 1 · รันซ้ำได้) ──
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
      ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','COE','SALARY_CERT','SEPARATION',
       'CONTRACT_PROBATION'));
end $$;


-- ─── 2) คำนำหน้าเลขที่เอกสาร (เหมือน 69 ข้อ 2 · รันซ้ำได้) ───
create or replace function public.njhr_doc_prefix(p_type text)
returns text language sql immutable as $$
  select case upper(coalesce(p_type,''))
    when 'CONTRACT'           then 'EMP'
    when 'CONTRACT_PROBATION' then 'CTP'
    when 'WARNING'            then 'WR'
    when 'SUSPENSION'         then 'SUS'
    when 'PROBATION_RESULT'   then 'PAS'
    when 'COE'                then 'COE'
    when 'SALARY_CERT'        then 'SAL'
    when 'SEPARATION'         then 'SEP'
    else 'DOC' end;
$$;


-- ─── 3) njhr_doc_save (ของเดิมทั้งดุ้น · แก้เฉพาะ whitelist) ──
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
    if v_type not in ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','COE','SALARY_CERT',
                      'SEPARATION','CONTRACT_PROBATION') then
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

grant execute on function public.njhr_doc_prefix(text) to anon, authenticated;
grant execute on function public.njhr_doc_save(text,uuid,text,uuid,text,text,date,jsonb,uuid)
  to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v12.2-doc-save-ctp', 'njhr_doc_save + constraint + prefix รับ CONTRACT_PROBATION ครบ 8 ประเภท')
on conflict (version) do nothing;


-- ─── 4) VERIFICATION — ต้องได้ true ทั้ง 3 ข้อ ───────────────
select jsonb_pretty(jsonb_build_object(
  'ok_constraint', (select pg_get_constraintdef(con.oid) like '%CONTRACT_PROBATION%'
                      from pg_constraint con join pg_class r on r.oid = con.conrelid
                     where r.relname = 'njhr_emp_documents'
                       and con.conname = 'njhr_empdoc_type_chk'),
  'ok_prefix',     (public.njhr_doc_prefix('CONTRACT_PROBATION') = 'CTP'),
  'ok_doc_save',   (select pg_get_functiondef(p.oid) like '%''SEPARATION'',''CONTRACT_PROBATION''%'
                      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'public' and p.proname = 'njhr_doc_save'),
  'constraint_def', (select pg_get_constraintdef(con.oid) from pg_constraint con
                       join pg_class r on r.oid = con.conrelid
                      where r.relname = 'njhr_emp_documents'
                        and con.conname = 'njhr_empdoc_type_chk'),
  'เลขที่ถัดไป_CTP', public.njhr_doc_next_no('CONTRACT_PROBATION'),
  'เอกสารเดิมไม่ถูกแตะ', (select count(*) from public.njhr_emp_documents),
  'แยกตามประเภท', coalesce((select jsonb_object_agg(doc_type, n) from
      (select doc_type, count(*) n from public.njhr_emp_documents group by doc_type) t), '{}'::jsonb)
)) as install_report;


-- ─── หมายเหตุ (ยังไม่ได้ทำ — เปิดใช้เองเมื่อยืนยัน) ──────────
-- ปัจจุบัน requires_signature ถูกตั้งเป็น true เฉพาะ CONTRACT เท่านั้น (ตรรกะเดิมของ 67)
-- ถ้าต้องการให้ CONTRACT_PROBATION ต้องลงนามด้วย ให้แก้บรรทัดในข้อ 3 จาก
--   (v_type = 'CONTRACT')
-- เป็น
--   (v_type in ('CONTRACT','CONTRACT_PROBATION'))
-- แล้วรันไฟล์นี้ใหม่ — มีผลกับเอกสารที่สร้างใหม่เท่านั้น ฉบับเดิมไม่เปลี่ยน
