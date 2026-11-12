import{ask725 as ASK,err725 as E725}from"./adv-slip-A725.js";import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";
/* ═══ V.716 · เอกสารเพิ่มเติม (Supporting Documents) — Component กลาง : DOCUMENT → ADVANCE · ACCOUNTING → ADVANCE · CASH ADVANCE (Desktop + มือถือ)
   แยกจากสลิปการโอนเงิน (Payment Slip เดิม) · ไม่บังคับ · ไม่เป็นเงื่อนไข POST / อนุมัติ / จ่ายเงิน / ปิดงาน · ไม่แก้ยอดเงิน / รายการเบิก / สถานะงาน
   ไฟล์ : Storage private njacc-adv-docs (PDF / JPG / PNG / DOCX / XLSX ≤ 10 MB ต่อไฟล์) · ผูก JOB เดิม (ทุกเมนูเห็นชุดเดียวกัน) · ดู / ดาวน์โหลดด้วย Signed URL อายุ 2 นาที
   ข้อมูล : RPC njacc_adv716_list / njacc_adv716_add (RUN-716 · ตรวจสิทธิ์ JOB + ไฟล์จริงที่ฐานข้อมูล · บันทึกประวัติ ADV716_DOC_ADD ใน Timeline)
   V.725 : ลบไฟล์ = เฉพาะที่เปิดด้วย o.del (CASH ADVANCE) + SUPER_ADMIN + JOB ยังไม่ปิด / ยกเลิก (can_del จาก Server) · Soft Delete ผ่าน njacc_adv725_doc_del · ไฟล์จริงคงอยู่ ═══ */
