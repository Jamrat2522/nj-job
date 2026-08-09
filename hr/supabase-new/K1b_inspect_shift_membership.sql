-- ============================================================
-- NJ HR V2 — K1b_inspect_shift_membership.sql
-- ตรวจโครงสร้างจริงก่อนทำ "นำออกจากกะ / ย้ายกะ / ไม่ใช้กะ"
--
-- คำสั่งเดียวจบ คืน JSON ก้อนเดียว — เพราะ SQL Editor ของ Supabase
-- แสดงผลเฉพาะคำสั่งสุดท้าย (K1 ฉบับก่อนแยกเป็น 10 คำสั่งจึงเห็นแค่หัวข้อ K)
--
-- อ่านอย่างเดียว · ไม่แก้ข้อมูล · ไม่สร้างตาราง · ไม่แตะ RPC
-- คัดลอกผลลัพธ์ทั้งก้อนส่งกลับมาได้เลย
-- ============================================================

select jsonb_pretty(jsonb_build_object(

  -- A) คอลัมน์จริง — ดูว่า shift_id เป็น NOT NULL หรือไม่ (ตัดสินว่าจะใส่แถว "ไม่มีกะ" ได้ไหม)
  'A_columns', jsonb_build_object(
    'employee_shifts', (select jsonb_agg(jsonb_build_object(
        'column', c.column_name, 'type', c.data_type,
        'nullable', c.is_nullable, 'default', c.column_default) order by c.ordinal_position)
      from information_schema.columns c
     where c.table_schema='public' and c.table_name='employee_shifts'),
    'work_shifts', (select jsonb_agg(jsonb_build_object(
        'column', c.column_name, 'type', c.data_type,
        'nullable', c.is_nullable, 'default', c.column_default) order by c.ordinal_position)
      from information_schema.columns c
     where c.table_schema='public' and c.table_name='work_shifts')),

  -- B) Constraint จริง — มี CHECK จำกัดค่า status หรือ UNIQUE (employee_id, effective_date) ไหม
  'B_constraints', (select jsonb_agg(jsonb_build_object(
      'table', rel.relname, 'name', con.conname, 'definition', pg_get_constraintdef(con.oid))
      order by rel.relname, con.conname)
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
   where ns.nspname='public' and rel.relname in ('employee_shifts','work_shifts')),

  -- C) Index จริง
  'C_indexes', (select jsonb_agg(jsonb_build_object(
      'table', tablename, 'name', indexname, 'definition', indexdef)
      order by tablename, indexname)
    from pg_indexes
   where schemaname='public' and tablename in ('employee_shifts','work_shifts')),

  -- D) ค่า status ที่ใช้อยู่จริงในข้อมูล
  'D_status_values', (select jsonb_agg(x order by x->>'status')
    from (select jsonb_build_object(
            'status', coalesce(es.status,'(null)'),
            'row_count', count(*),
            'employees', count(distinct es.employee_id),
            'first_date', min(es.effective_date),
            'last_date', max(es.effective_date)) as x
            from public.employee_shifts es
           group by coalesce(es.status,'(null)')) t),

  -- E) ตัวอย่างประวัติของคนที่มีหลายแถว — ดูรูปแบบการเก็บ History จริง
  'E_history_sample', (select jsonb_agg(jsonb_build_object(
      'emp_code', e.emp_code,
      'full_name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
      'effective_date', es.effective_date,
      'shift_name', w.shift_name,
      'status', es.status,
      'assigned_by', es.assigned_by,
      'assigned_at', es.assigned_at) order by e.emp_code, es.effective_date)
    from public.employee_shifts es
    join public.employees e on e.id = es.employee_id
    left join public.work_shifts w on w.id = es.shift_id
   where es.employee_id in (
     select employee_id from public.employee_shifts
      group by employee_id having count(*) > 1
      order by count(*) desc limit 5)),

  -- F) จำนวนแถวต่อพนักงาน — เคยมีการเก็บหลายช่วงจริงหรือยัง
  'F_rows_per_employee', (select jsonb_agg(x order by (x->>'rows_per_employee')::int)
    from (select jsonb_build_object(
            'rows_per_employee', t.n, 'employees', count(*)) as x
            from (select employee_id, count(*) as n
                    from public.employee_shifts group by employee_id) t
           group by t.n) y),

  -- G) ฟังก์ชันทุกตัวที่อ่าน employee_shifts — ถ้าเปลี่ยนความหมาย status ต้องแก้ทุกตัวนี้พร้อมกัน
  --    ใช้ prosrc ไม่ใช้ pg_get_functiondef เพราะ aggregate ใช้ไม่ได้ (ERROR 42809)
  'G_functions_reading_employee_shifts', (select jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'args', pg_get_function_identity_arguments(p.oid),
      'language', l.lanname,
      'volatility', p.provolatile,
      'security_definer', p.prosecdef) order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language  l on l.oid = p.prolang
   where n.nspname='public' and p.prokind='f' and p.prosrc ilike '%employee_shifts%'),

  -- H) นิยามเต็มของ njhr_shift_at — ตัวที่ Attendance / OT / REPORT ใช้ resolve กะย้อนหลัง
  'H_njhr_shift_at', (select pg_get_functiondef(p.oid)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname='njhr_shift_at' limit 1),

  -- I) employees มีคอลัมน์ที่ใช้เป็น "ไม่ใช้กะ" ได้อยู่แล้วหรือไม่
  'I_employee_shift_columns', (select jsonb_agg(jsonb_build_object(
      'column', column_name, 'type', data_type,
      'nullable', is_nullable, 'default', column_default) order by ordinal_position)
    from information_schema.columns
   where table_schema='public' and table_name='employees'
     and (column_name ilike '%shift%' or column_name ilike '%schedule%'
          or column_name ilike '%roster%' or column_name ilike '%emp_type%'
          or column_name ilike '%employee_category%')),

  -- J) ตัวเลข 4 ตัวบน Card หน้า "ตั้งค่ากะทำงาน" ตอนนี้
  'J_current_counts', jsonb_build_object(
    'employees_active_probation',
      (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
    'shifts_total',  (select count(*) from public.work_shifts),
    'shifts_active', (select count(*) from public.work_shifts where is_active),
    'employees_without_shift',
      (select count(*) from public.employees e
        where e.status::text in ('ACTIVE','PROBATION')
          and not exists (select 1 from public.employee_shifts es
                           where es.employee_id = e.id
                             and coalesce(es.status,'ACTIVE')='ACTIVE'
                             and (es.effective_date is null or es.effective_date <= current_date)))),

  -- K) ปริมาณข้อมูลย้อนหลังที่จะได้รับผลกระทบถ้าแก้ njhr_shift_at
  'K_history_volume', jsonb_build_object(
    'attendance_rows', (select count(*) from public.attendance),
    'attendance_from', (select min(work_date) from public.attendance),
    'attendance_to',   (select max(work_date) from public.attendance),
    'ot_rows',         (select count(*) from public.ot_requests),
    'employee_shift_rows', (select count(*) from public.employee_shifts))

)) as k1_inspect_result;
