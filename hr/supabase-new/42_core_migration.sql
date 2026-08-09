-- ============================================================
-- NJ HR V.10 — 42_core_migration.sql  (รอบที่ 1 ของการย้ายทั้งระบบ)
--
-- ขอบเขตรอบนี้ = เฉพาะตารางที่ "ตรวจโครงสร้างจริงแล้ว" เท่านั้น:
--   notifications · leave_types · audit_log · employees · app_users · njhr_sessions
--
-- ยังไม่ครอบคลุม: attendance, ot_requests, work_shifts, employee_shifts,
--   payroll, payslips, system_settings  ← ต้องรัน 42_inspect_remaining.sql ก่อน
--   (เขียนตอนนี้ = เดาคอลัมน์ ซึ่งเคยทำให้ 01_schema.sql พังมาแล้ว ดู 00_READ_FIRST.md)
--
-- ไม่มี drop table · ไม่มี delete · ไม่แตะ nj_v6_anon_all · ไม่แตะฟังก์ชันใน 41
-- รันซ้ำได้ (idempotent) ทุกส่วน
-- ============================================================


-- ═══ ส่วนที่ 0: PRE-FLIGHT — โครงสร้างไม่ตรงที่ตรวจไว้ = หยุดทันที ═══
do $$
declare n int; fk record;
begin
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='notifications'
     and column_name in ('id','user_id','title','body','icon','is_read','created_at');
  if n <> 7 then raise exception 'PREFLIGHT: notifications คอลัมน์ฐานไม่ครบ 7 (พบ %)', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='leave_types'
     and column_name in ('id','code','label','paid','created_at');
  if n <> 5 then raise exception 'PREFLIGHT: leave_types คอลัมน์ฐานไม่ครบ 5 (พบ %)', n; end if;

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='audit_log'
     and column_name in ('id','app_code','actor','action','entity','entity_id','detail','created_at');
  if n <> 8 then raise exception 'PREFLIGHT: audit_log คอลัมน์ฐานไม่ครบ 8 (พบ %)', n; end if;

  -- notifications.user_id ต้องชี้ app_users เท่านั้น (RPC ทั้งหมดตั้งอยู่บนข้อนี้)
  for fk in
    select confrelid::regclass::text as target from pg_constraint
     where conrelid='public.notifications'::regclass and contype='f'
       and conkey = array[(select attnum::smallint from pg_attribute
                            where attrelid='public.notifications'::regclass and attname='user_id')]
  loop
    if fk.target not in ('app_users','public.app_users') then
      raise exception 'PREFLIGHT: notifications.user_id ชี้ไปที่ % ไม่ใช่ app_users — หยุด', fk.target;
    end if;
  end loop;

  -- ต้องรัน 41_leave_rpc.sql มาก่อน (ใช้ njhr_ctx ร่วมกัน)
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ยังไม่พบ njhr_ctx — กรุณารัน 41_leave_rpc.sql ก่อน';
  end if;

  raise notice 'PREFLIGHT ผ่านครบทุกข้อ';
end $$;


-- ═══ ส่วนที่ 1: BACKUP ก่อนแตะโครงสร้าง ═══
create table if not exists njhr_notif_backup_20260728  as select *, now() as backed_up_at from public.notifications;
create table if not exists njhr_ltypes_backup_20260728 as select *, now() as backed_up_at from public.leave_types;
select (select count(*) from njhr_notif_backup_20260728)  as "สำรอง notifications",
       (select count(*) from njhr_ltypes_backup_20260728) as "สำรอง leave_types";


-- ═══ ส่วนที่ 2: SCHEMA VERSION (ใช้กับ njhr_healthcheck) ═══
create table if not exists public.njhr_schema_version (
  version     text primary key,
  applied_at  timestamptz not null default now(),
  note        text
);
alter table public.njhr_schema_version enable row level security;  -- อ่านผ่าน RPC เท่านั้น
insert into public.njhr_schema_version(version, note)
values ('v10.2-core', 'healthcheck + notifications + leave type metadata + audit fields')
on conflict (version) do nothing;


