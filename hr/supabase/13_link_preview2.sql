-- อ่านอย่างเดียว 100% — ทุกคอลัมน์ตรวจกับผล inspection แล้ว
-- app_users มี: username, internal_username, email, full_name, app_code, role, department  (ไม่มี phone)
-- employees มี: emp_code, first_name, last_name, first_name_en, last_name_en, email, phone, department_name
with u as (
  select lower(trim(username)) un,
         lower(trim(coalesce(internal_username,''))) iun,
         lower(trim(coalesce(email,''))) em,
         lower(trim(coalesce(full_name,''))) fn,
         app_code, role::text r
  from public.app_users),
e as (
  select emp_code,
         lower(trim(coalesce(first_name_en,''))) fen,
         lower(trim(coalesce(last_name_en,''))) len,
         lower(trim(coalesce(email,''))) em,
         first_name, last_name
  from public.employees)
select jsonb_pretty(jsonb_build_object(
  'fill_rate', jsonb_build_object(
     'emp_total',              (select count(*) from e),
     'emp_with_first_name_en', (select count(*) from e where fen <> ''),
     'emp_with_email',         (select count(*) from e where em <> ''),
     'user_total',             (select count(*) from u),
     'user_with_email',        (select count(*) from u where em <> '')),
  'match_by_email',     (select count(*) from u join e on u.em = e.em and u.em <> ''),
  'match_username_fen', (select count(*) from u join e on u.un = e.fen and e.fen <> ''),
  'match_fullname_fen', (select count(*) from u join e on u.fn = e.fen and e.fen <> ''),
  'match_iuser_prefix', (select count(*) from u join e on e.fen <> '' and u.iun like e.fen || '%'),
  'emp_code_formats', (select jsonb_object_agg(fmt, n) from
        (select case when emp_code ~ '^EMP[0-9]+$' then 'EMP####'
                     when emp_code ~ '^[0-9]+$'    then 'ตัวเลขล้วน'
                     else 'อื่น ๆ' end fmt, count(*) n
         from public.employees group by 1) f),
  'dup_names', (select count(*) from
        (select first_name, last_name from public.employees
          group by 1,2 having count(*) > 1) d),
  'sample_emp_en', (select jsonb_agg(to_jsonb(x)) from
        (select emp_code, first_name, first_name_en, email from public.employees limit 6) x),
  'users_salary_app', (select jsonb_agg(to_jsonb(y)) from
        (select username, internal_username, full_name, department, role::text
           from public.app_users where app_code='salary' limit 6) y)
)) as link2;
