/* ═══ V.724 · CASH ADVANCE : ส่วนแสดงรายละเอียดชุดเดียว (Desktop / Tablet = cash-advance · Mobile = adv-approve)
   ลำดับ : ข้อมูล JOB (Desktop 2 คอลัมน์ · Mobile 1 คอลัมน์) → แถบสถานะ → รายการเงินสำรองจ่าย (Card แยกรายการ : ธนาคาร 35% / ยอดเงิน 25% / สลิปโอนเงินประจำรายการ 40%)
   → (ส่วนเดิม : INVOICE ADV / เอกสารเพิ่มเติม) → Timeline History (Accordion พับทุกครั้งที่เปิด)
   สลิปประจำรายการ = njacc_adv_pay701 เดิม (ผูกคำขอ req_id + ลำดับรายการในคำขอที่ล็อกหลังส่งคำขอ) · แนบสลิป = ฟอร์มยืนยันจ่ายเดิม (SUPER_ADMIN) · ไม่แก้ฐานข้อมูล / Flow ═══ */
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dtm(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
function dd(x) { if (!x) return "-"; var p = String(x).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(x); }
var CP = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
var I724 = (function () {
  var s = function (p, w) { return '<svg width="' + (w || 18) + '" height="' + (w || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; };
  return {
    bag: s('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>', 22),
    tag: s('<path d="M20 12 12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'), bld: s('<path d="M4 21V5l8-2v18M12 7h8v14M8 9h0M8 13h0M8 17h0M16 11h0M16 15h0"/>'),
    usr: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>'), ship: s('<path d="M3 15h18l-2 5H5zM6 15V9h12v6M9 9V5h6v4"/>'),
    lay: s('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'), one: s('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'), cal: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    coin: s('<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/>'),
    clk: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 22), bank: s('<path d="M3 9 12 4l9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'), card: s('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>'),
    clip: s('<path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15.5 7.5"/>'), file: s('<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>'),
    eye: s('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 15), dl: s('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>', 15),
    chev: s('<path d="m6 9 6 6 6-6"/>', 20), plus: s('<path d="M12 5v14M5 12h14"/>', 15), hd: s('<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6"/>', 22)
  };
})();
function jobCard724(r, j, ap, extra) {
  var paid = Number(r.paid_total) || 0, wait = (Number(r.total_real) || 0) - paid;
  var L = [[I724.tag, "JOB No.", esc(r.job_no) + (j.operational_status === "CANCELED" ? ' <span class="ca7-bd r">JOB ยกเลิก</span>' : "")], [I724.bld, "Company", esc(j.company_invoice || "-")],
    [I724.usr, "Customer", esc(j.customer_name || "-")], [I724.ship, "House B/L", esc(j.house_bl_no || "-")]];
  var R = [[I724.lay, "Mode", esc(j.data_type || "-")], [I724.one, "USER ผู้ส่งคำขอ", esc(r.requested_by || "-")], [I724.cal, "วันที่ส่งคำขอ", esc(dtm(r.requested_at))],
    [I724.coin, ap ? "ยอดอนุมัติ" : "ยอดขอเบิก", '<span class="hl">' + fm(r.total_real) + " บาท</span>"]];
  if (r.approved_at) { L.push([I724.one, "ผู้อนุมัติ", esc(r.approved_by || "-")]); R.push([I724.cal, "วันที่อนุมัติ", esc(dtm(r.approved_at))]); }
  if (ap) { L.push([I724.coin, "ยอดจ่ายจริง", fm(paid) + " บาท"]); R.push([I724.coin, "ค้างจ่าย", fm(wait) + " บาท"]); }
  (extra || []).forEach(function (x, k) { (k % 2 ? R : L).push(x); });
  if (r.status === "PAID") L.push([I724.lay, "สถานะ DOCUMENT", j.operational_status === "CLOSE" ? "ปิดงานแล้ว — ส่ง ACCOUNTING แล้ว" : esc(j.operational_status || "-") + " (รอ USER ปิดงานเองใน DOCUMENT → ADVANCE)"]);
  if (r.rejected_at) { L.push([I724.one, "ผู้ไม่อนุมัติ", esc(r.rejected_by || "-")]); R.push([I724.cal, "วันที่ไม่อนุมัติ", esc(dtm(r.rejected_at))]); L.push([I724.lay, "เหตุผล", esc(r.reject_reason || "-")]); R.push([I724.lay, "สถานะ JOB", esc(j.operational_status || "-")]); }
  var cell = function (x, o) { return x ? '<div class="ca24-kv" style="--o:' + o + '"><i>' + x[0] + "</i><span>" + x[1] + "</span><b>" + x[2] + "</b></div>" : '<div class="ca24-kv e"></div>'; }, h = "";
  for (var k = 0; k < Math.max(L.length, R.length); k++) h += cell(L[k], k) + cell(R[k], 100 + k);   /* Desktop 2 คอลัมน์ · มือถือ = คอลัมน์ซ้ายก่อนแล้วตามด้วยขวา */
  return '<section class="ca24-job"><div class="ca24-jh"><i>' + I724.bag + '</i><b>ข้อมูล JOB</b></div><div class="ca24-jg">' + h + "</div></section>";
}
function stBar724(r) {
  var M = { PENDING: ["o", "รออนุมัติ"], APPROVED: ["b", "อนุมัติแล้ว — รอจ่ายเงิน" + (Number(r.paid_count) > 0 ? " (จ่ายแล้ว " + r.paid_count + "/" + r.item_count + ")" : "")], PAID: ["g", "จ่ายเงินแล้ว"], REJECTED: ["r", "ไม่อนุมัติ"] }, m = M[r.status] || ["o", esc(r.status || "-")];
  return '<section class="ca24-sb ' + m[0] + '"><span class="st"><i>' + I724.clk + "</i>" + m[1] + '</span><span class="it"><i>' + I724.one + "</i>ส่งโดย : <b>" + esc(r.requested_by || "-") + "</b></span>" +
    '<span class="it"><i>' + I724.cal + "</i>วันที่ส่งคำขอ : <b>" + esc(dtm(r.requested_at)) + '</b></span><span class="tot"><i>' + I724.coin + "</i>ยอดเบิกรวม : <b>" + fm(r.total_real) + " บาท</b></span>" +
    (r.status === "PAID" ? '<span class="it">จ่ายรวม : <b>' + fm(r.paid_total) + " บาท</b> · " + esc(dtm(r.paid_at)) + "</span>" : "") +
    (r.status === "REJECTED" ? '<span class="rs">เหตุผล : ' + esc(r.reject_reason || "-") + "</span>" : "") + "</section>";
}
function items724(r, canPay, cell) {   /* V.725 : cell(n) = สลิปแนบล่วงหน้า (adv-slip-A725.js) ของรายการที่ยังไม่จ่าย */
  var it = (r.items || []).map(function (x, i) {
    var dh = "", n = i + 1, p = (r.pays || []).find(function (y) { return Number(y.item_no) === n; });
    var st = p ? '<span class="ca7-bd g">จ่ายแล้ว ' + esc(dd(p.pay_date)) + "</span>" : r.status === "APPROVED" ? '<span class="ca7-bd o">รอจ่ายเงิน</span>' : '<span class="ca7-bd x">' + (r.status === "PENDING" ? "รออนุมัติ" : r.status === "REJECTED" ? "ไม่อนุมัติ" : esc(r.status || "-")) + "</span>";
    var sl = p ? '<div class="ca24-fr"><i>' + I724.file + "</i><span>" + esc(p.slip_name || "-") + (p.slip_size ? " <small>(" + Math.max(1, Math.round(Number(p.slip_size) / 1024)) + " KB)</small>" : "") + "</span>" +
        '<button type="button" class="ca24-fb v" data-slipv="' + n + '">' + I724.eye + 'ดูไฟล์</button><button type="button" class="ca24-fb d" data-slipd="' + n + '">' + I724.dl + "ดาวน์โหลด</button></div>" +
        '<div class="ca24-pm">จ่ายแล้ว ' + fm(p.amount) + " บาท · วันที่จ่าย " + esc(dd(p.pay_date)) + " · โดย " + esc(p.paid_by || "-") + '</div><div class="ca24-pa"><button type="button" class="ca7-cp" data-cppaid="' + n + '">📋 COPY ข้อความจ่ายแล้ว</button></div>'
      : (dh = cell ? cell(n) : "") ? dh + (canPay ? '<button type="button" class="ca24-at" data-pay="' + n + '">' + I724.plus + "ยืนยันจ่ายเงิน (ใช้สลิปที่แนบไว้)</button>" : "")
      : '<div class="ca24-no">ยังไม่มีสลิปโอนเงิน</div>' + (canPay ? '<button type="button" class="ca24-at" data-pay="' + n + '">' + I724.plus + "แนบสลิป / ยืนยันจ่ายเงิน</button>" : "");
    return '<article class="ca24-it" data-item="' + n + '"><header><span class="no">' + n + "</span><b>รายการที่ " + n + " : " + esc(x.payment_type || "-") + "</b><strong>" + fm(x.real_pay) + " บาท</strong></header><div class=\"ca24-ib\">" +
      '<div class="c1"><div><i>' + I724.bank + "</i>ธนาคาร<em>:</em><b>" + esc(x.bank_name || "-") + "</b></div><div><i>" + I724.one + "</i>ชื่อบัญชี<em>:</em><b>" + esc(x.account_name || "-") + "</b></div>" +
      "<div><i>" + I724.card + "</i>เลขบัญชี<em>:</em><b>" + esc(x.account_no || "-") + '</b><button type="button" class="ca7-cp" data-cpacc="' + n + '">' + CP + "COPY</button></div><div><i>" + I724.card + "</i>สถานะการจ่าย<em>:</em>" + st + "</div></div>" +
      '<div class="c2"><div><span>ยอดก่อนหัก</span><em>:</em><b>' + fm(x.gross) + "</b></div><div><span>VAT (" + esc(String(x.vat_pct || 0)) + "%)</span><em>:</em><b>" + fm(x.vat) + "</b></div><div><span>ยอดหัก (" + esc(String(x.deduct_pct || 0)) + "%)</span><em>:</em><b>" + fm(x.deduct) + '</b></div><div class="net"><span>ยอดจ่ายสุทธิ</span><em>:</em><b>' + fm(x.real_pay) + "</b></div></div>" +
      '<div class="c3 ca24-slip' + (p ? " has" : "") + '"><div class="ca24-sh"><i>' + I724.clip + "</i>สลิปโอนเงินประจำรายการ :</div>" + sl + "</div></div><div data-pf></div></article>";
  }).join("");
  return '<section class="ca24-items"><div class="ca24-ih"><i>' + I724.coin + "</i><b>รายการเงินสำรองจ่าย (" + ((r.items || []).length || r.item_count || 0) + " รายการ)</b></div>" + it + "</section>";
}
function tl724(inner, chip) {   /* พับทุกครั้งที่เปิด (ไม่จำสถานะ) */
  return '<section class="ca24-tl"><button type="button" class="ca24-tlh" data-tl724 aria-expanded="false"><i>' + I724.clk + "</i><b>Timeline History</b>" + (chip || "") + '<span class="cv">' + I724.chev + '</span></button><div class="ca24-tlb" hidden>' + (inner || "") + "</div></section>";
}

var BOUND = !1;
function css724() {
  if (!BOUND) { BOUND = !0; document.addEventListener("click", function (e) { var b = e.target && e.target.closest && e.target.closest("[data-tl724]"); if (!b) return; var on = b.getAttribute("aria-expanded") !== "true", body = b.parentElement && b.parentElement.querySelector(".ca24-tlb"); b.setAttribute("aria-expanded", on ? "true" : "false"); body && (body.hidden = !on); }); }
  if (document.getElementById("ca724-css")) return;
  var s = document.createElement("style"); s.id = "ca724-css";
  s.textContent = [
    ".ca24-hi{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".ca24-job{border:1px solid #d9c8fb;border-radius:12px;background:#fff;overflow:hidden;margin:0 0 12px}",
    ".ca24-jh{display:flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(90deg,#F0E7FF,#f8f4ff);color:#24136F;font-size:16px;font-weight:800}.ca24-jh i{color:#7c3aed;display:flex}",
    ".ca24-jg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;padding:4px 14px 8px}",
    ".ca24-kv{display:grid;grid-template-columns:28px 128px minmax(0,1fr);align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #efe7fd;min-width:0}.ca24-kv.e{border-bottom-color:transparent}",
    ".ca24-kv i{width:28px;height:28px;border-radius:8px;background:#f1ebff;color:#6d28d9;display:flex;align-items:center;justify-content:center}.ca24-kv i svg{width:16px;height:16px}",
    ".ca24-kv span{color:#475569;font-size:13px}.ca24-kv b{color:#1e1b4b;font-weight:800;font-size:13.5px;overflow-wrap:anywhere;min-width:0}",
    ".ca24-kv .hl{display:inline-block;background:#ede4ff;color:#3b0764;border-radius:8px;padding:3px 10px;font-size:15px}",
    ".ca24-sb{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;border-radius:12px;padding:8px 14px;margin:0 0 12px;border:1px solid;font-size:13px}",
    ".ca24-sb i{display:inline-flex;margin-right:4px}.ca24-sb i svg{width:16px;height:16px}.ca24-sb .it{display:inline-flex;align-items:center}",
    ".ca24-sb .st{font-weight:800;font-size:14.5px;display:inline-flex;align-items:center;padding:4px 12px;border-radius:9px;background:rgba(255,255,255,.65)}.ca24-sb .st i svg{width:20px;height:20px}",
    ".ca24-sb .tot{margin-left:auto;display:inline-flex;align-items:center;gap:4px}.ca24-sb .tot b{font-size:15.5px;padding:3px 10px;border-radius:9px;background:rgba(255,255,255,.75)}.ca24-sb .rs{flex-basis:100%;white-space:pre-wrap;font-weight:600}",
    ".ca24-sb.o{background:linear-gradient(90deg,#fff3e6,#fff8ef);border-color:#fed7aa;color:#9a3412}.ca24-sb.b{background:linear-gradient(90deg,#e8f1ff,#f3f8ff);border-color:#bfdbfe;color:#1e3a8a}",
    ".ca24-sb.g{background:linear-gradient(90deg,#e7f8ee,#f2fcf6);border-color:#bbf7d0;color:#14532d}.ca24-sb.r{background:linear-gradient(90deg,#fee2e2,#fff1f1);border-color:#fecaca;color:#991b1b}",
    ".ca24-items{border:1px solid #cfe0fb;border-radius:12px;overflow:hidden;margin:0 0 12px;background:#fff;padding-bottom:2px}",
    ".ca24-ih{display:flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(90deg,#e3eeff,#f1f6ff);color:#1e3a8a;font-size:15.5px;font-weight:800}.ca24-ih i{color:#2563eb;display:flex}",
    ".ca24-it{margin:8px 10px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff}",
    ".ca24-it header{display:flex;align-items:center;gap:8px;padding:6px 12px;background:linear-gradient(90deg,#eaf2ff,#f6f9ff);font-size:14.5px;color:#1e3a8a}.ca24-it header b{flex:1;min-width:0;overflow-wrap:anywhere}.ca24-it header strong{font-size:15px;white-space:nowrap}",
    ".ca24-it .no{width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;font-weight:800;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".ca24-ib{display:grid;grid-template-columns:35fr 25fr 40fr;font-size:13px}.ca24-ib>div{padding:8px 12px;min-width:0}.ca24-ib>div+div{border-left:1px solid #e2e8f0}",
    ".ca24-ib .c1>div{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:2px 0}.ca24-ib .c1 i{display:flex;color:#475569}.ca24-ib .c1 i svg{width:15px;height:15px}.ca24-ib em{font-style:normal;color:#94a3b8}.ca24-ib .c1 b{overflow-wrap:anywhere;min-width:0}",
    ".ca24-ib .c2>div{display:grid;grid-template-columns:minmax(0,1fr) 10px auto;gap:4px;padding:2px 0;color:#334155}.ca24-ib .c2 b{text-align:right;font-variant-numeric:tabular-nums}",
    ".ca24-ib .c2 .net{margin-top:4px;background:#e8f1fd;border-radius:8px;padding:4px 8px;color:#0f172a;font-weight:800}.ca24-ib .c2 .net b{font-size:15px}",
    ".ca24-slip{background:#fbf8ff}.ca24-sh{display:flex;align-items:center;gap:6px;font-weight:800;color:#3b0764;margin:0 0 6px}.ca24-sh i{display:flex;color:#7c3aed}",
    ".ca24-fr{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.ca24-fr>span{flex:1 1 140px;min-width:0;border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:5px 8px;overflow-wrap:anywhere;font-style:italic}.ca24-fr>i{display:flex;color:#dc2626}",
    ".ca24-fb{min-height:32px;border-radius:8px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-weight:700;font-size:12.5px;padding:0 10px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;white-space:nowrap}",
    ".ca24-pm{color:#64748b;font-size:12px;margin-top:4px}.ca24-pa{margin-top:4px}.ca24-no{color:#64748b;margin:0 0 6px}",
    ".ca24-at{min-height:34px;border-radius:8px;border:1px solid #16a34a;background:#16a34a;color:#fff;font-weight:700;font-size:13px;padding:0 12px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit}",
    ".ca24-it [data-pf]:not(:empty){padding:0 12px 10px}",
    ".ca24-tl{border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;margin:12px 0 4px;background:#fff}",
    ".ca24-tlh{width:100%;display:flex;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(90deg,#E8F8EE,#f3fcf6);border:0;cursor:pointer;font-family:inherit;text-align:left;color:#14532d;min-height:46px}",
    ".ca24-tlh b{font-size:16px;color:#0f172a}.ca24-tlh>i{display:flex;color:#16a34a}.ca24-tlh .t708-chip{margin-left:auto}.ca24-tlh .cv{display:flex;color:#16a34a;transition:transform .15s;margin-left:auto}.ca24-tlh .t708-chip+.cv{margin-left:6px}.ca24-tlh[aria-expanded='true'] .cv{transform:rotate(180deg)}",
    ".ca24-tlb{padding:8px 12px}",
    ".ca24-chip{margin-left:auto;display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:7px;background:#dcefe3;color:#14532d;font-size:11.5px;font-weight:800;white-space:nowrap}.ca24-tlh .ca24-chip+.cv{margin-left:6px}",
    "@media (max-width:1024px){.ca24-jg{grid-template-columns:minmax(0,1fr)}.ca24-kv{order:var(--o)}.ca24-kv.e{display:none}.ca24-kv{grid-template-columns:28px 112px minmax(0,1fr)}.ca24-ib{grid-template-columns:minmax(0,1fr)}.ca24-ib>div+div{border-left:0;border-top:1px solid #e2e8f0}.ca24-sb .tot{margin-left:0}}",
    "@media (max-width:480px){.ca24-kv{grid-template-columns:26px 96px minmax(0,1fr);gap:6px}.ca24-it{margin:8px 6px}.ca24-sb{padding:8px 10px}.ca24-fb,.ca24-at,.ca7-cp,.aq7-cp{min-height:36px}}"
  ].join("");
  document.head.appendChild(s);
}
export { css724, jobCard724 as job724, stBar724 as st724, items724, tl724, I724 };
