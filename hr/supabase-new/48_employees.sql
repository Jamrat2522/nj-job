-- ============================================================
-- NJ HR V.10 — 48_employees.sql
-- โมดูลข้อมูลพนักงาน: อ่าน/เพิ่ม/แก้ไข/เปลี่ยนสถานะ บนตาราง employees จริง
--
-- ใช้คอลัมน์ที่ตรวจยืนยันแล้วจาก 40_leave_inspect.sql เท่านั้น (ไม่เดาชื่อคอลัมน์)
-- ไม่สร้างตารางใหม่ · ไม่แตะ leave_requests / payroll / njhr_* เดิม
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='employees'
     and column_name in ('id','emp_code','prefix','first_name','last_name','nickname','gender',
       'birth_date','national_id','phone','email','address','department_id','department_name',
       'position_name','level','supervisor_id','start_date','resign_date','probation_days',
       'probation_pass_date','status','emp_type','salary_type','payment_method','work_start','work_end',
       'base_salary','position_allow','diligence_allow','phone_allow','travel_allow','fuel_allow',
       'bank_name','bank_branch','bank_account','bank_account_name',
       'leave_sick','leave_personal','leave_vacation','photo_url','created_at','updated_at');
  if n <> 43 then raise exception 'PREFLIGHT: employees คอลัมน์ไม่ครบ 43 (พบ %)', n; end if;
  if not exists (select 1 from information_schema.tables
                  where table_schema='public' and table_name='departments') then
    raise exception 'PREFLIGHT: ไม่พบตาราง departments';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

create index if not exists njhr_emp_code_idx on public.employees (emp_code);
create index if not exists njhr_emp_dept_idx on public.employees (department_name, status);
create index if not exists njhr_emp_status_idx on public.employees (status);

insert into public.njhr_schema_version(version, note)
values ('v10.8-employees', 'โมดูลข้อมูลพนักงาน (RPC อ่าน/เพิ่ม/แก้ไข/เปลี่ยนสถานะ)')
on conflict (version) do nothing;


-- ─── 1) สิทธิ์ ───────────────────────────────────────────────
-- ดูทะเบียนพนักงาน = สิทธิ์เดียวกับหน้า #/employees เดิม
create or replace function public.njhr_emp_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, emp_name text, can_salary boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if p_write then
    if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
      raise exception 'คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงาน' using errcode='42501';
    end if;
  else
    if c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER','ACCOUNT') then
      raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลพนักงาน' using errcode='42501';
    end if;
  end if;
  -- ข้อมูลเงินเดือน/บัญชีธนาคาร เปิดให้เฉพาะสิทธิ์ที่เกี่ยวข้องกับเงินเดือน
  return query select c.app_user_id, c.username, c.role, c.employee_id, c.emp_name,
                      (c.role in ('SUPER_ADMIN','ADMIN','ACCOUNT'));
end $$;

-- แผนกจากข้อมูลจริง (ใช้เติม Dropdown ไม่ hardcode)
create or replace function public.njhr_emp_departments(p_token text)
returns table (id uuid, code text, name text, employees int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_emp_guard(p_token, false);
  return query
  select d.id, coalesce(d.code,''), d.name,
         (select count(*)::int from public.employees e where e.department_id = d.id)
    from public.departments d order by d.name;
end $$;


-- ─── 2) รายชื่อพนักงาน (ค้นหา/กรอง/เรียง/แบ่งหน้า ฝั่งเซิร์ฟเวอร์) ──
create or replace function public.njhr_emp_list(
  p_token text, p_q text default null, p_dept text default null, p_status text default null,
  p_sort text default 'emp_code', p_desc boolean default false,
  p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, emp_code text, prefix text, full_name text, nickname text, photo_url text,
  department_name text, position_name text, level text, start_date date, resign_date date,
  status text, emp_type text, phone text, email text, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,''))); lim int := least(greatest(coalesce(p_limit,20),1),100);
        srt text := lower(coalesce(p_sort,'emp_code'));
