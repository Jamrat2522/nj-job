-- ============================================================
-- STEP 2: ตรวจตาราง HR/ลา ที่ "มีอยู่แล้ว" ในโปรเจกต์ (อ่านอย่างเดียว 100%)
-- รันคำสั่งเดียว → copy ผล JSON ส่งกลับมา
-- ============================================================
select jsonb_pretty(jsonb_build_object(

  -- (A) โครงสร้างจริงของตารางระบบลา/เวลาทำงานที่มีอยู่แล้ว
  'columns', (select jsonb_object_agg(table_name, cols) from (
      select table_name, jsonb_agg(jsonb_build_object('c', column_name, 'type',
               case when data_type='USER-DEFINED' then udt_name else data_type end,
               'null', is_nullable, 'def', column_default) order by ordinal_position) cols
      from information_schema.columns
      where table_schema='public'
        and table_name in ('leave_requests','leave_attachments','leave_approvers','leave_types',
                           'ot_requests','attendance','attendance_logs','work_shifts','employee_shifts',
                           'approval_settings','approval_type_rules','positions','system_settings',
                           'employee_master','payroll_records','payslips')
      group by table_name) x),

  -- (B) จำนวนแถวจริง (reltuples = -1 แปลว่ายังไม่เคย analyze ไม่ใช่ว่าง)
  'exact_counts', jsonb_build_object(
     'employees',        (select count(*) from public.employees),
     'departments',      (select count(*) from public.departments),
     'leave_types',      (select count(*) from public.leave_types),
     'leave_requests',   (select count(*) from public.leave_requests),
     'leave_attachments',(select count(*) from public.leave_attachments),
     'leave_approvers',  (select count(*) from public.leave_approvers),
     'ot_requests',      (select count(*) from public.ot_requests),
     'attendance',       (select count(*) from public.attendance),
     'holidays',         (select count(*) from public.holidays),
     'work_shifts',      (select count(*) from public.work_shifts),
     'notifications',    (select count(*) from public.notifications),
     'app_users',        (select count(*) from public.app_users)),

  -- (C) ค่า enum จริงของ role และ status (ห้ามใส่ค่ามั่ว)
  'enums', (select jsonb_object_agg(t.typname, vals) from (
      select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) vals
      from pg_type t join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace where n.nspname='public'
      group by t.typname) t),

  -- (D) RLS policy ที่ใช้อยู่จริงกับตารางกลุ่ม HR (ห้ามไปทับ)
  'policies', (select jsonb_agg(jsonb_build_object('t', tablename, 'name', policyname,
                 'cmd', cmd, 'using', qual, 'check', with_check) order by tablename, policyname)
               from pg_policies where schemaname='public'
                 and tablename in ('employees','app_users','leave_requests','leave_types',
                                   'leave_attachments','attendance','notifications','audit_log','holidays')),

  -- (E) ตัวอย่างข้อมูลจริงเพื่อดูรูปแบบค่า (ไม่มีข้อมูลอ่อนไหว)
  'sample_leave_types', (select jsonb_agg(to_jsonb(x)) from (select * from public.leave_types limit 10) x),
  'sample_app_user_roles', (select jsonb_agg(distinct role::text) from public.app_users),
  'sample_emp', (select jsonb_agg(to_jsonb(y)) from
                  (select emp_code, first_name, department_name, position_name, status::text,
                          work_start, work_end, leave_sick, leave_personal, leave_vacation
                   from public.employees limit 3) y),

  -- (F) auth: มีกี่คนที่ผูกกับ Supabase Auth แล้ว (ตัดสินวิธีทำ RLS)
  'auth_linked', jsonb_build_object(
     'app_users_total',      (select count(*) from public.app_users),
     'app_users_with_auth',  (select count(*) from public.app_users where auth_id is not null),
     'auth_users_total',     (select count(*) from auth.users))
)) as step2;
