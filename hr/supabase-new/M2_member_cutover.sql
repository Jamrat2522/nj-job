-- ============================================================
-- NJ HR V2 — M2_member_cutover.sql
-- ONE-TIME CUTOVER: บังคับพนักงานสมัครสมาชิกใหม่ทั้งหมด ยกเว้น SUPER_ADMIN 2 คน
--
-- ⚠️ ไฟล์นี้ "เขียนให้ตรวจ" ยังห้ามรัน Production ตามที่อนุมัติข้อ 6
-- ⚠️ ก่อนรันจริงต้อง Backup 3 ตาราง (หมวด 1 ของไฟล์นี้ทำให้อัตโนมัติ)
-- ⚠️ Rollback อยู่ในไฟล์แยก M2_rollback.sql
--
-- ยืนยันจาก PRE-FLIGHT บน Production จริง (M1):
--   SUPER_ADMIN = 2  → jamrat/0001 · soontaree/0002   (B_STOP_IF_NOT_2 = OK)
--   ADMIN = 4 · USER = 51 · บัญชีทั้งหมด 57 · linked 57 · unlinked 0
--   employees: ACTIVE 105 · RESIGNED 3 · ไม่มี PROBATION
--   ขอบเขต Cutover 55 บัญชี (USER 51 + ADMIN 4) · ผูกกับพนักงานลาออก 0
--   พนักงาน ACTIVE ที่ยังไม่มีบัญชี 48 คน
--   กระทบยอด 55 + 48 = 103 = 105 − 2 SUPER_ADMIN ✔
--   njhr_activation_requests ว่าง (ไม่มี PENDING เก่าต้องปิด)
--   app_users.status: text NOT NULL default 'active' · ไม่มี CHECK · ค่าที่ใช้อยู่มีแค่ 'active'
--   Username ชนกับ emp_code = ไม่มี · emp_code ซ้ำ = ไม่มี · emp_code ว่าง = 0 · Email ซ้ำ = ไม่มี
--   Session เก็บที่ public.njhr_sessions(app_user_id · token · expires_at · revoked)
--
-- ค่าที่อนุมัติ: status ใหม่ = 'registration_required'
-- ============================================================

-- หมายเหตุการรัน: Supabase SQL Editor ห่อทั้งสคริปต์เป็น Transaction เดียวอยู่แล้ว
-- และ COMMIT ให้อัตโนมัติเมื่อทุกคำสั่งผ่าน · ถ้ามีคำสั่งใดโยน exception จะ ROLLBACK ทั้งไฟล์
-- จึงไม่ใช้ \set / BEGIN / COMMIT (เป็นคำสั่งของ psql ไม่ใช่ SQL)
-- กลไกความปลอดภัยอยู่ที่ PREFLIGHT หมวด 0 และ ASSERT อัตโนมัติหมวด 4

