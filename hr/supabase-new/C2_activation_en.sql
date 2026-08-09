-- ============================================================
-- NJ HR V2 — C2_activation_en.sql
-- เปลี่ยนตัวจับคู่สมัครสมาชิกจาก "นามสกุลไทย" เป็น "นามสกุลภาษาอังกฤษ"
-- และเพิ่มที่เก็บข้อมูลที่พนักงานกรอกครั้งแรกลงฐานข้อมูลทันที
--
-- ขอบเขต:
--   1) ALTER TABLE njhr_activation_requests เพิ่ม 3 คอลัมน์ (nullable ทั้งหมด)
--   2) DROP + CREATE njhr_activation_submit  (เปลี่ยน Signature)
--   3) DROP + CREATE njhr_activation_list    (เปลี่ยน Return Type)
--   4) CREATE OR REPLACE njhr_activation_link
--   5) CREATE njhr_member_list — หน้าจัดการสมาชิกยึด employees เป็นหลัก
--
--   ไม่แตะ: njhr_activation_reject · njhr_login · njhr_ctx · njhr_user_guard
--           njhr_user_save · njhr_user_link · njhr_user_password · njhr_user_delete
--           njhr_list_users (คงไว้ทั้งดุ้น เพื่อให้ย้อนกลับได้ทันที)
--           employees · app_users · Approval Workflow · Leave · OT · Payroll · app_code อื่น
--
-- อ้างอิงผลตรวจจริงจาก C1 (2026-08-07):
--   employees 108 · active 106 · last_name_en มีค่า 105 · ว่าง 3 (active 2)
--   เส้นทางสมัคร: CASE A 48 คน · CASE B 3 คน · เชื่อมแล้ว 57 คน
--   njhr_actreq_pending_uidx  UNIQUE(employee_id) WHERE status='PENDING'  → กันคำขอซ้ำ
--   njhr_appusers_emp_uidx    UNIQUE(employee_id) WHERE app_code='salary' → 1 emp = 1 user
--   app_users_email_app_code_uniq UNIQUE(email, app_code)
--   username_equals_empcode = 0 · empcode_taken_as_username_by_other = 0 → ไม่มี collision
--   คำขอค้างในระบบ = 0 รายการ → เปลี่ยน Signature ได้โดยไม่มีข้อมูลค้างรูปแบบเก่า
--
-- รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  foreach n in array array[1] loop end loop;   -- no-op กัน declare ว่าง
  if to_regclass('public.njhr_activation_requests') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_activation_requests'; end if;
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง employees'; end if;
  if to_regclass('public.app_users') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง app_users'; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='employees'
     and column_name in ('id','emp_code','prefix','first_name','last_name',
                         'first_name_en','last_name_en','nickname','email',
                         'department_name','position_name','status');
  if n <> 12 then raise exception 'PREFLIGHT: employees ขาดคอลัมน์ที่ต้องใช้ (พบ % จาก 12)', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='njhr_activation_requests'
     and column_name in ('id','employee_id','emp_code','last_name','new_nickname',
                         'new_email','password_hash','status','requested_at',
                         'decided_at','decided_by','reject_reason','linked_user_id');
  if n <> 13 then raise exception 'PREFLIGHT: njhr_activation_requests ขาดคอลัมน์เดิม (พบ % จาก 13)', n; end if;

  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_user_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_user_guard'; end if;

  -- คำขอค้างรูปแบบเก่าต้องไม่มี มิฉะนั้นการเปลี่ยนตัวจับคู่จะทำให้คำขอเดิมเชื่อมไม่ได้
  select count(*) into n from public.njhr_activation_requests where status = 'PENDING';
  if n > 0 then
    raise notice 'เตือน: มีคำขอสถานะ PENDING ค้างอยู่ % รายการ', n;
    raise notice 'คำขอเหล่านี้ยังไม่มีค่า last_name_en ที่พนักงานกรอก จึงต้องให้พนักงานสมัครใหม่';
  end if;

  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) เพิ่มคอลัมน์เก็บข้อมูลที่พนักงานกรอกครั้งแรก ─────────
