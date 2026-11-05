/* ═══ V.762 · Component กลาง — Dropdown ตัวกรอง (รูปแบบเดียวกับ DOCUMENT → SERVICE / ADVANCE)
   ใช้ร่วมกัน : ACCOUNTING → ADVANCE · ACCOUNTING → BILLING PDF · FINANCE → RECEIPT · FINANCE → ADVANCE · REPORT (ทุกหน้าที่มีตัวกรองแบบเลือก)
   · ช่อง "พิมพ์ค้นหา…" ภายใน Dropdown (กรองตัวเลือกเท่านั้น) · "ทั้งหมด" รายการแรก · วงกลม / จุดแดง / พื้นฟ้าอ่อน / ✓ · คลิกได้ทั้งแถว · เลือกครั้งละ 1 ค่า
   · เปิดซ้ำเลื่อนไปค่าที่เลือก · ชื่อยาวตัดด้วย … + ชื่อเต็มเมื่อชี้ · × ล้างเฉพาะช่อง · ป้ายสรุปเงื่อนไขใต้แถบค้นหา · ↑ ↓ Enter Esc
   sel762 = ใช้ <select> เดิมเป็นแหล่งค่า (ซ่อนไว้ · ตัวเลือก / ค่าเริ่มต้น / Event เดิมของหน้า) → เลือก = ตั้งค่า select + ส่ง input / change เดิม
   ไม่แตะแหล่งข้อมูล / เงื่อนไขค้นหา / สิทธิ์ / Export ของแต่ละหน้า ═══ */
