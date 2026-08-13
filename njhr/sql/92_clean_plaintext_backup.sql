-- ============================================================
-- NJ HR V2 — 92_clean_plaintext_backup.sql
-- กำจัด Plaintext Password ที่ค้างอยู่ในตาราง Backup
--
-- ⚠⚠ ไฟล์นี้ยังไม่ได้รัน — ส่งมาให้ตรวจก่อนเท่านั้น ⚠⚠
--
-- ข้อมูล Production ที่ใช้ตั้งต้น (ผู้ดูแลส่งผล Query มาให้)
--   njhr_appusers_backup_pw_20260727   plaintext 111 แถว
--   njhr_pw_backup                     plaintext 110 แถว
--   njhr_appusers_backup_20260727      plaintext 111 แถว
--   app_users (app_code = 'salary')    57 คน · bcrypt 57 · plaintext 0
--
--   Function ที่อ้างถึง njhr_pw_backup
--     njhr_migrate_passwords · njhr_verify_passwords · njhr_login_selftest
--
-- หลักการของไฟล์นี้
--   1. ไม่แตะ app_users เลย — Credential ที่ใช้ Login จริงไม่ถูกกระทบ
--   2. ไม่ DROP ตารางทันที เพราะยังมี Function อ้างถึง
--      เลือกวิธี "ลบเฉพาะข้อมูลรหัสผ่าน" ซึ่งปิดช่องโหว่ได้ทันที
--      โดยโครงสร้างตารางยังอยู่ Function เดิมจึงไม่พังตอนถูกเรียก
--   3. ไม่คัดลอก Plaintext ไปที่ใดทั้งสิ้น
--   4. เก็บข้อมูลที่ใช้ย้อนกลับได้และไม่ใช่ความลับไว้ครบ
--      (id · username · app_code · employee_id · role · status · created_at)
--
-- ⚠ ไฟล์นี้ทำลายข้อมูล (ลบรหัสผ่านถาวร) — อ่าน PREFLIGHT ให้จบก่อนรัน
--   และควรมี Snapshot ของฐานข้อมูลไว้ก่อนตามนโยบายปกติ
-- ============================================================

-- ─── 0) PREFLIGHT — ตรวจของจริงก่อน ไม่เดา ──────────────────
--  บล็อกนี้ "อ่านอย่างเดียว" รันได้ปลอดภัย ให้ดูผลก่อนแล้วค่อยรันส่วนที่เหลือ
do $$
declare r record; v_txt text; n bigint;
begin
  raise notice '───────── ตารางที่จะแตะ ─────────';
  for r in
    select c.relname tbl
      from pg_class c join pg_namespace n2 on n2.oid = c.relnamespace
     where n2.nspname = 'public' and c.relkind = 'r'
       and c.relname in ('njhr_appusers_backup_pw_20260727',
                         'njhr_pw_backup',
                         'njhr_appusers_backup_20260727')
     order by 1
  loop
    execute format('select count(*) from public.%I', r.tbl) into n;
    raise notice 'พบตาราง % · % แถว', r.tbl, n;
  end loop;

  raise notice '───────── คอลัมน์ที่เก็บรหัสผ่าน ─────────';
  for r in
    select table_name tbl, column_name col, data_type dt
      from information_schema.columns
     where table_schema = 'public'
       and table_name in ('njhr_appusers_backup_pw_20260727',
                          'njhr_pw_backup',
                          'njhr_appusers_backup_20260727')
       and (column_name ilike '%password%' or column_name ilike '%passwd%'
            or column_name ilike '%pw%')
     order by 1, 2
  loop
    raise notice '  %.% (%)', r.tbl, r.col, r.dt;
  end loop;

  raise notice '───────── Function ที่อ้างถึงตารางเหล่านี้ ─────────';
  for r in
    select p.proname fn
      from pg_proc p join pg_namespace n2 on n2.oid = p.pronamespace
     where n2.nspname = 'public'
       and p.prokind = 'f'          -- ตัด aggregate ออก ไม่งั้น pg_get_functiondef จะ error
       and (pg_get_functiondef(p.oid) ilike '%njhr_pw_backup%'
         or pg_get_functiondef(p.oid) ilike '%njhr_appusers_backup%')
     order by 1
  loop
    raise notice '  %', r.fn;
  end loop;

  raise notice '───────── View / FK / Trigger ที่อ้างถึง ─────────';
  for r in
    select v.viewname nm from pg_views v
     where v.schemaname = 'public'
       and (v.definition ilike '%njhr_pw_backup%'
         or v.definition ilike '%njhr_appusers_backup%')
  loop
    raise notice '  VIEW %', r.nm;
  end loop;

  select count(*) into n
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
   where con.contype = 'f'
     and c.relname in ('njhr_appusers_backup_pw_20260727',
                       'njhr_pw_backup', 'njhr_appusers_backup_20260727');
  raise notice '  Foreign Key ที่ชี้ออกจากตาราง Backup: %', n;

  select count(*) into n
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
   where not t.tgisinternal
     and c.relname in ('njhr_appusers_backup_pw_20260727',
                       'njhr_pw_backup', 'njhr_appusers_backup_20260727');
  raise notice '  Trigger บนตาราง Backup: %', n;

  raise notice '───────── สถานะ Login ปัจจุบัน (ห้ามเปลี่ยน) ─────────';
  select count(*) into n from public.app_users where app_code = 'salary';
  raise notice '  app_users (salary) ทั้งหมด: %', n;
  select count(*) into n from public.app_users
   where app_code = 'salary' and password_hash like '$2%';
  raise notice '  ที่เป็น bcrypt: %', n;

  v_txt := 'PREFLIGHT เสร็จ — อ่านผลด้านบนให้ครบก่อนรันส่วนถัดไป';
  raise notice '%', v_txt;
