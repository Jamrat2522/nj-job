-- อ่านอย่างเดียว 100% — ปรับปรุงจาก v1: เทียบแผนกด้วยตารางแปลงชื่อจริงที่พบในข้อมูล
--   app_users.department  ↔  employees.department_name
--   Import → CUSTOMER SERVICE IMPORT · Export → CUSTOMER SERVICE EXPORT
--   Account → ACCOUNT · Management → MANAGER
with dept_map(u_dept, e_dept) as (values
  ('import','customer service import'), ('export','customer service export'),
  ('account','account'), ('management','manager')),
u as (
  select id user_id, username, internal_username, lower(coalesce(department,'')) udept, role::text urole,
         lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$', '')) base
  from public.app_users where app_code = 'salary'),
e as (
  select id emp_id, emp_code, first_name, last_name, department_name,
         lower(trim(coalesce(first_name_en,''))) fen, lower(coalesce(department_name,'')) edept
  from public.employees where emp_code !~ '^EMP'),   -- ตัด 3 แถวทดสอบ EMP0001-0003 ออก
cand as (
  select u.*, e.emp_id, e.emp_code, e.first_name, e.last_name, e.department_name,
    case when u.base = e.fen and exists (select 1 from dept_map m where m.u_dept = u.udept and m.e_dept = e.edept)
           then 'A · ชื่อ+แผนกตรง'
         when u.base = e.fen then 'B · ชื่อตรง'
         else 'C · ชื่อใกล้เคียง' end conf
  from u left join e on e.fen <> '' and (u.base = e.fen or e.fen like u.base || '%' or u.base like e.fen || '%'))
select username "ชื่อผู้ใช้", udept "แผนก(ผู้ใช้)", urole "สิทธิ์",
       count(emp_id) over (partition by user_id) "จำนวนตัวเลือก",
       emp_code "รหัสพนักงาน", first_name||' '||coalesce(last_name,'') "ชื่อพนักงาน",
       department_name "แผนก(พนักงาน)", conf "ความมั่นใจ",
       '' "✅ยืนยัน", user_id::text "_user_id", emp_id::text "_employee_id"
from cand order by 4, conf, username;

-- สรุปตัวเลขรวม (ดูภาพรวมก่อนลงมือ)
with dept_map(u_dept, e_dept) as (values
  ('import','customer service import'), ('export','customer service export'),
  ('account','account'), ('management','manager')),
u as (select id, lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$','')) base,
             lower(coalesce(department,'')) udept
      from public.app_users where app_code='salary'),
e as (select id, lower(trim(coalesce(first_name_en,''))) fen, lower(coalesce(department_name,'')) edept
      from public.employees where emp_code !~ '^EMP'),
m as (select u.id uid, count(e.id) n,
             count(*) filter (where u.base = e.fen and exists
                (select 1 from dept_map d where d.u_dept=u.udept and d.e_dept=e.edept)) exact
      from u left join e on e.fen <> '' and (u.base = e.fen or e.fen like u.base||'%' or u.base like e.fen||'%')
      group by u.id)
select count(*) filter (where n=1 and exact=1) "ตรงชัดเจน (auto ได้)",
       count(*) filter (where n=1 and exact=0) "1 ตัวเลือก (ควรสุ่มตรวจ)",
       count(*) filter (where n>1)             "กำกวม (HR ต้องเลือก)",
       count(*) filter (where n=0)             "ไม่พบพนักงาน (ต้องสอบถาม)",
       count(*)                                 "รวมผู้ใช้ salary"
from m;
