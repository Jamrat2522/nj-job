-- ============================================================
-- NJ HR V2 — K2_shift_membership.sql
-- นำออกจากกะ · ย้ายกะ · สถานะ "ไม่ใช้กะ"  บนตารางจริง employee_shifts
--
-- ยืนยันจากผล K1b (ฐานข้อมูลจริง) ก่อนเขียนไฟล์นี้:
--   employee_shifts : id · employee_id · shift_id(NULL ได้) · effective_date(date, default CURRENT_DATE)
--                     status(text, default 'ACTIVE') · created_at · assigned_by · assigned_at
--   Constraint      : PK(id) · FK employee_id→employees(CASCADE) · FK shift_id→work_shifts(CASCADE)
--                     ไม่มี CHECK บน status  → เพิ่มค่าใหม่ได้
--   Unique          : njhr_empshift_uidx (employee_id, effective_date) WHERE ทั้งคู่ NOT NULL
--   Index           : njhr_empshift_emp_idx (employee_id, effective_date DESC)
--   ค่า status ที่มีอยู่ : ACTIVE เท่านั้น (109 แถว · 106 คน)
--   ฟังก์ชันที่อ่านตารางนี้ : 6 ตัว (ทั้งหมดอยู่ในไฟล์ 76_shift_rpc.sql / 51_core_schema.sql)
--
-- สิ่งที่ไฟล์นี้ทำ
--   · ไม่แก้ Schema · ไม่สร้างตารางใหม่ · ไม่ UPDATE / DELETE แถวเดิมแม้แถวเดียว
--   · เปลี่ยนวิธี "อ่าน" ประวัติของ 6 ฟังก์ชันเดิม จาก
--       กรอง status='ACTIVE' ก่อน → เอาแถวล่าสุด        (แบบเดิม · แถวปิดช่วงถูกข้าม)
--     เป็น
--       เอาแถวล่าสุดที่ effective_date <= วันที่ถาม ก่อน → ค่อยดู status/shift_id
--   · เพิ่ม RPC ใหม่ 4 ตัวที่ทำงานแบบ Batch
--
-- สถานะสมาชิกกะ (เก็บเป็นแถวใหม่เสมอ ไม่ทับของเก่า)
--   อยู่ในกะ                      shift_id = <กะ>  · status = 'ACTIVE'
--   นำออกจากกะ แต่ยังต้องใช้กะ    shift_id = NULL  · status = 'REMOVED'
--   ไม่ใช้กะ                      shift_id = NULL  · status = 'NO_SHIFT'
--
-- ต้องรัน 42 · 51 · 76 มาก่อน · รันซ้ำได้ (idempotent)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 0) PREFLIGHT — ตรวจก่อน ถ้าไม่ผ่านให้หยุดทันที ยังไม่แตะฟังก์ชันใด
--    ทั้งไฟล์รันเป็น Transaction เดียวใน SQL Editor อยู่แล้ว
--    RAISE EXCEPTION จึง Rollback ทุกอย่าง ไม่มีการแก้ครึ่ง ๆ กลาง ๆ
-- ════════════════════════════════════════════════════════════
do $$
declare miss text; act text; bad text; n int;
begin
  ---- 0.1 ตารางต้องมีจริง
  if to_regclass('public.employee_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employee_shifts';
  end if;
  if to_regclass('public.work_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง work_shifts';
  end if;

  ---- 0.2 คอลัมน์ที่ไฟล์นี้ใช้ต้องมีครบ
  select string_agg(c, ', ') into miss from unnest(array[
    'id','employee_id','shift_id','effective_date','status','assigned_by','assigned_at']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='employee_shifts'
                        and column_name = c);
  if miss is not null then
    select string_agg(column_name, ', ' order by ordinal_position) into act
      from information_schema.columns
     where table_schema='public' and table_name='employee_shifts';
    raise exception 'PREFLIGHT: employee_shifts ขาดคอลัมน์ [%] · คอลัมน์จริงคือ [%]', miss, act;
  end if;

  ---- 0.3 shift_id ต้องรับ NULL ได้จริง (หัวใจของ REMOVED / NO_SHIFT)
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='employee_shifts'
                and column_name='shift_id' and is_nullable='NO') then
    raise exception 'PREFLIGHT: employee_shifts.shift_id เป็น NOT NULL — ใส่แถวนำออกจากกะไม่ได้ หยุดก่อน';
  end if;

  ---- 0.4 effective_date ต้องเป็นชนิด date
  select data_type into act from information_schema.columns
   where table_schema='public' and table_name='employee_shifts' and column_name='effective_date';
  if act is distinct from 'date' then
    raise exception 'PREFLIGHT: effective_date ชนิด % ไม่ใช่ date', coalesce(act,'(ไม่พบ)');
  end if;

  ---- 0.5 status ต้องเป็น text และต้องไม่มี CHECK ที่กัน REMOVED / NO_SHIFT
  select data_type into act from information_schema.columns
   where table_schema='public' and table_name='employee_shifts' and column_name='status';
  if act is distinct from 'text' then
    raise exception 'PREFLIGHT: employee_shifts.status ชนิด % ไม่ใช่ text', coalesce(act,'(ไม่พบ)');
  end if;

  select string_agg(con.conname || ' : ' || pg_get_constraintdef(con.oid), ' | ') into bad
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
   where ns.nspname='public' and rel.relname='employee_shifts' and con.contype='c'
     and pg_get_constraintdef(con.oid) ilike '%status%';
  if bad is not null then
    raise exception 'PREFLIGHT: มี CHECK constraint บน status อาจกันค่า REMOVED/NO_SHIFT — ตรวจก่อน [%]', bad;
  end if;

  ---- 0.6 ทดสอบ INSERT แถว shift_id = NULL จริง แล้ว Rollback ทิ้งทันที
  ----      ครอบคลุม Trigger / Rule / RLS ที่อาจกันไว้โดยไม่ปรากฏใน constraint
  begin
    insert into public.employee_shifts(employee_id, shift_id, effective_date, status, assigned_by)
    values ((select id from public.employees limit 1), null, date '1900-01-01',
            'PREFLIGHT_PROBE', 'preflight');
    delete from public.employee_shifts
     where status = 'PREFLIGHT_PROBE' and effective_date = date '1900-01-01';
  exception when others then
    raise exception 'PREFLIGHT: INSERT แถว shift_id = NULL ไม่สำเร็จ (%) — หยุดก่อน', sqlerrm;
  end;

  ---- 0.7 ฟังก์ชันเดิมทั้ง 6 ตัวต้องมีจริง และ Signature ต้องตรงกับที่ไฟล์นี้จะแทนที่
  ----      ถ้าไม่ตรง แปลว่า Source ในฐานข้อมูลไม่ใช่รุ่นที่ตรวจไว้ ห้ามเขียนทับ
  select string_agg(x, E'\n  ') into miss from (
    select v.sig as x from (values
      ('njhr_shift_at',                 'p_employee uuid, p_date date'),
      ('njhr_shift_list',               'p_token text, p_include_inactive boolean'),
      ('njhr_shift_employee_list',      'p_token text, p_shift uuid'),
      ('njhr_shift_unassigned_employees','p_token text, p_q text, p_limit integer'),
      ('njhr_shift_assign',             'p_token text, p_employee uuid, p_shift uuid, p_effective_date date'),
      ('njhr_shift_set_active',         'p_token text, p_id uuid, p_active boolean, p_force boolean')
    ) as v(fname, sig)
    where not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname='public' and p.prokind='f' and p.proname = v.fname
         and pg_get_function_identity_arguments(p.oid) = v.sig)
  ) t;
  if miss is not null then
    raise exception E'PREFLIGHT: ฟังก์ชันเดิม Signature ไม่ตรงกับที่ตรวจไว้\n  %', miss;
  end if;

  ---- 0.8 ฟังก์ชันช่วยที่ไฟล์นี้เรียกใช้ต้องมีจริง
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_shift_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_shift_guard';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write';
  end if;

  ---- 0.9 บันทึกจำนวนแถวก่อนแก้ ไว้เทียบท้ายไฟล์ (Case F)
  select count(*) into n from public.employee_shifts;
  create temporary table if not exists njhr_k2_before(rows_before bigint, hash_before text) on commit drop;
  delete from njhr_k2_before;
  insert into njhr_k2_before
  select n, md5(coalesce(string_agg(t.line, '|' order by t.line), ''))
    from (select es.id::text || ':' || coalesce(es.employee_id::text,'-') || ':' ||
                 coalesce(es.shift_id::text,'-') || ':' || coalesce(es.effective_date::text,'-') || ':' ||
                 coalesce(es.status,'-') as line
            from public.employee_shifts es) t;

  raise notice 'PREFLIGHT ผ่าน · employee_shifts % แถว · พร้อมแทนที่ฟังก์ชัน 6 ตัว', n;
