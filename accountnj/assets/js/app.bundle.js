(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // assets/js/core/config.js
  var APP_VERSION, APP_NAME, SUPABASE_URL, SUPABASE_KEY, PAGE_SIZES, DEFAULT_PAGE_SIZE, MAINT_MESSAGE;
  var init_config = __esm({
    "assets/js/core/config.js"() {
      APP_VERSION = "1.4.1";
      APP_NAME = "BILLING NJ";
      SUPABASE_URL = "https://sytgqjglcnsabcszbngg.supabase.co";
      SUPABASE_KEY = "sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp";
      PAGE_SIZES = [20, 50, 100];
      DEFAULT_PAGE_SIZE = 20;
      MAINT_MESSAGE = "\u0E23\u0E30\u0E1A\u0E1A\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E23\u0E1A 10 \u0E19\u0E32\u0E17\u0E35";
    }
  });

  // assets/js/core/supabase-client.js
  function sb() {
    if (!_sb) {
      if (!window.supabase) throw new Error("Supabase SDK \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E42\u0E2B\u0E25\u0E14");
      _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return _sb;
  }
  async function rpc(name, args = {}) {
    const { data, error } = await sb().rpc(name, args);
    if (error) throw normalizeErr(error);
    return data;
  }
  function normalizeErr(error) {
    const m = String(error.message || "");
    const map = {
      NJACC_NO_PROFILE: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 \u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E39\u0E01\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
      NJACC_FORBIDDEN: "\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49",
      NJACC_LOGIN_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E19\u0E35\u0E49",
      NJACC_JOB_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19",
      NJACC_JOB_ALREADY_INVOICED: "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27",
      NJACC_JOB_NO_CUSTOMER: "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
      NJACC_JOB_HAS_INVOICE: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E21\u0E35 INVOICE \u0E41\u0E25\u0E49\u0E27 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19",
      NJACC_INVOICE_HAS_PAYMENT: "Void \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 INVOICE \u0E19\u0E35\u0E49\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27 \u0E15\u0E49\u0E2D\u0E07 Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E01\u0E48\u0E2D\u0E19",
      NJACC_ALLOC_EXCEEDS_OUTSTANDING: "\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07 INVOICE",
      NJACC_ALLOCATION_SUM_MISMATCH: "\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E23\u0E27\u0E21\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E23\u0E27\u0E21",
      NJACC_REASON_REQUIRED: "\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25",
      NJACC_NO_ITEMS: "\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
      NJACC_INVOICE_NOT_OPEN: "INVOICE \u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E44\u0E14\u0E49",
      /* FINANCE > Receipt รับชำระเฉพาะงานบริการ · งานสำรองจ่ายมี Flow ของตัวเอง */
      NJACC_RECEIPT_SERVICE_ONLY: "\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 INVOICE \u0E07\u0E32\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 (SERVICE) \u2014 \u0E07\u0E32\u0E19\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (ADVANCE) \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E19\u0E39 FINANCE > Advance",
      /* ปิดงาน → ส่งเข้า ACCOUNTING (migration 025) */
      NJACC_CLOSE_BAD_STATUS: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 OPEN \u0E2B\u0E23\u0E37\u0E2D PROCESSING",
      NJACC_ACCOUNTING_HANDOFF_FAILED: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 ACCOUNTING \u0E22\u0E31\u0E07\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E07\u0E32\u0E19\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48 DOCUMENT \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48"
    };
    for (const k in map) if (m.includes(k)) {
      const e = new Error(map[k]);
      e.code = k;
      return e;
    }
    return error instanceof Error ? error : new Error(m || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14");
  }
  var _sb;
  var init_supabase_client = __esm({
    "assets/js/core/supabase-client.js"() {
      init_config();
      _sb = null;
    }
  });

  // assets/js/core/state.js
  function resetState() {
    AppState.profile = null;
    AppState.masters = null;
  }
  var AppState;
  var init_state = __esm({
    "assets/js/core/state.js"() {
      AppState = {
        profile: null,
        /* จาก njacc_my_profile */
        masters: null,
        /* customers/companies/service_codes/vat_rate */
        route: null
      };
    }
  });

  // assets/js/config/charge-groups.js
  function groupLabel(k) {
    return (COMPANY_GROUPS.find((g) => g.key === k) || {}).label || k;
  }
  function chargeLabel(k) {
    return (CHARGE_TYPES.find((c) => c.key === k) || {}).label || k;
  }
  var COMPANY_GROUPS, CHARGE_TYPES;
  var init_charge_groups = __esm({
    "assets/js/config/charge-groups.js"() {
      COMPANY_GROUPS = [
        { key: "NJ", label: "NJ", icon: "\u{1F7E6}" },
        { key: "DSV", label: "DSV", icon: "\u{1F7EA}" },
        { key: "MAERSK", label: "Maersk", icon: "\u{1F6A2}" },
        { key: "KUEHNE", label: "Kuehne", icon: "\u{1F4E6}" },
        { key: "RHENUS", label: "Rhenus", icon: "\u{1F310}" }
      ];
      CHARGE_TYPES = [
        { key: "SERVICE", label: "SERVICE CHARGE", icon: "\u{1F4BC}", accent: "service" },
        { key: "ADVANCE", label: "ADVANCE CHARGE", icon: "\u{1F4B3}", accent: "advance" }
      ];
    }
  });

  // assets/js/core/permissions.js
  function can(perm, charge = "*", group = "*") {
    const p = AppState.profile;
    if (!p) return false;
    if (p.role === "SUPER_ADMIN") return true;
    return (p.access || []).some((a) => (a.charge_type === "*" || a.charge_type === charge || charge === "*") && (a.company_group === "*" || a.company_group === group || group === "*") && a["can_" + perm] === true);
  }
  function isAdmin() {
    const p = AppState.profile;
    return !!p && (p.role === "SUPER_ADMIN" || p.role === "ADMIN");
  }
  var init_permissions = __esm({
    "assets/js/core/permissions.js"() {
      init_state();
    }
  });

  // assets/js/core/formatter.js
  function dmy(s) {
    if (!s) return "-";
    const d = /* @__PURE__ */ new Date(s + (String(s).length === 10 ? "T00:00:00" : ""));
    if (isNaN(d)) return "-";
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function remainingBadge(due, row = {}) {
    const invSt = row.invoice_status;
    const payStat = row.payment_status;
    if (invSt === "VOID") return '<span class="bdg bdg-void">VOID</span>';
    if (invSt === "ISSUED" && payStat === "PAID") return '<span class="bdg bdg-paid">\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27</span>';
    if (row.operational_status === "CANCELED") return '<span class="bdg bdg-canceled">CANCELED</span>';
    if (!due) {
      return invSt === "ISSUED" ? '<span class="bdg bdg-due-ok">\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 Due</span>' : '<span class="bdg bdg-due-ok">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>';
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const d = /* @__PURE__ */ new Date(due + "T00:00:00");
    const rem = Math.round((d - today) / 864e5);
    if (rem < 0) return '<span class="bdg bdg-due-over">\u0E40\u0E01\u0E34\u0E19 ' + Math.abs(rem) + " \u0E27\u0E31\u0E19</span>";
    if (rem === 0) return '<span class="bdg bdg-due-today">\u0E04\u0E23\u0E1A\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49</span>';
    if (rem <= 7) return '<span class="bdg bdg-due-warn">\u0E40\u0E2B\u0E25\u0E37\u0E2D ' + rem + " \u0E27\u0E31\u0E19</span>";
    return '<span class="bdg bdg-due-ok">\u0E40\u0E2B\u0E25\u0E37\u0E2D ' + rem + " \u0E27\u0E31\u0E19</span>";
  }
  function statusBadge(s) {
    const m = {
      OPEN: ["bdg-open", "OPEN"],
      PROCESSING: ["bdg-processing", "PROCESSING"],
      CLOSE: ["bdg-close", "CLOSE"],
      CANCELED: ["bdg-canceled", "CANCELED"]
    };
    const [c, t] = m[s] || ["bdg-due-ok", s || "-"];
    return `<span class="bdg ${c}">${t}</span>`;
  }
  function payBadge(s) {
    const m = {
      UNPAID: ["bdg-unpaid", "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30"],
      PARTIAL: ["bdg-partial", "\u0E0A\u0E33\u0E23\u0E30\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19"],
      PAID: ["bdg-paid", "\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A"],
      VOID: ["bdg-void", "VOID"],
      ISSUED: ["bdg-issued", "ISSUED"]
    };
    const [c, t] = m[s] || ["bdg-due-ok", s || "-"];
    return `<span class="bdg ${c}">${t}</span>`;
  }
  var NF, money, round2, ymd;
  var init_formatter = __esm({
    "assets/js/core/formatter.js"() {
      NF = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      money = (n) => n === null || n === void 0 || n === "" || isNaN(n) ? "-" : NF.format(Number(n));
      round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
      ymd = (d) => {
        const x = d instanceof Date ? d : new Date(d);
        return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
      };
    }
  });

  // assets/js/auth/login-api.js
  async function loginWithName(loginName, password) {
    let res;
    try {
      res = await fetch(SUPABASE_URL + "/functions/v1/njacc-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ login_name: loginName, password })
      });
    } catch (e) {
      throw new Error("\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E15\u0E31\u0E27\u0E15\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48");
    }
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok || !data || !data.access_token) {
      if (data && data.error === "MAINTENANCE") throw new Error(data.message || "\u0E23\u0E30\u0E1A\u0E1A\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E34\u0E14\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07");
      if (res.status === 401) throw new Error("\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07");
      if (res.status === 404) throw new Error("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 Edge Function njacc-login (\u0E14\u0E39\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E43\u0E19 README)");
      throw new Error("\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48");
    }
    const { error } = await sb().auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });
    if (error) throw new Error("\u0E2A\u0E23\u0E49\u0E32\u0E07 session \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48");
  }
  async function loadMyProfile() {
    return rpc("njacc_my_profile");
  }
  var init_login_api = __esm({
    "assets/js/auth/login-api.js"() {
      init_supabase_client();
      init_config();
    }
  });

  // assets/js/auth/session.js
  async function restoreSession() {
    const { data } = await sb().auth.getSession();
    if (!data || !data.session) return false;
    try {
      AppState.profile = await loadMyProfile();
      return true;
    } catch (e) {
      await sb().auth.signOut();
      resetState();
      return false;
    }
  }
  async function clearSession() {
    try {
      await sb().auth.signOut();
    } catch (e) {
    }
    resetState();
    try {
      sessionStorage.clear();
    } catch (e) {
    }
  }
  var init_session = __esm({
    "assets/js/auth/session.js"() {
      init_supabase_client();
      init_state();
      init_login_api();
    }
  });

  // assets/js/system/logout.js
  var logout_exports = {};
  __export(logout_exports, {
    doLogout: () => doLogout
  });
  async function doLogout() {
    await clearSession();
    location.hash = "";
    location.reload();
  }
  var init_logout = __esm({
    "assets/js/system/logout.js"() {
      init_session();
    }
  });

  // assets/js/components/toast.js
  function toast(msg, type = "") {
    let w = document.querySelector(".toast-wrap");
    if (!w) {
      w = document.createElement("div");
      w.className = "toast-wrap";
      document.body.appendChild(w);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    w.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }
  var init_toast = __esm({
    "assets/js/components/toast.js"() {
    }
  });

  // assets/js/core/error-handler.js
  function handleErr(e, fallback = "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14") {
    console.error("[BILLING NJ]", e);
    toast(e && e.message ? e.message : fallback, "err");
  }
  var init_error_handler = __esm({
    "assets/js/core/error-handler.js"() {
      init_toast();
    }
  });

  // assets/js/components/modal.js
  function openModal({ title, body, footer, large, fullscreen, wide }) {
    closeModal();
    const bk = document.createElement("div");
    bk.className = "modal-bk" + (fullscreen ? " modal-fs" : "") + (wide ? " modal-bk-w80" : "");
    bk.id = "nj-modal";
    const mCls = [
      "modal",
      fullscreen ? "" : large ? "modal-lg" : "",
      wide ? "modal-w80" : ""
    ].filter(Boolean).join(" ");
    bk.innerHTML = `<div class="${mCls}">
    <div class="modal-h"><h3>${esc(title)}</h3>
      <button class="btn-icon" data-close aria-label="\u0E1B\u0E34\u0E14">\u2715</button></div>
    <div class="modal-b"></div>
    ${footer ? '<div class="modal-f"></div>' : ""}</div>`;
    bk.querySelector(".modal-b").append(body instanceof Node ? body : Object.assign(document.createElement("div"), { innerHTML: body }));
    if (footer) bk.querySelector(".modal-f").append(footer);
    bk.addEventListener("click", (e) => {
      if (e.target === bk || e.target.closest("[data-close]")) closeModal();
    });
    document.body.appendChild(bk);
    return bk;
  }
  function closeModal() {
    document.getElementById("nj-modal")?.remove();
  }
  function confirmModal(title, msg, okLabel = "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19") {
    return new Promise((res) => {
      const f = document.createElement("div");
      f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="nj-cf-ok">${okLabel}</button>`;
      const m = openModal({ title, body: `<p>${msg}</p>`, footer: f });
      f.querySelector("#nj-cf-ok").onclick = () => {
        closeModal();
        res(true);
      };
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest("[data-close]")) res(false);
      });
    });
  }
  function reasonModal(title) {
    return new Promise((res) => {
      const b = document.createElement("div");
      b.innerHTML = `<div class="fld"><label>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 <span class="req">*</span></label>
      <textarea class="inp w100" id="nj-rs"></textarea></div>`;
      const f = document.createElement("div");
      f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-danger" id="nj-rs-ok">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19</button>`;
      const m = openModal({ title, body: b, footer: f });
      f.querySelector("#nj-rs-ok").onclick = () => {
        const v = b.querySelector("#nj-rs").value.trim();
        if (!v) {
          b.querySelector("#nj-rs").focus();
          return;
        }
        closeModal();
        res(v);
      };
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest("[data-close]")) res(null);
      });
    });
  }
  var init_modal = __esm({
    "assets/js/components/modal.js"() {
      init_formatter();
    }
  });

  // assets/js/charges/charge-api.js
  var payload, chargeBundle, chargeKpi, exportCharges, contactList, bulkSetField, bulkSetStatus, quickCloseLookup, importResolveMasters, importCreateMasters, importJobsBatch, uploadAplBatch, upload19Batch, uploadContactList, setJobStatus, documentCloseJob, updateNote, deleteJob, receiptPending;
  var init_charge_api = __esm({
    "assets/js/charges/charge-api.js"() {
      init_supabase_client();
      payload = ({
        charge,
        group,
        filters = {},
        sort,
        dir,
        page,
        size,
        withOptions,
        exportPage,
        exportSize,
        queue,
        scope
      }) => ({
        charge_type: charge,
        company_group: group,
        q: filters.q || null,
        status: filters.status || null,
        customer_id: filters.customer || null,
        cs: filters.cs || null,
        due: filters.due || null,
        from: filters.from || null,
        to: filters.to || null,
        /* queue กรองที่ server เสมอ (ข้อมูลระดับแสน-ล้าน record — pagination/count ต้องถูก)
           pending_invoice = คิวรอออก Invoice · active = กำลังดำเนินการ
           receipt_active  = SERVICE ที่ POST แล้วรอรับชำระ
           advance_active  = ADVANCE ที่ POST แล้วรอจ่าย/เคลียร์
           closed          = จบครบวงจร (ใช้คู่กับ scope='all' เพื่อเห็นทั้ง 2 ประเภท) */
        queue: queue || null,
        advance_status: filters.advance_status || null,
        payment_status: filters.payment_status || null,
        scope: scope || null,
        /* 'all' = ทุกงานในกลุ่มบริษัท (กรองสิทธิ์รายแถวที่ server) */
        sort,
        dir,
        page,
        size,
        with_options: !!withOptions,
        export_page: exportPage,
        export_size: exportSize
      });
      chargeBundle = (a) => rpc("njacc_charge_page_bundle", { p: payload(a) });
      chargeKpi = (a) => rpc("njacc_charge_kpi", { p: payload(a) });
      exportCharges = (a) => rpc("njacc_export_charges", { p: payload(a) });
      contactList = (charge, group) => rpc("njacc_contact_list", { p: { charge_type: charge, company_group: group } });
      bulkSetField = (charge, group, keys, field, value) => rpc("njacc_bulk_set_field", { p: { charge_type: charge, company_group: group, keys, field, value } });
      bulkSetStatus = (charge, group, keys, status) => rpc("njacc_bulk_set_status", { p: { charge_type: charge, company_group: group, keys, status } });
      quickCloseLookup = (charge, group, key) => rpc("njacc_quick_close_lookup", { p: { charge_type: charge, company_group: group, key } });
      importResolveMasters = (charge, group, customers, companies) => rpc("njacc_import_resolve_masters", { p: { charge_type: charge, company_group: group, customers, companies } });
      importCreateMasters = (customers, companies) => rpc("njacc_import_create_masters", { p: { customers, companies } });
      importJobsBatch = (charge, group, rows) => rpc("njacc_import_jobs_batch", { p: { charge_type: charge, company_group: group, rows } });
      uploadAplBatch = (charge, group, pairs) => rpc("njacc_upload_apl_batch", { p: { charge_type: charge, company_group: group, pairs } });
      upload19Batch = (charge, group, rows) => rpc("njacc_upload_19_batch", { p: { charge_type: charge, company_group: group, rows } });
      uploadContactList = (pairs) => rpc("njacc_upload_contact_list", { p: { pairs } });
      setJobStatus = (id, status, note) => rpc("njacc_set_job_status", { p_id: id, p_status: status, p_note: note ?? null });
      documentCloseJob = (id, note) => rpc("njacc_document_close_job", { p_id: id, p_note: note ?? null });
      updateNote = (id, note) => rpc("njacc_update_note", { p_id: id, p_note: note });
      deleteJob = (id, reason) => rpc("njacc_delete_job", { p_id: id, p_reason: reason });
      receiptPending = (a) => rpc("njacc_receipt_pending", { p: a });
    }
  });

  // assets/js/charges/charge-kpi.js
  function kpiHTML(k, charge, mode, perms = {}) {
    const n = (v) => (v ?? 0).toLocaleString("th-TH");
    if (mode === "document") return "";
    const job = ["Total Job", n(k?.total_job), "var(--blue-600)", ""];
    const over = [
      "Total Over Due",
      n(k?.total_overdue),
      "var(--red-600)",
      "\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35 INVOICE \u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E04\u0E49\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30 \xB7 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV \u0E40\u0E25\u0E22 Due = " + n(k?.job_overdue_no_invoice)
    ];
    const svc = ["Service Charge", money(k?.service_charge), "var(--acc-service)", ""];
    const adv = ["Advance Charge", money(k?.advance_charge), "var(--acc-advance)", ""];
    const vat = ["VAT", money(k?.vat), "var(--purple-600)", ""];
    const tot = [
      "Total Amount",
      money(k?.total_amount),
      "var(--green-600)",
      "Net Payable = Gross " + money(k?.gross_total) + " \u2212 WHT " + money(k?.wht_total)
    ];
    const items = [job, over, svc, adv, vat, tot];
    return '<div class="kpi-row">' + items.map(([lb, v, c, tip]) => `<div class="kpi" style="--kpi-c:${c}" title="${tip}"><div class="lb">${lb}</div><div class="v">${v}</div></div>`).join("") + "</div>";
  }
  var KPI_COUNT;
  var init_charge_kpi = __esm({
    "assets/js/charges/charge-kpi.js"() {
      init_formatter();
      KPI_COUNT = (charge, mode) => mode === "document" ? 0 : 6;
    }
  });

  // assets/js/charges/charge-toolbar.js
  function docBarButtonsHTML(perms) {
    return DOCUMENT_FBAR_BTNS.map((a) => MAIN.find((b) => b.a === a)).filter((b) => b && (!b.perm || perms[b.perm])).map(btn).join("");
  }
  function toolbarHTML(charge, group, perms, mode) {
    const isDoc = mode === "document";
    if (isDoc) return "";
    if (mode === "advance") {
      const ex = MAIN.find((b) => b.a === "export-excel");
      return `<div class="ch-tools">${!ex.perm || perms[ex.perm] ? btn(ex) : ""}</div>`;
    }
    if (mode === "closed") return "";
    const isAcc = mode === "accounting";
    const allow = (b) => (!b.perm || perms[b.perm]) && !(isDoc && DOCUMENT_HIDE_MAIN.includes(b.a)) && !(isAcc && ACCOUNTING_HIDE_MAIN.includes(b.a));
    const main = MAIN.filter(allow).map(btn).join("");
    const tools = isDoc ? "" : TOOLS.filter(allow).map(item).join("");
    const maersk = group === "MAERSK" ? MAERSK_ONLY.filter(allow).map(item).join("") : "";
    const quick = charge === "ADVANCE" && perms.edit && !isDoc && !isAcc ? `
    <div class="quick-close">
      <input class="inp" id="qc-key" placeholder="\u0E40\u0E25\u0E02 JOB / Invoice" autocomplete="off">
      <button class="btn btn-green btn-sm" data-tool="quick-close">\u2713 \u0E08\u0E1A\u0E07\u0E32\u0E19</button>
    </div>` : "";
    return `<div class="ch-tools">
    ${main}
    ${tools ? `<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="tools">\u{1F9F0} \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D \u25BE</button>
      <div class="tool-drop" data-drop="tools">${tools}</div>
    </div>` : ""}
    ${maersk ? `<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="maersk">\u{1F6A2} MAERSK \u25BE</button>
      <div class="tool-drop" data-drop="maersk">${maersk}</div>
    </div>` : ""}
    ${quick}
  </div>`;
  }
  function bindToolMenus(root) {
    root.addEventListener("click", (e) => {
      const m = e.target.closest("[data-menu]");
      root.querySelectorAll(".tool-drop.open").forEach((d) => {
        if (!m || d.dataset.drop !== m.dataset.menu) d.classList.remove("open");
      });
      if (m) {
        const d = root.querySelector(`[data-drop="${m.dataset.menu}"]`);
        if (d) d.classList.toggle("open");
      }
      if (e.target.closest(".tool-item")) {
        root.querySelectorAll(".tool-drop.open").forEach((d) => d.classList.remove("open"));
      }
    });
  }
  var MAIN, TOOLS, MAERSK_ONLY, btn, item, DOCUMENT_HIDE_MAIN, ACCOUNTING_HIDE_MAIN, DOCUMENT_FBAR_BTNS;
  var init_charge_toolbar = __esm({
    "assets/js/charges/charge-toolbar.js"() {
      MAIN = [
        { a: "new-job", t: "+ \u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19", perm: "create", primary: true },
        { a: "refresh", t: "\u21BB Refresh" },
        { a: "upload", t: "\u{1F4C1} Upload", perm: "edit" },
        { a: "export-excel", t: "\u{1F4D7} Export Excel", perm: "export" },
        { a: "paste-close", t: "\u{1F4CB} Paste \u0E08\u0E1A\u0E07\u0E32\u0E19", perm: "edit" },
        { a: "apl-upload", t: "\u2B06 APL Billing", perm: "edit" }
      ];
      TOOLS = [
        { a: "export-all", t: "\u{1F4E6} Export \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", perm: "export" },
        { a: "export-cust", t: "\u{1F464} Export Customer (ZIP)", perm: "export" },
        { a: "export-csv", t: "\u26A1 Export Fast CSV", perm: "export" },
        { a: "export-soa", t: "\u{1F4C4} Export SOA", perm: "export" },
        { a: "sum", t: "\u{1F9EE} \u0E04\u0E33\u0E19\u0E27\u0E13\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21" },
        { a: "upload-19", t: "\u2B06 Upload 1.9", perm: "edit" },
        { a: "close-upload", t: "\u2705 \u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19 (Upload)", perm: "edit" },
        { a: "bulk-case", t: "\u{1F5C2} Bulk Case", perm: "edit" },
        { a: "fill-etd", t: "\u{1F6A2} \u0E40\u0E15\u0E34\u0E21 ETD", perm: "edit" },
        { a: "contacts", t: "\u{1F4C7} Contact List" }
      ];
      MAERSK_ONLY = [
        { a: "export-case", t: "\u{1F4C4} Export Excel CASE", perm: "export" }
      ];
      btn = (b) => `<button class="btn ${b.primary ? "btn-p" : "btn-o"} btn-sm" data-tool="${b.a}">${b.t}</button>`;
      item = (b) => `<button class="tool-item" data-tool="${b.a}">${b.t}</button>`;
      DOCUMENT_HIDE_MAIN = ["upload", "paste-close", "apl-upload"];
      ACCOUNTING_HIDE_MAIN = ["new-job"];
      DOCUMENT_FBAR_BTNS = ["export-excel", "refresh", "new-job"];
    }
  });

  // assets/js/charges/charge-filter.js
  function filterBarHTML(f, opts = {}, mode, perms = {}) {
    const isDoc = mode === "document";
    const sel = (v, cur) => v === cur ? "selected" : "";
    const customers = opts.customers || [];
    const csNames = opts.cs_names || [];
    return `<div class="fbar fbar-grid${isDoc ? " fbar-doc" : ""}" id="ch-fbar">
    <input class="inp inp-search" data-f="q" value="${esc(f.q || "")}"
      placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32: Invoice / SRC / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / Job / B/L / Master / \u0E43\u0E1A\u0E02\u0E19 / Case / APL / \u0E15\u0E39\u0E49">
    <select class="sel" data-f="customer">
      <option value="">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      ${customers.map((c) => `<option value="${esc(c.id)}" ${sel(c.id, f.customer)}>${esc(c.name)}${c.active === false ? " (\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19)" : ""}</option>`).join("")}
    </select>
    ${isDoc ? "" : `<select class="sel" data-f="status">
      <option value="">Status \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      <option value="OPEN" ${sel("OPEN", f.status)}>OPEN</option>
      <option value="PROCESSING" ${sel("PROCESSING", f.status)}>PROCESSING</option>
      <option value="CLOSE" ${sel("CLOSE", f.status)}>CLOSE</option>
      <option value="CANCELED" ${sel("CANCELED", f.status)}>CANCELED</option>
    </select>
    <select class="sel" data-f="cs">
      <option value="">CS \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      ${csNames.map((c) => `<option value="${esc(c)}" ${sel(c, f.cs)}>${esc(c)}</option>`).join("")}
    </select>
    <select class="sel" data-f="due">
      <option value="">Due Date \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
      <option value="overdue" ${sel("overdue", f.due)}>\u0E40\u0E01\u0E34\u0E19 Due (\u0E22\u0E31\u0E07\u0E04\u0E49\u0E32\u0E07\u0E0A\u0E33\u0E23\u0E30)</option>
      <option value="today" ${sel("today", f.due)}>\u0E04\u0E23\u0E1A\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49</option>
      <option value="1-7" ${sel("1-7", f.due)}>\u0E43\u0E01\u0E25\u0E49\u0E04\u0E23\u0E1A 1\u20137 \u0E27\u0E31\u0E19</option>
      <option value="8-30" ${sel("8-30", f.due)}>\u0E04\u0E23\u0E1A\u0E43\u0E19 8\u201330 \u0E27\u0E31\u0E19</option>
      <option value="30+" ${sel("30+", f.due)}>\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 30 \u0E27\u0E31\u0E19</option>
    </select>`}
    <input class="inp" type="date" data-f="from" value="${esc(f.from || "")}" title="Date From">
    <input class="inp" type="date" data-f="to" value="${esc(f.to || "")}" title="Date To">
    <button class="btn btn-o btn-sm" id="ch-clear">\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07</button>
    ${isDoc ? `<div class="fbar-acts">${docBarButtonsHTML(perms)}</div>` : ""}
  </div>`;
  }
  var init_charge_filter = __esm({
    "assets/js/charges/charge-filter.js"() {
      init_formatter();
      init_charge_toolbar();
    }
  });

  // assets/js/charges/charge-table.js
  function headHTML(charge, mode) {
    if (mode === "document") return DOC_HEAD;
    if (mode === "accounting" && charge === "ADVANCE") return ADV_HEAD;
    return DOC_HEAD_CELLS + ACC_TAIL_COMMON + (charge === "SERVICE" ? MONEY_SVC : MONEY_ADV) + ACC_TAIL_END;
  }
  function statusCell(r) {
    let acc;
    if (!r.invoice_id) acc = '<span class="st-sub st-sub-none">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>';
    else if (r.invoice_status === "VOID") acc = '<span class="st-sub st-sub-void">VOID</span>';
    else acc = `<span class="st-sub st-sub-${esc((r.payment_status || "UNPAID").toLowerCase())}">${esc(r.payment_status || "UNPAID")}</span>`;
    return `<td class="col-status">${statusBadge(r.operational_status)}<div>${acc}</div></td>`;
  }
  function invoiceCell(r) {
    const main = r.invoice_no ? `<span class="t-b">${esc(r.invoice_no)}</span>` : '<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</span>';
    const src = r.source_invoice_no ? `<div class="inv-src" title="\u0E40\u0E25\u0E02 Invoice \u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21/\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07">SRC: ${esc(r.source_invoice_no)}</div>` : "";
    return `<td class="nowrap col-inv">${main}${src}</td>`;
  }
  function rowHTML(r, charge, perms, mode) {
    const txt6 = (v, w) => `<td class="ellip" style="max-width:${w}px" title="${esc(v || "")}">${esc(v || "-")}</td>`;
    const docCellArr = [
      `<td class="nowrap"><b>${esc(r.job_no || "-")}</b></td>`,
      /* เลขที่งาน */
      txt6(r.company_invoice, 130),
      /* บริษัท Invoice */
      txt6(r.customer_name, 180),
      /* ลูกค้า */
      txt6(r.customer_job_no, 120),
      /* Customer Job No. */
      txt6(r.customs_declaration_no, 130),
      /* เลขใบขนสินค้า */
      txt6(r.source_invoice_no, 120),
      /* Invoice ต้นทาง (Source) */
      txt6(r.house_bl_no, 130),
      /* House B/L No. */
      txt6(r.master_bl_no, 130),
      /* Master B/L No. */
      txt6(r.booking_no, 120),
      /* Booking No. */
      txt6(r.vessel_name, 140),
      /* ชื่อเรือ / Vessel */
      `<td class="r">${r.qty_container ?? "-"}</td>`,
      /* จำนวนตู้ */
      `<td class="nowrap">${dmy(r.etd)}</td>`,
      /* ETD */
      `<td class="nowrap">${dmy(r.eta)}</td>`,
      /* ETA */
      `<td class="nowrap">${dmy(r.delivery_date)}</td>`
      /* วันส่งมอบ */
    ];
    const docCells = docCellArr.join("");
    const docCellsList = docCellArr.filter((_, i) => !DOC_HIDDEN_IDX.includes(i)).join("");
    const actCell = (menu) => menu ? `<td class="col-act center"><div class="row-menu">
         <button class="btn-dots" data-rowmenu aria-label="\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23">\u22EE</button>
         <div class="row-drop">${actionsHTML(r, perms, mode)}</div>
       </div></td>` : `<td class="col-act"><div class="ch-act">${actionsHTML(r, perms, mode)}</div></td>`;
    if (mode === "document") return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}">${docCellsList + actCell(false)}</tr>`;
    const accCommon = statusCell(r) + `<td>${remainingBadge(r.due_date, r)}</td>
     <td class="nowrap">${dmy(r.date)}</td>` + invoiceCell(r) + `<td>${esc(r.case_no || "-")}</td>
     <td class="ellip" style="max-width:140px" title="${esc(r.contact || "")}">${esc(r.contact || "-")}</td>`;
    const moneySvc = `<td class="r">${money(r.service_amount)}</td>
      <td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} \u2212 WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`;
    const moneyAdv = `<td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} \u2212 WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`;
    const accEnd = `<td>${esc(r.i_billing_apl || "-")}</td>
      <td class="nowrap" title="${r.invoice_status === "ISSUED" ? "Due \u0E08\u0E32\u0E01 INVOICE" : "Due \u0E08\u0E32\u0E01\u0E07\u0E32\u0E19"}">${dmy(r.due_date)}</td>
      <td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${r.id}"
        title="${esc(r.note || "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49 NOTE")}">${esc(r.note || "\uFF0B NOTE")}</span></td>` + actCell(false);
    if (charge === "ADVANCE") {
      const advBody = `<td class="nowrap"><b>${esc(r.job_no || "-")}</b></td>` + txt6(r.customer_name, 200) + txt6(r.customer_job_no, 130) + `<td class="nowrap">${dmy(r.date)}</td>` + statusCell(r) + `<td class="r">${money(r.advance_amount)}</td><td class="r t-3" title="\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E07\u0E32\u0E19 \u2014 \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E17\u0E35\u0E48 INVOICE">${r.cost == null ? "-" : money(r.cost)}</td><td class="r t-3" title="\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E07\u0E32\u0E19 \u2014 \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E17\u0E35\u0E48 INVOICE">${r.charge == null ? "-" : money(r.charge)}</td><td class="r t-b" title="Gross ${money(r.gross_total)} \u2212 WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td><td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${r.id}"
        title="${esc(r.note || "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49 NOTE")}">${esc(r.note || "\uFF0B NOTE")}</span></td>` + actCell(false);
      return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}">${advBody}</tr>`;
    }
    const body = docCells + accCommon + (charge === "SERVICE" ? moneySvc : moneyAdv) + accEnd;
    return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}">${body}</tr>`;
  }
  function actionsHTML(r, perms, mode) {
    if (mode === "advance") {
      const st22 = r.advance_status || "PENDING";
      const nxt = st22 === "PENDING" ? "PAID" : st22 === "PAID" ? "SETTLED" : null;
      const lbl = { PAID: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27", SETTLED: "\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E04\u0E23\u0E1A (\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19)" };
      return (perms.invoice && nxt ? `<button class="btn btn-p btn-sm" data-act="settle" data-id="${r.id}" data-next="${nxt}">${lbl[nxt]}</button>` : '<span class="t-xs t-3">\u2014</span>') + /* พิมพ์ใบรับชำระเงินล่วงหน้า — เอกสารเฉพาะของ ADVANCE (finance/advance-doc.js)
         อ่านอย่างเดียว: ไม่เปลี่ยนสถานะ ไม่ออกเลขเอกสารใหม่
         คิว advance_active บังคับ invoice_status='POSTED' อยู่แล้ว → invoice_id มีเสมอ
         แต่ยังเช็ค r.invoice_id กันไว้ ไม่ render ปุ่มที่กดแล้วไม่มีข้อมูล */
      (r.invoice_id ? `<button class="btn btn-print btn-sm" data-act="apdoc" data-inv="${r.invoice_id}" data-adv="${esc(r.advance_status || "PENDING")}" title="\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32">\u{1F5A8} \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>` : "") + (r.invoice_id ? `<button class="btn btn-o btn-sm" data-act="viewinv" data-inv="${r.invoice_id}">\u0E14\u0E39 INVOICE</button>` : "");
    }
    if (mode === "closed") {
      return r.invoice_id ? `<button class="btn btn-o btn-sm" data-act="viewinv" data-inv="${r.invoice_id}">\u0E14\u0E39 INVOICE</button>` : `<button class="btn btn-o btn-sm" data-act="view" data-id="${r.id}">\u0E14\u0E39</button>`;
    }
    if (mode === "accounting") {
      if (r.invoice_id)
        return `<button class="btn btn-o btn-sm" data-act="viewinv" data-inv="${r.invoice_id}">\u0E14\u0E39 INVOICE</button>`;
      if (perms.invoice && r.operational_status !== "CANCELED")
        return `<button class="btn btn-p btn-sm" data-act="bill" data-id="${r.id}">\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</button>`;
      return '<span class="t-xs t-3">\u2014</span>';
    }
    const a = [`<button class="btn btn-o btn-sm" data-act="view" data-id="${r.id}"${r.invoice_id ? ' data-locked="1"' : ""}>\u{1F441} \u0E14\u0E39</button>`];
    const st6 = r.operational_status;
    if (perms.edit && (st6 === "OPEN" || st6 === "PROCESSING"))
      a.push(`<button class="btn btn-green btn-sm" data-act="close" data-id="${r.id}">\u2705 \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19</button>`);
    if (perms.delete && !r.invoice_id)
      a.push(`<button class="btn btn-danger-soft btn-sm" data-act="delete" data-id="${r.id}">\u{1F5D1} \u0E25\u0E1A</button>`);
    return a.join("");
  }
  var SORT_DATE, SORT_INV, DOC_LABELS, DOC_HIDDEN_IN_LIST, DOC_HIDDEN_IDX, thOf, DOC_HEAD_CELLS, DOC_HEAD_CELLS_LIST, ACT_HEAD, DOC_HEAD, ACC_TAIL_COMMON, MONEY_SVC, MONEY_ADV, ACC_TAIL_END, ADV_HEAD, COL_COUNT;
  var init_charge_table = __esm({
    "assets/js/charges/charge-table.js"() {
      init_formatter();
      SORT_DATE = '<th class="sortable" data-sort="date">Date \u21C5</th>';
      SORT_INV = '<th class="sortable" data-sort="invoice_no">Invoice No. \u21C5</th>';
      DOC_LABELS = [
        "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",
        // job_no
        "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice",
        // company_invoice
        "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
        // customer_name
        "Customer Job No.",
        // customer_job_no
        "\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",
        // customs_declaration_no
        "Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)",
        // source_invoice_no
        "House B/L No.",
        // house_bl_no
        "Master B/L No.",
        // master_bl_no
        "Booking No.",
        // booking_no
        "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel",
        // vessel_name
        "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49",
        // qty_container  (จัดชิดขวา)
        "ETD",
        // etd
        "ETA",
        // eta
        "\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A"
        // delivery_date
      ];
      DOC_HIDDEN_IN_LIST = ["Booking No.", "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel", "\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A"];
      DOC_HIDDEN_IDX = DOC_HIDDEN_IN_LIST.map((l) => DOC_LABELS.indexOf(l));
      thOf = (l) => `<th${l === "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49" ? ' class="r"' : ""}>${l}</th>`;
      DOC_HEAD_CELLS = DOC_LABELS.map(thOf).join("");
      DOC_HEAD_CELLS_LIST = DOC_LABELS.filter((l) => !DOC_HIDDEN_IN_LIST.includes(l)).map(thOf).join("");
      ACT_HEAD = '<th class="center col-act">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>';
      DOC_HEAD = DOC_HEAD_CELLS_LIST + ACT_HEAD;
      ACC_TAIL_COMMON = "<th>Status</th><th>Remaining</th>" + SORT_DATE + SORT_INV + "<th>Case</th><th>Contact</th>";
      MONEY_SVC = '<th class="r">Service charge</th><th class="r">Advance</th><th class="r">VAT 7%</th><th class="r">Amount</th><th class="r">WHT 3%</th><th class="r" title="Net Payable = Gross \u2212 WHT">Total Amount</th>';
      MONEY_ADV = '<th class="r">Advance</th><th class="r">VAT 7%</th><th class="r">Amount</th><th class="r">WHT 3%</th><th class="r" title="Net Payable = Gross \u2212 WHT">Total Amount</th>';
      ACC_TAIL_END = "<th>I BILLING APL</th><th>Due Date</th><th>NOTE</th>" + ACT_HEAD;
      ADV_HEAD = "<th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>Customer Job No.</th>" + SORT_DATE + '<th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="r">Advance</th><th class="r">Cost</th><th class="r">Charge</th><th class="r" title="Net Payable = Gross \u2212 WHT">Total</th><th>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</th>' + ACT_HEAD;
      COL_COUNT = (charge, mode) => (headHTML(charge, mode).match(/<th/g) || []).length;
    }
  });

  // assets/js/charges/charge-list.js
  function chargeState(charge, group, mode = "") {
    const k = charge + "/" + group + (mode ? "/" + mode : "");
    if (!states.has(k)) states.set(k, {
      filters: { q: "", status: "", customer: "", cs: "", due: "", from: "", to: "" },
      sort: "date",
      dir: "desc",
      page: 1,
      size: DEFAULT_PAGE_SIZE,
      options: null
      /* filter options จาก server (cache ต่อหน้า) */
    });
    return states.get(k);
  }
  var states;
  var init_charge_list = __esm({
    "assets/js/charges/charge-list.js"() {
      init_config();
      states = /* @__PURE__ */ new Map();
    }
  });

  // assets/js/core/request-manager.js
  function nextToken(key) {
    const t = (tokens.get(key) || 0) + 1;
    tokens.set(key, t);
    return t;
  }
  function isCurrent(key, t) {
    return tokens.get(key) === t;
  }
  function debounce(key, fn, ms = 300) {
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(fn, ms));
  }
  async function once(key, fn) {
    if (busy.has(key)) return null;
    busy.add(key);
    try {
      return await fn();
    } finally {
      busy.delete(key);
    }
  }
  function newRequestId() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
  }
  var tokens, timers, busy;
  var init_request_manager = __esm({
    "assets/js/core/request-manager.js"() {
      tokens = /* @__PURE__ */ new Map();
      timers = /* @__PURE__ */ new Map();
      busy = /* @__PURE__ */ new Set();
    }
  });

  // assets/js/charges/charge-actions.js
  async function handleAction(act, id, refresh) {
    try {
      if (act === "close") {
        if (!await confirmModal(
          "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 (\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 ACCOUNTING)",
          "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E48\u0E32\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E17\u0E33\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27<br><br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 <b>ACCOUNTING</b> \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E2D\u0E2D\u0E2D\u0E01 Invoice \u0E17\u0E31\u0E19\u0E17\u0E35<br>\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E43\u0E1A\u0E40\u0E14\u0E34\u0E21 \u0E40\u0E25\u0E02\u0E07\u0E32\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48",
          "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"
        )) return;
        const res = await once("close-" + id, () => documentCloseJob(id));
        const jobNo = res && res.job_no ? " " + res.job_no : "";
        toast("\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19" + jobNo + " \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E02\u0E49\u0E32 ACCOUNTING \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22", "ok");
        refresh();
      } else if (act === "reopen") {
        if (!await confirmModal("\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19", "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OPEN?")) return;
        await once("reopen-" + id, () => setJobStatus(id, "OPEN"));
        toast("\u0E04\u0E37\u0E19\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27", "ok");
        refresh();
      } else if (act === "undo") {
        if (!await confirmModal(
          "\u0E16\u0E2D\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
          "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E16\u0E2D\u0E22\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 OPEN?"
        )) return;
        await once("undo-" + id, () => setJobStatus(id, "OPEN"));
        toast("\u0E16\u0E2D\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OPEN \u0E41\u0E25\u0E49\u0E27", "ok");
        refresh();
      } else if (act === "cancel") {
        const reason = await reasonModal("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19 (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");
        if (!reason) return;
        await once("cancel-" + id, () => setJobStatus(id, "CANCELED", reason));
        toast("\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27", "ok");
        refresh();
      } else if (act === "delete") {
        const reason = await reasonModal("\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E16\u0E32\u0E27\u0E23 (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)");
        if (!reason) return;
        if (!await confirmModal(
          "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23",
          "\u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E47\u0E1A snapshot \u0E44\u0E27\u0E49\u0E43\u0E19 Audit Log) \u2014 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19?",
          "\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23"
        )) return;
        await once("delete-" + id, () => deleteJob(id, reason));
        toast("\u0E25\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27", "ok");
        refresh();
      }
    } catch (e) {
      handleErr(e);
    }
  }
  function editNote(id, current, refresh) {
    const b = document.createElement("div");
    b.innerHTML = `<div class="fld"><label>NOTE</label>
    <textarea class="inp w100" id="nj-note">${(current || "").replace(/</g, "&lt;")}</textarea></div>`;
    const f = document.createElement("div");
    f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
    <button class="btn btn-p" id="nj-note-ok">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>`;
    openModal({ title: "\u0E41\u0E01\u0E49\u0E44\u0E02 NOTE", body: b, footer: f });
    f.querySelector("#nj-note-ok").onclick = async () => {
      try {
        await once("note-" + id, () => updateNote(id, b.querySelector("#nj-note").value.trim()));
        closeModal();
        toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 NOTE \u0E41\u0E25\u0E49\u0E27", "ok");
        refresh();
      } catch (e) {
        handleErr(e);
      }
    };
  }
  var init_charge_actions = __esm({
    "assets/js/charges/charge-actions.js"() {
      init_charge_api();
      init_modal();
      init_toast();
      init_error_handler();
      init_request_manager();
    }
  });

  // assets/js/lazy/lazy-loader.js
  function loadScript(url) {
    if (loaded.has(url)) return loaded.get(url);
    const p = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = url;
      s.onload = () => res(true);
      s.onerror = () => rej(new Error("\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: " + url));
      document.head.appendChild(s);
    });
    loaded.set(url, p);
    return p;
  }
  var loaded;
  var init_lazy_loader = __esm({
    "assets/js/lazy/lazy-loader.js"() {
      loaded = /* @__PURE__ */ new Map();
    }
  });

  // assets/js/charges/charge-export.js
  var charge_export_exports = {};
  __export(charge_export_exports, {
    COMPAT_COLS: () => COMPAT_COLS,
    exportByCustomerZip: () => exportByCustomerZip,
    exportCsv: () => exportCsv,
    exportExcel: () => exportExcel,
    exportMaerskCase: () => exportMaerskCase,
    exportNotFound: () => exportNotFound,
    exportSoa: () => exportSoa,
    fetchRows: () => fetchRows,
    showBulkResult: () => showBulkResult,
    showTotals: () => showTotals,
    toAoA: () => toAoA,
    xlsx: () => xlsx
  });
  async function xlsx() {
    await loadScript(XLSX_CDN);
    return window.XLSX;
  }
  async function jszip() {
    await loadScript(JSZIP_CDN);
    return window.JSZip;
  }
  function cell(r, def, idx) {
    const [key, , kind] = def;
    if (kind === "seq") return idx + 1;
    if (kind === "remaining") return remainingText(r);
    const v = r[key];
    if (v === null || v === void 0 || v === "") return "";
    if (kind === "date") return dmy(v);
    if (kind === "num") return Number(v);
    return v;
  }
  function toAoA(rows, cols = COMPAT_COLS) {
    return [cols.map((c) => c[1]), ...rows.map((r, i) => cols.map((c) => cell(r, c, i)))];
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 6e3);
  }
  async function fetchRows(ctx, onProgress) {
    const PAGE = 1e3;
    const all = [];
    let page = 1, total = 0;
    for (; ; ) {
      const res = await exportCharges({
        charge: ctx.charge,
        group: ctx.group,
        queue: ctx.queue,
        scope: ctx.scope,
        filters: ctx.filters,
        exportPage: page,
        exportSize: PAGE
      });
      total = res.total || 0;
      if (res.truncated) {
        toast(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E01\u0E34\u0E19 ${(res.hard_limit || 1e5).toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E07\u0E0A\u0E48\u0E27\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48`, "err");
        return null;
      }
      all.push(...res.rows || []);
      if (onProgress) onProgress(all.length, total);
      if (!res.has_more) break;
      page += 1;
      if (page > 200) {
        toast("\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A \u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E04\u0E1A\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07", "err");
        return null;
      }
    }
    if (!all.length) {
      toast("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19", "err");
      return null;
    }
    if (all.length !== total) {
      toast(`\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A (${all.length}/${total}) \u2014 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01`, "err");
      return null;
    }
    return all;
  }
  function progress(title) {
    const b = document.createElement("div");
    b.innerHTML = `<div class="load-row"><div class="spin"></div><div class="mt-1" id="ex-prog">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026</div></div>`;
    openModal({ title, body: b });
    return {
      set: (n, t) => {
        const el = document.getElementById("ex-prog");
        if (el) el.textContent = `${n.toLocaleString("th-TH")} / ${t.toLocaleString("th-TH")} \u0E41\u0E16\u0E27`;
      },
      close: () => closeModal()
    };
  }
  function styleSheet(X, aoa, cols) {
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = cols.map((c) => ({ wch: Math.max(10, Math.min(28, String(c[1]).length + 4)) }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    const range = X.utils.decode_range(ws["!ref"]);
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cell4 = ws[X.utils.encode_cell({ r: R, c: C })];
        if (!cell4) continue;
        if (typeof cell4.v === "number" && MONEY_COLS.includes(cols[C] && cols[C][0])) {
          cell4.t = "n";
          cell4.z = "#,##0.00";
        }
      }
    }
    return ws;
  }
  function totalRow(rows, cols) {
    const r = cols.map((c) => "");
    const iLabel = cols.findIndex((c) => c[0] === "customer_job_no");
    r[iLabel >= 0 ? iLabel : 0] = "TOTAL";
    cols.forEach((c, i) => {
      if (MONEY_COLS.includes(c[0])) {
        r[i] = rows.reduce((s, x) => s + (Number(x[c[0]]) || 0), 0);
      }
    });
    return r;
  }
  async function exportExcel(ctx, allRows = false) {
    const pg = progress(allRows ? "Export \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" : "Export Excel");
    let rows;
    try {
      rows = await fetchRows(ctx, pg.set);
    } finally {
      pg.close();
    }
    if (!rows) return;
    const X = await xlsx();
    const aoa = toAoA(rows);
    aoa.push([], totalRow(rows, COMPAT_COLS));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, styleSheet(X, aoa, COMPAT_COLS), safeSheet(ctx.charge));
    X.writeFile(wb, fname(ctx, allRows ? "ALL" : "LIST", "xlsx"));
    toast(`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 ${rows.length.toLocaleString("th-TH")} \u0E41\u0E16\u0E27\u0E41\u0E25\u0E49\u0E27`, "ok");
  }
  async function exportCsv(ctx) {
    const pg = progress("Export Fast CSV");
    let rows;
    try {
      rows = await fetchRows(ctx, pg.set);
    } finally {
      pg.close();
    }
    if (!rows) return;
    const q2 = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + toAoA(rows).map((r) => r.map(q2).join(",")).join("\r\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), fname(ctx, "FAST", "csv"));
    toast(`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 CSV ${rows.length} \u0E41\u0E16\u0E27`, "ok");
  }
  async function exportByCustomerZip(ctx) {
    const pg = progress("Export Customer (ZIP)");
    let rows;
    try {
      rows = await fetchRows(ctx, pg.set);
    } finally {
      pg.close();
    }
    if (!rows) return;
    const X = await xlsx();
    const JSZip = await jszip();
    const zip = new JSZip();
    const byCust = /* @__PURE__ */ new Map();
    rows.forEach((r) => {
      const k = r.customer_name || "(\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)";
      if (!byCust.has(k)) byCust.set(k, []);
      byCust.get(k).push(r);
    });
    for (const [cust, list] of byCust) {
      const wb = X.utils.book_new();
      const aoa = toAoA(list);
      aoa.push([], totalRow(list, COMPAT_COLS));
      X.utils.book_append_sheet(wb, styleSheet(X, aoa, COMPAT_COLS), safeSheet(cust));
      const buf = X.write(wb, { bookType: "xlsx", type: "array" });
      zip.file(`${String(cust).replace(/[\\/:*?"<>|]/g, " ").slice(0, 60)}.xlsx`, buf);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const label = ctx.charge === "SERVICE" ? "ServiceCharge" : "AdvanceCharge";
    download(blob, `${label}_ByCustomer_${stamp()}.zip`);
    toast(`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 ${byCust.size} \u0E44\u0E1F\u0E25\u0E4C (1 \u0E44\u0E1F\u0E25\u0E4C\u0E15\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)`, "ok");
  }
  async function exportSoa(ctx) {
    if (!ctx.filters.customer) {
      toast("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 Customer \u0E01\u0E48\u0E2D\u0E19 Export SOA", "err");
      return;
    }
    const pg = progress("Export SOA");
    let all;
    try {
      all = await fetchRows(ctx, pg.set);
    } finally {
      pg.close();
    }
    if (!all) return;
    const rows = all.filter((r) => r.source_invoice_no || r.invoice_no);
    if (!rows.length) {
      toast("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A SOA \u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E19\u0E35\u0E49", "err");
      return;
    }
    const custNames = [...new Set(rows.map((r) => r.customer_name).filter(Boolean))];
    if (custNames.length > 1) {
      toast("SOA \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07", "err");
      return;
    }
    const X = await xlsx();
    const today = /* @__PURE__ */ new Date();
    const ageDays = (d) => d ? Math.round((today - /* @__PURE__ */ new Date(d + "T00:00:00")) / 864e5) : "";
    const body = rows.map((r) => {
      const cjob = String(r.customer_job_no || "").trim().toUpperCase();
      const noJob = cjob === "" || cjob === "N/A" || cjob === "NA" || cjob === "-";
      const age = ageDays(r.date);
      return [
        "N.J.",
        // A Supplier Name
        "",
        // B JOB NO. (เว้นตาม compatibility)
        dmy(r.date),
        // C JOB COMPLETED DATE
        r.source_invoice_no || "",
        // D Invoice Number (source)
        dmy(r.date),
        // E Invoice Date
        plus30(r.date),
        // F Due Date = date + 30
        r.net_payable === null || r.net_payable === void 0 ? "" : Number(r.net_payable),
        // G Amount
        "THB",
        // H Local Currency
        "",
        // I Container number (ไม่มีแหล่งยืนยัน)
        "",
        // J BOL / AWB (compatibility เดิมเว้นว่าง)
        "30 Days",
        // K Payment Terms
        age,
        // L Invoice Age
        noJob ? "Waiting Kewill / PO" : r.customer_job_no,
        // M PO number
        ageBucket(age),
        // N Ageing
        dmy(r.etd),
        // O Kewill / PO Received Date
        dmy(r.eta),
        // P Kewill / PO requested Date
        "",
        // Q Period (days)
        r.case_no || "",
        // R Vendor Comment
        r.contact || "",
        // S Contact person
        "",
        // T Category
        ""
        // U AP Comment
      ];
    });
    const aoa = [
      ["STATEMENT OF ACCOUNT"],
      [`\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32: ${custNames[0] || "-"}`],
      [`${chargeLabel(ctx.charge)} / ${groupLabel(ctx.group)}`, "", `\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E21\u0E37\u0E48\u0E2D ${dmy(stamp())}`],
      [],
      SOA_HEAD,
      ...body,
      [],
      ["", "", "", "", "", "TOTAL", body.reduce((s2, r) => s2 + (Number(r[6]) || 0), 0)]
    ];
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!cols"] = SOA_HEAD.map((h) => ({ wch: Math.max(12, Math.min(26, h.length + 4)) }));
    ws["!freeze"] = { xSplit: 0, ySplit: 5 };
    const range = X.utils.decode_range(ws["!ref"]);
    for (let R = 5; R <= range.e.r; R++) {
      const c = ws[X.utils.encode_cell({ r: R, c: 6 })];
      if (c && typeof c.v === "number") {
        c.t = "n";
        c.z = "#,##0.00";
      }
    }
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, "SOA_WK9");
    X.writeFile(wb, `SOA_${safeSheet(custNames[0])}_${stamp()}.xlsx`);
    toast(`\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01 SOA ${body.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23`, "ok");
  }
  async function exportMaerskCase(ctx) {
    if (ctx.group !== "MAERSK") {
      toast("\u0E1F\u0E31\u0E07\u0E01\u0E4C\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30 MAERSK", "err");
      return;
    }
    if (!ctx.filters.customer) {
      toast("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 Customer \u0E01\u0E48\u0E2D\u0E19 Export CASE", "err");
      return;
    }
    const pg = progress("Export Excel CASE");
    let all;
    try {
      all = await fetchRows(ctx, pg.set);
    } finally {
      pg.close();
    }
    if (!all) return;
    const target = all.filter((r) => {
      const v = String(r.customer_job_no || "").trim().toUpperCase();
      return v === "" || v === "N/A" || v === "NA" || v === "-";
    });
    if (!target.length) {
      toast("\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 Customer Job No. \u0E27\u0E48\u0E32\u0E07/N/A \u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E19\u0E35\u0E49", "err");
      return;
    }
    const isNoCase = (r) => String(r.case_no || "").trim().toUpperCase().replace(/\s+/g, " ") === "NO CASE";
    const noCase = target.filter(isNoCase);
    const withCase = target.filter((r) => !isNoCase(r));
    if (noCase.length + withCase.length !== target.length) {
      toast("\u0E01\u0E32\u0E23\u0E41\u0E22\u0E01 CASE \u0E44\u0E21\u0E48\u0E2A\u0E21\u0E14\u0E38\u0E25 \u2014 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01", "err");
      return;
    }
    const X = await xlsx();
    const JSZip = await jszip();
    const mk = (rows) => [CASE_HEAD, ...rows.map((r, i) => [
      i + 1,
      r.company_invoice || "",
      // Customer name ← Company Invoice
      r.case_no || "",
      dmy(r.etd),
      // CM Send Date ← ETD
      r.source_invoice_no || "",
      // Supplier Inv No.
      dmy(r.etd),
      // Execution Date ← ETD
      r.house_bl_no || "",
      // Booking no./Job no.
      r.customer_job_no || "",
      // Kewill no
      ""
      // Remark
    ])];
    const zip = new JSZip();
    for (const [name, list] of [["CASE", withCase], ["NO CASE", noCase]]) {
      if (!list.length) continue;
      const wb = X.utils.book_new();
      const ws = X.utils.aoa_to_sheet(mk(list));
      ws["!cols"] = CASE_HEAD.map((h) => ({ wch: Math.max(12, h.length + 4) }));
      X.utils.book_append_sheet(wb, ws, safeSheet(name));
      zip.file(`${name}.xlsx`, X.write(wb, { bookType: "xlsx", type: "array" }));
    }
    const blob = await zip.generateAsync({ type: "blob" });
    download(blob, `MAERSK_CASE_${stamp()}.zip`);
    toast(`\u0E23\u0E27\u0E21 ${target.length} \u0E41\u0E16\u0E27 \u2192 CASE ${withCase.length} \xB7 NO CASE ${noCase.length}`, "ok");
  }
  async function exportNotFound(list, title) {
    const q2 = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [["KEY"], ...list.map((k) => [k])].map((r) => r.map(q2).join(",")).join("\r\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${title}_${stamp()}.csv`);
  }
  function showBulkResult(title, res) {
    const nf = res.not_found || [], amb = res.ambiguous || [];
    const same = res.skipped_same_status || [], can2 = res.skipped_canceled || [];
    const bad = res.invalid_date || [];
    const line = (lb, arr, cls) => arr.length ? `<div class="mt-1"><b class="${cls}">${lb} (${arr.length})</b>
        <div class="t-xs t-2 ellip" title="${esc(arr.join(", "))}">${esc(arr.slice(0, 30).join(", "))}${arr.length > 30 ? " \u2026" : ""}</div></div>` : "";
    const b = document.createElement("div");
    b.innerHTML = `
    <div class="row"><span>\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</span><span class="sp"></span><b class="money-pos">${res.matched ?? 0}</b>
      <span class="t-3">/ ${res.requested ?? 0} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</span></div>
    ${line("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A", nf, "money-neg")}
    ${line("\u0E0B\u0E49\u0E33/\u0E01\u0E33\u0E01\u0E27\u0E21 (\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)", amb, "money-neg")}
    ${line("\u0E02\u0E49\u0E32\u0E21\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E14\u0E34\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27", same, "t-2")}
    ${line("\u0E02\u0E49\u0E32\u0E21\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01", can2, "t-2")}
    ${line("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07", bad, "money-neg")}`;
    const f = document.createElement("div");
    const all = nf.concat(amb);
    f.innerHTML = `${all.length ? '<button class="btn btn-o" id="bk-exp">\u2B07 \u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</button>' : ""}
    <button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>`;
    openModal({ title, body: b, footer: f });
    const ex = f.querySelector("#bk-exp");
    if (ex) ex.onclick = () => exportNotFound(all, "not_found");
  }
  function showTotals(k, ctx) {
    openModal({
      title: "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
      body: `<table class="tbl">
      <tr><td>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E07\u0E32\u0E19</td><td class="r t-b">${(k.total_job || 0).toLocaleString("th-TH")}</td></tr>
      <tr><td>Service charge</td><td class="r">${money(k.service_charge)}</td></tr>
      <tr><td>Advance charge</td><td class="r">${money(k.advance_charge)}</td></tr>
      <tr><td>VAT</td><td class="r">${money(k.vat)}</td></tr>
      <tr><td>Gross (subtotal + VAT)</td><td class="r">${money(k.gross_total)}</td></tr>
      <tr><td>WHT</td><td class="r">${money(k.wht_total)}</td></tr>
      <tr><td class="t-b">Total Amount (Net = Gross \u2212 WHT)</td><td class="r t-b">${money(k.total_amount)}</td></tr>
      <tr><td>\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14</td><td class="r">${(k.total_overdue || 0).toLocaleString("th-TH")} \u0E43\u0E1A</td></tr>
      <tr><td>\u0E07\u0E32\u0E19\u0E40\u0E25\u0E22 Due \u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INV</td><td class="r">${(k.job_overdue_no_invoice || 0).toLocaleString("th-TH")} \u0E07\u0E32\u0E19</td></tr>
    </table><p class="t-xs t-3 mt-1">* \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (${chargeLabel(ctx.charge)} / ${groupLabel(ctx.group)}) \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E27\u0E21\u0E1D\u0E31\u0E48\u0E07\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C</p>`,
      footer: Object.assign(
        document.createElement("div"),
        { innerHTML: '<button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>' }
      )
    });
    void AppState;
  }
  var XLSX_CDN, JSZIP_CDN, COMPAT_COLS, remainingText, stamp, fname, safeSheet, MONEY_COLS, SOA_HEAD, ageBucket, plus30, CASE_HEAD;
  var init_charge_export = __esm({
    "assets/js/charges/charge-export.js"() {
      init_charge_api();
      init_lazy_loader();
      init_toast();
      init_modal();
      init_formatter();
      init_charge_groups();
      init_state();
      XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
      COMPAT_COLS = [
        ["date", "Date", "date"],
        ["_item", "Item", "seq"],
        ["source_invoice_no", "Invoice No."],
        ["master_bl_no", "Master"],
        ["house_bl_no", "House B/l No."],
        ["data_type", "Data Type"],
        ["company_invoice", "Company Invoice"],
        ["customs_declaration_no", "DCL INV."],
        ["customer_job_no", "Customer Job No."],
        ["service_amount", "Service charge", "num"],
        ["advance_amount", "Advance", "num"],
        ["vat_amount", "VAT 7%", "num"],
        ["subtotal", "Amount", "num"],
        ["wht_amount", "WHT 3%", "num"],
        ["net_payable", "Total Amout", "num"],
        ["credit_term_days", "Credit Term"],
        ["cs_name", "Name CS"],
        ["operational_status", "Status"],
        ["customer_name", "Customer name"],
        ["i_billing_apl", "APL Billing"],
        ["due_date", "Due Date", "date"],
        ["_remaining", "Remaining", "remaining"],
        ["note", "NOTE"],
        ["case_no", "CASE"],
        ["eta", "ETA", "date"],
        ["etd", "ETD", "date"],
        ["contact", "Contact"]
      ];
      remainingText = (r) => {
        if (r.invoice_status === "VOID") return "VOID";
        if (r.payment_status === "PAID") return "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27";
        if (!r.due_date) return "";
        const t = /* @__PURE__ */ new Date();
        t.setHours(0, 0, 0, 0);
        const d = Math.round((/* @__PURE__ */ new Date(r.due_date + "T00:00:00") - t) / 864e5);
        return d < 0 ? "\u0E40\u0E01\u0E34\u0E19 " + Math.abs(d) + " \u0E27\u0E31\u0E19" : d === 0 ? "\u0E04\u0E23\u0E1A\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49" : "\u0E40\u0E2B\u0E25\u0E37\u0E2D " + d + " \u0E27\u0E31\u0E19";
      };
      stamp = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      fname = (ctx, suffix, ext) => `${ctx.charge}_${ctx.group}_${suffix}_${stamp()}.${ext}`;
      safeSheet = (s) => String(s || "").replace(/[\\/?*[\]:]/g, " ").slice(0, 28) || "DATA";
      MONEY_COLS = ["service_amount", "advance_amount", "vat_amount", "subtotal", "wht_amount", "net_payable"];
      SOA_HEAD = [
        "Supplier Name",
        "JOB NO.",
        "JOB COMPLETED DATE",
        "Invoice Number",
        "Invoice Date",
        "Due Date",
        "Amount",
        "Local Currency",
        "Container number",
        "BOL / AWB Number",
        "Payment Terms",
        "Invoice Age",
        "PO number",
        "Ageing",
        "Kewill / PO Received Date",
        "Kewill / PO requested Date",
        "Period (days)",
        "Vendor Comment",
        "Contact person",
        "Category",
        "AP Comment"
      ];
      ageBucket = (d) => {
        if (d === "" || d === null || d === void 0) return "";
        if (d <= 2) return "0-2";
        if (d <= 7) return "3-7";
        if (d <= 15) return "8-15";
        if (d <= 30) return "16-30";
        if (d <= 60) return "31-60";
        if (d <= 90) return "61-90";
        return ">91";
      };
      plus30 = (iso) => {
        if (!iso) return "";
        const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
        if (isNaN(d)) return "";
        d.setDate(d.getDate() + 30);
        return dmy(d.toISOString().slice(0, 10));
      };
      CASE_HEAD = [
        "Item",
        "Customer name",
        "Case no",
        "CM Send Date",
        "Supplier Inv No.",
        "Execution Date",
        "Booking no./Job no.",
        "Kewill no",
        "Remark"
      ];
    }
  });

  // assets/js/charges/charge-import.js
  function pickFile(accept = ".csv,.txt,.xlsx,.xls") {
    return new Promise((res) => {
      const i = document.createElement("input");
      i.type = "file";
      i.accept = accept;
      i.onchange = () => res(i.files && i.files[0] ? i.files[0] : null);
      i.click();
    });
  }
  async function readSheet(file) {
    const X = await xlsx();
    const name = (file.name || "").toLowerCase();
    let wb;
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      wb = X.read(await file.text(), { type: "string", raw: false, cellDates: true });
    } else {
      wb = X.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    }
    const sh = wb.Sheets[wb.SheetNames[0]];
    return X.utils.sheet_to_json(sh, { header: 1, raw: false, defval: "" }).map((r) => (r || []).map((v) => v == null ? "" : String(v).trim()));
  }
  function parseCreditTerm(v) {
    const s = String(v ?? "").trim();
    if (s === "") return "";
    const m = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|วัน)?\.?$/i);
    if (!m) return null;
    return String(Math.round(Number(m[1])));
  }
  function findHeaderCols(grid, spec, scanRows = 10) {
    for (let i = 0; i < Math.min(scanRows, grid.length); i++) {
      const row = (grid[i] || []).map((c) => String(c || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.:]/g, ""));
      const found = {};
      for (const [field, names] of Object.entries(spec)) {
        const idx = row.findIndex((c) => names.includes(c));
        if (idx >= 0) found[field] = idx;
      }
      if (Object.keys(found).length === Object.keys(spec).length) return { headerRow: i, cols: found };
    }
    return null;
  }
  function toISODate(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) {
      let y = Number(m[3]);
      if (y < 100) y += 2e3;
      if (y > 2400) y -= 543;
      return `${y}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    }
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString().slice(0, 10);
  }
  async function runMainImport(ctx) {
    const file = await pickFile();
    if (!file) return;
    const grid = await readSheet(file);
    if (grid.length < 2) {
      toast("\u0E44\u0E1F\u0E25\u0E4C\u0E27\u0E48\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", "err");
      return;
    }
    let hIdx = grid.findIndex((r) => r.some((c) => ["invoice no", "invoice", "date"].includes(norm(c))));
    if (hIdx < 0) hIdx = 0;
    const header = grid[hIdx].map(norm);
    const colOf = {};
    header.forEach((h, i) => {
      const f = HEADER_MAP[h];
      if (f && f !== "_ignore" && colOf[f] === void 0) colOf[f] = i;
    });
    if (colOf.key === void 0) {
      toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Invoice No. \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C", "err");
      return;
    }
    const presentFields = Object.keys(colOf).filter((k) => k !== "key" && !k.startsWith("m_"));
    const hasMoney = Object.keys(MONEY_FIELDS).some((k) => colOf[k] !== void 0);
    const rows = [];
    const seen = /* @__PURE__ */ new Map();
    const dupInFile = [];
    const invalidDate = [];
    const invalidTerm = [];
    for (let i = hIdx + 1; i < grid.length; i++) {
      const raw2 = grid[i];
      const key = String(raw2[colOf.key] ?? "").trim();
      if (!key) continue;
      const nkey = normKey(key);
      const fields = {};
      let bad = false;
      for (const f of presentFields) {
        let v = String(raw2[colOf[f]] ?? "").trim();
        if (DATE_FIELDS.includes(f)) {
          const iso = toISODate(v);
          if (iso === null) {
            bad = true;
            break;
          }
          v = iso;
        } else if (f === "credit_term_days") {
          const ct = parseCreditTerm(v);
          if (ct === null) {
            invalidTerm.push(key);
            v = "";
          } else v = ct;
        } else if (f === "operational_status") {
          v = STATUS_MAP[norm(v)] || "";
        }
        fields[f] = v;
      }
      if (bad) {
        invalidDate.push(key);
        continue;
      }
      const money2 = {};
      if (hasMoney) {
        for (const [src, dst] of Object.entries(MONEY_FIELDS)) {
          if (colOf[src] !== void 0) {
            const n = toNum(raw2[colOf[src]]);
            money2[dst] = n === null ? "" : n;
          }
        }
      }
      const rec = { key, fields, money: hasMoney ? money2 : null };
      if (seen.has(nkey)) {
        dupInFile.push(key);
        rows[seen.get(nkey)] = rec;
      } else {
        seen.set(nkey, rows.length);
        rows.push(rec);
      }
    }
    if (!rows.length) {
      toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E41\u0E16\u0E27\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C", "err");
      return;
    }
    const custNames = [...new Set(rows.map((r) => r.fields.customer_name).filter(Boolean))];
    const compNames = [...new Set(rows.map((r) => r.fields.company_invoice).filter(Boolean))];
    let resolved = { customers: [], companies: [] };
    if (custNames.length || compNames.length) {
      resolved = await importResolveMasters(ctx.charge, ctx.group, custNames, compNames);
    }
    const missCust = (resolved.customers || []).filter((c) => c.status !== "OK");
    const missComp = (resolved.companies || []).filter((c) => c.status !== "OK");
    const ok = await previewDialog({
      file: file.name,
      total: rows.length,
      fields: presentFields,
      hasMoney,
      dupInFile,
      invalidDate,
      invalidTerm,
      missCust,
      missComp,
      ctx
    });
    if (!ok) return;
    if (ok === "create-masters") {
      await importCreateMasters(
        missCust.filter((c) => c.status === "NOT_FOUND").map((c) => c.name),
        missComp.filter((c) => c.status === "NOT_FOUND").map((c) => c.name)
      );
      toast("\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01\u0E17\u0E35\u0E48\u0E02\u0E32\u0E14\u0E41\u0E25\u0E49\u0E27", "ok");
    }
    const CHUNK = 100;
    const sum = { inserted: 0, updated: 0, skipped: 0, ambiguous: [], unresolved_master: [], failed: [], invoiced_locked: [] };
    const prog = progressDialog(rows.length);
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await importJobsBatch(ctx.charge, ctx.group, rows.slice(i, i + CHUNK));
        sum.inserted += res.inserted || 0;
        sum.updated += res.updated || 0;
        sum.skipped += res.skipped || 0;
        sum.ambiguous = sum.ambiguous.concat(res.ambiguous || []);
        sum.unresolved_master = sum.unresolved_master.concat(res.unresolved_master || []);
        sum.failed = sum.failed.concat(res.failed || []);
        sum.invoiced_locked = sum.invoiced_locked.concat(res.invoiced_locked || []);
        prog.update(Math.min(i + CHUNK, rows.length));
      }
    } finally {
      prog.close();
    }
    resultDialog(sum, dupInFile, invalidDate, invalidTerm);
    ctx.refresh();
  }
  function previewDialog(info) {
    return new Promise((res) => {
      const canCreate = isAdmin() && (info.missCust.some((c2) => c2.status === "NOT_FOUND") || info.missComp.some((c2) => c2.status === "NOT_FOUND"));
      const listOf = (arr, lb) => arr.length ? `<div class="mt-1"><b class="money-neg">${lb} (${arr.length})</b>
         <div class="t-xs t-2">${esc(arr.slice(0, 20).map((x) => x.name + " [" + x.status + "]").join(", "))}${arr.length > 20 ? " \u2026" : ""}</div></div>` : "";
      const b = document.createElement("div");
      b.innerHTML = `
      <p>\u0E44\u0E1F\u0E25\u0E4C: <b>${esc(info.file)}</b> \xB7 ${info.total} \u0E41\u0E16\u0E27</p>
      <p class="t-sm t-2">\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E17\u0E35\u0E48: <b>${esc(info.ctx.charge)} / ${esc(info.ctx.group)}</b>
        (\u0E23\u0E30\u0E1A\u0E1A\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A scope \u0E19\u0E35\u0E49 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E01\u0E25\u0E38\u0E48\u0E21\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C)</p>
      <p class="t-xs t-3">\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E1F\u0E25\u0E4C\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E01\u0E49: ${esc(info.fields.join(", ") || "-")}
        ${info.hasMoney ? " \xB7 + \u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19 (\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1B\u0E47\u0E19 snapshot \u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07 INVOICE)" : ""}</p>
      <p class="t-xs t-3">\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19 header \u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02</p>
      ${info.dupInFile.length ? `<div class="mt-1"><b>\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C (${info.dupInFile.length})</b>
        <div class="t-xs t-2">\u0E22\u0E36\u0E14\u0E41\u0E16\u0E27\u0E25\u0E48\u0E32\u0E07\u0E2A\u0E38\u0E14: ${esc(info.dupInFile.slice(0, 20).join(", "))}</div></div>` : ""}
      ${info.invalidDate.length ? `<div class="mt-1"><b class="money-neg">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 (${info.invalidDate.length})</b>
        <div class="t-xs t-2">${esc(info.invalidDate.slice(0, 20).join(", "))}</div></div>` : ""}
      ${(info.invalidTerm || []).length ? `<div class="mt-1"><b class="money-neg">Credit Term \u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (${info.invalidTerm.length})</b>
        <div class="t-xs t-2">${esc(info.invalidTerm.slice(0, 20).join(", "))} \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E14\u0E32\u0E04\u0E48\u0E32\u0E43\u0E2B\u0E49</div></div>` : ""}
      ${listOf(info.missCust, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A/\u0E01\u0E33\u0E01\u0E27\u0E21")}
      ${listOf(info.missComp, "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A/\u0E01\u0E33\u0E01\u0E27\u0E21")}
      ${info.missCust.length || info.missComp.length ? '<p class="t-xs t-3 mt-1">\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E08\u0E30\u0E16\u0E39\u0E01\u0E02\u0E49\u0E32\u0E21 (unresolved) \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E14\u0E32\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49</p>' : ""}`;
      const f = document.createElement("div");
      f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      ${canCreate ? '<button class="btn btn-o" id="im-create">\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01\u0E17\u0E35\u0E48\u0E02\u0E32\u0E14 \u0E41\u0E25\u0E49\u0E27\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32</button>' : ""}
      <button class="btn btn-p" id="im-go">\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32</button>`;
      const m = openModal({ title: "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32", body: b, footer: f, large: true });
      f.querySelector("#im-go").onclick = () => {
        closeModal();
        res(true);
      };
      const c = f.querySelector("#im-create");
      if (c) c.onclick = () => {
        closeModal();
        res("create-masters");
      };
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest("[data-close]")) res(false);
      });
    });
  }
  function progressDialog(total) {
    const b = document.createElement("div");
    b.innerHTML = `<div class="load-row"><div class="spin"></div>
    <div class="mt-1" id="im-prog">0 / ${total}</div></div>`;
    openModal({ title: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25", body: b });
    return {
      update: (n) => {
        const el = document.getElementById("im-prog");
        if (el) el.textContent = `${n} / ${total}`;
      },
      close: () => closeModal()
    };
  }
  function resultDialog(sum, dupInFile, invalidDate, invalidTerm = []) {
    const line = (lb, arr, cls) => arr.length ? `<div class="mt-1"><b class="${cls}">${lb} (${arr.length})</b>
        <div class="t-xs t-2">${esc(arr.slice(0, 25).map((x) => typeof x === "string" ? x : x.key || JSON.stringify(x)).join(", "))}${arr.length > 25 ? " \u2026" : ""}</div></div>` : "";
    const b = document.createElement("div");
    b.innerHTML = `
    <table class="tbl">
      <tr><td>\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48</td><td class="r t-b money-pos">${sum.inserted}</td></tr>
      <tr><td>\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15</td><td class="r t-b">${sum.updated}</td></tr>
      <tr><td>\u0E02\u0E49\u0E32\u0E21</td><td class="r">${sum.skipped}</td></tr>
    </table>
    ${line("\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A/\u0E01\u0E33\u0E01\u0E27\u0E21 (\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)", sum.ambiguous, "money-neg")}
    ${line("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07 (\u0E02\u0E49\u0E32\u0E21\u0E41\u0E16\u0E27)", sum.unresolved_master, "money-neg")}
    ${line("\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14", sum.failed, "money-neg")}
    ${line("\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C (\u0E43\u0E0A\u0E49\u0E41\u0E16\u0E27\u0E25\u0E48\u0E32\u0E07\u0E2A\u0E38\u0E14)", dupInFile, "t-2")}
    ${line("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 (\u0E02\u0E49\u0E32\u0E21)", invalidDate, "money-neg")}
    ${line("Credit Term \u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)", invalidTerm, "money-neg")}
    ${line("\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E16\u0E39\u0E01\u0E25\u0E47\u0E2D\u0E01", sum.invoiced_locked || [], "money-neg")}`;
    const f = document.createElement("div");
    f.innerHTML = '<button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>';
    openModal({ title: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32", body: b, footer: f, large: true });
  }
  async function runAplUpload(ctx) {
    const file = await pickFile();
    if (!file) return;
    const grid = await readSheet(file);
    const hit = findHeaderCols(grid, {
      key: ["invoice", "invoice no", "invoice number", "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 invoice", "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49"],
      value: ["apl billing", "\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E23\u0E31\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", "contact", "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"]
    });
    const pairs = [];
    const start = hit ? hit.headerRow + 1 : 0;
    const kIdx = hit ? hit.cols.key : 0;
    const vIdx = hit ? hit.cols.value : 1;
    for (let i = start; i < grid.length; i++) {
      const key = String(grid[i][kIdx] ?? "").trim();
      const val = String(grid[i][vIdx] ?? "").trim();
      if (!key) continue;
      if (!hit && /^(invoice|เลข)/i.test(key)) continue;
      pairs.push({ key, value: val });
    }
    if (!pairs.length) {
      toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 Invoice / \u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E23\u0E31\u0E1A\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C", "err");
      return;
    }
    if (!await confirmModal(
      "Upload APL Billing",
      `\u0E1E\u0E1A ${pairs.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23${hit ? " (\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E32\u0E21\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C)" : " (\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07 \u2014 \u0E43\u0E0A\u0E49\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C A/B)"}<br>
     \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E0A\u0E48\u0E2D\u0E07 I BILLING APL \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19`
    )) return;
    const { showBulkResult: showBulkResult2 } = await Promise.resolve().then(() => (init_charge_export(), charge_export_exports));
    const res = await uploadAplBatch(ctx.charge, ctx.group, pairs);
    showBulkResult2("\u0E1C\u0E25 Upload APL Billing", res);
    ctx.refresh();
  }
  async function runUpload19(ctx) {
    const file = await pickFile(".xlsx,.xls,.csv");
    if (!file) return;
    const grid = await readSheet(file);
    const rows = [];
    for (const r of grid) {
      const key = String(r[2] ?? "").trim();
      if (!key || /^(invoice|inv)/i.test(key)) continue;
      const eta = String(r[12] ?? "").trim();
      const etd = String(r[13] ?? "").trim();
      const etaI = eta ? toISODate(eta) : "";
      const etdI = etd ? toISODate(etd) : "";
      rows.push({ key, eta: etaI === null ? "x" : etaI, etd: etdI === null ? "x" : etdI });
    }
    if (!rows.length) {
      toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C C/M/N \u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E25\u0E4C", "err");
      return;
    }
    if (!await confirmModal(
      "Upload 1.9",
      `\u0E1E\u0E1A ${rows.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E09\u0E1E\u0E32\u0E30 ETA / ETD (\u0E04\u0E48\u0E32\u0E27\u0E48\u0E32\u0E07\u0E08\u0E30\u0E44\u0E21\u0E48\u0E17\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21)`
    )) return;
    const { showBulkResult: showBulkResult2 } = await Promise.resolve().then(() => (init_charge_export(), charge_export_exports));
    const res = await upload19Batch(ctx.charge, ctx.group, rows);
    showBulkResult2("\u0E1C\u0E25 Upload 1.9", res);
    ctx.refresh();
  }
  async function runContactUpload() {
    const file = await pickFile();
    if (!file) return;
    const grid = await readSheet(file);
    const hit = findHeaderCols(grid, {
      company: ["company invoice", "company", "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 invoice"],
      contact: ["contact", "contact person", "\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D", "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"]
    });
    const pairs = [];
    const start = hit ? hit.headerRow + 1 : 0;
    const cIdx = hit ? hit.cols.company : 0;
    const nIdx = hit ? hit.cols.contact : 1;
    for (let i = start; i < grid.length; i++) {
      const company = String(grid[i][cIdx] ?? "").trim();
      const contact = String(grid[i][nIdx] ?? "").trim();
      if (!company) continue;
      if (!hit && /^(company|บริษัท)/i.test(company)) continue;
      pairs.push({ company, contact });
    }
    if (!pairs.length) {
      toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Company Invoice / Contact \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C", "err");
      return;
    }
    if (!await confirmModal(
      "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 LIST NAME",
      `\u0E1E\u0E1A ${pairs.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23${hit ? " (\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E32\u0E21\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C)" : " (\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E31\u0E27\u0E15\u0E32\u0E23\u0E32\u0E07 \u2014 \u0E43\u0E0A\u0E49\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C A/B)"}<br>
     \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Contact \u0E02\u0E2D\u0E07 Company Invoice (\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01)`
    )) return;
    const { showBulkResult: showBulkResult2 } = await Promise.resolve().then(() => (init_charge_export(), charge_export_exports));
    const res = await uploadContactList(pairs);
    showBulkResult2("\u0E1C\u0E25\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Contact List", res);
  }
  var normKey, norm, toNum, HEADER_MAP, DATE_FIELDS, MONEY_FIELDS, STATUS_MAP;
  var init_charge_import = __esm({
    "assets/js/charges/charge-import.js"() {
      init_charge_api();
      init_charge_export();
      init_modal();
      init_toast();
      init_formatter();
      init_permissions();
      normKey = (v) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, " ").replace(/\.0+$/, "");
      norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.:]/g, "");
      toNum = (v) => {
        const s = String(v ?? "").replace(/[, ฿]/g, "").trim();
        if (s === "" || s === "-") return null;
        const n = Number(s);
        return isNaN(n) ? null : n;
      };
      HEADER_MAP = {
        "date": "reference_date",
        "invoice no": "key",
        // Invoice No. ของไฟล์เดิม → source_invoice_no
        "invoice": "key",
        "master": "master_bl_no",
        "house b/l no": "house_bl_no",
        "house b/l": "house_bl_no",
        "house bl no": "house_bl_no",
        "data type": "data_type",
        "company invoice": "company_invoice",
        "dcl inv": "customs_declaration_no",
        "dcl": "customs_declaration_no",
        "customer job no": "customer_job_no",
        "customer job": "customer_job_no",
        "service charge": "m_service_charge",
        "advance": "m_advance",
        "vat 7%": "m_vat",
        "vat": "m_vat",
        "amount": "m_amount",
        "wht 3%": "m_wht",
        "wht": "m_wht",
        "total amount": "m_total",
        "total amout": "m_total",
        "credit term": "credit_term_days",
        "name cs": "cs_name",
        "cs": "cs_name",
        "status": "operational_status",
        "customer name": "customer_name",
        "customer": "customer_name",
        "apl billing": "i_billing_apl",
        "apl": "i_billing_apl",
        "due date": "due_date",
        "remaining": "_ignore",
        "item": "_ignore",
        "note": "note",
        "case": "case_no",
        "eta": "eta",
        "etd": "etd",
        "contact": "contact"
      };
      DATE_FIELDS = ["reference_date", "due_date", "eta", "etd"];
      MONEY_FIELDS = {
        m_service_charge: "service_charge",
        m_advance: "advance",
        m_vat: "vat",
        m_amount: "amount",
        m_wht: "wht",
        m_total: "total_amount"
      };
      STATUS_MAP = {
        "pending": "OPEN",
        "open": "OPEN",
        "processing": "PROCESSING",
        "close": "CLOSE",
        "closed": "CLOSE",
        "canceled": "CANCELED",
        "cancelled": "CANCELED"
      };
    }
  });

  // assets/js/jobs/job-api.js
  var saveJob, jobDetail;
  var init_job_api = __esm({
    "assets/js/jobs/job-api.js"() {
      init_supabase_client();
      saveJob = (p) => rpc("njacc_save_job", { p });
      jobDetail = (id) => rpc("njacc_job_detail", { p_id: id });
    }
  });

  // assets/js/master/master-api.js
  var fetchMasters, upsertCustomer, upsertCompany, upsertServiceCode;
  var init_master_api = __esm({
    "assets/js/master/master-api.js"() {
      init_supabase_client();
      fetchMasters = () => rpc("njacc_masters");
      upsertCustomer = (p) => rpc("njacc_upsert_customer", { p });
      upsertCompany = (p) => rpc("njacc_upsert_company", { p });
      upsertServiceCode = (p) => rpc("njacc_upsert_service_code", { p });
    }
  });

  // assets/js/master/master-cache.js
  async function masters(force = false) {
    if (!AppState.masters || force) AppState.masters = await fetchMasters();
    return AppState.masters;
  }
  function activeCustomers() {
    return (AppState.masters?.customers || []).filter((c) => c.active !== false);
  }
  function activeCompanies() {
    return (AppState.masters?.companies || []).filter((c) => c.active !== false);
  }
  function activeServiceCodes() {
    return (AppState.masters?.service_codes || []).filter((c) => c.active !== false);
  }
  function backendHasApplyTo() {
    const list = AppState.masters?.service_codes || [];
    if (!list.length) return true;
    return Object.prototype.hasOwnProperty.call(list[0], "apply_to");
  }
  function vatRateOf(c) {
    if (c && c.vat_rate != null && c.vat_rate !== "") return numOr(c.vat_rate, 0);
    const gl = numOr(AppState.masters?.vat_rate, 7);
    return c && c.vat_applicable === false ? 0 : gl;
  }
  function whtRateOf(c) {
    if (c && c.wht_rate != null && c.wht_rate !== "") return numOr(c.wht_rate, 0);
    return c && c.wht_applicable ? 3 : 0;
  }
  function backendHasTaxRates() {
    const list = AppState.masters?.service_codes || [];
    if (!list.length) return true;
    return Object.prototype.hasOwnProperty.call(list[0], "vat_rate");
  }
  function serviceCodesFor(charge) {
    const want = String(charge || "").toUpperCase() === "ADVANCE" ? "ADVANCE" : "SERVICE";
    return activeServiceCodes().filter((c) => {
      const a = applyTo(c);
      return a === "BOTH" || a === want;
    });
  }
  function customerOpts(sel) {
    return '<option value="">\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u2014</option>' + activeCustomers().map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${c.name.replace(/</g, "&lt;")}</option>`).join("");
  }
  function companyOpts(sel) {
    return '<option value="">\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u2014</option>' + activeCompanies().map((c) => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${c.name.replace(/</g, "&lt;")}</option>`).join("");
  }
  var applyTo, numOr;
  var init_master_cache = __esm({
    "assets/js/master/master-cache.js"() {
      init_state();
      init_master_api();
      applyTo = (c) => {
        const v = String(c?.apply_to || "").toUpperCase();
        return v === "SERVICE" || v === "ADVANCE" ? v : "BOTH";
      };
      numOr = (v, fb) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fb;
      };
    }
  });

  // assets/js/components/combobox.js
  function matchItems(items, term) {
    const t = norm2(term);
    if (!t) return items.slice();
    const hit = items.filter((it) => norm2(it.name).includes(t) || norm2(it.code).includes(t));
    const rank = (it) => norm2(it.code).startsWith(t) ? 0 : norm2(it.name).startsWith(t) ? 1 : 2;
    return hit.map((it, i) => [rank(it), i, it]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map((x) => x[2]);
  }
  function comboValue(el) {
    return el && el.dataset.id || "";
  }
  function comboText(el) {
    return el ? el.value.trim() : "";
  }
  function comboboxHTML(id, items, selId, placeholder, display) {
    const disp = display || DISPLAY;
    const cur = (items || []).find((x) => x.id === selId);
    return `<div class="cbx">
    <input class="inp cbx-inp" id="${id}" autocomplete="off" role="combobox"
      aria-expanded="false" aria-autocomplete="list" placeholder="${esc(placeholder || "")}"
      value="${esc(cur ? disp(cur) : "")}" data-id="${esc(selId || "")}">
    <button type="button" class="cbx-caret" tabindex="-1" aria-label="\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23">\u25BE</button>
    <div class="cbx-list" hidden></div>
  </div>`;
  }
  function bindCombobox(root, id, opts = {}) {
    const inp = root.querySelector("#" + id);
    if (!inp) return null;
    const wrap = inp.closest(".cbx");
    const list = wrap.querySelector(".cbx-list");
    const caret = wrap.querySelector(".cbx-caret");
    const getItems = opts.getItems || (() => []);
    const disp = opts.display || DISPLAY;
    let view = [];
    let shown = [];
    let active = -1;
    let busy2 = false;
    const fire = () => {
      if (typeof opts.onChange === "function") opts.onChange(comboValue(inp), inp.value.trim());
    };
    function close() {
      list.hidden = true;
      inp.setAttribute("aria-expanded", "false");
      active = -1;
    }
    function paint() {
      shown = view.slice(0, RENDER_LIMIT);
      const rows = shown.map((it, i) => {
        const inner = opts.codeFirst ? `<span class="cbx-code">${esc(it.code || "\u2014")}</span><span class="cbx-nm">${esc(it.name)}</span>` : `<span class="cbx-nm">${esc(it.name)}</span>${it.code ? `<span class="cbx-cd">${esc(it.code)}</span>` : ""}`;
        return `<button type="button" class="cbx-item${i === active ? " on" : ""}" data-i="${i}">${inner}</button>`;
      }).join("");
      const typed = inp.value.trim();
      const exact = view.some((it) => norm2(it.name) === norm2(typed) || it.code && norm2(it.code) === norm2(typed));
      const addRow = opts.canCreate && typed && !exact ? `<button type="button" class="cbx-item cbx-add" data-add="1">\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21 \u201C${esc(typed)}\u201D \u0E40\u0E1B\u0E47\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48</button>` : "";
      const more = view.length > shown.length ? `<div class="cbx-more">\u0E41\u0E2A\u0E14\u0E07 ${shown.length} \u0E08\u0E32\u0E01 ${view.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E1A\u0E25\u0E07</div>` : "";
      list.innerHTML = rows || addRow ? rows + more + addRow : `<div class="cbx-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A \u201C${esc(typed)}\u201D${opts.emptyHint ? `<div class="cbx-hint">${esc(opts.emptyHint)}</div>` : ""}</div>`;
      list.hidden = false;
      inp.setAttribute("aria-expanded", "true");
      const on = list.querySelector(".cbx-item.on");
      if (on && typeof on.scrollIntoView === "function") on.scrollIntoView({ block: "nearest" });
    }
    function open(filter) {
      view = matchItems(getItems(), filter === void 0 ? "" : filter);
      active = -1;
      paint();
    }
    function pick(it) {
      inp.value = disp(it);
      inp.dataset.id = it.id;
      close();
      fire();
    }
    async function create() {
      const name = inp.value.trim();
      if (!name || busy2 || typeof opts.onCreate !== "function") return;
      busy2 = true;
      try {
        const newId = await opts.onCreate(name);
        if (newId) {
          inp.dataset.id = newId;
          const it = getItems().find((x) => x.id === newId);
          inp.value = it ? disp(it) : name;
          close();
          fire();
        }
      } finally {
        busy2 = false;
      }
    }
    inp.addEventListener("focus", () => open(""));
    caret.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (list.hidden) {
        inp.focus();
        open("");
      } else close();
    });
    inp.addEventListener("input", () => {
      const typed = inp.value.trim();
      const hit = getItems().find((x) => norm2(x.name) === norm2(typed) || x.code && norm2(x.code) === norm2(typed));
      inp.dataset.id = hit ? hit.id : "";
      open(typed);
      fire();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (list.hidden) {
          open(inp.value.trim());
          return;
        }
        const n = shown.length + (list.querySelector(".cbx-add") ? 1 : 0);
        if (!n) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
        paint();
        return;
      }
      if (e.key === "Enter") {
        if (list.hidden) return;
        e.preventDefault();
        if (active >= 0 && active < shown.length) pick(shown[active]);
        else if (list.querySelector(".cbx-add")) create();
        else close();
      }
    });
    list.addEventListener("mousedown", (e) => {
      const btn2 = e.target.closest(".cbx-item");
      if (!btn2) return;
      e.preventDefault();
      if (btn2.dataset.add) {
        create();
        return;
      }
      pick(shown[Number(btn2.dataset.i)]);
    });
    document.addEventListener("mousedown", (e) => {
      if (!wrap.contains(e.target)) close();
    });
    return inp;
  }
  var norm2, RENDER_LIMIT, DISPLAY;
  var init_combobox = __esm({
    "assets/js/components/combobox.js"() {
      init_formatter();
      norm2 = (s) => String(s == null ? "" : s).trim().toLowerCase();
      RENDER_LIMIT = 50;
      DISPLAY = (it) => it ? it.name : "";
    }
  });

  // assets/js/core/validator.js
  function required(v) {
    return v != null && String(v).trim() !== "";
  }
  function isDate(v) {
    return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
  }
  function markInvalid(el, msg) {
    const fld = el.closest(".fld");
    if (!fld) return;
    fld.classList.add("invalid");
    let e = fld.querySelector(".err-msg");
    if (!e) {
      e = document.createElement("div");
      e.className = "err-msg";
      fld.appendChild(e);
    }
    e.textContent = msg;
  }
  function clearInvalid(root) {
    root.querySelectorAll(".fld.invalid").forEach((f) => f.classList.remove("invalid"));
    root.querySelectorAll(".err-msg").forEach((e) => e.remove());
  }
  var init_validator = __esm({
    "assets/js/core/validator.js"() {
    }
  });

  // assets/js/components/loading.js
  function btnBusy(btn2, busy2) {
    if (!btn2) return;
    btn2.disabled = busy2;
    if (busy2) {
      btn2.dataset.txt = btn2.innerHTML;
      btn2.innerHTML = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u2026";
    } else if (btn2.dataset.txt) {
      btn2.innerHTML = btn2.dataset.txt;
    }
  }
  var init_loading = __esm({
    "assets/js/components/loading.js"() {
    }
  });

  // assets/js/jobs/job-form.js
  var job_form_exports = {};
  __export(job_form_exports, {
    openNewJobModal: () => openNewJobModal,
    render: () => render
  });
  async function render(cnt, params) {
    await masters();
    const editId = params.id || null;
    const isAcc = params.mode === "accounting";
    let job = { charge_type: params.charge, company_group: params.group, containers: [] };
    if (editId) {
      job = await jobDetail(editId);
      if (job.invoice_id) {
        cnt.innerHTML = '<div class="card card-pad empty">\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19</div>';
        return;
      }
    }
    const charge = job.charge_type, group = job.company_group;
    const custTerm = () => {
      const c = (AppState.masters.customers || []).find((x) => x.id === comboValue(cnt.querySelector("#jf-cust")));
      return c ? c.credit_term_days : null;
    };
    cnt.innerHTML = `
    <div class="fs-page">
      <div class="fs-head"><div class="fs-title"><span class="dot"></span>
        <h2>${editId ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19" : "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"} (${isAcc ? "ACCOUNTING" : "DOCUMENT"} - ${chargeLabel(charge)})</h2>
        <span class="ch-head-badge service">${groupLabel(group)}</span></div>
        <button class="btn-icon" id="jf-back" aria-label="\u0E1B\u0E34\u0E14">\u2715</button></div>
      <div class="fs-body">
      <input type="hidden" id="jf-dtype" value="${esc(job.data_type || "")}">
      <input type="hidden" id="jf-refdate" value="${job.reference_date || ymd(/* @__PURE__ */ new Date())}">
      <input type="hidden" id="jf-ref" value="${esc(job.reference_no || "")}">

      <div class="jm-sec jm-doc">
        <div class="jm-sec-t">DOCUMENT</div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</label>
            <input class="inp" value="${esc(job.job_no || "\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")}" readonly disabled></div>
          <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</label>
            <select class="sel" id="jf-comp">${companyOpts(job.company_invoice_id)}</select>
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>' : ""}</div>
          <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
            ${comboboxHTML("jf-cust", activeCustomers(), job.customer_id, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32", CUST_DISPLAY)}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>' : ""}</div>
          <div class="fld"><label>Customer Job No.</label>
            <input class="inp" id="jf-cjob" value="${esc(job.customer_job_no || "")}"></div>
        </div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
            <input class="inp" id="jf-decl" value="${esc(job.customs_declaration_no || "")}"></div>
          <div class="fld"><label>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</label>
            <input class="inp" id="jf-srcinv" value="${esc(job.source_invoice_no || "")}"></div>
          <div class="fld"><label>House B/L No.</label>
            <input class="inp" id="jf-hbl" value="${esc(job.house_bl_no || "")}"></div>
          <div class="fld"><label>Master B/L No.</label>
            <input class="inp" id="jf-mbl" value="${esc(job.master_bl_no || "")}"></div>
        </div>
        <div class="jm-grid jm-grid-5">
          <div class="fld"><label>Booking No.</label>
            <input class="inp" id="jf-book" value="${esc(job.booking_no || "")}"></div>
          <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
            <input class="inp" id="jf-vessel" value="${esc(job.vessel_name || "")}"></div>
          <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>
            <input class="inp" type="number" min="0" id="jf-qtyc" value="${job.qty_container ?? ""}"></div>
          <div class="fld"><label>ETD</label>
            <input class="inp" type="date" id="jf-etd" value="${job.etd || ""}"></div>
          <div class="fld"><label>ETA / \u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>
            <input class="inp" type="date" id="jf-eta" value="${job.eta || ""}"></div>
        </div>
      </div>

      ${isAcc ? `<div class="jm-sec jm-acc">
        <div class="jm-sec-t">ACCOUNTING</div>
        <div class="jm-grid">
          <div class="fld"><label>Case</label>
            <input class="inp" id="jf-case" value="${esc(job.case_no || "")}"></div>
          <div class="fld"><label>Contact</label>
            <input class="inp" id="jf-contact" value="${esc(job.contact || "")}"></div>
          <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
            <input class="inp" type="number" min="0" id="jf-term" value="${job.credit_term_days ?? ""}"
              placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"></div>
          <div class="fld"><label>Due Date</label>
            <input class="inp" type="date" id="jf-due" value="${job.due_date || ""}"></div>
        </div>
        <div class="jm-hint" id="jf-due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>
      </div>` : `
        <input type="hidden" id="jf-case" value="${esc(job.case_no || "")}">
        <input type="hidden" id="jf-contact" value="${esc(job.contact || "")}">
        <input type="hidden" id="jf-term" value="${job.credit_term_days ?? ""}">
        <input type="hidden" id="jf-due" value="${job.due_date || ""}">
        <div id="jf-due-pv" hidden></div>`}

      <div class="jm-sec">
        <div class="jm-sec-t">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21</div>
        <div class="jm-grid">
          <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>
            <input class="inp" type="date" id="jf-dlv" value="${job.delivery_date || ""}"></div>
          <div class="fld"><label>CS</label>
            <input class="inp" id="jf-cs" value="${esc(job.cs_name || "")}"></div>
          <div class="fld"><label>I BILLING APL</label>
            <input class="inp" id="jf-apl" value="${esc(job.i_billing_apl || "")}"></div>
        </div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E40\u0E19\u0E2D\u0E23\u0E4C</label>
          <div id="jf-cnts"></div>
          <button type="button" class="btn btn-o btn-sm mt-1" id="jf-addcnt">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E15\u0E39\u0E49</button></div>
        <div class="fld mt-2"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <textarea class="inp w100" id="jf-note">${esc(job.note || "")}</textarea></div>
      </div>
      </div>
      <div class="fs-foot">
        <div class="mf-left">
          ${isAcc ? `<button class="btn btn-p" id="jf-post" disabled
            title="\u0E23\u0E2D RPC njacc_post_invoice (atomic DRAFT\u2192POSTED) \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u21E7 POST</button>
          <button class="btn btn-o" id="jf-unpost" disabled
            title="\u0E15\u0E49\u0E2D\u0E07 POST \u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30 UNPOST \u0E44\u0E14\u0E49 \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u21E9 UNPOST</button>` : ""}
        </div>
        <div class="mf-right">
          <button class="btn btn-p" id="jf-save">\u{1F4BE} ${isAcc ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" : "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19"}</button>
          ${isAcc ? `<button class="btn btn-print" id="jf-print" disabled
            title="\u0E43\u0E0A\u0E49 renderer \u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A Preview \u2014 sql/dev/011 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E19">\u{1F5A8} Print Draft</button>` : ""}
          <button class="btn btn-o" id="jf-cancel">\u2715 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
        </div>
      </div>
    </div>`;
    const cntWrap = cnt.querySelector("#jf-cnts");
    function cntRow(c = {}) {
      const d = document.createElement("div");
      d.className = "jf-cnt-row";
      d.innerHTML = `<input class="inp" data-cn placeholder="\u0E40\u0E25\u0E02\u0E15\u0E39\u0E49" value="${esc(c.container_no || "")}">
      <input class="inp" data-ct placeholder="\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E15\u0E39\u0E49 \u0E40\u0E0A\u0E48\u0E19 40HC" style="max-width:150px" value="${esc(c.container_type || "")}">
      <button class="btn btn-o btn-sm" data-del>\u2715</button>`;
      d.querySelector("[data-del]").onclick = () => d.remove();
      cntWrap.appendChild(d);
    }
    (job.containers || []).forEach(cntRow);
    cnt.querySelector("#jf-addcnt").onclick = () => cntRow();
    function updDue() {
      const pv = cnt.querySelector("#jf-due-pv");
      const dueManual = cnt.querySelector("#jf-due").value;
      if (dueManual) {
        pv.textContent = "Due Date: " + dmy(dueManual) + " (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)";
        return;
      }
      const base = cnt.querySelector("#jf-refdate").value;
      const term = cnt.querySelector("#jf-term").value !== "" ? Number(cnt.querySelector("#jf-term").value) : custTerm();
      if (base && term != null) {
        const d = /* @__PURE__ */ new Date(base + "T00:00:00");
        d.setDate(d.getDate() + Number(term));
        pv.textContent = "Due Date (\u0E04\u0E33\u0E19\u0E27\u0E13): " + dmy(ymd(d)) + " \xB7 \u0E40\u0E17\u0E2D\u0E21 " + term + " \u0E27\u0E31\u0E19";
        pv.dataset.calc = ymd(d);
      } else {
        pv.textContent = "\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date";
        delete pv.dataset.calc;
      }
    }
    ["#jf-refdate", "#jf-term", "#jf-due"].forEach((s) => cnt.querySelector(s).addEventListener("input", updDue));
    bindCombobox(cnt, "jf-cust", {
      getItems: activeCustomers,
      display: CUST_DISPLAY,
      codeFirst: true,
      canCreate: false,
      emptyHint: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 SYSTEM > \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
      onChange: () => updDue()
    });
    updDue();
    cnt.addEventListener("click", (e) => {
      const b = e.target.closest("[data-master]");
      if (b) location.hash = b.dataset.master === "customers" ? "#/settings/customers" : "#/masters?tab=" + b.dataset.master;
    });
    const back = () => location.hash = params.mode ? "#/" + params.mode + "/" + String(charge).toLowerCase() : "#/charges/" + charge + "/" + group;
    cnt.querySelector("#jf-back").onclick = back;
    cnt.querySelector("#jf-cancel").onclick = back;
    cnt.querySelector("#jf-save").onclick = async (e) => {
      clearInvalid(cnt);
      const refdate = cnt.querySelector("#jf-refdate");
      const cust = cnt.querySelector("#jf-cust");
      let bad = false;
      if (!required(refdate.value) || !isDate(refdate.value)) {
        markInvalid(refdate, "\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48");
        bad = true;
      }
      if (!required(comboValue(cust))) {
        markInvalid(cust, comboText(cust) ? "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" : "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32");
        bad = true;
      }
      if (bad) {
        toast("\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A", "err");
        return;
      }
      const pv = cnt.querySelector("#jf-due-pv");
      const payload2 = {
        id: editId,
        charge_type: charge,
        company_group: group,
        data_type: cnt.querySelector("#jf-dtype").value || null,
        reference_no: cnt.querySelector("#jf-ref").value.trim() || null,
        reference_date: refdate.value,
        company_invoice_id: cnt.querySelector("#jf-comp").value || null,
        customer_id: comboValue(cust),
        customs_declaration_no: cnt.querySelector("#jf-decl").value.trim() || null,
        source_invoice_no: cnt.querySelector("#jf-srcinv").value.trim() || null,
        house_bl_no: cnt.querySelector("#jf-hbl").value.trim() || null,
        master_bl_no: cnt.querySelector("#jf-mbl").value.trim() || null,
        booking_no: cnt.querySelector("#jf-book").value.trim() || null,
        vessel_name: cnt.querySelector("#jf-vessel").value.trim() || null,
        qty_container: cnt.querySelector("#jf-qtyc").value !== "" ? Number(cnt.querySelector("#jf-qtyc").value) : null,
        etd: cnt.querySelector("#jf-etd").value || null,
        eta: cnt.querySelector("#jf-eta").value || null,
        delivery_date: cnt.querySelector("#jf-dlv").value || null,
        customer_job_no: cnt.querySelector("#jf-cjob").value.trim() || null,
        case_no: cnt.querySelector("#jf-case").value.trim() || null,
        contact: cnt.querySelector("#jf-contact").value.trim() || null,
        cs_name: cnt.querySelector("#jf-cs").value.trim() || null,
        i_billing_apl: cnt.querySelector("#jf-apl").value.trim() || null,
        credit_term_days: cnt.querySelector("#jf-term").value !== "" ? Number(cnt.querySelector("#jf-term").value) : custTerm(),
        due_date: cnt.querySelector("#jf-due").value || pv.dataset.calc || null,
        note: cnt.querySelector("#jf-note").value.trim() || null,
        containers: [...cntWrap.querySelectorAll(".jf-cnt-row")].map((r) => ({
          container_no: r.querySelector("[data-cn]").value.trim(),
          container_type: r.querySelector("[data-ct]").value.trim() || null
        })).filter((c) => c.container_no)
      };
      btnBusy(e.target, true);
      try {
        await once("save-job", () => saveJob(payload2));
        toast(editId ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27" : "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27", "ok");
        back();
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
  }
  async function openNewJobModal({ charge, group, mode, jobId, onSaved }) {
    await masters();
    let job = null;
    if (jobId) {
      job = await jobDetail(jobId);
      if (job.invoice_id) {
        toast("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07 Void INVOICE \u0E01\u0E48\u0E2D\u0E19", "err");
        return;
      }
      charge = job.charge_type;
      group = job.company_group;
    }
    const isEdit = !!jobId;
    const isAcc = mode === "accounting";
    const AUTO = "\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01";
    const q2 = (sel) => b.querySelector(sel);
    const REF_DATE = job && job.reference_date || ymd(/* @__PURE__ */ new Date());
    const b = document.createElement("div");
    b.innerHTML = `
    <div class="jm-auto">
      <span class="jm-auto-lb">${isEdit ? "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19" : "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19 (\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34)"}</span>
      <input class="inp" id="nj-autono" value="${isEdit ? esc(job.job_no || "-") : AUTO}" readonly disabled>
    </div>

    <div class="jm-sec jm-doc">
      <div class="jm-sec-t">DOCUMENT</div>
      <div class="jm-grid">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</label>
          ${comboboxHTML("nj-comp", activeCompanies(), job && job.company_invoice_id || "", "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")}
          ${isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>' : ""}</div>
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
          ${comboboxHTML("nj-cust", activeCustomers(), job && job.customer_id || "", "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E2B\u0E23\u0E37\u0E2D CODE \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32", CUST_DISPLAY)}
          ${isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</button>' : ""}</div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="nj-cjob" placeholder="\u0E01\u0E23\u0E2D\u0E01 Customer Job No." value="${job ? esc(job.customer_job_no || "") : ""}"></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>
          <input class="inp" id="nj-decl" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32" value="${job ? esc(job.customs_declaration_no || "") : ""}"></div>
      </div>
      <div class="jm-grid">
        <div class="fld"><label>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</label>
          <input class="inp" id="nj-srcinv" placeholder="\u0E01\u0E23\u0E2D\u0E01 Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07" value="${job ? esc(job.source_invoice_no || "") : ""}"></div>
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="nj-hbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 House B/L No." value="${job ? esc(job.house_bl_no || "") : ""}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="nj-mbl" placeholder="\u0E01\u0E23\u0E2D\u0E01 Master B/L No." value="${job ? esc(job.master_bl_no || "") : ""}"></div>
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="nj-book" placeholder="\u0E01\u0E23\u0E2D\u0E01 Booking No." value="${job ? esc(job.booking_no || "") : ""}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>
          <input class="inp" id="nj-vessel" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel" value="${job ? esc(job.vessel_name || "") : ""}"></div>
        <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>
          <input class="inp" type="number" min="0" id="nj-qtyc" placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49" value="${job && job.qty_container != null ? job.qty_container : ""}"></div>
        <div class="fld"><label>ETD</label><input class="inp" type="date" id="nj-etd" value="${job && job.etd || ""}"></div>
        <div class="fld"><label>ETA</label><input class="inp" type="date" id="nj-eta" value="${job && job.eta || ""}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label><input class="inp" type="date" id="nj-dlv" value="${job && job.delivery_date || ""}"></div>
      </div>
    </div>

    ${isAcc ? `<div class="jm-sec jm-acc">
      <div class="jm-sec-t">ACCOUNTING</div>
      <div class="jm-grid">
        <div class="fld"><label>Case</label>
          <input class="inp" id="nj-case" placeholder="\u0E01\u0E23\u0E2D\u0E01 Case" value="${job ? esc(job.case_no || "") : ""}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="nj-contact" placeholder="\u0E01\u0E23\u0E2D\u0E01 Contact" value="${job ? esc(job.contact || "") : ""}"></div>
        <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
          <input class="inp" type="number" min="0" id="nj-term" placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32" value="${job && job.credit_term_days != null ? job.credit_term_days : ""}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="nj-due" value="${job && job.due_date || ""}"></div>
      </div>
      <div class="jm-hint" id="nj-due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>
    </div>` : ""}`;
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-p" id="nj-save">\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19</button>
      <button class="btn btn-o" data-close>\u2715 \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
    </div>`;
    openModal({ title: isEdit ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19" : "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48", body: b, footer: f, fullscreen: true, wide: true });
    const refreshMasters = () => masters(true);
    bindCombobox(b, "nj-comp", {
      getItems: activeCompanies,
      canCreate: isAdmin(),
      onCreate: async (name) => {
        try {
          const id = await upsertCompany({ company_name: name });
          await refreshMasters();
          toast("\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u201C" + name + "\u201D \u0E41\u0E25\u0E49\u0E27", "ok");
          return id;
        } catch (ex) {
          handleErr(ex);
          return null;
        }
      }
    });
    bindCombobox(b, "nj-cust", {
      getItems: activeCustomers,
      display: CUST_DISPLAY,
      codeFirst: true,
      canCreate: false,
      emptyHint: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 SYSTEM > \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
      onChange: () => updDue()
    });
    const custTermM = () => {
      const c = (AppState.masters.customers || []).find((x) => x.id === comboValue(q2("#nj-cust")));
      return c ? c.credit_term_days : null;
    };
    function updDue() {
      const pv = q2("#nj-due-pv");
      if (!pv) return;
      const manual = q2("#nj-due").value;
      if (manual) {
        pv.textContent = "Due Date: " + dmy(manual) + " (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)";
        delete pv.dataset.calc;
        return;
      }
      const base = REF_DATE;
      const term = q2("#nj-term").value !== "" ? Number(q2("#nj-term").value) : custTermM();
      if (base && term != null) {
        const d = /* @__PURE__ */ new Date(base + "T00:00:00");
        d.setDate(d.getDate() + Number(term));
        pv.textContent = "Due Date (\u0E04\u0E33\u0E19\u0E27\u0E13): " + dmy(ymd(d)) + " \xB7 \u0E40\u0E17\u0E2D\u0E21 " + term + " \u0E27\u0E31\u0E19";
        pv.dataset.calc = ymd(d);
      } else {
        pv.textContent = "\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date";
        delete pv.dataset.calc;
      }
    }
    ["#nj-term", "#nj-due"].forEach((sel) => {
      const el = q2(sel);
      if (el) el.addEventListener("input", updDue);
    });
    updDue();
    b.addEventListener("click", (e) => {
      const m = e.target.closest("[data-master]");
      if (m) {
        closeModal();
        location.hash = m.dataset.master === "customers" ? "#/settings/customers" : "#/masters?tab=" + m.dataset.master;
      }
    });
    f.querySelector("#nj-save").onclick = async (e) => {
      clearInvalid(b);
      let bad = false;
      const custEl = q2("#nj-cust");
      if (!required(comboValue(custEl))) {
        markInvalid(custEl, comboText(custEl) ? "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" : "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32");
        bad = true;
      }
      if (bad) {
        toast("\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01", "err");
        return;
      }
      const pv = q2("#nj-due-pv");
      const acc = isAcc ? {
        case_no: q2("#nj-case").value.trim() || null,
        contact: q2("#nj-contact").value.trim() || null,
        credit_term_days: q2("#nj-term").value !== "" ? Number(q2("#nj-term").value) : custTermM(),
        due_date: q2("#nj-due").value || pv.dataset.calc || null
      } : {};
      const payload2 = {
        /* โหมดแก้ไข: ส่ง id เดิม → njacc_save_job อัปเดตทับ Record เดิม ไม่สร้างงานใหม่ */
        ...isEdit ? { id: jobId } : {},
        charge_type: charge,
        company_group: group,
        /* ล็อกตามหน้าที่เข้ามา */
        /* ── ฟิลด์ที่ถอดออกจาก UI แต่ backend ยังใช้ (ไม่ลบคอลัมน์ใน DB) ──
           reference_date : ใช้เป็น "วันที่" ของรายการและฐานคำนวณ Due Date → ตั้งเป็นวันที่ปัจจุบัน
           data_type      : ไม่มีช่องให้เลือกแล้ว → ส่ง null (คอลัมน์ยังอยู่ · แก้ภายหลังได้จากฟอร์มเต็ม)
           reference_no   : ไม่มีช่องให้กรอกแล้ว → ส่ง null */
        /* ── ฟิลด์ที่ไม่มีช่องใน UI ──
           เปิดงานใหม่ = null · แก้ไข = คงค่าเดิมของงานไว้ (ไม่ล้างข้อมูลที่มีอยู่) */
        data_type: job && job.data_type || null,
        reference_date: REF_DATE,
        reference_no: job && job.reference_no || null,
        company_invoice_id: comboValue(q2("#nj-comp")) || null,
        customer_id: comboValue(q2("#nj-cust")),
        customer_job_no: q2("#nj-cjob").value.trim() || null,
        customs_declaration_no: q2("#nj-decl").value.trim() || null,
        source_invoice_no: q2("#nj-srcinv").value.trim() || null,
        house_bl_no: q2("#nj-hbl").value.trim() || null,
        master_bl_no: q2("#nj-mbl").value.trim() || null,
        booking_no: q2("#nj-book").value.trim() || null,
        vessel_name: q2("#nj-vessel").value.trim() || null,
        qty_container: q2("#nj-qtyc").value !== "" ? Number(q2("#nj-qtyc").value) : null,
        etd: q2("#nj-etd").value || null,
        eta: q2("#nj-eta").value || null,
        delivery_date: q2("#nj-dlv").value || null,
        ...acc
      };
      btnBusy(e.target, true);
      try {
        const res = await once(isEdit ? "edit-job-" + jobId : "save-job", () => saveJob(payload2));
        closeModal();
        toast(isEdit ? "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27" + (res && res.job_no ? " \u2014 " + res.job_no : "") : "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E49\u0E27" + (res && res.job_no ? " \u2014 " + res.job_no : ""), "ok");
        if (typeof onSaved === "function") onSaved();
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
  }
  var CUST_DISPLAY;
  var init_job_form = __esm({
    "assets/js/jobs/job-form.js"() {
      init_job_api();
      init_master_cache();
      init_combobox();
      init_master_api();
      init_state();
      init_permissions();
      init_validator();
      init_formatter();
      init_toast();
      init_modal();
      init_loading();
      init_error_handler();
      init_request_manager();
      init_charge_groups();
      CUST_DISPLAY = (it) => it ? it.name || it.code : "";
    }
  });

  // assets/js/charges/charge-tools.js
  function extractRefToken(line) {
    const parts = String(line || "").split(/[\s\t,;|]+/).map((x) => x.trim()).filter(Boolean);
    for (const p of parts) {
      if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(p)) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) continue;
      return p;
    }
    return "";
  }
  function keysDialog(title, { withValue, valueLabel, valueType = "text", okLabel = "\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23", extraDate } = {}) {
    return new Promise((res) => {
      const b = document.createElement("div");
      b.innerHTML = `
      <p class="t-sm t-2 mb-1">\u0E27\u0E32\u0E07\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E25\u0E30 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23
        (\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A Job No / Invoice No / Source Invoice No / Customer Job No)</p>
      <div class="fld"><textarea class="inp w100" id="tk-keys" rows="8" style="min-height:150px"></textarea></div>
      ${withValue ? `<div class="fld"><label>${esc(valueLabel)}</label>
        <input class="inp w100" id="tk-val" type="${valueType}"></div>` : ""}
      ${extraDate ? `<div class="fld"><label>${esc(extraDate)}</label>
        <input class="inp w100" id="tk-date" type="date"></div>` : ""}`;
      const f = document.createElement("div");
      f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
      <button class="btn btn-p" id="tk-ok">${esc(okLabel)}</button>`;
      const m = openModal({ title, body: b, footer: f, large: true });
      f.querySelector("#tk-ok").onclick = () => {
        const keys = b.querySelector("#tk-keys").value.split(/[\r\n\t,;]+/).map((s) => s.trim()).filter(Boolean);
        if (!keys.length) {
          toast("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E27\u0E32\u0E07\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07", "err");
          return;
        }
        const value = withValue ? b.querySelector("#tk-val").value.trim() : null;
        if (withValue && !value) {
          toast("\u0E01\u0E23\u0E2D\u0E01" + valueLabel, "err");
          return;
        }
        const date = extraDate ? b.querySelector("#tk-date").value || "" : "";
        closeModal();
        res({ keys, value, date });
      };
      m.addEventListener("click", (e) => {
        if (e.target === m || e.target.closest("[data-close]")) res(null);
      });
    });
  }
  async function runTool(action, ctx) {
    try {
      switch (action) {
        case "refresh":
          ctx.refresh();
          return;
        case "new-job": {
          const { openNewJobModal: openNewJobModal2 } = await Promise.resolve().then(() => (init_job_form(), job_form_exports));
          await openNewJobModal2({ charge: ctx.charge, group: ctx.group, mode: ctx.mode, onSaved: ctx.refresh });
          return;
        }
        /* ---- Export ---- */
        case "export-excel":
          return exportExcel(ctx, false);
        case "export-all":
          return exportExcel(ctx, true);
        case "export-csv":
          return exportCsv(ctx);
        case "export-cust":
          return exportByCustomerZip(ctx);
        case "export-soa":
          return exportSoa(ctx);
        case "export-case":
          return exportMaerskCase(ctx);
        /* ---- Import / Upload ---- */
        case "upload":
          return runMainImport(ctx);
        case "apl-upload":
          return runAplUpload(ctx);
        case "upload-19":
          return runUpload19(ctx);
        /* ---- ยอดรวม ---- */
        case "sum": {
          const k = await chargeKpi({ charge: ctx.charge, group: ctx.group, queue: ctx.queue, scope: ctx.scope, filters: ctx.filters });
          showTotals(k, ctx);
          return;
        }
        /* ---- Contact List (ดู + อัปโหลด LIST NAME) ---- */
        case "contacts": {
          const list = await contactList(ctx.charge, ctx.group);
          const body = list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>Company Invoice</th><th>\u0E23\u0E2B\u0E31\u0E2A</th><th>Contact (LIST NAME)</th><th class="r">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E07\u0E32\u0E19</th>
          </tr></thead><tbody>${list.map((c) => `<tr>
            <td class="t-b">${esc(c.company_invoice)}</td><td>${esc(c.company_code || "-")}</td>
            <td>${esc(c.master_contact || "-")}</td><td class="r">${c.job_count ?? ""}</td>
          </tr>`).join("")}</tbody></table></div>
          <p class="t-xs t-3 mt-1">Contact \u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 = Contact \u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19 (\u0E16\u0E49\u0E32\u0E21\u0E35) \u0E21\u0E34\u0E09\u0E30\u0E19\u0E31\u0E49\u0E19\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E08\u0E32\u0E01 LIST NAME \u0E19\u0E35\u0E49</p>` : '<div class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice \u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49</div>';
          const f = document.createElement("div");
          f.innerHTML = `<button class="btn btn-o" id="ct-up">\u{1F4C1} \u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 LIST NAME</button>
          <button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>`;
          openModal({ title: "Contact List \u2014 " + groupLabel(ctx.group), body, footer: f, large: true });
          f.querySelector("#ct-up").onclick = async () => {
            closeModal();
            await runContactUpload();
          };
          return;
        }
        /* ---- Bulk ---- */
        case "paste-close": {
          const r = await keysDialog("Paste \u0E08\u0E1A\u0E07\u0E32\u0E19 (\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE)", { okLabel: "\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" });
          if (!r) return;
          if (!await confirmModal(
            "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E1A\u0E07\u0E32\u0E19",
            `\u0E08\u0E30\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE \u0E43\u0E2B\u0E49 ${r.keys.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01)`
          )) return;
          const res = await once("bulk-close", () => bulkSetStatus(ctx.charge, ctx.group, r.keys.map(extractRefToken).filter(Boolean), "CLOSE"));
          showBulkResult("\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E07\u0E32\u0E19", res);
          ctx.refresh();
          return;
        }
        case "close-upload": {
          const file = await pickFile();
          if (!file) return;
          const grid = await readSheet(file);
          const keys = grid.map((r) => String(r[0] ?? "").trim()).filter((k) => k && !/^(invoice|job|เลข)/i.test(k));
          if (!keys.length) {
            toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C", "err");
            return;
          }
          if (!await confirmModal(
            "\u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C",
            `\u0E1E\u0E1A ${keys.length} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C ${esc(file.name)} \u2014 \u0E15\u0E31\u0E49\u0E07\u0E2A\u0E16\u0E32\u0E19\u0E30 CLOSE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14?`
          )) return;
          const res = await once("close-upload", () => bulkSetStatus(ctx.charge, ctx.group, keys, "CLOSE"));
          showBulkResult("\u0E1C\u0E25\u0E15\u0E31\u0E14\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C", res);
          ctx.refresh();
          return;
        }
        case "bulk-case": {
          const r = await keysDialog("Bulk Case", {
            withValue: true,
            valueLabel: "Case",
            okLabel: "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Case",
            extraDate: "ETA (\u0E16\u0E49\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E15\u0E34\u0E21\u0E14\u0E49\u0E27\u0E22)"
          });
          if (!r) return;
          const keys = r.keys.map(extractRefToken).filter(Boolean);
          if (!keys.length) {
            toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07", "err");
            return;
          }
          const res = await once("bulk-case", () => bulkSetField(ctx.charge, ctx.group, keys, "case_no", r.value));
          showBulkResult("\u0E1C\u0E25\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 Case", res);
          if (r.date) {
            const res2 = await bulkSetField(ctx.charge, ctx.group, keys, "eta", r.date);
            showBulkResult("\u0E1C\u0E25\u0E40\u0E15\u0E34\u0E21 ETA", res2);
          }
          ctx.refresh();
          return;
        }
        case "fill-etd": {
          const r = await keysDialog("\u0E40\u0E15\u0E34\u0E21 ETD", { withValue: true, valueLabel: "ETD", valueType: "date", okLabel: "\u0E40\u0E15\u0E34\u0E21 ETD" });
          if (!r) return;
          const res = await once("fill-etd", () => bulkSetField(ctx.charge, ctx.group, r.keys.map(extractRefToken).filter(Boolean), "etd", r.value));
          showBulkResult("\u0E1C\u0E25\u0E40\u0E15\u0E34\u0E21 ETD", res);
          ctx.refresh();
          return;
        }
        /* ---- ADVANCE Quick Close ---- */
        case "quick-close": {
          const el = document.getElementById("qc-key");
          const key = el ? el.value.trim() : "";
          if (!key) {
            toast("\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E25\u0E02 JOB \u0E2B\u0E23\u0E37\u0E2D Invoice \u0E01\u0E48\u0E2D\u0E19", "err");
            return;
          }
          const res = await quickCloseLookup(ctx.charge, ctx.group, key);
          const matches = res.matches || [];
          if (!matches.length) {
            toast("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23: " + key, "err");
            return;
          }
          if (matches.length > 1) {
            showMatches(matches, key);
            return;
          }
          const m = matches[0];
          if (m.operational_status === "CLOSE") {
            toast("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E08\u0E1A\u0E41\u0E25\u0E49\u0E27", "err");
            return;
          }
          if (m.operational_status === "CANCELED") {
            toast("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E08\u0E1A\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", "err");
            return;
          }
          const ok = await confirmModal(
            "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E1A\u0E07\u0E32\u0E19",
            `${esc(m.job_no)} \xB7 ${esc(m.customer_name || "-")}<br>
           Invoice: ${esc(m.invoice_no || m.source_invoice_no || "-")} \xB7 Due: ${dmy(m.due_date)}`
          );
          if (!ok) return;
          const r26 = await once("quick-close", () => bulkSetStatus(ctx.charge, ctx.group, [key], "CLOSE"));
          if (r26.matched) {
            toast("\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27", "ok");
            if (el) el.value = "";
          } else showBulkResult("\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E07\u0E32\u0E19", r26);
          ctx.refresh();
          return;
        }
        default:
          toast("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E19\u0E35\u0E49", "err");
      }
    } catch (e) {
      handleErr(e);
    }
  }
  function showMatches(matches, key) {
    openModal({
      title: "\u0E1E\u0E1A\u0E2B\u0E25\u0E32\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A " + key,
      body: `<p class="t-sm t-2">\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E08\u0E1A\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1E\u0E1A\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E42\u0E1B\u0E23\u0E14\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>Job No</th><th>Invoice</th><th>SRC</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th>Due</th>
      </tr></thead><tbody>${matches.map((m) => `<tr>
        <td>${esc(m.job_no)}</td><td>${esc(m.invoice_no || "-")}</td>
        <td>${esc(m.source_invoice_no || "-")}</td><td>${esc(m.customer_name || "-")}</td>
        <td>${esc(m.operational_status)}</td><td>${dmy(m.due_date)}</td>
      </tr>`).join("")}</tbody></table></div>`,
      footer: Object.assign(
        document.createElement("div"),
        { innerHTML: '<button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>' }
      ),
      large: true
    });
  }
  var init_charge_tools = __esm({
    "assets/js/charges/charge-tools.js"() {
      init_charge_api();
      init_charge_import();
      init_charge_export();
      init_modal();
      init_toast();
      init_error_handler();
      init_request_manager();
      init_formatter();
      init_charge_groups();
    }
  });

  // assets/js/components/pagination.js
  function renderPagination(el, { page, size, total }, onChange) {
    const pages = Math.max(1, Math.ceil(total / size));
    const p = Math.min(page, pages);
    const btn2 = (lb, tp, dis, cur) => `<button data-p="${tp}" ${dis ? "disabled" : ""} class="${cur ? "cur" : ""}">${lb}</button>`;
    let nums = "";
    const from = Math.max(1, p - 2), to = Math.min(pages, p + 2);
    for (let i = from; i <= to; i++) nums += btn2(i, i, false, i === p);
    el.innerHTML = `<div class="pgn">
    <span>\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${total.toLocaleString("th-TH")} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</span><span class="sp"></span>
    ${btn2("\u23EE", 1, p === 1)}${btn2("\u25C0", p - 1, p === 1)}${nums}${btn2("\u25B6", p + 1, p === pages)}${btn2("\u23ED", pages, p === pages)}
    <select class="sel" data-size>${PAGE_SIZES.map((s) => `<option ${s === size ? "selected" : ""}>${s}</option>`).join("")}</select>
  </div>`;
    el.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => onChange({ page: Number(b.dataset.p), size }));
    el.querySelector("[data-size]").onchange = (e) => onChange({ page: 1, size: Number(e.target.value) });
  }
  var init_pagination = __esm({
    "assets/js/components/pagination.js"() {
      init_config();
    }
  });

  // assets/js/components/filters.js
  function readFilters(root) {
    const out = {};
    root.querySelectorAll("[data-f]").forEach((el) => {
      out[el.dataset.f] = el.value.trim();
    });
    return out;
  }
  var init_filters = __esm({
    "assets/js/components/filters.js"() {
    }
  });

  // assets/js/invoices/invoice-api.js
  var invoice_api_exports = {};
  __export(invoice_api_exports, {
    deleteInvoiceDraft: () => deleteInvoiceDraft,
    invoiceDraftView: () => invoiceDraftView,
    invoiceView: () => invoiceView,
    issueInvoice: () => issueInvoice,
    postDraftInvoice: () => postDraftInvoice,
    postInvoice: () => postInvoice,
    saveInvoiceDraft: () => saveInvoiceDraft,
    settleAdvance: () => settleAdvance,
    unpostInvoice: () => unpostInvoice,
    unpostToDraft: () => unpostToDraft,
    voidInvoice: () => voidInvoice
  });
  var issueInvoice, invoiceView, voidInvoice, postInvoice, unpostInvoice, settleAdvance, saveInvoiceDraft, invoiceDraftView, postDraftInvoice, deleteInvoiceDraft, unpostToDraft;
  var init_invoice_api = __esm({
    "assets/js/invoices/invoice-api.js"() {
      init_supabase_client();
      issueInvoice = (jobId, items, requestId, invDate, dueDate) => rpc("njacc_issue_invoice", {
        p_job: jobId,
        p_items: items,
        p_request_id: requestId,
        p_invoice_date: invDate || null,
        p_due_date: dueDate || null
      });
      invoiceView = (id) => rpc("njacc_invoice_view", { p_id: id });
      voidInvoice = (id, reason, requestId) => rpc("njacc_void_invoice", { p_id: id, p_reason: reason, p_request_id: requestId });
      postInvoice = (invoiceId, requestId) => rpc("njacc_post_invoice", { p_invoice: invoiceId, p_request_id: requestId });
      unpostInvoice = (invoiceId, reason, requestId) => rpc("njacc_unpost_invoice", { p_invoice: invoiceId, p_reason: reason, p_request_id: requestId });
      settleAdvance = (jobId, status, note, requestId) => rpc("njacc_settle_advance", { p_job: jobId, p_status: status, p_note: note, p_request_id: requestId });
      saveInvoiceDraft = (payload2) => rpc("njacc_save_invoice_draft", { p: payload2 });
      invoiceDraftView = (jobId) => rpc("njacc_invoice_draft_view", { p_job: jobId });
      postDraftInvoice = (invoiceId, requestId) => rpc("njacc_post_draft_invoice", { p_invoice: invoiceId, p_request_id: requestId });
      deleteInvoiceDraft = (invoiceId, reason) => rpc("njacc_delete_invoice_draft", { p_invoice: invoiceId, p_reason: reason });
      unpostToDraft = (invoiceId, reason, requestId) => rpc("njacc_unpost_to_draft", { p_invoice: invoiceId, p_reason: reason, p_request_id: requestId });
    }
  });

  // assets/js/core/baht-text.js
  function readGroup(n) {
    let s = "";
    const str = String(n);
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const d = Number(str[i]);
      const place = len - i - 1;
      if (d === 0) continue;
      if (place === 1 && d === 1) s += "\u0E2A\u0E34\u0E1A";
      else if (place === 1 && d === 2) s += "\u0E22\u0E35\u0E48\u0E2A\u0E34\u0E1A";
      else if (place === 0 && d === 1 && len > 1) s += "\u0E40\u0E2D\u0E47\u0E14";
      else s += DIGIT[d] + PLACE[place];
    }
    return s;
  }
  function readInt(n) {
    if (n === 0) return "\u0E28\u0E39\u0E19\u0E22\u0E4C";
    const groups = [];
    let x = n;
    while (x > 0) {
      groups.unshift(x % 1e6);
      x = Math.floor(x / 1e6);
    }
    return groups.map((g, i) => {
      if (g === 0) return i === groups.length - 1 ? "" : "";
      return readGroup(g) + "\u0E25\u0E49\u0E32\u0E19".repeat(groups.length - 1 - i);
    }).join("");
  }
  function bahtText(amount) {
    const v = Number(amount);
    if (!Number.isFinite(v)) return "";
    const neg = v < 0;
    const cents = Math.round(Math.abs(v) * 100);
    const baht = Math.floor(cents / 100);
    const satang = cents % 100;
    let s = readInt(baht) + "\u0E1A\u0E32\u0E17";
    s += satang === 0 ? "\u0E16\u0E49\u0E27\u0E19" : readGroup(satang) + "\u0E2A\u0E15\u0E32\u0E07\u0E04\u0E4C";
    return (neg ? "\u0E25\u0E1A" : "") + s;
  }
  var DIGIT, PLACE;
  var init_baht_text = __esm({
    "assets/js/core/baht-text.js"() {
      DIGIT = ["", "\u0E2B\u0E19\u0E36\u0E48\u0E07", "\u0E2A\u0E2D\u0E07", "\u0E2A\u0E32\u0E21", "\u0E2A\u0E35\u0E48", "\u0E2B\u0E49\u0E32", "\u0E2B\u0E01", "\u0E40\u0E08\u0E47\u0E14", "\u0E41\u0E1B\u0E14", "\u0E40\u0E01\u0E49\u0E32"];
      PLACE = ["", "\u0E2A\u0E34\u0E1A", "\u0E23\u0E49\u0E2D\u0E22", "\u0E1E\u0E31\u0E19", "\u0E2B\u0E21\u0E37\u0E48\u0E19", "\u0E41\u0E2A\u0E19"];
    }
  });

  // assets/js/config/company-doc.js
  var ISSUER;
  var init_company_doc = __esm({
    "assets/js/config/company-doc.js"() {
      ISSUER = {
        nameEn: "N.J. LOGISTICS & FRUITS CO., LTD.",
        address: "62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)",
        tel: "033-000870",
        fax: "033-000870",
        taxId: "0205557004651",
        /* โลโก้จริง — ไฟล์ภาพ ไม่ได้วาดใหม่ ไม่ได้แปลงเป็น path
           แสดงด้วย object-fit:contain เสมอ เพื่อคงสัดส่วนเดิม (426x231 = 1.844) */
        logo: "assets/img/nj-logo.png"
      };
    }
  });

  // assets/js/finance/advance-doc.js
  var advance_doc_exports = {};
  __export(advance_doc_exports, {
    advanceDocHTML: () => advanceDocHTML,
    openAdvanceDoc: () => openAdvanceDoc
  });
  function summarize(inv, items) {
    let sub = 0;
    const rates = /* @__PURE__ */ new Set();
    for (const it of items) {
      sub = r2(sub + num(it.amount));
      if (num(it.vat_rate) > 0) rates.add(num(it.vat_rate));
    }
    const vat = r2(inv.vat_amount);
    const wht = r2(inv.wht_amount);
    const vatRate = rates.size === 1 ? [...rates][0] : rates.size === 0 ? num(inv.vat_rate) : null;
    const total = r2(sub + vat);
    return { sub, vat, wht, vatRate, total, received: r2(total - wht) };
  }
  function advanceDocHTML(inv, { advanceStatus = null } = {}) {
    const items = inv.items || [];
    const S = summarize(inv, items);
    const c = inv.customer || {};
    const j = inv.job || {};
    const isVoid = String(inv.status || "").toUpperCase() === "VOID";
    const D = {
      cusName: inv.customer_name || c.name,
      cusTax: inv.customer_tax_id || c.tax_id,
      cusBranch: inv.customer_branch_code || c.branch_code,
      cusAddr: inv.customer_address || c.address,
      cusTel: inv.customer_phone || c.phone,
      apNo: inv.invoice_no,
      apDate: inv.invoice_date,
      jobNo: inv.job_no || j.job_no,
      invRef: inv.source_invoice_no || j.source_invoice_no,
      note: inv.job_note || j.note
    };
    const payFor = String(inv.charge_type || "").toUpperCase() === "ADVANCE" ? "Advance Payment / \u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32" : null;
    const stKey = String(advanceStatus || "").toUpperCase();
    const st6 = ADV_ST[stKey] || null;
    const rows = items.map((it, i) => `<tr>
      <td class="apd-c apd-no">${it.line_no ?? i + 1}</td>
      <td class="apd-ds">${txt(it.description, "-")}</td>
      <td class="apd-c">${it.qty === null || it.qty === void 0 || it.qty === "" ? "-" : esc(String(Number(it.qty)))}</td>
      <td class="apd-r">${cell2(it.unit_price)}</td>
      <td class="apd-r">${money(it.amount)}</td>
    </tr>`).join("") || '<tr><td colspan="5" class="apd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>';
    const vatLbl = S.vatRate === null ? "VAT" : `VAT ${S.vatRate}%`;
    const noteTxt = raw(D.note);
    const signBlock = (icon, en, th) => `
    <div class="apd-sg">
      ${bub(icon)}
      <div class="apd-sg-b">
        <div class="apd-sg-t"><i></i>${en} / ${th}</div>
        <div class="apd-sg-ln"></div>
        <div class="apd-sg-f"><label>Name / \u0E0A\u0E37\u0E48\u0E2D</label><span class="apd-dot"></span></div>
        <div class="apd-sg-f"><label>Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label>
          <span class="apd-dot apd-dot-s"></span><b>/</b>
          <span class="apd-dot apd-dot-s"></span><b>/</b>
          <span class="apd-dot apd-dot-s"></span></div>
      </div>
    </div>`;
    return `
    <div class="apd print-area${isVoid ? " apd-void" : ""}">
      ${isVoid ? '<div class="apd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>' : ""}

      <header class="apd-head">
        <div class="apd-head-l">
          <img class="apd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="apd-co">
            <div class="apd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="apd-co-ad">${esc(ISSUER.address)}</div>
            <div class="apd-co-tl">Tel : ${esc(ISSUER.tel)} <i>|</i> Fax : ${esc(ISSUER.fax)}</div>
            <div class="apd-co-tl">Tax ID : ${esc(ISSUER.taxId)}</div>
          </div>
        </div>
        <div class="apd-head-r">
          <div class="apd-title">ADVANCE PAYMENT</div>
          <div class="apd-title-th">\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</div>
          <div class="apd-chip">ADVANCE RECEIPT</div>
          ${st6 ? `<div class="apd-st ${st6[0]}">${esc(st6[1])}</div>` : ""}
        </div>
      </header>
      <div class="apd-band"></div>

      <section class="apd-grid">
        <div class="apd-box">
          <div class="apd-box-t">${bub("user")}<span>CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></div>
          <div class="apd-box-b">
            <div class="apd-row"><label>Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>
              <i>:</i><div class="apd-v apd-v-b">${txt(D.cusName)}</div></div>
            <div class="apd-row"><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label>
              <i>:</i><div class="apd-v">${txt(D.cusTax)}</div></div>
            <div class="apd-row"><label>Branch / \u0E2A\u0E32\u0E02\u0E32</label>
              <i>:</i><div class="apd-v">${txt(D.cusBranch)}</div></div>
            <div class="apd-row apd-row-ml"><label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <i>:</i><div class="apd-v">${txt(D.cusAddr, "-")}</div></div>
            <div class="apd-row apd-row-last"><label>Tel. / \u0E42\u0E17\u0E23.</label>
              <i>:</i><div class="apd-v">${txt(D.cusTel)}</div></div>
          </div>
        </div>

        <div class="apd-box">
          <div class="apd-box-t">${bub("form")}<span>ADVANCE PAYMENT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</span></div>
          <div class="apd-box-b">
            <div class="apd-row"><label>Advance Payment No.</label>
              <i>:</i><div class="apd-v apd-v-key">${txt(D.apNo)}</div></div>
            <div class="apd-row"><label>Date</label>
              <i>:</i><div class="apd-v apd-v-b">${dmy(D.apDate)}</div></div>
            <div class="apd-row"><label>Job No.</label>
              <i>:</i><div class="apd-v apd-v-b">${txt(D.jobNo)}</div></div>
            <div class="apd-row"><label>Invoice Reference</label>
              <i>:</i><div class="apd-v apd-v-b">${txt(D.invRef)}</div></div>
            <div class="apd-row apd-row-last"><label>Payment For /<br>\u0E27\u0E31\u0E15\u0E16\u0E38\u0E1B\u0E23\u0E30\u0E2A\u0E07\u0E04\u0E4C\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</label>
              <i>:</i><div class="apd-v">${payFor ? esc(payFor) : "-"}</div></div>
          </div>
        </div>
      </section>

      <section class="apd-items">
        <div class="apd-items-t">${bub("list")}<span>ADVANCE PAYMENT ITEMS / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</span></div>
        <table class="apd-tbl">
          <colgroup><col class="w-no"><col class="w-ds"><col class="w-qty">
            <col class="w-up"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="apd-c">No.</th>
            <th>Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="apd-c">Qty</th>
            <th class="apd-r">Unit Price</th>
            <th class="apd-r">Amount (THB)</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="apd-total">
            <td colspan="4" class="apd-r">TOTAL ADVANCE AMOUNT / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</td>
            <td class="apd-r apd-total-v">${money(S.sub)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="apd-mid">
        <div class="apd-mid-l">
          <div class="apd-mini">
            ${bub("abc")}
            <div class="apd-mini-b">
              <div class="apd-mini-t">Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</div>
              <div class="apd-mini-v">(${esc(bahtText(S.received))})</div>
            </div>
          </div>
          ${noteTxt ? `<div class="apd-mini">
            ${bub("pen")}
            <div class="apd-mini-b">
              <div class="apd-mini-t apd-mini-t2">NOTE / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div>
              <div class="apd-mini-n">${esc(noteTxt)}</div>
            </div>
          </div>` : ""}
        </div>
        <div class="apd-sum">
          <div class="apd-sl"><span>SubTotal</span><span>${money(S.sub)}</span></div>
          <div class="apd-sl"><span>${esc(vatLbl)}</span><span>${money(S.vat)}</span></div>
          ${S.wht > 0 ? `<div class="apd-sl apd-sl-w"><span>Withholding Tax / \u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span>
            <span>-${money(S.wht)}</span></div>` : ""}
          <div class="apd-sl apd-sl-m"><span>Total Advance Amount</span><span>${money(S.total)}</span></div>
          <div class="apd-sl apd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</i></span>
            <span>${money(S.received)}</span></div>
        </div>
      </section>

      <section class="apd-signs">
        ${signBlock("hand", "RECEIVED BY", "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19")}
        ${signBlock("shield", "AUTHORIZED BY", "\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")}
      </section>

      <div class="apd-edge"></div>
    </div>`;
  }
  function openAdvanceDoc(inv, { advanceStatus = null, print = false } = {}) {
    const b = document.createElement("div");
    b.innerHTML = advanceDocHTML(inv, { advanceStatus });
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="apd-print">\u{1F5A8} Print Advance Payment</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;
    openModal({
      title: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32 " + (inv.invoice_no || ""),
      body: b,
      footer: f,
      fullscreen: true,
      wide: true
    });
    f.querySelector("#apd-print").onclick = () => window.print();
    if (print) setTimeout(() => window.print(), 60);
  }
  var txt, raw, num, r2, cell2, ICON2, bub, ADV_ST;
  var init_advance_doc = __esm({
    "assets/js/finance/advance-doc.js"() {
      init_formatter();
      init_modal();
      init_baht_text();
      init_company_doc();
      txt = (v, fb = "-") => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return esc(s || fb);
      };
      raw = (v) => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return s;
      };
      num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      r2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;
      cell2 = (v) => v === null || v === void 0 || v === "" ? "-" : money(v);
      ICON2 = {
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
        form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4.4" y="3" width="15.2" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
        list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',
        abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',
        pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.6 3.8 20.2 7.4 8 19.6l-4.4.8.8-4.4z"/><path d="M14.4 6l3.6 3.6"/></svg>',
        hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8.4" r="3.2"/><path d="M3.6 19.4c1.4-1.2 3-1.2 4.4-.4l2 1.1c.7.4 1.6.4 2.3 0l5.2-2.8c.9-.5 1.2-1.6.7-2.5-.5-.8-1.5-1.1-2.3-.7l-3.3 1.5"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.2 19.2 6v5.6c0 4.4-3 7.6-7.2 9.2-4.2-1.6-7.2-4.8-7.2-9.2V6z"/><path d="M9 12.2l2.1 2.1 4-4.2"/></svg>'
      };
      bub = (k) => `<span class="apd-bub">${ICON2[k] || ""}</span>`;
      ADV_ST = {
        PENDING: ["apd-st-pending", "PENDING / \u0E23\u0E2D\u0E08\u0E48\u0E32\u0E22"],
        PAID: ["apd-st-paid", "PAID / \u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27"],
        SETTLED: ["apd-st-settled", "SETTLED / \u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E04\u0E23\u0E1A"]
      };
    }
  });

  // assets/js/invoices/invoice-calc.js
  function calcLine(item2, vatRate) {
    const amt = round2(item2.amount || 0);
    const vRate = rateOf(item2.vat_rate, item2.vat_applicable === false ? 0 : vatRate);
    const wRate = rateOf(item2.wht_rate, item2.wht_applicable ? 3 : 0);
    const vat = round2(amt * vRate / 100);
    const wht = round2(amt * wRate / 100);
    return { amt, vat, wht, vatRate: vRate, whtRate: wRate, lineTotal: round2(amt + vat) };
  }
  function calcTotals(items, vatRate) {
    let sub = 0, vat = 0, wht = 0;
    for (const it of items) {
      const l = calcLine(it, vatRate);
      sub = round2(sub + l.amt);
      vat = round2(vat + l.vat);
      wht = round2(wht + l.wht);
    }
    return { sub, vat, wht, total: round2(sub + vat), net: round2(sub + vat - wht) };
  }
  var rateOf;
  var init_invoice_calc = __esm({
    "assets/js/invoices/invoice-calc.js"() {
      init_formatter();
      rateOf = (v, fb) => {
        const n = Number(v);
        return v === null || v === void 0 || v === "" || !Number.isFinite(n) ? fb : n;
      };
    }
  });

  // assets/js/invoices/invoice-doc.js
  var invoice_doc_exports = {};
  __export(invoice_doc_exports, {
    invoiceDocHTML: () => invoiceDocHTML,
    openInvoiceDoc: () => openInvoiceDoc
  });
  function summarize2(inv, items) {
    let vatBase = 0, nonVat = 0;
    for (const it of items) {
      const hasVat = num2(it.vat_amount) > 0 || num2(it.vat_rate) > 0;
      if (hasVat) vatBase = r22(vatBase + num2(it.amount));
      else nonVat = r22(nonVat + num2(it.amount));
    }
    const vat = r22(inv.vat_amount);
    const rates = [...new Set(items.map((it) => num2(it.vat_rate)).filter((x) => x > 0))];
    const vatRate = rates.length === 1 ? rates[0] : num2(inv.vat_rate) || 7;
    const total = r22(vatBase + vat);
    return { vatBase, nonVat, vat, vatRate, total, grand: r22(total + nonVat) };
  }
  function whtRows(items) {
    const by = /* @__PURE__ */ new Map();
    for (const it of items) {
      const rate = num2(it.wht_rate);
      if (rate <= 0) continue;
      by.set(rate, r22((by.get(rate) || 0) + num2(it.wht_amount)));
    }
    const out = [
      { rate: 1, label: "Transportation", amt: by.get(1) || 0 },
      { rate: 3, label: "Service", amt: by.get(3) || 0 }
    ];
    for (const [rate, amt] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
      if (rate !== 1 && rate !== 3) out.push({ rate, label: "Other", amt });
    }
    return out;
  }
  function invoiceDocHTML(inv, { draft = false } = {}) {
    const items = inv.items || [];
    const S = summarize2(inv, items);
    const c = inv.customer || {};
    const j = inv.job || {};
    const D = {
      cusName: inv.customer_name || c.name,
      cusTax: inv.customer_tax_id || c.tax_id,
      cusBranch: inv.customer_branch_code || c.branch_code,
      cusAddr: inv.customer_address || c.address,
      cusTel: inv.customer_phone || c.phone,
      invNo: draft && inv.has_real_no === false ? null : inv.invoice_no,
      invDate: inv.invoice_date,
      jobNo: inv.job_no || j.job_no,
      declNo: inv.customs_declaration_no || j.customs_declaration_no,
      cusPo: inv.customer_job_no || j.customer_job_no,
      master: inv.master_bl_no || j.master_bl_no,
      house: inv.house_bl_no || j.house_bl_no,
      remarks: inv.remarks || inv.job_note || j.note,
      companyInvoice: inv.company_invoice,
      createdBy: inv.created_by_name || inv.issued_by_name
    };
    const rows = items.map((it, i) => {
      const isAdv = num2(it.vat_amount) <= 0 && num2(it.vat_rate) <= 0;
      const amt = num2(it.amount);
      return `<tr>
      <!-- \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C No. \u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Final \u0E15\u0E32\u0E21\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49
           line_no \u0E22\u0E31\u0E07\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E25\u0E30\u0E43\u0E0A\u0E49\u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E15\u0E32\u0E21\u0E40\u0E14\u0E34\u0E21 \u0E40\u0E1E\u0E35\u0E22\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E25\u0E07\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29 -->
      <td class="ivd-desc">${txt2(it.description, "")}</td>
      <td class="r">${isAdv ? "-" : cell3(amt)}</td>
      <td class="r">${isAdv ? cell3(amt) : "-"}</td>
      <td class="r">${cell3(it.unit_price)}</td>
      <td class="r">${cell3(amt)}</td></tr>`;
    }).join("") || '<tr><td colspan="5" class="ivd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>';
    const wht = whtRows(items).map((w) => `<div class="ivd-wl"><span>${w.rate} % ${w.label}</span><span>${money(w.amt)}</span></div>`).join("");
    const sign = (title) => `<div class="ivd-sign">
      <div class="ivd-sign-t">${title}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`;
    return `
    <div class="ivd print-area${draft ? " ivd-draft" : ""}">
      ${draft ? '<div class="ivd-badge">DRAFT</div>' : ""}

      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="ivd-co-ad">${esc(ISSUER.address)}</div>
            <div class="ivd-co-tl">Tel. ${esc(ISSUER.tel)} <i>|</i> Fax. ${esc(ISSUER.fax)}
              <i>|</i> Tax ID ${esc(ISSUER.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r"><div class="ivd-title">INVOICE / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${ic("user")}<div class="ivd-fb"><label>Customer Name</label>
              <div class="v v-b">${txt2(D.cusName)}</div></div></div>
            <div class="ivd-f">${ic("tax")}<div class="ivd-fb ivd-2col">
              <div><label>Tax ID</label><div class="v v-b">${txt2(D.cusTax)}</div></div>
              <div><label>Branch</label><div class="v v-b">${txt2(D.cusBranch)}</div></div>
            </div></div>
            <div class="ivd-f">${ic("pin")}<div class="ivd-fb"><label>Address</label>
              <div class="v">${txt2(D.cusAddr, "")}</div></div></div>
            <div class="ivd-f ivd-f-last">${ic("tel")}<div class="ivd-fb"><label>Tel.</label>
              <div class="v v-b">${txt2(D.cusTel)}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${ic("doc")}<div class="ivd-fb ivd-kv">
              <label>Invoice No.</label><div class="v v-b v-lg">${D.invNo ? esc(D.invNo) : '<span class="v-draft">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 (\u0E23\u0E48\u0E32\u0E07)</span>'}</div></div></div>
            <div class="ivd-f">${ic("cal")}<div class="ivd-fb ivd-kv">
              <label>Date</label><div class="v v-b v-lg">${dmy(D.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${ic("job")}<div class="ivd-fb ivd-kv">
              <label>Job No.</label><div class="v v-b v-lg">${txt2(D.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      <section class="ivd-ref">
        <div class="ivd-rf"><label>Decl No.</label><span>${txt2(D.declNo)}</span></div>
        <div class="ivd-rf"><label>Customer PO</label><span>${txt2(D.cusPo)}</span></div>
        <div class="ivd-rf"><label>Master</label><span>${txt2(D.master)}</span></div>
        <div class="ivd-rf"><label>House</label><span>${txt2(D.house)}</span></div>
      </section>

      <table class="ivd-tbl">
        <colgroup><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-unit"><col class="w-tot"></colgroup>
        <thead><tr>
          <th>Description</th>
          <th class="r">Service<small>(VAT ${S.vatRate}%)</small></th>
          <th class="r">Advance<small>(Non-VAT)</small></th>
          <th class="r">Unit Price</th><th class="r">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="ivd-trow">
          <td class="ivd-trow-l">${ic("sum")}<b>TOTAL</b></td>
          <td class="r">${cell3(S.vatBase)}</td>
          <td class="r">${cell3(S.nonVat)}</td>
          <td></td>
          <td class="r ivd-trow-g">${money(r22(S.vatBase + S.nonVat))}</td>
        </tr></tfoot>
      </table>

      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${txt2(D.remarks, "")}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${txt2(D.companyInvoice, "")}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${S.vatRate} %</span><span>${money(S.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${S.vatRate} %</span><span>${money(S.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${money(S.total)}</span></div>
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${money(S.nonVat)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${money(S.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${wht}</div>
        ${sign("For The Customer")}
        ${sign("For The " + esc(ISSUER.nameEn))}
      </section>

      <footer class="ivd-bar">
        <div>${ic("user")}Created By : <b>${txt2(D.createdBy)}</b></div>
        <div>${ic("print")}Printed Date : <b>${dmy((/* @__PURE__ */ new Date()).toISOString().slice(0, 10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>
    </div>`;
  }
  function openInvoiceDoc(inv, { draft = false, print = false } = {}) {
    const b = document.createElement("div");
    b.innerHTML = invoiceDocHTML(inv, { draft });
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">\u{1F5A8} ${draft ? "Print Draft" : "Print Invoice"}</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;
    openModal({
      title: draft ? "Preview \u2014 \u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49" : "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49",
      body: b,
      footer: f,
      fullscreen: true,
      wide: true
    });
    f.querySelector("#ivd-print").onclick = () => window.print();
    if (print) setTimeout(() => window.print(), 60);
  }
  var cell3, txt2, num2, r22, ICON3, ic;
  var init_invoice_doc = __esm({
    "assets/js/invoices/invoice-doc.js"() {
      init_formatter();
      init_modal();
      init_company_doc();
      cell3 = (n) => n === null || n === void 0 || n === "" || Number(n) === 0 ? "-" : money(n);
      txt2 = (v, fb = "-") => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return esc(s || fb);
      };
      num2 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      r22 = (n) => Math.round((num2(n) + Number.EPSILON) * 100) / 100;
      ICON3 = {
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
        tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',
        tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',
        doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
        cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',
        job: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',
        sum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',
        print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>'
      };
      ic = (k) => `<span class="ivd-ic">${ICON3[k] || ""}</span>`;
    }
  });

  // assets/js/invoices/billing-modal.js
  var billing_modal_exports = {};
  __export(billing_modal_exports, {
    openBillingModal: () => openBillingModal,
    sortByLineNo: () => sortByLineNo,
    validateLineNos: () => validateLineNos
  });
  function validateLineNos(items) {
    const errors = [];
    const seen = /* @__PURE__ */ new Map();
    const dupes = /* @__PURE__ */ new Set();
    items.forEach((it, i) => {
      const raw2 = it.line_no;
      const n = Number(raw2);
      if (raw2 === "" || raw2 == null || !Number.isFinite(n)) {
        errors.push(`\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${i + 1}: \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02`);
        return;
      }
      if (!Number.isInteger(n)) {
        errors.push(`\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${i + 1}: \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E15\u0E47\u0E21`);
        return;
      }
      if (n <= 0) {
        errors.push(`\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${i + 1}: \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0`);
        return;
      }
      if (seen.has(n)) {
        dupes.add(n);
        errors.push(`\u0E25\u0E33\u0E14\u0E31\u0E1A ${n} \u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19 (\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ${seen.get(n) + 1} \u0E41\u0E25\u0E30 ${i + 1})`);
      } else seen.set(n, i);
    });
    return { ok: errors.length === 0, errors: [...new Set(errors)], dupes };
  }
  function sortByLineNo(items) {
    return items.map((it, i) => [it, i]).sort((a, b) => {
      const x = Number(a[0].line_no), y = Number(b[0].line_no);
      const xf = Number.isFinite(x), yf = Number.isFinite(y);
      if (xf && yf) return x - y || a[1] - b[1];
      if (xf) return -1;
      if (yf) return 1;
      return a[1] - b[1];
    }).map((x) => x[0]);
  }
  async function openBillingModal({ jobId, charge, onSaved }) {
    await masters();
    const j = await jobDetail(jobId);
    if (j.invoice_id) {
      toast("\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27", "err");
      return;
    }
    const vatRate = Number(AppState.masters.vat_rate || 7);
    const requestId = newRequestId();
    const kindDefault = (charge || j.charge_type) === "ADVANCE" ? "ADVANCE" : "SERVICE";
    const codeItems = () => serviceCodesFor(kindDefault).map((c) => ({ id: c.code, code: c.code, name: c.description }));
    const newItem = (n) => ({
      line_no: n,
      code: "",
      description: "",
      qty: "",
      price: "",
      amount: "",
      cost: "",
      charge: "",
      charge_kind: kindDefault,
      vat_applicable: true,
      wht_applicable: false
    });
    let items = [newItem(LINE_STEP)];
    const ro = (v) => `<input class="inp" value="${esc(v ?? "")}" readonly disabled>`;
    const b = document.createElement("div");
    b.innerHTML = `
    <div class="jm-sec jm-doc">
      <div class="jm-sec-t">DOCUMENT</div>
      <div class="jm-grid">
        <div class="fld"><label>\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</label>${ro(j.company_invoice)}</div>
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label>${ro(j.customer_name)}</div>
        <div class="fld"><label>Customer Job No.</label>${ro(j.customer_job_no)}</div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32</label>${ro(j.customs_declaration_no)}</div>
      </div>
      <div class="jm-grid">
        <div class="fld"><label>Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 (Source)</label>${ro(j.source_invoice_no)}</div>
        <div class="fld"><label>House B/L No.</label>${ro(j.house_bl_no)}</div>
        <div class="fld"><label>Master B/L No.</label>${ro(j.master_bl_no)}</div>
        <div class="fld"><label>Booking No.</label>${ro(j.booking_no)}</div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E37\u0E2D / Vessel</label>${ro(j.vessel_name)}</div>
        <div class="fld"><label>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49</label>${ro(j.qty_container)}</div>
        <div class="fld"><label>ETD</label>${ro(dmy(j.etd))}</div>
        <div class="fld"><label>ETA</label>${ro(dmy(j.eta))}</div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A</label>${ro(dmy(j.delivery_date))}</div>
      </div>
    </div>

    <div class="jm-sec jm-acc">
      <div class="jm-sec-t">\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 <span class="req">*</span></label>
          <input class="inp" type="date" id="bm-date" value="${ymd(/* @__PURE__ */ new Date())}"></div>
        <div class="fld"><label>Case</label>
          <input class="inp" id="bm-case" value="${esc(j.case_no || "")}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="bm-contact" value="${esc(j.contact || "")}"></div>
        <div class="fld"><label>Credit Term (\u0E27\u0E31\u0E19)</label>
          <input class="inp" type="number" min="0" id="bm-term" value="${j.credit_term_days ?? ""}"
            placeholder="\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="bm-due" value="${j.due_date || ""}"></div>
      </div>
      <div class="jm-hint" id="bm-due-pv">\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date</div>
    </div>

    <div class="jm-sec jm-inv">
      <div class="jm-sec-t">INVOICE</div>
      <div class="row mb-2">
        <button type="button" class="btn btn-p btn-sm" id="bm-add">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
        <button type="button" class="btn btn-o btn-sm" id="bm-sort">\u21C5 \u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A</button>
        <span class="t-xs t-3">\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E25\u0E02\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07 \u201C\u0E25\u0E33\u0E14\u0E31\u0E1A\u201D \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 \u201C\u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E31\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E08\u0E32\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E44\u0E1B\u0E21\u0E32\u0E01</span>
      </div>
      <div class="bm-err" id="bm-err" hidden></div>
      <div class="bm-locked" id="bm-locked" hidden>
        \u0E43\u0E1A\u0E19\u0E35\u0E49 POST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14 UNPOST \u0E01\u0E48\u0E2D\u0E19</div>
      <div class="tbl-wrap bm-wrap"><table class="tbl bm-items">
        <colgroup>
          <col class="c-seq"><col class="c-code"><col class="c-desc"><col class="c-kind">
          <col class="c-qty"><col class="c-price"><col class="c-amount"><col class="c-act">
        </colgroup>
        <thead><tr>
        <th class="center">\u0E25\u0E33\u0E14\u0E31\u0E1A</th><th>CODE</th>
        <th>DESCRIPTION</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
        <th class="r">QTY</th><th class="r">PRICE</th>
        <th class="r">AMOUNT</th><th class="center">\u0E25\u0E1A</th>
      </tr></thead><tbody id="bm-tbody"></tbody></table></div>
      <div class="bm-sum">
        <div class="r-line"><span>Subtotal</span><span id="bm-sub">0.00</span></div>
        <div class="r-line"><span>VAT ${vatRate}%</span><span id="bm-vat">0.00</span></div>
        <div class="r-line"><span>WHT</span><span id="bm-wht">0.00</span></div>
        <div class="r-line total"><span>Grand Total</span><span id="bm-total">0.00</span></div>
      </div>
    </div>`;
    const f = document.createElement("div");
    f.style.display = "contents";
    f.innerHTML = `
    <button class="btn btn-del"  id="bm-del"     hidden>\u{1F5D1} <span>\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07</span></button>
    <button class="btn btn-save" id="bm-draft"          >\u{1F4BE} <span>\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07</span></button>
    <button class="btn btn-view" id="bm-preview" disabled>\u{1F441} <span>Preview</span></button>
    <button class="btn btn-prn"  id="bm-print"   disabled>\u{1F5A8} <span>Print Draft</span></button>
    <button class="btn btn-post" id="bm-post"    disabled>\u2B06 <span>POST</span></button>
    <button class="btn btn-gray" data-close             >\u2715 <span>\u0E1B\u0E34\u0E14</span></button>
    <button class="btn btn-unpost" id="bm-unpost" hidden>\u21A9 <span>UNPOST</span></button>`;
    openModal({ title: "\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", body: b, footer: f, fullscreen: true, wide: true });
    document.querySelector("#nj-modal .modal-f").classList.add("mf-row");
    const mb = document.querySelector("#nj-modal .modal-b");
    if (mb) mb.scrollTop = 0;
    const q2 = (s) => b.querySelector(s);
    const tbody = q2("#bm-tbody");
    function askInline(msg, { reason = false, okLabel = "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19", danger = false } = {}) {
      return new Promise((res) => {
        const bar = document.createElement("div");
        bar.className = "bm-ask" + (danger ? " bm-ask-danger" : "");
        bar.innerHTML = `<div class="bm-ask-msg">${msg}</div>
        ${reason ? '<input class="inp" id="bm-ask-reason" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 (\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19)">' : ""}
        <div class="bm-ask-act">
          <button class="btn btn-gray btn-sm" data-no>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
          <button class="btn ${danger ? "btn-del" : "btn-save"} btn-sm" data-yes>${esc(okLabel)}</button>
        </div>`;
        b.prepend(bar);
        const rIn = bar.querySelector("#bm-ask-reason");
        if (rIn) rIn.focus();
        else bar.querySelector("[data-yes]").focus();
        const done = (v) => {
          bar.remove();
          res(v);
        };
        bar.querySelector("[data-no]").onclick = () => done(null);
        bar.querySelector("[data-yes]").onclick = () => {
          if (reason) {
            const v = (rIn.value || "").trim();
            if (!v) {
              rIn.classList.add("inp-bad");
              rIn.focus();
              return;
            }
            done(v);
          } else done(true);
        };
      });
    }
    const custTerm = () => {
      const c = activeCustomers().find((x) => x.id === j.customer_id) || (AppState.masters.customers || []).find((x) => x.id === j.customer_id);
      return c ? c.credit_term_days : null;
    };
    function updDue() {
      const pv = q2("#bm-due-pv");
      const manual = q2("#bm-due").value;
      if (manual) {
        pv.textContent = "Due Date: " + dmy(manual) + " (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)";
        delete pv.dataset.calc;
        return;
      }
      const base = q2("#bm-date").value;
      const term = q2("#bm-term").value !== "" ? Number(q2("#bm-term").value) : custTerm();
      if (base && term != null) {
        const d = /* @__PURE__ */ new Date(base + "T00:00:00");
        d.setDate(d.getDate() + Number(term));
        pv.textContent = "Due Date (\u0E04\u0E33\u0E19\u0E27\u0E13): " + dmy(ymd(d)) + " \xB7 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 + \u0E40\u0E17\u0E2D\u0E21 " + term + " \u0E27\u0E31\u0E19";
        pv.dataset.calc = ymd(d);
      } else {
        pv.textContent = "\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 + \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32/\u0E40\u0E17\u0E2D\u0E21 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13 Due Date";
        delete pv.dataset.calc;
      }
    }
    ["#bm-date", "#bm-term", "#bm-due"].forEach((s) => q2(s).addEventListener("input", updDue));
    if (q2("#bm-term").value === "" && custTerm() != null) q2("#bm-term").value = custTerm();
    updDue();
    function rowHTML2(it, i, dupes) {
      const num8 = (k, extra = "") => `<input class="inp r" data-k="${k}" type="number" step="0.01" min="0"
      value="${it[k] ?? ""}" ${extra}>`;
      const bad = dupes.has(Number(it.line_no)) ? " inp-bad" : "";
      return `<tr data-i="${i}">
      <td class="center"><input class="inp bm-seq${bad}" data-k="line_no" type="number" min="1" step="1"
        value="${it.line_no ?? ""}"></td>
      <td>${comboboxHTML("bm-code-" + i, codeItems(), it.code || "", "\u0E04\u0E49\u0E19\u0E2B\u0E32 CODE / \u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23", CODE_DISPLAY)}</td>
      <td><input class="inp" data-k="description" value="${esc(it.description || "")}"
        placeholder="\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23"></td>
      <td><select class="sel" data-k="charge_kind">
        <option value="SERVICE" ${it.charge_kind !== "ADVANCE" ? "selected" : ""}>Service</option>
        <option value="ADVANCE" ${it.charge_kind === "ADVANCE" ? "selected" : ""}>Receipt</option>
      </select></td>
      <td>${num8("qty")}</td>
      <td>${num8("price")}</td>
      <td>${num8("amount", "data-calc")}</td>
      <td class="center"><button type="button" class="btn btn-danger-soft btn-sm" data-del title="\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49">\u{1F5D1}</button></td>
    </tr>`;
    }
    function draw() {
      const { dupes } = validateLineNos(items);
      tbody.innerHTML = items.map((it, i) => rowHTML2(it, i, dupes)).join("");
      items.forEach((it, i) => {
        bindCombobox(tbody, "bm-code-" + i, {
          getItems: codeItems,
          display: CODE_DISPLAY,
          codeFirst: true,
          canCreate: false,
          emptyHint: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 SYSTEM > \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
          onChange: (code) => onCodePicked(i, code)
        });
      });
      recalc();
    }
    function onCodePicked(i, code) {
      const tr = tbody.querySelector(`tr[data-i="${i}"]`);
      if (!tr) return;
      const c = serviceCodesFor(kindDefault).find((x) => x.code === code);
      if (!c) {
        recalc();
        return;
      }
      const dsc = tr.querySelector('[data-k="description"]');
      if (!dsc.value.trim() || items[i]?._autoDesc !== false) {
        dsc.value = c.description;
        if (items[i]) items[i]._autoDesc = true;
      }
      if (items[i]) {
        items[i].vat_rate = vatRateOf(c);
        items[i].wht_rate = whtRateOf(c);
        items[i].vat_applicable = items[i].vat_rate > 0;
        items[i].wht_applicable = items[i].wht_rate > 0;
      }
      recalc();
    }
    function readRow(tr, i) {
      const g = (k) => tr.querySelector(`[data-k="${k}"]`);
      const prev = items[i] || {};
      const qty = g("qty").value === "" ? "" : Number(g("qty").value);
      const price = g("price").value === "" ? "" : Number(g("price").value);
      let amount = g("amount").value === "" ? "" : Number(g("amount").value);
      const qtyCalc = qty === "" ? 1 : qty;
      if (price !== "" && prev._autoAmt !== false) {
        amount = Math.round(qtyCalc * price * 100) / 100;
        if (g("amount") !== document.activeElement) g("amount").value = amount;
      }
      items[i] = {
        ...prev,
        line_no: g("line_no").value === "" ? "" : Number(g("line_no").value),
        /* CODE อยู่ใน combobox (ไม่มี data-k) → อ่านจาก .cbx-inp ของแถวนั้น */
        code: comboValue(tr.querySelector(".cbx-inp")) || null,
        description: g("description").value.trim(),
        charge_kind: g("charge_kind").value === "ADVANCE" ? "ADVANCE" : "SERVICE",
        qty,
        price,
        amount: amount === "" ? "" : Number(amount),
        /* Cost / Charge ไม่มีช่องกรอกในตารางแล้ว (ตามสัดส่วนคอลัมน์ที่กำหนด)
           แต่ยังเก็บค่าของแถวไว้และส่งขึ้น RPC เหมือนเดิม — ไม่ล้างข้อมูลทิ้ง */
        cost: prev.cost,
        charge: prev.charge,
        vat_applicable: prev.vat_applicable !== false,
        wht_applicable: !!prev.wht_applicable,
        /* อัตราภาษีของบรรทัด (มาจาก Service Master) — คงไว้ระหว่างพิมพ์/เรียงลำดับ */
        vat_rate: prev.vat_rate,
        wht_rate: prev.wht_rate
      };
      if (amount !== "" && g("amount").value !== "" && Number(g("amount").value) !== amount)
        items[i]._autoAmt = false;
    }
    function showErrors(list) {
      const box = q2("#bm-err");
      if (!list.length) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      box.innerHTML = "<b>\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</b><ul>" + list.map((e) => `<li>${esc(e)}</li>`).join("") + "</ul>";
    }
    function recalc() {
      tbody.querySelectorAll("tr").forEach((tr) => readRow(tr, Number(tr.dataset.i)));
      const priced = items.filter((x) => Number(x.amount) > 0 || x.description);
      const t = calcTotals(priced.map((x) => ({ ...x, amount: Number(x.amount) || 0 })), vatRate);
      q2("#bm-sub").textContent = money(t.sub);
      q2("#bm-vat").textContent = money(t.vat);
      q2("#bm-wht").textContent = money(t.wht);
      q2("#bm-total").textContent = money(t.total);
      showErrors(validateLineNos(items).errors);
      return t;
    }
    tbody.addEventListener("input", (e) => {
      if (e.target.closest('[data-k="description"]')) {
        const i = Number(e.target.closest("tr").dataset.i);
        if (items[i]) items[i]._autoDesc = false;
      }
      if (e.target.closest('[data-k="amount"]')) {
        const i = Number(e.target.closest("tr").dataset.i);
        if (items[i]) items[i]._autoAmt = false;
      }
      recalc();
    });
    tbody.addEventListener("change", () => recalc());
    tbody.addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]");
      if (!del) return;
      const i = Number(del.closest("tr").dataset.i);
      tbody.querySelectorAll("tr").forEach((tr) => readRow(tr, Number(tr.dataset.i)));
      items.splice(i, 1);
      if (!items.length) items.push(newItem(LINE_STEP));
      draw();
    });
    q2("#bm-add").onclick = () => {
      tbody.querySelectorAll("tr").forEach((tr) => readRow(tr, Number(tr.dataset.i)));
      const max = items.reduce((m, x) => Math.max(m, Number(x.line_no) || 0), 0);
      items.push(newItem(Math.floor(max / LINE_STEP) * LINE_STEP + LINE_STEP));
      draw();
      const last = tbody.querySelector('tr:last-child [data-k="description"]');
      if (last) last.focus();
    };
    q2("#bm-sort").onclick = () => {
      tbody.querySelectorAll("tr").forEach((tr) => readRow(tr, Number(tr.dataset.i)));
      const v = validateLineNos(items);
      items = sortByLineNo(items);
      draw();
      toast(v.ok ? "\u0E40\u0E23\u0E35\u0E22\u0E07\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27" : "\u0E40\u0E23\u0E35\u0E22\u0E07\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E21\u0E35\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07", v.ok ? "ok" : "err");
    };
    let draftId = null;
    let invStatus = null;
    const B = (sel) => f.querySelector(sel);
    function applyState(id, status) {
      draftId = id;
      invStatus = status || (id ? "DRAFT" : null);
      const posted = invStatus === "POSTED";
      const hasDoc = !!id;
      B("#bm-del").hidden = posted || !hasDoc;
      B("#bm-draft").hidden = posted;
      B("#bm-post").hidden = posted;
      B("#bm-unpost").hidden = !posted;
      B("#bm-preview").disabled = !hasDoc;
      B("#bm-print").disabled = !hasDoc;
      B("#bm-post").disabled = !hasDoc;
      B("#bm-print").querySelector("span").textContent = posted ? "Print Invoice" : "Print Draft";
      b.querySelectorAll("#bm-tbody input, #bm-tbody select, #bm-add, #bm-sort").forEach((el) => {
        el.disabled = posted;
      });
      const hint = b.querySelector("#bm-locked");
      if (hint) hint.hidden = !posted;
    }
    const setDraftState = (id) => applyState(id, "DRAFT");
    function collect(requireItems) {
      recalc();
      const v = validateLineNos(items);
      if (!v.ok) {
        showErrors(v.errors);
        toast("\u0E41\u0E01\u0E49\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E48\u0E2D\u0E19", "err");
        return null;
      }
      if (!q2("#bm-date").value) {
        toast("\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25", "err");
        return null;
      }
      const ordered = sortByLineNo(items);
      const valid = ordered.filter((x) => x.description && Number(x.amount) > 0);
      const partial = ordered.filter((x) => x.description || Number(x.amount) > 0);
      if (valid.length !== partial.length) {
        toast("\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A (\u0E02\u0E32\u0E14\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19)", "err");
        return null;
      }
      if (requireItems && !valid.length) {
        toast("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
        return null;
      }
      const due = q2("#bm-due").value || q2("#bm-due-pv").dataset.calc || null;
      return {
        job_id: jobId,
        invoice_date: q2("#bm-date").value || null,
        due_date: due,
        /* Contract ของ njacc_save_invoice_draft(p->'items')
           line_no → line_no · qty → qty · price → unit_price · amount → amount
           vat_rate/wht_rate = snapshot ของบรรทัด (มาจาก Service Master ตอนเลือก CODE) */
        items: valid.map((x) => ({
          line_no: Number(x.line_no),
          code: x.code,
          description: x.description,
          qty: x.qty === "" || x.qty == null ? null : Number(x.qty),
          price: x.price === "" || x.price == null ? null : Number(x.price),
          amount: Number(x.amount),
          cost: Number(x.cost) || 0,
          charge: Number(x.charge) || 0,
          charge_kind: x.charge_kind,
          vat_applicable: x.vat_applicable !== false,
          wht_applicable: !!x.wht_applicable,
          vat_rate: x.vat_rate == null || x.vat_rate === "" ? null : Number(x.vat_rate),
          wht_rate: x.wht_rate == null || x.wht_rate === "" ? null : Number(x.wht_rate)
        }))
      };
    }
    async function doSaveDraft(btn2, silent) {
      const p = collect(false);
      if (!p) return null;
      if (btn2) btnBusy(btn2, true);
      try {
        const res = await saveInvoiceDraft(p);
        setDraftState(res.id);
        if (!silent) toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 (" + res.items + " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)", "ok");
        return res;
      } catch (ex) {
        handleErr(ex);
        return null;
      } finally {
        if (btn2) btnBusy(btn2, false);
      }
    }
    f.querySelector("#bm-draft").onclick = (e) => doSaveDraft(e.target, false);
    f.querySelector("#bm-del").onclick = async (e) => {
      if (!draftId) return;
      const reason = await askInline(
        "<b>\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</b> \u2014 \u0E25\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",
        { reason: true, okLabel: "\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07", danger: true }
      );
      if (!reason) return;
      btnBusy(e.target, true);
      try {
        await once("bm-del-" + draftId, () => deleteInvoiceDraft(draftId, reason));
        closeModal();
        toast("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27", "ok");
        if (typeof onSaved === "function") onSaved();
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
    f.querySelector("#bm-unpost").onclick = async (e) => {
      if (!draftId) return;
      const reason = await askInline(
        "<b>UNPOST \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</b> \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02\u0E15\u0E48\u0E2D (\u0E40\u0E25\u0E02 INVOICE \u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49 \xB7 POST \u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E08\u0E30\u0E43\u0E0A\u0E49\u0E40\u0E25\u0E02\u0E40\u0E14\u0E34\u0E21)",
        { reason: true, okLabel: "UNPOST" }
      );
      if (!reason) return;
      btnBusy(e.target, true);
      try {
        await once("bm-unpost-" + draftId, () => unpostToDraft(draftId, reason, newRequestId()));
        await reloadFromBackend();
        toast("UNPOST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49", "ok");
        if (typeof onSaved === "function") onSaved();
      } catch (ex) {
        handleErr(ex);
      } finally {
        btnBusy(e.target, false);
      }
    };
    async function openDraftDoc(btn2, print) {
      if (!await doSaveDraft(btn2, true)) return;
      try {
        const doc = await invoiceDraftView(jobId);
        if (!doc) {
          toast("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07", "err");
          return;
        }
        const m = await Promise.resolve().then(() => (init_invoice_doc(), invoice_doc_exports));
        m.openInvoiceDoc(doc, { draft: true, print });
      } catch (ex) {
        handleErr(ex);
      }
    }
    f.querySelector("#bm-preview").onclick = (e) => openDraftDoc(e.target, false);
    f.querySelector("#bm-print").onclick = (e) => openDraftDoc(e.target, true);
    f.querySelector("#bm-post").onclick = async (e) => {
      const saved = await doSaveDraft(e.target, true);
      if (!saved) return;
      if (!saved.items) {
        toast("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
        return;
      }
      const ok = await askInline(
        `<b>\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19 POST</b> \u2014 ${saved.items} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 Grand Total <b>${money(saved.total_amount)}</b> \u0E1A\u0E32\u0E17<br>\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02 INVOICE \u0E08\u0E23\u0E34\u0E07 \u0E41\u0E25\u0E30\u0E07\u0E32\u0E19\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 <b>` + (kindDefault === "ADVANCE" ? "FINANCE &gt; Advance" : "FINANCE &gt; Receipt") + "</b>",
        { okLabel: "POST" }
      );
      if (!ok) return;
      btnBusy(e.target, true);
      try {
        const res = await once("bm-post-" + saved.id, () => postDraftInvoice(saved.id, requestId));
        await reloadFromBackend();
        toast("POST \u0E41\u0E25\u0E49\u0E27 \u2014 INVOICE " + res.invoice_no, "ok");
        if (typeof onSaved === "function") onSaved();
      } catch (ex) {
        handleErr(ex);
      } finally {
        btnBusy(e.target, false);
      }
    };
    async function reloadFromBackend() {
      try {
        const doc = await invoiceDraftView(jobId);
        if (!doc) {
          applyState(null, null);
          return;
        }
        applyState(doc.id, doc.status);
        if (doc.invoice_date) q2("#bm-date").value = doc.invoice_date;
        if (doc.due_date) q2("#bm-due").value = doc.due_date;
        const list = (doc.items || []).map((x) => ({
          line_no: x.line_no,
          code: x.code,
          description: x.description,
          qty: x.qty ?? "",
          price: x.unit_price ?? "",
          amount: x.amount,
          cost: x.cost,
          charge: x.charge,
          charge_kind: x.charge_kind,
          vat_rate: x.vat_rate,
          wht_rate: x.wht_rate,
          vat_applicable: Number(x.vat_rate) > 0,
          wht_applicable: Number(x.wht_rate) > 0,
          _autoAmt: false,
          _autoDesc: false
        }));
        if (list.length) {
          items = list;
          draw();
        }
        applyState(doc.id, doc.status);
        updDue();
      } catch (ex) {
        handleErr(ex);
      }
    }
    reloadFromBackend();
    draw();
  }
  var LINE_STEP, CODE_DISPLAY;
  var init_billing_modal = __esm({
    "assets/js/invoices/billing-modal.js"() {
      init_job_api();
      init_invoice_api();
      init_invoice_calc();
      init_master_cache();
      init_combobox();
      init_state();
      init_formatter();
      init_modal();
      init_toast();
      init_loading();
      init_error_handler();
      init_request_manager();
      LINE_STEP = 10;
      CODE_DISPLAY = (it) => it ? it.code || "" : "";
    }
  });

  // assets/js/charges/charge-page.js
  var charge_page_exports = {};
  __export(charge_page_exports, {
    render: () => render2
  });
  async function render2(cnt, { charge, group, mode, scope: scopeArg }) {
    const QUEUE_BY_MODE = {
      /* ── document (025) ── งานที่ยังค้างฝั่งเอกสาร = ยังไม่ถูกกด "ปิดงาน"
         เงื่อนไขที่ server: operational_status <> 'CLOSE'
         กด "ปิดงาน" สำเร็จ → operational_status='CLOSE' → หลุดจากคิวนี้ทันที
         และเข้าคิว pending_invoice ของ ACCOUNTING ด้วยฟิลด์เดียวกัน (Job เดิม ID เดิม)
         ไม่ได้ลบแถวจาก DOM เอง — Refresh / Logout / เครื่องใหม่ ก็ไม่กลับมา */
      document: "document",
      accounting: "pending_invoice",
      receipt: "receipt_active",
      advance: "advance_active",
      closed: "closed"
    };
    const queue = QUEUE_BY_MODE[mode] || null;
    const scope = scopeArg || null;
    const st6 = chargeState(charge, group, mode || "document");
    const perms = {
      view: can("view", charge, group),
      create: can("create", charge, group),
      edit: can("edit", charge, group),
      invoice: can("invoice", charge, group),
      void: can("void", charge, group),
      delete: can("delete", charge, group),
      export: can("export", charge, group)
    };
    const accent = (CHARGE_TYPES.find((c) => c.key === charge) || {}).accent || "service";
    const cols = COL_COUNT(charge, mode || "document");
    const key = "charge-" + charge + "-" + group + "-" + (mode || "document");
    const ctx = { charge, group, queue, scope, mode: mode || "document", filters: st6.filters, refresh: () => load() };
    cnt.innerHTML = `
    ${toolbarHTML(charge, group, perms, mode || "document")}
    ${(mode || "document") === "document" ? "" : `<div id="ch-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(KPI_COUNT(charge, mode || "document"))}</div></div>`}
    <div id="ch-filter">${filterBarHTML(st6.filters, st6.options || {}, mode || "document", perms)}</div>
    <div class="tbl-wrap"><table class="tbl tbl-charge"><thead><tr>${headHTML(charge, mode || "document")}</tr></thead>
      <tbody id="ch-tbody"><tr><td colspan="${cols}" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    <div class="card mt-2" id="ch-pgn"></div>`;
    cnt.dataset.chPage = key;
    async function load() {
      const t = nextToken(key);
      try {
        const res = await chargeBundle({
          charge,
          group,
          queue,
          scope,
          filters: st6.filters,
          sort: st6.sort,
          dir: st6.dir,
          page: st6.page,
          size: st6.size,
          withOptions: !st6.options
        });
        if (!isCurrent(key, t)) return;
        if (cnt.dataset.chPage !== key) return;
        const elFilter = cnt.querySelector("#ch-filter");
        const elKpi = cnt.querySelector("#ch-kpi");
        const elBody = cnt.querySelector("#ch-tbody");
        const elPgn = cnt.querySelector("#ch-pgn");
        if (!elFilter || !elBody || !elPgn) return;
        if ((mode || "document") !== "document" && !elKpi) return;
        if (res.filter_options) {
          st6.options = res.filter_options;
          elFilter.innerHTML = filterBarHTML(st6.filters, st6.options, mode || "document", perms);
          bindFilterBar();
        }
        if (elKpi) elKpi.innerHTML = kpiHTML(res.kpi || {}, charge, mode || "document", perms);
        const rows = res.rows || [];
        elBody.innerHTML = rows.length ? rows.map((r) => rowHTML(r, charge, perms, mode || "document")).join("") : `<tr><td colspan="${cols}" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 \u2014 \u0E25\u0E2D\u0E07\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 "+ \u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"</td></tr>`;
        renderPagination(
          elPgn,
          { page: st6.page, size: st6.size, total: res.total || 0 },
          ({ page, size }) => {
            st6.page = page;
            st6.size = size;
            load();
          }
        );
      } catch (e) {
        if (isCurrent(key, t)) handleErr(e);
      }
    }
    function bindFilterBar() {
      const wrap = cnt.querySelector("#ch-filter");
      const fbar = wrap.querySelector("#ch-fbar");
      fbar.oninput = (e) => {
        const el = e.target.closest("[data-f]");
        if (!el) return;
        debounce(key + "-f", () => {
          Object.assign(st6.filters, readFilters(wrap.querySelector("#ch-fbar")));
          st6.page = 1;
          load();
        }, el.dataset.f === "q" ? 300 : 0);
      };
      wrap.querySelector("#ch-clear").onclick = () => {
        Object.keys(st6.filters).forEach((k2) => st6.filters[k2] = "");
        st6.page = 1;
        wrap.innerHTML = filterBarHTML(st6.filters, st6.options || {}, mode || "document", perms);
        bindFilterBar();
        load();
      };
    }
    bindFilterBar();
    cnt.querySelector("thead").addEventListener("click", (e) => {
      const th = e.target.closest("[data-sort]");
      if (!th) return;
      const s = th.dataset.sort;
      if (st6.sort === s) st6.dir = st6.dir === "asc" ? "desc" : "asc";
      else {
        st6.sort = s;
        st6.dir = "desc";
      }
      st6.page = 1;
      load();
    });
    cnt.querySelector("#ch-tbody").addEventListener("click", (e) => {
      const dots = e.target.closest("[data-rowmenu]");
      if (dots) {
        const m = dots.parentElement;
        const wasOpen = m.classList.contains("open");
        cnt.querySelectorAll(".row-menu.open").forEach((x) => x.classList.remove("open"));
        if (!wasOpen) m.classList.add("open");
        return;
      }
      const b = e.target.closest("[data-act]");
      if (!b) return;
      cnt.querySelectorAll(".row-menu.open").forEach((x) => x.classList.remove("open"));
      const act = b.dataset.act, id = b.dataset.id;
      const ALLOW = {
        document: ["view", "close", "delete", "note"],
        accounting: ["bill", "viewinv", "note"],
        advance: ["settle", "viewinv", "note", "apdoc"],
        closed: ["view", "viewinv"]
      };
      const allow = ALLOW[mode || "document"];
      if (allow && !allow.includes(act)) return;
      if (act === "settle") {
        const next = b.dataset.next;
        Promise.resolve().then(() => (init_invoice_api(), invoice_api_exports)).then(async (m) => {
          const ok = await confirmModal(
            "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 Advance",
            "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19 <b>" + esc(next) + "</b>" + (next === "SETTLED" ? "<br>\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B FINANCE &gt; Close Job" : ""),
            "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19"
          );
          if (!ok) return;
          try {
            await once("settle-" + id, () => m.settleAdvance(id, next, null, newRequestId()));
            toast("\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E41\u0E25\u0E49\u0E27", "ok");
            load();
          } catch (ex) {
            handleErr(ex);
          }
        }).catch(handleErr);
        return;
      }
      if (act === "apdoc") {
        const invId = b.dataset.inv;
        if (!invId) return;
        const advSt = b.dataset.adv || null;
        Promise.all([Promise.resolve().then(() => (init_invoice_api(), invoice_api_exports)), Promise.resolve().then(() => (init_advance_doc(), advance_doc_exports))]).then(async ([api, doc]) => {
          const inv = await api.invoiceView(invId);
          doc.openAdvanceDoc(inv, { advanceStatus: advSt });
        }).catch(handleErr);
        return;
      }
      if (act === "view") {
        const src = mode || "document";
        const locked = b.dataset.locked === "1";
        if (src === "document" && !locked) {
          Promise.resolve().then(() => (init_job_form(), job_form_exports)).then((m) => m.openNewJobModal({ charge, group, mode: src, jobId: id, onSaved: () => load() })).catch(handleErr);
        } else {
          location.hash = "#/job/" + id + "?from=" + src;
        }
      } else if (act === "edit") location.hash = "#/job/" + id + "/edit?mode=" + (mode || "document");
      else if (act === "bill") {
        Promise.resolve().then(() => (init_billing_modal(), billing_modal_exports)).then((m) => m.openBillingModal({ jobId: id, charge, onSaved: () => load() })).catch(handleErr);
      } else if (act === "viewinv") location.hash = "#/invoice/" + b.dataset.inv;
      else if (act === "note") editNote(id, b.textContent.trim() === "\uFF0B NOTE" ? "" : b.textContent.trim(), () => load());
      else handleAction(act, id, () => load());
    });
    const tools = cnt.querySelector(".ch-tools");
    if (tools) bindToolMenus(tools);
    cnt.addEventListener("click", (e) => {
      if (cnt.dataset.chPage !== key) return;
      const b = e.target.closest("[data-tool]");
      if (!b) return;
      runTool(b.dataset.tool, ctx);
    });
    const qc = cnt.querySelector("#qc-key");
    if (qc) qc.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runTool("quick-close", ctx);
      }
    });
    load();
  }
  var init_charge_page = __esm({
    "assets/js/charges/charge-page.js"() {
      init_charge_api();
      init_charge_kpi();
      init_charge_filter();
      init_charge_table();
      init_charge_list();
      init_charge_actions();
      init_charge_toolbar();
      init_charge_tools();
      init_pagination();
      init_filters();
      init_permissions();
      init_request_manager();
      init_modal();
      init_toast();
      init_formatter();
      init_error_handler();
      init_charge_groups();
    }
  });

  // assets/js/jobs/job-detail.js
  var job_detail_exports = {};
  __export(job_detail_exports, {
    render: () => render3
  });
  async function render3(cnt, { id, from }) {
    const j = await jobDetail(id);
    const f = (lb, v) => `<div class="fld"><label>${lb}</label><div>${v || "-"}</div></div>`;
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E07\u0E32\u0E19 ${esc(j.job_no)}</h2>${statusBadge(j.operational_status)}</div>
      <div class="row">
        ${can("edit", j.charge_type, j.company_group) && !j.invoice_id && j.operational_status !== "CANCELED" ? `<button class="btn btn-o" id="jd-edit">\u270F \u0E41\u0E01\u0E49\u0E44\u0E02</button>` : ""}
        ${can("invoice", j.charge_type, j.company_group) && !j.invoice_id && j.operational_status !== "CANCELED" ? `<span class="t-xs t-3">\u0E2D\u0E2D\u0E01 Invoice \u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 ACCOUNTING &gt; \u0E1B\u0E38\u0E48\u0E21 \u201C\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u201D</span>` : ""}
        ${j.invoice_id ? `<button class="btn btn-o" id="jd-viewinv">\u0E14\u0E39 INVOICE</button>` : ""}
        <button class="btn btn-o" id="jd-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    <div class="card card-pad">
      <div class="fgrid">
        ${f("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17", chargeLabel(j.charge_type) + " \xB7 " + groupLabel(j.company_group))}
        ${f("\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25", esc(j.data_type))}
        ${f("\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07", dmy(j.reference_date))}
        ${f("\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07", esc(j.reference_no))}
        ${f("\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", esc(j.customer_name))}
        ${f("Customer Job No", esc(j.customer_job_no))}
        ${f("\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice", esc(j.company_invoice))}
        ${f("\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E02\u0E19", esc(j.customs_declaration_no))}
        ${f("Invoice \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07", esc(j.source_invoice_no))}
        ${f("House B/L", esc(j.house_bl_no))}
        ${f("Master B/L", esc(j.master_bl_no))}
        ${f("Booking No", esc(j.booking_no))}
        ${f("Vessel", esc(j.vessel_name))}
        ${f("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E39\u0E49", j.qty_container)}
        ${f("ETD", dmy(j.etd))}
        ${f("ETA", dmy(j.eta))}
        ${f("\u0E27\u0E31\u0E19\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A", dmy(j.delivery_date))}
        ${f("Case", esc(j.case_no))}
        ${f("Contact", esc(j.contact))}
        ${f("CS", esc(j.cs_name))}
        ${f("I BILLING APL", esc(j.i_billing_apl))}
        ${f("Credit Term", j.credit_term_days != null ? j.credit_term_days + " \u0E27\u0E31\u0E19" : "-")}
        ${f("Due Date", dmy(j.due_date))}
        ${f("\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E1A\u0E31\u0E0D\u0E0A\u0E35", j.invoice_id ? "\u0E2D\u0E2D\u0E01 INVOICE \u0E41\u0E25\u0E49\u0E27" : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE")}
      </div>
      <div class="fsec"><div class="fsec-t">\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E19\u0E40\u0E17\u0E19\u0E40\u0E19\u0E2D\u0E23\u0E4C</div>
        ${(j.containers || []).length ? j.containers.map((c) => `<span class="bdg bdg-due-ok" style="margin:2px">${esc(c.container_no)}${c.container_type ? " \xB7 " + esc(c.container_type) : ""}</span>`).join(" ") : '<span class="t-3">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E39\u0E49</span>'}</div>
      <div class="fsec"><div class="fsec-t">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div><div>${esc(j.note) || "-"}</div></div>
    </div>`;
    const src = ["document", "accounting"].includes(from) ? from : null;
    const backHash = src ? "#/" + src + "/" + String(j.charge_type).toLowerCase() : "#/charges/" + j.charge_type + "/" + j.company_group;
    cnt.querySelector("#jd-back").onclick = () => location.hash = backHash;
    const e1 = cnt.querySelector("#jd-edit");
    if (e1) e1.onclick = () => location.hash = "#/job/" + id + "/edit" + (src ? "?mode=" + src : "");
    const e3 = cnt.querySelector("#jd-viewinv");
    if (e3) e3.onclick = () => location.hash = "#/invoice/" + j.invoice_id;
  }
  var init_job_detail = __esm({
    "assets/js/jobs/job-detail.js"() {
      init_job_api();
      init_formatter();
      init_permissions();
      init_charge_groups();
    }
  });

  // assets/js/invoices/invoice-form.js
  var invoice_form_exports = {};
  __export(invoice_form_exports, {
    render: () => render4
  });
  async function render4(cnt, { jobId }) {
    let j = null;
    try {
      j = await jobDetail(jobId);
    } catch (e) {
      handleErr(e);
    }
    if (j && j.invoice_id) {
      location.replace("#/invoice/" + j.invoice_id);
      return;
    }
    const charge = j && j.charge_type || "SERVICE";
    const back = "#/accounting/" + String(charge).toLowerCase();
    cnt.innerHTML = `
    <div class="card card-pad">
      <h3 class="mb-2">\u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E2D\u0E01 Invoice \u0E1C\u0E48\u0E32\u0E19 ACCOUNTING &gt; \u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</h3>
      <p class="t-3 mb-2">
        ${j ? "\u0E07\u0E32\u0E19 <b>" + esc(j.job_no || "") + "</b> " : ""}\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01 Invoice<br>
        \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01 Invoice \u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E41\u0E25\u0E49\u0E27 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E17\u0E38\u0E01\u0E43\u0E1A\u0E1C\u0E48\u0E32\u0E19\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 \u201C\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u201D \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A
      </p>
      <div class="jm-hint mb-2">
        ACCOUNTING &gt; ${esc(charge)} \u2192 \u0E1B\u0E38\u0E48\u0E21 <b>\u0E2D\u0E2D\u0E01\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25</b> \u2192 DOCUMENT \u2192 \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u2192 INVOICE \u2192 \u0E2D\u0E2D\u0E01 Invoice
      </div>
      <div class="row">
        <button class="btn btn-p" id="iv-go">\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32 ACCOUNTING</button>
        ${j ? `<button class="btn btn-o" id="iv-job">\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19</button>` : ""}
      </div>
    </div>`;
    cnt.querySelector("#iv-go").onclick = () => location.hash = back;
    const b2 = cnt.querySelector("#iv-job");
    if (b2) b2.onclick = () => location.hash = "#/job/" + jobId;
  }
  var init_invoice_form = __esm({
    "assets/js/invoices/invoice-form.js"() {
      init_job_api();
      init_formatter();
      init_error_handler();
    }
  });

  // assets/js/invoices/invoice-view.js
  var invoice_view_exports = {};
  __export(invoice_view_exports, {
    render: () => render5
  });
  async function render5(cnt, { id }) {
    const inv = await invoiceView(id);
    const isVoid = inv.status === "VOID";
    const isPosted = inv.status === "POSTED";
    const canPost = can("invoice", inv.charge_type, inv.company_group);
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE ${esc(inv.invoice_no)}</h2>
      ${isVoid ? '<span class="bdg bdg-void">VOID</span>' : payBadge(inv.payment_status)}
      ${isVoid ? "" : `<span class="bdg ${isPosted ? "bdg-paid" : "bdg-due-ok"}">${isPosted ? "POSTED" : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST"}</span>`}</div>
      <div class="row">
        ${!isVoid && canPost && !isPosted ? '<button class="btn btn-p" id="ivv-post">\u21E7 POST</button>' : ""}
        ${!isVoid && canPost && isPosted ? '<button class="btn btn-o" id="ivv-unpost">\u21E9 UNPOST</button>' : ""}
        <button class="btn btn-print" id="ivv-print">\u{1F5A8} ${isPosted ? "Print Invoice" : "Print Draft"}</button>
        ${!isVoid && can("void", inv.charge_type, inv.company_group) && Number(inv.paid) === 0 ? '<button class="btn btn-danger-soft" id="ivv-void">\u{1F5D1} Void</button>' : ""}
        <button class="btn btn-o" id="ivv-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div></div>
    ${invoiceDocHTML(inv, { draft: false })}
    ${isVoid ? `<div class="card card-pad mt-2 t-sm" style="color:var(--red-600)">VOID \u0E40\u0E21\u0E37\u0E48\u0E2D: ${dmy(inv.voided_at)} \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25: ${esc(inv.void_reason || "-")}</div>` : ""}
    ${Number(inv.paid) > 0 ? `<div class="card card-pad mt-2 iv-paid-note"><div class="r-line"><span>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27</span><span class="money-pos">${money(inv.paid)}</span></div><div class="r-line"><span>\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</span><span class="money-neg">${money(inv.total_amount - inv.paid)}</span></div></div>` : ""}`;
    cnt.querySelector("#ivv-back").onclick = () => location.hash = "#/charges/" + inv.charge_type + "/" + inv.company_group;
    cnt.querySelector("#ivv-print").onclick = () => window.print();
    const pb = cnt.querySelector("#ivv-post");
    if (pb) pb.onclick = async () => {
      const ok = await confirmModal(
        "POST INVOICE " + inv.invoice_no,
        "\u0E40\u0E21\u0E37\u0E48\u0E2D POST \u0E41\u0E25\u0E49\u0E27\u0E07\u0E32\u0E19\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 <b>" + (inv.charge_type === "ADVANCE" ? "FINANCE &gt; Advance (\u0E23\u0E2D\u0E08\u0E48\u0E32\u0E22/\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C)" : "FINANCE &gt; Receipt (\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30)") + "</b><br>\u0E41\u0E25\u0E30\u0E2B\u0E25\u0E38\u0E14\u0E08\u0E32\u0E01\u0E04\u0E34\u0E27\u0E23\u0E2D\u0E2D\u0E2D\u0E01 Invoice",
        "POST"
      );
      if (!ok) return;
      try {
        const res = await once("post-inv-" + id, () => postInvoice(id, newRequestId()));
        toast("POST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27 " + (res && res.queue === "advance_active" ? "Advance" : "Receipt"), "ok");
        render5(cnt, { id });
      } catch (e) {
        handleErr(e);
      }
    };
    const ub = cnt.querySelector("#ivv-unpost");
    if (ub) ub.onclick = async () => {
      const reason = await reasonModal("UNPOST INVOICE " + inv.invoice_no + " (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");
      if (!reason) return;
      try {
        await once("unpost-inv-" + id, () => unpostInvoice(id, reason, newRequestId()));
        toast("UNPOST \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30 ISSUED", "ok");
        render5(cnt, { id });
      } catch (e) {
        handleErr(e);
      }
    };
    const vb = cnt.querySelector("#ivv-void");
    if (vb) vb.onclick = async () => {
      const reason = await reasonModal("Void INVOICE " + inv.invoice_no + " (\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25)");
      if (!reason) return;
      try {
        await once("void-inv-" + id, () => voidInvoice(id, reason, newRequestId()));
        toast("Void INVOICE \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E07\u0E32\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 INVOICE", "ok");
        render5(cnt, { id });
      } catch (e) {
        handleErr(e);
      }
    };
  }
  var init_invoice_view = __esm({
    "assets/js/invoices/invoice-view.js"() {
      init_invoice_api();
      init_formatter();
      init_invoice_doc();
      init_permissions();
      init_modal();
      init_toast();
      init_error_handler();
      init_request_manager();
    }
  });

  // assets/js/receipts/receipt-api.js
  var listReceipts, voidReceipt;
  var init_receipt_api = __esm({
    "assets/js/receipts/receipt-api.js"() {
      init_supabase_client();
      listReceipts = (a) => rpc("njacc_list_receipts", a);
      voidReceipt = (id, reason, requestId) => rpc("njacc_void_receipt", { p_id: id, p_reason: reason, p_request_id: requestId });
    }
  });

  // assets/js/receipts/receipt-doc.js
  function splitInvoices(list) {
    const shown = [], excluded = [];
    for (const iv of list || []) {
      if (String(iv.charge_type || "SERVICE").toUpperCase() === "ADVANCE") excluded.push(iv);
      else shown.push(iv);
    }
    return { shown, excluded };
  }
  function grossOf(iv) {
    const invTotal = num3(iv.total_amount);
    if (invTotal <= 0 || iv.subtotal === void 0 || iv.subtotal === null) return null;
    const net = r23(invTotal - num3(iv.wht_amount));
    if (net <= 0) return null;
    return { ratio: num3(iv.amount) / net, net };
  }
  function summarize3(shown) {
    let total = 0, sub = 0, vat = 0, wht = 0, gross = 0, hasTax = false;
    const rates = /* @__PURE__ */ new Set();
    const whtBy = /* @__PURE__ */ new Map();
    for (const iv of shown) {
      const alloc = num3(iv.amount);
      total = r23(total + alloc);
      const g = grossOf(iv);
      if (!g) continue;
      hasTax = true;
      gross = r23(gross + num3(iv.total_amount) * g.ratio);
      sub = r23(sub + num3(iv.subtotal) * g.ratio);
      vat = r23(vat + num3(iv.vat_amount) * g.ratio);
      const w = r23(num3(iv.wht_amount) * g.ratio);
      wht = r23(wht + w);
      if (num3(iv.vat_rate) > 0) rates.add(num3(iv.vat_rate));
      const bd = Array.isArray(iv.wht_breakdown) ? iv.wht_breakdown : null;
      if (bd && bd.length) {
        for (const b of bd) {
          const amt = r23(num3(b.amount) * g.ratio);
          if (amt === 0) continue;
          const k = b.rate === null || b.rate === void 0 || b.rate === "" ? null : num3(b.rate);
          whtBy.set(k, r23((whtBy.get(k) || 0) + amt));
        }
      } else if (w !== 0) {
        const k = iv.wht_rate === null || iv.wht_rate === void 0 || iv.wht_rate === "" ? null : num3(iv.wht_rate);
        whtBy.set(k, r23((whtBy.get(k) || 0) + w));
      }
    }
    const vatRate = rates.size === 1 ? [...rates][0] : rates.size === 0 ? 0 : null;
    const wKeys = [...whtBy.keys()];
    const whtRate = wKeys.length === 1 && wKeys[0] !== null ? wKeys[0] : null;
    const grossTotal = hasTax ? gross : total;
    return {
      total,
      sub,
      vat,
      wht,
      hasTax,
      vatRate,
      whtRate,
      whtBy,
      grossTotal,
      received: total
    };
  }
  function receiptDocHTML(r) {
    const { shown, excluded } = splitInvoices(r.invoices);
    const S = summarize3(shown);
    const isVoid = String(r.status || "").toUpperCase() === "VOID";
    const refTop = shown.length === 0 ? "-" : shown.length === 1 ? esc(shown[0].invoice_no || "-") : "Multiple (See Below) / \u0E2B\u0E25\u0E32\u0E22\u0E43\u0E1A (\u0E14\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)";
    const rows = shown.map((iv, i) => `<tr>
      <td class="rcd-no">${i + 1}</td>
      <td class="rcd-inv">${txt3(iv.invoice_no)}</td>
      <td class="rcd-dt">${iv.invoice_date ? dmy(iv.invoice_date) : "-"}</td>
      <td class="rcd-ds">${txt3(iv.description, "-")}</td>
      <td class="r">${(() => {
      const g = grossOf(iv);
      return money(g ? r23(num3(iv.total_amount) * g.ratio) : iv.amount);
    })()}</td></tr>`).join("") || '<tr><td colspan="5" class="rcd-empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td></tr>';
    const vatLbl = !S.hasTax || S.vatRate === null ? "" : `${S.vatRate} %`;
    const whtLbl = !S.hasTax || S.whtRate === null ? "" : `${S.whtRate} %`;
    const whtEntries = [...(S.whtBy || /* @__PURE__ */ new Map()).entries()];
    const pctTxt = (k) => k === null ? "" : " " + (Number.isInteger(k) ? String(k) : String(r23(k))) + " %";
    const whtLines = !S.hasTax ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>` : whtEntries.length === 0 ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${money(0)}</span></div>` : whtEntries.length === 1 ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${esc(pctTxt(whtEntries[0][0]))}</span>
                 <span>-${money(whtEntries[0][1])}</span></div>` : whtEntries.sort((a, b) => (a[0] ?? 1e9) - (b[0] ?? 1e9)).map(([k, v]) => `<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${esc(pctTxt(k))}</span><span>-${money(v)}</span></div>`).join("") + `<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${money(S.wht)}</span></div>`;
    const m = (v) => S.hasTax ? money(v) : "-";
    return `
    <div class="rcd print-area${isVoid ? " rcd-void" : ""}">
      ${isVoid ? '<div class="rcd-badge">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>' : ""}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="rcd-co-ad">${esc(ISSUER.address)}</div>
            <div class="rcd-co-tl">Tel. ${esc(ISSUER.tel)} <i>|</i> Fax. ${esc(ISSUER.fax)}
              <i>|</i> Tax ID ${esc(ISSUER.taxId)}</div>
          </div>
        </div>
        <div class="rcd-head-r">
          <div class="rcd-title">RECEIPT /<br>\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19</div>
          <div class="rcd-sub">TAX INVOICE / \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35</div>
        </div>
      </header>

      <section class="rcd-cards">
        <div class="rcd-card">
          <div class="rcd-card-t">${ic2("user")}CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${ic2("user")}<div class="rcd-fb">
              <label>Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32:</label>
              <div class="v v-b">${txt3(r.customer_name)}</div></div></div>
            <div class="rcd-f">${ic2("tax")}<div class="rcd-fb rcd-2col">
              <div><label>Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35:</label>
                <div class="v v-b">${txt3(r.customer_tax_id)}</div></div>
              <div><label>Branch / \u0E2A\u0E32\u0E02\u0E32:</label>
                <div class="v v-b">${txt3(r.customer_branch_code)}</div></div>
            </div></div>
            <div class="rcd-f">${ic2("pin")}<div class="rcd-fb">
              <label>Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48:</label>
              <div class="v">${txt3(r.customer_address, "")}</div></div></div>
            <div class="rcd-f rcd-f-last">${ic2("tel")}<div class="rcd-fb">
              <label>Tel. / \u0E42\u0E17\u0E23.:</label>
              <div class="v v-b">${txt3(r.customer_phone)}</div></div></div>
          </div>
        </div>
        <div class="rcd-card">
          <div class="rcd-card-t">${ic2("rc")}RECEIPT DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${ic2("rc")}<div class="rcd-fb rcd-kv">
              <label>Receipt No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${txt3(r.receipt_no)}</div></div></div>
            <div class="rcd-f">${ic2("cal")}<div class="rcd-fb rcd-kv">
              <label>Receipt Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08:</label>
              <div class="v v-b v-lg">${dmy(r.receipt_date)}</div></div></div>
            <div class="rcd-f rcd-f-last">${ic2("ref")}<div class="rcd-fb">
              <label>Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49:</label>
              <div class="v v-b v-md">${refTop}</div></div></div>
          </div>
        </div>
      </section>

      <section class="rcd-tblwrap">
        <div class="rcd-tbl-t">INVOICE REFERENCE / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div>
        <table class="rcd-tbl">
          <colgroup><col class="w-no"><col class="w-inv"><col class="w-dt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="c">No.</th>
            <th>Invoice No. /<small>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</small></th>
            <th>Invoice Date /<small>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</small></th>
            <th>Description /<small>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</small></th>
            <th class="r">Amount (THB) /<small>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)</small></th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="rcd-trow">
            <td colspan="4" class="r">Total Amount / \u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</td>
            <!-- FIX: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 GROSS \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C Amount \u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27
                 \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E34\u0E21\u0E43\u0E0A\u0E49 S.total \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E08\u0E23\u0E34\u0E07 (\u0E2B\u0E31\u0E01 WHT \u0E41\u0E25\u0E49\u0E27)
                 -> \u0E41\u0E16\u0E27\u0E23\u0E27\u0E21 1,605.00 \u0E41\u0E15\u0E48 Footer \u0E42\u0E0A\u0E27\u0E4C 1,560.00 \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07
                 S.grossTotal = \u03A3 (invoice.total_amount \xD7 ratio) \u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07
                 = \u0E1C\u0E25\u0E23\u0E27\u0E21 Amount \u0E02\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E40\u0E1B\u0E4A\u0E30 \u0E46
                 *** AMOUNT RECEIVED \u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19 Net Cash \u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 *** -->
            <td class="r rcd-trow-g">${money(S.grossTotal)}</td>
          </tr></tfoot>
        </table>
        ${excluded.length ? `<div class="rcd-note">* \u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22 (Advance) \u0E08\u0E33\u0E19\u0E27\u0E19
          ${excluded.length} \u0E43\u0E1A \u2014 \u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Advance \u0E41\u0E22\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01</div>` : ""}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${ic2("abc")}<span>Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</span></div>
          <div class="rcd-w-v">(${esc(bahtText(S.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${vatLbl ? " " + vatLbl : ""}</span><span>${m(S.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${vatLbl ? " " + vatLbl : ""}</span><span>${m(S.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${money(S.grossTotal)}</span></div>
          ${whtLines}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E2A\u0E38\u0E17\u0E18\u0E34</i></span>
            <span>${money(S.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`;
  }
  function openReceiptDoc(r, { print = false } = {}) {
    const b = document.createElement("div");
    b.innerHTML = receiptDocHTML(r);
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">\u{1F5A8} Print Receipt</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;
    openModal({
      title: "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 " + (r.receipt_no || ""),
      body: b,
      footer: f,
      fullscreen: true,
      wide: true
    });
    f.querySelector("#rcd-print").onclick = () => window.print();
    if (print) setTimeout(() => window.print(), 60);
  }
  var txt3, num3, r23, ICON4, ic2;
  var init_receipt_doc = __esm({
    "assets/js/receipts/receipt-doc.js"() {
      init_formatter();
      init_modal();
      init_baht_text();
      init_company_doc();
      txt3 = (v, fb = "-") => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return esc(s || fb);
      };
      num3 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      r23 = (n) => Math.round((num3(n) + Number.EPSILON) * 100) / 100;
      ICON4 = {
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
        tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',
        tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',
        rc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',
        cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',
        ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
        abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>'
      };
      ic2 = (k) => `<span class="rcd-ic">${ICON4[k] || ""}</span>`;
    }
  });

  // assets/js/receipts/receipt-form.js
  function renderReceiptDoc(r) {
    openReceiptDoc(r);
  }
  var init_receipt_form = __esm({
    "assets/js/receipts/receipt-form.js"() {
      init_receipt_doc();
    }
  });

  // assets/js/receipts/receipt-page.js
  var receipt_page_exports = {};
  __export(receipt_page_exports, {
    render: () => render6
  });
  async function render6(cnt) {
    await masters();
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 / \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</h2></div>
      ${can("receive_payment") ? '<button class="btn btn-p" id="rc-new">+ \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</button>' : ""}</div>
    <div class="rep-tabs">
      <button class="rep-tab ${tab === "pending" ? "active" : ""}" data-rtab="pending">\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</button>
      <button class="rep-tab ${tab === "issued" ? "active" : ""}" data-rtab="issued">\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27</button>
    </div>
    <div id="rc-pending" ${tab === "pending" ? "" : "hidden"}>
      <div class="fbar">
        <input class="inp" data-pf="q" value="${esc(pst.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19">
        <button class="btn btn-o btn-sm" id="rp-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</th><th>Customer Job No.</th>
        <th>Due Date</th><th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div><div class="card mt-2" id="rp-pgn"></div>
    </div>
    <div id="rc-issued" ${tab === "issued" ? "" : "hidden"}>
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="rc-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A</th><th>INVOICE \u0E17\u0E35\u0E48\u0E15\u0E31\u0E14</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rc-pgn"></div>
    </div>`;
    cnt.querySelector(".rep-tabs").addEventListener("click", (e) => {
      const b2 = e.target.closest("[data-rtab]");
      if (!b2 || b2.dataset.rtab === tab) return;
      tab = b2.dataset.rtab;
      render6(cnt);
    });
    const pq = cnt.querySelector('[data-pf="q"]');
    if (pq) cnt.querySelector("#rp-go").onclick = () => {
      pst.q = pq.value.trim();
      pst.page = 1;
      loadPending(cnt);
    };
    if (tab === "pending") loadPending(cnt);
    const nb = cnt.querySelector("#rc-new");
    if (nb) nb.onclick = () => location.hash = "#/receipts/new";
    async function load() {
      const t = nextToken("receipts");
      try {
        const res = await listReceipts({
          p_customer: st.customer || null,
          p_from: st.from || null,
          p_to: st.to || null,
          p_page: st.page,
          p_size: st.size
        });
        if (!isCurrent("receipts", t)) return;
        const tb = cnt.querySelector("#rc-tbody");
        const rows = res.rows || [];
        tb.innerHTML = rows.length ? rows.map((r) => `<tr>
        <td class="t-b">${esc(r.receipt_no)}</td><td>${dmy(r.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name)}</td>
        <td>${esc(r.method || "-")}</td>
        <td class="r t-b">${money(r.total_received)}</td>
        <td class="t-xs">${(r.invoices || []).map((i) => esc(i.invoice_no)).join(", ")}</td>
        <td>${r.status === "VOID" ? '<span class="bdg bdg-void">VOID</span>' : '<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(r).replace(/'/g, "&#39;")}'>\u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${r.status !== "VOID" && (isAdmin() || can("void")) ? `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(r.receipt_no)}">Void</button>` : ""}
        </div></td></tr>`).join("") : '<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</td></tr>';
        renderPagination(
          cnt.querySelector("#rc-pgn"),
          { page: st.page, size: st.size, total: res.total || 0 },
          ({ page, size }) => {
            st.page = page;
            st.size = size;
            load();
          }
        );
      } catch (e) {
        if (isCurrent("receipts", t)) handleErr(e);
      }
    }
    cnt.querySelector("#rc-go").onclick = () => {
      cnt.querySelectorAll("[data-f]").forEach((el) => st[el.dataset.f] = el.value);
      st.page = 1;
      load();
    };
    cnt.querySelector("#rc-tbody").addEventListener("click", async (e) => {
      const pb = e.target.closest("[data-print]");
      if (pb) {
        renderReceiptDoc(JSON.parse(pb.dataset.print));
        return;
      }
      const vb = e.target.closest("[data-void]");
      if (vb) {
        const reason = await reasonModal("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 " + vb.dataset.no + " (\u0E08\u0E30 Void \u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E14\u0E49\u0E27\u0E22)");
        if (!reason) return;
        try {
          await once("void-rc-" + vb.dataset.void, () => voidReceipt(vb.dataset.void, reason, newRequestId()));
          toast("Void \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E02\u0E2D\u0E07 INVOICE \u0E16\u0E39\u0E01\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48", "ok");
          load();
        } catch (ex) {
          handleErr(ex);
        }
      }
    });
    load();
  }
  async function loadPending(cnt) {
    const tb = cnt.querySelector("#rp-tbody");
    if (!tb) return;
    const t = nextToken("rc-pending");
    try {
      const res = await receiptPending({
        company_group: "NJ",
        q: pst.q || null,
        customer_id: pst.customer || null,
        page: pst.page,
        size: pst.size
      });
      if (!isCurrent("rc-pending", t)) return;
      const rows = res && res.rows || [];
      tb.innerHTML = rows.map((r) => `<tr>
      <td class="t-b">${esc(r.invoice_no || "-")}</td>
      <td class="nowrap">${dmy(r.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${esc(r.customer_name || "")}">${esc(r.customer_name || "-")}</td>
      <td>${esc(r.job_no || "-")}</td>
      <td>${esc(r.customer_job_no || "-")}</td>
      <td class="nowrap">${dmy(r.due_date)}</td>
      <td class="r">${money(Number(r.total_amount) - Number(r.wht_amount))}</td>
      <td class="r t-b">${money(r.outstanding)}</td>
      <td class="center"><button class="btn btn-o btn-sm" data-inv="${esc(r.invoice_id)}">\u0E14\u0E39 INVOICE</button></td>
    </tr>`).join("") || '<tr><td colspan="9" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</td></tr>';
      tb.querySelectorAll("[data-inv]").forEach((b) => {
        b.onclick = () => location.hash = "#/invoice/" + b.dataset.inv;
      });
      renderPagination(cnt.querySelector("#rp-pgn"), {
        page: res.page,
        size: res.size,
        total: res.total,
        onGo: (p) => {
          pst.page = p;
          loadPending(cnt);
        }
      });
    } catch (e) {
      if (isCurrent("rc-pending", t)) handleErr(e);
    }
  }
  var st, tab, pst;
  var init_receipt_page = __esm({
    "assets/js/receipts/receipt-page.js"() {
      init_receipt_api();
      init_charge_api();
      init_master_cache();
      init_formatter();
      init_permissions();
      init_pagination();
      init_modal();
      init_toast();
      init_error_handler();
      init_request_manager();
      init_receipt_form();
      st = { customer: "", from: "", to: "", page: 1, size: 20 };
      tab = "pending";
      pst = { customer: "", q: "", page: 1, size: 20 };
    }
  });

  // assets/js/finance/credit-note-api.js
  function isBackendMissing(e) {
    const m = String(e && (e.message || e.hint || e.details) || "");
    return /PGRST202/i.test(m) || /Could not find the function/i.test(m) || /schema cache/i.test(m) && /njacc_(credit_note|save_credit|post_credit|list_credit|void_credit|delete_credit)/i.test(m);
  }
  function cnErrMessage(e) {
    const m = String(e && e.message || "");
    for (const k in CN_ERR) if (m.includes(k)) return CN_ERR[k];
    return m || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14";
  }
  var cnInvoiceOptions, cnSource, cnSaveDraft, cnPost, cnView, cnList, cnDeleteDraft, cnVoid, CN_ERR;
  var init_credit_note_api = __esm({
    "assets/js/finance/credit-note-api.js"() {
      init_supabase_client();
      cnInvoiceOptions = (p) => rpc("njacc_credit_note_invoice_options", { p });
      cnSource = (invoiceId) => rpc("njacc_credit_note_source", { p_invoice: invoiceId });
      cnSaveDraft = (payload2) => rpc("njacc_save_credit_note_draft", { p: payload2 });
      cnPost = (id, requestId) => rpc("njacc_post_credit_note", { p_id: id, p_request_id: requestId });
      cnView = (id) => rpc("njacc_credit_note_view", { p_id: id });
      cnList = (p) => rpc("njacc_list_credit_notes", { p });
      cnDeleteDraft = (id, reason) => rpc("njacc_delete_credit_note_draft", { p_id: id, p_reason: reason });
      cnVoid = (id, reason, requestId) => rpc("njacc_void_credit_note", { p_id: id, p_reason: reason, p_request_id: requestId });
      CN_ERR = {
        NJACC_CN_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E1A\u0E19\u0E35\u0E49",
        NJACC_CN_NOT_DRAFT: "\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27",
        NJACC_CN_NOT_POSTED: "Void \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",
        NJACC_CN_ALREADY_POSTED: "\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49 POST \u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",
        NJACC_CN_REASON_REQUIRED: "\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E01\u0E48\u0E2D\u0E19",
        NJACC_CN_INVOICE_NOT_CREDITABLE: "INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01)",
        NJACC_CN_INVOICE_MISMATCH: "\u0E23\u0E48\u0E32\u0E07\u0E19\u0E35\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A INVOICE \u0E04\u0E19\u0E25\u0E30\u0E43\u0E1A",
        NJACC_CN_ITEM_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E43\u0E19 INVOICE",
        NJACC_CN_ITEM_NOT_IN_INVOICE: "\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19 INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49",
        NJACC_CN_ITEM_DUPLICATE: "\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19\u0E43\u0E19\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49",
        NJACC_CN_AMOUNT_INVALID: "\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0",
        NJACC_CN_EXCEEDS_CREDITABLE: "\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E25\u0E14\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E2B\u0E49"
      };
    }
  });

  // assets/js/finance/credit-note-doc.js
  function summarize4(items) {
    let sub = 0, vat = 0, tot = 0;
    const rates = /* @__PURE__ */ new Set();
    for (const it of items) {
      sub = r24(sub + num4(it.amount));
      vat = r24(vat + num4(it.vat_amount));
      tot = r24(tot + num4(it.credit_amount));
      rates.add(num4(it.vat_rate));
    }
    const vatRate = rates.size === 1 ? [...rates][0] : null;
    return { sub, vat, total: tot, vatRate };
  }
  function creditNoteDocHTML(cn) {
    const items = cn.items || [];
    const S = summarize4(items);
    const c = cn.customer || {};
    const inv = cn.invoice || {};
    const invItems = cn.invoice_items || [];
    const st6 = String(cn.status || "").toUpperCase();
    const isDraft = st6 === "DRAFT";
    const isVoid = st6 === "VOID";
    const noRaw = String(cn.credit_note_no || "");
    const cnNo = isDraft || /^CNDRAFT-/.test(noRaw) ? null : noRaw;
    const isTaxDoc = S.vat > 0;
    const invRows = invItems.length ? invItems.map((it, i) => `<tr>
        <td class="cnd-c cnd-dim">${it.line_no ?? i + 1}</td>
        <td class="cnd-c cnd-b">${txt4(inv.invoice_no)}</td>
        <td class="cnd-c">${dmy(inv.invoice_date)}</td>
        <td class="cnd-ds">${txt4(it.description, "-")}</td>
        <td class="cnd-r">${money(it.amount)}</td>
      </tr>`).join("") : '<tr><td colspan="5" class="cnd-empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</td></tr>';
    const invTotal = invItems.reduce((s, it) => r24(s + num4(it.amount)), 0);
    const hasOrig = items.some((it) => it.original_amount !== null && it.original_amount !== void 0);
    const corrOf = (it) => it.correct_amount === null || it.correct_amount === void 0 ? null : num4(it.correct_amount);
    let tOrig = 0, tCorr = 0, tCorrOk = true;
    for (const it of items) {
      if (it.original_amount === null || it.original_amount === void 0) continue;
      tOrig = r24(tOrig + num4(it.original_amount));
      const c2 = corrOf(it);
      if (c2 === null) tCorrOk = false;
      else tCorr = r24(tCorr + c2);
    }
    const cnRows = items.length ? items.map((it, i) => {
      const hasO = it.original_amount !== null && it.original_amount !== void 0;
      const corr = corrOf(it);
      return `<tr>
        <td class="cnd-c cnd-dim">${it.line_no ?? i + 1}</td>
        <td class="cnd-ds">${txt4(it.description, "-")}</td>
        <td class="cnd-r">${hasO ? money(it.original_amount) : "-"}</td>
        <td class="cnd-r">${corr === null ? "-" : money(corr)}</td>
        <td class="cnd-r cnd-df">${money(it.amount)}</td>
        <td class="cnd-c">${esc(pct(it.vat_rate))}</td>
        <td class="cnd-r">${money(it.vat_amount)}</td>
        <td class="cnd-r cnd-cr">${money(it.credit_amount)}</td>
      </tr>`;
    }).join("") : '<tr><td colspan="8" class="cnd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>';
    const vatLbl = S.vatRate === null ? "VAT / \u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21" : `VAT ${pct(S.vatRate)} / \u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 ${pct(S.vatRate)}`;
    const vatLblShort = S.vatRate === null ? "Total VAT / \u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21" : "Total VAT / \u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21";
    return `
    <div class="cnd print-area${isVoid ? " cnd-void" : ""}${isDraft ? " cnd-draft" : ""}">
      ${isVoid ? '<div class="cnd-badge cnd-badge-v">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>' : ""}
      ${isDraft ? '<div class="cnd-badge cnd-badge-d">DRAFT / \u0E23\u0E48\u0E32\u0E07 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</div>' : ""}

      <header class="cnd-head">
        <div class="cnd-head-l">
          <img class="cnd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="cnd-co">
            <div class="cnd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="cnd-co-ad">${esc(ISSUER.address)}</div>
            <div class="cnd-co-tl">
              ${ic3("tel")} ${esc(ISSUER.tel)} <i>|</i>
              ${ic3("doc")} ${esc(ISSUER.fax)} <i>|</i>
              Tax ID: ${esc(ISSUER.taxId)}
            </div>
          </div>
        </div>
        <div class="cnd-head-r">
          <div class="cnd-title">CREDIT NOTE</div>
          <div class="cnd-title-th">\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div>
          ${isTaxDoc ? '<div class="cnd-chip">TAX INVOICE <i>/</i> \u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35</div>' : ""}
        </div>
      </header>
      <div class="cnd-band"></div>

      <section class="cnd-grid">
        <div class="cnd-box">
          <div class="cnd-box-t">${bub2("user")}<span>CUSTOMER / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f">${ic3("user")}
              <div class="cnd-f-b"><div class="cnd-l">Customer Name / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</div>
                <div class="cnd-v cnd-v-b">${txt4(c.name)}</div></div></div>
            <div class="cnd-f cnd-f-2">${ic3("id")}
              <div class="cnd-f-b"><div class="cnd-l">Tax ID / \u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</div>
                <div class="cnd-v">${txt4(c.tax_id)}</div></div>
              <div class="cnd-f-b cnd-f-br"><div class="cnd-l">Branch / \u0E2A\u0E32\u0E02\u0E32</div>
                <div class="cnd-v">${txt4(c.branch_code)}</div></div></div>
            <div class="cnd-f">${ic3("pin")}
              <div class="cnd-f-b"><div class="cnd-l">Address / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</div>
                <div class="cnd-v cnd-v-ml">${txt4(c.address)}</div></div></div>
            <div class="cnd-f cnd-f-last">${ic3("tel")}
              <div class="cnd-f-b"><div class="cnd-l">Tel. / \u0E42\u0E17\u0E23.</div>
                <div class="cnd-v cnd-v-b">${txt4(c.phone)}</div></div></div>
          </div>
        </div>

        <div class="cnd-box">
          <div class="cnd-box-t">${bub2("doc")}<span>CREDIT NOTE DETAILS / \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f cnd-f-kv">${ic3("doc")}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv">${cnNo ? esc(cnNo) : '<span class="cnd-pend">\u0E23\u0E2D\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E15\u0E2D\u0E19 POST</span>'}</div></div>
            <div class="cnd-f cnd-f-kv">${ic3("cal")}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv cnd-kv-s">${dmy(cn.credit_note_date)}</div></div>
            <div class="cnd-f cnd-f-kv">${ic3("cal")}
              <div class="cnd-f-b"><div class="cnd-l">Invoice Reference / \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</div></div>
              <div class="cnd-kv cnd-kv-s">${txt4(inv.invoice_no)}</div></div>
            <div class="cnd-f cnd-f-last">${ic3("note")}
              <div class="cnd-f-b"><div class="cnd-l">Reason / \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</div>
                <div class="cnd-v cnd-v-ml">${txt4(cn.reason)}</div></div></div>
          </div>
        </div>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">INVOICE REFERENCE <i>/ \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</i></div>
        <table class="cnd-tbl cnd-tbl-ref">
          <colgroup><col class="w-no"><col class="w-ino"><col class="w-idt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Invoice No. / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th>
            <th class="cnd-c">Invoice Date / \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</th>
            <th class="cnd-c">Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="cnd-c">Amount (THB) / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19</th>
          </tr></thead>
          <tbody>${invRows}</tbody>
          <tfoot><tr class="cnd-sumrow">
            <td colspan="4" class="cnd-r">Total Referenced Amount / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</td>
            <td class="cnd-r cnd-b">${money(invTotal)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">CREDIT NOTE ITEMS <i>/ \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</i></div>
        <table class="cnd-tbl cnd-tbl-cn">
          <colgroup><col class="w-no"><col class="w-ds"><col class="w-og"><col class="w-co">
            <col class="w-df"><col class="w-vr"><col class="w-va"><col class="w-cr"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Description / \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
            <th class="cnd-c">Original /<br>\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21</th>
            <th class="cnd-c">Correct /<br>\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07</th>
            <th class="cnd-c">Difference /<br>\u0E1C\u0E25\u0E15\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E25\u0E14</th>
            <th class="cnd-c">VAT Rate /<br>\u0E2D\u0E31\u0E15\u0E23\u0E32 VAT</th>
            <th class="cnd-c">VAT Diff. /<br>VAT \u0E17\u0E35\u0E48\u0E25\u0E14</th>
            <th class="cnd-c">Credit Amount /<br>\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th>
          </tr></thead>
          <tbody>${cnRows}</tbody>
          <tfoot>
            ${hasOrig ? `<tr class="cnd-sumrow">
              <td colspan="2" class="cnd-r">Total / \u0E23\u0E27\u0E21</td>
              <td class="cnd-r">${money(tOrig)}</td>
              <td class="cnd-r">${tCorrOk ? money(tCorr) : "-"}</td>
              <td class="cnd-r cnd-df">${money(S.sub)}</td>
              <td></td>
              <td class="cnd-r">${money(S.vat)}</td>
              <td class="cnd-r">${money(S.total)}</td></tr>` : ""}
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">Total Credit (Before VAT) / \u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21</td>
              <td class="cnd-r">${money(S.sub)}</td></tr>
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">${esc(vatLblShort)}</td>
              <td class="cnd-r">${money(S.vat)}</td></tr>
            <tr class="cnd-sumrow cnd-sumrow-g">
              <td colspan="7" class="cnd-r">TOTAL CREDIT AMOUNT / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</td>
              <td class="cnd-r">${money(S.total)}</td></tr>
          </tfoot>
        </table>
      </section>

      <section class="cnd-mid">
        <div class="cnd-words">
          <div class="cnd-words-t">Amount in words / \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23</div>
          <div class="cnd-words-v">( ${esc(bahtText(S.total))} )</div>
          <div class="cnd-words-ln"></div>
        </div>
        <div class="cnd-sum">
          <div class="cnd-sl"><span>SubTotal (Before VAT) / \u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21</span>
            <span>${money(S.sub)}</span></div>
          <div class="cnd-sl"><span>${esc(vatLbl)}</span><span>${money(S.vat)}</span></div>
          <div class="cnd-sl cnd-sl-g"><span>TOTAL CREDIT AMOUNT / \u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span>
            <span>${money(S.total)}</span></div>
        </div>
      </section>

      <section class="cnd-note">
        <div class="cnd-note-t">NOTE / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div>
        <ol class="cnd-note-l">
          <li><span>This Credit Note is issued for the amount as stated above.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19</em></li>
          <li><span>This Credit Note will be used to adjust the payment in the next invoice.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E08\u0E30\u0E16\u0E39\u0E01\u0E19\u0E33\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E43\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E16\u0E31\u0E14\u0E44\u0E1B</em></li>
          <li><span>No cash refund for this Credit Note.</span>
              <em>\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E02\u0E2D\u0E04\u0E37\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E44\u0E14\u0E49</em></li>
        </ol>
      </section>

      <div class="cnd-edge"></div>
    </div>`;
  }
  function openCreditNoteDoc(cn, { print = false } = {}) {
    const b = document.createElement("div");
    b.innerHTML = creditNoteDocHTML(cn);
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="cnd-print">\u{1F5A8} Print Credit Note</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;
    const no = String(cn.credit_note_no || "");
    openModal({
      title: "\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 " + (/^CNDRAFT-/.test(no) || String(cn.status).toUpperCase() === "DRAFT" ? "(\u0E23\u0E48\u0E32\u0E07)" : no),
      body: b,
      footer: f,
      fullscreen: true,
      wide: true
    });
    f.querySelector("#cnd-print").onclick = () => window.print();
    if (print) setTimeout(() => window.print(), 60);
  }
  var txt4, num4, r24, pct, ICON5, ic3, bub2;
  var init_credit_note_doc = __esm({
    "assets/js/finance/credit-note-doc.js"() {
      init_formatter();
      init_modal();
      init_baht_text();
      init_company_doc();
      txt4 = (v, fb = "-") => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return esc(s || fb);
      };
      num4 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      r24 = (n) => Math.round((num4(n) + Number.EPSILON) * 100) / 100;
      pct = (v) => {
        const n = num4(v);
        return (Number.isInteger(n) ? String(n) : String(r24(n))) + "%";
      };
      ICON5 = {
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
        doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4.4" y="3" width="15.2" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
        id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.6" cy="11" r="2"/><path d="M5.4 16.2c.5-1.5 1.7-2.3 3.2-2.3s2.7.8 3.2 2.3M14.6 10h4.2M14.6 13.4h3"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21c4-4.6 6-7.9 6-10.6A6 6 0 0 0 6 10.4C6 13.1 8 16.4 12 21z"/><circle cx="12" cy="10.3" r="2.3"/></svg>',
        tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.2 3.8h3.2l1.6 4-2 1.4a12 12 0 0 0 5.8 5.8l1.4-2 4 1.6v3.2a1.6 1.6 0 0 1-1.8 1.6C11.5 18.7 5.3 12.5 4.6 5.6a1.6 1.6 0 0 1 1.6-1.8z"/></svg>',
        cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.4" y="5" width="17.2" height="15.6" rx="2"/><path d="M3.4 9.6h17.2M8 3.4v3.4M16 3.4v3.4"/></svg>',
        list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',
        abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',
        note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.6 3.8 20.2 7.4 8 19.6l-4.4.8.8-4.4z"/><path d="M14.4 6l3.6 3.6"/></svg>'
      };
      ic3 = (k) => `<span class="cnd-ic">${ICON5[k] || ""}</span>`;
      bub2 = (k) => `<span class="cnd-bub">${ICON5[k] || ""}</span>`;
    }
  });

  // assets/js/finance/credit-note.js
  var credit_note_exports = {};
  __export(credit_note_exports, {
    render: () => render7
  });
  function backendPanel(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE \u2014 CREDIT NOTE / \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h2></div></div>
    <div class="card card-pad cnp-req">
      <h3 class="t-b">BACKEND REQUIRED \u2014 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</h3>
      <p class="t-2 mt-1">\u0E15\u0E23\u0E27\u0E08\u0E01\u0E31\u0E1A\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</p>
      <ul class="cnp-req-l">
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07 <code>njacc_credit_notes</code> \u0E41\u0E25\u0E30 <code>njacc_credit_note_items</code></li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35 RPC \u0E02\u0E2D\u0E07 Credit Note (\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E48\u0E32\u0E07 / POST / \u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 / \u0E15\u0E23\u0E27\u0E08\u0E40\u0E1E\u0E14\u0E32\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49)</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E23\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E43\u0E19 <code>njacc_document_sequences</code></li>
      </ul>
      <p class="t-sm t-3 mt-2">\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E1A\u0E19 Supabase \u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07:</p>
      <p class="cnp-req-f"><code>${esc(SQL_FILE)}</code></p>
      <p class="t-sm t-3 mt-2">\u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E23\u0E31\u0E19 <code>SECTION 3</code> \u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19
        \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1C\u0E25 (\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E41\u0E01\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)</p>
      <p class="t-sm t-3 mt-2">\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E19 \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34
        \u2014 \u0E44\u0E1F\u0E25\u0E4C SQL \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 INVOICE / RECEIPT / JOB / \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E14\u0E34\u0E21</p>
    </div>`;
  }
  async function render7(cnt) {
    ed = null;
    await masters();
    await renderList(cnt);
  }
  async function renderList(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE \u2014 CREDIT NOTE / \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h2></div>
      ${can("invoice") ? '<button class="btn btn-p" id="cn-new">+ \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</button>' : ""}</div>
    <div class="fbar">
      <input class="inp" data-f="q" value="${esc(st2.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 / INVOICE / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
      <select class="sel" data-f="customer">${customerOpts(st2.customer)}</select>
      <select class="sel" data-f="status">
        <option value="">\u2014 \u0E17\u0E38\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30 \u2014</option>
        <option value="DRAFT" ${st2.status === "DRAFT" ? "selected" : ""}>\u0E23\u0E48\u0E32\u0E07</option>
        <option value="POSTED" ${st2.status === "POSTED" ? "selected" : ""}>POSTED</option>
        <option value="VOID" ${st2.status === "VOID" ? "selected" : ""}>VOID</option>
      </select>
      <input class="inp" type="date" data-f="from" value="${st2.from}">
      <input class="inp" type="date" data-f="to" value="${st2.to}">
      <button class="btn btn-o btn-sm" id="cn-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>INVOICE \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</th>
      <th>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25</th><th class="r">\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="cn-tbody">
      <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="cn-pgn"></div>`;
    const nb = cnt.querySelector("#cn-new");
    if (nb) nb.onclick = () => renderPick(cnt);
    cnt.querySelector("#cn-go").onclick = () => {
      cnt.querySelectorAll("[data-f]").forEach((el) => {
        st2[el.dataset.f] = el.value;
      });
      st2.page = 1;
      load();
    };
    cnt.querySelector("#cn-tbody").addEventListener("click", (e) => onRowAction(e, cnt, load));
    async function load() {
      const t = nextToken("cn-list");
      const tb = cnt.querySelector("#cn-tbody");
      if (!tb) return;
      try {
        const res = await cnList({
          q: st2.q || null,
          customer_id: st2.customer || null,
          status: st2.status || null,
          from: st2.from || null,
          to: st2.to || null,
          page: st2.page,
          size: st2.size
        });
        if (!isCurrent("cn-list", t)) return;
        const rows = res.rows || [];
        tb.innerHTML = rows.length ? rows.map((r) => {
          const s = String(r.status || "").toUpperCase();
          const no = String(r.credit_note_no || "");
          return `<tr>
        <td class="t-b">${/^CNDRAFT-/.test(no) ? '<span class="t-3">\u2014 \u0E23\u0E48\u0E32\u0E07 \u2014</span>' : esc(no)}</td>
        <td>${dmy(r.credit_note_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name || "-")}</td>
        <td class="t-b">${esc(r.invoice_no || "-")}</td>
        <td class="ellip t-xs" style="max-width:180px">${esc(r.reason || "-")}</td>
        <td class="r t-b">${money(r.total_amount)}</td>
        <td>${stBadge(s)}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-doc="${r.id}">\u0E14\u0E39 / \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${s === "DRAFT" && can("invoice") ? `<button class="btn btn-o btn-sm" data-edit="${r.invoice_id}" data-cn="${r.id}">\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07</button>
               <button class="btn btn-p btn-sm" data-post="${r.id}">POST</button>
               <button class="btn btn-danger btn-sm" data-del="${r.id}">\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07</button>` : ""}
          ${s === "POSTED" && (isAdmin() || can("void")) ? `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(no)}">Void</button>` : ""}
        </div></td></tr>`;
        }).join("") : '<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</td></tr>';
        renderPagination(
          cnt.querySelector("#cn-pgn"),
          { page: st2.page, size: st2.size, total: res.total || 0 },
          ({ page, size }) => {
            st2.page = page;
            st2.size = size;
            load();
          }
        );
      } catch (e) {
        if (!isCurrent("cn-list", t)) return;
        if (isBackendMissing(e)) {
          backendPanel(cnt);
          return;
        }
        tb.innerHTML = '<tr><td colspan="8" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>';
        toast(cnErrMessage(e), "err");
      }
    }
    await load();
  }
  async function onRowAction(e, cnt, reload) {
    const doc = e.target.closest("[data-doc]");
    if (doc) {
      try {
        openCreditNoteDoc(await cnView(doc.dataset.doc));
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
      return;
    }
    const eb = e.target.closest("[data-edit]");
    if (eb) {
      openEditor(cnt, eb.dataset.edit, eb.dataset.cn);
      return;
    }
    const pb = e.target.closest("[data-post]");
    if (pb) {
      if (!await confirmModal(
        "POST \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49",
        "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E08\u0E23\u0E34\u0E07 (CD{\u0E1B\u0E35\u0E40\u0E14\u0E37\u0E2D\u0E19}-#####) \u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46",
        "POST"
      )) return;
      try {
        const r = await once(
          "cn-post-" + pb.dataset.post,
          () => cnPost(pb.dataset.post, newRequestId())
        );
        if (r) toast("POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 " + (r.credit_note_no || ""), "ok");
        reload();
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
      return;
    }
    const db = e.target.closest("[data-del]");
    if (db) {
      const reason = await reasonModal("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 (\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E23\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 POST)");
      if (!reason) return;
      try {
        await once("cn-del-" + db.dataset.del, () => cnDeleteDraft(db.dataset.del, reason));
        toast("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27", "ok");
        reload();
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
      return;
    }
    const vb = e.target.closest("[data-void]");
    if (vb) {
      const reason = await reasonModal("Void \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 " + vb.dataset.no);
      if (!reason) return;
      try {
        await once(
          "cn-void-" + vb.dataset.void,
          () => cnVoid(vb.dataset.void, reason, newRequestId())
        );
        toast("Void \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27", "ok");
        reload();
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
    }
  }
  async function renderPick(cnt) {
    pk.page = 1;
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE</h2></div>
      <button class="btn btn-o" id="cn-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \xB7 \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27\u0E41\u0E25\u0E30\u0E22\u0E31\u0E07\u0E25\u0E14\u0E44\u0E14\u0E49
        \xB7 \u201C\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01\u201D \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E22\u0E2D\u0E14\u0E01\u0E48\u0E2D\u0E19 VAT \u0E2B\u0E31\u0E01\u0E14\u0E49\u0E27\u0E22\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48 POST \u0E41\u0E25\u0E49\u0E27</p>
      <div class="fbar mt-2">
        <input class="inp" id="cn-pq" value="${esc(pk.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
        <button class="btn btn-o btn-sm" id="cn-pgo">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E01\u0E48\u0E2D\u0E19 VAT</th><th class="r">\u0E25\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27</th><th class="r">\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01</th>
        <th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
      </tr></thead><tbody id="cn-ptb">
        <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="cn-ppgn"></div>
    </div>`;
    cnt.querySelector("#cn-back").onclick = () => renderList(cnt);
    const q2 = cnt.querySelector("#cn-pq");
    cnt.querySelector("#cn-pgo").onclick = () => {
      pk.q = q2.value.trim();
      pk.page = 1;
      loadPick();
    };
    q2.addEventListener("input", () => debounce("cn-pick", () => {
      pk.q = q2.value.trim();
      pk.page = 1;
      loadPick();
    }, 350));
    cnt.querySelector("#cn-ptb").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pick]");
      if (b) openEditor(cnt, b.dataset.pick, null);
    });
    async function loadPick() {
      const t = nextToken("cn-pick-load");
      const tb = cnt.querySelector("#cn-ptb");
      if (!tb) return;
      try {
        const res = await cnInvoiceOptions({ q: pk.q || null, page: pk.page, size: pk.size });
        if (!isCurrent("cn-pick-load", t)) return;
        const rows = res.rows || [];
        tb.innerHTML = rows.length ? rows.map((r) => {
          const rem = num5(r.creditable_remaining);
          return `<tr>
        <td class="t-b">${esc(r.invoice_no || "-")}</td>
        <td>${dmy(r.invoice_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name || "-")}</td>
        <td>${esc(r.charge_type || "-")}</td>
        <td class="r">${money(r.subtotal)}</td>
        <td class="r">${money(r.credited)}</td>
        <td class="r t-b">${money(rem)}</td>
        <td><div class="ch-act">
          ${rem > 0 ? `<button class="btn btn-p btn-sm" data-pick="${r.id}">\u0E40\u0E25\u0E37\u0E2D\u0E01</button>` : '<span class="t-3 t-xs">\u0E25\u0E14\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27</span>'}
        </div></td></tr>`;
        }).join("") : '<tr><td colspan="8" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49</td></tr>';
        renderPagination(
          cnt.querySelector("#cn-ppgn"),
          { page: pk.page, size: pk.size, total: res.total || 0 },
          ({ page, size }) => {
            pk.page = page;
            pk.size = size;
            loadPick();
          }
        );
      } catch (e) {
        if (!isCurrent("cn-pick-load", t)) return;
        if (isBackendMissing(e)) {
          backendPanel(cnt);
          return;
        }
        tb.innerHTML = '<tr><td colspan="8" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>';
        toast(cnErrMessage(e), "err");
      }
    }
    await loadPick();
  }
  async function openEditor(cnt, invoiceId, creditNoteId) {
    cnt.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';
    let src;
    try {
      src = await cnSource(invoiceId);
    } catch (e) {
      if (isBackendMissing(e)) {
        backendPanel(cnt);
        return;
      }
      toast(cnErrMessage(e), "err");
      return renderList(cnt);
    }
    const inv = src.invoice || {};
    const c = src.customer || {};
    const job = src.job || {};
    const cnId = creditNoteId || src.existing_draft_id || null;
    let prev = null;
    if (cnId) {
      try {
        prev = await cnView(cnId);
      } catch (_) {
        prev = null;
      }
    }
    const prevBy = /* @__PURE__ */ new Map();
    (prev && prev.items || []).forEach((it) => {
      if (it.invoice_item_id) prevBy.set(it.invoice_item_id, it);
    });
    ed = {
      cnId,
      invoiceId: inv.id,
      date: prev && prev.credit_note_date || ymd(/* @__PURE__ */ new Date()),
      reason: prev && prev.reason || "",
      lines: (src.items || []).map((it) => {
        const p = prevBy.get(it.invoice_item_id);
        return {
          invoice_item_id: it.invoice_item_id,
          line_no: it.line_no,
          description: p ? p.description : it.description,
          origin: num5(it.amount),
          credited: num5(it.credited),
          remaining: num5(it.remaining),
          vat_rate: num5(it.vat_rate),
          on: !!p,
          amount: p ? num5(p.amount) : num5(it.remaining)
        };
      })
    };
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${cnId ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49" : "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49"} \u2014 INVOICE ${esc(inv.invoice_no || "")}</h2></div>
      <button class="btn btn-o" id="cn-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>

    <div class="cnp-top">
      <div class="card card-pad">
        <h3 class="t-b">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</h3>
        <div class="cnp-kv"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</label><span class="t-b">${esc(c.name || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label><span>${esc(c.tax_id || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E2A\u0E32\u0E02\u0E32</label><span>${esc(c.branch_code || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label><span>${esc(c.address || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E42\u0E17\u0E23.</label><span>${esc(c.phone || "-")}</span></div>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</h3>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE</label><span class="t-b">${esc(inv.invoice_no || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</label><span>${dmy(inv.invoice_date)}</span></div>
        <div class="cnp-kv"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label><span>${esc(inv.status || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19</label><span>${esc(job.job_no || "-")}</span></div>
        <div class="cnp-kv"><label>\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E40\u0E14\u0E34\u0E21</label><span class="t-b">${money(inv.total_amount)}</span></div>
        <p class="t-xs t-3 mt-1">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</p>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</h3>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</label>
          <input class="inp w100" type="date" id="cn-date" value="${esc(ed.date)}"></div>
        <div class="fld"><label>\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 <span class="req">*</span></label>
          <input class="inp w100" id="cn-reason" list="cn-reason-sug"
            value="${esc(ed.reason)}" placeholder="\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u0E40\u0E0A\u0E48\u0E19 \u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E15\u0E32\u0E21\u0E01\u0E32\u0E23\u0E15\u0E01\u0E25\u0E07">
          <datalist id="cn-reason-sug">
            <option value="\u0E1B\u0E23\u0E31\u0E1A\u0E25\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23"></option>
            <option value="\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E40\u0E01\u0E34\u0E19"></option>
            <option value="\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"></option>
            <option value="\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19"></option>
          </datalist>
          <p class="t-xs t-3">\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E19\u0E35\u0E49\u0E08\u0E30\u0E16\u0E39\u0E01\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E25\u0E07\u0E1A\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E15\u0E34\u0E21\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07</p>
        </div>
        <div class="cnp-kv"><label>\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</label>
          <span class="t-3">\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E15\u0E2D\u0E19 POST</span></div>
      </div>
    </div>

    <div class="card card-pad mt-2">
      <h3 class="t-b">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E32\u0E01 INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</h3>
      <p class="t-xs t-3">\u0E2D\u0E31\u0E15\u0E23\u0E32 VAT \u0E22\u0E36\u0E14\u0E15\u0E32\u0E21\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A \xB7 \u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 \u201C\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01\u201D
        \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E25\u0E30\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</p>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th class="center" style="width:48px">\u0E40\u0E25\u0E37\u0E2D\u0E01</th>
        <th>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E40\u0E14\u0E34\u0E21</th>
        <th class="r">\u0E25\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27</th>
        <th class="r">\u0E25\u0E14\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01</th>
        <th class="r" style="width:132px">\u0E22\u0E2D\u0E14\u0E25\u0E14 (\u0E01\u0E48\u0E2D\u0E19 VAT)</th>
        <th class="center">VAT</th>
        <th class="r">VAT</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</th>
      </tr></thead><tbody id="cn-ltb"></tbody></table></div>

      <div class="cnp-foot mt-2">
        <div class="cnp-tot">
          <div><span>\u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19 VAT</span><b id="cn-t-sub">0.00</b></div>
          <div><span>\u0E23\u0E27\u0E21 VAT</span><b id="cn-t-vat">0.00</b></div>
          <div class="cnp-tot-g"><span>\u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49</span><b id="cn-t-tot">0.00</b></div>
        </div>
        <div class="cnp-btn">
          <button class="btn btn-o" id="cn-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07</button>
          <button class="btn btn-o" id="cn-prev" ${cnId ? "" : "disabled"}>\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 / \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          <button class="btn btn-p" id="cn-post" ${cnId ? "" : "disabled"}>POST \u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E08\u0E23\u0E34\u0E07</button>
        </div>
      </div>
      ${cnId ? "" : '<p class="t-xs t-3 mt-1">\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E25\u0E30 POST \u0E44\u0E14\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 (\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)</p>'}
    </div>`;
    cnt.querySelector("#cn-back").onclick = () => renderList(cnt);
    cnt.querySelector("#cn-date").onchange = (e) => {
      ed.date = e.target.value;
    };
    cnt.querySelector("#cn-reason").oninput = (e) => {
      ed.reason = e.target.value;
    };
    const tb = cnt.querySelector("#cn-ltb");
    drawLines();
    tb.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.i);
      if (!Number.isInteger(i) || !ed.lines[i]) return;
      if (e.target.dataset.k === "on") {
        ed.lines[i].on = e.target.checked;
        drawLines();
      }
    });
    tb.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.i);
      if (!Number.isInteger(i) || !ed.lines[i]) return;
      const k = e.target.dataset.k;
      if (k === "amount") {
        ed.lines[i].amount = num5(e.target.value);
        e.target.classList.toggle("cnp-bad", ed.lines[i].amount > ed.lines[i].remaining);
        refreshRow(i);
        refreshTotals();
      } else if (k === "desc") {
        ed.lines[i].description = e.target.value;
      }
    });
    cnt.querySelector("#cn-save").onclick = (e) => doSave(cnt, e.target);
    cnt.querySelector("#cn-prev").onclick = async () => {
      if (!ed.cnId) return;
      try {
        openCreditNoteDoc(await cnView(ed.cnId));
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
    };
    cnt.querySelector("#cn-post").onclick = async () => {
      if (!ed.cnId) return;
      if (!await confirmModal(
        "POST \u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49",
        "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49\u0E08\u0E23\u0E34\u0E07 (CD{\u0E1B\u0E35\u0E40\u0E14\u0E37\u0E2D\u0E19}-#####) \u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46",
        "POST"
      )) return;
      try {
        const r = await once("cn-post-" + ed.cnId, () => cnPost(ed.cnId, newRequestId()));
        if (r) toast("POST \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49 " + (r.credit_note_no || ""), "ok");
        renderList(cnt);
      } catch (ex) {
        toast(cnErrMessage(ex), "err");
      }
    };
    function drawLines() {
      tb.innerHTML = ed.lines.length ? ed.lines.map((l, i) => {
        const over = l.on && l.amount > l.remaining;
        const vat = round2(l.on ? l.amount * l.vat_rate / 100 : 0);
        return `<tr class="${l.on ? "" : "cnp-off"}">
        <td class="center"><input type="checkbox" data-i="${i}" data-k="on" ${l.on ? "checked" : ""}
          ${l.remaining > 0 ? "" : "disabled"}></td>
        <td>${l.on ? `<input class="inp w100" data-i="${i}" data-k="desc" value="${esc(l.description || "")}">` : `<span class="ellip">${esc(l.description || "-")}</span>`}</td>
        <td class="r">${money(l.origin)}</td>
        <td class="r">${money(l.credited)}</td>
        <td class="r t-b">${money(l.remaining)}</td>
        <td class="r">${l.on ? `<input class="inp r${over ? " cnp-bad" : ""}" type="number" step="0.01" min="0"
               max="${l.remaining}" data-i="${i}" data-k="amount" value="${l.amount}">` : '<span class="t-3">-</span>'}</td>
        <td class="center">${esc(pct2(l.vat_rate))}</td>
        <td class="r" data-vat="${i}">${l.on ? money(vat) : '<span class="t-3">-</span>'}</td>
        <td class="r t-b" data-cr="${i}">${l.on ? money(round2(l.amount + vat)) : '<span class="t-3">-</span>'}</td>
      </tr>`;
      }).join("") : '<tr><td colspan="9" class="empty">INVOICE \u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</td></tr>';
      refreshTotals();
    }
    function refreshRow(i) {
      const l = ed.lines[i];
      if (!l) return;
      const vat = round2(l.amount * l.vat_rate / 100);
      const cv = tb.querySelector(`[data-vat="${i}"]`);
      const cc = tb.querySelector(`[data-cr="${i}"]`);
      if (cv) cv.textContent = money(vat);
      if (cc) cc.textContent = money(round2(l.amount + vat));
    }
    function refreshTotals() {
      let sub = 0, vat = 0;
      for (const l of ed.lines) {
        if (!l.on) continue;
        sub = round2(sub + l.amount);
        vat = round2(vat + round2(l.amount * l.vat_rate / 100));
      }
      const a = cnt.querySelector("#cn-t-sub");
      if (a) a.textContent = money(sub);
      const b = cnt.querySelector("#cn-t-vat");
      if (b) b.textContent = money(vat);
      const d = cnt.querySelector("#cn-t-tot");
      if (d) d.textContent = money(round2(sub + vat));
    }
  }
  async function doSave(cnt, btn2) {
    if (!ed) return;
    const picked = ed.lines.filter((l) => l.on);
    if (!ed.reason.trim()) {
      toast("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E43\u0E19\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2B\u0E19\u0E35\u0E49", "err");
      return;
    }
    if (!picked.length) {
      toast("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E25\u0E14\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
      return;
    }
    for (const l of picked) {
      if (!(l.amount > 0)) {
        toast("\u0E22\u0E2D\u0E14\u0E25\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01", "err");
        return;
      }
      if (l.amount > l.remaining) {
        toast('\u0E25\u0E14\u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E25\u0E14\u0E44\u0E14\u0E49\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 "' + l.description + '" (\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ' + money(l.remaining) + ")", "err");
        return;
      }
    }
    const payload2 = {
      credit_note_id: ed.cnId || null,
      invoice_id: ed.invoiceId,
      credit_note_date: ed.date || null,
      reason: ed.reason.trim(),
      items: picked.map((l) => ({
        invoice_item_id: l.invoice_item_id,
        description: l.description,
        amount: round2(l.amount)
      }))
    };
    if (btn2) btn2.disabled = true;
    try {
      const r = await once("cn-save", () => cnSaveDraft(payload2));
      if (r && r.id) {
        ed.cnId = r.id;
        const pv = cnt.querySelector("#cn-prev");
        if (pv) pv.disabled = false;
        const po = cnt.querySelector("#cn-post");
        if (po) po.disabled = false;
        toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 " + money(r.total_amount), "ok");
      }
    } catch (ex) {
      toast(cnErrMessage(ex), "err");
    } finally {
      if (btn2) btn2.disabled = false;
    }
  }
  var SQL_FILE, st2, pk, ed, num5, pct2, ST_BDG, stBadge;
  var init_credit_note = __esm({
    "assets/js/finance/credit-note.js"() {
      init_credit_note_api();
      init_credit_note_doc();
      init_master_cache();
      init_formatter();
      init_permissions();
      init_pagination();
      init_modal();
      init_toast();
      init_request_manager();
      SQL_FILE = "sql/RUN-NOW/ (\u0E14\u0E39 README_RUN-NOW.txt)";
      st2 = { q: "", customer: "", status: "", from: "", to: "", page: 1, size: 20 };
      pk = { q: "", page: 1, size: 10 };
      ed = null;
      num5 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      pct2 = (v) => {
        const n = num5(v);
        return (Number.isInteger(n) ? String(n) : String(round2(n))) + "%";
      };
      ST_BDG = {
        DRAFT: ["bdg-due-ok", "\u0E23\u0E48\u0E32\u0E07"],
        POSTED: ["bdg-issued", "POSTED"],
        VOID: ["bdg-void", "VOID"]
      };
      stBadge = (s) => {
        const [c, t] = ST_BDG[String(s || "").toUpperCase()] || ["bdg-due-ok", s || "-"];
        return `<span class="bdg ${c}">${esc(t)}</span>`;
      };
    }
  });

  // assets/js/payments/payment-api.js
  var openInvoices, receivePayment;
  var init_payment_api = __esm({
    "assets/js/payments/payment-api.js"() {
      init_supabase_client();
      openInvoices = (customerId) => rpc("njacc_customer_open_invoices", { p_customer: customerId });
      receivePayment = (args) => rpc("njacc_receive_payment", args);
    }
  });

  // assets/js/payments/payment-allocation.js
  function autoAllocate(invoices, amount) {
    let left = round2(amount);
    const out = [];
    for (const inv of invoices) {
      if (left <= 0) break;
      const take = round2(Math.min(left, Number(inv.outstanding)));
      if (take > 0) {
        out.push({ invoice_id: inv.id, amount: take });
        left = round2(left - take);
      }
    }
    return { allocations: out, leftover: left };
  }
  function sumAlloc(allocs) {
    return round2(allocs.reduce((s, a) => s + Number(a.amount || 0), 0));
  }
  var init_payment_allocation = __esm({
    "assets/js/payments/payment-allocation.js"() {
      init_formatter();
    }
  });

  // assets/js/payments/payment-form.js
  var payment_form_exports = {};
  __export(payment_form_exports, {
    render: () => render8
  });
  async function render8(cnt) {
    await masters();
    const requestId = newRequestId();
    let invoices = [];
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19</h2></div>
      <button class="btn btn-o" id="pm-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button></div>
    <div class="card card-pad mb-2"><div class="fgrid">
      <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label>
        <select class="sel" id="pm-cust">${customerOpts("")}</select></div>
      <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</label>
        <input class="inp" type="date" id="pm-date" value="${ymd(/* @__PURE__ */ new Date())}"></div>
      <div class="fld"><label>\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A <span class="req">*</span></label>
        <input class="inp" type="number" step="0.01" min="0" id="pm-amt" style="text-align:right"></div>
      <div class="fld"><label>\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07</label>
        <select class="sel" id="pm-method">
          <option value="TRANSFER">\u0E42\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19</option><option value="CASH">\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14</option>
          <option value="CHEQUE">\u0E40\u0E0A\u0E47\u0E04</option><option value="OTHER">\u0E2D\u0E37\u0E48\u0E19 \u0E46</option></select></div>
      <div class="fld"><label>\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</label><input class="inp" id="pm-ref"></div>
      <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label><input class="inp" id="pm-note"></div>
    </div></div>
    <div class="card">
      <div class="row" style="padding:12px 14px">
        <h3>INVOICE \u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</h3><span class="sp"></span>
        <button class="btn btn-o btn-sm" id="pm-auto">\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E40\u0E01\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E01\u0E48\u0E2D\u0E19)</button></div>
      <div class="tbl-wrap" style="border:none;box-shadow:none">
      <table class="tbl rp-alloc-tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>Due</th><th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21</th>
        <th class="r">WHT</th><th class="r">\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E31\u0E1A</th>
        <th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th><th class="r">\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49</th></tr></thead>
        <tbody id="pm-tbody"><tr><td colspan="6" class="empty">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19</td></tr></tbody></table></div>
      <div class="row" style="padding:12px 18px;border-top:1px solid var(--line)">
        <div>\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E23\u0E27\u0E21: <b id="pm-sum">0.00</b> \xB7 \u0E1C\u0E25\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A:
          <span class="rp-diff" id="pm-diff">0.00</span></div>
        <span class="sp"></span>
        <button class="btn btn-p" id="pm-save">\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 + \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08</button></div>
    </div>`;
    const tbody = cnt.querySelector("#pm-tbody");
    cnt.querySelector("#pm-back").onclick = () => location.hash = "#/receipts";
    async function loadInv() {
      const cid = cnt.querySelector("#pm-cust").value;
      if (!cid) {
        invoices = [];
        tbody.innerHTML = '<tr><td colspan="8" class="empty">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19</td></tr>';
        upd();
        return;
      }
      tbody.innerHTML = '<tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>';
      try {
        const all = await openInvoices(cid);
        invoices = (all || []).filter((i) => String(i.charge_type || "SERVICE").toUpperCase() === "SERVICE");
        tbody.innerHTML = invoices.length ? invoices.map((i) => `<tr data-inv="${i.id}">
        <td class="t-b">${esc(i.invoice_no)}</td><td>${dmy(i.invoice_date)}</td><td>${dmy(i.due_date)}</td>
        <td class="r">${money(i.total_amount)}</td>
        <td class="r">${i.wht_amount === void 0 ? "-" : money(i.wht_amount)}</td>
        <td class="r">${i.net_receivable === void 0 ? "-" : money(i.net_receivable)}</td>
        <td class="r money-neg">${money(i.outstanding)}</td>
        <td class="r"><input class="inp" type="number" step="0.01" min="0" max="${i.outstanding}"
          data-alloc value=""></td></tr>`).join("") : '<tr><td colspan="8" class="empty">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35 INVOICE \u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07 (\u0E07\u0E32\u0E19\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E08\u0E48\u0E32\u0E22\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E19\u0E39 FINANCE &gt; Advance)</td></tr>';
        upd();
      } catch (e) {
        handleErr(e);
      }
    }
    cnt.querySelector("#pm-cust").onchange = loadInv;
    function readAllocs() {
      return [...tbody.querySelectorAll("tr[data-inv]")].map((tr) => ({
        invoice_id: tr.dataset.inv,
        amount: round2(Number(tr.querySelector("[data-alloc]").value || 0))
      })).filter((a) => a.amount > 0);
    }
    function upd() {
      const amt = round2(Number(cnt.querySelector("#pm-amt").value || 0));
      const s = sumAlloc(readAllocs());
      cnt.querySelector("#pm-sum").textContent = money(s);
      const diff = round2(amt - s);
      const de = cnt.querySelector("#pm-diff");
      de.textContent = money(diff);
      de.className = "rp-diff " + (Math.abs(diff) <= 5e-3 && amt > 0 ? "ok" : "bad");
    }
    tbody.addEventListener("input", upd);
    cnt.querySelector("#pm-amt").addEventListener("input", upd);
    cnt.querySelector("#pm-auto").onclick = () => {
      const amt = round2(Number(cnt.querySelector("#pm-amt").value || 0));
      if (amt <= 0) {
        toast("\u0E43\u0E2A\u0E48\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19", "err");
        return;
      }
      const { allocations, leftover } = autoAllocate(invoices, amt);
      tbody.querySelectorAll("tr[data-inv]").forEach((tr) => {
        const a = allocations.find((x) => x.invoice_id === tr.dataset.inv);
        tr.querySelector("[data-alloc]").value = a ? a.amount : "";
      });
      if (leftover > 0) toast("\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21 \u2014 \u0E40\u0E2B\u0E25\u0E37\u0E2D " + money(leftover) + " \u0E15\u0E31\u0E14\u0E44\u0E21\u0E48\u0E2B\u0E21\u0E14", "err");
      upd();
    };
    cnt.querySelector("#pm-save").onclick = async (e) => {
      const cid = cnt.querySelector("#pm-cust").value;
      const amt = round2(Number(cnt.querySelector("#pm-amt").value || 0));
      const allocs = readAllocs();
      if (!cid) {
        toast("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", "err");
        return;
      }
      if (amt <= 0) {
        toast("\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0", "err");
        return;
      }
      if (!allocs.length) {
        toast("\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 INVOICE", "err");
        return;
      }
      const s = sumAlloc(allocs);
      if (Math.abs(s - amt) > 5e-3) {
        toast("\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30\u0E23\u0E27\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A", "err");
        return;
      }
      for (const a of allocs) {
        const inv = invoices.find((i) => i.id === a.invoice_id);
        if (inv && a.amount > Number(inv.outstanding) + 5e-3) {
          toast("\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E14 " + esc(inv.invoice_no) + " \u0E40\u0E01\u0E34\u0E19\u0E22\u0E2D\u0E14\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07", "err");
          return;
        }
      }
      const ok = await confirmModal(
        "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30",
        `\u0E22\u0E2D\u0E14\u0E23\u0E31\u0E1A: <b>${money(amt)}</b> \u0E1A\u0E32\u0E17 \xB7 \u0E15\u0E31\u0E14\u0E0A\u0E33\u0E23\u0E30 ${allocs.length} INVOICE<br>\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E14\u0E35\u0E22\u0E27`,
        "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"
      );
      if (!ok) return;
      btnBusy(e.target, true);
      try {
        const res = await once("recv-pay", () => receivePayment({
          p_customer: cid,
          p_amount: amt,
          p_allocations: allocs.map((a) => ({ invoice_id: a.invoice_id, amount: a.amount })),
          p_request_id: requestId,
          p_date: cnt.querySelector("#pm-date").value || null,
          p_method: cnt.querySelector("#pm-method").value,
          p_ref: cnt.querySelector("#pm-ref").value.trim() || null,
          p_note: cnt.querySelector("#pm-note").value.trim() || null,
          p_issue_receipt: true
        }));
        toast("\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 " + (res.receipt_no || "-"), "ok");
        location.hash = "#/receipts";
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
  }
  var init_payment_form = __esm({
    "assets/js/payments/payment-form.js"() {
      init_payment_api();
      init_payment_allocation();
      init_master_cache();
      init_formatter();
      init_toast();
      init_modal();
      init_loading();
      init_error_handler();
      init_request_manager();
    }
  });

  // assets/js/reports/report-api.js
  var fetchReport;
  var init_report_api = __esm({
    "assets/js/reports/report-api.js"() {
      init_supabase_client();
      fetchReport = (p) => rpc("njacc_report", { p });
    }
  });

  // assets/js/reports/report-views.js
  function reportRowHTML(r) {
    return `<tr>
    <td class="nowrap">${dmy(r.invoice_date)}</td>
    <td class="t-xs">${esc(r.charge_type)} \xB7 ${esc(r.company_group)}</td>
    <td class="t-b">${esc(r.invoice_no)}</td>
    <td class="t-xs">${esc(r.job_no || "-")}</td>
    <td class="ellip" style="max-width:190px">${esc(r.customer_name || "-")}</td>
    <td>${r.status === "VOID" ? '<span class="bdg bdg-void">VOID</span>' : payBadge(r.payment_status)}</td>
    <td class="r">${money(r.subtotal)}</td>
    <td class="r">${money(r.vat_amount)}</td>
    <td class="r">${money(r.wht_amount)}</td>
    <td class="r t-b">${money(r.total_amount)}</td>
    <td class="r money-pos">${money(r.received)}</td>
    <td class="r money-neg">${money(r.outstanding)}</td>
    <td class="nowrap">${dmy(r.due_date)}${r.overdue ? ' <span class="bdg bdg-due-over">\u0E40\u0E01\u0E34\u0E19</span>' : ""}</td></tr>`;
  }
  function reportKpiHTML(k) {
    const items = [
      ["INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", (k?.total_invoice ?? 0).toLocaleString("th-TH"), "var(--blue-600)"],
      ["\u0E22\u0E2D\u0E14\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E23\u0E27\u0E21", money(k?.invoice_amount), "var(--cyan-700)"],
      ["\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27", money(k?.received), "var(--green-600)"],
      ["\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21", money(k?.outstanding), "var(--red-600)"],
      ["\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14", (k?.overdue ?? 0).toLocaleString("th-TH"), "var(--amber-600)"],
      ["\u0E0A\u0E33\u0E23\u0E30\u0E04\u0E23\u0E1A / \u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19", (k?.paid ?? 0) + " / " + (k?.partial ?? 0), "var(--purple-600)"]
    ];
    return '<div class="kpi-row">' + items.map(([lb, v, c]) => `<div class="kpi" style="--kpi-c:${c}"><div class="lb">${lb}</div><div class="v">${v}</div></div>`).join("") + "</div>";
  }
  var init_report_views = __esm({
    "assets/js/reports/report-views.js"() {
      init_formatter();
    }
  });

  // assets/js/reports/report-page.js
  var report_page_exports = {};
  __export(report_page_exports, {
    render: () => render9
  });
  async function render9(cnt) {
    await masters();
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>REPORT</h2></div></div>
    <div id="rep-kpi"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>
    <div class="fbar">
      <select class="sel" data-f="charge_type"><option value="">\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</option>
        ${CHARGE_TYPES.map((c) => `<option value="${c.key}" ${st3.charge_type === c.key ? "selected" : ""}>${c.label}</option>`).join("")}</select>
      <select class="sel" data-f="company_group"><option value="">\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</option>
        ${COMPANY_GROUPS.map((g) => `<option value="${g.key}" ${st3.company_group === g.key ? "selected" : ""}>${g.label}</option>`).join("")}</select>
      <select class="sel" data-f="customer_id">${customerOpts(st3.customer_id)}</select>
      <select class="sel" data-f="status"><option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30 INVOICE \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
        <option value="ISSUED" ${st3.status === "ISSUED" ? "selected" : ""}>ISSUED</option>
        <option value="VOID" ${st3.status === "VOID" ? "selected" : ""}>VOID</option></select>
      <select class="sel" data-f="payment_status"><option value="">\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</option>
        <option value="UNPAID" ${st3.payment_status === "UNPAID" ? "selected" : ""}>\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30</option>
        <option value="PARTIAL" ${st3.payment_status === "PARTIAL" ? "selected" : ""}>\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19</option>
        <option value="PAID" ${st3.payment_status === "PAID" ? "selected" : ""}>\u0E04\u0E23\u0E1A</option></select>
      <input class="inp" type="date" data-f="from" value="${st3.from}" title="\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INVOICE \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48">
      <input class="inp" type="date" data-f="to" value="${st3.to}" title="\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48">
      <button class="btn btn-p btn-sm" id="rep-go">\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 INV</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th><th>INVOICE</th><th>\u0E40\u0E25\u0E02\u0E07\u0E32\u0E19</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th>
      <th class="r">\u0E01\u0E48\u0E2D\u0E19 VAT</th><th class="r">VAT</th><th class="r">WHT</th>
      <th class="r">\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21</th><th class="r">\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27</th><th class="r">\u0E04\u0E07\u0E04\u0E49\u0E32\u0E07</th><th>Due</th>
    </tr></thead><tbody id="rep-tbody"><tr><td colspan="13" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rep-pgn"></div>
    ${can("export") ? '<p class="t-xs t-3 mt-1">* Export Excel \u0E08\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E43\u0E19 Release \u0E16\u0E31\u0E14\u0E44\u0E1B (\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 lazy-loader \u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27)</p>' : ""}`;
    async function load() {
      const t = nextToken("report");
      try {
        const res = await fetchReport({
          charge_type: st3.charge_type || null,
          company_group: st3.company_group || null,
          customer_id: st3.customer_id || null,
          status: st3.status || null,
          payment_status: st3.payment_status || null,
          from: st3.from || null,
          to: st3.to || null,
          page: st3.page,
          size: st3.size
        });
        if (!isCurrent("report", t)) return;
        cnt.querySelector("#rep-kpi").innerHTML = reportKpiHTML(res.kpi || {});
        const rows = res.rows || [];
        cnt.querySelector("#rep-tbody").innerHTML = rows.length ? rows.map(reportRowHTML).join("") : '<tr><td colspan="13" class="empty">\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 \u2014 INVOICE \u0E08\u0E30\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25</td></tr>';
        renderPagination(
          cnt.querySelector("#rep-pgn"),
          { page: st3.page, size: st3.size, total: res.total || 0 },
          ({ page, size }) => {
            st3.page = page;
            st3.size = size;
            load();
          }
        );
      } catch (e) {
        if (isCurrent("report", t)) handleErr(e);
      }
    }
    cnt.querySelector("#rep-go").onclick = () => {
      cnt.querySelectorAll("[data-f]").forEach((el) => st3[el.dataset.f] = el.value);
      st3.page = 1;
      load();
    };
    load();
  }
  var st3;
  var init_report_page = __esm({
    "assets/js/reports/report-page.js"() {
      init_report_api();
      init_report_views();
      init_master_cache();
      init_pagination();
      init_permissions();
      init_request_manager();
      init_error_handler();
      init_charge_groups();
      st3 = {
        charge_type: "",
        company_group: "",
        customer_id: "",
        status: "",
        payment_status: "",
        from: "",
        to: "",
        page: 1,
        size: 20
      };
    }
  });

  // assets/js/withholding/withholding-api.js
  function isWhtBackendMissing(e) {
    const m = String(e && (e.message || e.hint || e.details) || "");
    return /PGRST202/i.test(m) || /Could not find the function/i.test(m) || /schema cache/i.test(m) && /njacc_(wht|save_wht|post_wht|delete_wht)/i.test(m);
  }
  function whtErrMessage(e) {
    const m = String(e && e.message || "");
    for (const k in WHT_ERR) if (m.includes(k)) return WHT_ERR[k];
    return m || "\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14";
  }
  var listWht, voidWht, whtInvoiceOptions, saveWhtDraft, postWht, whtView, deleteWhtDraft, WHT_ERR;
  var init_withholding_api = __esm({
    "assets/js/withholding/withholding-api.js"() {
      init_supabase_client();
      listWht = (a) => rpc("njacc_list_wht", a);
      voidWht = (id, reason, requestId) => rpc("njacc_void_wht", { p_id: id, p_reason: reason, p_request_id: requestId });
      whtInvoiceOptions = (p) => rpc("njacc_wht_invoice_options", { p });
      saveWhtDraft = (p) => rpc("njacc_save_wht_draft", { p });
      postWht = (id, requestId) => rpc("njacc_post_wht", { p_id: id, p_request_id: requestId });
      whtView = (id) => rpc("njacc_wht_view", { p_id: id });
      deleteWhtDraft = (id, reason) => rpc("njacc_delete_wht_draft", { p_id: id, p_reason: reason });
      WHT_ERR = {
        NJACC_WHT_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49",
        NJACC_WHT_NOT_DRAFT: "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27",
        NJACC_WHT_ALREADY_ISSUED: "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",
        NJACC_WHT_PAY_DATE_REQUIRED: "\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
        NJACC_WHT_ITEM_PAY_DATE_REQUIRED: "\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07",
        NJACC_WHT_RATE_REQUIRED: "\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
        NJACC_WHT_CUSTOMER_REQUIRED: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E01\u0E48\u0E2D\u0E19",
        NJACC_WHT_CUSTOMER_NOT_FOUND: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49",
        NJACC_WHT_INVOICE_MISMATCH: "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49",
        NJACC_WHT_BASE_INVALID: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
        NJACC_BAD_TAX_RATE: "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07 0\u2013100",
        NJACC_NO_ITEMS: "\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"
      };
    }
  });

  // assets/js/withholding/wht-doc.js
  function summarize5(items) {
    let base = 0, tax = 0;
    const rates = /* @__PURE__ */ new Set();
    for (const it of items) {
      base = r25(base + num6(it.tax_base));
      tax = r25(tax + num6(it.amount));
      rates.add(num6(it.rate));
    }
    return { base, tax, rates: [...rates].sort((a, b) => a - b) };
  }
  function whtDocHTML(w, { copy = "original" } = {}) {
    const items = w.items || [];
    const S = summarize5(items);
    const p = w.payer || w.payee || {};
    const inv = w.invoice || {};
    const status = String(w.status || "").toUpperCase();
    const isDraft = status === "DRAFT";
    const isVoid = status === "VOID";
    const certNo = String(w.certificate_no || "").trim() || null;
    const noRaw = String(w.document_no || "");
    const internalNo = isDraft || /^WHTDRAFT-/.test(noRaw) ? null : noRaw || null;
    const copyMeta = WHD_COPIES.find((c) => c.key === copy) || WHD_COPIES[0];
    const rows = items.length ? items.map((it, i) => `<tr>
        <td class="whd-c whd-dim">${it.line_no ?? i + 1}</td>
        <td class="whd-c">${esc(payDate(it.pay_date, w.pay_date))}</td>
        <td class="whd-ds">
          <div class="whd-ds-t">${esc(incomeLabel(it.income_type))}</div>
          ${it.description ? `<div class="whd-ds-s">${esc(it.description)}</div>` : ""}
        </td>
        <td class="whd-r">${money(it.tax_base)}</td>
        <td class="whd-c">${esc(pct3(it.rate))}</td>
        <td class="whd-r whd-tax">${money(it.amount)}</td>
      </tr>`).join("") : '<tr><td colspan="6" class="whd-empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49</td></tr>';
    const refTxt = inv.invoice_no ? esc(inv.invoice_no) : w.reference_no ? esc(w.reference_no) : "-";
    return `
    <div class="whd print-area${isVoid ? " whd-void" : ""}${isDraft ? " whd-draft" : ""}">
      ${isVoid ? '<div class="whd-badge whd-badge-v">VOID / \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</div>' : ""}
      ${isDraft ? '<div class="whd-badge whd-badge-d">DRAFT / \u0E23\u0E48\u0E32\u0E07 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</div>' : ""}

      <div class="whd-copy">
        <b>\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E22\u0E43\u0E19 \u2014 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</b>
        <span>${esc(copyMeta.label)}</span>
      </div>

      <header class="whd-head">
        <img class="whd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
        <div class="whd-head-t">
          <div class="whd-t1">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</div>
          <div class="whd-t2">\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E32 50 \u0E17\u0E27\u0E34 \u0E41\u0E2B\u0E48\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E23\u0E31\u0E29\u0E0E\u0E32\u0E01\u0E23 \u2014 \u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E22\u0E43\u0E19</div>
          <div class="whd-t3">RECEIVED WITHHOLDING TAX CERTIFICATE \u2014 INTERNAL RECORD</div>
        </div>
        <div class="whd-head-r">
          <div class="whd-nolbl">\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 (\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01)</div>
          <div class="whd-no">${certNo ? esc(certNo) : '<span class="whd-pend">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E25\u0E02\u0E08\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35</span>'}</div>
          <div class="whd-dtlbl">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</div>
          <div class="whd-dt">${dmy(w.document_date)}</div>
          ${internalNo ? `<div class="whd-intlbl">\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19</div>
          <div class="whd-int">${esc(internalNo)}</div>` : ""}
        </div>
      </header>
      <div class="whd-band"></div>

      <section class="whd-party">
        <div class="whd-box">
          <div class="whd-box-t">${bub3("payer")}<span>\u0E01. \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>\u0E0A\u0E37\u0E48\u0E2D</label><div class="whd-v whd-v-b">${txt5(p.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
                <div class="whd-v whd-v-tax">${txt5(p.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>\u0E2A\u0E32\u0E02\u0E32</label>
                <div class="whd-v">${txt5(p.branch_code)}</div></div>
            </div>
            <div class="whd-f"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <div class="whd-v whd-v-ml">${addr(p.address)}</div></div>
            <div class="whd-f whd-f-last"><label>\u0E42\u0E17\u0E23.</label>
              <div class="whd-v">${txt5(p.phone)}</div></div>
          </div>
        </div>

        <div class="whd-box">
          <div class="whd-box-t">${bub3("payee")}<span>\u0E02. \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>\u0E0A\u0E37\u0E48\u0E2D</label><div class="whd-v whd-v-b">${esc(ISSUER.nameEn)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35\u0E2D\u0E32\u0E01\u0E23</label>
                <div class="whd-v whd-v-tax">${esc(ISSUER.taxId)}</div></div>
              <div class="whd-f-c whd-f-br"><label>\u0E2A\u0E32\u0E02\u0E32</label>
                <div class="whd-v">\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48</div></div>
            </div>
            <div class="whd-f"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label>
              <div class="whd-v whd-v-ml">${esc(ISSUER.address)}</div></div>
            <div class="whd-f whd-f-last"><label>\u0E42\u0E17\u0E23. / \u0E42\u0E17\u0E23\u0E2A\u0E32\u0E23</label>
              <div class="whd-v">${esc(ISSUER.tel)} <i>|</i> ${esc(ISSUER.fax)}</div></div>
          </div>
        </div>
      </section>

      <section class="whd-ref">
        <div class="whd-ref-c"><label>\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07</label>
          <span class="whd-ref-v">${refTxt}</span></div>
        <div class="whd-ref-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19</label>
          <span class="whd-ref-v">${esc(payDate(null, w.pay_date))}</span></div>
        ${inv.invoice_date ? `<div class="whd-ref-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49</label>
          <span class="whd-ref-v">${dmy(inv.invoice_date)}</span></div>` : ""}
      </section>

      <section class="whd-sec">
        <div class="whd-sec-t">\u0E04. \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E30\u0E08\u0E33\u0E19\u0E27\u0E19\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07</div>
        <table class="whd-tbl">
          <colgroup><col class="w-no"><col class="w-dt"><col class="w-ds">
            <col class="w-base"><col class="w-rate"><col class="w-tax"></colgroup>
          <thead><tr>
            <th class="whd-c">\u0E25\u0E33\u0E14\u0E31\u0E1A</th>
            <th class="whd-c">\u0E27\u0E31\u0E19 \u0E40\u0E14\u0E37\u0E2D\u0E19<br>\u0E1B\u0E35\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
            <th class="whd-c">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E1E\u0E36\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
            <th class="whd-c">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22<br>(\u0E1A\u0E32\u0E17)</th>
            <th class="whd-c">\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35<br>\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01</th>
            <th class="whd-c">\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07\u0E44\u0E27\u0E49<br>(\u0E1A\u0E32\u0E17)</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="whd-sumrow">
            <td colspan="3" class="whd-r">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E19\u0E33\u0E2A\u0E48\u0E07</td>
            <td class="whd-r whd-b">${money(S.base)}</td>
            <td></td>
            <td class="whd-r whd-total">${money(S.tax)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="whd-words">
        ${bub3("abc")}
        <div class="whd-words-b">
          <div class="whd-words-t">\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E41\u0E25\u0E30\u0E19\u0E33\u0E2A\u0E48\u0E07 (\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23)</div>
          <div class="whd-words-v">( ${esc(bahtText(S.tax))} )</div>
        </div>
      </section>

      ${w.note ? `<section class="whd-note">
        <div class="whd-note-t">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</div>
        <div class="whd-note-v">${esc(w.note)}</div>
      </section>` : ""}

      <section class="whd-declare">
        <div class="whd-dec-t">\u0E01\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</div>
        <p>\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E49\u0E32\u0E07\u0E15\u0E49\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22
           \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E25\u0E07\u0E19\u0E32\u0E21\u0E42\u0E14\u0E22\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 (\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19) \u0E15\u0E32\u0E21\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E19\u0E2A\u0E48\u0E27\u0E19 \u0E01.
           \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E20\u0E32\u0E22\u0E43\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19
           <b>\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E41\u0E17\u0E19\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A</b></p>
        <div class="whd-rec">
          <div class="whd-rec-c"><label>\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E25\u0E07\u0E19\u0E32\u0E21\u0E42\u0E14\u0E22</label>
            <span>${txt5(p.name)}</span></div>
          <div class="whd-rec-c"><label>\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25</label>
            <span>${txt5(w.created_by_name)}</span></div>
          <div class="whd-rec-c"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</label>
            <span>${dmy(w.document_date)}</span></div>
        </div>
      </section>

      <div class="whd-edge"></div>
    </div>`;
  }
  function openWhtDoc(w, { print = false } = {}) {
    const b = document.createElement("div");
    const draw = (k) => {
      b.innerHTML = whtDocHTML(w, { copy: k });
    };
    draw("original");
    const f = document.createElement("div");
    f.innerHTML = `<div class="mf-left">
      <select class="sel" id="whd-copy">${WHD_COPIES.map((c, i) => `<option value="${c.key}" ${i === 0 ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select>
    </div><div class="mf-right">
      <button class="btn btn-print" id="whd-print">\u{1F5A8} Print / Save PDF</button>
      <button class="btn btn-o" data-close>\u2715 \u0E1B\u0E34\u0E14</button></div>`;
    const no = String(w.certificate_no || w.document_no || "");
    openModal({
      title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A " + (/^WHTDRAFT-/.test(no) || String(w.status).toUpperCase() === "DRAFT" ? "(\u0E23\u0E48\u0E32\u0E07)" : no),
      body: b,
      footer: f,
      fullscreen: true,
      wide: true
    });
    f.querySelector("#whd-copy").onchange = (e) => draw(e.target.value);
    f.querySelector("#whd-print").onclick = () => window.print();
    if (print) setTimeout(() => window.print(), 60);
  }
  var txt5, num6, r25, pct3, INCOME_LABEL, incomeLabel, WHD_COPIES, ICON6, bub3, addr, PAY_NONE, payDate;
  var init_wht_doc = __esm({
    "assets/js/withholding/wht-doc.js"() {
      init_formatter();
      init_modal();
      init_baht_text();
      init_company_doc();
      txt5 = (v, fb = "-") => {
        const s = v === null || v === void 0 ? "" : String(v).trim();
        return esc(s || fb);
      };
      num6 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      r25 = (n) => Math.round((num6(n) + Number.EPSILON) * 100) / 100;
      pct3 = (v) => {
        const n = num6(v);
        return (Number.isInteger(n) ? String(n) : String(r25(n))) + "%";
      };
      INCOME_LABEL = {
        SERVICE: "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E33\u0E02\u0E2D\u0E07",
        TRANSPORT: "\u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07",
        RENT: "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32",
        OTHER: "\u0E2D\u0E37\u0E48\u0E19 \u0E46"
      };
      incomeLabel = (k) => {
        const key = String(k || "").toUpperCase();
        return INCOME_LABEL[key] || String(k || "-");
      };
      WHD_COPIES = [
        { key: "original", label: "\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 1 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E43\u0E0A\u0E49\u0E41\u0E19\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E41\u0E1A\u0E1A\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E20\u0E32\u0E29\u0E35)" },
        { key: "copy", label: "\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 2 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19)" },
        { key: "file", label: "\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E04\u0E39\u0E48\u0E09\u0E1A\u0E31\u0E1A (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19)" }
      ];
      ICON6 = {
        payer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>',
        payee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
        list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',
        abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>'
      };
      bub3 = (k) => `<span class="whd-bub">${ICON6[k] || ""}</span>`;
      addr = (v) => txt5(v, "-");
      PAY_NONE = "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014";
      payDate = (itemDate, headDate) => {
        if (itemDate) return dmy(itemDate);
        if (headDate) return dmy(headDate);
        return PAY_NONE;
      };
    }
  });

  // assets/js/withholding/withholding-page.js
  var withholding_page_exports = {};
  __export(withholding_page_exports, {
    render: () => render10
  });
  function backendPanel2(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u2014 \u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 50 \u0E17\u0E27\u0E34 \u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</h2></div></div>
    <div class="card card-pad whp-req">
      <h3 class="t-b">BACKEND REQUIRED \u2014 \u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</h3>
      <p class="t-2 mt-1">\u0E15\u0E23\u0E27\u0E08\u0E01\u0E31\u0E1A\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 50 \u0E17\u0E27\u0E34</p>
      <ul class="whp-req-l">
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07 <code>njacc_wht_items</code> \u2014 \u0E40\u0E01\u0E47\u0E1A\u0E44\u0E14\u0E49 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D 1 \u0E43\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19</li>
        <li>\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A <code>DRAFT</code> \u2014 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</li>
        <li><code>njacc_list_wht</code> \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E37\u0E19 \u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 / \u0E2A\u0E32\u0E02\u0E32 / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 \u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35 RPC \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE \u0E21\u0E32\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2D\u0E31\u0E15\u0E23\u0E32 WHT \u0E41\u0E25\u0E30\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07</li>
        <li>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C <code>certificate_no</code> \u2014 \u0E41\u0E22\u0E01\u0E40\u0E25\u0E02\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01
            \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</li>
        <li><code>njacc_create_wht</code> \u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E22\u0E34\u0E07\u0E15\u0E23\u0E07\u0E41\u0E25\u0E30\u0E21\u0E35 Default 3%</li>
      </ul>
      <p class="t-sm t-3 mt-2">\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E19\u0E44\u0E1F\u0E25\u0E4C\u0E19\u0E35\u0E49\u0E1A\u0E19 Supabase \u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07:</p>
      <p class="whp-req-f"><code>${esc(SQL_FILE2)}</code></p>
      <p class="t-sm t-3 mt-2">\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E19 \u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34
        \u2014 \u0E44\u0E1F\u0E25\u0E4C SQL \u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E41\u0E15\u0E30 INVOICE / RECEIPT / CREDIT NOTE / \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E14\u0E34\u0E21</p>
    </div>`;
  }
  async function render10(cnt) {
    ed2 = null;
    await masters();
    await renderList2(cnt);
  }
  async function renderList2(cnt) {
    const mayIssue = isAdmin() || can("issue_receipt");
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u2014 \u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 50 \u0E17\u0E27\u0E34 \u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</h2></div>
      ${mayIssue ? '<button class="btn btn-p" id="wh-new">+ \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</button>' : ""}</div>
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st4.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st4.from}">
      <input class="inp" type="date" data-f="to" value="${st4.to}">
      <button class="btn btn-o btn-sm" id="wh-go">\u0E04\u0E49\u0E19\u0E2B\u0E32</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E25\u0E02\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 (\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)</th><th>\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07 INVOICE</th>
      <th class="r">\u0E10\u0E32\u0E19\u0E20\u0E32\u0E29\u0E35</th><th class="center">\u0E2D\u0E31\u0E15\u0E23\u0E32</th><th class="r">\u0E22\u0E2D\u0E14\u0E2B\u0E31\u0E01</th>
      <th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="wh-tbody">
      <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="wh-pgn"></div>`;
    const nb = cnt.querySelector("#wh-new");
    if (nb) nb.onclick = () => renderPick2(cnt);
    cnt.querySelector("#wh-go").onclick = () => {
      cnt.querySelectorAll("[data-f]").forEach((el) => {
        st4[el.dataset.f] = el.value;
      });
      st4.page = 1;
      load();
    };
    cnt.querySelector("#wh-tbody").addEventListener("click", (e) => onRowAction2(e, cnt, load));
    async function load() {
      const t = nextToken("wht");
      const tb = cnt.querySelector("#wh-tbody");
      if (!tb) return;
      try {
        const res = await listWht({
          p_customer: st4.customer || null,
          p_from: st4.from || null,
          p_to: st4.to || null,
          p_page: st4.page,
          p_size: st4.size
        });
        if (!isCurrent("wht", t)) return;
        const rows = res.rows || [];
        if (rows.length && rows[0].item_count === void 0) {
          backendPanel2(cnt);
          return;
        }
        tb.innerHTML = rows.length ? rows.map((r) => {
          const s = String(r.status || "").toUpperCase();
          const no = String(r.document_no || "");
          const isDraft = s === "DRAFT" || /^WHTDRAFT-/.test(no);
          const cert = String(r.certificate_no || "").trim();
          return `<tr>
        <td class="t-b">${cert ? esc(cert) : isDraft ? '<span class="t-3">\u2014 \u0E23\u0E48\u0E32\u0E07 \u2014</span>' : '<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E25\u0E02</span>'}
          ${!isDraft && no ? `<div class="t-xs t-3">\u0E20\u0E32\u0E22\u0E43\u0E19: ${esc(no)}</div>` : ""}</td>
        <td>${dmy(r.document_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name || "-")}</td>
        <td class="t-b">${esc(r.invoice_no || r.reference_no || "-")}</td>
        <td class="r">${money(r.tax_base)}</td>
        <td class="center"><span class="wht-rate-chip">${esc(pct4(r.rate))}</span></td>
        <td class="r t-b">${money(r.amount)}</td>
        <td>${stBadge2(s)}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-doc="${r.id}">\u0E14\u0E39 / \u0E1E\u0E34\u0E21\u0E1E\u0E4C</button>
          ${isDraft && (isAdmin() || can("issue_receipt")) ? `<button class="btn btn-o btn-sm" data-edit="${r.id}">\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07</button>
               <button class="btn btn-p btn-sm" data-post="${r.id}">\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</button>
               <button class="btn btn-danger btn-sm" data-del="${r.id}">\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07</button>` : ""}
          ${s === "ISSUED" && (isAdmin() || can("void")) ? `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(no)}">Void</button>` : ""}
        </div></td></tr>`;
        }).join("") : '<tr><td colspan="9" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</td></tr>';
        renderPagination(
          cnt.querySelector("#wh-pgn"),
          { page: st4.page, size: st4.size, total: res.total || 0 },
          ({ page, size }) => {
            st4.page = page;
            st4.size = size;
            load();
          }
        );
      } catch (e) {
        if (!isCurrent("wht", t)) return;
        if (isWhtBackendMissing(e)) {
          backendPanel2(cnt);
          return;
        }
        tb.innerHTML = '<tr><td colspan="9" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>';
        handleErr(e);
      }
    }
    await load();
  }
  async function onRowAction2(e, cnt, reload) {
    const doc = e.target.closest("[data-doc]");
    if (doc) {
      try {
        openWhtDoc(await whtView(doc.dataset.doc));
      } catch (ex) {
        isWhtBackendMissing(ex) ? backendPanel2(cnt) : toast(whtErrMessage(ex), "err");
      }
      return;
    }
    const eb = e.target.closest("[data-edit]");
    if (eb) {
      openEditor2(cnt, { whtId: eb.dataset.edit });
      return;
    }
    const pb = e.target.closest("[data-post]");
    if (pb) {
      if (!await confirmModal(
        "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A",
        "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u2014 N.J. \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46",
        "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"
      )) return;
      try {
        const r = await once("post-wht-" + pb.dataset.post, () => postWht(pb.dataset.post, newRequestId()));
        if (r) toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19 " + (r.document_no || ""), "ok");
        reload();
      } catch (ex) {
        toast(whtErrMessage(ex), "err");
      }
      return;
    }
    const db = e.target.closest("[data-del]");
    if (db) {
      const reason = await reasonModal("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 (\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E23\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E23\u0E34\u0E07)");
      if (!reason) return;
      try {
        await once("del-wht-" + db.dataset.del, () => deleteWhtDraft(db.dataset.del, reason));
        toast("\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27", "ok");
        reload();
      } catch (ex) {
        toast(whtErrMessage(ex), "err");
      }
      return;
    }
    const vb = e.target.closest("[data-void]");
    if (vb) {
      const reason = await reasonModal("Void \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 " + vb.dataset.no);
      if (!reason) return;
      try {
        await once("void-wht-" + vb.dataset.void, () => voidWht(vb.dataset.void, reason, newRequestId()));
        toast("Void \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27", "ok");
        reload();
      } catch (ex) {
        handleErr(ex);
      }
    }
  }
  async function renderPick2(cnt) {
    pk2.page = 1;
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE \u0E15\u0E49\u0E19\u0E17\u0E32\u0E07</h2></div>
      <button class="btn btn-o" id="wh-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E36\u0E07\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 \xB7 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E2D\u0E31\u0E15\u0E23\u0E32 WHT \u0E08\u0E23\u0E34\u0E07
        \xB7 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 \u201C\u0E02\u0E49\u0E32\u0E21\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</p>
      <div class="fbar mt-2">
        <input class="inp" id="wh-pq" value="${esc(pk2.q)}" placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 INVOICE / \u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
        <button class="btn btn-o btn-sm" id="wh-pgo">\u0E04\u0E49\u0E19\u0E2B\u0E32</button>
        <button class="btn btn-o btn-sm" id="wh-skip">\u0E02\u0E49\u0E32\u0E21 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</th><th>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</th><th>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17</th>
        <th class="r">\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34</th><th>\u0E2D\u0E31\u0E15\u0E23\u0E32 WHT</th><th class="r">WHT</th>
        <th>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
      </tr></thead><tbody id="wh-ptb">
        <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="wh-ppgn"></div>
    </div>`;
    cnt.querySelector("#wh-back").onclick = () => renderList2(cnt);
    cnt.querySelector("#wh-skip").onclick = () => openEditor2(cnt, {});
    const q2 = cnt.querySelector("#wh-pq");
    cnt.querySelector("#wh-pgo").onclick = () => {
      pk2.q = q2.value.trim();
      pk2.page = 1;
      loadPick();
    };
    q2.addEventListener("input", () => debounce("wh-pick", () => {
      pk2.q = q2.value.trim();
      pk2.page = 1;
      loadPick();
    }, 350));
    cnt.querySelector("#wh-ptb").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pick]");
      if (b) openEditor2(cnt, { invoice: JSON.parse(b.dataset.pick) });
    });
    async function loadPick() {
      const t = nextToken("wh-pick");
      const tb = cnt.querySelector("#wh-ptb");
      if (!tb) return;
      try {
        const res = await whtInvoiceOptions({ q: pk2.q || null, page: pk2.page, size: pk2.size });
        if (!isCurrent("wh-pick", t)) return;
        const rows = res.rows || [];
        tb.innerHTML = rows.length ? rows.map((r) => {
          const bd = r.wht_breakdown || [];
          const rateTxt = bd.length ? bd.map((b) => pct4(b.rate)).join(" + ") : "-";
          return `<tr>
        <td class="t-b">${esc(r.invoice_no || "-")}</td>
        <td>${dmy(r.invoice_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name || "-")}</td>
        <td>${esc(r.charge_type || "-")}</td>
        <td class="r">${money(r.total_amount)}</td>
        <td class="center">${esc(rateTxt)}</td>
        <td>${r.payment_date ? dmy(r.payment_date) : (r.payments || []).length > 1 ? '<span class="t-3">' + (r.payments || []).length + " \u0E04\u0E23\u0E31\u0E49\u0E07 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2D\u0E07</span>" : '<span class="t-3">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-p btn-sm" data-pick='${JSON.stringify(r).replace(/'/g, "&#39;")}'>\u0E40\u0E25\u0E37\u0E2D\u0E01</button>
        </div></td></tr>`;
        }).join("") : '<tr><td colspan="9" class="empty">\u0E44\u0E21\u0E48\u0E1E\u0E1A INVOICE \u2014 \u0E01\u0E14 \u201C\u0E02\u0E49\u0E32\u0E21\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49</td></tr>';
        renderPagination(
          cnt.querySelector("#wh-ppgn"),
          { page: pk2.page, size: pk2.size, total: res.total || 0 },
          ({ page, size }) => {
            pk2.page = page;
            pk2.size = size;
            loadPick();
          }
        );
      } catch (e) {
        if (!isCurrent("wh-pick", t)) return;
        if (isWhtBackendMissing(e)) {
          backendPanel2(cnt);
          return;
        }
        tb.innerHTML = '<tr><td colspan="9" class="empty">\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</td></tr>';
        toast(whtErrMessage(e), "err");
      }
    }
    await loadPick();
  }
  async function openEditor2(cnt, { whtId = null, invoice = null } = {}) {
    cnt.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';
    let prev = null;
    if (whtId) {
      try {
        prev = await whtView(whtId);
      } catch (e) {
        if (isWhtBackendMissing(e)) {
          backendPanel2(cnt);
          return;
        }
        toast(whtErrMessage(e), "err");
        return renderList2(cnt);
      }
    }
    const today = ymd(/* @__PURE__ */ new Date());
    ed2 = {
      whtId: whtId || null,
      customer_id: prev ? prev.customer_id : invoice ? invoice.customer_id : "",
      invoice_id: prev ? prev.invoice_id || null : invoice ? invoice.id : null,
      invoice_no: prev ? prev.invoice && prev.invoice.invoice_no : invoice ? invoice.invoice_no : null,
      document_date: prev ? prev.document_date : today,
      /* *** วันที่จ่ายเงินจริง ห้ามใช้ invoice_date แทน (คนละความหมาย) ***
         มี Payment เดียว -> เติมจาก njacc_payments.payment_date จริง
         ไม่มี Payment หรือมีหลายรายการ -> เว้นว่าง ให้ผู้ใช้ระบุเอง
         (มีหลายรายการ SQL จะคืน payment_date = null เพราะไม่เดาว่าจะเอาวันไหน) */
      pay_date: prev ? prev.pay_date || "" : invoice ? invoice.payment_date || "" : "",
      payments: invoice ? invoice.payments || [] : [],
      certificate_no: prev ? prev.certificate_no || "" : "",
      reference_no: prev ? prev.reference_no || "" : invoice ? invoice.invoice_no || "" : "",
      note: prev ? prev.note || "" : "",
      lines: []
    };
    if (prev && (prev.items || []).length) {
      ed2.lines = prev.items.map((it) => ({
        pay_date: it.pay_date || ed2.pay_date,
        income_type: String(it.income_type || "SERVICE").toUpperCase(),
        description: it.description || "",
        tax_base: num7(it.tax_base),
        rate: num7(it.rate)
      }));
    } else if (invoice) {
      const bd = invoice.wht_breakdown || [];
      const autoPay = invoice.payment_date || "";
      ed2.lines = bd.length ? bd.map((b) => ({
        pay_date: autoPay,
        income_type: String(invoice.charge_type || "").toUpperCase() === "ADVANCE" ? "OTHER" : "SERVICE",
        description: b.description || invoice.description || "",
        tax_base: num7(b.tax_base),
        rate: num7(b.rate)
      })) : [{
        pay_date: autoPay,
        income_type: "SERVICE",
        description: invoice.description || "",
        tax_base: num7(invoice.subtotal),
        rate: 0
      }];
    }
    if (!ed2.lines.length) {
      ed2.lines = [{ pay_date: "", income_type: "SERVICE", description: "", tax_base: 0, rate: 0 }];
    }
    const cust = activeCustomers().find((c) => c.id === ed2.customer_id) || null;
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${ed2.whtId ? "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E48\u0E32\u0E07" : "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"}\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</h2></div>
      <button class="btn btn-o" id="wh-back">\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div>

    <div class="whp-top">
      <div class="card card-pad">
        <h3 class="t-b">\u0E01. \u0E1C\u0E39\u0E49\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</h3>
        <p class="t-xs t-3">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E43\u0E2B\u0E49 N.J.</p>
        <div class="fld"><label>\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19 <span class="req">*</span></label>
          <select class="sel w100" id="wh-cust">${customerOpts(ed2.customer_id)}</select></div>
        <div id="wh-payee" class="whp-payee"></div>
        <div class="whp-nj">
          <div class="whp-nj-t">\u0E02. \u0E1C\u0E39\u0E49\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</div>
          <div class="whp-nj-v">${esc(ISSUER.nameEn)}</div>
          <div class="whp-nj-s">\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 ${esc(ISSUER.taxId)} \xB7 \u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48</div>
          <div class="whp-nj-s">${esc(ISSUER.address)}</div>
          <p class="t-xs t-3">\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01 Company Config \u0E01\u0E25\u0E32\u0E07 \u2014 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E30\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49</p>
        </div>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</h3>
        <div class="fld"><label>\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 (\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01)</label>
          <input class="inp w100" id="wh-cert" value="${esc(ed2.certificate_no)}"
            placeholder="\u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E15\u0E31\u0E27\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32">
          <p class="t-xs t-3">\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01
            \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E15\u0E31\u0E27\u0E08\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49</p></div>
        <div class="whp-kv"><label>\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19</label>
          <span class="t-3">${ed2.whtId && prev && !/^WHTDRAFT-/.test(String(prev.document_no || "")) ? esc(prev.document_no) : "\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E15\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07"}</span></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 <span class="req">*</span></label>
          <input class="inp w100" type="date" id="wh-ddate" value="${esc(ed2.document_date)}"></div>
        <div class="fld"><label>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07 <span class="req">*</span></label>
          <input class="inp w100" type="date" id="wh-pdate" value="${esc(ed2.pay_date || "")}">
          ${ed2.payments && ed2.payments.length > 1 ? `<p class="t-xs whp-warn">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30 ${ed2.payments.length} \u0E04\u0E23\u0E31\u0E49\u0E07 \u2014
                \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A:
                ${ed2.payments.map((x) => esc(dmy(x.payment_date)) + " (" + esc(x.payment_no || "-") + ")").join(" \xB7 ")}</p>` : ed2.payments && ed2.payments.length === 1 ? `<p class="t-xs t-3">\u0E40\u0E15\u0E34\u0E21\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E08\u0E23\u0E34\u0E07 ${esc(ed2.payments[0].payment_no || "")}
                  ${esc(dmy(ed2.payments[0].payment_date))}</p>` : '<p class="t-xs t-3">\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A</p>'}
          <p class="t-xs t-3">\u0E04\u0E19\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 \xB7 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E04\u0E48\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07</p></div>
        <div class="fld"><label>\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07 / INVOICE</label>
          <input class="inp w100" id="wh-ref" value="${esc(ed2.reference_no)}"
            placeholder="\u0E40\u0E0A\u0E48\u0E19 NJ202608-00001">
          ${ed2.invoice_no ? `<p class="t-xs t-3">\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A INVOICE \u0E08\u0E23\u0E34\u0E07\u0E41\u0E25\u0E49\u0E27: <b>${esc(ed2.invoice_no)}</b>
            (\u0E40\u0E01\u0E47\u0E1A\u0E14\u0E49\u0E27\u0E22 invoice_id \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21)</p>` : ""}</div>
        <div class="fld"><label>\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</label>
          <input class="inp w100" id="wh-note" value="${esc(ed2.note)}"></div>
      </div>
    </div>

    <div class="card card-pad mt-2">
      <div class="whp-ihead">
        <h3 class="t-b">\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E30\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01</h3>
        <button class="btn btn-o btn-sm" id="wh-add">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button>
      </div>
      <p class="t-xs t-3">\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E21\u0E32\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07 (\u0E16\u0E49\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01 INVOICE \u0E08\u0E30\u0E40\u0E15\u0E34\u0E21\u0E43\u0E2B\u0E49\u0E08\u0E32\u0E01 njacc_invoice_items)
        \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E25\u0E30\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\u0E17\u0E35\u0E48\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E2D\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</p>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th style="width:132px">\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07 <span class="req">*</span></th>
        <th style="width:170px">\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49</th>
        <th>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</th>
        <th class="r" style="width:130px">\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</th>
        <th class="r" style="width:96px">\u0E2D\u0E31\u0E15\u0E23\u0E32 %</th>
        <th class="r" style="width:120px">\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01</th>
        <th class="center" style="width:56px">\u0E25\u0E1A</th>
      </tr></thead><tbody id="wh-ltb"></tbody></table></div>

      <div class="whp-foot mt-2">
        <div class="whp-tot">
          <div><span>\u0E23\u0E27\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span><b id="wh-t-base">0.00</b></div>
          <div class="whp-tot-g"><span>\u0E23\u0E27\u0E21\u0E20\u0E32\u0E29\u0E35\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</span><b id="wh-t-tax">0.00</b></div>
        </div>
        <div class="whp-btn">
          <button class="btn btn-o" id="wh-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07</button>
          <button class="btn btn-o" id="wh-prev" ${ed2.whtId ? "" : "disabled"}>Preview / \u0E14\u0E39\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07</button>
          <button class="btn btn-p" id="wh-post" ${ed2.whtId ? "" : "disabled"}>\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23</button>
        </div>
      </div>
      ${ed2.whtId ? "" : '<p class="t-xs t-3 mt-1">Preview \u0E41\u0E25\u0E30\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E33\u0E44\u0E14\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 (\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19)</p>'}
    </div>`;
    const tb = cnt.querySelector("#wh-ltb");
    cnt.querySelector("#wh-back").onclick = () => renderList2(cnt);
    cnt.querySelector("#wh-ddate").onchange = (e) => {
      ed2.document_date = e.target.value;
    };
    cnt.querySelector("#wh-pdate").onchange = (e) => {
      ed2.pay_date = e.target.value;
    };
    cnt.querySelector("#wh-cert").oninput = (e) => {
      ed2.certificate_no = e.target.value;
    };
    cnt.querySelector("#wh-ref").oninput = (e) => {
      ed2.reference_no = e.target.value;
    };
    cnt.querySelector("#wh-note").oninput = (e) => {
      ed2.note = e.target.value;
    };
    cnt.querySelector("#wh-cust").onchange = (e) => {
      ed2.customer_id = e.target.value;
      if (ed2.invoice_id) {
        ed2.invoice_id = null;
        ed2.invoice_no = null;
      }
      drawPayee();
    };
    cnt.querySelector("#wh-add").onclick = () => {
      ed2.lines.push({
        pay_date: ed2.pay_date || "",
        income_type: "SERVICE",
        description: "",
        tax_base: 0,
        rate: 0
      });
      drawLines();
    };
    tb.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.i);
      if (!Number.isInteger(i) || !ed2.lines[i]) return;
      const k = e.target.dataset.k;
      if (k === "tax_base" || k === "rate") {
        ed2.lines[i][k] = num7(e.target.value);
        refreshRow(i);
        refreshTotals();
      } else if (k === "description") ed2.lines[i].description = e.target.value;
    });
    tb.addEventListener("change", (e) => {
      const i = Number(e.target.dataset.i);
      if (!Number.isInteger(i) || !ed2.lines[i]) return;
      const k = e.target.dataset.k;
      if (k === "pay_date" || k === "income_type") ed2.lines[i][k] = e.target.value;
    });
    tb.addEventListener("click", (e) => {
      const b = e.target.closest("[data-del-line]");
      if (!b) return;
      if (ed2.lines.length <= 1) {
        toast("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
        return;
      }
      ed2.lines.splice(Number(b.dataset.delLine), 1);
      drawLines();
    });
    cnt.querySelector("#wh-save").onclick = (e) => doSave2(cnt, e.target);
    cnt.querySelector("#wh-prev").onclick = async () => {
      if (!ed2.whtId) return;
      try {
        openWhtDoc(await whtView(ed2.whtId));
      } catch (ex) {
        toast(whtErrMessage(ex), "err");
      }
    };
    cnt.querySelector("#wh-post").onclick = async () => {
      if (!ed2.whtId) return;
      if (!ed2.pay_date) {
        toast("\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01", "err");
        return;
      }
      if (ed2.lines.some((l) => !l.pay_date)) {
        toast("\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07", "err");
        return;
      }
      if (!await confirmModal(
        "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A",
        "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E44\u0E27\u0E49<br>\u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 \u2014 N.J. \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19<br>INVOICE \u0E15\u0E49\u0E19\u0E09\u0E1A\u0E31\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E44\u0E02\u0E43\u0E14 \u0E46",
        "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"
      )) return;
      try {
        const r = await once("post-wht-" + ed2.whtId, () => postWht(ed2.whtId, newRequestId()));
        if (r) toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E02\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19 " + (r.document_no || ""), "ok");
        renderList2(cnt);
      } catch (ex) {
        toast(whtErrMessage(ex), "err");
      }
    };
    drawPayee();
    drawLines();
    function drawPayee() {
      const c = activeCustomers().find((x) => x.id === ed2.customer_id) || null;
      const el = cnt.querySelector("#wh-payee");
      if (!el) return;
      el.innerHTML = c ? `
      <div class="whp-kv whp-kv-2">
        <div><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label><span class="t-b">${esc(c.tax_id || "-")}</span></div>
        <div><label>\u0E2A\u0E32\u0E02\u0E32</label><span>${esc(c.branch_code || "-")}</span></div>
      </div>
      <div class="whp-kv"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</label><span>${esc(c.address || "-")}</span></div>
      <div class="whp-kv"><label>\u0E42\u0E17\u0E23.</label><span>${esc(c.phone || "-")}</span></div>` : '<p class="t-xs t-3">\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E36\u0E07\u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 / \u0E2A\u0E32\u0E02\u0E32 / \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48</p>';
    }
    function drawLines() {
      tb.innerHTML = ed2.lines.map((l, i) => {
        const tax = round2(l.tax_base * l.rate / 100);
        return `<tr>
        <td><input class="inp w100" type="date" data-i="${i}" data-k="pay_date"
              value="${esc(l.pay_date || "")}"></td>
        <td><select class="sel w100" data-i="${i}" data-k="income_type">${incomeOpts(l.income_type)}</select></td>
        <td><input class="inp w100" data-i="${i}" data-k="description"
              value="${esc(l.description || "")}" placeholder="\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 (\u0E16\u0E49\u0E32\u0E21\u0E35)"></td>
        <td><input class="inp r" type="number" step="0.01" min="0" data-i="${i}" data-k="tax_base"
              value="${l.tax_base}"></td>
        <td><input class="inp r" type="number" step="0.01" min="0" max="100" data-i="${i}" data-k="rate"
              value="${l.rate}"></td>
        <td class="r t-b" data-tax="${i}">${money(tax)}</td>
        <td class="center"><button class="btn btn-danger btn-sm" data-del-line="${i}">\u2715</button></td>
      </tr>`;
      }).join("");
      refreshTotals();
    }
    function refreshRow(i) {
      const l = ed2.lines[i];
      if (!l) return;
      const c = tb.querySelector(`[data-tax="${i}"]`);
      if (c) c.textContent = money(round2(l.tax_base * l.rate / 100));
    }
    function refreshTotals() {
      let base = 0, tax = 0;
      for (const l of ed2.lines) {
        base = round2(base + l.tax_base);
        tax = round2(tax + round2(l.tax_base * l.rate / 100));
      }
      const a = cnt.querySelector("#wh-t-base");
      if (a) a.textContent = money(base);
      const b = cnt.querySelector("#wh-t-tax");
      if (b) b.textContent = money(tax);
    }
  }
  async function doSave2(cnt, btn2) {
    if (!ed2) return;
    if (!ed2.customer_id) {
      toast("\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E2B\u0E31\u0E01\u0E20\u0E32\u0E29\u0E35 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E01\u0E48\u0E2D\u0E19", "err");
      return;
    }
    if (!ed2.lines.length) {
      toast("\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
      return;
    }
    for (const l of ed2.lines) {
      if (!(l.tax_base > 0)) {
        toast("\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", "err");
        return;
      }
      if (l.rate < 0 || l.rate > 100) {
        toast("\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07 0\u2013100", "err");
        return;
      }
    }
    const payload2 = {
      wht_id: ed2.whtId || null,
      customer_id: ed2.customer_id,
      certificate_no: (ed2.certificate_no || "").trim() || null,
      invoice_id: ed2.invoice_id || null,
      document_date: ed2.document_date || null,
      pay_date: ed2.pay_date || null,
      wht_type: ed2.lines[0].income_type,
      reference_no: (ed2.reference_no || "").trim() || null,
      note: (ed2.note || "").trim() || null,
      items: ed2.lines.map((l) => ({
        pay_date: l.pay_date || null,
        income_type: l.income_type,
        description: (l.description || "").trim() || null,
        tax_base: round2(l.tax_base),
        rate: round2(l.rate)
      }))
    };
    if (btn2) btn2.disabled = true;
    try {
      const r = await once("save-wht", () => saveWhtDraft(payload2));
      if (r && r.id) {
        ed2.whtId = r.id;
        const pv = cnt.querySelector("#wh-prev");
        if (pv) pv.disabled = false;
        const po = cnt.querySelector("#wh-post");
        if (po) po.disabled = false;
        toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01\u0E23\u0E27\u0E21 " + money(r.amount), "ok");
      }
    } catch (ex) {
      toast(whtErrMessage(ex), "err");
    } finally {
      if (btn2) btn2.disabled = false;
    }
  }
  var SQL_FILE2, st4, pk2, ed2, num7, pct4, INCOME_TYPES, incomeOpts, ST_BDG2, stBadge2;
  var init_withholding_page = __esm({
    "assets/js/withholding/withholding-page.js"() {
      init_withholding_api();
      init_wht_doc();
      init_master_cache();
      init_formatter();
      init_company_doc();
      init_permissions();
      init_pagination();
      init_modal();
      init_toast();
      init_error_handler();
      init_request_manager();
      SQL_FILE2 = "sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql";
      st4 = { customer: "", from: "", to: "", page: 1, size: 20 };
      pk2 = { q: "", page: 1, size: 10 };
      ed2 = null;
      num7 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      pct4 = (v) => {
        const n = num7(v);
        return (Number.isInteger(n) ? String(n) : String(round2(n))) + "%";
      };
      INCOME_TYPES = [
        ["SERVICE", "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E33\u0E02\u0E2D\u0E07"],
        ["TRANSPORT", "\u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07"],
        ["RENT", "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32"],
        ["OTHER", "\u0E2D\u0E37\u0E48\u0E19 \u0E46"]
      ];
      incomeOpts = (sel) => INCOME_TYPES.map(([v, l]) => `<option value="${v}" ${v === sel ? "selected" : ""}>${esc(l)}</option>`).join("");
      ST_BDG2 = {
        DRAFT: ["bdg-due-ok", "\u0E23\u0E48\u0E32\u0E07"],
        ISSUED: ["bdg-issued", "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27"],
        VOID: ["bdg-void", "VOID"]
      };
      stBadge2 = (s) => {
        const [c, t] = ST_BDG2[String(s || "").toUpperCase()] || ["bdg-due-ok", s || "-"];
        return `<span class="bdg ${c}">${esc(t)}</span>`;
      };
    }
  });

  // assets/js/master/master-admin.js
  var master_admin_exports = {};
  __export(master_admin_exports, {
    dupCustomer: () => dupCustomer,
    dupServiceCode: () => dupServiceCode,
    render: () => render11
  });
  async function render11(cnt, params = {}) {
    if (params.redirectTo) {
      location.replace("#/" + params.redirectTo);
      return;
    }
    const isSettings = params.tabs === "settings";
    const only = ["customers", "companies", "service_codes"].includes(params.only) ? params.only : null;
    if (only) tab2 = only;
    else if (params.tab && ["customers", "companies", "service_codes"].includes(params.tab)) tab2 = params.tab;
    await masters(true);
    const headTitle = isSettings ? "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32" : only ? TITLES[only] : "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01";
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>${esc(headTitle)}</h2></div>
      <div class="row">
        <input class="inp inp-search" id="ms-q" value="${esc(q)}"
          placeholder="\u0E04\u0E49\u0E19\u0E2B\u0E32: CODE / \u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 / \u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35" style="min-width:280px">
        <button class="btn btn-o" id="ms-back">\u2190 \u0E01\u0E25\u0E31\u0E1A</button>
        <button class="btn btn-p" id="ms-new">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</button></div></div>
    ${isSettings ? `<div class="rep-tabs">
      ${SETTINGS_TABS.map((t) => `<button class="rep-tab ${tab2 === t.key ? "active" : ""}" data-goroute="${t.route}">${esc(t.label)}</button>`).join("")}
    </div>` : ""}
    ${only ? "" : `<div class="rep-tabs">
      <button class="rep-tab ${tab2 === "customers" ? "active" : ""}" data-tab="customers">\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32</button>
      <button class="rep-tab ${tab2 === "companies" ? "active" : ""}" data-tab="companies">\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</button>
      <button class="rep-tab ${tab2 === "service_codes" ? "active" : ""}" data-tab="service_codes">\u0E23\u0E2B\u0E31\u0E2A\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23</button>
    </div>`}
    <div id="ms-body"></div>`;
    const setTabsEl = isSettings ? cnt.querySelector(".rep-tabs") : null;
    if (setTabsEl) setTabsEl.addEventListener("click", (e) => {
      const b2 = e.target.closest("[data-goroute]");
      if (!b2) return;
      if (b2.classList.contains("active")) return;
      q = "";
      location.hash = "#/" + b2.dataset.goroute;
    });
    const tabsEl = isSettings ? null : cnt.querySelector(".rep-tabs");
    if (tabsEl) tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      tab2 = b.dataset.tab;
      cnt.querySelectorAll(".rep-tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === tab2));
      drawTable(cnt);
    });
    cnt.querySelector("#ms-q").addEventListener("input", (e) => {
      q = e.target.value;
      drawTable(cnt);
    });
    cnt.querySelector("#ms-back").onclick = () => history.back();
    cnt.dataset.msOnly = only || "";
    cnt.dataset.msTabs = isSettings ? "settings" : "";
    cnt.querySelector("#ms-new").onclick = () => openEdit(cnt, null);
    cnt.querySelector("#ms-body").addEventListener("click", (e) => {
      const b = e.target.closest("[data-edit]");
      if (!b) return;
      const list = AppState.masters[tab2] || [];
      openEdit(cnt, list.find((x) => x.id === b.dataset.edit));
    });
    drawTable(cnt);
  }
  function drawTable(cnt) {
    const body = cnt.querySelector("#ms-body");
    const m = AppState.masters;
    const stBdg = (a) => a !== false ? '<span class="bdg bdg-paid">ACTIVE</span>' : '<span class="bdg bdg-void">DISABLED</span>';
    const t = nk(q);
    const hit = (c, extra = []) => !t || [c.name, c.code, ...extra].some((v) => nk(v).includes(t)) || nkTax(c.tax_id).includes(nkTax(q));
    if (tab2 === "customers") {
      const rows = (m.customers || []).filter((c) => hit(c, [c.branch_code, c.phone, c.contact_name]));
      body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>CODE</th><th>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th><th>\u0E2A\u0E32\u0E02\u0E32</th><th>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</th><th>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23</th><th>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th></th>
    </tr></thead><tbody>${rows.map((c) => `<tr>
      <td class="t-b">${esc(c.code || "-")}</td><td class="t-b">${esc(c.name)}</td>
      <td>${esc(c.branch_code || "-")}</td><td>${esc(c.tax_id || "-")}</td>
      <td class="t-xs">${esc(c.phone || "-")}</td>
      <td class="t-xs ellip" title="${esc(c.address || "")}">${esc(c.address || "-")}</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">\u0E41\u0E01\u0E49\u0E44\u0E02</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty">${t ? "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A \u201C" + esc(q) + "\u201D" : '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \u2014 \u0E01\u0E14 "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"'}</td></tr>`}</tbody></table></div>`;
    } else if (tab2 === "companies") {
      body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</th><th>\u0E23\u0E2B\u0E31\u0E2A</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th></th>
    </tr></thead><tbody>${(m.companies || []).filter((c) => hit(c)).map((c) => `<tr>
      <td class="t-b">${esc(c.name)}</td><td>${esc(c.code || "-")}</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">\u0E41\u0E01\u0E49\u0E44\u0E02</button></td></tr>`).join("") || '<tr><td colspan="4" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice</td></tr>'}</tbody></table></div>`;
    } else {
      const bdgApply = (v) => `<span class="bdg ${v === "SERVICE" ? "bdg-svc" : v === "ADVANCE" ? "bdg-adv" : "bdg-paid"}">${v}</span>`;
      const rows = (m.service_codes || []).filter((c) => !t || nk(c.code).includes(t) || nk(c.description).includes(t));
      body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th style="width:130px">CODE</th><th>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23</th><th style="width:110px">\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A</th>
      <th class="r" style="width:80px">VAT</th><th class="r" style="width:80px">WHT</th>
      <th style="width:100px">\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th style="width:90px"></th>
    </tr></thead><tbody>${rows.map((c) => `<tr>
      <td class="t-b">${esc(c.code)}</td><td>${esc(c.description)}</td>
      <td>${bdgApply(applyTo(c))}</td>
      <td class="r">${vatRateOf(c)}%</td>
      <td class="r">${whtRateOf(c)}%</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">\u0E41\u0E01\u0E49\u0E44\u0E02</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">${t ? "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A \u201C" + esc(q) + "\u201D" : '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u2014 \u0E01\u0E14 "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"'}</td></tr>`}</tbody></table></div>`;
    }
  }
  function openEdit(cnt, row) {
    const isNew = !row;
    row = row || {};
    const b = document.createElement("div");
    const activeSel = `<select class="sel" id="me-active">
    <option value="true" ${row.active !== false ? "selected" : ""}>ACTIVE</option>
    <option value="false" ${row.active === false ? "selected" : ""}>DISABLED</option></select>`;
    if (tab2 === "customers") {
      b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>CODE \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 <span class="req">*</span></label><input class="inp" id="me-code" value="${esc(row.code || "")}" placeholder="\u0E40\u0E0A\u0E48\u0E19 C001"></div>
      <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 <span class="req">*</span></label><input class="inp" id="me-name" value="${esc(row.name || "")}"></div>
      <div class="fld"><label>\u0E2A\u0E32\u0E02\u0E32</label><input class="inp" id="me-branch" value="${esc(row.branch_code || "")}" placeholder="\u0E40\u0E0A\u0E48\u0E19 00000 \u0E2B\u0E23\u0E37\u0E2D \u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48"></div>
      <div class="fld"><label>\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35</label><input class="inp" id="me-tax" value="${esc(row.tax_id || "")}"></div>
      <div class="fld"><label>\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23</label><input class="inp" id="me-phone" value="${esc(row.phone || "")}"></div>
      <div class="fld"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label>${activeSel}</div>
    </div>
    <div class="fld mt-2"><label>\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label><textarea class="inp w100" id="me-addr">${esc(row.address || "")}</textarea></div>
    <div class="ms-dup" id="me-dup" hidden></div>`;
    } else if (tab2 === "companies") {
      b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 <span class="req">*</span></label><input class="inp" id="me-name" value="${esc(row.name || "")}"></div>
      <div class="fld"><label>\u0E23\u0E2B\u0E31\u0E2A\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17</label><input class="inp" id="me-code" value="${esc(row.code || "")}"></div>
      <div class="fld"><label>Contact (LIST NAME)</label>
        <input class="inp" id="me-contact" value="${esc(row.contact_name || "")}"></div>
      <div class="fld"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label>${activeSel}</div>
    </div>`;
    } else {
      const ap = applyTo(row);
      const curVat = vatRateOf(row);
      const curWht = whtRateOf(row);
      const vatOpts = [...new Set([0, 7, Number(AppState.masters?.vat_rate ?? 7), curVat].filter((n) => Number.isFinite(n)))].sort((x, y) => x - y);
      const whtOpts = [...new Set([0, 1, 3, curWht].filter((n) => Number.isFinite(n)))].sort((x, y) => x - y);
      b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>CODE <span class="req">*</span></label>
        <input class="inp" id="me-code" value="${esc(row.code || "")}" placeholder="\u0E40\u0E0A\u0E48\u0E19 001"></div>
      <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 <span class="req">*</span></label>
        <input class="inp" id="me-desc" value="${esc(row.description || "")}" placeholder="\u0E40\u0E0A\u0E48\u0E19 Service Charge"></div>
      <div class="fld"><label>\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A <span class="req">*</span></label>
        <select class="sel" id="me-apply" ${backendHasApplyTo() ? "" : "disabled"}>
          <option value="SERVICE" ${ap === "SERVICE" ? "selected" : ""}>SERVICE</option>
          <option value="ADVANCE" ${ap === "ADVANCE" ? "selected" : ""}>ADVANCE</option>
          <option value="BOTH" ${ap === "BOTH" ? "selected" : ""}>BOTH</option>
        </select>
        ${backendHasApplyTo() ? "" : '<div class="t-xs money-neg mt-1">\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A \u201C\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u201D \u2014 \u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E40\u0E1B\u0E47\u0E19 BOTH</div>'}</div>
    </div>
    <div class="fgrid">
      <div class="fld"><label>VAT</label>
        <select class="sel" id="me-vat" ${backendHasTaxRates() ? "" : "disabled"}>
          ${vatOpts.map((v) => `<option value="${v}" ${v === curVat ? "selected" : ""}>${v}%</option>`).join("")}
        </select></div>
      <div class="fld"><label>WHT \u2014 \u0E20\u0E32\u0E29\u0E35\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22</label>
        <select class="sel" id="me-wht" ${backendHasTaxRates() ? "" : "disabled"}>
          ${whtOpts.map((v) => `<option value="${v}" ${v === curWht ? "selected" : ""}>${v}%</option>`).join("")}
        </select></div>
      <div class="fld"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label>${activeSel}</div>
    </div>
    ${backendHasTaxRates() ? "" : '<div class="t-xs money-neg mt-1">\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E23\u0E31\u0E19 migration 018 \u0E01\u0E48\u0E2D\u0E19</div>'}
    <div class="ms-dup" id="me-dup" hidden></div>`;
    }
    const f = document.createElement("div");
    f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
    <button class="btn btn-p" id="me-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>`;
    const titles = { customers: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", companies: "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice", service_codes: "\u0E23\u0E2B\u0E31\u0E2A\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23" };
    openModal({ title: (isNew ? "\u0E40\u0E1E\u0E34\u0E48\u0E21" : "\u0E41\u0E01\u0E49\u0E44\u0E02") + titles[tab2], body: b, footer: f, large: true });
    f.querySelector("#me-save").onclick = async (e) => {
      btnBusy(e.target, true);
      try {
        if (tab2 === "customers") {
          const name = b.querySelector("#me-name").value.trim();
          const code = b.querySelector("#me-code").value.trim();
          const tax = b.querySelector("#me-tax").value.trim();
          if (!code) {
            toast("\u0E01\u0E23\u0E2D\u0E01 CODE \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", "err");
            btnBusy(e.target, false);
            return;
          }
          if (!name) {
            toast("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", "err");
            btnBusy(e.target, false);
            return;
          }
          const dup = dupCustomer({ id: row.id || null, code, name, tax });
          if (dup.length) {
            const box = b.querySelector("#me-dup");
            box.hidden = false;
            box.innerHTML = "<b>\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</b><ul>" + dup.map((d) => `<li>${esc(d)}</li>`).join("") + "</ul>";
            toast("\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27", "err");
            btnBusy(e.target, false);
            return;
          }
          await once("ms-save", () => upsertCustomer({
            id: row.id || null,
            customer_name: name,
            customer_code: code || null,
            tax_id: tax || null,
            branch_code: b.querySelector("#me-branch").value.trim() || null,
            address: b.querySelector("#me-addr").value.trim() || null,
            phone: b.querySelector("#me-phone").value.trim() || null,
            /* ── 3 ฟิลด์ที่ถอดออกจาก UI แล้ว (credit_term_days / contact_name / email) ──
                         คอลัมน์ใน DB ยังอยู่ครบ ไม่ถูก DROP
            
                         njacc_upsert_customer() ฝั่ง Production เขียน UPDATE แบบนี้:
                             contact_name = p->>'contact_name'      ← ไม่มี coalesce
                             email        = p->>'email'             ← ไม่มี coalesce
                             credit_term_days = coalesce((p->>'credit_term_days')::int, credit_term_days)
                         แปลว่า ถ้าไม่ส่ง contact_name / email ขึ้นไป ค่าเดิมจะกลายเป็น NULL ทันที
                         → ตอนแก้ไข จึงต้องส่ง "ค่าเดิมของแถวนั้น" กลับไปเหมือนเดิม เพื่อไม่ให้ข้อมูลเก่าหาย
                         credit_term_days ไม่ต้องส่ง เพราะ RPC ใช้ coalesce อยู่แล้ว (แก้ไข = คงค่าเดิม
                         · เพิ่มใหม่ = ใช้ default 30 ของตาราง) */
            contact_name: row.contact_name ?? null,
            email: row.email ?? null,
            active: b.querySelector("#me-active").value === "true"
          }));
        } else if (tab2 === "companies") {
          const name = b.querySelector("#me-name").value.trim();
          if (!name) {
            toast("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17", "err");
            btnBusy(e.target, false);
            return;
          }
          await once("ms-save", () => upsertCompany({
            id: row.id || null,
            company_name: name,
            company_code: b.querySelector("#me-code").value.trim() || null,
            contact_name: b.querySelector("#me-contact").value.trim() || null,
            active: b.querySelector("#me-active").value === "true"
          }));
        } else {
          const code = b.querySelector("#me-code").value.trim();
          const desc = b.querySelector("#me-desc").value.trim();
          if (!code) {
            toast("\u0E01\u0E23\u0E2D\u0E01 CODE", "err");
            btnBusy(e.target, false);
            return;
          }
          if (!desc) {
            toast("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23", "err");
            btnBusy(e.target, false);
            return;
          }
          const dupS = dupServiceCode({ id: row.id || null, code });
          if (dupS.length) {
            const box = b.querySelector("#me-dup");
            box.hidden = false;
            box.innerHTML = "<b>\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0B\u0E49\u0E33 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</b><ul>" + dupS.map((d) => `<li>${esc(d)}</li>`).join("") + "</ul>";
            toast("CODE \u0E0B\u0E49\u0E33\u0E01\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27", "err");
            btnBusy(e.target, false);
            return;
          }
          const wantApply = b.querySelector("#me-apply").value;
          const wantVat = Number(b.querySelector("#me-vat").value);
          const wantWht = Number(b.querySelector("#me-wht").value);
          const payloadS = {
            id: row.id || null,
            code,
            description: desc,
            apply_to: wantApply,
            active: b.querySelector("#me-active").value === "true"
          };
          if (backendHasTaxRates()) {
            payloadS.vat_rate = wantVat;
            payloadS.wht_rate = wantWht;
          }
          const savedId = await once("ms-save", () => upsertServiceCode(payloadS));
          await masters(true);
          const back = (AppState.masters?.service_codes || []).find((x) => x.id === (row.id || savedId));
          if (back && applyTo(back) !== wantApply) {
            toast('\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \u0E41\u0E15\u0E48\u0E04\u0E48\u0E32 "\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A" \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A (\u0E44\u0E14\u0E49 ' + applyTo(back) + " \u0E41\u0E17\u0E19 " + wantApply + ") \u2014 \u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A apply_to", "err");
          }
          if (back && backendHasTaxRates() && (vatRateOf(back) !== wantVat || whtRateOf(back) !== wantWht)) {
            toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \u0E41\u0E15\u0E48\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E20\u0E32\u0E29\u0E35\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E01\u0E47\u0E1A (\u0E44\u0E14\u0E49 VAT " + vatRateOf(back) + "% / WHT " + whtRateOf(back) + "%) \u2014 \u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A vat_rate/wht_rate", "err");
          }
        }
        closeModal();
        toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27", "ok");
        await masters(true);
        render11(cnt, {
          ...cnt.dataset.msOnly ? { only: cnt.dataset.msOnly } : {},
          ...cnt.dataset.msTabs ? { tabs: cnt.dataset.msTabs } : {}
        });
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
  }
  function dupCustomer({ id, code, name, tax }, list) {
    const all = list || AppState.masters?.customers || [];
    const out = [];
    for (const c of all) {
      if (id && c.id === id) continue;
      if (code && nk(c.code) === nk(code))
        out.push(`CODE "${code}" \u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22: ${c.name}`);
      if (name && nk(c.name) === nk(name))
        out.push(`\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 "${name}" \u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 (CODE: ${c.code || "\u2014"})`);
      if (tax && nkTax(c.tax_id) && nkTax(c.tax_id) === nkTax(tax))
        out.push(`\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 "${tax}" \u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22: ${c.name} (CODE: ${c.code || "\u2014"})`);
    }
    return [...new Set(out)];
  }
  function dupServiceCode({ id, code }, list) {
    const all = list || AppState.masters?.service_codes || [];
    const out = [];
    for (const c of all) {
      if (id && c.id === id) continue;
      if (code && nk(c.code) === nk(code)) out.push(`CODE "${code}" \u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22: ${c.description}`);
    }
    return [...new Set(out)];
  }
  var tab2, q, nk, nkTax, TITLES, SETTINGS_TABS;
  var init_master_admin = __esm({
    "assets/js/master/master-admin.js"() {
      init_master_api();
      init_master_cache();
      init_state();
      init_formatter();
      init_modal();
      init_toast();
      init_loading();
      init_error_handler();
      init_request_manager();
      tab2 = "customers";
      q = "";
      nk = (v) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().toLowerCase();
      nkTax = (v) => String(v == null ? "" : v).replace(/[^0-9a-zA-Z]/g, "");
      TITLES = { customers: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", companies: "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 Invoice", service_codes: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23" };
      SETTINGS_TABS = [
        { key: "customers", label: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", route: "settings/customers" },
        { key: "service_codes", label: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23", route: "settings/services" }
      ];
    }
  });

  // assets/js/system/users.js
  var users_exports = {};
  __export(users_exports, {
    render: () => render12
  });
  async function render12(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C</h2></div>
      <button class="btn btn-p" id="us-new">+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19</th><th>\u0E0A\u0E37\u0E48\u0E2D</th><th>\u0E41\u0E1C\u0E19\u0E01</th><th>\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 (login)</th>
      <th>Role</th><th>\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C</th><th>\u0E2A\u0E16\u0E32\u0E19\u0E30</th><th class="center">\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23</th>
    </tr></thead><tbody id="us-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    <p class="t-xs t-3 mt-1">* \u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07/\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E17\u0E33\u0E43\u0E19 Supabase Dashboard \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 (\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E01\u0E47\u0E1A\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E2D\u0E07)</p>`;
    let users = [];
    async function load() {
      try {
        users = await rpc("njacc_admin_list_users");
        cnt.querySelector("#us-tbody").innerHTML = users.length ? users.map((u) => `<tr>
        <td>${esc(u.employee_code || "-")}</td>
        <td class="t-b">${esc(u.full_name)}</td>
        <td>${esc(u.department || "-")}</td>
        <td>${esc(u.login_name)}</td>
        <td><span class="us-role ${esc(u.role)}">${esc(u.role)}</span></td>
        <td class="t-xs">${u.role === "SUPER_ADMIN" ? "\u0E17\u0E38\u0E01\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C" : (u.access || []).map((a) => esc(a.charge_type) + "/" + esc(a.company_group)).join(", ") || "-"}</td>
        <td>${u.active ? '<span class="bdg bdg-paid">ACTIVE</span>' : '<span class="bdg bdg-void">DISABLED</span>'}</td>
        <td><div class="ch-act"><button class="btn btn-o btn-sm" data-edit="${u.id}">\u0E41\u0E01\u0E49\u0E44\u0E02</button></div></td>
      </tr>`).join("") : '<tr><td colspan="8" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49</td></tr>';
      } catch (e) {
        handleErr(e);
      }
    }
    cnt.querySelector("#us-new").onclick = () => openEdit2(null, load);
    cnt.querySelector("#us-tbody").addEventListener("click", (e) => {
      const b = e.target.closest("[data-edit]");
      if (!b) return;
      openEdit2(users.find((u) => u.id === b.dataset.edit), load);
    });
    load();
  }
  function openEdit2(u, onDone) {
    const isNew = !u;
    const requestId = newRequestId();
    u = u || { role: "USER", active: true, access: [] };
    const isSuper = (AppState.profile || {}).role === "SUPER_ADMIN";
    const accOf = (c, g) => (u.access || []).find((a) => (a.charge_type === c || a.charge_type === "*") && (a.company_group === g || a.company_group === "*")) || {};
    const gridRows = [];
    for (const c of CHARGE_TYPES) for (const g of COMPANY_GROUPS) {
      const a = accOf(c.key, g.key);
      gridRows.push(`<tr data-c="${c.key}" data-g="${g.key}">
      <td class="t-xs nowrap">${c.key} \xB7 ${g.key}</td>
      ${PERMS.map(([k]) => `<td class="center"><input type="checkbox" data-p="${k}" ${a[k] ? "checked" : ""}></td>`).join("")}
    </tr>`);
    }
    const b = document.createElement("div");
    b.innerHTML = `
    <div class="fgrid">
      <div class="fld"><label>\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19</label><input class="inp" id="ue-code" value="${esc(u.employee_code || "")}" ${isNew ? "" : "disabled"}></div>
      <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 <span class="req">*</span></label><input class="inp" id="ue-name" value="${esc(u.full_name || "")}"></div>
      <div class="fld"><label>\u0E41\u0E1C\u0E19\u0E01</label><input class="inp" id="ue-dept" value="${esc(u.department || "")}"></div>
      <div class="fld"><label>\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 login <span class="req">*</span></label>
        <input class="inp" id="ue-login" value="${esc(u.login_name || "")}" ${isNew ? "" : "disabled"}></div>
      <div class="fld"><label>Role</label>
        <select class="sel" id="ue-role" ${isSuper ? "" : "disabled"}>
          <option value="USER" ${u.role === "USER" ? "selected" : ""}>USER</option>
          <option value="ADMIN" ${u.role === "ADMIN" ? "selected" : ""}>ADMIN</option>
          <option value="SUPER_ADMIN" ${u.role === "SUPER_ADMIN" ? "selected" : ""}>SUPER_ADMIN</option>
        </select></div>
      <div class="fld"><label>\u0E2A\u0E16\u0E32\u0E19\u0E30</label>
        <select class="sel" id="ue-active">
          <option value="true" ${u.active ? "selected" : ""}>ACTIVE</option>
          <option value="false" ${!u.active ? "selected" : ""}>DISABLED</option></select></div>
    </div>
    <div class="fsec"><div class="fsec-t">\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E23\u0E32\u0E22 charge \xD7 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A SUPER_ADMIN)</div>
    <div class="tbl-wrap" style="max-height:320px"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E21\u0E19\u0E39</th>${PERMS.map(([, lb]) => `<th class="center t-xs">${lb}</th>`).join("")}
    </tr></thead><tbody>${gridRows.join("")}</tbody></table></div></div>
    ${isNew ? `<p class="t-xs t-3 mt-1">\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1D\u0E31\u0E48\u0E07\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19
      \u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E1C\u0E48\u0E32\u0E19 Supabase Dashboard \u0E2B\u0E23\u0E37\u0E2D Password Activation Flow \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A</p>` : ""}`;
    const f = document.createElement("div");
    f.innerHTML = `<button class="btn btn-o" data-close>\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01</button>
    <button class="btn btn-p" id="ue-save">\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01</button>`;
    openModal({ title: isNew ? "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49" : "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 " + esc(u.full_name), body: b, footer: f, large: true });
    f.querySelector("#ue-save").onclick = async (e) => {
      const name = b.querySelector("#ue-name").value.trim();
      const login = b.querySelector("#ue-login").value.trim();
      if (!name || !login) {
        toast("\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49", "err");
        return;
      }
      const access = [...b.querySelectorAll("tbody tr")].map((tr) => {
        const row = { charge_type: tr.dataset.c, company_group: tr.dataset.g };
        let any = false;
        PERMS.forEach(([k]) => {
          row[k] = tr.querySelector(`[data-p="${k}"]`).checked;
          if (row[k]) any = true;
        });
        return any ? row : null;
      }).filter(Boolean);
      const safe = {
        employee_code: b.querySelector("#ue-code").value.trim() || null,
        full_name: name,
        department: b.querySelector("#ue-dept").value.trim() || null,
        login_name: login,
        role: b.querySelector("#ue-role").value,
        active: b.querySelector("#ue-active").value === "true",
        access
      };
      btnBusy(e.target, true);
      try {
        if (isNew) {
          const res = await once("create-user", () => createUserViaServer(safe, requestId));
          closeModal();
          if (res.status === "ALREADY_CREATED") {
            toast("\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27\u0E08\u0E32\u0E01\u0E04\u0E33\u0E02\u0E2D\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \u2014 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0B\u0E49\u0E33", "ok");
          } else {
            showCreated(res);
          }
        } else {
          await once("save-user", () => rpc("njacc_admin_upsert_user", { p: { id: u.id, ...safe } }));
          closeModal();
          toast("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27", "ok");
        }
        onDone();
      } catch (ex) {
        handleErr(ex);
        btnBusy(e.target, false);
      }
    };
  }
  async function createUserViaServer(safe, requestId) {
    const { data } = await sb().auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("\u0E40\u0E0B\u0E2A\u0E0A\u0E31\u0E19\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E43\u0E2B\u0E21\u0E48");
    let res;
    try {
      res = await fetch(SUPABASE_URL + "/functions/v1/njacc-admin-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: "Bearer " + token },
        body: JSON.stringify({ ...safe, request_id: requestId })
      });
    } catch (e) {
      throw new Error("\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E44\u0E14\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E0B\u0E49\u0E33");
    }
    let out = null;
    try {
      out = await res.json();
    } catch (e) {
      out = null;
    }
    if (!res.ok || !out || !(out.status === "CREATED" || out.status === "ALREADY_CREATED")) {
      if (res.status === 404) throw new Error("\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 Edge Function njacc-admin-user (\u0E14\u0E39 README)");
      const code = out && out.error ? out.error : "";
      throw new Error(CREATE_ERR[code] || "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48");
    }
    return out;
  }
  function showCreated(res) {
    const pf = res.profile || {};
    const b = document.createElement("div");
    b.innerHTML = `<p>\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 <b>${esc(pf.login_name || "")}</b> (${esc(pf.full_name || "")}) \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22</p>
    <p class="t-sm t-2 mt-2">\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B: \u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49
      \u0E1C\u0E48\u0E32\u0E19 Supabase Dashboard \u2192 Authentication \u2192 Users (\u0E2B\u0E23\u0E37\u0E2D reset-password flow)</p>
    <p class="t-xs t-3 mt-1">\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E19\u0E35\u0E49\u0E42\u0E14\u0E22\u0E40\u0E08\u0E15\u0E19\u0E32
      \u2014 \u0E14\u0E39\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01 SQL Editor (009 VERIFICATION \u0E02\u0E49\u0E2D 6)</p>`;
    const f = document.createElement("div");
    f.innerHTML = `<button class="btn btn-p" data-close>\u0E1B\u0E34\u0E14</button>`;
    openModal({ title: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08", body: b, footer: f });
  }
  var PERMS, CREATE_ERR;
  var init_users = __esm({
    "assets/js/system/users.js"() {
      init_supabase_client();
      init_config();
      init_state();
      init_formatter();
      init_modal();
      init_toast();
      init_loading();
      init_error_handler();
      init_request_manager();
      init_charge_groups();
      PERMS = [
        ["can_view", "\u0E14\u0E39\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"],
        ["can_create", "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"],
        ["can_edit", "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19"],
        ["can_invoice", "\u0E2D\u0E2D\u0E01 INVOICE"],
        ["can_receive_payment", "\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30"],
        ["can_issue_receipt", "\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"],
        ["can_export", "Export"],
        ["can_void", "Void/\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"],
        ["can_delete", "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"]
      ];
      CREATE_ERR = {
        FORBIDDEN: "\u0E40\u0E09\u0E1E\u0E32\u0E30 SUPER_ADMIN \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49",
        LOGIN_EXISTS: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E0A\u0E49\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E37\u0E48\u0E19",
        EMPLOYEE_CODE_EXISTS: "\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27",
        DUPLICATE_REQUEST: "\u0E04\u0E33\u0E02\u0E2D\u0E19\u0E35\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E16\u0E39\u0E01\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E39\u0E48 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E2A\u0E31\u0E01\u0E04\u0E23\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E15\u0E23\u0E27\u0E08\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49",
        MISSING_FIELDS: "\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A",
        BAD_ROLE: "Role \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07",
        BAD_REQUEST_ID: "\u0E04\u0E33\u0E02\u0E2D\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48",
        CREATE_AUTH_USER_FAILED: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49",
        LINK_FAILED_CLEANUP_PENDING: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E41\u0E25\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E01\u0E27\u0E32\u0E14\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E47\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A (\u0E2A\u0E16\u0E32\u0E19\u0E30 FAILED_CLEANUP)",
        AUTH_SERVICE_UNAVAILABLE: "\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E15\u0E31\u0E27\u0E15\u0E19\u0E44\u0E21\u0E48\u0E15\u0E2D\u0E1A\u0E2A\u0E19\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
        AUTH_IDENTITY_FAILED: "\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49",
        AUTH_IDENTITY_CONFLICT: "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E32\u0E22\u0E2D\u0E37\u0E48\u0E19\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E48\u0E2D\u0E19",
        AUTH_IDENTITY_AMBIGUOUS: "\u0E1E\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E15\u0E31\u0E27\u0E15\u0E19 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E48\u0E2D\u0E19",
        NJACC_CREATE_USER_USE_EDGE: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",
        NJACC_USER_NOT_PROVISIONED: "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E15\u0E31\u0E49\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E40\u0E2A\u0E23\u0E47\u0E08",
        NJACC_LAST_SUPER_ADMIN: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D SUPER_ADMIN \u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E04\u0E19",
        LINK_FAILED: "\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49"
      };
    }
  });

  // assets/js/system/audit.js
  var audit_exports = {};
  __export(audit_exports, {
    render: () => render13
  });
  async function render13(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19</h2></div>
      <button class="btn btn-o" id="au-refresh">\u21BB \u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>\u0E40\u0E27\u0E25\u0E32</th><th>\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49</th><th>Action</th><th>Entity</th><th>\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</th>
    </tr></thead><tbody id="au-tbody"><tr><td colspan="5" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="au-pgn"></div>`;
    async function load() {
      const t = nextToken("audit");
      try {
        const res = await rpc("njacc_list_audit", { p_page: st5.page, p_size: st5.size });
        if (!isCurrent("audit", t)) return;
        const rows = res.rows || [];
        cnt.querySelector("#au-tbody").innerHTML = rows.length ? rows.map((r) => `<tr>
        <td class="nowrap t-xs">${esc(String(r.created_at || "").replace("T", " ").slice(0, 19))}</td>
        <td>${esc(r.full_name || "-")}</td>
        <td class="t-b">${esc(r.action)}</td>
        <td class="t-xs">${esc(r.entity_type || "")} ${esc(String(r.entity_id || "").slice(0, 8))}</td>
        <td class="t-xs ellip" style="max-width:380px" title="${esc(JSON.stringify(r.detail || {}))}">${esc(JSON.stringify(r.detail || {}))}</td>
      </tr>`).join("") : '<tr><td colspan="5" class="empty">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34</td></tr>';
        renderPagination(
          cnt.querySelector("#au-pgn"),
          { page: st5.page, size: st5.size, total: res.total || 0 },
          ({ page, size }) => {
            st5.page = page;
            st5.size = size;
            load();
          }
        );
      } catch (e) {
        if (isCurrent("audit", t)) handleErr(e);
      }
    }
    cnt.querySelector("#au-refresh").onclick = load;
    load();
  }
  var st5;
  var init_audit = __esm({
    "assets/js/system/audit.js"() {
      init_supabase_client();
      init_formatter();
      init_pagination();
      init_error_handler();
      init_request_manager();
      st5 = { page: 1, size: 50 };
    }
  });

  // assets/js/system/backup.js
  var backup_exports = {};
  __export(backup_exports, {
    render: () => render14
  });
  async function render14(cnt) {
    cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>\u0E2A\u0E16\u0E32\u0E19\u0E30 Backup</h2></div></div>
    <div id="bk-body"><div class="load-row"><div class="spin"></div></div></div>
    <div class="card card-pad mt-2 t-sm t-2">
      Layer 1: Supabase Managed Backup (\u0E15\u0E32\u0E21\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E01\u0E15\u0E4C) \xB7
      Layer 2: \u0E23\u0E30\u0E1A\u0E1A backup \u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19 17:30 \u2192 Google Drive \u2014 \u0E40\u0E21\u0E37\u0E48\u0E2D pipeline \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E04\u0E48\u0E32
      backup_* \u0E43\u0E19 njacc_settings \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34
    </div>`;
    try {
      const s = await rpc("njacc_backup_status");
      const item2 = (lb, v, cls) => `<div class="card card-pad bk-item">
      <div class="t-xs t-2">${lb}</div><div class="st ${cls}">${esc(v)}</div></div>`;
      const at = s?.last_backup_at ? String(s.last_backup_at).replace("T", " ").slice(0, 19) : "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25";
      cnt.querySelector("#bk-body").innerHTML = `<div class="bk-grid">
      ${item2("Backup \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14", at, s?.last_backup_at ? "ok" : "warn")}
      ${item2(
        "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E2D\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
        s?.last_backup_status || "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
        s?.last_backup_status === "SUCCESS" ? "ok" : s?.last_backup_status ? "bad" : "warn"
      )}
      ${item2(
        "\u0E15\u0E23\u0E27\u0E08\u0E44\u0E1F\u0E25\u0E4C (Verify)",
        s?.last_verify_status || "NOT VERIFIED",
        s?.last_verify_status === "PASS" ? "ok" : "warn"
      )}
      ${item2(
        "Restore Test \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
        s?.last_restore_test || "NOT TESTED",
        s?.last_restore_test === "PASS" ? "ok" : "warn"
      )}
    </div>`;
    } catch (e) {
      cnt.querySelector("#bk-body").innerHTML = '<div class="card card-pad empty">\u0E42\u0E2B\u0E25\u0E14\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E25\u0E2D\u0E07\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07</div>';
      console.warn(e);
    }
  }
  var init_backup = __esm({
    "assets/js/system/backup.js"() {
      init_supabase_client();
      init_formatter();
    }
  });

  // assets/js/core/version-guard.js
  init_config();
  init_supabase_client();
  init_state();
  var _timer = null;
  var _locked = false;
  var _serverSkewMs = 0;
  function startVersionGuard() {
    checkNow("start");
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkNow("visible");
    });
    window.addEventListener("online", () => checkNow("online"));
    window.addEventListener("hashchange", () => checkNow("route"));
    clearInterval(_timer);
    _timer = setInterval(() => checkNow("poll"), 6e4);
  }
  async function checkNow(reason) {
    try {
      const st6 = await rpc("njacc_app_status");
      if (!st6) return true;
      _serverSkewMs = new Date(st6.server_time).getTime() - Date.now();
      const cmp = compareVersion(st6.deploy_version, APP_VERSION);
      if (st6.maintenance_active) {
        await lockToMaintenance(st6);
        return false;
      }
      if (cmp > 0) return forceReloadForVersion(st6.deploy_version);
      if (cmp < 0) {
        console.warn("deploy_version behind client:", st6.deploy_version, "<", APP_VERSION);
      }
      return true;
    } catch (e) {
      console.warn("version check failed (" + reason + ")", e && e.message);
      return true;
    }
  }
  function compareVersion(a, b) {
    const pa = String(a || "").trim().split(".").map((x) => Number.parseInt(x, 10));
    const pb = String(b || "").trim().split(".").map((x) => Number.parseInt(x, 10));
    if (!String(a || "").trim()) return 0;
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i++) {
      const av = Number.isFinite(pa[i]) ? pa[i] : 0;
      const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }
  function forceReloadForVersion(serverVersion) {
    const key = "njacc_version_reload";
    const marker = String(serverVersion || "");
    try {
      if (sessionStorage.getItem(key) === marker) {
        console.warn("new deploy_version detected but fresh files are not visible yet:", marker);
        return true;
      }
      sessionStorage.setItem(key, marker);
    } catch (e) {
    }
    const hash = location.hash || "";
    location.replace(location.pathname + "?u=" + Date.now() + hash);
    return false;
  }
  async function lockToMaintenance(st6) {
    if (_locked) {
      renderCountdown(st6);
      return;
    }
    _locked = true;
    try {
      await sb().auth.signOut();
    } catch (e) {
    }
    resetState();
    try {
      sessionStorage.clear();
    } catch (e) {
    }
    document.body.innerHTML = `
    <div class="login-wrap"><div class="login-card" id="nj-maint">
      <div class="login-logo">NJ</div>
      <h2 class="login-t">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E23\u0E30\u0E1A\u0E1A</h2>
      <p class="login-s" id="nj-maint-msg"></p>
      <div class="login-maint"><span id="nj-maint-cd">--:--</span></div>
      <p class="t-xs t-3 center">\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E43\u0E2B\u0E21\u0E48\u0E42\u0E14\u0E22\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34</p>
    </div></div>`;
    document.getElementById("nj-maint-msg").textContent = st6.maintenance_message || MAINT_MESSAGE;
    renderCountdown(st6);
    const iv = setInterval(async () => {
      renderCountdown(st6);
      const end = st6.maintenance_until ? new Date(st6.maintenance_until).getTime() : 0;
      const nowSrv = Date.now() + _serverSkewMs;
      if (!end || nowSrv >= end) {
        try {
          const st22 = await rpc("njacc_app_status");
          if (!st22.maintenance_active) {
            clearInterval(iv);
            location.replace(location.pathname + "?u=" + Date.now());
            return;
          }
          Object.assign(st6, st22);
        } catch (e) {
        }
      }
    }, 5e3);
  }
  function renderCountdown(st6) {
    const el = document.getElementById("nj-maint-cd");
    if (!el) return;
    const end = st6.maintenance_until ? new Date(st6.maintenance_until).getTime() : 0;
    if (!end) {
      el.textContent = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E23\u0E30\u0E1A\u0E1A";
      return;
    }
    const remMs = Math.max(0, end - (Date.now() + _serverSkewMs));
    const m = Math.floor(remMs / 6e4), s = Math.floor(remMs % 6e4 / 1e3);
    el.textContent = "\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 " + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + " \u0E19\u0E32\u0E17\u0E35";
  }

  // assets/js/core/router.js
  init_state();

  // assets/js/components/sidebar.js
  init_config();
  init_state();
  init_charge_groups();
  init_permissions();
  init_formatter();
  var SIDEBAR_GROUPS = ["NJ"];
  var SVG = (c, body, fill) => `<svg viewBox="0 0 24 24" fill="${fill ? c : "none"}" stroke="${fill ? "none" : c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  var ICON = {
    /* SERVICE CHARGE — กระเป๋าเอกสารสีแดง (ทึบ) */
    SERVICE: SVG("currentColor", '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" fill="none" stroke="#dc2626" stroke-width="2"/>', true),
    /* ADVANCE CHARGE — บัตร (ทึบ) */
    ADVANCE: SVG("currentColor", '<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="2" y="9" width="20" height="2.5" fill="var(--sb-bg-1)"/>', true),
    /* บริษัท (NJ) — ตาราง 4 ช่อง สีน้ำเงิน */
    GROUP: SVG("currentColor", '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>', true),
    /* หัวข้อ ACCOUNTING — เอกสารสีส้ม */
    SEC_ACCT: SVG("currentColor", '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6" fill="var(--sb-bg-1)"/>', true),
    /* หัวข้อ DOCUMENT — โฟลเดอร์สีเหลือง */
    SEC_DOC: SVG("currentColor", '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', true),
    /* หัวข้อ FINANCE — เหรียญเงิน */
    SEC_FIN: SVG("currentColor", '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h5M9.5 14.5h5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
    /* Credit Note — กระดาษ + ดินสอ */
    CREDIT: SVG("currentColor", '<path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/><path d="M8.5 12h7M8.5 16h4.5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
    /* หัวข้อ SYSTEM — เฟืองสีม่วง */
    SEC_SYS: SVG("currentColor", '<path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5m9.4 4.6-2-.3a7.6 7.6 0 0 0-.6-1.5l1.2-1.7-1.6-1.6-1.7 1.2a7.6 7.6 0 0 0-1.5-.6l-.3-2h-2.2l-.3 2c-.5.1-1 .3-1.5.6L9.2 8l-1.6 1.6 1.2 1.7c-.3.5-.5 1-.6 1.5l-2 .3v2.2l2 .3c.1.5.3 1 .6 1.5L7.6 18.8l1.6 1.6 1.7-1.2c.5.3 1 .5 1.5.6l.3 2h2.2l.3-2c.5-.1 1-.3 1.5-.6l1.7 1.2 1.6-1.6-1.2-1.7c.3-.5.5-1 .6-1.5l2-.3z"/>', true),
    /* Report — กราฟแท่ง */
    REPORT: SVG("currentColor", '<rect x="3" y="12" width="4.5" height="9" rx="1"/><rect x="9.75" y="7" width="4.5" height="14" rx="1"/><rect x="16.5" y="3" width="4.5" height="18" rx="1"/>', true),
    /* Receipt — คลิปบอร์ด/ใบเสร็จ */
    RECEIPT: SVG("currentColor", '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8.5" y="7" width="7" height="1.8" fill="var(--sb-bg-1)"/><rect x="8.5" y="11" width="7" height="1.8" fill="var(--sb-bg-1)"/><rect x="8.5" y="15" width="4.5" height="1.8" fill="var(--sb-bg-1)"/>', true),
    /* ใบหัก ณ ที่จ่าย — เอกสาร */
    WHT: SVG("currentColor", '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6" fill="var(--sb-bg-1)"/>', true),
    /* Backup — เมฆอัปโหลด */
    BACKUP: SVG("currentColor", '<path d="M6.5 19a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.6 1.2A4 4 0 0 1 17.5 19z"/><path d="M12 16.5V10m0 0-2.2 2.2M12 10l2.2 2.2" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
    /* ตั้งค่าลูกค้า — บัตรประจำตัว/ลูกค้า */
    CUSTOMER: SVG("currentColor", '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><circle cx="8.5" cy="11" r="2.4" fill="var(--sb-bg-1)"/><path d="M4.6 16.6a4 4 0 0 1 7.8 0z" fill="var(--sb-bg-1)"/><rect x="14" y="9.5" width="5.5" height="1.8" fill="var(--sb-bg-1)"/><rect x="14" y="13" width="5.5" height="1.8" fill="var(--sb-bg-1)"/>', true),
    /* ตั้งค่ารายการบริการ — แท็ก/ป้ายรายการ */
    SERVICEITEM: SVG("currentColor", '<path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5-9 9z"/><circle cx="8" cy="8" r="1.7" fill="var(--sb-bg-1)"/>', true),
    /* FINANCE > Advance — กระเป๋าเงิน/สำรองจ่าย (คนละตัวกับ ICON.ADVANCE ของเมนู charge) */
    ADVPAY: SVG("currentColor", '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5z"/><circle cx="16.5" cy="12" r="1.6" fill="var(--sb-bg-1)"/>', true),
    /* Close Job — กล่องปิดผนึก + เครื่องหมายถูก */
    CLOSEJOB: SVG("currentColor", '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M8.5 12l2.5 2.5 4.5-4.5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
    /* ผู้ใช้งาน — คน 2 คน */
    USERS: SVG("currentColor", '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0z"/><circle cx="17.5" cy="9" r="2.8"/><path d="M14.5 20a5.2 5.2 0 0 1 7-4.9V20z"/>', true),
    /* ออกจากระบบ — ลูกศรออกจากกล่อง */
    LOGOUT: SVG("currentColor", '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15.5 8.5 19 12l-3.5 3.5M19 12h-9"/>', false)
  };
  function renderShell() {
    if (document.getElementById("app-shell")) return;
    const p = AppState.profile || {};
    const item2 = (nav2, icon, label) => `<button class="sb-item sb-sub" data-nav="${nav2}"><span class="sb-ic">${icon}</span><span>${esc(label)}</span></button>`;
    const chargeItems = (prefix, perm) => CHARGE_TYPES.filter((c) => SIDEBAR_GROUPS.some((g) => can(perm, c.key, g))).map((c) => item2(`${prefix}/${c.key.toLowerCase()}`, ICON[c.key] || "", c.key === "SERVICE" ? "Service" : "Advance")).join("");
    const docItems = chargeItems("document", "view");
    const acctItems = chargeItems("accounting", "invoice");
    const finItems = (can("invoice") ? item2("finance/credit-note", ICON.CREDIT, "Credit Note") : "") + item2("finance/receipt", ICON.RECEIPT, "Receipt") + item2("finance/advance", ICON.ADVPAY, "Advance") + item2("finance/close-job", ICON.CLOSEJOB, "Close Job");
    const repItems = item2("report", ICON.REPORT, "Report") + item2("report/withholding", ICON.WHT, "\u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22");
    const sys = [];
    if (isAdmin())
      sys.push(`<button class="sb-item sb-sub" data-nav="settings/customers"><span class="sb-ic">${ICON.CUSTOMER}</span><span>\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32</span></button>`);
    sys.push(`<button class="sb-item sb-sub" data-nav="backup"><span class="sb-ic">${ICON.BACKUP}</span><span>Backup</span></button>`);
    if (isAdmin() || can("manage_users"))
      sys.push(`<button class="sb-item sb-sub" data-nav="users"><span class="sb-ic">${ICON.USERS}</span><span>\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19</span></button>`);
    sys.push(`<button class="sb-item sb-sub" id="sb-logout"><span class="sb-ic">${ICON.LOGOUT}</span><span>\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A</span></button>`);
    document.body.innerHTML = `<div class="app" id="app-shell">
    <aside class="sb" id="sb">
      <div class="sb-brand"><div class="logo">NJ</div>
        <div><div class="nm">${APP_NAME}</div><div class="sub">Accounting System</div></div></div>
      <nav class="sb-nav">
        ${docItems ? `<div class="sb-sec">${ICON.SEC_DOC}<span>DOCUMENT</span></div>${docItems}` : ""}
        ${acctItems ? `<div class="sb-sec">${ICON.SEC_ACCT}<span>ACCOUNTING</span></div>${acctItems}` : ""}
        <div class="sb-sec">${ICON.SEC_FIN}<span>FINANCE</span></div>${finItems}
        <div class="sb-sec">${ICON.REPORT_SEC || ICON.REPORT}<span>REPORT</span></div>${repItems}
        <div class="sb-sec">${ICON.SEC_SYS}<span>SYSTEM</span></div>${sys.join("")}
      </nav>
      <div class="sb-user"><div class="nm">${esc(p.full_name || "")}</div>
        <div class="rl">${esc((p.role || "").replace("_", " "))}</div></div>
    </aside>
    <div class="app-main">
      <header class="tb">
        <button class="btn-icon tb-menu" id="tb-menu">\u2630</button>
        <span class="tb-title" id="tb-title"></span>
        <span class="tb-ver">v${APP_VERSION}</span><span class="sp"></span>
        <div class="tb-user"><div class="tb-ava">${esc((p.full_name || "?")[0])}</div>
          <div><div class="t-sm t-b">${esc(p.full_name || "")}</div>
            <div class="t-xs t-3">${esc((p.role || "").replace("_", " "))}</div></div></div>
      </header>
      <main class="app-content" id="app-content"></main>
    </div></div>`;
    document.getElementById("app-shell").addEventListener("click", (e) => {
      const nv = e.target.closest("[data-nav]");
      if (nv) {
        location.hash = "#/" + nv.dataset.nav;
        document.getElementById("sb").classList.remove("open");
        return;
      }
      const tg = e.target.closest("[data-toggle]");
      if (tg) tg.closest(".sb-group").classList.toggle("open");
    });
    document.getElementById("tb-menu").onclick = () => document.getElementById("sb").classList.toggle("open");
    document.getElementById("sb-logout").onclick = async () => {
      const { doLogout: doLogout2 } = await Promise.resolve().then(() => (init_logout(), logout_exports));
      doLogout2();
    };
  }
  function setActiveNav(path) {
    document.querySelectorAll(".sb-item.active").forEach((x) => x.classList.remove("active"));
    const el = document.querySelector(`[data-nav="${path}"]`) || document.querySelector(`[data-nav^="${path}?"]`) || (path.startsWith("settings/") ? document.querySelector('[data-nav^="settings/"]') : null);
    if (el) {
      el.classList.add("active");
      el.closest(".sb-group")?.classList.add("open");
    }
  }
  function setTitle(t) {
    const el = document.getElementById("tb-title");
    if (el) el.textContent = t || "";
    document.title = (t ? t + " \xB7 " : "") + "BILLING NJ";
  }
  function firstAllowedRoute() {
    for (const c of CHARGE_TYPES) for (const g of SIDEBAR_GROUPS)
      if (can("view", c.key, g)) return `document/${c.key.toLowerCase()}`;
    return "report";
  }

  // assets/js/core/router.js
  init_error_handler();
  init_modal();

  // assets/js/config/routes.js
  init_charge_groups();
  init_permissions();
  function buildRoutes() {
    const R = {};
    for (const c of CHARGE_TYPES) for (const g of COMPANY_GROUPS) {
      R[`charges/${c.key}/${g.key}`] = {
        title: chargeLabel(c.key) + " \u2014 " + groupLabel(g.key),
        module: "../charges/charge-page.js",
        args: { charge: c.key, group: g.key },
        perm: () => can("view", c.key, g.key)
      };
    }
    for (const c of CHARGE_TYPES) {
      const key = c.key.toLowerCase();
      R[`document/${key}`] = {
        title: "DOCUMENT \u2014 " + c.key,
        module: "../charges/charge-page.js",
        args: { charge: c.key, group: "NJ", mode: "document" },
        perm: () => can("view", c.key, "NJ")
      };
      R[`accounting/${key}`] = {
        title: "ACCOUNTING \u2014 " + c.key,
        module: "../charges/charge-page.js",
        args: { charge: c.key, group: "NJ", mode: "accounting" },
        perm: () => can("invoice", c.key, "NJ")
      };
    }
    R["finance/credit-note"] = {
      title: "FINANCE \u2014 CREDIT NOTE",
      module: "../finance/credit-note.js",
      perm: () => can("invoice")
    };
    R["finance/advance"] = {
      title: "FINANCE \u2014 ADVANCE",
      module: "../charges/charge-page.js",
      args: { charge: "ADVANCE", group: "NJ", mode: "advance" },
      perm: () => can("view")
    };
    R["finance/close-job"] = {
      title: "FINANCE \u2014 CLOSE JOB",
      module: "../charges/charge-page.js",
      args: { charge: "SERVICE", group: "NJ", mode: "closed", scope: "all" },
      perm: () => can("view")
    };
    R["finance/receipt"] = {
      title: "FINANCE \u2014 RECEIPT",
      module: "../receipts/receipt-page.js",
      perm: () => can("view")
    };
    R["report/withholding"] = { title: "REPORT \u2014 \u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22", module: "../withholding/withholding-page.js" };
    R["job/new"] = { title: "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48", module: "../jobs/job-form.js" };
    R["job/:id"] = { title: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19", module: "../jobs/job-detail.js" };
    R["job/:id/edit"] = { title: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E07\u0E32\u0E19", module: "../jobs/job-form.js" };
    R["invoice/issue/:jobId"] = {
      title: "\u0E2D\u0E2D\u0E01 Invoice \u0E1C\u0E48\u0E32\u0E19 ACCOUNTING",
      module: "../invoices/invoice-form.js",
      perm: () => can("invoice")
    };
    R["invoice/:id"] = { title: "INVOICE", module: "../invoices/invoice-view.js" };
    R["receipts"] = { title: "Receipt", module: "../receipts/receipt-page.js", perm: () => can("view") };
    R["receipts/new"] = {
      title: "\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19",
      module: "../payments/payment-form.js",
      perm: () => can("receive_payment")
    };
    R["report"] = { title: "Report", module: "../reports/report-page.js" };
    R["withholding"] = { title: "\u0E43\u0E1A\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22", module: "../withholding/withholding-page.js" };
    R["masters"] = { title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E25\u0E31\u0E01", module: "../master/master-admin.js", perm: isAdmin };
    R["settings/customers"] = {
      title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
      module: "../master/master-admin.js",
      args: { only: "customers", tabs: "settings" },
      perm: isAdmin
    };
    R["settings/services"] = {
      title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
      module: "../master/master-admin.js",
      args: { only: "service_codes", tabs: "settings" },
      perm: isAdmin
    };
    R["system/customers"] = {
      title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
      module: "../master/master-admin.js",
      args: { redirectTo: "settings/customers" },
      perm: isAdmin
    };
    R["system/service-codes"] = {
      title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32",
      module: "../master/master-admin.js",
      args: { redirectTo: "settings/services" },
      perm: isAdmin
    };
    R["users"] = {
      title: "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
      module: "../system/users.js",
      perm: () => isAdmin() || can("manage_users")
    };
    R["audit"] = { title: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19", module: "../system/audit.js", perm: isAdmin };
    R["backup"] = { title: "Backup", module: "../system/backup.js" };
    return R;
  }

  // assets/js/core/router.js
  var MODULE_LOADERS = {
    "../charges/charge-page.js": () => Promise.resolve().then(() => (init_charge_page(), charge_page_exports)),
    "../jobs/job-form.js": () => Promise.resolve().then(() => (init_job_form(), job_form_exports)),
    "../jobs/job-detail.js": () => Promise.resolve().then(() => (init_job_detail(), job_detail_exports)),
    "../invoices/invoice-form.js": () => Promise.resolve().then(() => (init_invoice_form(), invoice_form_exports)),
    "../invoices/invoice-view.js": () => Promise.resolve().then(() => (init_invoice_view(), invoice_view_exports)),
    "../receipts/receipt-page.js": () => Promise.resolve().then(() => (init_receipt_page(), receipt_page_exports)),
    "../finance/credit-note.js": () => Promise.resolve().then(() => (init_credit_note(), credit_note_exports)),
    "../payments/payment-form.js": () => Promise.resolve().then(() => (init_payment_form(), payment_form_exports)),
    "../reports/report-page.js": () => Promise.resolve().then(() => (init_report_page(), report_page_exports)),
    "../withholding/withholding-page.js": () => Promise.resolve().then(() => (init_withholding_page(), withholding_page_exports)),
    "../master/master-admin.js": () => Promise.resolve().then(() => (init_master_admin(), master_admin_exports)),
    "../system/users.js": () => Promise.resolve().then(() => (init_users(), users_exports)),
    "../system/audit.js": () => Promise.resolve().then(() => (init_audit(), audit_exports)),
    "../system/backup.js": () => Promise.resolve().then(() => (init_backup(), backup_exports))
  };
  var ROUTES = null;
  async function startRouter() {
    ROUTES = buildRoutes();
    window.addEventListener("hashchange", () => go());
    await go();
  }
  function nav(hash) {
    if (location.hash === hash) go();
    else location.hash = hash;
  }
  async function go() {
    closeModal();
    const ok = await checkNow("route");
    if (!ok) return;
    const hash = location.hash.replace(/^#\/?/, "") || firstAllowedRoute();
    const [path, qs] = hash.split("?");
    const params = Object.fromEntries(new URLSearchParams(qs || ""));
    const route = matchRoute(path);
    if (!route) {
      nav("#/" + firstAllowedRoute());
      return;
    }
    if (route.perm && !route.perm()) {
      document.getElementById("app-content").innerHTML = '<div class="card card-pad empty">\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49</div>';
      return;
    }
    AppState.route = { path, params, def: route };
    renderShell();
    setActiveNav(path);
    setTitle(route.title);
    const cnt = document.getElementById("app-content");
    cnt.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026</div></div>';
    try {
      const load = MODULE_LOADERS[route.module];
      if (!load) throw new Error("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E42\u0E21\u0E14\u0E39\u0E25\u0E2B\u0E19\u0E49\u0E32: " + route.module);
      const mod = await load();
      await mod.render(cnt, { ...route.args, ...params });
    } catch (e) {
      handleErr(e, "\u0E42\u0E2B\u0E25\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08");
      cnt.innerHTML = '<div class="card card-pad empty">\u0E42\u0E2B\u0E25\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</div>';
    }
  }
  function matchRoute(path) {
    if (ROUTES[path]) return ROUTES[path];
    for (const k in ROUTES) {
      if (!k.includes(":")) continue;
      const kp = k.split("/"), pp = path.split("/");
      if (kp.length !== pp.length) continue;
      const args = {};
      let ok = true;
      kp.forEach((seg, i) => {
        if (seg.startsWith(":")) args[seg.slice(1)] = pp[i];
        else if (seg !== pp[i]) ok = false;
      });
      if (ok) return { ...ROUTES[k], args: { ...ROUTES[k].args, ...args } };
    }
    return null;
  }

  // app-boot.js
  init_session();

  // assets/js/auth/login-page.js
  init_config();
  init_login_api();
  init_state();
  init_supabase_client();
  init_formatter();
  async function renderLogin(onSuccess) {
    let maint = null;
    try {
      const st6 = await rpc("njacc_app_status");
      if (st6 && st6.maintenance_active) maint = st6.maintenance_message || MAINT_MESSAGE;
    } catch (e) {
    }
    document.body.innerHTML = `<div class="login-wrap"><div class="login-card">
    <div class="login-logo">NJ</div>
    <h2 class="login-t">${esc(APP_NAME)}</h2>
    <p class="login-s">\u0E23\u0E30\u0E1A\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35 Billing \xB7 N.J. Logistics</p>
    <div id="lg-err" class="login-err hide"></div>
    ${maint ? `<div class="login-maint">${esc(maint)}</div>` : ""}
    <form id="lg-form" autocomplete="off">
      <div class="fld"><label>User</label>
        <input class="inp w100" id="lg-u" autocomplete="username" ${maint ? "disabled" : ""}></div>
      <div class="fld"><label>Password</label>
        <div class="lg-pw">
          <input class="inp w100" id="lg-p" type="password" autocomplete="current-password" ${maint ? "disabled" : ""}>
          <button type="button" class="lg-eye" id="lg-eye" ${maint ? "disabled" : ""}
            aria-label="\u0E41\u0E2A\u0E14\u0E07/\u0E0B\u0E48\u0E2D\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19">\u{1F441}</button>
        </div></div>
      <button class="btn btn-p w100 mt-2" id="lg-btn" type="submit" ${maint ? "disabled" : ""}
        style="justify-content:center">\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A</button>
    </form></div></div>`;
    const u = document.getElementById("lg-u");
    const pw = document.getElementById("lg-p");
    const err = document.getElementById("lg-err");
    const btn2 = document.getElementById("lg-btn");
    if (!maint) u.focus();
    document.getElementById("lg-eye").onclick = () => {
      pw.type = pw.type === "password" ? "text" : "password";
      document.getElementById("lg-eye").textContent = pw.type === "password" ? "\u{1F441}" : "\u{1F648}";
      pw.focus();
    };
    let busy2 = false;
    document.getElementById("lg-form").onsubmit = async (e) => {
      e.preventDefault();
      if (busy2 || maint) return;
      err.classList.add("hide");
      if (!u.value.trim() || !pw.value) {
        err.textContent = "\u0E01\u0E23\u0E2D\u0E01 User \u0E41\u0E25\u0E30 Password";
        err.classList.remove("hide");
        return;
      }
      busy2 = true;
      btn2.disabled = true;
      btn2.textContent = "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u2026";
      try {
        await loginWithName(u.value.trim(), pw.value);
        AppState.profile = await loadMyProfile();
        pw.value = "";
        onSuccess();
      } catch (ex) {
        err.textContent = ex.message || "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08";
        err.classList.remove("hide");
        busy2 = false;
        btn2.disabled = false;
        btn2.textContent = "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A";
        pw.focus();
        pw.select();
      }
    };
  }

  // app-boot.js
  (async () => {
    try {
      if (!window.supabase) {
        document.body.innerHTML = '<div class="login-wrap"><div class="login-card"><div class="login-logo">NJ</div><h2 class="login-t">\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</h2><p class="login-s">\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E42\u0E2B\u0E25\u0E14 Supabase SDK \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07</p></div></div>';
        return;
      }
      const ok = await checkNow("boot");
      if (!ok) return;
      startVersionGuard();
      const enterApp = async () => {
        await startRouter();
      };
      if (await restoreSession()) await enterApp();
      else await renderLogin(enterApp);
    } catch (e) {
      console.error("[BILLING NJ boot]", e);
      document.body.innerHTML = '<div class="login-wrap"><div class="login-card"><div class="login-logo">NJ</div><h2 class="login-t">\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08</h2><p class="login-s">\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E35\u0E40\u0E1F\u0E23\u0E0A\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07</p></div></div>';
    }
  })();
})();
