  /* ================= REPORT ลางาน (#/rpt-leave) · REPORT OT (#/rpt-ot) =================
     หน้าคอมพิวเตอร์เท่านั้น — เมนูทั้งสองรายการมี class .only-desktop จึงไม่โผล่บนมือถือ

     ข้อมูลจริงจากฐานข้อมูลเท่านั้น ผ่าน RPC อ่านอย่างเดียวที่สร้างใหม่ใน S1_report_menu.sql
       REPORT ลางาน → njhr_rpt_leave_list  (คำขอลาทุกสถานะ · 1 คำขอ = 1 แถว)
       REPORT OT    → njhr_rpt_ot_list     (คำขอ OT ทุกสถานะ · 1 คำขอ = 1 แถว)
     ห้าม fallback ไป db.* / localStorage / ข้อมูลเงินเดือน — RPC ล้มเหลว = แสดงข้อความผิดพลาด

     RPC คืนทุกแถวตามตัวกรองในครั้งเดียว หน้าจอแบ่งหน้าเอง
     EXPORT EXCEL จึงใช้ชุดข้อมูลเดียวกับตารางหลังกรอง ไม่ใช่เฉพาะหน้าปัจจุบัน
     ============================================================================== */
  var RPTM_PER = 50;

  var RPTM_LEAVE_HEAD = ['ลำดับ', 'เลขคำขอ', 'ประเภท', 'วันที่', 'รูปแบบการลา',
    'จำนวนวันลา', 'ชื่อคนลา', 'สถานะ'];
  var RPTM_OT_HEAD = ['ลำดับ', 'เลขคำขอ', 'ประเภท', 'วันที่', 'ช่วงเวลา',
    'จำนวนชั่วโมง', 'ชื่อคนขอ', 'สถานะ'];

  var RPTM_LEAVE_W = [7, 15, 16, 26, 16, 12, 28, 14];
  var RPTM_OT_W = [7, 15, 14, 16, 18, 14, 28, 14];

  var RPTM_STATUS_TH = {
    PENDING: 'รออนุมัติ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ',
    CANCELLED: 'ยกเลิกแล้ว', COMPLETED: 'เสร็จสิ้น', NEED_MORE_INFO: 'ขอข้อมูลเพิ่ม'
  };

  /* State แยกกันคนละชุดต่อรายงาน — เปลี่ยนหน้าไปกลับแล้วตัวกรองยังอยู่ */
  /* ตัวกรองหลักคือ "รอบเดือน 26–25" (ym) ไม่ใช่ช่วงวันที่อิสระอีกต่อไป
     ค่าเริ่มต้น = รอบเดือนปัจจุบัน (cycleCurrent) เพื่อให้เปิดหน้ามาเห็นข้อมูลรอบนี้ทันที
     ช่วงวันที่จริงที่ส่งไป RPC คำนวณจาก cycleRange() ตัวกลางเสมอ */
  var rptmState = {
    leave: { ym: '', dept: '', q: '', rows: null, err: '', page: 0, seq: 0 },
    ot: { ym: '', dept: '', q: '', rows: null, err: '', page: 0, seq: 0 }
  };

  function rptmCycle(s) {
    if (!s.ym) s.ym = cycleCurrent().ym;
    return cycleRange(s.ym) || cycleCurrent();
  }

  function rptmMonthOptions(cur) {
    return cycleOptions(cur, 24, 1).map(function (ym) {
      return '<option value="' + ym + '"' + (ym === cur ? ' selected' : '') + '>' +
        esc(cycleLabel(ym)) + '</option>';
    }).join('');
  }
  var rptmDepts = [];
  var rptmDeptsLoaded = false;

  function rptmStatusTH(st) { return RPTM_STATUS_TH[st] || String(st || ''); }

  function rptmFullName(r) {
    return String((r.prefix || '') + (r.full_name || '')).trim() || '—';
  }

  function rptmNum(v) { var n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : 0; }

  function rptmHM(v) { return String(v == null ? '' : v).slice(0, 5); }

  /* ---------- แผนกจริงจากฐานข้อมูล (RPC เดียวกับหน้ารายงานการลงเวลา) ---------- */
  function rptmLoadDepts(kind, el) {
    if (rptmDeptsLoaded || !sbReady() || !sbToken()) return;
    sbRpcList('njhr_emp_departments', { p_token: sbToken() }).then(function (ds) {
      rptmDeptsLoaded = true;
      rptmDepts = (ds || []).map(function (d) { return String(d.name || ''); })
        .filter(function (n) { return n !== ''; });
      var sel = document.getElementById('rptm-dept');
      if (sel) sel.innerHTML = rptmDeptOptions(rptmState[kind].dept);
    }).catch(function (er) {
      console.error('[REPORT MENU] njhr_emp_departments ล้มเหลว:', er);
    });
  }

  function rptmDeptOptions(cur) {
    return '<option value="">ทุกแผนก</option>' + rptmDepts.map(function (n) {
      return '<option value="' + esc(n) + '"' + (cur === n ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join('');
  }

  /* ---------- แถวสำหรับตารางและ Excel (ชุดเดียวกัน ลำดับคอลัมน์เดียวกัน) ---------- */
  function rptmLeaveCells(r, i) {
    var lt = lvType(r.leave_type);
    var d1 = fmtDateDMY(r.start_date);
    var d2 = (r.end_date && r.end_date !== r.start_date) ? ' – ' + fmtDateDMY(r.end_date) : '';
    var mode = String(r.mode_txt || '');
    if (String(r.leave_unit || '') === 'hour') {
      mode += ' ' + rptmHM(r.start_time) + '–' + rptmHM(r.end_time);
    }
    return [
      String(i + 1),
      String(r.request_no || '—'),
      String(lt.name || r.leave_type || ''),
      d1 + d2,
      mode,
      String(rptmNum(r.total_days)),
      rptmFullName(r),
      rptmStatusTH(r.ui_status || r.status)
    ];
  }

  function rptmOtCells(r, i) {
    return [
      String(i + 1),
      String(r.request_no || '—'),
      r.is_holiday ? 'OT วันหยุด' : 'OT ปกติ',
      fmtDateDMY(r.ot_date),
      rptmHM(r.start_time) + ' – ' + rptmHM(r.end_time) + (r.spans_next_day ? ' (+1 วัน)' : ''),
      String(rptmNum(r.ot_hours)),
      rptmFullName(r),
      rptmStatusTH(r.status)
    ];
  }

  var RPTM_CFG = {
    leave: {
      key: 'leave', title: 'REPORT ลางาน', sheet: 'REPORT ลางาน',
      rpc: 'njhr_rpt_leave_list', head: RPTM_LEAVE_HEAD, widths: RPTM_LEAVE_W,
      cells: rptmLeaveCells, empty: 'ไม่พบคำขอลาตามตัวกรองที่เลือก'
    },
    ot: {
      key: 'ot', title: 'REPORT OT', sheet: 'REPORT OT',
      rpc: 'njhr_rpt_ot_list', head: RPTM_OT_HEAD, widths: RPTM_OT_W,
      cells: rptmOtCells, empty: 'ไม่พบคำขอ OT ตามตัวกรองที่เลือก'
    }
  };

  /* ---------- โครงหน้า ---------- */
  function rptmRender(cfg, el) {
    var s = rptmState[cfg.key];
    /* ต้องมีรอบเดือนก่อนสร้าง <select> มิฉะนั้น cycleOptions('') จะคืน [] แล้วช่องจะว่าง */
    if (!s.ym) s.ym = cycleCurrent().ym;

    el.innerHTML =
      '<div class="toolbar rptm-filters">' +
      '<label class="rptm-f rptm-f-ym"><span>รอบเดือน</span>' +
      '<select id="rptm-ym">' + rptmMonthOptions(s.ym) + '</select></label>' +
      '<label class="rptm-f"><span>แผนก</span>' +
      '<select id="rptm-dept">' + rptmDeptOptions(s.dept) + '</select></label>' +
      '<label class="rptm-f rptm-f-emp"><span>พนักงาน</span>' +
      '<span class="search-box">' + icon('search', 'ic-sm') +
      '<input id="rptm-q" autocomplete="off" ' +
      'placeholder="ค้นหาชื่อ นามสกุล ชื่อเล่น หรือรหัสพนักงาน" value="' + esc(s.q) + '"></span></label>' +
      '<button type="button" class="btn btn-ghost" id="rptm-clear">ล้างตัวกรอง</button>' +
      '<span class="grow"></span>' +
      '<button type="button" class="btn btn-primary" id="rptm-export">' + icon('download') +
      ' EXPORT EXCEL</button></div>' +
      /* บอกช่วงวันที่จริงของรอบที่เลือก เปลี่ยนตามเดือนอัตโนมัติ */
      '<p class="rptm-cycle" id="rptm-cycle">' + esc(cycleRangeText(s.ym)) + '</p>' +
      '<div class="card p0 rptm-wrap" id="rptm-table"></div>' +
      '<div class="toolbar" id="rptm-pager"></div>' +
      '<div class="form-error" id="rptm-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('rptm-ym').onchange = function () {
      s.ym = this.value; s.page = 0;
      var cy = document.getElementById('rptm-cycle');
      if (cy) cy.textContent = cycleRangeText(s.ym);
      rptmLoad(cfg);
    };
    document.getElementById('rptm-dept').onchange = function () {
      s.dept = this.value; s.page = 0; rptmLoad(cfg);
    };
    var qEl = document.getElementById('rptm-q');
    qEl.oninput = debounce(function () { s.q = qEl.value; s.page = 0; rptmLoad(cfg); }, 350);
    document.getElementById('rptm-clear').onclick = function () {
      s.ym = cycleCurrent().ym; s.dept = ''; s.q = ''; s.page = 0;
      rptmRender(cfg, el);
      rptmLoad(cfg);
    };
    document.getElementById('rptm-export').onclick = function () { rptmExport(cfg, this); };

    rptmLoadDepts(cfg.key, el);
    rptmPaint(cfg);
  }

  /* ---------- โหลดข้อมูลจริง ---------- */
  function rptmLoad(cfg) {
    var s = rptmState[cfg.key], seq = ++s.seq;
    s.err = '';
    if (!sbReady() || !sbToken()) {
      s.rows = []; s.err = 'ยังไม่ได้เชื่อมต่อ Supabase — รายงานนี้ต้องใช้ข้อมูลจริงเท่านั้น';
      rptmPaint(cfg); return;
    }
    s.rows = null;
    rptmPaint(cfg);
    /* ส่งช่วงวันที่ของรอบไปให้ RPC กรองตั้งแต่ต้น — ไม่ดึงทุกเดือนมาแล้วค่อย filter ในหน้าเว็บ
       p_from/p_to ของ RPC เป็นแบบรวมปลายทั้งสองข้าง (>= from และ <= to)
       จึงส่ง end = วันที่ 25 ได้ตรง ๆ และครอบคลุมวันที่ 25 ทั้งวัน */
    var cyc = rptmCycle(s);
    sbRpcList(cfg.rpc, {
      p_token: sbToken(),
      p_from: cyc.start, p_to: cyc.end,
      p_dept: s.dept || null, p_q: s.q || null
    }).then(function (rows) {
      if (seq !== s.seq) return;
      s.rows = rows || []; s.err = '';
      rptmPaint(cfg);
    }).catch(function (ex) {
      if (seq !== s.seq) return;
      s.rows = [];
      var m = (ex && ex.message) || String(ex);
      s.err = /njhr_rpt_(leave|ot)_list|schema cache|PGRST202|404/i.test(m)
        ? 'ยังไม่ได้ติดตั้ง RPC ของรายงานนี้บนฐานข้อมูล — กรุณารัน supabase-new/S1_report_menu.sql แล้วลองใหม่\n(' + m + ')'
        : 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + m;
      rptmPaint(cfg);
    });
  }

  /* ---------- วาดตาราง + สรุป + แบ่งหน้า ---------- */
  function rptmPaint(cfg) {
    var s = rptmState[cfg.key];
    var box = document.getElementById('rptm-table');
    if (!box) return;
    var pg = document.getElementById('rptm-pager');
    var errEl = document.getElementById('rptm-err');
    if (errEl) errEl.textContent = s.err || '';

    if (s.rows === null) {
      box.innerHTML = '<div class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</div>';
      if (pg) pg.innerHTML = '';
      return;
    }

    /* ข้อความสรุปเงื่อนไขการกรองถูกถอดออกจาก UI แล้ว — ตารางขยับขึ้นแทนที่ทันที
       ตัวกรองทุกตัวยังทำงานเหมือนเดิม (ค่ายังอยู่ใน rptmState และถูกส่งไป RPC ตามเดิม) */
    var all = s.rows;

    if (!all.length) {
      box.innerHTML = emptyState(s.err ? 'ไม่สามารถแสดงข้อมูลได้' : cfg.empty);
      if (pg) pg.innerHTML = '';
      return;
    }

    var pages = Math.ceil(all.length / RPTM_PER) || 1;
    if (s.page >= pages) s.page = pages - 1;
    var start = s.page * RPTM_PER;
    var slice = all.slice(start, start + RPTM_PER);

    box.innerHTML = '<div class="table-wrap"><table class="rptm-table"><thead><tr>' +
      cfg.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      slice.map(function (r, i) {
        return '<tr>' + cfg.cells(r, start + i).map(function (c) {
          return '<td>' + esc(c) + '</td>';
        }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div>';

    if (pg) {
      pg.innerHTML = pages > 1
        ? '<button type="button" class="btn btn-ghost btn-sm" id="rptm-prev"' + (s.page === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
          '<span class="muted">หน้า ' + (s.page + 1) + ' / ' + pages + '</span>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="rptm-next"' + (s.page + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button>'
        : '';
      if (pages > 1) {
        document.getElementById('rptm-prev').onclick = function () {
          if (s.page > 0) { s.page--; rptmPaint(cfg); }
        };
        document.getElementById('rptm-next').onclick = function () {
          if (s.page + 1 < pages) { s.page++; rptmPaint(cfg); }
        };
      }
    }
  }

  /* ---------- EXPORT EXCEL ----------
     ใช้ s.rows ทั้งชุด (ทุกหน้า) ที่ RPC คืนมาตามตัวกรองปัจจุบัน
     หัวคอลัมน์และลำดับคอลัมน์ = ชุดเดียวกับตารางบนหน้าจอ (cfg.head / cfg.cells) */
  function rptmExport(cfg, btn) {
    var s = rptmState[cfg.key], errEl = document.getElementById('rptm-err');
    if (errEl) errEl.textContent = '';
    if (s.rows === null) { if (errEl) errEl.textContent = 'กำลังโหลดข้อมูล กรุณารอสักครู่'; return; }
    if (!s.rows.length) { if (errEl) errEl.textContent = cfg.empty; return; }   // ไม่สร้างไฟล์เปล่า
    if (btn.disabled) return;

    var label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้างไฟล์…';

    var rows = s.rows.map(function (r, i) { return cfg.cells(r, i); });
    /* ชื่อไฟล์ระบุรอบเดือนที่เลือก — ข้อมูลในไฟล์คือชุดเดียวกับที่แสดงบนหน้าจอ */
    var cyc = rptmCycle(s);
    var period = fmtDateDMY(cyc.start).replace(/\//g, '-') + '_ถึง_' +
      fmtDateDMY(cyc.end).replace(/\//g, '-');
    var fname = rptSafeName(cfg.sheet) + '_' + rptSafeName(s.dept || 'ทุกแผนก') + '_' +
      rptSafeName(s.q || 'ทุกคน') + '_' + period + '.xlsx';

    rptLoadZip().then(function () {
      return rptBuildXlsx(cfg.sheet, cfg.head, rows, cfg.widths);
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      audit('EXPORT', 'Export ' + cfg.sheet + ' ' + rows.length + ' รายการ');
      toast('ดาวน์โหลด ' + cfg.sheet + ' แล้ว ' + rows.length + ' รายการ');
    })['catch'](function (ex) {
      if (errEl) errEl.textContent = 'สร้างไฟล์ Excel ไม่สำเร็จ: ' + ((ex && ex.message) || ex);
    }).then(function () { btn.disabled = false; btn.innerHTML = label; });
  }

  function viewRptLeave(el) { rptmRender(RPTM_CFG.leave, el); rptmLoad(RPTM_CFG.leave); }
  function viewRptOT(el) { rptmRender(RPTM_CFG.ot, el); rptmLoad(RPTM_CFG.ot); }

  /* ================= รายงาน 50 ทวิ =================
     หนังสือรับรองการหักภาษี ณ ที่จ่าย — หน้ารายการ (อ่านอย่างเดียวในรอบนี้)

     ข้อมูลทั้งหมดมาจาก njhr_wht50_send_list (88_wht50_send.sql) ไม่มีการ hardcode
       รายได้รวม        = ผลรวม payroll.total_income ของปีภาษี (เฉพาะงวด CALCULATED/PAID)
       ภาษีหัก ณ ที่จ่าย = ผลรวม payroll.tax ชุดเดียวกัน
     ตัวเลขสรุปด้านบนมาจาก njhr_wht50_send_summary ซึ่งนับจากรายการชุดเดียวกัน

     สถานะแยกเป็น 2 แกน ตามที่ตกลงไว้
       สถานะเอกสาร  DRAFT · CONFIRMED · CANCELLED · AMENDED   (87_wht50.sql)
       สถานะการส่ง  NOT_SENT · SENT · OPENED                  (88_wht50_send.sql)

     ปุ่มในคอลัมน์ "จัดการ" และการส่ง ยังไม่เปิดใช้ในรอบนี้ (รอเทมเพลต PDF)
     จึงแสดงเป็นปุ่มที่กดไม่ได้พร้อมคำอธิบาย ไม่ซ่อน เพื่อให้เห็นขอบเขตงานที่เหลือ */
  var WHT_SEND_TH = {
    NOT_SENT: ['ยังไม่ส่ง', 'badge-mut'],
    SENT: ['ส่งแล้ว', 'badge-ok'],
    OPENED: ['เปิดแล้ว', 'badge-info']
  };
  var WHT_DOC_TH = {
    NONE: ['ยังไม่มีเอกสาร', 'badge-mut'],
    DRAFT: ['ร่าง', 'badge-warn'],
    CONFIRMED: ['ยืนยันแล้ว', 'badge-ok'],
    CANCELLED: ['ยกเลิก', 'badge-bad'],
    AMENDED: ['ถูกแทนที่', 'badge-mut']
  };

  /* ปุ่มส่งทั้งหมดถูกปิดไว้จนกว่าแบบฟอร์ม 50 ทวิ จะพร้อมใช้งานจริง
     Workflow ฝั่งฐานข้อมูลเชื่อมครบแล้ว (njhr_wht50_send · document_id · Trigger sync)
     แต่ยังไม่เปิดให้กดส่งจาก UI เพราะ:
       1) ยังไม่มีแบบฟอร์ม 50 ทวิ ตัวจริงที่ฝ่ายบัญชีตรวจแล้ว
       2) Edge Function njhr-doc-pdf ยังไม่ได้ deploy บน Production
     การส่งเอกสารภาษีที่ผิดแบบ พนักงานนำไปยื่นภาษีไม่ได้ จึงต้องกันไว้ก่อน */
  var WHT_BLOCK_MSG = 'ยังไม่ได้ตั้งค่าแบบฟอร์ม 50 ทวิ';

  var whtState = { year: 0, q: '', send: '', rows: null, sum: null, err: '', seq: 0 };

  /* ปีภาษีเป็น ค.ศ. ตามรูปแบบวันที่ของระบบ · แสดงคู่ พ.ศ. ให้อ่านง่าย */
  function whtYearOptions(cur) {
    var y = Number(String(todayISO()).slice(0, 4)) || cur;
    var out = [], i;
    for (i = 0; i < 6; i++) {
      var yy = y - i;
      out.push('<option value="' + yy + '"' + (yy === cur ? ' selected' : '') + '>' +
        yy + ' (พ.ศ. ' + (yy + 543) + ')</option>');
    }
    return out.join('');
  }

  function whtBadge(map, k) {
    var m = map[k] || [k, 'badge-mut'];
    return '<span class="badge ' + m[1] + '">' + esc(m[0]) + '</span>';
  }

  function whtMoney(v) {
    var n = Number(v);
    return isFinite(n) ? n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  }

  function viewRptWht50(el) {
    var s = whtState;
    if (!s.year) s.year = Number(String(todayISO()).slice(0, 4));

    el.innerHTML =
      '<p class="muted note wht-lead">จัดทำ ตรวจสอบ ดาวน์โหลด และส่งหนังสือรับรองการหักภาษี ณ ที่จ่ายให้พนักงาน</p>' +
      '<div class="toolbar rptm-filters">' +
      '<label class="rptm-f rptm-f-ym"><span>ปีภาษี</span>' +
      '<select id="wht-year">' + whtYearOptions(s.year) + '</select></label>' +
      '<label class="rptm-f rptm-f-emp"><span>พนักงาน</span>' +
      '<span class="search-box">' + icon('search', 'ic-sm') +
      '<input id="wht-q" autocomplete="off" placeholder="ค้นหารหัสพนักงาน หรือ ชื่อ-นามสกุล" ' +
      'value="' + esc(s.q) + '"></span></label>' +
      '<label class="rptm-f"><span>สถานะการส่ง</span>' +
      '<select id="wht-send">' +
      [['', 'ทั้งหมด'], ['NOT_SENT', 'ยังไม่ส่ง'], ['SENT', 'ส่งแล้ว'], ['OPENED', 'เปิดแล้ว']]
        .map(function (x) {
          return '<option value="' + x[0] + '"' + (s.send === x[0] ? ' selected' : '') + '>' + x[1] + '</option>';
        }).join('') + '</select></label>' +
      '<button type="button" class="btn btn-ghost" id="wht-clear">ล้างตัวกรอง</button>' +
      '<span class="grow"></span>' +
      '<button type="button" class="btn btn-primary" id="wht-sendall" disabled ' +
      'title="' + WHT_BLOCK_MSG + '">' + icon('send') + ' ส่งทั้งหมด</button></div>' +
      '<div class="ot-warn wht-block">' + icon('info', 'ic-sm') + ' ' + esc(WHT_BLOCK_MSG) + '</div>' +
      '<div id="wht-sum" class="wht-sum"></div>' +
      '<div class="card p0 rptm-wrap" id="wht-table"></div>' +
      '<div class="form-error" id="wht-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('wht-year').onchange = function () {
      s.year = parseInt(this.value, 10); whtLoad();
    };
    document.getElementById('wht-send').onchange = function () { s.send = this.value; whtLoad(); };
    var qEl = document.getElementById('wht-q');
    qEl.oninput = debounce(function () { s.q = qEl.value; whtLoad(); }, 350);
    document.getElementById('wht-clear').onclick = function () {
      s.year = Number(String(todayISO()).slice(0, 4)); s.q = ''; s.send = '';
      viewRptWht50(el); whtLoad();
    };

    whtPaint();
    whtLoad();
  }

  function whtLoad() {
    var s = whtState, seq = ++s.seq;
    s.err = '';
    if (!sbReady() || !sbToken()) {
      s.rows = []; s.sum = null;
      s.err = 'ยังไม่ได้เชื่อมต่อ Supabase — รายงานนี้ต้องใช้ข้อมูลจริงเท่านั้น';
      whtPaint(); return;
    }
    s.rows = null;
    whtPaint();
    Promise.all([
      sbRpcList('njhr_wht50_send_list', {
        p_token: sbToken(), p_year: s.year,
        p_q: s.q || null, p_send_status: s.send || null, p_dept: null
      }),
      sbRpc('njhr_wht50_send_summary', { p_token: sbToken(), p_year: s.year })
    ]).then(function (r) {
      if (seq !== s.seq) return;
      s.rows = r[0] || []; s.sum = r[1] || null; s.err = '';
      whtPaint();
    })['catch'](function (ex) {
      if (seq !== s.seq) return;
      s.rows = []; s.sum = null;
      s.err = (ex && ex.message) || 'โหลดข้อมูล 50 ทวิ ไม่สำเร็จ';
      try { console.error('[WHT50] โหลดรายการล้มเหลว:', ex); } catch (e) {}
      whtPaint();
    });
  }

  function whtPaint() {
    var s = whtState;
    var box = document.getElementById('wht-table');
    var sumEl = document.getElementById('wht-sum');
    var errEl = document.getElementById('wht-err');
    if (!box) return;
    if (errEl) errEl.textContent = s.err || '';

    if (s.rows === null) {
      box.innerHTML = '<div class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</div>';
      if (sumEl) sumEl.innerHTML = '';
      return;
    }

    if (sumEl) {
      sumEl.innerHTML = !s.sum ? '' :
        [['พนักงานทั้งหมด', s.sum.total_emp], ['พร้อมส่ง', s.sum.ready],
         ['ส่งแล้ว', s.sum.already_sent], ['เปิดแล้ว', s.sum.opened],
         ['ยังไม่มีเอกสาร', s.sum.no_doc], ['ข้อมูลไม่ครบ', s.sum.incomplete]]
          .map(function (x) {
            return '<span class="wht-sum-i"><small>' + esc(x[0]) + '</small><b>' +
              esc(String(Number(x[1]) || 0)) + '</b></span>';
          }).join('');
    }

    if (!s.rows.length) {
      box.innerHTML = emptyState(s.err ? 'ไม่สามารถแสดงข้อมูลได้'
        : 'ไม่พบพนักงานที่มีงวดเงินเดือนในปีภาษีนี้');
      return;
    }

    box.innerHTML =
      '<div class="lvt-wrap"><table class="lvt lvt-wht"><thead><tr>' +
      '<th>รหัสพนักงาน</th><th>ชื่อพนักงาน</th><th>แผนก</th>' +
      '<th class="wht-num">รายได้รวม</th><th class="wht-num">ภาษีหัก ณ ที่จ่าย</th>' +
      '<th>สถานะเอกสาร</th><th>สถานะการส่ง</th><th>จัดการ</th>' +
      '</tr></thead><tbody>' +
      s.rows.map(function (r) {
        return '<tr>' +
          '<td><b>' + esc(r.emp_code || '—') + '</b></td>' +
          '<td><b>' + esc(r.full_name || '—') + '</b>' +
          (r.has_national_id ? '' : '<small class="t-red">ไม่มีเลขประจำตัวประชาชน</small>') + '</td>' +
          '<td>' + esc(r.department_name || '—') + '</td>' +
          '<td class="wht-num">' + whtMoney(r.total_income) + '</td>' +
          '<td class="wht-num">' + whtMoney(r.total_tax) + '</td>' +
          '<td>' + whtBadge(WHT_DOC_TH, r.doc_status) +
          (r.doc_no ? '<small>' + esc(r.doc_no) + '</small>' : '') + '</td>' +
          '<td>' + whtBadge(WHT_SEND_TH, r.send_status) +
          (r.sent_at ? '<small>' + esc(String(r.sent_at).slice(0, 10)) + '</small>' : '') + '</td>' +
          '<td><div class="lvt-acts">' +
          ['eye:ดูตัวอย่าง', 'download:ดาวน์โหลด PDF', 'send:ส่งให้พนักงาน'].map(function (a) {
            var p = a.split(':');
            return '<button type="button" class="btn-icon" disabled aria-label="' + p[1] + '" ' +
              'title="' + p[1] + ' — ' + WHT_BLOCK_MSG + '">' + icon(p[0]) + '</button>';
          }).join('') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
