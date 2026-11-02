import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";
/* ═══ V.717 · DOCUMENT / ACCOUNTING → SERVICE : หัวข้อ 5. นอกราคาขาย (Component เดียว ใช้ร่วมทุกหน้าต่าง · ข้อมูลชุดเดียวต่อ JOB)
   ตาราง : # · รายละเอียด * · ยอดจ่าย (บาท) * · เก็บลูกค้าได้ (บาท) · ไฟล์แนบ (ชื่อ + ขนาด + X ลบเฉพาะไฟล์ · แนบหลายไฟล์) · จัดการ (ดูไฟล์ / โหลดไฟล์ / ลบ เท่านั้น)
   บันทึก : พร้อมปุ่ม SAVE เดิม (หลังบันทึกงานสำเร็จ = มี JOB ID) → njacc_xp717_save + อัปโหลดไฟล์ที่รอ → njacc_xp717_add_file (RUN-717)
   ลบรายการ / X ลบไฟล์ = Soft Delete (ซ่อน · เก็บประวัติ Audit) · สิทธิ์แก้ไข / ดู ตรวจที่ฐานข้อมูล · Storage private njacc-job-xp (Signed URL 2 นาที)
   ไม่รวมยอดกับ INVOICE · ไม่แตะ POST / UNPOST / CLOSE / PDF / เลขรัน ═══ */
