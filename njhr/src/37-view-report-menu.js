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
    leave: { ym: '', from: '', to: '', dept: '', q: '', rows: null, err: '', page: 0, seq: 0 },
    ot: { ym: '', from: '', to: '', dept: '', q: '', rows: null, err: '', page: 0, seq: 0 }
  };

  function rptmCycle(s) {
    if (!s.ym) s.ym = cycleCurrent().ym;
    return cycleRange(s.ym) || cycleCurrent();
  }

  /* ช่วงวันที่ที่ใช้ดึงข้อมูลจริง = รอบเดือน ∩ ช่วงที่ผู้ใช้เลือก
       ไม่เลือกวันที่เลย        → ได้รอบเดือนเต็มเหมือนเดิมทุกประการ
       เลือกเฉพาะ "จากวันที่"   → จากวันนั้นถึงปลายรอบ
       เลือกเฉพาะ "ถึงวันที่"   → ต้นรอบถึงวันนั้น
     เปรียบเทียบสตริง ISO ได้ตรง ๆ เพราะเป็น YYYY-MM-DD ความยาวเท่ากัน
     ส่งค่านี้เป็น p_from / p_to ให้ RPC เดิม (รองรับอยู่แล้ว) — ไม่กรองซ้ำในหน้าเว็บ */
  function rptmRange(s) {
    var c = rptmCycle(s);
    return {
      start: (s.from && s.from > c.start) ? s.from : c.start,
      end: (s.to && s.to < c.end) ? s.to : c.end
    };
  }

  /* ผู้ใช้เลือกวันที่กลับหัวกลับหาง — ต้องไม่ยิง Query และต้องบอกให้รู้ */
  function rptmDateErr(s) {
    if (s.from && s.to && s.from > s.to) return 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด';
    return '';
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
      /* ตัวกรองช่วงวันที่ — กรองเพิ่มภายในรอบเดือน ไม่แทนที่รอบเดือน
         ใช้ input[type=date] ชุดเดียวกับหน้าอื่นในระบบ */
      '<label class="rptm-f rptm-f-dt"><span>จากวันที่</span>' +
      '<input type="date" id="rptm-from" value="' + esc(s.from) + '" ' +
      'min="' + esc(rptmCycle(s).start) + '" max="' + esc(rptmCycle(s).end) + '"></label>' +
      '<label class="rptm-f rptm-f-dt"><span>ถึงวันที่</span>' +
      '<input type="date" id="rptm-to" value="' + esc(s.to) + '" ' +
      'min="' + esc(rptmCycle(s).start) + '" max="' + esc(rptmCycle(s).end) + '"></label>' +
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
      /* วันที่ที่เลือกไว้ถ้าหลุดออกนอกรอบใหม่ ให้ล้างทิ้ง กันผลลัพธ์ว่างโดยไม่รู้สาเหตุ */
      var c = rptmCycle(s);
      if (s.from && (s.from < c.start || s.from > c.end)) s.from = '';
      if (s.to && (s.to < c.start || s.to > c.end)) s.to = '';
      rptmRender(cfg, el);
      rptmLoad(cfg);
    };
    document.getElementById('rptm-from').onchange = function () {
      s.from = this.value; s.page = 0; rptmLoad(cfg);
    };
    document.getElementById('rptm-to').onchange = function () {
      s.to = this.value; s.page = 0; rptmLoad(cfg);
    };
    document.getElementById('rptm-dept').onchange = function () {
      s.dept = this.value; s.page = 0; rptmLoad(cfg);
    };
    var qEl = document.getElementById('rptm-q');
    qEl.oninput = debounce(function () { s.q = qEl.value; s.page = 0; rptmLoad(cfg); }, 350);
    document.getElementById('rptm-clear').onclick = function () {
      s.ym = cycleCurrent().ym; s.from = ''; s.to = ''; s.dept = ''; s.q = ''; s.page = 0;
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
    var derr = rptmDateErr(s);
    if (derr) { s.rows = []; s.err = derr; rptmPaint(cfg); return; }   // ไม่ยิง Query
    if (!sbReady() || !sbToken()) {
      s.rows = []; s.err = 'ยังไม่ได้เชื่อมต่อ Supabase — รายงานนี้ต้องใช้ข้อมูลจริงเท่านั้น';
      rptmPaint(cfg); return;
    }
    s.rows = null;
    rptmPaint(cfg);
    /* ส่งช่วงวันที่ของรอบไปให้ RPC กรองตั้งแต่ต้น — ไม่ดึงทุกเดือนมาแล้วค่อย filter ในหน้าเว็บ
       p_from/p_to ของ RPC เป็นแบบรวมปลายทั้งสองข้าง (>= from และ <= to)
       จึงส่ง end = วันที่ 25 ได้ตรง ๆ และครอบคลุมวันที่ 25 ทั้งวัน */
    var cyc = rptmRange(s);
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
    /* ชื่อไฟล์ระบุช่วงวันที่จริงที่กรอง (รอบเดือน ∩ จาก–ถึง)
       แถวที่ Export คือ s.rows ตัวเดียวกับที่ตารางใช้ จึงตรงกับหน้าจอเสมอ */
    var cyc = rptmRange(s);
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
  /* ---------- Feature Gate ----------
     WHT_PDF_READY = false จนกว่าจะครบทุกข้อนี้ (ห้ามลบ Gate ก่อนตรวจจริง)
       1. Renderer WHT50 มีจริงใน Source            → มีแล้ว (edge-functions/njhr-doc-pdf/wht50.ts)
       2. SQL PDF Pipeline พร้อม                     → มีแล้ว (90_wht50_pdf.sql) แต่ยังไม่ได้รัน
       3. Edge Function njhr-doc-pdf Deploy จริง      → ยังไม่ได้ Deploy
       4. มีไฟล์ฟอนต์ไทยใน Deployment                 → ยังไม่มี (fonts/ มีแต่ README)
       5. ทดสอบ generate → READY → download ผ่านจริง  → ยังไม่ได้ทดสอบ
     เมื่อครบแล้วเปลี่ยนเป็น true จุดเดียว ปุ่มส่งทั้งหมดจะเปิดพร้อมกัน */
  var WHT_PDF_READY = false;

  var WHT_BLOCK_MSG = 'ยังไม่ได้ตั้งค่าแบบฟอร์ม 50 ทวิ';
  var WHT_BATCH = 25;              // จำนวนรายการต่อรอบของการส่งจำนวนมาก

  /* สถานะการเลือกและผลการส่ง — แยกจาก whtState เพื่อไม่ให้ปนกับข้อมูลตาราง */
  var whtSel = {};                 // { wht50_id: true }
  var whtBulk = null;              // { total, done, ok, skip, fail, errors:[], running }

  var whtState = { year: 0, q: '', send: '', dept: '', rows: null, sum: null, err: '', seq: 0 };

  /* แผนกจริงจากฐานข้อมูล — ใช้ rptmDepts ชุดเดียวกับรายงานอื่น (njhr_emp_departments)
     ห้าม hardcode รายชื่อแผนก */
  function whtLoadDepts() {
    var sel = document.getElementById('wht-dept');
    if (!sel) return;
    if (rptmDeptsLoaded) { sel.innerHTML = rptmDeptOptions(whtState.dept); return; }
    if (!sbReady() || !sbToken()) return;
    sbRpcList('njhr_emp_departments', { p_token: sbToken() }).then(function (ds) {
      rptmDeptsLoaded = true;
      rptmDepts = (ds || []).map(function (d) { return String(d.name || ''); })
        .filter(function (n) { return n !== ''; });
      var s2 = document.getElementById('wht-dept');
      if (s2) s2.innerHTML = rptmDeptOptions(whtState.dept);
    })['catch'](function (er) {
      console.error('[WHT50] njhr_emp_departments ล้มเหลว:', er);
    });
  }

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

  /* ---------- ปุ่มจัดการตามสถานะเอกสาร ----------
     ไม่มีเอกสาร → สร้างร่าง
     DRAFT       → ดูตัวอย่าง · แก้ไข · ยืนยัน
     CONFIRMED   → ดูตัวอย่าง · ดาวน์โหลด PDF · ส่ง
     SENT/OPENED → ดูตัวอย่าง · ดาวน์โหลด PDF

     ID ที่ใช้ต่างกันชัดเจน (ห้ามสลับ)
       wht50_id    → draft · get · update · confirm · send
       document_id → njhr_doc_pdf_access (ดาวน์โหลด) */
  function whtBtn(kind, id, label, on, why, ic) {
    return '<button type="button" class="btn-icon" data-wht-' + kind + '="' + esc(id || '') + '"' +
      (on ? '' : ' disabled') + ' aria-label="' + label + '" title="' + label + (on ? '' : why) +
      '">' + icon(ic) + '</button>';
  }

  function whtActions(r) {
    var st = r.doc_status || 'NONE';
    var sent = r.send_status === 'SENT' || r.send_status === 'OPENED';
    var out = [];

    if (st === 'NONE') {
      out.push(whtBtn('draft', r.employee_id, 'สร้างร่าง', true, '', 'plus'));
      return out;
    }

    out.push(whtBtn('view', r.wht50_id, 'ดูตัวอย่าง', !!r.wht50_id, ' — ยังไม่มีเอกสาร', 'eye'));

    if (st === 'DRAFT') {
      out.push(whtBtn('edit', r.wht50_id, 'แก้ไข', true, '', 'edit'));
      out.push(whtBtn('confirm', r.wht50_id, 'ยืนยันเอกสาร', true, '', 'checkSquare'));
      return out;
    }

    /* CONFIRMED แต่ยังไม่ส่ง — ยังไม่มี document_id จึงยังสร้าง/ดาวน์โหลด PDF ไม่ได้
       (document_id เกิดตอน njhr_wht50_send สร้างแถวใน njhr_emp_documents) */
    if (!sent) {
      out.push(whtBtn('send', r.wht50_id, 'ส่งให้พนักงาน', WHT_PDF_READY,
        ' — ' + WHT_BLOCK_MSG, 'send'));
      return out;
    }

    /* ส่งแล้ว — มี document_id จึงสร้างและดาวน์โหลด PDF ได้ (เมื่อ Gate เปิด) */
    out.push(whtBtn('gen', r.document_id, 'สร้าง PDF', WHT_PDF_READY && !!r.document_id,
      ' — ' + WHT_BLOCK_MSG, 'refresh'));
    out.push(whtBtn('dl', r.document_id, 'ดาวน์โหลด PDF', WHT_PDF_READY && !!r.document_id,
      ' — ' + WHT_BLOCK_MSG, 'download'));
    return out;
  }

  /* ---------- แถบ "เลือกแล้ว X รายการ" ---------- */
  function whtPickable() {
    return (whtState.rows || []).filter(function (r) { return r.is_ready && r.wht50_id; });
  }

  function whtSelIds() {
    return Object.keys(whtSel).filter(function (k) { return whtSel[k]; });
  }

  function whtSelBar() {
    var bar = document.getElementById('wht-selbar');
    if (!bar) return;
    var n = whtSelIds().length;
    if (!n) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = '<b>เลือกแล้ว ' + n + ' รายการ</b>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="wht-unsel">ยกเลิกการเลือก</button>' +
      '<span class="grow"></span>' +
      '<button type="button" class="btn btn-primary btn-sm" id="wht-sendsel"' +
      (WHT_PDF_READY ? '' : ' disabled title="' + WHT_BLOCK_MSG + '"') + '>' +
      icon('send') + ' ส่งรายการที่เลือก</button>';
    document.getElementById('wht-unsel').onclick = function () {
      whtSel = {}; whtPaint(); 
    };
    var sb = document.getElementById('wht-sendsel');
    if (sb) sb.onclick = function () { whtConfirmSend(whtSelIds(), 'เลือกไว้'); };
  }

  /* ---------- กล่องยืนยันก่อนส่ง ----------
     ตัวเลขทุกตัวมาจาก njhr_wht50_send_summary และรายการจริงบนหน้า ไม่ hardcode */
  function whtConfirmSend(ids, scope) {
    if (!ids.length) { toast('ยังไม่ได้เลือกรายการ', 'info'); return; }
    var s = whtState, sum = s.sum || {};
    var rows = (s.rows || []).filter(function (r) { return ids.indexOf(r.wht50_id) >= 0; });
    var ready = rows.filter(function (r) { return r.is_ready; }).length;
    var sent = rows.filter(function (r) { return r.send_status !== 'NOT_SENT'; }).length;
    var bad = rows.filter(function (r) { return !r.has_national_id; }).length;
    var nodoc = rows.filter(function (r) { return r.doc_status !== 'CONFIRMED'; }).length;

    openModal('ยืนยันส่งเอกสาร 50 ทวิ ให้พนักงาน' + (scope === 'ทั้งหมด' ? 'ทั้งหมด' : 'ที่เลือก'),
      '<div class="wht-sum">' +
      [['ปีภาษี', (s.year + 543) + ' (ค.ศ. ' + s.year + ')'],
       ['พนักงานทั้งหมด', (sum.total_emp != null ? sum.total_emp : rows.length) + ' คน'],
       ['เลือกส่งครั้งนี้', ids.length + ' คน'],
       ['พร้อมส่ง', ready + ' คน'],
       ['ส่งแล้ว', sent + ' คน'],
       ['ยังไม่มีเอกสาร', nodoc + ' คน'],
       ['ข้อมูลไม่ครบ', bad + ' คน']].map(function (x) {
        return '<span class="wht-sum-i"><small>' + esc(x[0]) + '</small><b>' + esc(String(x[1])) + '</b></span>';
      }).join('') + '</div>' +
      '<p class="muted note">ระบบส่งเฉพาะรายการที่ <b>พร้อมส่ง</b> เท่านั้น ' +
      'รายการที่ส่งแล้วจะถูกข้ามอัตโนมัติ ไม่มีการส่งซ้ำ</p>' +
      '<div id="wht-progress" class="wht-progress"></div>',
      '<button type="button" class="btn btn-ghost" id="wht-cancel">ยกเลิก</button>' +
      '<button type="button" class="btn btn-primary" id="wht-go">' + icon('send') + ' เริ่มส่ง</button>');

    document.getElementById('wht-cancel').onclick = closeModal;
    document.getElementById('wht-go').onclick = function () {
      /* ส่งด้วย wht50_id เท่านั้น — njhr_wht50_send รับ id ของ njhr_wht50 */
      var only = rows.filter(function (r) { return r.is_ready; })
        .map(function (r) { return r.wht50_id; });
      whtBulkSend(only);
    };
  }

  /* ---------- ส่งจำนวนมากแบบแบ่งรอบ ----------
     รอบละ WHT_BATCH รายการ · คืนคิวให้เบราว์เซอร์ระหว่างรอบด้วย setTimeout
     จึงไม่ทำให้หน้าเว็บค้างแม้พนักงานหลักร้อยคน
     ใช้ RPC เดิม njhr_wht50_send รายคน — ไม่มีการสร้าง RPC ส่งซ้ำ
     ALREADY_SENT จาก RPC นับเป็น "ข้าม" ไม่ใช่ผิดพลาด */
  function whtBulkSend(ids) {
    if (!ids.length) { toast('ไม่มีรายการที่พร้อมส่ง', 'info'); return; }
    /* นับ 2 ขั้นแยกกัน: ส่งเอกสาร → สร้าง PDF
       ขั้นสร้าง PDF ล้มไม่ทำให้ "ส่งแล้ว" กลายเป็นล้มเหลว */
    whtBulk = { total: ids.length, done: 0, sent: 0, skip: 0, fail: 0,
                pdfOk: 0, pdfFail: 0, errors: [], pdfErrors: [], running: true, phase: 'send' };
    var go = document.getElementById('wht-go');
    if (go) { go.disabled = true; go.innerHTML = '<span class="spinner"></span> กำลังส่ง…'; }
    whtBulkPaint();

    var queue = ids.slice();
    var pdfQueue = [];

    function runBatch() {
      if (!queue.length) return (WHT_PDF_READY ? runPdf() : finish());
      var batch = queue.splice(0, WHT_BATCH);
      Promise.all(batch.map(function (id) {
        /* ส่งด้วย wht50_id — RPC คืน document_id ที่เพิ่งสร้างมาให้ใช้ต่อ */
        return sbRpcList('njhr_wht50_send', { p_token: sbToken(), p_id: id })
          .then(function (rows) {
            var r0 = (rows && rows[0]) || {};
            var res = r0.result || 'SENT';
            if (res === 'ALREADY_SENT') whtBulk.skip++; else whtBulk.sent++;
            if (r0.document_id) pdfQueue.push(r0.document_id);
          })['catch'](function (ex) {
            whtBulk.fail++;
            whtBulk.errors.push({ id: id, msg: (ex && ex.message) || 'ส่งไม่สำเร็จ' });
          }).then(function () {
            whtBulk.done++;
            whtBulkPaint();
          });
      })).then(function () {
        setTimeout(runBatch, 0);        // คืนคิวให้เบราว์เซอร์วาดหน้าจอ
      });
    }

    /* ---- ขั้นที่ 2: สร้าง Final PDF ของเอกสารที่เพิ่งส่งสำเร็จ ----
       ล้มที่ขั้นนี้ไม่ย้อนสถานะการส่ง เพราะเอกสารส่งไปแล้วจริง */
    function runPdf() {
      if (!pdfQueue.length) return finish();
      whtBulk.phase = 'pdf';
      whtBulk.done = 0; whtBulk.total = pdfQueue.length;
      whtBulkPaint();
      var q2 = pdfQueue.slice();
      (function step() {
        if (!q2.length) return finish();
        var b2 = q2.splice(0, WHT_BATCH);
        Promise.all(b2.map(function (docId) {
          return whtGenerate(docId, null)
            .then(function () { whtBulk.pdfOk++; })
            ['catch'](function (ex) {
              whtBulk.pdfFail++;
              whtBulk.pdfErrors.push({ id: docId, msg: (ex && ex.message) || 'สร้าง PDF ไม่สำเร็จ' });
            }).then(function () { whtBulk.done++; whtBulkPaint(); });
        })).then(function () { setTimeout(step, 0); });
      })();
    }

    function finish() {
      whtBulk.running = false;
      whtBulkPaint();
      if (go) { go.disabled = false; go.innerHTML = icon('send') + ' เริ่มส่ง'; go.hidden = true; }
      whtSel = {};
      whtLoad();                         // ดึงสถานะจริงจากฐานข้อมูลใหม่
    }

    runBatch();
  }

  function whtBulkPaint() {
    var box = document.getElementById('wht-progress');
    if (!box || !whtBulk) return;
    var b = whtBulk;
    var lbl = b.phase === 'pdf' ? 'กำลังสร้าง PDF ' : 'กำลังส่ง ';
    box.innerHTML = b.running
      ? '<div class="wht-prog-l">' + lbl + b.done + ' / ' + b.total + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' +
        Math.round(b.done / Math.max(b.total, 1) * 100) + '%"></div></div>'
      : '<div class="wht-prog-l"><b>ดำเนินการเสร็จแล้ว</b></div>' +
        '<div class="wht-sum">' +
        [['ส่งสำเร็จ', b.sent], ['ข้าม (ส่งแล้ว)', b.skip], ['ส่งผิดพลาด', b.fail],
         ['PDF สำเร็จ', b.pdfOk], ['PDF ผิดพลาด', b.pdfFail]].map(function (x) {
          return '<span class="wht-sum-i"><small>' + x[0] + '</small><b>' + x[1] + '</b></span>';
        }).join('') + '</div>' +
        (b.errors.length
          ? '<div class="form-error">ส่งไม่สำเร็จ\n' +
            b.errors.slice(0, 5).map(function (e) { return esc(e.msg); }).join('\n') +
            (b.errors.length > 5 ? '\n… และอีก ' + (b.errors.length - 5) + ' รายการ' : '') + '</div>' +
            '<button type="button" class="btn btn-ghost" id="wht-retry">' +
            icon('refresh') + ' ส่งใหม่เฉพาะที่ผิดพลาด (' + b.errors.length + ')</button>'
          : '') +
        (b.pdfErrors.length
          ? '<div class="form-error">สร้าง PDF ไม่สำเร็จ (เอกสารส่งถึงพนักงานแล้ว)\n' +
            b.pdfErrors.slice(0, 5).map(function (e) { return esc(e.msg); }).join('\n') +
            (b.pdfErrors.length > 5 ? '\n… และอีก ' + (b.pdfErrors.length - 5) + ' รายการ' : '') + '</div>' +
            '<button type="button" class="btn btn-ghost" id="wht-retry-pdf">' +
            icon('refresh') + ' สร้าง PDF ใหม่เฉพาะที่ผิดพลาด (' + b.pdfErrors.length + ')</button>'
          : '');

    var rt = document.getElementById('wht-retry');
    if (rt) rt.onclick = function () {
      /* ส่งซ้ำเฉพาะที่ผิดพลาด — ที่สำเร็จแล้วไม่ถูกแตะ
         ถ้าส่งไปแล้วจริง RPC จะคืน ALREADY_SENT เองอีกชั้น */
      whtBulkSend(whtBulk.errors.map(function (e) { return e.id; }));
    };
    var rp = document.getElementById('wht-retry-pdf');
    if (rp) rp.onclick = function () {
      /* สร้าง PDF ใหม่อย่างเดียว — ไม่เรียก njhr_wht50_send ซ้ำ */
      var ids = whtBulk.pdfErrors.map(function (e) { return e.id; });
      whtBulk = { total: ids.length, done: 0, sent: 0, skip: 0, fail: 0,
                  pdfOk: 0, pdfFail: 0, errors: [], pdfErrors: [], running: true, phase: 'pdf' };
      whtBulkPaint();
      var q = ids.slice();
      (function step() {
        if (!q.length) { whtBulk.running = false; whtBulkPaint(); whtLoad(); return; }
        var batch = q.splice(0, WHT_BATCH);
        Promise.all(batch.map(function (docId) {
          return whtGenerate(docId, null)
            .then(function () { whtBulk.pdfOk++; })
            ['catch'](function (ex) {
              whtBulk.pdfFail++;
              whtBulk.pdfErrors.push({ id: docId, msg: (ex && ex.message) || 'สร้าง PDF ไม่สำเร็จ' });
            }).then(function () { whtBulk.done++; whtBulkPaint(); });
        })).then(function () { setTimeout(step, 0); });
      })();
    };
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
      '<label class="rptm-f"><span>แผนก</span>' +
      '<select id="wht-dept">' + rptmDeptOptions(s.dept) + '</select></label>' +
      '<label class="rptm-f"><span>สถานะการส่ง</span>' +
      '<select id="wht-send">' +
      [['', 'ทั้งหมด'], ['NOT_SENT', 'ยังไม่ส่ง'], ['SENT', 'ส่งแล้ว'], ['OPENED', 'เปิดแล้ว']]
        .map(function (x) {
          return '<option value="' + x[0] + '"' + (s.send === x[0] ? ' selected' : '') + '>' + x[1] + '</option>';
        }).join('') + '</select></label>' +
      '<button type="button" class="btn btn-ghost" id="wht-clear">ล้างตัวกรอง</button>' +
      '<span class="grow"></span>' +
      '<button type="button" class="btn btn-primary" id="wht-sendall"' +
      (WHT_PDF_READY ? '' : ' disabled title="' + WHT_BLOCK_MSG + '"') + '>' +
      icon('send') + ' ส่งทั้งหมด</button></div>' +
      (WHT_PDF_READY ? '' :
        '<div class="ot-warn wht-block">' + icon('info', 'ic-sm') + ' ' + esc(WHT_BLOCK_MSG) + '</div>') +
      '<div class="wht-selbar" id="wht-selbar" hidden></div>' +
      '<div id="wht-sum" class="wht-sum"></div>' +
      '<div class="card p0 rptm-wrap" id="wht-table"></div>' +
      '<div class="form-error" id="wht-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('wht-year').onchange = function () {
      s.year = parseInt(this.value, 10); whtLoad();
    };
    document.getElementById('wht-dept').onchange = function () { s.dept = this.value; whtLoad(); };
    document.getElementById('wht-send').onchange = function () { s.send = this.value; whtLoad(); };
    var qEl = document.getElementById('wht-q');
    qEl.oninput = debounce(function () { s.q = qEl.value; whtLoad(); }, 350);
    document.getElementById('wht-sendall').onclick = function () {
      var ready = whtPickable().map(function (r) { return r.wht50_id; });
      whtConfirmSend(ready, 'ทั้งหมด');
    };
    document.getElementById('wht-clear').onclick = function () {
      s.year = Number(String(todayISO()).slice(0, 4)); s.q = ''; s.send = ''; s.dept = '';
      viewRptWht50(el); whtLoad();
    };

    whtLoadDepts();
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
        p_q: s.q || null, p_send_status: s.send || null, p_dept: s.dept || null
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
      '<th class="wht-ck"><input type="checkbox" id="wht-all" aria-label="เลือกทั้งหมด"></th>' +
      '<th>รหัสพนักงาน</th><th>ชื่อพนักงาน</th><th>แผนก</th>' +
      '<th class="wht-num">รายได้รวม</th><th class="wht-num">ภาษีหัก ณ ที่จ่าย</th>' +
      '<th>สถานะเอกสาร</th><th>สถานะการส่ง</th><th>จัดการ</th>' +
      '</tr></thead><tbody>' +
      s.rows.map(function (r) {
        /* เลือกได้เฉพาะรายการที่พร้อมส่งจริง (is_ready จาก RPC)
           รายการที่ส่งแล้ว/ยังไม่มีเอกสาร/ข้อมูลไม่ครบ จะกดเลือกไม่ได้ */
        var canPick = !!r.is_ready;
        return '<tr' + (canPick ? '' : ' class="wht-nopick"') + '>' +
          /* เก็บ wht50_id สำหรับส่ง — ไม่ใช่ document_id */
          '<td class="wht-ck"><input type="checkbox" data-wht-pick="' + esc(r.wht50_id || '') + '"' +
          (canPick ? '' : ' disabled') + (whtSel[r.wht50_id] ? ' checked' : '') +
          ' aria-label="เลือก ' + esc(r.emp_code || '') + '"></td>' +
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
          whtActions(r).join('') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';

    whtBind();
    whtSelBar();
  }

  /* ผูก Event ของ Checkbox และปุ่มจัดการหลังวาดตารางทุกครั้ง */
  function whtBind() {
    var all = document.getElementById('wht-all');
    if (all) {
      var pick = whtPickable();
      all.checked = pick.length > 0 && pick.every(function (r) { return whtSel[r.wht50_id]; });
      all.disabled = pick.length === 0;
      all.onchange = function () {
        var on = this.checked;
        pick.forEach(function (r) {
          if (on) whtSel[r.wht50_id] = true; else delete whtSel[r.wht50_id];
        });
        whtPaint();
      };
    }
    document.querySelectorAll('[data-wht-pick]').forEach(function (b) {
      b.onchange = function () {
        var id = b.dataset.whtPick;
        if (this.checked) whtSel[id] = true; else delete whtSel[id];
        whtSelBar();
        var a2 = document.getElementById('wht-all');
        if (a2) {
          var pk = whtPickable();
          a2.checked = pk.length > 0 && pk.every(function (r) { return whtSel[r.wht50_id]; });
        }
      };
    });
    document.querySelectorAll('[data-wht-view]').forEach(function (b) {
      b.onclick = function () { whtPreview(b.dataset.whtView); };          // wht50_id
    });
    document.querySelectorAll('[data-wht-dl]').forEach(function (b) {
      b.onclick = function () { whtDownload(b.dataset.whtDl, b); };        // document_id
    });
    document.querySelectorAll('[data-wht-send]').forEach(function (b) {
      b.onclick = function () { whtConfirmSend([b.dataset.whtSend], 'รายคน'); };  // wht50_id
    });
    document.querySelectorAll('[data-wht-draft]').forEach(function (b) {
      b.onclick = function () { whtDraft(b.dataset.whtDraft, b); };        // employee_id
    });
    document.querySelectorAll('[data-wht-confirm]').forEach(function (b) {
      b.onclick = function () { whtConfirmDoc(b.dataset.whtConfirm, b); }; // wht50_id
    });
    document.querySelectorAll('[data-wht-edit]').forEach(function (b) {
      b.onclick = function () { whtEdit(b.dataset.whtEdit); };             // wht50_id
    });
  }

  /* ---------- สร้างร่าง / ยืนยัน / แก้ไข ----------
     ใช้ RPC เดิมของ 87_wht50.sql ทั้งหมด ไม่สร้างตัวใหม่ */
  /* ============================================================
     CANONICAL WHT50 MODEL CONTRACT (ฝั่งเบราว์เซอร์)
     ------------------------------------------------------------
     ต้องได้ค่าตรงกับ buildWht50Model() ใน
     edge-functions/njhr-doc-pdf/wht50.ts ทุกช่อง
     เบราว์เซอร์กับ Edge Function รันคนละ Runtime จึงแชร์ไฟล์กันไม่ได้
     แต่ชื่อช่องและวิธีคำนวณต้องเหมือนกัน
     harness/wht50_test.js ใช้ Fixture ชุดเดียวเทียบสองฝั่งทีละช่อง
     ============================================================ */
  var WHT_FORMS = [
    ['PND1A', 'ภ.ง.ด.1ก'], ['PND1A_SPECIAL', 'ภ.ง.ด.1ก พิเศษ'], ['PND2', 'ภ.ง.ด.2'],
    ['PND3', 'ภ.ง.ด.3'], ['PND2A', 'ภ.ง.ด.2ก'], ['PND3A', 'ภ.ง.ด.3ก'], ['PND53', 'ภ.ง.ด.53']
  ];
  var WHT_ROWS = [
    ['40(1)', ['40_1', '40.1', '1'], '1.', 'เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)'],
    ['40(2)', ['40_2', '40.2', '2'], '2.', 'ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)'],
    ['40(3)', ['40_3', '40.3', '3'], '3.', 'ค่าแห่งลิขสิทธิ์ หรือสิทธิอย่างอื่น ฯลฯ ตามมาตรา 40 (3)'],
    ['40(4)', ['40_4', '40.4', '4'], '4.', '(ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)'],
    ['3TRES', ['3เตรส', '5'], '5.', 'การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส'],
    ['OTHER', ['อื่น', '6'], '6.', 'เงินได้นอกจาก 1. – 5.']
  ];
  /* วิธีออกภาษี — ค่าเดียวกับ njhr_wht50.tax_payment_mode */
  var WHT_PAYMODES = [
    ['WITHHOLD', 'หัก ณ ที่จ่าย'], ['PAID_CONTINUOUS', 'ออกให้ตลอดไป'],
    ['PAID_ONCE', 'ออกให้ครั้งเดียว'], ['OTHER', 'อื่น ๆ']
  ];
  var WHT_COPY_LABELS = [
    'ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่ายใช้แนบพร้อมกับแบบแสดงรายการ)',
    'ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่ายเก็บไว้เป็นหลักฐาน)'
  ];

  function whtSection(v) {
    var raw = String(v == null ? '' : v).replace(/\s/g, '').toUpperCase();
    if (!raw) return '';
    for (var i = 0; i < WHT_ROWS.length; i++) {
      if (raw === WHT_ROWS[i][0].toUpperCase()) return WHT_ROWS[i][0];
      for (var j = 0; j < WHT_ROWS[i][1].length; j++) {
        if (raw === String(WHT_ROWS[i][1][j]).toUpperCase()) return WHT_ROWS[i][0];
      }
    }
    return '';
  }

  function whtNum(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }

  function whtBeDate(v) {
    var t = String(v == null ? '' : v).slice(0, 10);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    return m ? (m[3] + '/' + m[2] + '/' + (Number(m[1]) + 543)) : '';
  }

  /* payer: company_name · company_address · company_tax_id
     payee: prefix + first_name + last_name · national_id · address */
  function normalizeWht50Snapshot(d) {
    var p = d.payer_snapshot || {}, e = d.payee_snapshot || {};
    var built = [e.prefix, e.first_name, e.last_name]
      .map(function (x) { return String(x == null ? '' : x).trim(); })
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    return {
      payer: {
        name: String(p.company_name || p.name || '').trim(),
        address: String(p.company_address || p.address || '').trim(),
        taxid: String(p.company_tax_id || p.tax_id || '').trim()
      },
      payee: {
        name: built || String(e.name || '').trim(),
        address: String(e.address || '').trim(),
        taxid: String(e.national_id || e.tax_id || '').trim()
      }
    };
  }

  /* จำนวนเงินเป็นตัวอักษรไทย — ตรรกะเดียวกับ bahtText() ใน wht50.ts */
  var TH_NUM = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  var TH_POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  function whtIntThai(n) {
    if (n === 0) return TH_NUM[0];
    if (n >= 1000000) {
      var high = Math.floor(n / 1000000), rest = n % 1000000;
      return whtIntThai(high) + 'ล้าน' + (rest ? whtIntThai(rest) : '');
    }
    var str = String(n), out = '';
    for (var i = 0; i < str.length; i++) {
      var dg = Number(str[i]), pos = str.length - i - 1;
      if (dg === 0) continue;
      if (pos === 0 && dg === 1 && str.length > 1) out += 'เอ็ด';
      else if (pos === 1 && dg === 1) out += 'สิบ';
      else if (pos === 1 && dg === 2) out += 'ยี่สิบ';
      else out += TH_NUM[dg] + TH_POS[pos];
    }
    return out;
  }
  function whtBahtText(v) {
    if (v === null || v === undefined) return '';
    var neg = v < 0, abs = Math.abs(Math.round(v * 100) / 100);
    var baht = Math.floor(abs), satang = Math.round((abs - baht) * 100), out = '';
    if (baht === 0 && satang === 0) out = 'ศูนย์บาทถ้วน';
    else {
      if (baht > 0) out += whtIntThai(baht) + 'บาท';
      if (satang > 0) out += whtIntThai(satang) + 'สตางค์'; else out += 'ถ้วน';
    }
    return (neg ? 'ลบ' : '') + out;
  }

  function whtModel(d) {
    var missing = [];
    var np = normalizeWht50Snapshot(d);
    if (!np.payer.name) missing.push('ชื่อผู้มีหน้าที่หักภาษี ณ ที่จ่าย (payer_snapshot.company_name)');
    if (!np.payer.taxid) missing.push('เลขประจำตัวผู้เสียภาษีอากรของบริษัท (payer_snapshot.company_tax_id)');
    if (!np.payee.name) missing.push('ชื่อผู้ถูกหักภาษี ณ ที่จ่าย (payee_snapshot.prefix/first_name/last_name)');
    if (!np.payee.taxid) missing.push('เลขประจำตัวประชาชนของผู้ถูกหักภาษี (payee_snapshot.national_id)');

    var ft = String(d.form_type || '').trim().toUpperCase();
    if (!ft) missing.push('ประเภทแบบยื่นรายการ (form_type)');
    else if (!WHT_FORMS.some(function (f) { return f[0] === ft; })) {
      missing.push('form_type ไม่รู้จัก: ' + ft);
    }

    var sec = whtSection(d.income_section);
    var totalIncome = whtNum(d.total_income), totalTax = whtNum(d.total_tax);
    var byKey = {};
    var fin = d.income_final;
    var arr = Object.prototype.toString.call(fin) === '[object Array]' ? fin
      : (fin && Object.prototype.toString.call(fin.items) === '[object Array]' ? fin.items : null);
    if (arr && arr.length) {
      arr.forEach(function (it) {
        var k = whtSection(it.section || it.key) || sec;
        if (!k) return;
        var prev = byKey[k] || { paid_on: '', amount: 0, tax: 0 };
        byKey[k] = {
          paid_on: String(it.paid_on || it.period || prev.paid_on || ''),
          amount: (whtNum(it.amount) || 0) + (prev.amount || 0),
          tax: (whtNum(it.tax) || 0) + (prev.tax || 0)
        };
      });
    } else if (sec) {
      byKey[sec] = {
        paid_on: d.tax_year ? ('ปีภาษี ' + (Number(d.tax_year) + 543)) : '',
        amount: totalIncome, tax: totalTax
      };
    } else {
      missing.push('ประเภทเงินได้ที่รู้จัก (income_section / income_final)');
    }

    var pmode = String(d.tax_payment_mode || '').trim().toUpperCase();
    var pmodeOther = String(d.tax_payment_mode_other || '').trim();
    if (!pmode) missing.push('วิธีออกภาษี (tax_payment_mode)');
    else if (!WHT_PAYMODES.some(function (x) { return x[0] === pmode; })) {
      missing.push('วิธีออกภาษีไม่รู้จัก: ' + pmode);
    } else if (pmode === 'OTHER' && !pmodeOther) {
      missing.push('รายละเอียดวิธีออกภาษี (tax_payment_mode_other)');
    }

    var signerName = String(d.signer_name || '').trim();
    if (!signerName) missing.push('ชื่อผู้ลงนาม');
    var issue = whtBeDate(d.issue_date);
    if (!issue) missing.push('วันที่ออกหนังสือรับรองฯ');

    return {
      taxYear: d.tax_year == null ? null : Number(d.tax_year),
      docNo: String(d.doc_no || ''),
      bookNo: String(d.book_no || ''),
      seqNo: String(d.seq_no == null ? '' : d.seq_no),
      copyLabels: WHT_COPY_LABELS.slice(),
      title: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย',
      subtitle: 'ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร',
      payer: np.payer, payee: np.payee,
      formType: WHT_FORMS.map(function (f) {
        return { code: f[0], label: f[1], checked: f[0] === ft };
      }),
      incomeRows: WHT_ROWS.map(function (r) {
        var v = byKey[r[0]];
        return { key: r[0], no: r[2], label: r[3],
          paid_on: v ? v.paid_on : '',
          amount: v ? v.amount : null, tax: v ? v.tax : null };
      }),
      totalIncome: totalIncome, totalTax: totalTax,
      taxWords: whtBahtText(totalTax),
      totalGpf: null,
      totalSso: whtNum(d.total_sso), totalPvd: whtNum(d.total_pvd),
      paymentMode: WHT_PAYMODES.map(function (x) {
        return { code: x[0], label: x[1], checked: x[0] === pmode };
      }),
      paymentModeOther: pmodeOther,
      certifyText: 'ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ',
      signer: { name: signerName, position: String(d.signer_position || '') },
      issueDate: issue,
      amendSeq: Number(d.amend_seq || 0),
      missing: missing
    };
  }

  /* ---------- สร้างร่าง ----------
     Signature จริง (87_wht50.sql:271)
       njhr_wht50_draft(p_token, p_year, p_employees uuid[], p_form_type, p_income_section)
     p_employees เป็น array เสมอ · คืน table (employee_id, doc_id, ok, message) */
  function whtDraft(employeeId, btn) {
    if (!employeeId) return;
    if (btn) btn.disabled = true;
    sbRpcList('njhr_wht50_draft', {
      p_token: sbToken(), p_year: whtState.year,
      p_employees: [employeeId], p_form_type: 'PND1A', p_income_section: '40(1)'
    }).then(function (rows) {
      var r0 = (rows && rows[0]) || {};
      if (r0.ok === false) {
        toastDismiss('สร้างร่างไม่สำเร็จ', r0.message || 'ไม่ทราบสาเหตุ', 'error');
        if (btn) btn.disabled = false;
        return;
      }
      toast(r0.message || 'สร้างร่างเอกสาร 50 ทวิ แล้ว');
      whtLoad();
    })['catch'](function (ex) {
      toastDismiss('สร้างร่างไม่สำเร็จ', (ex && ex.message) || 'กรุณาลองใหม่อีกครั้ง', 'error');
      if (btn) btn.disabled = false;
    });
  }

  /* ---------- ยืนยันเอกสาร ----------
     แบบฟอร์มบังคับให้ระบุวิธีออกภาษี จึงต้องมีค่าก่อนจึงยืนยันได้
     Trigger ฝั่งฐานข้อมูลตรวจซ้ำอีกชั้น (90_wht50_pdf.sql) กันการยิงตรง */
  function whtConfirmDoc(wht50Id, btn) {
    if (!wht50Id) return;
    sbRpcList('njhr_wht50_get', { p_token: sbToken(), p_id: wht50Id }).then(function (rows) {
      var d = ((rows && rows[0]) || {}).data || {};
      var md = String(d.tax_payment_mode || '').trim();
      if (!md) {
        toastDismiss('ยืนยันไม่ได้', 'กรุณาระบุวิธีออกภาษีก่อนยืนยันเอกสาร', 'error');
        return;
      }
      if (md === 'OTHER' && !String(d.tax_payment_mode_other || '').trim()) {
        toastDismiss('ยืนยันไม่ได้', 'เลือก "อื่น ๆ" ต้องระบุรายละเอียดวิธีออกภาษี', 'error');
        return;
      }
      whtConfirmAsk(wht50Id, btn);
    })['catch'](function (ex) {
      toastDismiss('ตรวจข้อมูลไม่สำเร็จ', (ex && ex.message) || 'กรุณาลองใหม่', 'error');
    });
  }

  function whtConfirmAsk(wht50Id, btn) {
    confirmDialog('ยืนยันเอกสาร 50 ทวิ',
      'เมื่อยืนยันแล้วระบบจะออกเลขที่เอกสาร และแก้ไขยอดไม่ได้อีก ต้องการดำเนินการหรือไม่',
      'ยืนยันเอกสาร', function () {
        if (btn) btn.disabled = true;
        sbRpcList('njhr_wht50_confirm', { p_token: sbToken(), p_id: wht50Id })
          .then(function (rows) {
            var r0 = (rows && rows[0]) || {};
            toast('ยืนยันเอกสารแล้ว' + (r0.doc_no ? ' เลขที่ ' + r0.doc_no : ''));
            whtLoad();
          })['catch'](function (ex) {
            toastDismiss('ยืนยันไม่สำเร็จ', (ex && ex.message) || 'กรุณาลองใหม่อีกครั้ง', 'error');
            if (btn) btn.disabled = false;
          });
      });
  }

  /* ---------- แก้ไขเอกสารร่าง ----------
     njhr_wht50_update(p_token, p_id, p_patch jsonb, p_reason)
     ส่งเฉพาะ key ที่ RPC รับจริง */
  function whtEdit(wht50Id) {
    if (!wht50Id) return;
    sbRpcList('njhr_wht50_get', { p_token: sbToken(), p_id: wht50Id }).then(function (rows) {
      var d = ((rows && rows[0]) || {}).data || {};
      openModal('แก้ไขเอกสาร 50 ทวิ',
        '<div class="form-2col">' +
        '<label class="field"><span>ประเภทแบบยื่นรายการ</span>' +
        '<select name="form_type">' + WHT_FORMS.map(function (f) {
          return '<option value="' + f[0] + '"' +
            (String(d.form_type || '') === f[0] ? ' selected' : '') + '>' + esc(f[1]) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field"><span>ประเภทเงินได้</span>' +
        '<select name="income_section">' + WHT_ROWS.map(function (r) {
          return '<option value="' + r[0] + '"' +
            (String(d.income_section || '') === r[0] ? ' selected' : '') + '>' +
            r[2] + ' ' + esc(r[3].slice(0, 40)) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field"><span>เล่มที่</span>' +
        '<input name="book_no" value="' + esc(d.book_no || '') + '"></label>' +
        '<label class="field"><span>ลำดับที่ในแบบ</span>' +
        '<input name="seq_no" type="number" min="1" value="' +
        esc(d.seq_no == null ? '' : d.seq_no) + '"></label>' +
        '<label class="field"><span>วันที่ออกหนังสือรับรองฯ</span>' +
        '<input name="issue_date" type="date" value="' +
        esc(String(d.issue_date || '').slice(0, 10)) + '"></label>' +
        '<label class="field"><span>ชื่อผู้ลงนาม</span>' +
        '<input name="signer_name" value="' + esc(d.signer_name || '') + '"></label>' +
        '<label class="field"><span>ตำแหน่งผู้ลงนาม</span>' +
        '<input name="signer_position" value="' + esc(d.signer_position || '') + '"></label>' +
        '<label class="field"><span>วิธีออกภาษี <i class="req">*</i></span>' +
        '<select name="tax_payment_mode" id="wht-ed-mode">' +
        '<option value="">— เลือก —</option>' + WHT_PAYMODES.map(function (x) {
          return '<option value="' + x[0] + '"' +
            (String(d.tax_payment_mode || '') === x[0] ? ' selected' : '') + '>' +
            esc(x[1]) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field" id="wht-ed-other-wrap"' +
        (String(d.tax_payment_mode || '') === 'OTHER' ? '' : ' hidden') + '>' +
        '<span>ระบุวิธีออกภาษี <i class="req">*</i></span>' +
        '<input name="tax_payment_mode_other" value="' +
        esc(d.tax_payment_mode_other || '') + '"></label>' +
        '<label class="field"><span>หมายเหตุ</span>' +
        '<input name="note" value="' + esc(d.note || '') + '"></label>' +
        '</div>' +
        '<label class="field"><span>เหตุผลการแก้ไข</span>' +
        '<input id="wht-ed-reason" placeholder="ระบุเหตุผลเพื่อบันทึกในประวัติ"></label>' +
        '<div class="form-error" id="wht-ed-err"></div>',
        '<button type="button" class="btn btn-ghost" id="wht-ed-cancel">ยกเลิก</button>' +
        '<button type="button" class="btn btn-primary" id="wht-ed-save">บันทึก</button>');

      document.getElementById('wht-ed-cancel').onclick = closeModal;
      document.getElementById('wht-ed-mode').onchange = function () {
        var w = document.getElementById('wht-ed-other-wrap');
        if (w) w.hidden = this.value !== 'OTHER';
      };
      document.getElementById('wht-ed-save').onclick = function () {
        var sbtn = this, errEl = document.getElementById('wht-ed-err');
        var patch = {};
        ['form_type', 'income_section', 'book_no', 'seq_no', 'issue_date',
         'signer_name', 'signer_position', 'note',
         'tax_payment_mode', 'tax_payment_mode_other'].forEach(function (k) {
          var el = document.querySelector('#modal-root [name="' + k + '"]');
          if (el && String(el.value).trim() !== '') patch[k] = String(el.value).trim();
        });
        if (patch.tax_payment_mode === 'OTHER' && !patch.tax_payment_mode_other) {
          if (errEl) errEl.textContent = 'เลือก "อื่น ๆ" ต้องระบุรายละเอียดวิธีออกภาษี';
          return;
        }
        var reason = (document.getElementById('wht-ed-reason') || {}).value || '';
        sbtn.disabled = true;
        sbRpcList('njhr_wht50_update', {
          p_token: sbToken(), p_id: wht50Id, p_patch: patch, p_reason: reason || null
        }).then(function () {
          closeModal(); toast('บันทึกการแก้ไขแล้ว'); whtLoad();
        })['catch'](function (ex) {
          if (errEl) errEl.textContent = (ex && ex.message) || 'บันทึกไม่สำเร็จ';
          sbtn.disabled = false;
        });
      };
    })['catch'](function (ex) {
      toastDismiss('เปิดเอกสารไม่สำเร็จ', (ex && ex.message) || 'กรุณาลองใหม่', 'error');
    });
  }

  /* ---------- สถานะ Final PDF ----------
     njhr_wht50_send_list ไม่ได้คืน final_pdf_status จึงห้ามอ่านจากแถวในตาราง
     ต้องถามจาก njhr_doc_pdf_status(p_token, document_id) ซึ่งคืน table(data jsonb)
     รูปแบบเดียวกับ njhr_wht50_get จึงใช้ sbRpcList แล้วอ่าน rows[0].data ตาม Pattern เดิม
     คืน null เมื่อยังไม่มี document_id (ยังไม่ได้ส่ง) — ผู้เรียกต้องรับมือกรณีนี้ */
  function whtPdfStatus(documentId) {
    if (!documentId) return Promise.resolve(null);
    return sbRpcList('njhr_doc_pdf_status', { p_token: sbToken(), p_id: documentId })
      .then(function (rows) { return ((rows && rows[0]) || {}).data || null; });
  }

  /* ข้อความสถานะที่ผู้ดูแลเห็น — ตรงกับค่าจริงใน constraint (PENDING/READY/FAILED) */
  function whtPdfStatusTxt(st) {
    if (!st) return 'ยังไม่ได้ส่ง จึงยังไม่มีไฟล์';
    var v = st.final_pdf_status || null;
    if (v === 'READY') return 'ไฟล์พร้อมแล้ว';
    if (v === 'FAILED') return 'สร้างไฟล์ไม่สำเร็จ' +
      (st.final_pdf_error ? ' — ' + st.final_pdf_error : '');
    if (v === 'PENDING') return 'กำลังสร้างไฟล์';
    return 'ยังไม่ได้สร้างไฟล์';
  }

  /* ---------- สร้าง Final PDF ----------
     ผ่าน Edge Function เท่านั้น เพราะ claim/commit ต้องใช้ service_role */
  function whtGenerate(documentId, btn) {
    if (!documentId) return Promise.reject(new Error('ยังไม่มีเอกสาร'));
    if (btn) btn.disabled = true;
    return sbDocPdfFn({ action: 'generate', document_id: documentId })
      .then(function (d) { if (btn) btn.disabled = false; return d; })
      ['catch'](function (ex) { if (btn) btn.disabled = false; throw ex; });
  }

  /* ---------- ตัวอย่างเอกสาร (ฝั่งผู้ดูแล) ----------
     ใช้ Model กลางชุดเดียวกับ Renderer PDF
     ผู้ดูแลเปิดดูที่นี่ไม่เรียก njhr_doc_view — สถานะจึงไม่กลายเป็น OPENED */
  function whtPreview(wht50Id) {
    if (!wht50Id) return;
    var r = (whtState.rows || []).filter(function (x) { return x.wht50_id === wht50Id; })[0] || {};
    /* ห้ามเดาสถานะไฟล์จากแถวในตาราง — njhr_wht50_send_list ไม่ได้คืน final_pdf_status
       เปิดหน้าต่างด้วยโหมด "ตัวอย่างก่อนสร้าง Final PDF" ไปก่อน
       แล้วถาม njhr_doc_pdf_status ทีหลัง ถ้าไฟล์พร้อมจริงจึงเพิ่มปุ่มดูไฟล์จริงให้ */
    openModal('ดูตัวอย่าง 50 ทวิ',
      '<div class="ot-req-info">' +
      [['เลขที่เอกสาร', r.doc_no || '—'], ['ปีภาษี', (whtState.year + 543)],
       ['ผู้ถูกหักภาษี', r.full_name || '—'], ['รหัสพนักงาน', r.emp_code || '—'],
       ['แผนก', r.department_name || '—']].map(function (x) {
        return '<div><small>' + esc(x[0]) + '</small><b>' + esc(String(x[1])) + '</b></div>';
      }).join('') + '</div>' +
      '<div class="wht-prev-tabs" id="wht-pv-tabs" hidden></div>' +
      '<div class="ot-warn wht-pv-note" id="wht-pv-note">' + icon('info', 'ic-sm') +
      ' ตัวอย่างก่อนสร้าง Final PDF — ยังไม่ใช่ไฟล์ที่ส่งให้พนักงาน</div>' +
      '<div class="wht-prev" id="wht-prev">' +
      '<div class="muted" style="padding:18px">กำลังโหลดข้อมูลเอกสาร…</div></div>' +
      '<div class="form-error" id="wht-pv-err"></div>',
      '<button type="button" class="btn btn-ghost" id="wht-pv-close">ปิด</button>' +
      '<button type="button" class="btn btn-primary" id="wht-pv-dl" disabled ' +
      'title="กำลังตรวจสถานะไฟล์">' + icon('download') + ' ดาวน์โหลด</button>');
    document.getElementById('wht-pv-close').onclick = closeModal;
    var dlb = document.getElementById('wht-pv-dl');
    if (dlb) dlb.onclick = function () { whtDownload(r.document_id, dlb); };

    whtPreviewLoad(wht50Id);

    /* ถามสถานะไฟล์จริงจาก RPC แล้วค่อยเปิดปุ่มตามผลที่ได้ */
    whtPdfStatus(r.document_id).then(function (st) {
      var note = document.getElementById('wht-pv-note');
      var tabs = document.getElementById('wht-pv-tabs');
      var ready = !!(st && st.final_pdf_status === 'READY' && st.can_download);

      if (note) {
        note.innerHTML = icon('info', 'ic-sm') + ' ' +
          (ready ? 'ไฟล์ Final PDF พร้อมแล้ว — กดปุ่มด้านล่างเพื่อดูไฟล์จริง'
                 : 'ตัวอย่างก่อนสร้าง Final PDF — ' + esc(whtPdfStatusTxt(st)));
      }
      if (dlb) {
        if (ready && WHT_PDF_READY) { dlb.disabled = false; dlb.title = ''; }
        else {
          dlb.disabled = true;
          dlb.title = ready ? WHT_BLOCK_MSG : 'PDF ยังไม่พร้อมดาวน์โหลด';
        }
      }
      if (ready && tabs) {
        tabs.hidden = false;
        tabs.innerHTML =
          '<button type="button" class="btn btn-ghost btn-sm" id="wht-pv-model">ดูจากข้อมูล</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="wht-pv-file">ดูไฟล์ PDF จริง</button>';
        document.getElementById('wht-pv-model').onclick = function () {
          if (note) note.hidden = false;
          whtPreviewLoad(wht50Id);
        };
        document.getElementById('wht-pv-file').onclick = function () {
          var box = document.getElementById('wht-prev');
          if (note) note.hidden = true;
          box.innerHTML = '<div class="muted" style="padding:18px">กำลังเปิดไฟล์…</div>';
          sbDocPdfFn({ action: 'download', document_id: r.document_id }).then(function (x) {
            if (!x || !x.url) throw new Error('เปิดไฟล์ไม่สำเร็จ');
            box.innerHTML = '<iframe class="wht50-emp-pdf" src="' + esc(x.url) + '" title="50 ทวิ"></iframe>';
          })['catch'](function (ex) {
            box.innerHTML = '<div class="ot-warn">' + esc((ex && ex.message) || 'เปิดไฟล์ไม่สำเร็จ') + '</div>';
          });
        };
      }
    })['catch'](function (ex) {
      var note = document.getElementById('wht-pv-note');
      if (note) {
        note.innerHTML = icon('info', 'ic-sm') + ' ตัวอย่างก่อนสร้าง Final PDF — ' +
          'ตรวจสถานะไฟล์ไม่สำเร็จ: ' + esc((ex && ex.message) || 'ไม่ทราบสาเหตุ');
      }
    });
  }

  function whtPreviewLoad(wht50Id) {
    var box = document.getElementById('wht-prev');
    if (box) box.innerHTML = '<div class="muted" style="padding:18px">กำลังโหลดข้อมูลเอกสาร…</div>';
    sbRpcList('njhr_wht50_get', { p_token: sbToken(), p_id: wht50Id }).then(function (rows) {
      var d = ((rows && rows[0]) || {}).data || {};
      var b = document.getElementById('wht-prev');
      if (b) b.innerHTML = whtPreviewHtml(whtModel(d));
    })['catch'](function (ex) {
      var e = document.getElementById('wht-pv-err');
      if (e) e.textContent = (ex && ex.message) || 'โหลดข้อมูลเอกสารไม่สำเร็จ';
    });
  }

  function whtM(v) {
    return v === null || v === undefined ? '' :
      Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ตัวอย่างเอกสาร — องค์ประกอบครบเท่าที่ Renderer วาดลง PDF */
  function whtPreviewHtml(m) {
    return '<div class="wht-form">' +
      '<div class="wht-f-copies">' + m.copyLabels.map(function (c) {
        return '<div>' + esc(c) + '</div>';
      }).join('') + '</div>' +
      '<div class="wht-f-head"><b>' + esc(m.title) + '</b>' +
      '<small>' + esc(m.subtitle) + '</small>' +
      '<small>เล่มที่ ' + esc(m.bookNo || '—') + ' · เลขที่ ' + esc(m.docNo || '—') +
      (m.amendSeq > 0 ? ' · (ฉบับแก้ไขครั้งที่ ' + m.amendSeq + ')' : '') + '</small></div>' +
      '<div class="wht-f-party"><b>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</b>' +
      '<div>ชื่อ: ' + esc(m.payer.name || '—') + '</div>' +
      '<div>ที่อยู่: ' + esc(m.payer.address || '—') + '</div>' +
      '<div>เลขประจำตัวผู้เสียภาษีอากร: ' + esc(m.payer.taxid || '—') + '</div></div>' +
      '<div class="wht-f-party"><b>ผู้ถูกหักภาษี ณ ที่จ่าย</b>' +
      '<div>ชื่อ: ' + esc(m.payee.name || '—') + '</div>' +
      '<div>ที่อยู่: ' + esc(m.payee.address || '—') + '</div>' +
      '<div>เลขประจำตัวประชาชน: ' + esc(m.payee.taxid || '—') + '</div>' +
      '<div>ลำดับที่ในแบบ: ' + esc(m.seqNo || '—') + '</div></div>' +
      '<div class="wht-f-forms">' + m.formType.map(function (f) {
        return '<span class="wht-f-ck' + (f.checked ? ' on' : '') + '">' +
          (f.checked ? '☑' : '☐') + ' ' + esc(f.label) + '</span>';
      }).join('') + '</div>' +
      '<table class="wht-f-tb"><thead><tr>' +
      '<th>ประเภทเงินได้พึงประเมินที่จ่าย</th><th>วัน เดือน หรือปีภาษีที่จ่าย</th>' +
      '<th>จำนวนเงินที่จ่าย</th><th>ภาษีที่หักและนำส่งไว้</th></tr></thead><tbody>' +
      m.incomeRows.map(function (l) {
        return '<tr><td>' + l.no + ' ' + esc(l.label) + '</td><td>' + esc(l.paid_on) + '</td>' +
          '<td class="wht-num">' + whtM(l.amount) + '</td>' +
          '<td class="wht-num">' + whtM(l.tax) + '</td></tr>';
      }).join('') +
      '<tr class="wht-f-sum"><td><b>รวมเงินที่จ่ายและภาษีที่หักนำส่ง</b></td><td></td>' +
      '<td class="wht-num"><b>' + whtM(m.totalIncome) + '</b></td>' +
      '<td class="wht-num"><b>' + whtM(m.totalTax) + '</b></td></tr>' +
      '<tr><td colspan="2">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)</td>' +
      '<td colspan="2"><b>' + esc(m.taxWords || '—') + '</b></td></tr>' +
      '</tbody></table>' +
      '<div class="wht-f-fund">เงินที่จ่ายเข้า · ' +
      'กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน ' + (whtM(m.totalGpf) || '—') +
      ' · กองทุนประกันสังคม ' + (whtM(m.totalSso) || '—') +
      ' · กองทุนสำรองเลี้ยงชีพ ' + (whtM(m.totalPvd) || '—') + '</div>' +
      '<div class="wht-f-fund">ผู้จ่ายเงิน · ' + m.paymentMode.map(function (p, i) {
        return '<span class="wht-f-ck' + (p.checked ? ' on' : '') + '">' +
          (p.checked ? '☑' : '☐') + ' (' + (i + 1) + ') ' + esc(p.label) + '</span>';
      }).join(' ') + (m.paymentModeOther ? ' — ' + esc(m.paymentModeOther) : '') + '</div>' +
      '<div class="wht-f-sign">' + esc(m.certifyText) +
      '<div>ลงชื่อ ' + esc(m.signer.name || '—') + ' ผู้จ่ายเงิน</div>' +
      (m.signer.position ? '<div>' + esc(m.signer.position) + '</div>' : '') +
      '<div>วัน เดือน ปี ที่ออกหนังสือรับรองฯ ' + esc(m.issueDate || '—') + '</div></div>' +
      '<div class="wht-f-seal">ประทับตรานิติบุคคล (ถ้ามี)</div>' +
      (m.missing.length
        ? '<div class="form-error">ข้อมูลยังไม่ครบ ' + m.missing.length + ' รายการ — ' +
          esc(m.missing.join(' · ')) + '</div>'
        : '') +
      '</div>';
  }

  /* ---------- ดาวน์โหลด Final PDF ----------
     ต้องผ่าน Edge Function (action = download) เท่านั้น
     njhr_doc_pdf_access ถูก revoke จาก anon/authenticated และคืน storage_path ไม่ใช่ URL */
  function whtDownload(documentId, btn) {
    if (!WHT_PDF_READY) { toast(WHT_BLOCK_MSG, 'info'); return; }
    if (!documentId) {
      toastDismiss('ดาวน์โหลดไม่ได้', 'ยังไม่ได้ส่งเอกสาร จึงยังไม่มีไฟล์', 'error');
      return;
    }
    var r = (whtState.rows || []).filter(function (x) { return x.document_id === documentId; })[0];
    var fname = '50ทวิ_' + (whtState.year + 543) + '_' + ((r && r.emp_code) || 'EMP') + '.pdf';
    if (btn) btn.disabled = true;
    /* ตรวจสถานะจริงก่อนเสมอ — ห้ามยิง Download ทั้งที่ไฟล์ยังไม่พร้อม
       เพราะ Edge จะตอบ error ที่ผู้ใช้อ่านไม่รู้เรื่อง และเสียเวลารอเปล่า */
    whtPdfStatus(documentId).then(function (st) {
      if (!st || st.final_pdf_status !== 'READY' || !st.can_download) {
        var why = (st && st.final_pdf_status === 'FAILED')
          ? ('สร้างไฟล์ไม่สำเร็จ' + (st.final_pdf_error ? ' — ' + st.final_pdf_error : ''))
          : whtPdfStatusTxt(st);
        toastDismiss('PDF ยังไม่พร้อมดาวน์โหลด', why, 'error');
        return null;
      }
      return sbDocPdfFn({ action: 'download', document_id: documentId })
        .then(function (d) {
          if (!d || !d.url) throw new Error('ออกลิงก์ไฟล์ไม่สำเร็จ');
          fileDownload(d.url, d.file_name || fname);
        });
    })['catch'](function (ex) {
      toastDismiss('ดาวน์โหลดไม่สำเร็จ', (ex && ex.message) || 'กรุณาลองใหม่อีกครั้ง', 'error');
    }).then(function () { if (btn) btn.disabled = false; });
  }
