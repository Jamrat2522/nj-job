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
    op: s('<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>', 14), x: s('<path d="M6 6l12 12M18 6 6 18"/>', 18),
    hist: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 15)/* V.915 */,
    cal919: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 15)/* V.919 */ };
})();
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dts(x) { if (!x) return ""; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(x)); if (m) return m[3] + "/" + m[2] + "/" + m[1]; var d = new Date(x); return isNaN(d) ? "" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear(); }
function dtm(x) { if (!x) return ""; var d = new Date(x); return isNaN(d) ? "" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + " น."; }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
var NONO = "ยังไม่มีเลขงาน";
/* ═══ V.915 · ขั้นตอน TIME LINE (ไม่มีขั้นตอนที่ 3 ตามที่กำหนด) · v = ค่าที่เก็บในฐานข้อมูล ═══ */
var TL915 = [
  { v: 0, s: "ยังไม่ดำเนินการ", t: "ยังไม่ได้เริ่มดำเนินการ", c: "#64748B", b: "#F1F5F9" },
  { v: 1, s: "ลงรับเอกสาร / กำหนด จนท.", t: "นำเอกสารไปลงรับที่ฝ่ายศุลกากร (ท่าเรือ/ด่าน) และหัวหน้ากำหนดชื่อเจ้าหน้าที่ศุลกากร (ด่าน/ท่าเรือ)", c: "#2563EB", b: "#E6EFFF" },
  { v: 2, s: "ตรวจเอกสาร / ออก Under From", t: "เจ้าหน้าที่ตรวจสอบเอกสารเพื่อพิมพ์บันทึกข้อความและออก Under From เพื่อชำระค่าปรับ และเซ็นเอกสารเสนอหัวหน้าฝ่ายเพื่ออนุมัติ (ท่าเรือ)", c: "#7C3AED", b: "#F1E9FF" },
  { v: 4, s: "เสนอเซ็นอนุมัติ", t: "นำเอกสารติดต่อหัวหน้าฝ่ายหรือท่าเพื่อเซ็นอนุมัติ", c: "#CA8A04", b: "#FEF6D8" },
  { v: 5, s: "ชำระค่าปรับ", t: "ติดต่อการเงินเพื่อชำระค่าปรับ (ด่าน)", c: "#EA580C", b: "#FFEDE0" },
  { v: 6, s: "ออกเลขคดี", t: "นำเอกสารไปติดต่อฝ่ายคดีเพื่อออกเลขคดี (ด่าน)", c: "#DB2777", b: "#FFE6F1" },
  { v: 7, s: "แก้ไขข้อมูลในระบบ", t: "นำเอกสารเพื่อให้เจ้าหน้าที่แก้ไขข้อมูลในระบบ (ท่าเรือ)", c: "#0891B2", b: "#E0F6FB" },
  { v: 8, s: "ตรวจสอบ / รับรองใบขนฯ", t: "ติดต่อเจ้าหน้าที่ให้ตรวจสอบในระบบของกรมศุลกากรว่าแก้ไขถูกต้องหรือไม่ และรับรองใบขนฯ (ด่าน)", c: "#16A34A", b: "#DFF6E7" }];
