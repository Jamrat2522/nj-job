-- ============================================================
-- NJ HR V.10 — 70_doc_emp_allowance.sql   [แก้ไข: ไม่เดาชื่อคอลัมน์]
-- เพิ่มค่าตอบแทนประจำเข้าไปใน njhr_doc_emp_profile สำหรับ "หนังสือรับรองเงินเดือน"
--
-- ⚠ รอบก่อนหยุดทำงานเพราะไม่พบคอลัมน์ employees.allowance — ถูกต้องแล้ว
--   ไฟล์นี้จึงเปลี่ยนวิธี: อ่านค่าผ่าน to_jsonb(e) ->> 'ชื่อคอลัมน์'
--   ซึ่งคืน NULL เมื่อไม่มีคอลัมน์นั้น (ไม่ error) → ใช้ได้กับทุกสคีมา
--   คอลัมน์ไหนมีจริงก็ดึงมาใช้ · ไม่มีก็เป็น 0 แล้วให้ HR กรอกในฟอร์มเอง
--
-- ไม่สร้างคอลัมน์ใหม่ · ไม่แตะโครงตาราง · ไม่แตะเอกสารที่ออกไปแล้ว
-- ต้องรัน 67_hr_doc_center.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT (ไม่หยุดการติดตั้ง เพียงรายงานให้ทราบ) ───
do $$
declare cols text;
begin
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employees';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_doc_emp_profile') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_doc_emp_profile — ต้องรัน 67_hr_doc_center.sql ก่อน';
  end if;
  select string_agg(column_name || ' (' || data_type || ')', ', ' order by column_name)
    into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'employees'
     and (data_type in ('numeric','integer','bigint','double precision','real')
          or column_name ~* 'salary|wage|allow|income|pay');
  raise notice 'PREFLIGHT ผ่าน · คอลัมน์เกี่ยวกับค่าตอบแทนที่มีจริงในตาราง employees: %',
    coalesce(cols, '(ไม่พบเลย)');
end $$;


-- ─── 1) njhr_doc_emp_profile (คืนค่าเดิมครบ + ค่าตอบแทนแบบยืดหยุ่น) ───
-- to_jsonb(e) ->> 'x'  = อ่านคอลัมน์ x ถ้ามี · คืน NULL ถ้าไม่มี (ปลอดภัยทุกสคีมา)
create or replace function public.njhr_doc_emp_profile(p_token text, p_employee uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_doc_guard(p_token, true);
  return query
  with e as (select * from public.employees x where x.id = p_employee),
  j as (select to_jsonb(e) t from e)
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
    -- ค่าตอบแทนประจำ: ดึงจากคอลัมน์ที่มีจริงเท่านั้น ไม่มีก็เป็น 0
    'allowance',          coalesce(nullif(j.t->>'allowance','')::numeric, 0),
    'position_allowance', coalesce(nullif(j.t->>'position_allowance','')::numeric, 0),
    'phone_allowance',    coalesce(nullif(j.t->>'phone_allowance','')::numeric, 0),
    'travel_allowance',   coalesce(nullif(j.t->>'travel_allowance','')::numeric, 0),
    'supervisor_id', e.supervisor_id,
    'supervisor_name', (select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'')
                          from public.employees s where s.id = e.supervisor_id),
    'supervisor_position', (select coalesce(s.position_name,'')
                              from public.employees s where s.id = e.supervisor_id),
    'company', (select o.company_name from public.njhr_org_profile o where o.id = 1)
  )
  from e, j;
end $$;

grant execute on function public.njhr_doc_emp_profile(text,uuid) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v12.2-doc-emp-allowance', 'njhr_doc_emp_profile คืนค่าตอบแทนประจำแบบยืดหยุ่นตามสคีมาจริง')
on conflict (version) do nothing;


-- ─── 2) VERIFICATION + รายงานคอลัมน์จริง ────────────────────
select jsonb_pretty(jsonb_build_object(
  'คอลัมน์ค่าตอบแทนที่มีจริงใน employees',
    coalesce((select jsonb_agg(column_name order by column_name)
                from information_schema.columns
               where table_schema='public' and table_name='employees'
                 and (data_type in ('numeric','integer','bigint','double precision','real')
                      or column_name ~* 'salary|wage|allow|income|pay')), '[]'::jsonb),
  'คอลัมน์ทั้งหมดของ employees',
    coalesce((select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='employees'), '[]'::jsonb),
  'employees_untouched', (select count(*) from public.employees),
  'documents_untouched', (select count(*) from public.njhr_emp_documents),
  'function_ok', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                   where n.nspname='public' and p.proname='njhr_doc_emp_profile')
)) as install_report;
-- 👉 กรุณาส่งค่า "คอลัมน์ค่าตอบแทนที่มีจริงใน employees" กลับมา
--    ถ้ามีคอลัมน์ค่าตอบแทนชื่ออื่นนอกจาก base_salary จะได้ผูกให้ตรงชื่อจริง

-- ─── 3) ROLLBACK ────────────────────────────────────────────
-- รัน njhr_doc_emp_profile เวอร์ชันเดิมจาก 67_hr_doc_center.sql ทับกลับได้ทันที
