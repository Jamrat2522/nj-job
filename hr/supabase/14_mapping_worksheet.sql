-- อ่านอย่างเดียว 100% — สร้าง "ใบตรวจจับคู่" ให้ HR ยืนยันรายคน แล้ว Export CSV จากปุ่มใน Supabase
-- ไม่มีการเขียนข้อมูลใด ๆ · จับคู่อัตโนมัติเป็นเพียง "ตัวเลือก" ไม่ใช่คำตอบสุดท้าย
with u as (
  select id user_id, username, internal_username, full_name, department, role::text urole,
         lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$', '')) base
  from public.app_users where app_code = 'salary'),
e as (
  select id emp_id, emp_code, first_name, last_name, department_name,
         lower(trim(coalesce(first_name_en,''))) fen, lower(trim(coalesce(last_name_en,''))) len,
         status::text estatus
  from public.employees),
cand as (
  select u.user_id, u.username, u.internal_username, u.department, u.urole, u.base,
         e.emp_id, e.emp_code, e.first_name, e.last_name, e.department_name, e.estatus,
         case when u.base = e.fen and lower(u.department) = lower(e.department_name) then 'ชื่อ+แผนกตรง'
              when u.base = e.fen then 'ชื่อตรง (แผนกไม่ตรง)'
              else 'ชื่อใกล้เคียง' end confidence
  from u left join e
    on e.fen <> '' and (u.base = e.fen or e.fen like u.base || '%' or u.base like e.fen || '%'))
select username                                   as "ชื่อผู้ใช้",
       internal_username                          as "internal_username",
       department                                 as "แผนกในระบบผู้ใช้",
       urole                                      as "สิทธิ์",
       count(emp_id) over (partition by user_id)  as "จำนวนผู้สมัครที่เข้าข่าย",
       emp_code                                   as "รหัสพนักงาน (ตัวเลือก)",
       first_name || ' ' || coalesce(last_name,'') as "ชื่อพนักงาน (ตัวเลือก)",
       department_name                            as "แผนกพนักงาน",
       estatus                                    as "สถานะ",
       confidence                                 as "ระดับความมั่นใจ",
       ''                                         as "✅ HR ยืนยัน (ใส่ x)",
       user_id::text                              as "_user_id",
       emp_id::text                               as "_employee_id"
from cand
order by "จำนวนผู้สมัครที่เข้าข่าย" desc, username, confidence;
