/* HR V2 — test/integration.mjs
   Integration Test ครบทุก Module บน Mock RPC (signature ตรงจริง)
   ⚠ ผลนี้เป็นการทดสอบกับ Mock — ไม่ใช่ Supabase Production */
import assert from 'node:assert';
import { createMockServer } from './mock-server.mjs';
import { makeWorld, boot, tick, outlet } from './harness.mjs';

const results = [];
const T = (name, fn) => results.push({ name, fn });
const called = (srv, fn) => srv.calls.some(c => c.fn === fn);
const lastCall = (srv, fn) => [...srv.calls].reverse().find(c => c.fn === fn);

// ── Shell / Permission ─────────────────────────────────────
T('SHELL-1 SUPER_ADMIN เห็นเมนูครบทุกกลุ่ม (บุคลากร/คำขอ/เงินเดือน/รายงาน/ระบบ)', async () => {
  const srv = createMockServer();
  const { w } = await boot(srv, 'tok-sa');
  const html = w.document.getElementById('v2-side').innerHTML;
  ['บุคลากร', 'คำขอ', 'เงินเดือน', 'รายงาน', 'ระบบ'].forEach(g => assert.ok(html.includes(g), 'ไม่พบกลุ่ม ' + g));
  assert.ok(html.includes('#/geofence'), 'SUPER_ADMIN ต้องเห็นพื้นที่ลงเวลา');
});

T('SHELL-2 EMPLOYEE ไม่เห็นเมนูกลุ่มระบบ/เงินเดือนหลังบ้าน และเข้า #/users ตรงถูกปฏิเสธ', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  const html = w.document.getElementById('v2-side').innerHTML;
  assert.ok(!html.includes('#/users'), 'EMPLOYEE ห้ามเห็นเมนูจัดการสมาชิก');
  assert.ok(!html.includes('#/payroll'), 'EMPLOYEE ห้ามเห็นเงินเดือนหลังบ้าน');
  assert.ok(html.includes('#/epayslip'), 'EMPLOYEE เห็นสลิปตัวเองได้');
  await ctx.router.go('#/users'); await tick();
  assert.ok(outlet(w).innerHTML.includes('ไม่มีสิทธิ์'), 'route guard ต้องปฏิเสธ');
  assert.ok(!called(srv, 'njhr_list_users'), 'ห้ามยิง RPC ของหน้าที่ไม่มีสิทธิ์');
});

// ── Dashboard ──────────────────────────────────────────────
T('DASH-1 Dashboard แสดง KPI จาก njhr_dashboard_summary (ไม่ใช่ตัวเลข local)', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/dashboard'); await tick(80);
  assert.ok(called(srv, 'njhr_dashboard_summary'));
  const html = outlet(w).innerHTML;
  assert.ok(html.includes('พนักงานทั้งหมด') && html.includes('>3<'), 'ตัวเลขจากเซิร์ฟเวอร์');
});

// ── Employees ──────────────────────────────────────────────
T('EMP-1 รายชื่อพนักงานแสดงจาก RPC + เพิ่มพนักงานส่ง p_data (รหัสคง string ศูนย์นำหน้า)', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/employees'); await tick(80);
  assert.ok(outlet(w).innerHTML.includes('สมชาย ใจดี'));
  w.document.getElementById('emp-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#f-code').value = '0099';
  root.querySelector('#f-first').value = 'ทดสอบ';
  root.querySelector('#f-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_emp_save');
  assert.ok(c, 'ต้องเรียก njhr_emp_save');
  assert.strictEqual(c.body.p_data.emp_code, '0099', 'ศูนย์นำหน้าห้ามหาย: ' + JSON.stringify(c.body.p_data.emp_code));
});

T('EMP-2 ฟอร์มว่าง → ไม่ยิง RPC และแสดงข้อความจำเป็นต้องกรอก', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/employees'); await tick(80);
  w.document.getElementById('emp-add').click(); await tick();
  const before = srv.calls.filter(c => c.fn === 'njhr_emp_save').length;
  w.document.getElementById('v2-modal-root').querySelector('#f-save').click(); await tick(60);
  assert.strictEqual(srv.calls.filter(c => c.fn === 'njhr_emp_save').length, before, 'ห้ามยิง RPC เมื่อ validate ไม่ผ่าน');
  assert.ok(w.document.getElementById('v2-modal-root').innerHTML.includes('จำเป็นต้องกรอก'));
});

