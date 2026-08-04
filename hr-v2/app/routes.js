/* HR V2 — app/routes.js
   ตาราง route เดียวของระบบ — role matrix คัดลอกจาก ROUTES ของ V1 ทุกเส้นทาง (ไม่เปลี่ยนสิทธิ์)
   group = หมวดเมนูตาม Sidebar V1: บุคลากร / คำขอ / เงินเดือน / รายงาน / ระบบ */
export const ROLE_TH = {
  SUPER_ADMIN: 'ผู้ดูแลระบบสูงสุด', ADMIN: 'ผู้ดูแลระบบ', HR: 'ฝ่ายบุคคล',
  ACCOUNT: 'ฝ่ายบัญชี', MANAGER: 'หัวหน้างาน', EMPLOYEE: 'พนักงาน'
};
export const ALL = ['SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNT', 'MANAGER', 'EMPLOYEE'];
const SAH  = ['SUPER_ADMIN', 'ADMIN', 'HR'];
const SAHM = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'];
const SAA  = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNT'];

export const ROUTES = {
  '#/login':      { title: 'เข้าสู่ระบบ', module: 'login/login.js', public: true },
  '#/no-access':  { title: 'ยังไม่เปิดใช้งาน', module: 'login/no-access.js', public: true },

  '#/dashboard':  { title: 'Dashboard', module: 'dashboard/dashboard.js', roles: ALL },

  '#/employees':  { title: 'พนักงาน', module: 'employees/employees.js', roles: SAHM, group: 'บุคลากร' },
  '#/hr-docs':    { title: 'เอกสาร HR', module: 'hrdocs/hrdocs.js', roles: ALL, group: 'บุคลากร' },
  '#/attendance': { title: 'ลงเวลา', module: 'attendance/attendance.js', roles: ALL, group: 'บุคลากร' },

  '#/leave':      { title: 'ลางาน', module: 'leave/leave.js', roles: ALL, group: 'คำขอ' },
  '#/ot':         { title: 'OT', module: 'ot/ot.js', roles: ALL, group: 'คำขอ' },
  '#/approvals':  { title: 'อนุมัติรายการ', module: 'approvals/approvals.js', roles: SAHM, group: 'คำขอ' },

  '#/payroll':    { title: 'เงินเดือน (รายการรายเดือน)', module: 'payroll/entries.js', roles: SAA, group: 'เงินเดือน' },
  '#/pay-items':  { title: 'รายการเงินเดือน (Master)', module: 'payroll/items.js', roles: SAA, group: 'เงินเดือน' },
  '#/epayslip':   { title: 'สลิปเงินเดือน (E-PAYSLIP)', module: 'payslip/payslip.js', roles: ALL, group: 'เงินเดือน' },

  '#/reports':    { title: 'รายงาน', module: 'reports/reports.js',
                    roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNT', 'MANAGER'], group: 'รายงาน' },
  '#/calendar':   { title: 'ปฏิทินองค์กร', module: 'calendar/calendar.js', roles: ALL, group: 'รายงาน' },

  '#/users':      { title: 'จัดการสมาชิก', module: 'users/users.js', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'ระบบ' },
  '#/departments':{ title: 'จัดการแผนก', module: 'departments/departments.js', roles: SAH, group: 'ระบบ' },
  '#/shifts':     { title: 'ตั้งค่ากะทำงาน', module: 'shifts/shifts.js', roles: SAH, group: 'ระบบ' },
  '#/geofence':   { title: 'พื้นที่ลงเวลา', module: 'geofence/geofence.js', roles: ['SUPER_ADMIN'], group: 'ระบบ' },
  '#/settings':   { title: 'ตั้งค่าระบบ', module: 'settings/settings.js', roles: SAH, group: 'ระบบ' },
  '#/workflow':   { title: 'ลำดับการอนุมัติ', module: 'workflow/workflow.js', roles: SAH, group: 'ระบบ' },
  '#/audit':      { title: 'ประวัติการใช้งาน', module: 'audit/audit.js', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'ระบบ' },
  '#/system':     { title: 'สถานะระบบและเวอร์ชัน', module: 'home/system.js', roles: ['SUPER_ADMIN'], group: 'ระบบ' },

  '#/notifications': { title: 'การแจ้งเตือน', module: 'notify/notify.js', roles: ALL },
  '#/profile':    { title: 'โปรไฟล์', module: 'profile/profile.js', roles: ALL },
  '#/home':       { title: 'หน้าหลัก', module: 'dashboard/dashboard.js', roles: ALL }
};
