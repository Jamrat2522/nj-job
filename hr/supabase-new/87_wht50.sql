-- ============================================================
-- NJ HR V.10 — 87_wht50.sql
-- หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) — ชั้นฐานข้อมูล
--
-- ตรวจแล้ว: ระบบเดิม "ไม่มี" ตาราง/RPC/Route 50 ทวิ เลย (ค้น 50ทวิ · tawi · wht · withhold = 0)
--            จึงสร้างใหม่ ไม่ทับของเดิม
--
-- แหล่งข้อมูลจริงที่ยืนยันแล้ว (ไม่มีการเดาคอลัมน์)
--   employees  : id · emp_code · prefix · first_name · last_name · national_id · address
--                department_name · position_name · start_date · resign_date · status
--                (48_employees.sql บรรทัด 18–27 — ตรวจครบ 43 คอลัมน์)
--   payroll    : employee_id · period_year · period_month · pay_date · status
--                base_salary · position_allow · oil_allow · phone_allow · diligence
--                ot_amount · shift_allow · bonus · commission
--                social_security · tax · total_income · total_deduct · net_pay
--                (53_payslip.sql บรรทัด 15–22 — ตรวจครบ 27 คอลัมน์)
--                status = DRAFT · CALCULATED · PAID
--   njhr_pay_entries + njhr_pay_items : เงินเพิ่ม/เงินหักรายบุคคล (84/85)
--   system_settings : ข้อมูลบริษัท (key/value — 78)
--
-- กติกาการรวมรายได้ (ข้อ 6 ของโจทย์)
--   นับเฉพาะ payroll ที่ period_year = ปีภาษีที่เลือก
--   และ status ∈ (CALCULATED, PAID) เท่านั้น → งวด DRAFT/ยกเลิก ไม่ถูกนับ
--   1 พนักงาน × 1 งวด มีได้แถวเดียว จึงไม่มีทางนับซ้ำ
--
-- หมายเหตุเรื่อง auth.uid()
--   โปรเจกต์นี้ใช้ Auth ของตัวเอง (app_users + njhr_sessions) auth.uid() เป็น null เสมอ
--   การพิสูจน์ตัวตนที่ถูกต้องคือ njhr_ctx(p_token) — Role อ่านจากฐานข้อมูล ไม่รับจาก Frontend
--
-- ต้องรัน 41 · 42 · 48 · 51 · 53 · 78 · 84 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare miss text; act text;
begin
  if to_regclass('public.payroll') is null then raise exception 'PREFLIGHT: ไม่พบตาราง payroll'; end if;
  select string_agg(c, ', ') into miss from unnest(array[
    'employee_id','period_year','period_month','status','base_salary','position_allow',
    'oil_allow','phone_allow','diligence','ot_amount','shift_allow','bonus','commission',
    'social_security','tax','total_income']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='payroll' and column_name=c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns where table_schema='public' and table_name='payroll';
    raise exception 'PREFLIGHT: payroll ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  select string_agg(c, ', ') into miss from unnest(array[
    'national_id','prefix','first_name','last_name','address','start_date','resign_date']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employees' and column_name=c);
  if miss is not null then
    raise exception 'PREFLIGHT: employees ขาดคอลัมน์ [%]', miss;
  end if;

  -- กันสร้างซ้ำกับระบบ 50 ทวิ ที่อาจมีอยู่ภายใต้ชื่ออื่น
  -- ต้องยกเว้น "ทุกตารางที่ไฟล์นี้สร้างเอง" ไม่งั้นจะบล็อกตัวเองตอนรันซ้ำ
  select string_agg(table_name, ', ') into act from information_schema.tables
   where table_schema='public'
     and table_name not in ('njhr_wht50','njhr_wht50_seq')
     and (table_name ilike '%wht%' or table_name ilike '%tawi%' or table_name ilike '%withhold%');
  if act is not null then
    raise exception 'PREFLIGHT: พบตารางที่อาจเป็นระบบ 50 ทวิ อยู่แล้ว [%] — หยุดเพื่อไม่ให้สร้างซ้ำ', act;
  end if;

  raise notice 'PREFLIGHT ผ่าน · payroll % แถว · งวดที่คำนวณ/จ่ายแล้ว % แถว',
    (select count(*) from public.payroll),
    (select count(*) from public.payroll where upper(coalesce(status::text,'')) in ('CALCULATED','PAID'));
