import{m as RPC}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";import{a as LX}from"./chunk-LAFWE2EM.js";import{files723 as XF}from"./xp-X717.js";
/* ═══ V.723 · CASH ADVANCE → EXPENSES : รายงานค่าใช้จ่ายนอกราคาขายจาก DOCUMENT → SERVICE (หัวข้อ 5)
   ข้อมูล : RPC อ่านอย่างเดียว njacc_exp723_list (RUN-723) — เฉพาะ JOB ที่ POST แล้ว · 1 รายการ = 1 แถว · ข้อมูลล่าสุดทุกครั้ง (ไม่บันทึกสถานะ)
   เก็บลูกค้าแล้ว = INVOICE SERVICE ที่ POST แล้วของ JOB เดียวกัน มีบรรทัด DESCRIPTION ตรง + AMOUNT = เก็บลูกค้าได้ (จับคู่ 1 : 1 ที่ Server) · ไม่ใช่การรับชำระเงิน
   ไฟล์ : อ้างอิงไฟล์เดิมของ DOCUMENT (Storage private njacc-job-xp · Signed URL ตามสิทธิ์) · ลบ = njacc_exp723_hide (ซ่อนจาก EXPENSES เท่านั้น · Audit)
   สิทธิ์ : SUPER_ADMIN (ตรวจที่ Server ทุกครั้ง) · ไม่แตะ DOCUMENT / ACCOUNTING / INVOICE / FINANCE / CASH ADVANCE เดิม ═══ */
