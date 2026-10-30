import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";import{a as LX}from"./chunk-LAFWE2EM.js";
/* ═══ V.702 · CASH ADVANCE : รายงานติดตามเงินสำรองจ่ายที่ SUPER_ADMIN อนุมัติแล้ว (REPORT ONLY 100%)
   ข้อมูล : RPC อ่านอย่างเดียว njacc_cash_adv702_list / njacc_cash_adv702_get (RUN-702) + Timeline เดิม njacc_adv698_get · สิทธิ์ SUPER_ADMIN ตรวจที่ฐานข้อมูล
   แท็บ 2 ปุ่มเท่านั้น : ยังไม่ออก INVOICE / ออก INVOICE แล้ว (INVOICE ADV ที่ POST สำเร็จ) · แบ่งหน้า 10 / 20 / 50 · ไม่มีปุ่มสร้าง / แก้ไข / ลบ / อนุมัติ / จ่ายเงิน
   สลิป : Storage private (Signed URL อายุ 2 นาที · โหลดเมื่อกดดูเท่านั้น) ═══ */
var S = null, BK = "njacc-adv-slips", XURL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
var IC = {
  wal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h.01"/></svg>',
  eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  rf: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  xl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  q: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  cp: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  fl: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>'
};
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dtm(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
function dd(x) { if (!x) return "-"; var p = String(x).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(x); }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
function errMsg(e) {
  var m = String(e && (e.message || e.code) || e || "");
  if (/NJACC_CASHADV_SUPER_ONLY/.test(m)) return "CASH ADVANCE : เฉพาะ SUPER_ADMIN เท่านั้น";
  if (/NJACC_CASHADV_NOT_APPROVED/.test(m)) return "รายการนี้ยังไม่ได้รับอนุมัติ — ไม่แสดงใน CASH ADVANCE";
  if (/njacc_cash_adv702_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "CASH ADVANCE ยังไม่พร้อม (ต้องรัน RUN-702 ก่อน)";
  return m || "โหลดข้อมูลไม่สำเร็จ";
}
function css() {
  if (document.getElementById("ca7-css")) return;
  var s = document.createElement("style"); s.id = "ca7-css";
  s.textContent = [
    ".ca7{font-size:13px;color:#0f172a;min-width:0}.ca7 *{box-sizing:border-box}",
    ".ca7-hd{display:flex;align-items:center;gap:10px;margin:0 0 8px;min-height:40px}",
    ".ca7-ic{flex:none;width:36px;height:36px;border-radius:9px;background:#7c3aed;color:#fff;display:inline-flex;align-items:center;justify-content:center}",
    ".ca7-hd h2{margin:0;font-size:18px;line-height:1.15}.ca7-hd small{display:block;color:#64748b;font-size:12px}.ca7-sp{flex:1}",
    ".ca7-b{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#1e293b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}",
    ".ca7-b:hover{background:#f1f5f9}.ca7-b:disabled{opacity:.6;cursor:wait}.ca7-b.g{background:#16a34a;border-color:#16a34a;color:#fff}.ca7-b.g:hover{background:#15803d}.ca7-b.p{background:#2563eb;border-color:#2563eb;color:#fff}.ca7-b.p:hover{background:#1d4ed8}",
    ".ca7-f{display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;margin:0 0 8px}",
    ".ca7-f label{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:#475569;font-weight:600;min-width:0}",
    ".ca7-f input{height:30px;border:1px solid #cbd5e1;border-radius:7px;padding:0 8px;font-size:12.5px;font-family:inherit;background:#fff;color:#0f172a;min-width:0}",
    ".ca7-f input[type=date]{width:132px}.ca7-f .w1{width:140px}.ca7-f .w2{width:170px}.ca7-dt{display:flex;align-items:center;gap:4px}",
    ".ca7-ft{display:none}",
    ".ca7-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 6px}",
    ".ca7-tab{height:32px;padding:0 14px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;border:1px solid}",
    ".ca7-tab.n{background:#fff7ed;border-color:#fed7aa;color:#c2410c}.ca7-tab.n.on{background:#f97316;border-color:#f97316;color:#fff}",
    ".ca7-tab.i{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}.ca7-tab.i.on{background:#2563eb;border-color:#2563eb;color:#fff}",
    ".ca7-sum{margin-left:auto;font-size:12.5px;color:#334155;white-space:nowrap}.ca7-sum b{color:#0f172a}",
    ".ca7-tw{overflow:auto;border:1px solid #e2e8f0;border-radius:10px;background:#fff;max-width:100%}",
    ".ca7-t{width:100%;min-width:980px;border-collapse:collapse;font-size:12.5px}",
    ".ca7-t th{background:#f1f5f9;color:#334155;font-weight:600;text-align:left;padding:6px 8px;white-space:nowrap;border-bottom:1px solid #e2e8f0;position:sticky;top:0}",
    ".ca7-t td{padding:5px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;line-height:1.3}",
    ".ca7-t tr:hover td{background:#f8fafc}.ca7-t .r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.ca7-t .c{text-align:center}",
    ".ca7-el{display:block;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ca7-job{white-space:nowrap;font-weight:600}",
    ".ca7-bd{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}",
    ".ca7-bd.g{background:#dcfce7;color:#15803d}.ca7-bd.o{background:#ffedd5;color:#c2410c}.ca7-bd.b{background:#dbeafe;color:#1d4ed8}.ca7-bd.r{background:#fee2e2;color:#b91c1c}.ca7-bd.x{background:#f1f5f9;color:#475569}",
    ".ca7-no{color:#b91c1c;font-weight:600;white-space:nowrap}.ca7-inv{white-space:nowrap;font-weight:600;color:#1d4ed8}",
    ".ca7-ib{width:28px;height:28px;border-radius:7px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}",
    ".ca7-em{padding:22px;text-align:center;color:#64748b}",
    ".ca7-pg{display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin:6px 0 0;font-size:12.5px;color:#475569}",
    ".ca7-pg select{height:28px;border:1px solid #cbd5e1;border-radius:7px;font-family:inherit}.ca7-pg button{width:30px;height:28px;border-radius:7px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}.ca7-pg button:disabled{opacity:.45;cursor:default}",
    ".ca7-dw{position:fixed;top:0;right:0;bottom:0;width:min(520px,100%);background:#fff;z-index:1200;box-shadow:-10px 0 30px rgba(15,23,42,.18);display:flex;flex-direction:column}",
    ".ca7-dh{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e2e8f0}.ca7-dh b{flex:1;font-size:15px}",
    ".ca7-dx{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:18px;cursor:pointer}",
    ".ca7-db{flex:1;overflow:auto;padding:10px 14px 18px}",
    ".ca7-st{border-radius:9px;padding:8px 10px;font-weight:700;margin:0 0 10px}.ca7-st.g{background:#dcfce7;color:#14532d}.ca7-st.b{background:#eff6ff;color:#1e3a8a}",
    ".ca7-h3{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:700;color:#1e3a8a;margin:12px 0 6px}",
    ".ca7-dl{display:grid;grid-template-columns:118px minmax(0,1fr);gap:3px 10px;font-size:12.5px}.ca7-dl dt{color:#64748b}.ca7-dl dd{margin:0;font-weight:600;word-break:break-word}",
    ".ca7-it{border:1px solid #e2e8f0;border-radius:9px;padding:8px 10px;margin:0 0 6px;font-size:12.5px}.ca7-it .h{display:flex;justify-content:space-between;gap:6px;font-weight:700}",
    ".ca7-it .g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 10px;margin-top:4px;color:#334155}",
    ".ca7-cp{display:inline-flex;align-items:center;gap:3px;height:24px;padding:0 8px;border-radius:6px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;margin-left:4px}",
    ".ca7-iv{width:100%;border-collapse:collapse;font-size:12.5px}.ca7-iv th,.ca7-iv td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}.ca7-iv th{background:#f8fafc}",
    ".ca7-warn{margin-top:6px;padding:6px 8px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:12px}",
    ".ca7-sl{border:1px solid #e2e8f0;border-radius:9px;padding:8px 10px;margin:0 0 6px;font-size:12.5px}.ca7-sl .a{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}",
    ".ca7-tl{list-style:none;margin:0;padding:0}.ca7-tl li{display:grid;grid-template-columns:10px 112px minmax(0,1fr);gap:8px;padding:5px 0;border-bottom:1px dashed #eef2f7;font-size:12.5px}",
    ".ca7-dot{width:9px;height:9px;border-radius:50%;margin-top:4px;background:#64748b}.ca7-dot.o{background:#f97316}.ca7-dot.i{background:#2563eb}.ca7-dot.c{background:#16a34a}.ca7-dot.p{background:#7c3aed}.ca7-dot.x{background:#dc2626}",
    ".ca7-tl small{display:block;color:#64748b}",
    "@media (max-width:900px){.ca7-ft{display:inline-flex}.ca7-f .ca7-more{display:none}.ca7-f.open .ca7-more{display:flex}.ca7-sum{margin-left:0;white-space:normal}}"
  ].join("");
  document.head.appendChild(s);
}
function rpc(n, a) { return RPC(n, a); }
function copy(text, ok) {
  var done = function () { toast(ok, "ok"); };
  try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fb); return; } } catch (e) {}
  fb();
  function fb() { try { var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); } catch (e) { toast("คัดลอกไม่สำเร็จ", "err"); } }
}
function payBadge(x) {
  if (x.status === "PAID") return '<span class="ca7-bd g">จ่ายเงินแล้ว</span>';
  if (Number(x.paid_count) > 0) return '<span class="ca7-bd b">จ่ายแล้ว ' + x.paid_count + "/" + x.item_count + "</span>";
  return '<span class="ca7-bd o">รอจ่ายเงิน</span>';
}
function payText(x) { return x.status === "PAID" ? "จ่ายเงินแล้ว" : Number(x.paid_count) > 0 ? "จ่ายแล้ว " + x.paid_count + "/" + x.item_count + " รายการ" : "รอจ่ายเงิน"; }
function filt() { return { date_from: S.f.date_from, date_to: S.f.date_to, job_no: S.f.job_no, company: S.f.company, customer: S.f.customer, hbl: S.f.hbl }; }

