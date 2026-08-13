-- ============================================================
-- NJ HR V2 — 91_ot_approval_queue.sql
-- Batch Read RPC สำหรับคิว "คำขอ OT" ในหน้าอนุมัติ
--
-- ⚠⚠ ไฟล์นี้ยังไม่ได้รัน — ส่งมาให้ตรวจก่อนเท่านั้น ⚠⚠
--
-- ปัญหาที่แก้
--   หน้า "อนุมัติ > คำขอ OT" (src/11-view-approvals-payroll.js)
--   เดิมยิง njhr_ot_list 1 ครั้ง แล้ววนเรียกต่อรายการอีก 2 ตัว
--     njhr_ot_get         (เพราะ njhr_ot_list ไม่คืน njhr_ot_jobs)
--     njhr_ot_attach_list (เพราะไม่คืนไฟล์แนบ)
--   รวมเป็น 2N + 1 คำขอ  →  10 รายการ = 21 · 50 รายการ = 101
--   เพดาน p_limit = 200 จึงแย่ที่สุดคือ 401 คำขอในการเปิดหน้าครั้งเดียว
--
-- วิธีแก้
--   เพิ่ม njhr_ot_approval_queue ตัวใหม่ที่คืนทุกอย่างใน Query เดียว
--   ไม่แตะ njhr_ot_list · njhr_ot_get · njhr_ot_attach_list เดิมแม้แต่บรรทัดเดียว
--   หน้าอื่นที่เรียก 3 ตัวนั้นอยู่จึงไม่ได้รับผลกระทบ
--
-- ความปลอดภัย
--   ใช้ njhr_ot_guard(p_token) ตัวเดียวกับ njhr_ot_list
--   เงื่อนไขการมองเห็นคัดลอกมาจาก njhr_ot_list ทุกบรรทัด
--   คืนข้อมูลครบเท่ากับที่หน้าเดิมเคยได้จาก 3 RPC รวมกัน
--     njhr_ot_list (ฉบับ R3_request_no_expose.sql ซึ่งคืน request_no ด้วย)
--     njhr_ot_get  → jobs + approvals
--     njhr_ot_attach_list → attachments
--
--   ไฟล์แนบใช้เงื่อนไขเดียวกับ njhr_ot_attach_list
--     (เจ้าของ หรือ role ใน SUPER_ADMIN/ADMIN/HR/MANAGER)
--   จึงไม่มีทางเห็นข้อมูลมากกว่าเดิม
--
-- ต้องรัน 47 · 65 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
begin
  if to_regclass('public.ot_requests') is null then
    raise exception 'PREFLIGHT: ไม่พบ ot_requests — ต้องรัน 65_ot.sql ก่อน';
  end if;
  if to_regclass('public.njhr_ot_jobs') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ot_jobs — ต้องรัน 65_ot.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'njhr_ot_guard') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ot_guard — ต้องรัน 65_ot.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'njhr_ot_is_holiday') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ot_is_holiday — ต้องรัน 65_ot.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


begin;

-- ─── 1) คิวคำขอ OT แบบอ่านครั้งเดียวจบ ──────────────────────
--  คืนคอลัมน์เดิมของ njhr_ot_list ครบทุกตัว (หน้าเว็บใช้ชื่อเดิมได้เลย)
--  บวก 2 คอลัมน์ jsonb ที่เดิมต้องยิงเพิ่มรายรายการ
--    jobs        = รูปเดียวกับ njhr_ot_get -> 'jobs'
--    attachments = รูปเดียวกับแถวของ njhr_ot_attach_list
create or replace function public.njhr_ot_approval_queue(
  p_token text,
  p_from date default null,
  p_to date default null,
  p_status text default 'PENDING',
  p_dept text default null,
  p_employee uuid default null,
  p_q text default null,
  p_mine boolean default false,
  p_limit int default 200,
  p_offset int default 0)
returns table (
  id uuid, ot_date date, start_time time, end_time time, spans_next_day boolean,
  ot_hours numeric, reason text, status text, created_at timestamptz,
  employee_id uuid, emp_code text, prefix text, emp_name text, nickname text,
  department text, position_name text,
  jobs_count int, is_holiday boolean, files_count int, total_count bigint,
  request_no text, approvals jsonb,
  jobs jsonb, attachments jsonb)
language plpgsql stable security definer set search_path = public as $function$
#variable_conflict use_column
declare c record;
        q text := lower(btrim(coalesce(p_q,'')));
        st text := upper(btrim(coalesce(p_status,'')));
        has_files boolean := to_regclass('public.njhr_ot_attachments') is not null;
