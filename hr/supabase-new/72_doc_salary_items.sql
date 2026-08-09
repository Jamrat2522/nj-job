-- ============================================================
-- NJ HR V.10 — 72_doc_salary_items.sql
-- ดึง "รายได้ประจำ" ของพนักงานจากระบบเงินเดือนจริง มาใช้ในหนังสือรับรองเงินเดือน
--
-- โครงจริงที่ตรวจแล้ว (จาก 43_pay_items.sql — ไม่เดาชื่อ Table/Field)
--   public.njhr_pay_items    : code · name_th · kind('EARNING'|'DEDUCTION')
--                              calc_type('FIXED'|'PERCENT'|'PER_EMPLOYEE'|'SYSTEM')
--                              sort_order · show_in_slip · active · deleted_at
--   public.njhr_pay_entries  : employee_id · period_year · period_month · item_code
--                              amount · recurring · deleted_at
--   public.employees         : base_salary  (เงินเดือนพื้นฐาน)
--
-- เกณฑ์ "รายได้ประจำ" (ไม่เดาจากชื่อรายการ ใช้ค่าที่ระบบกำหนดไว้จริง)
--   · kind = 'EARNING'            → เป็นรายได้ ไม่ใช่รายการหัก
--   · calc_type <> 'SYSTEM'       → ตัดรายการที่คำนวณจากระบบอื่น (เช่น OT) ออก
--   · njhr_pay_entries.recurring  → เป็นรายการประจำทุกเดือน (ตัดโบนัส/คอมมิชชันที่จ่ายครั้งเดียว)
--   · amount > 0                  → ไม่แสดงรายการที่ยอดเป็นศูนย์
--
-- ไม่แตะ: ตารางเงินเดือน · การคำนวณเงินเดือน · สลิป · รายงาน · RPC เงินเดือนเดิมทุกตัว
-- อ่านอย่างเดียว 100% · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.employees') is null then raise exception 'PREFLIGHT: ไม่พบตาราง employees'; end if;
  if to_regclass('public.njhr_pay_items') is null then
    raise warning 'ไม่พบ njhr_pay_items — หนังสือรับรองเงินเดือนจะแสดงเฉพาะเงินเดือนพื้นฐาน';
  end if;
  if to_regclass('public.njhr_pay_entries') is null then
    raise warning 'ไม่พบ njhr_pay_entries — หนังสือรับรองเงินเดือนจะแสดงเฉพาะเงินเดือนพื้นฐาน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) รายได้ประจำของพนักงาน (อ่านอย่างเดียว) ──────────────
-- p_year/p_month เว้นว่าง = ใช้งวดล่าสุดที่พนักงานคนนั้นมีรายการประจำอยู่
create or replace function public.njhr_doc_salary_items(
  p_token text, p_employee uuid, p_year int default null, p_month int default null)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; v_y int; v_m int; v_items jsonb := '[]'::jsonb;
        v_has_pay boolean := (to_regclass('public.njhr_pay_items') is not null
                          and to_regclass('public.njhr_pay_entries') is not null);
        v_base numeric := 0; v_total numeric := 0;
