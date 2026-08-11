  /* ================= ROUTER + GUARDS ================= */
  /* ระบบ HR ใช้ 3 Role เท่านั้น — SUPER_ADMIN / ADMIN / USER
     ค่าเดิม HR · ACCOUNT · MANAGER · EMPLOYEE ถูกยุบรวมเป็น USER (ดู normRole ใน STORE) */
  var ROLE_TH = { SUPER_ADMIN: 'ผู้ดูแลระบบสูงสุด', ADMIN: 'ผู้ดูแลระบบ', USER: 'ผู้ใช้งาน' };
  var ALL = ['SUPER_ADMIN', 'ADMIN', 'USER'];
  /* Runtime Split — `view` เปลี่ยนจากการอ้างฟังก์ชันตรง ๆ เป็น "ชื่อ View ใน Registry"
     เหตุผล: ฟังก์ชัน viewXxx ทั้ง 27 ตัวย้ายไปอยู่คนละ chunk แล้ว จึงไม่มี hoisting ให้อ้างอิงตอนสร้าง object นี้
     `mod`  = ชื่อ Module ใน Asset Manifest ที่บรรจุ View นั้น (Route-to-Module Mapping แหล่งเดียวของระบบ)
     Route · title · roles · ลำดับ · การ redirect — เหมือนเดิมทุกตัวอักษร */
  var ROUTES = {
    '#/dashboard': { title: 'Dashboard', roles: ALL, view: 'viewDashboard', mod: 'dashboard' },
    '#/employees': { title: 'พนักงาน', roles: ALL, view: 'viewEmployees', mod: 'employees' },
    '#/hr-docs': { title: 'เอกสาร HR', roles: ALL, view: 'viewHrDocs', mod: 'profile-docs' },
    '#/attendance': { title: 'ลงเวลา', roles: ALL, view: 'viewAttendance', mod: 'attendance' },
    '#/requests': { title: 'คำขอ', roles: ALL, view: 'viewRequests', mod: 'requests-leave' },
    '#/req-history': { title: 'ประวัติลางานและ OT', roles: ALL, view: 'viewReqHistory', mod: 'requests-leave' },
    '#/leave': { title: 'ลางาน', roles: ALL, view: 'viewLeave', mod: 'requests-leave' },
    '#/ot': { title: 'OT', roles: ALL, view: 'viewOT', mod: 'ot' },
    '#/payroll': { title: 'เงินเดือน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewPayroll', mod: 'compatibility' },
    '#/salary-merge': { title: 'รวมเงินเดือน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewSalaryMerge', mod: 'compatibility' },
    '#/payslips': { title: 'สลิปเงินเดือน (E-PAYSLIP)', roles: ALL, view: function () { window.location.hash = '#/epayslip'; } }, // โหมดเดิมถูกยุบรวม — redirect
    '#/epayslip': { title: 'สลิปเงินเดือน (E-PAYSLIP)', roles: ALL, view: 'viewEPayslip', mod: 'compatibility' },
    '#/approval-settings': { title: 'ตั้งค่าการอนุมัติ', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewApprovalSettings', mod: 'compatibility' },
    '#/pay-items': { title: 'รายการเงินเดือน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewPayItems', mod: 'compatibility' },
    '#/sso': { title: 'ประกันสังคม', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewSSO', mod: 'compatibility' },
    '#/approvals': { title: 'อนุมัติรายการ', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewApprovals', mod: 'compatibility' },
    '#/reports': { title: 'รายงานการลงเวลา', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewReports', mod: 'attendance-report' },
    '#/rpt-leave': { title: 'REPORT ลางาน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewRptLeave', mod: 'report-menu' },
    '#/rpt-ot': { title: 'REPORT OT', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewRptOT', mod: 'report-menu' },
    '#/calendar': { title: 'ปฏิทินองค์กร', roles: ALL, view: 'viewCalendar', mod: 'calendar' },
    '#/announcements': { title: 'ประกาศบริษัท', roles: ALL, view: 'viewAnnouncements', mod: 'compatibility' },
    '#/users': { title: 'จัดการสมาชิก', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewUsers', mod: 'compatibility' },
    '#/departments': { title: 'จัดการแผนก', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewDepartments', mod: 'compatibility' },
    '#/settings': { title: 'ตั้งค่าระบบ', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewSettings', mod: 'compatibility' },
    '#/geofence': { title: 'พื้นที่ลงเวลา', roles: ['SUPER_ADMIN'], view: 'viewGeofence', mod: 'compatibility' },
    '#/shifts': { title: 'ตั้งค่ากะทำงาน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewShifts', mod: 'compatibility' },
    '#/audit': { title: 'ประวัติการใช้งาน', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewAudit', mod: 'compatibility' },
    '#/reportall': { title: 'REPORT ALL', roles: ['SUPER_ADMIN', 'ADMIN'], view: 'viewReportAll', mod: 'compatibility' },
    '#/notifications': { title: 'การแจ้งเตือน', roles: ALL, view: 'viewNotifications', mod: 'notifications' },
    '#/profile': { title: 'โปรไฟล์', roles: ALL, view: 'viewProfile', mod: 'profile-docs' }
  };
  function canAccess(route) {
    var u = currentUser();
    return u && ROUTES[route] && ROUTES[route].roles.indexOf(u.role) >= 0;
  }
  function nav(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ---------- ปิดลิ้นชัก + เลื่อนขึ้นบนสุด (ยกมาจาก render() เดิมทั้งบล็อก ไม่แก้ลำดับ) ---------- */
  /* section ที่เปิดผ่าน ?sec= — ใช้ element ที่หน้านั้นมีอยู่แล้ว ไม่แก้ view ใด ๆ
     มีไว้เพื่อให้เมนูสองรายการที่ชี้หน้าเดียวกันพาไปคนละจุด
     (ปุ่มล่าง "ลงเวลา" = บนสุด · Drawer "ประวัติการลงเวลา" = การ์ดประวัติ) */
  var SECTION_TARGET = { history: '.att-hcard' };

  function rtScrollToSection() {
    var q = (location.hash.split('?')[1] || '');
    var m = /(?:^|&)sec=([\w-]+)/.exec(q);
    var sel = m && SECTION_TARGET[m[1]];
    if (!sel) { window.scrollTo(0, 0); return; }
    // view บางหน้าเติมเนื้อหาแบบ async — รอรอบ paint ถัดไปก่อนค่อยหา element
    requestAnimationFrame(function () {
      var el = document.querySelector(sel);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    });
  }

  function rtFinishRender() {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.getElementById('sidebar').classList.remove('drawer-open');
    document.body.classList.remove('sidebar-open');   // เปลี่ยนหน้า/logout = ปลดล็อกเสมอ
    rtScrollToSection();
  }
  /* Loading / Error / Retry — ใช้ class เดิมของระบบทั้งหมด ไม่เพิ่ม CSS ใหม่
     ข้อความสั้น ไม่เปิดเผย path ไม่เปิดเผยชื่อไฟล์ ไม่เปิดเผยข้อความ error ภายใน */
  function rtLoadingHTML() {
    return '<div class="card"><small class="muted"><span class="spinner"></span> กำลังโหลด…</small></div>';
  }
  function rtRenderError(host, hash) {
    if (!host) return;
    host.innerHTML = '<div class="empty">' + icon('info') +
      '<p>ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่</p>' +
      '<button class="btn btn-primary" id="rt-retry">ลองใหม่</button></div>';
    var btn = document.getElementById('rt-retry');
    if (btn) btn.onclick = function () { render(); };
  }

  function render() {
    // เปลี่ยนหน้า = ยกเลิกคำสั่งอ่านของเนื้อหาหน้าเดิมที่ยังค้าง
    // (ไม่แตะคำสั่งเขียน และไม่แตะ RPC ระดับ Shell เช่น badge รออนุมัติ)
    try { sbAbortReads(); } catch (e) {}
    var hash = location.hash || '#/dashboard';
    if (hash.indexOf('#/') !== 0) hash = '#/dashboard';
    if (!session) { NJHR.router.bump(); renderLogin(); return; }
    var u = currentUser();
    if (!u || !u.active) { doLogout(true); return; }
    if (!ROUTES[hash]) {
      // ลิงก์เดิมที่มี query string เช่น #/pay-items?tab=addition ต้องยังเปิดได้
      var bare = hash.split('?')[0].replace(/\/(addition|deduction|income|expense)$/i, '');
      if (ROUTES[bare]) hash = bare;
      else {
        // Route ที่ถูกลบ/ไม่มีจริง: แก้ URL ด้วย ไม่ปล่อยให้ค้างเป็นลิงก์เสีย
        hash = '#/dashboard';
        if (location.hash && location.hash !== hash) { location.hash = hash; return; }
      }
    }
    if (!canAccess(hash)) {
      toast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      hash = '#/dashboard';
      if (location.hash !== hash) { location.hash = hash; return; }
    }
    /* ผ่านด่านสิทธิ์แล้วเท่านั้นจึงจะแตะ Module Loader
       ผู้ที่ไม่มีสิทธิ์จะไม่มีทางสั่งดาวน์โหลดไฟล์ของหน้านั้นได้เลย */
    var navId = NJHR.router.bump();
    var r = ROUTES[hash];
    NJHR.state.currentRoute = hash;

    renderShell(hash);
    var host = mountTabs(hash);   // แถบ Tab อยู่เหนือเนื้อหา · view เดิมไม่ต้องแก้

    /* ntPaint(): ป้ายแดงกระดิ่งต้องวาดใหม่ทุกครั้งที่ view mount เสร็จ
       เพราะกระดิ่งมือถือ (.att-mb-bell / .req-mb-bell) เพิ่งถูกสร้างในรอบนั้น */
    var ntPaint = function () { try { NJHR.notify.paint(); } catch (e) {} };
    if (typeof r.view === 'function') { r.view(host); rtFinishRender(); ntPaint(); return; }
    if (NJHR.views.has(r.view)) { NJHR.views.render(r.view, host, navId, hash); rtFinishRender(); ntPaint(); return; }

    host.innerHTML = rtLoadingHTML();
    rtFinishRender();
    NJHR.modules.load(r.mod).then(function () {
      if (navId !== NJHR.router.navId()) return;                 // มีการนำทางใหม่ระหว่างโหลด
      if (!session) return;                                      // ออกจากระบบระหว่างโหลด
      if (!canAccess(hash)) return;                              // สิทธิ์เปลี่ยนระหว่างโหลด
      var host2 = document.getElementById('view-host') || host;
      if (!NJHR.views.has(r.view)) { rtRenderError(host2, hash); return; }
      NJHR.views.render(r.view, host2, navId, hash);
      ntPaint();
    })['catch'](function (e) {
      try { console.error('[MODULE] ' + (e && e.message ? e.message : e)); } catch (e2) {}
      if (navId !== NJHR.router.navId() || !session) return;
      rtRenderError(document.getElementById('view-host') || host, hash);
    });
  }

