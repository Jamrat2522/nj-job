/* ═══ V.836 (RUN-836) · FLOW B — ข้อมูลระบบเก่า (UPLOAD EXCEL)
   (1) FINANCE → ADVANCE แถบย่อย "ระบบเก่า (UPLOAD EXCEL)" : UPLOAD EXCEL (SUPER_ADMIN) · รอรับชำระ · ออก RECEIPT ADVANCE (ADV) · ใบเสร็จที่ออกแล้ว · PDF (Template RECEIPT ADVANCE เดิม)
   (2) หน้าต่าง "ตรวจสอบ / แก้ไข CUSTOMER" (ใช้ร่วม FINANCE → RECEIPT SERVICE และ FINANCE → ADVANCE) — ยืนยันต่อชื่อลูกค้าใน Excel · ไม่สร้าง / ไม่แก้ Customer Master
   FLOW A (ACCOUNTING) ไม่ผ่านไฟล์นี้ · ทุกการบันทึกตรวจสิทธิ์ / ข้อมูลซ้ำที่ Server (RUN-836) ═══ */
import { m as RPC } from "./chunk-SGWIBJH6.js";
import { a as TOAST } from "./chunk-OFOOXWUM.js";
import { a as MODAL, b as MCLOSE } from "./chunk-LNP7HEMP.js";
import { e as ESC } from "./chunk-NQOCXXA2.js";
import { a as XLSX836 } from "./chunk-FHYZBT2Q.js";
import { a as APP } from "./chunk-GDT6F23K.js";
import { a as PGN } from "./chunk-6REVCVGI.js";

