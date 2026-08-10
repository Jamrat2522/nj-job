-- ============================================================
-- NJ HR V2 — M1_preflight_member_cutover.sql
-- PRE-FLIGHT ก่อน Cutover "บังคับพนักงานสมัครสมาชิกใหม่ทั้งหมด"
--
-- อ่านอย่างเดียว 100% · ไม่ UPDATE · ไม่ DELETE · ไม่สร้างตาราง · ไม่แก้ RPC
-- คำสั่งเดียวจบ คืน JSON ก้อนเดียว (SQL Editor ของ Supabase แสดงเฉพาะคำสั่งสุดท้าย)
--
-- ต้องได้ผลนี้ก่อนจึงจะเขียน Migration ตัวจริงได้
-- ถ้า SUPER_ADMIN ไม่เท่ากับ 2 บัญชี → STOP ห้าม Cutover
--
-- ชื่อทั้งหมดยืนยันจาก Source จริง ไม่ได้เดา:
--   app_users(app_code · username · internal_username · email · department ·
--             role · status · is_active · employee_id · password · password_hash)
--   employees(emp_code · prefix · first_name · last_name · department_name ·
--             position_name · status)
--   njhr_activation_requests(id · employee_id · status · requested_at)
--   njhr_member_list  C2_activation_en.sql:397
--   njhr_activation_submit / njhr_activation_link  C2_activation_en.sql:105 / 262
--   njhr_user_link  52_users.sql:276
--   njhr_login  supabase/30_login_rpc.sql
-- ============================================================

