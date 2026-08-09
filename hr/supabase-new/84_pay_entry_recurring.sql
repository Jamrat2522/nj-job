-- ============================================================
-- NJ HR V.10 — 84_pay_entry_recurring.sql
-- รายการเงินเดือนรายบุคคล: แยก "ใช้เฉพาะเดือนนี้" กับ "ใช้ต่อเนื่องทุกเดือน"
--
-- โครงสร้างเดิมที่ยืนยันแล้ว (43_pay_items.sql บรรทัด 69–94)
--   njhr_pay_entries = id · employee_id · period_year · period_month · item_code
--                      amount · percent · note · recurring · deleted_at
--                      created_at/by · updated_at/by
--   njhr_pay_items   = code · name_th · kind(EARNING/DEDUCTION) · calc_type · sort_order
--                      show_in_slip · show_in_report · active · deleted_at
--   payroll.status   = DRAFT · CALCULATED · PAID   (53_payslip.sql บรรทัด 60–62)
--
-- จึงไม่สร้างตารางใหม่ ใช้ของเดิมและเติมคอลัมน์แบบ additive เท่านั้น
--   entry_mode · effective_start · effective_end · is_active
--   คอลัมน์ recurring เดิมยังถูกเขียนค่าให้ตรงกันเสมอ เพราะ 72_doc_salary_items.sql อ่านอยู่
--
-- หลักการสำคัญ
--   ONE_TIME  = ผูกกับ period_year/period_month เท่านั้น เดือนถัดไปไม่เห็นเด็ดขาด
--   RECURRING = เก็บ "แถวเดียว" พร้อมช่วงวันที่ แล้วให้ RPC คำนวณว่างวดไหนเข้าเงื่อนไข
--               ไม่มีการสร้าง record ซ้ำทุกเดือน จึงไม่มีทางเกิดยอดซ้ำ
--
-- ไม่แตะสูตรคำนวณเงินเดือนเดิม · ไม่แตะตาราง payroll · ไม่แตะ njhr_pay_items
-- ต้องรัน 41 · 42 · 43 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare miss text; act text;
begin
  if to_regclass('public.njhr_pay_entries') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_pay_entries — รัน 43_pay_items.sql ก่อน';
  end if;
  select string_agg(c, ', ') into miss from unnest(array[
    'id','employee_id','period_year','period_month','item_code',
    'amount','percent','note','recurring','deleted_at']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='njhr_pay_entries'
                        and column_name = c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='njhr_pay_entries';
    raise exception 'PREFLIGHT: njhr_pay_entries ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;
  raise notice 'PREFLIGHT ผ่าน · njhr_pay_entries % แถว (ประจำ % แถว)',
    (select count(*) from public.njhr_pay_entries where deleted_at is null),
    (select count(*) from public.njhr_pay_entries where deleted_at is null and recurring);
end $$;


-- ─── 1) คอลัมน์ใหม่ (additive · ข้อมูลเดิมไม่หาย) ────────────
alter table public.njhr_pay_entries add column if not exists entry_mode      text;
alter table public.njhr_pay_entries add column if not exists effective_start date;
alter table public.njhr_pay_entries add column if not exists effective_end   date;
alter table public.njhr_pay_entries add column if not exists is_active       boolean;

-- เติมค่าให้แถวเดิมโดยไม่เปลี่ยนความหมาย: recurring=true → RECURRING เริ่มต้นเดือนของแถวนั้น
update public.njhr_pay_entries
   set entry_mode = coalesce(entry_mode, case when recurring then 'RECURRING' else 'ONE_TIME' end),
       is_active  = coalesce(is_active, true),
       effective_start = coalesce(effective_start,
         case when recurring then make_date(period_year, period_month, 1) end)
 where entry_mode is null or is_active is null
    or (recurring and effective_start is null);

