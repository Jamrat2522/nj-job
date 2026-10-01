/* ============================================================
   heavy-cleanup.js — SUPER_ADMIN: 🔄 ตรวจข้อมูลค้าง / 🗑️ ลบข้อมูลเก่า
   Lazy chunk (classic script · shared scope กับ app.js)
   Logic ทั้งหมดอยู่ฝั่ง Server (RPC nj_* ใน sql/RUN-01_nj_flow_cleanup.sql)
   Browser: เรียก RPC → รอผล → อัปเดต UI เท่านั้น
   ============================================================ */
(function () {
  "use strict";
  var NJ = { token: null, exp: 0, preview: null, running: false, lastScan: null };
  var BUCKETS = ["job-attachments", "job-signatures"];

  function _e(v) { return (typeof esc === "function") ? esc(v) : String(v == null ? "" : v); }
  function _n(v) { return Number(v || 0).toLocaleString("th-TH"); }
  function _root() { return document.getElementById("view-root"); }
  function _isSuper() { return String(S.user && S.user.role || "").toUpperCase() === "SUPER_ADMIN"; }
  function _dmy(iso) { if (!iso) return "-"; var p = String(iso).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso; }
  function _msg(e) {
    var m = String(e && (e.message || e.details) || e || "");
    if (/Could not find the function|PGRST202/i.test(m)) return "ยังไม่ได้รัน SQL RUN-01 บนฐานข้อมูล";
    if (/session expired|invalid session|session revoked|session token required/i.test(m)) return "SESSION_EXPIRED";
    if (/SUPER_ADMIN only/i.test(m)) return "เฉพาะ SUPER_ADMIN เท่านั้น";
    if (/invalid credentials/i.test(m)) return "รหัสผ่านไม่ถูกต้อง";
    if (/NJ_DATE_MUST_BE_BEFORE_TODAY/.test(m)) return "วันที่สิ้นสุดต้องก่อนวันนี้";
    if (/NJ_DATE_RANGE_INVALID/.test(m)) return "วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด";
    if (/NJ_DATE_REQUIRED/.test(m)) return "กรุณาเลือกวันที่เริ่มและวันที่สิ้นสุด";
    if (/NJ_SNAPSHOT_EXPIRED/.test(m)) return "ผลตรวจสอบหมดอายุ (10 นาที) กรุณากด 🔍 ตรวจสอบข้อมูล ใหม่";
    if (/NJ_CLEANUP_BUSY/.test(m)) return "มีการลบข้อมูลกำลังทำงานอยู่ กรุณารอสักครู่";
    if (/NJ_CONFIRM_REQUIRED/.test(m)) return "ต้องพิมพ์ DELETE เพื่อยืนยัน";
    return m || "เกิดข้อผิดพลาด";
  }
  function _hasToken() { return !!NJ.token && Date.now() < NJ.exp - 15000; }

  async function _rpc(fn, args) {
    var r = await sb.rpc(fn, args);
    if (r.error) throw new Error(_msg(r.error));
    return r.data;
  }
  async function _rpcAuth(fn, args) {
    if (!_hasToken()) throw new Error("SESSION_EXPIRED");
    try { return await _rpc(fn, Object.assign({ p_token: NJ.token }, args || {})); }
    catch (e) { if (e.message === "SESSION_EXPIRED") { NJ.token = null; } throw e; }
  }

  /* ---------- กล่องยืนยันรหัสผ่าน (purge_sessions) ---------- */
  function _authBox(id) {
    if (_hasToken()) {
      var left = Math.max(0, Math.round((NJ.exp - Date.now()) / 60000));
      return '<div class="panel" style="padding:10px 14px;margin-bottom:12px;font-size:13px">🔐 ยืนยันตัวตนแล้ว · หมดอายุในอีก ~' + left + ' นาที</div>';
    }
    return '<div class="panel" style="padding:14px;margin-bottom:12px">' +
      '<div style="font-weight:700;margin-bottom:8px">🔐 กรอกรหัสผ่านอีกครั้งเพื่อยืนยันตัวตน (SUPER_ADMIN)</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<input id="' + id + '-pw" type="password" autocomplete="current-password" placeholder="รหัสผ่าน" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;min-width:220px">' +
      '<button class="btn btn-primary" onclick="_njAuth(\'' + id + '\')">ยืนยัน</button>' +
      '<span id="' + id + '-pwmsg" style="color:#ef4444;font-size:13px"></span></div></div>';
  }
  window._njAuth = async function (id) {
    var inp = document.getElementById(id + "-pw"), msg = document.getElementById(id + "-pwmsg");
    var pw = inp ? inp.value : "";
    if (!pw) { if (msg) msg.textContent = "กรุณากรอกรหัสผ่าน"; return false; }
    try {
      var r = await _rpc("nj_cleanup_session_issue", { p_username: S.user.username, p_password: pw });
      NJ.token = r.token; NJ.exp = new Date(r.expires_at).getTime();
      if (id === "njr") renderReconcileView(); else renderCleanupView(true);
      return true;
    } catch (e) { if (msg) msg.textContent = _msg(e); return false; }
  };

  function _guard() {
    if (!_isSuper()) { S.view = (typeof _defaultLandingView === "function") ? _defaultLandingView() : "jobs"; renderView(); return false; }
    return true;
  }

  /* ---------- หลังลบ/ซ่อม: ล้าง state + โหลดใหม่ให้ตรง Database ---------- */
  async function _reloadAfterChange(delJobIds, delDocIds) {
    try {
      if (delJobIds && delJobIds.length) {
        var js = new Set(delJobIds);
        S.jobs = (S.jobs || []).filter(function (j) { return !js.has(j.id); });
      }
      if (delDocIds && delDocIds.length && typeof DOC !== "undefined" && DOC) {
        var ds = new Set(delDocIds);
        DOC.documents = (DOC.documents || []).filter(function (d) { return !ds.has(d.id); });
      }
      try { _invalidateDetailCache(); } catch (_) {}
      try { await clearJobsCache(); } catch (_) {}
      await loadJobs();
      try { await loadDocuments(); } catch (_) {}
      try { _docCacheSchedule(); } catch (_) {}
      try { await loadStatusCounts(); } catch (_) {}
      try { renderSidebar(); } catch (_) {}
    } catch (e) { console.warn("[nj reload]", e); }
  }

  /* =========================================================
     🔄 ตรวจข้อมูลค้าง
     ========================================================= */
  var CASE_TH = {
    JOB_GOING_NO_DOC: "JOB GOING (เอกสารชิปปิ้ง) ไม่มี DOCUMENT",
    DOCTYPE_ACTIVE_NO_DOC: "งานต่อเร้น/งานแก้ไข/FZ ยง ยัง Active ไม่มี DOCUMENT",
    JOB_DONE_NO_DOC: "JOB DONE (ประเภทต้องมีเอกสาร) ไม่มี DOCUMENT",
    DOC_NO_JOB: "DOCUMENT ไม่มี JOB ต้นทาง",
    MESSENGER_PENDING_STUCK: "MESSENGER_PENDING ค้าง",
    DOC_RECEIVED_JOB_NOT_DONE: "RECEIVED แต่ JOB ไม่ DONE",
    DOC_COMPLETED_JOB_NOT_DONE: "COMPLETED แต่ JOB ไม่ DONE",
    JOB_DONE_DOC_ACTIVE: "JOB DONE แต่ DOCUMENT ยังไม่จบ (ไม่มีหลักฐานรับ)",
    JOB_CANCELED_DOC_ACTIVE: "JOB CANCELED แต่ DOCUMENT ยังไม่จบ",
    DOCLOG_NO_DOC: "Document Log ไม่มี DOCUMENT"
  };

  window.renderReconcileView = function () {
    if (!_guard()) return;
    var host = _root(); if (!host) return;
    var s = NJ.lastScan;
    var body = "";
    if (_hasToken()) {
      body += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
        '<button class="btn btn-primary" id="njr-scan" onclick="_njScan()">🔄 ตรวจข้อมูลค้าง</button>' +
        (s && _fixableTotal(s) > 0 ? '<button class="btn btn-warn" id="njr-fix" onclick="_njFix()">🛠️ ซ่อมรายการที่ปลอดภัย (' + _n(_fixableTotal(s)) + ')</button>' : "") +
        '</div><div id="njr-out">' + (s ? _scanHtml(s) : '<div class="panel" style="padding:16px;opacity:.7">กด 🔄 ตรวจข้อมูลค้าง เพื่อเริ่ม</div>') + '</div>';
    }
    host.innerHTML = '<div class="topbar"><div><h1>🔄 ตรวจข้อมูลค้าง</h1><p class="sub">ตรวจความสัมพันธ์ WORK ↔ DOCUMENT · ซ่อมอัตโนมัติเฉพาะรายการที่พิสูจน์ได้ 100%</p></div></div>' +
      '<div class="content">' + _authBox("njr") + body + '</div>';
    try { refreshIcons(); } catch (_) {}
  };
  function _fixableTotal(s) { var t = 0, f = s.fixable || {}; Object.keys(f).forEach(function (k) { t += Number(f[k] || 0); }); return t; }
  function _scanHtml(s) {
    var g = s.groups || {}, c = s.counts || {}, fx = s.fixable || {};
    var rows = [
      ["JOB ไม่มี DOCUMENT", g.job_no_doc], ["DOCUMENT ไม่มี JOB", g.doc_no_job],
      ["MESSENGER_PENDING ค้าง", g.messenger_pending], ["RECEIVED แต่ JOB ไม่ DONE", g.received_not_done],
      ["สถานะไม่สัมพันธ์กัน", g.status_mismatch], ["Document Log กำพร้า", g.orphan_doc_logs]
    ];
    var h = '<div class="panel" style="padding:14px;margin-bottom:12px"><table class="tbl" style="width:100%;max-width:560px">' +
      rows.map(function (r) { return '<tr><td>' + _e(r[0]) + '</td><td style="text-align:right;font-weight:700">' + _n(r[1]) + '</td></tr>'; }).join("") +
      '</table><div style="margin-top:8px;font-size:13px;opacity:.75">งานเอกสารที่กำลังดำเนินการตามปกติ (JOB DONE + DOCUMENT RECEIVED/POSTPONED มีหลักฐานรับ): ' + _n(s.in_progress_ok) + ' · รอตรวจ (NEEDS_REVIEW): ' + _n(s.review_open) + '</div></div>';
    if (s.fixed) {
      h += '<div class="panel" style="padding:14px;margin-bottom:12px;border-left:4px solid #10b981"><b>ผลการซ่อม</b><br>' +
        Object.keys(s.fixed).map(function (k) { return _e(CASE_TH[k] || k) + ': ' + _n(s.fixed[k]); }).join("<br>") +
        '<br>ส่งเข้า NEEDS_REVIEW: ' + _n(s.review_upserted) + ' · ปิดรายการที่หายแล้ว: ' + _n(s.review_resolved) + '</div>';
    }
    h += '<div class="panel" style="padding:14px"><b>รายละเอียดตามเคส</b> <span style="font-size:12px;opacity:.7">(✅ = ซ่อมอัตโนมัติได้ · ⚠️ = ต้องให้ Admin ตรวจเอง)</span>' +
      '<table class="tbl" style="width:100%;margin-top:8px"><tr><th>เคส</th><th style="text-align:right">พบ</th><th style="text-align:right">ซ่อมได้</th></tr>' +
      Object.keys(CASE_TH).filter(function (k) { return c[k]; }).map(function (k) {
        return '<tr><td>' + _e(CASE_TH[k]) + '</td><td style="text-align:right">' + _n(c[k]) + '</td><td style="text-align:right">' + _n(fx[k] || 0) + '</td></tr>';
      }).join("") + '</table>';
    var items = s.items || [];
    if (items.length) {
      h += '<div style="max-height:420px;overflow:auto;margin-top:10px"><table class="tbl" style="width:100%;font-size:13px"><tr><th></th><th>เคส</th><th>JOB No.</th><th>DOC No.</th><th>JOB</th><th>DOC</th><th>หมายเหตุ</th></tr>' +
        items.map(function (it) {
          return '<tr><td>' + (it.fixable ? "✅" : "⚠️") + '</td><td>' + _e(CASE_TH[it.case_code] || it.case_code) + '</td><td>' + _e(it.job_no || "-") + '</td><td>' + _e(it.doc_no || "-") +
            '</td><td>' + _e(it.job_status || "-") + '</td><td>' + _e(it.doc_status || "-") + '</td><td>' + _e(it.detail || "") + '</td></tr>';
        }).join("") + '</table></div><div style="font-size:12px;opacity:.65;margin-top:4px">แสดงสูงสุด 50 รายการต่อเคส</div>';
    }
    return h + '</div>';
  }
  window._njScan = async function () {
    var b = document.getElementById("njr-scan"); if (b) { b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังตรวจ...'; }
    try { NJ.lastScan = await _rpcAuth("nj_reconcile_work_document", { p_mode: "scan" }); }
    catch (e) { if (e.message !== "SESSION_EXPIRED") toast(e.message, "error"); else toast("Session หมดอายุ กรุณายืนยันรหัสผ่านใหม่", "warning"); }
    renderReconcileView();
  };
  window._njFix = function () {
    confirmAction("ซ่อมรายการที่ปลอดภัย", "ระบบจะซ่อมเฉพาะรายการที่พิสูจน์ได้ 100% (" + _n(_fixableTotal(NJ.lastScan || {})) + " รายการ) ใน Transaction เดียว · รายการที่ตัดสินไม่ได้จะส่งเข้า NEEDS_REVIEW โดยไม่แก้ไข", async function () {
      var b = document.getElementById("njr-fix"); if (b) { b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังซ่อม...'; }
      try {
        NJ.lastScan = await _rpcAuth("nj_reconcile_work_document", { p_mode: "fix" });
        toast("ซ่อมข้อมูลเสร็จแล้ว", "success");
        await _reloadAfterChange();
      } catch (e) { toast(e.message === "SESSION_EXPIRED" ? "Session หมดอายุ กรุณายืนยันรหัสผ่านใหม่" : e.message, "error"); }
      renderReconcileView();
    }, "ซ่อม", false);
  };

  /* =========================================================
     🗑️ ลบข้อมูลเก่า
     ========================================================= */
  var REASON_TH = {
    FINAL_PAIR: "JOB DONE + DOCUMENT COMPLETED", FINAL_NO_DOC_DONE: "JOB DONE (ไม่มีเอกสาร)", FINAL_NO_DOC_CANCELED: "JOB CANCELED (ไม่มีเอกสาร)",
    CANCELED_BEFORE_ACCEPT: "ยกเลิกก่อนรับงาน", FINAL_DOC_NO_JOB: "DOCUMENT COMPLETED (สร้างตรง)",
    IN_REVIEW: "อยู่ใน NEEDS_REVIEW", DOC_NO_JOB: "DOCUMENT ไม่มี JOB", JOB_DONE_DOC_NOT_COMPLETED: "JOB DONE แต่ DOCUMENT ไม่จบ",
    DOC_COMPLETED_JOB_NOT_DONE: "DOCUMENT จบ แต่ JOB ไม่ DONE", JOB_CANCELED_DOC_ACTIVE: "JOB CANCELED แต่มี DOCUMENT",
    DOC_RECEIVED_JOB_NOT_DONE: "DOCUMENT RECEIVED แต่ JOB ไม่ DONE", MESSENGER_PENDING_STUCK: "DOCUMENT MESSENGER_PENDING ค้าง",
    JOB_GOING_NO_DOC: "JOB GOING แต่ไม่มี DOCUMENT", JOB_DONE_NO_DOC: "JOB DONE แต่ไม่มี DOCUMENT", JOB_CANCELED_NO_DOC: "JOB CANCELED หลังรับงาน ไม่มี DOCUMENT",
    ACTIVE_JOB_WAIT: "JOB WAIT", ACTIVE_JOB_GOING: "JOB GOING"
  };
  function _rTh(k) { return REASON_TH[k] || (String(k).indexOf("ACTIVE_DOC_") === 0 ? "DOCUMENT " + String(k).slice(11) : k); }

  window.renderCleanupView = function (keep) {
    if (!_guard()) return;
    var host = _root(); if (!host) return;
    var p = NJ.preview;
    var today = new Date(); today.setDate(today.getDate() - 1);
    var y = today.toISOString().slice(0, 10);
    var f = (document.getElementById("njc-from") || {}).value || (p && p.date_from) || "";
    var t = (document.getElementById("njc-to") || {}).value || (p && p.date_to) || "";
    var body = "";
    if (_hasToken()) {
      body = '<div class="panel" style="padding:14px;margin-bottom:12px"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">' +
        '<label style="font-size:13px">วันที่เริ่ม<br><input id="njc-from" type="date" max="' + y + '" value="' + _e(f) + '" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px"></label>' +
        '<label style="font-size:13px">วันที่สิ้นสุด<br><input id="njc-to" type="date" max="' + y + '" value="' + _e(t) + '" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px"></label>' +
        '<button class="btn btn-primary" id="njc-prev" onclick="_njPreview()">🔍 ตรวจสอบข้อมูล</button></div>' +
        '<div style="font-size:12px;opacity:.7;margin-top:6px">เลือกได้ถึงเมื่อวานเท่านั้น · ลบเฉพาะ JOB/DOCUMENT ที่จบ Flow สมบูรณ์ · ข้อมูล Active และข้อมูลค้างจะไม่ถูกลบ</div></div>' +
        '<div id="njc-out">' + (p && keep ? _previewHtml(p) : "") + '</div>' +
        '<div id="njc-audit"></div>';
    }
    host.innerHTML = '<div class="topbar"><div><h1>🗑️ ลบข้อมูลเก่า</h1><p class="sub">ลบข้อมูลออกจาก Database จริง · Preview ก่อนลบ · ยืนยัน 2 ชั้น · Server-side Transaction</p></div></div>' +
      '<div class="content">' + _authBox("njc") + body + '</div>';
    try { refreshIcons(); } catch (_) {}
    if (_hasToken()) _njLoadAudit();
  };

  function _previewHtml(p) {
    var rows = [
      ["ช่วงวันที่", _dmy(p.date_from) + " - " + _dmy(p.date_to)],
      ["JOB ที่พบ", _n(p.jobs_found)], ["DOCUMENT ที่พบ", _n(p.documents_found)],
      ["ลบได้", _n(p.delete_units) + " รายการ (JOB " + _n(p.delete_jobs) + " · DOCUMENT " + _n(p.delete_documents) + ")"],
      ["ห้ามลบ (Active)", _n(p.active_units)], ["ข้อมูลค้าง", _n(p.stuck_units)],
      ["Job Logs", _n(p.job_logs)], ["Document Logs", _n(p.document_logs)],
      ["ไฟล์แนบ / ลายเซ็น", _n(p.attachments) + " / " + _n(p.signatures)],
      ["ไฟล์ใน Storage", _n(p.storage_files) + " ไฟล์ (" + (Number(p.storage_bytes || 0) / 1048576).toFixed(1) + " MB)"]
    ];
    var h = '<div class="panel" style="padding:14px;margin-bottom:12px"><table class="tbl" style="width:100%;max-width:620px">' +
      rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td style="font-weight:700;text-align:right">' + r[1] + '</td></tr>'; }).join("") + '</table>';
    var sr = p.stuck_by_reason || {};
    if (p.stuck_units > 0) {
      h += '<div style="margin-top:10px;padding:10px;background:#fef3c7;border-radius:8px">⚠️ พบข้อมูลค้าง — ต้องตรวจสอบก่อนลบ (ไม่ถูกลบ)<br>' +
        Object.keys(sr).map(function (k) { return "• " + _e(_rTh(k)) + ": " + _n(sr[k]); }).join("<br>") + '</div>';
    }
    h += _sample("ตัวอย่างรายการที่ลบได้", p.sample_delete) + _sample("ตัวอย่างรายการห้ามลบ (Active)", p.sample_active) + _sample("ตัวอย่างข้อมูลค้าง", p.sample_stuck);
    if (p.delete_units > 0) {
      h += '<div style="margin-top:14px"><button class="btn btn-danger" id="njc-del" onclick="_njAskDelete()">🗑️ ลบข้อมูล</button></div><div id="njc-confirm"></div>';
    } else {
      h += '<div style="margin-top:12px;opacity:.75">ไม่มีรายการที่ลบได้ในช่วงวันที่นี้</div>';
    }
    return h + '<div id="njc-progress"></div></div>';
  }
  function _sample(title, arr) {
    arr = arr || []; if (!arr.length) return "";
    return '<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">' + title + ' (' + arr.length + ')</summary>' +
      '<table class="tbl" style="width:100%;font-size:13px;margin-top:6px"><tr><th>ประเภท</th><th>Job No.</th><th>Document No.</th><th>JOB</th><th>DOC</th><th>เหตุผล</th></tr>' +
      arr.map(function (r) {
        return '<tr><td>' + _e(r.unit) + '</td><td>' + _e(r.job_no || "-") + '</td><td>' + _e(r.doc_no || "-") + '</td><td>' + _e(r.job_status || "-") +
          '</td><td>' + _e(r.doc_status || "-") + '</td><td>' + _e(_rTh(r.reason)) + '</td></tr>';
      }).join("") + '</table></details>';
  }

  window._njPreview = async function () {
    var f = (document.getElementById("njc-from") || {}).value, t = (document.getElementById("njc-to") || {}).value;
    if (!f || !t) { toast("กรุณาเลือกวันที่เริ่มและวันที่สิ้นสุด", "error"); return; }
    if (f > t) { toast("วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด", "error"); return; }
    var b = document.getElementById("njc-prev"); if (b) { b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังตรวจ...'; }
    try {
      NJ.preview = await _rpcAuth("nj_cleanup_preview", { p_date_from: f, p_date_to: t });
      var out = document.getElementById("njc-out"); if (out) out.innerHTML = _previewHtml(NJ.preview);
    } catch (e) {
      if (e.message === "SESSION_EXPIRED") { toast("Session หมดอายุ กรุณายืนยันรหัสผ่านใหม่", "warning"); renderCleanupView(); return; }
      toast(e.message, "error");
    }
    if (b) { b.disabled = false; b.innerHTML = "🔍 ตรวจสอบข้อมูล"; }
  };

  window._njAskDelete = function () {
    var p = NJ.preview; if (!p) return;
    var box = document.getElementById("njc-confirm"); if (!box) return;
    box.innerHTML = '<div style="margin-top:12px;padding:14px;border:2px solid #ef4444;border-radius:10px;background:#fef2f2">' +
      '<div style="font-weight:800;color:#b91c1c">กำลังลบข้อมูลถาวรจาก Database</div>' +
      '<div style="margin:6px 0">ช่วงวันที่ ' + _dmy(p.date_from) + ' - ' + _dmy(p.date_to) + '<br>JOB ' + _n(p.delete_jobs) + ' รายการ<br>DOCUMENT ' + _n(p.delete_documents) + ' รายการ<br>' +
      'Logs ' + _n(Number(p.job_logs || 0) + Number(p.document_logs || 0)) + ' รายการ · ไฟล์ ' + _n(p.storage_files) + ' ไฟล์</div>' +
      '<div style="font-weight:700">ข้อมูลนี้ไม่สามารถกู้คืนจากระบบได้</div>' +
      '<div style="margin-top:10px">พิมพ์ <b>DELETE</b> เพื่อยืนยัน: <input id="njc-type" autocomplete="off" oninput="_njTyped()" style="padding:8px;border:1px solid #ef4444;border-radius:8px;width:140px"></div>' +
      '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn-danger" id="njc-go" disabled onclick="_njExecute()">ยืนยันลบถาวร</button>' +
      '<button class="btn btn-secondary" onclick="document.getElementById(\'njc-confirm\').innerHTML=\'\'">ยกเลิก</button></div></div>';
    var d = document.getElementById("njc-del"); if (d) d.disabled = true;
  };
  window._njTyped = function () {
    var v = (document.getElementById("njc-type") || {}).value, g = document.getElementById("njc-go");
    if (g) g.disabled = v !== "DELETE";
  };

  function _prog(html) { var el = document.getElementById("njc-progress"); if (el) el.innerHTML = '<div style="margin-top:12px;padding:12px;border-radius:8px;background:#f1f5f9">' + html + '</div>'; }

  window._njExecute = async function (resume) {
    if (NJ.running) return;
    var typed = (document.getElementById("njc-type") || {}).value;
    if ((resume !== true && typed !== "DELETE") || !NJ.preview) return;
    NJ.running = true;
    var snap = NJ.preview.snapshot_id, delJ = [], delD = [], r = null;
    var cf = document.getElementById("njc-confirm"); if (cf) cf.innerHTML = "";
    _prog('<span class="spinner"></span> กำลังลบ... 0 / ' + _n(NJ.preview.delete_units));
    try {
      for (var guard = 0; guard < 500; guard++) {
        try {
          r = await _rpcAuth("nj_cleanup_execute", { p_snapshot_id: snap, p_confirm: "DELETE", p_batch_size: 1000 });
        } catch (e) {
          if (e.message === "SESSION_EXPIRED") {
            _prog('Session หมดอายุระหว่างลบ — งานที่ลบแล้วถูกบันทึกครบทุก batch<br>กรอกรหัสผ่านเพื่อทำต่อจากจุดเดิม: ' +
              '<input id="njx-pw" type="password" style="padding:6px;border:1px solid #cbd5e1;border-radius:6px"> <button class="btn btn-primary" onclick="_njResume()">ทำต่อ</button> <span id="njx-pwmsg" style="color:#ef4444"></span>');
            NJ.running = false; NJ._resume = { delJ: delJ, delD: delD }; return;
          }
          throw e;
        }
        (r.deleted_job_ids || []).forEach(function (x) { delJ.push(x); });
        (r.deleted_document_ids || []).forEach(function (x) { delD.push(x); });
        _prog('<span class="spinner"></span> กำลังลบ... ' + _n(r.processed) + ' / ' + _n(r.total));
        if (r.done) break;
      }
      _prog('✅ ลบข้อมูลใน Database เสร็จสิ้น · กำลังโหลดข้อมูลใหม่...');
      await _reloadAfterChange(delJ, delD);
      var a = r && r.audit || {};
      _prog('✅ เสร็จสิ้น · JOB ' + _n(a.jobs_count) + ' · DOCUMENT ' + _n(a.documents_count) + ' · Logs ' + _n(a.logs_count) +
        (a.skipped_changed ? ' · ข้ามเพราะข้อมูลเปลี่ยนหลังตรวจ ' + _n(a.skipped_changed) : '') +
        '<br><span class="spinner"></span> กำลังลบไฟล์ใน Storage...');
      await _njStorageRun();
    } catch (e) {
      _prog('❌ ลบไม่สำเร็จ: ' + _e(e.message) + '<br>batch ที่ผิดพลาดถูก ROLLBACK ทั้งชุด · batch ก่อนหน้าที่สำเร็จถูกบันทึกใน Audit แล้ว · กด 🔍 ตรวจสอบข้อมูล ใหม่เพื่อดูสถานะล่าสุด');
      await _reloadAfterChange(delJ, delD);
    }
    NJ.running = false;
    _njLoadAudit();
  };
  window._njResume = async function () {
    var pw = (document.getElementById("njx-pw") || {}).value, m = document.getElementById("njx-pwmsg");
    try {
      var t = await _rpc("nj_cleanup_session_issue", { p_username: S.user.username, p_password: pw });
      NJ.token = t.token; NJ.exp = new Date(t.expires_at).getTime();
      await _njExecute(true);
    } catch (e) { if (m) m.textContent = _msg(e); }
  };

  /* ---------- Storage: Manifest + Retry (Server ตรวจกับ storage.objects ทุกครั้ง) ---------- */
  async function _njStorageRun() {
    var rounds = 0, last = null;
    while (rounds++ < 200) {
      var nx = await _rpcAuth("nj_cleanup_storage_next", { p_limit: 300 });
      last = nx;
      var items = nx.items || [];
      if (!items.length) break;
      var byB = {};
      items.forEach(function (it) { (byB[it.bucket] = byB[it.bucket] || []).push(it); });
      var errMsg = null;
      for (var bi = 0; bi < BUCKETS.length; bi++) {
        var bk = BUCKETS[bi], list = byB[bk] || [];
        for (var i = 0; i < list.length; i += 100) {
          var chunk = list.slice(i, i + 100);
          try {
            var rr = await sb.storage.from(bk).remove(chunk.map(function (x) { return x.name; }));
            if (rr && rr.error) errMsg = rr.error.message || String(rr.error);
          } catch (e) { errMsg = e && e.message || String(e); }
        }
      }
      var rep = await _rpcAuth("nj_cleanup_storage_report", { p_ids: items.map(function (x) { return x.id; }), p_error: errMsg });
      _prog('🗂️ ลบไฟล์ใน Storage... เหลือ ' + _n(rep.pending_total) + ' ไฟล์');
      if (rep.deleted === 0) break;   // ไม่มีความคืบหน้า → หยุด ให้กดลองใหม่ภายหลัง
    }
    var fin = await _rpcAuth("nj_cleanup_storage_next", { p_limit: 1 });
    if (fin.pending_total > 0) {
      _prog('⚠️ ลบข้อมูลใน Database สำเร็จ แต่ไฟล์ใน Storage ยังค้าง ' + _n(fin.pending_total) + ' ไฟล์ — งานนี้ยังไม่ถือว่าสำเร็จทั้งหมด' +
        '<br><button class="btn btn-warn" style="margin-top:8px" onclick="_njStorageRetry()">🔁 ลบไฟล์ค้างซ้ำ</button>');
    } else {
      _prog('✅ เสร็จสิ้นทั้งหมด · Database และไฟล์ใน Storage ถูกลบครบ');
    }
    return last;
  }
  window._njStorageRetry = async function () {
    if (NJ.running) return; NJ.running = true;
    try { _prog('<span class="spinner"></span> กำลังลบไฟล์ค้าง...'); await _njStorageRun(); }
    catch (e) { _prog('❌ ' + _e(e.message === "SESSION_EXPIRED" ? "Session หมดอายุ กรุณายืนยันรหัสผ่านใหม่แล้วกดลองใหม่" : e.message)); if (e.message === "SESSION_EXPIRED") renderCleanupView(true); }
    NJ.running = false; _njLoadAudit();
  };

  async function _njLoadAudit() {
    var el = document.getElementById("njc-audit"); if (!el || !_hasToken()) return;
    try {
      var list = await _rpcAuth("nj_cleanup_audit_list", { p_limit: 10 });
      if (!list || !list.length) { el.innerHTML = ""; return; }
      var pend = list.some(function (a) { return a.storage_status === "PENDING" || a.storage_status === "PARTIAL"; });
      el.innerHTML = '<div class="panel" style="padding:14px"><b>ประวัติการลบ (Audit)</b>' +
        (pend ? ' <button class="btn btn-warn" style="margin-left:8px" onclick="_njStorageRetry()">🔁 ลบไฟล์ค้างซ้ำ</button>' : '') +
        '<div style="overflow:auto"><table class="tbl" style="width:100%;font-size:13px;margin-top:8px"><tr><th>#</th><th>ช่วงวันที่</th><th>ผู้ลบ</th><th>เวลา</th><th>สถานะ</th><th>JOB</th><th>DOC</th><th>Logs</th><th>รวมแถว</th><th>ไฟล์</th></tr>' +
        list.map(function (a) {
          var ok = a.status === "COMPLETED" && (a.storage_status === "DONE" || a.storage_status === "NONE");
          return '<tr><td>' + a.id + '</td><td>' + _dmy(a.date_from) + ' - ' + _dmy(a.date_to) + '</td><td>' + _e(a.deleted_by_name) + '</td><td>' +
            _e(String(a.deleted_at || a.started_at || "").replace("T", " ").slice(0, 16)) + '</td><td>' + (ok ? "✅ สำเร็จ" : (a.status === "RUNNING" ? "⏳ ค้าง/ไม่จบ" : "⚠️ ไฟล์ค้าง")) +
            '</td><td>' + _n(a.jobs_count) + '</td><td>' + _n(a.documents_count) + '</td><td>' + _n(a.logs_count) + '</td><td>' + _n(a.total_deleted_rows) +
            '</td><td>' + _e(a.storage_status) + ' ' + _n(a.storage_deleted) + '/' + _n(a.storage_total) + '</td></tr>';
        }).join("") + '</table></div></div>';
    } catch (e) { if (e.message !== "SESSION_EXPIRED") el.innerHTML = '<div style="color:#ef4444">โหลดประวัติไม่สำเร็จ: ' + _e(e.message) + '</div>'; }
  }
})();