-- nullable ทั้งหมด → แถวเดิมไม่กระทบ · ไม่มี default → ไม่ rewrite ตาราง
alter table public.njhr_activation_requests
  add column if not exists first_name    text,   -- ชื่อภาษาไทยที่พนักงานกรอก
  add column if not exists first_name_en text,   -- ชื่อภาษาอังกฤษที่พนักงานกรอก (UPPER)
  add column if not exists last_name_en  text;   -- นามสกุลภาษาอังกฤษที่พนักงานกรอก (UPPER) = ตัวจับคู่

comment on column public.njhr_activation_requests.last_name_en is
  'นามสกุลภาษาอังกฤษที่พนักงานกรอก (UPPER+TRIM) — ตัวจับคู่คู่กับ emp_code';

insert into public.njhr_schema_version(version, note)
values ('v12.0-activation-en', 'สมัครสมาชิกจับคู่ด้วย emp_code + last_name_en')
on conflict (version) do nothing;


-- ─── 2) ตัวช่วย Normalize — ที่เดียวของทั้งระบบ ──────────────
-- UPPER + TRIM + ยุบช่องว่างซ้อนให้เหลือช่องเดียว
create or replace function public.njhr_norm_en(p text)
returns text language sql immutable as $$
  select nullif(upper(regexp_replace(btrim(coalesce(p,'')), '\s+', ' ', 'g')), '')
$$;


-- ─── 3) SUBMIT — จับคู่ด้วย emp_code + last_name_en ──────────
-- Signature เดิม 5 พารามิเตอร์ ต้องถอนทิ้ง ไม่ให้เหลือเป็น overload
-- (ถ้าเหลือไว้ จะยังเรียกด้วยนามสกุลไทยได้อยู่ = ช่องโหว่)
drop function if exists public.njhr_activation_submit(text, text, text, text, text);

create or replace function public.njhr_activation_submit(
  p_emp_code      text,
  p_first_name    text,   -- ชื่อภาษาไทย
  p_last_name     text,   -- นามสกุลภาษาไทย
  p_first_name_en text,   -- ชื่อภาษาอังกฤษ
  p_last_name_en  text,   -- นามสกุลภาษาอังกฤษ  ← ตัวจับคู่
  p_nickname      text,
  p_email         text,
  p_password      text)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_code  text := btrim(coalesce(p_emp_code,''));
  v_fnm   text := regexp_replace(btrim(coalesce(p_first_name,'')), '\s+', ' ', 'g');
  v_lnm   text := regexp_replace(btrim(coalesce(p_last_name,'')),  '\s+', ' ', 'g');
  v_fen   text := public.njhr_norm_en(p_first_name_en);
  v_len   text := public.njhr_norm_en(p_last_name_en);
  v_nick  text := btrim(coalesce(p_nickname,''));
  v_mail  text := lower(btrim(coalesce(p_email,'')));
  v_emp   record;
  v_emp_len text;
  n_match int;
  -- ข้อความเดียวกันทุกกรณีที่ยืนยันตัวตนไม่ได้ — ไม่เปิดเผยว่ารหัสใดมีอยู่จริง
  MSG_NOMATCH constant text :=
    'รหัสพนักงานหรือนามสกุลภาษาอังกฤษไม่ตรงกับข้อมูลพนักงาน กรุณาตรวจสอบและสมัครใหม่อีกครั้ง';
