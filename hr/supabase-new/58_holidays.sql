-- ============================================================
-- NJ HR V.10 — 58_holidays.sql
-- วันหยุดบริษัท: ใช้ตาราง holidays เดิมชุดเดียว ไม่สร้างตารางใหม่ ไม่เพิ่ม/เปลี่ยนคอลัมน์
--
-- โครงสร้างจริงที่ตรวจแล้ว (ห้ามเปลี่ยน — ตารางนี้แชร์กับหลายแอป):
--   holidays = id uuid PK · name text NOT NULL · holiday_date date NOT NULL · created_at timestamptz
--   ไม่มีคอลัมน์ประเภทวันหยุด → ระบบนี้ "ไม่แยกประเภท" ตามที่ยืนยันแล้ว
--
-- ตารางนี้คือชุดเดียวกับที่ njhr_leave_workdays() ใช้นับวันทำงานอยู่แล้ว
-- (41_leave_rpc.sql: not exists (select 1 from public.holidays h where h.holiday_date = g.d))
-- แก้วันหยุดที่นี่ การนับวันลาฝั่งเซิร์ฟเวอร์จึงเปลี่ยนตามทันทีโดยไม่ต้องแก้สูตรใด ๆ
--
-- ไม่แตะ: สูตรคำนวณ OT · leave_requests · payroll · REPORT ALL
-- ต้องรัน 48_employees.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.holidays') is null then raise exception 'PREFLIGHT: ไม่พบตาราง holidays'; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='holidays' and column_name in ('id','name','holiday_date');
  if n <> 3 then raise exception 'PREFLIGHT: holidays ขาดคอลัมน์ id/name/holiday_date (พบ %)', n; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard — รัน 48_employees.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_leave_workdays') then
    raise notice 'ไม่พบ njhr_leave_workdays — ข้ามการตรวจผลกระทบต่อระบบลา';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

-- สำรองก่อนแตะข้อมูล (ตารางเล็ก)
create table if not exists njhr_bk_holidays_20260802 as select *, now() as backed_up_at from public.holidays;
-- index ธรรมดาเท่านั้น ไม่สร้าง unique เพราะตารางแชร์กับแอปอื่นที่อาจมีวันซ้ำอยู่ก่อน
create index if not exists njhr_holiday_date_idx on public.holidays (holiday_date);

insert into public.njhr_schema_version(version, note)
values ('v11.5-holidays', 'วันหยุดบริษัท: ใช้ตาราง holidays เดิมชุดเดียวกับระบบลา')
on conflict (version) do nothing;


-- ลบ signature รุ่นก่อนที่อาจค้างอยู่ (ชนิดผลลัพธ์ต่างกัน สร้างทับตรง ๆ ไม่ได้)
drop function if exists public.njhr_holiday_list(text, int);
drop function if exists public.njhr_holiday_impact(text, int);

-- ─── 1) อ่านวันหยุด (ทุก Role ที่ล็อกอินอยู่ดูได้) ───────────
create or replace function public.njhr_holiday_list(
  p_token text, p_from date default null, p_to date default null)
returns table (id uuid, name text, holiday_date date, dow_th text, is_weekend boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query
  select h.id, h.name, h.holiday_date,
         (array['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'])[extract(dow from h.holiday_date)::int + 1],
         extract(dow from h.holiday_date)::int in (0, 6)
    from public.holidays h
   where (p_from is null or h.holiday_date >= p_from)
     and (p_to is null or h.holiday_date <= p_to)
   order by h.holiday_date;
end $$;


-- ─── 2) เพิ่ม / แก้ไขวันหยุด ─────────────────────────────────
create or replace function public.njhr_holiday_save(
  p_token text, p_id uuid, p_name text, p_date date)