end $$;


-- ─── 1) ตารางเอกสาร 50 ทวิ ──────────────────────────────────
create table if not exists public.njhr_wht50 (
  id                uuid primary key default gen_random_uuid(),
  tax_year          int  not null check (tax_year between 2000 and 2100),   -- ปี ค.ศ.
  employee_id       uuid not null references public.employees(id) on delete restrict,
  doc_no            text,                       -- เลขที่เอกสาร (ออกตอนยืนยัน)
  book_no           text,                       -- เล่มที่ (ถ้ามี)
  seq_no            int,                        -- ลำดับที่ในแบบ
  form_type         text not null default 'PND1A',   -- ภ.ง.ด.1ก / 1ก พิเศษ / 2 / 3 / 2ก / 3ก / 53
  income_section    text not null default '40(1)',   -- ประเภทเงินได้ตามมาตรา
  issue_date        date,

  -- Snapshot ณ วันที่ออกเอกสาร (ล็อกแล้วห้ามเปลี่ยน)
  payer_snapshot    jsonb not null default '{}'::jsonb,   -- ข้อมูลบริษัทผู้หักภาษี
  payee_snapshot    jsonb not null default '{}'::jsonb,   -- ข้อมูลพนักงานผู้ถูกหัก
  income_source     jsonb not null default '{}'::jsonb,   -- ยอดต้นทางจาก payroll (ห้ามแก้)
  income_final      jsonb not null default '{}'::jsonb,   -- ยอดที่ใช้ออกเอกสารจริง (แก้ได้ก่อนยืนยัน)
  adjust_reason     text,                                  -- เหตุผลที่แก้ยอด (บังคับเมื่อยอดต่างจากต้นทาง)

  total_income      numeric(14,2) not null default 0,
  total_tax         numeric(14,2) not null default 0,
  total_sso         numeric(14,2) not null default 0,
  total_pvd         numeric(14,2) not null default 0,      -- กองทุนสำรองเลี้ยงชีพ
  note              text,
  signer_name       text,
  signer_position   text,

  status            text not null default 'DRAFT',
                    -- DRAFT · CONFIRMED · CANCELLED · AMENDED (ถูกแทนที่ด้วยฉบับแก้ไข)
  amend_of          uuid references public.njhr_wht50(id),  -- ฉบับแก้ไขของเอกสารใด
  amend_seq         int  not null default 0,                -- 0 = ฉบับแรก · 1,2,… = ฉบับแก้ไขที่
  cancel_reason     text,
  cancelled_at      timestamptz,
  cancelled_by      text,
  confirmed_at      timestamptz,
  confirmed_by      text,
  created_at        timestamptz not null default now(),
  created_by        text,
  updated_at        timestamptz not null default now(),
  updated_by        text
);
alter table public.njhr_wht50 enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_wht50_status_chk') then
    alter table public.njhr_wht50 add constraint njhr_wht50_status_chk
      check (status in ('DRAFT','CONFIRMED','CANCELLED','AMENDED'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_wht50_form_chk') then
    alter table public.njhr_wht50 add constraint njhr_wht50_form_chk
      check (form_type in ('PND1A','PND1A_SPECIAL','PND2','PND3','PND2A','PND3A','PND53'));
  end if;
end $$;

-- 1 พนักงาน + 1 ปีภาษี มี "เอกสารที่ยังใช้งานอยู่" ได้ชุดเดียว (ร่างหรือยืนยันแล้ว)
create unique index if not exists njhr_wht50_active_uidx
  on public.njhr_wht50 (tax_year, employee_id)
  where status in ('DRAFT','CONFIRMED');
create unique index if not exists njhr_wht50_docno_uidx
  on public.njhr_wht50 (doc_no) where doc_no is not null;
create index if not exists njhr_wht50_year_idx on public.njhr_wht50 (tax_year, status);
create index if not exists njhr_wht50_emp_idx  on public.njhr_wht50 (employee_id, tax_year desc);

comment on table public.njhr_wht50 is
  'หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) — เข้าถึงผ่าน njhr_wht50_* เท่านั้น';

-- ตัวนับเลขที่เอกสารต่อปีภาษี (กันเลขซ้ำแม้ออกพร้อมกันหลายเครื่อง)
create table if not exists public.njhr_wht50_seq (
  tax_year int primary key,
  last_no  int not null default 0
);
alter table public.njhr_wht50_seq enable row level security;

-- ปิด policy ที่เปิดให้ anon ทั้งตาราง (ถ้ามี) — เข้าถึงผ่าน RPC security definer เท่านั้น
do $$
declare pn text; tb text;
begin
  foreach tb in array array['njhr_wht50','njhr_wht50_seq'] loop
    for pn in select policyname from pg_policies
               where schemaname='public' and tablename=tb
                 and 'anon' = any(roles) and (qual='true' or qual is null)
    loop execute format('drop policy %I on public.%I', pn, tb); end loop;
  end loop;
end $$;


-- ─── 2) สิทธิ์ ──────────────────────────────────────────────
create or replace function public.njhr_wht50_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์เข้าถึงหนังสือรับรองการหักภาษี ณ ที่จ่าย' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id, true;
end $$;

-- ปกปิดเลขประจำตัวประชาชน (แสดงในหน้ารายการ)
create or replace function public.njhr_wht50_mask_id(p_id text)
returns text language sql immutable as $$
  select case when coalesce(btrim(p_id),'') = '' then ''
              when length(btrim(p_id)) < 6 then repeat('x', length(btrim(p_id)))
              else left(btrim(p_id),1) || '-xxxx-xxx' || substr(btrim(p_id), length(btrim(p_id))-3, 2)
                   || '-' || right(btrim(p_id),2) end;
$$;


-- ─── 3) ยอดรายปีจาก payroll จริง ────────────────────────────
--  งวด CALCULATED / PAID ของปีภาษีที่เลือกเท่านั้น · ไม่ข้ามปี · ไม่นับซ้ำ
create or replace function public.njhr_wht50_income(p_employee uuid, p_year int)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'periods',        coalesce(count(*), 0),
    'base_salary',    round(coalesce(sum(p.base_salary),0), 2),
    'position_allow', round(coalesce(sum(p.position_allow),0), 2),
    'oil_allow',      round(coalesce(sum(p.oil_allow),0), 2),
    'phone_allow',    round(coalesce(sum(p.phone_allow),0), 2),
    'diligence',      round(coalesce(sum(p.diligence),0), 2),
    'ot_amount',      round(coalesce(sum(p.ot_amount),0), 2),
    'shift_allow',    round(coalesce(sum(p.shift_allow),0), 2),
    'bonus',          round(coalesce(sum(p.bonus),0), 2),
    'commission',     round(coalesce(sum(p.commission),0), 2),
    'total_income',   round(coalesce(sum(p.total_income),0), 2),
    'tax',            round(coalesce(sum(p.tax),0), 2),
    'social_security',round(coalesce(sum(p.social_security),0), 2),
    'months',         coalesce(jsonb_agg(jsonb_build_object(
                        'month', p.period_month, 'status', p.status::text,
                        'income', p.total_income, 'tax', p.tax,
                        'sso', p.social_security) order by p.period_month), '[]'::jsonb))
    from public.payroll p
   where p.employee_id = p_employee
     and p.period_year = p_year
     and upper(coalesce(p.status::text,'')) in ('CALCULATED','PAID');
