-- ============================================================
-- NJ HR V.10 — 43_pay_items.sql  (รายการเงินเดือน: Master + รายเดือนต่อพนักงาน)
--
-- ตารางใหม่ล้วน ชื่อขึ้นต้น njhr_ กันชนกับอีก 6 แอปในโปรเจกต์เดียวกัน
-- ไม่แตะ / ไม่ลบ / ไม่เขียนทับตาราง payroll, payslips, employees เดิม
--
-- ⚠️ ขอบเขต: ไฟล์นี้ทำ Master + การกำหนดยอดรายเดือน + RPC รวมยอด (njhr_pay_entry_totals)
--    ซึ่งเป็น "จุดเชื่อม" ให้หน้าเงินเดือน/สลิป/REPORT เรียกใช้
--    การนำยอดไปบวก-หักในสูตรจริง ยังทำไม่ได้ เพราะตาราง payroll / payslips
--    ยังไม่เคยตรวจโครงสร้าง (ต้องรัน 42_inspect_remaining.sql ก่อน)
--
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้ (idempotent)
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name='id') then
    raise exception 'PREFLIGHT: ไม่พบ employees.id';
  end if;
  if exists (select 1 from information_schema.tables
              where table_schema='public' and table_name in ('pay_items','payroll_items','salary_items')) then
    raise notice 'พบตารางชื่อใกล้เคียงอยู่แล้ว — ตรวจสอบก่อนใช้งานจริง';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) MASTER: ทะเบียนรายการเงินเพิ่ม / เงินหัก ──────────────
create table if not exists public.njhr_pay_items (
  code            text primary key,
  name_th         text        not null,
  kind            text        not null check (kind in ('EARNING','DEDUCTION')),
  -- รูปแบบการคำนวณ: คงที่ / เปอร์เซ็นต์ / กรอกยอดต่อพนักงาน / คำนวณจากระบบเดิม
  calc_type       text        not null default 'PER_EMPLOYEE'
                  check (calc_type in ('FIXED','PERCENT','PER_EMPLOYEE','SYSTEM')),
  fixed_amount    numeric(12,2) not null default 0 check (fixed_amount >= 0),
  percent         numeric(7,4)  not null default 0 check (percent >= 0),
  default_value   numeric(12,2) not null default 0,
  unit            text        not null default 'THB',
  system_source   text,                              -- calc_type='SYSTEM' อ่านผลจากระบบไหน (กันคำนวณซ้ำ)
  sort_order      int         not null default 0,
  show_in_slip    boolean     not null default true,
  show_in_report  boolean     not null default true,
  active          boolean     not null default true,
  deleted_at      timestamptz,                       -- Soft Delete
  created_at      timestamptz not null default now(),
  created_by      text,
  updated_at      timestamptz not null default now(),
  updated_by      text
);
alter table public.njhr_pay_items enable row level security;   -- เข้าถึงผ่าน RPC เท่านั้น
create unique index if not exists njhr_pay_items_name_uidx
  on public.njhr_pay_items (lower(name_th)) where deleted_at is null;   -- กันชื่อซ้ำ
create index if not exists njhr_pay_items_kind_idx
  on public.njhr_pay_items (kind, active, sort_order, code) where deleted_at is null;


-- ─── 2) รายการเงินเดือนของพนักงาน รายเดือน ────────────────────
create table if not exists public.njhr_pay_entries (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees(id) on delete cascade,
  period_year   int  not null check (period_year between 2000 and 2100),
  period_month  int  not null check (period_month between 1 and 12),
  item_code     text not null references public.njhr_pay_items(code) on update cascade,
  amount        numeric(12,2) not null default 0,
  percent       numeric(7,4),
  note          text,
  recurring     boolean not null default false,      -- รายการประจำทุกเดือน
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  created_by    text,
  updated_at    timestamptz not null default now(),
  updated_by    text
);
alter table public.njhr_pay_entries enable row level security;
-- กันซ้ำ: พนักงาน + เดือน + ปี + รหัสรายการ ต้องมีได้แถวเดียว
create unique index if not exists njhr_pay_entries_uidx
  on public.njhr_pay_entries (employee_id, period_year, period_month, item_code)
  where deleted_at is null;
