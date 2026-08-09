-- ============================================================
-- A1_inspect_employee_name.sql
-- ตรวจสอบโครงสร้างและข้อมูลจริงของ "ชื่อ–นามสกุลพนักงาน" + RPC เปิดใช้งานบัญชี
--
-- ⚠ ไฟล์นี้เป็น READ-ONLY ทั้งไฟล์
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--   รันซ้ำได้ไม่จำกัด · ไม่แตะข้อมูล Production
--
-- วิธีใช้: เปิด Supabase SQL Editor → วางทั้งไฟล์ → Run → ส่งผลทั้ง 10 บล็อกกลับมา
-- ============================================================


-- ─── บล็อก 1) คอลัมน์ชื่อ/นามสกุลใน public.employees ────────────
-- ตรวจว่ามีครบ 4 ฟิลด์จริงหรือไม่ · ชนิดข้อมูล · NOT NULL · ค่า default
select '1) employees columns' as block,
       column_name, data_type, is_nullable, column_default, character_maximum_length
  from information_schema.columns
 where table_schema = 'public' and table_name = 'employees'
   and column_name in ('id','emp_code','prefix','first_name','last_name',
                       'first_name_en','last_name_en','nickname')
 order by ordinal_position;


-- ─── บล็อก 2) มีคอลัมน์ "ชื่อรวม" หลงเหลืออยู่หรือไม่ ────────────
-- ถ้าคืน 0 แถว = ไม่มีการเก็บชื่อรวมใน employees (ถูกต้องตามเป้าหมาย)
select '2) merged-name columns in employees' as block,
       column_name, data_type, is_generated, generation_expression
  from information_schema.columns
 where table_schema = 'public' and table_name = 'employees'
   and column_name in ('full_name','name','employee_name','fullname','emp_name','display_name')
 order by column_name;


-- ─── บล็อก 3) คอลัมน์ชื่อรวมในตารางอื่นทั้ง schema public ────────
-- ใช้ดูว่ามีตารางใดเก็บชื่อรวมเป็นข้อมูลหลักบ้าง (เช่น app_users.full_name)
select '3) merged-name columns (all public tables)' as block,
       c.table_name, c.column_name, c.data_type, c.is_generated
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name
   and t.table_type = 'BASE TABLE'
 where c.table_schema = 'public'
   and c.column_name in ('full_name','employee_name','emp_name','fullname','display_name')
 order by c.table_name, c.column_name;


-- ─── บล็อก 4) คุณภาพข้อมูลชื่อ (ไม่แก้ไขข้อมูล นับอย่างเดียว) ────
select '4) name data quality' as block,
       count(*)                                                          as total_rows,
       count(*) filter (where coalesce(btrim(first_name),'')    = '')    as first_name_empty,
       count(*) filter (where coalesce(btrim(last_name),'')     = '')    as last_name_empty,
       count(*) filter (where coalesce(btrim(first_name_en),'') = '')    as first_name_en_empty,
       count(*) filter (where coalesce(btrim(last_name_en),'')  = '')    as last_name_en_empty,
       -- ชื่อเต็มถูกยัดไว้ในช่องเดียว (มีช่องว่างคั่นกลาง)
       count(*) filter (where btrim(coalesce(first_name,''))    ~ '\s')  as fullname_in_first_name,
       count(*) filter (where btrim(coalesce(first_name_en,'')) ~ '\s')  as fullname_in_first_name_en,
       count(*) filter (where btrim(coalesce(last_name,''))     ~ '\s')  as multiword_last_name,
       count(*) filter (where btrim(coalesce(last_name_en,''))  ~ '\s')  as multiword_last_name_en,
       -- ภาษาสลับช่อง
       count(*) filter (where coalesce(first_name,'')    ~ '[ก-๙]' is false
                          and coalesce(btrim(first_name),'') <> '')      as thai_field_has_no_thai,
       count(*) filter (where coalesce(first_name_en,'') ~ '[ก-๙]')      as thai_text_in_en_field,
       count(*) filter (where coalesce(last_name_en,'')  ~ '[ก-๙]')      as thai_text_in_en_lastname,
       count(*) filter (where coalesce(first_name,'')    ~ '^[A-Za-z][A-Za-z''\- ]*$') as en_text_in_thai_field,
       count(*) filter (where coalesce(last_name,'')     ~ '^[A-Za-z][A-Za-z''\- ]*$') as en_text_in_thai_lastname
  from public.employees;


