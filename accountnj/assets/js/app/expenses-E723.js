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
  if (/NJACC_XP717_READONLY/.test(m)) return "JOB ปิดงาน / ยกเลิก / มี INVOICE POST แล้ว — แนบ / ลบไฟล์ไม่ได้";   /* V.729 */
  if (/NJACC_EXP729_NOT_FOUND/.test(m)) return "ไม่พบไฟล์ (อาจถูกลบแล้ว) — โหลดข้อมูลใหม่";
  if (/njacc_exp729/i.test(m) && /(PGRST202|Could not find)/i.test(m)) return "ระบบลบไฟล์ EXPENSES ยังไม่พร้อม (ยังไม่ได้รัน RUN-729)";
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
    ".ex7-t td.ex802{white-space:nowrap;overflow:hidden;max-width:128px}"/* V.802 */,".ex7-el{display:block;max-width:240px;overflow-wrap:anywhere}.ex7-em{text-align:center;color:#64748b;padding:18px!important}",
    ".ex7-bd{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:6px;font-size:12px;font-weight:800;white-space:nowrap}.ex7-bd.g{background:#16a34a;color:#fff}.ex7-bd.o{background:#f59e0b;color:#fff}.ex7-bd.r{background:#dc2626;color:#fff}",
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
    "@media (min-width:1101px){html.ex731 .app-main>header.tb{display:none!important}}",   /* V.731 : Desktop เท่านั้น — ซ่อนแถบบน (ชื่อหน้า / เวอร์ชัน / ผู้ใช้) เฉพาะหน้า EXPENSES · ≤1100px คงเดิม (มีปุ่มเมนู) */
    "@media (max-width:760px){.ex7{padding:10px}.ex7-bc{margin-left:0;font-size:12.5px}.ex7-f{flex-wrap:wrap}.ex7-f label,.ex7-f .qq{flex:1 1 100%}.ex7-f .co select,.ex7-f .dt input,.ex7-f .st select{width:100%}.ex7-f .dt{flex:1 1 45%!important}.ex7-pn{margin-left:0}.ex7-dl{grid-template-columns:120px minmax(0,1fr)}}"
  ].join("");
  document.head.appendChild(s);
}
function rpc(n, a) { return RPC(n, a); }
function params(lim, off) { var f = S.f; return { company_id: f.company_id || null, date_from: f.date_from || null, date_to: f.date_to || null, status: f.status || "ALL", q: f.q || null, limit: lim, offset: off }; }
function badge(x) { return x.cannot_collect ? '<span class="ex7-bd r">✕ เก็บลูกค้าไม่ได้</span>' : x.billed ? '<span class="ex7-bd g">✓ เก็บลูกค้าแล้ว</span>' : '<span class="ex7-bd o">◷ รอเก็บลูกค้า</span>'; }
function invNo(x) { return x.cannot_collect ? "-" : x.billed ? x.match_no : x.inv_nos; }   /* V.733 : รายการเก็บลูกค้าไม่ได้ = INVOICE NJ "-" */
function shell() {
  var mob = typeof window !== "undefined" && window.__NJ_MOBILE;
  return '<div class="ex7"><div class="ex7-hd"><span class="ex7-ic">' + IC.coin + '</span><div class="ex7-tt"><b>EXPENSES</b><small>รายงานค่าใช้จ่ายนอกราคาขายจาก DOCUMENT → SERVICE</small></div>' +
    '<nav class="ex7-bc" aria-label="breadcrumb"><a href="#/' + (mob ? "cash-advance" : "") + '" title="หน้าแรก">' + IC.home + '</a><i>›</i><a href="#/cash-advance">CASH ADVANCE</a><i>›</i><span>EXPENSES</span></nav></div>' +
    '<div class="ex7-fc"><h3>' + IC.q + 'ค้นหา / ตัวกรองข้อมูล</h3><form class="ex7-f" data-f autocomplete="off">' +
    '<label class="co">บริษัท (Company)<select name="company_id"><option value="">- ทุกบริษัท -</option></select></label>' +
    '<label class="dt">วันที่ POST<input type="date" name="date_from"></label><label class="dt">ถึงวันที่<input type="date" name="date_to"></label>' +
    '<label class="st">สถานะเก็บลูกค้า<select name="status"><option value="ALL">ทั้งหมด</option><option value="BILLED">เก็บลูกค้าแล้ว</option><option value="PENDING">รอเก็บลูกค้า</option><option value="UNCOLLECTIBLE">เก็บลูกค้าไม่ได้</option></select></label>' +
    '<label class="qq">ค้นหาทุกหัวข้อ<span class="qw">' + IC.q + '<input name="q" maxlength="120" placeholder="ค้นหา JOB / บริษัท / ลูกค้า / House / รายละเอียด / INVOICE NJ / ชื่อไฟล์"></span></label>' +
    '<button type="submit" class="ex7-b p">' + IC.q + 'ค้นหา</button><button type="button" class="ex7-b" data-clr>' + IC.clr + 'ล้างตัวกรอง</button>' +
    '<button type="button" class="ex7-b" data-rf>' + IC.rf + 'Refresh</button><button type="button" class="ex7-b g" data-xl>' + IC.xl + 'EXPORT EXCEL</button></form></div>' +
    '<div data-body></div></div>';
}
/* ═══ V.802 · EXPENSES : ชื่อ Company / Customer ในตารางรายการ = ไม่เกิน 10 ตัวอักษร (นับแบบตัวอักษรที่เห็น · ไม่ตัดสระ / วรรณยุกต์ออกจากตัวหน้า) + "..." · บรรทัดเดียว · Tooltip = ชื่อเต็ม
   ข้อมูล / ค้นหา / หน้าต่างรายละเอียด / EXPORT EXCEL = ชื่อเต็มเดิม (ตัดเฉพาะข้อความที่แสดงในตาราง) ═══ */
