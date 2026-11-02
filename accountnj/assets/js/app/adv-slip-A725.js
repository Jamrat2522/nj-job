import{m as RPC,l as SB}from"./chunk-SGWIBJH6.js";import{a as TOAST}from"./chunk-OFOOXWUM.js";
/* ═══ V.725 · CASH ADVANCE : หน้าต่าง "ยืนยันการอนุมัติ" + สลิปแนบล่วงหน้าแยกรายการ (Desktop = cash-advance · Mobile = adv-approve)
   กด "อนุมัติ" = เปิดหน้าต่างนี้เท่านั้น (สถานะยังเป็น รออนุมัติ) → แนบสลิปแต่ละรายการได้ (ไม่บังคับ) → "ยืนยันการอนุมัติ" = njacc_adv701_approve เดิม → อนุมัติแล้ว
   ยกเลิก / ปิดหน้าต่าง / บันทึกล้มเหลว = คงสถานะเดิม · แนบสลิป ≠ อนุมัติ ≠ จ่ายเงิน (ยืนยันจ่ายตาม Payment Flow เดิม โดยใช้สลิปที่แนบไว้)
   สลิปล่วงหน้า : Storage private njacc-adv-slips (path เดียวกับสลิปจ่ายเงิน) + RPC njacc_adv725_slips / slip_add / slip_del (RUN-725 · SUPER_ADMIN ตรวจที่ Server)
   ลบสลิป = Soft Delete เฉพาะรายการที่เลือก · รายการที่ยืนยันจ่ายแล้ว = ล็อกหลักฐาน (ไม่แสดงปุ่มลบ · Server ปฏิเสธ) ═══ */