begin
  perform public.njhr_emp_guard(p_token, false);
  if srt not in ('emp_code','full_name','department_name','start_date','status') then srt := 'emp_code'; end if;
  return query
  with base as (
    select e.* from public.employees e
     where (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_status is null or p_status = '' or e.status::text = upper(p_status))
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or lower(coalesce(e.phone,'')) like '%'||q||'%'
            or lower(coalesce(e.email,'')) like '%'||q||'%'
            or lower(coalesce(e.position_name,'')) like '%'||q||'%')),
  cnt as (select count(*) n from base)
  select b.id, b.emp_code, coalesce(b.prefix,''),
         (b.first_name || ' ' || coalesce(b.last_name,'')), coalesce(b.nickname,''), b.photo_url,
         coalesce(b.department_name,''), coalesce(b.position_name,''), coalesce(b.level,''),
         b.start_date, b.resign_date, b.status::text, coalesce(b.emp_type,''),
         coalesce(b.phone,''), coalesce(b.email,''), (select n from cnt)
    from base b
   order by
     case when p_desc then null else
       case srt when 'emp_code' then b.emp_code
                when 'full_name' then b.first_name
                when 'department_name' then b.department_name
                when 'status' then b.status::text end end asc nulls last,
     case when p_desc then
       case srt when 'emp_code' then b.emp_code
                when 'full_name' then b.first_name
                when 'department_name' then b.department_name
                when 'status' then b.status::text end end desc nulls last,
     case when srt = 'start_date' and not p_desc then b.start_date end asc nulls last,
     case when srt = 'start_date' and p_desc then b.start_date end desc nulls last,
     b.emp_code
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 3) รายละเอียดพนักงาน 1 คน ───────────────────────────────
create or replace function public.njhr_emp_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record;
begin
  select * into c from public.njhr_emp_guard(p_token, false);
  select * into e from public.employees where id = p_id;
  if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
  return query select jsonb_strip_nulls(jsonb_build_object(
    'id', e.id, 'emp_code', e.emp_code, 'photo_url', e.photo_url,
    'prefix', e.prefix, 'first_name', e.first_name, 'last_name', e.last_name,
    'first_name_en', e.first_name_en, 'last_name_en', e.last_name_en, 'nickname', e.nickname,
    'gender', e.gender, 'birth_date', e.birth_date, 'national_id', e.national_id,
    'phone', e.phone, 'email', e.email, 'address', e.address,
    'department_id', e.department_id, 'department_name', e.department_name,
    'position_name', e.position_name, 'level', e.level, 'supervisor_id', e.supervisor_id,
    'supervisor_name', (select coalesce(s.prefix,'')||s.first_name||' '||coalesce(s.last_name,'')
                          from public.employees s where s.id = e.supervisor_id),
    'start_date', e.start_date, 'resign_date', e.resign_date,
    'probation_days', e.probation_days, 'probation_pass_date', e.probation_pass_date,
    'status', e.status::text, 'emp_type', e.emp_type, 'employee_category', e.employee_category,
    'salary_type', e.salary_type, 'payment_method', e.payment_method,
    'work_start', e.work_start, 'work_end', e.work_end,
    'leave_sick', e.leave_sick, 'leave_personal', e.leave_personal, 'leave_vacation', e.leave_vacation,
    'created_at', e.created_at, 'updated_at', e.updated_at,
    -- ข้อมูลเงินเดือน/ธนาคาร: ส่งกลับเฉพาะสิทธิ์ที่เกี่ยวข้อง
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
  ));
end $$;


