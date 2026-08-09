-- ============================================================
-- NJ HR V.10 — 95_check_install.sql   [อ่านอย่างเดียว 100%]
--
-- ตรวจว่าไฟล์ SQL ไหนติดตั้งแล้ว ไหนยังขาด และ RPC ที่หน้าเว็บเรียกจริงมีครบหรือไม่
-- รันไฟล์เดียว ส่งผลกลับมา แล้วจะรู้ทันทีว่าต้องรันอะไรต่อ
--
-- ⚠ ไม่มีคำสั่ง create / alter / insert / update / delete / drop แม้แต่คำเดียว
-- ⚠ แนะนำให้เลือก "No limit" ใน SQL Editor ก่อนรัน
-- ============================================================

with expect(file_no, version, note) as (values
  ('76', 'v13.0-shift-rpc',            'ตั้งค่ากะทำงาน'),
  ('77', 'v13.1-announcements',        'ประกาศบริษัท'),
  ('78', 'v13.2-system-settings',      'ตั้งค่าระบบ'),
  ('79', 'v13.3-att-corrections',      'คำขอแก้ไขเวลา'),
  ('80', 'v13.4-dashboard',            'Dashboard'),
  ('84', 'v13.5-pay-entry-recurring',  'รายการเงินเดือน ครั้งเดียว/ประจำ'),
  ('85', 'v13.6-pay-entry-bulk',       'ลบ/ปิดหลายรายการ'),
  ('86', 'v13.7-wf-multi-type',        'Workflow ลา+OT ชุดเดียว'),
  ('87', 'v13.8-wht50',                '50 ทวิ'),
  ('88', 'v13.9-wf-scope-employee',    'Workflow ขอบเขตพนักงาน'),
  ('90', 'v14.0-wf-route',             'เส้นทางอนุมัติตาม Priority'),
  ('92', 'v14.1-face-attendance',      'ลงเวลาด้วยใบหน้า'),
  ('93', 'v14.2-mobile-content',       'ประกาศ/ปฏิทิน/Push มือถือ'),
  ('94', 'v14.3-face-storage',         'รูป Snapshot ใบหน้า')
),
-- RPC ที่หน้าเว็บเรียกจริง (ถ้าขาด = หน้าจอนั้นพังทันที)
need(feature, fname, file_no) as (values
  ('ลงเวลาด้วยใบหน้า',      'njhr_att_punch_face',      '92'),
  ('ลงเวลาด้วยใบหน้า',      'njhr_face_enroll',         '92'),
  ('ลงเวลาด้วยใบหน้า',      'njhr_face_status',         '92'),
  ('ลงเวลาด้วยใบหน้า',      'njhr_face_delete',         '92'),
  ('รูป Snapshot',          'njhr_face_upload_path',    '94'),
  ('รูป Snapshot',          'njhr_face_snapshot_access','94'),
  ('รายการเงินเดือน',       'njhr_pay_entries',         '84'),
  ('รายการเงินเดือน',       'njhr_pay_entry_save',      '84'),
  ('รายการเงินเดือน',       'njhr_pay_entry_copy_preview','84'),
  ('รายการเงินเดือน',       'njhr_pay_entry_copy_apply','84'),
  ('รายการเงินเดือน',       'njhr_pay_entry_history',   '84'),
  ('รายการเงินเดือน',       'njhr_pay_entry_bulk',      '85'),
  ('ตั้งค่ากะทำงาน',        'njhr_shift_list',          '76'),
  ('ตั้งค่ากะทำงาน',        'njhr_shift_assign',        '76'),
  ('ตั้งค่ากะทำงาน',        'njhr_shift_unassigned_employees','76'),
  ('Workflow',              'njhr_wf_save',             '88'),
  ('Workflow',              'njhr_wf_emp_pool',         '88'),
  ('Workflow',              'njhr_wf_route',            '90'),
  ('ประกาศบริษัท',          'njhr_announcement_list',   '77'),
  ('ประกาศ/ปฏิทินมือถือ',   'njhr_ann_feed',            '93'),
  ('ประกาศ/ปฏิทินมือถือ',   'njhr_event_list',          '93'),
  ('ประกาศ/ปฏิทินมือถือ',   'njhr_notify_delete',       '93'),
  ('50 ทวิ',                'njhr_wht50_employees',     '87'),
  ('หน้าคำขอมือถือ',        'njhr_leave_balances',      'เดิม'),
  ('ประวัติลา/OT มือถือ',   'njhr_leave_list',          'เดิม'),
  ('ประวัติลา/OT มือถือ',   'njhr_ot_list',             'เดิม'),
  ('คำขอลงเวลาพิเศษ',       'njhr_att_correction_submit','79')
),
have as (select version from public.njhr_schema_version),
fn as (select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public')
select jsonb_pretty(jsonb_build_object(

  'สรุป', (select jsonb_build_object(
      'ติดตั้งแล้ว', count(*) filter (where h.version is not null),
      'ยังไม่ได้รัน', count(*) filter (where h.version is null),
      'ทั้งหมด', count(*))
     from expect e left join have h on h.version = e.version),

  'ยังไม่ได้รัน', coalesce((
    select jsonb_agg(jsonb_build_object('ไฟล์', e.file_no, 'เวอร์ชัน', e.version, 'คือ', e.note)
                     order by e.file_no)
      from expect e left join have h on h.version = e.version
     where h.version is null), '[]'::jsonb),

  'ติดตั้งแล้ว', coalesce((
    select jsonb_agg(jsonb_build_object('ไฟล์', e.file_no, 'คือ', e.note) order by e.file_no)
      from expect e join have h on h.version = e.version), '[]'::jsonb),

  'RPC_ที่ขาด', coalesce((
    select jsonb_agg(jsonb_build_object('หน้าจอ', n.feature, 'RPC', n.fname, 'อยู่ในไฟล์', n.file_no)
                     order by n.file_no, n.fname)
      from need n where not exists (select 1 from fn where fn.proname = n.fname)), '[]'::jsonb),

  'หน้าจอที่พร้อมใช้งาน', coalesce((
    select jsonb_agg(distinct g.feature order by g.feature) from (
      select n.feature from need n
       group by n.feature
      having count(*) = count(*) filter (
             where exists (select 1 from fn where fn.proname = n.fname))) g), '[]'::jsonb),

  'ตารางสำคัญ', (select jsonb_object_agg(t, to_regclass('public.'||t) is not null)
    from unnest(array['njhr_emp_faces','njhr_face_attempts','njhr_pay_entries',
                      'company_announcements','njhr_ann_reads','njhr_events',
                      'njhr_push_subs','njhr_wht50','attendance_corrections',
                      'njhr_approval_workflow_emps']) t),

  'Storage_bucket', coalesce((
    select jsonb_object_agg(b.id, b.public)
      from storage.buckets b where b.id in ('njhr-face','njhr-emp-files')), '{}'::jsonb),

  'เวอร์ชันทั้งหมดในระบบ', (select jsonb_agg(version order by version) from have)

)) as install_check;