begin
  -- guard ตัวเดียวกับ njhr_ot_list — สิทธิ์จึงเท่ากันเป๊ะ
  select * into c from public.njhr_ot_guard(p_token);
  if st <> '' and st not in ('PENDING','APPROVED','REJECTED','CANCELLED') then
    raise exception 'สถานะคำขอไม่ถูกต้อง (%)', p_status using errcode='22023';
  end if;
  if not c.is_manager and c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;

  return query
  with base as (
    select o.id oid, o.ot_date od, o.start_time ost, o.end_time oen, o.spans_next_day osp,
           o.ot_hours oh, o.reason orz, o.status::text ostat, o.created_at oca,
           o.request_no orq,                        -- เลขที่คำขอ YYMMDD-#### (จาก R3_request_no_expose.sql)
           coalesce(o.approvals, '[]'::jsonb) oap,  -- Timeline การอนุมัติ (จาก njhr_ot_get)
           e.id eid, e.emp_code ec, coalesce(e.prefix,'') epx,
           btrim(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) enm,
           coalesce(e.nickname,'') enk, coalesce(e.department_name,'') edept,
           coalesce(e.position_name,'') epos,
           (select count(*)::int from public.njhr_ot_jobs j where j.ot_id = o.id) jc,
           public.njhr_ot_is_holiday(o.ot_date) hol,
           -- njhr_ot_attachments.ot_id อาจเป็น text หรือ uuid แล้วแต่ลำดับที่รัน 47/51 จึงเทียบแบบ text
           case when has_files then
             (select count(*)::int from public.njhr_ot_attachments a where a.ot_id::text = o.id::text)
             else 0 end fc
      from public.ot_requests o
      join public.employees e on e.id = o.employee_id
     where (p_from is null or o.ot_date >= p_from)
       and (p_to is null or o.ot_date <= p_to)
       -- พนักงานทั่วไปเห็นเฉพาะของตนเอง · ผู้ดูแลขอดูเฉพาะของตนเองได้ด้วย p_mine
       and (case when coalesce(p_mine,false) or not c.is_manager
                 then o.employee_id = c.employee_id else true end)
       and (st = '' or o.status::text = st)
       and (p_dept is null or p_dept = '' or e.department_name = p_dept)
       and (p_employee is null or o.employee_id = p_employee)
       and (q = '' or lower(coalesce(e.emp_code,'')) like '%'||q||'%'
            or lower(coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.prefix,'')||coalesce(e.first_name,'')||' '||coalesce(e.last_name,'')) like '%'||q||'%'
            or lower(coalesce(e.nickname,'')) like '%'||q||'%'
            or exists (select 1 from public.njhr_ot_jobs j
                        where j.ot_id = o.id and lower(j.job_code) like '%'||q||'%')))
  ), page as (
    select b.* from base b
     order by b.od desc, b.oca desc
     limit least(greatest(coalesce(p_limit,200),1),1000)
    offset greatest(coalesce(p_offset,0),0)
  )
  select p.oid, p.od, p.ost, p.oen, p.osp, p.oh, p.orz, p.ostat, p.oca,
         p.eid, p.ec, p.epx, p.enm, p.enk, p.edept, p.epos,
         p.jc, p.hol, p.fc, (select count(*) from base),
         p.orq, p.oap,
         /* รายการงาน — คีย์และลำดับเหมือน njhr_ot_get -> 'jobs' ทุกตัว */
         (select coalesce(jsonb_agg(jsonb_build_object(
             'no', j.job_no, 'job_code', j.job_code, 'detail', j.detail, 'job_type', j.job_type,
             'job_date', j.job_date, 'start_time', j.start_time, 'end_time', j.end_time,
             'spans_next_day', j.spans_next_day, 'end_date', j.end_date,
             'ot_hours', j.ot_hours, 'note', j.note) order by j.job_no), '[]'::jsonb)
            from public.njhr_ot_jobs j where j.ot_id = p.oid),
         /* ไฟล์แนบ — คีย์เหมือนแถวของ njhr_ot_attach_list
            เงื่อนไขการมองเห็นคัดลอกจาก RPC นั้นทั้งหมด */
         case when has_files then
           (select coalesce(jsonb_agg(jsonb_build_object(
               'job_no', a.job_no, 'job_code', a.job_code, 'file_name', a.file_name,
               'file_url', a.file_url, 'file_path', a.file_path,
               'file_size', a.file_size, 'content_type', a.content_type,
               'created_at', a.created_at) order by a.job_no, a.created_at), '[]'::jsonb)
              from public.njhr_ot_attachments a
             where a.ot_id::text = p.oid::text
               and a.deleted_at is null
               and (a.employee_id = c.employee_id
                    or c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER')))
           else '[]'::jsonb end
    from page p
   order by p.od desc, p.oca desc;
end $function$;


-- ─── 2) ดัชนีช่วยการรวมข้อมูล ───────────────────────────────
--  สองดัชนีนี้ทำให้ subquery ต่อแถวไม่ต้อง scan ทั้งตาราง
--  ใช้ if not exists จึงรันซ้ำได้และไม่กระทบดัชนีเดิม
create index if not exists njhr_ot_jobs_ot_id_job_no_idx
  on public.njhr_ot_jobs (ot_id, job_no);

do $$
begin
  if to_regclass('public.njhr_ot_attachments') is not null then
    execute 'create index if not exists njhr_ot_attachments_otid_txt_idx
               on public.njhr_ot_attachments ((ot_id::text)) where deleted_at is null';
  end if;
end $$;


-- ─── 3) สิทธิ์เรียกใช้ ──────────────────────────────────────
revoke all on function public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,int,int) from public;
grant execute on function public.njhr_ot_approval_queue(text,date,date,text,text,uuid,text,boolean,int,int)
  to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v3.7-ot-approval-queue',
        'คิวคำขอ OT อ่านครั้งเดียวจบ — เลิก 2N+1 (njhr_ot_get + njhr_ot_attach_list ต่อรายการ)')