// ── Departments ────────────────────────────────────────────
T('DEPT-1 เพิ่มแผนก + ลบแผนกที่มีพนักงาน → RPC ตอบ error และแสดงต่อผู้ใช้', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/departments'); await tick(80);
  w.document.getElementById('dp-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#dpf-code').value = 'NEW';
  root.querySelector('#dpf-name').value = 'แผนกใหม่';
  root.querySelector('#dpf-save').click(); await tick(60);
  assert.ok(called(srv, 'njhr_dept_save'));
  // ลบ d1 (มีพนักงาน 1)
  const btn = outlet(w).querySelector('button[data-act="del"][data-id="d1"]');
  btn.click(); await tick();
  root.querySelector('#v2m-yes').click(); await tick(60);
  const del = lastCall(srv, 'njhr_dept_delete');
  assert.ok(del && del.body.p_confirm === true);
  assert.ok(w.document.getElementById('v2-toasts').textContent.includes('ยังมีพนักงาน'), 'error จาก RPC ต้องถึงผู้ใช้');
});

// ── Attendance ─────────────────────────────────────────────
T('ATT-1 ลงเวลาเข้า: ส่ง p_at=null + พิกัด GPS · ขอแก้ไขเวลา payload เป็นเวลาไทย +07:00', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  Object.defineProperty(w.navigator, 'geolocation', { value: {
    getCurrentPosition: (ok) => ok({ coords: { latitude: 13.361, longitude: 100.984, accuracy: 8 } })
  }, configurable: true });
  await ctx.router.go('#/attendance'); await tick(80);
  w.document.getElementById('att-in').click(); await tick(60);
  const p = lastCall(srv, 'njhr_att_punch');
  assert.ok(p, 'ต้องเรียก njhr_att_punch');
  assert.strictEqual(p.body.p_at, null, 'p_at ต้อง null (เวลาเซิร์ฟเวอร์)');
  assert.strictEqual(p.body.p_lat, 13.361);
  // คำขอแก้ไขเวลา
  w.document.getElementById('attc-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#c-date').value = '2026-08-01';
  root.querySelector('#c-in').value = '08:00';
  root.querySelector('#c-reason').value = 'ลืมสแกน';
  root.querySelector('#c-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_att_correction_submit');
  assert.strictEqual(c.body.p_requested_check_in, '2026-08-01T08:00:00+07:00', 'timezone ไทยชัดเจน');
});

// ── Leave ──────────────────────────────────────────────────
T('LEAVE-1 ยื่นลาเต็มวันสำเร็จ → RPC payload ตรง + รายการรีเฟรช', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  await ctx.router.go('#/leave'); await tick(80);
  assert.ok(outlet(w).innerHTML.includes('คงเหลือ'), 'สิทธิ์ลาแสดง');
  w.document.getElementById('lv-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#l-type').value = 'PERSONAL';
  root.querySelector('#l-start').value = '2026-08-10';
  root.querySelector('#l-end').value = '2026-08-10';
  root.querySelector('#l-reason').value = 'ธุระครอบครัว';
  root.querySelector('#l-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_leave_submit');
  assert.strictEqual(c.body.p_leave_type, 'PERSONAL');
  assert.strictEqual(c.body.p_mode, 'FULL');
  assert.strictEqual(c.body.p_start_time, null, 'FULL ไม่ส่งเวลา');
});

T('LEAVE-2 รายชั่วโมงไม่กรอกเวลา → บล็อกฝั่งจอ ไม่ยิง RPC · วันสิ้นสุดก่อนวันเริ่ม → บล็อก', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  await ctx.router.go('#/leave'); await tick(80);
  w.document.getElementById('lv-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#l-mode').value = 'HOURLY';
  root.querySelector('#l-start').value = '2026-08-10';
  root.querySelector('#l-end').value = '2026-08-10';
  root.querySelector('#l-reason').value = 'x';
  root.querySelector('#l-save').click(); await tick(60);
  assert.ok(!called(srv, 'njhr_leave_submit'), 'HOURLY ไม่มีเวลา ห้ามยิง RPC');
  assert.ok(w.document.getElementById('v2-toasts').textContent.includes('รายชั่วโมง'));
});

T('LEAVE-3 ยกเลิกใบลา PENDING ผ่านหน้ารายละเอียด', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  await ctx.router.go('#/leave'); await tick(80);
  const row = outlet(w).querySelector('#lv-list tr[data-i]');
  row.click(); await tick(60);
  w.document.getElementById('lvd-cancel').click(); await tick();
  w.document.getElementById('v2-modal-root').querySelector('#v2m-yes').click(); await tick(60);
  assert.ok(called(srv, 'njhr_leave_cancel'));
  assert.strictEqual(srv.db.leaves[0].status, 'CANCELLED');
});

