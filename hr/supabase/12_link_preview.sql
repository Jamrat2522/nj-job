-- อ่านอย่างเดียว 100%: ดูว่า app_users จับคู่กับ employees ได้กี่คน ก่อนตัดสินใจเขียนข้อมูล
-- (ยังไม่ update อะไรทั้งสิ้น)
with u as (select id, username, internal_username, full_name, app_code, role::text r from public.app_users),
     e as (select id, emp_code, first_name, last_name, department_name from public.employees)
select jsonb_pretty(jsonb_build_object(
  'total_app_users', (select count(*) from u),
  'total_employees', (select count(*) from e),
  -- จับคู่ด้วยชื่อเต็ม (ตัดช่องว่าง)
  'match_by_fullname', (select count(*) from u join e
      on replace(u.full_name,' ','') = replace(e.first_name||e.last_name,' ','')),
  -- จับคู่ด้วย emp_code ที่อาจอยู่ใน username / internal_username
  'match_by_code', (select count(*) from u join e
      on upper(coalesce(u.internal_username,u.username)) = upper(e.emp_code)),
  -- ตัวอย่างที่จับคู่ไม่ได้ (ดูรูปแบบข้อมูลจริง)
  'sample_users', (select jsonb_agg(to_jsonb(x)) from
      (select username, internal_username, full_name, app_code, r from u limit 8) x),
  'sample_emp_codes', (select jsonb_agg(emp_code) from (select emp_code from e limit 8) z)
)) as link_preview;