-- ════════════════════════════════════════════════════════════
-- 0) PREFLIGHT — ไม่ผ่านข้อใดข้อหนึ่ง = rollback ทั้งไฟล์ ไม่มีการแก้ครึ่ง ๆ กลาง ๆ
-- ════════════════════════════════════════════════════════════
do $$
declare n int; m int; k int; bad text;
begin
  ---- 0.1 SUPER_ADMIN ต้องเป็น 2 บัญชีพอดี (ข้อ 2 · 9)
  select count(*) into n from public.app_users
   where app_code='salary' and role::text='SUPER_ADMIN';
  if n <> 2 then
    raise exception 'PREFLIGHT: SUPER_ADMIN = % บัญชี (ต้องเป็น 2) — STOP ห้าม Cutover', n;
  end if;

  ---- 0.2 ตารางและคอลัมน์ที่ไฟล์นี้ใช้ต้องมีจริง
  if to_regclass('public.njhr_sessions') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_sessions';
  end if;
  if to_regclass('public.njhr_activation_requests') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_activation_requests';
  end if;
  select string_agg(c, ', ') into bad from unnest(array[
    'id','username','email','role','employee_id','is_active','status','app_code',
    'password','password_hash','internal_username','department','updated_at']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='app_users' and column_name=c);
  if bad is not null then
    raise exception 'PREFLIGHT: app_users ขาดคอลัมน์ [%]', bad;
  end if;
  select string_agg(c, ', ') into bad from unnest(array[
    'app_user_id','token','expires_at','revoked']) c
   where not exists (select 1 from information_schema.columns
                      where table_schema='public' and table_name='njhr_sessions' and column_name=c);
  if bad is not null then
    raise exception 'PREFLIGHT: njhr_sessions ขาดคอลัมน์ [%]', bad;
  end if;

  ---- 0.3 status ต้องไม่มี CHECK ที่กันค่าใหม่
  select string_agg(con.conname, ', ') into bad
    from pg_constraint con join pg_class rel on rel.oid=con.conrelid
    join pg_namespace ns on ns.oid=rel.relnamespace
   where ns.nspname='public' and rel.relname='app_users' and con.contype='c'
     and pg_get_constraintdef(con.oid) ilike '%status%';
  if bad is not null then
    raise exception 'PREFLIGHT: พบ CHECK constraint บน status [%] — ตรวจก่อนว่ารับค่า registration_required ได้', bad;
  end if;

  ---- 0.4 ยอดต้องกระทบตรงกับ PRE-FLIGHT (ข้อ 5)
  select count(*) into n from public.app_users u
    join public.employees e on e.id = u.employee_id
   where u.app_code='salary' and u.role::text <> 'SUPER_ADMIN'
     and e.status::text in ('ACTIVE','PROBATION');
  select count(*) into m from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
     and not exists (select 1 from public.app_users u
                      where u.app_code='salary' and u.employee_id = e.id);
  select count(*) into k from public.employees e
   where e.status::text in ('ACTIVE','PROBATION')
     and not exists (select 1 from public.app_users u
                      where u.app_code='salary' and u.employee_id = e.id
                        and u.role::text = 'SUPER_ADMIN');
  if n + m <> k then
    raise exception 'PREFLIGHT: ยอดไม่กระทบ — มีบัญชีเดิม % + ยังไม่มีบัญชี % ≠ ต้องสมัครใหม่ %', n, m, k;
  end if;
  raise notice 'PREFLIGHT ผ่าน · ต้องสมัครใหม่ % คน (มีบัญชีเดิม % · ยังไม่มีบัญชี %)', k, n, m;

  ---- 0.5 Username จะไม่ชนเมื่อเปลี่ยนเป็น emp_code ตอนเชื่อม (ข้อ 22)
  select string_agg(e.emp_code, ', ') into bad
    from public.employees e
    join public.app_users u2 on u2.app_code='salary'
                            and lower(u2.username) = lower(btrim(e.emp_code))
   where e.status::text in ('ACTIVE','PROBATION')
     and u2.employee_id is distinct from e.id;
  if bad is not null then
    raise exception 'PREFLIGHT: emp_code ที่ถูกบัญชีอื่นใช้เป็น username อยู่ [%] — STOP', bad;
  end if;

  ---- 0.6 emp_code ต้องไม่ว่างและไม่ซ้ำ
  select count(*) into n from public.employees
   where status::text in ('ACTIVE','PROBATION') and coalesce(btrim(emp_code),'') = '';
  if n > 0 then raise exception 'PREFLIGHT: มีพนักงาน % คนที่ emp_code ว่าง', n; end if;
  select count(*) into n from (select emp_code from public.employees
    where status::text in ('ACTIVE','PROBATION') group by 1 having count(*) > 1) x;
  if n > 0 then raise exception 'PREFLIGHT: emp_code ซ้ำ % รหัส', n; end if;
end $$;


-- ════════════════════════════════════════════════════════════
-- 1) BACKUP — 3 ตารางตามข้อ 7 (สำเนาเต็ม ใช้โดย M2_rollback.sql)
--    ไม่แตะข้อมูลต้นทาง · ถ้ามีตารางสำเนาเดิมอยู่แล้ว = เคยรันมาก่อน → STOP
-- ════════════════════════════════════════════════════════════
do $$
begin
  if to_regclass('public.njhr_m2_bk_app_users') is not null then
    raise exception 'พบตารางสำเนา njhr_m2_bk_app_users อยู่แล้ว — เคยรัน M2 มาก่อน STOP';
  end if;
end $$;

create table public.njhr_m2_bk_app_users as
  select *, now() as backed_up_at from public.app_users where app_code = 'salary';
create table public.njhr_m2_bk_sessions as
  select *, now() as backed_up_at from public.njhr_sessions;
create table public.njhr_m2_bk_activation as
  select *, now() as backed_up_at from public.njhr_activation_requests;


-- ════════════════════════════════════════════════════════════
-- 2) CUTOVER — เปลี่ยนสถานะ + ปิดใช้งาน + revoke session
--    ไม่ DELETE · ไม่ลบ employee_id · ไม่แตะ role · ไม่แตะ password_hash (ข้อ 5 · 7 · 24)
--    SUPER_ADMIN ไม่อยู่ในเงื่อนไขเด็ดขาด (ข้อ 9)
-- ════════════════════════════════════════════════════════════
create temporary table njhr_m2_targets on commit drop as
  select u.id as user_id, u.username, e.emp_code, u.role::text as role
    from public.app_users u
    join public.employees e on e.id = u.employee_id
   where u.app_code = 'salary'
     and u.role::text <> 'SUPER_ADMIN'
     and e.status::text in ('ACTIVE','PROBATION');

