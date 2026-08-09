  /* ================= CORE SHARED (ย้ายมาจาก View Module) =================
     ฟังก์ชันในบล็อกนี้ถูกย้ายเข้ามาโดยไม่แก้เนื้อในแม้แต่ตัวอักษรเดียว
     เหตุผลของแต่ละตัวระบุใน RUNTIME_SPLIT_REPORT.md §Shared Function

       emptyState / statusBadge  (เดิม 07)  — 7 และ 2 chunk อื่นเรียกใช้
       startLiveClock + clockTimer (เดิม 07) — dashboard และ compat เรียกทั้งคู่
       empBE                     (เดิม 08)  — dashboard เรียก จึงข้ามขอบเขต chunk
       shGet/shOf/shTime/shOfAtt/shAttToday (เดิม 12) — dashboard เรียก shAttToday
       shMigrate                 (เดิม 12)  — njhrBootOnce() เรียกตอน boot
       refreshNotifyBadge + _ntUnread (เดิม 13) — njhrStartAfterSession() เรียกตอน boot
                                                  และ refreshMenuBadge() (05) อ่าน _ntUnread
     ตัวแก้ไข Shift (shRender/shMigrateTool/viewShifts) ยังอยู่ใน compat ตามเดิม
     ================================================================= */
  var clockTimer = null;
  var _ntUnread = 0;
  var _docPending = 0;          // Badge "เอกสารของฉัน" — มาจาก njhr_doc_my_pending เท่านั้น

  function emptyState(msg) { return '<div class="empty">' + icon('info') + '<p>' + esc(msg) + '</p></div>'; }
  function statusBadge(st) {
    var map = {
      PENDING: ['รออนุมัติ', 'warn'], APPROVED: ['อนุมัติแล้ว', 'ok'], REJECTED: ['ไม่อนุมัติ', 'bad'],
      CANCELLED: ['ยกเลิกแล้ว', 'mut'], COMPLETED: ['เสร็จสิ้น', 'info'], NEED_MORE_INFO: ['ขอข้อมูลเพิ่ม', 'info'],
      ACTIVE: ['ทำงานอยู่', 'ok'], SUSPENDED: ['พักงาน', 'warn'], RESIGNED: ['ลาออกแล้ว', 'mut'],
      PRESENT: ['ปกติ', 'ok'], LATE: ['มาสาย', 'warn'], DRAFT: ['แบบร่าง', 'mut'],
      CALCULATED: ['คำนวณแล้ว', 'info'], CONFIRMED: ['ยืนยันแล้ว', 'ok'], PAID: ['จ่ายแล้ว', 'ok']
    };
    var m = map[st] || [st, 'mut'];
    return '<span class="badge badge-' + m[1] + '">' + m[0] + '</span>';
  }
  function startLiveClock() {
    clearInterval(clockTimer);
    function tick() {
      var elC = document.getElementById('live-clock');
      if (!elC) { clearInterval(clockTimer); return; }
      var d = new Date();
      elC.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    tick(); clockTimer = setInterval(tick, 1000);
  }
  function empBE(iso) {
    var p2 = String(iso || '').split('-');
    return p2.length === 3 ? p2[2] + '/' + p2[1] + '/' + (parseInt(p2[0], 10) + 543) : '—';
  }
  function shGet(id) { return (db.shifts || []).find(function (x) { return x.id === id; }); }
  function shOf(e) { // อ่านกะของพนักงาน (fallback ปลอดภัย ไม่ error)
    return (e && shGet(e.shiftId)) || (db.shifts && db.shifts[0]) ||
      { id: '', name: 'กะปกติ', start: '08:30', end: '17:30', breakMins: 60, overnight: false, active: true };
  }
  function shTime(sh) { return sh.start + '–' + sh.end + (sh.overnight ? ' (วันถัดไป)' : ''); }
  function shOfAtt(e, att) { return (att && att.shiftId && shGet(att.shiftId)) || shOf(e); }
  function shAttToday(e) { // record สำหรับหน้าลงเวลา: วันนี้ หรือของเมื่อวานที่ยังไม่ปิด (กะข้ามวัน)
    var t = todayISO();
    var att = db.attendance.find(function (a) { return a.empId === e.id && a.date === t; });
    if (!att && shOf(e).overnight) {
      var y = new Date(t + 'T00:00:00');
      y.setDate(y.getDate() - 1);
      var yIso = y.getFullYear() + '-' + ('0' + (y.getMonth() + 1)).slice(-2) + '-' + ('0' + y.getDate()).slice(-2);
      att = db.attendance.find(function (a) { return a.empId === e.id && a.date === yIso && a.in && !a.out; }) || att;
    }
    return att;
  }
  function shMigrate() { // idempotent: รันซ้ำได้ ข้อมูลพนักงานเดิมไม่หาย
    if (!db.shifts) {
      var before = db.employees.length;
      db.shifts = [];
      var seen = {};
      db.employees.forEach(function (e) {
        var str = e.shift || '08:30-17:30';
        if (!seen[str]) {
          var p = str.split('-');
          seen[str] = {
            id: 'SH' + ('0' + (db.shifts.length + 1)).slice(-2),
            name: str === '08:30-17:30' ? 'กะปกติ' : 'กะ ' + str, // กะเดิมของระบบ = "กะปกติ"
            start: p[0] || '08:30', end: p[1] || '17:30', breakMins: 60, overnight: false,
            active: true, updatedAt: nowStamp(), updatedBy: 'migration'
          };
          db.shifts.push(seen[str]);
        }
      });
      if (!db.shifts.length) db.shifts.push({ id: 'SH01', name: 'กะปกติ', start: '08:30', end: '17:30', breakMins: 60, overnight: false, active: true, updatedAt: nowStamp(), updatedBy: 'migration' });
      db.employees.forEach(function (e) { e.shiftId = (seen[e.shift || '08:30-17:30'] || db.shifts[0]).id; });
      if (db.employees.length !== before) throw new Error('shift migration: จำนวนพนักงานเปลี่ยน');
      audit('SHIFT_MIGRATE', 'สร้างกะจากข้อมูลเดิม ' + db.shifts.length + ' กะ / ผูกพนักงาน ' + before + ' คน');
      saveDB();
    }
    if (db.shifts && db.shifts.length) {   // บั๊กเดิม: ถ้าไม่มีกะเลยจะอ่าน db.shifts[0].id ไม่ได้
      db.employees.forEach(function (e) { if (!e.shiftId) e.shiftId = db.shifts[0].id; }); // กันพนักงานตกหล่น
    }
    if (!db.shiftMoves) db.shiftMoves = [];   // ประวัติการย้ายกะ (เพิ่มใหม่ ข้อมูลเดิมไม่กระทบ)
    bumpIdx();
  }
  /* ---------- Badge "เอกสารของฉัน" ----------
     นับจาก njhr_doc_my_pending(p_token) ของจริงใน DB (สร้างใน H2)
     employee_id มาจาก token ฝั่งเซิร์ฟเวอร์ ไม่ส่งจาก browser
     ไม่นับจาก array ใด ๆ ใน browser และไม่เก็บลง localStorage */
  function refreshDocPending() {
    if (!sbToken() || !sbReady()) return Promise.resolve();
    return sbRpcList('njhr_doc_my_pending', { p_token: sbToken() }).then(function (rows) {
      var r = (rows && rows[0]) || {};
      var v = Number(r.pending) || 0;
      if (v === _docPending) return;
      _docPending = v;
      refreshMenuBadge();
    })['catch'](function () { /* โหลดไม่ได้ = ไม่แตะ Badge เดิม */ });
  }

  function refreshNotifyBadge() {
    if (!sbToken() || !sbReady()) return;
    sbRpc('njhr_notify_unread', { p_token: sbToken() }).then(function (n) {
      var v = Number(n) || 0;
      if (v === _ntUnread) return;
      _ntUnread = v;
      var b = document.querySelector('#btn-bell .bell-badge');
      if (b) { if (v) b.textContent = v; else b.remove(); }
      else if (v) {
        var bell = document.getElementById('btn-bell');
        if (bell) bell.insertAdjacentHTML('beforeend', '<span class="bell-badge">' + v + '</span>');
      }
    }).catch(function () { /* โหลดไม่ได้ = ไม่แตะ Badge เดิม */ });
  }


  /* ---------- Compatibility Adapter: สถานะที่ Core และ Feature Chunk เขียนร่วมกัน ----------
     3 ตัวนี้ถูกกำหนดค่าใหม่ (reassign) หลัง chunk โหลดไปแล้ว
     การส่งเข้า chunk แบบคัดลอกค่าจะได้ค่าค้าง จึงต้องอ่าน/เขียนผ่าน accessor ตัวเดียวกัน
     รายการจุดที่แก้ใน Feature Chunk ระบุครบใน RUNTIME_SPLIT_REPORT.md */
  Object.defineProperty(NJHR.state, 'sbUser',    { get: function () { return sbUser; } });
  Object.defineProperty(NJHR.state, 'lvPending', { get: function () { return _lvPending; }, set: function (v) { _lvPending = v; } });
  Object.defineProperty(NJHR.state, 'ntUnread',  { get: function () { return _ntUnread; }, set: function (v) { _ntUnread = v; } });
  Object.defineProperty(NJHR.state, 'docPending', { get: function () { return _docPending; }, set: function (v) { _docPending = v; } });
  NJHR.layout.refreshDocPending = refreshDocPending;

  /* ================= INIT ================= */
  window.addEventListener('hashchange', render);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open') && window.njhrCloseDrawer) window.njhrCloseDrawer();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && document.body.classList.contains('sidebar-open') && window.njhrCloseDrawer) window.njhrCloseDrawer();
  });
  /* เริ่มระบบเมื่อ DOM พร้อม
     index.html โหลด app.js แบบ dynamic script (async = false) แทน document.write
     สคริปต์แบบนี้ **ไม่บล็อก DOMContentLoaded** จึงมีโอกาสที่ event ยิงไปก่อน app.js ทำงาน
     ต้องตรวจ document.readyState ด้วย ไม่งั้นระบบจะไม่เริ่มเลยและได้หน้าจอว่าง
     ตัวแปร njhrBooted กันไม่ให้เริ่มซ้ำสองรอบ */
  var njhrBooted = false;
  function njhrBootOnce() {
    if (njhrBooted) return;
    njhrBooted = true;
    loadDB(); fillDbGaps(); loadSession(); loadUI(); shMigrate(); njFixCompanyName();
    holLoad();          // อุ่นแคชวันหยุดตั้งแต่เปิดแอป ให้ตัวคำนวณแบบ synchronous ใช้ได้ทันที
    if (storageBlocked) setTimeout(function () {
      toast('เบราว์เซอร์บล็อกการบันทึกข้อมูลในเครื่อง — ใช้งานได้ปกติ แต่ Refresh แล้วข้อมูลทดลองจะรีเซ็ต', 'info');
    }, 600);
    njhrBoot();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', njhrBootOnce);
  } else {
    njhrBootOnce();                       // DOM พร้อมแล้ว เริ่มทันที
  }

  // ลำดับเริ่มระบบ: อ่านค่า Supabase → ทดสอบการเชื่อมต่อ → เข้าสู่ระบบ/ตรวจ session → แสดงหน้าหลัก
  // แยกเป็นฟังก์ชันเพื่อให้ปุ่ม "ลองเชื่อมต่ออีกครั้ง" เรียกซ้ำได้โดยไม่ Refresh
  // (event listener ผูกไว้ระดับโมดูลแล้ว เรียกซ้ำจึงไม่เกิด listener ซ้ำ)
  function njhrBoot() {
    /* PERF: เดิมเป็น sbConnCheck() → sbSessionCheck() เรียงกันเป็นทอด
       บนเน็ตจริงจึงเสียเวลา 2 รอบเดินทางก่อนเห็นหน้าจอ
       เปลี่ยนเป็นยิงขนานกันเมื่อมี token — เงื่อนไขการผ่านเหมือนเดิมทุกประการ
       คือต้องผ่านทั้ง healthcheck และ session_check ก่อน render
       ต่างกันแค่เวลารวมลดจาก (A + B) เหลือ max(A, B) */
    var hasToken = sbToken() && sbReady();
    if (!hasToken) { sbConnCheck().then(njhrStart, renderConnError); return; }

    var connErr = null, sessErr = null, done = 0;
    function finish() {
      if (++done < 2) return;
      if (connErr) { renderConnError(connErr); return; }     // ปัญหาเชื่อมต่อมาก่อนเสมอ
      if (sessErr) {                                          // เชื่อมต่อได้ แต่ session ใช้ไม่ได้
        sbSetToken(''); sbClearUser(); session = null; saveSession();
        if (sessErr.message !== 'NO_SESSION') sbLoginMsg = sessErr.message;
        renderLogin();
        return;
      }
      njhrStartAfterSession();
    }
    sbConnCheck().then(function () { connErr = null; }, function (e) { connErr = e; }).then(finish);
    sbSessionCheck().then(function () { sessErr = null; }, function (e) { sessErr = e; }).then(finish);
  }
  /* ไม่มี token — เส้นทางเดิมทุกประการ */
  function njhrStart() {
    if (session && session.src === 'supabase') {
      session = null; saveSession(); sbClearUser();   // ไม่มี token = ไม่ถือว่ามีสิทธิ์
    }
    // ถ้าต้อง set hash ให้ hashchange เป็นผู้เรียก render (กัน render ซ้ำ 2 รอบ)
    if (!location.hash) location.hash = session ? '#/dashboard' : '#/login';
    else render();
  }

  /* มี token และผ่านทั้ง healthcheck + session_check แล้ว */
  function njhrStartAfterSession() {
    render(); refreshLeavePending(); refreshNotifyBadge(); refreshDocPending();
    if (!location.hash) location.hash = session ? '#/dashboard' : '#/login';
  }
