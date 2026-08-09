-- ============================================================
-- เชื่อม app_users.employee_id (เฉพาะ 54 คนที่ "ชื่อ+แผนกตรง" และมีตัวเลือกเดียว)
-- ⚠️ คำสั่งแรกที่เขียนข้อมูล — รันทีละส่วนตามลำดับ อย่ารันรวดเดียว
-- แตะเฉพาะคอลัมน์ employee_id ของ app_users ที่ app_code='salary' และค่าปัจจุบันเป็น NULL
-- ไม่แตะตารางอื่น ไม่ลบอะไร ไม่แก้สิทธิ์ ไม่แก้รหัสผ่าน
-- ============================================================

-- ─── ส่วนที่ 1: สำรองสถานะปัจจุบัน (รันก่อนเสมอ) ───────────────
create table if not exists njhr_link_backup_20260727 as
select id as app_user_id, username, app_code, employee_id as employee_id_before, now() as backed_up_at
from public.app_users where app_code = 'salary';
select count(*) as "สำรองแล้วกี่แถว", count(employee_id_before) as "ที่เคยมีค่าอยู่แล้ว"
from njhr_link_backup_20260727;


-- ─── ส่วนที่ 2: DRY RUN — ดูรายชื่อ 54 คู่ที่จะเขียนจริง (ยังไม่เขียน) ───
create or replace view njhr_link_candidates as
with dept_map(u_dept, e_dept) as (values
  ('import','customer service import'), ('export','customer service export'),
  ('account','account'), ('management','manager')),
u as (select id uid, username, lower(coalesce(department,'')) udept,
             lower(regexp_replace(coalesce(internal_username, username), '[0-9]+$','')) base
      from public.app_users where app_code='salary' and employee_id is null),
e as (select id eid, emp_code, first_name, last_name, lower(trim(coalesce(first_name_en,''))) fen,
             lower(coalesce(department_name,'')) edept
      from public.employees where emp_code !~ '^EMP'),
pair as (
  select u.uid, u.username, e.eid, e.emp_code, e.first_name, e.last_name
  from u join e on u.base = e.fen
   and exists (select 1 from dept_map d where d.u_dept = u.udept and d.e_dept = e.edept))
select * from pair p
where (select count(*) from pair x where x.uid = p.uid) = 1      -- ผู้ใช้คนนี้มีคู่เดียว
  and (select count(*) from pair y where y.eid = p.eid) = 1;     -- พนักงานคนนี้ถูกจับคู่ครั้งเดียว

select count(*) as "จำนวนคู่ที่จะเขียน" from njhr_link_candidates;
select username, emp_code, first_name || ' ' || coalesce(last_name,'') as emp_name
from njhr_link_candidates order by username;


-- ─── ส่วนที่ 3: เขียนจริง (รันเมื่อดูรายชื่อส่วนที่ 2 แล้วพอใจ) ─────
begin;
  update public.app_users a
     set employee_id = c.eid, updated_at = now()
    from njhr_link_candidates c
   where a.id = c.uid
     and a.app_code = 'salary'
     and a.employee_id is null;                                   -- กันเขียนทับของเดิม

  -- ตรวจก่อน commit: ต้องได้ 54 และห้ามมีพนักงานคนเดียวถูกผูกกับ 2 ผู้ใช้
  select count(*) as "ผูกแล้วทั้งหมด" from public.app_users
   where app_code='salary' and employee_id is not null;
  select count(*) as "พนักงานที่ถูกผูกซ้ำ (ต้องเป็น 0)" from (
     select employee_id from public.app_users
      where app_code='salary' and employee_id is not null
      group by employee_id having count(*) > 1) d;
commit;
-- ❗ ถ้าตัวเลขไม่ถูก ให้พิมพ์  rollback;  แทน commit;


-- ─── ส่วนที่ 4: ROLLBACK (ใช้เมื่อต้องการย้อนกลับหลัง commit ไปแล้ว) ──
-- update public.app_users a set employee_id = b.employee_id_before
--   from njhr_link_backup_20260727 b where a.id = b.app_user_id;
-- drop view if exists njhr_link_candidates;
-- drop table if exists njhr_link_backup_20260727;
