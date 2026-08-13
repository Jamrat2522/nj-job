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

  /* ============================================================
     คำขอ OT ของฉัน (#/ot) — ข้อมูลจริงจาก Supabase
       รายการ      njhr_ot_list  (p_mine = true → เห็นเฉพาะของตนเองทุก Role)
       รายละเอียด  njhr_ot_get   (ผ่าน NJHR.features.requestDetail ตัวเดิม)
       ยกเลิกคำขอ  njhr_ot_decide(p_action = 'CANCEL')  — RPC เขียน Audit + Notification เอง

     เดิมอ่าน db.ots ใน localStorage ซึ่งเครื่องอื่นมองไม่เห็นและไม่เคยถึงฐานข้อมูล
     ตอนนี้ Supabase เป็นแหล่งเดียว — db.ots ที่ค้างอยู่เป็นข้อมูลทดสอบและถูกล้างทิ้ง
     เมื่อเปิดหน้านี้ (otPurgeLocalOts) ไม่มีการนำมาปนกับรายการจาก RPC
     ⚠ ห้าม fallback ไป db.ots เมื่อ RPC ล้มเหลว — แสดงข้อความผิดพลาดแทน

     คอลัมน์ "ประเภท" ใช้ is_holiday จาก njhr_ot_list (OT ปกติ / OT วันหยุด)
     ชุดเดียวกับหน้า REPORT OT — njhr_ot_list ไม่คืนประเภทงานรายรายการ (อยู่ที่ njhr_ot_jobs)
     ดูประเภทงานรายรายการได้ที่ปุ่มดูรายละเอียด ซึ่งอ่านจาก njhr_ot_get
     ============================================================ */
  var otSbRows = null, otErr = '', otSeq = 0, otBusy = false;

  function otHM(v) { return String(v == null ? '' : v).slice(0, 5); }
  function otNum(v) { var n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : 0; }
  function otReqNo(o) { return String(o.request_no || o.id || ''); }
  function otKind(o) { return o.is_holiday ? 'OT วันหยุด' : 'OT ปกติ'; }

  /* จำนวนชั่วโมง — ใช้ค่า ot_hours ที่ระบบบันทึกไว้ ไม่คำนวณใหม่จากเวลาเริ่ม/สิ้นสุด
     ไม่มีค่า = — (ไม่แสดง undefined / null / 0 ที่ไม่ใช่ค่าจริง) */
  function otHoursTxt(o) {
    var raw = o.ot_hours;
    if (raw === null || raw === undefined || raw === '') return '—';
    var n = Number(raw);
    if (!isFinite(n)) return '—';
    return (Math.round(n * 100) / 100) + ' ชั่วโมง';
  }

  /* ประเภทงานของ "รายการงานที่ 1" เท่านั้น
     njhr_ot_list ไม่คืนประเภทงาน (อยู่ในตาราง njhr_ot_jobs) จึงอ่านเพิ่มด้วย njhr_ot_get
     แล้วเก็บลง otJtMap โดยเลือกแถวที่ job_no น้อยที่สุด = รายการที่ 1
     ไม่มีข้อมูลจริง = — ไม่เดาค่า ไม่ใช้รายการที่ 2 หรือรายการสุดท้าย */
  var otJtMap = {};

  function otFirstJobType(o) {
    var v = otJtMap[String(o.id)];
    return (v === undefined || v === null || v === '') ? '—' : v;
  }

  function otLoadJobTypes(rows) {
    var need = (rows || []).filter(function (o) {
      return otJtMap[String(o.id)] === undefined && (Number(o.jobs_count) || 0) > 0;
    });
    if (!need.length) return Promise.resolve();
    return Promise.all(need.map(function (o) {
      return sbRpc('njhr_ot_get', { p_token: sbToken(), p_id: o.id }).then(function (r) {
        var d = (r && r.data) ? r.data : r;
        var js = (d && d.jobs) || [];
        var first = null;
        js.forEach(function (j) {
          var no = Number(j.no);
          if (!isFinite(no)) return;
          if (!first || no < Number(first.no)) first = j;
        });
        otJtMap[String(o.id)] = (first && String(first.job_type || '').trim()) || '';
      })['catch'](function (er) {
        console.error('[OT] njhr_ot_get (ประเภทงาน) ล้มเหลว:', er);
        otJtMap[String(o.id)] = '';     // อ่านไม่ได้ = แสดง — ไม่เดาค่า
      });
    }));
  }

  /* ---------- ตารางเดียวเฉพาะ Desktop (.only-desktop) ----------
     <thead> และ <tbody> อยู่ในตารางเดียวกัน · ทุกแถวตรงกับหัวคอลัมน์
     Mobile View เดิม (.req-card.only-mobile) อยู่ครบด้านล่าง ไม่ถูกแตะแม้แต่บรรทัดเดียว
     ปุ่มใช้ data-detail / data-cancel ตัวเดิม Handler จึงเป็นของเดิมทั้งหมด */
  function otDeskTable(rows) {
    return '<div class="card p0 only-desktop lvt-wrap"><table class="lvt lvt-ot">' +
      '<thead><tr>' +
      '<th>เลขคำขอ</th><th>ชื่อพนักงาน</th><th>ประเภท</th><th>ประเภทงาน</th><th>วันที่</th>' +
      '<th>ช่วงเวลา</th><th>จำนวนชั่วโมง</th><th>ไฟล์แนบ</th><th>สถานะ</th>' +
      '<th class="lvt-act-h"></th>' +
      '</tr></thead><tbody>' +
      rows.map(function (o) { return otDeskRow(o); }).join('') +
      '</tbody></table></div>';
  }

  /* ชื่อผู้ขอ OT — ตรรกะเดียวกับ apOtShape() ในหน้าอนุมัติ (empFullName)
     ไม่มีข้อมูลจริงจึงแสดง — ไม่เดาและไม่สร้างชื่อขึ้นเอง */
  function otWho(o) {
    var full = String((o.prefix || '') + (o.emp_name || '')).trim();
    return full || '—';
  }

  function otDeskRow(o) {
    var fileN = Number(o.files_count) || 0;
    return '<tr>' +
      '<td class="lvt-c-no"><b>' + esc(otReqNo(o)) + '</b></td>' +
      /* ชื่อพนักงาน — ประกอบจาก prefix + emp_name ที่ njhr_ot_list ส่งมาอยู่แล้ว
         ⚠ ต่างจากตารางลางาน: RPC ของ OT คืน prefix กับ emp_name แยกกัน
            (65_ot.sql:187 · emp_name = first_name + ' ' + last_name ไม่มีคำนำหน้า)
         หน้าอนุมัติ OT ประกอบแบบเดียวกันนี้อยู่แล้ว จึงใช้ตรรกะเดิม ไม่แก้ SQL/RPC */
      '<td class="lvt-c-emp"><b>' + esc(otWho(o)) + '</b></td>' +
      /* ประเภท — บรรทัดเดียว ไม่แสดงจำนวนรายการงานอีก (ดูได้ที่ปุ่มดูรายละเอียด) */
      '<td class="lvt-c-type"><b>' + esc(otKind(o)) + '</b></td>' +
      /* ประเภทงาน — ของ "รายการงานที่ 1" เท่านั้น ไม่รวมหลายรายการ ไม่ใช้รายการอื่น */
      '<td class="lvt-c-jt"><b>' + esc(otFirstJobType(o)) + '</b></td>' +
      '<td class="lvt-c-date"><b>' + fmtDateDMY(o.ot_date) + '</b></td>' +
      /* ช่วงเวลา — แสดงเฉพาะเวลา ไม่มีจำนวนชั่วโมงซ้ำใต้บรรทัด */
      '<td class="lvt-c-time"><b>' + esc(otHM(o.start_time)) + ' – ' + esc(otHM(o.end_time)) +
      (o.spans_next_day ? ' (+1 วัน)' : '') + '</b></td>' +
      /* จำนวนชั่วโมง — ใช้ ot_hours ที่บันทึกไว้แล้ว ไม่คำนวณใหม่ */
      '<td class="lvt-c-hrs"><b>' + esc(otHoursTxt(o)) + '</b></td>' +
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

  function otMobileCard(o) {
    var jobN = Number(o.jobs_count) || 0, fileN = Number(o.files_count) || 0;
    return '<div class="card req-card only-mobile">' +
      '<div class="req-top">' + avatarHTML(o.emp_name || '', 40) + '<div class="grow"><b>' + fmtDateDMY(o.ot_date) + '</b><small>' + esc(otReqNo(o)) + '</small></div>' + statusBadge(o.status) + '</div>' +
      '<div class="req-body"><span class="chip chip-info">' + esc(otHM(o.start_time)) + ' – ' + esc(otHM(o.end_time)) + '</span><span><b>' + otNum(o.ot_hours) + '</b> ชั่วโมง</span></div>' +
      '<p class="req-reason">' + esc(o.reason || '') +
      (jobN ? ' · <span class="chip">' + jobN + ' รายการงาน</span>' : '') +
      (fileN ? ' <span class="chip">' + fileN + ' ไฟล์</span>' : '') + '</p>' +
      '<div class="req-actions"><button class="btn btn-ghost btn-sm" data-detail="' + esc(o.id) + '">รายละเอียด / Timeline</button>' +
      (o.status === 'PENDING' ? '<button class="btn btn-ghost btn-sm t-red" data-cancel="' + esc(o.id) + '">ยกเลิกคำขอ</button>' : '') + '</div></div>';
  }

  /* ---------- ยกเลิกคำขอ — njhr_ot_decide เท่านั้น ----------
     RPC ตรวจสิทธิ์ (เจ้าของหรือผู้ดูแล) · เขียน Audit · แจ้งเตือนเจ้าของคำขอให้เอง
     จึงไม่แก้สถานะใน db.ots และไม่เรียก audit()/notify() ซ้ำที่ Frontend */
  function otCancel(id, el) {
    var row = (otSbRows || []).find(function (x) { return String(x.id) === String(id); });
    confirmDialog('ยกเลิกคำขอ', 'ต้องการยกเลิกคำขอ <b>' + esc(row ? otReqNo(row) : id) + '</b> ใช่หรือไม่',
      'ยกเลิกคำขอ', function () {
        if (otBusy) return; otBusy = true;
        return sbRpc('njhr_ot_decide', { p_token: sbToken(), p_id: id, p_action: 'CANCEL', p_note: null })
          .then(function () {
            otBusy = false; closeModal();
            toast('ยกเลิกคำขอแล้ว', 'info');
            refreshOtPending();          // สถานะเปลี่ยน → นับ Badge ใหม่ (ไม่ยิงตอน render)
            viewOT(el);
          })['catch'](function (er) {
            otBusy = false; closeModal();
            console.error('[OT] njhr_ot_decide (CANCEL) ล้มเหลว:', er);
            toast((er && er.message) || 'ยกเลิกคำขอไม่สำเร็จ', 'error');
          });
      }, true);
  }

  function otLoad(el) {
    var seq = ++otSeq;
    otSbRows = null; otErr = '';
    otPaint(el);
    if (!sbReady() || !sbToken()) {
      otSbRows = []; otErr = 'ยังไม่ได้เชื่อมต่อ Supabase — โหลดคำขอ OT ไม่ได้'; otPaint(el); return;
    }
    sbRpcList('njhr_ot_list', {
      p_token: sbToken(), p_from: null, p_to: null, p_status: otFilter || null,
      p_dept: null, p_employee: null, p_q: null, p_mine: true, p_limit: 200, p_offset: 0
    }).then(function (rows) {
      if (seq !== otSeq) return;
      var list = rows || [];
      /* อ่านประเภทงานของรายการที่ 1 ให้ครบก่อนค่อยวาด เพื่อไม่ให้คอลัมน์กระพริบ */
      return otLoadJobTypes(list).then(function () {
        if (seq !== otSeq) return;
        otSbRows = list; otErr = '';
        otPaint(el);
      });
    })['catch'](function (er) {
      if (seq !== otSeq) return;
      otSbRows = []; 
      console.error('[OT] njhr_ot_list ล้มเหลว:', er);
      otErr = 'โหลดคำขอ OT จาก Supabase ไม่สำเร็จ: ' + ((er && er.message) || er);
      otPaint(el);
    });
  }

  function otPaint(el) {
    var box = document.getElementById('ot-list');
    if (!box) return;
    var eb = document.getElementById('ot-err');
    if (eb) eb.textContent = otErr || '';
    if (otSbRows === null) {
      box.innerHTML = '<div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div>';
      return;
    }
    box.innerHTML = otSbRows.length
      ? (otDeskTable(otSbRows) + otSbRows.map(otMobileCard).join(''))
      : '<div class="card">' + emptyState(otErr ? 'ไม่สามารถแสดงข้อมูลได้' : 'ยังไม่มีคำขอ OT') + '</div>';

    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-detail],[data-cancel]') : null;
      if (!b || !box.contains(b)) return;
      if (b.dataset.cancel) { otCancel(b.dataset.cancel, el); return; }
      // รายละเอียดอ่านจาก njhr_ot_get ผ่าน Module เดิม (โหลดเมื่อกดเท่านั้น)
      otOpenAction('request-detail', b, function () {
        NJHR.features.requestDetail.open('OT', b.dataset.detail, el);
      });
    };
  }

  function viewOT(el) {
    var e = currentEmp();
    if (!e) { el.innerHTML = emptyState('บัญชีนี้ไม่ได้ผูกกับพนักงาน'); return; }

    el.innerHTML =
      '<div class="toolbar"><h3>คำขอ OT ของฉัน</h3>' +
      '<select id="ot-filter"><option value="">ทุกสถานะ</option>' + ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(function (st) {
        return '<option value="' + st + '"' + (otFilter === st ? ' selected' : '') + '>' + { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิกแล้ว' }[st] + '</option>';
      }).join('') + '</select>' +
      '<span class="grow"></span><button class="btn btn-primary" id="ot-new">' + icon('plus') + ' ขอ OT</button></div>' +
      '<div class="req-list" id="ot-list"></div>' +
      '<div class="form-error" id="ot-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('ot-filter').onchange = function () { otFilter = this.value; viewOT(el); };
    // Runtime Split — แบบฟอร์มขอ OT อยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('ot-new').onclick = function () {
      otOpenAction('ot-form', this, function () { NJHR.features.otForm.open(el); });
    };
    otLoad(el);
    otPurgeLocalOts();
  }

  /* ---------- ล้างข้อมูล OT ทดสอบที่ค้างในเบราว์เซอร์ ----------
     หน้า OT อ่านรายการจาก Supabase (njhr_ot_list) อย่างเดียวแล้ว
     db.ots เป็นของเหลือจากระบบเดิมซึ่งเป็นข้อมูลทดสอบ ผู้ใช้สั่งให้ลบได้

     ⚠ ลบเฉพาะคีย์ ots ภายในก้อนข้อมูลของแอป (njhr_db_v3) เท่านั้น
        ไม่ล้าง Storage ทั้งก้อน และไม่แตะคีย์อื่น
        Session · Token · Settings · ข้อมูลโมดูลอื่น จึงไม่ได้รับผลกระทบ
     ⚠ ไม่ยุ่งกับข้อมูลใน Supabase — เป็นการล้างฝั่งเบราว์เซอร์ล้วน ๆ */
  function otPurgeLocalOts() {
    if (!db.ots || !db.ots.length) return;
    var n = db.ots.length;
    db.ots.length = 0;          // ล้างในหน่วยความจำ
    saveDB();                   // เขียนทับเฉพาะก้อน njhr_db_v3 คีย์อื่นไม่ถูกแตะ
    try { console.info('[OT] ล้างข้อมูล OT ทดสอบในเบราว์เซอร์แล้ว ' + n + ' รายการ'); } catch (e) {}
  }


  var OT_JOB_TYPES = ['ตรวจปล่อย', 'คีย์ใบขน', 'คีย์ + ตรวจปล่อย'];








