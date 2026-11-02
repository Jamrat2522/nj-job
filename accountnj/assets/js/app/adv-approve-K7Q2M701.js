import{approve725 as A725,slips725 as S725,cell725 as L725,draft725 as F725,css725 as K725}from"./adv-slip-A725.js";import{css724 as C724,job724 as J724,st724 as T724,items724 as IT724,tl724 as TL724,I724}from"./ca-detail-D724.js";import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";import{html716 as D716}from"./adv-doc-D716.js";
/* ═══ V.701 · มือถือ SUPER_ADMIN : อนุมัติเบิกเงินสำรองจ่าย ADVANCE (หน้าแรก / รออนุมัติ / อนุมัติแล้ว / ไม่อนุมัติ)
   ข้อมูลจาก RPC ใหม่ RUN-701 เท่านั้น (njacc_adv701_list / get / approve / reject / pay) — สิทธิ์ SUPER_ADMIN ตรวจที่ฐานข้อมูลทุกครั้ง
   สลิป : Storage private njacc-adv-slips (JPG / PNG / PDF ≤ 5 MB · ดู / ดาวน์โหลดด้วย Signed URL อายุ 2 นาที) · โหลดรายการแบบแบ่งหน้า · โหลดสลิปเมื่อกดดูเท่านั้น ═══ */
