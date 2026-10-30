/* ═══ V.708 · Timeline History มาตรฐานเดียว (Component กลาง) : DOCUMENT → ADVANCE · ACCOUNTING → ADVANCE · CASH ADVANCE (Desktop)
   เหตุการณ์ | วันที่ เวลา (DD/MM/YYYY HH:mm) | ผู้ดำเนินการจริง · เรียงตามเวลาเกิด (เก่า → ใหม่) · แสดงเฉพาะเหตุการณ์ที่เกิดจริง · ไม่สร้างซ้ำ
   DOCUMENT — ADVANCE : ออกเลข AD (POST_JOB · งานที่ออกเลขตอนสร้าง = CREATE_JOB ที่ POSTED แล้ว) → ส่งคำขอ → อนุมัติ / ไม่อนุมัติ (เหตุผล) → จ่ายเงินแล้ว (จ่ายครบทุกรายการเท่านั้น)
   ACCOUNTING — ADVANCE (ACCOUNTING / CASH ADVANCE เท่านั้น) : ออกเลข INVOICE = POST INVOICE ADV ที่ยัง POST อยู่ (เลข · เวลา POST · ผู้ POST) · ไม่มี = "ยังไม่ออก INVOICE"
   ประวัติอื่นทั้งหมด (สร้าง / แก้ไข / CHECKLIST / SAVE / ร่าง / UNPOST / CLOSED …) อยู่ใน "ดูประวัติทั้งหมด" — อ่านจากข้อมูลเดิมเท่านั้น ไม่แก้ / ไม่ลบประวัติจริง
   ข้อมูล : njacc_adv698_get.timeline (Audit เดิม) + คำขออนุมัติ (njacc_adv701_get / njacc_cash_adv705_get เดิม) · มือถือใช้ไฟล์ของตัวเอง (ไม่ใช้ Component นี้) ═══ */
