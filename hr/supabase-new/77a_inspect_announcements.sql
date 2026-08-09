-- ============================================================
-- NJ HR V.10 — 77a_inspect_announcements.sql   [อ่านอย่างเดียว 100%]
--
-- PREFLIGHT ของ 77_announcements.sql พบตารางประกาศอยู่แล้ว 6 ตัว:
--   company_announcements · announcement · announcement_attachment
--   announcement_timeline · announcement_read · announcement_read_audit
--
-- ไฟล์นี้ดึงโครงสร้างจริงออกมาให้ครบ เพื่อตัดสินว่า
--   (ก) HR ใช้ตารางเดิมได้เลย → เขียนแค่ RPC njhr_announcement_* ครอบ
--   (ข) ตารางเหล่านี้เป็นของแอปอื่น → HR ต้องมีตารางของตัวเองแยก
-- ห้ามเดา ต้องเห็นของจริงก่อน
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete / drop แม้แต่คำเดียว
-- ============================================================

select jsonb_pretty(jsonb_build_object(

-- ── 1) มีจริงกี่ตาราง แต่ละตารางกี่แถว ───────────────────────
'1_tables', (
  select jsonb_object_agg(t, jsonb_build_object(
    'exists', to_regclass('public.'||t) is not null,
    'rows', (select n_live_tup from pg_stat_user_tables
              where schemaname='public' and relname=t)))
  from unnest(array['company_announcements','announcement','announcement_attachment',
                    'announcement_timeline','announcement_read','announcement_read_audit']) t),

-- ── 2) คอลัมน์ทั้งหมดของทุกตาราง ─────────────────────────────
'2_columns', (
  select jsonb_object_agg(table_name, cols) from (
    select table_name, jsonb_agg(jsonb_build_object(
             'col', column_name, 'type', data_type,
             'null', is_nullable, 'default', column_default)
             order by ordinal_position) cols
      from information_schema.columns
     where table_schema='public'
       and table_name in ('company_announcements','announcement','announcement_attachment',
                          'announcement_timeline','announcement_read','announcement_read_audit')
     group by table_name) x),

-- ── 3) ความสัมพันธ์ระหว่างตาราง (Foreign Key) ────────────────
--     บอกว่าตัวไหนเป็นตารางหลัก ตัวไหนเป็นตารางลูก
'3_foreign_keys', coalesce((
  select jsonb_agg(jsonb_build_object(
           'from', src.relname, 'to', tgt.relname,
           'constraint', con.conname,
           'definition', pg_get_constraintdef(con.oid)))
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid
    join pg_class tgt on tgt.oid = con.confrelid
   where con.contype='f'
     and (src.relname in ('company_announcements','announcement','announcement_attachment',
                          'announcement_timeline','announcement_read','announcement_read_audit')
       or tgt.relname in ('company_announcements','announcement','announcement_attachment',
                          'announcement_timeline','announcement_read','announcement_read_audit'))
  ), '[]'::jsonb),

-- ── 4) ตารางเหล่านี้เป็นของแอปไหน — มีคอลัมน์ app_code ไหม ───
'4_app_scope_columns', coalesce((
  select jsonb_agg(jsonb_build_object('table', table_name, 'col', column_name))
    from information_schema.columns
   where table_schema='public'
     and table_name in ('company_announcements','announcement','announcement_attachment',
                        'announcement_timeline','announcement_read','announcement_read_audit')
     and column_name in ('app_code','app','system','module','company_id','org_id','tenant_id')
  ), '[]'::jsonb),

-- ── 5) ตัวอย่างข้อมูลจริง 2 แถวจากตารางหลัก 2 ตัว ────────────
--     (ตัดเนื้อหายาวเหลือ 200 ตัวอักษร กันข้อมูลล้นหน้าจอ)
'5_sample_company_announcements', case
  when to_regclass('public.company_announcements') is null then null
  else (select jsonb_agg(left(to_jsonb(a)::text, 600)) from (
          select * from public.company_announcements limit 2) a) end,
'5_sample_announcement', case
  when to_regclass('public.announcement') is null then null
  else (select jsonb_agg(left(to_jsonb(a)::text, 600)) from (
          select * from public.announcement limit 2) a) end,

-- ── 6) Index และ Constraint ที่มีอยู่ ────────────────────────
'6_indexes', coalesce((
  select jsonb_agg(jsonb_build_object('table', tablename, 'index', indexname,
           'def', indexdef))
    from pg_indexes
   where schemaname='public'
     and tablename in ('company_announcements','announcement','announcement_attachment',
                       'announcement_timeline','announcement_read','announcement_read_audit')
  ), '[]'::jsonb),

-- ── 7) RLS และ Policy ปัจจุบัน ───────────────────────────────
'7_rls', coalesce((
  select jsonb_agg(jsonb_build_object('table', c.relname, 'rls_enabled', c.relrowsecurity))
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public'
     and c.relname in ('company_announcements','announcement','announcement_attachment',
                       'announcement_timeline','announcement_read','announcement_read_audit')
  ), '[]'::jsonb),
'7_policies', coalesce((
  select jsonb_agg(jsonb_build_object('table', tablename, 'policy', policyname,
           'cmd', cmd, 'roles', roles, 'using', qual))
    from pg_policies
   where schemaname='public'
     and tablename in ('company_announcements','announcement','announcement_attachment',
                       'announcement_timeline','announcement_read','announcement_read_audit')
  ), '[]'::jsonb),

-- ── 8) มี RPC/ฟังก์ชันที่ใช้ตารางเหล่านี้อยู่แล้วหรือไม่ ─────
--     ถ้ามี แปลว่าเป็นของแอปอื่นที่ทำงานอยู่ ห้ามแตะเด็ดขาด
'8_functions_using_them', coalesce((
  select jsonb_agg(jsonb_build_object('function', p.proname,
           'uses', (select string_agg(t, ', ') from unnest(array[
              'company_announcements','announcement_attachment','announcement_timeline',
              'announcement_read_audit','announcement_read']) t
             where pg_get_functiondef(p.oid) ilike '%'||t||'%')))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f'
     and (pg_get_functiondef(p.oid) ilike '%company_announcements%'
       or pg_get_functiondef(p.oid) ilike '%announcement_read%'
       or pg_get_functiondef(p.oid) ilike '%announcement_timeline%'
       or pg_get_functiondef(p.oid) ilike '%announcement_attachment%')
  ), '[]'::jsonb),

-- ── 9) มี View หรือ Trigger ผูกอยู่ไหม ──────────────────────
'9_triggers', coalesce((
  select jsonb_agg(jsonb_build_object('table', c.relname, 'trigger', t.tgname))
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and not t.tgisinternal
     and c.relname in ('company_announcements','announcement','announcement_attachment',
                       'announcement_timeline','announcement_read','announcement_read_audit')
  ), '[]'::jsonb)

)) as inspect_report;
