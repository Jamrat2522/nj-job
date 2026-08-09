-- ============================================================
-- NJ HR V.10 — 80_dashboard.sql
-- E) njhr_dashboard_summary — รวมข้อมูลหน้า Dashboard ใน RPC เดียว
--
-- ตารางที่ใช้ (ยืนยันจากโค้ดจริงทั้งหมด ไม่มีการเดา)
--   employees · attendance · leave_requests · ot_requests · announcements
--   attendance_corrections · njhr_emp_documents · njhr_shift_at
--
-- ข้อกำหนดที่บังคับไว้
--   · timezone Asia/Bangkok ทุกจุดที่ตัดสิน "วันนี้"
--   · เคารพ Role: พนักงานทั่วไปเห็นเฉพาะยอดของตนเอง ไม่เห็นยอดทั้งบริษัท
--   · ไม่คืนข้อมูลเงินเดือนให้ผู้ไม่มีสิทธิ์ (เฉพาะ SUPER_ADMIN / ADMIN / ACCOUNT)
--   · ไม่มีข้อมูลก็คืน 0 หรือ [] เสมอ ไม่คืน null ให้หน้าจอว่าง
--
-- ต้องรัน 41 · 42 · 48 · 64 · 65 · 77 · 79 มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.attendance_corrections') is null then
    raise exception 'PREFLIGHT: ไม่พบ attendance_corrections — รัน 79_att_corrections.sql ก่อน';
  end if;
  if to_regclass('public.company_announcements') is null then
    raise notice 'ยังไม่พบ company_announcements → Dashboard จะคืน announcements = [] ไปก่อน · รัน 80 ซ้ำอีกครั้งหลังทำ 77 เสร็จ';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── ตัวช่วยดึงประกาศ — สร้างตามสภาพจริงของฐานข้อมูล ────────
--  ยังไม่มีตาราง announcements → คืน [] เพื่อให้ Dashboard ใช้งานได้ก่อน
--  มีตารางแล้ว → อ่านของจริง · รัน 80 ซ้ำหลังรัน 77 เสร็จเพื่ออัปเกรดตัวนี้
do $$
begin
  if to_regclass('public.company_announcements') is null then
    execute $f$
      create or replace function public.njhr_dashboard_announcements(p_limit int default 5)
      returns jsonb language sql stable security definer set search_path = public as $b$
        select '[]'::jsonb;
      $b$;
    $f$;
  else
    execute $f$
      create or replace function public.njhr_dashboard_announcements(p_limit int default 5)
      returns jsonb language sql stable security definer set search_path = public as $b$
        select coalesce((
          select jsonb_agg(x order by x->>'sort_key') from (
            select jsonb_build_object(
                     'id', a.id, 'title', a.title,
                     'content', left(coalesce(a.body,''), 400),
                     'priority', upper(coalesce(a.priority,'NORMAL')),
                     'publish_at', a.published_at,
                     'sort_key', lpad((case upper(coalesce(a.priority,'NORMAL'))
                         when 'URGENT' then 0 when 'HIGH' then 1
                         when 'NORMAL' then 2 else 3 end)::text, 2, '0') ||
                       to_char(coalesce(a.published_at, a.created_at, now()), 'YYYYMMDDHH24MISS')) x
              from public.company_announcements a
             where coalesce(a.is_active,true)
               and coalesce(a.published_at, a.created_at, now()) <= now()
               and (a.expire_at is null or a.expire_at > now())
             order by coalesce(a.published_at, a.created_at) desc
             limit greatest(coalesce(p_limit,5),1)) s), '[]'::jsonb);
      $b$;
    $f$;
  end if;
end $$;
revoke execute on function public.njhr_dashboard_announcements(int) from public, anon, authenticated;


create or replace function public.njhr_dashboard_summary(p_token text)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_today date := (now() at time zone 'Asia/Bangkok')::date;
        v_mgr boolean; v_pay boolean; v_emp uuid;