// ── OT ─────────────────────────────────────────────────────
T('OT-1 ส่งคำขอ OT 2 งานผ่าน njhr_ot_submit (ปิดเส้นทาง local V1)', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  await ctx.router.go('#/ot'); await tick(80);
  w.document.getElementById('ot-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#o-date').value = '2026-08-05';
  root.querySelector('#o-start').value = '18:00';
  root.querySelector('#o-end').value = '21:00';
  root.querySelector('#j0-job').value = 'JOB-100';
  root.querySelector('#o-addjob').click(); await tick();
  root.querySelector('#j1-job').value = 'JOB-101';
  root.querySelector('#j1-type').value = 'คีย์ใบขน';
  root.querySelector('#o-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_ot_submit');
  assert.strictEqual(c.body.p_jobs.length, 2);
  assert.strictEqual(c.body.p_jobs[1].job_type, 'คีย์ใบขน');
  assert.strictEqual(c.body.p_next_day, false);
});

T('OT-2 เวลาสิ้นสุด ≤ เริ่ม โดยไม่ติ๊กข้ามวัน → บล็อก ไม่ยิง RPC', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-emp');
  await ctx.router.go('#/ot'); await tick(80);
  w.document.getElementById('ot-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#o-date').value = '2026-08-05';
  root.querySelector('#o-start').value = '22:00';
  root.querySelector('#o-end').value = '01:00';
  root.querySelector('#j0-job').value = 'JOB-1';
  root.querySelector('#o-save').click(); await tick(60);
  assert.ok(!called(srv, 'njhr_ot_submit'));
  assert.ok(w.document.getElementById('v2-toasts').textContent.includes('ข้ามวัน'));
});

// ── Approvals ──────────────────────────────────────────────
T('APV-1 ไม่อนุมัติใบลาโดยไม่กรอกเหตุผล → บล็อก · กรอกแล้ว → RPC REJECT + note', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/approvals'); await tick(80);
  outlet(w).querySelector('button[data-id]').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#ap-no').click(); await tick(60);
  assert.ok(!called(srv, 'njhr_leave_decide'), 'ไม่มีเหตุผล ห้ามยิง');
  root.querySelector('#ap-note').value = 'เอกสารไม่ครบ';
  root.querySelector('#ap-no').click(); await tick(60);
  const c = lastCall(srv, 'njhr_leave_decide');
  assert.strictEqual(c.body.p_action, 'REJECT');
  assert.strictEqual(c.body.p_note, 'เอกสารไม่ครบ');
});

T('APV-2 แท็บ OT อนุมัติ → njhr_ot_decide APPROVE · แท็บแก้ไขเวลา → correction_approve', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/approvals'); await tick(80);
  w.document.querySelectorAll('.v2-tabs button')[1].click(); await tick(80);
  outlet(w).querySelector('button[data-id]').click(); await tick();
  w.document.getElementById('v2-modal-root').querySelector('#ap-yes').click(); await tick(60);
  assert.strictEqual(lastCall(srv, 'njhr_ot_decide').body.p_action, 'APPROVE');
  w.document.querySelectorAll('.v2-tabs button')[2].click(); await tick(80);
  outlet(w).querySelector('button[data-id]').click(); await tick();
  w.document.getElementById('v2-modal-root').querySelector('#ap-yes').click(); await tick(60);
  assert.ok(called(srv, 'njhr_att_correction_approve'));
});

// ── Payroll / Payslip ──────────────────────────────────────
T('PAY-1 ACCOUNT เพิ่มรายการเงินเดือน + คัดลอกจากเดือนก่อน (preview→apply)', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-acc');
  await ctx.router.go('#/payroll'); await tick(120);
  assert.ok(called(srv, 'njhr_pay_entry_totals'), 'ยอดรวมจาก RPC');
  w.document.getElementById('pe-add').click(); await tick(80);
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#ef-amount').value = '2000';
  root.querySelector('#ef-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_pay_entry_save');
  assert.strictEqual(c.body.p_amount, 2000);
  // copy
  w.document.getElementById('pe-copy').click(); await tick(60);
  root.querySelector('#v2m-yes').click(); await tick(60);
  assert.ok(called(srv, 'njhr_pay_entry_copy_apply'));
});

