-- ============================================================
-- NJ HR V2 — E2_holiday_gov.sql
-- ปฏิทินองค์กร: โหลดวันหยุดราชการเป็นฐาน · บริษัทเพิ่ม/ลบเองได้ · โหลดใหม่ไม่ทับวันหยุดบริษัท
--
-- โครงสร้าง:
--   njhr_gov_holidays (ชุดต้นทาง) --[Preview]--> [Apply] --> holidays (ปฏิทินจริง)
--                                                            source = 'GOVERNMENT'
--   ฟอร์มเพิ่มวันหยุดเดิม -----------------------------------> source = 'COMPANY'
--   ลบวันหยุดราชการ ---------------------------------------> njhr_holiday_excluded
--                                                            (โหลดใหม่ไม่คืนวันนั้นกลับมา)
--
-- ขอบเขต:
--   1) ALTER TABLE holidays ADD COLUMN source text  (nullable · ไม่มี default)
--   2) CREATE TABLE njhr_gov_holidays      (ชุดวันหยุดราชการต้นทาง)
--   3) CREATE TABLE njhr_holiday_excluded  (วันที่บริษัทสั่งไม่หยุด)
--   4) DROP+CREATE njhr_holiday_list  (เพิ่ม source ในผลลัพธ์)
--   5) CREATE OR REPLACE njhr_holiday_save / njhr_holiday_delete
--   6) CREATE njhr_gov_holiday_set / _preview / _apply / _list
--
--   ไม่แตะ: njhr_leave_workdays · njhr_ot_is_holiday · njhr_event_list · njhr_holiday_impact
--           njhr_healthcheck · Leave · OT · REPORT ALL · Attendance · Payroll
--           ระบบเหล่านี้อ่านเฉพาะ holidays.holiday_date เหมือนเดิมทุกประการ
--
-- อ้างอิงผลตรวจจริงจาก E1/E1b (2026-08-07):
--   holidays = id uuid PK (uuid_generate_v4) · name NOT NULL · holiday_date NOT NULL · created_at
--   ไม่มี unique บน holiday_date · ไม่มี view/trigger/FK · rls_enabled=true · force_rls=false
--   owner = postgres → SECURITY DEFINER ทำงานผ่าน RLS ได้
--   Function ที่แตะ holidays ทั้ง 8 ตัวเป็น njhr_* ทั้งหมด — ไม่มีแอปอื่นเขียน
--   ข้อมูลเดิม 0 แถว → ไม่มีข้อมูลเก่าต้องจำแนกย้อนหลัง
--
--   ⚠ ไม่เพิ่ม unique index บน holiday_date โดยเจตนา
--     RLS policy `nj_v6_anon_all` เปิด ALL ให้ anon อยู่ → อาจมีคนเขียนตรงผ่าน PostgREST
--     จึงกันซ้ำที่ระดับ RPC เหมือนที่ระบบทำอยู่เดิม ไม่เปลี่ยนสัญญาของตาราง
--
-- รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if to_regclass('public.holidays') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง holidays'; end if;
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='holidays'
     and column_name in ('id','name','holiday_date','created_at');
  if n <> 4 then raise exception 'PREFLIGHT: holidays ขาดคอลัมน์เดิม (พบ % จาก 4)', n; end if;

  foreach n in array array[1] loop end loop;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_emp_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_emp_guard'; end if;
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_leave_workdays') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_leave_workdays'; end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

-- สำรองก่อนแตะโครงสร้าง (idempotent — ไม่เขียนทับของเดิม)
create table if not exists njhr_bk_holidays_20260807 as
  select *, now() as backed_up_at from public.holidays;


-- ─── 1) แยกแหล่งที่มาของวันหยุด ─────────────────────────────
-- nullable ไม่มี default → แถวเดิมเป็น NULL และถูกนับเป็น "วันหยุดบริษัท"
-- ระบบที่อ่านเฉพาะ holiday_date จึงไม่กระทบแม้แต่ตัวเดียว
alter table public.holidays
  add column if not exists source text;

comment on column public.holidays.source is
  'GOVERNMENT = โหลดจากชุดวันหยุดราชการ · COMPANY = บริษัทเพิ่มเอง · NULL = ข้อมูลเดิม (ถือเป็นของบริษัท ห้ามลบอัตโนมัติ)';