$$;


-- ─── 4) รายชื่อพนักงาน + ยอดรายปี + สถานะเอกสาร ─────────────
create or replace function public.njhr_wht50_employees(
  p_token text, p_year int, p_q text default null,
  p_dept text default null, p_status text default null)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  national_id_masked text, has_national_id boolean,
  department_name text, position_name text, emp_status text,
  periods int, total_income numeric, total_tax numeric, total_sso numeric,
  doc_id uuid, doc_no text, doc_status text, issue_date date, amend_seq int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        st text := nullif(upper(btrim(coalesce(p_status,''))),'');
begin
  select * into c from public.njhr_wht50_guard(p_token, false);
  if p_year is null then raise exception 'กรุณาเลือกปีภาษี' using errcode='22023'; end if;

  return query
  with inc as (
    select p.employee_id eid, count(*)::int n,
           round(coalesce(sum(p.total_income),0),2) ti,
           round(coalesce(sum(p.tax),0),2) tx,
           round(coalesce(sum(p.social_security),0),2) so
      from public.payroll p
     where p.period_year = p_year
       and upper(coalesce(p.status::text,'')) in ('CALCULATED','PAID')
     group by p.employee_id
  ), doc as (
    select d.employee_id eid, d.id did, d.doc_no dno, d.status dst,
           d.issue_date idt, d.amend_seq aseq
      from public.njhr_wht50 d
     where d.tax_year = p_year and d.status in ('DRAFT','CONFIRMED')
  )
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.nickname,''),
         public.njhr_wht50_mask_id(e.national_id),
         coalesce(btrim(e.national_id),'') <> '',
         coalesce(e.department_name,''), coalesce(e.position_name,''), e.status::text,
         coalesce(inc.n, 0), coalesce(inc.ti, 0), coalesce(inc.tx, 0), coalesce(inc.so, 0),
         doc.did, coalesce(doc.dno,''), coalesce(doc.dst,'NONE'), doc.idt, coalesce(doc.aseq,0)
    from public.employees e
    left join inc on inc.eid = e.id
    left join doc on doc.eid = e.id
   where coalesce(inc.n,0) > 0                       -- มีงวดเงินเดือนในปีภาษีนั้นจริงเท่านั้น
     and (p_dept is null or p_dept = '' or e.department_name = p_dept)
     and (st is null or coalesce(doc.dst,'NONE') = st)
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code;
end $$;


