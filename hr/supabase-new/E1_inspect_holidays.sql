-- ============================================================
-- E1_inspect_holidays.sql
-- ตรวจก่อนทำ "โหลดวันหยุดราชการ" ในปฏิทินองค์กร
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--   รันซ้ำได้ไม่จำกัด · ไม่แตะข้อมูล Production
--
-- ทำไมต้องตรวจ:
--   ตาราง holidays "แชร์กับแอปอื่น" (ระบุไว้ใน 58_holidays.sql)
--   การเพิ่มคอลัมน์ source จึงต้องยืนยันก่อนว่าไม่กระทบแอปอื่น
--   และต้องรู้ว่ามี Unique Constraint จริงหรือไม่ ก่อนออกแบบ Key กันซ้ำ
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON กลับมา
-- ============================================================

with

-- ─── 1) คอลัมน์จริงของตาราง holidays ────────────────────────
b1 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type,
           'nullable', c.is_nullable, 'default', c.column_default)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema='public' and c.table_name='holidays'),

-- ─── 2) Constraint และ Index ทั้งหมด ────────────────────────
--     **ชี้ขาด** ว่า 1 วัน = 1 รายการ หรือหลายรายการได้
b2 as (
  select jsonb_build_object(
    'indexes', (select coalesce(jsonb_agg(jsonb_build_object(
                  'name', i.relname, 'unique', idx.indisunique,
                  'definition', pg_get_indexdef(idx.indexrelid)) order by i.relname), '[]'::jsonb)
                  from pg_index idx join pg_class i on i.oid = idx.indexrelid
                 where idx.indrelid = 'public.holidays'::regclass),
    'constraints', (select coalesce(jsonb_agg(jsonb_build_object(
                      'name', con.conname, 'type', con.contype,
                      'definition', pg_get_constraintdef(con.oid)) order by con.conname), '[]'::jsonb)
                      from pg_constraint con where con.conrelid = 'public.holidays'::regclass),
    'has_unique_on_date', exists(
        select 1 from pg_index idx
         where idx.indrelid='public.holidays'::regclass and idx.indisunique
           and pg_get_indexdef(idx.indexrelid) ilike '%holiday_date%')
  ) as j),

-- ─── 3) 1 วันมีหลายรายการอยู่จริงหรือไม่ ────────────────────
b3 as (
  select jsonb_build_object(
    'total_rows',      (select count(*) from public.holidays),
    'distinct_dates',  (select count(distinct holiday_date) from public.holidays),
    'dates_with_multiple_rows', (select count(*) from (
        select holiday_date from public.holidays group by holiday_date having count(*) > 1) x),
    'sample_duplicates', (select coalesce(jsonb_agg(jsonb_build_object(
                            'date', t.holiday_date, 'rows', t.n)), '[]'::jsonb)
                            from (select holiday_date, count(*) n from public.holidays
                                   group by holiday_date having count(*) > 1 limit 10) t)
  ) as j),

-- ─── 4) จำนวนวันหยุดแยกตามปี ────────────────────────────────
b4 as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'year')::int), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'year', extract(year from h.holiday_date)::int,
                   'year_be', extract(year from h.holiday_date)::int + 543,
                   'rows', count(*)) o
            from public.holidays h
           group by extract(year from h.holiday_date)::int) x),

-- ─── 5) ตัวอย่างข้อมูลจริง 20 แถวล่าสุด ─────────────────────
b5 as (
  select coalesce(jsonb_agg(x.o order by x.o->>'date' desc), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'date', h.holiday_date, 'name', h.name,
                   'created_at', h.created_at) o
            from public.holidays h order by h.holiday_date desc limit 20) x),