create index if not exists njhr_holiday_source_idx on public.holidays (source, holiday_date);


-- ─── 2) ชุดวันหยุดราชการต้นทาง ──────────────────────────────
-- แยกจาก holidays โดยเจตนา: แก้ชุดต้นทางไม่กระทบปฏิทินจริงจนกว่าจะกด Apply
create table if not exists public.njhr_gov_holidays (
  holiday_date date primary key,
  name         text not null,
  year         int  generated always as (extract(year from holiday_date)::int) stored,
  created_at   timestamptz not null default now(),
  created_by   text
);
create index if not exists njhr_gov_holidays_year_idx on public.njhr_gov_holidays (year, holiday_date);
alter table public.njhr_gov_holidays enable row level security;   -- เข้าถึงผ่าน RPC เท่านั้น


-- ─── 3) วันที่บริษัทสั่ง "ไม่หยุด" ───────────────────────────
-- ราชการหยุด แต่บริษัททำงาน → จำไว้ เพื่อโหลดใหม่แล้วไม่คืนวันนั้นกลับมา
create table if not exists public.njhr_holiday_excluded (
  holiday_date date primary key,
  name         text,
  excluded_at  timestamptz not null default now(),
  excluded_by  text
);
alter table public.njhr_holiday_excluded enable row level security;

insert into public.njhr_schema_version(version, note)
values ('v12.1-holiday-gov', 'ปฏิทินองค์กร: แยก GOVERNMENT/COMPANY + Preview/Apply + Excluded')
on conflict (version) do nothing;


-- ─── 4) อ่านวันหยุด — เพิ่ม source ในผลลัพธ์ ────────────────
-- ชนิดผลลัพธ์เปลี่ยน จึงต้อง DROP ก่อน
drop function if exists public.njhr_holiday_list(text, date, date);

create or replace function public.njhr_holiday_list(
  p_token text, p_from date default null, p_to date default null)
returns table (id uuid, name text, holiday_date date, dow_th text, is_weekend boolean,
               source text, source_th text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query
  select h.id, h.name, h.holiday_date,
         (array['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'])[extract(dow from h.holiday_date)::int + 1],
         extract(dow from h.holiday_date)::int in (0, 6),
         coalesce(h.source, 'COMPANY'),
         case when h.source = 'GOVERNMENT' then 'ราชการ' else 'บริษัท' end
    from public.holidays h
   where (p_from is null or h.holiday_date >= p_from)
     and (p_to is null or h.holiday_date <= p_to)
   order by h.holiday_date;
end $$;

grant execute on function public.njhr_holiday_list(text,date,date) to anon, authenticated;


-- ─── 5) เพิ่ม / แก้ไขวันหยุด (ฟอร์มเดิม) ────────────────────
-- Signature เดิมทุกตัวอักษร · Frontend เดิมเรียกได้โดยไม่ต้องแก้
-- ตั้ง source = 'COMPANY' อัตโนมัติ ผู้ใช้ไม่ต้องเลือกเอง
create or replace function public.njhr_holiday_save(
  p_token text, p_id uuid, p_name text, p_date date)
