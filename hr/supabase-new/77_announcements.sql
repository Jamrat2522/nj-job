-- ============================================================
-- NJ HR V.10 — 77_announcements.sql   [ฉบับที่ 2 — อิงโครงสร้างจริงจากผล 77a]
-- B) ประกาศบริษัท — ต่อยอดจากตาราง company_announcements ที่มีอยู่แล้ว
--
-- ผลตรวจจาก 77a_inspect_announcements.sql (ยืนยันแล้ว ไม่ใช่การเดา)
--   announcement (35 แถว)          = ของแอป MASSENGER · app_code default 'massenger'
--                                     มีตารางลูก announcement_read (3,596) / _timeline (74)
--                                     / _attachment / _read_audit + trigger กันลบ audit
--                                     → ห้ามแตะเด็ดขาด ไม่เกี่ยวกับ HR
--   company_announcements (2 แถว)  = id · title · body · published_at
--                                     ไม่มี app_code · ไม่มีตารางลูก · ไม่มี FK
--                                     ข้อมูลจริงคือ "แจ้งวันหยุดประจำปี" / "ส่งสลิปเงินเดือน"
--                                     → นี่คือตารางประกาศของ HR
--
-- จึงไม่สร้างตารางใหม่ แต่เติมคอลัมน์ที่ขาดแบบ additive ลงตารางเดิม
--   ข้อมูล 2 แถวเดิมไม่ถูกแตะ · title/body/published_at คงชื่อเดิมทุกตัว
--   (ในเอกสารเรียก content แต่ของจริงชื่อ body → RPC แปลงชื่อให้ที่ชั้น API)
--
-- Policy เดิมของตาราง (ann_sel / ann_w ที่ใช้ is_staff()) ไม่ถูกลบ
--   เพราะเป็นของ role authenticated ไม่ใช่ anon และอาจมีระบบอื่นใช้อยู่
--
-- ต้องรัน 41 · 42 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare cols text;
begin
  if to_regclass('public.company_announcements') is null then
    raise exception 'PREFLIGHT: ไม่พบ company_announcements — ผลตรวจ 77a บอกว่ามี ส่งผลตรวจใหม่กลับมาก่อน';
  end if;
  select string_agg(column_name, ', ' order by ordinal_position) into cols
    from information_schema.columns
   where table_schema='public' and table_name='company_announcements';
  raise notice 'คอลัมน์ก่อนแก้: [%] · % แถว', cols,
    (select count(*) from public.company_announcements);

  -- กันพลาด: ห้ามไปแตะตารางของ MASSENGER
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='company_announcements'
                and column_name='app_code') then
    raise exception 'PREFLIGHT: company_announcements มี app_code — โครงสร้างไม่ตรงกับผลตรวจ หยุดก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · ตาราง announcement ของ MASSENGER จะไม่ถูกแตะ';
end $$;


-- ─── 1) เติมคอลัมน์ที่ขาด (additive · ข้อมูลเดิมไม่หาย) ──────
alter table public.company_announcements add column if not exists priority   text;
alter table public.company_announcements add column if not exists expire_at  timestamptz;
alter table public.company_announcements add column if not exists is_active  boolean;
alter table public.company_announcements add column if not exists created_by text;
alter table public.company_announcements add column if not exists updated_by text;
alter table public.company_announcements add column if not exists created_at timestamptz;
alter table public.company_announcements add column if not exists updated_at timestamptz;

-- แถวเดิม 2 แถว: เติมค่าเริ่มต้นให้ครบ โดยไม่แตะ title / body / published_at
update public.company_announcements
   set priority   = coalesce(priority, 'NORMAL'),
       is_active  = coalesce(is_active, true),
       created_at = coalesce(created_at, published_at, now()),
       updated_at = coalesce(updated_at, published_at, now())
 where priority is null or is_active is null or created_at is null or updated_at is null;