/* ── หน้าหลัก ── */
function shell() {
  return '<div class="ca7"><div class="ca7-hd"><span class="ca7-ic">' + IC.wal + '</span><div><h2>CASH ADVANCE</h2><small>รายงานติดตามเงินสำรองจ่ายที่อนุมัติแล้ว</small></div><span class="ca7-sp"></span>' +
    '<button type="button" class="ca7-b" data-rf title="โหลดใหม่">' + IC.rf + "REFRESH</button>" +
    '<button type="button" class="ca7-b g" data-xl>' + IC.xl + "Export Excel</button></div>" +
    '<form class="ca7-f" data-f autocomplete="off"><label>วันที่อนุมัติ<span class="ca7-dt"><input type="date" name="date_from"> – <input type="date" name="date_to"></span></label>' +
    '<label>JOB No.<input class="w1" name="job_no" placeholder="JOBAD…"></label>' +
    '<label class="ca7-more">Company<input class="w2" name="company" placeholder="บริษัท"></label>' +
    '<label class="ca7-more">Customer<input class="w2" name="customer" placeholder="ลูกค้า"></label>' +
    '<label class="ca7-more">House B/L<input class="w1" name="hbl" placeholder="House B/L"></label>' +
    '<button type="submit" class="ca7-b p">' + IC.q + 'ค้นหา</button><button type="button" class="ca7-b" data-clr>ล้างกรอง</button>' +
    '<button type="button" class="ca7-b ca7-ft" data-ft>' + IC.fl + "Filter</button></form>" +
    '<div class="ca7-tabs" data-tabs></div><div data-body></div></div>';
}
function tabsHTML() {
  var c = S.counts || {}, s = S.sum || {};
  return '<button type="button" class="ca7-tab n' + (S.tab === "NOINV" ? " on" : "") + '" data-tab="NOINV">ยังไม่ออก INVOICE (' + (c.noinv || 0) + ")</button>" +
    '<button type="button" class="ca7-tab i' + (S.tab === "INV" ? " on" : "") + '" data-tab="INV">ออก INVOICE แล้ว (' + (c.inv || 0) + ")</button>" +
    '<span class="ca7-sum">' + (S.total || 0) + " รายการ · ยอดอนุมัติ <b>" + fm(s.approved) + "</b> · จ่ายจริง <b>" + fm(s.paid) + "</b> · รอจ่าย <b>" + fm(s.wait) + "</b> บาท</span>";
}
function bodyHTML() {
  if (S.err) return '<div class="ca7-tw"><div class="ca7-em">' + esc(S.err) + "</div></div>";
  var rows = S.rows.map(function (x, i) {
    var inv = Number(x.inv_count) > 0 ? (x.inv_nos || []).map(function (n) { return '<span class="ca7-inv">' + esc(n) + "</span>"; }).join("<br>") : '<span class="ca7-no">ยังไม่ออก INVOICE</span>';
    return "<tr><td class=\"c\">" + (S.off + i + 1) + '</td><td style="white-space:nowrap">' + esc(dtm(x.approved_at)) + '</td><td><span class="ca7-job">' + esc(x.job_no) + "</span>" + (x.job_canceled ? ' <span class="ca7-bd r">JOB ยกเลิก</span>' : "") +
      '</td><td><span class="ca7-el" title="' + esc(x.company || "") + '">' + esc(x.company || "-") + '</span></td><td><span class="ca7-el" title="' + esc(x.customer || "") + '">' + esc(x.customer || "-") +
      '</span></td><td class="r">' + fm(x.total_real) + '</td><td class="r">' + fm(x.paid_total) + "</td><td>" + payBadge(x) + "</td><td>" + inv +
      '</td><td class="c"><button type="button" class="ca7-ib" data-view="' + esc(x.job_id) + '" title="ดูรายละเอียด">' + IC.eye + "</button></td></tr>";
  }).join("");
  var from = S.total ? S.off + 1 : 0, to = S.off + S.rows.length;
  return '<div class="ca7-tw"><table class="ca7-t"><thead><tr><th class="c" style="width:42px">#</th><th style="width:118px">วันที่อนุมัติ</th><th style="width:150px">JOB No.</th><th>Company</th><th>Customer</th><th class="r" style="width:110px">ยอดอนุมัติ</th><th class="r" style="width:110px">ยอดจ่ายจริง</th><th style="width:110px">สถานะจ่ายเงิน</th><th style="width:140px">INVOICE ADV</th><th class="c" style="width:64px">จัดการ</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="10" class="ca7-em">' + (S.loading ? "กำลังโหลด…" : "ไม่มีรายการ") + "</td></tr>") + "</tbody></table></div>" +
    '<div class="ca7-pg">แสดง <select data-lim>' + [10, 20, 50].map(function (n) { return '<option value="' + n + '"' + (S.lim === n ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select> รายการ / หน้า · " +
    from + "–" + to + " จาก " + (S.total || 0) + ' <button type="button" data-pv' + (S.off <= 0 ? " disabled" : "") + '>‹</button><button type="button" data-nx' + (to >= S.total ? " disabled" : "") + ">›</button></div>";
}
function paint() { if (!S || !S.root.isConnected) return; var t = S.root.querySelector("[data-tabs]"), b = S.root.querySelector("[data-body]"); t && (t.innerHTML = tabsHTML()); b && (b.innerHTML = bodyHTML()); }
async function load() {
  var my = ++S.seq; S.loading = !0; S.err = ""; paint();
  try {
    var r = await rpc("njacc_cash_adv702_list", { p: Object.assign({ tab: S.tab, limit: S.lim, offset: S.off }, filt()) });
    if (my !== S.seq) return;
    S.rows = (r && r.rows) || []; S.total = (r && r.total) || 0; S.counts = (r && r.counts) || {}; S.sum = (r && r.sum) || {};
  } catch (e) { if (my !== S.seq) return; S.rows = []; S.total = 0; S.err = errMsg(e); }
  S.loading = !1; paint();
}

/* ── VIEW (Side Panel · อ่านอย่างเดียว) ── */
function closeView() { var d = document.querySelector(".ca7-dw"); d && d.remove(); if (S) S.cur = null; }
function itemsHTML(r) {
  return (r.items || []).map(function (it, i) {
    var n = i + 1, p = (r.pays || []).find(function (x) { return Number(x.item_no) === n; });
    return '<div class="ca7-it"><div class="h"><span>' + (r.item_count > 1 ? "รายการที่ " + n + " : " : "") + esc(it.payment_type || "-") + "</span><span>" + fm(it.real_pay) + " บาท</span></div><div class=\"g\">" +
      "<span>ธนาคาร : <b>" + esc(it.bank_name || "-") + "</b></span><span>ชื่อบัญชี : <b>" + esc(it.account_name || "-") + "</b></span>" +
      '<span style="grid-column:1/-1">เลขบัญชี : <b>' + esc(it.account_no || "-") + '</b><button type="button" class="ca7-cp" data-cpacc="' + n + '">' + IC.cp + "COPY</button></span>" +
      "<span>ยอดก่อนหัก : " + fm(it.gross) + "</span><span>ยอดหัก (" + esc(String(it.deduct_pct || 0)) + "%) : " + fm(it.deduct) + "</span>" +
      "<span>VAT (" + esc(String(it.vat_pct || 0)) + "%) : " + fm(it.vat) + "</span><span>ยอดจ่ายสุทธิ : <b>" + fm(it.real_pay) + "</b></span>" +
      '<div style="grid-column:1/-1;display:flex;align-items:center;gap:6px;flex-wrap:wrap">สถานะการจ่าย : ' + (p ? '<span class="ca7-bd g">จ่ายแล้ว ' + esc(dd(p.pay_date)) + "</span><span>โดย " + esc(p.paid_by || "-") + "</span>" : '<span class="ca7-bd o">รอจ่ายเงิน</span>') + "</div></div></div>";
  }).join("");
}
function invHTML(g) {
  var r = g.req, inv = g.invoices || [], post = inv.filter(function (x) { return x.status === "POSTED"; }), other = inv.filter(function (x) { return x.status !== "POSTED"; });
  if (!post.length) return '<div class="ca7-no">ยังไม่ออก INVOICE</div>' + (other.length ? '<div class="ca7-warn">มี INVOICE ADV ที่ยังไม่ POST ' + other.length + " ใบ (" + other.map(function (x) { return esc(x.invoice_no || "ร่าง") + " · " + esc(x.status); }).join(", ") + ") — ยังไม่นับว่าออก INVOICE แล้ว</div>" : "");
  var tot = post.reduce(function (a, x) { return a + (Number(x.total_amount) || 0); }, 0);
  var h = '<table class="ca7-iv"><thead><tr><th>INVOICE ADV No.</th><th>วันที่ INVOICE</th><th>สถานะ</th><th style="text-align:right">ยอด INVOICE</th></tr></thead><tbody>' +
    post.map(function (x) { return "<tr><td><b>" + esc(x.invoice_no || "-") + "</b></td><td>" + esc(dd(x.invoice_date)) + '</td><td><span class="ca7-bd g">POST แล้ว</span></td><td style="text-align:right">' + fm(x.total_amount) + "</td></tr>"; }).join("") + "</tbody></table>";
  if (post.length > 1) h += '<div class="ca7-warn" style="background:#eff6ff;color:#1e3a8a">มี INVOICE ADV ที่ POST แล้ว ' + post.length + " ใบ · ยอดรวม " + fm(tot) + " บาท</div>";
  if (tot + 0.005 < (Number(r.total_real) || 0)) h += '<div class="ca7-warn">ยอด INVOICE ADV ที่ POST (' + fm(tot) + " บาท) น้อยกว่ายอดอนุมัติ (" + fm(r.total_real) + " บาท) — อาจออก INVOICE เพียงบางส่วน / ตรวจสอบการเรียกเก็บ</div>";
  if (other.length) h += '<div class="ca7-warn">มี INVOICE ADV ที่ยังไม่ POST ' + other.length + " ใบ (ไม่นับรวม)</div>";
  return h;
}
function slipsHTML(r) {
  if (!(r.pays || []).length) return '<div style="color:#64748b">ยังไม่มีสลิป — รอจ่ายเงิน</div>';
  return r.pays.map(function (p) {
    var it = (r.items || [])[p.item_no - 1] || {};
    return '<div class="ca7-sl"><b>🧾 ' + esc(p.slip_name || "-") + "</b>" + (p.slip_size ? " · " + Math.max(1, Math.round(Number(p.slip_size) / 1024)) + " KB" : "") + '<div style="color:#64748b">' + (r.item_count > 1 ? "รายการที่ " + p.item_no + " : " : "") + esc(it.payment_type || "-") +
      " · ยอดจ่าย " + fm(p.amount) + " บาท · วันที่จ่าย " + esc(dd(p.pay_date)) + " · โดย " + esc(p.paid_by || "-") + '</div><div class="a"><button type="button" class="ca7-b" data-slipv="' + p.item_no + '">👁 ดูสลิป</button><button type="button" class="ca7-b" data-slipd="' + p.item_no + '">⬇ ดาวน์โหลดสลิป</button>' +
      '<button type="button" class="ca7-b" data-cpacc="' + p.item_no + '">' + IC.cp + 'COPY เลขบัญชี</button><button type="button" class="ca7-b" data-cppaid="' + p.item_no + '">📋 COPY ข้อความจ่ายแล้ว</button></div></div>';
  }).join("");
}
var TL = { CREATE_JOB: ["สร้างงาน", "s"], EDIT_JOB: ["แก้ไขงาน", "s"], EDIT_JOB_DOC_FIELDS: ["แก้ไขงาน", "s"], POST_JOB: ["POST งานสำเร็จ", "p"], SET_JOB_STATUS: ["เปลี่ยนสถานะงาน", "s"], CANCEL_JOB: ["ยกเลิกงาน", "x"],
  ADV698_ITEMS: ["บันทึกรายการจ่าย", "i"], SAVE_INVOICE_DRAFT: ["บันทึก INVOICE ADV (ร่าง)", "s"], ISSUE_INVOICE_NO_ON_SAVE: ["ออกเลข INVOICE ADV", "p"], POST_DRAFT_INVOICE: ["ออก INVOICE ADV แล้ว (POST)", "c"],
  POST_INVOICE: ["ออก INVOICE ADV แล้ว (POST)", "c"], UNPOST_INVOICE: ["UNPOST INVOICE ADV", "x"], UNPOST_TO_DRAFT: ["UNPOST INVOICE ADV", "x"], VOID_INVOICE: ["VOID INVOICE ADV", "x"],
  ACC_HANDOFF: ["ส่งต่อ FINANCE", "p"], ADVANCE_PAY: ["FINANCE ยืนยันจ่ายแล้ว (PAY)", "p"], ADVANCE_UNPAY: ["FINANCE ย้อนกลับ PAY", "x"] };
function tlHTML(g, tl) {
  var r = g.req, ev = [];
  (tl || []).forEach(function (e) {
    if (/^ADV701_/.test(e.action || "")) return;
    var m = TL[e.action] || [String(e.action || "").replace(/_/g, " "), "s"], d = e.detail || {}, sub = [];
    d.invoice_no && !/^DRAFT-/i.test(d.invoice_no) && sub.push(d.invoice_no); d.job_no && e.action === "POST_JOB" && sub.push("เลข JOB : " + d.job_no); d.reason && sub.push("เหตุผล: " + d.reason);
    ev.push({ at: e.at, c: m[1], t: m[0] + " โดย " + (e.by || "-"), s: sub.join(" · ") });
  });
  ev.push({ at: r.requested_at, c: "o", t: "ส่งคำขออนุมัติ โดย " + (r.requested_by || "-"), s: "ยอดขอเบิก " + fm(r.total_real) + " บาท" });
  r.approved_at && ev.push({ at: r.approved_at, c: "i", t: "อนุมัติแล้ว — รอจ่ายเงิน โดย " + (r.approved_by || "-"), s: "ยอดอนุมัติ " + fm(r.total_real) + " บาท" });
  (r.pays || []).forEach(function (p) { ev.push({ at: p.paid_at, c: "c", t: "จ่ายเงินแล้ว — แนบสลิปสำเร็จ โดย " + (p.paid_by || "-"), s: (r.item_count > 1 ? "รายการที่ " + p.item_no + " · " : "") + "ยอดจ่าย " + fm(p.amount) + " บาท · " + (p.slip_name || "") }); });
  ev.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  return '<ul class="ca7-tl">' + ev.map(function (x) { return '<li><span class="ca7-dot ' + x.c + '"></span><span style="color:#475569;white-space:nowrap">' + esc(dtm(x.at)) + "</span><span><b>" + esc(x.t) + "</b>" + (x.s ? "<small>" + esc(x.s) + "</small>" : "") + "</span></li>"; }).join("") + "</ul>";
}
function paidText(g, n) {
  var r = g.req, j = g.job || {}, d = function (v) { v = String(v == null ? "" : v).trim(); return v || "-"; }, L = [], tot = 0;
  L.push("✅ จ่ายเงิน ADVANCE เรียบร้อยแล้ว", "", "JOB: " + d(r.job_no), "Company: " + d(j.company_invoice), "Customer: " + d(j.customer_name), "House B/L: " + d(j.house_bl_no), "");
  (r.pays || []).filter(function (p) { return !n || Number(p.item_no) === Number(n); }).forEach(function (p) {
    var it = (r.items || [])[p.item_no - 1] || {};
    L.push("💰 " + (r.item_count > 1 ? "รายการที่ " + p.item_no : "รายการ") + ": " + d(it.payment_type), "ธนาคาร: " + d(it.bank_name), "ชื่อบัญชี: " + d(it.account_name), "เลขบัญชี: " + d(it.account_no), "จ่ายจริง: " + fm(p.amount) + " บาท", "วันที่จ่าย: " + dd(p.pay_date), "");
    tot += Number(p.amount) || 0;
  });
  L.push("✅ ยอดจ่ายสุทธิ " + fm(Math.round(tot * 100) / 100) + " บาท");
  return L.join("\n");
}
async function openView(jobId) {
  closeView();
  var d = document.createElement("div"); d.className = "ca7-dw"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "รายละเอียด CASH ADVANCE");
  d.innerHTML = '<div class="ca7-dh"><b>รายละเอียด CASH ADVANCE</b><button type="button" class="ca7-dx" data-x aria-label="ปิด">×</button></div><div class="ca7-db"><div class="ca7-em">กำลังโหลด…</div></div>';
  document.body.appendChild(d);
  var me = d;
  d.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-x")) { closeView(); return; }
    var g = S && S.cur; if (!g) return; var r = g.req;
    if (b.hasAttribute("data-cpacc")) { var it = (r.items || [])[Number(b.dataset.cpacc) - 1]; it && String(it.account_no || "").trim() ? copy(String(it.account_no).trim(), "คัดลอกเลขบัญชีแล้ว") : toast("ยังไม่มีเลขบัญชี", "err"); return; }
    if (b.hasAttribute("data-cppaid")) { var n = Number(b.dataset.cppaid); if ((r.pays || []).some(function (x) { return Number(x.item_no) === n; })) copy(paidText(g, n), "คัดลอกข้อความจ่ายแล้วเรียบร้อย"); return; }
    if (b.hasAttribute("data-cppaidall")) { if (r.status === "PAID") copy(paidText(g, 0), "คัดลอกข้อความจ่ายแล้วเรียบร้อย"); return; }
    if (b.hasAttribute("data-slipv") || b.hasAttribute("data-slipd")) { slip(r, Number(b.dataset.slipv || b.dataset.slipd), b.hasAttribute("data-slipd"), b); return; }
  });
  try {
    var res = await Promise.all([rpc("njacc_cash_adv702_get", { p_job: jobId }), rpc("njacc_adv698_get", { p_job: jobId }).catch(function () { return null; })]);
    if (!me.isConnected) return;
    var g = res[0], r = g.req, j = g.job || {}; S.cur = g;
    var paid = Number(r.paid_total) || 0, wait = (Number(r.total_real) || 0) - paid;
    me.querySelector(".ca7-db").innerHTML =
      '<div class="ca7-st ' + (r.status === "PAID" ? "g" : "b") + '">' + (r.status === "PAID" ? "✅ อนุมัติแล้ว — จ่ายเงินแล้ว" : "✅ อนุมัติแล้ว — รอจ่ายเงิน" + (Number(r.paid_count) > 0 ? " (จ่ายแล้ว " + r.paid_count + "/" + r.item_count + ")" : "")) + "</div>" +
      '<div class="ca7-h3">ข้อมูล JOB</div><dl class="ca7-dl"><dt>JOB No.</dt><dd>' + esc(r.job_no) + (j.operational_status === "CANCELED" ? ' <span class="ca7-bd r">JOB ยกเลิก</span>' : "") + "</dd><dt>Company</dt><dd>" + esc(j.company_invoice || "-") +
      "</dd><dt>Customer</dt><dd>" + esc(j.customer_name || "-") + "</dd><dt>House B/L</dt><dd>" + esc(j.house_bl_no || "-") + "</dd><dt>Mode</dt><dd>" + esc(j.data_type || "-") + "</dd><dt>USER ผู้ส่งคำขอ</dt><dd>" + esc(r.requested_by || "-") +
      "</dd><dt>วันที่ส่งคำขอ</dt><dd>" + esc(dtm(r.requested_at)) + "</dd><dt>ผู้อนุมัติ</dt><dd>" + esc(r.approved_by || "-") + "</dd><dt>วันที่อนุมัติ</dt><dd>" + esc(dtm(r.approved_at)) +
      "</dd><dt>ยอดอนุมัติ</dt><dd>" + fm(r.total_real) + " บาท</dd><dt>ยอดจ่ายจริง</dt><dd>" + fm(paid) + " บาท</dd><dt>ค้างจ่าย</dt><dd>" + fm(wait) + " บาท</dd></dl>" +
      '<div class="ca7-h3">รายการเงินสำรองจ่าย (' + r.item_count + " รายการ)</div>" + itemsHTML(r) +
      '<div class="ca7-h3">ข้อมูล INVOICE ADV</div>' + invHTML(g) +
      '<div class="ca7-h3">หลักฐานสลิปการโอนเงิน</div>' + slipsHTML(r) + (r.status === "PAID" ? '<button type="button" class="ca7-b" data-cppaidall>📋 COPY ข้อความจ่ายแล้ว (ทุกรายการ)</button>' : "") +
      '<div class="ca7-h3">Timeline History</div>' + tlHTML(g, res[1] && res[1].timeline);
  } catch (e) { if (me.isConnected) me.querySelector(".ca7-db").innerHTML = '<div class="ca7-em">' + esc(errMsg(e)) + "</div>"; }
}
async function slip(r, n, dl, b) {
  var p = (r.pays || []).find(function (x) { return Number(x.item_no) === n; }); if (!p) return;
  var w = dl ? null : window.open("", "_blank"); b && (b.disabled = !0);
  try {
    var q = await SB().storage.from(BK).createSignedUrl(p.slip_path, 120, dl ? { download: p.slip_name || !0 } : void 0);
    if (q.error || !q.data || !q.data.signedUrl) throw q.error || new Error("no url");
    if (dl) { var rs = await fetch(q.data.signedUrl); if (!rs.ok) throw new Error("HTTP " + rs.status); var ou = URL.createObjectURL(await rs.blob()), a = document.createElement("a"); a.href = ou; a.download = p.slip_name || "slip"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(ou); }, 15e3); }
    else if (w) { try { w.opener = null; } catch (e) {} w.location.href = q.data.signedUrl; } else location.href = q.data.signedUrl;
  } catch (e) { w && w.close(); toast("เปิดสลิปไม่ได้ — ไม่มีสิทธิ์หรือไฟล์ไม่พบ", "err"); }
  b && (b.disabled = !1);
}

