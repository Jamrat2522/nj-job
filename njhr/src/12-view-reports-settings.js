  /* RPC ของ Attendance/Leave/OT รับ "ชื่อแผนก" เป็น text — dropdown เก็บชื่อแผนกตรง ๆ */
  function rpDeptName(v) { return v || null; }
  var rpDepts = [];                 // จาก njhr_emp_departments (ตาราง employees จริง)
  var rpEmpPool = [];               // จาก njhr_emp_list — ใช้กับ Autocomplete เท่านั้น

  /* ---------- ตัวกรองที่ใช้อยู่ ----------
     บอกให้เห็นทันทีว่ากำลังกรองอะไรอยู่ และกด × ล้างทีละตัวได้
     ไม่มีตัวกรอง = ไม่แสดงแถบนี้เลย ไม่กินที่ */
  function rpChipsHtml(s) {
    var out = [];
    if (s.from && s.to) out.push(['date', 'ช่วงวันที่', rpDMY(s.from) + ' – ' + rpDMY(s.to), false]);
    if (s.deptId) out.push(['dept', 'แผนก', s.deptId, true]);
    if (s.empId) out.push(['emp', 'พนักงาน', s.q || '-', true]);
    if (!out.length) return '';
    return '<div class="rp-chips"><span class="rp-chips-l">ตัวกรองที่ใช้อยู่</span>' +
      out.map(function (x) {
        return '<span class="rp-chip"><small>' + esc(x[1]) + '</small><b>' + esc(x[2]) + '</b>' +
          (x[3] ? '<button type="button" class="rp-chip-x" data-rpclr="' + x[0] +
                  '" aria-label="ล้างตัวกรอง' + esc(x[1]) + '">' + icon('x') + '</button>' : '') +
          '</span>';
      }).join('') + '</div>';
  }

  function viewReportAll(el) {
    // ตรวจสิทธิ์ซ้ำในหน้า ไม่พึ่งการซ่อนเมนูอย่างเดียว
    if (!rpCanUse()) {
      el.innerHTML = '<div class="card">' + emptyState('คุณไม่มีสิทธิ์เข้าถึง REPORT ALL') + '</div>';
      return;
    }
    var s = rpState, seq = ++s.seq;
    var derr = rpDateErr();

    el.innerHTML =
      '<div class="card"><div class="card-head"><h3>REPORT ALL</h3></div>' +
      /* ตัวกรอง: ทุกช่องมี Label กำกับ ไม่ต้องเดาว่าช่องไหนคืออะไร
         เรียงตามลำดับการใช้งานจริง วันที่ → แผนก → พนักงาน → ปุ่ม */
      '<div class="rp-filters">' +
      '<label class="rp-f"><span>วันที่เริ่มต้น</span>' +
      '<input type="date" id="rp-from" value="' + esc(s.from) + '"></label>' +
      '<label class="rp-f"><span>วันที่สิ้นสุด</span>' +
      '<input type="date" id="rp-to" value="' + esc(s.to) + '"></label>' +
      '<label class="rp-f"><span>แผนก</span>' +
      '<select id="rp-dept"><option value="">ทุกแผนก</option>' +
      // รายชื่อแผนกมาจาก njhr_emp_departments (ตาราง employees จริง) ไม่ใช้ db.departments
      rpDepts.map(function (d) {
        return '<option value="' + esc(d.name) + '"' + (s.deptId === d.name ? ' selected' : '') + '>' + esc(d.name) + '</option>';
      }).join('') + '</select></label>' +
      '<label class="rp-f rp-f-emp"><span>พนักงาน</span>' +
      '<span class="search-box rp-emp-box">' + icon('search', 'ic-sm') +
      '<input id="rp-q" autocomplete="off" placeholder="ค้นหาชื่อ นามสกุล ชื่อเล่น หรือรหัสพนักงาน" value="' + esc(s.q) + '">' +
      '<div class="rpt-ac" id="rp-ac" hidden></div></span></label>' +
      '<div class="rp-fbtns">' +
      '<button class="btn btn-ghost" id="rp-clear">ล้างตัวกรอง</button>' +
      '<button class="btn btn-primary rp-exbtn" id="rp-export"' + (derr ? ' disabled' : '') + '>' +
      icon('download') + ' EXPORT EXCEL</button></div></div>' +
      rpChipsHtml(s) +
      (derr ? '<div class="form-error" id="rp-derr">' + esc(derr) + '</div>' : '') +
      '<div id="rp-cards"></div>' +
      '<div class="muted" id="rp-status" style="margin-top:10px;white-space:pre-line"></div>' +
      '<div class="form-error" id="rp-err" style="white-space:pre-line"></div>' +
      '<div class="ot-warn" id="rp-warn"></div></div>';

    // โหลดรายชื่อแผนกจริงครั้งแรก แล้ว render ซ้ำให้ dropdown ครบ (ไม่อ่าน db.departments)
    if (!rpDepts.length && sbReady() && sbToken()) {
      sbRpcList('njhr_emp_departments', { p_token: sbToken() }).then(function (ds) {
        if (!ds || !ds.length || rpDepts.length) return;
        rpDepts = ds;
        if (seq === rpState.seq) viewReportAll(el);
      }).catch(function () { /* ไม่มีแผนก = dropdown เหลือ "ทุกแผนก" ตามเดิม */ });
    }

    document.getElementById('rp-from').onchange = function () { s.from = this.value; viewReportAll(el); };
    document.getElementById('rp-to').onchange = function () { s.to = this.value; viewReportAll(el); };
    document.getElementById('rp-dept').onchange = function () {
      s.deptId = this.value;
      // พนักงานที่เลือกไว้ไม่อยู่ในแผนกใหม่ = ล้างทิ้ง
      var pe = s.empId ? emp(s.empId) : null;
      if (pe && s.deptId && pe.deptId !== s.deptId) { s.empId = ''; s.q = ''; }
      viewReportAll(el);
    };
    document.getElementById('rp-clear').onclick = function () { rpClear(el); };
    var chips = el.querySelector('.rp-chips');
    if (chips) chips.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-rpclr]') : null;
      if (!b) return;
      if (b.dataset.rpclr === 'dept') s.deptId = '';
      if (b.dataset.rpclr === 'emp') { s.empId = ''; s.q = ''; }
      viewReportAll(el);
    };
    var exBtn = document.getElementById('rp-export');
    exBtn.onclick = function () { rpExport(el); };

    // ---- ค้นหาพนักงาน + Autocomplete (อ้างอิง Employee ID จริง)
    var qEl = document.getElementById('rp-q');
    function acBox() { return document.getElementById('rp-ac'); }
    function closeAc() { var b = acBox(); if (b) { b.hidden = true; b.innerHTML = ''; } }
    qEl.oninput = debounce(function () {
      s.q = qEl.value; s.empId = '';        // พิมพ์ใหม่ = ล้าง Employee ID เดิมทันที
      viewReportAll(el);
      var q2 = document.getElementById('rp-q');
      if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
      var box = acBox(), inp = document.getElementById('rp-q');
      if (!box || !inp) return;
      var q = rptNorm(inp.value);
      if (!q) { closeAc(); return; }
      // รายชื่อพนักงานมาจาก njhr_emp_list (Dataset ที่ rpFetch โหลดมา) ไม่อ่าน db.employees
      var pool = rpEmpPool.filter(function (e2) {
        if (s.deptId && e2.deptName !== s.deptId) return false;
        return rptNorm([e2.code, e2.firstName, e2.lastName, e2.firstName + ' ' + e2.lastName,
          e2.nickname, e2.position, e2.deptName].join(' ')).indexOf(q) >= 0;
      }).slice(0, 8);
      if (!pool.length) { closeAc(); return; }
      box.innerHTML = pool.map(function (e2) {
        return '<button type="button" class="rpt-ac-item" data-rpeid="' + esc(e2.id) + '">' +
          esc(e2.code) + ' — ' + esc(e2.firstName + ' ' + e2.lastName) +
          (e2.nickname ? ' (' + esc(e2.nickname) + ')' : '') +
          ' — ' + esc(e2.deptName || '-') + ' — ' + esc(e2.position || '-') + '</button>';
      }).join('');
      box.hidden = false;
    }, 280);
    qEl.onblur = function () { setTimeout(closeAc, 150); };
    document.getElementById('rp-ac').onmousedown = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-rpeid]') : null;
      if (!b) return;
      ev.preventDefault();
      var e3 = null;
      for (var pi = 0; pi < rpEmpPool.length; pi++) {
        if (rpEmpPool[pi].id === b.dataset.rpeid) { e3 = rpEmpPool[pi]; break; }
      }
      s.empId = b.dataset.rpeid;            // เก็บ Employee ID จริง ไม่ใช้ชื่อเป็น Key
      s.q = e3 ? (e3.code + ' — ' + e3.firstName + ' ' + e3.lastName) : '';
      viewReportAll(el);
    };

    // ---- การ์ดสรุป: คำนวณจากข้อมูลชุดเดียวกับ Export
    var box = document.getElementById('rp-cards');
    if (derr) { rpData = null; box.innerHTML = emptyState(derr); return; }

    /* โหลดจาก Supabase ทั้ง 5 แหล่งในรอบเดียว (rpFetch → Promise.all ไม่มี N+1)
       ระหว่างโหลดต้องไม่แสดงเลข 0 · ล้มเหลวต้องขึ้น Retry ห้าม fallback ไป db.* */
    box.innerHTML = '<div class="rp-loading"><span class="spinner"></span> กำลังโหลดข้อมูลจากฐานข้อมูล…</div>';
    document.getElementById('rp-err').textContent = '';
    document.getElementById('rp-warn').textContent = '';
    rpData = null;

    rpFetch(rpRangeOf(), { deptName: rpDeptName(s.deptId), empId: s.empId })
      .then(function (data) {
        if (seq !== s.seq) return;
        rpEmpPool = data.emps || [];
        rpData = rpCollect(rpRangeOf(), { deptId: s.deptId, empId: s.empId }, data);
        rpRenderCards(el);
      })
      .catch(function (ex) {
        if (seq !== s.seq) return;
        rpData = null;
        box.innerHTML = '<div class="rp-loading t-red">' + esc((ex && ex.message) || 'โหลดข้อมูลไม่สำเร็จ') +
          ' <button class="btn btn-ghost btn-sm" id="rp-retry">ลองใหม่</button></div>';
        var rb = document.getElementById('rp-retry');
        if (rb) rb.onclick = function () { viewReportAll(el); };
      });
  }

  /* PART B — Summary ถูกซ่อนเป็นค่าเริ่มต้น เปิดดูเมื่อกด "ดูสรุป"
     เป็น UI Collapse ล้วน — ข้อมูลถูกโหลดและคำนวณครบเสมอ Export จึงได้ครบเหมือนเดิม */

  function rpRenderCards(el) {
    var box = document.getElementById('rp-cards');
    if (!box) return;
    var c = rpData;
    if (!c) { box.innerHTML = ''; return; }

    var lateMin = 0, lateCnt = 0, absIn = 0, absOut = 0, back = 0, leaveDays = 0, otH = 0, payTotal = 0;
    Object.keys(c.T || {}).forEach(function (k) {
      var t = c.T[k];
      lateMin += t.lateMin; lateCnt += t.late.length;
      absIn += t.absIn.length; absOut += t.absOut.length; back += t.back.length;
      leaveDays += t.L['ป่วย'] + t.L['กิจ'] + t.L['พักร้อน'] + t.L['อื่น'];
      otH += t.otH;
    });
    (c.sumRows || []).forEach(function (x) { payTotal += Number(x.cells[3]) || 0; });

    var hasData = (c.emps || []).length > 0 &&
      ((c.att || []).length || (c.leaves || []).length || (c.otRows || []).length);

    /* การ์ดสรุป — แสดงตลอด ไม่ต้องกด "ดูสรุป" ก่อน · จัดกลุ่มตามหมวดเดียวกับไฟล์ Excel
       [ไอคอน, ป้าย, ค่า, สี, หมายเหตุ] */
    var cards = [
      ['\u{1F465}', 'พนักงาน', c.emps.length + ' คน', 'k-blue', rpDMY(c.r.s) + ' – ' + rpDMY(c.r.e)],
      ['\u{1F553}', 'รายการลงเวลา', c.att.length, 'k-grey', 'มาสาย ' + lateCnt + ' ครั้ง'],
      ['\u{26A0}\u{FE0F}', 'ขาดสแกน เข้า / ออก', absIn + ' / ' + absOut,
        (absIn + absOut) ? 'k-warn' : 'k-green', 'นาทีสายรวม ' + Math.round(lateMin)],
      ['\u{1F4C5}', 'วันลารวม', Math.round(leaveDays * 100) / 100 + ' วัน', 'k-purple',
        'จากคำขอ ' + c.leaves.length + ' รายการ'],
      ['\u{23F1}\u{FE0F}', 'ชั่วโมง OT รวม', Math.round(otH * 100) / 100 + ' ชม.', 'k-rose',
        'จากงาน OT ' + c.otRows.length + ' รายการ'],
      ['\u{1F501}', 'ลงชื่อย้อนหลัง', c.backAvailable ? back : '—', 'k-grey', '']
    ];
    if (rpCanUse()) {
      cards.push(['\u{1F4B0}', 'ยอดเงินเดือนรวม', money(payTotal), 'k-teal', 'เฉพาะฐานเงินเดือน']);
    }
    if ((c.warn || []).length) {
      cards.push(['\u{1F4CC}', 'คำเตือน', c.warn.length, 'k-warn', 'ดูรายละเอียดด้านล่าง']);
    }

    box.innerHTML =
      (!hasData
        ? '<div class="rp-empty">' + icon('info') +
          '<div><b>ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก</b>' +
          '<small>ลองขยายช่วงวันที่ หรือกด "ล้างตัวกรอง" แล้วเลือกใหม่</small></div></div>'
        : '') +
      '<div class="rp-kpis">' + cards.map(function (x) {
        return '<div class="rp-kpi ' + x[3] + '"><span class="rp-kpi-ic">' + x[0] + '</span>' +
          '<div class="grow"><small>' + esc(x[1]) + '</small><b>' + esc(String(x[2])) + '</b>' +
          (x[4] ? '<em>' + esc(x[4]) + '</em>' : '') + '</div></div>';
      }).join('') + '</div>' +
      ((c.warn || []).length
        ? '<div class="ot-warn" id="rp-warnbox">' + esc((c.warn || []).join('\n')) + '</div>' : '');

    var wb = document.getElementById('rp-warn');
    if (wb) wb.textContent = '';
  }

  function rpClear(el) {
    rpState.seq++;                                   // ยกเลิกผลลัพธ์เก่าที่กำลังจะกลับมา
    rpState = { from: '', to: '', deptId: '', empId: '', q: '', seq: rpState.seq };
    rpData = null;
    try { lsRemove('njhr_rp_filter'); sessionStorage.removeItem('njhr_rp_filter'); } catch (e) { }
    viewReportAll(el);
  }

  /* ================= SHIFTS (ตั้งค่ากะทำงาน) ================= */
  // โครงข้อมูล: db.shifts (master) + employee.shiftId — คง employee.shift (string เดิม) และ sync ให้ตรงกะเสมอ
  // เพื่อให้ทุกจุดที่อ่านค่าเดิมทำงานต่อโดยไม่ hardcode (ค่ามาจากกะจริง)
  // กะที่ใช้จริงของใบลงเวลาหนึ่งใบ (ประวัติต้องไม่เปลี่ยนตามการย้ายกะภายหลัง)

  function shCanManage() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  var shSearch = '', shFStatus = '';
  var shSort = 'RECENT';                  // เรียงตาม: ล่าสุด / ชื่อกะ / จำนวนพนักงาน
  /* ---------- ตั้งค่ากะทำงาน — อ่าน/เขียนผ่าน Supabase RPC เท่านั้น ----------
     njhr_shift_list · njhr_shift_save · njhr_shift_set_active
     njhr_shift_employee_list · njhr_shift_assign · njhr_shift_unassigned_employees
     ไม่อ่าน db.shifts / db.employees / employee.shiftId / localStorage อีกต่อไป
     RPC ล้มเหลว = แสดง Error State ห้ามย้อนกลับไปใช้ข้อมูลเก่าเด็ดขาด */
  var shState = { seq: 0, shifts: [], unassigned: [], unQ: '', pick: {}, totalAll: 0, empPreview: {},
                  totalActive: 0, totalProbation: 0, err: '',
                  /* K2 — สถานะ "ไม่ใช้กะ" (NO_SHIFT) อ่านจาก njhr_shift_no_shift_employees */
                  noShift: [], nsQ: '', nsPick: {}, nsOpen: false };

  /* วันที่ปัจจุบันตามเวลาไทย — ห้ามใช้ todayISO() ของเบราว์เซอร์ เพราะเครื่องที่ตั้ง Time Zone อื่น
     จะได้วันที่คลาดไป 1 วัน แล้ว effective_date จะผิด */
  function shTodayBKK() {
    try {
      var f = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
      return f.format(new Date());                 // en-CA ให้รูปแบบ YYYY-MM-DD
    } catch (e) { return todayISO(); }
  }

  function shErr(msg) { var b = document.getElementById('sh-err'); if (b) b.textContent = msg || ''; }
  /* ปรับข้อความก่อนเทียบค้นหา — ตัดช่องว่างหน้า/หลัง ยุบช่องว่างซ้ำ และไม่สนพิมพ์เล็ก/ใหญ่
     ภาษาไทยไม่ได้รับผลกระทบจาก toLowerCase */
  function shNorm(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase(); }
  function shHHMM(t) { return String(t == null ? '' : t).slice(0, 5); }
  function shRowTime(s) {
    return shHHMM(s.start_time) + '–' + shHHMM(s.end_time) + (s.is_overnight ? ' (วันถัดไป)' : '');
  }
  function shFind(id) {
    for (var i = 0; i < shState.shifts.length; i++) if (shState.shifts[i].id === id) return shState.shifts[i];
    return null;
  }
  function shAssignedCount() {
    return shState.shifts.reduce(function (n, s) { return n + Number(s.employee_count || 0); }, 0);
  }

  /* โหลดข้อมูลทั้งหน้าจาก Supabase — 4 RPC ในรอบเดียว */
  function shLoad(el) {
    var seq = ++shState.seq;
    shState.err = '';
    return Promise.all([
      sbRpcList('njhr_shift_list', { p_token: sbToken(), p_include_inactive: true }),
      sbRpcList('njhr_shift_unassigned_employees', { p_token: sbToken(), p_q: shState.unQ || null, p_limit: 1000 }),
      sbRpcList('njhr_emp_list', { p_token: sbToken(), p_status: 'ACTIVE', p_limit: 1 }),
      sbRpcList('njhr_emp_list', { p_token: sbToken(), p_status: 'PROBATION', p_limit: 1 }),
      sbRpcList('njhr_emp_list', { p_token: sbToken(), p_limit: 1 }),
      /* K2 — รายชื่อ "ไม่ใช้กะ" ค้นหาฝั่งเซิร์ฟเวอร์ตาม Signature จริง (p_q · p_limit) */
      sbRpcList('njhr_shift_no_shift_employees', { p_token: sbToken(), p_q: shState.nsQ || null, p_limit: 1000 })
    ]).then(function (r) {
      if (seq !== shState.seq) return;
      shState.shifts = r[0] || [];
      shState.unassigned = r[1] || [];
      shState.totalActive = r[2] && r[2][0] ? Number(r[2][0].total_count) : 0;
      shState.totalProbation = r[3] && r[3][0] ? Number(r[3][0].total_count) : 0;
      shState.totalAll = r[4] && r[4][0] ? Number(r[4][0].total_count) : 0;
      shState.noShift = r[5] || [];
      shState.empPreview = {};
      shRender(el);
    }).catch(function (ex) {
      if (seq !== shState.seq) return;
      shState.err = (ex && ex.message) || 'โหลดข้อมูลกะจาก Supabase ไม่สำเร็จ';
      shState.shifts = []; shState.unassigned = []; shState.noShift = [];
      shRender(el);
    });
  }

  function viewShifts(el) {
    shState.pick = {};
    el.innerHTML =
      '<div class="sh-head"><h3>ตั้งค่ากะทำงาน</h3>' +
      '<p class="muted">จัดการกะทำงาน เวลาทำงาน และกำหนดพนักงานที่ใช้กะนี้</p></div>' +
      '<div id="sh-body"><div class="sh-kpis">' +
      '<div class="sh-skel k"></div><div class="sh-skel k"></div>' +
      '<div class="sh-skel k"></div><div class="sh-skel k"></div></div>' +
      '<div class="sh-grid"><div class="sh-skel c"></div><div class="sh-skel c"></div>' +
      '<div class="sh-skel c"></div></div></div>' +
      '<div class="form-error" id="sh-err" role="alert" style="white-space:pre-line"></div>';
    shLoad(el);
  }

  /* รายชื่อพนักงานไม่แสดงบนการ์ดอีกต่อไป — ดูได้จากเมนู ⋮ → รายชื่อพนักงาน
     (shEmpListModal ใช้ njhr_shift_employee_list ของกะนั้นเหมือนเดิม) */

  function shRender(el) {
    var box = document.getElementById('sh-body');
    if (!box) return;

    if (shState.err) {
      box.innerHTML = '<div class="card"><div class="ot-warn"><b>เชื่อมต่อฐานข้อมูลไม่สำเร็จ</b><br>' +
        esc(shState.err) + '</div>' +
        '<p class="muted note">หน้านี้อ่านข้อมูลจาก Supabase เท่านั้น จึงไม่แสดงข้อมูลเดิมที่ค้างในเครื่อง</p>' +
        '<button class="btn btn-primary btn-sm" id="sh-retry">ลองใหม่</button></div>';
      var rb = document.getElementById('sh-retry');
      if (rb) rb.onclick = function () { shLoad(el); };
      return;
    }

    var q = shSearch.trim().replace(/\s+/g, ' ').toLowerCase();
    var list = shState.shifts.filter(function (s) {
      if (q && (s.shift_name + ' ' + shHHMM(s.start_time) + ' ' + shHHMM(s.end_time)).toLowerCase().indexOf(q) < 0) return false;
      if (shFStatus && String(!!s.is_active) !== shFStatus) return false;
      return true;
    });
    if (shSort === 'NAME') {
      list = list.slice().sort(function (a, b) { return String(a.shift_name).localeCompare(String(b.shift_name), 'th'); });
    } else if (shSort === 'MEMBERS') {
      list = list.slice().sort(function (a, b) { return (b.employee_count || 0) - (a.employee_count || 0); });
    }

    var assigned = shAssignedCount(), unass = shState.unassigned.length;
    var actives = shState.shifts.filter(function (s) { return s.is_active; }).length;
    var manage = shCanManage();

    /* การ์ดสรุป 4 ใบ แทนแถวตัวเลขเดิมทั้งหมด */
    var cards = [
      ['\u{1F465}', 'พนักงานทั้งหมด', shState.totalActive + shState.totalProbation, 'k-blue', ''],
      ['\u{1F552}', 'กะทั้งหมด', shState.shifts.length, 'k-grey', ''],
      ['\u{2705}', 'กะที่เปิดใช้งาน', actives, 'k-green', ''],
      unass === 0
        ? ['\u{2705}', 'พนักงานยังไม่มีกะ', 0, 'k-green', 'กำหนดกะครบแล้ว']
        : ['\u{26A0}\u{FE0F}', 'พนักงานยังไม่มีกะ', unass, 'k-warn', 'ต้องกำหนดกะเพิ่ม']
    ];

    box.innerHTML =
      '<div class="sh-kpis">' + cards.map(function (c) {
        return '<div class="sh-kpi ' + c[3] + '"><span class="sh-kpi-ic">' + c[0] + '</span>' +
          '<div class="grow"><small>' + c[1] + '</small><b>' + c[2] + '</b>' +
          (c[4] ? '<em>' + esc(c[4]) + '</em>' : '') + '</div></div>';
      }).join('') + '</div>' +

      '<div class="sh-bar">' +
      '<span class="search-box sh-search">' + icon('search', 'ic-sm') +
      '<input id="sh-q" placeholder="ค้นหาชื่อกะ" value="' + esc(shSearch) + '"></span>' +
      '<span class="gf-seg" id="sh-seg">' +
      [['', 'ทั้งหมด'], ['true', 'เปิดใช้งาน'], ['false', 'ปิดใช้งาน']].map(function (f) {
        return '<button type="button" class="gf-segb' + (shFStatus === f[0] ? ' on' : '') +
          '" data-shst="' + f[0] + '">' + f[1] + '</button>';
      }).join('') + '</span>' +
      '<select id="sh-sort" class="gf-sort" aria-label="เรียงลำดับ">' +
      [['RECENT', 'ล่าสุด'], ['NAME', 'ชื่อกะ'], ['MEMBERS', 'จำนวนพนักงาน']].map(function (o) {
        return '<option value="' + o[0] + '"' + (shSort === o[0] ? ' selected' : '') +
          '>เรียงตาม: ' + o[1] + '</option>';
      }).join('') + '</select>' +
      (currentUser().role === 'SUPER_ADMIN'
        ? '<button class="btn btn-ghost sh-migbtn" id="sh-migrate" title="นำเข้ากะเดิมจากเครื่องนี้">' + icon('history') +
          ' <span class="sh-btxt">นำเข้ากะเดิมจากเครื่องนี้</span></button>' : '') +
      (manage ? '<button class="btn btn-primary sh-addbtn" id="sh-add2">' + icon('plus') + ' เพิ่มกะทำงาน</button>' : '') +
      '</div>' +

      (list.length
        ? '<div class="sh-grid">' + list.map(function (s) { return shCardHtml(s, manage); }).join('') + '</div>'
        : '<div class="card gf-empty"><span class="sh-empty-ic">\u{1F552}</span>' +
          '<b>' + (q || shFStatus ? 'ไม่พบกะที่ค้นหา' : 'ยังไม่มีกะทำงาน') + '</b>' +
          '<small>' + (q || shFStatus ? 'ลองเปลี่ยนคำค้นหรือตัวกรอง'
                                      : 'กด "เพิ่มกะทำงาน" เพื่อเริ่มใช้งานระบบ') + '</small></div>') +
      shUnassignedHtml(manage);

    document.getElementById('sh-q').oninput = function () {
      shSearch = this.value; shRender(el);
      var i = document.getElementById('sh-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
    };
    document.getElementById('sh-seg').onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-shst]') : null;
      if (!b) return;
      shFStatus = b.dataset.shst; shRender(el);
    };
    document.getElementById('sh-sort').onchange = function () { shSort = this.value; shRender(el); };
    var ab = document.getElementById('sh-add2');
    if (ab) ab.onclick = function () { shiftForm(null, el); };
    var mb = document.getElementById('sh-migrate');
    if (mb) mb.onclick = function () { shMigrateTool(el); };

    box.onclick = function (ev) {
      var b = ev.target.closest
        ? ev.target.closest('[data-edit],[data-emp],[data-toggle],[data-del],[data-more],[data-copy]') : null;
      if (!b) return;
      var d = b.dataset;
      if (d.more) return shCardMenu(b, d.more, el);
      document.querySelectorAll('.sh-pop').forEach(function (n) { n.remove(); });
      if (d.edit) return shiftForm(d.edit, el);
      if (d.emp) return shEmpListModal(d.emp, el);
      if (d.toggle) return shToggle(d.toggle, el);
      if (d.copy) return shCopyShift(d.copy, el);
      if (d.del) return shDeleteInfo(d.del, el);
    };
    shBindUnassigned(el);
  }

  /* การ์ดกะ 1 ใบ = 1 แถวเต็มความกว้าง — ไม่แสดงรายชื่อพนักงาน
     คงเฉพาะข้อมูลกะ + จำนวนพนักงาน (จาก employee_count เดิม) + สถานะ + เมนู ⋮ */
  function shCardHtml(s, manage) {
    var n = Number(s.employee_count || 0);
    return '<div class="sh-card' + (s.is_active ? '' : ' off') + '">' +
      '<div class="sh-r-main">' +
      '<b class="sh-r-name">' + esc(s.shift_name) + '</b>' +
      '<span class="sh-r-time">' + shHHMM(s.start_time) + ' – ' + shHHMM(s.end_time) + '</span>' +
      (s.is_overnight ? '<span class="chip chip-info">ข้ามวัน</span>' : '') +
      '<span class="sh-r-m"><small>พัก</small><b>' + (s.break_minutes || 0) + ' นาที</b></span>' +
      '<span class="sh-r-m"><small>สาย</small><b>' + (s.late_allow_minutes || 0) + ' นาที</b></span>' +
      '<span class="sh-r-m"><small>พนักงาน</small><b>' + n + ' คน</b></span>' +
      '</div>' +
      '<div class="sh-r-side">' +
      (s.is_active ? '<span class="badge badge-ok">เปิดใช้งาน</span>'
                   : '<span class="badge badge-mut">ปิดใช้งาน</span>') +
      '<button class="btn-icon sh-more" data-more="' + esc(s.id) + '" aria-label="จัดการกะนี้"' +
      ' aria-haspopup="true" title="จัดการกะนี้">' + icon('more') + '</button>' +
      '</div></div>';
  }

  /* เมนู ⋮ ของการ์ดกะ — รวมทุกคำสั่งจัดการของกะนั้นไว้ที่เดียว
     เรียกฟังก์ชันเดิมทั้งหมด (shEmpListModal / shiftForm / shToggle / shCopyShift / shDeleteInfo) */
  function shCardMenu(btn, id, el) {
    document.querySelectorAll('.sh-pop').forEach(function (n) { n.remove(); });
    var s = shFind(id);
    if (!s) return;
    var manage = shCanManage();
    var pop = document.createElement('div');
    pop.className = 'us-menu sh-pop';
    pop.innerHTML =
      '<button type="button" class="us-menu-item" data-emp="' + esc(id) + '">' +
      '<span class="us-menu-ic">\u{1F465}</span>จัดการพนักงาน</button>' +
      (manage
        ? '<button type="button" class="us-menu-item" data-edit="' + esc(id) + '">' +
          '<span class="us-menu-ic">\u{270F}\u{FE0F}</span>แก้ไข</button>' +
          '<button type="button" class="us-menu-item' + (s.is_active ? '' : ' t-green') +
          '" data-toggle="' + esc(id) + '">' +
          '<span class="us-menu-ic">' + (s.is_active ? '\u{26D4}' : '\u{2705}') + '</span>' +
          (s.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + '</button>' +
          '<button type="button" class="us-menu-item" data-copy="' + esc(id) + '">' +
          '<span class="us-menu-ic">\u{1F4CB}</span>คัดลอกกะ</button>' +
          '<button type="button" class="us-menu-item t-red" data-del="' + esc(id) + '">' +
          '<span class="us-menu-ic">\u{1F5D1}\u{FE0F}</span>ลบกะ</button>'
        : '');
    document.body.appendChild(pop);

    /* วางตำแหน่งตามพื้นที่จริงของ Viewport — ชิดขวาปุ่ม ไม่ล้นซ้าย/ขวา
       ถ้าด้านล่างไม่พอให้พลิกขึ้นด้านบนปุ่มแทน */
    var r = btn.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var vh = document.documentElement.clientHeight || window.innerHeight;
    var left = r.right - pw;
    if (left + pw > vw - 8) left = vw - 8 - pw;
    if (left < 8) left = 8;
    var top = r.bottom + 4;
    if (top + ph > vh - 8 && r.top - 4 - ph >= 8) top = r.top - 4 - ph;
    if (top + ph > vh - 8) top = Math.max(8, vh - 8 - ph);
    pop.style.left = (left + window.scrollX) + 'px';
    pop.style.top = (top + window.scrollY) + 'px';

    function close() { pop.remove(); document.removeEventListener('mousedown', outside, true); }
    function outside(ev) { if (!pop.contains(ev.target)) close(); }
    setTimeout(function () { document.addEventListener('mousedown', outside, true); }, 0);
    pop.onclick = function (ev) {
      var b = ev.target.closest
        ? ev.target.closest('[data-emp],[data-edit],[data-toggle],[data-copy],[data-del]') : null;
      if (!b) return;
      var d = b.dataset;
      close();
      if (d.emp) return shEmpListModal(d.emp, el);
      if (d.edit) return shiftForm(d.edit, el);
      if (d.toggle) return shToggle(d.toggle, el);
      if (d.copy) return shCopyShift(d.copy, el);
      if (d.del) return shDeleteInfo(d.del, el);
    };
  }

  /* คัดลอกกะ — สร้างกะใหม่ด้วยค่าเดิมผ่าน njhr_shift_save ไม่แตะกะต้นฉบับ */
  function shCopyShift(id, el) {
    var s = shFind(id);
    if (!s) return;
    var base = s.shift_name + ' (สำเนา)', name = base, i = 2;
    while (shState.shifts.some(function (x) { return x.shift_name === name; })) {
      name = base + ' ' + i; i++;
    }
    confirmDialog('คัดลอกกะ',
      'สร้างกะใหม่ชื่อ <b>' + esc(name) + '</b> โดยใช้เวลาและค่าตั้งเดิมของ <b>' + esc(s.shift_name) + '</b>' +
      '<br><small class="muted">กะต้นฉบับและพนักงานที่อยู่ในกะเดิมไม่ถูกแตะต้อง กะใหม่จะยังไม่มีพนักงาน</small>',
      'คัดลอก', function () {
        return sbRpc('njhr_shift_save', {
          p_token: sbToken(), p_id: null, p_shift_name: name,
          p_start_time: s.start_time, p_end_time: s.end_time,
          p_break_minutes: s.break_minutes || 0, p_late_allow_minutes: s.late_allow_minutes || 0,
          p_ot_start_after: s.ot_start_after || null, p_working_days: s.working_days || null
        }).then(function () { toast('คัดลอกกะเรียบร้อยแล้ว'); shLoad(el); });
      }, false);
  }

  /* ---------- ยังไม่ได้กำหนดกะ ---------- */
  function shUnassignedHtml(manage) {
    var rows = shState.unassigned;
    return '<div class="card"><div class="card-head"><h3>ยังไม่ได้กำหนดกะ</h3>' +
      '<span class="badge badge-warn">' + rows.length + ' คน</span></div>' +
      '<p class="muted" style="margin-top:0">พนักงานสถานะปฏิบัติงานและทดลองงานที่ยังไม่มีประวัติใน employee_shifts</p>' +
      '<div class="toolbar">' +
      '<div class="search-box">' + icon('search', 'ic-sm') +
      '<input id="shu-q" placeholder="ค้นหารหัส / ชื่อ / ชื่อเล่น / แผนก" value="' + esc(shState.unQ) + '"></div>' +
      (manage && rows.length
        ? '<button class="btn btn-ghost btn-sm" id="shu-all">เลือกทั้งหมดที่แสดง</button>' +
          '<button class="btn btn-ghost btn-sm" id="shu-none">ล้างการเลือก</button>' : '') +
      '</div>' +
      (rows.length
        ? '<div class="list" id="shu-list">' + rows.map(function (e) {
            return '<label class="list-row sh-emp-row"><input type="checkbox" class="shu-pick" value="' + esc(e.employee_id) + '"' +
              (shState.pick[e.employee_id] ? ' checked' : '') + (manage ? '' : ' disabled') + '>' +
              '<div class="grow"><b>' + esc(e.full_name) + '</b>' +
              '<small>' + esc(e.emp_code) + (e.nickname ? ' · ' + esc(e.nickname) : '') +
              ' · ' + esc(e.department_name || '—') + ' · ' + esc(e.position_name || '—') +
              ' · ' + esc(EMP_STATUS_MAP[e.emp_status] || e.emp_status) + '</small></div></label>';
          }).join('') + '</div>' +
          (manage
            ? '<div class="toolbar" style="margin-top:10px">' +
              '<label class="field"><span>ย้ายเข้ากะ</span><select id="shu-to">' +
              '<option value="">— เลือกกะ —</option>' +
              shState.shifts.filter(function (s) { return s.is_active; }).map(function (s) {
                return '<option value="' + esc(s.id) + '">' + esc(s.shift_name) + ' · ' + shRowTime(s) + '</option>';
              }).join('') + '</select></label>' +
              '<label class="field"><span>วันที่มีผล</span>' +
              '<input type="date" id="shu-date" value="' + shTodayBKK() + '"></label>' +
              '<span class="grow"></span>' +
              '<button class="btn btn-ghost" id="shu-ns">' + icon('ban') +
              ' ตั้งเป็นไม่ใช้กะ (<span id="shu-n2">0</span>)</button>' +
              '<button class="btn btn-primary" id="shu-go">' + icon('check') + ' ย้ายเข้ากะ (<span id="shu-n">0</span>)</button>' +
              '</div>' : '')
        : emptyState(shState.unQ ? 'ไม่พบพนักงานตามคำค้น' : 'พนักงานทุกคนมีกะแล้ว')) +
      '</div>' + shNoShiftHtml(manage);
  }

  /* ---------- ส่วน "ไม่ใช้กะ" (NO_SHIFT) — พับ/ขยายได้ ----------
     รายชื่อมาจาก njhr_shift_no_shift_employees ค้นหาฝั่งเซิร์ฟเวอร์
     คนกลุ่มนี้ไม่ถูกนับใน "ยังไม่ได้กำหนดกะ" ตามตรรกะของ K2 (ฐานข้อมูลตัดสิน ไม่ใช่ Frontend) */
  function shNoShiftHtml(manage) {
    var rows = shState.noShift;
    if (!shState.nsOpen) {
      return '<div class="card sh-ns-card"><div class="card-head">' +
        '<h3>ไม่ใช้กะ</h3><span class="badge badge-mut">' + rows.length + ' คน</span>' +
        '<span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="shn-toggle">' + icon('chevDown') + ' แสดงรายชื่อ</button>' +
        '</div>' +
        '<p class="muted" style="margin-bottom:0">พนักงานที่บริษัทกำหนดว่าไม่ต้องใช้ระบบกะ — ' +
        'ไม่ถูกนับว่า "ยังไม่ได้กำหนดกะ" และไม่ถูกเตือนว่ากำหนดกะไม่ครบ</p></div>';
    }
    return '<div class="card sh-ns-card"><div class="card-head">' +
      '<h3>ไม่ใช้กะ</h3><span class="badge badge-mut">' + rows.length + ' คน</span>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-ghost btn-sm" id="shn-toggle">' + icon('chevUp') + ' ซ่อนรายชื่อ</button>' +
      '</div>' +
      '<div class="toolbar">' +
      '<div class="search-box">' + icon('search', 'ic-sm') +
      '<input id="shn-q" placeholder="ค้นหารหัส / ชื่อ / ชื่อเล่น / แผนก" value="' + esc(shState.nsQ) + '"></div>' +
      (manage && rows.length
        ? '<button class="btn btn-ghost btn-sm" id="shn-all">เลือกทั้งหมดที่แสดง</button>' +
          '<button class="btn btn-ghost btn-sm" id="shn-none">ล้างการเลือก</button>' : '') +
      '</div>' +
      (rows.length
        ? '<div class="list" id="shn-list">' + rows.map(function (e) {
            return '<label class="list-row sh-emp-row"><input type="checkbox" class="shn-pick" value="' +
              esc(e.employee_id) + '"' + (shState.nsPick[e.employee_id] ? ' checked' : '') +
              (manage ? '' : ' disabled') + '>' +
              '<div class="grow"><b>' + esc(e.full_name) + '</b>' +
              '<small>' + esc(e.emp_code) + (e.nickname ? ' · ' + esc(e.nickname) : '') +
              ' · ' + esc(e.department_name || '—') + ' · ' + esc(e.position_name || '—') +
              ' · มีผล ' + (e.effective_date ? empBE(e.effective_date) : '—') + '</small></div></label>';
          }).join('') + '</div>' +
          (manage
            ? '<div class="toolbar" style="margin-top:10px">' +
              '<label class="field"><span>วันที่มีผล</span>' +
              '<input type="date" id="shn-date" value="' + shTodayBKK() + '"></label>' +
              '<span class="grow"></span>' +
              '<button class="btn btn-primary" id="shn-cancel">' + icon('check') +
              ' ยกเลิกไม่ใช้กะ (<span id="shn-n">0</span>)</button></div>' : '')
        : emptyState(shState.nsQ ? 'ไม่พบพนักงานตามคำค้น' : 'ยังไม่มีพนักงานที่ตั้งเป็นไม่ใช้กะ')) +
      '</div>';
  }
  function shBindUnassigned(el) {
    var qi = document.getElementById('shu-q');
    if (qi) {
      qi.oninput = function () {
        var v = this.value;
        clearTimeout(shBindUnassigned._t);
        shBindUnassigned._t = setTimeout(function () {
          shState.unQ = v; shState.pick = {}; shLoad(el);
        }, 350);
      };
    }
    function syncN() {
      var n = Object.keys(shState.pick).filter(function (k) { return shState.pick[k]; }).length;
      var s = document.getElementById('shu-n'); if (s) s.textContent = n;
      var s2 = document.getElementById('shu-n2'); if (s2) s2.textContent = n;
    }
    var lb = document.getElementById('shu-list');
    if (lb) lb.onchange = function (ev) {
      var t = ev.target;
      if (!t || !t.classList.contains('shu-pick')) return;
      if (t.checked) shState.pick[t.value] = 1; else delete shState.pick[t.value];
      syncN();
    };
    var all = document.getElementById('shu-all');
    if (all) all.onclick = function () {
      shState.unassigned.forEach(function (e) { shState.pick[e.employee_id] = 1; });
      el.querySelectorAll('.shu-pick').forEach(function (c) { c.checked = true; });
      syncN();
    };
    var none = document.getElementById('shu-none');
    if (none) none.onclick = function () {
      shState.pick = {};
      el.querySelectorAll('.shu-pick').forEach(function (c) { c.checked = false; });
      syncN();
    };
    syncN();
    var go = document.getElementById('shu-go');
    if (go) go.onclick = function () {
      var btn = this;
      var ids = Object.keys(shState.pick).filter(function (k) { return shState.pick[k]; });
      var to = document.getElementById('shu-to').value;
      var dt = document.getElementById('shu-date').value;
      shErr('');
      if (!ids.length) { shErr('กรุณาเลือกพนักงานอย่างน้อย 1 คน'); return; }
      if (!to) { shErr('กรุณาเลือกกะปลายทาง'); return; }
      if (!dt) { shErr('กรุณาเลือกวันที่มีผล'); return; }
      var w = shFind(to);
      confirmDialog('ย้ายเข้ากะ',
        'ย้ายพนักงาน <b>' + ids.length + ' คน</b> เข้ากะ <b>' + esc(w ? w.shift_name : '') + '</b>' +
        '<br>มีผลตั้งแต่ <b>' + empBE(dt) + '</b>',
        'ย้ายเข้ากะ', function () { return shAssignMany(ids, to, dt, btn, el); }, false);
    };
    var ns = document.getElementById('shu-ns');
    if (ns) ns.onclick = function () {
      var btn = this;
      var ids = Object.keys(shState.pick).filter(function (k) { return shState.pick[k]; });
      var dt = document.getElementById('shu-date').value;
      shErr('');
      if (!ids.length) { shErr('กรุณาเลือกพนักงานอย่างน้อย 1 คน'); return; }
      if (!dt) { shErr('กรุณาเลือกวันที่มีผล'); return; }
      confirmDialog('ตั้งเป็นไม่ใช้กะ',
        'ตั้งพนักงาน <b>' + ids.length + ' คน</b> เป็น <b>ไม่ใช้กะ</b>' +
        '<br>มีผลตั้งแต่ <b>' + empBE(dt) + '</b>' +
        '<br><small class="muted">จะไม่ถูกนับว่ายังไม่ได้กำหนดกะ และไม่ถูกเตือนอีก</small>',
        'ตั้งเป็นไม่ใช้กะ', function () { return shNoShiftSet(ids, dt, true, btn, el); }, false);
    };
    shBindNoShift(el);
  }

  /* ---------- ผูกปุ่มของส่วน "ไม่ใช้กะ" ---------- */
  function shBindNoShift(el) {
    var tg = document.getElementById('shn-toggle');
    if (tg) tg.onclick = function () { shState.nsOpen = !shState.nsOpen; shRender(el); };
    var qi = document.getElementById('shn-q');
    if (qi) {
      qi.oninput = function () {                 // Debounce เหมือนช่องค้นหาเดิมของหน้านี้
        var v = this.value;
        clearTimeout(shBindNoShift._t);
        shBindNoShift._t = setTimeout(function () {
          shState.nsQ = v; shState.nsPick = {}; shLoad(el);
        }, 350);
      };
    }
    function syncN() {
      var n = Object.keys(shState.nsPick).filter(function (k) { return shState.nsPick[k]; }).length;
      var b = document.getElementById('shn-n'); if (b) b.textContent = n;
    }
    var lb = document.getElementById('shn-list');
    if (lb) lb.onchange = function (ev) {
      var t = ev.target;
      if (!t || !t.classList.contains('shn-pick')) return;
      if (t.checked) shState.nsPick[t.value] = 1; else delete shState.nsPick[t.value];
      syncN();
    };
    var all = document.getElementById('shn-all');
    if (all) all.onclick = function () {
      shState.noShift.forEach(function (e) { shState.nsPick[e.employee_id] = 1; });
      el.querySelectorAll('.shn-pick').forEach(function (c) { c.checked = true; });
      syncN();
    };
    var none = document.getElementById('shn-none');
    if (none) none.onclick = function () {
      shState.nsPick = {};
      el.querySelectorAll('.shn-pick').forEach(function (c) { c.checked = false; });
      syncN();
    };
    syncN();
    var cx = document.getElementById('shn-cancel');
    if (cx) cx.onclick = function () {
      var btn = this;
      var ids = Object.keys(shState.nsPick).filter(function (k) { return shState.nsPick[k]; });
      var dt = document.getElementById('shn-date').value;
      shErr('');
      if (!ids.length) { shErr('กรุณาเลือกพนักงานอย่างน้อย 1 คน'); return; }
      if (!dt) { shErr('กรุณาเลือกวันที่มีผล'); return; }
      confirmDialog('ยกเลิกไม่ใช้กะ',
        'ยกเลิกสถานะไม่ใช้กะของพนักงาน <b>' + ids.length + ' คน</b>' +
        '<br>มีผลตั้งแต่ <b>' + empBE(dt) + '</b>' +
        '<br><small class="muted">จะกลับไปอยู่ "ยังไม่ได้กำหนดกะ" ' +
        'ไม่กลับไปใช้กะเดิมโดยอัตโนมัติ</small>',
        'ยกเลิกไม่ใช้กะ', function () { return shNoShiftSet(ids, dt, false, btn, el); }, false);
    };
  }

  /* ---------- ตัวเรียก RPC สมาชิกกะทั้งหมด (K2) ----------
     ทุกตัวเป็น Batch รับ uuid[] ยิงครั้งเดียวต่อการกด 1 ครั้ง — ไม่มีการวน RPC ทีละคนอีกแล้ว
     Frontend ไม่แตะ employee_shifts เอง ทุกอย่างผ่าน RPC ฐานข้อมูลเป็น Source of Truth */
  function shBatch(btn, loadingText, fn, args, okText, el) {
    if (!btn || btn.dataset.busy === '1') return Promise.resolve(null);
    var label = btn.innerHTML;
    btn.dataset.busy = '1'; btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> ' + esc(loadingText);
    shErr('');
    return sbRpcList(fn, args).then(function (rows) {
      var n = (rows || []).filter(function (x) { return x.result !== 'UNCHANGED'; }).length;
      var same = (rows || []).length - n;
      toast(okText.replace('{n}', n) + (same ? ' · ไม่มีการเปลี่ยนแปลง ' + same + ' คน' : ''));
      return rows || [];
    }).catch(function (ex) {
      shErr((ex && ex.message) || 'ดำเนินการไม่สำเร็จ');   // ห้ามกลืน Error
      return null;
    }).then(function (rows) {
      btn.dataset.busy = '0'; btn.disabled = false; btn.innerHTML = label;
      shState.pick = {}; shState.nsPick = {};
      shLoad(el);                       // อ่านข้อมูลจริงกลับมาเสมอ ไม่เดาผลลัพธ์เอง
      return rows;
    });
  }

  /* ผูก/ย้ายกะหลายคนพร้อมกัน — njhr_shift_assign_many (Batch) */
  function shAssignMany(ids, shiftId, dt, btn, el) {
    var w = shFind(shiftId);
    return shBatch(btn, 'กำลังบันทึก…', 'njhr_shift_assign_many',
      { p_token: sbToken(), p_employees: ids, p_shift: shiftId, p_effective_date: dt },
      'ผูกกะ' + (w ? ' ' + w.shift_name : '') + ' ให้พนักงาน {n} คนแล้ว', el);
  }

  /* นำออกจากกะ — njhr_shift_remove · p_no_shift เลือกปลายทาง 2 แบบ */
  function shRemoveMany(ids, dt, noShift, btn, el) {
    return shBatch(btn, 'กำลังบันทึก…', 'njhr_shift_remove',
      { p_token: sbToken(), p_employees: ids, p_effective_date: dt, p_no_shift: !!noShift },
      noShift ? 'ตั้งเป็นไม่ใช้กะ {n} คนแล้ว' : 'นำออกจากกะ {n} คนแล้ว', el);
  }

  /* ตั้ง / ยกเลิก "ไม่ใช้กะ" — njhr_shift_no_shift_set */
  function shNoShiftSet(ids, dt, on, btn, el) {
    return shBatch(btn, 'กำลังบันทึก…', 'njhr_shift_no_shift_set',
      { p_token: sbToken(), p_employees: ids, p_effective_date: dt, p_on: !!on },
      on ? 'ตั้งเป็นไม่ใช้กะ {n} คนแล้ว' : 'ยกเลิกไม่ใช้กะ {n} คนแล้ว', el);
  }

  /* ---------- รายชื่อพนักงานในกะ + ย้ายไปกะอื่น ---------- */
  function shEmpListModal(shiftId, el) {
    var s = shFind(shiftId);
    if (!s) { toast('ไม่พบกะนี้ — กำลังโหลดใหม่', 'error'); shLoad(el); return; }
    openModal('พนักงานในกะ ' + esc(s.shift_name),
      '<div class="muted"><span class="spinner"></span> กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="shl-close">ปิด</button>', { wide: true });
    document.getElementById('shl-close').onclick = closeModal;

    sbRpcList('njhr_shift_employee_list', { p_token: sbToken(), p_shift: shiftId })
      .then(function (rows) {
        var body = document.querySelector('#modal-root .modal-body');
        if (!body) return;
        var manage = shCanManage();
        body.innerHTML =
          '<p class="confirm-msg">กะ <b>' + esc(s.shift_name) + '</b> (' + shRowTime(s) + ') · ' + rows.length + ' คน</p>' +
          (rows.length
            ? '<span class="search-box shl-search">' + icon('search', 'ic-sm') +
              '<input id="shl-q" autocomplete="off" placeholder="ค้นหาชื่อ / รหัสพนักงาน / แผนก"></span>' +
              '<small class="muted shl-found" id="shl-found"></small>' +
              '<div class="list" id="shl-list">' + rows.map(function (e) {
                return '<label class="list-row sh-emp-row" data-s="' + esc(shNorm([
                    e.full_name, e.emp_code, e.nickname, e.department_name].join(' '))) +
                  '"><input type="checkbox" class="shl-pick" value="' + esc(e.employee_id) + '"' +
                  (manage ? '' : ' disabled') + '>' +
                  '<div class="grow"><b>' + esc(e.full_name) + '</b>' +
                  '<small>' + esc(e.emp_code) + (e.nickname ? ' · ' + esc(e.nickname) : '') +
                  ' · ' + esc(e.department_name || '—') +
                  ' · เริ่มใช้กะ ' + (e.effective_date ? empBE(e.effective_date) : '—') + '</small></div></label>';
              }).join('') +
              '<div class="shl-none" id="shl-none" hidden>ไม่พบพนักงานที่ตรงกับคำค้นหา</div></div>' +
              (manage
                ? '<div class="form-2col" style="margin-top:12px">' +
                  '<label class="field"><span>ย้ายผู้ที่เลือกไปกะ</span><select id="shl-to">' +
                  '<option value="">— เลือกกะ —</option>' +
                  shState.shifts.filter(function (x) { return x.is_active && x.id !== shiftId; }).map(function (x) {
                    return '<option value="' + esc(x.id) + '">' + esc(x.shift_name) + ' · ' + shRowTime(x) + '</option>';
                  }).join('') + '</select></label>' +
                  '<label class="field"><span>วันที่มีผล</span>' +
                  '<input type="date" id="shl-date" value="' + shTodayBKK() + '"></label></div>' +
                  '<div class="toolbar shl-acts">' +
                  '<button class="btn btn-primary" id="shl-move">' + icon('send') + ' ย้ายกะ</button>' +
                  '<span class="grow"></span>' +
                  '<button class="btn btn-ghost" id="shl-rm">' + icon('logout') +
                  ' นำออกจากกะ (ยังต้องใช้กะ)</button>' +
                  '<button class="btn btn-ghost t-red" id="shl-ns">' + icon('ban') +
                  ' นำออก + ตั้งเป็นไม่ใช้กะ</button></div>' : '')
            : emptyState('ยังไม่มีพนักงานในกะนี้')) +
          '<div class="form-error" id="shl-err" role="alert" style="white-space:pre-line"></div>';

        /* ผู้ที่ถูกติ๊กไว้ตอนนี้ (แถวที่ถูกซ่อนจากการค้นหาก็ยังนับ ตามพฤติกรรมเดิมของ Modal นี้) */
        function shlPicked() {
          return Array.prototype.slice.call(document.querySelectorAll('.shl-pick:checked'))
            .map(function (c) { return c.value; });
        }
        function shlDate() {
          var d = document.getElementById('shl-date');
          return d ? d.value : '';
        }
        function shlNames(ids) {
          return rows.filter(function (r) { return ids.indexOf(r.employee_id) >= 0; })
            .map(function (r) { return r.emp_code + ' ' + r.full_name; });
        }
        var rmBtn = document.getElementById('shl-rm');
        var nsBtn = document.getElementById('shl-ns');
        function shlRemove(noShift, btn) {
          var ids = shlPicked(), dt = shlDate();
          var eb = document.getElementById('shl-err');
          eb.textContent = '';
          if (!ids.length) { eb.textContent = 'กรุณาเลือกพนักงานอย่างน้อย 1 คน'; return; }
          if (!dt) { eb.textContent = 'กรุณาเลือกวันที่มีผล'; return; }
          var nm = shlNames(ids);
          confirmDialog(noShift ? 'นำออกจากกะ และตั้งเป็นไม่ใช้กะ' : 'นำออกจากกะ',
            'ต้องการนำพนักงาน <b>' + ids.length + ' คน</b> ออกจากกะ <b>' + esc(s.shift_name) + '</b> หรือไม่' +
            '<br>มีผลตั้งแต่ <b>' + empBE(dt) + '</b>' +
            '<br><small class="muted">' + esc(nm.slice(0, 5).join(' · ')) +
            (nm.length > 5 ? ' และอีก ' + (nm.length - 5) + ' คน' : '') + '</small>' +
            '<br><br>' + (noShift
              ? '<b>ผลลัพธ์:</b> กำหนดเป็น <b>ไม่ใช้กะ</b> — จะไม่ถูกนับว่ายังไม่ได้กำหนดกะ'
              : '<b>ผลลัพธ์:</b> กลับไปอยู่ <b>"ยังไม่ได้กำหนดกะ"</b> เพื่อเลือกกะใหม่ภายหลัง') +
            '<br><small class="muted">ประวัติกะย้อนหลังก่อนวันที่มีผลยังคงอยู่ครบ</small>',
            'ยืนยัน', function () {
              return shRemoveMany(ids, dt, noShift, btn, el).then(function () { closeModal(); });
            }, !!noShift);
        }
        if (rmBtn) rmBtn.onclick = function () { shlRemove(false, this); };
        if (nsBtn) nsBtn.onclick = function () { shlRemove(true, this); };

        var mv = document.getElementById('shl-move');
        var qEl = document.getElementById('shl-q');
        if (qEl) {
          /* กรองจากรายชื่อที่โหลดมาแล้วเท่านั้น — ซ่อน/แสดงแถวเดิม ไม่ render ใหม่
             จึงไม่ยิง RPC ซ้ำ และ Checkbox ที่ติ๊กไว้ยังคงสถานะเดิมทุกกรณี */
          qEl.oninput = function () {
            var q = shNorm(this.value);
            var rowsEl = document.querySelectorAll('#shl-list .sh-emp-row');
            var hit = 0;
            Array.prototype.forEach.call(rowsEl, function (r) {
              var on = !q || String(r.getAttribute('data-s') || '').indexOf(q) >= 0;
              r.hidden = !on;
              if (on) hit++;
            });
            var none = document.getElementById('shl-none');
            if (none) none.hidden = !(q && hit === 0);
            var fd = document.getElementById('shl-found');
            if (fd) fd.textContent = q ? 'พบ ' + hit + ' จาก ' + rowsEl.length + ' คน' : '';
          };
        }
        if (mv) mv.onclick = function () {
          var btn = this;
          var ids = shlPicked(), dt = shlDate();
          var to = document.getElementById('shl-to').value;
          var eb = document.getElementById('shl-err');
          eb.textContent = '';
          if (!ids.length) { eb.textContent = 'กรุณาเลือกพนักงานอย่างน้อย 1 คน'; return; }
          if (!to) { eb.textContent = 'กรุณาเลือกกะปลายทาง'; return; }
          if (!dt) { eb.textContent = 'กรุณาเลือกวันที่มีผล'; return; }
          var w = shFind(to);
          /* ทุกคนใน Modal นี้อยู่กะเดียวกันอยู่แล้ว จึงสรุปกะเดิมได้ครั้งเดียว
             ไม่ต้อง Confirm ทีละคน และยิง RPC ครั้งเดียวแบบ Batch */
          confirmDialog('ย้ายกะ',
            'พนักงาน <b>' + ids.length + ' คน</b> ปัจจุบันอยู่กะ <b>' + esc(s.shift_name) + '</b>' +
            '<br>ต้องการย้ายไปกะ <b>' + esc(w ? w.shift_name : '') + '</b> ' +
            'ตั้งแต่วันที่ <b>' + empBE(dt) + '</b> หรือไม่' +
            '<br><small class="muted">ประวัติกะเดิมก่อนวันที่มีผลยังคงอยู่ครบ</small>',
            'ย้ายกะ', function () {
              return shAssignMany(ids, to, dt, btn, el).then(function (res) {
                var same = (res || []).filter(function (x) { return x.result === 'UNCHANGED'; }).length;
                if (same) eb.textContent = 'อยู่ในกะนี้แล้ว ' + same + ' คน — ไม่ได้สร้างรายการซ้ำ';
                else closeModal();
              });
            }, false);
        };
      }).catch(function (ex) {
        var body = document.querySelector('#modal-root .modal-body');
        if (body) body.innerHTML = '<div class="form-error">' + esc((ex && ex.message) || 'โหลดรายชื่อไม่สำเร็จ') + '</div>';
      });
  }

  /* ---------- เปิด/ปิดใช้งานกะ ---------- */
  function shToggle(id, el) {
    var s = shFind(id);
    if (!s) { shLoad(el); return; }
    var n = Number(s.employee_count || 0);
    var turnOn = !s.is_active;
    var msg = turnOn
      ? 'เปิดใช้งานกะ "' + esc(s.shift_name) + '"?'
      : 'ปิดใช้งานกะ "' + esc(s.shift_name) + '"?' +
        (n ? '<br><small class="t-red">กะนี้ยังมีพนักงานใช้อยู่ ' + n + ' คน — ควรย้ายพนักงานก่อน</small>' : '');
    confirmDialog((turnOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + 'กะทำงาน', msg, 'ยืนยัน', function () {
      shErr('');
      return sbRpc('njhr_shift_set_active', {
        p_token: sbToken(), p_id: id, p_active: turnOn, p_force: false
      }).then(function () { toast('บันทึกแล้ว'); shLoad(el); })
        .catch(function (ex) {
          var m = (ex && ex.message) || 'บันทึกไม่สำเร็จ';
          if (!turnOn && n) {
            confirmDialog('ยืนยันปิดใช้งาน', esc(m) + '<br><br>ต้องการปิดใช้งานต่อไปหรือไม่', 'ปิดใช้งาน', function () {
              return sbRpc('njhr_shift_set_active', {
                p_token: sbToken(), p_id: id, p_active: false, p_force: true
              }).then(function () { toast('ปิดใช้งานกะแล้ว'); shLoad(el); });
            }, true);
          } else shErr(m);
        });
    }, !turnOn);
  }

  /* ---------- ปุ่มลบ: อธิบายว่าลบถาวรไม่ได้ แล้วเสนอปิดใช้งานแทน ---------- */
  function shDeleteInfo(id, el) {
    var s = shFind(id);
    if (!s) { shLoad(el); return; }
    var n = Number(s.employee_count || 0);
    openModal('ลบกะทำงาน',
      '<p class="confirm-msg">กะ <b>' + esc(s.shift_name) + '</b> (' + shRowTime(s) + ') ' +
      'ถูกอ้างอิงโดยใบลงเวลา คำขอ OT และรายงานย้อนหลังผ่านตาราง employee_shifts ' +
      'จึง<b>ลบถาวรไม่ได้</b> เพื่อไม่ให้ข้อมูลย้อนหลังเสียหาย</p>' +
      '<div class="bal-grid"><div class="bal-item"><div class="bal-top">' +
      '<span>พนักงานในกะนี้</span><b>' + n + '</b></div></div></div>' +
      '<p class="muted note">ใช้ "ปิดใช้งาน" แทน — กะจะไม่ปรากฏให้เลือกอีก แต่ประวัติเดิมยังอ่านได้ครบ</p>' +
      '<div class="form-error" id="shd-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="shd-close">ปิด</button>' +
      (s.is_active && shCanManage() ? '<button class="btn btn-primary" id="shd-off">ปิดใช้งานกะนี้</button>' : ''));
    document.getElementById('shd-close').onclick = closeModal;
    var off = document.getElementById('shd-off');
    if (off) off.onclick = function () { closeModal(); shToggle(id, el); };
  }

  /* ---------- ฟอร์มเพิ่ม / แก้ไขกะ ---------- */
  function shiftForm(id, listEl) {
    if (!shCanManage()) { toast('คุณไม่มีสิทธิ์จัดการกะทำงาน', 'error'); return; }
    var s = id ? shFind(id) : null;
    openModal(s ? 'แก้ไขกะทำงาน' : 'เพิ่มกะทำงาน',
      '<form id="sh-f" novalidate>' +
      '<label class="field"><span>ชื่อกะ <i class="req">*</i></span>' +
      '<input name="name" id="shf-name" value="' + esc(s ? s.shift_name : '') + '" placeholder="เช่น กะเช้า / กะดึกคลังสินค้า"></label>' +
      '<div class="form-2col">' +
      '<label class="field"><span>เวลาเริ่มงาน <i class="req">*</i></span>' +
      '<input type="time" id="shf-start" value="' + (s ? shHHMM(s.start_time) : '08:30') + '"></label>' +
      '<label class="field"><span>เวลาเลิกงาน <i class="req">*</i></span>' +
      '<input type="time" id="shf-end" value="' + (s ? shHHMM(s.end_time) : '17:30') + '"></label></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>เวลาพัก (นาที)</span>' +
      '<input type="number" min="0" max="480" id="shf-break" value="' + (s ? (s.break_minutes || 0) : 60) + '"></label>' +
      '<label class="field"><span>อนุโลมมาสาย (นาที)</span>' +
      '<input type="number" min="0" max="240" id="shf-late" value="' + (s ? (s.late_allow_minutes || 0) : 0) + '"></label></div>' +
      '<p class="muted note">กะข้ามวันระบบคำนวณให้อัตโนมัติเมื่อเวลาเลิกงานน้อยกว่าเวลาเริ่มงาน</p>' +
      '<p class="muted note">การผูกพนักงานเข้ากะทำที่หัวข้อ "ยังไม่ได้กำหนดกะ" หรือปุ่ม "รายชื่อ" ของแต่ละกะ</p>' +
      '<div class="form-error" id="shf-err" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="shf-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="shf-save">บันทึก</button>');
    document.getElementById('shf-cancel').onclick = closeModal;
    document.getElementById('shf-save').onclick = function () {
      var btn = this, eb = document.getElementById('shf-err');
      var nm = String(document.getElementById('shf-name').value || '').trim();
      var st = document.getElementById('shf-start').value;
      var en = document.getElementById('shf-end').value;
      var bk = parseInt(document.getElementById('shf-break').value, 10);
      var lt = parseInt(document.getElementById('shf-late').value, 10);
      eb.textContent = '';
      if (!nm) { eb.textContent = 'กรุณาระบุชื่อกะ'; return; }
      if (!st || !en) { eb.textContent = 'กรุณาระบุเวลาเริ่มงานและเวลาเลิกงาน'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_shift_save', {
        p_token: sbToken(), p_id: id || null, p_shift_name: nm,
        p_start_time: st, p_end_time: en,
        p_break_minutes: isFinite(bk) ? bk : 0,
        p_late_allow_minutes: isFinite(lt) ? lt : 0,
        p_ot_start_after: null, p_working_days: null
      }).then(function () {
        closeModal(); toast('บันทึกกะเรียบร้อยแล้ว'); shLoad(listEl);
      }).catch(function (ex) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        eb.textContent = (ex && ex.message) || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ---------- เครื่องมือย้ายกะเดิมจาก localStorage ขึ้น Supabase (ใช้ครั้งเดียว) ----------
     อ่านข้อมูลเก่าในเครื่องนี้เท่านั้น แล้วส่งเข้า njhr_shift_assign
     จับคู่พนักงานด้วยรหัสพนักงาน → Employee UUID จริงจาก njhr_shift_unassigned_employees
     จับคู่กะด้วยเวลาเริ่ม-เลิกงาน → work_shifts จริง · ผูกเฉพาะคนที่ยังไม่มีกะ (กันซ้ำ) */
  function shMigrateTool(el) {
    var legacyShifts = (db && db.shifts) || [];
    var legacyEmps = (db && db.employees) || [];
    var byId = {};
    legacyShifts.forEach(function (x) { byId[x.id] = x; });
    // จับคู่: รหัสพนักงานเดิม → กะจริงในฐานข้อมูล (เทียบด้วยเวลาเริ่ม-เลิก)
    var plan = [], noShift = [], noEmp = [];
    var unByCode = {};
    shState.unassigned.forEach(function (u) { unByCode[String(u.emp_code).trim().toUpperCase()] = u; });
    legacyEmps.forEach(function (e) {
      var code = String(e.code || e.emp_code || '').trim().toUpperCase();
      var u = unByCode[code];
      if (!u) return;                                  // ไม่อยู่ในรายการ "ยังไม่มีกะ" → ข้าม (กันซ้ำ)
      var ls = byId[e.shiftId];
      if (!ls) { noShift.push(code); return; }
      var target = null;
      for (var i = 0; i < shState.shifts.length; i++) {
        var s = shState.shifts[i];
        if (s.is_active && shHHMM(s.start_time) === shHHMM(ls.start) && shHHMM(s.end_time) === shHHMM(ls.end)) { target = s; break; }
      }
      if (!target) { noShift.push(code + ' (' + ls.start + '-' + ls.end + ')'); return; }
      plan.push({ id: u.employee_id, code: code, name: u.full_name, shift: target });
    });
    legacyEmps.forEach(function (e) {
      var code = String(e.code || e.emp_code || '').trim().toUpperCase();
      if (code && !unByCode[code]) noEmp.push(code);
    });

    openModal('นำเข้ากะเดิมจากเครื่องนี้',
      '<p class="muted">อ่านข้อมูลกะเดิมที่ค้างอยู่ในเบราว์เซอร์เครื่องนี้ครั้งเดียว แล้วบันทึกขึ้น Supabase ' +
      'ผ่าน RPC จริง — ข้อมูลเดิมในเครื่องจะไม่ถูกนำมาแสดงบนหน้าจอไม่ว่ากรณีใด</p>' +
      '<div class="bal-grid">' +
      [['กะเดิมในเครื่อง', legacyShifts.length], ['พนักงานเดิมในเครื่อง', legacyEmps.length],
       ['ผูกกะได้', plan.length], ['จับคู่กะไม่ได้', noShift.length], ['มีกะอยู่แล้ว/ไม่พบรหัส', noEmp.length]]
        .map(function (x) { return '<div class="bal-item"><div class="bal-top"><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>'; }).join('') +
      '</div>' +
      '<label class="field"><span>วันที่เริ่มใช้กะ (effective_date)</span>' +
      '<input type="date" id="shm-date" value="' + todayISO() + '"></label>' +
      (plan.length
        ? '<div class="table-wrap empi-table" style="max-height:240px"><table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>กะปลายทาง</th></tr></thead><tbody>' +
          plan.slice(0, 200).map(function (p) {
            return '<tr><td>' + esc(p.code) + '</td><td>' + esc(p.name) + '</td><td>' + esc(p.shift.shift_name) + ' · ' + shRowTime(p.shift) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="ot-warn">ไม่พบข้อมูลกะเดิมที่ผูกได้ — อาจเคยนำเข้าไปแล้ว หรือเครื่องนี้ไม่มีข้อมูลเก่า</div>') +
      '<div class="form-error" id="shm-err" role="alert" style="white-space:pre-line"></div>',
      '<button class="btn btn-ghost" id="shm-cancel">ยกเลิก</button>' +
      (plan.length ? '<button class="btn btn-primary" id="shm-go">นำเข้า ' + plan.length + ' คน</button>' : ''),
      { wide: true });
    document.getElementById('shm-cancel').onclick = closeModal;
    var gob = document.getElementById('shm-go');
    if (gob) gob.onclick = function () {
      var dt = document.getElementById('shm-date').value;
      var eb = document.getElementById('shm-err');
      if (!dt) { eb.textContent = 'กรุณาเลือกวันที่เริ่มใช้กะ'; return; }
      var btn = this, done = 0, fail = [];
      if (btn.disabled) return;
      btn.disabled = true;
      plan.reduce(function (chain, p) {
        return chain.then(function () {
          btn.innerHTML = '<span class="spinner"></span> ' + done + '/' + plan.length;
          return sbRpc('njhr_shift_assign', {
            p_token: sbToken(), p_employee: p.id, p_shift: p.shift.id, p_effective_date: dt
          }).then(function () { done++; })
            .catch(function (ex) { fail.push(p.code + ': ' + ((ex && ex.message) || '')); });
        });
      }, Promise.resolve()).then(function () {
        closeModal();
        toast('นำเข้ากะเดิมแล้ว ' + done + ' คน' + (fail.length ? ' · ไม่สำเร็จ ' + fail.length + ' คน' : ''));
        shLoad(el);                       // โหลดกลับจาก Supabase เพื่อตรวจสอบ
        if (fail.length) setTimeout(function () { shErr('ไม่สำเร็จ:\n' + fail.slice(0, 10).join('\n')); }, 400);
      });
    };
  }

  /* ================= VIEW: GEOFENCE (พื้นที่ลงเวลา — เฉพาะ SUPER_ADMIN) ================= */
  // แหล่งข้อมูลหลัก: db.settings.geofence (Prototype ใช้ localStorage แทน Supabase — โครงพร้อมย้าย)
  function gfGet() {
    if (!db.settings.geofence) {
      // สร้างจากค่าตั้งเดิม (รัศมีเดิมของระบบ) — ตำแหน่งยังไม่กำหนด ให้ Super Admin ตั้งเอง
      db.settings.geofence = {
        locationName: '', lat: null, lng: null,
        radius: db.settings.geofenceRadius || 200, maxAccuracy: 50,
        mode: 'PROTOTYPE', updatedAt: null, updatedBy: null, updatedByRole: null
      };
      saveDB();
    }
    return db.settings.geofence;
  }
  // ตรวจสิทธิ์ซ้ำทุกจุด (ไม่พึ่งการซ่อนปุ่ม) — ใช้ค่ามาตรฐานระบบเดิม role === 'SUPER_ADMIN'
  function gfRequireSA(redirect) {
    var u = currentUser();
    if (u && u.role === 'SUPER_ADMIN') return true;
    toast('คุณไม่มีสิทธิ์แก้ไขการตั้งค่าระบบ เฉพาะ Super Admin เท่านั้นที่สามารถดำเนินการได้', 'error');
    if (redirect !== false) window.location.hash = '#/dashboard';
    return false;
  }
  // Haversine: ระยะทางจริงเป็นเมตรระหว่างพิกัด 2 จุด
  function gfDistance(lat1, lng1, lat2, lng2) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function gfLoadLeaflet() {
    if (window.L) return Promise.resolve();
    // ใช้ตัวโหลดกลาง: Promise cache · timeout · ลองใหม่ได้เมื่อพลาด
    // CSS ของแผนที่: ถ้าโหลดไม่สำเร็จให้แจ้งใน console แต่ไม่บล็อกการใช้งานแผนที่
    // (loadStyleOnce จะ reject จริง ไม่กลืน Error แล้ว จึงต้องรับไว้ตรงนี้อย่างตั้งใจ)
    loadStyleOnce('leaflet-css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css')
      ['catch'](function (e) { try { console.error(e.message); } catch (e2) {} });
    return loadScriptOnce('leaflet', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'L');
  }

  /* ค้นหา/ดึงชื่อสถานที่จาก OpenStreetMap (แผนที่ชุดเดียวกับที่ระบบใช้อยู่)
     ใช้เติมชื่อ พิกัด และที่อยู่ให้อัตโนมัติเท่านั้น — ไม่แตะการคำนวณ Geofence และไม่แตะฐานข้อมูล */
  function gfGeoSearch(q) {
    return fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1' +
      '&accept-language=th&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('ค้นหาสถานที่ไม่สำเร็จ'); return r.json(); });
  }
  function gfPlaceName(j) {
    if (!j) return '';
    var a = j.address || {};
    return j.name || a.amenity || a.building || a.shop || a.office || a.industrial ||
      a.road || String(j.display_name || '').split(',')[0] || '';
  }
  // คืนทั้งชื่อสั้นและที่อยู่แบบเต็ม เพื่อแสดงใต้แผนที่
  function gfGeoReverseFull(lat, lng) {
    return fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1' +
      '&accept-language=th&lat=' + lat + '&lon=' + lng, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); })
      .then(function (j) { return { name: gfPlaceName(j), address: (j && j.display_name) || '' }; });
  }

  /* ---------- อ่านพิกัดที่ผู้ใช้วางลงช่องค้นหา ----------
     รองรับ "12.6814, 101.2816" · "12.6814 101.2816" · "12.6814N 101.2816E" */
  function gfParseLatLng(q) {
    var s = String(q || '').trim().replace(/[()]/g, '');
    var m = /^(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([NSns])?\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EWew])?$/.exec(s);
    if (!m) return null;
    var lat = parseFloat(m[1]), lng = parseFloat(m[3]);
    if (m[2] && /[Ss]/.test(m[2])) lat = -Math.abs(lat);
    if (m[4] && /[Ww]/.test(m[4])) lng = -Math.abs(lng);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat: lat, lng: lng };
  }

  /* ---------- Plus Code (Open Location Code) ----------
     รองรับทั้งรหัสเต็ม "7P52QMQ4+9F" และรหัสสั้นพร้อมชื่อพื้นที่ "QMQ4+9F ระยอง" */
  var GF_OLC_A = '23456789CFGHJMPQRVWX';
  var GF_OLC_RES = [20.0, 1.0, 0.05, 0.0025, 0.000125];
  function gfOlcClean(c) { return String(c || '').toUpperCase().replace(/\s+/g, ''); }
  function gfOlcDecode(code) {
    var s = gfOlcClean(code);
    if (s.indexOf('+') !== 8) return null;                 // ต้องเป็นรหัสเต็มเท่านั้น
    var body = s.replace(/\+/g, '').replace(/0+$/, '');
    if (body.length < 2) return null;
    var latLo = -90, lngLo = -180, latRes = GF_OLC_RES[0], lngRes = GF_OLC_RES[0], i = 0, p;
    for (p = 0; p < 5 && i + 1 < body.length + 1 && i < Math.min(body.length, 10); p++, i += 2) {
      var a = GF_OLC_A.indexOf(body.charAt(i));
      var b = i + 1 < body.length ? GF_OLC_A.indexOf(body.charAt(i + 1)) : 0;
      if (a < 0 || b < 0) return null;
      latLo += a * GF_OLC_RES[p]; lngLo += b * GF_OLC_RES[p];
      latRes = GF_OLC_RES[p]; lngRes = GF_OLC_RES[p];
    }
    var gLat = latRes, gLng = lngRes;                       // ตัวอักษรตัวที่ 11+ = ตารางย่อย 5x4
    for (var k = 10; k < body.length && k < 15; k++) {
      var v = GF_OLC_A.indexOf(body.charAt(k));
      if (v < 0) return null;
      gLat /= 5; gLng /= 4;
      latLo += Math.floor(v / 4) * gLat; lngLo += (v % 4) * gLng;
      latRes = gLat; lngRes = gLng;
    }
    var lat = latLo + latRes / 2, lng = lngLo + lngRes / 2;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat: lat, lng: lng };
  }
  function gfOlcPrefix(lat, lng, n) {                       // สร้างส่วนหน้าของรหัสจากพิกัดอ้างอิง
    var la = lat + 90, ln = lng + 180, out = '';
    for (var p = 0; p < n / 2; p++) {
      var da = Math.floor(la / GF_OLC_RES[p]); la -= da * GF_OLC_RES[p];
      var dn = Math.floor(ln / GF_OLC_RES[p]); ln -= dn * GF_OLC_RES[p];
      out += GF_OLC_A.charAt(Math.min(19, Math.max(0, da))) + GF_OLC_A.charAt(Math.min(19, Math.max(0, dn)));
    }
    return out;
  }
  function gfOlcRecover(shortCode, refLat, refLng) {
    var s = gfOlcClean(shortCode);
    var sep = s.indexOf('+');
    if (sep < 0 || sep >= 8 || sep % 2) return null;
    var pad = 8 - sep;
    var full = gfOlcPrefix(refLat, refLng, pad) + s;
    var d = gfOlcDecode(full);
    if (!d) return null;
    var reso = Math.pow(20, 2 - (pad / 2)), half = reso / 2;
    if (d.lat - refLat > half) d.lat -= reso; else if (refLat - d.lat > half) d.lat += reso;
    if (d.lng - refLng > half) d.lng -= reso; else if (refLng - d.lng > half) d.lng += reso;
    return d;
  }
  /* ความละเอียดของ Plus Code = ขนาดช่องสี่เหลี่ยมที่รหัสนั้นครอบคลุม (หน่วยเมตร)
     10 ตัว ≈ 14 ม. · 11 ตัว ≈ 3 ม. · ใช้เตือนเมื่อความคลาดเคลื่อนใหญ่เกินรัศมีที่ตั้งไว้ */
  function gfOlcCellMeters(code) {
    var raw = gfOlcClean(code);
    var sep = raw.indexOf('+');
    var pad = (sep >= 0 && sep < 8) ? (8 - sep) : 0;   // รหัสสั้น: นับตัวที่ถูกกู้คืนมาด้วย
    var body = raw.replace(/\+/g, '').replace(/0+$/, '');
    var n = body.length + pad;
    if (n < 2) return null;
    var latDeg, lngDeg;
    if (n <= 10) { latDeg = GF_OLC_RES[Math.min(Math.ceil(n / 2), 5) - 1]; lngDeg = latDeg; }
    else {
      latDeg = GF_OLC_RES[4]; lngDeg = GF_OLC_RES[4];
      for (var k = 10; k < n && k < 15; k++) { latDeg /= 5; lngDeg /= 4; }
    }
    return { lat: latDeg * 111320, lng: lngDeg * 111320, chars: n };
  }
  // ความคลาดเคลื่อนสูงสุดจากจุดกึ่งกลางช่อง (ครึ่งเส้นทแยงมุม)
  function gfOlcMaxError(code) {
    var c = gfOlcCellMeters(code);
    if (!c) return null;
    return Math.round(Math.sqrt(c.lat * c.lat + c.lng * c.lng) / 2);
  }
  // แยกคำค้นเป็น "รหัส Plus Code" + "ชื่อพื้นที่อ้างอิง" (ถ้ามี)
  function gfSplitPlus(q) {
    var m = /^\s*([23456789CFGHJMPQRVWX0]{2,8}\+[23456789CFGHJMPQRVWX]{0,7})\s*(.*)$/i.exec(String(q || ''));
    return m ? { code: m[1], near: (m[2] || '').trim() } : null;
  }

  var GF_UI = { map: null, marker: null, circle: null, empMarker: null, pick: 'company' };
  var GF_RADIUS = [50, 100, 200, 500];
  /* สถานะหน้าจอ — พิกัดทั้งหมดอยู่บนฐานข้อมูลจริง (njhr_geofences) ไม่เก็บใน localStorage */
  var GF_ST = { view: 'list', q: '', editId: null, seq: 0 };
  var GF_FORM = { lat: null, lng: null, radius: 100, address: '', nameAuto: false, active: true, emps: {} };
  var GF_ROWS = [], GF_EMP = { q: '', dept: '', rows: [], total: 0, depts: null };

  function gfErrEl(msg) { var b = document.getElementById('gf-err'); if (b) b.textContent = msg || ''; }

  function viewGeofence(el) {
    if (!gfRequireSA()) { return; }   // กันเปิดผ่าน URL ตรง — เฉพาะ SUPER_ADMIN
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    if (GF_ST.view === 'form') { gfRenderForm(el); return; }
    gfRenderList(el);
  }

  /* ---------- หน้ารายการพื้นที่ลงเวลา (การ์ด) ----------
     ข้อมูลจริงจาก njhr_gf_list เหมือนเดิมทุกประการ — เปลี่ยนเฉพาะการแสดงผลจากตารางเป็นการ์ด
     ไม่แตะ njhr_gf_save / njhr_gf_delete / ฟอร์มแก้ไข / แผนที่ */
  function gfRenderList(el) {
    var seq = ++GF_ST.seq;
    if (typeof GF_ST.status === 'undefined') GF_ST.status = 'ALL';
    if (typeof GF_ST.sort === 'undefined') GF_ST.sort = 'RECENT';

    el.innerHTML =
      '<div class="gf-head"><div class="grow"><h3>พื้นที่ลงเวลา</h3>' +
      '<p class="muted">จัดการสถานที่และพนักงานที่ได้รับอนุญาตให้ลงเวลาเข้า–ออกงาน</p></div></div>' +
      // แถบเครื่องมือแถวเดียว: ค้นหา → สถานะ → เรียงตาม → ปุ่มเพิ่ม (ขวาสุด)
      '<div class="gf-bar">' +
      '<span class="search-box gf-barsearch">' + icon('search', 'ic-sm') +
      '<input id="gf-lq" autocomplete="off" placeholder="ค้นหาชื่อสถานที่หรือที่อยู่" value="' +
      esc(GF_ST.q) + '"></span>' +
      '<span class="gf-seg" id="gf-st">' +
      [['ALL', 'ทั้งหมด'], ['ON', 'เปิดใช้งาน'], ['OFF', 'ปิดใช้งาน']].map(function (f) {
        return '<button type="button" class="gf-segb' + (GF_ST.status === f[0] ? ' on' : '') +
          '" data-gst="' + f[0] + '">' + f[1] + '</button>';
      }).join('') + '</span>' +
      // ป้าย "เรียงตาม" รวมอยู่ในตัวเลือกแล้ว ไม่มี label ลอยเหนือช่อง
      '<select id="gf-sort" class="gf-sort" aria-label="เรียงลำดับ">' +
      [['RECENT', 'ล่าสุด'], ['NAME', 'ชื่อสถานที่'], ['MEMBERS', 'จำนวนพนักงาน']].map(function (o) {
        return '<option value="' + o[0] + '"' + (GF_ST.sort === o[0] ? ' selected' : '') +
          '>เรียงตาม: ' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<button class="btn btn-primary gf-addbtn" id="gf-add">' + icon('plus') + ' เพิ่มพื้นที่ลงเวลา</button>' +
      '</div>' +
      '<div id="gf-body"><div class="gf-skel"></div><div class="gf-skel"></div></div>' +
      '<div id="gf-legacy"></div>' +
      '<div class="form-error" id="gf-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('gf-add').onclick = function () { gfOpenForm(null, el); };
    document.getElementById('gf-lq').oninput = debounce(function () {
      GF_ST.q = this.value.trim(); gfLoadList(el, ++GF_ST.seq);
    }, 320);
    document.getElementById('gf-st').onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-gst]') : null;
      if (!b) return;
      GF_ST.status = b.dataset.gst; gfRenderList(el);
    };
    document.getElementById('gf-sort').onchange = function () {
      GF_ST.sort = this.value; gfRenderList(el);
    };
    gfLoadList(el, seq);
    gfLegacyNotice(el);
  }

  function gfLoadList(el, seq) {
    gfErrEl('');
    sbRpcList('njhr_gf_list', { p_token: sbToken(), p_q: GF_ST.q || null }).then(function (rows) {
      if (seq !== GF_ST.seq) return;
      GF_ROWS = rows || [];
      gfDrawCards(el);
    }).catch(function (er) {
      if (seq !== GF_ST.seq) return;
      var body = document.getElementById('gf-body');
      if (body) body.innerHTML =
        '<div class="card"><div class="ot-warn"><b>โหลดข้อมูลไม่สำเร็จ</b><br>' +
        esc(er.message || 'เชื่อมต่อฐานข้อมูลไม่ได้') + '</div>' +
        '<button class="btn btn-primary btn-sm" id="gf-retry">ลองใหม่</button></div>';
      var rb = document.getElementById('gf-retry');
      if (rb) rb.onclick = function () { gfLoadList(el, ++GF_ST.seq); };
    });
  }

  function gfDrawCards(el) {
    var body = document.getElementById('gf-body');
    if (!body) return;
    var rows = GF_ROWS.filter(function (g) {
      if (GF_ST.status === 'ON') return !!g.active;
      if (GF_ST.status === 'OFF') return !g.active;
      return true;
    });
    if (GF_ST.sort === 'NAME') {
      rows = rows.slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'th'); });
    } else if (GF_ST.sort === 'MEMBERS') {
      rows = rows.slice().sort(function (a, b) { return (b.member_count || 0) - (a.member_count || 0); });
    }

    if (!rows.length) {
      body.innerHTML = '<div class="card gf-empty">' + icon('mapPin') +
        '<b>ยังไม่มีพื้นที่ลงเวลา</b><small>' +
        (GF_ST.q || GF_ST.status !== 'ALL'
          ? 'ไม่พบพื้นที่ตามเงื่อนไขที่เลือก'
          : 'กด "เพิ่มพื้นที่ลงเวลา" เพื่อสร้างพื้นที่แรก') + '</small></div>';
      return;
    }

    // ตารางแถวเดียว (Single Row) — ใช้พื้นที่แนวนอนเต็มความกว้าง
    body.innerHTML =
      '<div class="card p0"><div class="table-wrap"><table class="gf-table"><thead><tr>' +
      '<th>ชื่อสถานที่</th><th>พื้นที่</th><th>รัศมี</th>' +
      '<th>พนักงานที่ได้รับอนุญาต</th><th class="ta-c">จำนวน</th>' +
      '<th>สถานะ</th><th class="ta-r">จัดการ</th></tr></thead><tbody>' +
      rows.map(function (g) {
        var ms = g.members || [];
        var n = Number(g.member_count || 0);
        var shown = ms.slice(0, 2);
        var chips = shown.map(function (m) {
          return '<span class="gf-chip">' + esc(m.name) + '</span>';
        }).join('');
        var more = n > shown.length
          ? '<button type="button" class="gf-chip gf-more" data-gf-all="' + esc(g.id) + '">+' +
            (n - shown.length) + ' คน</button>' : '';
        return '<tr' + (g.active ? '' : ' class="gf-off"') + '>' +
          '<td class="gf-c-name"><span class="gf-name">' + icon('mapPin', 'ic-sm') +
          '<b>' + esc(g.name) + '</b></span></td>' +
          '<td class="gf-c-area"><span class="gf-1l">' + esc(gfShortAddr(g.address)) + '</span>' +
          (g.address ? '<button type="button" class="gf-infobtn" data-gf-addr="' + esc(g.id) + '" ' +
            'aria-label="ดูที่อยู่เต็ม" title="ดูที่อยู่เต็ม">' + icon('info', 'ic-sm') + '</button>' : '') +
          '</td>' +
          '<td class="gf-c-rad"><span class="gf-radbadge">' + g.radius + ' เมตร</span></td>' +
          '<td class="gf-c-emp">' + (n
            ? '<div class="gf-chips">' + chips + more + '</div>'
            : '<span class="muted">ยังไม่ได้กำหนด</span>') + '</td>' +
          '<td class="ta-c gf-c-n"><b>' + n + '</b></td>' +
          '<td class="gf-c-st">' + (g.active
            ? '<span class="badge badge-ok">เปิดใช้งาน</span>'
            : '<span class="badge badge-mut">ปิดใช้งาน</span>') + '</td>' +
          '<td class="ta-r gf-c-act">' +
          '<button class="btn-icon gf-btn" data-gf-edit="' + esc(g.id) + '" aria-label="แก้ไข" title="แก้ไขพื้นที่นี้">' +
          icon('edit') + '</button>' +
          '<button class="btn-icon gf-btn ic-red" data-gf-del="' + esc(g.id) + '" aria-label="ลบ" title="ลบพื้นที่นี้">' +
          icon('trash') + '</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';

    body.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-gf-edit],[data-gf-del],[data-gf-all],[data-gf-addr]') : null;
      if (!b) return;
      if (b.dataset.gfAddr) return gfAddrModal(b.dataset.gfAddr);
      if (b.dataset.gfAll) return gfMembersModal(b.dataset.gfAll);
      if (b.dataset.gfEdit) return gfOpenForm(b.dataset.gfEdit, el);
      gfDeleteArea(b.dataset.gfDel, el);
    };
  }

  /* ---------- ย่อที่อยู่ให้เหลือ ตำบล/อำเภอ/จังหวัด (แสดงผลเท่านั้น) ----------
     ไม่แตะข้อมูลในฐานข้อมูล · ที่อยู่เต็มยังอยู่ครบและเปิดดูได้จากปุ่ม ⓘ
     รองรับทั้งรูปแบบไทย (ต./อ./จ. · ตำบล/อำเภอ/จังหวัด · แขวง/เขต) และอังกฤษ (T./A./Tambon/Amphoe) */
  function gfShortAddr(addr) {
    var a = String(addr || '').trim();
    if (!a) return 'ยังไม่ได้ระบุที่อยู่';

    // ตัดรหัสไปรษณีย์และชื่อประเทศออกก่อน
    var t = a.replace(/\b\d{5}\b/g, ' ')
             .replace(/ประเทศไทย|Thailand/gi, ' ')
             .replace(/\s{2,}/g, ' ').trim();

    function pick(res) {
      for (var i = 0; i < res.length; i++) {
        var m = t.match(res[i]);
        if (m && m[1]) {
          var v = m[1].replace(/[,.]+$/, '').trim();
          if (v && v.length <= 40) return v;
        }
      }
      return '';
    }

    // กันไม่ให้จับข้ามคำนำหน้าตัวถัดไป เช่น "ศรีราชา จ.ชลบุรี"
    var NX = 'ตำบล|ต\\.|แขวง|อำเภอ|อ\\.|เขต|จังหวัด|จ\\.|T\\.|A\\.|Tambon|Khwaeng|Amphoe|Amphur|Khet|District|Changwat|Province';
    function grp(en) {
      var w = en ? '[A-Za-z]+' : '[^\\s,]+';
      return '(' + w + '(?:\\s(?!' + NX + ')' + w + ')?)';
    }
    var sub = pick([
      new RegExp('(?:ตำบล|ต\\.|แขวง)\\s*' + grp(false)),
      new RegExp('\\b(?:T\\.|Tambon|Khwaeng)\\s+' + grp(true), 'i')
    ]);
    var dist = pick([
      new RegExp('(?:อำเภอ|อ\\.|เขต)\\s*' + grp(false)),
      new RegExp('\\b(?:A\\.|Amphoe|Amphur|Khet|District)\\s+' + grp(true), 'i')
    ]);
    var prov = pick([
      new RegExp('(?:จังหวัด|จ\\.)\\s*' + grp(false)),
      new RegExp('\\b(?:Changwat|Province)\\s+' + grp(true), 'i')
    ]);
    // ไม่มีคำนำหน้าจังหวัด → ใช้คำสุดท้ายของที่อยู่ (มักเป็นชื่อจังหวัด)
    if (!prov) {
      var tail = t.split(/[,]/).pop().trim().split(/\s+/);
      var last = tail[tail.length - 1] || '';
      if (last && last !== dist && last !== sub && last.length <= 25) prov = last;
    }
    if (/กรุงเทพ|Bangkok/i.test(t)) prov = 'กรุงเทพมหานคร';

    // บางที่อยู่ไม่มีคำนำหน้าจังหวัด ทำให้ชื่ออำเภอ/ตำบลติดชื่อจังหวัดมาด้วย → ตัดออก
    function strip(v, tailWord) {
      if (!v || !tailWord) return v;
      var re = new RegExp('\\s*' + tailWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      return v.replace(re, '').trim() || v;
    }
    dist = strip(dist, prov);
    sub = strip(strip(sub, prov), dist);

    if (dist && prov) return dist + ', ' + prov;
    if (sub && dist) return sub + ', ' + dist;
    if (prov) return prov;
    if (dist) return dist;
    if (sub) return sub;
    return 'ไม่ระบุพื้นที่';
  }

  /* ที่อยู่เต็ม — เปิดจากปุ่ม ⓘ (ข้อมูลจาก njhr_gf_list ที่โหลดมาแล้ว ไม่ยิง RPC ซ้ำ) */
  function gfAddrModal(id) {
    var g = null;
    for (var i = 0; i < GF_ROWS.length; i++) if (GF_ROWS[i].id === id) { g = GF_ROWS[i]; break; }
    if (!g) return;
    openModal('ที่อยู่พื้นที่ลงเวลา',
      '<div class="gf-addr-full"><b>' + esc(g.name) + '</b>' +
      '<p>' + esc(g.address || 'ยังไม่ได้ระบุที่อยู่') + '</p>' +
      '<div class="bal-grid" style="margin-top:10px">' +
      '<div class="bal-item"><div class="bal-top"><span>รัศมี</span><b>' + g.radius + ' เมตร</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>พนักงานที่ได้รับอนุญาต</span><b>' +
      (g.member_count || 0) + ' คน</b></div></div></div></div>',
      '<button class="btn btn-ghost" id="gfa-close">ปิด</button>');
    document.getElementById('gfa-close').onclick = closeModal;
  }

  /* รายชื่อพนักงานทั้งหมดของพื้นที่ (ใช้ข้อมูลที่ njhr_gf_list ส่งมาแล้ว ไม่ยิง RPC ซ้ำ) */
  function gfMembersModal(id) {
    var g = null;
    for (var i = 0; i < GF_ROWS.length; i++) if (GF_ROWS[i].id === id) { g = GF_ROWS[i]; break; }
    if (!g) return;
    var ms = g.members || [];
    openModal('พนักงานที่ได้รับอนุญาต · ' + esc(g.name),
      '<p class="muted" style="margin-top:0">' + esc(g.address || '') + ' · รัศมี ' + g.radius + ' เมตร</p>' +
      (ms.length
        ? '<div class="list">' + ms.map(function (m) {
            return '<div class="list-row"><div class="grow"><b>' + esc(m.emp_code) + ' ' + esc(m.name) + '</b>' +
              '<small>' + esc(m.nickname ? m.nickname + ' · ' : '') +
              esc(m.department_name || m.department || '—') + '</small></div></div>';
          }).join('') + '</div>'
        : emptyState('ยังไม่ได้กำหนดพนักงานในพื้นที่นี้')) ,
      '<button class="btn btn-ghost" id="gfm-close">ปิด</button>');
    document.getElementById('gfm-close').onclick = closeModal;
  }

  // พื้นที่เดิมค่าเดียวที่ยังค้างในเครื่องนี้ → เสนอให้ย้ายขึ้นฐานข้อมูลแล้วล้างพิกัดออกจาก localStorage
  function gfLegacyNotice(el) {
    var box = document.getElementById('gf-legacy');
    var old = (db.settings && db.settings.geofence) || null;
    if (!box || !old || old.lat == null || old.lng == null) return;
    box.innerHTML = '<div class="card"><div class="ot-warn">พบพื้นที่ลงเวลาแบบเดิม (ค่าเดียว) ที่ยังเก็บอยู่ในเครื่องนี้: <b>' +
      esc(old.locationName || 'ไม่มีชื่อ') + '</b> · รัศมี ' + (old.radius || '-') + ' เมตร<br>' +
      'ย้ายขึ้นฐานข้อมูลเพื่อใช้งานต่อ แล้วระบบจะล้างพิกัดออกจากเครื่องนี้</div>' +
      '<div class="toolbar"><button class="btn btn-primary btn-sm" id="gf-migrate">' + icon('download') +
      ' ย้ายขึ้นฐานข้อมูล</button>' +
      '<button class="btn btn-ghost btn-sm" id="gf-drop">ล้างทิ้งโดยไม่ย้าย</button></div></div>';
    document.getElementById('gf-migrate').onclick = function () {
      var b = this; b.disabled = true;
      sbRpc('njhr_gf_save', {
        p_token: sbToken(), p_id: null, p_name: old.locationName || 'พื้นที่ลงเวลาเดิม',
        p_address: null, p_lat: old.lat, p_lng: old.lng,
        p_radius: old.radius || 100, p_active: true, p_employees: [],
        p_max_accuracy: old.maxAccuracy || 50
      }).then(function () {
        gfClearLegacy();
        toast('ย้ายพื้นที่เดิมขึ้นฐานข้อมูลแล้ว — อย่าลืมกำหนดพนักงานที่ได้รับอนุญาต');
        viewGeofence(el);
      }).catch(function (er) { b.disabled = false; gfErrEl(er.message || 'ย้ายข้อมูลไม่สำเร็จ'); });
    };
    document.getElementById('gf-drop').onclick = function () {
      confirmDialog('ล้างพื้นที่เดิมออกจากเครื่อง',
        'พิกัดที่เก็บอยู่ในเครื่องนี้จะถูกลบ (ข้อมูลบนฐานข้อมูลไม่ถูกแตะ)<br>ยืนยันหรือไม่',
        'ยืนยันล้าง', function () {
          gfClearLegacy(); toast('ล้างพิกัดออกจากเครื่องแล้ว', 'info'); viewGeofence(el);
        }, true);
    };
  }
  // ล้างเฉพาะพิกัด/ชื่อ/รัศมี — คงค่าโหมดระบบลงเวลาไว้ (เป็นค่าตั้งค่าระบบ ไม่ใช่ข้อมูลตำแหน่ง)
  function gfClearLegacy() {
    var g = db.settings.geofence || {};
    db.settings.geofence = {
      locationName: '', lat: null, lng: null, radius: g.radius || 100,
      maxAccuracy: g.maxAccuracy || 50, mode: g.mode || 'PROTOTYPE',
      updatedAt: nowStamp(), updatedBy: currentUser().username, updatedByRole: currentUser().role
    };
    saveDB();
    audit('GEOFENCE_UPDATE', 'ย้าย/ล้างพื้นที่ลงเวลาแบบเดิมออกจาก localStorage');
  }

  /* ต้องยืนยันก่อนลบเสมอ — เดิมถ้าพื้นที่ว่างเปล่า RPC จะลบทันทีตั้งแต่รอบตรวจ
     จึงย้ายมาถามก่อนแล้วค่อยเรียกด้วย p_confirm = true ครั้งเดียว */
  function gfDeleteArea(id, el) {
    var g = null;
    for (var i = 0; i < GF_ROWS.length; i++) if (GF_ROWS[i].id === id) g = GF_ROWS[i];
    gfErrEl('');
    var n = (g && g.member_count) || 0;
    confirmDialog('ลบพื้นที่ลงเวลา',
      'ลบพื้นที่ <b>' + esc(g ? g.name : '') + '</b> ใช่หรือไม่' +
      (g && g.address ? '<br><small class="muted">' + esc(g.address) + '</small>' : '') +
      '<br><br>' + (n ? 'มีพนักงานที่ได้รับอนุญาต <b>' + n + ' คน</b> ในพื้นที่นี้'
                      : 'พื้นที่นี้ยังไม่มีพนักงานที่ได้รับอนุญาต') +
      '<br><small class="muted">ประวัติการลงเวลาเดิมจะยังอยู่ครบ ไม่ถูกลบไปด้วย</small>',
      'ยืนยันลบ', function () {
        return sbRpc('njhr_gf_delete', { p_token: sbToken(), p_id: id, p_confirm: true })
          .then(function () {
            toast('ลบพื้นที่ลงเวลาแล้ว', 'info');
            gfLoadList(el, ++GF_ST.seq);      // อัปเดตรายการทันที ไม่รีเฟรชหน้า
          });
      }, true);
  }

  /* ---------- ฟอร์มเพิ่ม / แก้ไขพื้นที่ ---------- */
  function gfOpenForm(id, el) {
    GF_ST.view = 'form'; GF_ST.editId = id || null;
    GF_FORM = { lat: null, lng: null, radius: 100, address: '', nameAuto: false,
                active: true, emps: {}, addrLocked: false };
    GF_EMP = { q: '', dept: '', rows: [], total: 0, depts: GF_EMP.depts };
    if (!id) { viewGeofence(el); return; }
    var g = null;
    for (var i = 0; i < GF_ROWS.length; i++) if (GF_ROWS[i].id === id) g = GF_ROWS[i];
    if (g) {
      GF_FORM.lat = g.lat; GF_FORM.lng = g.lng; GF_FORM.radius = g.radius;
      GF_FORM.address = g.address || '';
      GF_FORM.addrLocked = !!g.address;          // ที่อยู่ที่บันทึกไว้แล้ว ห้ามถูกเขียนทับตอนเปิดกลับมา
      GF_FORM.active = g.active !== false;
      (g.members || []).forEach(function (m) {
        GF_FORM.emps[m.employee_id] = { emp_code: m.emp_code, name: m.name, nickname: m.nickname };
      });
      GF_FORM.name = g.name;
    }
    viewGeofence(el);
  }
  function gfCloseForm(el) { GF_ST.view = 'list'; GF_ST.editId = null; viewGeofence(el); }

  function gfRenderForm(el) {
    var editing = !!GF_ST.editId;
    el.innerHTML =
      '<div class="card"><div class="card-head">' +
      '<button class="btn btn-ghost btn-sm" id="gf-back">← รายการพื้นที่ลงเวลา</button>' +
      '<span class="grow"></span><h3>' + (editing ? 'แก้ไขพื้นที่ลงเวลา' : 'เพิ่มพื้นที่ลงเวลา') + '</h3></div>' +
      '<div class="gf-2col">' +
      '<div class="gf-left">' +
      '<span class="search-box gf-search">' + icon('search', 'ic-sm') +
      '<input id="gf-q" autocomplete="off" placeholder="ค้นหาชื่อสถานที่ บริษัท ที่อยู่ Plus Code หรือพิกัด">' +
      '<button class="btn btn-primary btn-sm" type="button" id="gf-q-go">ค้นหา</button>' +
      '<div class="rpt-ac" id="gf-q-ac" hidden></div></span>' +
      '<div id="gf-map"></div>' +
      '<small class="muted" id="gf-map-note">คลิกบนแผนที่เพื่อปักหมุด หรือลากหมุดเพื่อย้ายตำแหน่ง</small>' +
      '<div class="gf-info" id="gf-info">' +
      '<div><small>พิกัด</small><b id="gf-ll">—</b></div>' +
      '<div><small>ที่อยู่</small><b id="gf-addr">—</b></div></div>' +
      '</div>' +
      '<div class="gf-right">' +
      '<div class="field"><span class="gf-lbl">ชื่อสถานที่ <i class="req">*</i>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="gf-useorg">' + icon('building') +
      ' ใช้ชื่อ+ที่อยู่บริษัท</button></span>' +
      '<input id="gf-name" value="' + esc(GF_FORM.name || '') + '" placeholder="เช่น สำนักงานใหญ่ / บ้านคุณสมชาย"></div>' +
      '<div class="field"><span>พื้นที่อนุญาตให้ลงเวลา</span>' +
      '<div class="gf-radius" id="gf-radius-box">' +
      GF_RADIUS.map(function (r) {
        return '<button type="button" class="gf-r" data-r="' + r + '">' + r + ' เมตร' +
          (r === 100 ? '<small>แนะนำ</small>' : '') + '</button>';
      }).join('') +
      '<label class="gf-r-custom"><span>กำหนดเอง</span>' +
      '<input id="gf-r-custom" type="number" min="1" max="20000" inputmode="numeric" placeholder="—">' +
      '<span>เมตร</span></label></div></div>' +
      '<label class="check"><input type="checkbox" id="gf-active"' + (GF_FORM.active ? ' checked' : '') +
      '><span>เปิดใช้งานพื้นที่นี้</span></label>' +
      gfEmpPickerHtml() +
      '<div class="gf-btns">' +
      '<button class="btn btn-ghost" id="gf-cur">' + icon('mapPin') + ' ใช้ตำแหน่งปัจจุบัน</button>' +
      '<button class="btn btn-primary btn-lg" id="gf-save">' + icon('check') + ' บันทึก</button></div>' +
      '<div class="form-error" id="gf-err" role="alert" style="white-space:pre-line"></div>' +
      '</div></div></div>';

    document.getElementById('gf-back').onclick = function () { gfCloseForm(el); };
    gfBindMap(el);
    gfBindSearch(el);
    gfBindRadius(el);
    gfBindEmpPicker(el);
    gfBindActions(el);
  }

  /* ---------- ตัวเลือกพนักงาน (ข้อมูลจริงจากฐานข้อมูล) ---------- */
  function gfEmpPickerHtml() {
    return '<div class="field"><span>พนักงานที่ได้รับอนุญาต <i class="req">*</i></span>' +
      '<div class="gf-emp">' +
      '<div class="toolbar gf-emp-bar">' +
      '<span class="search-box" style="flex:1">' + icon('search', 'ic-sm') +
      '<input id="gf-eq" autocomplete="off" placeholder="ค้นหา รหัสพนักงาน / ชื่อ-นามสกุล / ชื่อเล่น"></span>' +
      '<select id="gf-edept"><option value="">ทุกแผนก</option></select></div>' +
      '<label class="check gf-all"><input type="checkbox" id="gf-eall"><span>เลือกทั้งหมด (ตามตัวกรองปัจจุบัน)</span></label>' +
      '<div class="gf-emp-list" id="gf-elist"><small class="muted" style="padding:10px;display:block">กำลังโหลดรายชื่อพนักงาน…</small></div>' +
      '<div class="gf-tags" id="gf-etags"></div>' +
      '</div></div>';
  }

  function gfSelCount() { return Object.keys(GF_FORM.emps).length; }
  function gfRenderTags() {
    var box = document.getElementById('gf-etags');
    if (!box) return;
    var ids = Object.keys(GF_FORM.emps);
    box.innerHTML = ids.length
      ? '<span class="chip chip-info">เลือกแล้ว ' + ids.length + ' คน</span>' +
        ids.map(function (id) {
          var e = GF_FORM.emps[id];
          return '<span class="gf-tag"><b>' + esc(e.emp_code) + '</b> ' + esc(e.name) +
            (e.nickname ? ' (' + esc(e.nickname) + ')' : '') +
            '<button type="button" class="wf-chip-x" data-etag="' + esc(id) + '" aria-label="เอาออก">' +
            icon('x') + '</button></span>';
        }).join('')
      : '<span class="muted">ยังไม่ได้เลือกพนักงาน</span>';
    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-etag]') : null;
      if (!b) return;
      delete GF_FORM.emps[b.dataset.etag];
      gfRenderTags(); gfRenderEmpList();
    };
  }
  function gfRenderEmpList() {
    var box = document.getElementById('gf-elist');
    if (!box) return;
    box.innerHTML = GF_EMP.rows.length ? GF_EMP.rows.map(function (e) {
      return '<label class="gf-emp-item"><input type="checkbox" data-emp="' + esc(e.id) + '"' +
        (GF_FORM.emps[e.id] ? ' checked' : '') + '>' +
        '<span class="grow"><b>' + esc(e.emp_code) + '</b> ' + esc(e.full_name) +
        (e.nickname ? ' (' + esc(e.nickname) + ')' : '') +
        '<small>' + esc(e.position_name || '-') + ' · ' + esc(e.department_name || '-') + '</small></span></label>';
    }).join('') + (GF_EMP.total > GF_EMP.rows.length
        ? '<small class="muted" style="padding:8px 12px;display:block">แสดง ' + GF_EMP.rows.length +
          ' จาก ' + GF_EMP.total + ' คน — พิมพ์ค้นหาเพื่อจำกัดผลลัพธ์</small>' : '')
      : '<small class="muted" style="padding:10px;display:block">ไม่พบพนักงานตามเงื่อนไข</small>';

    box.onchange = function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.emp) return;
      var e = null;
      for (var i = 0; i < GF_EMP.rows.length; i++) if (GF_EMP.rows[i].id === t.dataset.emp) e = GF_EMP.rows[i];
      if (t.checked && e) {
        GF_FORM.emps[e.id] = { emp_code: e.emp_code, name: e.full_name, nickname: e.nickname || '' };
      } else delete GF_FORM.emps[t.dataset.emp];
      gfRenderTags();
      var all = document.getElementById('gf-eall');
      if (all) all.checked = GF_EMP.rows.length > 0 && GF_EMP.rows.every(function (r) { return !!GF_FORM.emps[r.id]; });
    };
  }
  function gfLoadEmps() {
    var box = document.getElementById('gf-elist');
    if (box) box.innerHTML = '<small class="muted" style="padding:10px;display:block">กำลังโหลด…</small>';
    return sbRpcList('njhr_emp_list', {
      p_token: sbToken(), p_q: GF_EMP.q || null, p_dept: GF_EMP.dept || null,
      p_status: 'ACTIVE', p_sort: 'emp_code', p_desc: false, p_limit: 100, p_offset: 0
    }).then(function (rows) {
      GF_EMP.rows = rows || [];
      GF_EMP.total = (rows && rows.length && rows[0].total_count) || (rows || []).length;
      gfRenderEmpList();
      var all = document.getElementById('gf-eall');
      if (all) all.checked = GF_EMP.rows.length > 0 && GF_EMP.rows.every(function (r) { return !!GF_FORM.emps[r.id]; });
    }).catch(function (er) {
      if (box) box.innerHTML = '<small class="muted" style="padding:10px;display:block">โหลดรายชื่อไม่สำเร็จ</small>';
      gfErrEl(er.message || 'โหลดรายชื่อพนักงานไม่สำเร็จ');
    });
  }
  function gfBindEmpPicker(el) {
    document.getElementById('gf-eq').oninput = debounce(function () {
      GF_EMP.q = this.value.trim(); gfLoadEmps();
    }, 320);
    document.getElementById('gf-edept').onchange = function () { GF_EMP.dept = this.value; gfLoadEmps(); };
    document.getElementById('gf-eall').onchange = function () {
      var on = this.checked;
      GF_EMP.rows.forEach(function (e) {
        if (on) GF_FORM.emps[e.id] = { emp_code: e.emp_code, name: e.full_name, nickname: e.nickname || '' };
        else delete GF_FORM.emps[e.id];
      });
      gfRenderTags(); gfRenderEmpList();
    };
    gfRenderTags();
    // แผนกจริงจากทะเบียนแผนก
    function fillDepts(list) {
      var s = document.getElementById('gf-edept');
      if (!s) return;
      s.innerHTML = '<option value="">ทุกแผนก</option>' + list.map(function (d) {
        return '<option value="' + esc(d) + '"' + (GF_EMP.dept === d ? ' selected' : '') + '>' + esc(d) + '</option>';
      }).join('');
    }
    if (GF_EMP.depts) fillDepts(GF_EMP.depts);
    else {
      sbRpcList('njhr_dept_list', { p_token: sbToken() }).then(function (rows) {
        GF_EMP.depts = (rows || []).map(function (d) { return d.name; }).filter(Boolean);
        fillDepts(GF_EMP.depts);
      }).catch(function () { GF_EMP.depts = []; });
    }
    gfLoadEmps();
  }

  /* ---------- แผนที่ ---------- */
  function gfBindMap(el) {
    var noteEl = document.getElementById('gf-map-note');
    function syncMap(fly) {
      if (!GF_UI.map || GF_FORM.lat == null || GF_FORM.lng == null) return;
      var lat = GF_FORM.lat, lng = GF_FORM.lng, r = GF_FORM.radius;
      if (!GF_UI.marker) {
        GF_UI.marker = window.L.marker([lat, lng], { draggable: true }).addTo(GF_UI.map)
          .bindTooltip('จุดศูนย์กลางพื้นที่ลงเวลา');
        GF_UI.marker.on('dragend', function () {
          if (!gfRequireSA(false)) return;
          var p = GF_UI.marker.getLatLng();
          gfSetPoint(p.lat, p.lng, true);
        });
      } else GF_UI.marker.setLatLng([lat, lng]);
      if (!GF_UI.circle) {
        GF_UI.circle = window.L.circle([lat, lng], { radius: r > 0 ? r : 0, color: '#A61E22', fillOpacity: .12 })
          .addTo(GF_UI.map);
      } else {
        GF_UI.circle.setLatLng([lat, lng]);
        GF_UI.circle.setRadius(r > 0 ? r : 0);
      }
      if (fly !== false) GF_UI.map.setView([lat, lng], Math.max(GF_UI.map.getZoom() || 0, 16));
    }
    GF_UI.syncMap = syncMap;
    GF_UI.note = noteEl;

    GF_UI.map = GF_UI.marker = GF_UI.circle = GF_UI.empMarker = null;
    gfLoadLeaflet().then(function () {
      var has = GF_FORM.lat != null && GF_FORM.lng != null;
      var start = [has ? GF_FORM.lat : 12.6814, has ? GF_FORM.lng : 101.2816];
      GF_UI.map = window.L.map('gf-map').setView(start, has ? 16 : 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' })
        .addTo(GF_UI.map);
      GF_UI.map.on('click', function (ev) {
        if (!gfRequireSA(false)) return;
        gfSetPoint(ev.latlng.lat, ev.latlng.lng, true);
      });
      if (has) {
        gfSetPoint(GF_FORM.lat, GF_FORM.lng, false, null, GF_FORM.address);
        noteEl.textContent = 'พื้นที่ที่บันทึกไว้ · รัศมี ' + GF_FORM.radius + ' เมตร';
      } else noteEl.textContent = 'ยังไม่กำหนดพื้นที่ — ค้นหาสถานที่ หรือคลิกบนแผนที่เพื่อปักหมุด';
    }).catch(function () {
      noteEl.textContent = 'โหลดแผนที่ไม่สำเร็จ (ต้องใช้อินเทอร์เน็ต) — ลองใหม่อีกครั้งเมื่อเชื่อมต่อได้';
    });
  }

  /* จุดศูนย์กลาง — ผู้ใช้ไม่ต้องกรอกพิกัดเอง ระบบเก็บและแสดงให้อ่านอย่างเดียว */
  var gfRevSeq = 0;
  function gfSetPoint(lat, lng, lookupName, forcedName, forcedAddr, preserveAddress) {
    GF_FORM.lat = +(+lat).toFixed(6);
    GF_FORM.lng = +(+lng).toFixed(6);
    if (GF_UI.syncMap) GF_UI.syncMap();
    if (GF_UI.note) GF_UI.note.textContent = 'ปักหมุดแล้ว · รัศมี ' + GF_FORM.radius + ' เมตร';
    gfErrEl('');
    var llEl = document.getElementById('gf-ll');
    if (llEl) llEl.textContent = GF_FORM.lat.toFixed(6) + ', ' + GF_FORM.lng.toFixed(6);
    var adEl = document.getElementById('gf-addr');
    var nameEl = document.getElementById('gf-name');
    if (forcedName && nameEl) { nameEl.value = forcedName; GF_FORM.nameAuto = true; }
    if (forcedAddr) {
      GF_FORM.address = forcedAddr;
      if (adEl) adEl.textContent = forcedAddr;
      if (preserveAddress) GF_FORM.addrLocked = true;   // Plus Code / พิกัด = ที่อยู่ที่ผู้ใช้กำหนดเอง
    } else if (adEl && !preserveAddress && !GF_FORM.addrLocked) {
      adEl.textContent = 'กำลังค้นหาที่อยู่…';
    }

    var seq = ++gfRevSeq;
    // preserveAddress = true → ที่อยู่ที่ผู้ใช้ค้นหา (เช่น Plus Code) เป็นค่าหลัก ห้ามถูกเขียนทับ
    if (preserveAddress) return;
    // ที่อยู่ที่ล็อกไว้ (กดปุ่ม "ใช้ชื่อ+ที่อยู่บริษัท") จะไม่ถูก OpenStreetMap เขียนทับ
    if (GF_FORM.addrLocked && !forcedAddr) return;

    gfGeoReverseFull(GF_FORM.lat, GF_FORM.lng).then(function (r) {
      if (seq !== gfRevSeq) return;
      var a2 = document.getElementById('gf-addr');
      if (!forcedAddr && !GF_FORM.addrLocked) { GF_FORM.address = r.address || ''; if (a2) a2.textContent = r.address || '—'; }
      if (!lookupName || !r.name) return;
      var n2 = document.getElementById('gf-name');
      if (!n2) return;
      if (n2.value.trim() && !GF_FORM.nameAuto) return;   // ชื่อที่ผู้ใช้พิมพ์เองจะไม่ถูกทับ
      n2.value = r.name;
      GF_FORM.nameAuto = true;
    }).catch(function () {
      if (seq !== gfRevSeq) return;
      var a3 = document.getElementById('gf-addr');
      if (a3 && !forcedAddr) a3.textContent = 'ดึงที่อยู่ไม่สำเร็จ (ต้องใช้อินเทอร์เน็ต)';
    });
  }

  /* ---------- ค้นหาสถานที่ (ช่องเดียว รองรับทุกรูปแบบ) ---------- */
  function gfBindSearch(el) {
    var qEl = document.getElementById('gf-q');
    var acEl = document.getElementById('gf-q-ac');
    var seqQ = 0;
    function closeAc() { acEl.hidden = true; acEl.innerHTML = ''; acEl._rows = null; }
    function acShow(html) { acEl.innerHTML = html; acEl.hidden = false; }
    function acItems(rows) {
      acEl._rows = rows;
      acShow(rows.map(function (r, i) {
        return '<button type="button" class="rpt-ac-item" data-gi="' + i + '">' +
          '<b>' + esc(r.label) + '</b><small>' + esc(r.sub || '') + '</small></button>';
      }).join(''));
    }
    function gfRef() {
      if (GF_FORM.lat != null && GF_FORM.lng != null) return { lat: GF_FORM.lat, lng: GF_FORM.lng };
      if (GF_UI.map && GF_UI.map.getCenter) {
        var c = GF_UI.map.getCenter();
        if (c) return { lat: c.lat, lng: c.lng };
      }
      return { lat: 12.6814, lng: 101.2816 };
    }
    // พื้นที่ที่บันทึกไว้แล้วในฐานข้อมูล ใช้เป็นตัวเลือกลัดได้ด้วย
    function gfSavedMatches(q) {
      var lq = q.toLowerCase();
      return (GF_ROWS || []).filter(function (g) {
        return g.lat != null && (!lq || String(g.name).toLowerCase().indexOf(lq) >= 0 ||
          String(g.address || '').toLowerCase().indexOf(lq) >= 0);
      }).slice(0, 3).map(function (g) {
        return { label: g.name, sub: 'พื้นที่ที่บันทึกไว้ · ' + (g.address || (g.lat + ', ' + g.lng)),
                 lat: g.lat, lng: g.lng, name: g.name, addr: g.address || '', kind: 'saved' };
      });
    }
    // เลือกผลลัพธ์ 1 รายการแล้วปักหมุดทันที
    function gfPick(r, rawQuery) {
      closeAc();
      if (!r) return;
      // Plus Code / พิกัด → ใช้ข้อความที่ผู้ใช้วางเป็นที่อยู่ และห้าม Reverse Geocoding เขียนทับ
      var keep = (r.kind === 'plus' || r.kind === 'coord');
      if (!keep) GF_FORM.addrLocked = false;      // เลือกสถานที่จากผลค้นหา → ใช้ที่อยู่ของผลนั้น
      gfSetPoint(r.lat, r.lng, !keep && !r.name, r.name || '',
                 keep ? (rawQuery || r.label) : (r.addr || ''), keep);
      GF_UI.lastPick = r;
      gfWarnPrecision(r);
    }
    GF_UI.warnPrecision = gfWarnPrecision;
    /* เตือนเมื่อความคลาดเคลื่อนของ Plus Code ใหญ่เกินไปเมื่อเทียบกับรัศมีที่ตั้งไว้
       ปักหมุดให้ตามปกติ แต่แนะนำให้ใช้พิกัดเต็มหรือ Plus Code 11 ตัวเพื่อความแม่นยำสูงสุด */
    function gfWarnPrecision(r) {
      if (!r || r.kind !== 'plus' || !r.code) { gfErrEl(''); return; }
      var err = gfOlcMaxError(r.code);
      var rad = GF_FORM.radius || 0;
      if (err == null) { gfErrEl(''); return; }
      if (rad > 0 && err <= rad * 0.2) { gfErrEl(''); return; }   // คลาดไม่เกิน 20% ของรัศมี = ยอมรับได้
      gfErrEl('Plus Code นี้ระบุได้เป็นช่องพื้นที่ ไม่ใช่จุดเดียว — ' +
        'หมุดอาจคลาดจากจุดจริงได้ถึง ' + err + ' เมตร' +
        (rad > 0 ? ' (รัศมีที่ตั้งไว้ ' + rad + ' เมตร)' : '') + '\n' +
        'เพื่อความแม่นยำสูงสุด ให้วางพิกัดเต็ม เช่น 13.080632, 100.934815 ' +
        'หรือใช้ Plus Code แบบเต็ม 11 ตัว');
    }
    /* ถอดพิกัดจากคำค้นแบบทันที (ไม่ต้องรอเน็ต)
       คืน null ถ้าต้องไปค้นหาต่อ · คืน Promise เมื่อเป็น Plus Code สั้น + ชื่อพื้นที่ */
    function gfResolveDirect(q) {
      var ll = gfParseLatLng(q);
      if (ll) return { lat: ll.lat, lng: ll.lng, kind: 'coord',
                       label: 'พิกัด ' + ll.lat.toFixed(6) + ', ' + ll.lng.toFixed(6) };
      // ↓ Plus Code — แนบรหัสไปด้วยเพื่อคำนวณความคลาดเคลื่อน
      var pc = gfSplitPlus(q);
      if (!pc) return null;
      var full = gfOlcDecode(pc.code);
      if (full) return { lat: full.lat, lng: full.lng, kind: 'plus', code: pc.code,
                         label: 'Plus Code ' + pc.code.toUpperCase() };
      if (!pc.near) {
        var rf = gfRef();
        var rec = gfOlcRecover(pc.code, rf.lat, rf.lng);
        if (rec) return { lat: rec.lat, lng: rec.lng, kind: 'plus', code: pc.code,
                          label: 'Plus Code ' + pc.code.toUpperCase() };
        return null;
      }
      return { pending: pc };     // Plus Code สั้น + ชื่อพื้นที่ → ต้องหาพื้นที่อ้างอิงก่อน
    }

    /* submit = กด Enter หรือปุ่ม "ค้นหา" → ปักหมุดทันทีเมื่อระบบตัดสินใจได้เอง
       submit = false → แสดงรายการแนะนำระหว่างพิมพ์เท่านั้น */
    function runSearch(submit) {
      var q = qEl.value.trim();
      if (!q) { closeAc(); return; }
      var seq = ++seqQ;
      var direct = gfResolveDirect(q);

      // 1) พิกัด หรือ Plus Code เต็ม → ปักหมุดทันที ไม่เปิดรายการให้เลือกซ้ำ
      if (submit && direct && !direct.pending) { gfPick(direct, q); return; }

      // 2) Plus Code สั้น + ชื่อพื้นที่ → หาพื้นที่อ้างอิงก่อน แล้วปักหมุดทันที (สำคัญกว่าผล OSM เสมอ)
      if (submit && direct && direct.pending) {
        var pc = direct.pending;
        acShow('<div class="rpt-ac-item muted"><span class="spinner"></span> กำลังถอดรหัส Plus Code…</div>');
        gfGeoSearch(pc.near).then(function (rows) {
          if (seq !== seqQ) return;
          var rec = (rows && rows.length)
            ? gfOlcRecover(pc.code, parseFloat(rows[0].lat), parseFloat(rows[0].lon)) : null;
          if (!rec) {
            gfErrEl('ถอดรหัส Plus Code ไม่สำเร็จ — ไม่พบพื้นที่อ้างอิง "' + pc.near + '"');
            closeAc();
            return;
          }
          gfPick({ lat: rec.lat, lng: rec.lng, kind: 'plus', code: pc.code,
                   label: 'Plus Code ' + pc.code.toUpperCase() }, q);
        }).catch(function () {
          if (seq !== seqQ) return;
          gfErrEl('ถอดรหัส Plus Code ไม่สำเร็จ (ต้องใช้อินเทอร์เน็ต)');
          closeAc();
        });
        return;
      }

      // 3) ค้นหาชื่อสถานที่ทั่วไป
      var saved = gfSavedMatches(q);
      if (submit && saved.length === 1 && !direct) { gfPick(saved[0], q); return; }
      var pre = direct && !direct.pending ? [direct] : [];
      acShow('<div class="rpt-ac-item muted"><span class="spinner"></span> กำลังค้นหา…</div>');
      gfGeoSearch(q).then(function (rows) {
        if (seq !== seqQ) return;
        var found = (rows || []).map(function (r) {
          return { label: gfPlaceName(r), sub: r.display_name || '',
                   lat: parseFloat(r.lat), lng: parseFloat(r.lon),
                   name: gfPlaceName(r), addr: r.display_name || '', kind: 'osm' };
        }).filter(function (r) { return isFinite(r.lat) && isFinite(r.lng); });
        var all = pre.concat(saved, found);
        if (!all.length) {
          if (submit) gfErrEl('ไม่พบสถานที่ที่ค้นหา กรุณาลองค้นหาด้วยชื่อสถานที่ ที่อยู่ Plus Code หรือพิกัด');
          acShow('<div class="rpt-ac-item muted">ไม่พบสถานที่ที่ค้นหา ' +
            'กรุณาลองค้นหาด้วยชื่อสถานที่ ที่อยู่ Plus Code หรือพิกัด</div>');
          return;
        }
        if (submit && all.length === 1) { gfPick(all[0], q); return; }   // พบรายการเดียว → ปักหมุดเลย
        acItems(all);
      }).catch(function () {
        if (seq !== seqQ) return;
        if (submit) gfErrEl('ค้นหาไม่สำเร็จ (ต้องใช้อินเทอร์เน็ต) — คลิกบนแผนที่เพื่อปักหมุดเอง');
        acShow('<div class="rpt-ac-item muted">ค้นหาไม่สำเร็จ (ต้องใช้อินเทอร์เน็ต) — ' +
          'คลิกบนแผนที่เพื่อปักหมุดเอง</div>');
      });
    }
    var runSuggest = debounce(function () { runSearch(false); }, 450);
    qEl.oninput = runSuggest;
    qEl.onkeydown = function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); closeAc(); runSearch(true); }
    };
    qEl.onblur = function () { setTimeout(closeAc, 180); };
    qEl.onfocus = function () { if (acEl._rows && acEl._rows.length) acEl.hidden = false; };
    document.getElementById('gf-q-go').onclick = function () { closeAc(); runSearch(true); };
    acEl.onmousedown = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-gi]') : null;
      if (!b) return;
      ev.preventDefault();
      gfPick((acEl._rows || [])[parseInt(b.dataset.gi, 10)], qEl.value.trim());
    };
  }

  /* ---------- รัศมี ---------- */
  function gfBindRadius(el) {
    var customEl = document.getElementById('gf-r-custom');
    function syncRadius() {
      var preset = GF_RADIUS.indexOf(GF_FORM.radius) >= 0;
      el.querySelectorAll('.gf-r').forEach(function (b) {
        b.classList.toggle('on', preset && Number(b.dataset.r) === GF_FORM.radius);
      });
      customEl.parentNode.classList.toggle('on', !preset);
      if (preset) { if (document.activeElement !== customEl) customEl.value = ''; }
      else if (document.activeElement !== customEl) customEl.value = GF_FORM.radius;
      if (GF_FORM.lat != null && GF_UI.note) {
        GF_UI.note.textContent = 'พื้นที่ที่เลือก · รัศมี ' + GF_FORM.radius + ' เมตร';
      }
      if (GF_UI.syncMap) GF_UI.syncMap(false);
      if (GF_UI.lastPick) GF_UI.warnPrecision(GF_UI.lastPick);   // รัศมีเปลี่ยน → ประเมินคำเตือนใหม่
    }
    el.querySelectorAll('.gf-r').forEach(function (b) {
      b.onclick = function () {
        if (!gfRequireSA(false)) return;
        GF_FORM.radius = Number(b.dataset.r); syncRadius();
      };
    });
    customEl.oninput = function () {
      if (!gfRequireSA(false)) return;
      var v = parseInt(this.value, 10);
      if (isFinite(v) && v > 0) { GF_FORM.radius = v; syncRadius(); }
    };
    syncRadius();
  }

  /* ---------- ปุ่มใช้งาน + บันทึกลงฐานข้อมูลจริง ---------- */
  function gfBindActions(el) {
    document.getElementById('gf-active').onchange = function () { GF_FORM.active = this.checked; };
    // เติมชื่อและที่อยู่จาก "หัวเอกสาร" (njhr_org_profile) — ข้อมูลจริงในระบบ ไม่ Hardcode
    document.getElementById('gf-useorg').onclick = function () {
      var btn = this;
      btn.disabled = true;
      sbRpc('njhr_doc_org', { p_token: sbToken() }).then(function (r) {
        btn.disabled = false;
        var o = (r && r.data) || {};
        if (!o.company_name && !o.address) {
          gfErrEl('ยังไม่ได้ตั้งชื่อบริษัทและที่อยู่ที่หน้า "เอกสาร HR → หัวเอกสาร"');
          return;
        }
        if (o.company_name) {
          document.getElementById('gf-name').value = o.company_name;
          GF_FORM.nameAuto = false;                 // ถือเป็นค่าที่ผู้ใช้เลือกเอง ห้ามถูกทับ
        }
        if (o.address) {
          GF_FORM.address = o.address;
          GF_FORM.addrLocked = true;               // ห้าม OpenStreetMap เขียนทับที่อยู่จริงของบริษัท
          var ad = document.getElementById('gf-addr');
          if (ad) ad.textContent = o.address;
        }
        gfErrEl('');
        toast('ใช้ชื่อและที่อยู่บริษัทจากหัวเอกสารแล้ว', 'info');
      }).catch(function (er) {
        btn.disabled = false;
        gfErrEl(er.message || 'ดึงข้อมูลบริษัทไม่สำเร็จ');
      });
    };
    document.getElementById('gf-name').oninput = function () { GF_FORM.nameAuto = false; };

    document.getElementById('gf-cur').onclick = function () {
      if (!gfRequireSA(false)) return;
      if (!navigator.geolocation) { gfErrEl('อุปกรณ์นี้ไม่รองรับการอ่านตำแหน่ง — คลิกบนแผนที่เพื่อปักหมุดแทน'); return; }
      var b = this; b.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        b.disabled = false;
        gfSetPoint(pos.coords.latitude, pos.coords.longitude, true);
        toast('ใช้ตำแหน่งปัจจุบันแล้ว (ความแม่นยำ ' + Math.round(pos.coords.accuracy) + ' ม.)');
      }, function () {
        b.disabled = false;
        gfErrEl('อ่านตำแหน่งไม่สำเร็จ — กรุณาอนุญาตการเข้าถึงตำแหน่ง หรือคลิกบนแผนที่เพื่อปักหมุดแทน');
      }, { enableHighAccuracy: true, timeout: 10000 });
    };

    function readForm() {
      var name = document.getElementById('gf-name').value.trim();
      if (GF_FORM.lat == null || GF_FORM.lng == null) {
        return { ok: false, msg: 'กรุณาค้นหาสถานที่ หรือคลิกบนแผนที่เพื่อปักหมุดก่อน' };
      }
      if (!name) return { ok: false, msg: 'กรุณาระบุชื่อสถานที่' };
      if (!(GF_FORM.radius > 0)) return { ok: false, msg: 'รัศมีต้องมากกว่า 0 เมตร' };
      if (!gfSelCount()) return { ok: false, msg: 'กรุณาเลือกพนักงานที่ได้รับอนุญาตอย่างน้อย 1 คน' };
      return { ok: true, name: name };
    }

    document.getElementById('gf-save').onclick = function () {
      if (!gfRequireSA()) return;
      var v = readForm();
      if (!v.ok) { gfErrEl(v.msg); return; }
      var btn = this;
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      gfErrEl('');
      sbRpc('njhr_gf_save', {
        p_token: sbToken(), p_id: GF_ST.editId || null,
        p_name: v.name, p_address: GF_FORM.address || null,
        p_lat: GF_FORM.lat, p_lng: GF_FORM.lng, p_radius: GF_FORM.radius,
        p_active: GF_FORM.active, p_employees: Object.keys(GF_FORM.emps)   // Employee ID จริงเท่านั้น
      }).then(function (r) {
        toast('บันทึกพื้นที่ลงเวลาแล้ว' + (r && r.member_count != null ? ' · พนักงาน ' + r.member_count + ' คน' : ''));
        gfCloseForm(el);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = icon('check') + ' บันทึก';
        gfErrEl(er.message || 'บันทึกไม่สำเร็จ');
      });
    };
  }

  /* ตรวจพื้นที่ตอนลงเวลาจริง — โหลดเฉพาะพื้นที่ที่ "พนักงานคนนี้" ได้รับสิทธิ์
     ผ่าน RPC njhr_gf_check (ตัดสินฝั่งเซิร์ฟเวอร์) พนักงานจึงไม่เห็นพิกัดของคนอื่น
     cb(pass, reason, ctx) · ctx = พิกัดที่จะส่งไปบันทึกกับการลงเวลา (null = ไม่ส่ง) */
  function gfMode() { return ((db.settings && db.settings.geofence) || {}).mode || 'PROTOTYPE'; }
  function gfVerifyForCheck(fromDash, cb) {
    var strict = gfMode() === 'PRODUCTION';
    if (!fromDash) {
      var faceEl = document.getElementById('sim-face');
      if (faceEl && !faceEl.checked) return cb(false, 'ยังไม่ได้ถ่ายรูปยืนยันตัวตน', null);
    }
    if (!navigator.geolocation) {
      return strict
        ? cb(false, 'อุปกรณ์นี้ไม่รองรับ GPS — ลงเวลาโหมด Production ไม่ได้', null)
        : cb(true, '', null);
    }
    navigator.geolocation.getCurrentPosition(function (pos) {
      var ctx = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      sbRpc('njhr_gf_check', {
        p_token: sbToken(), p_lat: ctx.lat, p_lng: ctx.lng, p_accuracy: ctx.accuracy
      }).then(function (r) {
        if (r && r.pass) return cb(true, r.reason || '', ctx);
        if (strict) return cb(false, (r && r.reason) || 'อยู่นอกพื้นที่ที่ได้รับอนุญาต — ลงเวลาไม่ได้', null);
        cb(true, (r && r.reason) || '', null);   // โหมดจำลอง: แจ้งให้ทราบแต่ไม่บล็อก และไม่ผูกพื้นที่
      }).catch(function (er) {
        if (strict) return cb(false, er.message || 'ตรวจสอบพื้นที่ลงเวลาไม่สำเร็จ', null);
        cb(true, '', null);
      });
    }, function () {
      return strict
        ? cb(false, 'ไม่สามารถอ่านตำแหน่ง GPS ได้ กรุณาอนุญาตการเข้าถึงตำแหน่งแล้วลองใหม่', null)
        : cb(true, '', null);
    }, { enableHighAccuracy: true, timeout: 12000 });
  }

  /* ================= VIEW: SSO ================= */
  /* ================= VIEW: ตั้งค่าการอนุมัติ =================
     กำหนด "ใครเป็นผู้อนุมัติ" แยกตามประเภทคำขอ + แผนก (คนละหน้ากับ "อนุมัติรายการ")
     ข้อมูลจริงจาก Supabase: njhr_approval_workflows / _steps / _step_approvers
     สิทธิ์ SUPER_ADMIN / ADMIN ตรวจซ้ำทุก RPC ฝั่งเซิร์ฟเวอร์ ไม่ได้กันแค่ซ่อนแท็บ */
  var AS_COND = {
    LEAVE: [['ALL', 'ทุกคำขอ'], ['DAYS_GT', 'ลามากกว่า … วัน'], ['DAYS_GTE', 'ลาตั้งแต่ … วันขึ้นไป'],
      ['LEAVE_TYPE', 'ประเภทการลาที่กำหนด'], ['SPECIAL', 'ลาพิเศษ'],
      ['ADJACENT_HOLIDAY', 'ลาต่อเนื่องกับวันหยุด'], ['BACKDATED', 'ลาย้อนหลัง']],
    OT: [['ALL', 'ทุกคำขอ'], ['HOURS_GT', 'OT เกิน … ชั่วโมง'], ['JOB_TYPE', 'ประเภทงานที่กำหนด'],
      ['JOB_COUNT_GT', 'จำนวน JOB มากกว่า …'], ['HOLIDAY', 'OT ในวันหยุด'],
      ['PUBLIC_HOLIDAY', 'OT ในวันหยุดนักขัตฤกษ์']]
  };
  var AS_COND_NEEDVAL = ['DAYS_GT', 'DAYS_GTE', 'LEAVE_TYPE', 'HOURS_GT', 'JOB_TYPE', 'JOB_COUNT_GT'];

  function asCondText(type, ct, cv) {
    var m = (AS_COND[type] || []).find(function (x) { return x[0] === ct; });
    var label = m ? m[1] : ct;
    return cv ? label.replace('…', cv) : label;
  }
  function asErr(msg) { var b = document.getElementById('as-err'); if (b) b.textContent = msg || ''; }

  /* ประเภทคำขอ — โครงกลางจุดเดียว เพิ่มประเภทใหม่ในอนาคตแก้ที่อาร์เรย์นี้ที่เดียว
     (ฐานข้อมูลปัจจุบัน njhr_approval_workflows.request_type รองรับ 'LEAVE','OT') */
  var AS_TYPES = [
    { code: 'LEAVE', label: 'การลางาน', ovKey: 'leave_steps' },
    { code: 'OT', label: 'การขอ OT', ovKey: 'ot_steps' },
    // ประเภทที่ 3 — njhr_wf_overview ยังไม่มีคอลัมน์นับขั้นของ CORRECTION
    // จึงตั้ง ovKey เป็น null แล้วข้ามแถบเตือน "ยังไม่ได้ตั้งผู้อนุมัติ" ของประเภทนี้
    { code: 'CORRECTION', label: 'ลงชื่อย้อนหลัง', ovKey: null }
  ];
  function asTypeDef(code) {
    for (var i = 0; i < AS_TYPES.length; i++) if (AS_TYPES[i].code === code) return AS_TYPES[i];
    return AS_TYPES[0];
  }
  function asTypeLabel(code) { return asTypeDef(code).label; }

  var asState = { type: 'LEAVE', wfId: '', seq: 0, jumpDept: '', flowOpen: true };
  var asWfs = [], asSteps = [], asOverview = [], asQ = {}, asDrag = null;
  var asStepOpen = {};   // จำสถานะ แสดง/ซ่อน รายชื่อผู้อนุมัติของแต่ละขั้น (ค่าเริ่มต้น = แสดง)
  function asStepIsOpen(id) { return asStepOpen[id] !== false; }
  // ซ่อนเฉพาะรายชื่อผู้อนุมัติ + ช่องค้นหา — ส่วนหัวและปุ่มทั้งหมดยังอยู่ครบ
  function asSyncStepBody(id) {
    var body = document.getElementById('wfb-' + id);
    var btn = document.querySelector('[data-as-fold="' + id + '"]');
    if (!body || !btn) return;
    var open = asStepIsOpen(id);
    body.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'ซ่อนรายชื่อผู้อนุมัติ' : 'แสดงรายชื่อผู้อนุมัติ');
    btn.setAttribute('title', open ? 'ซ่อนรายชื่อผู้อนุมัติ' : 'แสดงรายชื่อผู้อนุมัติ');
    btn.innerHTML = icon(open ? 'eyeOff' : 'eye');
  }
  var asPool = [], asPoolSel = {}, asPoolQ = '';
  var asEPool = [], asEPoolSel = {}, asEPoolQ = '', asEPoolDept = '';   // ขอบเขตแบบเลือกพนักงานรายคน

  function asFindWf(id) {
    for (var i = 0; i < asWfs.length; i++) if (asWfs[i].workflow_id === id) return asWfs[i];
    return null;
  }
  function asCurrentWf() { return asFindWf(asState.wfId); }
  // มาจากปุ่ม "ตั้งค่าการอนุมัติ" ในหน้าจัดการแผนก — เปิดชุดที่ครอบคลุมแผนกนั้นให้เลย
  // ไม่พบชุดเฉพาะแผนก → ใช้ชุด "ทุกแผนก" ตามลำดับ fallback เดียวกับฝั่งเซิร์ฟเวอร์
  function asApplyJumpDept() {
    var jd = asState.jumpDept;
    if (!jd) return;
    asState.jumpDept = '';
    var i, hit = null;
    for (i = 0; i < asWfs.length; i++) {
      if (asWfs[i].scope !== 'ALL' && (asWfs[i].departments || []).indexOf(jd) >= 0) { hit = asWfs[i]; break; }
    }
    if (!hit) for (i = 0; i < asWfs.length; i++) if (asWfs[i].scope === 'ALL') { hit = asWfs[i]; break; }
    if (hit) asState.wfId = hit.workflow_id;
  }
  function asFindStep(id) {
    for (var i = 0; i < asSteps.length; i++) if (asSteps[i].step_id === id) return asSteps[i];
    return null;
  }
  function asDeptText(w) {
    if (!w) return '';
    if (w.scope === 'ALL') return 'ทุกแผนก';
    if (w.scope === 'EMPLOYEE') {
      var n = Number(w.emp_count || (w.employees || []).length) || 0;
      return n ? n + ' พนักงาน' : 'ยังไม่ได้เลือกพนักงาน';
    }
    var d = w.departments || [];
    return d.length ? d.join(', ') : 'ยังไม่ได้เลือกแผนก';
  }
  // ป้ายสรุปขอบเขตในรายการชุด Workflow
  function asScopeChips(w) {
    if (w.scope === 'ALL') return '<span class="badge badge-info">🌐 ทุกแผนก</span>';
    if (w.scope === 'EMPLOYEE') {
      var emps = w.employees || [];
      return '<span class="badge badge-info">👤 ' + (Number(w.emp_count) || emps.length) + ' พนักงาน</span>' +
        emps.slice(0, 6).map(function (e) {
          return '<span class="chip">' + esc(e.emp_code) + ' ' + esc(e.name) + '</span>';
        }).join('') +
        (emps.length > 6 ? '<span class="chip">และอีก ' + (emps.length - 6) + ' คน</span>' : '');
    }
    var d = w.departments || [];
    return (d.length ? '<span class="badge badge-info">🏢 ' + d.length + ' แผนก</span>' : '') +
      (d.length ? d.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('')
                : '<span class="chip chip-bad">ยังไม่ได้เลือกแผนก</span>');
  }
  function asWfTitle(w) {
    if (!w) return '';
    return w.wf_name || ('ชุดอนุมัติ · ' + (w.scope === 'ALL' ? 'ทุกแผนก' : (w.anchor_dept || '-')));
  }
  function asModeTxt(m) { return m === 'ALL' ? 'ทุกคนต้องอนุมัติ' : 'คนใดคนหนึ่งอนุมัติถือว่าผ่าน'; }

  function viewApprovalSettings(el) {
    // กันเปิด Route ตรงโดยไม่มีสิทธิ์ (นอกเหนือจากการซ่อนแท็บ)
    if (['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) < 0) {
      el.innerHTML = '<div class="card">' + emptyState('คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าการอนุมัติ') + '</div>';
      return;
    }
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++asState.seq;

    el.innerHTML =
      '<div class="card as-top">' +
      '<div class="as-top-row">' +
      '<div class="as-top-txt"><h3>ตั้งค่าการอนุมัติ (Workflow)</h3>' +
      '<p class="muted">สร้างชุดขั้นตอนการอนุมัติ กำหนดได้ว่าใช้กับทุกแผนก เฉพาะแผนกที่เลือก หรือเลือกพนักงานรายคน</p></div>' +
      '<div class="toolbar as-filters">' +
      '<select id="as-type" aria-label="ประเภทคำขอ">' +
      AS_TYPES.map(function (t) {
        return '<option value="' + t.code + '"' + (asState.type === t.code ? ' selected' : '') + '>' + esc(t.label) + '</option>';
      }).join('') + '</select>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-primary" id="as-add-wf">' + icon('plus') + ' สร้างชุด Workflow</button></div>' +
      '</div><div id="as-warn"></div></div>' +
      '<div class="card as-listcard"><div class="card-head"><h3>ชุด Workflow · ' + esc(asTypeLabel(asState.type)) + '</h3></div>' +
      '<div id="as-wflist"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div></div>' +
      '<div id="as-detail"></div>' +
      '<div class="form-error" id="as-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('as-type').onchange = function () {
      asState.type = this.value; asState.wfId = ''; asQ = {}; viewApprovalSettings(el);
    };
    document.getElementById('as-add-wf').onclick = function () { asWfForm(null, el); };

    sbRpcList('njhr_wf_list', { p_token: sbToken(), p_type: asState.type }).then(function (rows) {
      if (seq !== asState.seq) return;
      asWfs = rows || [];
      asApplyJumpDept();
      if (!asCurrentWf()) asState.wfId = '';   // ไม่เลือกอัตโนมัติ — ผังการอนุมัติซ่อนไว้จนกว่าจะกดเปิด
      asRenderWfList(el);
      asLoadOverview(el, seq);
      return asLoadSteps(el, seq);
    }).catch(function (er) {
      if (seq !== asState.seq) return;
      asErr(er.message || 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ');
      var b = document.getElementById('as-wflist');
      if (b) b.innerHTML = emptyState('โหลดข้อมูลไม่สำเร็จ');
    });
  }

  // คำเตือน "แผนกที่ยังไม่มีผู้อนุมัติ" — เป็นข้อมูลเสริม โหลดไม่สำเร็จไม่บล็อกหน้าจอ
  function asLoadOverview(el, seq) {
    sbRpcList('njhr_wf_overview', { p_token: sbToken() }).then(function (ov) {
      if (seq !== asState.seq) return;
      asOverview = ov || [];
      var key = asTypeDef(asState.type).ovKey;
      var box = document.getElementById('as-warn');
      if (!box) return;
      if (!key) { box.innerHTML = ''; return; }   // ประเภทที่ RPC ยังไม่นับขั้นให้ — ไม่เดาตัวเลข
      var miss = asOverview.filter(function (d) { return Number(d[key] || 0) === 0; });
      var names = miss.map(function (d) { return d.department; });
      box.innerHTML = miss.length
        ? '<div class="as-warnbox"><span class="as-warn-ic">\u{26A0}\u{FE0F}</span>' +
          '<div class="grow"><b>ยังไม่ได้ตั้งผู้อนุมัติ (' + esc(asTypeLabel(asState.type)) + ') ' +
          miss.length + ' แผนก</b>' +
          '<div class="as-warn-chips">' +
          names.slice(0, 5).map(function (d) { return '<span class="as-wchip">' + esc(d) + '</span>'; }).join('') +
          (names.length > 5
            ? '<span class="as-wchip as-wmore" title="' + esc(names.slice(5).join(', ')) + '">+ อีก ' +
              (names.length - 5) + ' แผนก</span>' : '') +
          '</div></div></div>'
        : '';
    }).catch(function () { /* เงียบไว้ ไม่รบกวนการตั้งค่า */ });
  }

  // อัปเดตตัวเลข "กี่ขั้น / กี่ผู้อนุมัติ" บนการ์ดชุด Workflow หลังแก้ไขขั้น
  function asRefreshCounts(el) {
    sbRpcList('njhr_wf_list', { p_token: sbToken(), p_type: asState.type }).then(function (rows) {
      asWfs = rows || [];
      if (!asCurrentWf()) asState.wfId = '';   // ไม่เลือกอัตโนมัติ — ผังการอนุมัติซ่อนไว้จนกว่าจะกดเปิด
      asRenderWfList(el);
    }).catch(function () {});
  }

  /* ---------- ชุด Workflow (ขอบเขต: ทุกแผนก / เลือกหลายแผนก) ---------- */
  function asRenderWfList(el) {
    var box = document.getElementById('as-wflist');
    if (!box) return;
    if (!asWfs.length) {
      box.innerHTML = emptyState('ยังไม่มีชุด Workflow ของ' + asTypeLabel(asState.type) + ' — กด "สร้างชุด Workflow"');
      return;
    }
    box.innerHTML = '<div class="wf-sets">' + asWfs.map(function (w) {
      // การ์ดย่อ: แสดงเฉพาะหัวข้อ · ประเภท · สถานะ · จำนวนขั้น · จำนวนผู้อนุมัติ · ปุ่มแก้ไข/ลบ
      // รายละเอียด (แผนก + ผังอนุมัติ) แสดงเฉพาะชุดที่ถูกเปิดอยู่เท่านั้น
      var open = (w.workflow_id === asState.wfId);
      // สถานะการ์ด: ปิดใช้งาน / ครบขั้น+ผู้อนุมัติ / ยังไม่ครบ (0 ขั้น หรือผู้อนุมัติ 0 คน)
      var wfStat = (w.active === false) ? ' wf-off'
        : ((w.step_count || 0) > 0 && (w.approver_count || 0) > 0) ? ' wf-ready' : ' wf-empty';
      /* การ์ด 3 ส่วน: หัว (ชื่อ + สถานะ) · กลาง (Chip ข้อมูล) · ล่าง (ปุ่มชิดขวาแถวเดียว)
         ปุ่มอยู่ในบล็อกของตัวเอง จึงไม่มีทางตกไปคนละแถวกับ Chip
         กดพื้นที่ว่างของการ์ดไม่เกิดอะไร (ตัว handler จับเฉพาะปุ่ม) */
      return '<div class="wf-set' + wfStat + '" data-as-wf="' + esc(w.workflow_id) + '">' +
        '<div class="wf-set-head"><b>' + esc(asWfTitle(w)) + '</b>' +
        (w.active === false ? '<span class="badge badge-mut">ปิดใช้งาน</span>'
                            : '<span class="badge badge-ok">เปิดใช้งาน</span>') + '</div>' +
        '<div class="wf-set-info">' +
        (w.request_type === 'BOTH'
          ? '<span class="chip chip-ok">ลา + OT</span>'
          : '<span class="chip">' + (w.request_type === 'OT' ? 'การขอ OT' : 'การลางาน') + '</span>') +
        '<span class="chip chip-info">' + (w.step_count || 0) + ' ขั้น</span>' +
        '<span class="chip">ผู้อนุมัติ ' + (w.approver_count || 0) + ' คน</span>' +
        '</div>' +
        '<div class="wf-set-acts">' +
        '<button class="btn-icon wf-act-view" data-as-wfview="' + esc(w.workflow_id) + '" aria-label="ดูรายละเอียด" title="ดูรายละเอียด">' + icon('eye') + '</button>' +
        '<button class="btn-icon wf-act-edit" data-as-wfedit="' + esc(w.workflow_id) + '" aria-label="แก้ไข / ตั้งขั้นอนุมัติ" title="แก้ไข / ตั้งขั้นอนุมัติ">' + icon('edit') + '</button>' +
        '<button class="btn-icon wf-act-del" data-as-wfdel="' + esc(w.workflow_id) + '" aria-label="ลบชุด" title="ลบชุด">' + icon('x') + '</button>' +
        '</div>' +
        '</div>';
    }).join('') + '</div>';
    asLoadTimelines();

    box.onclick = function (ev) {
      /* เปิด Modal รายละเอียดได้จากปุ่มรูปตาเท่านั้น
         กดพื้นที่ว่างของการ์ดต้องไม่เกิดอะไรขึ้น จึงไม่จับ [data-as-wf] อีกต่อไป */
      var b = ev.target.closest ? ev.target.closest('[data-as-wfview],[data-as-wfedit],[data-as-wfdel]') : null;
      if (!b) return;
      if (b.dataset.asWfview) { asWfDetail(b.dataset.asWfview); return; }
      if (b.dataset.asWfedit) { asOpenWf(b.dataset.asWfedit, el); return; }
      if (b.dataset.asWfdel) { asWfDelete(b.dataset.asWfdel, el); return; }
    };
  }

  /* ---------- Modal "รายละเอียดชุดอนุมัติ" (อ่านอย่างเดียว) ----------
     ใช้ njhr_wf_steps ตัวเดิม ไม่เพิ่ม RPC ใหม่ · ไม่แก้ข้อมูล ไม่แตะสิทธิ์
     ปิดได้ 3 ทาง: ปุ่ม X มุมขวาบน · ปุ่ม "ปิด" ด้านล่าง · Escape · คลิกพื้นที่มืด
     คืนตำแหน่ง scroll เดิมหลังปิดเสมอ */
  function asWfDetail(id) {
    var w = null;
    asWfs.forEach(function (x) { if (x.workflow_id === id) w = x; });
    if (!w) return;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    var meta =
      '<div class="wfd-meta">' +
      '<div class="wfd-row"><span>ประเภทคำขอ</span><b>' +
        (w.request_type === 'BOTH' ? 'การลางาน + การขอ OT'
          : (w.request_type === 'OT' ? 'การขอ OT' : 'การลางาน')) + '</b></div>' +
      '<div class="wfd-row"><span>สถานะ</span><b>' +
        (w.active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + '</b></div>' +
      '<div class="wfd-row"><span>จำนวนขั้น</span><b>' + (w.step_count || 0) + ' ขั้น</b></div>' +
      '<div class="wfd-row"><span>ผู้อนุมัติทั้งหมด</span><b>' + (w.approver_count || 0) + ' คน</b></div>' +
      '<div class="wfd-row"><span>ขอบเขตแผนก</span><b>' +
        (w.scope === 'ALL' ? 'ทุกแผนก' : esc(w.anchor_dept || '-')) + '</b></div>' +
      '</div>' +
      '<div class="wfd-sec"><b>แผนกที่ใช้ชุดนี้</b><div class="wf-set-depts">' + asScopeChips(w) + '</div></div>';

    openModal('รายละเอียด · ' + esc(asWfTitle(w)),
      meta +
      '<div class="wfd-sec"><b>ลำดับการอนุมัติ</b>' +
      '<div class="wfd-flow" id="wfd-flow"><span class="wf-tl-load">กำลังโหลดขั้นอนุมัติ…</span></div></div>',
      '<button class="btn btn-ghost" id="wfd-close">ปิด</button>', { wide: true });

    function done() {
      document.removeEventListener('keydown', onEsc, true);
      window.scrollTo(0, scrollY);          // กลับตำแหน่งเดิมของหน้าจอ
    }
    function onEsc(ev) {
      if (ev.key !== 'Escape') return;
      if (!document.getElementById('wfd-flow')) { done(); return; }
      closeModal(); done();
    }
    document.addEventListener('keydown', onEsc, true);
    var cb = document.getElementById('wfd-close');
    if (cb) cb.onclick = function () { closeModal(); done(); };
    var xb = document.getElementById('modal-x');
    if (xb) { var prev = xb.onclick; xb.onclick = function () { if (prev) prev(); done(); }; }
    var ov = document.getElementById('modal-overlay');
    if (ov) ov.addEventListener('mousedown', function (ev) { if (ev.target === this) done(); });

    if (!w.step_count) {
      var f0 = document.getElementById('wfd-flow');
      if (f0) f0.innerHTML = '<span class="wf-tl-none">ยังไม่มีขั้นอนุมัติ — กดปุ่มแก้ไขเพื่อเพิ่ม</span>';
      return;
    }
    var t = w.request_type === 'BOTH' ? asState.type : w.request_type;
    sbRpcList('njhr_wf_steps', { p_token: sbToken(), p_type: t, p_dept: w.anchor_dept })
      .then(function (steps) {
        var box = document.getElementById('wfd-flow');
        if (!box) return;
        var on = (steps || []).filter(function (x) { return x.active; });
        if (!on.length) {
          box.innerHTML = '<span class="wf-tl-none">ยังไม่มีขั้นอนุมัติที่เปิดใช้งาน</span>';
          return;
        }
        box.innerHTML =
          '<div class="wfd-step wfd-start"><span class="wfd-no">เริ่ม</span>' +
          '<div class="grow"><b>ผู้ยื่นคำขอ</b><small>ส่งคำขอเข้าสู่ระบบ</small></div></div>' +
          on.map(function (st, i) {
            var appr = st.approvers || [];
            var mode = String(st.approve_mode || st.mode || '').toUpperCase();
            var modeTxt = mode === 'ANY' ? 'อนุมัติคนใดคนหนึ่งก็ผ่าน (ANY)'
                        : mode === 'ALL' ? 'ต้องอนุมัติครบทุกคน (ALL)' : '';
            return '<div class="wfd-step"><span class="wfd-no">' + (i + 1) + '</span>' +
              '<div class="grow"><b>' + esc(st.step_name || ('ขั้นที่ ' + (i + 1))) + '</b>' +
              (modeTxt ? '<small class="wfd-mode">' + modeTxt + '</small>' : '') +
              (appr.length
                ? '<div class="wfd-appr">' + appr.map(function (a) {
                    return '<span class="as-wchip">' + esc(a.name || a.username || '-') +
                      (a.position ? ' · ' + esc(a.position) : '') + '</span>';
                  }).join('') + '</div>'
                : '<small class="wf-tl-none">ยังไม่ได้กำหนดผู้อนุมัติในขั้นนี้</small>') +
              '</div></div>';
          }).join('') +
          '<div class="wfd-step wfd-end"><span class="wfd-no">' + icon('check', 'ic-sm') + '</span>' +
          '<div class="grow"><b>อนุมัติสำเร็จ</b><small>คำขอเสร็จสมบูรณ์</small></div></div>';
      })['catch'](function () {
        var box = document.getElementById('wfd-flow');
        if (box) box.innerHTML = '<span class="wf-tl-none">โหลดขั้นอนุมัติไม่สำเร็จ</span>';
      });
  }

  // เปิดผังการอนุมัติของชุดที่เลือก (ค่าเริ่มต้นของหน้าคือซ่อนไว้)
  /* เติม Timeline ของแต่ละชุดหลังจากรายการแสดงผลแล้ว
     ใช้ njhr_wf_steps ตัวเดิม (p_type, p_dept = anchor_dept) ไม่เพิ่ม RPC ใหม่
     แก้เฉพาะกล่องของชุดนั้น ไม่ render ทั้งหน้าใหม่ */
  function asLoadTimelines() {
    var seq = asState.seq;
    asWfs.forEach(function (w) {
      // การ์ดย่อไม่มีกล่องผัง จึงไม่ต้องยิง RPC — โหลดเฉพาะชุดที่ถูกเปิดอยู่
      if (w.workflow_id !== asState.wfId) return;
      if (!w.step_count) return;
      var t = w.request_type === 'BOTH' ? asState.type : w.request_type;
      sbRpcList('njhr_wf_steps', { p_token: sbToken(), p_type: t, p_dept: w.anchor_dept })
        .then(function (steps) {
          if (seq !== asState.seq) return;
          var box = document.getElementById('wftl-' + w.workflow_id);
          if (!box) return;
          var on = (steps || []).filter(function (x) { return x.active; });
          if (!on.length) { box.innerHTML = '<span class="wf-tl-none">ยังไม่มีขั้นอนุมัติที่เปิดใช้งาน</span>'; return; }
          box.innerHTML =
            '<span class="wf-tl-node start">ผู้ยื่น</span>' +
            on.map(function (st) {
              var appr = st.approvers || [];
              var who = appr.slice(0, 2).map(function (a) { return a.name; }).join(', ');
              return '<span class="wf-tl-ar">\u2192</span>' +
                '<span class="wf-tl-node"><b>' + esc(st.name) + '</b>' +
                '<span class="wf-tl-mode ' + (st.mode === 'ALL' ? 'all' : 'any') + '">' +
                (st.mode === 'ALL' ? 'ALL' : 'ANY') + '</span>' +
                '<small>' + (appr.length
                  ? esc(who) + (appr.length > 2 ? ' +' + (appr.length - 2) : '')
                  : 'ยังไม่มีผู้อนุมัติ') + '</small></span>';
            }).join('') +
            '<span class="wf-tl-ar">\u2192</span><span class="wf-tl-node done">สำเร็จ</span>';
        }).catch(function () {
          var box = document.getElementById('wftl-' + w.workflow_id);
          if (box) box.innerHTML = '<span class="wf-tl-none">โหลดขั้นอนุมัติไม่สำเร็จ</span>';
        });
    });
  }

  function asOpenWf(id, el) {
    if (!id) return;
    if (asState.wfId !== id) { asState.wfId = id; asQ = {}; asStepOpen = {}; }
    asRenderWfList(el);
    asLoadSteps(el, asState.seq);
  }
  // ปิดผัง → กลับไปเห็นเฉพาะรายการชุด Workflow เต็มหน้าจอ (ไม่แตะข้อมูลใด ๆ)
  function asCloseWf(el) {
    asState.wfId = ''; asQ = {}; asSteps = [];
    var box = document.getElementById('as-detail');
    if (box) box.innerHTML = '';
    asRenderWfList(el);
  }

  function asWfForm(wfId, el) {
    var w = wfId ? asFindWf(wfId) : null;
    asPool = []; asPoolSel = {}; asPoolQ = '';
    asEPool = []; asEPoolSel = {}; asEPoolQ = ''; asEPoolDept = '';
    if (w && w.scope === 'SELECTED') (w.departments || []).forEach(function (d) { asPoolSel[d] = true; });
    if (w && w.scope === 'EMPLOYEE') (w.employees || []).forEach(function (e) { asEPoolSel[e.employee_id] = true; });
    var scope = w ? w.scope : 'SELECTED';
    // ประเภทคำขอของชุดนี้ — BOTH = ใช้ได้ทั้งลาและ OT · ชุดใหม่ใช้ประเภทที่กำลังดูอยู่เป็นค่าตั้งต้น
    var wfTypes = w
      ? (w.request_type === 'BOTH' ? ['LEAVE', 'OT'] : [w.request_type])
      : [asState.type];

    openModal(w ? 'แก้ไขชุด Workflow' : 'สร้างชุด Workflow',
      '<form id="as-wf-f" novalidate>' +
      '<div class="form-2col">' +
      '<div class="field"><span>ประเภทคำขอ <i class="req">*</i> <small class="muted">(เลือกได้หลายประเภท)</small></span>' +
      '<label class="check"><input type="checkbox" class="wf-type" value="LEAVE"' +
      (wfTypes.indexOf('LEAVE') >= 0 ? ' checked' : '') + '><span>การลางาน</span></label>' +
      '<label class="check"><input type="checkbox" class="wf-type" value="OT"' +
      (wfTypes.indexOf('OT') >= 0 ? ' checked' : '') + '><span>การขอ OT</span></label>' +
      '<label class="check"><input type="checkbox" id="wf-type-all"' +
      (wfTypes.length === 2 ? ' checked' : '') + '><span>เลือกทั้งหมด</span></label></div>' +
      '<label class="field"><span>ชื่อชุด Workflow</span>' +
      '<input name="wf_name" value="' + esc(w ? (w.wf_name || '') : '') + '" placeholder="เช่น สายงานปฏิบัติการ (ไม่บังคับ)"></label></div>' +
      '<div class="field"><span>ขอบเขตการใช้งาน</span>' +
      '<label class="check"><input type="radio" name="wf_scope" value="ALL"' + (scope === 'ALL' ? ' checked' : '') + '>' +
      '<span>ทุกแผนก</span></label>' +
      '<label class="check"><input type="radio" name="wf_scope" value="SELECTED"' + (scope === 'SELECTED' ? ' checked' : '') + '>' +
      '<span>เลือกแผนก</span></label>' +
      '<label class="check"><input type="radio" name="wf_scope" value="EMPLOYEE"' + (scope === 'EMPLOYEE' ? ' checked' : '') + '>' +
      '<span>เลือกพนักงาน</span></label></div>' +
      '<div id="as-pool-wrap">' +
      '<div class="toolbar" style="margin-bottom:6px">' +
      '<span class="search-box" style="flex:1">' + icon('search', 'ic-sm') +
      '<input id="as-pool-q" autocomplete="off" placeholder="ค้นหาแผนก"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="as-pool-all">เลือกทั้งหมด</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="as-pool-clr">ล้างทั้งหมด</button>' +
      '<span class="chip chip-info">เลือกแล้ว <b id="as-pool-count">' + Object.keys(asPoolSel).length + '</b> แผนก</span></div>' +
      '<div class="wf-pool" id="as-pool"><small class="muted" style="padding:10px;display:block">กำลังโหลดรายชื่อแผนก…</small></div></div>' +
      '<div id="as-epool-wrap">' +
      '<div class="toolbar" style="margin-bottom:6px">' +
      '<span class="search-box" style="flex:1">' + icon('search', 'ic-sm') +
      '<input id="as-epool-q" autocomplete="off" placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / ชื่อเล่น"></span>' +
      '<select id="as-epool-dept"><option value="">ทุกแผนก</option></select>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="as-epool-all">เลือกทั้งหมด</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="as-epool-clr">ล้างทั้งหมด</button>' +
      '<span class="chip chip-info">เลือกแล้ว <b id="as-epool-count">' + Object.keys(asEPoolSel).length + '</b> คน</span></div>' +
      '<div class="wf-pool" id="as-epool"><small class="muted" style="padding:10px;display:block">กำลังโหลดรายชื่อพนักงาน…</small></div></div>' +
      '<div class="form-error" id="as-wf-err" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="aswf-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="aswf-save">บันทึก</button>',
      { wide: true });

    function syncScope() {
      var sc = document.querySelector('[name="wf_scope"]:checked');
      var v = sc ? sc.value : 'SELECTED';
      var wrap = document.getElementById('as-pool-wrap');
      var ewrap = document.getElementById('as-epool-wrap');
      if (wrap) wrap.style.display = (v === 'SELECTED') ? '' : 'none';
      if (ewrap) ewrap.style.display = (v === 'EMPLOYEE') ? '' : 'none';
    }
    Array.prototype.forEach.call(document.querySelectorAll('[name="wf_scope"]'), function (r) { r.onchange = syncScope; });
    syncScope();
    function wfTypeVals() {
      return Array.prototype.slice.call(document.querySelectorAll('.wf-type:checked'))
        .map(function (c) { return c.value; });
    }
    function syncTypeAll() {
      var a = document.getElementById('wf-type-all');
      if (a) a.checked = wfTypeVals().length === 2;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.wf-type'), function (c) { c.onchange = syncTypeAll; });
    var wfAllEl = document.getElementById('wf-type-all');
    if (wfAllEl) wfAllEl.onchange = function () {
      var on = this.checked;
      Array.prototype.forEach.call(document.querySelectorAll('.wf-type'), function (c) { c.checked = on; });
    };
    document.getElementById('aswf-cancel').onclick = closeModal;
    document.getElementById('as-pool-q').oninput = debounce(function () {
      asPoolQ = String(this.value || '').trim(); asRenderPool();
    }, 180);
    document.getElementById('as-epool-q').oninput = debounce(function () {
      asEPoolQ = String(this.value || '').trim(); asRenderEPool();
    }, 180);
    document.getElementById('as-epool-dept').onchange = function () {
      asEPoolDept = this.value; asRenderEPool();
    };
    // เลือกทั้งหมด / ล้างทั้งหมด — ทำเฉพาะรายการที่แสดงอยู่ตามคำค้นและตัวกรองปัจจุบัน
    document.getElementById('as-pool-all').onclick = function () {
      asPoolVisible().forEach(function (r) { if (!r.taken_by) asPoolSel[r.department] = true; });
      asRenderPool();
    };
    document.getElementById('as-pool-clr').onclick = function () { asPoolSel = {}; asRenderPool(); };
    document.getElementById('as-epool-all').onclick = function () {
      asEPoolVisible().forEach(function (r) { if (!r.taken_by) asEPoolSel[r.employee_id] = true; });
      asRenderEPool();
    };
    document.getElementById('as-epool-clr').onclick = function () { asEPoolSel = {}; asRenderEPool(); };

    // รายชื่อพนักงานจริงจากทะเบียนพนักงาน (ไม่ Hardcode ไม่ใช้ localStorage)
    sbRpcList('njhr_wf_emp_pool', {
      p_token: sbToken(), p_type: asState.type, p_q: null,
      p_exclude_workflow: wfId || null, p_limit: 1000
    }).then(function (rows) { asEPool = rows || []; asRenderEPool(); })
      .catch(function (er) {
        var b = document.getElementById('as-epool');
        if (b) b.innerHTML = '<small class="muted" style="padding:10px;display:block">โหลดรายชื่อพนักงานไม่สำเร็จ</small>';
        var e3 = document.getElementById('as-wf-err');
        if (e3) e3.textContent = er.message || 'โหลดรายชื่อพนักงานไม่สำเร็จ';
      });

    // รายชื่อแผนกจริงจากทะเบียนแผนก + ข้อมูลพนักงาน (ไม่ Hardcode)
    sbRpcList('njhr_wf_dept_pool', { p_token: sbToken(), p_type: asState.type, p_exclude_workflow: wfId || null })
      .then(function (rows) { asPool = rows || []; asRenderPool(); })
      .catch(function (er) {
        var b = document.getElementById('as-pool');
        if (b) b.innerHTML = '<small class="muted" style="padding:10px;display:block">โหลดรายชื่อแผนกไม่สำเร็จ</small>';
        var e2 = document.getElementById('as-wf-err');
        if (e2) e2.textContent = er.message || 'โหลดรายชื่อแผนกไม่สำเร็จ';
      });

    document.getElementById('aswf-save').onclick = function () {
      var btn = this, fm = document.getElementById('as-wf-f');
      var ferr = document.getElementById('as-wf-err');
      var sc = fm.querySelector('[name="wf_scope"]:checked');
      var scope2 = sc ? sc.value : 'SELECTED';
      var depts = Object.keys(asPoolSel);
      var emps = Object.keys(asEPoolSel).filter(function (k) { return asEPoolSel[k]; });
      var types = wfTypeVals();
      if (!types.length) { ferr.textContent = 'กรุณาเลือกประเภทคำขออย่างน้อย 1 ประเภท'; return; }
      if (scope2 === 'SELECTED' && !depts.length) { ferr.textContent = 'กรุณาเลือกอย่างน้อย 1 แผนก'; return; }
      if (scope2 === 'EMPLOYEE' && !emps.length) { ferr.textContent = 'กรุณาเลือกอย่างน้อย 1 พนักงาน'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_wf_save', {
        p_token: sbToken(), p_id: wfId || null, p_type: null, p_types: types,
        p_name: String(fm.querySelector('[name="wf_name"]').value || '').trim(),
        p_scope: scope2,
        p_departments: scope2 === 'SELECTED' ? depts : [],
        p_employees: scope2 === 'EMPLOYEE' ? emps : []
      }).then(function (r) {
        closeModal(); toast('บันทึกชุด Workflow แล้ว');
        // สร้างชุดใหม่ → เปิดผังให้ตั้งขั้นอนุมัติต่อได้ทันที · แก้ไขขอบเขต → ปิดผังกลับหน้ารายการ
        asState.wfId = wfId ? '' : ((r && r.workflow_id) || '');
        viewApprovalSettings(el);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        ferr.textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  function asPoolVisible() {
    var q = asPoolQ.toLowerCase();
    return asPool.filter(function (r) { return !q || String(r.department || '').toLowerCase().indexOf(q) >= 0; });
  }
  function asEPoolVisible() {
    var q = asEPoolQ.toLowerCase();
    return asEPool.filter(function (r) {
      if (asEPoolDept && String(r.department_name || '') !== asEPoolDept) return false;
      return !q || (r.emp_code + ' ' + r.full_name + ' ' + (r.nickname || '')).toLowerCase().indexOf(q) >= 0;
    });
  }
  function asRenderPool() {
    var box = document.getElementById('as-pool');
    if (!box) return;
    var rows = asPoolVisible();
    box.innerHTML = rows.length ? rows.map(function (r) {
      var taken = !!r.taken_by;
      return '<label class="wf-pool-item' + (taken ? ' off' : '') + '">' +
        '<input type="checkbox" data-dept="' + esc(r.department) + '"' +
        (asPoolSel[r.department] ? ' checked' : '') + (taken ? ' disabled' : '') + '>' +
        '<span class="grow"><b>' + esc(r.department) + '</b><small>' +
        (taken ? 'ถูกใช้ใน Workflow ชุดอื่นแล้ว' : 'พนักงาน ' + (r.employees || 0) + ' คน') +
        '</small></span></label>';
    }).join('') : '<small class="muted" style="padding:10px;display:block">ไม่พบแผนกที่ตรงกับคำค้น</small>';
    var pc = document.getElementById('as-pool-count');
    if (pc) pc.textContent = Object.keys(asPoolSel).length;

    box.onchange = function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.dept) return;
      if (t.checked) asPoolSel[t.dataset.dept] = true; else delete asPoolSel[t.dataset.dept];
      var c = document.getElementById('as-pool-count');
      if (c) c.textContent = Object.keys(asPoolSel).length;
    };
  }

  /* รายชื่อพนักงานสำหรับขอบเขตแบบ "เลือกพนักงาน" — ข้อมูลจริงจาก njhr_wf_emp_pool */
  function asRenderEPool() {
    var box = document.getElementById('as-epool');
    if (!box) return;
    var rows = asEPoolVisible();
    // เติมตัวเลือกแผนกจากรายชื่อพนักงานจริง (ไม่ Hardcode)
    var dsel = document.getElementById('as-epool-dept');
    if (dsel && dsel.options.length <= 1) {
      var seen = {}, ds = [];
      asEPool.forEach(function (r) {
        var d = String(r.department_name || '');
        if (d && !seen[d]) { seen[d] = 1; ds.push(d); }
      });
      ds.sort();
      dsel.innerHTML = '<option value="">ทุกแผนก</option>' + ds.map(function (d) {
        return '<option value="' + esc(d) + '"' + (asEPoolDept === d ? ' selected' : '') + '>' + esc(d) + '</option>';
      }).join('');
    }
    box.innerHTML = rows.length ? rows.map(function (r) {
      var taken = !!r.taken_by;
      return '<label class="wf-pool-item' + (taken ? ' off' : '') + '">' +
        '<input type="checkbox" data-emp="' + esc(r.employee_id) + '"' +
        (asEPoolSel[r.employee_id] ? ' checked' : '') + (taken ? ' disabled' : '') + '>' +
        '<span class="grow"><b>' + esc(r.emp_code) + ' · ' + esc(r.full_name) + '</b><small>' +
        (taken ? 'ถูกใช้ใน Workflow ชุดอื่นแล้ว'
               : (r.nickname ? esc(r.nickname) + ' · ' : '') + esc(r.department_name || '—') +
                 ' · ' + esc(r.position_name || '—')) +
        '</small></span></label>';
    }).join('') : '<small class="muted" style="padding:10px;display:block">ไม่พบพนักงานที่ตรงกับคำค้น</small>';
    var ec = document.getElementById('as-epool-count');
    if (ec) ec.textContent = Object.keys(asEPoolSel).length;

    box.onchange = function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.emp) return;
      if (t.checked) asEPoolSel[t.dataset.emp] = true; else delete asEPoolSel[t.dataset.emp];
      var c = document.getElementById('as-epool-count');
      if (c) c.textContent = Object.keys(asEPoolSel).length;
    };
  }

  function asWfDelete(wfId, el) {
    var w = asFindWf(wfId);
    asErr('');
    sbRpc('njhr_wf_delete', { p_token: sbToken(), p_id: wfId, p_confirm: false })
      .then(function (r) {
        if (r && r.deleted) { toast('ลบชุด Workflow แล้ว', 'info'); asState.wfId = ''; viewApprovalSettings(el); return; }
        confirmDialog('ลบชุด Workflow',
          '<b>' + esc(asWfTitle(w)) + '</b> · ' + esc(asDeptText(w)) + '<br>' +
          'ชุดนี้มีขั้นอนุมัติ ' + ((r && r.step_count) || 0) + ' ขั้น' +
          ((r && r.pending_count)
            ? '<br><span class="t-red">ขณะนี้มีคำขอรออนุมัติอยู่ ' + r.pending_count + ' รายการ</span>' : '') +
          '<br>ยืนยันลบทั้งชุดหรือไม่',
          'ยืนยันลบ', function () {
            return sbRpc('njhr_wf_delete', { p_token: sbToken(), p_id: wfId, p_confirm: true })
              .then(function () { toast('ลบชุด Workflow แล้ว', 'info'); asState.wfId = ''; viewApprovalSettings(el); });
          }, true);
      }).catch(function (er) { asErr(er.message || 'ลบไม่สำเร็จ'); });
  }

  /* ---------- ขั้นอนุมัติของชุดที่เลือก ---------- */
  // ใช้ "แผนกหลัก (anchor_dept)" เป็นตัวเชื่อม → RPC ขั้นอนุมัติเดิมทุกตัวไม่ต้องแก้
  function asLoadSteps(el, seq) {
    var w = asCurrentWf();
    var box = document.getElementById('as-detail');
    if (!w) { asSteps = []; if (box) box.innerHTML = ''; return Promise.resolve(); }
    if (box && !box.innerHTML) box.innerHTML = '<div class="card"><small class="muted">กำลังโหลดขั้นอนุมัติ…</small></div>';
    return sbRpcList('njhr_wf_steps', { p_token: sbToken(), p_type: asState.type, p_dept: w.anchor_dept })
      .then(function (rows) {
        if (seq !== asState.seq) return;
        asSteps = rows || [];
        asRenderDetail(el);
      }).catch(function (er) {
        if (seq !== asState.seq) return;
        asErr(er.message || 'โหลดขั้นอนุมัติไม่สำเร็จ');
      });
  }

  function asRenderDetail(el) {
    var box = document.getElementById('as-detail'), w = asCurrentWf();
    if (!box || !w) return;
    box.innerHTML =
      '<div class="card wf-topbar"><div class="wf-top-info">' +
      '<div class="wf-top-cell"><small>ประเภทคำขอ</small><b>' + esc(asTypeLabel(asState.type)) + '</b></div>' +
      '<div class="wf-top-cell"><small>แผนก</small><b>' + esc(asDeptText(w)) + '</b></div>' +
      '<div class="wf-top-cell"><small>จำนวนขั้นอนุมัติ</small><b>' + asSteps.length + ' ขั้น</b></div>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-ghost" id="as-add-step">' + icon('plus') + ' เพิ่มขั้นอนุมัติ</button>' +
      '<button class="btn btn-primary" id="as-close">' + icon('check') + ' บันทึก</button>' +
      '</div></div>' +
      '<div id="as-steps"></div>';
    document.getElementById('as-add-step').onclick = function () { asStepForm(null, el); };
    // ทุกคำสั่งบันทึกทำทันทีที่ระดับ RPC อยู่แล้ว ปุ่มนี้จึงเป็นการ "เสร็จสิ้น/ปิดผัง"
    document.getElementById('as-close').onclick = function () { asCloseWf(el); };
    asRenderSteps(el);
  }


  /* ---------- ผังอนุมัติแบบ Flow บนลงล่าง (ปรับเฉพาะการแสดงผล) ----------
     การ์ดหนึ่งใบ = หนึ่งขั้น เชื่อมด้วยลูกศร ↓ และปิดท้ายด้วย "อนุมัติสำเร็จ"
     บนการ์ดเหลือเฉพาะ ชื่อขั้น · ผู้อนุมัติ · เงื่อนไข · สถานะ · ปุ่มแก้ไข
     คำสั่ง ย้ายขึ้น/ย้ายลง/ลบ/ปิดใช้งาน ย้ายไปอยู่ในหน้าต่างแก้ไขทั้งหมด
     ลากการ์ดเพื่อเรียงลำดับได้เหมือนเดิม (draggable + handler เดิมไม่ถูกแตะ) */
  function asRenderSteps(el) {
    var box = document.getElementById('as-steps');
    if (!box) return;

    var start = '<div class="wf-node wf-node-start">' + icon('user') +
      '<div><b>ผู้ยื่นคำขอ</b><small>พนักงานเจ้าของคำขอ</small></div></div>';
    var end = '<div class="wf-node wf-node-end">' + icon('check') +
      '<div><b>อนุมัติสำเร็จ</b><small>คำขอผ่านครบทุกขั้น</small></div></div>';
    var arrow = '<div class="wf-arrow" aria-hidden="true">↓</div>';

    if (!asSteps.length) {
      box.innerHTML = '<div class="wf-flowcol">' + start + arrow +
        '<div class="wf-node wf-node-empty">ยังไม่มีขั้นอนุมัติ — กด "เพิ่มขั้นอนุมัติ"</div>' +
        arrow + end + '</div>';
      asBindSteps(el, box);
      return;
    }

    var cards = asSteps.map(function (st, i) {
      var appr = st.approvers || [];
      var names = appr.slice(0, 2).map(function (a) { return a.name; }).join(', ');
      return '<div class="wf-card' + (st.active ? '' : ' as-off') + '" draggable="true" ' +
        'data-step="' + esc(st.step_id) + '" data-idx="' + i + '">' +
        '<div class="wf-card-head" data-as-fold="' + esc(st.step_id) + '" role="button" tabindex="0">' +
        '<span class="wf-grip" title="ลากเพื่อเรียงลำดับขั้น">' + icon('more') + '</span>' +
        '<div class="grow">' +
        '<span class="wf-stepno">Step ' + st.step_no + '</span>' +
        '<b>' + esc(st.name) + '</b>' +
        '<small>ผู้อนุมัติ ' + appr.length + ' คน' + (names ? ' · ' + esc(names) +
          (appr.length > 2 ? ' และอีก ' + (appr.length - 2) + ' คน' : '') : '') + '</small>' +
        '<small>เงื่อนไข : ' + esc(asModeTxt(st.mode)) +
        (st.cond_type && st.cond_type !== 'ALL'
          ? ' · ' + esc(asCondText(asState.type, st.cond_type, st.cond_value)) : '') +
        (st.note ? ' · ' + esc(st.note) : '') + '</small></div>' +
        (st.active ? '<span class="badge badge-ok">เปิด</span>' : '<span class="badge badge-mut">ปิด</span>') +
        '<span class="wf-menu">' +
        '<button class="btn-icon" data-as-menu="' + esc(st.step_id) + '" aria-label="เมนูคำสั่ง" ' +
        'aria-haspopup="true" title="คำสั่งเพิ่มเติม">' + icon('more') + '</button>' +
        '<div class="wf-menu-pop" id="wfm-' + esc(st.step_id) + '" hidden>' +
        '<button type="button" data-as-edit="' + esc(st.step_id) + '">' + icon('edit', 'ic-sm') + ' แก้ไข</button>' +
        '<button type="button" data-as-up="' + esc(st.step_id) + '"' + (i === 0 ? ' disabled' : '') + '>' +
        icon('chevUp', 'ic-sm') + ' ย้ายขึ้น</button>' +
        '<button type="button" data-as-down="' + esc(st.step_id) + '"' +
        (i === asSteps.length - 1 ? ' disabled' : '') + '>' + icon('chevDown', 'ic-sm') + ' ย้ายลง</button>' +
        '<button type="button" data-as-toggle="' + esc(st.step_id) + '">' +
        icon(st.active ? 'ban' : 'check', 'ic-sm') + (st.active ? ' ปิดใช้งาน' : ' เปิดใช้งาน') + '</button>' +
        '<button type="button" class="t-red" data-as-del="' + esc(st.step_id) + '">' +
        icon('trash', 'ic-sm') + ' ลบขั้น</button>' +
        '</div></span>' +
        '<span class="wf-caret" aria-hidden="true">' + icon('chevDown', 'ic-sm') + '</span>' +
        '</div>' +
        '<div class="wf-card-body" id="wfb-' + esc(st.step_id) + '">' +
        '<div class="wf-appr">' + (appr.length
          ? appr.map(function (a) {
              return '<span class="wf-chip"><span class="grow"><b>' + esc(a.emp_code) + '</b> ' + esc(a.name) +
                '<small>' + esc(a.position || '-') + ' · ' + esc(a.department || '-') + '</small></span>' +
                '<button type="button" class="wf-chip-x" data-appr-del="' + esc(a.employee_id) + '" ' +
                'data-step="' + esc(st.step_id) + '" aria-label="ลบผู้อนุมัติ">' + icon('x') + '</button></span>';
            }).join('')
          : '<span class="muted">ยังไม่มีผู้อนุมัติ — ค้นหาและเพิ่มด้านล่าง</span>') + '</div>' +
        '<span class="search-box as-search">' + icon('search', 'ic-sm') +
        '<input data-as-q="' + esc(st.step_id) + '" autocomplete="off" value="' + esc(asQ[st.step_id] || '') + '" ' +
        'placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / ชื่อเล่น เพื่อเพิ่มผู้อนุมัติ">' +
        '<div class="rpt-ac" id="as-ac-' + esc(st.step_id) + '" hidden></div></span>' +
        '</div></div>';
    }).join(arrow);

    box.innerHTML = '<div class="wf-flowcol">' + start + arrow + cards + arrow + end + '</div>';
    asSteps.forEach(function (st) { asSyncStepBody(st.step_id); });
    asBindSteps(el, box);
  }


  function asBindSteps(el, box) {
    box.onclick = function (ev) {
      var b = ev.target.closest
        ? ev.target.closest('[data-as-menu],[data-as-edit],[data-as-toggle],[data-as-up],[data-as-down],[data-as-del],[data-as-mode],[data-as-fold],[data-appr-del]')
        : null;
      if (!b || b.disabled) return;
      var d = b.dataset;
      if (d.asMenu) {                       // เปิด/ปิดเมนู ⋮ ของขั้นนั้น
        var pop = document.getElementById('wfm-' + d.asMenu);
        var wasOpen = pop && !pop.hidden;
        Array.prototype.forEach.call(box.querySelectorAll('.wf-menu-pop'), function (n) { n.hidden = true; });
        if (pop) pop.hidden = wasOpen;
        return;
      }
      Array.prototype.forEach.call(box.querySelectorAll('.wf-menu-pop'), function (n) { n.hidden = true; });
      if (d.asFold) {                       // แสดง/ซ่อนรายชื่อผู้อนุมัติเท่านั้น ไม่แตะข้อมูล
        asStepOpen[d.asFold] = !asStepIsOpen(d.asFold);
        asSyncStepBody(d.asFold);
        return;
      }
      if (d.asEdit) { asStepForm(d.asEdit, el); return; }
      if (d.asToggle) { asStepAct('njhr_wf_step_toggle', { p_token: sbToken(), p_step_id: d.asToggle }, el); return; }
      if (d.asUp) { asStepAct('njhr_wf_step_move', { p_token: sbToken(), p_step_id: d.asUp, p_dir: -1 }, el); return; }
      if (d.asDown) { asStepAct('njhr_wf_step_move', { p_token: sbToken(), p_step_id: d.asDown, p_dir: 1 }, el); return; }
      if (d.asMode) { asSetMode(d.step, d.asMode, el); return; }
      if (d.apprDel) { asApprover('njhr_wf_approver_remove', d.step, d.apprDel, el); return; }
      asDelete(d.asDel, el);
    };

    // เพิ่มผู้อนุมัติต้องใช้ mousedown เพราะ blur ของช่องค้นหาจะปิดรายการก่อน click จะทำงาน
    box.onmousedown = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-appr-add]') : null;
      if (!b) return;
      ev.preventDefault();
      asApprover('njhr_wf_approver_add', b.dataset.step, b.dataset.apprAdd, el);
    };

    box.oninput = function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.asQ) return;
      asQ[t.dataset.asQ] = t.value;
      asAcRun(t.dataset.asQ);
    };
    box.onfocusout = function (ev) {
      var t = ev.target;
      if (!t || !t.dataset || !t.dataset.asQ) return;
      var id = t.dataset.asQ;
      setTimeout(function () { asAcClose(id); }, 160);
    };

    /* ---- ลากเรียงลำดับขั้น (Drag & Drop) — เรียก njhr_wf_step_move เดิมทีละก้าว ---- */
    box.ondragstart = function (ev) {
      var t = ev.target;
      // กดพิมพ์ในช่องค้นหา/กดปุ่ม ต้องไม่กลายเป็นการลากการ์ด
      if (t && t.tagName && ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].indexOf(t.tagName) >= 0) {
        ev.preventDefault(); return;
      }
      var card = t.closest ? t.closest('.wf-card') : null;
      if (!card) return;
      asDrag = { id: card.dataset.step, from: Number(card.dataset.idx) };
      card.classList.add('wf-dragging');
      try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', asDrag.id); } catch (e) {}
    };
    box.ondragover = function (ev) {
      if (!asDrag) return;
      ev.preventDefault();
      var card = ev.target.closest ? ev.target.closest('.wf-card') : null;
      Array.prototype.forEach.call(box.querySelectorAll('.wf-over'), function (n) { n.classList.remove('wf-over'); });
      if (card && card.dataset.step !== asDrag.id) card.classList.add('wf-over');
    };
    box.ondrop = function (ev) {
      if (!asDrag) return;
      ev.preventDefault();
      var card = ev.target.closest ? ev.target.closest('.wf-card') : null;
      var d = asDrag; asDrag = null;
      asDragClear(box);
      if (!card) return;
      var to = Number(card.dataset.idx);
      if (!isFinite(to) || to === d.from) return;
      asReorder(d.id, d.from, to, el);
    };
    box.ondragend = function () { asDrag = null; asDragClear(box); };
  }

  function asDragClear(box) {
    Array.prototype.forEach.call(box.querySelectorAll('.wf-over'), function (n) { n.classList.remove('wf-over'); });
    Array.prototype.forEach.call(box.querySelectorAll('.wf-dragging'), function (n) { n.classList.remove('wf-dragging'); });
  }

  function asReorder(stepId, from, to, el) {
    var dir = to > from ? 1 : -1, n = Math.abs(to - from), p = Promise.resolve(), i;
    asErr('');
    for (i = 0; i < n; i++) {
      p = p.then(function () {
        return sbRpc('njhr_wf_step_move', { p_token: sbToken(), p_step_id: stepId, p_dir: dir });
      });
    }
    p.then(function () {
      toast('เรียงลำดับขั้นอนุมัติแล้ว', 'info');
      return asLoadSteps(el, asState.seq);
    }).catch(function (er) {
      asErr(er.message || 'เรียงลำดับไม่สำเร็จ');
      asLoadSteps(el, asState.seq);
    });
  }

  function asStepAct(fn, args, el) {
    asErr('');
    sbRpc(fn, args).then(function () { return asLoadSteps(el, asState.seq); });
  }

  // สลับ ANY / ALL จากบนการ์ดโดยตรง — ส่งค่าเดิมทุกฟิลด์ไปด้วยเพื่อไม่ให้ค่าอื่นถูกล้าง
  function asSetMode(stepId, mode, el) {
    var st = asFindStep(stepId), w = asCurrentWf();
    if (!st || !w || st.mode === mode) return;
    asErr('');
    sbRpc('njhr_wf_step_save', {
      p_token: sbToken(), p_type: asState.type, p_dept: w.anchor_dept,
      p_step_id: stepId, p_name: st.name, p_mode: mode,
      p_cond_type: st.cond_type, p_cond_value: st.cond_value || '',
      p_active: st.active, p_note: st.note || ''
    }).then(function () { return asLoadSteps(el, asState.seq); });
  }

  function asApprover(fn, stepId, empId, el) {
    asErr('');
    sbRpc(fn, { p_token: sbToken(), p_step_id: stepId, p_employee: empId })
      .then(function () {
        asAcClose(stepId);
        if (fn === 'njhr_wf_approver_add') asQ[stepId] = '';
        asRefreshCounts(el);
        return asLoadSteps(el, asState.seq).then(function () {
          var inp = document.querySelector('[data-as-q="' + stepId + '"]');
          if (inp) inp.focus();
        });
      });
  }

  /* ---- ค้นหาผู้อนุมัติจากพนักงานจริง (รหัส / ชื่อ / นามสกุล / ชื่อเล่น) ---- */
  var asAcRun = debounce(function (stepId) {
    var st = asFindStep(stepId);
    var inp = document.querySelector('[data-as-q="' + stepId + '"]');
    var box = document.getElementById('as-ac-' + stepId);
    if (!st || !inp || !box) return;
    var q = String(inp.value || '').trim();
    asQ[stepId] = q;
    if (!q) { asAcClose(stepId); return; }
    sbRpcList('njhr_wf_candidates', { p_token: sbToken(), p_q: q, p_limit: 8 }).then(function (rows) {
      if (!document.getElementById('as-ac-' + stepId)) return;
      var have = (asFindStep(stepId) || st).approvers || [];
      var ids = have.map(function (a) { return a.employee_id; });
      var pool = (rows || []).filter(function (r) { return ids.indexOf(r.employee_id) < 0; });   // กันเพิ่มซ้ำ
      var b2 = document.getElementById('as-ac-' + stepId);
      b2.innerHTML = pool.length ? pool.map(function (r) {
        return '<button type="button" class="rpt-ac-item" data-appr-add="' + esc(r.employee_id) + '" ' +
          'data-step="' + esc(stepId) + '"><b>' + esc(r.emp_code) + '</b> ' + esc(r.name) +
          '<small>' + esc(r.position_name || '-') + ' · ' + esc(r.department || '-') + '</small></button>';
      }).join('') : '<div class="rpt-ac-item muted">ไม่พบพนักงานที่ตรงกับคำค้น</div>';
      b2.hidden = false;
    }).catch(function (er) { asErr(er.message || 'ค้นหาไม่สำเร็จ'); });
  }, 280);

  function asAcClose(stepId) {
    var b = document.getElementById('as-ac-' + stepId);
    if (b) { b.hidden = true; b.innerHTML = ''; }
  }

  // ลบขั้น: ถ้ามีคำขอรออนุมัติ เซิร์ฟเวอร์จะคืนจำนวนมาให้ถามยืนยันก่อน
  function asDelete(stepId, el) {
    var st = asFindStep(stepId);
    asErr('');
    sbRpc('njhr_wf_step_delete', { p_token: sbToken(), p_step_id: stepId, p_confirm: false })
      .then(function (r) {
        if (r && r.deleted) {
          toast('ลบขั้นอนุมัติแล้ว', 'info'); asRefreshCounts(el);
          return asLoadSteps(el, asState.seq);
        }
        var n = (r && r.pending_count) || 0;
        confirmDialog('ลบขั้นอนุมัติ',
          'ขั้น <b>' + esc(st ? st.name : '') + '</b> ของ <b>' + esc(asDeptText(asCurrentWf())) + '</b><br>' +
          '<span class="t-red">ขณะนี้มีคำขอรออนุมัติอยู่ ' + n + ' รายการ</span> การลบจะมีผลกับการอนุมัติของคำขอเหล่านั้น<br>ยืนยันลบหรือไม่',
          'ยืนยันลบ', function () {
            return sbRpc('njhr_wf_step_delete', { p_token: sbToken(), p_step_id: stepId, p_confirm: true })
              .then(function () {
                toast('ลบขั้นอนุมัติแล้ว', 'info'); asRefreshCounts(el); asLoadSteps(el, asState.seq);
              });
          }, true);
      }).catch(function (er) { asErr(er.message || 'ลบไม่สำเร็จ'); });
  }

  /* ฟอร์มขั้นอนุมัติ: ชื่อขั้น · ANY/ALL · เงื่อนไข · เปิดใช้งาน · หมายเหตุ
     (ผู้อนุมัติย้ายไปจัดการบนการ์ดของขั้นโดยตรง ไม่ต้องเปิด-ปิด Modal ซ้ำ) */
  function asStepForm(stepId, el) {
    var w = asCurrentWf();
    if (!w) { asErr('กรุณาเลือกชุด Workflow ก่อนเพิ่มขั้นอนุมัติ'); return; }
    var st = stepId ? asFindStep(stepId) : null;
    var conds = AS_COND[asState.type] || [];

    openModal(st ? 'แก้ไขขั้นอนุมัติ' : 'เพิ่มขั้นอนุมัติ',
      '<form id="as-f" novalidate>' +
      '<div class="form-2col">' +
      '<label class="field"><span>ประเภทคำขอ</span><input value="' + esc(asTypeLabel(asState.type)) + '" readonly></label>' +
      '<label class="field"><span>ขอบเขต</span><input value="' + esc(asDeptText(w)) + '" readonly></label></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>ลำดับขั้น</span>' +
      '<input value="' + (st ? 'ขั้นที่ ' + st.step_no : 'ต่อท้ายอัตโนมัติ') + '" readonly></label>' +
      '<label class="field"><span>ชื่อขั้นอนุมัติ <i class="req">*</i></span>' +
      '<input name="step_name" value="' + esc(st ? st.name : '') + '" placeholder="เช่น หัวหน้างาน / ผู้จัดการ / HR / ผู้บริหาร"></label></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>รูปแบบการอนุมัติ</span><select name="mode">' +
      ['ANY', 'ALL'].map(function (m) {
        return '<option value="' + m + '"' + (st && st.mode === m ? ' selected' : '') + '>' +
          (m === 'ANY' ? 'คนใดคนหนึ่งอนุมัติ (ANY)' : 'ทุกคนต้องอนุมัติ (ALL)') + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>เงื่อนไข</span><select name="cond_type" id="as-ct">' +
      conds.map(function (c) {
        return '<option value="' + c[0] + '"' + (st && st.cond_type === c[0] ? ' selected' : '') + '>' + c[1] + '</option>';
      }).join('') + '</select></label></div>' +
      '<label class="field" id="as-cv-wrap"><span>ค่าเงื่อนไข</span>' +
      '<input name="cond_value" id="as-cv" value="' + esc(st ? (st.cond_value || '') : '') + '" placeholder="เช่น 3 (วัน) หรือ 4 (ชั่วโมง)"></label>' +
      '<label class="check"><input type="checkbox" name="active" ' + (!st || st.active ? 'checked' : '') + '><span>เปิดใช้งานขั้นนี้</span></label>' +
      '<label class="field"><span>หมายเหตุ</span>' +
      '<input name="note" value="' + esc(st ? (st.note || '') : '') + '" placeholder="ไม่บังคับ"></label>' +
      (st ? '' : '<p class="muted note">บันทึกแล้วจะเพิ่มผู้อนุมัติได้ทันทีบนการ์ดของขั้นนี้</p>') +
      '<div class="form-error" id="as-ferr" role="alert"></div></form>',
      (st ? '<button class="btn btn-ghost btn-sm" id="asf-up">' + icon('chevUp', 'ic-sm') + ' ย้ายขึ้น</button>' +
            '<button class="btn btn-ghost btn-sm" id="asf-down">' + icon('chevDown', 'ic-sm') + ' ย้ายลง</button>' +
            '<button class="btn btn-ghost btn-sm t-red" id="asf-del">' + icon('trash', 'ic-sm') + ' ลบขั้น</button>' +
            '<span class="grow"></span>' : '') +
      '<button class="btn btn-ghost" id="asf-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="asf-save">บันทึก</button>',
      { wide: true });

    // คำสั่งที่ย้ายออกจากหน้าหลักมาไว้ที่นี่ — เรียก RPC ตัวเดิมทุกตัว ไม่เปลี่ยน Logic
    if (st) {
      var idx = -1;
      for (var k = 0; k < asSteps.length; k++) if (asSteps[k].step_id === st.step_id) { idx = k; break; }
      var upB = document.getElementById('asf-up');
      var dnB = document.getElementById('asf-down');
      if (upB) {
        upB.disabled = (idx <= 0);
        upB.onclick = function () {
          closeModal();
          asStepAct('njhr_wf_step_move', { p_token: sbToken(), p_step_id: st.step_id, p_dir: -1 }, el);
        };
      }
      if (dnB) {
        dnB.disabled = (idx < 0 || idx >= asSteps.length - 1);
        dnB.onclick = function () {
          closeModal();
          asStepAct('njhr_wf_step_move', { p_token: sbToken(), p_step_id: st.step_id, p_dir: 1 }, el);
        };
      }
      var delB = document.getElementById('asf-del');
      if (delB) delB.onclick = function () { closeModal(); asDelete(st.step_id, el); };
    }

    function syncCv() {
      var ct = document.getElementById('as-ct').value;
      var wrap = document.getElementById('as-cv-wrap');
      if (wrap) wrap.style.display = AS_COND_NEEDVAL.indexOf(ct) >= 0 ? '' : 'none';
    }
    document.getElementById('as-ct').onchange = syncCv;
    syncCv();
    document.getElementById('asf-cancel').onclick = closeModal;

    document.getElementById('asf-save').onclick = function () {
      var btn = this, fm = document.getElementById('as-f');
      var ferr = document.getElementById('as-ferr');
      // อ่านค่าด้วย querySelector ตรง ๆ — ชื่อฟิลด์บางตัวชนกับ property ของ HTMLFormElement
      function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? x.value : ''; }
      var name = String(fv('step_name')).trim();
      if (!name) { ferr.textContent = 'กรุณาระบุชื่อขั้นอนุมัติ'; return; }
      var ct = fv('cond_type');
      var cv = String(fv('cond_value')).trim();
      if (AS_COND_NEEDVAL.indexOf(ct) >= 0 && !cv) { ferr.textContent = 'เงื่อนไขนี้ต้องระบุค่าเงื่อนไข'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_wf_step_save', {
        p_token: sbToken(), p_type: asState.type, p_dept: w.anchor_dept,
        p_step_id: st ? st.step_id : null, p_name: name, p_mode: fv('mode'),
        p_cond_type: ct, p_cond_value: AS_COND_NEEDVAL.indexOf(ct) >= 0 ? cv : '',
        p_active: fm.querySelector('[name="active"]').checked, p_note: String(fv('note')).trim()
      }).then(function () {
        closeModal(); toast('บันทึกขั้นอนุมัติแล้ว');
        asRefreshCounts(el);
        asLoadSteps(el, asState.seq);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        ferr.textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ================= VIEW: PAY ITEMS (รายการเงินเดือน) =================
     ตาราง njhr_pay_items (Master) + njhr_pay_entries (ยอดรายเดือนต่อพนักงาน)
     ⚠️ ยังไม่ผูกเข้าสูตรคำนวณเงินเดือน/สลิป/REPORT เดิม — RPC njhr_pay_entry_totals
        เตรียมไว้เป็นจุดเชื่อม (ดูหมายเหตุท้ายหน้า) */
  // แท็บหลักเหลือ 2 ค่าเท่านั้น: ITEMS (รายการเงินเดือน) · ASSIGN (กำหนดให้พนักงาน)
  // เงินเพิ่มและเงินหักอยู่ในตารางเดียวกัน แยกด้วยคอลัมน์ "ประเภท" เท่านั้น
  // ไม่มีแท็บและไม่มีปุ่มกรองประเภทอีกต่อไป
  var piQ = '', piSeq = 0, piRows = [];
  var piY = new Date().getFullYear(), piM = new Date().getMonth() + 1;
  var piEnQ = '', piEnRows = [];

  function piCanEdit() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  function piErr(msg) { var b = document.getElementById('pi-err'); if (b) b.textContent = msg || ''; }

  /* หน้าเดียว: รายชื่อพนักงาน + รายการที่กำหนดในเดือนนั้น
     ไม่มีแท็บ "รายการเงินเดือน" / "กำหนดให้พนักงาน" อีกต่อไป
     การจัดการรายการต้นแบบ (njhr_pay_items) ย้ายไปอยู่ใน Modal ปุ่ม "+ สร้างรายการใหม่" */
  function viewPayItems(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    el.innerHTML =
      '<div class="pe-head"><h3>กำหนดรายการเงินเดือนให้พนักงาน</h3>' +
      '<p class="muted">กำหนดรายการเงินเพิ่มหรือเงินหักให้พนักงานในแต่ละเดือน</p></div>' +
      '<div id="pi-panel"></div>' +
      '<div class="form-error" id="pi-err" role="alert" style="white-space:pre-line"></div>';
    piEmpPanel(el);
  }

  /* ---------- Master: เงินเพิ่ม / เงินหัก ---------- */
  function piMasterPanel(el) {
    var seq = ++piSeq, edit = piCanEdit();
    document.getElementById('pi-panel').innerHTML =
      '<div class="toolbar pi-filters">' +
      '<span class="search-box">' + icon('search') +
      '<input id="pi-q" placeholder="ค้นหา รหัส / ชื่อรายการ" value="' + esc(piQ) + '"></span>' +
      '<span class="grow"></span><span class="muted" id="pi-count"></span>' +
      (edit ? '<button class="btn btn-primary" id="pi-add">' + icon('plus') + ' เพิ่มรายการเงินเดือน</button>' : '') + '</div>' +
      '<div class="card p0"><div class="table-wrap"><table><thead><tr>' +
      '<th style="width:34px"></th><th>รหัส</th><th>ชื่อรายการ</th><th>ประเภท</th><th>การคำนวณ</th>' +
      '<th>สลิป</th><th>รายงาน</th><th>สถานะ</th><th class="ta-r"></th></tr></thead>' +
      '<tbody id="pi-body"><tr><td colspan="9" class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</td></tr></tbody></table></div></div>';

    document.getElementById('pi-q').oninput = debounce(function () {
      piQ = this.value; piMasterPanel(el);
      var q2 = document.getElementById('pi-q');
      if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    }, 300);
    if (edit) document.getElementById('pi-add').onclick = function () { piForm(null, el); };

    // p_kind = null เสมอ → ได้ทั้งเงินเพิ่มและเงินหักในชุดเดียว
    sbRpcList('njhr_pay_items', { p_token: sbToken(), p_q: piQ || null, p_kind: null, p_active: null })
      .then(function (rows) {
        if (seq !== piSeq) return;
        piRows = rows;
        var body = document.getElementById('pi-body');
        if (!body) return;
        var CT = { FIXED: 'จำนวนคงที่', PERCENT: 'เปอร์เซ็นต์', PER_EMPLOYEE: 'กรอกยอดต่อคน', SYSTEM: 'คำนวณจากระบบ' };
        body.innerHTML = rows.length ? rows.map(function (r) {
          return '<tr draggable="' + (edit ? 'true' : 'false') + '" data-code="' + esc(r.code) + '">' +
            '<td class="pi-grip">' + (edit ? '⠿' : '') + '</td>' +
            '<td><b>' + esc(r.code) + '</b></td><td>' + esc(r.name_th) + '</td>' +
            '<td>' + (r.kind === 'EARNING'
              ? '<span class="badge badge-ok">เงินเพิ่ม</span>'
              : '<span class="badge badge-bad">เงินหัก</span>') + '</td>' +
            '<td><small class="muted">' + esc(CT[r.calc_type] || r.calc_type) +
            (r.system_source ? ' · ' + esc(r.system_source) : '') + '</small></td>' +
            '<td>' + (r.show_in_slip ? 'แสดง' : '—') + '</td>' +
            '<td>' + (r.show_in_report ? 'แสดง' : '—') + '</td>' +
            '<td>' + (r.active ? '<span class="badge badge-ok">เปิด</span>' : '<span class="badge badge-mut">ปิด</span>') + '</td>' +
            '<td class="ta-r">' + (edit
              ? '<button class="btn-icon" data-pi-edit="' + esc(r.code) + '" aria-label="แก้ไข">' + icon('edit') + '</button>' +
                '<button class="btn-icon ' + (r.active ? 'ic-red' : '') + '" data-pi-toggle="' + esc(r.code) + '" aria-label="เปิด/ปิด">' + icon(r.active ? 'ban' : 'check') + '</button>' +
                (r.in_use ? '' : '<button class="btn-icon ic-red" data-pi-del="' + esc(r.code) + '" aria-label="ลบ">' + icon('x') + '</button>')
              : '') + '</td></tr>';
        }).join('') : '<tr><td colspan="9" class="muted" style="padding:18px">ยังไม่มีรายการเงินเดือน</td></tr>';

        var cnt = document.getElementById('pi-count');
        if (cnt) cnt.textContent = rows.length ? 'ทั้งหมด ' + rows.length + ' รายการ' : '';

        body.onclick = function (ev) {
          var b = ev.target.closest ? ev.target.closest('[data-pi-edit],[data-pi-toggle],[data-pi-del]') : null;
          if (!b) return;
          if (b.dataset.piEdit) piForm(b.dataset.piEdit, el);
          else if (b.dataset.piToggle) piToggle(b.dataset.piToggle, el);
          else piDelete(b.dataset.piDel, el);
        };
        if (edit) piBindDrag(body, el);
      }).catch(function (er) {
        if (seq !== piSeq) return;
        var body = document.getElementById('pi-body');
        if (body) body.innerHTML = '<tr><td colspan="8" class="muted" style="padding:18px">โหลดรายการไม่สำเร็จ</td></tr>';
        piErr('โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er));
      });
  }

  // ลากเรียงลำดับ (desktop) — บันทึกลำดับใหม่ทั้งชุดผ่าน njhr_pay_item_reorder
  function piBindDrag(body, el) {
    var dragged = null;
    body.addEventListener('dragstart', function (ev) {
      dragged = ev.target.closest('tr'); if (dragged) dragged.style.opacity = '.4';
    });
    body.addEventListener('dragover', function (ev) {
      ev.preventDefault();
      var over = ev.target.closest('tr');
      if (!over || !dragged || over === dragged) return;
      var r = over.getBoundingClientRect();
      body.insertBefore(dragged, (ev.clientY - r.top) / r.height > 0.5 ? over.nextSibling : over);
    });
    body.addEventListener('dragend', function () {
      if (!dragged) return;
      dragged.style.opacity = '';
      dragged = null;
      var codes = [].slice.call(body.querySelectorAll('tr[data-code]')).map(function (t) { return t.dataset.code; });
      sbRpc('njhr_pay_item_reorder', { p_token: sbToken(), p_codes: codes })
        .then(function () { toast('บันทึกลำดับแล้ว', 'info'); })
        .catch(function (er) { piErr(er.message || 'บันทึกลำดับไม่สำเร็จ'); piMasterPanel(el); });
    });
  }

  function piFind(code) { return piRows.find(function (x) { return x.code === code; }); }

  function piToggle(code, el) {
    var r = piFind(code);
    if (!r) return;
    confirmDialog(r.active ? 'ปิดใช้งานรายการ' : 'เปิดใช้งานรายการ',
      (r.active ? 'ต้องการปิดใช้งาน' : 'ต้องการเปิดใช้งาน') + ' <b>' + esc(r.name_th) + '</b> ใช่หรือไม่',
      r.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน', function () {
        return sbRpc('njhr_pay_item_save', { p_token: sbToken(), p_code: code, p_active: !r.active })
          .then(function () { toast('บันทึกแล้ว', 'info'); piMasterPanel(el); });
      }, r.active);
  }

  function piDelete(code, el) {
    var r = piFind(code);
    if (!r) return;
    confirmDialog('ลบรายการเงินเดือน',
      'ต้องการลบ <b>' + esc(r.name_th) + '</b> ใช่หรือไม่<br>ระบบจะเก็บประวัติไว้ (Soft Delete) ไม่ลบข้อมูลจริง',
      'ลบรายการ', function () {
        return sbRpc('njhr_pay_item_delete', { p_token: sbToken(), p_code: code })
          .then(function () { toast('ลบรายการแล้ว', 'info'); piMasterPanel(el); });
      }, true);
  }

  function piForm(code, el) {
    var r = code ? piFind(code) : null;
    var CT = [['PER_EMPLOYEE', 'กรอกยอดต่อพนักงาน'], ['FIXED', 'จำนวนเงินคงที่'], ['PERCENT', 'เปอร์เซ็นต์'], ['SYSTEM', 'คำนวณจากระบบเดิม']];
    openModal(r ? 'แก้ไขรายการเงินเดือน' : 'เพิ่มรายการเงินเดือน',
      '<form id="pi-f" novalidate>' +
      '<div class="form-2col">' +
      '<label class="field"><span>รหัสรายการ <i class="req">*</i></span><input name="code" value="' + esc(r ? r.code : '') + '"' + (r ? ' readonly' : '') + ' placeholder="เช่น MEAL_ALLOW"></label>' +
      '<label class="field"><span>ประเภท <i class="req">*</i></span>' +
      '<div class="seg" id="pif-kind">' +
      [['EARNING', 'เงินเพิ่ม'], ['DEDUCTION', 'เงินหัก']].map(function (k) {
        var on = r ? r.kind === k[0] : k[0] === 'EARNING';
        return '<button type="button" class="seg-btn' + (on ? ' active' : '') + '" data-kind="' + k[0] + '">' + k[1] + '</button>';
      }).join('') + '</div>' +
      '<input type="hidden" name="kind" value="' + (r ? esc(r.kind) : 'EARNING') + '"></label></div>' +
      '<label class="field"><span>ชื่อรายการ <i class="req">*</i></span><input name="name_th" value="' + esc(r ? r.name_th : '') + '"></label>' +
      '<label class="field"><span>รูปแบบการคำนวณ</span><select name="calc_type">' +
      CT.map(function (c) { return '<option value="' + c[0] + '"' + (r && r.calc_type === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="form-2col">' +
      '<label class="field"><span>จำนวนเงินคงที่</span><input type="number" name="fixed_amount" min="0" step="0.01" value="' + (r ? lvNum(r.fixed_amount) : 0) + '"></label>' +
      '<label class="field"><span>เปอร์เซ็นต์</span><input type="number" name="percent" min="0" step="0.01" value="' + (r ? lvNum(r.percent) : 0) + '"></label></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>ค่าเริ่มต้น</span><input type="number" name="default_value" step="0.01" value="' + (r ? lvNum(r.default_value) : 0) + '"></label>' +
      '<label class="field"><span>หน่วย</span><input name="unit" value="' + esc(r ? r.unit : 'THB') + '"></label></div>' +
      '<label class="check"><input type="checkbox" name="show_in_slip" ' + (!r || r.show_in_slip ? 'checked' : '') + '><span>แสดงในสลิปเงินเดือน</span></label>' +
      '<label class="check"><input type="checkbox" name="show_in_report" ' + (!r || r.show_in_report ? 'checked' : '') + '><span>แสดงในรายงาน</span></label>' +
      '<div class="form-error" id="pi-ferr" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="pif-cancel">ยกเลิก</button><button class="btn btn-primary" id="pif-save">บันทึก</button>',
      { wide: true });

    // เลือกได้ค่าเดียวเสมอ — เลือกพร้อมกันสองประเภทไม่ได้
    var kindBox = document.getElementById('pif-kind');
    kindBox.onclick = function (ev) {
      var b2 = ev.target.closest ? ev.target.closest('[data-kind]') : null;
      if (!b2) return;
      kindBox.querySelectorAll('.seg-btn').forEach(function (x) { x.classList.remove('active'); });
      b2.classList.add('active');
      document.querySelector('#pi-f [name="kind"]').value = b2.dataset.kind;
    };
    document.getElementById('pif-cancel').onclick = closeModal;
    document.getElementById('pif-save').onclick = function () {
      var btn = this, fm = document.getElementById('pi-f');
      function fq(n2) { return fm.querySelector('[name="' + n2 + '"]'); }
      function fv(n2) { var x = fq(n2); return x ? String(x.value) : ''; }
      var c = fv('code').trim().toUpperCase(), n = fv('name_th').trim();
      if (!c) { document.getElementById('pi-ferr').textContent = 'กรุณากรอกรหัสรายการ'; return; }
      if (!n) { document.getElementById('pi-ferr').textContent = 'กรุณากรอกชื่อรายการ'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_pay_item_save', {
        p_token: sbToken(), p_code: c, p_name_th: n, p_kind: fv('kind'),
        p_calc_type: fv('calc_type'),
        p_fixed_amount: Number(fv('fixed_amount')) || 0,
        p_percent: Number(fv('percent')) || 0,
        p_default_value: Number(fv('default_value')) || 0,
        p_unit: fv('unit').trim() || 'THB',
        p_show_in_slip: fq('show_in_slip').checked,
        p_show_in_report: fq('show_in_report').checked,
        p_is_new: !r
      }).then(function () {
        closeModal(); toast('บันทึกรายการแล้ว');
        viewPayItems(el);                    // กลับหน้าเดียวเสมอ (ไม่มีแท็บแล้ว)
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        document.getElementById('pi-ferr').textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ---------- ตารางพนักงาน + รายการที่กำหนด (หน้าเดียว) ----------
     ข้อมูลจริงจาก njhr_pay_emp_list — คืนพนักงานทุกคนรวมคนที่ยังไม่ได้กำหนด
     ไม่อ่าน db.* / localStorage · ไม่แตะสูตรคำนวณเงินเดือน */
  var peState = { seq: 0, rows: [], q: '', status: 'ALL', sel: {}, err: '' };

  function peReset() { peState.sel = {}; }

  function piEmpPanel(el) {
    var seq = ++peState.seq, edit = piCanEdit();
    var years = [];
    for (var y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) years.push(y);

    document.getElementById('pi-panel').innerHTML =
      // Toolbar แถวเดียว: เดือน · ปี · ค้นหา · ปุ่มสถานะ · ปุ่มกำหนด (ขวาสุด)
      // ป้าย "เดือน/ปี" ยังอยู่ครบสำหรับจอเล็ก และซ่อนเฉพาะจอคอมพิวเตอร์ผ่าน CSS
      '<div class="toolbar pe-bar">' +
      '<label class="field pe-f"><span class="pe-lbl">เดือน</span>' +
      '<select id="pe-m" aria-label="เดือน">' + TH_MONTHS.map(function (n, i) {
        return '<option value="' + (i + 1) + '"' + (piM === i + 1 ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field pe-f"><span class="pe-lbl">ปี</span>' +
      '<select id="pe-y" aria-label="ปี">' + years.map(function (y2) {
        return '<option value="' + y2 + '"' + (piY === y2 ? ' selected' : '') + '>' + (y2 + 543) + '</option>';
      }).join('') + '</select></label>' +
      '<span class="search-box pe-search">' + icon('search') +
      '<input id="pe-q" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / แผนก" value="' + esc(peState.q) + '"></span>' +
      '<span class="pe-seg">' + [['ALL', 'ทั้งหมด'], ['ASSIGNED', 'กำหนดแล้ว'], ['UNASSIGNED', 'ยังไม่ได้กำหนด']]
        .map(function (f) {
          return '<button type="button" class="pe-segb' + (peState.status === f[0] ? ' on' : '') +
            '" data-st="' + f[0] + '">' + f[1] + '</button>';
        }).join('') + '</span>' +
      '<span class="grow"></span>' +
      (edit ? '<button class="btn btn-primary pe-addbtn" id="pe-add">' + icon('plus') + ' กำหนดให้พนักงาน</button>' : '') +
      '</div>' +
      '<div id="pe-bulk"></div>' +
      '<div class="card p0"><div class="table-wrap"><table class="pe-table"><thead><tr>' +
      (edit ? '<th class="pe-ck"><input type="checkbox" id="pe-ckall" aria-label="เลือกทั้งหมด"></th>' : '') +
      '<th class="pe-c-code">รหัสพนักงาน</th><th class="pe-c-name">ชื่อ – นามสกุล</th>' +
      '<th class="pe-c-item">รายการที่กำหนด</th><th class="ta-r pe-c-amt">จำนวนเงิน (บาท)</th>' +
      '<th class="pe-c-st">สถานะ</th><th class="ta-r pe-c-act">จัดการ</th></tr></thead>' +
      '<tbody id="pe-body"><tr><td colspan="7" class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดจาก Supabase…</td></tr></tbody></table></div></div>' +
      '<div id="pe-sum" class="bal-grid" style="margin-top:12px"></div>';

    document.getElementById('pe-m').onchange = function () { piM = +this.value; peReset(); piEmpPanel(el); };
    document.getElementById('pe-y').onchange = function () { piY = +this.value; peReset(); piEmpPanel(el); };
    document.getElementById('pe-q').oninput = debounce(function () {
      peState.q = this.value; peReset(); piEmpPanel(el);
    }, 300);
    document.querySelector('.pe-seg').onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-st]') : null;
      if (!b) return;
      peState.status = b.dataset.st; peReset(); piEmpPanel(el);
    };
    if (edit) document.getElementById('pe-add').onclick = function () { peAssignModal(el, null); };

    sbRpcList('njhr_pay_emp_list', {
      p_token: sbToken(), p_year: piY, p_month: piM,
      p_q: peState.q || null, p_status: peState.status
    }).then(function (rows) {
      if (seq !== peState.seq) return;
      peState.rows = rows || []; peState.err = '';
      peRender(el);
    }).catch(function (ex) {
      if (seq !== peState.seq) return;
      peState.rows = [];
      peState.err = (ex && ex.message) || 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ';
      peRender(el);
    });
  }

  function peRender(el) {
    var body = document.getElementById('pe-body'), edit = piCanEdit();
    if (!body) return;
    if (peState.err) {
      body.innerHTML = '<tr><td colspan="7" class="muted" style="padding:18px">' +
        esc(peState.err) + '</td></tr>';
      return;
    }
    var rows = peState.rows;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7" class="muted" style="padding:18px">ไม่พบพนักงานตามเงื่อนไข</td></tr>';
      return;
    }
    var seenEmp = {};
    body.innerHTML = rows.map(function (r) {
      var first = !seenEmp[r.employee_id];
      seenEmp[r.employee_id] = 1;
      var locked = !!r.locked;
      return '<tr class="' + (r.assigned ? '' : 'pe-none') + (first ? '' : ' pe-cont') + '">' +
        (edit ? '<td class="pe-ck">' + (first
          ? '<input type="checkbox" class="pe-pick" value="' + esc(r.employee_id) + '"' +
            (peState.sel[r.employee_id] ? ' checked' : '') + '>' : '') + '</td>' : '') +
        '<td>' + (first ? '<b>' + esc(r.emp_code) + '</b>' : '') + '</td>' +
        '<td>' + (first ? esc(r.full_name) + (r.nickname ? ' <small class="muted">(' + esc(r.nickname) + ')</small>' : '') : '') + '</td>' +
        // ประเภท (เงินเพิ่ม/เงินหัก) ยังใช้งานอยู่ แค่แสดงเป็นสีและเครื่องหมายแทนคอลัมน์แยก
        '<td>' + (r.assigned
          ? '<span class="pe-item ' + (r.kind === 'EARNING' ? 'earn' : 'ded') + '" title="' +
            (r.kind === 'EARNING' ? 'เงินเพิ่ม' : 'เงินหัก') + '">' + esc(r.item_name) + '</span>' +
            (r.note ? '<small class="muted pe-note">' + esc(r.note) + '</small>' : '')
          : '<span class="muted">ยังไม่มีรายการ</span>') + '</td>' +
        '<td class="ta-r">' + (r.assigned
          ? '<b class="' + (r.kind === 'EARNING' ? 't-green' : 't-red') + '">' +
            (r.kind === 'EARNING' ? '+' : '−') + ' ' + money(r.amount) + '</b>'
          : '<span class="muted">–</span>') + '</td>' +
        '<td>' + (first
          ? (r.entry_count > 0
              ? '<span class="badge badge-ok">' + icon('check', 'ic-sm') + ' กำหนดแล้ว' +
                (r.entry_count > 1 ? ' (' + r.entry_count + ')' : '') + '</span>'
              : '<span class="badge badge-mut">' + icon('clock', 'ic-sm') + ' ยังไม่ได้กำหนด</span>')
          : '') + '</td>' +
        '<td class="ta-r pe-acts">' + (edit
          // ทุกแถวเพิ่มรายการให้พนักงานคนนั้นได้ · แก้ไข/ลบ แสดงเมื่อแถวนั้นมีรายการอยู่แล้ว
          ? '<button class="btn-icon pe-abtn" data-pe-add="' + esc(r.employee_id) + '"' +
            (locked ? ' disabled' : '') + ' aria-label="เพิ่มรายการ" title="เพิ่มรายการ">' +
            icon('plus') + '</button>' +
            (r.assigned
              ? '<button class="btn-icon pe-abtn" data-pe-edit="' + esc(r.entry_id) + '" aria-label="แก้ไข" title="แก้ไข"' +
                (locked ? ' disabled' : '') + '>' + icon('edit') + '</button>' +
                '<button class="btn-icon pe-abtn ic-red" data-pe-del="' + esc(r.entry_id) + '"' +
                (r.can_delete && !locked ? '' : ' disabled') +
                ' aria-label="ลบ" title="' + (r.can_delete && !locked
                  ? 'ลบรายการนี้' : 'ลบไม่ได้ — อยู่ในงวดที่ยืนยันแล้ว') + '">' + icon('trash') + '</button>'
              : '')
          : '') + '</td></tr>';
    }).join('');

    var ern = 0, ded = 0, done = 0, seen2 = {};
    rows.forEach(function (r) {
      if (r.assigned && r.is_active) {
        if (r.kind === 'EARNING') ern += Number(r.amount) || 0; else ded += Number(r.amount) || 0;
      }
      if (!seen2[r.employee_id]) { seen2[r.employee_id] = 1; if (r.entry_count > 0) done++; }
    });
    var totalEmp = Object.keys(seen2).length;
    var sum = document.getElementById('pe-sum');
    if (sum) sum.innerHTML =
      '<div class="bal-item"><div class="bal-top"><span>พนักงานที่แสดง</span><b>' + totalEmp + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>กำหนดแล้ว</span><b class="t-green">' + done + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>ยังไม่ได้กำหนด</span><b>' + (totalEmp - done) + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>รวมเงินเพิ่ม</span><b class="t-green">฿ ' + money(ern) + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>รวมเงินหัก</span><b class="t-red">฿ ' + money(ded) + '</b></div></div>';

    if (edit) peBindBulk(el);

    body.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-pe-edit],[data-pe-del],[data-pe-add]') : null;
      if (!b || b.disabled) return;
      if (b.dataset.peAdd) { peAssignModal(el, [b.dataset.peAdd]); return; }
      var id = b.dataset.peEdit || b.dataset.peDel;
      var row = null;
      for (var i = 0; i < peState.rows.length; i++) if (peState.rows[i].entry_id === id) { row = peState.rows[i]; break; }
      if (!row) return;
      if (b.dataset.peEdit) { peEditModal(el, row); return; }
      confirmDialog('ลบรายการ',
        'ลบ <b>' + esc(row.item_name) + '</b> ของ <b>' + esc(row.full_name) + '</b> ' +
        'ในงวด ' + TH_MONTHS[piM - 1] + ' ' + (piY + 543) + ' ใช่หรือไม่' +
        '<br><small class="muted">ลบเฉพาะรายการนี้ ไม่กระทบรายการอื่นหรือข้อมูลเงินเดือน</small>',
        'ยืนยันลบ', function () {
          return sbRpc('njhr_pay_entry_delete', { p_token: sbToken(), p_id: id })
            .then(function () { toast('ลบรายการแล้ว', 'info'); piEmpPanel(el); });
        }, true);
    };
  }

  /* ---------- เลือกหลายคน ---------- */
  function peSelIds() { return Object.keys(peState.sel).filter(function (k) { return peState.sel[k]; }); }
  function peBindBulk(el) {
    var body = document.getElementById('pe-body'), head = document.getElementById('pe-ckall');
    if (!body) return;
    function sync() {
      var ids = peSelIds();
      var all = [];
      peState.rows.forEach(function (r) { if (all.indexOf(r.employee_id) < 0) all.push(r.employee_id); });
      var allOn = all.length > 0 && all.every(function (x) { return peState.sel[x]; });
      if (head) { head.checked = allOn; head.indeterminate = ids.length > 0 && !allOn; }
      var bar = document.getElementById('pe-bulk');
      if (!bar) return;
      bar.innerHTML = ids.length
        ? '<div class="pi-bulkbar"><b>เลือกแล้ว ' + ids.length + ' คน</b><span class="grow"></span>' +
          '<button class="btn btn-primary btn-sm" id="pe-bgo">' + icon('plus') + ' กำหนดให้ที่เลือก</button>' +
          '<button class="btn btn-ghost btn-sm" id="pe-bclr">ยกเลิกการเลือก</button></div>'
        : '';
      var go = document.getElementById('pe-bgo');
      if (go) go.onclick = function () { peAssignModal(el, peSelIds()); };
      var clr = document.getElementById('pe-bclr');
      if (clr) clr.onclick = function () {
        peState.sel = {};
        body.querySelectorAll('.pe-pick').forEach(function (c) { c.checked = false; });
        sync();
      };
    }
    body.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.classList.contains('pe-pick')) return;
      if (t.checked) peState.sel[t.value] = 1; else delete peState.sel[t.value];
      sync();
    });
    if (head) head.onchange = function () {
      var on = this.checked;
      peState.rows.forEach(function (r) {
        if (on) peState.sel[r.employee_id] = 1; else delete peState.sel[r.employee_id];
      });
      body.querySelectorAll('.pe-pick').forEach(function (c) { c.checked = on; });
      sync();
    };
    sync();
  }
  /* ---------- Modal กำหนดรายการ (4 ขั้นในหน้าต่างเดียว) ----------
     ขั้น 1 เลือกพนักงาน · ขั้น 2 เลือกรายการ (+ สร้างรายการใหม่ได้ในนี้)
     ขั้น 3 จำนวนเงิน · ขั้น 4 เดือน/ปี
     บันทึกผ่าน njhr_pay_entry_save เดิม — ไม่แตะสูตรคำนวณเงินเดือน */
  var peModal = { emps: [], items: [], sel: {}, busy: false };

  function peAssignModal(el, preIds) {
    if (!piCanEdit()) { toast('คุณไม่มีสิทธิ์กำหนดรายการเงินเดือน', 'error'); return; }
    peModal.sel = {};
    (preIds || peSelIds()).forEach(function (id) { peModal.sel[id] = 1; });

    openModal('กำหนดรายการเงินเดือนให้พนักงาน',
      '<div class="muted"><span class="spinner"></span> กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="pea-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="pea-save">บันทึก</button>',
      { wide: true, fullMobile: true });
    document.getElementById('pea-cancel').onclick = closeModal;

    Promise.all([
      piLoadEmployees(),
      sbRpcList('njhr_pay_items', { p_token: sbToken(), p_q: null, p_kind: null, p_active: true })
    ]).then(function (r) {
      peModal.emps = r[0] || [];
      peModal.items = (r[1] || []).filter(function (i) { return i.calc_type !== 'SYSTEM'; });
      peDrawModal(el);
    }).catch(function (ex) {
      var b = document.querySelector('#modal-root .modal-body');
      if (b) b.innerHTML = '<div class="form-error">' + esc(ex.message || 'โหลดข้อมูลไม่สำเร็จ') + '</div>';
    });
  }

  function peDrawModal(el) {
    var body = document.querySelector('#modal-root .modal-body');
    if (!body) return;
    var years = [];
    for (var y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) years.push(y);

    body.innerHTML =
      '<div class="pea-step"><b>1. เลือกพนักงาน</b>' +
      '<span class="grow"></span><span class="chip chip-info">เลือกแล้ว <b id="pea-n">0</b> คน</span></div>' +
      '<span class="search-box"><input id="pea-q" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / แผนก" autocomplete="off">' +
      '<span class="rpt-ac" id="pea-ac" hidden></span></span>' +
      '<div class="pea-chips" id="pea-chips"></div>' +

      '<div class="pea-step" style="margin-top:16px"><b>2. เลือกรายการ</b><span class="grow"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm t-red" id="pea-new">' + icon('plus') + ' สร้างรายการใหม่</button></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>รายการเงินเดือน <i class="req">*</i></span><select id="pea-item">' +
      peItemOptions() + '</select></label>' +
      '<label class="field"><span>ประเภท</span><input id="pea-kind" readonly value=""></label></div>' +

      '<div class="form-2col" style="margin-top:6px">' +
      '<label class="field"><span>3. จำนวนเงิน (ต่อคน) <i class="req">*</i></span>' +
      '<input type="number" id="pea-amt" min="0.01" step="0.01" placeholder="0.00"></label>' +
      '<div class="field"><span>4. เดือน / ปี</span><div class="form-2col" style="gap:8px">' +
      '<select id="pea-m">' + TH_MONTHS.map(function (n, i) {
        return '<option value="' + (i + 1) + '"' + (piM === i + 1 ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select>' +
      '<select id="pea-y">' + years.map(function (y2) {
        return '<option value="' + y2 + '"' + (piY === y2 ? ' selected' : '') + '>' + (y2 + 543) + '</option>';
      }).join('') + '</select></div></div></div>' +
      '<label class="field"><span>หมายเหตุ</span><input id="pea-note" placeholder="ไม่บังคับ"></label>' +
      '<div class="form-error" id="pea-err" role="alert" style="white-space:pre-line"></div>';

    peDrawChips();
    peSyncKind();
    document.getElementById('pea-item').onchange = peSyncKind;
    document.getElementById('pea-new').onclick = function () { peNewItemModal(el); };
    peBindSearch();
    document.getElementById('pea-save').onclick = function () { peSave(el, this); };
  }

  function peItemOptions() {
    return peModal.items.map(function (i) {
      return '<option value="' + esc(i.code) + '" data-kind="' + esc(i.kind) + '">' + esc(i.name_th) + '</option>';
    }).join('');
  }
  function peSyncKind() {
    var sel = document.getElementById('pea-item'), k = document.getElementById('pea-kind');
    if (!sel || !k) return;
    var o = sel.options[sel.selectedIndex];
    k.value = (o && o.dataset.kind === 'EARNING') ? 'เงินเพิ่ม' : 'เงินหัก';
    k.className = (o && o.dataset.kind === 'EARNING') ? 'pea-earn' : 'pea-ded';
  }
  function peDrawChips() {
    var box = document.getElementById('pea-chips');
    if (!box) return;
    var ids = Object.keys(peModal.sel).filter(function (k) { return peModal.sel[k]; });
    box.innerHTML = ids.length ? ids.map(function (id) {
      var e = null;
      for (var i = 0; i < peModal.emps.length; i++) if (peModal.emps[i].id === id) { e = peModal.emps[i]; break; }
      if (!e) return '';
      return '<span class="pea-chip">' + esc(e.emp_code) + ' ' + esc(e.full_name) +
        '<button type="button" data-rm="' + esc(id) + '" aria-label="นำออก">' + icon('x', 'ic-sm') + '</button></span>';
    }).join('') : '<span class="muted">ยังไม่ได้เลือกพนักงาน — ค้นหาแล้วกดเพื่อเพิ่ม</span>';
    var n = document.getElementById('pea-n');
    if (n) n.textContent = ids.length;
    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-rm]') : null;
      if (!b) return;
      delete peModal.sel[b.dataset.rm];
      peDrawChips();
    };
  }
  function peBindSearch() {
    var q = document.getElementById('pea-q'), ac = document.getElementById('pea-ac');
    if (!q || !ac) return;
    q.oninput = debounce(function () {
      var v = String(this.value || '').trim().toLowerCase();
      if (!v) { ac.hidden = true; ac.innerHTML = ''; return; }
      var hit = peModal.emps.filter(function (e) {
        return !peModal.sel[e.id] &&
          (e.emp_code + ' ' + e.full_name + ' ' + (e.nickname || '') + ' ' +
           (e.department_name || '')).toLowerCase().indexOf(v) >= 0;
      }).slice(0, 12);
      ac.innerHTML = hit.length ? hit.map(function (e) {
        return '<button type="button" data-add="' + esc(e.id) + '"><b>' + esc(e.emp_code) + '</b> ' +
          esc(e.full_name) + '<small>' + esc(e.department_name || '—') + '</small></button>';
      }).join('') : '<div class="muted" style="padding:8px 10px">ไม่พบพนักงาน</div>';
      ac.hidden = false;
    }, 180);
    ac.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-add]') : null;
      if (!b) return;
      peModal.sel[b.dataset.add] = 1;
      q.value = ''; ac.hidden = true; ac.innerHTML = '';
      peDrawChips();
    };
  }

  /* สร้างรายการเงินเดือนใหม่ได้ในนี้เลย — ไม่ต้องมีหน้าตั้งค่าแยก */
  function peNewItemModal(el) {
    var prevBody = document.querySelector('#modal-root .modal-body').innerHTML;
    var box = document.querySelector('#modal-root .modal-body');
    box.innerHTML =
      '<div class="pea-step"><b>สร้างรายการเงินเดือนใหม่</b></div>' +
      '<div class="form-2col">' +
      '<label class="field"><span>รหัสรายการ <i class="req">*</i></span>' +
      '<input id="pni-code" placeholder="เช่น MEAL_ALLOW" maxlength="30"></label>' +
      '<label class="field"><span>ประเภท <i class="req">*</i></span><select id="pni-kind">' +
      '<option value="EARNING">เงินเพิ่ม</option><option value="DEDUCTION">เงินหัก</option></select></label></div>' +
      '<label class="field"><span>ชื่อรายการ (ภาษาไทย) <i class="req">*</i></span>' +
      '<input id="pni-name" placeholder="เช่น ค่าอาหาร"></label>' +
      '<div class="form-error" id="pni-err" role="alert"></div>';
    var foot = document.querySelector('#modal-root .modal-foot');
    foot.innerHTML = '<button class="btn btn-ghost" id="pni-back">ย้อนกลับ</button>' +
      '<button class="btn btn-primary" id="pni-save">สร้างรายการ</button>';

    document.getElementById('pni-back').onclick = function () { peDrawModal(el); };
    document.getElementById('pni-save').onclick = function () {
      var btn = this, eb = document.getElementById('pni-err');
      var code = String(document.getElementById('pni-code').value || '').trim().toUpperCase().replace(/\s+/g, '_');
      var name = String(document.getElementById('pni-name').value || '').trim();
      var kind = document.getElementById('pni-kind').value;
      eb.textContent = '';
      if (!code) { eb.textContent = 'กรุณาระบุรหัสรายการ'; return; }
      if (!name) { eb.textContent = 'กรุณาระบุชื่อรายการ'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้าง…';
      sbRpc('njhr_pay_item_save', {
        p_token: sbToken(), p_code: code, p_name_th: name, p_kind: kind,
        p_calc_type: 'MANUAL', p_show_in_slip: true, p_show_in_report: true,
        p_active: true, p_is_new: true
      }).then(function () {
        return sbRpcList('njhr_pay_items', { p_token: sbToken(), p_q: null, p_kind: null, p_active: true });
      }).then(function (rows) {
        peModal.items = (rows || []).filter(function (i) { return i.calc_type !== 'SYSTEM'; });
        toast('สร้างรายการ "' + name + '" แล้ว');
        peDrawModal(el);
        var sel = document.getElementById('pea-item');
        if (sel) { sel.value = code; peSyncKind(); }
      }).catch(function (ex) {
        btn.disabled = false; btn.innerHTML = 'สร้างรายการ';
        eb.textContent = ex.message || 'สร้างรายการไม่สำเร็จ';
      });
    };
  }

  /* บันทึก — กันกดซ้ำ · ถ้ามีรายการเดิมอยู่แล้วให้ถามก่อนทับ */
  function peSave(el, btn) {
    var eb = document.getElementById('pea-err');
    var ids = Object.keys(peModal.sel).filter(function (k) { return peModal.sel[k]; });
    var code = document.getElementById('pea-item').value;
    var amt = Number(document.getElementById('pea-amt').value);
    var m = +document.getElementById('pea-m').value, y = +document.getElementById('pea-y').value;
    var note = String(document.getElementById('pea-note').value || '').trim() || null;
    eb.textContent = '';
    if (!ids.length) { eb.textContent = 'กรุณาเลือกพนักงานอย่างน้อย 1 คน'; return; }
    if (!code) { eb.textContent = 'กรุณาเลือกรายการเงินเดือน'; return; }
    if (!isFinite(amt) || amt <= 0) { eb.textContent = 'จำนวนเงินต้องมากกว่า 0 บาท'; return; }
    if (peModal.busy || btn.disabled) return;

    // ตรวจว่ามีใครมีรายการนี้ในเดือน/ปีเดียวกันอยู่แล้ว
    var dup = [];
    peState.rows.forEach(function (r) {
      if (r.assigned && r.item_code === code && ids.indexOf(r.employee_id) >= 0 &&
          r.period_year === y && r.period_month === m) {
        dup.push(r.emp_code + ' ' + r.full_name + ' (เดิม ' + money(r.amount) + ')');
      }
    });
    var run = function () {
      peModal.busy = true; btn.disabled = true;
      var done = 0, fail = [];
      ids.reduce(function (chain, id) {
        return chain.then(function () {
          btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก ' + done + '/' + ids.length;
          return sbRpc('njhr_pay_entry_save', {
            p_token: sbToken(), p_employee: id, p_year: y, p_month: m,
            p_item_code: code, p_amount: Number(amt.toFixed(2)), p_percent: null,
            p_note: note, p_recurring: false, p_mode: 'ONE_TIME',
            p_effective_start: y + '-' + ('0' + m).slice(-2) + '-01',
            p_effective_end: null, p_is_active: true, p_id: null
          }).then(function () { done++; })
            .catch(function (ex) { fail.push((ex && ex.message) || 'ผิดพลาด'); });
        });
      }, Promise.resolve()).then(function () {
        peModal.busy = false; btn.disabled = false; btn.innerHTML = 'บันทึก';
        if (done) {
          closeModal();
          toast('บันทึกแล้ว ' + done + ' รายการ');
          piM = m; piY = y; peReset();
          piEmpPanel(el);                       // อัปเดตตารางทันที ไม่ต้องรีเฟรชหน้า
          if (fail.length) setTimeout(function () {
            piErr('ไม่สำเร็จ ' + fail.length + ' รายการ:\n' + fail.slice(0, 5).join('\n'));
          }, 400);
        } else {
          eb.textContent = fail.slice(0, 5).join('\n') || 'บันทึกไม่สำเร็จ';
        }
      });
    };

    if (dup.length) {
      confirmDialog('มีรายการนี้อยู่แล้ว',
        'พนักงาน ' + dup.length + ' คนมีรายการนี้ในงวด ' + TH_MONTHS[m - 1] + ' ' + (y + 543) + ' แล้ว<br>' +
        '<small class="muted">' + esc(dup.slice(0, 5).join(' · ')) + '</small><br><br>' +
        'ต้องการ<b>แก้ไขจำนวนเดิม</b>เป็น ' + money(amt) + ' บาทหรือไม่',
        'แก้ไขจำนวนเดิม', run, false);
      return;
    }
    run();
  }

  /* ---------- แก้ไขรายการเดิม ---------- */
  function peEditModal(el, row) {
    var years = [];
    for (var y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) years.push(y);
    return sbRpcList('njhr_pay_items', { p_token: sbToken(), p_q: null, p_kind: null, p_active: true })
      .then(function (items) {
        peModal.items = (items || []).filter(function (i) { return i.calc_type !== 'SYSTEM'; });
        openModal('แก้ไขรายการเงินเดือน',
          '<div class="doc-empinfo"><b>' + esc(row.emp_code) + ' · ' + esc(row.full_name) + '</b>' +
          '<small>' + esc(row.department_name || '—') + '</small></div>' +
          '<div class="form-2col" style="margin-top:10px">' +
          '<label class="field"><span>รายการ <i class="req">*</i></span><select id="pee-item">' +
          peModal.items.map(function (i) {
            return '<option value="' + esc(i.code) + '" data-kind="' + esc(i.kind) + '"' +
              (i.code === row.item_code ? ' selected' : '') + '>' + esc(i.name_th) + '</option>';
          }).join('') + '</select></label>' +
          '<label class="field"><span>ประเภท</span><input id="pee-kind" readonly></label></div>' +
          '<div class="form-2col">' +
          '<label class="field"><span>จำนวนเงิน (บาท) <i class="req">*</i></span>' +
          '<input type="number" id="pee-amt" min="0.01" step="0.01" value="' + piMoneyIn(row.amount) + '"></label>' +
          '<div class="field"><span>เดือน / ปี</span><div class="form-2col" style="gap:8px">' +
          '<select id="pee-m">' + TH_MONTHS.map(function (n, i) {
            return '<option value="' + (i + 1) + '"' + (row.period_month === i + 1 ? ' selected' : '') + '>' + n + '</option>';
          }).join('') + '</select>' +
          '<select id="pee-y">' + years.map(function (y2) {
            return '<option value="' + y2 + '"' + (row.period_year === y2 ? ' selected' : '') + '>' + (y2 + 543) + '</option>';
          }).join('') + '</select></div></div></div>' +
          '<label class="field"><span>หมายเหตุ</span><input id="pee-note" value="' + esc(row.note || '') + '"></label>' +
          '<div class="form-error" id="pee-err" role="alert"></div>',
          '<button class="btn btn-ghost" id="pee-cancel">ยกเลิก</button>' +
          '<button class="btn btn-primary" id="pee-save">บันทึก</button>',
          { wide: true, fullMobile: true });

        function syncK() {
          var s2 = document.getElementById('pee-item');
          var o = s2.options[s2.selectedIndex];
          document.getElementById('pee-kind').value = (o && o.dataset.kind === 'EARNING') ? 'เงินเพิ่ม' : 'เงินหัก';
        }
        document.getElementById('pee-item').onchange = syncK; syncK();
        document.getElementById('pee-cancel').onclick = closeModal;
        document.getElementById('pee-save').onclick = function () {
          var btn = this, eb = document.getElementById('pee-err');
          var amt = Number(document.getElementById('pee-amt').value);
          var m = +document.getElementById('pee-m').value, y2 = +document.getElementById('pee-y').value;
          eb.textContent = '';
          if (!isFinite(amt) || amt <= 0) { eb.textContent = 'จำนวนเงินต้องมากกว่า 0 บาท'; return; }
          if (btn.disabled) return;
          btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
          sbRpc('njhr_pay_entry_save', {
            p_token: sbToken(), p_employee: row.employee_id, p_year: y2, p_month: m,
            p_item_code: document.getElementById('pee-item').value,
            p_amount: Number(amt.toFixed(2)), p_percent: null,
            p_note: String(document.getElementById('pee-note').value || '').trim() || null,
            p_recurring: (row.entry_mode === 'RECURRING'), p_mode: row.entry_mode || 'ONE_TIME',
            p_effective_start: row.effective_start || (y2 + '-' + ('0' + m).slice(-2) + '-01'),
            p_effective_end: row.effective_end, p_is_active: true, p_id: row.entry_id
          }).then(function () {
            closeModal(); toast('บันทึกแล้ว');
            piM = m; piY = y2; piEmpPanel(el);
          }).catch(function (ex) {
            btn.disabled = false; btn.innerHTML = 'บันทึก';
            eb.textContent = ex.message || 'บันทึกไม่สำเร็จ';
          });
        };
      }).catch(function (ex) { piErr(ex.message || 'โหลดรายการไม่สำเร็จ'); });
  }
  /* ---------- กำหนดรายการให้พนักงาน — Supabase RPC ล้วน ----------
     njhr_pay_entries · njhr_pay_entry_save · njhr_pay_entry_set_active
     njhr_pay_entry_delete · njhr_pay_entry_copy_preview · njhr_pay_entry_copy_apply
     njhr_pay_entry_history
     ONE_TIME  = มีผลเฉพาะเดือน/ปีที่กำหนด เดือนถัดไปไม่เห็น
     RECURRING = เก็บแถวเดียวพร้อมช่วงวันที่ ระบบนำมาคำนวณให้ทุกงวดเอง ไม่สร้าง record ซ้ำ */
  var piEmpCache = null;
  var piSel = {};                 // รายการที่ติ๊กเลือกไว้ (key = entry id)

  function piMoneyIn(v) { var n = Number(v); return isFinite(n) ? n.toFixed(2) : '0.00'; }
  function piMonthTH(iso, py, pm) {
    if (iso) {
      var p = String(iso).slice(0, 10).split('-');
      if (p.length === 3) return TH_MONTHS[(+p[1]) - 1] + ' ' + ((+p[0]) + 543);
    }
    if (py && pm) return TH_MONTHS[pm - 1] + ' ' + (py + 543);
    return '—';
  }
  /* รายชื่อพนักงานจริงทั้งหมดจาก employees (njhr_emp_list จำกัดครั้งละ 100 จึงดึงเป็นหน้า) */
  function piLoadEmployees() {
    if (piEmpCache) return Promise.resolve(piEmpCache);
    var out = [];
    function page(off) {
      return sbRpcList('njhr_emp_list', {
        p_token: sbToken(), p_status: 'ACTIVE', p_sort: 'emp_code', p_limit: 100, p_offset: off
      }).then(function (rows) {
        out = out.concat(rows || []);
        var total = rows && rows.length ? Number(rows[0].total_count) : 0;
        if (out.length < total && rows.length) return page(off + 100);
        return out;
      });
    }
    return page(0).then(function (rows) { piEmpCache = rows; return rows; });
  }

  function piAssignPanel(el) {
    var seq = ++piSeq, edit = piCanEdit();
    var years = [];
    for (var y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) years.push(y);
    document.getElementById('pi-panel').innerHTML =
      '<div class="toolbar">' +
      '<select id="pi-m">' + TH_MONTHS.map(function (n, i) {
        return '<option value="' + (i + 1) + '"' + (piM === i + 1 ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select>' +
      '<select id="pi-y">' + years.map(function (y2) {
        return '<option value="' + y2 + '"' + (piY === y2 ? ' selected' : '') + '>' + (y2 + 543) + '</option>';
      }).join('') + '</select>' +
      '<span class="search-box">' + icon('search') +
      '<input id="pi-eq" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / แผนก / รายการ" value="' + esc(piEnQ) + '"></span>' +
      '<span class="grow"></span><span class="muted" id="pi-ecount"></span>' +
      (edit ? '<button class="btn btn-ghost" id="pi-copy">คัดลอกจากเดือนก่อน</button>' +
              '<button class="btn btn-primary" id="pi-eadd">' + icon('plus') + ' กำหนดรายการ</button>' : '') + '</div>' +
      '<div id="pi-lock"></div>' +
      '<div id="pi-bulk"></div>' +
      '<div class="card p0"><div class="table-wrap"><table><thead><tr>' +
      (edit ? '<th class="pi-ck-col"><input type="checkbox" id="pi-ckall" aria-label="เลือกทั้งหมด"></th>' : '') +
      '<th>รหัส</th><th>พนักงาน</th><th>รายการ</th><th>ประเภท</th><th class="ta-r">จำนวนเงิน</th>' +
      '<th>รูปแบบรายการ</th><th>เดือนเริ่มใช้</th><th>เดือนสิ้นสุด</th><th>หมายเหตุ</th><th>สถานะ</th>' +
      '<th class="ta-r">จัดการ</th></tr></thead>' +
      '<tbody id="pi-ebody"><tr><td colspan="12" class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดข้อมูลจาก Supabase…</td></tr></tbody></table></div></div>' +
      '<div id="pi-sum" class="bal-grid" style="margin-top:12px"></div>';

    document.getElementById('pi-m').onchange = function () { piM = +this.value; piSel = {}; piAssignPanel(el); };
    document.getElementById('pi-y').onchange = function () { piY = +this.value; piSel = {}; piAssignPanel(el); };
    document.getElementById('pi-eq').oninput = debounce(function () { piEnQ = this.value; piSel = {}; piAssignPanel(el); }, 300);
    if (edit) {
      document.getElementById('pi-eadd').onclick = function () { piEntryForm(el, null); };
      document.getElementById('pi-copy').onclick = function () { piCopyModal(el); };
    }

    sbRpcList('njhr_pay_entries', { p_token: sbToken(), p_year: piY, p_month: piM, p_employee: null, p_q: piEnQ || null })
      .then(function (rows) {
        if (seq !== piSeq) return;
        piEnRows = rows || [];
        var body = document.getElementById('pi-ebody');
        if (!body) return;
        var locked = piEnRows.length ? !!piEnRows[0].locked : false;
        var lk = document.getElementById('pi-lock');
        if (lk) lk.innerHTML = locked
          ? '<div class="ot-warn">งวด ' + TH_MONTHS[piM - 1] + ' ' + (piY + 543) +
            ' ถูกยืนยันหรือปิดแล้ว — แก้ไขย้อนหลังไม่ได้</div>' : '';

        body.innerHTML = piEnRows.length ? piEnRows.map(function (r) {
          var mode = r.entry_mode || 'ONE_TIME';
          var canDel = edit && r.can_delete && !r.locked;
          return '<tr' + (r.is_active ? '' : ' class="row-mut"') + '>' +
            (edit ? '<td class="pi-ck-col"><input type="checkbox" class="pi-ck" value="' + esc(r.id) + '"' +
              (piSel[r.id] ? ' checked' : '') + '></td>' : '') +
            '<td><b>' + esc(r.emp_code || '') + '</b></td><td>' + esc(r.emp_name || '') +
            (r.department_name ? '<small class="muted"> · ' + esc(r.department_name) + '</small>' : '') + '</td>' +
            '<td>' + esc(r.item_name) + '</td>' +
            '<td>' + (r.kind === 'EARNING' ? '<span class="chip chip-ok">เงินเพิ่ม</span>' : '<span class="chip chip-warn">เงินหัก</span>') + '</td>' +
            '<td class="ta-r"><b>' + money(r.amount) + '</b></td>' +
            '<td>' + (mode === 'RECURRING'
              ? '<span class="chip chip-info">ทุกเดือน</span>' : '<span class="chip">เฉพาะเดือนนี้</span>') + '</td>' +
            '<td>' + esc(piMonthTH(r.effective_start, r.period_year, r.period_month)) + '</td>' +
            '<td>' + (mode === 'RECURRING'
              ? (r.effective_end ? esc(piMonthTH(r.effective_end)) : '<small class="muted">ไม่กำหนด</small>')
              : '<small class="muted">—</small>') + '</td>' +
            '<td><small class="muted">' + esc(r.note || '') + '</small></td>' +
            '<td>' + (r.is_active ? '<span class="badge badge-ok">ใช้งาน</span>' : '<span class="badge badge-mut">ปิดใช้งาน</span>') + '</td>' +
            '<td class="ta-r doc-acts">' +
            (edit ? '<button class="btn-icon" data-pi-eedit="' + esc(r.id) + '" aria-label="แก้ไข" title="แก้ไข"' +
                    (r.locked ? ' disabled' : '') + '>' + icon('edit') + '</button>' +
                    '<button class="btn-icon" data-pi-etoggle="' + esc(r.id) + '" aria-label="สถานะ" title="' +
                    (r.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + '">' + icon(r.is_active ? 'eyeOff' : 'eye') + '</button>' : '') +
            '<button class="btn-icon" data-pi-ehist="' + esc(r.id) + '" aria-label="ประวัติ" title="ดูประวัติ">' + icon('history') + '</button>' +
            (canDel ? '<button class="btn-icon ic-red" data-pi-edel="' + esc(r.id) + '" aria-label="ลบ" title="ลบ">' + icon('trash') + '</button>' : '') +
            '</td></tr>';
        }).join('') : '<tr><td colspan="12" class="muted" style="padding:18px">ยังไม่มีรายการในงวดนี้</td></tr>';

        var cnt = document.getElementById('pi-ecount');
        if (cnt) cnt.textContent = piEnRows.length ? 'ทั้งหมด ' + piEnRows.length + ' รายการ' : '';
        var ern = 0, ded = 0, rec = 0;
        piEnRows.forEach(function (r) {
          if (!r.is_active) return;
          if ((r.entry_mode || 'ONE_TIME') === 'RECURRING') rec++;
          if (r.kind === 'EARNING') ern += Number(r.amount) || 0; else ded += Number(r.amount) || 0;
        });
        var sum = document.getElementById('pi-sum');
        if (sum) sum.innerHTML =
          '<div class="bal-item"><div class="bal-top"><span>รวมเงินเพิ่มในงวด</span><b class="t-green">฿ ' + money(ern) + '</b></div></div>' +
          '<div class="bal-item"><div class="bal-top"><span>รวมเงินหักในงวด</span><b class="t-red">฿ ' + money(ded) + '</b></div></div>' +
          '<div class="bal-item"><div class="bal-top"><span>ผลต่าง</span><b>฿ ' + money(ern - ded) + '</b></div></div>' +
          '<div class="bal-item"><div class="bal-top"><span>รายการต่อเนื่องที่มีผล</span><b>' + rec + '</b></div></div>';

        if (edit) piBindBulk(el);

        body.onclick = function (ev) {
          var b = ev.target.closest
            ? ev.target.closest('[data-pi-eedit],[data-pi-etoggle],[data-pi-edel],[data-pi-ehist]') : null;
          if (!b || b.disabled) return;
          var ds = b.dataset;
          if (ds.piEhist) { piHistory(ds.piEhist); return; }
          var row = null;
          for (var i = 0; i < piEnRows.length; i++) {
            if (piEnRows[i].id === (ds.piEedit || ds.piEtoggle || ds.piEdel)) { row = piEnRows[i]; break; }
          }
          if (!row) return;
          if (ds.piEedit) { piEntryForm(el, row); return; }
          if (ds.piEtoggle) {
            confirmDialog((row.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + 'รายการ',
              (row.is_active
                ? 'ปิดใช้งาน <b>' + esc(row.item_name) + '</b> ของ <b>' + esc(row.emp_name) + '</b>?' +
                  '<br><small class="muted">งวดถัดไปจะไม่ถูกนำไปคำนวณ ส่วนงวดที่ยืนยันแล้วไม่เปลี่ยนย้อนหลัง</small>'
                : 'เปิดใช้งาน <b>' + esc(row.item_name) + '</b> ของ <b>' + esc(row.emp_name) + '</b>?'),
              'ยืนยัน', function () {
                return sbRpc('njhr_pay_entry_set_active', { p_token: sbToken(), p_id: row.id, p_active: !row.is_active })
                  .then(function () { toast('บันทึกแล้ว'); piAssignPanel(el); });
              }, row.is_active);
            return;
          }
          if (ds.piEdel) {
            confirmDialog('ลบรายการ',
              'ลบ <b>' + esc(row.item_name) + '</b> ของ <b>' + esc(row.emp_name) + '</b> ออกถาวรใช่หรือไม่',
              'ยืนยันลบ', function () {
                return sbRpc('njhr_pay_entry_delete', { p_token: sbToken(), p_id: row.id })
                  .then(function () { toast('ลบรายการแล้ว', 'info'); piAssignPanel(el); });
              }, true);
          }
        };
      }).catch(function (er) {
        if (seq !== piSeq) return;
        var body = document.getElementById('pi-ebody');
        if (body) body.innerHTML = '<tr><td colspan="12" class="muted" style="padding:18px">โหลดรายการไม่สำเร็จ</td></tr>';
        piErr('โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er));
      });
  }

  /* ---------- เลือกหลายรายการ: แถบจัดการ + ลบ/ปิดใช้งานพร้อมกัน ----------
     ทำงานผ่าน RPC njhr_pay_entry_bulk ฝั่ง Supabase เท่านั้น
     รายการที่ถูกใช้ในงวดที่ยืนยัน/ปิดแล้วจะถูกปฏิเสธเป็นรายตัว แต่รายการอื่นยังทำต่อ */
  function piSelIds() {
    return Object.keys(piSel).filter(function (k) { return piSel[k]; });
  }
  function piBindBulk(el) {
    var body = document.getElementById('pi-ebody');
    var head = document.getElementById('pi-ckall');
    if (!body) return;

    function sync() {
      var ids = piSelIds();
      var shown = piEnRows.length;
      var allShown = shown > 0 && ids.length >= shown &&
        piEnRows.every(function (r) { return piSel[r.id]; });
      if (head) {
        head.checked = allShown;
        head.indeterminate = ids.length > 0 && !allShown;
      }
      var bar = document.getElementById('pi-bulk');
      if (!bar) return;
      if (!ids.length) { bar.innerHTML = ''; return; }
      var lockedN = 0;
      piEnRows.forEach(function (r) { if (piSel[r.id] && (r.locked || !r.can_delete)) lockedN++; });
      bar.innerHTML =
        '<div class="pi-bulkbar"><b>เลือกแล้ว ' + ids.length + ' รายการ</b>' +
        (allShown && shown
          ? '<small class="muted">เลือกทั้งหมด ' + shown + ' รายการในผลลัพธ์นี้</small>' : '') +
        (lockedN ? '<small class="t-red">มี ' + lockedN + ' รายการที่ลบไม่ได้ (อยู่ในงวดที่ยืนยันแล้ว)</small>' : '') +
        '<span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="pi-bdis">ปิดใช้งานที่เลือก</button>' +
        '<button class="btn btn-danger btn-sm" id="pi-bdel">ลบที่เลือก</button>' +
        '<button class="btn btn-ghost btn-sm" id="pi-bclr">ยกเลิกการเลือก</button></div>';

      document.getElementById('pi-bclr').onclick = function () {
        piSel = {};
        body.querySelectorAll('.pi-ck').forEach(function (c) { c.checked = false; });
        sync();
      };
      document.getElementById('pi-bdis').onclick = function () {
        var n = piSelIds().length;
        confirmDialog('ปิดใช้งานรายการที่เลือก',
          'ยืนยันปิดใช้งานรายการที่เลือก ' + n + ' รายการหรือไม่' +
          '<br><small class="muted">รายการประจำจะหยุดมีผลตั้งแต่งวดถัดไป ' +
          'งวดเงินเดือนที่คำนวณหรือปิดไปแล้วไม่เปลี่ยนย้อนหลัง</small>',
          'ปิดใช้งาน', function () { return piBulkRun(el, 'DEACTIVATE'); }, true);
      };
      document.getElementById('pi-bdel').onclick = function () {
        var n = piSelIds().length;
        confirmDialog('ลบรายการที่เลือก',
          'ยืนยันลบรายการที่เลือก ' + n + ' รายการหรือไม่' +
          (lockedN ? '<br><small class="t-red">มี ' + lockedN + ' รายการที่ถูกใช้ในงวดที่ยืนยันแล้ว ' +
            'ระบบจะไม่ลบให้และจะรายงานเหตุผล — ให้ปิดใช้งานแทน</small>' : ''),
          'ยืนยันลบ', function () { return piBulkRun(el, 'DELETE'); }, true);
      };
    }

    body.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.classList.contains('pi-ck')) return;
      if (t.checked) piSel[t.value] = 1; else delete piSel[t.value];
      sync();
    });
    if (head) head.onchange = function () {
      var on = this.checked;
      // เลือกเฉพาะรายการที่แสดงอยู่ตามเดือน/ปี/คำค้นปัจจุบันเท่านั้น
      piEnRows.forEach(function (r) { if (on) piSel[r.id] = 1; else delete piSel[r.id]; });
      body.querySelectorAll('.pi-ck').forEach(function (c) { c.checked = on; });
      sync();
    };
    sync();
  }

  function piBulkRun(el, action) {
    var ids = piSelIds();
    if (!ids.length) return;
    piErr('');
    var bar = document.getElementById('pi-bulk');
    if (bar) bar.innerHTML = '<div class="pi-bulkbar"><span class="spinner"></span> ' +
      'กำลังดำเนินการ ' + ids.length + ' รายการ…</div>';

    return sbRpcList('njhr_pay_entry_bulk', { p_token: sbToken(), p_ids: ids, p_action: action })
      .then(function (rows) {
        var ok = 0, fail = [];
        (rows || []).forEach(function (r) {
          if (r.ok) ok++;
          else fail.push((r.emp_code ? r.emp_code + ' · ' : '') +
                         (r.item_name ? r.item_name + ' · ' : '') + (r.message || ''));
        });
        piSel = {};
        piAssignPanel(el);                       // โหลดตารางใหม่จาก Supabase ทันที
        var verb = action === 'DELETE' ? 'ลบ' : (action === 'ACTIVATE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน');
        if (fail.length) toast(verb + 'สำเร็จ ' + ok + ' · ไม่สำเร็จ ' + fail.length + ' รายการ', 'info');
        else toast(verb + 'สำเร็จ ' + ok + ' รายการ');
        if (fail.length) setTimeout(function () {
          piErr('สำเร็จ ' + ok + ' รายการ · ไม่สำเร็จ ' + fail.length + ' รายการ\n' +
                fail.slice(0, 10).join('\n') +
                (fail.length > 10 ? '\n… และอีก ' + (fail.length - 10) + ' รายการ' : ''));
        }, 400);
      }).catch(function (ex) {
        piErr((ex && ex.message) || 'ดำเนินการไม่สำเร็จ');
        piAssignPanel(el);
      });
  }
  /* ---------- ประวัติการเปลี่ยนแปลงของรายการ ---------- */
  function piHistory(id) {
    openModal('ประวัติรายการ', '<div class="muted"><span class="spinner"></span> กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="pih-close">ปิด</button>');
    document.getElementById('pih-close').onclick = closeModal;
    sbRpcList('njhr_pay_entry_history', { p_token: sbToken(), p_id: id }).then(function (rows) {
      var body = document.querySelector('#modal-root .modal-body');
      if (!body) return;
      body.innerHTML = rows.length
        ? '<div class="doc-timeline">' + rows.map(function (h) {
            return '<div class="doc-tl-row"><span class="doc-tl-dot"></span><div class="grow">' +
              '<b>' + esc(h.action) + '</b><small>' + esc(h.detail || '') + '</small>' +
              '<small class="muted">' + esc(h.actor || '') + ' · ' + docTS(h.at) + '</small></div></div>';
          }).join('') + '</div>'
        : emptyState('ยังไม่มีประวัติของรายการนี้');
    }).catch(function (er) {
      var body = document.querySelector('#modal-root .modal-body');
      if (body) body.innerHTML = '<div class="form-error">' + esc(er.message || 'โหลดประวัติไม่สำเร็จ') + '</div>';
    });
  }

  /* ---------- ฟอร์มกำหนด / แก้ไขรายการ ---------- */
  function piEntryForm(el, row) {
    var editing = !!row;
    Promise.all([
      sbRpcList('njhr_pay_items', { p_token: sbToken(), p_q: null, p_kind: null, p_active: true }),
      piLoadEmployees()
    ]).then(function (res) {
      var items = res[0].filter(function (i) { return i.calc_type !== 'SYSTEM'; });
      var emps = res[1];
      if (!items.length) { piErr('ยังไม่มีรายการที่กรอกยอดเองได้'); return; }
      var mode = editing ? (row.entry_mode || 'ONE_TIME') : 'ONE_TIME';
      var firstDay = piY + '-' + ('0' + piM).slice(-2) + '-01';

      openModal((editing ? 'แก้ไขรายการ' : 'กำหนดรายการให้พนักงาน') + ' · ' + TH_MONTHS[piM - 1] + ' ' + (piY + 543),
        '<form id="pe-f" novalidate>' +
        '<div class="form-2col">' +
        '<label class="field"><span>รายการเงินเดือน <i class="req">*</i></span><select id="pe-item">' +
        items.map(function (i) {
          return '<option value="' + esc(i.code) + '" data-kind="' + esc(i.kind) + '"' +
            (editing && row.item_code === i.code ? ' selected' : '') + '>' + esc(i.name_th) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field"><span>ประเภท</span><input id="pe-kind" readonly value=""></label></div>' +
        '<div class="form-2col">' +
        '<label class="field"><span>จำนวนเงิน (บาท) <i class="req">*</i></span>' +
        '<input type="number" id="pe-amount" min="0" step="0.01" value="' + (editing ? piMoneyIn(row.amount) : '0.00') + '"></label>' +
        '<label class="field"><span>รูปแบบรายการ <i class="req">*</i></span><select id="pe-mode">' +
        '<option value="ONE_TIME"' + (mode === 'ONE_TIME' ? ' selected' : '') + '>ใช้เฉพาะเดือนนี้</option>' +
        '<option value="RECURRING"' + (mode === 'RECURRING' ? ' selected' : '') + '>ใช้ต่อเนื่องทุกเดือน</option>' +
        '</select></label></div>' +
        '<div class="form-2col">' +
        '<label class="field"><span>วันที่เริ่มใช้ <i class="req">*</i></span>' +
        '<input type="date" id="pe-start" value="' +
        (editing && row.effective_start ? String(row.effective_start).slice(0, 10) : firstDay) + '"></label>' +
        '<label class="field" id="pe-end-wrap"><span>วันที่สิ้นสุด <small class="muted">(ไม่บังคับ)</small></span>' +
        '<input type="date" id="pe-end" value="' +
        (editing && row.effective_end ? String(row.effective_end).slice(0, 10) : '') + '"></label></div>' +
        '<label class="field"><span>หมายเหตุ</span>' +
        '<input id="pe-note" placeholder="ไม่บังคับ" value="' + (editing ? esc(row.note || '') : '') + '"></label>' +
        (editing
          ? '<label class="check"><input type="checkbox" id="pe-active"' + (row.is_active ? ' checked' : '') +
            '><span>เปิดใช้งานรายการนี้</span></label>' +
            '<div class="doc-empinfo">พนักงาน: <b>' + esc(row.emp_code) + ' · ' + esc(row.emp_name) + '</b></div>'
          : '<div class="otj-head" style="margin-top:12px"><b>พนักงาน <i class="req">*</i> ' +
            '(เลือกได้หลายคน · <span id="pe-n">0</span> คน)</b>' +
            '<span><button type="button" class="btn btn-ghost btn-sm" id="pe-all">เลือกทั้งหมดที่แสดง</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" id="pe-none">ล้างการเลือก</button></span></div>' +
            '<div class="ep-search"><span class="ep-search-ic">' + icon('search') + '</span>' +
            '<input id="pe-q" placeholder="ค้นหารหัส / ชื่อ / ชื่อเล่น / แผนก" autocomplete="off"></div>' +
            '<div class="list" id="pe-emps" style="max-height:260px;overflow:auto"></div>') +
        '<div class="form-error" id="pe-ferr" role="alert" style="white-space:pre-line"></div></form>',
        '<button class="btn btn-ghost" id="pef-cancel">ยกเลิก</button>' +
        '<button class="btn btn-primary" id="pef-save">บันทึก</button>',
        { wide: true });

      var itemEl = document.getElementById('pe-item');
      var kindEl = document.getElementById('pe-kind');
      var modeEl = document.getElementById('pe-mode');
      var endWrap = document.getElementById('pe-end-wrap');
      function syncKind() {
        var o = itemEl.options[itemEl.selectedIndex];
        kindEl.value = (o && o.dataset.kind === 'EARNING') ? 'เงินเพิ่ม' : 'เงินหัก';
      }
      function syncMode() {
        var rec = modeEl.value === 'RECURRING';
        endWrap.style.display = rec ? '' : 'none';
        if (!rec) document.getElementById('pe-end').value = '';
      }
      itemEl.onchange = syncKind; modeEl.onchange = syncMode;
      syncKind(); syncMode();

      var pick = {};
      if (!editing) {
        var qEl = document.getElementById('pe-q');
        var listB = document.getElementById('pe-emps');
        var shown = [];
        function drawEmps() {
          var q = qEl.value.trim().toLowerCase();
          shown = emps.filter(function (e) {
            return !q || (e.emp_code + ' ' + e.full_name + ' ' + (e.nickname || '') + ' ' +
              (e.department_name || '')).toLowerCase().indexOf(q) >= 0;
          });
          listB.innerHTML = shown.length ? shown.map(function (e) {
            return '<label class="list-row sh-emp-row"><input type="checkbox" class="pe-pick" value="' + esc(e.id) + '"' +
              (pick[e.id] ? ' checked' : '') + '>' +
              '<div class="grow"><b>' + esc(e.full_name) + '</b><small>' + esc(e.emp_code) +
              (e.nickname ? ' · ' + esc(e.nickname) : '') + ' · ' + esc(e.department_name || '—') +
              ' · ' + esc(e.position_name || '—') + '</small></div></label>';
          }).join('') : '<div class="muted" style="padding:12px">ไม่พบพนักงานตามคำค้น</div>';
        }
        function syncN() {
          var n = Object.keys(pick).filter(function (k) { return pick[k]; }).length;
          var s = document.getElementById('pe-n'); if (s) s.textContent = n;
        }
        qEl.oninput = function () { drawEmps(); syncN(); };
        listB.onchange = function (ev) {
          var t = ev.target;
          if (!t || !t.classList.contains('pe-pick')) return;
          if (t.checked) pick[t.value] = 1; else delete pick[t.value];
          syncN();
        };
        document.getElementById('pe-all').onclick = function () {
          shown.forEach(function (e) { pick[e.id] = 1; });
          listB.querySelectorAll('.pe-pick').forEach(function (c) { c.checked = true; });
          syncN();
        };
        document.getElementById('pe-none').onclick = function () {
          pick = {};
          listB.querySelectorAll('.pe-pick').forEach(function (c) { c.checked = false; });
          syncN();
        };
        drawEmps(); syncN();
      }

      document.getElementById('pef-cancel').onclick = closeModal;
      document.getElementById('pef-save').onclick = function () {
        var btn = this, eb = document.getElementById('pe-ferr');
        var amt = Number(document.getElementById('pe-amount').value);
        var st = document.getElementById('pe-start').value;
        var en = document.getElementById('pe-end').value || null;
        var md = modeEl.value;
        var note = document.getElementById('pe-note').value.trim() || null;
        var act = editing ? document.getElementById('pe-active').checked : true;
        var targets = editing ? [row.employee_id]
          : Object.keys(pick).filter(function (k) { return pick[k]; });
        eb.textContent = '';
        if (!targets.length) { eb.textContent = 'กรุณาเลือกพนักงานอย่างน้อย 1 คน'; return; }
        if (!isFinite(amt) || amt < 0) { eb.textContent = 'จำนวนเงินไม่ถูกต้อง'; return; }
        if (!st) { eb.textContent = 'กรุณาระบุวันที่เริ่มใช้'; return; }
        if (md === 'RECURRING' && en && en < st) { eb.textContent = 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้'; return; }
        if (btn.disabled) return;
        btn.disabled = true;
        var done = 0, fail = [];
        targets.reduce(function (chain, empId) {
          return chain.then(function () {
            btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก ' + done + '/' + targets.length;
            return sbRpc('njhr_pay_entry_save', {
              p_token: sbToken(), p_employee: empId, p_year: piY, p_month: piM,
              p_item_code: itemEl.value, p_amount: Number(amt.toFixed(2)), p_percent: null,
              p_note: note, p_recurring: (md === 'RECURRING'),
              p_mode: md, p_effective_start: st, p_effective_end: (md === 'RECURRING' ? en : null),
              p_is_active: act, p_id: editing ? row.id : null
            }).then(function () { done++; })
              .catch(function (ex) { fail.push((ex && ex.message) || 'ผิดพลาด'); });
          });
        }, Promise.resolve()).then(function () {
          btn.disabled = false; btn.innerHTML = 'บันทึก';
          if (done) {
            closeModal();
            toast('บันทึกแล้ว ' + done + ' รายการ');
            piAssignPanel(el);                 // โหลดจาก Supabase ใหม่ทันที
            if (fail.length) setTimeout(function () {
              piErr('ไม่สำเร็จ ' + fail.length + ' รายการ:\n' + fail.slice(0, 5).join('\n'));
            }, 400);
          } else {
            eb.textContent = fail.slice(0, 5).join('\n') || 'บันทึกไม่สำเร็จ';
          }
        });
      };
    }).catch(function (er) { piErr(er.message || 'โหลดข้อมูลไม่สำเร็จ'); });
  }

  /* ---------- คัดลอกจากเดือนก่อน — เฉพาะรายการ "ใช้เฉพาะเดือนนี้" ---------- */
  function piCopyModal(el) {
    var pm = piM === 1 ? 12 : piM - 1, py = piM === 1 ? piY - 1 : piY;
    openModal('คัดลอกจากเดือนก่อน · ' + TH_MONTHS[pm - 1] + ' ' + (py + 543) + ' → ' + TH_MONTHS[piM - 1] + ' ' + (piY + 543),
      '<div class="muted"><span class="spinner"></span> กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="pc-cancel">ยกเลิก</button>', { wide: true });
    document.getElementById('pc-cancel').onclick = closeModal;

    sbRpcList('njhr_pay_entry_copy_preview', { p_token: sbToken(), p_year: piY, p_month: piM })
      .then(function (rows) {
        var body = document.querySelector('#modal-root .modal-body');
        var foot = document.querySelector('#modal-root .modal-foot');
        if (!body) return;
        if (!rows.length) {
          body.innerHTML = emptyState('เดือนก่อนไม่มีรายการแบบ "ใช้เฉพาะเดือนนี้" ให้คัดลอก');
          return;
        }
        body.innerHTML =
          '<p class="muted">คัดลอกเฉพาะรายการแบบ <b>ใช้เฉพาะเดือนนี้</b> เท่านั้น — ' +
          'รายการต่อเนื่องระบบนำมาคำนวณให้อัตโนมัติอยู่แล้ว จึงไม่ต้องคัดลอก</p>' +
          '<div class="toolbar"><button type="button" class="btn btn-ghost btn-sm" id="pc-all">เลือกทั้งหมด</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="pc-none">ล้างการเลือก</button>' +
          '<span class="grow"></span><span class="muted">เลือกแล้ว <span id="pc-n">0</span> รายการ</span></div>' +
          '<div class="table-wrap empi-table" style="max-height:340px"><table><thead><tr>' +
          '<th></th><th>รหัส</th><th>พนักงาน</th><th>รายการ</th><th>ประเภท</th>' +
          '<th class="ta-r">จำนวนเงิน</th><th>สถานะ</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr' + (r.already ? ' class="row-mut"' : '') + '>' +
              '<td><input type="checkbox" class="pc-pick" value="' + esc(r.id) + '"' + (r.already ? ' disabled' : '') + '></td>' +
              '<td>' + esc(r.emp_code) + '</td><td>' + esc(r.emp_name) + '</td>' +
              '<td>' + esc(r.item_name) + '</td>' +
              '<td>' + (r.kind === 'EARNING' ? 'เงินเพิ่ม' : 'เงินหัก') + '</td>' +
              '<td class="ta-r"><input type="number" class="pc-amt" data-id="' + esc(r.id) + '" min="0" step="0.01" ' +
              'style="width:110px;text-align:right" value="' + piMoneyIn(r.amount) + '"' + (r.already ? ' disabled' : '') + '></td>' +
              '<td>' + (r.already ? '<span class="badge badge-mut">มีอยู่แล้ว</span>' : '<span class="badge badge-ok">คัดลอกได้</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="form-error" id="pc-err" role="alert" style="white-space:pre-line"></div>';
        if (foot) foot.innerHTML =
          '<button class="btn btn-ghost" id="pc-cancel">ยกเลิก</button>' +
          '<button class="btn btn-primary" id="pc-go">คัดลอกที่เลือก</button>';
        document.getElementById('pc-cancel').onclick = closeModal;

        function syncN() {
          document.getElementById('pc-n').textContent =
            body.querySelectorAll('.pc-pick:checked').length;
        }
        body.onchange = syncN;
        document.getElementById('pc-all').onclick = function () {
          body.querySelectorAll('.pc-pick:not(:disabled)').forEach(function (c) { c.checked = true; });
          syncN();
        };
        document.getElementById('pc-none').onclick = function () {
          body.querySelectorAll('.pc-pick').forEach(function (c) { c.checked = false; });
          syncN();
        };
        syncN();

        document.getElementById('pc-go').onclick = function () {
          var picked = Array.prototype.slice.call(body.querySelectorAll('.pc-pick:checked'));
          var eb = document.getElementById('pc-err');
          eb.textContent = '';
          if (!picked.length) { eb.textContent = 'กรุณาเลือกรายการอย่างน้อย 1 รายการ'; return; }
          var payload = picked.map(function (c) {
            var amtEl = body.querySelector('.pc-amt[data-id="' + c.value + '"]');
            return { id: c.value, amount: amtEl ? Number(amtEl.value).toFixed(2) : null };
          });
          var btn = this;
          if (btn.disabled) return;
          btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังคัดลอก…';
          sbRpc('njhr_pay_entry_copy_apply', {
            p_token: sbToken(), p_year: piY, p_month: piM, p_rows: payload
          }).then(function (r) {
            closeModal();
            toast('คัดลอกแล้ว ' + ((r && r.copied) || 0) + ' รายการ' +
              (r && r.skipped ? ' · ข้าม ' + r.skipped : ''));
            piAssignPanel(el);
          }).catch(function (ex) {
            btn.disabled = false; btn.innerHTML = 'คัดลอกที่เลือก';
            eb.textContent = (ex && ex.message) || 'คัดลอกไม่สำเร็จ';
          });
        };
      }).catch(function (ex) {
        var body = document.querySelector('#modal-root .modal-body');
        if (body) body.innerHTML = '<div class="form-error">' + esc((ex && ex.message) || 'โหลดไม่สำเร็จ') + '</div>';
      });
  }

  /* ================= VIEW: ประกันสังคม =================
     รายชื่อและรหัสพนักงานมาจากตาราง employees จริงผ่าน njhr_sso_list เท่านั้น
     ไม่อ่าน db.employees / localStorage และไม่มีข้อมูลตัวอย่างใด ๆ
     สูตรคงเดิมทุกบรรทัด: ฐาน 1,650–15,000 · ลูกจ้าง 5% · นายจ้าง 5% */
  var ssoState = { seq: 0, rows: [], q: '', err: '' };

  /* ฐานและยอดสมทบคำนวณที่ฐานข้อมูลด้วย njhr_sso_base() (สูตรกลางแหล่งเดียว)
     Frontend แค่แสดงผล ไม่คำนวณซ้ำ และไม่มีอัตรา/เพดาน Hardcode อีกต่อไป */
  function ssoCanEdit() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  function ssoOf(r) {
    return {
      enabled: r.sso_enabled !== false,
      mode: r.sso_base_mode || 'AUTO',
      base: Number(r.sso_base) || 0,
      emp: Number(r.amount_employee) || 0,
      er: Number(r.amount_employer) || 0
    };
  }

  function viewSSO(el) {
    var seq = ++ssoState.seq;
    el.innerHTML =
      '<div class="toolbar sso-bar"><h3>เงินสมทบประกันสังคมเดือนปัจจุบัน</h3>' +
      '<span class="search-box sso-search">' + icon('search', 'ic-sm') +
      '<input id="sso-q" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / แผนก" value="' + esc(ssoState.q) + '"></span>' +
      '<span class="grow"></span><span class="muted" id="sso-count"></span>' +
      '<button class="btn btn-ghost" id="sso-export">' + icon('download') + ' Export</button></div>' +
      '<div class="card p0" id="sso-panel"><div class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดรายชื่อพนักงานจาก Supabase…</div></div>' +
      '<p class="muted note" id="sso-note">กำลังอ่านค่าตั้งค่าประกันสังคม…</p>' +
      '<div class="form-error" id="sso-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('sso-q').oninput = debounce(function () {
      ssoState.q = this.value; viewSSO(el);
    }, 320);
    document.getElementById('sso-export').onclick = function () { ssoExport(); };

    if (!sbReady()) { ssoFail(el, 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }

    // อ่านค่าตั้งค่าจริงมาแสดงใต้ตาราง แทนตัวเลข Hardcode เดิม
    sbRpc('njhr_sso_config', {}).then(function (cf) {
      var n = document.getElementById('sso-note');
      if (n && cf) n.textContent = 'ฐานคำนวณ ' + money(cf.base_min) + '–' + money(cf.base_max) +
        ' บาท · ลูกจ้าง ' + cf.rate_employee + '% · นายจ้าง ' + cf.rate_employer +
        '% · เริ่มมีผล ' + empBE(String(cf.effective_date || '').slice(0, 10)) +
        (cf.enabled ? '' : ' · ระบบประกันสังคมถูกปิดใช้งาน');
    }).catch(function () {
      var n = document.getElementById('sso-note');
      if (n) n.textContent = 'อ่านค่าตั้งค่าประกันสังคมไม่สำเร็จ';
    });

    sbRpcList('njhr_sso_list', { p_token: sbToken(), p_q: ssoState.q || null, p_dept: null })
      .then(function (rows) {
        if (seq !== ssoState.seq) return;
        ssoState.rows = rows || []; ssoState.err = '';
        ssoRender(el);
      })
      .catch(function (er) {
        if (seq !== ssoState.seq) return;
        ssoState.rows = [];
        ssoFail(el, (er && er.message) || 'โหลดรายชื่อพนักงานจาก Supabase ไม่สำเร็จ');
      });
  }

  // เชื่อมต่อไม่ได้ = แสดง Error State · ห้ามแสดงข้อมูลตัวอย่างแทน
  function ssoFail(el, msg) {
    var box = document.getElementById('sso-panel');
    if (box) box.innerHTML =
      '<div class="ot-warn" style="margin:14px"><b>โหลดข้อมูลไม่สำเร็จ</b><br>' + esc(msg) + '</div>' +
      '<p class="muted note" style="margin:0 14px 14px">หน้านี้อ่านรายชื่อพนักงานจากฐานข้อมูลจริงเท่านั้น ' +
      'จึงไม่แสดงข้อมูลใด ๆ เมื่อเชื่อมต่อไม่ได้</p>' +
      '<div style="padding:0 14px 16px"><button class="btn btn-primary btn-sm" id="sso-retry">ลองใหม่</button></div>';
    var rb = document.getElementById('sso-retry');
    if (rb) rb.onclick = function () { viewSSO(el); };
    var cnt = document.getElementById('sso-count');
    if (cnt) cnt.textContent = '';
  }

  function ssoRender(el) {
    var box = document.getElementById('sso-panel');
    if (!box) return;
    var rows = ssoState.rows;
    if (!rows.length) {
      box.innerHTML = '<div class="muted" style="padding:22px;text-align:center">' +
        (ssoState.q ? 'ไม่พบพนักงานตามคำค้น' : 'ไม่พบข้อมูลพนักงาน') + '</div>';
      document.getElementById('sso-count').textContent = '';
      return;
    }
    var sumBase = 0, sumEmp = 0, sumEr = 0, offN = 0;
    var body = rows.map(function (r) {
      var c = ssoOf(r);
      sumBase += c.base; sumEmp += c.emp; sumEr += c.er;
      if (!c.enabled) offN++;
      var nameOk = String(r.full_name || '').trim() !== '';
      return '<tr' + (c.enabled ? '' : ' class="sso-off"') + '>' +
        '<td class="sso-c-code"><b>' + esc(r.emp_code || '—') + '</b></td>' +
        '<td class="sso-c-name"><span class="sso-1l">' +
        (nameOk ? esc(r.full_name) : '<span class="t-red">ไม่พบข้อมูลพนักงาน</span>') + '</span></td>' +
        '<td class="sso-c-pos"><span class="sso-1l">' + esc(r.position_name || '—') + '</span></td>' +
        '<td class="sso-c-mode">' + (c.enabled
          ? '<span class="chip ' + (c.mode === 'MANUAL' ? 'chip-warn' : 'chip-info') + '">' + c.mode + '</span>'
          : '<span class="chip chip-bad">ไม่เข้าประกันสังคม</span>') + '</td>' +
        '<td class="ta-r">' + money(c.base) + '</td>' +
        '<td class="ta-r">' + money(c.emp) + '</td>' +
        '<td class="ta-r">' + money(c.er) + '</td>' +
        '<td class="ta-r sso-c-act">' + (ssoCanEdit()
          ? '<button class="btn-icon us-btn" data-sso-edit="' + esc(r.employee_id) + '" ' +
            'aria-label="ตั้งค่าประกันสังคม" title="ตั้งค่าประกันสังคม">' + icon('edit') + '</button>' : '') +
        '</td></tr>';
    }).join('');

    var r0 = rows[0] || {};
    var rE = Number(r0.rate_employee) || 5, rR = Number(r0.rate_employer) || 5;
    box.innerHTML = '<div class="table-wrap"><table class="sso-table"><thead><tr>' +
      '<th class="sso-c-code">รหัสพนักงาน</th><th class="sso-c-name">ชื่อ – นามสกุล</th>' +
      '<th class="sso-c-pos">ตำแหน่ง</th><th class="sso-c-mode">วิธีคำนวณ</th>' +
      '<th class="ta-r sso-c-num">ฐานคำนวณ</th>' +
      '<th class="ta-r sso-c-num">ลูกจ้าง ' + rE + '%</th>' +
      '<th class="ta-r sso-c-num">นายจ้าง ' + rR + '%</th>' +
      '<th class="ta-r sso-c-act">จัดการ</th>' +
      '</tr></thead><tbody>' +
      body +
      '<tr class="row-total"><td colspan="4"><b>รวม ' + rows.length + ' คน' +
      (offN ? ' (ไม่เข้าประกันสังคม ' + offN + ' คน)' : '') + '</b></td>' +
      '<td class="ta-r"><b>' + money(sumBase) + '</b></td>' +
      '<td class="ta-r"><b>' + money(sumEmp) + '</b></td>' +
      '<td class="ta-r"><b>' + money(sumEr) + '</b></td><td></td></tr>' +
      '</tbody></table></div>';

    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-sso-edit]') : null;
      if (!b) return;
      var row = null;
      for (var i = 0; i < ssoState.rows.length; i++) {
        if (ssoState.rows[i].employee_id === b.dataset.ssoEdit) { row = ssoState.rows[i]; break; }
      }
      if (row) ssoEditModal(row, el);
    };
    document.getElementById('sso-count').textContent = 'ทั้งหมด ' + rows.length + ' คน';
  }

  /* Export ใช้ชุดข้อมูลเดียวกับที่แสดงบนหน้าจอ (ssoState.rows) */
  function ssoExport() {
    var rows = ssoState.rows || [];
    if (!rows.length) { toast('ไม่มีข้อมูลให้ Export', 'info'); return; }
    // โครงสร้างเดียวกับหน้าจอทุกคอลัมน์
    var r0 = rows[0] || {};
    var rE = Number(r0.rate_employee) || 5, rR = Number(r0.rate_employer) || 5;
    downloadCSV('sso.csv', [['รหัสพนักงาน', 'ชื่อ – นามสกุล', 'ตำแหน่ง', 'วิธีคำนวณ',
                             'ฐานคำนวณ', 'ลูกจ้าง ' + rE + '%', 'นายจ้าง ' + rR + '%']].concat(
      rows.map(function (r) {
        var c = ssoOf(r);
        return [r.emp_code || '', r.full_name || 'ไม่พบข้อมูลพนักงาน',
                r.position_name || '', (c.enabled ? c.mode : 'ไม่เข้าประกันสังคม'),
                c.base, c.emp, c.er];
      })));
    audit('EXPORT', 'Export ประกันสังคม ' + rows.length + ' คน');
    toast('ดาวน์โหลดไฟล์แล้ว');
  }

  /* ================= VIEW: REPORTS ================= */
  /* ================= VIEW: REPORTS (รายงานการลงเวลา / มาสาย) =================
     ข้อมูลชุดเดียว: rptRows() ใช้ทั้งตารางบนหน้าจอ · จำนวนรายการ · และ Export Excel
     ไม่มี logic กรองแยกระหว่างหน้าจอกับไฟล์ · ไม่แตะ REPORT ALL / รวมเงินเดือน / ฐานข้อมูล */

  // แยกคำนำหน้าออกจากชื่อ — ใช้ฟิลด์ title จริงก่อน ถ้าไม่มีจึงตัดจากชื่อเฉพาะคำนำหน้าที่ระบบรองรับ
  // พนักงานที่ผู้ใช้คนนี้มีสิทธิ์เห็น — ระบบเดิมไม่ได้จำกัดรายแผนก จึงคงพฤติกรรมเดิมไว้ทั้งหมด
  /* แผนกในหน้ารายงาน: อ่านจากตาราง departments จริงผ่าน njhr_emp_departments
     (เดิมอ่านจาก db.employees ใน localStorage ทำให้ชื่อแผนกไม่ตรงกับระบบ)
     เก็บไว้ในตัวแปรระดับโมดูลเพราะ viewReports วาดแบบ synchronous */
  // ค้นหาชื่อ/นามสกุล/ชื่อเล่น/รหัส/คำนำหน้า+ชื่อ/แผนก — บางส่วนของคำก็เจอ
  // พนักงานที่ผ่านตัวกรอง (สิทธิ์ → แผนก → พนักงานที่เลือก/คำค้น)
  // นาทีมาสาย: อ้างกะจริงของใบลงเวลานั้น + Grace Period เดิมของระบบ (สูตรเดียวกับ REPORT)
  // นาทีทำงานจริง: ออก − เข้า (รองรับกะข้ามวัน) · ข้อมูลไม่ครบคืน null (ไม่คำนวณมั่ว ไม่ติดลบ)

  /* แถวรายงานชุดเดียวที่ใช้ทั้งหน้าจอและ Excel
     กันซ้ำด้วย Employee ID + วันที่ (เข้าแรกสุด / ออกล่าสุด) */
  /* ---------- Service กลางของรายงานการลา / วันลาคงเหลือ ----------
     ทั้งตารางบนหน้าจอและ Export Excel เรียกฟังก์ชันชุดเดียวกัน จึงไม่มีทางได้ยอดคนละชุด */

  // แปลงผลลัพธ์ (พนักงาน × ประเภทลา) ให้เป็น 1 พนักงาน 1 แถว + คอลัมน์ตามประเภทลาแบบ Dynamic

  /* รายงาน OT — รายการงาน 1 รายการ = 1 แถว (เลขที่คำขอซ้ำได้ แต่ลำดับรายการต้องต่างกัน)
     แผนก/ตำแหน่ง ใช้ค่าที่ Snapshot ไว้ตอนยื่นคำขอ เพื่อให้รายงานย้อนหลังไม่เปลี่ยนตามข้อมูลปัจจุบัน */
  // Excel เพิ่ม "ชื่อไฟล์แนบ" และ "หมายเหตุรวม" ตามสเปก

  // 8 คอลัมน์ตายตัว — จำนวนชั่วโมง/นาที เปลี่ยนความหมายตามประเภทรายงาน
  // enum attendance_status จริง 5 ค่า


  // โหลดรายงานการลา / วันลาคงเหลือ จาก Supabase แล้ววาดเฉพาะตาราง + ข้อความสรุป
  // ดึงรายงานลงเวลา/มาสายจากตาราง attendance จริง
  /* In-flight dedup — viewReports ถูกเรียกซ้ำหนึ่งครั้งหลัง rptLoadDepts โหลดแผนกเสร็จ
     ทำให้ njhr_att_report ยิงซ้ำด้วย parameter เดียวกัน ผลรอบแรกถูก seq guard ทิ้งเสมอ
     ถ้ามี request ที่ parameter เหมือนกันค้างอยู่ ให้ใช้ Promise เดิมร่วมกัน
     RPC นี้เป็นแบบอ่านอย่างเดียว ไม่มี side effect · ไม่ได้ cache ผลลัพธ์ข้ามรอบ
     เมื่อ settle แล้วล้างทิ้งทันที รอบถัดไปจึงได้ข้อมูลสดเสมอ */
  // แปลงผลจากเซิร์ฟเวอร์ให้เข้ารูปแบบเดิมของตาราง (ไม่ต้องแก้ rptCells/Export)


  /* ---------- Export Excel (.xlsx จริง สร้างด้วย JSZip ที่ระบบมีอยู่แล้ว) ---------- */
  // แปลงเลขคอลัมน์เป็นตัวอักษรแบบ Excel: 0=A … 25=Z, 26=AA, 27=AB …
  // เดิมรองรับแค่ A–Z ทำให้ไฟล์ที่มีเกิน 26 คอลัมน์ได้ cell reference ผิด แล้วเปิดไฟล์ไม่ได้



  // โหลดเฉพาะ JSZip ที่ต้องใช้จริง (ไม่ดึงไลบรารีอื่นมาโดยไม่จำเป็น)

  /* Export รายงานการลา / วันลาคงเหลือ — ใช้ข้อมูลชุดเดียวกับที่แสดงบนหน้าจอ (ไม่ query ใหม่คนละชุด) */


  function ssoEditModal(r, el) {
    openModal('ตั้งค่าประกันสังคม',
      '<div class="doc-empinfo"><b>' + esc(r.emp_code || '') + ' · ' + esc(r.full_name || '') + '</b>' +
      '<small>' + esc(r.department_name || '—') + ' · ' + esc(r.position_name || '—') + '</small></div>' +
      '<form id="sso-ef" novalidate style="margin-top:10px">' +
      '<label class="check"><input type="checkbox" id="sso-f-on"' +
      (r.sso_enabled === false ? '' : ' checked') + '><span>เข้าประกันสังคม</span></label>' +
      '<div class="form-2col" id="sso-f-wrap">' +
      '<label class="field"><span>วิธีคำนวณ</span><select id="sso-f-mode">' +
      '<option value="AUTO"' + (r.sso_base_mode === 'MANUAL' ? '' : ' selected') + '>AUTO — คำนวณอัตโนมัติ</option>' +
      '<option value="MANUAL"' + (r.sso_base_mode === 'MANUAL' ? ' selected' : '') + '>MANUAL — กำหนดฐานเอง</option>' +
      '</select></label>' +
      '<label class="field" id="sso-f-basewrap"><span>ฐานค่าจ้างที่กำหนดเอง (บาท)</span>' +
      '<input type="number" id="sso-f-base" min="0" step="0.01" value="' +
      (r.sso_custom_base == null ? '' : esc(String(r.sso_custom_base))) + '"></label></div>' +
      '<p class="muted note" id="sso-f-hint"></p>' +
      '<div class="form-2col">' +
      '<label class="field"><span>วันที่เริ่มใช้</span><input type="date" id="sso-f-eff" value="' +
      esc(String(r.sso_effective_date || '').slice(0, 10)) + '"></label>' +
      '<label class="field"><span>หมายเหตุ</span><input id="sso-f-note" value="' +
      esc(r.sso_note || '') + '"></label></div>' +
      '<div class="bal-grid" style="margin-top:8px">' +
      '<div class="bal-item"><div class="bal-top"><span>ฐานปัจจุบัน</span><b>' + money(r.sso_base) + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>ลูกจ้าง</span><b>' + money(r.amount_employee) + '</b></div></div>' +
      '<div class="bal-item"><div class="bal-top"><span>นายจ้าง</span><b>' + money(r.amount_employer) + '</b></div></div></div>' +
      '<div class="form-error" id="sso-eerr" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="ssoe-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="ssoe-save">บันทึก</button>');

    ssoBindForm();
    document.getElementById('ssoe-cancel').onclick = closeModal;
    document.getElementById('ssoe-save').onclick = function () {
      var btn = this, eb = document.getElementById('sso-eerr');
      var mode = document.getElementById('sso-f-mode');
      var baseEl = document.getElementById('sso-f-base');
      eb.textContent = '';
      if (mode.value === 'MANUAL') {
        var bv = Number(baseEl.value);
        if (!isFinite(bv) || bv < 0) { eb.textContent = 'โหมด MANUAL ต้องระบุฐานตั้งแต่ 0.00 ขึ้นไป'; return; }
      }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_sso_emp_save', ssoFormPayload(r.employee_id))
        .then(function () {
          closeModal(); toast('บันทึกข้อมูลประกันสังคมแล้ว');
          viewSSO(el);                       // โหลดใหม่จาก Supabase · ตารางอัปเดตทันที
        })
        .catch(function (ex) {
          btn.disabled = false; btn.innerHTML = 'บันทึก';
          eb.textContent = (ex && ex.message) || 'บันทึกไม่สำเร็จ';
        });
    };
  }