begin
  select * into c from public.njhr_doc_guard(p_token, true);
  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานที่เลือก' using errcode='P0002'; end if;
  v_base := coalesce(e.base_salary, 0);

  if v_has_pay then
    -- งวดล่าสุดที่มีรายการประจำของพนักงานคนนี้
    if p_year is null or p_month is null then
      select en.period_year, en.period_month into v_y, v_m
        from public.njhr_pay_entries en
        join public.njhr_pay_items it on it.code = en.item_code
       where en.employee_id = p_employee and en.deleted_at is null and en.recurring
         and it.deleted_at is null and it.active and it.kind = 'EARNING'
         and it.calc_type <> 'SYSTEM' and en.amount > 0
       order by en.period_year desc, en.period_month desc
       limit 1;
    else
      v_y := p_year; v_m := p_month;
    end if;

    if v_y is not null then
      select coalesce(jsonb_agg(jsonb_build_object(
               'code', t.code, 'name', t.name_th, 'amount', t.amount)
               order by t.sort_order, t.code), '[]'::jsonb)
        into v_items
        from (
          select it.code, it.name_th, it.sort_order, sum(en.amount) amount
            from public.njhr_pay_entries en
            join public.njhr_pay_items it on it.code = en.item_code
           where en.employee_id = p_employee
             and en.period_year = v_y and en.period_month = v_m
             and en.deleted_at is null and en.recurring
             and it.deleted_at is null and it.active
             and it.kind = 'EARNING' and it.calc_type <> 'SYSTEM'
           group by it.code, it.name_th, it.sort_order
          having sum(en.amount) > 0
        ) t;
    end if;
  end if;

  select v_base + coalesce(sum((x->>'amount')::numeric), 0)
    into v_total from jsonb_array_elements(v_items) x;

  return query select jsonb_build_object(
    'employee_id', p_employee,
    'has_payroll', v_has_pay,
    'period_year', v_y,
    'period_month', v_m,
    'base_salary', v_base,
    'items', v_items,
    'total', v_total,
    'source', case when not v_has_pay then 'NO_PAYROLL_TABLE'
                   when v_y is null then 'NO_ENTRY'
                   else 'PAYROLL' end);
end $$;

grant execute on function public.njhr_doc_salary_items(text,uuid,int,int) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v12.4-doc-salary-items', 'หนังสือรับรองเงินเดือนดึงรายได้ประจำจาก njhr_pay_items/njhr_pay_entries')
on conflict (version) do nothing;


-- ─── 2) VERIFICATION + รายงานโครงจริง ───────────────────────
select jsonb_pretty(jsonb_build_object(
  'ตารางเงินเดือนที่มีจริง', jsonb_build_object(
    'njhr_pay_items',   to_regclass('public.njhr_pay_items')   is not null,
    'njhr_pay_entries', to_regclass('public.njhr_pay_entries') is not null),
  'รายการรายได้ (EARNING) ที่ใช้งานอยู่', case when to_regclass('public.njhr_pay_items') is null then null
    else (select coalesce(jsonb_agg(jsonb_build_object(
            'code', code, 'name', name_th, 'calc_type', calc_type, 'sort', sort_order)
            order by sort_order, code), '[]'::jsonb)
            from public.njhr_pay_items
           where kind='EARNING' and active and deleted_at is null) end,
  'จำนวนรายการประจำในระบบ', case when to_regclass('public.njhr_pay_entries') is null then null
    else (select count(*) from public.njhr_pay_entries where recurring and deleted_at is null) end,
  'งวดล่าสุดที่มีข้อมูล', case when to_regclass('public.njhr_pay_entries') is null then null
    else (select jsonb_build_object('year', max(period_year),
                 'month', max(period_month) filter (where period_year = (select max(period_year)
                          from public.njhr_pay_entries where deleted_at is null)))
            from public.njhr_pay_entries where deleted_at is null) end,
  'พนักงานที่มีเงินเดือนพื้นฐาน', (select count(*) from public.employees where coalesce(base_salary,0) > 0),
  'ข้อมูลเงินเดือนไม่ถูกแตะ', jsonb_build_object(
    'employees', (select count(*) from public.employees),
    'pay_entries', case when to_regclass('public.njhr_pay_entries') is null then null
                        else (select count(*) from public.njhr_pay_entries) end)
)) as install_report;
-- 👉 ถ้า "รายการรายได้ (EARNING)" ว่าง หรือ "จำนวนรายการประจำ" = 0
--    หนังสือรับรองเงินเดือนจะแสดงเฉพาะเงินเดือนพื้นฐาน และแจ้งเตือนในหน้าจอ (ไม่สร้างข้อมูลปลอม)

-- ─── 3) ROLLBACK ───────────────────────────────────────────
-- drop function if exists public.njhr_doc_salary_items(text,uuid,int,int);
