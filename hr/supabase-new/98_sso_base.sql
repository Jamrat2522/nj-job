-- ============================================================
-- NJ HR V.10 — 98_sso_base.sql
-- ฐานค่าจ้างประกันสังคมรายบุคคล + ค่าตั้งต้นระบบ + Snapshot ย้อนหลัง
--
-- โครงสร้างจริงที่ตรวจแล้ว (ไม่มีการเดาชื่อ)
--   employees       : 43 คอลัมน์ · มี base_salary · position_allow · diligence_allow
--                     phone_allow · travel_allow · fuel_allow   (48_employees.sql บรรทัด 20–27)
--   payroll         : 27 คอลัมน์ · มี social_security อยู่แล้ว    (53_payslip.sql บรรทัด 15–22)
--   system_settings : key (text) · value (jsonb) · category · is_public · updated_by/at  (78)
--   RPC สิทธิ์เดิม  : njhr_emp_guard(p_token) → can_salary  (SUPER_ADMIN/ADMIN/ACCOUNT)
--
-- ไม่สร้างตารางพนักงานหรือตารางตั้งค่าใหม่ · เพิ่มคอลัมน์แบบ additive เท่านั้น
-- รันซ้ำได้ทุกครั้ง · ไม่ลบข้อมูล · ไม่เขียนทับค่าที่ผู้ใช้ตั้งไว้แล้ว
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare miss text;
begin
  if to_regclass('public.employees') is null then raise exception 'PREFLIGHT: ไม่พบ employees'; end if;
  if to_regclass('public.payroll') is null then raise exception 'PREFLIGHT: ไม่พบ payroll'; end if;
  if to_regclass('public.system_settings') is null then
    raise exception 'PREFLIGHT: ไม่พบ system_settings — รัน 78_system_settings.sql ก่อน';
  end if;
  select string_agg(c, ', ') into miss from unnest(array[
    'base_salary','position_allow','diligence_allow','phone_allow','travel_allow','fuel_allow']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employees' and column_name=c);
  if miss is not null then
    raise exception 'PREFLIGHT: employees ขาดคอลัมน์เงินเดือน [%]', miss;
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='system_settings' and column_name='key') then
    raise exception 'PREFLIGHT: system_settings ต้องมีคอลัมน์ key/value — รัน 78 ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · พนักงาน % คน · งวดเงินเดือน % แถว',
    (select count(*) from public.employees),
    (select count(*) from public.payroll);
end $$;


-- ─── 1) คอลัมน์ประกันสังคมรายบุคคล (additive) ───────────────
alter table public.employees add column if not exists social_security_enabled        boolean;
alter table public.employees add column if not exists social_security_base_mode      text;
alter table public.employees add column if not exists social_security_custom_base    numeric(12,2);
alter table public.employees add column if not exists social_security_effective_date date;
alter table public.employees add column if not exists social_security_note           text;

alter table public.employees alter column social_security_enabled   set default true;
alter table public.employees alter column social_security_base_mode set default 'AUTO';

-- ─── 2) ค่าเริ่มต้นให้พนักงานเดิม (ไม่ทับค่าที่มีอยู่แล้ว) ───
update public.employees
   set social_security_enabled = true
 where social_security_enabled is null;

update public.employees
   set social_security_base_mode = 'AUTO'
 where social_security_base_mode is null;

-- custom_base ต้องเป็น NULL ในโหมด AUTO — แตะเฉพาะแถวที่ยังไม่เคยตั้งค่า
update public.employees
   set social_security_effective_date = current_date
 where social_security_effective_date is null;

