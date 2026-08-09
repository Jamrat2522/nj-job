/* ============================================================
   NJ LOGISTIC HR SYSTEM — RUNTIME NAMESPACE
   ต้องโหลดหลัง asset-manifest.js และก่อน runtime/core.js เสมอ

   ไฟล์นี้ไม่มีตรรกะธุรกิจ ไม่มี Supabase ไม่มี UI ของฟีเจอร์ใด
   หน้าที่: Namespace · Shared Store shell · View Registry · Module Loader
            Navigation ID · Build ID Guard

   ตรวจชื่อชนแล้ว: ทั้งโปรเจกต์เดิมใช้เฉพาะ window.NJHR_* (มี underscore)
   ไม่มีที่ใดใช้ตัวแปร global ชื่อ `NJHR` เปล่า ๆ จึงใช้ชื่อนี้ได้โดยไม่ชน
   ============================================================ */
(function () {
  'use strict';

  var NJHR = window.NJHR = window.NJHR || {};
  var A = window.NJHR_ASSETS;

  /* ---------- 0) Asset Manifest — โหลดไม่ได้ = ห้าม Boot ต่อ ---------- */
  if (!A || !A.buildId || !A.runtime || !A.modules) {
    throw new Error('ASSET_MANIFEST_MISSING');
  }
  NJHR.assets = A;

  /* Build ID ต้องตรงกับ config.js (แหล่งเดียวที่ระบุเวอร์ชันที่เบราว์เซอร์ได้รับ)
     ไม่ตรง = ผู้ใช้ได้ไฟล์คนละ build → รีเฟรชครั้งเดียวอย่างปลอดภัย ห้ามวน */
  (function () {
    var cfg = window.NJHR_BUILD_VERSION;
    if (!cfg || cfg === A.buildId) return;
    var K = 'njhr_v2_build_reload';
    var last = null;
    try { last = sessionStorage.getItem(K); } catch (e) {}
    if (last === A.buildId) {
      try { console.error('[BUILD] เวอร์ชันไฟล์ไม่ตรงกันหลังรีเฟรชแล้ว 1 ครั้ง หยุดรีเฟรชซ้ำ'); } catch (e) {}
      return;                                   // กัน Refresh Loop เด็ดขาด
    }
    try { sessionStorage.setItem(K, A.buildId); } catch (e) {}
    location.reload();
  })();

  /* ---------- 1) Namespace ---------- */
  NJHR.core = NJHR.core || {};
  NJHR.store = NJHR.store || {};
  NJHR.ui = NJHR.ui || {};
  NJHR.auth = NJHR.auth || {};
  NJHR.layout = NJHR.layout || {};
  NJHR.compat = NJHR.compat || {};
  /* Public Feature Contract — Feature Module ลงทะเบียนสิ่งที่ Module อื่นเรียกได้ที่นี่
     ใช้แทนการอ้าง closure ข้าม chunk เพื่อตัดวงอ้างอิง (List ↔ Form ↔ Documents) */
  NJHR.features = NJHR.features || {};

  /* ---------- 2) Shared Store — ชุดเดียวของทั้งระบบ ----------
     ค่าจริงของ session / currentUser ยังอยู่ใน closure ของ runtime/core.js เหมือนเดิมทุกประการ
     ที่นี่เก็บเฉพาะสถานะระดับ Runtime และเป็นสะพาน accessor ให้ chunk อื่นอ่าน/เขียนตัวเดียวกัน
     (runtime/core.js เป็นผู้ติดตั้ง accessor sbUser / lvPending / ntUnread ทับลงไป) */
  if (NJHR.state) throw new Error('DUPLICATE_STORE');
  var subs = [];
  NJHR.state = {
    buildId: A.buildId,
    currentRoute: null,
    navigationId: 0,
    moduleState: {}
  };
  NJHR.store.subscribe = function (fn) {
    if (typeof fn !== 'function') throw new Error('subscribe: ต้องเป็น function');
    if (subs.indexOf(fn) >= 0) return function () {};     // กัน subscribe ซ้ำตัวเดิม
    subs.push(fn);
    return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
  };
  NJHR.store.notify = function (evt, data) {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](evt, data); } catch (e) { try { console.error('[STORE]', e); } catch (e2) {} }
    }
  };

  /* ---------- 3) Router shell — Navigation ID ----------
     ตรรกะ Route ทั้งหมดอยู่ใน runtime/core.js (ROUTES/render/canAccess เดิม)
     ที่นี่มีเฉพาะตัวนับ Navigation ID ซึ่งต้องเป็นตัวเดียวทั้งระบบ */
  if (NJHR.router) throw new Error('DUPLICATE_ROUTER');
  NJHR.router = {
    bump: function () { return ++NJHR.state.navigationId; },
    navId: function () { return NJHR.state.navigationId; },
    moduleMap: {}                                   // runtime/core.js เติมจาก ROUTES ตัวจริง
  };

  /* ---------- 4) View Registry ---------- */
  var VIEWS = {};
  var activeCleanup = null;      // cleanup ของ View ที่กำลังแสดงอยู่
  NJHR.views = {
    register: function (name, fn) {
      if (typeof name !== 'string' || !name) throw new Error('views.register: ชื่อ View ไม่ถูกต้อง');
      if (typeof fn !== 'function') throw new Error('views.register: ' + name + ' ไม่ใช่ function');
      if (Object.prototype.hasOwnProperty.call(VIEWS, name)) throw new Error('views.register: ชื่อซ้ำ ' + name);
      VIEWS[name] = fn;
    },
    unregister: function (name) { delete VIEWS[name]; },
    has: function (name) { return Object.prototype.hasOwnProperty.call(VIEWS, name); },
    list: function () { return Object.keys(VIEWS); },
    /* cleanup: View เรียกระหว่าง render เพื่อฝากงานเก็บกวาดของหน้าตัวเอง */
    onCleanup: function (fn) { if (typeof fn === 'function') activeCleanup = fn; },
    render: function (name, host, navId, route) {
      if (!NJHR.views.has(name)) throw new Error('views.render: ไม่พบ View ' + name);
      if (typeof navId === 'number' && navId !== NJHR.state.navigationId) return;   // นำทางใหม่แล้ว
      if (activeCleanup) {
        var c = activeCleanup; activeCleanup = null;
        try { c(); } catch (e) { try { console.error('[VIEW cleanup]', e); } catch (e2) {} }
      }
      NJHR.state.currentRoute = route || NJHR.state.currentRoute;
      try {
        var r = VIEWS[name](host);
        if (r && typeof r.then === 'function') {
          r['catch'](function (e) { try { console.error('[VIEW ' + name + ']', e); } catch (e2) {} });
        }
      } catch (e) {
        try { console.error('[VIEW ' + name + ']', e); } catch (e2) {}
        if (host) {
          host.innerHTML = '<div class="empty"><p>ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่</p>' +
            '<button class="btn btn-primary" id="rt-retry">ลองใหม่</button></div>';
          var b = document.getElementById('rt-retry');
          if (b) b.onclick = function () { NJHR.views.render(name, host, undefined, route); };
        }
      }
    }
  };

  /* ---------- 5) Module Loader ---------- */
  var ST = { NOT: 'not_loaded', LOADING: 'loading', LOADED: 'loaded', FAILED: 'failed' };
  var PR = {};                       // ชื่อ module -> Promise ที่กำลังทำงาน/สำเร็จ
  var TIMEOUT = 20000;

  function setState(name, s) { NJHR.state.moduleState[name] = s; }
  function stateOf(name) { return NJHR.state.moduleState[name] || ST.NOT; }

  function inject(name, url) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var exist = document.querySelector('script[data-njhr-mod="' + name + '"]');
      if (exist && exist.getAttribute('data-loaded') === '1') { resolve(); return; }
      if (exist && exist.parentNode) exist.parentNode.removeChild(exist);   // ของรอบที่ล้มเหลว
      var sc = document.createElement('script');
      sc.src = url;
      sc.async = false;                                   // รักษาลำดับ ไม่ใช้ async แบบทำลำดับพัง
      sc.setAttribute('data-njhr-mod', name);
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('MODULE_TIMEOUT:' + name));
      }, TIMEOUT);
      sc.onload = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        sc.setAttribute('data-loaded', '1');
        resolve();
      };
      sc.onerror = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        reject(new Error('MODULE_LOAD_FAILED:' + name));
      };
      document.head.appendChild(sc);
    });
  }

  NJHR.modules = {
    STATE: ST,
    getState: stateOf,
    isLoaded: function (name) { return stateOf(name) === ST.LOADED; },
    /* โหลด Module ตามชื่อใน Asset Manifest
       - กำลังโหลด  → คืน Promise เดิม (ไม่ยิงซ้ำ)
       - โหลดแล้ว   → คืนผลทันที
       - ล้มเหลว    → ลบ Promise และ <script> ทิ้ง ให้ retry ได้ แต่ไม่ retry เอง */
    load: function (name) {
      if (stateOf(name) === ST.LOADED) return Promise.resolve(name);
      if (PR[name]) return PR[name];
      var m = A.modules[name] || A.runtime[name];
      if (!m) return Promise.reject(new Error('MODULE_NOT_IN_MANIFEST:' + name));
      var url = typeof m === 'string' ? m : m.url;
      var deps = (typeof m === 'object' && m.deps) || [];
      setState(name, ST.LOADING);
      var chain = deps.reduce(function (p, d) {
        return p.then(function () { return NJHR.modules.load(d); });
      }, Promise.resolve());
      var pr = chain
        .then(function () { return inject(name, url); })
        .then(function () {
          var need = (typeof m === 'object' && m.provides) || [];
          for (var i = 0; i < need.length; i++) {
            if (!NJHR.views.has(need[i])) throw new Error('MODULE_DID_NOT_REGISTER:' + name);
          }
          setState(name, ST.LOADED);
          NJHR.store.notify('module:loaded', name);
          return name;
        })['catch'](function (e) {
          setState(name, ST.FAILED);
          delete PR[name];                                     // ลบ Promise ที่ล้มเหลวก่อน retry
          var bad = document.querySelector('script[data-njhr-mod="' + name + '"]:not([data-loaded="1"])');
          if (bad && bad.parentNode) bad.parentNode.removeChild(bad);
          throw e;
        });
      PR[name] = pr;
      return pr;
    },
    /* retry ต้องถูกสั่งจากผู้ใช้เท่านั้น — ไม่มีการ retry อัตโนมัติ จึงไม่มีทางวนไม่รู้จบ */
    retry: function (name) {
      delete PR[name];
      setState(name, ST.NOT);
      return NJHR.modules.load(name);
    }
  };
})();
