-- ============================================================
-- ใบตรวจจับคู่รอบ 2: 54 บัญชีที่ยังไม่มี employee_id (จับคู่แบบใกล้เคียง)
-- อ่านอย่างเดียว 100% — ไม่มี create/alter/drop/insert/update/delete บนข้อมูลจริง
-- ใช้ pg_trgm หาความคล้ายของชื่ออังกฤษ เพราะสะกดต่างกัน เช่น naruemon ↔ NARUMON
-- ⚠️ ผลลัพธ์เป็นเพียง "ตัวเลือก" ให้ HR ยืนยัน — ห้ามนำไปผูกอัตโนมัติ
-- ============================================================
create extension if not exists pg_trgm;

-- ─── (1) นับจำนวนก่อน เพื่อดูภาพรวม ────────────────────────────
select
  (select count(*) from public.app_users
    where app_code='salary' and employee_id is null)                        as "บัญชีที่ยังไม่ผูก",
  (select count(*) from public.employees
    where emp_code !~ '^EMP' and status::text='ACTIVE'
      and id not in (select employee_id from public.app_users
                      where app_code='salary' and employee_id is not null)) as "พนักงานที่ยังไม่ถูกผูก";

-- ─── (2) ใบตรวจ: แต่ละบัญชีได้ผู้สมัคร 3 อันดับแรก ──────────────
--     Export CSV จากปุ่มใน Supabase → ส่งให้ HR ติ๊กช่อง "✅ยืนยัน"
with u as (
  select id uid, username, lower(coalesce(department,'')) udept,
         lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$', '')) base
  from public.app_users
  where app_code = 'salary' and employee_id is null),
e as (   -- เฉพาะพนักงานที่ยังไม่ถูกผูกกับบัญชีใด (กันผูกซ้ำตั้งแต่ต้น)
  select id eid, emp_code, first_name, last_name, department_name,
         lower(trim(coalesce(first_name_en,''))) fen,
         lower(coalesce(department_name,'')) edept
  from public.employees
  where emp_code !~ '^EMP' and status::text = 'ACTIVE'
    and id not in (select employee_id from public.app_users
                    where app_code='salary' and employee_id is not null)),
m as (
  select u.username                                          as "ชื่อผู้ใช้",
         u.udept                                             as "แผนก(ผู้ใช้)",
         e.emp_code                                          as "รหัสพนักงาน",
         e.first_name || ' ' || coalesce(e.last_name,'')     as "ชื่อพนักงาน",
         e.department_name                                   as "แผนก(พนักงาน)",
         round(similarity(u.base, e.fen)::numeric, 2)        as "คะแนนความคล้าย",
         case when (u.udept='import'     and e.edept='customer service import')
                or (u.udept='export'     and e.edept='customer service export')
                or (u.udept='account'    and e.edept='account')
                or (u.udept='management' and e.edept='manager')
              then 'แผนกตรง' else 'แผนกต่าง' end             as "แผนก",
         row_number() over (partition by u.uid
                            order by similarity(u.base, e.fen) desc) rk,
         ''                                                  as "✅ยืนยัน (ใส่ x)",
         u.uid::text                                         as "_user_id",
         e.eid::text                                         as "_employee_id"
  from u cross join e
  where e.fen <> '' and similarity(u.base, e.fen) > 0.25)
select * from m where rk <= 3 order by "ชื่อผู้ใช้", rk;

-- ─── (3) บัญชีที่ไม่มีผู้สมัครเลย (ต้องถาม HR ว่าเป็นใคร) ─────────
with u as (
  select id uid, username, lower(coalesce(department,'')) udept,
         lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$','')) base
  from public.app_users where app_code='salary' and employee_id is null),
e as (
  select lower(trim(coalesce(first_name_en,''))) fen from public.employees
   where emp_code !~ '^EMP' and status::text='ACTIVE'
     and id not in (select employee_id from public.app_users
                     where app_code='salary' and employee_id is not null))
select u.username as "บัญชีที่หาพนักงานไม่เจอเลย", u.udept as "แผนก"
from u where not exists (select 1 from e where e.fen <> '' and similarity(u.base, e.fen) > 0.25)
order by 1;