end $$;


-- ════════════════════════════════════════════════════════════
-- ⚠ ส่วนด้านล่างนี้แก้ข้อมูลจริง — รันเมื่อยืนยัน PREFLIGHT แล้วเท่านั้น
-- ════════════════════════════════════════════════════════════

begin;

-- ─── 1) ลบเฉพาะค่ารหัสผ่านออกจากตาราง Backup ────────────────
--  ใช้ SET NULL ไม่ DROP COLUMN เพราะ Function เดิม 3 ตัวยังอ้างชื่อคอลัมน์อยู่
--  ถ้า DROP COLUMN ทันที Function จะพังตอนถูกเรียกแทนที่จะคืนค่าว่าง
--  ค้นหาคอลัมน์จาก information_schema จริง ไม่ระบุชื่อตายตัว
do $$
declare r record; n bigint; total bigint := 0;
begin
  for r in
    select table_name tbl, column_name col
      from information_schema.columns
     where table_schema = 'public'
       and table_name in ('njhr_appusers_backup_pw_20260727',
                          'njhr_pw_backup',
                          'njhr_appusers_backup_20260727')
       and (column_name ilike '%password%' or column_name ilike '%passwd%')
       and column_name not ilike '%hash%'      -- คอลัมน์ hash ไม่ใช่ Plaintext เก็บไว้ได้
     order by 1, 2
  loop
    execute format('update public.%I set %I = null where %I is not null',
                   r.tbl, r.col, r.col);
    get diagnostics n = row_count;
    total := total + n;
    raise notice 'ล้าง %.% → % แถว', r.tbl, r.col, n;
  end loop;
  raise notice 'ล้างรหัสผ่านรวม % แถว', total;
end $$;


-- ─── 2) ปิดการใช้งานเครื่องมือย้ายรหัสผ่านที่หมดหน้าที่แล้ว ──
--  njhr_migrate_passwords · njhr_verify_passwords · njhr_login_selftest
--  เป็นเครื่องมือของการย้าย plaintext → bcrypt ซึ่งทำเสร็จแล้ว (bcrypt 57/57)
--  ไม่ DROP เพราะอาจมีสคริปต์ภายนอกเรียกอยู่ แต่ทำให้คืนค่าที่ไม่มีความลับแทน
--  ถ้ายืนยันแล้วว่าไม่มีใครเรียก ให้ DROP ได้ในรอบถัดไป (ดูท้ายไฟล์)
do $$
declare v_args text;
begin
  for v_args in
    select pg_get_function_identity_arguments(p.oid)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and p.proname = 'njhr_migrate_passwords'
  loop
    execute format(
      'create or replace function public.njhr_migrate_passwords(%s)
       returns text language plpgsql security definer set search_path = public as $f$
       begin
         return ''เครื่องมือย้ายรหัสผ่านถูกปิดการใช้งานแล้ว '' ||
                ''(ย้ายเป็น bcrypt เสร็จสิ้น และรหัสผ่านแบบข้อความถูกลบออกจากระบบแล้ว)'';
       end $f$;', v_args);
    raise notice 'ปิดการใช้งาน njhr_migrate_passwords(%)', v_args;
  end loop;
end $$;


-- ─── 3) บันทึกลง Version Ledger ─────────────────────────────
insert into public.njhr_schema_version(version, note)
values ('v3.8-clean-plaintext-backup',
        'ลบ Plaintext Password ออกจากตาราง Backup ทั้ง 3 ตัว · ปิดเครื่องมือย้ายรหัสผ่าน · ไม่แตะ app_users')