begin
  -- ── ทุกช่องบังคับกรอก (ขั้นตอนที่ 1) ──
  if v_code = '' or v_fnm = '' or v_lnm = '' or v_fen is null or v_len is null
     or v_nick = '' or v_mail = '' then
    return query select false, 'กรุณากรอกข้อมูลให้ครบทุกช่อง'::text; return;
  end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return query select false, 'รูปแบบอีเมลไม่ถูกต้อง'::text; return;
  end if;

  -- ── เงื่อนไขรหัสผ่าน — คงกฎเดิมของระบบทุกข้อ ──
  if length(coalesce(p_password,'')) < 8 then
    return query select false, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว'::text; return; end if;
  if p_password !~ '[a-z]' then
    return query select false, 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว'::text; return; end if;
  if p_password !~ '[A-Z]' then
    return query select false, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว'::text; return; end if;
  if p_password !~ '[0-9]' then
    return query select false, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'::text; return; end if;
  if lower(p_password) = lower(v_code) then
    return query select false, 'ห้ามใช้รหัสพนักงานเป็นรหัสผ่าน'::text; return; end if;

  -- ── หาพนักงานจาก emp_code เท่านั้น (เก็บเป็น text ไม่ cast เลข 0 นำหน้าจึงไม่หาย) ──
  select count(*) into n_match
    from public.employees e
   where btrim(e.emp_code) = v_code
     and e.status in ('ACTIVE','PROBATION');
  if n_match <> 1 then
    return query select false, MSG_NOMATCH; return;
  end if;

  select * into v_emp
    from public.employees e
   where btrim(e.emp_code) = v_code
     and e.status in ('ACTIVE','PROBATION');

  v_emp_len := public.njhr_norm_en(v_emp.last_name_en);

  -- ── CASE A: employees.last_name_en มีค่า → ต้องตรงเป๊ะหลัง Normalize ──
  --    ไม่มี fuzzy · ไม่มี partial · ไม่ fallback ไปนามสกุลไทย
  if v_emp_len is not null then
    if v_emp_len <> v_len then
      return query select false, MSG_NOMATCH; return;
    end if;
  end if;
  -- ── CASE B: employees.last_name_en ว่าง → รับค่าที่พนักงานกรอกไว้ก่อน ──
  --    ห้ามเขียนลง employees ที่นี่ (ขั้นตอนที่ 3) รอ SUPER_ADMIN ตรวจตอนกดเชื่อม

  -- ── มีบัญชีเชื่อมอยู่แล้ว ──
  if exists (select 1 from public.app_users u
              where u.app_code = 'salary' and u.employee_id = v_emp.id) then
    return query select false,
      'พนักงานรายนี้มีบัญชีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบหรือติดต่อผู้ดูแลระบบ'::text; return;
  end if;

  -- ── มีคำขอรออยู่แล้ว (njhr_actreq_pending_uidx กันซ้ำอีกชั้นที่ฐานข้อมูล) ──
  if exists (select 1 from public.njhr_activation_requests r
              where r.employee_id = v_emp.id and r.status = 'PENDING') then
    return query select false,
      'มีคำขอสมัครรอการเชื่อมอยู่แล้ว กรุณารอผู้ดูแลระบบสูงสุดเชื่อมบัญชี'::text; return;
  end if;

  -- ── อีเมลต้องไม่ซ้ำ (app_users_email_app_code_uniq) ──
  if exists (select 1 from public.app_users u
              where u.app_code = 'salary' and lower(btrim(u.email)) = v_mail) then
    return query select false, 'อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น'::text; return;
  end if;
  if exists (select 1 from public.njhr_activation_requests r
              where r.status = 'PENDING' and lower(btrim(r.new_email)) = v_mail) then
    return query select false, 'อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น'::text; return;
  end if;

  -- ── บันทึกคำขอทันที (ขั้นตอนที่ 4) — เก็บเฉพาะ hash ห้าม plain text ──
  insert into public.njhr_activation_requests
    (employee_id, emp_code, first_name, last_name, first_name_en, last_name_en,
     new_nickname, new_email, password_hash)
  values (v_emp.id, v_code, v_fnm, v_lnm, v_fen, v_len, v_nick, v_mail,
          extensions.crypt(p_password, extensions.gen_salt('bf', 10)));

  return query select true,
    'ส่งคำขอสมัครเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบสูงสุดเชื่อมบัญชี'::text;
end $$;

grant execute on function public.njhr_activation_submit(text,text,text,text,text,text,text,text)
  to anon, authenticated;


-- ─── 4) LIST — คืนข้อมูลเดิมเทียบข้อมูลที่สมัคร ครบ 7 แถว ────
drop function if exists public.njhr_activation_list(text, text);

