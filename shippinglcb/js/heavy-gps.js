/* ============================================================
   heavy-gps.js — 📍 แผนที่ GPS พนักงาน (SUPER_ADMIN + Desktop เท่านั้น)
   Lazy chunk (classic script · shared scope กับ app.js)
   Source: RPC nj_gps_latest (sql/RUN-06_nj_staff_gps.sql) — ตำแหน่งล่าสุด 1 แถว/คน
   ไม่โหลดประวัติ · ไม่ผูก JOB / รถ · ความสดคำนวณจาก recorded_at ของ Server: ≤3 นาที สด · >3–5 นาที ค้าง · >5 นาที/ไม่มี = ไม่มีตำแหน่ง
   ============================================================ */
(function () {
  "use strict";
  var LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  var LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  var REFRESH_MS = 30000;
  var FRESH_MS = 3 * 60000, STALE_MS = 5 * 60000;
  var GRP_TH = { MESSENGER: "Messenger", SHIPPING: "Shipping" };
  var GRP_COLOR = { MESSENGER: "#10B981", SHIPPING: "#3B82F6" };
  var G = { rows: [], dept: "ALL", emp: "", st: "", map: null, layer: null, markers: {}, mkSig: {}, loadedAt: null, loadedClient: 0, timer: null, busy: false, err: "" };
  window.__njGps = G;

  function _e(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function _ok() { return typeof _njGpsAllowed === "function" && _njGpsAllowed(); }
  function _block() { try { S.view = _defaultLandingView(); renderView(); renderSidebar(); } catch (_) {} }
  function _t(iso) {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }); } catch (_) { return String(iso); }
  }

  /* อายุ GPS (ms) จากเวลา Server: server_now + เวลาที่ผ่านไปบน Client − recorded_at */
  function _age(r) {
    if (!r || !r.recorded_at) return null;
    var now = (G.loadedAt ? Date.parse(G.loadedAt) : Date.now()) + (G.loadedClient ? Date.now() - G.loadedClient : 0);
    var a = now - Date.parse(r.recorded_at); return isNaN(a) ? null : Math.max(0, a);
  }
  function _tier(r) { var a = _age(r); if (a == null || r.lat == null || r.lng == null) return "none"; return a <= FRESH_MS ? "fresh" : a <= STALE_MS ? "stale" : "none"; }
  function _has(r) { return _tier(r) !== "none"; }
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
      if (!noSt && G.st === "have" && !_has(r)) return false;
      if (!noSt && G.st === "none" && _has(r)) return false;
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
      ".njgps-pin.stale{opacity:.6}";
    document.head.appendChild(st);
  }

  window.renderGpsView = function () {
    if (!_ok()) return _block();
    _style();
    var host = document.getElementById("view-root"); if (!host) return;
    if (G.map) { try { G.map.remove(); } catch (_) {} }
    G.map = null; G.layer = null; G.markers = {}; G.mkSig = {}; G.needFit = true;
    var seq = G.seq = (G.seq || 0) + 1; /* render ซ้อนกัน → ให้ callback ของรอบล่าสุดสร้าง Map เท่านั้น (กัน Map container already initialized) */
    host.innerHTML =
      '<div class="topbar"><div><h1>📍 แผนที่ GPS (พนักงาน)</h1><p class="sub">ตำแหน่งล่าสุดของ MESSENGER + SHIPPING · เกิน 5 นาที = ไม่มีตำแหน่ง</p></div>' +
      '<button class="btn btn-secondary" id="njgps-refresh" onclick="_njGpsReload(true)">🔄 <span id="njgps-upd">กำลังโหลด...</span></button></div>' +
      '<div class="content">' +
      '<div class="njgps-bar">' +
      '<label>แผนก</label><select id="njgps-dept" onchange="_njGpsSetDept(this.value)">' +
      '<option value="ALL">ทั้งหมด</option><option value="MESSENGER">MESSENGER</option><option value="SHIPPING">SHIPPING</option></select>' +
      '<label>พนักงาน</label><select id="njgps-emp" onchange="_njGpsSetEmp(this.value)"><option value="">ทุกคน</option></select>' +
      '<div class="njgps-stat" id="njgps-stat"></div></div>' +
      '<div class="njgps-wrap"><div id="njgps-map"></div><div class="panel njgps-list" id="njgps-list"></div></div>' +
      '</div>';
    document.getElementById("njgps-dept").value = G.dept;
    _leaflet().then(function () {
      if (seq !== G.seq || S.view !== "gps" || !document.getElementById("njgps-map")) return;
      G.map = L.map("njgps-map", { zoomControl: true }).setView([13.2, 100.9], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(G.map);
      G.layer = L.layerGroup().addTo(G.map);
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
      if (G.emp && !G.rows.some(function (x) { return x.id === G.emp; })) G.emp = "";
      if (S.view === "gps") _paint(false);
    }).catch(function (e) {
      G.err = (typeof _njRpcMsg === "function" ? _njRpcMsg(e) : (e && e.message) || "โหลดไม่สำเร็จ");
      if (/ไม่มีสิทธิ์/.test(G.err)) return _block();
      if (manual) try { toast("โหลดตำแหน่งไม่สำเร็จ: " + G.err, "error"); } catch (_) {}
      if (S.view === "gps") _paint(false);
    }).finally(function () {
      G.busy = false; var b = document.getElementById("njgps-refresh"); if (b) b.disabled = false;
    });
  };

  window._njGpsSetDept = function (v) { G.dept = v || "ALL"; G.emp = ""; _paint(true); };
  window._njGpsSetEmp = function (v) { G.emp = v || ""; _paint(true); };
  /* Status filter: กดซ้ำ = ยกเลิก · กรองจาก Dataset เดิม (ไม่ยิง API) · คงไว้ข้ามรอบ Poll */
  window._njGpsSetSt = function (v) { G.st = (G.st === v ? "" : (v || "")); _paint(false); };
  /* กลับมาที่ Tab ขณะอยู่หน้า GPS → ดึงล่าสุดทันที 1 ครั้ง (Listener ตัวเดียว ลงทะเบียนครั้งเดียวตอนโหลด chunk) */
  document.addEventListener("visibilitychange", function () {
    try { if (!document.hidden && S.view === "gps" && G.timer && _ok()) window._njGpsReload(false); } catch (_) {}
  });

  function _empOptions() {
    var sel = document.getElementById("njgps-emp"); if (!sel) return;
    var list = G.rows.filter(function (r) { return G.dept === "ALL" || r.grp === G.dept; });
    sel.innerHTML = '<option value="">ทุกคน</option>' + list.map(function (r) {
      return '<option value="' + _e(r.id) + '">' + _e(r.name) + " (" + _e(GRP_TH[r.grp] || r.grp) + ")" + (_has(r) ? "" : " · ไม่มีตำแหน่ง") + "</option>";
    }).join("");
    sel.value = G.emp;
  }

  function _paint(fit) {
    if (S.view !== "gps") return;
    var base = _filtered(true);
    var nHave = base.filter(_has).length, none = base.length - nHave;
    var rows = _filtered();
    var have = rows.filter(_has);
    var upd = document.getElementById("njgps-upd"); if (upd) upd.textContent = G.loadedAt ? "อัปเดตล่าสุด " + _t(G.loadedAt) : "กำลังโหลด...";
    var st = document.getElementById("njgps-stat");
    if (st) st.innerHTML = '<span id="njgps-have" data-st="have" class="' + (G.st === "have" ? "on" : "") + '" onclick="_njGpsSetSt(\'have\')" title="กดเพื่อกรอง · กดซ้ำเพื่อยกเลิก"><span class="njgps-dot" style="background:#10B981"></span>มีตำแหน่ง <b data-n="' + nHave + '">' + nHave + "</b> คน</span>" +
      '<span id="njgps-none" data-st="none" class="' + (G.st === "none" ? "on" : "") + '" onclick="_njGpsSetSt(\'none\')" title="กดเพื่อกรอง · กดซ้ำเพื่อยกเลิก"><span class="njgps-dot" style="background:#94A3B8"></span>ไม่มีตำแหน่ง <b data-n="' + none + '">' + none + "</b> คน</span>" +
      (G.err ? '<span style="color:#FCA5A5">⚠ ' + _e(G.err) + "</span>" : "");
    _empOptions();
    var lst = document.getElementById("njgps-list");
    if (lst) {
      lst.innerHTML = rows.length ? rows.map(function (r) {
        var tr = _tier(r), ok = tr !== "none", ag = _age(r);
        var stx = tr === "fresh" ? '<div class="ok">🟢 มีตำแหน่ง</div>' : tr === "stale" ? '<div class="warn">🟠 ตำแหน่งไม่ได้อัปเดต</div>'
                : '<div class="no">⚪ ' + (r.recorded_at ? "ไม่มีตำแหน่งล่าสุด" : "ไม่มีตำแหน่ง") + "</div>";
        return '<div class="njgps-item' + (G.emp === r.id ? " sel" : "") + '" data-uid="' + _e(r.id) + '" data-tier="' + tr + '" onclick="_njGpsSetEmp(\'' + _e(r.id) + '\')">' +
          '<span class="njgps-dot" style="margin-top:5px;background:' + (ok ? GRP_COLOR[r.grp] : "#94A3B8") + '"></span><div>' +
          '<div class="nm">' + _e(r.name) + '</div><div class="sb">' + _e(GRP_TH[r.grp] || r.grp) + "</div>" + stx +
          (r.recorded_at ? '<div class="sb">อัปเดตล่าสุด ' + _ago(ag) + "</div>" + (tr === "fresh" ? '<div class="sb">' + _t(r.recorded_at) + "</div>" : "") : "") +
          "</div></div>";
      }).join("") : '<div style="padding:14px;color:var(--muted)">' + (G.loadedAt ? "ไม่มีพนักงานในเงื่อนไขนี้" : "กำลังโหลด...") + "</div>";
    }
    if (!G.map || !G.layer) return;
    /* อัปเดต Marker เดิม (ย้ายพิกัด / เปลี่ยนป้าย) · สร้างเฉพาะคนใหม่ · ลบเฉพาะคนที่ไม่อยู่ในชุดแสดงผล — ไม่สร้าง Map / Marker ใหม่ทั้งหมดทุก Poll */
    var keep = {};
    have.forEach(function (r) {
      keep[r.id] = 1;
      var c = GRP_COLOR[r.grp] || "#64748B", tr = _tier(r);
      var popup = "<b>" + _e(r.name) + "</b><br>" + _e(GRP_TH[r.grp] || r.grp) + "<br>อัปเดต " + _e(_t(r.recorded_at)) + " (" + _ago(_age(r)) + ")" +
        (tr === "stale" ? "<br>🟠 ตำแหน่งไม่ได้อัปเดต" : "") + (r.accuracy != null ? "<br>ความแม่นยำ ±" + Math.round(r.accuracy) + " ม." : "");
      var sig = r.name + "|" + c + "|" + tr;
      var m = G.markers[r.id];
      if (m) {
        var ll = m.getLatLng(); if (ll.lat !== r.lat || ll.lng !== r.lng) m.setLatLng([r.lat, r.lng]);
        if (G.mkSig[r.id] !== sig) m.setIcon(L.divIcon({ className: "njgps-pin" + (tr === "stale" ? " stale" : ""), iconSize: [18, 18], iconAnchor: [9, 22],
          html: '<div class="lb" style="--c:' + c + '">' + _e(r.name) + '</div><div class="pt" style="--c:' + c + '"></div>' }));
        m.setPopupContent(popup);
      } else {
        m = L.marker([r.lat, r.lng], { icon: L.divIcon({ className: "njgps-pin" + (tr === "stale" ? " stale" : ""), iconSize: [18, 18], iconAnchor: [9, 22],
          html: '<div class="lb" style="--c:' + c + '">' + _e(r.name) + '</div><div class="pt" style="--c:' + c + '"></div>' }), title: r.name }).bindPopup(popup);
        m.addTo(G.layer); G.markers[r.id] = m;
      }
      G.mkSig[r.id] = sig;
    });
    Object.keys(G.markers).forEach(function (id) { if (!keep[id]) { try { G.layer.removeLayer(G.markers[id]); } catch (_) {} delete G.markers[id]; delete G.mkSig[id]; } });
    if (!fit && !(G.needFit && G.loadedAt)) return;
    if (G.loadedAt) G.needFit = false;
    if (G.emp) {
      var one = have.filter(function (r) { return r.id === G.emp; })[0];
      if (one) { G.map.setView([one.lat, one.lng], 16); try { G.markers[one.id].openPopup(); } catch (_) {} }
      else { try { toast("พนักงานคนนี้ไม่มีตำแหน่งล่าสุด", "info"); } catch (_) {} }
    } else if (have.length) {
      G.map.fitBounds(L.latLngBounds(have.map(function (r) { return [r.lat, r.lng]; })).pad(0.2), { maxZoom: 15 });
    }
  }
})();
