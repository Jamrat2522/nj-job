import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";
/* ═══ V.701 · มือถือ SUPER_ADMIN : อนุมัติเบิกเงินสำรองจ่าย ADVANCE (หน้าแรก / รออนุมัติ / อนุมัติแล้ว / ไม่อนุมัติ)
   ข้อมูลจาก RPC ใหม่ RUN-701 เท่านั้น (njacc_adv701_list / get / approve / reject / pay) — สิทธิ์ SUPER_ADMIN ตรวจที่ฐานข้อมูลทุกครั้ง
   สลิป : Storage private njacc-adv-slips (JPG / PNG / PDF ≤ 5 MB · ดู / ดาวน์โหลดด้วย Signed URL อายุ 2 นาที) · โหลดรายการแบบแบ่งหน้า · โหลดสลิปเมื่อกดดูเท่านั้น ═══ */
var BK = "njacc-adv-slips", LIM = 20, MAXF = 5242880, S = null;
var ST = { PENDING: ["รออนุมัติ", "o"], APPROVED: ["อนุมัติแล้ว — รอจ่ายเงิน", "b"], PAID: ["อนุมัติแล้ว — จ่ายเงินแล้ว", "g"], REJECTED: ["ไม่อนุมัติ — ยกเลิก JOB", "r"] };
var IC = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  wait: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  ok: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="m9 13 2 2 4-4"/></svg>',
  no: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
  rf: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  q: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  cp: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
};
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(x) { return String(x).padStart(2, "0"); }
function d7(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + " น."; }
function dd7(x) { if (!x) return "-"; var p = String(x).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : String(x); }
function today() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
function errMsg(e) {
  var m = String(e && (e.message || e.code) || e || "");
  if (/NJACC_ADV701_SUPER_ONLY/.test(m)) return "เฉพาะ SUPER_ADMIN เท่านั้น";
  if (/NJACC_REASON_REQUIRED/.test(m)) return "กรุณาระบุเหตุผลที่ไม่อนุมัติ";
  if (/NJACC_JOB_LINKED|NJACC_JOB_HAS_INVOICE/.test(m)) return "ไม่อนุมัติไม่ได้ — JOB เชื่อมกับ INVOICE / BILLING แล้ว (Flow ยกเลิกงานเดิมไม่อนุญาต) · ไม่มีการเปลี่ยนแปลงใด ๆ";
  if (/NJACC_CANCEL_ADMIN_ONLY/.test(m)) return "ยกเลิก JOB ไม่ได้ — สิทธิ์ยกเลิกงานไม่ผ่าน · ไม่มีการเปลี่ยนแปลงใด ๆ";
  if (/NJACC_ADV701_STATE|NJACC_ADV701_NOT_APPROVED|NJACC_ADV701_ALL_PAID/.test(m)) return "สถานะคำขอเปลี่ยนไปแล้ว — โหลดข้อมูลล่าสุดแล้ว";
  if (/NJACC_ADV701_ITEM_PAID/.test(m)) return "รายการนี้ยืนยันจ่ายไปแล้ว — จ่ายซ้ำไม่ได้";
  if (/NJACC_ADV701_SLIP_NOT_FOUND|NJACC_ADV701_SLIP_INVALID/.test(m)) return "ไฟล์สลิปไม่ถูกต้อง / อัปโหลดไม่สำเร็จ — กรุณาเลือกไฟล์ใหม่";
  if (/NJACC_ADV701_PAY_DATE/.test(m)) return "วันที่จ่ายไม่ถูกต้อง (ห้ามเป็นวันในอนาคต)";
  if (/NJACC_JOB_CANCELED/.test(m)) return "JOB ถูกยกเลิกแล้ว";
  if (/njacc_adv701_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "ระบบขออนุมัติยังไม่พร้อม (ต้องรัน RUN-701 ก่อน)";
  if (/row-level security|Unauthorized|403/i.test(m)) return "ไม่มีสิทธิ์อัปโหลด / เปิดไฟล์สลิปนี้";
  return m || "ทำรายการไม่สำเร็จ";
}
function css() {
  if (document.getElementById("aq7-css")) return;
  var s = document.createElement("style"); s.id = "aq7-css";
  s.textContent = [
    ".aq7{max-width:560px;margin:0 auto;padding:0 0 92px;font-size:15px;color:#0f172a;background:#fff;min-height:100%}",
    ".aq7 *{box-sizing:border-box}",
    ".aq7-h{background:linear-gradient(135deg,#0b2a5b,#1d4ed8);color:#fff;border-radius:0 0 18px 18px;padding:16px 16px 18px;display:flex;align-items:center;gap:12px}",
    ".aq7-h .t{flex:1;min-width:0}.aq7-h b{display:block;font-size:18px}.aq7-h small{display:block;opacity:.85;font-size:13px}",
    ".aq7-rf{flex:none;width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}",
    ".aq7-c{padding:14px 14px 0}",
    ".aq7-kp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 14px}",
    ".aq7-k{border:0;border-radius:14px;padding:12px;text-align:left;cursor:pointer;font-family:inherit;min-height:84px;display:flex;flex-direction:column;gap:4px}",
    ".aq7-k b{font-size:26px;line-height:1.1}.aq7-k span{font-size:13px;font-weight:600}",
    ".aq7-k.o{background:#fff7ed;color:#c2410c}.aq7-k.b{background:#ecfdf5;color:#15803d}.aq7-k.w{background:#eff6ff;color:#1d4ed8}.aq7-k.g{background:#dcfce7;color:#166534}.aq7-k.r{background:#fef2f2;color:#b91c1c}.aq7-k.a{background:#f1f5f9;color:#334155}",
    ".aq7-s{display:flex;align-items:center;gap:8px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;height:46px;margin:0 0 12px;background:#fff}",
    ".aq7-s input{flex:1;min-width:0;border:0;outline:0;font-size:15px;font-family:inherit;background:transparent;height:44px}",
    ".aq7-sg{display:flex;gap:6px;margin:0 0 12px;overflow-x:auto}",
    ".aq7-sg button{flex:1;white-space:nowrap;height:40px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;font-weight:600;font-size:14px;font-family:inherit;cursor:pointer;padding:0 10px}.aq7-sg button.on{background:#1d4ed8;border-color:#1d4ed8;color:#fff}",
    ".aq7-lt{font-weight:700;font-size:16px;margin:4px 0 10px}",
    ".aq7-row{display:flex;gap:10px;width:100%;text-align:left;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:12px;margin:0 0 10px;cursor:pointer;font-family:inherit;color:inherit;box-shadow:0 1px 2px rgba(15,23,42,.05)}",
    ".aq7-row:active{background:#f8fafc}",
    ".aq7-ri{flex:none;width:40px;height:40px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center}",
    ".aq7-ri.o{background:#ffedd5;color:#c2410c}.aq7-ri.b{background:#dcfce7;color:#15803d}.aq7-ri.g{background:#16a34a;color:#fff}.aq7-ri.r{background:#fee2e2;color:#b91c1c}",
    ".aq7-rm{flex:1;min-width:0}.aq7-rm b{display:block;font-size:15px}.aq7-rm small{display:block;color:#64748b;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".aq7-rr{flex:none;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}.aq7-rr b{font-size:15px}.aq7-rr small{color:#64748b;font-size:12px}",
    ".aq7-pl{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:999px;font-size:11.5px;font-weight:700;white-space:nowrap}",
    ".aq7-pl.o{background:#ffedd5;color:#c2410c}.aq7-pl.b{background:#dbeafe;color:#1d4ed8}.aq7-pl.g{background:#dcfce7;color:#15803d}.aq7-pl.r{background:#fee2e2;color:#b91c1c}",
    ".aq7-em{padding:28px 10px;text-align:center;color:#64748b}",
    ".aq7-more{width:100%;height:44px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;font-weight:600;font-family:inherit;cursor:pointer;margin:0 0 12px}",
    ".aq7-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(560px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-top:1px solid #e2e8f0;padding:6px 4px calc(6px + env(safe-area-inset-bottom));z-index:900;box-shadow:0 -4px 16px rgba(15,23,42,.06)}",
    ".aq7-nav button{position:relative;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;padding:4px 0;font-family:inherit;min-height:52px}",
    ".aq7-nav button.on{color:#1d4ed8}.aq7-nav button.on.r{color:#dc2626}",
    ".aq7-bd{position:absolute;top:0;left:calc(50% + 6px);min-width:18px;height:18px;border-radius:9px;background:#dc2626;color:#fff;font-size:11px;line-height:18px;padding:0 5px}",
    ".aq7-sh{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center}",
    ".aq7-sb{background:#fff;width:min(560px,100%);max-height:94vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden}",
    ".aq7-st{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid #e2e8f0}.aq7-st b{flex:1;font-size:17px;min-width:0;overflow:hidden;text-overflow:ellipsis}",
    ".aq7-x{flex:none;width:40px;height:40px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:20px;cursor:pointer}",
    ".aq7-sc{flex:1;overflow:auto;padding:12px 16px;-webkit-overflow-scrolling:touch}",
    ".aq7-sf{display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #e2e8f0;background:#fff}",
    ".aq7-btn{flex:1;min-height:50px;border-radius:12px;border:0;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 12px}",
    ".aq7-btn.p{background:#1d4ed8;color:#fff}.aq7-btn.g{background:#16a34a;color:#fff}.aq7-btn.d{background:#fff;color:#dc2626;border:2px solid #fca5a5}.aq7-btn.n{background:#f1f5f9;color:#0f172a}.aq7-btn:disabled{opacity:.55;cursor:not-allowed}",
    ".aq7-dl{display:grid;grid-template-columns:110px minmax(0,1fr);gap:6px 10px;font-size:14px;margin:0 0 12px}.aq7-dl dt{color:#64748b}.aq7-dl dd{margin:0;font-weight:600;word-break:break-word}",
    ".aq7-bar{border-radius:12px;padding:10px 12px;margin:0 0 12px;font-size:14px}.aq7-bar b{display:block}.aq7-bar small{display:block;opacity:.85}",
    ".aq7-bar.o{background:#fff7ed;color:#9a3412}.aq7-bar.b{background:#eff6ff;color:#1e3a8a}.aq7-bar.g{background:#dcfce7;color:#14532d}.aq7-bar.r{background:#fef2f2;color:#991b1b}",
    ".aq7-it{border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin:0 0 10px}",
    ".aq7-ih{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.aq7-ih b{font-size:15px}.aq7-ih strong{font-size:17px;color:#166534;white-space:nowrap}",
    ".aq7-iv{font-size:14px;color:#334155;margin-top:6px;display:grid;gap:4px}",
    ".aq7-acc{display:flex;align-items:center;gap:8px}.aq7-acc span{font-weight:700;font-size:16px;letter-spacing:.3px}",
    ".aq7-cp{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 12px;border-radius:9px;border:1px solid #93c5fd;background:#eff6ff;color:#1d4ed8;font-weight:600;font-size:13px;font-family:inherit;cursor:pointer}",
    ".aq7-ia{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.aq7-ia .aq7-btn{min-height:44px;font-size:14px}",
    ".aq7-paid{margin-top:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:8px 10px;font-size:13px;color:#14532d}",
    ".aq7-fm label{display:block;font-weight:600;font-size:14px;margin:10px 0 6px}.aq7-fm input[type=date],.aq7-fm textarea{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:15px;font-family:inherit}",
    ".aq7-fm textarea{min-height:110px;resize:vertical}",
    ".aq7-file{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;border:2px dashed #93c5fd;border-radius:12px;padding:18px;color:#1d4ed8;font-weight:600;cursor:pointer;text-align:center;background:#f8fbff}",
    ".aq7-file input{display:none}.aq7-prev{margin-top:8px;text-align:center}.aq7-prev img{max-width:100%;max-height:260px;border-radius:10px;border:1px solid #e2e8f0}",
    ".aq7-req{color:#dc2626}.aq7-hint{font-size:12.5px;color:#64748b;margin-top:4px}",
    "@media (min-width:761px){.aq7{padding-top:8px}.aq7-sh{align-items:center}.aq7-sb{border-radius:18px;max-height:90vh}}"
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
function stInfo(r) { return ST[r && r.status] || ["-", "o"]; }
function paidText(r, j, n) {
  var d = function (v) { v = String(v == null ? "" : v).trim(); return v || "-"; }, L = [], tot = 0;
  L.push("✅ จ่ายเงิน ADVANCE เรียบร้อยแล้ว", "", "JOB: " + d(r.job_no), "Company: " + d(j.company_invoice), "Customer: " + d(j.customer_name), "House B/L: " + d(j.house_bl_no), "");
  (r.pays || []).filter(function (p) { return !n || Number(p.item_no) === Number(n); }).forEach(function (p) {
    var it = (r.items || [])[p.item_no - 1] || {};
    L.push("💰 " + (r.item_count > 1 ? "รายการที่ " + p.item_no : "รายการ") + ": " + d(it.payment_type), "ธนาคาร: " + d(it.bank_name), "ชื่อบัญชี: " + d(it.account_name), "เลขบัญชี: " + d(it.account_no),
      "จ่ายจริง: " + fm(p.amount) + " บาท", "วันที่จ่าย: " + dd7(p.pay_date), "");
    tot += Number(p.amount) || 0;
  });
  L.push("✅ ยอดจ่ายสุทธิ " + fm(Math.round(tot * 100) / 100) + " บาท");
  return L.join("\n");
}

/* ── หน้าหลัก ── */
function navHTML() {
  var c = (S && S.counts) || {};
  var b = function (k, ic, lb, n, cls) { return '<button type="button" data-tab="' + k + '" class="' + (S.tab === k ? "on " : "") + (cls || "") + '">' + ic + "<span>" + lb + "</span>" + (n ? '<i class="aq7-bd">' + n + "</i>" : "") + "</button>"; };
  return b("HOME", IC.home, "หน้าแรก") + b("PENDING", IC.wait, "รออนุมัติ", c.pending) + b("APPROVED", IC.ok, "อนุมัติแล้ว") + b("REJECTED", IC.no, "ไม่อนุมัติ", 0, "r");
}
function rowHTML(x) {
  var j = x.job || {}, s = stInfo(x), ic = x.status === "PENDING" ? IC.wait : x.status === "REJECTED" ? IC.no : IC.ok;
  var sub = x.status === "APPROVED" && Number(x.paid_count) > 0 ? "จ่ายแล้ว " + x.paid_count + "/" + x.item_count : s[0];
  var dt = x.status === "REJECTED" ? x.rejected_at : x.status === "PAID" ? x.paid_at : x.status === "APPROVED" ? x.approved_at : x.requested_at;
  return '<button type="button" class="aq7-row" data-job="' + esc(x.job_id) + '"><span class="aq7-ri ' + s[1] + '">' + ic + '</span><span class="aq7-rm"><b>' + esc(x.job_no) + "</b><small>" + esc(j.company_invoice || "-") + "</small><small>" + esc(j.customer_name || "-") + " · " + esc(j.house_bl_no || "-") +
    "</small><small>ผู้ขอ " + esc(x.requested_by || "-") + (x.status === "REJECTED" && x.reject_reason ? " · เหตุผล: " + esc(x.reject_reason) : "") + '</small></span><span class="aq7-rr"><b>฿' + fm(x.total_real) + '</b><em class="aq7-pl ' + s[1] + '">' + esc(sub) + "</em><small>" + esc(d7(dt)) + "</small></span></button>";
}
function bodyHTML() {
  var c = S.counts || {}, h = "";
  if (S.tab === "HOME") {
    var k = function (cls, n, lb, go, sub) { return '<button type="button" class="aq7-k ' + cls + '" data-go="' + go + '"' + (sub ? ' data-sub="' + sub + '"' : "") + "><b>" + (n || 0) + "</b><span>" + lb + "</span></button>"; };
    h += '<div class="aq7-kp">' + k("o", c.pending, "รออนุมัติ", "PENDING") + k("b", c.approved, "อนุมัติแล้ว", "APPROVED", "ALL") + k("w", c.wait, "รอจ่ายเงิน", "APPROVED", "WAIT") + k("g", c.paid, "จ่ายเงินแล้ว", "APPROVED", "PAID") +
      k("r", c.rejected, "ไม่อนุมัติ", "REJECTED") + k("a", c.total, "คำขอทั้งหมด", "HOME") + "</div>";
  }
  if (S.tab === "APPROVED") {
    var sg = function (k, lb, n) { return '<button type="button" data-sub="' + k + '" class="' + (S.sub === k ? "on" : "") + '">' + lb + " (" + (n || 0) + ")</button>"; };
    h += '<div class="aq7-sg">' + sg("ALL", "ทั้งหมด", c.approved) + sg("WAIT", "รอจ่าย", c.wait) + sg("PAID", "จ่ายแล้ว", c.paid) + "</div>";
  }
  h += '<label class="aq7-s">' + IC.q + '<input type="search" data-q placeholder="ค้นหา JOB, Company, Customer, House B/L, ผู้เปิดงาน" value="' + esc(S.q) + '" enterkeyhint="search"></label>';
  h += '<div class="aq7-lt">' + (S.tab === "HOME" ? "รายการล่าสุด" : S.tab === "PENDING" ? "รออนุมัติ" : S.tab === "APPROVED" ? "อนุมัติแล้ว" : "ไม่อนุมัติ") + (S.total ? " (" + S.total + ")" : "") + "</div>";
  h += '<div data-list>' + listHTML() + "</div>";
  return h;
}
function listHTML() {
  if (S.err) return '<div class="aq7-em">' + esc(S.err) + "</div>";
  if (S.loading && !S.rows.length) return '<div class="aq7-em">กำลังโหลด…</div>';
  if (!S.rows.length) return '<div class="aq7-em">ไม่มีรายการ</div>';
  return S.rows.map(rowHTML).join("") + (S.rows.length < S.total ? '<button type="button" class="aq7-more" data-more>โหลดเพิ่ม (' + S.rows.length + "/" + S.total + ")</button>" : "");
}
function paint() {
  if (!S || !S.root.isConnected) return;
  var c = S.root.querySelector(".aq7-c"), n = S.root.querySelector(".aq7-nav"), f = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-q]");
  if (n) n.innerHTML = navHTML();
  if (c) { c.innerHTML = bodyHTML(); if (f) { var q = c.querySelector("[data-q]"); q && (q.focus(), q.setSelectionRange(q.value.length, q.value.length)); } }
}
async function load(reset) {
  if (!S) return;
  var my = ++S.seq;
  if (reset) { S.off = 0; S.rows = []; S.total = 0; }
  S.loading = !0; S.err = ""; reset && paint();
  try {
    var r = await rpc("njacc_adv701_list", { p: { tab: S.tab, sub: S.sub, q: S.q, limit: LIM, offset: S.off } });
    if (my !== S.seq) return;
    S.counts = r && r.counts || S.counts; S.total = r && r.total || 0;
    S.rows = S.rows.concat((r && r.rows) || []); S.off = S.rows.length;
    badgeSet(S.counts);
  } catch (e) { if (my !== S.seq) return; S.err = errMsg(e); }
  S.loading = !1; paint();
}

/* ── รายละเอียด (Bottom Sheet) ── */
function sheet(title, pill, html, foot) {
  closeSheet();
  var w = document.createElement("div"); w.className = "aq7-sh"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
  w.innerHTML = '<div class="aq7-sb"><div class="aq7-st"><b>' + title + "</b>" + (pill || "") + '<button type="button" class="aq7-x" data-x aria-label="ปิด">×</button></div><div class="aq7-sc">' + html + "</div>" + (foot ? '<div class="aq7-sf">' + foot + "</div>" : "") + "</div>";
  w.addEventListener("click", function (e) { if (e.target === w || e.target.closest("[data-x]")) closeSheet(); });
  document.body.appendChild(w); S.sheet = w; return w;
}
function closeSheet() { if (S && S.sheet) { S.sheet.remove(); S.sheet = null; } if (S && S.purl) { try { URL.revokeObjectURL(S.purl); } catch (e) {} S.purl = null; } }
async function openJob(jobId) {
  var w = sheet("กำลังโหลด…", "", '<div class="aq7-em">กำลังโหลด…</div>');
  try {
    var g = await rpc("njacc_adv701_get", { p_job: jobId });
    if (!S || S.sheet !== w) return;
    if (!g || !g.req) { sheet("ไม่พบคำขอ", "", '<div class="aq7-em">JOB นี้ยังไม่มีคำขออนุมัติ</div>'); return; }
    detail(g);
  } catch (e) { if (S && S.sheet === w) sheet("เปิดไม่ได้", "", '<div class="aq7-em">' + esc(errMsg(e)) + "</div>"); }
}
function detail(g) {
  var r = g.req, j = g.job || {}, s = stInfo(r), h = "", f = "";
  S.cur = g;
  if (r.status === "PENDING") h += '<div class="aq7-bar o"><b>🕒 รออนุมัติ</b><small>ส่งโดย ' + esc(r.requested_by || "-") + " · " + esc(d7(r.requested_at)) + "</small></div>";
  if (r.status === "APPROVED") h += '<div class="aq7-bar b"><b>✅ อนุมัติแล้ว — รอจ่ายเงิน</b><small>อนุมัติโดย ' + esc(r.approved_by || "-") + " · " + esc(d7(r.approved_at)) + " · จ่ายแล้ว " + r.paid_count + "/" + r.item_count + " รายการ</small></div>";
  if (r.status === "PAID") h += '<div class="aq7-bar g"><b>✅ อนุมัติแล้ว — จ่ายเงินแล้ว</b><small>ยอดจ่าย ' + fm(r.paid_total) + " บาท · " + esc(d7(r.paid_at)) + "</small></div>";
  if (r.status === "REJECTED") h += '<div class="aq7-bar r"><b>❌ ไม่อนุมัติ — ยกเลิก JOB</b><small>โดย ' + esc(r.rejected_by || "-") + " · " + esc(d7(r.rejected_at)) + '</small><div style="margin-top:4px;font-weight:600;white-space:pre-wrap">เหตุผล: ' + esc(r.reject_reason || "-") + "</div></div>";
  h += '<dl class="aq7-dl"><dt>JOB</dt><dd>' + esc(r.job_no) + "</dd><dt>Company</dt><dd>" + esc(j.company_invoice || "-") + "</dd><dt>Customer</dt><dd>" + esc(j.customer_name || "-") + "</dd><dt>House B/L</dt><dd>" + esc(j.house_bl_no || "-") +
    "</dd><dt>ผู้เปิดงาน</dt><dd>" + esc(j.created_by || "-") + "</dd><dt>ผู้ขอเบิก</dt><dd>" + esc(r.requested_by || "-") + " · " + esc(d7(r.requested_at)) + '</dd><dt>ยอดขอเบิก</dt><dd style="color:#166534">฿' + fm(r.total_real) + " (" + r.item_count + " รายการ)</dd></dl>";
  (r.items || []).forEach(function (it, i) {
    var n = i + 1, p = (r.pays || []).find(function (x) { return Number(x.item_no) === n; });
    h += '<div class="aq7-it"><div class="aq7-ih"><b>' + (r.item_count > 1 ? "รายการที่ " + n + " : " : "") + esc(it.payment_type || "-") + "</b><strong>฿" + fm(it.real_pay) + "</strong></div>" +
      '<div class="aq7-iv"><div>ธนาคาร : <b>' + esc(it.bank_name || "-") + "</b></div><div>ชื่อบัญชี : <b>" + esc(it.account_name || "-") + '</b></div><div class="aq7-acc">เลขบัญชี : <span>' + esc(it.account_no || "-") + '</span><button type="button" class="aq7-cp" data-cpacc="' + n + '">' + IC.cp + "COPY</button></div>" +
      '<div style="color:#64748b;font-size:13px">ยอดก่อนหัก ' + fm(it.gross) + " · หัก " + esc(String(it.deduct_pct || 0)) + "% · VAT " + esc(String(it.vat_pct || 0)) + "%</div></div>";
    if (p) h += '<div class="aq7-paid">✅ จ่ายแล้ว ' + fm(p.amount) + " บาท · วันที่จ่าย " + esc(dd7(p.pay_date)) + " · โดย " + esc(p.paid_by || "-") + "<br>🧾 " + esc(p.slip_name || "-") + '</div><div class="aq7-ia"><button type="button" class="aq7-btn n" data-slipv="' + n + '">👁 ดูสลิป</button><button type="button" class="aq7-btn n" data-slipd="' + n + '">⬇ ดาวน์โหลด</button><button type="button" class="aq7-btn n" data-cppaid="' + n + '">📋 COPY แจ้งจ่ายแล้ว</button></div>';
    else if (r.status === "APPROVED") h += '<div class="aq7-ia"><button type="button" class="aq7-btn g" data-pay="' + n + '">📎 แนบสลิป / ยืนยันจ่ายเงิน</button></div>';
    h += "</div>";
  });
  if (r.status === "PENDING") f = '<button type="button" class="aq7-btn d" data-rej>✕ ไม่อนุมัติ</button><button type="button" class="aq7-btn p" data-apv>✓ อนุมัติ</button>';
  if (r.status === "PAID") f = '<button type="button" class="aq7-btn g" data-cppaid="0">📋 COPY แจ้งจ่ายแล้ว</button>';
  var w = sheet(esc(r.job_no), '<em class="aq7-pl ' + s[1] + '">' + esc(s[0]) + "</em>", h, f);
  w.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !S.cur) return; var R = S.cur.req, J = S.cur.job || {};
    if (b.hasAttribute("data-cpacc")) { var it = R.items[Number(b.dataset.cpacc) - 1]; it && it.account_no ? copy(String(it.account_no).trim(), "คัดลอกเลขบัญชีแล้ว") : toast("ยังไม่มีเลขบัญชี", "err"); return; }
    if (b.hasAttribute("data-cppaid")) { var nn = Number(b.dataset.cppaid); if (nn ? (R.pays || []).some(function (x) { return Number(x.item_no) === nn; }) : R.status === "PAID") copy(paidText(R, J, nn), "คัดลอกข้อความแจ้งจ่ายแล้วเรียบร้อย"); return; }
    if (b.hasAttribute("data-slipv") || b.hasAttribute("data-slipd")) { slip(R, Number(b.dataset.slipv || b.dataset.slipd), b.hasAttribute("data-slipd"), b); return; }
    if (b.hasAttribute("data-apv")) { approve(R, b); return; }
    if (b.hasAttribute("data-rej")) { rejectForm(R); return; }
    if (b.hasAttribute("data-pay")) { payForm(R, J, Number(b.dataset.pay)); return; }
  });
}
async function after(jobId, msg) { toast(msg, "ok"); load(!0); await openJob(jobId); }
async function approve(r, b) {
  var w = sheet("ยืนยันอนุมัติ", "", '<div class="aq7-bar b"><b>อนุมัติเบิกเงิน JOB ' + esc(r.job_no) + "</b><small>" + r.item_count + " รายการ · ยอด " + fm(r.total_real) + ' บาท</small></div><div class="aq7-hint">การอนุมัติยังไม่ถือว่าจ่ายเงินแล้ว — สถานะจะเป็น “อนุมัติแล้ว — รอจ่ายเงิน” จนกว่าจะแนบสลิปและยืนยันจ่าย</div>',
    '<button type="button" class="aq7-btn n" data-back>ย้อนกลับ</button><button type="button" class="aq7-btn p" data-go>✓ ยืนยันอนุมัติ</button>');
  w.addEventListener("click", async function (e) {
    var x = e.target.closest("button"); if (!x) return;
    if (x.hasAttribute("data-back")) { openJob(r.job_id); return; }
    if (!x.hasAttribute("data-go") || x.disabled) return;
    x.disabled = !0;
    try { await rpc("njacc_adv701_approve", { p: { req_id: r.id } }); after(r.job_id, "✅ อนุมัติแล้ว — รอจ่ายเงิน · JOB " + r.job_no); }
    catch (er) { toast(errMsg(er), "err"); x.disabled = !1; if (/STATE/.test(String(er && er.message))) { load(!0); openJob(r.job_id); } }
  });
}
function rejectForm(r) {
  var w = sheet("ไม่อนุมัติ — ยกเลิก JOB", "", '<div class="aq7-bar r"><b>JOB ' + esc(r.job_no) + " · ฿" + fm(r.total_real) + '</b><small>เมื่อยืนยัน ระบบจะยกเลิก JOB ผ่าน Flow ยกเลิกงานเดิม (ไม่ลบข้อมูล · เลข JOB / ประวัติคงอยู่)</small></div>' +
    '<div class="aq7-fm"><label>เหตุผลที่ไม่อนุมัติ <span class="aq7-req">*</span></label><textarea data-rs maxlength="500" placeholder="เช่น เอกสารไม่ครบ กรุณาส่งเอกสารใหม่อีกครั้ง"></textarea><div class="aq7-hint">บังคับกรอกทุกครั้ง · พนักงานจะเห็นเหตุผลนี้ในหน้าคอม</div></div>',
    '<button type="button" class="aq7-btn n" data-back>ย้อนกลับ</button><button type="button" class="aq7-btn d" data-go disabled>✕ ยืนยันไม่อนุมัติ</button>');
  var ta = w.querySelector("[data-rs]"), go = w.querySelector("[data-go]");
  ta.addEventListener("input", function () { go.disabled = !ta.value.trim(); });
  w.addEventListener("click", async function (e) {
    var x = e.target.closest("button"); if (!x) return;
    if (x.hasAttribute("data-back")) { openJob(r.job_id); return; }
    if (!x.hasAttribute("data-go") || x.disabled) return;
    var rs = ta.value.trim(); if (!rs) { toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "err"); return; }
    x.disabled = !0;
    try { await rpc("njacc_adv701_reject", { p: { req_id: r.id, reason: rs } }); after(r.job_id, "❌ ไม่อนุมัติ — ยกเลิก JOB " + r.job_no + " แล้ว"); }
    catch (er) { toast(errMsg(er), "err"); x.disabled = !1; }
  });
  setTimeout(function () { ta.focus(); }, 50);
}
function rnd() { var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (x) { return (x % 36).toString(36); }).join(""); }
function payForm(r, j, n) {
  var it = (r.items || [])[n - 1] || {}, file = null;
  var w = sheet("แนบสลิป / ยืนยันจ่ายเงิน", "", '<div class="aq7-it"><div class="aq7-ih"><b>' + (r.item_count > 1 ? "รายการที่ " + n + " : " : "") + esc(it.payment_type || "-") + "</b><strong>฿" + fm(it.real_pay) + '</strong></div><div class="aq7-iv"><div>JOB : <b>' + esc(r.job_no) + "</b></div><div>ธนาคาร : <b>" + esc(it.bank_name || "-") +
    "</b></div><div>ชื่อบัญชี : <b>" + esc(it.account_name || "-") + '</b></div><div class="aq7-acc">เลขบัญชี : <span>' + esc(it.account_no || "-") + '</span><button type="button" class="aq7-cp" data-cpacc>' + IC.cp + "COPY</button></div></div></div>" +
    '<div class="aq7-fm"><label>สลิปการโอนเงิน <span class="aq7-req">*</span></label><label class="aq7-file">📎 เลือกสลิปจากโทรศัพท์<small style="font-weight:400;color:#64748b">JPG / PNG / PDF ไม่เกิน 5 MB</small><input type="file" data-f accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"></label><div class="aq7-prev" data-pv></div>' +
    '<label>วันที่จ่ายเงิน <span class="aq7-req">*</span></label><input type="date" data-d value="' + today() + '" max="' + today() + '"><div class="aq7-hint">ตรวจสอบบัญชีและยอดเงินก่อนยืนยัน · ยืนยันแล้วแก้ไข / จ่ายซ้ำไม่ได้</div></div>',
    '<button type="button" class="aq7-btn n" data-back>ย้อนกลับ</button><button type="button" class="aq7-btn g" data-go disabled>✓ ยืนยันจ่ายเงินแล้ว</button>');
  var fi = w.querySelector("[data-f]"), pv = w.querySelector("[data-pv]"), go = w.querySelector("[data-go]"), dd = w.querySelector("[data-d]");
  var ok = function () { go.disabled = !(file && dd.value); };
  fi.addEventListener("change", function () {
    file = null; pv.innerHTML = ""; if (S.purl) { try { URL.revokeObjectURL(S.purl); } catch (e) {} S.purl = null; }
    var f = fi.files && fi.files[0]; if (!f) { ok(); return; }
    var ty = String(f.type || "").toLowerCase(), ex = (String(f.name || "").split(".").pop() || "").toLowerCase();
    if (!/^(image\/jpeg|image\/png|application\/pdf)$/.test(ty) || !/^(jpe?g|png|pdf)$/.test(ex)) { toast("รองรับเฉพาะไฟล์ JPG / PNG / PDF", "err"); fi.value = ""; ok(); return; }
    if (f.size > MAXF) { toast("ไฟล์ใหญ่เกิน 5 MB", "err"); fi.value = ""; ok(); return; }
    file = f;
    if (ty !== "application/pdf") { S.purl = URL.createObjectURL(f); pv.innerHTML = '<img alt="ตัวอย่างสลิป" src="' + S.purl + '">'; }
    pv.insertAdjacentHTML("beforeend", '<div class="aq7-hint">' + (ty === "application/pdf" ? "📄 " : "") + esc(f.name) + " · " + Math.max(1, Math.round(f.size / 1024)) + " KB</div>");
    ok();
  });
  dd.addEventListener("change", ok);
  w.addEventListener("click", async function (e) {
    var x = e.target.closest("button"); if (!x) return;
    if (x.hasAttribute("data-cpacc")) { it.account_no ? copy(String(it.account_no).trim(), "คัดลอกเลขบัญชีแล้ว") : toast("ยังไม่มีเลขบัญชี", "err"); return; }
    if (x.hasAttribute("data-back")) { openJob(r.job_id); return; }
    if (!x.hasAttribute("data-go") || x.disabled || S.paying) return;
    if (!file || !dd.value) return;
    if (dd.value > today()) { toast("วันที่จ่ายห้ามเป็นวันในอนาคต", "err"); return; }
    S.paying = !0; x.disabled = !0; x.textContent = "กำลังอัปโหลดสลิป…";
    var ty = String(file.type).toLowerCase(), ext = ty === "application/pdf" ? "pdf" : ty === "image/png" ? "png" : "jpg";
    var path = r.job_id + "/" + r.id + "/" + n + "-" + rnd() + "." + ext;
    try {
      var up = await SB().storage.from(BK).upload(path, file, { contentType: ty, upsert: !1, cacheControl: "3600" });
      if (up.error) throw up.error;
      x.textContent = "กำลังบันทึก…";
      await rpc("njacc_adv701_pay", { p: { req_id: r.id, item_no: n, pay_date: dd.value, slip_path: path, slip_name: String(file.name || "").slice(0, 150) } });
      S.paying = !1;
      after(r.job_id, "✅ จ่ายเงินแล้ว — แนบสลิปสำเร็จ · JOB " + r.job_no + (r.item_count > 1 ? " รายการที่ " + n : ""));
    } catch (er) { S.paying = !1; x.disabled = !1; x.textContent = "✓ ยืนยันจ่ายเงินแล้ว"; toast(errMsg(er), "err"); }
  });
}
async function slip(r, n, dl, b) {
  var p = (r.pays || []).find(function (x) { return Number(x.item_no) === n; }); if (!p) return;
  var w = dl ? null : window.open("", "_blank"); b && (b.disabled = !0);
  try {
    var q = await SB().storage.from(BK).createSignedUrl(p.slip_path, 120, dl ? { download: p.slip_name || !0 } : void 0);
    if (q.error || !q.data || !q.data.signedUrl) throw q.error || new Error("no url");
    if (dl) { var rs = await fetch(q.data.signedUrl); if (!rs.ok) throw new Error("HTTP " + rs.status); var ou = URL.createObjectURL(await rs.blob()), a = document.createElement("a"); a.href = ou; a.download = p.slip_name || "slip"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(ou); }, 15e3); }
    else if (w) { try { w.opener = null; } catch (e) {} w.location.href = q.data.signedUrl; } else location.href = q.data.signedUrl;
  } catch (e) { w && w.close(); toast("เปิดสลิปไม่ได้ — " + errMsg(e), "err"); }
  b && (b.disabled = !1);
}

