-- ============================================================
-- รันแค่คำสั่งเดียวนี้ แล้ว copy ผลลัพธ์ (1 ช่อง JSON) ส่งกลับมา
-- อ่านอย่างเดียว 100% — ไม่มี create/alter/drop/insert/update/delete
-- ============================================================
select jsonb_pretty(jsonb_build_object(

  -- (A) ตารางทั้งหมดใน public + จำนวนแถวโดยประมาณ (ให้รู้ว่าอะไรเป็นของแอปอื่น ห้ามแตะ)
  'tables', (select jsonb_agg(jsonb_build_object('t', c.relname, 'rows', c.reltuples::bigint) order by c.relname)
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r'),

  -- (B) โครงสร้างจริงของตารางที่ผมต้องอ้างอิง/ระวังชน
  'columns', (select jsonb_object_agg(table_name, cols) from (
      select table_name, jsonb_agg(jsonb_build_object('c', column_name, 'type', data_type) order by ordinal_position) cols
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('employees','app_users','users','departments','leave_types',
                           'audit_log','holidays','notifications','shifts','app_settings')
      group by table_name) x),

  -- (C) primary key ของตารางเดิม (ใช้กำหนดชนิด FK ให้ถูก)
  'pks', (select jsonb_object_agg(tc.table_name, kcu.column_name)
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
          where tc.table_schema='public' and tc.constraint_type='PRIMARY KEY'
            and tc.table_name in ('employees','app_users','departments','leave_types','audit_log','holidays')),

  -- (D) ระบบ auth: ถ้า 0 แปลว่าใช้ custom auth → RLS แบบ auth.uid() ใช้ไม่ได้
  'supabase_auth_users', (select count(*) from auth.users),

  -- (E) การแยกข้อมูลระหว่างแอป (app_code) ถ้ามีคอลัมน์นี้
  'app_codes', (select case when exists (select 1 from information_schema.columns
                          where table_schema='public' and table_name='app_users' and column_name='app_code')
                       then (select jsonb_agg(distinct app_code) from public.app_users) else null end),

  -- (F) schema ที่มีอยู่ (เช็คว่าชื่อ njhr ว่างไหม)
  'schemas', (select jsonb_agg(nspname order by nspname) from pg_namespace
              where nspname not like 'pg_%' and nspname not in ('information_schema')),

  -- (G) RLS ที่เปิดอยู่แล้ว (ห้ามไปทับ policy ของแอปอื่น)
  'rls_on', (select jsonb_agg(tablename order by tablename) from pg_tables
             where schemaname='public' and rowsecurity)
)) as inspect_result;