var BK = "njacc-adv-slips", MAXF = 5242880, C = new Map(), M = null;
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fm(x) { return (Number(x) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function p2(x) { return String(x).padStart(2, "0"); }
function dtm(x) { if (!x) return "-"; var d = new Date(x); return isNaN(d) ? "-" : p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
function kb(n) { n = Number(n) || 0; return n >= 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
function toast(m, t) { try { TOAST(m, t || "ok"); } catch (e) {} }
function rnd() { var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (x) { return (x % 36).toString(36); }).join(""); }
var IC = {
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  dl: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  bin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>',
  file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  clip: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/></svg>',
  ok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>'
};
export function err725(e) {
  var m = String(e && (e.message || e.error || e.code) || e || "");
  if (/NJACC_ADV701_SUPER_ONLY|NJACC_CASHADV_SUPER_ONLY/.test(m)) return "เฉพาะ SUPER_ADMIN เท่านั้น";
  if (/NJACC_ADV725_SLIP_LOCKED|NJACC_ADV701_ITEM_PAID/.test(m)) return "รายการนี้ยืนยันจ่ายเงินแล้ว — สลิปถูกล็อกเป็นหลักฐาน";
  if (/NJACC_ADV725_SLIP_EXISTS/.test(m)) return "รายการนี้มีสลิปอยู่แล้ว — ลบสลิปเดิมก่อนแนบใหม่";
  if (/NJACC_ADV725_DOC_LOCKED/.test(m)) return "JOB ปิดงาน / ยกเลิกแล้ว — ลบเอกสารไม่ได้";
  if (/NJACC_ADV725_NOT_FOUND/.test(m)) return "ไม่พบไฟล์ (อาจถูกลบไปแล้ว) — โหลดข้อมูลล่าสุด";
  if (/NJACC_ADV701_STATE|NJACC_ADV701_NOT_APPROVED|NJACC_ADV701_ALL_PAID/.test(m)) return "สถานะคำขอเปลี่ยนไปแล้ว — โหลดข้อมูลล่าสุด";
  if (/NJACC_ADV701_SLIP_NOT_FOUND|NJACC_ADV701_SLIP_INVALID/.test(m)) return "ไฟล์สลิปไม่ถูกต้อง / อัปโหลดไม่สำเร็จ — กรุณาลองใหม่";
  if (/NJACC_ADV701_ITEM_INVALID/.test(m)) return "รายการไม่ถูกต้อง — โหลดข้อมูลล่าสุด";
  if (/NJACC_JOB_CANCELED/.test(m)) return "JOB ถูกยกเลิกแล้ว — ทำรายการต่อไม่ได้";
  if (/NJACC_FORBIDDEN/.test(m)) return "ไม่มีสิทธิ์ดู JOB นี้";
  if (/njacc_adv725_|PGRST202|42883|schema cache/i.test(m) && /(does not exist|Could not find|schema cache|42883|PGRST202)/i.test(m)) return "ระบบแนบ / ลบสลิปล่วงหน้ายังไม่พร้อม (ยังไม่ได้รัน RUN-725)";
  if (/row-level security|Unauthorized|403/i.test(m)) return "ไม่มีสิทธิ์อัปโหลด / เปิดไฟล์สลิปนี้";
  if (/exceeded the maximum|Payload too large|413/i.test(m)) return "ไฟล์ใหญ่เกิน 5 MB";
  return m || "ทำรายการไม่สำเร็จ";
}
/* ── ข้อมูลสลิปล่วงหน้า (แคชต่อคำขอ) ── */
export async function slips725(req) {
  var v;
  try { var r = await RPC("njacc_adv725_slips", { p_req: req }); v = { ok: !0, list: (r && r.slips) || [], edit: !!(r && r.can_edit) }; }
  catch (e) { v = { ok: !1, list: [], edit: !1, err: err725(e) }; }
  C.set(req, v); return v;
}
export function draft725(req, n) { var c = C.get(req); return c && c.list.find(function (x) { return Number(x.item_no) === Number(n) && !x.paid; }) || null; }
/* แถวไฟล์สลิปล่วงหน้า (ดูไฟล์ / ดาวน์โหลด / ลบไฟล์) · ใช้ทั้งหน้าต่างยืนยันและ Detail Modal */
export function cell725(r, n) {
  var d = draft725(r.id, n); if (!d) return "";
  var c = C.get(r.id) || {}, can = c.edit && (r.status === "PENDING" || r.status === "APPROVED"), a = ' data-r="' + esc(r.id) + '" data-j="' + esc(r.job_id) + '" data-n="' + n + '"';
  return '<div class="a725-fr"><i>' + IC.file + '</i><span title="' + esc(d.name) + '">' + esc(d.name) + " <small>(" + esc(kb(d.size)) + ")</small></span>" +
    '<button type="button" class="a725-fb" data-s725="v"' + a + ">" + IC.eye + "ดูไฟล์</button>" +
    '<button type="button" class="a725-fb" data-s725="d"' + a + ">" + IC.dl + "ดาวน์โหลด</button>" +
    (can ? '<button type="button" class="a725-fb x" data-s725="x"' + a + ' title="ลบไฟล์" aria-label="ลบไฟล์">' + IC.bin + "ลบไฟล์</button>" : "") + "</div>" +
    '<div class="a725-fm">แนบล่วงหน้าโดย ' + esc(d.uploaded_by || "-") + " · " + esc(dtm(d.uploaded_at)) + " · ยังไม่ใช่การยืนยันจ่ายเงิน</div>";
}
async function openFile(path, name, dl, b) {
  var w = dl ? null : window.open("", "_blank"); b && (b.disabled = !0);
  try {
    var q = await SB().storage.from(BK).createSignedUrl(path, 120, dl ? { download: name || !0 } : void 0);
    if (q.error || !q.data || !q.data.signedUrl) throw q.error || new Error("no url");
    if (dl) { var rs = await fetch(q.data.signedUrl); if (!rs.ok) throw new Error("HTTP " + rs.status); var ou = URL.createObjectURL(await rs.blob()), a = document.createElement("a"); a.href = ou; a.download = name || "slip"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(ou); }, 15e3); }
    else if (w) { try { w.opener = null; } catch (e) {} w.location.href = q.data.signedUrl; } else location.href = q.data.signedUrl;
  } catch (e) { w && w.close(); toast("เปิดสลิปไม่ได้ — ไม่มีสิทธิ์หรือไฟล์ไม่พบ", "err"); }
  b && (b.disabled = !1);
}
/* ── หน้าต่างยืนยัน (ใช้ร่วม : ลบสลิป / ลบเอกสารเพิ่มเติม) ── */
export function ask725(title, html, ok) {
  css725();
  return new Promise(function (res) {
    var w = document.createElement("div"); w.className = "a725-ask"; w.setAttribute("role", "alertdialog"); w.setAttribute("aria-modal", "true");
    w.innerHTML = '<div class="a725-ab"><div class="a725-ah">' + IC.bin + "<b>" + esc(title) + "</b></div><div class=\"a725-ac\">" + html + '</div><div class="a725-aa"><button type="button" class="a725-btn n" data-no>ยกเลิก</button><button type="button" class="a725-btn d" data-yes>' + IC.bin + esc(ok || "ยืนยันลบ") + "</button></div></div>";
    var done = function (v) { document.removeEventListener("keydown", key, !0); w.remove(); res(v); };
    var key = function (e) { if (e.key === "Escape") { e.stopPropagation(); done(!1); } };
    w.addEventListener("click", function (e) { e.stopPropagation(); if (e.target === w || e.target.closest("[data-no]")) done(!1); else if (e.target.closest("[data-yes]")) done(!0); });
    document.addEventListener("keydown", key, !0);
    document.body.appendChild(w); var y = w.querySelector("[data-no]"); y && y.focus();
  });
}
async function delSlip(req, job, n, b) {
  var d = draft725(req, n); if (!d) return;
  var ok = await ask725("ลบสลิปโอนเงิน", "ลบสลิปของ <b>รายการที่ " + n + "</b> : <b>" + esc(d.name) + "</b> ?<small>ลบเฉพาะรายการนี้ · สลิปรายการอื่นไม่กระทบ · สถานะคำขอไม่เปลี่ยน · แนบใหม่ได้</small>", "ยืนยันลบ");
  if (!ok) return;
  b && (b.disabled = !0);
  try {
    var r = await RPC("njacc_adv725_slip_del", { p: { slip_id: d.id } });
    C.set(req, { ok: !0, list: (r && r.slips) || [], edit: !!(r && r.can_edit) });
    toast("ลบสลิปรายการที่ " + n + " แล้ว", "ok");
    fire(req, job, "del", n);
  } catch (e) { b && (b.disabled = !1); toast(err725(e), "err"); M && M.req === req && M.msg(err725(e), "e"); if (/NOT_FOUND|LOCKED|STATE/.test(String(e && e.message))) { await slips725(req); fire(req, job, "reload", n); } }
}
function fire(req, job, act, n) { try { window.dispatchEvent(new CustomEvent("njacc:slip725", { detail: { req_id: req, job_id: job, act: act, item_no: n } })); } catch (e) {} }
var BOUND = !1;
function bind() {
  if (BOUND) return; BOUND = !0;
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-s725]"); if (!b || b.disabled) return;
    e.stopPropagation();
    var req = b.getAttribute("data-r"), n = Number(b.getAttribute("data-n")), a = b.getAttribute("data-s725"), d = draft725(req, n);
    if (a === "x") { delSlip(req, b.getAttribute("data-j"), n, b); return; }
    d && openFile(d.path, d.name, a === "d", b);
  }, !0);
}
/* ── หน้าต่าง "ยืนยันการอนุมัติ" ──
   r = คำขอ (njacc_adv701_req_json) · o.job = ข้อมูล JOB (House B/L) · o.done() = อนุมัติสำเร็จ · o.close(changed) = ยกเลิก / ปิด (สถานะไม่เปลี่ยน) · o.stale() = สถานะเปลี่ยน */