T('SLIP-1 เปิดสลิป: periods→list→get แสดงบรรทัดรายการ + ยอดสุทธิ · ADMIN ทำเครื่องหมายส่ง', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/epayslip'); await tick(120);
  outlet(w).querySelector('button[data-id]').click(); await tick(80);
  const html = w.document.getElementById('v2-modal-root').innerHTML;
  assert.ok(html.includes('ประกันสังคม') && html.includes('14,250.00'), 'บรรทัดสลิป+สุทธิจาก RPC');
  w.document.getElementById('psd-sent').click(); await tick(60);
  assert.strictEqual(srv.db.slips[0].slip_status, 'SENT');
});

// ── HR Docs / Users / Shifts / Geofence ────────────────────
T('DOC-1 ศูนย์เอกสารแสดง + HR อนุมัติเอกสาร PENDING ผ่าน doc_respond', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-hr');
  await ctx.router.go('#/hr-docs'); await tick(80);
  outlet(w).querySelector('tr[data-i]').click(); await tick(80);
  w.document.getElementById('hdd-yes').click(); await tick(60);
  const c = lastCall(srv, 'njhr_doc_respond');
  assert.strictEqual(c.body.p_action, 'APPROVE');
  assert.strictEqual(srv.db.docs[0].status, 'APPROVED');
});

T('USER-1 เพิ่มผู้ใช้ใหม่ไม่กรอกรหัสผ่าน → บล็อกฝั่งจอ · กรอกครบ → user_save payload ถูก', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/users'); await tick(80);
  w.document.getElementById('us-add').click(); await tick(80);
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#uf-username').value = 'newuser';
  root.querySelector('#uf-save').click(); await tick(60);
  assert.ok(!called(srv, 'njhr_user_save'), 'ไม่มีรหัสผ่าน ห้ามยิง');
  root.querySelector('#uf-password').value = 'P@ss1234';
  root.querySelector('#uf-role').value = 'HR';
  root.querySelector('#uf-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_user_save');
  assert.strictEqual(c.body.p_role, 'HR');
  assert.strictEqual(c.body.p_is_active, true);
});

T('SHIFT-1 เพิ่มกะใหม่ → shift_save payload นาทีเป็นตัวเลข · GEO-1 SUPER_ADMIN บันทึกพื้นที่', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await ctx.router.go('#/shifts'); await tick(80);
  w.document.getElementById('sh-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#sf-name').value = 'กะดึก';
  root.querySelector('#sf-start').value = '20:00';
  root.querySelector('#sf-end').value = '05:00';
  root.querySelector('#sf-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_shift_save');
  assert.strictEqual(typeof c.body.p_break_minutes, 'number');
  await ctx.router.go('#/geofence'); await tick(80);
  w.document.getElementById('gf-add').click(); await tick();
  root.querySelector('#gf-name').value = 'คลัง FZ';
  root.querySelector('#gf-lat').value = '13.1';
  root.querySelector('#gf-lng').value = '100.9';
  root.querySelector('#gf-save').click(); await tick(60);
  assert.strictEqual(lastCall(srv, 'njhr_gf_save').body.p_radius, 150);
});

// ── Settings / Audit / Notify / Reports / Workflow ─────────
T('SET-1 เพิ่มวันหยุด · แก้ประเภทลา needDoc', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-hr');
  await ctx.router.go('#/settings'); await tick(80);
  w.document.getElementById('hl-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#hl-date').value = '2026-12-31';
  root.querySelector('#hl-name').value = 'วันสิ้นปี';
  root.querySelector('#hl-save').click(); await tick(60);
  assert.strictEqual(lastCall(srv, 'njhr_holiday_save').body.p_date, '2026-12-31');
  w.document.querySelectorAll('.v2-tabs button')[1].click(); await tick(80);
  outlet(w).querySelector('button[data-c="SICK"]').click(); await tick();
  root.querySelector('#lt-save').click(); await tick(60);
  assert.strictEqual(lastCall(srv, 'njhr_leave_type_save').body.p_need_doc, true, 'SICK ต้องคง needDoc');
});

T('AUD-1 Audit list อ่านอย่างเดียว · NOTIF-1 อ่านทั้งหมด → badge หาย', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa');
  await tick(60);
  assert.strictEqual(w.document.getElementById('v2-bell-n').textContent, '1', 'badge เริ่มต้น 1');
  await ctx.router.go('#/audit'); await tick(80);
  assert.ok(outlet(w).innerHTML.includes('LOGIN'));
  await ctx.router.go('#/notifications'); await tick(80);
  w.document.getElementById('nt-all').click(); await tick(80);
  assert.ok(called(srv, 'njhr_notify_read_all'));
  assert.strictEqual(w.document.getElementById('v2-bell-n').hidden, true, 'badge ต้องหาย');
});

