-- ============================================================
-- C1_inspect_activation_flow.sql
-- ตรวจก่อนเปลี่ยนตัวจับคู่สมัครสมาชิกเป็น emp_code + last_name_en
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--   รันซ้ำได้ไม่จำกัด · ไม่แตะข้อมูล Production
--
-- ทำไมต้องตรวจ:
--   SQL ของ njhr_activation_submit / _list / _link / _reject ไม่มีอยู่ในโปรเจกต์เลย
--   (ค้น supabase/ 24 ไฟล์ + supabase-new/ 60 ไฟล์ แล้วไม่พบ)
--   จึงต้องอ่าน Definition จริงจาก Production ก่อน ห้ามเดา Signature
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON ทั้งก้อนกลับมา
-- ============================================================

with

-- ─── 1) โครงสร้าง employees เฉพาะคอลัมน์ที่ Flow นี้ใช้ ──────
b1 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type,
           'nullable', c.is_nullable, 'default', c.column_default)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'employees'
     and c.column_name in ('id','emp_code','prefix','first_name','last_name',
                           'first_name_en','last_name_en','nickname','email',
                           'department_id','department_name','position_name','status')),

-- ─── 2) คุณภาพข้อมูล last_name_en — ตัวจับคู่ตัวใหม่ ─────────
--     **บล็อกชี้ขาด** ถ้าว่างเยอะ พนักงานกลุ่มนั้นจะสมัครไม่ได้เลย
b2 as (
  select jsonb_build_object(
    'employees_total',            (select count(*) from public.employees),
    'employees_active',           (select count(*) from public.employees where status::text = 'ACTIVE'),
    'last_name_en_empty',         (select count(*) from public.employees
                                    where coalesce(btrim(last_name_en),'') = ''),
    'last_name_en_empty_active',  (select count(*) from public.employees
                                    where coalesce(btrim(last_name_en),'') = '' and status::text = 'ACTIVE'),
    'last_name_en_filled',        (select count(*) from public.employees
                                    where coalesce(btrim(last_name_en),'') <> ''),
    'last_name_en_has_thai',      (select count(*) from public.employees
                                    where coalesce(last_name_en,'') ~ '[ก-๙]'),
    'last_name_en_multiword',     (select count(*) from public.employees
                                    where btrim(coalesce(last_name_en,'')) ~ '\s'),
    'last_name_en_has_space_pad', (select count(*) from public.employees
                                    where last_name_en is not null and last_name_en <> btrim(last_name_en))
  ) as j),

-- ─── 2d) แยกพนักงานตามเส้นทางการสมัคร (CASE A / CASE B) ─────
--      CASE A = last_name_en มีค่า → ต้อง Exact Match หลัง Normalize
--      CASE B = last_name_en ว่าง  → รับค่าที่พนักงานกรอก รอ SUPER_ADMIN ตรวจ
b2d as (
  select jsonb_build_object(
    'case_a_exact_match_required',
      (select count(*) from public.employees e
        where coalesce(btrim(e.last_name_en),'') <> ''
          and not exists (select 1 from public.app_users u
                           where u.app_code='salary' and u.employee_id = e.id)),
    'case_b_superadmin_review',
      (select count(*) from public.employees e
        where coalesce(btrim(e.last_name_en),'') = ''
          and not exists (select 1 from public.app_users u
                           where u.app_code='salary' and u.employee_id = e.id)),
    'already_linked_no_register_needed',
      (select count(*) from public.employees e
        where exists (select 1 from public.app_users u
                       where u.app_code='salary' and u.employee_id = e.id))
  ) as j),

-- ─── 2b) last_name_en ซ้ำ — กันจับคู่ผิดคน ───────────────────
--      emp_code เป็น unique อยู่แล้ว การซ้ำจึงไม่ทำให้จับคู่ผิด แต่ต้องรู้ภาพรวม
b2b as (
  select jsonb_build_object(
    'duplicate_groups', (select count(*) from (
        select lower(btrim(last_name_en)) k from public.employees
         where coalesce(btrim(last_name_en),'') <> ''
         group by 1 having count(*) > 1) x),
    'emp_code_duplicates', (select count(*) from (
        select btrim(emp_code) k from public.employees
         where coalesce(btrim(emp_code),'') <> ''
         group by 1 having count(*) > 1) y),
    'emp_code_with_leading_zero', (select count(*) from public.employees
                                    where btrim(coalesce(emp_code,'')) ~ '^0')
  ) as j),

-- ─── 2c) ตัวอย่างพนักงานที่ last_name_en ว่าง (20 รายแรก) ────
--      ห้ามเดาข้อมูลภาษาอังกฤษให้พนักงาน — ต้องให้ HR กรอกเอง
b2c as (
  select coalesce(jsonb_agg(x.o order by x.o->>'emp_code'), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'emp_code', e.emp_code,
                   'first_name', e.first_name, 'last_name', e.last_name,
                   'first_name_en', e.first_name_en, 'last_name_en', e.last_name_en,
                   'status', e.status::text,
                   'has_user', exists(select 1 from public.app_users u
                                       where u.app_code='salary' and u.employee_id = e.id)) as o
            from public.employees e
           where coalesce(btrim(e.last_name_en),'') = ''
           order by e.emp_code limit 20) x),

