(() => {
  // assets/js/app/chunk-GDT6F23K.js
  var l = { profile: null, masters: null, route: null };

  // assets/js/app/chunk-2B2FLIKC.js
  var u = ["DOCUMENT", "DOCUMENT_REPORT", "ACCOUNTING", "FINANCE", "JOB_CONTROL", "REPORT", "QUOTATION", "SYSTEM"];
  var c = { USER: ["DOCUMENT", "DOCUMENT_REPORT"], ACCOUNT: ["ACCOUNTING"], ADMIN: u, SUPER_ADMIN: u };
  var l2 = { USER: ["view", "create", "edit", "export"], ACCOUNT: ["view", "edit", "invoice", "receive_payment", "issue_receipt", "void", "export"], ADMIN: ["view", "create", "edit", "invoice", "receive_payment", "issue_receipt", "void", "export", "manage_users"], SUPER_ADMIN: ["view", "create", "edit", "invoice", "receive_payment", "issue_receipt", "void", "export", "manage_users", "delete"] };
  function t() {
    let e = l.profile;
    return e && e.role ? String(e.role) : null;
  }
  var s = ["DOCUMENT", "ACCOUNTING", "FINANCE", "JOB_CONTROL", "REPORT", "QUOTATION", "SYSTEM"];
  function f(e) {
    if (!Array.isArray(e)) return null;
    let r2 = /* @__PURE__ */ new Set();
    for (let o5 of e) s.includes(o5) && r2.add(o5);
    return r2.has("DOCUMENT") && r2.add("DOCUMENT_REPORT"), [...r2].sort();
  }
  function p(e) {
    return e === "SUPER_ADMIN";
  }
  function N() {
    let e = l.profile, r2 = e && e.allowed_modules;
    return Array.isArray(r2) ? f(r2) || [] : c[t()] || [];
  }
  function O(e) {
    return t() ? N().includes(e) : false;
  }
  function a() {
    let e = t();
    if (!e) return false;
    let r2 = l.profile;
    return r2 && typeof r2.can_delete == "boolean" ? r2.can_delete : p(e);
  }
  function _(e) {
    return O(e) && a();
  }
  function T() {
    let e = t();
    if (!e) return false;
    if (e === "SUPER_ADMIN") return true;
    let r2 = l.profile;
    return !!(r2 && r2.can_manage_columns === true);
  }
  function d(e, r2, o5) {
    let i7 = t();
    return i7 ? e === "delete" ? a() : (l2[i7] || []).includes(e) : false;
  }
  function U() {
    let e = t();
    return e === "SUPER_ADMIN" || e === "ADMIN";
  }

  // assets/js/app/chunk-OFOOXWUM.js
  function n(o5, a6 = "") {
    let t4 = document.querySelector(".toast-wrap");
    t4 || (t4 = document.createElement("div"), t4.className = "toast-wrap", document.body.appendChild(t4));
    let e = document.createElement("div");
    e.className = "toast " + a6, e.textContent = o5, t4.appendChild(e), setTimeout(() => e.remove(), 4200);
  }

  // assets/js/app/chunk-PCFU74ZV.js
  var o = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var g = (t4) => t4 == null || t4 === "" || isNaN(t4) ? "-" : o.format(Number(t4));
  var u2 = (t4) => Math.round((Number(t4) + Number.EPSILON) * 100) / 100;
  function i(t4) {
    if (!t4) return "-";
    let n3 = /* @__PURE__ */ new Date(t4 + (String(t4).length === 10 ? "T00:00:00" : ""));
    return isNaN(n3) ? "-" : String(n3.getDate()).padStart(2, "0") + "/" + String(n3.getMonth() + 1).padStart(2, "0") + "/" + n3.getFullYear();
  }
  var p2 = (t4) => {
    let n3 = t4 instanceof Date ? t4 : new Date(t4);
    return n3.getFullYear() + "-" + String(n3.getMonth() + 1).padStart(2, "0") + "-" + String(n3.getDate()).padStart(2, "0");
  };
  function c2(t4) {
    return String(t4 ?? "").replace(/[&<>"']/g, (n3) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[n3]);
  }

  // assets/js/app/chunk-DIH2PLYD.js
  function f2({ title: o5, body: a6, footer: e, large: n3, fullscreen: l7, wide: t4, cls: r2, headExtra: d4 }) {
    i2();
    let c4 = document.createElement("div"), b2 = r2 ? " " + r2 : "";
    c4.className = "modal-bk" + (l7 ? " modal-fs" : "") + (t4 ? " modal-bk-w80" : "") + b2, c4.id = "nj-modal";
    let v2 = ["modal", l7 ? "" : n3 ? "modal-lg" : "", t4 ? "modal-w80" : "", r2 || ""].filter(Boolean).join(" ");
    return c4.innerHTML = `<div class="${v2}">
    <div class="modal-h"><h3>${c2(o5)}</h3>
      ${d4 ? `<div class="modal-h-x">${d4}</div>` : ""}
      <button class="btn-icon" data-close aria-label="ปิด">✕</button></div>
    <div class="modal-b"></div>
    ${e ? '<div class="modal-f"></div>' : ""}</div>`, c4.querySelector(".modal-b").append(a6 instanceof Node ? a6 : Object.assign(document.createElement("div"), { innerHTML: a6 })), e && c4.querySelector(".modal-f").append(e), c4.addEventListener("click", (u6) => {
      (u6.target === c4 || u6.target.closest("[data-close]")) && i2();
    }), document.body.appendChild(c4), y(), c4;
  }
  var s2 = null;
  function y() {
    s2 === null && (s2 = document.documentElement.style.overflow || "", document.documentElement.style.overflow = "hidden");
  }
  function p3() {
    s2 !== null && (document.documentElement.style.overflow = s2, s2 = null);
  }
  function i2() {
    let o5 = document.getElementById("nj-modal");
    o5 && o5.remove(), p3();
  }
  function g2(o5) {
    if (!o5 || o5.dataset.enterNav === "1") return;
    o5.dataset.enterNav = "1";
    let a6 = (e) => !e.disabled && !e.readOnly && e.type !== "hidden" && e.offsetParent !== null;
    o5.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      let n3 = e.target;
      if (!n3 || n3.tagName !== "INPUT" && n3.tagName !== "SELECT" || n3.closest("[data-enter-skip]")) return;
      if (e.defaultPrevented) {
        let r2 = n3.closest(".cbx");
        if (!r2) return;
        let d4 = r2.querySelector(".cbx-list");
        if (!d4 || !d4.hidden || !n3.dataset.id) return;
      } else e.preventDefault();
      let l7 = [...o5.querySelectorAll("input, select")].filter(a6), t4 = l7.indexOf(n3);
      t4 < 0 || t4 >= l7.length - 1 || l7[t4 + 1].focus();
    });
  }
  function E(o5, a6, e = "ยืนยัน", n3 = "ยกเลิก") {
    return new Promise((l7) => {
      let t4 = document.createElement("div");
      t4.innerHTML = `<button class="btn btn-o" data-close>${n3}</button>
      <button class="btn btn-p" id="nj-cf-ok">${e}</button>`;
      let r2 = f2({ title: o5, body: `<p>${a6}</p>`, footer: t4 });
      t4.querySelector("#nj-cf-ok").onclick = () => {
        i2(), l7(true);
      }, r2.addEventListener("click", (d4) => {
        (d4.target === r2 || d4.target.closest("[data-close]")) && l7(false);
      });
    });
  }
  function x(o5) {
    return new Promise((a6) => {
      let e = document.createElement("div");
      e.innerHTML = `<div class="fld"><label>เหตุผล <span class="req">*</span></label>
      <textarea class="inp w100" id="nj-rs"></textarea></div>`;
      let n3 = document.createElement("div");
      n3.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
      <button class="btn btn-danger" id="nj-rs-ok">ยืนยัน</button>`;
      let l7 = f2({ title: o5, body: e, footer: n3 });
      n3.querySelector("#nj-rs-ok").onclick = () => {
        let t4 = e.querySelector("#nj-rs").value.trim();
        if (!t4) {
          e.querySelector("#nj-rs").focus();
          return;
        }
        i2(), a6(t4);
      }, l7.addEventListener("click", (t4) => {
        (t4.target === l7 || t4.target.closest("[data-close]")) && a6(null);
      });
    });
  }

  // assets/js/app/chunk-SGWIBJH6.js
  var P = [20, 40, 60, 100];
  var p4 = [];
  var C = 0;
  var I = () => typeof performance < "u" && performance.now ? performance.now() : Date.now();
  function m(t4) {
    let _3 = I();
    p4.push({ name: String(t4), t: _3 });
    try {
      typeof performance < "u" && performance.mark && performance.mark("nj:" + t4);
    } catch {
    }
    return _3;
  }
  var s3 = "NJ_TIMEOUT";
  function S() {
    return p4.slice();
  }
  var O2 = (t4) => {
    let _3 = p4.find((e) => e.name === t4);
    return _3 ? _3.t : null;
  };
  var a2 = (t4, _3) => {
    let e = O2(t4), n3 = O2(_3);
    return e == null || n3 == null ? null : Math.round((n3 - e) * 10) / 10;
  };
  function w() {
    return { app_status_calls: C, boot_status_ms: a2("t2_status_start", "t2_status_end"), session_ms: a2("t3_session_start", "t3_session_end"), profile_ms: a2("t4_profile_start", "t4_profile_end"), router_guard_ms: a2("t5_router_start", "t5_route_guard_end"), time_to_shell_ms: a2("t0_app_start", "t6_shell"), time_to_page_ms: a2("t0_app_start", "t7_page_ready"), sdk_ready_ms: a2("t0_app_start", "t1_sdk_ready"), marks: p4.slice() };
  }
  try {
    typeof window < "u" && (window.__NJ_BOOT = { mark: m, marks: S, report: w });
  } catch {
  }
  var T2 = /* @__PURE__ */ new Set(["njacc_app_status", "njacc_my_profile", "njacc_masters", "njacc_charge_page_bundle", "njacc_list_charges", "njacc_charge_kpi", "njacc_charge_filter_options", "njacc_charge_customer_options", "njacc_charge_company_options", "njacc_close_job_counts", "njacc_column_layouts_get", "njacc_job_detail", "njacc_job_detail_billing", "njacc_job_dup_check", "njacc_invoice_view", "njacc_invoice_draft_view", "njacc_list_billings", "njacc_get_billing", "njacc_list_receipts", "njacc_receipt_pending", "njacc_customer_open_invoices", "njacc_list_credit_notes", "njacc_credit_note_view", "njacc_credit_note_source", "njacc_credit_note_invoice_options", "njacc_list_wht", "njacc_list_wht_f", "njacc_list_wht_f2", "njacc_wht_view", "njacc_wht_party_search", "njacc_wht_invoice_options", "njacc_wht_code_list", "njacc_contact_list", "njacc_print_templates", "njacc_print_templates_for_print", "njacc_print_template_get", "njacc_print_template_fields", "njacc_quick_close_lookup", "njacc_list_audit", "njacc_admin_list_users", "njacc_quotation_list", "njacc_quotation_get", "njacc_quote_masters", "njacc_report", "njacc_wht_export_page", "njacc_backup_status"]);
  var g3 = /* @__PURE__ */ new Set(["njacc_report", "njacc_wht_export_page", "njacc_backup_status"]);
  var b = 45e3;
  var J = 12e4;
  var i3 = /* @__PURE__ */ new Map();
  var R = (t4) => {
    if (t4 == null || typeof t4 != "object") return t4;
    try {
      return typeof structuredClone == "function" ? structuredClone(t4) : JSON.parse(JSON.stringify(t4));
    } catch {
      return t4;
    }
  };
  async function j(t4, _3, e) {
    try {
      return await window.__TNJ_WHT_RPC(t4, _3, e);
    } catch (r2) {
      throw r2 && r2.__tnj ? r2 : d2(r2);
    }
  }
  async function q(t4, _3 = {}) {
    if (!T2.has(t4)) return j(t4, _3, 0);
    let e = null;
    try {
      e = t4 + "\0" + JSON.stringify(_3);
    } catch {
      e = null;
    }
    if (e && i3.has(e)) return i3.get(e).then(R);
    let n3 = j(t4, _3, g3.has(t4) ? J : b);
    return e && (i3.set(e, n3), n3.then(() => i3.delete(e), () => i3.delete(e))), n3;
  }
  function d2(t4) {
    let _3 = String(t4.message || ""), e = { NJACC_NO_PROFILE: "ไม่พบโปรไฟล์ผู้ใช้ หรือถูกปิดการใช้งาน", NJACC_FORBIDDEN: "คุณไม่มีสิทธิ์ทำรายการนี้", NJACC_LOGIN_NOT_FOUND: "ไม่พบชื่อผู้ใช้นี้", NJACC_JOB_NOT_FOUND: "ไม่พบข้อมูลงาน", NJACC_STALE_JOB: 'ข้อมูลงานนี้ถูกแก้ไขจากหน้าต่าง/เครื่องอื่นแล้ว — ยังไม่ได้บันทึก กรุณากด "โหลดข้อมูลล่าสุด" แล้วแก้ไขอีกครั้ง', NJACC_JOB_ALREADY_INVOICED: "งานนี้ออก INVOICE แล้ว", NJACC_JOB_NO_CUSTOMER: "งานนี้ยังไม่ได้ระบุลูกค้า", NJACC_JOB_HAS_INVOICE: "ยกเลิกไม่ได้ — งานนี้มี INVOICE แล้ว ต้อง Void INVOICE ก่อน", NJACC_INVOICE_HAS_PAYMENT: "Void ไม่ได้ — INVOICE นี้มีการรับชำระแล้ว ต้อง Void ใบเสร็จก่อน", NJACC_ALLOC_EXCEEDS_OUTSTANDING: "ยอดตัดชำระเกินยอดคงค้างของ INVOICE", NJACC_ALLOCATION_SUM_MISMATCH: "ยอดรับรวมไม่เท่ากับยอดตัดชำระรวม", NJACC_REASON_REQUIRED: "ต้องระบุเหตุผล", NJACC_NO_ITEMS: "ต้องมีรายการอย่างน้อย 1 รายการ", NJACC_INVOICE_NOT_OPEN: "INVOICE ไม่อยู่ในสถานะที่รับชำระได้", NJACC_RECEIPT_SERVICE_ONLY: "รับชำระได้เฉพาะ INVOICE งานบริการ (SERVICE) — งานสำรองจ่าย (ADVANCE) ต้องใช้เมนู FINANCE > Advance", NJACC_CLOSE_BAD_STATUS: "ปิดงานไม่ได้ — งานนี้ไม่ได้อยู่ในสถานะ OPEN หรือ PROCESSING", NJACC_ACCOUNTING_HANDOFF_FAILED: "ปิดงานไม่สำเร็จ — ACCOUNTING ยังรับงานนี้ไม่ได้ ระบบยกเลิกรายการทั้งหมดแล้ว งานยังอยู่ที่ DOCUMENT กรุณาลองใหม่" };
    if (t4 && t4.name === "AbortError" || /AbortError/.test(_3)) {
      let n3 = new Error("การเชื่อมต่อใช้เวลานานเกินไป — กรุณาลองใหม่");
      return n3.code = s3, n3;
    }
    if (_3.includes("NJACC_DOC_REQUIRED")) {
      let n3 = new Error("⚠ กรอกช่องที่บังคับให้ครบก่อน — ยังไม่ได้กรอก: " + (_3.split("NJACC_DOC_REQUIRED:")[1] || "").trim() + " (ยังไม่มีข้อมูลใดถูกบันทึก)");
      return n3.code = "NJACC_DOC_REQUIRED", n3;
    }
    for (let n3 in e) if (_3.includes(n3)) {
      let c4 = new Error(e[n3]);
      return c4.code = n3, c4;
    }
    return t4 instanceof Error ? t4 : new Error(_3 || "เกิดข้อผิดพลาด");
  }

  // assets/js/app/chunk-TMCB7RDJ.js
  function mt(t4, e) {
    if (!t4 || t4.dataset.rowopen === "1") return;
    t4.dataset.rowopen = "1";
    let n3 = t4.closest("table");
    n3 && n3.classList.add("rowclick"), t4.addEventListener("click", (s7) => {
      if (s7.target.closest("button, a, input, select, textarea, label, [data-act], .row-menu")) return;
      let o5 = s7.target.closest("tr");
      if (!o5 || o5.parentElement !== t4 || o5.querySelector("td[colspan]")) return;
      let a6 = typeof window < "u" && window.getSelection ? window.getSelection() : null;
      a6 && String(a6).trim() !== "" || e(o5, s7);
    });
  }
  var et = ["DOCUMENT_SERVICE", "DOCUMENT_ADVANCE", "ACCOUNTING_SERVICE", "ACCOUNTING_ADVANCE", "FINANCE_ADVANCE", "FINANCE_CLOSE_JOB", "FINANCE_CREDIT_NOTE", "FINANCE_RECEIPT_PENDING", "FINANCE_RECEIPT_ISSUED", "REPORT_WHT", "REPORT_MAIN"];
  var nt = 6e4;
  function z(t4) {
    return t4 && t4.tHead && t4.tHead.rows[0] || null;
  }
  function st(t4) {
    let e = z(t4);
    return e ? (e.dataset.ciTagged !== "1" && ([...e.cells].forEach((n3, s7) => {
      n3.dataset.ci = String(s7), n3.dataset.colRaw = n3.textContent || "";
    }), e.dataset.ciTagged = "1"), [...e.cells].sort((n3, s7) => Number(n3.dataset.ci) - Number(s7.dataset.ci))) : [];
  }
  var Y = /* @__PURE__ */ new WeakMap();
  var ot = (t4) => t4.length + "|" + t4.map((e) => e.dataset.ci + ":" + (e.dataset.colRaw != null ? e.dataset.colRaw : e.textContent || "").length).join(",");
  function H(t4) {
    let e = st(t4), n3 = ot(e), s7 = Y.get(t4);
    if (s7 && s7.sig === n3) return s7.defs;
    let o5 = rt(e);
    return Y.set(t4, { sig: n3, defs: o5 }), o5;
  }
  function rt(t4) {
    return t4.map((e) => {
      let s7 = (e.dataset.colRaw != null ? e.dataset.colRaw : e.textContent || "").replace(/⇅/g, "").replace(/\s+/g, " ").trim();
      return { i: Number(e.dataset.ci), label: s7 || "คอลัมน์ " + (Number(e.dataset.ci) + 1), reqFirst: e.dataset.colReq === "1", required: e.classList.contains("col-act") || s7 === "จัดการ" || e.dataset.colReq === "1", defHidden: e.dataset.colDefault === "hidden" };
    });
  }
  var k = (t4) => t4.length + "|" + t4.map((e) => e.label).join("|");
  var S2 = /* @__PURE__ */ new Map();
  var R2 = 0;
  var O3 = null;
  var F = /* @__PURE__ */ new Map();
  var q2 = (t4, e) => {
    let n3 = {};
    return t4 && typeof t4 == "object" && !Array.isArray(t4) && Object.keys(t4).forEach((s7) => {
      if (/^\d{1,4}$/.test(s7)) {
        let o5 = e(t4[s7]);
        o5 != null && (n3[s7] = o5);
      }
    }), n3;
  };
  var $ = (t4) => {
    let e = Math.round(Number(t4));
    return Number.isFinite(e) && e >= 40 && e <= 1e3 ? e : null;
  };
  var j2 = (t4) => String(t4 ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
  var ct = (t4) => {
    if (!(t4 && typeof t4 == "object" && Array.isArray(t4.order))) return null;
    let e = { sig: String(t4.sig || ""), order: t4.order.map(Number), hidden: Array.isArray(t4.hidden) ? t4.hidden.map(Number) : [] }, n3 = q2(t4.widths, $), s7 = q2(t4.labels, j2);
    return Object.keys(n3).length && (e.widths = n3), Object.keys(s7).length && (e.labels = s7), e;
  };
  var at = { ACCOUNTING_SERVICE: ["คอลัมน์ 1", "เลขที่งาน", "ชื่อ USER", "Invoice No.", "บริษัท Invoice", "ลูกค้า", "Customer Job No.", "เลขใบขนสินค้า", "Invoice ต้นทาง (Source)", "House B/L No.", "Master B/L No.", "Service charge", "Advance", "VAT 7%", "Amount", "WHT 3%", "Total Amount"], ACCOUNTING_ADVANCE: ["คอลัมน์ 1", "เลขที่งาน", "ชื่อ USER", "ลูกค้า", "Customer Job No.", "Advance", "Cost", "Charge", "Total", "Billing Note no."], DOCUMENT_SERVICE: ["JOB NJ", "วันที่งาน", "โหมด", "ประเภท", "บริษัท", "เลขใบขนสินค้า", "Invoice No.", "House B/L No.", "Master B/L No.", "ลูกค้า", "Customer Job No.", "USER"] };
  function lt(t4, e) {
    let n3 = at[String(t4 || "").toUpperCase()];
    if (!n3) return null;
    let s7 = /* @__PURE__ */ new Set(), o5 = [];
    if (n3.forEach((r2) => {
      let c4 = e.find((m3) => m3.label === r2 && !s7.has(m3.i));
      c4 && (s7.add(c4.i), o5.push(c4.i));
    }), o5.length < Math.min(3, n3.length)) return null;
    let a6 = e.filter((r2) => !s7.has(r2.i)).map((r2) => r2.i);
    return { sig: k(e), order: o5.concat(a6), hidden: a6.slice() };
  }
  var B = (t4) => /^ACCOUNTING_/.test(String(t4 || "").toUpperCase());
  function it(t4 = false) {
    if (O3) return O3;
    if (!t4 && R2 && Date.now() - R2 < nt) return Promise.resolve(/* @__PURE__ */ new Set());
    let e = [...new Set(et.concat([...F.keys()]))];
    return O3 = Promise.resolve().then(() => q("njacc_column_layouts_get", { p: { mode_keys: e } })).then((n3) => {
      let s7 = n3 && n3.layouts || {}, o5 = /* @__PURE__ */ new Set();
      return e.forEach((a6) => {
        let r2 = ct(s7[a6] && s7[a6].layout), c4 = S2.has(a6) ? S2.get(a6) : void 0;
        JSON.stringify(r2) !== JSON.stringify(c4 === void 0 ? null : c4) && o5.add(a6), S2.set(a6, r2);
      }), R2 = Date.now(), o5;
    }).catch(() => (R2 = Date.now(), /* @__PURE__ */ new Set())).finally(() => {
      O3 = null;
    }), O3;
  }
  function Q(t4) {
    t4.forEach((e) => {
      let n3 = F.get(e);
      if (typeof n3 == "function") try {
        n3();
      } catch {
      }
    });
  }
  var Z = () => T();
  var D = (t4) => B(t4) ? t() === "SUPER_ADMIN" : Z();
  function W(t4, e) {
    let n3 = S2.has(t4) ? S2.get(t4) : null;
    return !n3 || !Array.isArray(n3.order) || n3.sig !== k(e) ? null : n3;
  }
  async function K(t4, e) {
    let n3 = S2.has(t4), s7 = n3 ? S2.get(t4) : null;
    if (!D(t4)) return n("ไม่มีสิทธิ์จัดการคอลัมน์", "err"), false;
    S2.set(t4, e);
    try {
      return await q("njacc_column_layout_save", { p: { mode_key: String(t4 || "").toUpperCase(), layout: e } }), true;
    } catch (o5) {
      n3 ? S2.set(t4, s7) : S2.delete(t4), Q([t4]);
      let a6 = String(o5 && o5.message || "");
      return n(/NJACC_FORBIDDEN/.test(a6) ? "ไม่มีสิทธิ์จัดการคอลัมน์ของหน้านี้" : "บันทึก Layout คอลัมน์ไม่สำเร็จ — " + (a6 || "ลองใหม่อีกครั้ง"), "err"), false;
    }
  }
  function tt(t4, e, n3, s7, o5) {
    let a6 = { sig: k(e), order: n3.slice(), hidden: (s7 || []).slice() }, r2 = o5 || W(t4, e) || {}, c4 = q2(r2.widths, $), m3 = q2(r2.labels, j2);
    return Object.keys(c4).length && (a6.widths = c4), Object.keys(m3).length && (a6.labels = m3), K(t4, a6);
  }
  function ut(t4) {
    return K(t4, null);
  }
  function U2(t4, e, n3) {
    !e && n3 && (e = lt(n3, t4));
    let s7 = t4.filter((l7) => l7.required).map((l7) => l7.i), o5 = t4.filter((l7) => l7.reqFirst).map((l7) => l7.i), a6 = t4.filter((l7) => l7.required && !l7.reqFirst).map((l7) => l7.i), r2 = new Set(t4.map((l7) => l7.i)), c4 = (e && e.order ? e.order : t4.map((l7) => l7.i)).filter((l7) => r2.has(l7));
    t4.forEach((l7) => {
      c4.includes(l7.i) || c4.push(l7.i);
    }), c4 = o5.concat(c4.filter((l7) => !s7.includes(l7))).concat(a6);
    let m3 = e && e.hidden ? e.hidden : t4.filter((l7) => l7.defHidden).map((l7) => l7.i), g4 = new Set(m3.filter((l7) => r2.has(l7) && !s7.includes(l7)));
    return { order: c4, hidden: g4 };
  }
  function dt(t4, e) {
    let n3 = z(t4);
    if (!n3) return;
    let s7 = H(t4), o5 = W(e, s7), { order: a6, hidden: r2 } = U2(s7, o5, e), c4 = a6.filter((u6) => !r2.has(u6)).length, m3 = a6.length === s7.length && a6.every((u6, f7) => u6 === f7), g4 = {};
    if ([...n3.cells].forEach((u6) => {
      g4[u6.dataset.ci] = u6;
    }), m3) a6.forEach((u6) => {
      let f7 = g4[u6];
      if (!f7) return;
      let h = r2.has(u6);
      f7.hidden !== h && (f7.hidden = h);
    });
    else {
      let u6 = document.createDocumentFragment();
      a6.forEach((f7) => {
        let h = g4[f7];
        h && (h.hidden = r2.has(f7), u6.appendChild(h));
      }), n3.appendChild(u6);
    }
    let l7 = o5 && o5.labels || {}, A = o5 && o5.widths || {};
    [...n3.cells].forEach((u6) => {
      let f7 = u6.dataset.colRaw;
      if (f7 == null) return;
      let h = l7[u6.dataset.ci], d4 = h ? h + (/⇅/.test(f7) ? " ⇅" : "") : f7;
      u6.textContent !== d4 && (u6.textContent = d4);
    });
    let E3 = [...n3.cells].map((u6) => Number(u6.dataset.ci));
    [...t4.tHead.rows].slice(1).forEach((u6) => {
      let f7 = [...u6.cells];
      if (f7.length === 1 && f7[0].hasAttribute("colspan")) {
        f7[0].colSpan = c4;
        return;
      }
      if (f7.length !== s7.length) return;
      u6.dataset.collay !== "1" && (f7.forEach((i7, C2) => {
        i7.dataset.ci = String(C2);
      }), u6.dataset.collay = "1");
      let h = {};
      f7.forEach((i7) => {
        h[i7.dataset.ci] = i7;
      });
      let d4 = document.createDocumentFragment();
      E3.forEach((i7) => {
        let C2 = h[i7];
        C2 && (C2.hidden = r2.has(i7), d4.appendChild(C2));
      }), u6.appendChild(d4);
    });
    let b2 = s7.length, v2 = t4.tBodies;
    for (let u6 = 0; u6 < v2.length; u6++) {
      let f7 = v2[u6].rows;
      for (let h = 0; h < f7.length; h++) {
        let d4 = f7[h], i7 = d4.cells;
        if (i7.length === 1 && i7[0].hasAttribute("colspan")) {
          i7[0].colSpan = c4;
          continue;
        }
        if (i7.length !== b2) continue;
        if (d4.dataset.collay !== "1") {
          for (let p7 = 0; p7 < i7.length; p7++) i7[p7].dataset.ci = String(p7);
          d4.dataset.collay = "1";
        }
        if (m3) {
          for (let p7 = 0; p7 < i7.length; p7++) {
            let L = r2.has(p7);
            i7[p7].hidden !== L && (i7[p7].hidden = L);
          }
          continue;
        }
        let C2 = {};
        for (let p7 = 0; p7 < i7.length; p7++) C2[i7[p7].dataset.ci] = i7[p7];
        let w2 = document.createDocumentFragment();
        a6.forEach((p7) => {
          let L = C2[p7];
          L && (L.hidden = r2.has(p7), w2.appendChild(L));
        }), d4.appendChild(w2);
      }
    }
    ft(t4, n3, A);
  }
  function ft(t4, e, n3) {
    let s7 = Object.keys(n3).length > 0;
    if (!s7 && t4.dataset.colW !== "1") return;
    t4.dataset.colW = s7 ? "1" : "";
    let o5 = (r2, c4, m3) => {
      let g4 = c4 ? c4 + "px" : "";
      r2.style.width === g4 && r2.style.maxWidth === g4 || (r2.style.width = g4, r2.style.minWidth = g4, r2.style.maxWidth = g4, m3 || (r2.style.overflow = c4 ? "hidden" : "", r2.style.textOverflow = c4 ? "ellipsis" : ""));
    };
    [...e.cells].forEach((r2) => o5(r2, n3[r2.dataset.ci], true));
    let a6 = t4.tBodies;
    for (let r2 = 0; r2 < a6.length; r2++) {
      let c4 = a6[r2].rows;
      for (let m3 = 0; m3 < c4.length; m3++) {
        let g4 = c4[m3].cells;
        if (!(g4.length === 1 && g4[0].hasAttribute("colspan"))) for (let l7 = 0; l7 < g4.length; l7++) {
          let A = g4[l7].dataset.ci;
          A != null && o5(g4[l7], n3[A], false);
        }
      }
    }
  }
  function ht(t4, e, n3) {
    if (!t4 || !t4.tHead || t4.tHead.dataset.dragOn === "1" || !D(e)) return;
    t4.tHead.dataset.dragOn = "1";
    let s7 = t4.tHead.rows[0], o5 = null, a6 = 0, r2 = false, c4 = null, m3 = () => [...s7.cells].forEach((E3) => E3.classList.remove("th-drag", "th-drop-b", "th-drop-a")), g4 = (E3) => E3.classList.contains("col-act") || (E3.textContent || "").replace(/\s+/g, " ").trim() === "จัดการ";
    function l7(E3) {
      if (!o5 || !r2 && Math.abs(E3.clientX - a6) < 5) return;
      if (!r2) {
        r2 = true, o5.classList.add("th-drag"), document.body.classList.add("is-coldrag");
        try {
          let h = window.getSelection();
          h && h.removeAllRanges && h.removeAllRanges();
        } catch {
        }
      }
      let b2 = document.elementFromPoint(E3.clientX, E3.clientY), v2 = b2 && b2.closest ? b2.closest("th") : null;
      if (m3(), o5.classList.add("th-drag"), !v2 || v2 === o5 || v2.parentElement !== s7 || g4(v2)) {
        c4 = null;
        return;
      }
      let u6 = v2.getBoundingClientRect(), f7 = E3.clientX > u6.left + u6.width / 2;
      v2.classList.add(f7 ? "th-drop-a" : "th-drop-b"), c4 = { cell: v2, after: f7 };
    }
    function A() {
      let E3 = r2, b2 = c4, v2 = o5;
      if (document.removeEventListener("mousemove", l7), document.removeEventListener("mouseup", A), document.body.classList.remove("is-coldrag"), m3(), o5 = null, c4 = null, r2 = false, !E3 || !v2) return;
      let u6 = (i7) => {
        i7.stopPropagation(), i7.preventDefault();
      };
      if (s7.addEventListener("click", u6, { capture: true, once: true }), !b2) return;
      b2.after ? b2.cell.after(v2) : b2.cell.before(v2);
      let f7 = H(t4), h = [...s7.cells].map((i7) => Number(i7.dataset.ci)), d4 = [...s7.cells].filter((i7) => i7.hidden).map((i7) => Number(i7.dataset.ci));
      tt(e, f7, h, d4), typeof n3 == "function" && n3();
    }
    s7.addEventListener("mousedown", (E3) => {
      if (E3.button !== 0) return;
      let b2 = E3.target.closest("th");
      !b2 || b2.parentElement !== s7 || g4(b2) || (o5 = b2, a6 = E3.clientX, r2 = false, c4 = null, document.addEventListener("mousemove", l7), document.addEventListener("mouseup", A));
    });
  }
  function pt(t4, e, n3, s7) {
    if (s7 && typeof s7.guard == "function" && !s7.guard() || !D(e)) return;
    let o5 = H(t4), a6 = W(e, o5), r2 = U2(o5, a6, e), c4 = {};
    o5.forEach((d4) => {
      c4[d4.i] = d4;
    });
    let m3 = B(e), g4 = a6 && a6.labels || {}, l7 = a6 && a6.widths || {}, A = (d4) => m3 ? `<input class="inp colmg-name" maxlength="60" placeholder="${c2(d4.label)}"
        value="${c2(g4[d4.i] || "")}" title="ชื่อหัวข้อที่แสดง (เว้นว่าง = ชื่อเดิม)">
      <input class="inp colmg-w" type="number" min="40" max="1000" step="10" placeholder="อัตโนมัติ"
        value="${l7[d4.i] || ""}" title="ความกว้าง (px) · เว้นว่าง = อัตโนมัติ">` : "", E3 = (d4, i7) => `<li class="colmg-it${d4.required ? " is-req" : ""}${m3 ? " colmg-ext" : ""}" data-ci="${d4.i}">
      <span class="colmg-h" title="ลากเพื่อจัดลำดับ">☰</span>
      <label class="colmg-lb"><input type="checkbox" ${i7 ? "checked" : ""}
        ${d4.required ? "disabled" : ""}> <span>${c2(d4.label)}</span></label>
      ${A(d4)}
      ${d4.required ? '<span class="colmg-req">บังคับ</span>' : ""}</li>`, b2 = document.createElement("div"), v2 = o5.some((d4) => d4.required), u6 = (d4, i7) => {
      b2.innerHTML = `<div class="colmg">
      <div class="colmg-hint">ลากที่ <b>☰</b> เพื่อจัดลำดับ · ติ๊กเพื่อแสดง / เอาติ๊กออกเพื่อซ่อน${m3 ? "<br>ตั้ง <b>ชื่อหัวข้อ</b> และ <b>ความกว้าง (px)</b> ได้ต่อคอลัมน์ · เว้นว่าง = ค่าเดิม · มีผลกับผู้ใช้ทุกคน" : ""}${v2 ? "<br>คอลัมน์ <b>จัดการ</b> เป็นคอลัมน์บังคับ (ปุ่มสั่งงานแถวอยู่ในนั้น) ซ่อนไม่ได้และอยู่ท้ายสุดเสมอ" : ""}</div>
      <ul class="colmg-list">${d4.map((C2) => E3(c4[C2], !i7.has(C2))).join("")}</ul></div>`, f7();
    };
    function f7() {
      b2.querySelector(".colmg-list").addEventListener("mousedown", (i7) => {
        let C2 = i7.target.closest(".colmg-h");
        if (!C2) return;
        let w2 = C2.closest(".colmg-it");
        if (!w2 || w2.classList.contains("is-req")) return;
        i7.preventDefault(), w2.classList.add("is-drag");
        let p7 = (_3) => {
          let y2 = document.elementFromPoint(_3.clientX, _3.clientY), N2 = y2 && y2.closest ? y2.closest(".colmg-it") : null;
          if (!N2 || N2 === w2 || N2.classList.contains("is-req")) return;
          let x3 = N2.getBoundingClientRect();
          _3.clientY > x3.top + x3.height / 2 ? N2.after(w2) : N2.before(w2);
        }, L = () => {
          document.removeEventListener("mousemove", p7), document.removeEventListener("mouseup", L), w2.classList.remove("is-drag");
        };
        document.addEventListener("mousemove", p7), document.addEventListener("mouseup", L);
      });
    }
    u6(r2.order, r2.hidden);
    let h = document.createElement("div");
    h.style.display = "contents", h.innerHTML = `<div class="mf-left">
      <button class="btn btn-o" id="colmg-reset">↺ คืนค่าเริ่มต้น</button></div>
    <div class="mf-right">
      <button class="btn btn-p" id="colmg-save">💾 บันทึก</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`, f2({ title: "จัดการคอลัมน์", body: b2, footer: h, large: true }), h.querySelector("#colmg-reset").onclick = async (d4) => {
      let i7 = d4.currentTarget;
      i7.disabled = true;
      let C2 = await ut(e);
      if (i7.disabled = false, !C2) return;
      g4 = {}, l7 = {};
      let w2 = U2(o5, null, e);
      u6(w2.order, w2.hidden), typeof n3 == "function" && n3();
    }, h.querySelector("#colmg-save").onclick = async (d4) => {
      let i7 = [...b2.querySelectorAll(".colmg-it")], C2 = i7.map((y2) => Number(y2.dataset.ci)), w2 = i7.filter((y2) => {
        let N2 = y2.querySelector("input[type=checkbox]");
        return N2 && !N2.checked;
      }).map((y2) => Number(y2.dataset.ci)), p7;
      m3 && (p7 = { labels: {}, widths: {} }, i7.forEach((y2) => {
        let N2 = y2.dataset.ci, x3 = j2((y2.querySelector(".colmg-name") || {}).value);
        x3 && x3 !== c4[N2].label && (p7.labels[N2] = x3);
        let P2 = $((y2.querySelector(".colmg-w") || {}).value);
        P2 && (p7.widths[N2] = P2);
      }));
      let L = d4.currentTarget;
      L.disabled = true;
      let _3 = await tt(e, o5, C2, w2, p7);
      L.disabled = false, _3 && (i2(), typeof n3 == "function" && n3());
    };
  }
  function wt({ table: t4, modeKey: e, host: n3, onLayout: s7, canManage: o5 }) {
    if (!t4 || !e) return;
    let a6 = () => B(e) ? D(e) : o5 === void 0 ? Z() : typeof o5 == "function" ? !!o5() : !!o5, r2 = () => {
      dt(t4, e), typeof s7 == "function" && s7();
    };
    if (F.set(e, () => {
      t4.isConnected && r2();
    }), it().then((c4) => {
      c4.size && Q([...c4]);
    }), a6() && ht(t4, e, r2), n3 && a6() && !n3.querySelector("[data-colmg]")) {
      let c4 = document.createElement("button");
      c4.className = "btn btn-o btn-sm", c4.type = "button", c4.setAttribute("data-colmg", ""), c4.textContent = "⚙ คอลัมน์", c4.title = "จัดการคอลัมน์ — ลากเพื่อเรียง · ติ๊กเพื่อซ่อน/แสดง", c4.onclick = () => pt(t4, e, r2, { guard: a6 }), n3.appendChild(c4);
    }
    r2();
  }

  // assets/js/app/chunk-6REVCVGI.js
  function u3(o5, { page: g4, size: c4, total: r2 }, $2, d4 = {}) {
    let s7 = Math.max(1, Math.ceil(r2 / c4)), a6 = Math.min(g4, s7), e = (t4, p7, i7, n3) => `<button data-p="${p7}" ${i7 ? "disabled" : ""} class="${n3 ? "cur" : ""}">${t4}</button>`;
    if (d4 && d4.lp) {
      let t4 = (p7) => Number(p7).toLocaleString("th-TH");
      o5.innerHTML = `<div class="pgn pgn-lp">
      <div class="pgn-nav">
        ${e("⏮", 1, a6 === 1)}${e("◀", a6 - 1, a6 === 1)}
        <span class="pgn-pos">หน้า ${t4(a6)} / ${t4(s7)}</span>
        ${e("▶", a6 + 1, a6 === s7)}${e("⏭", s7, a6 === s7)}
      </div>
      <div class="pgn-rpp"><span>แสดง</span>
        <select class="sel" data-size>${P.map((p7) => `<option ${p7 === c4 ? "selected" : ""}>${p7} / หน้า</option>`).join("")}</select>
      </div>
    </div>`;
    } else {
      let t4 = "", p7 = Math.max(1, a6 - 2), i7 = Math.min(s7, a6 + 2);
      for (let n3 = p7; n3 <= i7; n3++) t4 += e(n3, n3, false, n3 === a6);
      o5.innerHTML = `<div class="pgn">
    <span>ทั้งหมด ${r2.toLocaleString("th-TH")} รายการ</span><span class="sp"></span>
    ${e("⏮", 1, a6 === 1)}${e("◀", a6 - 1, a6 === 1)}${t4}${e("▶", a6 + 1, a6 === s7)}${e("⏭", s7, a6 === s7)}
    <select class="sel" data-size>${P.map((n3) => `<option ${n3 === c4 ? "selected" : ""}>${n3}</option>`).join("")}</select>
  </div>`;
    }
    o5.querySelectorAll("[data-p]").forEach((t4) => t4.onclick = () => $2({ page: Number(t4.dataset.p), size: c4 })), o5.querySelector("[data-size]").onchange = (t4) => $2({ page: 1, size: parseInt(t4.target.value, 10) });
  }

  // assets/js/app/chunk-OWSY2KDQ.js
  var u4 = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  var l3 = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
  function i4(c4) {
    let t4 = "", n3 = String(c4), e = n3.length;
    for (let r2 = 0; r2 < e; r2++) {
      let o5 = Number(n3[r2]), s7 = e - r2 - 1;
      o5 !== 0 && (s7 === 1 && o5 === 1 ? t4 += "สิบ" : s7 === 1 && o5 === 2 ? t4 += "ยี่สิบ" : s7 === 0 && o5 === 1 && e > 1 ? t4 += "เอ็ด" : t4 += u4[o5] + l3[s7]);
    }
    return t4;
  }
  function a3(c4) {
    if (c4 === 0) return "ศูนย์";
    let t4 = [], n3 = c4;
    for (; n3 > 0; ) t4.unshift(n3 % 1e6), n3 = Math.floor(n3 / 1e6);
    return t4.map((e, r2) => e === 0 ? (r2 === t4.length - 1, "") : i4(e) + "ล้าน".repeat(t4.length - 1 - r2)).join("");
  }
  function f3(c4) {
    let t4 = Number(c4);
    if (!Number.isFinite(t4)) return "";
    let n3 = t4 < 0, e = Math.round(Math.abs(t4) * 100), r2 = Math.floor(e / 100), o5 = e % 100, s7 = a3(r2) + "บาท";
    return s7 += o5 === 0 ? "ถ้วน" : i4(o5) + "สตางค์", (n3 ? "ลบ" : "") + s7;
  }

  // assets/js/app/chunk-NG45Y6KB.js
  function o2(e, r2) {
    let n3 = e.closest(".fld");
    if (!n3) return;
    n3.classList.add("invalid");
    let t4 = n3.querySelector(".err-msg");
    t4 || (t4 = document.createElement("div"), t4.className = "err-msg", n3.appendChild(t4)), t4.textContent = r2;
  }
  function s4(e) {
    e.querySelectorAll(".fld.invalid").forEach((r2) => r2.classList.remove("invalid")), e.querySelectorAll(".err-msg").forEach((r2) => r2.remove());
  }

  // assets/js/app/chunk-L5Z2NDJ3.js
  var c3 = () => q("njacc_masters");
  var s5 = null;
  async function R3(t4 = false) {
    if (l.masters && !t4) return l.masters;
    if (!t4 && s5) return s5;
    let e = c3().then((r2) => (l.masters = r2, r2));
    t4 || (s5 = e);
    try {
      return await e;
    } finally {
      s5 === e && (s5 = null);
    }
  }
  function x2() {
    return (l.masters?.customers || []).filter((t4) => t4.active !== false);
  }
  var i5 = null;
  var l4 = "";
  var f4 = (t4) => String(t4).replace(/</g, "&lt;");
  function v(t4, e) {
    if (!e) return t4;
    let r2 = `<option value="${e}" >`;
    return t4.includes(r2) ? t4.replace(r2, `<option value="${e}" selected>`) : t4;
  }
  function B2(t4) {
    let e = l.masters?.customers || null;
    return e !== i5 && (i5 = e, l4 = '<option value="">— เลือกลูกค้า —</option>' + x2().map((r2) => `<option value="${r2.id}" >${f4(r2.name)}</option>`).join("")), v(l4, t4);
  }

  // assets/js/app/chunk-LAFWE2EM.js
  var l5 = /* @__PURE__ */ new Map();
  var m2 = 6e4;
  function f5(e) {
    if (l5.has(e)) return l5.get(e);
    let c4 = new Promise((n3, a6) => {
      let o5 = document.createElement("script"), t4 = null, i7 = (s7) => {
        clearTimeout(t4), l5.delete(e);
        try {
          o5.remove();
        } catch {
        }
        a6(new Error(s7));
      };
      o5.src = e, o5.onload = () => {
        clearTimeout(t4), n3(true);
      }, o5.onerror = () => i7("โหลดสคริปต์ไม่สำเร็จ: " + e), t4 = setTimeout(() => i7("โหลดสคริปต์ใช้เวลานานเกินไป — กรุณาลองใหม่: " + e), m2), document.head.appendChild(o5);
    });
    return l5.set(e, c4), c4;
  }
  var d3 = /* @__PURE__ */ new Map();
  function p5(e) {
    if (typeof document > "u") return Promise.resolve();
    let c4 = typeof window < "u" && window.__BUILD || "", n3 = c4 ? e + "?v=" + c4 : e;
    if (d3.has(n3)) return d3.get(n3);
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((t4) => (t4.getAttribute("href") || "") === n3)) {
      let t4 = Promise.resolve();
      return d3.set(n3, t4), t4;
    }
    let o5 = new Promise((t4) => {
      let i7 = false, s7 = () => {
        i7 || (i7 = true, t4());
      }, r2 = document.createElement("link");
      r2.rel = "stylesheet", r2.href = n3, r2.addEventListener("load", s7, { once: true }), r2.addEventListener("error", s7, { once: true }), document.head.appendChild(r2);
      let u6 = setInterval(() => {
        r2.sheet && (clearInterval(u6), s7());
      }, 30);
      setTimeout(() => {
        clearInterval(u6), s7();
      }, 1200);
    });
    return d3.set(n3, o5), o5;
  }

  // assets/js/app/chunk-UWAYW6DC.js
  var o3 = { nameEn: "N.J. TRANSPORT CO., LTD.", address: "62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)", tel: "033-000870", fax: "033-000870", taxId: "0205564035036", logo: "data:image/png;base64,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" };

  // assets/js/app/chunk-EVZDPOX3.js
  function a4(i7, e) {
    i7 && (i7.disabled = e, e ? (i7.dataset.txt = i7.innerHTML, i7.innerHTML = "กำลังทำรายการ…") : i7.dataset.txt && (i7.innerHTML = i7.dataset.txt));
  }

  // assets/js/app/chunk-FL6ZW7SA.js
  var H2 = /* @__PURE__ */ new Set();
  var _2 = false;
  function j3() {
    H2.forEach((a6) => {
      a6.el.isConnected ? a6.seen = true : a6.seen && H2.delete(a6);
    });
  }
  function X(a6, f7) {
    j3();
    let t4 = { el: a6, fn: f7, seen: false };
    H2.add(t4), typeof requestAnimationFrame == "function" && requestAnimationFrame(() => {
      a6.isConnected && (t4.seen = true);
    }), !_2 && (_2 = true, document.addEventListener("mousedown", (n3) => {
      j3(), [...H2].forEach((d4) => {
        d4.el.isConnected && d4.fn(n3);
      });
    }));
  }

  // assets/js/app/chunk-OPGKUGLK.js
  var r = /* @__PURE__ */ new Map();
  function u5(t4) {
    let e = (r.get(t4) || 0) + 1;
    return r.set(t4, e), e;
  }
  function a5(t4, e) {
    return r.get(t4) === e;
  }
  var n2 = /* @__PURE__ */ new Map();
  function i6(t4, e, c4 = 300) {
    clearTimeout(n2.get(t4)), n2.set(t4, setTimeout(e, c4));
  }
  function s6(t4) {
    clearTimeout(n2.get(t4)), n2.delete(t4);
  }
  var o4 = /* @__PURE__ */ new Set();
  async function l6(t4, e) {
    if (o4.has(t4)) return null;
    o4.add(t4);
    try {
      return await e();
    } finally {
      o4.delete(t4);
    }
  }
  function p6() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  // assets/js/app/chunk-YM5GFE6V.js
  function t2(r2, e = "เกิดข้อผิดพลาด") {
    console.error("[BILLING NJ]", r2), n(r2 && r2.message ? r2.message : e, "err");
  }

  // assets/js/app/withholding-page-KQ2TRY62.js
  var ye = "ACTING_AGENT";
  var ot2 = (e) => q("njacc_list_wht", e);
  var Gt = (e) => q("njacc_list_wht_f", e);
  var Yt = (e) => q("njacc_list_wht_f2", e);
  var ct2 = (e, n3, s7) => q("njacc_void_wht", { p_id: e, p_reason: n3, p_request_id: s7 });
  var Kt = (e) => q("njacc_wht_invoice_options", { p: e });
  var Qt = (e) => q("njacc_save_wht_draft", { p: e });
  var Xt = (e, n3) => q("njacc_post_wht", { p_id: e, p_request_id: n3 });
  var Me = (e) => q("njacc_wht_view", { p_id: e });
  var Zt = () => q("njacc_wht_code_list");
  var Ae = (e) => q("njacc_wht_party_search", { p: e });
  var dt2 = (e) => q("njacc_wht_party_upsert", { p: e });
  var lt2 = (e, n3) => q("njacc_delete_wht_draft", { p_id: e, p_reason: n3 });
  var pt2 = (e, n3) => q("njacc_unpost_wht", { p_id: e, p_reason: n3 });
  function ve(e) {
    let n3 = String(e && (e.message || e.hint || e.details) || "");
    return /PGRST202/i.test(n3) || /Could not find the function/i.test(n3) || /schema cache/i.test(n3) && /njacc_(wht|save_wht|post_wht|delete_wht)/i.test(n3);
  }
  var Bt = { NJACC_WHT_NOT_FOUND: "ไม่พบหนังสือรับรองฉบับนี้", NJACC_WHT_NOT_DRAFT: "เอกสารนี้ไม่ได้อยู่ในสถานะร่างแล้ว", NJACC_WHT_ALREADY_VOID: "เอกสารนี้ถูกยกเลิกไปแล้ว", NJACC_REASON_REQUIRED: "กรุณาระบุเหตุผลที่ยกเลิก", NJACC_WHT_ALREADY_ISSUED: "เอกสารนี้ถูกบันทึกจริงไปแล้ว", NJACC_WHT_PAY_DATE_REQUIRED: "ต้องระบุวันที่จ่ายเงินจริงก่อนยืนยันบันทึก", NJACC_WHT_ITEM_PAY_DATE_REQUIRED: "ทุกรายการต้องมีวันที่จ่ายเงินจริง", NJACC_WHT_RATE_REQUIRED: "ต้องระบุอัตราภาษีหัก ณ ที่จ่ายทุกรายการ", NJACC_WHT_CUSTOMER_REQUIRED: "ต้องเลือกผู้หักภาษี / ลูกค้าผู้จ่ายเงินก่อน", NJACC_WHT_CUSTOMER_NOT_FOUND: "ไม่พบผู้หักภาษีรายนี้", NJACC_WHT_INVOICE_MISMATCH: "ใบแจ้งหนี้ที่อ้างอิงไม่ใช่ของลูกค้าผู้หักภาษีรายนี้", NJACC_WHT_BASE_INVALID: "จำนวนเงินที่จ่ายต้องมากกว่า 0 ทุกรายการ", NJACC_BAD_TAX_RATE: "อัตราภาษีต้องอยู่ระหว่าง 0–100", NJACC_NO_ITEMS: "ต้องมีรายการเงินได้อย่างน้อย 1 รายการ", NJACC_WHT_BAD_DIRECTION: "ทิศทางเอกสารไม่ถูกต้อง", NJACC_WHT_AMOUNT_INVALID: "จำนวนเงินภาษีต้องไม่ติดลบ", NJACC_WHT_AMOUNT_GT_BASE: "จำนวนเงินภาษีต้องไม่มากกว่าจำนวนเงินที่จ่าย", NJACC_WHT_REASON_REQUIRED: "ต้องระบุเหตุผลก่อน UNPOST", NJACC_WHT_NOT_ISSUED: "เอกสารนี้ยังไม่ได้ POST — UNPOST ไม่ได้", NJACC_WHT_VOIDED: "เอกสารนี้ถูก VOID แล้ว", NJACC_WHT_EXPORT_INCOMPLETE: "ดึงข้อมูลไม่ครบ — ยังไม่สร้างไฟล์", NJACC_WHT_CERT_NO_REQUIRED: "ต้องระบุเลขที่หนังสือรับรองก่อนระบบจะออกเลขให้", NJACC_WHT_PAYER_REQUIRED: "ต้องระบุชื่อผู้มีหน้าที่หักภาษีก่อนระบบจะออกเลขให้", NJACC_WHT_PAYEE_REQUIRED: "ต้องระบุชื่อผู้ถูกหักภาษีก่อนระบบจะออกเลขให้", NJACC_WHT_TAXID13_INVALID: "เลขประจำตัวผู้เสียภาษี / บัตรประชาชน ต้องเป็นตัวเลข 13 หลัก", NJACC_WHT_CATEGORY_REQUIRED: "ต้องเลือกหมวด 50 ทวิ ให้ครบทุกรายการ", NJACC_WHT_INCOME_TYPE_REQUIRED: "ต้องระบุประเภทเงินได้ให้ครบทุกรายการ", NJACC_WHT_FORM_TYPE_REQUIRED: "ต้องเลือกแบบที่นำส่งก่อนระบบจะออกเลขให้", NJACC_WHT_PAY_METHOD_REQUIRED: "ต้องเลือกวิธีการจ่ายภาษีก่อนระบบจะออกเลขให้", NJACC_WHT_AMOUNT_ZERO: "จำนวนเงินภาษีรวมต้องมากกว่า 0 ก่อนระบบจะออกเลขให้" };
  function G(e) {
    let n3 = String(e && e.message || "");
    for (let s7 in Bt) if (n3.includes(s7)) return Bt[s7];
    return n3 || "เกิดข้อผิดพลาด";
  }
  var Ua = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
  async function Fa() {
    return window.ExcelJS || await f5(Ua), window.ExcelJS;
  }
  function ja(e, n3) {
    let s7 = H(e), c4 = Object.fromEntries(s7.map((_3) => [_3.i, _3])), a6 = {};
    [...e.querySelectorAll("thead th")].forEach((_3) => {
      a6[Number(_3.dataset.ci)] = _3;
    });
    let l7 = s7.map((_3) => ({ ..._3, reqFirst: false, required: _3.required && !_3.reqFirst })), { order: b2, hidden: g4 } = U2(l7, W(n3, s7)), x3 = new Set(l7.filter((_3) => _3.required).map((_3) => _3.i));
    return b2.filter((_3) => !g4.has(_3)).map((_3) => c4[_3]).filter((_3) => _3 && !x3.has(_3.i)).map((_3) => ({ i: _3.i, label: za(a6[_3.i], _3.label) }));
  }
  function za(e, n3) {
    let s7 = String(n3 ?? "");
    if (!e || !s7) return s7;
    let c4 = "";
    try {
      let a6 = window.getComputedStyle(e);
      c4 = String(a6 && a6.textTransform || "").trim().toLowerCase();
    } catch {
      c4 = "";
    }
    return c4 === "uppercase" ? s7.toUpperCase() : c4 === "lowercase" ? s7.toLowerCase() : c4 === "capitalize" ? s7.replace(/(^|[\s(\[\/-])(\p{L})/gu, (a6, l7, b2) => l7 + b2.toUpperCase()) : s7;
  }
  function Va(e) {
    if (e == null) return "";
    let n3 = document.createElement("div");
    return n3.innerHTML = String(e), (n3.textContent || "").replace(/\s+/g, " ").trim();
  }
  var Ja = /^-?\d{1,3}(,\d{3})*\.\d{2}$|^-?\d+\.\d{2}$/;
  function Ba(e) {
    let n3 = String(e ?? "");
    if (!Ja.test(n3)) return { v: n3 };
    let s7 = Number(n3.replace(/,/g, ""));
    return Number.isFinite(s7) ? { v: s7, numFmt: "#,##0.00" } : { v: n3 };
  }
  async function Ga(e, n3, s7 = {}) {
    let c4 = await Fa(), a6 = new c4.Workbook(), l7 = a6.addWorksheet(s7.sheet || "รายการ", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }, views: [{ state: "frozen", ySplit: 1 }] }), b2 = l7.addRow(e.map((g4) => g4.label));
    return b2.font = { bold: true }, b2.alignment = { vertical: "middle", wrapText: true }, e.forEach((g4, x3) => {
      let _3 = b2.getCell(x3 + 1);
      _3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } }, _3.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }, l7.getColumn(x3 + 1).width = Math.min(40, Math.max(10, g4.label.length + 4));
    }), (n3 || []).forEach((g4) => {
      let x3 = g4.map((m3) => Ba(m3)), _3 = l7.addRow(x3.map((m3) => m3.v));
      x3.forEach((m3, p7) => {
        if (m3.numFmt) {
          let w2 = _3.getCell(p7 + 1);
          w2.numFmt = m3.numFmt, w2.alignment = { horizontal: "right" };
        }
      });
    }), a6;
  }
  async function ea(e = {}, n3) {
    let { table: s7, modeKey: c4, filters: a6 = {}, fetchAll: l7, rowValues: b2 } = e;
    if (!s7 || typeof l7 != "function" || typeof b2 != "function") return;
    let g4 = ja(s7, c4);
    if (!g4.length) {
      n("ยังไม่ได้เลือกคอลัมน์ที่จะแสดง", "err");
      return;
    }
    n3 && (n3.disabled = true);
    try {
      let _3 = (await l7(a6) || []).map((U3) => {
        let I2 = b2(U3);
        return g4.map((Y2) => Va(I2[Y2.i]));
      }), p7 = await (await Ga(g4, _3, { sheet: "รายการ" })).xlsx.writeBuffer(), w2 = "wht_" + (a6.mode || "ALL") + "_" + (a6.from || "all") + "_" + (a6.to || "all") + ".xlsx", C2 = URL.createObjectURL(new Blob([p7], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })), k2 = document.createElement("a");
      k2.href = C2, k2.download = w2, document.body.appendChild(k2), k2.click(), k2.remove(), setTimeout(() => URL.revokeObjectURL(C2), 1e3), n(_3.length ? "Export Excel แล้ว " + _3.length + " รายการ · " + g4.length + " คอลัมน์" : "Export Excel แล้ว — ไม่มีรายการตามเงื่อนไข (มีเฉพาะหัวคอลัมน์)", "ok");
    } catch (x3) {
      n(G(x3), "err");
    } finally {
      n3 && (n3.disabled = false);
    }
  }
  var M = (e, n3 = "-") => {
    let s7 = e == null ? "" : String(e).trim();
    return c2(s7 || n3);
  };
  var We = (e) => {
    let n3 = Number(e);
    return Number.isFinite(n3) ? n3 : 0;
  };
  var wt2 = (e) => Math.round((We(e) + Number.EPSILON) * 100) / 100;
  var la = (e) => {
    let n3 = We(e);
    return (Number.isInteger(n3) ? String(n3) : String(wt2(n3))) + "%";
  };
  var Ya = { SERVICE: "ค่าบริการ / ค่าจ้างทำของ", TRANSPORT: "ค่าขนส่ง", RENT: "ค่าเช่า", OTHER: "อื่น ๆ" };
  var pa = (e) => {
    let n3 = String(e || "").toUpperCase();
    return Ya[n3] || String(e || "-");
  };
  var mt2 = [{ key: "original", label: "ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมแบบแสดงรายการภาษี)" }, { key: "copy", label: "ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)" }, { key: "file", label: "สำเนาคู่ฉบับ (สำหรับผู้มีหน้าที่หักภาษี ณ ที่จ่ายเก็บไว้เป็นหลักฐาน)" }];
  var Ka = { payer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>', payee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>', list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>', abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>' };
  var ht2 = (e) => `<span class="whd-bub">${Ka[e] || ""}</span>`;
  function ha(e) {
    let n3 = 0, s7 = 0, c4 = /* @__PURE__ */ new Set();
    for (let a6 of e) n3 = wt2(n3 + We(a6.tax_base)), s7 = wt2(s7 + We(a6.amount)), c4.add(We(a6.rate));
    return { base: n3, tax: s7, rates: [...c4].sort((a6, l7) => a6 - l7) };
  }
  var ta = (e) => M(e, "-");
  var Qa = "— ยังไม่ระบุ —";
  var aa = (e, n3) => e ? i(e) : n3 ? i(n3) : Qa;
  var yt = [["PND1K", "(1) ภ.ง.ด.1ก"], ["PND1K_SPECIAL", "(2) ภ.ง.ด.1ก พิเศษ"], ["PND2", "(3) ภ.ง.ด.2"], ["PND3", "(4) ภ.ง.ด.3"], ["PND2K", "(5) ภ.ง.ด.2ก"], ["PND3K", "(6) ภ.ง.ด.3ก"], ["PND53", "(7) ภ.ง.ด.53"]];
  var vt = [["WITHHOLD", "(1) หัก ณ ที่จ่าย"], ["FOREVER", "(2) ออกให้ตลอดไป"], ["ONCE", "(3) ออกให้ครั้งเดียว"], ["OTHER", "(4) อื่น ๆ (ระบุ)"]];
  var na = Object.fromEntries(yt.map(([e, n3]) => [e, n3.replace(/^\(\d+\)\s*/, "")]));
  var sa = Object.fromEntries(vt.map(([e, n3]) => [e, n3.replace(/^\(\d+\)\s*/, "")]));
  var Ke = (e, n3) => {
    let s7 = String(n3 || "").trim();
    return s7 ? e[s7] || s7 : "";
  };
  var ia = '<span class="w50-bl"></span>';
  var Xa = '<span class="w50-bl w50-bl-lg"></span>';
  var Za = `<div class="w50-sl">
  <div class="w50-l1">(1) กรณีผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยจ่ายจาก
    กำไรสุทธิของกิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราดังนี้</div>
  <div class="w50-l2">(1.1) อัตราร้อยละ 30 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.2) อัตราร้อยละ 25 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.3) อัตราร้อยละ 20 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.4) อัตราอื่น ๆ (ระบุ) ${ia} ของกำไรสุทธิ</div>
  <div class="w50-l1">(2) กรณีผู้ได้รับเงินปันผลไม่ได้รับเครดิตภาษี เนื่องจากจ่ายจาก</div>
  <div class="w50-l2">(2.1) กำไรสุทธิของกิจการที่ได้รับยกเว้นภาษีเงินได้นิติบุคคล</div>
  <div class="w50-l2">(2.2) เงินปันผลหรือเงินส่วนแบ่งของกำไรที่ได้รับยกเว้นไม่ต้องนำมารวม
    คำนวณเป็นรายได้เพื่อเสียภาษีเงินได้นิติบุคคล</div>
  <div class="w50-l2">(2.3) กำไรสุทธิส่วนที่ได้หักผลขาดทุนสุทธิยกมาไม่เกิน 5 ปี
    ก่อนรอบระยะเวลาบัญชีปีปัจจุบัน</div>
  <div class="w50-l2">(2.4) กำไรที่รับรู้ทางบัญชีโดยวิธีส่วนได้เสีย (equity method)</div>
  <div class="w50-l2">(2.5) อื่น ๆ (ระบุ) ${ia}</div>
</div>`;
  var en = [["M40_1", "1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)", 0], ["M40_2", "2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)", 0], ["M40_3", "3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)", 0], ["M40_4A", "4. (ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)", 0], ["M40_4B", "(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข)", 1, Za], ["SEC3TER", "5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส เช่น รางวัล ส่วนลดหรือประโยชน์ใด ๆ เนื่องจากการส่งเสริมการขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าแสดงของนักแสดงสาธารณะ ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ค่าเบี้ยประกันวินาศภัย ฯลฯ", 0], ["OTHER", "6. อื่น ๆ (ระบุ)", 0, Xa]];
  var ua = (e, n3, s7) => {
    let c4 = String(e ?? "").replace(/\D/g, "").slice(0, n3).split(""), a6 = "";
    for (let l7 = 0; l7 < n3; l7++) a6 += `<span class="w50-tb${s7.includes(l7) ? " w50-tb-gap" : ""}">${c4[l7] ? c2(c4[l7]) : ""}</span>`;
    return a6;
  };
  var ut2 = (e) => ua(e, 13, [0, 4, 9, 11]);
  var tn = (e) => ua(e, 10, [0, 4, 8]);
  var Qe = (e) => e ? "☒" : "☐";
  var _t = (e) => `<div class="w50-ph2">เลขประจำตัวผู้เสียภาษีอากร
    <span class="w50-tboxes">${tn(e)}</span></div>`;
  function ft2(e, { copy: n3 = "original", copyLabel: s7 = "", pageItems: c4 = null, pageNo: a6 = 1, pageCount: l7 = 1 } = {}) {
    let b2 = e.items || [], g4 = ha(b2), x3 = l7 > 1, _3 = !x3 || a6 === l7, m3 = { name: e.payer_name, tax_id: e.payer_tax_id, address: e.payer_address }, p7 = { name: e.payee_name, tax_id: e.payee_tax_id, address: e.payee_address }, w2 = e.has_acting_agent === true || e.has_acting_agent === false ? e.has_acting_agent : !!String(e.agent_name || "").trim(), C2 = String(e.reference_no || "").trim(), k2 = String(e.status || "").toUpperCase() === "DRAFT" && !C2, U3 = String(e.status || "").toUpperCase() === "VOID", I2 = {};
    for (let O4 of c4 || b2) {
      let q3 = O4.wht_income_category;
      q3 && (I2[q3] = I2[q3] || []).push(O4);
    }
    let Y2 = (O4) => `<div class="w50-it">${O4}</div>`, re = (O4) => c2(pa(O4.income_type) + " (" + la(O4.rate) + ")"), we = en.map(([O4, q3, oe, ee]) => {
      let se = I2[O4] || [], qe = se.length > 0;
      return `<tr${qe ? ' class="w50-has"' : ""}>
      
      <td class="w50-d${oe ? " w50-sub" : ""}">${c2(q3)}${O4 === "OTHER" && e.note ? " " + c2(e.note) : ""}${ee || ""}${qe ? `<div class="w50-its">${se.map((X2) => Y2(re(X2))).join("")}</div>` : ""}</td>
      <td class="w50-c">${se.map((X2) => Y2(c2(i(X2.pay_date || e.pay_date)))).join("")}</td>
      <td class="w50-n">${se.map((X2) => Y2(g(X2.tax_base))).join("")}</td>
      <td class="w50-n">${se.map((X2) => Y2(g(X2.amount))).join("")}</td>
    </tr>`;
    }).join(""), Ee = e.has_fund === true || e.has_fund === false ? e.has_fund : [e.gpf_amount, e.social_security_amount, e.provident_fund_amount].some((O4) => O4 != null && O4 !== "" && Number(O4) !== 0), pe = (O4) => !Ee || O4 == null || O4 === "" ? "" : g(O4);
    return `
  <div class="whd w50${k2 ? " w50-draft" : ""}${x3 ? " w50-multi" : ""}"${x3 ? ` data-w50-sheet="${a6}/${l7}"` : ""}>
    ${k2 ? '<div class="whd-wm whd-wm-d">DRAFT</div>' : ""}
    ${U3 ? '<div class="whd-wm whd-wm-v">VOID</div>' : ""}
    ${s7 ? '<div class="w50-cp">' + c2(s7) + "</div>" : ""}
    ${x3 ? `<div class="w50-pg">แผ่นที่ ${a6}/${l7}</div>` : ""}

    <div class="w50-copies">
      <span>${Qe(n3 === "original")} ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย
        ใช้แนบพร้อมกับแบบแสดงรายการภาษี)</span>
      <span>${Qe(n3 !== "original")} ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย
        เก็บไว้เป็นหลักฐาน)</span>
    </div>

    <div class="w50-title">
      <div class="w50-t1">หนังสือรับรองการหักภาษี ณ ที่จ่าย</div>
      <div class="w50-t2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</div>
      <div class="w50-bk">
        <div>เล่มที่ <b>${M(e.book_no, "")}</b></div>
        <div>เลขที่ <b>${M(e.certificate_no, "")}</b></div>
      </div>
    </div>

    <section class="w50-party">
      <div class="w50-ph">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${ut2(m3.tax_id)}</span></div>
      ${_t(e.payer_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${M(m3.name, "")}</span></div>
      <div class="w50-hint">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${M(m3.address, "")}</span></div>
      <div class="w50-hint">(ให้ระบุชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย
        หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
    </section>

    
    ${w2 ? `
    <section class="w50-party w50-agent">
      <div class="w50-ph">กระทำการแทนโดย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${ut2(e.agent_tax_id)}</span></div>
      ${_t(e.agent_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${M(e.agent_name, "")}</span></div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${M(e.agent_address, "")}</span></div>
    </section>` : ""}

    <section class="w50-party">
      <div class="w50-ph">ผู้ถูกหักภาษี ณ ที่จ่าย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${ut2(p7.tax_id)}</span></div>
      ${_t(e.payee_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${M(p7.name, "")}</span></div>
      <div class="w50-hint">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${M(p7.address, "")}</span></div>
      <div class="w50-hint">(ให้ระบุชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย
        หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
    </section>

    <section class="w50-seq">
      <span class="w50-seq-l">ลำดับที่ <b>${M(e.form_seq, "")}</b> ในแบบ</span>
      <span class="w50-seq-o">${yt.map(([O4, q3]) => `<span>${Qe(e.form_type === O4)} ${c2(q3)}</span>`).join("")}</span>
      <div class="w50-hint">(ให้สามารถอ้างอิงหรือสอบยันกันได้ระหว่างลำดับที่ตามหนังสือรับรองฯ
        กับแบบยื่นรายการภาษีหักที่จ่าย)</div>
    </section>

    <table class="w50-tbl">
      <thead><tr>
        <th>ประเภทเงินได้พึงประเมินที่จ่าย</th>
        <th class="w50-c">วัน เดือน<br>หรือปีภาษี ที่จ่าย</th>
        <th class="w50-n">จำนวนเงินที่จ่าย</th>
        <th class="w50-n">ภาษีที่หัก<br>และนำส่งไว้</th>
      </tr></thead>
      <tbody>${we}</tbody>
      <tfoot>
        ${_3 ? `<tr><td class="w50-sum">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
          <td class="w50-c"></td>
          <td class="w50-n"><b>${g(g4.base)}</b></td>
          <td class="w50-n"><b>${g(g4.tax)}</b></td></tr>
        <tr><td class="w50-words" colspan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)
          <b>${c2(f3(g4.tax))}</b></td></tr>` : `<tr><td class="w50-sum">รวมเงินที่จ่ายและภาษีที่หักนำส่ง (ต่อแผ่นที่ ${l7})</td>
          <td class="w50-c"></td><td class="w50-n"></td><td class="w50-n"></td></tr>
        <tr><td class="w50-words" colspan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)
          <b>ดูแผ่นที่ ${l7}</b></td></tr>`}
      </tfoot>
    </table>

    <div class="w50-fund">เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน
      <u>${pe(e.gpf_amount)}</u> บาท
      กองทุนประกันสังคม <u>${pe(e.social_security_amount)}</u> บาท
      กองทุนสำรองเลี้ยงชีพ <u>${pe(e.provident_fund_amount)}</u> บาท</div>

    <div class="w50-payer">ผู้จ่ายเงิน ${vt.map(([O4, q3]) => `<span>${Qe(e.pay_method === O4)} ${c2(q3)}${O4 === "OTHER" && e.pay_method === "OTHER" && e.pay_method_other ? " " + c2(e.pay_method_other) : ""}</span>`).join("")}</div>

    
    <section class="w50-bot">
      <div class="w50-warn"><b>คำเตือน</b> ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย
        ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35
        แห่งประมวลรัษฎากร</div>
      <div class="w50-sign">
        <div class="w50-cert">ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</div>
        <div class="w50-sign-r">
          <div class="w50-sg">ลงชื่อ <span class="w50-dot"></span> ผู้จ่ายเงิน</div>
          <div class="w50-sn">( ${M(e.signer_name, "")} )</div>
          <div class="w50-sd">วันที่ <b>${i(e.document_date)}</b>
            ที่ออกหนังสือรับรองฯ</div>
        </div>
        <div class="w50-seal">ประทับตรา<br>นิติบุคคล<br>(ถ้ามี)</div>
      </div>
    </section>

    <div class="w50-note"><b>หมายเหตุ</b> เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง
      1. กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง
      2. กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า
      3. กรณีอื่น ๆ นอกเหนือจาก 1. และ 2. ให้ใช้เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
      ของกรมสรรพากร</div>
  </div>`;
  }
  var bt = [{ copy: "original", copyLabel: "" }, { copy: "copy", copyLabel: "" }, { copy: "original", copyLabel: "สำเนา 1" }, { copy: "copy", copyLabel: "สำเนา 2" }];
  function ra(e, n3 = null) {
    let s7 = Array.isArray(n3) && n3.length > 1 ? n3 : null;
    return `<div class="w50-pages">${bt.map((c4, a6) => `<div class="w50-page" data-print-page="${a6 + 1}">${s7 ? s7.map((l7, b2) => ft2(e, { ...c4, pageItems: l7, pageNo: b2 + 1, pageCount: s7.length })).join("") : ft2(e, c4)}</div>`).join("")}</div>`;
  }
  function an(e, n3) {
    try {
      let s7 = e.items || [], c4 = n3 && n3.querySelector(".whd.w50");
      if (!c4 || s7.length < 2) return null;
      let a6 = c4.querySelectorAll(".w50-it"), l7 = c4.querySelector(".w50-note");
      if (!a6.length || !l7) return null;
      let b2 = a6[0].offsetHeight, g4 = c4.clientHeight, x3 = parseFloat(getComputedStyle(c4).paddingBottom) || 0, _3 = l7.offsetTop + l7.offsetHeight + x3;
      if (!(b2 > 0) || !(g4 > 0) || _3 <= g4) return null;
      let m3 = s7.filter((I2) => I2.wht_income_category).length;
      if (!m3) return null;
      let p7 = _3 - m3 * b2, w2 = Math.max(1, Math.floor((g4 - p7) / b2));
      if (m3 <= w2) return null;
      let C2 = [], k2 = [], U3 = 0;
      for (let I2 of s7) I2.wht_income_category && (U3 === w2 && (C2.push(k2), k2 = [], U3 = 0), k2.push(I2), U3++);
      return C2.push(k2.concat(s7.filter((I2) => !I2.wht_income_category))), C2.length > 1 ? C2 : null;
    } catch {
      return null;
    }
  }
  var oa = "nj-print-w50";
  function _a(e, n3) {
    let s7 = e && e.querySelector(".w50-pages");
    s7 && s7.setAttribute("data-print-only", String(n3));
    let c4 = document.body;
    c4.classList.add(oa);
    let a6 = () => {
      c4.classList.remove(oa), s7 && s7.removeAttribute("data-print-only");
    };
    window.addEventListener("afterprint", a6, { once: true });
    try {
      let l7 = window.matchMedia("print"), b2 = (g4) => {
        g4.matches || (a6(), l7.removeEventListener("change", b2));
      };
      l7.addEventListener("change", b2);
    } catch {
    }
    window.print(), setTimeout(() => {
      try {
        (!window.matchMedia || !window.matchMedia("print").matches) && a6();
      } catch {
        a6();
      }
    }, 0);
  }
  function ca(e, n3) {
    _a(e, n3);
  }
  function da(e) {
    _a(e, "all");
  }
  function nn(e, { copy: n3 = "original" } = {}) {
    if (String(e.direction || "").toUpperCase() === "ACTING_AGENT") return ft2(e, { copy: n3 });
    let s7 = e.items || [], c4 = ha(s7), a6 = e.payer || e.payee || {}, l7 = { name: e.payer_name || a6.name, tax_id: e.payer_tax_id || a6.tax_id, branch_code: e.payer_branch || a6.branch_code, address: e.payer_address || a6.address, phone: a6.phone }, b2 = String(e.direction || "").toUpperCase() === "ACTING_AGENT", x3 = !!String(e.payee_name || "").trim() ? { name: e.payee_name, tax_id: e.payee_tax_id, branch_code: e.payee_branch || "สำนักงานใหญ่", address: e.payee_address, tel: "" } : { name: o3.nameEn, tax_id: o3.taxId, branch_code: "สำนักงานใหญ่", address: o3.address, tel: o3.tel + " | " + o3.fax }, m3 = (e.has_acting_agent === true || e.has_acting_agent === false ? e.has_acting_agent : !!String(e.agent_name || "").trim()) ? String(e.agent_name || "").trim() : "", p7 = e.invoice || {}, w2 = String(e.status || "").toUpperCase(), C2 = w2 === "VOID", k2 = String(e.reference_no || "").trim(), U3 = w2 === "DRAFT" && !k2, I2 = String(e.certificate_no || "").trim() || null, Y2 = String(e.document_no || ""), we = (/^WHTDRAFT-/.test(Y2) ? null : Y2 || null) || k2 || null, Ee = mt2.find((q3) => q3.key === n3) || mt2[0], pe = s7.length ? s7.map((q3, oe) => `<tr>
        <td class="whd-c whd-dim">${q3.line_no ?? oe + 1}</td>
        <td class="whd-c">${c2(aa(q3.pay_date, e.pay_date))}</td>
        <td class="whd-ds">
          <div class="whd-ds-t">${c2(pa(q3.income_type))}</div>
          ${q3.description ? `<div class="whd-ds-s">${c2(q3.description)}</div>` : ""}
        </td>
        <td class="whd-r">${g(q3.tax_base)}</td>
        <td class="whd-c">${c2(la(q3.rate))}</td>
        <td class="whd-r whd-tax">${g(q3.amount)}</td>
      </tr>`).join("") : '<tr><td colspan="6" class="whd-empty">ยังไม่มีรายการเงินได้ในเอกสารนี้</td></tr>', O4 = p7.invoice_no ? c2(p7.invoice_no) : e.reference_no ? c2(e.reference_no) : "-";
    return `
    <div class="whd print-area${C2 ? " whd-void" : ""}${U3 ? " whd-draft" : ""}">
      ${C2 ? '<div class="whd-badge whd-badge-v">VOID / ยกเลิก</div>' : ""}
      ${U3 ? '<div class="whd-badge whd-badge-d">DRAFT / ร่าง — ยังไม่ออกเลขที่เอกสาร</div>' : ""}
      
      ${U3 ? '<div class="whd-wm whd-wm-d">DRAFT</div>' : ""}
      ${C2 ? '<div class="whd-wm whd-wm-v">VOID</div>' : ""}

      <div class="whd-copy">
        <b>${b2 ? "หนังสือรับรองการหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร" : "สำเนาข้อมูลสำหรับบันทึกภายใน — ไม่ใช่ต้นฉบับหนังสือรับรอง"}</b>
        <span>${c2(Ee.label)}</span>
      </div>

      <header class="whd-head">
        <img class="whd-logo" src="${o3.logo}" alt="N.J. Logistics">
        <div class="whd-head-t">
          <div class="whd-t1">${b2 ? "หนังสือรับรองการหักภาษี ณ ที่จ่าย (กระทำการแทน)" : "ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ"}</div>
          <div class="whd-t2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร${b2 ? "" : " — สำเนาข้อมูลสำหรับบันทึกภายใน"}</div>
          <div class="whd-t3">${b2 ? "WITHHOLDING TAX CERTIFICATE" : "RECEIVED WITHHOLDING TAX CERTIFICATE — INTERNAL RECORD"}</div>
        </div>
        <div class="whd-head-r">
          <div class="whd-nolbl">เล่มที่${e.book_no ? "" : " / เลขที่"}</div>
          <div class="whd-no">${e.book_no ? c2(e.book_no) + ' <span class="whd-dim">/</span> ' + (I2 ? c2(I2) : '<span class="whd-pend">—</span>') : I2 ? c2(I2) : '<span class="whd-pend">ยังไม่ได้รับเลขจากผู้หักภาษี</span>'}</div>
          <div class="whd-dtlbl">วันที่ออกหนังสือรับรอง</div>
          <div class="whd-dt">${i(e.document_date)}</div>
          ${e.ref_date ? `<div class="whd-intlbl">Ref. Date</div>
          <div class="whd-int">${i(e.ref_date)}</div>` : ""}
          ${e.job_no ? `<div class="whd-intlbl">เลขที่งาน</div>
          <div class="whd-int">${c2(e.job_no)}</div>` : ""}
          ${we ? `<div class="whd-intlbl">เลขอ้างอิงภายใน</div>
          <div class="whd-int">${c2(we)}</div>` : ""}
        </div>
      </header>
      <div class="whd-band"></div>

      <section class="whd-party">
        <div class="whd-box">
          <div class="whd-box-t">${ht2("payer")}<span>ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>ชื่อ</label><div class="whd-v whd-v-b">${M(l7.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
                <div class="whd-v whd-v-tax">${M(l7.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>สาขา</label>
                <div class="whd-v">${M(l7.branch_code)}</div></div>
            </div>
            <div class="whd-f"><label>ที่อยู่</label>
              <div class="whd-v whd-v-ml">${ta(l7.address)}</div></div>
            <div class="whd-f whd-f-last"><label>โทร.</label>
              <div class="whd-v">${M(l7.phone)}</div></div>
          </div>
        </div>

        <div class="whd-box">
          <div class="whd-box-t">${ht2("payee")}<span>ข. ผู้ถูกหักภาษี ณ ที่จ่าย</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>ชื่อ</label><div class="whd-v whd-v-b">${M(x3.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
                <div class="whd-v whd-v-tax">${M(x3.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>สาขา</label>
                <div class="whd-v">${M(x3.branch_code)}</div></div>
            </div>
            <div class="whd-f${x3.tel ? "" : " whd-f-last"}"><label>ที่อยู่</label>
              <div class="whd-v whd-v-ml">${ta(x3.address)}</div></div>
            ${x3.tel ? `<div class="whd-f whd-f-last"><label>โทร. / โทรสาร</label>
              <div class="whd-v">${c2(x3.tel)}</div></div>` : ""}
          </div>
        </div>
      </section>

      ${m3 ? `<section class="whd-agent">
        <div class="whd-agent-t">กระทำการแทนโดย</div>
        <div class="whd-agent-b">
          <div class="whd-agent-c"><label>ชื่อ</label><span class="whd-b">${c2(m3)}</span></div>
          <div class="whd-agent-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
            <span>${M(e.agent_tax_id)}</span></div>
          <div class="whd-agent-c"><label>สาขา</label><span>${M(e.agent_branch)}</span></div>
          <div class="whd-agent-c whd-agent-w"><label>ที่อยู่</label>
            <span>${M(e.agent_address)}</span></div>
        </div>
      </section>` : ""}

      <section class="whd-ref">
        <div class="whd-ref-c"><label>อ้างอิงใบแจ้งหนี้ / เลขที่อ้างอิง</label>
          <span class="whd-ref-v">${O4}</span></div>
        <div class="whd-ref-c"><label>วันที่จ่ายเงิน</label>
          <span class="whd-ref-v">${c2(aa(null, e.pay_date))}</span></div>
        ${p7.invoice_date ? `<div class="whd-ref-c"><label>วันที่ใบแจ้งหนี้</label>
          <span class="whd-ref-v">${i(p7.invoice_date)}</span></div>` : ""}
      </section>

      <section class="whd-sec">
        <div class="whd-sec-t">ค. รายละเอียดการจ่ายเงินและจำนวนภาษีที่หักและนำส่ง</div>
        <table class="whd-tbl">
          <colgroup><col class="w-no"><col class="w-dt"><col class="w-ds">
            <col class="w-base"><col class="w-rate"><col class="w-tax"></colgroup>
          <thead><tr>
            <th class="whd-c">ลำดับ</th>
            <th class="whd-c">วัน เดือน<br>ปีที่จ่าย</th>
            <th class="whd-c">ประเภทเงินได้พึงประเมินที่จ่าย</th>
            <th class="whd-c">จำนวนเงินที่จ่าย<br>(บาท)</th>
            <th class="whd-c">อัตราภาษี<br>ที่หัก</th>
            <th class="whd-c">ภาษีที่หักและนำส่งไว้<br>(บาท)</th>
          </tr></thead>
          <tbody>${pe}</tbody>
          <tfoot><tr class="whd-sumrow">
            <td colspan="3" class="whd-r">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
            <td class="whd-r whd-b">${g(c4.base)}</td>
            <td></td>
            <td class="whd-r whd-total">${g(c4.tax)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="whd-words">
        ${ht2("abc")}
        <div class="whd-words-b">
          <div class="whd-words-t">รวมเงินภาษีที่หักและนำส่ง (ตัวอักษร)</div>
          <div class="whd-words-v">( ${c2(f3(c4.tax))} )</div>
        </div>
      </section>

      ${b2 ? `<section class="whd-form whd-form-official">
        
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">ผู้จ่ายเงินได้นำส่งภาษีตามแบบ</div>
          <div class="whd-cbs">${yt.map(([q3, oe]) => `<span class="whd-cb${e.form_type === q3 ? " on" : ""}">${e.form_type === q3 ? "☒" : "☐"} ${c2(oe)}</span>`).join("")}</div>
          <div class="whd-form-s">ลำดับที่ ${e.form_seq ? c2(e.form_seq) : '<span class="whd-dot">.........</span>'} ในแบบยื่นรายการ</div>
        </div>
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">ผู้จ่ายเงิน</div>
          <div class="whd-cbs">${vt.map(([q3, oe]) => `<span class="whd-cb${e.pay_method === q3 ? " on" : ""}">${e.pay_method === q3 ? "☒" : "☐"} ${c2(oe)}${q3 === "OTHER" && e.pay_method === "OTHER" && e.pay_method_other ? " " + c2(e.pay_method_other) : ""}</span>`).join("")}</div>
        </div>
      </section>` : e.form_type || e.pay_method ? `<section class="whd-form">
        <div class="whd-form-c">
          <div class="whd-form-t">ผู้จ่ายเงินได้นำส่งภาษีตามแบบ</div>
          <div class="whd-form-v">${Ke(na, e.form_type) ? c2(Ke(na, e.form_type)) : '<span class="whd-pend">—</span>'}
            ${e.form_seq ? `<span class="whd-form-s">ลำดับที่ ${c2(e.form_seq)}</span>` : ""}</div>
        </div>
        <div class="whd-form-c">
          <div class="whd-form-t">วิธีการจ่ายเงินภาษี</div>
          <div class="whd-form-v">${Ke(sa, e.pay_method) ? c2(Ke(sa, e.pay_method)) : '<span class="whd-pend">—</span>'}
            ${e.pay_method_other ? `<span class="whd-form-s">${c2(e.pay_method_other)}</span>` : ""}</div>
        </div>
      </section>` : ""}

      ${e.note ? `<section class="whd-note">
        <div class="whd-note-t">หมายเหตุ / ข้อความอื่น ๆ</div>
        <div class="whd-note-v">${c2(e.note)}</div>
      </section>` : ""}

      ${b2 ? `<section class="whd-declare">
        <div class="whd-dec-t">คำรับรอง</div>
        <p>ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</p>
        <div class="whd-sign">
          <div class="whd-sign-l">
            <div class="whd-sign-line"></div>
            <div class="whd-sign-lb">ลงชื่อ ผู้จ่ายเงิน</div>
            <div class="whd-sign-nm">( ${M(e.signer_name, "&nbsp;")} )</div>
            <div class="whd-sign-ps">ตำแหน่ง ${M(e.signer_position, "&nbsp;")}</div>
          </div>
          <div class="whd-sign-r">
            <div class="whd-sign-lb">วันที่ออกหนังสือรับรอง</div>
            <div class="whd-sign-dt">${i(e.document_date)}</div>
          </div>
        </div>
      </section>` : `<section class="whd-declare">
        <div class="whd-dec-t">การอ้างอิงต้นฉบับ</div>
        <p>ข้อมูลข้างต้นบันทึกจากหนังสือรับรองการหักภาษี ณ ที่จ่าย
           ที่ออกและลงนามโดยผู้มีหน้าที่หักภาษี ณ ที่จ่าย (ผู้จ่ายเงิน) ตามรายละเอียดในส่วน ก.
           เอกสารฉบับนี้เป็นสำเนาข้อมูลสำหรับใช้ภายในของผู้ถูกหักภาษีเท่านั้น
           <b>ไม่ใช่ต้นฉบับ และไม่ใช้แทนต้นฉบับ</b></p>
        <div class="whd-rec">
          <div class="whd-rec-c"><label>ผู้จ่ายเงิน / ผู้ลงนาม</label>
            <span>${M(e.signer_name || l7.name)}</span></div>
          <div class="whd-rec-c"><label>ตำแหน่ง</label>
            <span>${M(e.signer_position)}</span></div>
          <div class="whd-rec-c"><label>ผู้บันทึกข้อมูล</label>
            <span>${M(e.created_by_name)}</span></div>
          <div class="whd-rec-c"><label>วันที่ออกหนังสือรับรอง</label>
            <span>${i(e.document_date)}</span></div>
        </div>
      </section>`}

      <div class="whd-edge"></div>
    </div>`;
  }
  function Xe(e, { print: n3 = false } = {}) {
    let s7 = String(e.direction || "").toUpperCase() === "ACTING_AGENT", c4 = document.createElement("div"), a6 = (p7) => {
      c4.innerHTML = nn(e, { copy: p7 });
    };
    s7 ? c4.innerHTML = ra(e) : a6("original");
    let l7 = document.createElement("div");
    l7.innerHTML = `<div class="mf-left">
      ${s7 ? `<div class="w50-pbar">
            <span class="t-xs t-3 w50-pbar-l">พิมพ์ครั้งเดียวได้ 4 หน้า — ฉบับที่ 1 · ฉบับที่ 2 · สำเนา 1 · สำเนา 2</span>
            ${bt.map((p7, w2) => `<button class="btn btn-o btn-sm w50-pb" data-w50-page="${w2 + 1}">🖨 หน้า ${w2 + 1}</button>`).join("")}
            <select class="sel w50-psel" id="w50-psel" aria-label="เลือกหน้าที่ต้องการพิมพ์">
              ${bt.map((p7, w2) => `<option value="${w2 + 1}">หน้า ${w2 + 1}</option>`).join("")}
              <option value="all">ทั้งหมด</option>
            </select>
            <button class="btn btn-o btn-sm w50-pgo" id="w50-pgo">🖨 พิมพ์</button>
          </div>` : `<select class="sel" id="whd-copy">${mt2.map((p7, w2) => `<option value="${p7.key}" ${w2 === 0 ? "selected" : ""}>${c2(p7.label)}</option>`).join("")}</select>`}
    </div><div class="mf-right">
      <button class="btn btn-print" id="whd-print">🖨 Print / Save PDF${s7 ? " ทั้งหมด" : ""}</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;
    let b2 = String(e.reference_no || "").trim(), g4 = String(e.certificate_no || e.document_no || ""), x3 = b2 || (/^WHTDRAFT-/.test(g4) || String(e.status).toUpperCase() === "DRAFT" ? "(ร่าง)" : g4);
    if (f2({ title: "ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ " + x3, body: c4, footer: l7, fullscreen: true, wide: true }), s7) {
      let p7 = an(e, c4);
      p7 && (c4.innerHTML = ra(e, p7));
    }
    let _3 = l7.querySelector("#whd-copy");
    _3 && (_3.onchange = (p7) => a6(p7.target.value));
    let m3 = () => s7 ? da(c4) : window.print();
    if (l7.querySelector("#whd-print").onclick = m3, s7) {
      l7.querySelectorAll("[data-w50-page]").forEach((C2) => {
        C2.onclick = () => ca(c4, Number(C2.dataset.w50Page));
      });
      let p7 = l7.querySelector("#w50-pgo"), w2 = l7.querySelector("#w50-psel");
      p7 && w2 && (p7.onclick = () => w2.value === "all" ? da(c4) : ca(c4, Number(w2.value)));
    }
    n3 && setTimeout(m3, 60);
  }
  var sn = "sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql";
  var rn = [{ k: "NJ_TRANS", lb: "NJ TRANS" }];
  var f6 = { customer: "", from: "", to: "", page: 1, size: 20, mode: "NJ_TRANS" };
  f6.q_payer = "";
  f6.q_payee = "";
  f6.q_cert = "";
  f6.q_cdate = "";
  f6.q_doccode = "";
  var on = 1;
  f6.dateSource = "AUTO";
  var xa = (e) => e.getFullYear() + "-" + String(e.getMonth() + 1).padStart(2, "0") + "-" + String(e.getDate()).padStart(2, "0");
  function cn(e = /* @__PURE__ */ new Date()) {
    let n3 = e instanceof Date && !isNaN(e.getTime()) ? e : /* @__PURE__ */ new Date();
    return xa(new Date(n3.getFullYear(), n3.getMonth(), n3.getDate() - 1));
  }
  function dn() {
    let e = cn();
    return { from: e, to: e };
  }
  function wa() {
    return { from: f6.from || null, to: f6.to || null };
  }
  var ln = () => false;
  var Re = null;
  var Q2 = { q: "", page: 1, size: 10 };
  var t3 = null;
  var W2 = (e) => {
    let n3 = Number(e);
    return Number.isFinite(n3) ? n3 : 0;
  };
  var Ea = (e) => {
    let n3 = W2(e);
    return (Number.isInteger(n3) ? String(n3) : String(u2(n3))) + "%";
  };
  var $a = [["M40_1", "1. เงินเดือน ค่าจ้าง ฯลฯ (ม.40(1))"], ["M40_2", "2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ (ม.40(2))"], ["M40_3", "3. ค่าแห่งลิขสิทธิ์ ฯลฯ (ม.40(3))"], ["M40_4A", "4.(ก) ดอกเบี้ย ฯลฯ (ม.40(4)(ก))"], ["M40_4B", "4.(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ (ม.40(4)(ข))"], ["SEC3TER", "5. หักตามคำสั่งกรมสรรพากร (ม.3 เตรส)"], ["OTHER", "6. อื่น ๆ"]];
  var ys = Object.fromEntries($a);
  var Ze = (e) => ["SERVICE", "TRANSPORT", "RENT"].includes(String(e || "").toUpperCase()) ? "SEC3TER" : "";
  var pn = (e) => '<option value="">— เลือกหมวด —</option>' + $a.map(([n3, s7]) => `<option value="${n3}" ${e === n3 ? "selected" : ""}>${c2(s7)}</option>`).join("");
  var Sa = [["SERVICE", "ค่าบริการ / ค่าจ้างทำของ"], ["TRANSPORT", "ค่าขนส่ง"], ["RENT", "ค่าเช่า"], ["OTHER", "อื่น ๆ"]];
  var hn = (e) => Sa.map(([n3, s7]) => `<option value="${n3}" ${n3 === e ? "selected" : ""}>${c2(s7)}</option>`).join("");
  var xt = { SERVICE: 3, TRANSPORT: 1, RENT: 5 };
  var Et = (e) => xt[String(e ?? "").toUpperCase()];
  var un = (e) => Et(e) !== void 0;
  var ma = (e) => un(e && e.income_type) && W2(e.rate) === Et(e.income_type);
  var fa = (e) => String(e ?? "").trim().toLowerCase();
  var et2 = (e) => String(e ?? "").replace(/[^0-9A-Za-z]/g, "");
  var ba = (e) => String(e ?? "").trim();
  var Ta = (e, n3) => {
    let s7 = String(e || "").trim(), c4 = String(n3 || "").trim();
    return !s7 && !c4 ? "" : " (CODE: " + (s7 || "-") + " | ชื่อ: " + (c4 || "-") + ")";
  };
  var Fe = { NJACC_PARTY_CODE_DUPLICATE: ["whp-nc", "ไม่สามารถบันทึกได้ — CODE นี้มีอยู่ใน Master แล้ว"], NJACC_PARTY_TAXBRANCH_DUPLICATE: ["whp-nt", "ไม่สามารถบันทึกได้ — เลขประจำตัวผู้เสียภาษีอากรและสาขานี้มีอยู่ใน Master แล้ว"], NJACC_PARTY_CITIZEN_DUPLICATE: ["whp-ni", "ไม่สามารถบันทึกได้ — เลขประจำตัวบัตรประชาชนนี้มีข้อมูลอยู่ใน Master แล้ว"] };
  function ya(e) {
    let n3 = String(e && (e.message || e.hint || e.details) || "");
    for (let s7 of Object.keys(Fe)) {
      if (!n3.includes(s7)) continue;
      let c4 = n3.slice(n3.indexOf(s7)).split("|"), [a6, l7] = Fe[s7];
      return { field: a6, msg: l7 + Ta(c4[1], c4[2]) };
    }
    return n3.includes("NJACC_PARTY_DUPLICATE_RACE") ? { field: "whp-nc", msg: "ไม่สามารถบันทึกได้ — มีผู้อื่นเพิ่งบันทึกข้อมูลที่ซ้ำกัน กรุณาค้นหาใหม่" } : null;
  }
  var Ca = [["PND1K", "(1) ภ.ง.ด.1ก"], ["PND1K_SPECIAL", "(2) ภ.ง.ด.1ก พิเศษ"], ["PND2", "(3) ภ.ง.ด.2"], ["PND3", "(4) ภ.ง.ด.3"], ["PND2K", "(5) ภ.ง.ด.2ก"], ["PND3K", "(6) ภ.ง.ด.3ก"], ["PND53", "(7) ภ.ง.ด.53"]];
  var je = "OTHER";
  var _n = "PND53";
  var wn = "WITHHOLD";
  var ka = [["WITHHOLD", "(1) หัก ณ ที่จ่าย"], ["FOREVER", "(2) ออกให้ตลอดไป"], ["ONCE", "(3) ออกให้ครั้งเดียว"], [je, "(4) อื่น ๆ (ระบุ)"]];
  function va(e) {
    let n3 = (l7) => String(e && e[l7] || "").trim(), s7 = n3("agent_name"), c4 = n3("agent_tax_id"), a6 = e ? e.has_acting_agent : void 0;
    return a6 === false ? { name: "", taxId: "" } : a6 === true ? !s7 && !c4 && !n3("agent_branch") && !n3("agent_address") ? { name: o3.nameEn, taxId: o3.taxId } : { name: s7, taxId: c4 } : { name: s7, taxId: c4 };
  }
  var mn = 2;
  var le = [["เลขที่หนังสือรับรอง", false, (e, n3) => n3.certCell, "t-b"], ["วันที่ออกเอกสาร", false, (e) => i(e.document_date)], ["วันที่จ่าย", false, (e) => i(e.pay_date)], ["Ref. Date", false, (e) => i(e.ref_date)], ["Reference No.", false, (e) => c2(e.reference_no || "-")], ["รหัสย่อลูกค้า", false, (e) => c2(e.doc_code || "-")], ["เล่มที่", false, (e) => c2(e.book_no || "-")], ["เลขที่งาน", false, (e) => c2(e.job_no || "-")], ["Invoice No.", false, (e) => c2(e.invoice_no_text || e.invoice_no || "-"), "t-b"], ["CODE ผู้มีหน้าที่หักภาษี", false, (e) => c2(e.payer_code || "-")], ["ก. ผู้มีหน้าที่หักภาษี", false, (e) => c2(e.payer_name || e.customer_name || "-"), "ellip"], ["Tax ID ผู้หัก", false, (e) => c2(e.payer_tax_id || "-")], ["เลขบัตรประชาชนผู้มีหน้าที่หักภาษี", true, (e) => c2(e.payer_citizen_id || "-")], ["สาขาผู้หัก", false, (e) => c2(e.payer_branch || "-")], ["ที่อยู่ผู้หัก", false, (e) => c2(e.payer_address || "-"), "ellip"], ["CODE ผู้ถูกหักภาษี", false, (e) => c2(e.payee_code || "-")], ["ข. ผู้ถูกหักภาษี", false, (e) => c2(e.payee_name || "-"), "ellip"], ["Tax ID ผู้ถูกหัก", false, (e) => c2(e.payee_tax_id || "-")], ["เลขบัตรประชาชนผู้ถูกหักภาษี", true, (e) => c2(e.payee_citizen_id || "-")], ["สาขาผู้ถูกหัก", false, (e) => c2(e.payee_branch || "-")], ["ที่อยู่ผู้ถูกหัก", false, (e) => c2(e.payee_address || "-"), "ellip"], ["กระทำการแทนโดย", false, (e) => c2(va(e).name || "-"), "ellip"], ["Tax ID ผู้กระทำการแทน", false, (e) => c2(va(e).taxId || "-")], ["ประเภทเงินได้", false, (e) => c2(xn[e.wht_type] || e.wht_type || "-")], ["จำนวนเงินที่จ่าย", false, (e) => g(e.tax_base), "r"], ["อัตรา", false, (e) => `<span class="wht-rate-chip">${c2(Ea(e.rate))}</span>`, "center"], ["ภาษีที่หัก", false, (e) => g(e.amount), "r t-b"], ["แบบที่นำส่ง", false, (e) => c2($n[e.form_type] || e.form_type || "-")], ["ลำดับที่ในแบบ", false, (e) => c2(e.form_seq || "-")], ["วิธีการจ่ายภาษี", false, (e) => c2(En[e.pay_method] || e.pay_method || "-")], ["ระบุ (อื่น ๆ)", false, (e) => c2(e.pay_method_other || "-")], ["ผู้ลงนาม", false, (e) => c2(e.signer_name || "-")], ["ตำแหน่ง", false, (e) => c2(e.signer_position || "-")], ["ผู้จ่ายเงิน (อื่นๆ)", false, (e) => c2(e.payment_by || "-")], ["หมายเหตุ", false, (e) => c2(e.note || "-"), "ellip"], ["เลขอ้างอิงภายใน", false, (e, n3) => n3.internalNo], ["จำนวนรายการ", false, (e) => c2(String(e.item_count == null ? "-" : e.item_count)), "center"], ["เหตุผลยกเลิก", true, (e) => c2(e.void_reason || "-"), "ellip"], ["วันเวลาที่ยกเลิก", true, (e) => c2(e.voided_at ? i(e.voided_at) : "-")], ["จัดการ", false, (e, n3) => n3.act, "center"]];
  var fn = [{ col: "เลขที่หนังสือรับรอง", key: "q_cert", type: "text", ph: "ค้นหาเลขที่...", lb: "ค้นหาเลขที่ (เลขที่หนังสือรับรอง)" }, { col: "วันที่ออกเอกสาร", key: "q_cdate", type: "date", ph: "", lb: "กรองวันที่ออกหนังสือรับรอง" }, { col: "รหัสย่อลูกค้า", key: "q_doccode", type: "text", ph: "ค้นหารหัสย่อ...", lb: "ค้นหารหัสย่อลูกค้า" }, { col: "ก. ผู้มีหน้าที่หักภาษี", key: "q_payer", type: "text", ph: "ค้นหา...", lb: "ค้นหา ก. ผู้มีหน้าที่หักภาษี" }, { col: "ข. ผู้ถูกหักภาษี", key: "q_payee", type: "text", ph: "ค้นหา...", lb: "ค้นหา ข. ผู้ถูกหักภาษี" }];
  var bn = (e) => {
    let n3 = le[e] && le[e][0];
    return fn.find((s7) => s7.col === n3) || null;
  };
  var yn = () => `<tr class="tbl-fr">${le.map((e, n3) => {
    let s7 = bn(n3);
    return s7 ? `<td><input class="inp tbl-fi" type="${s7.type}" data-wf="${s7.key}"
      aria-label="${c2(s7.lb)}" title="${c2(s7.lb)}"
      ${s7.ph ? `placeholder="${c2(s7.ph)}"` : ""} value="${c2(f6[s7.key] || "")}"></td>` : "<td></td>";
  }).join("")}</tr>`;
  var Aa = () => ({ p_doc_code: f6.q_doccode.trim() || null, p_payer: f6.q_payer.trim() || null, p_payee: f6.q_payee.trim() || null, p_cert_no: f6.q_cert.trim() || null, p_cert_date: f6.q_cdate || null });
  var Na = () => Object.values(Aa()).some((e) => e !== null);
  var ge = null;
  async function Ra(e) {
    if (!Na() || ge === false) return ot2(e);
    let n3 = Aa();
    try {
      let s7 = await Yt(Object.assign({}, e, n3));
      return ge = true, s7;
    } catch (s7) {
      if (ge === null && ve(s7)) {
        let { p_doc_code: c4, ...a6 } = n3;
        try {
          let l7 = await Gt(Object.assign({}, e, a6));
          if (ge = true, c4) {
            if (f6.q_doccode = "", Re) {
              let b2 = Re.querySelector('[data-wf="q_doccode"]');
              b2 && (b2.value = "", b2.disabled = true, b2.title = "ตัวกรองนี้ต้องรัน SQL/RUN-74_WHT_LIST_DOC_CODE.sql บน Supabase ก่อน");
            }
            n('ค้นหา "รหัสย่อลูกค้า" ยังใช้ไม่ได้ — ต้องรัน RUN-74 บน Supabase ก่อน', "err");
          }
          return l7;
        } catch (l7) {
          if (!ve(l7)) throw l7;
        }
        return ge = false, vn(Re), ot2(e);
      }
      throw s7;
    }
  }
  function vn(e) {
    f6.q_payer = "", f6.q_payee = "", f6.q_cert = "", f6.q_cdate = "", f6.q_doccode = "", e && e.querySelectorAll("[data-wf]").forEach((n3) => {
      n3.value = "", n3.disabled = true, n3.title = "ตัวกรองนี้ต้องรัน SQL/RUN-68_WHT_LIST_FILTERS.sql บน Supabase ก่อน";
    }), n("ตัวกรองใต้หัวคอลัมน์ยังใช้ไม่ได้ — ต้องรัน RUN-68 บน Supabase ก่อน", "err");
  }
  function gn() {
    if (!Re) return false;
    let e = false;
    return Re.querySelectorAll("[data-wf]").forEach((n3) => {
      let s7 = n3.closest("td");
      !s7 || !s7.hidden || f6[n3.dataset.wf] && (f6[n3.dataset.wf] = "", n3.value = "", e = true);
    }), e;
  }
  var xn = Object.fromEntries(Sa);
  var En = Object.fromEntries(ka.map(([e, n3]) => [e, n3.replace(/^\(\d+\)\s*/, "")]));
  var $n = Object.fromEntries(Ca.map(([e, n3]) => [e, n3.replace(/^\(\d+\)\s*/, "")]));
  var ga = (e, n3, s7) => n3.map(([c4, a6]) => `<label class="whp-rd"><input type="radio" name="${e}" value="${c2(c4)}"
     ${c4 === s7 ? "checked" : ""}><span>${c2(a6)}</span></label>`).join("");
  var Sn = { DRAFT: ["bdg-due-ok", "ร่าง"], ISSUED: ["bdg-issued", "บันทึกแล้ว"], VOID: ["bdg-void", "VOID"] };
  var Da = (e) => {
    let [n3, s7] = Sn[String(e || "").toUpperCase()] || ["bdg-due-ok", e || "-"];
    return `<span class="bdg ${n3}">${c2(s7)}</span>`;
  };
  function ze(e) {
    e.innerHTML = `
    
    <div class="card card-pad whp-req">
      <h3 class="t-b">BACKEND REQUIRED — ยังใช้งานไม่ได้</h3>
      <p class="t-2 mt-1">ตรวจกับฐานข้อมูลจริงแล้ว ระบบยังไม่มีโครงสร้างของหนังสือรับรอง 50 ทวิ</p>
      <ul class="whp-req-l">
        <li>ไม่มีตาราง <code>njacc_wht_items</code> — เก็บได้ 1 รายการต่อ 1 ใบเท่านั้น</li>
        <li>สถานะยังไม่รองรับ <code>DRAFT</code> — บันทึกร่างแล้วกลับมาแก้ไม่ได้</li>
        <li><code>njacc_list_wht</code> ยังไม่คืน เลขผู้เสียภาษี / สาขา / ที่อยู่ ของผู้หักภาษี</li>
        <li>ไม่มี RPC สำหรับเลือก INVOICE มาอ้างอิงพร้อมอัตรา WHT และวันที่จ่ายเงินจริง</li>
        <li>ไม่มีคอลัมน์ <code>certificate_no</code> — แยกเลขหนังสือรับรองของผู้หัก
            ออกจากเลขอ้างอิงภายในไม่ได้</li>
        <li><code>njacc_create_wht</code> เดิมยังเปิดให้ยิงตรงและมี Default 3%</li>
      </ul>
      <p class="t-sm t-3 mt-2">ให้รันไฟล์นี้บน Supabase ก่อน แล้วรีเฟรชหน้านี้อีกครั้ง:</p>
      <p class="whp-req-f"><code>${c2(sn)}</code></p>
      <p class="t-sm t-3 mt-2">ระหว่างที่ยังไม่รัน หน้าอื่นทั้งหมดของระบบทำงานตามปกติ
        — ไฟล์ SQL นี้ไม่แตะ INVOICE / RECEIPT / CREDIT NOTE / สิทธิ์ผู้ใช้เดิม</p>
    </div>`;
  }
  async function gs(e) {
    await p5("assets/css/wht.bundle.css"), t3 = null;
    let n3 = dn();
    f6.dateSource = "AUTO", f6.from = n3.from, f6.to = n3.to, f6.q_payer = "", f6.q_payee = "", f6.q_cert = "", f6.q_cdate = "", f6.q_doccode = "", f6.page = 1, await R3(), await xe(e);
  }
  var gt = 100;
  var Tn = "ดึงข้อมูลไม่ครบ — ยังไม่สร้างไฟล์ Excel กรุณาลองใหม่อีกครั้ง";
  var Ue = (e) => new Error(Tn + " (" + e + ")");
  async function Cn(e = {}) {
    let n3 = [], s7 = /* @__PURE__ */ new Set(), c4 = null, a6 = 1;
    for (; ; ) {
      if (ge === false && Na()) throw Ue("ตัวกรองใต้หัวคอลัมน์ยังใช้ไม่ได้ ต้องรัน RUN-68 ก่อน");
      let l7 = await Ra({ p_customer: e.customer || null, p_from: e.from || null, p_to: e.to || null, p_page: a6, p_size: gt, p_direction: e.direction || ye, p_mode: e.mode || null }), b2 = l7 && l7.rows || [], g4 = Number(l7 && l7.total || 0);
      if (c4 === null) c4 = g4;
      else if (g4 !== c4) throw Ue("จำนวนรายการเปลี่ยนระหว่างดึงข้อมูล " + c4 + " -> " + g4);
      if (!b2.length) break;
      let x3 = String(b2[0] && b2[0].id || "#" + a6);
      if (s7.has(x3)) throw Ue("หน้า " + a6 + " คืนข้อมูลชุดเดิม");
      if (s7.add(x3), n3.push(...b2), c4 && n3.length >= c4 || b2.length < gt) break;
      if (a6++, c4) {
        let _3 = Math.ceil(c4 / gt) + 2;
        if (a6 > _3) throw Ue("ดึงเกิน " + _3 + " หน้าแล้วยังไม่ครบ");
      }
    }
    if (c4 !== null && n3.length !== c4) throw Ue("ได้ " + n3.length + " จาก " + c4 + " รายการ");
    return n3;
  }
  function qa(e) {
    let n3 = String(e.status || "").toUpperCase(), s7 = String(e.document_no || ""), c4 = n3 === "DRAFT" || /^WHTDRAFT-/.test(s7), a6 = n3 === "VOID", l7 = String(e.certificate_no || "").trim();
    return { certCell: l7 ? c2(l7) : '<span class="t-3">-</span>', internalNo: !c4 && s7 ? c2(s7) : '<span class="t-3">-</span>', badge: Da(n3), act: `<div class="ch-act">
          
          ${String(e.reference_no || "").trim() && (U() || d("view")) ? `<button class="btn btn-o btn-sm" data-print="${e.id}">🖨 พิมพ์</button>` : ""}
          ${a6 ? '<span class="bdg bdg-void">ยกเลิกแล้ว</span>' : `${U() || d("issue_receipt") ? `<button class="btn btn-o btn-sm" data-edit="${e.id}">✏️ แก้ไข</button>` : ""}
               ${U() || d("void") ? `<button class="btn btn-danger btn-sm" data-cancel="${e.id}"
                      data-ref="${c2(e.reference_no || "")}">🚫 ยกเลิก</button>` : ""}`}
        </div>` };
  }
  var kn = (e) => {
    let n3 = qa(e);
    return le.map(([, , s7]) => s7(e, n3));
  };
  function An(e) {
    let n3 = e && e.querySelector("#wh-scope");
    if (n3) {
      if (!ln()) {
        n3.hidden = true, n3.textContent = "";
        return;
      }
      n3.hidden = false, n3.textContent = "🔎 กำลังค้นย้อนหลังทุกช่วงเวลา — ช่วงวันที่เริ่มต้น " + on + " วันถูกปลดชั่วคราวเพราะมีคำค้น (เลือกวันที่เองเมื่อไร ระบบจะค้นเฉพาะช่วงที่เลือก)";
    }
  }
  async function xe(e) {
    Re = e;
    let n3 = U() || d("issue_receipt");
    e.innerHTML = `
    
    
    <div class="rep-tabs" id="wh-tabs">
      ${rn.map((m3) => `<button class="rep-tab${f6.mode === m3.k ? " active" : ""}"
        data-wmode="${m3.k}">${m3.lb}</button>`).join("")}
    </div>
    <div class="fbar">
      <select class="sel" data-f="customer">${B2(f6.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${f6.from}">
      <input class="inp" type="date" data-f="to" value="${f6.to}">
      <button class="btn btn-o btn-sm" id="wh-go">ค้นหา</button>
      ${d("export") || U() ? '<button class="btn btn-o btn-sm" id="wh-xls">📗 Export Excel</button>' : ""}
      </div>
    
    <div class="t-xs t-3 mt-1" id="wh-scope" hidden></div>
    
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      
      ${le.map(([m3, p7, , w2], C2) => `<th${w2 ? ` class="${w2.replace("ellip", "")}"`.replace(' class=""', "") : ""}${C2 < mn ? ' data-col-req="1"' : ""}${p7 ? ' data-col-default="hidden"' : ""}>${c2(m3)}</th>`).join("")}
    </tr>
    
    ${yn()}</thead><tbody id="wh-tbody">
      <tr><td colspan="${le.length}" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="wh-pgn"></div>`;
    let s7 = e.querySelector("#wh-xls");
    s7 && (s7.onclick = (m3) => ea({ table: e.querySelector("#wh-tbody") && e.querySelector("#wh-tbody").closest("table"), modeKey: "REPORT_WHT", filters: (() => {
      let p7 = wa();
      return { from: p7.from, to: p7.to, customer: f6.customer || null, direction: ye, mode: f6.mode };
    })(), fetchAll: Cn, rowValues: kn }, m3.target));
    let c4 = e.querySelector(".fbar");
    if (c4) {
      let m3 = (p7) => {
        let w2 = p7.target.closest('[data-f="from"], [data-f="to"]');
        if (!w2) return;
        f6.dateSource = "USER";
        let C2 = w2.dataset.f, k2 = w2.value;
        f6[C2] !== k2 && (f6[C2] = k2, !(k2 && !/^\d{4}-\d{2}-\d{2}$/.test(k2)) && i6("wht-date", () => {
          f6.page = 1, _3();
        }, 0));
      };
      c4.addEventListener("input", m3), c4.addEventListener("change", m3);
    }
    e.querySelector("#wh-go").onclick = () => {
      e.querySelectorAll("[data-f]").forEach((m3) => {
        f6[m3.dataset.f] = m3.value;
      }), f6.page = 1, _3();
    };
    let a6 = e.querySelector("#wh-tbody") && e.querySelector("#wh-tbody").closest("table").tHead;
    if (a6) {
      let m3 = (p7) => {
        let w2 = p7.target.closest("[data-wf]");
        if (!w2) return;
        let C2 = w2.dataset.wf;
        f6[C2] !== w2.value && (f6[C2] = w2.value, i6("wht-f", () => {
          f6.page = 1, _3();
        }, w2.type === "date" ? 0 : 300));
      };
      a6.addEventListener("input", m3), a6.addEventListener("change", m3), a6.addEventListener("keydown", (p7) => {
        p7.key !== "Enter" || !p7.target.closest("[data-wf]") || (p7.preventDefault(), s6("wht-f"), f6.page = 1, _3());
      });
    }
    let l7 = e.querySelector("#wh-tabs");
    l7 && l7.addEventListener("click", (m3) => {
      let p7 = m3.target.closest("[data-wmode]");
      !p7 || p7.dataset.wmode === f6.mode || (f6.mode = p7.dataset.wmode, f6.page = 1, l7.querySelectorAll("[data-wmode]").forEach((w2) => w2.classList.toggle("active", w2.dataset.wmode === f6.mode)), _3());
    }), e.querySelector("#wh-tbody").addEventListener("click", (m3) => Nn(m3, e, _3));
    let b2 = false;
    function g4() {
      let m3 = e.querySelector(".fbar");
      if (wt({ table: e.querySelector("#wh-tbody") && e.querySelector("#wh-tbody").closest("table"), modeKey: "REPORT_WHT", host: m3, canManage: T, onLayout: () => {
        gn() && (s6("wht-f"), f6.page = 1, b2 && _3());
      } }), m3 && n3 && !m3.querySelector("#wh-new")) {
        m3.insertAdjacentHTML("beforeend", '<button class="btn btn-p btn-sm" id="wh-new">＋ เปิดงานใหม่</button>');
        let p7 = m3.querySelector("#wh-new");
        p7 && (p7.onclick = () => De(e, { mode: f6.mode }));
      }
    }
    g4();
    let x3 = false;
    mt(e.querySelector("#wh-tbody"), (m3) => {
      let p7 = m3.dataset.whtid;
      p7 && (x3 || (x3 = true, Promise.resolve(De(e, { whtId: p7 })).finally(() => {
        x3 = false;
      })));
    });
    async function _3() {
      let m3 = u5("wht"), p7 = e.querySelector("#wh-tbody");
      if (p7) try {
        let w2 = wa(), C2 = await Ra({ p_customer: f6.customer || null, p_from: w2.from, p_to: w2.to, p_page: f6.page, p_size: f6.size, p_direction: ye, p_mode: f6.mode });
        if (!a5("wht", m3)) return;
        let k2 = C2.rows || [];
        if (k2.length && k2[0].item_count === void 0) {
          ze(e);
          return;
        }
        p7.innerHTML = k2.length ? k2.map((U3) => {
          let I2 = qa(U3);
          return `<tr data-whtid="${c2(U3.id)}">${le.map(([, , Y2, re]) => `<td${re ? ` class="${re}"` : ""}${(re || "").includes("ellip") ? ' style="max-width:190px"' : ""}>${Y2(U3, I2)}</td>`).join("")}</tr>`;
        }).join("") : `<tr><td colspan="${le.length}" class="empty">ยังไม่มีหนังสือรับรองหัก ณ ที่จ่าย</td></tr>`, u3(e.querySelector("#wh-pgn"), { page: f6.page, size: f6.size, total: C2.total || 0 }, ({ page: U3, size: I2 }) => {
          f6.page = U3, f6.size = I2, _3();
        }), An(e), g4();
      } catch (w2) {
        if (!a5("wht", m3)) return;
        if (ve(w2)) {
          ze(e);
          return;
        }
        p7.innerHTML = `<tr><td colspan="${le.length}" class="empty">โหลดรายการไม่สำเร็จ <button type="button" class="btn btn-sm btn-o" data-ld-retry>ลองใหม่</button></td></tr>`, p7.querySelector("[data-ld-retry]").onclick = () => _3(), t2(w2);
      }
    }
    await _3(), b2 = true;
  }
  async function Nn(e, n3, s7) {
    let c4 = e.target.closest("[data-doc]");
    if (c4) {
      try {
        Xe(await Me(c4.dataset.doc));
      } catch (p7) {
        ve(p7) ? ze(n3) : n(G(p7), "err");
      }
      return;
    }
    let a6 = e.target.closest("[data-edit]");
    if (a6) {
      De(n3, { whtId: a6.dataset.edit });
      return;
    }
    let l7 = e.target.closest("[data-print]");
    if (l7) {
      try {
        Xe(await Me(l7.dataset.print));
      } catch (p7) {
        n(G(p7), "err");
      }
      return;
    }
    let b2 = e.target.closest("[data-post]");
    if (b2) {
      if (!await E("ยืนยัน POST หนังสือรับรองการหักภาษี ณ ที่จ่าย?", "ระบบจะออกเลขอ้างอิงภายในและล็อกเอกสารไว้<br>หลัง POST แก้ไขข้อมูลไม่ได้ — ต้องกด <b>↩ UNPOST</b> ก่อน<br>INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ", "POST")) return;
      try {
        let p7 = await l6("post-wht-" + b2.dataset.post, () => Xt(b2.dataset.post, p6()));
        p7 && n("POST สำเร็จ — เลขอ้างอิงภายใน " + (p7.document_no || "") + (p7.reference_no ? " · Reference No. " + p7.reference_no : ""), "ok"), s7();
      } catch (p7) {
        n(G(p7), "err");
      }
      return;
    }
    let g4 = e.target.closest("[data-unpost]");
    if (g4) {
      let p7 = await x("UNPOST หนังสือรับรอง — กลับเป็นร่างเพื่อแก้ไข (เลขเดิมถูกเก็บไว้ · POST อีกครั้งจะใช้เลขเดิม)");
      if (!p7) return;
      try {
        let w2 = await l6("unpost-wht-" + g4.dataset.unpost, () => pt2(g4.dataset.unpost, p7));
        n("UNPOST แล้ว — กลับเป็นร่าง เลขเดิม " + (w2 && w2.document_no || ""), "ok"), s7();
      } catch (w2) {
        n(G(w2), "err");
      }
      return;
    }
    let x3 = e.target.closest("[data-cancel]");
    if (x3) {
      let p7 = x3.dataset.cancel, w2 = x3.dataset.ref || "", C2 = document.createElement("div");
      C2.innerHTML = `
      <p class="t-sm">ต้องการยกเลิกใบหัก ณ ที่จ่าย
        ${w2 ? "<b>Reference No. " + c2(w2) + "</b>" : "ฉบับนี้"} ใช่หรือไม่?</p>
      <p class="t-xs t-3">การยกเลิกจะเก็บเอกสารและเลขอ้างอิงเดิมไว้ — ไม่ได้ลบข้อมูล</p>
      <div class="fld"><label>หมายเหตุ / เหตุผลที่ยกเลิก <span class="req">*</span></label>
        <textarea class="inp w100" id="wh-cxr" rows="3"
          placeholder="ระบุเหตุผลที่ยกเลิกเอกสารฉบับนี้"></textarea></div>`;
      let k2 = document.createElement("div");
      k2.innerHTML = `<div class="mf-right">
        <button class="btn btn-o" data-close>ยกเลิก</button>
        <button class="btn btn-danger" id="wh-cxok">ยืนยันการยกเลิก</button></div>`, f2({ title: "ยกเลิกใบหัก ณ ที่จ่าย", body: C2, footer: k2 }), k2.querySelector("#wh-cxok").onclick = async (U3) => {
        s4(C2);
        let I2 = (C2.querySelector("#wh-cxr").value || "").trim();
        if (!I2) {
          o2(C2.querySelector("#wh-cxr"), "กรุณาระบุเหตุผลที่ยกเลิก"), n("กรุณาระบุเหตุผลที่ยกเลิก", "err");
          return;
        }
        a4(U3.target, true);
        try {
          await l6("cancel-wht-" + p7, () => ct2(p7, I2, p6())), i2(), n("ยกเลิกเอกสารแล้ว", "ok"), s7();
        } catch (Y2) {
          n(G(Y2), "err"), a4(U3.target, false);
        }
      };
      return;
    }
    let _3 = e.target.closest("[data-del]");
    if (_3) {
      let p7 = await x("ลบหนังสือรับรองหัก ณ ที่จ่าย (ลบได้เฉพาะใบที่ยังไม่ออกจริง)");
      if (!p7) return;
      try {
        await l6("del-wht-" + _3.dataset.del, () => lt2(_3.dataset.del, p7)), n("ลบแล้ว", "ok"), s7();
      } catch (w2) {
        n(G(w2), "err");
      }
      return;
    }
    let m3 = e.target.closest("[data-void]");
    if (m3) {
      let p7 = await x("Void หนังสือรับรอง " + m3.dataset.no);
      if (!p7) return;
      try {
        await l6("void-wht-" + m3.dataset.void, () => ct2(m3.dataset.void, p7, p6())), n("Void เอกสารแล้ว", "ok"), s7();
      } catch (w2) {
        t2(w2);
      }
    }
  }
  async function Rn(e) {
    Q2.page = 1, e.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>ดึงข้อมูลจาก INVOICE</h2></div>
      <button class="btn btn-o" id="wh-back">← กลับฟอร์ม</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">เลือกใบแจ้งหนี้เพื่อเติมลูกค้า · รายการ · อัตรา WHT ให้อัตโนมัติ
        · เป็นตัวช่วยเท่านั้น กรอกเองทั้งหมดก็ได้</p>
      <div class="fbar mt-2">
        <input class="inp" id="wh-pq" value="${c2(Q2.q)}" placeholder="ค้นหา เลขที่ INVOICE / ชื่อลูกค้า">
        <button class="btn btn-o btn-sm" id="wh-pgo">ค้นหา</button>
        <button class="btn btn-o btn-sm" id="wh-skip">← กลับฟอร์ม</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>ลูกค้า</th><th>ประเภท</th>
        <th class="r">ยอดสุทธิ</th><th>อัตรา WHT</th><th class="r">WHT</th>
        <th>วันที่จ่ายจริง</th><th class="center">จัดการ</th>
      </tr></thead><tbody id="wh-ptb">
        <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="wh-ppgn"></div>
    </div>`, e.querySelector("#wh-back").onclick = () => xe(e), e.querySelector("#wh-skip").onclick = () => De(e, {});
    let n3 = e.querySelector("#wh-pq");
    e.querySelector("#wh-pgo").onclick = () => {
      Q2.q = n3.value.trim(), Q2.page = 1, s7();
    }, n3.addEventListener("input", () => i6("wh-pick", () => {
      Q2.q = n3.value.trim(), Q2.page = 1, s7();
    }, 350)), e.querySelector("#wh-ptb").addEventListener("click", (c4) => {
      let a6 = c4.target.closest("[data-pick]");
      a6 && De(e, { invoice: JSON.parse(a6.dataset.pick) });
    });
    async function s7() {
      let c4 = u5("wh-pick"), a6 = e.querySelector("#wh-ptb");
      if (a6) try {
        let l7 = await Kt({ q: Q2.q || null, page: Q2.page, size: Q2.size });
        if (!a5("wh-pick", c4)) return;
        let b2 = l7.rows || [];
        a6.innerHTML = b2.length ? b2.map((g4) => {
          let x3 = g4.wht_breakdown || [], _3 = x3.length ? x3.map((m3) => Ea(m3.rate)).join(" + ") : "-";
          return `<tr>
        <td class="t-b">${c2(g4.invoice_no || "-")}</td>
        <td>${i(g4.invoice_date)}</td>
        <td class="ellip" style="max-width:190px">${c2(g4.customer_name || "-")}</td>
        <td>${c2(g4.charge_type || "-")}</td>
        <td class="r">${g(g4.total_amount)}</td>
        <td class="center">${c2(_3)}</td>
        <td>${g4.payment_date ? i(g4.payment_date) : (g4.payments || []).length > 1 ? '<span class="t-3">' + (g4.payments || []).length + " ครั้ง — เลือกเอง</span>" : '<span class="t-3">ยังไม่รับชำระ</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-p btn-sm" data-pick='${JSON.stringify(g4).replace(/'/g, "&#39;")}'>เลือก</button>
        </div></td></tr>`;
        }).join("") : '<tr><td colspan="9" class="empty">ไม่พบ INVOICE — กด “ข้าม” เพื่อกรอกเองได้</td></tr>', u3(e.querySelector("#wh-ppgn"), { page: Q2.page, size: Q2.size, total: l7.total || 0 }, ({ page: g4, size: x3 }) => {
          Q2.page = g4, Q2.size = x3, s7();
        });
      } catch (l7) {
        if (!a5("wh-pick", c4)) return;
        if (ve(l7)) {
          ze(e);
          return;
        }
        a6.innerHTML = '<tr><td colspan="9" class="empty">โหลดรายการไม่สำเร็จ <button type="button" class="btn btn-sm btn-o" data-ld-retry>ลองใหม่</button></td></tr>', a6.querySelector("[data-ld-retry]").onclick = () => s7(), n(G(l7), "err");
      }
    }
    await s7();
  }
  function Dn(e) {
    if (!t3) return;
    let n3 = x2().find((c4) => c4.id === t3.customer_id) || null;
    if (!n3) return;
    let s7 = (c4, a6) => {
      (e || !t3[c4]) && (t3[c4] = a6 || "");
    };
    s7("payer_name", n3.customer_name), s7("payer_tax_id", n3.tax_id), s7("payer_branch", n3.branch_code), s7("payer_address", n3.address);
  }
  async function De(e, { whtId: n3 = null, invoice: s7 = null, mode: c4 = null } = {}) {
    e.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';
    let a6 = null;
    if (n3) try {
      a6 = await Me(n3);
    } catch (i7) {
      if (ve(i7)) {
        ze(e);
        return;
      }
      return n(G(i7), "err"), xe(e);
    }
    let l7 = p2(/* @__PURE__ */ new Date()), b2 = String(a6 && a6.status || "DRAFT").toUpperCase(), g4 = b2 === "ISSUED", x3 = b2 === "VOID", _3 = g4 || x3;
    if (t3 = { whtId: n3 || null, wht_mode: a6 && a6.wht_mode || c4 || "ACTING_AGENT", direction: a6 && a6.direction ? String(a6.direction).toUpperCase() : ye, status: b2, customer_id: a6 ? a6.customer_id : s7 ? s7.customer_id : "", invoice_id: a6 ? a6.invoice_id || null : s7 ? s7.id : null, invoice_no: a6 ? a6.invoice && a6.invoice.invoice_no : s7 ? s7.invoice_no : null, document_date: a6 ? a6.document_date : l7, pay_date: a6 ? a6.pay_date || "" : s7 && s7.payment_date || "", payments: s7 ? s7.payments || [] : [], certificate_no: a6 && a6.certificate_no || "", reference_no: a6 && a6.reference_no || "", has_ref: !!(a6 && [a6.reference_no, a6.ref_date].some((i7) => String(i7 ?? "").trim())), note: a6 && a6.note || "", book_no: a6 && a6.book_no || "", invoice_no_text: a6 ? a6.invoice_no_text || "" : s7 && s7.invoice_no || "", payee_code: a6 && a6.payee_code || "", payment_by: a6 && a6.payment_by || "", has_fund: a6 ? a6.has_fund === true || a6.has_fund === false ? a6.has_fund : [a6.gpf_amount, a6.social_security_amount, a6.provident_fund_amount].some((i7) => i7 != null && Number(i7) !== 0) : false, gpf_amount: a6 ? a6.gpf_amount == null ? "" : String(a6.gpf_amount) : "", social_security_amount: a6 ? a6.social_security_amount == null ? "" : String(a6.social_security_amount) : "", provident_fund_amount: a6 ? a6.provident_fund_amount == null ? "" : String(a6.provident_fund_amount) : "", ref_date: a6 && a6.ref_date || "", job_no: a6 && a6.job_no || "", doc_code: a6 && a6.doc_code || "", payer_code: a6 && a6.payer_code || "", payer_citizen_id: a6 && a6.payer_citizen_id || "", payer_name: a6 && a6.payer_name || "", payer_tax_id: a6 && a6.payer_tax_id || "", payer_branch: a6 && a6.payer_branch || "", payer_address: a6 && a6.payer_address || "", has_agent: a6 ? a6.has_acting_agent === true || a6.has_acting_agent === false ? a6.has_acting_agent : !!String(a6.agent_name || "").trim() : false, agent_name: a6 && a6.agent_name || "", agent_tax_id: a6 && a6.agent_tax_id || "", agent_branch: a6 && a6.agent_branch || "", agent_address: a6 && a6.agent_address || "", payee_customer_id: a6 && a6.payee_customer_id || "", payee_citizen_id: a6 && a6.payee_citizen_id || "", payee_name: a6 && a6.payee_name || "", payee_tax_id: a6 && a6.payee_tax_id || "", payee_branch: a6 && a6.payee_branch || "", payee_address: a6 && a6.payee_address || "", form_type: a6 ? a6.form_type || "" : _n, form_seq: a6 && a6.form_seq || "", pay_method: a6 ? a6.pay_method || "" : wn, pay_method_other: a6 && a6.pay_method_other || "", has_form: a6 ? !!(String(a6.form_type || "").trim() || String(a6.form_seq || "").trim()) : false, has_pm: a6 ? !!(String(a6.pay_method || "").trim() || String(a6.pay_method_other || "").trim()) : true, signer_name: a6 && a6.signer_name || "", signer_position: a6 && a6.signer_position || "", has_signer: !!(a6 && [a6.signer_name, a6.signer_position, a6.payment_by].some((i7) => String(i7 ?? "").trim())), lines: [] }, Dn(false), a6 && (a6.items || []).length) t3.lines = a6.items.map((i7) => ({ pay_date: i7.pay_date || t3.pay_date, income_type: String(i7.income_type || "SERVICE").toUpperCase(), description: i7.description || "", tax_base: W2(i7.tax_base), rate: W2(i7.rate), wht_income_category: i7.wht_income_category || "", amount: W2(i7.amount) }));
    else if (s7) {
      let i7 = s7.wht_breakdown || [], o5 = s7.payment_date || "";
      t3.lines = i7.length ? i7.map((d4) => ({ pay_date: o5, income_type: String(s7.charge_type || "").toUpperCase() === "ADVANCE" ? "OTHER" : "SERVICE", description: d4.description || s7.description || "", tax_base: W2(d4.tax_base), rate: W2(d4.rate), amount: u2(W2(d4.tax_base) * W2(d4.rate) / 100), wht_income_category: Ze(String(s7.charge_type || "").toUpperCase() === "ADVANCE" ? "OTHER" : "SERVICE") })) : [{ pay_date: o5, income_type: "SERVICE", description: s7.description || "", tax_base: W2(s7.subtotal), rate: 0, amount: 0, wht_income_category: Ze("SERVICE") }];
    }
    t3.lines.length || (t3.lines = [{ pay_date: t3.pay_date || "", income_type: "SERVICE", description: "", tax_base: 0, rate: xt.SERVICE, amount: 0, wht_income_category: Ze("SERVICE") }]), !a6 && t3.wht_mode === "ACTING_AGENT" && (t3.has_agent = true), t3.has_agent && !["agent_name", "agent_tax_id", "agent_branch", "agent_address"].some((i7) => String(t3[i7] || "").trim()) && (t3.agent_name = o3.nameEn, t3.agent_tax_id = o3.taxId, t3.agent_branch = "00000", t3.agent_address = o3.address);
    let m3 = x2().find((i7) => i7.id === t3.customer_id) || null;
    e.innerHTML = `
    <div class="card card-pad whp-form">

      <div class="whp-hd">
        <div class="whp-hd-l">
          <h2 class="whp-hd-t">ใบหัก ณ ที่จ่าย (50 ทวิ)</h2>
          <p class="whp-hd-s">${t3.whtId ? "แก้ไขร่าง" : "เปิดงานใหม่"} — หนังสือรับรองการหักภาษี ณ ที่จ่าย</p>
        </div>
        <div class="whp-hd-r">
          <span class="whp-hd-st">สถานะ: ${Da(t3.status)}</span>
          
          
          
          <button class="btn btn-o whp-x" id="wh-back"
            title="ปิด / กลับรายการ" aria-label="ปิด / กลับรายการ">✕</button>
        </div>
      </div>

      
      
      <label class="whp-refchk" for="wh-refbox-chk">
        <input type="checkbox" id="wh-refbox-chk" ${t3.has_ref ? "checked" : ""}>
        <span class="whp-bt">ข้อมูลอ้างอิงภายใน</span>
      </label>
      <div class="whp-ref" id="wh-refbox" ${t3.has_ref ? "" : "hidden"}>
        
        
        <div class="whp-refg mt-1">
          <div class="fld"><label>Reference No.</label>
            <input class="inp w100" id="wh-ref" value="${c2(t3.reference_no)}"
              readonly tabindex="-1" title="ออกอัตโนมัติเมื่อกดบันทึก — แก้ไขไม่ได้"
              placeholder="ออกอัตโนมัติเมื่อกดบันทึก"></div>
          <div class="fld"><label>Ref. Date</label>
            <input class="inp w100" type="date" id="wh-refdate" value="${c2(t3.ref_date || "")}"
              readonly tabindex="-1" title="วันที่บันทึกครั้งแรก — ระบบใส่ให้อัตโนมัติ"></div>
        </div>
        
        <p class="t-xs t-3">Reference No. และ Ref. Date
          <b>ออกอัตโนมัติเมื่อกดบันทึกครั้งแรก</b> — แก้ไขเองไม่ได้
          และจะไม่เปลี่ยนอีกเลยหลังจากนั้น</p>
        <p class="t-xs t-3">เลขที่เอกสารภายใน (คนละเลขกับ Reference No.):
          ${t3.whtId && a6 && !/^WHTDRAFT-/.test(String(a6.document_no || "")) ? "<b>" + c2(a6.document_no) + "</b>" : "ยังไม่ได้ POST — ออกให้เมื่อกด POST จากหน้ารายการ"}</p>
      </div>
      
      <!-- ── เล่มที่ / เลขที่ ──────────────────────────────────────────────── -->
      <section class="whp-blk">
        <h3 class="whp-bt">เล่มที่ / เลขที่</h3>
        <div class="whp-r3">
          <div class="fld"><label>เล่มที่</label>
            <input class="inp w100" id="wh-book" value="${c2(t3.book_no)}"></div>
          <div class="fld"><label>เลขที่ <span class="req">*</span></label>
            <input class="inp w100" id="wh-cert" value="${c2(t3.certificate_no)}"></div>
          
          
          <div class="fld"><label>รหัสย่อลูกค้า</label>
            <div class="whp-cbx">
              <input class="inp w100" id="wh-doccode" autocomplete="off"
                role="combobox" aria-expanded="false" aria-autocomplete="list"
                placeholder="เลือกหรือพิมพ์รหัสย่อลูกค้า" value="${c2(t3.doc_code)}">
              <div class="whp-cbx-list" id="wh-doccode-list" hidden></div>
            </div></div>
        </div>
      </section>


      <!-- ── ผู้มีหน้าที่หักภาษี ณ ที่จ่าย ─────────────────────────────────── -->
      <section class="whp-blk">
        
        
        <div class="whp-bh">
          <h3 class="whp-bt">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</h3>
          
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-mnew"
              >💾 บันทึกเข้ารายชื่อ</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-medit"
              ${t3.customer_id ? "" : "disabled"}>✏️ แก้ไขข้อมูล</button>
          </span>
          
        </div>
        
        
        
        <div class="whp-pick whp-coderow">
          <label for="wh-payer-code">รหัส (CODE)</label>
          <input class="inp whp-code" id="wh-payer-code" value="${c2(t3.payer_code)}"
            placeholder="เช่น NJ" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payer-code-go"
            title="ค้นหา CODE นี้">🔍</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payer-pick">👥 เลือกจากรายชื่อ</button>
          <label for="wh-payer-cid" class="whp-cid-l">เลขประจำตัวบัตรประชาชน</label>
          <input class="inp whp-cid" id="wh-payer-cid" value="${c2(t3.payer_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-payer-name" value="${c2(t3.payer_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-payer-branch" value="${c2(t3.payer_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-payer-tax" value="${c2(t3.payer_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label>
          <input class="inp w100" id="wh-payer-addr" value="${c2(t3.payer_address)}"></div>
      </section>

      <!-- ── กระทำการแทน — ใช้โครงเดียวกับ Payer/Payee (Align ตรงกัน) ──── -->
      
      
      
      ${t3.wht_mode === "NON_ACTING" ? "" : `
      <section class="whp-blk whp-agblk">
        <label class="whp-refchk" for="wh-has-agent">
          <input type="checkbox" id="wh-has-agent" ${t3.has_agent ? "checked" : ""}>
          <span class="whp-bt">กระทำการแทน</span>
        </label>
        <div class="whp-ref" id="wh-agent-sec" ${t3.has_agent ? "" : "hidden"}>
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-agent-name" value="${c2(t3.agent_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-agent-branch" value="${c2(t3.agent_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-agent-tax" value="${c2(t3.agent_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
          <div class="fld"><label>ที่อยู่</label>
            <input class="inp w100" id="wh-agent-addr" value="${c2(t3.agent_address)}"></div>
        </div>
      </section>`}

      <!-- ── ผู้ถูกหักภาษี ณ ที่จ่าย ────────────────────────────────────────
           (V.204: ช่อง "รหัส" ย้ายขึ้นไปเป็นแถว CODE ด้านบนแล้ว -> ใช้ .whp-rname เหมือนอีก 2 ฝ่าย)
           สัดส่วนของ สาขา/Tax ID เท่ากับอีก 2 Section เป๊ะ -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">ผู้ถูกหักภาษี ณ ที่จ่าย</h3>
          
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-mnew"
              >💾 บันทึกเข้ารายชื่อ</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-medit"
              ${t3.payee_customer_id ? "" : "disabled"}>✏️ แก้ไขข้อมูล</button>
          </span>
        </div>
        
        <div class="whp-pick whp-coderow">
          <label for="wh-payee-code2">รหัส (CODE)</label>
          <input class="inp whp-code" id="wh-payee-code2" value="${c2(t3.payee_code)}"
            placeholder="เช่น VP001" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payee-code-go"
            title="ค้นหา CODE นี้">🔍</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payee-pick">👥 เลือกจากรายชื่อ</button>
          <label for="wh-payee-cid" class="whp-cid-l">เลขประจำตัวบัตรประชาชน</label>
          <input class="inp whp-cid" id="wh-payee-cid" value="${c2(t3.payee_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-payee-name" value="${c2(t3.payee_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-payee-branch" value="${c2(t3.payee_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-payee-tax" value="${c2(t3.payee_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label>
          <input class="inp w100" id="wh-payee-addr" value="${c2(t3.payee_address)}"></div>
      </section>

      
      
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-form">
          <input type="checkbox" id="wh-has-form" ${t3.has_form ? "checked" : ""}>
          <span class="whp-bt">ลำดับที่ในแบบยื่นรายการ
            <small class="whp-hint">(เลือก 1 รายการ)</small></span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-form-sec" ${t3.has_form ? "" : "hidden"}>
          <div class="whp-rds whp-rds-h" id="wh-form-rd">${ga("wh-form", Ca, t3.form_type)}</div>
          <label class="whp-seq">ลำดับที่:
            <input class="inp" id="wh-formseq" value="${c2(t3.form_seq)}"></label>
        </div>
      </section>

      <!-- ── รายการเงินได้ — ตาราง Compact (ข้อความมาตรา 40 อยู่ใน Preview A4) ── -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">รายการเงินได้</h3>
          <button class="btn btn-o btn-sm" id="wh-add">＋ เพิ่มรายการ</button>
        </div>
        <div class="tbl-wrap whp-items"><table class="tbl"><thead><tr>
          
          <th style="width:38px">ลำดับ</th>
          <th>ประเภทเงินได้ <span class="req">*</span></th>
          <th style="width:116px">วันที่จ่ายเงิน <span class="req">*</span></th>
          <th class="r" style="width:110px">จำนวนเงินที่จ่าย</th>
          <th class="r" style="width:112px">ภาษีที่หักและนำส่ง <span class="req">*</span></th>
          <th class="center" style="width:44px">จัดการ</th>
        </tr></thead><tbody id="wh-ltb"></tbody></table></div>
      </section>

      <!-- ── รวมยอด — Reuse การคำนวณเดิม 100% (refreshTotals) ─────────────── -->
      <section class="whp-blk">
        <h3 class="whp-bt">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</h3>
        <div class="whp-r3">
          <div class="fld"><label>รวมเงินที่จ่าย</label>
            <input class="inp w100 r" id="wh-t-base" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>รวมภาษีที่หักและนำส่ง</label>
            <input class="inp w100 r whp-hi" id="wh-t-tax" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>รวมภาษีที่หักนำส่ง <i>(ตัวอักษร)</i></label>
            <input class="inp w100" id="wh-t-words" value="" readonly tabindex="-1"></div>
        </div>
      </section>

      
      <div class="whp-blk whp-blk-chk">
        <label class="whp-agchk"><input type="checkbox" id="wh-has-fund"
          ${t3.has_fund ? "checked" : ""}><span>เงินกองทุน / ประกันสังคม</span></label>
      </div>
      <section class="whp-blk" id="wh-fund-sec" ${t3.has_fund ? "" : "hidden"}>
        <div class="whp-r3">
          <div class="fld"><label>กบข./กสจ./กองทุนสงเคราะห์ครูฯ</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-gpf" value="${c2(t3.gpf_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>กองทุนประกันสังคม</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-sso" value="${c2(t3.social_security_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>กองทุนสำรองเลี้ยงชีพ</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-pvd" value="${c2(t3.provident_fund_amount)}" placeholder="0.00"></div>
        </div>
      </section>

      <!-- ── ผู้จ่ายเงิน (วิธีการจ่ายภาษี) — Radio แนวนอน ────────────────── -->
      
      
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-pm">
          <input type="checkbox" id="wh-has-pm" ${t3.has_pm ? "checked" : ""}>
          <span class="whp-bt">ผู้จ่ายเงิน</span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-pm-sec" ${t3.has_pm ? "" : "hidden"}>
          <div class="whp-rds whp-rds-h" id="wh-pm-rd">${ga("wh-pm", ka, t3.pay_method)}</div>
          <span class="whp-pmo" id="wh-pm-other-wrap"
            ${t3.pay_method === je ? "" : "hidden"}>
            <input class="inp" id="wh-pm-other" placeholder="ระบุอื่น ๆ"
              aria-label="ระบุ (อื่น ๆ)" value="${c2(t3.pay_method_other)}">
          </span>
        </div>
      </section>

      
      <!-- ── วันที่ / ผู้ลงนาม ─────────────────────────────────────────────── -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">วันที่ / ผู้ลงนาม</h3>
          <label class="whp-agchk"><input type="checkbox" id="wh-has-signer"
            ${t3.has_signer ? "checked" : ""}><span>ระบุข้อมูลผู้ลงนาม / ผู้จ่ายเงินเพิ่มเติม</span></label>
        </div>
        <div class="whp-r3 whp-dates">
          <div class="fld"><label>วันที่จ่ายเงินจริง <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-pdate" value="${c2(t3.pay_date || "")}"></div>
          <div class="fld"><label>วันที่ออกหนังสือรับรอง <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-ddate" value="${c2(t3.document_date)}"></div>
        </div>
        ${t3.payments && t3.payments.length > 1 ? `<p class="t-xs whp-warn">ใบแจ้งหนี้นี้มีการรับชำระ ${t3.payments.length} ครั้ง —
              ระบบไม่เลือกให้ กรุณาระบุวันที่จ่ายเงินจริง</p>` : ""}
        <div id="wh-signer-sec" ${t3.has_signer ? "" : "hidden"}>
          <div class="whp-r3">
            <div class="fld"><label>ผู้ลงนาม</label>
              <input class="inp w100" id="wh-signer" value="${c2(t3.signer_name)}"></div>
            <div class="fld"><label>ตำแหน่ง</label>
              <input class="inp w100" id="wh-signpos" value="${c2(t3.signer_position)}"></div>
          </div>
          <div class="whp-r3">
            <div class="fld whp-sp2"><label>ผู้จ่ายเงิน (อื่นๆ) — ใช้ในคอลัมน์ Excel · คนละช่องกับผู้ลงนาม</label>
              <input class="inp w100" id="wh-payby" value="${c2(t3.payment_by)}"
                placeholder="เช่น EDC / IKANO / KN / PRO / APL / SCH"></div>
          </div>
        </div>
      </section>

      
      <div class="whp-act">
        <div class="whp-act-l">
          
          ${t3.whtId && !_3 && (U() || d("issue_receipt")) && _("REPORT") ? '<button class="btn btn-danger" id="wh-del">🗑 ลบ</button>' : ""}
          ${g4 ? '<button class="btn btn-unpost" id="wh-unpost">↩ UNPOST</button>' : ""}
        </div>
        <div class="whp-act-r">
          <button class="btn btn-o" id="wh-cancel">ยกเลิก</button>
          <button class="btn btn-p" id="wh-save" ${_3 ? "disabled" : ""}>💾 บันทึก</button>
          
          <button class="btn btn-o" id="wh-prev"
            ${String(t3.reference_no || "").trim() ? "" : "disabled"}>🖨 พิมพ์</button>
        </div>
      </div>
      ${t3.whtId ? "" : '<p class="t-xs t-3 mt-1">กด 💾 บันทึก แล้วระบบจะออก Reference No. และ Ref. Date ให้อัตโนมัติ — พิมพ์เอกสารจริงได้ทันทีหลังบันทึก (พิมพ์จากข้อมูลในฐานข้อมูลเท่านั้น)</p>'}
      ${g4 ? '<p class="t-xs whp-warn mt-1">เอกสารนี้ POST แล้ว — แก้ไขข้อมูลไม่ได้ ต้องกด ↩ UNPOST ก่อน</p>' : ""}
      ${x3 ? '<p class="t-xs whp-warn mt-1">เอกสารนี้ถูก VOID แล้ว — ดูและพิมพ์ได้อย่างเดียว</p>' : ""}

    </div>`;
    async function p7() {
      if (!t3.whtId || !String(t3.reference_no || "").trim()) {
        n("กรุณาบันทึกเอกสารก่อนพิมพ์", "err");
        return;
      }
      try {
        Xe(await Me(t3.whtId));
      } catch (i7) {
        n(G(i7), "err");
      }
    }
    let w2 = e.querySelector("#wh-ltb"), C2 = ["certificate_no", "book_no", "document_date", "pay_date", "reference_no", "invoice_no_text", "ref_date", "job_no", "note", "customer_id", "invoice_id", "payee_customer_id", "payee_code", "payment_by", "has_fund", "gpf_amount", "social_security_amount", "provident_fund_amount", "doc_code", "payer_code", "payer_citizen_id", "payee_citizen_id", "payer_name", "payer_tax_id", "payer_branch", "payer_address", "has_agent", "agent_name", "agent_tax_id", "agent_branch", "agent_address", "payee_name", "payee_tax_id", "payee_branch", "payee_address", "form_type", "form_seq", "pay_method", "pay_method_other", "signer_name", "signer_position"], k2 = () => JSON.stringify([C2.map((i7) => t3[i7] === void 0 || t3[i7] === null ? "" : String(t3[i7])), (t3.lines || []).map((i7) => [i7.pay_date || "", i7.income_type || "", i7.wht_income_category || "", i7.description || "", String(i7.tax_base ?? ""), String(i7.rate ?? ""), String(i7.amount ?? "")])]), U3 = k2();
    t3.__resetDirty = () => {
      U3 = k2();
    };
    let I2 = async () => {
      if (_3 || k2() === U3) {
        xe(e);
        return;
      }
      await E("ข้อมูลที่แก้ไขยังไม่ได้บันทึก", 'ต้องการออกจากหน้านี้หรือไม่?<br><span class="t-xs t-3">การเปลี่ยนแปลงทั้งหมดจะไม่ถูกบันทึก (เอกสารไม่ถูกลบ)</span>', "ออกโดยไม่บันทึก") && xe(e);
    };
    e.querySelector("#wh-back").onclick = I2, e.querySelector("#wh-cancel").onclick = I2, e.querySelector("#wh-ddate").onchange = (i7) => {
      t3.document_date = i7.target.value;
    }, e.querySelector("#wh-pdate").onchange = (i7) => {
      t3.pay_date = i7.target.value;
    };
    function Y2() {
      let i7 = String(t3.pay_date || "").trim();
      i7 && (t3.lines || []).forEach((o5, d4) => {
        if (String(o5.pay_date || "").trim()) return;
        o5.pay_date = i7;
        let h = e.querySelector(`#wh-ltb [data-i="${d4}"][data-k="pay_date"]`);
        h && (h.value = i7);
      });
    }
    let re = e.querySelector("#wh-refbox-chk"), we = e.querySelector("#wh-refbox");
    re && (re.onchange = (i7) => {
      t3.has_ref = !!i7.target.checked, we && (we.hidden = !t3.has_ref);
    });
    let Ee = e.querySelector("#wh-has-signer"), pe = e.querySelector("#wh-signer-sec");
    Ee && (Ee.onchange = (i7) => {
      t3.has_signer = !!i7.target.checked, pe && (pe.hidden = !t3.has_signer);
    });
    let O4 = { "wh-payer-branch": 5, "wh-agent-branch": 5, "wh-payee-branch": 5, "wh-payer-tax": 13, "wh-agent-tax": 13, "wh-payee-tax": 13, "wh-payer-cid": 13, "wh-payee-cid": 13 };
    Object.entries({ "wh-book": "book_no", "wh-jobno": "job_no", "wh-cert": "certificate_no", "wh-note": "note", "wh-doccode": "doc_code", "wh-payer-code": "payer_code", "wh-payee-code2": "payee_code", "wh-invno": "invoice_no_text", "wh-payee-code": "payee_code", "wh-payby": "payment_by", "wh-gpf": "gpf_amount", "wh-sso": "social_security_amount", "wh-pvd": "provident_fund_amount", "wh-payer-cid": "payer_citizen_id", "wh-payee-cid": "payee_citizen_id", "wh-payer-name": "payer_name", "wh-payer-tax": "payer_tax_id", "wh-payer-branch": "payer_branch", "wh-payer-addr": "payer_address", "wh-agent-name": "agent_name", "wh-agent-tax": "agent_tax_id", "wh-agent-branch": "agent_branch", "wh-agent-addr": "agent_address", "wh-payee-name": "payee_name", "wh-payee-tax": "payee_tax_id", "wh-payee-branch": "payee_branch", "wh-payee-addr": "payee_address", "wh-formseq": "form_seq", "wh-pm-other": "pay_method_other", "wh-signer": "signer_name", "wh-signpos": "signer_position" }).forEach(([i7, o5]) => {
      let d4 = e.querySelector("#" + i7);
      if (!d4) return;
      let h = O4[i7];
      if (h) {
        d4.oninput = (u6) => {
          let v2 = String(u6.target.value).replace(/\D/g, "").slice(0, h);
          if (v2 !== u6.target.value) {
            u6.target.value = v2;
            try {
              u6.target.setSelectionRange(v2.length, v2.length);
            } catch {
            }
          }
          t3[o5] = v2;
        };
        return;
      }
      d4.oninput = (u6) => {
        t3[o5] = u6.target.value;
      };
    }), function() {
      let o5 = e.querySelector("#wh-doccode"), d4 = e.querySelector("#wh-doccode-list");
      if (!o5 || !d4) return;
      let h = [], u6 = [], v2 = -1, N2 = () => {
        d4.hidden = true, v2 = -1, o5.setAttribute("aria-expanded", "false");
      }, A = () => {
        let $2 = String(t3.doc_code || "").trim().toLowerCase();
        d4.innerHTML = u6.length ? u6.map((D2, S3) => `<button type="button" role="option"
            aria-selected="${D2.toLowerCase() === $2 ? "true" : "false"}"
            class="whp-cbx-opt${S3 === v2 ? " on" : ""}${D2.toLowerCase() === $2 ? " sel" : ""}"
            data-code="${c2(D2)}"><span class="whp-cbx-dot"></span>${c2(D2)}</button>`).join("") : '<div class="whp-cbx-empty">ไม่พบ CODE นี้ — พิมพ์ค่าใหม่แล้วบันทึกได้</div>', d4.hidden = false, o5.setAttribute("aria-expanded", "true");
      }, R4 = () => {
        let $2 = String(o5.value || "").trim().toLowerCase();
        u6 = $2 ? h.filter((D2) => D2.toLowerCase().includes($2)) : h.slice(), v2 = -1, A();
      }, T4 = ($2) => {
        o5.value = $2, t3.doc_code = $2, N2();
      };
      o5.addEventListener("focus", () => {
        h.length && R4();
      }), o5.addEventListener("input", () => {
        t3.doc_code = o5.value, h.length && R4();
      }), o5.addEventListener("keydown", ($2) => {
        if (!d4.hidden) if ($2.key === "ArrowDown" || $2.key === "ArrowUp") {
          if ($2.preventDefault(), !u6.length) return;
          v2 = (v2 + ($2.key === "ArrowDown" ? 1 : -1) + u6.length) % u6.length, A();
        } else $2.key === "Enter" ? v2 >= 0 && u6[v2] && ($2.preventDefault(), T4(u6[v2])) : $2.key === "Escape" && N2();
      }), d4.addEventListener("mousedown", ($2) => {
        let D2 = $2.target.closest("[data-code]");
        D2 && ($2.preventDefault(), T4(D2.dataset.code));
      }), X(d4, ($2) => {
        !d4.hidden && !d4.contains($2.target) && $2.target !== o5 && N2();
      }), Zt().then(($2) => {
        h = Array.isArray($2) ? $2.map(String) : [];
      }).catch(() => {
        h = [];
      });
    }(), e.querySelector("#wh-refdate").onchange = (i7) => {
      i7.target.value = t3.ref_date || "";
    };
    function oe() {
      ["agent_name", "agent_tax_id", "agent_branch", "agent_address"].some((o5) => String(t3[o5] || "").trim()) || (t3.agent_name = o3.nameEn, t3.agent_tax_id = o3.taxId, t3.agent_branch = "00000", t3.agent_address = o3.address, [["wh-agent-name", "agent_name"], ["wh-agent-tax", "agent_tax_id"], ["wh-agent-branch", "agent_branch"], ["wh-agent-addr", "agent_address"]].forEach(([o5, d4]) => {
        let h = e.querySelector("#" + o5);
        h && (h.value = t3[d4]);
      }));
    }
    let ee = { payer: { code: "wh-payer-code", pick: "wh-payer-pick", go: "wh-payer-code-go", cust: "wh-cust", k: "payer", custKey: "customer_id", ids: { name: "wh-payer-name", branch: "wh-payer-branch", tax: "wh-payer-tax", cid: "wh-payer-cid", addr: "wh-payer-addr" }, keys: { name: "payer_name", branch: "payer_branch", tax: "payer_tax_id", cid: "payer_citizen_id", addr: "payer_address", code: "payer_code" } }, payee: { code: "wh-payee-code2", pick: "wh-payee-pick", go: "wh-payee-code-go", cust: "wh-payee-cus", k: "payee", custKey: "payee_customer_id", ids: { name: "wh-payee-name", branch: "wh-payee-branch", tax: "wh-payee-tax", cid: "wh-payee-cid", addr: "wh-payee-addr" }, keys: { name: "payee_name", branch: "payee_branch", tax: "payee_tax_id", cid: "payee_citizen_id", addr: "payee_address", code: "payee_code" } } };
    function se(i7) {
      let o5 = ee[i7];
      if (!o5) return;
      let d4 = !!String(t3[o5.custKey] || "").trim(), h = e.querySelector("#wh-" + i7 + "-medit"), u6 = e.querySelector("#wh-" + i7 + "-mnew");
      h && (h.disabled = !d4, h.title = d4 ? "แก้ไขข้อมูลรายชื่อที่ผูกอยู่" : "ยังไม่ได้เลือกรายชื่อ — ค้นด้วย CODE หรือเลือกจากรายชื่อก่อน"), u6 && (u6.disabled = d4, u6.title = d4 ? 'CODE นี้มีอยู่ในรายชื่อแล้ว — ใช้ "แก้ไขข้อมูล"' : "บันทึกข้อมูลชุดนี้เข้ารายชื่อ");
    }
    function qe(i7) {
      let o5 = ee[i7];
      o5 && (t3[o5.custKey] && (t3[o5.custKey] = null), se(i7));
    }
    function X2(i7, o5) {
      let d4 = ee[i7];
      if (!d4 || !o5) return;
      if (t3[d4.keys.code] = o5.code || "", t3[d4.keys.name] = o5.name || "", t3[d4.keys.branch] = o5.branch || "", t3[d4.keys.tax] = o5.tax_id || "", t3[d4.keys.cid] = o5.citizen_id || "", t3[d4.keys.addr] = o5.address || "", o5.id) {
        t3[d4.custKey] = o5.id;
        let u6 = e.querySelector("#" + d4.cust);
        u6 && [...u6.options].some((v2) => v2.value === o5.id) && (u6.value = o5.id);
      }
      let h = (u6, v2) => {
        let N2 = e.querySelector("#" + u6);
        N2 && (N2.value = v2 || "");
      };
      h(d4.code, t3[d4.keys.code]), h(d4.ids.name, t3[d4.keys.name]), h(d4.ids.branch, t3[d4.keys.branch]), h(d4.ids.tax, t3[d4.keys.tax]), h(d4.ids.cid, t3[d4.keys.cid]), h(d4.ids.addr, t3[d4.keys.addr]), se(i7);
    }
    async function at2(i7) {
      let o5 = ee[i7], d4 = e.querySelector("#" + o5.code), h = (d4 && d4.value || "").trim();
      if (h) try {
        let u6 = await Ae({ code: h }), v2 = u6 && u6.rows || [];
        if (!v2.length) {
          qe(i7), n('ไม่พบ CODE "' + h + '" ใน Master', "err");
          return;
        }
        X2(i7, v2[0]), n("เติมข้อมูลจาก CODE " + v2[0].code + " แล้ว", "ok");
      } catch (u6) {
        t2(u6, "ค้นหา CODE ไม่สำเร็จ");
      }
    }
    function Ia(i7) {
      let o5 = document.createElement("div");
      o5.className = "whp-pk", o5.innerHTML = `
      <div class="whp-pk-bar">
        <label for="whp-pk-q">ค้นหา</label>
        <input class="inp" id="whp-pk-q" placeholder="ระบุ CODE หรือ ชื่อ" autocomplete="off">
        <button type="button" class="btn btn-o btn-sm" id="whp-pk-go">🔍 ค้นหา</button>
        ${U() ? '<button type="button" class="btn btn-p btn-sm" id="whp-pk-new">＋ เพิ่มข้อมูลใหม่</button>' : ""}
      </div>
      <div class="tbl-wrap whp-pk-tbl"><table class="tbl"><thead><tr>
        <th style="width:44px">เลือก</th><th style="width:110px">CODE</th><th>ชื่อ</th>
        <th style="width:150px">เลขประจำตัวผู้เสียภาษีอากร</th>
        <th style="width:90px">สาขา</th><th>ที่อยู่</th>
      </tr></thead><tbody id="whp-pk-tb"></tbody></table></div>
      <!-- ── V.335 ── แถบเดินหน้า (Server-side Pagination)
           เดิมไม่มีเลย -> ผู้ใช้เข้าใจว่า Master มีแค่ 50 รายการ
           ข้อความบอกช่วงและยอดรวมจริงเสมอ ไม่ให้เข้าใจผิดว่ามีหน้าเดียว -->
      <div class="whp-pk-pgn" id="whp-pk-pgn">
        <span id="whp-pk-info" class="t-3"></span>
        <span class="mf-right">
          <button type="button" class="btn btn-o btn-sm" id="whp-pk-prev">‹ ก่อนหน้า</button>
          <button type="button" class="btn btn-o btn-sm" id="whp-pk-next">ถัดไป ›</button>
        </span>
      </div>
      <div class="whp-pk-form" id="whp-pk-form" hidden></div>`;
      let d4 = document.createElement("div");
      d4.innerHTML = `<div class="mf-right">
        <button class="btn btn-p" id="whp-pk-ok">เลือก</button>
        <button class="btn btn-o" data-close>ยกเลิก</button></div>`, f2({ title: "ค้นหาข้อมูลลูกค้า / ผู้ขาย", body: o5, footer: d4, large: true });
      let h = o5.querySelector("#whp-pk-tb"), u6 = [], v2 = null, N2 = 50, A = 0, R4 = 0, T4 = false, $2 = o5.querySelector("#whp-pk-info"), D2 = o5.querySelector("#whp-pk-prev"), S3 = o5.querySelector("#whp-pk-next"), L = "wh-pk-" + i7;
      async function Z2(H3) {
        let P2 = (o5.querySelector("#whp-pk-q").value || "").trim();
        H3 || (A = 0);
        let te = u5(L);
        h.innerHTML = '<tr><td colspan="6" class="center t-3">กำลังค้นหา…</td></tr>';
        let F2 = null;
        try {
          F2 = await Ae(P2 ? { q: P2, size: N2, offset: A } : { size: N2, offset: A });
        } catch (J2) {
          if (!a5(L, te)) return;
          t2(J2, "ค้นหาไม่สำเร็จ"), F2 = null;
        }
        a5(L, te) && (u6 = F2 && F2.rows || [], R4 = F2 && typeof F2.total == "number" ? F2.total : u6.length, T4 = F2 && typeof F2.has_more == "boolean" ? F2.has_more : A + u6.length < R4, v2 = null, h.innerHTML = u6.length ? u6.map((J2, me) => `<tr data-i="${me}">
          <td class="center"><input type="radio" name="whp-pk-r" value="${me}"></td>
          <td class="t-b">${c2(J2.code || "-")}</td>
          <td class="ellip" title="${c2(J2.name || "")}">${c2(J2.name || "-")}</td>
          <td>${c2(J2.tax_id || "-")}</td>
          <td>${c2(J2.branch || "-")}</td>
          <td class="ellip" title="${c2(J2.address || "")}">${c2(J2.address || "-")}</td>
        </tr>`).join("") : '<tr><td colspan="6" class="center t-3">ไม่พบข้อมูล</td></tr>', Ma());
      }
      function Ma() {
        let H3 = R4 ? A + 1 : 0, P2 = A + u6.length, te = R4 ? Math.ceil(R4 / N2) : 1, F2 = Math.floor(A / N2) + 1;
        $2.textContent = R4 ? `แสดง ${H3}–${P2} จากทั้งหมด ${R4.toLocaleString("th-TH")} รายการ  ·  หน้า ${F2} / ${te}` : "ไม่พบข้อมูล", D2.disabled = A <= 0, S3.disabled = !T4;
      }
      D2.onclick = () => {
        A <= 0 || (A = Math.max(0, A - N2), s6(L), Z2(true));
      }, S3.onclick = () => {
        T4 && (A += N2, s6(L), Z2(true));
      }, h.addEventListener("click", (H3) => {
        let P2 = H3.target.closest("tr[data-i]");
        if (!P2) return;
        let te = P2.querySelector("input[type=radio]");
        te && (te.checked = true), v2 = u6[Number(P2.dataset.i)];
      }), h.addEventListener("change", (H3) => {
        H3.target.name === "whp-pk-r" && (v2 = u6[Number(H3.target.value)]);
      });
      let Wa = 100;
      o5.querySelector("#whp-pk-q").addEventListener("input", () => {
        i6(L, Z2, Wa);
      });
      let Dt = () => {
        s6(L), Z2();
      };
      o5.querySelector("#whp-pk-go").onclick = Dt, o5.querySelector("#whp-pk-q").onkeydown = (H3) => {
        H3.key === "Enter" && (H3.preventDefault(), Dt());
      }, d4.querySelector("#whp-pk-ok").onclick = () => {
        if (!v2) {
          n("เลือกรายการก่อน", "err");
          return;
        }
        X2(i7, v2), i2(), n("เติมข้อมูลจาก CODE " + (v2.code || "") + " แล้ว", "ok");
      };
      let qt = o5.querySelector("#whp-pk-new");
      qt && (qt.onclick = () => {
        let H3 = o5.querySelector("#whp-pk-form");
        H3.hidden = false, H3.innerHTML = `
        <h4 class="whp-pk-ft">เพิ่มข้อมูลใหม่ใน Master</h4>
        <div class="whp-r3">
          <div class="fld"><label>CODE <span class="req">*</span></label>
            <input class="inp w100" id="whp-nc" placeholder="เช่น NJ"></div>
          <div class="fld whp-sp2"><label>ชื่อ <span class="req">*</span></label>
            <input class="inp w100" id="whp-nn"></div>
        </div>
        <div class="whp-r3">
          <div class="fld"><label>สาขา</label>
            <input class="inp w100" id="whp-nb" inputmode="numeric" maxlength="5"
              pattern="[0-9]{5}" placeholder="00000"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
            <input class="inp w100" id="whp-nt" inputmode="numeric" maxlength="13"></div>
          <div class="fld"><label>เลขประจำตัวบัตรประชาชน</label>
            <input class="inp w100" id="whp-ni" inputmode="numeric" maxlength="13"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label><input class="inp w100" id="whp-na"></div>
        <div class="whp-pk-fb">
          <button type="button" class="btn btn-p btn-sm" id="whp-nsave">บันทึก</button>
          <button type="button" class="btn btn-o btn-sm" id="whp-ncancel">ยกเลิก</button>
        </div>`, [["whp-nb", 5], ["whp-nt", 13], ["whp-ni", 13]].forEach(([P2, te]) => {
          let F2 = H3.querySelector("#" + P2);
          F2.oninput = (J2) => {
            let me = String(J2.target.value).replace(/\D/g, "").slice(0, te);
            me !== J2.target.value && (J2.target.value = me);
          };
        }), H3.querySelector("#whp-ncancel").onclick = () => {
          H3.hidden = true, H3.innerHTML = "";
        }, H3.querySelector("#whp-nsave").onclick = async () => {
          let P2 = (j4) => (H3.querySelector("#" + j4).value || "").trim();
          if (s4(H3), !P2("whp-nc")) {
            n("กรอก CODE ก่อน", "err");
            return;
          }
          if (!P2("whp-nn")) {
            n("กรอกชื่อก่อน", "err");
            return;
          }
          for (let [j4, ie] of [["whp-nt", "เลขประจำตัวผู้เสียภาษีอากร"], ["whp-ni", "เลขประจำตัวบัตรประชาชน"]]) {
            let $e = P2(j4);
            if ($e && !_e($e)) {
              n(ie + " ต้องเป็นตัวเลข 13 หลัก", "err");
              return;
            }
          }
          if (P2("whp-nb") && !tt2(P2("whp-nb"))) {
            o2(H3.querySelector("#whp-nb"), Ne), n(Ne, "err");
            return;
          }
          let te = fa(P2("whp-nc")), F2 = et2(P2("whp-nt")), J2 = et2(P2("whp-ni")), me = ba(P2("whp-nb"));
          try {
            let j4 = (await Ae({ size: 200 }) || {}).rows || [], ie = j4.find((ce) => fa(ce.code) === te), $e = F2 ? j4.find((ce) => et2(ce.tax_id) === F2 && ba(ce.branch) === me) : null, Ie = J2 ? j4.find((ce) => et2(ce.citizen_id) === J2) : null, Oe = ie ? ["whp-nc", Fe.NJACC_PARTY_CODE_DUPLICATE[1], ie] : $e ? ["whp-nt", Fe.NJACC_PARTY_TAXBRANCH_DUPLICATE[1], $e] : Ie ? ["whp-ni", Fe.NJACC_PARTY_CITIZEN_DUPLICATE[1], Ie] : null;
            if (Oe) {
              let ce = Oe[1] + Ta(Oe[2].code, Oe[2].name);
              o2(H3.querySelector("#" + Oe[0]), ce), n(ce, "err");
              return;
            }
          } catch {
          }
          try {
            let j4 = await l6("wht-party-upsert", () => dt2({ code: P2("whp-nc"), name: P2("whp-nn"), branch: P2("whp-nb"), tax_id: P2("whp-nt"), citizen_id: P2("whp-ni"), address: P2("whp-na") }));
            n("บันทึก Master แล้ว — เลือกใช้ได้ทันที", "ok"), H3.hidden = true, H3.innerHTML = "";
            try {
              await R3(true);
            } catch {
            }
            o5.querySelector("#whp-pk-q").value = j4 && j4.code ? j4.code : P2("whp-nc"), await Z2();
          } catch (j4) {
            let ie = ya(j4);
            if (ie) {
              let Ie = H3.querySelector("#" + ie.field);
              Ie && o2(Ie, ie.msg), n(ie.msg, "err");
              return;
            }
            String(j4 && j4.message || "").includes("NJACC_FORBIDDEN") ? n("ไม่มีสิทธิ์แก้ Master (ต้องเป็น ADMIN)", "err") : t2(j4, "บันทึก Master ไม่สำเร็จ");
          }
        };
      }), Z2();
    }
    async function $t(i7, o5) {
      let d4 = ee[i7], h = (R4) => (e.querySelector("#" + R4) || {}).value || "", u6 = h(d4.code).trim();
      if (!u6) {
        n("กรุณาระบุ CODE ก่อนบันทึกข้อมูล", "err");
        return;
      }
      let v2 = { id: null, code: u6, name: h(d4.ids.name), branch: h(d4.ids.branch), tax_id: h(d4.ids.tax), citizen_id: h(d4.ids.cid), address: h(d4.ids.addr) };
      if (o5 === "edit") try {
        let R4 = await Ae({ code: u6 }), T4 = (R4 && R4.rows || [])[0];
        if (!T4 || !T4.id) {
          n('ไม่พบ CODE "' + u6 + '" ในรายชื่อ', "err");
          return;
        }
        v2 = { id: T4.id, code: T4.code || "", name: T4.name || "", branch: T4.branch || "", tax_id: T4.tax_id || "", citizen_id: T4.citizen_id || "", address: T4.address || "" };
      } catch (R4) {
        t2(R4, "โหลดข้อมูลรายชื่อไม่สำเร็จ");
        return;
      }
      let N2 = document.createElement("div");
      N2.className = "whp-pk", N2.innerHTML = `
      <h4 class="whp-pk-ft">${o5 === "edit" ? "แก้ไขข้อมูลในรายชื่อ" : "บันทึกเข้ารายชื่อ"} —
        ${i7 === "payer" ? "ผู้มีหน้าที่หักภาษี ณ ที่จ่าย" : "ผู้ถูกหักภาษี ณ ที่จ่าย"}</h4>
      <div class="whp-r3">
        <div class="fld"><label>CODE <span class="req">*</span></label>
          <input class="inp w100" id="whm-c" value="${c2(v2.code)}" placeholder="เช่น NJ"></div>
        <div class="fld whp-sp2"><label>ชื่อ <span class="req">*</span></label>
          <input class="inp w100" id="whm-n" value="${c2(v2.name)}"></div>
      </div>
      <div class="whp-r3">
        <div class="fld"><label>สาขา</label>
          <input class="inp w100" id="whm-b" inputmode="numeric" maxlength="5"
            pattern="[0-9]{5}" value="${c2(v2.branch)}" placeholder="00000"></div>
        <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
          <input class="inp w100" id="whm-t" inputmode="numeric" maxlength="13"
            value="${c2(v2.tax_id)}"></div>
        <div class="fld"><label>เลขประจำตัวบัตรประชาชน</label>
          <input class="inp w100" id="whm-i" inputmode="numeric" maxlength="13"
            value="${c2(v2.citizen_id)}"></div>
      </div>
      <div class="fld"><label>ที่อยู่</label>
        <input class="inp w100" id="whm-a" value="${c2(v2.address)}"></div>`;
      let A = document.createElement("div");
      A.innerHTML = `<div class="mf-right">
        <button class="btn btn-p" id="whm-save">${o5 === "edit" ? "💾 อัปเดตข้อมูล" : "💾 บันทึกเข้ารายชื่อ"}</button>
        <button class="btn btn-o" data-close>ยกเลิก</button></div>`, f2({ title: o5 === "edit" ? "แก้ไขข้อมูลรายชื่อ" : "บันทึกเข้ารายชื่อ", body: N2, footer: A, large: true }), [["whm-b", 5], ["whm-t", 13], ["whm-i", 13]].forEach(([R4, T4]) => {
        let $2 = N2.querySelector("#" + R4);
        $2.oninput = (D2) => {
          let S3 = String(D2.target.value).replace(/\D/g, "").slice(0, T4);
          S3 !== D2.target.value && (D2.target.value = S3);
        };
      }), A.querySelector("#whm-save").onclick = async (R4) => {
        let T4 = ($2) => (N2.querySelector("#" + $2).value || "").trim();
        if (s4(N2), !T4("whm-c")) {
          n("กรุณาระบุ CODE ก่อนบันทึกข้อมูล", "err");
          return;
        }
        if (!T4("whm-n")) {
          n("กรอกชื่อก่อน", "err");
          return;
        }
        for (let [$2, D2] of [["whm-t", "เลขประจำตัวผู้เสียภาษีอากร"], ["whm-i", "เลขประจำตัวบัตรประชาชน"]]) {
          let S3 = T4($2);
          if (S3 && !_e(S3)) {
            n(D2 + " ต้องเป็นตัวเลข 13 หลัก", "err");
            return;
          }
        }
        if (T4("whm-b") && !tt2(T4("whm-b"))) {
          o2(N2.querySelector("#whm-b"), Ne), n(Ne, "err");
          return;
        }
        a4(R4.target, true);
        try {
          let $2 = { code: T4("whm-c"), name: T4("whm-n"), branch: T4("whm-b"), tax_id: T4("whm-t"), citizen_id: T4("whm-i"), address: T4("whm-a") };
          o5 === "edit" && v2.id && ($2.id = v2.id);
          let D2 = await l6("wht-master-" + i7 + "-" + (v2.id || "new"), () => dt2($2));
          i2();
          try {
            await R3(true);
          } catch {
          }
          D2 ? X2(i7, D2) : se(i7), n((o5 === "edit" ? "อัปเดตข้อมูล " : "บันทึก ") + T4("whm-c") + (o5 === "edit" ? " แล้ว" : " เข้ารายชื่อแล้ว"), "ok");
        } catch ($2) {
          let D2 = ya($2);
          if (D2) {
            let S3 = { "whp-nc": "whm-c", "whp-nn": "whm-n", "whp-nb": "whm-b", "whp-nt": "whm-t", "whp-ni": "whm-i", "whp-na": "whm-a" }, L = N2.querySelector("#" + (S3[D2.field] || "whm-c"));
            L && o2(L, D2.msg), n(D2.msg, "err");
          } else String($2 && $2.message || "").includes("NJACC_FORBIDDEN") ? n("ไม่มีสิทธิ์แก้รายชื่อ (ต้องเป็น ADMIN)", "err") : t2($2, "บันทึกรายชื่อไม่สำเร็จ");
          a4(R4.target, false);
        }
      };
    }
    ["payer", "payee"].forEach((i7) => {
      let o5 = e.querySelector("#wh-" + i7 + "-mnew"), d4 = e.querySelector("#wh-" + i7 + "-medit");
      o5 && (o5.onclick = () => $t(i7, "new")), d4 && (d4.onclick = () => $t(i7, "edit"));
      let h = e.querySelector("#" + ee[i7].code);
      h && h.addEventListener("input", () => qe(i7)), se(i7);
    });
    let Oa = 2, La = 250;
    function Pa(i7) {
      let o5 = ee[i7], d4 = e.querySelector("#" + o5.ids.name);
      if (!d4 || d4.dataset.acOn === "1") return;
      let h = d4.closest(".fld");
      if (!h) return;
      d4.dataset.acOn = "1", d4.setAttribute("autocomplete", "off"), h.classList.add("whp-ac-host");
      let u6 = document.createElement("div");
      u6.className = "whp-ac", u6.hidden = true, h.appendChild(u6);
      let v2 = "wht-ac-" + i7, N2 = [], A = -1, R4 = () => {
        u6.hidden = true, u6.innerHTML = "", N2 = [], A = -1;
      }, T4 = () => {
        [...u6.children].forEach((L, Z2) => L.classList.toggle("on", Z2 === A));
        let S3 = A >= 0 ? u6.children[A] : null;
        S3 && typeof S3.scrollIntoView == "function" && S3.scrollIntoView({ block: "nearest" });
      }, $2 = () => {
        if (!N2.length) {
          R4();
          return;
        }
        u6.innerHTML = N2.map((S3, L) => `<div class="whp-ac-i" data-i="${L}">
          <div class="whp-ac-n">${c2(S3.name || "-")}</div>
          <div class="whp-ac-m">${c2(S3.code || "-")} · ${c2(S3.tax_id || "-")} · ${c2(S3.branch || "-")}</div>
        </div>`).join(""), A = -1, u6.hidden = false, T4();
      }, D2 = (S3) => {
        let L = N2[S3];
        L && (R4(), X2(i7, L), n("เติมข้อมูลจาก CODE " + (L.code || "-") + " แล้ว", "ok"));
      };
      d4.addEventListener("input", () => {
        let S3 = (d4.value || "").trim();
        if (S3.length < Oa) {
          R4();
          return;
        }
        i6(v2, async () => {
          let L = u5(v2);
          try {
            let Z2 = await Ae({ q: S3, size: 20 });
            if (!a5(v2, L)) return;
            N2 = Z2 && Z2.rows || [], $2();
          } catch {
            a5(v2, L) && R4();
          }
        }, La);
      }), u6.addEventListener("mousedown", (S3) => {
        let L = S3.target.closest(".whp-ac-i");
        L && (S3.preventDefault(), D2(Number(L.dataset.i)));
      }), u6.addEventListener("mousemove", (S3) => {
        let L = S3.target.closest(".whp-ac-i");
        L && (A = Number(L.dataset.i), T4());
      }), d4.addEventListener("keydown", (S3) => {
        u6.hidden || !N2.length || (S3.key === "ArrowDown" ? (S3.preventDefault(), A = (A + 1) % N2.length, T4()) : S3.key === "ArrowUp" ? (S3.preventDefault(), A = (A <= 0 ? N2.length : A) - 1, T4()) : S3.key === "Enter" ? (S3.preventDefault(), A >= 0 ? D2(A) : R4()) : S3.key === "Escape" && (S3.preventDefault(), R4()));
      }), d4.addEventListener("blur", () => R4());
    }
    Object.keys(ee).forEach((i7) => {
      let o5 = ee[i7], d4 = e.querySelector("#" + o5.code);
      d4 && (d4.onkeydown = (v2) => {
        v2.key === "Enter" && (v2.preventDefault(), at2(i7));
      }, d4.onblur = () => at2(i7));
      let h = e.querySelector("#" + o5.go);
      h && (h.onclick = () => at2(i7));
      let u6 = e.querySelector("#" + o5.pick);
      u6 && (u6.onclick = () => Ia(i7)), Pa(i7);
    });
    let St = e.querySelector("#wh-has-fund"), Tt = e.querySelector("#wh-fund-sec");
    St && (St.onchange = (i7) => {
      t3.has_fund = !!i7.target.checked, Tt && (Tt.hidden = !t3.has_fund);
    });
    let Ct = e.querySelector("#wh-has-agent"), kt = e.querySelector("#wh-agent-sec");
    Ct && (Ct.onchange = (i7) => {
      t3.has_agent = !!i7.target.checked, t3.has_agent && oe(), kt && (kt.hidden = !t3.has_agent);
    });
    let At = e.querySelector("#wh-frominv");
    At && (At.onclick = () => Rn(e)), [["wh-has-form", "wh-form-sec", "has_form"], ["wh-has-pm", "wh-pm-sec", "has_pm"]].forEach(([i7, o5, d4]) => {
      let h = e.querySelector("#" + i7), u6 = e.querySelector("#" + o5);
      h && (h.onchange = (v2) => {
        t3[d4] = !!v2.target.checked, u6 && (u6.hidden = !t3[d4]);
      });
    }), e.querySelector("#wh-form-rd").addEventListener("change", (i7) => {
      i7.target.name === "wh-form" && (t3.form_type = i7.target.value);
    }), e.querySelector("#wh-pm-rd").addEventListener("change", (i7) => {
      if (i7.target.name !== "wh-pm") return;
      t3.pay_method = i7.target.value;
      let o5 = e.querySelector("#wh-pm-other-wrap");
      o5 && (o5.hidden = t3.pay_method !== je);
    });
    function On() {
      [["wh-payer-name", "payer_name"], ["wh-payer-tax", "payer_tax_id"], ["wh-payer-branch", "payer_branch"], ["wh-payer-addr", "payer_address"]].forEach(([i7, o5]) => {
        let d4 = e.querySelector("#" + i7);
        d4 && (d4.value = t3[o5] || "");
      });
    }
    function Ln() {
      [["wh-payee-name", "payee_name"], ["wh-payee-tax", "payee_tax_id"], ["wh-payee-branch", "payee_branch"], ["wh-payee-addr", "payee_address"], ["wh-payee-code2", "payee_code"]].forEach(([i7, o5]) => {
        let d4 = e.querySelector("#" + i7);
        d4 && (d4.value = t3[o5] || "");
      });
    }
    e.querySelector("#wh-add").onclick = () => {
      t3.lines.push({ pay_date: t3.pay_date || "", income_type: "SERVICE", description: "", tax_base: 0, rate: xt.SERVICE, amount: 0, wht_income_category: Ze("SERVICE") }), nt2();
    }, w2.addEventListener("input", (i7) => {
      let o5 = Number(i7.target.dataset.i);
      if (!Number.isInteger(o5) || !t3.lines[o5]) return;
      let d4 = i7.target.dataset.k;
      if (d4 === "tax_base" || d4 === "rate") {
        t3.lines[o5][d4] = W2(i7.target.value), t3.lines[o5].amount_manual = false, t3.lines[o5].amount = u2(W2(t3.lines[o5].tax_base) * W2(t3.lines[o5].rate) / 100);
        let h = w2.querySelector(`[data-i="${o5}"][data-k="amount"]`);
        h && (h.value = t3.lines[o5].amount), Ve();
      } else d4 === "amount" ? (t3.lines[o5].amount = W2(i7.target.value), t3.lines[o5].amount_manual = true, Ve()) : d4 === "description" && (t3.lines[o5].description = i7.target.value);
    }), w2.addEventListener("change", (i7) => {
      let o5 = Number(i7.target.dataset.i);
      if (!Number.isInteger(o5) || !t3.lines[o5]) return;
      let d4 = i7.target.dataset.k;
      if ((d4 === "pay_date" || d4 === "income_type" || d4 === "wht_income_category") && (t3.lines[o5][d4] = i7.target.value), d4 === "pay_date" && o5 === 0) {
        let h = String(i7.target.value || "").trim();
        t3.pay_date = h, t3.document_date = h;
        let u6 = e.querySelector("#wh-pdate");
        u6 && (u6.value = h);
        let v2 = e.querySelector("#wh-ddate");
        v2 && (v2.value = h);
      }
      d4 === "income_type" && Ha(o5);
    }), w2.addEventListener("click", (i7) => {
      let o5 = i7.target.closest("[data-del-line]");
      if (o5) {
        if (t3.lines.length <= 1) {
          n("ต้องมีรายการอย่างน้อย 1 รายการ", "err");
          return;
        }
        t3.lines.splice(Number(o5.dataset.delLine), 1), nt2();
      }
    }), e.querySelector("#wh-save").onclick = (i7) => In(e, i7.target), e.querySelector("#wh-prev").onclick = p7;
    let Nt = e.querySelector("#wh-del");
    Nt && (Nt.onclick = async () => {
      if (!t3.whtId) return;
      let i7 = await x("ลบหนังสือรับรองหัก ณ ที่จ่าย (ลบได้เฉพาะใบที่ยังไม่ออกจริง)");
      if (i7) try {
        await l6("del-wht-" + t3.whtId, () => lt2(t3.whtId, i7)), n("ลบแล้ว", "ok"), xe(e);
      } catch (o5) {
        n(G(o5), "err");
      }
    });
    let Rt = e.querySelector("#wh-unpost");
    Rt && (Rt.onclick = async () => {
      if (!t3.whtId) return;
      let i7 = await x("UNPOST หนังสือรับรอง — กลับเป็นร่างเพื่อแก้ไข (เลขเดิมถูกเก็บไว้ · POST อีกครั้งจะใช้เลขเดิม)");
      if (i7) try {
        let o5 = await l6("unpost-wht-" + t3.whtId, () => pt2(t3.whtId, i7));
        n("UNPOST แล้ว — กลับเป็นร่าง เลขเดิม " + (o5 && o5.document_no || ""), "ok"), De(e, { whtId: t3.whtId });
      } catch (o5) {
        n(G(o5), "err");
      }
    }), _3 && (e.querySelectorAll(".whp-form input, .whp-form select, .whp-form textarea").forEach((i7) => {
      i7.disabled = true;
    }), ["wh-add", "wh-frominv"].forEach((i7) => {
      let o5 = e.querySelector("#" + i7);
      o5 && (o5.disabled = true);
    }), e.querySelectorAll("#wh-ltb button").forEach((i7) => {
      i7.disabled = true;
    })), nt2(), g2(e);
    function nt2() {
      w2.innerHTML = t3.lines.map((i7, o5) => `<tr class="whp-ln">
        
        <td class="center t-3">${o5 + 1}</td>
        <td><select class="sel w100" data-i="${o5}" data-k="wht_income_category"
              title="หมวดที่จะพิมพ์ลงแบบ 50 ทวิ">${pn(i7.wht_income_category || "")}</select></td>
        <td><input class="inp w100" type="date" data-i="${o5}" data-k="pay_date"
              value="${c2(i7.pay_date || "")}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${o5}" data-k="tax_base"
              value="${i7.tax_base}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${o5}" data-k="amount"
              value="${i7.amount}" title="แก้ไขได้ — ระบบจะไม่คำนวณทับ"></td>
        <td class="center"><button class="btn btn-danger btn-sm" data-del-line="${o5}"
              title="ลบรายการ">🗑</button></td>
      </tr>
      <tr class="whp-ln2">
        <td></td>
        <td colspan="5"><div class="whp-ln2-g">
          <label>ประเภทเงินได้ (ระบบ)
            <select class="sel" data-i="${o5}" data-k="income_type">${hn(i7.income_type)}</select></label>
          <label>อัตรา %
            <input class="inp r" type="number" step="0.01" min="0" max="100"
              data-i="${o5}" data-k="rate" value="${i7.rate}"${ma(i7) ? ` readonly title="อัตราคงที่ตามประเภทเงินได้ — เลือก 'อื่น ๆ' เพื่อกรอกเอง"` : ' title="กรอกอัตราเอง"'}></label>
          <label>รายละเอียด
            <input class="inp" data-i="${o5}" data-k="description"
              value="${c2(i7.description || "")}" placeholder="ถ้ามี"></label>
        </div></td>
      </tr>`).join(""), Ve();
    }
    function Ha(i7) {
      let o5 = t3.lines[i7];
      if (!o5) return;
      let d4 = Et(o5.income_type);
      o5.rate = d4 === void 0 ? 0 : d4, o5.amount_manual || (o5.amount = u2(W2(o5.tax_base) * W2(o5.rate) / 100));
      let h = w2.querySelector(`[data-i="${i7}"][data-k="rate"]`);
      h && (h.value = o5.rate, ma(o5) ? (h.setAttribute("readonly", ""), h.title = "อัตราคงที่ตามประเภทเงินได้ — เลือก 'อื่น ๆ' เพื่อกรอกเอง") : (h.removeAttribute("readonly"), h.title = "กรอกอัตราเอง"));
      let u6 = w2.querySelector(`[data-i="${i7}"][data-k="amount"]`);
      u6 && (u6.value = o5.amount), Ve();
    }
    function Ve() {
      let i7 = 0, o5 = 0;
      for (let h of t3.lines) i7 = u2(i7 + W2(h.tax_base)), o5 = u2(o5 + W2(h.amount));
      let d4 = (h, u6) => {
        let v2 = e.querySelector("#" + h);
        v2 && ("value" in v2 ? v2.value = u6 : v2.textContent = u6);
      };
      d4("wh-t-base", g(i7)), d4("wh-t-tax", g(o5)), d4("wh-t-words", o5 > 0 ? f3(o5) : "");
    }
  }
  var E2 = (e) => (e || "").trim() || null;
  var _e = (e) => /^[0-9]{13}$/.test(String(e ?? "").replace(/[\s-]/g, ""));
  var tt2 = (e) => /^[0-9]{5}$/.test(String(e ?? "").trim());
  var Ne = "กรุณาระบุสาขาเป็นตัวเลข 5 หลัก เช่น 00000";
  function qn(e) {
    if (!e) return "ไม่พบข้อมูลเอกสาร";
    let n3 = e.lines || [];
    return E2(e.certificate_no) ? e.document_date ? e.pay_date ? E2(e.payer_name) ? E2(e.payer_tax_id) ? _e(e.payer_tax_id) ? E2(e.payer_branch) && !tt2(e.payer_branch) ? "สาขาของผู้มีหน้าที่หักภาษี — " + Ne : E2(e.payee_name) ? E2(e.payee_tax_id) ? _e(e.payee_tax_id) ? E2(e.payer_citizen_id) && !_e(e.payer_citizen_id) ? "เลขประจำตัวบัตรประชาชนของผู้มีหน้าที่หักภาษี (ต้องเป็นตัวเลข 13 หลัก)" : E2(e.payee_citizen_id) && !_e(e.payee_citizen_id) ? "เลขประจำตัวบัตรประชาชนของผู้ถูกหักภาษี (ต้องเป็นตัวเลข 13 หลัก)" : E2(e.payee_branch) && !tt2(e.payee_branch) ? "สาขาของผู้ถูกหักภาษี — " + Ne : e.has_agent && E2(e.agent_tax_id) && !_e(e.agent_tax_id) ? "เลขประจำตัวผู้เสียภาษีของผู้กระทำการแทน (ต้องเป็นตัวเลข 13 หลัก)" : n3.length ? n3.some((s7) => !String(s7.income_type || "").trim()) ? "ประเภทเงินได้" : n3.some((s7) => !String(s7.wht_income_category || "").trim()) ? "หมวด 50 ทวิ (เลือกให้ครบทุกรายการ)" : n3.some((s7) => !s7.pay_date) ? "วันที่จ่ายเงินจริงในทุกรายการ" : n3.some((s7) => !(Number(s7.tax_base) > 0)) ? "จำนวนเงินที่จ่าย (ต้องมากกว่า 0 ทุกรายการ)" : n3.some((s7) => W2(s7.amount) > W2(s7.tax_base)) ? "จำนวนเงินภาษี (มากกว่าจำนวนเงินที่จ่าย)" : u2(n3.reduce((s7, c4) => s7 + W2(c4.amount), 0)) > 0 ? E2(e.form_type) ? E2(e.pay_method) ? e.pay_method === je && !E2(e.pay_method_other) ? 'ข้อความของวิธีการจ่ายภาษี "อื่น ๆ"' : null : "วิธีการจ่ายภาษี" : "แบบที่นำส่ง" : "จำนวนเงินภาษี (ทุกรายการเป็น 0)" : "รายการเงินได้อย่างน้อย 1 รายการ" : "เลขประจำตัวผู้เสียภาษีของผู้ถูกหักภาษี (ต้องเป็นตัวเลข 13 หลัก)" : "เลขประจำตัวผู้เสียภาษีของผู้ถูกหักภาษี" : "ชื่อผู้ถูกหักภาษี" : "เลขประจำตัวผู้เสียภาษีของผู้มีหน้าที่หักภาษี (ต้องเป็นตัวเลข 13 หลัก)" : "เลขประจำตัวผู้เสียภาษีของผู้มีหน้าที่หักภาษี" : "ชื่อผู้มีหน้าที่หักภาษี" : "วันที่จ่าย" : "วันที่ออกเอกสาร" : "เลขที่หนังสือรับรอง";
  }
  async function In(e, n3) {
    if (!t3) return;
    if (t3.direction !== ye && !t3.customer_id) {
      n("เลือกผู้หักภาษี / ลูกค้าผู้จ่ายเงินก่อน", "err");
      return;
    }
    if (!t3.lines.length) {
      n("ต้องมีรายการอย่างน้อย 1 รายการ", "err");
      return;
    }
    for (let [c4, a6] of [["payer_citizen_id", "ผู้มีหน้าที่หักภาษี"], ["payee_citizen_id", "ผู้ถูกหักภาษี"]]) {
      let l7 = (t3[c4] || "").trim();
      if (l7 && !_e(l7)) {
        n("เลขประจำตัวบัตรประชาชนของ" + a6 + " ต้องเป็นตัวเลข 13 หลัก", "err");
        return;
      }
    }
    for (let c4 of t3.lines) {
      if (!(c4.tax_base > 0)) {
        n("จำนวนเงินที่จ่ายต้องมากกว่า 0 ทุกรายการ", "err");
        return;
      }
      if (c4.rate < 0 || c4.rate > 100) {
        n("อัตราภาษีต้องอยู่ระหว่าง 0–100", "err");
        return;
      }
      if (W2(c4.amount) < 0) {
        n("จำนวนเงินภาษีต้องไม่ติดลบ", "err");
        return;
      }
      if (W2(c4.amount) > W2(c4.tax_base)) {
        n("จำนวนเงินภาษีต้องไม่มากกว่าจำนวนเงินที่จ่าย", "err");
        return;
      }
    }
    if (!(t3.reference_no || "").trim()) {
      let c4 = qn(t3);
      if (c4) {
        n("ยังกรอกไม่ครบ — " + c4 + " (ต้องครบก่อนระบบจะออกเลขให้)", "err");
        return;
      }
    }
    {
      let c4 = String(t3.lines[0] && t3.lines[0].pay_date || "").trim();
      if (c4) {
        t3.pay_date = c4, t3.document_date = c4;
        let a6 = e && e.querySelector("#wh-pdate");
        a6 && (a6.value = c4);
        let l7 = e && e.querySelector("#wh-ddate");
        l7 && (l7.value = c4);
      }
    }
    let s7 = { wht_id: t3.whtId || null, direction: t3.direction || ye, customer_id: t3.customer_id, certificate_no: (t3.certificate_no || "").trim() || null, invoice_id: t3.invoice_id || null, document_date: t3.document_date || null, pay_date: t3.pay_date || null, wht_type: t3.lines[0].income_type, reference_no: (t3.reference_no || "").trim() || null, note: (t3.note || "").trim() || null, book_no: E2(t3.book_no), ref_date: t3.ref_date || null, job_no: E2(t3.job_no), invoice_no_text: E2(t3.invoice_no_text), payee_code: E2(t3.payee_code), payment_by: E2(t3.payment_by), has_fund: !!t3.has_fund, gpf_amount: t3.has_fund ? E2(t3.gpf_amount) : null, social_security_amount: t3.has_fund ? E2(t3.social_security_amount) : null, provident_fund_amount: t3.has_fund ? E2(t3.provident_fund_amount) : null, doc_code: E2(t3.doc_code), payer_code: E2(t3.payer_code), payer_citizen_id: E2(t3.payer_citizen_id), payee_citizen_id: E2(t3.payee_citizen_id), payer_name: E2(t3.payer_name), payer_tax_id: E2(t3.payer_tax_id), payer_branch: E2(t3.payer_branch), payer_address: E2(t3.payer_address), wht_mode: t3.wht_mode || null, has_acting_agent: !!t3.has_agent, agent_name: E2(t3.agent_name), agent_tax_id: E2(t3.agent_tax_id), agent_branch: E2(t3.agent_branch), agent_address: E2(t3.agent_address), payee_customer_id: t3.payee_customer_id || null, payee_name: E2(t3.payee_name), payee_tax_id: E2(t3.payee_tax_id), payee_branch: E2(t3.payee_branch), payee_address: E2(t3.payee_address), form_type: E2(t3.form_type), form_seq: E2(t3.form_seq), pay_method: E2(t3.pay_method), pay_method_other: t3.pay_method === je ? E2(t3.pay_method_other) : null, signer_name: E2(t3.signer_name), signer_position: E2(t3.signer_position), items: t3.lines.map((c4) => ({ pay_date: c4.pay_date || null, income_type: c4.income_type, description: (c4.description || "").trim() || null, tax_base: u2(c4.tax_base), rate: u2(c4.rate), wht_income_category: E2(c4.wht_income_category), amount: u2(W2(c4.amount)) })) };
    n3 && (n3.disabled = true);
    try {
      let c4 = await l6("save-wht", () => Qt(s7));
      if (c4 && c4.id) {
        t3.whtId = c4.id, typeof t3.__resetDirty == "function" && t3.__resetDirty();
        let a6 = e.querySelector("#wh-prev");
        if (a6 && (a6.disabled = false), c4.reference_no != null) {
          t3.reference_no = c4.reference_no;
          let l7 = e.querySelector("#wh-ref");
          l7 && (l7.value = c4.reference_no);
        }
        if (c4.ref_date != null) {
          t3.ref_date = String(c4.ref_date).slice(0, 10);
          let l7 = e.querySelector("#wh-refdate");
          l7 && (l7.value = t3.ref_date);
        }
        if (c4.reference_no_issued) {
          t3.has_ref = true;
          let l7 = e.querySelector("#wh-refbox-chk");
          l7 && (l7.checked = true);
          let b2 = e.querySelector("#wh-refbox");
          b2 && (b2.hidden = false);
        }
        n("บันทึกแล้ว — ภาษีหักรวม " + g(c4.amount) + (c4.reference_no ? " · Reference No. " + c4.reference_no : ""), "ok"), xe(e);
      }
    } catch (c4) {
      n(G(c4), "err");
    } finally {
      n3 && (n3.disabled = false);
    }
  }

  // boot.js
  var T3 = window.parent && window.parent !== window ? window.parent.TNJ : null;
  var MAP = {
    njacc_list_wht: "tnj_wht_list",
    njacc_list_wht_f: "tnj_wht_list",
    njacc_list_wht_f2: "tnj_wht_list",
    njacc_wht_export_page: "tnj_wht_export_page",
    njacc_wht_view: "tnj_wht_view",
    njacc_save_wht_draft: "tnj_wht_save_draft",
    njacc_post_wht: "tnj_wht_post",
    njacc_unpost_wht: "tnj_wht_unpost",
    njacc_void_wht: "tnj_wht_void",
    njacc_delete_wht_draft: "tnj_wht_delete_draft",
    njacc_wht_code_list: "tnj_wht_code_list",
    njacc_wht_party_search: "tnj_wht_party_search",
    njacc_wht_party_upsert: "tnj_wht_party_upsert",
    njacc_wht_invoice_options: "tnj_wht_invoice_options",
    njacc_masters: "tnj_wht_masters",
    njacc_column_layouts_get: "tnj_wht_column_layouts_get",
    njacc_column_layout_save: "tnj_wht_column_layout_save"
  };
  window.__TNJ_WHT_RPC = async (fn2, args) => {
    const t4 = MAP[fn2];
    if (!t4 || !T3) {
      const x3 = new Error("NJACC_FORBIDDEN");
      throw x3;
    }
    try {
      return await T3.auth(t4, args || {}, { silent: true });
    } catch (e) {
      const p7 = T3.parseErr(e);
      if (p7.code === "TNJ_SESSION_INVALID" || p7.code === "TNJ_MAINTENANCE" || p7.code === "TNJ_VERSION_MISMATCH") T3.err(e);
      if (p7.code) {
        const x3 = new Error(/PGRST202|Could not find the function/.test(String(e && e.message)) ? "ต้องติดตั้ง SQL RUN-32 ก่อนใช้งาน" : p7.text);
        x3.code = p7.code;
        x3.__tnj = true;
        throw x3;
      }
      if (/PGRST202|Could not find the function/.test(String(e && e.message))) {
        const x3 = new Error("ต้องติดตั้ง SQL RUN-32 ก่อนใช้งาน 📄 ใบหัก ณ ที่จ่าย");
        x3.__tnj = true;
        throw x3;
      }
      throw e;
    }
  };
  var role = T3 && T3.session ? String(T3.session.role || "") : "";
  var host = document.getElementById("app-content");
  if (!T3 || !T3.session) host.innerHTML = '<div class="card card-pad empty">กรุณาเข้าสู่ระบบ TRANSPORT NJ</div>';
  else if (role !== "SUPER_ADMIN" && role !== "ADMIN") host.innerHTML = '<div class="card card-pad empty">เมนูนี้สำหรับ SUPER_ADMIN / ADMIN เท่านั้น</div>';
  else {
    l.profile = { role, full_name: T3.session.full_name || "", allowed_modules: ["REPORT"], can_delete: role === "SUPER_ADMIN", can_manage_columns: role === "SUPER_ADMIN" };
    l.route = { path: "withholding", params: {}, def: { title: "ใบหัก ณ ที่จ่าย" } };
    gs(host).then(() => {
      window.__TNJ_WHT_READY = 1;
    }).catch((e) => {
      console.warn("wht", e);
      host.innerHTML = '<div class="card card-pad empty">' + String(e && e.message || e).replace(/</g, "&lt;") + "</div>";
    });
  }
})();