alter table public.njhr_pay_entries alter column entry_mode set default 'ONE_TIME';
alter table public.njhr_pay_entries alter column is_active  set default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_pe_mode_chk') then
    alter table public.njhr_pay_entries add constraint njhr_pe_mode_chk
      check (entry_mode is null or entry_mode in ('ONE_TIME','RECURRING'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_pe_range_chk') then
    alter table public.njhr_pay_entries add constraint njhr_pe_range_chk
      check (effective_end is null or effective_start is null or effective_end >= effective_start);
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_pe_recur_needs_start_chk') then
    alter table public.njhr_pay_entries add constraint njhr_pe_recur_needs_start_chk
      check (entry_mode <> 'RECURRING' or effective_start is not null);
  end if;
end $$;

-- กันซ้ำ (1): เดิมคือ พนักงาน+ปี+เดือน+รายการ → เพิ่ม entry_mode เข้าไป
--   เพื่อให้รายการเดียวกันมีทั้งแบบครั้งเดียวและแบบประจำในเดือนเริ่มต้นเดียวกันได้
drop index if exists njhr_pay_entries_uidx;
create unique index if not exists njhr_pay_entries_uidx
  on public.njhr_pay_entries (employee_id, period_year, period_month, item_code,
                              coalesce(entry_mode,'ONE_TIME'))
  where deleted_at is null;

-- กันซ้ำ (2): รายการประจำที่ยังเปิดใช้งาน ต้องมีได้ชุดเดียวต่อ พนักงาน+รายการ
create unique index if not exists njhr_pay_entries_recur_uidx
  on public.njhr_pay_entries (employee_id, item_code)
  where deleted_at is null and entry_mode = 'RECURRING' and is_active;

create index if not exists njhr_pay_entries_eff_idx
  on public.njhr_pay_entries (entry_mode, is_active, effective_start, effective_end)
  where deleted_at is null;


-- ─── 2) ตัวช่วย ─────────────────────────────────────────────
create or replace function public.njhr_pay_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if p_write and c.role not in ('SUPER_ADMIN','ADMIN','ACCOUNT') then
    raise exception 'คุณไม่มีสิทธิ์บันทึกรายการเงินเดือน' using errcode='42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN','ACCOUNT'));
end $$;

-- งวดถูกล็อกหรือยัง (CALCULATED / PAID = ห้ามแก้ย้อนหลัง)
create or replace function public.njhr_pay_period_locked(p_year int, p_month int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.payroll p
                  where p.period_year = p_year and p.period_month = p_month
                    and upper(coalesce(p.status::text,'DRAFT')) in ('CALCULATED','PAID'));
$$;

-- รายการนี้มีผลกับงวด (ปี/เดือน) นี้หรือไม่ — ตรรกะกลางที่ทุก RPC ใช้ร่วมกัน
create or replace function public.njhr_pay_entry_in_period(
  p_mode text, p_active boolean, p_py int, p_pm int,
  p_start date, p_end date, p_year int, p_month int)
returns boolean language sql immutable as $$
  select case
    when coalesce(p_mode,'ONE_TIME') = 'ONE_TIME'
      then p_py = p_year and p_pm = p_month
    else coalesce(p_active,true)
     and p_start is not null
     and p_start <= (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::date
     and (p_end is null or p_end >= make_date(p_year, p_month, 1))
  end;
$$;


-- ─── 3) njhr_pay_entries — รายการที่มีผลกับงวดที่เลือก ───────
drop function if exists public.njhr_pay_entries(text,int,int,uuid,text);
create or replace function public.njhr_pay_entries(
  p_token text, p_year int, p_month int, p_employee uuid default null, p_q text default null)