-- ─── 5) สร้างเอกสารร่าง (หลายคนในครั้งเดียว) ─────────────────
create or replace function public.njhr_wht50_draft(
  p_token text, p_year int, p_employees uuid[],
  p_form_type text default 'PND1A', p_income_section text default '40(1)')
returns table (employee_id uuid, doc_id uuid, ok boolean, message text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_emp uuid; e record; v_id uuid; v_inc jsonb; v_payer jsonb;
        v_form text := upper(btrim(coalesce(p_form_type,'PND1A')));
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  if p_employees is null or array_length(p_employees,1) is null then
    raise exception 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' using errcode='22023';
  end if;

  -- ข้อมูลบริษัทจาก system_settings จริง (ไม่ Hardcode)
  select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb) into v_payer
    from public.system_settings s
   where s.key in ('company_name','company_name_en','company_address','company_tax_id',
                   'company_postcode','company_branch','company_phone',
                   'wht_signer_name','wht_signer_position');

  foreach v_emp in array p_employees loop
    begin
      select * into e from public.employees where id = v_emp;
      if not found then
        return query select v_emp, null::uuid, false, 'ไม่พบพนักงานรายนี้'::text; continue;
      end if;

      v_inc := public.njhr_wht50_income(v_emp, p_year);
      if coalesce((v_inc->>'periods')::int, 0) = 0 then
        return query select v_emp, null::uuid, false,
          ('ไม่มีงวดเงินเดือนที่คำนวณหรือจ่ายแล้วในปีภาษี ' || p_year)::text; continue;
      end if;

      insert into public.njhr_wht50(
        tax_year, employee_id, form_type, income_section,
        payer_snapshot, payee_snapshot, income_source, income_final,
        total_income, total_tax, total_sso,
        signer_name, signer_position, status, created_by, updated_by)
      values (
        p_year, v_emp, v_form, btrim(coalesce(p_income_section,'40(1)')),
        v_payer,
        jsonb_build_object(
          'employee_id', e.id, 'emp_code', e.emp_code, 'prefix', coalesce(e.prefix,''),
          'first_name', e.first_name, 'last_name', coalesce(e.last_name,''),
          'national_id', coalesce(e.national_id,''), 'address', coalesce(e.address,''),
          'department_name', coalesce(e.department_name,''),
          'position_name', coalesce(e.position_name,''),
          'start_date', e.start_date, 'resign_date', e.resign_date),
        v_inc, v_inc,
        (v_inc->>'total_income')::numeric, (v_inc->>'tax')::numeric,
        (v_inc->>'social_security')::numeric,
        nullif(v_payer->>'wht_signer_name',''), nullif(v_payer->>'wht_signer_position',''),
        'DRAFT', c.username, c.username)
      returning njhr_wht50.id into v_id;

      perform public.njhr_audit_write(p_token, 'WHT50_DRAFT', 'payroll', 'njhr_wht50',
        v_id::text, 'สร้างร่าง 50 ทวิ ปีภาษี ' || p_year || ' · ' || e.emp_code, null,
        (select to_jsonb(x) from public.njhr_wht50 x where x.id = v_id), null);

      return query select v_emp, v_id, true, 'สร้างร่างแล้ว'::text;
    exception when unique_violation then
      return query select v_emp, null::uuid, false,
        'มีเอกสารของปีภาษีนี้อยู่แล้ว (ร่างหรือยืนยันแล้ว)'::text;
    when others then
      return query select v_emp, null::uuid, false, SQLERRM::text;
    end;
  end loop;