returns table (id uuid, name text, holiday_date date)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid; v_old jsonb;
begin
  select * into c from public.njhr_emp_guard(p_token, true);   -- SUPER_ADMIN / ADMIN / HR (สิทธิ์เดิม)
  if coalesce(btrim(p_name),'') = '' then raise exception 'กรุณาระบุชื่อวันหยุด' using errcode='22023'; end if;
  if length(btrim(p_name)) > 200 then raise exception 'ชื่อวันหยุดยาวเกินไป' using errcode='22023'; end if;
  if p_date is null then raise exception 'กรุณาเลือกวันที่' using errcode='22023'; end if;
  -- กันวันซ้ำที่ระดับ RPC (ไม่ใช้ unique index เพราะตารางแชร์กับแอปอื่น) — กฎเดิม
  if exists (select 1 from public.holidays h
              where h.holiday_date = p_date and (p_id is null or h.id <> p_id)) then
    raise exception 'มีวันหยุดของวันที่ % อยู่แล้ว', to_char(p_date,'DD/MM/YYYY') using errcode='23505';
  end if;

  if p_id is null then
    insert into public.holidays (name, holiday_date, source)
    values (btrim(p_name), p_date, 'COMPANY')
    returning holidays.id into v_id;
  else
    select to_jsonb(h) into v_old from public.holidays h where h.id = p_id;
    if v_old is null then raise exception 'ไม่พบวันหยุดนี้' using errcode='P0002'; end if;
    -- แก้ไขด้วยมือ = กลายเป็นของบริษัท เพื่อไม่ให้ Apply รอบหน้าเขียนทับสิ่งที่ HR แก้เอง
    update public.holidays
       set name = btrim(p_name), holiday_date = p_date, source = 'COMPANY'
     where holidays.id = p_id;
    v_id := p_id;
  end if;

  -- เพิ่มวันไหนด้วยมือ = ยกเลิกสถานะ "ไม่หยุด" ของวันนั้น
  delete from public.njhr_holiday_excluded where holiday_date = p_date;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail, old_value)
  values ('salary', c.username, c.role,
          case when p_id is null then 'HOLIDAY_ADD' else 'HOLIDAY_EDIT' end,
          'calendar', 'holidays', v_id::text,
          'วันหยุด ' || btrim(p_name) || ' · ' || to_char(p_date,'DD/MM/YYYY'), v_old);
  return query select h.id, h.name, h.holiday_date from public.holidays h where h.id = v_id;
end $$;


-- ─── 6) ลบวันหยุด ────────────────────────────────────────────
-- ลบของราชการ = จำไว้ใน njhr_holiday_excluded → โหลดใหม่ไม่คืนกลับมา
create or replace function public.njhr_holiday_delete(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v jsonb; v_src text; v_date date; v_name text;
begin
  select * into c from public.njhr_emp_guard(p_token, true);
  select to_jsonb(h), h.source, h.holiday_date, h.name
    into v, v_src, v_date, v_name
    from public.holidays h where h.id = p_id;
  if v is null then raise exception 'ไม่พบวันหยุดนี้' using errcode='P0002'; end if;

  delete from public.holidays where holidays.id = p_id;

  if v_src = 'GOVERNMENT' then
    insert into public.njhr_holiday_excluded (holiday_date, name, excluded_by)
    values (v_date, v_name, c.username)
    on conflict (holiday_date) do update
      set name = excluded.name, excluded_at = now(), excluded_by = excluded.excluded_by;
  end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id, detail, old_value)
  values ('salary', c.username, c.role, 'HOLIDAY_DELETE', 'calendar', 'holidays', p_id::text,
          'ลบวันหยุด ' || (v->>'name') || ' · ' || (v->>'holiday_date') ||
          case when v_src = 'GOVERNMENT' then ' · บันทึกเป็นวันที่บริษัทไม่หยุด' else '' end, v);
  return true;
end $$;


-- ─── 7) ชุดต้นทาง: วางรายการวันหยุดราชการของปี ──────────────
-- p_items = jsonb array [{"date":"2027-01-01","name":"วันขึ้นปีใหม่"}, ...]
-- แทนที่ชุดต้นทาง "ของปีนั้น" ทั้งปี · ไม่แตะปีอื่น · ไม่แตะ holidays
create or replace function public.njhr_gov_holiday_set(
  p_token text, p_year int, p_items jsonb)