-- ─── 4) เพิ่ม / แก้ไข ────────────────────────────────────────
-- ส่งเป็น jsonb ก้อนเดียว: คีย์ที่ไม่ส่งมา = ไม่เปลี่ยนค่าเดิม
create or replace function public.njhr_emp_save(p_token text, p_id uuid, p_data jsonb)
returns table (id uuid, emp_code text, full_name text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb; v_id uuid; v_code text; v_nid text; v_mail text;
        v_dept uuid; v_status text;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'ข้อมูลไม่ถูกต้อง' using errcode='22023';
  end if;
  v_code := upper(btrim(coalesce(p_data->>'emp_code','')));
  v_nid  := btrim(coalesce(p_data->>'national_id',''));
  v_mail := lower(btrim(coalesce(p_data->>'email','')));

  -- ---- ตรวจข้อมูลบังคับ (เฉพาะตอนเพิ่มใหม่ หรือเมื่อส่งค่ามาแก้)
  if p_id is null then
    if v_code = '' then raise exception 'กรุณาระบุรหัสพนักงาน' using errcode='22023'; end if;
    if coalesce(btrim(p_data->>'first_name'),'') = '' then
      raise exception 'กรุณาระบุชื่อ' using errcode='22023'; end if;
    if coalesce(btrim(p_data->>'last_name'),'') = '' then
      raise exception 'กรุณาระบุนามสกุล' using errcode='22023'; end if;
    if coalesce(p_data->>'start_date','') = '' then
      raise exception 'กรุณาระบุวันที่เริ่มงาน' using errcode='22023'; end if;
  end if;
  if v_mail <> '' and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'รูปแบบอีเมลไม่ถูกต้อง' using errcode='22023';
  end if;
  if v_nid <> '' and v_nid !~ '^[0-9]{13}$' then
    raise exception 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' using errcode='22023';
  end if;
  if (p_data ? 'base_salary') and not c.can_salary then
    raise exception 'คุณไม่มีสิทธิ์แก้ไขข้อมูลเงินเดือน' using errcode='42501';
  end if;

  -- ---- กันข้อมูลซ้ำ
  if v_code <> '' and exists (select 1 from public.employees e
      where upper(e.emp_code) = v_code and (p_id is null or e.id <> p_id)) then
    raise exception 'รหัสพนักงาน % ถูกใช้ไปแล้ว', v_code using errcode='23505';
  end if;
  if v_nid <> '' and exists (select 1 from public.employees e
      where e.national_id = v_nid and (p_id is null or e.id <> p_id)) then
    raise exception 'เลขบัตรประชาชนนี้ถูกใช้ไปแล้ว' using errcode='23505';
  end if;
  if v_mail <> '' and exists (select 1 from public.employees e
      where lower(e.email) = v_mail and (p_id is null or e.id <> p_id)) then
    raise exception 'อีเมล % ถูกใช้ไปแล้ว', v_mail using errcode='23505';
  end if;

  -- ---- แผนก: รับ department_id แล้ว sync ชื่อแผนกให้ตรงเสมอ
  v_dept := nullif(p_data->>'department_id','')::uuid;
  v_status := upper(coalesce(nullif(btrim(coalesce(p_data->>'status','')),''), 'ACTIVE'));

  if p_id is null then
    insert into public.employees (
      emp_code, prefix, first_name, last_name, first_name_en, last_name_en, nickname, gender,
      birth_date, national_id, phone, email, address, department_id, department_name,
      position_name, level, supervisor_id, start_date, probation_days, status, emp_type,
      salary_type, payment_method, work_start, work_end,
      leave_sick, leave_personal, leave_vacation, photo_url,
      base_salary, position_allow, diligence_allow, phone_allow, travel_allow, fuel_allow,
      bank_name, bank_branch, bank_account, bank_account_name)
    values (
      v_code, nullif(btrim(coalesce(p_data->>'prefix','')),''),
      btrim(p_data->>'first_name'), btrim(p_data->>'last_name'),
      nullif(btrim(coalesce(p_data->>'first_name_en','')),''), nullif(btrim(coalesce(p_data->>'last_name_en','')),''),
      nullif(btrim(coalesce(p_data->>'nickname','')),''), nullif(btrim(coalesce(p_data->>'gender','')),''),
      nullif(p_data->>'birth_date','')::date, nullif(v_nid,''),
      nullif(btrim(coalesce(p_data->>'phone','')),''), nullif(v_mail,''),
      nullif(btrim(coalesce(p_data->>'address','')),''), v_dept,
      coalesce((select d.name from public.departments d where d.id = v_dept),
               nullif(btrim(coalesce(p_data->>'department_name','')),'')),
      nullif(btrim(coalesce(p_data->>'position_name','')),''), nullif(btrim(coalesce(p_data->>'level','')),''),
      nullif(p_data->>'supervisor_id','')::uuid, (p_data->>'start_date')::date,
      coalesce(nullif(p_data->>'probation_days','')::int, 119),
      v_status::public.emp_status, nullif(btrim(coalesce(p_data->>'emp_type','')),''),
      coalesce(nullif(btrim(coalesce(p_data->>'salary_type','')),''),'MONTHLY'),
      coalesce(nullif(btrim(coalesce(p_data->>'payment_method','')),''),'BANK'),
      coalesce(nullif(p_data->>'work_start','')::time, '08:30'),
      coalesce(nullif(p_data->>'work_end','')::time, '17:30'),
      coalesce(nullif(p_data->>'leave_sick','')::int, 30),
      coalesce(nullif(p_data->>'leave_personal','')::int, 10),
      coalesce(nullif(p_data->>'leave_vacation','')::int, 6),
      nullif(btrim(coalesce(p_data->>'photo_url','')),''),
      case when c.can_salary then coalesce(nullif(p_data->>'base_salary','')::numeric, 0) else 0 end,
      case when c.can_salary then coalesce(nullif(p_data->>'position_allow','')::numeric, 0) else 0 end,
      case when c.can_salary then coalesce(nullif(p_data->>'diligence_allow','')::numeric, 0) else 0 end,
      case when c.can_salary then coalesce(nullif(p_data->>'phone_allow','')::numeric, 0) else 0 end,
      case when c.can_salary then coalesce(nullif(p_data->>'travel_allow','')::numeric, 0) else 0 end,
      case when c.can_salary then coalesce(nullif(p_data->>'fuel_allow','')::numeric, 0) else 0 end,
      case when c.can_salary then nullif(btrim(coalesce(p_data->>'bank_name','')),'') end,
      case when c.can_salary then nullif(btrim(coalesce(p_data->>'bank_branch','')),'') end,
      case when c.can_salary then nullif(btrim(coalesce(p_data->>'bank_account','')),'') end,
      case when c.can_salary then nullif(btrim(coalesce(p_data->>'bank_account_name','')),'') end)
    returning employees.id into v_id;
  else
    select to_jsonb(e) into oldrow from public.employees e where e.id = p_id;
    if oldrow is null then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
    update public.employees set
      emp_code       = coalesce(nullif(v_code,''), emp_code),
      prefix         = case when p_data ? 'prefix' then nullif(btrim(p_data->>'prefix'),'') else prefix end,
      first_name     = coalesce(nullif(btrim(coalesce(p_data->>'first_name','')),''), first_name),
      last_name      = coalesce(nullif(btrim(coalesce(p_data->>'last_name','')),''), last_name),
      first_name_en  = case when p_data ? 'first_name_en' then nullif(btrim(p_data->>'first_name_en'),'') else first_name_en end,
      last_name_en   = case when p_data ? 'last_name_en' then nullif(btrim(p_data->>'last_name_en'),'') else last_name_en end,
      nickname       = case when p_data ? 'nickname' then nullif(btrim(p_data->>'nickname'),'') else nickname end,
      gender         = case when p_data ? 'gender' then nullif(btrim(p_data->>'gender'),'') else gender end,
      birth_date     = case when p_data ? 'birth_date' then nullif(p_data->>'birth_date','')::date else birth_date end,
      national_id    = case when p_data ? 'national_id' then nullif(v_nid,'') else national_id end,
      phone          = case when p_data ? 'phone' then nullif(btrim(p_data->>'phone'),'') else phone end,
      email          = case when p_data ? 'email' then nullif(v_mail,'') else email end,
      address        = case when p_data ? 'address' then nullif(btrim(p_data->>'address'),'') else address end,
      department_id  = case when p_data ? 'department_id' then v_dept else department_id end,
      department_name= case when p_data ? 'department_id'
                            then coalesce((select d.name from public.departments d where d.id = v_dept), department_name)
                            else department_name end,
      position_name  = case when p_data ? 'position_name' then nullif(btrim(p_data->>'position_name'),'') else position_name end,
      level          = case when p_data ? 'level' then nullif(btrim(p_data->>'level'),'') else level end,
      supervisor_id  = case when p_data ? 'supervisor_id' then nullif(p_data->>'supervisor_id','')::uuid else supervisor_id end,
      start_date     = case when p_data ? 'start_date' then nullif(p_data->>'start_date','')::date else start_date end,
      probation_days = case when p_data ? 'probation_days' then nullif(p_data->>'probation_days','')::int else probation_days end,
      emp_type       = case when p_data ? 'emp_type' then nullif(btrim(p_data->>'emp_type'),'') else emp_type end,
      salary_type    = case when p_data ? 'salary_type' then nullif(btrim(p_data->>'salary_type'),'') else salary_type end,
      payment_method = case when p_data ? 'payment_method' then nullif(btrim(p_data->>'payment_method'),'') else payment_method end,
      work_start     = case when p_data ? 'work_start' then nullif(p_data->>'work_start','')::time else work_start end,
      work_end       = case when p_data ? 'work_end' then nullif(p_data->>'work_end','')::time else work_end end,
      leave_sick     = case when p_data ? 'leave_sick' then nullif(p_data->>'leave_sick','')::int else leave_sick end,
      leave_personal = case when p_data ? 'leave_personal' then nullif(p_data->>'leave_personal','')::int else leave_personal end,
      leave_vacation = case when p_data ? 'leave_vacation' then nullif(p_data->>'leave_vacation','')::int else leave_vacation end,
      photo_url      = case when p_data ? 'photo_url' then nullif(btrim(p_data->>'photo_url'),'') else photo_url end,
      base_salary     = case when c.can_salary and p_data ? 'base_salary' then nullif(p_data->>'base_salary','')::numeric else base_salary end,
      position_allow  = case when c.can_salary and p_data ? 'position_allow' then nullif(p_data->>'position_allow','')::numeric else position_allow end,
      diligence_allow = case when c.can_salary and p_data ? 'diligence_allow' then nullif(p_data->>'diligence_allow','')::numeric else diligence_allow end,
      phone_allow     = case when c.can_salary and p_data ? 'phone_allow' then nullif(p_data->>'phone_allow','')::numeric else phone_allow end,
      travel_allow    = case when c.can_salary and p_data ? 'travel_allow' then nullif(p_data->>'travel_allow','')::numeric else travel_allow end,
      fuel_allow      = case when c.can_salary and p_data ? 'fuel_allow' then nullif(p_data->>'fuel_allow','')::numeric else fuel_allow end,
      bank_name         = case when c.can_salary and p_data ? 'bank_name' then nullif(btrim(p_data->>'bank_name'),'') else bank_name end,
      bank_branch       = case when c.can_salary and p_data ? 'bank_branch' then nullif(btrim(p_data->>'bank_branch'),'') else bank_branch end,
      bank_account      = case when c.can_salary and p_data ? 'bank_account' then nullif(btrim(p_data->>'bank_account'),'') else bank_account end,
      bank_account_name = case when c.can_salary and p_data ? 'bank_account_name' then nullif(btrim(p_data->>'bank_account_name'),'') else bank_account_name end,
      updated_at = now()
     where employees.id = p_id;
    v_id := p_id;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role,
         case when p_id is null then 'EMP_ADD' else 'EMP_EDIT' end,
         'employee', 'employees', v_id::text,
         'พนักงาน ' || e.emp_code || ' ' || e.first_name || ' ' || coalesce(e.last_name,''),
         oldrow, to_jsonb(e)
    from public.employees e where e.id = v_id;

  return query select e.id, e.emp_code, (e.first_name || ' ' || coalesce(e.last_name,''))
                 from public.employees e where e.id = v_id;
end $$;


-- ─── 5) เปลี่ยนสถานะ / ลาออก (ไม่ลบข้อมูลจริง) ───────────────
create or replace function public.njhr_emp_status(
  p_token text, p_id uuid, p_status text, p_resign_date date default null, p_note text default null)