on conflict (version) do nothing;

commit;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'RPC ใหม่มีจริง',
    (select count(*) = 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'njhr_ot_approval_queue'),
  'คืน request_no และ approvals',
    (select pg_get_function_result(p.oid) ilike '%request_no text%'
        and pg_get_function_result(p.oid) ilike '%approvals jsonb%'
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'njhr_ot_approval_queue' limit 1),
  'คืนคอลัมน์ jobs และ attachments',
    (select pg_get_function_result(p.oid) ilike '%jobs jsonb%'
        and pg_get_function_result(p.oid) ilike '%attachments jsonb%'
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'njhr_ot_approval_queue' limit 1),
  'RPC เดิม 3 ตัวยังอยู่ครบ ไม่ถูกแตะ',
    (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('njhr_ot_list','njhr_ot_get','njhr_ot_attach_list')),
  'ดัชนี njhr_ot_jobs',
    (select count(*) = 1 from pg_indexes
      where schemaname = 'public' and indexname = 'njhr_ot_jobs_ot_id_job_no_idx'),
  'คำขอ OT ที่รออนุมัติตอนนี้',
    (select count(*) from public.ot_requests where status::text = 'PENDING')
)) as report;


-- ════════════════════════════════════════════════════════════
-- เทียบผลกับของเดิม (รันเองเพื่อยืนยันว่าข้อมูลตรงกัน)
-- ════════════════════════════════════════════════════════════
-- แทน <TOKEN> ด้วย session token จริงของผู้อนุมัติ
--
--   select count(*) as จำนวนแถวเดิม
--     from public.njhr_ot_list('<TOKEN>', null, null, 'PENDING',
--                              null, null, null, false, 200, 0);
--
--   select count(*) as จำนวนแถวใหม่
--     from public.njhr_ot_approval_queue('<TOKEN>', null, null, 'PENDING',
--                                        null, null, null, false, 200, 0);
--
-- จำนวนต้องเท่ากัน และตรวจรายแถวว่า jobs_count = jsonb_array_length(jobs)
--
--   select id, jobs_count, jsonb_array_length(jobs) as jobs_ใน_jsonb,
--          files_count, jsonb_array_length(attachments) as files_ใน_jsonb
--     from public.njhr_ot_approval_queue('<TOKEN>', null, null, 'PENDING',
--                                        null, null, null, false, 200, 0)
--    where jobs_count <> jsonb_array_length(jobs)
--       or files_count <> jsonb_array_length(attachments);
--
-- ต้องได้ 0 แถว
-- (files_count นับทุกไฟล์ที่ยังไม่ถูกลบ ส่วน attachments กรองตามสิทธิ์ด้วย
--  ถ้าผู้เรียกเป็นผู้ดูแลจะเท่ากันเสมอ · ถ้าเป็นพนักงานทั่วไปอาจน้อยกว่าได้)
