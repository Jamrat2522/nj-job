/* ============================================================
   heavy-gps.js — 📍 แผนที่ GPS พนักงาน (SUPER_ADMIN + Desktop เท่านั้น)
   Lazy chunk (classic script · shared scope กับ app.js)
   Source: RPC nj_gps_latest (ตำแหน่งล่าสุด 1 แถว/คน ภายใน 30 วัน) + nj_gps_route (เส้นทางรอบงาน · RUN-16)
   ความสดคำนวณจาก "เวลาที่เครื่องจับพิกัด" (captured_at) เทียบเวลา Server: ≤1 นาที อัปเดตล่าสุด · 1–3 นาที อัปเดตช้า · >3 นาที ขาดการอัปเดต (หมุดสีเทา + วันเวลา)
   สถานะงาน (เริ่มงาน / เลิกงาน / ขาดการอัปเดตระหว่างทำงาน) แยกจากความสดของพิกัด · ไม่สรุปว่า "ปิด GPS" จากการขาดข้อมูล
   ============================================================ */
(function () {
  "use strict";
  var LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  var LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  var REFRESH_MS = 15000;
  var FRESH_MS = 60000, SLOW_MS = 3 * 60000, COARSE_M = 50;
  var TIER_TH = { fresh: "อัปเดตล่าสุด", slow: "อัปเดตช้า", lost: "ขาดการอัปเดต", none: "ไม่มีตำแหน่ง" };
  var TIER_ICO = { fresh: "🟢", slow: "🟠", lost: "⚪", none: "⚪" };
  var GREY = "#94A3B8";
  var GRP_TH = { MESSENGER: "Messenger", SHIPPING: "Shipping" };
  var GRP_COLOR = { MESSENGER: "#10B981", SHIPPING: "#3B82F6" };
  var G = { rows: [], dept: "ALL", emp: "", st: "", map: null, layer: null, markers: {}, circles: {}, mkSig: {}, loadedAt: null, loadedClient: 0, timer: null, busy: false, err: "",
            follow: false, route: null, routeLayer: null, routeBusy: false };
  window.__njGps = G;

  function _e(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function _ok() { return typeof _njGpsAllowed === "function" && _njGpsAllowed(); }
  function _block() { try { S.view = _defaultLandingView(); renderView(); renderSidebar(); } catch (_) {} }
  function _t(iso) {
    if (iso == null || iso === "") return "-";
    try { return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch (_) { return String(iso); }
  }
  function _cap(r) { return r ? (r.captured_at || r.recorded_at || null) : null; }

  /* เวลา Server ณ ตอนนี้ = server_now + เวลาที่ผ่านไปบน Client (ไม่ใช้นาฬิกาเครื่องผู้ดูโดยตรง) */
  function _snow() { return (G.loadedAt ? Date.parse(G.loadedAt) : Date.now()) + (G.loadedClient ? Date.now() - G.loadedClient : 0); }
  /* อายุข้อมูล (ms) = เวลา Server − เวลาที่เครื่องจับพิกัด (จุดย้อนหลังจึงไม่ดูสด) */
  function _age(r) {
    var c = _cap(r); if (!c) return null;
    var a = _snow() - Date.parse(c); return isNaN(a) ? null : Math.max(0, a);
  }
  function _has(r) { return !!r && r.lat != null && r.lng != null; }
  function _tier(r) { if (!_has(r)) return "none"; var a = _age(r); if (a == null) return "lost"; return a <= FRESH_MS ? "fresh" : a <= SLOW_MS ? "slow" : "lost"; }
  /* สถานะงาน (จากรอบงานของแอป) แยกจากความสด */
  function _work(r) {
    var w = r && r.work;
    if (!w) return { k: "none", tx: "ยังไม่เริ่มงานผ่านแอป" };
    if (w.live) {
      var lc = w.last_captured_at ? _snow() - Date.parse(w.last_captured_at) : _snow() - Date.parse(w.started_at);
      if (!(lc <= SLOW_MS)) return { k: "gap", tx: "ขาดการอัปเดตระหว่างทำงาน (เริ่ม " + _t(w.started_at) + ")" };
      return { k: "on", tx: "เริ่มงาน " + _t(w.started_at) };
    }
    var why = { stop: "", logout: " · ออกจากระบบ", permission: " · ไม่มีสิทธิ์ตำแหน่ง", start_failed: " · เปิด GPS ในเครื่องไม่สำเร็จ", replaced: " · เปลี่ยนเครื่อง", restart: " · เริ่มรอบใหม่", expired: " · ปิดอัตโนมัติ (ไม่มีข้อมูลนาน)" }[w.end_reason || ""];
    /* เวลากดเลิกงานจริงบนเครื่อง (client_stopped_at) แยกจากเวลาที่ Server รับ (ended_at) */
    if (w.ended_at && w.client_stopped_at && Math.abs(Date.parse(w.ended_at) - Date.parse(w.client_stopped_at)) > 60000)
      return { k: "off", tx: "เลิกงาน " + _t(w.client_stopped_at) + " (Server รับ " + _t(w.ended_at) + ")" + (why || "") };
    if (w.ended_at) return { k: "off", tx: "เลิกงาน " + _t(w.client_stopped_at || w.ended_at) + (why || "") };
    return { k: "off", tx: "เลิกงาน (เซสชันแอปสิ้นสุด)" };
  }
  function _acc(r) { return r && r.accuracy != null ? "±" + Math.round(r.accuracy) + " ม." + (r.accuracy > COARSE_M ? " (คลาดเคลื่อน)" : "") : "-"; }
  function _src(r) { return r && r.source === "app" ? "แอปมือถือ" : r && r.source ? "เว็บ" : "-"; }
  function _ago(ms) {
    if (ms == null) return "";
    var s = Math.floor(ms / 1000); if (s < 60) return s + " วินาทีที่แล้ว";
    var m = Math.floor(s / 60); if (m < 60) return m + " นาทีที่แล้ว";
    var h = Math.floor(m / 60); if (h < 24) return h + " ชั่วโมงที่แล้ว";
    return Math.floor(h / 24) + " วันที่แล้ว";
  }

  var _lp = null;
  function _leaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    if (_lp) return _lp;
    _lp = new Promise(function (res, rej) {
      if (!document.querySelector('link[data-njgps]')) {
        var l = document.createElement("link"); l.rel = "stylesheet"; l.href = LEAFLET_CSS; l.setAttribute("data-njgps", "1"); document.head.appendChild(l);
      }
      var sc = document.createElement("script"); sc.src = LEAFLET_JS; sc.async = true;
      sc.onload = function () { res(); };
      sc.onerror = function () { _lp = null; rej(new Error("โหลดแผนที่ไม่สำเร็จ")); };
      document.head.appendChild(sc);
    });
    return _lp;
  }

  function _filtered(noSt) {
    return G.rows.filter(function (r) {
      if (G.dept !== "ALL" && r.grp !== G.dept) return false;
      if (G.emp && r.id !== G.emp) return false;
      if (!noSt && G.st && G.st !== "work" && _tier(r) !== G.st) return false;
      if (!noSt && G.st === "work" && !(r.work && r.work.live)) return false;
      return true;
    });
  }

  function _style() {
    if (document.getElementById("njgps-style")) return;
    var st = document.createElement("style"); st.id = "njgps-style";
    st.textContent =
      ".njgps-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}" +
      ".njgps-bar label{font-size:13px;color:var(--muted)}" +
      ".njgps-bar select{min-width:200px;height:40px;padding:0 34px 0 12px;font-size:14px;font-family:inherit;color:#111827;background-color:#FFFFFF;border:1px solid #CBD5E1;border-radius:10px;color-scheme:light;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;" +
        "background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;background-size:12px 8px}" +
      ".njgps-bar select:hover{border-color:#94A3B8;background-color:#F8FAFC}" +
      ".njgps-bar select:focus{outline:none;border-color:#0EA672;box-shadow:0 0 0 3px rgba(14,166,114,.25)}" +
      ".njgps-bar select:disabled{color:#6B7280;background-color:#F3F4F6;cursor:not-allowed}" +
      ".njgps-bar select option{color:#111827;background-color:#FFFFFF}" +
      ".njgps-bar select option:checked{color:#111827;background-color:#D1FAE5}" +
      ".njgps-bar select option:disabled{color:#6B7280}" +
      ".njgps-stat{display:flex;gap:14px;align-items:center;font-size:14px;color:var(--text)}" +
      ".njgps-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}" +
      ".njgps-wrap{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px}" +
      "#njgps-map{height:calc(100vh - 230px);min-height:420px;border-radius:14px;border:1px solid var(--border-soft);background:#0f172a}" +
      ".njgps-list{max-height:calc(100vh - 230px);min-height:420px;overflow:auto;padding:8px}" +
      ".njgps-item{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:10px;cursor:pointer;border:1px solid transparent}" +
      ".njgps-item:hover{background:var(--panel2)}.njgps-item.sel{border-color:var(--brand);background:var(--brand-soft)}" +
      ".njgps-item .nm{font-weight:600;color:var(--text);font-size:14px}.njgps-item .sb{font-size:12px;color:var(--muted)}" +
      ".njgps-item .no{font-size:12px;color:#FCA5A5;font-weight:600}" +
      ".njgps-pin{position:relative}.njgps-pin .lb{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:#111827;border-radius:8px;padding:3px 8px;font:600 12px/1.3 inherit;box-shadow:0 2px 8px rgba(0,0,0,.35);border-left:4px solid var(--c)}" +
      ".njgps-pin .pt{width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--c);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);margin:0 auto}" +
      ".njgps-err{padding:14px;color:#FCA5A5}" +
      ".njgps-stat>span[data-st]{cursor:pointer;padding:3px 8px;border-radius:8px;border:1px solid transparent;user-select:none}" +
      ".njgps-stat>span[data-st]:hover{background:var(--panel2)}" +
      ".njgps-stat>span[data-st].on{background:var(--brand-soft);border-color:var(--brand);font-weight:700}" +
      ".njgps-item .warn{font-size:12px;color:#FBBF24;font-weight:600}.njgps-item .ok{font-size:12px;color:#34D399;font-weight:600}" +
      ".njgps-pin.stale{opacity:.6}" +
      ".njgps-pin.slow .pt{box-shadow:0 0 0 3px #F59E0B}.njgps-pin.lost .lb{color:#475569;border-left-color:#94A3B8}" +
      ".njgps-pin .lb small{display:block;font-weight:500;color:#64748B}" +
      ".njgps-ctl{display:flex;gap:8px;align-items:center}.njgps-ctl label{display:flex;gap:6px;align-items:center;cursor:pointer;color:var(--text)}" +
      ".njgps-ctl .btn{height:40px}" +
      ".njgps-item .wk{font-size:12px;font-weight:600}.njgps-item .wk.on{color:#34D399}.njgps-item .wk.gap{color:#FBBF24}.njgps-item .wk.off,.njgps-item .wk.none{color:var(--muted)}" +
      ".njgps-item .lost{font-size:12px;color:#CBD5E1;font-weight:600}" +
      ".njgps-route{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:-4px 0 10px;font-size:13px;color:var(--text)}" +
      ".njgps-route select{min-width:260px;height:36px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#111827;padding:0 10px;font-family:inherit}";
    document.head.appendChild(st);
  }

  window.renderGpsView = function () {
    if (!_ok()) return _block();
    _style();
    var host = document.getElementById("view-root"); if (!host) return;
    if (G.map) { try { G.map.remove(); } catch (_) {} }
    G.map = null; G.layer = null; G.markers = {}; G.circles = {}; G.mkSig = {}; G.needFit = true; G.routeLayer = null; G.route = null;
    var seq = G.seq = (G.seq || 0) + 1; /* render ซ้อนกัน → ให้ callback ของรอบล่าสุดสร้าง Map เท่านั้น (กัน Map container already initialized) */
    host.innerHTML =
      '<div class="topbar"><div><h1>📍 แผนที่ GPS (พนักงาน)</h1><p class="sub">MESSENGER + SHIPPING · เวลาจับพิกัด ≤1 นาที อัปเดตล่าสุด · 1–3 นาที อัปเดตช้า · เกิน 3 นาที ขาดการอัปเดต (หมุดสีเทา) · เก็บย้อนหลัง 30 วัน</p></div>' +
      '<button class="btn btn-secondary" id="njgps-refresh" onclick="_njGpsReload(true)">🔄 <span id="njgps-upd">กำลังโหลด...</span></button></div>' +
      '<div class="content">' +
      '<div class="njgps-bar">' +
      '<label>แผนก</label><select id="njgps-dept" onchange="_njGpsSetDept(this.value)">' +
      '<option value="ALL">ทั้งหมด</option><option value="MESSENGER">MESSENGER</option><option value="SHIPPING">SHIPPING</option></select>' +
      '<label>พนักงาน</label><select id="njgps-emp" onchange="_njGpsSetEmp(this.value)"><option value="">ทุกคน</option></select>' +
      '<div class="njgps-ctl"><label title="เลื่อนแผนที่ตามพนักงานที่เลือกเมื่อมีพิกัดใหม่"><input type="checkbox" id="njgps-follow" onchange="_njGpsFollow(this.checked)"> 🎯 เลื่อนตาม</label>' +
      '<button class="btn btn-secondary" id="njgps-route-btn" onclick="_njGpsRoute()">🛣 เส้นทาง</button></div>' +
      '<div class="njgps-stat" id="njgps-stat"></div></div>' +
      '<div class="njgps-route" id="njgps-route" style="display:none"></div>' +
      '<div class="njgps-wrap"><div id="njgps-map"></div><div class="panel njgps-list" id="njgps-list"></div></div>' +
      '</div>';
    document.getElementById("njgps-dept").value = G.dept;
    _leaflet().then(function () {
      if (seq !== G.seq || S.view !== "gps" || !document.getElementById("njgps-map")) return;
      G.map = L.map("njgps-map", { zoomControl: true }).setView([13.2, 100.9], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(G.map);
      G.layer = L.layerGroup().addTo(G.map);
      G.routeLayer = L.layerGroup().addTo(G.map);
      _paint(true);
    }).catch(function (e) {
      var m = document.getElementById("njgps-map"); if (m) m.innerHTML = '<div class="njgps-err">' + _e(e.message) + "</div>";
    });
    _njGpsReload(false);
    if (G.timer) clearInterval(G.timer);
    G.timer = setInterval(function () {
      if (S.view !== "gps" || !_ok()) { clearInterval(G.timer); G.timer = null; return; }
      if (!document.hidden) _njGpsReload(false);
    }, REFRESH_MS);
  };

  window._njGpsReload = function (manual) {
    if (!_ok()) return _block();
    if (G.busy) return; G.busy = true;
    var btn = document.getElementById("njgps-refresh"); if (btn) btn.disabled = true;
    withTimeout(sb.rpc("nj_gps_latest", { p_token: _msTok() }), 20000, "nj_gps_latest").then(function (r) {
      if (r.error) throw r.error;
      var d = r.data || {};
      G.rows = Array.isArray(d.rows) ? d.rows : [];
      G.loadedAt = d.server_now || new Date().toISOString(); G.loadedClient = Date.now();
      G.err = "";
      if (G.emp && !G.rows.some(function (x) { return x.id === G.emp; })) { G.emp = ""; G.follow = false; }
      if (S.view === "gps") _paint(false);
      if (G.route && G.route.live && G.route.uid === G.emp) _loadRoute(G.route.uid, G.route.sid, false);
    }).catch(function (e) {
      G.err = (typeof _njRpcMsg === "function" ? _njRpcMsg(e) : (e && e.message) || "โหลดไม่สำเร็จ");
      if (/ไม่มีสิทธิ์/.test(G.err)) return _block();
      if (manual) try { toast("โหลดตำแหน่งไม่สำเร็จ: " + G.err, "error"); } catch (_) {}
      if (S.view === "gps") _paint(false);
    }).finally(function () {
      G.busy = false; var b = document.getElementById("njgps-refresh"); if (b) b.disabled = false;
    });
  };

  window._njGpsSetDept = function (v) { G.dept = v || "ALL"; G.emp = ""; G.follow = false; _clearRoute(); _paint(true); };
  window._njGpsSetEmp = function (v) { G.emp = v || ""; if (!G.emp) G.follow = false; if (!G.route || G.route.uid !== G.emp) _clearRoute(); _paint(true); };
  /* Status filter: กดซ้ำ = ยกเลิก · กรองจาก Dataset เดิม (ไม่ยิง API) · คงไว้ข้ามรอบ Poll */
  window._njGpsSetSt = function (v) { G.st = (G.st === v ? "" : (v || "")); _paint(false); };
  window._njGpsFollow = function (on) {
    if (on && !G.emp) { try { toast("เลือกพนักงานก่อน แล้วจึงเปิดเลื่อนตาม", "info"); } catch (_) {} on = false; }
    G.follow = !!on; var cb = document.getElementById("njgps-follow"); if (cb) cb.checked = G.follow;
    if (G.follow) _followPan(true);
  };
  /* กลับมาที่ Tab ขณะอยู่หน้า GPS → ดึงล่าสุดทันที 1 ครั้ง (Listener ตัวเดียว ลงทะเบียนครั้งเดียวตอนโหลด chunk) */
  document.addEventListener("visibilitychange", function () {
    try { if (!document.hidden && S.view === "gps" && G.timer && _ok()) window._njGpsReload(false); } catch (_) {}
  });

  function _followPan(zoom) {
    if (!G.follow || !G.emp || !G.map) return;
    var m = G.markers[G.emp]; if (!m) return;
    if (zoom) G.map.setView(m.getLatLng(), Math.max(G.map.getZoom(), 16)); else G.map.panTo(m.getLatLng(), { animate: true });
  }

  /* ---------- เส้นทางรอบงาน (เริ่มงาน → เลิกงาน) ---------- */
  function _clearRoute() {
    G.route = null; if (G.routeLayer) G.routeLayer.clearLayers();
    var p = document.getElementById("njgps-route"); if (p) { p.style.display = "none"; p.innerHTML = ""; }
  }
  window._njGpsRouteClose = function () { _clearRoute(); };
  window._njGpsRoute = function () {
    if (!G.emp) { try { toast("เลือกพนักงานก่อน แล้วกดเส้นทาง", "info"); } catch (_) {} return; }
    _loadRoute(G.emp, null, true);
  };
  window._njGpsRouteSel = function (sid) { if (G.emp) _loadRoute(G.emp, sid || null, true); };
  function _loadRoute(uid, sid, fit) {
    if (!_ok() || G.routeBusy) return; G.routeBusy = true;
    withTimeout(sb.rpc("nj_gps_route", { p_token: _msTok(), p_user_id: uid, p_session_id: sid || null }), 20000, "nj_gps_route").then(function (r) {
      if (r.error) throw r.error;
      if (G.emp !== uid || S.view !== "gps") return;
      var d = r.data || {};
      var cur = (d.sessions || []).filter(function (s) { return s.id === d.session_id; })[0] || null;
      G.route = { uid: uid, sid: d.session_id || null, live: !!(cur && cur.live), data: d };
      _drawRoute(fit);
    }).catch(function (e) {
      var m = String(e && (e.message || e.details) || e || "");
      if (/PGRST202|Could not find the function|nj_gps_route/i.test(m) && !/NJ_/.test(m)) m = "ฐานข้อมูลยังไม่ได้ติดตั้ง RUN-16 (เส้นทาง)";
      else m = typeof _njRpcMsg === "function" ? _njRpcMsg(e) : m;
      try { toast("โหลดเส้นทางไม่สำเร็จ: " + m, "error"); } catch (_) {}
    }).finally(function () { G.routeBusy = false; });
  }
  function _drawRoute(fit) {
    var p = document.getElementById("njgps-route"), R = G.route; if (!p || !R) return;
    var d = R.data, ss = d.sessions || [], pts = d.points || [];
    var nm = (G.rows.filter(function (x) { return x.id === R.uid; })[0] || {}).name || "";
    p.style.display = "flex";
    p.innerHTML = "<b>🛣 เส้นทาง " + _e(nm) + "</b>" +
      (ss.length ? '<select onchange="_njGpsRouteSel(this.value)">' + ss.map(function (s) {
        return '<option value="' + _e(s.id) + '"' + (s.id === R.sid ? " selected" : "") + ">" + _e(_t(s.started_at)) + " → " + (s.live ? "ยังทำงานอยู่" : s.ended_at ? _e(_t(s.ended_at)) : "สิ้นสุด") + " · " + (s.points || 0) + " จุด</option>";
      }).join("") + "</select>" : "<span>ยังไม่มีรอบงานจากแอปใน 30 วัน</span>") +
      "<span>" + pts.length + " จุด" + (d.truncated ? " (แสดง 6,000 จุดแรก)" : "") + "</span>" +
      '<span style="color:#F59E0B">● จุดที่ส่งย้อนหลัง (ไม่มีเน็ตตอนจับ)</span>' +
      '<button class="btn btn-secondary" onclick="_njGpsRouteClose()">✕ ปิดเส้นทาง</button>';
    if (!G.routeLayer || !G.map) return;
    G.routeLayer.clearLayers();
    if (!pts.length) return;
    var ll = pts.map(function (q) { return [q[0], q[1]]; });
    L.polyline(ll, { color: "#2563EB", weight: 4, opacity: 0.85 }).addTo(G.routeLayer);
    pts.forEach(function (q, i) {
      if (q[4] > 60) L.circleMarker([q[0], q[1]], { radius: 4, color: "#F59E0B", weight: 2, fillOpacity: 0.9 })
        .bindTooltip("ส่งย้อนหลัง · จับ " + _t(q[3]) + " · รับช้า " + Math.round(q[4] / 60) + " นาที").addTo(G.routeLayer);
    });
    var a = pts[0], z = pts[pts.length - 1];
    L.circleMarker([a[0], a[1]], { radius: 8, color: "#fff", weight: 2, fillColor: "#16A34A", fillOpacity: 1 }).bindTooltip("เริ่ม " + _t(a[3])).addTo(G.routeLayer);
    L.circleMarker([z[0], z[1]], { radius: 8, color: "#fff", weight: 2, fillColor: R.live ? "#2563EB" : "#DC2626", fillOpacity: 1 }).bindTooltip((R.live ? "ล่าสุด " : "สิ้นสุด ") + _t(z[3])).addTo(G.routeLayer);
    if (fit && !G.follow) G.map.fitBounds(L.latLngBounds(ll).pad(0.15), { maxZoom: 17 });
  }

  function _empOptions() {
    var sel = document.getElementById("njgps-emp"); if (!sel) return;
    var list = G.rows.filter(function (r) { return G.dept === "ALL" || r.grp === G.dept; });
    sel.innerHTML = '<option value="">ทุกคน</option>' + list.map(function (r) {
      return '<option value="' + _e(r.id) + '">' + _e(r.name) + " (" + _e(GRP_TH[r.grp] || r.grp) + ")" + (_has(r) ? "" : " · ไม่มีตำแหน่ง") + "</option>";
    }).join("");
    sel.value = G.emp;
    var cb = document.getElementById("njgps-follow"); if (cb) { cb.checked = G.follow; cb.disabled = !G.emp; }
    var rb = document.getElementById("njgps-route-btn"); if (rb) rb.disabled = !G.emp;
  }

  function _pinIcon(r, tr, c) {
    var col = tr === "lost" ? GREY : c;
    /* ไม่สด → แสดงเวลาจับพิกัดใต้ชื่อเสมอ (ไม่ให้เข้าใจว่ายังอยู่ตรงนี้แน่นอน) */
    var sub = tr === "fresh" ? "" : "<small>" + (tr === "slow" ? "ล่าสุด " : "") + _e(_t(_cap(r))) + "</small>";
    return L.divIcon({ className: "njgps-pin " + tr, iconSize: [18, 18], iconAnchor: [9, 22],
      html: '<div class="lb" style="--c:' + col + '">' + _e(r.name) + sub + '</div><div class="pt" style="--c:' + col + '"></div>' });
  }

  function _paint(fit) {
    if (S.view !== "gps") return;
    var base = _filtered(true);
    var cnt = { fresh: 0, slow: 0, lost: 0, none: 0, work: 0 };
    base.forEach(function (r) { cnt[_tier(r)]++; if (r.work && r.work.live) cnt.work++; });
    var rows = _filtered();
    var have = rows.filter(_has);
    var upd = document.getElementById("njgps-upd"); if (upd) upd.textContent = G.loadedAt ? "อัปเดตล่าสุด " + _t(G.loadedAt) : "กำลังโหลด...";
    var st = document.getElementById("njgps-stat");
    var chip = function (k, color, label, n, id) {
      return '<span' + (id ? ' id="' + id + '"' : "") + ' data-st="' + k + '" class="' + (G.st === k ? "on" : "") + '" onclick="_njGpsSetSt(\'' + k + '\')" title="กดเพื่อกรอง · กดซ้ำเพื่อยกเลิก"><span class="njgps-dot" style="background:' + color + '"></span>' + label + ' <b data-n="' + n + '">' + n + "</b></span>";
    };
    if (st) st.innerHTML = chip("work", "#0EA672", "กำลังทำงาน", cnt.work) + chip("fresh", "#10B981", "อัปเดตล่าสุด", cnt.fresh, "njgps-have") +
      chip("slow", "#F59E0B", "อัปเดตช้า", cnt.slow) + chip("lost", GREY, "ขาดการอัปเดต", cnt.lost) + chip("none", "#475569", "ไม่มีตำแหน่ง", cnt.none, "njgps-none") +
      (G.err ? '<span style="color:#FCA5A5">⚠ ' + _e(G.err) + "</span>" : "");
    _empOptions();
    var lst = document.getElementById("njgps-list");
    if (lst) {
      lst.innerHTML = rows.length ? rows.map(function (r) {
        var tr = _tier(r), ag = _age(r), wk = _work(r);
        var cls = tr === "fresh" ? "ok" : tr === "slow" ? "warn" : tr === "lost" ? "lost" : "no";
        var dot = tr === "fresh" || tr === "slow" ? GRP_COLOR[r.grp] : GREY;
        return '<div class="njgps-item' + (G.emp === r.id ? " sel" : "") + '" data-uid="' + _e(r.id) + '" data-tier="' + tr + '" data-work="' + wk.k + '" onclick="_njGpsSetEmp(\'' + _e(r.id) + '\')">' +
          '<span class="njgps-dot" style="margin-top:5px;background:' + dot + '"></span><div>' +
          '<div class="nm">' + _e(r.name) + '</div><div class="sb">' + _e(GRP_TH[r.grp] || r.grp) + (r.department && String(r.department).toUpperCase() !== r.grp ? " · " + _e(r.department) : "") + "</div>" +
          '<div class="wk ' + wk.k + '">' + (wk.k === "on" ? "▶ " : wk.k === "gap" ? "⚠ " : "■ ") + _e(wk.tx) + "</div>" +
          '<div class="' + cls + '">' + TIER_ICO[tr] + " " + TIER_TH[tr] + (ag != null && tr !== "none" ? " · " + _ago(ag) : "") + "</div>" +
          (tr !== "none" ? '<div class="sb">' + (tr === "fresh" ? "จับพิกัด " : "ตำแหน่งล่าสุดที่ทราบ · จับ ") + _e(_t(_cap(r))) + "</div>" +
            '<div class="sb">รับ ' + _e(_t(r.received_at || r.recorded_at)) + " · " + _e(_acc(r)) + "</div>" : "") +
          "</div></div>";
      }).join("") : '<div style="padding:14px;color:var(--muted)">' + (G.loadedAt ? "ไม่มีพนักงานในเงื่อนไขนี้" : "กำลังโหลด...") + "</div>";
    }
    if (!G.map || !G.layer) return;
    /* อัปเดต Marker เดิม (ย้ายพิกัด / เปลี่ยนป้าย) · สร้างเฉพาะคนใหม่ · ลบเฉพาะคนที่ไม่อยู่ในชุดแสดงผล — ไม่สร้าง Map / Marker ใหม่ทั้งหมดทุก Poll */
    var keep = {};
    have.forEach(function (r) {
      keep[r.id] = 1;
      var c = GRP_COLOR[r.grp] || "#64748B", tr = _tier(r), wk = _work(r);
      var popup = "<b>" + _e(r.name) + "</b><br>" + _e(GRP_TH[r.grp] || r.grp) + (r.department ? " · " + _e(r.department) : "") +
        "<br>สถานะงาน: " + _e(wk.tx) +
        "<br>" + TIER_ICO[tr] + " " + TIER_TH[tr] + " (" + _ago(_age(r)) + ")" +
        (tr === "fresh" ? "" : "<br><b>ตำแหน่งล่าสุดที่ทราบ</b> — ไม่ใช่ตำแหน่งปัจจุบัน") +
        "<br>เวลาจับพิกัด " + _e(_t(_cap(r))) + (r.received_at ? "<br>เวลารับข้อมูล " + _e(_t(r.received_at)) : "") +
        "<br>ความแม่นยำ " + _e(_acc(r)) + "<br>ส่งจาก " + _e(_src(r)) +
        (tr === "lost" ? "<br><i>ไม่มีพิกัดใหม่เกิน 3 นาที (อาจไม่มีสัญญาณ/เน็ต/แอปถูกปิด) — ไม่ได้แปลว่าปิด GPS</i>" : "");
      var sig = r.name + "|" + c + "|" + tr + "|" + (tr === "lost" ? _cap(r) : "");
      var m = G.markers[r.id];
      if (m) {
        var ll = m.getLatLng(); if (ll.lat !== r.lat || ll.lng !== r.lng) m.setLatLng([r.lat, r.lng]);
        if (G.mkSig[r.id] !== sig) m.setIcon(_pinIcon(r, tr, c));
        m.setPopupContent(popup);
      } else {
        m = L.marker([r.lat, r.lng], { icon: _pinIcon(r, tr, c), title: r.name }).bindPopup(popup);
        m.addTo(G.layer); G.markers[r.id] = m;
      }
      G.mkSig[r.id] = sig;
      /* วงรัศมีความแม่นยำ (เกิน 50 ม. = เส้นประ) */
      var cc = G.circles[r.id], acc = r.accuracy != null && r.accuracy > 0 ? Math.min(r.accuracy, 5000) : 0;
      var cst = { color: tr === "lost" ? GREY : c, weight: 1, opacity: 0.7, fillOpacity: 0.08, dashArray: r.accuracy > COARSE_M ? "4 4" : null, interactive: false };
      if (acc) {
        if (cc) { cc.setLatLng([r.lat, r.lng]); cc.setRadius(acc); cc.setStyle(cst); }
        else { cc = L.circle([r.lat, r.lng], Object.assign({ radius: acc }, cst)).addTo(G.layer); G.circles[r.id] = cc; }
      } else if (cc) { try { G.layer.removeLayer(cc); } catch (_) {} delete G.circles[r.id]; }
    });
    Object.keys(G.markers).forEach(function (id) { if (!keep[id]) { try { G.layer.removeLayer(G.markers[id]); } catch (_) {} delete G.markers[id]; delete G.mkSig[id]; } });
    Object.keys(G.circles).forEach(function (id) { if (!keep[id]) { try { G.layer.removeLayer(G.circles[id]); } catch (_) {} delete G.circles[id]; } });
    if (G.follow && G.emp && !fit) { _followPan(false); return; }
    if (!fit && !(G.needFit && G.loadedAt)) return;
    if (G.loadedAt) G.needFit = false;
    if (G.emp) {
      var one = have.filter(function (r) { return r.id === G.emp; })[0];
      if (one) { G.map.setView([one.lat, one.lng], 16); try { G.markers[one.id].openPopup(); } catch (_) {} }
      else { try { toast("พนักงานคนนี้ไม่มีตำแหน่งในช่วง 30 วัน", "info"); } catch (_) {} }
    } else if (have.length) {
      G.map.fitBounds(L.latLngBounds(have.map(function (r) { return [r.lat, r.lng]; })).pad(0.2), { maxZoom: 15 });
    }
  }
})();
