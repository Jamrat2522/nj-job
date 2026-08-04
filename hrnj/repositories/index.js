/* ============================================================
   HR V2 — repositories/index.js
   Repository Layer — จุดเดียวที่รู้ชื่อ RPC และพารามิเตอร์
   ทุก signature สกัดจาก app.js V1 (108 RPC) + SQL 64/65/79/80 (RPC ที่ V1 ยังไม่เรียก)
   ห้าม Module เรียก client.rpc ตรง — ต้องผ่านชั้นนี้เท่านั้น
   ============================================================ */
export function createRepositories(client, getToken) {
  const t = () => ({ p_token: getToken() });
  const one  = (fn, body) => client.rpc(fn, Object.assign(t(), body));
  const list = (fn, body) => client.rpcList(fn, Object.assign(t(), body));

  return {
    dashboard: {
      summary: () => one('njhr_dashboard_summary', {}),
      announcements: (limit) => list('njhr_dashboard_announcements', { p_limit: limit || 5 })
    },

    employees: {
      list: (o) => list('njhr_emp_list', { p_q: o.q || null, p_dept: o.dept || null, p_status: o.status || null,
        p_sort: o.sort || 'emp_code', p_desc: !!o.desc, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      get: (id) => one('njhr_emp_get', { p_id: id }),
      save: (id, data) => one('njhr_emp_save', { p_id: id, p_data: data }),
      setStatus: (id, status, resignDate, note) =>
        one('njhr_emp_status', { p_id: id, p_status: status, p_resign_date: resignDate || null, p_note: note || null }),
      departments: () => list('njhr_emp_departments', {}),
      importRows: (rows, mode, dryRun) => one('njhr_emp_import', { p_rows: rows, p_mode: mode, p_dry_run: !!dryRun }),
      files: (employee) => list('njhr_empfile_list', { p_employee: employee }),
      fileSave: (o) => one('njhr_empfile_save', { p_id: o.id || null, p_employee: o.employee, p_category: o.category,
        p_doc_kind: o.docKind || null, p_document_date: o.documentDate || null, p_expiry_date: o.expiryDate || null,
        p_note: o.note || null, p_file: o.file }),
      fileDelete: (id, reason) => one('njhr_empfile_delete', { p_id: id, p_reason: reason || null })
    },

    departments: {
      list: (q) => list('njhr_dept_list', { p_q: q || null }),
      save: (id, code, name) => one('njhr_dept_save', { p_id: id, p_code: code, p_name: name }),
      del: (id, confirm) => one('njhr_dept_delete', { p_id: id, p_confirm: confirm }),
      employees: (deptId, q, limit) => list('njhr_dept_employees', { p_dept_id: deptId, p_q: q || null, p_limit: limit || 50 }),
      move: (deptId, employees) => one('njhr_dept_move', { p_dept_id: deptId, p_employees: employees }),
      health: () => one('njhr_dept_health', {})
    },

    attendance: {
      today: () => one('njhr_att_today', {}),
      punch: (action, at, lat, lng, accuracy) =>
        one('njhr_att_punch', { p_action: action, p_at: at, p_lat: lat, p_lng: lng, p_accuracy: accuracy }),
      gfCheck: (lat, lng, accuracy) => one('njhr_gf_check', { p_lat: lat, p_lng: lng, p_accuracy: accuracy }),
      report: (o) => list('njhr_att_report', { p_from: o.from, p_to: o.to, p_dept: o.dept || null,
        p_employee: o.employee || null, p_q: o.q || null, p_type: o.type || null,
        p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      summary: (o) => one('njhr_att_summary', { p_from: o.from, p_to: o.to, p_dept: o.dept || null, p_employee: o.employee || null }),
      correctionSubmit: (o) => one('njhr_att_correction_submit', { p_work_date: o.workDate,
        p_requested_check_in: o.checkIn || null, p_requested_check_out: o.checkOut || null,
        p_reason: o.reason, p_employee: o.employee || null, p_attachment: o.attachment || null }),
      correctionList: (o) => list('njhr_att_correction_list', { p_employee: o.employee || null, p_status: o.status || null,
        p_from: o.from || null, p_to: o.to || null, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      correctionGet: (id) => one('njhr_att_correction_get', { p_id: id }),
      correctionApprove: (id, note) => one('njhr_att_correction_approve', { p_id: id, p_note: note || null }),
      correctionReject: (id, reason) => one('njhr_att_correction_reject', { p_id: id, p_reason: reason }),
      correctionCancel: (id) => one('njhr_att_correction_cancel', { p_id: id })
    },

    leave: {
      balances: () => list('njhr_leave_balances', {}),
      types: () => list('njhr_leave_types', {}),
      typeSave: (o) => one('njhr_leave_type_save', { p_code: o.code, p_label_th: o.labelTh, p_color: o.color,
        p_need_doc: !!o.needDoc, p_doc_after_days: o.docAfterDays || null, p_active: o.active !== false }),
      submit: (o) => one('njhr_leave_submit', { p_leave_type: o.leaveType, p_mode: o.mode,
        p_start_date: o.startDate, p_end_date: o.endDate, p_start_time: o.startTime || null,
        p_end_time: o.endTime || null, p_reason: o.reason, p_delegate: o.delegate || null, p_files: o.files || [] }),
      list: (o) => list('njhr_leave_list', { p_status: o.status || null, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      detail: (id) => one('njhr_leave_detail', { p_leave_id: id }),
      cancel: (id) => one('njhr_leave_cancel', { p_leave_id: id }),
      queue: (limit, offset) => list('njhr_leave_queue', { p_limit: limit || 20, p_offset: offset || 0 }),
      decide: (id, action, note) => one('njhr_leave_decide', { p_leave_id: id, p_action: action, p_note: note || null }),
      report: (o) => list('njhr_leave_report', { p_from: o.from, p_to: o.to, p_type: o.type || null,
        p_status: o.status || null, p_dept: o.dept || null, p_q: o.q || null }),
      balanceReport: (o) => list('njhr_leave_balance_report', { p_year: o.year, p_dept: o.dept || null,
        p_emp_status: o.empStatus || null, p_q: o.q || null })
    },

    ot: {
      list: (o) => list('njhr_ot_list', { p_mine: !!o.mine, p_status: o.status || null, p_from: o.from || null,
        p_to: o.to || null, p_dept: o.dept || null, p_employee: o.employee || null, p_q: o.q || null,
        p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      get: (id) => one('njhr_ot_get', { p_id: id }),
      submit: (o) => one('njhr_ot_submit', { p_date: o.date, p_start: o.start, p_end: o.end,
        p_next_day: !!o.nextDay, p_jobs: o.jobs, p_reason: o.reason || null }),
      decide: (id, action, note) => one('njhr_ot_decide', { p_id: id, p_action: action, p_note: note || null }),
      report: (o) => list('njhr_ot_report', { p_from: o.from, p_to: o.to, p_status: o.status || null,
        p_dept: o.dept || null, p_employee: o.employee || null, p_q: o.q || null,
        p_limit: o.limit || 50, p_offset: o.offset || 0 }),
      attachAdd: (o) => one('njhr_ot_attach_add', { p_ot_id: o.otId, p_job_no: o.jobNo, p_job_code: o.jobCode || null,
        p_file_name: o.fileName, p_file_path: o.filePath, p_file_url: o.fileUrl,
        p_file_size: o.fileSize, p_content_type: o.contentType }),
      attachDelete: (path) => one('njhr_ot_attach_delete', { p_path: path })
    },

    workflow: {
      overview: () => list('njhr_wf_overview', {}),
      list: (type) => list('njhr_wf_list', { p_type: type }),
      save: (o) => one('njhr_wf_save', { p_id: o.id || null, p_name: o.name, p_type: o.type,
        p_types: o.types || null, p_scope: o.scope, p_departments: o.departments || [], p_employees: o.employees || [] }),
      del: (id, confirm) => one('njhr_wf_delete', { p_id: id, p_confirm: confirm }),
      steps: (type, dept) => list('njhr_wf_steps', { p_type: type, p_dept: dept || null }),
      stepSave: (o) => one('njhr_wf_step_save', { p_step_id: o.stepId || null, p_type: o.type, p_dept: o.dept || null,
        p_name: o.name, p_mode: o.mode, p_cond_type: o.condType || null, p_cond_value: o.condValue || null,
        p_note: o.note || null, p_active: o.active !== false }),
      stepMove: (stepId, dir) => one('njhr_wf_step_move', { p_step_id: stepId, p_dir: dir }),
      stepDelete: (stepId, confirm) => one('njhr_wf_step_delete', { p_step_id: stepId, p_confirm: confirm }),
      empPool: (type, q, excludeWf, limit) => list('njhr_wf_emp_pool', { p_type: type, p_q: q || null,
        p_exclude_workflow: excludeWf || null, p_limit: limit || 30 }),
      deptPool: (type, excludeWf) => list('njhr_wf_dept_pool', { p_type: type, p_exclude_workflow: excludeWf || null }),
      candidates: (q, limit) => list('njhr_wf_candidates', { p_q: q || null, p_limit: limit || 30 })
    },

    payroll: {
      items: (o) => list('njhr_pay_items', { p_q: (o && o.q) || null, p_kind: (o && o.kind) || null,
        p_active: (o && o.active) != null ? o.active : null }),
      itemSave: (o) => one('njhr_pay_item_save', { p_code: o.code, p_is_new: !!o.isNew, p_name_th: o.nameTh,
        p_kind: o.kind, p_calc_type: o.calcType, p_unit: o.unit || null, p_fixed_amount: o.fixedAmount || null,
        p_percent: o.percent || null, p_default_value: o.defaultValue || null,
        p_show_in_slip: o.showInSlip !== false, p_show_in_report: o.showInReport !== false, p_active: o.active !== false }),
      itemDelete: (code) => one('njhr_pay_item_delete', { p_code: code }),
      itemReorder: (codes) => one('njhr_pay_item_reorder', { p_codes: codes }),
      entries: (o) => list('njhr_pay_entries', { p_year: o.year, p_month: o.month,
        p_employee: o.employee || null, p_q: o.q || null }),
      entrySave: (o) => one('njhr_pay_entry_save', { p_id: o.id || null, p_employee: o.employee,
        p_item_code: o.itemCode, p_year: o.year, p_month: o.month, p_mode: o.mode || null,
        p_amount: o.amount != null ? o.amount : null, p_percent: o.percent != null ? o.percent : null,
        p_recurring: !!o.recurring, p_effective_start: o.effectiveStart || null, p_effective_end: o.effectiveEnd || null,
        p_is_active: o.isActive !== false, p_note: o.note || null }),
      entryDelete: (id) => one('njhr_pay_entry_delete', { p_id: id }),
      entryBulk: (action, ids) => one('njhr_pay_entry_bulk', { p_action: action, p_ids: ids }),
      entrySetActive: (id, active) => one('njhr_pay_entry_set_active', { p_id: id, p_active: !!active }),
      entryTotals: (o) => one('njhr_pay_entry_totals', { p_year: o.year, p_month: o.month, p_employee: o.employee || null }),
      entryHistory: (id) => list('njhr_pay_entry_history', { p_id: id }),
      copyPreview: (year, month) => list('njhr_pay_entry_copy_preview', { p_year: year, p_month: month }),
      copyApply: (year, month, rows) => one('njhr_pay_entry_copy_apply', { p_year: year, p_month: month, p_rows: rows })
    },

    payslip: {
      periods: () => list('njhr_slip_periods', {}),
      filters: (year, month) => one('njhr_slip_filters', { p_year: year, p_month: month }),
      list: (o) => list('njhr_slip_list', { p_year: o.year, p_month: o.month, p_dept: o.dept || null,
        p_position: o.position || null, p_status: o.status || null, p_q: o.q || null,
        p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      get: (payrollId) => one('njhr_slip_get', { p_payroll_id: payrollId }),
      markSent: (payrollIds) => one('njhr_slip_mark_sent', { p_payroll_ids: payrollIds })
    },

    hrdocs: {
      centerList: (o) => list('njhr_doc_center_list', { p_q: o.q || null, p_type: o.type || null,
        p_status: o.status || null, p_dept: o.dept || null, p_employee: o.employee || null,
        p_from: o.from || null, p_to: o.to || null, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      detail: (id) => one('njhr_doc_detail', { p_id: id }),
      save: (o) => one('njhr_doc_save', { p_id: o.id || null, p_type: o.type, p_title: o.title,
        p_employee: o.employee || null, p_approver: o.approver || null, p_effective_date: o.effectiveDate || null,
        p_body: o.body || null, p_meta: o.meta || null }),
      flow: (id, action, note, ctxData) => one('njhr_doc_flow', { p_id: id, p_action: action, p_note: note || null, p_ctx: ctxData || null }),
      respond: (o) => one('njhr_doc_respond', { p_id: o.id, p_action: o.action, p_reason: o.reason || null,
        p_password: o.password || null, p_ctx: o.ctx || null }),
      view: (id, ctxData) => one('njhr_doc_view', { p_id: id, p_ctx: ctxData || null }),
      del: (id, reason) => one('njhr_doc_delete', { p_id: id, p_reason: reason }),
      org: () => one('njhr_doc_org', {}),
      orgSave: (data) => one('njhr_doc_org_save', { p_data: data }),
      empProfile: (employee) => one('njhr_doc_emp_profile', { p_employee: employee }),
      salaryItems: (employee) => list('njhr_doc_salary_items', { p_employee: employee }),
      approvers: (q, limit) => list('njhr_doc_approvers', { p_q: q || null, p_limit: limit || 30 })
    },

    users: {
      list: (o) => list('njhr_list_users', { p_q: o.q || null, p_role: o.role || null, p_status: o.status || null,
        p_dept: o.dept || null, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      save: (o) => one('njhr_user_save', { p_user_id: o.userId || null, p_username: o.username,
        p_password: o.password || null, p_role: o.role, p_email: o.email || null,
        p_employee: o.employee || null, p_is_active: o.isActive !== false }),
      link: (userId, employee) => one('njhr_user_link', { p_user_id: userId, p_employee: employee }),
      password: (userId, password) => one('njhr_user_password', { p_user_id: userId, p_password: password }),
      candidates: (q, current, limit) => list('njhr_user_candidates', { p_q: q || null, p_current: current || null, p_limit: limit || 30 })
    },

    shifts: {
      list: (includeInactive) => list('njhr_shift_list', { p_include_inactive: !!includeInactive }),
      save: (o) => one('njhr_shift_save', { p_id: o.id || null, p_shift_name: o.shiftName,
        p_start_time: o.startTime, p_end_time: o.endTime, p_break_minutes: o.breakMinutes,
        p_late_allow_minutes: o.lateAllowMinutes, p_ot_start_after: o.otStartAfter || null,
        p_working_days: o.workingDays || null }),
      setActive: (id, active, force) => one('njhr_shift_set_active', { p_id: id, p_active: !!active, p_force: !!force }),
      assign: (employee, shift, effectiveDate) =>
        one('njhr_shift_assign', { p_employee: employee, p_shift: shift, p_effective_date: effectiveDate }),
      employeeList: (shift) => list('njhr_shift_employee_list', { p_shift: shift }),
      unassigned: (q, limit) => list('njhr_shift_unassigned_employees', { p_q: q || null, p_limit: limit || 50 })
    },

    geofence: {
      list: (q) => list('njhr_gf_list', { p_q: q || null }),
      save: (o) => one('njhr_gf_save', { p_id: o.id || null, p_name: o.name, p_address: o.address || null,
        p_lat: o.lat, p_lng: o.lng, p_radius: o.radius, p_max_accuracy: o.maxAccuracy || null,
        p_active: o.active !== false, p_employees: o.employees || null }),
      del: (id, confirm) => one('njhr_gf_delete', { p_id: id, p_confirm: confirm })
    },

    settings: {
      holidays: (from, to) => list('njhr_holiday_list', { p_from: from, p_to: to }),
      holidaySave: (id, date, name) => one('njhr_holiday_save', { p_id: id, p_date: date, p_name: name }),
      holidayDelete: (id) => one('njhr_holiday_delete', { p_id: id }),
      holidayImpact: (year) => one('njhr_holiday_impact', { p_year: year })
    },

    audit: {
      list: (o) => list('njhr_audit_list', { p_q: o.q || null, p_limit: o.limit || 30, p_offset: o.offset || 0 })
    },

    notify: {
      unread: () => one('njhr_notify_unread', {}),
      list: (limit, offset) => list('njhr_notify_list', { p_limit: limit || 20, p_offset: offset || 0 }),
      read: (id) => one('njhr_notify_read', { p_id: id }),
      readAll: () => one('njhr_notify_read_all', {})
    },

    calendar: {
      events: (from, to, limit) => list('njhr_event_list', { p_from: from, p_to: to, p_limit: limit || 100 }),
      annFeed: (o) => list('njhr_ann_feed', { p_unread_only: !!o.unreadOnly, p_limit: o.limit || 20, p_offset: o.offset || 0 }),
      annRead: (id) => one('njhr_ann_read', { p_id: id }),
      annAck: (id, device) => one('njhr_ann_ack', { p_id: id, p_device: device || null })
    }
  };
}