/* ── Export Excel (ตามแท็บ + ตัวกรองที่เลือก · ดึงทีละ 500 รายการ) ── */
async function exportXls(btn) {
  btn.disabled = !0; var lb = btn.innerHTML; btn.textContent = "กำลังส่งออก…";
  try {
    var all = [], off = 0, tot = 1;
    while (off < tot && off < 20000) {
      var r = await rpc("njacc_cash_adv702_list", { p: Object.assign({ tab: S.tab, limit: 500, offset: off }, filt()) });
      tot = (r && r.total) || 0; all = all.concat((r && r.rows) || []); off += 500; if (!r || !(r.rows || []).length) break;
    }
    await LX(XURL); var X = window.XLSX; if (!X) throw new Error("โหลดไลบรารี Excel ไม่สำเร็จ");
    var H = ["วันที่อนุมัติ", "JOB No.", "Company", "Customer", "House B/L", "USER", "ผู้อนุมัติ", "ประเภทค่าใช้จ่าย", "ยอดอนุมัติ", "ยอดจ่ายจริง", "ยอดรอจ่าย", "สถานะจ่ายเงิน", "INVOICE ADV", "สถานะ INVOICE"];
    var A = [H].concat(all.map(function (x) {
      return [dtm(x.approved_at), x.job_no || "", x.company || "", x.customer || "", x.hbl || "", x.requested_by || "", x.approved_by || "", (x.types || []).join(", "),
        Number(x.total_real) || 0, Number(x.paid_total) || 0, Number(x.wait_total) || 0, payText(x), (x.inv_nos || []).join(", "), Number(x.inv_count) > 0 ? "ออก INVOICE แล้ว" : "ยังไม่ออก INVOICE"];
    }));
    var ws = X.utils.aoa_to_sheet(A); ws["!cols"] = [16, 18, 34, 28, 18, 18, 16, 28, 14, 14, 14, 16, 22, 18].map(function (w) { return { wch: w }; });
    for (var i = 1; i < A.length; i++) ["I", "J", "K"].forEach(function (c) { var k = c + (i + 1); ws[k] && (ws[k].z = "#,##0.00"); });
    var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, S.tab === "INV" ? "ออก INVOICE แล้ว" : "ยังไม่ออก INVOICE");
    var d = new Date(), fn = "CASH_ADVANCE_" + (S.tab === "INV" ? "INVOICED" : "NOT_INVOICED") + "_" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + ".xlsx";
    X.writeFile(wb, fn); toast("ส่งออก Excel " + all.length + " รายการแล้ว", "ok");
  } catch (e) { toast("ส่งออก Excel ไม่สำเร็จ — " + errMsg(e), "err"); }
  btn.disabled = !1; btn.innerHTML = lb;
}