end $$;


-- ─── 6) อ่านเอกสารเต็ม (ใช้สร้าง PDF) ───────────────────────
create or replace function public.njhr_wht50_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record;
begin
  select * into c from public.njhr_wht50_guard(p_token, false);
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;

  perform public.njhr_audit_write(p_token, 'WHT50_VIEW', 'payroll', 'njhr_wht50',
    p_id::text, 'เปิดดูเอกสาร 50 ทวิ ' || coalesce(d.doc_no, '(ร่าง)'), null, null, null);

  return query select to_jsonb(d) || jsonb_build_object(
    'amend_of_doc_no', (select x.doc_no from public.njhr_wht50 x where x.id = d.amend_of),
    'locked', (d.status <> 'DRAFT'));
end $$;


-- ─── 7) แก้ไขก่อนยืนยัน (เก็บค่าต้นทาง + เหตุผล) ─────────────
create or replace function public.njhr_wht50_update(
  p_token text, p_id uuid, p_patch jsonb, p_reason text default null)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; oldrow jsonb; v_final jsonb;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status <> 'DRAFT' then
    raise exception 'เอกสารสถานะ "%" แก้ไขโดยตรงไม่ได้ — ให้ยกเลิกแล้วออกฉบับแก้ไข', d.status
      using errcode='42501';
  end if;
  oldrow := to_jsonb(d);

  v_final := d.income_final || coalesce(p_patch->'income_final', '{}'::jsonb);
  -- ยอดต่างจากต้นทาง = ต้องมีเหตุผลเสมอ
  if v_final is distinct from d.income_source and v_reason is null and d.adjust_reason is null then
    raise exception 'การแก้ยอดเงินต้องระบุเหตุผล' using errcode='22023';
  end if;

  update public.njhr_wht50 set
    form_type       = coalesce(nullif(btrim(p_patch->>'form_type'),''), form_type),
    income_section  = coalesce(nullif(btrim(p_patch->>'income_section'),''), income_section),
    seq_no          = coalesce(nullif(p_patch->>'seq_no','')::int, seq_no),
    book_no         = coalesce(nullif(btrim(p_patch->>'book_no'),''), book_no),
    issue_date      = coalesce(nullif(p_patch->>'issue_date','')::date, issue_date),
    payee_snapshot  = payee_snapshot || coalesce(p_patch->'payee_snapshot', '{}'::jsonb),
    income_final    = v_final,
    total_income    = coalesce(nullif(v_final->>'total_income','')::numeric, total_income),
    total_tax       = coalesce(nullif(v_final->>'tax','')::numeric, total_tax),
    total_sso       = coalesce(nullif(v_final->>'social_security','')::numeric, total_sso),
    total_pvd       = coalesce(nullif(v_final->>'pvd','')::numeric, total_pvd),
    note            = coalesce(p_patch->>'note', note),
    signer_name     = coalesce(nullif(btrim(p_patch->>'signer_name'),''), signer_name),
    signer_position = coalesce(nullif(btrim(p_patch->>'signer_position'),''), signer_position),
    adjust_reason   = coalesce(v_reason, adjust_reason),
    updated_at = now(), updated_by = c.username
   where njhr_wht50.id = p_id;

  perform public.njhr_audit_write(p_token, 'WHT50_EDIT', 'payroll', 'njhr_wht50', p_id::text,
    'แก้ไขร่าง 50 ทวิ' || coalesce(' · เหตุผล: ' || v_reason, ''), oldrow,
    (select to_jsonb(x) from public.njhr_wht50 x where x.id = p_id), null);

  return query select x.id, x.status from public.njhr_wht50 x where x.id = p_id;
