/* views/announce/board.js — RUN-136 · 📢 ประกาศ (ประกาศบริษัท + ประกาศที่รับทราบแล้ว)
   โคลน UI/Workflow จาก EVA "ศูนย์รับฟัง & ประกาศบริษัท"
   Data + Identity เป็นของ HR SYSTEM ทั้งหมด — ผ่าน RPC njhr_ea_* เท่านั้น
   ไม่ใช้ supabase-js · ไม่เข้าตารางตรง · ไม่แตะ eva_users

   FIX MODE
     1 PASSWORD  ยืนยันรหัสผ่านที่ Server ทุกครั้งก่อน ACK (ไม่ส่ง password_confirmed เอง)
     2 VERSION   เวอร์ชันใหม่ต้องรับทราบใหม่ · แบนเนอร์เตือน · X/Y อิงเวอร์ชันปัจจุบัน
     3 CLOSED    ดูย้อนหลังได้ · รับทราบย้อนหลังได้ · DONE ยังเห็น
     4 STABLE NO เลขที่ประกาศมาจาก Server (njhr_ea_ann_no) ไม่คำนวณจาก list ที่ถูกกรอง
     5 FILE      อัปโหลด .docx / .pdf เข้า Storage bucket announcement จริง
     6 EXPORT    Word ของประกาศ + Excel ผู้รับทราบ (CSV คงไว้เป็นทางเลือก)
     7 REALTIME  subscribe announcement + announcement_read · กัน subscribe ซ้ำ · teardown
     8 CATEGORY  8 หมวดตาม SOURCE (ไม่มี "ด่วน") */
