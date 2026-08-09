-- ============================================================
-- NJ HR V.10 — 46_leave_form.sql
-- ปรับ njhr_leave_submit ให้แนบไฟล์ได้หลายไฟล์ในคำขอเดียว (ธุรกรรมเดียว)
--
-- เดิมรับไฟล์เดียว (p_file_name / p_file_url / p_file_size)
-- ใหม่รับ p_files เป็น jsonb array: [{"name":"...","url":"...","size":123}, ...]
--
-- ⚠️ ต้อง DROP signature เดิมก่อน มิฉะนั้นจะเกิด overload ซ้อนแล้วเรียกไม่ได้
--    (เคยเจอปัญหานี้กับ njhr_pay_items มาแล้ว)
-- ⚠️ ลำดับการติดตั้ง: รันไฟล์นี้ให้เสร็จ "ก่อน" อัปโหลด app.js ใหม่
--    ระหว่างนั้นการยื่นใบลาจากเวอร์ชันเก่าจะใช้ไม่ได้ชั่วคราว (ไม่กี่วินาที)
--
-- ตรรกะตรวจสอบทุกข้อคงเดิมทั้งหมด: เหตุผลบังคับ · ลำดับวันที่ · วันทำงาน > 0 ·
-- ทับช่วงคำขอเดิม · โควตาไม่พอ · ลาป่วยต้องแนบเอกสาร · กันกดส่งซ้ำด้วย client_key
-- ต้องรัน 41_leave_rpc.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_leave_submit') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_leave_submit — รัน 41_leave_rpc.sql ก่อน';
  end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='leave_attachments'
     and column_name in ('id','leave_id','file_name','file_url','file_size','created_at');
  if n <> 6 then raise exception 'PREFLIGHT: leave_attachments คอลัมน์ไม่ครบ 6 (พบ %)', n; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

-- สำรองใบลา/ไฟล์แนบก่อนแตะฟังก์ชัน
create table if not exists njhr_leave_backup_20260802 as
  select *, now() as backed_up_at from public.leave_requests;
create table if not exists njhr_leaveatt_backup_20260802 as
  select *, now() as backed_up_at from public.leave_attachments;


-- ─── 1) ลบ signature เดิม (ไฟล์เดียว) แล้วสร้างใหม่ (หลายไฟล์) ──
drop function if exists public.njhr_leave_submit(
  text, text, text, date, date, time, time, text, uuid, text, text, int, text);

create or replace function public.njhr_leave_submit(
  p_token text, p_leave_type text, p_mode text,
  p_start_date date, p_end_date date,
  p_start_time time default null, p_end_time time default null,
  p_reason text default '', p_delegate uuid default null,
  p_files jsonb default null,          -- [{"name":"a.pdf","url":"https://...","size":1234}, ...]
  p_client_key text default null)