update public.app_users u
   set status = 'registration_required',
       is_active = false,
       updated_at = now()
  from njhr_m2_targets t
 where u.id = t.user_id;

-- revoke ทุก session ของบัญชีกลุ่มนี้ (ข้อ 8) — SUPER_ADMIN ไม่ถูกแตะ
update public.njhr_sessions s
   set revoked = true
  from njhr_m2_targets t
 where s.app_user_id = t.user_id and not s.revoked;

-- ปิดคำขอเก่าที่ค้างอยู่อย่างปลอดภัย ไม่ Hard Delete (ข้อ 28)
-- PRE-FLIGHT พบว่าตารางว่าง คำสั่งนี้จึงมักไม่กระทบแถวใด แต่เก็บไว้กันกรณีมีคำขอแทรกก่อนรัน
update public.njhr_activation_requests
   set status = 'CANCELLED', decided_at = now(),
       reject_reason = 'System cutover — ต้องสมัครสมาชิกใหม่'
 where status = 'PENDING';


-- ════════════════════════════════════════════════════════════
-- 3) แก้ฟังก์ชัน 4 ตัว — คง Signature · Return type · SECURITY · search_path เดิมทุกตัว
-- ════════════════════════════════════════════════════════════

-- ─── 3.1 njhr_login ─────────────────────────────────────────
--  เพิ่มเงื่อนไข 1 ก้อนก่อนการตรวจ status ทั่วไป (ทางเลือก B ที่อนุมัติ)
--  Logic อื่นคงเดิมทุกบรรทัด: ข้อความปกปิดบัญชี · progressive rehash ·
--  server-side TTL 12h/30d · revoke session หมดอายุ · insert njhr_sessions
create or replace function public.njhr_login(
  p_username text, p_password text, p_ua text default null, p_remember boolean default false)
returns table (session_token text, expires_at timestamptz, user_id uuid, username text,
               internal_username text, email text, full_name text, department text,
               role text, status text, employee_id uuid, emp_code text, emp_name text,
               emp_department text, emp_position text, emp_status text)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare u public.app_users; ok boolean := false; tok text; exp timestamptz;
        v_ttl interval;
begin
  select a.* into u from public.app_users a
   where a.app_code = 'salary'
     and (lower(a.username) = lower(trim(p_username))
       or lower(coalesce(a.internal_username,'')) = lower(trim(p_username)))
   limit 1;

  if not found then
    raise exception 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' using errcode='28P01';
  end if;

  if u.password_hash is not null and u.password_hash like '$2%' then
    ok := (u.password_hash = crypt(p_password, u.password_hash));
  elsif u.password is not null and u.password <> '' then
    ok := (u.password = p_password);
    if ok then
      update public.app_users a
         set password_hash = crypt(p_password, gen_salt('bf', 10)), password = null
       where a.id = u.id;
    end if;
  end if;

  if not ok then
    raise exception 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' using errcode='28P01';
  end if;

  -- ★ เพิ่มใหม่: บัญชีที่ถูก Cutover ให้สมัครสมาชิกใหม่
  --   วางไว้ก่อนการตรวจ is_active/status ทั่วไป เพื่อให้ข้อความอ่านรู้เรื่อง
  --   ตรวจหลังยืนยันรหัสผ่านเหมือนเงื่อนไขอื่น จึงไม่เปิดเผยว่าบัญชีใดมีอยู่จริง
  if lower(coalesce(u.status,'active')) = 'registration_required' then
    raise exception 'กรุณากดสมัครสมาชิกครั้งแรกเพื่อใช้งานระบบ' using errcode='28000';
  end if;

  if coalesce(u.is_active,true) = false then
    raise exception 'บัญชีถูกปิดใช้งาน' using errcode='28000';
  end if;
  if lower(coalesce(u.status,'active')) = 'pending' then
    raise exception 'บัญชีรออนุมัติ กรุณาติดต่อผู้ดูแลระบบ' using errcode='28000';
  end if;
  if lower(coalesce(u.status,'active')) <> 'active' then
    raise exception 'บัญชีไม่พร้อมใช้งาน (สถานะ: %)', u.status using errcode = '28000';
  end if;
  if u.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ' using errcode='28000';
  end if;

  v_ttl := case when coalesce(p_remember, false)
                then interval '30 days' else interval '12 hours' end;

  update public.njhr_sessions ss set revoked = true
   where ss.app_user_id = u.id and ss.expires_at < now() and not ss.revoked;

  insert into public.njhr_sessions(app_user_id, user_agent, expires_at)
  values (u.id, left(coalesce(p_ua,''),200), now() + v_ttl)
    returning njhr_sessions.token, njhr_sessions.expires_at into tok, exp;

  return query
    select tok, exp, u.id, u.username, u.internal_username, u.email, u.full_name, u.department,
           u.role::text, coalesce(u.status,'active'), u.employee_id,
           e.emp_code, (coalesce(e.prefix,'')||e.first_name||' '||coalesce(e.last_name,'')),
           e.department_name, e.position_name, e.status::text
      from public.employees e where e.id = u.employee_id;