-- ─── 3) CHECK CONSTRAINT ────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_emp_sso_mode_chk') then
    alter table public.employees add constraint njhr_emp_sso_mode_chk
      check (social_security_base_mode is null or social_security_base_mode in ('AUTO','MANUAL'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_emp_sso_base_chk') then
    alter table public.employees add constraint njhr_emp_sso_base_chk
      check (social_security_custom_base is null or social_security_custom_base >= 0);
  end if;
  -- โหมด MANUAL ต้องมีฐานที่กำหนดเอง (บังคับที่ RPC ด้วยอีกชั้น)
  if not exists (select 1 from pg_constraint where conname='njhr_emp_sso_manual_chk') then
    alter table public.employees add constraint njhr_emp_sso_manual_chk
      check (coalesce(social_security_base_mode,'AUTO') <> 'MANUAL'
             or social_security_custom_base is not null);
  end if;
end $$;

create index if not exists njhr_emp_sso_idx
  on public.employees (social_security_enabled, social_security_base_mode);


-- ─── 4) Snapshot บนตารางงวดเงินเดือน (additive) ─────────────
--  social_security เดิมคือ "ยอดหักลูกจ้าง" ยังใช้ต่อเหมือนเดิม ไม่แตะ
alter table public.payroll add column if not exists sso_base            numeric(12,2);
alter table public.payroll add column if not exists sso_rate_employee   numeric(6,3);
alter table public.payroll add column if not exists sso_rate_employer   numeric(6,3);
alter table public.payroll add column if not exists sso_employer_amount numeric(12,2);
alter table public.payroll add column if not exists sso_base_mode       text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='njhr_payroll_sso_mode_chk') then
    alter table public.payroll add constraint njhr_payroll_sso_mode_chk
      check (sso_base_mode is null or sso_base_mode in ('AUTO','MANUAL','NONE'));
  end if;
  if not exists (select 1 from pg_constraint where conname='njhr_payroll_sso_amt_chk') then
    alter table public.payroll add constraint njhr_payroll_sso_amt_chk
      check ((sso_base is null or sso_base >= 0)
         and (sso_employer_amount is null or sso_employer_amount >= 0));
  end if;
end $$;


-- ─── 5) ค่าตั้งต้นใน system_settings (ตารางเดิม ไม่สร้างใหม่) ─
--  ใส่เฉพาะ key ที่ยังไม่มี · ไม่ทับค่าที่ผู้ดูแลตั้งไว้แล้ว
insert into public.system_settings(key, value, category, is_public, updated_at)
select v.k, v.val::jsonb, 'payroll', v.pub, now()
  from (values
    ('sso_rate_employee',  '5.00',   true),   -- อัตราลูกจ้าง %
    ('sso_rate_employer',  '5.00',   true),   -- อัตรานายจ้าง %
    ('sso_base_min',       '1650',   true),   -- ฐานค่าจ้างขั้นต่ำ
    ('sso_base_max',       '15000',  true),   -- ฐานค่าจ้างสูงสุด
    ('sso_effective_date', '"2024-01-01"', true),
    ('sso_enabled',        'true',   true),
    -- รายการค่าจ้างประจำที่นำมารวมเป็นฐานประกันสังคมในโหมด AUTO
    ('sso_auto_include',   '["base_salary","position_allow"]', true)
  ) as v(k, val, pub)
 where not exists (select 1 from public.system_settings s where s.key = v.k);


