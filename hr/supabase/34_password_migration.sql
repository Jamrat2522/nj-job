-- ============================================================
-- แปลงรหัสผ่านทั้งหมดเป็น bcrypt อย่างปลอดภัย — ทำงานภายในฐานข้อมูลล้วน
-- ผู้ใช้ไม่ต้องเห็น/พิมพ์/ส่งรหัสผ่านใด ๆ · ไม่มีคำสั่งไหนคืนค่ารหัสผ่านออกมา
-- ลำดับ: 1) แปลง → 2) ตรวจสอบทุกบัญชี → 3) ลบ plaintext เฉพาะที่ตรวจผ่าน
-- ============================================================

-- ─── ขั้นที่ 0: BACKUP (idempotent — รันซ้ำได้) ───────────────
create table if not exists njhr_pw_backup as
  select id, username, password, password_hash, now() as backed_up_at
  from public.app_users where app_code = 'salary';
insert into njhr_pw_backup (id, username, password, password_hash, backed_up_at)
  select a.id, a.username, a.password, a.password_hash, now()
  from public.app_users a
  where a.app_code='salary' and not exists (select 1 from njhr_pw_backup b where b.id = a.id);
select count(*) as "สำรองไว้ทั้งหมด" from njhr_pw_backup;


-- ─── ขั้นที่ 1: แปลงเป็น bcrypt (อ่านรหัสจากตาราง/แบ็กอัปเอง) ────
create or replace function public.njhr_migrate_passwords()
returns table (แปลงสำเร็จ int, ตรวจไม่ผ่าน int, ไม่มีรหัสต้นทาง int, bcrypt_อยู่แล้ว int)
language plpgsql security definer set search_path = public, extensions, pg_catalog as $$
declare r record; src text; h text; ok_n int := 0; bad_n int := 0; none_n int := 0; had_n int := 0;
begin
  for r in select a.id, a.password, a.password_hash from public.app_users a where a.app_code='salary'
  loop
    -- รหัสต้นทาง: ใช้ของปัจจุบัน ถ้าถูกลบไปแล้วให้ย้อนดูจากแบ็กอัป
    src := nullif(r.password, '');
    if src is null then
      select nullif(b.password,'') into src from njhr_pw_backup b
       where b.id = r.id and b.password is not null order by b.backed_up_at limit 1;
    end if;

    if r.password_hash like '$2%' and src is not null
       and r.password_hash = extensions.crypt(src, r.password_hash) then
      had_n := had_n + 1; continue;                    -- เป็น bcrypt ที่ถูกต้องอยู่แล้ว
    end if;
    if src is null then none_n := none_n + 1; continue; end if;

    h := extensions.crypt(src, extensions.gen_salt('bf', 10));
    if h = extensions.crypt(src, h) then               -- ตรวจทันทีก่อนเขียน
      update public.app_users set password_hash = h where id = r.id;
      ok_n := ok_n + 1;
    else
      bad_n := bad_n + 1;
    end if;
  end loop;
  return query select ok_n, bad_n, none_n, had_n;
end $$;

select * from public.njhr_migrate_passwords();


-- ─── ขั้นที่ 2: ตรวจสอบว่าทุกบัญชี login ด้วยรหัสเดิมได้จริง ──────
--     (ทดสอบภายในฐานข้อมูล ไม่มีรหัสผ่านออกมาในผลลัพธ์)
create or replace function public.njhr_verify_passwords()
returns table (ตรวจผ่าน int, ตรวจไม่ผ่าน int, ไม่มีรหัสต้นทาง int, รายชื่อที่ไม่ผ่าน text)
language plpgsql security definer set search_path = public, extensions, pg_catalog as $$
declare r record; src text; pass_n int := 0; fail_n int := 0; none_n int := 0; fails text := '';
begin
  for r in select a.id, a.username, a.password, a.password_hash from public.app_users a
            where a.app_code='salary'
  loop
    src := nullif(r.password, '');
    if src is null then
      select nullif(b.password,'') into src from njhr_pw_backup b
       where b.id = r.id and b.password is not null order by b.backed_up_at limit 1;
    end if;
    if src is null then none_n := none_n + 1; continue; end if;

    if r.password_hash like '$2%' and r.password_hash = extensions.crypt(src, r.password_hash) then
      pass_n := pass_n + 1;
    else
      fail_n := fail_n + 1;
      fails := fails || case when fails='' then '' else ', ' end || r.username;
    end if;
  end loop;
  return query select pass_n, fail_n, none_n, coalesce(nullif(fails,''), '—');
end $$;

select * from public.njhr_verify_passwords();


-- ─── ขั้นที่ 3: ลบ plaintext เฉพาะบัญชีที่ตรวจผ่านแล้วเท่านั้น ────
--     ⚠️ รันหลังจากขั้นที่ 2 แสดง "ตรวจไม่ผ่าน = 0" เท่านั้น
create or replace function public.njhr_purge_plaintext()
returns table (ลบ_plaintext int, คงไว้เพราะยังไม่ผ่าน int)
language plpgsql security definer set search_path = public, extensions, pg_catalog as $$
declare r record; src text; del_n int := 0; keep_n int := 0;
begin
  for r in select a.id, a.password, a.password_hash from public.app_users a
            where a.app_code='salary' and a.password is not null and a.password <> ''
  loop
    src := r.password;
    if r.password_hash like '$2%' and r.password_hash = extensions.crypt(src, r.password_hash) then
      update public.app_users set password = null where id = r.id;
      del_n := del_n + 1;
    else
      keep_n := keep_n + 1;
    end if;
  end loop;
  return query select del_n, keep_n;
end $$;
-- select * from public.njhr_purge_plaintext();     -- ← รันเมื่อขั้นที่ 2 ผ่านหมดแล้ว


-- ─── ขั้นที่ 4: ทดสอบ login จริงทุก Role โดยไม่เปิดเผยรหัส ────────
create or replace function public.njhr_login_selftest(p_limit int default 6)
returns table (username text, role text, ผลทดสอบ text, emp_code text, emp_name text)
language plpgsql security definer set search_path = public, extensions, pg_catalog as $$
declare r record; src text; res record;
begin
  for r in
    select distinct on (a.role) a.id, a.username, a.role::text rl
      from public.app_users a
     where a.app_code='salary' and a.employee_id is not null
     order by a.role, a.username limit p_limit
  loop
    select nullif(b.password,'') into src from njhr_pw_backup b
     where b.id = r.id and b.password is not null order by b.backed_up_at limit 1;
    if src is null then
      select nullif(a.password,'') into src from public.app_users a where a.id = r.id;
    end if;
    if src is null then
      return query select r.username, r.rl, '⏭ ไม่มีรหัสต้นทางให้ทดสอบ'::text, null::text, null::text;
      continue;
    end if;
    begin
      select * into res from public.njhr_login(r.username, src, 'selftest');
      perform public.njhr_logout(res.session_token);
      return query select r.username, r.rl, '✅ login ผ่าน'::text, res.emp_code, res.emp_name;
    exception when others then
      return query select r.username, r.rl, ('❌ ' || sqlerrm)::text, null::text, null::text;
    end;
  end loop;
end $$;

select * from public.njhr_login_selftest(6);


-- ─── ROLLBACK ────────────────────────────────────────────────
-- update public.app_users a set password = b.password, password_hash = b.password_hash
--   from njhr_pw_backup b where a.id = b.id;
-- drop function if exists public.njhr_migrate_passwords(), public.njhr_verify_passwords(),
--   public.njhr_purge_plaintext(), public.njhr_login_selftest(int);