begin
  select * into c from public.njhr_ctx(p_token);           -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER');
  v_pay := c.role in ('SUPER_ADMIN','ADMIN','ACCOUNT');    -- สิทธิ์เห็นข้อมูลเงินเดือน
  v_emp := c.employee_id;

  return query select jsonb_build_object(

    'as_of',    to_char(now() at time zone 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS'),
    'today',    v_today,
    'role',     c.role,
    'is_manager', v_mgr,
    'can_see_payroll', v_pay,
    'employee_id', v_emp,

    -- ── ยอดรวมทั้งบริษัท (เฉพาะผู้มีสิทธิ์) ──────────────────
    'company', case when not v_mgr then '{}'::jsonb else jsonb_build_object(
      'employees_active',    (select count(*) from public.employees
                               where status::text = 'ACTIVE'),
      'employees_probation', (select count(*) from public.employees
                               where status::text = 'PROBATION'),
      'checked_in_today',    (select count(*) from public.attendance a
                               where a.work_date = v_today and a.check_in is not null),
      'late_today',          (select count(*) from public.attendance a
                               where a.work_date = v_today and a.status::text = 'LATE'),
      'on_leave_today',      (select count(distinct l.employee_id)
                                from public.leave_requests l
                               where l.status = 'APPROVED'
                                 and l.start_date <= v_today and l.end_date >= v_today),
      'ot_today',            (select count(*) from public.ot_requests o
                               where o.ot_date = v_today
                                 and o.status not in ('CANCELLED','REJECTED')),
      'pending_leave',       (select count(*) from public.leave_requests
                               where status = 'PENDING'),
      'pending_ot',          (select count(*) from public.ot_requests
                               where status = 'PENDING'),
      'pending_correction',  (select count(*) from public.attendance_corrections
                               where status = 'PENDING'),
      'pending_document',    (select count(*) from public.njhr_emp_documents
                               where deleted_at is null
                                 and status in ('PENDING','PENDING_APPROVAL')),
      'pending_total',       (select count(*) from public.leave_requests where status='PENDING')
                           + (select count(*) from public.ot_requests where status='PENDING')
                           + (select count(*) from public.attendance_corrections where status='PENDING')
    ) end,

    -- ── ยอดของตัวผู้ใช้เอง (ทุก Role เห็นของตัวเอง) ──────────
    'me', case when v_emp is null then '{}'::jsonb else jsonb_build_object(
      'attendance_today', coalesce((
        select jsonb_build_object('check_in', a.check_in, 'check_out', a.check_out,
                                  'status', a.status::text, 'work_hours', a.work_hours)
          from public.attendance a
         where a.employee_id = v_emp and a.work_date = v_today), '{}'::jsonb),
      'shift_today', coalesce((
        select jsonb_build_object('shift_name', s.shift_name,
                 'start_time', s.start_time::text, 'end_time', s.end_time::text)
          from public.njhr_shift_at(v_emp, v_today) s), '{}'::jsonb),
      'my_pending_leave',      (select count(*) from public.leave_requests
                                 where employee_id = v_emp and status = 'PENDING'),
      'my_pending_ot',         (select count(*) from public.ot_requests
                                 where employee_id = v_emp and status = 'PENDING'),
      'my_pending_correction', (select count(*) from public.attendance_corrections
                                 where employee_id = v_emp and status = 'PENDING'),
      'my_unread_notify',      (select count(*) from public.notifications n
                                 where n.user_id = c.app_user_id and not coalesce(n.is_read,false)),
      'my_unacked_documents',  (select count(*) from public.njhr_emp_documents d
                                 where d.employee_id = v_emp and d.deleted_at is null
                                   and d.status in ('SENT','VIEWED'))
    ) end,

    -- ── ประกาศที่กำลังเผยแพร่ (ผ่านตัวช่วยที่สร้างตามสภาพจริงของฐานข้อมูล) ──
    'announcements', public.njhr_dashboard_announcements(5),

    -- ── รายการล่าสุดตามสิทธิ์ ────────────────────────────────
    'recent_leaves', coalesce((
      select jsonb_agg(y order by y->>'created_at' desc) from (
        select jsonb_build_object(
                 'id', l.id, 'employee_id', l.employee_id,
                 'emp_name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                 'start_date', l.start_date, 'end_date', l.end_date,
                 'status', l.status, 'created_at', l.created_at) y
          from public.leave_requests l join public.employees e on e.id = l.employee_id
         where (v_mgr or l.employee_id = v_emp)
         order by l.created_at desc limit 5) t), '[]'::jsonb),

    'recent_ots', coalesce((
      select jsonb_agg(y order by y->>'created_at' desc) from (
        select jsonb_build_object(
                 'id', o.id, 'employee_id', o.employee_id,
                 'emp_name', coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
                 'ot_date', o.ot_date, 'status', o.status, 'created_at', o.created_at) y
          from public.ot_requests o join public.employees e on e.id = o.employee_id
         where (v_mgr or o.employee_id = v_emp)
         order by o.created_at desc limit 5) t), '[]'::jsonb),

    -- ── งวดเงินเดือน: คืนเฉพาะผู้มีสิทธิ์ ─────────────────────
    'payroll', case when not v_pay then '{}'::jsonb else coalesce((
      select jsonb_build_object('period_month', p.period_month, 'period_year', p.period_year,
                                'status', p.status)
        from public.payroll p
       order by p.period_year desc, p.period_month desc limit 1), '{}'::jsonb) end
  );
end $$;

grant execute on function public.njhr_dashboard_summary(text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.4-dashboard', 'njhr_dashboard_summary: รวมยอด Dashboard ใน RPC เดียว เคารพ Role')
on conflict (version) do nothing;


-- ─── VERIFICATION ───────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function_exists', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proname='njhr_dashboard_summary') > 0,
  'today_bangkok', (now() at time zone 'Asia/Bangkok')::date,
  'source_tables', jsonb_build_object(
    'employees', (select count(*) from public.employees),
    'attendance_today', (select count(*) from public.attendance
                          where work_date = (now() at time zone 'Asia/Bangkok')::date),
    'leave_pending', (select count(*) from public.leave_requests where status='PENDING'),
    'ot_pending', (select count(*) from public.ot_requests where status='PENDING'),
    'announcements_live', jsonb_array_length(public.njhr_dashboard_announcements(50))),
  'company_announcements_ready', to_regclass('public.company_announcements') is not null
)) as install_report;
