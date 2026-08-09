-- ═══════════════════════════════════════════════════════════════════
--  H3_verify_hrdocs.sql — ทดสอบผลหลัง H2 (READ ONLY 100%)
--
--  ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT / REVOKE
--  statement เดียว คืน JSON ก้อนเดียว
--
--  ทดสอบ 6 ข้อตามที่สั่ง:
--   T1 Client เรียก Legacy RPC ทั้ง 6 ตัวไม่ได้     → has_function_privilege ของ anon/authenticated
--   T2 njhr_doc_respond ปัจจุบันยังทำงานได้         → สิทธิ์ + โครงสร้าง
--   T3 ADMIN flow ปัจจุบันยังทำงาน                  → RPC ที่ Frontend เรียกจริงยังเปิดครบ
--   T4 USER ดูเอกสารของตัวเองได้                    → njhr_doc_center_list ยังเปิด + scope ยังอยู่
--   T5 รับทราบ/ลงนามผ่านเส้นทางใหม่เท่านั้น          → ไม่มีเส้นทางอื่นที่เขียน acks ได้จาก client
--   T6 ไม่มี Regression ระบบอื่น                    → RPC ของ Leave/OT/Payroll/Attendance ยังเปิดตามเดิม
--
--  หมายเหตุความซื่อสัตย์: ไฟล์นี้พิสูจน์ "สิทธิ์และโครงสร้าง" ได้จริง
--  แต่พิสูจน์ "พฤติกรรมตอน Login จริง" ไม่ได้ — ต้องทดสอบบนหน้าเว็บด้วยบัญชีจริง
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── T1) Legacy RPC ต้องเรียกไม่ได้จาก client ────────────────────
  'T1_legacy_blocked', (
    select coalesce(jsonb_object_agg(sig, res), '{}'::jsonb) from (
      select p.oid::regprocedure::text sig,
             case when has_function_privilege('anon', p.oid, 'EXECUTE')
                    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  then '❌ FAIL — ยังเรียกได้ (anon=' ||
                       has_function_privilege('anon', p.oid, 'EXECUTE')::text ||
                       ' auth=' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text || ')'
                  else '✅ PASS — เรียกไม่ได้ทั้ง anon และ authenticated' end res
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('njhr_doc_ack','njhr_doc_issue','njhr_doc_get',
                           'njhr_doc_list','njhr_doc_cancel','njhr_doc_ack_report')) s),

  'T1_summary', (
    select case when count(*) filter (where has_function_privilege('anon', p.oid, 'EXECUTE')
                                         or has_function_privilege('authenticated', p.oid, 'EXECUTE')) = 0
                then '✅ PASS — Legacy ' || count(*)::text || ' ตัว ปิดครบทุกตัว'
                else '❌ FAIL — ยังมีที่เรียกได้' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_doc_ack','njhr_doc_issue','njhr_doc_get',
                         'njhr_doc_list','njhr_doc_cancel','njhr_doc_ack_report')),

  -- ─── T2) njhr_doc_respond ยังทำงานได้ ───────────────────────────
  'T2_respond_ok', (
    select jsonb_build_object(
      'callable_by_anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'signature', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'has_password_check', (pg_get_functiondef(p.oid) like '%extensions.crypt%'),
      'has_ownership_check', (pg_get_functiondef(p.oid) like '%d.employee_id is distinct from c.employee_id%'),
      'has_locked_check', (pg_get_functiondef(p.oid) like '%d.locked_at is not null%'),
      'has_status_check', (pg_get_functiondef(p.oid) like '%SENT%'),
      'writes_doc_hash', (pg_get_functiondef(p.oid) like '%d.content_hash, v_confirm%'),
      'writes_confirm_text', (pg_get_functiondef(p.oid) like '%njhr_doc_confirm_text%'),
      'idempotent_insert', (pg_get_functiondef(p.oid) like '%on conflict (document_id, employee_id) do nothing%'),
      'verdict', case when has_function_privilege('anon', p.oid, 'EXECUTE')
                       and pg_get_functiondef(p.oid) like '%extensions.crypt%'
                       and pg_get_functiondef(p.oid) like '%njhr_doc_confirm_text%'
                      then '✅ PASS' else '❌ FAIL' end)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_doc_respond'),

  -- ─── T3) RPC ที่ Frontend เรียกจริง ต้องเปิดครบ ──────────────────
  --      รายชื่อนี้มาจากการ grep Source จริงของ src/14-view-profile-hrdocs.js
  'T3_frontend_rpcs', (
    select coalesce(jsonb_object_agg(w.fn, res), '{}'::jsonb) from (
      select w.fn,
             case when p.oid is null then '❌ FAIL — ไม่พบ function'
                  when has_function_privilege('anon', p.oid, 'EXECUTE')
                  then '✅ PASS — เรียกได้'
                  else '❌ FAIL — ถูกปิดโดยไม่ตั้งใจ' end res
        from (values ('njhr_doc_center_list'), ('njhr_doc_detail'), ('njhr_doc_save'),
                     ('njhr_doc_flow'), ('njhr_doc_view'), ('njhr_doc_respond'),
                     ('njhr_doc_delete'), ('njhr_doc_org'), ('njhr_doc_org_save'),
                     ('njhr_doc_approvers'), ('njhr_doc_emp_profile'),
                     ('njhr_doc_salary_items'), ('njhr_emp_list')) w(fn)
        left join lateral (
          select p2.oid from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
           where n2.nspname = 'public' and p2.proname = w.fn limit 1) p on true) w),

  -- ─── T4) USER ดูเอกสารของตัวเองได้ — scope ยังอยู่ ──────────────
  'T4_user_scope', (
    select jsonb_build_object(
      'callable_by_anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'scopes_to_own_employee', (pg_get_functiondef(p.oid) like '%c.is_manager or d.employee_id = c.employee_id%'),
      'hides_unsent_from_employee', (pg_get_functiondef(p.oid) like '%c.is_manager or d.status in%'),
      'verdict', case when has_function_privilege('anon', p.oid, 'EXECUTE')
                       and pg_get_functiondef(p.oid) like '%c.is_manager or d.employee_id = c.employee_id%'
                      then '✅ PASS' else '❌ FAIL' end)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'njhr_doc_center_list'),

  -- ─── T5) ไม่มีเส้นทางอื่นที่เขียน njhr_emp_doc_acks ได้จาก client ─
  --      กวาดทุก function ใน public ที่ INSERT ลง njhr_emp_doc_acks
  --      แล้วดูว่า client เรียกได้ตัวไหนบ้าง — ควรเหลือ njhr_doc_respond ตัวเดียว
  'T5_ack_write_paths', (
    select coalesce(jsonb_object_agg(sig, res), '{}'::jsonb) from (
      select p.oid::regprocedure::text sig,
             case when has_function_privilege('anon', p.oid, 'EXECUTE')
                    or has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  then (case when p.proname = 'njhr_doc_respond'
                             then '✅ เส้นทางที่ตั้งใจ (มี re-auth + hash + confirm text)'
                             else '❌ FAIL — เส้นทางเพิ่มเติมที่ client เรียกได้' end)
                  else '✅ ปิดจาก client แล้ว' end res
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prokind = 'f'
         and case when p.prokind = 'f' then pg_get_functiondef(p.oid) else '' end
             ilike '%insert into public.njhr_emp_doc_acks%') s),

  'T5_summary', (
    select case when count(*) = 1
                then '✅ PASS — เหลือเส้นทางเดียวคือ njhr_doc_respond'
                else '❌ FAIL — มี ' || count(*)::text || ' เส้นทางที่ client เขียน acks ได้' end
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and case when p.prokind = 'f' then pg_get_functiondef(p.oid) else '' end
           ilike '%insert into public.njhr_emp_doc_acks%'
       and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE'))),

  -- ─── T5b) หลักฐาน Immutable — trigger ต้องทำงาน ─────────────────
  'T5b_ack_immutable', (
    select jsonb_build_object(
      'trigger_exists', count(*) > 0,
      'events', coalesce(string_agg(
        case when (t.tgtype::int & 4) > 0 then 'INSERT' end || ' ' ||
        case when (t.tgtype::int & 16) > 0 then 'UPDATE' end || ' ' ||
        case when (t.tgtype::int & 8) > 0 then 'DELETE' end, ' | '), '—'),
      'def', coalesce(string_agg(pg_get_triggerdef(t.oid), ' | '), '—'),
      'verdict', case when count(*) > 0 then '✅ PASS' else '❌ FAIL' end)
      from pg_trigger t join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and not t.tgisinternal
       and c.relname = 'njhr_emp_doc_acks'),

  -- ─── T6) ไม่มี Regression ระบบอื่น ──────────────────────────────
  --      RPC ของ Leave / OT / Attendance / Payroll / Self Service ต้องเรียกได้เหมือนเดิม
  'T6_other_systems', (
    select coalesce(jsonb_object_agg(w.fn, res), '{}'::jsonb) from (
      select w.fn,
             case when p.oid is null then '⚠ ไม่พบ function'
                  when has_function_privilege('anon', p.oid, 'EXECUTE') then '✅ ยังเรียกได้'
                  else '❌ FAIL — ถูกปิดโดยไม่ตั้งใจ' end res
        from (values ('njhr_leave_balances'), ('njhr_leave_list'), ('njhr_leave_submit'),
                     ('njhr_ot_list'), ('njhr_att_list'), ('njhr_emp_list'),
                     ('njhr_emp_get'), ('njhr_emp_save'), ('njhr_emp_departments'),
                     ('njhr_me_get'), ('njhr_me_save'), ('njhr_empfile_list'),
                     ('njhr_empfile_save'), ('njhr_login'), ('njhr_session_check')) w(fn)
        left join lateral (
          select p2.oid from pg_proc p2 join pg_namespace n2 on n2.oid = p2.pronamespace
           where n2.nspname = 'public' and p2.proname = w.fn limit 1) p on true) w),

  'T6_regression_count', (
    select count(*)::int
      from (values ('njhr_leave_balances'), ('njhr_leave_list'), ('njhr_ot_list'),
                   ('njhr_att_list'), ('njhr_emp_list'), ('njhr_emp_get'),
                   ('njhr_me_get'), ('njhr_me_save'), ('njhr_empfile_list')) w(fn)
      join pg_proc p on p.proname = w.fn and p.pronamespace = 'public'::regnamespace
     where not has_function_privilege('anon', p.oid, 'EXECUTE')),

  -- ─── T7) Lock guard คุ้มครองครบกี่ field ────────────────────────
  'T7_lock_guard_fields', (
    select coalesce(jsonb_agg(f.col order by f.col), '[]'::jsonb)
      from (values ('title'),('body'),('doc_type'),('employee_id'),('effective_date'),
                   ('version'),('doc_no'),('requires_signature'),('doc_meta'),
                   ('emp_code_snap'),('emp_name_snap'),('content_hash')) f(col)
     where exists (
       select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'njhr_empdoc_lock_guard'
          and pg_get_functiondef(p.oid) like '%old.' || f.col || '%')),

  -- ─── T8) Hash function ทำงานได้จริงกับข้อมูลจริง ────────────────
  --      คำนวณจากเอกสารที่มีอยู่ 1 ฉบับ (ไม่เขียนกลับ) เพื่อพิสูจน์ว่าไม่ error
  'T8_hash_probe', coalesce((
    select jsonb_build_object(
      'sample_doc_no', d.doc_no,
      'sample_version', d.version,
      'hash_len', length(public.njhr_doc_content_hash(d.id)),
      'hash_prefix', left(public.njhr_doc_content_hash(d.id), 16) || '…',
      'deterministic', (public.njhr_doc_content_hash(d.id) = public.njhr_doc_content_hash(d.id)),
      'verdict', case when length(public.njhr_doc_content_hash(d.id)) = 64
                      then '✅ PASS — sha256 hex 64 ตัว' else '❌ FAIL' end)
      from public.njhr_emp_documents d order by d.issued_at limit 1),
    jsonb_build_object('verdict','⚠ ไม่มีเอกสารให้ทดสอบ')),

  -- ─── T9) ข้อมูลเดิมไม่เปลี่ยน ───────────────────────────────────
  'T9_data_intact', (
    select jsonb_build_object(
      'documents_total', (select count(*) from public.njhr_emp_documents),
      'documents_draft', (select count(*) from public.njhr_emp_documents where status = 'DRAFT'),
      'acks_total',      (select count(*) from public.njhr_emp_doc_acks),
      'events_total',    (select count(*) from public.njhr_emp_doc_events),
      'expect',          'documents=18 · draft=18 · acks=0 · events=63')),

  'meta', jsonb_build_object('file','H3_verify_hrdocs.sql','read_only', true,'at', now())
)) as result;