alter table public.company_announcements alter column priority   set default 'NORMAL';
alter table public.company_announcements alter column is_active  set default true;
alter table public.company_announcements alter column created_at set default now();
alter table public.company_announcements alter column updated_at set default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'njhr_ann_priority_chk') then
    alter table public.company_announcements
      add constraint njhr_ann_priority_chk
      check (priority is null or upper(priority) in ('LOW','NORMAL','HIGH','URGENT'));
  end if;
end $$;

create index if not exists njhr_ann_live_idx
  on public.company_announcements (is_active, published_at desc);

comment on table public.company_announcements is
  'ประกาศบริษัท (HR) — อ่าน/เขียนผ่าน njhr_announcement_* · คนละระบบกับตาราง announcement ของ MASSENGER';


-- ─── 2) ตัวตรวจสิทธิ์ ───────────────────────────────────────
create or replace function public.njhr_ann_guard(p_token text, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid, is_manager boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);          -- Role จากฐานข้อมูล ไม่รับจาก Frontend
  if p_write and c.role not in ('SUPER_ADMIN','ADMIN') then
    raise exception 'เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการประกาศได้' using errcode = '42501';
  end if;
  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      (c.role in ('SUPER_ADMIN','ADMIN'));
end $$;


-- ─── 3) njhr_announcement_list ──────────────────────────────
--  ผู้ใช้ทั่วไปเห็นเฉพาะที่เผยแพร่แล้วและยังไม่หมดอายุ
create or replace function public.njhr_announcement_list(
  p_token text, p_q text default null, p_limit int default 100, p_offset int default 0)
returns table (
  id uuid, title text, content text, priority text,
  publish_at timestamptz, expire_at timestamptz, is_active boolean,
  is_live boolean, created_by text, created_at timestamptz,
  updated_by text, updated_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; q text := lower(btrim(coalesce(p_q,'')));
        lim int := least(greatest(coalesce(p_limit,100),1),500);
        v_now timestamptz := now();
begin
  select * into c from public.njhr_ann_guard(p_token, false);
  return query
  with base as (
    select a.*,
           (coalesce(a.is_active,true)
            and coalesce(a.published_at, a.created_at, v_now) <= v_now
            and (a.expire_at is null or a.expire_at > v_now)) as live
      from public.company_announcements a)
  select b.id, b.title, coalesce(b.body,''), upper(coalesce(b.priority,'NORMAL')),
         b.published_at, b.expire_at, coalesce(b.is_active,true), b.live,
         coalesce(b.created_by,''), b.created_at, coalesce(b.updated_by,''), b.updated_at,
         count(*) over () as total_count
    from base b
   where (c.is_manager or b.live)
     and (q = '' or lower(coalesce(b.title,'')) like '%'||q||'%'
          or lower(coalesce(b.body,'')) like '%'||q||'%')
   order by b.live desc,
            case upper(coalesce(b.priority,'NORMAL'))
              when 'URGENT' then 0 when 'HIGH' then 1 when 'NORMAL' then 2 else 3 end,
            coalesce(b.published_at, b.created_at) desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ─── 4) njhr_announcement_get ───────────────────────────────
create or replace function public.njhr_announcement_get(p_token text, p_id uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; a record; v_now timestamptz := now(); v_live boolean;
begin
  select * into c from public.njhr_ann_guard(p_token, false);
  select * into a from public.company_announcements where company_announcements.id = p_id;
  if not found then raise exception 'ไม่พบประกาศนี้' using errcode='P0002'; end if;

  v_live := coalesce(a.is_active,true)
        and coalesce(a.published_at, a.created_at, v_now) <= v_now
        and (a.expire_at is null or a.expire_at > v_now);
  if not c.is_manager and not v_live then
    raise exception 'ประกาศนี้ยังไม่เผยแพร่หรือหมดอายุแล้ว' using errcode='42501';
  end if;

  return query select jsonb_build_object(
    'id', a.id, 'title', a.title, 'content', coalesce(a.body,''),
    'priority', upper(coalesce(a.priority,'NORMAL')),
    'publish_at', a.published_at, 'expire_at', a.expire_at,
    'is_active', coalesce(a.is_active,true), 'is_live', v_live,
    'created_by', coalesce(a.created_by,''), 'created_at', a.created_at,
    'updated_by', coalesce(a.updated_by,''), 'updated_at', a.updated_at);
end $$;


-- ─── 5) njhr_announcement_save ──────────────────────────────
create or replace function public.njhr_announcement_save(
  p_token text, p_id uuid default null, p_title text default null,
  p_content text default null, p_priority text default 'NORMAL',
  p_publish_at timestamptz default null, p_expire_at timestamptz default null,
  p_notify boolean default false)