returns table (id uuid, status text, resign_date date)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb; v_st text := upper(btrim(coalesce(p_status,'')));
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if not exists (select 1 from unnest(enum_range(null::public.emp_status)) s where s::text = v_st) then
    raise exception 'สถานะพนักงานไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;
  select to_jsonb(e) into oldrow from public.employees e where e.id = p_id;
  if oldrow is null then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
  if v_st = 'RESIGNED' and p_resign_date is null then
    raise exception 'กรุณาระบุวันที่ลาออก' using errcode='22023';
  end if;
  if v_st = 'RESIGNED' and p_resign_date < (oldrow->>'start_date')::date then
    raise exception 'วันที่ลาออกต้องไม่ก่อนวันที่เริ่มงาน' using errcode='22023';
  end if;

  update public.employees set
    status = v_st::public.emp_status,
    resign_date = case when v_st = 'RESIGNED' then p_resign_date else null end,
    updated_at = now()
   where employees.id = p_id;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role, 'EMP_STATUS', 'employee', 'employees', p_id::text,
         'เปลี่ยนสถานะเป็น ' || v_st || coalesce(' · ' || nullif(btrim(coalesce(p_note,'')),''), ''),
         oldrow, to_jsonb(e)
    from public.employees e where e.id = p_id;

  return query select e.id, e.status::text, e.resign_date from public.employees e where e.id = p_id;