end $$;


-- ─── 3.2 njhr_member_list ───────────────────────────────────
--  เปลี่ยนจุดเดียว: เงื่อนไข JOIN ไม่นับบัญชีที่อยู่สถานะ registration_required
--  ผลคือแถวนั้นตกไปที่ WAITING_REGISTER (รอสมัคร) และ username แสดงเป็น —
--  ไม่ซ้ำกับกลุ่ม ORPHAN_ACCOUNT เพราะกลุ่มนั้นต้อง employee_id is null
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
            -- ★ บัญชีที่ถูก Cutover ยังไม่ถือว่า "เชื่อมแล้ว" จนกว่าจะสมัครใหม่และถูกเชื่อม
            and coalesce(u.status,'active') <> 'registration_required'
      left join public.njhr_activation_requests ar
             on ar.employee_id = e.id and ar.status = 'PENDING'
    union all
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


-- ─── 3.3 njhr_activation_submit ─────────────────────────────
--  เปลี่ยน 2 จุด · Validation อื่นคงเดิมทุกบรรทัด (ข้อ 12)
--   ① บัญชีเดิมที่อยู่สถานะ registration_required ไม่ถือว่า "มีบัญชีแล้ว" → สมัครได้
--   ② อีเมลของบัญชีเดิมของพนักงานคนเดียวกันไม่ถือว่าซ้ำ (ข้อ 13)
--      ของคนอื่นยังซ้ำไม่ได้เหมือนเดิม
create or replace function public.njhr_activation_submit(
  p_emp_code      text,
  p_first_name    text,
  p_last_name     text,
  p_first_name_en text,
  p_last_name_en  text,
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
  MSG_NOMATCH constant text :=
    'รหัสพนักงานหรือนามสกุลภาษาอังกฤษไม่ตรงกับข้อมูลพนักงาน กรุณาตรวจสอบและสมัครใหม่อีกครั้ง';
begin
  if v_code = '' or v_fnm = '' or v_lnm = '' or v_fen is null or v_len is null
     or v_nick = '' or v_mail = '' then
    return query select false, 'กรุณากรอกข้อมูลให้ครบทุกช่อง'::text; return;
  end if;
  if v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return query select false, 'รูปแบบอีเมลไม่ถูกต้อง'::text; return;
  end if;

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
  if v_emp_len is not null then
    if v_emp_len <> v_len then
      return query select false, MSG_NOMATCH; return;
    end if;
  end if;

  -- ① บัญชีเดิมที่ถูก Cutover ไม่บล็อกการสมัคร
  if exists (select 1 from public.app_users u
              where u.app_code = 'salary' and u.employee_id = v_emp.id
                and coalesce(u.status,'active') <> 'registration_required') then
    return query select false,
      'พนักงานรายนี้มีบัญชีผู้ใช้งานแล้ว กรุณาเข้าสู่ระบบหรือติดต่อผู้ดูแลระบบ'::text; return;
  end if;

  if exists (select 1 from public.njhr_activation_requests r
              where r.employee_id = v_emp.id and r.status = 'PENDING') then
    return query select false,
      'มีคำขอสมัครรอการเชื่อมอยู่แล้ว กรุณารอผู้ดูแลระบบสูงสุดเชื่อมบัญชี'::text; return;
  end if;

  -- ② อีเมลซ้ำ — ยกเว้นบัญชีเดิมของพนักงานคนเดียวกันเท่านั้น
  if exists (select 1 from public.app_users u
              where u.app_code = 'salary' and lower(btrim(u.email)) = v_mail
                and u.employee_id is distinct from v_emp.id) then
    return query select false, 'อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น'::text; return;
  end if;
  if exists (select 1 from public.njhr_activation_requests r
              where r.status = 'PENDING' and lower(btrim(r.new_email)) = v_mail
                and r.employee_id is distinct from v_emp.id) then
    return query select false, 'อีเมลนี้ถูกใช้แล้ว กรุณาใช้อีเมลอื่น'::text; return;
  end if;

  insert into public.njhr_activation_requests
    (employee_id, emp_code, first_name, last_name, first_name_en, last_name_en,
     new_nickname, new_email, password_hash)
  values (v_emp.id, v_code, v_fnm, v_lnm, v_fen, v_len, v_nick, v_mail,
          extensions.crypt(p_password, extensions.gen_salt('bf', 10)));

  return query select true,
    'ส่งคำขอสมัครเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบสูงสุดเชื่อมบัญชี'::text;
end $$;


-- ─── 3.4 njhr_activation_link ───────────────────────────────
--  Signature เดิม (p_token · p_request_id · p_username) ตามที่อนุมัติข้อ 3
--  เปลี่ยนพฤติกรรม:
--   · Server หา Account เดิมของพนักงานเอง ไม่ให้ผู้ดูแลเลือกบัญชีผิดคน
--   · p_username ว่าง = ทำงานได้ · ตรงกับ Account เดิม = ทำงานได้ · เป็นของคนอื่น = Reject
--   · username หลังเชื่อม = emp_code เสมอ (text · เลข 0 นำหน้าไม่หาย)
--   · Reuse app_users.id เดิม → Audit/Document/History ไม่ขาด (ข้อ 23)
--   · role เดิมคงไว้ ไม่บังคับเป็น USER (ข้อ 24) · บัญชีใหม่ใช้ USER ตาม Flow เดิม
--   · Row Lock กัน Double Click / กดพร้อมกันสองเครื่อง (ข้อ 34)
create or replace function public.njhr_activation_link(
  p_token text, p_request_id uuid, p_username text default null)
returns table (ok boolean, message text, user_id uuid)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; r record; e record; ex record;
        v_user uuid; v_un text; v_role text;
        v_emp_len text; v_req_un text := btrim(coalesce(p_username,''));
        old_nick text; old_mail text; old_role text; old_un text;
        old_fen text; old_len text;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่เชื่อมบัญชีได้' using errcode='42501';
  end if;

  select * into r from public.njhr_activation_requests where id = p_request_id for update;
  if not found then raise exception 'ไม่พบคำขอนี้' using errcode='P0002'; end if;
  if r.status <> 'PENDING' then
    raise exception 'คำขอนี้ถูกดำเนินการไปแล้ว' using errcode='22023'; end if;

  select * into e from public.employees where id = r.employee_id for update;
  if not found then raise exception 'ไม่พบข้อมูลพนักงาน' using errcode='P0002'; end if;

  if btrim(e.emp_code) <> r.emp_code then
    raise exception 'รหัสพนักงานเปลี่ยนไปจากตอนยื่นคำขอ กรุณาตรวจสอบ' using errcode='22023';
  end if;

  v_emp_len := public.njhr_norm_en(e.last_name_en);
  if v_emp_len is not null and v_emp_len <> public.njhr_norm_en(r.last_name_en) then
    raise exception 'นามสกุลภาษาอังกฤษในประวัติพนักงาน (%) ไม่ตรงกับที่พนักงานสมัคร (%) กรุณาตรวจสอบ',
      v_emp_len, public.njhr_norm_en(r.last_name_en) using errcode='22023';
  end if;

  if btrim(coalesce(r.new_nickname,'')) = '' or btrim(coalesce(r.new_email,'')) = ''
     or public.njhr_norm_en(r.last_name_en) is null then
    raise exception 'ข้อมูลในคำขอไม่ครบ จึงเชื่อมไม่ได้' using errcode='22023';
  end if;

  old_nick := e.nickname; old_mail := e.email;
  old_fen  := e.first_name_en; old_len := e.last_name_en;

  -- ★ Server resolve บัญชีเดิมของพนักงานคนนี้เอง (ล็อกแถวไว้ด้วย)
  select u.id, u.username, u.role::text, coalesce(u.status,'active') as stt
    into ex
    from public.app_users u
   where u.app_code = 'salary' and u.employee_id = e.id
   for update;

  -- ★ ตรวจ p_username ตามที่อนุมัติ: ว่าง = ผ่าน · ตรงบัญชีเดิม = ผ่าน · อื่น = Reject
  if v_req_un <> '' then
    if ex.id is null or lower(ex.username) <> lower(v_req_un) then
      raise exception 'บัญชี "%" ไม่ใช่บัญชีเดิมของพนักงาน % จึงเชื่อมไม่ได้', v_req_un, r.emp_code
        using errcode='42501';
    end if;
  end if;

  v_un := r.emp_code;   -- username = รหัสพนักงานเสมอ (ข้อ 21)

  if ex.id is not null then
    -- ── กรณีมีบัญชีเดิม ──
    if ex.stt <> 'registration_required' then
      raise exception 'พนักงานคนนี้มีบัญชีใช้งานอยู่แล้ว (%) จึงเชื่อมซ้ำไม่ได้', ex.username
        using errcode='23505';
    end if;
    -- username ใหม่ต้องไม่ชนบัญชีอื่น (ข้อ 22 — ห้ามเติมเลขสุ่ม ให้ STOP รายนั้น)
    if exists (select 1 from public.app_users u
                where u.app_code='salary' and lower(u.username) = lower(v_un)
                  and u.id <> ex.id) then
      raise exception 'ชื่อผู้ใช้ % ถูกบัญชีอื่นใช้อยู่แล้ว กรุณาตรวจสอบก่อน', v_un
        using errcode='23505';
    end if;
    old_un := ex.username; old_role := ex.role; v_user := ex.id; v_role := ex.role;

    update public.app_users
       set username      = v_un,
           email         = r.new_email,
           password_hash = r.password_hash,
           password      = null,
           is_active     = true,
           status        = 'active',
           updated_at    = now()
     where id = ex.id;                      -- role ไม่แตะ · employee_id ไม่แตะ · id เดิม
  else
    -- ── พนักงานใหม่ที่ไม่เคยมีบัญชี — Flow เดิมทุกอย่าง ──
    if exists (select 1 from public.app_users u
                where u.app_code='salary' and lower(u.username) = lower(v_un)) then
      raise exception 'ชื่อผู้ใช้ % ถูกใช้ไปแล้ว กรุณาตรวจสอบก่อน', v_un using errcode='23505';
    end if;
    old_un := null; old_role := null; v_role := 'USER';

    insert into public.app_users
      (username, email, full_name, role, employee_id, is_active, status,
       app_code, password_hash, department, created_by)
    values (v_un, r.new_email,
            btrim(coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,'')),
            'USER'::public.user_role, e.id, true, 'active',
            'salary', r.password_hash, e.department_name, c.app_user_id)
    returning id into v_user;
  end if;

  update public.employees
     set first_name_en = public.njhr_norm_en(r.first_name_en),
         last_name_en  = public.njhr_norm_en(r.last_name_en),
         nickname      = r.new_nickname,
         email         = r.new_email
   where id = e.id;

  update public.njhr_activation_requests
     set status = 'LINKED', decided_at = now(),
         decided_by = c.app_user_id, linked_user_id = v_user
   where id = r.id;

  perform public.njhr_audit_write(p_token, 'ACTIVATION_LINK', 'user', 'app_users', v_user::text,
    'เชื่อมบัญชี ' || v_un || ' กับพนักงาน ' || r.emp_code ||
    case when old_un is not null then ' · ใช้บัญชีเดิม ' || old_un else ' · สร้างบัญชีใหม่' end,
    jsonb_build_object('username', old_un, 'first_name_en', old_fen, 'last_name_en', old_len,
                       'nickname', old_nick, 'email', old_mail, 'role', old_role),
    jsonb_build_object('username', v_un,
                       'first_name_en', public.njhr_norm_en(r.first_name_en),
                       'last_name_en',  public.njhr_norm_en(r.last_name_en),
                       'nickname', r.new_nickname, 'email', r.new_email, 'role', v_role),
    null);

  return query select true, 'เชื่อมบัญชีเรียบร้อยแล้ว พนักงานเข้าสู่ระบบได้ทันที'::text, v_user;
