  /* ---------- ประวัติลางานและ OT รวมหน้าเดียว ----------
     ใช้ RPC เดิมทั้งคู่: njhr_leave_list (ของตนเอง) + njhr_ot_list (p_mine = true)
     ไม่แตะสูตรหรือ Workflow ใด ๆ เป็นหน้าอ่านอย่างเดียว */



  /* ---------- รายละเอียดคำขอในประวัติ (ดึงด้วย ID จริงจาก Supabase) ----------
     ลา → njhr_leave_detail(p_token, p_leave_id)
     OT → njhr_ot_get(p_token, p_id)
     ปิดแล้วกลับหน้าประวัติเดิมโดยไม่โหลดใหม่ (ตัวกรองและข้อมูลยังอยู่ใน rhState) */




  /* ================= VIEW: LEAVE (Supabase) =================
     ข้อมูลทั้งหมดมาจาก leave_requests / leave_attachments ผ่าน RPC njhr_leave_*
     ไม่อ่านและไม่เขียน db.leaves / db.balances / db.leaveTypes อีกต่อไป
     Supabase error = แสดงข้อความจริง ไม่ fallback ไปข้อมูลในเครื่อง */







  // ยกเลิกคำขอลาจริงบน Supabase (เจ้าของใบ + PENDING เท่านั้น — ตรวจซ้ำฝั่งเซิร์ฟเวอร์)

  // Timeline + ไฟล์แนบ อ่านจาก njhr_leave_detail (approvals jsonb + leave_attachments)


  /* แสดงรายการงาน OT แยกเป็นรายแถว — ไฟล์แนบทุกไฟล์อยู่ในแถวของ JOB ตัวเอง
     และกำกับชื่อ JOB ไว้ที่ไฟล์ทุกไฟล์ เพื่อไม่ให้ไฟล์ของหลายรายการปนกันโดยไม่รู้ที่มา
     ปุ่มดู/ดาวน์โหลดใช้ key "<เลขรายการ>-<ลำดับไฟล์>" ผูกกับรายการโดยตรง */
  // ผูกปุ่มดู/ดาวน์โหลดไฟล์ของรายการงาน OT ภายในขอบเขตที่กำหนด


  /* ================= ฟอร์มขอลางาน =================
     ข้อมูลผู้ยื่นอ่านจาก Session (แก้เองไม่ได้) · ประเภทลาจาก enum จริง ·
     จำนวนวัน/ชั่วโมงคำนวณอัตโนมัติ · ไฟล์แนบได้หลายไฟล์ผูกกับใบลาใบนี้ ·
     เซิร์ฟเวอร์คำนวณและตรวจซ้ำทุกข้อใน njhr_leave_submit */


  /* ================= VIEW: OT ================= */

  /* ---------- ตัวช่วยรายการงาน OT ----------
     ชั่วโมงคำนวณจากเวลาเริ่ม→สิ้นสุดเสมอ (ผู้ใช้กรอกเองไม่ได้) รองรับ OT ข้ามวัน */
  // ช่วงเวลาแบบสัมบูรณ์ (นาทีนับจาก epoch-day) ใช้ตรวจการซ้อนทับข้ามวันได้ถูกต้อง
  // รายการงานต้องมี JOB / ประเภทงาน (วันที่-เวลาอยู่ระดับคำขอแล้ว · รายละเอียดถูกยกเลิกจากตาราง)
  /* Compatibility Layer: คำขอเก่าที่มีแต่ข้อมูลระดับคำขอ ให้มองเป็นรายการงาน 1 รายการ
     อ่านอย่างเดียว — ไม่เขียนทับข้อมูลเดิมในฐานข้อมูล */
  // หาการซ้อนทับ: ภายในคำขอเดียวกัน + กับคำขออื่นของพนักงานคนเดียวกันที่ยังมีผล


  /* ================= VIEW: APPROVALS ================= */

  // แท็บ "คำขอลา" อ่านจาก Supabase (njhr_leave_queue) · แท็บ OT/แก้ไขเวลา ยังใช้ชั้นข้อมูลเดิม
  /* ================= REQUESTS + LEAVE (#/requests · #/req-history · #/leave) =================
     ย้ายมาจาก 10-view-requests-leave-ot.js โดยไม่แก้เนื้อใน ================= */
  /* ---------- ตัวโหลด Action Module (หน้าคำขอ/ลางาน) ----------
     กันกดซ้ำ · ตรวจ session และ Navigation ID ก่อนเปิด · ไม่เปิดของเก่าหลังเปลี่ยนหน้า */
  function lvOpenAction(mod, btn, fn) {
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

  /* Public Feature Contract ของ Leave Main — Form/Detail เรียกผ่านตัวนี้เท่านั้น */
  NJHR.features.leaveList = {
    resetPage: function () { lvPage = 0; },
    refresh: function (el) { viewLeave(el); }
  };

  /* ================= VIEW: REQUESTS (#/requests) =================
     Desktop คงของเดิมทุกบรรทัด — ห่อด้วย .only-desktop
     มือถือใช้ Layout ใหม่ .req-mb ตามภาพ PNG แบบผสมล่าสุด (Employee Self Service)
       สิทธิ์ลาคงเหลือ  njhr_leave_balances (remaining)
       รายการคำขอรวม   njhr_leave_list · njhr_ot_list (p_mine=true) · njhr_att_correction_list
     ทั้ง 3 ตัวโหลดแบบ allSettled — ประเภทหนึ่งล้ม อีกประเภทยังแสดงได้
     ทุก RPC ผูกกับ token ของผู้ล็อกอิน จึงเห็นเฉพาะคำขอของตนเองทุก Role ================= */
  var reqMb = { seq: 0, tab: 'all', rows: null, part: {}, loading: false, reqEmpErr: '' };

  var REQ_TABS = [['all', 'ล่าสุด'], ['pending', 'รออนุมัติ'], ['done', 'เสร็จแล้ว']];
  /* ไอคอนใช้ชุด SVG ของระบบ (icon()) ไม่ใช้ Emoji */
  var REQ_BAL_IC = { sick: 'plus', biz: 'user', vac: 'calendar' };
  var REQ_KIND = {
    LEAVE: { ic: 'calendarOff', cls: 'k-lv' },
    OT: { ic: 'timer', cls: 'k-ot' },
    FIX: { ic: 'history', cls: 'k-fix' }
  };

  // วันที่บนรายการคำขอฝั่งมือถือ — ใช้ตัวแปลงกลาง fmtDateDMY() เพื่อให้ตรงกับ Desktop
  function reqThaiDate(v) { return fmtDateDMY(v); }
  function reqHM(ts) {
    var m = /T(\d{2}):(\d{2})/.exec(String(ts || ''));
    return m ? m[1] + ':' + m[2] : '';
  }

  function viewRequests(el) {
    var seq = ++rqState.seq;
    reqMb.seq = seq; reqMb.rows = null; reqMb.part = {}; reqMb.loading = true;
    var me = currentEmp();
    reqMb.reqEmpErr = (me && me.id) ? '' : 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน จึงสร้างคำขอไม่ได้ กรุณาติดต่อฝ่ายบุคคล';

    /* ---------- Desktop: ของเดิมทุกบรรทัด ---------- */
    el.innerHTML =
      '<div class="only-desktop">' +
      '<div class="rq-skel"></div>' +
      '<div class="rq-menu" id="rq-menu"></div>' +
      '<div class="form-error rq-err" id="rq-err" role="alert"></div></div>' +

      /* ---------- Mobile: Layout ใหม่ตามภาพ PNG ---------- */
      '<div class="req-mb only-mobile" id="req-mb">' +
      '<div class="req-mb-bar">' +
      '<span class="req-mb-logo">NJL</span>' +
      '<span class="grow"><b>NJL HR</b><small>ระบบบริหารทรัพยากรบุคคล</small></span>' +
      '<a class="req-mb-bell" href="#/notifications" aria-label="การแจ้งเตือน">' + icon('bell') + '</a>' +
      '</div>' +
      '<h2 class="req-mb-title">คำขอ</h2>' +

      '<section class="req-mb-bal" id="req-bal">' +
      '<div class="req-mb-bal-h">' + icon('chart', 'ic-sm') + '<b>สรุปวันลาปีนี้</b>' +
      '<small>ลาแล้ว</small></div>' +
      '<div class="req-mb-bal-g">' +
      RQ_CARDS.map(function (c) {
        return '<div class="req-bi ' + c.cls + '"><span class="req-bi-ic">' +
          icon(REQ_BAL_IC[c.key] || 'calendar') + '</span>' +
          '<span class="req-bi-l">' + esc(c.label) + '</span>' +
          '<span class="req-bi-v"><i class="req-sk"></i></span></div>';
      }).join('') + '</div></section>' +

      '<div class="req-mb-acts" id="req-acts">' +
      '<button type="button" class="req-act a-lv" data-act="leave">' +
      '<span class="req-act-ic">' + icon('calendarOff') + '</span>' +
      '<span class="grow"><b>ยื่นใบลา</b><small>ส่งคำขอลาออนไลน์</small></span>' +
      '<span class="req-act-x">' + icon('chevR') + '</span></button>' +
      '<button type="button" class="req-act a-ot" data-act="ot">' +
      '<span class="req-act-ic">' + icon('timer') + '</span>' +
      '<span class="grow"><b>ขอ OT</b><small>ขอทำงานล่วงเวลา</small></span>' +
      '<span class="req-act-x">' + icon('chevR') + '</span></button>' +
      '<button type="button" class="req-act a-fix" data-act="fix">' +
      '<span class="req-act-ic">' + icon('history') + '</span>' +
      '<span class="grow"><b>ลงชื่อย้อนหลัง</b><small>ขอแก้ไขเวลาเข้า–ออก</small></span>' +
      '<span class="req-act-x">' + icon('chevR') + '</span></button></div>' +

      '<div class="req-mb-tabs" id="req-tabs" role="tablist">' +
      REQ_TABS.map(function (t) {
        return '<button type="button" role="tab" class="req-tab' + (reqMb.tab === t[0] ? ' on' : '') +
          '" data-tab="' + t[0] + '" aria-selected="' + (reqMb.tab === t[0]) + '">' + t[1] + '</button>';
      }).join('') + '</div>' +

      '<div class="req-mb-list" id="req-list">' +
      '<div class="req-sk-row"></div><div class="req-sk-row"></div></div>' +
      (reqMb.reqEmpErr ? '<div class="req-mb-block">' + icon('info', 'ic-sm') +
        '<span>' + esc(reqMb.reqEmpErr) + '</span></div>' : '') +
      '<div class="req-mb-err" id="req-mb-err" role="alert"></div></div>';

    rqRenderMenu(el);
    reqBindMobile(el);

    if (!sbReady()) {
      var de = document.getElementById('rq-err');
      if (de) de.textContent = 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase';
      reqSetErr('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');
      return;
    }

    /* ---------- สิทธิ์การลา ---------- */
    sbRpcList('njhr_leave_balances', { p_token: sbToken() })
      .then(function (rows) {
        if (seq !== rqState.seq) return;
        rqState.bal = rows || []; rqState.err = '';
        rqRenderBal(el); reqRenderBal();
      })
      .catch(function (ex) {
        if (seq !== rqState.seq) return;
        rqState.bal = []; rqState.err = (ex && ex.message) || 'โหลดสิทธิ์การลาไม่สำเร็จ';
        rqRenderBal(el); reqRenderBal();
      });

    /* ---------- รายการคำขอรวม 3 ประเภท ---------- */
    reqLoadList(seq, me);
  }

  /* โหลดคำขอ 3 ประเภทพร้อมกัน — ประเภทใดล้ม ประเภทอื่นยังแสดงต่อได้ */
  function reqLoadList(seq, me) {
    var tk = sbToken();
    var settle = function (p) {
      return p.then(function (v) { return { ok: true, v: v }; },
                    function (e) { return { ok: false, e: (e && e.message) || 'โหลดไม่สำเร็จ' }; });
    };
    Promise.all([
      settle(sbRpcList('njhr_leave_list', { p_token: tk, p_status: null, p_limit: 100, p_offset: 0 })),
      settle(sbRpcList('njhr_ot_list', { p_token: tk, p_from: null, p_to: null, p_status: null,
        p_dept: null, p_employee: null, p_q: null, p_mine: true, p_limit: 100, p_offset: 0 })),
      settle(sbRpcList('njhr_att_correction_list', { p_token: tk, p_employee: (me && me.id) || null,
        p_status: null, p_limit: 100, p_offset: 0 }))
    ]).then(function (r) {
      if (seq !== reqMb.seq) return;
      var rows = [], part = {};
      if (r[0].ok) {
        (r[0].v || []).forEach(function (x) {
          rows.push({ kind: 'LEAVE', id: x.id, title: x.leave_type || 'ลางาน',
            date: String(x.start_date || '').slice(0, 10),
            date2: String(x.end_date || '').slice(0, 10),
            sub: (x.total_days != null ? x.total_days + ' วัน'
                  : (x.hours ? x.hours + ' ชั่วโมง' : '')),
            status: x.ui_status || x.status, at: x.created_at });
        });
      } else part.leave = r[0].e;
      if (r[1].ok) {
        (r[1].v || []).forEach(function (x) {
          rows.push({ kind: 'OT', id: x.id, title: 'OT',
            date: String(x.ot_date || '').slice(0, 10), date2: '',
            sub: (x.ot_hours != null ? x.ot_hours + ' ชั่วโมง' : ''),
            status: x.status, at: x.created_at });
        });
      } else part.ot = r[1].e;
      if (r[2].ok) {
        (r[2].v || []).forEach(function (x) {
          var a = reqHM(x.new_check_in), b = reqHM(x.new_check_out);
          rows.push({ kind: 'FIX', id: x.id, title: 'ลงชื่อย้อนหลัง',
            date: String(x.work_date || '').slice(0, 10), date2: '',
            sub: (a || b) ? ('เวลา ' + (a || '—') + ' – ' + (b || '—')) : '',
            status: x.status, at: x.created_at || x.requested_at });
        });
      } else part.fix = r[2].e;
      rows.sort(function (a, b) {
        var k = String(b.at || '').localeCompare(String(a.at || ''));
        return k !== 0 ? k : String(b.date || '').localeCompare(String(a.date || ''));
      });
      reqMb.rows = rows; reqMb.part = part; reqMb.loading = false;
      reqRenderList();
    });
  }

  function reqSetErr(msg) {
    var b = document.getElementById('req-mb-err');
    if (b) b.textContent = msg || '';
  }

  function reqRenderBal() {
    var box = document.getElementById('req-bal');
    if (!box) return;
    var g = box.querySelector('.req-mb-bal-g');
    if (!g) return;
    if (rqState.err) {
      g.innerHTML = '<div class="req-bal-err">' + icon('info', 'ic-sm') +
        '<span>โหลดสิทธิ์การลาไม่สำเร็จ</span></div>';
      return;
    }
    g.innerHTML = RQ_CARDS.map(function (c) {
      var r = rqPick(rqState.bal || [], c);
      /* ตัวเลขหลัก = "ลาแล้ว" จาก used เท่านั้น (ไม่รวม pending)
         ไม่มีข้อมูลประเภทนี้ = แสดง — ห้ามเดาเป็นศูนย์
         พักร้อนเป็นประเภทเดียวที่แสดง "คงเหลือ" ต่อท้าย */
      var has = !!r;
      var used = has ? lvUsedDays(r) : null;
      var rem = (has && c.key === 'vac') ? lvRemainDays(r) : null;
      return '<div class="req-bi ' + c.cls + '"><span class="req-bi-ic">' +
        icon(REQ_BAL_IC[c.key] || 'calendar') + '</span>' +
        '<span class="req-bi-l">' + esc(c.label) + '</span>' +
        '<span class="req-bi-v">' + (has ? '<b>' + esc(String(used)) + '</b><i>วัน</i>'
                                          : '<b class="req-bi-na">—</b>') + '</span>' +
        (rem != null ? '<span class="req-bi-rem">คงเหลือ ' + esc(String(rem)) + ' วัน</span>' : '') +
        '</div>';
    }).join('');
  }

  function reqTabRows() {
    var rows = reqMb.rows || [];
    if (reqMb.tab === 'all') return rows;
    return rows.filter(function (r) {
      var k = rhStatus(r.status).k;
      return reqMb.tab === 'pending' ? k === 'PENDING' : k !== 'PENDING';
    });
  }

  function reqRenderList() {
    var box = document.getElementById('req-list');
    if (!box) return;
    var partMsg = '';
    ['leave', 'ot', 'fix'].forEach(function (k) {
      if (reqMb.part[k]) {
        partMsg += (partMsg ? ' · ' : '') +
          ({ leave: 'ใบลา', ot: 'OT', fix: 'ลงชื่อย้อนหลัง' })[k] + 'โหลดไม่สำเร็จ';
      }
    });
    var warn = partMsg ? '<div class="req-part-err">' + icon('info', 'ic-sm') +
      '<span>' + esc(partMsg) + '</span></div>' : '';
    if (reqMb.rows === null) {
      box.innerHTML = warn + '<div class="req-sk-row"></div><div class="req-sk-row"></div>';
      return;
    }
    var rows = reqTabRows();
    if (!rows.length) {
      var msg = reqMb.tab === 'pending' ? 'ไม่มีรายการรออนุมัติ'
              : reqMb.tab === 'done' ? 'ไม่มีรายการที่เสร็จแล้ว' : 'ยังไม่มีคำขอ';
      box.innerHTML = warn + '<div class="req-empty">' + icon('fileText') +
        '<b>' + esc(msg) + '</b></div>';
      return;
    }
    box.innerHTML = warn + rows.map(function (r) {
      var st = rhStatus(r.status);
      var K = REQ_KIND[r.kind] || REQ_KIND.LEAVE;
      var when = reqThaiDate(r.date) +
        (r.date2 && r.date2 !== r.date ? ' – ' + reqThaiDate(r.date2) : '');
      return '<button type="button" class="req-row" data-rq="' + esc(r.kind) + ':' + esc(r.id) + '">' +
        '<span class="req-row-ic ' + K.cls + '">' + icon(K.ic, 'ic-sm') + '</span>' +
        '<span class="grow"><b>' + esc(r.title) + ' · ' + esc(when) + '</b>' +
        (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="req-bd ' + st.c + '">' + st.t + '</span>' +
        '<span class="req-row-x">' + icon('chevR') + '</span></button>';
    }).join('');
  }

  function reqBindMobile(el) {
    var acts = document.getElementById('req-acts');
    if (acts) acts.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      if (reqMb.reqEmpErr) { reqSetErr(reqMb.reqEmpErr); return; }
      reqSetErr('');
      var a = b.dataset.act;
      /* lvOpenAction กันกดซ้ำและแสดง spinner บนปุ่มให้แล้ว (data-busy) */
      if (a === 'leave') { nav('#/leave'); return; }
      if (a === 'ot') { nav('#/ot'); return; }
      lvOpenAction('attendance-correction', b, function () {
        NJHR.features.attendanceCorrection.open();
      });
    };
    var tabs = document.getElementById('req-tabs');
    if (tabs) tabs.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-tab]') : null;
      if (!b || b.dataset.tab === reqMb.tab) return;
      reqMb.tab = b.dataset.tab;
      /* เปลี่ยนแท็บใช้ข้อมูลที่โหลดแล้ว ไม่ยิง RPC ซ้ำ */
      Array.prototype.forEach.call(tabs.querySelectorAll('.req-tab'), function (t) {
        var on = t.dataset.tab === reqMb.tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', String(on));
      });
      reqRenderList();
    };
    var list = document.getElementById('req-list');
    if (list) list.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-rq]') : null;
      if (!b) return;
      var v = b.dataset.rq, i = v.indexOf(':');
      lvOpenAction('request-detail', b, function () {
        NJHR.features.requestDetail.open(v.slice(0, i), v.slice(i + 1), el);
      });
    };
  }

  function rqRenderBal(el) {
    var box = el.querySelector('.rq-skel') || el.querySelector('.rq-bal');
    if (!box) return;
    if (rqState.err) {
      var w = document.createElement('div');
      w.className = 'card';
      w.innerHTML = '<div class="ot-warn"><b>โหลดสิทธิ์การลาไม่สำเร็จ</b><br>' + esc(rqState.err) + '</div>';
      box.replaceWith(w);
      return;
    }
    var d = document.createElement('div');
    d.className = 'rq-bal';
    d.innerHTML = '<div class="rq-bal-h" style="grid-column:1/-1">' +
      '<span class="rq-bal-hic">' + icon('chart', 'ic-sm') + '</span>สรุปวันลาปีนี้ (ลาแล้ว)</div>' +
      RQ_CARDS.map(function (c) {
        var r = rqPick(rqState.bal, c);
        /* ตัวเลข = ลาแล้ว (used) · พักร้อนแสดงคงเหลือต่อท้ายได้ประเภทเดียว */
        var rem = (r && c.key === 'vac') ? lvRemainDays(r) : null;
        return '<div class="rq-bal-i ' + c.cls + '"><div class="rq-bal-ic">' + c.em + '</div>' +
          '<span class="lbl">' + c.label + '</span>' +
          '<span class="rq-pill"><b>' + (r ? lvUsedDays(r) : '—') + '</b>' +
          '<small>' + (r ? 'วัน' : 'ไม่มีข้อมูล') + '</small></span>' +
          (rem != null ? '<span class="rq-bal-rem">คงเหลือ ' + esc(String(rem)) + ' วัน</span>' : '') +
          '</div>';
      }).join('');
    box.replaceWith(d);
  }

  function rqRenderMenu(el) {
    var box = document.getElementById('rq-menu');
    if (!box) return;
    var items = [
      ['#/leave', 'calendarOff', 'ยื่นใบลา', 'ส่งคำขอลาออนไลน์'],
      ['#/ot', 'timer', 'ขอ OT', 'ขอทำงานล่วงเวลา'],
      ['#/req-history', 'history', 'ประวัติลางานและ OT', 'ดูสถานะและผลอนุมัติ']
    ];
    if (canAccess('#/approvals')) {
      items.push(['#/approvals', 'checkSquare', 'รายการรออนุมัติ', 'คำขอที่รอคุณพิจารณา']);
    }
    var TONE = { '#/leave': 'rc-red', '#/ot': 'rc-purple',
                 '#/req-history': 'rc-blue', '#/approvals': 'rc-teal' };
    box.innerHTML = items.map(function (it) {
      return '<button type="button" class="rq-card ' + (TONE[it[0]] || '') + '" data-go="' + it[0] + '">' +
        '<span class="ic-wrap">' + icon(it[1]) + '</span>' +
        '<span class="grow"><b>' + esc(it[2]) + '</b><small>' + esc(it[3]) + '</small></span>' +
        '<span class="arrow">' + icon('chevR') + '</span></button>';
    }).join('');
    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-go]') : null;
      if (b) nav(b.dataset.go);
    };
  }

  var rhState = { seq: 0, filter: '', rows: [], err: '', loading: false };

  var RH_FILTERS = [['', 'ทั้งหมด'], ['PENDING', 'รออนุมัติ'], ['APPROVED', 'อนุมัติแล้ว'],
                    ['REJECTED', 'ไม่อนุมัติ'], ['CANCELLED', 'ยกเลิก']];

  function rhStatus(s2) {
    var k = String(s2 || '').toUpperCase();
    if (k.indexOf('APPROV') >= 0 || k === 'COMPLETED') return { t: 'อนุมัติแล้ว', c: 'badge-ok', k: 'APPROVED' };
    if (k.indexOf('REJECT') >= 0) return { t: 'ไม่อนุมัติ', c: 'badge-bad', k: 'REJECTED' };
    if (k.indexOf('CANCEL') >= 0) return { t: 'ยกเลิก', c: 'badge-mut', k: 'CANCELLED' };
    return { t: 'รออนุมัติ', c: 'badge-warn', k: 'PENDING' };
  }

  function viewReqHistory(el) {
    var seq = ++rhState.seq;
    rhState.loading = true;
    el.innerHTML =
      '<div class="toolbar" id="rh-tabs">' + RH_FILTERS.map(function (f) {
        return '<button type="button" class="chip' + (rhState.filter === f[0] ? ' chip-info' : '') +
          '" data-f="' + f[0] + '">' + f[1] + '</button>';
      }).join('') + '</div>' +
      '<div id="rh-body"><div class="card"><div class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดจาก Supabase…</div></div></div>' +
      '<div class="form-error" id="rh-err" role="alert"></div>';

    document.getElementById('rh-tabs').onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-f]') : null;
      if (!b) return;
      rhState.filter = b.dataset.f; viewReqHistory(el);
    };

    Promise.all([
      sbRpcList('njhr_leave_list', { p_token: sbToken(), p_status: null, p_limit: 100, p_offset: 0 }),
      sbRpcList('njhr_ot_list', { p_token: sbToken(), p_from: null, p_to: null, p_status: null,
        p_dept: null, p_employee: null, p_q: null, p_mine: true, p_limit: 100, p_offset: 0 })
    ]).then(function (r) {
      if (seq !== rhState.seq) return;
      var rows = [];
      (r[0] || []).forEach(function (x) {
        rows.push({ kind: 'LEAVE', id: x.id, title: x.leave_type,
          date: String(x.start_date || '').slice(0, 10),
          date2: String(x.end_date || '').slice(0, 10),
          qty: (x.total_days != null ? x.total_days + ' วัน' : (x.hours ? x.hours + ' ชม.' : '')),
          status: x.ui_status || x.status, at: x.created_at });
      });
      (r[1] || []).forEach(function (x) {
        rows.push({ kind: 'OT', id: x.id, title: 'OT',
          date: String(x.ot_date || '').slice(0, 10), date2: '',
          qty: (x.ot_hours != null ? x.ot_hours + ' ชม.' : ''),
          status: x.status, at: x.created_at });
      });
      rows.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
      rhState.rows = rows; rhState.err = ''; rhState.loading = false;
      rhRender(el);
    }).catch(function (ex) {
      if (seq !== rhState.seq) return;
      rhState.rows = []; rhState.loading = false;
      rhState.err = (ex && ex.message) || 'โหลดประวัติจาก Supabase ไม่สำเร็จ';
      rhRender(el);
    });
  }

  function rhRender(el) {
    var box = document.getElementById('rh-body');
    if (!box) return;
    if (rhState.err) {
      box.innerHTML = '<div class="card"><div class="ot-warn"><b>โหลดข้อมูลไม่สำเร็จ</b><br>' +
        esc(rhState.err) + '</div>' +
        '<p class="muted note">หน้านี้อ่านจาก Supabase เท่านั้น จึงไม่แสดงข้อมูลเดิมที่ค้างในเครื่อง</p></div>';
      return;
    }
    var rows = rhState.rows.filter(function (r) {
      return !rhState.filter || rhStatus(r.status).k === rhState.filter;
    });
    if (!rows.length) { box.innerHTML = emptyState('ไม่มีรายการในตัวกรองนี้'); return; }
    box.innerHTML = '<div class="list">' + rows.map(function (r) {
      var st = rhStatus(r.status);
      var when = fmtDateDMY(r.date) + (r.date2 && r.date2 !== r.date ? ' – ' + fmtDateDMY(r.date2) : '');
      return '<div class="list-row" data-rh="' + esc(r.kind) + ':' + esc(r.id) + '">' +
        '<div class="grow"><b>' + esc(r.kind === 'OT' ? 'OT' : r.title) + '</b>' +
        '<small>' + esc(when) + (r.qty ? ' · ' + esc(r.qty) : '') + '</small></div>' +
        '<span class="badge ' + st.c + '">' + st.t + '</span>' +
        '<span class="muted">' + icon('chevR') + '</span></div>';
    }).join('') + '</div>';

    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-rh]') : null;
      if (!b) return;
      var i = b.dataset.rh.indexOf(':');
      // ส่ง Record ID จริงของรายการที่กด — ไม่เลือกจากลำดับแถวหรือข้อความบนหน้าจอ
        // Runtime Split — รายละเอียดคำขออยู่คนละ chunk โหลดเมื่อกดเท่านั้น
        (function (kk, ii, bb) {
          lvOpenAction('request-detail', bb, function () { NJHR.features.requestDetail.open(kk.slice(0, ii), kk.slice(ii + 1), el); });
        })(b.dataset.rh, i, b);
    };
  }


  function rhRow(k, v) {
    return '<div class="rh-drow"><span class="k">' + esc(k) + '</span>' +
      '<span class="v">' + (v == null || v === '' ? '—' : v) + '</span></div>';
  }




  var leaveFilter = '';

  var LV_PER = 20;

  var lvSeq = 0, lvPage = 0, lvBal = {}, lvBusy = false;

  function lvSetErr(msg) { var b = document.getElementById('lv-err'); if (b) b.textContent = msg || ''; }

  function viewLeave(el) {
    var e = currentEmp();
    if (!e) { el.innerHTML = emptyState('บัญชีนี้ไม่ได้ผูกกับพนักงาน'); return; }
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase (NJHR_SUPABASE_URL / ANON_KEY)'); return; }
    var seq = ++lvSeq;

    el.innerHTML =
      /* การ์ดสิทธิ์ลาป่วย/ลากิจ/พักร้อน แสดงเฉพาะ Desktop
         บนมือถือดูได้ที่หน้าคำขอ (#/requests) การ์ด "สรุปสิทธิ์การลา" อยู่แล้ว */
      '<div class="bal-cards only-desktop" id="lv-bal"></div>' +
      '<div class="toolbar"><h3>คำขอลาของฉัน</h3>' +
      '<select id="lv-filter"><option value="">ทุกสถานะ</option>' + ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map(function (st) {
        return '<option value="' + st + '"' + (leaveFilter === st ? ' selected' : '') + '>' + { PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', CANCELLED: 'ยกเลิกแล้ว', COMPLETED: 'เสร็จสิ้น' }[st] + '</option>';
      }).join('') + '</select>' +
      '<span class="grow"></span><span class="muted" id="lv-count"></span>' +
      '<button class="btn btn-primary" id="lv-new">' + icon('plus') + ' ขอลางาน</button></div>' +
      '<div class="req-list" id="lv-list"><div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div></div>' +
      '<div class="toolbar" id="lv-pager"></div>' +
      '<div class="form-error" id="lv-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('lv-filter').onchange = function () { leaveFilter = this.value; lvPage = 0; viewLeave(el); };
    // Runtime Split — แบบฟอร์มขอลาอยู่คนละ chunk โหลดเมื่อกดเท่านั้น
    document.getElementById('lv-new').onclick = function () {
      lvOpenAction('leave-form', this, function () { NJHR.features.leaveForm.open(el); });
    };
    lvLoad(el, seq);
  }

  function lvLoad(el, seq) {
    var tk = sbToken();
    lvSetErr('');
    Promise.all([
      sbRpcList('njhr_leave_balances', { p_token: tk }),
      sbRpcList('njhr_leave_list', { p_token: tk, p_status: leaveFilter || null, p_limit: LV_PER, p_offset: lvPage * LV_PER })
    ]).then(function (res) {
      if (seq !== lvSeq) return;                       // เปลี่ยนหน้า/เปลี่ยนตัวกรองแล้ว ทิ้งผลเก่า
      // แก้ค่าใน object ตัวเดิม ไม่สร้างตัวใหม่ — chunk leave-form รับ lvBal ผ่าน
      // NJHR.compat.scope ตอนโหลด chunk ครั้งเดียว ถ้าสร้าง object ใหม่ ฝั่งฟอร์มจะยังชี้ใบว่างเดิม
      Object.keys(lvBal).forEach(function (k) { delete lvBal[k]; });
      res[0].forEach(function (b) { lvBal[b.leave_type] = b; });
      lvRenderBal();
      lvRenderList(el, res[1]);
    }).catch(function (er) {
      if (seq !== lvSeq) return;
      var list = document.getElementById('lv-list');
      if (list) list.innerHTML = '<div class="card">' + emptyState('โหลดข้อมูลลาไม่สำเร็จ') + '</div>';
      lvSetErr('โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er));
    });
  }

  function lvRenderBal() {
    var box = document.getElementById('lv-bal');
    if (!box) return;
    /* แสดงทุกประเภทที่ RPC ส่งมา (njhr_leave_balances คืนครบทุกประเภทอยู่แล้ว)
       ตัวเลขหลัก = "ลาแล้ว" จาก used เท่านั้น — ไม่แสดง quota และไม่แสดงแถบสัดส่วนสิทธิ์
       ลาพักร้อนประเภทเดียวที่แสดง "คงเหลือ" เพิ่ม */
    box.innerHTML = LEAVE_TYPES.filter(function (t) { return !!lvBal[t.code]; })
      .map(function (t) {
        var b = lvBal[t.code];
        var used = lvUsedDays(b);
        var rem = lvIsVacation(t.code) ? lvRemainDays(b) : null;
        return '<div class="card bal-card"><small>' + esc(t.name) + '</small>' +
          '<b>' + used + ' <i>วัน</i></b>' +
          '<small class="muted">ลาแล้ว</small>' +
          (rem != null ? '<small class="bal-rem">คงเหลือ ' + esc(String(rem)) + ' วัน</small>' : '') +
          '</div>';
      }).join('');
  }

  function lvRenderList(el, rows) {
    var list = document.getElementById('lv-list');
    if (!list) return;
    var total = rows.length ? Number(rows[0].total_count) : 0;
    list.innerHTML = rows.length
      ? (lvDeskTable(rows, true) + rows.map(function (l) { return leaveCard(l, true); }).join(''))
      : '<div class="card">' + emptyState(leaveFilter ? 'ไม่มีคำขอลาในสถานะนี้' : 'ยังไม่มีคำขอลา กด "ขอลางาน" เพื่อเริ่ม') + '</div>';

    var cnt = document.getElementById('lv-count');
    if (cnt) cnt.textContent = total ? 'ทั้งหมด ' + total + ' รายการ' : '';

    var pages = Math.ceil(total / LV_PER) || 1, pg = document.getElementById('lv-pager');
    if (pg) {
      pg.innerHTML = pages > 1
        ? '<button class="btn btn-ghost btn-sm" id="lv-prev"' + (lvPage === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
          '<span class="muted">หน้า ' + (lvPage + 1) + ' / ' + pages + '</span>' +
          '<button class="btn btn-ghost btn-sm" id="lv-next"' + (lvPage + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button>' : '';
      if (pages > 1) {
        document.getElementById('lv-prev').onclick = function () { if (lvPage > 0) { lvPage--; viewLeave(el); } };
        document.getElementById('lv-next').onclick = function () { if (lvPage + 1 < pages) { lvPage++; viewLeave(el); } };
      }
    }
    // ผูก event ครั้งเดียวต่อการเรนเดอร์ (ไม่ผูกซ้ำต่อการ์ด)
    list.onclick = function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-lvdetail],[data-lvcancel]') : null;
      if (!t || !list.contains(t)) return;
      if (t.dataset.lvdetail) lvShowTimeline(t.dataset.lvdetail);
      else lvCancel(t.dataset.lvcancel, el);
    };
  }

  /* ---------- ตารางเดียวเฉพาะ Desktop (.only-desktop) ----------
     <thead> และ <tbody> อยู่ในตารางเดียวกัน · ทุกแถวตรงกับหัวคอลัมน์
     Mobile View เดิม (.req-card.only-mobile) อยู่ครบด้านล่าง ไม่ถูกแตะแม้แต่บรรทัดเดียว
     ปุ่มใช้ data-lvdetail / data-lvcancel ตัวเดิม Handler จึงเป็นของเดิมทั้งหมด */
  /* ข้อความคอลัมน์ "จำนวนวัน" — อ่านค่าจริงจากคำขอเท่านั้น
       HOURLY  → l.hours   เช่น "2 ชั่วโมง"
       อื่น ๆ  → l.total_days เช่น "1 วัน" · "0.5 วัน"
     ค่าที่เป็น null / undefined / ไม่ใช่ตัวเลข คืน "—" (ไม่แสดง undefined หรือช่องว่าง)
     ใช้ค่า 0 ตามจริงได้ ไม่ตัดทิ้ง */
  function lvQtyTxt(l, md) {
    var raw = (md === 'HOURLY') ? l.hours : l.total_days;
    if (raw === null || raw === undefined || raw === '') return '—';
    var n = Number(raw);
    if (!isFinite(n)) return '—';
    n = Math.round(n * 100) / 100;
    return n + (md === 'HOURLY' ? ' ชั่วโมง' : ' วัน');
  }

  /* ชื่อผู้ขอลา — ตรรกะเดียวกับที่การ์ดมือถือใช้อยู่เดิม
     แยกออกมาเป็นฟังก์ชันเดียวเพื่อให้ตารางกับการ์ดไม่มีทางแสดงต่างกัน */
  function lvWho(l) {
    if (l.emp_name) return l.emp_name;
    var e = currentEmp();
    return e ? (e.firstName + ' ' + e.lastName) : '—';
  }

  function lvDeskTable(rows, mineView) {
    return '<div class="card p0 only-desktop lvt-wrap"><table class="lvt lvt-lv">' +
      '<thead><tr>' +
      '<th>เลขคำขอ</th><th>ชื่อพนักงาน</th><th>ประเภท</th><th>วันที่</th><th>รูปแบบการลา</th>' +
      '<th>จำนวนวัน</th><th>ไฟล์แนบ</th><th>สถานะ</th><th class="lvt-act-h"></th>' +
      '</tr></thead><tbody>' +
      rows.map(function (l) { return lvDeskRow(l, mineView); }).join('') +
      '</tbody></table></div>';
  }

  function lvDeskRow(l, mineView) {
    var lt = lvType(l.leave_type), md = lvMode(l), st = l.ui_status || l.status;
    var files = l.file_name ? 1 : 0;   // จำนวนวัน/ชั่วโมง ย้ายไปคำนวณใน lvQtyTxt() แล้ว
    return '<tr>' +
      '<td class="lvt-c-no"><b>' + esc(lvCode(l)) + '</b></td>' +
      /* ชื่อพนักงาน — ใช้ emp_name ที่ njhr_leave_list ส่งมาอยู่แล้ว
         (prefix + first_name + last_name ประกอบใน RPC · R3_request_no_expose.sql)
         การ์ดมือถือใช้ค่าเดียวกันนี้มาตั้งแต่แรก จึงไม่ต้องแก้ SQL/RPC
         ถ้าไม่มีค่า (คำขอของตนเองที่ RPC ไม่ส่งชื่อมา) ถอยไปใช้ชื่อผู้ใช้ปัจจุบัน
         ด้วยตรรกะเดียวกับ leaveCard() เป๊ะ ๆ ไม่มีการเดาหรือสร้างข้อมูลใหม่ */
      '<td class="lvt-c-emp"><b>' + esc(lvWho(l)) + '</b></td>' +
      '<td class="lvt-c-type">' +
      '<span class="chip" style="background:' + lt.color + '18;color:' + lt.color + '">' + esc(lt.name) + '</span></td>' +
      '<td class="lvt-c-date"><b>' +
      fmtDateDMY(l.start_date) + (l.end_date !== l.start_date ? ' – ' + fmtDateDMY(l.end_date) : '') + '</b></td>' +
      /* รูปแบบการลา — บรรทัดเดียว ไม่มีบรรทัดรอง ไม่แสดงจำนวนซ้ำ
         ค่ามาจาก lvMode(l) ซึ่งอ่าน approvals[0].meta.mode ก่อน แล้วถอยไปใช้
         leave_unit === 'hour' → HOURLY · is_halfday → HALF_AM · นอกนั้น FULL */
      '<td class="lvt-c-mode"><b>' + lvModeTxt(md) + '</b></td>' +
      /* จำนวนวัน — คอลัมน์ใหม่ ค่าจริงจากคำขอ ไม่ hardcode
         ลารายชั่วโมงใช้ l.hours · นอกนั้นใช้ l.total_days · ไม่มีข้อมูล = — */
      '<td class="lvt-c-qty"><b>' + esc(lvQtyTxt(l, md)) + '</b></td>' +
      '<td class="lvt-c-file">' + (files
        ? '<span class="lvt-file">' + icon('paperclip', 'ic-sm') + '<span>' + files + ' ไฟล์</span></span>'
        : '<span class="muted">ไม่มีไฟล์แนบ</span>') + '</td>' +
      '<td class="lvt-c-st">' + statusBadge(st) + '</td>' +
      '<td class="lvt-c-act"><div class="lvt-acts">' +
      '<button type="button" class="btn-icon lv-eye" data-lvdetail="' + l.id + '" ' +
      'aria-label="ดูรายละเอียด" title="ดูรายละเอียด">' + icon('eye') + '</button>' +
      (mineView && l.status === 'PENDING'
        ? '<button class="btn btn-ghost btn-sm t-red" data-lvcancel="' + l.id + '">ยกเลิกคำขอ</button>' : '') +
      '</div></td></tr>';
  }

  function leaveCard(l, mineView) {
    var lt = lvType(l.leave_type), md = lvMode(l), st = l.ui_status || l.status;
    var days = lvNum(l.total_days), hrs = lvNum(l.hours);
    var who = lvWho(l);          // ตรรกะเดิมทุกบรรทัด ย้ายไปไว้ที่เดียว
    var sub = (l.department || (l.emp_code ? '' : dept((currentEmp() || {}).deptId)) || '—') + ' · ' + lvCode(l);

    return '<div class="card req-card only-mobile">' +
      '<div class="req-top">' + avatarHTML(who, 40) +
      '<div class="grow"><b>' + esc(who) + '</b><small>' + esc(sub) + '</small></div>' + statusBadge(st) + '</div>' +
      '<div class="req-body"><span class="chip" style="background:' + lt.color + '18;color:' + lt.color + '">' + esc(lt.name) + '</span>' +
      '<span>' + fmtDateDMY(l.start_date) + (l.end_date !== l.start_date ? ' – ' + fmtDateDMY(l.end_date) : '') + '</span>' +
      '<span>' + lvModeTxt(md) + (md === 'HOURLY'
        ? ' ' + String(l.start_time || '').slice(0, 5) + '–' + String(l.end_time || '').slice(0, 5) + ' (' + hrs + ' ชม.)'
        : ' · ' + days + ' วัน') + '</span></div>' +
      '<p class="req-reason">' + esc(l.reason) + (l.file_name ? ' · ' + icon('fileText', 'ic-sm') + ' ' + esc(l.file_name) : '') + '</p>' +
      '<div class="req-actions"><button class="btn btn-ghost btn-sm" data-lvdetail="' + l.id + '">รายละเอียด / Timeline</button>' +
      (mineView && l.status === 'PENDING' ? '<button class="btn btn-ghost btn-sm t-red" data-lvcancel="' + l.id + '">ยกเลิกคำขอ</button>' : '') + '</div></div>';
  }

  function lvCancel(id, el) {
    confirmDialog('ยกเลิกคำขอ', 'ต้องการยกเลิกคำขอ <b>' + esc(lvCode(id)) + '</b> ใช่หรือไม่', 'ยกเลิกคำขอ', function () {
      if (lvBusy) return; lvBusy = true;
      return sbRpc('njhr_leave_cancel', { p_token: sbToken(), p_leave_id: id }).then(function () {
        lvBusy = false; closeModal();
        toast('ยกเลิกคำขอแล้ว', 'info');
        refreshLeavePending();
        viewLeave(el);
      }).catch(function (er) {
        lvBusy = false; closeModal();
        toast(er.message || 'ยกเลิกคำขอไม่สำเร็จ', 'error');
        viewLeave(el);
      });
    }, true);
  }