returns table (id uuid, name text, holiday_date date)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; v_old jsonb;
begin
  select * into c from public.njhr_emp_guard(p_token, true);   -- SUPER_ADMIN / ADMIN / HR
  if coalesce(btrim(p_name),'') = '' then raise exception 'กรุณาระบุชื่อวันหยุด' using errcode='22023'; end if;
  if length(btrim(p_name)) > 200 then raise exception 'ชื่อวันหยุดยาวเกินไป' using errcode='22023'; end if;
  if p_date is null then raise exception 'กรุณาเลือกวันที่' using errcode='22023'; end if;
  -- กันวันซ้ำที่ระดับ RPC (ไม่ใช้ unique index เพราะตารางแชร์กับแอปอื่น)
  if exists (select 1 from public.holidays h
              where h.holiday_date = p_date and (p_id is null or h.id <> p_id)) then
    raise exception 'มีวันหยุดของวันที่ % อยู่แล้ว', to_char(p_date,'DD/MM/YYYY') using errcode='23505';
  end if;

  if p_id is null then
    insert into public.holidays (name, holiday_date) values (btrim(p_name), p_date)
    returning holidays.id into v_id;
  else
    select to_jsonb(h) into v_old from public.holidays h where h.id = p_id;
    if v_old is null then raise exception 'ไม่พบวันหยุดนี้' using errcode='P0002'; end if;
    update public.holidays set name = btrim(p_name), holiday_date = p_date where holidays.id = p_id;
    v_id := p_id;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail, old_value)
  values ('salary', c.username, c.role,
          case when p_id is null then 'HOLIDAY_ADD' else 'HOLIDAY_EDIT' end,
          'calendar', 'holidays', v_id::text,
          'วันหยุด ' || btrim(p_name) || ' · ' || to_char(p_date,'DD/MM/YYYY'), v_old);
  return query select h.id, h.name, h.holiday_date from public.holidays h where h.id = v_id;
end $$;


-- ─── 3) ลบวันหยุด ────────────────────────────────────────────
create or replace function public.njhr_holiday_delete(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v jsonb;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  select to_jsonb(h) into v from public.holidays h where h.id = p_id;
  if v is null then raise exception 'ไม่พบวันหยุดนี้' using errcode='P0002'; end if;
  delete from public.holidays where holidays.id = p_id;
  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail, old_value)
  values ('salary', c.username, c.role, 'HOLIDAY_DELETE', 'calendar', 'holidays', p_id::text,
          'ลบวันหยุด ' || (v->>'name') || ' · ' || (v->>'holiday_date'), v);
  return true;
end $$;


-- ─── 4) ผลกระทบต่อระบบลา (ใช้ njhr_leave_workdays เดิม ไม่คำนวณสูตรใหม่) ──
create or replace function public.njhr_holiday_impact(p_token text, p_year int)
returns table (holidays_count int, workdays numeric, leave_requests_in_year int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query
  select (select count(*)::int from public.holidays h where extract(year from h.holiday_date) = p_year),
         public.njhr_leave_workdays(make_date(p_year,1,1), make_date(p_year,12,31)),
         (select count(*)::int from public.leave_requests r
           where r.status::text in ('PENDING','APPROVED')
             and r.start_date <= make_date(p_year,12,31) and r.end_date >= make_date(p_year,1,1));
end $$;


-- ─── 5) สิทธิ์เรียกใช้ ───────────────────────────────────────
grant execute on function public.njhr_holiday_list(text,date,date)      to anon, authenticated;
grant execute on function public.njhr_holiday_save(text,uuid,text,date) to anon, authenticated;
grant execute on function public.njhr_holiday_delete(text,uuid)         to anon, authenticated;
grant execute on function public.njhr_holiday_impact(text,int)          to anon, authenticated;


-- ─── 6) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_holiday\_%'),
  'holidays_columns_unchanged', (select jsonb_agg(column_name order by ordinal_position)
     from information_schema.columns where table_schema='public' and table_name='holidays'),
  'holidays_rows', (select count(*) from public.holidays),
  'no_new_table', to_regclass('public.njhr_holidays') is null,
  'leave_uses_same_table', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='njhr_leave_workdays'
       and pg_get_functiondef(p.oid) like '%public.holidays%'),
  'backup_rows', (select count(*) from njhr_bk_holidays_20260802)
)) as install_report;


-- ─── 7) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_holiday_impact(text,int);
-- drop function if exists public.njhr_holiday_delete(text,uuid);
-- drop function if exists public.njhr_holiday_save(text,uuid,text,date);
-- drop function if exists public.njhr_holiday_list(text,date,date);
-- drop index if exists public.njhr_holiday_date_idx;
-- คืนข้อมูลวันหยุด: njhr_bk_holidays_20260802
-- delete from public.njhr_schema_version where version='v11.5-holidays';