end $$;


-- ════════════════════════════════════════════════════════════
-- 1) ตัวช่วยกลาง — สถานะสมาชิกกะ ณ วันที่ระบุ
--    "เอาแถวล่าสุดที่ effective_date <= วันที่ถาม ก่อน แล้วค่อยดู status"
--    ทุกฟังก์ชันด้านล่างใช้ตัวนี้ตัวเดียว จะได้ไม่มีตรรกะ 2 ชุดที่เพี้ยนกันได้
--    หมายเหตุ: แถวที่ effective_date เป็น NULL ถือว่ามีผลตลอด (พฤติกรรมเดิมของ njhr_shift_at)
-- ════════════════════════════════════════════════════════════
create or replace function public.njhr_shift_state_at(p_employee uuid, p_date date)
returns table (shift_id uuid, status text, effective_date date)
language sql stable security definer set search_path = public as $$
  select es.shift_id,
         coalesce(es.status, 'ACTIVE'),
         es.effective_date
    from public.employee_shifts es
   where es.employee_id = p_employee
     and (es.effective_date is null or es.effective_date <= p_date)
   order by es.effective_date desc nulls last, es.assigned_at desc nulls last
   limit 1;
$$;
revoke all on function public.njhr_shift_state_at(uuid, date) from public, anon, authenticated;
comment on function public.njhr_shift_state_at(uuid, date) is
  'สถานะสมาชิกกะ ณ วันที่ระบุ — แถวล่าสุดก่อน แล้วค่อยดู status (ACTIVE / REMOVED / NO_SHIFT)';


