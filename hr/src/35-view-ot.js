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
      '<div class="req-list">' + (mine.length ? mine.map(function (o) {
        return '<div class="card req-card">' +
          '<div class="req-top">' + avatarHTML(empName(o.empId), 40) + '<div class="grow"><b>' + fmtDate(o.date) + '</b><small>' + esc(o.id) + '</small></div>' + statusBadge(o.status) + '</div>' +
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
      }).join('') : '<div class="card">' + emptyState('ยังไม่มีคำขอ OT') + '</div>') + '</div>';

    document.getElementById('ot-filter').onchange = function () { otFilter = this.value; viewOT(el); };
    // Runtime Split — แบบฟอร์มขอ OT อยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('ot-new').onclick = function () {
      otOpenAction('ot-form', this, function () { NJHR.features.otForm.open(el); });
    };
    el.querySelectorAll('[data-detail]').forEach(function (b) { b.onclick = function () { showTimeline('ot', this.dataset.detail); }; });
    bindReqCardActions(el, 'ot');
  }

  var OT_JOB_TYPES = ['ตรวจปล่อย', 'คีย์ใบขน', 'คีย์ + ตรวจปล่อย'];