returns table (id uuid, employee_id uuid, emp_code text, emp_name text, department_name text,
               item_code text, item_name text, kind text, amount numeric, percent numeric,
               note text, recurring boolean, entry_mode text,
               effective_start date, effective_end date, is_active boolean,
               period_year int, period_month int, locked boolean, can_delete boolean,
               updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_lock boolean;
begin
  select * into c from public.njhr_pay_guard(p_token, false);
  if not c.is_admin then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการเงินเดือนของพนักงาน' using errcode='42501';
  end if;
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  v_lock := public.njhr_pay_period_locked(p_year, p_month);

  return query
  select e.id, e.employee_id, em.emp_code,
         (coalesce(em.prefix,'')||em.first_name||' '||coalesce(em.last_name,'')),
         coalesce(em.department_name,''),
         e.item_code, i.name_th, i.kind, e.amount, e.percent, e.note,
         coalesce(e.recurring,false), coalesce(e.entry_mode,'ONE_TIME'),
         e.effective_start, e.effective_end, coalesce(e.is_active,true),
         e.period_year, e.period_month, v_lock,
         -- ลบได้เฉพาะรายการที่ยังไม่ถูกใช้ในงวดที่ยืนยัน/ปิดแล้ว
         (not exists (select 1 from public.payroll p
                       where p.employee_id = e.employee_id
                         and upper(coalesce(p.status::text,'DRAFT')) in ('CALCULATED','PAID')
                         and public.njhr_pay_entry_in_period(e.entry_mode, e.is_active,
                               e.period_year, e.period_month, e.effective_start, e.effective_end,
                               p.period_year, p.period_month))),
         e.updated_at, e.updated_by
    from public.njhr_pay_entries e
    join public.employees em on em.id = e.employee_id
    join public.njhr_pay_items i on i.code = e.item_code
   where e.deleted_at is null
     and public.njhr_pay_entry_in_period(e.entry_mode, e.is_active, e.period_year, e.period_month,
                                         e.effective_start, e.effective_end, p_year, p_month)
     and (p_employee is null or e.employee_id = p_employee)
     and (p_q is null or p_q = '' or em.emp_code ilike '%'||p_q||'%'
          or (coalesce(em.prefix,'')||em.first_name||' '||coalesce(em.last_name,'')) ilike '%'||p_q||'%'
          or coalesce(em.nickname,'') ilike '%'||p_q||'%'
          or coalesce(em.department_name,'') ilike '%'||p_q||'%'
          or i.name_th ilike '%'||p_q||'%')
   order by em.emp_code,                       -- 1) รหัสพนักงานน้อย→มาก
            (i.kind = 'DEDUCTION'),            -- 2) เงินเพิ่มก่อน 3) เงินหัก
            i.name_th;                         -- 4) ชื่อรายการ
end $$;


-- ─── 4) njhr_pay_entry_save — เพิ่ม/แก้ไข ────────────────────
drop function if exists public.njhr_pay_entry_save(text,uuid,int,int,text,numeric,numeric,text,boolean);
create or replace function public.njhr_pay_entry_save(
  p_token text, p_employee uuid, p_year int, p_month int, p_item_code text,
  p_amount numeric default 0, p_percent numeric default null,
  p_note text default null, p_recurring boolean default false,
  p_mode text default null, p_effective_start date default null,
  p_effective_end date default null, p_is_active boolean default true,
  p_id uuid default null)