end $$;


-- ─── 3.5 njhr_user_link ─────────────────────────────────────
--  ปิดทางลัดข้าม Activation Flow (ข้อ 16 · 17)
--  · p_employee = null (ยกเลิกการเชื่อม) → คงพฤติกรรมเดิมทุกอย่าง
--  · p_employee ไม่ null → ต้องมีคำขอ PENDING ของพนักงานคนนั้นเท่านั้น
--    ตรวจฝั่ง Server ไม่พึ่งการซ่อนปุ่ม
create or replace function public.njhr_user_link(
  p_token text, p_user_id uuid, p_employee uuid default null)
returns table (user_id uuid, employee_id uuid, emp_code text, emp_name text)
language plpgsql security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare c record; v_emp record; v_msg text;
begin
  select * into c from public.njhr_user_guard(p_token, true);
  if not exists (select 1 from public.app_users u where u.id = p_user_id and u.app_code = 'salary') then
    raise exception 'ไม่พบบัญชีผู้ใช้นี้' using errcode='P0002';
  end if;
  if p_employee is not null then
    select * into v_emp from public.employees where id = p_employee;
    if not found then raise exception 'ไม่พบพนักงานคนนี้' using errcode='P0002'; end if;
    if v_emp.status::text <> 'ACTIVE' then
      raise exception 'พนักงาน % ไม่ได้อยู่ในสถานะปฏิบัติงาน', v_emp.emp_code using errcode='22023';
    end if;
    if exists (select 1 from public.app_users u
                where u.app_code = 'salary' and u.employee_id = p_employee and u.id <> p_user_id) then
      raise exception 'พนักงาน % ถูกเชื่อมกับบัญชีผู้ใช้อื่นอยู่แล้ว', v_emp.emp_code using errcode='23505';
    end if;
    -- ★ ห้ามเชื่อมถ้าพนักงานยังไม่สมัคร (Acceptance Rule ข้อ 32)
    if not exists (select 1 from public.njhr_activation_requests r
                    where r.employee_id = p_employee and r.status = 'PENDING') then
      raise exception 'พนักงาน % ยังไม่ได้สมัครสมาชิก จึงเชื่อมบัญชีไม่ได้ '
                      '— ต้องให้พนักงานกดสมัครสมาชิกครั้งแรกก่อน', v_emp.emp_code
        using errcode='42501';
    end if;
  end if;
  update public.app_users set employee_id = p_employee, updated_at = now()
   where app_users.id = p_user_id;
  if p_employee is null then v_msg := 'ยกเลิกการเชื่อมพนักงาน';
  else v_msg := 'เชื่อมกับพนักงาน ' || v_emp.emp_code; end if;
  perform public.njhr_audit_write(p_token,
    case when p_employee is null then 'USER_UNLINK' else 'USER_LINK' end,
    'user', 'app_users', p_user_id::text, v_msg, null, null, null);
  return query
  select u.id, u.employee_id, e.emp_code,
         btrim(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,''))
    from public.app_users u left join public.employees e on e.id = u.employee_id
   where u.id = p_user_id;
