import{m as RPC}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";import{a as LX}from"./chunk-LAFWE2EM.js";import{MI705}from"./chunk-2B2FLIKC.js";
/* ═══ V.827 · QUOTATION → Amend : รายงาน JOB ประเภท Amendment จาก DOCUMENT → SERVICE ที่ยังไม่ CLOSE
   ข้อมูล : RPC อ่านอย่างเดียว njacc_amend827_list (RUN-827) — JOB ID จริง 1 JOB = 1 แถว · มี / ไม่มีเลขงานก็แสดง · CLOSE / CANCELED (สถานะจริง) = ไม่แสดง
   สิทธิ์ : SUPER_ADMIN หรือ menu_items 'quotation/amend' (ตรวจที่ Server ทุกครั้ง) · ขอบเขตข้อมูล JOB = สิทธิ์ DOCUMENT เดิมของผู้ใช้ (Server)
   ซิงก์ : โหลดใหม่อัตโนมัติทุก 20 วินาที (เฉพาะหน้าที่เปิดอยู่) + เมื่อกลับมาที่แท็บ / หน้าต่าง → JOB ที่ CLOSE จากเครื่องอื่นหายเอง
   ไม่แก้ : DOCUMENT / CLOSE / POST / ACCOUNTING / FINANCE / QUOTATION ใบเสนอราคาเดิม ═══ */