returns table (ok boolean, message text, saved int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; it jsonb; v_d date; v_n text; n int := 0; bad int := 0;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ตั้งชุดวันหยุดราชการได้' using errcode='42501';
  end if;
  if p_year is null or p_year < 1900 or p_year > 2200 then
    raise exception 'ปีไม่ถูกต้อง' using errcode='22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'ข้อมูลไม่ถูกต้อง' using errcode='22023';
  end if;

  create temp table _gov_in (holiday_date date primary key, name text) on commit drop;
  for it in select * from jsonb_array_elements(p_items) loop
    begin
      v_d := (it->>'date')::date;
      v_n := btrim(coalesce(it->>'name',''));
      if v_d is null or v_n = '' then bad := bad + 1; continue; end if;
      if extract(year from v_d)::int <> p_year then bad := bad + 1; continue; end if;
      insert into _gov_in(holiday_date, name) values (v_d, left(v_n, 200))
        on conflict (holiday_date) do update set name = excluded.name;
    exception when others then bad := bad + 1;
    end;
  end loop;
  select count(*) into n from _gov_in;
  if n = 0 then
    return query select false, 'ไม่พบรายการที่ใช้ได้ในปี ' || p_year::text, 0; return;
  end if;

  -- แทนที่ชุดต้นทางของปีนี้ทั้งปี (Transaction เดียว) · ไม่แตะปีอื่น
  delete from public.njhr_gov_holidays g where g.year = p_year;
  insert into public.njhr_gov_holidays (holiday_date, name, created_by)
  select i.holiday_date, i.name, c.username from _gov_in i;

  perform public.njhr_audit_write(p_token, 'GOV_HOLIDAY_SET', 'calendar',
    'njhr_gov_holidays', p_year::text,
    'ตั้งชุดวันหยุดราชการปี ' || p_year::text || ' จำนวน ' || n::text || ' รายการ' ||
    case when bad > 0 then ' · ข้ามรายการผิดรูปแบบ ' || bad::text else '' end,
    null, null, null);

  return query select true,
    'บันทึกชุดวันหยุดราชการปี ' || p_year::text || ' แล้ว ' || n::text || ' รายการ' ||
    case when bad > 0 then ' · ข้าม ' || bad::text || ' รายการที่ผิดรูปแบบหรือคนละปี' else '' end, n;
end $$;

grant execute on function public.njhr_gov_holiday_set(text,int,jsonb) to anon, authenticated;


-- ─── 8) อ่านชุดต้นทางของปี ──────────────────────────────────
create or replace function public.njhr_gov_holiday_list(p_token text, p_year int)
returns table (holiday_date date, name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query select g.holiday_date, g.name
    from public.njhr_gov_holidays g where g.year = p_year order by g.holiday_date;
end $$;

grant execute on function public.njhr_gov_holiday_list(text,int) to anon, authenticated;


-- ─── 9) PREVIEW — คำนวณอย่างเดียว ไม่เขียนอะไรทั้งสิ้น ──────
create or replace function public.njhr_gov_holiday_preview(p_token text, p_year int)
returns table (holiday_date date, name text, current_name text,
               action text, action_th text, note text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query
  with gov as (select g.holiday_date d, g.name n
                 from public.njhr_gov_holidays g where g.year = p_year),
  cur as (select h.holiday_date d, h.name n, coalesce(h.source,'COMPANY') s
            from public.holidays h where extract(year from h.holiday_date)::int = p_year)
  -- รายการที่มีในชุดต้นทาง
  select gv.d, gv.n, cu.n,
         case
           when ex.holiday_date is not null then 'EXCLUDED'
           when cu.d is null                then 'NEW'
           when cu.s <> 'GOVERNMENT'        then 'KEEP_COMPANY'
           when cu.n is distinct from gv.n  then 'UPDATE'
           else 'SAME' end,
         case
           when ex.holiday_date is not null then 'ข้าม (บริษัทไม่หยุด)'
           when cu.d is null                then 'เพิ่มใหม่'
           when cu.s <> 'GOVERNMENT'        then 'ข้าม (วันหยุดบริษัท)'
           when cu.n is distinct from gv.n  then 'อัปเดต'
           else 'ไม่เปลี่ยน' end,
         case
           when ex.holiday_date is not null then 'เคยลบออกเมื่อ ' || to_char(ex.excluded_at,'DD/MM/YYYY')
           when cu.s = 'COMPANY' and cu.d is not null then 'วันนี้เป็นวันหยุดบริษัท จะไม่ถูกเขียนทับ'
           else null end
    from gov gv
    left join cur cu on cu.d = gv.d
    left join public.njhr_holiday_excluded ex on ex.holiday_date = gv.d
  union all
  -- วันหยุดราชการเดิมที่หลุดจากชุดต้นทางรอบนี้ → จะถูกถอนออก
  select cu.d, cu.n, cu.n, 'REMOVE', 'ถอนออก',
         'ไม่มีในชุดวันหยุดราชการปีนี้แล้ว'
    from cur cu
   where cu.s = 'GOVERNMENT'
     and not exists (select 1 from gov gv where gv.d = cu.d)
  order by 1;
end $$;

grant execute on function public.njhr_gov_holiday_preview(text,int) to anon, authenticated;


-- ─── 10) APPLY — เขียนจริงใน Transaction เดียว ──────────────
-- แตะเฉพาะ source = 'GOVERNMENT' ของปีนั้น
-- ห้ามแตะ COMPANY และ NULL เด็ดขาด · ข้ามวันที่อยู่ใน excluded
create or replace function public.njhr_gov_holiday_apply(p_token text, p_year int)
returns table (ok boolean, message text, added int, updated int, removed int, skipped int)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; n_gov int; v_add int := 0; v_upd int := 0; v_del int := 0; v_skip int := 0;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่โหลดวันหยุดราชการได้' using errcode='42501';
  end if;
  if p_year is null then raise exception 'กรุณาเลือกปี' using errcode='22023'; end if;

  select count(*) into n_gov from public.njhr_gov_holidays g where g.year = p_year;
  if n_gov = 0 then
    -- ไม่มีชุดต้นทาง = ไม่ทำอะไรเลย ห้ามลบของเดิมทิ้ง
    return query select false,
      'ยังไม่มีชุดวันหยุดราชการของปี ' || p_year::text || ' กรุณาวางรายการก่อน'::text, 0, 0, 0, 0;
    return;
  end if;

  -- (1) ถอนวันหยุดราชการเดิมของปีนี้ที่ไม่มีในชุดต้นทางแล้ว
  with d as (
    delete from public.holidays h
     where h.source = 'GOVERNMENT'
       and extract(year from h.holiday_date)::int = p_year
       and not exists (select 1 from public.njhr_gov_holidays g where g.holiday_date = h.holiday_date)
    returning 1)
  select count(*) into v_del from d;

  -- (2) อัปเดตชื่อของวันที่เป็น GOVERNMENT อยู่แล้ว
  with u as (
    update public.holidays h set name = g.name
      from public.njhr_gov_holidays g
     where g.holiday_date = h.holiday_date and g.year = p_year
       and h.source = 'GOVERNMENT'
       and h.name is distinct from g.name
    returning 1)
  select count(*) into v_upd from u;

  -- (3) เพิ่มวันใหม่ — ข้ามวันที่มีอยู่แล้ว (ไม่ว่าจะเป็น COMPANY หรือ NULL) และวันที่ถูก exclude
  with a as (
    insert into public.holidays (name, holiday_date, source)
    select g.name, g.holiday_date, 'GOVERNMENT'
      from public.njhr_gov_holidays g
     where g.year = p_year
       and not exists (select 1 from public.holidays h where h.holiday_date = g.holiday_date)
       and not exists (select 1 from public.njhr_holiday_excluded e where e.holiday_date = g.holiday_date)
    returning 1)
  select count(*) into v_add from a;

  -- นับที่ข้าม: วันหยุดบริษัทที่ชนวัน + วันที่บริษัทสั่งไม่หยุด
  select count(*) into v_skip
    from public.njhr_gov_holidays g
   where g.year = p_year
     and (exists (select 1 from public.holidays h
                   where h.holiday_date = g.holiday_date and coalesce(h.source,'COMPANY') <> 'GOVERNMENT')
       or exists (select 1 from public.njhr_holiday_excluded e where e.holiday_date = g.holiday_date));

  perform public.njhr_audit_write(p_token, 'GOV_HOLIDAY_APPLY', 'calendar',
    'holidays', p_year::text,
    'โหลดวันหยุดราชการปี ' || p_year::text ||
    ' · เพิ่ม ' || v_add::text || ' · อัปเดต ' || v_upd::text ||
    ' · ถอน ' || v_del::text || ' · ข้าม ' || v_skip::text,
    null, null, null);

  return query select true,
    'โหลดวันหยุดราชการปี ' || p_year::text || ' เรียบร้อยแล้ว'::text,
    v_add, v_upd, v_del, v_skip;