end $$;


-- ─── 6) สิทธิ์เรียกใช้ ───────────────────────────────────────
revoke all on function public.njhr_emp_guard(text,boolean) from public, anon, authenticated;

grant execute on function public.njhr_emp_departments(text)                          to anon, authenticated;
grant execute on function public.njhr_emp_list(text,text,text,text,text,boolean,int,int) to anon, authenticated;
grant execute on function public.njhr_emp_get(text,uuid)                             to anon, authenticated;
grant execute on function public.njhr_emp_save(text,uuid,jsonb)                      to anon, authenticated;
grant execute on function public.njhr_emp_status(text,uuid,text,date,text)           to anon, authenticated;


-- ─── 7) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_emp\_%'),
  'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
               where schemaname='public' and indexname like 'njhr\_emp\_%'),
  'emp_status_values', (select jsonb_agg(e.enumlabel order by e.enumsortorder)
                          from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname='emp_status'),
  'employees_untouched', (select count(*) from public.employees),
  'departments', (select count(*) from public.departments)
)) as install_report;


-- ─── 8) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_emp_status(text,uuid,text,date,text);
-- drop function if exists public.njhr_emp_save(text,uuid,jsonb);
-- drop function if exists public.njhr_emp_get(text,uuid);
-- drop function if exists public.njhr_emp_list(text,text,text,text,text,boolean,int,int);
-- drop function if exists public.njhr_emp_departments(text);
-- drop function if exists public.njhr_emp_guard(text,boolean);
-- drop index if exists public.njhr_emp_code_idx;
-- drop index if exists public.njhr_emp_dept_idx;
-- drop index if exists public.njhr_emp_status_idx;
-- delete from public.njhr_schema_version where version = 'v10.8-employees';
