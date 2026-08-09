-- ============================================================
-- NJ HR V.10 — 49_emp_import.sql
-- นำเข้าพนักงานจาก Excel: ตรวจสอบก่อน (Dry Run) → ยืนยัน → บันทึกเป็นชุดเดียว
--
-- ใช้ตาราง employees / departments เดิม · ไม่สร้างตารางใหม่
-- ต้องรัน 48_employees.sql มาก่อน · รันซ้ำได้
--
-- แนวคิด:
--   p_dry_run = true  → ตรวจอย่างเดียว ไม่เขียนอะไรเลย (ใช้ทำหน้า Preview)
--   p_dry_run = false → บันทึกจริง "ไม่หยุดกลางคัน ไม่ Rollback"
--                       แถวที่ข้อมูลบังคับครบ จะถูกนำเข้าเสมอ
--                       ฟิลด์ที่ตรวจไม่ผ่าน (แผนกไม่พบ / รูปแบบผิด / ซ้ำ) จะถูกปล่อยว่าง
--                       แล้วรายงานกลับให้ผู้ใช้ไปแก้ภายหลัง
--   แถวที่ถูกปฏิเสธมีเฉพาะกรณีข้อมูลบังคับผิด: รหัสพนักงาน · ชื่อ · นามสกุล · วันที่เริ่มงาน
--   p_mode: SKIP   = รหัสพนักงานซ้ำให้ข้ามแถวนั้น
--           UPDATE = รหัสพนักงานซ้ำให้อัปเดตข้อมูลเดิม
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

insert into public.njhr_schema_version(version, note)
values ('v10.9-emp-import', 'นำเข้าพนักงานจาก Excel (ไม่หยุดกลางคัน · ฟิลด์ผิดปล่อยว่าง)')
on conflict (version) do nothing;


-- ─── 1) RPC นำเข้า ───────────────────────────────────────────
drop function if exists public.njhr_emp_import(text, jsonb, text, boolean);
create or replace function public.njhr_emp_import(
  p_token text, p_rows jsonb, p_mode text default 'SKIP', p_dry_run boolean default true)
