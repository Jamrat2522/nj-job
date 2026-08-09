-- ============================================================
-- NJ HR V.10 — 99_emp_get_sso.sql
-- ให้ njhr_emp_get ส่งข้อมูลประกันสังคมกลับมาด้วย
--
-- คอลัมน์ทั้ง 5 ถูกสร้างไว้แล้วใน 98_sso_base.sql — ไฟล์นี้ไม่สร้างซ้ำ
-- ส่งกลับเฉพาะผู้ที่ can_salary (SUPER_ADMIN / ADMIN / ACCOUNT) แบบเดียวกับ base_salary
-- แก้เฉพาะการ "อ่าน" ไม่แตะการบันทึกหรือสิทธิ์เดิม · รันซ้ำได้
-- ============================================================

do $$
declare miss text;
begin
  select string_agg(c, ', ') into miss from unnest(array[
    'social_security_enabled','social_security_base_mode','social_security_custom_base',
    'social_security_effective_date','social_security_note']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employees' and column_name=c);
  if miss is not null then
    raise exception 'PREFLIGHT: employees ขาดคอลัมน์ [%] — รัน 98_sso_base.sql ก่อน', miss;
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_emp_get') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_get — รัน 48_employees.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- แทรก 5 ฟิลด์เข้าไปใน jsonb เดิมที่ njhr_emp_get คืนกลับ
-- ทำแบบ wrapper: เรียกฟังก์ชันเดิมไม่ได้เพราะชื่อซ้ำ จึงใช้วิธีรวม jsonb ที่ระดับ RPC ใหม่
-- แต่เพื่อไม่ให้ Frontend ต้องเปลี่ยนชื่อ RPC จึง create or replace ทับด้วยโครงเดิมทุกอย่าง
create or replace function public.njhr_emp_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record;
begin
  select * into c from public.njhr_emp_guard(p_token);
  select * into e from public.employees where id = p_id;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;

  return query select (jsonb_build_object(
    'id', e.id, 'emp_code', e.emp_code, 'prefix', coalesce(e.prefix,''),
    'first_name', e.first_name, 'last_name', coalesce(e.last_name,''),
    'first_name_en', e.first_name_en, 'last_name_en', e.last_name_en,
    'nickname', coalesce(e.nickname,''), 'gender', e.gender, 'birth_date', e.birth_date,
    'national_id', coalesce(e.national_id,''), 'phone', coalesce(e.phone,''),
    'email', coalesce(e.email,''), 'address', coalesce(e.address,''),
    'photo_url', coalesce(e.photo_url,''),
    'department_id', e.department_id, 'department_name', coalesce(e.department_name,''),
    'position_name', coalesce(e.position_name,''), 'level', e.level, 'supervisor_id', e.supervisor_id,
    'supervisor_name', (select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'')
                          from public.employees s where s.id = e.supervisor_id),
    'start_date', e.start_date, 'resign_date', e.resign_date,
    'probation_days', e.probation_days, 'probation_pass_date', e.probation_pass_date,
    'status', e.status::text, 'emp_type', e.emp_type, 'employee_category', e.employee_category,
    'salary_type', e.salary_type, 'payment_method', e.payment_method,
    'work_start', e.work_start, 'work_end', e.work_end,
    'leave_sick', e.leave_sick, 'leave_personal', e.leave_personal, 'leave_vacation', e.leave_vacation,
    'created_at', e.created_at, 'updated_at', e.updated_at,
    'can_salary', c.can_salary,
    'base_salary',     case when c.can_salary then e.base_salary end,
    'position_allow',  case when c.can_salary then e.position_allow end,
    'diligence_allow', case when c.can_salary then e.diligence_allow end,
    'phone_allow',     case when c.can_salary then e.phone_allow end,
    'travel_allow',    case when c.can_salary then e.travel_allow end,
    'fuel_allow',      case when c.can_salary then e.fuel_allow end,
    'bank_name',         case when c.can_salary then e.bank_name end,
    'bank_branch',       case when c.can_salary then e.bank_branch end,
    'bank_account',      case when c.can_salary then e.bank_account end,
    'bank_account_name', case when c.can_salary then e.bank_account_name end
  ) || case when c.can_salary then jsonb_build_object(
    -- ประกันสังคมรายบุคคล (98_sso_base.sql)
    'social_security_enabled',        coalesce(e.social_security_enabled, true),
    'social_security_base_mode',      coalesce(e.social_security_base_mode, 'AUTO'),
    'social_security_custom_base',    e.social_security_custom_base,
    'social_security_effective_date', e.social_security_effective_date,
    'social_security_note',           coalesce(e.social_security_note, '')
  ) else '{}'::jsonb end);
end $$;

grant execute on function public.njhr_emp_get(text,uuid) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v14.7-emp-get-sso', 'njhr_emp_get ส่งข้อมูลประกันสังคมกลับให้ผู้มีสิทธิ์ดูเงินเดือน')
on conflict (version) do nothing;


-- ─── VERIFICATION ───────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function', (select jsonb_build_object('name', p.proname,
                 'args', pg_get_function_arguments(p.oid),
                 'returns', pg_get_function_result(p.oid))
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='njhr_emp_get'),
  'sso_columns_on_employees', (select jsonb_agg(column_name order by column_name)
                                 from information_schema.columns
                                where table_schema='public' and table_name='employees'
                                  and column_name like 'social\_security\_%')
)) as install_report;