returns table (id uuid, title text, is_active boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; v_id uuid;
        v_title text := btrim(coalesce(p_title,''));
        v_pri text := upper(btrim(coalesce(p_priority,'NORMAL')));
        v_pub timestamptz := coalesce(p_publish_at, now());
begin
  select * into c from public.njhr_ann_guard(p_token, true);

  if v_title = '' then raise exception 'กรุณาระบุหัวข้อประกาศ' using errcode='22023'; end if;
  if v_pri not in ('LOW','NORMAL','HIGH','URGENT') then v_pri := 'NORMAL'; end if;
  if p_expire_at is not null and p_expire_at <= v_pub then
    raise exception 'วันหมดอายุต้องหลังวันเผยแพร่' using errcode='22023';
  end if;

  if p_id is null then
    insert into public.company_announcements(
      title, body, priority, published_at, expire_at,
      is_active, created_by, created_at, updated_by, updated_at)
    values (v_title, coalesce(p_content,''), v_pri, v_pub, p_expire_at,
            true, c.username, now(), c.username, now())
    returning company_announcements.id into v_id;

    perform public.njhr_audit_write(p_token, 'ANN_CREATE', 'announcement',
      'company_announcements', v_id::text, v_title, null,
      (select to_jsonb(x) from public.company_announcements x where x.id = v_id), null);
  else
    select * into old from public.company_announcements where company_announcements.id = p_id;
    if not found then raise exception 'ไม่พบประกาศนี้' using errcode='P0002'; end if;

    update public.company_announcements
       set title = v_title, body = coalesce(p_content, body), priority = v_pri,
           published_at = v_pub, expire_at = p_expire_at,
           updated_by = c.username, updated_at = now()
     where company_announcements.id = p_id;
    v_id := p_id;

    perform public.njhr_audit_write(p_token, 'ANN_EDIT', 'announcement',
      'company_announcements', v_id::text, v_title, to_jsonb(old),
      (select to_jsonb(x) from public.company_announcements x where x.id = v_id), null);
  end if;

  if coalesce(p_notify,false) then
    insert into public.notifications(user_id, title, body, icon)
    select u.id, 'ประกาศใหม่', v_title, 'megaphone'
      from public.app_users u
     where u.app_code = 'salary' and coalesce(u.is_active,true);
  end if;

  return query select a.id, a.title, coalesce(a.is_active,true)
                 from public.company_announcements a where a.id = v_id;
end $$;


-- ─── 6) njhr_announcement_set_active ────────────────────────
create or replace function public.njhr_announcement_set_active(
  p_token text, p_id uuid, p_active boolean)
returns table (id uuid, is_active boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record;
begin
  select * into c from public.njhr_ann_guard(p_token, true);
  select * into old from public.company_announcements where company_announcements.id = p_id;
  if not found then raise exception 'ไม่พบประกาศนี้' using errcode='P0002'; end if;

  update public.company_announcements
     set is_active = coalesce(p_active,true), updated_by = c.username, updated_at = now()
   where company_announcements.id = p_id;

  perform public.njhr_audit_write(p_token,
    case when p_active then 'ANN_ENABLE' else 'ANN_DISABLE' end,
    'announcement', 'company_announcements', p_id::text, old.title, to_jsonb(old),
    (select to_jsonb(x) from public.company_announcements x where x.id = p_id), null);

  return query select a.id, coalesce(a.is_active,true)
                 from public.company_announcements a where a.id = p_id;
end $$;


-- ─── 7) njhr_announcement_delete ────────────────────────────
--  เคยเผยแพร่แล้ว → ห้ามลบจริง บังคับเป็นปิดใช้งานแทน
create or replace function public.njhr_announcement_delete(
  p_token text, p_id uuid, p_reason text default null)
