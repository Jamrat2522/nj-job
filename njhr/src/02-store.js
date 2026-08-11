  /* ================= STORE (Demo Repository) ================= */
  // Production: แทนที่ชั้นนี้ด้วย Supabase Client — View ไม่ต้องแก้
  var DB_KEY = 'njhr_db_v3', SES_KEY = 'njhr_session_v1', UI_KEY = 'njhr_ui_v1';
  var db = {}, session, uiState;

  // โครงข้อมูลว่างสำหรับ Production (ไม่มี mock-data.js) — ไม่ fallback ไปข้อมูล Demo เด็ดขาด
  // ชื่อบริษัทที่ถูกต้อง (แหล่งเดียว) — ตั้งค่าระบบยังแก้ได้ตามเดิม
  var NJ_COMPANY_NAME = 'N.J. LOGISTICS & FRUITS CO., LTD.';
  // ชื่อที่เคยสะกดผิด/ชื่อเดิม → อัปเดตให้ถูกครั้งเดียว (ชื่อที่ผู้ดูแลตั้งเองจะไม่ถูกแตะ)
  var NJ_COMPANY_LEGACY = [
    'N.J. LOGISTIC CO., LTD.', 'N.J. LOGISTICS CO., LTD.',
    'N.J. LOGISTIC & FRUITS CO., LTD.', 'N.J. LOGISTIC & FRUIT CO., LTD.',
    'N.J. LOGISTICS & FRUIT CO., LTD.'
  ];
  function njFixCompanyName() {
    var cur = String((db.settings && db.settings.companyName) || '').trim();
    if (!cur || NJ_COMPANY_LEGACY.indexOf(cur) >= 0) {
      db.settings.companyName = NJ_COMPANY_NAME;
      saveDB();
    }
  }
  // แยก "N.J." ออกจากส่วนที่เหลือ เพื่อจัดรูปแบบสีคนละสี (ข้อความชุดเดียว ไม่มีชื่อซ้ำใน DOM)
  function njCompanyParts() {
    var full = String(db.settings.companyName || NJ_COMPANY_NAME).trim();
    var m = full.match(/^(N\.J\.)\s*(.*)$/i);
    return m ? { prefix: m[1], rest: m[2] } : { prefix: '', rest: full };
  }

  function emptyDB() {
    return { version: 'prod', departments: [], employees: [], users: [], leaveTypes: [], balances: [],
      leaves: [], ots: [], corrections: [], attendance: [], payroll: [], announcements: [],
      holidays: [], audit: [], notifications: [], shifts: [], shiftMoves: [],
      settings: { companyName: NJ_COMPANY_NAME, workStart: '08:30', lateGrace: 15, geofenceRadius: 200 } };
  }
  // เติม key ที่ขาดให้ครบเสมอ — DB ที่บันทึกจากเวอร์ชันเก่าอาจไม่มี payroll/shifts ฯลฯ
  // ถ้าไม่เติม โค้ดที่เรียก db.payroll.filter(...) จะโยน TypeError แล้วทั้งหน้าจอว่างเปล่า
  function fillDbGaps() {
    var base = emptyDB(), changed = false;
    Object.keys(base).forEach(function (k) {
      if (db[k] === undefined || db[k] === null) { db[k] = base[k]; changed = true; }
    });
    if (db.settings) Object.keys(base.settings).forEach(function (k) {
      if (db.settings[k] === undefined) { db.settings[k] = base.settings[k]; changed = true; }
    });
    if (changed) saveDB();
  }
  /* แทนที่ "เนื้อใน" ของ db ตัวเดิม ไม่สร้าง object ใหม่ ----------
     chunk อื่น (dashboard / attendance / leave-form / ot / compat ฯลฯ) รับ db ผ่าน
     NJHR.compat.scope ตอนโหลด chunk ครั้งเดียว และ NJHR.compat.scope ถูกสร้างที่ท้าย IIFE
     ของ runtime/core.js ซึ่ง "หลัง" njhrBootOnce() ในกรณีที่ DOM พร้อมอยู่แล้ว
     ถ้า loadDB() สร้าง object ใหม่ ลำดับนี้จะทำให้ chunk อื่นได้ db ที่ผิดใบหรือ undefined
     โครงข้อมูลและค่าใน localStorage ไม่เปลี่ยนแปลงใด ๆ */
  function dbReplace(next) {
    Object.keys(db).forEach(function (k) { if (!(k in next)) delete db[k]; });
    Object.keys(next).forEach(function (k) { db[k] = next[k]; });
  }
  function loadDB() {
    var seed = window.SEED;                       // มีเฉพาะ environment=development
    try {
      var raw = lsGet(DB_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (!seed || parsed.version === seed.version) { dbReplace(parsed); return; }
      }
    } catch (e) { /* ข้อมูลเสีย → เริ่มใหม่ */ }
    dbReplace(seed ? JSON.parse(JSON.stringify(seed)) : emptyDB());
    saveDB();
  }
  // localStorage อาจถูกบล็อกในบางสภาพแวดล้อม (เช่นเปิด file:// ที่ถูกจำกัดสิทธิ์)
  // → ใช้ตัวเก็บสำรองในหน่วยความจำแทน เพื่อให้ระบบเปิดใช้งานได้เสมอ
  var memStore = {};
  var storageBlocked = false;
  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { storageBlocked = true; return memStore[k] != null ? memStore[k] : null; }
  }
  var lsLastError = '';
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); lsLastError = ''; return true; }
    catch (e) {
      // เดิมกลืน error เงียบ ๆ แล้ว fallback ไปหน่วยความจำ → หน้าจอขึ้นว่าบันทึกสำเร็จ แต่ Refresh แล้วข้อมูลหาย
      storageBlocked = true; memStore[k] = v;
      lsLastError = (e && e.name === 'QuotaExceededError')
        ? 'พื้นที่จัดเก็บในเบราว์เซอร์เต็ม — ข้อมูลนี้ยังไม่ถูกบันทึกถาวร'
        : 'บันทึกข้อมูลลงเบราว์เซอร์ไม่สำเร็จ';
      return false;
    }
  }
  function lsRemove(k) {
    try { localStorage.removeItem(k); } catch (e) { storageBlocked = true; delete memStore[k]; }
  }
  function saveDB() { bumpIdx(); return lsSet(DB_KEY, JSON.stringify(db)); }
  // เรียกหลัง saveDB() ในจุดที่ผู้ใช้ต้องรู้ทันทีว่าบันทึกไม่สำเร็จ
  function saveDbGuard() {
    if (!lsLastError) return true;
    toast(lsLastError, 'error');
    return false;
  }
  function loadSession() { try { session = JSON.parse(lsGet(SES_KEY)); } catch (e) { session = null; } }
  function saveSession() { if (session) lsSet(SES_KEY, JSON.stringify(session)); else lsRemove(SES_KEY); }
  function loadUI() { try { uiState = JSON.parse(lsGet(UI_KEY)) || {}; } catch (e) { uiState = {}; } }
  function saveUI() { lsSet(UI_KEY, JSON.stringify(uiState)); }

  // -------- lookups
  // ---- Index cache (PERF): แทนการ scan array ซ้ำในลูปเรนเดอร์ — ค่าที่คืนเป็น object เดิม ไม่ใช่สำเนา
  var _idxVer = 0, _idx = null;
  function bumpIdx() { _idxVer++; }               // เรียกทุกครั้งที่ข้อมูลเปลี่ยน (ใน saveDB)
  function idx() {
    if (_idx && _idx.v === _idxVer) return _idx;
    var m = { v: _idxVer, emp: {}, dept: {}, lt: {}, user: {}, bal: {}, resv: {} };
    db.employees.forEach(function (e) { m.emp[e.id] = e; });
    db.departments.forEach(function (d) { m.dept[d.id] = d; });
    db.leaveTypes.forEach(function (t) { m.lt[t.id] = t; });
    db.users.forEach(function (u) { m.user[u.id] = u; });
    (db.balances || []).forEach(function (b) { m.bal[b.empId + '|' + b.typeId] = b; });
    // ยอดวันลาที่ค้างอนุมัติ: รวมครั้งเดียว O(n) แทนการ filter ทั้งก้อนต่อ 1 การ์ด
    (db.leaves || []).forEach(function (l) {
      if (l.status !== 'PENDING') return;
      var k = l.empId + '|' + l.typeId;
      m.resv[k] = (m.resv[k] || 0) + (l.days || 0) + (l.hours || 0) / 8;
    });
    _idx = m;
    return m;
  }
  function emp(id) { return idx().emp[id]; }
  function empName(id) { var e = emp(id); return e ? e.firstName + ' ' + e.lastName : '—'; }
  function dept(id) {
    var d = idx().dept[id];
    if (d) return d.name;
    var ce = currentEmp();
    return (ce && ce.sbOnly && ce.deptName) ? ce.deptName : '—';
  }
  function leaveType(id) { return idx().lt[id]; }
  function userById(id) { return idx().user[id]; }
  /* ยุบ Role ให้เหลือ 3 ค่าที่ระบบ HR ใช้จริง
     SUPER_ADMIN และ ADMIN คงเดิม · ค่าอื่นทั้งหมดเป็น USER */
  function normRole(v) {
    var r = String(v || '').toUpperCase();
    return (r === 'SUPER_ADMIN' || r === 'ADMIN') ? r : 'USER';
  }
  function currentUser() {
    if (session && session.src === 'supabase') {
      if (!sbUser) sbLoadUser();
      if (sbUser && sbUser.user_id === session.userId) {
        // ระบบ HR ใช้ 3 Role เท่านั้น — SUPER_ADMIN / ADMIN / USER
        // ค่าอื่นทั้งหมด (EMPLOYEE · STAFF · ACCOUNT · HR · MANAGER) ยุบรวมเป็น USER
        // ทำที่จุดเดียวนี้ ทุกหน้าจึงเห็นค่าเดียวกันโดยไม่ต้องแก้รายหน้า
        var r = normRole(sbUser.role);
        return { id: sbUser.user_id, username: sbUser.username, role: r, empId: sbUser.employee_id,
                 active: true, fullName: sbUser.full_name, department: sbUser.department, sb: sbUser };
      }
      return null;
    }
    return session ? userById(session.userId) : null;
  }
  function currentEmp() {
    var u = currentUser();
    if (!u || !u.empId) return null;
    var e = emp(u.empId);
    if (e) return e;
    // Login ด้วย USER จริงจาก Supabase แต่ข้อมูล HR ของพนักงานคนนี้ยังไม่ถูกย้ายมา
    // → สร้าง object จากฟิลด์จริงที่ RPC ส่งมาเท่านั้น (ไม่กรอกตัวเลขขึ้นเอง) กันหน้าจอพัง
    if (u.sb) {
      var nm = String(u.sb.emp_name || u.sb.full_name || u.username).trim().split(/\s+/);
      return { id: u.sb.employee_id, code: u.sb.emp_code || '-', title: '',
        firstName: nm[0] || u.username, lastName: nm.slice(1).join(' '), nickname: '',
        deptId: '', position: u.sb.emp_position || '', hireDate: '',
        status: u.sb.emp_status || 'ACTIVE', empType: '', phone: '', email: u.sb.email || '',
        shift: '', shiftId: '', baseSalary: 0, allowance: 0, bank: '', account: '',
        deptName: u.sb.emp_department || '', sbOnly: true };
    }
    return null;
  }
  function balance(empId, typeId) {
    var k = empId + '|' + typeId;
    var b = idx().bal[k];
    if (!b) {
      b = { empId: empId, typeId: typeId, year: new Date().getFullYear(), quota: (leaveType(typeId) || {}).quota || 0, used: 0 };
      db.balances.push(b); idx().bal[k] = b; // พฤติกรรมเดิม: สร้างยอดใหม่ถ้ายังไม่มี
    }
    return b;
  }
  function reservedDays(empId, typeId) {
    return idx().resv[empId + '|' + typeId] || 0; // ค่าเท่าเดิม แต่ใช้ index ที่รวมไว้แล้ว
  }
  function remainDays(empId, typeId) {
    var b = balance(empId, typeId);
    return Math.round((b.quota - b.used - reservedDays(empId, typeId)) * 100) / 100;
  }
  function pendingCount() {
    return _lvPending +                                    // ใบลา: นับจาก Supabase (njhr_leave_queue)
      db.ots.filter(function (o) { return o.status === 'PENDING'; }).length +
      db.corrections.filter(function (c) { return c.status === 'PENDING'; }).length;
  }
  function audit(action, detail) {
    var u = currentUser();
    db.audit.unshift({ at: nowStamp(), by: u ? u.username : 'system', action: action, detail: detail });
    saveDB();
  }
  function notify(userId, title, body, link) {
    db.notifications.unshift({ id: uid('N'), userId: userId, title: title, body: body, link: link || '#/dashboard', read: false, at: nowStamp() });
  }
  function notifyApprovers(title, body, link) {
    db.users.filter(function (u) { return ['SUPER_ADMIN', 'ADMIN'].indexOf(u.role) >= 0 && u.active; })
      .forEach(function (u) { notify(u.id, title, body, link); });
  }
  function userOfEmp(empId) { return db.users.find(function (u) { return u.empId === empId; }); }