-- ─── บล็อก 5) รายชื่อ Record ที่ต้องให้คนตรวจทีละรายการ ─────────
-- ห้ามแก้อัตโนมัติ — ใช้รายการนี้ไปแก้ด้วยมือในหน้าแก้ไขพนักงาน
select '5) records needing manual review' as block,
       emp_code, first_name, last_name, first_name_en, last_name_en, status,
       case
         when coalesce(btrim(first_name),'') = ''            then 'ไม่มีชื่อไทย'
         when coalesce(btrim(last_name),'')  = ''            then 'ไม่มีนามสกุลไทย'
         when btrim(coalesce(first_name,''))    ~ '\s'       then 'ชื่อไทยมีหลายคำ (อาจเป็นชื่อเต็ม)'
         when btrim(coalesce(first_name_en,'')) ~ '\s'       then 'ชื่ออังกฤษมีหลายคำ (อาจเป็นชื่อเต็ม)'
         when coalesce(first_name_en,'') ~ '[ก-๙]'
           or coalesce(last_name_en,'')  ~ '[ก-๙]'           then 'ข้อความไทยอยู่ในช่องอังกฤษ'
         when coalesce(first_name,'') ~ '^[A-Za-z][A-Za-z''\- ]*$'
           or coalesce(last_name,'')  ~ '^[A-Za-z][A-Za-z''\- ]*$' then 'ข้อความอังกฤษอยู่ในช่องไทย'
       end as issue
  from public.employees
 where coalesce(btrim(first_name),'') = ''
    or coalesce(btrim(last_name),'')  = ''
    or btrim(coalesce(first_name,''))    ~ '\s'
    or btrim(coalesce(first_name_en,'')) ~ '\s'
    or coalesce(first_name_en,'') ~ '[ก-๙]'
    or coalesce(last_name_en,'')  ~ '[ก-๙]'
    or coalesce(first_name,'') ~ '^[A-Za-z][A-Za-z''\- ]*$'
    or coalesce(last_name,'')  ~ '^[A-Za-z][A-Za-z''\- ]*$'
 order by emp_code;


-- ─── บล็อก 6) นามสกุลไทยซ้ำ (กระทบการจับคู่ emp_code + last_name) ─
-- emp_code เป็น unique อยู่แล้ว การซ้ำของนามสกุลจึงไม่ทำให้จับคู่ผิด
-- แต่ใช้ดูภาพรวมความเสี่ยงตอนพนักงานกรอกผิดคน
select '6) duplicate thai last_name' as block,
       last_name, count(*) as n, string_agg(emp_code, ', ' order by emp_code) as emp_codes
  from public.employees
 where coalesce(btrim(last_name),'') <> ''
 group by last_name having count(*) > 1
 order by count(*) desc, last_name;


-- ─── บล็อก 7) RPC เปิดใช้งานบัญชี — มีอยู่จริงหรือไม่ + Signature ──
select '7) activation functions' as block,
       n.nspname   as schema,
       p.proname   as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid)             as returns,
       p.prosecdef as security_definer,
       l.lanname   as language
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language  l on l.oid = p.prolang
 where n.nspname = 'public'
   and p.proname in ('njhr_activation_submit','njhr_activation_link',
                     'njhr_activation_list','njhr_activation_reject')
 order by p.proname, arguments;


-- ─── บล็อก 8) Function Body — จับคู่พนักงานด้วยคอลัมน์ใด ────────
-- อ่าน source จริงเพื่อยืนยันว่าใช้ emp_code + last_name เท่านั้น
-- และไม่มี fallback ไป last_name_en / first_name_en / nickname / username
select '8) activation source' as block,
       p.proname as function_name,
       pg_get_functiondef(p.oid) as source
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('njhr_activation_submit','njhr_activation_link')
 order by p.proname;


-- ─── บล็อก 9) ตรวจคำต้องห้ามใน Body แบบสรุป (อ่านง่ายกว่าบล็อก 8) ─
select '9) activation matching audit' as block,
       p.proname as function_name,
       (pg_get_functiondef(p.oid) ilike '%emp_code%')      as uses_emp_code,
       (pg_get_functiondef(p.oid) ilike '%last_name%'
         and pg_get_functiondef(p.oid) not ilike '%last_name_en%') as uses_thai_last_name_only,
       (pg_get_functiondef(p.oid) ilike '%last_name_en%')  as REFERS_last_name_en,
       (pg_get_functiondef(p.oid) ilike '%first_name_en%') as REFERS_first_name_en,
       (pg_get_functiondef(p.oid) ilike '%nickname%')      as REFERS_nickname,
       (pg_get_functiondef(p.oid) ilike '%username%')      as REFERS_username,
       (pg_get_functiondef(p.oid) ilike '%employee_id%')   as writes_employee_id
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('njhr_activation_submit','njhr_activation_link')
 order by p.proname;


-- ─── บล็อก 10) ตารางคำขอเปิดใช้งาน + การผูก employee_id ─────────
select '10) activation request table' as block,
       c.table_name, c.column_name, c.data_type, c.is_nullable
  from information_schema.columns c
 where c.table_schema = 'public'
   and c.table_name in (select table_name from information_schema.tables
                         where table_schema='public' and table_type='BASE TABLE'
                           and table_name ilike '%activation%')
 order by c.table_name, c.ordinal_position;