end $$;


insert into public.njhr_schema_version(version, note)
values ('v2.7-member-cutover',
        'บังคับสมัครสมาชิกใหม่ทั้งหมด ยกเว้น SUPER_ADMIN 2 คน · status=registration_required')
on conflict (version) do nothing;


-- ════════════════════════════════════════════════════════════
-- 4) ASSERT อัตโนมัติ — ผิดข้อใดข้อหนึ่ง = raise = ROLLBACK ทั้งไฟล์เอง
--    ไม่ต้องพิมพ์ COMMIT/ROLLBACK เอง (Editor จัดการให้)
-- ════════════════════════════════════════════════════════════
do $$
declare n int; m int; bad text;
begin
  ---- 4.1 SUPER_ADMIN 2 คนต้องไม่ถูกแตะแม้แต่ช่องเดียว (ข้อ 9)
  select string_agg(u.username, ', ') into bad
    from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where u.app_code='salary' and u.role::text='SUPER_ADMIN'
     and (u.username      is distinct from b.username
       or u.password_hash is distinct from b.password_hash
       or u.password      is distinct from b.password
       or u.status        is distinct from b.status
       or u.is_active     is distinct from b.is_active
       or u.role          is distinct from b.role
       or u.employee_id   is distinct from b.employee_id
       or u.email         is distinct from b.email);
  if bad is not null then
    raise exception 'ASSERT ล้มเหลว: SUPER_ADMIN ถูกแก้ [%] — ยกเลิกทั้งหมด', bad;
  end if;

  select count(*) into n from public.app_users
   where app_code='salary' and role::text='SUPER_ADMIN'
     and coalesce(status,'active')='active' and coalesce(is_active,true);
  if n <> 2 then
    raise exception 'ASSERT ล้มเหลว: SUPER_ADMIN ที่ใช้งานได้เหลือ % บัญชี (ต้องเป็น 2)', n;
  end if;

  ---- 4.2 SUPER_ADMIN ต้องไม่มี session ถูก revoke จาก Cutover นี้ (ข้อ 8)
  select count(*) into n
    from public.njhr_sessions s
    join public.njhr_m2_bk_sessions b on b.token = s.token
    join public.app_users u on u.id = s.app_user_id
   where u.role::text='SUPER_ADMIN' and s.revoked and not b.revoked;
  if n > 0 then
    raise exception 'ASSERT ล้มเหลว: session ของ SUPER_ADMIN ถูก revoke % รายการ', n;
  end if;

  ---- 4.3 บัญชีที่ถูก Cutover ต้องไม่เหลือ session ที่ยังใช้ได้
  select count(*) into n
    from public.njhr_sessions s
    join public.app_users u on u.id = s.app_user_id
   where u.app_code='salary' and u.status='registration_required' and not s.revoked;
  if n > 0 then
    raise exception 'ASSERT ล้มเหลว: ยังมี session ใช้งานได้ของบัญชีที่ต้องสมัครใหม่ % รายการ', n;
  end if;

  ---- 4.4 จำนวนที่ถูก Cutover ต้องตรงกับที่ PREFLIGHT นับไว้
  select count(*) into n from public.app_users
   where app_code='salary' and status='registration_required';
  select count(*) into m from public.njhr_m2_bk_app_users b
    join public.employees e on e.id = b.employee_id
   where b.role::text <> 'SUPER_ADMIN' and e.status::text in ('ACTIVE','PROBATION');
  if n <> m then
    raise exception 'ASSERT ล้มเหลว: Cutover % บัญชี แต่ควรเป็น % บัญชี', n, m;
  end if;

  ---- 4.5 ไม่มีบัญชีใดถูกลบ และ employee_id ไม่หาย (ข้อ 5 · 7)
  select count(*) into n from public.njhr_m2_bk_app_users b
   where not exists (select 1 from public.app_users u where u.id = b.id);
  if n > 0 then raise exception 'ASSERT ล้มเหลว: บัญชีหายไป % แถว', n; end if;
  select count(*) into n from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where b.employee_id is not null and u.employee_id is null;
  if n > 0 then raise exception 'ASSERT ล้มเหลว: employee_id หายไป % แถว', n; end if;

  ---- 4.6 role ต้องไม่เปลี่ยนแม้แต่บัญชีเดียว (ข้อ 24)
  select count(*) into n from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where u.role is distinct from b.role;
  if n > 0 then raise exception 'ASSERT ล้มเหลว: role เปลี่ยน % บัญชี', n; end if;

  ---- 4.7 password_hash ของบัญชีที่ถูก Cutover ต้องไม่ถูกแตะ
  select count(*) into n from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where u.status='registration_required' and u.password_hash is distinct from b.password_hash;
  if n > 0 then raise exception 'ASSERT ล้มเหลว: password_hash ถูกแก้ % บัญชี', n; end if;

  raise notice 'ASSERT ผ่านครบทุกข้อ — Cutover สำเร็จ';
