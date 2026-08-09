-- ============================================================
-- NJ HR V.10 — 54_payslip_list.sql
-- E-PAYSLIP: รายชื่อพนักงานในหน้าหลัก + ตัวกรองแผนก/ตำแหน่ง/สถานะการจ่าย + บันทึกการส่งสลิป
--
-- เปลี่ยนแนวคิดของ njhr_slip_list:
--   เดิม  = ไล่จากตาราง payroll  → พนักงานที่ยังไม่มีข้อมูลเงินเดือนจะไม่ปรากฏเลย
--   ใหม่  = ไล่จาก employees LEFT JOIN payroll → เห็นครบทุกคน พร้อมสถานะ
--           จ่ายแล้ว (PAID) · ยังไม่จ่าย (DRAFT/CALCULATED) · ไม่มีข้อมูลเงินเดือน (ไม่มีแถวใน payroll)
--
-- ใช้ตาราง employees / payroll / payslips เดิม · ไม่สร้างตารางใหม่ · ไม่แตะข้อมูล
-- ต้องรัน 53_payslip.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_slip_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_slip_guard — รัน 53_payslip.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='payslips'
     and column_name in ('id','payroll_id','employee_id','pdf_url','sent_email','created_at');
  if n <> 6 then raise exception 'PREFLIGHT: payslips คอลัมน์ไม่ครบ 6 (พบ %)', n; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create index if not exists njhr_payslips_payroll_idx on public.payslips (payroll_id);
create index if not exists njhr_payslips_emp_idx     on public.payslips (employee_id);
-- กันบันทึกการส่งซ้ำสำหรับงวดเดียวกัน
do $$
declare dup int;
begin
  select count(*) into dup from (
    select payroll_id from public.payslips where payroll_id is not null
     group by payroll_id having count(*) > 1) x;
  if dup > 0 then
    raise notice 'ข้ามการสร้าง unique index: payslips มี payroll_id ซ้ำ % ชุด', dup;
  else
    create unique index if not exists njhr_payslips_uidx
      on public.payslips (payroll_id) where payroll_id is not null;
  end if;
end $$;

insert into public.njhr_schema_version(version, note)
values ('v11.3-payslip-list', 'E-PAYSLIP: รายชื่อพนักงาน + ตัวกรอง + บันทึกการส่ง')
on conflict (version) do nothing;


-- ─── 1) ตัวเลือกของตัวกรอง (แผนก / ตำแหน่ง) จากข้อมูลจริง ────
create or replace function public.njhr_slip_filters(p_token text, p_year int, p_month int)
returns table (kind text, value text, cnt int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_slip_guard(p_token);
  return query
  select 'DEPARTMENT'::text, coalesce(e.department_name,''), count(*)::int
    from public.employees e
   where e.status::text = 'ACTIVE' and coalesce(e.department_name,'') <> ''
     and (c.is_admin or e.id = c.employee_id)
   group by 1, 2
  union all
  select 'POSITION'::text, coalesce(e.position_name,''), count(*)::int
    from public.employees e
   where e.status::text = 'ACTIVE' and coalesce(e.position_name,'') <> ''
     and (c.is_admin or e.id = c.employee_id)
   group by 1, 2
   order by 1, 2;
end $$;


-- ─── 2) รายชื่อพนักงานพร้อมสถานะสลิปของงวดที่เลือก ───────────
-- p_status: '' = ทุกสถานะ · PAID = จ่ายแล้ว · UNPAID = ยังไม่จ่าย · NONE = ไม่มีข้อมูลเงินเดือน
drop function if exists public.njhr_slip_list(text, int, int, text, int, int);

create or replace function public.njhr_slip_list(
  p_token text, p_year int, p_month int, p_q text default null,
  p_dept text default null, p_position text default null, p_status text default null,
  p_limit int default 100, p_offset int default 0)
returns table (
  payroll_id uuid, employee_id uuid, emp_code text, emp_name text, nickname text,
  department text, position_name text, emp_status text,
  period_year int, period_month int, pay_date date, slip_status text,
  total_income numeric, total_deduct numeric, net_pay numeric,
  has_payroll boolean, sent_email boolean, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,''))); st text := upper(btrim(coalesce(p_status,'')));
begin
  select * into c from public.njhr_slip_guard(p_token);
  if p_year is null or p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'กรุณาเลือกเดือนและปีให้ถูกต้อง' using errcode='22023';
  end if;
  if not c.is_admin and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงยังไม่มีสลิปเงินเดือน' using errcode='28000';
  end if;
  if st <> '' and st not in ('PAID','UNPAID','NONE') then
    raise exception 'สถานะการจ่ายไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;

  return query
  with base as (
    select p.id pid, e.id eid, e.emp_code ec,
           btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           coalesce(e.nickname,'') enk, coalesce(e.department_name,'') edept,
           coalesce(e.position_name,'') epos, e.status::text estat,
           p_year py, p_month pm, p.pay_date pd,
           case when p.id is null then 'NONE'
                when p.status = 'PAID' then 'PAID' else 'UNPAID' end sst,
           coalesce(p.total_income,0) ti, coalesce(p.total_deduct,0) td, coalesce(p.net_pay,0) np,
           (p.id is not null) hp,
           coalesce((select s.sent_email from public.payslips s where s.payroll_id = p.id limit 1), false) se
      from public.employees e
      left join public.payroll p
        on p.employee_id = e.id and p.period_year = p_year and p.period_month = p_month
     where e.status::text = 'ACTIVE'
       -- พนักงานทั่วไปเห็นเฉพาะของตนเอง และเฉพาะงวดที่จ่ายแล้ว
       and (c.is_admin or (e.id = c.employee_id and p.status = 'PAID'))
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_position is null or p_position = '' or e.position_name = p_position)
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')) like '%'||q||'%'
            or lower(coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%')),
  filtered as (select * from base b where st = '' or b.sst = st)
  select f.pid, f.eid, f.ec, nullif(f.enm,''), f.enk, f.edept, f.epos, f.estat,
         f.py, f.pm, f.pd, f.sst, f.ti, f.td, f.np, f.hp, f.se,
         (select count(*) from filtered)
    from filtered f order by f.ec
   limit least(greatest(coalesce(p_limit,100),1),500) offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 3) บันทึกว่าส่งสลิปแล้ว (หลายคนในครั้งเดียว) ────────────