(function () {
  "use strict";
  var S = window.NJHR && NJHR.compat && NJHR.compat.scope;
  if (!S) throw new Error("RUNTIME_NOT_READY");
  var icon = S.icon, esc = S.esc, toast = S.toast, openModal = S.openModal, closeModal = S.closeModal;
  var confirmDialog = S.confirmDialog, sbRpc = S.sbRpc, sbRpcList = S.sbRpcList, sbToken = S.sbToken;
  var sbReady = S.sbReady, currentUser = S.currentUser, emptyState = S.emptyState;
  var empBE = S.empBE, debounce = S.debounce, loadScriptOnce = S.loadScriptOnce;
  var withButtonLoading = S.withButtonLoading, downloadCSV = S.downloadCSV, SB = S.SB;
  var rptBuildXlsx = S.rptBuildXlsx, rptLoadZip = S.rptLoadZip, rptSafeName = S.rptSafeName;
  var njEdgeMark = S.njEdgeMark, njEdgeMissing = S.njEdgeMissing, njEdgeNet = S.njEdgeNet, njEdgeFail = S.njEdgeFail;
  var NJ_COMPANY_NAME = S.NJ_COMPANY_NAME, njCompanyParts = S.njCompanyParts;

  /* [FIX 8] หมวดตาม SOURCE จริง — ไม่มี "ด่วน" */
  var AN_CATS = ["ข่าวสาร", "ระเบียบบริษัท", "นโยบาย", "สวัสดิการ",
    "ความปลอดภัย", "ตารางอบรม", "OT", "ประชาสัมพันธ์"];
  var AN_BUCKET = "announcement";
  /* [FIX 5] SOURCE ให้แนบ Word/PDF ได้เฉพาะหมวด "ระเบียบบริษัท" */
  var AN_FILE_CAT = "ระเบียบบริษัท";

  var anState = { scope: "BOARD", q: "", status: "", page: 1, per: 10, seq: 0, rows: [], canManage: false, host: null };
  var anReadOk = false, anStart = null, anDepts = [];
  var anDocxFile = null, anPdfFile = null;
  /* [FIX 2] id ของประกาศที่ Readers Modal เปิดค้างอยู่ — ใช้ให้ Realtime refresh ใน Modal ด้วย */
  var anRdrOpenId = null;

  function anCan() { var u = currentUser(); return !!u && ["SUPER_ADMIN", "HR"].indexOf(u.role) >= 0; }
  function anIsSuper() { var u = currentUser(); return !!u && u.role === "SUPER_ADMIN"; }
  function anDate(v) { return v ? empBE(String(v).slice(0, 10)) : "—"; }
  function anTime(v) {
    if (!v) return "—";
    var d = new Date(v); if (isNaN(d.getTime())) return "—";
    return empBE(String(v).slice(0, 10)) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  function anDur(s) {
    var n = Number(s) || 0; if (n < 60) return n + " วินาที";
    return Math.floor(n / 60) + " นาที " + (n % 60) + " วินาที";
  }
  function anTargets(a) {
    var raw = String((a && a.target_departments) || "").trim();
    if (!raw || raw === "__ALL__") return null;
    var arr = raw.split(",").map(function (s2) { return s2.trim(); }).filter(Boolean);
    return arr.length ? arr : null;
  }
  function anStat(a) {
    var n = Number(a.read_count) || 0, d = Number(a.target_total) || 0;
    return { numer: n, denom: d, pct: d > 0 ? Math.round(n * 100 / d) : 0 };
  }
  function anCatChip(c) {
    var m = { "ระเบียบบริษัท": "chip-warn", "นโยบาย": "chip-warn", "ความปลอดภัย": "chip-bad" };
    return '<span class="chip ' + (m[c] || "chip-info") + '">' + esc(c || "ข่าวสาร") + "</span>";
  }
  function anDevice() { return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "") ? "Mobile" : "Desktop"; }
  function anBrowser() {
    var u = navigator.userAgent || "";
    if (/Edg\//.test(u)) return "Edge";
    if (/Chrome\//.test(u)) return "Chrome";
    if (/Firefox\//.test(u)) return "Firefox";
    if (/Safari\//.test(u)) return "Safari";
    return "Other";
  }
  function anOS() {
    var u = navigator.userAgent || "";
    if (/Windows/.test(u)) return "Windows";
    if (/Android/.test(u)) return "Android";
    if (/iPhone|iPad|iOS/.test(u)) return "iOS";
    if (/Mac OS/.test(u)) return "macOS";
    return "Other";
  }

  /* ───────── [FIX 7] REALTIME — WebSocket ตรงกับ Supabase Realtime ─────────
     NJLHR ไม่มี supabase-js จึงต่อ phoenix channel เอง
     กัน subscribe ซ้ำด้วย anRT.sock · teardown ผูกกับ logout ของ HR เดิม */
  var anRT = { sock: null, hb: null, ref: 0, alive: false, onChange: null, retry: 0 };

  function anRtUrl() {
    if (!SB || !SB.url || !SB.key) return "";
    return String(SB.url).replace(/^http/, "ws") +
      "/realtime/v1/websocket?apikey=" + encodeURIComponent(SB.key) + "&vsn=1.0.0";
  }
  function anRtSend(msg) {
    try { if (anRT.sock && anRT.sock.readyState === 1) anRT.sock.send(JSON.stringify(msg)); } catch (e) { }
  }
  function anRtJoin(table, filter) {
    anRT.ref++;
    var ch = { event: "*", schema: "public", table: table };
    if (filter) ch.filter = filter;     /* กรองที่ Server — แถวของ EVA ไม่ถูกส่งมาที่เบราว์เซอร์ */
    anRtSend({
      topic: "realtime:public:" + table, event: "phx_join",
      payload: { config: { postgres_changes: [ch] } },
      ref: String(anRT.ref)
    });
  }
  function anRtStart(onChange) {
    anRT.onChange = onChange;
    if (anRT.sock) return anRT.sock;            /* กัน subscription ซ้ำ */
    var url = anRtUrl(); if (!url || typeof WebSocket === "undefined") return null;
    var ws;
    try { ws = new WebSocket(url); } catch (e) { return null; }
    anRT.sock = ws;
    ws.onopen = function () {
      anRT.alive = true; anRT.retry = 0;
      anRtJoin("announcement", "app_code=eq.salary");
      anRtJoin("announcement_read");
      if (anRT.hb) clearInterval(anRT.hb);
      anRT.hb = setInterval(function () {
        anRT.ref++;
        anRtSend({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(anRT.ref) });
      }, 30000);
    };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || m.event !== "postgres_changes") return;
      if (typeof anRT.onChange === "function") anRT.onChange(m);
    };
    ws.onclose = function () { anRtStop(true); };
    ws.onerror = function () { };
    return ws;
  }
  function anRtStop(fromClose) {
    if (anRT.hb) { clearInterval(anRT.hb); anRT.hb = null; }
    if (anRT.sock && !fromClose) { try { anRT.sock.close(); } catch (e) { } }
    anRT.sock = null; anRT.alive = false; anRT.onChange = null;
  }
  /* teardown ตอนออกจากระบบ / ปิดหน้า
     doLogout() ของ core.js เรียก NJHR.<module>.reset() ตามโครงเดิม (notify / payroll / NJHRFace)
     จึงลงทะเบียนด้วยรูปแบบเดียวกัน ไม่สร้าง event ใหม่ที่ไม่มีใคร dispatch */
  try {
    window.NJHR = window.NJHR || {};
    NJHR.announce = NJHR.announce || {};
    NJHR.announce.reset = function () { anRtStop(); };
    window.addEventListener("beforeunload", function () { anRtStop(); });
  } catch (e) { }

  /* ───────── โหลดข้อมูล ───────── */
  function anLoad(el) {
    var seq = ++anState.seq;
    return sbRpcList("njhr_ea_list", {
      p_token: sbToken(), p_scope: anState.scope,
      p_q: anState.q || null, p_status: anState.status || null,
      p_limit: 500, p_offset: 0
    }).then(function (rows) {
      if (seq !== anState.seq) return;
      anState.rows = rows || [];
      anState.canManage = !!(rows && rows.length ? rows[0].can_manage : anCan());
      anPaint(el);
    }, function (er) {
      if (seq !== anState.seq) return;
      anState.rows = [];
      el.innerHTML = '<div class="card"><div class="form-error" role="alert">' +
        esc(er.message || "โหลดประกาศไม่สำเร็จ") + "</div></div>";
    });
  }
  function anDeptLoad() {
    if (anDepts.length) return Promise.resolve(anDepts);
    return sbRpcList("njhr_ea_depts", { p_token: sbToken() }).then(function (r) {
      anDepts = r || []; return anDepts;
    }, function () { anDepts = []; return anDepts; });
  }

  /* ───────── หน้าหลัก ───────── */
  function anView(el, scope) {
    if (!sbReady()) { el.innerHTML = emptyState("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase"); return; }
    anState.scope = scope; anState.page = 1; anState.host = el;
    el.innerHTML = '<div class="card"><small class="muted">กำลังโหลดประกาศ…</small></div>';
    anLoad(el);
    anRtStart(debounce(function () {
      if (anState.host && document.body.contains(anState.host)) anLoad(anState.host);
      /* [FIX 2] ถ้า Readers Modal เปิดอยู่ ต้องรีเฟรชข้อมูลใน Modal ด้วย */
      if (!document.querySelector(".an-rdr")) anRdrOpenId = null;
      else if (anRdrOpenId) anReaders(anRdrOpenId, true);
    }, 400));
  }
  function viewAnnBoard(el) { anView(el, "BOARD"); }
  function viewAnnDone(el) { anView(el, "DONE"); }

  function anPaint(el) {
    var mng = anState.canManage, list = anState.rows.slice();
    var total = list.length, per = anState.per;
    var pages = Math.max(1, Math.ceil(total / per));
    if (anState.page > pages) anState.page = pages;
    var page = list.slice((anState.page - 1) * per, anState.page * per);
    var isDone = anState.scope === "DONE";

    el.innerHTML =
      '<div class="card an-top"><div class="card-head">' +
      "<h3>" + (isDone ? "📚 ประกาศที่รับทราบแล้ว" : "📢 ประกาศบริษัท") + "</h3>" +
      '<span class="grow"></span>' +
      (mng ? '<button class="btn btn-ghost btn-sm" id="an-xls">' + icon("download") + " Export Excel</button>" +
        '<button class="btn btn-ghost btn-sm" id="an-csv">' + icon("download") + " CSV</button>" : "") +
      (mng && !isDone ? '<button class="btn btn-primary btn-sm" id="an-new">' + icon("plus") + " เพิ่มประกาศ</button>" : "") +
      "</div>" +
      '<div class="toolbar an-filter">' +
      '<span class="search-box an-search">' + icon("search") +
      '<input id="an-q" autocomplete="off" placeholder="ค้นหาหัวข้อ / เนื้อหา / หมวด" value="' + esc(anState.q) + '"></span>' +
      (mng ? '<select id="an-st" style="max-width:170px">' +
        ['<option value="">ทุกสถานะ</option>',
        '<option value="OPEN"' + (anState.status === "OPEN" ? " selected" : "") + ">เปิดรับทราบ</option>",
        '<option value="CLOSED"' + (anState.status === "CLOSED" ? " selected" : "") + ">ปิดแล้ว</option>"].join("") +
        "</select>" : "") +
      '<span class="grow"></span><small class="muted">' + total + " รายการ</small></div></div>" +
      '<div class="req-list an-list">' +
      (total ? page.map(function (a) { return anCard(a, mng); }).join("") :
        '<div class="card">' + emptyState(isDone ? "ยังไม่มีประกาศที่รับทราบแล้ว" : "ยังไม่มีประกาศ") + "</div>") +
      "</div>" + anPager(pages);

    var q = document.getElementById("an-q");
    if (q) q.oninput = debounce(function () { anState.q = this.value; anState.page = 1; anLoad(el); }, 300);
    var st = document.getElementById("an-st");
    if (st) st.onchange = function () { anState.status = this.value; anState.page = 1; anLoad(el); };
    var nw = document.getElementById("an-new");
    if (nw) nw.onclick = function () { anForm(el, null); };
    var xl = document.getElementById("an-xls");
    if (xl) xl.onclick = function () { anExportXlsx(this, list); };
    var cs = document.getElementById("an-csv");
    if (cs) cs.onclick = function () { anExportCsv(list); };
    el.querySelectorAll("[data-an-open]").forEach(function (b) { b.onclick = function () { anDetail(el, b.dataset.anOpen); }; });
    el.querySelectorAll("[data-an-edit]").forEach(function (b) { b.onclick = function () { anForm(el, b.dataset.anEdit); }; });
    el.querySelectorAll("[data-an-rdr]").forEach(function (b) { b.onclick = function () { anReaders(b.dataset.anRdr); }; });
    el.querySelectorAll("[data-an-tg]").forEach(function (b) { b.onclick = function () { anToggle(el, b.dataset.anTg, b.dataset.anTo); }; });
    el.querySelectorAll("[data-an-pin]").forEach(function (b) { b.onclick = function () { anPin(el, b.dataset.anPin, b.dataset.anTo === "1"); }; });
    el.querySelectorAll("[data-an-del]").forEach(function (b) { b.onclick = function () { anDelete(el, b.dataset.anDel); }; });
    el.querySelectorAll("[data-an-word]").forEach(function (b) { b.onclick = function () { anExportWord(b, b.dataset.anWord); }; });
    el.querySelectorAll("[data-an-pg]").forEach(function (b) { b.onclick = function () { anState.page = Number(b.dataset.anPg) || 1; anPaint(el); }; });
  }

  function anCard(a, mng) {
    var st = anStat(a), tg = anTargets(a), closed = a.status !== "OPEN";
    return '<div class="card req-card an-card' + (closed ? " inactive-card" : "") + '">' +
      '<div class="req-top"><div class="grow">' +
      "<b>" + (a.pinned ? icon("pin", "ic-sm ic-red") + " " : "") + esc(a.title) + "</b>" +
      "<small>" + esc(a.ann_no || "") + " · " + anDate(a.published_at || a.created_at) +
      " · " + esc(a.created_name || a.created_by || "") + (closed ? " · ปิดรับทราบแล้ว" : "") + "</small>" +
      "</div></div>" +
      '<div class="an-chips">' + anCatChip(a.category) +
      (a.require_sign ? '<span class="chip chip-warn">ต้องรับทราบ</span>' : "") +
      '<span class="chip">v' + esc(a.version || "1.0") + "</span>" +
      '<span class="chip">' + (tg ? "เฉพาะแผนก: " + esc(tg.join(", ")) : "ทุกแผนก") + "</span>" +
      (a.needs_reack ? '<span class="chip chip-bad">มีเวอร์ชันใหม่ — ต้องรับทราบใหม่</span>'
        : a.mine_read ? '<span class="chip chip-ok">รับทราบแล้ว ' + anTime(a.mine_read_at) + "</span>" : "") +
      (mng ? '<span class="chip chip-info">' + st.numer + "/" + st.denom + " (" + st.pct + "%)</span>" : "") +
      "</div>" +
      '<div class="req-actions">' +
      '<button class="btn btn-primary btn-sm" data-an-open="' + esc(a.id) + '">' + icon("fileText") + " อ่านประกาศ</button>" +
      (mng ? '<button class="btn btn-ghost btn-sm" data-an-rdr="' + esc(a.id) + '">' + icon("users") + " ผู้รับทราบ</button>" +
        '<button class="btn btn-ghost btn-sm" data-an-word="' + esc(a.id) + '">' + icon("download") + " Word</button>" +
        '<button class="btn btn-ghost btn-sm" data-an-edit="' + esc(a.id) + '">' + icon("edit") + " แก้ไข</button>" +
        '<button class="btn btn-ghost btn-sm" data-an-pin="' + esc(a.id) + '" data-an-to="' + (a.pinned ? "0" : "1") + '">' +
        icon("pin") + (a.pinned ? " เลิกปักหมุด" : " ปักหมุด") + "</button>" +
        '<button class="btn btn-ghost btn-sm" data-an-tg="' + esc(a.id) + '" data-an-to="' +
        (closed ? "OPEN" : "CLOSED") + '">' +
        (closed ? icon("check") + " เปิดรับทราบ" : icon("ban") + " ปิดรับทราบ") + "</button>" : "") +
      (anIsSuper() ? '<button class="btn btn-ghost btn-sm t-red" data-an-del="' + esc(a.id) + '">' + icon("x") + " ลบ</button>" : "") +
      "</div></div>";
  }

  function anPager(pages) {
    if (pages <= 1) return "";
    var out = '<div class="toolbar an-pager">';
    for (var i = 1; i <= pages; i++) {
      out += '<button class="btn btn-sm ' + (i === anState.page ? "btn-primary" : "btn-ghost") +
        '" data-an-pg="' + i + '">' + i + "</button>";
    }
    return out + "</div>";
  }

  /* ───────── อ่านประกาศ + รับทราบ ───────── */
  function anDetail(el, id) {
    anRdrOpenId = null;
    anReadOk = false; anStart = new Date();
    openModal("กำลังเปิดประกาศ…", '<div class="ta-c"><span class="spinner"></span></div>', "");
    sbRpc("njhr_ea_get", { p_token: sbToken(), p_id: id }).then(function (r) {
      var d = (r && r.data) || null;
      if (!d || !d.ann) throw new Error("ไม่พบประกาศนี้");
      anPaintDetail(el, d);
      sbRpc("njhr_ea_audit", {
        p_token: sbToken(), p_id: id, p_event: "OPEN", p_meta: null,
        p_ip: null, p_ua: navigator.userAgent || null,
        p_device: anDevice(), p_browser: anBrowser(), p_os: anOS()
      })["catch"](function () { });
    })["catch"](function (er) {
      openModal("เปิดประกาศไม่สำเร็จ", '<div class="form-error" role="alert">' +
        esc(er.message || "ไม่สำเร็จ") + "</div>", "");
    });
  }

  function anPaintDetail(el, d) {
    var a = d.ann, mine = d.my_read, tg = anTargets(a);
    var done = !!d.mine_read, reack = !!d.needs_reack, closed = !!d.closed;
    var canAck = !done;   /* [FIX 3] CLOSED ยังรับทราบย้อนหลังได้ */
    var body =
      (reack ? '<div class="card an-warn an-warn-red">' + icon("bell", "ic-sm") +
        " มีเวอร์ชันใหม่ (v" + esc(a.version) + ") — ต้องรับทราบใหม่" +
        (mine && mine.announcement_version_snapshot ? " · เคยรับทราบ v" + esc(mine.announcement_version_snapshot) : "") +
        "</div>" : "") +
      (closed ? '<div class="card an-warn">' + icon("info", "ic-sm") +
        " ประกาศนี้ปิดแล้ว แต่ยังสามารถรับทราบย้อนหลังได้</div>" : "") +
      '<div class="an-doc" id="an-doc">' +
      '<div class="an-doc-head"><h3>' + esc(a.title) + "</h3>" +
      '<div class="an-chips">' + anCatChip(a.category) +
      '<span class="chip">' + esc(d.ann_no || "") + "</span>" +
      '<span class="chip">v' + esc(a.version || "1.0") + "</span>" +
      '<span class="chip">' + anDate(a.published_at || a.created_at) + "</span>" +
      '<span class="chip">' + (tg ? "เฉพาะแผนก: " + esc(tg.join(", ")) : "ทุกแผนก") + "</span>" +
      (a.effective_date ? '<span class="chip">มีผล ' + anDate(a.effective_date) + "</span>" : "") +
      "</div></div>" +
      '<div class="an-doc-body">' + anBodyHtml(a.body) + "</div>" +
      (a.file_url ? '<div class="an-file"><div id="an-docx"><small class="muted">กำลังแสดงเอกสาร Word…</small></div>' +
        '<div class="ta-c"><a class="btn btn-ghost btn-sm" href="' + esc(a.file_url) + '" target="_blank" rel="noopener">' +
        icon("download") + " " + esc(a.file_name || "ดาวน์โหลด Word") + "</a></div></div>" : "") +
      (a.pdf_file_url ? '<div class="an-file"><iframe class="an-pdf" src="' + esc(a.pdf_file_url) + '"></iframe>' +
        '<div class="ta-c"><a class="btn btn-ghost btn-sm" href="' + esc(a.pdf_file_url) + '" target="_blank" rel="noopener">' +
        icon("download") + " " + esc(a.pdf_file_name || "ดาวน์โหลด PDF") + "</a></div></div>" : "") +
      '<div class="an-end" id="an-end"></div></div>' +
      (done ? '<div class="card an-ack-done">' + icon("check", "ic-sm") +
        " รับทราบแล้วเมื่อ " + anTime(mine && mine.read_at) +
        (mine && mine.read_duration_seconds ? " · ใช้เวลาอ่าน " + anDur(mine.read_duration_seconds) : "") +
        " · เวอร์ชัน " + esc((mine && mine.announcement_version_snapshot) || "-") + "</div>"
        : canAck ? '<div class="card an-ack-card" id="an-ack-card">' +
          '<label class="chk"><input type="checkbox" id="an-ack-chk" disabled> ' +
          "ข้าพเจ้าได้อ่านประกาศฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง</label>" +
          '<small class="muted" id="an-ack-hint">กรุณาเลื่อนอ่านจนจบก่อนจึงจะกดรับทราบได้</small>' +
          '<label class="field an-ack-pw"><span>รหัสผ่านของคุณ (ยืนยันตัวตน)</span>' +
          '<input type="password" id="an-ack-pw" autocomplete="current-password" placeholder="รหัสผ่านเข้าสู่ระบบ"></label>' +
          '<div class="toolbar"><button class="btn btn-primary" id="an-ack-btn" disabled>' +
          icon("check") + " รับทราบประกาศ</button></div>" +
          '<div class="form-error" id="an-ack-err" role="alert"></div></div>' : "");

    openModal(esc(a.title), body, "");
    if (a.file_url) anRenderDocx(a.file_url);
    if (!done && canAck) anBindAck(el, a);
  }

  function anBodyHtml(b) {
    var t = String(b == null ? "" : b);
    if (!t.trim()) return '<p class="muted">(ไม่มีเนื้อหา)</p>';
    return t.split(/\n{2,}/).map(function (p) {
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function anLoadMammoth() {
    return loadScriptOnce("mammoth", "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js", "mammoth");
  }
  function anLoadDocx() {
    return loadScriptOnce("docx", "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js", "docx");
  }
  function anRenderDocx(url) {
    var box = document.getElementById("an-docx"); if (!box) return;
    anLoadMammoth().then(function () {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("fetch " + r.status); return r.arrayBuffer();
      });
    }).then(function (buf) {
      return window.mammoth.convertToHtml({ arrayBuffer: buf });
    }).then(function (res) {
      if (box) box.innerHTML = '<div class="docx-html">' + (res.value || '<span class="muted">(เอกสารว่าง)</span>') + "</div>";
    })["catch"](function () {
      if (box) box.innerHTML = '<small class="muted">แสดงตัวอย่างเอกสารไม่ได้ — กดปุ่มดาวน์โหลดด้านล่าง</small>';
    });
  }

  function anBindAck(el, a) {
    var doc = document.getElementById("an-doc");
    var chk = document.getElementById("an-ack-chk");
    var pw = document.getElementById("an-ack-pw");
    var btn = document.getElementById("an-ack-btn");
    var hint = document.getElementById("an-ack-hint");
    if (!doc || !chk || !btn || !pw) return;
    function sync() { btn.disabled = !(anReadOk && chk.checked && pw.value.length > 0); }
    function unlock() {
      if (anReadOk) return;
      anReadOk = true; chk.disabled = false;
      if (hint) hint.textContent = "อ่านครบแล้ว — ติ๊กยืนยันและกรอกรหัสผ่านเพื่อรับทราบ";
      sbRpc("njhr_ea_audit", {
        p_token: sbToken(), p_id: a.id, p_event: "SCROLL_END", p_meta: null,
        p_ip: null, p_ua: navigator.userAgent || null,
        p_device: anDevice(), p_browser: anBrowser(), p_os: anOS()
      })["catch"](function () { });
      sync();
    }
    function check() { if (doc.scrollHeight - doc.scrollTop - doc.clientHeight <= 24) unlock(); }
    doc.addEventListener("scroll", check);
    setTimeout(function () { if (doc.scrollHeight <= doc.clientHeight + 8) unlock(); }, 120);
    chk.onchange = sync; pw.oninput = sync;
    btn.onclick = function () {
      if (!(anReadOk && chk.checked && pw.value)) return;
      var secs = anStart ? Math.max(0, Math.round((new Date() - anStart) / 1000)) : 0;
      var err = document.getElementById("an-ack-err"); if (err) err.textContent = "";
      withButtonLoading(btn, "กำลังบันทึก…", function () {
        return sbRpc("njhr_ea_ack", {
          p_token: sbToken(), p_id: a.id, p_password: pw.value,
          p_duration: secs, p_ip: null, p_ua: navigator.userAgent || null,
          p_device: anDevice(), p_browser: anBrowser(), p_os: anOS(),
          p_hash: null, p_started_at: anStart ? anStart.toISOString() : null
        }).then(function () {
          pw.value = "";
          toast("บันทึกการรับทราบแล้ว", "ok");
          closeModal(); anLoad(el);
        }, function (er) {
          pw.value = ""; sync();
          if (err) err.textContent = er.message || "บันทึกไม่สำเร็จ";
        });
      });
    };
  }

  /* ───────── [FIX 3] อัปโหลดผ่าน Edge Function ที่ตรวจ HR session จริง ─────────
     รูปแบบเดียวกับ njhr-req-file ของใบลา/OT ที่ใช้งานจริงอยู่แล้ว:
       1) ขอ signed upload url จาก njhr-ann-file (ส่ง token ของ HR ขึ้นไป)
       2) Edge Function เรียก RPC njhr_ea_upload_path ตรวจ session + Role ที่ฐานข้อมูล
       3) service_role ออก signed url ให้ → เบราว์เซอร์ PUT ไฟล์ตาม url นั้น
     ไม่พึ่ง policy anon ALL · ไม่เชื่อ role จาก Browser · path ของ HR อยู่ใต้ salary/ */
  function anUpload(file, kind) {
    if (!file) return Promise.resolve(null);
    if (!sbReady()) return Promise.reject(new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase"));
    var path = "";
    return fetch(SB.url + "/functions/v1/njhr-ann-file", {
      method: "POST",
      headers: { apikey: SB.key, Authorization: "Bearer " + SB.key, "Content-Type": "application/json" },
      body: JSON.stringify({ token: sbToken(), action: "upload-url", kind: kind, file_name: file.name })
    }).then(function (r) {
      return r.json()["catch"](function () { return {}; }).then(function (d) {
        if (!r.ok || !d.upload_url || !d.path) {
          njEdgeFail("njhr-ann-file", "upload-url", r.status,
            (d && d.error) || (r.ok ? "invalid response: missing " + njEdgeMissing("upload-url", d) : ""));
          throw njEdgeMark(new Error((d && d.error) || "ไม่สามารถขอสิทธิ์อัปโหลดไฟล์ประกาศได้"));
        }
        path = d.path;
        return fetch(d.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });
      });
    }).then(function (r) {
      if (!r.ok) return r.text()["catch"](function () { return ""; }).then(function (t) {
        njEdgeFail("njhr-ann-file", "signed-put", r.status, "");
        throw njEdgeMark(new Error("อัปโหลดไฟล์ไม่สำเร็จ: " + String(t).slice(0, 160)));
      });
      return {
        url: SB.url + "/storage/v1/object/public/" + AN_BUCKET + "/" + path,
        name: file.name, size: file.size
      };
    })["catch"](function (e) { throw njEdgeNet("njhr-ann-file", "upload", e); });
  }

  /* ───────── ฟอร์มสร้าง / แก้ไข ───────── */
  function anForm(el, id) {
    if (!anCan()) { toast("ไม่มีสิทธิ์จัดการประกาศ", "bad"); return; }
    anDocxFile = null; anPdfFile = null;
    Promise.all([
      anDeptLoad(),
      id ? sbRpc("njhr_ea_get", { p_token: sbToken(), p_id: id }).then(function (r) { return r && r.data; }) : Promise.resolve(null)
    ]).then(function (res) {
      var depts = res[0] || [], d = res[1], a = (d && d.ann) || {};
      var sel = anTargets(a) || [];
      openModal(id ? "แก้ไขประกาศ" : "เพิ่มประกาศ",
        /* [RUN-138] คอลัมน์เดียวเต็มความกว้าง เรียงตามลำดับที่ใช้งานจริง
           หัวข้อ -> หมวดหมู่ -> แผนกผู้รับ -> เนื้อหา -> วันที่มีผล -> ไฟล์แนบ -> ตัวเลือก
           เปลี่ยนเฉพาะการจัดวาง/ข้อความ label ไม่แตะ id · validation · save flow */
        '<div class="form-grid an-form">' +
        '<label class="field"><span>หัวข้อประกาศ *</span><input id="an-f-title" value="' + esc(a.title || "") + '"></label>' +
        '<label class="field"><span>หมวดหมู่</span><div class="chips" id="an-f-cat">' +
        AN_CATS.map(function (c) {
          return '<span class="chip pick' + ((a.category || "ข่าวสาร") === c ? " on" : "") + '" data-v="' + esc(c) + '">' + esc(c) + "</span>";
        }).join("") + "</div></label>" +
        '<label class="field"><span>แผนกผู้รับประกาศ' +
        '<small class="muted an-hint">"ทุกแผนก" = พนักงานทุกคนเห็น · เลือกแผนก = เฉพาะแผนกนั้นเห็น</small></span>' +
        '<div class="chips" id="an-f-dept">' +
        '<span class="chip pick' + (sel.length ? "" : " on") + '" data-v="__ALL__">ทุกแผนก</span>' +
        depts.map(function (x) {
          return '<span class="chip pick' + (sel.indexOf(x.department) >= 0 ? " on" : "") + '" data-v="' +
            esc(x.department) + '">' + esc(x.department) + " (" + x.emp_count + ")</span>";
        }).join("") + "</div></label>" +
        '<label class="field"><span>เนื้อหา</span><textarea id="an-f-body" rows="8">' + esc(a.body || "") + "</textarea></label>" +
        '<label class="field"><span>วันที่มีผล</span><input type="date" id="an-f-eff" value="' +
        esc(String(a.effective_date || "").slice(0, 10)) + '"></label>' +
        '<div id="an-f-files"' + (AN_FILE_CAT === (a.category || "ข่าวสาร") ? "" : " hidden") + '>' +
        '<label class="field"><span>ไฟล์ Word (.docx)</span><input type="file" id="an-f-doc" accept=".docx">' +
        '<small class="muted" id="an-f-docn">' + (a.file_name ? "ไฟล์ปัจจุบัน: " + esc(a.file_name) : "ยังไม่มีไฟล์") + "</small></label>" +
        '<label class="field"><span>ไฟล์ PDF (.pdf)</span><input type="file" id="an-f-pdf" accept=".pdf">' +
        '<small class="muted" id="an-f-pdfn">' + (a.pdf_file_name ? "ไฟล์ปัจจุบัน: " + esc(a.pdf_file_name) : "ยังไม่มีไฟล์") + "</small></label>" +
        '<small class="muted">แนบไฟล์ได้เฉพาะหมวด "' + esc(AN_FILE_CAT) + '" ตามระบบต้นทาง</small></div>' +
        '<div class="an-f-opts">' +
        '<label class="chk"><input type="checkbox" id="an-f-sign"' + (a.require_sign ? " checked" : "") + "> ต้องกดรับทราบ</label>" +
        '<label class="chk"><input type="checkbox" id="an-f-pin"' + (a.pinned ? " checked" : "") + "> ปักหมุดด้านบน</label>" +
        (id ? '<label class="chk"><input type="checkbox" id="an-f-ver"> ออกเวอร์ชันใหม่ (ผู้ที่รับทราบแล้วต้องรับทราบใหม่)</label>' : "") +
        "</div>" +
        '<div class="form-error" id="an-f-err" role="alert"></div></div>',
        '<button class="btn btn-ghost" id="an-f-cancel">ยกเลิก</button>' +
        '<button class="btn btn-primary" id="an-f-save">' + icon("check") + " บันทึก</button>",
        { wide: true });

      document.getElementById("an-f-cancel").onclick = closeModal;
      var catBox = document.getElementById("an-f-cat");
      var filesBox = document.getElementById("an-f-files");
      function anSyncFileBox() {
        var on = catBox.querySelector(".chip.on");
        var show = !!on && on.dataset.v === AN_FILE_CAT;
        if (filesBox) filesBox.hidden = !show;
        if (!show) {
          anDocxFile = null; anPdfFile = null;
          var fd = document.getElementById("an-f-doc"), fp = document.getElementById("an-f-pdf");
          if (fd) fd.value = ""; if (fp) fp.value = "";
        }
      }
      catBox.querySelectorAll(".chip").forEach(function (c) {
        c.onclick = function () {
          catBox.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); });
          c.classList.add("on");
          anSyncFileBox();
        };
      });
      anSyncFileBox();
      var dBox = document.getElementById("an-f-dept");
      dBox.querySelectorAll(".chip").forEach(function (c) {
        c.onclick = function () {
          var all = dBox.querySelector('[data-v="__ALL__"]');
          if (c.dataset.v === "__ALL__") {
            dBox.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); });
            c.classList.add("on"); return;
          }
          c.classList.toggle("on"); if (all) all.classList.remove("on");
          var any = Array.prototype.some.call(dBox.querySelectorAll(".chip"), function (x) {
            return x.dataset.v !== "__ALL__" && x.classList.contains("on");
          });
          if (!any && all) all.classList.add("on");
        };
      });
      var fDoc = document.getElementById("an-f-doc"), fPdf = document.getElementById("an-f-pdf");
      fDoc.onchange = function () {
        var f = this.files && this.files[0];
        if (f && !/\.docx$/i.test(f.name)) { toast("รองรับเฉพาะไฟล์ Word (.docx)", "bad"); this.value = ""; anDocxFile = null; return; }
        anDocxFile = f || null;
        document.getElementById("an-f-docn").textContent = f ? "เลือกแล้ว: " + f.name : "ยังไม่มีไฟล์";
      };
      fPdf.onchange = function () {
        var f = this.files && this.files[0];
        if (f && !/\.pdf$/i.test(f.name)) { toast("รองรับเฉพาะไฟล์ PDF (.pdf)", "bad"); this.value = ""; anPdfFile = null; return; }
        anPdfFile = f || null;
        document.getElementById("an-f-pdfn").textContent = f ? "เลือกแล้ว: " + f.name : "ยังไม่มีไฟล์";
      };

      document.getElementById("an-f-save").onclick = function () {
        var btn = this, err = document.getElementById("an-f-err");
        var title = document.getElementById("an-f-title").value.trim();
        if (!title) { err.textContent = "กรุณาระบุหัวข้อประกาศ"; return; }
        var cat = (catBox.querySelector(".chip.on") || {}).dataset;
        var allOn = dBox.querySelector('[data-v="__ALL__"]').classList.contains("on");
        var tg = allOn ? null : Array.prototype.slice.call(dBox.querySelectorAll(".chip.on"))
          .map(function (x) { return x.dataset.v; }).filter(function (v) { return v && v !== "__ALL__"; }).join(",");
        var vchk = document.getElementById("an-f-ver");
        err.textContent = "";
        withButtonLoading(btn, "กำลังบันทึก…", function () {
          return Promise.all([anUpload(anDocxFile, "docx"), anUpload(anPdfFile, "pdf")])
            .then(function (up) {
              var w = up[0], p = up[1];
              return sbRpc("njhr_ea_save", {
                p_token: sbToken(), p_id: id || null, p_title: title,
                p_category: (cat && cat.v) || "ข่าวสาร",
                p_body: document.getElementById("an-f-body").value,
                p_require_sign: document.getElementById("an-f-sign").checked,
                p_pinned: document.getElementById("an-f-pin").checked,
                p_effective_date: document.getElementById("an-f-eff").value || null,
                p_target_departments: tg || null,
                /* [FIX 5] ไม่เลือกไฟล์ใหม่ → ส่ง null · SQL จะ coalesce คงไฟล์เดิม */
                p_file_url: w ? w.url : null, p_file_name: w ? w.name : null, p_file_size: w ? w.size : null,
                p_pdf_file_url: p ? p.url : null, p_pdf_file_name: p ? p.name : null, p_pdf_file_size: p ? p.size : null,
                p_publish: true,
                p_new_version: !!(vchk && vchk.checked)
              });
            }).then(function () {
              toast(id ? "บันทึกประกาศแล้ว" : "เพิ่มประกาศแล้ว", "ok");
              anDocxFile = null; anPdfFile = null;
              closeModal(); anLoad(el);
            }, function (er) { err.textContent = er.message || "บันทึกไม่สำเร็จ"; });
        });
      };
    })["catch"](function (er) { toast(er.message || "เปิดฟอร์มไม่สำเร็จ", "bad"); });
  }

  /* ───────── ผู้รับทราบ ───────── */
  function anReaders(id, keepOpen) {
    anRdrOpenId = id;
    if (!keepOpen) openModal("รายชื่อผู้รับทราบ", '<div class="ta-c"><span class="spinner"></span></div>', "");
    Promise.all([
      sbRpcList("njhr_ea_readers", { p_token: sbToken(), p_id: id }),
      sbRpcList("njhr_ea_dept_report", { p_token: sbToken(), p_id: id })
    ]).then(function (res) {
      var rows = res[0] || [], dep = res[1] || [];
      var done = rows.filter(function (r) { return r.has_read; });
      var stale = rows.filter(function (r) { return r.stale_version; });
      var pend = rows.filter(function (r) { return !r.has_read && !r.stale_version; });
      openModal("รายชื่อผู้รับทราบ",
        '<div class="an-rdr">' +
        '<div class="toolbar"><span class="chip chip-ok">รับทราบแล้ว ' + done.length + "</span>" +
        '<span class="chip chip-bad">ค้างเวอร์ชันเก่า ' + stale.length + "</span>" +
        '<span class="chip chip-warn">ยังไม่รับทราบ ' + pend.length + "</span>" +
        '<span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="an-rdr-xls">' + icon("download") + " Excel</button>" +
        '<button class="btn btn-ghost btn-sm" id="an-rdr-csv">' + icon("download") + " CSV</button></div>" +
        '<div class="table-wrap"><table><thead><tr><th>แผนก</th><th class="ta-r">ทั้งหมด</th>' +
        '<th class="ta-r">รับทราบแล้ว</th><th class="ta-r">ค้างเวอร์ชันเก่า</th><th class="ta-r">คงเหลือ</th></tr></thead><tbody>' +
        dep.map(function (d) {
          return "<tr><td>" + esc(d.department) + '</td><td class="ta-r">' + d.total +
            '</td><td class="ta-r">' + d.readed + '</td><td class="ta-r">' + (d.stale || 0) +
            '</td><td class="ta-r">' + (d.total - d.readed) + "</td></tr>";
        }).join("") + "</tbody></table></div>" +
        '<div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>แผนก</th>' +
        "<th>สถานะ</th><th>เวอร์ชัน</th><th>เวลารับทราบ</th><th>ใช้เวลา</th><th>อุปกรณ์</th></tr></thead><tbody>" +
        rows.map(function (r) {
          return "<tr><td>" + esc(r.emp_code) + "</td><td>" + esc(r.full_name) + "</td><td>" + esc(r.department) + "</td>" +
            "<td>" + (r.has_read ? '<span class="chip chip-ok">รับทราบแล้ว</span>'
              : r.stale_version ? '<span class="chip chip-bad">ค้างเวอร์ชันเก่า</span>'
                : '<span class="chip chip-warn">ยังไม่รับทราบ</span>') + "</td>" +
            "<td>" + esc(r.version_snapshot || "—") + "</td>" +
            "<td>" + (r.read_at ? anTime(r.read_at) : "—") + "</td>" +
            "<td>" + (r.read_at ? anDur(r.duration_seconds) : "—") + "</td>" +
            "<td>" + esc(r.device || "—") + "</td></tr>";
        }).join("") + "</tbody></table></div></div>", "");

      function rdrRows() {
        return rows.map(function (r) {
          return [r.emp_code, r.full_name, r.department,
            r.has_read ? "รับทราบแล้ว" : r.stale_version ? "ค้างเวอร์ชันเก่า" : "ยังไม่รับทราบ",
            r.version_snapshot || "", r.read_at ? anTime(r.read_at) : "",
            r.duration_seconds || 0, r.device || ""];
        });
      }
      var HEAD = ["รหัสพนักงาน", "ชื่อ-สกุล", "แผนก", "สถานะ", "เวอร์ชันที่รับทราบ", "เวลารับทราบ", "ใช้เวลา (วินาที)", "อุปกรณ์"];
      var xb = document.getElementById("an-rdr-xls");
      if (xb) xb.onclick = function () {
        var b = this;
        withButtonLoading(b, "กำลังสร้างไฟล์…", function () {
          return rptLoadZip().then(function () {
            return rptBuildXlsx("ผู้รับทราบ", HEAD, rdrRows(), [14, 28, 22, 18, 16, 20, 16, 14],
              ["รายชื่อผู้รับทราบประกาศ"]);
          }).then(function (blob) {
            var a2 = document.createElement("a");
            a2.href = URL.createObjectURL(blob);
            a2.download = rptSafeName("ผู้รับทราบประกาศ") + ".xlsx";
            document.body.appendChild(a2); a2.click(); a2.remove();
            setTimeout(function () { URL.revokeObjectURL(a2.href); }, 800);
          })["catch"](function (er) { toast(er.message || "สร้าง Excel ไม่สำเร็จ", "bad"); });
        });
      };
      var cb = document.getElementById("an-rdr-csv");
      if (cb) cb.onclick = function () { downloadCSV("ผู้รับทราบประกาศ.csv", [HEAD].concat(rdrRows())); };
    })["catch"](function (er) {
      openModal("รายชื่อผู้รับทราบ", '<div class="form-error" role="alert">' +
        esc(er.message || "โหลดไม่สำเร็จ") + "</div>", "");
    });
  }

  /* ───────── Actions ───────── */
  function anToggle(el, id, to) {
    sbRpc("njhr_ea_toggle", { p_token: sbToken(), p_id: id, p_status: to, p_pinned: null })
      .then(function () { toast(to === "OPEN" ? "เปิดรับทราบแล้ว" : "ปิดรับทราบแล้ว", "ok"); anLoad(el); },
        function (er) { toast(er.message || "ไม่สำเร็จ", "bad"); });
  }
  function anPin(el, id, on) {
    sbRpc("njhr_ea_toggle", { p_token: sbToken(), p_id: id, p_status: null, p_pinned: on })
      .then(function () { toast(on ? "ปักหมุดแล้ว" : "เลิกปักหมุดแล้ว", "ok"); anLoad(el); },
        function (er) { toast(er.message || "ไม่สำเร็จ", "bad"); });
  }
  function anDelete(el, id) {
    confirmDialog("ลบประกาศ",
      "ลบประกาศนี้ถาวร รวมถึงประวัติการรับทราบทั้งหมด — ยืนยันหรือไม่", "ลบถาวร",
      function () {
        return sbRpc("njhr_ea_delete", { p_token: sbToken(), p_id: id, p_reason: null })
          .then(function () { toast("ลบประกาศแล้ว", "info"); closeModal(); anLoad(el); },
            function (er) { toast(er.message || "ลบไม่สำเร็จ", "bad"); });
      }, true);
  }

  /* ───────── [FIX 6] EXPORT ───────── */
  function anXlsRows(list) {
    return list.map(function (a) {
      var st = anStat(a), tg = anTargets(a);
      return [a.ann_no || "", a.title, a.category, a.version,
        a.status === "OPEN" ? "เปิดรับทราบ" : "ปิดแล้ว",
        tg ? tg.join(" / ") : "ทุกแผนก",
        anDate(a.published_at || a.created_at), anDate(a.effective_date),
        a.created_name || a.created_by || "", st.numer, st.denom, st.pct + "%"];
    });
  }
  var AN_XLS_HEAD = ["เลขที่ประกาศ", "หัวข้อ", "หมวด", "เวอร์ชัน", "สถานะ", "แผนกผู้รับ",
    "วันที่ประกาศ", "วันที่มีผล", "ผู้สร้าง", "รับทราบแล้ว", "เป้าหมาย", "%"];

  function anExportXlsx(btn, list) {
    withButtonLoading(btn, "กำลังสร้างไฟล์…", function () {
      return rptLoadZip().then(function () {
        return rptBuildXlsx("ประกาศบริษัท", AN_XLS_HEAD, anXlsRows(list),
          [18, 40, 16, 10, 14, 28, 14, 14, 20, 12, 12, 8], ["รายการประกาศบริษัท"]);
      }).then(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = rptSafeName("ประกาศบริษัท") + ".xlsx";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
      })["catch"](function (er) { toast(er.message || "สร้าง Excel ไม่สำเร็จ", "bad"); });
    });
  }
  function anExportCsv(list) {
    downloadCSV("ประกาศบริษัท.csv", [AN_XLS_HEAD].concat(anXlsRows(list)));
  }

  /* Export Word ของประกาศฉบับเดียว */
  /* [FIX 5] Export Word ให้ใกล้รูปแบบเอกสารของ SOURCE:
     หัวจดหมายชื่อบริษัท · ฟอนต์ TH Sarabun New · Header/Footer · เลขหน้า */
  function anExportWord(btn, id) {
    withButtonLoading(btn, "กำลังสร้าง Word…", function () {
      return Promise.all([
        sbRpc("njhr_ea_get", { p_token: sbToken(), p_id: id }).then(function (r) { return r && r.data; }),
        anLoadDocx()
      ]).then(function (res) {
        var d = res[0]; if (!d || !d.ann) throw new Error("ไม่พบประกาศนี้");
        var a = d.ann, D = window.docx, tg = anTargets(a);
        var COMPANY = NJ_COMPANY_NAME;
        try { COMPANY = (njCompanyParts() || {}).full || NJ_COMPANY_NAME; } catch (e) { }

        function P(text, opt) {
          opt = opt || {};
          return new D.Paragraph({
            spacing: { after: opt.after == null ? 120 : opt.after },
            alignment: opt.align,
            border: opt.rule ? { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: "999999", space: 6 } } : undefined,
            children: [new D.TextRun({
              text: String(text == null ? "" : text),
              bold: !!opt.bold, size: opt.size || 32, color: opt.color
            })]
          });
        }
        var AL = D.AlignmentType;

        /* หัวจดหมาย */
        var head = [
          P(COMPANY, { bold: true, size: 40, align: AL.CENTER, after: 0 }),
          P("ประกาศบริษัท", { bold: true, size: 32, align: AL.CENTER, after: 60, rule: true }),
          P("เลขที่ " + (d.ann_no || "") + "        วันที่ " + anDate(a.published_at || a.created_at),
            { align: AL.RIGHT, size: 28, after: 200 })
        ];

        var kids = head.concat([
          P("เรื่อง  " + (a.title || ""), { bold: true, size: 34, after: 160 }),
          P("หมวด: " + (a.category || "") + "        เวอร์ชัน: " + (a.version || "1.0") +
            (a.effective_date ? "        มีผลวันที่: " + anDate(a.effective_date) : ""), { size: 28 }),
          P("เรียน: " + (tg ? tg.join(", ") : "พนักงานทุกแผนก"), { size: 28, after: 220 })
        ]);

        String(a.body || "").split(/\n/).forEach(function (line) {
          kids.push(P(line, { after: line.trim() ? 120 : 60 }));
        });

        kids.push(P("", { after: 320 }));
        kids.push(P("ประกาศ ณ วันที่ " + anDate(a.published_at || a.created_at), { align: AL.RIGHT, size: 28, after: 240 }));
        kids.push(P("(" + (a.created_name || a.created_by || "") + ")", { align: AL.RIGHT, size: 28, after: 0 }));
        kids.push(P("ผู้ออกประกาศ", { align: AL.RIGHT, size: 28 }));

        var doc = new D.Document({
          styles: { default: { document: { run: { font: "TH Sarabun New", size: 32 } } } },
          sections: [{
            properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 } } },
            headers: {
              default: new D.Header({
                children: [P(COMPANY + "  ·  " + (d.ann_no || ""), { size: 22, color: "777777", align: AL.RIGHT })]
              })
            },
            footers: {
              default: new D.Footer({
                children: [new D.Paragraph({
                  alignment: AL.CENTER,
                  children: [
                    new D.TextRun({ text: "หน้า ", size: 22, color: "777777" }),
                    new D.TextRun({ children: [D.PageNumber.CURRENT], size: 22, color: "777777" }),
                    new D.TextRun({ text: " / ", size: 22, color: "777777" }),
                    new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], size: 22, color: "777777" })
                  ]
                })]
              })
            },
            children: kids
          }]
        });
        return D.Packer.toBlob(doc).then(function (blob) {
          var el2 = document.createElement("a");
          el2.href = URL.createObjectURL(blob);
          el2.download = rptSafeName((d.ann_no || "ประกาศ") + " " + a.title) + ".docx";
          document.body.appendChild(el2); el2.click(); el2.remove();
          setTimeout(function () { URL.revokeObjectURL(el2.href); }, 800);
        });
      })["catch"](function (er) { toast(er.message || "สร้าง Word ไม่สำเร็จ", "bad"); });
    });
  }

  NJHR.views.register("viewAnnBoard", viewAnnBoard);
  NJHR.views.register("viewAnnDone", viewAnnDone);
})();
