  /* ================= LAYOUT (Sidebar / Header / BottomNav) ================= */
  // เมนูแบบหมวดกดเปิด-ปิด — Route และสิทธิ์ (ROUTES.roles) เดิมทั้งหมด
  var MENU_TOP = { r: '#/dashboard', t: 'Dashboard', i: 'dashboard' };
  /* โครงเมนูใหม่ (Sidebar 1 ระดับ + เมนูย่อยในหมวด)
     ประกาศบริษัท / ปฏิทินองค์กร / การแจ้งเตือน / โปรไฟล์ ถูกย้ายออกจาก Sidebar
     → เข้าผ่านการ์ดบน Dashboard และไอคอนบน Topbar · Route เดิมทุกตัวยังอยู่ครบ
     `also` = Route ที่อยู่ในหน้าเดียวกันแบบ Tab (ใช้เพื่อไฮไลต์เมนูให้ถูกหมวด) */
  /* เมนูของ USER — 1 ระดับ 4 รายการตามที่ออกแบบไว้
     Route ทุกตัวเป็น Route เดิมที่มีอยู่แล้วใน ROUTES (roles: ALL) ไม่ได้สร้างใหม่
     ไม่ใส่ หน้าหลัก / ลงเวลา / คำขอ / โปรไฟล์ เพราะอยู่ Bottom Navigation แล้ว
     (1 Function = 1 Primary Entry Point) */
  var USER_MENU = [
    { r: '#/calendar',   t: 'ปฏิทินองค์กร',      i: 'calendar' },
    { r: '#/hr-docs',    t: 'เอกสารของฉัน',      i: 'fileText', myDocsBadge: true },
    { r: '#/epayslip',   t: 'สลิปเงินเดือน',      i: 'wallet' },
    // ชี้หน้าเดียวกับปุ่ม "ลงเวลา" แต่คนละจุดหมาย:
    //   ปุ่มล่าง "ลงเวลา"        = ทำรายการเข้า/ออก (บนสุดของหน้า)
    //   Drawer "ประวัติการลงเวลา" = การ์ดประวัติ (.att-hcard) ที่มีอยู่แล้วในหน้าเดียวกัน
    { r: '#/attendance', q: '?sec=history', t: 'ประวัติการลงเวลา', i: 'clock' }
  ];

  var MENU_GROUPS = [
    {
      key: 'people', t: 'บุคลากร', i: 'users', items: [
        { r: '#/employees', t: 'พนักงาน', i: 'users' },
        { r: '#/hr-docs', t: 'เอกสาร HR', i: 'fileText', userTitle: 'เอกสารของฉัน', myDocsBadge: true },
        { r: '#/attendance', t: 'ลงเวลา', i: 'clock' }]
    },
    {
      key: 'requests', t: 'คำขอ', i: 'checkSquare', items: [
        { r: '#/leave', t: 'ลางาน', i: 'calendarOff' },
        { r: '#/ot', t: 'OT', i: 'timer' },
        { r: '#/approvals', t: 'อนุมัติรายการ', i: 'checkSquare', badge: true }]
    },
    {
      key: 'money', t: 'เงินเดือน', i: 'wallet', items: [
        { r: '#/payroll', t: 'เงินเดือน', i: 'wallet' },
        { r: '#/epayslip', t: 'สลิปเงินเดือน', i: 'fileText' }]
    },
    {
      key: 'report', t: 'รายงาน', i: 'chart', items: [
        { r: '#/reports', t: 'รายงานการลงเวลา', i: 'chart' },
        { r: '#/salary-merge', t: 'รวมเงินเดือน', i: 'download' },
        { r: '#/sso', t: 'ประกันสังคม', i: 'shield' },
        { r: '#/reportall', t: 'REPORT ALL', i: 'fileText' },     // เข้าตรงจาก Sidebar (หน้าทางผ่าน REPORT ถูกลบแล้ว)
        /* deskOnly = แสดงเฉพาะจอคอมพิวเตอร์ (ใส่ class .only-desktop ให้ลิงก์)
           สองรายงานนี้ออกแบบสำหรับหน้าคอมเท่านั้น จึงไม่เพิ่มรายการใดลงเมนูบนมือถือ */
        { r: '#/rpt-leave', t: 'REPORT ลางาน', i: 'calendarOff', deskOnly: true },
        { r: '#/rpt-ot', t: 'REPORT OT', i: 'timer', deskOnly: true }]
    },
    {
      key: 'system', t: 'ระบบ', i: 'settings', items: [
        { r: '#/users', t: 'ผู้ใช้งาน', i: 'userCog', also: ['#/departments'] },
        { r: '#/settings', t: 'ตั้งค่า', i: 'settings', also: ['#/geofence', '#/shifts', '#/approval-settings', '#/pay-items'] },
        { r: '#/audit', t: 'ประวัติการใช้งาน', i: 'history' }]
    }
  ];
  /* ชื่อเมนูตาม Role — USER เห็น "เอกสารของฉัน" · ผู้ดูแลยังเห็น "เอกสาร HR" เหมือนเดิม
     Route · สิทธิ์ · ข้อมูล ยังเป็นชุดเดียวกันทั้งหมด เปลี่ยนแค่ป้ายชื่อบนเมนู */
  function menuTitle(m) {
    var u = currentUser();
    return (m.userTitle && u && u.role === 'USER') ? m.userTitle : m.t;
  }
  // Badge ของเมนู 1 รายการ: อนุมัติรายการใช้ pendingCount() เดิม · เอกสารของฉันใช้ NJHR.state.docPending
  function menuBadgeOf(m, pc) {
    if (m.badge && pc > 0) return pc;
    if (m.myDocsBadge) { var d = Number(NJHR.state.docPending) || 0; if (d > 0) return d; }
    return 0;
  }

  // เมนู 1 รายการอาจครอบหลาย Route ที่แสดงเป็น Tab ในหน้าเดียวกัน
  function menuRoutes(m) { return [m.r].concat(m.also || []); }
  function menuMatch(m, hash) { return menuRoutes(m).indexOf(hash) >= 0; }
  function menuVisible(m) { return menuRoutes(m).some(canAccess); }
  // ลิงก์ของเมนู = Route แรกที่ผู้ใช้คนนี้เปิดได้จริง (กันกดแล้วถูกเด้งกลับ)
  /* m.q = query สำหรับพาไปยัง section ในหน้าเดียวกัน (เช่น ?sec=history)
     Router ตัด query ออกก่อนหาสิทธิ์อยู่แล้ว จึงไม่กระทบการตรวจ ROUTES/canAccess */
  function menuHref(m) {
    var r = menuRoutes(m).filter(canAccess)[0] || m.r;
    return r + (m.q && r === m.r ? m.q : '');
  }

  /* หน้ารวมแบบ Tab — ใช้ Route เดิมทั้งหมด ไม่รวมข้อมูลของสองระบบเข้าด้วยกัน
     แต่ละแท็บยังเรียก view เดิมของ Route นั้นตามปกติ */
  var TABSETS = [
    { key: 'users', tabs: [
      { r: '#/users', t: 'จัดการสมาชิก' },
      { r: '#/departments', t: 'จัดการแผนก' }] },
    { key: 'settings', tabs: [
      { r: '#/settings', t: 'ตั้งค่าระบบ' },
      { r: '#/geofence', t: 'พื้นที่ลงเวลา' },
      { r: '#/shifts', t: 'ตั้งค่ากะทำงาน' },
      { r: '#/approval-settings', t: 'ตั้งค่าการอนุมัติ' },
      { r: '#/pay-items', t: 'รายการเงินเดือน' }] }
  ];
  function tabsetOf(hash) {
    return TABSETS.find(function (ts) { return ts.tabs.some(function (t) { return t.r === hash; }); });
  }
  // วางแถบ Tab ไว้เหนือเนื้อหา แล้วคืน element เปล่าให้ view เดิมเขียนลงไป (view ไม่ต้องแก้เลย)
  function mountTabs(hash) {
    var mv = document.getElementById('main-view');
    var ts = tabsetOf(hash), html = '';
    if (ts) {
      var tabs = ts.tabs.filter(function (t) { return canAccess(t.r); });
      if (tabs.length > 1) {
        html = '<div class="tabs page-tabs">' + tabs.map(function (t) {
          return '<a class="tab' + (t.r === hash ? ' active' : '') + '" href="' + t.r + '">' + esc(t.t) + '</a>';
        }).join('') + '</div>';
      }
    }
    mv.innerHTML = html + '<div id="view-host"></div>';
    return document.getElementById('view-host');
  }

  function groupOfRoute(hash) {
    return MENU_GROUPS.find(function (g) {
      return g.items.some(function (m) { return menuMatch(m, hash); });
    });
  }
  // อัปเดตเฉพาะตัวเลข badge (ใช้ pendingCount() เดิม) หลังอนุมัติ/ปฏิเสธ โดยไม่ re-render shell
  function refreshMenuBadge() {
    var pc = pendingCount();
    // ตัวเลขต่างกันได้ระหว่าง "อนุมัติรายการ" (pendingCount) กับ "เอกสารของฉัน" (docPending)
    // จึงอัปเดตทีละลิงก์ตาม data-badge-route แทนการเขียนทับด้วยเลขเดียวทั้งหมด
    MENU_GROUPS.forEach(function (g) {
      g.items.forEach(function (m) {
        if (!m.badge && !m.myDocsBadge) return;
        var mb = menuBadgeOf(m, pc);
        document.querySelectorAll('.side-menu a.menu-item[href="' + menuHref(m) + '"], ' +
                                  '#menu-flyout a.menu-item[href="' + menuHref(m) + '"]')
          .forEach(function (a) {
            var b = a.querySelector('.menu-badge');
            if (mb > 0) {
              if (b) b.textContent = mb;
              else a.insertAdjacentHTML('beforeend', '<span class="menu-badge">' + mb + '</span>');
            } else if (b) { b.remove(); }
          });
      });
    });
    // ตัวเลขรวมบนหัวหมวด
    MENU_GROUPS.forEach(function (g) {
      var gb = g.items.reduce(function (n, m) { return n + menuBadgeOf(m, pc); }, 0);
      var btn = document.getElementById('menu-cat-btn-' + g.key);
      if (!btn) return;
      var cb = btn.querySelector('.cat-badge');
      if (gb > 0) {
        if (cb) cb.textContent = gb;
        else btn.querySelector('.menu-text')
                .insertAdjacentHTML('afterend', '<span class="menu-badge cat-badge">' + gb + '</span>');
      } else if (cb) { cb.remove(); }
    });
  }

  /* ปุ่มล่างบนมือถือ
     USER / EMPLOYEE = 5 ปุ่มตามสเปก (หน้าหลัก · ลงเวลา · ลางาน · สลิป · โปรไฟล์)
     ผู้ดูแล = หัวหมวดใหม่ + โปรไฟล์ (Sidebar Drawer ยังเป็นเมนูหลักตามเดิม) */
  // เมนูล่างมือถือ: 4 เมนูเท่านั้นตามแบบที่กำหนด — ใช้ชุดเดียวกันทุก Role
  // (สลิปและลางานยังอยู่ในระบบและเมนูข้าง แค่ไม่อยู่บนเมนูล่าง)
  function bottomNavItems() {
    return [['#/dashboard', 'หน้าหลัก', 'home'],
            ['#/attendance', 'ลงเวลา', 'clock'],
            ['#/requests', 'คำขอ', 'checkSquare'],
            ['#/profile', 'โปรไฟล์', 'user']];
  }
  // ไฮไลต์ปุ่มล่างให้ครอบทั้งหมวด (เช่น อยู่หน้า #/departments ต้องไฮไลต์ "ระบบ")
  function bnActive(r, activeHash) {
    if (r === activeHash) return true;
    // แท็บ "คำขอ" ครอบหน้าลา / OT / อนุมัติ ที่เข้าถึงจากหน้านี้ด้วย
    if (r === '#/requests') {
      return ['#/leave', '#/ot', '#/approvals', '#/req-history'].indexOf(activeHash) >= 0;
    }
    var g = groupOfRoute(activeHash), gr = groupOfRoute(r);
    return !!(g && gr && g.key === gr.key);
  }

  /* ================= SIDEBAR ACCORDION =================
     ใช้ State กลางค่าเดียว: uiState.openSidebarGroup = 'people' | 'requests' | ... | null
     (เดิมเป็น uiState.menuOpen แบบ boolean หลายตัว ซึ่งทำให้เปิดค้างพร้อมกันได้) */
  function accInit() {
    if (typeof uiState.openSidebarGroup === 'undefined') {
      uiState.openSidebarGroup = null;
      delete uiState.menuOpen;                 // ล้างสถานะเก่าแบบหลาย boolean ทิ้ง
      saveUI();
    }
  }
  // เปิดเฉพาะกลุ่มที่มี Route ปัจจุบัน · หน้าเดี่ยว (Dashboard/โปรไฟล์ ฯลฯ) = ยุบทุกกลุ่ม
  function accSyncToRoute(activeHash) {
    accInit();
    var g = groupOfRoute(activeHash);
    var next = g ? g.key : null;
    if (uiState.openSidebarGroup !== next) { uiState.openSidebarGroup = next; saveUI(); }
  }
  // ปรับเฉพาะ class + aria-expanded ของหมวด ไม่สร้าง Sidebar ใหม่ทั้งชุด
  function accApply() {
    var sb = document.getElementById('sidebar');
    if (!sb) return;
    sb.querySelectorAll('.menu-cat').forEach(function (cat) {
      var on = cat.dataset.group === uiState.openSidebarGroup;
      cat.classList.toggle('open', on);
      var btn = cat.querySelector('.menu-cat-btn');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }
  // กดหัวข้อหลัก: เปิดกลุ่มนี้และปิดกลุ่มอื่นทันที · กดซ้ำที่กลุ่มเดิม = ยุบ
  function accToggle(key) {
    accInit();
    uiState.openSidebarGroup = (uiState.openSidebarGroup === key) ? null : key;
    saveUI();
    accApply();
  }

  var _shellSig = null;

  /* ---------- โหมดหัวแถบมือถือ (ตามภาพอ้างอิงที่อนุมัติแล้ว) ----------
     'brand' = แถบกรมท่า โลโก้ NJL + NJL HR   (หน้าหลัก · โปรไฟล์)
     'mid'   = แถบกรมท่า ชื่อหน้ากลางแถบ       (ลงเวลา · คำขอ)
     ''      = หัวแถบเดิม (Desktop และทุก Route อื่น)
     ค่านี้ต้องอยู่ใน shellSignature ด้วย ไม่งั้นเปลี่ยนหน้าในกลุ่มเดียวกัน
     จะเข้าทาง shellUpdateActive() ซึ่งไม่คำนวณคลาสของ .topbar ใหม่ */
  var MB_BRAND_ROUTES = ['#/dashboard'];
  /* หน้าโปรไฟล์มีแถบแบรนด์ของตัวเองอยู่ในหน้า (.pfm-brand ตามภาพอ้างอิง)
     จึงซ่อน topbar บนมือถือ ไม่ให้ซ้อนกัน 2 ชั้น */
  var MB_HIDE_ROUTES = ['#/profile', '#/requests', '#/attendance'];
  var MB_MID_ROUTES = [];
  function mbHeaderMode(activeHash) {
    /* หน้าตาแอปมือถือเหมือนกันทุก Role (USER · ADMIN · SUPER_ADMIN)
       เพราะ Bottom Navigation 4 เมนูก็แสดงทุก Role อยู่แล้ว
       สิทธิ์การใช้งานยังแยกตาม Role ที่ Route Guard เหมือนเดิม ไม่ได้แตะ */
    if (!currentUser()) return '';
    if (MB_BRAND_ROUTES.indexOf(activeHash) >= 0) return 'brand';
    if (MB_MID_ROUTES.indexOf(activeHash) >= 0) return 'mid';
    if (MB_HIDE_ROUTES.indexOf(activeHash) >= 0) return 'hide';
    return '';
  }

  function shellSignature(activeHash) { // ทุกอย่างที่มีผลต่อหน้าตา shell ยกเว้นตัว active
    var u = currentUser();
    var g = groupOfRoute(activeHash);
    return [u ? u.id : '', u ? u.role : '', !!uiState.sidebarCollapsed, pendingCount(),
      _ntUnread,                                    // แจ้งเตือน: นับจาก Supabase (njhr_notify_unread)
      mbHeaderMode(activeHash),                     // โหมดหัวแถบมือถือ — เปลี่ยนแล้วต้อง render ใหม่จริง
      g ? g.key : ''].join('|');   // สถานะ accordion ไม่อยู่ใน signature — ปรับด้วย accApply() แทนการ render ใหม่
  }
  // PERF: เปลี่ยนหน้าแล้ว shell เหมือนเดิม → อัปเดตแค่สถานะ active ไม่สร้าง DOM ใหม่ทั้งชุด
  function shellUpdateActive(activeHash) {
    var sb = document.getElementById('sidebar');
    if (!sb) return false;
    sb.querySelectorAll('.menu-item.active').forEach(function (a) { a.classList.remove('active'); });
    // เมนูหนึ่งรายการอาจครอบหลาย Route (แท็บในหน้าเดียวกัน) จึงเทียบด้วย menuMatch ไม่ใช่ href ตรง ๆ
    if (MENU_TOP.r === activeHash) {
      var top = sb.querySelector('a.menu-item[href="' + MENU_TOP.r + '"]');
      if (top) top.classList.add('active');
    }
    MENU_GROUPS.forEach(function (g) {
      g.items.forEach(function (m) {
        if (!menuMatch(m, activeHash)) return;
        var lnk = sb.querySelector('.menu-cat[data-group="' + g.key + '"] a.menu-item[href="' + menuHref(m) + '"]');
        if (lnk) lnk.classList.add('active');
      });
    });
    document.querySelectorAll('.bn-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === activeHash);
    });
    // แถบเมนูล่างของหน้าลงเวลาใช้พื้นกรมท่า — ต้องสลับคลาสในเส้นทางนี้ด้วย
    // ไม่งั้นเปลี่ยนหน้าในกลุ่มที่ shell signature เท่ากันแล้วคลาสจะค้าง
    var bnv = document.getElementById('bottom-nav');
    if (bnv) bnv.classList.toggle('bn-att', activeHash === '#/attendance');
    var t = document.getElementById('topbar-title');
    if (t && ROUTES[activeHash]) t.textContent = ROUTES[activeHash].title;
    accSyncToRoute(activeHash); accApply();   // เปลี่ยนหน้าแล้วเปิดเฉพาะกลุ่มของ Route นั้น
    return true;
  }
  function renderShell(activeHash) {
    var oldFly = document.getElementById('menu-flyout');
    if (oldFly) oldFly.remove(); // flyout ถูก append ไว้ที่ body ต้องเก็บกวาดเอง
    var sig = shellSignature(activeHash);
    if (sig === _shellSig && document.getElementById('main-view') && shellUpdateActive(activeHash)) return;
    _shellSig = sig;
    var app = document.getElementById('app');
    var u = currentUser(), e = currentEmp();
    var name = e ? e.firstName + ' ' + e.lastName : u.username;
    var collapsed = !!uiState.sidebarCollapsed;
    var pc = pendingCount();
    var unread = _ntUnread;                          // Supabase: njhr_notify_unread

    var mbMode = mbHeaderMode(activeHash);
    var mbBrand = mbMode === 'brand', mbTitleOnly = mbMode === 'mid';
    var mbHide = mbMode === 'hide';

    // เปิดเฉพาะหมวดของหน้าปัจจุบัน หมวดอื่นปิดทั้งหมด (State กลางค่าเดียว)
    accSyncToRoute(activeHash);

    function subLink(m) {
      var t = menuTitle(m), mb = menuBadgeOf(m, pc);
      return '<a href="' + menuHref(m) + '" class="menu-item sub-item' + (menuMatch(m, activeHash) ? ' active' : '') +
        (m.deskOnly ? ' only-desktop' : '') + '" data-tip="' + esc(t) + '">' +
        icon(m.i) + '<span class="menu-text">' + esc(t) + '</span>' +
        (mb > 0 ? '<span class="menu-badge">' + mb + '</span>' : '') + '</a>';
    }
    var menuHTML =
      '<a href="' + MENU_TOP.r + '" class="menu-item' + (MENU_TOP.r === activeHash ? ' active' : '') + '" data-tip="' + MENU_TOP.t + '">' +
      icon(MENU_TOP.i) + '<span class="menu-text">' + MENU_TOP.t + '</span></a>' +
      MENU_GROUPS.map(function (g) {
        var items = g.items.filter(menuVisible);
        if (!items.length) return ''; // ไม่มีสิทธิ์เมนูย่อยเลย → ไม่แสดงหัวหมวด
        var isOpen = uiState.openSidebarGroup === g.key;
        var hasActive = items.some(function (m) { return menuMatch(m, activeHash); });
        var gb = items.reduce(function (n, m) { return n + menuBadgeOf(m, pc); }, 0);
        var groupBadge = gb > 0 ? '<span class="menu-badge cat-badge">' + gb + '</span>' : '';
        return '<div class="menu-cat' + (isOpen ? ' open' : '') + '" data-group="' + g.key + '">' +
          '<button type="button" class="menu-item menu-cat-btn' + (hasActive ? ' has-active' : '') + '" data-cat="' + g.key + '"' +
          ' id="menu-cat-btn-' + g.key + '" aria-controls="menu-sub-' + g.key + '" aria-expanded="' + isOpen + '" data-tip="' + g.t + '">' +
          icon(g.i) + '<span class="menu-text">' + g.t + '</span>' + groupBadge +
          '<span class="cat-arrow" aria-hidden="true">' + icon('chevR') + '</span></button>' +
          '<div class="menu-sub" id="menu-sub-' + g.key + '" role="group" aria-labelledby="menu-cat-btn-' + g.key + '">' +
          items.map(subLink).join('') + '</div></div>';
      }).join('');

    /* USER เห็นเมนูชุดของตัวเอง — ผู้ดูแลยังเห็นเมนูหมวดเดิมทุกประการ */
    var isUser = u.role === 'USER';
    if (isUser) {
      menuHTML = '<div class="menu-group">' + USER_MENU.filter(function (m) {
        return !ROUTES[m.r] || canAccess(m.r);
      }).map(subLink).join('') + '</div>';
    }

    app.innerHTML =
      '<div class="layout' + (collapsed ? ' collapsed' : '') + (isUser ? ' user-shell' : '') + '">' +
      '<div class="drawer-overlay" id="drawer-overlay"></div>' +
      '<aside class="sidebar" id="sidebar">' +
      '  <div class="side-brand"><span class="brand-badge">NJ</span><div class="brand-txt"><b>NJ LOGISTIC</b><small>HR SYSTEM</small></div>' +
      '    <button class="btn-icon side-close" id="drawer-close" aria-label="ปิดเมนู">' + icon('x') + '</button></div>' +
      (isUser
        // การ์ดโปรไฟล์: ชื่อ–นามสกุล · รหัสพนักงาน · แผนก · กดได้ทั้งการ์ด
        ? '  <a href="#/profile" class="side-user side-user-card" id="side-profile">' + avatarHTML(name, 46) +
          '    <div class="side-user-txt"><b>' + esc(name) + '</b>' +
          '      <small>' + esc((e && e.code) || '—') + '</small>' +
          '      <small>' + esc((e && dept(e.deptId)) || '—') + '</small></div>' +
          '    <span class="cat-arrow" aria-hidden="true">' + icon('chevR') + '</span></a>'
        : '  <div class="side-user">' + avatarHTML(name, 42) +
          '    <div class="side-user-txt"><b>' + esc(name) + '</b><small><span class="dot-on"></span>' + ROLE_TH[u.role] + '</small></div></div>') +
      '  <nav class="side-menu">' + menuHTML +
      '    <div class="menu-group"><a href="javascript:void 0" id="menu-logout" class="menu-item" data-tip="ออกจากระบบ">' + icon('logout') + '<span class="menu-text">ออกจากระบบ</span></a></div>' +
      '  </nav>' +
      '  <button class="side-collapse" id="side-collapse" aria-label="ย่อเมนู">' + icon(collapsed ? 'chevR' : 'chevL') + '<span class="menu-text">ย่อเมนู</span></button>' +
      '</aside>' +
      '<div class="content">' +
      /* หัวแถบ — Desktop คงเดิมทุกอย่าง (กฎมือถืออยู่ใน @media เท่านั้น)
         มือถือพนักงาน: brand = โลโก้ NJL + NJL HR · mid = ชื่อหน้ากลางแถบ */
      '  <header class="topbar' + (mbBrand ? ' tb-mb' : '') + (mbTitleOnly ? ' tb-mid' : '') +
             (mbHide ? ' tb-hide' : '') + '">' +
      '    <button class="btn-icon only-mobile" id="hamburger" aria-label="เปิดเมนู">' + icon('menu') + '</button>' +
      (mbBrand
        ? '    <span class="tb-brand only-mobile"><span class="tb-logo">NJL</span><b>NJL HR</b></span>'
        : '') +
      '    <h2 class="page-title" id="topbar-title">' + ROUTES[activeHash].title + '</h2>' +
      '    <div class="topbar-right">' +
      '      <button class="btn-icon bell" id="btn-bell" aria-label="การแจ้งเตือน">' + icon('bell') + (unread ? '<span class="bell-badge">' + unread + '</span>' : '') + '</button>' +
      '      <a href="#/profile" class="topbar-user">' + avatarHTML(name, 34) + '<span class="only-desktop">' + esc(e ? e.nickname || e.firstName : u.username) + '</span></a>' +
      '    </div></header>' +
      '  <main class="main-view" id="main-view"></main>' +
      '</div>' +
      '<nav class="bottom-nav' + (activeHash === '#/attendance' ? ' bn-att' : '') + '" id="bottom-nav">' +
      bottomNavItems()
        .map(function (b) { return '<a href="' + b[0] + '" class="bn-item' + (bnActive(b[0], activeHash) ? ' active' : '') + '">' + icon(b[2]) + '<span>' + b[1] + '</span></a>'; }).join('') +
      '</nav></div>';

    document.getElementById('hamburger').onclick = function () {
      document.getElementById('sidebar').classList.add('drawer-open');
      document.getElementById('drawer-overlay').classList.add('open');
      document.body.classList.add('sidebar-open');       // ล็อกหน้าหลัง (ไม่ใช้ :has)
    };
    function closeDrawer() {
      document.getElementById('sidebar').classList.remove('drawer-open');
      document.getElementById('drawer-overlay').classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
    window.njhrCloseDrawer = closeDrawer;                 // ให้ route/logout/resize เรียกได้
    document.getElementById('drawer-overlay').onclick = closeDrawer;
    document.getElementById('drawer-close').onclick = closeDrawer;
    // เลือกเมนูแล้วปิดลิ้นชักเอง (มือถือ) — ไม่ยิง RPC ใด ๆ เพิ่ม
    document.querySelectorAll('.side-menu a.menu-item, #side-profile').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    document.querySelectorAll('.side-menu a[href^="#/"]').forEach(function (a) { a.addEventListener('click', closeDrawer); });
    document.getElementById('side-collapse').onclick = function () {
      uiState.sidebarCollapsed = !uiState.sidebarCollapsed; saveUI(); render();
    };
    // เปิด-ปิดหมวดเมนู: โหมดปกติ toggle ในที่, โหมดย่อ (desktop) แสดง flyout ด้านขวา
    function closeFlyout() {
      var f = document.getElementById('menu-flyout');
      if (f) f.remove();
      document.removeEventListener('mousedown', flyoutOutside, true);
    }
    function flyoutOutside(ev) {
      var f = document.getElementById('menu-flyout');
      if (f && !f.contains(ev.target) && !ev.target.closest('.menu-cat-btn')) closeFlyout();
    }
    function openFlyout(btn, gKey) {
      var g = MENU_GROUPS.find(function (x) { return x.key === gKey; });
      var items = g.items.filter(menuVisible);
      var wasOpen = document.getElementById('menu-flyout');
      closeFlyout();
      if (wasOpen && wasOpen.dataset.key === gKey) return; // กดซ้ำ = ปิด
      var rect = btn.getBoundingClientRect();
      var f = document.createElement('div');
      f.id = 'menu-flyout'; f.dataset.key = gKey;
      // position:fixed เพื่อไม่ถูก overflow ของ sidebar ตัด
      f.style.top = Math.min(rect.top, window.innerHeight - (items.length * 44 + 56)) + 'px';
      f.style.left = rect.right + 8 + 'px';
      f.innerHTML = '<div class="flyout-title">' + g.t + '</div>' + items.map(function (m) {
        var t = menuTitle(m), mb = menuBadgeOf(m, pc);
        return '<a href="' + menuHref(m) + '" class="menu-item sub-item' + (menuMatch(m, activeHash) ? ' active' : '') + '">' +
          icon(m.i) + '<span class="menu-text">' + esc(t) + '</span>' +
          (mb > 0 ? '<span class="menu-badge">' + mb + '</span>' : '') + '</a>';
      }).join('');
      document.body.appendChild(f);
      f.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeFlyout); });
      document.addEventListener('mousedown', flyoutOutside, true);
    }
    document.querySelectorAll('.menu-cat-btn').forEach(function (btn) {
      btn.onclick = function () {
        var key = this.dataset.cat;
        var isDesktopCollapsed = uiState.sidebarCollapsed && window.innerWidth > 900;
        if (isDesktopCollapsed) { openFlyout(this, key); return; }
        accToggle(key);   // เปิดกลุ่มนี้ · ปิดกลุ่มอื่นทันที · กดซ้ำ = ยุบ
      };
    });
    document.getElementById('menu-logout').onclick = function () {
      confirmDialog('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่', 'ออกจากระบบ', function () { doLogout(false); }, true);
    };
    document.getElementById('btn-bell').onclick = function () { nav('#/notifications'); };
  }