create or replace function public.njhr_activation_list(p_token text, p_status text default 'PENDING')
returns table (
  id uuid, emp_code text, emp_name text, department_name text, position_name text,
  old_first_name text, new_first_name text,
  old_last_name  text, new_last_name  text,
  old_first_name_en text, new_first_name_en text,
  old_last_name_en  text, new_last_name_en  text,
  old_nickname text, new_nickname text,
  old_email text, new_email text,
  last_name_en_was_empty boolean,
  status text, requested_at timestamptz, decided_at timestamptz, reject_reason text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ดูคำขอสมัครได้' using errcode='42501';
  end if;

  return query
  select r.id, r.emp_code,
         btrim(coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,'')),
         e.department_name, e.position_name,
         e.first_name,    r.first_name,
         e.last_name,     r.last_name,
         e.first_name_en, r.first_name_en,
         e.last_name_en,  r.last_name_en,
         e.nickname,      r.new_nickname,
         e.email,         r.new_email,
         (public.njhr_norm_en(e.last_name_en) is null),
         r.status, r.requested_at, r.decided_at, r.reject_reason
    from public.njhr_activation_requests r
    join public.employees e on e.id = r.employee_id
   where (p_status is null or r.status = p_status)
   order by r.requested_at desc;
end $$;

grant execute on function public.njhr_activation_list(text,text) to anon, authenticated;


-- ─── 5) LINK — SUPER_ADMIN กดเชื่อม ──────────────────────────
create or replace function public.njhr_activation_link(
  p_token text, p_request_id uuid, p_username text default null)
returns table (ok boolean, message text, user_id uuid)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; r record; e record;
        v_user uuid; v_un text;
        v_emp_len text;
        old_nick text; old_mail text; old_role text;
        old_fen text; old_len text;
