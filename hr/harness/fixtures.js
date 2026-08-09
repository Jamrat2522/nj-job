/* Fixture ชุดเดียว ใช้ตอบทั้ง V1 และ V2 — ค่าคงที่ทั้งหมด ไม่มี random ไม่มีเวลาปัจจุบัน */
const EMP = [];
for (let i = 1; i <= 108; i++) {
  const dept = ['ปฏิบัติการ','บัญชี','ทรัพยากรบุคคล','ขนส่ง','คลังสินค้า','จัดซื้อ','ไอที','การตลาด','ธุรการ','ความปลอดภัย'][i % 10];
  EMP.push({
    id: 'emp-' + String(i).padStart(4, '0'),
    emp_code: 'NJ' + String(i).padStart(4, '0'),
    full_name: 'พนักงาน ทดสอบ' + String(i).padStart(3, '0'),
    first_name: 'พนักงาน', last_name: 'ทดสอบ' + String(i).padStart(3, '0'),
    nickname: 'ท' + i, department_name: dept, department_id: 'dept-' + (i % 10),
    position_name: ['เจ้าหน้าที่','หัวหน้างาน','ผู้จัดการ'][i % 3],
    start_date: '2020-01-' + String((i % 28) + 1).padStart(2, '0'),
    emp_type: ['MONTHLY','DAILY'][i % 2],
    employee_category: 'OFFICE',
    status: ['ACTIVE','ACTIVE','ACTIVE','PROBATION','RESIGNED'][i % 5],
    phone: '08' + String(10000000 + i), email: 'emp' + i + '@njl.test',
    total_count: 108
  });
}
const DEPT = [];
for (let i = 0; i < 10; i++) {
  DEPT.push({
    id: 'dept-' + i, code: 'D' + String(i).padStart(2, '0'),
    name: ['ปฏิบัติการ','บัญชี','ทรัพยากรบุคคล','ขนส่ง','คลังสินค้า','จัดซื้อ','ไอที','การตลาด','ธุรการ','ความปลอดภัย'][i],
    active_count: 8 + i, total_count: 10 + i, approver_count: 2
  });
}
const USERS = [];
for (let i = 1; i <= 111; i++) {
  USERS.push({
    id: 'user-' + String(i).padStart(4, '0'), username: 'user' + i,
    role: ['EMPLOYEE','EMPLOYEE','EMPLOYEE','MANAGER','HR','ACCOUNT','ADMIN','SUPER_ADMIN'][i % 8],
    employee_id: i <= 108 ? 'emp-' + String(i).padStart(4, '0') : null,
    emp_code: i <= 108 ? 'NJ' + String(i).padStart(4, '0') : null,
    full_name: i <= 108 ? 'พนักงาน ทดสอบ' + String(i).padStart(3, '0') : 'บัญชีระบบ ' + i,
    department_name: i <= 108 ? DEPT[i % 10].name : '',
    is_active: true, status: 'ACTIVE', created_at: '2024-01-01T00:00:00Z', total_count: 111
  });
}
const SESSION_USER = {
  user_id: 'user-0001', username: 'admin', role: 'SUPER_ADMIN',
  employee_id: 'emp-0001', emp_code: 'NJ0001', emp_name: 'พนักงาน ทดสอบ001',
  department_name: 'บัญชี', can_salary: true, session_token: 'MOCK-TOKEN-FIXED'
};
const R = {
  njhr_healthcheck: () => ({ ok: true, project_ready: true, version: 'mock' }),
  njhr_login: () => SESSION_USER,
  njhr_session_check: () => SESSION_USER,
  njhr_logout: () => ({ ok: true }),
  njhr_emp_list: (b) => {
    let rows = EMP.slice();
    if (b.p_status) rows = rows.filter(r => r.status === b.p_status);
    if (b.p_dept) rows = rows.filter(r => r.department_name === b.p_dept);
    if (b.p_q) { const q = String(b.p_q).toLowerCase();
      rows = rows.filter(r => (r.emp_code + r.full_name + r.position_name).toLowerCase().includes(q)); }
    const total = rows.length;
    const off = Number(b.p_offset || 0), lim = Number(b.p_limit || 20);
    return rows.slice(off, off + lim).map(r => Object.assign({}, r, { total_count: total }));
  },
  njhr_emp_get: (b) => ({ data: EMP.find(e => e.id === b.p_id) || EMP[0] }),
  njhr_emp_departments: () => DEPT.map(d => ({ id: d.id, name: d.name, emp_count: d.total_count })),
  njhr_dept_list: () => DEPT,
  njhr_dept_employees: () => EMP.slice(0, 10),
  njhr_dept_health: () => ({ ok: true, unassigned: 0 }),
  njhr_member_list: (b) => {
    const rows = [
      { user_id:null, username:null, role:null, employee_id:null, emp_code:'0171',
        emp_name:'สมชาย ใจดี', emp_department:'บัญชี', reg_status:'WAITING_REGISTER',
        request_id:null, is_active:false, created_at:null },
      { user_id:null, username:null, role:null, employee_id:null, emp_code:'0172',
        emp_name:'สมหญิง มีสุข', emp_department:'ขนส่ง', reg_status:'WAITING_LINK',
        request_id:'req-0001', is_active:false, created_at:null,
        requested_at:'2026-08-07T10:00:00Z' },
      { user_id:'u-1', username:'jamrat', role:'USER', employee_id:'emp-0003',
        emp_code:'0173', emp_name:'จำรัส ผาเทพ', emp_department:'ไอที',
        reg_status:'LINKED', request_id:null, is_active:true, created_at:'2026-06-02T00:00:00Z' },
      { user_id:'u-2', username:'orphan1', role:'USER', employee_id:null, emp_code:null,
        emp_name:null, emp_department:null, reg_status:'ORPHAN_ACCOUNT', request_id:null,
        is_active:true, created_at:'2026-06-02T00:00:00Z' }
    ];
    let out = rows;
    if (b.p_status === 'REG_WAITING') out = rows.filter(r => r.reg_status === 'WAITING_REGISTER');
    if (b.p_status === 'REG_PENDING') out = rows.filter(r => r.reg_status === 'WAITING_LINK');
    if (b.p_status === 'REG_LINKED')  out = rows.filter(r => r.reg_status === 'LINKED');
    if (b.p_status === 'REG_ORPHAN')  out = rows.filter(r => r.reg_status === 'ORPHAN_ACCOUNT');
    return out.map(r => Object.assign({}, r, { total_count: out.length }));
  },
  njhr_activation_list: () => ([{
    id:'req-0001', emp_code:'0172', emp_name:'สมหญิง มีสุข',
    department_name:'ขนส่ง', position_name:'เจ้าหน้าที่',
    old_first_name:'สมหญิง', new_first_name:'สมหญิง',
    old_last_name:'มีสุข',   new_last_name:'มีสุข',
    old_first_name_en:null,  new_first_name_en:'SOMYING',
    old_last_name_en:null,   new_last_name_en:'MEESUK',
    old_nickname:null,       new_nickname:'หญิง',
    old_email:null,          new_email:'new172@x.co',
    last_name_en_was_empty:true, status:'PENDING',
    requested_at:'2026-08-07T10:00:00Z', decided_at:null, reject_reason:null
  }]),
  njhr_activation_link: () => ({ ok:true, message:'เชื่อมบัญชีเรียบร้อยแล้ว', user_id:'u-9' }),
  njhr_list_users: (b) => {
    let rows = USERS.slice();
    if (b.p_role) rows = rows.filter(r => r.role === b.p_role);
    if (b.p_status === 'UNLINKED') rows = rows.filter(r => !r.employee_id);
    if (b.p_status === 'LINKED') rows = rows.filter(r => !!r.employee_id);
    return rows.map(r => Object.assign({}, r, { total_count: rows.length }));
  },
  njhr_leave_queue: () => [{ total_count: 4 }],
  njhr_notify_unread: () => ({ unread: 2 }),
  njhr_leave_types: () => [
    { code: 'SICK', name: 'ลาป่วย' }, { code: 'PERSONAL', name: 'ลากิจ' }, { code: 'VACATION', name: 'ลาพักร้อน' }],
  njhr_leave_balances: () => [
    { leave_type: 'SICK', quota: 30, used: 3, remain: 27 },
    { leave_type: 'PERSONAL', quota: 6, used: 1, remain: 5 },
    { leave_type: 'VACATION', quota: 6, used: 0, remain: 6 }],
  njhr_leave_list: () => [],
  njhr_ot_list: () => [],
  njhr_event_list: () => [],
  njhr_ann_feed: () => [],
  njhr_notify_list: () => [],
  njhr_att_today: () => ({ checkin: null, checkout: null }),
  njhr_holiday_list: () => [],
  njhr_shift_list: () => [],
  njhr_audit_list: () => [],
  njhr_pay_items: () => [],
  njhr_slip_list: () => [],
  njhr_sso_list: () => [],
  njhr_wf_list: () => [
    { workflow_id: 'wf-1', name: 'ACCOUNT', request_type: 'BOTH', active: true,  step_count: 1, approver_count: 2, scope_type: 'DEPT' },
    { workflow_id: 'wf-2', name: 'CS EXPORT', request_type: 'BOTH', active: true,  step_count: 0, approver_count: 0, scope_type: 'DEPT' },
    { workflow_id: 'wf-3', name: 'CS IMPORT', request_type: 'LEAVE', active: true,  step_count: 2, approver_count: 0, scope_type: 'DEPT' },
    { workflow_id: 'wf-4', name: 'SHIPPING', request_type: 'LEAVE', active: false, step_count: 3, approver_count: 4, scope_type: 'DEPT' }
  ],
  njhr_gf_list: () => [],
  njhr_doc_center_list: () => []
};
const WRITE = new Set(require('fs').readFileSync(__dirname + '/rpc_write.txt', 'utf8').split('\n').filter(Boolean));
function respond(fn, body) {
  if (R[fn]) return R[fn](body || {});
  if (WRITE.has(fn)) return { __mock: 'WRITE_BLOCKED', fn };   // ไม่จำลองการเขียน
  return [];                                                   // read ที่ยังไม่มี fixture = ว่าง
}
module.exports = { respond, EMP, DEPT, USERS };