-- ─── 3) RPC Activation ที่มีจริง + Source เต็ม ───────────────
--     **ต้องอ่านก่อนแก้** ห้ามเดา Signature ห้ามสร้างซ้ำ
b3 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function',  p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns',   pg_get_function_result(p.oid),
           'owner',     pg_get_userbyid(p.proowner),
           'security_definer', p.prosecdef,
           'source',    pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname like 'njhr_activation%'),

-- ─── 4) ตาราง Request จริง — คอลัมน์ครบทุกตัว ───────────────
--     ต้องรู้ว่ามีที่เก็บ first_name_en / last_name_en / ชื่อไทย ที่พนักงานกรอกหรือยัง
b4 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type,
           'nullable', c.is_nullable, 'default', c.column_default)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'njhr_activation_requests'),

-- ─── 4b) Constraint / Index บนตาราง Request ─────────────────
b4b as (
  select jsonb_build_object(
    'indexes', (select coalesce(jsonb_agg(jsonb_build_object(
                   'name', i.relname, 'unique', idx.indisunique,
                   'definition', pg_get_indexdef(idx.indexrelid)) order by i.relname), '[]'::jsonb)
                  from pg_index idx join pg_class i on i.oid = idx.indexrelid
                 where idx.indrelid = 'public.njhr_activation_requests'::regclass),
    'checks',  (select coalesce(jsonb_agg(jsonb_build_object(
                   'name', con.conname, 'definition', pg_get_constraintdef(con.oid))
                 order by con.conname), '[]'::jsonb)
                  from pg_constraint con
                 where con.conrelid = 'public.njhr_activation_requests'::regclass
                   and con.contype in ('c','u'))
  ) as j),

-- ─── 5) สถานะคำขอปัจจุบัน ────────────────────────────────────
b5 as (
  select jsonb_build_object(
    'by_status', (select coalesce(jsonb_object_agg(t.status, t.n), '{}'::jsonb)
                    from (select status, count(*) n
                            from public.njhr_activation_requests group by status) t),
    'total',     (select count(*) from public.njhr_activation_requests)
  ) as j),

-- ─── 6) สถิติ 3 สถานะตาม Flow ใหม่ ───────────────────────────
--     รอสมัคร = employees ที่ยังไม่มี USER และไม่มีคำขอค้าง
b6 as (
  select jsonb_build_object(
    'employees_total',   (select count(*) from public.employees),
    'linked',            (select count(*) from public.employees e
                           where exists (select 1 from public.app_users u
                                          where u.app_code='salary' and u.employee_id = e.id)),
    'pending_request',   (select count(distinct r.employee_id) from public.njhr_activation_requests r
                           where upper(coalesce(r.status,'')) = 'PENDING'),
    'waiting_register',  (select count(*) from public.employees e
                           where not exists (select 1 from public.app_users u
                                              where u.app_code='salary' and u.employee_id = e.id)
                             and not exists (select 1 from public.njhr_activation_requests r
                                              where r.employee_id = e.id
                                                and upper(coalesce(r.status,'')) = 'PENDING'))
  ) as j),

-- ─── 7) Unique index ที่รับประกัน 1 employee = 1 USER ────────
b7 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', i.relname, 'unique', idx.indisunique,
           'definition', pg_get_indexdef(idx.indexrelid)) order by i.relname), '[]'::jsonb) as j
    from pg_index idx join pg_class i on i.oid = idx.indexrelid
   where idx.indrelid = 'public.app_users'::regclass and idx.indisunique),

-- ─── 8) njhr_list_users ปัจจุบัน — ต้องรู้ก่อนเปลี่ยนหน้า ────
b8 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns', pg_get_function_result(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('njhr_list_users','njhr_user_stats')),

-- ─── 9) Username ที่เป็นรหัสพนักงานอยู่แล้วหรือไม่ ───────────
--     Flow ใหม่กำหนด username = emp_code · ต้องรู้ว่าชนของเดิมไหม
b9 as (
  select jsonb_build_object(
    'salary_users',            (select count(*) from public.app_users where app_code='salary'),
    'username_equals_empcode', (select count(*) from public.app_users u
                                 join public.employees e on e.id = u.employee_id
                                where u.app_code='salary'
                                  and lower(btrim(u.username)) = lower(btrim(e.emp_code))),
    'empcode_taken_as_username_by_other',
       (select count(*) from public.employees e
         where exists (select 1 from public.app_users u
                        where u.app_code='salary'
                          and lower(btrim(u.username)) = lower(btrim(e.emp_code))
                          and (u.employee_id is null or u.employee_id <> e.id)))
  ) as j)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',                 now(),
  '1_employees_name_columns',     (select j from b1),
  '2_last_name_en_quality',       (select j from b2),
  '2b_duplicates',                (select j from b2b),
  '2d_register_paths',            (select j from b2d),
  '2c_sample_missing_last_name_en',(select j from b2c),
  '3_activation_rpcs',            (select j from b3),
  '4_activation_request_columns', (select j from b4),
  '4b_activation_constraints',    (select j from b4b),
  '5_request_status_counts',      (select j from b5),
  '6_three_state_counts',         (select j from b6),
  '7_app_users_unique_indexes',   (select j from b7),
  '8_list_users_rpc',             (select j from b8),
  '9_username_vs_empcode',        (select j from b9),
  'employees_last_name_en_missing_requires_superadmin_review',
     (select (j->>'last_name_en_empty_active')::int from b2),
  'NOTE', 'last_name_en ว่าง = สมัครได้ (CASE B) แต่ SUPER_ADMIN ต้องตรวจนามสกุลอังกฤษก่อนกดเชื่อม'
)) as inspection_report;