begin
  -- (7) ผู้เรียกต้องเป็น SUPER_ADMIN — ตรวจฝั่งเซิร์ฟเวอร์ ไม่พึ่งการซ่อนปุ่ม
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่เชื่อมบัญชีได้' using errcode='42501';
  end if;

  -- (1)(6) ล็อกแถวคำขอ กันกดพร้อมกันสองเครื่อง / อนุมัติซ้ำ
  select * into r from public.njhr_activation_requests where id = p_request_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกดำเนินการไปแล้ว' using errcode='22023'; end if;

  -- (2) ล็อกแถวพนักงาน
  select * into e from public.employees where id = r.employee_id for update;
  if not found then raise exception 'ไม่พบข้อมูลพนักงาน' using errcode='P0002'; end if;

  -- รหัสพนักงานต้องยังตรงกับตอนยื่นคำขอ
  if btrim(e.emp_code) <> r.emp_code then
    raise exception 'รหัสพนักงานเปลี่ยนไปจากตอนยื่นคำขอ กรุณาตรวจสอบ' using errcode='22023';
  end if;

  v_emp_len := public.njhr_norm_en(e.last_name_en);

  -- (ขั้นตอนที่ 9) ถ้า employees.last_name_en มีค่าอยู่แล้ว ต้องตรงกับคำขอ
  --                ไม่ตรง = Conflict → ปฏิเสธ ไม่เขียนทับอัตโนมัติ
  if v_emp_len is not null and v_emp_len <> public.njhr_norm_en(r.last_name_en) then
    raise exception 'นามสกุลภาษาอังกฤษในประวัติพนักงาน (%) ไม่ตรงกับที่พนักงานสมัคร (%) กรุณาตรวจสอบ',
      v_emp_len, public.njhr_norm_en(r.last_name_en) using errcode='22023';
  end if;

  -- (3)(4) พนักงานต้องยังไม่ถูกบัญชีอื่นเชื่อม
  if exists (select 1 from public.app_users u
              where u.app_code='salary' and u.employee_id = e.id) then
    raise exception 'พนักงานคนนี้ถูกเชื่อมกับบัญชีอื่นแล้ว' using errcode='23505';
  end if;

  -- ห้ามเขียนทับด้วยค่าว่าง
  if btrim(coalesce(r.new_nickname,'')) = '' or btrim(coalesce(r.new_email,'')) = ''
     or public.njhr_norm_en(r.last_name_en) is null then
    raise exception 'ข้อมูลในคำขอไม่ครบ จึงเชื่อมไม่ได้' using errcode='22023';
  end if;

  old_nick := e.nickname; old_mail := e.email;
  old_fen  := e.first_name_en; old_len := e.last_name_en;

  -- ── เลือกบัญชี: ใช้บัญชีเดิมที่ระบุ หรือสร้างใหม่โดยใช้รหัสพนักงานเป็น username ──
  if p_username is not null and btrim(p_username) <> '' then
    select u.id, u.username, u.role::text into v_user, v_un, old_role
      from public.app_users u
     where u.app_code='salary' and u.username = btrim(p_username) for update;
    if v_user is null then raise exception 'ไม่พบบัญชีที่ระบุ' using errcode='P0002'; end if;
    if exists (select 1 from public.app_users u
                where u.id = v_user and u.employee_id is not null) then
      raise exception 'บัญชีนี้เชื่อมกับพนักงานคนอื่นแล้ว' using errcode='23505';
    end if;

    update public.app_users
       set employee_id = e.id, role = 'USER'::public.user_role,
           email = r.new_email, password_hash = r.password_hash, password = null,
           is_active = true, status = 'active', updated_at = now()
     where id = v_user;
  else
    -- (ขั้นตอนที่ 11) username = emp_code เก็บเป็น text เลข 0 นำหน้าไม่หาย
    v_un := r.emp_code;
    -- (5) Username ต้องไม่ซ้ำ — เทียบแบบ case-insensitive ตาม unique index จริง
    if exists (select 1 from public.app_users u
                where u.app_code='salary' and lower(u.username) = lower(v_un)) then
      raise exception 'ชื่อผู้ใช้ % ถูกใช้ไปแล้ว กรุณาเลือกบัญชีเดิมแทน', v_un using errcode='23505';
    end if;
    old_role := null;

    insert into public.app_users
      (username, email, full_name, role, employee_id, is_active, status,
       app_code, password_hash, department, created_by)
    values (v_un, r.new_email,
            btrim(coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,'')),
            'USER'::public.user_role, e.id, true, 'active',
            'salary', r.password_hash, e.department_name, c.app_user_id)
    returning id into v_user;
  end if;

  -- ── (ขั้นตอนที่ 8/10) อัปเดตข้อมูลพนักงาน 4 ฟิลด์ ──
  --    first_name_en · last_name_en · nickname · email
  --    ห้ามแตะ emp_code · ชื่อไทย · นามสกุลไทย · แผนก
  update public.employees
     set first_name_en = public.njhr_norm_en(r.first_name_en),
         last_name_en  = public.njhr_norm_en(r.last_name_en),
         nickname      = r.new_nickname,
         email         = r.new_email
   where id = e.id;

  -- ── ปิดคำขอ ──
  update public.njhr_activation_requests
     set status = 'LINKED', decided_at = now(),
         decided_by = c.app_user_id, linked_user_id = v_user
   where id = r.id;

  -- ── Audit เก็บค่าเดิมและค่าใหม่ (ห้ามเก็บ password/hash) ──
  perform public.njhr_audit_write(p_token, 'ACTIVATION_LINK', 'user', 'app_users', v_user::text,
    'เชื่อมบัญชี ' || v_un || ' กับพนักงาน ' || r.emp_code ||
    case when old_len is null then ' · เพิ่มนามสกุลภาษาอังกฤษใหม่' else '' end,
    jsonb_build_object('first_name_en', old_fen, 'last_name_en', old_len,
                       'nickname', old_nick, 'email', old_mail, 'role', old_role),
    jsonb_build_object('first_name_en', public.njhr_norm_en(r.first_name_en),
                       'last_name_en',  public.njhr_norm_en(r.last_name_en),
                       'nickname', r.new_nickname, 'email', r.new_email, 'role', 'USER'),
    null);

  return query select true, 'เชื่อมบัญชีเรียบร้อยแล้ว พนักงานเข้าสู่ระบบได้ทันที'::text, v_user;
end $$;

grant execute on function public.njhr_activation_link(text,uuid,text) to anon, authenticated;


