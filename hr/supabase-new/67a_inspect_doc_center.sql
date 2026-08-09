-- ============================================================
-- NJ HR V.10 — 67a_inspect_doc_center.sql
-- ตรวจสถานะ "ระบบเอกสารพนักงาน" ก่อนติดตั้งศูนย์จัดการเอกสาร HR
--
-- อ่านอย่างเดียว 100% — ไม่สร้าง ไม่แก้ ไม่ลบอะไรทั้งสิ้น
-- ผลลัพธ์ออกมาเป็นก้อน JSON ก้อนเดียว คัดลอกส่งกลับมาได้เลย
-- ปิดบัง: ไม่แสดงเนื้อหาเอกสาร (body) และไม่แสดง IP เต็ม
-- ============================================================

select jsonb_pretty(jsonb_build_object(

  'ตารางที่มีอยู่', jsonb_build_object(
    'njhr_emp_documents',           to_regclass('public.njhr_emp_documents')     is not null,
    'njhr_emp_doc_acks',            to_regclass('public.njhr_emp_doc_acks')      is not null,
    'njhr_emp_doc_events (ของใหม่)', to_regclass('public.njhr_emp_doc_events')   is not null,
    'employee_documents (ของแอปอื่น ห้ามแตะ)', to_regclass('public.employee_documents') is not null
  ),

  'จำนวนเอกสารทั้งหมด', case when to_regclass('public.njhr_emp_documents') is null then null
    else (select count(*) from public.njhr_emp_documents) end,

  'จำนวนการรับทราบ', case when to_regclass('public.njhr_emp_doc_acks') is null then null
    else (select count(*) from public.njhr_emp_doc_acks) end,

  -- ⭐ คำถามหลัก: มีเลขที่เอกสารรูปแบบเดิม (NJ-YYYYMMDD####) ออกไปแล้วกี่ฉบับ
  'เลขที่เอกสาร', case when to_regclass('public.njhr_emp_documents') is null then null else
    (select jsonb_build_object(
       'รูปแบบเดิม NJ-YYYYMMDD####', count(*) filter (where doc_no ~ '^NJ-\d{8}\d{4}$'),
       'รูปแบบใหม่ XXX-YYYY-000000', count(*) filter (where doc_no ~ '^[A-Z]{2,3}-\d{4}-\d{6}$'),
       'รูปแบบอื่น',                 count(*) filter (where doc_no !~ '^NJ-\d{8}\d{4}$'
                                                        and doc_no !~ '^[A-Z]{2,3}-\d{4}-\d{6}$'),
       'เลขแรกสุด', min(doc_no), 'เลขล่าสุด', max(doc_no))
       from public.njhr_emp_documents) end,

  'แยกตามประเภท', case when to_regclass('public.njhr_emp_documents') is null then null else
    coalesce((select jsonb_object_agg(doc_type, n) from
      (select doc_type, count(*) n from public.njhr_emp_documents group by doc_type) t), '{}'::jsonb) end,

  'แยกตามสถานะ', case when to_regclass('public.njhr_emp_documents') is null then null else
    coalesce((select jsonb_object_agg(status, n) from
      (select status, count(*) n from public.njhr_emp_documents group by status) t), '{}'::jsonb) end,

  'ช่วงวันที่ออกเอกสาร', case when to_regclass('public.njhr_emp_documents') is null then null else
    (select jsonb_build_object('เร็วสุด', min(issued_at)::date, 'ล่าสุด', max(issued_at)::date)
       from public.njhr_emp_documents) end,

  'เอกสารที่ถูกล็อกแล้ว (รับทราบ/ลงนาม)', case when to_regclass('public.njhr_emp_documents') is null then null
    else (select count(*) from public.njhr_emp_documents where locked_at is not null) end,

  -- ข้อจำกัดปัจจุบันของคอลัมน์ (ต้องรู้ก่อนขยายเป็น 7 ประเภท / 9 สถานะ)
  'CHECK constraint ปัจจุบัน', coalesce((
    select jsonb_object_agg(con.conname, pg_get_constraintdef(con.oid))
      from pg_constraint con join pg_class r on r.oid = con.conrelid
     where r.relname in ('njhr_emp_documents','njhr_emp_doc_acks') and con.contype = 'c'), '{}'::jsonb),

  'คอลัมน์ njhr_emp_documents', coalesce((
    select jsonb_agg(column_name order by ordinal_position) from information_schema.columns
     where table_schema='public' and table_name='njhr_emp_documents'), '[]'::jsonb),

  'ฟังก์ชัน njhr_doc_* ที่มีอยู่', coalesce((
    select jsonb_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' order by p.proname)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname='public' and p.proname like 'njhr\_doc\_%'), '[]'::jsonb),

  -- ข้อมูลพนักงานที่ Template ต้องใช้ (ตรวจว่ากรอกครบพอจะออกเอกสารได้ไหม)
  'ความพร้อมข้อมูลพนักงาน', (select jsonb_build_object(
      'พนักงานที่ยังทำงานอยู่', count(*) filter (where status::text='ACTIVE'),
      'ไม่มีตำแหน่ง',          count(*) filter (where status::text='ACTIVE' and coalesce(btrim(position_name),'')=''),
      'ไม่มีแผนก',             count(*) filter (where status::text='ACTIVE' and coalesce(btrim(department_name),'')=''),
      'ไม่มีวันเริ่มงาน',      count(*) filter (where status::text='ACTIVE' and start_date is null),
      'ไม่มีผู้บังคับบัญชา',   count(*) filter (where status::text='ACTIVE' and supervisor_id is null),
      'เงินเดือนเป็น 0',       count(*) filter (where status::text='ACTIVE' and coalesce(base_salary,0)=0))
    from public.employees),

  'Storage bucket ลายเซ็น', case when to_regclass('storage.buckets') is null then null
    else (select jsonb_build_object('มี', count(*) > 0,
                 'public', bool_or(public)) from storage.buckets where id='njhr-signatures') end,

  'schema_version ที่ติดตั้งแล้ว', coalesce((
    select jsonb_agg(version order by version) from public.njhr_schema_version), '[]'::jsonb)

)) as doc_center_preflight;
