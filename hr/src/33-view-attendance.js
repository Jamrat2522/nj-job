  /* ================= VIEW: ATTENDANCE ================= */
  /* ================= VIEW: ลงเวลา =================
     บันทึกลงตาราง attendance บน Supabase ทุกครั้งผ่าน njhr_att_punch
     เวลาที่ใช้ตัดสินสายมาจากเซิร์ฟเวอร์และกะจริงของพนักงาน (njhr_shift_at) ไม่ใช่นาฬิกาเครื่อง */



  /* ---------- สรุปสถิติ + สถานะ + Export (อ่านจากข้อมูลที่ RPC ส่งมาแล้ว) ----------
     ไม่ยิง RPC เพิ่ม ไม่แตะสูตรคำนวณสายหรือชั่วโมงงาน */



  /* Export CSV จากข้อมูลที่แสดงอยู่ — ไม่ยิง RPC ใหม่ */

  /* ---------- ย้ายข้อมูลลงเวลาเดิมจากเครื่องนี้เข้า Supabase (ทำครั้งเดียว) ---------- */

  /* ---------- การ์ดพนักงาน (มือถือ) — ข้อมูลจริงจาก session + njhr_att_today ---------- */

  /* ---------- การ์ดสถานะ GPS (มือถือ) — ใช้ njhr_gf_check ตัวเดิม ---------- */





  /* ================= VIEW: REQUESTS (หน้าคำขอ — มือถือเป็นหลัก) =================
     รวมทางเข้าสำหรับ ยื่นใบลา · ขอ OT · ประวัติลาและ OT ไว้หน้าเดียว
     สิทธิ์การลาคงเหลือดึงจาก njhr_leave_balances (RPC เดิม ไม่แตะสูตรใด ๆ)
     ไม่สร้างระบบลา/OT ใหม่ — เป็นหน้าทางเข้าไปยังหน้าเดิมทั้งหมด */

  // จับคู่ประเภทการลาที่ต้องโชว์ 3 การ์ดตามแบบ กับชื่อประเภทจริงในฐานข้อมูล
  /* ================= ATTENDANCE =================
     ย้ายมาจาก 09-view-attendance.js โดยไม่แก้เนื้อใน ================= */
  var attState = { seq: 0, today: null, history: [], loading: false };

  var attFaceTried = false;              // กันโหลด face.js ซ้ำ

  var attRange = '14';                   // ช่วงประวัติ: 7 / 14 / 30 วัน

  function attHM(t) {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('th-TH',
      { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
  }

  /* ---------- ตัวโหลด Action Module ของหน้าลงเวลา ---------- */
  function attOpenAction(mod, btn, fn) {
    if (!btn || btn.getAttribute('data-busy') === '1') return;
    var navId = NJHR.router.navId(), route = NJHR.state.currentRoute;
    function ok() { return navId === NJHR.router.navId() && route === NJHR.state.currentRoute && !!currentUser(); }
    if (NJHR.modules.isLoaded(mod)) { if (ok()) fn(); return; }
    var html = btn.innerHTML, dis = btn.disabled;
    btn.setAttribute('data-busy', '1'); btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    function restore() { btn.removeAttribute('data-busy'); btn.disabled = dis; btn.innerHTML = html; }
    NJHR.modules.load(mod).then(function () { restore(); if (ok()) fn(); })['catch'](function (e) {
      restore();
      try { console.error('[MODULE] ' + (e && e.message ? e.message : e)); } catch (e2) {}
      if (ok()) toast('ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่', 'error');
    });
  }

  function viewAttendance(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++attState.seq;
    el.innerHTML =
      '<div class="card clock-card">' +
      '<div class="mb-lbl only-mobile">เวลาปัจจุบัน</div>' +
      '<div class="clock-now" id="live-clock">--:--:--</div>' +
      '<div class="clock-date" id="att-who">' + esc(fmtDate(todayISO())) + '</div>' +
      '<div class="clock-status" id="att-status"><span class="spinner"></span> กำลังโหลด…</div>' +
      // การ์ดพนักงาน + การ์ดสถานะ GPS — แสดงเฉพาะมือถือตามแบบที่กำหนด
      '<div class="mb-emp only-mobile" id="att-emp"></div>' +
      '<div class="mb-gps only-mobile" id="att-gps">' +
      '<span class="mb-gps-ic">' + icon('mapPin') + '</span>' +
      '<span class="grow"><b>กำลังตรวจตำแหน่ง…</b><small>รอสัญญาณ GPS</small></span></div>' +
      '<div class="clock-btns">' +
      '<button class="btn btn-primary btn-lg" id="att-in" disabled>' + icon('login') + ' เข้างาน</button>' +
      '<button class="btn btn-dark btn-lg" id="att-out" disabled>' + icon('logout') + ' ออกงาน</button>' +
      '</div>' +
      '<div class="form-error" id="att-err" role="alert" style="white-space:pre-line"></div></div>' +
      '<div class="card att-hcard"><div class="card-head att-hhead"><h3>ประวัติการลงเวลา</h3>' +
      '<span class="grow"></span>' +
      '<span class="gf-seg" id="att-range">' +
      [['7', '7 วัน'], ['14', '14 วัน'], ['30', '30 วัน']].map(function (r) {
        return '<button type="button" class="gf-segb' + (attRange === r[0] ? ' on' : '') +
          '" data-attr="' + r[0] + '">' + r[1] + '</button>';
      }).join('') + '</span>' +
      '<button class="btn btn-ghost btn-sm" id="att-csv">' + icon('download') + ' Export CSV</button>' +
      '<button class="btn btn-ghost btn-sm" id="att-fix">' + icon('clock') + ' ลงชื่อย้อนหลัง</button></div>' +
      '<div id="att-stats" class="att-stats"></div>' +
      '<div id="att-hist"><div class="ep-state"><span class="spinner"></span> กำลังโหลด…</div></div></div>' +
      '<div id="att-mig"></div>';

    startLiveClock();
    attRenderEmpCard();
    attCheckGps();
    document.getElementById('att-in').onclick = function () { attPunch('IN', el); };
    document.getElementById('att-out').onclick = function () { attPunch('OUT', el); };
    // Runtime Split — แบบฟอร์มแก้ไขเวลาย้อนหลังอยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('att-fix').onclick = function () {
      attOpenAction('attendance-correction', this, function () { NJHR.features.attendanceCorrection.open(); });
    };
    document.getElementById('att-range').onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-attr]') : null;
      if (!b) return;
      attRange = b.dataset.attr;              // จำเฉพาะระหว่างใช้งาน ไม่บันทึกที่ใด
      viewAttendance(el);
    };
    document.getElementById('att-csv').onclick = function () { attExportCsv(); };
    attLoad(el, seq);
    attMigrateCard(el);
    attFaceWarmup();                          // อุ่นเครื่องระบบสแกนใบหน้าหลังหน้าแสดงผลแล้ว
  }

  /* ---------- อุ่นเครื่องระบบสแกนใบหน้า (เฉพาะหน้าลงเวลา) ----------
     ทำหลัง Critical UI แสดงแล้ว และเลื่อนไปช่วงที่เบราว์เซอร์ว่าง จึงไม่ทำให้หน้านี้ช้าลง
     ใช้ loadScriptOnce (Promise cache ตัวเดิม) + NJHRFace.warmup ซึ่งใช้ State กลางของ face.js
     จึงไม่โหลดซ้ำและกันการโหลดพร้อมกันได้เอง · ล้มเหลวเงียบ ไม่กระทบหน้าใช้งาน
     ตอนกดปุ่มลงเวลาจริงยังใช้เส้นทางเดิมทุกอย่าง */
  var attFaceWarmed = false;
  function attFaceWarmup() {
    if (attFaceWarmed) return;
    attFaceWarmed = true;
    var idle = window.requestIdleCallback ||
      function (fn) { return setTimeout(fn, 900); };
    idle(function () {
      try {
        if (window.NJHRFace) { window.NJHRFace.warmup(); return; }
        loadScriptOnce('face', njAsset('face.js'), 'NJHRFace')
          .then(function () { if (window.NJHRFace) window.NJHRFace.warmup(); })
          ['catch'](function () { attFaceWarmed = false; });
      } catch (e) { attFaceWarmed = false; }
    }, { timeout: 3000 });
  }

  var TH_DAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  function attStatusInfo(r) {
    var k = String(r.status || '').toUpperCase();
    if (k === 'LATE' || r.late_min > 0) return { text: 'มาสาย', badge: 'badge-warn', cls: 'late' };
    if (k === 'ABSENT') return { text: 'ขาดงาน', badge: 'badge-bad', cls: 'absent' };
    if (k === 'LEAVE') return { text: 'ลางาน', badge: 'badge-info', cls: 'leave' };
    if (k === 'HOLIDAY') return { text: 'วันหยุด', badge: 'badge-mut', cls: 'holiday' };
    if (!r.check_out) return { text: 'ยังไม่ออกงาน', badge: 'badge-mut', cls: 'open' };
    return { text: 'ปกติ', badge: 'badge-ok', cls: 'ok' };
  }

  function attRenderStats(rows) {
    var box = document.getElementById('att-stats');
    if (!box) return;
    var late = 0, absent = 0, ok = 0, hrs = 0, lateMin = 0;
    (rows || []).forEach(function (r) {
      var st = attStatusInfo(r);
      if (st.cls === 'late') { late++; lateMin += Number(r.late_min) || 0; }
      else if (st.cls === 'absent') absent++;
      else if (st.cls === 'ok') ok++;
      hrs += Number(r.work_hours) || 0;
    });
    box.innerHTML = [
      ['\u2705', 'มาปกติ', ok + ' วัน', 'k-green'],
      ['\u23F0', 'มาสาย', late + ' วัน', late ? 'k-warn' : 'k-grey'],
      ['\u274C', 'ขาดงาน', absent + ' วัน', absent ? 'k-red' : 'k-grey'],
      ['\u{1F552}', 'ชั่วโมงรวม', (Math.round(hrs * 10) / 10) + ' ชม.', 'k-blue']
    ].map(function (c) {
      return '<div class="att-stat ' + c[3] + '"><span class="att-stat-ic">' + c[0] + '</span>' +
        '<div class="grow"><small>' + c[1] + '</small><b>' + c[2] + '</b></div></div>';
    }).join('') +
      (lateMin ? '<div class="att-stat-note">รวมมาสาย ' + lateMin + ' นาที</div>' : '');
  }

  function attExportCsv() {
    var rows = attState.history || [];
    if (!rows.length) { toast('ยังไม่มีข้อมูลให้ Export', 'info'); return; }
    var head = ['วันที่', 'วัน', 'เข้างาน', 'ออกงาน', 'ชั่วโมง', 'สาย (นาที)', 'สถานะ'];
    var lines = [head.join(',')];
    rows.forEach(function (r) {
      var iso = String(r.work_date).slice(0, 10);
      var dt = new Date(iso + 'T00:00:00');
      lines.push([
        rptDateBE(iso), TH_DAYS_FULL[dt.getDay()],
        attHM(r.check_in), attHM(r.check_out),
        (r.work_hours == null ? '' : r.work_hours),
        (r.late_min > 0 ? r.late_min : ''),
        attStatusInfo(r).text
      ].map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ประวัติลงเวลา-' + attRange + 'วัน-' + todayISO() + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function attLocalRows() {
    var out = [];
    (db.attendance || []).forEach(function (a) {
      var e = emp(a.empId);
      if (!e || !e.code || !a.date) return;
      out.push({ emp_code: String(e.code), date: String(a.date),
        in: a.in || '', out: a.out || '', status: a.status || '' });
    });
    return out;
  }

  function attMigrateCard(el) {
    var box = document.getElementById('att-mig');
    if (!box) return;
    if (['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) < 0) { box.innerHTML = ''; return; }
    var rows = attLocalRows();
    if (!rows.length) { box.innerHTML = ''; return; }
    box.innerHTML =
      '<div class="card"><div class="ot-warn">พบข้อมูลลงเวลาเดิมที่ยังอยู่ในเบราว์เซอร์เครื่องนี้ <b>' +
      rows.length + ' รายการ</b> — ข้อมูลนี้เครื่องอื่นมองไม่เห็น ' +
      'กรุณาย้ายเข้าฐานข้อมูลก่อนเลิกใช้ที่เก็บในเครื่อง</div>' +
      '<div class="toolbar"><span class="grow"></span>' +
      '<button class="btn btn-ghost" id="attmig-check">ตรวจสอบก่อนย้าย</button>' +
      '<button class="btn btn-primary" id="attmig-run">ย้ายเข้าฐานข้อมูล</button></div>' +
      '<div id="attmig-out"></div></div>';
    document.getElementById('attmig-check').onclick = function () { run(this, true); };
    document.getElementById('attmig-run').onclick = function () {
      confirmDialog('ย้ายข้อมูลลงเวลาเข้าฐานข้อมูล',
        'ย้าย <b>' + rows.length + ' รายการ</b> จากเครื่องนี้เข้าฐานข้อมูลกลาง<br>' +
        '<small class="muted">ไม่ทับข้อมูลที่มีอยู่แล้วในระบบ · ทำซ้ำได้ไม่เกิดข้อมูลซ้ำ</small>',
        'ย้ายข้อมูล', function () { return run(document.getElementById('attmig-run'), false); });
    };

    function run(btn, dry) {
      if (btn.disabled) return;
      var label = btn.innerHTML, out = document.getElementById('attmig-out');
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังทำงาน…';
      return sbRpcList('njhr_att_migrate', {
        p_token: sbToken(), p_rows: rows, p_dry_run: dry, p_overwrite: false
      }).then(function (res) {
        var ins = res.filter(function (x) { return x.action === 'INSERT'; }).length;
        var skp = res.filter(function (x) { return x.action === 'SKIP'; }).length;
        var err = res.filter(function (x) { return x.action === 'ERROR'; });
        out.innerHTML =
          '<div class="bal-grid">' +
          [['ทั้งหมด', res.length], ['นำเข้าใหม่', ins], ['ข้าม (มีอยู่แล้ว)', skp], ['ผิดพลาด', err.length]]
            .map(function (x) { return '<div class="bal-item"><div class="bal-top"><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>'; }).join('') +
          '</div>' +
          (err.length
            ? '<div class="table-wrap empi-table"><table><thead><tr><th>แถว</th><th>รหัส</th><th>วันที่</th><th>เหตุผล</th></tr></thead><tbody>' +
              err.map(function (x) {
                return '<tr class="row-bad"><td>' + x.row_no + '</td><td>' + esc(x.emp_code || '—') + '</td>' +
                  '<td>' + esc(x.work_date || '—') + '</td><td>' + esc(x.message) + '</td></tr>';
              }).join('') + '</tbody></table></div>'
            : '');
        if (!dry) {
          toast('ย้ายข้อมูลลงเวลาแล้ว · ใหม่ ' + ins + ' · ข้าม ' + skp +
            (err.length ? ' · ผิดพลาด ' + err.length : ''));
          // ย้ายสำเร็จครบแล้วจึงล้างที่เก็บในเครื่อง (เหลือแถวผิดไว้ให้ตรวจ)
          if (!err.length) {
            db.attendance = [];
            saveDB();
            toast('ล้างข้อมูลลงเวลาในเครื่องแล้ว — ระบบใช้ฐานข้อมูลกลางอย่างเดียว', 'info');
          }
          viewAttendance(el);
        }
      }).catch(function (er) {
        console.error('[ATTENDANCE] njhr_att_migrate ล้มเหลว:', er);
        out.innerHTML = '<div class="form-error">' + esc(er.message || 'ย้ายข้อมูลไม่สำเร็จ') + '</div>';
      }).then(function () { btn.disabled = false; btn.innerHTML = label; });
    }
  }

  function attRenderEmpCard() {
    var box = document.getElementById('att-emp');
    if (!box) return;
    var u = currentUser() || {};
    var t = attState.today || {};
    var name = u.emp_name || u.username || '';
    box.innerHTML = avatarHTML(name, 46) +
      '<div class="grow"><b>' + esc(name) + '</b>' +
      '<small>รหัสพนักงาน: ' + esc(u.emp_code || '—') + '</small>' +
      '<small>แผนก: ' + esc(u.department_name || '—') + '</small>' +
      '<small>กะงาน: ' + (t.shift_name
        ? esc(t.shift_name) + ' ' + String(t.shift_start).slice(0, 5) + ' - ' + String(t.shift_end).slice(0, 5)
        : '—') + '</small></div>';
  }

  function attCheckGps() {
    var box = document.getElementById('att-gps');
    if (!box || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (p) {
      sbRpc('njhr_gf_check', {
        p_token: sbToken(), p_lat: p.coords.latitude, p_lng: p.coords.longitude,
        p_accuracy: p.coords.accuracy
      }).then(function (r) {
        var inside = !!(r && r.pass);
        var b2 = document.getElementById('att-gps');
        if (!b2) return;
        b2.className = 'mb-gps only-mobile ' + (inside ? 'ok' : 'bad');
        b2.innerHTML = '<span class="mb-gps-ic">' + icon('mapPin') + '</span>' +
          '<span class="grow"><b>' + (inside ? 'อยู่ในพื้นที่บริษัท' : 'อยู่นอกพื้นที่บริษัท') + '</b>' +
          '<small>' + esc((r && r.geofence_name) || 'สัญญาณ GPS') +
          ' · Accuracy: ' + Math.round(p.coords.accuracy) + ' เมตร</small></span>';
      }).catch(function () {
        var b2 = document.getElementById('att-gps');
        if (b2) b2.innerHTML = '<span class="mb-gps-ic">' + icon('mapPin') + '</span>' +
          '<span class="grow"><b>ตรวจพื้นที่ไม่สำเร็จ</b><small>ลองใหม่อีกครั้ง</small></span>';
      });
    }, function () {
      var b2 = document.getElementById('att-gps');
      if (b2) {
        b2.className = 'mb-gps only-mobile bad';
        b2.innerHTML = '<span class="mb-gps-ic">' + icon('mapPin') + '</span>' +
          '<span class="grow"><b>ไม่สามารถอ่าน GPS ได้</b><small>เปิดสิทธิ์ตำแหน่งแล้วลองใหม่</small></span>';
      }
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  }

  function attLoad(el, seq) {
    var errEl = document.getElementById('att-err');
    if (errEl) errEl.textContent = '';
    sbRpc('njhr_att_today', { p_token: sbToken() }).then(function (t) {
      if (seq !== attState.seq) return;
      attState.today = t || null;
      var who = document.getElementById('att-who'), st = document.getElementById('att-status');
      var u = currentUser();
      if (who) who.textContent = fmtDate(todayISO()) + ' · ' + (u.emp_name || u.username) +
        (t && t.shift_name ? ' · กะ ' + t.shift_name + ' ' +
          String(t.shift_start).slice(0, 5) + '–' + String(t.shift_end).slice(0, 5) : '');
      if (st) {
        st.innerHTML = !t || !t.check_in
          ? '<span class="chip chip-warn">วันนี้ยังไม่ได้ลงเวลา</span>'
          : '<span class="chip chip-ok">เข้างาน ' + attHM(t.check_in) +
            (t.late_min > 0 ? ' (สาย ' + t.late_min + ' นาที)' : '') + '</span> ' +
            (t.check_out ? '<span class="chip chip-info">ออกงาน ' + attHM(t.check_out) +
              (t.work_hours != null ? ' · ' + t.work_hours + ' ชม.' : '') + '</span>'
              : '<span class="chip chip-warn">ยังไม่ออกงาน</span>');
      }
      attRenderEmpCard();                    // เติมกะทำงานจริงลงการ์ดพนักงาน
      var bIn = document.getElementById('att-in'), bOut = document.getElementById('att-out');
      if (bIn) bIn.disabled = !!(t && t.check_in);
      if (bOut) bOut.disabled = !(t && t.check_in) || !!(t && t.check_out);
    }).catch(function (er) {
      if (seq !== attState.seq) return;
      console.error('[ATTENDANCE] njhr_att_today ล้มเหลว:', er);
      var st = document.getElementById('att-status');
      if (st) st.innerHTML = '<span class="chip chip-warn">โหลดสถานะไม่สำเร็จ</span>';
      if (errEl) errEl.textContent = er.message || 'โหลดสถานะไม่สำเร็จ';
    });

    // ประวัติ 14 วันล่าสุดของตัวเอง — อ่านจากตาราง attendance จริง
    var to = todayISO();
    var days = Math.max(1, parseInt(attRange, 10) || 14);
    var d0 = new Date(to + 'T00:00:00'); d0.setDate(d0.getDate() - (days - 1));
    var from = d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate());
    sbRpcList('njhr_att_report', {
      p_token: sbToken(), p_from: from, p_to: to, p_type: 'ATTEND',
      p_dept: null, p_employee: null, p_q: null, p_limit: 100, p_offset: 0
    }).then(function (rows) {
      if (seq !== attState.seq) return;
      // ผู้ดูแลเรียก RPC เดียวกันจะได้ข้อมูลทุกคน จึงกรองเฉพาะของตัวเองมาแสดงในประวัติ
      var meId = (currentUser() || {}).employee_id || (NJHR.state.sbUser || {}).employee_id;
      var mine = meId ? (rows || []).filter(function (r) { return r.employee_id === meId; }) : (rows || []);
      attState.history = mine;
      var box = document.getElementById('att-hist');
      if (!box) return;
      attRenderStats(mine);
      box.innerHTML = mine.length
        ? '<div class="att-list">' + mine.map(function (r) {
            var st = attStatusInfo(r);
            var iso = String(r.work_date).slice(0, 10);
            var dt = new Date(iso + 'T00:00:00');
            return '<div class="att-row ' + st.cls + '">' +
              '<div class="att-day"><b>' + dt.getDate() + '</b>' +
              '<small>' + TH_MONTHS[dt.getMonth()].slice(0, 3) + '</small></div>' +
              '<div class="att-main"><b>' + esc(TH_DAYS_FULL[dt.getDay()]) + ' ' +
              esc(rptDateBE(iso)) + '</b>' +
              '<small>เข้า ' + attHM(r.check_in) + ' · ออก ' + attHM(r.check_out) +
              (r.work_hours != null ? ' · ' + r.work_hours + ' ชม.' : '') + '</small></div>' +
              (r.late_min > 0 ? '<span class="att-late">สาย ' + r.late_min + ' นาที</span>' : '') +
              '<span class="badge ' + st.badge + '">' + esc(st.text) + '</span></div>';
          }).join('') + '</div>'
        : '<div class="att-empty">' + icon('clock') +
          '<b>ยังไม่มีข้อมูลการลงเวลา</b><small>ในช่วง ' + attRange + ' วันที่ผ่านมา</small></div>';
    }).catch(function (er) {
      if (seq !== attState.seq) return;
      console.error('[ATTENDANCE] โหลดประวัติล้มเหลว:', er);
      var box = document.getElementById('att-hist');
      if (box) box.innerHTML = emptyState('โหลดประวัติลงเวลาไม่สำเร็จ');
    });
  }

  function attPunch(kind, el) {
    if (attState.loading) return;
    var btn = document.getElementById(kind === 'IN' ? 'att-in' : 'att-out');
    var errEl = document.getElementById('att-err');
    errEl.textContent = '';

    /* ลงเวลาต้องผ่านการสแกนใบหน้าเสมอ — face.js เรียก njhr_att_punch_face
       ซึ่งตรวจใบหน้า + Liveness + Geofence แล้วจึงเขียน attendance ให้ในตัว
       จึงไม่มีการเรียก njhr_att_punch ตรงจากปุ่มนี้อีกต่อไป */
    if (window.NJHRFace) {
      window.NJHRFace.punch(kind, function () { viewAttendance(el); });
      return;
    }
    if (!attFaceTried) {                       // โหลดโมดูลสแกนใบหน้าครั้งแรก
      attFaceTried = true;
      // ตัวโหลดกลาง: Promise cache · timeout · โหลดล้มเหลวแล้วกดใหม่ลองใหม่ได้
      loadScriptOnce('face', njAsset('face.js'), 'NJHRFace')
        .then(function () { attPunch(kind, el); })
        ['catch'](function () {
          attFaceTried = false;                // ให้กดลงเวลาใหม่แล้วลองโหลดอีกครั้ง
          errEl.textContent = 'โหลดโมดูลสแกนใบหน้าไม่สำเร็จ (face.js) — ลงเวลาไม่ได้';
        });
      errEl.textContent = 'กำลังเตรียมระบบสแกนใบหน้า…';
      return;
    }
    errEl.textContent = 'ระบบสแกนใบหน้ายังไม่พร้อม — ติดต่อฝ่ายบุคคล';
  }