end $$;


-- ─── 8) ยืนยันออกเอกสาร (ออกเลขที่ + ล็อก) ───────────────────
create or replace function public.njhr_wht50_confirm(p_token text, p_id uuid)
returns table (id uuid, doc_no text, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; oldrow jsonb; v_no int; v_doc text; v_be int;
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status <> 'DRAFT' then
    raise exception 'เอกสารนี้ถูกยืนยันหรือยกเลิกไปแล้ว (สถานะ %)', d.status using errcode='22023';
  end if;
  if coalesce(btrim(d.payee_snapshot->>'national_id'),'') = '' then
    raise exception 'พนักงานรายนี้ยังไม่มีเลขประจำตัวประชาชน — แก้ไขทะเบียนพนักงานก่อนยืนยัน'
      using errcode='22023';
  end if;
  if coalesce(d.total_income, 0) <= 0 then
    raise exception 'ยอดรายได้รวมทั้งปีเป็น 0 ยืนยันเอกสารไม่ได้' using errcode='22023';
  end if;
  oldrow := to_jsonb(d);

  -- เลขที่เอกสารไม่ซ้ำ: ล็อกแถวตัวนับของปีภาษีนั้น
  insert into public.njhr_wht50_seq(tax_year, last_no) values (d.tax_year, 0)
  on conflict (tax_year) do nothing;
  update public.njhr_wht50_seq set last_no = last_no + 1
   where tax_year = d.tax_year returning last_no into v_no;

  v_be := d.tax_year + 543;
  v_doc := 'WHT' || v_be || '-' || lpad(v_no::text, 5, '0') ||
           case when d.amend_seq > 0 then '-R' || d.amend_seq else '' end;

  update public.njhr_wht50
     set doc_no = v_doc, seq_no = coalesce(seq_no, v_no), status = 'CONFIRMED',
         issue_date = coalesce(issue_date, (now() at time zone 'Asia/Bangkok')::date),
         confirmed_at = now(), confirmed_by = c.username,
         updated_at = now(), updated_by = c.username
   where njhr_wht50.id = p_id;

  perform public.njhr_audit_write(p_token, 'WHT50_CONFIRM', 'payroll', 'njhr_wht50', p_id::text,
    'ยืนยันเอกสาร 50 ทวิ เลขที่ ' || v_doc || ' · ปีภาษี ' || v_be ||
    ' · รายได้ ' || d.total_income::text || ' · ภาษี ' || d.total_tax::text,
    oldrow, (select to_jsonb(x) from public.njhr_wht50 x where x.id = p_id), null);

  return query select x.id, x.doc_no, x.status from public.njhr_wht50 x where x.id = p_id;
end $$;


-- ─── 9) ยกเลิกเอกสาร ────────────────────────────────────────
create or replace function public.njhr_wht50_cancel(
  p_token text, p_id uuid, p_reason text)
