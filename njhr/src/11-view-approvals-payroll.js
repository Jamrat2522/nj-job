  var apprTab = 'leave';
  var _lvQueue = [], _lvQSeq = 0, _lvQLoading = false;
  /* คิว "ลงชื่อย้อนหลัง" จาก njhr_att_correction_list (p_mine_queue = true)
     เห็นเฉพาะรายการที่ผังการอนุมัติส่งมาถึงตนเองจริง — ไม่อ่าน db.corrections */
  var _fxQueue = [], _fxLoading = false, _fxSeq = 0;

  /* ---------- คิว "คำขอ OT" — ข้อมูลจริงจาก Supabase ----------
     เดิมอ่าน db.ots ใน localStorage ทำให้คำขอที่ยื่นเข้าฐานข้อมูลจริงไม่ปรากฏในคิว
       รายการ      njhr_ot_list      (p_status='PENDING' · ผู้อนุมัติเห็นของทุกคน)
       รายการงาน   njhr_ot_get       (njhr_ot_list ไม่คืน njhr_ot_jobs)
       ไฟล์แนบ     njhr_ot_attach_list
     แล้วประกอบเป็นโครงเดียวกับที่การ์ดเดิมใช้ (it.jobs[].files[]) เพื่อให้ UI เหมือนเดิมทุกบรรทัด

     ปัจจุบันใช้ njhr_ot_approval_queue อ่านครั้งเดียวจบ (91_ot_approval_queue.sql)
     RPC ตัวนี้คืนคอลัมน์เดิมของ njhr_ot_list ครบ บวก jobs และ attachments เป็น jsonb
     จึงไม่ต้องยิงต่อรายการอีก

     เดิมเป็น 2N+1 คำขอ: njhr_ot_list 1 ครั้ง แล้ววน njhr_ot_get + njhr_ot_attach_list
     ต่อทุกรายการ (10 รายการ = 21 · 50 รายการ = 101 · เพดาน 200 รายการ = 401)

     ถ้ายังไม่ได้รัน 91 บน Production ระบบจะถอยไปใช้เส้นทางเดิมอัตโนมัติ
     หน้าเว็บจึงใช้งานได้ทั้งก่อนและหลังรัน Migration ไม่ต้องรอ Deploy พร้อมกัน */
  var _otQueue = [], _otLoading = false, _otSeq = 0, _otDecideBusy = false;

  function apOtHM(v) { return String(v == null ? '' : v).slice(0, 5); }

  /* แปลงแถวจาก RPC เป็นโครงที่การ์ดเดิมอ่าน — ไม่แตะ db.ots */
  function apOtShape(row, detail, files) {
    var jobs = ((detail && detail.jobs) || []).map(function (j) {
      var mine = (files || []).filter(function (f) { return Number(f.job_no) === Number(j.no); });
      return {
        no: Number(j.no) || 0, job: j.job_code || '', detail: j.detail || '', jobType: j.job_type || '',
        date: String(j.job_date || row.ot_date || '').slice(0, 10),
        start: apOtHM(j.start_time), end: apOtHM(j.end_time),
        nextDay: !!j.spans_next_day, endDate: String(j.end_date || '').slice(0, 10),
        hours: Number(j.ot_hours) || 0,
        files: mine.map(function (f) { return { name: f.file_name, url: f.file_url, data: f.file_url }; })
      };
    });
    return {
      id: row.id, otNo: row.request_no || row.id, empId: row.employee_id,
      empCode: row.emp_code || '', empFullName: String((row.prefix || '') + (row.emp_name || '')).trim(),
      date: String(row.ot_date || '').slice(0, 10),
      start: apOtHM(row.start_time), end: apOtHM(row.end_time),
      hours: Number(row.ot_hours) || 0, spansNextDay: !!row.spans_next_day,
      reason: row.reason || '', note: row.reason || '',
      deptSnap: row.department || '', positionSnap: row.position_name || '',
      createdAt: String(row.created_at || '').replace('T', ' ').slice(0, 16),
      status: row.status, jobs: jobs
    };
  }

  /* เคยเรียก njhr_ot_approval_queue แล้วไม่พบหรือไม่มีสิทธิ์หรือไม่
     จำไว้ในตัวแปรเพื่อไม่ต้องลองใหม่ทุกครั้งที่เปิดหน้า */
  var _otQueueRpcMissing = false;

  /* RPC ยังไม่ถูกติดตั้ง = PostgREST ตอบ 404/PGRST202 หรือฟังก์ชันไม่มีอยู่
     กรณีอื่น (สิทธิ์ไม่พอ ข้อมูลผิด) ต้องไม่ถอย เพราะจะกลบข้อผิดพลาดจริง */
  function _otQueueNotInstalled(ex) {
    var m = String((ex && (ex.message || ex.code)) || '').toLowerCase();
    return m.indexOf('pgrst202') >= 0 ||
           m.indexOf('could not find the function') >= 0 ||
           m.indexOf('does not exist') >= 0 ||
           m.indexOf('schema cache') >= 0 ||
           m.indexOf('404') >= 0;
  }

  /* เส้นทางเดิม 2N+1 — เก็บไว้เป็นทางถอยจนกว่าจะรัน 91 บน Production
     ห้ามลบจนกว่าจะยืนยันว่า njhr_ot_approval_queue ใช้งานได้จริงแล้ว */
  function apprLoadOtLegacy(el, seq) {
    return sbRpcList('njhr_ot_list', {
      p_token: sbToken(), p_from: null, p_to: null, p_status: 'PENDING',
      p_dept: null, p_employee: null, p_q: null, p_mine: false, p_limit: 200, p_offset: 0
    }).then(function (rows) {
      if (seq !== _otSeq) return;
      var list = rows || [];
      NJHR.state.otPending = list.length ? Number(list[0].total_count) : 0;
      setOtPending(NJHR.state.otPending);
      if (!list.length) { _otLoading = false; _otQueue = []; apprRender(el); return; }
      return Promise.all(list.map(function (r) {
        return Promise.all([
          sbRpc('njhr_ot_get', { p_token: sbToken(), p_id: r.id })
            ['catch'](function () { return null; }),
          sbRpcList('njhr_ot_attach_list', { p_token: sbToken(), p_ot_id: String(r.id) })
            ['catch'](function () { return []; })
        ]).then(function (x) {
          var d = x[0] && x[0].data ? x[0].data : x[0];
          return apOtShape(r, d, x[1]);
        });
      })).then(function (items) {
        if (seq !== _otSeq) return;
        _otLoading = false; _otQueue = items;
        apprRender(el);
      });
    });
  }

  function apprLoadOt(el) {
    var seq = ++_otSeq;
    _otLoading = true; _otQueue = [];
    apprRender(el);

    if (_otQueueRpcMissing) {
      return apprLoadOtLegacy(el, seq)['catch'](function (ex) { apprOtErr(el, seq, ex); });
    }

    /* อ่านครั้งเดียวจบ — พารามิเตอร์ชุดเดียวกับ njhr_ot_list เดิมทุกตัว */
    sbRpcList('njhr_ot_approval_queue', {
      p_token: sbToken(), p_from: null, p_to: null, p_status: 'PENDING',
      p_dept: null, p_employee: null, p_q: null, p_mine: false, p_limit: 200, p_offset: 0
    }).then(function (rows) {
      if (seq !== _otSeq) return;
      var list = rows || [];
      NJHR.state.otPending = list.length ? Number(list[0].total_count) : 0;
      setOtPending(NJHR.state.otPending);
      _otLoading = false;
      /* jobs / attachments มาเป็น jsonb แล้ว จึงประกอบด้วย apOtShape ตัวเดิม
         โครงที่การ์ดอ่าน (it.jobs[].files[]) จึงเหมือนเดิมทุกช่อง */
      _otQueue = list.map(function (r) {
        return apOtShape(r, { jobs: r.jobs || [] }, r.attachments || []);
      });
      apprRender(el);
    })['catch'](function (ex) {
      if (seq !== _otSeq) return;
      if (_otQueueNotInstalled(ex)) {
        /* ยังไม่ได้รัน 91 — ถอยไปเส้นทางเดิมเงียบ ๆ ผู้ใช้ไม่เห็นความต่าง */
        _otQueueRpcMissing = true;
        console.warn('[APPROVALS] ยังไม่มี njhr_ot_approval_queue — ใช้เส้นทางเดิมแทน');
        return apprLoadOtLegacy(el, seq)['catch'](function (e2) { apprOtErr(el, seq, e2); });
      }
      apprOtErr(el, seq, ex);
    });
  }

  function apprOtErr(el, seq, ex) {
    if (seq !== _otSeq) return;
    _otLoading = false; _otQueue = [];
    console.error('[APPROVALS] โหลดคิว OT ล้มเหลว:', ex);
    apprRender(el);
    var eb = document.getElementById('appr-err');
    if (eb) eb.textContent = 'โหลดคำขอ OT จาก Supabase ไม่สำเร็จ: ' + ((ex && ex.message) || ex);
  }


  /* การ์ดคำขอ OT — DOM · คลาส · ปุ่ม · ข้อความ เหมือน approvalCard() เดิมทุกบรรทัด
     ต่างเฉพาะแหล่งชื่อ/รหัส/แผนก/ตำแหน่ง ที่มาจาก RPC แทน db.employees ที่ว่างเปล่า */
  function otApprovalCard(it) {
    var body = '<span class="ap-badge ap-badge-ot">คำขอ OT</span>' +
      '<span class="ap-date">' + fmtDateDMY(it.date) + '</span>' +
      '<span class="ap-time">' + esc(it.start) + ' – ' + esc(it.end) +
      (it.spansNextDay ? ' (+1 วัน)' : '') + '</span>' +
      '<span class="ap-num">' + it.hours + ' ชม.</span>' +
      '<span class="ap-num">' + (it.jobs || []).length + ' รายการงาน</span>' +
      '<span class="ap-shift">' + esc(it.deptSnap || '-') + ' · ' + esc(it.positionSnap || '-') + '</span>';
    return '<div class="card req-card ap-card">' +
      '<div class="req-top">' + avatarHTML(it.empFullName || '?', 40) +
      '<div class="grow"><b class="ap-name">' + esc(it.empFullName || '—') + '</b><small>' +
      esc(it.empCode) + ' · ' + esc(it.deptSnap || '—') + ' · ' + esc(it.otNo) + '</small></div>' +
      statusBadge(it.status) + '</div>' +
      '<div class="req-body ap-body">' + body + '</div>' +
      '<p class="req-reason ap-reason">' + esc(it.reason) + '</p>' +
      otJobsHTML(it) +
      '<div class="req-actions ap-actions">' +
      '<button class="btn btn-primary btn-sm" data-approve="' + esc(it.id) + '">' + icon('check') + ' อนุมัติ</button>' +
      '<button class="btn btn-danger-ghost btn-sm" data-reject="' + esc(it.id) + '">ไม่อนุมัติ</button>' +
      '<button class="btn btn-ghost btn-sm" data-moreinfo="' + esc(it.id) + '">ขอข้อมูลเพิ่ม</button>' +
      '<span class="grow"></span><button class="btn btn-ghost btn-sm" data-detail="' + esc(it.id) + '">Timeline</button></div></div>';
  }

  /* อนุมัติ / ไม่อนุมัติ คำขอ OT → njhr_ot_decide
     RPC เขียน Audit + แจ้งเตือนเจ้าของคำขอเองแล้ว จึงไม่เรียก audit()/notify() ซ้ำ
     และไม่แก้สถานะใน db.ots
     "ขอข้อมูลเพิ่ม" ยังไม่รองรับฝั่ง SQL (njhr_ot_decide รับเฉพาะ APPROVE/REJECT/CANCEL)
     จึงคงปุ่มเดิมไว้แล้วแจ้งผู้ใช้ตรง ๆ ไม่ต่อ SQL แบบเดา */
  function otDecide(id, action, el) {
    var it = _otQueue.find(function (x) { return String(x.id) === String(id); });
    if (!it) return;
    if (action === 'INFO') {
      toast('คำขอ OT ยังไม่รองรับ "ขอข้อมูลเพิ่ม" — กรุณาเลือกอนุมัติหรือไม่อนุมัติ', 'info');
      return;
    }
    var act = action === 'APPROVE' ? 'APPROVE' : 'REJECT';
    var txt = act === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ';

    function send(note, btn) {
      if (_otDecideBusy) return;
      _otDecideBusy = true;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…'; }
      return sbRpc('njhr_ot_decide', { p_token: sbToken(), p_id: id, p_action: act, p_note: note || null })
        .then(function () {
          _otDecideBusy = false; closeModal();
          toast(txt + 'เรียบร้อย · แจ้งพนักงานแล้ว', act === 'REJECT' ? 'info' : 'success');
          _otQueue = _otQueue.filter(function (x) { return String(x.id) !== String(id); });
          var card = el.querySelector('[data-approve="' + id + '"]');
          card = card ? card.closest('.req-card') : null;
          if (card && _otQueue.length) {
            card.remove();
            var tabBtn = el.querySelectorAll('.tab')[1];
            var badge = tabBtn ? tabBtn.querySelector('.tab-badge') : null;
            if (badge) { if (_otQueue.length) badge.textContent = _otQueue.length; else badge.remove(); }
          } else apprRender(el);
          refreshOtPending();
          refreshMenuBadge();
        })['catch'](function (er) {
          _otDecideBusy = false; closeModal();
          console.error('[APPROVALS] njhr_ot_decide ล้มเหลว:', er);
          toast((er && er.message) || (txt + 'ไม่สำเร็จ'), 'error');
          viewApprovals(el);
        });
    }

    if (act === 'APPROVE') {
      confirmDialog('อนุมัติรายการ', 'อนุมัติคำขอ <b>' + esc(it.otNo) + '</b> ของ <b>' +
        esc(it.empFullName || '') + '</b> ใช่หรือไม่', 'อนุมัติ', function () { return send(''); });
    } else {
      openModal('ไม่อนุมัติ · ' + esc(it.otNo),
        '<label class="field"><span>เหตุผลที่ไม่อนุมัติ <i class="req">*</i></span><textarea id="rj-reason" rows="3" placeholder="จำเป็นต้องระบุเหตุผล"></textarea></label><div class="form-error" id="rj-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="rj-cancel">ยกเลิก</button><button class="btn btn-danger" id="rj-ok">ยืนยันไม่อนุมัติ</button>');
      document.getElementById('rj-cancel').onclick = closeModal;
      document.getElementById('rj-ok').onclick = function () {
        var r = document.getElementById('rj-reason').value.trim();
        if (!r) { document.getElementById('rj-err').textContent = 'กรุณาระบุเหตุผล'; return; }
        send(r, this);
      };
    }
  }

  function apprLoadFix(el) {
    var seq = ++_fxSeq;
    _fxLoading = true; _fxQueue = [];
    apprRender(el);
    sbRpcList('njhr_att_correction_list', {
      p_token: sbToken(), p_employee: null, p_status: 'PENDING',
      p_from: null, p_to: null, p_limit: 200, p_offset: 0, p_mine_queue: true
    }).then(function (rows) {
      if (seq !== _fxSeq) return;
      _fxLoading = false; _fxQueue = rows || [];
      setFxPending(_fxQueue.length ? Number(_fxQueue[0].total_count) || _fxQueue.length : 0);
      apprRender(el);
    })['catch'](function (ex) {
      if (seq !== _fxSeq) return;
      _fxLoading = false; _fxQueue = [];
      apprRender(el);
      var eb = document.getElementById('appr-err');
      if (eb) eb.textContent = (ex && ex.message) || 'โหลดคำขอลงชื่อย้อนหลังไม่สำเร็จ';
    });
  }

  function viewApprovals(el) {
    if (apprTab === 'fix') { apprLoadFix(el); return; }
    if (apprTab === 'ot') { apprLoadOt(el); return; }
    if (apprTab !== 'leave') { apprRender(el); return; }
    var seq = ++_lvQSeq;
    _lvQLoading = true; _lvQueue = [];
    apprRender(el);
    sbRpcList('njhr_leave_queue', { p_token: sbToken(), p_limit: 200, p_offset: 0 }).then(function (rows) {
      if (seq !== _lvQSeq) return;                      // เปลี่ยนแท็บ/ออกจากหน้าแล้ว ทิ้งผลเก่า
      _lvQLoading = false; _lvQueue = rows;
      NJHR.state.lvPending = rows.length ? Number(rows[0].total_count) : 0;
      refreshMenuBadge();
      apprRender(el);
    }).catch(function (er) {
      if (seq !== _lvQSeq) return;
      _lvQLoading = false; _lvQueue = [];
      apprRender(el);
      var b = document.getElementById('appr-err');
      if (b) b.textContent = 'โหลดคำขอลาจาก Supabase ไม่สำเร็จ: ' + (er.message || er);
    });
  }

  function apprRender(el) {
    /* คิวทั้งสามแท็บมาจาก Supabase แล้ว — ไม่อ่าน db.* อีก */
    var tabs = [['leave', 'คำขอลา', _lvQueue], ['ot', 'คำขอ OT', _otQueue], ['fix', 'ลงชื่อย้อนหลัง', _fxQueue]];
    var items = apprTab === 'leave' ? _lvQueue.slice()
      : apprTab === 'fix' ? _fxQueue.slice()
      : _otQueue.slice().sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });

    var FIRST = 40; // PERF: วาดชุดแรกให้เห็นทันที ที่เหลือต่อท้ายเป็นช่วง (รายการครบเท่าเดิมทุกใบ)
    el.innerHTML =
      '<div class="tabs">' + tabs.map(function (t) {
        var n = t[0] === 'leave' ? NJHR.state.lvPending
              : t[0] === 'fix' ? _fxQueue.length
              : _otQueue.length;
        return '<button class="tab' + (t[0] === apprTab ? ' active' : '') + '" data-tab="' + t[0] + '">' + t[1] + (n ? ' <span class="tab-badge">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="req-list" id="appr-list">' + (
        (apprTab === 'leave' && _lvQLoading) || (apprTab === 'fix' && _fxLoading) || (apprTab === 'ot' && _otLoading)
          ? '<div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div>'
        : items.length ? items.slice(0, FIRST).map(function (it) { return approvalCard(it); }).join('')
        : '<div class="card">' + emptyState('ไม่มีรายการรออนุมัติ') + '</div>') + '</div>' +
      '<div class="form-error" id="appr-err" role="alert" style="white-space:pre-line"></div>';

    var listEl = document.getElementById('appr-list');
    if (items.length > FIRST) {
      var pos = FIRST;
      apprChunkToken++;
      (function pump(token) {
        if (token !== apprChunkToken || !listEl.isConnected) return; // ออกจากหน้าแล้วหยุดวาด
        var html = '', end = Math.min(pos + 60, items.length);
        for (; pos < end; pos++) html += approvalCard(items[pos]);
        listEl.insertAdjacentHTML('beforeend', html);
        if (pos < items.length) (window.requestIdleCallback || window.requestAnimationFrame)(function () { pump(token); });
      })(apprChunkToken);
    }
    // Event delegation: ผูกครั้งเดียวต่อการเปิดหน้า แทนผูกทุกปุ่มของทุกการ์ด
    el.onclick = function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-tab],[data-detail],[data-approve],[data-reject],[data-moreinfo],[data-jview],[data-jdl],[data-fixapprove],[data-fixreject]') : null;
      if (!t || !el.contains(t)) return;
      var d = t.dataset;
      // ไฟล์แนบของรายการงาน OT ในหน้าอนุมัติ — หาไฟล์จากคำขอของการ์ดใบนั้นโดยตรง
      if (d.jview || d.jdl) {
        var cardEl = t.closest('.ap-card');
        var apBtn = cardEl && cardEl.querySelector('[data-approve]');
        var itOt = apBtn && _otQueue.find(function (x) { return String(x.id) === String(apBtn.dataset.approve); });
        if (!itOt) return;
        var key = String(d.jview || d.jdl).split('-');
        var jb = (itOt.jobs || []).find(function (x) { return x.no === parseInt(key[0], 10); });
        var f = jb && jb.files && jb.files[parseInt(key[1], 10)];
        if (!f) return;
        /* ใช้ตัวช่วยชุดเดียวกับ Timeline — 👁 เปิด Preview ทับในหน้าเดิม (ไม่เปิดแท็บใหม่)
           ⬇ ดาวน์โหลดพร้อม Toast ที่ปิดได้ */
        if (d.jview) filePreviewOpen(f.url || f.data, f.name);
        else fileDownload(f.url || f.data, f.name);
        return;
      }
      if (d.fixapprove || d.fixreject) { fixDecide(d.fixapprove || d.fixreject, !!d.fixapprove, el, t); return; }
      if (d.tab) { apprTab = d.tab; viewApprovals(el); }
      else if (d.detail) {
        /* มือถือ (max-width: 767px) เปิดหน้า "อนุมัติรายการ" เต็มจอจากข้อมูลที่โหลดมาแล้ว
           Desktop ใช้ Timeline เดิมทุกประการ */
        /* ต้องมี id จริงเท่านั้น ไม่งั้นตกไปหน้ารายละเอียดเดิม — ห้ามส่ง object เปล่าเข้าไป */
        var itm = null;
        if (apIsMobile() && d.detail) {
          itm = items.filter(function (x) {
            return x && x.id != null && String(x.id) === String(d.detail);
          })[0] || null;
        }
        if (itm && itm.id) apMobileDetail(itm, el, apprTab);
        else if (apprTab === 'leave') lvShowTimeline(d.detail);
        else if (apprTab === 'ot') {
          /* รายละเอียด/Timeline ของ OT อ่านจาก njhr_ot_get ผ่าน Module เดิม
             Module อยู่คนละ chunk จึงต้องโหลดก่อนเรียกใช้ */
          var otId = d.detail;
          if (NJHR.modules.isLoaded('request-detail')) NJHR.features.requestDetail.open('OT', otId, el);
          else NJHR.modules.load('request-detail').then(function () {
            NJHR.features.requestDetail.open('OT', otId, el);
          })['catch'](function (ex) {
            console.error('[APPROVALS] โหลด Module request-detail ไม่สำเร็จ:', ex);
            toast('ไม่สามารถเปิดรายละเอียดได้ กรุณาลองใหม่', 'error');
          });
        }
        else showTimeline(apprTab === 'fix' ? 'fix' : apprTab, d.detail);
      }
      else if (d.approve) doApprove(d.approve, 'APPROVE', el);
      else if (d.reject) doApprove(d.reject, 'REJECT', el);
      else if (d.moreinfo) doApprove(d.moreinfo, 'INFO', el);
    };
  }
  /* อนุมัติ / ไม่อนุมัติ "ลงชื่อย้อนหลัง"
     เซิร์ฟเวอร์ตรวจซ้ำว่าเป็นผู้อนุมัติของขั้นปัจจุบันจริง (njhr_attc_can_act)
     ครบทุกขั้นเท่านั้นจึงเขียน attendance · ไม่อนุมัติไม่แตะ attendance */
  function fixDecide(id, isApprove, el, btn) {
    var eb = document.getElementById('appr-err');
    if (eb) eb.textContent = '';
    function run(note) {
      return withButtonLoading(btn, isApprove ? 'กำลังอนุมัติ…' : 'กำลังบันทึก…', function () {
        return sbRpc(isApprove ? 'njhr_att_correction_approve' : 'njhr_att_correction_reject',
          isApprove ? { p_token: sbToken(), p_id: id, p_note: note || '' }
                    : { p_token: sbToken(), p_id: id, p_reason: note })
          .then(function (r) {
            toast(isApprove
              ? (r && r.status === 'APPROVED'
                  ? 'อนุมัติครบทุกขั้นแล้ว บันทึกเวลาเรียบร้อย'
                  : 'อนุมัติขั้นนี้แล้ว ส่งต่อขั้นถัดไป')
              : 'บันทึกการไม่อนุมัติแล้ว', isApprove ? 'success' : 'info');
            viewApprovals(el);
          });
      })['catch'](function (e) {
        if (eb) eb.textContent = (e && e.message) || 'ดำเนินการไม่สำเร็จ';
      });
    }
    if (isApprove) { run(''); return; }
    // ไม่อนุมัติต้องระบุเหตุผล — ใช้ Modal กลางของระบบ ไม่สร้างกล่องใหม่
    openModal('ไม่อนุมัติคำขอลงชื่อย้อนหลัง',
      '<label class="field"><span>เหตุผลที่ไม่อนุมัติ <i class="req">*</i></span>' +
      '<textarea id="fxr-note" rows="3" placeholder="ระบุเหตุผลให้พนักงานทราบ"></textarea></label>' +
      '<div class="form-error" id="fxr-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="fxr-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="fxr-go">บันทึก</button>');
    document.getElementById('fxr-cancel').onclick = closeModal;
    document.getElementById('fxr-go').onclick = function () {
      var v = String(document.getElementById('fxr-note').value || '').trim();
      if (!v) { document.getElementById('fxr-err').textContent = 'กรุณาระบุเหตุผล'; return; }
      closeModal();
      run(v);
    };
  }

  var apprChunkToken = 0;

  /* ================= หน้า "อนุมัติรายการ" เฉพาะมือถือ (max-width: 767px) =================
     ข้อมูลทั้งหมดมาจาก it ที่ njhr_leave_queue ส่งมาแล้ว ไม่ยิง RPC เพิ่มเพื่อดึงข้อมูลซ้ำ
     Timeline ดึงจาก njhr_leave_detail (approvals jsonb) ตัวเดิม
     ปุ่มอนุมัติ/ไม่อนุมัติ "กดปุ่มจริงในรายการ" ต่อ จึงใช้ Handler และ Workflow เดิมทุกบรรทัด
     ไม่มีข้อมูล Hardcode — ช่องที่ไม่มีค่าจริงแสดง '-' ================================= */
  function apIsMobile() {
    try { return window.matchMedia('(max-width: 767px)').matches; } catch (e) { return false; }
  }
  function apRow2(label, val) {
    return '<div class="apm-row"><span>' + esc(label) + '</span><b>' +
      esc(val == null || val === '' ? '-' : String(val)) + '</b></div>';
  }
  function apMobileDetail(it, el, kind) {
    kind = kind || 'leave';
    var st = it.ui_status || it.status || '';
    /* done เป็นจริงเฉพาะเมื่อมีสถานะจริงและสถานะนั้นจบแล้วเท่านั้น
       สถานะว่าง/undefined = ยังไม่จบ จึงไม่ซ่อนปุ่มเพราะการคำนวณผิด */
    var stU = String(st).toUpperCase();
    var DONE_ST = ['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    var done = stU !== '' && DONE_ST.indexOf(stU) >= 0;
    var rows = '', who, code, dep;
    if (kind === 'leave') {
      var lt = lvType(it.leave_type), md = lvMode(it);
      var days = lvNum(it.total_days), hrs = lvNum(it.hours);
      who = it.emp_name; code = it.emp_code; dep = it.department;
      rows = apRow2('ประเภทคำขอ', lt.name) + apRow2('เลขที่คำขอ', lvCode(it)) +
        apRow2('วันที่', fmtDate(it.start_date) +
          (it.end_date !== it.start_date ? ' – ' + fmtDate(it.end_date) : '')) +
        apRow2('รูปแบบ', lvModeTxt(md)) +
        apRow2('จำนวน', md === 'HOURLY' ? hrs + ' ชั่วโมง' : days + ' วัน') +
        apRow2('เหตุผล', it.reason) + apRow2('ไฟล์แนบ', it.file_name || 'ไม่มีไฟล์แนบ');
    } else if (kind === 'fix') {
      who = it.emp_name; code = it.emp_code; dep = it.department;
      rows = apRow2('ประเภทคำขอ', 'ลงชื่อย้อนหลัง') + apRow2('เลขที่คำขอ', it.id) +
        apRow2('วันที่ทำงาน', fmtDate(it.work_date)) +
        apRow2('เวลาเข้าใหม่', String(it.new_check_in || '').slice(11, 16)) +
        apRow2('เวลาออกใหม่', String(it.new_check_out || '').slice(11, 16)) +
        apRow2('เหตุผล', it.reason) + apRow2('ขั้นอนุมัติ', it.step_name);
    } else {
      var e0 = emp(it.empId);
      who = empName(it.empId); code = e0 ? e0.code : ''; dep = e0 ? dept(e0.deptId) : '';
      rows = apRow2('ประเภทคำขอ', 'ขอ OT') + apRow2('เลขที่คำขอ', it.id) +
        apRow2('วันที่', fmtDate(it.date)) +
        apRow2('เวลา', (it.start || '-') + ' – ' + (it.end || '-')) +
        apRow2('จำนวน', (it.hours != null ? it.hours + ' ชั่วโมง' : '-')) +
        apRow2('เหตุผล', it.reason) +
        apRow2('รายการงาน', (it.jobs && it.jobs.length ? it.jobs.length + ' รายการ' : '-'));
    }

    openModal('อนุมัติรายการ',
      '<div class="apm">' +
      '<div class="fm-emp">' + avatarHTML(who || '?', 44) +
      '<span class="grow"><b>' + esc(who || '-') + '</b>' +
      '<small>' + esc(code || '-') + ' · ' + esc(dep || 'ไม่ระบุ') + '</small></span></div>' +
      '<div class="apm-st">' + statusBadge(st) + '</div>' +
      '<div class="apm-box">' + rows + '</div>' +
      '<h4 class="apm-h">ประวัติการอนุมัติ</h4>' +
      '<div class="timeline apm-tl" id="apm-tl"><small class="muted">กำลังโหลด…</small></div>' +
      '</div>',
      done
        ? '<button class="btn btn-ghost" id="apm-close">ปิด</button>'
        : '<button class="btn apm-btn-reject" id="apm-reject">ไม่อนุมัติ</button>' +
          '<button class="btn apm-btn-approve" id="apm-approve">อนุมัติ</button>',
      { fullMobile: true });

    var cb = document.getElementById('apm-close');
    if (cb) cb.onclick = closeModal;
    /* กดปุ่มจริงในรายการต่อ = ใช้ Handler เดิมทุกเส้นทาง ไม่ทำ Workflow ซ้อน */
    function relay(sel) {
      closeModal();
      var b = el && el.querySelector(sel);
      if (b) b.click();
    }
    var aAttr = kind === 'fix' ? 'data-fixapprove' : 'data-approve';
    var rAttr = kind === 'fix' ? 'data-fixreject' : 'data-reject';
    var ab = document.getElementById('apm-approve');
    if (ab) ab.onclick = function () { relay('[' + aAttr + '="' + it.id + '"]'); };
    var rb = document.getElementById('apm-reject');
    if (rb) rb.onclick = function () { relay('[' + rAttr + '="' + it.id + '"]'); };

    if (kind !== 'leave') {
      var box0 = document.getElementById('apm-tl');
      var tl0 = it.timeline || [];
      if (box0) {
        box0.innerHTML = tl0.length ? tl0.map(function (x) {
          var cls0 = String(x.action).indexOf('อนุมัติ') === 0 ? 'tl-ok'
                   : String(x.action).indexOf('ไม่อนุมัติ') === 0 ? 'tl-bad'
                   : String(x.action).indexOf('ยกเลิก') === 0 ? 'tl-mut' : 'tl-info';
          return '<div class="tl-item ' + cls0 + '"><span class="tl-dot"></span>' +
            '<div><b>' + esc(x.action) + '</b><small>' + esc(x.by || '-') + ' · ' + esc(x.at || '-') +
            '</small>' + (x.note ? '<p>' + esc(x.note) + '</p>' : '') + '</div></div>';
        }).join('') : '<small class="muted">ยังไม่มีประวัติการอนุมัติ</small>';
      }
      return;
    }
    sbRpc('njhr_leave_detail', { p_token: sbToken(), p_leave_id: it.id }).then(function (d) {
      var box = document.getElementById('apm-tl');
      if (!box) return;
      var tl = ((d && d.approvals) || []).slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
      if (!tl.length) { box.innerHTML = '<small class="muted">ยังไม่มีประวัติการอนุมัติ</small>'; return; }
      box.innerHTML = tl.map(function (x) {
        var act = x.action_th || ({ SUBMIT: 'ผู้ขอ', APPROVE: 'อนุมัติ', REJECT: 'ไม่อนุมัติ',
                                    INFO: 'ขอข้อมูลเพิ่ม', CANCEL: 'ยกเลิกคำขอ' })[x.action] || x.action;
        /* ขั้นที่ทำแล้ว = แดง/เขียว · ขั้นที่ยังไม่ถึง (ไม่มีเวลา at) = เทา ตามภาพอ้างอิง */
        var cls = x.action === 'APPROVE' ? 'tl-ok'
                : x.action === 'REJECT' ? 'tl-bad'
                : x.action === 'CANCEL' ? 'tl-mut'
                : (x.at ? 'tl-info' : 'tl-wait');
        return '<div class="tl-item ' + cls + '"><span class="tl-dot"></span>' +
          '<div><b>' + esc(act) + '</b><small>' + esc(x.by_name || '-') +
          (x.at ? ' · ' + esc(x.at) : '') + '</small>' +
          (x.note ? '<p>' + esc(x.note) + '</p>' : '') + '</div></div>';
      }).join('');
    })['catch'](function (er) {
      var box = document.getElementById('apm-tl');
      if (box) box.innerHTML = '<small class="muted">โหลดประวัติไม่สำเร็จ</small>';
    });
  }

  // การ์ดคำขอลาในหน้าอนุมัติ — ใช้ข้อมูลจาก njhr_leave_queue (โครงหน้าจอเหมือนเดิมทุกจุด)
  function leaveApprovalCard(it) {
    var lt = lvType(it.leave_type), md = lvMode(it);
    var days = lvNum(it.total_days), hrs = lvNum(it.hours);
    var body = '<span class="ap-badge" style="background:' + lt.color + '18;color:' + lt.color + '">' + esc(lt.name) + '</span>' +
      '<span class="ap-date">' + fmtDate(it.start_date) + (it.end_date !== it.start_date ? ' – ' + fmtDate(it.end_date) : '') + '</span>' +
      '<span class="ap-num">' + (md === 'HOURLY' ? hrs + ' ชม.' : days + ' วัน') + '</span>' +
      (it.remaining != null ? '<span class="ap-remain">คงเหลือ ' + lvNum(it.remaining) + ' วัน</span>' : '');
    /* ---------- แถวยาวเฉพาะ Desktop (.only-desktop) ----------
       Mobile View เดิม (.ap-card.only-mobile) ไม่ถูกแตะแม้แต่บรรทัดเดียว
       ปุ่มใช้ data-approve / data-reject / data-moreinfo / data-detail ตัวเดิม
       Handler ที่บรรทัด 85 จับจาก data-* จึงเป็น Logic เดิมทั้งหมด */
    var apFiles = it.file_name ? 1 : 0;
    /* ปุ่มดูรายละเอียดบนมือถือเปิดหน้าเต็มจอ (apMobileDetail) — Desktop ใช้ Timeline เดิม */
    var apRow = '<div class="card ap-row only-desktop">' +
      '<div class="lv-c ap-c-emp">' + avatarHTML(it.emp_name || '?', 36) +
      '<span class="grow"><b>' + esc(it.emp_name || '—') + '</b>' +
      '<small>' + esc(it.emp_code || '—') + ' · ' + esc(it.department || 'ไม่ระบุ') + '</small></span></div>' +
      '<div class="lv-c ap-c-info">' +
      '<b><span class="ap-badge" style="background:' + lt.color + '18;color:' + lt.color + '">' +
      esc(lt.name) + '</span> ' +
      fmtDate(it.start_date) + (it.end_date !== it.start_date ? ' – ' + fmtDate(it.end_date) : '') +
      ' · ' + lvModeTxt(md) + '</b>' +
      '<small>' + esc(lvCode(it)) + (it.reason ? ' · ' + esc(it.reason) : '') + '</small></div>' +
      '<div class="lv-c ap-c-num"><b>' +
      (md === 'HOURLY' ? 'OT ' + hrs + ' ชม.' : 'ลา ' + days + ' วัน') + '</b></div>' +
      '<div class="lv-c lv-c-file">' + (apFiles
        ? icon('paperclip', 'ic-sm') + '<span>' + apFiles + ' ไฟล์</span>'
        : '<span class="muted">ไม่มีไฟล์แนบ</span>') + '</div>' +
      '<div class="lv-c lv-c-st">' + statusBadge(it.ui_status || it.status) + '</div>' +
      '<div class="lv-c ap-c-act">' +
      '<button type="button" class="btn-icon lv-eye" data-detail="' + it.id + '" ' +
      'aria-label="ดูรายละเอียด" title="ดูรายละเอียด">' + icon('eye') + '</button>' +
      '<button class="btn btn-ghost btn-sm" data-moreinfo="' + it.id + '">ขอข้อมูลเพิ่ม</button>' +
      '<button class="btn btn-danger-ghost btn-sm" data-reject="' + it.id + '">ไม่อนุมัติ</button>' +
      '<button class="btn btn-primary btn-sm" data-approve="' + it.id + '">' + icon('check') + ' อนุมัติ</button>' +
      '</div></div>';

    return apRow + '<div class="card req-card ap-card only-mobile">' +
      '<div class="req-top">' + avatarHTML(it.emp_name || '?', 40) +
      '<div class="grow"><b class="ap-name">' + esc(it.emp_name || '—') + '</b><small>' + esc(it.emp_code || '') + ' · ' + esc(it.department || '—') + ' · ' + lvCode(it) + '</small></div>' +
      statusBadge(it.ui_status || it.status) + '</div>' +
      '<div class="req-body ap-body">' + body + '</div>' +
      '<p class="req-reason ap-reason">' + esc(it.reason) + (it.file_name ? ' · ' + icon('fileText', 'ic-sm') + ' ' + esc(it.file_name) : '') + '</p>' +
      '<div class="req-actions ap-actions">' +
      '<button class="btn btn-primary btn-sm" data-approve="' + it.id + '">' + icon('check') + ' อนุมัติ</button>' +
      '<button class="btn btn-danger-ghost btn-sm" data-reject="' + it.id + '">ไม่อนุมัติ</button>' +
      '<button class="btn btn-ghost btn-sm" data-moreinfo="' + it.id + '">ขอข้อมูลเพิ่ม</button>' +
      '<span class="grow"></span><button class="btn btn-ghost btn-sm" data-detail="' + it.id + '">Timeline</button></div></div>';
  }

  /* การ์ดคำขอ "ลงชื่อย้อนหลัง" — ข้อมูลจาก njhr_att_correction_list ทั้งหมด
     แสดงขั้นอนุมัติปัจจุบันตามผังจริง · ปุ่มขึ้นเฉพาะเมื่อ can_act = true (ผังส่งมาถึงตนเอง) */
  function fixHM(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return isNaN(d.getTime()) ? '—' : ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function fixApprovalCard(it) {
    var dt = String(it.work_date || '').slice(0, 10);
    return '<div class="card req-card ap-card" data-fixid="' + esc(it.id) + '">' +
      '<div class="req-top">' + avatarHTML(it.emp_name || '?', 40) +
      '<div class="grow"><b class="ap-name">' + esc(it.emp_name || '') + '</b>' +
      '<small>' + esc(it.emp_code || '') + ' · ' + esc(it.department_name || '-') +
      ' · ส่งเมื่อ ' + esc(String(it.submitted_at || '').slice(0, 10)) + '</small></div>' +
      statusBadge(it.status) + '</div>' +
      '<div class="req-body ap-body">' +
      '<span class="ap-badge ap-badge-fix">ลงชื่อย้อนหลัง</span>' +
      '<span class="ap-date">' + fmtDate(dt) + '</span>' +
      '<span class="ap-fix">เข้า: <s class="ap-old">' + esc(fixHM(it.original_check_in)) +
      '</s> → <b class="ap-new">' + esc(fixHM(it.requested_check_in) === '—'
        ? '(คงเดิม)' : fixHM(it.requested_check_in)) + '</b></span>' +
      '<span class="ap-fix">ออก: <s class="ap-old">' + esc(fixHM(it.original_check_out)) +
      '</s> → <b class="ap-new">' + esc(fixHM(it.requested_check_out) === '—'
        ? '(คงเดิม)' : fixHM(it.requested_check_out)) + '</b></span>' +
      '<span class="ap-shift">' + icon('timer', 'ic-sm') + ' ขั้นที่ ' +
      esc(String(it.current_step || '-')) + '/' + esc(String(it.step_total || '-')) +
      (it.step_name ? ' · ' + esc(it.step_name) : '') +
      (it.step_mode ? ' (' + esc(it.step_mode) + ')' : '') + '</span>' +
      (it.workflow_name ? '<span class="ap-shift">ผัง: ' + esc(it.workflow_name) + '</span>' : '') +
      '</div>' +
      '<p class="req-reason ap-reason">' + esc(it.reason || '') +
      (it.attachment_name ? ' · ' + icon('fileText', 'ic-sm') + ' ' + esc(it.attachment_name) : '') + '</p>' +
      (it.can_act
        ? '<div class="req-acts">' +
          '<button class="btn btn-ghost btn-sm" data-fixreject="' + esc(it.id) + '">ไม่อนุมัติ</button>' +
          '<button class="btn btn-primary btn-sm" data-fixapprove="' + esc(it.id) + '">อนุมัติ</button></div>'
        : '<p class="muted note">รออนุมัติจากผู้อนุมัติในขั้นนี้</p>') +
      '</div>';
  }

  function approvalCard(it) {
    if (apprTab === 'leave') return leaveApprovalCard(it);
    if (apprTab === 'fix') return fixApprovalCard(it);
    if (apprTab === 'ot') return otApprovalCard(it);
    var e = emp(it.empId);
    var sh = e ? shOf(e) : null;
    var body = '';
    if (apprTab === 'ot') {
      body = '<span class="ap-badge ap-badge-ot">คำขอ OT</span>' +
        '<span class="ap-date">' + fmtDate(it.date) + '</span>' +
        (sh ? '<span class="ap-shift">' + icon('timer', 'ic-sm') + ' ' + esc(sh.name) + ' เลิก ' + esc(sh.end) + (sh.overnight ? ' (วันถัดไป)' : '') + '</span>' : '') +
        '<span class="ap-time">' + it.start + ' – ' + it.end + '</span>' +
          '<span class="ap-num">' + it.hours + ' ชม.</span>' +
        '<span class="ap-num">' + otJobsOf(it).length + ' รายการงาน</span>' +
        '<span class="ap-shift">' + esc(it.deptSnap || dept((emp(it.empId) || {}).deptId)) + ' · ' +
        esc(it.positionSnap || (emp(it.empId) || {}).position || '-') + '</span>';
    } else {
      body = '<span class="ap-badge ap-badge-fix">แก้ไขเวลา</span>' +
        '<span class="ap-date">' + fmtDate(it.date) + '</span>' +
        (sh ? '<span class="ap-shift">' + icon('timer', 'ic-sm') + ' ' + esc(sh.name) + ' (' + shTime(sh) + ')</span>' : '') +
        '<span class="ap-fix">' + esc(it.field) + ': <s class="ap-old">' + esc(it.oldValue) + '</s> → <b class="ap-new">' + esc(it.newValue) + '</b></span>';
    }
    return '<div class="card req-card ap-card">' +
      '<div class="req-top">' + avatarHTML(e ? e.firstName : '?', 40) +
      '<div class="grow"><b class="ap-name">' + esc(empName(it.empId)) + '</b><small>' + esc(e ? e.code : '') + ' · ' + esc(dept(e ? e.deptId : '')) + ' · ' + esc(it.id) + '</small></div>' + statusBadge(it.status) + '</div>' +
      '<div class="req-body ap-body">' + body + '</div>' +
      '<p class="req-reason ap-reason">' + esc(it.reason) +
      (it.note ? ' · หมายเหตุรวม: ' + esc(it.note) : '') +
      (it.file ? ' · ' + icon('fileText', 'ic-sm') + ' ' + esc(it.file) : '') + '</p>' +
      // รายการงาน OT แยกรายแถว พร้อมไฟล์แนบของรายการนั้น ๆ (ระบุชัดว่าเป็นไฟล์ของ JOB ใด)
      (apprTab === 'ot' ? otJobsHTML(it) : '') +
      '<div class="req-actions ap-actions">' +
      '<button class="btn btn-primary btn-sm" data-approve="' + it.id + '">' + icon('check') + ' อนุมัติ</button>' +
      '<button class="btn btn-danger-ghost btn-sm" data-reject="' + it.id + '">ไม่อนุมัติ</button>' +
      '<button class="btn btn-ghost btn-sm" data-moreinfo="' + it.id + '">ขอข้อมูลเพิ่ม</button>' +
      '<span class="grow"></span><button class="btn btn-ghost btn-sm" data-detail="' + it.id + '">Timeline</button></div></div>';
  }

  function findApprovalItem(id) {
    return db.leaves.find(function (x) { return x.id === id; }) ||
      db.ots.find(function (x) { return x.id === id; }) ||
      db.corrections.find(function (x) { return x.id === id; });
  }

  // อนุมัติ / ไม่อนุมัติ / ขอข้อมูลเพิ่ม ของ "คำขอลา" → njhr_leave_decide (ล็อกแถวฝั่ง DB กันกดซ้ำ)
  var lvDecideBusy = false;
  function lvDecide(id, action, el) {
    var it = _lvQueue.find(function (x) { return x.id === id; });
    if (!it) return;
    var act = action === 'APPROVE' ? 'APPROVE' : action === 'REJECT' ? 'REJECT' : 'INFO';
    var txt = { APPROVE: 'อนุมัติ', REJECT: 'ไม่อนุมัติ', INFO: 'ขอข้อมูลเพิ่ม' }[act];

    function send(note, btn) {
      if (lvDecideBusy) return;
      lvDecideBusy = true;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…'; }
      return sbRpc('njhr_leave_decide', { p_token: sbToken(), p_leave_id: id, p_action: act, p_note: note || '' })
        .then(function (r) {
          lvDecideBusy = false; closeModal();
          toast(txt + 'เรียบร้อย · แจ้งพนักงานแล้ว', act === 'REJECT' ? 'info' : 'success');
          if (act === 'INFO') {
            it.ui_status = 'NEED_MORE_INFO';
            apprRender(el);                              // คงอยู่ในคิว (สถานะจริงยัง PENDING ตาม enum)
          } else {
            _lvQueue = _lvQueue.filter(function (x) { return x.id !== id; });
            NJHR.state.lvPending = Math.max(0, NJHR.state.lvPending - 1);
            var card = el.querySelector('[data-approve="' + id + '"]');
            card = card ? card.closest('.req-card') : null;
            if (card && _lvQueue.length) {
              // PERF: เอาเฉพาะการ์ดที่จัดการแล้วออก + อัปเดตตัวเลขบนแท็บ (ผลบนจอเท่ากับเรนเดอร์ใหม่ทั้งหน้า)
              card.remove();
              var tabBtn = el.querySelectorAll('.tab')[0];
              var badge = tabBtn ? tabBtn.querySelector('.tab-badge') : null;
              if (badge) { if (NJHR.state.lvPending) badge.textContent = NJHR.state.lvPending; else badge.remove(); }
            } else apprRender(el);   // หมดรายการ → แสดง empty state เดิม
          }
          refreshMenuBadge();
        }).catch(function (er) {
          lvDecideBusy = false; closeModal();
          toast(er.message || (txt + 'ไม่สำเร็จ'), 'error');
          viewApprovals(el);                             // สถานะฝั่งเซิร์ฟเวอร์เปลี่ยนแล้ว → โหลดใหม่
        });
    }

    if (act === 'APPROVE') {
      confirmDialog('อนุมัติรายการ', 'อนุมัติคำขอ <b>' + esc(lvCode(it || id)) + '</b> ของ <b>' + esc(it.emp_name || '') + '</b> ใช่หรือไม่', 'อนุมัติ', function () { return send(''); });
    } else if (act === 'REJECT') {
      openModal('ไม่อนุมัติ · ' + esc(lvCode(id)),
        '<label class="field"><span>เหตุผลที่ไม่อนุมัติ <i class="req">*</i></span><textarea id="rj-reason" rows="3" placeholder="จำเป็นต้องระบุเหตุผล"></textarea></label><div class="form-error" id="rj-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="rj-cancel">ยกเลิก</button><button class="btn btn-danger" id="rj-ok">ยืนยันไม่อนุมัติ</button>');
      document.getElementById('rj-cancel').onclick = closeModal;
      document.getElementById('rj-ok').onclick = function () {
        var r = document.getElementById('rj-reason').value.trim();
        if (!r) { document.getElementById('rj-err').textContent = 'กรุณาระบุเหตุผล'; return; }
        send(r, this);
      };
    } else {
      openModal('ขอข้อมูลเพิ่ม · ' + esc(lvCode(id)),
        '<label class="field"><span>ข้อมูลที่ต้องการเพิ่ม <i class="req">*</i></span><textarea id="mi-note" rows="3" placeholder="เช่น ขอใบรับรองแพทย์เพิ่มเติม"></textarea></label><div class="form-error" id="mi-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="mi-cancel">ยกเลิก</button><button class="btn btn-primary" id="mi-ok">ส่งคำถาม</button>');
      document.getElementById('mi-cancel').onclick = closeModal;
      document.getElementById('mi-ok').onclick = function () {
        var r = document.getElementById('mi-note').value.trim();
        if (!r) { document.getElementById('mi-err').textContent = 'กรุณาระบุข้อมูลที่ต้องการ'; return; }
        send(r, this);
      };
    }
  }

  function doApprove(id, action, el) {
    if (apprTab === 'leave') { lvDecide(id, action, el); return; }
    if (apprTab === 'ot') { otDecide(id, action, el); return; }
    var it = findApprovalItem(id);
    if (!it) return;
    var u = currentUser(), approver = currentEmp();
    var byName = approver ? approver.firstName + ' ' + approver.lastName : u.username;

    function finish(status, actionText, note) {
      it.status = status;
      it.timeline.push({ at: nowStamp(), by: byName, action: actionText, note: note || '' });
      // ตัดยอดวันลาจริงเมื่ออนุมัติใบลา (Production: DB function ภายใน transaction)
      if (status === 'APPROVED' && it.typeId) {
        var b = balance(it.empId, it.typeId);
        b.used = Math.round((b.used + (it.days || 0) + (it.hours || 0) / 8) * 100) / 100;
      }
      // อนุมัติแก้ไขเวลา → ปรับ attendance จริง
      if (status === 'APPROVED' && it.field) {
        var att = db.attendance.find(function (a) { return a.empId === it.empId && a.date === it.date; });
        if (!att) { att = { empId: it.empId, date: it.date, in: null, out: null, status: 'PRESENT', source: 'FIX' }; db.attendance.push(att); }
        if (it.field === 'เวลาเข้างาน') att.in = it.newValue; else att.out = it.newValue;
        att.source = 'FIX';
      }
      var tu = userOfEmp(it.empId);
      if (tu) notify(tu.id, actionText, 'คำขอ ' + it.id + ' ' + actionText + 'โดย ' + byName, it.typeId ? '#/leave' : it.field ? '#/attendance' : '#/ot');
      audit(status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'REQUEST_INFO', actionText + ' ' + it.id);
      saveDB(); closeModal();
      toast(actionText + 'เรียบร้อย · แจ้งพนักงานแล้ว', status === 'REJECTED' ? 'info' : 'success');
      // PERF: เอาเฉพาะการ์ดที่จัดการแล้วออก + อัปเดตตัวเลขบนแท็บ (ผลลัพธ์บนจอเท่าเดิมกับ re-render ทั้งหน้า)
      var card = el.querySelector('[data-approve="' + it.id + '"]');
      card = card ? card.closest('.req-card') : null;
      if (card && status !== 'NEED_MORE_INFO') {
        card.remove();
        [['leave', db.leaves], ['ot', db.ots], ['fix', db.corrections]].forEach(function (t, i) {
          var btn = el.querySelectorAll('.tab')[i];
          if (!btn) return;
          var n = t[1].filter(function (x) { return x.status === 'PENDING'; }).length;
          var bd = btn.querySelector('.tab-badge');
          if (n && bd) bd.textContent = n;
          else if (n && !bd) btn.insertAdjacentHTML('beforeend', ' <span class="tab-badge">' + n + '</span>');
          else if (!n && bd) bd.remove();
        });
        if (!el.querySelector('.req-card')) viewApprovals(el); // หมดรายการ → แสดง empty state เดิม
      } else viewApprovals(el);
      refreshMenuBadge();
    }

    if (action === 'APPROVE') {
      confirmDialog('อนุมัติรายการ', 'อนุมัติคำขอ <b>' + esc(id) + '</b> ของ <b>' + esc(empName(it.empId)) + '</b> ใช่หรือไม่', 'อนุมัติ', function () {
        finish('APPROVED', 'อนุมัติ');
      });
    } else if (action === 'REJECT') {
      openModal('ไม่อนุมัติ · ' + esc(id),
        '<label class="field"><span>เหตุผลที่ไม่อนุมัติ <i class="req">*</i></span><textarea id="rj-reason" rows="3" placeholder="จำเป็นต้องระบุเหตุผล"></textarea></label><div class="form-error" id="rj-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="rj-cancel">ยกเลิก</button><button class="btn btn-danger" id="rj-ok">ยืนยันไม่อนุมัติ</button>');
      document.getElementById('rj-cancel').onclick = closeModal;
      document.getElementById('rj-ok').onclick = function () {
        var r = document.getElementById('rj-reason').value.trim();
        if (!r) { document.getElementById('rj-err').textContent = 'กรุณาระบุเหตุผล'; return; }
        finish('REJECTED', 'ไม่อนุมัติ', r);
      };
    } else {
      openModal('ขอข้อมูลเพิ่ม · ' + esc(id),
        '<label class="field"><span>ข้อมูลที่ต้องการเพิ่ม <i class="req">*</i></span><textarea id="mi-note" rows="3" placeholder="เช่น ขอใบรับรองแพทย์เพิ่มเติม"></textarea></label><div class="form-error" id="mi-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="mi-cancel">ยกเลิก</button><button class="btn btn-primary" id="mi-ok">ส่งคำถาม</button>');
      document.getElementById('mi-cancel').onclick = closeModal;
      document.getElementById('mi-ok').onclick = function () {
        var r = document.getElementById('mi-note').value.trim();
        if (!r) { document.getElementById('mi-err').textContent = 'กรุณาระบุข้อมูลที่ต้องการ'; return; }
        finish('NEED_MORE_INFO', 'ขอข้อมูลเพิ่ม', r);
      };
    }
  }

  /* ================= VIEW: PAYROLL ================= */
  var prSel = null;
  /* ---- จุดเชื่อม "รายการเงินเดือน" เข้ากับการคำนวณเดิม (Single Source of Truth)
     อ่านจาก njhr_pay_entry_totals ซึ่งเป็นชุดข้อมูลเดียวกับหน้า ระบบ > ตั้งค่า > รายการเงินเดือน
     - รายการที่ตั้งเป็น calc_type='SYSTEM' (OT, ปกส., ภาษี, สาย, ขาดงาน, หักลา) ถูกกันไม่ให้กรอกยอด
       ตั้งแต่ระดับฐานข้อมูล จึงไม่มีทางเกิดยอดซ้ำกับสูตรเดิม
     - รายการที่เหลือถูกใส่ลง entry.incomes[] / entry.deducts[] ซึ่งสลิปเดิมรองรับอยู่แล้ว
     - ไม่แก้สูตร base/allowance/ot/sso/tax เดิมแม้แต่บรรทัดเดียว */
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  // คืน Promise ของ map: employee_id -> { earning, deduction, items[] }
  /* ---------- ชั่วโมง OT ที่อนุมัติแล้วของงวดนั้น — จาก Supabase เท่านั้น ----------
     RPC: njhr_ot_report (มีอยู่แล้วบน Production · ไม่สร้างใหม่)
       คืนข้อมูล "รายรายการงาน" (1 แถว = 1 JOB) พร้อม job_date · job_hours · employee_id
       จึงตรงกับสูตรเดิมของ Payroll ที่นับจากรายการงาน ไม่ใช่ชั่วโมงรวมระดับคำขอ

     ⚠ ป้องกันการบวกซ้ำ: รวมด้วย job_hours เท่านั้น ห้ามใช้ request_hours
        OT 18:00–21:00 = 3 ชม. แยกเป็น JOB A 1.5 + JOB B 1.5 → รวมได้ 3 ไม่ใช่ 6
     ⚠ ห้าม fallback ไป db.ots — RPC ล้มเหลว = โยน error ให้ผู้เรียกแสดงและไม่คำนวณ

     ช่วงวันที่ = วันแรกถึงวันสุดท้ายของงวด (เดือน/ปีเดิมของ Payroll ไม่เปลี่ยน Business Logic)
     p_status = 'APPROVED' ให้เซิร์ฟเวอร์กรอง — Pending/Rejected/Cancelled ไม่ถูกส่งมา
     ดึงเป็นช่วง ๆ ตาม total_count เพราะ RPC มีเพดาน p_limit สูงสุด 5000 แถว */
  var PR_OT_PAGE = 2000;

  function prMonthRange(year, month) {
    var last = new Date(year, month, 0).getDate();
    return { from: year + '-' + pad(month) + '-01', to: year + '-' + pad(month) + '-' + pad(last) };
  }

  function prFetchOtHours(year, month) {
    if (!sbReady() || !sbToken()) {
      return Promise.reject(new Error('ยังไม่ได้เชื่อมต่อ Supabase'));
    }
    var r = prMonthRange(year, month);
    var map = {}, seen = 0;

    function page(offset) {
      return sbRpcList('njhr_ot_report', {
        p_token: sbToken(), p_from: r.from, p_to: r.to, p_status: 'APPROVED',
        p_dept: null, p_employee: null, p_q: null,
        p_limit: PR_OT_PAGE, p_offset: offset
      }).then(function (rows) {
        rows = rows || [];
        var total = rows.length ? Number(rows[0].total_count) || 0 : 0;
        rows.forEach(function (j) {
          var id = j.employee_id;
          if (!id) return;
          map[id] = round2((map[id] || 0) + (Number(j.job_hours) || 0));
        });
        seen += rows.length;
        if (rows.length === PR_OT_PAGE && seen < total) return page(offset + PR_OT_PAGE);
        return map;
      });
    }
    return page(0);
  }

  function prFetchPayItems(year, month) {
    if (!sbReady() || !sbToken()) return Promise.resolve({});
    return sbRpcList('njhr_pay_entry_totals', {
      p_token: sbToken(), p_year: year, p_month: month, p_employee: null
    }).then(function (rows) {
      var map = {};
      rows.forEach(function (r) {
        map[r.employee_id] = {
          earning: round2(r.earning_total),
          deduction: round2(r.deduction_total),
          items: Array.isArray(r.items) ? r.items : []
        };
      });
      return map;
    });
  }

  // รวมรายการเงินเดือนเข้ากับ entry ที่คำนวณด้วยสูตรเดิมแล้ว
  function prApplyPayItems(en, pack) {
    if (!pack) return en;
    var inc = [], ded = [];
    pack.items.forEach(function (it) {
      var row = { name: it.name, amount: round2(it.amount), code: it.code, slip: it.slip !== false };
      if (it.kind === 'EARNING') inc.push(row); else ded.push(row);
    });
    en.incomes = (en.incomes || []).concat(inc);      // สลิปเดิมอ่าน field นี้อยู่แล้ว
    en.deducts = (en.deducts || []).concat(ded);
    en.itemEarning = pack.earning;
    en.itemDeduction = pack.deduction;
    en.earnings   = round2(en.earnings + pack.earning);
    en.deductions = round2(en.deductions + pack.deduction);
    en.net        = round2(en.earnings - en.deductions);
    return en;
  }

  function viewPayroll(el) {
    // บั๊กเดิม: ถ้ายังไม่มีงวดเงินเดือนเลย (production) db.payroll[-1] = undefined → หน้าเงินเดือนพัง
    // แก้แบบน้อยที่สุด: สร้างงวดของเดือนปัจจุบันเป็น DRAFT ไม่แตะงวดเดิมที่มีอยู่
    if (!db.payroll.length) {
      var _n = new Date();
      db.payroll.push({ month: _n.getMonth() + 1, year: _n.getFullYear(), status: 'DRAFT', entries: [] });
      saveDB();
    }
    if (!prSel) { var last = db.payroll[db.payroll.length - 1]; prSel = { m: last.month, y: last.year }; }
    var pr = db.payroll.find(function (p) { return p.month === prSel.m && p.year === prSel.y; });
    var months = db.payroll.map(function (p) { return { m: p.month, y: p.year }; });

    el.innerHTML =
      '<div class="toolbar">' +
      '<select id="pr-month">' + months.map(function (x) {
        return '<option value="' + x.m + '-' + x.y + '"' + (x.m === prSel.m && x.y === prSel.y ? ' selected' : '') + '>' + fmtMonthYear(x.m, x.y) + '</option>';
      }).join('') + '</select>' +
      (pr ? statusBadge(pr.status) : '') + '<span class="grow"></span>' +
      (pr && pr.status === 'DRAFT' ? '<button class="btn btn-primary" id="pr-calc">คำนวณเงินเดือน</button>' : '') +
      (pr && pr.status === 'CALCULATED' ? '<button class="btn btn-primary" id="pr-confirm">ยืนยันรอบเงินเดือน</button>' : '') +
      (pr && pr.entries.length ? '<button class="btn btn-ghost" id="pr-export">' + icon('download') + ' Export</button>' : '') +
      '</div>' +
      '<div class="card p0">' +
      (pr && pr.entries.length ?
        '<div class="table-wrap"><table><thead><tr><th>พนักงาน</th><th class="ta-r">รายรับรวม</th><th class="ta-r">รายการหัก</th><th class="ta-r">เงินสุทธิ</th><th class="ta-r"></th></tr></thead><tbody>' +
        pr.entries.map(function (en) {
          return '<tr><td><div class="cell-user">' + avatarHTML(empName(en.empId), 32) + '<div><b>' + esc(empName(en.empId)) + '</b><small>' + esc((emp(en.empId) || {}).code || '') + '</small></div></div></td>' +
            '<td class="ta-r">' + money(en.earnings) +
            (en.itemEarning ? '<br><small class="t-green">+ รายการเงินเพิ่ม ' + money(en.itemEarning) + '</small>' : '') + '</td>' +
            '<td class="ta-r t-red">-' + money(en.deductions) +
            (en.itemDeduction ? '<br><small class="t-red">+ รายการเงินหัก ' + money(en.itemDeduction) + '</small>' : '') + '</td>' +
            '<td class="ta-r"><b>' + money(en.net) + '</b></td>' +
            '<td class="ta-r"><button class="btn btn-ghost btn-sm" data-slip="' + en.empId + '">รายละเอียด</button></td></tr>';
        }).join('') +
        '<tr class="row-total"><td><b>รวม ' + pr.entries.length + ' คน</b></td>' +
        '<td class="ta-r"><b>' + money(pr.entries.reduce(function (s, x) { return s + x.earnings; }, 0)) + '</b></td>' +
        '<td class="ta-r t-red"><b>-' + money(pr.entries.reduce(function (s, x) { return s + x.deductions; }, 0)) + '</b></td>' +
        '<td class="ta-r"><b>' + money(pr.entries.reduce(function (s, x) { return s + x.net; }, 0)) + '</b></td><td></td></tr>' +
        '</tbody></table></div>'
        : emptyState('รอบนี้ยังไม่ได้คำนวณ กด "คำนวณเงินเดือน" เพื่อสร้างรายการ')) + '</div>' +
      '<p class="muted note">หลังยืนยันรอบเงินเดือนแล้วจะแก้ตัวเลขโดยตรงไม่ได้ (Production: สร้าง Adjustment พร้อมเหตุผล + Audit Log)</p>';

    document.getElementById('pr-month').onchange = function () {
      var v = this.value.split('-'); prSel = { m: parseInt(v[0], 10), y: parseInt(v[1], 10) }; viewPayroll(el);
    };
    var calcBtn = document.getElementById('pr-calc');
    if (calcBtn) calcBtn.onclick = function () {
      confirmDialog('คำนวณเงินเดือน', 'คำนวณเงินเดือนงวด <b>' + fmtMonthYear(pr.month, pr.year) + '</b> จากฐานเงินเดือน + OT ที่อนุมัติแล้ว + รายการเงินเดือนที่กำหนดไว้ ใช่หรือไม่', 'คำนวณ', function () {
        /* ชั่วโมง OT มาจาก Supabase (njhr_ot_report) ไม่ใช่ db.ots อีกต่อไป
           โหลดพร้อมรายการเงินเดือน — ตัวใดตัวหนึ่งล้ม = ไม่คำนวณทั้งงวด ไม่ fallback ไป Local */
        Promise.all([
          prFetchOtHours(pr.year, pr.month),
          prFetchPayItems(pr.year, pr.month)
        ]).then(function (res) {
          var otMap = res[0], map = res[1];
          // สูตรเดิมทุกบรรทัด (base + allowance + OT · ปกส. 5% เพดาน 750 · ภาษี) — ไม่แก้
          var baseEntries = db.employees.filter(function (x) { return x.status === 'ACTIVE'; }).map(function (x) {
            // ชั่วโมงรวมรายพนักงานของงวดนี้ — รวมจาก job_hours ระดับรายการงานแล้วฝั่งผู้โหลด
            var otHours = Number(otMap[x.id]) || 0;
            var otAmt = Math.round(x.baseSalary / 30 / 8 * 1.5 * otHours);
            var gross = x.baseSalary + x.allowance + otAmt;
            var sso = Math.min(Math.round(x.baseSalary * 0.05), 750);
            var tax = x.baseSalary > 50000 ? Math.round(x.baseSalary * 0.03) : 0;
            return { empId: x.id, base: x.baseSalary, allowance: x.allowance, ot: otAmt, earnings: gross, sso: sso, tax: tax, otherDeduct: 0, deductions: sso + tax, net: gross - sso - tax };
          });
          // แล้วค่อยบวก-หักรายการเงินเดือนของงวดนั้นทับลงไป (ชุดข้อมูลเดียวกับหน้ารายการเงินเดือน)
          pr.entries = baseEntries.map(function (en) { return prApplyPayItems(en, map[en.empId]); });
          pr.status = 'CALCULATED';
          audit('PAYROLL_CALC', 'คำนวณเงินเดือน ' + fmtMonthYear(pr.month, pr.year));
          saveDB();
          toast('คำนวณเงินเดือนแล้ว ' + pr.entries.length + ' คน');
          viewPayroll(el);
        }).catch(function (er) {
          // โหลด OT หรือรายการเงินเดือนไม่ได้ = ไม่คำนวณ (กันยอดผิดโดยไม่รู้ตัว) และไม่ fallback ไป db.ots
          console.error('[PAYROLL] โหลดข้อมูลคำนวณจาก Supabase ล้มเหลว:', er);
          toast('โหลดข้อมูลคำนวณจาก Supabase ไม่สำเร็จ: ' + ((er && er.message) || er) + ' — ยังไม่คำนวณ', 'error');
        });
      });
    };
    var cfBtn = document.getElementById('pr-confirm');
    if (cfBtn) cfBtn.onclick = function () {
      confirmDialog('ยืนยันรอบเงินเดือน', 'ยืนยันงวด <b>' + fmtMonthYear(pr.month, pr.year) + '</b>? หลังยืนยันจะสร้างสลิปและแก้ตัวเลขโดยตรงไม่ได้', 'ยืนยัน', function () {
        pr.status = 'CONFIRMED';
        pr.confirmedBy = empName((currentEmp() || {}).id) || currentUser().username;
        db.users.forEach(function (uu) { if (uu.active && uu.empId) notify(uu.id, 'สลิปเงินเดือนพร้อมดู', 'สลิปงวด ' + fmtMonthYear(pr.month, pr.year) + ' ออกแล้ว', '#/epayslip'); });
        audit('PAYROLL_CONFIRM', 'ยืนยันเงินเดือน ' + fmtMonthYear(pr.month, pr.year));
        saveDB(); toast('ยืนยันรอบเงินเดือนแล้ว · สลิปพร้อมให้พนักงานดู'); viewPayroll(el);
      });
    };
    var exBtn = document.getElementById('pr-export');
    if (exBtn) exBtn.onclick = function () {
      downloadCSV('payroll-' + pr.year + '-' + pad(pr.month) + '.csv',
        [['รหัส', 'ชื่อ', 'ฐานเงินเดือน', 'สวัสดิการ', 'OT', 'รายรับรวม', 'ปกส.', 'ภาษี', 'หักรวม', 'สุทธิ']].concat(
          pr.entries.map(function (en) {
            var x = emp(en.empId);
            return [x.code, empName(en.empId), en.base, en.allowance, en.ot, en.earnings, en.sso, en.tax, en.deductions, en.net];
          })));
      audit('EXPORT', 'Export เงินเดือน ' + fmtMonthYear(pr.month, pr.year)); toast('ดาวน์โหลดไฟล์แล้ว');
    };
    el.querySelectorAll('[data-slip]').forEach(function (b) {
      b.onclick = function () { showEPayslip(pr, this.dataset.slip); };
    });
  }

  /* ================= VIEW: PAYSLIPS ================= */
  /* ================= VIEW: E-PAYSLIP (สลิปเงินเดือนดีไซน์ใหม่) ================= */
  // แยกจากโหมดสลิปเดิม 100% — ใช้ข้อมูลเงินเดือน/พนักงานจากระบบเดิมทั้งหมด ไม่สร้างข้อมูลใหม่
  /* ================= VIEW: E-PAYSLIP =================
     อ่านจากตาราง payroll จริงผ่าน RPC njhr_slip_* (ไม่ใช้ db.payroll ใน localStorage อีก)
     ลำดับการทำงาน: วาดโครงหน้าก่อนเสมอ → Loading → ดึงข้อมูล → ตาราง / ไม่พบข้อมูล / ผิดพลาด+ลองใหม่
     ไม่มีเส้นทางไหนที่ทำให้หน้าว่างเปล่า */
  var epState = { year: null, month: null, q: '', dept: '', pos: '', status: '', page: 0, per: 100, seq: 0 };
  var epPeriods = [], epRows = [], epFilters = { DEPARTMENT: [], POSITION: [] };
  var epSel = {};                       // payroll_id ที่เลือกไว้

  function epIsAdmin() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }

  function viewEPayslip(el) {
    var seq = ++epState.seq, admin = epIsAdmin();
    epSel = {};

    // ---- 1) วาดโครงหน้าก่อนเสมอ
    el.innerHTML =
      '<div class="card"><div class="card-head"><h3>สลิปเงินเดือน (E-PAYSLIP)' +
      (admin ? '' : ' ของฉัน') + '</h3></div>' +
      '<div class="toolbar ep-filters">' +
      '<select id="ep-period"><option value="">— กำลังโหลดงวดเงินเดือน —</option></select>' +
      (admin
        ? '<select id="ep-dept"><option value="">ทุกแผนก</option></select>' +
          '<select id="ep-pos"><option value="">ทุกตำแหน่ง</option></select>' +
          '<select id="ep-status">' +
          [['', 'ทุกสถานะ'], ['PAID', 'จ่ายแล้ว'], ['UNPAID', 'ยังไม่จ่าย'], ['NONE', 'ไม่มีข้อมูลเงินเดือน']]
            .map(function (x) { return '<option value="' + x[0] + '"' + (epState.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') +
          '</select>' +
          '<span class="ep-qbox">' + icon('search', 'ic-sm') +
          '<input id="ep-q" placeholder="ค้นหาชื่อ นามสกุล ชื่อเล่น หรือรหัสพนักงาน..." value="' + esc(epState.q) + '"></span>' +
          '<button class="btn btn-ghost btn-sm" id="ep-clear">ล้างตัวกรอง</button>'
        : '') +
      '<span class="grow"></span><span class="muted" id="ep-count"></span>' +
      '<button class="btn btn-ghost btn-sm" id="ep-reload">' + icon('history') + ' โหลดใหม่</button></div>' +
      '</div>' +
      (admin ? '<div class="card ep-bulk" id="ep-bulk" hidden></div>' : '') +
      '<div class="card p0" id="ep-panel"></div>' +
      '<div class="form-error" id="ep-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('ep-reload').onclick = function () { viewEPayslip(el); };
    if (admin) {
      document.getElementById('ep-clear').onclick = function () {
        epState.q = ''; epState.dept = ''; epState.pos = ''; epState.status = ''; epState.page = 0;
        viewEPayslip(el);
      };
      document.getElementById('ep-status').onchange = function () {
        epState.status = this.value; epState.page = 0; epSel = {}; epLoadList(el, ++epState.seq);
      };
      document.getElementById('ep-q').oninput = debounce(function () {
        epState.q = this.value; epState.page = 0; epSel = {}; epLoadList(el, ++epState.seq);
        var q2 = document.getElementById('ep-q');
        if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
      }, 300);
    }

    epPanel('<div class="ep-state"><span class="spinner"></span> กำลังโหลดข้อมูล E-PAYSLIP…</div>');
    if (!sbReady()) { epError(el, 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }

    sbRpcList('njhr_slip_periods', { p_token: sbToken() }).then(function (ps) {
      if (seq !== epState.seq) return;
      epPeriods = ps || [];
      var sel = document.getElementById('ep-period');
      if (!epPeriods.length) {
        if (sel) sel.innerHTML = '<option value="">— ยังไม่มีงวดเงินเดือน —</option>';
        epPanel(emptyState('ไม่พบข้อมูล E-PAYSLIP'));
        epCount('');
        return;
      }
      var found = epPeriods.some(function (p) {
        return p.period_year === epState.year && p.period_month === epState.month;
      });
      if (!found) { epState.year = epPeriods[0].period_year; epState.month = epPeriods[0].period_month; }
      if (sel) {
        sel.innerHTML = epPeriods.map(function (p) {
          return '<option value="' + p.period_year + '-' + p.period_month + '"' +
            (p.period_year === epState.year && p.period_month === epState.month ? ' selected' : '') + '>' +
            esc(TH_MONTHS[p.period_month - 1] + ' ' + (p.period_year + 543)) +
            ' · ' + p.rows_count + ' รายการ' +
            (p.status === 'PAID' ? ' · จ่ายแล้ว' : p.status === 'CALCULATED' ? ' · คำนวณแล้ว' : ' · ร่าง') + '</option>';
        }).join('');
        sel.onchange = function () {
          var v = String(this.value).split('-');
          epState.year = parseInt(v[0], 10); epState.month = parseInt(v[1], 10);
          epState.page = 0;
          epSel = {};                                   // เปลี่ยนงวด = ล้างรายการที่เลือก
          epLoadList(el, ++epState.seq);
        };
      }
      if (admin) epLoadFilters();
      epLoadList(el, seq);
    }).catch(function (er) {
      if (seq !== epState.seq) return;
      console.error('[E-PAYSLIP] njhr_slip_periods ล้มเหลว:', er);
      epError(el, er.message || 'ไม่ทราบสาเหตุ');
    });
  }

  // ตัวเลือกแผนก/ตำแหน่งจากข้อมูลจริง (ไม่ hardcode)
  function epLoadFilters() {
    sbRpcList('njhr_slip_filters', { p_token: sbToken(), p_year: epState.year, p_month: epState.month })
      .then(function (rows) {
        epFilters = { DEPARTMENT: [], POSITION: [] };
        (rows || []).forEach(function (r) { if (epFilters[r.kind]) epFilters[r.kind].push(r); });
        function fill(id, list, cur, all) {
          var sel = document.getElementById(id);
          if (!sel) return;
          sel.innerHTML = '<option value="">' + all + '</option>' + list.map(function (r) {
            return '<option value="' + esc(r.value) + '"' + (cur === r.value ? ' selected' : '') + '>' +
              esc(r.value) + ' (' + r.cnt + ')</option>';
          }).join('');
        }
        fill('ep-dept', epFilters.DEPARTMENT, epState.dept, 'ทุกแผนก');
        fill('ep-pos', epFilters.POSITION, epState.pos, 'ทุกตำแหน่ง');
        var d = document.getElementById('ep-dept'), p2 = document.getElementById('ep-pos');
        if (d) d.onchange = function () { epState.dept = this.value; epState.page = 0; epSel = {}; epLoadList(null, ++epState.seq); };
        if (p2) p2.onchange = function () { epState.pos = this.value; epState.page = 0; epSel = {}; epLoadList(null, ++epState.seq); };
      }).catch(function (er) { console.error('[E-PAYSLIP] njhr_slip_filters ล้มเหลว:', er); });
  }

  function epPanel(html) { var b = document.getElementById('ep-panel'); if (b) b.innerHTML = html; }
  function epCount(t) { var b = document.getElementById('ep-count'); if (b) b.textContent = t; }
  function epError(el, detail) {
    epPanel('<div class="ep-state ep-state-bad">' +
      '<b>ไม่สามารถโหลดข้อมูล E-PAYSLIP ได้</b>' +
      '<small class="muted">' + esc(detail || '') + '</small>' +
      '<button class="btn btn-primary btn-sm" id="ep-retry">' + icon('history') + ' ลองใหม่</button></div>');
    epCount('');
    var b = document.getElementById('ep-retry');
    if (b) b.onclick = function () { viewEPayslip(el); };
  }

  // เลือกได้เฉพาะคนที่มีข้อมูลเงินเดือน
  function epSelectable() { return epRows.filter(function (r) { return r.has_payroll && r.payroll_id; }); }
  function epSelectedIds() { return Object.keys(epSel).filter(function (k) { return epSel[k]; }); }

  function epSyncBulk() {
    var ids = epSelectedIds(), box = document.getElementById('ep-bulk');
    var all = epSelectable();
    // หัวตาราง: ครบ / บางส่วน (indeterminate) / ไม่เลือก
    var head = document.getElementById('ep-all');
    if (head) {
      var picked = all.filter(function (r) { return epSel[r.payroll_id]; }).length;
      head.checked = all.length > 0 && picked === all.length;
      head.indeterminate = picked > 0 && picked < all.length;
      head.disabled = all.length === 0;
    }
    if (!box) return;
    if (!ids.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML =
      '<div class="toolbar ep-bulk-bar"><b>เลือกแล้ว ' + ids.length + ' คน</b>' +
      '<span class="grow"></span>' +
      '<button class="btn btn-primary btn-sm" id="ep-bulk-open">' + icon('fileText') + ' เปิดสลิปที่เลือก</button>' +
      '<button class="btn btn-ghost btn-sm" id="ep-bulk-pdf">' + icon('download') + ' Export PDF ที่เลือก</button>' +
      '<button class="btn btn-ghost btn-sm" id="ep-bulk-send">' + icon('send') + ' ส่งสลิปที่เลือก</button>' +
      '<button class="btn btn-ghost btn-sm" id="ep-bulk-clear">ยกเลิกการเลือก</button></div>';
    document.getElementById('ep-bulk-open').onclick = function () { epBulkPrint(this, false); };
    document.getElementById('ep-bulk-pdf').onclick = function () { epBulkPrint(this, true); };
    document.getElementById('ep-bulk-send').onclick = function () { epBulkSend(); };
    document.getElementById('ep-bulk-clear').onclick = function () {
      epSel = {};
      document.querySelectorAll('#ep-panel [data-ep-pick]').forEach(function (c) { c.checked = false; });
      epSyncBulk();
    };
  }

  function epLoadList(el, seq) {
    var s = epState, admin = epIsAdmin();
    epPanel('<div class="ep-state"><span class="spinner"></span> กำลังโหลดรายการสลิป…</div>');
    var errEl = document.getElementById('ep-err');
    if (errEl) errEl.textContent = '';
    sbRpcList('njhr_slip_list', {
      p_token: sbToken(), p_year: s.year, p_month: s.month, p_q: s.q || null,
      p_dept: s.dept || null, p_position: s.pos || null, p_status: s.status || null,
      p_limit: s.per, p_offset: s.page * s.per
    }).then(function (rows) {
      if (seq !== epState.seq) return;
      epRows = rows || [];
      if (!epRows.length) { epPanel(emptyState('ไม่พบข้อมูล E-PAYSLIP')); epCount(''); epSyncBulk(); return; }
      var total = Number(epRows[0].total_count) || epRows.length;
      var pages = Math.max(1, Math.ceil(total / s.per));

      function badge(r) {
        return r.slip_status === 'PAID' ? '<span class="badge badge-ok">จ่ายแล้ว</span>'
          : r.slip_status === 'UNPAID' ? '<span class="badge badge-warn">ยังไม่จ่าย</span>'
            : '<span class="badge badge-mut">ไม่มีข้อมูลเงินเดือน</span>';
      }
      function actions(r) {
        var off = r.has_payroll ? '' : ' disabled';
        return '<button class="btn-icon ep-act" data-ep-open="' + esc(r.payroll_id || '') + '"' + off +
            ' aria-label="ดูสลิป" title="ดูสลิป">' + icon('eye') + '</button>' +
          '<button class="btn-icon ep-act" data-ep-pdf="' + esc(r.payroll_id || '') + '"' + off +
            ' aria-label="ดาวน์โหลด PDF" title="ดาวน์โหลด PDF">' + icon('download') + '</button>' +
          (admin ? '<button class="btn-icon ep-act" data-ep-send="' + esc(r.payroll_id || '') + '"' + off +
            ' aria-label="ส่งอีเมล" title="ส่งอีเมล">' + icon('send') + '</button>' : '');
      }

      epPanel(
        (admin
          ? '<div class="ep-selbar"><label class="ep-allbox"><input type="checkbox" id="ep-all">' +
            '<span>เลือกทั้งหมดที่แสดง</span></label>' +
            '<span class="grow"></span><span class="muted">' + epRows.length + ' คนในหน้านี้</span></div>'
          : '') +
        // การ์ดต่อพนักงาน 1 ใบ ใช้ทั้ง Desktop และมือถือ ไม่มีตารางเลื่อนซ้ายขวา
        '<div class="ep-grid">' + epRows.map(function (r, i) {
          var has = !!r.has_payroll;
          return '<div class="ep-card' + (has ? '' : ' off') + '">' +
            '<div class="ep-card-h">' +
            (admin ? '<input type="checkbox" class="ep-pick" data-ep-pick="' + esc(r.payroll_id || '') + '"' +
              (has ? '' : ' disabled') + (epSel[r.payroll_id] ? ' checked' : '') + '>' : '') +
            avatarHTML(r.emp_name || '', 40) +
            '<div class="grow"><b>' + esc(r.emp_name || '—') +
            (r.nickname ? ' <small class="ep-nick">(' + esc(r.nickname) + ')</small>' : '') + '</b>' +
            '<small>' + esc(r.emp_code || '—') + ' · ' + esc(r.department || '—') + '</small></div>' +
            '<span class="ep-no">#' + (s.page * s.per + i + 1) + '</span></div>' +
            '<div class="ep-net"><small>เงินเดือนสุทธิ</small>' +
            '<b>' + (has ? '฿ ' + money(r.net_pay) : '—') + '</b></div>' +
            '<div class="ep-card-f">' + badge(r) +
            (r.sent_email ? '<span class="chip chip-ok">ส่งแล้ว</span>' : '') +
            '<span class="grow"></span>' + actions(r) + '</div></div>';
        }).join('') + '</div>' +
        (pages > 1
          ? '<div class="toolbar ep-pager"><span class="grow"></span>' +
            '<button class="btn btn-ghost btn-sm" id="ep-prev"' + (s.page === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
            '<span class="muted">หน้า ' + (s.page + 1) + ' / ' + pages + '</span>' +
            '<button class="btn btn-ghost btn-sm" id="ep-next"' + (s.page + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button></div>'
          : ''));
      epCount('ทั้งหมด ' + total + ' คน');
      if (pages > 1) {
        document.getElementById('ep-prev').onclick = function () { s.page--; epSel = {}; epLoadList(el, ++epState.seq); };
        document.getElementById('ep-next').onclick = function () { s.page++; epSel = {}; epLoadList(el, ++epState.seq); };
      }

      var panel = document.getElementById('ep-panel');
      panel.onclick = function (ev) {
        var t = ev.target;
        // เลือกทั้งหมด = เฉพาะรายชื่อที่แสดงอยู่และมีข้อมูลเงินเดือนเท่านั้น
        if (t.id === 'ep-all') {
          var on = t.checked;
          epSelectable().forEach(function (r) { epSel[r.payroll_id] = on; });
          panel.querySelectorAll('[data-ep-pick]').forEach(function (c) { if (!c.disabled) c.checked = on; });
          epSyncBulk();
          return;
        }
        if (t.dataset && t.dataset.epPick !== undefined) {
          if (t.checked) epSel[t.dataset.epPick] = true; else delete epSel[t.dataset.epPick];
          // การ์ดมือถือกับตารางเป็นคนละ element ต้อง sync ให้ตรงกัน
          panel.querySelectorAll('[data-ep-pick="' + t.dataset.epPick + '"]').forEach(function (c) { c.checked = t.checked; });
          epSyncBulk();
          return;
        }
        var b = t.closest ? t.closest('[data-ep-open],[data-ep-pdf],[data-ep-send]') : null;
        if (!b || b.disabled) return;
        if (b.dataset.epOpen) epOpenSlip(b.dataset.epOpen);
        else if (b.dataset.epPdf) epOpenSlip(b.dataset.epPdf, true);
        else epBulkSend([b.dataset.epSend]);
      };
      epSyncBulk();
    }).catch(function (er) {
      if (seq !== epState.seq) return;
      console.error('[E-PAYSLIP] njhr_slip_list ล้มเหลว:', er);
      epError(el, er.message || 'ไม่ทราบสาเหตุ');
    });
  }

  /* ---------- เปิด/พิมพ์สลิปหลายคน (ใช้ Template เดิม) ---------- */
  function epBulkPrint(btn, autoPrint) {
    var ids = epSelectedIds();
    if (!ids.length) return;
    if (btn.disabled) return;
    var label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังเตรียม ' + ids.length + ' ใบ…';
    var area = document.getElementById('payslip-print-area');
    Promise.all(ids.map(function (id) {
      return sbRpc('njhr_slip_get', { p_token: sbToken(), p_payroll_id: id })
        .then(function (r) { return r && r.data; })
        .catch(function (er) { console.error('[E-PAYSLIP] โหลดสลิป ' + id + ' ล้มเหลว:', er); return null; });
    })).then(function (list) {
      var okList = list.filter(Boolean);
      if (!okList.length) throw new Error('โหลดสลิปไม่สำเร็จทั้งหมด');
      // ต่อสลิปทุกใบเป็นเอกสารเดียว หน้าละ 1 คน A4
      area.innerHTML = okList.map(function (d) {
        var r = epRenderSlip({ month: d.period_month, year: d.period_year, paidAt: d.pay_date,
                               entries: [d.entry] }, d.entry.empId, d.emp);
        return r ? '<div class="payslip-a4-page">' + r.html + '</div>' : '';
      }).join('');
      area.setAttribute('aria-hidden', 'false');
      document.body.classList.add('printing-payslip');
      toast('เตรียมสลิป ' + okList.length + ' ใบแล้ว' + (autoPrint ? ' · เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์' : ''));
      return epWithTimeout(function () { window.print(); });
    }).catch(function (ex) {
      var e2 = document.getElementById('ep-err');
      if (e2) e2.textContent = (ex && ex.message) || 'เตรียมสลิปไม่สำเร็จ';
    }).then(function () {
      btn.disabled = false; btn.innerHTML = label;
    });
  }

  /* ---------- บันทึกการส่งสลิป ---------- */
  function epBulkSend(only) {
    var ids = only || epSelectedIds();
    if (!ids.length) return;
    var rows = epRows.filter(function (r) { return ids.indexOf(r.payroll_id) >= 0; });
    var canSend = rows.filter(function (r) { return r.slip_status === 'PAID'; });
    var noData = rows.filter(function (r) { return !r.has_payroll; });
    var already = rows.filter(function (r) { return r.sent_email; });
    var notPaid = rows.filter(function (r) { return r.has_payroll && r.slip_status !== 'PAID'; });
    confirmDialog('ยืนยันส่งสลิปเงินเดือน',
      'งวด <b>' + esc(TH_MONTHS[epState.month - 1] + ' ' + (epState.year + 543)) + '</b><br>' +
      'เลือกไว้ <b>' + rows.length + ' คน</b><br>' +
      'ส่งได้ <b>' + canSend.length + ' คน</b>' +
      (notPaid.length ? ' · ยังไม่จ่าย <b class="t-red">' + notPaid.length + ' คน</b>' : '') +
      (noData.length ? ' · ไม่มีข้อมูล <b class="t-red">' + noData.length + ' คน</b>' : '') +
      (already.length ? '<br><span class="t-red">เคยส่งแล้ว ' + already.length + ' คน — จะถูกบันทึกเป็นส่งซ้ำ</span>' : '') +
      '<br><small class="muted">ระบบจะบันทึกสถานะการส่งไว้ในฐานข้อมูล</small>',
      'ยืนยันส่ง', function () {
        return sbRpcList('njhr_slip_mark_sent', { p_token: sbToken(), p_payroll_ids: ids })
          .then(function (res) {
            var sent = res.filter(function (x) { return x.result === 'ส่งแล้ว'; }).length;
            var again = res.filter(function (x) { return x.result === 'ส่งซ้ำ'; }).length;
            var skip = res.filter(function (x) { return /^ข้าม/.test(x.result); }).length;
            toast('บันทึกการส่งแล้ว · ใหม่ ' + sent + ' · ส่งซ้ำ ' + again + ' · ข้าม ' + skip);
            epSel = {};
            epLoadList(null, ++epState.seq);
          }).catch(function (er) {
            console.error('[E-PAYSLIP] njhr_slip_mark_sent ล้มเหลว:', er);
            var e2 = document.getElementById('ep-err');
            if (e2) e2.textContent = er.message || 'ส่งสลิปไม่สำเร็จ';
          });
      });
  }

  // เปิดสลิป 1 ใบจาก Supabase แล้วส่งให้ตัวเรนเดอร์เดิม (ไม่แก้รูปแบบสลิป)
  function epOpenSlip(payrollId, toPdf) {
    openModal('E-PAYSLIP', '<div class="ep-state"><span class="spinner"></span> กำลังโหลดสลิป…</div>',
      '<button class="btn btn-ghost" id="ep-close">ปิด</button>');
    var cb = document.getElementById('ep-close');
    if (cb) cb.onclick = closeModal;
    sbRpc('njhr_slip_get', { p_token: sbToken(), p_payroll_id: payrollId }).then(function (r) {
      var d = r && r.data;
      if (!d) throw new Error('ไม่พบข้อมูลสลิป');
      closeModal();
      // period/entry/emp จากฐานข้อมูลจริง ส่งเข้ารูปแบบที่ epRenderSlip ใช้อยู่เดิม
      var per = { month: d.period_month, year: d.period_year, paidAt: d.pay_date, entries: [d.entry] };
      if (toPdf) { epPrintPayslip(per, d.entry.empId, d.emp); return; }   // Export PDF = พิมพ์แล้วเลือกบันทึกเป็น PDF
      showEPayslip(per, d.entry.empId, d.emp);
    }).catch(function (er) {
      console.error('[E-PAYSLIP] njhr_slip_get ล้มเหลว:', er);
      var body = document.querySelector('#modal-root .modal-body');
      if (body) body.innerHTML = '<div class="ep-state ep-state-bad"><b>ไม่สามารถโหลดข้อมูล E-PAYSLIP ได้</b>' +
        '<small class="muted">' + esc(er.message || '') + '</small></div>';
    });
  }

  // ฟังก์ชันกลางชุดเดียว: Modal / Preview A4 / Print ใช้ HTML และข้อมูลเดียวกันทั้งหมด
  // ---- E-PAYSLIP: รายการรายได้/รายการหัก อ่านจากฟิลด์จริงของ payroll entry เท่านั้น
  // ฟิลด์ที่ระบบมีจริง: base, allowance, ot, earnings, sso, tax, otherDeduct, deductions, net
  // รายการอื่นแบบ dynamic: entry.incomes[] / entry.deducts[] = [{ name, amount }] (ถ้ามีในข้อมูล)
  // โลโก้บริษัทจริง — ไฟล์ต้นฉบับอยู่ที่ assets/nj-logistic-logo.png (192x94, PNG โปร่งใส)
  // ฝังเป็น data URL เพื่อให้ Preview กับ PDF ใช้รูปเดียวกันและโหลดเสร็จทันทีก่อนสั่งพิมพ์


  function epList(arr) {
    return (Array.isArray(arr) ? arr : []).filter(function (x) { return x && x.name; })
      .map(function (x) { return [String(x.name), epNum(x.amount)]; });
  }
  function epIncome(en) {
    return [
      ['เงินเดือนพื้นฐาน', epNum(en.base)],
      ['ค่าตำแหน่ง', epNum(en.positionPay !== undefined ? en.positionPay : en.allowance)],
      ['ค่าน้ำมัน / ค่าเดินทาง', epNum(en.fuel)],
      ['ค่าโทรศัพท์', epNum(en.phone)],
      ['เบี้ยขยัน', epNum(en.diligence)],
      ['โบนัส', epNum(en.bonus)],
      ['OVER TIME', epNum(en.ot)],
      ['ค่ากะ', epNum(en.shiftPay)]
    ].concat(epList(en.incomes));
  }
  function epDeduct(en) {
    return [
      ['หักลากิจ', epNum(en.deductLeave)],
      ['หักขาดงาน', epNum(en.deductAbsent)],
      ['หักมาสาย', epNum(en.deductLate)],
      ['ปกส. 5%', epNum(en.sso)],
      ['กยศ.', epNum(en.loan)],
      ['ภาษีเงินได้', epNum(en.tax)]
    ].concat(epList(en.deducts))
     .concat(epNum(en.otherDeduct) ? [['รายการหักอื่น', epNum(en.otherDeduct)]] : []);
  }
  // ยอดยิ่งยาว ตัวเลขยิ่งเล็กลงเป็นขั้น — ไม่ต่ำกว่า 18px และไม่ย่อทั้งกล่อง
  function epNetSizeClass(txt) {
    // นับเฉพาะหลักจำนวนเต็ม (ไม่รวมทศนิยม) เช่น 1,250,000.00 = 7 หลัก
    var n = String(txt).split('.')[0].replace(/[^\d]/g, '').length;
    if (n >= 9) return 'ep-net-xs';    // หลักร้อยล้านขึ้นไป → 18px
    if (n >= 8) return 'ep-net-s';     // หลายสิบล้าน → 20px
    if (n >= 7) return 'ep-net-m';     // หลักล้าน → 22px
    return '';                         // ปกติ → 24px
  }
  function epSum(rows) {
    return Math.round(rows.reduce(function (a, r) { return a + r[1]; }, 0) * 100) / 100;
  }

  function epRenderSlip(period, empId, empOverride) {
    if (!period || !period.entries) return null;
    var en = period.entries.find(function (x) { return x.empId === empId; });
    // empOverride = ข้อมูลพนักงานจาก Supabase (ใช้เมื่อ db.employees ว่าง เช่นบน production)
    var e = empOverride || emp(empId);
    if (!en || !e) return null;
    var docNo = 'PS-' + period.year + pad(period.month) + '-' + e.code; // อ้างอิงจากรอบ+รหัสพนักงานจริง
    function epRow(label, val, cls) {
      return '<div class="ep-row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + money(val) + '</span></div>';
    }
    function epInfo(label, val) {
      return '<div class="ep-info"><span>' + label + '</span><span>:</span><b>' + esc(val) + '</b></div>';
    }
    var co = njCompanyParts();
    var html =
      '<div class="ep-head"><img class="ep-logo" src="' + NJ_LOGO_SRC + '" alt="N.J. Logistics &amp; Fruits Logo" width="192" height="94">' +
      '<div class="ep-head-txt"><h2 class="ep-co">' +
      (co.prefix ? '<span class="ep-co-nj">' + esc(co.prefix) + '</span>' : '') +
      '<span class="ep-co-rest">' + esc(co.rest) + '</span></h2>' +
      '<small>E-PAYSLIP</small></div></div>' +
      '<div class="ep-line"></div>' +
      '<div class="ep-cards"><div class="ep-card">' + icon('calendar') + '<div><small>รอบเงินเดือน</small><b>' + fmtMonthYear(period.month, period.year) + '</b></div></div>' +
      '<div class="ep-card">' + icon('wallet') + '<div><small>วันที่จ่ายเงิน</small><b>' + (period.paidAt ? fmtDate(period.paidAt) : 'รอกำหนด') + '</b></div></div>' +
      '<div class="ep-card">' + icon('fileText') + '<div><small>เลขที่เอกสาร</small><b>' + esc(docNo) + '</b></div></div></div>' +
      '<div class="ep-emp"><div class="ep-emp-head">' + icon('users') + ' ข้อมูลพนักงาน</div><div class="ep-emp-grid">' +
      '<div>' + epInfo('รหัสพนักงาน', e.code) +
      epInfo('ชื่อ-นามสกุล', (e.title || '') + (e.firstName || '') + ' ' + (e.lastName || '')) +
      epInfo('แผนก', e.department || dept(e.deptId)) + '</div>' +
      '<div>' + epInfo('ตำแหน่ง', e.position || '-') + epInfo('ประเภทพนักงาน', e.empType || 'พนักงานประจำ') + epInfo('วันที่เริ่มงาน', e.hireDate ? fmtDate(e.hireDate) : '-') + '</div>' +
      '</div></div>' +
      '<div class="ep-cols">' +
      // ---- ฝั่งซ้าย: รายได้ (อ่านจากฟิลด์จริงของงวดที่เลือกเท่านั้น ไม่สร้างตัวเลขเอง)
      '<div class="ep-box"><div class="ep-box-head ep-blue">' + icon('wallet') + ' รายได้<span>จำนวนเงิน (บาท)</span></div>' +
      epIncome(en).map(function (x) { return epRow(x[0], x[1]); }).join('') +
      epRow('รวมรายได้ (TOTAL INCOME)', epSum(epIncome(en)), 'ep-sum ep-sum-blue') + '</div>' +
      // ---- ฝั่งขวา: รายการหัก
      '<div class="ep-box"><div class="ep-box-head ep-red">' + icon('fileText') + ' รายการหัก<span>จำนวนเงิน (บาท)</span></div>' +
      epDeduct(en).map(function (x) { return epRow(x[0], x[1]); }).join('') +
      epRow('รวมรายการหัก (TOTAL DEDUCTION)', epSum(epDeduct(en)), 'ep-sum ep-sum-red') + '</div></div>' +
      '<div class="ep-net"><span class="ep-net-ic">' + icon('wallet') + '</span><div class="ep-net-label"><b>เงินได้สุทธิ</b><small>(NET PAY)</small></div>' +
      '<div class="ep-net-val ' + epNetSizeClass(money(epNum(en.net))) + '">' +
      '<span class="ep-net-num">' + money(epNum(en.net)) + '</span><small>บาท</small></div></div>' +
      // เตือนเมื่อ รวมรายได้ − รวมรายการหัก ไม่ตรงยอดสุทธิใน payroll (ไม่แก้ตัวเลข แค่แจ้ง)
      (Math.abs((epSum(epIncome(en)) - epSum(epDeduct(en))) - epNum(en.net)) > 0.005
        ? '<div class="ot-warn">ยอดคำนวณจากรายการ (' + money(epSum(epIncome(en)) - epSum(epDeduct(en))) +
          ') ไม่ตรงกับยอดสุทธิในระบบเงินเดือน (' + money(en.net) + ') — แสดงยอดจากระบบเงินเดือนเป็นหลัก</div>' : '') +
      '<div class="ep-foot">' + icon('check') + ' เอกสารนี้สร้างจากระบบอัตโนมัติ (Electronic Payslip) ไม่ต้องลงลายมือชื่อ</div>';
    return { html: html, e: e, en: en, docNo: docNo };
  }
  // รอ Font/รูปภาพก่อนพิมพ์ (กัน Print Preview หน้าเปล่า)
  function epWaitFonts() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready.catch(function () { /* รอ font ไม่สำเร็จ — พิมพ์ต่อได้ */ });
    }
    return Promise.resolve();
  }
  // กันค้าง: ถ้ารอเกินเวลาที่กำหนดให้พิมพ์ต่อ (ตัวหลักยังเป็น load/decode ไม่ใช่การเดาเวลา)
  function epWithTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (res) { setTimeout(res, ms); })]);
  }
  function epWaitImages(container) {
    var imgs = Array.prototype.slice.call(container.querySelectorAll('img'));
    return Promise.all(imgs.map(function (img) {
      function decoded() {
        // decode() รับประกันว่ารูปพร้อมวาดจริง ไม่ใช่แค่ดาวน์โหลดเสร็จ
        return (typeof img.decode === 'function')
          ? img.decode().catch(function () { }) : Promise.resolve();
      }
      if (img.complete && img.naturalWidth > 0) return decoded();
      return new Promise(function (res) {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      }).then(decoded);
    }));
  }
  // พิมพ์ผ่าน Print Container ใต้ body โดยตรง (ห้ามพิมพ์จาก Modal/Overlay)
  function epPrintPayslip(period, empId, empOverride) {
    var area = document.getElementById('payslip-print-area');
    if (!area) { toast('ไม่สามารถเตรียมข้อมูลสลิปสำหรับพิมพ์ได้', 'error'); return Promise.resolve(); }
    var r = epRenderSlip(period, empId, empOverride);
    if (!r) { toast('ไม่พบข้อมูลสลิปสำหรับพิมพ์', 'error'); return Promise.resolve(); }
    area.innerHTML = '<div class="payslip-a4-page"><div class="epayslip">' + r.html + '</div></div>';
    if (!area.innerHTML.trim()) { toast('ไม่พบข้อมูลสลิปสำหรับพิมพ์', 'error'); return Promise.resolve(); }
    document.body.classList.add('printing-payslip');
    audit('EPAYSLIP_PRINT', 'พิมพ์/บันทึก PDF สลิป ' + r.e.code + ' ' + fmtMonthYear(period.month, period.year));
    // เบราว์เซอร์เท่านั้นที่คุมหัว/ท้ายกระดาษได้ CSS สั่งไม่ได้ → แจ้งผู้ใช้ครั้งเดียวต่อการพิมพ์
    toast('ในหน้าต่างพิมพ์ ให้ตั้ง Margins = None และปิด "Headers and footers" เพื่อให้ PDF ตรงกับตัวอย่าง', 'info');
    return epWithTimeout(epWaitFonts(), 3000)
      .then(function () { return epWithTimeout(epWaitImages(area), 3000); })
      .then(function () {
      return new Promise(function (res) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { window.print(); res(); });
        });
      });
    });
  }
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('printing-payslip');
    var area = document.getElementById('payslip-print-area');
    if (area) area.innerHTML = '';
  });
  // Preview A4 ในระบบ (ข้อมูลชุดเดียวกับ Modal/Print)
  function epOpenPreview(period, empId, empOverride) {
    var r = epRenderSlip(period, empId, empOverride);
    if (!r) { toast('ไม่พบข้อมูลสลิป', 'error'); return; }
    var ov = document.createElement('div');
    ov.className = 'payslip-preview-overlay';
    ov.innerHTML =
      '<div class="payslip-preview-toolbar">' +
      '<button class="btn btn-primary" id="epv-print">' + icon('printer') + ' พิมพ์ / บันทึก PDF</button>' +
      '<button class="btn btn-ghost" id="epv-close">ปิดตัวอย่าง</button></div>' +
      '<div class="payslip-preview-canvas"><div class="payslip-a4-page"><div class="epayslip">' + r.html + '</div></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#epv-close').onclick = function () { ov.remove(); };
    ov.querySelector('#epv-print').onclick = function () { epPrintPayslip(period, empId, empOverride); };
  }

  function showEPayslip(period, empId, empOverride) {
    var r = epRenderSlip(period, empId, empOverride);
    if (!r) { toast('ไม่พบข้อมูลสลิป', 'error'); return; }
    openModal('E-PAYSLIP',
      '<div class="epayslip" id="epayslip-print">' + r.html + '</div>',
      '<button class="btn btn-ghost" id="ep-preview">' + icon('eye') + ' ดูตัวอย่าง</button>' +
      '<button class="btn btn-primary" id="ep-print">' + icon('printer') + ' พิมพ์ / บันทึก PDF</button>' +
      '<button class="btn btn-ghost" id="ep-close">ปิด</button>',
      { wide: true });
    document.getElementById('ep-close').onclick = closeModal;
    document.getElementById('ep-preview').onclick = function () { epOpenPreview(period, empId, empOverride); };
    document.getElementById('ep-print').onclick = function () { epPrintPayslip(period, empId, empOverride); };
  }

  /* ================= REPORT / REPORT ALL ================= */
  // ดึงข้อมูลจากฐานข้อมูลจริงของระบบ (db.*) เท่านั้น · ไม่มีการอัปโหลดไฟล์ · ไม่สร้างตัวเลขเอง

  function rpInMonth(d, r) { return !!d && d >= r.s && d <= r.e; }
  function rpDMY(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  /* ข้อความรายละเอียดใน Cell เดียว (ขึ้นบรรทัดใหม่) ของรายงานรวม
     ใช้ rpGroupDates เดิม ไม่เปลี่ยนวิธีนับหรือค่าตัวเลขใด ๆ */
  function rpAttDetail(t) {
    var p = [];
    if (t.absIn.length)  p.push('ขาดสแกนเข้า: ' + rpGroupDates(t.absIn));
    if (t.absOut.length) p.push('ขาดสแกนออก: ' + rpGroupDates(t.absOut));
    if (t.late.length)   p.push('มาสาย: ' + rpGroupDates(t.late));
    if (t.back.length)   p.push('ลงชื่อย้อนหลัง: ' + rpGroupDates(t.back));
    return p.join('\n');
  }
  function rpLeaveDetail(t) {
    var p = [];
    ['ป่วย', 'กิจ', 'พักร้อน', 'อื่น'].forEach(function (k) {
      if (t.D[k] && t.D[k].length) p.push('ลา' + k + ': ' + rpGroupDates(t.D[k]));
    });
    return p.join('\n');
  }
  function rpOtDetail(t) { return (t.otD || []).join('\n'); }

  function rpGroupDates(list) { // รวมวันต่อเนื่องเป็นช่วง เช่น 01/07/2026 - 03/07/2026, 06/07/2026
    var a = Object.keys(list.reduce(function (o, d) { o[d] = 1; return o; }, {})).sort();
    if (!a.length) return '-';
    var out = [], st = a[0], pv = a[0];
    for (var i = 1; i <= a.length; i++) {
      var cur = a[i];
      var nx = new Date(pv + 'T00:00:00'); nx.setDate(nx.getDate() + 1);
      var nxIso = nx.getFullYear() + '-' + ('0' + (nx.getMonth() + 1)).slice(-2) + '-' + ('0' + nx.getDate()).slice(-2);
      if (cur === nxIso) { pv = cur; continue; }
      out.push(st === pv ? rpDMY(st) : rpDMY(st) + ' - ' + rpDMY(pv));
      st = pv = cur;
    }
    return out.join(', ');
  }
  function rpRnd2(n) { return Math.round(Number((n * 100).toPrecision(12))) / 100; }
  // REPORT ALL ใช้แหล่งเดียวกับปฏิทินและระบบลา (ฟังก์ชันเดิมคงชื่อไว้ ผู้เรียกไม่ต้องแก้)
  function rpIsHoliday(iso) { return holHas(iso); }
  function rpMin(t) { var p = String(t || '').split(':'); return p.length >= 2 ? (+p[0]) * 60 + (+p[1]) : null; }

  // แบ่งชั่วโมง OT ตามกฎบริษัท (ประเภทวันมาจากวันหยุดจริง + กะของพนักงาน ไม่ hardcode เสาร์-อาทิตย์)
  function rpOtSplit(isHol, st, en) {
    if (st == null || en == null) return null;
    if (en <= st) en += 24 * 60; // OT ข้ามเที่ยงคืน
    function ov(a1, a2, b1, b2) { return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)) / 60; }
    if (!isHol) return { h15: (en - st) / 60, h1: 0, h3: 0 };
    return { h15: 0, h1: ov(st, en, 510, 1050), h3: ov(st, en, 1080, 1e6) };
  }

  // ---------- รวบรวมข้อมูลจริงของงวดที่เลือก ----------
  /* ================= rpFetch(range, filter) =================
     ดึงข้อมูล REPORT ALL จาก Supabase ทั้ง 5 แหล่งพร้อมกันในรอบเดียว (Promise.all)
     ไม่มี N+1 — ไม่มีจุดใด Query ต่อพนักงานหรือต่อแถว

       พนักงาน    → njhr_emp_list          (ชุดเดียวกับหน้าพนักงาน)
       ลงเวลา     → njhr_att_report        (ชุดเดียวกับหน้ารายงานการลงเวลา — Source of Truth ของ status/late)
       ลางาน      → njhr_leave_report      (สถานะ APPROVED)
       OT         → njhr_ot_list           (สถานะ APPROVED)
       เงินเดือน  → njhr_pay_entry_totals  (ยอดรายเดือนต่อพนักงาน)

     คืนข้อมูลในรูปแบบเดียวกับที่ rpCollect() เคยอ่านจาก db.* เป๊ะ ๆ
     สูตรใน rpCollect จึงไม่ต้องแก้แม้แต่บรรทัดเดียว

     ⚠ ห้าม fallback ไป db.* / localStorage — Supabase ล้มเหลว = โยน error ให้หน้าจอแสดง Retry
        เพราะการแสดงข้อมูลเก่าที่ไม่ตรงจริงอันตรายกว่าการไม่แสดงเลย

     ⚠ "ลงชื่อย้อนหลัง" ไม่มี RPC ในระบบ (ตรวจ RPC ที่ Frontend เรียกทั้ง 117 ตัวแล้วไม่พบ)
        จึงคืน back = null เพื่อให้หน้าจอแสดง "—" ไม่ใช่ 0 ที่ชวนเข้าใจผิด */
  function rpFetch(range, filter) {
    var r = range, f = filter || {};
    if (!sbReady() || !sbToken()) {
      return Promise.reject(new Error('ยังไม่ได้เชื่อมต่อ Supabase — REPORT ALL ต้องใช้ข้อมูลจริงเท่านั้น'));
    }
    var tk = sbToken();
    var dept = f.deptName || null;          // RPC ทุกตัวรับ "ชื่อแผนก" เป็น text
    var pm = parseInt(String(r.s).split('-')[1], 10);
    var py = parseInt(String(r.s).split('-')[0], 10);

    return Promise.all([
      /* พนักงานทั้งหมด — njhr_report_all_employees (L1) ไม่มีเพดาน 100 คนแบบ njhr_emp_list
         และคืนฐานเงินเดือน/เบี้ยเลี้ยงจริงมาด้วย (njhr_emp_list ไม่ส่งคอลัมน์เหล่านี้เลย) */
      sbRpcList('njhr_report_all_employees', {
        p_token: tk, p_dept: dept, p_employee: f.empId || null
      }),
      sbRpcList('njhr_att_report', {
        p_token: tk, p_from: r.s, p_to: r.e, p_type: 'ATTEND', p_dept: dept,
        p_employee: f.empId || null, p_q: null, p_limit: 5000, p_offset: 0
      }),
      sbRpcList('njhr_leave_report', {
        p_token: tk, p_from: r.s, p_to: r.e, p_dept: dept,
        /* ส่ง null เพื่อดึงทุกสถานะ แล้วกรองด้วย OKST = APPROVED + COMPLETED ใน rpCollect
           เดิมส่ง 'APPROVED' อย่างเดียว ทำให้รายการ COMPLETED ถูกตัดตั้งแต่ชั้น RPC */
        p_q: null, p_type: null, p_status: null
      }),
      /* REPORT ALL ใช้ njhr_report_all_ot (O2) แทน njhr_ot_list
         เพราะ njhr_ot_list ไม่คืนผู้อนุมัติเลย (ยืนยันจาก pg_get_function_result บน Production)
         RPC ใหม่ใช้ njhr_ot_guard ตัวเดียวกัน สิทธิ์จึงเท่าเดิม และ njhr_ot_list ไม่ถูกแตะ
         จำนวน RPC ของหน้านี้ยังเป็น 5 ตัวเท่าเดิม */
      sbRpcList('njhr_report_all_ot', {
        p_token: tk, p_from: r.s, p_to: r.e, p_dept: dept, p_employee: f.empId || null
      }),
      sbRpcList('njhr_pay_entry_totals', { p_token: tk, p_year: py, p_month: pm, p_employee: null }),
      /* "ลงชื่อย้อนหลัง" — นับจาก njhr_att_correction_list สถานะ APPROVED
         เป็นข้อมูลจริงจากตารางเดียวกับหน้าอนุมัติ ไม่เปลี่ยนสูตรใด ๆ ของ REPORT ALL
         ถ้า RPC ยังไม่มีบนฐานข้อมูลนี้ ให้คืน null เพื่อให้การ์ดแสดง "—" เหมือนเดิม */
      sbRpcList('njhr_att_correction_list', {
        p_token: tk, p_employee: null, p_status: 'APPROVED',
        p_from: r.s, p_to: r.e, p_limit: 500, p_offset: 0, p_mine_queue: false
      })['catch'](function () { return null; })
    ]).then(function (res) {
      var eRows = res[0] || [], aRows = res[1] || [], lRows = res[2] || [],
          oRows = res[3] || [], pRows = res[4] || [], cRows = res[5];

      // ---- พนักงาน: แปลงเป็นรูปแบบเดียวกับ db.employees ที่สูตรเดิมใช้
      var emps = eRows.map(function (e) {
        var full = String(e.full_name || '').trim();
        var sp = full.indexOf(' ');
        return {
          id: e.id, code: e.emp_code || '', title: e.prefix || '',
          firstName: sp > 0 ? full.slice(0, sp) : full,
          lastName: sp > 0 ? full.slice(sp + 1) : '',
          nickname: e.nickname || '', position: e.position_name || '',
          deptId: e.department_id || '', deptName: e.department_name || '',
          status: e.status || 'ACTIVE',
          /* ฐานเงินเดือน + เบี้ยเลี้ยงจริงจาก employees (njhr_report_all_employees ส่งมาครบ)
             ใช้เป็นค่าตั้งต้นเมื่องวดนั้นยังไม่มีรายการใน njhr_pay_entry_totals */
          baseSalary:  Number(e.base_salary)     || 0,
          allowance:   Number(e.position_allow)  || 0,
          fuelAllow:   Number(e.fuel_allow)      || 0,
          phoneAllow:  Number(e.phone_allow)     || 0,
          diligence:   Number(e.diligence_allow) || 0,
          travelAllow: Number(e.travel_allow)    || 0
        };
      });
      if (f.empId) emps = emps.filter(function (e) { return e.id === f.empId; });

      var empSet = {};
      emps.forEach(function (e) { empSet[e.id] = 1; });

      // ---- ลงเวลา: ใช้ late_min ที่เซิร์ฟเวอร์คำนวณมาแล้ว (Source of Truth เดียวกับหน้ารายงานการลงเวลา)
      var att = aRows.filter(function (a) { return empSet[a.employee_id]; }).map(function (a) {
        return {
          empId: a.employee_id,
          date: String(a.work_date || '').slice(0, 10),
          in: a.check_in ? rpHM(a.check_in) : '',
          out: a.check_out ? rpHM(a.check_out) : '',
          lateMin: Number(a.late_min) || 0,
          status: a.status || ''
        };
      });

      // ---- ลางาน
      var leaves = lRows.filter(function (l) { return empSet[l.employee_id]; }).map(function (l) {
        return {
          id: l.req_id, empId: l.employee_id, typeName: l.leave_type || '',
          status: l.status, startDate: String(l.start_date || '').slice(0, 10),
          endDate: String(l.end_date || '').slice(0, 10),
          days: Number(l.total_days) || 0, hours: Number(l.hours) || 0,
          mode: (Number(l.hours) > 0 && !Number(l.total_days)) ? 'HOURLY' : 'DAY'
        };
      });

      // ---- OT
      var ots = oRows.filter(function (o) { return empSet[o.employee_id]; }).map(function (o) {
        return {
          id: o.req_id || o.id, empId: o.employee_id,
          date: String(o.ot_date || '').slice(0, 10),
          start: String(o.start_time || '').slice(0, 5),
          end: String(o.end_time || '').slice(0, 5),
          hours: Number(o.ot_hours) || 0,
          /* approver_name มาจาก ot_requests.approvals (action = APPROVE) เรียงตามลำดับขั้น
             ไม่มีผู้อนุมัติจริง = RPC คืน '—' มาให้แล้ว */
          status: o.status, approver: o.approver_name || ''
        };
      });

      // ---- เงินเดือน: map employee_id -> ยอดจริงของงวดนั้น
      var pay = {};
      pRows.forEach(function (x) {
        pay[x.employee_id] = {
          earning: Number(x.earning_total) || 0,
          deduction: Number(x.deduction_total) || 0,
          /* items คือรายการจริงรายตัว (code · name · kind · amount)
             เดิมถูกทิ้งตรงนี้ ทำให้ REPORT ALL แยกค่าน้ำมัน/โทรศัพท์/ปกส./กยศ. ไม่ได้ */
          items: Array.isArray(x.items) ? x.items : []
        };
      });

      // back = null เมื่อ RPC ใช้ไม่ได้ → การ์ดยังแสดง "—" ไม่ใช่ 0
      var back = Array.isArray(cRows)
        ? cRows.filter(function (x) { return empSet[x.employee_id]; }).map(function (x) {
            return { id: x.id, empId: x.employee_id,
                     date: String(x.work_date || '').slice(0, 10), status: 'APPROVED' };
          })
        : null;
      return { emps: emps, att: att, leaves: leaves, ots: ots, pay: pay, back: back };
    });
  }

  // "2026-08-02T15:34:00+07:00" → "22:34" ตามเขตเวลาเครื่อง (Asia/Bangkok บนเครื่องผู้ใช้จริง)
  function rpHM(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* rpCollect(range, filter) — ใช้ช่วงวันที่อิสระ (รองรับรอบข้ามเดือน) + กรองแผนก/พนักงาน
     Preview การ์ดสรุป และ Export ทั้ง 4 Sheet เรียกฟังก์ชันนี้ตัวเดียวกัน จึงได้ข้อมูลชุดเดียวกันเสมอ */
  /* ---------- รายการเงินเดือนจริงจาก njhr_pay_entry_totals ----------
     code ทั้งหมดยืนยันจาก njhr_pay_items บนฐานข้อมูลจริง ไม่ได้เดา:
       EARNING   ALLOWANCE · BONUS · COMMISSION · DILIGENCE · FUEL_ALLOW · OT
                 OTHER_EARN · PHONE_ALLOW · POSITION_ALLOW · SHIFT_ALLOW
       DEDUCTION ABSENT · COOP · LATE · LEAVE_PERSONAL · LEAVE_SICK · LOAN
                 OTHER_DEDUCT · SSO · STUDENT_LOAN · TAX */
  var RP_EARN_OTHER = ['BONUS', 'COMMISSION', 'ALLOWANCE', 'OTHER_EARN'];
  var RP_DED_OTHER  = ['LOAN', 'COOP', 'OTHER_DEDUCT', 'LATE', 'ABSENT', 'LEAVE_SICK', 'TAX'];
  function rpPayMap(pe) {
    var m = {};
    if (!pe || !Array.isArray(pe.items)) return m;
    pe.items.forEach(function (it) {
      var k = String(it.code || '').toUpperCase();
      if (!k) return;
      m[k] = rpRnd2((m[k] || 0) + (Number(it.amount) || 0));
    });
    return m;
  }
  function rpPaySum(map, codes) {
    return rpRnd2(codes.reduce(function (n, c) { return n + (Number(map[c]) || 0); }, 0));
  }

  function rpCollect(range, filter, data) {
    var r = range, warn = [], dupCut = 0;
    var f = filter || {};
    // Dataset มาจาก rpFetch() (Supabase) เท่านั้น — ห้าม fallback ไป db.* / localStorage
    if (!data) throw new Error('REPORT ALL ต้องใช้ข้อมูลจาก Supabase — ไม่มีชุดข้อมูลส่งเข้ามา');
    var D = data;
    var emps = (D.emps || []).slice()
      .sort(function (a, b) { return String(a.code).localeCompare(String(b.code), 'th'); });
    var empSet = {}; emps.forEach(function (e) { empSet[e.id] = 1; });
    var pm = parseInt(String(r.s).split('-')[1], 10), py = parseInt(String(r.s).split('-')[0], 10);
    var att = (D.att || []).filter(function (a) { return empSet[a.empId] && rpInMonth(a.date, r); });
    // สถานะที่ถือว่าอนุมัติสมบูรณ์ (ตรวจจากค่าจริงในระบบ)
    var OKST = ['APPROVED', 'COMPLETED'];
    var seenL = {}, seenO = {};
    var leaves = (D.leaves || []).filter(function (l) {
      if (!empSet[l.empId]) return false;
      if (OKST.indexOf(l.status) < 0) return false;
      if (l.endDate < r.s || l.startDate > r.e) return false;     // ตัดเดือนอื่น (รองรับลาข้ามเดือน)
      if (seenL[l.id]) { dupCut++; return false; }                 // กันซ้ำด้วย Record ID
      seenL[l.id] = 1; return true;
    });
    var ots = (D.ots || []).filter(function (o) {
      if (!empSet[o.empId]) return false;
      if (OKST.indexOf(o.status) < 0) return false;
      if (!rpInMonth(o.date, r)) return false;
      if (seenO[o.id]) { dupCut++; return false; }
      seenO[o.id] = 1; return true;
    });
    /* "ลงชื่อย้อนหลัง" ยังไม่มี RPC ในระบบ → D.back เป็น null
       ต้องแสดง "—" ไม่ใช่ 0 เพื่อไม่ให้เข้าใจผิดว่าตรวจแล้วไม่มี */
    var corrs = Array.isArray(D.back) ? D.back.filter(function (c) {
      return empSet[c.empId] && OKST.indexOf(c.status) >= 0 && rpInMonth(c.date, r);
    }) : [];
    var backAvailable = Array.isArray(D.back);

    /* ตัวค้นหาเฉพาะภายใน rpCollect — อ่านจาก Dataset ของ Supabase
       ไม่เรียก emp() / dept() / leaveType() ของระบบซึ่งอ่าน db.* (ว่างเปล่าบน Production)
       ฟังก์ชันเดิมทั้งสามตัวไม่ถูกแตะ หน้าอื่นจึงทำงานเหมือนเดิม */
    var empMap = {}; emps.forEach(function (e) { empMap[e.id] = e; });
    function rEmp(id) { return empMap[id] || null; }
    function rDept(e) { return (e && e.deptName) || ''; }

    var T = {};
    emps.forEach(function (e) {
      T[e.id] = { absIn: [], absOut: [], late: [], lateMin: 0, back: [], exempt: 0,
        scanInD: Object.create(null), scanOutD: Object.create(null), scanIn: 0, scanOut: 0,
        ot15: 0, ot1: 0, ot3: 0, otApv: [], otD: [],
        L: { ป่วย: 0, กิจ: 0, พักร้อน: 0, อื่น: 0 },
        D: { ป่วย: [], กิจ: [], พักร้อน: [], อื่น: [] }, otH: 0, otMoney: 0, rows: [] };
    });
    // ---- เวลาเข้า-ออก + มาสาย (เทียบกะของพนักงานแต่ละคน)
    att.forEach(function (a) {
      var t = T[a.empId]; if (!t) return;
      /* จำนวนครั้งสแกนเข้า/ออก — นับ "วันที่มีเวลาจริง" 1 วัน = 1 ครั้ง ไม่นับซ้ำ
         นับก่อนตัดวันหยุด เพราะสแกนจริงในวันหยุดก็ถือเป็นการสแกน
         a.in / a.out มาจาก njhr_att_report (check_in / check_out) โซนเวลา Asia/Bangkok
         คำขอลงชื่อย้อนหลังอยู่ในตัวแปร corrs แยกต่างหาก จึงไม่ถูกนับตรงนี้ */
      if (a.in && !t.scanInD[a.date]) { t.scanInD[a.date] = 1; t.scanIn++; }
      if (a.out && !t.scanOutD[a.date]) { t.scanOutD[a.date] = 1; t.scanOut++; }
      if (rpIsHoliday(a.date)) { t.exempt++; return; }             // วันหยุด: ไม่นับขาดงาน
      if (!a.in) t.absIn.push(a.date);
      if (!a.out) t.absOut.push(a.date);
      /* มาสาย: ใช้ late_min ที่ njhr_att_report คำนวณมาแล้ว
         เป็นสูตรจริงของระบบ (เทียบกะ + อนุโลม ฝั่งเซิร์ฟเวอร์) ตัวเดียวกับหน้ารายงานการลงเวลา
         ไม่คำนวณซ้ำจาก db.settings.lateGrace / db.shifts ซึ่งไม่มีข้อมูลจริงบน Production */
      if (a.lateMin > 0) { t.late.push(a.date); t.lateMin += a.lateMin; }
    });
    corrs.forEach(function (c) { if (T[c.empId]) T[c.empId].back.push(c.date); });
    // ---- วันลา (นับเฉพาะส่วนที่อยู่ในเดือนที่เลือก)
    function lkey(name) {
      if (name.indexOf('ป่วย') >= 0) return 'ป่วย';
      if (name.indexOf('พักร้อน') >= 0) return 'พักร้อน';
      if (name.indexOf('ลากิจ') >= 0 || name === 'กิจ') return 'กิจ';
      return 'อื่น';
    }
    leaves.forEach(function (l) {
      var t = T[l.empId]; if (!t) return;
      // ชื่อประเภทลามาจาก njhr_leave_report โดยตรง (l.typeName) ไม่ต้อง lookup จาก db.leaveTypes
      var lt = { name: l.typeName || 'ลาอื่น' }, k = lkey(lt.name);
      var d0 = new Date(l.startDate + 'T00:00:00'), d1 = new Date(l.endDate + 'T00:00:00');
      var days = [], cur = new Date(d0);
      while (cur <= d1) {
        var iso = cur.getFullYear() + '-' + ('0' + (cur.getMonth() + 1)).slice(-2) + '-' + ('0' + cur.getDate()).slice(-2);
        if (rpInMonth(iso, r)) days.push(iso);
        cur.setDate(cur.getDate() + 1);
      }
      if (!days.length) return;
      var totalSpan = Math.round((d1 - d0) / 86400000) + 1;
      var amount = l.mode === 'HOURLY' ? (l.hours || 0) / 8 : (l.days || 0);
      var part = totalSpan > 0 ? rpRnd2(amount * days.length / totalSpan) : amount; // ลาข้ามเดือน = ตามสัดส่วนวันในเดือน
      t.L[k] = rpRnd2(t.L[k] + part);
      t.D[k] = t.D[k].concat(days);
    });
    // ---- OT (1 รายการ = 1 แถวในชีต OT)
    var otRows = [];
    ots.slice().sort(function (a, b) {
      var ea = rEmp(a.empId) || {}, eb = rEmp(b.empId) || {};
      return String(ea.code).localeCompare(String(eb.code), 'th') || a.date.localeCompare(b.date);
    }).forEach(function (o) {
      var e = rEmp(o.empId); if (!e) return;
      // ฐานเงินเดือนมาจาก employees จริง (njhr_emp_list) — สูตร OT ด้านล่างคงเดิมทุกบรรทัด
      var salary = e.baseSalary || 0;
      var isHol = rpIsHoliday(o.date);
      var sp = rpOtSplit(isHol, rpMin(o.start), rpMin(o.end));
      if (!sp) { warn.push('OT ' + o.id + ' เวลาไม่ถูกต้อง — ข้ามรายการ'); return; }
      var hw = rpRnd2(salary / 30 / 8), dw = rpRnd2(salary / 30);
      var m15 = rpRnd2(hw * sp.h15 * 1.5), m1 = rpRnd2(hw * sp.h1), m3 = rpRnd2(hw * sp.h3 * 3);
      if (!salary) warn.push((e.title + e.firstName + ' ' + e.lastName).trim() + ': ไม่มีเงินเดือนในข้อมูลพนักงาน — เงิน OT = 0');
      /* ผู้อนุมัติจริงมาจาก RPC แล้ว — เดิมอ่าน o.timeline ซึ่งไม่มีคอลัมน์นี้ในฐานข้อมูลเลย
         (ยืนยันจาก information_schema.columns ของ ot_requests) จึงได้ค่าว่างเสมอ */
      var apv = o.approver || '';
      otRows.push([otRows.length + 1, e.title + e.firstName + ' ' + e.lastName, salary, rpDMY(o.date),
        isHol ? 'วันหยุด' : 'วันธรรมดา', o.start, o.end,
        rpRnd2(sp.h15), rpRnd2(sp.h1), rpRnd2(sp.h3), dw, hw, m15, m1, m3, rpRnd2(m15 + m1 + m3), apv]);
      var t = T[e.id];
      if (t) {
        t.otH = rpRnd2(t.otH + sp.h15 + sp.h1 + sp.h3); t.otMoney = rpRnd2(t.otMoney + m15 + m1 + m3);
        /* แยกชั่วโมงตามอัตราและเก็บรายละเอียด/ผู้อนุมัติไว้เติมคอลัมน์ OT ที่เดิมว่าง */
        t.ot15 = rpRnd2(t.ot15 + sp.h15); t.ot1 = rpRnd2(t.ot1 + sp.h1); t.ot3 = rpRnd2(t.ot3 + sp.h3);
        t.otD.push(rpDMY(o.date) + ' ' + o.start + '–' + o.end + ' · ' +
          rpRnd2(sp.h15 + sp.h1 + sp.h3) + ' ชม.');
        /* รวมชื่อผู้อนุมัติจากทุกรายการในช่วงรายงานโดยไม่ซ้ำ (RPC คืน '—' เมื่อไม่มี) */
        if (apv && apv !== '—' && t.otApv.indexOf(apv) < 0) t.otApv.push(apv);
      }
    });

    // ---- ชีต "รวม" 26 คอลัมน์
    var sumRows = emps.map(function (e, i) {
      var t = T[e.id];
      /* ยอดรายเดือนมาจาก njhr_pay_entry_totals (ชุดเดียวกับหน้า ระบบ > รายการเงินเดือน)
         ฐานเงินเดือน/ค่าตำแหน่ง ใช้ค่าจาก employees ตามพฤติกรรมเดิมเมื่อยังไม่มียอดของงวด */
      var pe = (D.pay || {})[e.id] || null;
      var pm2 = rpPayMap(pe);                  // { CODE: จำนวนเงิน } จากรายการจริงของงวดนั้น
      function amt(code, fb) {
        return pm2[code] != null ? pm2[code] : (fb || 0);
      }
      /* รายรับ — ใช้ยอดของงวดจาก njhr_pay_entry_totals ก่อน
         ถ้างวดนั้นยังไม่มีรายการ จึงใช้ค่าตั้งต้นจาก employees (ไม่ใช่ 0) */
      var base    = amt('BASE', e.baseSalary);
      var posPay  = amt('POSITION_ALLOW', e.allowance);
      var fuel    = amt('FUEL_ALLOW',  e.fuelAllow);
      var phone   = amt('PHONE_ALLOW', e.phoneAllow);
      var dilig   = amt('DILIGENCE',   e.diligence);
      var otMoney = amt('OT', t.otMoney);      // ไม่มีในงวด → ใช้ยอดที่คำนวณจากรายการ OT จริง
      var shiftPay = amt('SHIFT_ALLOW', 0);
      var earnOther = rpPaySum(pm2, RP_EARN_OTHER);   // BONUS · COMMISSION · ALLOWANCE · OTHER_EARN
      var gross = rpRnd2(base + posPay + fuel + phone + dilig + otMoney + shiftPay + earnOther);
      /* รายการหัก */
      var dLeave = amt('LEAVE_PERSONAL', 0);
      var sso    = amt('SSO', 0);
      var loanEd = amt('STUDENT_LOAN', 0);
      var dOther = rpPaySum(pm2, RP_DED_OTHER);       // LOAN · COOP · OTHER_DEDUCT · LATE · ABSENT · LEAVE_SICK · TAX
      var ded    = rpRnd2(dLeave + sso + loanEd + dOther);
      var totalLeave = rpRnd2(t.L['ป่วย'] + t.L['กิจ'] + t.L['พักร้อน'] + t.L['อื่น']);
      return { row: i + 2, e: e, t: t, gross: gross, ded: ded, net: rpRnd2(gross - ded),
        pay: { base: base, posPay: posPay, fuel: fuel, phone: phone, dilig: dilig,
               ot: otMoney, shift: shiftPay, earnOther: earnOther,
               dLeave: dLeave, sso: sso, loanEd: loanEd, dOther: dOther },
        /* ต้องมีครบ 37 ช่องเรียงตรงกับ RP1_HEAD ทุกตำแหน่ง
           เดิมมีเพียง 28 ช่องและไม่มีค่าของ "รายละเอียดลงเวลา" ทำให้ข้อมูล
           ตั้งแต่คอลัมน์ X เป็นต้นไปเหลื่อมขึ้น 1 ช่อง และคอลัมน์ท้ายว่างทั้งหมด */
        cells: [
          /* 1-3  ข้อมูลพนักงาน */ i + 1, String(e.code), e.title + e.firstName + ' ' + e.lastName,
          /* 4-11 รายได้ */ base, posPay, fuel, phone, dilig, otMoney, shiftPay, gross,
          /* 12-17 หัก/สุทธิ */ dLeave, sso, loanEd, dOther, ded, rpRnd2(gross - ded),
          /* 18-26 การลงเวลา */ t.scanIn, t.scanOut,
          t.absIn.length, t.absOut.length, t.exempt, t.lateMin, t.otH,
          backAvailable ? t.back.length : null,
          rpAttDetail(t),
          /* 27-32 การลา */ totalLeave, t.L['กิจ'], t.L['พักร้อน'], t.L['ป่วย'], t.L['อื่น'],
          rpLeaveDetail(t),
          /* 33-37 OT */ rpOtDetail(t), t.ot15, t.ot1, t.ot3,
          t.otApv.length ? t.otApv.join(', ') : '—'
        ] };
    });
    // ---- ชีต "รายละเอียดการลาและการมาทำงาน" 19 คอลัมน์
    var detRows = emps.map(function (e, i) {
      var t = T[e.id];
      return [i + 1, e.title + e.firstName + ' ' + e.lastName,
        t.absIn.length, rpGroupDates(t.absIn), t.absOut.length, rpGroupDates(t.absOut),
        t.late.length, rpGroupDates(t.late),
        backAvailable ? t.back.length : null, backAvailable ? rpGroupDates(t.back) : '',
        t.L['ป่วย'], rpGroupDates(t.D['ป่วย']), t.L['กิจ'], rpGroupDates(t.D['กิจ']),
        t.L['พักร้อน'], rpGroupDates(t.D['พักร้อน']), t.L['อื่น'], rpGroupDates(t.D['อื่น']),
        rpRnd2(t.L['ป่วย'] + t.L['กิจ'] + t.L['พักร้อน'] + t.L['อื่น'])];
    });
    if (!Object.keys(D.pay || {}).length) {
      warn.push('ยังไม่มีรายการเงินเดือนของงวด ' + pm + '/' + py + ' — ใช้เงินเดือนฐานจากข้อมูลพนักงาน');
    }
    if (!backAvailable) {
      warn.push('ลงชื่อย้อนหลัง: ระบบยังไม่มี RPC สำหรับดึงคำขอแก้ไขเวลา จึงแสดง "—" แทนตัวเลข');
    }
    warn.push('ระบบยังไม่มีฟิลด์: น้ำมัน / โทรศัพท์ / เบี้ยขยัน / ค่ากะ / เงินหักลากิจ / กยศ → ใส่ 0 ตามข้อมูลจริง');
    // ---- Sheet "รวมลา": 1 พนักงาน = 1 แถว (นับเฉพาะส่วนที่อยู่ในช่วงวันที่ที่เลือก)
    var lvRows = emps.map(function (e, i) {
      var t = T[e.id];
      var total = rpRnd2(t.L['ป่วย'] + t.L['กิจ'] + t.L['พักร้อน'] + t.L['อื่น']);
      return [i + 1, e.code, e.title + e.firstName + ' ' + e.lastName, total,
        rpRnd2(t.L['กิจ']), rpRnd2(t.L['พักร้อน']), rpRnd2(t.L['ป่วย']), rpRnd2(t.L['อื่น']),
        t.absIn.length, t.absOut.length, t.late.length, backAvailable ? t.back.length : null];
    });
    return { r: r, emps: emps, att: att, leaves: leaves, ots: ots, sumRows: sumRows,
      detRows: detRows, otRows: otRows, lvRows: lvRows, T: T, warn: warn, dupCut: dupCut,
      pay: D.pay || {}, backAvailable: backAvailable };
  }

  // ---------- เขียนลง Template จริงด้วย XML surgery (คงรูปแบบ 100%) ----------
  function rpEnsureLibs() {
    // โหลดตามลำดับด้วยตัวโหลดกลาง — report-template.js เป็นไฟล์ในโปรเจกต์ จึงติด Build Version
    return loadScriptOnce('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip')
      .then(function () {
        return loadScriptOnce('report-template', njAsset('report-template.js'), 'REPORT_TEMPLATE_B64');
      });
  }
  function rpEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function rpCol(n) { var s = ''; while (n > 0) { var m2 = (n - 1) % 26; s = String.fromCharCode(65 + m2) + s; n = (n - m2 - 1) / 26; } return s; }
  // อ่าน style index ของแถวข้อมูลตัวอย่าง (แถว 2) เพื่อใช้กับทุกแถวใหม่ → สี/กรอบ/ฟอนต์/รูปแบบตัวเลขคงเดิม
  function rpRowStyles(xml, rowNo) {
    var m = new RegExp('<row[^>]*r="' + rowNo + '"[^>]*>([\\s\\S]*?)</row>').exec(xml);
    var st = {};
    if (m) {
      var re = /<c r="([A-Z]+)\d+"([^>]*)\/?>/g, c;
      while ((c = re.exec(m[1]))) {
        var s = /s="(\d+)"/.exec(c[2]);
        st[c[1]] = s ? s[1] : '0';
      }
    }
    return st;
  }
  function rpBuildSheet(xml, rows, opt) {
    var st = rpRowStyles(xml, 2);
    var head = /<sheetData>([\s\S]*?)<\/sheetData>/.exec(xml);
    var hdrRow = /<row[^>]*r="1"[^>]*>[\s\S]*?<\/row>/.exec(head[1]);
    var body = hdrRow ? hdrRow[0] : '';
    rows.forEach(function (cells, i) {
      var rn = i + 2, out = '';
      cells.forEach(function (v, ci) {
        var L = rpCol(ci + 1), s = st[L] || '0', ref = L + rn;
        if (v === null || v === undefined) {                       // ช่องสูตร
          var f = opt && opt.formula && opt.formula(ci, rn);
          out += f ? '<c r="' + ref + '" s="' + s + '"><f>' + f + '</f></c>'
                   : '<c r="' + ref + '" s="' + s + '"/>';
        } else if (typeof v === 'number') {
          out += '<c r="' + ref + '" s="' + s + '"><v>' + v + '</v></c>';
        } else {
          out += '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' +
            rpEsc(v) + '</t></is></c>';
        }
      });
      body += '<row r="' + rn + '">' + out + '</row>';
    });
    var last = rows.length + 1;
    var out2 = xml.replace(/<sheetData>[\s\S]*?<\/sheetData>/, '<sheetData>' + body + '</sheetData>');
    out2 = out2.replace(/<dimension ref="[^"]*"\/>/, '<dimension ref="A1:' + rpCol(rows[0] ? rows[0].length : 1) + last + '"/>');
    return out2;
  }

  function rpBEStamp(iso) {
    var p2 = String(iso || '').split('-');
    return p2.length === 3 ? p2[2] + p2[1] + (parseInt(p2[0], 10) + 543) : '';
  }
  /* เพิ่ม Sheet "รวมลา" เข้า Workbook จริง (ไม่ใช่แค่เปลี่ยนข้อความบนหน้าจอ)
     - เขียน xl/worksheets/sheet4.xml
     - เพิ่ม Relationship + Content Type Override
     - แทรกใน <sheets> เป็นลำดับที่ 2 และเปลี่ยนชื่อ Sheet แรก "รวม" → "Sheet1" */
  var RP_LV_HEAD = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ–นามสกุล', 'ลากี่วัน', 'ลากิจ', 'ลาพักร้อน', 'ลาป่วย',
    'ลาอื่น', 'ขาดงานเข้า', 'ขาดงานออก', 'สาย', 'ลงชื่อย้อนหลัง'];
  function rpAddLeaveSheet(zip, c) {
    function col(i) { return String.fromCharCode(65 + i); }
    function cell(ref, v) {
      if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + rpEsc(String(v == null ? '' : v)) + '</t></is></c>';
    }
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<cols>' + RP_LV_HEAD.map(function (h, i) {
        return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' +
          Math.min(Math.max(String(h).length + 5, 10), 28) + '" customWidth="1"/>';
      }).join('') + '</cols><sheetData>' +
      '<row r="1">' + RP_LV_HEAD.map(function (h, i) { return cell(col(i) + '1', h); }).join('') + '</row>' +
      (c.lvRows || []).map(function (r, ri) {
        return '<row r="' + (ri + 2) + '">' + r.map(function (v, ci) { return cell(col(ci) + (ri + 2), v); }).join('') + '</row>';
      }).join('') + '</sheetData></worksheet>';
    zip.file('xl/worksheets/sheet4.xml', xml);

    return Promise.all([
      zip.file('xl/workbook.xml').async('string'),
      zip.file('xl/_rels/workbook.xml.rels').async('string'),
      zip.file('[Content_Types].xml').async('string')
    ]).then(function (v) {
      var wb = v[0], rels = v[1], ct = v[2];
      var RID = 'rIdLV99';
      if (rels.indexOf(RID) < 0) {
        rels = rels.replace('</Relationships>',
          '<Relationship Id="' + RID + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"' +
          ' Target="worksheets/sheet4.xml"/></Relationships>');
      }
      if (ct.indexOf('/xl/worksheets/sheet4.xml') < 0) {
        ct = ct.replace('</Types>',
          '<Override PartName="/xl/worksheets/sheet4.xml"' +
          ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
      }
      // เปลี่ยนชื่อ Sheet แรกเป็น Sheet1 (เดิมชื่อ "รวม")
      wb = wb.replace(/(<sheet\s+name=")[^"]*("\s+sheetId="1")/, '$1Sheet1$2');
      // แทรก "รวมลา" ต่อจาก Sheet แรก
      if (wb.indexOf(RID) < 0) {
        wb = wb.replace(/(<sheet\s+name="Sheet1"[^>]*\/>)/,
          '$1<sheet name="รวมลา" sheetId="99" r:id="' + RID + '"/>');
      }
      zip.file('xl/workbook.xml', wb);
      zip.file('xl/_rels/workbook.xml.rels', rels);
      zip.file('[Content_Types].xml', ct);
    });
  }

  /* ============================================================
     REPORT ALL — Excel 1 Sheet ("REPORT ALL")
     สร้าง XLSX ขึ้นใหม่ทั้งไฟล์ด้วย JSZip (ไม่ใช้ Template 4 Sheet เดิมแล้ว)
     Layout · ลำดับคอลัมน์ · สีหัวกลุ่ม ยึดตาม REPORT_ALL_1SHEET_DESIGN.xlsx
     หลัก 1 พนักงาน = 1 แถวเสมอ · รายละเอียดหลายรายการอยู่ใน Cell เดียวขึ้นบรรทัดใหม่
     ============================================================ */
  /* คอลัมน์รวม 37 ช่อง
     A:C ข้อมูลพนักงาน · D:K รายได้ · L:Q หัก/สุทธิ ·
     R:Z การลงเวลา (9) · AA:AF การลา (6) · AG:AK OT (5) */
  var RP1_GROUPS = [
    ['ข้อมูลพนักงาน', 1, 3, '334155'],
    ['รายได้', 4, 11, '0F766E'],
    ['รายการหัก / เงินสุทธิ', 12, 17, 'B45309'],
    ['การลงเวลา', 18, 26, '1D4ED8'],
    ['การลา', 27, 32, '7C3AED'],
    ['OT', 33, 37, 'BE123C']
  ];
  var RP1_HEAD = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-นามสกุล',
    'เงินเดือน', 'ค่าตำแหน่ง', 'ค่าน้ำมัน', 'ค่าโทรศัพท์', 'เบี้ยขยัน', 'เงิน OT', 'ค่ากะ', 'รายรับรวม',
    'ลากิจ (หักเงิน)', 'ประกันสังคม 5%', 'กยศ.', 'หักอื่น', 'รายหักรวม', 'เงินสุทธิ',
    'จำนวนครั้งสแกนเข้า', 'จำนวนครั้งสแกนออก',
    'ขาดสแกนเข้า', 'ขาดสแกนออก', 'ยกเว้นลงชื่อเข้า', 'สาย (นาที)', 'OT (ชม.)', 'ลงชื่อย้อนหลัง',
    'รายละเอียดลงเวลา',
    'รวมวันลา', 'ลากิจ (วัน)', 'พักร้อน (วัน)', 'ลาป่วย (วัน)', 'ลาอื่น (วัน)', 'รายละเอียดลา',
    'รายละเอียด OT', 'OT 1.5 (ชม.)', 'OT วันหยุด 1 (ชม.)', 'OT 3 (ชม.)', 'ผู้อนุมัติ OT'];
  var RP1_W = { 1: 8, 2: 12, 3: 28, 4: 14, 5: 13, 6: 12, 7: 13, 8: 12, 9: 13, 10: 11, 11: 14,
    12: 14, 13: 15, 14: 11, 15: 12, 16: 14, 17: 14,
    18: 17, 19: 17,
    20: 13, 21: 13, 22: 14, 23: 12, 24: 11, 25: 14, 26: 34,
    27: 12, 28: 13, 29: 13, 30: 12, 31: 12, 32: 34,
    33: 34, 34: 13, 35: 16, 36: 12, 37: 20 };
  /* คอลัมน์ที่เป็นจำนวนเงิน (รูปแบบ #,##0.00) — อิงตำแหน่งจริงในแบบ */
  var RP1_MONEY = { 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1, 11:1, 12:1, 13:1, 14:1, 15:1, 16:1, 17:1 };
  var RP1_WRAP = { 26: 1, 32: 1, 33: 1 };
  var RP1_N = 37;                       // จำนวนคอลัมน์ทั้งหมด (แหล่งเดียว)

  function rp1Col(n) { var t = ''; while (n > 0) { var m = (n - 1) % 26; t = String.fromCharCode(65 + m) + t; n = (n - m - 1) / 26; } return t; }
  function rp1Esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/\x00-\x08\x0b\x0c\x0e-\x1f/g, '');
  }
  /* ---------- styles.xml ----------
     ลำดับ style: 0 ปกติ · 1 หัวคอลัมน์ · 2 เงิน · 3 ข้อความ wrap · 4 กึ่งกลาง
     5 รวมท้าย(ข้อความ) · 6 รวมท้าย(เงิน) · 7 รวมท้าย(ตัวเลข) · 8..13 หัวกลุ่ม 6 สี */
  function rp1Styles() {
    var fills = ['<fill><patternFill patternType="none"/></fill>',
                 '<fill><patternFill patternType="gray125"/></fill>',
                 '<fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>',
                 '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>'];
    RP1_GROUPS.forEach(function (g) {
      fills.push('<fill><patternFill patternType="solid"><fgColor rgb="FF' + g[3] + '"/><bgColor indexed="64"/></patternFill></fill>');
    });
    var xf = [];
    function add(numFmt, font, fill, align) {
      xf.push('<xf numFmtId="' + numFmt + '" fontId="' + font + '" fillId="' + fill + '" borderId="1"' +
        ' applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' +
        align + '</xf>');
    }
    var A_C = '<alignment horizontal="center" vertical="center" wrapText="1"/>';
    var A_L = '<alignment vertical="center"/>';
    var A_W = '<alignment vertical="top" wrapText="1"/>';
    add(0, 0, 0, A_L);                       // 0 ปกติ
    add(0, 1, 2, A_C);                       // 1 หัวคอลัมน์
    add(164, 0, 0, A_L);                     // 2 เงิน
    add(0, 0, 0, A_W);                       // 3 ข้อความ wrap
    add(0, 0, 0, '<alignment horizontal="center" vertical="center"/>');  // 4 กึ่งกลาง
    add(0, 1, 3, A_C);                       // 5 รวมท้าย ข้อความ
    add(164, 1, 3, A_L);                     // 6 รวมท้าย เงิน
    add(0, 1, 3, '<alignment horizontal="center" vertical="center"/>');  // 7 รวมท้าย ตัวเลข
    RP1_GROUPS.forEach(function (g, k) { add(0, 2, 4 + k, A_C); });      // 8.. หัวกลุ่ม
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>' +
      '<fonts count="3">' +
      '<font><sz val="10"/><name val="Tahoma"/></font>' +
      '<font><b/><sz val="10"/><name val="Tahoma"/></font>' +
      '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font></fonts>' +
      '<fills count="' + fills.length + '">' + fills.join('') + '</fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right>' +
      '<top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom>' +
      '<diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="' + xf.length + '">' + xf.join('') + '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      /* dxf สำหรับ Conditional Formatting: 0 แดงอ่อน · 1 เหลืองอ่อน · 2 ม่วงอ่อน */
      '<dxfs count="3">' +
      '<dxf><fill><patternFill><bgColor rgb="FFFEE2E2"/></patternFill></fill></dxf>' +
      '<dxf><fill><patternFill><bgColor rgb="FFFEF3C7"/></patternFill></fill></dxf>' +
      '<dxf><fill><patternFill><bgColor rgb="FFEDE9FE"/></patternFill></fill></dxf>' +
      '</dxfs></styleSheet>';
  }
  function rp1Cell(ref, v, style) {
    if (v == null || v === '') return '<c r="' + ref + '" s="' + style + '"/>';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '" s="' + style + '"><v>' + v + '</v></c>';
    if (typeof v === 'string' && v.charAt(0) === '=') {
      return '<c r="' + ref + '" s="' + style + '"><f>' + rp1Esc(v.slice(1)) + '</f></c>';
    }
    return '<c r="' + ref + '" s="' + style + '" t="inlineStr"><is><t xml:space="preserve">' +
      rp1Esc(v) + '</t></is></c>';
  }
  function rp1Sheet(c) {
    var rows = c.sumRows, n = rows.length;
    var first = 3, last = first + n - 1, total = last + 1;
    var out = [];

    // แถว 1 — หัวกลุ่ม
    var r1 = '';
    RP1_GROUPS.forEach(function (g, k) {
      for (var col = g[1]; col <= g[2]; col++) {
        r1 += rp1Cell(rp1Col(col) + '1', col === g[1] ? g[0] : '', 8 + k);
      }
    });
    out.push('<row r="1" ht="22" customHeight="1">' + r1 + '</row>');

    // แถว 2 — หัวคอลัมน์
    var r2 = '';
    RP1_HEAD.forEach(function (h, k) { r2 += rp1Cell(rp1Col(k + 1) + '2', h, 1); });
    out.push('<row r="2" ht="34" customHeight="1">' + r2 + '</row>');

    // แถวข้อมูล — 1 พนักงาน = 1 แถว
    rows.forEach(function (row, i) {
      var rn = first + i, cells = row.cells, x = '';
      for (var col = 1; col <= RP1_N; col++) {
        var ref = rp1Col(col) + rn, v = cells[col - 1];
        var st = RP1_MONEY[col] ? 2 : (RP1_WRAP[col] ? 3 : (col === 3 ? 0 : 4));
        if (col === 11) v = '=SUM(D' + rn + ':J' + rn + ')';
        if (col === 16) v = '=SUM(L' + rn + ':O' + rn + ')';
        if (col === 17) v = '=K' + rn + '-P' + rn;
        if (v == null && !RP1_MONEY[col]) v = RP1_WRAP[col] ? '-' : '-';
        x += rp1Cell(ref, v, st);
      }
      out.push('<row r="' + rn + '">' + x + '</row>');
    });

    // แถวรวมทั้งหมด
    var rt = rp1Cell('A' + total, 'รวมทั้งหมด', 5) +
             rp1Cell('B' + total, '', 5) + rp1Cell('C' + total, '', 5);
    for (var col = 4; col <= RP1_N; col++) {
      var L = rp1Col(col), ref = L + total;
      if (RP1_WRAP[col] || col === RP1_N) { rt += rp1Cell(ref, '', 7); continue; }
      rt += rp1Cell(ref, '=SUM(' + L + first + ':' + L + last + ')', RP1_MONEY[col] ? 6 : 7);
    }
    out.push('<row r="' + total + '" ht="20" customHeight="1">' + rt + '</row>');

    var cols = '';
    for (var k = 1; k <= RP1_N; k++) {
      cols += '<col min="' + k + '" max="' + k + '" width="' + (RP1_W[k] || 12) + '" customWidth="1"/>';
    }
    var merges = RP1_GROUPS.map(function (g) {
      return '<mergeCell ref="' + rp1Col(g[1]) + '1:' + rp1Col(g[2]) + '1"/>';
    }).join('') + '<mergeCell ref="A' + total + ':C' + total + '"/>';

    /* Conditional Formatting — ขาดสแกน แดงอ่อน · สาย เหลืองอ่อน · วันลา ม่วงอ่อน */
    var cf =
      /* ขาดสแกนเข้า/ออก = T,U · สาย = W · รวมวันลา = AA (เลื่อนตามคอลัมน์ใหม่) */
      '<conditionalFormatting sqref="T' + first + ':U' + last + '">' +
      '<cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThan"><formula>0</formula></cfRule>' +
      '</conditionalFormatting>' +
      '<conditionalFormatting sqref="W' + first + ':W' + last + '">' +
      '<cfRule type="cellIs" dxfId="1" priority="2" operator="greaterThan"><formula>0</formula></cfRule>' +
      '</conditionalFormatting>' +
      '<conditionalFormatting sqref="AA' + first + ':AA' + last + '">' +
      '<cfRule type="cellIs" dxfId="2" priority="3" operator="greaterThan"><formula>0</formula></cfRule>' +
      '</conditionalFormatting>';

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<dimension ref="A1:' + rp1Col(RP1_N) + total + '"/>' +
      '<sheetViews><sheetView tabSelected="1" workbookViewId="0">' +
      '<pane xSplit="3" ySplit="2" topLeftCell="D3" activePane="bottomRight" state="frozen"/>' +
      '</sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      '<cols>' + cols + '</cols>' +
      '<sheetData>' + out.join('') + '</sheetData>' +
      '<autoFilter ref="A2:' + rp1Col(RP1_N) + last + '"/>' +
      '<mergeCells count="' + (RP1_GROUPS.length + 1) + '">' + merges + '</mergeCells>' +
      cf + '</worksheet>';
  }
  function rp1Build(c) {
    var zip = new window.JSZip();
    zip.file('[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>');
    zip.folder('_rels').file('.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>');
    zip.folder('xl').file('workbook.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="REPORT ALL" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.folder('xl').folder('_rels').file('workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>');
    zip.folder('xl').file('styles.xml', rp1Styles());
    zip.folder('xl').folder('worksheets').file('sheet1.xml', rp1Sheet(c));
    return zip;
  }

  function rpExport(el) {
    var st = document.getElementById('rp-status'), errEl = document.getElementById('rp-err');
    var btn = document.getElementById('rp-export');
    if (!rpCanUse()) { errEl.textContent = 'คุณไม่มีสิทธิ์ Export REPORT ALL'; return; }
    var derr = rpDateErr();
    if (derr) { errEl.textContent = derr; return; }
    if (btn.disabled) return;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้างไฟล์…';
    st.textContent = 'กำลังรวบรวมข้อมูลจากฐานข้อมูล…'; errEl.textContent = '';
    rpEnsureLibs().then(function () {
      var c = rpData;
      if (!c) throw new Error('ยังโหลดข้อมูลไม่เสร็จ กรุณารอสักครู่แล้วกด EXPORT อีกครั้ง');
      if (!c.emps.length) throw new Error('ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก');
      st.textContent = 'กำลังสร้างไฟล์ Excel…';
      var zip = rp1Build(c);
      return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }).then(function (blob) {
        st.textContent = 'กำลังตรวจสอบไฟล์ที่สร้าง…';
        return zip.generateAsync({ type: 'base64' }).then(function (b64) {
          return window.JSZip.loadAsync(b64, { base64: true }).then(function (z2) {
            var fails = [];
            return z2.file('xl/workbook.xml').async('string').then(function (wbx) {
              var names = (wbx.match(/<sheet [^>]*name="([^"]+)"/g) || [])
                .map(function (x) { return /name="([^"]+)"/.exec(x)[1]; });
              if (names.length !== 1) fails.push('จำนวน Sheet = ' + names.length + ' (ต้องเป็น 1)');
              if (names[0] !== 'REPORT ALL') fails.push('ชื่อ Sheet = "' + names[0] + '" (ต้องเป็น "REPORT ALL")');
              return z2.file('xl/worksheets/sheet1.xml').async('string');
            }).then(function (sx) {
              var rows = (sx.match(/<row [^>]*r="\d+"/g) || []).length;
              var want = c.sumRows.length + 3;         // หัวกลุ่ม + หัวคอลัมน์ + ข้อมูล + รวมท้าย
              if (rows !== want) fails.push('จำนวนแถว ' + rows + ' (คาดหวัง ' + want + ')');
              if (sx.indexOf('<autoFilter') < 0) fails.push('ไม่มี AutoFilter');
              if (sx.indexOf('state="frozen"') < 0) fails.push('ไม่มี Freeze Pane');
              if (sx.indexOf('<conditionalFormatting') < 0) fails.push('ไม่มี Conditional Formatting');
              if (/#REF!|#VALUE!|#DIV\/0!/.test(sx)) fails.push('พบ Formula Error');
              var codes = {};
              c.sumRows.forEach(function (x) {
                if (codes[x.cells[1]]) fails.push('รหัสพนักงานซ้ำ: ' + x.cells[1]);
                codes[x.cells[1]] = 1;
              });
              if (fails.length) throw new Error('ตรวจสอบไฟล์ไม่ผ่าน:\n• ' + fails.join('\n• '));

              var pe = rpState.empId ? emp(rpState.empId) : null;
              var part = pe ? pe.code : (rpState.deptId ? dept(rpState.deptId) : '');
              var name = 'REPORT_ALL_' + (part ? rptSafeName(part) + '_' : '') +
                rpBEStamp(c.r.s) + '_ถึง_' + rpBEStamp(c.r.e) + '.xlsx';
              var a = document.createElement('a');
              a.href = URL.createObjectURL(blob); a.download = name;
              document.body.appendChild(a); a.click(); a.remove();
              setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
              audit('REPORT_ALL_EXPORT', name + ' · พนักงาน ' + c.emps.length + ' · OT ' + c.otRows.length + ' รายการ');
              var pd = rpState.deptId ? dept(rpState.deptId) : 'ทุกแผนก';
              st.innerHTML = '<b>Export REPORT ALL สำเร็จ</b><br>' +
                'ช่วงวันที่: ' + rpDMY(c.r.s) + ' – ' + rpDMY(c.r.e) + '<br>' +
                'แผนก: ' + esc(pd) + '<br>' +
                'พนักงาน: ' + esc(pe ? (pe.code + ' ' + pe.firstName + ' ' + pe.lastName) : 'ทุกคน') + '<br>' +
                'จำนวนพนักงาน: ' + c.emps.length + '<br>' +
                'จำนวนรายการลงเวลา: ' + c.att.length + '<br>' +
                'จำนวนรายการลา: ' + c.leaves.length + '<br>' +
                'จำนวนรายการ OT: ' + c.otRows.length + '<br>' +
                'จำนวนรายการซ้ำที่ถูกตัด: ' + c.dupCut + '<br>' +
                'จำนวนคำเตือน: ' + c.warn.length + '<br>' +
                'จำนวน Sheet: 1 (REPORT ALL)<br>' +
                'ตรวจสอบไฟล์ที่สร้างแล้ว: ผ่าน';
              document.getElementById('rp-warn').innerHTML = c.warn.length
                ? '<b>คำเตือน</b><br>• ' + c.warn.map(esc).join('<br>• ') : '';
            });
          });
        });
      });
    }).catch(function (e) {
      st.textContent = '';
      errEl.textContent = e.message || String(e);
    }).then(function () {
      btn.disabled = false; btn.innerHTML = icon('download') + ' EXPORT EXCEL';
    });
  }

  /* ================= REPORT ALL =================
     ตัวกรอง: ช่วงวันที่อิสระ (รองรับข้ามเดือน) · แผนก (Department ID จริง) · ค้นหาพนักงาน (Employee ID จริง)
     Preview การ์ดสรุป และ Export ใช้ rpCollect() ชุดเดียวกัน */
  /* ตัวกรองหลักคือ "รอบเดือน 26–25" (ym) เหมือนรายงานการลาและรายงานโอที
     ค่าเริ่มต้น = รอบเดือนปัจจุบัน · ช่วงวันที่จริงมาจาก cycleRange() ตัวกลางตัวเดียวกัน */
  var rpState = { ym: '', deptId: '', empId: '', q: '', seq: 0 };
  var rpData = null;

  function rpCanUse() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }

  /* รอบที่กำลังเลือกอยู่ — ไม่มีค่า = รอบปัจจุบัน จึงไม่มีทางว่าง */
  function rpCycle() {
    if (!rpState.ym) rpState.ym = cycleCurrent().ym;
    return cycleRange(rpState.ym) || cycleCurrent();
  }

  /* รอบเดือนมีค่าเสมอ จึงไม่มีข้อผิดพลาดเรื่องช่วงวันที่อีก
     คงฟังก์ชันไว้เพื่อไม่ต้องแก้จุดเรียกเดิม */
  function rpDateErr() { return ''; }

  function rpRangeOf() {
    var c = rpCycle();
    return { s: c.start, e: c.end, lastDay: 25 };   // รอบจบวันที่ 25 เสมอ
  }

