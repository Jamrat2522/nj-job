-- ════════════════════════════════════════════════════════════════════════════
-- 100_shift_history.sql — ประวัติกะย้อนหลังของพนักงาน (อ่านอย่างเดียว)
--
-- ขอบเขตที่อนุญาตของงานนี้:
--   • เพิ่ม RPC ใหม่ 1 ตัวสำหรับ "อ่าน" ประวัติกะเท่านั้น
--   • ห้ามแก้ Logic กะเดิม · ห้ามแตะการคำนวณ Attendance
--   • ห้ามแก้โครงสร้าง employee_shifts (ไฟล์นี้ไม่มี ALTER / INSERT / UPDATE / DELETE เลย)
--
-- สิ่งที่ไฟล์นี้ทำ:
--   1) ตรวจ Preflight ว่าตาราง/คอลัมน์/ฟังก์ชันที่อ้างถึงมีจริง (ไม่ตรง = หยุด ไม่เขียนทับ)
--   2) สร้าง index อ่านอย่างเดียวแบบ IF NOT EXISTS (ไม่เปลี่ยนข้อมูล ไม่เปลี่ยนพฤติกรรม)
--   3) สร้าง public.njhr_shift_history(...) — SECURITY DEFINER + ตรวจสิทธิ์จาก Session ผ่าน
--      njhr_shift_guard(p_token) เหมือน RPC กะตัวอื่นทุกประการ
--   4) ตรวจท้ายไฟล์ว่า employee_shifts ไม่ถูกแก้แม้แต่แถวเดียว
--
-- รันไฟล์นี้ได้ซ้ำ (idempotent)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 0) PREFLIGHT ────────────────────────────────────────────────────────────
do $$
declare n bigint; h text;
begin
  if to_regclass('public.employee_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง public.employee_shifts';
  end if;
  if to_regclass('public.work_shifts') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง public.work_shifts';
  end if;
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง public.employees';
  end if;

  -- คอลัมน์ที่ RPC นี้อ่าน ต้องมีครบตามจริง ห้ามเดา
  perform 1 from (values
      ('employee_shifts','employee_id'), ('employee_shifts','shift_id'),
      ('employee_shifts','effective_date'), ('employee_shifts','status'),
      ('employee_shifts','assigned_by'), ('employee_shifts','assigned_at'),
      ('work_shifts','shift_name'), ('work_shifts','start_time'),
      ('work_shifts','end_time'), ('work_shifts','is_overnight'), ('work_shifts','is_active')
    ) as v(t, c)
   where not exists (
     select 1 from information_schema.columns
      where table_schema='public' and table_name=v.t and column_name=v.c);
  if found then
    raise exception 'PREFLIGHT: คอลัมน์ที่ njhr_shift_history ต้องใช้มีไม่ครบ';
  end if;

  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_shift_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_shift_guard — ต้องติดตั้ง 76_shift_rpc.sql ก่อน';
  end if;

  -- บันทึกสภาพ employee_shifts ก่อนรัน ไว้เทียบท้ายไฟล์
  select count(*) into n from public.employee_shifts;
  select md5(coalesce(string_agg(t.line, '|' order by t.line), '')) into h
    from (select es.employee_id::text || ':' || coalesce(es.shift_id::text,'-') || ':' ||
                 coalesce(es.effective_date::text,'-') || ':' || coalesce(es.status,'-') as line
            from public.employee_shifts es) t;
  -- ตารางชั่วคราวของ Session (ไม่ใช้ ON COMMIT DROP เพราะไฟล์นี้รันแบบทีละคำสั่งได้)
  drop table if exists njhr_sh100_before;
  create temporary table njhr_sh100_before(rows_before bigint, hash_before text);
  insert into njhr_sh100_before values (n, h);

  raise notice 'PREFLIGHT ผ่าน · employee_shifts % แถว · ไฟล์นี้อ่านอย่างเดียว', n;
end $$;


-- ─── 1) Index สำหรับการอ่านประวัติ (ไม่เปลี่ยนข้อมูล) ────────────────────────
create index if not exists njhr_es_emp_eff_idx
  on public.employee_shifts (employee_id, effective_date desc);


-- ─── 2) njhr_shift_history — ประวัติกะย้อนหลังของพนักงาน 1 คน ───────────────
--  • ตรวจสิทธิ์จาก Session ฝั่ง Backend ผ่าน njhr_shift_guard(p_token, false)
--    (โหมดอ่าน — Role ที่ผ่าน guard คือชุดเดียวกับ njhr_shift_employee_list เดิม)
--  • พนักงานทั่วไปดูได้เฉพาะประวัติของตัวเอง · ผู้มีสิทธิ์จัดการดูได้ทุกคน
--  • คืนทุกแถวตามลำดับเวลา ไม่ตัดสินใจแทนว่าแถวไหน "ใช้อยู่"
--    ให้ is_current เป็นข้อมูลประกอบ คำนวณด้วยกติกาเดียวกับ njhr_shift_state_at
--    (แถวล่าสุดที่ effective_date <= วันที่อ้างอิง) — ไม่ได้เปลี่ยน Logic กะเดิม
create or replace function public.njhr_shift_history(
  p_token    text,
  p_employee uuid,
  p_from     date default null,
  p_to       date default null,
  p_limit    int  default 200)