create index if not exists njhr_pay_entries_period_idx
  on public.njhr_pay_entries (period_year, period_month) where deleted_at is null;
create index if not exists njhr_pay_entries_emp_idx
  on public.njhr_pay_entries (employee_id, period_year, period_month) where deleted_at is null;
create index if not exists njhr_pay_entries_item_idx
  on public.njhr_pay_entries (item_code) where deleted_at is null;

insert into public.njhr_schema_version(version, note)
values ('v10.3-pay-items', 'Master รายการเงินเดือน + รายการรายเดือนต่อพนักงาน')
on conflict (version) do nothing;


-- ─── 3) ข้อมูลตั้งต้น (ไม่ทับของเดิม · ชื่อซ้ำถูก unique index กันไว้) ──
-- รายการที่ระบบเดิมคำนวณอยู่แล้ว = calc_type 'SYSTEM' → กรอกยอดซ้ำไม่ได้ (ห้ามคำนวณซ้ำ)
insert into public.njhr_pay_items (code, name_th, kind, calc_type, system_source, sort_order, created_by)
values
  ('BONUS',         'โบนัส',            'EARNING',  'PER_EMPLOYEE', null,             10, 'migration'),
  ('DILIGENCE',     'เบี้ยขยัน',         'EARNING',  'PER_EMPLOYEE', null,             20, 'migration'),
  ('SHIFT_ALLOW',   'ค่ากะ',            'EARNING',  'PER_EMPLOYEE', 'work_shifts',    30, 'migration'),
  ('FUEL_ALLOW',    'ค่าน้ำมัน',         'EARNING',  'PER_EMPLOYEE', null,             40, 'migration'),
  ('PHONE_ALLOW',   'ค่าโทรศัพท์',       'EARNING',  'PER_EMPLOYEE', null,             50, 'migration'),
  ('POSITION_ALLOW','ค่าตำแหน่ง',        'EARNING',  'PER_EMPLOYEE', null,             60, 'migration'),
  ('OT',            'ค่าล่วงเวลา (OT)',  'EARNING',  'SYSTEM',       'ot_requests',    70, 'migration'),
  ('COMMISSION',    'Commission',       'EARNING',  'PER_EMPLOYEE', null,             80, 'migration'),
  ('ALLOWANCE',     'Allowance',        'EARNING',  'PER_EMPLOYEE', null,             90, 'migration'),
  ('OTHER_EARN',    'รายได้อื่น',        'EARNING',  'PER_EMPLOYEE', null,            100, 'migration'),
  ('LEAVE_PERSONAL','หักลากิจ',          'DEDUCTION','SYSTEM',       'leave_requests',210, 'migration'),
  ('LEAVE_SICK',    'หักลาป่วย',         'DEDUCTION','SYSTEM',       'leave_requests',220, 'migration'),
  ('ABSENT',        'ขาดงาน',           'DEDUCTION','SYSTEM',       'attendance',    230, 'migration'),
  ('LATE',          'มาสาย',            'DEDUCTION','SYSTEM',       'attendance',    240, 'migration'),
  ('SSO',           'ประกันสังคม',       'DEDUCTION','SYSTEM',       'payroll',       250, 'migration'),
  ('STUDENT_LOAN',  'กยศ.',             'DEDUCTION','PER_EMPLOYEE', null,            260, 'migration'),
  ('TAX',           'ภาษี',             'DEDUCTION','SYSTEM',       'payroll',       270, 'migration'),
  ('LOAN',          'เงินกู้',           'DEDUCTION','PER_EMPLOYEE', null,            280, 'migration'),
  ('COOP',          'สหกรณ์',           'DEDUCTION','PER_EMPLOYEE', null,            290, 'migration'),
  ('OTHER_DEDUCT',  'รายการหักอื่น',      'DEDUCTION','PER_EMPLOYEE', null,            300, 'migration')
on conflict (code) do nothing;