function t802(v) {
  var s = String(v == null ? "" : v).trim(), g;
  if (!s) return "-";
  try { g = typeof Intl !== "undefined" && Intl.Segmenter ? Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(s), function (x) { return x.segment; }) : Array.from(s); } catch (e) { g = Array.from(s); }
  return g.length > 10 ? g.slice(0, 10).join("") + "..." : s;
}
function td802(v) { var s = String(v == null ? "" : v).trim(); return '<td class="ex802"' + (s ? ' title="' + esc(s) + '"' : "") + ">" + esc(t802(s)) + "</td>"; }
function rowHTML(x, i) {
  var nf = (x.files || []).length, no = S.off + i + 1;
  return '<tr data-i="' + i + '" tabindex="0"><td class="c">' + no + '</td><td class="nw"><a href="#/job/' + esc(x.job_id) + '" data-lk>' + esc(x.job_no) + "</a></td>" +
    td802(x.company) + td802(x.customer) + '<td class="nw">' + esc(x.hbl || "-") + "</td>" +
    '<td><span class="ex7-el">' + esc(x.description) + '</span></td><td class="r">' + fm(x.pay_amount) + '</td><td class="r">' + fm(x.collect_amount) + '</td><td class="c">' + badge(x) + '</td><td class="nw c">' + esc(invNo(x) || "-") + "</td>" +
    '<td><div class="ex7-act">' +   /* V.727 : List View แสดงเฉพาะปุ่มลบ — ดูไฟล์ / โหลดไฟล์ อยู่ในหน้าต่างรายละเอียด EXPENSES */
    '<button type="button" class="ex7-ab x" data-a="x" title="ลบออกจาก EXPENSES">' + IC.del + "ลบ</button></div></td></tr>";
}
function bodyHTML() {
  var H = ["#", "JOB No.", "Company", "Customer", "House B/L", "รายละเอียด", "ยอดเงิน", "เก็บลูกค้าได้", "เก็บลูกค้าแล้ว", "INVOICE NJ", "จัดการ"];
  var W = [44, 130, 120, 120, 130, 0, 110, 110, 130, 130, 84];   /* V.802 : Company / Customer = 120px (10 ตัวอักษร + ...) */   /* V.727 : คอลัมน์จัดการ = ปุ่มลบปุ่มเดียว */
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
  if (!S || !S.root.isConnected || (S.el && !S.el.isConnected)) return;   /* V.803 */
  var b = S.root.querySelector("[data-body]"), sc = S.root.querySelector(".ex7-tw"), y = sc ? sc.scrollLeft : 0;
  b.innerHTML = bodyHTML(); var t = S.root.querySelector(".ex7-tw"); t && (t.scrollLeft = y);
  var sel = S.root.querySelector('[name="company_id"]');
  if (sel && S.companies) { var cur = S.f.company_id || "", h = '<option value="">- ทุกบริษัท -</option>' + S.companies.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; }).join(""); sel.innerHTML !== h && (sel.innerHTML = h); sel.value = cur; }
}
async function load() {
  if (!S) return;
  var S0 = S, my = ++S.seq;   /* V.803 : ผลของรอบก่อน (ออก / เข้าหน้าใหม่) ไม่ทับรอบใหม่ */ S.loading = !0; S.err = ""; paint();
  try {
    var r = await rpc("njacc_exp723_list", { p: params(S.lim, S.off) });
    if (S !== S0 || my !== S.seq) return;
    S.rows = (r && r.rows) || []; S.total = (r && r.total) || 0; S.sum = (r && r.sum) || {}; S.companies = (r && r.companies) || S.companies || [];
    if (!S.rows.length && S.off > 0 && S.total > 0) { S.off = Math.max(0, Math.floor((S.total - 1) / S.lim) * S.lim); S.loading = !1; return load(); }
  } catch (e) { if (S !== S0 || my !== S.seq) return; S.rows = []; S.total = 0; S.sum = {}; S.err = errMsg(e); }
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
var I9 = (function () {   /* V.729 : ไอคอนหน้าต่างรายละเอียด EXPENSES */
  var s = function (p, w) { return '<svg width="' + (w || 18) + '" height="' + (w || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  return { doc: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h6"/>', 22),
    bld: s('<path d="M3 21h18"/><path d="M5 21V5h9v16"/><path d="M14 9h5v12"/><path d="M8 9h3M8 13h3M8 17h3"/>'), usr: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>'),
    hbl: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>'), lay: s('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    coin: s('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'), hand: s('<path d="M3 13h4l3 2h5a2 2 0 0 1 0 4H9"/><path d="M14 17l5-3a2 2 0 0 1 2 3l-6 4H3"/><circle cx="16" cy="6" r="3"/>'),
    acc: s('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>'), chk: s('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'), tag: s('<path d="M20 12 12 20 4 12V4h8z"/><circle cx="8.5" cy="8.5" r="1.5"/>'),
    cal: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3M13 14h3M8 17h3"/>'), one: s('<circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 12-4.9"/><path d="m15 19 2 2 4-4"/>'),
    clk: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), clip: s('<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>', 20),
    x: s('<path d="M6 6l12 12M18 6 6 18"/>', 18), bin: s('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>', 18) };
})();
function dtm9(x) { if (!x) return ""; var d = new Date(x); return isNaN(d) ? "" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + " น."; }
function ext9(n) { var m = /\.([A-Za-z0-9]+)$/.exec(String(n || "")); return m ? m[1].toUpperCase() : "FILE"; }
function css9() {
  if (document.getElementById("ex729-css")) return;
  var st = document.createElement("style"); st.id = "ex729-css";
  st.textContent = [
    ".ex9-md{background:#fff;border-radius:16px;width:min(1120px,calc(100vw - 32px));max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.28),0 4px 14px rgba(15,23,42,.12)}",
    ".ex9-h{flex:none;display:flex;align-items:center;gap:14px;padding:14px 20px;background:linear-gradient(90deg,#1255EA,#0898F7);color:#fff}.ex9-h b{flex:1;font-size:21px;font-weight:800;letter-spacing:.2px}",
    ".ex9-hi{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".ex9-x{width:40px;height:40px;border-radius:10px;border:0;background:#fff;color:#1d4ed8;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex:none}",
    ".ex9-b{flex:1 1 auto;overflow:auto;min-height:0;padding:16px 20px;background:#f8fafc}",
    ".ex9-sum{display:flex;align-items:center;gap:16px;border-radius:14px;background:linear-gradient(90deg,#e3edfd,#eef4ff);border:1px solid #d6e3fb;padding:12px 18px;margin:0 0 14px}",
    ".ex9-si{width:56px;height:56px;border-radius:14px;background:#cfe0fb;color:#1d4ed8;display:inline-flex;align-items:center;justify-content:center;flex:none}.ex9-si svg{width:30px;height:30px}",
    ".ex9-sj{flex:1;min-width:0}.ex9-sj span{display:block;color:#475569;font-size:13px}.ex9-sj b{display:block;font-size:24px;font-weight:800;color:#0f1f4b;overflow-wrap:anywhere}",
    ".ex9-ss{border-left:1px solid #bcd0f2;padding-left:22px;min-width:220px}.ex9-ss>span:not(.ex9-bd){display:block;color:#0f172a;font-weight:700;font-size:13px;margin-bottom:4px}.ex9-ss .ex9-bd{white-space:nowrap}",
    ".ex9-bd{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:10px;font-weight:800;font-size:15px;color:#fff}.ex9-bd.o{background:#f59e0b}.ex9-bd.g{background:#16a34a}.ex9-bd.r{background:#dc2626}.ex9-bd svg{width:18px;height:18px}",
    ".ex9-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 14px}",
    ".ex9-c{background:#fff;border:1px solid #cfdcf5;border-radius:12px;padding:6px 16px}",
    ".ex9-r{display:grid;grid-template-columns:36px 150px minmax(0,1fr);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #DCE4F5;font-size:14px}.ex9-r:last-child{border-bottom:0}",
    ".ex9-r i{width:36px;height:36px;border-radius:10px;background:#EDE9FE;color:#4F46E5;display:flex;align-items:center;justify-content:center}.ex9-r span{color:#475569}",
    ".ex9-r b{color:#0f1f4b;font-weight:800;overflow-wrap:anywhere;min-width:0}.ex9-r .hl{display:inline-block;background:#ede4ff;color:#2e1065;border-radius:10px;padding:4px 14px;font-size:16px}",
    ".ex9-d{background:#fff;border:1px solid #ddd6fe;border-radius:12px;overflow:hidden}",
    ".ex9-r b.nt{white-space:pre-wrap;word-break:break-word;color:#991b1b}",   /* V.733 : หมายเหตุเก็บลูกค้าไม่ได้ แสดงครบ */
    ".ex9-dh{display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(90deg,#ede9fe,#f5f3ff);color:#4c1d95;flex-wrap:wrap}.ex9-dh>i{display:flex;color:#6d28d9}",
    ".ex9-dh b{font-size:16px;font-weight:800}.ex9-dn{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;background:#ddd6fe;color:#4c1d95;font-weight:800;font-size:12.5px}",
    ".ex9-at{margin-left:auto;display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:0 16px;border-radius:10px;border:0;background:#7c3aed;color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit}.ex9-at:disabled{opacity:.5;cursor:not-allowed}",
    ".ex9-dl{list-style:none;margin:0;padding:8px 12px 12px;display:grid;gap:8px}.ex9-df{display:flex;align-items:center;gap:12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:8px 12px;min-width:0}",
    ".ex9-fi{width:42px;height:42px;border-radius:8px;background:#fee2e2;color:#dc2626;font-weight:800;font-size:11px;display:inline-flex;align-items:center;justify-content:center;flex:none}.ex9-fi.w{background:#dbeafe;color:#1d4ed8}.ex9-fi.x{background:#dcfce7;color:#15803d}.ex9-fi.i{background:#fef3c7;color:#b45309}",
    ".ex9-fm{flex:1 1 auto;min-width:0}.ex9-fm b{display:block;font-weight:800;color:#0f172a;overflow-wrap:anywhere}.ex9-fm small{display:block;color:#64748b;font-size:12.5px;overflow-wrap:anywhere}",
    ".ex9-fa{flex:none;display:flex;gap:8px;flex-wrap:wrap}.ex9-fb{display:inline-flex;align-items:center;gap:5px;min-height:36px;padding:0 14px;border-radius:9px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}",
    ".ex9-fb.r{border-color:#fecaca;background:#fef2f2;color:#dc2626}.ex9-fb svg{width:15px;height:15px}.ex9-no{color:#64748b;padding:12px 14px}.ex9-lk{color:#92400e;font-size:12.5px;padding:0 14px 10px}",
    ".ex9-f{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;border-top:1px solid #e2e8f0;background:#fff}",
    ".ex9-bt{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 22px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit}",
    ".ex9-bt.d{border:0;background:#EF1717;color:#fff}.ex9-bt.c{border:1.5px solid #1d4ed8;background:#fff;color:#1d4ed8}.ex9-bt:disabled{opacity:.55;cursor:not-allowed}",
    "@media (max-width:760px){.ex9-md{width:calc(100vw - 16px);max-height:calc(100dvh - 16px)}.ex9-h{padding:10px 12px}.ex9-h b{font-size:17px}.ex9-b{padding:10px}.ex9-g{grid-template-columns:minmax(0,1fr)}",
    ".ex9-sum{flex-wrap:wrap;padding:10px 12px}.ex9-ss{border-left:0;padding-left:0;min-width:0;flex-basis:100%}.ex9-r{grid-template-columns:32px 110px minmax(0,1fr)}.ex9-df{flex-wrap:wrap}.ex9-fa{width:100%}.ex9-fb{flex:1 1 auto;justify-content:center}",
    ".ex9-f{padding:10px 12px calc(10px + env(safe-area-inset-bottom))}.ex9-bt{flex:1 1 0;padding:0 12px}}"
  ].join("");
  document.head.appendChild(st);
}
function detail(x) {   /* V.729 : หน้าต่างรายละเอียด EXPENSES แบบใหม่ (Header Gradient · แถบ JOB / สถานะ · 2 คอลัมน์ · Supporting Documents · Footer ลบ JOB / ปิด) — ข้อมูลจริงจาก njacc_exp723_list */
  closeDetail(); css9();
  var D = function (v) { return v == null || String(v).trim() === "" ? "—" : esc(v); };
  var row = function (ic, k, v) { return '<div class="ex9-r"><i>' + ic + "</i><span>" + k + "</span><b>" + v + "</b></div>"; };
  var fs = x.files || [], cc = !!x.cannot_collect, ed = !!x.can_edit && !cc;   /* V.733 : รายการเก็บลูกค้าไม่ได้ = READ ONLY (ดู / ดาวน์โหลด / ปิด) */
  var fl = fs.length ? '<ul class="ex9-dl">' + fs.map(function (f, i) { var e = ext9(f.name), c = e === "PDF" ? "" : /DOCX?/.test(e) ? " w" : /XLSX?/.test(e) ? " x" : " i";
      return '<li class="ex9-df"><span class="ex9-fi' + c + '">' + esc(e) + '</span><span class="ex9-fm"><b>' + esc(f.name) + "</b><small>" + esc(kb(f.size)) + (f.uploaded_by ? " · แนบโดย " + esc(f.uploaded_by) : "") + (f.uploaded_at ? " · " + esc(dtm9(f.uploaded_at)) : "") + "</small></span>" +
        '<span class="ex9-fa"><button type="button" class="ex9-fb" data-fv="' + i + '">' + IC.eye + 'ดูไฟล์</button><button type="button" class="ex9-fb" data-fd="' + i + '">' + IC.dl + "ดาวน์โหลด</button>" +
        (ed ? '<button type="button" class="ex9-fb r" data-fx="' + i + '" aria-label="ลบไฟล์ ' + esc(f.name) + '">' + I9.bin + "ลบ</button>" : "") + "</span></li>"; }).join("") + "</ul>"
    : '<div class="ex9-no">ไม่มีไฟล์แนบ</div>';
  var o = document.createElement("div"); o.className = "ex7-ov"; o.setAttribute("data-ex7dt", "");
  o.innerHTML = '<div class="ex9-md" role="dialog" aria-modal="true" aria-label="รายละเอียด EXPENSES"><div class="ex9-h"><span class="ex9-hi">' + I9.doc + '</span><b>รายละเอียด EXPENSES</b><button type="button" class="ex9-x" data-x aria-label="ปิด">' + I9.x + "</button></div>" +
    '<div class="ex9-b"><section class="ex9-sum"><span class="ex9-si">' + I9.doc + '</span><div class="ex9-sj"><span>JOB No.</span><b>' + D(x.job_no) + '</b></div><div class="ex9-ss"><span>สถานะ</span>' +
      (cc ? '<span class="ex9-bd r">' + I9.x + "เก็บลูกค้าไม่ได้</span>" : x.billed ? '<span class="ex9-bd g">' + I9.chk + "เก็บลูกค้าแล้ว</span>" : '<span class="ex9-bd o">' + I9.clk + "รอเก็บลูกค้า</span>") + "</div></section>" +
    '<div class="ex9-g"><section class="ex9-c">' + row(I9.bld, "Company", D(x.company)) + row(I9.usr, "Customer", D(x.customer)) + row(I9.hbl, "House B/L", D(x.hbl)) + row(I9.lay, "รายละเอียด", D(x.description)) +
      row(I9.coin, "ยอดเงิน", '<span class="hl">' + fm(x.pay_amount) + " บาท</span>") + row(I9.hand, "เก็บลูกค้าได้", fm(x.collect_amount) + " บาท") + "</section>" +
    '<section class="ex9-c">' + row(I9.acc, "AMOUNT (ACCOUNTING)", x.match_amount != null ? fm(x.match_amount) + " บาท" : "—") + row(I9.chk, "เก็บลูกค้าแล้ว", badge(x)) + row(I9.tag, "INVOICE NJ", D(invNo(x))) +
      (cc ? '<div class="ex9-r"><i>' + I9.lay + '</i><span>หมายเหตุ</span><b class="nt">' + D(x.note) + "</b></div>" : "") +
      row(I9.cal, "วันที่ POST", x.posted_at ? esc(dts(x.posted_at)) : "—") + row(I9.one, "ผู้บันทึก", D(x.created_by)) + (x.created_at ? row(I9.cal, "วันที่บันทึก", esc(dtm9(x.created_at))) : "") +
      (cc ? row(I9.cal, "วันที่ปิดงาน", x.closed_at ? esc(dtm9(x.closed_at)) : "—") : "") + "</section></div>" +
    '<section class="ex9-d"><div class="ex9-dh"><i>' + I9.clip + "</i><b>เอกสารเพิ่มเติม (Supporting Documents)</b>" + '<span class="ex9-dn">' + fs.length + ' ไฟล์</span>' + (cc ? "" : '<button type="button" class="ex9-at" data-fa' + (ed ? "" : ' disabled title="JOB ปิดงาน / ยกเลิก / มี INVOICE POST แล้ว — แนบ / ลบไฟล์ไม่ได้"') + ">" + I9.clip + 'แนบไฟล์</button>' +
      '<input type="file" data-fin multiple hidden accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx">') + "</div>" + fl + (ed ? "" : '<div class="ex9-lk">🔒 ' + (cc ? "รายการเก็บลูกค้าไม่ได้ (ปิดงานแล้ว)" : "JOB ปิดงาน / ยกเลิก / มี INVOICE POST แล้ว") + ' — ดู / ดาวน์โหลดได้อย่างเดียว</div>') + "</section></div>" +
    '<div class="ex9-f">' + (cc ? "<span></span>" : '<button type="button" class="ex9-bt d" data-hd>' + I9.bin + 'ลบ JOB</button>') + '<button type="button" class="ex9-bt c" data-x>' + I9.x + "ปิด</button></div></div>";
  document.body.appendChild(o);
  var key = function (e) { if (e.key === "Escape" && !document.querySelector(".xp717-ov")) { closeDetail(); } };
  o.__key = key; document.addEventListener("keydown", key);
  var busy = !1;
  var again = async function (msg) { await load(); var y = S && (S.rows || []).find(function (r) { return r.item_id === x.item_id; }); if (y) detail(y); else closeDetail(); msg && toast(msg, "ok"); };
  o.addEventListener("click", async function (e) {
    if (e.target === o || e.target.closest("[data-x]")) { if (!busy) closeDetail(); return; }
    var v = e.target.closest("[data-fv]"), d = e.target.closest("[data-fd]"), fx = e.target.closest("[data-fx]");
    if (v) { XF().preview(fs[Number(v.dataset.fv)]); return; }
    if (d) { XF().download(fs[Number(d.dataset.fd)]); return; }
    if (busy) return;
    if (cc) return;   /* V.733 : READ ONLY */
    if (fx) { var f = fs[Number(fx.dataset.fx)]; if (!f || !(await XF().confirm("ลบไฟล์แนบ", "ต้องการลบไฟล์แนบนี้หรือไม่?\n" + f.name, "ยืนยันลบ"))) return;
      busy = !0; fx.disabled = !0;
      try { await rpc("njacc_exp729_file_del", { p: { file_id: f.id } }); busy = !1; await again("ลบไฟล์ " + f.name + " แล้ว"); } catch (er) { busy = !1; fx.disabled = !1; toast("ลบไฟล์ไม่สำเร็จ — " + errMsg(er), "err"); }
      return; }
    if (e.target.closest("[data-fa]")) { var inp = o.querySelector("[data-fin]"); inp && (inp.value = "", inp.click()); return; }
    if (e.target.closest("[data-hd]")) {
      if (!(await XF().confirm("ลบ JOB ออกจาก EXPENSES", "ต้องการลบรายการนี้ออกจาก EXPENSES หรือไม่?\nJOB " + (x.job_no || "-") + " · " + (x.description || "") + "\n(ข้อมูลต้นทาง DOCUMENT → SERVICE / ไฟล์ไม่เปลี่ยน)", "ยืนยันลบ"))) return;
      busy = !0;
      try { await rpc("njacc_exp723_hide", { p: { item_id: x.item_id } }); busy = !1; closeDetail(); toast("ลบรายการ JOB " + (x.job_no || "") + " ออกจาก EXPENSES แล้ว (ข้อมูลต้นทางไม่เปลี่ยน)", "ok"); load(); }
      catch (er) { busy = !1; toast("ลบไม่สำเร็จ — " + errMsg(er), "err"); }
    }
  });
  o.addEventListener("change", async function (e) {
    if (cc || !e.target.matches("[data-fin]")) return; var list = Array.prototype.slice.call(e.target.files || []); e.target.value = ""; if (!list.length || busy) return;
    busy = !0; var at = o.querySelector("[data-fa]"); at && (at.disabled = !0, at.textContent = "กำลังอัปโหลด…");
    var r = await XF().upload(x.job_id, x.item_id, list); busy = !1;
    r.bad.length && toast("แนบไม่สำเร็จ : " + r.bad.join(" · "), "err");
    if (r.ok) await again("แนบไฟล์แล้ว " + r.ok + " ไฟล์"); else if (at) { at.disabled = !1; at.innerHTML = I9.clip + "แนบไฟล์"; }
  });
  var bx = o.querySelector(".ex9-x"); bx && bx.focus();
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
    var H = ["ลำดับ", "JOB No.", "Company", "Customer", "House B/L", "รายละเอียด", "ยอดเงิน", "เก็บลูกค้าได้", "เก็บลูกค้าแล้ว", "INVOICE NJ", "วันที่ POST", "หมายเหตุ", "ผู้บันทึก", "วันที่ CLOSE"];   /* V.733 : + หมายเหตุ / ผู้บันทึก / วันที่ CLOSE */
    ws.columns = [8, 18, 34, 34, 20, 36, 15, 15, 17, 22, 13, 40, 20, 13].map(function (w) { return { width: w }; });
    var TH = { style: "thin", color: { argb: "FFD9E2EC" } }, BD = { top: TH, left: TH, bottom: TH, right: TH };
    var put = function (rn, vals, st) { var row = ws.getRow(rn); for (var c = 0; c < H.length; c++) { var cell = row.getCell(c + 1), v = vals[c]; cell.value = v == null ? "" : v; cell.border = BD; cell.alignment = { vertical: "middle", wrapText: !0, horizontal: c === 6 || c === 7 ? "right" : c === 0 || c === 8 || c === 10 || c === 13 ? "center" : "left" };
      if ((c === 6 || c === 7) && typeof v === "number") cell.numFmt = "#,##0.00"; st && st(cell, c); } row.commit && row.commit(); };
    put(1, H, function (cell) { cell.font = { bold: !0, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; cell.alignment = { vertical: "middle", horizontal: "center", wrapText: !0 }; });
    all.forEach(function (x, i) { put(i + 2, [i + 1, String(x.job_no || ""), x.company || "", x.customer || "", x.hbl || "", x.description || "", Number(x.pay_amount) || 0, Number(x.collect_amount) || 0, x.cannot_collect ? "เก็บลูกค้าไม่ได้" : x.billed ? "เก็บลูกค้าแล้ว" : "รอเก็บลูกค้า", String(invNo(x) || ""), dts(x.posted_at),
      x.cannot_collect ? String(x.note || "") : "", String(x.created_by || ""), x.cannot_collect && x.closed_at ? dts(x.closed_at) : ""]); });
    var tp = 0, tc = 0; all.forEach(function (x) { tp += Number(x.pay_amount) || 0; tc += Number(x.collect_amount) || 0; });
    put(all.length + 2, ["", "", "", "", "", "รวม", Math.round(tp * 100) / 100, Math.round(tc * 100) / 100, "", "", "", "", "", ""], function (cell) { cell.font = { bold: !0 }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, all.length + 1), column: H.length } };
    var d = new Date(), fn = "EXPENSES_" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ".xlsx";
    var buf = await wb.xlsx.writeBuffer(), url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), a = document.createElement("a");
    a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("ส่งออก Excel " + all.length + " รายการแล้ว", "ok");
  } catch (e) { toast("ส่งออก Excel ไม่สำเร็จ — " + errMsg(e), "err"); }
  btn.disabled = !1; btn.innerHTML = lb;
}
function tb731() {   /* V.731 : ติด class เฉพาะตอนอยู่ #/expenses · ออกจากหน้า = เอาออกทันที (ไม่กระทบเมนูอื่น) */
  var on = function () { document.documentElement.classList.toggle("ex731", /^#\/?expenses(?:[/?]|$)/.test(location.hash || "")); };
  on(); if (!tb731.b) { tb731.b = !0; window.addEventListener("hashchange", on); }
}
function OFF803(m) { return S !== m || !(m && m.el && m.el.isConnected); }   /* V.803 : หน้าที่ออกไปแล้ว (State เก่า / Element หน้าเดิมไม่อยู่ในจอ) = ไม่รับ Event */
async function render(root, args) {
  css(); closeDetail(); tb731();
  S = { root: root, f: { company_id: "", date_from: "", date_to: "", status: "ALL", q: "" }, lim: 20, off: 0, rows: [], total: 0, sum: {}, companies: null, seq: 0, loading: !1, err: "" };
  root.innerHTML = shell();
  var me = S, fo = root.querySelector("[data-f]"); me.el = root.firstElementChild;   /* V.803 */
  var readF = function () { var f = {}; ["company_id", "date_from", "date_to", "status", "q"].forEach(function (k) { var el = fo.elements[k]; f[k] = el ? String(el.value || "").trim() : ""; }); return f; };
  fo.addEventListener("submit", function (e) { e.preventDefault(); if (OFF803(me)) return; S.f = readF(); S.off = 0; load(); });
  /* V.802 : ค้นหา Real-Time — พิมพ์ / ลบ (Debounce 280 ms) · บริษัท / สถานะ / วันที่ = ทันที → ตัวกรองเดิม (readF) · หน้า 1 · load() เดิม (njacc_exp723_list · กันผลเก่าด้วย S.seq เดิม) · เงื่อนไขไม่เปลี่ยน = ไม่เรียกซ้ำ */
  var t802r = 0, k802 = ["company_id", "date_from", "date_to", "status", "q"];
  var go802 = function () { t802r = 0; if (OFF803(me)) return; var f = readF(); if (k802.every(function (k) { return String(f[k] || "") === String((S.f || {})[k] || ""); })) return; S.f = f; S.off = 0; load(); };
  var on802 = function (e) { if (OFF803(me) || !e.target || !e.target.name || e.isComposing) return; clearTimeout(t802r); t802r = setTimeout(go802, e.target.name === "q" ? 280 : 0); };
  fo.addEventListener("input", on802); fo.addEventListener("change", on802); fo.addEventListener("compositionend", on802);
  fo.addEventListener("change", function (e) { if (OFF803(me)) return; if (e.target.name === "company_id" || e.target.name === "status") { S.f = readF(); S.off = 0; load(); } });
  root.addEventListener("change", function (e) { if (OFF803(me)) return; if (e.target.matches("[data-lim]")) { S.lim = Number(e.target.value) || 20; S.off = 0; load(); } });
  root.addEventListener("keydown", function (e) { if (OFF803(me)) return; var tr = e.target.closest && e.target.closest("tr[data-i]"); if (tr && e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); S.lastTr = tr; detail(S.rows[Number(tr.dataset.i)]); } });
  root.addEventListener("click", function (e) {
    if (OFF803(me)) return;
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
  window.addEventListener("hashchange", function hc() { if (OFF803(me)) { window.removeEventListener("hashchange", hc); return; } closeDetail(); });
  await load();
}
export{render};