returns table (id uuid, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; oldrow jsonb;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลการยกเลิก' using errcode='22023';
  end if;
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status = 'CANCELLED' then
    raise exception 'เอกสารนี้ถูกยกเลิกไปแล้ว' using errcode='22023';
  end if;
  oldrow := to_jsonb(d);

  update public.njhr_wht50
     set status = 'CANCELLED', cancel_reason = v_reason,
         cancelled_at = now(), cancelled_by = c.username,
         updated_at = now(), updated_by = c.username
   where njhr_wht50.id = p_id;

  perform public.njhr_audit_write(p_token, 'WHT50_CANCEL', 'payroll', 'njhr_wht50', p_id::text,
    'ยกเลิกเอกสาร ' || coalesce(d.doc_no,'(ร่าง)') || ' · เหตุผล: ' || v_reason,
    oldrow, (select to_jsonb(x) from public.njhr_wht50 x where x.id = p_id), null);

  return query select x.id, x.status from public.njhr_wht50 x where x.id = p_id;
end $$;


-- ─── 10) ออกฉบับแก้ไข (ยกเลิกเดิม + สร้างร่างใหม่ผูกกัน) ─────
create or replace function public.njhr_wht50_amend(
  p_token text, p_id uuid, p_reason text)
returns table (old_id uuid, new_id uuid, amend_seq int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; d record; v_new uuid; v_seq int;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_wht50_guard(p_token, true);
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลการออกฉบับแก้ไข' using errcode='22023';
  end if;
  select * into d from public.njhr_wht50 where njhr_wht50.id = p_id for update;
  if not found then raise exception 'ไม่พบเอกสารนี้' using errcode='P0002'; end if;
  if d.status <> 'CONFIRMED' then
    raise exception 'ออกฉบับแก้ไขได้เฉพาะเอกสารที่ยืนยันแล้ว (สถานะปัจจุบัน %)', d.status
      using errcode='22023';
  end if;
  v_seq := d.amend_seq + 1;

  -- ปิดฉบับเดิมก่อน เพื่อไม่ให้ชนกับ unique index (tax_year, employee_id)
  update public.njhr_wht50
     set status = 'AMENDED', cancel_reason = v_reason,
         cancelled_at = now(), cancelled_by = c.username,
         updated_at = now(), updated_by = c.username
   where njhr_wht50.id = p_id;

  insert into public.njhr_wht50(
    tax_year, employee_id, form_type, income_section, book_no,
    payer_snapshot, payee_snapshot, income_source, income_final,
    total_income, total_tax, total_sso, total_pvd, note,
    signer_name, signer_position, status, amend_of, amend_seq, created_by, updated_by)
  select d.tax_year, d.employee_id, d.form_type, d.income_section, d.book_no,
         d.payer_snapshot, d.payee_snapshot,
         public.njhr_wht50_income(d.employee_id, d.tax_year),   -- ดึงยอดต้นทางใหม่ล่าสุด
         d.income_final,
         d.total_income, d.total_tax, d.total_sso, d.total_pvd, d.note,
         d.signer_name, d.signer_position, 'DRAFT', d.id, v_seq, c.username, c.username
  returning njhr_wht50.id into v_new;

  perform public.njhr_audit_write(p_token, 'WHT50_AMEND', 'payroll', 'njhr_wht50', v_new::text,
    'ออกฉบับแก้ไขที่ ' || v_seq || ' แทนเลขที่ ' || coalesce(d.doc_no,'-') ||
    ' · เหตุผล: ' || v_reason, to_jsonb(d),
    (select to_jsonb(x) from public.njhr_wht50 x where x.id = v_new), null);

  return query select p_id, v_new, v_seq;
end $$;


-- ─── 11) ประวัติเอกสาร (ทั้งสายฉบับแก้ไข) ────────────────────
create or replace function public.njhr_wht50_history(p_token text, p_id uuid)
returns table (at timestamptz, actor text, action text, detail text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_wht50_guard(p_token, false);
  return query
  with chain as (
    select d.id from public.njhr_wht50 d where d.id = p_id
    union
    select d2.id from public.njhr_wht50 d2 where d2.amend_of = p_id
    union
    select d3.amend_of from public.njhr_wht50 d3 where d3.id = p_id and d3.amend_of is not null
  )
  select a.created_at, coalesce(a.actor,''), a.action, coalesce(a.detail,'')
    from public.audit_log a
   where a.app_code = 'salary' and a.entity = 'njhr_wht50'
     and a.entity_id in (select ch.id::text from chain ch where ch.id is not null)
   order by a.created_at desc
   limit 200;
end $$;


-- ─── 12) บันทึกการดาวน์โหลด (ข้อ 15: ต้อง audit ทุกครั้ง) ────
create or replace function public.njhr_wht50_log_download(
  p_token text, p_ids uuid[], p_kind text default 'PDF')