var LB = {
  CREATE_JOB: "สร้างงาน", EDIT_JOB: "แก้ไขงาน", EDIT_JOB_DOC_FIELDS: "แก้ไขงาน", EDIT_JOB_CHECKLIST: "แก้ไข JOB CHECKLIST",
  POST_JOB: "ออกเลข AD (POST)", SET_JOB_STATUS: "เปลี่ยนสถานะงาน", CANCEL_JOB: "ยกเลิกงาน", RETURN_JOB_TO_DOCUMENT: "ย้อนกลับ DOCUMENT",
  ACC_HANDOFF: "ส่งต่อ FINANCE", ACC_REOPEN: "เปิดกลับ ACCOUNTING", BULK_SET_CASE: "กำหนด Case", EXPORT_CHARGES: "ส่งออก Excel",
  ADV698_ITEMS: "บันทึกรายการจ่าย", ADVANCE_PAY: "ยืนยันจ่ายแล้ว (PAY)", ADVANCE_UNPAY: "ย้อนกลับ PAY",
  SAVE_INVOICE_DRAFT: "บันทึก INVOICE ADV (ร่าง)", ISSUE_INVOICE_NO_ON_SAVE: "ออกเลข INVOICE ADV (ตอนบันทึก)", POST_DRAFT_INVOICE: "ออกเลข INVOICE", POST_INVOICE: "ออกเลข INVOICE",
  UNPOST_INVOICE: "UNPOST INVOICE ADV", UNPOST_TO_DRAFT: "UNPOST INVOICE ADV", VOID_INVOICE: "VOID INVOICE ADV", EDIT_INVOICE_DATE: "แก้วันที่ INVOICE ADV", RESET_INVOICE_NO: "รีเซ็ตเลข INVOICE ADV",
  ADV705_AUTO_CLOSE: "ปิดงานอัตโนมัติ (CASH ADVANCE จ่ายครบ) → ส่ง ACCOUNTING", ADV705_AUTO_CLOSE_FAIL: "ปิดงานอัตโนมัติไม่สำเร็จ"
};
var ACC = /^(SAVE_INVOICE_DRAFT|ISSUE_INVOICE_NO_ON_SAVE|POST_DRAFT_INVOICE|POST_INVOICE|UNPOST_INVOICE|UNPOST_TO_DRAFT|VOID_INVOICE|EDIT_INVOICE_DATE|RESET_INVOICE_NO|ACC_HANDOFF|ACC_REOPEN|ADVANCE_PAY|ADVANCE_UNPAY)$/;
var OPEN = new Map();
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(n) { return String(n).padStart(2, "0"); }
function dtm(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
function tms(x) { var t = new Date(x).getTime(); return isNaN(t) ? 0 : t; }
function real(n) { n = String(n == null ? "" : n).trim(); return n && !/^DRAFT-/i.test(n) ? n : ""; }
function css() {
  if (document.getElementById("t708-css")) return;
  var s = document.createElement("style"); s.id = "t708-css";
  s.textContent = [
    ".t708-chip{display:inline-flex;align-items:center;height:20px;padding:0 9px;border-radius:6px;background:#eef2f6;color:#334155;font-size:10.5px;font-weight:700;letter-spacing:.2px;white-space:nowrap;margin-left:auto}",
    ".t708{font-size:12.5px;color:#0f172a}.t708-r{display:grid;grid-template-columns:minmax(0,1.35fr) 128px minmax(0,.85fr);gap:8px;align-items:start;padding:6px 2px;border-bottom:1px solid #eef2f6}",
    ".t708-r:last-child{border-bottom:0}.t708-l{font-weight:600;min-width:0;overflow-wrap:anywhere}.t708-l small{display:block;font-weight:400;color:#64748b;font-size:11.5px;margin-top:1px}",
    ".t708-d{color:#334155;white-space:nowrap;font-variant-numeric:tabular-nums}.t708-u{color:#0f172a;min-width:0;overflow-wrap:anywhere}",
    ".t708-l.g{color:#16a34a}.t708-l.b{color:#2563eb}.t708-l.r{color:#dc2626}.t708-l.n{color:#0f172a}",
    ".t708-h{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px;margin:10px 0 2px;padding-top:9px;border-top:1px solid #e2e8f0}.t708-h svg{color:#16a34a;flex:0 0 auto}",
    ".t708-e{color:#64748b;padding:6px 2px}.t708-ft{display:flex;justify-content:flex-end;margin-top:8px}",
    ".t708-all{height:26px;padding:0 10px;border-radius:7px;border:1px solid #cbd5e1;background:#fff;color:#2563eb;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}.t708-all:hover{background:#eff6ff}",
    ".t708-full{margin-top:8px;border-top:1px dashed #cbd5e1;padding-top:6px}.t708-full[hidden]{display:none}.t708-fh{font-weight:700;font-size:12.5px;color:#475569;margin:2px 0 2px}",
    ".t708-full .t708-l{font-weight:500}.t708-full .t708-l.g,.t708-full .t708-l.b,.t708-full .t708-l.r{font-weight:600}"
  ].join("");
  document.head.appendChild(s);
}
var BOUND = !1;
function bind() {
  if (BOUND) return; BOUND = !0;
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-t708x]"); if (!b) return;
    var box = b.closest(".t708"), f = box && box.querySelector(".t708-full"); if (!f) return;
    var on = f.hidden; f.hidden = !on; b.setAttribute("aria-expanded", on ? "true" : "false"); b.textContent = on ? "ย่อประวัติ ▴" : "ดูประวัติทั้งหมด ▾";
    OPEN.set(box.getAttribute("data-t708") || "", on);
  });
}
function row(x) {
  return '<div class="t708-r"><span class="t708-l ' + (x.c || "n") + '">' + esc(x.t) + (x.s ? "<small>" + esc(x.s) + "</small>" : "") + (x.x || "") +
    '</span><span class="t708-d">' + esc(dtm(x.at)) + '</span><span class="t708-u">' + esc(x.by || "-") + "</span></div>";
}
function sub(e) {
  var d = e.detail || {}, s = [];
  if (e.action === "ADV698_ITEMS") { s.push((d.count != null ? d.count : 0) + " รายการ"); d.total_real != null && s.push("รวมจ่ายจริง " + fm(d.total_real) + " บาท"); }
  else {
    d.job_no && (e.action === "POST_JOB" || e.action === "CREATE_JOB") && s.push(d.job_no);
    d.status && s.push("สถานะ " + (d.status_before ? d.status_before + " → " : "") + d.status);
    d.to_status && s.push("สถานะ " + (d.from_status ? d.from_status + " → " : "") + d.to_status);
    real(d.invoice_no) && s.push(d.invoice_no);
    d.reason && s.push("เหตุผล: " + d.reason);
  }
  return s.join(" · ");
}
function asc(a, b) { return tms(a.at) - tms(b.at) || (Number(a.id) || 0) - (Number(b.id) || 0); }
/* เหตุการณ์หลัก DOCUMENT — ADVANCE */
function docMain(tl, r) {
  var out = [], ad = null;
  tl.forEach(function (e) { if (!ad && e.action === "POST_JOB") ad = e; });
  if (!ad) tl.forEach(function (e) { var d = e.detail || {}; if (!ad && e.action === "CREATE_JOB" && d.document_status === "POSTED" && String(d.job_no || "").trim()) ad = e; });
  ad && out.push({ at: ad.at, t: "ออกเลข AD", c: "g", by: ad.by, s: String((ad.detail || {}).job_no || "") });
  if (r) {
    r.requested_at && out.push({ at: r.requested_at, t: "ส่งคำขอ", c: "b", by: r.requested_by, s: "ยอดขอเบิก " + fm(r.total_real) + " บาท" });
    r.approved_at && out.push({ at: r.approved_at, t: "อนุมัติ", c: "g", by: r.approved_by, s: "ยอดอนุมัติ " + fm(r.total_real) + " บาท" });
    r.rejected_at && out.push({ at: r.rejected_at, t: "ไม่อนุมัติ", c: "r", by: r.rejected_by, s: "เหตุผล: " + (r.reject_reason || "-") });
    if (r.status === "PAID") {
      var ps = (r.pays || []).slice().sort(function (a, b) { return tms(a.paid_at) - tms(b.paid_at); }), last = ps[ps.length - 1] || {};
      out.push({ at: r.paid_at || last.paid_at, t: "จ่ายเงินแล้ว", c: "g", by: last.paid_by, s: "ยอดจ่ายจริง " + fm(r.paid_total) + " บาท" + (Number(r.item_count) > 1 ? " (" + r.item_count + " รายการ)" : "") });
    }
  }
  return out.sort(asc);
}
/* เหตุการณ์หลัก ACCOUNTING — ADVANCE : INVOICE ADV ที่ POST อยู่ (ล่าสุดต่อเลข) */
function accMain(tl, inv) {
  var m = new Map();
  tl.forEach(function (e) {
    var n = real((e.detail || {}).invoice_no); if (!n) return;
    if (e.action === "POST_DRAFT_INVOICE" || e.action === "POST_INVOICE") m.set(n, { at: e.at, id: e.id, t: "ออกเลข INVOICE", c: "n", by: e.by, s: n, on: !0 });
    else if (/^(UNPOST_INVOICE|UNPOST_TO_DRAFT|VOID_INVOICE)$/.test(e.action) && m.has(n)) m.get(n).on = !1;
  });
  var ok = Array.isArray(inv) ? function (n) { var x = inv.filter(function (i) { return i && String(i.invoice_no || "") === n; }); return !x.length || x.some(function (i) { return i.status === "POSTED"; }); } : function () { return !0; };
  return [...m.values()].filter(function (x) { return x.on && ok(x.s); }).sort(asc);
}
/* ประวัติทั้งหมด (Audit เดิม + คำขออนุมัติ / การจ่ายรายรายการ) */
function full(tl, r, doc, payExtra) {
  var out = [];
  tl.forEach(function (e) {
    var a = String(e.action || ""); if (/^ADV701_/.test(a)) return;
    if (doc && (e.etype === "invoice" || ACC.test(a))) return;
    var s = sub(e);
    out.push({ at: e.at, id: e.id, t: LB[a] || a.replace(/_/g, " "), c: /^(POST_JOB|POST_DRAFT_INVOICE|POST_INVOICE|ADV705_AUTO_CLOSE)$/.test(a) ? "g" : /^(CANCEL_JOB|UNPOST|VOID|ADV705_AUTO_CLOSE_FAIL|RETURN_JOB)/.test(a) ? "r" : "n",
      by: e.by, s: (e.id != null ? "#" + e.id + " · " : "") + a + (s ? " · " + s : "") });
  });
  if (r) {
    r.requested_at && out.push({ at: r.requested_at, t: "ส่งคำขออนุมัติ", c: "b", by: r.requested_by, s: "ยอดขอเบิก " + fm(r.total_real) + " บาท · " + (r.item_count || 0) + " รายการ" });
    r.approved_at && out.push({ at: r.approved_at, t: "อนุมัติ", c: "g", by: r.approved_by, s: "ยอดอนุมัติ " + fm(r.total_real) + " บาท" });
    (r.pays || []).forEach(function (p) {
      var it = (r.items || [])[p.item_no - 1] || {};
      out.push({ at: p.paid_at, t: "จ่ายเงินแล้ว — รายการที่ " + p.item_no, c: "g", by: p.paid_by, s: (it.payment_type ? it.payment_type + " · " : "") + "ยอดจ่าย " + fm(p.amount) + " บาท" + (p.slip_name ? " · " + p.slip_name : ""), x: payExtra ? payExtra(p, it) : "" });
    });
    r.rejected_at && out.push({ at: r.rejected_at, t: "ไม่อนุมัติ — ยกเลิก JOB", c: "r", by: r.rejected_by, s: "เหตุผล: " + (r.reject_reason || "-") });
  }
  return out.sort(asc);
}
export function chip708() { css(); return '<span class="t708-chip">DOCUMENT — ADVANCE</span>'; }
/* o = { key, scope : "document" | "accounting" | "cash", timeline, req, invoices, payExtra(p, item) → HTML ที่ escape แล้ว } */
export function tlHTML708(o) {
  css(); bind(); o = o || {};
  var tl = (Array.isArray(o.timeline) ? o.timeline : []).slice().sort(asc), r = o.req || null, doc = o.scope === "document", key = String(o.key || "");
  var D = docMain(tl, r), h = '<div class="t708" data-t708="' + esc(key) + '">' + (D.length ? D.map(row).join("") : '<div class="t708-e">ยังไม่มีประวัติการดำเนินงาน</div>');
  if (!doc) {
    var A = accMain(tl, o.invoices);
    h += '<div class="t708-h"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>ACCOUNTING — ADVANCE</div>' +
      (A.length ? A.map(row).join("") : '<div class="t708-e">ยังไม่ออก INVOICE</div>');
  }
  var F = full(tl, r, doc, o.payExtra), op = !!OPEN.get(key);
  if (F.length) h += '<div class="t708-ft"><button type="button" class="t708-all" data-t708x aria-expanded="' + (op ? "true" : "false") + '">' + (op ? "ย่อประวัติ ▴" : "ดูประวัติทั้งหมด ▾") + "</button></div>" +
    '<div class="t708-full"' + (op ? "" : " hidden") + '><div class="t708-fh">ประวัติทั้งหมด (Audit History)</div>' + F.map(row).join("") + "</div>";
  return h + "</div>";
}
