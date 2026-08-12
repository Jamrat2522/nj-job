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
     ⚠ db.ots เดิมยังคงอยู่ครบ ไม่ถูกลบและไม่ถูกล้าง — ใช้เป็นข้อมูลตั้งต้นสำหรับ
       ย้ายเข้าฐานข้อมูลด้วย njhr_ot_migrate ที่การ์ด "ข้อมูล OT เดิมในเครื่องนี้"
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
    var jobN = Number(o.jobs_count) || 0;
    var fileN = Number(o.files_count) || 0;
    return '<tr>' +
      '<td class="lvt-c-no"><b>' + esc(otReqNo(o)) + '</b></td>' +
      '<td class="lvt-c-type"><b>' + esc(otKind(o)) + '</b>' +
      '<small>' + (jobN ? jobN + ' รายการงาน' : 'ไม่มีรายการงาน') + '</small></td>' +
      '<td class="lvt-c-date"><b>' + fmtDateDMY(o.ot_date) + '</b></td>' +
      '<td class="lvt-c-time"><b>' + esc(otHM(o.start_time)) + ' – ' + esc(otHM(o.end_time)) +
      (o.spans_next_day ? ' (+1 วัน)' : '') + '</b>' +
      '<small>' + esc(String(otNum(o.ot_hours))) + ' ชั่วโมง</small></td>' +
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
      otSbRows = rows || []; otErr = '';
      otPaint(el);
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
      '<div class="form-error" id="ot-err" role="alert" style="white-space:pre-line"></div>' +
      '<div id="ot-mig"></div>';

    document.getElementById('ot-filter').onchange = function () { otFilter = this.value; viewOT(el); };
    // Runtime Split — แบบฟอร์มขอ OT อยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('ot-new').onclick = function () {
      otOpenAction('ot-form', this, function () { NJHR.features.otForm.open(el); });
    };
    otLoad(el);
    otMigrateCard(el);
  }

  /* ---------- ข้อมูล OT เดิมที่ยังค้างในเครื่องนี้ ----------
     ไม่ลบ ไม่ล้าง ไม่แปลงอัตโนมัติ — แสดงจำนวนและเปิดทางให้ย้ายเข้าฐานข้อมูล
     ด้วย njhr_ot_migrate ที่มีอยู่แล้ว (65_ot.sql) โดยผู้ดูแลเป็นผู้กดเอง
     รูปแบบเดียวกับการ์ดย้ายข้อมูลลงเวลาที่หน้า #/attendance */
  function otLocalRows() {
    var e = currentEmp();
    return (db.ots || []).filter(function (o) { return o && o.date && (!e || o.empId === e.id); });
  }

  function otMigrateCard(el) {
    var box = document.getElementById('ot-mig');
    if (!box) return;
    var rows = otLocalRows();
    if (!rows.length) { box.innerHTML = ''; return; }
    box.innerHTML =
      '<div class="card"><div class="ot-warn">พบคำขอ OT เดิมที่ยังอยู่ในเบราว์เซอร์เครื่องนี้ <b>' +
      rows.length + ' รายการ</b> — ข้อมูลนี้เครื่องอื่นมองไม่เห็นและยังไม่อยู่ในฐานข้อมูล ' +
      'กรุณาแจ้งผู้ดูแลระบบเพื่อย้ายเข้าฐานข้อมูล (ระบบไม่ลบข้อมูลนี้ให้อัตโนมัติ)</div>' +
      '<div class="toolbar"><span class="grow"></span>' +
      '<button class="btn btn-ghost" id="otmig-export">ดาวน์โหลดข้อมูลเดิม (.json)</button></div></div>';
    document.getElementById('otmig-export').onclick = function () {
      /* ส่งออกข้อมูล OT เดิม "ให้ครบที่สุดเท่าที่มีในเครื่อง" ก่อนตัดสินใจย้าย
         โครงไฟล์แบ่ง 2 ชั้น
           migrate  = ชุดที่ njhr_ot_migrate รับได้ตรง ๆ (p_rows)
           legacy   = ข้อมูลที่ RPC ยังไม่รองรับ แต่ห้ามให้หาย
                      เลขคำขอเดิม · Timeline · ผู้อนุมัติ · เวลาอนุมัติ · หมายเหตุ · ไฟล์แนบ
         ⚠ njhr_ot_migrate ปัจจุบันไม่รักษา request_no เดิมและไม่รับ Timeline
            จึงยัง DO NOT IMPORT — ไฟล์นี้คือหลักฐานก่อนย้าย
         คัดลอกค่าจาก Source เดิมตรง ๆ ไม่แปลง ไม่เดา ไม่เติมค่าที่ไม่มี */
      var e = currentEmp();
      var rows2 = otLocalRows();
      var out = rows2.map(function (o) {
        var jobs = (o.jobs || []).map(function (j) {
          return {
            no: j.no, job_code: j.job || '', detail: j.detail || '', job_type: j.jobType || '',
            date: j.date, start: j.start, end: j.end,
            next_day: !!j.nextDay, end_date: j.endDate || null, hours: j.hours,
            files: (j.files || []).map(function (f) {
              return { name: f.name, size: f.size, type: f.type,
                       url: f.url || null, path: f.path || null,
                       registered: !!f.registered, has_inline_data: !!f.data };
            })
          };
        });
        return {
          /* ---- ชุดที่ njhr_ot_migrate รับได้ (p_rows) ---- */
          migrate: {
            emp_code: o.empCodeSnap || (e && e.code) || '',
            date: o.date, start: o.start, end: o.end,
            next_day: !!o.spansNextDay, status: o.status,
            reason: o.reason || o.note || '',
            jobs: jobs.map(function (j) {
              return { job_code: j.job_code, detail: j.detail, job_type: j.job_type, hours: j.hours };
            })
          },
          /* ---- ข้อมูลที่ RPC ยังไม่รองรับ ห้ามให้หาย ---- */
          legacy: {
            legacy_request_no: o.no || o.id || null,   // เช่น OT-mso... — njhr_ot_migrate ไม่รักษาเลขนี้
            local_id: o.id || null,
            client_key: o.clientKey || null,
            employee_id: o.empId || null,
            emp_code_snapshot: o.empCodeSnap || null,
            dept_snapshot: o.deptSnap || null,
            position_snapshot: o.positionSnap || null,
            total_hours: o.hours,
            spans_next_day: !!o.spansNextDay,
            note: o.note || null,
            task: o.task || null,                      // คำขอรุ่นเก่ามาก (ก่อนมีรายการงาน)
            file: o.file || null,
            created_at: o.createdAt || null,
            approver: o.approver || null,
            approved_at: o.approvedAt || null,
            timeline: o.timeline || [],                // ส่งคำขอ/อนุมัติ/ไม่อนุมัติ/ยกเลิก + ผู้ทำ + หมายเหตุ
            approvals: o.approvals || null,
            jobs: jobs                                 // รวมไฟล์แนบและ end_date รายรายการ
          }
        };
      });
      var doc = {
        exported_at: nowStamp(),
        exported_by: (currentUser() || {}).username || '',
        employee: e ? { id: e.id, code: e.code, name: e.firstName + ' ' + e.lastName } : null,
        source: 'localStorage njhr_db_v3 · db.ots',
        count: out.length,
        note: 'DO NOT IMPORT จนกว่าจะตัดสินใจเรื่อง legacy_request_no และ Timeline — ' +
              'njhr_ot_migrate ปัจจุบันรับเฉพาะส่วน migrate เท่านั้น',
        rows: out
      };
      var blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ot-local-' + todayISO() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('ดาวน์โหลดข้อมูล OT เดิมแล้ว ' + out.length + ' รายการ');
    };
  }

  var OT_JOB_TYPES = ['ตรวจปล่อย', 'คีย์ใบขน', 'คีย์ + ตรวจปล่อย'];








