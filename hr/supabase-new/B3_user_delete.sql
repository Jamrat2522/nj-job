-- ============================================================
-- NJ HR V2 — B3_user_delete.sql
-- ลบบัญชี USER ที่ยังไม่ได้เชื่อมพนักงาน เพื่อเปิดทางให้พนักงานสมัครใหม่
--
-- ขอบเขต: สร้าง RPC ใหม่ 1 ตัวเท่านั้น
--   · ไม่สร้าง/ไม่ลบ/ไม่แก้ตารางใด ๆ
--   · ไม่แตะ njhr_login · njhr_ctx · njhr_user_save · njhr_user_link · njhr_user_password
--   · ไม่แตะ admin_delete_user (ทำงานบน public.users ซึ่งเป็นคนละตารางกับ app_users
--     และเป็นของแอปอื่นที่ใช้ฐานข้อมูลร่วมกัน — แก้แล้วจะกระทบแอปอื่น)
--   · ไม่แตะ employees · leave_requests · Approval Workflow · OT · Payroll · Attendance
--   · ไม่แตะ app_code อื่น
--
-- อ้างอิงผลตรวจจริงจาก B1 + B2 (build njhr-v2-7d92b738):
--   FK ที่ชี้ app_users มี 4 ตัว
--     njhr_sessions.app_user_id                  ON DELETE CASCADE   → ลบตามเอง
--     notifications.user_id                      ON DELETE CASCADE   → ลบตามเอง
--     njhr_activation_requests.decided_by        NO ACTION           → ต้องตรวจก่อน
--     njhr_activation_requests.linked_user_id    NO ACTION           → ต้องตรวจก่อน
--   บัญชีเป้าหมาย 54 บัญชี · ไม่มีตัวใดถูก njhr_activation_requests อ้างอิง (blocked_accounts = 0)
--   audit_log.actor เป็น text ไม่มี FK → ประวัติไม่หายหลังลบ
--   unique index เป็นคู่กับ app_code ทุกตัว → ลบใน salary แล้วสมัคร username/email เดิมใหม่ได้
--   app_users: rls_enabled = true · force_rls = false · owner = postgres
--     → SECURITY DEFINER ที่ postgres เป็นเจ้าของทำงานผ่าน RLS ได้ตามปกติ
--
-- รันซ้ำได้ (create or replace)
-- ============================================================

-- ─── 0) PRE-FLIGHT — ตรวจของจริงก่อน ไม่เดา ──────────────────
do $$
declare n int;
begin
  if to_regclass('public.app_users') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง app_users'; end if;
  if to_regclass('public.njhr_sessions') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง njhr_sessions'; end if;
  if to_regclass('public.audit_log') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง audit_log'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                  where ns.nspname = 'public' and p.proname = 'njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                  where ns.nspname = 'public' and p.proname = 'njhr_user_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_user_guard — รัน 52_users.sql ก่อน'; end if;

  -- คอลัมน์ของ audit_log ที่ RPC นี้เขียน ต้องมีครบ (ยืนยันจาก B1 บล็อก 9)
  select count(*) into n from information_schema.columns
   where table_schema = 'public' and table_name = 'audit_log'
     and column_name in ('app_code','actor','actor_role','action','module',
                         'entity','entity_id','detail','old_value','new_value');
  if n <> 10 then
    raise exception 'PREFLIGHT: audit_log ขาดคอลัมน์ที่ต้องใช้ (พบ % จาก 10)', n; end if;

  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ลบบัญชี USER ที่ยังไม่ได้เชื่อมพนักงาน ───────────────