function TLo(v) { v = Number(v || 0); for (var i = 0; i < TL915.length; i++) if (TL915[i].v === v) return TL915[i]; return TL915[0]; }
function TLtip(x) { var o = TLo(x.tl_step); return o.s + " — " + o.t + (x.tl_at ? " · อัปเดต " + dtm(x.tl_at) + (x.tl_by ? " โดย " + x.tl_by : "") : ""); }
/* V.915 : ช่อง TIME LINE ของแต่ละแถว (Dropdown + แถบสรุปสี + ปุ่มดูประวัติ) */
/* V.918 : คอลัมน์ TIME LINE = แสดงผลอย่างเดียว (ข้อความ + สีของขั้นตอน บรรทัดเดียว) · เลือกขั้นตอนที่คอลัมน์จัดการ */
function TLcell(x) {
  var v = Number(x.tl_step || 0), o = TLo(v), tip = esc(TLtip(x));
  return '<div class="tl915-u" data-tlv="' + esc(x.id) + '" title="' + tip + '"><i class="tl915-d" style="background:' + o.c + '"></i>' +
    '<span style="color:' + o.c + '">' + esc(o.s) + "</span></div>";
}
/* V.918 : ปุ่มเลือกขั้นตอน (สีม่วง) + ปุ่มดูประวัติ — อยู่ในคอลัมน์จัดการ */
function TLbtn(x) {
  var v = Number(x.tl_step || 0);
  return '<button type="button" class="am7-ab tl918-b" data-tlm="' + esc(x.id) + '" data-tlv="' + v + '" title="เลือกขั้นตอน TIME LINE">TIME LINE ▾</button>' +
    '<button type="button" class="am7-ab tl918-h" data-tlh="' + esc(x.id) + '" title="ดูประวัติ TIME LINE">' + IC.hist + "</button>";
}
function stT(x) { return x.document_status === "POSTED" ? "POST แล้ว" : "รอ POST"; }
function stB(x) { return '<span class="am7-bd ' + (x.document_status === "POSTED" ? "g" : "o") + '">' + stT(x) + "</span>" + (x.returned ? ' <span class="am7-bd r" title="JOB ถูกย้อนกลับมาแก้ไข">ย้อนกลับ</span>' : ""); }
function who(x) { return x.created_by_nickname || x.created_by_name || ""; }
function errMsg(e) {
  var m = String(e && (e.message || e.code) || e || "");
  if (/NJACC_AMEND827_FORBIDDEN/.test(m)) return "Amend : ไม่มีสิทธิ์เข้าเมนูนี้";
  if (/njacc_amend915|NJACC_AMEND915/i.test(m)) return /BAD_STEP/.test(m) ? "ขั้นตอน TIME LINE ไม่ถูกต้อง"
    : /JOB_NOT_ALLOWED/.test(m) ? "ไม่มีสิทธิ์แก้ไข TIME LINE ของ JOB นี้"
    : "ระบบ TIME LINE ยังไม่พร้อม (ยังไม่ได้รัน RUN-915)";/* V.915 */
  if (/njacc_amend827|PGRST202|Could not find the function/i.test(m)) return "ระบบ Amend ยังไม่พร้อม (ยังไม่ได้รัน RUN-827)";
  if (/NJACC_NO_PROFILE/.test(m)) return "ไม่พบข้อมูลผู้ใช้ — กรุณาเข้าสู่ระบบใหม่";
  return m || "เกิดข้อผิดพลาด";
}
function css() {
  if (document.getElementById("am827-css")) return;
  var s = document.createElement("style"); s.id = "am827-css";
  s.textContent = [
    ".am7{padding:4px 0 20px;color:#0f172a;font-size:13px;max-width:100%;box-sizing:border-box}",
    /* \u2550\u2550\u2550 V.923 : Full Width \u0e40\u0e09\u0e1e\u0e32\u0e30\u0e2b\u0e19\u0e49\u0e32 Amend \u2014 \u0e0a\u0e48\u0e2d\u0e07\u0e27\u0e48\u0e32\u0e07\u0e0b\u0e49\u0e32\u0e22/\u0e02\u0e27\u0e32 10px \u2550\u2550\u2550 */
    "#app-content:has(>.am7){padding-left:10px!important;padding-right:10px!important}",/* V.919 : ลดพื้นที่ว่างบน-ล่าง */
    /* ═══ V.919 : แถบค้นหาแถวเดียว ═══ */
    ".am7-fc{padding:8px 10px!important;margin:0 0 8px!important}",
    ".am7-f{display:flex!important;flex-wrap:nowrap!important;align-items:flex-end!important;gap:8px!important;width:100%;overflow:visible}",
    ".am7-f>label,.am7-f>.dr919{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1 1 0}",
    ".am7-f>label>span,.am7-f .dr919-l,.am7-f>label{font-size:11.5px;font-weight:700;color:#334155}",
    ".am7-f .q919{flex:2 1 0}",
    ".am7-f .hid919{display:none!important}",
    ".am7-f input:not([type=date]),.am7-f select,.am7-f input[type=date],.am7-f .dr919-b{height:36px!important;min-height:36px!important;border-radius:8px!important;border:1px solid #CBD5E1;padding:0 10px;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box;background:#fff;min-width:0}",
    ".am7-f .bt{display:flex;gap:8px;flex:0 0 auto;width:auto!important;align-items:flex-end}",
    ".am7-f .bt .am7-b{height:36px!important;min-height:36px!important;border-radius:8px!important;border:1px solid transparent!important;color:#fff!important;font-weight:700;padding:0 12px;white-space:nowrap}",
    ".am7-f .bt .am7-b svg{color:#fff!important}",
    ".am7-f .bt .am7-b.p{background:#1D4ED8!important;border-color:#1D4ED8!important}",
    ".am7-f .bt .am7-b.o919{background:#EA580C!important;border-color:#EA580C!important}",
    ".am7-f .bt .am7-b.c919{background:#0891B2!important;border-color:#0891B2!important}",
    ".am7-f .bt .am7-b.g{background:#16A34A!important;border-color:#16A34A!important}",
    ".dr919{position:relative}",
    ".dr919-b{display:flex;align-items:center;gap:6px;cursor:pointer;color:#334155;text-align:left}",
    ".dr919-b i{font-style:normal;margin-left:auto;color:#64748b}.dr919.on .dr919-b{border-color:#1D4ED8;color:#1D4ED8;font-weight:700}",
    ".dr919-b span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".dr919-p{position:absolute;top:calc(100% + 4px);right:0;z-index:50;background:#fff;border:1px solid #CBD5E1;border-radius:10px;box-shadow:0 12px 28px rgba(15,23,42,.18);padding:10px;display:flex;flex-direction:column;gap:8px;min-width:230px}",
    ".dr919-p[hidden]{display:none}.dr919-p label{display:flex;flex-direction:column;gap:3px;font-size:11.5px;font-weight:700;color:#334155}",
    ".dr919-a{display:flex;gap:8px;justify-content:flex-end}.dr919-a .am7-b{height:32px;border-radius:8px}",
    "@media(max-width:1100px){.am7-f{flex-wrap:wrap!important}.am7-f>label,.am7-f>.dr919{flex:1 1 180px}}",
    /* V.915 : คอลัมน์ TIME LINE */
    /* V.918 : ปุ่มเลือกขั้นตอนในคอลัมน์จัดการ + เมนูขั้นตอน */
    ".tl918-b{background:#7C3AED!important;border-color:#7C3AED!important;color:#fff!important;font-weight:800}",
    ".tl918-b:hover:not(:disabled){filter:brightness(1.07)}.tl918-b:disabled{opacity:.6;cursor:wait}",
    ".tl918-h{padding:0 8px}",
    ".tl918-m{position:fixed;z-index:9999;background:#fff;border:1px solid #CBD5E1;border-radius:10px;box-shadow:0 12px 28px rgba(15,23,42,.22);padding:6px;display:flex;flex-direction:column;gap:2px;min-width:250px}",
    ".tl918-i{display:flex;align-items:center;gap:8px;border:0;background:none;font-family:inherit;font-size:13px;font-weight:700;padding:8px 10px;border-radius:8px;cursor:pointer;text-align:left;white-space:nowrap}",
    ".tl918-i:hover{background:#F1F5F9}.tl918-i.on{background:#EEF2FF;outline:1px solid #C7D2FE}",
    ".tl915{display:flex;flex-direction:column;gap:3px;min-width:210px}",
    ".tl915-r{display:flex;align-items:center;gap:5px}",
    ".tl915-s{height:32px;border-radius:7px;border:1px solid #CBD5E1;font-family:inherit;font-size:12.5px;font-weight:700;padding:0 6px;max-width:190px;flex:1;cursor:pointer}",
    ".tl915-s:disabled{opacity:.6;cursor:wait}",
    ".tl915-h{height:32px;width:32px;border-radius:7px;border:1px solid #CBD5E1;background:#fff;color:#475569;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".tl915-h:hover{background:#f1f5f9}",
    ".tl915-u{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;max-width:220px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
    ".tl915-d{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}",
    ".tl915-l{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}",
    ".tl915-l li{display:flex;align-items:center;gap:8px;border:1px solid #E2E8F0;border-radius:8px;padding:7px 10px;font-size:12.5px;flex-wrap:wrap}",
    ".tl915-fr{color:#64748b;font-size:11.5px}.tl915-at{margin-left:auto;color:#475569;font-weight:700;font-size:11.5px;white-space:nowrap}",
    ".tl915-lw{color:#64748b;font-size:13px;padding:6px 2px}",
    /* V.913 : แท็บ รอ POST / POST แล้ว — รูปแบบและชุดสีเดียวกับแท็บ DOCUMENT — SERVICE */
    "#am913-tabs.rep-tabs{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 12px}",
    "#am913-tabs .rep-tab[data-accq=\"wait\"]{--bg533:#FFF0CE;--b533:#F3D48B;--fg533:#985C00;--on533:#D97706}",
    "#am913-tabs .rep-tab[data-accq=\"posted\"]{--bg533:#DCF5E5;--b533:#A3DDB9;--fg533:#11783C;--on533:#15803D}",
    "#am913-tabs .rep-tab{height:46px;min-height:46px;box-sizing:border-box;padding:0 16px;border-radius:8px;border:1px solid var(--b533);background:var(--bg533);color:var(--fg533);opacity:1;font-size:14px;font-weight:700;line-height:1.2;white-space:nowrap;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:none;cursor:pointer}",
    "#am913-tabs .rep-tab::before{display:none}",
    "#am913-tabs .rep-tab.active{background:var(--on533);border-color:var(--on533);color:#fff;box-shadow:0 2px 6px rgba(15,23,42,.18)}",
    "#am913-tabs .rep-tab .cj-n{display:inline-block;margin-left:0;padding:2px 10px;border-radius:99px;background:#fff;border:1px solid var(--b533);color:var(--fg533);font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}",
    "#am913-tabs .rep-tab.active .cj-n{background:#fff;border-color:#fff;color:var(--on533)}",
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
    ".am7-t.h927-d tr>:nth-child(3),.am7-t.h927-d tr>:nth-child(5),.am7-t.h927-d tr>:nth-child(8),.am7-t.h927-p tr>:nth-child(3),.am7-t.h927-p tr>:nth-child(8){display:none}.am7-t.h927-d{min-width:1150px}.am7-t.h927-p{min-width:1290px}",   /* V.927 */
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
  return '<div class="am7">' +/* V.914 : ซ่อนหัวข้อ Amend / ไอคอน / ข้อความใต้หัวข้อ / Breadcrumb · ปุ่ม EXPORT EXCEL ย้ายไปแถวปุ่มค้นหา */
    '<div class="am7-fc"><form class="am7-f" data-f autocomplete="off">' +/* V.914 : ซ่อนหัวข้อค้นหา / ตัวกรองข้อมูล */
    /* ═══ V.919 : แถบค้นหาแถวเดียว — ค้นหาทั่วไป (รวม JOB No. / JOB NJ / INVOICE NJ / Customer Job No.) ═══ */
    '<label class="q919">ค้นหาทั่วไป<input name="q" maxlength="80" placeholder="JOB No. / JOB NJ / INVOICE NJ / Customer Job No." title="ค้นหาพร้อมกันทุกหัวข้อ : JOB No. · JOB NJ · INVOICE NJ · Customer Job No."></label>' +
    '<label class="sl">บริษัท<select name="company_id"><option value="">- ทุกบริษัท -</option></select></label><label class="sl">ลูกค้า<select name="customer_id"><option value="">- ทุกลูกค้า -</option></select></label>' +
    '<label class="st">TIME LINE<select name="tl"><option value="">ทุกขั้นตอน</option>' +
    TL915.map(function (q) { return '<option value="' + q.v + '">' + esc(q.s) + "</option>"; }).join("") + "</select></label>" +
    /* V.919 : ช่วงวันที่ — ตัวเลือกเดียว (เก็บช่อง date_from / date_to เดิมไว้ข้างใน จึงไม่เสียความสามารถเดิม) */
    '<div class="dr919"><span class="dr919-l">ช่วงวันที่</span>' +
    '<button type="button" class="dr919-b" data-dr919 title="เลือกช่วงวันที่เปิดงาน">' + IC.cal919 + '<span data-dr919-t>เลือกวันที่</span><i>▾</i></button>' +
    '<div class="dr919-p" data-dr919-p hidden><label>ตั้งแต่<input type="date" name="date_from"></label><label>ถึงวันที่<input type="date" name="date_to"></label>' +
    '<div class="dr919-a"><button type="button" class="am7-b" data-dr919-c>ล้างวันที่</button><button type="button" class="am7-b p" data-dr919-k>ตกลง</button></div></div></div>' +
    /* V.919 : Dropdown สถานะถูกซ่อน (ใช้แท็บ รอ POST / POST แล้ว แทน) — ยังอยู่ใน DOM เพื่อให้แท็บและตัวกรองเดิมทำงานเหมือนเดิม */
    '<label class="st hid919" hidden>สถานะ<select name="status"><option value="">ทั้งหมด</option><option value="DRAFT" selected>รอ POST</option><option value="POSTED">POST แล้ว</option></select></label>' +
    '<span class="bt"><button type="submit" class="am7-b p">' + IC.q + 'ค้นหา</button><button type="button" class="am7-b o919" data-clr>' + IC.clr + 'ล้าง</button>' +
    '<button type="button" class="am7-b c919" data-rf>' + IC.rf + "รีเฟรช</button>" +
    '<button type="button" class="am7-b g" data-xl>' + IC.xl + "EXPORT EXCEL</button>" +
    "</span></form></div>" +
    /* V.913 : แท็บแยกสถานะ รอ POST / POST แล้ว — รูปแบบปุ่มเดียวกับ DOCUMENT — SERVICE */
    '<div class="rep-tabs am913" id="am913-tabs" role="tablist">' +
    '<button type="button" class="rep-tab" data-accq="wait" data-tab913="DRAFT" role="tab">รอ POST<span class="cj-n" data-n913="DRAFT">…</span></button>' +
    '<button type="button" class="rep-tab" data-accq="posted" data-tab913="POSTED" role="tab">POST แล้ว<span class="cj-n" data-n913="POSTED">…</span></button>' +
    '</div>' +
    '<div data-body></div></div>';
}
var H = ["#", "วันที่เปิดงาน", "JOB No.", "JOB NJ", "INVOICE NJ"/* V.911 */, "บริษัท", "ลูกค้า", "ประเภทงาน", "Customer Job No.", "Master B/L", "House B/L", "ผู้เปิดงาน", "สถานะ", "TIME LINE"/* V.915 */, "จัดการ"];
/* V.927 : คอลัมน์ที่ซ่อนตามแท็บ — รอ POST (DRAFT) : JOB No. / INVOICE NJ / ประเภทงาน · POST แล้ว (POSTED) : JOB No. / ประเภทงาน · ข้อมูล / RPC / ค้นหา เดิมทุกอย่าง */
function HD927() { var st = String(((S || {}).f || {}).status || ""); return st === "DRAFT" ? [2, 4, 7] : st === "POSTED" ? [2, 7] : []; }
function noTd(v) { return v ? '<td class="nw"><b>' + esc(v) + "</b></td>" : '<td><span class="am7-no">' + NONO + "</span></td>"; }
function canDoc() { return !!(S && S.canDoc) && MI705("document/service"); }
function rowHTML(x, i) {
  return '<tr data-i="' + i + '" data-id="' + esc(x.id) + '" tabindex="0"><td class="c">' + (S.off + i + 1) + '</td><td class="nw c">' + esc(dts(x.date)) + "</td>" + noTd(x.job_no) + noTd(x.job_nj) +
    '<td class="nw">' + esc(x.inv_nj || "") + "</td>" +/* V.911 : INVOICE NJ จาก ACCOUNTING — SERVICE (ยังไม่ออกเลข = ช่องว่าง) */
    '<td class="e1" title="' + esc(x.company || "") + '">' + esc(x.company || "-") + '</td><td class="e1" title="' + esc(x.customer || "") + '">' + esc(x.customer || "-") + '</td><td class="nw">' + esc(x.job_category || "") + "</td>" +
    '<td class="el">' + esc(x.customer_job_no || "-") + '</td><td class="el">' + esc(x.master_bl_no || "-") + '</td><td class="el">' + esc(x.house_bl_no || "-") + "</td>" +
    '<td class="nw" title="' + esc(x.created_by_name || "") + '">' + esc(who(x) || "-") + '</td><td class="c nw">' + stB(x) + "</td>" +
    '<td class="tl915-td">' + TLcell(x) + "</td>"/* V.915 */ +
    '<td><div class="am7-act"><button type="button" class="am7-ab" data-a="v">' + IC.eye + "ดู</button>" + (canDoc() ? '<button type="button" class="am7-ab o" data-a="o" title="เปิดใน DOCUMENT → SERVICE">' + IC.op + "เปิดงาน</button>" : "") + TLbtn(x)/* V.918 */ + "</div></td></tr>";
}
function bodyHTML() {
  var W = [44, 100, 110, 124, 140/* V.911 */, 180, 180, 100, 120, 120, 150, 110, 104, 200/* V.918 */, 250];
  var n = Math.max(1, Math.ceil((S.total || 0) / S.lim)), c = Math.floor(S.off / S.lim) + 1, from = S.total ? S.off + 1 : 0, to = S.off + S.rows.length, pg = [], k;
  for (k = 1; k <= n; k++) if (k === 1 || k === n || Math.abs(k - c) <= 2) pg.push(k); else if (pg[pg.length - 1] !== "…") pg.push("…");
  return (S.err ? '<div class="am7-err">' + esc(S.err) + "</div>" : "") +
    '<div class="am7-sm">JOB Amendment ที่ยังไม่ CLOSE ทั้งหมด <b data-tot>' + (S.total || 0) + "</b> JOB" + (S.at ? "<small>· อัปเดต " + esc(dtm(S.at)) + "</small>" : "") + "</div>" +
    '<div class="am7-tw"><table class="am7-t' + (HD927().length === 3 ? " h927-d" : HD927().length === 2 ? " h927-p" : "") + '"><thead><tr>' + H.map(function (h, j) { return "<th" + (W[j] ? ' style="width:' + W[j] + 'px"' : "") + ">" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
    (S.rows.map(rowHTML).join("") || '<tr><td colspan="15" class="am7-em">'/* V.915 */ + (S.loading ? "กำลังโหลด…" : "ไม่มีรายการ") + "</td></tr>") + "</tbody></table></div>" +
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
/* V.913 : แท็บที่เลือกยึดตามตัวกรองสถานะจริง (DRAFT = รอ POST · POSTED = POST แล้ว) · จำนวน JOB นับจากฐานข้อมูล */
/* ═══ V.919 · ช่วงวันที่ : ปุ่มเดียวเปิดแผงเลือก "ตั้งแต่ / ถึงวันที่" (ใช้ช่องวันที่เดิม) ═══ */
function DR919(root) {
  if (!root) return;
  var w = root.querySelector(".dr919"); if (!w) return;
  var f = w.querySelector('[name="date_from"]'), t = w.querySelector('[name="date_to"]'), tx = w.querySelector("[data-dr919-t]");
  if (!tx) return;
  var a = f && f.value ? dts(f.value) : "", b = t && t.value ? dts(t.value) : "";
  tx.textContent = a || b ? (a || "…") + " – " + (b || "…") : "เลือกวันที่";
  w.classList.toggle("on", !!(a || b));
}
function DRtoggle(root, open) {
  var p = root && root.querySelector("[data-dr919-p]"); if (!p) return;
  p.hidden = open === undefined ? !p.hidden : !open;
}
function TB913() {
  if (!S || !S.root || !S.root.isConnected) return;
  var st = String((S.f || {}).status || ""), c = S.cnt913 || null;
  Array.prototype.forEach.call(S.root.querySelectorAll("[data-tab913]"), function (b) {
    var k = b.getAttribute("data-tab913"), on = st === k;
    b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false");
    var n = b.querySelector("[data-n913]"); if (!n) return;
    var v = c ? c[k] : null;
    n.textContent = v == null ? "…" : Number(v).toLocaleString("th-TH");
  });
}
function paint() {
  if (!S || !S.root.isConnected || (S.el && !S.el.isConnected)) return;
  var b = S.root.querySelector("[data-body]"), sc = S.root.querySelector(".am7-tw"), y = sc ? sc.scrollLeft : 0;
  b.innerHTML = bodyHTML(); var t = S.root.querySelector(".am7-tw"); t && (t.scrollLeft = y);
  S.opts && (optFill("company_id", S.opts.companies, "- ทุกบริษัท -"), optFill("customer_id", S.opts.customers, "- ทุกลูกค้า -"));
  TB913();/* V.913 */
  DR919(S.root);/* V.919 */
}
var FK = ["date_from", "date_to", "q"/* V.919 : ค้นหาทั่วไป */, "company_id", "customer_id", "status", "tl"/* V.915 */];
function params(extra) { var o = { with_options: true }; FK.forEach(function (k) { S.f[k] && (o[k] = S.f[k]); }); return Object.assign(o, extra || {}); }
/* V.913 : นับ JOB ของอีกแท็บหนึ่งจากฐานข้อมูล (size 1 · ไม่ดึงตัวเลือก Dropdown) แล้วหักลบกับยอดของแท็บปัจจุบัน */
async function CT913(S0, my) {
  try {
    var st = String((S.f || {}).status || ""), p = params({ page: 1, size: 1, with_options: false });
    if (st) { delete p.status; } else { p.status = "DRAFT"; }
    var r2 = await RPC("njacc_amend827_list", { p: p });
    if (S !== S0 || my !== S.seq) return;
    var n2 = (r2 && r2.total) || 0, cur = S.total || 0;
    S.cnt913 = st === "DRAFT" ? { DRAFT: cur, POSTED: Math.max(0, n2 - cur) }
      : st === "POSTED" ? { POSTED: cur, DRAFT: Math.max(0, n2 - cur) }
      : { DRAFT: n2, POSTED: Math.max(0, cur - n2) };
    TB913();
  } catch (e913) {}
}
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
  S.loading = !1; paint(); CT913(S0, my);/* V.913 */
  var ov = document.querySelector("[data-am7dt]"); if (ov && ov.__id && !S.rows.some(function (x) { return x.id === ov.__id; }) && silent) closeDetail();   /* JOB ที่ CLOSE แล้ว = ปิดหน้าต่างรายละเอียด */
}
/* ═══ V.915 · บันทึกขั้นตอน TIME LINE ทันทีที่เลือก (ไม่เปลี่ยนสถานะจริงของ JOB) ═══ */
/* V.918 : เลือกขั้นตอนจากปุ่ม TIME LINE ในคอลัมน์จัดการ → บันทึกอัตโนมัติด้วยระบบเดิม (njacc_amend915_set)
   บันทึกสำเร็จ = อัปเดตข้อความ + สีในคอลัมน์ TIME LINE ทันที · ไม่สำเร็จ = แจ้งเตือนและคงค่าเดิม */
async function TLset(id, v, btn) {
  var row = null, i; for (i = 0; i < S.rows.length; i++) if (S.rows[i].id === id) row = S.rows[i];
  var prev = Number((row && row.tl_step) || 0); v = Number(v || 0);
  if (v === prev) return;
  btn && (btn.disabled = !0);
  try {
    var r = await RPC("njacc_amend915_set", { p: { job_id: id, step: v } });
    if (row) { row.tl_step = v; row.tl_at = (r && r.at) || null; row.tl_by = (r && r.by) || null; }
    S.sig = ""; TLskin(id, row, v);
    toast("บันทึก TIME LINE แล้ว — " + TLo(v).s, "ok");
  } catch (e) {
    toast("บันทึก TIME LINE ไม่สำเร็จ — " + errMsg(e), "err");
  }
  btn && (btn.disabled = !1);
}
function TLskin(id, row, v) {
  if (!S || !S.root) return;
  var o = TLo(v), tip = row ? TLtip(row) : o.s + " — " + o.t;
  var u = S.root.querySelector('[data-tlv="' + id + '"].tl915-u');
  if (u) { var d = u.querySelector(".tl915-d"), sp = u.querySelector("span");
    d && (d.style.background = o.c); sp && (sp.style.color = o.c, sp.textContent = o.s); u.title = tip; }
  var b = S.root.querySelector('[data-tlm="' + id + '"]'); b && b.setAttribute("data-tlv", String(o.v));
}
/* V.918 : เมนูเลือกขั้นตอน (ตัวเลือกเดิมทั้ง 8 รายการ ไม่เปลี่ยนแปลง) */
function TLmenu(btn) {
  closeTLM();
  var id = btn.getAttribute("data-tlm"), cur = Number(btn.getAttribute("data-tlv") || 0);
  var m = document.createElement("div"); m.className = "tl918-m"; m.setAttribute("data-tl918m", "");
  m.innerHTML = TL915.map(function (q) {
    return '<button type="button" class="tl918-i' + (q.v === cur ? " on" : "") + '" data-tlo="' + q.v + '" title="' + esc(q.t) + '">' +
      '<i class="tl915-d" style="background:' + q.c + '"></i><span style="color:' + q.c + '">' + esc(q.s) + "</span></button>";
  }).join("");
  document.body.appendChild(m);
  var r = btn.getBoundingClientRect();
  m.style.top = Math.min(window.innerHeight - 24 - m.offsetHeight, r.bottom + 4) + "px";
  m.style.left = Math.max(8, Math.min(window.innerWidth - 8 - m.offsetWidth, r.left)) + "px";
  m.addEventListener("click", function (e) {
    var it = e.target.closest("[data-tlo]"); if (!it) return;
    closeTLM(); TLset(id, Number(it.getAttribute("data-tlo")), btn);
  });
  var away = function (e) { if (!e.target.closest || !e.target.closest("[data-tl918m]")) closeTLM(); };
  var key = function (e) { e.key === "Escape" && closeTLM(); };
  m.__away = away; m.__key = key;
  setTimeout(function () { document.addEventListener("click", away, !0); document.addEventListener("keydown", key); }, 0);
}
function closeTLM() {
  document.querySelectorAll("[data-tl918m]").forEach(function (m) {
    m.__away && document.removeEventListener("click", m.__away, !0);
    m.__key && document.removeEventListener("keydown", m.__key); m.remove();
  });
}
/* V.915 : ประวัติการเปลี่ยนขั้นตอนย้อนหลัง (อ่านอย่างเดียว) */
function closeTLH() { document.querySelectorAll("[data-am7tlh]").forEach(function (o) { o.__key && document.removeEventListener("keydown", o.__key); o.remove(); }); }
async function TLhist(id) {
  var x = null, i; for (i = 0; i < S.rows.length; i++) if (S.rows[i].id === id) x = S.rows[i];
  closeTLH();
  var o = document.createElement("div"); o.className = "am7-ov"; o.setAttribute("data-am7tlh", "");
  o.innerHTML = '<div class="am7-md" role="dialog" aria-modal="true" aria-label="ประวัติ TIME LINE"><div class="am7-mh"><b>ประวัติ TIME LINE · ' +
    esc((x && (x.job_nj || x.job_no)) || "") + '</b><button type="button" class="am7-mx" data-x>' + IC.x + "</button></div>" +
    '<div class="am7-mb"><div class="tl915-lw">กำลังโหลด…</div></div>' +
    '<div class="am7-mf"><button type="button" class="am7-b" data-x>ปิด</button></div></div>';
  document.body.appendChild(o);
  var key = function (e) { e.key === "Escape" && closeTLH(); }; o.__key = key; document.addEventListener("keydown", key);
  o.addEventListener("click", function (e) { (e.target === o || e.target.closest("[data-x]")) && closeTLH(); });
  try {
    var r = await RPC("njacc_amend915_hist", { p: { job_id: id, limit: 100 } }), rs = (r && r.rows) || [];
    var h = rs.length ? '<ol class="tl915-l">' + rs.map(function (q) {
      var a = TLo(q.step_to), b = TLo(q.step_from);
      return '<li><i class="tl915-d" style="background:' + a.c + '"></i><b style="color:' + a.c + '">' + esc(a.s) + "</b>" +
        '<span class="tl915-fr">(จาก ' + esc(b.s) + ")</span>" +
        '<span class="tl915-at">' + esc(dtm(q.at)) + (q.by ? " · " + esc(q.by) : "") + "</span></li>"; }).join("") + "</ol>"
      : '<div class="tl915-lw">ยังไม่มีประวัติการเปลี่ยนขั้นตอน</div>';
    var bd = o.querySelector(".am7-mb"); bd && (bd.innerHTML = h);
  } catch (e) { var bd2 = o.querySelector(".am7-mb"); bd2 && (bd2.innerHTML = '<div class="tl915-lw">' + esc(errMsg(e)) + "</div>"); }
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
    var wb = new EX.Workbook(), ws = wb.addWorksheet("AMEND", { views: [{ state: "frozen", ySplit: 1 }] }), HX = H.slice(0, 14).concat(["อัปเดต TIME LINE", "ผู้แก้ไข TIME LINE"]);/* V.915 */
    var hd927 = HD927(), KP = HX.map(function (_, j) { return j; }).filter(function (j) { return hd927.indexOf(j) < 0; });   /* V.927 : คอลัมน์ที่ส่งออก = คอลัมน์ที่แสดง */
    ws.columns = [7, 14, 18, 18, 22/* V.911 */, 38, 38, 14, 22, 24, 28, 24, 14, 28, 20, 20/* V.915 */].filter(function (_, j) { return KP.indexOf(j) >= 0; }).map(function (w) { return { width: w }; });
    var TH = { style: "thin", color: { argb: "FF94A3B8" } }, BD = { top: TH, left: TH, bottom: TH, right: TH };
    var put = function (rn, vals, hd) { var row = ws.getRow(rn); for (var k9 = 0; k9 < KP.length; k9++) { var c = KP[k9], cell = row.getCell(k9 + 1), v = vals[c]; cell.value = v == null || v === "" ? null : v; cell.border = BD;   /* ช่องว่าง (เช่น ยังไม่มีเลขงาน) = เซลล์ว่างจริง */
        cell.alignment = { vertical: "middle", wrapText: !0, horizontal: hd || c === 0 || c === 1 || c === 12 || c === 14/* V.915 */ ? "center" : "left" };
        if (hd) { cell.font = { bold: !0, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; } } row.commit && row.commit(); };
    put(1, HX, !0);
    all.forEach(function (x, i) { put(i + 2, [i + 1, dts(x.date), x.job_no || "", x.job_nj || "", x.inv_nj || ""/* V.911 */, x.company || "", x.customer || "", x.job_category || "", x.customer_job_no || "", x.master_bl_no || "", x.house_bl_no || "", x.created_by_name || "", stT(x), TLo(x.tl_step).s/* V.915 */, x.tl_at ? dtm(x.tl_at) : "", x.tl_by || ""]); });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, all.length + 1), column: KP.length } };
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
  S = { root: root, f: { status: "DRAFT" }/* V.913 */, cnt913: null, lim: 20, off: 0, rows: [], total: 0, opts: null, seq: 0, loading: !1, err: "", sig: "", canDoc: !1, at: null, timer: 0 };
  root.innerHTML = shell();
  var me = S, fo = root.querySelector("[data-f]"); me.el = root.firstElementChild;
  var readF = function () { var f = {}; FK.forEach(function (k) { var el = fo.elements[k]; f[k] = el ? String(el.value || "").trim() : ""; }); return f; };
  var same = function (a, b) { return FK.every(function (k) { return String(a[k] || "") === String(b[k] || ""); }); };
  var apply = function () { if (OFF(me)) return; var f = readF(); if (same(f, S.f)) return; S.f = f; S.off = 0; load(); };
  fo.addEventListener("submit", function (e) { e.preventDefault(); if (OFF(me)) return; S.f = readF(); S.off = 0; load(); });
  var tm = 0; fo.addEventListener("input", function (e) { if (OFF(me) || !e.target.name || e.isComposing || e.target.tagName === "SELECT") return; clearTimeout(tm); tm = setTimeout(apply, e.target.type === "date" ? 0 : 350); });
  fo.addEventListener("change", function (e) { if (OFF(me) || !e.target.name) return; clearTimeout(tm); apply(); });
  root.addEventListener("change", function (e) { if (OFF(me)) return;
    if (e.target.matches('[name="date_from"],[name="date_to"]')) DR919(S.root);/* V.919 */
    if (e.target.matches("[data-lim]")) { S.lim = Number(e.target.value) || 20; S.off = 0; load(); } });
  document.addEventListener("click", function h919(e) {   /* V.919 : คลิกนอกแผงวันที่ = ปิดแผง */
    if (OFF(me)) { document.removeEventListener("click", h919); return; }
    if (!e.target.closest || !e.target.closest(".dr919")) DRtoggle(S.root, !1);
  });
  root.addEventListener("keydown", function (e) { if (OFF(me)) return; var tr = e.target.closest && e.target.closest("tr[data-i]"); if (tr && e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); detail(S.rows[Number(tr.dataset.i)]); } });
  root.addEventListener("click", function (e) {
    if (OFF(me)) return;
    if (e.target.closest("[data-tl918m]")) return;/* V.918 : คลิกในเมนูขั้นตอน ไม่เปิดหน้าต่างรายละเอียด */
    var b = e.target.closest("button");
    if (!b) { var tr = e.target.closest("tr[data-i]"); if (tr && root.contains(tr) && !(window.getSelection && String(window.getSelection()).trim())) detail(S.rows[Number(tr.dataset.i)]); return; }
    if (b.hasAttribute("data-tlm")) { TLmenu(b); return; }/* V.918 : เปิดเมนูเลือกขั้นตอน */
    if (b.hasAttribute("data-tlh")) { TLhist(b.getAttribute("data-tlh")); return; }/* V.915 */
    if (b.hasAttribute("data-dr919")) { DRtoggle(S.root); return; }/* V.919 */
    if (b.hasAttribute("data-dr919-k")) { DRtoggle(S.root, !1); return; }/* V.919 */
    if (b.hasAttribute("data-dr919-c")) {   /* V.919 : ล้างเฉพาะช่วงวันที่ */
      ["date_from", "date_to"].forEach(function (k) { fo.elements[k] && (fo.elements[k].value = ""); });
      S.f = readF(); S.off = 0; DR919(S.root); DRtoggle(S.root, !1); load(); return;
    }
    if (b.hasAttribute("data-tab913")) {   /* V.913 : สลับแท็บ = ล้างตัวกรองอื่น + โหลดข้อมูลทันที (ไม่เปลี่ยนสถานะจริงของ JOB) */
      var k913 = b.getAttribute("data-tab913") === "POSTED" ? "POSTED" : "DRAFT";
      if (k913 === String((S.f || {}).status || "")) return;
      FK.forEach(function (k) { k !== "status" && fo.elements[k] && (fo.elements[k].value = ""); });
      fo.elements.status && (fo.elements.status.value = k913);
      S.f = readF(); S.off = 0; S.cnt913 = null; TB913(); load(); return;
    }
    if (b.hasAttribute("data-clr")) { FK.forEach(function (k) { k !== "status"/* V.913 : คงแท็บที่เลือกไว้ */ && fo.elements[k] && (fo.elements[k].value = ""); }); S.f = readF(); S.off = 0; load(); return; }
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