var XURL = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
var S = null;
var IC = {
  coin: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 9.2c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V12c0 1.4-3.1 2.6-7 2.6S5 13.4 5 12z"/><path d="M5 15c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v2.8c0 1.4-3.1 2.6-7 2.6s-7-1.2-7-2.6z"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg>',
  q: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  clr: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/></svg>',
  rf: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  xl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  dl: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  del: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dts(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear(); }
function kb(n) { n = Number(n) || 0; return n >= 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
function errMsg(e) {
  var m = String(e && (e.message || e.code) || e || "");
  if (/NJACC_EXP723_FORBIDDEN/.test(m)) return "EXPENSES : ไม่มีสิทธิ์เข้าเมนูนี้ (เฉพาะ SUPER_ADMIN)";
  if (/NJACC_EXP723_NOT_FOUND/.test(m)) return "ไม่พบรายการ — โหลดข้อมูลใหม่";
  if (/njacc_exp723|PGRST202|Could not find the function/i.test(m)) return "ระบบ EXPENSES ยังไม่พร้อม (ยังไม่ได้รัน RUN-723)";
  if (/NJACC_NO_PROFILE/.test(m)) return "ไม่พบข้อมูลผู้ใช้ — กรุณาเข้าสู่ระบบใหม่";
  return m || "เกิดข้อผิดพลาด";
}
function css() {
  if (document.getElementById("ex723-css")) return;
  var s = document.createElement("style"); s.id = "ex723-css";
  s.textContent = [
    ".ex7{padding:14px 18px 24px;color:#0f172a;font-size:13px;max-width:100%;box-sizing:border-box}",
    ".ex7-hd{display:flex;align-items:center;gap:12px;margin:0 0 12px;flex-wrap:wrap}.ex7-ic{width:46px;height:46px;border-radius:10px;background:#1d4ed8;color:#fff;display:flex;align-items:center;justify-content:center;flex:none}",
    ".ex7-tt b{display:block;font-size:22px;font-weight:800;color:#1e3a8a;letter-spacing:.3px;line-height:1.1}.ex7-tt small{display:block;font-size:13.5px;font-weight:700;color:#1d4ed8;margin-top:2px}",
    ".ex7-bc{margin-left:auto;display:flex;align-items:center;gap:8px;font-weight:800;color:#1e3a8a;font-size:14px}.ex7-bc a{color:#1e3a8a;text-decoration:none;display:inline-flex}.ex7-bc i{font-style:normal;color:#64748b}",
    ".ex7-fc{border:1px solid #D9E2EC;border-radius:12px;background:#f8fbff;padding:10px 12px 12px;margin:0 0 12px}.ex7-fc h3{margin:0 0 6px;font-size:14px;color:#1d4ed8;display:flex;align-items:center;gap:6px}",
    ".ex7-f{display:flex;align-items:flex-end;gap:8px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px}.ex7-f label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#0f172a;flex:none}",
    ".ex7-f select,.ex7-f input{height:36px;border:1px solid #cbd5e1;border-radius:8px;padding:0 10px;font-size:13px;font-family:inherit;background:#fff;color:#0f172a;box-sizing:border-box}",
    ".ex7-f .co select{width:165px}.ex7-f .dt input{width:130px}.ex7-f .st select{width:124px}.ex7-f .qq{flex:1 1 300px;min-width:190px}.ex7-f .qq input{width:100%}",
    ".ex7-f .qw{position:relative}.ex7-f .qw svg{position:absolute;left:9px;top:10px;color:#475569}.ex7-f .qw input{padding-left:32px}",
    ".ex7-b{height:36px;border-radius:8px;border:1px solid #1d4ed8;background:#fff;color:#1d4ed8;font-weight:700;font-size:13px;padding:0 11px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-family:inherit;white-space:nowrap;flex:none}",
    ".ex7-b.p{background:#1d4ed8;color:#fff}.ex7-b.g{background:#16a34a;border-color:#16a34a;color:#fff}.ex7-b:disabled{opacity:.55;cursor:default}",
    ".ex7-tw{border:1px solid #D9E2EC;border-radius:12px;overflow:auto;background:#fff;max-width:100%}",
    ".ex7-t{width:100%;min-width:1180px;border-collapse:collapse;font-size:13px}",
    ".ex7-t th,.ex7-t td{border:1px solid #D9E2EC;padding:6px 8px;vertical-align:middle}.ex7-t tr>:first-child{border-left:0}.ex7-t tr>:last-child{border-right:0}.ex7-t thead th{border-top:0}.ex7-t tfoot tr:last-child td{border-bottom:0}",
    ".ex7-t thead th{background:#1e3a8a;color:#fff;font-weight:700;text-align:center;white-space:nowrap;border-color:#2c4a9a}",
    ".ex7-t td.r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.ex7-t td.c{text-align:center}.ex7-t td.nw{white-space:nowrap}",
    ".ex7-t tbody tr[data-i]{cursor:pointer}.ex7-t tbody tr[data-i]:hover td,.ex7-t tbody tr[data-i]:focus-within td,.ex7-t tbody tr[data-i]:focus td{background:#eaf3ff}.ex7-t tbody tr[data-i]:focus{outline:2px solid #1d4ed8;outline-offset:-2px}",
    ".ex7-t tfoot td{background:#e8f1fd;font-weight:800}.ex7-t a{color:#1d4ed8;font-weight:700}",
    ".ex7-el{display:block;max-width:240px;overflow-wrap:anywhere}.ex7-em{text-align:center;color:#64748b;padding:18px!important}",
    ".ex7-bd{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:6px;font-size:12px;font-weight:800;white-space:nowrap}.ex7-bd.g{background:#16a34a;color:#fff}.ex7-bd.o{background:#f59e0b;color:#fff}",
    ".ex7-act{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap}.ex7-ab{height:28px;border-radius:6px;padding:0 10px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;white-space:nowrap;border:1px solid}",
    ".ex7-ab.v{color:#1d4ed8;border-color:#93c5fd;background:#fff}.ex7-ab.d{color:#15803d;border-color:#86efac;background:#fff}.ex7-ab.x{color:#fff;border-color:#dc2626;background:#dc2626}.ex7-ab:disabled{opacity:.4;cursor:not-allowed}",
    ".ex7-pg{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;font-size:13px}.ex7-pg select{height:32px;border:1px solid #cbd5e1;border-radius:7px;padding:0 6px;font-family:inherit}",
    ".ex7-pn{margin-left:auto;display:flex;gap:6px}.ex7-pn button{min-width:34px;height:32px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;cursor:pointer;font-weight:700;font-family:inherit}.ex7-pn button.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}.ex7-pn button:disabled{opacity:.45;cursor:default}",
    ".ex7-err{padding:10px 12px;border-radius:8px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;margin:0 0 10px}",
    ".ex7-ov{position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px}",
    ".ex7-md{background:#fff;border-radius:12px;width:min(720px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,.3)}",
    ".ex7-mh{display:flex;align-items:center;gap:8px;padding:12px 18px;background:#eaf3ff;border-bottom:1px solid #D9E2EC}.ex7-mh b{flex:1;font-size:15px;color:#1e3a8a}.ex7-mx{width:32px;height:32px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;cursor:pointer;font-size:18px;line-height:1}",
    ".ex7-mb{padding:14px 18px;overflow:auto;min-height:0}.ex7-dl{display:grid;grid-template-columns:170px minmax(0,1fr);gap:6px 14px;margin:0}.ex7-dl dt{color:#64748b}.ex7-dl dd{margin:0;font-weight:700;overflow-wrap:anywhere}",
    ".ex7-fl{list-style:none;padding:0;margin:4px 0 0;display:flex;flex-direction:column;gap:6px}.ex7-fl li{display:flex;align-items:center;gap:8px;border:1px solid #D9E2EC;border-radius:8px;padding:6px 8px}.ex7-fl li span{flex:1;min-width:0;overflow-wrap:anywhere}",
    ".ex7-mf{display:flex;justify-content:flex-end;padding:10px 18px;border-top:1px solid #D9E2EC;background:#f8fafc}",
    "@media (max-width:760px){.ex7{padding:10px}.ex7-bc{margin-left:0;font-size:12.5px}.ex7-f{flex-wrap:wrap}.ex7-f label,.ex7-f .qq{flex:1 1 100%}.ex7-f .co select,.ex7-f .dt input,.ex7-f .st select{width:100%}.ex7-f .dt{flex:1 1 45%!important}.ex7-pn{margin-left:0}.ex7-dl{grid-template-columns:120px minmax(0,1fr)}}"
  ].join("");
  document.head.appendChild(s);
}
function rpc(n, a) { return RPC(n, a); }
function params(lim, off) { var f = S.f; return { company_id: f.company_id || null, date_from: f.date_from || null, date_to: f.date_to || null, status: f.status || "ALL", q: f.q || null, limit: lim, offset: off }; }
function badge(x) { return x.billed ? '<span class="ex7-bd g">✓ เก็บลูกค้าแล้ว</span>' : '<span class="ex7-bd o">◷ รอเก็บลูกค้า</span>'; }
function invNo(x) { return x.billed ? x.match_no : x.inv_nos; }
function shell() {
  var mob = typeof window !== "undefined" && window.__NJ_MOBILE;
  return '<div class="ex7"><div class="ex7-hd"><span class="ex7-ic">' + IC.coin + '</span><div class="ex7-tt"><b>EXPENSES</b><small>รายงานค่าใช้จ่ายนอกราคาขายจาก DOCUMENT → SERVICE</small></div>' +
    '<nav class="ex7-bc" aria-label="breadcrumb"><a href="#/' + (mob ? "cash-advance" : "") + '" title="หน้าแรก">' + IC.home + '</a><i>›</i><a href="#/cash-advance">CASH ADVANCE</a><i>›</i><span>EXPENSES</span></nav></div>' +
    '<div class="ex7-fc"><h3>' + IC.q + 'ค้นหา / ตัวกรองข้อมูล</h3><form class="ex7-f" data-f autocomplete="off">' +
    '<label class="co">บริษัท (Company)<select name="company_id"><option value="">- ทุกบริษัท -</option></select></label>' +
    '<label class="dt">วันที่ POST<input type="date" name="date_from"></label><label class="dt">ถึงวันที่<input type="date" name="date_to"></label>' +
    '<label class="st">สถานะเก็บลูกค้า<select name="status"><option value="ALL">ทั้งหมด</option><option value="BILLED">เก็บลูกค้าแล้ว</option><option value="PENDING">รอเก็บลูกค้า</option></select></label>' +
    '<label class="qq">ค้นหาทุกหัวข้อ<span class="qw">' + IC.q + '<input name="q" maxlength="120" placeholder="ค้นหา JOB / บริษัท / ลูกค้า / House / รายละเอียด / INVOICE NJ / ชื่อไฟล์"></span></label>' +
    '<button type="submit" class="ex7-b p">' + IC.q + 'ค้นหา</button><button type="button" class="ex7-b" data-clr>' + IC.clr + 'ล้างตัวกรอง</button>' +
    '<button type="button" class="ex7-b" data-rf>' + IC.rf + 'Refresh</button><button type="button" class="ex7-b g" data-xl>' + IC.xl + 'EXPORT EXCEL</button></form></div>' +
    '<div data-body></div></div>';
}
function rowHTML(x, i) {
  var nf = (x.files || []).length, no = S.off + i + 1;
  return '<tr data-i="' + i + '" tabindex="0"><td class="c">' + no + '</td><td class="nw"><a href="#/job/' + esc(x.job_id) + '" data-lk>' + esc(x.job_no) + "</a></td>" +
    '<td><span class="ex7-el">' + esc(x.company || "-") + '</span></td><td><span class="ex7-el">' + esc(x.customer || "-") + '</span></td><td class="nw">' + esc(x.hbl || "-") + "</td>" +
    '<td><span class="ex7-el">' + esc(x.description) + '</span></td><td class="r">' + fm(x.pay_amount) + '</td><td class="r">' + fm(x.collect_amount) + '</td><td class="c">' + badge(x) + '</td><td class="nw c">' + esc(invNo(x) || "-") + "</td>" +
    '<td><div class="ex7-act">' +   /* V.727 : List View แสดงเฉพาะปุ่มลบ — ดูไฟล์ / โหลดไฟล์ อยู่ในหน้าต่างรายละเอียด EXPENSES */
    '<button type="button" class="ex7-ab x" data-a="x" title="ลบออกจาก EXPENSES">' + IC.del + "ลบ</button></div></td></tr>";
}
function bodyHTML() {
  var H = ["#", "JOB No.", "Company", "Customer", "House B/L", "รายละเอียด", "ยอดเงิน", "เก็บลูกค้าได้", "เก็บลูกค้าแล้ว", "INVOICE NJ", "จัดการ"];
  var W = [44, 130, 0, 0, 130, 0, 110, 110, 130, 130, 84];   /* V.727 : คอลัมน์จัดการ = ปุ่มลบปุ่มเดียว */
  var rows = S.rows.map(rowHTML).join(""), sm = S.sum || {};
  var n = Math.max(1, Math.ceil((S.total || 0) / S.lim)), c = Math.floor(S.off / S.lim) + 1, from = S.total ? S.off + 1 : 0, to = S.off + S.rows.length, pg = [], k;
  for (k = 1; k <= n; k++) if (k === 1 || k === n || Math.abs(k - c) <= 2) pg.push(k); else if (pg[pg.length - 1] !== "…") pg.push("…");
  return (S.err ? '<div class="ex7-err">' + esc(S.err) + "</div>" : "") +
    '<div class="ex7-tw"><table class="ex7-t"><thead><tr>' + H.map(function (h, j) { return "<th" + (W[j] ? ' style="width:' + W[j] + 'px"' : "") + ">" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
    (rows || '<tr><td colspan="11" class="ex7-em">' + (S.loading ? "กำลังโหลด…" : "ไม่มีรายการ") + "</td></tr>") + "</tbody>" +
    '<tfoot><tr><td colspan="6" class="c">รวม</td><td class="r">' + fm(sm.pay) + '</td><td class="r">' + fm(sm.collect) + '</td><td class="r" title="ยอดเก็บลูกค้าได้ที่ตรงกับ INVOICE แล้ว">' + fm(sm.billed) + "</td><td></td><td></td></tr></tfoot></table></div>" +
    '<div class="ex7-pg">แสดง <select data-lim>' + [10, 20, 50, 100].map(function (v) { return '<option value="' + v + '"' + (S.lim === v ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select> รายการต่อหน้า" +
    "<span>แสดง " + from + " - " + to + " จาก " + (S.total || 0) + ' รายการ</span><span class="ex7-pn"><button type="button" data-pg="1"' + (c <= 1 ? " disabled" : "") + ' aria-label="หน้าแรก">«</button><button type="button" data-pg="' + (c - 1) + '"' + (c <= 1 ? " disabled" : "") + ' aria-label="ก่อนหน้า">‹</button>' +
    pg.map(function (p) { return p === "…" ? "<span>…</span>" : '<button type="button" data-pg="' + p + '"' + (p === c ? ' class="on"' : "") + ">" + p + "</button>"; }).join("") +
    '<button type="button" data-pg="' + (c + 1) + '"' + (c >= n ? " disabled" : "") + ' aria-label="ถัดไป">›</button><button type="button" data-pg="' + n + '"' + (c >= n ? " disabled" : "") + ' aria-label="หน้าสุดท้าย">»</button></span></div>';
}
function paint() {
  if (!S || !S.root.isConnected) return;
  var b = S.root.querySelector("[data-body]"), sc = S.root.querySelector(".ex7-tw"), y = sc ? sc.scrollLeft : 0;
  b.innerHTML = bodyHTML(); var t = S.root.querySelector(".ex7-tw"); t && (t.scrollLeft = y);
  var sel = S.root.querySelector('[name="company_id"]');
  if (sel && S.companies) { var cur = S.f.company_id || "", h = '<option value="">- ทุกบริษัท -</option>' + S.companies.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; }).join(""); sel.innerHTML !== h && (sel.innerHTML = h); sel.value = cur; }
}
async function load() {
  if (!S) return;
  var my = ++S.seq; S.loading = !0; S.err = ""; paint();
  try {
    var r = await rpc("njacc_exp723_list", { p: params(S.lim, S.off) });
    if (my !== S.seq) return;
    S.rows = (r && r.rows) || []; S.total = (r && r.total) || 0; S.sum = (r && r.sum) || {}; S.companies = (r && r.companies) || S.companies || [];
    if (!S.rows.length && S.off > 0 && S.total > 0) { S.off = Math.max(0, Math.floor((S.total - 1) / S.lim) * S.lim); S.loading = !1; return load(); }
  } catch (e) { if (my !== S.seq) return; S.rows = []; S.total = 0; S.sum = {}; S.err = errMsg(e); }
  S.loading = !1; paint();
}
async function pickFile(x, title) { var f = x.files || []; if (!f.length) return null; return XF().pick(f, title + " · " + x.job_no + " · " + x.description); }
async function viewFile(x) { var f = await pickFile(x, "เลือกไฟล์ที่จะดู"); f && XF().preview(f); }
async function dlFile(x) { var f = await pickFile(x, "เลือกไฟล์ที่จะโหลด"); f && XF().download(f); }
async function hide(x) {
  var ok = await XF().confirm("ลบรายการ", "ต้องการลบรายการนี้ออกจาก EXPENSES หรือไม่?", "ยืนยันลบ");
  if (!ok || !S) return;
  try { await rpc("njacc_exp723_hide", { p: { item_id: x.item_id } }); toast("ลบรายการออกจาก EXPENSES แล้ว (ข้อมูลต้นทางไม่เปลี่ยน)", "ok"); load(); }
  catch (e) { toast("ลบไม่สำเร็จ — " + errMsg(e), "err"); }
}
function detail(x) {
  closeDetail();
  var fl = (x.files || []).map(function (f, i) { return '<li><span>📎 ' + esc(f.name) + " <small>(" + esc(kb(f.size)) + ')</small></span><button type="button" class="ex7-ab v" data-fv="' + i + '">' + IC.eye + 'ดูไฟล์</button><button type="button" class="ex7-ab d" data-fd="' + i + '">' + IC.dl + "โหลดไฟล์</button></li>"; }).join("");
  var o = document.createElement("div"); o.className = "ex7-ov"; o.setAttribute("data-ex7dt", "");
  o.innerHTML = '<div class="ex7-md" role="dialog" aria-modal="true" aria-label="รายละเอียด EXPENSES"><div class="ex7-mh"><b>รายละเอียด EXPENSES</b><button type="button" class="ex7-mx" data-x aria-label="ปิด">×</button></div><div class="ex7-mb"><dl class="ex7-dl">' +
    "<dt>JOB No.</dt><dd>" + esc(x.job_no) + "</dd><dt>Company</dt><dd>" + esc(x.company || "-") + "</dd><dt>Customer</dt><dd>" + esc(x.customer || "-") + "</dd><dt>House B/L</dt><dd>" + esc(x.hbl || "-") + "</dd>" +
    "<dt>รายละเอียด</dt><dd>" + esc(x.description) + "</dd><dt>ยอดเงิน</dt><dd>" + fm(x.pay_amount) + " บาท</dd><dt>เก็บลูกค้าได้</dt><dd>" + fm(x.collect_amount) + " บาท</dd>" +
    "<dt>AMOUNT (ACCOUNTING)</dt><dd>" + (x.match_amount != null ? fm(x.match_amount) + " บาท" : "—") + "</dd><dt>เก็บลูกค้าแล้ว</dt><dd>" + badge(x) + "</dd><dt>INVOICE NJ</dt><dd>" + esc(invNo(x) || "-") + "</dd>" +
    "<dt>วันที่ POST</dt><dd>" + esc(dts(x.posted_at)) + "</dd><dt>ไฟล์แนบ</dt><dd>" + (fl ? '<ul class="ex7-fl">' + fl + "</ul>" : "ไม่มีไฟล์แนบ") + "</dd></dl></div>" +
    '<div class="ex7-mf"><button type="button" class="ex7-b" data-x>ปิด</button></div></div>';
  document.body.appendChild(o);
  var key = function (e) { if (e.key === "Escape" && !document.querySelector(".xp717-ov")) { closeDetail(); } };
  o.__key = key; document.addEventListener("keydown", key);
  o.addEventListener("click", function (e) {
    if (e.target === o || e.target.closest("[data-x]")) { closeDetail(); return; }
    var v = e.target.closest("[data-fv]"), d = e.target.closest("[data-fd]");
    if (v) XF().preview(x.files[Number(v.dataset.fv)]); else if (d) XF().download(x.files[Number(d.dataset.fd)]);
  });
  var bx = o.querySelector("[data-x]"); bx && bx.focus();
}
function closeDetail() { document.querySelectorAll("[data-ex7dt]").forEach(function (o) { o.__key && document.removeEventListener("keydown", o.__key); o.remove(); }); if (S && S.lastTr && S.lastTr.isConnected) try { S.lastTr.focus({ preventScroll: !0 }); } catch (e) {} }
async function exportXls(btn) {
  btn.disabled = !0; var lb = btn.innerHTML; btn.textContent = "กำลังส่งออก…";
  try {
    var all = [], off = 0, tot = 1, sm = {};
    while (off < tot && off < 50000) {
      var r = await rpc("njacc_exp723_list", { p: params(500, off) });
      tot = (r && r.total) || 0; sm = (r && r.sum) || sm; all = all.concat((r && r.rows) || []); off += 500; if (!r || !(r.rows || []).length) break;
    }
    var seen = {}; all = all.filter(function (x) { if (seen[x.item_id]) return !1; seen[x.item_id] = 1; return !0; });   /* 1 Expense Item = 1 แถว */
    await LX(XURL); var EX = window.ExcelJS; if (!EX) throw new Error("โหลดไลบรารี Excel ไม่สำเร็จ");
    var wb = new EX.Workbook(), ws = wb.addWorksheet("EXPENSES", { views: [{ state: "frozen", ySplit: 1 }] });
    var H = ["ลำดับ", "JOB No.", "Company", "Customer", "House B/L", "รายละเอียด", "ยอดเงิน", "เก็บลูกค้าได้", "เก็บลูกค้าแล้ว", "INVOICE NJ", "วันที่ POST"];
    ws.columns = [8, 18, 34, 34, 20, 36, 15, 15, 17, 22, 13].map(function (w) { return { width: w }; });
    var TH = { style: "thin", color: { argb: "FFD9E2EC" } }, BD = { top: TH, left: TH, bottom: TH, right: TH };
    var put = function (rn, vals, st) { var row = ws.getRow(rn); for (var c = 0; c < H.length; c++) { var cell = row.getCell(c + 1), v = vals[c]; cell.value = v == null ? "" : v; cell.border = BD; cell.alignment = { vertical: "middle", wrapText: !0, horizontal: c === 6 || c === 7 ? "right" : c === 0 || c === 8 || c === 10 ? "center" : "left" };
      if ((c === 6 || c === 7) && typeof v === "number") cell.numFmt = "#,##0.00"; st && st(cell, c); } row.commit && row.commit(); };
    put(1, H, function (cell) { cell.font = { bold: !0, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; cell.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; });
    all.forEach(function (x, i) { put(i + 2, [i + 1, String(x.job_no || ""), x.company || "", x.customer || "", x.hbl || "", x.description || "", Number(x.pay_amount) || 0, Number(x.collect_amount) || 0, x.billed ? "เก็บลูกค้าแล้ว" : "รอเก็บลูกค้า", String(invNo(x) || ""), dts(x.posted_at)]); });
    var tp = 0, tc = 0; all.forEach(function (x) { tp += Number(x.pay_amount) || 0; tc += Number(x.collect_amount) || 0; });
    put(all.length + 2, ["", "", "", "", "", "รวม", Math.round(tp * 100) / 100, Math.round(tc * 100) / 100, "", "", ""], function (cell) { cell.font = { bold: !0 }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, all.length + 1), column: H.length } };
    var d = new Date(), fn = "EXPENSES_" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ".xlsx";
    var buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
    a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("ส่งออก Excel " + all.length + " รายการแล้ว", "ok");
  } catch (e) { toast("ส่งออก Excel ไม่สำเร็จ — " + errMsg(e), "err"); }
  btn.disabled = !1; btn.innerHTML = lb;
}
async function render(root, args) {
  css(); closeDetail();
  S = { root: root, f: { company_id: "", date_from: "", date_to: "", status: "ALL", q: "" }, lim: 20, off: 0, rows: [], total: 0, sum: {}, companies: null, seq: 0, loading: !1, err: "" };
  root.innerHTML = shell();
  var me = S, fo = root.querySelector("[data-f]");
  var readF = function () { var f = {}; ["company_id", "date_from", "date_to", "status", "q"].forEach(function (k) { var el = fo.elements[k]; f[k] = el ? String(el.value || "").trim() : ""; }); return f; };
  fo.addEventListener("submit", function (e) { e.preventDefault(); if (S !== me) return; S.f = readF(); S.off = 0; load(); });
  fo.addEventListener("change", function (e) { if (S !== me) return; if (e.target.name === "company_id" || e.target.name === "status") { S.f = readF(); S.off = 0; load(); } });
  root.addEventListener("change", function (e) { if (S !== me) return; if (e.target.matches("[data-lim]")) { S.lim = Number(e.target.value) || 20; S.off = 0; load(); } });
  root.addEventListener("keydown", function (e) { if (S !== me) return; var tr = e.target.closest && e.target.closest("tr[data-i]"); if (tr && e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); S.lastTr = tr; detail(S.rows[Number(tr.dataset.i)]); } });
  root.addEventListener("click", function (e) {
    if (S !== me) return;
    if (e.target.closest("[data-lk]")) return;   /* ลิงก์ JOB No. = ทำงานเดิม */
    var b = e.target.closest("button");
    if (!b) { var tr = e.target.closest("tr[data-i]"); if (tr && root.contains(tr) && !(window.getSelection && String(window.getSelection()).trim())) { S.lastTr = tr; detail(S.rows[Number(tr.dataset.i)]); } return; }
    if (b.hasAttribute("data-clr")) { ["company_id", "date_from", "date_to", "q"].forEach(function (k) { fo.elements[k] && (fo.elements[k].value = ""); }); fo.elements.status && (fo.elements.status.value = "ALL"); S.f = readF(); S.off = 0; load(); return; }
    if (b.hasAttribute("data-rf")) { load(); return; }
    if (b.hasAttribute("data-xl")) { exportXls(b); return; }
    if (b.dataset.pg) { var p = Number(b.dataset.pg), n = Math.max(1, Math.ceil((S.total || 0) / S.lim)); p = Math.min(Math.max(1, p), n); S.off = (p - 1) * S.lim; load(); return; }
    var a = b.dataset.a, tr2 = b.closest("tr[data-i]"), x = tr2 && S.rows[Number(tr2.dataset.i)];
    if (!x || b.disabled) return;
    if (a === "v") viewFile(x); else if (a === "d") dlFile(x); else if (a === "x") hide(x);
  });
  window.addEventListener("hashchange", function hc() { if (S !== me) { window.removeEventListener("hashchange", hc); return; } closeDetail(); });
  await load();
}
export{render};