var XURL = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
var S = null, POLL = 20000;
var IC = (function () {
  var s = function (p, w, f) { return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 24 24" fill="' + (f ? "currentColor" : "none") + '" stroke="' + (f ? "none" : "currentColor") + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  return { amd: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>', 28), home: s('<path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/>', 16, 1), q: s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    clr: s('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>', 15), rf: s('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', 15),
    xl: s('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>'), eye: s('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 14),
    op: s('<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>', 14), x: s('<path d="M6 6l12 12M18 6 6 18"/>', 18) };
})();
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dts(x) { if (!x) return ""; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(x)); if (m) return m[3] + "/" + m[2] + "/" + m[1]; var d = new Date(x); return isNaN(d) ? "" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear(); }
function dtm(x) { if (!x) return ""; var d = new Date(x); return isNaN(d) ? "" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + " น."; }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
var NONO = "ยังไม่มีเลขงาน";
function stT(x) { return x.document_status === "POSTED" ? "POST แล้ว" : "รอ POST"; }
function stB(x) { return '<span class="am7-bd ' + (x.document_status === "POSTED" ? "g" : "o") + '">' + stT(x) + "</span>" + (x.returned ? ' <span class="am7-bd r" title="JOB ถูกย้อนกลับมาแก้ไข">ย้อนกลับ</span>' : ""); }
function who(x) { return x.created_by_nickname || x.created_by_name || ""; }
function errMsg(e) {
  var m = String(e && (e.message || e.code) || e || "");
  if (/NJACC_AMEND827_FORBIDDEN/.test(m)) return "Amend : ไม่มีสิทธิ์เข้าเมนูนี้";
  if (/njacc_amend827|PGRST202|Could not find the function/i.test(m)) return "ระบบ Amend ยังไม่พร้อม (ยังไม่ได้รัน RUN-827)";
  if (/NJACC_NO_PROFILE/.test(m)) return "ไม่พบข้อมูลผู้ใช้ — กรุณาเข้าสู่ระบบใหม่";
  return m || "เกิดข้อผิดพลาด";
}
function css() {
  if (document.getElementById("am827-css")) return;
  var s = document.createElement("style"); s.id = "am827-css";
  s.textContent = [
    ".am7{padding:14px 18px 24px;color:#0f172a;font-size:13px;max-width:100%;box-sizing:border-box}",
    ".am7-hd{display:flex;align-items:center;gap:12px;margin:0 0 12px;flex-wrap:wrap}.am7-ic{width:46px;height:46px;border-radius:10px;background:#1d4ed8;color:#fff;display:flex;align-items:center;justify-content:center;flex:none}",
    ".am7-tt b{display:block;font-size:22px;font-weight:800;color:#1e3a8a;letter-spacing:.3px;line-height:1.1}.am7-tt small{display:block;font-size:13.5px;font-weight:700;color:#1d4ed8;margin-top:2px}",
    ".am7-hr{margin-left:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.am7-bc{display:flex;align-items:center;gap:8px;font-weight:800;color:#1e3a8a;font-size:14px}.am7-bc a{color:#1e3a8a;text-decoration:none;display:inline-flex}.am7-bc i{font-style:normal;color:#64748b}",
    ".am7-fc{border:1px solid #D9E2EC;border-radius:12px;background:#f8fbff;padding:10px 12px 12px;margin:0 0 12px}.am7-fc h3{margin:0 0 6px;font-size:14px;color:#1d4ed8;display:flex;align-items:center;gap:6px}",
    ".am7-f{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}.am7-f label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;color:#0f172a;flex:none}",
    ".am7-f select,.am7-f input{height:36px;border:1px solid #cbd5e1;border-radius:8px;padding:0 10px;font-size:13px;font-family:inherit;background:#fff;color:#0f172a;box-sizing:border-box}",
    ".am7-f .dt input{width:140px}.am7-f .tx input{width:150px}.am7-f .sl select{width:200px}.am7-f .st select{width:130px}.am7-f .bt{display:flex;gap:8px;flex-wrap:wrap}",
    ".am7-b{height:36px;border-radius:8px;border:1px solid #1d4ed8;background:#fff;color:#1d4ed8;font-weight:700;font-size:13px;padding:0 11px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-family:inherit;white-space:nowrap;flex:none}",
    ".am7-b.p{background:#1d4ed8;color:#fff}.am7-b.g{background:#16a34a;border-color:#16a34a;color:#fff}.am7-b:disabled{opacity:.55;cursor:default}",
    ".am7-sm{display:flex;align-items:center;gap:10px;margin:0 0 8px;flex-wrap:wrap;font-size:13.5px}.am7-sm b{font-size:16px;color:#1e3a8a}.am7-sm small{color:#64748b}",
    ".am7-tw{border:1px solid #D9E2EC;border-radius:12px;overflow:auto;background:#fff;max-width:100%}",
    ".am7-t{width:100%;min-width:1500px;border-collapse:collapse;font-size:13px}",
    ".am7-t th,.am7-t td{border:1px solid #D9E2EC;padding:6px 8px;vertical-align:middle}.am7-t tr>:first-child{border-left:0}.am7-t tr>:last-child{border-right:0}.am7-t thead th{border-top:0}.am7-t tbody tr:last-child td{border-bottom:0}",
    ".am7-t thead th{background:#1e3a8a;color:#fff;font-weight:700;text-align:center;white-space:nowrap;border-color:#2c4a9a}",
    ".am7-t td.c{text-align:center}.am7-t td.nw{white-space:nowrap}.am7-t td.el{min-width:110px;max-width:200px;overflow-wrap:anywhere}.am7-t td.e1{max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.am7-no{color:#94a3b8;font-style:italic;white-space:nowrap}",
    ".am7-t tbody tr[data-i]{cursor:pointer}.am7-t tbody tr[data-i]:hover td,.am7-t tbody tr[data-i]:focus td{background:#eaf3ff}.am7-t tbody tr[data-i]:focus{outline:2px solid #1d4ed8;outline-offset:-2px}",
    ".am7-em{text-align:center;color:#64748b;padding:18px!important}",
    ".am7-bd{display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:6px;font-size:12px;font-weight:800;white-space:nowrap}.am7-bd.g{background:#16a34a;color:#fff}.am7-bd.o{background:#f59e0b;color:#fff}.am7-bd.r{background:#dc2626;color:#fff}",
    ".am7-act{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap}.am7-ab{height:28px;border-radius:6px;padding:0 10px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;white-space:nowrap;border:1px solid #93c5fd;color:#1d4ed8;background:#fff}",
    ".am7-ab.o{border-color:#86efac;color:#15803d}",
    ".am7-pg{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;font-size:13px}.am7-pg select{height:32px;border:1px solid #cbd5e1;border-radius:7px;padding:0 6px;font-family:inherit}",
    ".am7-pn{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}.am7-pn button{min-width:34px;height:32px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;cursor:pointer;font-weight:700;font-family:inherit}.am7-pn button.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}.am7-pn button:disabled{opacity:.45;cursor:default}",
    ".am7-err{padding:10px 12px;border-radius:8px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;margin:0 0 10px}",
    ".am7-ov{position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px}",
    ".am7-md{background:#fff;border-radius:14px;width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(15,23,42,.3)}",
    ".am7-mh{display:flex;align-items:center;gap:10px;padding:12px 18px;background:linear-gradient(90deg,#1255EA,#0898F7);color:#fff}.am7-mh b{flex:1;font-size:17px}",
    ".am7-mx{width:36px;height:36px;border:0;border-radius:9px;background:#fff;color:#1d4ed8;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}",
    ".am7-mb{padding:14px 18px;overflow:auto;min-height:0}.am7-dl{display:grid;grid-template-columns:170px minmax(0,1fr);gap:7px 14px;margin:0}.am7-dl dt{color:#64748b}.am7-dl dd{margin:0;font-weight:700;overflow-wrap:anywhere}",
    ".am7-mf{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:10px 18px;border-top:1px solid #D9E2EC;background:#f8fafc}",
    "@media (max-width:760px){.am7{padding:10px}.am7-hr{margin-left:0;width:100%;justify-content:space-between}.am7-bc{font-size:12.5px}.am7-f label{flex:1 1 100%}.am7-f .dt{flex:1 1 45%}",
    ".am7-f .dt input,.am7-f .tx input,.am7-f .sl select,.am7-f .st select{width:100%}.am7-f .bt{width:100%}.am7-f .bt .am7-b{flex:1 1 auto;justify-content:center}.am7-pn{margin-left:0}.am7-dl{grid-template-columns:120px minmax(0,1fr)}.am7-md{max-height:calc(100dvh - 16px)}}"
  ].join("");
  document.head.appendChild(s);
}
function shell() {
  return '<div class="am7"><div class="am7-hd"><span class="am7-ic">' + IC.amd + '</span><div class="am7-tt"><b>Amend</b><small>รายงาน JOB ประเภท Amendment (DOCUMENT → SERVICE) ที่ยังไม่ CLOSE</small></div>' +
    '<div class="am7-hr"><nav class="am7-bc" aria-label="breadcrumb"><a href="#/" title="หน้าแรก">' + IC.home + '</a><i>›</i><span>QUOTATION</span><i>›</i><span>Amend</span></nav>' +
    '<button type="button" class="am7-b g" data-xl>' + IC.xl + "EXPORT EXCEL</button></div></div>" +
    '<div class="am7-fc"><h3>' + IC.q + 'ค้นหา / ตัวกรองข้อมูล</h3><form class="am7-f" data-f autocomplete="off">' +
    '<label class="dt">วันที่เปิดงาน ตั้งแต่<input type="date" name="date_from"></label><label class="dt">ถึงวันที่<input type="date" name="date_to"></label>' +
    '<label class="tx">JOB No.<input name="job_no" maxlength="60" placeholder="เช่น OPS26-"></label><label class="tx">JOB NJ<input name="job_nj" maxlength="60" placeholder="เช่น JOB2611-"></label>' +
    '<label class="sl">บริษัท<select name="company_id"><option value="">- ทุกบริษัท -</option></select></label><label class="sl">ลูกค้า<select name="customer_id"><option value="">- ทุกลูกค้า -</option></select></label>' +
    '<label class="tx">Customer Job No.<input name="customer_job_no" maxlength="60"></label>' +
    '<label class="st">สถานะ<select name="status"><option value="">ทั้งหมด</option><option value="DRAFT">รอ POST</option><option value="POSTED">POST แล้ว</option></select></label>' +
    '<span class="bt"><button type="submit" class="am7-b p">' + IC.q + 'ค้นหา</button><button type="button" class="am7-b" data-clr>' + IC.clr + 'ล้างตัวกรอง</button>' +
    '<button type="button" class="am7-b" data-rf>' + IC.rf + "รีเฟรช</button></span></form></div><div data-body></div></div>";
}
var H = ["#", "วันที่เปิดงาน", "JOB No.", "JOB NJ", "บริษัท", "ลูกค้า", "ประเภทงาน", "Customer Job No.", "Master B/L", "House B/L", "ผู้เปิดงาน", "สถานะ", "จัดการ"];
function noTd(v) { return v ? '<td class="nw"><b>' + esc(v) + "</b></td>" : '<td><span class="am7-no">' + NONO + "</span></td>"; }
function canDoc() { return !!(S && S.canDoc) && MI705("document/service"); }
function rowHTML(x, i) {
  return '<tr data-i="' + i + '" data-id="' + esc(x.id) + '" tabindex="0"><td class="c">' + (S.off + i + 1) + '</td><td class="nw c">' + esc(dts(x.date)) + "</td>" + noTd(x.job_no) + noTd(x.job_nj) +
    '<td class="e1" title="' + esc(x.company || "") + '">' + esc(x.company || "-") + '</td><td class="e1" title="' + esc(x.customer || "") + '">' + esc(x.customer || "-") + '</td><td class="nw">' + esc(x.job_category || "") + "</td>" +
    '<td class="el">' + esc(x.customer_job_no || "-") + '</td><td class="el">' + esc(x.master_bl_no || "-") + '</td><td class="el">' + esc(x.house_bl_no || "-") + "</td>" +
    '<td class="nw" title="' + esc(x.created_by_name || "") + '">' + esc(who(x) || "-") + '</td><td class="c nw">' + stB(x) + "</td>" +
    '<td><div class="am7-act"><button type="button" class="am7-ab" data-a="v">' + IC.eye + "ดู</button>" + (canDoc() ? '<button type="button" class="am7-ab o" data-a="o" title="เปิดใน DOCUMENT → SERVICE">' + IC.op + "เปิดงาน</button>" : "") + "</div></td></tr>";
}
function bodyHTML() {
  var W = [44, 100, 110, 124, 180, 180, 100, 120, 120, 150, 110, 104, 150];
  var n = Math.max(1, Math.ceil((S.total || 0) / S.lim)), c = Math.floor(S.off / S.lim) + 1, from = S.total ? S.off + 1 : 0, to = S.off + S.rows.length, pg = [], k;
  for (k = 1; k <= n; k++) if (k === 1 || k === n || Math.abs(k - c) <= 2) pg.push(k); else if (pg[pg.length - 1] !== "…") pg.push("…");
  return (S.err ? '<div class="am7-err">' + esc(S.err) + "</div>" : "") +
    '<div class="am7-sm">JOB Amendment ที่ยังไม่ CLOSE ทั้งหมด <b data-tot>' + (S.total || 0) + "</b> JOB" + (S.at ? "<small>· อัปเดต " + esc(dtm(S.at)) + "</small>" : "") + "</div>" +
    '<div class="am7-tw"><table class="am7-t"><thead><tr>' + H.map(function (h, j) { return "<th" + (W[j] ? ' style="width:' + W[j] + 'px"' : "") + ">" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
    (S.rows.map(rowHTML).join("") || '<tr><td colspan="13" class="am7-em">' + (S.loading ? "กำลังโหลด…" : "ไม่มีรายการ") + "</td></tr>") + "</tbody></table></div>" +
    '<div class="am7-pg">แสดง <select data-lim>' + [10, 20, 50, 100].map(function (v) { return '<option value="' + v + '"' + (S.lim === v ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select> รายการต่อหน้า" +
    "<span>แสดง " + from + " - " + to + " จาก " + (S.total || 0) + ' รายการ</span><span class="am7-pn"><button type="button" data-pg="1"' + (c <= 1 ? " disabled" : "") + ' aria-label="หน้าแรก">«</button><button type="button" data-pg="' + (c - 1) + '"' + (c <= 1 ? " disabled" : "") + ' aria-label="ก่อนหน้า">‹</button>' +
    pg.map(function (p) { return p === "…" ? "<span>…</span>" : '<button type="button" data-pg="' + p + '"' + (p === c ? ' class="on"' : "") + ">" + p + "</button>"; }).join("") +
    '<button type="button" data-pg="' + (c + 1) + '"' + (c >= n ? " disabled" : "") + ' aria-label="ถัดไป">›</button><button type="button" data-pg="' + n + '"' + (c >= n ? " disabled" : "") + ' aria-label="หน้าสุดท้าย">»</button></span></div>';
}
function optFill(name, list, all) {
  var sel = S.root.querySelector('[name="' + name + '"]'); if (!sel || !list) return;
  var cur = S.f[name] || "", h = '<option value="">' + all + "</option>" + list.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; }).join("");
  if (cur && !list.some(function (c) { return String(c.id) === cur; })) h += '<option value="' + esc(cur) + '">(ตัวเลือกเดิม)</option>';
  sel.innerHTML !== h && (sel.innerHTML = h); sel.value = cur;
}
function paint() {
  if (!S || !S.root.isConnected || (S.el && !S.el.isConnected)) return;
  var b = S.root.querySelector("[data-body]"), sc = S.root.querySelector(".am7-tw"), y = sc ? sc.scrollLeft : 0;
  b.innerHTML = bodyHTML(); var t = S.root.querySelector(".am7-tw"); t && (t.scrollLeft = y);
  S.opts && (optFill("company_id", S.opts.companies, "- ทุกบริษัท -"), optFill("customer_id", S.opts.customers, "- ทุกลูกค้า -"));
}
var FK = ["date_from", "date_to", "job_no", "job_nj", "company_id", "customer_id", "customer_job_no", "status"];
function params(extra) { var o = { with_options: true }; FK.forEach(function (k) { S.f[k] && (o[k] = S.f[k]); }); return Object.assign(o, extra || {}); }
async function load(silent) {
  if (!S) return;
  var S0 = S, my = ++S.seq; if (!silent) { S.loading = !0; S.err = ""; paint(); }
  try {
    var r = await RPC("njacc_amend827_list", { p: params({ page: Math.floor(S.off / S.lim) + 1, size: S.lim }) });
    if (S !== S0 || my !== S.seq) return;
    var rows = (r && r.rows) || [], sig = JSON.stringify([rows, r && r.total, r && r.options]);
    S.at = r && r.at; S.canDoc = !!(r && r.can_doc);
    if (!rows.length && S.off > 0 && (r && r.total) > 0) { S.off = Math.max(0, Math.floor(((r.total) - 1) / S.lim) * S.lim); S.loading = !1; return load(silent); }
    if (silent && sig === S.sig && !S.err) return;   /* ซิงก์อัตโนมัติ : ข้อมูลไม่เปลี่ยน = ไม่วาดใหม่ */
    S.sig = sig; S.rows = rows; S.total = (r && r.total) || 0; S.opts = (r && r.options) || S.opts; S.err = "";
  } catch (e) { if (S !== S0 || my !== S.seq) return; if (silent) return; S.rows = []; S.total = 0; S.err = errMsg(e); }
  S.loading = !1; paint();
  var ov = document.querySelector("[data-am7dt]"); if (ov && ov.__id && !S.rows.some(function (x) { return x.id === ov.__id; }) && silent) closeDetail();   /* JOB ที่ CLOSE แล้ว = ปิดหน้าต่างรายละเอียด */
}
function detail(x) {
  closeDetail(); if (!x) return;
  var D = function (v) { return v == null || String(v).trim() === "" ? "—" : esc(v); };
  var N = function (v) { return v ? esc(v) : '<span class="am7-no">' + NONO + "</span>"; };
  var o = document.createElement("div"); o.className = "am7-ov"; o.setAttribute("data-am7dt", ""); o.__id = x.id;
  o.innerHTML = '<div class="am7-md" role="dialog" aria-modal="true" aria-label="รายละเอียด JOB Amendment"><div class="am7-mh"><b>รายละเอียด JOB · Amendment</b><button type="button" class="am7-mx" data-x aria-label="ปิด">' + IC.x + "</button></div>" +
    '<div class="am7-mb"><dl class="am7-dl"><dt>วันที่เปิดงาน</dt><dd>' + D(dts(x.date)) + "</dd><dt>JOB No.</dt><dd>" + N(x.job_no) + "</dd><dt>JOB NJ</dt><dd>" + N(x.job_nj) + "</dd>" +
    "<dt>บริษัท</dt><dd>" + D(x.company) + "</dd><dt>ลูกค้า</dt><dd>" + D(x.customer) + "</dd><dt>ประเภทงาน</dt><dd>" + D(x.job_category) + "</dd><dt>Data Type</dt><dd>" + D(x.data_type) + "</dd>" +
    "<dt>Customer Job No.</dt><dd>" + D(x.customer_job_no) + "</dd><dt>Master B/L</dt><dd>" + D(x.master_bl_no) + "</dd><dt>House B/L</dt><dd>" + D(x.house_bl_no) + "</dd>" +
    "<dt>ผู้เปิดงาน</dt><dd>" + D(x.created_by_name) + (x.created_by_nickname ? " (" + esc(x.created_by_nickname) + ")" : "") + "</dd><dt>สถานะ</dt><dd>" + stB(x) + " <span class=\"am7-no\">· ยังไม่ CLOSE</span></dd>" +
    "<dt>บันทึกเมื่อ</dt><dd>" + D(dtm(x.created_at)) + "</dd><dt>แก้ไขล่าสุด</dt><dd>" + D(dtm(x.updated_at)) + "</dd></dl></div>" +
    '<div class="am7-mf">' + (canDoc() ? '<button type="button" class="am7-b p" data-op>' + IC.op + "เปิดใน DOCUMENT → SERVICE</button>" : "") + '<button type="button" class="am7-b" data-x>ปิด</button></div></div>';
  document.body.appendChild(o);
  var key = function (e) { e.key === "Escape" && closeDetail(); }; o.__key = key; document.addEventListener("keydown", key);
  o.addEventListener("click", function (e) { if (e.target === o || e.target.closest("[data-x]")) { closeDetail(); return; } if (e.target.closest("[data-op]")) { closeDetail(); openJob(x); } });
  var bx = o.querySelector(".am7-mx"); bx && bx.focus();
}
function closeDetail() { document.querySelectorAll("[data-am7dt]").forEach(function (o) { o.__key && document.removeEventListener("keydown", o.__key); o.remove(); }); }
function openJob(x) {   /* เปิด JOB ด้วยหน้าต่างเดิมของ DOCUMENT → SERVICE (สิทธิ์ / CLOSE / POST ตามระบบเดิมทุกประการ) · ปิดหน้าต่าง = โหลดรายงานใหม่ */
  if (!canDoc()) return;
  import("./job-form-4IHODUQT.js").then(function (m) { m.openNewJobModal({ charge: "SERVICE", group: x.company_group || "NJ", mode: "document", jobId: x.id, onSaved: function () { load(!0); } }); })
    .catch(function (e) { toast("เปิด JOB ไม่สำเร็จ — " + errMsg(e), "err"); });
}
async function exportXls(btn) {
  btn.disabled = !0; var lb = btn.innerHTML; btn.textContent = "กำลังส่งออก…";
  try {
    var all = [], pgN = 1, tot = 1;
    while (all.length < tot && pgN <= 100) {
      var r = await RPC("njacc_amend827_list", { p: Object.assign(params({ page: pgN, size: 500, export: true }), { with_options: false }) });
      tot = (r && r.total) || 0; var rs = (r && r.rows) || []; all = all.concat(rs); pgN++; if (!rs.length) break;
    }
    var seen = {}; all = all.filter(function (x) { if (seen[x.id]) return !1; seen[x.id] = 1; return !0; });   /* 1 JOB = 1 แถว (JOB ID) */
    await LX(XURL); var EX = window.ExcelJS; if (!EX) throw new Error("โหลดไลบรารี Excel ไม่สำเร็จ");
    var wb = new EX.Workbook(), ws = wb.addWorksheet("AMEND", { views: [{ state: "frozen", ySplit: 1 }] }), HX = H.slice(0, 12);
    ws.columns = [7, 14, 18, 18, 38, 38, 14, 22, 24, 28, 24, 14].map(function (w) { return { width: w }; });
    var TH = { style: "thin", color: { argb: "FF94A3B8" } }, BD = { top: TH, left: TH, bottom: TH, right: TH };
    var put = function (rn, vals, hd) { var row = ws.getRow(rn); for (var c = 0; c < HX.length; c++) { var cell = row.getCell(c + 1), v = vals[c]; cell.value = v == null || v === "" ? null : v; cell.border = BD;   /* ช่องว่าง (เช่น ยังไม่มีเลขงาน) = เซลล์ว่างจริง */
        cell.alignment = { vertical: "middle", wrapText: !0, horizontal: hd || c === 0 || c === 1 || c === 11 ? "center" : "left" };
        if (hd) { cell.font = { bold: !0, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; } } row.commit && row.commit(); };
    put(1, HX, !0);
    all.forEach(function (x, i) { put(i + 2, [i + 1, dts(x.date), x.job_no || "", x.job_nj || "", x.company || "", x.customer || "", x.job_category || "", x.customer_job_no || "", x.master_bl_no || "", x.house_bl_no || "", x.created_by_name || "", stT(x)]); });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, all.length + 1), column: HX.length } };
    var d = new Date(), fn = "AMEND_REPORT_" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ".xlsx";
    var buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
    a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("ส่งออก Excel " + all.length + " JOB แล้ว", "ok");
  } catch (e) { toast("ส่งออก Excel ไม่สำเร็จ — " + errMsg(e), "err"); }
  btn.disabled = !1; btn.innerHTML = lb;
}
function OFF(m) { return S !== m || !(m && m.el && m.el.isConnected); }
async function render(root, args) {
  css(); closeDetail();
  S && S.timer && clearInterval(S.timer);
  S = { root: root, f: {}, lim: 20, off: 0, rows: [], total: 0, opts: null, seq: 0, loading: !1, err: "", sig: "", canDoc: !1, at: null, timer: 0 };
  root.innerHTML = shell();
  var me = S, fo = root.querySelector("[data-f]"); me.el = root.firstElementChild;
  var readF = function () { var f = {}; FK.forEach(function (k) { var el = fo.elements[k]; f[k] = el ? String(el.value || "").trim() : ""; }); return f; };
  var same = function (a, b) { return FK.every(function (k) { return String(a[k] || "") === String(b[k] || ""); }); };
  var apply = function () { if (OFF(me)) return; var f = readF(); if (same(f, S.f)) return; S.f = f; S.off = 0; load(); };
  fo.addEventListener("submit", function (e) { e.preventDefault(); if (OFF(me)) return; S.f = readF(); S.off = 0; load(); });
  var tm = 0; fo.addEventListener("input", function (e) { if (OFF(me) || !e.target.name || e.isComposing || e.target.tagName === "SELECT") return; clearTimeout(tm); tm = setTimeout(apply, e.target.type === "date" ? 0 : 350); });
  fo.addEventListener("change", function (e) { if (OFF(me) || !e.target.name) return; clearTimeout(tm); apply(); });
  root.addEventListener("change", function (e) { if (OFF(me)) return; if (e.target.matches("[data-lim]")) { S.lim = Number(e.target.value) || 20; S.off = 0; load(); } });
  root.addEventListener("keydown", function (e) { if (OFF(me)) return; var tr = e.target.closest && e.target.closest("tr[data-i]"); if (tr && e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); detail(S.rows[Number(tr.dataset.i)]); } });
  root.addEventListener("click", function (e) {
    if (OFF(me)) return;
    var b = e.target.closest("button");
    if (!b) { var tr = e.target.closest("tr[data-i]"); if (tr && root.contains(tr) && !(window.getSelection && String(window.getSelection()).trim())) detail(S.rows[Number(tr.dataset.i)]); return; }
    if (b.hasAttribute("data-clr")) { FK.forEach(function (k) { fo.elements[k] && (fo.elements[k].value = ""); }); S.f = readF(); S.off = 0; load(); return; }
    if (b.hasAttribute("data-rf")) { load(); return; }
    if (b.hasAttribute("data-xl")) { exportXls(b); return; }
    if (b.dataset.pg) { var p = Number(b.dataset.pg), n = Math.max(1, Math.ceil((S.total || 0) / S.lim)); p = Math.min(Math.max(1, p), n); S.off = (p - 1) * S.lim; load(); return; }
    var tr2 = b.closest("tr[data-i]"), x = tr2 && S.rows[Number(tr2.dataset.i)]; if (!x) return;
    b.dataset.a === "v" ? detail(x) : b.dataset.a === "o" && openJob(x);
  });
  /* ซิงก์อัตโนมัติ (เครื่องอื่น CLOSE / SAVE / POST) : ทุก 20 วินาทีเมื่อหน้านี้แสดงอยู่ + กลับมาที่แท็บ / หน้าต่าง / ต่อเน็ตใหม่ */
  var tick = function () { if (OFF(me)) { clearInterval(me.timer); return; } document.visibilityState === "visible" && !document.querySelector("#nj-modal, .nj-modal-ov") && load(!0); };
  me.timer = setInterval(tick, POLL);
  var wake = function () { if (OFF(me)) { document.removeEventListener("visibilitychange", wake); window.removeEventListener("focus", wake); window.removeEventListener("online", wake); return; } document.visibilityState === "visible" && load(!0); };
  document.addEventListener("visibilitychange", wake); window.addEventListener("focus", wake); window.addEventListener("online", wake);
  window.addEventListener("hashchange", function hc() { if (OFF(me)) { window.removeEventListener("hashchange", hc); clearInterval(me.timer); closeDetail(); return; } });
  await load();
}
export{render};