returns table (id uuid, total_days numeric, hours numeric, duplicated boolean, file_count int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  c record; v_type public.leave_type; v_end date; v_days numeric := 0; v_hours numeric := 0;
  v_unit text; v_half boolean := false; v_quota numeric; v_usedpend numeric; v_id uuid; v_dup uuid;
  v_files jsonb := coalesce(p_files, '[]'::jsonb); v_n int := 0; f jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  if jsonb_typeof(v_files) <> 'array' then
    raise exception 'รูปแบบไฟล์แนบไม่ถูกต้อง' using errcode='22023';
  end if;

  -- กันกดส่งซ้ำ: key เดิมภายใน 10 นาที = คืนใบเดิม ไม่สร้างซ้ำ
  if p_client_key is not null and p_client_key <> '' then
    select r.id into v_dup from public.leave_requests r
     where r.employee_id = c.employee_id
       and r.created_at > now() - interval '10 minutes'
       and r.approvals->0->'meta'->>'client_key' = p_client_key
     limit 1;
    if v_dup is not null then
      return query select v_dup, r.total_days, r.hours, true,
                          (select count(*)::int from public.leave_attachments a where a.leave_id = v_dup)
                     from public.leave_requests r where r.id = v_dup;
      return;
    end if;
  end if;

  begin v_type := upper(p_leave_type)::public.leave_type;
  exception when others then
    raise exception 'ประเภทการลาไม่ถูกต้อง (%)', p_leave_type using errcode='22023';
  end;

  if coalesce(btrim(p_reason),'') = '' then
    raise exception 'กรุณาระบุเหตุผลการลา' using errcode='22023';
  end if;

  v_end := case when upper(p_mode) = 'FULL' then p_end_date else p_start_date end;
  if p_start_date > v_end then
    raise exception 'วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด' using errcode='22023';
  end if;

  if upper(p_mode) = 'FULL' then
    v_unit := 'day';  v_days := public.njhr_leave_workdays(p_start_date, v_end);
    if v_days <= 0 then
      raise exception 'ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)' using errcode='22023';
    end if;
  elsif upper(p_mode) in ('HALF_AM','HALF_PM') then
    v_unit := 'halfday'; v_half := true;
    v_days := case when public.njhr_leave_workdays(p_start_date, p_start_date) > 0 then 0.5 else 0 end;
    if v_days <= 0 then
      raise exception 'ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)' using errcode='22023';
    end if;
  elsif upper(p_mode) = 'HOURLY' then
    v_unit := 'hour';
    if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
      raise exception 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม' using errcode='22023';
    end if;
    v_hours := round(extract(epoch from (p_end_time - p_start_time))/3600.0, 2);
  else
    raise exception 'รูปแบบการลาไม่ถูกต้อง (%)', p_mode using errcode='22023';
  end if;

  -- ห้ามทับช่วงกับใบที่ยังมีผล
  if exists (select 1 from public.leave_requests r
              where r.employee_id = c.employee_id
                and r.status in ('PENDING','APPROVED')
                and p_start_date <= r.end_date and r.start_date <= v_end) then
    raise exception 'ช่วงวันที่นี้ทับกับคำขอลาเดิมที่ยังมีผลอยู่' using errcode='23505';
  end if;

  -- โควตา: ตรวจเฉพาะประเภทที่มีโควตาจริงใน employees
  v_quota := public.njhr_leave_quota(c.employee_id, v_type::text);
  if v_quota is not null then
    select coalesce(sum(coalesce(r.total_days,0)+coalesce(r.hours,0)/8),0) into v_usedpend
      from public.leave_requests r
     where r.employee_id = c.employee_id and r.leave_type = v_type
       and r.status in ('APPROVED','PENDING')
       and extract(year from r.start_date) = extract(year from p_start_date);
    if v_quota - v_usedpend < v_days + v_hours/8 then
      raise exception 'วันลาคงเหลือไม่เพียงพอ (คงเหลือ % วัน)', round(v_quota - v_usedpend, 2)
        using errcode='23514';
    end if;
  end if;

  -- ตรวจไฟล์แนบ: ต้องมี name และ url จริงทุกไฟล์
  for f in select * from jsonb_array_elements(v_files) loop
    if coalesce(f->>'name','') = '' or coalesce(f->>'url','') = '' then
      raise exception 'ข้อมูลไฟล์แนบไม่ครบ (ต้องมีชื่อไฟล์และที่อยู่ไฟล์)' using errcode='22023';
    end if;
    v_n := v_n + 1;
  end loop;

  -- ลาป่วยต้องแนบเอกสาร (กฎเดิมของระบบ)
  if v_type = 'SICK' and v_n = 0 then
    raise exception 'ลาป่วยต้องแนบเอกสารประกอบ' using errcode='22023';
  end if;

  insert into public.leave_requests(
    employee_id, leave_type, start_date, end_date, leave_unit,
    start_time, end_time, hours, is_halfday, total_days, reason, status, approvals)
  values (c.employee_id, v_type, p_start_date, v_end, v_unit,
    case when v_unit='hour' then p_start_time end,
    case when v_unit='hour' then p_end_time end,
    v_hours, v_half, v_days, btrim(p_reason), 'PENDING',
    jsonb_build_array(jsonb_build_object(
      'seq', 1, 'at', to_char(now() at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:MI'),
      'by', c.app_user_id, 'by_name', coalesce(c.emp_name, c.username),
      'action', 'SUBMIT', 'note', '',
      'meta', jsonb_build_object('mode', upper(p_mode), 'delegate', p_delegate,
                                 'client_key', coalesce(p_client_key,'')))))
  returning leave_requests.id into v_id;

  -- แนบไฟล์ทั้งหมดในธุรกรรมเดียวกับใบลา (สำเร็จทั้งหมดหรือไม่สำเร็จเลย)
  if v_n > 0 then
    insert into public.leave_attachments(leave_id, file_name, file_url, file_size)
    select v_id, x->>'name', x->>'url', nullif(x->>'size','')::int
      from jsonb_array_elements(v_files) x;
  end if;

  insert into public.notifications(user_id, title, body, icon)
  select a.id, 'คำขอลาใหม่',
         coalesce(c.emp_name, c.username) || ' ขอลา ' ||
         case when v_unit='hour' then v_hours || ' ชม.' else v_days || ' วัน' end,
         'leave'
    from public.app_users a
   where a.app_code = 'salary' and coalesce(a.is_active,true)
     and public.njhr_norm_role(a.role::text) in ('SUPER_ADMIN','ADMIN','HR','MANAGER');

  perform public.njhr_leave_audit(c.username, 'LEAVE_REQ', v_id,
    'ส่งใบลา ' || v_type::text || ' ' || p_start_date || ' ถึง ' || v_end ||
    ' (ไฟล์แนบ ' || v_n || ' ไฟล์)');

  return query select v_id, v_days, v_hours, false, v_n;
end $$;

grant execute on function public.njhr_leave_submit(
  text,text,text,date,date,time,time,text,uuid,jsonb,text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v10.6-leave-form', 'ใบลา: แนบไฟล์หลายไฟล์ในธุรกรรมเดียว')
on conflict (version) do nothing;


-- ─── 2) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'submit_signatures', (select jsonb_agg(pg_get_function_arguments(p.oid))
                          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                         where n.nspname='public' and p.proname='njhr_leave_submit'),
  'signature_count', (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proname='njhr_leave_submit'),
  'leave_requests_untouched', (select count(*) from public.leave_requests),
  'attachments_untouched',    (select count(*) from public.leave_attachments)
)) as install_report;


-- ─── 3) ROLLBACK (กลับไปรับไฟล์เดียวแบบเดิม) ─────────────────
-- drop function if exists public.njhr_leave_submit(text,text,text,date,date,time,time,text,uuid,jsonb,text);
-- แล้วรัน 41_leave_rpc.sql ส่วนที่ 5.1 ใหม่อีกครั้ง
-- คืนข้อมูล: njhr_leave_backup_20260802 / njhr_leaveatt_backup_20260802