-- ─── 6) มีคอลัมน์แยกแหล่งที่มาอยู่แล้วหรือยัง ───────────────
b6 as (
  select jsonb_build_object(
    'source_like_columns', (select coalesce(jsonb_agg(c.column_name order by c.column_name), '[]'::jsonb)
                              from information_schema.columns c
                             where c.table_schema='public' and c.table_name='holidays'
                               and c.column_name in ('source','origin','holiday_type','type',
                                                     'is_government','app_code','company_id','active','excluded')),
    'needs_new_column', not exists(
        select 1 from information_schema.columns c
         where c.table_schema='public' and c.table_name='holidays' and c.column_name='source')
  ) as j),

-- ─── 7) ใครอ่าน/เขียน holidays บ้าง (ทั้งฐานข้อมูล ไม่ใช่แค่ HR) ──
--     **สำคัญ** ตารางนี้แชร์กับแอปอื่น ต้องรู้ก่อนเพิ่มคอลัมน์
b7 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'writes', (pg_get_functiondef(p.oid) ~* '(insert into|update|delete from)\s+(public\.)?holidays'),
           'is_njhr', (p.proname like 'njhr\_%'))
         order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.prokind='f'
     and pg_get_functiondef(p.oid) ~* '(public\.)?holidays\y'),

-- ─── 8) View / Trigger / FK ที่พึ่งตารางนี้ ─────────────────
b8 as (
  select jsonb_build_object(
    'views', (select coalesce(jsonb_agg(distinct v.viewname), '[]'::jsonb)
                from pg_views v
               where v.schemaname='public' and v.definition ~* '(public\.)?holidays\y'),
    'triggers', (select coalesce(jsonb_agg(t.tgname), '[]'::jsonb)
                   from pg_trigger t
                  where t.tgrelid='public.holidays'::regclass and not t.tgisinternal),
    'fks_pointing_here', (select coalesce(jsonb_agg(con.conname), '[]'::jsonb)
                            from pg_constraint con
                           where con.contype='f' and con.confrelid='public.holidays'::regclass),
    'rls_enabled', (select cl.relrowsecurity from pg_class cl where cl.oid='public.holidays'::regclass),
    'force_rls',   (select cl.relforcerowsecurity from pg_class cl where cl.oid='public.holidays'::regclass),
    'table_owner', (select pg_get_userbyid(cl.relowner) from pg_class cl where cl.oid='public.holidays'::regclass),
    'policy_defs', (select coalesce(jsonb_agg(jsonb_build_object(
                      'name', pol.policyname, 'cmd', pol.cmd, 'roles', pol.roles::text)), '[]'::jsonb)
                      from pg_policies pol where pol.schemaname='public' and pol.tablename='holidays'),
    'policies', (select count(*) from pg_policies where schemaname='public' and tablename='holidays')
  ) as j),

-- ─── 9) RPC ของปฏิทินที่ Frontend เรียกอยู่ ─────────────────
b9 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns', pg_get_function_result(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.proname like 'njhr_holiday%'),

-- ─── 10) ระบบที่พึ่งวันหยุด (ห้ามแก้ Logic) ─────────────────
b10 as (
  select jsonb_build_object(
    'leave_workdays_uses_holidays', exists(
        select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname='njhr_leave_workdays'
           and pg_get_functiondef(p.oid) ~* 'holidays'),
    'ot_uses_holidays', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                          where n.nspname='public' and p.proname like 'njhr_ot%'
                            and pg_get_functiondef(p.oid) ~* 'holidays'),
    'note', 'ระบบเหล่านี้อ่านเฉพาะ holiday_date — เพิ่มคอลัมน์ nullable จึงไม่กระทบ'
  ) as j)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',            now(),
  '1_holidays_columns',      (select j from b1),
  '2_constraints_indexes',   (select j from b2),
  '3_one_date_multi_rows',   (select j from b3),
  '4_rows_by_year',          (select j from b4),
  '5_sample_rows',           (select j from b5),
  '6_source_column',         (select j from b6),
  '7_functions_touching',    (select j from b7),
  '8_dependencies',          (select j from b8),
  '9_calendar_rpcs',         (select j from b9),
  '10_consumers',            (select j from b10)
)) as inspection_report;