var BK = "njacc-adv-docs", MAX = 10485760, C = new Map(), BUSY = new Map();
var EXT = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
var ACCEPT = ".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png," + EXT.docx + "," + EXT.xlsx;
var SRC = { DOCUMENT: "DOCUMENT", ACCOUNTING: "ACCOUNTING", CASH_ADVANCE: "CASH ADVANCE" };
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function p2(n) { return String(n).padStart(2, "0"); }
function dtm(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
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
function prev(d) { var e = extOf(d.name || d.path); return e === "pdf" || e === "jpg" || e === "jpeg" || e === "png"; }
function icon(d) { var e = extOf(d.name || d.path); return e === "pdf" ? "📄" : e === "xlsx" ? "📊" : e === "docx" ? "📝" : "🖼"; }
function errMsg(e) {
  var m = String(e && (e.message || e.error || e.code) || e || "");
  if (/ADV716_FILE_TOO_BIG|exceeded the maximum|Payload too large|413/i.test(m)) return "ไฟล์ใหญ่เกิน 10 MB";
  if (/ADV716_FILE_TYPE|mime type|not supported/i.test(m)) return "รองรับเฉพาะ PDF, JPG, PNG, DOCX, XLSX";
  if (/ADV716_TOO_MANY/.test(m)) return "แนบได้สูงสุด 50 ไฟล์ต่อ JOB";
  if (/ADV716_FILE_NOT_FOUND|ADV716_FILE_INVALID|ADV716_DUPLICATE/.test(m)) return "อัปโหลดไฟล์ไม่สำเร็จ — กรุณาลองใหม่";
  if (/NJACC_FORBIDDEN|row-level security|Unauthorized|403/i.test(m)) return "ไม่มีสิทธิ์แนบ / เปิดไฟล์ของ JOB นี้";
  if (/njacc_adv716_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "ระบบเอกสารเพิ่มเติมยังไม่พร้อม (ยังไม่ได้รัน RUN-716)";
  return m || "ทำรายการไม่สำเร็จ";
}
function css() {
  if (document.getElementById("d716-css")) return;
  var s = document.createElement("style"); s.id = "d716-css";
  s.textContent = [
    ".d716{border:1px solid #c7d2fe;border-radius:10px;background:#f8faff;padding:8px 10px;margin:10px 0 2px;font-size:12.5px;color:#0f172a;min-width:0}",
    ".d716-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:700;color:#3730a3;font-size:13px}.d716-h .t{flex:1 1 auto;min-width:0}",
    ".d716-h small{font-weight:600;color:#64748b;font-size:11.5px}",
    ".d716-b{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 11px;border-radius:8px;border:1px solid #6366f1;background:#6366f1;color:#fff;font-weight:600;font-size:12.5px;font-family:inherit;cursor:pointer;white-space:nowrap}",
    ".d716-b.o{background:#fff;color:#4338ca}.d716-b:disabled{opacity:.55;cursor:not-allowed}",
    ".d716-hint{color:#64748b;font-size:11.5px;margin:4px 0 2px}",
    ".d716-l{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:5px}",
    ".d716-r{display:flex;align-items:center;gap:8px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:6px 8px;min-width:0}",
    ".d716-r .i{flex:none;font-size:18px}.d716-r .m{flex:1 1 auto;min-width:0}.d716-r .m b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".d716-r .m small{display:block;color:#64748b;font-size:11.5px;overflow-wrap:anywhere}.d716-r .a{flex:none;display:flex;gap:5px}",
    ".d716-r .a button{height:28px;padding:0 9px;border-radius:7px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap}",
    ".d716-r .a button.x{border-color:#fecaca;background:#fef2f2;color:#dc2626}",
    ".d716-e{color:#64748b;padding:6px 2px}.d716-w{color:#b45309;padding:6px 2px}.d716-p{color:#4338ca;font-weight:600;padding:4px 2px}",
    ".d716.m{padding:10px 12px;margin:14px 0 4px;border-radius:12px}.d716.m .d716-h{font-size:14px}.d716.m .d716-b{height:36px;font-size:13.5px}",
    ".d716.m .d716-r{flex-wrap:wrap}.d716.m .d716-r .a{width:100%}.d716.m .d716-r .a button{flex:1;height:34px;font-size:13px}",
    "@media (max-width:560px){.d716-r{flex-wrap:wrap}.d716-r .a{width:100%}.d716-r .a button{flex:1;height:32px}}"
  ].join("");
  document.head.appendChild(s);
}
async function load(job) {
  if (!uid(job)) return;
  var c = C.get(job) || {}; c.st = c.docs ? "ok" : "loading"; c.err = ""; c.t = Date.now(); C.set(job, c); paint(job);
  try { var r = await RPC("njacc_adv716_list", { p_job: job }); c.docs = (r && r.docs) || []; c.cd = !!(r && r.can_del); c.st = "ok"; }
  catch (e) { c.st = "err"; c.err = errMsg(e); }
  paint(job);
}
function inner(job, el) {
  var c = C.get(job) || { st: "loading" }, m = el && el.classList.contains("m"), cam = m || (window.matchMedia && window.matchMedia("(pointer:coarse)").matches);
  var busy = BUSY.get(job), n = (c.docs || []).length, del = !!(el && (el.getAttribute ? el.getAttribute("data-d716del") === "1" : el.del)) && c.cd;   /* V.725 */
  var h = '<div class="d716-h"><span class="t">📎 เอกสารเพิ่มเติม (Supporting Documents)' + (n ? " <small>" + n + " ไฟล์</small>" : "") + "</span>" +
    (cam ? '<button type="button" class="d716-b o" data-d716="cam"' + (busy ? " disabled" : "") + ">📷 ถ่ายรูป</button>" : "") +
    '<button type="button" class="d716-b" data-d716="add"' + (busy ? " disabled" : "") + ">+ แนบไฟล์เพิ่มเติม</button>" +
    '<input type="file" data-d716f multiple accept="' + ACCEPT + '" hidden><input type="file" data-d716c accept="image/*" capture="environment" hidden></div>' +
    '<div class="d716-hint">PDF, JPG, PNG, DOCX, XLSX · ไม่เกิน 10 MB ต่อไฟล์ · ไม่บังคับ — ไม่ใช้แทนสลิปการโอนเงิน</div>';
  if (busy) h += '<div class="d716-p">' + esc(busy) + "</div>";
  if (c.st === "err") return h + '<div class="d716-w">' + esc(c.err) + ' <button type="button" class="d716-b o" data-d716="re">ลองใหม่</button></div>';
  if (!c.docs) return h + '<div class="d716-e">กำลังโหลด…</div>';
  if (!n) return h + '<div class="d716-e">ยังไม่มีเอกสารเพิ่มเติม</div>';
  return h + '<ul class="d716-l">' + c.docs.map(function (d) {
    return '<li class="d716-r"><span class="i">' + icon(d) + '</span><span class="m"><b title="' + esc(d.name) + '">' + esc(d.name) + "</b><small>" + esc(kb(d.size)) +
      " · แนบโดย " + esc(d.uploaded_by || "-") + " · " + esc(dtm(d.uploaded_at)) + (d.item_no ? " · รายการที่ " + esc(d.item_no) : "") + " · " + esc(SRC[d.source] || d.source || "") + '</small></span><span class="a">' +
      (prev(d) ? '<button type="button" data-d716v="' + esc(d.id) + '">ดูไฟล์</button>' : "") + '<button type="button" data-d716d="' + esc(d.id) + '">ดาวน์โหลด</button>' +
      (del ? '<button type="button" class="x" data-d716x="' + esc(d.id) + '" title="ลบไฟล์" aria-label="ลบไฟล์ ' + esc(d.name) + '">🗑 ลบไฟล์</button>' : "") + "</span></li>";
  }).join("") + "</ul>";
}
function paint(job) { document.querySelectorAll('.d716[data-d716j="' + job + '"]').forEach(function (el) { el.innerHTML = inner(job, el); }); }
function doc(job, id) { return ((C.get(job) || {}).docs || []).find(function (d) { return d.id === id; }); }
async function open(d, dl, b) {
  var w = dl ? null : window.open("", "_blank"); b && (b.disabled = !0);
  try {
    var q = await SB().storage.from(BK).createSignedUrl(d.path, 120, dl ? { download: d.name || !0 } : void 0);
    if (q.error || !q.data || !q.data.signedUrl) throw q.error || new Error("no url");
    if (dl) {
      var rs = await fetch(q.data.signedUrl); if (!rs.ok) throw new Error("HTTP " + rs.status);
      var ou = URL.createObjectURL(await rs.blob()), a = document.createElement("a"); a.href = ou; a.download = d.name || "document"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(ou); }, 4000);
    } else if (w) { try { w.opener = null; } catch (e) {} w.location.href = q.data.signedUrl; } else location.href = q.data.signedUrl;
  } catch (e) { w && w.close(); toast("เปิดไฟล์ไม่ได้ — ไม่มีสิทธิ์หรือไฟล์ไม่พบ", "err"); }
  b && (b.disabled = !1);
}
async function upload(job, src, files) {
  if (!uid(job) || BUSY.get(job)) return;
  var ok = [], bad = [];
  files.forEach(function (f) {
    var e = extOf(f.name);
    if (!EXT[e]) bad.push(f.name + " — รองรับเฉพาะ PDF, JPG, PNG, DOCX, XLSX");
    else if (!f.size) bad.push(f.name + " — ไฟล์ว่าง");
    else if (f.size > MAX) bad.push(f.name + " — ใหญ่เกิน 10 MB");
    else ok.push(f);
  });
  bad.length && toast("แนบไม่ได้ : " + bad.join(" · "), "err");
  if (!ok.length) return;
  var done = 0, fail = [];
  for (var i = 0; i < ok.length; i++) {
    var f = ok[i], e = extOf(f.name), stem = String(f.name).replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "file";
    var path = job + "/" + uuid() + "-" + stem + "." + e;
    BUSY.set(job, "กำลังอัปโหลด " + (i + 1) + "/" + ok.length + " : " + f.name); paint(job);
    try {
      var up = await SB().storage.from(BK).upload(path, new Blob([f], { type: EXT[e] }), { contentType: EXT[e], upsert: !1, cacheControl: "3600" });   /* ชนิดไฟล์ตามนามสกุลจริง (มือถือบางรุ่นไม่ส่งชนิดไฟล์ DOCX / XLSX) */
      if (up.error) throw up.error;
      await RPC("njacc_adv716_add", { p: { job_id: job, path: path, name: String(f.name || "").slice(0, 150), source: src } });
      done++;
    } catch (er) { fail.push(f.name + " — " + errMsg(er)); }
  }
  BUSY.delete(job);
  done && toast("✅ แนบเอกสารเพิ่มเติมแล้ว " + done + " ไฟล์", "ok");
  fail.length && toast("แนบไม่สำเร็จ : " + fail.join(" · "), "err");
  await load(job);
  try { window.dispatchEvent(new CustomEvent("njacc:adv716", { detail: { job_id: job, added: done } })); } catch (e) {}
}
async function delDoc(job, id, b, src) {   /* V.725 : ลบเฉพาะไฟล์ที่เลือก (ยืนยันก่อน) */
  var d = doc(job, id); if (!d || BUSY.get(job)) return;   /* ระบุด้วย Attachment ID ในรายการของ JOB นี้เท่านั้น (ไม่ใช้ชื่อไฟล์) */
  var ok = src === "DOCUMENT" ? await ASK("ลบไฟล์แนบ", "คุณต้องการลบไฟล์แนบนี้ใช่หรือไม่?<small><b>" + esc(d.name) + "</b> · " + esc(kb(d.size)) + " · แนบโดย " + esc(d.uploaded_by || "-") + " · " + esc(dtm(d.uploaded_at)) +
    "<br>ลบเฉพาะไฟล์นี้ · ไฟล์อื่น / ข้อมูล JOB ไม่กระทบ</small>", "ยืนยันลบ") : await ASK("ลบเอกสารเพิ่มเติม", "ลบไฟล์ <b>" + esc(d.name) + "</b> ?<small>ลบเฉพาะไฟล์นี้ · ไฟล์อื่น / สลิปโอนเงิน / ข้อมูล JOB ไม่กระทบ" +
    (d.source === "DOCUMENT" ? " · ไฟล์นี้แนบจาก DOCUMENT → ADVANCE (ระบบเก็บไฟล์ต้นฉบับและประวัติการลบไว้)" : "") + "</small>", "ยืนยันลบ");
  if (!ok || BUSY.get(job)) return;
  BUSY.set(job, "กำลังลบ : " + d.name); paint(job);
  try { await RPC("njacc_adv725_doc_del", { p: { doc_id: d.id } }); BUSY.delete(job); toast("ลบเอกสาร " + d.name + " แล้ว", "ok"); }
  catch (er) { BUSY.delete(job); toast("ลบไม่สำเร็จ : " + E725(er), "err"); }
  await load(job);
  try { window.dispatchEvent(new CustomEvent("njacc:adv716", { detail: { job_id: job, deleted: 1 } })); } catch (e) {}
}
var BOUND = !1;
function bind() {
  if (BOUND) return; BOUND = !0;
  document.addEventListener("click", function (e) {
    var t = e.target, box = t && t.closest && t.closest(".d716[data-d716j]"); if (!box) return;
    var job = box.getAttribute("data-d716j"), b = t.closest("button"); if (!b || b.disabled) return;
    var a = b.getAttribute("data-d716"), v = b.getAttribute("data-d716v"), d = b.getAttribute("data-d716d"), x = b.getAttribute("data-d716x");
    if (x) { e.preventDefault(); delDoc(job, x, b, box.getAttribute("data-d716s")); return; }   /* V.854 */
    if (a === "add" || a === "cam") { e.preventDefault(); var inp = box.querySelector(a === "cam" ? "[data-d716c]" : "[data-d716f]"); if (inp) { inp.disabled = !1; inp.value = ""; inp.click(); } return; }
    if (a === "re") { load(job); return; }
    if (v || d) { var x = doc(job, v || d); x && open(x, !!d, b); }
  }, !0);
  document.addEventListener("change", function (e) {
    var t = e.target; if (!t || !t.matches || !t.matches("[data-d716f],[data-d716c]")) return;
    var box = t.closest(".d716[data-d716j]"); if (!box) return;
    var fs = Array.prototype.slice.call(t.files || []); t.value = "";
    fs.length && upload(box.getAttribute("data-d716j"), box.getAttribute("data-d716s") || "DOCUMENT", fs);
  }, !0);
}
/* job = JOB id · o.src = DOCUMENT / ACCOUNTING / CASH_ADVANCE · o.mobile = มือถือ (ปุ่มใหญ่ + ถ่ายรูป) */
export function html716(job, o) {
  css(); bind(); o = o || {};
  if (!uid(job)) return '<div class="d716' + (o.mobile ? " m" : "") + '"><div class="d716-h"><span class="t">📎 เอกสารเพิ่มเติม (Supporting Documents)</span></div><div class="d716-e">บันทึกงานก่อน จึงแนบเอกสารเพิ่มเติมได้</div></div>';
  var c = C.get(job);
  if (!c || o.reload || Date.now() - (c.t || 0) > 15000) { C.set(job, Object.assign(c || {}, { t: Date.now() })); setTimeout(function () { load(job); }, 0); }   /* เปิดใหม่ / ครบ 15 วินาที = โหลดล่าสุด (เห็นไฟล์จากเมนูอื่น) */
  var s = SRC[o.src] ? o.src : "DOCUMENT";
  return '<div class="d716' + (o.mobile ? " m" : "") + '" data-d716j="' + esc(job) + '" data-d716s="' + s + '"' + (o.del ? ' data-d716del="1"' : "") + ">" + inner(job, { del: !!o.del, classList: { contains: function () { return !!o.mobile; } } }) + "</div>";
}