-- ════════════════════════════════════════════════════════════
-- 2) แก้ฟังก์ชันเดิม 6 ตัว
--    เปลี่ยนเฉพาะวิธีอ่านประวัติ · Parameter · Return type · SECURITY · search_path เดิมทุกตัว
-- ════════════════════════════════════════════════════════════

-- ─── 2.1 njhr_shift_at ─────────────────────────────────────
--  เดิม: where status='ACTIVE' ... order by effective_date desc limit 1
--  ใหม่: เอาแถวล่าสุดก่อน แล้วคืนค่าเฉพาะตอนที่แถวนั้นเป็น ACTIVE และมี shift_id
--  ผลกับข้อมูลปัจจุบัน (ทุกแถวเป็น ACTIVE + มี shift_id) = เหมือนเดิมทุกกรณี
create or replace function public.njhr_shift_at(p_employee uuid, p_date date)
returns table (shift_id uuid, shift_name text, start_time time, end_time time,
               break_minutes int, late_allow_minutes int, ot_start_after time,
               working_days text, is_overnight boolean, effective_date date)
language sql stable security definer set search_path = public as $$
  select w.id, w.shift_name, w.start_time, w.end_time,
         coalesce(w.break_minutes,0), coalesce(w.late_allow_minutes,0), w.ot_start_after,
         w.working_days, w.is_overnight, st.effective_date
    from public.njhr_shift_state_at(p_employee, p_date) st
    join public.work_shifts w on w.id = st.shift_id
   where st.status = 'ACTIVE' and st.shift_id is not null;
$$;
revoke all on function public.njhr_shift_at(uuid, date) from public, anon, authenticated;
comment on function public.njhr_shift_at(uuid, date) is
  'กะที่มีผลกับพนักงาน ณ วันที่ระบุ — ใช้แทนการอ่านกะปัจจุบัน เพื่อให้รายงานย้อนหลังคงที่';


-- ─── 2.2 njhr_shift_list ───────────────────────────────────
--  employee_count = นับเฉพาะคนที่สถานะล่าสุด ณ วันนี้เป็น ACTIVE ของกะนั้น
create or replace function public.njhr_shift_list(
  p_token text, p_include_inactive boolean default true)
returns table (
  id uuid, shift_name text, start_time time, end_time time,
  break_minutes int, late_allow_minutes int, ot_start_after time,
  working_days text, is_overnight boolean, is_active boolean,
  employee_count bigint, updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  with cur as (
    select e.id as employee_id, st.shift_id, st.status
      from public.employees e
      cross join lateral public.njhr_shift_state_at(e.id, current_date) st
     where e.status::text in ('ACTIVE','PROBATION'))
  select w.id, w.shift_name, w.start_time, w.end_time,
         coalesce(w.break_minutes,0), coalesce(w.late_allow_minutes,0), w.ot_start_after,
         w.working_days, w.is_overnight, w.is_active,
         (select count(*) from cur
           where cur.shift_id = w.id and cur.status = 'ACTIVE'),
         w.updated_at, w.updated_by
    from public.work_shifts w
   where (coalesce(p_include_inactive,true) or w.is_active)
   order by w.is_active desc, w.start_time, w.shift_name;
end $$;


-- ─── 2.3 njhr_shift_employee_list ──────────────────────────
create or replace function public.njhr_shift_employee_list(p_token text, p_shift uuid)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text, effective_date date)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text, st.effective_date
    from public.employees e
    cross join lateral public.njhr_shift_state_at(e.id, current_date) st
   where st.shift_id = p_shift
     and st.status = 'ACTIVE'
     and e.status::text in ('ACTIVE','PROBATION')
   order by e.emp_code;
end $$;


-- ─── 2.4 njhr_shift_unassigned_employees ───────────────────
--  "ยังไม่ได้กำหนดกะ" = พนักงานที่ต้องใช้กะ แต่สถานะล่าสุดไม่ใช่ ACTIVE
--    ครอบคลุม: ไม่มีประวัติเลย · REMOVED · แถว ACTIVE ที่ shift_id เป็น NULL (ข้อมูลผิดรูป)
--  ไม่รวม NO_SHIFT ตามที่กำหนด
create or replace function public.njhr_shift_unassigned_employees(
  p_token text, p_q text default null, p_limit int default 200)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,200),1),1000);
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text
    from public.employees e
    left join lateral public.njhr_shift_state_at(e.id, current_date) st on true
   where e.status::text in ('ACTIVE','PROBATION')
     and coalesce(st.status, 'NONE') <> 'NO_SHIFT'
     and (st.shift_id is null or coalesce(st.status,'NONE') <> 'ACTIVE')
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit lim;
end $$;


-- ─── 2.5 njhr_shift_assign ─────────────────────────────────
--  Contract เดิมทุกอย่าง · เปลี่ยนเฉพาะการเช็ค "เหมือนเดิมไหม" ให้ดูสถานะล่าสุดจริง
create or replace function public.njhr_shift_assign(
  p_token text, p_employee uuid, p_shift uuid, p_effective_date date default null)
