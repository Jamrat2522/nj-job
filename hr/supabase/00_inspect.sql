-- ============================================================
-- STEP 0: ตรวจโครงสร้างจริงในโปรเจกต์ Supabase ก่อนเขียน SQL ใด ๆ
-- รันทีละบล็อกใน SQL Editor แล้วส่งผลลัพธ์กลับมา (ไม่มีคำสั่งแก้ไขข้อมูลใด ๆ ในไฟล์นี้ — อ่านอย่างเดียว ปลอดภัย 100%)
-- ============================================================

-- (1) มีตารางอะไรอยู่แล้วบ้าง + จำนวนแถว (เพื่อรู้ว่าอะไรของแอปอื่น ห้ามแตะ)
select c.relname                        as table_name,
       c.reltuples::bigint              as approx_rows,
       obj_description(c.oid)           as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- (2) โครงสร้างจริงของตารางที่ชนกับสคริปต์ผม (ชนิดข้อมูลสำคัญมาก: uuid vs text)
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('employees','app_users','users','departments','leaves','leave_types',
                     'leave_balances','notifications','shifts','audit_log','app_settings')
order by table_name, ordinal_position;

-- (3) primary key / unique ของตารางเดิม (ใช้กำหนด FK ให้ถูกชนิด)
select tc.table_name, tc.constraint_type, kcu.column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
where tc.table_schema = 'public' and tc.constraint_type in ('PRIMARY KEY','UNIQUE')
  and tc.table_name in ('employees','app_users','departments','leave_types','shifts')
order by tc.table_name;

-- (4) แอปนี้แยกข้อมูลด้วยอะไร (app_code?) และ auth ทำงานยังไง
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='app_users' order by ordinal_position;

select distinct app_code from public.app_users limit 50;   -- ถ้ามีคอลัมน์นี้

-- (5) ใช้ Supabase Auth อยู่หรือไม่ (ถ้า 0 = ใช้ custom auth → RLS แบบ auth.uid() ใช้ไม่ได้)
select count(*) as supabase_auth_users from auth.users;

-- (6) RLS ที่เปิดอยู่แล้ว + policy เดิม (ห้ามไปทับของแอปอื่น)
select schemaname, tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;
select schemaname, tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename, policyname;

-- (7) เช็คว่ามีตารางไหนจากสคริปต์ผมถูกสร้างค้างไว้บ้าง (ต้องรู้ก่อนถอน)
select table_name,
       (select count(*) from information_schema.columns c
         where c.table_schema='public' and c.table_name = t.table_name) as col_count
from (values ('leave_timeline'),('leave_files'),('leave_balances'),('leaves'),
             ('leave_types'),('audit_log'),('holidays'),('app_settings'),('shifts')) as t(table_name)
where exists (select 1 from information_schema.tables i
              where i.table_schema='public' and i.table_name = t.table_name);
