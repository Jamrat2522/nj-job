-- ============================================================
-- NJ HR V.10 — 83_verify_shift_counts.sql   [อ่านอย่างเดียว 100%]
--
-- ตรวจตัวเลขที่หน้า "ตั้งค่ากะทำงาน" ต้องแสดง โดยอ่านจากตารางจริง
-- ใช้ตรรกะเดียวกับ njhr_shift_list และ njhr_shift_unassigned_employees เป๊ะ
--
-- ผลรวมที่ต้องเป็นจริง:  มีกะแล้ว + ยังไม่มีกะ = พนักงาน ACTIVE + PROBATION
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete แม้แต่คำเดียว
-- ============================================================

with active_emp as (
  select e.id, e.emp_code, e.status::text st
    from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
),
-- กะที่ "มีผลล่าสุด ณ วันนี้" ของพนักงานแต่ละคน (ตรรกะเดียวกับ njhr_shift_list)
cur as (
  select es.employee_id, es.shift_id, es.effective_date
    from public.employee_shifts es
   where coalesce(es.status,'ACTIVE') = 'ACTIVE'
     and (es.effective_date is null or es.effective_date <= current_date)
     and es.effective_date = (select max(es2.effective_date)
                                from public.employee_shifts es2
                               where es2.employee_id = es.employee_id
                                 and coalesce(es2.status,'ACTIVE') = 'ACTIVE'
                                 and es2.effective_date <= current_date)
),
-- ยังไม่มีกะ (ตรรกะเดียวกับ njhr_shift_unassigned_employees)
unassigned as (
  select a.id, a.emp_code from active_emp a
   where not exists (
     select 1 from public.employee_shifts es
      where es.employee_id = a.id
        and coalesce(es.status,'ACTIVE') = 'ACTIVE'
        and (es.effective_date is null or es.effective_date <= current_date))
)
select jsonb_pretty(jsonb_build_object(

  '1_employees_ทั้งหมด',       (select count(*) from public.employees),
  '1_ACTIVE',                  (select count(*) from active_emp where st='ACTIVE'),
  '1_PROBATION',               (select count(*) from active_emp where st='PROBATION'),
  '1_ACTIVE_PROBATION_รวม',    (select count(*) from active_emp),

  '2_employee_shifts_แถวทั้งหมด', (select count(*) from public.employee_shifts),
  '2_พนักงานที่มีประวัติกะ',      (select count(distinct employee_id) from public.employee_shifts),
  '2_กะที่มีผลวันนี้',            (select count(*) from cur),

  '3_ยังไม่มีกะ',              (select count(*) from unassigned),
  '3_รหัสที่ยังไม่มีกะ_20คนแรก', coalesce((select jsonb_agg(x.emp_code order by x.emp_code)
                                   from (select emp_code from unassigned
                                          order by emp_code limit 20) x), '[]'::jsonb),

  '4_ตรวจผลรวม', jsonb_build_object(
     'มีกะแล้ว',   (select count(*) from cur c join active_emp a on a.id = c.employee_id),
     'ยังไม่มีกะ', (select count(*) from unassigned),
     'รวม',        (select count(*) from cur c join active_emp a on a.id = c.employee_id)
                 + (select count(*) from unassigned),
     'พนักงานจริง', (select count(*) from active_emp),
     'ตรงกันหรือไม่',
        ((select count(*) from cur c join active_emp a on a.id = c.employee_id)
        + (select count(*) from unassigned)) = (select count(*) from active_emp)),

  '5_แยกตามกะ', coalesce((
     select jsonb_agg(jsonb_build_object(
              'กะ', w.shift_name,
              'เวลา', w.start_time::text || '–' || w.end_time::text,
              'ใช้งาน', w.is_active,
              'พนักงาน', (select count(*) from cur c join active_emp a on a.id = c.employee_id
                            where c.shift_id = w.id))
              order by w.shift_name)
       from public.work_shifts w), '[]'::jsonb)

)) as shift_count_report;