returns boolean
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid;
begin
  select * into c from public.njhr_wht50_guard(p_token, false);
  if p_ids is null then return false; end if;
  foreach v_id in array p_ids loop
    perform public.njhr_audit_write(p_token, 'WHT50_DOWNLOAD', 'payroll', 'njhr_wht50',
      v_id::text, 'ดาวน์โหลดเอกสาร 50 ทวิ (' || upper(coalesce(p_kind,'PDF')) || ')',
      null, null, null);
  end loop;
  return true;
end $$;


-- ─── 13) GRANT ──────────────────────────────────────────────
revoke execute on function public.njhr_wht50_guard(text, boolean)   from public, anon, authenticated;
revoke execute on function public.njhr_wht50_income(uuid, int)      from public, anon, authenticated;
grant execute on function public.njhr_wht50_employees(text,int,text,text,text)      to anon, authenticated;
grant execute on function public.njhr_wht50_draft(text,int,uuid[],text,text)        to anon, authenticated;
grant execute on function public.njhr_wht50_get(text,uuid)                          to anon, authenticated;
grant execute on function public.njhr_wht50_update(text,uuid,jsonb,text)            to anon, authenticated;
grant execute on function public.njhr_wht50_confirm(text,uuid)                      to anon, authenticated;
grant execute on function public.njhr_wht50_cancel(text,uuid,text)                  to anon, authenticated;
grant execute on function public.njhr_wht50_amend(text,uuid,text)                   to anon, authenticated;
grant execute on function public.njhr_wht50_history(text,uuid)                      to anon, authenticated;
grant execute on function public.njhr_wht50_log_download(text,uuid[],text)          to anon, authenticated;
grant execute on function public.njhr_wht50_mask_id(text)                           to anon, authenticated;

-- ค่าตั้งต้นของบริษัทสำหรับแบบ 50 ทวิ (ใส่เฉพาะ key ที่ยังไม่มี ไม่ทับค่าเดิม)
insert into public.system_settings(key, value, category, is_public, updated_at)
select v.k, v.val::jsonb, 'company', false, now()
  from (values
    ('company_name_en',      '""'),
    ('company_postcode',     '""'),
    ('company_branch',       '"สำนักงานใหญ่"'),
    ('wht_signer_name',      '""'),
    ('wht_signer_position',  '""')
  ) as v(k, val)
 where not exists (select 1 from public.system_settings s where s.key = v.k);

insert into public.njhr_schema_version(version, note)
values ('v13.8-wht50', '50 ทวิ: ตาราง njhr_wht50 + ตัวนับเลขที่ + 10 RPC (ร่าง/ยืนยัน/ยกเลิก/ฉบับแก้ไข)')
on conflict (version) do nothing;


-- ─── 14) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', jsonb_build_object(
     'njhr_wht50', to_regclass('public.njhr_wht50') is not null,
     'njhr_wht50_seq', to_regclass('public.njhr_wht50_seq') is not null),
  'columns', (select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='njhr_wht50'),
  'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
                where schemaname='public' and tablename='njhr_wht50'),
  'rls', (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and c.relname='njhr_wht50'),
  'anon_policies', coalesce((select count(*) from pg_policies
                              where schemaname='public' and tablename like 'njhr\_wht50%'
                                and 'anon' = any(roles)), 0),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_wht50%'),
  'payroll_years', coalesce((select jsonb_object_agg(y, n) from
     (select period_year y, count(*) n from public.payroll
       where upper(coalesce(status::text,'')) in ('CALCULATED','PAID')
       group by period_year) x), '{}'::jsonb),
  'employees_without_national_id', (select count(*) from public.employees
                                     where coalesce(btrim(national_id),'') = ''
                                       and status::text in ('ACTIVE','PROBATION'))
)) as install_report;
