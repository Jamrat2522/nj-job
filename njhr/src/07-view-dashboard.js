  /* ================= VIEW: DASHBOARD ================= */
  /* จอที่กว้างเกิน 900px = Desktop — ตรงกับกฎ CSS @media (max-width: 900px)
     ที่สลับ .only-desktop / .only-mobile เป๊ะ ๆ จึงไม่มีทางที่ JS กับ CSS จะเห็นไม่ตรงกัน */
  function dashIsMobile() {
    try { return window.matchMedia('(max-width: 900px)').matches; }
    catch (e) { return (window.innerWidth || 0) <= 900; }
  }

  /* จำไว้ว่ารอบที่แล้ววาดฝั่งไหน ใช้ตัดสินว่าต้องวาดใหม่ไหมเมื่อผู้ใช้ย่อ/ขยายหน้าต่าง */
  var dashLastMobile = null;

  function viewDashboard(el) {
    var u = currentUser();
    var mob = dashIsMobile();
    dashLastMobile = mob;

    /* เดิมเรียกทั้งสองฝั่งเสมอ ฝั่งที่ถูกซ่อนด้วย CSS ก็ยังยิง RPC ครบ
       ตอนนี้วาดเฉพาะฝั่งที่ผู้ใช้เห็นจริง — หน้าตาและข้อมูลของแต่ละฝั่งไม่เปลี่ยน
       สิทธิ์ตาม Role ยังตัดสินด้วยเงื่อนไขเดิมทุกบรรทัด */
    if (mob) {
      /* หน้าหลักมือถือแสดงทุก Role ให้สอดคล้องกับ Header และ Bottom Navigation */
      dashMobileHome(el);
    } else {
      if (u.role === 'USER') dashEmployee(el); else dashAdmin(el);
    }

    dashBindResize(el);
    /* ภาพอ้างอิงหน้าหลักจบที่ "ประกาศล่าสุด" — ไม่เรียก dashMobileFeed อีก
       (เนื้อหาเดิมยังเข้าดูได้ที่ #/calendar และ #/announcements ไม่ได้ตัดฟีเจอร์ทิ้ง) */
  }

  /* ผู้ใช้ย่อ/ขยายหน้าต่างข้ามเส้น 900px → วาดฝั่งที่ถูกต้องให้ใหม่
     ถ้าไม่ทำ ผู้ใช้ที่ลากหน้าต่างจะเห็นหน้าว่าง เพราะอีกฝั่งไม่เคยถูกวาด
     ผูก Listener ครั้งเดียวต่อการเข้าใช้งานหนึ่งครั้ง ไม่สะสมซ้ำ */
  var dashResizeBound = false;
  function dashBindResize(el) {
    if (dashResizeBound) { dashResizeEl = el; return; }
    dashResizeBound = true;
    dashResizeEl = el;
    var t = null;
    window.addEventListener('resize', function () {
      if (t) clearTimeout(t);
      t = setTimeout(function () {
        /* วาดใหม่เฉพาะตอนที่ยังอยู่หน้า Dashboard และข้ามเส้นแบ่งจริงเท่านั้น */
        if (NJHR.state.currentRoute !== '#/dashboard') return;
        var now = dashIsMobile();
        if (now === dashLastMobile) return;
        if (dashResizeEl) viewDashboard(dashResizeEl);
      }, 200);
    });
  }
  var dashResizeEl = null;

  /* ---------- ปฏิทินบริษัท + ข่าวสาร บนหน้าหลักมือถือ ----------
     ข้อมูลจริงจาก Supabase เท่านั้น: njhr_event_list (ปฏิทิน) · njhr_ann_feed (ประกาศ)
     ไม่อ่าน db.* / localStorage · ผู้ใช้ Desktop ไม่เห็นบล็อกนี้ (.only-mobile) */
  var dashFeed = { seq: 0 };
  var DASH_EVT = {
    HOLIDAY: ['วันหยุด', '#FEE2E2', '#DC2626'], MEETING: ['ประชุม', '#DBEAFE', '#1D4ED8'],
    TRAINING: ['อบรม', '#FEF3C7', '#B45309'], ACTIVITY: ['กิจกรรม', '#DCFCE7', '#15803D'],
    PAYROLL_CLOSE: ['ปิดรอบเงินเดือน', '#EDE9FE', '#6D28D9'],
    DOC_DUE: ['กำหนดส่งเอกสาร', '#FFEDD5', '#C2410C'], OTHER: ['อื่น ๆ', '#F1F5F9', '#475569']
  };
  function dashEvtLabel(t) { return (DASH_EVT[t] || DASH_EVT.OTHER)[0]; }
  function dashEvtStyle(t) {
    var c = DASH_EVT[t] || DASH_EVT.OTHER;
    return 'background:' + c[1] + ';color:' + c[2];
  }

  function dashMobileFeed(el) {
    if (!sbReady()) return;
    var seq = ++dashFeed.seq;
    var wrap = document.createElement('div');
    wrap.className = 'only-mobile mb-feed';
    wrap.innerHTML =
      '<div class="mb-sec" id="mb-cal"><div class="mb-sec-h"><b>ปฏิทินบริษัท</b>' +
      '<button type="button" class="mb-more" data-go="#/calendar">ดูทั้งหมด</button></div>' +
      '<div class="mb-skel"></div></div>' +
      '<div class="mb-sec" id="mb-news"><div class="mb-sec-h"><b>ข่าวสารและประกาศ</b>' +
      '<span class="mb-unread" id="mb-unread" hidden></span></div>' +
      '<div class="mb-skel"></div></div>';
    el.appendChild(wrap);
    wrap.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-go]') : null;
      if (b) nav(b.dataset.go);
    };

    // ---- ปฏิทินบริษัท ----
    sbRpcList('njhr_event_list', { p_token: sbToken(), p_from: null, p_to: null, p_limit: 5 })
      .then(function (rows) {
        if (seq !== dashFeed.seq) return;
        var box = document.querySelector('#mb-cal .mb-skel');
        if (!box) return;
        var d = document.createElement('div');
        d.className = 'mb-list';
        d.innerHTML = (rows && rows.length) ? rows.slice(0, 5).map(function (r) {
          var iso = String(r.start_date || '').slice(0, 10);
          var dt = iso ? new Date(iso + 'T00:00:00') : null;
          var tm = r.all_day ? 'ทั้งวัน'
            : (String(r.start_time || '').slice(0, 5) +
               (r.end_time ? ' - ' + String(r.end_time).slice(0, 5) : ''));
          return '<div class="mb-evt"><div class="mb-date">' +
            '<b>' + (dt ? dt.getDate() : '—') + '</b>' +
            '<small>' + (dt ? TH_MONTHS[dt.getMonth()].slice(0, 3) : '') + '</small></div>' +
            '<div class="grow"><b>' + esc(r.title) + '</b>' +
            '<small>' + esc(tm) + (r.location ? ' · ' + esc(r.location) : '') + '</small></div>' +
            '<span class="mb-tag" style="' + dashEvtStyle(r.event_type) + '">' +
            esc(dashEvtLabel(r.event_type)) + '</span></div>';
        }).join('') : '<div class="mb-empty">ยังไม่มีกิจกรรมที่ใกล้ถึง</div>';
        box.replaceWith(d);
      }).catch(function (ex) {
        if (seq !== dashFeed.seq) return;
        var box = document.querySelector('#mb-cal .mb-skel');
        if (box) box.outerHTML = '<div class="mb-empty t-red">' +
          esc((ex && ex.message) || 'โหลดปฏิทินไม่สำเร็จ') + '</div>';
      });

    // ---- ข่าวสารและประกาศ ----
    dashLoadNews(seq);
  }

  function dashLoadNews(seq) {
    sbRpcList('njhr_ann_feed', { p_token: sbToken(), p_limit: 5, p_offset: 0, p_unread_only: false })
      .then(function (rows) {
        if (seq !== dashFeed.seq) return;
        var box = document.querySelector('#mb-news .mb-skel') || document.querySelector('#mb-news .mb-list');
        if (!box) return;
        var unread = rows && rows.length ? Number(rows[0].unread_count || 0) : 0;
        var u = document.getElementById('mb-unread');
        if (u) { u.textContent = unread + ' ยังไม่อ่าน'; u.hidden = !unread; }
        var d = document.createElement('div');
        d.className = 'mb-list';
        d.innerHTML = (rows && rows.length) ? rows.map(function (r) {
          var when = String(r.publish_at || '').slice(0, 10);
          return '<div class="mb-news' + (r.is_read ? '' : ' unread') + '" data-ann="' + esc(r.id) + '">' +
            '<div class="grow"><b>' + esc(r.title) +
            (r.is_read ? '' : ' <span class="mb-new">ใหม่</span>') +
            (r.is_important ? ' <span class="mb-imp">สำคัญ</span>' : '') + '</b>' +
            '<small>' + esc(when ? empBE(when) : '') + '</small>' +
            '<small class="mb-ex">' + esc(String(r.content || '').slice(0, 90)) + '</small>' +
            (r.file_name ? '<small class="mb-file">' + esc(r.file_name) + '</small>' : '') +
            '</div>' +
            (r.require_ack && !r.acked
              ? '<button type="button" class="mb-ack" data-ack="' + esc(r.id) + '">รับทราบแล้ว</button>'
              : (r.acked ? '<span class="mb-acked">รับทราบแล้ว</span>' : '')) +
            '</div>';
        }).join('') : '<div class="mb-empty">ยังไม่มีประกาศ</div>';
        box.replaceWith(d);

        d.onclick = function (ev) {
          var ack = ev.target.closest ? ev.target.closest('[data-ack]') : null;
          if (ack) {
            ack.disabled = true;
            sbRpc('njhr_ann_ack', { p_token: sbToken(), p_id: ack.dataset.ack, p_device: null })
              .then(function () { ack.outerHTML = '<span class="mb-acked">รับทราบแล้ว</span>'; })
              .catch(function () { ack.disabled = false; });
            return;
          }
          var row = ev.target.closest ? ev.target.closest('[data-ann]') : null;
          if (!row || row.classList.contains('reading')) return;
          row.classList.add('reading');
          // อัปเดตเฉพาะแถวนี้ + ลด Badge ทันที ไม่โหลดทั้งหน้าใหม่
          sbRpc('njhr_ann_read', { p_token: sbToken(), p_id: row.dataset.ann })
            .then(function (r) {
              row.classList.remove('unread', 'reading');
              var nb = row.querySelector('.mb-new');
              if (nb) nb.remove();
              var n = r ? Number(r.unread_count || 0) : 0;
              var u2 = document.getElementById('mb-unread');
              if (u2) { u2.textContent = n + ' ยังไม่อ่าน'; u2.hidden = !n; }
              dashBumpBell(-1);
            }).catch(function () { row.classList.remove('reading'); });
        };
      }).catch(function (ex) {
        if (seq !== dashFeed.seq) return;
        var box = document.querySelector('#mb-news .mb-skel');
        if (box) box.outerHTML = '<div class="mb-empty t-red">' +
          esc((ex && ex.message) || 'โหลดข่าวสารไม่สำเร็จ') + '</div>';
      });
  }

  // ลด Badge บนกระดิ่งทันทีโดยไม่ render ใหม่ทั้งหน้า
  function dashBumpBell(delta) {
    var b = document.querySelector('#btn-bell .bell-badge');
    if (!b) return;
    var n = parseInt(String(b.textContent).replace('+', ''), 10);
    if (!isFinite(n)) return;
    n = Math.max(0, n + delta);
    if (n <= 0) b.remove(); else b.textContent = n > 99 ? '99+' : String(n);
  }

  /* ============================================================
     Dashboard ผู้ดูแล (Desktop) — ยอดทุกตัวมาจาก Supabase
       RPC เดียว: njhr_dashboard_summary(p_token) → data jsonb
         data.company.employees_active / checked_in_today / late_today
                     / on_leave_today / ot_today / pending_total
         data.announcements  ประกาศที่กำลังเผยแพร่ (ชุดเดียวกับหน้า #/announcements)
         data.payroll        งวดเงินเดือนล่าสุด (period_month · period_year · status)
       สิทธิ์ตรวจฝั่งเซิร์ฟเวอร์ด้วย njhr_ctx — ผู้ที่ไม่ใช่ผู้ดูแลจะได้ company = {}

     เดิมทุกตัวอ่านจาก db.* ใน localStorage ซึ่งบน Production ว่างเปล่าเสมอ
     จึงแสดง 0 ทุกช่องแม้ฐานข้อมูลมีข้อมูลจริง

     ⚠ ห้าม fallback ไป db.* — RPC ล้มเหลว = แสดงข้อความผิดพลาด ไม่แสดง 0
     Layout · KPI · การ์ด · Route · คลาส CSS เดิมทุกบรรทัด เปลี่ยนเฉพาะแหล่งข้อมูล
     ============================================================ */
  var dashSum = { seq: 0 };
  var DASH_KPI = [
    ['dk-emp', '#/employees', 'พนักงานทั้งหมด', 'k-navy', 'users'],
    ['dk-in', '#/reports', 'เข้างานวันนี้', 'k-green', 'checkSquare'],
    ['dk-late', '#/reports', 'มาสายวันนี้', 'k-yellow', 'clock'],
    ['dk-leave', '#/calendar', 'ลางานวันนี้', 'k-blue', 'calendarOff'],
    ['dk-abs', '#/reports', 'ขาดงานวันนี้', 'k-red', 'ban'],
    ['dk-ot', '#/ot', 'OT วันนี้', 'k-purple', 'timer'],
    ['dk-pend', '#/approvals', 'รายการรออนุมัติ', 'k-slate', 'fileText']
  ];
  var DASH_PAY_ST = { DRAFT: ['แบบร่าง', 'warn'], CALCULATED: ['คำนวณแล้ว', 'info'],
    CONFIRMED: ['ยืนยันแล้ว', 'ok'], PAID: ['จ่ายแล้ว', 'ok'] };

  function dashSetNum(id, v) {
    var b = document.getElementById(id);
    if (b) b.textContent = (v == null ? '—' : String(v));
  }
  function dashSumErr(msg, ex) {
    try { console.error('[DASHBOARD] njhr_dashboard_summary ล้มเหลว:', ex || msg); } catch (e) {}
    DASH_KPI.forEach(function (k) { dashSetNum(k[0], null); });
    dashSetNum('dk-pay', '—');
    var c = document.getElementById('dash-chart');
    if (c) c.innerHTML = '<div class="form-error" role="alert">' + esc(msg) + '</div>';
    var a = document.getElementById('dash-ann-body');
    if (a) a.innerHTML = '<div class="form-error" role="alert">' + esc(msg) + '</div>';
  }

  function dashChartHTML(rows) {
    var maxV = Math.max.apply(null, rows.map(function (c) { return c[1]; }).concat([1]));
    return rows.map(function (c) {
      return '<div class="bar-row"><span class="bar-label">' + c[0] + '</span><div class="bar-track"><div class="bar-fill" style="width:' +
        Math.round(c[1] / maxV * 100) + '%;background:' + c[2] + '"></div></div><b>' + c[1] + '</b></div>';
    }).join('');
  }

  function dashSummaryLoad() {
    var seq = ++dashSum.seq;
    setTimeout(function () {
      if (seq !== dashSum.seq || !document.getElementById('dk-emp')) return;
      if (!sbReady() || !sbToken()) { dashSumErr('ยังไม่ได้เชื่อมต่อ Supabase — โหลดยอดสรุปไม่ได้'); return; }
      sbRpc('njhr_dashboard_summary', { p_token: sbToken() }).then(function (r) {
        if (seq !== dashSum.seq) return;
        var d = (r && r.data) ? r.data : r;
        if (!d) { dashSumErr('ไม่ได้รับข้อมูลสรุปจากเซิร์ฟเวอร์'); return; }
        var co = d.company || {};
        var emp = Number(co.employees_active) || 0;
        var cin = Number(co.checked_in_today) || 0;
        var late = Number(co.late_today) || 0;
        var lv = Number(co.on_leave_today) || 0;
        /* ขาดงาน = พนักงานปฏิบัติงาน − ลงเวลาแล้ว − ลาวันนี้ (สูตรเดิมทุกตัว) */
        var abs = Math.max(0, emp - cin - lv);
        dashSetNum('dk-emp', emp);
        dashSetNum('dk-in', cin);
        dashSetNum('dk-late', late);
        dashSetNum('dk-leave', lv);
        dashSetNum('dk-abs', abs);
        dashSetNum('dk-ot', Number(co.ot_today) || 0);
        var pend = Number(co.pending_total) || 0;
        dashSetNum('dk-pend', pend);
        var pk = document.getElementById('dk-pend');
        if (pk) {
          var card = pk.closest ? pk.closest('.rp-kpi') : null;
          if (card) { card.classList.remove('k-red', 'k-slate'); card.classList.add(pend ? 'k-red' : 'k-slate'); }
        }

        /* งวดเงินเดือน — อ่านอย่างเดียวจาก data.payroll ไม่แตะ Workflow เงินเดือน */
        var pay = d.payroll || {};
        var pm = Number(pay.period_month) || (new Date().getMonth() + 1);
        var pst = String(pay.status || 'DRAFT');
        var pl = document.getElementById('dk-pay-label');
        if (pl) pl.textContent = 'เงินเดือน ' + TH_MONTHS[pm - 1].slice(0, 3) + '.';
        dashSetNum('dk-pay', DASH_PAY_ST[pst] ? DASH_PAY_ST[pst][0] : pst);

        var c = document.getElementById('dash-chart');
        if (c) {
          c.innerHTML = dashChartHTML([
            ['เข้างาน', Math.max(0, cin - late), 'var(--green)'],
            ['มาสาย', late, 'var(--yellow)'],
            ['ลางาน', lv, 'var(--blue)'],
            ['ขาดงาน', abs, 'var(--red-strong)']
          ]);
        }

        /* ประกาศบริษัทล่าสุด — ชุดเดียวกับหน้า #/announcements (company_announcements) */
        var ab = document.getElementById('dash-ann-body');
        if (ab) {
          var anns = (d.announcements || []).slice(0, 3);
          ab.innerHTML = anns.length
            ? '<div class="list">' + anns.map(function (a) {
                /* ไอคอนเลือกจากข้อมูลจริงที่มีอยู่: ประกาศสำคัญ (HIGH/URGENT) = pin · ที่เหลือ = megaphone */
                var hi = ['HIGH', 'URGENT'].indexOf(String(a.priority || '').toUpperCase()) >= 0;
                return '<div class="list-row"><span class="ann-ic' + (hi ? ' pin' : '') + '">' +
                  icon(hi ? 'pin' : 'megaphone') + '</span>' +
                  '<div class="grow"><b>' + esc(a.title) + '</b><small>' +
                  fmtDate(String(a.publish_at || '').slice(0, 10)) + '</small></div></div>';
              }).join('') + '</div>'
            : emptyState('ยังไม่มีประกาศ');
        }
      })['catch'](function (ex) {
        if (seq !== dashSum.seq) return;
        dashSumErr('โหลดยอดสรุปไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
      });
    }, 0);
  }

  function dashAdmin(el) {
    /* ไอคอนใช้ชุด SVG ของระบบ (icon()) ไม่เพิ่ม Library ใหม่
       ค่าเริ่มต้นเป็น "…" ระหว่างรอ Supabase — ไม่มีการ hardcode ตัวเลขใด ๆ */
    /* การ์ด KPI ใช้โครงเดียวกับหน้า "รายงานทั้งหมด" (.rp-kpi)
       เพื่อให้ขนาด · มุมโค้ง · เงา · ระยะห่าง · ขนาดตัวอักษร เป็นชุดเดียวกันทั้งระบบ
       ยังเป็น <a href> คลิกได้เหมือนเดิม · Route · id · ข้อความ ไม่เปลี่ยน */
    function kpi(route, label, id, cls, ic) {
      return '<a href="' + route + '" class="rp-kpi ' + (cls || '') + '">' +
        (ic ? '<span class="rp-kpi-ic">' + icon(ic) + '</span>' : '') +
        '<span class="grow"><small' + (id === 'dk-pay' ? ' id="dk-pay-label"' : '') + '>' + label + '</small>' +
        '<b id="' + id + '">…</b></span></a>';
    }

    el.innerHTML =
      '<div class="only-desktop dash-legacy">' +
      '<div class="rp-kpis dash-kpis">' +
      DASH_KPI.map(function (k) { return kpi(k[1], k[2], k[0], k[3], k[4]); }).join('') +
      kpi('#/payroll', 'เงินเดือน', 'dk-pay', 'k-pink', 'wallet') +
      '</div>' +
      '<div class="dash-cols">' +
      '<div class="col">' +
      '  <div class="card"><div class="card-head"><h3>คำขอลาล่าสุด</h3><a class="link" href="#/approvals">ดูทั้งหมด</a></div>' +
      dashLeaveBody() + '</div>' +
      '  <div class="card"><div class="card-head"><h3>สรุปการลงเวลาวันนี้</h3></div>' +
      '<div class="bar-chart" id="dash-chart"><small class="muted">กำลังโหลด…</small></div></div>' +
      '</div>' +
      '<div class="col">' +
      '  <div class="card dash-ann"><div class="card-head"><h3>ประกาศบริษัทล่าสุด</h3><a class="link" href="#/announcements">ดูทั้งหมด</a></div>' +
      '<div id="dash-ann-body"><small class="muted">กำลังโหลด…</small></div></div>' +
      '  <div class="card"><div class="card-head"><h3>ปฏิทินองค์กร</h3><a class="link" href="#/calendar">ดูทั้งหมด</a></div>' + miniCalendar() + '</div>' +
      '</div></div>' +
      /* การแจ้งเตือนล่าสุด — เต็มความกว้างด้านล่าง ข้อมูลและ Event เดิมทั้งหมด */
      '<div class="dash-notify-full">' + dashNotifyCard() + '</div>' +
      '</div>';

    dashSummaryLoad();
  }

  function miniCalendar() {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var t = todayISO();
    var html = '<div class="mini-cal"><div class="mini-cal-head">' + TH_DAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="mini-cal-grid">';
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var isoStr = y + '-' + pad(m + 1) + '-' + pad(d);
      var hol = isHoliday(isoStr);
      html += '<span class="' + (isoStr === t ? 'today' : '') + (hol ? ' holiday' : '') + '" title="' + (hol ? esc(holName(isoStr)) : '') + '">' + d + '</span>';
    }
    return html + '</div></div>';
  }

  /* ============================================================
     หน้าหลักมือถือ (ทุก Role) — ตามภาพอ้างอิงที่อนุมัติแล้ว
     ข้อมูลจริงจาก Supabase ทั้งหมด ไม่อ่าน db.* :
       njhr_att_today            สถานะวันนี้ + ชื่อกะ + เวลากะ
       njhr_att_report           มาทำงาน / มาสาย (เดือนปัจจุบัน)
       njhr_leave_report         ลางาน (วัน) + รายการรออนุมัติ
       njhr_ot_list              OT (ชม.) + รายการรออนุมัติ
       njhr_att_correction_list  ลงชื่อย้อนหลังรออนุมัติ
       njhr_ann_feed             ประกาศล่าสุด
     บล็อกนี้เป็น .only-mobile — หน้า Desktop เดิมไม่เปลี่ยนแม้แต่บรรทัดเดียว
     สิทธิ์การใช้งานยังแยกตาม Role ที่ Route Guard เหมือนเดิม ไม่ได้แตะ
     ============================================================ */
  var dashHome = { seq: 0 };

  function dashHomeMonth() {
    var d = new Date();
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok',
        year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).split('-');
      var y = Number(p[0]), m = Number(p[1]);
      var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return { s: p[0] + '-' + p[1] + '-01',
               e: p[0] + '-' + p[1] + '-' + String(last).padStart(2, '0'),
               label: TH_MONTHS[m - 1] + ' ' + (y + 543) };
    } catch (e) {
      var t = todayISO();
      return { s: t.slice(0, 8) + '01', e: t, label: '' };
    }
  }
  function dashHomeGreet() {
    var h = new Date().getHours();
    if (h < 12) return 'สวัสดีตอนเช้า \u{1F44B}';
    if (h < 17) return 'สวัสดีตอนบ่าย \u{1F44B}';
    return 'สวัสดีตอนเย็น \u{1F44B}';
  }
  function dashHomeDMY(v) {
    var d = String(v || '').slice(0, 10).split('-');
    if (d.length !== 3) return '—';
    return Number(d[2]) + ' ' + TH_MONTHS[Number(d[1]) - 1].slice(0, 3) + '. ' + (Number(d[0]) + 543);
  }
  function dashHomeHM(ts) {
    var m = /T(\d{2}):(\d{2})/.exec(String(ts || ''));
    return m ? m[1] + ':' + m[2] : '';
  }

  /* แผนกของผู้ใช้ที่ล็อกอินอยู่ — อ่านจากข้อมูลจริงเท่านั้น ไล่ตามลำดับแหล่งที่มีจริง
     1) departments ที่โหลดมาแล้ว (dept() ของ store)   2) employees.department_name ที่ RPC ส่งมา
     3) app_users.department ของบัญชี                  4) njhr_me_get (เติมทีหลังแบบ async)
     ไม่มีค่าใดเลย = คืนค่าว่าง แล้วผู้เรียกจะไม่วาดบรรทัดแผนก (ไม่แสดง "แผนก: —") */
  function dashHomeDept(e, u) {
    var v = e && e.deptId ? dept(e.deptId) : '';
    if (v && v !== '—') return v;
    v = (e && e.deptName) || '';
    if (v) return v;
    v = (u && u.sb && u.sb.emp_department) || '';
    if (v) return v;
    v = (u && u.department) || '';
    return v || '';
  }
  /* รูปพนักงานจริง — ใช้ได้เฉพาะค่าที่เป็น URL เต็มหรือ data URI เท่านั้น
     ค่าอื่น (เช่น path ในถังเก็บไฟล์ที่ต้องขอ Signed URL) ยังไม่รองรับ จึงคืนค่าว่าง
     แล้วผู้เรียกจะใช้ Avatar ตัวอักษรของระบบแทน — ไม่เดา ไม่สร้าง URL ขึ้นเอง */
  function dashHomePhoto(v) {
    var s = String(v == null ? '' : v).trim();
    return /^(https:\/\/|data:image\/)/i.test(s) ? s : '';
  }
  function dashHomeAvatar(name, url) {
    var p = dashHomePhoto(url);
    if (!p) return avatarHTML(name, 66);
    /* Avatar ตัวอักษรของระบบวางไว้ข้างหลังเสมอ — รูปโหลดไม่สำเร็จก็เห็นตัวอักษรทันที */
    return '<span class="mh-ph">' + avatarHTML(name, 66) +
      '<img src="' + esc(p) + '" alt="" width="66" height="66" onerror="this.remove()"></span>';
  }
  /* วางรูปลงการ์ด — ไม่เขียน photo_url หรือ Signed URL ลง Console หรือ DOM attribute อื่นใด */
  function dashHomeSetPhoto(seq, name, url) {
    if (seq !== dashHome.seq) return;
    var av = document.getElementById('mh-av');
    if (av) av.innerHTML = dashHomeAvatar(name, url);
  }
  /* รูปที่เก็บใน Storage ส่วนตัว (bucket njhr-emp-files) เข้าถึงตรงไม่ได้
     ต้องขอ Signed URL ผ่าน Edge Function njhr-emp-file ด้วย file_id ของแฟ้มจริง
     แฟ้มรูปพนักงาน = category 'PERSONAL' · doc_kind 'PHOTO' (njhr_empfile_kind_ok)
     ล้มเหลวทุกกรณี = เงียบ แล้วใช้ Avatar ตัวอักษรต่อ — ไม่มีการพิมพ์ URL ออกที่ใด */
  function dashHomePhotoSigned(seq, name, empId) {
    if (!empId || !sbReady()) return;
    sbRpc('njhr_empfile_list', { p_token: sbToken(), p_employee: empId }).then(function (r) {
      if (seq !== dashHome.seq) return;
      var d = (r && r.data) || r || {};
      var files = d.files || [];
      var hit = null, i;
      for (i = 0; i < files.length; i++) {
        if (String(files[i].category) === 'PERSONAL' && String(files[i].doc_kind) === 'PHOTO') { hit = files[i]; break; }
      }
      if (!hit || !hit.id) return;
      return fetch(String(window.NJHR_SUPABASE_URL || '') + '/functions/v1/njhr-emp-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'apikey': String(window.NJHR_SUPABASE_ANON_KEY || ''),
                   'Authorization': 'Bearer ' + String(window.NJHR_SUPABASE_ANON_KEY || '') },
        body: JSON.stringify({ action: 'download-url', token: sbToken(), file_id: hit.id })
      }).then(function (res) { return res.ok ? res.json() : null; }).then(function (j) {
        if (!j || !j.url) return;
        dashHomeSetPhoto(seq, name, j.url);
      });
    }).catch(function () { });
  }

  function dashMobileHome(el) {
    var u = currentUser();
    if (!u) return;
    var seq = ++dashHome.seq;
    var wrap = document.createElement('div');
    wrap.className = 'only-mobile mh';
    wrap.id = 'mh-root';
    el.insertBefore(wrap, el.firstChild);

    var e = currentEmp() || {};
    var name = ((e.title || '') + (e.firstName || '') + ' ' + (e.lastName || '')).trim() || u.username;
    var m = dashHomeMonth();
    var dp = dashHomeDept(e, u);

    /* โครงหน้าออกก่อน (ชื่อ/รหัส/แผนกมีอยู่แล้ว) ตัวเลขเติมทีหลังแบบไม่บล็อกจอ */
    wrap.innerHTML =
      '<a class="mh-emp" href="#/profile" id="mh-emp">' +
      '<span class="mh-av" id="mh-av">' + dashHomeAvatar(name, '') + '</span>' +
      '<span class="grow"><b>' + esc(name) + '</b>' +
      '<small>รหัสพนักงาน: <i id="mh-code">' + esc(e.code || '') + '</i></small>' +
      '<small class="mh-dept"' + (dp ? '' : ' hidden') + '>แผนก: <i id="mh-dept">' +
      esc(dp) + '</i></small></span>' +
      '<span class="mh-emp-x">' + icon('chevR') + '</span>' +
      '<span class="mh-emp-st" id="mh-emp-st">' + icon('clock', 'ic-sm') +
      '<em>กำลังตรวจสอบ…</em></span></a>' +

      '<h3 class="mh-t">รายงานของฉัน<small>สรุปเดือน ' + esc(m.label) + '</small></h3>' +
      '<div class="mh-stats" id="mh-stats">' +
      ['work', 'late', 'leave', 'ot'].map(function (k) {
        return '<div class="mh-st s-' + k + '"><span class="mh-st-ic"></span>' +
          '<small></small><b>—</b></div>';
      }).join('') + '</div>' +

      '<h3 class="mh-t">สถานะวันนี้</h3>' +
      '<section class="mh-today" id="mh-today">' +
      '<span class="mh-today-ic">' + icon('clock') + '</span>' +
      '<div class="mh-today-r"><em id="mh-st">กำลังตรวจสอบ…</em>' +
      '<small><span class="mh-date">' + esc(fmtDate(todayISO())) + '</span>' +
      ' · <b class="mh-clock" id="mh-clock">--:--</b></small></div></section>' +

      '<h3 class="mh-t">รายการรออนุมัติ' +
      '<a class="mh-more" href="#/requests">' +
      '<span class="mh-more-label">ดูทั้งหมด</span></a></h3>' +
      '<section class="mh-card" id="mh-pend-box">' +
      '<div id="mh-pend"><div class="mh-skel2"></div></div></section>' +

      '<a class="mh-ann" id="mh-ann" href="#/announcements">' +
      '<span class="mh-ann-ic">' + icon('megaphone') + '</span>' +
      '<span class="grow"><b>ประกาศจากองค์กร</b><small>กำลังโหลด…</small>' +
      '<span class="mh-ann-go">อ่านเพิ่มเติม ' + icon('chevR', 'ic-sm') + '</span></span></a>';


    startLiveClock();
    dashHomeClock();

    if (!sbToken() || !sbReady()) return;
    var tk = sbToken();

    /* ---------- รูปพนักงาน + แผนกจริง (Self Service ของตัวเองเท่านั้น) ----------
       njhr_me_get คืนเฉพาะข้อมูลพนักงานของ token นั้น ทุก Role เรียกได้
       เติมเฉพาะ 3 ช่องบนการ์ด (รูป · แผนก · รหัสพนักงาน) ไม่แตะส่วนอื่นของหน้า
       ล้มเหลว = เงียบ ใช้ค่าที่มีอยู่เดิมต่อ ไม่ขึ้น Error ให้ผู้ใช้ */
    sbRpc('njhr_me_get', { p_token: tk }).then(function (r) {
      if (seq !== dashHome.seq) return;
      var d = r && r.data ? r.data : r;
      var emp2 = d && d.employee ? d.employee : null;
      if (!emp2) return;
      /* 1) photo_url เป็น URL เต็ม (https:// หรือ data:image/) → ใช้ตรง ๆ
         2) มีค่าแต่ไม่ใช่ URL เต็ม = เป็น path ใน Storage → ขอ Signed URL ผ่าน Edge Function
         3) ไม่มีค่าเลย → ใช้ Avatar ตัวอักษรทันที ไม่ต้องยิง njhr_empfile_list
            (เดิมยิงทุกครั้งแม้ photo_url ว่าง = เสีย 1 Round-trip ฟรีให้ผู้ใช้ทุกคน)
         4) ขอไม่สำเร็จ / รูปเสีย → Avatar ตัวอักษร (หน้าไม่พัง) */
      var pv = String(emp2.photo_url == null ? '' : emp2.photo_url).trim();
      if (dashHomePhoto(pv)) dashHomeSetPhoto(seq, name, pv);
      else if (pv) dashHomePhotoSigned(seq, name, emp2.id || e.id || u.empId);
      var cd = document.getElementById('mh-code');
      if (cd && emp2.emp_code) cd.textContent = emp2.emp_code;
      var dv = document.getElementById('mh-dept');
      var dn = String(emp2.department_name || '').trim();
      if (dv && dn) { dv.textContent = dn; dv.parentNode.hidden = false; }
    }).catch(function () { });

    /* ---------- สถานะวันนี้ ---------- */
    sbRpcList('njhr_att_today', { p_token: tk }).then(function (r) {
      if (seq !== dashHome.seq) return;
      var a = (r || [])[0] || null;
      var st = document.getElementById('mh-st');
      var box = document.getElementById('mh-today');
      var strip = document.getElementById('mh-emp-st');
      if (!st || !box) return;
      var txt, cls = '';
      if (a && a.check_in && a.check_out) {
        txt = 'เข้างาน ' + dashHomeHM(a.check_in) + ' · ออกงาน ' + dashHomeHM(a.check_out);
        cls = 'done';
      } else if (a && a.check_in) {
        txt = 'เข้างานแล้ว ' + dashHomeHM(a.check_in);
        cls = 'in';
      } else {
        txt = 'ยังไม่ได้ลงเวลา';
      }
      st.textContent = txt;
      if (cls) box.classList.add(cls);
      if (strip) {
        var em = strip.querySelector('em');
        if (em) em.textContent = (cls ? '' : 'วันนี้') + txt;
        if (cls) strip.classList.add(cls);
      }
    }).catch(function () {
      var st = document.getElementById('mh-st');
      if (st) st.textContent = 'โหลดสถานะไม่สำเร็จ';
      var strip = document.getElementById('mh-emp-st');
      if (strip) { var em2 = strip.querySelector('em'); if (em2) em2.textContent = 'โหลดสถานะไม่สำเร็จ'; }
    });

    /* ---------- รายงานเดือนนี้ + รายการรออนุมัติ ---------- */
    Promise.all([
      sbRpcList('njhr_att_report', { p_token: tk, p_from: m.s, p_to: m.e, p_type: 'ATTEND',
        p_employee: e.id || null, p_limit: 500, p_offset: 0 }).catch(function () { return null; }),
      sbRpcList('njhr_leave_report', { p_token: tk, p_from: m.s, p_to: m.e,
        p_status: null }).catch(function () { return null; }),
      sbRpcList('njhr_ot_list', { p_token: tk, p_from: m.s, p_to: m.e,
        p_status: null, p_mine: true, p_limit: 200, p_offset: 0 }).catch(function () { return null; }),
      sbRpcList('njhr_att_correction_list', { p_token: tk, p_employee: e.id || null,
        p_status: 'PENDING', p_limit: 50, p_offset: 0 }).catch(function () { return null; })
    ]).then(function (r) {
      if (seq !== dashHome.seq) return;
      var att = r[0], lv = r[1], ot = r[2], cor = r[3];
      var mine = function (x) { return !e.id || x.employee_id === e.id || x.emp_code === e.code; };

      var work = att ? att.filter(function (x) {
        return mine(x) && x.check_in; }).length : null;
      var late = att ? att.filter(function (x) {
        return mine(x) && Number(x.late_min) > 0; }).length : null;

      var lvMine = lv ? lv.filter(mine) : [];
      var leaveDays = lv ? Math.round(lvMine.filter(function (x) {
        return ['APPROVED', 'COMPLETED'].indexOf(String(x.status || '').toUpperCase()) >= 0;
      }).reduce(function (n, x) { return n + (Number(x.total_days) || 0); }, 0) * 100) / 100 : null;

      var otMine = ot ? ot.filter(mine) : [];
      var otH = ot ? Math.round(otMine.filter(function (x) {
        return ['APPROVED', 'COMPLETED'].indexOf(String(x.status || '').toUpperCase()) >= 0;
      /* njhr_ot_list คืนคอลัมน์ ot_hours (ตาราง ot_requests) ไม่ใช่ hours
         เดิมอ่าน x.hours จึงได้ 0 เสมอ */
      }).reduce(function (n, x) { return n + (Number(x.ot_hours) || 0); }, 0) * 100) / 100 : null;

      /* ไอคอนใช้ชุด SVG ของระบบ (icon()) ไม่ใช้ Emoji */
      var cards = [
        ['work', 'calendar', 'มาทำงาน', work, 'วัน'],
        ['late', 'clock', 'มาสาย', late, 'ครั้ง'],
        ['leave', 'calendarOff', 'ลางาน', leaveDays, 'วัน'],
        ['ot', 'timer', 'OT', otH, 'ชม.']
      ];
      var sb = document.getElementById('mh-stats');
      if (sb) sb.innerHTML = cards.map(function (c) {
        return '<div class="mh-st s-' + c[0] + '"><span class="mh-st-ic">' + icon(c[1], 'ic-sm') + '</span>' +
          '<small>' + esc(c[2]) + '</small>' +
          '<b>' + (c[3] == null ? '<span class="mh-st-err">โหลดไม่สำเร็จ</span>'
                                : esc(String(c[3])) + ' <i>' + c[4] + '</i>') + '</b></div>';
      }).join('');

      /* รายการรออนุมัติ — เฉพาะสถานะ PENDING เท่านั้น สูงสุด 3 รายการ */
      var P = function (x) { return String(x || '').toUpperCase() === 'PENDING'; };
      var pend = [];
      lvMine.filter(function (x) { return P(x.status); }).forEach(function (x) {
        pend.push([x.start_date, 'calendarOff', 'lv', esc(x.leave_type || 'ลางาน'),
          dashHomeDMY(x.start_date), (Number(x.total_days) || 0) + ' วัน', '#/leave']);
      });
      otMine.filter(function (x) { return P(x.status); }).forEach(function (x) {
        pend.push([x.ot_date || x.work_date, 'timer', 'ot', 'OT',
          dashHomeDMY(x.ot_date || x.work_date), (Number(x.ot_hours) || 0) + ' ชั่วโมง', '#/ot']);
      });
      (cor || []).filter(function (x) { return P(x.status); }).forEach(function (x) {
        pend.push([x.work_date, 'history', 'cr', 'ลงชื่อย้อนหลัง',
          dashHomeDMY(x.work_date), 'เวลาเข้า ' + (dashHomeHM(x.new_check_in) || '—'), '#/req-history']);
      });
      pend.sort(function (a, b) { return String(b[0]).localeCompare(String(a[0])); });

      var pb = document.getElementById('mh-pend');
      if (pb) {
        pb.innerHTML = pend.length
          ? pend.slice(0, 3).map(function (x) {
              return '<a class="mh-pd" href="' + x[6] + '">' +
                '<span class="mh-pd-ic i-' + x[2] + '">' + icon(x[1], 'ic-sm') + '</span>' +
                '<span class="grow"><b>' + x[3] + ' · ' + esc(x[4]) + '</b>' +
                '<small>' + esc(x[5]) + '</small></span>' +
                '<span class="mh-pd-tag">รออนุมัติ</span>' +
                '<span class="mh-pd-x">' + icon('chevR') + '</span></a>';
            }).join('')
          : '<div class="mh-none">ไม่มีรายการรออนุมัติ</div>';
      }
    });

    /* ---------- ประกาศล่าสุด ---------- */
    sbRpcList('njhr_ann_feed', { p_token: tk, p_limit: 1, p_offset: 0, p_unread_only: false })
      .then(function (rows) {
        if (seq !== dashHome.seq) return;
        var a = (rows || [])[0], box = document.getElementById('mh-ann');
        if (!box) return;
        var sm = box.querySelector('small');
        if (!a) { sm.textContent = 'ยังไม่มีประกาศ'; return; }
        sm.textContent = a.title || '—';
        box.setAttribute('href', '#/announcements');
      }).catch(function () {
        var box = document.getElementById('mh-ann');
        if (box) box.querySelector('small').textContent = 'โหลดประกาศไม่สำเร็จ';
      });
  }

  /* นาฬิกา HH:MM ของหน้าหลักมือถือ — ใช้ตัวจับเวลาเดียวกับ startLiveClock ไม่สร้างซ้ำ */
  function dashHomeClock() {
    function tick() {
      var c = document.getElementById('mh-clock');
      if (!c) return;
      var d = new Date();
      c.textContent = String(d.getHours()).padStart(2, '0') + ':' +
                      String(d.getMinutes()).padStart(2, '0');
    }
    tick();
    clearInterval(dashHome.t);
    dashHome.t = setInterval(function () {
      if (!document.getElementById('mh-clock')) { clearInterval(dashHome.t); return; }
      tick();
    }, 10000);
  }

  /* ============================================================
     Dashboard พนักงาน (Desktop · USER) — ข้อมูลจริงจาก Supabase
       ลงเวลาวันนี้    njhr_att_today      (แทน shAttToday ที่อ่าน db.attendance)
       วันลาคงเหลือ    njhr_leave_balances (แทน db.leaveTypes + remainDays)
       คำขอลาล่าสุด    njhr_leave_list     (ของตนเองทุก Role)
       OT ล่าสุด       njhr_ot_list        (p_mine = true)
       ประกาศ          njhr_ann_feed       ← Feed ของ USER เท่านั้น รักษา Target/สถานะอ่าน
                                             ไม่ใช้ njhr_announcement_list ของผู้ดูแล
       สลิปเงินเดือน   ยังใช้ db.payroll ตามเดิม — INTENTIONAL LOCAL, PAYROLL ROUND

     Layout · การ์ด · ปุ่ม · Route · คลาส CSS เดิมทุกบรรทัด เปลี่ยนเฉพาะแหล่งข้อมูล
     ⚠ ห้าม fallback ไป db.* — RPC ล้มเหลว = แสดงข้อความผิดพลาด ไม่แสดงว่าไม่มีข้อมูล
     ============================================================ */
  var dashEmp = { seq: 0 };

  var DASH_LT = {
    SICK: ['ลาป่วย', '#DC2626'], PERSONAL: ['ลากิจ', '#2563EB'], VACATION: ['ลาพักร้อน', '#059669'],
    MATERNITY: ['ลาคลอด', '#DB2777'], ORDINATION: ['ลาบวช', '#D97706'],
    HALFDAY: ['ลาครึ่งวัน', '#7C3AED'], OTHER: ['ลาอื่น ๆ', '#64748B']
  };
  function dashLtName(c) { return (DASH_LT[String(c || '').toUpperCase()] || [c, '#64748B'])[0]; }
  function dashLtColor(c) { return (DASH_LT[String(c || '').toUpperCase()] || [c, '#64748B'])[1]; }
  function dashHM2(v) {
    var m = /T(\d{2}):(\d{2})/.exec(String(v || ''));
    return m ? m[1] + ':' + m[2] : '';
  }
  function dashErrBox(id, msg, ex) {
    try { console.error('[DASHBOARD USER] ' + id + ': ', ex || msg); } catch (e) {}
    var b = document.getElementById(id);
    if (b) b.innerHTML = '<div class="form-error" role="alert">' + esc(msg) + '</div>';
  }

  function dashEmployee(el) {
    var e = currentEmp();
    var t = todayISO();
    var seq = ++dashEmp.seq;
    /* สลิปเงินเดือน — คงพฤติกรรมเดิมทั้งหมด (ห้ามแตะ Payroll รอบนี้) */
    var paid = db.payroll.filter(function (p) { return p.status === 'PAID' || p.status === 'CONFIRMED'; }).slice(-1)[0];
    var slip = paid ? paid.entries.find(function (x) { return x.empId === e.id; }) : null;

    /* หน้าเดิมของ Desktop คงไว้ทุกบรรทัด — ห่อด้วย .only-desktop เพื่อไม่ให้ซ้อนกับ
       หน้าหลักมือถือแบบใหม่ (dashMobileHome) ที่แสดงเฉพาะจอมือถือ */
    el.innerHTML =
      '<div class="only-desktop dash-legacy">' +
      '<div class="card clock-card">' +
      '  <div class="clock-now" id="live-clock">--:--:--</div>' +
      '  <div class="clock-date">' + fmtDate(t) + ' · กะ <span id="de-shift">' + esc(e.shift || '') + '</span></div>' +
      '  <div class="clock-status" id="de-status"><span class="chip">กำลังโหลด…</span></div>' +
      '  <div class="clock-btns">' +
      '    <button class="btn btn-primary btn-lg" id="dash-in">' + icon('login') + ' เข้างาน</button>' +
      '    <button class="btn btn-dark btn-lg" id="dash-out" disabled>' + icon('logout') + ' ออกงาน</button>' +
      '  </div><small class="muted">ลงเวลาแบบละเอียด (จำลอง GPS/กล้อง) ที่หน้า <a class="link" href="#/attendance">ลงเวลา</a></small></div>' +
      '<div class="dash-cols">' +
      '<div class="col"><div class="card"><div class="card-head"><h3>วันลาคงเหลือ</h3><a class="link" href="#/leave">ขอลางาน</a></div>' +
      '<div class="bal-grid" id="de-bal"><small class="muted">กำลังโหลด…</small></div></div>' +
      '<div class="card"><div class="card-head"><h3>คำขอล่าสุดของฉัน</h3><a class="link" href="#/leave">ทั้งหมด</a></div>' +
      '<div id="de-leave"><small class="muted">กำลังโหลด…</small></div></div></div>' +
      '<div class="col">' +
      '<div class="card"><div class="card-head"><h3>OT ล่าสุด</h3><a class="link" href="#/ot">ทั้งหมด</a></div>' +
      '<div id="de-ot"><small class="muted">กำลังโหลด…</small></div></div>' +
      '<div class="card"><div class="card-head"><h3>สลิปเดือนล่าสุด</h3><a class="link" href="#/epayslip">เปิดสลิป</a></div>' +
      (slip ? '<div class="slip-mini"><span>' + fmtMonthYear(paid.month, paid.year) + '</span><b>฿ ' + money(slip.net) + '</b><small>เงินสุทธิเข้าบัญชี ' + esc(e.bank) + ' ' + maskAcc(e.account) + '</small></div>' : emptyState('ยังไม่มีสลิป')) + '</div>' +
      dashNotifyCard() +
      '<div class="card"><div class="card-head"><h3>ประกาศบริษัทล่าสุด</h3><a class="link" href="#/announcements">ดูทั้งหมด</a></div>' +
      '<div id="de-ann"><small class="muted">กำลังโหลด…</small></div></div>' +
      '</div></div></div>';

    startLiveClock();
    // การลงเวลาบันทึกลง Supabase ที่หน้า "ลงเวลา" เท่านั้น (แหล่งข้อมูลเดียว)
    document.getElementById('dash-in').onclick = function () { location.hash = '#/attendance'; };
    document.getElementById('dash-out').onclick = function () { location.hash = '#/attendance'; };

    dashEmpLoad(seq);
  }

  function dashEmpLoad(seq) {
    if (!sbReady() || !sbToken()) {
      ['de-bal', 'de-leave', 'de-ot', 'de-ann'].forEach(function (id) {
        dashErrBox(id, 'ยังไม่ได้เชื่อมต่อ Supabase — โหลดข้อมูลไม่ได้');
      });
      var stb = document.getElementById('de-status');
      if (stb) stb.innerHTML = '<span class="chip chip-bad">โหลดสถานะไม่สำเร็จ</span>';
      return;
    }
    var tk = sbToken();

    /* ---- ลงเวลาวันนี้ + ชื่อกะ ---- */
    sbRpc('njhr_att_today', { p_token: tk }).then(function (r) {
      if (seq !== dashEmp.seq) return;
      var stb = document.getElementById('de-status');
      var inT = dashHM2(r && r.check_in), outT = dashHM2(r && r.check_out);
      if (stb) {
        stb.innerHTML = (inT || outT)
          ? (inT ? '<span class="chip chip-ok">เข้างาน ' + esc(inT) + '</span>' : '') +
            (outT ? ' <span class="chip chip-info">ออกงาน ' + esc(outT) + '</span>' : '')
          : '<span class="chip chip-warn">วันนี้ยังไม่ได้ลงเวลา</span>';
      }
      var sh = document.getElementById('de-shift');
      if (sh && r && r.shift_name) {
        sh.textContent = r.shift_name +
          (r.shift_start ? ' ' + String(r.shift_start).slice(0, 5) + '–' + String(r.shift_end || '').slice(0, 5) : '');
      }
      var bi = document.getElementById('dash-in'), bo = document.getElementById('dash-out');
      if (bi) bi.disabled = !!inT;
      if (bo) bo.disabled = !inT || !!outT;
    })['catch'](function (ex) {
      if (seq !== dashEmp.seq) return;
      try { console.error('[DASHBOARD USER] njhr_att_today:', ex); } catch (e) {}
      var stb = document.getElementById('de-status');
      if (stb) stb.innerHTML = '<span class="chip chip-bad">โหลดสถานะลงเวลาไม่สำเร็จ</span>';
    });

    /* ---- วันลาคงเหลือ ---- */
    sbRpcList('njhr_leave_balances', { p_token: tk }).then(function (rows) {
      if (seq !== dashEmp.seq) return;
      var box = document.getElementById('de-bal');
      if (!box) return;
      var use = (rows || []).filter(function (b) { return b.quota != null && Number(b.quota) > 0; });
      box.innerHTML = use.length ? use.map(function (b) {
        var q = Number(b.quota) || 0, rem = Math.round((Number(b.remaining) || 0) * 100) / 100;
        var pct = q > 0 ? Math.max(0, Math.min(100, rem / q * 100)) : 0;
        return '<div class="bal-item"><div class="bal-top"><span>' + esc(dashLtName(b.leave_type)) +
          '</span><b>' + rem + ' วัน</b></div><div class="bar-track"><div class="bar-fill" style="width:' +
          pct + '%;background:' + dashLtColor(b.leave_type) + '"></div></div></div>';
      }).join('') : emptyState('ยังไม่มีสิทธิ์การลา');
    })['catch'](function (ex) {
      if (seq !== dashEmp.seq) return;
      dashErrBox('de-bal', 'โหลดวันลาคงเหลือไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
    });

    /* ---- คำขอลาล่าสุดของฉัน ---- */
    sbRpcList('njhr_leave_list', { p_token: tk, p_status: null, p_limit: 3, p_offset: 0 })
      .then(function (rows) {
        if (seq !== dashEmp.seq) return;
        var box = document.getElementById('de-leave');
        if (!box) return;
        box.innerHTML = (rows && rows.length)
          ? '<div class="list">' + rows.slice(0, 3).map(function (l) {
              var d1 = fmtDateDMY(l.start_date);
              var d2 = (l.end_date && l.end_date !== l.start_date) ? ' – ' + fmtDateDMY(l.end_date) : '';
              return '<div class="list-row"><div class="grow"><b>' + esc(dashLtName(l.leave_type)) +
                '</b><small>' + d1 + d2 + ' · ' + (Number(l.total_days) || 0) + ' วัน</small></div>' +
                statusBadge(l.ui_status || l.status) + '</div>';
            }).join('') + '</div>'
          : emptyState('ยังไม่เคยขอลา');
      })['catch'](function (ex) {
        if (seq !== dashEmp.seq) return;
        dashErrBox('de-leave', 'โหลดคำขอลาไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
      });

    /* ---- OT ล่าสุดของฉัน ---- */
    sbRpcList('njhr_ot_list', { p_token: tk, p_from: null, p_to: null, p_status: null,
      p_dept: null, p_employee: null, p_q: null, p_mine: true, p_limit: 3, p_offset: 0 })
      .then(function (rows) {
        if (seq !== dashEmp.seq) return;
        var box = document.getElementById('de-ot');
        if (!box) return;
        box.innerHTML = (rows && rows.length)
          ? '<div class="list">' + rows.slice(0, 3).map(function (o) {
              return '<div class="list-row"><div class="grow"><b>' + fmtDateDMY(o.ot_date) +
                '</b><small>' + esc(String(o.start_time || '').slice(0, 5)) + ' – ' +
                esc(String(o.end_time || '').slice(0, 5)) + ' (' + (Number(o.ot_hours) || 0) +
                ' ชม.)</small></div>' + statusBadge(o.status) + '</div>';
            }).join('') + '</div>'
          : emptyState('ยังไม่มีคำขอ OT');
      })['catch'](function (ex) {
        if (seq !== dashEmp.seq) return;
        dashErrBox('de-ot', 'โหลดคำขอ OT ไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
      });

    /* ---- ประกาศบริษัทล่าสุด — Feed ของ USER (รักษา Target และสถานะอ่าน) ---- */
    sbRpcList('njhr_ann_feed', { p_token: tk, p_limit: 2, p_offset: 0, p_unread_only: false })
      .then(function (rows) {
        if (seq !== dashEmp.seq) return;
        var box = document.getElementById('de-ann');
        if (!box) return;
        box.innerHTML = (rows && rows.length)
          ? '<div class="list">' + rows.slice(0, 2).map(function (a) {
              /* ไอคอนปักหมุดใช้ is_important ที่ Feed ส่งมาจริง ไม่เดาจากเนื้อหา */
              return '<div class="list-row"><div class="grow"><b>' +
                (a.is_important ? icon('pin', 'ic-sm ic-red') + ' ' : '') + esc(a.title) +
                '</b><small>' + fmtDate(String(a.publish_at || '').slice(0, 10)) + '</small></div></div>';
            }).join('') + '</div>'
          : emptyState('ยังไม่มีประกาศ');
      })['catch'](function (ex) {
        if (seq !== dashEmp.seq) return;
        dashErrBox('de-ann', 'โหลดประกาศไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
      });
  }

  /* ============================================================
     การ์ด "คำขอลาล่าสุด" (Dashboard ผู้ดูแล) — ข้อมูลจริงจาก Supabase
       RPC: njhr_rpt_leave_list (S1_report_menu.sql) — คำขอลาทุกสถานะ 1 คำขอ = 1 แถว
       ส่งตัวกรองเป็น null ทั้งหมด = ไม่จำกัดช่วงวันที่/แผนก/พนักงาน
       สิทธิ์การมองเห็นตรวจฝั่งเซิร์ฟเวอร์ด้วย njhr_rptmenu_guard (SUPER_ADMIN/ADMIN)
       ซึ่งเป็นชุดสิทธิ์เดียวกับที่ dashAdmin() ถูกเรียกอยู่แล้ว

     เดิมอ่านจาก db.leaves ใน localStorage ซึ่งไม่เคยถูกเติมจาก Supabase
     จึงขึ้น "ยังไม่มีคำขอลา" เสมอบน Production

     ⚠ ห้าม fallback ไป db.* / localStorage
        RPC ล้มเหลว = แสดงข้อความผิดพลาด + console.error ห้ามแสดงว่าไม่มีข้อมูล
     ============================================================ */
  var dashLv = { seq: 0 };

  function dashLeaveErr(msg, ex) {
    try { console.error('[DASHBOARD] njhr_rpt_leave_list ล้มเหลว:', ex || msg); } catch (e) {}
    var box = document.getElementById('dash-lv');
    if (box) box.innerHTML = '<div class="form-error" role="alert">' + esc(msg) + '</div>';
  }

  function dashLeaveBody() {
    var seq = ++dashLv.seq;
    setTimeout(function () {
      if (seq !== dashLv.seq || !document.getElementById('dash-lv')) return;
      if (!sbReady() || !sbToken()) {
        dashLeaveErr('ยังไม่ได้เชื่อมต่อ Supabase — โหลดคำขอลาล่าสุดไม่ได้');
        return;
      }
      sbRpcList('njhr_rpt_leave_list', {
        p_token: sbToken(), p_from: null, p_to: null, p_dept: null, p_q: null
      }).then(function (rows) {
        if (seq !== dashLv.seq) return;
        var box = document.getElementById('dash-lv');
        if (!box) return;
        // ใหม่ไปเก่าตามเวลาที่ยื่นคำขอ แล้วตัด 5 รายการแรก
        var top = (rows || []).slice().sort(function (a, b) {
          return String(b.created_at || '').localeCompare(String(a.created_at || ''));
        }).slice(0, 5);
        box.innerHTML = top.length ? '<div class="list">' + top.map(function (r) {
          var who = String((r.prefix || '') + (r.full_name || '')).trim() || '—';
          var lt = lvType(r.leave_type);
          return '<div class="list-row">' + avatarHTML(who, 36) +
            '<div class="grow"><b>' + esc(who) + '</b><small>' + esc(lt.name) + ' · ' +
            fmtDate(r.start_date) +
            (r.end_date !== r.start_date ? ' – ' + fmtDate(r.end_date) : '') + '</small></div>' +
            statusBadge(r.ui_status || r.status) + '</div>';
        }).join('') + '</div>' : emptyState('ยังไม่มีคำขอลา');
      })['catch'](function (ex) {
        if (seq !== dashLv.seq) return;
        dashLeaveErr('โหลดคำขอลาล่าสุดไม่สำเร็จ: ' + ((ex && ex.message) || ex), ex);
      });
    }, 0);
    return '<div id="dash-lv"><small class="muted">กำลังโหลด…</small></div>';
  }

  // การ์ด "การแจ้งเตือนล่าสุด" บน Dashboard — ข้อมูลจริงจาก Supabase (njhr_notify_list)
  function dashNotifyCard() {
    setTimeout(function () {
      if (!sbToken() || !sbReady() || !document.getElementById('dash-nt')) return;
      sbRpcList('njhr_notify_list', { p_token: sbToken(), p_limit: 3, p_offset: 0 }).then(function (rows) {
        var box = document.getElementById('dash-nt');
        if (!box) return;
        box.innerHTML = rows.length ? '<div class="list dash-nt-grid">' + rows.map(function (n) {
          /* ไอคอนตาม module ที่ RPC ส่งมาจริง (njhr_notify_link ใช้ค่าเดียวกัน) ไม่เดาจากข้อความ */
          var mk = String(n.module || n.kind || '').toLowerCase();
          var ic = mk === 'ot' ? 'timer' : mk === 'attendance' ? 'clock'
                 : mk === 'approval' ? 'checkSquare' : mk === 'payroll' ? 'wallet' : 'fileText';
          return '<a class="list-row" href="' + esc(n.link) + '"><span class="nt-ic n-' + esc(mk || 'other') + '">' +
            icon(ic) + '</span>' +
            '<div class="grow"><b>' + esc(n.title) + '</b>' +
            '<small>' + esc(n.body) + ' · ' + esc(String(n.created_at || '').replace('T', ' ').slice(0, 16)) + '</small></div>' +
            (n.is_read ? '' : '<span class="nt-dot"></span>') + '</a>';
        }).join('') + '</div>' : emptyState('ไม่มีการแจ้งเตือน');
      }).catch(function () {
        var b2 = document.getElementById('dash-nt');
        if (b2) b2.innerHTML = emptyState('โหลดการแจ้งเตือนไม่สำเร็จ');
      });
    }, 0);
    return '<div class="card"><div class="card-head"><h3>การแจ้งเตือนล่าสุด</h3>' +
      '<a class="link" href="#/notifications">ดูทั้งหมด</a></div>' +
      '<div id="dash-nt"><small class="muted">กำลังโหลด…</small></div></div>';
  }