returns table (id uuid, item_code text, amount numeric, entry_mode text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; it record; oldrow jsonb; v_id uuid;
        v_code text := upper(btrim(coalesce(p_item_code,'')));
        v_mode text := upper(btrim(coalesce(p_mode,
                         case when coalesce(p_recurring,false) then 'RECURRING' else 'ONE_TIME' end)));
        v_start date; v_end date := p_effective_end; v_amt numeric := round(coalesce(p_amount,0), 2);
begin
  select * into c from public.njhr_pay_guard(p_token, true);

  if v_mode not in ('ONE_TIME','RECURRING') then
    raise exception 'รูปแบบรายการต้องเป็น ONE_TIME หรือ RECURRING' using errcode='22023';
  end if;
  if p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  select * into it from public.njhr_pay_items i
   where i.code = v_code and i.deleted_at is null;
  if not found then raise exception 'ไม่พบรายการเงินเดือนรหัส %', v_code using errcode='P0002'; end if;
  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002';
  end if;
  if v_amt < 0 then raise exception 'จำนวนเงินต้องไม่ติดลบ' using errcode='22023'; end if;

  v_start := coalesce(p_effective_start, make_date(p_year, p_month, 1));
  if v_mode = 'ONE_TIME' then v_end := null; end if;
  if v_end is not null and v_end < v_start then
    raise exception 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้' using errcode='22023';
  end if;

  -- งวดที่ยืนยัน/ปิดแล้ว ห้ามแก้ย้อนหลัง
  if v_mode = 'ONE_TIME' and public.njhr_pay_period_locked(p_year, p_month) then
    raise exception 'งวด %/% ถูกยืนยันหรือปิดแล้ว แก้ไขย้อนหลังไม่ได้', p_month, p_year
      using errcode='42501';
  end if;

  -- รายการประจำที่เปิดใช้งานอยู่ ต้องมีได้ชุดเดียวต่อ พนักงาน + รายการ
  if v_mode = 'RECURRING' and coalesce(p_is_active, true) then
    if exists (select 1 from public.njhr_pay_entries x
                where x.deleted_at is null and x.entry_mode = 'RECURRING' and x.is_active
                  and x.employee_id = p_employee and x.item_code = v_code
                  and (p_id is null or x.id <> p_id)) then
      raise exception 'พนักงานรายนี้มีรายการประจำ "%" ที่เปิดใช้งานอยู่แล้ว — ให้ปิดรายการเดิมก่อนสร้างใหม่',
        it.name_th using errcode='23505';
    end if;
  end if;

  if p_id is not null then
    select to_jsonb(x) into oldrow from public.njhr_pay_entries x
     where x.id = p_id and x.deleted_at is null;
    if oldrow is null then raise exception 'ไม่พบรายการนี้ หรือถูกลบไปแล้ว' using errcode='P0002'; end if;
    update public.njhr_pay_entries set
      employee_id = p_employee, item_code = v_code, amount = v_amt,
      percent = p_percent, note = nullif(btrim(coalesce(p_note,'')),''),
      entry_mode = v_mode, recurring = (v_mode = 'RECURRING'),
      effective_start = v_start, effective_end = v_end,
      is_active = coalesce(p_is_active, true),
      updated_at = now(), updated_by = c.username
     where njhr_pay_entries.id = p_id;
    v_id := p_id;
  else
    insert into public.njhr_pay_entries(
      employee_id, period_year, period_month, item_code, amount, percent, note,
      recurring, entry_mode, effective_start, effective_end, is_active, created_by, updated_by)
    values (p_employee, p_year, p_month, v_code, v_amt, p_percent,
            nullif(btrim(coalesce(p_note,'')),''),
            (v_mode = 'RECURRING'), v_mode, v_start, v_end,
            coalesce(p_is_active, true), c.username, c.username)
    on conflict (employee_id, period_year, period_month, item_code, coalesce(entry_mode,'ONE_TIME'))
      where deleted_at is null
    do update set amount = excluded.amount, percent = excluded.percent, note = excluded.note,
                  recurring = excluded.recurring, entry_mode = excluded.entry_mode,
                  effective_start = excluded.effective_start, effective_end = excluded.effective_end,
                  is_active = excluded.is_active, updated_at = now(), updated_by = c.username
    returning njhr_pay_entries.id into v_id;
  end if;

  perform public.njhr_audit_write(p_token, case when p_id is null then 'PAYENTRY_ADD' else 'PAYENTRY_EDIT' end,
    'payroll', 'njhr_pay_entries', v_id::text,
    it.name_th || ' · ' || v_mode || ' · ' || v_amt::text ||
    ' · ' || p_month || '/' || p_year, oldrow,
    (select to_jsonb(x) from public.njhr_pay_entries x where x.id = v_id), null);

  return query select e.id, e.item_code, e.amount, e.entry_mode
                 from public.njhr_pay_entries e where e.id = v_id;
end $$;


-- ─── 5) เปิด/ปิดใช้งานรายการ ────────────────────────────────
create or replace function public.njhr_pay_entry_set_active(
  p_token text, p_id uuid, p_active boolean)