var BK = "njacc-adv-slips", LIM = 20, MAXF = 5242880, S = null;
var ST = { PENDING: ["รออนุมัติ", "o"], APPROVED: ["อนุมัติแล้ว — รอจ่ายเงิน", "b"], PAID: ["อนุมัติแล้ว — จ่ายเงินแล้ว", "g"], REJECTED: ["ไม่อนุมัติ — ยกเลิก JOB", "r"] };
var IC = {
  exp723: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 9.2c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V12c0 1.4-3.1 2.6-7 2.6S5 13.4 5 12z"/><path d="M5 15c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v2.8c0 1.4-3.1 2.6-7 2.6s-7-1.2-7-2.6z"/></svg>',
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  wait: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  ok: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="m9 13 2 2 4-4"/></svg>',
  no: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
  rf: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  q: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  lo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15.5 8.5 19 12l-3.5 3.5M19 12h-9"/></svg>',
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
  if (/njacc_adv701_|njacc_adv705_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "ระบบขออนุมัติยังไม่พร้อม (ต้องรัน RUN-701 ก่อน)";
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
    ".aq7-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(560px,100%);display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid #e2e8f0;padding:6px 4px calc(6px + env(safe-area-inset-bottom));z-index:900;box-shadow:0 -4px 16px rgba(15,23,42,.06)}",
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
    ".aq7-rc{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 4px}.aq7-rc button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid #fca5a5;background:#fff;color:#b91c1c;font-weight:600;font-size:14px;font-family:inherit;cursor:pointer}.aq7-rc button.on{background:#dc2626;border-color:#dc2626;color:#fff}",
    ".aq7-h3{font-weight:700;font-size:15px;color:#1e3a8a;margin:14px 0 8px}.aq7-inv{border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin:0 0 8px;font-size:14px}.aq7-inv b{color:#1d4ed8}.aq7-no{color:#b91c1c;font-weight:700}",
    ".aq7-warn{margin:6px 0 0;padding:8px 10px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:13px}",
    ".aq7-tl{list-style:none;margin:0;padding:0}.aq7-tl li{display:flex;gap:10px;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:13.5px}.aq7-tl small{display:block;color:#64748b}",
    ".aq7-dt{flex:none;width:10px;height:10px;border-radius:50%;margin-top:5px;background:#64748b}.aq7-dt.o{background:#f97316}.aq7-dt.i{background:#2563eb}.aq7-dt.c{background:#16a34a}.aq7-dt.p{background:#7c3aed}.aq7-dt.x{background:#dc2626}",
    "@media (min-width:761px){.aq7{padding-top:8px}.aq7-sh{align-items:center}.aq7-sb{border-radius:18px;max-height:90vh}}",
    /* V.714 · มือถือ Compact : Header / กรอบสรุปสถานะ (สูงลง ~35%) / ค้นหา / การ์ด JOB · Bottom Navigation 4 เมนูเดิม */
    ".aq7-h{padding:10px 14px 11px;gap:10px;border-radius:0 0 14px 14px}.aq7-h b{font-size:16px}.aq7-h small{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.aq7-rf{width:36px;height:36px;border-radius:10px}",
    ".aq7-c{padding:10px 12px 0}",
    ".aq7-kp{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 10px}.aq7-k{min-height:54px;padding:7px 9px;border-radius:10px;gap:1px;min-width:0}.aq7-k b{font-size:19px}.aq7-k span{font-size:11.5px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".aq7-s{height:40px;border-radius:10px;margin:0 0 8px}.aq7-s input{height:38px}.aq7-sg{margin:0 0 8px}.aq7-sg button{height:36px;font-size:13px;border-radius:9px}",
    ".aq7-lt{font-size:14.5px;margin:2px 0 6px}.aq7-em{padding:18px 10px}.aq7-more{height:40px;margin:0 0 10px}",
    ".aq7-row{padding:9px 10px;gap:9px;margin:0 0 7px;border-radius:11px;box-shadow:none}.aq7-ri{width:34px;height:34px;border-radius:9px}.aq7-ri svg{width:18px;height:18px}",
    ".aq7-rm b{font-size:14.5px}.aq7-rm small{font-size:12px;line-height:1.35}.aq7-rr{gap:3px}.aq7-rr b{font-size:14.5px}.aq7-rr small{font-size:11px}.aq7-pl{height:20px;font-size:11px}",
    /* V.714 · AUTO SUMMARY + ปุ่ม COPY (รายละเอียด JOB) */
    ".aq7-sm{border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff;margin:14px 0 4px;overflow:hidden}",
    ".aq7-smh{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-bottom:1px solid #dbeafe;background:#eff6ff}.aq7-smh span{flex:1;min-width:0;font-weight:700;font-size:13.5px;color:#1e3a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".aq7-smh .aq7-cp{flex:none;height:34px;padding:0 12px;gap:5px;background:#1d4ed8;border-color:#1d4ed8;color:#fff}.aq7-smh .aq7-cp:disabled{opacity:.55}",
    ".aq7-smt{margin:0;padding:10px 12px;font-family:inherit;font-size:13.5px;line-height:1.5;color:#0f172a;white-space:pre-wrap;word-break:break-word}"
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

var RS7 = ["เอกสารไม่ครบ", "ยอดเงินไม่ถูกต้อง", "เลขบัญชีไม่ถูกต้อง"];
function invHTML(r, inv) {
  if (!inv) return '<div class="aq7-warn">โหลดข้อมูล INVOICE ADV ไม่สำเร็จ</div>';
  var post = inv.filter(function (x) { return x.status === "POSTED"; }), other = inv.length - post.length, tot = post.reduce(function (a, x) { return a + (Number(x.total_amount) || 0); }, 0);
  if (!post.length) return '<div class="aq7-inv"><span class="aq7-no">ยังไม่ออก INVOICE</span>' + (other ? '<div class="aq7-warn">มี INVOICE ADV ที่ยังไม่ POST ' + other + " ใบ — ยังไม่นับว่าออก INVOICE แล้ว</div>" : "") + "</div>";
  return post.map(function (x) { return '<div class="aq7-inv"><b>' + esc(x.invoice_no || "-") + "</b> · POST แล้ว<br>วันที่ " + esc(dd7(x.invoice_date)) + " · ยอด " + fm(x.total_amount) + " บาท</div>"; }).join("") +
    (tot + 0.005 < (Number(r.total_real) || 0) ? '<div class="aq7-warn">ยอด INVOICE ADV (' + fm(tot) + " บาท) น้อยกว่ายอดอนุมัติ (" + fm(r.total_real) + " บาท) — ตรวจสอบการเรียกเก็บ</div>" : "") + (other ? '<div class="aq7-warn">มี INVOICE ADV ที่ยังไม่ POST ' + other + " ใบ (ไม่นับรวม)</div>" : "");
}
var TL7 = { CREATE_JOB: ["สร้างงาน", "s"], EDIT_JOB: ["แก้ไขงาน", "s"], EDIT_JOB_DOC_FIELDS: ["แก้ไขงาน", "s"], POST_JOB: ["POST งานสำเร็จ", "p"], SET_JOB_STATUS: ["เปลี่ยนสถานะงาน", "s"], CANCEL_JOB: ["ยกเลิกงาน", "x"],
  ADV698_ITEMS: ["บันทึกรายการจ่าย", "i"], SAVE_INVOICE_DRAFT: ["บันทึก INVOICE ADV (ร่าง)", "s"], ISSUE_INVOICE_NO_ON_SAVE: ["ออกเลข INVOICE ADV", "p"], POST_DRAFT_INVOICE: ["ออก INVOICE ADV แล้ว (POST)", "c"],
  POST_INVOICE: ["ออก INVOICE ADV แล้ว (POST)", "c"], UNPOST_INVOICE: ["UNPOST INVOICE ADV", "x"], UNPOST_TO_DRAFT: ["UNPOST INVOICE ADV", "x"], VOID_INVOICE: ["VOID INVOICE ADV", "x"],
  ACC_HANDOFF: ["ส่งต่อ FINANCE", "p"], ADVANCE_PAY: ["FINANCE ยืนยันจ่ายแล้ว (PAY)", "p"], ADVANCE_UNPAY: ["FINANCE ย้อนกลับ PAY", "x"],
  ADV705_AUTO_CLOSE: ["ปิดงาน DOCUMENT อัตโนมัติ (จ่ายครบ) → ส่ง ACCOUNTING", "c"], ADV705_AUTO_CLOSE_FAIL: ["ปิดงานอัตโนมัติไม่สำเร็จ", "x"] };   /* V.705 */
function tlHTML(r, tl) {
  var ev = [];
  (tl || []).forEach(function (e) {
    if (/^ADV701_/.test(e.action || "")) return;
    var m = TL7[e.action] || [String(e.action || "").replace(/_/g, " "), "s"], d = e.detail || {}, sub = [];
    d.invoice_no && !/^DRAFT-/i.test(d.invoice_no) && sub.push(d.invoice_no); d.job_no && e.action === "POST_JOB" && sub.push("เลข JOB : " + d.job_no); d.reason && sub.push("เหตุผล: " + d.reason);
    ev.push({ at: e.at, c: m[1], t: m[0] + " โดย " + (e.by || "-"), s: sub.join(" · ") });
  });
  ev.push({ at: r.requested_at, c: "o", t: "ส่งคำขออนุมัติ โดย " + (r.requested_by || "-"), s: "ยอดขอเบิก " + fm(r.total_real) + " บาท" });
  r.approved_at && ev.push({ at: r.approved_at, c: "i", t: "อนุมัติแล้ว — รอจ่ายเงิน โดย " + (r.approved_by || "-"), s: "ยอดอนุมัติ " + fm(r.total_real) + " บาท" });
  r.rejected_at && ev.push({ at: r.rejected_at, c: "x", t: "ไม่อนุมัติ — ยกเลิก JOB โดย " + (r.rejected_by || "-"), s: "เหตุผล: " + (r.reject_reason || "-") });
  (r.pays || []).forEach(function (p) { ev.push({ at: p.paid_at, c: "c", t: "จ่ายเงินแล้ว — แนบสลิปสำเร็จ โดย " + (p.paid_by || "-"), s: (r.item_count > 1 ? "รายการที่ " + p.item_no + " · " : "") + "ยอดจ่าย " + fm(p.amount) + " บาท" }); });
  r.status === "PAID" && r.paid_at && ev.push({ at: r.paid_at, c: "c", t: "จ่ายครบทุกรายการ (" + r.item_count + " รายการ)", s: "ยอดจ่ายจริงรวม " + fm(r.paid_total) + " บาท" });   /* V.705 */
  ev.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  return '<ul class="aq7-tl">' + ev.map(function (x) { return '<li><span class="aq7-dt ' + x.c + '"></span><span><b>' + esc(x.t) + "</b><small>" + esc(d7(x.at)) + (x.s ? " · " + esc(x.s) : "") + "</small></span></li>"; }).join("") + "</ul>";
}

/* ── หน้าหลัก ── */
function navHTML() {
  var c = (S && S.counts) || {};
  var b = function (k, ic, lb, n, cls) { return '<button type="button" data-tab="' + k + '" class="' + (S.tab === k ? "on " : "") + (cls || "") + '">' + ic + "<span>" + lb + "</span>" + (n ? '<i class="aq7-bd">' + n + "</i>" : "") + "</button>"; };
  return b("HOME", IC.home, "หน้าแรก") + b("PENDING", IC.wait, "รออนุมัติ", c.pending) + b("APPROVED", IC.ok, "อนุมัติแล้ว") + b("REJECTED", IC.no, "ไม่อนุมัติ", 0, "r") +
    '<button type="button" data-exp>' + IC.exp723 + "<span>EXPENSES</span></button>";   /* V.723 : เมนู EXPENSES */
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
    var ap = g.req.status === "APPROVED" || g.req.status === "PAID";   /* V.704 : INVOICE ADV + Timeline History (อ่านอย่างเดียว) */
    var ex = await Promise.all([ap ? rpc("njacc_cash_adv702_get", { p_job: jobId }).catch(function () { return null; }) : null, rpc("njacc_adv698_get", { p_job: jobId }).catch(function () { return null; }),
      import("./job-form-4IHODUQT.js").then(function (m) { return m.AD698; }).catch(function () { return null; }),
      g.req.status === "PENDING" || g.req.status === "APPROVED" ? S725(g.req.id) : null]);   /* V.725 : สลิปแนบล่วงหน้าแยกรายการ */   /* V.714 : ฟังก์ชัน AUTO SUMMARY เดิมของ Desktop */
    if (!S || S.sheet !== w) return;
    g.invoices = ap ? (ex[0] ? ex[0].invoices || [] : null) : void 0; g.timeline = ex[1] && ex[1].timeline || [];
    g.sum714 = sum714(g, ex[1], ex[2]);
    detail(g);
  } catch (e) { if (S && S.sheet === w) sheet("เปิดไม่ได้", "", '<div class="aq7-em">' + esc(errMsg(e)) + "</div>"); }
}
function detail(g) {
  var r = g.req, j = g.job || {}, s = stInfo(r), h = "", f = "";
  S.cur = g;
  C724();   /* V.724 : มือถือใช้ส่วนแสดงเดียวกับ Desktop (1 คอลัมน์) · Timeline เป็น Accordion พับเริ่มต้น */
  K725(); ev725();   /* V.725 */
  css726();   /* V.726 : มือถือ — AUTO SUMMARY บนสุด · ไม่แสดงข้อมูล JOB / แถบสถานะซ้ำ / Timeline · INVOICE ADV เฉพาะที่ออกเลขแล้ว · ไม่อนุมัติ = ข้อมูลคำขอ + เหตุผล */
  if (r.status === "REJECTED") h += rej726(r, j) + IT724(r, !1, function (n) { return L725(r, n); });
  else {
    h += sum726(g) + IT724(r, r.status === "APPROVED", function (n) { return L725(r, n); });
    if ((g.invoices || []).some(function (x) { return x.status === "POSTED" && x.invoice_no; })) h += '<div class="aq7-h3">INVOICE ADV</div>' + invHTML(r, g.invoices);
  }
  h += D716(r.job_id || j.id, { src: "CASH_ADVANCE", mobile: !0, reload: !0, del: !0 });   /* V.725 : ปุ่มลบ (SUPER_ADMIN · JOB ยังไม่ปิด / ยกเลิก) */
  if (r.status === "PENDING") f = '<button type="button" class="aq7-btn d" data-rej>✕ ไม่อนุมัติ</button><button type="button" class="aq7-btn g" data-apv>✓ อนุมัติ</button>';
  if (r.status === "PAID") f = '<button type="button" class="aq7-btn g" data-cppaid="0">📋 COPY แจ้งจ่ายแล้ว</button>';
  var w = sheet(esc(r.job_no), '<em class="aq7-pl ' + s[1] + '">' + esc(s[0]) + "</em>", h, f);
  w.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b || !S.cur) return; var R = S.cur.req, J = S.cur.job || {};
    if (b.hasAttribute("data-cpsum714")) { cp714(S.cur.sum714); return; }
    if (b.hasAttribute("data-cpacc")) { var it = R.items[Number(b.dataset.cpacc) - 1]; it && it.account_no ? copy(String(it.account_no).trim(), "คัดลอกเลขบัญชีแล้ว") : toast("ยังไม่มีเลขบัญชี", "err"); return; }
    if (b.hasAttribute("data-cppaid")) { var nn = Number(b.dataset.cppaid); if (nn ? (R.pays || []).some(function (x) { return Number(x.item_no) === nn; }) : R.status === "PAID") copy(paidText(R, J, nn), "คัดลอกข้อความแจ้งจ่ายแล้วเรียบร้อย"); return; }
    if (b.hasAttribute("data-slipv") || b.hasAttribute("data-slipd")) { slip(R, Number(b.dataset.slipv || b.dataset.slipd), b.hasAttribute("data-slipd"), b); return; }
    if (b.hasAttribute("data-retry7")) { retry7(R, b); return; }
    if (b.hasAttribute("data-apv")) { approve(R, b); return; }
    if (b.hasAttribute("data-rej")) { rejectForm(R); return; }
    if (b.hasAttribute("data-pay")) { payForm(R, J, Number(b.dataset.pay)); return; }
  });
}
async function after(jobId, msg) { toast(msg, "ok"); load(!0); await openJob(jobId); }
function ac7(ac) {   /* V.705 : ผลปิดงาน DOCUMENT อัตโนมัติ (ระบบกลางเดียวกับคอม) */
  if (!ac) return;
  if (ac.ok) { toast(ac.already_closed ? "จ่ายครบแล้ว — JOB นี้ปิดงาน DOCUMENT อยู่แล้ว" : "✅ จ่ายครบทุกรายการ — ปิดงาน DOCUMENT อัตโนมัติแล้ว → ส่ง ACCOUNTING", "ok"); return; }
  toast("จ่ายครบแล้ว แต่ปิดงาน DOCUMENT อัตโนมัติไม่สำเร็จ — " + (ac.code === "JOB_CANCELED" ? "JOB ถูกยกเลิก" : errMsg(ac.error || ac.code)) + " · กด “ลองปิดงานอีกครั้ง” ได้โดยไม่ต้องจ่ายซ้ำ", "err");
}
async function retry7(r, b) { if (S.paying) return; S.paying = !0; b.disabled = !0;
  try { var ac = await rpc("njacc_adv705_close", { p: { req_id: r.id } }); S.paying = !1; ac7(ac); load(!0); await openJob(r.job_id); }
  catch (er) { S.paying = !1; b.disabled = !1; toast(errMsg(er), "err"); } }
