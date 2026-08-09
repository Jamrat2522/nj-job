-- ============================================================
-- NJ HR V.10 — 51_core_schema.sql
-- ปรับโครงสร้างตามที่ยืนยันแล้ว 5 ข้อ
--
--   1) รายการงาน OT  → ตารางลูก njhr_ot_jobs (FK → ot_requests.id)  ไม่แตะ ot_requests เดิม
--   2) ภาษี          → เพิ่มคอลัมน์ payroll.tax แยกต่างหาก ห้ามรวมใน other_deduct
--   3) สายกี่นาที     → ใช้ work_shifts.late_allow_minutes ต่อกะ ค่าเริ่มต้น 0 ห้าม Hardcode
--   4) กะข้ามวัน      → work_shifts.is_overnight คำนวณอัตโนมัติจาก end_time < start_time
--   5) payroll_state → คงเดิม ไม่แตะ (มีคำสั่งตรวจยืนยันท้ายไฟล์)
--
-- ทุกตารางเป้าหมายมี 0 แถว ยกเว้น work_shifts (3) / employee_shifts (1)
-- การเปลี่ยนแปลงทั้งหมดเป็นแบบเพิ่มเติม (additive) ข้อมูลเดิมไม่ถูกแตะ
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
declare n int;
begin
  if not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                  where ns.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  foreach n in array array[1] loop end loop;
  if to_regclass('public.ot_requests') is null then raise exception 'PREFLIGHT: ไม่พบตาราง ot_requests'; end if;
  if to_regclass('public.payroll')     is null then raise exception 'PREFLIGHT: ไม่พบตาราง payroll'; end if;
  if to_regclass('public.work_shifts') is null then raise exception 'PREFLIGHT: ไม่พบตาราง work_shifts'; end if;
  -- ต้องมีคอลัมน์ที่อ้างอิงจริง (กันเดาชื่อ)
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='work_shifts'
                    and column_name in ('start_time','end_time','late_allow_minutes')
                  having count(*) = 3) then
    raise exception 'PREFLIGHT: work_shifts ขาดคอลัมน์ start_time / end_time / late_allow_minutes';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;

-- สำรองก่อนแตะโครงสร้าง (ตารางเล็กมาก สำรองได้ทั้งหมด)
create table if not exists njhr_bk_work_shifts_20260802 as select * from public.work_shifts;
create table if not exists njhr_bk_employee_shifts_20260802 as select * from public.employee_shifts;
create table if not exists njhr_bk_payroll_20260802 as select * from public.payroll;


-- ════════════════════════════════════════════════════════════
-- [1] รายการงาน OT — ตารางลูก (ทาง A)
-- ════════════════════════════════════════════════════════════
create table if not exists public.njhr_ot_jobs (
  id             uuid primary key default gen_random_uuid(),
  ot_id          uuid not null references public.ot_requests(id) on delete cascade,
  job_no         int  not null check (job_no >= 1),
  job_code       text not null,                    -- เลข JOB
  detail         text,                             -- รายละเอียดงาน
  job_type       text,                             -- ประเภทงาน
  job_date       date not null,
  start_time     time not null,
  end_time       time not null,
  spans_next_day boolean not null default false,   -- สิ้นสุดวันถัดไป
  -- วันที่สิ้นสุดจริง คำนวณอัตโนมัติ แก้มือไม่ได้
  end_date       date generated always as (job_date + (case when spans_next_day then 1 else 0 end)) stored,
  ot_hours       numeric(6,2) not null default 0 check (ot_hours >= 0),
  -- Snapshot แผนก/ตำแหน่ง ณ วันยื่น เพื่อให้รายงานย้อนหลังไม่เปลี่ยน
  dept_snap      text,
  position_snap  text,
  note           text,
  created_at     timestamptz not null default now(),
  created_by     text,
  updated_at     timestamptz not null default now(),
  updated_by     text,
  -- เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม ยกเว้นกรณีข้ามวัน
  constraint njhr_ot_jobs_time_ck check (spans_next_day or end_time > start_time)
);
alter table public.njhr_ot_jobs enable row level security;   -- เข้าถึงผ่าน RPC เท่านั้น
create unique index if not exists njhr_ot_jobs_uidx  on public.njhr_ot_jobs (ot_id, job_no);
create index if not exists njhr_ot_jobs_ot_idx       on public.njhr_ot_jobs (ot_id);
create index if not exists njhr_ot_jobs_date_idx     on public.njhr_ot_jobs (job_date);
create index if not exists njhr_ot_jobs_code_idx     on public.njhr_ot_jobs (job_code);

comment on table public.njhr_ot_jobs is
  'รายการงาน OT ของแต่ละคำขอ (1 คำขอ = หลายรายการงาน) — ot_requests เก็บสรุปรวมเท่านั้น';


