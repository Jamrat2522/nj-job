-- ============================================================
-- NJ HR V.10 — 94_face_storage.sql
-- สิทธิ์เข้าถึงรูป Snapshot การสแกนใบหน้า (bucket njhr-face แบบ private)
--
-- ต่อยอดจาก 92_face_attendance.sql (ไม่สร้างตารางใหม่ ไม่แตะของเดิม)
--   njhr_emp_faces · njhr_face_attempts · njhr_att_punch_log.snapshot_path
--   bucket njhr-face (private) ถูกสร้างไว้แล้วใน 92 ข้อ 10
--
-- แนวทางเดียวกับ njhr-emp-file ที่ใช้ได้ผลแล้ว
--   เบราว์เซอร์แตะ Storage ตรงไม่ได้เลย (bucket private ไม่มี policy ให้ anon)
--   ทุกการอัปโหลด/เปิดดูผ่าน Edge Function njhr-face-file (service_role)
--   ซึ่งเรียก 2 RPC ข้างล่างนี้เพื่อให้ "ฐานข้อมูล" เป็นคนตัดสินสิทธิ์
--
-- ต้องรัน 92_face_attendance.sql มาก่อน · รันซ้ำได้
-- ============================================================

do $$
begin
  if to_regclass('public.njhr_emp_faces') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_faces — รัน 92_face_attendance.sql ก่อน';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_att_punch_log'
                    and column_name='snapshot_path') then
    raise exception 'PREFLIGHT: njhr_att_punch_log ยังไม่มี snapshot_path — รัน 92 ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) ขอ path สำหรับอัปโหลด (Edge Function เรียกด้วย service_role) ──
--  p_kind = ENROLL | PUNCH | REQUEST
create or replace function public.njhr_face_upload_path(
  p_token text, p_kind text, p_action text default null, p_employee uuid default null)
returns table (storage_path text, employee_id uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_kind text := upper(btrim(coalesce(p_kind,'PUNCH')));
        v_act text := upper(btrim(coalesce(p_action,''))); v_emp uuid;
begin
  select * into c from public.njhr_face_guard(p_token, false);
  if v_kind not in ('ENROLL','PUNCH','REQUEST') then
    raise exception 'ประเภทรูปไม่ถูกต้อง' using errcode='22023';
  end if;

  -- ลงทะเบียนใบหน้าให้คนอื่นได้เฉพาะผู้ดูแล · นอกนั้นเป็นของตัวเองเสมอ
  if v_kind = 'ENROLL' and p_employee is not null and p_employee <> c.employee_id then
    perform public.njhr_face_guard(p_token, true);
    v_emp := p_employee;
  else
    v_emp := c.employee_id;
  end if;
  if v_emp is null then
    raise exception 'บัญชีนี้ยังไม่ได้ผูกกับพนักงาน' using errcode='42501';
  end if;

  return query select
    v_emp::text || '/' || lower(v_kind) ||
    case when v_act in ('IN','OUT') then '/' || lower(v_act) else '' end || '/' ||
    to_char(now() at time zone 'Asia/Bangkok', 'YYYYMMDD/HH24MISS') || '-' ||
    replace(gen_random_uuid()::text, '-', '') || '.jpg',
    v_emp;
end $$;


-- ─── 2) ขอสิทธิ์เปิดดูรูป (Edge Function เรียกด้วย service_role) ─────
--  พนักงานทั่วไปเปิดได้เฉพาะรูปของตนเอง · ผู้ดูแลเปิดได้ทุกคน
create or replace function public.njhr_face_snapshot_access(p_token text, p_path text)
returns table (storage_path text, owner_id uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_path text := btrim(coalesce(p_path,'')); v_owner uuid;
begin
  select * into c from public.njhr_face_guard(p_token, false);
  if v_path = '' then raise exception 'ไม่พบรูปที่ต้องการเปิด' using errcode='22023'; end if;

  -- path ต้องเป็นของจริงที่ระบบบันทึกไว้เท่านั้น (กันเดา path มั่ว)
  select coalesce(
    (select l.employee_id from public.njhr_att_punch_log l where l.snapshot_path = v_path limit 1),
    (select a.employee_id from public.njhr_face_attempts a where a.snapshot_path = v_path limit 1),
    (select f.employee_id from public.njhr_emp_faces f where f.enroll_snapshot = v_path limit 1),
    (select r.employee_id from public.attendance_corrections r where r.attachment_path = v_path limit 1)
  ) into v_owner;

  if v_owner is null then
    raise exception 'ไม่พบรูปนี้ในระบบ' using errcode='P0002';
  end if;
  if not c.is_admin and v_owner is distinct from c.employee_id then
    raise exception 'คุณเปิดดูได้เฉพาะรูปของตนเองเท่านั้น' using errcode='42501';
  end if;

  perform public.njhr_audit_write(p_token, 'FACE_SNAPSHOT_VIEW', 'attendance',
    'njhr_att_punch_log', v_owner::text, 'เปิดดูรูปหลักฐานการสแกนใบหน้า', null, null, null);

  return query select v_path, v_owner;
end $$;


-- ─── 3) GRANT — เฉพาะ service_role (Edge Function) ──────────
revoke execute on function public.njhr_face_upload_path(text,text,text,uuid)  from public, anon, authenticated;
revoke execute on function public.njhr_face_snapshot_access(text,text)        from public, anon, authenticated;
grant  execute on function public.njhr_face_upload_path(text,text,text,uuid)    to service_role;
grant  execute on function public.njhr_face_snapshot_access(text,text)          to service_role;

insert into public.njhr_schema_version(version, note)
values ('v14.3-face-storage', 'สิทธิ์อัปโหลด/เปิดดูรูป Snapshot การสแกนใบหน้าผ่าน Edge Function')
on conflict (version) do nothing;


-- ─── 4) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'bucket', (select jsonb_build_object('id', id, 'public', public)
               from storage.buckets where id = 'njhr-face'),
  'bucket_anon_policies', coalesce((select count(*) from pg_policies
                                     where schemaname='storage' and tablename='objects'
                                       and qual like '%njhr-face%'), 0),
  'functions', (select jsonb_agg(jsonb_build_object('name', p.proname,
                  'args', pg_get_function_arguments(p.oid),
                  'anon_can_execute', has_function_privilege('anon', p.oid, 'EXECUTE'))
                  order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public'
                   and p.proname in ('njhr_face_upload_path','njhr_face_snapshot_access'))
)) as install_report;
