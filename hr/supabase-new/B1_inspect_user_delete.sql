-- ============================================================
-- B1_inspect_user_delete.sql   (แก้ไขรอบที่ 2)
-- ตรวจก่อนเพิ่มคำสั่ง "ลบบัญชี USER ที่ยังไม่ได้เชื่อมพนักงาน"
--
-- ⚠ READ-ONLY ทั้งไฟล์
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--   รันซ้ำได้ไม่จำกัด · ไม่แตะข้อมูล Production
--
-- ⚠ เป็น "คำสั่งเดียว" โดยเจตนา
--   Supabase SQL Editor แสดงผลเฉพาะคำสั่งสุดท้าย ถ้าแยกหลาย SELECT จะเห็นผลไม่ครบ
--   ไฟล์นี้จึงคืนผลทุกบล็อกรวมเป็น JSON ก้อนเดียว
--
-- วิธีใช้: Supabase SQL Editor → วางทั้งไฟล์ → Run → คัดลอกผล JSON ทั้งก้อนกลับมา
--
-- แก้จากรอบแรก:
--   · GROUP BY เคยใช้เลขลำดับ ซึ่งชี้ไปคอลัมน์ค่าคงที่ → เปลี่ยนเป็นระบุนิพจน์ตรง ๆ
--   · เลิกใช้ enum_range() → อ่านจาก pg_enum แทน (ไม่พังถ้าคอลัมน์ไม่ใช่ enum)
--   · เลิกอ้างคอลัมน์ของ audit_log ก่อนรู้โครงสร้างจริง → ดูโครงสร้างที่ block 9 แทน
-- ============================================================

with

-- ─── 1) มี RPC ลบบัญชีอยู่แล้วหรือไม่ ────────────────────────
--     ว่าง = ยังไม่มี ต้องสร้างใหม่ · ไม่ว่าง = ต้องแก้ของเดิม ห้ามสร้างซ้ำ
b1 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function', p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'returns',   pg_get_function_result(p.oid),
           'security_definer', p.prosecdef) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (p.proname ilike '%user%delete%' or p.proname ilike '%delete%user%'
       or p.proname ilike '%user%remove%' or p.proname ilike 'njhr_user_%')),

-- ─── 2) FOREIGN KEY ทุกตัวที่ชี้มาที่ app_users ──────────────
--     **บล็อกชี้ขาด** — บอกว่า Hard Delete จะถูกบล็อกตรงไหน
b2 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'constraint',   con.conname,
           'child_table',  src.relname,
           'child_column', (select string_agg(a.attname, ', ' order by k.ord)
                              from unnest(con.conkey) with ordinality k(attnum, ord)
                              join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum),
           'on_delete',    case con.confdeltype
                             when 'a' then 'NO ACTION — บล็อกการลบ'
                             when 'r' then 'RESTRICT — บล็อกการลบ'
                             when 'c' then 'CASCADE — ลบตาม'
                             when 'n' then 'SET NULL'
                             when 'd' then 'SET DEFAULT' end,
           'blocks_delete', con.confdeltype in ('a','r'),
           'definition',   pg_get_constraintdef(con.oid)) order by src.relname, con.conname), '[]'::jsonb) as j
    from pg_constraint con join pg_class src on src.oid = con.conrelid
   where con.contype = 'f' and con.confrelid = 'public.app_users'::regclass),

-- ─── 3) คอลัมน์ที่ดูเหมือนอ้างผู้ใช้ แต่ไม่มี FK ─────────────
--     ถ้าเป็น text (เก็บ username) ลบบัญชีแล้วประวัติไม่หาย แต่จะชี้ชื่อที่ไม่มีตัวตนแล้ว
b3 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', c.table_name, 'column', c.column_name,
           'type', c.data_type, 'nullable', c.is_nullable)
         order by c.table_name, c.column_name), '[]'::jsonb) as j
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
   where c.table_schema = 'public'
     and c.column_name in ('user_id','app_user_id','created_by','updated_by',
                           'actor','approver_user_id','acted_by','requested_by','deleted_by')
     and not exists (
       select 1 from pg_constraint con
        where con.contype = 'f'
          and con.conrelid  = ('public.' || quote_ident(c.table_name))::regclass
          and con.confrelid = 'public.app_users'::regclass
          and exists (select 1 from unnest(con.conkey) k(attnum)
                       join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
                      where a.attname = c.column_name))),

-- ─── 4) UNIQUE index บน app_users ────────────────────────────
--     ตอบว่า "ลบแล้ว Username / Email เดิมสมัครใหม่ได้จริงหรือไม่"
b4 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'index', i.relname, 'unique', idx.indisunique,
           'definition', pg_get_indexdef(idx.indexrelid)) order by i.relname), '[]'::jsonb) as j
    from pg_index idx join pg_class i on i.oid = idx.indexrelid
   where idx.indrelid = 'public.app_users'::regclass),

-- ─── 5) บัญชีที่เข้าเงื่อนไขลบได้ แยกตาม role ดิบ ────────────
--     เงื่อนไข: app_code='salary' · employee_id IS NULL
b5 as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'accounts')::int desc), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'raw_role', u.role::text,
                   'accounts', count(*),
                   'active',   count(*) filter (where coalesce(u.is_active, true)),
                   'inactive', count(*) filter (where not coalesce(u.is_active, true))) as o
            from public.app_users u
           where u.app_code = 'salary' and u.employee_id is null
           group by u.role::text) x),