on conflict (version) do nothing;

commit;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION — ต้องได้ 0 ทุกช่องที่เป็น Plaintext
-- ════════════════════════════════════════════════════════════
do $$
declare r record; n bigint; bad bigint := 0;
begin
  for r in
    select table_name tbl, column_name col
      from information_schema.columns
     where table_schema = 'public'
       and table_name in ('njhr_appusers_backup_pw_20260727',
                          'njhr_pw_backup',
                          'njhr_appusers_backup_20260727')
       and (column_name ilike '%password%' or column_name ilike '%passwd%')
       and column_name not ilike '%hash%'
  loop
    execute format('select count(*) from public.%I where %I is not null', r.tbl, r.col)
      into n;
    raise notice '%.% ที่ยังมีค่า: %', r.tbl, r.col, n;
    bad := bad + n;
  end loop;
  if bad > 0 then
    raise exception 'ยังเหลือรหัสผ่านแบบข้อความ % ค่า — ยังไม่สะอาด', bad;
  end if;
  raise notice '✓ Plaintext Password ในตาราง Backup = 0';
end $$;

select jsonb_pretty(jsonb_build_object(
  'app_users salary ทั้งหมด',
    (select count(*) from public.app_users where app_code = 'salary'),
  'ที่เป็น bcrypt',
    (select count(*) from public.app_users
      where app_code = 'salary' and password_hash like '$2%'),
  'ที่ยังไม่ใช่ bcrypt (ต้องเป็น 0)',
    (select count(*) from public.app_users
      where app_code = 'salary'
        and (password_hash is null or password_hash not like '$2%')),
  'ข้อมูลย้อนกลับที่ยังเก็บไว้ (ไม่ใช่ความลับ)',
    (select count(*) from public.njhr_pw_backup)
)) as report;


-- ════════════════════════════════════════════════════════════
-- ขั้นถัดไป (ยังไม่ทำในไฟล์นี้ — ต้องอนุมัติแยก)
-- ════════════════════════════════════════════════════════════
-- เมื่อยืนยันแล้วว่าไม่มีสคริปต์ภายนอกเรียก 3 Function นี้อีก
-- จึงค่อยลบทิ้งทั้งฟังก์ชันและคอลัมน์:
--
--   drop function if exists public.njhr_migrate_passwords();
--   drop function if exists public.njhr_verify_passwords();
--   drop function if exists public.njhr_login_selftest();
--   alter table public.njhr_pw_backup drop column if exists password;
--   alter table public.njhr_appusers_backup_pw_20260727 drop column if exists password;
--   alter table public.njhr_appusers_backup_20260727 drop column if exists password;
--
-- และถ้าไม่ต้องใช้ข้อมูลย้อนกลับแล้วจริง ๆ จึงค่อย DROP ตาราง
-- ⚠ ห้ามทำขั้นนี้พร้อมกับขั้นบน — แยกรอบเพื่อให้ย้อนกลับได้ถ้ามีอะไรเรียกอยู่
--
-- ขอบเขต: ไฟล์นี้แตะเฉพาะตาราง Backup ของ NJ HR
-- ระบบอื่นในฐานเดียวกัน (advance / amend / billing / transport / timeline)
-- ไม่ถูกแตะเลย และ app_users ของทุกระบบไม่ถูกแก้แม้แต่แถวเดียว