/* ── Badge จำนวนรออนุมัติ บนเมนู (SUPER_ADMIN) ── */
function badgeSet(c) {
  try {
    var el = document.querySelector('[data-nav="advance/approve"]'); if (!el || !c) return;
    var b = el.querySelector(".aq7-mb"); if (!b) { b = document.createElement("span"); b.className = "aq7-mb"; b.style.cssText = "margin-left:auto;min-width:20px;height:20px;border-radius:10px;background:#dc2626;color:#fff;font-size:11.5px;font-weight:700;line-height:20px;text-align:center;padding:0 6px"; el.appendChild(b); }
    b.textContent = String(c.pending || 0); b.hidden = !c.pending;
  } catch (e) {}
}
function badge() {
  if (window.__aq7b) return; window.__aq7b = !0;
  var run = function () { if (document.hidden) return; rpc("njacc_adv701_list", { p: { tab: "PENDING", limit: 1 } }).then(function (r) { badgeSet(r && r.counts); }, function () {}); };
  run(); setInterval(run, 12e4); document.addEventListener("visibilitychange", function () { document.hidden || run(); });
}

async function render(root, args) {
  css(); args = args || {};
  closeSheet();
  S = { root: root, tab: /^(HOME|PENDING|APPROVED|REJECTED)$/.test(args.tab || "") ? args.tab : "HOME", sub: "ALL", q: "", rows: [], total: 0, off: 0, counts: null, seq: 0, err: "", loading: !1, sheet: null };
  root.innerHTML = '<div class="aq7"><div class="aq7-h"><div class="t"><b>อนุมัติเบิกเงิน ADVANCE</b><small>เบิกเงินสำรองจ่าย · SUPER_ADMIN</small></div><button type="button" class="aq7-rf" data-rf aria-label="โหลดใหม่">' + IC.rf + '</button></div><div class="aq7-c"></div><nav class="aq7-nav"></nav></div>';
  var me = S, tq = 0;
  root.addEventListener("click", function (e) {
    if (S !== me) return;
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-rf")) { load(!0); return; }
    if (b.dataset.tab) { S.tab = b.dataset.tab; S.sub = "ALL"; load(!0); window.scrollTo(0, 0); return; }
    if (b.dataset.go) { S.tab = b.dataset.go; S.sub = b.dataset.sub || "ALL"; load(!0); return; }
    if (b.dataset.sub && b.closest(".aq7-sg")) { S.sub = b.dataset.sub; load(!0); return; }
    if (b.hasAttribute("data-more")) { b.disabled = !0; load(!1); return; }
    if (b.dataset.job) { openJob(b.dataset.job); return; }
  });
  root.addEventListener("input", function (e) {
    if (S !== me || !e.target.matches("[data-q]")) return;
    clearTimeout(tq); var v = e.target.value; tq = setTimeout(function () { if (S !== me) return; S.q = v.trim(); load(!0); }, 350);
  });
  window.addEventListener("hashchange", function hc() { if (S !== me) { window.removeEventListener("hashchange", hc); return; } closeSheet(); });
  paint();
  await load(!0);
  args.job && openJob(String(args.job));
  /* ตรวจรายการใหม่ทุก 60 วินาที (เฉพาะเมื่อหน้านี้เปิดอยู่และมองเห็น) */
  var tk = setInterval(function () {
    if (S !== me || !root.isConnected || !root.querySelector(".aq7")) { clearInterval(tk); if (S === me) closeSheet(); return; }
    if (document.hidden || S.sheet || S.loading || S.off > LIM) return;
    load(!0);
  }, 6e4);
}
export{render,badge};