returns table (row_no int, emp_code text, full_name text, action text, message text, warnings text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  c record; r jsonb; i int := 0; v_mode text := upper(coalesce(p_mode,'SKIP'));
  v_code text; v_nid text; v_mail text; v_dept uuid; v_deptname text;
  v_exist uuid; v_err text; v_act text; v_id uuid;
  n_ok int := 0; n_skip int := 0; n_upd int := 0; n_err int := 0;
  seen_code text[] := '{}'; seen_nid text[] := '{}'; seen_mail text[] := '{}'; v_fld text;
  v_warn text[]; n_warn int := 0;                    -- ฟิลด์ที่ถูกปล่อยว่างในแถวนั้น
  v_bdate date; v_status public.emp_status; v_sal numeric; v_pos numeric; v_fuel numeric; v_phone numeric;
  v_wstart time; v_wend time; v_sick int; v_pers int; v_vac int;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  if v_mode not in ('SKIP','UPDATE') then
    raise exception 'โหมดนำเข้าไม่ถูกต้อง (%)', p_mode using errcode='22023';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'ไม่พบข้อมูลที่จะนำเข้า' using errcode='22023';
  end if;
  if jsonb_array_length(p_rows) = 0 then
    raise exception 'ไฟล์ไม่มีข้อมูลพนักงาน' using errcode='22023';
  end if;
  if jsonb_array_length(p_rows) > 2000 then
    raise exception 'นำเข้าได้ครั้งละไม่เกิน 2,000 แถว (พบ % แถว)', jsonb_array_length(p_rows) using errcode='22023';
  end if;

  create temp table if not exists njhr_imp_tmp (
    row_no int, emp_code text, full_name text, action text, message text, warnings text) on commit drop;
  -- Supabase เปิด pg_safeupdate ไว้ DELETE/UPDATE ที่ไม่มี WHERE จะถูกบล็อก
  delete from njhr_imp_tmp where true;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_err := null; v_act := null; v_exist := null; v_warn := '{}';
    v_bdate := null; v_status := null;
    v_sal := null; v_pos := null; v_fuel := null; v_phone := null;
    v_wstart := null; v_wend := null; v_sick := null; v_pers := null; v_vac := null;
    v_code := upper(btrim(coalesce(r->>'emp_code','')));
    v_nid  := btrim(coalesce(r->>'national_id',''));
    v_mail := lower(btrim(coalesce(r->>'email','')));
    v_deptname := btrim(coalesce(r->>'department_name',''));

    -- ═══ ข้อมูลบังคับ: ผิดที่นี่เท่านั้นที่ปฏิเสธทั้งแถว ═══
    if v_code = '' then v_err := 'ไม่มีรหัสพนักงาน';
    elsif coalesce(btrim(r->>'first_name'),'') = '' then v_err := 'ไม่มีชื่อ';
    elsif coalesce(btrim(r->>'last_name'),'') = '' then v_err := 'ไม่มีนามสกุล';
    elsif coalesce(r->>'start_date','') = '' then v_err := 'ไม่มีวันที่เริ่มงาน';
    elsif (r->>'start_date') !~ '^\d{4}-\d{2}-\d{2}$' then
      v_err := 'วันที่เริ่มงานต้องเป็นรูปแบบ YYYY-MM-DD';
    else
      begin perform (r->>'start_date')::date;
      exception when others then v_err := 'วันที่เริ่มงานไม่ถูกต้อง'; end;
    end if;
    if v_err is null and v_code = any(seen_code) then v_err := 'รหัสพนักงานซ้ำกันภายในไฟล์'; end if;

    if v_err is not null then
      n_err := n_err + 1;
      insert into njhr_imp_tmp values (i, v_code,
        btrim(coalesce(r->>'first_name','')) || ' ' || btrim(coalesce(r->>'last_name','')),
        'ERROR', v_err, null);
      continue;
    end if;

    -- ═══ ฟิลด์อื่น: ผิดแล้วปล่อยว่าง ไม่ทิ้งทั้งแถว ═══
    select e.id into v_exist from public.employees e where upper(e.emp_code) = v_code;

    -- วันเกิด
    if coalesce(r->>'birth_date','') <> '' then
      if (r->>'birth_date') !~ '^\d{4}-\d{2}-\d{2}$' then
        v_warn := array_append(v_warn, 'วันเกิด (รูปแบบต้องเป็น YYYY-MM-DD)');
      else
        begin v_bdate := (r->>'birth_date')::date;
        exception when others then v_bdate := null; v_warn := array_append(v_warn, 'วันเกิด (วันที่ไม่ถูกต้อง)'); end;
      end if;
    end if;

    -- เลขบัตรประชาชน: รูปแบบผิด หรือซ้ำ → ปล่อยว่าง
    if v_nid <> '' then
      if v_nid !~ '^[0-9]{13}$' then
        v_warn := array_append(v_warn, 'เลขบัตรประชาชน (ต้องเป็นตัวเลข 13 หลัก)'); v_nid := '';
      elsif v_nid = any(seen_nid) then
        v_warn := array_append(v_warn, 'เลขบัตรประชาชน (ซ้ำกันภายในไฟล์)'); v_nid := '';
      elsif exists (select 1 from public.employees e
                     where e.national_id = v_nid and (v_exist is null or e.id <> v_exist)) then
        v_warn := array_append(v_warn, 'เลขบัตรประชาชน (ซ้ำกับพนักงานคนอื่นในระบบ)'); v_nid := '';
      end if;
    end if;

    -- อีเมล: รูปแบบผิด หรือซ้ำ → ปล่อยว่าง
    if v_mail <> '' then
      if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        v_warn := array_append(v_warn, 'อีเมล (รูปแบบไม่ถูกต้อง)'); v_mail := '';
      elsif v_mail = any(seen_mail) then
        v_warn := array_append(v_warn, 'อีเมล (ซ้ำกันภายในไฟล์)'); v_mail := '';
      elsif exists (select 1 from public.employees e
                     where lower(e.email) = v_mail and (v_exist is null or e.id <> v_exist)) then
        v_warn := array_append(v_warn, 'อีเมล (ซ้ำกับพนักงานคนอื่นในระบบ)'); v_mail := '';
      end if;
    end if;

    -- แผนก: ไม่พบในระบบ → ปล่อยว่างทั้ง id และชื่อ
    v_dept := null;
    if v_deptname <> '' then
      select d.id into v_dept from public.departments d where lower(d.name) = lower(v_deptname);
      if v_dept is null then
        v_warn := array_append(v_warn, 'แผนก "' || v_deptname || '" (ไม่พบในระบบ)');
        v_deptname := '';
      end if;
    end if;

    -- สถานะพนักงาน: ค่าไม่ถูกต้อง → ใช้ ACTIVE
    if coalesce(btrim(r->>'status'),'') <> '' then
      begin v_status := upper(btrim(r->>'status'))::public.emp_status;
      exception when others then
        v_status := null; v_warn := array_append(v_warn, 'สถานะ "' || btrim(r->>'status') || '" (ไม่ถูกต้อง ใช้ ACTIVE แทน)');
      end;
    end if;

    -- ค่าตอบแทน: ไม่ใช่ตัวเลขหรือติดลบ → 0 · ไม่มีสิทธิ์เงินเดือน → ปล่อยว่าง
    if not c.can_salary then
      if coalesce(r->>'base_salary','') <> '' or coalesce(r->>'position_allow','') <> ''
         or coalesce(r->>'fuel_allow','') <> '' or coalesce(r->>'phone_allow','') <> ''
         or coalesce(btrim(r->>'bank_account'),'') <> '' then
        v_warn := array_append(v_warn, 'ข้อมูลเงินเดือนและบัญชีธนาคาร (คุณไม่มีสิทธิ์นำเข้า)');
      end if;
    else
      foreach v_fld in array array['base_salary','position_allow','fuel_allow','phone_allow'] loop
        if coalesce(r->>v_fld,'') <> '' then
          begin
            if (r->>v_fld)::numeric < 0 then
              v_warn := array_append(v_warn, v_fld || ' (ค่าติดลบ — ไม่นำเข้าช่องนี้)');
            else
              case v_fld
                when 'base_salary'    then v_sal   := (r->>v_fld)::numeric;
                when 'position_allow' then v_pos   := (r->>v_fld)::numeric;
                when 'fuel_allow'     then v_fuel  := (r->>v_fld)::numeric;
                when 'phone_allow'    then v_phone := (r->>v_fld)::numeric;
              end case;
            end if;
          exception when others then
            v_warn := array_append(v_warn, v_fld || ' (ไม่ใช่ตัวเลข — ไม่นำเข้าช่องนี้)');
          end;
        end if;
      end loop;
    end if;

    -- เวลาเข้า-ออกงาน: รูปแบบผิด → ใช้ค่าเริ่มต้นของระบบ
    if coalesce(r->>'work_start','') <> '' then
      begin v_wstart := (r->>'work_start')::time;
      exception when others then v_warn := array_append(v_warn, 'เวลาเข้างาน (รูปแบบไม่ถูกต้อง ใช้ 08:30)'); end;
    end if;
    if coalesce(r->>'work_end','') <> '' then
      begin v_wend := (r->>'work_end')::time;
      exception when others then v_warn := array_append(v_warn, 'เวลาเลิกงาน (รูปแบบไม่ถูกต้อง ใช้ 17:30)'); end;
    end if;

    -- วันลา: ไม่ใช่ตัวเลข → ใช้ค่าเริ่มต้น
    begin v_sick := nullif(r->>'leave_sick','')::int;
    exception when others then v_warn := array_append(v_warn, 'ลาป่วย (ไม่ใช่ตัวเลข ใช้ค่าเริ่มต้น)'); end;
    begin v_pers := nullif(r->>'leave_personal','')::int;
    exception when others then v_warn := array_append(v_warn, 'ลากิจ (ไม่ใช่ตัวเลข ใช้ค่าเริ่มต้น)'); end;
    begin v_vac := nullif(r->>'leave_vacation','')::int;
    exception when others then v_warn := array_append(v_warn, 'ลาพักร้อน (ไม่ใช่ตัวเลข ใช้ค่าเริ่มต้น)'); end;

    seen_code := seen_code || v_code;
    if v_nid <> '' then seen_nid := seen_nid || v_nid; end if;
    if v_mail <> '' then seen_mail := seen_mail || v_mail; end if;

    if v_exist is not null and v_mode = 'SKIP' then
      n_skip := n_skip + 1;
      insert into njhr_imp_tmp values (i, v_code,
        btrim(coalesce(r->>'first_name','')) || ' ' || btrim(coalesce(r->>'last_name','')),
        'SKIP', 'มีรหัสพนักงานนี้อยู่แล้ว — ข้ามตามโหมดที่เลือก', null);
      continue;
    end if;
    v_act := case when v_exist is null then 'INSERT' else 'UPDATE' end;

    -- ---- บันทึกจริง (ข้ามเมื่อเป็น Dry Run)
    if not p_dry_run then
      if v_exist is null then
        insert into public.employees (
          emp_code, prefix, first_name, last_name, nickname, gender, birth_date, national_id,
          phone, email, address, department_id, department_name, position_name, level,
          start_date, status, emp_type, salary_type, payment_method, work_start, work_end,
          leave_sick, leave_personal, leave_vacation, base_salary,
          position_allow, fuel_allow, phone_allow,
          bank_name, bank_branch, bank_account, bank_account_name)
        values (
          v_code, nullif(btrim(coalesce(r->>'prefix','')),''),
          btrim(r->>'first_name'), btrim(r->>'last_name'),
          nullif(btrim(coalesce(r->>'nickname','')),''), nullif(btrim(coalesce(r->>'gender','')),''),
          v_bdate, nullif(v_nid,''),
          nullif(btrim(coalesce(r->>'phone','')),''), nullif(v_mail,''),
          nullif(btrim(coalesce(r->>'address','')),''), v_dept, nullif(v_deptname,''),
          nullif(btrim(coalesce(r->>'position_name','')),''), nullif(btrim(coalesce(r->>'level','')),''),
          (r->>'start_date')::date,
          coalesce(v_status, 'ACTIVE'),
          nullif(btrim(coalesce(r->>'emp_type','')),''),
          coalesce(nullif(btrim(coalesce(r->>'salary_type','')),''),'MONTHLY'),
          coalesce(nullif(btrim(coalesce(r->>'payment_method','')),''),'BANK'),
          coalesce(v_wstart,'08:30'), coalesce(v_wend,'17:30'),
          coalesce(v_sick, 30), coalesce(v_pers, 10), coalesce(v_vac, 6),
          case when c.can_salary then coalesce(v_sal, 0) else 0 end,
          case when c.can_salary then coalesce(v_pos, 0) else 0 end,
          case when c.can_salary then coalesce(v_fuel, 0) else 0 end,
          case when c.can_salary then coalesce(v_phone, 0) else 0 end,
          case when c.can_salary then nullif(btrim(coalesce(r->>'bank_name','')),'') end,
          case when c.can_salary then nullif(btrim(coalesce(r->>'bank_branch','')),'') end,
          case when c.can_salary then nullif(btrim(coalesce(r->>'bank_account','')),'') end,
          case when c.can_salary then nullif(btrim(coalesce(r->>'bank_account_name','')),'') end)
        returning employees.id into v_id;
        n_ok := n_ok + 1;
      else
        update public.employees set
          prefix        = coalesce(nullif(btrim(coalesce(r->>'prefix','')),''), prefix),
          first_name    = btrim(r->>'first_name'),
          last_name     = btrim(r->>'last_name'),
          nickname      = coalesce(nullif(btrim(coalesce(r->>'nickname','')),''), nickname),
          gender        = coalesce(nullif(btrim(coalesce(r->>'gender','')),''), gender),
          birth_date    = coalesce(v_bdate, birth_date),
          national_id   = coalesce(nullif(v_nid,''), national_id),
          phone         = coalesce(nullif(btrim(coalesce(r->>'phone','')),''), phone),
          email         = coalesce(nullif(v_mail,''), email),
          address       = coalesce(nullif(btrim(coalesce(r->>'address','')),''), address),
          department_id = coalesce(v_dept, department_id),
          department_name = coalesce(nullif(v_deptname,''), department_name),
          position_name = coalesce(nullif(btrim(coalesce(r->>'position_name','')),''), position_name),
          level         = coalesce(nullif(btrim(coalesce(r->>'level','')),''), level),
          start_date    = coalesce(nullif(r->>'start_date','')::date, start_date),
          status        = coalesce(v_status, status),
          emp_type      = coalesce(nullif(btrim(coalesce(r->>'emp_type','')),''), emp_type),
          work_start    = coalesce(v_wstart, work_start),
          work_end      = coalesce(v_wend, work_end),
          leave_sick    = coalesce(v_sick, leave_sick),
          leave_personal= coalesce(v_pers, leave_personal),
          leave_vacation= coalesce(v_vac, leave_vacation),
          base_salary   = case when c.can_salary then coalesce(v_sal, base_salary) else base_salary end,
          position_allow= case when c.can_salary then coalesce(v_pos, position_allow) else position_allow end,
          fuel_allow    = case when c.can_salary then coalesce(v_fuel, fuel_allow) else fuel_allow end,
          phone_allow   = case when c.can_salary then coalesce(v_phone, phone_allow) else phone_allow end,
          bank_name     = case when c.can_salary then coalesce(nullif(btrim(coalesce(r->>'bank_name','')),''), bank_name) else bank_name end,
          bank_branch   = case when c.can_salary then coalesce(nullif(btrim(coalesce(r->>'bank_branch','')),''), bank_branch) else bank_branch end,
          bank_account  = case when c.can_salary then coalesce(nullif(btrim(coalesce(r->>'bank_account','')),''), bank_account) else bank_account end,
          bank_account_name = case when c.can_salary then coalesce(nullif(btrim(coalesce(r->>'bank_account_name','')),''), bank_account_name) else bank_account_name end,
          updated_at = now()
         where employees.id = v_exist;
        v_id := v_exist;
        n_upd := n_upd + 1;
      end if;
    else
      if v_act = 'INSERT' then n_ok := n_ok + 1; else n_upd := n_upd + 1; end if;
    end if;

    if array_length(v_warn,1) > 0 then n_warn := n_warn + 1; end if;
    insert into njhr_imp_tmp values (i, v_code,
      btrim(r->>'first_name') || ' ' || btrim(r->>'last_name'), v_act,
      (case when v_act = 'INSERT' then 'เพิ่มใหม่' else 'อัปเดตข้อมูลเดิม' end) ||
      case when array_length(v_warn,1) > 0
           then ' · ปล่อยว่าง ' || array_length(v_warn,1) || ' ช่อง' else '' end,
      nullif(array_to_string(v_warn, ' · '), ''));
  end loop;

  -- ไม่ยกเลิกทั้งชุดและไม่ Rollback: แถวที่ข้อมูลบังคับครบถูกนำเข้าเสมอ
  -- แถวที่ถูกปฏิเสธมีเฉพาะกรณีข้อมูลบังคับผิด และรายงานกลับให้ผู้ใช้แก้ภายหลัง

  if not p_dry_run then
    perform public.njhr_audit_write(p_token, 'EMP_IMPORT', 'employee', 'employees', null,
      'นำเข้าพนักงานจาก Excel: เพิ่มใหม่ ' || n_ok || ' · อัปเดต ' || n_upd ||
      ' · ข้าม ' || n_skip || ' · ปฏิเสธ ' || n_err || ' · มีช่องที่ปล่อยว่าง ' || n_warn ||
      ' แถว · โหมด ' || v_mode, null, null, null);
  end if;

  return query select t.row_no, t.emp_code, t.full_name, t.action, t.message, t.warnings
                 from njhr_imp_tmp t order by t.row_no;
end $$;

grant execute on function public.njhr_emp_import(text,jsonb,text,boolean) to anon, authenticated;


-- ─── 2) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function', (select pg_get_function_arguments(p.oid) from pg_proc p
                 join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='njhr_emp_import'),
  'employees_untouched', (select count(*) from public.employees)
)) as install_report;


-- ─── 3) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_emp_import(text,jsonb,text,boolean);
-- delete from public.njhr_schema_version where version = 'v10.9-emp-import';
