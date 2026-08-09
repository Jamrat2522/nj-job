-- ═══════════════════════════════════════════════════════════════════
--  J1_inspect_emp_delete.sql — ตรวจของจริงก่อนทำปุ่ม "ลบพนักงาน"
--
--  อ่านอย่างเดียว 100% — ไม่มี CREATE / ALTER / INSERT / UPDATE / DELETE / DROP / GRANT
--  statement เดียว คืน JSON ก้อนเดียว
--  ไม่อ้างตารางตรง ๆ ที่อาจไม่มีอยู่ (บทเรียนจาก H4) — ใช้ pg_catalog / information_schema
--
--  เหตุผลที่ต้องมีไฟล์นี้:
--    ค้น Source ทั้งโปรเจกต์แล้ว "ไม่พบ RPC/Function สำหรับลบพนักงาน" เลย
--    ตามคำสั่งจึงต้องหยุด และรายงานก่อนว่ามีอะไรผูกกับ employee_id บ้าง
--
--  ตอบให้ครบ:
--   A) ตารางพนักงานจริง + จำนวนแถว
--   B) ทุกตารางที่มี Foreign Key ชี้มาที่ employees(id) + พฤติกรรมเมื่อลบ (CASCADE/SET NULL/RESTRICT)
--   C) ทุกตารางที่มีคอลัมน์ employee_id แต่ "ไม่มี FK" (ลบแล้วข้อมูลค้างเป็นขยะ)
--   D) จำนวนข้อมูลจริงในแต่ละตารางที่ผูกอยู่ (จะได้รู้ว่าลบแล้วกระทบกี่แถว)
--   E) RPC ที่มีอยู่จริงเกี่ยวกับการลบ (ยืนยันว่าไม่มีของพนักงาน)
--   F) บัญชีผู้ใช้ที่ผูกกับพนักงาน (ลบพนักงานแล้วบัญชีจะเป็นอย่างไร)
--   G) ไฟล์ใน Storage ที่ผูกกับพนักงาน (FK ลบแถวได้ แต่ไฟล์จริงไม่หายตาม)
--
--  วิธีใช้: วางทั้งไฟล์ → Run → กดที่ค่าในคอลัมน์ result → Copy → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

