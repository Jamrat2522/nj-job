  /* ================= OT (#/ot) =================
     ย้ายมาจาก 10-view-requests-leave-ot.js โดยไม่แก้เนื้อใน ================= */
  var otFilter = '';

  /* ---------- ตัวโหลด Action Module (หน้า OT) ----------
     กันกดซ้ำ · ตรวจ session และ Navigation ID ก่อนเปิด · ไม่เปิดของเก่าหลังเปลี่ยนหน้า */
  function otOpenAction(mod, btn, fn) {
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

  /* ---------- ตารางเดียวเฉพาะ Desktop (.only-desktop) ----------
     <thead> และ <tbody> อยู่ในตารางเดียวกัน · ทุกแถวตรงกับหัวคอลัมน์
     Mobile View เดิม (.req-card.only-mobile) อยู่ครบด้านล่าง ไม่ถูกแตะแม้แต่บรรทัดเดียว
     ปุ่มใช้ data-detail / data-cancel ตัวเดิม Handler จึงเป็นของเดิมทั้งหมด */
  function otDeskTable(rows) {
    return '<div class="card p0 only-desktop lvt-wrap"><table class="lvt lvt-ot">' +
      '<thead><tr>' +
      '<th>เลขคำขอ</th><th>ประเภท</th><th>วันที่</th><th>ช่วงเวลา</th>' +
      '<th>ไฟล์แนบ</th><th>สถานะ</th><th class="lvt-act-h"></th>' +
      '</tr></thead><tbody>' +
      rows.map(function (o) { return otDeskRow(o); }).join('') +
      '</tbody></table></div>';
  }

  function otDeskRow(o) {
    var jobN = (o.jobs && o.jobs.length) ? o.jobs.length : 0;
    var fileN = (o.jobs || []).reduce(function (n, j) { return n + (j.files ? j.files.length : 0); }, 0) +
                (o.file ? 1 : 0);
    /* ประเภท = ประเภทงาน OT ที่บันทึกไว้จริงในแต่ละรายการงาน (ไม่ซ้ำ) ไม่มีการเดาค่า */
    var types = [];
    (o.jobs || []).forEach(function (j) {
      var t = String(j.jobType || '').trim();
      if (t && types.indexOf(t) < 0) types.push(t);
    });
    return '<tr>' +
      '<td class="lvt-c-no"><b>' + esc(o.no || o.id) + '</b></td>' +
      '<td class="lvt-c-type"><b>' + (types.length ? esc(types.join(', ')) : '—') + '</b>' +
      '<small>' + (jobN ? jobN + ' รายการงาน' : 'ไม่มีรายการงาน') + '</small></td>' +
      '<td class="lvt-c-date"><b>' + fmtDate(o.date) + '</b></td>' +
      '<td class="lvt-c-time"><b>' + esc(o.start) + ' – ' + esc(o.end) + '</b>' +
      '<small>' + esc(String(o.hours)) + ' ชั่วโมง</small></td>' +
      '<td class="lvt-c-file">' + (fileN
        ? '<span class="lvt-file">' + icon('paperclip', 'ic-sm') + '<span>' + fileN + ' ไฟล์</span></span>'
        : '<span class="muted">ไม่มีไฟล์แนบ</span>') + '</td>' +
      '<td class="lvt-c-st">' + statusBadge(o.status) + '</td>' +
      '<td class="lvt-c-act"><div class="lvt-acts">' +
      '<button type="button" class="btn-icon lv-eye" data-detail="' + esc(o.id) + '" ' +
      'aria-label="ดูรายละเอียด" title="ดูรายละเอียด">' + icon('eye') + '</button>' +
      (o.status === 'PENDING'
        ? '<button class="btn btn-ghost btn-sm t-red" data-cancel="' + esc(o.id) + '">ยกเลิกคำขอ</button>' : '') +
      '</div></td></tr>';
  }

  function viewOT(el) {
    var e = currentEmp();
    if (!e) { el.innerHTML = emptyState('บัญชีนี้ไม่ได้ผูกกับพนักงาน'); return; }
    var mine = db.ots.filter(function (o) { return o.empId === e.id && (!otFilter || o.status === otFilter); })
      .sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });

    el.innerHTML =
      '<div class="toolbar"><h3>คำขอ OT ของฉัน</h3>' +
      '<select id="ot-filter"><option value="">ทุกสถานะ</option>' + ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(function (st) {
        return '<option value="' + st + '"' + (otFilter === st ? ' selected' : '') + '>' + { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิกแล้ว' }[st] + '</option>';
      }).join('') + '</select>' +
      '<span class="grow"></span><button class="btn btn-primary" id="ot-new">' + icon('plus') + ' ขอ OT</button></div>' +
      '<div class="req-list">' + (mine.length ? (otDeskTable(mine) + mine.map(function (o) {
        return '<div class="card req-card only-mobile">' +
          '<div class="req-top">' + avatarHTML(empName(o.empId), 40) + '<div class="grow"><b>' + fmtDate(o.date) + '</b><small>' + esc(o.no || o.id) + '</small></div>' + statusBadge(o.status) + '</div>' +
          '<div class="req-body"><span class="chip chip-info">' + o.start + ' – ' + o.end + '</span><span><b>' + o.hours + '</b> ชั่วโมง</span></div>' +
          '<p class="req-reason">' + esc(o.reason) +
          (o.note ? ' · หมายเหตุ: ' + esc(o.note) : '') +
          // คำขอเก่าที่บันทึกไว้ก่อนหน้ายังมี task/file ระดับคำขอ — ยังแสดงต่อเหมือนเดิม
          (o.task ? ' · งาน: ' + esc(o.task) : '') + (o.file ? ' · ' + icon('fileText', 'ic-sm') + ' ' + esc(o.file) : '') +
          (o.jobs && o.jobs.length ? ' · <span class="chip">' + o.jobs.length + ' รายการงาน</span>' +
            (o.jobs.reduce(function (n, j) { return n + (j.files ? j.files.length : 0); }, 0)
              ? ' <span class="chip">' + o.jobs.reduce(function (n, j) { return n + (j.files ? j.files.length : 0); }, 0) + ' ไฟล์</span>' : '') : '') + '</p>' +
          '<div class="req-actions"><button class="btn btn-ghost btn-sm" data-detail="' + o.id + '">รายละเอียด / Timeline</button>' +
          (o.status === 'PENDING' ? '<button class="btn btn-ghost btn-sm t-red" data-cancel="' + o.id + '">ยกเลิกคำขอ</button>' : '') + '</div></div>';
      }).join('')) : '<div class="card">' + emptyState('ยังไม่มีคำขอ OT') + '</div>') + '</div>';

    document.getElementById('ot-filter').onchange = function () { otFilter = this.value; viewOT(el); };
    // Runtime Split — แบบฟอร์มขอ OT อยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('ot-new').onclick = function () {
      otOpenAction('ot-form', this, function () { NJHR.features.otForm.open(el); });
    };
    el.querySelectorAll('[data-detail]').forEach(function (b) { b.onclick = function () { showTimeline('ot', this.dataset.detail); }; });
    bindReqCardActions(el, 'ot');
  }

  var OT_JOB_TYPES = ['ตรวจปล่อย', 'คีย์ใบขน', 'คีย์ + ตรวจปล่อย'];