const n = (v) => ESC(v == null ? "" : String(v));
const M = (v) => { let x = Number(v); return isFinite(x) ? x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"; };
const N = (v) => { let x = Number(v); return isFinite(x) ? x.toLocaleString("th-TH") : "0"; };
const D = (v) => { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; };
const TX = (v) => (v == null ? "" : String(v).replace(/ /g, " ").trim());
const NH = (h) => String(h == null ? "" : h).toLowerCase().replace(/[\s._\-\/()#:*]+/g, "");
const SA = () => String(APP.profile && APP.profile.role) === "SUPER_ADMIN";
const RQ = (p) => { try { return p + "-" + crypto.randomUUID(); } catch (e) { return p + "-" + Date.now() + "-" + Math.random().toString(36).slice(2); } };
const TD = () => { let d = new Date(), p = (x) => String(x).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); };

export function RE836(e) {   /* ข้อความ Error จาก Server → ภาษาไทย */
  let m = String((e && (e.message || e.error_description || e.details)) || e || "");
  if (/PGRST202|schema cache|Could not find the function/i.test(m) && /836/.test(m)) return "ระบบฐานข้อมูลยังไม่พร้อม (ต้องรัน RUN-836)";
  if (/NJACC_MODULE_FORBIDDEN|NJACC_FORBIDDEN/.test(m)) return "ไม่มีสิทธิ์ทำรายการนี้";
  if (/NJACC_CUST836_REQUIRED/.test(m)) return "ยังไม่ได้ตรวจสอบ / ยืนยัน CUSTOMER — กด “ตรวจสอบ / แก้ไข CUSTOMER” ก่อนออกใบเสร็จ";
  if (/NJACC_CUST836_INVALID/.test(m)) { let j = m.replace(/^.*NJACC_CUST836_INVALID:\s*/, ""); try { return "ข้อมูลลูกค้าไม่ครบ / ไม่ถูกต้อง : " + JSON.parse(j).join(" · "); } catch (x) { return "ข้อมูลลูกค้าไม่ครบ / ไม่ถูกต้อง"; } }
  if (/NJACC_CUST836_CHANGED/.test(m)) return "มีผู้ใช้อื่นแก้ไขข้อมูลลูกค้านี้แล้ว — โหลดข้อมูลล่าสุดแล้ว กรุณาตรวจสอบอีกครั้ง";
  if (/NJACC_CUST836_NO_EXCEL/.test(m)) return "ไม่พบชื่อลูกค้านี้ในรายการ UPLOAD EXCEL";
  if (/NJACC_RADV_CHANGED|NJACC_RCP_CHANGED/.test(m)) return "ข้อมูลเปลี่ยนแปลงหลังดูตัวอย่าง (ยอด / ลูกค้า) — โหลดข้อมูลล่าสุดแล้ว กรุณาดูตัวอย่างใหม่";
  if (/NJACC_RADV_INVALID/.test(m)) return "มีรายการที่ออกใบเสร็จไม่ได้ (ออกแล้ว / รอตรวจสอบ) — โหลดข้อมูลล่าสุดแล้ว";
  if (/NJACC_RADV_DATE_BEFORE_START/.test(m)) return "วันที่เอกสารต้องตั้งแต่ 01/11/2026";
  if (/NJACC_RADV_LOCKED/.test(m)) return "รายการออกใบเสร็จแล้ว — แก้ไข / ลบไม่ได้";
  if (/NJACC_AX836_CHANGED/.test(m)) return "มีผู้อื่นบันทึกข้อมูลเดียวกันระหว่างนี้ — กรุณา UPLOAD ใหม่อีกครั้ง";
  if (/NJACC_AX836_INVALID/.test(m)) return "ข้อมูลในไฟล์ไม่ถูกต้อง : " + m.replace(/^.*NJACC_AX836_INVALID:\s*/, "").slice(0, 300);
  return m.replace(/^.*?NJACC_[A-Z0-9_]+:\s*/, "") || "เกิดข้อผิดพลาด";
}

function ST836() {
  if (document.getElementById("st836")) return;
  let s = document.createElement("style"); s.id = "st836";
  s.textContent = [
    ".hd836{display:none!important}",
    ".l836-sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 4px;font-size:13px}.l836-sw>span{font-weight:700;color:#475569}",
    ".l836-sw button{border:1px solid #cbd5e1;background:#fff;color:#0f2a4d;border-radius:999px;padding:5px 14px;font-weight:700;cursor:pointer;font-size:13px}",
    ".l836-sw button.on{background:#0f2a4d;color:#fff;border-color:#0f2a4d}",
    ".btn.up836{background:#ea580c!important;border:1px solid #ea580c!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.up836:hover:not(:disabled){background:#c2410c!important}.btn.up836:disabled{opacity:.6;cursor:wait}",
    ".btn.rp836{background:#1e3a8a!important;border:1px solid #1e3a8a!important;color:#fff!important;font-weight:700;white-space:nowrap}.btn.rp836:disabled{opacity:.5}",
    ".btn.cu836{background:#fff!important;border:1px solid #0f766e!important;color:#0f766e!important;font-weight:700;white-space:nowrap}",
    ".p836 .fbar{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}.p836 .fl836{display:flex;flex-direction:column;gap:2px;font-size:12px;color:#475569}.p836 .fl836 .inp,.p836 .fl836 .sel{min-width:120px}",
    ".p836 .fl836-q .inp{min-width:240px}.sum836{display:flex;flex-wrap:wrap;gap:14px;margin:8px 0;font-size:13px;color:#334155}.sum836 b{color:#0f2a4d}",
    ".t836 td,.t836 th{font-size:12.5px;vertical-align:top}.t836 .r{text-align:right}.t836 .why836{color:#b45309;font-size:11.5px;display:block;max-width:260px}",
    ".bd836{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}.bd836.ok{background:#dcfce7;color:#15803d}.bd836.need{background:#fef3c7;color:#b45309}.bd836.bad{background:#fee2e2;color:#b91c1c}",
    ".sel836{display:inline-flex;gap:8px;align-items:center;font-size:12.5px;color:#0f2a4d;font-weight:700}",
    ".c836-ov{position:fixed;inset:0;z-index:3300;background:rgba(15,23,42,.55);display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto}",
    ".c836-b{background:#fff;border-radius:12px;max-width:760px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,.3);font-size:13.5px;color:#0f172a}",
    ".c836-h{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e2e8f0}.c836-h h3{margin:0;font-size:16px}",
    ".c836-c{padding:12px 16px;display:grid;gap:10px}.c836-f{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 16px;border-top:1px solid #e2e8f0}",
    ".c836-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c836-g label,.c836-c label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:#475569;font-weight:700}",
    ".c836-c .inp,.c836-c .sel,.c836-c textarea{width:100%;box-sizing:border-box}.c836-c textarea{min-height:64px;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font:inherit}",
    ".c836-ro{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px;font-weight:600;color:#0f172a}",
    ".c836-cands{max-height:180px;overflow:auto;border:1px solid #e2e8f0;border-radius:6px}.c836-cand{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #f1f5f9;background:#fff;padding:6px 8px;cursor:pointer;font-size:12.5px}",
    ".c836-cand:hover,.c836-cand.on{background:#eff6ff}.c836-cand small{display:block;color:#64748b}",
    ".c836-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:6px;padding:6px 10px;font-size:12.5px}.c836-ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:6px;padding:6px 10px;font-size:12.5px}",
    ".c836-hist{font-size:12px;color:#475569;max-height:140px;overflow:auto}.c836-hist table{width:100%;border-collapse:collapse}.c836-hist td{border-top:1px solid #f1f5f9;padding:3px 4px;vertical-align:top}",
    ".c836-src{display:flex;gap:14px;flex-wrap:wrap}.c836-src label{flex-direction:row;align-items:center;gap:6px;font-weight:600;color:#0f172a}",
    ".u836-pb{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.u836-pb>i{display:block;height:100%;background:#16a34a;width:0;transition:width .2s}",
    ".u836 table{width:100%;border-collapse:collapse;font-size:12.5px}.u836 td,.u836 th{border-top:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:top}.u836 .r{text-align:right}",
    ".u836-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:8px 0}.u836-k>div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px}.u836-k b{display:block;font-size:18px;color:#0f2a4d}",
    ".g836{border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:10px 0}.g836-h{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-weight:700}",
    ".cb836{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12.5px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:8px;margin:8px 0}.cb836 span{color:#64748b}",
    "@media (max-width:640px){.c836-g{grid-template-columns:1fr}.p836 .fl836-q .inp{min-width:0;width:100%}.p836 .fl836{flex:1 1 100%}.c836-ov{padding:6px}.l836-sw button{flex:1 1 0}}"
  ].join("");
  document.head.appendChild(s);
}

/* ══════════ (2) CUSTOMER ══════════ */
const TYPES = [["JURISTIC", "นิติบุคคล"], ["PERSON", "บุคคลธรรมดา"], ["FOREIGN", "ต่างประเทศ"]];
export function CHK836(t, nm, ad, tx, br) {   /* กติกาเดียวกับ njacc_cust836_chk (Server ตรวจซ้ำ) */
  let o = [], s = (v) => String(v == null ? "" : v).trim();
  if (!TYPES.some((x) => x[0] === t)) o.push("ประเภทลูกค้า");
  if (!s(nm)) o.push("CUSTOMER NAME");
  if (!s(ad)) o.push("ADDRESS");
  if (t === "JURISTIC" && !/^\d{13}$/.test(s(tx))) o.push("TAX ID (นิติบุคคล = ตัวเลข 13 หลัก)");
  if (t === "PERSON" && !/^\d{13}$/.test(s(tx))) o.push("TAX ID (บุคคลธรรมดา = เลขประจำตัว 13 หลัก)");
  if (t === "FOREIGN" && s(tx).length > 30) o.push("TAX ID (ไม่เกิน 30 ตัวอักษร)");
  if (t === "JURISTIC" && !/^\d{5}$/.test(s(br))) o.push("BRANCH (ตัวเลข 5 หลัก · สำนักงานใหญ่ = 00000)");
  if (t === "PERSON" && s(br) && !/^\d{5}$/.test(s(br))) o.push("BRANCH (เว้นว่าง หรือ ตัวเลข 5 หลัก)");
  if (t === "FOREIGN" && s(br).length > 20) o.push("BRANCH (ไม่เกิน 20 ตัวอักษร)");
  return o;
}
const STL = { CONFIRMED: ["ok", "ยืนยันแล้ว"], INVALID: ["bad", "ข้อมูลไม่ครบ"], SUGGEST: ["need", "พบใน Master — รอยืนยัน"], MULTI: ["need", "พบหลายรายการ — เลือก"], NONE: ["bad", "ไม่พบใน Master — กรอกเอง"] };

/* เปิดหน้าต่างตรวจสอบ / แก้ไข CUSTOMER (ซ้อนเหนือหน้าต่างอื่นได้) · คืน true เมื่อมีการบันทึก */
export function cust836(keys, opts) {
  ST836(); opts = opts || {};
  keys = [...new Set([].concat(keys || []).map((k) => String(k || "").trim().toUpperCase()).filter(Boolean))];
  if (!keys.length) return Promise.resolve(false);
  return new Promise((res) => {
    let saved = false, data = {}, cur = keys[0], form = {};
    let ov = document.createElement("div"); ov.className = "c836-ov"; ov.id = "c836-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = `<div class="c836-b"><div class="c836-h"><h3>ตรวจสอบ / แก้ไข CUSTOMER</h3><button type="button" class="btn-icon" data-x836 aria-label="ปิด">✕</button></div>
      <div class="c836-c" id="c836-c"><div class="load-row"><div class="spin"></div></div></div>
      <div class="c836-f"><button type="button" class="btn btn-o" data-x836>ปิด</button><button type="button" class="btn btn-p" id="c836-save" disabled>✅ บันทึก / ยืนยัน CUSTOMER</button></div></div>`;
    document.body.appendChild(ov);
    let C = ov.querySelector("#c836-c"), SV = ov.querySelector("#c836-save");
    let close = () => { document.removeEventListener("keydown", key, !0); ov.remove(); res(saved); };
    let key = (ev) => { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); } };
    document.addEventListener("keydown", key, !0);
    ov.addEventListener("click", (ev) => { if (ev.target === ov || (ev.target.closest && ev.target.closest("[data-x836]"))) close(); });
    let val = (id) => { let e = C.querySelector("#" + id); return e ? String(e.value || "").trim() : ""; };
    let check = () => {
      let t = val("c836-type"), p = CHK836(t, val("c836-name"), val("c836-addr"), t === "FOREIGN" ? val("c836-tax") : val("c836-tax").replace(/[\s-]/g, ""), t === "FOREIGN" ? val("c836-br") : val("c836-br").replace(/\s/g, ""));
      let box = C.querySelector("#c836-v"); box && (box.innerHTML = p.length ? `<div class="c836-err"><b>ข้อมูลที่ขาด / ไม่ถูกต้อง :</b> ${p.map(n).join(" · ")}</div>` : '<div class="c836-ok">ข้อมูลครบ พร้อมบันทึก</div>');
      SV.disabled = !!p.length; return p;
    };
    let fill = (o) => {
      [["c836-name", o.name], ["c836-addr", o.address], ["c836-tax", o.tax_id], ["c836-br", o.branch_code]].forEach(([id, v]) => { let e = C.querySelector("#" + id); e && (e.value = v == null ? "" : String(v)); });
      if (o.cust_type) C.querySelector("#c836-type").value = o.cust_type;
      check();
    };
    let draw = () => {
      let d = data[cur] || {}, m = d.mapping, st = STL[d.status] || ["need", d.status || "-"];
      form.cid = m ? m.customer_id : null; form.src = m ? (m.source === "MASTER" ? "MASTER" : "MANUAL") : (d.status === "NONE" ? "MANUAL" : "MASTER");
      let ci = [...new Set([].concat(d.company_invoices || [], opts.company && opts.company[cur] || []))].filter(Boolean);
      C.innerHTML = (keys.length > 1 ? `<label>ชื่อลูกค้าใน Excel (${keys.length} ชื่อ)<select class="sel" id="c836-key">${keys.map((k) => `<option value="${n(k)}"${k === cur ? " selected" : ""}>${n(k)} — ${n((STL[(data[k] || {}).status] || ["", ""])[1])}</option>`).join("")}</select></label>` : "")
        + `<div class="c836-g"><label>CUSTOMER NAME (Excel)<div class="c836-ro">${n(cur)}</div></label><label>สถานะ<div class="c836-ro"><span class="bd836 ${st[0]}">${n(st[1])}</span>${m ? ` <small>ver ${n(m.ver)} · ${n(m.updated_by_name || "")} ${n(String(m.updated_at || "").slice(0, 16).replace("T", " "))}</small>` : ""}</div></label></div>`
        + `<label>COMPANY INVOICE (แสดงอย่างเดียว)<div class="c836-ro">${ci.length ? n(ci.join(", ")) : "-"}</div></label>`
        + `<div class="c836-src"><label><input type="radio" name="c836-src" value="MASTER"${form.src === "MASTER" ? " checked" : ""}> เลือกจาก Customer Master</label><label><input type="radio" name="c836-src" value="MANUAL"${form.src === "MANUAL" ? " checked" : ""}> กรอกเอง</label></div>`
        + `<div id="c836-ms"${form.src === "MASTER" ? "" : " hidden"}><label>ค้นหา Customer Master (ชื่อ / รหัส / TAX ID)<input class="inp" id="c836-q" placeholder="พิมพ์เพื่อค้นหา" autocomplete="off"></label>`
        + `<div class="c836-cands" id="c836-cands">${CAND(d.candidates || [], form.cid)}</div></div>`
        + `<div class="c836-g"><label>ประเภทลูกค้า <span class="req">*</span><select class="sel" id="c836-type">${TYPES.map((t) => `<option value="${t[0]}">${t[1]}</option>`).join("")}</select></label><label>CUSTOMER NAME <span class="req">*</span><input class="inp" id="c836-name" maxlength="300"></label></div>`
        + `<label>ADDRESS <span class="req">*</span><textarea id="c836-addr" maxlength="1000"></textarea></label>`
        + `<div class="c836-g"><label>TAX ID <span class="req" id="c836-taxr">*</span><input class="inp" id="c836-tax" maxlength="30" inputmode="numeric"></label><label>BRANCH <span class="req" id="c836-brr">*</span><input class="inp" id="c836-br" maxlength="20" placeholder="00000 = สำนักงานใหญ่"></label></div>`
        + `<div id="c836-v"></div><small style="color:#64748b">บันทึกเฉพาะข้อมูลลูกค้าสำหรับใบเสร็จของรายการ UPLOAD EXCEL (ชื่อ “${n(cur)}”) — ไม่แก้ Customer Master · ใช้ซ้ำทุก INVOICE ของชื่อนี้ทั้ง SERVICE และ ADVANCE</small>`
        + `<div class="c836-hist"><b>ประวัติการแก้ไข</b>${(d.hist || []).length ? `<table>${d.hist.map((h) => `<tr><td>${n(String(h.at || "").slice(0, 19).replace("T", " "))}</td><td>${n(h.by || "")}</td><td>${h.old ? n((h.old.name || "") + " · " + (h.old.tax_id || "-") + " / " + (h.old.branch_code || "-")) + " → " : ""}${n((h.new && h.new.name || "") + " · " + (h.new && h.new.tax_id || "-") + " / " + (h.new && h.new.branch_code || "-"))}</td></tr>`).join("")}</table>` : " <span>— ยังไม่มี —</span>"}</div>`;
      let ex = (d.candidates || []).find((c) => c.exact);
      if (m) fill(m);
      else if (d.status === "SUGGEST" && ex) { form.cid = ex.id; fill({ cust_type: "JURISTIC", name: ex.name, address: ex.address, tax_id: ex.tax_id, branch_code: ex.branch_code }); }
      else fill({ cust_type: "JURISTIC" });
      let ks = C.querySelector("#c836-key"); ks && (ks.onchange = () => { cur = ks.value; draw(); });
      C.querySelectorAll('input[name="c836-src"]').forEach((r) => { r.onchange = () => { form.src = r.value; C.querySelector("#c836-ms").hidden = r.value !== "MASTER"; if (r.value === "MANUAL") form.cid = null; }; });
      ["c836-type", "c836-name", "c836-addr", "c836-tax", "c836-br"].forEach((id) => { let e = C.querySelector("#" + id); e && e.addEventListener("input", check); e && e.addEventListener("change", () => { if (id === "c836-type") { let f = C.querySelector("#c836-type").value === "FOREIGN"; C.querySelector("#c836-taxr").hidden = f; C.querySelector("#c836-brr").hidden = f || C.querySelector("#c836-type").value === "PERSON"; } check(); }); });
      let pick = (id) => {
        let c = ((data[cur] || {}).candidates || []).concat(form.found || []).find((z) => z.id === id); if (!c) return;
        form.cid = c.id; form.src = "MASTER"; C.querySelectorAll(".c836-cand").forEach((b) => b.classList.toggle("on", b.dataset.cid === id));
        fill({ cust_type: (C.querySelector("#c836-type").value || "JURISTIC"), name: c.name, address: c.address, tax_id: c.tax_id || c.citizen_id, branch_code: c.branch_code });
      };
      C.querySelector("#c836-cands").onclick = (ev) => { let b = ev.target.closest && ev.target.closest("[data-cid]"); b && pick(b.dataset.cid); };
      let qt = 0, qi = C.querySelector("#c836-q");
      qi && (qi.oninput = () => { clearTimeout(qt); qt = setTimeout(async () => { let q = qi.value.trim(); if (!q) { C.querySelector("#c836-cands").innerHTML = CAND((data[cur] || {}).candidates || [], form.cid); return; }
        try { let r = await RPC("njacc_cust836_search", { p: { q } }); form.found = r || []; C.querySelector("#c836-cands").innerHTML = CAND(form.found, form.cid) || '<div style="padding:6px 8px;color:#64748b">ไม่พบ — เลือก “กรอกเอง”</div>'; } catch (e) { TOAST("ค้นหาไม่สำเร็จ — " + RE836(e), "err"); } }, 300); });
    };
    let load = async (k) => {
      try { let r = await RPC("njacc_cust836_get", { p: { keys } }); (r || []).forEach((x) => { data[x.customer_key] = x; }); if (k) cur = k; draw(); }
      catch (e) { C.innerHTML = `<div class="c836-err">${n(RE836(e))}</div>`; }
    };
    SV.onclick = async () => {
      if (SV.disabled || check().length) return;
      let d = data[cur] || {}, t = val("c836-type");
      SV.disabled = !0; let lb = SV.textContent; SV.textContent = "กำลังบันทึก…";
      try {
        await RPC("njacc_cust836_save", { p: { customer_key: cur, excel_name: cur, customer_id: form.src === "MASTER" ? form.cid : null, cust_type: t, name: val("c836-name"), address: val("c836-addr"),
          tax_id: val("c836-tax"), branch_code: val("c836-br"), ver: d.mapping ? d.mapping.ver : null } });
        saved = !0; TOAST("บันทึก CUSTOMER “" + cur + "” แล้ว", "ok");
        let nx = keys.find((k) => k !== cur && !["CONFIRMED"].includes((data[k] || {}).status));
        await load(cur);
        if (nx) { cur = nx; draw(); } else if (opts.closeOnSave !== !1) close();
      } catch (e) { TOAST(RE836(e), "err"); /CHANGED/.test(String(e && e.message || e)) && (await load(cur)); }
      finally { SV.textContent = lb; check(); }
    };
    load();
  });
}
function CAND(a, cid) {
  return (a || []).map((c) => `<button type="button" class="c836-cand${c.id === cid ? " on" : ""}" data-cid="${n(c.id)}"><b>${n(c.name || "-")}</b>${c.exact ? ' <span class="bd836 ok">ตรงชื่อ / รหัส</span>' : ""}<small>รหัส ${n(c.code || "-")} · TAX ID ${n(c.tax_id || c.citizen_id || "-")} · BRANCH ${n(c.branch_code || "-")} · ${n(c.address || "-")}</small></button>`).join("");
}

/* ══════════ (1) FINANCE → ADVANCE : ระบบเก่า (UPLOAD EXCEL) ══════════ */
const S = { q: "", view: "all", customer_key: "", from: "", to: "", page: 1, size: 50, iq: "", ifrom: "", ito: "", ipage: 1, isize: 20 };
const SEL = new Map();
let CTX = null, PERM = { issue: !1, upload: !1 }, TK = 0;

export function mount836(host, ctx) {
  ST836(); CTX = Object.assign({}, CTX || {}, ctx || {}, { host });
  let tab = CTX.tab === "issued" ? "issued" : "pending";
  if (host.__tab836 !== tab || !host.__b836) {
    host.__tab836 = tab; host.__b836 = 1;
    host.innerHTML = tab === "issued" ? HI() : HP();
    tab === "issued" ? AI(host) : AP(host);
  }
  return tab === "issued" ? LI(host) : LP(host);
}
export function reload836() { let h = CTX && CTX.host; h && h.isConnected && (h.__tab836 === "issued" ? LI(h) : LP(h)); }

function UB(id) { return SA() ? `<button type="button" class="btn btn-sm up836" ${id ? `id="${id}"` : ""} data-up836 title="UPLOAD EXCEL — ADVANCE ระบบเก่า (.xlsx / .xls · เลือกได้หลายไฟล์ · SUPER_ADMIN)">⬆ UPLOAD EXCEL</button>` : ""; }
function HP() {
  return `<div class="ch-panel p836-in"><div class="fbar">`
    + `<label class="fl836 fl836-q"><span>ค้นหา</span><input class="inp" data-a836="q" value="${n(S.q)}" placeholder="INVOICE ADV / ลูกค้า / บริษัท / Customer Job No. / Invoice No. * / Billing Note / CASE / วันที่" autocomplete="off"></label>`
    + `<label class="fl836"><span>สถานะ</span><select class="sel" data-a836="view"><option value="all">ทั้งหมด</option><option value="ready">พร้อมออกใบเสร็จ</option><option value="review">รอตรวจสอบ</option></select></label>`
    + `<label class="fl836"><span>ลูกค้า (Excel)</span><select class="sel" data-a836="customer_key"><option value="">ทั้งหมด</option></select></label>`
    + `<label class="fl836"><span>Date invoice ตั้งแต่</span><input class="inp" type="date" data-a836="from" value="${n(S.from)}"></label>`
    + `<label class="fl836"><span>ถึง</span><input class="inp" type="date" data-a836="to" value="${n(S.to)}"></label>`
    + `<button type="button" class="btn btn-o btn-sm" data-clr836>ล้างค้นหา</button>${UB("l836-up")}`
    + `<button type="button" class="btn btn-sm xl734" data-xl836>⬇ EXPORT EXCEL</button>`
    + `<button type="button" class="btn btn-sm rp836" id="l836-rp" disabled hidden>🧾 RECEIPT ADVANCE PDF</button>`
    + `<button type="button" class="btn btn-sm cu836" id="l836-cu" title="ตรวจสอบ / แก้ไข CUSTOMER ของรายการที่เลือก (หรือของลูกค้าที่กรอง)">ตรวจสอบ / แก้ไข CUSTOMER</button>`
    + `<span class="sel836" id="l836-si"></span><button type="button" class="btn btn-sm btn-o" id="l836-clr" disabled>ล้างรายการที่เลือก</button></div>`
    + `<div class="sum836" id="l836-sum"></div><div class="card mt-2" id="l836-pgn"></div>`
    + `<div class="tbl-wrap lp-scroll"><table class="tbl t836"><thead><tr><th class="center"><input type="checkbox" id="l836-all" aria-label="เลือกทั้งหน้า"></th><th>INVOICE ADV ระบบเก่า</th><th>Date invoice</th><th>ลูกค้า</th><th>บริษัท INVOICE</th><th>Customer Job No.</th><th>Invoice No. *</th><th class="r">ยอด ADVANCE</th><th class="r">ยอดรวมสำหรับตรวจสอบ</th><th>Billing Note no.</th><th>CASE</th><th>สถานะ</th></tr></thead>`
    + `<tbody id="l836-tb"><tr><td colspan="12" class="load-row"><div class="spin"></div></td></tr></tbody></table></div></div>`;
}
function HI() {
  return `<div class="ch-panel p836-in"><div class="fbar">`
    + `<label class="fl836 fl836-q"><span>ค้นหา</span><input class="inp" data-i836="iq" value="${n(S.iq)}" placeholder="เลขใบเสร็จ / INVOICE ADV / ลูกค้า / บริษัท / Customer Job No. / วันที่" autocomplete="off"></label>`
    + `<label class="fl836"><span>วันที่ออก ตั้งแต่</span><input class="inp" type="date" data-i836="ifrom" value="${n(S.ifrom)}"></label>`
    + `<label class="fl836"><span>ถึง</span><input class="inp" type="date" data-i836="ito" value="${n(S.ito)}"></label>`
    + `<button type="button" class="btn btn-o btn-sm" data-iclr836>ล้างค้นหา</button><button type="button" class="btn btn-sm xl734" data-ixl836>⬇ EXPORT EXCEL</button>${UB("")}</div>`
    + `<div class="sum836" id="l836-isum"></div><div class="card mt-2" id="l836-ipgn"></div>`
    + `<div class="tbl-wrap lp-scroll"><table class="tbl t836"><thead><tr><th>เลขที่ใบเสร็จ</th><th>วันที่ออก</th><th>Customer</th><th class="center">จำนวน INVOICE</th><th class="r">ยอดรวม</th><th>สถานะ</th><th class="center col-act">จัดการ</th></tr></thead>`
    + `<tbody id="l836-itb"><tr><td colspan="7" class="load-row"><div class="spin"></div></td></tr></tbody></table></div></div>`;
}
function filt() { return { q: S.q || null, view: S.view, customer_key: S.customer_key || null, from: S.from || null, to: S.to || null }; }
function sync(host) {
  let cnt = SEL.size, sum = 0; SEL.forEach((r) => { sum += Math.round(Number(r.advance_amount || 0) * 100); });
  let rp = host.querySelector("#l836-rp"), si = host.querySelector("#l836-si"), cl = host.querySelector("#l836-clr");
  rp && (rp.hidden = !PERM.issue, rp.disabled = !cnt, rp.textContent = "🧾 RECEIPT ADVANCE PDF" + (cnt ? " (" + cnt + ")" : ""));
  si && (si.textContent = cnt ? "เลือก " + N(cnt) + " รายการ · ADVANCE รวม " + M(sum / 100) : "");
  cl && (cl.disabled = !cnt);
  let cbs = [...host.querySelectorAll(".l836-cb")], all = host.querySelector("#l836-all");
  all && (all.checked = cbs.length > 0 && cbs.every((c) => c.checked), all.indeterminate = !all.checked && cbs.some((c) => c.checked), all.disabled = !cbs.length || !PERM.issue);
}
function CS(r) {
  let s = r.cust_status === "OK" ? ["ok", "CUSTOMER ✓"] : r.cust_status === "INVALID" ? ["bad", "CUSTOMER ไม่ครบ"] : ["need", "ยังไม่ยืนยัน CUSTOMER"];
  return `<span class="bd836 ${s[0]}" title="${n(r.cust_name || "")}">${s[1]}</span>`;
}
function RW(r) {
  let id = n(r.id), ok = !r.reason && PERM.issue;
  return `<tr data-ax="${id}"><td class="center" data-l="เลือก">${ok ? `<input type="checkbox" class="l836-cb" data-ax836="${id}"${SEL.has(r.id) ? " checked" : ""} aria-label="เลือก ${n(r.invoice_no)}">` : `<span title="${n(r.reason || "ไม่มีสิทธิ์ออกใบเสร็จ")}">–</span>`}</td>`
    + `<td class="nowrap" data-l="INVOICE ADV ระบบเก่า"><b>${n(r.invoice_no)}</b></td><td class="nowrap" data-l="Date invoice">${D(r.doc_date) || "-"}</td>`
    + `<td data-l="ลูกค้า">${n(r.customer_name || "-")}<br>${CS(r)}</td><td data-l="บริษัท INVOICE">${n(r.company_invoice || "-")}</td><td data-l="Customer Job No.">${n(r.customer_job_no || "-")}</td>`
    + `<td data-l="Invoice No. *" style="max-width:220px;word-break:break-all">${n(r.source_invoice_no || "-")}</td><td class="r" data-l="ยอด ADVANCE"><b>${M(r.advance_amount)}</b></td><td class="r" data-l="ยอดรวมสำหรับตรวจสอบ">${M(r.total_check)}</td>`
    + `<td data-l="Billing Note no.">${n(r.billing_note || "-")}</td><td data-l="CASE">${n(r.case_no || "-")}</td>`
    + `<td data-l="สถานะ">${r.reason ? `<span class="bd836 need">รอตรวจสอบ</span><span class="why836">${n(r.reason)}</span>` : '<span class="bd836 ok">พร้อมออกใบเสร็จ</span>'}</td></tr>`;
}
async function LP(host) {
  let tk = ++TK, tb = host.querySelector("#l836-tb"); if (!tb) return;
  try {
    let r = await RPC("njacc_ax836_pending", { p: Object.assign(filt(), { page: S.page, size: S.size }) }); if (tk !== TK || !host.isConnected) return;
    PERM = r && r.perm || PERM; host.__rows836 = r && r.rows || [];
    let k = r && r.kpi || {}, cs = host.querySelector('[data-a836="customer_key"]');
    cs && (cs.innerHTML = '<option value="">ทั้งหมด</option>' + (r.customers || []).map((c) => `<option value="${n(c.key)}"${c.key === S.customer_key ? " selected" : ""}>${n(c.key)} (${N(c.count)})${c.status === "OK" ? "" : " · ยังไม่ยืนยัน"}</option>`).join(""));
    let vs = host.querySelector('[data-a836="view"]'); vs && (vs.value = S.view);
    host.querySelector("#l836-sum").innerHTML = `<span>รายการรอรับชำระ (ระบบเก่า) <b>${N(k.rows)}</b></span><span>พร้อมออก <b>${N(k.ready)}</b> · ADVANCE <b>${M(k.amount)}</b></span><span>รอตรวจสอบ <b>${N(k.review)}</b></span><span>ลูกค้ายังไม่ยืนยัน <b>${N(k.cust_missing)}</b> ชื่อ</span>`;
    tb.innerHTML = host.__rows836.length ? host.__rows836.map(RW).join("") : '<tr><td colspan="12" class="empty">ไม่มีรายการ — กด “⬆ UPLOAD EXCEL” เพื่อนำเข้าข้อมูล ADVANCE ระบบเก่า</td></tr>';
    PGN(host.querySelector("#l836-pgn"), { page: S.page, size: S.size, total: r && r.total || 0 }, ({ page: a, size: z }) => { S.page = a; S.size = z; LP(host); }, { lp: !0 });
    sync(host);
  } catch (e) {
    if (tk !== TK || !host.isConnected) return;
    tb.innerHTML = `<tr><td colspan="12" class="empty">โหลดรายการไม่สำเร็จ — ${n(RE836(e))} <button type="button" class="btn btn-sm btn-o" data-rt836>ลองใหม่</button></td></tr>`;
    let b = tb.querySelector("[data-rt836]"); b && (b.onclick = () => LP(host));
  }
}
function AP(host) {
  let tm = 0, run = () => { tm = 0; let o = {}; host.querySelectorAll("[data-a836]").forEach((e) => { o[e.dataset.a836] = String(e.value || "").trim(); }); Object.assign(S, o, { page: 1 }); LP(host); };
  let on = (ev) => { let e = ev.target; if (!e || !e.dataset || !e.dataset.a836 || ev.isComposing) return; clearTimeout(tm); tm = setTimeout(run, e.tagName === "INPUT" && e.type !== "date" ? 300 : 0); };
  host.addEventListener("input", on); host.addEventListener("change", (ev) => {
    let c = ev.target;
    if (c && c.classList && c.classList.contains("l836-cb")) { let r = (host.__rows836 || []).find((x) => x.id === c.dataset.ax836); c.checked && r ? SEL.set(r.id, r) : SEL.delete(c.dataset.ax836); sync(host); return; }
    if (c && c.id === "l836-all") { (host.__rows836 || []).forEach((r) => { if (r.reason || !PERM.issue) return; c.checked ? SEL.set(r.id, r) : SEL.delete(r.id); }); host.querySelectorAll(".l836-cb").forEach((x) => { x.checked = SEL.has(x.dataset.ax836); }); sync(host); return; }
    on(ev);
  });
  host.addEventListener("click", (ev) => {
    let b = ev.target.closest && ev.target.closest("[data-clr836],[data-xl836],#l836-rp,#l836-cu,#l836-clr"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-clr836")) { host.querySelectorAll("[data-a836]").forEach((e) => { e.value = ""; }); Object.assign(S, { q: "", view: "all", customer_key: "", from: "", to: "", page: 1 }); LP(host); }
    else if (b.hasAttribute("data-xl836")) XP(b);
    else if (b.id === "l836-rp") RO(host);
    else if (b.id === "l836-clr") { SEL.clear(); host.querySelectorAll(".l836-cb").forEach((x) => { x.checked = !1; }); sync(host); }
    else if (b.id === "l836-cu") {
      let ks = [...new Set([...SEL.values()].map((r) => r.customer_key).filter(Boolean))];
      if (!ks.length && S.customer_key) ks = [S.customer_key];
      if (!ks.length) ks = [...new Set((host.__rows836 || []).filter((r) => r.customer_key && r.cust_status !== "OK").map((r) => r.customer_key))].slice(0, 50);
      if (!ks.length) { TOAST("เลือกรายการ หรือเลือกลูกค้าในตัวกรองก่อน", "err"); return; }
      cust836(ks, { closeOnSave: !1 }).then((s) => { s && LP(host); });
    }
  });
}
async function LI(host) {
  let tk = ++TK, tb = host.querySelector("#l836-itb"); if (!tb) return;
  try {
    let r = await RPC("njacc_radv836_list", { p: { q: S.iq || null, from: S.ifrom || null, to: S.ito || null, page: S.ipage, size: S.isize } }); if (tk !== TK || !host.isConnected) return;
    let k = r && r.kpi || {};
    host.querySelector("#l836-isum").innerHTML = `<span>ใบเสร็จ (ระบบเก่า) <b>${N(k.receipts)}</b> ใบ</span><span>INVOICE <b>${N(k.invoices)}</b></span><span>ยอดรวม <b>${M(k.amount)}</b></span>`;
    let rows = r && r.rows || [];
    tb.innerHTML = rows.length ? rows.map((o) => { let id = n(o.receipt_id), no = n(o.receipt_no);
      return `<tr><td class="nowrap" data-l="เลขที่ใบเสร็จ"><b>${no}</b><span class="adv814" style="display:block;font-size:11px;color:#9a3412">UPLOAD EXCEL</span></td><td class="nowrap" data-l="วันที่ออก">${D(o.receipt_date)}</td><td data-l="Customer">${n(o.customer_name)}</td>`
        + `<td class="center" data-l="จำนวน INVOICE">${N(o.invoice_count)}</td><td class="r" data-l="ยอดรวม"><b>${M(o.total)}</b></td><td data-l="สถานะ"><span class="bdg789 bd836 ok">ออกใบเสร็จแล้ว</span></td>`
        + `<td class="center nowrap col-act" data-l="จัดการ"><button type="button" class="btn btn-sm" data-it836="${id}">รายการ</button> <button type="button" class="btn btn-sm" data-pv836="${id}">PREVIEW</button> <button type="button" class="btn btn-sm" data-pr836="${id}">PRINT</button> <button type="button" class="btn btn-sm" data-sv836="${id}">SAVE PDF</button></td></tr>`; }).join("")
      : '<tr><td colspan="7" class="empty">ยังไม่มีใบเสร็จ (ระบบเก่า)</td></tr>';
    PGN(host.querySelector("#l836-ipgn"), { page: S.ipage, size: S.isize, total: r && r.total || 0 }, ({ page: a, size: z }) => { S.ipage = a; S.isize = z; LI(host); }, { lp: !0 });
  } catch (e) {
    if (tk !== TK || !host.isConnected) return;
    tb.innerHTML = `<tr><td colspan="7" class="empty">โหลดรายการไม่สำเร็จ — ${n(RE836(e))}</td></tr>`;
  }
}
function AI(host) {
  let tm = 0, run = () => { let o = {}; host.querySelectorAll("[data-i836]").forEach((e) => { o[e.dataset.i836] = String(e.value || "").trim(); }); Object.assign(S, o, { ipage: 1 }); LI(host); };
  let on = (ev) => { let e = ev.target; if (!e || !e.dataset || !e.dataset.i836) return; clearTimeout(tm); tm = setTimeout(run, e.type === "date" ? 0 : 300); };
  host.addEventListener("input", on); host.addEventListener("change", on);
  host.addEventListener("click", async (ev) => {
    let b = ev.target.closest && ev.target.closest("[data-iclr836],[data-ixl836],[data-it836],[data-pv836],[data-pr836],[data-sv836]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-iclr836")) { host.querySelectorAll("[data-i836]").forEach((e) => { e.value = ""; }); Object.assign(S, { iq: "", ifrom: "", ito: "", ipage: 1 }); LI(host); return; }
    if (b.hasAttribute("data-ixl836")) { XI(b); return; }
    if (b.dataset.it836) { DT(b.dataset.it836); return; }
    let id = b.dataset.pv836 || b.dataset.pr836 || b.dataset.sv836; if (b.disabled) return; b.disabled = !0;
    try {
      let docs = await LD([id]), dp = CTX.deps;
      if (b.dataset.pv836) await dp.RW788(docs, { sample: !1, title: "RECEIPT ADVANCE " + docs[0].receipt_no + " (UPLOAD EXCEL)" }, null);
      else if (b.dataset.pr836) { dp.ST788(); dp.RX788(dp.RF788(docs[0], !1), "RECEIPT_ADVANCE_" + docs[0].receipt_no); }
      else await dp.SVH791(dp.RF788(docs[0], !1), "RECEIPT_ADVANCE_" + docs[0].receipt_no, null);
    } catch (e) { TOAST("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE836(e), "err"); }
    finally { b.disabled = !1; }
  });
}
export async function LD(ids) {   /* เอกสารที่บันทึก (สำเนา ณ เวลาออก) → รูปแบบ Template RECEIPT ADVANCE เดิม · ไม่ออกเลขใหม่ */
  let docs = [];
  for (let id of [].concat(ids || []).filter(Boolean)) {
    let r = await RPC("njacc_radv836_get", { p_id: id }), s = r && r.snapshot || {};
    docs.push({ receipt_no: r.receipt_no, receipt_date: r.receipt_date, payment_method: s.payment_method || r.payment_method, issuer: s.issuer || {}, customer: s.customer || {},
      items: s.items || [], total: s.total != null ? s.total : r.total, credit: s.credit, status: "ACTIVE" });
  }
  return docs;
}
async function DT(id) {
  try {
    let d = await RPC("njacc_radv836_items", { p_id: id }), c = d.customer || {}, it = d.items || [];
    let body = `<div class="u836"><div class="cb836"><span>เลขที่ใบเสร็จ</span><b>${n(d.receipt_no)}</b><span>วันที่ออก</span><b>${D(d.receipt_date)}</b><span>Customer</span><b>${n(c.name || d.customer_name)}</b>`
      + `<span>TAX ID / BRANCH</span><b>${n(c.tax_id || "-")} / ${n(c.branch_code || "-")}</b><span>ADDRESS</span><b>${n(c.address || "-")}</b><span>ชื่อใน Excel</span><b>${n((c.excel_names || []).join(", "))}</b></div>`
      + `<div class="tbl-wrap"><table><thead><tr><th>ลำดับ</th><th>INVOICE ADV ระบบเก่า</th><th>Date invoice</th><th>ลูกค้า (Excel)</th><th>บริษัท INVOICE</th><th>Customer Job No.</th><th class="r">Amount</th></tr></thead><tbody>`
      + it.map((z, j) => `<tr><td>${j + 1}</td><td>${n(z.invoice_no)}</td><td>${D(z.invoice_date)}</td><td>${n(z.customer_name || "-")}</td><td>${n(z.company_invoice || "-")}</td><td>${n(z.customer_job_no || "-")}</td><td class="r">${M(z.amount)}</td></tr>`).join("")
      + `</tbody><tfoot><tr><td colspan="6" class="r"><b>ยอดรวม (${N(it.length)} รายการ)</b></td><td class="r"><b>${M(d.total)}</b></td></tr></tfoot></table></div></div>`;
    let f = document.createElement("div"); f.innerHTML = '<button class="btn btn-o" data-close>ปิด</button>';
    MODAL({ title: "RECEIPT ADVANCE " + d.receipt_no + " — รายการ (UPLOAD EXCEL)", body, footer: f, wide: !0 });
  } catch (e) { TOAST("เปิดรายละเอียดใบเสร็จไม่สำเร็จ — " + RE836(e), "err"); }
}

/* ── ออก RECEIPT ADVANCE (ADV) จากรายการ Excel ที่เลือก ── */
async function RO(host) {
  let ids = [...SEL.keys()]; if (!ids.length) return;
  if (ids.length > 3000) { TOAST("เลือกได้สูงสุด 3,000 รายการต่อครั้ง", "err"); return; }
  let dp = CTX.deps, st = { pv: null, seen: !1, req: RQ("radv836"), busy: !1, done: null };
  let body = document.createElement("div"); body.className = "radv788-m";
  body.innerHTML = `<div id="r836-form"><div class="radv788-f"><label>วันที่เอกสาร <span class="req">*</span><input type="date" class="inp" id="r836-date" value="${TD()}" min="2026-11-01"></label>
    <label>วิธีรับชำระ <span class="req">*</span><select class="sel" id="r836-method"><option value="">— เลือก —</option>${(dp.PM788 || []).map((p) => `<option value="${p[0]}">${n(p[1])} (${n(p[2])})</option>`).join("")}</select></label></div>
    <div id="r836-sum" class="radv788-sum"><div class="load-row"><div class="spin"></div></div></div></div><div id="r836-doc" hidden></div>`;
  let foot = document.createElement("div"); foot.className = "radv788-foot";
  foot.innerHTML = '<button class="btn btn-o" data-close>ปิด</button><button class="btn btn-o" id="r836-pv" disabled>👁 ดูตัวอย่าง</button><button class="btn btn-p" id="r836-ok" disabled>✅ ยืนยันออก RECEIPT ADVANCE</button>';
  MODAL({ title: "RECEIPT ADVANCE — ใบรับเงินสำรองจ่าย (UPLOAD EXCEL ระบบเก่า)", body, footer: foot, fullscreen: !0, wide: !0 });
  let q = (s) => body.querySelector(s) || foot.querySelector(s), sum = q("#r836-sum"), pf = q("#r836-form"), pd = q("#r836-doc");
  let back = () => { pd.hidden = !0; pd.innerHTML = ""; pf.hidden = !1; };
  let need = () => !!(st.pv && st.pv.groups.some((g) => g.customer_status !== "OK"));
  let sc = () => {
    let ready = st.pv && st.pv.groups.length && q("#r836-date").value && q("#r836-method").value && !st.done;
    q("#r836-pv").disabled = !ready || st.busy;
    q("#r836-ok").disabled = !ready || st.pv.errors.length || need() || !st.seen || st.busy;
    q("#r836-ok").title = need() ? "กรุณาตรวจสอบ / ยืนยัน CUSTOMER ก่อน" : ready && !st.seen ? "กรุณากดดูตัวอย่างก่อนยืนยัน" : "";
  };
  let draw = () => {
    let p = st.pv; if (!p) return;
    let tot = p.groups.reduce((s, g) => s + Math.round(Number(g.total || 0) * 100), 0);
    sum.innerHTML = (p.errors.length ? `<div class="radv788-err"><b>⚠ รายการที่ออกเอกสารไม่ได้ (${p.errors.length}) — ระงับการยืนยัน</b><ul>${p.errors.map((e) => `<li>${n(e.invoice_no)} — ${n(e.reason)}</li>`).join("")}</ul><button class="btn btn-sm btn-o" id="r836-drop">นำรายการที่มีปัญหาออกจากรายการที่เลือก</button></div>` : "")
      + (need() ? '<div class="radv788-err"><b>⚠ ยังไม่ได้ตรวจสอบ / ยืนยัน CUSTOMER</b> — กด “ตรวจสอบ / แก้ไข CUSTOMER” ในแต่ละฉบับก่อนออกเอกสาร (ข้อมูลที่ยืนยันจะใช้ซ้ำครั้งต่อไป)</div>' : "")
      + `<div class="radv788-hd">เอกสารที่จะออก ${p.groups.length} ฉบับ (แยกตามลูกค้าที่ยืนยัน · ชื่อ + TAX ID + BRANCH ตรงกัน = ฉบับเดียว) · ${N(p.groups.reduce((s, g) => s + Number(g.count || 0), 0))} รายการ · ADVANCE รวม <b>${M(tot / 100)}</b> · ไม่หัก WHT</div>`
      + p.groups.map((g, k) => GB(g, k)).join("");
    let dr = q("#r836-drop"); dr && (dr.onclick = () => { p.errors.forEach((e) => SEL.delete(e.ax836_id)); ids = [...SEL.keys()]; sync(host); host.querySelectorAll(".l836-cb").forEach((c) => { c.checked = SEL.has(c.dataset.ax836); }); ids.length ? load() : (sum.innerHTML = '<div class="empty">ไม่มีรายการที่เลือก</div>', st.pv = null, sc()); });
    sum.querySelectorAll("[data-c836]").forEach((b) => { b.onclick = async () => { let co = {}; (st.pv.groups[+b.dataset.g] || {}).items.forEach((z) => { (co[z.customer_key] = co[z.customer_key] || []).push(z.company_invoice); }); (await cust836(JSON.parse(b.dataset.c836), { company: co })) && load(); }; });
    sc();
  };
  let load = async () => {
    st.pv = null; st.seen = !1; sc(); sum.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลล่าสุดจาก Server…</div></div>';
    try { let r = await RPC("njacc_radv836_preview", { p: { ax_ids: ids } }); st.pv = { errors: r && r.errors || [], groups: r && r.groups || [] }; draw(); }
    catch (e) { sum.innerHTML = `<div class="radv788-err">${n(RE836(e))}</div>`; sc(); }
  };
  let showDocs = async (docs, o) => { pf.hidden = !0; pd.hidden = !1; pd.innerHTML = '<div class="load-row"><div class="spin"></div></div>'; await dp.RW788(docs, Object.assign({ back }, o), pd); };
  q("#r836-date").onchange = () => { st.seen = !1; sc(); };
  q("#r836-method").onchange = () => { st.seen = !1; sc(); };
  q("#r836-pv").onclick = async () => {
    let d = q("#r836-date").value, m = q("#r836-method").value; if (!st.pv || !d || !m) return;
    let I = dp.IS790((await import("./chunk-UWAYW6DC.js")).a);
    let docs = st.pv.groups.map((g) => ({ receipt_no: "SAMPLE", receipt_date: d, payment_method: m, issuer: I, customer: { name: g.customer_name, tax_id: g.customer_tax_id, branch_code: g.customer_branch, address: g.customer_address },
      items: (g.items || []).map((x, i) => ({ no: i + 1, invoice_no: x.invoice_no, invoice_date: x.invoice_date, description: "Advance Charge", amount: x.amount })), total: g.total, credit: g.credit }));
    st.seen = !0; sc(); await showDocs(docs, { sample: !0 });
  };
  q("#r836-ok").onclick = async () => {
    if (st.busy || !st.pv || st.pv.errors.length || need() || !st.seen) return;
    let d = q("#r836-date").value, m = q("#r836-method").value, ng = st.pv.groups.length, cnt = st.pv.groups.reduce((s, g) => s + Number(g.count || 0), 0);
    back();
    let ok0 = await new Promise((res) => { let old = pf.querySelector(".radv788-ask"); old && old.remove();
      pf.insertAdjacentHTML("afterbegin", `<div class="radv788-ask"><div>ออกเอกสาร <b>${ng} ฉบับ</b> · ${cnt} รายการ · วันที่ ${D(d)}<br>เมื่อยืนยันแล้ว ระบบจะออกเลข ADV จริง (ลำดับเดียวกับ ACCOUNTING) เปลี่ยนรายการเป็น PAID และล็อกข้อมูลทันที</div><div class="radv788-ask-b"><button class="btn btn-o" data-ask="0">ยกเลิก</button><button class="btn btn-p" data-ask="1">ยืนยันออกเอกสาร</button></div></div>`);
      pf.querySelectorAll("[data-ask]").forEach((x) => { x.onclick = () => { pf.querySelector(".radv788-ask").remove(); res(x.dataset.ask === "1"); }; }); });
    if (!ok0) return;
    st.busy = !0; sc(); let ok = q("#r836-ok"); ok.textContent = "กำลังบันทึก…";
    try {
      let I = dp.IS790((await import("./chunk-UWAYW6DC.js")).a);
      let exp = st.pv.groups.flatMap((g) => (g.items || []).map((x) => ({ ax836_id: x.ax836_id, amount: x.amount, customer_key: x.customer_key, invoice_no: x.invoice_no, cust_ver: x.cust_ver })));
      let r = await RPC("njacc_radv836_issue", { p: { request_id: st.req, ax_ids: exp.map((x) => x.ax836_id), receipt_date: d, payment_method: m, issuer: I, expected: exp } });
      st.done = r && r.receipts || []; st.req = RQ("radv836"); SEL.clear(); sync(host);
      sum.innerHTML = `<div class="radv788-okbox"><b>✅ ออก RECEIPT ADVANCE สำเร็จ ${st.done.length} ฉบับ</b> — รายการเปลี่ยนเป็น PAID และล็อกแล้ว</div><table class="tbl radv788-t"><thead><tr><th>Receipt No.</th><th>ลูกค้า</th><th class="r">รายการ</th><th class="r">ยอดรวม</th><th></th></tr></thead><tbody>`
        + st.done.map((x) => `<tr><td class="t-b">${n(x.receipt_no)}</td><td>${n(x.customer_name)}</td><td class="r">${N(x.count)}</td><td class="r">${M(x.total)}</td><td class="r"><button class="btn btn-sm btn-p" data-o836="${n(x.id)}">ดู / ดาวน์โหลด / พิมพ์</button></td></tr>`).join("") + "</tbody></table>";
      let open = async (a) => { try { await showDocs(await LD(a), { sample: !1 }); } catch (e) { back(); TOAST("เปิด RECEIPT ADVANCE ไม่สำเร็จ — " + RE836(e), "err"); } };
      sum.querySelectorAll("[data-o836]").forEach((b) => { b.onclick = () => open([b.dataset.o836]); });
      ok.textContent = "✅ ออกแล้ว"; TOAST("ออก RECEIPT ADVANCE " + st.done.map((x) => x.receipt_no).join(", ") + " แล้ว", "ok");
      await open(st.done.map((x) => x.id)); LP(host);
    } catch (e) {
      TOAST("ออก RECEIPT ADVANCE ไม่สำเร็จ — " + RE836(e), "err"); ok.textContent = "✅ ยืนยันออก RECEIPT ADVANCE";
      if (/NJACC_RADV_(CHANGED|INVALID)|NJACC_CUST836/.test(String(e && e.message || e))) { await load(); sum.insertAdjacentHTML("afterbegin", `<div class="radv788-err">${n(RE836(e))}</div>`); }
    } finally { st.busy = !1; sc(); }
  };
  await load();
}
function GB(g, k) {   /* ฉบับ + กล่อง CUSTOMER */
  let okc = g.customer_status === "OK";
  return `<div class="g836"><div class="g836-h"><span>ฉบับที่ ${k + 1} · <b>${n(g.customer_name)}</b> ${okc ? '<span class="bd836 ok">CUSTOMER ✓</span>' : '<span class="bd836 need">ยังไม่ยืนยัน CUSTOMER</span>'}</span><span>${N(g.count)} รายการ · <b>${M(g.total)}</b></span></div>`
    + `<div class="cb836"><span>CUSTOMER NAME</span><b>${n(okc ? g.customer_name : "-")}</b><span>ADDRESS</span><b>${n(g.customer_address || "-")}</b><span>TAX ID / BRANCH</span><b>${n(g.customer_tax_id || "-")} / ${n(g.customer_branch || "-")}</b>`
    + `<span>ชื่อใน Excel</span><b>${n((g.customer_keys || []).join(", "))}</b><span>COMPANY INVOICE</span><b>${n((g.company_invoices || []).filter(Boolean).join(", ") || "-")}</b>`
    + `${!okc && (g.customer_problems || []).length ? `<span>ต้องแก้</span><b style="color:#b91c1c">${n(g.customer_problems.join(" · "))}</b>` : ""}</div>`
    + `<button type="button" class="btn btn-sm cu836" data-g="${k}" data-c836='${n(JSON.stringify(g.customer_keys || [g.customer_key]))}'>ตรวจสอบ / แก้ไข CUSTOMER</button>`
    + `<table class="tbl radv788-t"><thead><tr><th>No.</th><th>INVOICE NO.</th><th>Invoice Date</th><th>บริษัท INVOICE</th><th class="r">Advance Amount</th></tr></thead><tbody>${(g.items || []).map((x, i) => `<tr><td class="center">${i + 1}</td><td>${n(x.invoice_no)}</td><td>${D(x.invoice_date)}</td><td>${n(x.company_invoice || "")}</td><td class="r">${M(x.amount)}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ── EXPORT EXCEL (ตามตัวกรองปัจจุบัน · ทุกหน้า) ── */
async function XP(b) {
  if (b.disabled) return; b.disabled = !0; let lb = b.textContent; b.textContent = "กำลังส่งออก…";
  try {
    let rows = [], pg = 1, t = 0;
    do { let r = await RPC("njacc_ax836_pending", { p: Object.assign(filt(), { page: pg, size: 500 }) }); rows = rows.concat(r.rows || []); t = r.total || 0; pg++; } while (rows.length < t && pg < 400);
    let XL = await XLSX836(), H = ["INVOICE ADV ระบบเก่า", "Date invoice", "ลูกค้า", "CUSTOMER (ยืนยัน)", "บริษัท INVOICE", "Customer Job No.", "Invoice No. *", "ยอด ADVANCE", "ยอดรวมสำหรับตรวจสอบ", "Billing Note no.", "CASE", "สถานะ", "ไฟล์"];
    let A = [H].concat(rows.map((r) => [r.invoice_no, D(r.doc_date), r.customer_name || "", r.cust_name || "", r.company_invoice || "", r.customer_job_no || "", r.source_invoice_no || "", Number(r.advance_amount || 0), Number(r.total_check || 0), r.billing_note || "", r.case_no || "", r.reason ? "รอตรวจสอบ — " + r.reason : "พร้อมออกใบเสร็จ", r.file_name || ""]));
    let wb = XL.utils.book_new(); XL.utils.book_append_sheet(wb, XL.utils.aoa_to_sheet(A), "ADVANCE ระบบเก่า"); XL.writeFile(wb, "FINANCE_ADVANCE_UPLOAD_EXCEL_" + TD() + ".xlsx");
  } catch (e) { TOAST("ส่งออก Excel ไม่สำเร็จ — " + RE836(e), "err"); }
  finally { b.disabled = !1; b.textContent = lb; }
}
async function XI(b) {
  if (b.disabled) return; b.disabled = !0;
  try {
    let rows = [], pg = 1, t = 0;
    do { let r = await RPC("njacc_radv836_list", { p: { q: S.iq || null, from: S.ifrom || null, to: S.ito || null, page: pg, size: 200 } }); rows = rows.concat(r.rows || []); t = r.total || 0; pg++; } while (rows.length < t && pg < 400);
    let XL = await XLSX836(), A = [["เลขที่ใบเสร็จ", "วันที่ออก", "Customer", "ชื่อใน Excel", "จำนวน INVOICE", "ยอดรวม", "INVOICE", "วิธีรับชำระ", "ผู้ออก"]]
      .concat(rows.map((r) => [r.receipt_no, D(r.receipt_date), r.customer_name, r.customer_key, r.invoice_count, Number(r.total || 0), r.invoice_nos || "", r.payment_method || "", r.issued_by_name || ""]));
    let wb = XL.utils.book_new(); XL.utils.book_append_sheet(wb, XL.utils.aoa_to_sheet(A), "RECEIPT ADVANCE ระบบเก่า"); XL.writeFile(wb, "RECEIPT_ADVANCE_UPLOAD_EXCEL_" + TD() + ".xlsx");
  } catch (e) { TOAST("ส่งออก Excel ไม่สำเร็จ — " + RE836(e), "err"); }
  finally { b.disabled = !1; }
}

/* ══════════ UPLOAD EXCEL (ADVANCE ระบบเก่า) ══════════
   อ่านหัวคอลัมน์ตามชื่อจริง · ข้ามแถว TOTAL / แถวว่าง · Name CS / Status / Contact ห้ามนำเข้า · หัวที่ไม่มีในรายงาน = ข้าม
   ตรวจซ้ำ : ไฟล์เดิม (hash) · ซ้ำในไฟล์ / ข้ามไฟล์ · ซ้ำกับ Database · ออกใบเสร็จแล้ว · ข้อมูลเปลี่ยน → ยกเลิก | ดูรายการซ้ำ | ยืนยันใช้ไฟล์ล่าสุด
   บันทึก : BATCH 500 ตามลำดับ (Import ID) · Timeout = ตรวจสถานะก่อน แล้วแบ่ง 250 / 100 / 50 · สูงสุด 3 ครั้ง · ช่องว่างไม่ลบค่าเดิม */
const MAP = [
  [["invoiceno"], "invoice_no", "INVOICE ADV ระบบเก่า", "key"],
  [["date"], "doc_date", "Date invoice", "date"],
  [["customername"], "customer_name", "ลูกค้า", "text"],
  [["companyinvoice"], "company_invoice", "บริษัท INVOICE", "text"],
  [["customerjobno"], "customer_job_no", "Customer Job No.", "text"],
  [["dclinv", "dclinvoice"], "source_invoice_no", "Invoice No. *", "text"],
  [["advance"], "advance_amount", "ยอด ADVANCE", "num"],
  [["totalamout", "totalamount"], "total_check", "ยอดรวมสำหรับตรวจสอบ", "num"],
  [["aplbilling"], "billing_note", "Billing Note no.", "text"],
  [["case"], "case_no", "CASE", "text"]
];
const BAN = { namecs: 1, status: 1, contact: 1 };
const FLD = MAP.slice(1).map((m) => m[1]);
function NUM(v) { if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : NaN; let s = TX(v).replace(/[,\s฿]/g, ""); if (!s || s === "-") return null; let ng = /^\(.*\)$/.test(s); s = s.replace(/[()]/g, ""); if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN; let x = Math.round(Number(s) * 100) / 100; return ng ? -x : x; }
function DTE(raw, txt, XL) {
  let p = (x) => String(x).padStart(2, "0"), ok = (y, m, d) => { y > 2400 && (y -= 543); let x = new Date(Date.UTC(y, m - 1, d)); return y > 1900 && x.getUTCFullYear() === y && x.getUTCMonth() === m - 1 && x.getUTCDate() === d ? y + "-" + p(m) + "-" + p(d) : null; };
  if (typeof raw === "number" && raw > 20000 && raw < 80000) { try { let c = XL.SSF.parse_date_code(raw); if (c) return ok(c.y, c.m, c.d); } catch (e) {} }
  let s = TX(txt != null && txt !== "" ? txt : raw), m;
  if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/))) return ok(+m[3], +m[2], +m[1]);
  if ((m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/))) return ok(+m[1], +m[2], +m[3]);
  return null;
}
export function RV836(d) {   /* กติกาเดียวกับ njacc_ax836_rv (Server ตรวจซ้ำ) */
  if (!TX(d.customer_name)) return "ไม่มีชื่อลูกค้า";
  if (!d.doc_date) return "ไม่มีวันที่ INVOICE (Date)";
  if (!TX(d.company_invoice)) return "ไม่มีบริษัท INVOICE";
  if (d.advance_amount == null || Number.isNaN(d.advance_amount)) return "ไม่มียอด ADVANCE";
  if (d.advance_amount < 0) return "ยอด ADVANCE ติดลบ";
  if (d.advance_amount === 0 && (d.total_check || 0) > 0) return "Advance = 0 แต่ Total Amount > 0 (ห้ามใช้ Total แทน Advance)";
  if (d.advance_amount === 0) return "ยอด ADVANCE = 0";
  return "";
}
async function SHA(buf) {
  try { let h = await crypto.subtle.digest("SHA-256", buf); return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
  catch (e) { let a = new Uint8Array(buf), h1 = 2166136261, h2 = 0; for (let j = 0; j < a.length; j++) { h1 = Math.imul(h1 ^ a[j], 16777619) >>> 0; h2 = (h2 * 31 + a[j]) >>> 0; } return "fnv" + h1.toString(16) + h2.toString(16) + a.length; }
}
export async function READ836(buf, name, seq, XL) {   /* ไฟล์ → แถว (ใช้ทดสอบได้) */
  let o = { seq, name, size: buf.byteLength, hash: await SHA(buf), sheet: "", rows: [], bad: [], used: [], skipped: [], total: 0, blank: 0, err: "" };
  let wb; try { wb = XL.read(new Uint8Array(buf), { type: "array", cellDates: !1, cellNF: !0, cellText: !0 }); } catch (e) { o.err = "อ่านไฟล์ไม่ได้ (ไม่ใช่ Excel .xlsx / .xls)"; return o; }
  for (let sn of wb.SheetNames || []) {
    let ws = wb.Sheets[sn], A = XL.utils.sheet_to_json(ws, { header: 1, raw: !1, defval: "", blankrows: !0 }), W = XL.utils.sheet_to_json(ws, { header: 1, raw: !0, defval: "", blankrows: !0 }), hi = -1, r0 = 0;
    try { r0 = XL.utils.decode_range(ws["!ref"]).s.r; } catch (e) {}
    for (let j = 0; j < Math.min(A.length, 40); j++) if ((A[j] || []).some((c) => NH(c) === "invoiceno")) { hi = j; break; }
    if (hi < 0) continue;
    let fx = {};
    (A[hi] || []).forEach((h0, j) => { let h = TX(h0), k = NH(h); if (!h) return;
      if (BAN[k]) { o.skipped.push(h + " (ห้ามนำเข้า)"); return; }
      let m = MAP.find((z) => z[0].includes(k));
      if (m && fx[m[1]] == null) { fx[m[1]] = j; o.used.push(h + " → " + m[2]); return; }
      o.skipped.push(h + (m ? " (ซ้ำ — ใช้คอลัมน์แรก)" : " (ไม่มีคอลัมน์ในหน้ารายงาน)")); });
    o.sheet = sn;
    for (let j = hi + 1; j < A.length; j++) {
      let r = A[j] || [], w = W[j] || [], rn = r0 + j + 1;
      if (!r.some((c) => TX(c))) { o.blank++; continue; }
      if (r.some((c) => TX(c).toUpperCase() === "TOTAL")) { o.total++; continue; }
      let inv = TX(r[fx.invoice_no]);
      if (!inv) { o.bad.push({ r: rn, inv: "", why: "ไม่มี Invoice No." }); continue; }
      if (/^NO\s*INV/i.test(inv)) { o.bad.push({ r: rn, inv, why: "Invoice No. ไม่ถูกต้อง" }); continue; }
      if (inv.length > 60) { o.bad.push({ r: rn, inv, why: "Invoice No. ยาวเกิน 60 ตัวอักษร" }); continue; }
      let d = { invoice_no: inv, key: inv.toUpperCase(), seq, r: rn };
      MAP.slice(1).forEach((m) => { let c = fx[m[1]]; if (c == null) return; let t = TX(r[c]);
        if (m[3] === "num") { let x = NUM(w[c] !== "" && w[c] != null ? w[c] : t); d[m[1]] = Number.isNaN(x) ? null : x; }
        else if (m[3] === "date") d[m[1]] = DTE(w[c], t, XL);
        else d[m[1]] = t.slice(0, 300); });
      d.rv = RV836(d); o.rows.push(d);
    }
    break;
  }
  if (!o.sheet && !o.err) o.err = "ไม่พบหัวคอลัมน์ “Invoice No.”";
  return o;
}
const SAME = (a, b) => (a == null || a === "" ? "" : String(a)) === (b == null || b === "" ? "" : String(b));
const NV = (k, v) => (k === "advance_amount" || k === "total_check") ? (v == null || v === "" ? null : Number(v).toFixed(2)) : (v == null ? "" : String(v));

export async function upload836(files, opts) {   /* เลือกไฟล์ → อ่าน → ตรวจซ้ำ (Server) → Preview → ยืนยัน → บันทึก BATCH */
  ST836(); opts = opts || {};
  if (!SA()) { TOAST("UPLOAD EXCEL ได้เฉพาะ SUPER_ADMIN", "err"); return; }
  files = [...(files || [])]; if (!files.length) return;
  let XL, F = [];
  try {
    XL = await XLSX836();
    for (let j = 0; j < files.length; j++) {
      let f = files[j];
      if (!/\.(xlsx|xls)$/i.test(f.name)) { F.push({ seq: j + 1, name: f.name, size: f.size, hash: "", rows: [], bad: [], used: [], skipped: [], err: "รองรับเฉพาะ .xlsx / .xls" }); continue; }
      F.push(await READ836(await f.arrayBuffer(), f.name, j + 1, XL));
    }
  } catch (e) { TOAST("อ่านไฟล์ Excel ไม่สำเร็จ — " + (e && e.message || e), "err"); return; }
  return PV(F, opts);
}
export async function PV(F, opts) {
  opts = opts || {};
  let body = document.createElement("div"); body.className = "u836"; body.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังตรวจข้อมูลซ้ำกับ Database…</div></div>';
  let foot = document.createElement("div"); foot.innerHTML = '<button class="btn btn-o" data-close>ยกเลิก</button>';
  MODAL({ title: "UPLOAD EXCEL — ADVANCE ระบบเก่า", body, footer: foot, fullscreen: !0, wide: !0 });
  /* ไฟล์เดียวกันซ้ำในการเลือกครั้งนี้ = ใช้ไฟล์แรก */
  let seen = {}, dupF = [];
  F.forEach((f) => { if (f.hash && seen[f.hash]) { dupF.push(f.name + " = " + seen[f.hash]); f.err = f.err || "ไฟล์ซ้ำกับ " + seen[f.hash] + " (ไม่ใช้ซ้ำ)"; f.rows = []; } else if (f.hash) seen[f.hash] = f.name; });
  /* ซ้ำในไฟล์ / ข้ามไฟล์ : ยึดไฟล์ล่าสุด (ลำดับที่เลือกหลังสุด) แถวล่าสุด · ค่าว่างไม่ลบค่าที่มี */
  let byK = new Map(), dups = [];
  F.forEach((f) => (f.rows || []).forEach((d) => {
    let p = byK.get(d.key);
    if (!p) { byK.set(d.key, Object.assign({}, d, { src: [f.name + " แถว " + d.r] })); return; }
    let diff = FLD.filter((k) => d[k] != null && d[k] !== "" && !SAME(NV(k, d[k]), NV(k, p[k])));
    dups.push({ kind: p.seq === d.seq ? "ซ้ำในไฟล์" : "ซ้ำข้ามไฟล์", inv: d.invoice_no, from: p.src[p.src.length - 1], to: f.name + " แถว " + d.r, diff: diff.map((k) => k + " : " + (NV(k, p[k]) || "∅") + " → " + NV(k, d[k])) });
    FLD.forEach((k) => { if (d[k] != null && d[k] !== "") p[k] = d[k]; }); p.seq = d.seq; p.r = d.r; p.src.push(f.name + " แถว " + d.r); p.rv = RV836(p);
  }));
  let all = [...byK.values()], ex = {}, acc = new Set(), oldF = [];
  try {
    for (let i = 0; i < all.length; i += 4000) {
      let c = await RPC("njacc_ax836_check", { p: { keys: all.slice(i, i + 4000).map((d) => d.key), hashes: i ? [] : F.map((f) => f.hash).filter(Boolean) } });
      (c.rows || []).forEach((x) => { ex[x.key] = x; }); (c.acc || []).forEach((k) => acc.add(k)); i || (oldF = c.files || []);
    }
  } catch (e) { body.innerHTML = `<div class="radv788-err">ตรวจข้อมูลกับ Database ไม่สำเร็จ — ${n(RE836(e))}</div>`; return; }
  let ins = [], upd = [], same = [], lock = [], dbd = [];
  all.forEach((d) => {
    let x = ex[d.key]; if (!x) { ins.push(d); return; }
    let diff = FLD.filter((k) => d[k] != null && d[k] !== "" && !SAME(NV(k, d[k]), NV(k, x[k])));
    if (!diff.length) { same.push(d); return; }
    let dd = { kind: x.receipt_no ? "ออกใบเสร็จแล้ว (" + x.receipt_no + ") — ไม่เขียนทับ" : "ซ้ำกับ Database — ข้อมูลเปลี่ยน", inv: d.invoice_no, from: "Database (" + (x.file_name || "-") + ")", to: d.src[d.src.length - 1], diff: diff.map((k) => k + " : " + (NV(k, x[k]) || "∅") + " → " + NV(k, d[k])) };
    dbd.push(dd); x.receipt_no ? lock.push(d) : (d.ver = x.ver, upd.push(d));
  });
  let send = ins.concat(upd), rev = send.filter((d) => d.rv), accN = send.filter((d) => acc.has(d.key)).length;
  let hasDup = dupF.length || dups.length || dbd.length || oldF.length;
  let fileT = `<table><thead><tr><th>ไฟล์</th><th class="r">แถว</th><th class="r">TOTAL / ว่าง</th><th class="r">ไม่มี / ผิด Invoice No.</th><th>คอลัมน์ที่ใช้</th><th>คอลัมน์ที่ข้าม</th></tr></thead><tbody>`
    + F.map((f) => `<tr><td>${n(f.seq + ". " + f.name)}${f.err ? `<div style="color:#b91c1c">${n(f.err)}</div>` : ""}</td><td class="r">${N((f.rows || []).length)}</td><td class="r">${N(f.total || 0)} / ${N(f.blank || 0)}</td><td class="r">${N((f.bad || []).length)}</td><td style="font-size:11.5px">${n((f.used || []).join(" · "))}</td><td style="font-size:11.5px">${n((f.skipped || []).join(" · "))}</td></tr>`).join("") + "</tbody></table>";
  let dupT = () => `<table><thead><tr><th>ประเภท</th><th>INVOICE ADV</th><th>เดิม</th><th>ใหม่ (ไฟล์ล่าสุด)</th><th>ช่องที่ต่าง</th></tr></thead><tbody>`
    + dupF.map((x) => `<tr><td>ไฟล์ซ้ำ</td><td colspan="4">${n(x)}</td></tr>`).join("")
    + oldF.map((x) => `<tr><td>ไฟล์เคยอัปโหลดแล้ว</td><td colspan="4">${n(x.file_name)} · ${n(String(x.uploaded_at || "").slice(0, 16).replace("T", " "))} · ${n(x.uploaded_by_name || "")} (${n(x.job_status || "")})</td></tr>`).join("")
    + dups.concat(dbd).slice(0, 2000).map((x) => `<tr><td>${n(x.kind)}</td><td>${n(x.inv)}</td><td>${n(x.from)}</td><td>${n(x.to)}</td><td style="font-size:11.5px">${n(x.diff.join(" · ") || "ค่าเดียวกัน")}</td></tr>`).join("") + "</tbody></table>";
  body.innerHTML = `<div class="u836-k"><div>รายการในไฟล์ (ไม่ซ้ำ)<b>${N(all.length)}</b></div><div>ใหม่<b>${N(ins.length)}</b></div><div>มีแล้ว — เปลี่ยน (ใช้ไฟล์ล่าสุด)<b>${N(upd.length)}</b></div><div>มีแล้ว — ค่าเดิม (ไม่บันทึก)<b>${N(same.length)}</b></div>`
    + `<div>ออกใบเสร็จแล้ว — ไม่เขียนทับ<b>${N(lock.length)}</b></div><div>รอตรวจสอบ (บันทึกได้ · ออกใบเสร็จไม่ได้)<b>${N(rev.length)}</b></div><div>มี INVOICE ใน ACCOUNTING<b>${N(accN)}</b></div><div>ซ้ำ (ไฟล์ / ในไฟล์ / ข้ามไฟล์ / Database)<b>${N(dupF.length + oldF.length + dups.length + dbd.length)}</b></div></div>`
    + `<div class="mt-2"><b>ไฟล์</b>${fileT}</div><div class="mt-2" id="u836-dup" hidden><b>รายการซ้ำ</b>${hasDup ? dupT() : ""}</div>`
    + `<div class="mt-2" id="u836-run" hidden><div class="u836-pb"><i id="u836-bar"></i></div><div id="u836-st" class="mt-1"></div></div>`
    + `<small style="color:#64748b">บันทึกเฉพาะ 10 ช่องตาม Mapping (INVOICE ADV ระบบเก่า · Date invoice · ลูกค้า · บริษัท INVOICE · Customer Job No. · Invoice No. * · ยอด ADVANCE · ยอดรวมสำหรับตรวจสอบ · Billing Note no. · CASE) · ไม่สร้าง JOB No. / INVOICE NJAD · ช่องว่างไม่ลบค่าเดิม</small>`;
  foot.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>${hasDup ? '<button class="btn btn-o" id="u836-vd">ดูรายการซ้ำ</button>' : ""}<button class="btn btn-p" id="u836-ok"${send.length ? "" : " disabled"}>${hasDup ? "ยืนยันใช้ไฟล์ล่าสุด" : "ยืนยันบันทึก"} (${N(send.length)} รายการ)</button>`;
  let vd = foot.querySelector("#u836-vd"); vd && (vd.onclick = () => { let x = body.querySelector("#u836-dup"); x.hidden = !x.hidden; x.hidden || x.scrollIntoView({ block: "nearest" }); });
  let okb = foot.querySelector("#u836-ok");
  okb.onclick = () => SAVE(F, send, body, foot, opts);
  return { all: all.length, ins: ins.length, upd: upd.length, same: same.length, lock: lock.length, rev: rev.length, dups: dups.length + dbd.length + dupF.length + oldF.length };
}
async function SAVE(F, send, body, foot, opts) {
  let okb = foot.querySelector("#u836-ok"); if (!okb || okb.disabled) return;
  okb.disabled = !0; foot.querySelectorAll("[data-close]").forEach((b) => { b.disabled = !0; });
  let run = body.querySelector("#u836-run"), bar = body.querySelector("#u836-bar"), st = body.querySelector("#u836-st"); run.hidden = !1;
  let job, seq = 0, done = 0, q = [], SIZES = [500, 250, 100, 50];
  let row = (d) => ({ invoice_no: d.invoice_no, ver: d.ver == null ? null : d.ver, file_seq: d.seq, row_no: d.r, doc_date: d.doc_date || "", customer_name: d.customer_name || "", company_invoice: d.company_invoice || "",
    customer_job_no: d.customer_job_no || "", source_invoice_no: d.source_invoice_no || "", advance_amount: d.advance_amount == null ? "" : String(d.advance_amount), total_check: d.total_check == null ? "" : String(d.total_check),
    billing_note: d.billing_note || "", case_no: d.case_no || "" });
  let show = (msg) => { bar.style.width = Math.round(done * 100 / Math.max(send.length, 1)) + "%"; st.innerHTML = `บันทึกแล้ว <b>${N(done)}</b> / ${N(send.length)} รายการ${job ? " · Import ID " + n(String(job.job_id).slice(0, 8)) : ""}${msg ? " · " + msg : ""}`; };
  try {
    job = await RPC("njacc_ax836_begin", { p: { request_id: RQ("ax836"), total: send.length, files: F.filter((f) => f.hash && !/ไฟล์ซ้ำ/.test(f.err || "")).map((f) => ({ seq: f.seq, name: f.name, hash: f.hash, size: f.size, sheet: f.sheet,
      columns_used: f.used, columns_skipped: f.skipped, stats: { rows: (f.rows || []).length, total: f.total || 0, blank: f.blank || 0, bad: (f.bad || []).length } })) } });
  } catch (e) { st.innerHTML = `<div class="radv788-err">เริ่มบันทึกไม่สำเร็จ — ${n(RE836(e))}</div>`; okb.disabled = !1; foot.querySelectorAll("[data-close]").forEach((b) => { b.disabled = !1; }); return; }
  for (let i = 0; i < send.length; i += 500) q.push({ rows: send.slice(i, i + 500), lv: 0, tries: 0 });
  let fail = null;
  while (q.length) {
    let c = q.shift(), s = ++seq; show("BATCH " + s + " (" + c.rows.length + " รายการ)");
    try { await RPC("njacc_ax836_run", { p: { job_id: job.job_id, seq: s, rows: c.rows.map(row) } }); done += c.rows.length; continue; }
    catch (e) {
      let m = String(e && e.message || e);
      if (/NJACC_AX836_(INVALID|CHANGED)|NJACC_FORBIDDEN/.test(m)) { fail = RE836(e); try { await RPC("njacc_ax836_fail", { p: { job_id: job.job_id, seq: s, units: c.rows.length, error: m.slice(0, 500) } }); } catch (x) {} q.unshift(c); break; }
      let js = null; try { js = await RPC("njacc_ax836_status", { p: { job_id: job.job_id } }); } catch (x) {}
      let b = js && (js.batches || []).find((z) => z.seq === s);
      if (b && b.status === "DONE") { done += c.rows.length; continue; }   /* Timeout แต่บันทึกสำเร็จแล้ว = ไม่บันทึกซ้ำ */
      try { await RPC("njacc_ax836_fail", { p: { job_id: job.job_id, seq: s, units: c.rows.length, error: m.slice(0, 500) } }); } catch (x) {}
      let lv = Math.min(c.lv + 1, SIZES.length - 1), sz = SIZES[lv];
      if (c.lv === SIZES.length - 1) { c.tries++; if (c.tries >= 3) { fail = "บันทึก BATCH ไม่สำเร็จหลังลองใหม่ 3 ครั้ง — " + RE836(e); q.unshift(c); break; } q.unshift(c); continue; }
      let parts = []; for (let i = 0; i < c.rows.length; i += sz) parts.push({ rows: c.rows.slice(i, i + sz), lv, tries: 0 });
      q.unshift(...parts); show("ลองใหม่ ขนาด " + sz);
    }
  }
  let fin = null; try { fin = await RPC("njacc_ax836_finish", { p: { job_id: job.job_id } }); } catch (e) {}
  show(fail ? '<span style="color:#b91c1c">' + n(fail) + "</span>" : "เสร็จ");
  body.insertAdjacentHTML("afterbegin", `<div class="${fail ? "radv788-err" : "radv788-okbox"}"><b>${fail ? "⚠ บันทึกได้บางส่วน" : "✅ บันทึกครบ"}</b> — Import ID ${n(job.job_id)} · สถานะ ${n(fin && fin.status || (fail ? "PARTIAL" : "-"))}`
    + (fin ? ` · ใหม่ ${N(fin.inserted)} · แก้ไข ${N(fin.updated)} · ค่าเดิม ${N(fin.unchanged)} · ไม่เขียนทับ (ออกใบเสร็จแล้ว) ${N(fin.locked)} · รอตรวจสอบ ${N(fin.review)} · อยู่ใน Database จริง ${N(fin.db_rows)}` : "") + "</div>");
  foot.querySelectorAll("[data-close]").forEach((b) => { b.disabled = !1; });
  if (q.length) {
    okb.disabled = !1; okb.textContent = "ทำต่อ (" + N(q.reduce((s, c) => s + c.rows.length, 0)) + " รายการที่เหลือ)";
    okb.onclick = () => { okb.disabled = !0; let rest = q.flatMap((c) => c.rows); SAVE2(job, seq, rest, body, foot, opts, done, send.length); };
  } else { okb.textContent = "✅ บันทึกแล้ว"; }
  try { opts.onDone && opts.onDone(fin); } catch (e) {}
  reload836();
}
async function SAVE2(job, seq0, rest, body, foot, opts, done0, total) {   /* ทำต่อ : Import เดิม · seq ใหม่ · ส่วนที่สำเร็จแล้วไม่ส่งซ้ำ */
  let okb = foot.querySelector("#u836-ok"), st = body.querySelector("#u836-st"), bar = body.querySelector("#u836-bar"), seq = seq0, done = done0, fail = null;
  let row = (d) => ({ invoice_no: d.invoice_no, ver: d.ver == null ? null : d.ver, file_seq: d.seq, row_no: d.r, doc_date: d.doc_date || "", customer_name: d.customer_name || "", company_invoice: d.company_invoice || "",
    customer_job_no: d.customer_job_no || "", source_invoice_no: d.source_invoice_no || "", advance_amount: d.advance_amount == null ? "" : String(d.advance_amount), total_check: d.total_check == null ? "" : String(d.total_check),
    billing_note: d.billing_note || "", case_no: d.case_no || "" });
  for (let i = 0; i < rest.length; i += 50) {
    let c = rest.slice(i, i + 50), s = ++seq, ok = !1;
    for (let t = 0; t < 3 && !ok; t++) {
      try { await RPC("njacc_ax836_run", { p: { job_id: job.job_id, seq: s, rows: c.map(row) } }); ok = !0; }
      catch (e) { let js = null; try { js = await RPC("njacc_ax836_status", { p: { job_id: job.job_id } }); } catch (x) {} let b = js && (js.batches || []).find((z) => z.seq === s); if (b && b.status === "DONE") ok = !0; else fail = RE836(e); }
    }
    if (!ok) { okb.disabled = !1; okb.textContent = "ทำต่อ (" + N(rest.length - i) + " รายการที่เหลือ)"; okb.onclick = () => { okb.disabled = !0; SAVE2(job, seq, rest.slice(i), body, foot, opts, done, total); }; break; }
    done += c.length; fail = null; bar.style.width = Math.round(done * 100 / Math.max(total, 1)) + "%"; st.innerHTML = `บันทึกแล้ว <b>${N(done)}</b> / ${N(total)} รายการ`;
  }
  let fin = null; try { fin = await RPC("njacc_ax836_finish", { p: { job_id: job.job_id } }); } catch (e) {}
  if (!fail) { okb.textContent = "✅ บันทึกแล้ว"; okb.disabled = !0; }
  st.innerHTML += fin ? ` · สถานะ ${n(fin.status)} · อยู่ใน Database จริง ${N(fin.db_rows)}` : "";
  reload836();
}
