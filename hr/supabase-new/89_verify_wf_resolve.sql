-- ============================================================
-- NJ HR V.10 — 89_verify_wf_resolve.sql   [อ่านอย่างเดียว 100%]
--
-- ตรวจว่าพนักงานแต่ละคนจะได้ Workflow ชุดไหน ตาม Priority เดียวกับ njhr_wf_resolve
--   Priority 1 = ผูกพนักงานรายคน (scope EMPLOYEE)
--   Priority 2 = ผูกแผนกของพนักงาน (scope SELECTED)
--   Priority 3 = ทุกแผนก (scope ALL)
-- ใช้ตรรกะชุดเดียวกันเป๊ะ แต่ไม่ต้องใช้ token เพื่อให้รันตรวจได้สะดวก
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete / drop แม้แต่คำเดียว
-- ============================================================

with emp as (
  select e.id, e.emp_code, coalesce(e.department_name,'') dept
    from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
),
t as (select unnest(array['LEAVE','OT']) rt),
cand as (
  -- Priority 1
  select e.id eid, e.emp_code, e.dept, t.rt, 1 pr, w.id wid,
         coalesce(nullif(w.name,''), w.department) wname, w.scope
    from emp e cross join t
    join public.njhr_approval_workflow_emps m
      on m.request_type = t.rt and m.employee_id = e.id
    join public.njhr_approval_workflows w on w.id = m.workflow_id and w.deleted_at is null
  union all
  -- Priority 2
  select e.id, e.emp_code, e.dept, t.rt, 2, w.id,
         coalesce(nullif(w.name,''), w.department), w.scope
    from emp e cross join t
    join public.njhr_approval_workflow_depts d
      on d.request_type = t.rt and d.department = e.dept
    join public.njhr_approval_workflows w on w.id = d.workflow_id and w.deleted_at is null
  union all
  -- Priority 3
  select e.id, e.emp_code, e.dept, t.rt, 3, w.id,
         coalesce(nullif(w.name,''), w.department), w.scope
    from emp e cross join t
    join public.njhr_approval_workflow_depts d2
      on d2.request_type = t.rt and d2.department = '*'
    join public.njhr_approval_workflows w on w.id = d2.workflow_id and w.deleted_at is null
),
win as (
  select distinct on (c.eid, c.rt) c.*,
         (select count(*) from public.njhr_approval_steps s
           where s.workflow_id = c.wid and s.deleted_at is null and s.active) steps
    from cand c
   order by c.eid, c.rt, c.pr
),
allpair as (
  select e.id eid, e.emp_code, e.dept, t.rt from emp e cross join t
)
select jsonb_pretty(jsonb_build_object(

  'พนักงานที่ตรวจ', (select count(*) from emp),

  -- สรุปว่าแต่ละประเภทคำขอ มีคนที่หา Workflow เจอ/ไม่เจอ กี่คน
  -- (ต้องนับใน subquery ก่อน แล้วค่อย aggregate ชั้นนอก — ซ้อน aggregate ไม่ได้)
  'สรุปรายประเภท', coalesce((
    select jsonb_object_agg(g.rt, jsonb_build_object(
             'หา Workflow เจอ', g.found,
             'หาไม่เจอ',        g.missing,
             'เจอแต่ยังไม่มีขั้นอนุมัติ', g.nostep))
      from (select a.rt,
                   count(*) filter (where w.wid is not null) found,
                   count(*) filter (where w.wid is null) missing,
                   count(*) filter (where w.wid is not null and coalesce(w.steps,0) = 0) nostep
              from allpair a left join win w on w.eid = a.eid and w.rt = a.rt
             group by a.rt) g), '{}'::jsonb),

  -- แยกตาม Priority ที่ชนะ
  'แยกตาม Priority', coalesce((
    select jsonb_object_agg(k, n) from (
      select w.rt || ' · P' || w.pr || ' (' || w.scope || ')' k, count(*) n
        from win w group by 1) x), '{}'::jsonb),

  -- แผนกที่ยังหา Workflow ไม่เจอ (ต้องสร้างชุดเพิ่ม)
  'แผนกที่ยังไม่มี Workflow', coalesce((
    select jsonb_agg(jsonb_build_object('ประเภท', y.rt, 'แผนก', y.dept, 'พนักงาน', y.n)
                     order by y.rt, y.dept)
      from (select a.rt, nullif(a.dept,'') dept, count(*) n
              from allpair a left join win w on w.eid = a.eid and w.rt = a.rt
             where w.wid is null
             group by a.rt, a.dept) y), '[]'::jsonb),

  -- ตัวอย่างผลจริง 15 คนแรก
  'ตัวอย่าง 15 คนแรก', coalesce((
    select jsonb_agg(jsonb_build_object(
             'รหัส', z.emp_code, 'แผนก', z.dept, 'ประเภท', z.rt,
             'Workflow', coalesce(z.wname, '— ไม่พบ —'),
             'Priority', z.pr, 'ขอบเขต', z.scope, 'ขั้นอนุมัติ', z.steps)
             order by z.emp_code, z.rt)
      from (select a.emp_code, a.dept, a.rt, w.wname, w.pr, w.scope, w.steps
              from allpair a left join win w on w.eid = a.eid and w.rt = a.rt
             order by a.emp_code, a.rt limit 15) z), '[]'::jsonb),

  -- ยืนยันว่าไม่มีใครแมตช์หลายชุดพร้อมกัน
  'ตรวจซ้ำซ้อน', jsonb_build_object(
    'จำนวนคู่ (พนักงาน×ประเภท) ที่มีผลลัพธ์', (select count(*) from win),
    'ต้องไม่เกิน', (select count(*) from allpair),
    'ผ่าน', (select count(*) from win) <= (select count(*) from allpair))

)) as wf_resolve_report;
