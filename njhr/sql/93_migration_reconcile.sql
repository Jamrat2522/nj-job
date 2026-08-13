-- ============================================================
-- NJ HR V2 — 93_migration_reconcile.sql
-- ปรับ Version Ledger ให้ตรงกับ Object ที่มีอยู่จริงบน Production
--
-- ⚠⚠ ไฟล์นี้ยังไม่ได้รัน — ส่งมาให้ตรวจก่อนเท่านั้น ⚠⚠
--
-- Drift ที่ผู้ดูแลตรวจพบ
--   มีใน GitHub แต่ Ledger ไม่มี
--     v11.8-dept-count · v2.10-activation-reject-package
--     v3.6-wht50-pdf   · v3.7-ot-approval-queue      (2 ตัวหลังยังไม่ได้รัน จึงถูกต้องแล้วที่ไม่มี)
--   มีใน Production แต่ GitHub ไม่มีไฟล์
--     v14-version-control
--
-- หลักการของไฟล์นี้
--   ⚠ ห้ามเติมเลข Version ลอย ๆ เพื่อให้ดูตรงกัน
--   จึงเติมเฉพาะ Version ที่ "พิสูจน์ได้ว่า Object ของมันมีอยู่จริง"
--   ถ้า Object ไม่ครบ จะไม่เติมและแจ้งให้ไปรัน Migration ตัวจริงแทน
--
--   ส่วน v14-version-control ที่ Production มีแต่ GitHub ไม่มีไฟล์
--   ไฟล์นี้ "ไม่แต่ง SQL ขึ้นเอง" แต่พิมพ์ Definition จริงออกมา
--   เพื่อให้ผู้ดูแลคัดลอกกลับเข้า GitHub เป็นไฟล์ Migration ที่ถูกต้อง
--
-- ไฟล์นี้ไม่สร้าง ไม่แก้ ไม่ลบ Object ใด ๆ ทั้งสิ้น
-- แตะเฉพาะตาราง njhr_schema_version เท่านั้น
-- ============================================================

-- ─── 1) รายงานสถานะ Ledger เทียบ Object จริง ────────────────
do $$
declare v_ok boolean;
begin
  raise notice '════════ Ledger ปัจจุบัน ════════';
  perform 1;

  -- v11.8-dept-count : Migration นี้เพิ่มการนับจำนวนพนักงานต่อแผนก
  select exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and p.proname = 'njhr_dept_list'
       and pg_get_function_result(p.oid) ilike '%emp_count%'
  ) into v_ok;
  raise notice 'v11.8-dept-count · Object มีจริง: %', v_ok;

  -- v2.10-activation-reject-package : เพิ่มการปฏิเสธคำขอเปิดใช้งาน
  select exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname = 'njhr_activation_reject'
  ) into v_ok;
  raise notice 'v2.10-activation-reject-package · Object มีจริง: %', v_ok;

  -- v3.6-wht50-pdf : ต้องยังไม่มี เพราะ 90_wht50_pdf.sql ยังไม่ได้รัน
  select exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname = 'njhr_doc_pdf_claim'
       and pg_get_functiondef(p.oid) ilike '%WHT50%'
  ) into v_ok;
  raise notice 'v3.6-wht50-pdf · Object มีจริง: %  (ควรเป็น false ถ้ายังไม่รัน 90)', v_ok;

  -- v3.7-ot-approval-queue : ต้องยังไม่มี เพราะ 91 ยังไม่ได้รัน
  raise notice 'v3.7-ot-approval-queue · Object มีจริง: %',
    (to_regprocedure('public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,int,int)')
     is not null);
end $$;


-- ─── 2) พิมพ์ Definition จริงของสิ่งที่ GitHub ยังไม่มี ──────
--  ให้ผู้ดูแลคัดลอกผลลัพธ์ไปสร้างไฟล์ Migration ใน GitHub
--  ⚠ ห้ามเดาเนื้อหาจากชื่อ Version — ต้องใช้ Definition จริงเท่านั้น
select 'v14-version-control · Function ที่เกี่ยวข้อง' as หัวข้อ,
       p.proname as ชื่อ,
       pg_get_functiondef(p.oid) as definition_จริง
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prokind = 'f'
   and (p.proname ilike '%version%' or p.proname ilike '%maintenance%'
        or p.proname ilike '%deploy%')
 order by p.proname;

select 'v14-version-control · ตารางที่เกี่ยวข้อง' as หัวข้อ,
       c.relname as ตาราง,
       (select string_agg(a.attname || ' ' || format_type(a.atttypid, a.atttypmod), ', '
                          order by a.attnum)
          from pg_attribute a
         where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as คอลัมน์
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and (c.relname ilike '%version%' or c.relname ilike '%maintenance%')
 order by c.relname;


-- ─── 3) เติม Ledger เฉพาะที่พิสูจน์ Object ได้จริง ──────────
begin;

do $$
declare v_ok boolean; v_added int := 0;
begin
  -- v11.8-dept-count
  select exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f' and p.proname = 'njhr_dept_list'
       and pg_get_function_result(p.oid) ilike '%emp_count%'
  ) into v_ok;
  if v_ok then
    insert into public.njhr_schema_version(version, note)
    values ('v11.8-dept-count',
            'เติมย้อนหลัง — Object มีอยู่จริงบน Production แล้ว (njhr_dept_list คืน emp_count)')
    on conflict (version) do nothing;
    v_added := v_added + 1;
  else
    raise notice 'ข้าม v11.8-dept-count — ไม่พบ Object จริง ต้องรัน Migration ตัวจริงก่อน';
  end if;

  -- v2.10-activation-reject-package
  select exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname = 'njhr_activation_reject'
  ) into v_ok;
  if v_ok then
    insert into public.njhr_schema_version(version, note)
    values ('v2.10-activation-reject-package',
            'เติมย้อนหลัง — Object มีอยู่จริงบน Production แล้ว (njhr_activation_reject)')
    on conflict (version) do nothing;
    v_added := v_added + 1;
  else
    raise notice 'ข้าม v2.10-activation-reject-package — ไม่พบ Object จริง';
  end if;

  raise notice 'เติม Ledger ย้อนหลัง % รายการ', v_added;
end $$;

commit;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════
select version, note, applied_at
  from public.njhr_schema_version
 order by applied_at nulls first, version;

-- Version ที่ยังไม่ควรมีใน Ledger (เพราะยังไม่ได้รัน Migration)
select 'v3.6-wht50-pdf' as version,
       (select count(*) from public.njhr_schema_version where version = 'v3.6-wht50-pdf') as อยู่ใน_ledger,
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname='public' and p.prokind='f' and p.proname='njhr_doc_pdf_claim'
           and pg_get_functiondef(p.oid) ilike '%WHT50%') as object_มีจริง
union all
select 'v3.7-ot-approval-queue',
       (select count(*) from public.njhr_schema_version where version = 'v3.7-ot-approval-queue'),
       (case when to_regprocedure(
          'public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,int,int)'
        ) is not null then 1 else 0 end);
-- ทั้งสองแถวต้องมีค่าเท่ากันในสองคอลัมน์สุดท้าย
-- (0,0 = ยังไม่รัน · 1,1 = รันแล้ว · ถ้าไม่เท่ากัน = Drift ต้องแก้)
