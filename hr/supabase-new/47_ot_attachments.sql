-- ============================================================
-- NJ HR V.10 — 47_ot_attachments.sql
-- ไฟล์แนบของรายการงาน OT: เก็บไฟล์จริงบน Supabase Storage (เลิกเก็บ base64 ในเบราว์เซอร์)
--
-- ต้นเหตุเดิม: ไฟล์แนบถูกแปลงเป็น base64 แล้วยัดลง db.ots ใน localStorage
--   ไฟล์ 2MB → base64 ~2.7MB ชน quota ~5MB ของ localStorage
--   lsSet() ดัก QuotaExceededError แล้ว fallback ไปหน่วยความจำเงียบ ๆ
--   → หน้าจอขึ้นว่าบันทึกสำเร็จ แต่ Refresh แล้วคำขอหาย
--
-- ⚠️ ตาราง ot_requests บน Supabase ยังไม่เคยตรวจโครงสร้าง จึง "ยังผูก Foreign Key ไม่ได้"
--    ตารางนี้จึงเก็บ ot_id เป็น text (อ้างรหัสคำขอฝั่งแอป) ไว้ก่อน
--    เมื่อย้าย OT ขึ้น Supabase แล้วค่อยเพิ่ม FK ในรอบถัดไป
--
-- ต้องรัน 41_leave_rpc.sql และ 42_core_migration.sql มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PRE-FLIGHT ───────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_ctx') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ─── 1) Storage bucket สำหรับไฟล์แนบ OT ──────────────────────
insert into storage.buckets (id, name, public)
values ('ot-attachments', 'ot-attachments', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname='storage' and tablename='objects' and policyname='njhr_ot_upload') then
    execute $p$create policy njhr_ot_upload on storage.objects
              for insert to anon, authenticated
              with check (bucket_id = 'ot-attachments')$p$;
  end if;
  if not exists (select 1 from pg_policies
                  where schemaname='storage' and tablename='objects' and policyname='njhr_ot_read') then
    execute $p$create policy njhr_ot_read on storage.objects
              for select to anon, authenticated
              using (bucket_id = 'ot-attachments')$p$;
  end if;
exception when insufficient_privilege then
  raise notice 'ข้ามการสร้าง storage policy (สิทธิ์ไม่พอ) — สร้างเองที่ Dashboard > Storage > ot-attachments > Policies';
end $$;


-- ─── 2) ทะเบียนไฟล์แนบ OT ────────────────────────────────────
create table if not exists public.njhr_ot_attachments (
  id            uuid primary key default gen_random_uuid(),
  ot_id         text not null,                       -- รหัสคำขอ OT ฝั่งแอป (ยังไม่มี FK — ดูหมายเหตุหัวไฟล์)
  job_no        int  not null check (job_no >= 1),   -- ลำดับรายการงานในคำขอนั้น
  job_code      text,                                -- เลข JOB ตอนอัปโหลด (เก็บไว้ให้ตรวจย้อนหลังได้)
  employee_id   uuid references public.employees(id) on delete set null,
  file_name     text not null,
  file_path     text not null,                       -- path ใน bucket ot-attachments
  file_url      text not null,
  file_size     bigint,
  content_type  text,
  uploaded_by   text,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
alter table public.njhr_ot_attachments enable row level security;   -- เข้าถึงผ่าน RPC เท่านั้น
create unique index if not exists njhr_otatt_path_uidx
  on public.njhr_ot_attachments (file_path) where deleted_at is null;
create index if not exists njhr_otatt_ot_idx  on public.njhr_ot_attachments (ot_id, job_no) where deleted_at is null;
create index if not exists njhr_otatt_emp_idx on public.njhr_ot_attachments (employee_id) where deleted_at is null;

insert into public.njhr_schema_version(version, note)
values ('v10.7-ot-attachments', 'ไฟล์แนบ OT ย้ายขึ้น Supabase Storage')
on conflict (version) do nothing;


-- ─── 3) RPC ──────────────────────────────────────────────────
-- ลงทะเบียนไฟล์ที่อัปโหลดสำเร็จ (เจ้าของคำขอเท่านั้น — อ้างพนักงานจาก token ไม่เชื่อค่าจาก browser)
create or replace function public.njhr_ot_attach_add(
  p_token text, p_ot_id text, p_job_no int, p_job_code text,
  p_file_name text, p_file_path text, p_file_url text,
  p_file_size bigint default null, p_content_type text default null)