end $$;

grant execute on function public.njhr_gov_holiday_apply(text,int) to anon, authenticated;


-- ─── 11) รายการวันที่บริษัทสั่งไม่หยุด + ยกเลิกได้ ──────────
create or replace function public.njhr_holiday_excluded_list(p_token text, p_year int default null)
returns table (holiday_date date, name text, excluded_at timestamptz, excluded_by text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);
  return query select e.holiday_date, e.name, e.excluded_at, e.excluded_by
    from public.njhr_holiday_excluded e
   where p_year is null or extract(year from e.holiday_date)::int = p_year
   order by e.holiday_date;
end $$;

create or replace function public.njhr_holiday_excluded_undo(p_token text, p_date date)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ยกเลิกได้' using errcode='42501';
  end if;
  delete from public.njhr_holiday_excluded where holiday_date = p_date;
  perform public.njhr_audit_write(p_token, 'HOLIDAY_EXCLUDE_UNDO', 'calendar',
    'njhr_holiday_excluded', to_char(p_date,'YYYY-MM-DD'),
    'ยกเลิกสถานะไม่หยุดของวันที่ ' || to_char(p_date,'DD/MM/YYYY'), null, null, null);
  return true;
end $$;

grant execute on function public.njhr_holiday_excluded_list(text,int) to anon, authenticated;
grant execute on function public.njhr_holiday_excluded_undo(text,date) to anon, authenticated;