returns table (id uuid, is_active boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb;
begin
  select * into c from public.njhr_pay_guard(p_token, true);
  select to_jsonb(x) into oldrow from public.njhr_pay_entries x
   where x.id = p_id and x.deleted_at is null;
  if oldrow is null then raise exception 'ไม่พบรายการนี้' using errcode='P0002'; end if;

  update public.njhr_pay_entries
     set is_active = coalesce(p_active,true), updated_at = now(), updated_by = c.username
   where njhr_pay_entries.id = p_id;

  perform public.njhr_audit_write(p_token,
    case when p_active then 'PAYENTRY_ENABLE' else 'PAYENTRY_DISABLE' end,
    'payroll', 'njhr_pay_entries', p_id::text,
    'เปลี่ยนสถานะรายการเงินเดือน', oldrow,
    (select to_jsonb(x) from public.njhr_pay_entries x where x.id = p_id), null);

  return query select e.id, e.is_active from public.njhr_pay_entries e where e.id = p_id;
end $$;


-- ─── 6) ลบ (Soft Delete) — เฉพาะที่ยังไม่ถูกใช้ในงวดที่ปิดแล้ว ─
drop function if exists public.njhr_pay_entry_delete(text,uuid);
create or replace function public.njhr_pay_entry_delete(p_token text, p_id uuid)
returns table (deleted boolean, item_code text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; oldrow jsonb;
begin
  select * into c from public.njhr_pay_guard(p_token, true);
  select * into e from public.njhr_pay_entries where njhr_pay_entries.id = p_id and deleted_at is null;
  if not found then raise exception 'ไม่พบรายการนี้ หรือถูกลบไปแล้ว' using errcode='P0002'; end if;
  oldrow := to_jsonb(e);

  if exists (select 1 from public.payroll p
              where p.employee_id = e.employee_id
                and upper(coalesce(p.status::text,'DRAFT')) in ('CALCULATED','PAID')
                and public.njhr_pay_entry_in_period(e.entry_mode, e.is_active,
                      e.period_year, e.period_month, e.effective_start, e.effective_end,
                      p.period_year, p.period_month)) then
    raise exception 'รายการนี้ถูกใช้ในงวดเงินเดือนที่ยืนยันแล้ว ลบไม่ได้ — ให้ปิดใช้งานแทน'
      using errcode='42501';
  end if;

  update public.njhr_pay_entries
     set deleted_at = now(), updated_at = now(), updated_by = c.username
   where njhr_pay_entries.id = p_id;

  perform public.njhr_audit_write(p_token, 'PAYENTRY_DELETE', 'payroll', 'njhr_pay_entries',
    p_id::text, 'ลบรายการเงินเดือน ' || e.item_code, oldrow, null, null);

  return query select true, e.item_code;
end $$;


-- ─── 7) คัดลอกจากเดือนก่อน — เฉพาะรายการ ONE_TIME ────────────
--  รายการประจำไม่ต้องคัดลอก เพราะระบบนำมาให้อัตโนมัติอยู่แล้ว
create or replace function public.njhr_pay_entry_copy_preview(
  p_token text, p_year int, p_month int)