end $$;


-- ── สรุปผลให้อ่านด้วยตา (อ่านอย่างเดียว) ────────────────────
select jsonb_pretty(jsonb_build_object(
  'super_admin_untouched', (select jsonb_agg(jsonb_build_object(
      'username', u.username, 'role', u.role::text, 'status', u.status,
      'is_active', u.is_active,
      'password_unchanged', (u.password_hash is not distinct from b.password_hash),
      'username_unchanged', (u.username = b.username)) order by u.username)
    from public.app_users u
    join public.njhr_m2_bk_app_users b on b.id = u.id
   where u.app_code='salary' and u.role::text='SUPER_ADMIN'),

  'cutover_counts', jsonb_build_object(
    'accounts_registration_required',
      (select count(*) from public.app_users
        where app_code='salary' and status='registration_required'),
    'accounts_still_active',
      (select count(*) from public.app_users
        where app_code='salary' and coalesce(status,'active')='active'),
    'sessions_revoked_now',
      (select count(*) from public.njhr_sessions s
        join public.app_users u on u.id = s.app_user_id
       where u.app_code='salary' and u.status='registration_required' and s.revoked)),

  'member_status_after', jsonb_build_object(
    'waiting_register',
      (select count(*) from public.employees e
        where e.status::text in ('ACTIVE','PROBATION')
          and not exists (select 1 from public.njhr_activation_requests r
                           where r.employee_id=e.id and r.status='PENDING')
          and not exists (select 1 from public.app_users u
                           where u.app_code='salary' and u.employee_id=e.id
                             and coalesce(u.status,'active') <> 'registration_required')),
    'waiting_link',
      (select count(*) from public.njhr_activation_requests where status='PENDING'),
    'linked',
      (select count(*) from public.app_users u
        join public.employees e on e.id=u.employee_id
       where u.app_code='salary' and coalesce(u.status,'active')='active'
         and e.status::text in ('ACTIVE','PROBATION'))),

  'protected_tables', jsonb_build_object(
    'employees',    (select count(*) from public.employees),
    'app_users',    (select count(*) from public.app_users),
    'attendance',   (select count(*) from public.attendance),
    'leave_requests', (select count(*) from public.leave_requests),
    'ot_requests',  (select count(*) from public.ot_requests),
    'employee_shifts', (select count(*) from public.employee_shifts),
    'activation_requests', (select count(*) from public.njhr_activation_requests)),

  'sample_0276', (select jsonb_build_object(
      'emp_code', e.emp_code, 'username', u.username, 'role', u.role::text,
      'status', coalesce(u.status,'active'), 'is_active', u.is_active,
      'employee_id_kept', (u.employee_id is not null))
    from public.employees e
    join public.app_users u on u.employee_id = e.id and u.app_code='salary'
   where e.emp_code = '0276'),

  'backup_rows', jsonb_build_object(
    'app_users', (select count(*) from public.njhr_m2_bk_app_users),
    'sessions',  (select count(*) from public.njhr_m2_bk_sessions),
    'activation',(select count(*) from public.njhr_m2_bk_activation))
)) as m2_verification;