export function approve725(r, o) {
  css725(); bind(); o = o || {};
  if (M) M.kill();
  var j = o.job || {}, busy = !1, up = {}, changed = !1, st = { t: "", k: "" };
  var w = document.createElement("div"); w.className = "a725-ov"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-label", "ยืนยันการอนุมัติ");
  w.innerHTML = '<div class="a725-m"><div class="a725-h"><span class="a725-hi">' + IC.ok + '</span><b>ยืนยันการอนุมัติ</b><span class="a725-hj">JOB ' + esc(r.job_no || "-") + '</span><button type="button" class="a725-x" data-c aria-label="ปิด">×</button></div>' +
    '<div class="a725-b"></div><div class="a725-f"><span class="a725-st" data-st></span><button type="button" class="a725-btn n" data-c>ยกเลิก</button><button type="button" class="a725-btn g" data-go>✓ ยืนยันการอนุมัติ</button></div></div>';
  var body = w.querySelector(".a725-b"), go = w.querySelector("[data-go]"), stEl = w.querySelector("[data-st]");
  var msg = function (t, k) { st = { t: t || "", k: k || "" }; stEl.textContent = st.t; stEl.className = "a725-st" + (st.k ? " " + st.k : ""); };
  var info = function () {
    var kv = function (k, v) { return '<div class="a725-kv"><span>' + k + "</span><b>" + v + "</b></div>"; };
    return '<section class="a725-job">' + kv("JOB", esc(r.job_no || "-")) + (j.customer_name ? kv("ลูกค้า", esc(j.customer_name)) : "") + (j.house_bl_no ? kv("House B/L", esc(j.house_bl_no)) : "") + kv("ส่งโดย", esc(r.requested_by || "-")) +
      kv("วันที่ส่งคำขอ", esc(dtm(r.requested_at))) + kv("จำนวนรายการ", ((r.items || []).length || r.item_count || 0) + " รายการ") + kv("ยอดเบิกรวม", '<em class="a725-tot">' + fm(r.total_real) + " บาท</em>") + "</section>" +
      '<div class="a725-note"><b>สถานะยังเป็น “รออนุมัติ”</b> จนกว่าจะกด “ยืนยันการอนุมัติ” · แนบสลิปแยกแต่ละรายการได้ (ไม่บังคับ) · การอนุมัติไม่ใช่การยืนยันจ่ายเงิน — สลิปที่แนบไว้จะใช้ตอนยืนยันจ่ายเงินตามขั้นตอนเดิม</div>';
  };
  var paint = function () {
    var c = C.get(r.id), its = r.items || [];
    var h = info();
    if (!c) h += '<div class="a725-ld">กำลังโหลดสลิป…</div>';
    else if (!c.ok) h += '<div class="a725-warn">' + esc(c.err || "โหลดสลิปไม่สำเร็จ") + " — ยังยืนยันการอนุมัติได้ตามปกติ</div>";
    h += its.map(function (x, i) {
      var n = i + 1, paid = (r.pays || []).some(function (p) { return Number(p.item_no) === n; }), d = c && c.ok ? draft725(r.id, n) : null, u = up[n];
      var sl = u ? '<div class="a725-up">กำลังอัปโหลด : ' + esc(u) + "</div>"
        : d ? cell725(r, n)
        : '<div class="a725-no">ยังไม่มีสลิปโอนเงิน</div>' + (c && c.ok && c.edit && !paid ? '<label class="a725-at">' + IC.clip + 'แนบสลิป<input type="file" data-f="' + n + '" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" hidden></label><span class="a725-hint">JPG / PNG / PDF ไม่เกิน 5 MB · ไม่บังคับ</span>' : "");
      return '<article class="a725-it" data-item="' + n + '"><header><span class="no">' + n + "</span><b>รายการที่ " + n + " : " + esc(x.payment_type || "-") + "</b><strong>" + fm(x.real_pay) + " บาท</strong></header>" +
        '<div class="a725-ib"><div class="c1"><div><span>ธนาคาร</span><b>' + esc(x.bank_name || "-") + "</b></div><div><span>ชื่อบัญชี</span><b>" + esc(x.account_name || "-") + "</b></div><div><span>เลขบัญชี</span><b>" + esc(x.account_no || "-") + "</b></div>" +
        '<div><span>ยอดจ่ายสุทธิ</span><b>' + fm(x.real_pay) + ' บาท</b></div></div><div class="c2"><div class="a725-sh">' + IC.clip + "สลิปโอนเงินประจำรายการ</div>" + sl + "</div></div></article>";
    }).join("");
    var y = body.scrollTop; body.innerHTML = h; body.scrollTop = y;
    var upn = Object.keys(up).length; go.disabled = busy || upn > 0;
  };
  var close = function () {
    if (busy) return;
    kill(); o.close && o.close(changed);
  };
  var kill = function () { document.removeEventListener("keydown", key, !0); window.removeEventListener("njacc:slip725", ev); document.documentElement.classList.remove("a725-lock"); w.remove(); if (M && M.w === w) M = null; };
  var key = function (e) { if (e.key === "Escape" && !document.querySelector(".a725-ask")) { e.stopPropagation(); close(); } };
  var ev = function (e) { var d = e.detail || {}; if (d.req_id !== r.id) return; if (d.act !== "add") changed = !0; paint(); };
  w.addEventListener("click", function (e) {
    e.stopPropagation();
    if (e.target === w || e.target.closest("[data-c]")) { close(); return; }
    var b = e.target.closest("[data-go]"); if (!b || b.disabled || busy) return;
    busy = !0; go.disabled = !0; go.textContent = "กำลังบันทึก…"; w.querySelectorAll("[data-c]").forEach(function (x) { x.disabled = !0; }); msg("");
    RPC("njacc_adv701_approve", { p: { req_id: r.id } }).then(function () {
      busy = !1; kill(); o.done && o.done();
    }, function (er) {
      busy = !1; go.textContent = "✓ ยืนยันการอนุมัติ"; w.querySelectorAll("[data-c]").forEach(function (x) { x.disabled = !1; }); paint();
      var t = err725(er); msg("บันทึกการอนุมัติไม่สำเร็จ — " + t + " · สถานะยังเป็นรออนุมัติ", "e"); toast(t, "err");
      if (/STATE|CANCELED/.test(String(er && er.message))) { kill(); o.stale && o.stale(); }
    });
  });
  w.addEventListener("change", async function (e) {
    var fi = e.target; if (!fi || !fi.matches || !fi.matches("[data-f]")) return;
    var n = Number(fi.getAttribute("data-f")), f = fi.files && fi.files[0]; fi.value = ""; if (!f || up[n] || busy) return;
    var ty = String(f.type || "").toLowerCase(), ex = (String(f.name || "").split(".").pop() || "").toLowerCase();
    if (!/^(image\/jpeg|image\/png|application\/pdf)$/.test(ty) || !/^(jpe?g|png|pdf)$/.test(ex)) { msg("รองรับเฉพาะไฟล์ JPG / PNG / PDF", "e"); toast("รองรับเฉพาะไฟล์ JPG / PNG / PDF", "err"); return; }
    if (f.size > MAXF) { msg("ไฟล์ใหญ่เกิน 5 MB", "e"); toast("ไฟล์ใหญ่เกิน 5 MB", "err"); return; }
    up[n] = f.name; msg(""); paint();
    var ext = ty === "application/pdf" ? "pdf" : ty === "image/png" ? "png" : "jpg", path = r.job_id + "/" + r.id + "/" + n + "-" + rnd() + "." + ext;
    try {
      var u = await SB().storage.from(BK).upload(path, f, { contentType: ty, upsert: !1, cacheControl: "3600" });
      if (u.error) throw u.error;
      var res = await RPC("njacc_adv725_slip_add", { p: { req_id: r.id, item_no: n, slip_path: path, slip_name: String(f.name || "").slice(0, 150) } });
      C.set(r.id, { ok: !0, list: (res && res.slips) || [], edit: !!(res && res.can_edit) });
      delete up[n]; changed = !0; msg("แนบสลิปรายการที่ " + n + " แล้ว — ยังไม่อนุมัติจนกว่าจะกดยืนยัน", "o"); paint(); fire(r.id, r.job_id, "add", n);
    } catch (er) {
      delete up[n]; var t = err725(er); msg("แนบสลิปรายการที่ " + n + " ไม่สำเร็จ — " + t, "e"); toast(t, "err");
      if (/SLIP_EXISTS|STATE|ITEM_PAID/.test(String(er && er.message))) await slips725(r.id);
      paint();
    }
  });
  document.addEventListener("keydown", key, !0); window.addEventListener("njacc:slip725", ev);
  document.documentElement.classList.add("a725-lock");
  document.body.appendChild(w);
  M = { w: w, req: r.id, msg: msg, kill: kill };
  paint();
  slips725(r.id).then(function () { if (w.isConnected) paint(); });
  return w;
}
export function css725() {
  bind();
  if (document.getElementById("a725-css")) return;
  var s = document.createElement("style"); s.id = "a725-css";
  s.textContent = [
    "html.a725-lock,html.a725-lock body{overflow:hidden}",
    ".a725-ov{position:fixed;inset:0;z-index:1300;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}",
    ".a725-m{width:min(820px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(15,23,42,.35);display:flex;flex-direction:column;overflow:hidden;min-width:0;font-size:13px;color:#0f172a}",
    ".a725-h{display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(90deg,#e7f8ee,#f3fcf6);border-bottom:1px solid #bbf7d0;flex:none}",
    ".a725-h b{font-size:17px;color:#14532d}.a725-hj{color:#166534;font-weight:700;font-size:13.5px;min-width:0;overflow-wrap:anywhere}",
    ".a725-hi{width:34px;height:34px;border-radius:10px;background:#16a34a;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".a725-x{margin-left:auto;width:34px;height:34px;border-radius:9px;border:1px solid #cbd5e1;background:#fff;font-size:20px;line-height:1;cursor:pointer;color:#334155;flex:none}",
    ".a725-b{flex:1 1 auto;overflow:auto;padding:12px 16px;min-height:0;overscroll-behavior:contain}",
    ".a725-job{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 14px;border:1px solid #d9c8fb;border-radius:12px;background:#fbf8ff;padding:10px 14px;margin:0 0 10px}",
    ".a725-kv{display:flex;flex-direction:column;min-width:0}.a725-kv span{color:#64748b;font-size:12px}.a725-kv b{font-weight:800;color:#1e1b4b;overflow-wrap:anywhere}.a725-tot{font-style:normal;color:#14532d;font-size:15px}",
    ".a725-note{border:1px solid #fed7aa;background:#fff8ef;color:#9a3412;border-radius:10px;padding:8px 12px;margin:0 0 10px;line-height:1.5}",
    ".a725-warn{border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:10px;padding:8px 12px;margin:0 0 10px}.a725-ld{color:#64748b;padding:6px 2px}",
    ".a725-it{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 0 10px;background:#fff}",
    ".a725-it header{display:flex;align-items:center;gap:8px;padding:7px 12px;background:linear-gradient(90deg,#eaf2ff,#f6f9ff);color:#1e3a8a;font-size:14px}.a725-it header b{flex:1;min-width:0;overflow-wrap:anywhere}.a725-it header strong{white-space:nowrap}",
    ".a725-it .no{width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;font-weight:800;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;flex:none}",
    ".a725-ib{display:grid;grid-template-columns:minmax(0,45fr) minmax(0,55fr)}.a725-ib>div{padding:8px 12px;min-width:0}.a725-ib .c2{border-left:1px solid #e2e8f0;background:#fbf8ff}",
    ".a725-ib .c1>div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:6px;padding:2px 0}.a725-ib .c1 span{color:#475569}.a725-ib .c1 b{overflow-wrap:anywhere}",
    ".a725-sh{display:flex;align-items:center;gap:6px;font-weight:800;color:#3b0764;margin:0 0 6px}.a725-sh svg{color:#7c3aed}",
    ".a725-fr{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.a725-fr>i{display:flex;color:#dc2626}.a725-fr>span{flex:1 1 110px;min-width:0;border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:5px 8px;overflow-wrap:anywhere;font-style:italic}",
    ".a725-fr small{color:#64748b;font-style:normal}.a725-fm{color:#64748b;font-size:11.5px;margin-top:4px}",
    ".a725-fb{min-height:32px;border-radius:8px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;font-weight:700;font-size:12.5px;padding:0 10px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-family:inherit;white-space:nowrap}",
    ".a725-fb.x{border-color:#fecaca;background:#fef2f2;color:#dc2626}.a725-fb:disabled{opacity:.55;cursor:not-allowed}",
    ".a725-no{color:#64748b;margin:0 0 6px}.a725-up{color:#4338ca;font-weight:600}.a725-hint{display:block;color:#64748b;font-size:11.5px;margin-top:4px}",
    ".a725-at{min-height:34px;border-radius:8px;border:1px solid #7c3aed;background:#7c3aed;color:#fff;font-weight:700;font-size:13px;padding:0 12px;display:inline-flex;align-items:center;gap:5px;cursor:pointer}",
    ".a725-f{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;flex:none;flex-wrap:wrap}",
    ".a725-st{flex:1 1 200px;min-width:0;font-size:12.5px;color:#475569;overflow-wrap:anywhere}.a725-st.e{color:#b91c1c;font-weight:600}.a725-st.o{color:#15803d;font-weight:600}",
    ".a725-btn{min-height:40px;border-radius:10px;padding:0 16px;font-weight:800;font-size:14px;font-family:inherit;cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#334155;display:inline-flex;align-items:center;justify-content:center;gap:6px}",
    ".a725-btn.g{background:#16a34a;border-color:#16a34a;color:#fff}.a725-btn.d{background:#dc2626;border-color:#dc2626;color:#fff}.a725-btn:disabled{opacity:.55;cursor:not-allowed}",
    ".a725-ask{position:fixed;inset:0;z-index:1400;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}",
    ".a725-ab{width:min(440px,100%);background:#fff;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.35);padding:16px;font-size:13.5px;color:#0f172a}",
    ".a725-ah{display:flex;align-items:center;gap:8px;color:#b91c1c;font-size:16px}",
    ".a725-ac{margin:10px 0 14px;line-height:1.55;overflow-wrap:anywhere}.a725-ac small{display:block;color:#64748b;font-size:12px;margin-top:6px}",
    ".a725-aa{display:flex;gap:8px;justify-content:flex-end}",
    "@media (max-width:760px){.a725-h{flex-wrap:wrap;row-gap:2px}.a725-h b{white-space:nowrap}.a725-hj{order:3;flex-basis:100%;padding-left:44px;font-size:12.5px}.a725-ov{padding:8px}.a725-m{max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);border-radius:14px}.a725-h{padding:10px 12px}.a725-h b{font-size:15.5px}",
    ".a725-b{padding:10px}.a725-job{grid-template-columns:repeat(2,minmax(0,1fr));padding:8px 10px}.a725-ib{grid-template-columns:minmax(0,1fr)}.a725-ib .c2{border-left:0;border-top:1px solid #e2e8f0}",
    ".a725-ib .c1>div{grid-template-columns:88px minmax(0,1fr)}.a725-fb,.a725-at{min-height:42px;font-size:13.5px}.a725-fr .a725-fb{flex:1 1 auto;justify-content:center}",
    ".a725-f{padding:10px 12px calc(10px + env(safe-area-inset-bottom))}.a725-st{flex-basis:100%}.a725-f .a725-btn{flex:1 1 0;min-height:46px}.a725-aa .a725-btn{flex:1 1 0;min-height:44px}}"
  ].join("");
  document.head.appendChild(s);
}