returns table (id uuid, employee_id uuid, emp_code text, emp_name text,
               item_code text, item_name text, kind text, amount numeric,
               note text, already boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; py int; pm int;
begin
  select * into c from public.njhr_pay_guard(p_token, false);
  if not c.is_admin then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการเงินเดือน' using errcode='42501';
  end if;
  pm := case when p_month = 1 then 12 else p_month - 1 end;
  py := case when p_month = 1 then p_year - 1 else p_year end;

  return query
  select e.id, e.employee_id, em.emp_code,
         (coalesce(em.prefix,'')||em.first_name||' '||coalesce(em.last_name,'')),
         e.item_code, i.name_th, i.kind, e.amount, e.note,
         exists (select 1 from public.njhr_pay_entries x
                  where x.deleted_at is null and x.employee_id = e.employee_id
                    and x.item_code = e.item_code and coalesce(x.entry_mode,'ONE_TIME') = 'ONE_TIME'
                    and x.period_year = p_year and x.period_month = p_month)
    from public.njhr_pay_entries e
    join public.employees em on em.id = e.employee_id
    join public.njhr_pay_items i on i.code = e.item_code and i.deleted_at is null and i.active
   where e.deleted_at is null
     and coalesce(e.entry_mode,'ONE_TIME') = 'ONE_TIME'
     and e.period_year = py and e.period_month = pm
   order by em.emp_code, (i.kind = 'DEDUCTION'), i.name_th;
end $$;

--  p_rows = [{ "id": "<uuid ของแถวเดือนก่อน>", "amount": 1234.00 }]  (amount ไม่ใส่ = ใช้ยอดเดิม)
create or replace function public.njhr_pay_entry_copy_apply(
  p_token text, p_year int, p_month int, p_rows jsonb)
returns table (copied int, skipped int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r jsonb; src record; n int := 0; s int := 0; v_amt numeric;
begin
  select * into c from public.njhr_pay_guard(p_token, true);
  if p_month < 1 or p_month > 12 then
    raise exception 'เดือนต้องอยู่ระหว่าง 1–12' using errcode='22023';
  end if;
  if public.njhr_pay_period_locked(p_year, p_month) then
    raise exception 'งวด %/% ถูกยืนยันหรือปิดแล้ว เพิ่มรายการไม่ได้', p_month, p_year
      using errcode='42501';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'กรุณาเลือกรายการที่ต้องการคัดลอก' using errcode='22023';
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    select * into src from public.njhr_pay_entries e
     where e.id = (r->>'id')::uuid and e.deleted_at is null
       and coalesce(e.entry_mode,'ONE_TIME') = 'ONE_TIME';
    if not found then s := s + 1; continue; end if;      -- ไม่คัดลอกรายการประจำเด็ดขาด
    v_amt := round(coalesce(nullif(r->>'amount','')::numeric, src.amount), 2);

    insert into public.njhr_pay_entries(
      employee_id, period_year, period_month, item_code, amount, percent, note,
      recurring, entry_mode, effective_start, effective_end, is_active, created_by, updated_by)
    values (src.employee_id, p_year, p_month, src.item_code, v_amt, src.percent, src.note,
            false, 'ONE_TIME', make_date(p_year, p_month, 1), null, true, c.username, c.username)
    on conflict (employee_id, period_year, period_month, item_code, coalesce(entry_mode,'ONE_TIME'))
      where deleted_at is null
    do nothing;
    if found then n := n + 1; else s := s + 1; end if;
  end loop;

  perform public.njhr_audit_write(p_token, 'PAYENTRY_COPY', 'payroll', 'njhr_pay_entries', null,
    'คัดลอกรายการครั้งเดียวมางวด ' || p_month || '/' || p_year ||
    ' สำเร็จ ' || n || ' ข้าม ' || s, null, null, null);
  return query select n, s;
end $$;

-- ของเดิม njhr_pay_entry_copy_prev: ปิดการใช้งาน เพราะรายการประจำไม่ต้องคัดลอกอีกแล้ว
drop function if exists public.njhr_pay_entry_copy_prev(text,int,int);


-- ─── 8) ยอดรวมสำหรับเงินเดือน / สลิป / REPORT ───────────────
--  รวมทั้ง ONE_TIME ของงวดนั้น และ RECURRING ที่ยังมีผล — แยกบรรทัดทุกรายการ
drop function if exists public.njhr_pay_entry_totals(text,int,int,uuid);
create or replace function public.njhr_pay_entry_totals(
  p_token text, p_year int, p_month int, p_employee uuid default null)
returns table (employee_id uuid, emp_code text, earning_total numeric,
               deduction_total numeric, items jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_pay_guard(p_token, false);
  if not c.is_admin then
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
                                      'amount', e.amount, 'mode', coalesce(e.entry_mode,'ONE_TIME'),
                                      'slip', i.show_in_slip, 'report', i.show_in_report)
                   order by (i.kind = 'DEDUCTION'), i.name_th)
    from public.njhr_pay_entries e
    join public.employees em on em.id = e.employee_id
    join public.njhr_pay_items i on i.code = e.item_code and i.deleted_at is null
   where e.deleted_at is null
     and public.njhr_pay_entry_in_period(e.entry_mode, e.is_active, e.period_year, e.period_month,
                                         e.effective_start, e.effective_end, p_year, p_month)
     and (p_employee is null or e.employee_id = p_employee)
   group by e.employee_id;