select jsonb_pretty(jsonb_build_object(

  -- A) นับบัญชีตาม Role — ข้อ 2 ของ Prompt
  'A_accounts_by_role', (select jsonb_object_agg(r, n) from
    (select coalesce(role::text,'(null)') r, count(*) n
       from public.app_users where app_code = 'salary' group by 1) x),
  'A_accounts_total',
    (select count(*) from public.app_users where app_code = 'salary'),
  'A_accounts_linked',
    (select count(*) from public.app_users where app_code = 'salary' and employee_id is not null),
  'A_accounts_unlinked',
    (select count(*) from public.app_users where app_code = 'salary' and employee_id is null),

  -- B) SUPER_ADMIN ที่จะยกเว้น — ต้องได้ 2 บัญชี ไม่งั้น STOP
  --    แสดง username + emp_code เพื่อให้ยืนยันด้วยตาว่าเป็นคนที่ตั้งใจ
  'B_super_admins', (select jsonb_agg(jsonb_build_object(
      'username', u.username, 'internal_username', u.internal_username,
      'email', u.email, 'emp_code', e.emp_code,
      'emp_name', nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||
                               coalesce(e.last_name,'')),''),
      'is_active', coalesce(u.is_active,true), 'status', coalesce(u.status,'active'),
      'has_employee_id', (u.employee_id is not null),
      'password_mode', case when u.password_hash like '$2%' then 'BCRYPT'
                            when coalesce(u.password,'') <> '' then 'PLAINTEXT'
                            else 'NONE' end) order by u.username)
    from public.app_users u
    left join public.employees e on e.id = u.employee_id
   where u.app_code = 'salary' and u.role::text = 'SUPER_ADMIN'),
  'B_super_admin_count',
    (select count(*) from public.app_users where app_code='salary' and role::text='SUPER_ADMIN'),
  'B_STOP_IF_NOT_2',
    (select case when count(*) = 2 then 'OK — ดำเนินการต่อได้'
                 else 'STOP — SUPER_ADMIN ไม่เท่ากับ 2 บัญชี ห้าม Cutover' end
       from public.app_users where app_code='salary' and role::text='SUPER_ADMIN'),

  -- C) พนักงานตามสถานะจริง (ค่าจริงในข้อมูล ไม่ได้สมมติชื่อสถานะ)
  'C_employees_by_status', (select jsonb_object_agg(s, n) from
    (select coalesce(status::text,'(null)') s, count(*) n
       from public.employees group by 1) x),

  -- D) ขอบเขตที่จะถูกบังคับสมัครใหม่ = บัญชี salary ที่ไม่ใช่ SUPER_ADMIN
  --    และผูกกับพนักงานที่ยังใช้งานอยู่
  'D_cutover_scope', jsonb_build_object(
    'accounts_to_reset',
      (select count(*) from public.app_users u
        join public.employees e on e.id = u.employee_id
       where u.app_code='salary' and u.role::text <> 'SUPER_ADMIN'
         and e.status::text in ('ACTIVE','PROBATION')),
    'by_role', (select jsonb_object_agg(r, n) from
      (select u.role::text r, count(*) n from public.app_users u
         join public.employees e on e.id = u.employee_id
        where u.app_code='salary' and u.role::text <> 'SUPER_ADMIN'
          and e.status::text in ('ACTIVE','PROBATION') group by 1) x),
    'employees_active_without_account',
      (select count(*) from public.employees e
        where e.status::text in ('ACTIVE','PROBATION')
          and not exists (select 1 from public.app_users u
                           where u.app_code='salary' and u.employee_id = e.id)),
    'accounts_linked_to_resigned',
      (select count(*) from public.app_users u
        join public.employees e on e.id = u.employee_id
       where u.app_code='salary' and u.role::text <> 'SUPER_ADMIN'
         and e.status::text not in ('ACTIVE','PROBATION'))),

  -- E) Activation Request เดิม — ข้อ 28 (ห้าม Hard Delete ต้องปิดอย่างปลอดภัย)
  'E_activation_requests', (select jsonb_object_agg(s, n) from
    (select coalesce(status::text,'(null)') s, count(*) n
       from public.njhr_activation_requests group by 1) x),
  'E_activation_columns', (select jsonb_agg(jsonb_build_object(
      'column', column_name, 'type', data_type, 'nullable', is_nullable,
      'default', column_default) order by ordinal_position)
    from information_schema.columns
   where table_schema='public' and table_name='njhr_activation_requests'),

  -- F) app_users — คอลัมน์และ Constraint จริง (ข้อ 6: status เดิมพอไหม)
  'F_app_users_columns', (select jsonb_agg(jsonb_build_object(
      'column', column_name, 'type', data_type, 'nullable', is_nullable,
      'default', column_default) order by ordinal_position)
    from information_schema.columns
   where table_schema='public' and table_name='app_users'),
  'F_app_users_constraints', (select jsonb_agg(jsonb_build_object(
      'name', con.conname, 'type', con.contype, 'definition', pg_get_constraintdef(con.oid))
      order by con.conname)
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
   where ns.nspname='public' and rel.relname='app_users'),
  'F_app_users_status_values', (select jsonb_object_agg(s, n) from
    (select coalesce(status,'(null)') s, count(*) n
       from public.app_users where app_code='salary' group by 1) x),
  'F_app_users_indexes', (select jsonb_agg(indexdef order by indexname)
    from pg_indexes where schemaname='public' and tablename='app_users'),

  -- G) Username จะชนกันไหมเมื่อเปลี่ยนเป็น emp_code — ข้อ 21–22
  'G_username_conflicts', (select jsonb_agg(jsonb_build_object(
      'emp_code', e.emp_code,
      'emp_name', nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||
                               coalesce(e.last_name,'')),''),
      'username_taken_by', u2.username,
      'taken_by_emp_code', e2.emp_code,
      'same_person', (u2.employee_id = e.id)) order by e.emp_code)
    from public.employees e
    join public.app_users u2
      on u2.app_code='salary' and lower(u2.username) = lower(e.emp_code)
    left join public.employees e2 on e2.id = u2.employee_id
   where e.status::text in ('ACTIVE','PROBATION')
     and (u2.employee_id is distinct from e.id)),
  'G_emp_code_duplicates', (select jsonb_agg(jsonb_build_object('emp_code', c, 'n', n))
    from (select emp_code c, count(*) n from public.employees
           where status::text in ('ACTIVE','PROBATION')
           group by 1 having count(*) > 1) x),
  'G_emp_code_null_or_blank',
    (select count(*) from public.employees
      where status::text in ('ACTIVE','PROBATION') and coalesce(btrim(emp_code),'') = ''),

  -- H) Email ซ้ำ — ข้อ 13
  'H_email_duplicates', (select jsonb_agg(jsonb_build_object('email', em, 'n', n))
    from (select lower(email) em, count(*) n from public.app_users
           where app_code='salary' and coalesce(email,'') <> ''
           group by 1 having count(*) > 1) x),

  -- I) Session — ต้องรู้ว่าเก็บที่ไหนก่อนจะ revoke (ข้อ 8)
  'I_session_tables', (select jsonb_agg(table_name order by table_name)
    from information_schema.tables
   where table_schema='public'
     and (table_name ilike '%session%' or table_name ilike '%token%')),
  'I_session_columns_in_app_users', (select jsonb_agg(column_name order by column_name)
    from information_schema.columns
   where table_schema='public' and table_name='app_users'
     and (column_name ilike '%session%' or column_name ilike '%token%'
          or column_name ilike '%expire%')),

  -- J) ฟังก์ชันที่ต้องแก้ — ยืนยัน Signature จริงก่อนเขียนทับ (ข้อ 1)
  'J_functions', (select jsonb_agg(jsonb_build_object(
      'name', p.proname, 'args', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef, 'language', l.lanname) order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language  l on l.oid = p.prolang
   where n.nspname='public' and p.prokind='f'
     and p.proname in ('njhr_login','njhr_session_check','njhr_member_list',
                       'njhr_activation_submit','njhr_activation_link',
                       'njhr_activation_list','njhr_user_link','njhr_user_save')),

  -- K) นิยามเต็มของด่าน Login และ member_list — ต้องอ่านก่อนแก้ ห้ามเดา
  'K_njhr_login_def', (select pg_get_functiondef(p.oid)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname='njhr_login' limit 1),

  -- L) ตัวอย่างจริงที่ Prompt อ้างถึง (0276) — Before ของ Cutover
  'L_sample_0276', (select jsonb_agg(jsonb_build_object(
      'emp_code', e.emp_code,
      'emp_name', nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||
                               coalesce(e.last_name,'')),''),
      'emp_status', e.status::text, 'department', e.department_name,
      'username', u.username, 'role', u.role::text,
      'account_status', coalesce(u.status,'active'),
      'is_active', coalesce(u.is_active,true),
      'has_pending_request', exists(select 1 from public.njhr_activation_requests ar
                                     where ar.employee_id = e.id and ar.status='PENDING')))
    from public.employees e
    left join public.app_users u on u.employee_id = e.id and u.app_code='salary'
   where e.emp_code in ('0276','0004','0002','0001'))

)) as m1_preflight;