-- ─── 6) ตัวช่วยอ่านค่าตั้งค่า + คำนวณฐาน (แหล่งเดียวของสูตร) ─
create or replace function public.njhr_sso_config()
returns table (rate_employee numeric, rate_employer numeric,
               base_min numeric, base_max numeric,
               effective_date date, enabled boolean, auto_include jsonb)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select (s.value #>> '{}')::numeric from public.system_settings s
               where s.key = 'sso_rate_employee'), 5.00),
    coalesce((select (s.value #>> '{}')::numeric from public.system_settings s
               where s.key = 'sso_rate_employer'), 5.00),
    coalesce((select (s.value #>> '{}')::numeric from public.system_settings s
               where s.key = 'sso_base_min'), 1650),
    coalesce((select (s.value #>> '{}')::numeric from public.system_settings s
               where s.key = 'sso_base_max'), 15000),
    coalesce((select (s.value #>> '{}')::date from public.system_settings s
               where s.key = 'sso_effective_date'), date '2024-01-01'),
    coalesce((select (s.value #>> '{}')::boolean from public.system_settings s
               where s.key = 'sso_enabled'), true),
    coalesce((select s.value from public.system_settings s
               where s.key = 'sso_auto_include'), '["base_salary","position_allow"]'::jsonb);
$$;

/* คำนวณฐานประกันสังคมของพนักงาน 1 คน — สูตรกลางที่ทุกหน้าต้องเรียกใช้
     AUTO   = ผลรวมรายการค่าจ้างประจำตาม sso_auto_include แล้วจำกัดด้วย min/max
     MANUAL = ใช้ social_security_custom_base แล้วจำกัดด้วย min/max
     ปิดประกันสังคม = 0 ทั้งหมด                                             */
create or replace function public.njhr_sso_base(p_employee uuid)
returns table (enabled boolean, base_mode text, raw_base numeric, sso_base numeric,
               rate_employee numeric, rate_employer numeric,
               amount_employee numeric, amount_employer numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare e record; cfg record; v_raw numeric := 0; v_base numeric := 0; k text;
begin
  select * into cfg from public.njhr_sso_config();
  select * into e from public.employees where id = p_employee;
  if not found then
    return query select false, 'NONE'::text, 0::numeric, 0::numeric,
      cfg.rate_employee, cfg.rate_employer, 0::numeric, 0::numeric;
    return;
  end if;

  if not cfg.enabled or coalesce(e.social_security_enabled, true) = false then
    return query select false, 'NONE'::text, 0::numeric, 0::numeric,
      cfg.rate_employee, cfg.rate_employer, 0::numeric, 0::numeric;
    return;
  end if;

  if coalesce(e.social_security_base_mode,'AUTO') = 'MANUAL' then
    v_raw := coalesce(e.social_security_custom_base, 0);
  else
    -- รวมเฉพาะคอลัมน์ที่ระบุใน sso_auto_include และมีอยู่จริงในตาราง
    for k in select jsonb_array_elements_text(cfg.auto_include) loop
      if exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='employees' and column_name=k) then
        v_raw := v_raw + coalesce((to_jsonb(e) ->> k)::numeric, 0);
      end if;
    end loop;
  end if;

  v_base := least(greatest(v_raw, cfg.base_min), cfg.base_max);

  return query select true, coalesce(e.social_security_base_mode,'AUTO'), round(v_raw,2), round(v_base,2),
    cfg.rate_employee, cfg.rate_employer,
    round(v_base * cfg.rate_employee / 100, 0),
    round(v_base * cfg.rate_employer / 100, 0);
end $$;


-- ─── 7) njhr_sso_list v2 — คืนฐานและยอดสมทบจากสูตรกลาง ──────
drop function if exists public.njhr_sso_list(text,text,text);
create or replace function public.njhr_sso_list(
  p_token text, p_q text default null, p_dept text default null)
returns table (employee_id uuid, emp_code text, full_name text, nickname text,
               department_name text, position_name text, emp_status text,
               base_salary numeric, start_date date,
               sso_enabled boolean, sso_base_mode text,
               sso_custom_base numeric, sso_effective_date date, sso_note text,
               sso_raw_base numeric, sso_base numeric,
               rate_employee numeric, rate_employer numeric,
               amount_employee numeric, amount_employer numeric)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
begin
  select * into c from public.njhr_emp_guard(p_token);
  if not c.can_salary then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลเงินสมทบประกันสังคม' using errcode='42501';
  end if;

  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text,
         coalesce(e.base_salary, 0)::numeric, e.start_date,
         coalesce(e.social_security_enabled, true),
         coalesce(e.social_security_base_mode, 'AUTO'),
         e.social_security_custom_base, e.social_security_effective_date,
         coalesce(e.social_security_note, ''),
         b.raw_base, b.sso_base, b.rate_employee, b.rate_employer,
         b.amount_employee, b.amount_employer
    from public.employees e
    cross join lateral public.njhr_sso_base(e.id) b
   where e.status::text in ('ACTIVE','PROBATION')
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
     and (p_dept is null or p_dept = '' or e.department_name = p_dept)
   order by e.emp_code;
end $$;


-- ─── 8) บันทึกข้อมูลประกันสังคมรายบุคคล ─────────────────────
create or replace function public.njhr_sso_emp_save(
  p_token text, p_employee uuid,
  p_enabled boolean default true, p_base_mode text default 'AUTO',
  p_custom_base numeric default null, p_effective_date date default null,
  p_note text default null)
returns table (employee_id uuid, sso_base numeric, amount_employee numeric, amount_employer numeric)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb; v_mode text := upper(btrim(coalesce(p_base_mode,'AUTO')));
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if not c.can_salary then
    raise exception 'คุณไม่มีสิทธิ์แก้ไขข้อมูลประกันสังคม' using errcode='42501';
  end if;
  if v_mode not in ('AUTO','MANUAL') then
    raise exception 'วิธีคำนวณต้องเป็น AUTO หรือ MANUAL' using errcode='22023';
  end if;
  if v_mode = 'MANUAL' and (p_custom_base is null or p_custom_base < 0) then
    raise exception 'โหมด MANUAL ต้องระบุฐานค่าจ้างที่ไม่ติดลบ' using errcode='22023';
  end if;

  select to_jsonb(x) into oldrow from public.employees x where x.id = p_employee;
  if oldrow is null then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;

  update public.employees set
    social_security_enabled        = coalesce(p_enabled, true),
    social_security_base_mode      = v_mode,
    social_security_custom_base    = case when v_mode = 'MANUAL' then round(p_custom_base, 2) else null end,
    social_security_effective_date = coalesce(p_effective_date, social_security_effective_date, current_date),
    social_security_note           = nullif(btrim(coalesce(p_note,'')),''),
    updated_at = now()
   where employees.id = p_employee;

  perform public.njhr_audit_write(p_token, 'SSO_EMP_SAVE', 'payroll', 'employees',
    p_employee::text,
    'ตั้งค่าประกันสังคม: ' || (case when coalesce(p_enabled,true) then 'เข้าประกันสังคม' else 'ไม่เข้าประกันสังคม' end) ||
    ' · ' || v_mode || coalesce(' · ฐาน ' || p_custom_base::text, ''),
    oldrow, (select to_jsonb(x) from public.employees x where x.id = p_employee), null);

  return query select p_employee, b.sso_base, b.amount_employee, b.amount_employer
                 from public.njhr_sso_base(p_employee) b;
end $$;


-- ─── 9) เขียน Snapshot ลงงวดเงินเดือน ───────────────────────
--  เรียกตอนสร้าง/ล็อกงวด · ไม่แตะ social_security เดิม ถ้ามีค่าอยู่แล้ว
create or replace function public.njhr_sso_snapshot(
  p_token text, p_year int, p_month int, p_overwrite boolean default false)
returns table (updated int, skipped int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; r record; b record; n int := 0; s int := 0;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if not c.can_salary then
    raise exception 'คุณไม่มีสิทธิ์บันทึกข้อมูลประกันสังคมของงวดเงินเดือน' using errcode='42501';
  end if;

  for r in select p.id, p.employee_id, p.sso_base, p.status
             from public.payroll p
            where p.period_year = p_year and p.period_month = p_month
  loop
    -- งวดที่ยืนยัน/ปิดแล้วห้ามเขียนทับ เว้นแต่สั่ง overwrite ชัดเจน
    if r.sso_base is not null and not p_overwrite then s := s + 1; continue; end if;
    if upper(coalesce(r.status::text,'DRAFT')) in ('CALCULATED','PAID') and not p_overwrite then
      s := s + 1; continue;
    end if;

    select * into b from public.njhr_sso_base(r.employee_id);
    update public.payroll set
      sso_base            = b.sso_base,
      sso_rate_employee   = b.rate_employee,
      sso_rate_employer   = b.rate_employer,
      sso_employer_amount = b.amount_employer,
      sso_base_mode       = case when b.enabled then b.base_mode else 'NONE' end
     where payroll.id = r.id;
    n := n + 1;
  end loop;

  perform public.njhr_audit_write(p_token, 'SSO_SNAPSHOT', 'payroll', 'payroll', null,
    'บันทึก Snapshot ประกันสังคมงวด ' || p_month || '/' || p_year ||
    ' · อัปเดต ' || n || ' · ข้าม ' || s, null, null, null);
  return query select n, s;
end $$;


-- ─── 10) GRANT ──────────────────────────────────────────────
revoke execute on function public.njhr_sso_base(uuid) from public, anon, authenticated;
grant execute on function public.njhr_sso_config()                                   to anon, authenticated;
grant execute on function public.njhr_sso_list(text,text,text)                       to anon, authenticated;
grant execute on function public.njhr_sso_emp_save(text,uuid,boolean,text,numeric,date,text) to anon, authenticated;
grant execute on function public.njhr_sso_snapshot(text,int,int,boolean)             to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.6-sso-base', 'ฐานค่าจ้างประกันสังคมรายบุคคล + ค่าตั้งต้นระบบ + Snapshot งวดเงินเดือน')
on conflict (version) do nothing;


-- ─── 11) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'employees_columns', (select jsonb_agg(column_name order by column_name)
                          from information_schema.columns
                         where table_schema='public' and table_name='employees'
                           and column_name like 'social\_security\_%'),
  'payroll_columns', (select jsonb_agg(column_name order by column_name)
                        from information_schema.columns
                       where table_schema='public' and table_name='payroll'
                         and column_name like 'sso\_%'),
  'constraints', (select jsonb_agg(conname order by conname) from pg_constraint
                   where conname like 'njhr\_%sso\_%'),
  'settings', (select jsonb_object_agg(s.key, s.value) from public.system_settings s
                where s.key like 'sso\_%'),
  'defaults_filled', jsonb_build_object(
    'enabled_not_null', (select count(*) from public.employees where social_security_enabled is not null),
    'mode_not_null',    (select count(*) from public.employees where social_security_base_mode is not null),
    'eff_date_not_null',(select count(*) from public.employees where social_security_effective_date is not null),
    'total',            (select count(*) from public.employees)),
  'mode_breakdown', coalesce((select jsonb_object_agg(m, n) from
     (select coalesce(social_security_base_mode,'(null)') m, count(*) n
        from public.employees group by 1) x), '{}'::jsonb),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid)) order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_sso\_%')
)) as install_report;


