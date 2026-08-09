-- ============================================================
-- NJ HR V.10 — 50_inspect_all.sql
-- ตรวจสอบโครงสร้างฐานข้อมูลจริงก่อนพัฒนาโมดูลที่เหลือ
--
-- ⚠️ ไฟล์นี้ "อ่านอย่างเดียว" ทั้งหมด — มีแต่ SELECT
--    ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE / GRANT แม้แต่คำสั่งเดียว
--    ไม่แตะข้อมูล ไม่แตะสิทธิ์ ไม่สร้างตารางหรือฟังก์ชันชั่วคราวใด ๆ
--
-- วิธีใช้: เปิด Supabase Dashboard → SQL Editor → วางทั้งไฟล์ → Run
--          แล้วคัดลอกผลลัพธ์ทุกส่วน (มี 10 ผลลัพธ์) ส่งกลับมา
--
-- 🔒 ข้อมูลอ่อนไหว: ตัวอย่างข้อมูลจะถูกปิดบังคอลัมน์ต่อไปนี้อัตโนมัติ
--    national_id · bank_account · bank_account_name · password · password_hash · token
--    (แสดงเป็น '***' แทนค่าจริง)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- [1/10] รายชื่อตารางทั้งหมด + จำนวนแถว + ขนาด
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_agg(x order by x->>'table_name')) as "1_ตารางทั้งหมด"
from (
  select jsonb_build_object(
    'table_name', t.table_name,
    'row_count', (xpath('/row/c/text()',
       query_to_xml(format('select count(*) c from public.%I', t.table_name), false, true, '')))[1]::text::bigint,
    'size', pg_size_pretty(pg_total_relation_size(format('public.%I', t.table_name)::regclass)),
    'rls_enabled', (select c.relrowsecurity from pg_class c
                      join pg_namespace n on n.oid = c.relnamespace
                     where n.nspname = 'public' and c.relname = t.table_name),
    'has_pk', exists(select 1 from information_schema.table_constraints tc
                      where tc.table_schema='public' and tc.table_name=t.table_name
                        and tc.constraint_type='PRIMARY KEY')
  ) x
  from information_schema.tables t
  where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
) s;


-- ════════════════════════════════════════════════════════════
-- [2/10] คอลัมน์ทั้งหมดของ 7 ตารางที่ต้องใช้
--        (ชื่อ · ชนิด · NULL ได้หรือไม่ · ค่า Default · ความยาว)
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_object_agg(tbl, cols)) as "2_คอลัมน์ของ7ตาราง"
from (
  select c.table_name tbl,
         jsonb_agg(jsonb_build_object(
           'no', c.ordinal_position,
           'column', c.column_name,
           'type', c.data_type ||
                   coalesce('(' || c.character_maximum_length || ')', '') ||
                   coalesce('(' || c.numeric_precision || ',' || c.numeric_scale || ')', ''),
           'udt', c.udt_name,
           'nullable', c.is_nullable,
           'default', c.column_default,
           'identity', c.is_identity
         ) order by c.ordinal_position) cols
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name in ('attendance','ot_requests','payroll','payslips',
                          'work_shifts','employee_shifts','system_settings')
   group by c.table_name
) s;


-- ════════════════════════════════════════════════════════════
-- [3/10] Primary Key / Foreign Key / Unique / Check ของ 7 ตาราง
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(coalesce(jsonb_agg(x order by x->>'table_name', x->>'type'), '[]')) as "3_Constraint"
from (
  select jsonb_build_object(
    'table_name', r.relname,
    'name', con.conname,
    'type', case con.contype when 'p' then 'PRIMARY KEY'
                             when 'f' then 'FOREIGN KEY'
                             when 'u' then 'UNIQUE'
                             when 'c' then 'CHECK' else con.contype::text end,
    'definition', pg_get_constraintdef(con.oid)
  ) x
  from pg_constraint con
  join pg_class r on r.oid = con.conrelid
  join pg_namespace n on n.oid = r.relnamespace
  where n.nspname = 'public'
    and r.relname in ('attendance','ot_requests','payroll','payslips',
                      'work_shifts','employee_shifts','system_settings')
) s;