returns table (employee_id uuid, shift_id uuid, effective_date date, replaced boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; w record; v_date date := coalesce(p_effective_date, current_date);
        old record; v_replaced boolean := false;
begin
  select * into c from public.njhr_shift_guard(p_token, true);

  select * into e from public.employees where id = p_employee;
  if not found then raise exception 'ไม่พบพนักงานรายนี้' using errcode='P0002'; end if;
  select * into w from public.work_shifts where id = p_shift;
  if not found then raise exception 'ไม่พบกะที่เลือก' using errcode='P0002'; end if;
  if w.is_active is not true then
    raise exception 'กะ "%" ถูกปิดใช้งานอยู่ ผูกพนักงานเข้ากะนี้ไม่ได้', w.shift_name
      using errcode='22023';
  end if;

  -- มีประวัติของวันนั้นอยู่แล้ว → แก้แถวของวันนั้น (ไม่สร้างซ้ำ) · ประวัติวันอื่นไม่ถูกแตะ
  select * into old from public.employee_shifts es
   where es.employee_id = p_employee and es.effective_date = v_date;
  if found then
    if old.shift_id = p_shift and coalesce(old.status,'ACTIVE') = 'ACTIVE' then
      return query select p_employee, p_shift, v_date, false;   -- เหมือนเดิม ไม่ต้องทำอะไร
      return;
    end if;
    update public.employee_shifts
       set shift_id = p_shift, status = 'ACTIVE',
           assigned_by = c.username, assigned_at = now()
     where employee_shifts.employee_id = p_employee
       and employee_shifts.effective_date = v_date;
    v_replaced := true;
  else
    insert into public.employee_shifts(employee_id, shift_id, effective_date,
                                       status, assigned_by, assigned_at)
    values (p_employee, p_shift, v_date, 'ACTIVE', c.username, now());
  end if;

  perform public.njhr_audit_write(p_token, 'SHIFT_ASSIGN', 'shift', 'employee_shifts',
    p_employee::text,
    e.emp_code || ' → กะ ' || w.shift_name || ' มีผล ' || to_char(v_date,'DD/MM/YYYY') ||
    case when v_replaced then ' (แทนที่รายการของวันเดียวกัน)' else '' end,
    case when v_replaced then to_jsonb(old) else null end,
    (select to_jsonb(x) from public.employee_shifts x
      where x.employee_id = p_employee and x.effective_date = v_date), null);

  return query select p_employee, p_shift, v_date, v_replaced;
end $$;


-- ─── 2.6 njhr_shift_set_active ─────────────────────────────
--  นับ "พนักงานที่ยังใช้กะนี้อยู่" จากสถานะล่าสุดจริง (คนที่ถูกนำออกไปแล้วไม่ควรถูกนับ)
create or replace function public.njhr_shift_set_active(
  p_token text, p_id uuid, p_active boolean, p_force boolean default false)
returns table (id uuid, is_active boolean, employee_count bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; n bigint;
begin
  select * into c from public.njhr_shift_guard(p_token, true);
  select * into old from public.work_shifts where work_shifts.id = p_id;
  if not found then raise exception 'ไม่พบกะนี้' using errcode='P0002'; end if;

  select count(*) into n
    from public.employees e
    cross join lateral public.njhr_shift_state_at(e.id, current_date) st
   where st.shift_id = p_id and st.status = 'ACTIVE'
     and e.status::text in ('ACTIVE','PROBATION');

  if p_active is not true and n > 0 and coalesce(p_force,false) is not true then
    raise exception 'กะนี้ยังมีพนักงานใช้งานอยู่ % คน — ย้ายกะให้พนักงานก่อน หรือยืนยันเพื่อปิดใช้งาน', n
      using errcode='23503';
  end if;

  update public.work_shifts
     set is_active = coalesce(p_active,true), updated_at = now(), updated_by = c.username
   where work_shifts.id = p_id;

  perform public.njhr_audit_write(p_token,
    case when p_active then 'SHIFT_ENABLE' else 'SHIFT_DISABLE' end,
    'shift', 'work_shifts', p_id::text,
    old.shift_name || ' · พนักงานที่ใช้กะนี้ ' || n || ' คน', to_jsonb(old),
    (select to_jsonb(x) from public.work_shifts x where x.id = p_id), null);

  return query select w.id, w.is_active, n from public.work_shifts w where w.id = p_id;
end $$;


-- ════════════════════════════════════════════════════════════
-- 3) RPC ใหม่ — ทำงานแบบ Batch (Frontend ยิงครั้งเดียวต่อการกด 1 ครั้ง)
-- ════════════════════════════════════════════════════════════

-- ─── 3.0 ตัวเขียนแถวสถานะ (ใช้ร่วมกันทั้ง 3 RPC ด้านล่าง) ────
--  INSERT แถวใหม่ตาม effective_date เสมอ
--  ชนกับ Unique (employee_id, effective_date) ของวันเดียวกัน → แก้แถวของวันนั้นแทน
--  ไม่แตะแถววันอื่นเด็ดขาด
create or replace function public.njhr_shift_mark(
  p_username text, p_employee uuid, p_shift uuid, p_status text, p_date date)
returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare old record;
begin
  select * into old from public.employee_shifts es
   where es.employee_id = p_employee and es.effective_date = p_date;
  if found then
    if coalesce(old.status,'ACTIVE') = p_status
       and old.shift_id is not distinct from p_shift then
      return 'UNCHANGED';
    end if;
    update public.employee_shifts
       set shift_id = p_shift, status = p_status,
           assigned_by = p_username, assigned_at = now()
     where employee_shifts.employee_id = p_employee
       and employee_shifts.effective_date = p_date;
    return 'REPLACED';
  end if;
  insert into public.employee_shifts(employee_id, shift_id, effective_date,
                                     status, assigned_by, assigned_at)
  values (p_employee, p_shift, p_date, p_status, p_username, now());
  return 'INSERTED';
end $$;
revoke all on function public.njhr_shift_mark(text, uuid, uuid, text, date)
  from public, anon, authenticated;


-- ─── 3.1 njhr_shift_remove — นำออกจากกะ (หลายคนพร้อมกัน) ────
--  p_no_shift = false → status REMOVED  → กลับไปอยู่ "ยังไม่ได้กำหนดกะ"
--  p_no_shift = true  → status NO_SHIFT → ไม่ถูกนับใน "ยังไม่ได้กำหนดกะ"
create or replace function public.njhr_shift_remove(
  p_token text, p_employees uuid[], p_effective_date date default null,
  p_no_shift boolean default false)
returns table (employee_id uuid, emp_code text, result text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_date date := coalesce(p_effective_date, current_date);
        v_status text := case when coalesce(p_no_shift,false) then 'NO_SHIFT' else 'REMOVED' end;
        r record; v_res text; n int := 0;
begin
  select * into c from public.njhr_shift_guard(p_token, true);
  if p_employees is null or array_length(p_employees,1) is null then
    raise exception 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' using errcode='22023';
  end if;

  create temporary table if not exists njhr_k2_out(
    employee_id uuid, emp_code text, result text) on commit drop;
  delete from njhr_k2_out;

  for r in
    select e.id, e.emp_code, e.prefix, e.first_name, e.last_name
      from public.employees e
     where e.id = any(p_employees)
     order by e.emp_code
  loop
    v_res := public.njhr_shift_mark(c.username, r.id, null, v_status, v_date);
    insert into njhr_k2_out values (r.id, r.emp_code, v_res);
    if v_res <> 'UNCHANGED' then n := n + 1; end if;
  end loop;

  if n > 0 then
    perform public.njhr_audit_write(p_token,
      case when v_status = 'NO_SHIFT' then 'SHIFT_NO_SHIFT' else 'SHIFT_REMOVE' end,
      'shift', 'employee_shifts', null,
      case when v_status = 'NO_SHIFT' then 'ตั้งเป็นไม่ใช้กะ ' else 'นำออกจากกะ ' end ||
      n || ' คน มีผล ' || to_char(v_date,'DD/MM/YYYY') || ' · ' ||
      (select string_agg(o.emp_code, ', ' order by o.emp_code)
         from njhr_k2_out o where o.result <> 'UNCHANGED'),
      null, null, null);
  end if;

  return query select o.employee_id, o.emp_code, o.result from njhr_k2_out o order by o.emp_code;
end $$;


-- ─── 3.2 njhr_shift_no_shift_set — ตั้ง / ยกเลิก "ไม่ใช้กะ" ──
--  p_on = true  → NO_SHIFT
--  p_on = false → REMOVED  (ไม่ใช่การคืนกะเก่า)
--    เหตุผล: ยกเลิก "ไม่ใช้กะ" แปลว่าคนนี้กลับมาต้องใช้กะ แต่ยังไม่ได้เลือกกะ
--            ถ้าไม่เขียนแถว REMOVED ทับ ระบบจะย้อนไปเห็นแถว ACTIVE เก่าแล้วกะเก่าจะกลับมาเอง
create or replace function public.njhr_shift_no_shift_set(
  p_token text, p_employees uuid[], p_effective_date date default null,
  p_on boolean default true)
returns table (employee_id uuid, emp_code text, result text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_date date := coalesce(p_effective_date, current_date);
        v_status text := case when coalesce(p_on,true) then 'NO_SHIFT' else 'REMOVED' end;
        r record; v_res text; n int := 0;
begin
  select * into c from public.njhr_shift_guard(p_token, true);
  if p_employees is null or array_length(p_employees,1) is null then
    raise exception 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' using errcode='22023';
  end if;

  create temporary table if not exists njhr_k2_out2(
    employee_id uuid, emp_code text, result text) on commit drop;
  delete from njhr_k2_out2;

  for r in
    select e.id, e.emp_code from public.employees e
     where e.id = any(p_employees) order by e.emp_code
  loop
    v_res := public.njhr_shift_mark(c.username, r.id, null, v_status, v_date);
    insert into njhr_k2_out2 values (r.id, r.emp_code, v_res);
    if v_res <> 'UNCHANGED' then n := n + 1; end if;
  end loop;

  if n > 0 then
    perform public.njhr_audit_write(p_token,
      case when coalesce(p_on,true) then 'SHIFT_NO_SHIFT' else 'SHIFT_NO_SHIFT_CANCEL' end,
      'shift', 'employee_shifts', null,
      case when coalesce(p_on,true) then 'ตั้งเป็นไม่ใช้กะ ' else 'ยกเลิกไม่ใช้กะ ' end ||
      n || ' คน มีผล ' || to_char(v_date,'DD/MM/YYYY') || ' · ' ||
      (select string_agg(o.emp_code, ', ' order by o.emp_code)
         from njhr_k2_out2 o where o.result <> 'UNCHANGED'),
      null, null, null);
  end if;

  return query select o.employee_id, o.emp_code, o.result from njhr_k2_out2 o order by o.emp_code;
end $$;


-- ─── 3.3 njhr_shift_no_shift_employees — รายชื่อ "ไม่ใช้กะ" ──
create or replace function public.njhr_shift_no_shift_employees(
  p_token text, p_q text default null, p_limit int default 200)
returns table (
  employee_id uuid, emp_code text, full_name text, nickname text,
  department_name text, position_name text, emp_status text, effective_date date)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,200),1),1000);