const ALL = "ทั้งหมด";
let OPEN = null;
const E = (tag, c, h) => { const el = document.createElement(tag); c && (el.className = c); h != null && (el.innerHTML = h); return el; };
const sp = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
export const fire762 = (el) => { el.dispatchEvent(new Event("input", { bubbles: !0 })); el.dispatchEvent(new Event("change", { bubbles: !0 })); };
export function css762() {
  try {
    if (document.getElementById("u762-css")) return;
    const s = document.createElement("style"); s.id = "u762-css"; const B = "html .u762-bar";
    s.textContent = [
      B + "{display:flex!important;flex-wrap:wrap!important;align-items:flex-end!important;gap:10px 8px!important;grid-template-columns:none!important;min-width:0;overflow:visible}",
      B + ">*{margin-top:0!important;margin-bottom:0!important}",
      B + " .u762-f{display:flex!important;flex-direction:column;gap:5px;min-width:108px;flex:1 1 116px;max-width:260px;height:auto!important;margin:0!important;box-sizing:border-box}",
      B + " .u762-f.u762-w{flex:1.4 1 160px;min-width:150px;max-width:320px}",
      B + " .u762-f.u762-t{flex:1 1 128px;min-width:110px;max-width:200px}",
      B + " .u762-f.u762-d{flex:0 0 138px;min-width:138px;max-width:138px}",
      B + " .u762-l{font-size:12.5px;font-weight:600;color:#344054;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      B + " .u762-f>input{height:40px!important;min-height:40px!important;width:100%!important;min-width:0!important;max-width:none!important;flex:none!important;margin:0!important;padding:0 10px!important;box-sizing:border-box;border:1px solid #D0D5DD!important;border-radius:10px!important;background:#fff;color:#102A4C;font-size:14px;text-overflow:ellipsis}",
      B + " .u762-f>input:focus," + B + " .u762-tg:focus-visible," + B + " .u762-dd.open .u762-tg{outline:none;border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,.15)}",
      B + " .u762-f>input:disabled{background:#F2F4F7;color:#667085}",
      B + " .btn," + B + ">button{height:40px!important;min-height:40px!important;border-radius:10px!important;padding:0 14px!important;display:inline-flex!important;align-items:center;justify-content:center;gap:6px;font-size:14px!important;line-height:1;white-space:nowrap;box-sizing:border-box;margin:0!important}",
      ".u762-native{display:none!important}",
      ".u762-dd{position:relative;min-width:0;height:40px;width:100%}",
      ".u762-tg{display:flex;align-items:center;width:100%;height:40px;margin:0;padding:0 34px 0 12px;box-sizing:border-box;border:1px solid #D0D5DD;border-radius:10px;background:#fff;color:#102A4C;font:inherit;font-size:14px;text-align:left;cursor:pointer;min-width:0;position:relative;outline:none}",
      ".u762-tg:disabled{background:#F2F4F7;cursor:default}",
      ".u762-tx{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#475467}",
      ".u762-dd.on .u762-tx{color:#102A4C;font-weight:600}.u762-dd.on.x .u762-tg{padding-right:58px}",
      ".u762-tg:disabled .u762-tx{color:#344054;font-weight:600}",
      ".u762-cr{position:absolute;right:12px;top:50%;width:8px;height:8px;margin-top:-6px;border-right:2px solid #667085;border-bottom:2px solid #667085;transform:rotate(45deg);pointer-events:none}",
      ".u762-dd.open .u762-cr{margin-top:-2px;transform:rotate(-135deg)}",
      ".u762-x{position:absolute;right:30px;top:50%;width:22px;height:22px;margin:-11px 0 0;padding:0;border:0;border-radius:50%;background:#F2F4F7;color:#475467;font-size:15px;line-height:22px;text-align:center;cursor:pointer}",
      ".u762-x:hover{background:#E4E7EC;color:#102A4C}",
      ".u762-pan{position:fixed;z-index:3000;display:flex;flex-direction:column;background:#fff;color:#102A4C;border:1px solid #E4E7EC;border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.12),0 2px 6px rgba(16,24,40,.06);box-sizing:border-box;overflow:hidden;font-weight:400;text-align:left}",
      ".u762-pan[hidden]{display:none}",
      ".u762-sw{padding:8px;border-bottom:1px solid #F2F4F7;flex:0 0 auto}",
      ".u762-s{width:100%!important;height:36px!important;min-height:36px!important;margin:0;padding:0 10px!important;box-sizing:border-box;border:1px solid #D0D5DD!important;border-radius:8px!important;font:inherit;font-size:14px;color:#102A4C;background:#fff;outline:none}",
      ".u762-s:focus{border-color:#84ADFF!important;box-shadow:0 0 0 3px rgba(41,112,255,.14)}",
      ".u762-ls{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:4px 0;overscroll-behavior:contain}",
      ".u762-it{display:flex;align-items:center;gap:10px;min-height:40px;padding:8px 12px;box-sizing:border-box;cursor:pointer;font-size:14px;line-height:1.3}",
      ".u762-it.u762-i{padding-left:30px}.u762-it.act{background:#F5F8FF}.u762-it.sel{background:#EAF2FF}",
      ".u762-rd{position:relative;flex:0 0 18px;width:18px;height:18px;box-sizing:border-box;border:1.5px solid #98A2B3;border-radius:50%;background:#fff}",
      ".u762-it.sel .u762-rd{border-color:#DC2626}",
      ".u762-it.sel .u762-rd::after{content:'';position:absolute;left:3px;top:3px;width:9px;height:9px;border-radius:50%;background:#DC2626}",
      ".u762-lb{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:#102A4C}",
      ".u762-ck{flex:0 0 16px;color:#175CD3;font-weight:700;visibility:hidden;text-align:right}.u762-it.sel .u762-ck{visibility:visible}",
      ".u762-gh{padding:8px 12px 4px;font-size:12px;font-weight:700;color:#667085}",
      ".u762-em{padding:10px 12px;font-size:13px;color:#667085}",
      ".u762-c{display:flex;flex-wrap:wrap;gap:8px;min-width:0;margin:10px 0 2px}.u762-c[hidden]{display:none!important}",
      ".u762-cp{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-width:0;height:30px;padding:0 6px 0 12px;box-sizing:border-box;border-radius:999px;background:#EAF2FF;border:1px solid #D1E0FF;color:#102A4C;font-size:13px}",
      ".u762-ct{min-width:0;max-width:360px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.u762-ct b{font-weight:600;color:#175CD3}",
      ".u762-cx{flex:0 0 20px;width:20px;height:20px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#175CD3;font-size:15px;line-height:20px;text-align:center;cursor:pointer}.u762-cx:hover{background:#D1E0FF}",
      "@media (max-width:640px){" + B + " .u762-f," + B + " .u762-f.u762-w," + B + " .u762-f.u762-t{flex:1 1 100%;max-width:none}" + B + " .u762-f.u762-d{flex:1 1 140px;max-width:none}}"
    ].join("");
    document.head.appendChild(s);
  } catch (e) {}
}
/* ห่อ Element เดิมด้วยหัวข้อด้านบน (ย้ายในตำแหน่งเดิม · ไม่สร้างตัวกรองใหม่) */
export function field762(el, label, cls) {
  if (!el) return null;
  if (el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("u762-f")) return el.parentNode;
  const w = E("div", "u762-f" + (cls ? " " + cls : "")), l = E("span", "u762-l"); l.textContent = label; l.title = label;
  el.parentNode && el.parentNode.insertBefore(w, el); w.append(l, el); return w;
}
/* Dropdown แกนกลาง : d = { label, all, items() → [{ v, t, title?, h?, c? }], get(), set(v), loading?(), disabled?(), clearable?, after?(why) } */
export function dd762(d) {
  css762();
  const w = E("div", "u762-dd"), tg = E("button", "u762-tg", '<span class="u762-tx"></span><span class="u762-cr" aria-hidden="true"></span>'), xb = E("button", "u762-x", "×"),
    pan = E("div", "u762-pan"), sw = E("div", "u762-sw"), s = E("input", "u762-s"), ls = E("div", "u762-ls"), tx = tg.firstChild;
  let vis = [], act = -1;
  tg.type = xb.type = "button"; tg.setAttribute("aria-haspopup", "listbox"); tg.setAttribute("aria-expanded", "false");
  xb.title = "ล้าง" + (d.label || ""); xb.setAttribute("aria-label", xb.title);
  s.type = "text"; s.autocomplete = "off"; s.placeholder = "พิมพ์ค้นหา…"; s.setAttribute("aria-label", "ค้นหา" + (d.label || ""));
  ls.setAttribute("role", "listbox"); ls.setAttribute("aria-label", d.label || ""); pan.hidden = !0;
  sw.appendChild(s); pan.append(sw, ls); w.append(tg, xb, pan);
  const allT = () => (typeof d.all === "function" ? d.all() : d.all) || ALL;
  const text = (v) => { if (!v) return allT(); const f = d.items().find((o) => !o.h && o.v === v); return f ? f.t : d.txt ? d.txt(v) : v; };
  const sync = () => {
    const v = d.get(), t = text(v), dis = !!(d.disabled && d.disabled()), cl = d.clearable !== !1 && !!v && !dis;
    tx.textContent = t; tg.title = (d.label ? d.label + " : " : "") + t; tg.disabled = dis; w.classList.toggle("on", !!v); w.classList.toggle("x", cl); xb.hidden = !cl;
    tg.setAttribute("aria-label", tg.title);
  };
  const mark = (i) => { vis.forEach((e, j) => e.classList.toggle("act", j === i)); act = i; vis[i] && vis[i].scrollIntoView({ block: "nearest" }); };
  const paint = () => {
    const k = s.value.trim().toLowerCase(), cur = d.get(); let n = 0; ls.innerHTML = ""; vis = [];
    [{ v: "", t: allT() }].concat(d.items()).forEach((o) => {
      if (o.h) { k || ls.appendChild(Object.assign(E("div", "u762-gh"), { textContent: o.t })); return; }
      if (k && o.v && String(o.t).toLowerCase().indexOf(k) < 0 && String(o.title || "").toLowerCase().indexOf(k) < 0) return;
      const on = o.v === cur, e = E("div", "u762-it" + (o.c ? " u762-" + o.c : "") + (on ? " sel" : ""), '<span class="u762-rd" aria-hidden="true"></span><span class="u762-lb"></span><span class="u762-ck" aria-hidden="true">✓</span>');
      e.dataset.v = o.v; e.setAttribute("role", "option"); e.setAttribute("aria-selected", on ? "true" : "false");
      e.children[1].textContent = o.t; e.children[1].title = o.title && o.title !== o.t ? o.t + " — " + o.title : o.t; ls.appendChild(e); vis.push(e); o.v && n++;
    });
    d.loading && d.loading() ? ls.appendChild(Object.assign(E("div", "u762-em"), { textContent: "กำลังโหลด…" })) : k && !n && ls.appendChild(Object.assign(E("div", "u762-em"), { textContent: "ไม่พบข้อมูล" }));
    mark(Math.max(0, vis.findIndex((e) => e.classList.contains("sel"))));
  };
  const place = () => {
    const b = tg.getBoundingClientRect(), W = Math.min(Math.max(b.width, 280), 440, innerWidth - 16), dn = innerHeight - b.bottom - 12, up = b.top - 12, top = dn >= 260 || dn >= up;
    pan.style.width = W + "px"; pan.style.left = Math.max(8, Math.min(b.left, innerWidth - W - 8)) + "px"; pan.style.maxHeight = Math.max(160, Math.min(420, top ? dn : up)) + "px";
    if (top) { pan.style.top = b.bottom + 4 + "px"; pan.style.bottom = "auto"; } else { pan.style.top = "auto"; pan.style.bottom = innerHeight - b.top + 4 + "px"; }
  };
  const out = (ev) => { w.contains(ev.target) || close(); }, scl = (ev) => { pan.contains(ev.target) || close(); }, rsz = () => close();
  const close = (back) => {
    if (pan.hidden) return; pan.hidden = !0; w.classList.remove("open"); tg.setAttribute("aria-expanded", "false"); OPEN === close && (OPEN = null);
    document.removeEventListener("mousedown", out, !0); removeEventListener("scroll", scl, !0); removeEventListener("resize", rsz); back && tg.focus();
  };
  const open = () => {
    if (tg.disabled) return; OPEN && OPEN !== close && OPEN(); OPEN = close; d.onOpen && d.onOpen();
    s.value = ""; place(); pan.hidden = !1; w.classList.add("open"); tg.setAttribute("aria-expanded", "true"); paint();
    const e = ls.querySelector(".u762-it.sel"); e && (ls.scrollTop = Math.max(0, e.offsetTop - (ls.clientHeight - e.offsetHeight) / 2));
    document.addEventListener("mousedown", out, !0); addEventListener("scroll", scl, !0); addEventListener("resize", rsz); s.focus();
  };
  const pick = (v) => { close(!0); if (v !== d.get()) { d.set(v); sync(); d.after && d.after("pick"); } else sync(); };
  const key = (ev) => {
    const K = ev.key;
    if (K === "ArrowDown" || K === "ArrowUp") { ev.preventDefault(); if (pan.hidden) return open(); vis.length && mark((act + (K === "ArrowDown" ? 1 : -1) + vis.length) % vis.length); }
    else if (K === "Home" || K === "End") { if (!pan.hidden) { ev.preventDefault(); vis.length && mark(K === "Home" ? 0 : vis.length - 1); } }
    else if (K === "Enter" && !pan.hidden) { ev.preventDefault(); ev.stopPropagation(); vis[act] && pick(vis[act].dataset.v); }
    else if (K === "Escape" && !pan.hidden) { ev.preventDefault(); ev.stopPropagation(); close(!0); }
    else if (K === "Tab") close();
  };
  tg.addEventListener("click", (ev) => { ev.preventDefault(); pan.hidden ? open() : close(); });
  tg.addEventListener("keydown", key); s.addEventListener("keydown", key); s.addEventListener("input", paint);
  xb.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); close(); if (d.get()) { d.set(""); sync(); d.after && d.after("clear"); } tg.focus(); });
  pan.addEventListener("click", (ev) => { ev.target === s || ev.preventDefault(); });   /* อยู่ใน <label> เดิมได้ : กันการคลิกรายการไปสั่งปุ่มซ้ำ */
  ls.addEventListener("mousedown", (ev) => ev.preventDefault());
  ls.addEventListener("click", (ev) => { const e = ev.target.closest(".u762-it"); e && pick(e.dataset.v); });
  ls.addEventListener("mousemove", (ev) => { const i = vis.indexOf(ev.target.closest(".u762-it")); i >= 0 && i !== act && mark(i); });
  sync();
  return { w, d, sync, close, open, label: d.label || "", active: () => !!d.get() && !(d.disabled && d.disabled()), text: () => text(d.get()), clear: () => { if (d.get()) { d.set(""); sync(); } } };
}
/* <select> เดิม → Dropdown (select เดิมซ่อนไว้ในตำแหน่งเดิม · ค่า / ตัวเลือก / Event เดิม) */
const PV = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value"), PI = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
export function sel762(sel, o) {
  if (!sel) return null; if (sel.__u762) return sel.__u762; o = o || {};
  const items = () => {
    const L = [], seen = {};
    const add = (op, c) => { const v = op.value, t = sp(op.textContent); if (!v || !t || seen[v]) return; seen[v] = 1; L.push({ v, t, title: op.title || "", c }); };
    [...sel.children].forEach((ch) => {
      if (ch.tagName === "OPTGROUP") { L.push({ h: 1, t: ch.label }); [...ch.children].forEach((op) => add(op, "i")); }
      else if (ch.tagName === "OPTION") add(ch);
    });
    return L;
  };
  const allOp = () => [...sel.options].find((op) => op.value === "");
  const allTx = () => { const t = allOp() ? sp(allOp().textContent) : ""; return o.all || (!t || /เลือก|^[—–-]/.test(t) ? ALL : t); };   /* "— เลือกลูกค้า —" (ค่าว่างเดิม = ไม่จำกัด) แสดงเป็น "ทั้งหมด" */
  const api = dd762({ label: o.label || sel.getAttribute("title") || "", all: allTx, items,
    get: () => (PV.get.call(sel) || ""), set: (v) => { PV.set.call(sel, v); fire762(sel); }, disabled: () => sel.disabled, clearable: o.clearable !== !1 && !!allOp(),
    txt: (v) => { const op = [...sel.options].find((x) => x.value === v); return op ? sp(op.textContent) : v; }, after: o.after });
  sel.parentNode.insertBefore(api.w, sel); api.w.appendChild(sel); sel.classList.add("u762-native");
  try {   /* หน้าเดิมตั้งค่า select ด้วยโค้ด (ล้างตัวกรอง / โหลดค่าเดิม) → แสดงตรงกันทันที */
    Object.defineProperty(sel, "value", { configurable: !0, get() { return PV.get.call(sel); }, set(v) { PV.set.call(sel, v); api.sync(); } });
    Object.defineProperty(sel, "selectedIndex", { configurable: !0, get() { return PI.get.call(sel); }, set(v) { PI.set.call(sel, v); api.sync(); } });
  } catch (e) {}
  try { new MutationObserver(() => api.sync()).observe(sel, { childList: !0, subtree: !0, characterData: !0, attributes: !0, attributeFilter: ["disabled", "selected"] }); } catch (e) {}
  sel.addEventListener("change", () => api.sync());
  sel.__u762 = api; return api;
}
/* เงื่อนไขช่องข้อความ / วันที่ (สำหรับป้ายสรุป) */
export function txt762(el, label, date, apply) {
  const dmy = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : v; };
  return { label, active: () => !!(el && !el.disabled && String(el.value || "").trim()), text: () => (date ? dmy(el.value) : sp(el.value)), clear: () => { el.value = ""; fire762(el); apply && apply(); } };
}
/* ป้ายสรุปเงื่อนไข (พื้นฟ้าอ่อน · × ล้างเฉพาะเงื่อนไข · ไม่มีเงื่อนไข = ไม่แสดงแถว) */
export function chips762(anchor, list, apply) {
  css762();
  const box = E("div", "u762-c"); box.hidden = !0; box.setAttribute("aria-label", "เงื่อนไขที่ใช้อยู่");
  anchor.parentNode.insertBefore(box, anchor.nextSibling);
  const refresh = () => {
    const C = list().filter((f) => f && f.active());
    box.innerHTML = ""; box.hidden = !C.length;
    C.forEach((f) => {
      const c = E("span", "u762-cp"), ct = E("span", "u762-ct"), b = E("b"), bx = E("button", "u762-cx", "×"), t = f.text();
      b.textContent = f.label + ":"; ct.append(b, " " + t); ct.title = f.label + ": " + t; bx.type = "button"; bx.title = "ล้างเงื่อนไข " + f.label; bx.setAttribute("aria-label", bx.title);
      bx.onclick = (ev) => { ev.preventDefault(); f.clear(); f.sync && f.sync(); apply && apply(); refresh(); }; c.append(ct, bx); box.appendChild(c);
    });
  };
  refresh();
  return { box, refresh };
}