-- ─── 6) MEMBER LIST — หน้าจัดการสมาชิกยึด employees เป็นหลัก ─
-- 4 กลุ่มแถว:
--   WAITING_REGISTER  พนักงานยังไม่มีบัญชี และไม่มีคำขอค้าง       → "รอสมัคร"
--   WAITING_LINK      มีคำขอ PENDING                              → "รอเชื่อม"
--   LINKED            app_users.employee_id = employees.id        → "เชื่อมแล้ว"
--   ORPHAN_ACCOUNT    บัญชีที่ยังไม่ผูกพนักงาน (ไม่มีแถวใน employees)
--     → ต้องคงไว้ ไม่งั้นปุ่ม "ลบบัญชี" ที่ทำไว้รอบก่อนจะใช้ไม่ได้
--
-- คอลัมน์ผลลัพธ์ 18 ตัวแรกเหมือน njhr_list_users ทุกตัวและลำดับเดียวกัน
-- Frontend เดิมจึงใช้ต่อได้โดยไม่ต้องแก้ตัวอ่านค่า
create or replace function public.njhr_member_list(
  p_token text, p_q text default null,
  p_role text default null, p_status text default null, p_dept text default null,
  p_limit int default 50, p_offset int default 0)
returns table (
  user_id uuid, username text, internal_username text, email text, department text,
  role text, status text, is_active boolean, employee_id uuid,
  emp_code text, emp_name text, emp_department text, emp_position text, emp_status text,
  mapping_status text, created_at timestamptz, updated_at timestamptz, total_count bigint,
  reg_status text, request_id uuid, requested_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare q text := lower(btrim(coalesce(p_q,'')));
        st text := upper(btrim(coalesce(p_status,'')));
begin
  perform public.njhr_user_guard(p_token, false);
  if st <> '' and st not in ('ACTIVE','INACTIVE','LINKED','UNLINKED',
                             'REG_WAITING','REG_PENDING','REG_LINKED','REG_ORPHAN') then
    raise exception 'ตัวกรองสถานะไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;

  return query
  with rows_all as (
    -- ── กลุ่มที่ 1–3: เริ่มจาก employees ──
    select u.id uid, u.username un, u.internal_username iu, u.email em, u.department ud,
           u.role::text rl, coalesce(u.status,'active') stt, coalesce(u.is_active,true) act,
           u.employee_id eid,
           e.emp_code ec,
           nullif(btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')),'') enm,
           e.department_name edept, e.position_name epos, e.status::text estat,
           u.created_at ca, u.updated_at ua,
           case when u.id is not null then 'LINKED'
                when ar.id is not null then 'WAITING_LINK'
                else 'WAITING_REGISTER' end rst,
           ar.id rid, ar.requested_at rat,
           e.first_name efn, e.last_name eln, e.nickname enk
      from public.employees e
      left join public.app_users u
             on u.employee_id = e.id and u.app_code = 'salary'
      left join public.njhr_activation_requests ar
             on ar.employee_id = e.id and ar.status = 'PENDING'
    union all
    -- ── กลุ่มที่ 4: บัญชีที่ยังไม่ผูกพนักงาน ──
    select u.id, u.username, u.internal_username, u.email, u.department,
           u.role::text, coalesce(u.status,'active'), coalesce(u.is_active,true),
           u.employee_id,
           null::text, null::text, null::text, null::text, null::text,
           u.created_at, u.updated_at,
           'ORPHAN_ACCOUNT', null::uuid, null::timestamptz,
           null::text, null::text, null::text
      from public.app_users u
     where u.app_code = 'salary' and u.employee_id is null
  ),
  base as (
    select * from rows_all b
     where (p_role is null or p_role = '' or upper(p_role) = coalesce(b.rl,''))
       and (st = '' or (st = 'ACTIVE'      and b.uid is not null and b.act)
                    or (st = 'INACTIVE'    and b.uid is not null and not b.act)
                    or (st = 'LINKED'      and b.eid is not null)
                    or (st = 'UNLINKED'    and b.eid is null)
                    or (st = 'REG_WAITING' and b.rst = 'WAITING_REGISTER')
                    or (st = 'REG_PENDING' and b.rst = 'WAITING_LINK')
                    or (st = 'REG_LINKED'  and b.rst = 'LINKED')
                    or (st = 'REG_ORPHAN'  and b.rst = 'ORPHAN_ACCOUNT'))
       and (p_dept is null or p_dept = '' or b.edept = p_dept)
       and (q = '' or lower(coalesce(b.un,'')) like '%'||q||'%'
            or lower(coalesce(b.iu,'')) like '%'||q||'%'
            or lower(coalesce(b.em,'')) like '%'||q||'%'
            or lower(coalesce(b.ec,'')) like '%'||q||'%'
            or lower(coalesce(b.efn,'')||' '||coalesce(b.eln,'')) like '%'||q||'%'
            or lower(coalesce(b.enk,'')) like '%'||q||'%'
            or lower(coalesce(b.edept,'')) like '%'||q||'%')
  )
  select b.uid, b.un, b.iu, b.em, b.ud, b.rl, b.stt, b.act, b.eid,
         b.ec, b.enm, b.edept, b.epos, b.estat,
         case when b.eid is null then 'ยังไม่เชื่อมพนักงาน'
              when b.ec is null then 'ข้อมูลเชื่อมโยงไม่ถูกต้อง'
              else 'เชื่อมแล้ว' end,
         b.ca, b.ua, (select count(*) from base),
         b.rst, b.rid, b.rat
    from base b
   order by case b.rst when 'WAITING_LINK' then 0 when 'WAITING_REGISTER' then 1
                       when 'LINKED' then 2 else 3 end,
            b.ec nulls last, b.un
   limit least(greatest(coalesce(p_limit,50),1),200) offset greatest(coalesce(p_offset,0),0);
end $$;

grant execute on function public.njhr_member_list(text,text,text,text,text,int,int)
  to anon, authenticated;


-- ─── 7) VERIFICATION — อ่านอย่างเดียว ────────────────────────
select jsonb_pretty(jsonb_build_object(
  'submit_signature',   (select pg_get_function_identity_arguments(p.oid) from pg_proc p
                           join pg_namespace n on n.oid=p.pronamespace
                          where n.nspname='public' and p.proname='njhr_activation_submit'),
  'submit_overloads',   (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                          where n.nspname='public' and p.proname='njhr_activation_submit'),
  'list_installed',     (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                          where n.nspname='public' and p.proname='njhr_activation_list'),
  'link_installed',     (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                          where n.nspname='public' and p.proname='njhr_activation_link'),
  'member_list_installed', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                             where n.nspname='public' and p.proname='njhr_member_list'),
  'new_columns',        (select coalesce(jsonb_agg(column_name order by column_name),'[]'::jsonb)
                           from information_schema.columns
                          where table_schema='public' and table_name='njhr_activation_requests'
                            and column_name in ('first_name','first_name_en','last_name_en')),
  'case_a_exact_match', (select count(*) from public.employees e
                          where public.njhr_norm_en(e.last_name_en) is not null
                            and not exists (select 1 from public.app_users u
                                             where u.app_code='salary' and u.employee_id=e.id)),
  'case_b_review',      (select count(*) from public.employees e
                          where public.njhr_norm_en(e.last_name_en) is null
                            and not exists (select 1 from public.app_users u
                                             where u.app_code='salary' and u.employee_id=e.id)),
  'member_rows_total',  (select count(*) from public.employees)
                        + (select count(*) from public.app_users
                            where app_code='salary' and employee_id is null),
  'untouched', jsonb_build_object(
     'njhr_login',       exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                 where n.nspname='public' and p.proname='njhr_login'),
     'njhr_list_users',  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                 where n.nspname='public' and p.proname='njhr_list_users'),
     'njhr_user_delete', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                 where n.nspname='public' and p.proname='njhr_user_delete'),
     'njhr_activation_reject', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                 where n.nspname='public' and p.proname='njhr_activation_reject'))
)) as install_report;


-- ─── 8) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_member_list(text,text,text,text,text,int,int);
-- drop function if exists public.njhr_activation_submit(text,text,text,text,text,text,text,text);
-- drop function if exists public.njhr_activation_list(text,text);
-- drop function if exists public.njhr_norm_en(text);
-- แล้วรัน Source เดิมของ njhr_activation_submit / _list / _link จาก
--   rollback/before_activation_en/PROD_RPC_BEFORE.sql
-- คอลัมน์ที่เพิ่ม (first_name · first_name_en · last_name_en) เป็น nullable
--   ปล่อยไว้ได้โดยไม่กระทบของเดิม หรือถอนด้วย:
-- alter table public.njhr_activation_requests
--   drop column if exists first_name, drop column if exists first_name_en,
--   drop column if exists last_name_en;
-- delete from public.njhr_schema_version where version='v12.0-activation-en';