-- ── ไฟล์แนบ OT: เปลี่ยน ot_id จาก text เป็น uuid + ผูก FK จริง ──
-- (ตอนสร้าง 47_ot_attachments.sql ยังไม่รู้โครงสร้าง ot_requests จึงใช้ text ไปก่อน)
do $$
declare n int; t text;
begin
  if to_regclass('public.njhr_ot_attachments') is null then
    raise notice 'ข้าม: ยังไม่มี njhr_ot_attachments (รัน 47_ot_attachments.sql ก่อนถ้าต้องการ)';
    return;
  end if;
  select data_type into t from information_schema.columns
   where table_schema='public' and table_name='njhr_ot_attachments' and column_name='ot_id';
  if t = 'uuid' then raise notice 'njhr_ot_attachments.ot_id เป็น uuid อยู่แล้ว'; return; end if;

  select count(*) into n from public.njhr_ot_attachments;
  if n > 0 then
    -- มีข้อมูลค้างอยู่ = ไม่แปลงชนิด กันข้อมูลหาย ให้เพิ่มคอลัมน์ใหม่แทน
    if not exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='njhr_ot_attachments' and column_name='ot_uuid') then
      alter table public.njhr_ot_attachments add column ot_uuid uuid;
      alter table public.njhr_ot_attachments add column job_id uuid;
    end if;
    raise notice 'njhr_ot_attachments มีข้อมูล % แถว — เพิ่มคอลัมน์ ot_uuid/job_id แทนการแปลงชนิด', n;
  else
    -- ว่างเปล่า แปลงชนิดได้ปลอดภัย
    alter table public.njhr_ot_attachments drop column ot_id;
    alter table public.njhr_ot_attachments
      add column ot_id uuid references public.ot_requests(id) on delete cascade,
      add column job_id uuid references public.njhr_ot_jobs(id) on delete cascade;
    create index if not exists njhr_otatt_ot_idx2 on public.njhr_ot_attachments (ot_id);
    create index if not exists njhr_otatt_job_idx on public.njhr_ot_attachments (job_id);
    raise notice 'njhr_ot_attachments.ot_id แปลงเป็น uuid + FK แล้ว';
  end if;
end $$;


-- ── ot_requests: เพิ่มธงข้ามวันของสรุปรวม (additive) ──
alter table public.ot_requests add column if not exists spans_next_day boolean not null default false;
comment on column public.ot_requests.spans_next_day is 'สรุปรวม: มีรายการงานที่ข้ามวันหรือไม่ (คำนวณจาก njhr_ot_jobs)';


-- ════════════════════════════════════════════════════════════
-- [2] ภาษี — คอลัมน์แยกต่างหาก ห้ามรวมใน other_deduct
-- ════════════════════════════════════════════════════════════
alter table public.payroll add column if not exists tax numeric(12,2) not null default 0;
comment on column public.payroll.tax is 'ภาษีเงินได้หัก ณ ที่จ่าย — แยกจาก other_deduct โดยเด็ดขาด';


-- ════════════════════════════════════════════════════════════
-- [3] สายกี่นาที — ต่อกะ ค่าเริ่มต้น 0 ห้าม Hardcode
-- ════════════════════════════════════════════════════════════
do $$
begin
  update public.work_shifts set late_allow_minutes = 0 where late_allow_minutes is null;
  alter table public.work_shifts alter column late_allow_minutes set default 0;
  begin
    alter table public.work_shifts alter column late_allow_minutes set not null;
  exception when others then
    raise notice 'ตั้ง NOT NULL ให้ late_allow_minutes ไม่สำเร็จ (ข้ามได้): %', sqlerrm;
  end;
end $$;
-- ห้ามติดลบ
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'njhr_ws_late_ck') then
    alter table public.work_shifts
      add constraint njhr_ws_late_ck check (late_allow_minutes >= 0) not valid;
    alter table public.work_shifts validate constraint njhr_ws_late_ck;
  end if;
end $$;
comment on column public.work_shifts.late_allow_minutes is
  'นาทีอนุโลมมาสายของกะนี้ (0 = สายทันทีเมื่อเกินเวลาเริ่มงาน) — ระบบต้องอ่านค่านี้เสมอ ห้าม Hardcode';


-- ════════════════════════════════════════════════════════════
-- [4] กะข้ามวัน — คำนวณอัตโนมัติจาก end_time < start_time
-- ════════════════════════════════════════════════════════════
alter table public.work_shifts
  add column if not exists is_overnight boolean
  generated always as (end_time < start_time) stored;
comment on column public.work_shifts.is_overnight is
  'กะข้ามวันหรือไม่ — คำนวณอัตโนมัติจาก end_time < start_time แก้ด้วยมือไม่ได้';


-- ── employee_shifts: กันผูกกะซ้ำวันเดียวกัน (เพิ่มเมื่อไม่มีข้อมูลซ้ำเท่านั้น) ──
do $$
declare dup int;
begin
  select count(*) into dup from (
    select employee_id, effective_date from public.employee_shifts
     where employee_id is not null and effective_date is not null
     group by 1,2 having count(*) > 1) x;
  if dup > 0 then
    raise notice 'ข้ามการสร้าง unique: employee_shifts มีข้อมูลซ้ำ % ชุด', dup;
  else
    create unique index if not exists njhr_empshift_uidx
      on public.employee_shifts (employee_id, effective_date)
      where employee_id is not null and effective_date is not null;
  end if;