-- ════════════════════════════════════════════════════════════
-- [4/10] Index ทั้งหมดของ 7 ตาราง
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(coalesce(jsonb_agg(jsonb_build_object(
         'table_name', tablename, 'index', indexname, 'definition', indexdef)
         order by tablename, indexname), '[]')) as "4_Index"
from pg_indexes
where schemaname = 'public'
  and tablename in ('attendance','ot_requests','payroll','payslips',
                    'work_shifts','employee_shifts','system_settings');


-- ════════════════════════════════════════════════════════════
-- [5/10] Enum ทั้งหมดในระบบ + คอลัมน์ที่ใช้ Enum นั้น
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'enums', (select jsonb_object_agg(t.typname, vals)
              from (select t.oid, t.typname,
                           jsonb_agg(e.enumlabel order by e.enumsortorder) vals
                      from pg_type t
                      join pg_enum e on e.enumtypid = t.oid
                      join pg_namespace n on n.oid = t.typnamespace
                     where n.nspname = 'public'
                     group by t.oid, t.typname) t),
  'used_by', (select jsonb_agg(jsonb_build_object(
                'table', c.table_name, 'column', c.column_name, 'enum', c.udt_name)
                order by c.table_name, c.column_name)
                from information_schema.columns c
                join pg_type t on t.typname = c.udt_name
                join pg_namespace n on n.oid = t.typnamespace and n.nspname = 'public'
               where c.table_schema = 'public' and t.typtype = 'e')
)) as "5_Enum";


-- ════════════════════════════════════════════════════════════
-- [6/10] ความสัมพันธ์กับ employees (ตารางไหนอ้าง employees บ้าง)
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'fk_to_employees', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'from_table', r.relname, 'definition', pg_get_constraintdef(con.oid)) order by r.relname), '[]')
      from pg_constraint con
      join pg_class r on r.oid = con.conrelid
      join pg_class f on f.oid = con.confrelid
      join pg_namespace n on n.oid = r.relnamespace
     where n.nspname = 'public' and con.contype = 'f' and f.relname = 'employees'),
  'columns_named_employee', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', c.table_name, 'column', c.column_name, 'type', c.udt_name)
      order by c.table_name, c.column_name), '[]')
      from information_schema.columns c
     where c.table_schema = 'public'
       and (c.column_name ilike '%employee%' or c.column_name ilike 'emp\_%' or c.column_name = 'emp_id'))
)) as "6_ความสัมพันธ์กับemployees";


-- ════════════════════════════════════════════════════════════
-- [7/10] Function / View / Trigger / RLS Policy ที่มีอยู่
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'functions_njhr', (
    select coalesce(jsonb_agg(p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
             order by p.proname), '[]')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'njhr\_%'),
  'functions_other', (
    select coalesce(jsonb_agg(p.proname order by p.proname), '[]')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname not like 'njhr\_%' and p.prokind = 'f'),
  'views', (
    select coalesce(jsonb_agg(table_name order by table_name), '[]')
      from information_schema.views where table_schema = 'public'),
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', event_object_table, 'trigger', trigger_name, 'event', event_manipulation)
      order by event_object_table, trigger_name), '[]')
      from information_schema.triggers where trigger_schema = 'public'),
  'rls_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', tablename, 'policy', policyname, 'cmd', cmd,
      'roles', roles::text, 'using', qual, 'with_check', with_check)
      order by tablename, policyname), '[]')
      from pg_policies where schemaname = 'public')
)) as "7_Function_View_Trigger_RLS";