end $$;


-- ─── 9) ประวัติการเปลี่ยนแปลงรายการ ─────────────────────────
create or replace function public.njhr_pay_entry_history(p_token text, p_id uuid)
returns table (at timestamptz, actor text, actor_role text, action text, detail text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_pay_guard(p_token, false);
  if not c.is_admin then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติรายการเงินเดือน' using errcode='42501';
  end if;
  return query
  select a.created_at, coalesce(a.actor,''), coalesce(a.actor_role,''),
         a.action, coalesce(a.detail,'')
    from public.audit_log a
   where a.app_code = 'salary' and a.entity = 'njhr_pay_entries'
     and a.entity_id = p_id::text
   order by a.created_at desc
   limit 100;
end $$;


-- ─── 10) GRANT ──────────────────────────────────────────────
revoke execute on function public.njhr_pay_guard(text, boolean) from public, anon, authenticated;
revoke execute on function public.njhr_pay_period_locked(int,int) from public, anon, authenticated;
grant execute on function public.njhr_pay_entries(text,int,int,uuid,text)                                  to anon, authenticated;
grant execute on function public.njhr_pay_entry_save(text,uuid,int,int,text,numeric,numeric,text,boolean,text,date,date,boolean,uuid) to anon, authenticated;
grant execute on function public.njhr_pay_entry_set_active(text,uuid,boolean)                              to anon, authenticated;
grant execute on function public.njhr_pay_entry_delete(text,uuid)                                          to anon, authenticated;
grant execute on function public.njhr_pay_entry_copy_preview(text,int,int)                                 to anon, authenticated;
grant execute on function public.njhr_pay_entry_copy_apply(text,int,int,jsonb)                             to anon, authenticated;
grant execute on function public.njhr_pay_entry_totals(text,int,int,uuid)                                  to anon, authenticated;
grant execute on function public.njhr_pay_entry_history(text,uuid)                                         to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.5-pay-entry-recurring', 'รายการเงินเดือน: ONE_TIME / RECURRING + ช่วงวันที่ + กันซ้ำ + ล็อกงวดที่ยืนยันแล้ว')
on conflict (version) do nothing;


-- ─── 11) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'columns', (select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='njhr_pay_entries'),
  'constraints', (select jsonb_agg(conname order by conname) from pg_constraint con
                    join pg_class r on r.oid=con.conrelid where r.relname='njhr_pay_entries'),
  'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
                where schemaname='public' and tablename='njhr_pay_entries'),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_pay\_entry%'),
  'rows_total', (select count(*) from public.njhr_pay_entries where deleted_at is null),
  'rows_one_time', (select count(*) from public.njhr_pay_entries
                     where deleted_at is null and coalesce(entry_mode,'ONE_TIME')='ONE_TIME'),
  'rows_recurring', (select count(*) from public.njhr_pay_entries
                      where deleted_at is null and entry_mode='RECURRING'),
  'recurring_flag_in_sync', (select count(*) = 0 from public.njhr_pay_entries
                              where deleted_at is null
                                and coalesce(recurring,false) <> (entry_mode = 'RECURRING'))
)) as install_report;