end $$;
create index if not exists njhr_empshift_emp_idx on public.employee_shifts (employee_id, effective_date desc);


-- ════════════════════════════════════════════════════════════
-- [5] ตัวช่วยอ่านกะที่มีผล ณ วันที่กำหนด (ใช้ employee_shifts.effective_date)
--     ทำให้รายงานย้อนหลังไม่เปลี่ยนแม้ย้ายกะภายหลัง
-- ════════════════════════════════════════════════════════════
create or replace function public.njhr_shift_at(p_employee uuid, p_date date)
returns table (shift_id uuid, shift_name text, start_time time, end_time time,
               break_minutes int, late_allow_minutes int, ot_start_after time,
               working_days text, is_overnight boolean, effective_date date)
language sql stable security definer set search_path = public as $$
  select w.id, w.shift_name, w.start_time, w.end_time,
         coalesce(w.break_minutes,0), coalesce(w.late_allow_minutes,0), w.ot_start_after,
         w.working_days, w.is_overnight, es.effective_date
    from public.employee_shifts es
    join public.work_shifts w on w.id = es.shift_id
   where es.employee_id = p_employee
     and coalesce(es.status,'ACTIVE') = 'ACTIVE'
     and (es.effective_date is null or es.effective_date <= p_date)
   order by es.effective_date desc nulls last
   limit 1;
$$;
revoke all on function public.njhr_shift_at(uuid, date) from public, anon, authenticated;
comment on function public.njhr_shift_at(uuid, date) is
  'กะที่มีผลกับพนักงาน ณ วันที่ระบุ — ใช้แทนการอ่านกะปัจจุบัน เพื่อให้รายงานย้อนหลังคงที่';

insert into public.njhr_schema_version(version, note)
values ('v11.0-core-schema', 'njhr_ot_jobs · payroll.tax · work_shifts.is_overnight · late_allow_minutes')
on conflict (version) do nothing;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  '1_njhr_ot_jobs', jsonb_build_object(
    'exists', to_regclass('public.njhr_ot_jobs') is not null,
    'rls', (select relrowsecurity from pg_class where oid='public.njhr_ot_jobs'::regclass),
    'constraints', (select jsonb_agg(conname || ' : ' || pg_get_constraintdef(oid) order by conname)
                      from pg_constraint where conrelid='public.njhr_ot_jobs'::regclass),
    'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
                 where schemaname='public' and tablename='njhr_ot_jobs')),
  '2_payroll_tax', jsonb_build_object(
    'exists', exists(select 1 from information_schema.columns
                      where table_schema='public' and table_name='payroll' and column_name='tax'),
    'definition', (select data_type||' default '||coalesce(column_default,'-')||
                          case when is_nullable='NO' then ' NOT NULL' else '' end
                     from information_schema.columns
                    where table_schema='public' and table_name='payroll' and column_name='tax'),
    'other_deduct_untouched', exists(select 1 from information_schema.columns
                      where table_schema='public' and table_name='payroll' and column_name='other_deduct')),
  '3_late_allow', (select jsonb_agg(shift_name || ' = ' || late_allow_minutes order by shift_name)
                     from public.work_shifts),
  '4_is_overnight', (select jsonb_agg(shift_name || ' : ' || start_time || '-' || end_time ||
                            ' → is_overnight=' || is_overnight order by shift_name)
                       from public.work_shifts),
  '5_payroll_state_untouched', (select value from public.system_settings where key='payroll_state'),
  'row_counts', jsonb_build_object(
    'work_shifts', (select count(*) from public.work_shifts),
    'employee_shifts', (select count(*) from public.employee_shifts),
    'payroll', (select count(*) from public.payroll),
    'ot_requests', (select count(*) from public.ot_requests),
    'njhr_ot_jobs', (select count(*) from public.njhr_ot_jobs)),
  'helper_function', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                             where n.nspname='public' and p.proname='njhr_shift_at')
)) as install_report;


-- ════════════════════════════════════════════════════════════
-- ROLLBACK
-- ════════════════════════════════════════════════════════════
-- drop function if exists public.njhr_shift_at(uuid, date);
-- drop index if exists public.njhr_empshift_uidx;
-- drop index if exists public.njhr_empshift_emp_idx;
-- alter table public.work_shifts drop column if exists is_overnight;
-- alter table public.work_shifts drop constraint if exists njhr_ws_late_ck;
-- alter table public.payroll drop column if exists tax;
-- alter table public.ot_requests drop column if exists spans_next_day;
-- drop table if exists public.njhr_ot_jobs;          -- njhr_ot_attachments.job_id จะถูก cascade
-- delete from public.njhr_schema_version where version='v11.0-core-schema';
-- คืนข้อมูล: njhr_bk_work_shifts_20260802 / njhr_bk_employee_shifts_20260802 / njhr_bk_payroll_20260802