-- ─── 4) RPC: Master ──────────────────────────────────────────
-- ลบ signature เก่าก่อน (ถ้าเคยติดตั้งรุ่นก่อนหน้า) มิฉะนั้นจะเกิด overload ซ้อนกัน
-- แล้วเรียกใช้ไม่ได้ด้วย error "function is not unique"
drop function if exists public.njhr_pay_items(text, text);
drop function if exists public.njhr_pay_item_save(text, text, text, text, text, boolean);

create or replace function public.njhr_pay_items(
  p_token text, p_q text default null, p_kind text default null, p_active boolean default null)
returns table (code text, name_th text, kind text, calc_type text, fixed_amount numeric,
               percent numeric, default_value numeric, unit text, system_source text,
               sort_order int, show_in_slip boolean, show_in_report boolean,
               active boolean, in_use boolean, updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการเงินเดือน' using errcode='42501';
  end if;
  return query
  select i.code, i.name_th, i.kind, i.calc_type, i.fixed_amount, i.percent, i.default_value,
         i.unit, i.system_source, i.sort_order, i.show_in_slip, i.show_in_report, i.active,
         exists(select 1 from public.njhr_pay_entries e
                 where e.item_code = i.code and e.deleted_at is null),
         i.updated_at, i.updated_by
    from public.njhr_pay_items i
   where i.deleted_at is null
     and (p_kind is null or p_kind = '' or i.kind = upper(p_kind))
     and (p_active is null or i.active = p_active)
     and (p_q is null or p_q = '' or i.code ilike '%'||p_q||'%' or i.name_th ilike '%'||p_q||'%')
   order by i.kind desc, i.sort_order, i.code;
end $$;

-- เพิ่ม/แก้ไข (พารามิเตอร์ null = ไม่เปลี่ยนค่าเดิม) · กันรหัสซ้ำและชื่อซ้ำ
create or replace function public.njhr_pay_item_save(
  p_token text, p_code text, p_name_th text default null, p_kind text default null,
  p_calc_type text default null, p_fixed_amount numeric default null, p_percent numeric default null,
  p_default_value numeric default null, p_unit text default null, p_system_source text default null,
  p_show_in_slip boolean default null, p_show_in_report boolean default null,
  p_active boolean default null, p_is_new boolean default false)
returns table (code text, name_th text, kind text, active boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_code text := upper(btrim(coalesce(p_code,''))); oldrow jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์แก้ไขรายการเงินเดือน' using errcode='42501';
  end if;
  if v_code = '' then raise exception 'กรุณาระบุรหัสรายการ' using errcode='22023'; end if;
  if p_kind is not null and upper(p_kind) not in ('EARNING','DEDUCTION') then
    raise exception 'ประเภทรายการไม่ถูกต้อง (%)', p_kind using errcode='22023';
  end if;
  if p_calc_type is not null and upper(p_calc_type) not in ('FIXED','PERCENT','PER_EMPLOYEE','SYSTEM') then
    raise exception 'รูปแบบการคำนวณไม่ถูกต้อง (%)', p_calc_type using errcode='22023';
  end if;
  if p_fixed_amount is not null and p_fixed_amount < 0 then
    raise exception 'จำนวนเงินคงที่ต้องไม่ติดลบ' using errcode='22023';
  end if;
  if p_percent is not null and p_percent < 0 then
    raise exception 'เปอร์เซ็นต์ต้องไม่ติดลบ' using errcode='22023';
  end if;

  select to_jsonb(i) into oldrow from public.njhr_pay_items i where i.code = v_code;

  if oldrow is not null and (oldrow->>'deleted_at') is null and p_is_new then
    raise exception 'รหัสรายการ % มีอยู่แล้ว', v_code using errcode='23505';
  end if;
  if p_name_th is not null and btrim(p_name_th) <> '' and exists (
    select 1 from public.njhr_pay_items i
     where lower(i.name_th) = lower(btrim(p_name_th)) and i.code <> v_code and i.deleted_at is null) then
    raise exception 'ชื่อรายการ "%" ถูกใช้ไปแล้ว', btrim(p_name_th) using errcode='23505';
  end if;

  if oldrow is null then
    if coalesce(btrim(p_name_th),'') = '' then
      raise exception 'กรุณาระบุชื่อรายการ' using errcode='22023';
    end if;
    insert into public.njhr_pay_items(code, name_th, kind, calc_type, fixed_amount, percent,
        default_value, unit, system_source, show_in_slip, show_in_report, active,
        sort_order, created_by, updated_by)
    values (v_code, btrim(p_name_th), upper(coalesce(p_kind,'EARNING')),
            upper(coalesce(p_calc_type,'PER_EMPLOYEE')), coalesce(p_fixed_amount,0),
            coalesce(p_percent,0), coalesce(p_default_value,0),
            coalesce(nullif(btrim(coalesce(p_unit,'')),''),'THB'),
            nullif(btrim(coalesce(p_system_source,'')),''), coalesce(p_show_in_slip,true),
            coalesce(p_show_in_report,true), coalesce(p_active,true),
            (select coalesce(max(i2.sort_order),0)+10 from public.njhr_pay_items i2),
            c.username, c.username);
  else
    update public.njhr_pay_items set
      name_th        = coalesce(nullif(btrim(p_name_th),''), name_th),
      kind           = coalesce(upper(p_kind), kind),
      calc_type      = coalesce(upper(p_calc_type), calc_type),
      fixed_amount   = coalesce(p_fixed_amount, fixed_amount),
      percent        = coalesce(p_percent, percent),
      default_value  = coalesce(p_default_value, default_value),
      unit           = coalesce(nullif(btrim(coalesce(p_unit,'')),''), unit),
      system_source  = coalesce(nullif(btrim(coalesce(p_system_source,'')),''), system_source),
      show_in_slip   = coalesce(p_show_in_slip, show_in_slip),
      show_in_report = coalesce(p_show_in_report, show_in_report),
      active         = coalesce(p_active, active),
      deleted_at     = null,
      updated_at     = now(), updated_by = c.username
     where njhr_pay_items.code = v_code;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role,
         case when oldrow is null then 'PAYITEM_ADD' else 'PAYITEM_EDIT' end,
         'payroll', 'njhr_pay_items', v_code, 'รายการเงินเดือน ' || v_code, oldrow, to_jsonb(i)
    from public.njhr_pay_items i where i.code = v_code;

  return query select i.code, i.name_th, i.kind, i.active
                 from public.njhr_pay_items i where i.code = v_code;
end $$;

-- Soft Delete: รายการที่เคยถูกใช้งานแล้ว ห้ามลบ ให้ปิดใช้งานแทน
create or replace function public.njhr_pay_item_delete(p_token text, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_code text := upper(btrim(coalesce(p_code,''))); oldrow jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์ลบรายการเงินเดือน' using errcode='42501';
  end if;
  select to_jsonb(i) into oldrow from public.njhr_pay_items i
   where i.code = v_code and i.deleted_at is null;
  if oldrow is null then raise exception 'ไม่พบรายการนี้' using errcode='P0002'; end if;
  if exists (select 1 from public.njhr_pay_entries e
              where e.item_code = v_code and e.deleted_at is null) then
    raise exception 'รายการนี้ถูกใช้กับพนักงานแล้ว ลบไม่ได้ กรุณาปิดใช้งานแทน' using errcode='23503';
  end if;
  update public.njhr_pay_items set deleted_at = now(), active = false,
         updated_at = now(), updated_by = c.username
   where njhr_pay_items.code = v_code;
  perform public.njhr_audit_write(p_token, 'PAYITEM_DELETE', 'payroll', 'njhr_pay_items', v_code,
                                  'ลบรายการเงินเดือน (soft delete)', oldrow, null, null);
  return true;
end $$;

-- ลากเรียงลำดับ: ส่งรหัสตามลำดับที่ต้องการทั้งชุด
create or replace function public.njhr_pay_item_reorder(p_token text, p_codes text[])
returns int language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; n int := 0;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์จัดลำดับรายการ' using errcode='42501';
  end if;
  update public.njhr_pay_items i set sort_order = x.ord * 10,
         updated_at = now(), updated_by = c.username
    from (select unnest(p_codes) as cd, generate_subscripts(p_codes,1) as ord) x
   where i.code = x.cd and i.deleted_at is null;
  get diagnostics n = row_count;
  perform public.njhr_audit_write(p_token, 'PAYITEM_REORDER', 'payroll', 'njhr_pay_items', null,
                                  'จัดลำดับรายการ ' || n || ' รายการ', null, null, null);
  return n;
end $$;


-- ─── 5) RPC: รายการรายเดือนของพนักงาน ─────────────────────────
create or replace function public.njhr_pay_entries(
  p_token text, p_year int, p_month int, p_employee uuid default null, p_q text default null)
returns table (id uuid, employee_id uuid, emp_code text, emp_name text,
               item_code text, item_name text, kind text, amount numeric, percent numeric,
               note text, recurring boolean, updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการเงินเดือนของพนักงาน' using errcode='42501';
  end if;
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  return query
  select e.id, e.employee_id, em.emp_code,
         (coalesce(em.prefix,'')||em.first_name||' '||coalesce(em.last_name,'')),
         e.item_code, i.name_th, i.kind, e.amount, e.percent, e.note, e.recurring,
         e.updated_at, e.updated_by
    from public.njhr_pay_entries e
    join public.employees em on em.id = e.employee_id
    join public.njhr_pay_items i on i.code = e.item_code
   where e.deleted_at is null
     and e.period_year = p_year and e.period_month = p_month
     and (p_employee is null or e.employee_id = p_employee)
     and (p_q is null or p_q = '' or em.emp_code ilike '%'||p_q||'%'
          or (em.first_name||' '||coalesce(em.last_name,'')) ilike '%'||p_q||'%'
          or i.name_th ilike '%'||p_q||'%')
   order by em.emp_code, i.kind desc, i.sort_order;
end $$;

-- บันทึกยอดให้พนักงาน (upsert ตาม unique key · ไม่สร้างให้ทุกคนอัตโนมัติ)
create or replace function public.njhr_pay_entry_save(
  p_token text, p_employee uuid, p_year int, p_month int, p_item_code text,
  p_amount numeric default 0, p_percent numeric default null,
  p_note text default null, p_recurring boolean default false)
returns table (id uuid, item_code text, amount numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_code text := upper(btrim(coalesce(p_item_code,''))); it record;
        oldrow jsonb; v_id uuid;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์บันทึกรายการเงินเดือน' using errcode='42501';
  end if;
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  if p_year is null or p_year < 2000 or p_year > 2100 then
    raise exception 'ปีไม่ถูกต้อง' using errcode='22023';
  end if;
  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002';
  end if;
  select * into it from public.njhr_pay_items i where i.code = v_code and i.deleted_at is null;
  if not found then raise exception 'ไม่พบรหัสรายการ %', v_code using errcode='P0002'; end if;
  if not it.active then raise exception 'รายการ % ถูกปิดใช้งานอยู่', v_code using errcode='22023'; end if;
  if it.calc_type = 'SYSTEM' then
    raise exception 'รายการ % คำนวณจากระบบเดิมอยู่แล้ว (%) จึงกรอกยอดซ้ำไม่ได้',
      v_code, coalesce(it.system_source,'-') using errcode='22023';
  end if;
  if p_amount is null or p_amount <> p_amount then           -- กัน NaN
    raise exception 'จำนวนเงินไม่ถูกต้อง' using errcode='22023';
  end if;
  if p_amount < 0 then raise exception 'จำนวนเงินต้องไม่ติดลบ' using errcode='22023'; end if;

  select to_jsonb(e) into oldrow from public.njhr_pay_entries e
   where e.employee_id = p_employee and e.period_year = p_year
     and e.period_month = p_month and e.item_code = v_code and e.deleted_at is null;

  insert into public.njhr_pay_entries(employee_id, period_year, period_month, item_code,
                                      amount, percent, note, recurring, created_by, updated_by)
  values (p_employee, p_year, p_month, v_code, round(p_amount,2), p_percent,
          nullif(btrim(coalesce(p_note,'')),''), coalesce(p_recurring,false), c.username, c.username)
  on conflict (employee_id, period_year, period_month, item_code) where deleted_at is null
  do update set amount = excluded.amount, percent = excluded.percent, note = excluded.note,
                recurring = excluded.recurring, updated_at = now(), updated_by = c.username
  returning njhr_pay_entries.id into v_id;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role,
         case when oldrow is null then 'PAYENTRY_ADD' else 'PAYENTRY_EDIT' end,
         'payroll', 'njhr_pay_entries', v_id::text,
         v_code || ' งวด ' || p_month || '/' || p_year, oldrow, to_jsonb(e)
    from public.njhr_pay_entries e where e.id = v_id;

  return query select e.id, e.item_code, e.amount from public.njhr_pay_entries e where e.id = v_id;
end $$;

create or replace function public.njhr_pay_entry_delete(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์ลบรายการเงินเดือน' using errcode='42501';
  end if;
  select to_jsonb(e) into oldrow from public.njhr_pay_entries e
   where e.id = p_id and e.deleted_at is null;
  if oldrow is null then raise exception 'ไม่พบรายการนี้' using errcode='P0002'; end if;
  update public.njhr_pay_entries set deleted_at = now(), updated_at = now(), updated_by = c.username
   where njhr_pay_entries.id = p_id;
  perform public.njhr_audit_write(p_token, 'PAYENTRY_DELETE', 'payroll', 'njhr_pay_entries',
                                  p_id::text, 'ยกเลิกรายการเงินเดือน', oldrow, null, null);
  return true;
end $$;

-- คัดลอกรายการประจำจากเดือนก่อน (ไม่ทับของที่มีอยู่แล้ว)
create or replace function public.njhr_pay_entry_copy_prev(p_token text, p_year int, p_month int)
returns int language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; py int; pm int; n int := 0;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์บันทึกรายการเงินเดือน' using errcode='42501';
  end if;
  if p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  pm := case when p_month = 1 then 12 else p_month - 1 end;
  py := case when p_month = 1 then p_year - 1 else p_year end;

  insert into public.njhr_pay_entries(employee_id, period_year, period_month, item_code,
                                      amount, percent, note, recurring, created_by, updated_by)
  select e.employee_id, p_year, p_month, e.item_code, e.amount, e.percent, e.note, true,
         c.username, c.username
    from public.njhr_pay_entries e
    join public.njhr_pay_items i on i.code = e.item_code and i.deleted_at is null and i.active
   where e.deleted_at is null and e.recurring
     and e.period_year = py and e.period_month = pm
  on conflict (employee_id, period_year, period_month, item_code) where deleted_at is null
  do nothing;
  get diagnostics n = row_count;

  perform public.njhr_audit_write(p_token, 'PAYENTRY_COPY', 'payroll', 'njhr_pay_entries', null,
    'คัดลอกรายการประจำจาก ' || pm || '/' || py || ' มา ' || p_month || '/' || p_year ||
    ' จำนวน ' || n, null, null, null);
  return n;
end $$;


-- ─── 6) จุดเชื่อมสำหรับ เงินเดือน / สลิป / REPORT (อ่านอย่างเดียว) ──
create or replace function public.njhr_pay_entry_totals(
  p_token text, p_year int, p_month int, p_employee uuid default null)
returns table (employee_id uuid, emp_code text, earning_total numeric,
               deduction_total numeric, items jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  -- พนักงานทั่วไปดูได้เฉพาะของตนเอง (ใช้กับสลิป)
  if c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    if p_employee is null or p_employee is distinct from c.employee_id then
      raise exception 'ดูได้เฉพาะรายการเงินเดือนของตนเอง' using errcode='42501';
    end if;
  end if;
  if p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  return query
  select e.employee_id, max(em.emp_code),
         round(coalesce(sum(e.amount) filter (where i.kind = 'EARNING'), 0), 2),
         round(coalesce(sum(e.amount) filter (where i.kind = 'DEDUCTION'), 0), 2),
         jsonb_agg(jsonb_build_object('code', e.item_code, 'name', i.name_th, 'kind', i.kind,
                                      'amount', e.amount, 'slip', i.show_in_slip,
                                      'report', i.show_in_report)
                   order by i.kind desc, i.sort_order)
    from public.njhr_pay_entries e
    join public.njhr_pay_items i on i.code = e.item_code and i.deleted_at is null
    join public.employees em on em.id = e.employee_id
   where e.deleted_at is null
     and e.period_year = p_year and e.period_month = p_month
     and (p_employee is null or e.employee_id = p_employee)
   group by e.employee_id;
end $$;


-- ─── 7) สิทธิ์ ────────────────────────────────────────────────
grant execute on function public.njhr_pay_items(text,text,text,boolean)   to anon, authenticated;
grant execute on function public.njhr_pay_item_save(text,text,text,text,text,numeric,numeric,numeric,text,text,boolean,boolean,boolean,boolean) to anon, authenticated;
grant execute on function public.njhr_pay_item_delete(text,text)          to anon, authenticated;
grant execute on function public.njhr_pay_item_reorder(text,text[])       to anon, authenticated;
grant execute on function public.njhr_pay_entries(text,int,int,uuid,text) to anon, authenticated;
grant execute on function public.njhr_pay_entry_save(text,uuid,int,int,text,numeric,numeric,text,boolean) to anon, authenticated;
grant execute on function public.njhr_pay_entry_delete(text,uuid)         to anon, authenticated;
grant execute on function public.njhr_pay_entry_copy_prev(text,int,int)   to anon, authenticated;
grant execute on function public.njhr_pay_entry_totals(text,int,int,uuid) to anon, authenticated;


-- ─── 8) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'tables', (select jsonb_agg(table_name order by table_name) from information_schema.tables
              where table_schema='public' and table_name in ('njhr_pay_items','njhr_pay_entries')),
  'rls', (select jsonb_object_agg(c.relname, c.relrowsecurity) from pg_class c
           join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public' and c.relname in ('njhr_pay_items','njhr_pay_entries')),
  'unique_indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
                      where schemaname='public' and indexdef like 'CREATE UNIQUE%'
                        and tablename in ('njhr_pay_items','njhr_pay_entries')),
  'foreign_keys', (select jsonb_agg(pg_get_constraintdef(con.oid)) from pg_constraint con
                    join pg_class r on r.oid=con.conrelid
                   where r.relname='njhr_pay_entries' and con.contype='f'),
  'master_rows', (select count(*) from public.njhr_pay_items where deleted_at is null),
  'earning',   (select count(*) from public.njhr_pay_items where kind='EARNING' and deleted_at is null),
  'deduction', (select count(*) from public.njhr_pay_items where kind='DEDUCTION' and deleted_at is null),
  'system_calc', (select jsonb_agg(code order by code) from public.njhr_pay_items where calc_type='SYSTEM'),
  'entries_rows', (select count(*) from public.njhr_pay_entries),
  'payroll_table_still_exists', (select exists(select 1 from information_schema.tables
                                   where table_schema='public' and table_name='payroll'))
)) as install_report;


-- ─── 9) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_pay_entry_totals(text,int,int,uuid);
-- drop function if exists public.njhr_pay_entry_copy_prev(text,int,int);
-- drop function if exists public.njhr_pay_entry_delete(text,uuid);
-- drop function if exists public.njhr_pay_entry_save(text,uuid,int,int,text,numeric,numeric,text,boolean);
-- drop function if exists public.njhr_pay_entries(text,int,int,uuid,text);
-- drop function if exists public.njhr_pay_item_reorder(text,text[]);
-- drop function if exists public.njhr_pay_item_delete(text,text);
-- drop function if exists public.njhr_pay_item_save(text,text,text,text,text,numeric,numeric,numeric,text,text,boolean,boolean,boolean,boolean);
-- drop function if exists public.njhr_pay_items(text,text,text,boolean);
-- drop table if exists public.njhr_pay_entries;   -- ข้อมูลที่กรอกไว้จะหายไปด้วย
-- drop table if exists public.njhr_pay_items;
-- delete from public.njhr_schema_version where version = 'v10.3-pay-items';