var BK = "njacc-job-xp", MAX = 10485760;
var EXT = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
var ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png," + EXT.docx + "," + EXT.xlsx;
var IC = {
  eye: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  dl: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  del: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  clip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.4 11-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#d97706" stroke="#92400e" stroke-width="1.4" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9" fill="none"/></svg>'
};
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function kb(n) { n = Number(n) || 0; return n >= 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
function uid(v) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || "")); }
function uuid() {
  try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  var a = new Uint8Array(16); crypto.getRandomValues(a); a[6] = a[6] & 15 | 64; a[8] = a[8] & 63 | 128;
  var h = Array.prototype.map.call(a, function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
}
function extOf(n) { var m = /\.([A-Za-z0-9]+)$/.exec(String(n || "")); return m ? m[1].toLowerCase() : ""; }
function num(v) { var s = String(v == null ? "" : v).replace(/,/g, "").trim(); if (!s) return null; if (!/^\d{1,10}(\.\d{0,2})?$/.test(s)) return NaN; return Number(s); }
function amt(v) { var n = num(v); return n == null ? "" : isNaN(n) ? String(v) : n.toFixed(2); }
function errMsg(e) {
  var m = String(e && (e.message || e.error || e.code) || e || "");
  if (/NJACC_XP717_(DESC_REQUIRED|PAY_REQUIRED|COLLECT_INVALID|ITEM_NOT_FOUND|READONLY)/.test(m)) return m.replace(/^.*?NJACC_XP717_[A-Z_]+:\s*/, "");
  if (/XP717_FILE_TOO_BIG|exceeded the maximum|Payload too large|413/i.test(m)) return "ไฟล์ใหญ่เกิน 10 MB";
  if (/XP717_FILE_TYPE|mime type|not supported/i.test(m)) return "รองรับเฉพาะ PDF, JPG, PNG, DOCX, XLSX";
  if (/XP717_TOO_MANY_FILES/.test(m)) return "แนบได้สูงสุด 20 ไฟล์ต่อรายการ";
  if (/XP717_FILE_/.test(m)) return "อัปโหลดไฟล์ไม่สำเร็จ — กรุณาลองใหม่";
  if (/NJACC_FORBIDDEN|row-level security|Unauthorized|403/i.test(m)) return "ไม่มีสิทธิ์นอกราคาขายของ JOB นี้";
  if (/njacc_xp717_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "ระบบนอกราคาขายยังไม่พร้อม (ยังไม่ได้รัน RUN-717)";
  return m || "ทำรายการไม่สำเร็จ";
}
function css() {
  if (document.getElementById("xp717-css")) return;
  var s = document.createElement("style"); s.id = "xp717-css";
  s.textContent = [
    ".xp717{--xb:#2563eb;--xd:#1e3a8a;border:1px solid #bfdbfe;background:#f5f9ff;border-radius:12px;margin:0 0 12px;padding:10px 12px 12px;font-size:13px;color:#0f172a;min-width:0}",
    ".xp717-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 8px}",
    ".xp717-n{flex:none;width:28px;height:28px;border-radius:50%;background:var(--xb);color:#fff;font-weight:800;font-size:14px;display:inline-flex;align-items:center;justify-content:center}",
    ".xp717-t{font-weight:800;font-size:16px;color:var(--xd)}",
    ".xp717-sum{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:700;color:#1e3a8a;font-size:13.5px;min-width:0;text-align:center}",
    ".xp717-add{flex:none;display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 14px;border-radius:9px;border:1.5px solid #16a34a;background:#fff;color:#15803d;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}",
    ".xp717-add:hover{background:#f0fdf4}.xp717-add:disabled{opacity:.5;cursor:not-allowed}",
    ".xp717-tw{border:1px solid #dbe4f0;border-radius:10px;background:#fff;overflow:auto}",
    ".xp717-tb{width:100%;border-collapse:collapse;font-size:13px}.xp717-tb th{background:#eef4ff;color:#1e3a8a;font-weight:700;text-align:center;padding:7px 6px;white-space:nowrap}",
    ".xp717-tb td{padding:6px;border-top:1px solid #eef2f7;vertical-align:middle}.xp717-tb td.c{text-align:center;font-weight:700;width:34px}.xp717-tb .req{color:#dc2626}",
    ".xp717-tb input.xp717-i{width:100%;height:32px;border:1px solid #cbd5e1;border-radius:7px;padding:0 9px;font-size:13px;font-family:inherit;background:#fff;color:#0f172a}",
    ".xp717-tb input.r{text-align:right;font-variant-numeric:tabular-nums}.xp717-tb input.bad{border-color:#dc2626;background:#fef2f2}",
    ".xp717-tb .ro{display:block;padding:0 4px}.xp717-tb .ro.r{text-align:right;font-variant-numeric:tabular-nums}",
    ".xp717-fs{display:flex;flex-direction:column;gap:4px;min-width:200px}",
    ".xp717-f{display:flex;align-items:center;gap:5px;border:1px solid #c7d2fe;background:#f5f7ff;border-radius:8px;padding:3px 6px 3px 8px;font-size:12.5px;min-width:0}",
    ".xp717-f .nm{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#3730a3;font-weight:600}.xp717-f small{flex:none;color:#64748b}",
    ".xp717-f.p{border-style:dashed;background:#fffbeb;border-color:#fcd34d}.xp717-f.p .nm{color:#92400e}",
    ".xp717-x{flex:none;width:22px;height:22px;border:0;background:none;color:#475569;font-size:16px;line-height:1;cursor:pointer;border-radius:5px}.xp717-x:hover{background:#fee2e2;color:#dc2626}",
    ".xp717-at{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 9px;border-radius:7px;border:1px dashed #94a3b8;background:#fff;color:#334155;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer}",
    ".xp717-at:hover{border-color:#2563eb;color:#1d4ed8}",
    ".xp717-ac{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap}",
    ".xp717-b{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 10px;border-radius:7px;border:1.5px solid;font-weight:700;font-size:12.5px;font-family:inherit;cursor:pointer;white-space:nowrap;background:#fff}",
    ".xp717-b.v{border-color:#3b82f6;color:#1d4ed8;background:#eff6ff}.xp717-b.d{border-color:#22c55e;color:#15803d;background:#f0fdf4}.xp717-b.x{border-color:#dc2626;color:#fff;background:#dc2626}",
    ".xp717-b:disabled{opacity:.4;cursor:not-allowed}",
    ".xp717-tb tfoot td{background:#dbeafe;font-weight:800;color:#1e3a8a;border-top:1px solid #bfdbfe}.xp717-tb tfoot td.r{text-align:right;font-variant-numeric:tabular-nums;padding-right:12px}",
    ".xp717-em{text-align:center;color:#475569;padding:14px 8px;font-weight:600}",
    ".xp717-msg{padding:8px 10px;color:#64748b}.xp717-msg.err{color:#b91c1c}.xp717-ro[hidden]{display:none}.xp717-ro{display:inline-flex;height:22px;padding:0 8px;border-radius:999px;background:#e2e8f0;color:#334155;font-size:11.5px;font-weight:700;align-items:center}",
    ".xp717-pend{font-size:11.5px;color:#92400e;margin-top:6px}",
    ".xp717-ov{position:fixed;inset:0;z-index:10080;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:14px}",
    ".xp717-dlg{background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(15,23,42,.35);width:min(440px,100%);padding:18px 18px 14px;font-size:14px;color:#0f172a}",
    ".xp717-dlg b{display:block;font-size:16px;margin:0 0 8px}.xp717-dlg .a{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}",
    ".xp717-dlg .a button{height:36px;padding:0 16px;border-radius:9px;border:0;font-weight:700;font-family:inherit;cursor:pointer}.xp717-dlg .n{background:#e2e8f0;color:#0f172a}.xp717-dlg .y{background:#dc2626;color:#fff}",
    ".xp717-pk{min-width:240px}.xp717-pk ul{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:6px}.xp717-pk li button{width:100%;text-align:left;height:auto;min-height:36px;padding:6px 10px;border-radius:8px;border:1px solid #c7d2fe;background:#f5f7ff;color:#3730a3;font-weight:600;font-family:inherit;cursor:pointer}",
    ".xp717-pv{background:#fff;border-radius:12px;width:min(1100px,100%);height:min(92vh,900px);display:flex;flex-direction:column;overflow:hidden}",
    ".xp717-pvh{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #e2e8f0}.xp717-pvh b{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".xp717-pvh button{height:32px;padding:0 12px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;font-weight:600;font-family:inherit;cursor:pointer}",
    ".xp717-pvb{flex:1;overflow:auto;background:#f1f5f9;display:flex;align-items:flex-start;justify-content:center}.xp717-pvb iframe{width:100%;height:100%;border:0;background:#fff}",
    ".xp717-pvb img{max-width:100%;cursor:zoom-in;margin:auto}.xp717-pvb img.z{max-width:none;cursor:zoom-out}.xp717-pvb .na{margin:auto;text-align:center;color:#334155;padding:20px}",
    "@media (max-width:760px){.xp717-sum{order:3;flex-basis:100%;justify-content:flex-start;text-align:left;flex-wrap:wrap}.xp717-tw{border:0;background:none}",
    ".xp717-tb thead{display:none}.xp717-tb,.xp717-tb tbody,.xp717-tb tr,.xp717-tb td{display:block;width:100%}",
    ".xp717-tb tbody tr{border:1px solid #dbe4f0;border-radius:10px;background:#fff;margin:0 0 8px;padding:6px 8px}.xp717-tb td{border:0;padding:4px 0}",
    ".xp717-tb td[data-l]::before{content:attr(data-l);display:block;font-size:11.5px;font-weight:700;color:#475569;margin:0 0 2px}.xp717-tb td.c{width:auto;text-align:left}",
    ".xp717-tb td.c::before{content:'รายการที่ '}.xp717-ac{justify-content:stretch}.xp717-ac .xp717-b{flex:1;justify-content:center;height:38px}.xp717-tb tfoot tr{display:flex;flex-wrap:wrap;border-radius:10px;overflow:hidden}",
    ".xp717-tb tfoot td{flex:1 1 30%}.xp717-tb tfoot td:empty{display:none}.xp717-fs{min-width:0}}"
  ].join("");
  document.head.appendChild(s);
}
/* ── กล่องยืนยัน / เลือกไฟล์ / Preview (ไม่ใช้ Modal กลาง = ไม่ปิดหน้าต่างงาน) ── */
function ov(html, onClick) {
  var o = document.createElement("div"); o.className = "xp717-ov"; o.innerHTML = html; document.body.appendChild(o);
  var close = function () { o.remove(); document.removeEventListener("keydown", key, !0); };
  var key = function (e) { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  document.addEventListener("keydown", key, !0);
  o.addEventListener("click", function (e) { if (e.target === o) { close(); return; } onClick && onClick(e, close); });
  return { el: o, close: close };
}
function confirm717(title, msg, yes) {
  return new Promise(function (res) {
    var d = ov('<div class="xp717-dlg" role="dialog" aria-modal="true"><b>' + esc(title) + "</b><div>" + esc(msg) + '</div><div class="a"><button type="button" class="n" data-n>ยกเลิก</button><button type="button" class="y" data-y>' + esc(yes) + "</button></div></div>",
      function (e, close) { if (e.target.closest("[data-n]")) { close(); res(!1); } else if (e.target.closest("[data-y]")) { close(); res(!0); } });
    var mo = new MutationObserver(function () { if (!d.el.isConnected) { mo.disconnect(); res(!1); } }); mo.observe(document.body, { childList: !0 });
  });
}
function pick717(files, title) {
  if (files.length === 1) return Promise.resolve(files[0]);
  return new Promise(function (res) {
    var d = ov('<div class="xp717-dlg xp717-pk" role="dialog" aria-modal="true"><b>' + esc(title) + '</b><ul>' + files.map(function (f, i) { return '<li><button type="button" data-i="' + i + '">📎 ' + esc(f.name) + " <small>(" + esc(kb(f.size)) + ")</small></button></li>"; }).join("") +
      '</ul><div class="a"><button type="button" class="n" data-n>ปิด</button></div></div>',
      function (e, close) { var b = e.target.closest("[data-i]"); if (b) { close(); res(files[Number(b.dataset.i)]); } else if (e.target.closest("[data-n]")) { close(); res(null); } });
    var mo = new MutationObserver(function () { if (!d.el.isConnected) { mo.disconnect(); res(null); } }); mo.observe(document.body, { childList: !0 });
  });
}
async function urlOf(f, dl) {
  if (f.file) return URL.createObjectURL(f.file);
  var q = await SB().storage.from(BK).createSignedUrl(f.path, 120, dl ? { download: f.name || !0 } : void 0);
  if (q.error || !q.data || !q.data.signedUrl) throw q.error || new Error("no url");
  return q.data.signedUrl;
}
async function preview(f) {
  var e = extOf(f.name || f.path), img = e === "jpg" || e === "jpeg" || e === "png", pdf = e === "pdf";
  var d = ov('<div class="xp717-pv" role="dialog" aria-modal="true"><div class="xp717-pvh"><b>📎 ' + esc(f.name) + " · " + esc(kb(f.size)) + '</b><button type="button" data-dl>โหลดไฟล์</button><button type="button" data-n>✕ ปิด</button></div><div class="xp717-pvb"><div class="na">กำลังเปิด…</div></div></div>',
    function (ev, close) { if (ev.target.closest("[data-n]")) close(); else if (ev.target.closest("[data-dl]")) download(f); else if (ev.target.tagName === "IMG") ev.target.classList.toggle("z"); });
  var box = d.el.querySelector(".xp717-pvb");
  if (!img && !pdf) { box.innerHTML = '<div class="na">ไฟล์ ' + esc(e.toUpperCase()) + " ไม่รองรับการแสดงตัวอย่าง<br><br>กด <b>โหลดไฟล์</b> เพื่อเปิดด้วยโปรแกรมในเครื่อง</div>"; return; }
  try {
    var u = await urlOf(f, !1);
    if (!d.el.isConnected) return;
    box.innerHTML = img ? '<img alt="" src="' + esc(u) + '">' : '<iframe title="' + esc(f.name) + '" src="' + esc(u) + '"></iframe>';
  } catch (er) { box.innerHTML = '<div class="na">เปิดไฟล์ไม่ได้ — ไม่มีสิทธิ์หรือไฟล์ไม่พบ</div>'; }
}
async function download(f) {
  try {
    var u = await urlOf(f, !0), ou = u;
    if (!f.file) { var rs = await fetch(u); if (!rs.ok) throw new Error("HTTP " + rs.status); ou = URL.createObjectURL(await rs.blob()); }
    var a = document.createElement("a"); a.href = ou; a.download = f.name || "file"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(ou); } catch (e) {} }, 5000);
  } catch (e) { toast("ดาวน์โหลดไม่ได้ — ไม่มีสิทธิ์หรือไฟล์ไม่พบ", "err"); }
}
/* ── สถานะ / แสดงผล ── */
var K = 0;
function row(x) { return { key: "k" + (++K), id: x && x.id || null, description: x ? String(x.description || "") : "", pay: x && x.pay_amount != null ? Number(x.pay_amount).toFixed(2) : "", collect: x && x.collect_amount != null ? Number(x.collect_amount).toFixed(2) : "",
  files: ((x && x.files) || []).map(function (f) { return { id: f.id, name: f.name, size: f.size, path: f.path, mime: f.mime }; }), bad: {} }; }
