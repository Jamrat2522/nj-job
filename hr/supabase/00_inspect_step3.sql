-- STEP 3 (อ่านอย่างเดียว): ต้องรู้ก่อนเขียน RLS — ฟังก์ชันสิทธิ์ที่ระบบเดิมใช้ทำงานยังไง
select jsonb_pretty(jsonb_build_object(
  'auth_funcs', (select jsonb_agg(jsonb_build_object('fn', p.proname, 'src', pg_get_functiondef(p.oid)))
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname='public' and p.proname in ('current_role_name','current_employee_id','current_app_user')),
  'leave_request_sample', (select jsonb_agg(to_jsonb(x)) from (select * from public.leave_requests limit 2) x),
  'leave_approvers_sample', (select jsonb_agg(to_jsonb(x)) from (select * from public.leave_approvers limit 4) x),
  'work_shifts_sample', (select jsonb_agg(to_jsonb(x)) from (select * from public.work_shifts) x),
  'hr_app_users', (select jsonb_agg(jsonb_build_object('app_code', app_code, 'n', c)) from
                    (select app_code, count(*) c from public.app_users group by app_code) t),
  'employees_linked_to_users', (select count(*) from public.app_users where employee_id is not null)
)) as step3;