T('RPT-1 รายงานลงเวลาแสดง + Export CSV มี BOM/หัวคอลัมน์ · แท็บ OT ใช้ njhr_ot_report', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-hr');
  await ctx.router.go('#/reports'); await tick(100);
  assert.ok(called(srv, 'njhr_att_report'));
  let blobText = '';
  const RealBlob = globalThis.Blob;
  Object.defineProperty(globalThis, 'Blob', { value: class { constructor(parts) { blobText = parts.join(''); } }, configurable: true, writable: true });
  w.HTMLAnchorElement.prototype.click = function () {};
  w.document.getElementById('rp-csv').click(); await tick();
  assert.ok(blobText.startsWith('\uFEFF'), 'CSV ต้องมี UTF-8 BOM');
  assert.ok(blobText.includes('พนักงาน') && blobText.includes('0050'));
  Object.defineProperty(globalThis, 'Blob', { value: RealBlob, configurable: true, writable: true });
  w.document.querySelectorAll('.v2-tabs button')[2].click(); await tick(100);
  assert.ok(called(srv, 'njhr_ot_report'));
});

T('WF-1 เพิ่มขั้นการอนุมัติ LEAVE → wf_step_save p_type=LEAVE', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-hr');
  await ctx.router.go('#/workflow'); await tick(80);
  w.document.getElementById('wf-add').click(); await tick();
  const root = w.document.getElementById('v2-modal-root');
  root.querySelector('#wf-name').value = 'HR ตรวจสอบ';
  root.querySelector('#wf-mode').value = 'HR';
  root.querySelector('#wf-save').click(); await tick(60);
  const c = lastCall(srv, 'njhr_wf_step_save');
  assert.strictEqual(c.body.p_type, 'LEAVE');
  assert.strictEqual(c.body.p_mode, 'HR');
});

// ── Read-Only Mode ครอบคลุมคำสั่งเขียน ─────────────────────
T('RO-1 Read-Only: ยื่นลา/เพิ่มพนักงาน/อนุมัติ ถูกบล็อกหมด — ไม่มี RPC เขียนแม้แต่ครั้งเดียว', async () => {
  const srv = createMockServer({ maintenance: { mode: 'readonly', ends_at: new Date(Date.now() + 600e3).toISOString(), message: 'ปรับปรุงข้อมูล' } });
  const { w, ctx } = await boot(srv, 'tok-sa');
  assert.strictEqual(ctx.readOnly, true);
  await ctx.router.go('#/leave'); await tick(80);
  w.document.getElementById('lv-add').click(); await tick(60);
  await ctx.router.go('#/employees'); await tick(80);
  w.document.getElementById('emp-add').click(); await tick(60);
  await ctx.router.go('#/approvals'); await tick(80);
  const apBtn = outlet(w).querySelector('button[data-id]');
  if (apBtn) { apBtn.click(); await tick(60); }
  const writes = srv.calls.filter(c =>
    /_(save|submit|decide|delete|cancel|approve|reject|punch|apply|assign|link|password|mark_sent|read_all)$/.test(c.fn));
  assert.strictEqual(writes.length, 0, 'พบ RPC เขียนระหว่าง Read-Only: ' + writes.map(x => x.fn).join(','));
  assert.ok(w.document.getElementById('v2-toasts').textContent.includes('อ่านอย่างเดียว'));
});

// ── Preview Write Lock (เงื่อนไขรอบทดสอบ Production Integration) ──
T('PRV-1 Write Lock เปิด: ทุกคำสั่งเขียนถูกล็อก — ไม่มี RPC เขียนหลุดแม้แต่ตัวเดียว', async () => {
  const srv = createMockServer();
  const { w, ctx } = await boot(srv, 'tok-sa', { writeLock: true });
  assert.strictEqual(ctx.isWriteLocked(), true, 'ค่าเริ่มต้นต้องล็อก');
  assert.ok(w.document.getElementById('v2-preview-bar'), 'ต้องมีแถบ PREVIEW');
  await ctx.router.go('#/leave'); await tick(80);
  w.document.getElementById('lv-add').click(); await tick(60);
  await ctx.router.go('#/employees'); await tick(80);
  w.document.getElementById('emp-add').click(); await tick(60);
  await ctx.router.go('#/attendance'); await tick(80);
  w.document.getElementById('att-in').click(); await tick(60);
  await ctx.router.go('#/approvals'); await tick(80);
  const b = outlet(w).querySelector('button[data-id]'); if (b) { b.click(); await tick(60); }
  const writes = srv.calls.filter(c =>
    /_(save|submit|decide|delete|cancel|approve|reject|punch|apply|assign|link|password|mark_sent|read_all)$/.test(c.fn));
  assert.strictEqual(writes.length, 0, 'พบ RPC เขียนขณะ Write Lock: ' + writes.map(x => x.fn).join(','));
  assert.ok(w.document.getElementById('v2-toasts').textContent.includes('Preview'));
});