function approve(r, b) {   /* V.725 : หน้าต่าง "ยืนยันการอนุมัติ" (แนบสลิปแยกรายการ · ไม่บังคับ) — ยังไม่กดยืนยัน = คงรออนุมัติ */
  var g = S && S.cur;
  A725(r, { job: g && g.req === r ? g.job : {}, done: function () { after(r.job_id, "✅ อนุมัติแล้ว — รอจ่ายเงิน · JOB " + r.job_no); },
    close: function (ch) { if (ch && S && S.sheet) openJob(r.job_id); }, stale: function () { load(!0); openJob(r.job_id); } });
}
var EV725 = !1;
function ev725() {   /* V.725 : ลบสลิปใน Detail → แสดงข้อมูลล่าสุด (หน้าต่างยืนยันจัดการเอง) */
  if (EV725) return; EV725 = !0;
  window.addEventListener("njacc:slip725", function (e) {
    var d = e.detail || {};
    if (d.act === "add" || document.querySelector(".a725-ov") || !S || !S.sheet || !S.cur || !S.cur.req || S.cur.req.id !== d.req_id) return;
    openJob(d.job_id);
  });
}
function rejectForm(r) {
  var w = sheet("ไม่อนุมัติ — ยกเลิก JOB", "", '<div class="aq7-bar r"><b>JOB ' + esc(r.job_no) + " · ฿" + fm(r.total_real) + '</b><small>เมื่อยืนยัน ระบบจะยกเลิก JOB ผ่าน Flow ยกเลิกงานเดิม (ไม่ลบข้อมูล · เลข JOB / ประวัติคงอยู่)</small></div>' +
    '<div class="aq7-fm"><label>เหตุผลที่ไม่อนุมัติ <span class="aq7-req">*</span></label><div class="aq7-rc">' + RS7.map(function (t) { return '<button type="button" data-rk="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + '<button type="button" data-rk="">เหตุผลอื่น — กรอกเอง</button></div><textarea data-rs maxlength="500" placeholder="ระบุเหตุผล / รายละเอียดเพิ่มเติม"></textarea><div class="aq7-hint">บังคับกรอกทุกครั้ง · พนักงานจะเห็นเหตุผลนี้ในหน้าคอม</div></div>',
    '<button type="button" class="aq7-btn n" data-back>ย้อนกลับ</button><button type="button" class="aq7-btn d" data-go disabled>✕ ยืนยันไม่อนุมัติ</button>');
  var ta = w.querySelector("[data-rs]"), go = w.querySelector("[data-go]"), pk = "";
  var why = function () { var t = ta.value.trim(); return pk ? (t ? pk + " — " + t : pk) : t; };
  ta.addEventListener("input", function () { go.disabled = !why(); });
  w.addEventListener("click", async function (e) {
    var x = e.target.closest("button"); if (!x) return;
    if (x.hasAttribute("data-rk")) { pk = x.dataset.rk; w.querySelectorAll("[data-rk]").forEach(function (y) { y.classList.toggle("on", y === x); }); pk || ta.focus(); go.disabled = !why(); return; }
    if (x.hasAttribute("data-back")) { openJob(r.job_id); return; }
    if (!x.hasAttribute("data-go") || x.disabled) return;
    var rs = why(); if (!rs) { toast("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "err"); return; }
    x.disabled = !0;
    try { await rpc("njacc_adv701_reject", { p: { req_id: r.id, reason: rs } }); after(r.job_id, "❌ ไม่อนุมัติ — ยกเลิก JOB " + r.job_no + " แล้ว"); }
    catch (er) { toast(errMsg(er), "err"); x.disabled = !1; }
  });
}
function rnd() { var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (x) { return (x % 36).toString(36); }).join(""); }
function payForm(r, j, n) {
  var it = (r.items || [])[n - 1] || {}, file = null, dr = F725(r.id, n);   /* V.725 : มีสลิปแนบล่วงหน้า = ใช้ไฟล์นั้น */
  var w = sheet("แนบสลิป / ยืนยันจ่ายเงิน", "", '<div class="aq7-it"><div class="aq7-ih"><b>' + (r.item_count > 1 ? "รายการที่ " + n + " : " : "") + esc(it.payment_type || "-") + "</b><strong>฿" + fm(it.real_pay) + '</strong></div><div class="aq7-iv"><div>JOB : <b>' + esc(r.job_no) + "</b></div><div>ธนาคาร : <b>" + esc(it.bank_name || "-") +
    "</b></div><div>ชื่อบัญชี : <b>" + esc(it.account_name || "-") + '</b></div><div class="aq7-acc">เลขบัญชี : <span>' + esc(it.account_no || "-") + '</span><button type="button" class="aq7-cp" data-cpacc>' + IC.cp + "COPY</button></div></div></div>" +
    (dr ? '<div class="aq7-fm"><label>สลิปการโอนเงิน (แนบไว้ล่วงหน้า)</label><div class="aq7-hint">📎 ' + esc(dr.name) + ' — ต้องการเปลี่ยนสลิป ให้ลบสลิปเดิมแล้วแนบใหม่</div><input type="file" data-f hidden disabled><div class="aq7-prev" data-pv></div>'
      : '<div class="aq7-fm"><label>สลิปการโอนเงิน <span class="aq7-req">*</span></label><label class="aq7-file">📎 เลือกสลิปจากโทรศัพท์<small style="font-weight:400;color:#64748b">JPG / PNG / PDF ไม่เกิน 5 MB</small><input type="file" data-f accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"></label><div class="aq7-prev" data-pv></div>') +
    '<label>วันที่จ่ายเงิน <span class="aq7-req">*</span></label><input type="date" data-d value="' + today() + '" max="' + today() + '"><div class="aq7-hint">ตรวจสอบบัญชีและยอดเงินก่อนยืนยัน · ยืนยันแล้วแก้ไข / จ่ายซ้ำไม่ได้</div></div>',
    '<button type="button" class="aq7-btn n" data-back>ย้อนกลับ</button><button type="button" class="aq7-btn g" data-go disabled>✓ ยืนยันจ่ายเงินแล้ว</button>');
  var fi = w.querySelector("[data-f]"), pv = w.querySelector("[data-pv]"), go = w.querySelector("[data-go]"), dd = w.querySelector("[data-d]");
  var ok = function () { go.disabled = !((file || dr) && dd.value); };
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
  dd.addEventListener("change", ok); ok();   /* V.725 : มีสลิปแนบล่วงหน้า = พร้อมยืนยันเมื่อมีวันที่จ่าย */
  w.addEventListener("click", async function (e) {
    var x = e.target.closest("button"); if (!x) return;
    if (x.hasAttribute("data-cpacc")) { it.account_no ? copy(String(it.account_no).trim(), "คัดลอกเลขบัญชีแล้ว") : toast("ยังไม่มีเลขบัญชี", "err"); return; }
    if (x.hasAttribute("data-back")) { openJob(r.job_id); return; }
    if (!x.hasAttribute("data-go") || x.disabled || S.paying) return;
    if (!(file || dr) || !dd.value) return;
    if (dd.value > today()) { toast("วันที่จ่ายห้ามเป็นวันในอนาคต", "err"); return; }
    S.paying = !0; x.disabled = !0; x.textContent = dr ? "กำลังบันทึก…" : "กำลังอัปโหลดสลิป…";
    var ty = dr ? "" : String(file.type).toLowerCase(), ext = ty === "application/pdf" ? "pdf" : ty === "image/png" ? "png" : "jpg";
    var path = dr ? dr.path : r.job_id + "/" + r.id + "/" + n + "-" + rnd() + "." + ext;
    try {
      if (!dr) { var up = await SB().storage.from(BK).upload(path, file, { contentType: ty, upsert: !1, cacheControl: "3600" });
        if (up.error) throw up.error; }
      x.textContent = "กำลังบันทึก…";
      var pr = await rpc("njacc_adv705_pay", { p: { req_id: r.id, item_no: n, pay_date: dd.value, slip_path: path, slip_name: String(dr ? dr.name : file.name || "").slice(0, 150) } });   /* V.705 : จ่ายครบ = ปิดงาน DOCUMENT อัตโนมัติ */
      S.paying = !1;
      await after(r.job_id, "✅ จ่ายเงินแล้ว — แนบสลิปสำเร็จ · JOB " + r.job_no + (r.item_count > 1 ? " รายการที่ " + n : ""));
      pr && ac7(pr.auto_close);
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
    var el = document.querySelector('[data-nav="cash-advance"]'); if (!el || !c) return;
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
  root.innerHTML = '<div class="aq7"><div class="aq7-h"><div class="t"><b>CASH ADVANCE</b><small>อนุมัติ · จ่ายเงิน · INVOICE ADV · SUPER_ADMIN</small></div><button type="button" class="aq7-rf" data-rf aria-label="โหลดใหม่">' + IC.rf + "</button>" + (window.__NJ_MOBILE ? '<button type="button" class="aq7-rf" data-lo aria-label="ออกจากระบบ" title="ออกจากระบบ">' + IC.lo + "</button>" : "") + '</div><div class="aq7-c"></div><nav class="aq7-nav"></nav></div>';
  var me = S, tq = 0;
  root.addEventListener("click", function (e) {
    if (S !== me) return;
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-rf")) { load(!0); return; }
    if (b.hasAttribute("data-lo")) { b.disabled = !0; closeSheet(); import("./logout-OTS2ADOE.js").then(function (m) { m.doLogout(); }, function () { b.disabled = !1; }); return; }
    if (b.hasAttribute("data-exp")) { location.hash = "#/expenses"; return; }   /* V.723 */
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
/* ═══ V.726 · CASH ADVANCE มือถือ : AUTO SUMMARY (แสดงแบบมีโครงสร้าง · COPY = ข้อความ AUTO SUMMARY เดิม) · ข้อมูลคำขอ + เหตุผลไม่อนุมัติ (สถานะไม่อนุมัติ) ═══ */
var DS726 = { OPEN: "เปิดงาน — ยังไม่ปิดงาน", CLOSE: "ปิดงานแล้ว — ส่ง ACCOUNTING แล้ว", CANCELED: "ยกเลิกงานแล้ว" };
function sum726(g) {
  var t = g.sum714, r = g.req || {}, j = g.job || {}, its = r.items || [], net = its.reduce(function (a, x) { return a + (Number(x.real_pay) || 0); }, 0);
  var kv = function (ic, k, v) { return '<div class="s726-r"><i>' + ic + "</i><span>" + k + ":</span><b>" + esc(v || "-") + "</b></div>"; };
  var h = '<section class="s726"><div class="s726-h"><i>' + I724.coin + '</i><b>สรุปข้อมูลอัตโนมัติ (AUTO SUMMARY)</b><button type="button" class="s726-cp" data-cpsum714' + (t ? "" : " disabled") + ">" + IC.cp + "COPY</button></div>";
  if (!t) h += '<div class="aq7-warn" style="margin:8px">สร้างข้อความ AUTO SUMMARY ไม่สำเร็จ — กรุณาปิดแล้วเปิด JOB ใหม่</div>';
  h += '<div class="s726-b">' + kv(I724.bag, "JOB", r.job_no || j.job_no) + kv(I724.bld, "Company", j.company_invoice) + kv(I724.usr, "Customer", j.customer_name) + kv(I724.ship, "House B/L", j.house_bl_no);
  its.forEach(function (x, i) {
    h += '<div class="s726-hr"></div>' + (its.length > 1 ? '<div class="s726-n">รายการที่ ' + (i + 1) + " · " + fm(x.real_pay) + " บาท</div>" : "") +
      kv(I724.coin, "รายการ", x.payment_type) + kv(I724.bank, "ธนาคาร", x.bank_name) + kv(I724.one, "ชื่อบัญชี", x.account_name) + kv(I724.card, "เลขบัญชี", x.account_no);
  });
  return h + '<div class="s726-net"><i>✓</i><b>ยอดจ่ายสุทธิ</b><strong>' + fm(net) + " บาท</strong></div></div></section>";
}
function rej726(r, j) {
  var kv = function (ic, k, v) { return '<div class="r726-r"><i>' + ic + "</i><span>" + k + "</span><b>" + v + "</b></div>"; }, tot = Number(r.total_real) || 0;
  return '<section class="r726"><div class="r726-h"><i>' + I724.file + "</i><b>ข้อมูลคำขอ</b></div>" +
    kv(I724.tag, "JOB No.", esc(r.job_no || j.job_no || "-")) + kv(I724.bld, "Company", esc(j.company_invoice || "-")) + kv(I724.usr, "Customer", esc(j.customer_name || "-")) +
    kv(I724.ship, "House B/L", esc(j.house_bl_no || "-")) + kv(I724.one, "ผู้อนุมัติ", esc(r.rejected_by || "-")) + kv(I724.coin, "ยอดจ่ายจริง", tot > 0 ? fm(tot) + " บาท" : "-") +
    kv(I724.lay, "สถานะ DOCUMENT", esc(DS726[j.operational_status] || j.operational_status || "-")) + "</section>" +
    '<section class="r726-x"><div class="r726-xr"><i>!</i><span>เหตุผลไม่อนุมัติ</span><b>' + esc(r.reject_reason || "-") + "</b></div>" +
    '<div class="r726-xm"><div><span>วันที่ไม่อนุมัติ :</span><b>' + esc(d7(r.rejected_at)) + "</b></div><div><span>ผู้ดำเนินการ :</span><b>" + esc(r.rejected_by || "-") + "</b></div></div></section>";
}
function css726() {
  if (document.getElementById("aq726-css")) return;
  var s = document.createElement("style"); s.id = "aq726-css";
  s.textContent = [
    ".s726{border:1px solid #bfdbfe;border-radius:12px;background:#eff6ff;margin:0 0 10px;overflow:hidden}",
    ".s726-h{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 12px;background:linear-gradient(90deg,#dbeafe,#eff6ff);border-bottom:1px solid #bfdbfe}.s726-h>i{display:flex;color:#2563eb}",
    ".s726-h b{flex:1;min-width:0;color:#1e3a8a;font-size:14px;font-weight:800;overflow-wrap:anywhere}",
    ".s726-cp{flex:none;display:inline-flex;align-items:center;gap:5px;min-height:38px;padding:0 14px;border-radius:9px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-weight:800;font-size:13.5px;font-family:inherit;cursor:pointer}.s726-cp:disabled{opacity:.55}",
    ".s726-b{padding:6px 12px 10px;background:#fff}.s726-r{display:grid;grid-template-columns:20px 84px minmax(0,1fr);gap:6px;align-items:start;padding:3px 0;font-size:13px}",
    ".s726-r i{display:flex;color:#475569;padding-top:1px}.s726-r i svg{width:16px;height:16px}.s726-r span{color:#475569}.s726-r b{color:#0f172a;font-weight:800;overflow-wrap:anywhere;min-width:0}",
    ".s726-hr{border-top:1px solid #e2e8f0;margin:6px 0}.s726-n{font-weight:800;color:#1e3a8a;font-size:12.5px;margin:2px 0}",
    ".s726-net{display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;border-radius:10px;background:#dcfce7;color:#14532d}.s726-net i{width:22px;height:22px;border-radius:50%;background:#16a34a;color:#fff;font-style:normal;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".s726-net b{flex:1;font-size:14px}.s726-net strong{font-size:17px;color:#15803d;white-space:nowrap}",
    ".r726{border:1px solid #e9ddfb;border-radius:12px;background:#fff;overflow:hidden;margin:0 0 10px}",
    ".r726-h{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(90deg,#dbeafe,#eff6ff);border-bottom:1px solid #dbeafe}.r726-h b{color:#1e3a8a;font-size:16px;font-weight:800}",
    ".r726-h i{width:32px;height:32px;border-radius:9px;background:#3b82f6;color:#fff;display:inline-flex;align-items:center;justify-content:center}.r726-h i svg{width:17px;height:17px}",
    ".r726-r{display:grid;grid-template-columns:32px 112px minmax(0,1fr);gap:8px;align-items:center;padding:7px 12px;border-bottom:1px solid #efe7fd;font-size:13.5px}.r726-r:last-child{border-bottom:0}",
    ".r726-r i{width:32px;height:32px;border-radius:9px;background:#f1ebff;color:#6d28d9;display:flex;align-items:center;justify-content:center}.r726-r i svg{width:16px;height:16px}",
    ".r726-r span{color:#475569}.r726-r b{color:#1e1b4b;font-weight:800;overflow-wrap:anywhere;min-width:0}",
    ".r726-x{border:1px solid #fecdd3;background:#fff1f2;border-radius:12px;padding:10px 12px;margin:0 0 10px;color:#9f1239}",
    ".r726-xr{display:grid;grid-template-columns:26px auto minmax(0,1fr);gap:8px;align-items:start}.r726-xr i{width:24px;height:24px;border-radius:50%;border:2px solid #dc2626;color:#dc2626;font-style:normal;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px}",
    ".r726-xr span{color:#475569;padding:2px 8px 0 0;border-right:1px solid #fecdd3;white-space:nowrap}.r726-xr b{color:#be123c;font-weight:800;white-space:pre-wrap;overflow-wrap:anywhere;padding-top:2px}",
    ".r726-xm{display:grid;gap:2px;margin:8px 0 0 34px;font-size:12.5px}.r726-xm span{color:#64748b;margin-right:6px}.r726-xm b{color:#881337}",
    ".aq7-sc .ca24-ib .c1>div:nth-child(4),.aq7-sc .ca24-pm,.aq7-sc .ca24-pa{display:none}",
    ".aq7-sc .ca24-ib .c1>div{display:grid;grid-template-columns:18px max-content 8px minmax(0,1fr) auto;align-items:center;gap:6px}.aq7-sc .ca24-ib .c1>div>em{text-align:center}",
    ".aq7-sc .ca24-it .ca7-cp[data-cpacc]{display:inline-flex;align-items:center;gap:5px;flex:none;min-height:38px;padding:0 14px;margin-left:8px;border-radius:8px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-weight:800;font-size:13px;font-family:inherit;cursor:pointer}",
    ".aq7-sc .ca24-it .ca7-cp[data-cpacc] svg{stroke:#fff;color:#fff}",
    ".aq7-sc .ca24-ib .c2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.3fr);padding:8px 6px;align-items:stretch}",
    ".aq7-sc .ca24-ib .c2>div{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;padding:2px 4px;margin:0;min-width:0}.aq7-sc .ca24-ib .c2>div+div:not(.net){border-left:1px solid #e2e8f0}",
    ".aq7-sc .ca24-ib .c2 em{display:none}.aq7-sc .ca24-ib .c2 span{font-size:11.5px;color:#475569;overflow-wrap:anywhere}.aq7-sc .ca24-ib .c2 b{font-size:13.5px;text-align:center}",
    ".aq7-sc .ca24-ib .c2 .net{background:#e8f1fd;border-radius:10px;margin-left:4px;color:#1e3a8a}.aq7-sc .ca24-ib .c2 .net b{font-size:15.5px}",
    ".aq7-sc .ca24-ib .ca24-slip{margin:0 10px 10px;border:1px solid #e9d5ff;border-radius:10px}",
    ".aq7-sc .d716{background:#faf5ff;border-color:#e9d5ff}.aq7-sc .d716-h{color:#6d28d9}.aq7-sc .d716-b{background:#7c3aed;border-color:#7c3aed}.aq7-sc .d716-b.o{background:#fff;color:#6d28d9}",
    ".aq7-sc .d716-r .a button:not(.x){border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}"
  ].join("");
  document.head.appendChild(s);
}


/* ═══ V.714 · CASH ADVANCE มือถือ : AUTO SUMMARY (ข้อความจากฟังก์ชันเดิมของ Desktop · AD698 summary) + ปุ่ม COPY
   รายการจ่าย = njacc_adv698_get (ชุดเดียวกับ Desktop) · ไม่มี = รายการในคำขอ · COPY อ่านอย่างเดียว ไม่บันทึก / ไม่แก้ข้อมูล · COPY เฉพาะ JOB ที่เปิดอยู่ ═══ */
function sum714(g, d698, AD) {
  try {
    if (!AD || typeof AD.sumText714 !== "function") return null;
    var r = g.req || {}, j = g.job || {}, it = d698 && Array.isArray(d698.items) && d698.items.length ? d698.items : (r.items || []);
    return AD.sumText714({ job_no: r.job_no || j.job_no || "", company_invoice: j.company_invoice || "", customer_name: j.customer_name || "", house_bl_no: j.house_bl_no || "", data_type: j.data_type || "" }, it);
  } catch (e) { return null; }
}
function sumHTML714(g) {
  var t = g.sum714;
  return '<div class="aq7-sm"><div class="aq7-smh"><span>สรุปข้อมูลอัตโนมัติ (AUTO SUMMARY)</span><button type="button" class="aq7-cp" data-cpsum714' + (t ? "" : " disabled") + ">" + IC.cp + "COPY</button></div>" +
    (t ? '<pre class="aq7-smt">' + esc(t) + "</pre>" : '<div class="aq7-warn" style="margin:8px">สร้างข้อความ AUTO SUMMARY ไม่สำเร็จ — กรุณาปิดแล้วเปิด JOB ใหม่</div>') + "</div>";
}
function cp714(text) {
  if (!text) { toast("คัดลอกไม่สำเร็จ — ไม่มีข้อความ AUTO SUMMARY", "err"); return; }
  var ok = function () { toast("คัดลอกสำเร็จ", "ok"); };
  var fb = function (why) {
    var t = null, r = !1;
    try { t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0"; document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length); r = document.execCommand("copy"); } catch (e) { why = e && e.message || why; }
    try { t && t.remove(); } catch (e) {}
    r ? ok() : toast("คัดลอกไม่สำเร็จ — " + (why || "เบราว์เซอร์ไม่อนุญาตให้คัดลอก"), "err");
  };
  try { if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(ok, function (e) { fb(e && e.message); }); return; } } catch (e) {}
  fb("");
}