begin
  select * into c from public.njhr_shift_guard(p_token, false);
  return query
  select e.id, e.emp_code,
         coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
         coalesce(e.nickname,''), coalesce(e.department_name,''),
         coalesce(e.position_name,''), e.status::text, st.effective_date
    from public.employees e
    cross join lateral public.njhr_shift_state_at(e.id, current_date) st
   where e.status::text in ('ACTIVE','PROBATION')
     and st.status = 'NO_SHIFT'
     and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
          or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
          or lower(coalesce(e.nickname,'')) like '%'||q||'%'
          or lower(coalesce(e.department_name,'')) like '%'||q||'%')
   order by e.emp_code
   limit lim;
end $$;


-- ─── 3.4 njhr_shift_assign_many — ผูก/ย้ายกะ หลายคนพร้อมกัน ─
--  ใช้ได้กับทุกสถานะเดิม: ACTIVE กะอื่น · REMOVED · NO_SHIFT · ไม่มีประวัติ
--  คืน old_shift_name ให้ Frontend เอาไปแสดง Confirm "อยู่ในกะ X ต้องการย้ายไปกะ Y หรือไม่"
create or replace function public.njhr_shift_assign_many(
  p_token text, p_employees uuid[], p_shift uuid, p_effective_date date default null)
returns table (employee_id uuid, emp_code text, old_shift_name text, result text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; w record; v_date date := coalesce(p_effective_date, current_date);
        r record; v_res text; v_old text; n int := 0;
begin
  select * into c from public.njhr_shift_guard(p_token, true);
  if p_employees is null or array_length(p_employees,1) is null then
    raise exception 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' using errcode='22023';
  end if;
  select * into w from public.work_shifts where id = p_shift;
  if not found then raise exception 'ไม่พบกะที่เลือก' using errcode='P0002'; end if;
  if w.is_active is not true then
    raise exception 'กะ "%" ถูกปิดใช้งานอยู่ ผูกพนักงานเข้ากะนี้ไม่ได้', w.shift_name
      using errcode='22023';
  end if;

  create temporary table if not exists njhr_k2_out3(
    employee_id uuid, emp_code text, old_shift_name text, result text) on commit drop;
  delete from njhr_k2_out3;

  for r in
    select e.id, e.emp_code from public.employees e
     where e.id = any(p_employees) order by e.emp_code
  loop
    select ws.shift_name into v_old
      from public.njhr_shift_state_at(r.id, v_date) st
      join public.work_shifts ws on ws.id = st.shift_id
     where st.status = 'ACTIVE';
    v_res := public.njhr_shift_mark(c.username, r.id, p_shift, 'ACTIVE', v_date);
    insert into njhr_k2_out3 values (r.id, r.emp_code, v_old, v_res);
    if v_res <> 'UNCHANGED' then n := n + 1; end if;
    v_old := null;
  end loop;

  if n > 0 then
    perform public.njhr_audit_write(p_token, 'SHIFT_ASSIGN', 'shift', 'employee_shifts', null,
      'ผูกกะ ' || w.shift_name || ' ให้พนักงาน ' || n || ' คน มีผล ' ||
      to_char(v_date,'DD/MM/YYYY') || ' · ' ||
      (select string_agg(o.emp_code, ', ' order by o.emp_code)
         from njhr_k2_out3 o where o.result <> 'UNCHANGED'),
      null, null, null);
  end if;

  return query select o.employee_id, o.emp_code, o.old_shift_name, o.result
                 from njhr_k2_out3 o order by o.emp_code;
end $$;


-- ════════════════════════════════════════════════════════════
-- 4) GRANT — ให้สิทธิ์แบบเดียวกับ RPC เดิมในไฟล์ 76
--    ตัวช่วยภายใน (state_at / mark) ไม่เปิดให้เรียกจากภายนอก
-- ════════════════════════════════════════════════════════════
grant execute on function public.njhr_shift_remove(text, uuid[], date, boolean)          to anon, authenticated;
grant execute on function public.njhr_shift_no_shift_set(text, uuid[], date, boolean)    to anon, authenticated;
grant execute on function public.njhr_shift_no_shift_employees(text, text, int)          to anon, authenticated;
grant execute on function public.njhr_shift_assign_many(text, uuid[], uuid, date)        to anon, authenticated;

