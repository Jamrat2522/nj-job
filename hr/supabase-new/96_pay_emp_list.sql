-- ============================================================
-- NJ HR V.10 — 96_pay_emp_list.sql
-- หน้า "กำหนดรายการเงินเดือนให้พนักงาน" แบบหน้าเดียว
-- ต้องการรายชื่อ "พนักงานทุกคน" พร้อมรายการที่กำหนดไว้ในเดือนนั้น
-- รวมถึงคนที่ "ยังไม่ได้กำหนด" ด้วย ซึ่ง njhr_pay_entries เดิมไม่คืนให้
--
-- ต่อยอดของเดิมทั้งหมด ไม่สร้างตารางใหม่ ไม่แตะสูตรคำนวณเงินเดือน
--   employees · njhr_pay_entries · njhr_pay_items
--   ใช้ตรรกะช่วงเวลาเดียวกับ njhr_pay_entry_in_period (84) เป๊ะ
--   สิทธิ์ใช้ njhr_pay_guard เดิม (SUPER_ADMIN / ADMIN / ACCOUNT)
--
-- ต้องรัน 43 · 84 มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname='public' and p.proname='njhr_pay_entry_in_period') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_pay_entry_in_period — รัน 84_pay_entry_recurring.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · พนักงานที่ปฏิบัติงาน % คน',
    (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION'));
end $$;


-- ─── njhr_pay_emp_list ──────────────────────────────────────
--  1 แถว = 1 พนักงาน × 1 รายการ  · พนักงานที่ยังไม่มีรายการจะได้ 1 แถวที่ entry_id เป็น null
--  p_status = ALL | ASSIGNED | UNASSIGNED
create or replace function public.njhr_pay_emp_list(
  p_token text, p_year int, p_month int,
  p_q text default null, p_status text default 'ALL')
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text,
  entry_id uuid, item_code text, item_name text, kind text,
  amount numeric, note text, entry_mode text,
  effective_start date, effective_end date, is_active boolean,
  period_year int, period_month int,
  locked boolean, can_delete boolean, assigned boolean,
  entry_count int, total_earning numeric, total_deduction numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        st text := upper(btrim(coalesce(p_status,'ALL')));
        v_lock boolean;
begin
  select * into c from public.njhr_pay_guard(p_token, false);
  if not c.is_admin then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการเงินเดือนของพนักงาน' using errcode='42501';
  end if;
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  if st not in ('ALL','ASSIGNED','UNASSIGNED') then st := 'ALL'; end if;
  v_lock := public.njhr_pay_period_locked(p_year, p_month);

  return query
  with emp as (
    select e.id, e.emp_code,
           coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'') fname,
           coalesce(e.nickname,'') nick, coalesce(e.department_name,'') dept,
           coalesce(e.position_name,'') pos, e.status::text est
      from public.employees e
     where e.status::text in ('ACTIVE','PROBATION')
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.department_name,'')) like '%'||q||'%')
  ),
  ent as (
    select en.id eid, en.employee_id, en.item_code, i.name_th, i.kind, en.amount, en.note,
           coalesce(en.entry_mode,'ONE_TIME') mode, en.effective_start, en.effective_end,
           coalesce(en.is_active,true) act, en.period_year, en.period_month
      from public.njhr_pay_entries en
      join public.njhr_pay_items i on i.code = en.item_code and i.deleted_at is null
     where en.deleted_at is null
       and public.njhr_pay_entry_in_period(en.entry_mode, en.is_active,
             en.period_year, en.period_month, en.effective_start, en.effective_end,
             p_year, p_month)
  ),
  agg as (
    select t.employee_id, count(*)::int n,
           round(coalesce(sum(t.amount) filter (where t.kind = 'EARNING'), 0), 2) ern,
           round(coalesce(sum(t.amount) filter (where t.kind = 'DEDUCTION'), 0), 2) ded
      from ent t where t.act group by t.employee_id
  )
  select e.id, e.emp_code, e.fname, e.nick, e.dept, e.pos, e.est,
         t.eid, t.item_code, t.name_th, t.kind, t.amount, t.note, t.mode,
         t.effective_start, t.effective_end, t.act,
         t.period_year, t.period_month,
         v_lock,
         -- ลบได้เฉพาะรายการที่ยังไม่ถูกใช้ในงวดที่ยืนยัน/ปิดแล้ว
         (t.eid is not null and not exists (
            select 1 from public.payroll p
             where p.employee_id = e.id
               and upper(coalesce(p.status::text,'DRAFT')) in ('CALCULATED','PAID')
               and public.njhr_pay_entry_in_period(t.mode, t.act, t.period_year, t.period_month,
                     t.effective_start, t.effective_end, p.period_year, p.period_month))),
         (t.eid is not null),
         coalesce(a.n, 0), coalesce(a.ern, 0), coalesce(a.ded, 0)
    from emp e
    left join ent t on t.employee_id = e.id
    left join agg a on a.employee_id = e.id
   where (st = 'ALL')
      or (st = 'ASSIGNED' and t.eid is not null)
      or (st = 'UNASSIGNED' and coalesce(a.n, 0) = 0)
   order by e.emp_code,                      -- รหัสพนักงานน้อย→มาก
            (t.kind = 'DEDUCTION'),          -- เงินเพิ่มก่อน เงินหักทีหลัง
            t.name_th nulls first;
end $$;

grant execute on function public.njhr_pay_emp_list(text,int,int,text,text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.4-pay-emp-list', 'หน้ากำหนดรายการเงินเดือนแบบหน้าเดียว: รายชื่อพนักงาน + รายการที่กำหนด')
on conflict (version) do nothing;


-- ─── VERIFICATION ───────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function', (select jsonb_build_object('name', p.proname,
                 'args', pg_get_function_arguments(p.oid),
                 'returns_cols', (select count(*) from unnest(p.proargnames) x))
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='njhr_pay_emp_list'),
  'employees_active', (select count(*) from public.employees
                        where status::text in ('ACTIVE','PROBATION')),
  'pay_items_active', (select count(*) from public.njhr_pay_items
                        where deleted_at is null and active),
  'entries_live', (select count(*) from public.njhr_pay_entries where deleted_at is null)
)) as install_report;