-- ─── 12) VERIFICATION — อ่านอย่างเดียว ──────────────────────
select jsonb_pretty(jsonb_build_object(
  'source_column_added', exists(select 1 from information_schema.columns
                                 where table_schema='public' and table_name='holidays' and column_name='source'),
  'gov_table',      to_regclass('public.njhr_gov_holidays') is not null,
  'excluded_table', to_regclass('public.njhr_holiday_excluded') is not null,
  'new_rpcs', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public'
                  and p.proname in ('njhr_gov_holiday_set','njhr_gov_holiday_list',
                                    'njhr_gov_holiday_preview','njhr_gov_holiday_apply',
                                    'njhr_holiday_excluded_list','njhr_holiday_excluded_undo')),
  'holiday_list_returns_source',
     (select pg_get_function_result(p.oid) ilike '%source text%'
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='njhr_holiday_list' limit 1),
  'save_signature_unchanged',
     (select pg_get_function_identity_arguments(p.oid) = 'p_token text, p_id uuid, p_name text, p_date date'
        from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='njhr_holiday_save' limit 1),
  'holidays_rows',       (select count(*) from public.holidays),
  'holidays_government', (select count(*) from public.holidays where source='GOVERNMENT'),
  'holidays_company',    (select count(*) from public.holidays where coalesce(source,'COMPANY')='COMPANY'),
  'gov_source_rows',     (select count(*) from public.njhr_gov_holidays),
  'excluded_rows',       (select count(*) from public.njhr_holiday_excluded),
  'untouched', jsonb_build_object(
     'njhr_leave_workdays', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                    where n.nspname='public' and p.proname='njhr_leave_workdays'),
     'njhr_ot_is_holiday',  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                    where n.nspname='public' and p.proname='njhr_ot_is_holiday'),
     'njhr_holiday_impact', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                    where n.nspname='public' and p.proname='njhr_holiday_impact'),
     'njhr_event_list',     exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                    where n.nspname='public' and p.proname='njhr_event_list'))
)) as install_report;


-- ─── 13) ROLLBACK ────────────────────────────────────────────
-- drop function if exists public.njhr_gov_holiday_apply(text,int);
-- drop function if exists public.njhr_gov_holiday_preview(text,int);
-- drop function if exists public.njhr_gov_holiday_set(text,int,jsonb);
-- drop function if exists public.njhr_gov_holiday_list(text,int);
-- drop function if exists public.njhr_holiday_excluded_undo(text,date);
-- drop function if exists public.njhr_holiday_excluded_list(text,int);
-- drop function if exists public.njhr_holiday_list(text,date,date);
-- แล้วรัน 58_holidays.sql ใหม่เพื่อคืน njhr_holiday_list / _save / _delete รุ่นเดิม
-- drop table if exists public.njhr_gov_holidays;
-- drop table if exists public.njhr_holiday_excluded;
-- alter table public.holidays drop column if exists source;   -- ปล่อยไว้ได้ ไม่กระทบของเดิม
-- delete from public.njhr_schema_version where version='v12.1-holiday-gov';