returns table (id uuid, file_name text, file_url text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_id uuid;
begin
  select * into c from public.njhr_ctx(p_token);
  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' using errcode='28000';
  end if;
  if coalesce(btrim(p_ot_id),'') = '' or p_job_no is null or p_job_no < 1 then
    raise exception 'ข้อมูลรายการงาน OT ไม่ครบ' using errcode='22023';
  end if;
  if coalesce(btrim(p_file_name),'') = '' or coalesce(btrim(p_file_path),'') = ''
     or coalesce(btrim(p_file_url),'') = '' then
    raise exception 'ข้อมูลไฟล์แนบไม่ครบ (ต้องมีชื่อไฟล์และที่อยู่ไฟล์)' using errcode='22023';
  end if;
  begin
    insert into public.njhr_ot_attachments(ot_id, job_no, job_code, employee_id, file_name,
                                           file_path, file_url, file_size, content_type, uploaded_by)
    values (btrim(p_ot_id), p_job_no, nullif(btrim(coalesce(p_job_code,'')),''), c.employee_id,
            btrim(p_file_name), btrim(p_file_path), btrim(p_file_url),
            p_file_size, nullif(btrim(coalesce(p_content_type,'')),''), c.username)
    returning njhr_ot_attachments.id into v_id;
  exception when unique_violation then
    raise exception 'ไฟล์นี้ถูกอัปโหลดไปแล้ว' using errcode='23505';
  end;

  perform public.njhr_audit_write(p_token, 'OT_ATTACH_ADD', 'ot', 'njhr_ot_attachments', v_id::text,
    'แนบไฟล์ ' || btrim(p_file_name) || ' เข้ารายการที่ ' || p_job_no || ' ของคำขอ ' || btrim(p_ot_id),
    null, null, null);
  return query select a.id, a.file_name, a.file_url from public.njhr_ot_attachments a where a.id = v_id;
end $$;

-- ลบไฟล์แนบ (Soft Delete) — เจ้าของไฟล์ หรือผู้มีสิทธิ์อนุมัติเท่านั้น
create or replace function public.njhr_ot_attach_delete(p_token text, p_path text)
returns boolean language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; a record;
begin
  select * into c from public.njhr_ctx(p_token);
  select * into a from public.njhr_ot_attachments
   where file_path = btrim(p_path) and deleted_at is null;
  if not found then raise exception 'ไม่พบไฟล์แนบนี้' using errcode='P0002'; end if;
  if a.employee_id is distinct from c.employee_id
     and c.role not in ('SUPER_ADMIN','ADMIN','HR','MANAGER') then
    raise exception 'ลบได้เฉพาะไฟล์แนบของตนเอง' using errcode='42501';
  end if;
  update public.njhr_ot_attachments set deleted_at = now()
   where njhr_ot_attachments.id = a.id;
  perform public.njhr_audit_write(p_token, 'OT_ATTACH_DELETE', 'ot', 'njhr_ot_attachments',
                                  a.id::text, 'ลบไฟล์แนบ ' || a.file_name, to_jsonb(a), null, null);
  return true;
end $$;

-- อ่านไฟล์แนบของคำขอ (เจ้าของ หรือผู้มีสิทธิ์อนุมัติ)
create or replace function public.njhr_ot_attach_list(p_token text, p_ot_id text)
returns table (job_no int, job_code text, file_name text, file_url text,
               file_path text, file_size bigint, content_type text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);
  return query
  select a.job_no, a.job_code, a.file_name, a.file_url, a.file_path,
         a.file_size, a.content_type, a.created_at
    from public.njhr_ot_attachments a
   where a.ot_id = btrim(p_ot_id) and a.deleted_at is null
     and (a.employee_id = c.employee_id
          or c.role in ('SUPER_ADMIN','ADMIN','HR','MANAGER'))
   order by a.job_no, a.created_at;
end $$;


-- ─── 4) สิทธิ์เรียกใช้ ───────────────────────────────────────
grant execute on function public.njhr_ot_attach_add(text,text,int,text,text,text,text,bigint,text) to anon, authenticated;
grant execute on function public.njhr_ot_attach_delete(text,text)   to anon, authenticated;
grant execute on function public.njhr_ot_attach_list(text,text)     to anon, authenticated;


-- ─── 5) VERIFICATION ─────────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'bucket', (select jsonb_build_object('id', id, 'public', public) from storage.buckets where id='ot-attachments'),
  'storage_policies', (select jsonb_agg(policyname order by policyname) from pg_policies
                        where schemaname='storage' and policyname like 'njhr\_ot\_%'),
  'table', (select exists(select 1 from information_schema.tables
                           where table_schema='public' and table_name='njhr_ot_attachments')),
  'rls', (select relrowsecurity from pg_class where oid='public.njhr_ot_attachments'::regclass),
  'indexes', (select jsonb_agg(indexname order by indexname) from pg_indexes
               where schemaname='public' and tablename='njhr_ot_attachments'),
  'functions', (select jsonb_agg(p.proname order by p.proname) from pg_proc p
                  join pg_namespace n on n.oid=p.pronamespace
                 where n.nspname='public' and p.proname like 'njhr\_ot\_attach%'),
  'rows', (select count(*) from public.njhr_ot_attachments)
)) as install_report;


-- ─── 6) ROLLBACK ─────────────────────────────────────────────
-- drop function if exists public.njhr_ot_attach_list(text,text);
-- drop function if exists public.njhr_ot_attach_delete(text,text);
-- drop function if exists public.njhr_ot_attach_add(text,text,int,text,text,text,text,bigint,text);
-- drop table if exists public.njhr_ot_attachments;
-- drop policy if exists njhr_ot_upload on storage.objects;
-- drop policy if exists njhr_ot_read   on storage.objects;
-- delete from storage.buckets where id = 'ot-attachments';   -- ต้องลบไฟล์ใน bucket ก่อน
-- delete from public.njhr_schema_version where version = 'v10.7-ot-attachments';