-- ─── 6) ค่า role ทั้งหมดที่มีจริงใน app_code='salary' ────────
--     Frontend ยุบเหลือ 3 role แต่ DB อาจยังเก็บค่าเดิม
b6 as (
  select coalesce(jsonb_agg(x.o order by (x.o->>'total')::int desc), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'raw_role', u.role::text,
                   'total',    count(*),
                   'unlinked', count(*) filter (where u.employee_id is null),
                   'linked',   count(*) filter (where u.employee_id is not null)) as o
            from public.app_users u where u.app_code = 'salary'
           group by u.role::text) x),

-- ─── 6b) ชนิดของคอลัมน์ role + ค่า enum ที่เป็นไปได้ ─────────
--      อ่านจาก catalog ไม่เรียก enum_range จึงไม่พังถ้าไม่ใช่ enum
b6b as (
  select jsonb_build_object(
           'udt_schema', max(c.udt_schema), 'udt_name', max(c.udt_name),
           'data_type',  max(c.data_type)) as j
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'app_users' and c.column_name = 'role'),
b6c as (
  select coalesce(jsonb_agg(e.enumlabel order by e.enumsortorder), '[]'::jsonb) as j
    from pg_enum e
   where e.enumtypid = (select a.atttypid from pg_attribute a
                         where a.attrelid = 'public.app_users'::regclass and a.attname = 'role')),

-- ─── 7) ข้อมูลธุรกิจที่ผูกกับบัญชีที่จะลบ ────────────────────
--     ทุกค่าเป็น 0 = ลบได้สะอาด · ไม่ใช่ = ต้องหยุดและรายงาน
cand as (select u.id from public.app_users u
          where u.app_code = 'salary' and u.employee_id is null),
b7 as (
  select jsonb_build_object(
           'candidate_accounts', (select count(*) from cand),
           'sessions',      (select count(*) from public.njhr_sessions s where s.app_user_id in (select id from cand)),
           'notifications', (select count(*) from public.notifications n where n.user_id     in (select id from cand))) as j),

-- ─── 8) ตารางคำขอเปิดใช้งานบัญชี ─────────────────────────────
--     ใช้ catalog อย่างเดียว จึงไม่พังถ้าตารางไม่มีอยู่จริง
b8 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', c.table_name, 'column', c.column_name,
           'type', c.data_type, 'nullable', c.is_nullable)
         order by c.table_name, c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name in (select table_name from information_schema.tables
                           where table_schema = 'public' and table_type = 'BASE TABLE'
                             and (table_name ilike '%activation%' or table_name ilike '%signup%'
                               or table_name ilike '%register%'))),

-- ─── 9) โครงสร้าง audit_log ที่ใช้จริง ───────────────────────
--     ยืนยันว่า actor เก็บเป็นข้อความ ไม่ใช่ FK → ลบบัญชีแล้วประวัติไม่หาย
b9 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'column', c.column_name, 'type', c.data_type, 'nullable', c.is_nullable)
         order by c.ordinal_position), '[]'::jsonb) as j
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'audit_log'),

-- ─── 10) RLS ─────────────────────────────────────────────────
b10 as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', c.relname, 'rls_enabled', c.relrowsecurity,
           'policies', (select count(*) from pg_policies p
                         where p.schemaname = 'public' and p.tablename = c.relname))
         order by c.relname), '[]'::jsonb) as j
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('app_users','njhr_sessions','notifications','audit_log')),

-- ─── 11) ตัวอย่างบัญชีที่จะถูกลบ (20 รายการแรก) ──────────────
--      ให้ผู้ดูแลตรวจด้วยตาก่อนว่าเป็นบัญชีที่ต้องการลบจริง
b11 as (
  select coalesce(jsonb_agg(x.o order by x.o->>'username'), '[]'::jsonb) as j
    from (select jsonb_build_object(
                   'username', u.username, 'email', u.email,
                   'raw_role', u.role::text,
                   'is_active', coalesce(u.is_active, true),
                   'status',    coalesce(u.status, 'active'),
                   'created_at', u.created_at,
                   'sessions',      (select count(*) from public.njhr_sessions s where s.app_user_id = u.id),
                   'notifications', (select count(*) from public.notifications n where n.user_id     = u.id)) as o
            from public.app_users u
           where u.app_code = 'salary' and u.employee_id is null
           order by u.created_at nulls last, u.username
           limit 20) x)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',                    now(),
  '1_existing_delete_rpc',           (select j from b1),
  '2_fks_referencing_app_users',     (select j from b2),
  '3_user_like_columns_without_fk',  (select j from b3),
  '4_unique_indexes_on_app_users',   (select j from b4),
  '5_deletable_candidates_by_role',  (select j from b5),
  '6_all_roles_present',             (select j from b6),
  '6b_role_column_type',             (select j from b6b),
  '6c_role_enum_labels',             (select j from b6c),
  '7_business_data_of_candidates',   (select j from b7),
  '8_activation_request_tables',     (select j from b8),
  '9_audit_log_structure',           (select j from b9),
  '10_rls_status',                   (select j from b10),
  '11_sample_candidates',            (select j from b11),
  'VERDICT_hard_delete_blocked_by',  (select coalesce(jsonb_agg(e->>'child_table'), '[]'::jsonb)
                                        from jsonb_array_elements((select j from b2)) e
                                       where (e->>'blocks_delete')::boolean)
)) as inspection_report;