returns table (
  row_id          uuid,
  effective_date  date,
  shift_id        uuid,
  shift_name      text,
  start_time      time,
  end_time        time,
  is_overnight    boolean,
  shift_active    boolean,
  status          text,
  is_current      boolean,
  assigned_by     text,
  assigned_at     timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  c   record;
  lim int := least(greatest(coalesce(p_limit, 200), 1), 1000);
  cur date;
begin
  select * into c from public.njhr_shift_guard(p_token, false);

  -- กันไว้อีกชั้น: njhr_ctx ของ Production จะ raise 28000 เมื่อ Token ไม่ถูกต้องอยู่แล้ว
  -- แต่ฟังก์ชันนี้ต้องไม่พึ่งพฤติกรรมของฟังก์ชันอื่น — ไม่มี Session = ไม่คืนข้อมูลเด็ดขาด
  if c is null or c.role is null then
    raise exception 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' using errcode = '28000';
  end if;

  if p_employee is null then
    raise exception 'ต้องระบุพนักงานที่ต้องการดูประวัติกะ' using errcode = '22023';
  end if;

  -- สิทธิ์: ดูของคนอื่นได้เฉพาะ Role ที่จัดการกะได้จริง (ตัดสินฝั่งฐานข้อมูล ไม่เชื่อ Frontend)
  if c.role not in ('SUPER_ADMIN','ADMIN','HR')
     and coalesce(c.employee_id, '00000000-0000-0000-0000-000000000000'::uuid) <> p_employee then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติกะของพนักงานคนนี้' using errcode = '42501';
  end if;

  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานที่ระบุ' using errcode = '22023';
  end if;

  -- แถวที่ "มีผลอยู่" ณ วันนี้ — กติกาเดียวกับ njhr_shift_state_at ทุกประการ
  select es.effective_date into cur
    from public.employee_shifts es
   where es.employee_id = p_employee
     and (es.effective_date is null or es.effective_date <= current_date)
   order by es.effective_date desc nulls last, es.assigned_at desc nulls last
   limit 1;

  return query
  select es.id,
         es.effective_date,
         es.shift_id,
         coalesce(w.shift_name, '')            as shift_name,
         w.start_time,
         w.end_time,
         coalesce(w.is_overnight, false)       as is_overnight,
         coalesce(w.is_active, false)          as shift_active,
         coalesce(es.status, 'ACTIVE')         as status,
         (es.effective_date is not distinct from cur) as is_current,
         coalesce(es.assigned_by, '')          as assigned_by,
         es.assigned_at
    from public.employee_shifts es
    left join public.work_shifts w on w.id = es.shift_id
   where es.employee_id = p_employee
     and (p_from is null or es.effective_date is null or es.effective_date >= p_from)
     and (p_to   is null or es.effective_date is null or es.effective_date <= p_to)
   order by es.effective_date desc nulls last, es.assigned_at desc nulls last
   limit lim;
end $$;

revoke all    on function public.njhr_shift_history(text, uuid, date, date, int) from public;
grant execute on function public.njhr_shift_history(text, uuid, date, date, int) to anon, authenticated;

comment on function public.njhr_shift_history(text, uuid, date, date, int) is
  'ประวัติกะย้อนหลังของพนักงาน 1 คน (อ่านอย่างเดียว) — ตรวจสิทธิ์ผ่าน njhr_shift_guard';


-- ─── 3) ตรวจท้ายไฟล์: ข้อมูลกะต้องไม่ถูกแตะแม้แต่แถวเดียว ───────────────────
do $$
declare n bigint; h text; b record;
begin
  select * into b from njhr_sh100_before;
  select count(*) into n from public.employee_shifts;
  select md5(coalesce(string_agg(t.line, '|' order by t.line), '')) into h
    from (select es.employee_id::text || ':' || coalesce(es.shift_id::text,'-') || ':' ||
                 coalesce(es.effective_date::text,'-') || ':' || coalesce(es.status,'-') as line
            from public.employee_shifts es) t;

  if n <> b.rows_before or h is distinct from b.hash_before then
    raise exception 'VERIFY ล้มเหลว: employee_shifts เปลี่ยน (ก่อน % แถว / หลัง % แถว)', b.rows_before, n;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname='public' and p.proname='njhr_shift_history'
       and pg_get_function_identity_arguments(p.oid) = 'p_token text, p_employee uuid, p_from date, p_to date, p_limit integer') then
    raise exception 'VERIFY ล้มเหลว: ไม่พบ njhr_shift_history ตาม Signature ที่กำหนด';
  end if;

  drop table if exists njhr_sh100_before;
  raise notice 'VERIFY ผ่าน · employee_shifts % แถว ไม่เปลี่ยน · njhr_shift_history พร้อมใช้งาน', n;
end $$;


insert into public.njhr_schema_version(version, note)
values ('v2.6-shift-history', 'njhr_shift_history: อ่านประวัติกะย้อนหลังรายคน (read-only)')
on conflict (version) do nothing;