-- ═══ ส่วนที่ 3: คอลัมน์ที่ขาดจริง (เพิ่มอย่างเดียว ไม่แก้/ไม่ลบของเดิม) ═══
-- 3.1 notifications: Deep Link + ประเภท + อ้างอิงต้นทาง
alter table public.notifications add column if not exists link         text;
alter table public.notifications add column if not exists kind         text;
alter table public.notifications add column if not exists module       text;
alter table public.notifications add column if not exists reference_id text;

-- 3.2 audit_log (ตารางกลางหลายแอปใช้ร่วม — เพิ่มคอลัมน์ nullable เท่านั้น แอปอื่นไม่กระทบ)
alter table public.audit_log add column if not exists actor_role text;
alter table public.audit_log add column if not exists module     text;
alter table public.audit_log add column if not exists old_value  jsonb;
alter table public.audit_log add column if not exists new_value  jsonb;
alter table public.audit_log add column if not exists user_agent text;

-- 3.3 leave_types: Metadata ของประเภทลา (ยังคง enum leave_type 7 ค่าเป็นแหล่งจริง)
alter table public.leave_types add column if not exists label_th       text;
alter table public.leave_types add column if not exists color          text;
alter table public.leave_types add column if not exists active         boolean not null default true;
alter table public.leave_types add column if not exists need_doc       boolean not null default false;
alter table public.leave_types add column if not exists doc_after_days numeric not null default 0;
alter table public.leave_types add column if not exists approval_mode  text    not null default 'ANY';
alter table public.leave_types add column if not exists sort_order     int     not null default 0;
alter table public.leave_types add column if not exists updated_at     timestamptz not null default now();
create unique index if not exists njhr_leave_types_code_uidx on public.leave_types (code);

-- 3.4 seed 7 ค่าตาม enum จริง (รันซ้ำไม่สร้างซ้ำ · ไม่ทับค่าที่ผู้ดูแลแก้ไว้แล้ว)
insert into public.leave_types (code, label, label_th, color, need_doc, doc_after_days, sort_order)
values ('SICK','Sick Leave','ลาป่วย','#DC2626', true, 3, 1),
       ('PERSONAL','Personal Leave','ลากิจ','#2563EB', false, 0, 2),
       ('VACATION','Annual Leave','ลาพักร้อน','#059669', false, 0, 3),
       ('MATERNITY','Maternity Leave','ลาคลอด','#DB2777', true, 0, 4),
       ('ORDINATION','Ordination Leave','ลาบวช','#D97706', false, 0, 5),
       ('HALFDAY','Half Day','ลาครึ่งวัน','#7C3AED', false, 0, 6),
       ('OTHER','Other','ลาอื่น ๆ','#64748B', false, 0, 7)
on conflict (code) do nothing;


-- ═══ ส่วนที่ 4: INDEX ═══
create index if not exists njhr_notif_user_idx  on public.notifications (user_id, is_read, created_at desc);
create index if not exists njhr_audit_app_idx   on public.audit_log (app_code, created_at desc);
create index if not exists njhr_audit_entity_idx on public.audit_log (entity, entity_id);


-- ═══ ส่วนที่ 5: HEALTHCHECK (อ่านอย่างเดียว · ไม่ต้องใช้ token) ═══
create or replace function public.njhr_healthcheck()
returns table (ok boolean, app_code text, schema_version text,
               server_time timestamptz, project_ready boolean, detail jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare miss text[] := '{}'; t text; v text;
begin
  -- ตารางที่ระบบต้องมีจึงจะเปิดใช้งานได้
  foreach t in array array['employees','app_users','njhr_sessions','leave_requests',
                           'leave_attachments','leave_types','notifications','audit_log','holidays']
  loop
    if not exists (select 1 from information_schema.tables
                    where table_schema='public' and table_name=t) then
      miss := miss || t;
    end if;
  end loop;
  -- ฟังก์ชันหลักที่ต้องติดตั้งแล้ว
  foreach t in array array['njhr_login','njhr_session_check','njhr_logout','njhr_ctx','njhr_leave_submit']
  loop
    if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                    where n.nspname='public' and p.proname=t) then
      miss := miss || ('fn:'||t);
    end if;
  end loop;

  select sv.version into v from public.njhr_schema_version sv
   order by sv.applied_at desc limit 1;

  return query select
    (array_length(miss,1) is null),
    'salary'::text,
    coalesce(v,'unknown'),
    now(),
    (array_length(miss,1) is null and v is not null),
    jsonb_build_object('missing', to_jsonb(miss), 'tz', current_setting('TimeZone'));