-- ฟังก์ชันเดิม 6 ตัว: CREATE OR REPLACE ไม่ล้าง GRANT เดิม
-- แต่สั่งซ้ำเพื่อความชัดเจน (ค่าเดิมทุกตัว ตามไฟล์ 76 บรรทัด GRANT)
grant execute on function public.njhr_shift_list(text, boolean)                            to anon, authenticated;
grant execute on function public.njhr_shift_employee_list(text, uuid)                      to anon, authenticated;
grant execute on function public.njhr_shift_assign(text, uuid, uuid, date)                 to anon, authenticated;
grant execute on function public.njhr_shift_unassigned_employees(text, text, int)          to anon, authenticated;
grant execute on function public.njhr_shift_set_active(text, uuid, boolean, boolean)       to anon, authenticated;
-- njhr_shift_at เดิมเป็น revoke all — คงไว้เหมือนเดิม (ประกาศไว้ในหัวข้อ 2.1 แล้ว)


insert into public.njhr_schema_version(version, note)
values ('v2.5-shift-membership',
        'employee_shifts: REMOVED / NO_SHIFT · อ่านแถวล่าสุดก่อนแล้วค่อยดู status')
on conflict (version) do nothing;


-- ════════════════════════════════════════════════════════════
-- 5) VERIFICATION — รันต่อท้ายได้เลย ไม่แตะข้อมูลจริง
--    Case B–E ใช้พนักงานสมมติที่สร้างและลบภายใน Transaction เดียว
-- ════════════════════════════════════════════════════════════
do $$
declare
  v_emp uuid; v_a uuid; v_b uuid; v_name text;
  v_rows_before bigint; v_hash_before text;
  v_rows_after bigint;  v_hash_after text;
  ok boolean := true;
  function_result record;
