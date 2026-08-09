-- ⛔ ห้ามรันไฟล์นี้: อ้าง app_users.auth_uid (ของจริงคือ auth_id) และสมมติว่าใช้ Supabase Auth
-- ============================================================
-- RLS ตาม Role จริงของระบบ: SUPER_ADMIN / ADMIN / HR / ACCOUNT / MANAGER / EMPLOYEE
-- (ตรงกับ ROUTES[].roles เดิม — ไม่เพิ่ม/ลดสิทธิ์ของใคร)
-- ❗ ยังไม่ถูกรันจริง
-- ============================================================
create or replace function me() returns app_users language sql stable as
$$ select * from app_users where auth_uid = auth.uid() and active limit 1 $$;

create or replace function my_role() returns text language sql stable as
$$ select role from app_users where auth_uid = auth.uid() and active limit 1 $$;

create or replace function my_emp() returns text language sql stable as
$$ select emp_id from app_users where auth_uid = auth.uid() and active limit 1 $$;

create or replace function can_approve() returns boolean language sql stable as
$$ select coalesce(my_role() in ('SUPER_ADMIN','ADMIN','HR','MANAGER'), false) $$;

alter table leaves          enable row level security;
alter table leave_timeline  enable row level security;
alter table leave_files     enable row level security;
alter table leave_balances  enable row level security;
alter table notifications   enable row level security;
alter table audit_log       enable row level security;

-- ใบลา: พนักงานเห็น/สร้างของตัวเอง · ผู้อนุมัติเห็นทั้งหมดตามสิทธิ์เดิม
create policy leaves_select on leaves for select
  using (emp_id = my_emp() or can_approve());
create policy leaves_insert on leaves for insert
  with check (emp_id = my_emp());                       -- ห้ามสร้างแทนคนอื่น
create policy leaves_update_own on leaves for update    -- ยกเลิกคำขอของตัวเองเท่านั้น
  using (emp_id = my_emp() and status in ('PENDING','NEED_MORE_INFO'))
  with check (emp_id = my_emp() and status = 'CANCELLED');
-- การอนุมัติทำผ่าน RPC เท่านั้น (ดู 03_functions.sql) ไม่เปิด update ตรงให้ผู้อนุมัติ

create policy tl_select on leave_timeline for select
  using (exists (select 1 from leaves l where l.id = leave_id and (l.emp_id = my_emp() or can_approve())));
create policy files_select on leave_files for select
  using (exists (select 1 from leaves l where l.id = leave_id and (l.emp_id = my_emp() or can_approve())));
create policy files_insert on leave_files for insert
  with check (exists (select 1 from leaves l where l.id = leave_id and l.emp_id = my_emp()));

create policy bal_select on leave_balances for select using (emp_id = my_emp() or can_approve());
create policy notif_own  on notifications  for select using (user_id = (select id from me()));
create policy notif_upd  on notifications  for update using (user_id = (select id from me()));
create policy audit_read on audit_log      for select using (my_role() in ('SUPER_ADMIN','ADMIN'));

-- Storage: private bucket + เปิดผ่าน Signed URL เท่านั้น
insert into storage.buckets (id, name, public) values ('leave-docs','leave-docs', false)
  on conflict (id) do nothing;
create policy leavedoc_read on storage.objects for select
  using (bucket_id = 'leave-docs' and (
    can_approve() or (storage.foldername(name))[1] = my_emp()));   -- โฟลเดอร์ = emp_id
create policy leavedoc_write on storage.objects for insert
  with check (bucket_id = 'leave-docs' and (storage.foldername(name))[1] = my_emp());
