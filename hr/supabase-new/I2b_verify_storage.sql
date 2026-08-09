-- ═══════════════════════════════════════════════════════════════════
--  I2b_verify_storage.sql — พิสูจน์สิทธิ์ storage จริง (ไม่ใช่จับคู่ pattern)
--
--  ทำไมต้องมีไฟล์นี้:
--    I2 ตรวจด้วยการจับคู่ข้อความใน pg_policies.qual ซึ่ง "เดาไม่ได้ 100%"
--    และผลรัน I2 พบว่ามี policy บน storage.objects ทั้งหมด 36 ตัว
--    มากกว่าที่ผมไล่อ่านด้วยมือตอนวิเคราะห์ (24 ตัว) → ต้องพิสูจน์ของจริง
--
--  วิธีพิสูจน์: สลับ role เป็น anon / authenticated จริง แล้วนับแถวที่มองเห็น
--    ผ่าน RLS ของ storage.objects — เป็นคำตอบจาก PostgreSQL เอง ไม่ใช่การตีความ
--
--  ไม่เขียนข้อมูล Production:
--    · มีแต่ SELECT · ไม่มี INSERT/UPDATE/DELETE/ALTER/DROP ต่อข้อมูลจริง
--    · ใช้ TEMP TABLE ที่หายไปเองเมื่อจบ session (ON COMMIT DROP)
--    · คืน role กลับทุกกรณีด้วย EXCEPTION handler
--
--  ตอบ Verify ข้อ 1–4 และ 9 ที่สั่งไว้โดยตรง
--
--  วิธีใช้: วางทั้งไฟล์ → Run → ดูผลจาก statement สุดท้าย → ส่งกลับมา
-- ═══════════════════════════════════════════════════════════════════

--  ไม่สร้างตารางใด ๆ เลย — เก็บผลไว้ใน session setting แล้วอ่านกลับ
--  (กันกรณี SQL Editor รันทีละ statement คนละ transaction จน TEMP TABLE หายก่อนใช้)

do $$
declare b text; r text; n bigint; me text := current_user; j jsonb := '[]'::jsonb;
begin
  foreach r in array array['anon','authenticated'] loop
    foreach b in array array['njhr-doc-pdf','njhr-emp-files','njhr-face','njhr-signatures',
                             'job-files','slips','kn-billing','leave-attachments'] loop
      begin
        perform set_config('role', r, true);          -- สลับ role จริง (local เท่านั้น)
        execute format('select count(*) from storage.objects where bucket_id = %L', b) into n;
        perform set_config('role', me, true);         -- คืน role ทันที
        j := j || jsonb_build_object('bucket', b, 'role', r, 'visible', n, 'denied', false);
      exception when others then
        perform set_config('role', me, true);         -- คืน role แม้เกิด error
        j := j || jsonb_build_object('bucket', b, 'role', r, 'visible', -1,
                                     'denied', true, 'err', left(sqlerrm, 80));
      end;
    end loop;
  end loop;
  perform set_config('role', me, true);
  perform set_config('njhr.rls_probe', j::text, false);   -- เก็บผลไว้ใน session
end $$;