select jsonb_pretty(jsonb_build_object(

  -- ─── A) ตารางพนักงาน ─────────────────────────────────────────────
  'A1_employees', (
    select jsonb_build_object(
      'table', 'public.employees',
      'rows', (select count(*) from public.employees),
      'by_status', coalesce((select jsonb_object_agg(s, n)
                               from (select status::text s, count(*) n
                                       from public.employees group by 1) t), '{}'::jsonb),
      'has_soft_delete_column',
        exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='employees'
                   and column_name in ('deleted_at','is_deleted','archived_at')))),

  -- ─── B) ตารางที่มี FK ชี้มาที่ employees(id) ─────────────────────
  'B1_foreign_keys', (
    select coalesce(jsonb_agg(x order by x->>'on_delete', x->>'table'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'table', rel.relname::text,
          'column', att.attname::text,
          'constraint', con.conname::text,
          'on_delete', case con.confdeltype
                         when 'c' then 'CASCADE — ลบตามทันที'
                         when 'n' then 'SET NULL — เคลียร์เป็น null'
                         when 'r' then 'RESTRICT — ลบไม่ได้ถ้ามีข้อมูล'
                         when 'a' then 'NO ACTION — ลบไม่ได้ถ้ามีข้อมูล'
                         when 'd' then 'SET DEFAULT'
                         else con.confdeltype::text end) x
          from pg_constraint con
          join pg_class rel on rel.oid = con.conrelid
          join pg_class frel on frel.oid = con.confrelid
          join pg_namespace n on n.oid = rel.relnamespace
          join unnest(con.conkey) k(attnum) on true
          join pg_attribute att on att.attrelid = rel.oid and att.attnum = k.attnum
         where con.contype = 'f' and n.nspname = 'public'
           and frel.relname = 'employees') s),

  'B2_summary', (
    select coalesce(jsonb_object_agg(od, n), '{}'::jsonb) from (
      select case con.confdeltype when 'c' then 'CASCADE' when 'n' then 'SET NULL'
                                  when 'r' then 'RESTRICT' when 'a' then 'NO ACTION'
                                  else con.confdeltype::text end od, count(*) n
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_class frel on frel.oid = con.confrelid
        join pg_namespace n2 on n2.oid = rel.relnamespace
       where con.contype = 'f' and n2.nspname = 'public' and frel.relname = 'employees'
       group by 1) t),

  -- ─── C) ตารางที่มีคอลัมน์ employee_id แต่ "ไม่มี FK" ─────────────
  --      อันตราย: ลบพนักงานแล้วข้อมูลพวกนี้ค้างเป็นขยะ ชี้ไป id ที่ไม่มีอยู่
  'C1_orphan_risk_tables', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'table', c.table_name::text, 'column', c.column_name::text)
           order by c.table_name), '[]'::jsonb)
      from information_schema.columns c
     where c.table_schema = 'public'
       and c.column_name in ('employee_id','emp_id')
       and not exists (
         select 1 from pg_constraint con
         join pg_class rel on rel.oid = con.conrelid
         join pg_class frel on frel.oid = con.confrelid
         join pg_namespace n on n.oid = rel.relnamespace
         join unnest(con.conkey) k(attnum) on true
         join pg_attribute att on att.attrelid = rel.oid and att.attnum = k.attnum
        where con.contype = 'f' and n.nspname = 'public'
          and frel.relname = 'employees'
          and rel.relname = c.table_name and att.attname = c.column_name)),

  -- ─── D) จำนวนแถวจริงของทุกตารางที่ผูกกับพนักงาน ─────────────────
  --      ใช้ค่าประมาณจาก pg_class เพื่อไม่ต้อง SELECT ตารางที่อาจไม่มีอยู่
  'D1_row_counts', (
    select coalesce(jsonb_object_agg(t.tbl, jsonb_build_object(
             'rows_estimate', greatest(c.reltuples, 0)::bigint,
             'rls', c.relrowsecurity)), '{}'::jsonb)
      from (
        select distinct rel.relname::text tbl
          from pg_constraint con
          join pg_class rel on rel.oid = con.conrelid
          join pg_class frel on frel.oid = con.confrelid
          join pg_namespace n on n.oid = rel.relnamespace
         where con.contype = 'f' and n.nspname = 'public' and frel.relname = 'employees'
        union
        select c2.table_name::text
          from information_schema.columns c2
         where c2.table_schema = 'public' and c2.column_name in ('employee_id','emp_id')) t
      join pg_class c on c.relname = t.tbl
      join pg_namespace nn on nn.oid = c.relnamespace and nn.nspname = 'public'
     where c.relkind = 'r'),

  -- ─── E) ยืนยันว่า "ไม่มี" RPC ลบพนักงาน ─────────────────────────
  'E1_delete_rpcs_existing', (
    select coalesce(jsonb_agg(p.proname::text order by p.proname), '[]'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and (p.proname like '%delete%' or p.proname like '%remove%')),

  'E2_employee_delete_exists', (
    select case when exists (
             select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('njhr_emp_delete','njhr_employee_delete','njhr_emp_remove'))
                then '⚠ มีอยู่แล้ว — ต้องใช้ของเดิม'
                else '✅ ยืนยัน: ไม่มี RPC ลบพนักงาน' end),

  -- ─── F) บัญชีผู้ใช้ที่ผูกกับพนักงาน ─────────────────────────────
  'F1_linked_accounts', (
    select jsonb_build_object(
      'app_users_linked', (select count(*) from public.app_users where employee_id is not null),
      'by_app_code', coalesce((select jsonb_object_agg(app_code, n)
                                 from (select app_code, count(*) n from public.app_users
                                        where employee_id is not null group by 1) t), '{}'::jsonb),
      'fk_on_delete', coalesce((
        select case con.confdeltype when 'c' then 'CASCADE' when 'n' then 'SET NULL'
                                    when 'r' then 'RESTRICT' when 'a' then 'NO ACTION'
                                    else con.confdeltype::text end
          from pg_constraint con
          join pg_class rel on rel.oid = con.conrelid
          join pg_class frel on frel.oid = con.confrelid
          join pg_namespace n on n.oid = rel.relnamespace
         where con.contype='f' and n.nspname='public'
           and rel.relname='app_users' and frel.relname='employees' limit 1),
        'ไม่มี FK — บัญชีจะค้างชี้ไปพนักงานที่ถูกลบ'))),

  -- ─── G) ไฟล์ใน Storage ที่ผูกกับพนักงาน ─────────────────────────
  --      FK ลบแถวในตารางได้ แต่ "ไฟล์จริงใน Storage ไม่หายตาม"
  'G1_storage_objects', (
    select coalesce(jsonb_object_agg(b.id, (
             select count(*) from storage.objects o where o.bucket_id = b.id)), '{}'::jsonb)
      from storage.buckets b
     where b.id in ('njhr-emp-files','njhr-face','njhr-signatures','njhr-doc-pdf')),

  -- ─── H) ตารางที่ "ลบไม่ได้" ถ้ามีข้อมูล (RESTRICT / NO ACTION) ──
  'H1_blocking_tables', (
    select coalesce(jsonb_agg(rel.relname::text order by rel.relname), '[]'::jsonb)
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_class frel on frel.oid = con.confrelid
      join pg_namespace n on n.oid = rel.relnamespace
     where con.contype = 'f' and n.nspname = 'public' and frel.relname = 'employees'
       and con.confdeltype in ('r','a')),

  'meta', jsonb_build_object('file','J1_inspect_emp_delete.sql','read_only', true,'at', now())
)) as result;
