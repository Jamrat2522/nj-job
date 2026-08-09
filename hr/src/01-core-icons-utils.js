/* ============================================================
   NJ LOGISTIC HR SYSTEM
   โครงสร้าง: Icons / Utils / Store / Session / UI Managers /
              Router+Guards / Layout / Views / Init
   Production: Store จะเปลี่ยนเป็น Supabase (Auth + PostgREST + RPC)
   โดย View เรียกผ่าน Repository ชั้นเดียว ไม่ต้องเขียน UI ใหม่
   ============================================================ */
(function () {
  'use strict';

  /* ================= ICONS (Lucide-style inline SVG) ================= */
  var P = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var ICONS = {
    more: P + '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>',
    send: P + '<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4Z"/></svg>',
    dashboard: P + '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    users: P + '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    clock: P + '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    calendarOff: P + '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="15" x2="15" y2="19"/><line x1="15" y1="15" x2="9" y2="19"/></svg>',
    timer: P + '<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
    wallet: P + '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    fileText: P + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    shield: P + '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    check: P + '<polyline points="20 6 9 17 4 12"/></svg>',
    checkSquare: P + '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    chart: P + '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    calendar: P + '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    megaphone: P + '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
    userCog: P + '<circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>',
    building: P + '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>',
    settings: P + '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    history: P + '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    logout: P + '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    home: P + '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    user: P + '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    menu: P + '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
    bell: P + '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    x: P + '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    plus: P + '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    search: P + '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    edit: P + '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    eye: P + '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: P + '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
    download: P + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    ban: P + '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>',
    printer: P + '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    chevL: P + '<polyline points="15 18 9 12 15 6"/></svg>',
    chevR: P + '<polyline points="9 18 15 12 9 6"/></svg>',
    chevUp: P + '<polyline points="18 15 12 9 6 15"/></svg>',
    chevDown: P + '<polyline points="6 9 12 15 18 9"/></svg>',
    alignLeft: P + '<line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
    alignCenter: P + '<line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>',
    alignRight: P + '<line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>',
    alignJustify: P + '<line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>',
    listUl: P + '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3.5" y1="6" x2="3.51" y2="6"/><line x1="3.5" y1="12" x2="3.51" y2="12"/><line x1="3.5" y1="18" x2="3.51" y2="18"/></svg>',
    listOl: P + '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 5h1v4"/><path d="M4 9h2"/><path d="M6 18H4c0-1 2-1.6 2-2.6S5 14 4 14.6"/></svg>',
    indent: P + '<polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>',
    outdent: P + '<polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>',
    undo: P + '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    redo: P + '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>',
    eraser: P + '<path d="M20 20H9l-5-5a2 2 0 0 1 0-2.8l7-7a2 2 0 0 1 2.8 0l6 6a2 2 0 0 1 0 2.8L14 20"/><line x1="18" y1="20" x2="8" y2="20"/></svg>',
    paperclip: P + '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    folder: P + '<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z"/></svg>',
    upload: P + '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    trash: P + '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    pin: P + '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
    info: P + '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    mapPin: P + '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    camera: P + '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    login: P + '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>'
  };
  function icon(name, cls) { return '<span class="ic ' + (cls || '') + '">' + (ICONS[name] || '') + '</span>'; }

  /* ================= UTILS ================= */
  var TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var TH_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function nowStamp() { return todayISO() + ' ' + nowTime(); }
  function fmtDate(isoStr) {
    if (!isoStr) return '—';
    var p2 = isoStr.split('-');
    return parseInt(p2[2], 10) + ' ' + TH_MONTHS[parseInt(p2[1], 10) - 1].slice(0, 3) + '. ' + (parseInt(p2[0], 10) + 543);
  }
  function fmtMonthYear(m, y) { return TH_MONTHS[m - 1] + ' ' + (y + 543); }
  function money(n) { return (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  /* ===== ตัวโหลด Library กลาง — Promise Cache =====
     - เรียกซ้ำคืน Promise เดิม ไม่สร้าง <script> ซ้ำ ไม่เกิด Global ซ้ำ
     - ตรวจ tag เดิมด้วย data-lib ก่อนสร้างใหม่
     - โหลดล้มเหลวหรือหมดเวลา = ลบออกจาก cache ให้ลองใหม่ได้
     - ไม่กลืน error · มี timeout ชัดเจน
     - ตรวจ global ที่คาดหวังหลังโหลด ถ้าไม่พบถือว่าล้มเหลว */
  /* ไฟล์ในโปรเจกต์ต้องมี Build Version ต่อท้าย เพื่อไม่ให้ Browser ใช้ไฟล์ข้าม Build
     ค่ามาจาก config.js ซึ่ง build.js เขียนให้เป็นค่าเดียวกับ sw.js */
  function njAsset(path) {
    var v = window.NJHR_BUILD_VERSION;
    if (!v) return path;
    return path + (path.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(v);
  }
  var NJ_LIB_CACHE = {};
  var NJ_LIB_TIMEOUT = 20000;
  function loadScriptOnce(key, src, globalName) {
    if (NJ_LIB_CACHE[key]) return NJ_LIB_CACHE[key];
    var pr = new Promise(function (resolve, reject) {
      if (globalName && window[globalName]) { resolve(); return; }
      var exist = document.querySelector('script[data-lib="' + key + '"]');
      if (exist) {
        if (exist.getAttribute('data-loaded') === '1') { resolve(); return; }
        exist.addEventListener('load', function () { resolve(); });
        exist.addEventListener('error', function () { reject(new Error('โหลด ' + key + ' ไม่สำเร็จ')); });
        return;
      }
      var done = false;
      var sc = document.createElement('script');
      sc.src = src;
      sc.async = false;                       // รักษาลำดับเมื่อโหลดหลายไฟล์ต่อกัน
      sc.setAttribute('data-lib', key);
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('โหลด ' + key + ' ไม่สำเร็จ: หมดเวลารอ'));
      }, NJ_LIB_TIMEOUT);
      sc.onload = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        sc.setAttribute('data-loaded', '1');
        if (globalName && !window[globalName]) {
          reject(new Error('โหลด ' + key + ' แล้วแต่ไม่พบ ' + globalName));
          return;
        }
        resolve();
      };
      sc.onerror = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        reject(new Error('โหลด ' + key + ' ไม่สำเร็จ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
      };
      document.head.appendChild(sc);
    })['catch'](function (e) {
      delete NJ_LIB_CACHE[key];               // ให้ผู้ใช้กดใหม่แล้วลองโหลดอีกครั้งได้
      var bad = document.querySelector('script[data-lib="' + key + '"]:not([data-loaded="1"])');
      if (bad && bad.parentNode) bad.parentNode.removeChild(bad);
      throw e;
    });
    NJ_LIB_CACHE[key] = pr;
    return pr;
  }
  /* โหลด CSS แบบเดียวกับ loadScriptOnce
     - onerror = reject (ไม่กลืน Error) · มี timeout เท่ากับสคริปต์
     - ล้มเหลวแล้วลบ <link> ที่เสียและลบ Promise ออกจาก cache ให้ลองใหม่ได้
     - โหลดสำเร็จแล้วเรียกซ้ำคืนทันที ไม่ดาวน์โหลดซ้ำ */
  function loadStyleOnce(key, href) {
    var ck = 'css:' + key;
    if (NJ_LIB_CACHE[ck]) return NJ_LIB_CACHE[ck];
    var pr = new Promise(function (resolve, reject) {
      var exist = document.querySelector('link[data-lib="' + key + '"]');
      if (exist) {
        if (exist.getAttribute('data-loaded') === '1') { resolve(); return; }
        exist.addEventListener('load', function () { resolve(); });
        exist.addEventListener('error', function () { reject(new Error('โหลด CSS ' + key + ' ไม่สำเร็จ')); });
        return;
      }
      var done = false;
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      l.setAttribute('data-lib', key);
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error('โหลด CSS ' + key + ' ไม่สำเร็จ: หมดเวลารอ'));
      }, NJ_LIB_TIMEOUT);
      l.onload = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        l.setAttribute('data-loaded', '1');
        resolve();
      };
      l.onerror = function () {
        if (done) return;
        done = true; clearTimeout(timer);
        reject(new Error('โหลด CSS ' + key + ' ไม่สำเร็จ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
      };
      document.head.appendChild(l);
    })['catch'](function (e) {
      delete NJ_LIB_CACHE[ck];                  // ให้ลองใหม่ได้
      var bad = document.querySelector('link[data-lib="' + key + '"]:not([data-loaded="1"])');
      if (bad && bad.parentNode) bad.parentNode.removeChild(bad);
      throw e;
    });
    NJ_LIB_CACHE[ck] = pr;
    return pr;
  }
  /* เปิดทางให้โมดูลที่อยู่นอก IIFE ของ app.js ใช้ตัวโหลดชุดเดียวกันได้
     ปัจจุบันมี face.js ตัวเดียวที่ต้องใช้ — ใช้ cache และตรรกะ retry เดียวกัน
     ไม่ให้เกิดตรรกะโหลดไฟล์ซ้ำสองที่ */
  window.NJHR_loadStyleOnce = loadStyleOnce;
  window.NJHR_loadScriptOnce = loadScriptOnce;
  window.NJHR_asset = njAsset;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase(); }
  function maskAcc(a) { if (!a) return '—'; return a.slice(0, 4) + '-x-xxx' + a.slice(-4); }
  function isWeekend(isoStr) { var d = new Date(isoStr + 'T00:00:00').getDay(); return d === 0 || d === 6; }
  /* ---------- วันหยุด: แหล่งข้อมูลกลางชุดเดียว ----------
     ตาราง holidays บน Supabase คือชุดเดียวกับที่ njhr_leave_workdays() ใช้นับวันทำงานฝั่งเซิร์ฟเวอร์
     ปฏิทิน / OT / REPORT ALL / การนับวันลาฝั่งหน้าจอ อ่านผ่าน holHas() ตัวเดียวกันทั้งหมด
     Fallback: ถ้ายังโหลดไม่สำเร็จ ใช้ db.holidays เดิม เพื่อไม่ให้การคำนวณพังกลางคัน */
  var holCache = { ready: false, at: 0, set: Object.create(null), name: Object.create(null), loading: null };
  var HOL_TTL = 5 * 60 * 1000;

  function holLoad(force) {
    if (!sbReady() || !sbToken()) return Promise.resolve(false);
    if (!force && holCache.ready && (Date.now() - holCache.at) < HOL_TTL) return Promise.resolve(true);
    if (holCache.loading) return holCache.loading;
    holCache.loading = sbRpcList('njhr_holiday_list', { p_token: sbToken(), p_from: null, p_to: null })
      .then(function (rows) {
        var st = Object.create(null), nm = Object.create(null);
        (rows || []).forEach(function (h) {
          var d = String(h.holiday_date).slice(0, 10);
          st[d] = 1; nm[d] = h.name;
        });
        holCache.set = st; holCache.name = nm;
        holCache.ready = true; holCache.at = Date.now();
        return true;
      }).catch(function (er) {
        console.error('[HOLIDAY] โหลดวันหยุดจาก Supabase ไม่สำเร็จ ใช้ข้อมูลสำรองในเครื่อง:', er);
        return false;
      }).then(function (ok) { holCache.loading = null; return ok; });
    return holCache.loading;
  }
  function holInvalidate() { holCache.ready = false; holCache.at = 0; }
  // ตัวอ่านกลาง: โหลดสำเร็จแล้วใช้ Supabase · ยังไม่สำเร็จจึงใช้ db.holidays เดิม
  function holHas(isoStr) {
    if (holCache.ready) return !!holCache.set[isoStr];
    return (db.holidays || []).some(function (h) { return h.date === isoStr; });
  }
  function holName(isoStr) {
    if (holCache.ready) return holCache.name[isoStr] || '';
    var h = (db.holidays || []).find(function (x) { return x.date === isoStr; });
    return h ? h.name : '';
  }

  // ฟังก์ชันเดิมยังอยู่ครบ เปลี่ยนเฉพาะให้เรียกตัวกลาง (ผู้เรียกเดิมไม่ต้องแก้)
  function isHoliday(isoStr) { return holHas(isoStr); }
  // นับวันทำงานระหว่างช่วง (ไม่รวมเสาร์-อาทิตย์และวันหยุดบริษัท) — Production ย้ายไป DB Function
  function businessDays(start, end) {
    var s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00'), c = 0;
    if (s > e) return 0;
    while (s <= e) {
      var isoStr = s.getFullYear() + '-' + pad(s.getMonth() + 1) + '-' + pad(s.getDate());
      if (!isWeekend(isoStr) && !isHoliday(isoStr)) c++;
      s.setDate(s.getDate() + 1);
    }
    return c;
  }
  function hoursDiff(t1, t2) {
    var a = t1.split(':'), b = t2.split(':');
    var m = (parseInt(b[0], 10) * 60 + parseInt(b[1], 10)) - (parseInt(a[0], 10) * 60 + parseInt(a[1], 10));
    if (m < 0) m += 24 * 60; // OT ข้ามวัน
    return Math.round(m / 60 * 100) / 100;
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function downloadCSV(filename, rows) {
    var csv = '\uFEFF' + rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
  }
  function avatarHTML(name, size, colorSeed) {
    var initial = (name || '?').trim().charAt(0);
    var colors = ['#E60000', '#2563EB', '#16A34A', '#F59E0B', '#7C3AED', '#0D9488', '#DB2777'];
    var c = colors[(colorSeed || name || '').length % colors.length];
    return '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + c + '22;color:' + c + ';font-size:' + Math.round(size * 0.42) + 'px">' + esc(initial) + '</span>';
  }

