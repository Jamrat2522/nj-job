-- ============================================================
-- B2_inspect_user_delete_blockers.sql
-- รอบตรวจที่ 2 — เจาะเฉพาะจุดที่ B1 ตอบไม่ครบ
--
-- ⚠ READ-ONLY ทั้งไฟล์ · คำสั่งเดียว · คืน JSON ก้อนเดียว
--   ไม่มี CREATE / ALTER / DROP / INSERT / UPDATE / DELETE แม้แต่คำสั่งเดียว
--
-- ทำไมต้องมีรอบ 2:
--   B1 พบว่าตัวบล็อก Hard Delete คือ njhr_activation_requests (decided_by · linked_user_id)
--   ซึ่ง B1 บล็อก 7 ไม่ได้นับ จึงยังไม่รู้ว่ากระทบ 54 บัญชีที่จะลบจริงหรือไม่
--   และพบ RPC เดิมชื่อ admin_delete_user ที่ต้องอ่าน Body ก่อนตัดสินใจว่าจะใช้ซ้ำหรือไม่
--
-- วิธีใช้: Supabase SQL Editor → วาง → Run → คัดลอกผล JSON ทั้งก้อนกลับมา
-- ============================================================

with

-- บัญชีที่เข้าเงื่อนไขลบ: app_code='salary' · role='USER' · employee_id IS NULL
cand as (
  select u.id, u.username
    from public.app_users u
   where u.app_code = 'salary'
     and u.role::text = 'USER'
     and u.employee_id is null),

-- ─── A) ตัวบล็อกจริง: njhr_activation_requests ───────────────
--     ถ้าทั้งสองค่าเป็น 0 = FK NO ACTION ไม่ขวางบัญชีชุดนี้ → ลบได้
a as (
  select jsonb_build_object(
    'candidates', (select count(*) from cand),
    'blocked_by_decided_by',
      (select count(*) from public.njhr_activation_requests r
        where r.decided_by in (select id from cand)),
    'blocked_by_linked_user_id',
      (select count(*) from public.njhr_activation_requests r
        where r.linked_user_id in (select id from cand)),
    'blocked_accounts',
      (select count(distinct c.id) from cand c
        where exists (select 1 from public.njhr_activation_requests r
                       where r.decided_by = c.id or r.linked_user_id = c.id)),
    'blocked_usernames',
      (select coalesce(jsonb_agg(distinct c.username), '[]'::jsonb) from cand c
        where exists (select 1 from public.njhr_activation_requests r
                       where r.decided_by = c.id or r.linked_user_id = c.id))
  ) as j),

-- ─── B) ตารางที่เก็บ app_user_id แต่ไม่มี FK (เหลือแถวกำพร้า) ─
--     ไม่บล็อกการลบ แต่ควรรู้ว่าจะเหลือขยะหรือไม่
b as (
  select jsonb_build_object(
    'njhr_push_subs', (select count(*) from public.njhr_push_subs p
                        where p.app_user_id in (select id from cand)),
    'njhr_ann_reads', (select count(*) from public.njhr_ann_reads n
                        where n.app_user_id in (select id from cand))
  ) as j),

-- ─── C) ประวัติที่อ้างด้วย "ชื่อผู้ใช้" (text ไม่ใช่ FK) ──────
--     ลบบัญชีแล้วประวัติไม่หาย — ยืนยันจำนวนเพื่อความมั่นใจ
c as (
  select jsonb_build_object(
    'audit_log_rows_by_username',
      (select count(*) from public.audit_log a
        where a.app_code = 'salary'
          and lower(a.actor) in (select lower(username) from cand))
  ) as j),

-- ─── D) RPC เดิม admin_delete_user — อ่าน Body เต็ม ──────────
--     ต้องรู้ว่าเป็นของแอปอื่นหรือไม่ · ตรวจสิทธิ์อย่างไร · แตะ app_code ใด
d as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'function',  p.proname,
           'arguments', pg_get_function_identity_arguments(p.oid),
           'owner',     pg_get_userbyid(p.proowner),
           'security_definer', p.prosecdef,
           'source',    pg_get_functiondef(p.oid)) order by p.proname), '[]'::jsonb) as j
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'admin_delete_user'),

-- ─── E) ใครมีสิทธิ์เรียก admin_delete_user ───────────────────
e as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'grantee', g.grantee, 'privilege', g.privilege_type)), '[]'::jsonb) as j
    from information_schema.routine_privileges g
   where g.routine_schema = 'public' and g.routine_name = 'admin_delete_user'),

-- ─── F) FORCE RLS — SECURITY DEFINER จะข้าม RLS ได้หรือไม่ ───
f as (
  select coalesce(jsonb_agg(jsonb_build_object(
           'table', cl.relname, 'rls_enabled', cl.relrowsecurity,
           'force_rls', cl.relforcerowsecurity, 'owner', pg_get_userbyid(cl.relowner))
         order by cl.relname), '[]'::jsonb) as j
    from pg_class cl join pg_namespace n on n.oid = cl.relnamespace
   where n.nspname = 'public'
     and cl.relname in ('app_users','njhr_sessions','notifications','audit_log',
                        'njhr_activation_requests')),

-- ─── G) ยืนยันว่าบัญชีเป้าหมายไม่มีร่องรอยใน employees ───────
--     employee_id IS NULL อยู่แล้ว แต่ตรวจซ้ำว่าไม่มี unique index ค้าง
g as (
  select jsonb_build_object(
    'candidates_with_employee_id', (select count(*) from public.app_users u
                                     where u.app_code = 'salary' and u.role::text = 'USER'
                                       and u.employee_id is null and u.employee_id is not null),
    'total_salary_users',   (select count(*) from public.app_users where app_code = 'salary'),
    'other_app_codes',      (select coalesce(jsonb_object_agg(t.app_code, t.n), '{}'::jsonb)
                               from (select app_code, count(*) n from public.app_users
                                      where app_code <> 'salary' group by app_code) t)
  ) as j),

-- ─── H) ตรวจ username/email ของ candidate ว่าซ้ำข้าม app_code ─
--     unique index เป็น (username, app_code) และ (email, app_code)
--     ลบใน salary จึงไม่กระทบแอปอื่น — ยืนยันด้วยตัวเลข
h as (
  select jsonb_build_object(
    'candidate_usernames_also_in_other_app_code',
      (select count(*) from public.app_users u
        where u.app_code <> 'salary'
          and lower(u.username) in (select lower(username) from cand))
  ) as j)

select jsonb_pretty(jsonb_build_object(
  'inspected_at',                   now(),
  'A_activation_request_blockers',  (select j from a),
  'B_orphan_rows_no_fk',            (select j from b),
  'C_history_by_username',          (select j from c),
  'D_existing_admin_delete_user',   (select j from d),
  'E_admin_delete_user_grants',     (select j from e),
  'F_force_rls',                    (select j from f),
  'G_scope_check',                  (select j from g),
  'H_cross_app_code',               (select j from h),
  'VERDICT',                        case
      when (select (j->>'blocked_accounts')::int from a) = 0
        then 'HARD DELETE ปลอดภัยสำหรับบัญชีชุดนี้ — ไม่มีบัญชีใดถูก njhr_activation_requests อ้างอิง'
      else 'มีบัญชีถูกอ้างอิงโดย njhr_activation_requests — ต้องหยุดและรายงาน'
    end
)) as inspection_report;
