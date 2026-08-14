(function () {
  'use strict';
  var S = window.NJHR && NJHR.compat && NJHR.compat.scope;
  if (!S) throw new Error('RUNTIME_NOT_READY');
  var icon = S.icon;
  var pad = S.pad;
  var todayISO = S.todayISO;
  var fmtDate = S.fmtDate;
  var fmtMonthYear = S.fmtMonthYear;
  var esc = S.esc;
  var holLoad = S.holLoad;
  var holInvalidate = S.holInvalidate;
  var dept = S.dept;
  var currentUser = S.currentUser;
  var audit = S.audit;
  var toast = S.toast;
  var openModal = S.openModal;
  var closeModal = S.closeModal;
  var withButtonLoading = S.withButtonLoading;
  var confirmDialog = S.confirmDialog;
  var sbRpcList = S.sbRpcList;
  var sbRpc = S.sbRpc;
  var sbToken = S.sbToken;
  var doLogout = S.doLogout;
  var emptyState = S.emptyState;
  var TH_DAYS = S.TH_DAYS;
  var ALL = S.ALL;
  var rptBuildXlsx = S.rptBuildXlsx;
  var rptLoadZip = S.rptLoadZip;
  var rptDateBE = S.rptDateBE;
/* ============================================================
   17-view-calendar.js — ปฏิทินองค์กร (ย้ายมาจาก 12 ตามเดิมทุกบรรทัด)
   แยกเป็น Lazy Module ของตัวเอง ใช้ Pattern เดียวกับ attendance / leave / ot
   ไม่มีการแก้ตรรกะ · ไม่มีการคัดลอก Utility ซ้ำ (ใช้ของ core/shared เดิม)
   ============================================================ */
  /* ================= VIEW: CALENDAR =================
     ข้อมูลจริงจาก Supabase ทั้งหมด ผ่าน RPC ตัวเดียวของหน้านี้โดยเฉพาะ
       แผนก + วันหยุด + ลา(APPROVED) + OT(APPROVED) → njhr_calendar_month
                                        (supabase-new/N1_calendar_rpc.sql)
     RPC ตัวนี้ตรวจ Session ฝั่งเซิร์ฟเวอร์เองและจำกัด app_code='salary'
     ไม่ผ่าน njhr_emp_guard / njhr_rpt_guard ทุก Role (SUPER_ADMIN/ADMIN/USER)
     จึงเปิดปฏิทินได้และเห็นข้อมูลชุดเดียวกัน — สิทธิ์หน้ารายงานและทะเบียนพนักงานไม่เปลี่ยน
     เดิมเรียก 4 RPC พร้อมกัน (njhr_dept_list / njhr_holiday_list / njhr_leave_report /
     njhr_ot_list) ตัวใดตัวหนึ่งถูกปฏิเสธสิทธิ์ทำให้ทั้งหน้าล้ม
     ไม่อ่าน db.departments / db.holidays / db.leaves / db.ots / localStorage
     และไม่มีชื่อแผนก Hardcode · ค่าใน dropdown เป็น Department UUID
     Supabase error = แสดง Error State ห้ามย้อนกลับไปใช้ข้อมูลเก่า
     การจัดการวันหยุด (ADMIN/SUPER_ADMIN) ยังใช้ njhr_holiday_* เดิมทุกตัว */
  var calState = { m: null, y: null, dept: '', mode: 'month', seq: 0,
                   depts: [], leaves: [], ots: [],
                   holSet: Object.create(null), holLabel: Object.create(null),
                   err: '', loading: false };
  function calCanManage() { return ['SUPER_ADMIN', 'HR'].indexOf(currentUser().role) >= 0; }
  function calDeptName(id) {
    for (var i = 0; i < calState.depts.length; i++) if (calState.depts[i].id === id) return calState.depts[i].name;
    return '';
  }

  /* โหลดแผนก + วันหยุด + ลา + OT ของเดือนที่แสดงด้วย RPC ปฏิทินตัวเดียว
     ตัวกรองแผนกส่งเป็น Department UUID ตรง ๆ (RPC กรองด้วย employees.department_id)
     seq กันข้อมูลเดือนเก่ามาทับเดือนใหม่เมื่อกดเปลี่ยนเดือนเร็ว ๆ */
  function calLoad(el) {
    var seq = ++calState.seq;
    var s = calState;
    var from = s.y + '-' + pad(s.m + 1) + '-01';
    var to = s.y + '-' + pad(s.m + 1) + '-' + pad(new Date(s.y, s.m + 1, 0).getDate());
    s.loading = true; s.err = '';
    return sbRpc('njhr_calendar_month', {
      p_token: sbToken(), p_from: from, p_to: to, p_dept: s.dept || null
    }).then(function (r) {
      if (seq !== calState.seq) return;
      if (!r) return;                 // คำสั่งอ่านถูกยกเลิกเพราะเปลี่ยนหน้า — ไม่ใช่ข้อขัดข้อง
      s.depts = r.departments || [];
      // แผนกที่ถูกลบไปแล้วต้องไม่ค้างอยู่ในตัวกรอง
      if (s.dept && !calDeptName(s.dept)) s.dept = '';
      var hs = Object.create(null), hn = Object.create(null);
      (r.holidays || []).forEach(function (h) {
        var d = String(h.holiday_date || '').slice(0, 10);
        if (d) { hs[d] = 1; hn[d] = h.name || ''; }
      });
      s.holSet = hs; s.holLabel = hn;
      s.leaves = r.leaves || [];
      s.ots = r.ot || [];
      s.loading = false;
      calRender(el);
    })['catch'](function (ex) {
      if (seq !== calState.seq) return;
      s.loading = false;
      // Session หมดอายุ → ใช้ Flow ออกจากระบบเดิม ไม่แสดงข้อมูลค้าง
      if (ex && /เซสชัน/.test(String(ex.message || ''))) { doLogout(true); return; }
      // ไม่แสดงข้อความสิทธิ์/ข้อความภายในของฐานข้อมูลให้ผู้ใช้เห็น
      s.err = 'ไม่สามารถโหลดปฏิทินองค์กรได้ กรุณาลองใหม่';
      s.depts = []; s.leaves = []; s.ots = [];
      s.holSet = Object.create(null); s.holLabel = Object.create(null);
      calRender(el);
    });
  }

  function viewCalendar(el) {
    var now = new Date();
    if (calState.m === null) { calState.m = now.getMonth(); calState.y = now.getFullYear(); }
    el.innerHTML = '<div class="card"><div class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดข้อมูลจาก Supabase…</div></div>';
    calLoad(el);
  }

  function calRender(el) {
    var s = calState, mm = pad(s.m + 1);

    if (s.err) {
      el.innerHTML =
        '<div class="toolbar">' +
        '<button class="btn-icon" id="cal-prev" aria-label="เดือนก่อนหน้า" title="เดือนก่อนหน้า">' + icon('chevL') + '</button>' +
        '<h3>' + fmtMonthYear(s.m + 1, s.y) + '</h3>' +
        '<button class="btn-icon" id="cal-next" aria-label="เดือนถัดไป" title="เดือนถัดไป">' + icon('chevR') + '</button></div>' +
        '<div class="card"><div class="ot-warn"><b>' + esc(s.err) + '</b></div>' +
        '<p class="muted note">ปฏิทินอ่านข้อมูลจาก Supabase เท่านั้น จึงไม่แสดงข้อมูลเดิมที่ค้างในเครื่อง</p>' +
        '<button class="btn btn-primary btn-sm" id="cal-retry">ลองใหม่</button></div>';
      document.getElementById('cal-prev').onclick = function () { s.m--; if (s.m < 0) { s.m = 11; s.y--; } viewCalendar(el); };
      document.getElementById('cal-next').onclick = function () { s.m++; if (s.m > 11) { s.m = 0; s.y++; } viewCalendar(el); };
      document.getElementById('cal-retry').onclick = function () { viewCalendar(el); };
      return;
    }

    /* เหตุการณ์ของวัน — วันหยุด/ลา/OT มาจาก njhr_calendar_month ชุดเดียวเท่านั้น
       ไม่อ่าน holCache กลางหรือ db.holidays เพื่อไม่ให้ข้อมูลค้างในเครื่องปนเข้ามา */
    function eventsOf(isoStr) {
      var ev = [];
      if (s.holSet[isoStr]) ev.push({ t: 'hol', txt: s.holLabel[isoStr] || 'วันหยุด' });
      s.leaves.forEach(function (l) {
        var st = String(l.start_date || '').slice(0, 10), en = String(l.end_date || '').slice(0, 10);
        if (st && en && st <= isoStr && en >= isoStr) {
          ev.push({ t: 'leave', txt: (l.display_name || '') + ' ลา' });
        }
      });
      s.ots.forEach(function (o) {
        if (String(o.ot_date || '').slice(0, 10) === isoStr) {
          ev.push({ t: 'ot', txt: (o.display_name || '') + ' OT' });
        }
      });
      return ev;
    }

    var body = '';
    if (s.mode === 'month') {
      var first = new Date(s.y, s.m, 1).getDay(), days = new Date(s.y, s.m + 1, 0).getDate();
      var cells = '';
      for (var i = 0; i < first; i++) cells += '<div class="cal-cell empty-cell"></div>';
      for (var d = 1; d <= days; d++) {
        var isoStr = s.y + '-' + mm + '-' + pad(d);
        var ev = eventsOf(isoStr);
        cells += '<div class="cal-cell' + (isoStr === todayISO() ? ' today' : '') + '"><span class="cal-d">' + d + '</span>' +
          ev.slice(0, 3).map(function (x) { return '<span class="cal-ev ev-' + x.t + '">' + esc(x.txt) + '</span>'; }).join('') +
          (ev.length > 3 ? '<span class="cal-ev ev-more">+' + (ev.length - 3) + '</span>' : '') + '</div>';
      }
      body = '<div class="cal-head-row">' + TH_DAYS.map(function (x) { return '<span>' + x + '</span>'; }).join('') +
             '</div><div class="cal-grid">' + cells + '</div>';
    } else {
      var listRows = [];
      for (var d2 = 1; d2 <= new Date(s.y, s.m + 1, 0).getDate(); d2++) {
        var iso2 = s.y + '-' + mm + '-' + pad(d2);
        eventsOf(iso2).forEach(function (x) { listRows.push({ date: iso2, ev: x }); });
      }
      body = listRows.length ? '<div class="list">' + listRows.map(function (r) {
        return '<div class="list-row"><span class="chip ' + (r.ev.t === 'hol' ? 'chip-bad' : r.ev.t === 'ot' ? 'chip-info' : 'chip-ok') + '">' +
          fmtDate(r.date) + '</span><div class="grow">' + esc(r.ev.txt) + '</div></div>';
      }).join('') + '</div>' : emptyState('เดือนนี้ไม่มีรายการ');
    }

    el.innerHTML =
      '<div class="toolbar">' +
      '<button class="btn-icon" id="cal-prev" aria-label="เดือนก่อนหน้า" title="เดือนก่อนหน้า">' + icon('chevL') + '</button><h3>' + fmtMonthYear(s.m + 1, s.y) + '</h3>' +
      '<button class="btn-icon" id="cal-next" aria-label="เดือนถัดไป" title="เดือนถัดไป">' + icon('chevR') + '</button>' +
      // USER/ADMIN เห็นเฉพาะวันหยุด จึงไม่แสดงตัวกรองแผนก
      (['SUPER_ADMIN', 'HR'].indexOf(currentUser().role) >= 0
        ? '<select id="cal-dept" aria-label="เลือกแผนก"><option value="">ทุกแผนก</option>' +
          s.depts.map(function (dd) {
            return '<option value="' + esc(dd.id) + '"' + (s.dept === dd.id ? ' selected' : '') + '>' +
              esc(dd.name) + (dd.code ? ' (' + esc(dd.code) + ')' : '') + '</option>';
          }).join('') + '</select>'
        : '') +
      '<span class="grow"></span><div class="seg">' +
      '<button class="seg-btn' + (s.mode === 'month' ? ' active' : '') + '" id="cal-mv">เดือน</button>' +
      '<button class="seg-btn' + (s.mode === 'list' ? ' active' : '') + '" id="cal-lv">รายการ</button></div>' +
      (calCanManage() ? '<button class="btn btn-primary btn-sm" id="cal-hol">' + icon('calendar') + ' จัดการวันหยุด</button>' : '') + '</div>' +
      '<div class="card">' + body + '</div>' +
      '<div class="legend"><span class="cal-ev ev-hol">วันหยุดบริษัท</span>' +
      (['SUPER_ADMIN', 'HR'].indexOf(currentUser().role) >= 0
        ? '<span class="cal-ev ev-leave">ลางาน</span><span class="cal-ev ev-ot">OT</span>' : '') +
      '<span class="muted cal-src" id="cal-src"></span></div>';

    document.getElementById('cal-prev').onclick = function () { s.m--; if (s.m < 0) { s.m = 11; s.y--; } viewCalendar(el); };
    document.getElementById('cal-next').onclick = function () { s.m++; if (s.m > 11) { s.m = 0; s.y++; } viewCalendar(el); };
    var calDept = document.getElementById('cal-dept');
    if (calDept) calDept.onchange = function () { s.dept = this.value; calLoad(el); };
    document.getElementById('cal-mv').onclick = function () { s.mode = 'month'; calRender(el); };
    document.getElementById('cal-lv').onclick = function () { s.mode = 'list'; calRender(el); };
    var src = document.getElementById('cal-src');
    if (src) src.textContent = ['SUPER_ADMIN', 'HR'].indexOf(currentUser().role) >= 0
      ? ('แผนก ' + s.depts.length + ' · ลา ' + s.leaves.length + ' · OT ' + s.ots.length + ' รายการ — ข้อมูลจากฐานข้อมูลกลาง')
      : 'แสดงเฉพาะวันหยุดของบริษัท';
    if (calCanManage()) document.getElementById('cal-hol').onclick = function () { calHolidays(el); };
  }

  /* ---------- วันหยุดราชการ: วางรายการ → Preview → Apply ----------
     ชุดต้นทางอยู่ใน njhr_gov_holidays · ปฏิทินจริงอยู่ใน holidays (ตารางเดิม)
     Apply แตะเฉพาะ source='GOVERNMENT' ของปีนั้น — วันหยุดบริษัทไม่มีทางหาย
     ทุกอย่างเก็บใน SQL ไม่ใช้ localStorage · สิทธิ์เฉพาะ SUPER_ADMIN (ตรวจซ้ำฝั่งเซิร์ฟเวอร์) */
  function calIsSuper() { return currentUser().role === 'SUPER_ADMIN'; }

  var CH_ACT_CLS = { NEW: 'badge-ok', UPDATE: 'badge-warn', SAME: 'badge-mut',
                     REMOVE: 'badge-bad', EXCLUDED: 'badge-mut', KEEP_COMPANY: 'badge-info' };

  // ฟอร์มวางรายการวันหยุดราชการของปี — รับข้อความหลายบรรทัด "วันที่<TAB|,>ชื่อ"
  function chPasteForm(el) {
    var year = parseInt(document.getElementById('ch-year').value, 10);
    openModal('วางรายการวันหยุดราชการ · ปี ' + (year + 543),
      '<p class="muted note" style="margin-top:0">วางจากประกาศราชการได้ทั้งตาราง ' +
      'หนึ่งบรรทัดต่อหนึ่งวัน รูปแบบ <b>วันที่</b> เว้นวรรค/Tab/จุลภาค แล้วตามด้วย <b>ชื่อวันหยุด</b><br>' +
      'วันที่รับได้ทั้ง <code>2027-01-01</code> · <code>01/01/2027</code> · <code>01/01/2570</code> (พ.ศ.)<br>' +
      'รายการนี้เป็น<b>ชุดต้นทาง</b> ยังไม่เข้าปฏิทินจนกว่าจะกด “โหลดวันหยุดราชการ”</p>' +
      '<label class="field"><span>รายการวันหยุด</span>' +
      '<textarea id="chp-txt" rows="10" placeholder="วางได้ทั้งตาราง เช่น&#10;| 18 | **23 ต.ค. 2569** | ศุกร์ | วันปิยมหาราช |&#10;หรือ&#10;23 ต.ค. 2569 วันปิยมหาราช"></textarea></label>' +
      '<div id="chp-prev"></div>' +
      '<div class="form-error" id="chp-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="chp-cancel">ยกเลิก</button>' +
      '<button class="btn btn-ghost" id="chp-check">ตรวจรายการ</button>' +
      '<button class="btn btn-primary" id="chp-save">บันทึกชุดต้นทาง</button>', { wide: true });

    document.getElementById('chp-cancel').onclick = function () { closeModal(); calHolidays(el, year); };
    document.getElementById('chp-check').onclick = function () {
      var pr = chParsePaste(document.getElementById('chp-txt').value, year);
      chShowParsed(pr, 'อ่านได้ ' + pr.items.length + ' รายการ · ข้าม Formatting ' +
        pr.skipped + ' บรรทัด · อ่านไม่ได้จริง ' + pr.bad.length + ' บรรทัด');
      var e2 = document.getElementById('chp-err');
      e2.textContent = pr.bad.length ? 'อ่านไม่ได้: ' + pr.bad.slice(0, 5).join(' · ') : '';
      var sv = document.getElementById('chp-save');
      if (sv) delete sv.dataset.confirmed;
    };
    document.getElementById('chp-save').onclick = function () {
      var eb = document.getElementById('chp-err'), btn = this;
      eb.textContent = '';
      var parsed = chParsePaste(document.getElementById('chp-txt').value, year);
      var sum = 'อ่านได้ ' + parsed.items.length + ' รายการ · ข้าม Formatting ' +
                parsed.skipped + ' บรรทัด · อ่านไม่ได้จริง ' + parsed.bad.length + ' บรรทัด';
      chShowParsed(parsed, sum);
      if (!parsed.items.length) {
        eb.textContent = sum + (parsed.bad.length ? ' — ' + parsed.bad.slice(0, 3).join(' · ') : '');
        return;
      }
      if (parsed.bad.length) {
        eb.textContent = sum + ' — ' + parsed.bad.slice(0, 3).join(' · ') +
          ' · กดอีกครั้งเพื่อบันทึกเฉพาะรายการที่อ่านได้';
        if (!btn.dataset.confirmed) { btn.dataset.confirmed = '1'; return; }
      }
      withButtonLoading(btn, 'กำลังบันทึก…', function () {
        return sbRpc('njhr_gov_holiday_set',
          { p_token: sbToken(), p_year: year, p_items: parsed.items }).then(function (r) {
          if (!r || !r.ok) { eb.textContent = (r && r.message) || 'บันทึกไม่สำเร็จ'; return; }
          closeModal(); calHolidays(el, year); toast(r.message, 'success');
        });
      })['catch'](function (e) { eb.textContent = (e && e.message) || 'บันทึกไม่สำเร็จ'; });
    };
  }

  /* แปลงข้อความที่วางเป็นรายการ — รองรับ พ.ศ. และ DD/MM/YYYY
     ทำฝั่งหน้าจอเพื่อบอกบรรทัดที่ผิดได้ทันที · SQL ตรวจซ้ำอีกชั้นและตัดรายการคนละปีทิ้ง */
  // แสดงผลการอ่านให้เห็นก่อนบันทึก (ไม่แตะฐานข้อมูล)
  function chShowParsed(parsed, summary) {
    var box = document.getElementById('chp-prev');
    if (!box) return;
    box.innerHTML = '<p class="muted note" style="margin:10px 0 6px"><b>' + esc(summary) + '</b></p>' +
      (parsed.items.length
        ? '<div class="table-wrap" style="max-height:220px;overflow:auto"><table><thead><tr>' +
          '<th>วันที่</th><th>ชื่อวันหยุด</th></tr></thead><tbody>' +
          parsed.items.map(function (x) {
            return '<tr><td><b>' + rptDateBE(x.date) + '</b></td><td>' + esc(x.name) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '');
  }

  /* ---------- ตัวอ่านข้อความที่วาง ----------
     รองรับการ Copy ตารางมาวางทั้งก้อน โดยไม่ต้องแก้ Markdown ด้วยมือ
     รูปแบบวันที่ที่อ่านได้:
       2026-10-23 · 23/10/2026 · 23/10/2569 · 23 ต.ค. 2569 · 23 ตุลาคม 2569
     รูปแบบบรรทัดที่อ่านได้:
       "23 ต.ค. 2569 วันปิยมหาราช"
       "| 18 | **23 ต.ค. 2569** | ศุกร์ | วันปิยมหาราช |"
     แก้เฉพาะชั้นอ่านข้อความ — ไม่แตะ Preview / Apply / GOVERNMENT / COMPANY / excluded */

  var CH_TH_MONTH = {
    'ม.ค.': 1, 'มกราคม': 1, 'มค': 1,
    'ก.พ.': 2, 'กุมภาพันธ์': 2, 'กพ': 2,
    'มี.ค.': 3, 'มีนาคม': 3, 'มีค': 3,
    'เม.ย.': 4, 'เมษายน': 4, 'เมย': 4,
    'พ.ค.': 5, 'พฤษภาคม': 5, 'พค': 5,
    'มิ.ย.': 6, 'มิถุนายน': 6, 'มิย': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7, 'กรกฏาคม': 7, 'กค': 7,
    'ส.ค.': 8, 'สิงหาคม': 8, 'สค': 8,
    'ก.ย.': 9, 'กันยายน': 9, 'กย': 9,
    'ต.ค.': 10, 'ตุลาคม': 10, 'ตค': 10,
    'พ.ย.': 11, 'พฤศจิกายน': 11, 'พย': 11,
    'ธ.ค.': 12, 'ธันวาคม': 12, 'ธค': 12
  };
  var CH_TH_DOW = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

  function chMonthTH(v) {
    var t = String(v || '').trim();
    if (CH_TH_MONTH[t]) return CH_TH_MONTH[t];
    var k = t.replace(/[.\s]/g, '');            // "ต.ค." → "ตค"
    return CH_TH_MONTH[k] || 0;
  }

  /* ลอก Formatting ออกจากบรรทัด แล้วคืนช่อง (cell) ที่ใช้งานได้
     คืน null = บรรทัดนี้เป็น Formatting ล้วน ไม่นับเป็นข้อผิดพลาด */
  function chCleanLine(raw) {
    var t = String(raw == null ? '' : raw);
    t = t.replace(/[\u2022\u25CF\u25AA]/g, ' ');                    // bullet
    t = t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ' ');          // emoji (surrogate pair)
    t = t.replace(/[\u2190-\u21FF\u2600-\u27BF\uFE0F\u2B00-\u2BFF]/g, ' ');
    t = t.replace(/\*+/g, ' ').replace(/`+/g, ' ').replace(/_{2,}/g, ' ');
    t = t.replace(/\u00A0/g, ' ');                                  // non-breaking space
    t = t.trim();
    if (!t) return null;
    if (/^[|\-\s:+=_#>]*$/.test(t)) return null;                    // เส้นคั่น / header ว่าง

    var cells;
    if (t.indexOf('|') >= 0) {
      cells = t.split('|');
    } else if (t.indexOf('\t') >= 0) {
      cells = t.split('\t');
    } else {
      cells = [t];
    }
    cells = cells.map(function (c) { return c.trim(); })
                 .filter(function (c) { return c !== ''; });
    if (!cells.length) return null;
    // หัวตารางของ Markdown เช่น "ลำดับ | วันที่ | วัน | ชื่อวันหยุด"
    if (cells.length >= 2 && /^(ลำดับ|ที่|no\.?|#)$/i.test(cells[0]) &&
        /^(วันที่|date)$/i.test(cells[1])) return null;
    return cells;
  }

  /* หา "วันที่" จากข้อความ — คืน {iso, rest} หรือ null
     rest = ข้อความที่เหลือหลังตัดส่วนวันที่ออก (ใช้เป็นชื่อวันหยุดเมื่อไม่ได้มาเป็นตาราง) */
  function chFindDate(text, year) {
    var t = String(text || '').trim();
    var m;

    // 1) 2026-10-23
    m = t.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?!\d)/);
    if (m && m[1].length === 4 && +m[1] > 1900) {
      var iso1 = chFixBE(+m[1], +m[2], +m[3]);
      if (iso1) return { iso: iso1, rest: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
    }
    // 2) 23/10/2026 · 23/10/2569 · 23-10-2569 · 23.10.2569
    m = t.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?!\d)/);
    if (m) {
      var iso2 = chFixBE(+m[3], +m[2], +m[1]);
      if (iso2) return { iso: iso2, rest: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
    }
    // 3) 23 ต.ค. 2569 · 23 ตุลาคม 2569 · 23 ต.ค. 26
    m = t.match(/(\d{1,2})\s*([\u0E01-\u0E4E]{1,3}\.[\u0E01-\u0E4E]{1,3}\.|[\u0E01-\u0E4E]+)\s*(\d{2,4})/);
    if (m) {
      var mo = chMonthTH(m[2]);
      if (mo) {
        var yy = +m[3];
        if (yy < 100) yy += (yy > 50 ? 2400 : 2500);      // "69" → 2569
        var iso3 = chFixBE(yy, mo, +m[1]);
        if (iso3) return { iso: iso3, rest: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
      }
    }
    // 4) 23 ต.ค. (ไม่มีปี — ใช้ปีที่เลือกบนหน้าจอ)
    m = t.match(/(\d{1,2})\s*([\u0E01-\u0E4E]{1,3}\.[\u0E01-\u0E4E]{1,3}\.|[\u0E01-\u0E4E]+)(?!\s*\d)/);
    if (m) {
      var mo4 = chMonthTH(m[2]);
      if (mo4) {
        var iso4 = chFixBE(year, mo4, +m[1]);
        if (iso4) return { iso: iso4, rest: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
      }
    }
    // 5) 23/10 (ไม่มีปี)
    m = t.match(/(\d{1,2})[\/.\-](\d{1,2})(?![\d\/.\-])/);
    if (m) {
      var iso5 = chFixBE(year, +m[2], +m[1]);
      if (iso5) return { iso: iso5, rest: (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).trim() };
    }
    return null;
  }

  // ตัดสิ่งที่ไม่ใช่ชื่อวันหยุดออก: เลขลำดับล้วน · ชื่อวันในสัปดาห์
  function chIsNoise(cell) {
    var t = String(cell || '').trim();
    if (!t) return true;
    if (/^\d{1,3}[.)]?$/.test(t)) return true;                       // เลขลำดับ
    var d = t.replace(/^วัน/, '').trim();
    return CH_TH_DOW.indexOf(d) >= 0 || CH_TH_DOW.indexOf(t) >= 0;   // ศุกร์ / วันศุกร์
  }

  function chParsePaste(txt, year) {
    var items = [], bad = [], skipped = 0, byDate = {}, order = [];

    String(txt || '').split(/\r?\n/).forEach(function (line, i) {
      var cells = chCleanLine(line);
      if (cells === null) { if (String(line).trim()) skipped++; return; }

      var iso = null, name = '';

      if (cells.length >= 2) {
        // มาเป็นตาราง: หาช่องที่เป็นวันที่ ที่เหลือ (ตัด noise) คือชื่อวันหยุด
        var di = -1;
        for (var k = 0; k < cells.length; k++) {
          var f = chFindDate(cells[k], year);
          if (f) { di = k; iso = f.iso; break; }
        }
        if (di >= 0) {
          var parts = [];
          for (var j = 0; j < cells.length; j++) {
            if (j === di || chIsNoise(cells[j])) continue;
            parts.push(cells[j]);
          }
          name = parts.join(' ').trim();          // ชื่อหลายชื่อคั่นด้วย / เก็บไว้ทั้งหมด
        }
      }

      if (!iso) {
        // ไม่ใช่ตาราง: หาวันที่จากทั้งบรรทัด แล้วที่เหลือคือชื่อ
        var one = chFindDate(cells.join(' '), year);
        if (!one) { bad.push('บรรทัด ' + (i + 1)); return; }
        iso = one.iso;
        name = one.rest;
      }

      // เก็บกวาดชื่อ: ตัดตัวคั่นหัวท้ายและเลขลำดับที่ค้างอยู่หน้า
      name = String(name || '').replace(/^[\s,;:\-–—|]+/, '').replace(/[\s,;:\-–—|]+$/, '');
      name = name.replace(/^\d{1,3}[.)]\s*/, '').trim();
      if (!name) { bad.push('บรรทัด ' + (i + 1) + ' (ไม่มีชื่อวันหยุด)'); return; }

      // วันซ้ำ — บรรทัดล่าสุดชนะ
      if (byDate[iso] === undefined) { order.push(iso); }
      byDate[iso] = name.slice(0, 200);
    });

    order.forEach(function (d) { items.push({ date: d, name: byDate[d] }); });
    items.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    return { items: items, bad: bad, skipped: skipped };
  }

  // ปี พ.ศ. (มากกว่า 2400) แปลงเป็น ค.ศ. · ตรวจวันที่จริงด้วย UTC กันเลื่อนเขตเวลา
  function chFixBE(y, mo, d) {
    if (y > 2400 && y < 2800) y -= 543;
    if (!(y >= 1900 && y <= 2200)) return null;
    if (!(mo >= 1 && mo <= 12) || !(d >= 1 && d <= 31)) return null;
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return y + '-' + pad(mo) + '-' + pad(d);
  }

  // Preview ก่อนบันทึก — RPC นี้อ่านอย่างเดียว ยังไม่เขียนอะไร
  function chGovPreview(btn, el) {
    var year = parseInt(document.getElementById('ch-year').value, 10);
    withButtonLoading(btn, 'กำลังตรวจสอบ…', function () {
      return sbRpcList('njhr_gov_holiday_preview', { p_token: sbToken(), p_year: year })
        .then(function (rows) { chGovModal(year, rows || [], el); });
    })['catch'](function (e) {
      var eb = document.getElementById('ch-err');
      if (eb) eb.textContent = (e && e.message) || 'ตรวจสอบไม่สำเร็จ';
    });
  }

  function chGovModal(year, rows, el) {
    var n = { NEW: 0, UPDATE: 0, SAME: 0, REMOVE: 0, EXCLUDED: 0, KEEP_COMPANY: 0 };
    rows.forEach(function (r) { if (n[r.action] !== undefined) n[r.action]++; });
    openModal('โหลดวันหยุดราชการ · ปี ' + (year + 543),
      (!rows.length
        ? '<div class="ot-warn"><b>ยังไม่มีชุดวันหยุดราชการของปีนี้</b><br>' +
          'กด “วางรายการวันหยุด” เพื่อใส่ชุดต้นทางก่อน</div>'
        : '<div class="bal-grid">' +
          [['เพิ่มใหม่', n.NEW], ['อัปเดต', n.UPDATE], ['ไม่เปลี่ยน', n.SAME],
           ['ถอนออก', n.REMOVE], ['ข้าม', n.EXCLUDED + n.KEEP_COMPANY]]
            .map(function (x) {
              return '<div class="bal-item"><div class="bal-top"><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>';
            }).join('') + '</div>' +
          '<p class="muted note">วันหยุดที่บริษัทเพิ่มเอง และวันที่บริษัทเคยลบออก จะไม่ถูกแตะ</p>' +
          '<div class="table-wrap" style="max-height:320px;overflow:auto"><table><thead><tr>' +
          '<th>วันที่</th><th>ชื่อวันหยุด</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead><tbody>' +
          rows.map(function (r) {
            var d = String(r.holiday_date).slice(0, 10);
            return '<tr><td><b>' + rptDateBE(d) + '</b></td><td>' + esc(r.name || '') + '</td>' +
              '<td><span class="badge ' + (CH_ACT_CLS[r.action] || 'badge-mut') + '">' +
              esc(r.action_th || r.action) + '</span></td>' +
              '<td><small class="muted">' + esc(r.note || '') + '</small></td></tr>';
          }).join('') + '</tbody></table></div>') +
      '<div class="form-error" id="chg-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="chg-cancel">ยกเลิก</button>' +
      (rows.length ? '<button class="btn btn-primary" id="chg-go">ยืนยันโหลดวันหยุด</button>' : ''),
      { wide: true });

    document.getElementById('chg-cancel').onclick = function () { closeModal(); calHolidays(el, year); };
    var go = document.getElementById('chg-go');
    if (!go) return;
    go.onclick = function () {
      var eb = document.getElementById('chg-err');
      eb.textContent = '';
      withButtonLoading(this, 'กำลังบันทึก…', function () {
        return sbRpc('njhr_gov_holiday_apply', { p_token: sbToken(), p_year: year }).then(function (r) {
          if (!r || !r.ok) { eb.textContent = (r && r.message) || 'โหลดไม่สำเร็จ'; return; }
          closeModal(); calHolidays(el, year);       // กลับหน้าจัดการวันหยุด + โหลดตารางใหม่ทันที
          toast(r.message + ' · เพิ่ม ' + r.added + ' · อัปเดต ' + r.updated +
                ' · ถอน ' + r.removed + ' · ข้าม ' + r.skipped, 'success');
        });
      })['catch'](function (e) { eb.textContent = (e && e.message) || 'โหลดไม่สำเร็จ'; });
    };
  }

  /* Export Excel — ดึงจาก SQL ชุดเดียวกับที่แสดงบนหน้าจอ ตามปีที่เลือก */
  function chExport(btn) {
    var year = parseInt(document.getElementById('ch-year').value, 10);
    var eb = document.getElementById('ch-err');
    if (eb) eb.textContent = '';
    withButtonLoading(btn, 'กำลังสร้างไฟล์…', function () {
      return sbRpcList('njhr_holiday_list', {
        p_token: sbToken(), p_from: year + '-01-01', p_to: year + '-12-31'
      }).then(function (rows) {
        if (!rows || !rows.length) { throw new Error('ปี ' + (year + 543) + ' ยังไม่มีวันหยุด'); }
        return rptLoadZip().then(function () {
          return rptBuildXlsx('วันหยุด ' + (year + 543),
            ['วันที่', 'วัน', 'ชื่อวันหยุด', 'แหล่งที่มา'],
            rows.map(function (h) {
              return [rptDateBE(String(h.holiday_date).slice(0, 10)), h.dow_th, h.name, h.source_th];
            }), [14, 12, 34, 12]);
        });
      }).then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'วันหยุด_' + (year + 543) + '.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        audit('EXPORT', 'Export วันหยุดปี ' + (year + 543));
        toast('ดาวน์โหลดวันหยุดปี ' + (year + 543) + ' แล้ว');
      });
    })['catch'](function (e) { if (eb) eb.textContent = (e && e.message) || 'สร้างไฟล์ไม่สำเร็จ'; });
  }

  /* ---------- จัดการวันหยุดบริษัท (ตาราง holidays เดิม) ---------- */
  function calHolidays(el, keepYear) {
    var year = keepYear || calState.y;
    openModal('จัดการวันหยุดบริษัท',
      /* แถบเครื่องมือแถวเดียว — ลำดับ: ปี · โหลดวันหยุดราชการ · วางรายการวันหยุด · เพิ่มวันหยุด · Export Excel
         ปุ่มทั้งหมดเป็น id เดิมทุกตัว Handler ไม่เปลี่ยน */
      '<div class="toolbar dp-filters ch-tools"><label class="field" style="margin:0"><span>ปี</span>' +
      '<select id="ch-year">' + (function () {
        var o = '';
        for (var y = year - 2; y <= year + 2; y++) o += '<option value="' + y + '"' + (y === year ? ' selected' : '') + '>' + (y + 543) + '</option>';
        return o;
      })() + '</select></label>' +
      (calIsSuper()
        ? '<button class="btn btn-ghost btn-sm" id="ch-gov">' + icon('download') + ' โหลดวันหยุดราชการ</button>' +
          '<button class="btn btn-ghost btn-sm" id="ch-paste">' + icon('edit') + ' วางรายการวันหยุด</button>'
        : '') +
      '<button class="btn btn-primary btn-sm" id="ch-add">' + icon('plus') + ' เพิ่มวันหยุด</button>' +
      '<button class="btn btn-ghost btn-sm" id="ch-export">' + icon('download') + ' Export Excel</button></div>' +
      '<div class="ot-warn" id="ch-impact"></div>' +
      '<div id="ch-list"><div class="ep-state"><span class="spinner"></span> กำลังโหลด…</div></div>' +
      '<div class="form-error" id="ch-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="ch-close">ปิด</button>', { wide: true });

    document.getElementById('ch-close').onclick = function () { closeModal(); viewCalendar(el); };
    document.getElementById('ch-year').onchange = function () { year = parseInt(this.value, 10); load(); };
    document.getElementById('ch-add').onclick = function () { form(null); };
    document.getElementById('ch-export').onclick = function () { chExport(this); };
    if (calIsSuper()) {
      document.getElementById('ch-gov').onclick = function () { chGovPreview(this, el); };
      document.getElementById('ch-paste').onclick = function () { chPasteForm(el); };
    }
    load();

    function load() {
      var box = document.getElementById('ch-list');
      box.innerHTML = '<div class="ep-state"><span class="spinner"></span> กำลังโหลด…</div>';
      document.getElementById('ch-err').textContent = '';
      sbRpcList('njhr_holiday_list', {
        p_token: sbToken(), p_from: year + '-01-01', p_to: year + '-12-31'
      }).then(function (rows) {
        box.innerHTML = rows.length
          ? '<div class="table-wrap"><table class="ch-table"><thead><tr><th>วันที่</th><th>วัน</th><th>ชื่อวันหยุด</th><th class="ch-act-h">จัดการ</th></tr></thead><tbody>' +
            rows.map(function (h) {
              var d = String(h.holiday_date).slice(0, 10);
              return '<tr><td><b>' + rptDateBE(d) + '</b></td>' +
                '<td>' + esc(h.dow_th) + (h.is_weekend ? ' <small class="muted">(เสาร์-อาทิตย์อยู่แล้ว)</small>' : '') + '</td>' +
                '<td>' + esc(h.name) + '</td>' +
                '<td class="ch-act-c"><span class="ch-act">' +
                '<button class="btn-icon" data-ch-edit="' + esc(h.id) + '" data-ch-d="' + esc(d) +
                '" data-ch-n="' + esc(h.name) + '" aria-label="แก้ไข">' + icon('edit') + '</button>' +
                (calIsSuper() ? '<button class="btn-icon ic-red" data-ch-del="' + esc(h.id) + '" data-ch-n="' + esc(h.name) +
                  '" aria-label="ลบ">' + icon('x') + '</button>' : '') + '</span></td></tr>';
            }).join('') + '</tbody></table></div>'
          : emptyState('ปี ' + (year + 543) + ' ยังไม่ได้กำหนดวันหยุด');
        box.onclick = function (ev) {
          var b = ev.target.closest ? ev.target.closest('[data-ch-edit],[data-ch-del]') : null;
          if (!b) return;
          if (b.dataset.chEdit) form({ id: b.dataset.chEdit, date: b.dataset.chD, name: b.dataset.chN });
          else del(b.dataset.chDel, b.dataset.chN);
        };
        // ผลกระทบต่อการนับวันทำงานของระบบลา (คำนวณจากเซิร์ฟเวอร์ ไม่ใช้สูตรใหม่)
        sbRpc('njhr_holiday_impact', { p_token: sbToken(), p_year: year }).then(function (im) {
          var w = document.getElementById('ch-impact');
          if (w && im) w.textContent = 'ปี ' + (year + 543) + ': วันหยุด ' + im.holidays_count +
            ' วัน · วันทำงานทั้งปี ' + im.workdays + ' วัน · ใบลาที่เกี่ยวข้อง ' + im.leave_requests_in_year + ' ใบ' +
            ' — แก้วันหยุดแล้วการนับวันลาและประเภทวันของ OT เปลี่ยนตามทันที';
        }).catch(function () { });
      }).catch(function (er) {
        box.innerHTML = '';
        document.getElementById('ch-err').textContent = er.message || 'โหลดวันหยุดไม่สำเร็จ';
      });
    }

    function form(h) {
      openModal(h ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด',
        '<form id="chf" novalidate><div class="form-2col">' +
        '<label class="field"><span>วันที่ <i class="req">*</i></span>' +
        '<input type="date" name="hol_date" value="' + esc(h ? h.date : (year + '-01-01')) + '"></label>' +
        '<label class="field"><span>ชื่อวันหยุด <i class="req">*</i></span>' +
        '<input name="hol_name" value="' + esc(h ? h.name : '') + '" placeholder="เช่น วันขึ้นปีใหม่"></label></div>' +
        '<p class="muted note">วันหยุดนี้จะถูกใช้ร่วมกับระบบลา OT และ REPORT ALL ทันที</p>' +
        '<div class="form-error" id="chf-err" role="alert"></div></form>',
        '<button class="btn btn-ghost" id="chf-cancel">ยกเลิก</button><button class="btn btn-primary" id="chf-save">บันทึก</button>');
      document.getElementById('chf-cancel').onclick = function () { closeModal(); calHolidays(el, year); };
      document.getElementById('chf-save').onclick = function () {
        var btn = this, fm = document.getElementById('chf');
        function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? String(x.value).trim() : ''; }
        var err = document.getElementById('chf-err');
        err.textContent = '';
        if (!fv('hol_date')) { err.textContent = 'กรุณาเลือกวันที่'; return; }
        if (!fv('hol_name')) { err.textContent = 'กรุณาระบุชื่อวันหยุด'; return; }
        if (btn.disabled) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
        sbRpc('njhr_holiday_save', {
          p_token: sbToken(), p_id: (h && h.id) || null, p_name: fv('hol_name'), p_date: fv('hol_date')
        }).then(function (r) {
          holInvalidate();
          return holLoad(true).then(function () {
            closeModal();
            toast((h ? 'แก้ไขวันหยุดแล้ว: ' : 'เพิ่มวันหยุดแล้ว: ') + r.name);
            calHolidays(el, year);
          });
        }).catch(function (er) {
          btn.disabled = false; btn.innerHTML = 'บันทึก';
          err.textContent = er.message || 'บันทึกไม่สำเร็จ';
        });
      };
    }

    function del(id, name) {
      if (!calIsSuper()) { document.getElementById('ch-err').textContent = 'เฉพาะ SUPER_ADMIN เท่านั้นที่ลบวันหยุดได้'; return; }
      confirmDialog('ลบวันหยุด',
        'ลบวันหยุด <b>' + esc(name) + '</b> ใช่หรือไม่<br>' +
        '<small class="muted">การนับวันลาและประเภทวันของ OT จะเปลี่ยนตามทันที</small>',
        'ลบวันหยุด', function () {
          return sbRpc('njhr_holiday_delete', { p_token: sbToken(), p_id: id }).then(function () {
            holInvalidate();
            return holLoad(true).then(function () { toast('ลบวันหยุดแล้ว', 'info'); calHolidays(el, year); });
          }).catch(function (er) {
            document.getElementById('ch-err').textContent = er.message || 'ลบไม่สำเร็จ';
          });
        }, true);
    }
  }

  /* ================= VIEW: ANNOUNCEMENTS ================= */


  NJHR.views.register('viewCalendar', viewCalendar);
})();