-- ============================================================
-- ROLLBACK (รันเฉพาะเมื่อต้องการย้อนกลับ — ข้อมูลในคอลัมน์จะหาย)
-- ============================================================
-- begin;
--   drop function if exists public.njhr_sso_snapshot(text,int,int,boolean);
--   drop function if exists public.njhr_sso_emp_save(text,uuid,boolean,text,numeric,date,text);
--   drop function if exists public.njhr_sso_list(text,text,text);
--   drop function if exists public.njhr_sso_base(uuid);
--   drop function if exists public.njhr_sso_config();
--   alter table public.employees drop constraint if exists njhr_emp_sso_mode_chk;
--   alter table public.employees drop constraint if exists njhr_emp_sso_base_chk;
--   alter table public.employees drop constraint if exists njhr_emp_sso_manual_chk;
--   alter table public.payroll  drop constraint if exists njhr_payroll_sso_mode_chk;
--   alter table public.payroll  drop constraint if exists njhr_payroll_sso_amt_chk;
--   drop index if exists njhr_emp_sso_idx;
--   alter table public.employees
--     drop column if exists social_security_enabled,
--     drop column if exists social_security_base_mode,
--     drop column if exists social_security_custom_base,
--     drop column if exists social_security_effective_date,
--     drop column if exists social_security_note;
--   alter table public.payroll
--     drop column if exists sso_base, drop column if exists sso_rate_employee,
--     drop column if exists sso_rate_employer, drop column if exists sso_employer_amount,
--     drop column if exists sso_base_mode;
--   delete from public.system_settings where key like 'sso\_%';
--   delete from public.njhr_schema_version where version = 'v14.6-sso-base';
-- commit;
