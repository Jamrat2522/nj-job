-- ============================================================
-- NJ HR V.10 — 53_payslip.sql
-- E-PAYSLIP: อ่านข้อมูลจริงจากตาราง payroll (ไม่ใช้ db.payroll ใน localStorage อีก)
--
-- ใช้คอลัมน์ที่ตรวจยืนยันแล้วจาก payroll 29 คอลัมน์ + tax ที่เพิ่มใน 51_core_schema.sql
-- ไม่สร้างตารางใหม่ · ไม่แตะข้อมูลเดิม
-- ต้องรัน 51_core_schema.sql (คอลัมน์ tax) และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.payroll') is null then raise exception 'PREFLIGHT: ไม่พบตาราง payroll'; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='payroll'
     and column_name in ('employee_id','period_year','period_month','pay_date','base_salary',
       'position_allow','oil_allow','phone_allow','diligence','ot_amount','shift_allow','bonus',
       'commission','social_security','student_loan','advance_deduct','personal_leave_deduct',
       'late_deduct','other_leave_deduct','absent_deduct','suspend_deduct','other_deduct',
       'total_income','total_deduct','net_pay','status','tax');
  if n <> 27 then
    raise exception 'PREFLIGHT: payroll คอลัมน์ไม่ครบ 27 (พบ %) — รัน 51_core_schema.sql ก่อนเพื่อเพิ่ม tax', n;
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create index if not exists njhr_payroll_period_idx on public.payroll (period_year desc, period_month desc);
create index if not exists njhr_payroll_emp_idx    on public.payroll (employee_id, period_year desc, period_month desc);

insert into public.njhr_schema_version(version, note)
values ('v11.2-payslip', 'E-PAYSLIP อ่านจากตาราง payroll จริง')
on conflict (version) do nothing;


-- ─── 1) สิทธิ์ ───────────────────────────────────────────────
-- ผู้ดูแลเห็นทุกคน · พนักงานทั่วไปเห็นเฉพาะของตนเองและเฉพาะงวดที่จ่ายแล้ว
create or replace function public.njhr_slip_guard(p_token text)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','ACCOUNT'));
end $$;


-- ─── 2) งวดเงินเดือนที่มีอยู่จริง (ใช้เติม Dropdown เดือน/ปี) ──
create or replace function public.njhr_slip_periods(p_token text)
returns table (period_year int, period_month int, rows_count int, paid_count int, status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_slip_guard(p_token);
  return query
  select p.period_year, p.period_month, count(*)::int,
         count(*) filter (where p.status = 'PAID')::int,
         case when count(*) filter (where p.status = 'PAID') = count(*) then 'PAID'
              when count(*) filter (where p.status = 'CALCULATED') > 0 then 'CALCULATED'
              else 'DRAFT' end
    from public.payroll p
   where c.is_admin
      or (p.employee_id = c.employee_id and p.status = 'PAID')   -- พนักงานเห็นเฉพาะงวดที่จ่ายแล้ว
   group by p.period_year, p.period_month
   order by p.period_year desc, p.period_month desc;
end $$;


-- ─── 3) รายชื่อสลิปในงวดที่เลือก ─────────────────────────────
create or replace function public.njhr_slip_list(
  p_token text, p_year int, p_month int, p_q text default null,
  p_limit int default 50, p_offset int default 0)
returns table (
  payroll_id uuid, employee_id uuid, emp_code text, emp_name text,
  department text, position_name text, emp_status text,
  period_year int, period_month int, pay_date date, status text,
  total_income numeric, total_deduct numeric, net_pay numeric, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
begin
  select * into c from public.njhr_slip_guard(p_token);
  if p_year is null or p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'กรุณาเลือกเดือนและปีให้ถูกต้อง' using errcode='22023';
  end if;
  if not c.is_admin and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงยังไม่มีสลิปเงินเดือน' using errcode='28000';
  end if;
  return query
  with base as (
    select p.id pid, p.employee_id eid, coalesce(e.emp_code, p.employee_code) ec,
           btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           coalesce(e.department_name,'') edept, coalesce(e.position_name,'') epos,
           coalesce(e.status::text,'') estat,
           p.period_year py, p.period_month pm, p.pay_date pd, p.status::text st,
           coalesce(p.total_income,0) ti, coalesce(p.total_deduct,0) td, coalesce(p.net_pay,0) np
      from public.payroll p
      left join public.employees e on e.id = p.employee_id
     where p.period_year = p_year and p.period_month = p_month
       and (c.is_admin or (p.employee_id = c.employee_id and p.status = 'PAID'))
       and (q = '' or lower(coalesce(e.emp_code, p.employee_code, '')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.department_name,'')) like '%'||q||'%'))
  select b.pid, b.eid, b.ec, nullif(b.enm,''), b.edept, b.epos, b.estat,
         b.py, b.pm, b.pd, b.st, b.ti, b.td, b.np, (select count(*) from base)
    from base b order by b.ec
   limit least(greatest(coalesce(p_limit,50),1),200) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 4) สลิป 1 ใบ (คืนรูปแบบที่หน้าจอใช้อยู่เดิม) ────────────
