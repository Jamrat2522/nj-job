-- ═══════════════════════════════════════════════════════════════════
--  G1b_inspect_functions.sql — ตรวจนิยาม Function จริงใน DB (ชุดที่ 2/2)
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  statement เดียว คืน JSON ก้อนเดียว
--
--  ทำไมต้องดูของจริงจาก DB ไม่ใช่จากไฟล์ในโปรเจกต์:
--    ไฟล์ supabase-new/*.sql เป็นแค่ประวัติการ migrate
--    ตัวจริงอาจถูกแก้ทีหลังผ่าน Dashboard — ต้องยึดของใน DB เท่านั้น
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  'functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'returns', pg_get_function_result(p.oid),
             'volatility', case p.provolatile when 'i' then 'immutable'
                                              when 's' then 'stable'
                                              else 'volatile' end,
             'security_definer', p.prosecdef,
             'definition', pg_get_functiondef(p.oid))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_norm_role',
                         'njhr_ctx',
                         'njhr_emp_guard',
                         'njhr_empfile_guard',
                         'njhr_empfile_kind_ok')),

  'meta', jsonb_build_object('file', 'G1b_inspect_functions.sql',
                             'read_only', true, 'generated_at', now())
)) as result;