-- เงื่อนไขบังคับฝั่งเซิร์ฟเวอร์ทั้งหมด — ไม่พึ่งการซ่อนปุ่มบน Frontend
create or replace function public.njhr_user_delete(p_token text, p_user_id uuid)
returns table (deleted_user_id uuid, username text, sessions_removed int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; t record; oldrow jsonb; v_sess int := 0; v_block text;
begin
  -- (1) Session ถูกต้อง + (2) สิทธิ์
  --     njhr_user_guard(write) ยอม SUPER_ADMIN และ ADMIN
  --     แต่ระบบเดิม "ไม่มี" RPC ลบบัญชีมาก่อน ADMIN จึงไม่เคยมีสิทธิ์ลบ
  --     จึงคงไว้เฉพาะ SUPER_ADMIN ตามที่ระบุ ไม่เพิ่มสิทธิ์ใหม่โดยเดา
  select * into c from public.njhr_user_guard(p_token, true);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบบัญชีได้' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'ไม่ได้ระบุบัญชีที่ต้องการลบ' using errcode = '22023';
  end if;

  -- (3) target ต้องอยู่ใน app_code = 'salary' เท่านั้น
  select u.id, u.username, u.email, u.role::text as role, u.employee_id, u.app_code
    into t
    from public.app_users u
   where u.id = p_user_id and u.app_code = 'salary';
  if not found then
    raise exception 'ไม่พบบัญชีผู้ใช้นี้ในระบบ HR' using errcode = 'P0002';
  end if;

  -- (6) ห้ามลบบัญชีของผู้เรียกเอง
  if t.id = c.app_user_id then
    raise exception 'ลบบัญชีของตนเองไม่ได้' using errcode = '42501';
  end if;

  -- (4) role ต้องเป็น USER เท่านั้น
  if t.role <> 'USER' then
    raise exception 'ลบได้เฉพาะบัญชีสิทธิ์ USER เท่านั้น (บัญชีนี้เป็น %)', t.role
      using errcode = '42501';
  end if;

  -- (5) ต้องยังไม่เชื่อมพนักงาน
  if t.employee_id is not null then
    raise exception 'บัญชีนี้เชื่อมกับข้อมูลพนักงานแล้ว ต้องยกเลิกการเชื่อมก่อนจึงจะลบได้'
      using errcode = '42501';
  end if;

  -- (7) ตรวจ Dependency ที่บล็อกการลบ ก่อนลงมือ
  --     njhr_activation_requests มี FK แบบ NO ACTION สองตัว
  --     ถ้าติด ให้ตอบด้วยข้อความที่อ่านรู้เรื่อง ไม่ปล่อยให้เป็น error ดิบของฐานข้อมูล
  if to_regclass('public.njhr_activation_requests') is not null then
    select case
             when exists (select 1 from public.njhr_activation_requests r where r.decided_by = t.id)
               then 'บัญชีนี้เคยอนุมัติคำขอเปิดใช้งานบัญชีไว้'
             when exists (select 1 from public.njhr_activation_requests r where r.linked_user_id = t.id)
               then 'บัญชีนี้ผูกอยู่กับคำขอเปิดใช้งานบัญชี'
           end into v_block;
    if v_block is not null then
      raise exception '% จึงลบไม่ได้ กรุณาแจ้งผู้พัฒนา', v_block using errcode = '23503';
    end if;
  end if;

  -- เก็บค่าเดิมไว้ลง Audit ก่อนลบ (ตัดรหัสผ่านทุกรูปแบบออก)
  select to_jsonb(u) - 'password' - 'password_hash' into oldrow
    from public.app_users u where u.id = t.id;

  -- (8) เพิกถอน Session ของบัญชีเป้าหมายก่อน
  --     njhr_sessions.app_user_id เป็น ON DELETE CASCADE อยู่แล้ว
  --     แต่ลบตรงนี้ด้วยเพื่อให้จำนวนที่ถูกเพิกถอนรายงานกลับได้ และไม่พึ่ง CASCADE อย่างเดียว
  delete from public.njhr_sessions s where s.app_user_id = t.id;
  get diagnostics v_sess = row_count;

  -- (9) ลบบัญชีจริง — จำกัด app_code ซ้ำอีกชั้นกัน race condition
  delete from public.app_users u where u.id = t.id and u.app_code = 'salary';
  if not found then
    raise exception 'ลบบัญชีไม่สำเร็จ กรุณาลองใหม่' using errcode = 'P0002';
  end if;

  -- (10) Audit — actor เป็น text ไม่มี FK ประวัติจึงอยู่ต่อแม้บัญชีถูกลบแล้ว
  insert into public.audit_log(app_code, actor, actor_role, action, module,
                               entity, entity_id, detail, old_value, new_value)
  values ('salary', c.username, c.role, 'USER_DELETE', 'user',
          'app_users', t.id::text,
          'ลบบัญชี ' || t.username || ' (ยังไม่เชื่อมพนักงาน) · เพิกถอน session ' || v_sess || ' รายการ',
          oldrow, null);

  return query select t.id, t.username, v_sess;
end $$;

grant execute on function public.njhr_user_delete(text, uuid) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v11.9-user-delete', 'ลบบัญชี USER ที่ยังไม่เชื่อมพนักงาน (SUPER_ADMIN เท่านั้น)')
on conflict (version) do nothing;


-- ─── 2) VERIFICATION — อ่านอย่างเดียว ────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function_installed', (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                          where n.nspname = 'public' and p.proname = 'njhr_user_delete'),
  'signature', (select pg_get_function_identity_arguments(p.oid) from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'njhr_user_delete'),
  'security_definer', (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname = 'public' and p.proname = 'njhr_user_delete'),
  'deletable_now', (select count(*) from public.app_users u
                     where u.app_code = 'salary' and u.role::text = 'USER' and u.employee_id is null),
  'protected_linked_users', (select count(*) from public.app_users u
                              where u.app_code = 'salary' and u.employee_id is not null),
  'protected_admins', (select count(*) from public.app_users u
                        where u.app_code = 'salary' and u.role::text in ('ADMIN','SUPER_ADMIN')),
  'other_app_codes_untouched', (select count(*) from public.app_users where app_code <> 'salary'),
  'login_untouched', exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'public' and p.proname = 'njhr_login'),
  'admin_delete_user_untouched', exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                         where n.nspname = 'public' and p.proname = 'admin_delete_user')
)) as install_report;


-- ─── 3) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_user_delete(text, uuid);
-- delete from public.njhr_schema_version where version = 'v11.9-user-delete';
-- (ไม่มีการเปลี่ยนโครงสร้างตารางใด ๆ จึงไม่ต้องย้อนอย่างอื่น)