end $$;


-- ═══ ส่วนที่ 6: NOTIFICATIONS (ผู้ใช้เห็นเฉพาะของตนเอง) ═══
-- link: ถ้าแถวเดิมไม่มี ให้เดาจาก icon/module ที่ 41 เขียนไว้ (ไม่แก้ฟังก์ชันใน 41)
create or replace function public.njhr_notify_link(p_icon text, p_module text, p_link text)
returns text language sql immutable as $$
  select coalesce(nullif(p_link,''),
    case coalesce(nullif(p_module,''), p_icon)
      when 'leave'      then '#/leave'
      when 'ot'         then '#/ot'
      when 'attendance' then '#/attendance'
      when 'payroll'    then '#/epayslip'
      when 'approval'   then '#/approvals'
      else '#/dashboard' end) $$;

create or replace function public.njhr_notify_list(
  p_token text, p_limit int default 20, p_offset int default 0)
returns table (id uuid, title text, body text, link text, kind text, module text,
               reference_id text, is_read boolean, created_at timestamptz,
               unread_count bigint, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; lim int := least(greatest(coalesce(p_limit,20),1),100);
begin
  select * into c from public.njhr_ctx(p_token);
  return query
  with base as (select n.* from public.notifications n where n.user_id = c.app_user_id),
  agg as (select count(*) filter (where not coalesce(is_read,false)) u, count(*) t from base)
  select b.id, b.title, b.body,
         public.njhr_notify_link(b.icon, b.module, b.link),
         b.kind, b.module, b.reference_id, coalesce(b.is_read,false), b.created_at,
         (select u from agg), (select t from agg)
    from base b
   order by b.created_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;

create or replace function public.njhr_notify_unread(p_token text)
returns bigint language plpgsql stable security definer set search_path = public as $$
declare c record; n bigint;
begin
  select * into c from public.njhr_ctx(p_token);
  select count(*) into n from public.notifications
   where user_id = c.app_user_id and not coalesce(is_read,false);
  return n;
end $$;

create or replace function public.njhr_notify_read(p_token text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  update public.notifications set is_read = true
   where notifications.id = p_id and notifications.user_id = c.app_user_id;
  return found;                                  -- ของคนอื่น = ไม่มีผล ไม่ error ให้เดาได้
end $$;

create or replace function public.njhr_notify_read_all(p_token text)
returns bigint language plpgsql security definer set search_path = public as $$
declare c record; n bigint;
begin
  select * into c from public.njhr_ctx(p_token);
  with up as (
    update public.notifications set is_read = true
     where user_id = c.app_user_id and not coalesce(is_read,false) returning 1)
  select count(*) into n from up;
  return n;
end $$;


-- ═══ ส่วนที่ 7: LEAVE TYPE METADATA (แทน db.leaveTypes) ═══
create or replace function public.njhr_leave_types(p_token text)
returns table (code text, label_th text, color text, active boolean,
               need_doc boolean, doc_after_days numeric, approval_mode text,
               sort_order int, quota_field text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.njhr_ctx(p_token);                       -- ต้องมี session ที่ใช้ได้
  return query
  select t.code, coalesce(t.label_th, t.label, t.code), coalesce(t.color,'#64748B'),
         t.active, t.need_doc, t.doc_after_days, t.approval_mode, t.sort_order,
         case t.code when 'SICK' then 'leave_sick'
                     when 'PERSONAL' then 'leave_personal'
                     when 'VACATION' then 'leave_vacation' else null end
    from public.leave_types t
   where t.code = any (select unnest(enum_range(null::public.leave_type))::text)
   order by t.sort_order, t.code;
end $$;

-- แก้ Metadata ได้เฉพาะสิทธิ์เดียวกับหน้า "ตั้งค่าระบบ" เดิม (SUPER_ADMIN / ADMIN / HR)
-- ไม่เพิ่ม/ไม่ลบประเภท เพราะประเภทถูกกำหนดโดย enum leave_type
create or replace function public.njhr_leave_type_save(
  p_token text, p_code text, p_label_th text, p_color text,
  p_active boolean, p_need_doc boolean, p_doc_after_days numeric)
returns table (code text, label_th text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN','HR') then
    raise exception 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่าประเภทการลา' using errcode='42501';
  end if;
  if not exists (select 1 from unnest(enum_range(null::public.leave_type)) e
                  where e::text = upper(p_code)) then
    raise exception 'ประเภทการลาไม่ถูกต้อง (%)', p_code using errcode='22023';
  end if;

  select to_jsonb(t) into oldrow from public.leave_types t where t.code = upper(p_code);

  update public.leave_types set
    label_th       = coalesce(nullif(btrim(p_label_th),''), label_th),
    color          = coalesce(nullif(btrim(p_color),''), color),
    active         = coalesce(p_active, active),
    need_doc       = coalesce(p_need_doc, need_doc),
    doc_after_days = coalesce(p_doc_after_days, doc_after_days),
    updated_at     = now()
   where leave_types.code = upper(p_code);
  if not found then raise exception 'ไม่พบประเภทการลานี้' using errcode='P0002'; end if;

  insert into public.audit_log(app_code, actor, actor_role, action, module, entity, entity_id,
                               detail, old_value, new_value)
  select 'salary', c.username, c.role, 'LEAVETYPE_EDIT', 'settings', 'leave_types', upper(p_code),
         'แก้ไขประเภทการลา ' || upper(p_code), oldrow, to_jsonb(t)
    from public.leave_types t where t.code = upper(p_code);

  return query select t.code, coalesce(t.label_th, t.label, t.code)
                 from public.leave_types t where t.code = upper(p_code);
end $$;


-- ═══ ส่วนที่ 8: AUDIT LOG เขียนฝั่งเซิร์ฟเวอร์ (Browser เพิ่ม/ลบเองไม่ได้) ═══
create or replace function public.njhr_audit_write(
  p_token text, p_action text, p_module text, p_entity text, p_entity_id text,
  p_detail text default null, p_old jsonb default null, p_new jsonb default null,
  p_ua text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);       -- actor มาจาก token เท่านั้น
  insert into public.audit_log(app_code, actor, actor_role, action, module,
                               entity, entity_id, detail, old_value, new_value, user_agent)
  values ('salary', c.username, c.role, upper(p_action), p_module,
          p_entity, p_entity_id, p_detail, p_old, p_new, left(coalesce(p_ua,''),200));
  return true;
end $$;

-- อ่าน Audit Log (เฉพาะผู้มีสิทธิ์ตามหน้า "ประวัติการใช้งาน" เดิม = SUPER_ADMIN / ADMIN)
create or replace function public.njhr_audit_list(
  p_token text, p_q text default null, p_limit int default 50, p_offset int default 0)
returns table (created_at timestamptz, actor text, actor_role text, action text,
               module text, entity text, entity_id text, detail text, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; lim int := least(greatest(coalesce(p_limit,50),1),200);
begin
  select * into c from public.njhr_ctx(p_token);
  if c.role not in ('SUPER_ADMIN','ADMIN') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการใช้งาน' using errcode='42501';
  end if;
  return query
  with base as (
    select a.* from public.audit_log a
     where a.app_code = 'salary'
       and (p_q is null or p_q = '' or a.actor ilike '%'||p_q||'%'
            or a.action ilike '%'||p_q||'%' or a.detail ilike '%'||p_q||'%')),
  cnt as (select count(*) n from base)
  select b.created_at, b.actor, b.actor_role, b.action, b.module, b.entity, b.entity_id,
         b.detail, (select n from cnt)
    from base b order by b.created_at desc
   limit lim offset greatest(coalesce(p_offset,0),0);
end $$;


-- ═══ ส่วนที่ 9: สิทธิ์เรียกใช้ (anon เรียกได้เฉพาะ RPC ที่ตรวจ token) ═══
revoke all on function public.njhr_notify_link(text,text,text) from public, anon, authenticated;

grant execute on function public.njhr_healthcheck()                        to anon, authenticated;
grant execute on function public.njhr_notify_list(text,int,int)            to anon, authenticated;
grant execute on function public.njhr_notify_unread(text)                  to anon, authenticated;
grant execute on function public.njhr_notify_read(text,uuid)               to anon, authenticated;
grant execute on function public.njhr_notify_read_all(text)                to anon, authenticated;
grant execute on function public.njhr_leave_types(text)                    to anon, authenticated;
grant execute on function public.njhr_leave_type_save(text,text,text,text,boolean,boolean,numeric)
                                                                           to anon, authenticated;
grant execute on function public.njhr_audit_write(text,text,text,text,text,text,jsonb,jsonb,text)
                                                                           to anon, authenticated;
grant execute on function public.njhr_audit_list(text,text,int,int)        to anon, authenticated;


-- ═══ ส่วนที่ 10: VERIFICATION (อ่านอย่างเดียว) ═══
select jsonb_pretty(jsonb_build_object(
  'healthcheck',   (select to_jsonb(h) from public.njhr_healthcheck() h),
  'new_functions', (select jsonb_agg(p.proname order by p.proname)
                      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                     where n.nspname='public'
                       and p.proname in ('njhr_healthcheck','njhr_notify_list','njhr_notify_unread',
                                         'njhr_notify_read','njhr_notify_read_all','njhr_leave_types',
                                         'njhr_leave_type_save','njhr_audit_write','njhr_audit_list')),
  'notif_columns', (select jsonb_agg(column_name order by column_name)
                      from information_schema.columns
                     where table_schema='public' and table_name='notifications'
                       and column_name in ('link','kind','module','reference_id')),
  'audit_columns', (select jsonb_agg(column_name order by column_name)
                      from information_schema.columns
                     where table_schema='public' and table_name='audit_log'
                       and column_name in ('actor_role','module','old_value','new_value','user_agent')),
  'leave_types',   (select jsonb_agg(jsonb_build_object('code',code,'th',label_th,'active',active,'doc',need_doc)
                      order by sort_order) from public.leave_types),
  'rows_untouched', jsonb_build_object(
      'notifications', (select count(*) from public.notifications),
      'audit_log',     (select count(*) from public.audit_log),
      'leave_requests',(select count(*) from public.leave_requests))
)) as install_report;


-- ═══ ส่วนที่ 11: ROLLBACK (คัดลอกไปรันเมื่อต้องการย้อนกลับ) ═══
-- drop function if exists public.njhr_audit_list(text,text,int,int);
-- drop function if exists public.njhr_audit_write(text,text,text,text,text,text,jsonb,jsonb,text);
-- drop function if exists public.njhr_leave_type_save(text,text,text,text,boolean,boolean,numeric);
-- drop function if exists public.njhr_leave_types(text);
-- drop function if exists public.njhr_notify_read_all(text);
-- drop function if exists public.njhr_notify_read(text,uuid);
-- drop function if exists public.njhr_notify_unread(text);
-- drop function if exists public.njhr_notify_list(text,int,int);
-- drop function if exists public.njhr_notify_link(text,text,text);
-- drop function if exists public.njhr_healthcheck();
-- drop index if exists public.njhr_notif_user_idx;
-- drop index if exists public.njhr_audit_app_idx;
-- drop index if exists public.njhr_audit_entity_idx;
-- drop index if exists public.njhr_leave_types_code_uidx;
-- -- คอลัมน์ที่เพิ่ม (ลบได้ ข้อมูลเดิมไม่กระทบ):
-- alter table public.notifications drop column if exists link, drop column if exists kind,
--   drop column if exists module, drop column if exists reference_id;
-- alter table public.audit_log drop column if exists actor_role, drop column if exists module,
--   drop column if exists old_value, drop column if exists new_value, drop column if exists user_agent;
-- alter table public.leave_types drop column if exists label_th, drop column if exists color,
--   drop column if exists active, drop column if exists need_doc, drop column if exists doc_after_days,
--   drop column if exists approval_mode, drop column if exists sort_order, drop column if exists updated_at;
-- -- คืนข้อมูล leave_types เดิม (เดิมว่าง 0 แถว):
-- -- delete from public.leave_types;
-- -- insert into public.leave_types(id,code,label,paid,created_at)
-- --   select id,code,label,paid,created_at from njhr_ltypes_backup_20260728;
-- drop table if exists public.njhr_schema_version;