-- ⚠️ ฟังก์ชันนี้ "บันทึกสถานะการส่ง" เท่านั้น ไม่ได้ส่งอีเมลจริง
--    การส่งอีเมลต้องมี Edge Function / SMTP ซึ่งโปรเจกต์นี้ยังไม่มี
create or replace function public.njhr_slip_mark_sent(p_token text, p_payroll_ids uuid[])
returns table (payroll_id uuid, emp_code text, result text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; n_new int := 0; n_again int := 0; n_skip int := 0;
begin
  select * into c from public.njhr_slip_guard(p_token);
  if not c.is_admin then
    raise exception 'คุณไม่มีสิทธิ์ส่งสลิปเงินเดือน' using errcode='42501';
  end if;
  if p_payroll_ids is null or array_length(p_payroll_ids, 1) is null then
    raise exception 'ยังไม่ได้เลือกพนักงาน' using errcode='22023';
  end if;
  if array_length(p_payroll_ids, 1) > 500 then
    raise exception 'ส่งได้ครั้งละไม่เกิน 500 รายการ' using errcode='22023';
  end if;

  create temp table if not exists njhr_sent_tmp (payroll_id uuid, emp_code text, result text) on commit drop;
  -- Supabase เปิด pg_safeupdate ไว้ DELETE/UPDATE ที่ไม่มี WHERE จะถูกบล็อก
  delete from njhr_sent_tmp where true;

  for r in
    select p.id pid, coalesce(e.emp_code, p.employee_code, '') ec, p.status::text pst,
           exists(select 1 from public.payslips s where s.payroll_id = p.id and s.sent_email) already
      from public.payroll p
      left join public.employees e on e.id = p.employee_id
     where p.id = any(p_payroll_ids)
  loop
    if r.pst <> 'PAID' then
      insert into njhr_sent_tmp values (r.pid, r.ec, 'ข้าม: งวดนี้ยังไม่ได้จ่าย');
      n_skip := n_skip + 1;
    else
      insert into public.payslips (payroll_id, employee_id, sent_email)
      select r.pid, p.employee_id, true from public.payroll p where p.id = r.pid
      -- index เป็นแบบมีเงื่อนไข (partial) จึงต้องระบุ WHERE เดียวกันให้ Postgres จับคู่ index ได้
      on conflict (payroll_id) where payroll_id is not null do update set sent_email = true;
      insert into njhr_sent_tmp values (r.pid, r.ec,
        case when r.already then 'ส่งซ้ำ' else 'ส่งแล้ว' end);
      if r.already then n_again := n_again + 1; else n_new := n_new + 1; end if;
    end if;
  end loop;

  perform public.njhr_audit_write(p_token, 'PAYSLIP_SEND', 'payroll', 'payslips', null,
    'บันทึกการส่งสลิป: ใหม่ ' || n_new || ' · ส่งซ้ำ ' || n_again || ' · ข้าม ' || n_skip,
    null, null, null);

  return query select t.payroll_id, t.emp_code, t.result from njhr_sent_tmp t;
end $$;


-- ─── 4) สิทธิ์เรียกใช้ ───────────────────────────────────────
grant execute on function public.njhr_slip_filters(text,int,int)                          to anon, authenticated;
grant execute on function public.njhr_slip_list(text,int,int,text,text,text,text,int,int)  to anon, authenticated;
grant execute on function public.njhr_slip_mark_sent(text,uuid[])                          to anon, authenticated;


-- ─── 5) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname || '(' || pg_get_function_arguments(p.oid) || ')' order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_slip\_%'),
  'payslips_unique', exists(select 1 from pg_indexes
     where schemaname='public' and indexname='njhr_payslips_uidx'),
  'employees_active', (select count(*) from public.employees where status::text='ACTIVE'),
  'payroll_rows', (select count(*) from public.payroll),
  'payslips_rows', (select count(*) from public.payslips)
)) as install_report;


-- ─── 6) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_slip_mark_sent(text,uuid[]);
-- drop function if exists public.njhr_slip_list(text,int,int,text,text,text,text,int,int);
-- drop function if exists public.njhr_slip_filters(text,int,int);
-- drop index if exists public.njhr_payslips_uidx;
-- drop index if exists public.njhr_payslips_payroll_idx;
-- drop index if exists public.njhr_payslips_emp_idx;
-- แล้วรัน 53_payslip.sql ใหม่เพื่อคืน njhr_slip_list รุ่นเดิม
-- delete from public.njhr_schema_version where version='v11.3-payslip-list';