begin
  select rows_before, hash_before into v_rows_before, v_hash_before from njhr_k2_before;

  ---- Case F (ส่วนที่ 1) — ประวัติเดิมต้องไม่ถูกแตะจากขั้นตอนแก้ฟังก์ชัน
  select count(*), md5(coalesce(string_agg(t.line, '|' order by t.line), ''))
    into v_rows_after, v_hash_after
    from (select es.id::text || ':' || coalesce(es.employee_id::text,'-') || ':' ||
                 coalesce(es.shift_id::text,'-') || ':' || coalesce(es.effective_date::text,'-') || ':' ||
                 coalesce(es.status,'-') as line
            from public.employee_shifts es) t;
  if v_rows_after <> v_rows_before or v_hash_after is distinct from v_hash_before then
    raise exception 'CASE F ไม่ผ่าน: employee_shifts เปลี่ยน (ก่อน % แถว / หลัง % แถว)',
      v_rows_before, v_rows_after;
  end if;
  raise notice 'CASE F ผ่าน · employee_shifts % แถว เท่าเดิม hash เท่าเดิม', v_rows_after;

  ---- เตรียมกะสมมติ 2 กะ + พนักงานสมมติ 1 คน (ลบทิ้งท้ายบล็อก)
  insert into public.work_shifts(shift_name, start_time, end_time, is_active)
  values ('__K2_TEST_A', time '08:30', time '17:30', true) returning id into v_a;
  insert into public.work_shifts(shift_name, start_time, end_time, is_active)
  values ('__K2_TEST_B', time '20:00', time '05:00', true) returning id into v_b;
  insert into public.employees(emp_code, first_name, last_name, status)
  values ('__K2TEST', 'ทดสอบ', 'K2', 'ACTIVE') returning id into v_emp;

  ---- Case B — REMOVE
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, v_a, date '2026-01-01', 'ACTIVE');
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, null, date '2026-08-10', 'REMOVED');

  select shift_name into v_name from public.njhr_shift_at(v_emp, date '2026-08-09');
  if v_name is distinct from '__K2_TEST_A' then
    raise exception 'CASE B ไม่ผ่าน: 09/08 ควรได้กะ A แต่ได้ %', coalesce(v_name,'(ไม่มีกะ)');
  end if;
  if exists (select 1 from public.njhr_shift_at(v_emp, date '2026-08-10')) then
    raise exception 'CASE B ไม่ผ่าน: 10/08 ควรไม่มีกะ';
  end if;
  raise notice 'CASE B ผ่าน · 09/08 = กะ A · 10/08 = ไม่มีกะ';

  ---- Case E — Assign ใหม่หลัง REMOVED
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, v_b, date '2026-08-15', 'ACTIVE');
  select shift_name into v_name from public.njhr_shift_at(v_emp, date '2026-08-14');
  if v_name is not null then
    raise exception 'CASE E ไม่ผ่าน: 14/08 ควรไม่มีกะ แต่ได้ %', v_name;
  end if;
  select shift_name into v_name from public.njhr_shift_at(v_emp, date '2026-08-15');
  if v_name is distinct from '__K2_TEST_B' then
    raise exception 'CASE E ไม่ผ่าน: 15/08 ควรได้กะ B แต่ได้ %', coalesce(v_name,'(ไม่มีกะ)');
  end if;
  select shift_name into v_name from public.njhr_shift_at(v_emp, date '2026-08-09');
  if v_name is distinct from '__K2_TEST_A' then
    raise exception 'CASE E ไม่ผ่าน: 09/08 ย้อนหลังต้องยังเป็นกะ A แต่ได้ %', coalesce(v_name,'(ไม่มีกะ)');
  end if;
  raise notice 'CASE E ผ่าน · 09/08 = A · 14/08 = ไม่มีกะ · 15/08 = B';

  ---- Case C + D — NO_SHIFT แล้วยกเลิก (ใช้วันที่ในอดีตเพื่อให้ current_date เห็นผลล่าสุด)
  delete from public.employee_shifts where employee_id = v_emp;
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, v_a, current_date - 200, 'ACTIVE');
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, null, current_date - 100, 'NO_SHIFT');

  if exists (select 1 from public.njhr_shift_at(v_emp, current_date)) then
    raise exception 'CASE C ไม่ผ่าน: NO_SHIFT แล้วยังมีกะ';
  end if;
  select shift_name into v_name from public.njhr_shift_at(v_emp, current_date - 101);
  if v_name is distinct from '__K2_TEST_A' then
    raise exception 'CASE C ไม่ผ่าน: ก่อนวันที่ NO_SHIFT ต้องยังเป็นกะ A';
  end if;
  raise notice 'CASE C ผ่าน · ก่อนวัน NO_SHIFT = กะ A · หลังจากนั้น = ไม่มีกะ';

  ---- Case D — ยกเลิก NO_SHIFT แล้วต้องไม่กลับไปใช้กะ A
  insert into public.employee_shifts(employee_id, shift_id, effective_date, status)
  values (v_emp, null, current_date - 50, 'REMOVED');
  if exists (select 1 from public.njhr_shift_at(v_emp, current_date)) then
    raise exception 'CASE D ไม่ผ่าน: ยกเลิก NO_SHIFT แล้วกะเก่ากลับมาเอง';
  end if;
  raise notice 'CASE D ผ่าน · ยกเลิก NO_SHIFT แล้วยังไม่มีกะ (ไม่กลับไปใช้กะ A)';

  ---- ล้างข้อมูลสมมติทั้งหมด (ไม่แตะข้อมูลจริง)
  delete from public.employee_shifts where employee_id = v_emp;
  delete from public.employees where id = v_emp;
  delete from public.work_shifts where id in (v_a, v_b);

  ---- Case F (ส่วนที่ 2) — หลังทดสอบทั้งหมด ข้อมูลจริงต้องยังเท่าเดิม
  select count(*), md5(coalesce(string_agg(t.line, '|' order by t.line), ''))
    into v_rows_after, v_hash_after
    from (select es.id::text || ':' || coalesce(es.employee_id::text,'-') || ':' ||
                 coalesce(es.shift_id::text,'-') || ':' || coalesce(es.effective_date::text,'-') || ':' ||
                 coalesce(es.status,'-') as line
            from public.employee_shifts es) t;
  if v_rows_after <> v_rows_before or v_hash_after is distinct from v_hash_before then
    raise exception 'CASE F (หลังทดสอบ) ไม่ผ่าน: employee_shifts เปลี่ยน';
  end if;
  raise notice 'CASE F (หลังทดสอบ) ผ่าน · ข้อมูลจริงเท่าเดิมทุกแถว';