returns table (deleted boolean, deactivated boolean, title text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; v_published boolean;
        v_reason text := nullif(btrim(coalesce(p_reason,'')),'');
begin
  select * into c from public.njhr_ann_guard(p_token, true);
  if c.role <> 'SUPER_ADMIN' then
    raise exception 'เฉพาะ Super Admin เท่านั้นที่ลบประกาศได้' using errcode='42501';
  end if;
  select * into old from public.company_announcements where company_announcements.id = p_id;
  if not found then raise exception 'ไม่พบประกาศนี้' using errcode='P0002'; end if;
  if v_reason is null then
    raise exception 'กรุณาระบุเหตุผลการลบประกาศ' using errcode='22023';
  end if;

  v_published := coalesce(old.published_at, old.created_at, now()) <= now();

  if v_published then
    update public.company_announcements
       set is_active = false, updated_by = c.username, updated_at = now()
     where company_announcements.id = p_id;
    perform public.njhr_audit_write(p_token, 'ANN_DEACTIVATE', 'announcement',
      'company_announcements', p_id::text,
      old.title || ' · เคยเผยแพร่แล้ว จึงปิดใช้งานแทนการลบ · เหตุผล: ' || v_reason,
      to_jsonb(old),
      (select to_jsonb(x) from public.company_announcements x where x.id = p_id), null);
    return query select false, true, old.title;
    return;
  end if;

  perform public.njhr_audit_write(p_token, 'ANN_DELETE', 'announcement',
    'company_announcements', p_id::text,
    old.title || ' · ยังไม่เคยเผยแพร่ · เหตุผล: ' || v_reason, to_jsonb(old), null, null);
  delete from public.company_announcements where company_announcements.id = p_id;
  return query select true, false, old.title;
end $$;


-- ─── 8) GRANT ───────────────────────────────────────────────
revoke execute on function public.njhr_ann_guard(text, boolean) from public, anon, authenticated;
grant  execute on function public.njhr_announcement_list(text,text,int,int)                        to anon, authenticated;
grant  execute on function public.njhr_announcement_get(text,uuid)                                 to anon, authenticated;
grant  execute on function public.njhr_announcement_save(text,uuid,text,text,text,timestamptz,timestamptz,boolean) to anon, authenticated;
grant  execute on function public.njhr_announcement_set_active(text,uuid,boolean)                  to anon, authenticated;
grant  execute on function public.njhr_announcement_delete(text,uuid,text)                         to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.1-announcements', 'ประกาศบริษัท: 5 RPC บน company_announcements เดิม (ไม่แตะ announcement ของ MASSENGER)')
on conflict (version) do nothing;


-- ─── 9) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'columns', (select jsonb_agg(column_name order by ordinal_position)
                from information_schema.columns
               where table_schema='public' and table_name='company_announcements'),
  'rows_preserved', (select count(*) from public.company_announcements),
  'rows_detail', (select jsonb_agg(jsonb_build_object('title', a.title,
                    'priority', a.priority, 'active', a.is_active) order by a.title)
                    from public.company_announcements a),
  'massenger_untouched', jsonb_build_object(
     'announcement', (select count(*) from public.announcement),
     'announcement_read', (select count(*) from public.announcement_read),
     'announcement_timeline', (select count(*) from public.announcement_timeline)),
  'functions', (select jsonb_agg(p.proname order by p.proname)
                  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_announcement\_%')
)) as install_report;
