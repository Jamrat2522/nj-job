-- ⛔ ห้ามรันไฟล์นี้: เขียนโดยสมมติว่าโปรเจกต์ว่าง แต่ของจริงมีตารางอยู่แล้ว (employees.id = uuid)
-- ดู 00_READ_FIRST.md → รัน 00_inspect.sql ก่อน แล้วผมจะเขียนใหม่ให้ตรงของจริง
-- ============================================================
-- NJ HR — Phase 2 Schema (ระบบลางาน + ตารางที่เกี่ยวข้อง)
-- สร้างจากชื่อฟิลด์จริงที่ดึงจาก njhr_db_v3 แบบ 1:1 (ไม่เปลี่ยนความหมายข้อมูลเดิม)
-- ❗ ยังไม่ถูกรันกับโปรเจกต์จริง — ต้องรันด้วยตัวเองใน Supabase SQL Editor
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists departments (
  id text primary key, name text not null, active boolean not null default true
);

create table if not exists shifts (
  id text primary key, name text not null, start_time text not null, end_time text not null,
  break_mins int not null default 60, overnight boolean not null default false,
  active boolean not null default true, updated_at timestamptz, updated_by text
);

create table if not exists employees (
  id text primary key, code text unique not null, title text, first_name text not null, last_name text not null,
  nickname text, gender text, dept_id text references departments(id), position text, manager_id text references employees(id),
  hire_date date, status text not null default 'ACTIVE', emp_type text, phone text, email text,
  shift text, shift_id text references shifts(id), base_salary numeric(12,2) default 0,
  allowance numeric(12,2) default 0, bank text, account text
);

create table if not exists app_users (               -- เดิม: db.users (auth ของแอป)
  id text primary key, auth_uid uuid unique,          -- ผูกกับ auth.users เมื่อย้ายไป Supabase Auth
  username text unique not null, role text not null, emp_id text references employees(id),
  active boolean not null default true, last_login timestamptz
);

create table if not exists leave_types (
  id text primary key, name text not null, quota numeric(6,2) not null default 0,
  need_doc boolean not null default false, active boolean not null default true, color text
);

create table if not exists leave_balances (
  emp_id text references employees(id), type_id text references leave_types(id),
  year int not null, quota numeric(6,2) not null default 0, used numeric(6,2) not null default 0,
  primary key (emp_id, type_id, year)
);

create table if not exists leaves (
  id text primary key, emp_id text not null references employees(id), type_id text not null references leave_types(id),
  mode text not null default 'FULL',                  -- FULL / HALF / HOURLY (ค่าเดิมของระบบ)
  start_date date not null, end_date date not null,
  days numeric(6,2) default 0, hours numeric(6,2) default 0,
  reason text, file text, delegate text,
  status text not null default 'PENDING',             -- PENDING/APPROVED/REJECTED/CANCELLED/COMPLETED/NEED_MORE_INFO
  created_at timestamptz not null default now(),
  idempotency_key text unique                          -- กันกดส่งซ้ำ/Offline queue ส่งซ้ำ
);
create index if not exists leaves_emp_idx     on leaves(emp_id, start_date desc);
create index if not exists leaves_status_idx  on leaves(status, created_at desc);
create index if not exists leaves_range_idx   on leaves(start_date, end_date);

create table if not exists leave_timeline (            -- เดิม: leaves[].timeline (array)
  id bigserial primary key, leave_id text not null references leaves(id) on delete cascade,
  at timestamptz not null default now(), by_name text, action text not null, note text
);
create index if not exists leave_timeline_idx on leave_timeline(leave_id, at);

create table if not exists leave_files (               -- ไฟล์แนบ: เก็บ path เท่านั้น (ไฟล์อยู่ Storage)
  id bigserial primary key, leave_id text not null references leaves(id) on delete cascade,
  storage_path text not null, file_name text not null, mime text, size_bytes int,
  uploaded_by text, uploaded_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key, user_id text not null references app_users(id),
  title text, body text, link text, read boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists notif_user_idx on notifications(user_id, read, at desc);

create table if not exists audit_log (
  id bigserial primary key, at timestamptz not null default now(),
  by_name text, action text not null, detail text,
  before_json jsonb, after_json jsonb                  -- เก็บค่าก่อน/หลังตามสเปก
);
create index if not exists audit_at_idx on audit_log(at desc);

create table if not exists holidays (date date primary key, name text not null);
create table if not exists app_settings (key text primary key, value jsonb not null,
  updated_at timestamptz default now(), updated_by text);