select jsonb_pretty(jsonb_build_object(

  -- ─── 1) ผลทดสอบ role จริง ────────────────────────────────────────
  --   visible_rows = 0 อาจแปลว่า "ไม่มีไฟล์" หรือ "อ่านไม่ได้" — ต้องดูคู่กับจำนวนไฟล์จริง
  --   จึงเทียบกับยอดจริงที่ postgres (bypass RLS) มองเห็น
  'T1_role_probe', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'bucket', x->>'bucket', 'role', x->>'role',
             'visible_via_rls', (x->>'visible')::bigint,
             'actual_rows', (select count(*) from storage.objects o
                              where o.bucket_id = x->>'bucket'),
             'verdict', case
               when (x->>'denied')::boolean then '✅ DENY (ถูกปฏิเสธ)'
               when (select count(*) from storage.objects o
                      where o.bucket_id = x->>'bucket') = 0
                 then 'ℹ bucket ว่าง — สรุปจาก policy แทน'
               when (x->>'visible')::bigint = 0 then '✅ DENY (มองไม่เห็นแม้มีไฟล์)'
               else '❌ ALLOW — อ่านได้ ' || (x->>'visible') || ' แถว' end)
           order by x->>'bucket', x->>'role'), '[]'::jsonb)
      from jsonb_array_elements(
             coalesce(nullif(current_setting('njhr.rls_probe', true),'')::jsonb, '[]'::jsonb)) x),

  -- ─── 2) policy ทั้งหมดที่ให้สิทธิ์อ่านแก่ public/anon (ครบทุกตัว) ──
  --   ไม่กรองด้วย pattern — ดึงมาให้ครบเพื่อไล่อ่านเอง
  'T2_all_read_policies_for_public', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', policyname::text, 'cmd', cmd, 'roles', roles::text,
             'permissive', permissive, 'using', coalesce(qual,'—'))
           order by policyname), '[]'::jsonb)
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and cmd in ('SELECT','ALL')
       and (roles::text like '%public%' or roles::text like '%anon%'
            or roles::text like '%authenticated%')),

  'T2_count', (
    select jsonb_build_object(
      'policies_total', (select count(*) from pg_policies
                          where schemaname='storage' and tablename='objects'),
      'read_policies_for_public', (select count(*) from pg_policies
                          where schemaname='storage' and tablename='objects'
                            and cmd in ('SELECT','ALL')
                            and (roles::text like '%public%' or roles::text like '%anon%'
                                 or roles::text like '%authenticated%')))),

  -- ─── 3) policy ที่ไม่ผูกกับ bucket ใดเลย (อันตรายที่สุด) ──────────
  --   qual ที่ไม่มีคำว่า bucket_id = เปิดกว้างทุก bucket
  'T3_unscoped_policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', policyname::text, 'cmd', cmd, 'roles', roles::text,
             'using', coalesce(qual,'(ไม่มีเงื่อนไข)'))
           order by policyname), '[]'::jsonb)
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
       and cmd in ('SELECT','ALL')
       and (roles::text like '%public%' or roles::text like '%anon%'
            or roles::text like '%authenticated%')
       and (qual is null or qual not like '%bucket_id%')),

  -- ─── 4) RLS เปิดอยู่จริงบน storage.objects ไหม ───────────────────
  'T4_rls_enabled', (
    select jsonb_build_object(
      'rls_enabled', c.relrowsecurity, 'force_rls', c.relforcerowsecurity,
      'verdict', case when c.relrowsecurity then '✅ RLS เปิด' else '❌ RLS ปิด — policy ไม่มีผลเลย' end)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'storage' and c.relname = 'objects'),

  -- ─── 5) สถานะ bucket ทั้ง 4 ─────────────────────────────────────
  'T5_hr_buckets', (
    select coalesce(jsonb_object_agg(b.id,
             jsonb_build_object('public', b.public, 'objects',
               (select count(*) from storage.objects o where o.bucket_id = b.id))), '{}'::jsonb)
      from storage.buckets b
     where b.id in ('njhr-doc-pdf','njhr-emp-files','njhr-face','njhr-signatures')),

  -- ─── 6) bucket อื่นที่ยัง public อ่านได้ = Known Risk (ห้ามแก้ใน I2) ──
  'T6_known_risk_other_buckets', (
    select coalesce(jsonb_agg(b.id order by b.id), '[]'::jsonb)
      from storage.buckets b
     where b.id not in ('njhr-doc-pdf','njhr-emp-files','njhr-face','njhr-signatures')
       and (b.public
            or exists (select 1 from pg_policies p
                        where p.schemaname='storage' and p.tablename='objects'
                          and p.cmd in ('SELECT','ALL')
                          and (p.roles::text like '%public%' or p.roles::text like '%anon%')
                          and coalesce(p.qual,'') like '%' || b.id || '%'))),

  'meta', jsonb_build_object('file','I2b_verify_storage.sql',
                             'writes_production', false,
                             'note', 'ใช้ TEMP TABLE (ON COMMIT DROP) และสลับ role แบบ local เท่านั้น',
                             'at', now())
)) as result;