function totals(st) { var p = 0, c = 0; st.items.forEach(function (it) { var a = num(it.pay), b = num(it.collect); p += a && !isNaN(a) ? a : 0; c += b && !isNaN(b) ? b : 0; }); return { n: st.items.length, p: Math.round(p * 100) / 100, c: Math.round(c * 100) / 100 }; }
function sumText(st) { var t = totals(st); return "รวม " + t.n + " รายการ · จ่ายทั้งหมด " + fm(t.p) + " บาท · รับวางบิล / เก็บลูกค้าได้ " + fm(t.c) + " บาท"; }
function bodyHTML(st) {
  if (st.err) return '<div class="xp717-msg err">' + esc(st.err) + "</div>";
  if (!st.loaded) return '<div class="xp717-msg">กำลังโหลด…</div>';
  var ed = st.edit, t = totals(st);
  var h = '<div class="xp717-tw"><table class="xp717-tb"><thead><tr><th style="width:34px">#</th><th>รายละเอียด <span class="req">*</span></th><th style="width:150px">ยอดจ่าย (บาท) <span class="req">*</span></th><th style="width:150px">เก็บลูกค้าได้ (บาท)</th><th style="width:26%">ไฟล์แนบ</th><th style="width:290px">จัดการ</th></tr></thead><tbody>';
  if (!st.items.length) h += '<tr><td colspan="6" class="xp717-em">ยังไม่มีรายการ — กด "เพิ่มรายการ" เพื่อเริ่ม</td></tr>';
  st.items.forEach(function (it, i) {
    var nf = it.files.length;
    h += '<tr data-k="' + it.key + '"><td class="c">' + (i + 1) + "</td>" +
      '<td data-l="รายละเอียด *">' + (ed ? '<input class="xp717-i' + (it.bad.d ? " bad" : "") + '" data-f="description" maxlength="300" value="' + esc(it.description) + '" placeholder="เช่น ค่ามัดจำตู้">' : '<span class="ro">' + esc(it.description || "-") + "</span>") + "</td>" +
      '<td data-l="ยอดจ่าย (บาท) *">' + (ed ? '<input class="xp717-i r' + (it.bad.p ? " bad" : "") + '" data-f="pay" inputmode="decimal" value="' + esc(it.pay === "" ? "" : fm(it.pay)) + '" placeholder="0.00">' : '<span class="ro r">' + fm(it.pay) + "</span>") + "</td>" +
      '<td data-l="เก็บลูกค้าได้ (บาท)">' + (ed ? '<input class="xp717-i r' + (it.bad.c ? " bad" : "") + '" data-f="collect" inputmode="decimal" value="' + esc(it.collect === "" ? "" : fm(it.collect)) + '" placeholder="0.00">' : '<span class="ro r">' + fm(it.collect) + "</span>") + "</td>" +
      '<td data-l="ไฟล์แนบ"><div class="xp717-fs">' + it.files.map(function (f, j) {
        return '<div class="xp717-f' + (f.file ? " p" : "") + '" title="' + esc(f.name) + (f.file ? " (รอบันทึก)" : "") + '">' + IC.clip + '<span class="nm">' + esc(f.name) + "</span><small>(" + esc(kb(f.size)) + ")</small>" +
          (ed ? '<button type="button" class="xp717-x" data-xf="' + j + '" aria-label="ลบไฟล์แนบ">×</button>' : "") + "</div>";
      }).join("") + (ed ? '<button type="button" class="xp717-at" data-at>' + IC.clip + "แนบไฟล์</button><input type=\"file\" data-in multiple accept=\"" + ACCEPT + '" hidden>' : (nf ? "" : '<span class="ro" style="color:#94a3b8">-</span>')) + "</div></td>" +
      '<td data-l="จัดการ"><div class="xp717-ac"><button type="button" class="xp717-b v" data-v' + (nf ? "" : " disabled") + ">" + IC.eye + "ดูไฟล์</button>" +
      '<button type="button" class="xp717-b d" data-d' + (nf ? "" : " disabled") + ">" + IC.dl + "โหลดไฟล์</button>" +
      '<button type="button" class="xp717-b x" data-x' + (ed ? "" : " disabled") + ">" + IC.del + "ลบ</button></div></td></tr>";
  });
  h += "</tbody>" + (st.items.length ? '<tfoot><tr><td></td><td style="text-align:right">รวม</td><td class="r">' + fm(t.p) + '</td><td class="r">' + fm(t.c) + "</td><td></td><td></td></tr></tfoot>" : "") + "</table></div>";
  var pend = st.items.reduce(function (a, it) { return a + it.files.filter(function (f) { return f.file; }).length; }, 0);
  if (ed && (pend || st.delItems.length || st.delFiles.length)) h += '<div class="xp717-pend">มีการเปลี่ยนแปลงที่ยังไม่บันทึก' + (pend ? " · ไฟล์รออัปโหลด " + pend + " ไฟล์" : "") + " — กด บันทึก เพื่อบันทึก</div>";
  return h;
}
function paint(st) {
  var el = st.el; if (!el) return;
  el.querySelector(".xp717-sum").innerHTML = IC.box + "<span>" + esc(sumText(st)) + "</span>";
  var add = el.querySelector("[data-add]"); add && (add.disabled = !st.loaded || !st.edit || !!st.err);
  var ro = el.querySelector(".xp717-ro"); ro && (ro.hidden = !st.loaded || st.edit || !!st.err);
  var f = document.activeElement, k = f && f.closest && f.closest("tr[data-k]") && el.contains(f) ? [f.closest("tr").dataset.k, f.dataset.f, f.selectionStart] : null;
  el.querySelector(".xp717-bd").innerHTML = bodyHTML(st);
  if (k) { var x = el.querySelector('tr[data-k="' + k[0] + '"] [data-f="' + k[1] + '"]'); if (x) { x.focus(); try { k[2] != null && x.setSelectionRange(k[2], k[2]); } catch (e) {} } }
}
function find(st, tr) { var k = tr && tr.dataset.k; return st.items.find(function (x) { return x.key === k; }); }
function dirty(st) { st.dirty = !0; try { st.el.dispatchEvent(new Event("change", { bubbles: !0 })); } catch (e) {} }
async function load(st) {
  st.loaded = !1; st.err = ""; paint(st);
  if (!uid(st.jobId)) { st.items = []; st.edit = !st.ro; st.loaded = !0; paint(st); return; }
  try {
    var r = await RPC("njacc_xp717_get", { p_job: st.jobId });
    st.items = ((r && r.items) || []).map(row); st.edit = !st.ro && !!(r && r.can_edit); st.delItems = []; st.delFiles = []; st.dirty = !1; st.loaded = !0;
  } catch (e) { st.err = errMsg(e); st.loaded = !0; st.edit = !1; }
  paint(st);
}
function wire(st) {
  var el = st.el;
  el.addEventListener("click", async function (e) {
    var b = e.target.closest("button"); if (!b || !el.contains(b) || b.disabled) return;
    if (b.hasAttribute("data-add")) { e.preventDefault(); st.items.push(row(null)); dirty(st); paint(st); var t = el.querySelector("tbody tr:last-child [data-f='description']"); t && t.focus(); return; }
    var tr = b.closest("tr[data-k]"), it = find(st, tr); if (!it) return;
    if (b.hasAttribute("data-at")) { var inp = tr.querySelector("[data-in]"); if (inp) { inp.disabled = !1; inp.value = ""; inp.click(); } return; }
    if (b.hasAttribute("data-xf")) {
      var f = it.files[Number(b.dataset.xf)]; if (!f) return;
      if (!(await confirm717("ลบไฟล์แนบ", "ต้องการลบไฟล์แนบนี้หรือไม่?\n" + f.name, "ยืนยันลบ"))) return;
      it.files = it.files.filter(function (x) { return x !== f; }); f.id && st.delFiles.push(f.id); dirty(st); paint(st); return;
    }
    if (b.hasAttribute("data-v") || b.hasAttribute("data-d")) {
      var dl = b.hasAttribute("data-d"), g = await pick717(it.files, dl ? "เลือกไฟล์ที่ต้องการดาวน์โหลด" : "เลือกไฟล์ที่ต้องการดู"); if (!g) return;
      dl ? download(g) : preview(g); return;
    }
    if (b.hasAttribute("data-x")) {
      if (!(await confirm717("ลบรายการนอกราคาขาย", "คุณต้องการลบรายการนอกราคาขายนี้หรือไม่?", "ยืนยันลบ"))) return;
      st.items = st.items.filter(function (x) { return x !== it; }); it.id && st.delItems.push(it.id); dirty(st); paint(st);
    }
  });
  el.addEventListener("input", function (e) {
    var x = e.target; if (!x.matches || !x.matches("input[data-f]")) return; var it = find(st, x.closest("tr[data-k]")); if (!it) return;
    var k = x.dataset.f; it[k] = k === "description" ? x.value : x.value.replace(/,/g, ""); it.bad = {}; x.classList.remove("bad"); st.dirty = !0;
    el.querySelector(".xp717-sum").innerHTML = IC.box + "<span>" + esc(sumText(st)) + "</span>";
    var t = totals(st), tf = el.querySelectorAll("tfoot td.r"); tf.length === 2 && (tf[0].textContent = fm(t.p), tf[1].textContent = fm(t.c));
  });
  el.addEventListener("focusout", function (e) { var x = e.target; if (x.matches && x.matches("input.r[data-f]") && x.value !== "") { var n = num(x.value); n != null && !isNaN(n) && (x.value = fm(n)); } });
  el.addEventListener("change", function (e) {
    var x = e.target; if (!x.matches || !x.matches("input[data-in]")) return; var it = find(st, x.closest("tr[data-k]")); if (!it) return;
    var fs = Array.prototype.slice.call(x.files || []), bad = []; x.value = "";
    fs.forEach(function (f) { var ex = extOf(f.name); if (!EXT[ex]) bad.push(f.name + " — รองรับเฉพาะ PDF, JPG, PNG, DOCX, XLSX"); else if (!f.size) bad.push(f.name + " — ไฟล์ว่าง"); else if (f.size > MAX) bad.push(f.name + " — ใหญ่เกิน 10 MB"); else it.files.push({ name: f.name, size: f.size, file: f }); });
    bad.length && toast("แนบไม่ได้ : " + bad.join(" · "), "err"); dirty(st); paint(st);
  });
}
function validate(st) {
  if (!st || !st.edit || !st.loaded) return !0;
  var ok = !0, first = null;
  st.items = st.items.filter(function (it) { return String(it.description).trim() || String(it.pay).trim() || String(it.collect).trim() || it.files.length || it.id; });
  st.items.forEach(function (it) {
    it.bad = {}; var p = num(it.pay), c = num(it.collect);
    if (!String(it.description).trim()) it.bad.d = 1;
    if (p == null || isNaN(p)) it.bad.p = 1;
    if (c != null && isNaN(c)) it.bad.c = 1;
    if (it.bad.d || it.bad.p || it.bad.c) { ok = !1; first = first || it; }
  });
  paint(st);
  if (!ok) { toast("นอกราคาขาย : กรอกรายละเอียดและยอดจ่ายให้ครบ (ตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง)", "err"); var x = st.el.querySelector('tr[data-k="' + first.key + '"] input.bad'); x && x.focus(); }
  return ok;
}
/* ── API ── */
/* root = หน้าต่างงาน (DOCUMENT : .modal-b · ACCOUNTING : billing modal) · o.jobId · o.src = DOCUMENT / ACCOUNTING · o.saveBtns = ปุ่มที่ต้องตรวจก่อนบันทึก · o.before = Element ที่จะวางก่อน */
export function mount717(root, o) {
  try {
    if (!root || root.querySelector(".xp717")) return null;
    css(); o = o || {};
    var md = root.closest(".modal") || root;
    var s5 = root.querySelector('.jm546-sec[data-sec="5"]'), s6 = root.querySelector('.jm546-sec[data-sec="6"]'), anchor = o.before || s5 || root.querySelector(".jm-sec.jm-acc");
    var el = document.createElement("div"); el.className = "xp717 jm546-x717"; el.setAttribute("data-xp717", "");
    el.innerHTML = '<div class="xp717-hd">' + (o.numbered === !1 ? "" : '<span class="xp717-n">5</span>') + '<span class="xp717-t">นอกราคาขาย</span><span class="xp717-ro" hidden>อ่านอย่างเดียว</span><span class="xp717-sum"></span>' +
      '<button type="button" class="xp717-add" data-add disabled>' + IC.plus + "เพิ่มรายการ</button></div><div class=\"xp717-bd\"></div>";
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor); else root.appendChild(el);
    /* ลำดับหัวข้อใหม่ : ข้อมูลวางบิล 5 → 6 · รายการ INVOICE / วางบิล 6 → 7 (เปลี่ยนเฉพาะตัวเลขที่แสดง · data-sec เดิม) */
    [[s5, "6"], [s6, "7"]].forEach(function (p) { var n = p[0] && p[0].querySelector(":scope>.jm546-hrow .jm546-n"); n && (n.textContent = p[1]); });
    var st = { el: el, jobId: o.jobId || null, src: o.src || "DOCUMENT", ro: !!o.readonly, items: [], delItems: [], delFiles: [], loaded: !1, edit: !1, err: "", dirty: !1 };
    el.__xp717 = st; wire(st); load(st);
    (o.saveBtns || []).forEach(function (sel) {
      var b = md.querySelector(sel); if (!b || b.__xp717) return; b.__xp717 = 1;
      b.addEventListener("click", function (e) { if (!validate(st)) { e.preventDefault(); e.stopImmediatePropagation(); } }, !0);
    });
    return st;
  } catch (e) { try { console.warn("XP717", e); } catch (_e) {} return null; }
}
/* เรียกหลัง SAVE งานสำเร็จ (มี JOB ID) : บันทึกรายการ + อัปโหลดไฟล์ที่รอ · ไม่โยน Error (แจ้งผลด้วย Toast) · คืน true = สำเร็จ / ไม่มีอะไรต้องบันทึก */
export async function after717(root, jobId) {
  var el = root && root.querySelector(".xp717"), st = el && el.__xp717;
  if (!st || !uid(jobId)) return !0;
  var newJob = !uid(st.jobId); st.jobId = jobId;
  if (!st.edit || !st.loaded || st.err) { newJob && load(st); return !0; }
  var pend = st.items.some(function (it) { return it.files.some(function (f) { return f.file; }); });
  if (!st.dirty && !pend && !st.delItems.length && !st.delFiles.length) return !0;
  if (!validate(st)) return !1;
  try {
    var r = await RPC("njacc_xp717_save", { p: { job_id: jobId, items: st.items.map(function (it) { return { key: it.key, id: it.id, description: String(it.description).trim(), pay_amount: String(num(it.pay) == null ? "" : num(it.pay).toFixed(2)), collect_amount: String(num(it.collect) == null ? "0" : num(it.collect).toFixed(2)) }; }),
      delete_items: st.delItems, delete_files: st.delFiles } });
    var map = {}; ((r && r.items) || []).forEach(function (x) { map[x.key] = x.id; });
    st.items.forEach(function (it) { it.id = map[it.key] || it.id; }); st.delItems = []; st.delFiles = [];
  } catch (e) { toast("บันทึกนอกราคาขายไม่สำเร็จ — " + errMsg(e), "err"); return !1; }
  var fail = [], n = 0;
  for (var i = 0; i < st.items.length; i++) {
    var it = st.items[i];
    for (var j = 0; j < it.files.length; j++) {
      var f = it.files[j]; if (!f.file || !uid(it.id)) continue;
      var ex = extOf(f.name), stem = String(f.name).replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "file";
      var path = jobId + "/" + it.id + "/" + uuid() + "-" + stem + "." + ex;
      try {
        var up = await SB().storage.from(BK).upload(path, new Blob([f.file], { type: EXT[ex] }), { contentType: EXT[ex], upsert: !1, cacheControl: "3600" });
        if (up.error) throw up.error;
        await RPC("njacc_xp717_add_file", { p: { job_id: jobId, item_id: it.id, path: path, name: String(f.name || "").slice(0, 150) } });
        n++;
      } catch (er) { fail.push(f.name + " — " + errMsg(er)); }
    }
  }
  fail.length && toast("แนบไฟล์นอกราคาขายไม่สำเร็จ : " + fail.join(" · "), "err");
  await load(st);
  return !fail.length;
}
/* VIEW (หน้าเปิดดูงาน) : อ่านอย่างเดียว · ดู / โหลดไฟล์ได้ตามสิทธิ์ */
export function view717(container, o) {
  try {
    if (!container || container.querySelector(".xp717")) return;
    var host = document.createElement("div"); host.style.margin = "12px 0 0";
    var card = container.querySelector(".card") || container; card.appendChild(host);
    mount717(host, { jobId: o && o.jobId, src: "VIEW", readonly: !0, numbered: !1 });
  } catch (e) {}
}
export function files723() { css(); return { preview: preview, download: download, pick: pick717, confirm: confirm717 }; }   /* V.723 : EXPENSES ใช้ตัวช่วยไฟล์เดิม (Storage / สิทธิ์เดิม) */
export function dirty717(root) { var el = root && root.querySelector(".xp717"), st = el && el.__xp717; return !!(st && st.edit && (st.dirty || st.delItems.length || st.delFiles.length)); }
