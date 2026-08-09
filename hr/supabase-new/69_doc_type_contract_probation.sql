-- ============================================================
-- NJ HR V.10 — 69_doc_type_contract_probation.sql
-- เพิ่มประเภทเอกสาร "สัญญาจ้างงานและข้อตกลงทดลองงาน" (CONTRACT_PROBATION)
--
-- ทำอะไร
--   1) ขยาย check constraint njhr_emp_documents.doc_type ให้รับค่าใหม่ 1 ค่า
--   2) เพิ่มคำนำหน้าเลขที่เอกสาร CTP ให้ njhr_doc_prefix (เลขรันต่อเนื่องแยกของตัวเอง)
--
-- ไม่ทำอะไร
--   · ไม่แตะประเภทเอกสารเดิมทั้ง 7 ประเภท และเอกสารที่ออกไปแล้วทุกฉบับ
--   · ไม่แตะโครงตาราง ไม่เพิ่ม/ลบคอลัมน์ ไม่แตะ RPC อื่น
--   · ไม่แตะ njhr_doc_save / _flow / _respond / _center_list / _detail
--
-- ต้องรัน 67_hr_doc_center.sql มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.njhr_emp_documents') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_documents — ต้องรัน 60/67 ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_prefix') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_prefix — ต้องรัน 67_hr_doc_center.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · เอกสารเดิมในระบบ % ฉบับ (จะไม่ถูกแตะ)',
    (select count(*) from public.njhr_emp_documents);
end $$;


-- ─── 1) ขยายประเภทเอกสารเป็น 8 ประเภท ────────────────────────
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


-- ─── 2) คำนำหน้าเลขที่เอกสารของประเภทใหม่ ───────────────────
-- CTP-2026-000001 — นับแยกจากประเภทอื่น เลขเดิมทุกประเภทไม่ถูกกระทบ
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

insert into public.njhr_schema_version(version, note)
values ('v12.1-doc-contract-probation', 'เพิ่มประเภทเอกสาร สัญญาจ้างงานและข้อตกลงทดลองงาน (CTP)')
on conflict (version) do nothing;


-- ─── 3) VERIFICATION ────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'doc_type_constraint', (select pg_get_constraintdef(con.oid) from pg_constraint con
                            join pg_class r on r.oid=con.conrelid
                           where r.relname='njhr_emp_documents' and con.conname='njhr_empdoc_type_chk'),
  'ตัวอย่างเลขที่ถัดไป', jsonb_build_object(
      'CONTRACT_PROBATION', public.njhr_doc_next_no('CONTRACT_PROBATION'),
      'CONTRACT',           public.njhr_doc_next_no('CONTRACT'),
      'WARNING',            public.njhr_doc_next_no('WARNING')),
  'เอกสารเดิมไม่ถูกแตะ',   (select count(*) from public.njhr_emp_documents),
  'แยกตามประเภท', coalesce((select jsonb_object_agg(doc_type, n) from
      (select doc_type, count(*) n from public.njhr_emp_documents group by doc_type) t), '{}'::jsonb)
)) as install_report;


-- ─── 4) ROLLBACK ────────────────────────────────────────────
-- ⚠ ถ้ามีเอกสาร CONTRACT_PROBATION ออกไปแล้ว ต้องย้าย/ลบก่อนจึงจะย้อนกลับได้
-- alter table public.njhr_emp_documents drop constraint njhr_empdoc_type_chk;
-- alter table public.njhr_emp_documents add constraint njhr_empdoc_type_chk check (doc_type in
--   ('CONTRACT','WARNING','SUSPENSION','PROBATION_RESULT','COE','SALARY_CERT','SEPARATION'));
-- แล้วรัน njhr_doc_prefix เวอร์ชันเดิมจาก 67_hr_doc_center.sql
