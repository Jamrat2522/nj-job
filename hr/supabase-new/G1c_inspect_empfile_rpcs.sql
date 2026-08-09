-- ═══════════════════════════════════════════════════════════════════
--  G1c_inspect_empfile_rpcs.sql — ขอนิยามจริงของ RPC เอกสารพนักงาน (ชุดที่ 3/3)
--
--  อ่านอย่างเดียว 100% — statement เดียว คืน JSON ก้อนเดียว
--
--  ทำไมต้องขอ:
--    G2 (Migration) จะต้อง CREATE OR REPLACE ทับ 4 ตัวนี้เพื่อเปิดสิทธิ์ให้
--    "เจ้าของเอกสาร" เขียนเอกสารของตัวเองได้
--    การ REPLACE โดยไม่เห็นเนื้อในตัวจริง = เดา และจะทำให้ตรรกะเดิมหาย
--    จึงต้องดึงของจริงจาก DB มาก่อน แล้วแก้เฉพาะบรรทัดที่เกี่ยวกับสิทธิ์
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  'functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'returns', pg_get_function_result(p.oid),
             'security_definer', p.prosecdef,
             'definition', pg_get_functiondef(p.oid))
           order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_empfile_list',
                         'njhr_empfile_save',
                         'njhr_empfile_delete',
                         'njhr_empfile_access',
                         'njhr_empfile_upload_path')),

  -- นับ overload กันกรณีมีหลายเวอร์ชันชื่อเดียวกัน
  'overload_count', (
    select coalesce(jsonb_object_agg(proname, n), '{}'::jsonb) from (
      select p.proname, count(*) n
        from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
       where ns.nspname = 'public' and p.proname like 'njhr\_empfile\_%'
       group by p.proname) s),

  'meta', jsonb_build_object('file', 'G1c_inspect_empfile_rpcs.sql',
                             'read_only', true, 'generated_at', now())
)) as result;