-- ════════════════════════════════════════════════════════════
-- [8/10] ตัวอย่างข้อมูล 3 แถวของแต่ละตาราง (ปิดบังข้อมูลอ่อนไหว)
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_object_agg(tbl, coalesce(sample::jsonb, '[]'::jsonb))) as "8_ตัวอย่างข้อมูล"
from (
  select t.table_name tbl,
    (xpath('/row/j/text()', query_to_xml(
      format('select coalesce(jsonb_agg(to_jsonb(x))::text, ''[]'') j from (select %s from public.%I limit 3) x',
        (select string_agg(
           case when c.column_name in ('national_id','bank_account','bank_account_name',
                                       'password','password_hash','token','refresh_token')
                then format('''***'' as %I', c.column_name)
                else format('%I', c.column_name) end, ', ' order by c.ordinal_position)
           from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = t.table_name),
        t.table_name), false, true, '')))[1]::text sample
  from information_schema.tables t
  where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
    and t.table_name in ('attendance','ot_requests','payroll','payslips',
                         'work_shifts','employee_shifts','system_settings')
) s;


-- ════════════════════════════════════════════════════════════
-- [9/10] ช่วงวันที่ของข้อมูลในแต่ละตาราง (หาคอลัมน์วันที่อัตโนมัติ)
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(coalesce(jsonb_agg(x order by x->>'table_name', x->>'column'), '[]')) as "9_ช่วงวันที่"
from (
  select jsonb_build_object(
    'table_name', c.table_name,
    'column', c.column_name,
    'min', (xpath('/row/v/text()', query_to_xml(
       format('select min(%I)::text v from public.%I', c.column_name, c.table_name), false, true, '')))[1]::text,
    'max', (xpath('/row/v/text()', query_to_xml(
       format('select max(%I)::text v from public.%I', c.column_name, c.table_name), false, true, '')))[1]::text,
    'null_count', (xpath('/row/v/text()', query_to_xml(
       format('select count(*) v from public.%I where %I is null', c.table_name, c.column_name), false, true, '')))[1]::text::bigint
  ) x
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name in ('attendance','ot_requests','payroll','payslips',
                         'work_shifts','employee_shifts','system_settings')
    and c.data_type in ('date','timestamp with time zone','timestamp without time zone')
) s;


-- ════════════════════════════════════════════════════════════
-- [10/10] คุณภาพข้อมูล: คอลัมน์ที่ว่างทั้งหมด · การกระจายค่าสถานะ
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'columns_all_null', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', c.table_name, 'column', c.column_name) order by c.table_name, c.column_name), '[]')
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.table_name in ('attendance','ot_requests','payroll','payslips',
                            'work_shifts','employee_shifts','system_settings')
       and (xpath('/row/v/text()', query_to_xml(
             format('select count(*) v from public.%I where %I is not null', c.table_name, c.column_name),
             false, true, '')))[1]::text::bigint = 0
       and (xpath('/row/v/text()', query_to_xml(
             format('select count(*) v from public.%I', c.table_name), false, true, '')))[1]::text::bigint > 0),
  'status_distribution', (
    select coalesce(jsonb_object_agg(c.table_name || '.' || c.column_name, dist), '{}'::jsonb)
      from information_schema.columns c
      cross join lateral (
        select (xpath('/row/j/text()', query_to_xml(
          format('select coalesce(jsonb_agg(jsonb_build_object(''value'', v, ''count'', n))::text, ''[]'') j
                    from (select %I::text v, count(*) n from public.%I group by 1 order by 2 desc limit 10) t',
                 c.column_name, c.table_name), false, true, '')))[1]::text::jsonb dist) d
     where c.table_schema = 'public'
       and c.table_name in ('attendance','ot_requests','payroll','payslips',
                            'work_shifts','employee_shifts','system_settings')
       and (c.column_name in ('status','state','type','kind','leave_unit','source','mode')
            or c.udt_name in (select t.typname from pg_type t
                                join pg_namespace n on n.oid = t.typnamespace
                               where n.nspname = 'public' and t.typtype = 'e'))),
  'orphan_employee_refs', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', c.table_name, 'column', c.column_name, 'orphan_rows', orph) order by c.table_name), '[]')
      from information_schema.columns c
      cross join lateral (
        select (xpath('/row/v/text()', query_to_xml(
          format('select count(*) v from public.%I t where t.%I is not null
                    and not exists (select 1 from public.employees e where e.id = t.%I)',
                 c.table_name, c.column_name, c.column_name), false, true, '')))[1]::text::bigint orph) o
     where c.table_schema = 'public'
       and c.table_name in ('attendance','ot_requests','payroll','payslips','employee_shifts')
       and c.column_name = 'employee_id' and c.udt_name = 'uuid'
       and orph > 0)
)) as "10_คุณภาพข้อมูล";
