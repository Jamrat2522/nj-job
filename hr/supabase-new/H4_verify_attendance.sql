-- ═══════════════════════════════════════════════════════════════════
--  H4_verify_attendance.sql — ตรวจ Attendance Regression ด้วยชื่อ RPC จริง
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  statement เดียว คืน JSON ก้อนเดียว
--
--  ที่มาของรายชื่อ RPC: grep จาก Source จริงของ Frontend (ไม่ได้เดาชื่อ)
--    src/33-view-attendance.js          → njhr_att_today · njhr_att_punch · njhr_att_migrate
--    src/36-view-attendance-report.js   → njhr_att_report
--    src/42-view-attendance-correction.js + compat → njhr_att_correction_list / _submit
--                                          / _approve / _reject · njhr_attc_can_act
--    face.js                            → njhr_att_punch_face
--
--  รอบก่อน (H3) ผมใช้ชื่อ njhr_att_list ซึ่ง "เดาเอง" และไม่มีอยู่จริง
--  ไฟล์นี้แก้ให้ถูกต้อง และไม่สร้าง function ใด ๆ ขึ้นมาใหม่
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── A) RPC Attendance จริงทั้ง 9 ตัว ต้องยังอยู่และ client เรียกได้ ────
  'A1_attendance_rpcs', (
    select coalesce(jsonb_object_agg(w.fn, res), '{}'::jsonb) from (
      select w.fn,
             case when p.oid is null then '❌ FAIL — ไม่พบ function'
                  when has_function_privilege('anon', p.oid, 'EXECUTE')
                    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  then '✅ PASS — เรียกได้'
                  else '⚠ ปิดจาก client (ตรวจว่าเป็นตัวช่วยภายในหรือไม่)' end res
        from (values ('njhr_att_today'), ('njhr_att_punch'), ('njhr_att_punch_face'),
                     ('njhr_att_report'), ('njhr_att_migrate'),
                     ('njhr_att_correction_list'), ('njhr_att_correction_submit'),
                     ('njhr_att_correction_approve'), ('njhr_att_correction_reject'),
                     ('njhr_attc_can_act')) w(fn)
        left join lateral (
          select p2.oid from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
           where n2.nspname = 'public' and p2.proname = w.fn limit 1) p on true) w),

  'A2_summary', (
    select case when count(*) filter (where p.oid is null) > 0
                then '❌ FAIL — มี RPC ที่หายไป'
                when count(*) filter (where not (has_function_privilege('anon', p.oid, 'EXECUTE')
                                              or has_function_privilege('authenticated', p.oid, 'EXECUTE'))) > 0
                then '⚠ มี RPC ที่ client เรียกไม่ได้'
                else '✅ PASS — RPC Attendance ' || count(*)::text || ' ตัว ครบและเรียกได้ทุกตัว' end
      from (values ('njhr_att_today'), ('njhr_att_punch'), ('njhr_att_punch_face'),
                   ('njhr_att_report'), ('njhr_att_migrate'),
                   ('njhr_att_correction_list'), ('njhr_att_correction_submit'),
                   ('njhr_att_correction_approve'), ('njhr_att_correction_reject'),
                   ('njhr_attc_can_act')) w(fn)
      left join lateral (
        select p2.oid from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
         where n2.nspname = 'public' and p2.proname = w.fn limit 1) p on true),

  -- ─── B) H2 แตะอะไรที่เกี่ยวกับ Attendance หรือไม่ ────────────────────
  --      ทุก function ของ Attendance ต้องไม่มีร่องรอยของสิ่งที่ H2 เพิ่ม
  'B1_attendance_untouched', (
    select coalesce(jsonb_object_agg(p.proname::text, chk), '{}'::jsonb) from (
      select p.proname,
             case when pg_get_functiondef(p.oid) like '%content_hash%'
                    or pg_get_functiondef(p.oid) like '%confirmation_text%'
                    or pg_get_functiondef(p.oid) like '%njhr_doc_confirm_text%'
                  then '⚠ ถูกแก้โดยไม่ตั้งใจ' else '✅ ไม่ถูกแตะ' end chk
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prokind = 'f'
         and p.proname like 'njhr\_att%') p),

  -- ─── C) ตาราง Attendance ไม่มีคอลัมน์แปลกปลอมจาก H2 ─────────────────
  'C1_attendance_tables', (
    select coalesce(jsonb_object_agg(t.tbl, res), '{}'::jsonb) from (
      select t.tbl,
             case when to_regclass('public.' || t.tbl) is null then '⚠ ไม่พบตาราง'
                  when exists (select 1 from information_schema.columns c
                                where c.table_schema = 'public' and c.table_name = t.tbl
                                  and c.column_name in ('content_hash','content_hash_at',
                                                        'doc_hash','confirmation_text'))
                  then '❌ FAIL — พบคอลัมน์ที่ H2 เพิ่ม'
                  else '✅ ไม่มีคอลัมน์แปลกปลอม' end res
        from (values ('attendance'), ('attendance_corrections')) t(tbl)) t),

  -- ─── D) Trigger ที่ H2 สร้าง ต้องอยู่บนตารางเอกสารเท่านั้น ──────────
  'D1_trigger_scope', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', c.relname::text, 'trigger', t.tgname::text)
           order by c.relname, t.tgname), '[]'::jsonb)
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and t.tgfoid in (
         select p.oid from pg_proc p join pg_namespace n2 on n2.oid = p.pronamespace
          where n2.nspname = 'public'
            and p.proname in ('njhr_docack_immutable_guard','njhr_empdoc_lock_guard'))),

  'D1_verdict', (
    select case when count(*) = 2 then '✅ PASS — trigger อยู่บน 2 ตารางเอกสารเท่านั้น'
                else '⚠ พบ trigger ' || count(*)::text || ' ตัว — ตรวจรายการด้านบน' end
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and t.tgfoid in (
         select p.oid from pg_proc p join pg_namespace n2 on n2.oid = p.pronamespace
          where n2.nspname = 'public'
            and p.proname in ('njhr_docack_immutable_guard','njhr_empdoc_lock_guard'))),

  -- ─── E) ระบบอื่นที่ Frontend เรียกจริง ต้องเรียกได้ตามเดิม ──────────
  'E1_other_systems', (
    select coalesce(jsonb_object_agg(w.fn, res), '{}'::jsonb) from (
      select w.fn,
             case when p.oid is null then '⚠ ไม่พบ function'
                  when has_function_privilege('anon', p.oid, 'EXECUTE') then '✅ ยังเรียกได้'
                  else '❌ FAIL — ถูกปิด' end res
        from (values ('njhr_login'), ('njhr_session_check'), ('njhr_logout'),
                     ('njhr_leave_balances'), ('njhr_leave_list'), ('njhr_leave_submit'),
                     ('njhr_leave_queue'), ('njhr_leave_decide'), ('njhr_leave_report'),
                     ('njhr_ot_list'), ('njhr_emp_list'), ('njhr_emp_get'),
                     ('njhr_me_get'), ('njhr_me_save'),
                     ('njhr_empfile_list'), ('njhr_empfile_save'),
                     ('njhr_slip_list'), ('njhr_slip_get'),
                     ('njhr_gf_check'), ('njhr_notify_unread'),
                     ('njhr_holiday_list'), ('njhr_shift_list')) w(fn)
        left join lateral (
          select p2.oid from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
           where n2.nspname = 'public' and p2.proname = w.fn limit 1) p on true) w),

  -- ─── F) ข้อมูล Attendance ไม่เปลี่ยน ────────────────────────────────
  -- ─── F) ตาราง Attendance ยังอยู่ครบ ────────────────────────────────
  --      อ่านจาก pg_class แทนการ SELECT ตาราง เพราะถ้าชื่อตารางไม่มีจริง
  --      PostgreSQL จะ parse ทั้ง statement ไม่ผ่านตั้งแต่ต้น (CASE กันไม่ได้)
  'F1_attendance_tables_exist', (
    select coalesce(jsonb_object_agg(t.tbl, res), '{}'::jsonb) from (
      select t.tbl,
             case when c.oid is null then '❌ ไม่พบตาราง'
                  else '✅ มีอยู่ · rls=' || c.relrowsecurity::text ||
                       ' · rows(ประมาณ)=' || greatest(c.reltuples, 0)::bigint::text end res
        from (values ('attendance'), ('attendance_corrections'),
                     ('employees'), ('njhr_emp_documents'), ('njhr_emp_doc_acks')) t(tbl)
        left join lateral (
          select c2.oid, c2.relrowsecurity, c2.reltuples
            from pg_class c2 join pg_namespace n2 on n2.oid = c2.relnamespace
           where n2.nspname = 'public' and c2.relname = t.tbl and c2.relkind = 'r'
           limit 1) c on true) t),

  'meta', jsonb_build_object('file','H4_verify_attendance.sql','read_only', true,'at', now())
)) as result;