T('PRV-2 SUPER_ADMIN ปลดล็อกได้เฉพาะแท็บตัวเอง · EMPLOYEE ปลดล็อกไม่ได้', async () => {
  const srv = createMockServer();
  const sa = await boot(srv, 'tok-sa', { writeLock: true });
  assert.strictEqual(sa.ctx.setWriteUnlock(true), true);
  assert.strictEqual(sa.ctx.isWriteLocked(), false, 'SUPER_ADMIN ปลดล็อกได้');
  await sa.ctx.router.go('#/departments'); await tick(80);
  sa.w.document.getElementById('dp-add').click(); await tick();
  const root = sa.w.document.getElementById('v2-modal-root');
  root.querySelector('#dpf-code').value = 'TST';
  root.querySelector('#dpf-name').value = 'ทดสอบ';
  root.querySelector('#dpf-save').click(); await tick(60);
  assert.ok(called(srv, 'njhr_dept_save'), 'หลังปลดล็อกต้องเขียนได้');
  sa.ctx.setWriteUnlock(false);
  assert.strictEqual(sa.ctx.isWriteLocked(), true, 'ล็อกกลับได้');

  const emp = await boot(srv, 'tok-emp', { writeLock: true });
  assert.strictEqual(emp.ctx.setWriteUnlock(true), false, 'EMPLOYEE ห้ามปลดล็อก');
  assert.strictEqual(emp.ctx.isWriteLocked(), true);
});

T('PRV-3 BUILD เป็น v2-preview-1 และ V2 ไม่ลงทะเบียน Service Worker ใด ๆ', async () => {
  const fs = await import('node:fs');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(/NJHR_V2_BUILD\s*=\s*'v2-preview-1'/.test(html), 'BUILD ต้องเป็น v2-preview-1');
  assert.ok(/NJHR_V2_WRITE_LOCK\s*=\s*true/.test(html), 'Write Lock ต้องเปิดค่าเริ่มต้น');
  const files = fs.readdirSync(new URL('../', import.meta.url), { recursive: true });
  assert.ok(!files.some(f => /(^|\/)(sw|service-worker)\.js$/.test(String(f))), 'V2 ต้องไม่มีไฟล์ Service Worker');
  assert.ok(!/serviceWorker\.register/.test(html), 'V2 ต้องไม่ register SW (กันครอบ scope ของ V1)');
});

// ── รัน ─────────────────────────────────────────────────────
/* กลืนเฉพาะ silent error (assertWrite / preview write lock) เหมือนตัวจัดการกลางใน bootstrap */
process.on('unhandledRejection', (e) => { if (!e || !e.silent) throw e; });

let pass = 0, fail = 0;
const failures = [];
const realSetInterval = globalThis.setInterval, realSetTimeout = globalThis.setTimeout;
for (const t of results) {
  const ids = [];
  globalThis.setInterval = (...a) => { const id = realSetInterval(...a); ids.push(['i', id]); return id; };
  globalThis.setTimeout  = (...a) => { const id = realSetTimeout(...a);  ids.push(['t', id]); return id; };
  try { await t.fn(); console.log('PASS  ' + t.name); pass++; }
  catch (e) { console.log('FAIL  ' + t.name + '\n      → ' + e.message); failures.push(t.name); fail++; }
  finally {
    globalThis.setInterval = realSetInterval; globalThis.setTimeout = realSetTimeout;
    ids.forEach(([k, id]) => (k === 'i' ? clearInterval(id) : clearTimeout(id)));
  }
}
console.log('\nสรุป Integration (Mock): ' + pass + ' PASS · ' + fail + ' FAIL จาก ' + results.length + ' เคส');
process.exit(fail ? 1 : 0);