end $$;


-- ─── 6) Case A + ความสัมพันธ์ของ 4 ฟังก์ชัน (ดูผลด้วยตา) ────
--  ต้องได้: employees_active_probation = ACTIVE + unassigned + no_shift
select jsonb_pretty(jsonb_build_object(
  'CASE_A_เทียบกับก่อนแก้', jsonb_build_object(
     'employees_active_probation',
       (select count(*) from public.employees where status::text in ('ACTIVE','PROBATION')),
     'in_active_shift',
       (select count(*) from public.employees e
         cross join lateral public.njhr_shift_state_at(e.id, current_date) st
        where e.status::text in ('ACTIVE','PROBATION') and st.status='ACTIVE'
          and st.shift_id is not null),
     -- ใช้ตรรกะเดียวกับ njhr_shift_unassigned_employees แต่ไม่ผ่าน token
     -- (VERIFICATION รันบน SQL Editor ไม่มี session ของแอป · njhr_ctx จะปฏิเสธ)
     'unassigned',
       (select count(*) from public.employees e
         left join lateral public.njhr_shift_state_at(e.id, current_date) st on true
        where e.status::text in ('ACTIVE','PROBATION')
          and coalesce(st.status, 'NONE') <> 'NO_SHIFT'
          and (st.shift_id is null or coalesce(st.status,'NONE') <> 'ACTIVE')),
     'no_shift',
       (select count(*) from public.employees e
         cross join lateral public.njhr_shift_state_at(e.id, current_date) st
        where e.status::text in ('ACTIVE','PROBATION') and st.status='NO_SHIFT')),
  'shift_counts', (select jsonb_agg(jsonb_build_object(
       'shift_name', s.shift_name, 'employee_count', s.employee_count) order by s.shift_name)
     from public.work_shifts w
     cross join lateral (
       select w.shift_name,
              (select count(*) from public.employees e
                cross join lateral public.njhr_shift_state_at(e.id, current_date) st
               where e.status::text in ('ACTIVE','PROBATION')
                 and st.status='ACTIVE' and st.shift_id = w.id) as employee_count) s),
  'employee_shifts_rows', (select count(*) from public.employee_shifts),
  'status_breakdown', (select jsonb_object_agg(x.st, x.n)
     from (select coalesce(status,'ACTIVE') as st, count(*) as n
             from public.employee_shifts group by 1) x)
)) as k2_verification;