create or replace function public.njhr_slip_get(p_token text, p_payroll_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; p record; e record;
begin
  select * into c from public.njhr_slip_guard(p_token);
  select * into p from public.payroll where id = p_payroll_id;
  if not found then raise exception 'ไม่พบสลิปเงินเดือนใบนี้' using errcode='P0002'; end if;
  if not c.is_admin then
    if p.employee_id is distinct from c.employee_id then
      raise exception 'ดูได้เฉพาะสลิปเงินเดือนของตนเอง' using errcode='42501';
    end if;
    if p.status <> 'PAID' then
      raise exception 'สลิปงวดนี้ยังไม่ถูกเผยแพร่' using errcode='42501';
    end if;
  end if;
  select * into e from public.employees where id = p.employee_id;

  return query select jsonb_build_object(
    'payroll_id', p.id,
    'period_month', p.period_month, 'period_year', p.period_year,
    'pay_date', p.pay_date, 'status', p.status::text,
    -- ข้อมูลพนักงานอ่านจาก employees สด
    'emp', jsonb_build_object(
      'id', p.employee_id,
      'code', coalesce(e.emp_code, p.employee_code, ''),
      'title', coalesce(e.prefix,''),
      'firstName', coalesce(e.first_name,''),
      'lastName', coalesce(e.last_name,''),
      'position', coalesce(e.position_name,''),
      'department', coalesce(e.department_name,''),
      'empType', coalesce(e.emp_type,''),
      'hireDate', e.start_date),
    -- ชื่อฟิลด์ตรงกับที่ epIncome()/epDeduct() ใช้อยู่แล้ว จึงไม่ต้องแก้ตัวเรนเดอร์สลิป
    'entry', jsonb_build_object(
      'empId', p.employee_id,
      'base', coalesce(p.base_salary,0),
      'positionPay', coalesce(p.position_allow,0),
      'fuel', coalesce(p.oil_allow,0),
      'phone', coalesce(p.phone_allow,0),
      'diligence', coalesce(p.diligence,0),
      'bonus', coalesce(p.bonus,0),
      'ot', coalesce(p.ot_amount,0),
      'shiftPay', coalesce(p.shift_allow,0),
      'deductLeave', coalesce(p.personal_leave_deduct,0),
      'deductAbsent', coalesce(p.absent_deduct,0),
      'deductLate', coalesce(p.late_deduct,0),
      'sso', coalesce(p.social_security,0),
      'loan', coalesce(p.student_loan,0),
      'tax', coalesce(p.tax,0),
      'otherDeduct', coalesce(p.other_deduct,0),
      'earnings', coalesce(p.total_income,0),
      'deductions', coalesce(p.total_deduct,0),
      'net', coalesce(p.net_pay,0),
      -- รายการที่ไม่มีช่องตายตัวในสลิป ส่งเป็นรายการเพิ่มเติม
      'incomes', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
          select jsonb_build_object('name','Commission','amount',p.commission) x
           where coalesce(p.commission,0) <> 0) s),
      'deducts', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
          select jsonb_build_object('name','เงินเบิกล่วงหน้า','amount',p.advance_deduct) x
           where coalesce(p.advance_deduct,0) <> 0
          union all
          select jsonb_build_object('name','หักลาอื่น','amount',p.other_leave_deduct)
           where coalesce(p.other_leave_deduct,0) <> 0
          union all
          select jsonb_build_object('name','หักพักงาน','amount',p.suspend_deduct)
           where coalesce(p.suspend_deduct,0) <> 0) s)
    ));
end $$;


-- ─── 5) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_slip_guard(text) from public, anon, authenticated;

grant execute on function public.njhr_slip_periods(text)                to anon, authenticated;
grant execute on function public.njhr_slip_list(text,int,int,text,int,int) to anon, authenticated;
grant execute on function public.njhr_slip_get(text,uuid)               to anon, authenticated;


-- ─── 6) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_slip\_%'),
  'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
               where schemaname='public' and indexname like 'njhr\_payroll\_%'),
  'payroll_rows', (select count(*) from public.payroll),
  'payroll_periods', (select count(*) from (select distinct period_year, period_month from public.payroll) x),
  'payroll_paid', (select count(*) from public.payroll where status='PAID'),
  'tax_column', exists(select 1 from information_schema.columns
                        where table_schema='public' and table_name='payroll' and column_name='tax')
)) as install_report;


-- ─── 7) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_slip_get(text,uuid);
-- drop function if exists public.njhr_slip_list(text,int,int,text,int,int);
-- drop function if exists public.njhr_slip_periods(text);
-- drop function if exists public.njhr_slip_guard(text);
-- drop index if exists public.njhr_payroll_period_idx;
-- drop index if exists public.njhr_payroll_emp_idx;
-- delete from public.njhr_schema_version where version='v11.2-payslip';