async function render(root, args) {
  css(); closeView();
  S = { root: root, tab: "NOINV", f: {}, lim: 20, off: 0, rows: [], total: 0, counts: {}, sum: {}, seq: 0, err: "", loading: !1, cur: null };
  root.innerHTML = shell();
  var me = S, fo = root.querySelector("[data-f]");
  var readF = function () { var f = {}; ["date_from", "date_to", "job_no", "company", "customer", "hbl"].forEach(function (k) { var el = fo.elements[k]; f[k] = el ? String(el.value || "").trim() : ""; }); return f; };
  fo.addEventListener("submit", function (e) { e.preventDefault(); if (S !== me) return; S.f = readF(); S.off = 0; load(); });
  root.addEventListener("click", function (e) {
    if (S !== me) return; var b = e.target.closest("button"); if (!b || !root.contains(b)) return;
    if (b.dataset.tab) { if (S.tab !== b.dataset.tab) { S.tab = b.dataset.tab; S.off = 0; load(); } return; }
    if (b.hasAttribute("data-rf")) { load(); return; }
    if (b.hasAttribute("data-xl")) { exportXls(b); return; }
    if (b.hasAttribute("data-clr")) { fo.reset(); S.f = {}; S.off = 0; load(); return; }
    if (b.hasAttribute("data-ft")) { fo.classList.toggle("open"); return; }
    if (b.hasAttribute("data-pv")) { S.off = Math.max(0, S.off - S.lim); load(); return; }
    if (b.hasAttribute("data-nx")) { S.off += S.lim; load(); return; }
    if (b.dataset.view) { openView(b.dataset.view); return; }
  });
  root.addEventListener("change", function (e) { if (S !== me || !e.target.matches("[data-lim]")) return; S.lim = Number(e.target.value) || 20; S.off = 0; load(); });
  window.addEventListener("hashchange", function hc() { if (S !== me) { window.removeEventListener("hashchange", hc); return; } closeView(); });
  document.addEventListener("keydown", function kd(e) { if (S !== me) { document.removeEventListener("keydown", kd); return; } if (e.key === "Escape") closeView(); });
  args && args.tab === "INV" && (S.tab = "INV");
  await load();
}
export{render};
