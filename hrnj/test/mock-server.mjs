/* HR V2 — test/mock-server.mjs
   จำลอง RPC ฝั่งเซิร์ฟเวอร์แบบ in-memory สำหรับ Integration Test
   ชื่อฟังก์ชันและ p_* ตรงกับ signature จริง (rpc_signatures.json + SQL 64/65/79/80)
   ⚠ นี่คือ Mock — ไม่ใช่การทดสอบกับ Supabase Production */
export function createMockServer(opts) {
  opts = opts || {};
  const calls = [];
  const db = {
    version: opts.version || 'v2-preview-1',
    maintenance: opts.maintenance || null,      // { mode, ends_at, message }
    users: {
      'tok-sa':  { user_id: 'u1', username: 'jamrat', role: 'SUPER_ADMIN', employee_id: 'e1', emp_code: '0001', emp_name: 'จำรัส ผาเทพ', session_token: 'tok-sa' },
      'tok-hr':  { user_id: 'u3', username: 'hruser', role: 'HR', employee_id: 'e3', emp_code: '0003', emp_name: 'เอชอาร์ ใจดี', session_token: 'tok-hr' },
      'tok-acc': { user_id: 'u4', username: 'accuser', role: 'ACCOUNT', employee_id: 'e4', emp_code: '0004', emp_name: 'บัญชี รอบคอบ', session_token: 'tok-acc' },
      'tok-emp': { user_id: 'u2', username: 'somchai', role: 'EMPLOYEE', employee_id: 'e2', emp_code: '0050', emp_name: 'สมชาย ใจดี', session_token: 'tok-emp' }
    },
    v2Access: opts.v2Access || { SUPER_ADMIN: true, HR: true, ACCOUNT: true, EMPLOYEE: true },   // flag ต่อ role ใน mock
    employees: [
      { id: 'e1', emp_code: '0001', first_name: 'จำรัส', last_name: 'ผาเทพ', full_name: 'จำรัส ผาเทพ', department: 'IT', position: 'ผู้ดูแลระบบ', status: 'ACTIVE', total_count: 3 },
      { id: 'e2', emp_code: '0050', first_name: 'สมชาย', last_name: 'ใจดี', full_name: 'สมชาย ใจดี', department: 'ชิปปิ้ง', position: 'พนักงาน', status: 'ACTIVE', total_count: 3 },
      { id: 'e3', emp_code: '0003', first_name: 'เอชอาร์', last_name: 'ใจดี', full_name: 'เอชอาร์ ใจดี', department: 'HR', position: 'HR', status: 'PROBATION', total_count: 3 }
    ],
    departments: [
      { id: 'd1', code: 'IT', name: 'ไอที', emp_count: 1 },
      { id: 'd2', code: 'SHP', name: 'ชิปปิ้ง', emp_count: 1 },
      { id: 'd3', code: 'EMPTY', name: 'แผนกว่าง', emp_count: 0 }
    ],
    leaves: [
      { id: 'lv1', leave_id: 'lv1', leave_type: 'SICK', mode: 'FULL', start_date: '2026-08-01', end_date: '2026-08-01', days: 1, reason: 'ป่วย', status: 'PENDING', emp_name: 'สมชาย ใจดี', total_count: 1 }
    ],
    balances: [
      { leave_type: 'SICK', quota: 30, used: 1, remaining: 29, pending: 1 },
      { leave_type: 'PERSONAL', quota: 6, used: 0, remaining: 6, pending: 0 },
      { leave_type: 'VACATION', quota: 6, used: 0, remaining: 6, pending: 0 }
    ],
    ots: [
      { id: 'ot1', ot_date: '2026-08-01', start_time: '18:00', end_time: '20:00', hours: 2, job_count: 1, status: 'PENDING', emp_name: 'สมชาย ใจดี', jobs: [{ no: 1, job: 'JOB-001', job_type: 'ตรวจปล่อย' }], total_count: 1 }
    ],
    corrections: [
      { id: 'c1', work_date: '2026-08-01', requested_check_in: '2026-08-01T08:00:00+07:00', reason: 'ลืมสแกน', status: 'PENDING', emp_name: 'สมชาย ใจดี' }
    ],
    payItems: [
      { code: 'SAL', name_th: 'เงินเดือน', kind: 'INCOME', calc_type: 'MANUAL', active: true, show_in_slip: true, show_in_report: true },
      { code: 'SSO', name_th: 'ประกันสังคม', kind: 'DEDUCT', calc_type: 'PERCENT', percent: 5, active: true }
    ],
    payEntries: [
      { id: 'pe1', employee_id: 'e2', emp_code: '0050', emp_name: 'สมชาย ใจดี', item_code: 'SAL', item_name: 'เงินเดือน', amount: 15000, recurring: true, year: 2026, month: 8 }
    ],
    slips: [
      { payroll_id: 'pr1', emp_code: '0050', emp_name: 'สมชาย ใจดี', net_pay: 14250, slip_status: 'DRAFT',
        period_year: 2026, period_month: 7,
        lines: [{ item_code: 'SAL', name_th: 'เงินเดือน', amount: 15000 }, { item_code: 'SSO', name_th: 'ประกันสังคม', amount: -750 }] }
    ],
    docs: [
      { id: 'doc1', doc_no: 'HR-0001', title: 'หนังสือรับรองการทำงาน', doc_type: 'CERT_EMPLOYMENT', emp_name: 'สมชาย ใจดี', status: 'PENDING', created_at: '2026-08-01', can_respond: true, total_count: 1 }
    ],
    shifts: [
      { id: 's1', shift_name: 'กะปกติ', start_time: '08:30', end_time: '17:30', break_minutes: 60, late_allow_minutes: 5, emp_count: 2, active: true }
    ],
    geofences: [
      { id: 'g1', name: 'สำนักงานใหญ่', lat: 13.361, lng: 100.984, radius: 150, active: true }
    ],
    holidays: [{ id: 'h1', holiday_date: '2026-08-12', name: 'วันแม่แห่งชาติ' }],
    leaveTypes: [
      { code: 'SICK', label_th: 'ลาป่วย', need_doc: true, active: true },
      { code: 'PERSONAL', label_th: 'ลากิจ', need_doc: false, active: true }
    ],
    audits: [{ created_at: '2026-08-03T10:00:00', username: 'jamrat', action: 'LOGIN', detail: 'เข้าสู่ระบบ', total_count: 1 }],
    notifies: [{ id: 'n1', title: 'ใบลาได้รับอนุมัติ', body: 'ลาป่วย 1 วัน', created_at: '2026-08-02T09:00:00', read_at: null }],
    wfSteps: [{ step_id: 'w1', step_order: 1, name: 'หัวหน้าแผนก', mode: 'MANAGER', active: true }],
    events: [{ event_date: '2026-08-12', title: 'วันแม่แห่งชาติ (หยุด)' }],
    anns: [{ id: 'a1', title: 'ประกาศวันหยุดสิงหาคม', body: 'หยุด 12 ส.ค.', published_at: '2026-08-01' }]
  };

  const user = (b) => db.users[b.p_token] || null;
  const needAuth = (b) => {
    const u = user(b);
    if (!u) { const e = new Error('NO_SESSION'); e.status = 401; throw { __error: 'NO_SESSION', status: 401 }; }
    return u;
  };

  async function handle(fn, body) {
    calls.push({ fn, body });
    if (opts.overrides && opts.overrides[fn]) return opts.overrides[fn](body, db, calls);

    switch (fn) {
      case 'njhr_version_status': {
        const m = db.maintenance;
        return { version: db.version, maintenance_active: !!m, maintenance_mode: m ? m.mode : 'full',
          maintenance_message: m ? m.message || '' : '', maintenance_started_at: null,
          maintenance_ends_at: m ? m.ends_at : null, server_time: new Date().toISOString() };
      }
      case 'njhr_version_v2_access': {
        const u = needAuth(body);
        return { allowed: !!db.v2Access[u.role], role: u.role, username: u.username };
      }
      case 'njhr_login': {
        const found = Object.values(db.users).find(u => u.username === body.p_username);
        if (!found) return { __error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', status: 400 };
        return found;
      }
      case 'njhr_session_check': return needAuth(body);
      case 'njhr_logout': return {};

      case 'njhr_dashboard_summary': needAuth(body);
        return { total_employees: 3, checked_in_today: 2, late_today: 1, on_leave_today: 0, absent_today: 0, ot_today: 1, pending_approvals: 2 };
      case 'njhr_dashboard_announcements': return db.anns;

      case 'njhr_emp_list': {
        needAuth(body);
        let rows = db.employees;
        if (body.p_q) rows = rows.filter(e => (e.emp_code + e.full_name).includes(body.p_q));
        if (body.p_status) rows = rows.filter(e => e.status === body.p_status);
        return rows;
      }
      case 'njhr_emp_get': return db.employees.find(e => e.id === body.p_id) || {};
      case 'njhr_emp_save': {
        needAuth(body);
        if (body.p_id) Object.assign(db.employees.find(e => e.id === body.p_id) || {}, body.p_data);
        else db.employees.push(Object.assign({ id: 'e' + (db.employees.length + 1), full_name: body.p_data.first_name }, body.p_data));
        return { ok: true };
      }
      case 'njhr_emp_status': needAuth(body); return { ok: true };
      case 'njhr_emp_departments': return db.departments;

      case 'njhr_dept_list': needAuth(body); return db.departments;
      case 'njhr_dept_save': needAuth(body);
        if (!body.p_id) db.departments.push({ id: 'd' + (db.departments.length + 1), code: body.p_code, name: body.p_name, emp_count: 0 });
        return { ok: true };
      case 'njhr_dept_delete': {
        needAuth(body);
        const d = db.departments.find(x => x.id === body.p_id);
        if (d && d.emp_count > 0) return { __error: 'ลบไม่ได้ — ยังมีพนักงานอยู่ในแผนก', status: 400 };
        db.departments = db.departments.filter(x => x.id !== body.p_id);
        return { ok: true };
      }
      case 'njhr_dept_employees': return db.employees.slice(0, 1);

      case 'njhr_att_today': needAuth(body); return { check_in: '2026-08-03T08:25:00+07:00', check_out: null, status: 'NORMAL' };
      case 'njhr_att_punch': needAuth(body);
        if (body.p_at !== null && body.p_at !== undefined) return { __error: 'p_at ต้องเป็น null (server now)', status: 400 };
        return { message: 'ลงเวลาแล้ว (เซิร์ฟเวอร์)' };
      case 'njhr_att_report': needAuth(body);
        return [{ work_date: '2026-08-01', emp_code: '0050', emp_name: 'สมชาย ใจดี', check_in: '2026-08-01T08:25:00', check_out: '2026-08-01T17:35:00', late_min: 0, status: 'NORMAL' }];
      case 'njhr_att_summary': return { total: 1 };
      case 'njhr_att_correction_submit': needAuth(body); db.corrections.push({ id: 'c' + (db.corrections.length + 1), work_date: body.p_work_date, requested_check_in: body.p_requested_check_in, requested_check_out: body.p_requested_check_out, reason: body.p_reason, status: 'PENDING' }); return { ok: true };
      case 'njhr_att_correction_list': needAuth(body);
        return body.p_status ? db.corrections.filter(c => c.status === body.p_status) : db.corrections;
      case 'njhr_att_correction_approve': needAuth(body);
        (db.corrections.find(c => c.id === body.p_id) || {}).status = 'APPROVED'; return { ok: true };
      case 'njhr_att_correction_reject': needAuth(body);
        if (!body.p_reason) return { __error: 'ต้องระบุเหตุผล', status: 400 };
        (db.corrections.find(c => c.id === body.p_id) || {}).status = 'REJECTED'; return { ok: true };

      case 'njhr_leave_balances': needAuth(body); return db.balances;
      case 'njhr_leave_types': return db.leaveTypes;
      case 'njhr_leave_type_save': needAuth(body); return { ok: true };
      case 'njhr_leave_submit': {
        needAuth(body);
        if (!body.p_reason) return { __error: 'ต้องระบุเหตุผล', status: 400 };
        db.leaves.push({ id: 'lv' + (db.leaves.length + 1), leave_id: 'lv' + (db.leaves.length + 1),
          leave_type: body.p_leave_type, mode: body.p_mode, start_date: body.p_start_date,
          end_date: body.p_end_date, days: 1, reason: body.p_reason, status: 'PENDING', total_count: db.leaves.length + 1 });
        return { ok: true };
      }
      case 'njhr_leave_list': needAuth(body);
        return body.p_status ? db.leaves.filter(l => l.status === body.p_status) : db.leaves;
      case 'njhr_leave_detail': return db.leaves.find(l => l.leave_id === body.p_leave_id || l.id === body.p_leave_id) || {};
      case 'njhr_leave_cancel': needAuth(body);
        (db.leaves.find(l => l.leave_id === body.p_leave_id || l.id === body.p_leave_id) || {}).status = 'CANCELLED'; return { ok: true };
      case 'njhr_leave_queue': needAuth(body); return db.leaves.filter(l => l.status === 'PENDING');
      case 'njhr_leave_decide': {
        needAuth(body);
        if (body.p_action !== 'APPROVE' && !body.p_note) return { __error: 'ไม่อนุมัติต้องมีเหตุผล', status: 400 };
        (db.leaves.find(l => l.leave_id === body.p_leave_id || l.id === body.p_leave_id) || {}).status =
          body.p_action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        return { ok: true };
      }
      case 'njhr_leave_report': return db.leaves;
      case 'njhr_leave_balance_report': return db.balances.map(b => Object.assign({ emp_code: '0050', emp_name: 'สมชาย ใจดี' }, b));

      case 'njhr_ot_list': needAuth(body);
        return body.p_status ? db.ots.filter(o => o.status === body.p_status) : db.ots;
      case 'njhr_ot_get': return db.ots.find(o => o.id === body.p_id) || {};
      case 'njhr_ot_submit': {
        needAuth(body);
        if (!Array.isArray(body.p_jobs) || !body.p_jobs.length) return { __error: 'ต้องมีรายการงาน', status: 400 };
        db.ots.push({ id: 'ot' + (db.ots.length + 1), ot_date: body.p_date, start_time: body.p_start,
          end_time: body.p_end, next_day: body.p_next_day, jobs: body.p_jobs, job_count: body.p_jobs.length,
          status: 'PENDING', total_count: db.ots.length + 1 });
        return { ok: true };
      }
      case 'njhr_ot_decide': needAuth(body);
        (db.ots.find(o => o.id === body.p_id) || {}).status = body.p_action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        return { ok: true };
      case 'njhr_ot_report': return db.ots;

      case 'njhr_wf_steps': return db.wfSteps;
      case 'njhr_wf_step_save': needAuth(body);
        if (!body.p_step_id) db.wfSteps.push({ step_id: 'w' + (db.wfSteps.length + 1), step_order: db.wfSteps.length + 1, name: body.p_name, mode: body.p_mode, active: body.p_active });
        return { ok: true };
      case 'njhr_wf_step_move': case 'njhr_wf_step_delete': case 'njhr_wf_save': needAuth(body); return { ok: true };
      case 'njhr_wf_list': case 'njhr_wf_overview': return [];

      case 'njhr_pay_items': needAuth(body); return db.payItems;
      case 'njhr_pay_item_save': needAuth(body); return { ok: true };
      case 'njhr_pay_entries': needAuth(body);
        return db.payEntries.filter(p => p.year === body.p_year && p.month === body.p_month);
      case 'njhr_pay_entry_save': {
        needAuth(body);
        db.payEntries.push({ id: 'pe' + (db.payEntries.length + 1), employee_id: body.p_employee,
          item_code: body.p_item_code, amount: body.p_amount, recurring: body.p_recurring,
          year: body.p_year, month: body.p_month, emp_name: 'สมชาย ใจดี', emp_code: '0050', item_name: body.p_item_code });
        return { ok: true };
      }
      case 'njhr_pay_entry_delete': needAuth(body);
        db.payEntries = db.payEntries.filter(p => p.id !== body.p_id); return { ok: true };
      case 'njhr_pay_entry_totals': return { income_total: 15000, deduct_total: 750, entry_count: db.payEntries.length };
      case 'njhr_pay_entry_copy_preview': return db.payEntries.filter(p => p.recurring);
      case 'njhr_pay_entry_copy_apply': needAuth(body); return { copied: (body.p_rows || []).length };

      case 'njhr_slip_periods': needAuth(body); return [{ period_year: 2026, period_month: 7 }];
      case 'njhr_slip_list': needAuth(body); return db.slips;
      case 'njhr_slip_get': return db.slips.find(s => s.payroll_id === body.p_payroll_id) || {};
      case 'njhr_slip_mark_sent': needAuth(body);
        db.slips.forEach(s => { if ((body.p_payroll_ids || []).indexOf(s.payroll_id) >= 0) s.slip_status = 'SENT'; });
        return { ok: true };

      case 'njhr_doc_center_list': needAuth(body); return db.docs;
      case 'njhr_doc_detail': return db.docs.find(x => x.id === body.p_id) || {};
      case 'njhr_doc_save': needAuth(body);
        db.docs.push({ id: 'doc' + (db.docs.length + 1), title: body.p_title, doc_type: body.p_type, status: 'PENDING' });
        return { ok: true };
      case 'njhr_doc_respond': needAuth(body);
        (db.docs.find(x => x.id === body.p_id) || {}).status = body.p_action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        return { ok: true };
      case 'njhr_doc_view': return { ok: true };
      case 'njhr_doc_org': return { data: { company_name_th: 'เอ็น.เจ.โลจิสติกส์' } };
      case 'njhr_doc_org_save': needAuth(body); return { ok: true };
      case 'njhr_doc_approvers': return [];

      case 'njhr_list_users': needAuth(body); return Object.values(db.users).map(u => Object.assign({ is_active: true }, u));
      case 'njhr_user_save': {
        needAuth(body);
        if (!body.p_user_id && !body.p_password) return { __error: 'ผู้ใช้ใหม่ต้องมีรหัสผ่าน', status: 400 };
        return { ok: true };
      }
      case 'njhr_user_password': needAuth(body); return { ok: true };
      case 'njhr_user_candidates': return db.employees;

      case 'njhr_shift_list': needAuth(body); return db.shifts;
      case 'njhr_shift_save': needAuth(body);
        if (!body.p_id) db.shifts.push({ id: 's' + (db.shifts.length + 1), shift_name: body.p_shift_name, start_time: body.p_start_time, end_time: body.p_end_time, break_minutes: body.p_break_minutes, late_allow_minutes: body.p_late_allow_minutes, active: true, emp_count: 0 });
        return { ok: true };
      case 'njhr_shift_assign': needAuth(body); return { ok: true };
      case 'njhr_shift_employee_list': return db.employees.slice(0, 2);
      case 'njhr_shift_unassigned_employees': return db.employees.slice(2);

      case 'njhr_gf_list': needAuth(body); return db.geofences;
      case 'njhr_gf_save': needAuth(body);
        if (!body.p_id) db.geofences.push({ id: 'g' + (db.geofences.length + 1), name: body.p_name, lat: body.p_lat, lng: body.p_lng, radius: body.p_radius, active: true });
        return { ok: true };
      case 'njhr_gf_delete': needAuth(body);
        db.geofences = db.geofences.filter(g => g.id !== body.p_id); return { ok: true };

      case 'njhr_holiday_list': needAuth(body); return db.holidays;
      case 'njhr_holiday_save': needAuth(body);
        db.holidays.push({ id: 'h' + (db.holidays.length + 1), holiday_date: body.p_date, name: body.p_name }); return { ok: true };
      case 'njhr_holiday_delete': needAuth(body);
        db.holidays = db.holidays.filter(h => h.id !== body.p_id); return { ok: true };

      case 'njhr_audit_list': needAuth(body); return db.audits;
      case 'njhr_notify_unread': needAuth(body);
        return { unread_count: db.notifies.filter(n => !n.read_at).length };
      case 'njhr_notify_list': needAuth(body); return db.notifies;
      case 'njhr_notify_read': needAuth(body);
        (db.notifies.find(n => n.id === body.p_id) || {}).read_at = new Date().toISOString(); return { ok: true };
      case 'njhr_notify_read_all': needAuth(body);
        db.notifies.forEach(n => { n.read_at = new Date().toISOString(); }); return { ok: true };

      case 'njhr_event_list': needAuth(body); return db.events;
      case 'njhr_ann_feed': needAuth(body); return db.anns;
      case 'njhr_ann_read': return { ok: true };

      default:
        return { __error: 'MOCK ไม่รู้จัก RPC: ' + fn + ' — ตรวจชื่อกับ rpc_signatures.json', status: 404 };
    }
  }

  return { handle, calls, db };
}
