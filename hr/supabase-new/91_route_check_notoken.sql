-- ============================================================
-- NJ HR V.10 — 91_route_check_notoken.sql   [อ่านอย่างเดียว 100%]
--
-- ตรวจความพร้อมของผังการอนุมัติทั้งบริษัท โดยไม่ต้องใช้ njhr_token
-- ใช้ตรรกะเดียวกับ njhr_wf_route_check() ทุกบรรทัด ต่างกันแค่ไม่มีขั้นตรวจ session
-- (รันใน SQL Editor ซึ่งเป็น service_role อยู่แล้ว จึงไม่ต้องพิสูจน์ตัวตนซ้ำ)
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete / drop แม้แต่คำเดียว
-- ⚠ แนะนำให้เลือก "No limit" ใน SQL Editor ก่อนรัน
-- ============================================================

with emp as (
  select e.id, coalesce(e.department_name,'') dept
    from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
),
t as (select unnest(array['LEAVE','OT']) rt),
pick as (
  select e.id eid, e.dept, t.rt,
         (select c.wid from (
            select w1.id wid, 1 pr
              from public.njhr_approval_workflow_emps m
              join public.njhr_approval_workflows w1 on w1.id = m.workflow_id
             where m.request_type = t.rt and m.employee_id = e.id and w1.deleted_at is null
            union all
            select w2.id, 2
              from public.njhr_approval_workflow_depts d
              join public.njhr_approval_workflows w2 on w2.id = d.workflow_id
             where d.request_type = t.rt and d.department = e.dept and w2.deleted_at is null
            union all
            select w3.id, 3
              from public.njhr_approval_workflow_depts d2
              join public.njhr_approval_workflows w3 on w3.id = d2.workflow_id
             where d2.request_type = t.rt and d2.department = '*' and w3.deleted_at is null
          ) c order by c.pr limit 1) wid
    from emp e cross join t
),
rows as (
  select p.rt, nullif(p.dept,'') dept, p.wid, count(*)::int emps,
         case when p.wid is null then 'ไม่พบผังการอนุมัติ'
              when (select count(*) from public.njhr_approval_steps s
                     where s.workflow_id = p.wid and s.deleted_at is null and s.active) = 0
                then 'พบผังแต่ไม่มีขั้นอนุมัติ'
              when exists (
                     select 1 from public.njhr_approval_steps s
                      where s.workflow_id = p.wid and s.deleted_at is null and s.active
                        and not exists (
                              select 1 from public.njhr_approval_step_approvers a
                                join public.employees e2 on e2.id = a.employee_id
                               where a.step_id = s.id and a.active
                                 and e2.status::text in ('ACTIVE','PROBATION')))
                then 'มีขั้นที่ยังไม่มีผู้อนุมัติ'
              else 'พร้อมใช้งาน' end st
    from pick p
   group by p.rt, p.dept, p.wid
)
select jsonb_pretty(jsonb_build_object(

  'พนักงานที่ตรวจ', (select count(*) from emp),

  'สรุปรวม', coalesce((
    select jsonb_object_agg(g.k, g.n) from (
      select r.rt || ' · ' || r.st k, sum(r.emps) n from rows r group by 1) g), '{}'::jsonb),

  'พร้อมใช้งานหรือยัง', (select count(*) = 0 from rows r where r.st <> 'พร้อมใช้งาน'),

  'รายการที่ต้องแก้', coalesce((
    select jsonb_agg(jsonb_build_object(
             'ประเภท', y.rt, 'แผนก', coalesce(y.dept,'(ไม่ระบุแผนก)'),
             'พนักงาน', y.emps, 'ปัญหา', y.st,
             'Workflow', coalesce((select coalesce(nullif(w.name,''), w.department)
                                     from public.njhr_approval_workflows w where w.id = y.wid), '—'))
             order by y.rt, y.dept)
      from rows y where y.st <> 'พร้อมใช้งาน'), '[]'::jsonb),

  'รายการที่พร้อมแล้ว', coalesce((
    select jsonb_agg(jsonb_build_object(
             'ประเภท', z.rt, 'แผนก', coalesce(z.dept,'(ไม่ระบุแผนก)'),
             'พนักงาน', z.emps,
             'Workflow', coalesce((select coalesce(nullif(w.name,''), w.department)
                                     from public.njhr_approval_workflows w where w.id = z.wid), '—'))
             order by z.rt, z.dept)
      from rows z where z.st = 'พร้อมใช้งาน'), '[]'::jsonb)

)) as route_check_report;
