/* ============================================================
   NJ HR V.10 — face.js
   สแกนใบหน้าเพื่อลงเวลา + ลงทะเบียนใบหน้า (โมดูลแยก ไม่แตะ app.js เดิม)

   ลำดับการทำงานตอนลงเวลา
     เปิดกล้อง → พบใบหน้า 1 คน → Passive Liveness → สร้าง Descriptor
     → ขอ GPS พร้อมกัน → อัปโหลด Snapshot เข้า bucket private
     → เรียก njhr_att_punch_face (RPC เดียวจบ ตรวจใบหน้า+Geofence+เขียน attendance)

   ความปลอดภัย
     · Descriptor ที่ลงทะเบียนไว้ไม่เคยถูกส่งมาที่เบราว์เซอร์ — การเทียบทำที่ฐานข้อมูล
     · เบราว์เซอร์ส่งได้แค่ descriptor ของภาพสด ณ ตอนนั้น
     · ไม่มีการเก็บ descriptor ลง localStorage / sessionStorage
     · ไม่มี console.log ของ descriptor
     · คะแนนความเหมือนไม่แสดงให้พนักงานเห็น (เก็บใน Log ให้ผู้ดูแล)

   ต้องมีบนหน้าเว็บก่อน (index.html ตั้งค่าไว้)
     window.NJHR_SUPABASE_URL / window.NJHR_SUPABASE_ANON_KEY   ← ค่าเดิมที่ app.js ใช้
     window.NJHR_FACE_MODEL_URL                   ← โฟลเดอร์ไฟล์โมเดล face-api.js
   ============================================================ */
(function (w, d) {
  'use strict';

  /* ---------- แหล่งไลบรารี + โมเดล ----------
     หลัก:   assets/models/ บน Origin เดียวกับระบบ (netlify.toml ตั้ง immutable
             จึงโหลดครั้งเดียวถาวร ไม่โหลดซ้ำแม้ Deploy เวอร์ชันใหม่)
     สำรอง:  jsDelivr CDN ตัวเดิม — ใช้เฉพาะเมื่อไฟล์ Local โหลดไม่สำเร็จ
             (เช่น Deploy ไม่ครบ) เพื่อไม่ให้การลงเวลาหยุดทั้งบริษัท
     ไฟล์และเวอร์ชันตรงกันทั้งสองแหล่ง (@vladmandic/face-api@1.7.13) ผลตรวจจึงเท่ากัน */
  var FACE_API_LOCAL = 'assets/models/face-api.js';
  var FACE_API_CDN   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js';
  var MODEL_URL_LOCAL = w.NJHR_FACE_MODEL_URL || 'assets/models';
  var MODEL_URL_CDN   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

  var S = {
    /* [PERF] แยกสถานะโมเดลเป็น 2 เฟส
       guideReady/guideLoading = Detector + Landmark (550 KB) — พอสำหรับนำทางใบหน้า
       recogReady/recogLoading = Recognition (6.44 MB)  — ต้องมีเฉพาะตอนสร้าง Descriptor
       ready = พร้อมครบทั้งสองเฟส (ความหมายเดิม ใช้กับ isReady() และ UI ที่อ่านค่านี้อยู่) */
    ready: false, loading: null, cssAdded: false, mode: '',
    guideReady: false, guideLoading: null, recogReady: false, recogLoading: null,
    stream: null, video: null, canvas: null, raf: 0,
    running: false, busy: false, root: null,
    attempts: 0, lastFail: null,
    // บริบทของการสแกนล่าสุด — ใช้แนบไปกับคำขออนุมัติลงเวลาพิเศษ
    ctx: { snapshot: null, gps: null, similarity: null, distance: null,
           liveness: null, liveness_method: null, faces: null }
  };

  /* ---------- ตัวช่วยพื้นฐาน ---------- */
  // ใช้ค่าเดียวกับที่ index.html ตั้งไว้ให้ app.js (publishable key เท่านั้น)
  function sb() {
    return { url: w.NJHR_SUPABASE_URL || '', key: w.NJHR_SUPABASE_ANON_KEY || '' };
  }
  function token() { try { return localStorage.getItem('njhr_token') || ''; } catch (e) { return ''; } }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* ---------- fetch ที่มี Timeout ----------
     ใช้ค่าเดียวกับ SB_TIMEOUT_MS ของ runtime (window.NJHR_SB_TIMEOUT_MS)
     ไม่ประกาศค่าใหม่ซ้ำ · ครบเวลาแล้ว abort จริง ไม่ปล่อยให้ Loading ค้าง */
  function netTimeout() { return Number(w.NJHR_SB_TIMEOUT_MS) || 13000; }
  /* [ข้อ 4] Abort Controller "ต่อ Attempt" — ไม่ใช่ตัวเดียวข้าม Attempt
     ATT.ctls เก็บ controller ของ Attempt ปัจจุบันเท่านั้น
     attAbortAll() ถูกเรียกตอน Retry / Cancel / Route Change / Logout / Background
     → Snapshot PUT · Error Evidence PUT · Edge request ของ Attempt เก่าถูกยกเลิกทันที
     Request ของ Attempt ใหม่ใช้ชุด controller คนละชุด จึงไม่ถูกยกเลิกตามไปด้วย
     RPC กลางของระบบ (rpc()) ก็ผ่าน fetchT เช่นกัน แต่จะถูก Abort เฉพาะเมื่อ
     Attempt ที่เป็นเจ้าของถูกยกเลิกจริง ไม่กระทบส่วนอื่นของแอป */
  /* [ข้อ 4] Network Cancellation แบบ "ต่อ Owner จริง"
     NET.owner = Owner ID ปัจจุบัน (Attempt ID หรือ Enrollment Run ID)
     ทุก Request ที่เกิดขึ้นจะถูก Register เข้า Owner ที่ active ตอนนั้น
     abortAttempt(ownerId) ยกเลิกเฉพาะ Request ของ Owner นั้น
     Attempt เก่าที่ยิง Request ทีหลังจะได้ owner เดิมของตัวเอง จึงลงทะเบียนเข้า
     Owner ของ Attempt ใหม่ไม่ได้ และไม่มีทางถูก Abort ข้ามกัน */
  var NET = { owner: 0, map: {} };
  function netOwn(ownerId) { NET.owner = ownerId || 0; }
  function netTrack(ctl) {
    if (!ctl) return function () {};
    var o = NET.owner;
    if (!NET.map[o]) NET.map[o] = [];
    NET.map[o].push(ctl);
    return function () {
      var a = NET.map[o]; if (!a) return;
      var i = a.indexOf(ctl); if (i >= 0) a.splice(i, 1);
      if (!a.length) delete NET.map[o];
    };
  }
  function abortAttempt(ownerId) {
    var a = NET.map[ownerId]; if (!a) return;
    delete NET.map[ownerId];
    a.forEach(function (c) { try { c.abort(); } catch (e) {} });
  }
  /* ยกเลิกของ Owner ปัจจุบันเท่านั้น — ใช้ตอน close()/closeSoft() */
  function attAbortAll() { abortAttempt(NET.owner); }

  function fetchT(url, opt, label) {
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timedOut = false;
    var untrack = netTrack(ctl);
    var ms = netTimeout();
    var timer = setTimeout(function () { timedOut = true; if (ctl) ctl.abort(); }, ms);
    var o = Object.assign({}, opt || {});
    if (ctl) o.signal = ctl.signal;
    return fetch(url, o).then(function (r) {
      untrack();
      clearTimeout(timer);
      return r;
    }, function (e) {
      clearTimeout(timer);
      untrack();
      if (timedOut) {
        throw new Error((label || 'การเชื่อมต่อ') + 'ใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      }
      /* ถูก abort จาก attAbortAll() = Attempt ถูกยกเลิก → เงียบ ไม่ขึ้น Error UI */
      if (e && (e.name === 'AbortError')) throw AbortAttendanceError();
      throw new Error((label || 'การเชื่อมต่อ') + 'ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    });
  }

  /* [Error Monitoring] ส่งต่อไปยัง Central Monitor ที่มีอยู่แล้ว (NJHR.errReport)
     ห้ามสร้าง Monitor ตัวใหม่ · ห้ามเปลี่ยน Logic/Flow · ห้ามเพิ่ม delay หรือ retry
     AbortAttendanceError = การยกเลิกตาม Flow ปกติ → ไม่ใช่ Error ห้ามรายงาน */
  function njfReport(kind, source, err, extra) {
    try {
      if (isAborted(err)) return;
      if (w.NJHR && typeof w.NJHR.errReport === 'function') {
        w.NJHR.errReport(kind, source, err, extra);
      }
    } catch (e) {}
  }
  /* กัน double-report: mark error ที่รายงานไปแล้วตอน non-2xx
     เพื่อไม่ให้ .catch ชั้นนอก (transport handler) รายงานซ้ำอีกครั้ง */
  function njfMark(e) { try { e.njfReported = 1; } catch (x) {} return e; }
  function njfDone(e) { return !!(e && e.njfReported); }

  function rpc(fn, body) {
    var c = sb();
    return fetchT(c.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': c.key, 'Authorization': 'Bearer ' + c.key,
                 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body || {})
    }, 'เชื่อมต่อเซิร์ฟเวอร์').then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (!r.ok) {
          var msg = (j && (j.message || j.error)) || ('เรียก ' + fn + ' ไม่สำเร็จ');
          njfReport('RPC_FAIL', fn, { message: msg },
                    'status=' + r.status + ((j && j.code) ? (' code=' + j.code) : ''));
          throw njfMark(new Error(msg));          // ข้อความเดิมทุกประการ
        }
        return Array.isArray(j) ? j[0] : j;
      });
    })['catch'](function (e) {
      /* transport: network fail / timeout (fetchT แปลงเป็นข้อความเดิมแล้ว)
         ไม่รายงานซ้ำถ้า non-2xx รายงานไปแล้ว · ไม่รายงานการยกเลิกตาม Flow */
      if (!njfDone(e)) njfReport('RPC_FAIL', fn, e, 'transport');
      throw e;                                     // rethrow ตัวเดิม ไม่เปลี่ยน UI/ข้อความ
    });
  }

  /* Face Attendance บนมือถือจำเป็นต้องเห็นจำนวนแถวจริงจาก njhr_face_status
     ห้ามใช้ rpc() ด้านบน เพราะ helper กลางนั้นคืนแถวแรกเพื่อคงพฤติกรรมเดิมของโมดูลอื่น */
  function rpcRows(fn, body) {
    var c = sb();
    return fetchT(c.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': c.key, 'Authorization': 'Bearer ' + c.key,
                 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body || {})
    }, 'เชื่อมต่อเซิร์ฟเวอร์').then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (!r.ok) {
          var msg = (j && (j.message || j.error)) || ('เรียก ' + fn + ' ไม่สำเร็จ');
          njfReport('RPC_FAIL', fn, { message: msg },
                    'status=' + r.status + ((j && j.code) ? (' code=' + j.code) : ''));
          throw njfMark(new Error(msg));
        }
        if (j == null) return [];
        return Array.isArray(j) ? j : [j];
      });
    })['catch'](function (e) {
      if (!njfDone(e)) njfReport('RPC_FAIL', fn, e, 'transport');
      throw e;
    });
  }

  /* employee_id ต้องมาจาก Session ปัจจุบันที่ runtime ตรวจจาก server แล้วเท่านั้น
     ไม่อ่านจากฟอร์ม/URL และไม่เดาแถวแรกจากรายการของ HR/SUPER_ADMIN */
  function currentSessionEmployeeId() {
    var u = null;
    try {
      if (w.NJHR && w.NJHR.auth && typeof w.NJHR.auth.currentUser === 'function') {
        u = w.NJHR.auth.currentUser();
      }
    } catch (e) { u = null; }
    var id = u && (u.empId || (u.sb && u.sb.employee_id));
    return id ? String(id) : '';
  }

  /* ---------- Face Status Cache (ตัดออกจาก Critical Path ตอนกดลงเวลา) ----------
     ผูกกับ token + employee_id ของ Session ปัจจุบัน — เปลี่ยนอย่างใดอย่างหนึ่ง = Cache ใช้ไม่ได้
     Invalidate เมื่อ: Logout / Session เปลี่ยน / ลงทะเบียนใบหน้าใหม่ (faceStatusReset)
     เก็บเฉพาะ "เคยลงทะเบียนแล้วหรือยัง" ซึ่งใช้เลือกเส้นทาง UI เท่านั้น
     การตรวจใบหน้าจริงยังทำที่เซิร์ฟเวอร์ใน njhr_att_punch_face ทุกครั้งเหมือนเดิม */
  var FS = { key: '', val: null, loading: null };

  function faceStatusKey(empId) { return String(token() || '') + '|' + String(empId || ''); }

  function faceStatusReset() { FS = { key: '', val: null, loading: null }; }

  /* อ่านสถานะใบหน้าของ Session ปัจจุบัน — ใช้ employee_id จาก Session เท่านั้น
     ทั้ง Desktop / Android / iOS / iPad เส้นทางเดียวกันหมด ไม่มี p_employee:null
     และไม่เดาแถวแรกจากผลลัพธ์หลายแถวของ HR/SUPER_ADMIN อีกต่อไป */
  function faceStatusFetch() {
    var empId = currentSessionEmployeeId();
    if (!empId) return Promise.reject(new Error('ไม่พบข้อมูลพนักงานของ Session ปัจจุบัน กรุณาเข้าสู่ระบบใหม่'));
    return rpcRows('njhr_face_status', { p_token: token(), p_employee: empId, p_q: null })
      .then(function (rows) {
        if (rows.length !== 1) {
          throw new Error('Face Status ของ Session ปัจจุบันไม่ถูกต้อง (' + rows.length + ' แถว)');
        }
        var row = rows[0] || {};
        if (String(row.employee_id || '') !== empId) {
          throw new Error('Face Status ไม่ตรงกับพนักงานของ Session ปัจจุบัน');
        }
        if (row.enrolled && !row.is_active) {
          throw new Error('ข้อมูลใบหน้าของคุณถูกปิดใช้งาน กรุณาติดต่อฝ่ายบุคคล');
        }
        return !!row.enrolled;
      });
  }

  /* คืน Promise<boolean> — ถ้ามี Cache ที่ตรง key แล้ว "ไม่ยิง RPC ซ้ำ" */
  function faceStatus() {
    var k = faceStatusKey(currentSessionEmployeeId());
    if (FS.key === k && FS.val !== null) return Promise.resolve(FS.val);
    if (FS.key === k && FS.loading) return FS.loading;
    FS = { key: k, val: null, loading: null };
    FS.loading = faceStatusFetch().then(function (v) {
      if (FS.key === k) { FS.val = v; FS.loading = null; }
      return v;
    }, function (e) {
      if (FS.key === k) FS.loading = null;    // ไม่จำค่าเมื่อผิดพลาด → กดใหม่ถามซ้ำได้
      throw e;
    });
    return FS.loading;
  }

  /* Preload จากหน้า Attendance หลังรู้ว่า attendance_required = true
     ล้มเหลวเงียบ — ตอนกดลงเวลาจะ fallback ไปถามเซิร์ฟเวอร์ตามเส้นทางเดิม */
  function faceStatusPreload() { return faceStatus()['catch'](function () {}); }


  function attendanceStatusError(e) {
    var msg = (e && e.message) || 'ตรวจสถานะใบหน้าไม่สำเร็จ กรุณาลองใหม่';
    try { console.error('[FACE ATTENDANCE STATUS]', e); } catch (e2) {}
    try {
      if (w.NJHR && w.NJHR.ui && typeof w.NJHR.ui.toast === 'function') {
        w.NJHR.ui.toast(msg, 'error');
        return;
      }
    } catch (e3) {}
    try { w.alert(msg); } catch (e4) {}
  }
  function fn(action, body) {
    var c = sb();
    return fetchT(c.url + '/functions/v1/njhr-face-file', {
      method: 'POST',
      headers: { 'apikey': c.key, 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: token(), action: action }, body || {}))
    }, 'ขอที่อยู่สำหรับอัปโหลดรูป').then(function (r) {
      return r.text().then(function (t) {
        var j = {};
        try { j = t ? JSON.parse(t) : {}; } catch (e) { j = {}; }
        if (!r.ok) {
          njfReport('EDGE_FAIL', 'njhr-face-file/' + action,
                    { message: 'HTTP ' + r.status + ' ' + (j.error || '') });
          throw njfMark(new Error(j.error || 'เข้าถึงรูปไม่สำเร็จ'));
        }
        /* [Invalid Response] HTTP 200 แต่ JSON ผิดสัญญา = ถือเป็น EDGE_FAIL
           รายงานเฉพาะ "ชื่อ field ที่ขาด" ห้าม log Response Body ดิบ */
        var miss = '';
        if (action === 'upload-url' && (!j.upload_url || !j.path)) {
          miss = (!j.upload_url ? 'upload_url ' : '') + (!j.path ? 'path' : '');
        } else if (action === 'view-url' && !j.url) {
          miss = 'url';
        } else if (!t) {
          miss = 'empty-body';
        }
        if (miss) {
          njfReport('EDGE_FAIL', 'njhr-face-file/' + action,
                    { message: 'invalid response: missing ' + miss.trim() });
          throw njfMark(new Error('เข้าถึงรูปไม่สำเร็จ'));   // ข้อความเดิมของ Flow
        }
        return j;
      });
    })['catch'](function (e) {
      if (!njfDone(e)) njfReport('EDGE_FAIL', 'njhr-face-file/' + action, e, 'transport');
      throw e;
    });
  }
  function deviceInfo() {
    var ua = navigator.userAgent || '';
    var browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome'
      : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Other';
    var os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : 'Other';
    var device = /Mobi|Android|iPhone/.test(ua) ? 'Mobile' : 'Desktop';
    return { device: device, browser: browser, os: os, user_agent: ua.slice(0, 300) };
  }

  /* ---------- โหลด CSS + face-api เฉพาะตอนใช้งาน ---------- */
  function addCss() {
    if (S.cssAdded) return;
    /* ใช้ตัวโหลดกลางชุดเดียวกับ app.js (Promise cache · timeout · ลองใหม่ได้)
       face.js เป็นโมดูลแยก จึงเรียกผ่าน window ที่ app.js เปิดไว้
       Build Version มาจาก window.NJHR_BUILD_VERSION แหล่งเดียว ไม่ hardcode */
    if (typeof w.NJHR_loadStyleOnce !== 'function') {
      try { console.error('ไม่พบตัวโหลด CSS กลาง — face.css ไม่ถูกโหลด'); } catch (e) {}
      return;
    }
    var href = (typeof w.NJHR_asset === 'function') ? w.NJHR_asset('face.css') : 'face.css';
    S.cssAdded = true;
    w.NJHR_loadStyleOnce('face-css', href)['catch'](function (e) {
      S.cssAdded = false;                    // ให้เปิดหน้าสแกนใหม่แล้วลองโหลดอีกครั้งได้
      try { console.error((e && e.message) || 'โหลด face.css ไม่สำเร็จ'); } catch (e2) {}
    });
  }
  function faceScript(src) {
    var node = null;
    var p = new Promise(function (res, rej) {
      if (w.faceapi) return res();
      var s = d.createElement('script');
      node = s;
      s.src = src; s.async = true;
      s.onload = res;
      s.onerror = function () {
        try { s.remove(); } catch (e) {}
        rej(faceErr('FACE_LIB_LOAD_FAILED', 'โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ ตรวจอินเทอร์เน็ต'));
      };
      d.head.appendChild(s);
    });
    /* [TIMEOUT] แหล่งนี้ค้าง = ถอด <script> ทิ้งแล้วปล่อยให้ผู้เรียกไป Fallback แหล่งถัดไป */
    return withTimeout(p, LIB_TIMEOUT_MS, 'FACE_LIB_TIMEOUT',
      'โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ (หมดเวลารอ)',
      function () { try { if (node) node.remove(); } catch (e) {} });
  }
  /* ---------- [PERF] Instrumentation (ปิดเป็นค่าเริ่มต้น) ----------
     เปิดด้วย  localStorage.setItem('njhr_face_perf','1')  หรือ  window.NJHR_FACE_PERF = true
     ปิดอยู่ = ทุกฟังก์ชันคืนทันที ไม่มี Object ใหม่ ไม่มี log ไม่กระทบ Production UX

     ⚠ ห้ามเก็บ: Descriptor · รูปใบหน้า · Token · Password · GPS · ข้อมูลระบุตัวบุคคล
        เก็บเฉพาะชื่อขั้นตอนกับตัวเลขเวลา (ms) และจำนวนครั้งเท่านั้น */
  /* [PERF] เพดานของเส้นทาง Liveness ก้ำกึ่ง
     BORDER_MIN = จำนวนเฟรมรวมขั้นต่ำก่อนเริ่มประเมิน (เท่ากับหน้าต่างเดิม grabFrames(8))
     BORDER_MAX = เพดานรวม (เท่ากับกรณีแย่สุดเดิม 6 + 8 = 14) */
  var BORDER_MIN = 8, BORDER_MAX = 14;

  /* [INSTRUMENTATION] boot = ตัวชี้วัดที่เกิด "ก่อน" perfStart() เช่น Model Warmup / GPS First Fix
     เก็บแยกจาก Flow แล้วรวมตอน perfEnd()/Export — ไม่งั้น Cold Load จะหายไปทุกครั้ง
     ⚠ เก็บเฉพาะตัวเลขเวลา/จำนวนครั้ง ไม่มี Token · lat/lng · Descriptor · รูป · Signed URL · Device ID */
  var PERF = { on: null, t: null, boot: { marks: {}, counters: {} },
               /* [FIX 3] true = มี Model Load ที่ยังไม่ถูก Flow ใดรับไปเป็นของตัวเอง
                  Flow แรกหลังโหลดโมเดลจริงจะ "กิน" ค่านี้ไป → cold
                  Flow ถัดไปที่ใช้โมเดลเดิมจะไม่ได้รับค่าอีก → warm */
               modelPending: false,
               /* [E2E] เวลาที่ผู้ใช้กดปุ่มลงเวลา · pressFirst = รอบนี้มีการลงทะเบียนใบหน้าครั้งแรกด้วย */
               press: null, pressEpoch: null, pressFirst: false };
  /* คีย์เวลาโหลดโมเดล — ต้อง consume ครั้งเดียวเท่านั้น ห้ามคัดลอกเข้าทุก Flow */
  var PERF_MODEL_KEYS = ['guide_model_load_ms', 'recognition_model_load_ms'];
  /* ตัวชี้วัดที่มีความหมายเฉพาะ Flow ลงเวลา (นับจากตอนกดปุ่ม) */
  var PERF_PRESS_KEYS = ['exempt_wait_ms', 'face_status_wait_ms', 'button_to_camera_ms'];
  function perfOn() {
    if (PERF.on !== null) return PERF.on;
    var v = false;
    try { v = (w.NJHR_FACE_PERF === true) || localStorage.getItem('njhr_face_perf') === '1'; } catch (e) {}
    PERF.on = !!v;
    return PERF.on;
  }
  function perfNow() {
    try { return (w.performance && w.performance.now) ? w.performance.now() : Date.now(); }
    catch (e) { return Date.now(); }
  }
  /* เริ่มจับเวลา Flow ใหม่ — flow = 'ENROLL' | 'ATTENDANCE' | 'LOGIN' */
  function perfStart(flow) {
    if (!perfOn()) return;
    var ua = '';
    try { ua = String(navigator.userAgent || ''); } catch (e) {}
    PERF.t = {
      flow: flow,
      platform: /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : 'Other',
      t0: perfNow(),
      marks: {},
      desc: [],
      /* [DESCRIPTOR] model_cache_hit = โมเดลอยู่ในหน่วยความจำแล้วตั้งแต่ก่อนเริ่ม Flow นี้
         (วัดจากสถานะจริงของ S.guideReady/S.recogReady ไม่ใช่การเดา) */
      counters: { descriptor_calls: 0, guide_calls: 0, retry_count: 0,
                  model_cache_hit: !!(S.guideReady && S.recogReady) }
    };
    var env = perfRuntimeEnv();
    PERF.t.counters.tf_backend = env.tf_backend;          // อ่านครั้งแรก (อาจยังเป็น unknown)
    PERF.t.counters.webgl_available = env.webgl_available;
    perfLongTaskStart();     // เผื่อยังไม่ได้เริ่มตอน Boot
    LT.bootOpen = false;     // ปิดถัง Boot/Warmup — ต่อจากนี้เป็นของ Flow
    perfLongTaskReset();
    swModelBind();           // ผูก listener เท่านั้น — ห้าม reset สัญญาณที่ได้มาแล้ว
    /* [E2E] ผูก Flow นี้กับเวลาที่ผู้ใช้กดปุ่มจริง — เฉพาะ Flow ลงเวลาเท่านั้น
       Face Login และ Manual Enrollment ไม่ได้เริ่มจากปุ่มลงเวลา
       ถ้าปล่อยให้หยิบไปใช้ ตัวเลข button_to_* จะรั่วข้าม Flow และอ่านผิดทั้งชุด */
    PERF.t.usePress = String(flow || '').indexOf('ATTENDANCE') === 0;
    if (PERF.t.usePress && PERF.press != null) {
      PERF.t.marks.button_to_flow_ms = Math.round((PERF.t.t0 - PERF.press) * 10) / 10;
    }
  }
  /* บันทึกช่วงเวลา — perfMark('camera_start_ms', tStart) */
  function perfMark(key, from) {
    if (!perfOn() || !PERF.t) return;
    var n = perfNow();
    PERF.t.marks[key] = Math.round((n - (typeof from === 'number' ? from : PERF.t.t0)) * 10) / 10;
  }
  /* สะสมเวลารวมของขั้นตอนที่เกิดหลายครั้งต่อ Flow (เช่น Descriptor / Liveness) */
  function perfAdd(key, ms) {
    if (!perfOn() || !PERF.t) return;
    PERF.t.marks[key] = Math.round(((PERF.t.marks[key] || 0) + ms) * 10) / 10;
  }
  function perfDevice() {
    var ua = '';
    try { ua = String(navigator.userAgent || ''); } catch (e) {}
    var os = /Android/i.test(ua) ? 'Android'
           : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
           : /Windows/i.test(ua) ? 'Windows'
           : /Mac OS X/i.test(ua) ? 'macOS'
           : /Linux/i.test(ua) ? 'Linux' : 'Other';
    var br = /Edg\//.test(ua) ? 'Edge'
           : /CriOS|Chrome\//.test(ua) ? 'Chrome'
           : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
           : /Safari\//.test(ua) ? 'Safari' : 'Other';
    var m = /\((?:Linux; )?([^;)]{0,40})/.exec(ua);
    var standalone = false;
    try {
      standalone = !!(navigator.standalone ||
        (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches));
    } catch (e) {}
    var net = '';
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c && c.effectiveType) net = String(c.effectiveType);
    } catch (e) {}
    return { os: os, browser: br, device: (m && m[1]) ? m[1].trim().slice(0, 40) : 'unknown',
             mode: standalone ? 'PWA/standalone' : 'browser', network: net };
  }
  function perfSet(key, v) {
    if (!perfOn() || !PERF.t) return;
    PERF.t.counters[key] = v;
  }
  /* บันทึกช่วงเวลาที่อาจเกิดนอก Flow — ลง boot เสมอ และลง Flow ปัจจุบันด้วยถ้ามี */
  function perfDur(key, from) {
    if (!perfOn()) return;
    var ms = Math.round((perfNow() - from) * 10) / 10;
    PERF.boot.marks[key] = ms;
    if (PERF.t) PERF.t.marks[key] = ms;
    /* [FIX 3] มีการโหลดโมเดลจริงเกิดขึ้น = ยังไม่มี Flow ใดรับไปเป็นของตัวเอง */
    if (PERF_MODEL_KEYS.indexOf(key) >= 0) PERF.modelPending = true;
  }
  /* ค่าคงที่ระดับ Session ที่เกิดนอก Flow ได้ (เช่น gps_first_fix_ms จาก Warmup) */
  function perfBootSet(key, v) {
    if (!perfOn()) return;
    PERF.boot.marks[key] = v;
  }
  /* ตัวนับระดับ Session — นับจากเหตุการณ์จริงเท่านั้น */
  function perfBootCount(key, n) {
    if (!perfOn()) return;
    var c = PERF.boot.counters;
    c[key] = (c[key] || 0) + (typeof n === 'number' ? n : 1);
  }
  /* [DESCRIPTOR] เก็บเวลาต่อรอบเพื่อหาคอขวดจริง — ยังคง Descriptor จริง 6 รอบเท่าเดิม
     ไม่ Clone · ไม่ Reuse · ไม่ลดจำนวน — เพิ่มเฉพาะการวัด */
  function perfDescSample(ms) {
    if (!perfOn() || !PERF.t) return;
    var v = Math.round(ms * 10) / 10;
    PERF.t.marks.descriptor_ms = Math.round(((PERF.t.marks.descriptor_ms || 0) + v) * 10) / 10;
    if (!PERF.t.desc) PERF.t.desc = [];
    PERF.t.desc.push(v);
    if (PERF.t.marks.first_descriptor_ms == null) PERF.t.marks.first_descriptor_ms = v;
  }
  /* สรุปค่ารายรอบตอนปิด Flow */
  function perfDescSummary(t) {
    var a = t.desc;
    if (!a || !a.length) return;
    var sorted = a.slice().sort(function (x, y) { return x - y; });
    t.marks.descriptor_p50_ms = sorted[Math.floor((sorted.length - 1) / 2)];
    t.marks.descriptor_max_ms = sorted[sorted.length - 1];
    t.counters.descriptor_samples = a.length;
  }
  /* [MODEL CACHE] แหล่งที่โมเดลถูกโหลดมาจริงในรอบนี้
       memory          = อยู่ในหน่วยความจำแล้ว ไม่ต้องโหลดซ้ำ
       service_worker  = Service Worker ตอบจากแคช
       network         = โหลดจากเครือข่ายจริง
       unknown         = อ่านไม่ได้ (เบราว์เซอร์ไม่รองรับ Resource Timing) */
  /* Service Worker เป็นผู้เดียวที่รู้แน่ชัดว่าไฟล์โมเดลมาจาก Cache หรือ Network
     จึงใช้สัญญาณจริงที่ SW ส่งมา (MODEL_CACHE_HIT / MODEL_NETWORK)
     ⚠ ห้ามอนุมานจาก workerStart/transferSize เพียงอย่างเดียว — รายงานไม่ตรงกันข้ามเบราว์เซอร์ */
  /* gen        = รอบการโหลดโมเดลปัจจุบัน (เพิ่มเมื่อเริ่มโหลดจริง)
     consumedGen = รอบที่ถูก Flow ใดรับผลไปแล้ว — ห้ามนับซ้ำให้ Flow ถัดไป
     ⚠ ห้าม reset สัญญาณตอน perfStart ถ้าโมเดลโหลดไปแล้ว
        เพราะการโหลดเกิดตอน warmup ซึ่งเกิด "ก่อน" perfStart เสมอ */
  var SWMS = { hit: 0, net: 0, bound: false, gen: 0, consumedGen: -1 };
  function swModelBind() {
    if (SWMS.bound) return;
    SWMS.bound = true;
    try {
      if (!navigator.serviceWorker || !navigator.serviceWorker.addEventListener) return;
      navigator.serviceWorker.addEventListener('message', function (ev) {
        var d2 = ev && ev.data;
        if (!d2 || !d2.njhrModelSource) return;
        if (d2.njhrModelSource === 'MODEL_CACHE_HIT') SWMS.hit++;
        else if (d2.njhrModelSource === 'MODEL_NETWORK') SWMS.net++;
      });
    } catch (e) {}
  }
  /* เริ่มรอบการโหลดโมเดลใหม่ — เรียกจาก guideLoad/recogLoad ตอนที่จะโหลดจริงเท่านั้น */
  function swModelBeginLoad() {
    SWMS.gen++;
    SWMS.hit = 0; SWMS.net = 0;
  }
  /* ผลของรอบนี้ถูก Flow ใดรับไปแล้วหรือยัง */
  function swModelPending() { return SWMS.gen > SWMS.consumedGen; }
  function swModelConsume() { SWMS.consumedGen = SWMS.gen; }

  function perfModelCacheSource() {
    /* โมเดลอยู่ในหน่วยความจำแล้วและไม่มีรอบโหลดที่ยังไม่ถูกรับผล */
    if (S.guideReady && S.recogReady && !PERF.modelPending && !swModelPending()) return 'memory';
    if (!swModelPending()) return 'memory';        // รอบนี้ไม่ได้โหลดไฟล์ใหม่เลย
    if (SWMS.net > 0) return 'network';            // มีอย่างน้อย 1 ไฟล์ที่ต้องโหลดจริง
    if (SWMS.hit > 0) return 'service_worker';
    return 'unknown';                              // ไม่มี SW / ไม่ได้รับสัญญาณ
  }

  /* [LONG TASK] งานที่บล็อก Main Thread เกิน 50 ms — ใช้ชี้ jank จริงบน Android
     ไม่เก็บชื่อสคริปต์หรือ URL ใด ๆ เก็บเฉพาะจำนวนครั้งและระยะเวลา */
  /* [BOOT JANK] ต้องเริ่ม Observer "ก่อน" NJHRFace.warmup()
     jank ก้อนใหญ่ที่สุดบน Android เกิดตอนสร้าง Model Graph ระหว่าง warmup
     ถ้าเริ่ม Observer ตอน perfStart (หลังกดปุ่ม) จะพลาดช่วงนั้นทั้งหมด
       bootOpen = true  → สะสมเข้าถัง Boot/Warmup
       perfStart()      → ปิดถัง Boot แล้วเริ่มนับของ Flow แยกต่างหาก
     ⚠ ไม่รองรับ longtask (Safari/iOS) = Export null ไม่ใช่ 0 */
  var LT = { obs: null, count: 0, total: 0, max: 0, supported: null,
             bootOpen: true, bootCount: 0, bootTotal: 0, bootMax: 0 };
  function perfLongTaskStart() {
    if (LT.obs || !perfOn()) return;
    try {
      if (typeof w.PerformanceObserver !== 'function') { LT.supported = false; return; }
      var sup = w.PerformanceObserver.supportedEntryTypes;
      if (sup && sup.indexOf && sup.indexOf('longtask') < 0) { LT.supported = false; return; }
      LT.obs = new w.PerformanceObserver(function (list) {
        var es = list.getEntries();
        for (var i = 0; i < es.length; i++) {
          var dms = Math.round(es[i].duration * 10) / 10;
          if (LT.bootOpen) {
            LT.bootCount++;
            LT.bootTotal = Math.round((LT.bootTotal + dms) * 10) / 10;
            if (dms > LT.bootMax) LT.bootMax = dms;
          }
          LT.count++; LT.total = Math.round((LT.total + dms) * 10) / 10;
          if (dms > LT.max) LT.max = dms;
        }
      });
      LT.obs.observe({ entryTypes: ['longtask'] });
      LT.supported = true;
    } catch (e) { LT.obs = null; LT.supported = false; }
  }
  function perfLongTaskReset() { LT.count = 0; LT.total = 0; LT.max = 0; }
  function perfLongTaskBootReset() {
    LT.bootOpen = true; LT.bootCount = 0; LT.bootTotal = 0; LT.bootMax = 0;
  }

  /* สภาพแวดล้อมการประมวลผล — ใช้ชี้คอขวดฝั่งเครื่อง ไม่มีข้อมูลอ่อนไหว */
  function perfRuntimeEnv() {
    var backend = '';
    try {
      var f = w.faceapi;
      if (f && f.tf && typeof f.tf.getBackend === 'function') backend = String(f.tf.getBackend() || '');
    } catch (e) { backend = ''; }
    var webgl = null;
    try {
      var c = d.createElement('canvas');
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl') ||
                 c.getContext('experimental-webgl'));
    } catch (e) { webgl = null; }
    return { tf_backend: backend || 'unknown', webgl_available: webgl };
  }

  /* คงค่า tf_backend/webgl_available ไว้ใน counters ของ Flow (ตั้งไว้แล้วที่ perfStart) */
  function env2Backend(t) { return !!(t && t.counters); }

  function perfBootReset() {
    PERF.boot = { marks: {}, counters: {} };
    PERF.modelPending = false;
    PERF.press = null;
    PERF.pressEpoch = null;
    PERF.pressFirst = false;
  }
  /* [E2E] เริ่มจับเวลาตั้งแต่ "ผู้ใช้กดปุ่มลงเวลา" — ก่อน njExemptCheck / faceStatus / perfStart
     เก็บนอก PERF.t เพราะ Flow ยังไม่ถูกเปิดในจังหวะนั้น */
  function perfPressStart(epochMs) {
    if (!perfOn()) return;
    /* [E2E] หน้าลงเวลาอาจกดปุ่มก่อน face.js โหลดเสร็จ จึงรับ Date.now() ของตอนกดมาปรับฐานได้
       แปลงกลับเป็นหน่วยเดียวกับ perfNow() เพื่อให้ทุก mark อยู่บนแกนเวลาเดียวกัน */
    var ep = (typeof epochMs === 'number' && isFinite(epochMs) && epochMs > 0) ? epochMs : Date.now();
    var back = Math.max(0, Date.now() - ep);
    PERF.press = perfNow() - back;
    PERF.pressEpoch = ep;                    // ฐานเวลาแบบ epoch สำหรับ replay mark ย้อนหลัง
    PERF.pressFirst = false;
  }
  /* บันทึกช่วงเวลาที่นับจากตอนกดปุ่ม ลง boot (อยู่รอดข้าม perfStart)
     [FIX] eventEpochMs = เวลาที่ "เหตุการณ์เกิดจริง" ไม่ใช่เวลาที่ replay
     จำเป็นเมื่อ mark เกิดก่อน face.js โหลดเสร็จ แล้วถูกส่งตามมาทีหลัง
     ไม่งั้น exempt_wait_ms จะกลืนเวลาโหลดโมดูลเข้าไปด้วย */
  function perfPressMark(key, eventEpochMs) {
    if (!perfOn() || PERF.press == null) return;
    var ms;
    if (typeof eventEpochMs === 'number' && isFinite(eventEpochMs) && eventEpochMs > 0 &&
        PERF.pressEpoch != null) {
      ms = eventEpochMs - PERF.pressEpoch;
    } else {
      ms = perfNow() - PERF.press;
    }
    if (!(ms >= 0)) ms = 0;
    PERF.boot.marks[key] = Math.round(ms * 10) / 10;
  }
  function perfPressFlagFirst() { if (perfOn()) PERF.pressFirst = true; }
  /* [PRESS] จบรอบการกดปุ่มลงเวลา — ล้างฐานเวลาทั้งชุด
     ห้ามเรียกระหว่าง Enrollment→Punch handoff เพราะยังเป็นการกดครั้งเดียวกัน */
  function perfPressReset() {
    PERF.press = null;
    PERF.pressEpoch = null;
    PERF.pressFirst = false;
    delete PERF.boot.marks.exempt_wait_ms;
    delete PERF.boot.marks.face_status_wait_ms;
    delete PERF.boot.marks.button_to_camera_ms;
  }
  /* [FIX 1] เขียนค่ามิลลิวินาทีลง PERF.t.marks โดยตรง
     ใช้กับค่าที่ "รู้ผลแล้ว" เช่น gps_gate_wait_ms = 0 ตอน Warm
     ⚠ ห้ามใช้ perfSet เพราะ perfSet เขียนลง counters ไม่ใช่ marks
        ทำให้ timings_ms.gps_gate_wait_ms ออกมาเป็น null ตอน Export */
  function perfMs(key, ms) {
    if (!perfOn() || !PERF.t) return;
    var v = Number(ms);
    if (!isFinite(v)) return;
    PERF.t.marks[key] = Math.round(v * 10) / 10;
  }
  function perfCount(key, n) {
    if (!perfOn() || !PERF.t) return;
    var c = PERF.t.counters;
    c[key] = (c[key] || 0) + (typeof n === 'number' ? n : 1);
  }
  /* ปิด Flow แล้วสรุปครั้งเดียว
     บนมือถือเปิด Console ยาก จึงแสดงผลเป็นแผ่นซ้อนพร้อมปุ่มคัดลอกด้วย
     ทั้งหมดทำงานเฉพาะเมื่อเปิดโหมดวัดผลเท่านั้น — ปิดอยู่ = ไม่มี DOM ใด ๆ ถูกสร้าง */
  /* [FIX 2] Guard กัน perfEnd ซ้ำต่อ Flow — เรียกครั้งที่สองคืน null และไม่บันทึกอะไรเพิ่ม
     (PERF.t = null หลังปิด Flow อยู่แล้ว แต่เขียนให้ชัดเจนเพื่อไม่ให้พึ่ง side effect) */
  function perfEnd(totalKey) {
    if (!perfOn() || !PERF.t || PERF.t.ended) return null;
    var t = PERF.t;
    t.ended = true;
    t.marks[totalKey || 'total_ms'] = Math.round((perfNow() - t.t0) * 10) / 10;
    perfDescSummary(t);
    /* [RUNTIME] อ่าน tf_backend ซ้ำ "หลังโมเดลพร้อมและก่อนปิด Flow"
       ตอน perfStart โมเดลมักยังไม่โหลด faceapi.tf จึงยังอ่านไม่ได้ */
    var env2 = perfRuntimeEnv();
    if (env2.tf_backend && env2.tf_backend !== 'unknown') t.counters.tf_backend = env2.tf_backend;
    if (t.counters.webgl_available == null) t.counters.webgl_available = env2.webgl_available;
    t.counters.model_cache_source = perfModelCacheSource();
    swModelConsume();        // ผลของรอบโหลดนี้ถูกรับไปแล้ว Flow ถัดไปต้องไม่ได้ซ้ำ
    t.counters.long_task_supported = (LT.supported === null ? false : LT.supported);
    if (LT.supported === true) {
      t.counters.long_task_count = LT.count;
      t.marks.long_task_total_ms = LT.total;
      t.marks.long_task_max_ms = LT.max;
      /* jank ที่เกิดก่อนกดปุ่ม (โหลดโมดูล + warmup + สร้าง Model Graph) */
      t.counters.boot_long_task_count = LT.bootCount;
      t.marks.boot_long_task_total_ms = LT.bootTotal;
      t.marks.boot_long_task_max_ms = LT.bootMax;
    }                                     // ไม่รองรับ = ไม่เขียนค่า → Export เป็น null
    /* [E2E] เวลาตั้งแต่ "ผู้ใช้กดปุ่ม" จนได้ผลจริง — รวมทุกอย่างที่เกิดก่อน perfStart */
    if (t.usePress && PERF.press != null) {
      t.marks.button_to_result_ms = Math.round((perfNow() - PERF.press) * 10) / 10;
      if (PERF.pressFirst) t.marks.total_first_attendance_ms = t.marks.button_to_result_ms;
    }
    if (env2Backend(t)) { /* no-op guard เพื่อความชัดเจนของโครงสร้าง */ }
    /* [INSTRUMENTATION] รวม Boot/Warmup metrics เข้ากับ Flow metrics ตอนสรุป
       Flow มีค่าอยู่แล้ว = ใช้ของ Flow (ค่าที่เกิดในรอบนี้จริง) */
    var bk, i;
    for (bk in PERF.boot.marks) {
      if (!Object.prototype.hasOwnProperty.call(PERF.boot.marks, bk)) continue;
      /* [FIX 3] เวลาโหลดโมเดลให้เฉพาะ Flow แรกหลังโหลดจริงเท่านั้น
         Flow ถัดไปที่ใช้โมเดลเดิมต้องไม่ได้รับค่านี้ ไม่งั้นจะถูกนับเป็น cold ผิด ๆ */
      if (PERF_MODEL_KEYS.indexOf(bk) >= 0 && !PERF.modelPending) continue;
      /* ตัวชี้วัดที่นับจากตอนกดปุ่มลงเวลา ห้ามรั่วเข้า LOGIN / ENROLL */
      if (!t.usePress && PERF_PRESS_KEYS.indexOf(bk) >= 0) continue;
      if (t.marks[bk] == null) t.marks[bk] = PERF.boot.marks[bk];
    }
    /* Flow นี้รับเวลาโหลดโมเดลไปแล้ว → ปลดธง และลบออกจาก boot ไม่ให้รั่วไปรอบหน้า */
    if (PERF.modelPending) {
      PERF.modelPending = false;
      for (i = 0; i < PERF_MODEL_KEYS.length; i++) delete PERF.boot.marks[PERF_MODEL_KEYS[i]];
    }
    for (bk in PERF.boot.counters) {
      if (Object.prototype.hasOwnProperty.call(PERF.boot.counters, bk) && t.counters[bk] == null) {
        t.counters[bk] = PERF.boot.counters[bk];
      }
    }
    var out = { flow: t.flow, platform: t.platform, ms: t.marks, count: t.counters };
    try { console.log('[FACE PERF] ' + t.flow + ' · ' + t.platform, out); } catch (e) {}
    try { perfPush(out); perfPanel(); } catch (e) {}
    PERF.t = null;
    return out;
  }

  /* ---------- เก็บผลทดสอบข้ามการปิด/เปิดแอป ----------
     Cold Start ต้องปิดแอปทิ้งจริง ผลจึงต้องอยู่รอดข้าม Session
     บันทึกลง localStorage เฉพาะตอนเปิดโหมดวัดเท่านั้น เก็บได้สูงสุด 40 รายการ
     ⚠ เก็บเฉพาะ ชื่อขั้นตอน · ตัวเลขเวลา · จำนวนครั้ง · รุ่นเครื่อง/เบราว์เซอร์
        ไม่มี Descriptor · ไม่มีรูป · ไม่มี Token · ไม่มีรหัสผ่าน · ไม่มีพิกัด GPS */
  var PERF_KEY = 'njhr_face_perf_log';
  function perfLoad() {
    if (PERF.log) return PERF.log;
    try { PERF.log = JSON.parse(localStorage.getItem(PERF_KEY)) || []; } catch (e) { PERF.log = []; }
    if (!Array.isArray(PERF.log)) PERF.log = [];
    return PERF.log;
  }
  function perfPush(out) {
    var log = perfLoad();
    var dev = perfDevice();
    /* cold = รอบนี้มีการโหลดโมเดลจริง (Warm จะไม่มีค่าเหล่านี้เลย) */
    var cold = (out.ms.recognition_model_load_ms != null) || (out.ms.guide_model_load_ms != null);
    log.push({
      flow: out.flow, cold: cold, at: new Date().toISOString(),
      os: dev.os, browser: dev.browser, device: dev.device, mode: dev.mode, network: dev.network,
      ms: out.ms, count: out.count
    });
    while (log.length > 40) log.shift();
    PERF.log = log;
    try { localStorage.setItem(PERF_KEY, JSON.stringify(log)); } catch (e) {}
  }
  /* สร้างผลสรุปตาม Schema ที่กำหนด — ใช้รอบล่าสุดของแต่ละประเภท */
  /* ---------- [EXPORT] REAL-DEVICE-FACE-RESULT — Schema เดียวกับไฟล์ Template ----------
     กรอกเฉพาะค่าที่ "วัดได้จริง" จากเครื่องนี้ · ที่เหลือคง null ให้ผู้ทดสอบกรอกเอง
     status = PENDING_REAL_DEVICE เสมอ · ห้ามตั้ง COMPLETE/PASS อัตโนมัติ
     ⚠ ไม่มี Token · lat/lng · Descriptor · รูป · Signed URL · รหัสผ่าน · Device ID */
  function perfNum(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }

  /* รวมตัวชี้วัดของ Flow ล่าสุดที่เกี่ยวข้อง + Boot/Warmup metrics */
  function perfMerged() {
    var log = perfLoad();
    function last(flow) {
      for (var i = log.length - 1; i >= 0; i--) {
        if (log[i].flow === flow) return log[i];
      }
      return null;
    }
    function lastAny(prefix) {
      for (var i = log.length - 1; i >= 0; i--) {
        if (String(log[i].flow || '').indexOf(prefix) === 0) return log[i];
      }
      return null;
    }
    var att = lastAny('ATTENDANCE'), enr = last('ENROLL');
    var ms = {}, ct = {}, k;
    for (k in PERF.boot.marks) {
      if (Object.prototype.hasOwnProperty.call(PERF.boot.marks, k)) ms[k] = PERF.boot.marks[k];
    }
    for (k in PERF.boot.counters) {
      if (Object.prototype.hasOwnProperty.call(PERF.boot.counters, k)) ct[k] = PERF.boot.counters[k];
    }
    [enr, att].forEach(function (e) {
      if (!e) return;
      for (var a in e.ms) { if (Object.prototype.hasOwnProperty.call(e.ms, a)) ms[a] = e.ms[a]; }
      for (var b in e.count) { if (Object.prototype.hasOwnProperty.call(e.count, b)) ct[b] = e.count[b]; }
    });
    return { ms: ms, ct: ct, att: att, enr: enr };
  }

  function perfExportTemplate() {
    var dev = perfDevice();
    var m = perfMerged(), ms = m.ms, ct = m.ct;
    var env = null;
    try { env = camEnv(); } catch (e) { env = null; }
    function box(keys) {
      var o = {}, i;
      for (i = 0; i < keys.length; i++) o[keys[i]] = { result: null, note: null };
      return o;
    }
    return {
      meta: {
        status: 'PENDING_REAL_DEVICE',
        build: String(w.NJHR_BUILD_VERSION || ''),
        package: 'nj-hr-v2-github-lite.zip',
        package_sha256: null,
        platform: dev.os,
        browser: dev.browser,
        os_version: null,
        device_model: dev.device || null,
        mode: dev.mode || null,
        network: dev.network || null,
        tested_at: new Date().toISOString(),
        tested_by: null
      },
      timings_ms: {
        camera_open_ms:            perfNum(ms.camera_open_ms),
        camera_request_ms:         perfNum(ms.camera_request_ms),
        camera_play_ms:            perfNum(ms.camera_play_ms),
        video_ready_ms:            perfNum(ms.video_ready_ms),
        face_detect_first_ms:      perfNum(ms.face_detect_first_ms),
        guide_visible_ms:          perfNum(ms.guide_visible_ms),
        guide_model_load_ms:       perfNum(ms.guide_model_load_ms),
        recognition_model_load_ms: perfNum(ms.recognition_model_load_ms),
        descriptor_ms:             perfNum(ms.descriptor_ms),
        first_descriptor_ms:       perfNum(ms.first_descriptor_ms),
        descriptor_p50_ms:         perfNum(ms.descriptor_p50_ms),
        descriptor_max_ms:         perfNum(ms.descriptor_max_ms),
        gps_first_fix_ms:          perfNum(ms.gps_first_fix_ms),
        gps_usable_fix_ms:         perfNum(ms.gps_usable_fix_ms),
        gps_preflight_ms:          perfNum(ms.gps_preflight_ms),
        gps_gate_wait_ms:          perfNum(ms.gps_gate_wait_ms),
        exempt_wait_ms:            perfNum(ms.exempt_wait_ms),
        face_status_wait_ms:       perfNum(ms.face_status_wait_ms),
        button_to_camera_ms:       perfNum(ms.button_to_camera_ms),
        button_to_result_ms:       perfNum(ms.button_to_result_ms),
        total_first_attendance_ms: perfNum(ms.total_first_attendance_ms),
        face_module_load_ms:       perfNum(ms.face_module_load_ms),
        recognition_wait_ms:       perfNum(ms.recognition_wait_ms),
        recognition_bytes_prefetch_ms: perfNum(ms.recognition_bytes_prefetch_ms),
        grab_frames_ms:            perfNum(ms.grab_frames_ms),
        guide_inference_ms:        perfNum(ms.guide_inference_ms),
        long_task_total_ms:        perfNum(ms.long_task_total_ms),
        long_task_max_ms:          perfNum(ms.long_task_max_ms),
        boot_long_task_total_ms:   perfNum(ms.boot_long_task_total_ms),
        boot_long_task_max_ms:     perfNum(ms.boot_long_task_max_ms),
        route_to_gate_ready_ms:    perfNum(ms.route_to_gate_ready_ms),
        upload_reserve_ms:         perfNum(ms.upload_reserve_ms),
        reserve_wait_after_scan_ms:perfNum(ms.reserve_wait_after_scan_ms),
        snapshot_encode_ms:        perfNum(ms.snapshot_encode_ms),
        snapshot_put_ms:           perfNum(ms.snapshot_put_ms),
        rpc_ms:                    perfNum(ms.rpc_ms),
        total_attendance_ms:       perfNum(ms.total_attendance_ms),
        total_enrollment_ms:       perfNum(ms.total_enrollment_ms)
      },
      counters: {
        descriptor_calls:                  perfNum(ct.descriptor_calls),
        guide_calls:                       perfNum(ct.guide_calls),
        borderline_extra_descriptor_count: perfNum(ct.borderline_extra_descriptor_count),
        descriptor_samples:                perfNum(ct.descriptor_samples),
        camera_open_count:                 perfNum(ct.camera_open_count),
        njhr_face_self_enroll_calls:       perfNum(ct.njhr_face_self_enroll_calls),
        njhr_att_punch_face_calls:         perfNum(ct.njhr_att_punch_face_calls),
        gps_seed_accepted:                 perfNum(ct.gps_seed_accepted),
        njhr_gf_check_calls:               perfNum(ct.njhr_gf_check_calls),
        gf_cache_hits:                     perfNum(ct.gf_cache_hits),
        snapshot_bytes:                    perfNum(ct.snapshot_bytes),
        long_task_count:                   perfNum(ct.long_task_count),
        boot_long_task_count:              perfNum(ct.boot_long_task_count),
        long_task_supported: (ct.long_task_supported == null ? null : ct.long_task_supported)
      },
      video: {
        video_width:        perfNum(ct.video_width),
        video_height:       perfNum(ct.video_height),
        video_ready_state:  perfNum(ct.video_ready_state),
        track_ready_state:  (ct.track_ready_state == null ? null : ct.track_ready_state),
        face_detect_attempts:  perfNum(ct.face_detect_attempts),
        face_frames_collected: perfNum(ct.face_frames_collected),
        failure_stage:      (ct.failure_stage == null ? null : ct.failure_stage)
      },
      runtime: {
        tf_backend:      (ct.tf_backend == null ? null : ct.tf_backend),
        webgl_available: (ct.webgl_available == null ? null : ct.webgl_available),
        model_cache_hit: (ct.model_cache_hit == null ? null : ct.model_cache_hit),
        model_cache_source: (ct.model_cache_source == null ? null : ct.model_cache_source)
      },
      outcome: {
        punch_result:          (ct.punch_result == null ? null : ct.punch_result),
        final_result:          (ct.final_result == null ? null : ct.final_result),
        error_code:            (ct.error_code == null ? null : ct.error_code),
        camera_reopen_skipped: perfNum(ct.camera_reopen_skipped)
      },
      camera_capability: {
        camera_capability_code: (ct.error_code && String(ct.error_code).indexOf('CAM_') === 0)
                                  ? ct.error_code : null,
        secure_context: env ? !!env.secure : null,
        media_api:      env ? !!env.getUserMedia : null,
        embedded:       env ? !!env.embedded : null,
        in_app_browser: env ? !!env.inApp : null
      },
      camera_matrix: box(['1_https_gum_present_opens', '2_insecure_context', '3_media_api_missing',
        '4_not_allowed_error', '5_not_found_error', '6_not_readable_error',
        '7_promise_hang_timeout', '8_route_or_logout_while_waiting']),
      gps_matrix: box(['1_warmup_starts_before_rpc_answers', '2_permission_denied_fails_immediately',
        '3_transient_error_then_fix_at_7s_passes', '4_accuracy_80m_camera_must_not_open',
        '5_accuracy_25m_gf_pass_camera_opens', '6_outside_geofence_camera_must_not_open',
        '7_session_change_old_fix_unusable', '8_gps_ready_before_press_gate_wait_zero']),
      face_matrix: box(['1_guide_frame_adds_no_descriptor_call',
        '2_normal_attendance_6_real_descriptors', '3_borderline_total_8_to_14',
        '4_enrollment_3_poses_18_descriptors', '5_first_attendance_no_second_camera_open',
        '6_face_self_enroll_called_once', '7_att_punch_face_called_once',
        '8_sql_records_time_attempt_snapshot_gps']),
      button_gate_matrix: box(['1_mobile_buttons_disabled_on_load',
        '2_buttons_stay_disabled_while_gf_check_pending',
        '3_buttons_enable_only_after_gf_check_pass',
        '4_in_button_respects_already_checked_in',
        '5_out_button_respects_not_checked_in',
        '6_out_button_respects_already_checked_out',
        '7_buttons_disable_again_on_gps_denied',
        '8_buttons_disable_again_when_outside_geofence']),
      sql_verification: box(['njhr_att_punch_log_row_written', 'njhr_face_attempts_row_written',
        'snapshot_path_kind_punch', 'gps_lat_lng_accuracy_recorded']),
      notes: []
    };
  }

  /* ชื่อไฟล์ตามระบบปฏิบัติการจริงของเครื่องที่ทดสอบ */
  function perfExportName() {
    var os = perfDevice().os;
    if (/Android/i.test(os)) return 'REAL-DEVICE-FACE-RESULT-ANDROID.json';
    if (/iOS/i.test(os))     return 'REAL-DEVICE-FACE-RESULT-IOS.json';
    return 'REAL-DEVICE-FACE-RESULT-OTHER.json';
  }

  function perfExportDownload() {
    var name = perfExportName();
    var blob = new Blob([JSON.stringify(perfExportTemplate(), null, 2) + '\n'],
                        { type: 'application/json' });
    var a = d.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
    return name;
  }

  function perfText(o) {
    var L = [], k;
    for (k in o.ms) if (Object.prototype.hasOwnProperty.call(o.ms, k)) L.push(k + ' = ' + o.ms[k]);
    for (k in o.count) if (Object.prototype.hasOwnProperty.call(o.count, k)) L.push(k + ' = ' + o.count[k]);
    return L.join('\n');
  }
  function perfPanel() {
    var id = 'njf-perf-panel';
    var el = d.getElementById(id);
    if (!el) {
      el = d.createElement('div');
      el.id = id;
      el.setAttribute('style', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483000;' +
        'background:#0B1220;color:#D1E3FF;font:12px/1.55 ui-monospace,Menlo,monospace;' +
        'padding:10px 12px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.45);' +
        'max-height:56vh;overflow:auto;white-space:pre-wrap;');
      d.body.appendChild(el);
    }
    var txt = perfTextAll();
    el.textContent = '';
    var pre = d.createElement('div');
    pre.textContent = txt;
    var bar = d.createElement('div');
    bar.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px');
    function mkBtn(label, bg, on) {
      var b = d.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.setAttribute('style', 'flex:1 1 46%;padding:9px;border:0;border-radius:8px;' +
        'background:' + bg + ';color:#fff;font:600 12px/1 system-ui');
      b.onclick = on;
      return b;
    }
    function note(t) { pre.textContent = txt + '\n\n' + t; }
    /* [FIX 4] ทุกปุ่มที่ผลิต JSON ใช้ perfExportTemplate() เป็นแหล่งเดียว
       ไม่มี Schema ที่สองในระบบอีกต่อไป */
    bar.appendChild(mkBtn('คัดลอกผล', '#1D4ED8', function () {
      var all = JSON.stringify(perfExportTemplate(), null, 2);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(all); note('(คัดลอก JSON แล้ว)'); return;
        }
      } catch (e) {}
      try {
        var ta = d.createElement('textarea');
        ta.value = all; d.body.appendChild(ta); ta.select();
        d.execCommand('copy'); ta.remove(); note('(คัดลอก JSON แล้ว)');
      } catch (e2) { note('(คัดลอกไม่สำเร็จ ใช้ปุ่มดาวน์โหลดแทน)'); }
    }));
    bar.appendChild(mkBtn('Export Test JSON', '#047857', function () {
      try { note('(บันทึก ' + perfExportDownload() + ' แล้ว)'); }
      catch (e) { note('(Export ไม่สำเร็จ ใช้ปุ่มคัดลอกแทน)'); }
    }));
    bar.appendChild(mkBtn('ดาวน์โหลด .json', '#0E7490', function () {
      /* [FIX 4] เดิมสร้าง REAL-DEVICE-FACE-RESULT.json ด้วย Schema เก่า (perfResult)
         ตอนนี้ใช้ตัวเดียวกับปุ่ม Export Test JSON — ชื่อไฟล์ตามระบบ ANDROID/IOS เท่านั้น */
      try { note('(บันทึก ' + perfExportDownload() + ' แล้ว)'); }
      catch (e) { note('(ดาวน์โหลดไม่สำเร็จ ใช้ปุ่มคัดลอกแทน)'); }
    }));
    bar.appendChild(mkBtn('ล้างผล', '#475569', function () {
      PERF.log = [];
      try { localStorage.removeItem(PERF_KEY); } catch (e) {}
      el.remove();
    }));
    bar.appendChild(mkBtn('ปิดโหมดวัด', '#B91C1C', function () {
      try { localStorage.removeItem('njhr_face_perf'); } catch (e) {}
      PERF.on = false; el.remove();
    }));
    el.appendChild(pre);
    el.appendChild(bar);
  }
  function perfTextAll() {
    var log = perfLoad();
    if (!log.length) return '(ยังไม่มีผลทดสอบ)';
    var dev = perfDevice();
    var head = dev.device + ' · ' + dev.os + ' · ' + dev.browser + ' · ' + dev.mode +
               (dev.network ? ' · ' + dev.network : '') + '\nbuild ' + (w.NJHR_BUILD_VERSION || '?') +
               '\nเก็บไว้ ' + log.length + ' รอบ\n';
    return head + log.slice(-6).map(function (e) {
      return '\n[' + e.flow + (e.cold ? ' · COLD' : ' · WARM') + ']\n' + perfText(e);
    }).join('');
  }

  /* [TEST ONLY] เปิดฟังก์ชันภายในให้ Harness เรียกได้ เฉพาะเมื่อ window.__TEST_MODELS = true
     Production ไม่มีค่านี้ จึงไม่มี Object นี้เกิดขึ้นเลย และไม่มีผลต่อพฤติกรรมใด ๆ */
  if (w.__TEST_MODELS) {
    w.__NJHR_FACE_TEST = {
      passiveLiveness: function (f) { return passiveLiveness(f); },
      yaw: function (lm) { return yaw(lm); },
      BORDER_MIN: BORDER_MIN, BORDER_MAX: BORDER_MAX
    };
  }

  w.NJHRFacePerf = {
    enable: function () { try { localStorage.setItem('njhr_face_perf', '1'); } catch (e) {} PERF.on = true; },
    disable: function () { try { localStorage.removeItem('njhr_face_perf'); } catch (e) {} PERF.on = false; },
    isOn: perfOn,
    current: function () { return PERF.t ? JSON.parse(JSON.stringify(PERF.t)) : null; },
    log: function () { return perfLoad().slice(); },
    text: perfTextAll,
    show: function () { if (perfOn()) perfPanel(); },
    clear: function () {
      PERF.log = [];
      perfBootReset();                      // [INSTRUMENTATION] ล้าง Boot/Warmup metrics ด้วย
      perfLongTaskBootReset();              // เปิดถัง Boot ใหม่สำหรับรอบวัดถัดไป
      try { localStorage.removeItem(PERF_KEY); } catch (e) {}
      var e2 = d.getElementById('njf-perf-panel'); if (e2) e2.remove();
    },
    /* [EXPORT] คืน Object ตาม Schema ของ REAL-DEVICE-FACE-RESULT-*.json */
    exportResult: function () { return perfExportTemplate(); },
    /* [EXPORT] ดาวน์โหลดไฟล์ชื่อตามระบบ (ANDROID / IOS) — คืนชื่อไฟล์ที่บันทึก */
    exportDownload: function () { return perfExportDownload(); },
    exportName: perfExportName,
    /* [E2E] เรียกจากหน้าลงเวลา ณ วินาทีที่ผู้ใช้กดปุ่มจริง (ก่อน njExemptCheck) */
    pressStart: function (epochMs) { try { perfPressStart(epochMs); } catch (e) {} },
    /* [PRESS] ล้างฐานเวลาการกดปุ่ม — เรียกเมื่อ Success · Fail · Cancel · Route change · Exempt จบ */
    pressReset: function () { try { perfPressReset(); } catch (e) {} },
    /* [BOOT JANK] ให้ผู้เรียกสั่งเริ่ม Observer เองได้ก่อน warmup (idempotent) */
    bootObserve: function () { try { perfLongTaskStart(); } catch (e) {} },
    /* บันทึกค่าที่วัดจากฝั่งหน้าเว็บลงถัง Boot (เช่น route_to_gate_ready_ms) */
    bootMark: function (key, ms) {
      try {
        var v = Number(ms);
        var k = String(key || '');
        if (perfOn() && k && isFinite(v) && v >= 0) {
          PERF.boot.marks[k] = Math.round(v * 10) / 10;
        }
      } catch (e) {}
    },
    /* [E2E] เวลาที่หน้าเว็บใช้โหลดโมดูล face.js เอง (วัดจากฝั่งหน้าเว็บ) */
    setModuleLoadMs: function (ms) {
      try {
        var v = Number(ms);
        if (perfOn() && isFinite(v) && v >= 0) PERF.boot.marks.face_module_load_ms = Math.round(v * 10) / 10;
      } catch (e) {}
    },
    /* บันทึกช่วงเวลาที่นับจากตอนกดปุ่ม เช่น 'exempt_wait_ms' */
    pressMark: function (key, eventEpochMs) {
      try { perfPressMark(String(key || ''), eventEpochMs); } catch (e) {}
    }
  };
  /* [TEST KIT] คู่มือเรียกผ่าน NJHRFace.perf.* — ผูกให้เป็น Object เดียวกับ NJHRFacePerf
     เพื่อไม่ให้มี API สองชุดที่หลุดจากกัน (ผูกจริงตอนประกาศ w.NJHRFace ด้านล่าง) */

  /* ---------- [PERF] Two-Stage Model Loading ----------
     ปัญหาเดิม: faceNets() รอ Promise.all ของทั้ง 3 โมเดลก่อนเริ่มตรวจหน้าได้
       tiny_face_detector_model.bin      193 KB
       face_landmark_68_model.bin        357 KB   → รวม GUIDE = 550 KB
       face_recognition_model.bin      6,444 KB   → 92% ของทั้งหมด
     ผู้ใช้จึงต้องรอ 6.44 MB ทั้งที่ขั้นนำทาง (กรอบหน้า/Yaw/Ring/Quality) ใช้แค่ 550 KB

     ของใหม่แยกเป็น 2 เฟส ใช้ Shared Promise คนละตัว โหลดขนานกัน:
       STAGE A (GUIDE)       tinyFaceDetector + faceLandmark68Net
                             พร้อมเมื่อไหร่ = เปิดกล้อง + Detection + Landmark + Guide UI ได้ทันที
       STAGE B (RECOGNITION) faceRecognitionNet โหลด Background
                             รอเฉพาะตอนจะสร้าง Descriptor จริงเท่านั้น

     Single-flight ทุกตัว: เรียกซ้ำ/เรียกพร้อมกันหลายที่ ได้ Promise เดิม ไม่โหลดซ้ำ
     คง Fallback Local → CDN เดิมครบทั้งชั้น script และชั้น nets */
  var LIB = { p: null };

  /* โหลด face-api.js ครั้งเดียว ใช้ร่วมกันทั้ง 2 เฟส */
  /* ---------- [TIMEOUT] เพดานเวลาของทุกขั้นที่รอทรัพยากรภายนอก ----------
     เดิม: faceScript รอ onload/onerror เท่านั้น · loadFromUri ไม่มีเพดาน · detect ไม่มีเพดาน
     บนเครือข่ายที่ค้างกลางทาง (ไม่ error ไม่ตอบ) ผู้ใช้จะค้างไม่มีกำหนด
     ⚠ Timeout ห้ามแปลงเป็น PASS — ต้องโยน Error ที่มี .faceCode จริงเสมอ */
  var LIB_TIMEOUT_MS   = 12000;   // โหลด face-api.js ต่อ 1 แหล่ง
  var MODEL_TIMEOUT_MS = 15000;   // loadFromUri ต่อ 1 แหล่ง
  var INFER_TIMEOUT_MS = 8000;    // ใช้งานปกติ: 1 เฟรมของ detect()/detectGuide()
  /* [ANDROID ENROLLMENT] ลงทะเบียนใบหน้าต้องเก็บหลายเฟรมต่อเนื่องและบางเครื่อง Android
     (เช่น Samsung A56) ใช้เวลา inference สูงกว่า 8s เป็นบางเฟรม ทำให้เกิด false timeout
     ทั้งที่กล้อง/ใบหน้ายังปกติ จึงขยายเฉพาะ Enrollment เป็น 12s
     ⚠ ไม่ลด Threshold · Liveness · Quality · จำนวนเฟรม · Face Match ใด ๆ */
  var ENROLL_INFER_TIMEOUT_MS = 12000;
  /* [TOTAL DEADLINE] เพดานรวมของทั้งเส้นทาง Local → CDN
     ปัญหาเดิม: 20s (lib local) + 20s (lib CDN) + 25s (model local) + 25s (model CDN) ≈ 90 วินาที
     ผู้ใช้จะยืนรอเกือบนาทีครึ่งก่อนเห็น Error ซึ่งใช้ไม่ได้บนหน้างานจริง
     ของใหม่ครอบทั้งเส้นด้วยเพดานเดียว — ถึงเวลาแล้ว Fail Closed พร้อม Error Code จริง */
  var LIB_TOTAL_MS   = 20000;     // lib: local + CDN รวมกัน
  var MODEL_TOTAL_MS = 25000;     // model: local + CDN รวมกัน

  function faceErr(code, msg) {
    var e = new Error(msg);
    e.faceCode = code;
    return e;
  }
  /* ครอบ Promise ด้วยเพดานเวลา — เกินเวลา = reject ด้วย Error Code จริง
     onTimeout ใช้เก็บกวาด (เช่น ถอด <script> ที่ค้าง) */
  function withTimeout(p, ms, code, msg, onTimeout) {
    return new Promise(function (res, rej) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        try { if (onTimeout) onTimeout(); } catch (e) {}
        rej(faceErr(code, msg));
      }, ms);
      Promise.resolve(p).then(function (v) {
        if (done) return;
        done = true; clearTimeout(timer); res(v);
      }, function (e) {
        if (done) return;
        done = true; clearTimeout(timer); rej(e);
      });
    });
  }

  function libLoad() {
    if (w.faceapi) return Promise.resolve();
    if (LIB.p) return LIB.p;
    LIB.p = faceScript(FACE_API_LOCAL)['catch'](function (e1) {
      try { console.error('[FACE] โหลด assets/models/face-api.js ไม่สำเร็จ — ใช้ CDN สำรอง'); } catch (e2) {}
      njfReport('JS_ERROR', 'face/model',
        { message: 'lib local failed code=' + ((e1 && e1.faceCode) || '-') },
        'stage=lib-local build=' + String(w.NJHR_BUILD_VERSION || ''));
      return faceScript(FACE_API_CDN);       // [TIMEOUT] Fallback ได้จริงเมื่อแหล่งแรกค้าง
    });
    LIB.p = withTimeout(LIB.p, LIB_TOTAL_MS, 'FACE_LIB_TIMEOUT',
      'โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ (หมดเวลารอรวม)')['catch'](function (e) {
      LIB.p = null;                          // ล้มเหลว = กดลองใหม่ได้เหมือนเดิม
      var code = (e && e.faceCode) || 'FACE_LIB_LOAD_FAILED';
      njfReport('JS_ERROR', 'face/model', { message: 'lib all sources failed code=' + code },
        'stage=lib-all build=' + String(w.NJHR_BUILD_VERSION || ''));
      throw faceErr(code, (e && e.message) || 'โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ');
    });
    return LIB.p;
  }

  /* โหลด nets ชุดหนึ่ง พร้อม Fallback Local → CDN (ใช้ Pattern เดิมทุกประการ) */
  function netsWithFallback(names, label) {
    function run(base) {
      var f = w.faceapi;
      /* [TIMEOUT] loadFromUri ไม่มีเพดานในตัว — ครอบด้วย withTimeout ต่อแหล่ง */
      return withTimeout(
        Promise.all(names.map(function (n) { return f.nets[n].loadFromUri(base); })),
        MODEL_TIMEOUT_MS, 'FACE_MODEL_TIMEOUT',
        'โหลดโมเดล ' + label + ' ไม่สำเร็จ (หมดเวลารอ)');
    }
    return withTimeout(run(MODEL_URL_LOCAL)['catch'](function (e1) {
      try { console.error('[FACE] โหลดโมเดล ' + label + ' จาก assets/models ไม่สำเร็จ — ใช้ CDN สำรอง'); } catch (e2) {}
      njfReport('JS_ERROR', 'face/model',
        { message: 'model local failed code=' + ((e1 && e1.faceCode) || '-') },
        'stage=model-local label=' + label + ' build=' + String(w.NJHR_BUILD_VERSION || ''));
      return run(MODEL_URL_CDN)['catch'](function (e2b) {
        var code = (e2b && e2b.faceCode) || 'FACE_MODEL_LOAD_FAILED';
        njfReport('JS_ERROR', 'face/model', { message: 'model all sources failed code=' + code },
          'stage=model-all label=' + label + ' build=' + String(w.NJHR_BUILD_VERSION || ''));
        throw faceErr(code, (e2b && e2b.message) || ('โหลดโมเดล ' + label + ' ไม่สำเร็จ'));
      });
    }), MODEL_TOTAL_MS, 'FACE_MODEL_TIMEOUT',
        'โหลดโมเดล ' + label + ' ไม่สำเร็จ (หมดเวลารอรวม)');
  }

  /* STAGE A — GUIDE (Detector + Landmark) 550 KB */
  function guideLoad() {
    if (S.guideReady) return Promise.resolve();
    if (S.guideLoading) return S.guideLoading;
    swModelBind();              // ต้องผูก listener "ก่อน" ยิงคำขอไฟล์โมเดล
    swModelBeginLoad();
    var tG = perfNow();
    S.guideLoading = libLoad().then(function () {
      return netsWithFallback(['tinyFaceDetector', 'faceLandmark68Net'], 'guide');
    }).then(function () {
      perfDur('guide_model_load_ms', tG);
      S.guideReady = true;
      S.ready = !!(S.guideReady && S.recogReady);
    })['catch'](function (e) {
      S.guideLoading = null;
      /* [FACE CODE] ต้องไม่กลืน .faceCode — ไม่งั้น Export จะได้ FLOW_ERROR แทน Timeout จริง */
      throw faceErr((e && e.faceCode) || 'FACE_MODEL_LOAD_FAILED',
                    (e && e.message) || 'โหลดโมเดลตรวจใบหน้าไม่สำเร็จ');
    });
    return S.guideLoading;
  }

  /* STAGE B — RECOGNITION (Descriptor) 6.44 MB — โหลด Background ห้าม Block Guide */
  function recogLoad() {
    if (S.recogReady) return Promise.resolve();
    if (S.recogLoading) return S.recogLoading;
    swModelBind();
    swModelBeginLoad();
    var tR = perfNow();
    S.recogLoading = libLoad().then(function () {
      return netsWithFallback(['faceRecognitionNet'], 'recognition');
    }).then(function () {
      perfDur('recognition_model_load_ms', tR);
      S.recogReady = true;
      S.ready = !!(S.guideReady && S.recogReady);
    })['catch'](function (e) {
      S.recogLoading = null;
      throw faceErr((e && e.faceCode) || 'FACE_MODEL_LOAD_FAILED',
                    (e && e.message) || 'โหลดโมเดลยืนยันใบหน้าไม่สำเร็จ');
    });
    return S.recogLoading;
  }

  /* เริ่มโหลด Recognition แบบไม่บล็อกใคร — เรียกได้บ่อยเท่าไหร่ก็ได้ ไม่โหลดซ้ำ */
  function recogPrefetch() {
    try { recogLoad()['catch'](function () {}); } catch (e) {}
  }

  /* [COMPAT] loadModels() เดิม = "พร้อมครบทั้ง 2 เฟส"
     ยังใช้กับ warmup() และจุดที่ต้องการความพร้อมเต็มรูปแบบ ความหมายไม่เปลี่ยน
     S.ready ยังหมายถึง "พร้อมครบ" เหมือนเดิม จึงไม่กระทบ isReady() และ UI ที่อ่านค่านี้ */
  function loadModels() {
    if (S.ready) return Promise.resolve();
    return Promise.all([guideLoad(), recogLoad()]).then(function () {});
  }

  /* ---------- กล้อง ---------- */
  /* [ข้อ 2] Camera Generation — กัน getUserMedia ที่ Resolve หลัง Cancel/Logout/Route Change
     เอา Stream กลับมาใส่ S.stream (Camera resurrection)
     ทุกจุดที่ปิดกล้องจะ ++CAM.gen ทำให้คำขอที่ค้างอยู่หมดสิทธิ์ทันที */
  var CAM = { gen: 0 };
  function camInvalidate() { CAM.gen++; }

  /* Sentinel สำหรับ Flow ที่ถูกยกเลิก — .catch() ต้องเงียบ ไม่ขึ้น Error UI */
  function AbortAttendanceError() {
    var e = new Error('ATTENDANCE_ABORTED');
    e.aborted = true;
    return e;
  }
  function isAborted(e) { return !!(e && e.aborted); }

  /* ---------- [ROOT CAUSE 1] Camera Capability Diagnostic ----------
     เดิม: ไม่มี mediaDevices/getUserMedia → แจ้ง "อุปกรณ์นี้ไม่รองรับการเปิดกล้อง" กับทุกกรณี
     ซึ่งผิดและกว้างเกินไป — มือถือทุกเครื่องมีกล้อง สาเหตุจริงมักเป็น
     Insecure Context · in-app browser/WebView · iframe/Permissions Policy · สิทธิ์ถูกปิด
     ของใหม่ตรวจสภาพแวดล้อมจริงก่อน แล้วแยก Error Code ให้ระบุสาเหตุได้
     ⚠ ไม่แตะ Threshold/Liveness/Geofence · ไม่เปลี่ยนเงื่อนไขผ่าน/ไม่ผ่านใด ๆ */
  var CAM_OPEN_TIMEOUT_MS = 15000;   // เพดานรอ getUserMedia (สิทธิ์ + เปิดอุปกรณ์)
  var CAM_PLAY_TIMEOUT_MS = 8000;    // เพดานรอ loadedmetadata + play()

  function camUA() { try { return String(navigator.userAgent || ''); } catch (e) { return ''; } }

  /* in-app browser / WebView — ตรวจจาก UA ที่พบจริงบนอุปกรณ์ไทย
     iOS: WKWebView ของแอปจะไม่มี 'Safari/' · Android: มี 'wv' หรือชื่อแอปใน UA */
  function camInApp() {
    var ua = camUA();
    if (/(FBAN|FBAV|FB_IAB|Instagram|Line\/|LINE\/|Messenger|Twitter|TikTok|MicroMessenger|WeChat)/i.test(ua)) return true;
    if (/\bwv\b/.test(ua)) return true;                                   // Android WebView
    if (/(iPhone|iPad|iPod)/i.test(ua) && /AppleWebKit/i.test(ua)
        && !/Safari\//i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) return true;
    return false;
  }

  function camStandalone() {
    try {
      if (w.navigator && w.navigator.standalone === true) return true;
      if (w.matchMedia && w.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (e) {}
    return false;
  }

  function camEmbedded() { try { return w.top !== w.self; } catch (e) { return true; } }

  /* Permissions Policy — รองรับเฉพาะบางเบราว์เซอร์ · ไม่รองรับ = null (ไม่ตัดสิน) */
  function camPolicyAllows() {
    try {
      var pp = d.permissionsPolicy || d.featurePolicy;
      if (pp && typeof pp.allowsFeature === 'function') return !!pp.allowsFeature('camera');
    } catch (e) {}
    return null;
  }

  /* ข้อมูลสภาพแวดล้อมกล้อง — ใช้ทั้งเลือกข้อความและส่งเข้า Error Monitor
     ⚠ ไม่มี lat/lng · ไม่มี Token · ไม่มี Descriptor · ไม่มี Device ID · ไม่มี URL ที่มี Query */
  function camEnv() {
    var dv = deviceInfo();
    var secure = false;
    try { secure = w.isSecureContext === true; } catch (e) { secure = false; }
    var proto = '';
    try { proto = String(location.protocol || ''); } catch (e) { proto = ''; }
    var hasMD = false, hasGUM = false;
    try { hasMD = !!navigator.mediaDevices; } catch (e) { hasMD = false; }
    try { hasGUM = hasMD && typeof navigator.mediaDevices.getUserMedia === 'function'; } catch (e) { hasGUM = false; }
    return {
      secure: secure, proto: proto, mediaDevices: hasMD, getUserMedia: hasGUM,
      embedded: camEmbedded(), policy: camPolicyAllows(), inApp: camInApp(),
      mode: camStandalone() ? 'standalone' : 'browser',
      device: dv.device, browser: dv.browser, os: dv.os
    };
  }

  /* สรุปเป็นสตริงสั้นสำหรับ Error Monitor — ไม่มีข้อมูลอ่อนไหว */
  function camEnvText(env, code, errName) {
    return 'code=' + String(code || '-') +
           ' name=' + String(errName || '-') +
           ' secure=' + (env.secure ? 'true' : 'false') +
           ' proto=' + env.proto +
           ' media_api=' + (env.getUserMedia ? 'true' : 'false') +
           ' embedded=' + (env.embedded ? 'true' : 'false') +
           ' policy=' + (env.policy === null ? 'unknown' : (env.policy ? 'allow' : 'deny')) +
           ' inapp=' + (env.inApp ? 'true' : 'false') +
           ' mode=' + env.mode +
           ' browser=' + env.browser + ' os=' + env.os + ' device=' + env.device +
           ' build=' + String(w.NJHR_BUILD_VERSION || '');
  }

  /* Error ที่ระบุสาเหตุได้จริง — .camCode ใช้แสดงคำแนะนำเฉพาะกรณีบนหน้าจอ */
  function camError(code, msg) {
    var e = new Error(msg);
    e.camCode = code;
    return e;
  }

  function camOpenHint(os) {
    return /iOS/i.test(os)
      ? 'กรุณาเปิดลิงก์นี้ด้วย Safari บน iPhone แล้วลองใหม่'
      : 'กรุณาเปิดลิงก์นี้ด้วย Chrome บน Android แล้วลองใหม่';
  }

  /* ตรวจก่อนเรียก getUserMedia — คืน Error ถ้าฟันธงได้แล้วว่าเปิดไม่ได้ · คืน null ถ้าผ่าน */
  function camPrecheck(env) {
    if (!env.secure || (env.proto !== 'https:' && env.proto !== 'file:'
        && !/^localhost$|^127\.0\.0\.1$/.test((function () {
             try { return String(location.hostname || ''); } catch (e) { return ''; } })()))) {
      if (!env.secure) {
        return camError('CAM_INSECURE_CONTEXT',
          'เปิดกล้องไม่ได้เพราะหน้านี้ไม่ได้อยู่บนการเชื่อมต่อที่ปลอดภัย (HTTPS) — ' +
          'กรุณาเปิดด้วยที่อยู่ที่ขึ้นต้นด้วย https:// แล้วลองใหม่');
      }
    }
    if (!env.getUserMedia) {
      if (env.inApp) {
        return camError('CAM_API_MISSING',
          'เบราว์เซอร์ในแอปนี้ไม่เปิดให้ใช้กล้อง — ' + camOpenHint(env.os));
      }
      return camError('CAM_API_MISSING',
        'เบราว์เซอร์นี้ไม่เปิดให้เว็บใช้กล้อง — ' + camOpenHint(env.os));
    }
    if (env.embedded && env.policy === false) {
      return camError('CAM_EMBEDDED_BLOCKED',
        'หน้านี้ถูกฝังอยู่ในกรอบที่ไม่อนุญาตให้ใช้กล้อง — ' + camOpenHint(env.os));
    }
    return null;
  }

  /* แปลง error.name ของ getUserMedia เป็น Error Code ของเรา */
  function camMapError(e, env) {
    var n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'SecurityError') {
      if (env.inApp) {
        return camError('CAM_PERMISSION_DENIED',
          'กล้องไม่ได้รับอนุญาตในเบราว์เซอร์ของแอปนี้ — ' + camOpenHint(env.os));
      }
      return camError('CAM_PERMISSION_DENIED',
        /iOS/i.test(env.os)
          ? 'กล้องไม่ได้รับอนุญาต — เปิด ตั้งค่า > Safari > กล้อง เป็น "อนุญาต" แล้วลองใหม่'
          : 'กล้องไม่ได้รับอนุญาต — แตะไอคอนซ้ายช่องที่อยู่เว็บ > สิทธิ์ > กล้อง > อนุญาต แล้วลองใหม่');
    }
    if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') {
      return camError('CAM_NOT_FOUND', 'ไม่พบกล้องหน้าที่ใช้งานได้บนอุปกรณ์นี้');
    }
    if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') {
      return camError('CAM_BUSY', 'กล้องถูกใช้งานโดยแอปอื่นอยู่ — ปิดแอปที่ใช้กล้องแล้วลองใหม่');
    }
    return camError('CAM_OPEN_FAILED', 'เปิดกล้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }

  /* getUserMedia ที่มีเพดานเวลาแน่นอน
     ⚠ Stream ที่ Resolve มา "หลัง" Timeout ต้องถูก stop เสมอ และห้ามเขียน S.stream
        ใช้ Camera Generation เดิม (myGen) เป็นตัวตัดสิทธิ์ — ไม่มีกล้องคืนชีพ */
  function camGetStream(myGen) {
    return new Promise(function (res, rej) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        camInvalidate();                    // คำขอที่ค้างอยู่หมดสิทธิ์ทันที
        rej(camError('CAM_TIMEOUT',
          'เปิดกล้องไม่สำเร็จ (รอนานเกินไป) — ปิดแอปอื่นที่ใช้กล้องแล้วลองใหม่'));
      }, CAM_OPEN_TIMEOUT_MS);
      var tReq = perfNow();
      /* [SAMSUNG] ใช้ ideal ทั้งคู่ ไม่ใช่ exact — ไม่บังคับความละเอียดที่กล้องอาจทำไม่ได้
         และเปิด Stream ชุดเดียวเท่านั้น ไม่สลับกล้อง ไม่เปิดซ้ำ */
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      }).then(function (st) {
        perfMark('camera_request_ms', tReq);
        if (done || myGen !== CAM.gen) {     // มาช้า/หมดอายุ = ปิด Track ทิ้งทันที
          try { st.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e2) {} }); } catch (e3) {}
          if (!done) { done = true; clearTimeout(timer); rej(AbortAttendanceError()); }
          return;
        }
        done = true; clearTimeout(timer); res(st);
      }, function (e) {
        if (done) return;
        done = true; clearTimeout(timer); rej(e);
      });
    });
  }

  /* รอให้วิดีโอพร้อมจริงก่อนเริ่มตรวจใบหน้า:
     loadedmetadata → videoWidth/videoHeight > 0 → play() สำเร็จ
     ขาดข้อใดข้อหนึ่ง = CAM_PLAYBACK_FAILED (เดิมไม่ตรวจ ทำให้ detect() ทำงานบนเฟรมว่าง) */
  /* ---------- [SAMSUNG FIX] Video Ready Gate ----------
     Root Cause ที่ตรวจพบ: ของเดิมถือว่า "กล้องพร้อม" เมื่อ
       videoWidth > 0  +  play() resolve
     แต่บน Samsung/Android ทั้งสองอย่างนี้เกิดตั้งแต่ readyState = 1 (HAVE_METADATA)
     ซึ่งยัง "ไม่มีข้อมูลภาพจริง" — detectAllFaces() จึงวิ่งบนเฟรมดำหลายสิบเฟรม
     จนโควตา 96 tries หมด แล้วขึ้น "ตรวจใบหน้าไม่สำเร็จ" ทั้งที่กล้องเปิดได้

     ของใหม่ต้องผ่านครบทุกข้อจึงถือว่าพร้อม:
       · videoWidth > 0 และ videoHeight > 0
       · readyState >= HAVE_CURRENT_DATA (2)  ← ข้อที่ขาดไปเดิม
       · video track ของ stream อยู่ในสถานะ 'live'
       · ผ่าน rAF จริงอีก 2 เฟรมเพื่อเลี่ยงเฟรมแรกที่ยังไม่นิ่ง

     ⚠ ใช้สถานะจริงของ Video เป็น Gate ไม่ใช่ setTimeout เดาสุ่ม
        เครื่องที่พร้อมเร็ว (iPhone/Chrome ทั่วไป) จะผ่าน Gate ทันทีไม่ถูกหน่วง
        Timeout มีไว้เป็น Safety เท่านั้น
     ⚠ ไม่แตะ Threshold / Liveness / Descriptor 6 รอบ / Geofence */
  var VIDEO_READY_STATE_MIN = 2;    // HAVE_CURRENT_DATA
  var VIDEO_STABLE_FRAMES = 2;      // เฟรมจริงที่ต้องผ่านก่อนเริ่มตรวจใบหน้า

  /* สถานะ track ของ stream ปัจจุบัน — ใช้ทั้ง Gate และ Diagnostic */
  function camTrackState() {
    try {
      var ts = S.stream && S.stream.getVideoTracks ? S.stream.getVideoTracks() : null;
      if (!ts || !ts.length) return 'none';
      return String(ts[0].readyState || 'unknown');
    } catch (e) { return 'unknown'; }
  }

  /* ตรวจแบบ synchronous ว่า "ตอนนี้" วิดีโอพร้อมให้ตรวจใบหน้าหรือยัง
     ใช้ซ้ำได้ทุกเฟรมโดยไม่มีค่าใช้จ่าย — ไม่มี Side Effect */
  function camVideoReady() {
    var v = S.video;
    if (!v || !S.stream) return false;
    if (!v.videoWidth || !v.videoHeight) return false;
    if ((v.readyState || 0) < VIDEO_READY_STATE_MIN) return false;
    if (camTrackState() !== 'live') return false;
    return true;
  }

  /* บันทึกสภาพวิดีโอ ณ จุดที่พร้อม — ไม่มีรูป ไม่มี Descriptor ไม่มี Token */
  function camMarkVideoDiag() {
    try {
      var v = S.video;
      perfSet('video_width', v ? (v.videoWidth || 0) : 0);
      perfSet('video_height', v ? (v.videoHeight || 0) : 0);
      perfSet('video_ready_state', v ? (v.readyState || 0) : 0);
      perfSet('track_ready_state', camTrackState());
    } catch (e) {}
  }

  function camAwaitPlayback(myGen) {
    var v = S.video;
    if (!v) return Promise.reject(AbortAttendanceError());
    var tPlay = perfNow();
    return new Promise(function (res, rej) {
      var done = false;
      var raf = 0;
      var playSettled = false;        // play() ตอบแล้ว (สำเร็จหรือถูกปฏิเสธก็ตาม)
      var EV = ['loadedmetadata', 'loadeddata', 'canplay', 'playing'];
      var timer = setTimeout(function () {
        if (done) return;
        done = true; cleanup();
        camMarkVideoDiag();
        rej(camError('CAM_PLAYBACK_FAILED',
          'กล้องเปิดแล้วแต่ยังไม่มีภาพ — ปิดแอปอื่นที่ใช้กล้องแล้วลองใหม่'));
      }, CAM_PLAY_TIMEOUT_MS);

      function cleanup() {
        clearTimeout(timer);
        if (raf) { try { cancelAnimationFrame(raf); } catch (e) {} raf = 0; }
        for (var i = 0; i < EV.length; i++) {
          try { v.removeEventListener(EV[i], onEvt); } catch (e) {}
        }
      }
      function onEvt() { check(); }

      /* ผ่านเงื่อนไขครบแล้ว → รอเฟรมจริงอีก VIDEO_STABLE_FRAMES เฟรม
         เพื่อไม่ให้ Detector เจอเฟรมแรกที่กล้องยังปรับแสง/โฟกัสไม่เสร็จ */
      function settleFrames(left) {
        if (done) return;
        if (myGen !== CAM.gen) { done = true; cleanup(); rej(AbortAttendanceError()); return; }
        if (left <= 0) {
          done = true; cleanup();
          perfMark('camera_play_ms', tPlay);
          perfMark('video_ready_ms', tPlay);
          camMarkVideoDiag();
          res(true);
          return;
        }
        raf = requestAnimationFrame(function () { settleFrames(left - 1); });
      }

      function check() {
        if (done) return;
        if (myGen !== CAM.gen) { done = true; cleanup(); rej(AbortAttendanceError()); return; }
        if (!playSettled) return;          // ยังไม่เริ่มเล่นจริง = ยังไม่ถือว่าพร้อม
        if (!camVideoReady()) return;      // ยังไม่พร้อม = รอ Event/รอบถัดไป
        settleFrames(VIDEO_STABLE_FRAMES);
      }

      /* เริ่ม play() ก่อน แล้วจึงเฝ้าสถานะ — บาง Android ไม่ยิง canplay ถ้าไม่ play */
      var p = null;
      try { p = v.play(); } catch (e) { p = null; }
      Promise.resolve(p).then(function () {
        playSettled = true;
        if (done) return;
        if (myGen !== CAM.gen) { done = true; cleanup(); rej(AbortAttendanceError()); return; }
        check();
      }, function () {
        /* play() ถูกปฏิเสธ (autoplay policy) แต่บางเครื่องยังส่งเฟรมมา
           จึงไม่ Fail ทันที ให้ Gate ตัดสินจากสถานะจริงของ Video แทน */
        playSettled = true;
        if (done) return;
        if (myGen !== CAM.gen) { done = true; cleanup(); rej(AbortAttendanceError()); return; }
        check();
      });

      for (var k = 0; k < EV.length; k++) {
        try { v.addEventListener(EV[k], onEvt); } catch (e) {}
      }
      check();                              // สถานะอาจพร้อมก่อนผูก listener แล้ว

      /* Poll เบา ๆ เป็นตาข่ายรองรับเครื่องที่ไม่ยิง Event ครบ
         (ไม่ใช่ Gate หลัก — Gate หลักคือสถานะจริงของ Video) */
      (function poll() {
        if (done) return;
        check();
        if (done) return;
        setTimeout(poll, 100);
      })();
    });
  }

  function openCam() {
    if (S.stream) return Promise.resolve(S.stream);   // กันเปิดซ้ำ
    var env = camEnv();
    var pre = camPrecheck(env);
    if (pre) {
      njfReport('JS_ERROR', 'face/camera', pre, camEnvText(env, pre.camCode, 'precheck'));
      return Promise.reject(pre);
    }
    var myGen = CAM.gen;
    return camGetStream(myGen).then(function (st) {
      /* คำขอนี้หมดอายุแล้ว (ถูก Cancel/Logout/Route Change ระหว่างรอสิทธิ์กล้อง)
         → ปิด Track ทิ้งทันที ห้ามเขียน S.stream ห้าม srcObject ห้าม play()
         แล้วจบแบบ Cancel เงียบ */
      if (myGen !== CAM.gen || !S.video) {
        try { st.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e2) {} }); } catch (e3) {}
        throw AbortAttendanceError();
      }
      S.stream = st;
      /* [INSTRUMENTATION] นับเฉพาะตอน getUserMedia คืน Stream ใหม่ที่ถูกใช้งานจริง */
      perfBootCount('camera_open_count');
      S.video.srcObject = st;
      S.video.setAttribute('playsinline', '');   // iPhone ต้องมี ไม่งั้นเปิดเต็มจอ
      S.video.setAttribute('muted', '');
      /* [ROOT CAUSE 1] ต้องมีภาพจริงก่อนเริ่ม Face Detection */
      return camAwaitPlayback(myGen).then(function () {
        if (myGen !== CAM.gen) {                 // หมดอายุระหว่างรอ play()
          closeCam();
          throw AbortAttendanceError();
        }
        /* [E2E] นับ "กล้องพร้อมใช้จริง" หลัง loadedmetadata + videoWidth>0 + play() สำเร็จ
           ไม่ใช่ตอนได้ MediaStream — บนมือถือสองจังหวะนี้ห่างกันได้หลายร้อย ms */
        perfPressMark('button_to_camera_ms');
        return st;
      });
    })['catch'](function (e) {
      if (isAborted(e)) throw e;                 // ยกเลิกเงียบ ไม่แปลงเป็นข้อความ Error
      var mapped = e && e.camCode ? e : camMapError(e, env);
      njfReport('JS_ERROR', 'face/camera', mapped,
                camEnvText(env, mapped.camCode, (e && e.name) || ''));
      throw mapped;
    });
  }

  function closeCam() {
    camInvalidate();                            // [ข้อ 2] คำขอกล้องที่ค้างอยู่หมดสิทธิ์ทันที
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    S.running = false;
    if (S.stream) {
      S.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      S.stream = null;
    }
    if (S.video) { try { S.video.pause(); } catch (e) {} S.video.srcObject = null; }
  }
  /* กล้องยังใช้งานได้จริงไหม — ใช้เป็น "หลักฐาน" ก่อนตัดสินว่า Detection Error เป็น Fatal
     ตายจริงก็ต่อเมื่อ: ไม่มี Stream/Video แล้ว หรือ Track ทุกเส้นอยู่ในสถานะ 'ended'
     (ถูกถอนสิทธิ์ · อุปกรณ์ถูกถอด · แอปอื่นยึดกล้องไป)
     อ่านสถานะไม่ได้ = ไม่ตัดสินว่าตาย เพื่อไม่ให้ Error ชั่วคราวถูกยกระดับเป็น Fatal */
  function camUsable() {
    try {
      if (!S.stream || !S.video) return false;
      var ts = S.stream.getTracks ? S.stream.getTracks() : null;
      if (!ts || !ts.length) return false;
      for (var i = 0; i < ts.length; i++) {
        if (ts[i] && ts[i].readyState !== 'ended') return true;
      }
      return false;
    } catch (e) { return true; }
  }

  /* ---------- ตรวจใบหน้าหนึ่งเฟรม ---------- */
  function detectOpt() {
    var f = w.faceapi;
    return new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
  }
  /* CAPTURE — Detection + Landmarks + Descriptor (ของเดิม ไม่เปลี่ยนพฤติกรรม)
     ใช้โดย Face Login / Face Attendance / Blink Challenge / ทดสอบใบหน้า ตามเดิมทุกจุด */
  function detect(timeoutMs) {
    var f = w.faceapi;
    perfCount('descriptor_calls');
    var myGen = CAM.gen;                        // [TIMEOUT] Generation guard
    var t = perfNow();
    var inferMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : INFER_TIMEOUT_MS;
    var task = f.detectAllFaces(S.video, detectOpt()).withFaceLandmarks().withFaceDescriptors();
    return withTimeout(Promise.resolve(task), inferMs, 'FACE_INFER_TIMEOUT',
      'ประมวลผลใบหน้าไม่ทันเวลา กรุณาลองใหม่'
    ).then(function (r) {
      /* กล้องถูกปิด/เปลี่ยนรอบระหว่างรอ inference = ผลนี้ใช้ไม่ได้ ต้องยกเลิกเงียบ */
      if (myGen !== CAM.gen) throw AbortAttendanceError();
      perfDescSample(perfNow() - t);
      return r;
    });
  }
  /* GUIDANCE — Detection + Landmarks เท่านั้น ห้ามคำนวณ Descriptor
     ใช้เฉพาะลูปนำทางท่าทางของ \"ลงทะเบียนใบหน้า\" (enroll) เท่านั้น
     Descriptor เป็นขั้นที่แพงที่สุดของ face-api การไม่คำนวณทุกเฟรมทำให้ลูปนำทางลื่นขึ้นมาก */
  function detectGuide(timeoutMs) {
    var f = w.faceapi;
    perfCount('guide_calls');
    var myGen = CAM.gen;                        // [TIMEOUT] Generation guard
    var tG = perfNow();
    var inferMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : INFER_TIMEOUT_MS;
    return withTimeout(
      Promise.resolve(f.detectAllFaces(S.video, detectOpt()).withFaceLandmarks()),
      inferMs, 'FACE_INFER_TIMEOUT', 'ตรวจใบหน้าไม่ทันเวลา กรุณาลองใหม่'
    ).then(function (r) {
      if (myGen !== CAM.gen) throw AbortAttendanceError();
      perfAdd('guide_inference_ms', perfNow() - tG);   // [PERF] แยกจาก descriptor_ms
      return r;
    });
  }

  // ความสว่าง/ความคมชัดของกรอบใบหน้า — ใช้ตรวจแสงและกันรูปเบลอ
  function frameQuality(box) {
    var c = S.canvas, ctx = c.getContext('2d');
    var vw = S.video.videoWidth, vh = S.video.videoHeight;
    if (!vw || !vh) return null;
    var x = Math.max(0, box.x | 0), y = Math.max(0, box.y | 0);
    var bw = Math.min(vw - x, box.width | 0), bh = Math.min(vh - y, box.height | 0);
    if (bw < 8 || bh < 8) return null;
    c.width = 64; c.height = 64;
    ctx.drawImage(S.video, x, y, bw, bh, 0, 0, 64, 64);
    var px = ctx.getImageData(0, 0, 64, 64).data;
    var g = new Float32Array(64 * 64), sum = 0;
    for (var i = 0, j = 0; i < px.length; i += 4, j++) {
      g[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      sum += g[j];
    }
    var mean = sum / g.length, varSum = 0, lap = 0;
    for (var k = 0; k < g.length; k++) varSum += (g[k] - mean) * (g[k] - mean);
    for (var yy = 1; yy < 63; yy++) {
      for (var xx = 1; xx < 63; xx++) {
        var o = yy * 64 + xx;
        var v = 4 * g[o] - g[o - 1] - g[o + 1] - g[o - 64] - g[o + 64];
        lap += v * v;
      }
    }
    return {
      brightness: mean,
      contrast: Math.sqrt(varSum / g.length),
      sharpness: lap / (62 * 62),
      ratio: (bw * bh) / (vw * vh)
    };
  }

  // ระยะห่างตาบน-ล่าง หารความกว้างตา — ใช้ตรวจการกระพริบตา
  function eyeOpen(lm) {
    function ear(pts) {
      function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
      return (dist(pts[1], pts[5]) + dist(pts[2], pts[4])) / (2 * dist(pts[0], pts[3]));
    }
    try { return (ear(lm.getLeftEye()) + ear(lm.getRightEye())) / 2; } catch (e) { return null; }
  }
  /* ---------- Yaw (การหันซ้าย/ขวา) — คำนวณจาก Landmark ล้วน ----------
     ห้ามใช้ Bounding Box เป็นค่าอ้างอิงหลัก: กรอบขยับ/ขยายตามการหันหน้าไปด้วย
     ทำให้ตัวหารและจุดกึ่งกลางไม่นิ่ง และปลายจมูกที่ใช้เดิม (getNose() ตัวสุดท้าย = จุด 35)
     คือ \"ปีกจมูกฝั่งขวา\" ไม่ใช่ปลายจมูก จึงมี Bias ค้างอยู่ตั้งแต่ท่าหน้าตรง

     สูตรใหม่:
       แกนอ้างอิง = เวกเตอร์จากจุดกึ่งกลางตาซ้าย → จุดกึ่งกลางตาขวา (ทนการเอียงหัว/roll)
       จุดวัด     = ปลายจมูกจริง (landmark 30 = ดัชนี 3 ของ getNose())
       Normalize  = inter-eye distance (ระยะระหว่างตา) → ไม่ขึ้นกับระยะห่างจากกล้อง
       yaw = ((ปลายจมูก − กึ่งกลางตา) · แกนตา) / (ระยะระหว่างตา)^2

     ความหมายเชิงเรขาคณิต: yaw ≈ (ความลึกจมูก / ระยะระหว่างตา) × tan(มุมหัน) ≈ 0.33 × tanθ
     เครื่องหมาย: บวก = ปลายจมูกเลื่อนไปทาง +x ของ \"เฟรมกล้องดิบ\"
       (face-api อ่านจาก <video> โดยตรง · CSS scaleX(-1) เป็นการแสดงผลเท่านั้น ไม่กระทบพิกัด)
       ทิศเดียวกับของเดิมทุกประการ → LEFT ยังเป็นค่าบวก · RIGHT ยังเป็นค่าลบ
     คืน null เมื่ออ่าน Landmark ไม่ได้ = \"ยังตัดสินไม่ได้\" ผู้เรียกต้องถือว่าไม่ผ่าน */
  function yaw(lm) {
    try {
      if (!lm) return null;
      var le = lm.getLeftEye(), re = lm.getRightEye(), no = lm.getNose();
      if (!le || !re || !no || le.length < 4 || re.length < 4 || no.length < 4) return null;
      var a = lmMid(le), b = lmMid(re), tip = no[3];
      if (!a || !b || !tip) return null;
      var dx = b.x - a.x, dy = b.y - a.y;
      var d2 = dx * dx + dy * dy;
      if (!(d2 > 1)) return null;                       // ใบหน้าเล็กเกินไป/ตาซ้อนกัน
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      return ((tip.x - cx) * dx + (tip.y - cy) * dy) / d2;
    } catch (e) { return null; }
  }
  function lmMid(pts) {
    var sx = 0, sy = 0, i;
    for (i = 0; i < pts.length; i++) { sx += pts[i].x; sy += pts[i].y; }
    return { x: sx / pts.length, y: sy / pts.length };
  }

  /* ---------- Passive Liveness ----------
     เก็บหลายเฟรมแล้วดูว่า "มีชีวิต" จริงไหม
       · ใบหน้าต้องขยับเล็กน้อยตามธรรมชาติ (รูปนิ่งสนิทจะตก)
       · ความคมชัดต้องพอ (ภาพจากจอมือถือมักเบลอและมี moiré)
       · ความสว่างและคอนทราสต์ต้องอยู่ในช่วงคนจริง
       · มีการเปลี่ยนแปลงของ descriptor เล็กน้อยระหว่างเฟรม (ภาพนิ่งจะเท่ากันเป๊ะ)
     ถ้าคะแนนก้ำกึ่ง จึงขอให้กระพริบตาเป็นการยืนยันเพิ่ม
  */
  function passiveLiveness(frames) {
    if (!perfOn()) return passiveLivenessCore(frames);
    var t = perfNow();
    var r = passiveLivenessCore(frames);
    perfAdd('passive_liveness_ms', perfNow() - t);
    return r;
  }
  function passiveLivenessCore(frames) {
    if (frames.length < 4) return { pass: false, score: 0, reason: 'เก็บภาพไม่พอ กรุณาลองใหม่' };
    var q = frames.map(function (f) { return f.q; }).filter(Boolean);
    if (!q.length) return { pass: false, score: 0, reason: 'อ่านคุณภาพภาพไม่ได้' };

    var avgSharp = q.reduce(function (a, x) { return a + x.sharpness; }, 0) / q.length;
    var avgBright = q.reduce(function (a, x) { return a + x.brightness; }, 0) / q.length;
    var avgContrast = q.reduce(function (a, x) { return a + x.contrast; }, 0) / q.length;

    if (avgBright < 45)  return { pass: false, score: 0, reason: 'แสงน้อยเกินไป กรุณาหาที่สว่างขึ้น' };
    if (avgBright > 232) return { pass: false, score: 0, reason: 'แสงจ้าเกินไป กรุณาเลี่ยงแสงย้อน' };
    if (avgSharp < 8)    return { pass: false, score: 0, reason: 'ภาพไม่ชัด กรุณาถือนิ่งและลองใหม่' };
    if (avgContrast < 18) return { pass: false, score: 0, reason: 'ภาพมีคอนทราสต์ต่ำผิดปกติ' };

    // การขยับตามธรรมชาติของศีรษะระหว่างเฟรม
    var move = 0;
    for (var i = 1; i < frames.length; i++) {
      var a = frames[i - 1].box, b = frames[i].box;
      move += Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, b.width);
    }
    move = move / (frames.length - 1);

    // ความต่างของ descriptor ระหว่างเฟรม — ภาพนิ่ง/วิดีโอวนซ้ำจะต่ำผิดปกติ
    var dd = 0, n = 0;
    for (var j = 1; j < frames.length; j++) {
      var s = 0, p = frames[j - 1].desc, c2 = frames[j].desc;
      for (var k = 0; k < p.length; k++) s += (p[k] - c2[k]) * (p[k] - c2[k]);
      dd += Math.sqrt(s); n++;
    }
    dd = n ? dd / n : 0;

    var score = 0;
    if (move > 0.0016) score += 0.35;
    if (dd > 0.045) score += 0.35;
    if (avgSharp > 22) score += 0.20;
    if (avgContrast > 32) score += 0.10;

    if (score >= 0.65) return { pass: true, score: score, method: 'PASSIVE' };
    if (score >= 0.35) return { pass: false, score: score, challenge: true,
      reason: 'ตรวจสอบบุคคลจริงไม่แน่ใจ กรุณากระพริบตา 1 ครั้ง' };
    return { pass: false, score: score,
      reason: 'ตรวจสอบบุคคลจริงไม่ผ่าน — ห้ามใช้รูปถ่ายหรือภาพจากหน้าจอ' };
  }

  /* ---------- เก็บเฟรมและตรวจ ---------- */
  /* [ข้อ 2] grabFrames ต้องมี Owner ของตัวเอง ห้ามพึ่ง S.running Global อย่างเดียว
     alive() = ฟังก์ชันของผู้เรียก (mine() ของ Attempt · enAlive() ของ Enrollment Run)
     ตรวจทุก Async Boundary: ก่อน detect · หลัง detect · ก่อน onTick · ก่อนเขียน out ·
     ก่อน RAF · ก่อน resolve · ก่อน reject
     Attempt เก่าที่ detect ตอบทีหลัง จะ reject เงียบด้วย Cancellation Sentinel
     และจะไม่ schedule RAF · ไม่ inference รอบต่อไป · ไม่แตะ UI */
  function grabFrames(count, onTick, alive) {
    var live = (typeof alive === 'function') ? alive : function () { return !!S.running; };
    var out = [];
    /* [PERF] grabFrames สร้าง Descriptor ทุกเฟรม (passiveLiveness ใช้ค่า dd จริง)
       จึงต้องมั่นใจว่า Recognition พร้อมก่อนเริ่มลูป — รอที่นี่จุดเดียว ไม่รอกลางลูป
       recogLoad() เป็น Single-flight: ถ้าโหลดเสร็จแล้วจะ Resolve ทันที ไม่มีค่าใช้จ่าย */
    var tW = perfNow();
    return recogLoad().then(function () {
      perfMark('recognition_wait_ms', tW);
      if (!S.running || !live()) throw AbortAttendanceError();
      if (onTick) onTick(null, 0);
      var tF = perfNow();
      return grabFramesLoop(count, onTick, live, out).then(function (r) {
        perfMark('grab_frames_ms', tF);
        return r;
      });
    });
  }
  /* [PERF] stopWhen(out) เป็นทางเลือก — คืน true เมื่อ "พอแล้ว" เพื่อ Early Exit
     ใช้เฉพาะเส้นทาง Liveness ก้ำกึ่ง เพื่อไม่คำนวณ Descriptor ที่ไม่ได้ใช้ต่อ
     ไม่ส่งมา = พฤติกรรมเดิมทุกประการ (หยุดเมื่อ out.length >= count เท่านั้น) */
  /* ---------- [ROOT CAUSE 6] Two-stage Capture ----------
     ปัญหาเดิม: ลูปนี้เรียก detect() (Detector + Landmark + Descriptor) "ทุกเฟรม"
     แล้วค่อยตรวจว่าเฟรมนั้นใช้ได้ไหม (พบกี่หน้า · q.ratio) เฟรมที่รู้อยู่แล้วว่าจะถูกทิ้ง
     จึงจ่ายค่า Descriptor inference ซึ่งเป็นขั้นที่แพงที่สุดของ face-api ไปฟรี ๆ

     ของใหม่ใช้แนวทางเดียวกับ Enrollment:
       Stage A (Guide)    — detectGuide() : Detector + Landmark เท่านั้น
                            ตรวจ พบ 1 หน้า · กรอบ/ขนาด (q.ratio) · ต้องนิ่งติดกัน GRAB_STABLE_MIN เฟรม
       Stage B (Evidence) — เมื่อผ่าน Stage A แล้วจึงเรียก detect() สร้าง Descriptor จริง

     ⚠ ไม่ลดจำนวนหลักฐาน · ไม่ Clone · ไม่ Reuse เฟรม:
        out ยังเก็บเฉพาะเฟรมที่มี Descriptor จริงจากกล้อง (Attendance ปกติ = 6 เฟรมเท่าเดิม)
        Borderline ยังรวม BORDER_MIN..BORDER_MAX (8–14) ตาม Logic เดิมทุกประการ
     ⚠ ไม่แตะ passiveLiveness · ไม่แตะ Threshold · ไม่แตะเกณฑ์ q.ratio 0.035 เดิม
     ⚠ ข้อความ onTick เดิมทุกตัวอักษร และ out.length = 0 เมื่อพบหลายหน้ายังคงเดิม */
  var GRAB_STABLE_MIN = 2;    // ต้องนิ่งอย่างน้อย 2 เฟรมติดกันก่อนจ่ายค่า Descriptor
  /* [SAMSUNG FIX] เฟรมที่ตรวจไม่เจอกี่เฟรมติดกันจึงจะถือว่า "ไม่นิ่งแล้ว"
     Detector บนมือถือสะดุดเป็นระยะ ถ้ารีเซ็ตความนิ่งทันทีที่พลาดเฟรมเดียว
     เครื่องที่ Detector ไม่เสถียรจะไม่มีวันสะสม Descriptor ครบ 6 เฟรม
     ⚠ ไม่ได้ลดจำนวนหลักฐาน — ยังต้องได้ Descriptor จริงครบ 6 เฟรมเหมือนเดิม */
  var GRAB_BAD_RESET = 3;

  function grabFramesLoop(count, onTick, live, out, stopWhen) {
    return new Promise(function (res, rej) {
      var tries = 0, stable = 0, badRun = 0;
      var notReady = 0;                       // จำนวนรอบที่วิดีโอยังไม่พร้อม (ไม่นับเป็น tries)
      var tLoop = perfNow();
      var firstDetect = 0;

      /* [SAMSUNG FIX] แยกสาเหตุที่ล้มจริง แทนการโยนทุกกรณีเป็นข้อความเดียว
         ผู้ใช้ยังเห็นข้อความเข้าใจง่ายเหมือนเดิม แต่ระบบรู้ว่าตายที่ขั้นไหน */
      function failWith(stage, msg, code) {
        perfSet('failure_stage', stage);
        perfSet('face_detect_attempts', tries);
        perfSet('face_frames_collected', out.length);
        try {
          var dv = deviceInfo();
          njfReport('FACE_CLIENT_FAIL', 'attendance_face',
            { message: stage },
            'stage=' + stage +
            ' attempts=' + tries + ' not_ready=' + notReady +
            ' frames=' + out.length + '/' + count +
            ' vw=' + (S.video ? (S.video.videoWidth || 0) : 0) +
            ' vh=' + (S.video ? (S.video.videoHeight || 0) : 0) +
            ' rs=' + (S.video ? (S.video.readyState || 0) : 0) +
            ' track=' + camTrackState() +
            ' browser=' + dv.browser + ' os=' + dv.os + ' device=' + dv.device +
            ' build=' + String(w.NJHR_BUILD_VERSION || ''));
        } catch (e2) {}
        var e3 = new Error(msg);
        e3.faceStage = stage;
        if (code) e3.faceCode = code;      // คง Error Code จริงไว้ให้ Export อ่านได้
        rej(e3);
      }

      (function loop() {
        if (!S.running || !live()) return rej(AbortAttendanceError());

        /* [SAMSUNG FIX · ข้อสำคัญที่สุด]
           ถ้าวิดีโอยังไม่พร้อมจริง ห้ามเรียก Detector และ "ห้ามนับ tries"
           ของเดิมนับทุกเฟรมรวมเฟรมดำ → Samsung เผาโควตา 96 รอบก่อนกล้องพร้อม
           แล้วขึ้นว่าตรวจใบหน้าไม่สำเร็จทั้งที่ยังไม่เคยได้ภาพจริงเลยสักเฟรม */
        if (!camVideoReady()) {
          notReady++;
          if (notReady > 600) {              // ~10 วินาทีที่ 60fps = กล้องไม่ส่งภาพจริง
            return failWith('VIDEO_NOT_READY',
              'กล้องยังไม่ส่งภาพ — ปิดแอปอื่นที่ใช้กล้องแล้วลองใหม่');
          }
          S.raf = requestAnimationFrame(loop);
          return;
        }

        /* Stage A ก่อนเสมอ · Stage B เฉพาะเมื่อนิ่งครบแล้ว */
        var capturing = stable >= GRAB_STABLE_MIN;
        (capturing ? detect() : detectGuide()).then(function (res2) {
          if (!live()) return rej(AbortAttendanceError());   // detect ตอบหลังหมดอายุ = หยุดทันที
          tries++;
          if (!firstDetect) { firstDetect = 1; perfMark('face_detect_first_ms', tLoop); }
          if (!res2.length) {
            badRun++;
            /* [SAMSUNG FIX] เฟรมเสียเดี่ยว ๆ ไม่ควรล้างความนิ่งทั้งหมด
               Detector บนมือถือสะดุดเป็นระยะ ถ้ารีเซ็ตทุกครั้งจะไม่มีวันครบ 6 เฟรม */
            if (badRun >= GRAB_BAD_RESET) stable = 0;
            if (onTick) onTick('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ');
          } else if (res2.length > 1) {
            badRun = 0; stable = 0;
            if (onTick) onTick('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง');
            out.length = 0;
          } else {
            var f0 = res2[0], box = f0.detection.box;
            var q = frameQuality(box);
            if (!q || q.ratio < 0.035) {
              badRun++;
              if (badRun >= GRAB_BAD_RESET) stable = 0;
              if (onTick) onTick('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น');
            } else if (!capturing || !f0.descriptor) {
              /* Stage A ผ่าน แต่ยังไม่ถึงคิวสร้าง Descriptor — นับความนิ่งไว้ก่อน */
              badRun = 0; stable++;
              if (onTick) onTick(null, out.length / count);
            } else {
              badRun = 0;
              out.push({ box: box, desc: Array.from(f0.descriptor), q: q,
                         ear: eyeOpen(f0.landmarks), yaw: yaw(f0.landmarks) });
              if (onTick) onTick(null, out.length / count);
            }
          }
          if (!live()) return rej(AbortAttendanceError());
          if (stopWhen) { try { if (stopWhen(out)) return res(out); } catch (e2) {} }
          if (out.length >= count) {
            perfSet('face_detect_attempts', tries);
            perfSet('face_frames_collected', out.length);
            return res(out);
          }
          /* เพดานนับเฉพาะรอบที่ "ได้ภาพจริง" แล้วเท่านั้น */
          if (tries > count * 12 + GRAB_STABLE_MIN * 12) {
            return failWith(out.length ? 'FRAME_TIMEOUT' : 'NO_FACE',
              'ตรวจใบหน้าไม่สำเร็จ กรุณาลองใหม่');
          }
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) {
          if (!live()) return rej(AbortAttendanceError());
          if (isAborted(e)) return rej(e);
          if (e && e.faceCode === 'FACE_INFER_TIMEOUT') {
            return failWith('DETECT_TIMEOUT',
              e.message || 'ตรวจใบหน้าไม่ทันเวลา กรุณาลองใหม่', 'FACE_INFER_TIMEOUT');
          }
          return failWith('DETECT_ERROR', (e && e.message) || 'ตรวจใบหน้าไม่สำเร็จ กรุณาลองใหม่');
        });
      })();
    });
  }

  /* ---------- [PERF] เก็บเฟรมเพิ่มแบบ Incremental ----------
     ปัญหาเดิมของเส้นทาง Liveness ก้ำกึ่ง:
       grabFrames(6) → ก้ำกึ่ง → grabFrames(8) "ชุดใหม่ทั้งหมด"
       เฟรมชุดแรก 6 เฟรม (พร้อม Descriptor ที่จ่ายค่าไปแล้ว) ถูกทิ้งทั้งหมด
       รวมสูงสุด 14 Descriptor inference ทุกครั้งที่ก้ำกึ่ง

     ของใหม่: ต่อยอดจากเฟรมเดิม เก็บเพิ่มทีละเฟรม แล้วประเมินซ้ำด้วยฟังก์ชันเดิม
       · หน้าต่างประเมินไม่เคยเล็กกว่าเดิม — ประเมินครั้งแรกเมื่อครบ minTotal (8) เท่านั้น
         จึงมีคู่เฟรมสำหรับคำนวณ move/dd ไม่น้อยกว่าของเดิมเลย
       · เพดานรวมยังเป็น maxTotal (14) เท่าเดิม → กรณีแย่สุดเท่าเดิมเป๊ะ
       · หยุดทันทีที่ passiveLiveness() ตัวเดิมบอกว่าผ่าน → ไม่จ่าย Descriptor ที่ไม่ได้ใช้
     ⚠ ไม่แตะ passiveLiveness · ไม่แตะเกณฑ์ · ไม่แตะ Threshold · ไม่แตะ PASS/FAIL criteria */
  function grabFramesMore(seed, maxTotal, onTick, alive, stopWhen) {
    var live = (typeof alive === 'function') ? alive : function () { return !!S.running; };
    return recogLoad().then(function () {
      if (!S.running || !live()) throw AbortAttendanceError();
      return grabFramesLoop(maxTotal, onTick, live, seed, stopWhen);
    });
  }

  /* ขอให้กระพริบตา — ใช้เมื่อ Passive ก้ำกึ่ง
     [alive] เป็นพารามิเตอร์ทางเลือก (Owner ของผู้เรียก เช่น enAlive() ของ Enrollment Run)
     ไม่ส่งมา = พฤติกรรมเดิมทุกประการ ผู้เรียกเดิม (Face Attendance / Face Login) จึงไม่กระทบ
     ส่งมา = ตรวจ Owner ทุก Async Boundary แล้วยกเลิกเงียบด้วย Cancellation Sentinel

     [PERF] เดิมเรียก detect() ซึ่งคำนวณ Descriptor ทุกเฟรมนานสูงสุด 9 วินาที
     แต่ลูปนี้อ่านเฉพาะ r[0].landmarks ผ่าน eyeOpen() — ไม่แตะ r[0].descriptor เลยแม้แต่ครั้งเดียว
     จึงเปลี่ยนเป็น detectGuide() (Detector + Landmark) ตัด Recognition inference ที่ไม่ได้ใช้ทิ้ง
     ⚠ เกณฑ์และ Logic เดิมคงไว้ครบ: seenOpen ที่ ear > 0.26 · seenClose ที่ ear < 0.17 ·
        Timeout 9000 ms · ต้องพบใบหน้าเดียว · ข้อความ onTick เดิมทุกตัวอักษร
     ผลพลอยได้: Blink ไม่ต้องรอ Recognition Model อีกต่อไป */
  function blinkChallenge(onTick, alive, inferTimeoutMs) {
    var live = (typeof alive === 'function') ? alive : null;
    var seenOpen = false, seenClose = false, t0 = Date.now();
    return new Promise(function (res, rej) {
      (function loop() {
        if (!S.running) return rej(new Error('ยกเลิกแล้ว'));
        if (live && !live()) return rej(AbortAttendanceError());   // ก่อน detect
        if (Date.now() - t0 > 9000) return res(false);
        detectGuide(inferTimeoutMs).then(function (r) {
          if (live && !live()) return rej(AbortAttendanceError()); // detect ตอบหลังหมดอายุ
          if (r.length === 1) {
            var e = eyeOpen(r[0].landmarks);
            if (e != null) {
              if (e > 0.26) seenOpen = true;
              if (seenOpen && e < 0.17) seenClose = true;
              if (seenOpen && seenClose) return res(true);
            }
            if (onTick) onTick('กรุณากระพริบตา 1 ครั้ง');
          } else if (onTick) onTick('จัดใบหน้าให้อยู่ในกรอบ');
          if (live && !live()) return rej(AbortAttendanceError()); // ก่อน RAF
          S.raf = requestAnimationFrame(loop);
        }).catch(rej);
      })();
    });
  }

  /* ---------- Snapshot ---------- */
  function snapshotBlob() {
    var tEnc = perfNow();
    return new Promise(function (res) {
      var c = S.canvas, vw = S.video.videoWidth || 640, vh = S.video.videoHeight || 480;
      var scale = Math.min(1, 480 / Math.max(vw, vh));
      c.width = Math.round(vw * scale); c.height = Math.round(vh * scale);
      c.getContext('2d').drawImage(S.video, 0, 0, c.width, c.height);
      c.toBlob(function (b) {
        perfMark('snapshot_encode_ms', tEnc);
        perfSet('snapshot_bytes', b ? b.size : 0);
        res(b);
      }, 'image/jpeg', 0.82);
    });
  }
  /* [ข้อ 3] จอง Signed Upload URL ล่วงหน้า (ยังไม่มี Blob จึงไม่ส่ง size)
     ปลอดภัยเพราะบัคเก็ต njhr-face ถูกบังคับที่ชั้น Storage จริงแล้ว
     (file_size_limit 3 MB · allowed_mime_types image/jpeg) — Storage เป็นผู้ Reject
     การจองไม่สร้าง Object ใด ๆ ถ้าไม่มี PUT ตามมา จึงไม่เกิดไฟล์ขยะเมื่อผู้ใช้ Cancel */
  var SNAP_MAX = 3 * 1024 * 1024;
  function reserveUpload(kind, action, employeeId) {
    return fn('upload-url', {
      kind: kind, punch_action: action || null,
      employee_id: employeeId || null
    });
  }

  /* PUT ขึ้น URL ที่จองไว้ — ถ้าไม่มีการจอง (หรือจองล้มเหลว) ให้ขอใหม่พร้อม size จริง */
  function putSnapshot(blob, resv, kind, action, employeeId) {
    if (!blob) return Promise.resolve(null);
    if (blob.size > SNAP_MAX) {               // Defense-in-depth ฝั่ง Client
      return Promise.reject(new Error('รูปหลักฐานใหญ่เกิน 3 MB'));
    }
    var got = resv ? Promise.resolve(resv)
                   : fn('upload-url', { kind: kind, punch_action: action || null,
                                        employee_id: employeeId || null, size: blob.size });
    return got.then(function (r) {
      var tPut = perfNow();                    // [UPLOAD] เวลา PUT จริง
      return fetchT(r.upload_url,
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ')
        .then(function (up) {
          perfMark('snapshot_put_ms', tPut);   // สำเร็จ
          if (!up.ok) {
            njfReport('EDGE_FAIL', 'njhr-face/signed-put', { message: 'HTTP ' + up.status });
            throw njfMark(new Error('อัปโหลดภาพไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
          }
          return r.path;
        })['catch'](function (e) {
          perfMark('snapshot_put_ms', tPut);   // ล้มเหลวก็ต้องมีตัวเลข
          /* ห้าม log: Signed URL · เนื้อไฟล์ · token · รูปใบหน้า */
          if (!njfDone(e)) njfReport('EDGE_FAIL', 'njhr-face/signed-put', e, 'transport');
          throw e;
        });
    });
  }

  function uploadSnapshot(blob, kind, action, employeeId) {
    if (!blob) return Promise.resolve(null);
    var tUp = perfNow();
    return fn('upload-url', {
      kind: kind, punch_action: action || null,
      employee_id: employeeId || null, size: blob.size
    }).then(function (r) {
      /* [Error Monitoring] Signed PUT ของ REQUEST / ENROLL
         ใช้ guard เดิม (njfMark/njfDone) กัน double-report
         isAborted → njfReport ข้ามให้เอง จึงไม่รายงานการยกเลิกตาม Flow ปกติ
         ห้าม log: Signed URL · รูปใบหน้า · เนื้อไฟล์ · token */
      return fetchT(r.upload_url,
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ')
        .then(function (up) {
          if (!up.ok) {
            njfReport('EDGE_FAIL', 'njhr-face/signed-put',
                      { message: 'HTTP ' + up.status }, 'kind=' + String(kind || ''));
            throw njfMark(new Error('อัปโหลดภาพไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
          }
          perfMark('snapshot_upload_ms', tUp);
          return r.path;
        })['catch'](function (e) {
          if (!njfDone(e)) njfReport('EDGE_FAIL', 'njhr-face/signed-put', e,
                                     'transport kind=' + String(kind || ''));
          throw e;
        });
    });
  }
  function snapshotUrl(path) {
    if (!path) return Promise.resolve('');
    return fn('view-url', { path: path }).then(function (r) { return r.url || ''; });
  }

  /* ---------- GPS ---------- */
  /* ---------- GPS ----------
     [PERF/หลักฐาน] เดิมใช้ getCurrentPosition ครั้งเดียวตอนเริ่มกดลงเวลา
     แต่ RPC njhr_att_punch_face ถูกส่งหลังสแกนใบหน้าเสร็จ (ห่างกันหลายวินาที)
     พิกัดที่เป็นหลักฐานจึงเป็น Fix "ตอนเริ่ม" ซึ่งเก่าที่สุดและมักหยาบที่สุด
     (ช่วงแรกของ Cold Start ค่า accuracy ยังกว้าง แล้วค่อยแคบลงเรื่อย ๆ)

     เปลี่ยนเป็น watchPosition ที่เดินคู่ไปกับการสแกนใบหน้า แล้ว "ใช้ Fix ล่าสุด
     ณ เวลาที่จะส่งจริง" — ได้ทั้งเร็วขึ้น (ไม่ต้อง Cold Start ใหม่หลังสแกน)
     และหลักฐานสดกว่าเดิม

     คงไว้ครบทุกตัว ไม่ผ่อนอะไรเลย:
       enableHighAccuracy: true · maximumAge: 0 · timeout: 12000
     ห้ามใช้พิกัดข้ามรอบ: gpsStart() สร้าง Session ใหม่ทุกครั้งที่กดลงเวลา
     ค่าที่เก็บได้จากรอบก่อนถูกทิ้งทั้งหมด และ gpsStop() ปิด watch เสมอ
     accuracy ที่ส่งไปเป็นค่าจริงของ Fix นั้น — Server ยังตรวจ
     accuracy ≤ max_accuracy และ distance ≤ radius เหมือนเดิมทุกประการ */
  var G = { id: 0, err: null, first: null, fixes: [], sid: 0, denied: false,
            /* [GPS WARMUP] ข้อมูล Session ต่อเนื่องของหน้าลงเวลา
               warm     = watcher นี้เริ่มจาก attGpsWarmup (ไม่ใช่จากการกดปุ่ม)
               startedAt= เวลาที่ watcher เริ่มเดิน
               owner    = token+employee_id เจ้าของ Session — เปลี่ยนคน/Logout = ทิ้งทั้งชุด */
            warm: false, startedAt: 0, owner: '' };

  /* เจ้าของ GPS Session ปัจจุบัน — ผูกกับ Login Session + Employee
     ใช้กันไม่ให้ Fix ของคนก่อนหน้าถูกนำมาใช้ต่อหลัง Logout/สลับบัญชี */
  /* [ROOT CAUSE 2] เดิมเรียก sbToken() ซึ่ง "ไม่มีประกาศในไฟล์นี้" → ReferenceError ทุกครั้ง
     → catch คืน '' → Owner Key ว่างเสมอ → กันสลับบัญชี/Logout ใช้ไม่ได้จริง
     ของใหม่ใช้ token() (L55 ในไฟล์นี้) + currentSessionEmployeeId() ที่มีอยู่แล้ว
     ⚠ ไม่ Log Token · ไม่ Persist Owner Key · เก็บเฉพาะในหน่วยความจำของหน้า
        และตัดเหลือ 24 ตัวท้ายเหมือนเดิม เพื่อไม่ให้ Token เต็มไปอยู่ใน State ใด ๆ */
  function gpsOwnerKey() {
    try {
      var t = '';
      try { t = token() || ''; } catch (e1) { t = ''; }
      var e = '';
      try { e = currentSessionEmployeeId() || ''; } catch (e3) { e = ''; }
      if (!e) e = (S.ctx && S.ctx.employee_id) || '';
      return String(t).slice(-24) + '|' + String(e);
    } catch (e2) { return ''; }
  }

  /* หน้าต่างความสดของ Fix ณ วินาทีที่ส่ง (มิลลิวินาที)
     ที่มา: watchPosition ยิง Fix ราว 1 ครั้ง/วินาที → 3000ms ครอบคลุม ~3 Fix สุดท้าย
     เพียงพอให้เลือกตัวที่แม่นที่สุด โดยไม่ย้อนไปไกลจนกลายเป็นตำแหน่งเก่า */
  var GPS_FRESH_MS = 3000;
  /* ถ้ายังไม่มี Fix สดตอนจะส่ง ให้รอ Fix ใหม่ได้นานสุดเท่านี้ แล้ว Fail Closed
     ไม่ใช่ค่าสุ่ม: = หน้าต่างความสด + 1 รอบ watch (ราว 1 วินาที) */
  var GPS_WAIT_MS = 4000;

  /* [ROOT CAUSE 4] First Fix Deadline — ต้องเท่ากับกรอบที่ให้ Browser จริง
     ปัญหาเดิม: watchPosition ตั้ง timeout: 12000 แต่ gpsFresh() ยอมรอแค่ GPS_WAIT_MS (4000)
     Cold GPS ที่ได้ Fix แรกวินาทีที่ 5–12 จึงถูก Fail ทิ้งทั้งที่ Browser ยังทำงานอยู่
     ของใหม่แยกสองกรอบชัดเจน:
       · ยังไม่เคยได้ Fix เลยในรอบนี้  → รอถึง GPS_FIRST_MS นับจาก G.startedAt (12 วินาที)
       · มี Fix แล้วแต่ต้องการตัวที่สดกว่า → ใช้กรอบสั้นเดิม GPS_WAIT_MS (4 วินาที)
     ⚠ PERMISSION_DENIED (code 1) ยัง Fail ทันทีเหมือนเดิม ไม่รอครบกรอบ
       และไม่แตะ accuracy เลย — Server ยังตรวจ max_accuracy + radius เหมือนเดิมทุกประการ */
  var GPS_FIRST_MS = 12000;

  /* [ROOT CAUSE 3+4] หน้าต่างความสดตอน watcher "ยังเดินอยู่จริง"
     ปัญหาเดิม: สแกนใบหน้าใช้เวลามากกว่า 3 วินาทีเสมอ พอถึงเวลาส่ง RPC
     Fix ทุกตัวจึงพ้น GPS_FRESH_MS → gpsFresh() ต้องรอ Fix ใหม่อีกสูงสุด 4 วินาที
     = อาการ "สแกนหน้าเสร็จแล้วยังหมุนรอ GPS" ที่พนักงานเจอ

     ของใหม่: ถ้า watcher ยัง Active · Session เดิม · ไม่มี error · ไม่ถูก deny
     ให้ยอมรับ Fix ที่ใหม่กว่า GPS_LIVE_MS ได้ เพราะ watcher ยิง Fix ต่อเนื่องอยู่แล้ว
     "Fix ล่าสุดของ watcher ที่ยังเดินอยู่" = ตำแหน่งปัจจุบันจริง ไม่ใช่ตำแหน่งเก่า

     ⚠ ยังมีเพดานเวลาเสมอ ไม่ใช่ยอมรับ Fix อายุเท่าไรก็ได้
        และไม่แตะ accuracy เลย — Server ยังตรวจ max_accuracy + radius เหมือนเดิม
     30000ms = watcher ยิงราว 1 ครั้ง/วินาที ถ้าเงียบเกิน 30 วินาที ถือว่าผิดปกติ
     ให้กลับไปใช้เกณฑ์เข้มเดิม (GPS_FRESH_MS) แทน */
  var GPS_LIVE_MS = 30000;

  /* watcher ยังเดินอยู่จริงและเชื่อถือได้สำหรับ sid นี้หรือไม่ */
  function gpsWatchAlive(sid) {
    return !!(G.id && sid === G.sid && !G.denied && !G.err);
  }

  /* ---------- [ROOT CAUSE 5] GPS/Geofence Preflight ----------
     ปัญหาเดิม: หน้าเว็บถือว่า "GPS พร้อม" เมื่อมี Fix ใด ๆ ก็ได้
     แต่ฝั่ง SQL njhr_gf_check ตรวจครบทั้ง 4 ชั้น:
       accuracy ≤ max_accuracy (50 ม.) · พนักงานได้รับพื้นที่ไหม · ระยะทาง · radius
     ผลคือพนักงานสแกนหน้าจนครบแล้วค่อยรู้ว่า "นอกพื้นที่" หรือ "GPS ไม่แม่นพอ"
     ของใหม่เรียก njhr_gf_check เป็นด่านก่อนเปิดกล้อง — ใช้ RPC เดิม ไม่มี SQL ใหม่
     ⚠ ไม่ตัดการตรวจใน njhr_att_punch_face ออก — Server ยังตรวจซ้ำก่อนบันทึกทุกครั้ง
        Preflight นี้เป็นการ "แจ้งเตือนล่วงหน้า" ไม่ใช่การอนุมัติ */

  /* ผู้ฟังสถานะ GPS — หน้าลงเวลาสมัครไว้เพื่ออัปเดตจอทันทีจาก Callback */
  var GPS_SUBS = [];
  function gpsSubscribe(fn2) {
    if (typeof fn2 !== 'function') return function () {};
    GPS_SUBS.push(fn2);
    return function () {
      var i = GPS_SUBS.indexOf(fn2);
      if (i >= 0) GPS_SUBS.splice(i, 1);
    };
  }
  function gpsNotify() {
    for (var i = 0; i < GPS_SUBS.length; i++) {
      try { GPS_SUBS[i](); } catch (e) {}
    }
  }

  /* ผล Preflight ล่าสุด + ตัวกันยิงซ้อน
     key = sid|lat|lng|accuracy ที่ปัดแล้ว — Fix เดิมไม่ยิงซ้ำ
     inflight = อนุญาตให้มี Request เดียวเท่านั้นในเวลาเดียวกัน */
  /* [GF] inflight ผูกกับ {sid,key,gen} ของ Request ที่กำลังทำงานจริง
     Fix ใหม่ที่ key ต่างออกไป จะต้องไม่ได้รับผลของ Fix เก่าเด็ดขาด — Fail Closed
     gen = Generation ของ GF ทั้งชุด เพิ่มทุกครั้งที่ Session เปลี่ยน/รีเซ็ต */
  var GF = { key: '', inflight: null, inflightSid: 0, inflightKey: '', inflightGen: 0,
             gen: 0, val: null, at: 0, sid: 0, err: '' };
  /* [GF CACHE] อายุสูงสุดของผล njhr_gf_check ที่นำกลับมาใช้ซ้ำได้
     ใช้ซ้ำได้ก็ต่อเมื่อครบทุกเงื่อนไขพร้อมกัน:
       sid เดิม · gfKey เดิม (พิกัด+accuracy ที่ปัดแล้วเท่ากัน) · pass === true · อายุ ≤ 3 วินาที
     ขาดข้อใดข้อหนึ่ง = ยิง RPC ใหม่และ Fail Closed
     ⚠ njhr_att_punch_face ยังตรวจ Geofence ซ้ำฝั่ง Server ก่อนบันทึกทุกครั้งเหมือนเดิม */
  var GF_REUSE_MS = 3000;

  function gfKey(sid, fix) {
    return String(sid) + '|' + fix.lat.toFixed(5) + '|' + fix.lng.toFixed(5) +
           '|' + Math.round(fix.accuracy);
  }

  function gfReset() {
    var g = GF.gen + 1;                        // ผลของ Request เก่าทั้งหมดหมดสิทธิ์ทันที
    GF = { key: '', inflight: null, inflightSid: 0, inflightKey: '', inflightGen: g,
           gen: g, val: null, at: 0, sid: 0, err: '' };
  }

  /* คืนผลที่ "ใช้ซ้ำได้จริง" สำหรับ fix ที่ให้มา — ไม่ผ่านเงื่อนไขใดเงื่อนไขหนึ่ง = null
     ไม่มีการยิง RPC ในฟังก์ชันนี้ ปลอดภัยที่จะเรียกถี่ ๆ จาก UI */
  function gfCacheValid(fix) {
    if (!fix || fix.ok === false || fix.lat == null || fix.lng == null) return null;
    if (!GF.val || GF.val.pass !== true) return null;              // pass=false ห้ามใช้ซ้ำ
    var sid = fix.sid || G.sid;
    if (GF.sid !== sid || sid !== G.sid) return null;              // Session เปลี่ยน
    if (GF.key !== gfKey(sid, fix)) return null;                   // Fix คนละจุด/คนละความแม่น
    if (!GF.at || (Date.now() - GF.at) > GF_REUSE_MS) return null; // ผลหมดอายุ
    return GF.val;
  }

  /* เรียก njhr_gf_check กับ Fix ที่ให้มา — คืน Promise ของผลจริงจากเซิร์ฟเวอร์
     ห้ามยิงซ้อน · ใช้ผลซ้ำได้เฉพาะที่ผ่าน gfCacheValid() เท่านั้น */
  function gfCheck(fix, force) {
    if (!fix || fix.ok === false || fix.lat == null || fix.lng == null) {
      return Promise.resolve(null);
    }
    var k = gfKey(fix.sid || G.sid, fix);
    /* [GF CACHE] ใช้ซ้ำได้เฉพาะผลที่ผ่านเงื่อนไขครบทุกข้อเท่านั้น
       force = true (กดปุ่มลงเวลา / กดตรวจตำแหน่งอีกครั้ง) จะไม่ใช้ Cache เสมอ */
    if (!force) {
      var cached = gfCacheValid(fix);
      if (cached) { perfBootCount('gf_cache_hits'); return Promise.resolve(cached); }
    }
    var mySid = fix.sid || G.sid;
    var myGen = GF.gen;
    /* [GF INFLIGHT] มี Request ค้างอยู่ —
       ตรงทั้ง sid + key + gen เท่านั้นจึงใช้ผลร่วมกันได้
       ถ้า Fix เปลี่ยน (key ต่าง) ต้องรอให้ตัวเก่าจบ แล้วตรวจ Cache ด้วย Fix ใหม่อีกครั้ง
       ถ้ายังใช้ไม่ได้ = ยิง Request ใหม่ ห้ามคืนผลของ Fix เก่าเด็ดขาด */
    if (GF.inflight) {
      if (GF.inflightSid === mySid && GF.inflightKey === k && GF.inflightGen === myGen) {
        return GF.inflight;
      }
      return GF.inflight['catch'](function () { return null; }).then(function () {
        if (myGen !== GF.gen || mySid !== G.sid) return null;   // Session/Generation เปลี่ยน
        var c2 = force ? null : gfCacheValid(fix);
        if (c2) { perfBootCount('gf_cache_hits'); return c2; }
        return gfCheck(fix, force);                            // ยิงใหม่ด้วย Fix ปัจจุบัน
      });
    }
    var t0 = perfNow();
    perfBootCount('njhr_gf_check_calls');                      // นับก่อนยิงจริง
    GF.inflightSid = mySid; GF.inflightKey = k; GF.inflightGen = myGen;
    GF.inflight = rpcRows('njhr_gf_check', {
      p_token: token(), p_lat: fix.lat, p_lng: fix.lng, p_accuracy: fix.accuracy
    }).then(function (rows) {
      GF.inflight = null; GF.inflightKey = ''; GF.at = Date.now();
      var r = (rows && rows.length) ? rows[0] : null;
      if (myGen !== GF.gen) return null;                       // Generation เปลี่ยน = ทิ้งผล
      if (mySid !== G.sid) return null;                        // Session เปลี่ยน = ทิ้งผล
      perfMark('gps_preflight_ms', t0);
      GF.key = k; GF.sid = mySid; GF.err = '';
      /* [GPS] Fix แรกของ Session นี้ที่ผ่านการตรวจของเซิร์ฟเวอร์จริง (pass=true)
         แยกจาก gps_first_fix_ms ซึ่งเป็น Fix แรกที่อ่านได้เฉย ๆ
         ไม่ hardcode max_accuracy ฝั่ง Client — ใช้คำตอบจริงจาก njhr_gf_check */
      if (r && r.pass === true && PERF.boot.marks.gps_usable_fix_ms == null) {
        perfBootSet('gps_usable_fix_ms', Math.max(0, (fix.at || Date.now()) - (G.startedAt || Date.now())));
      }
      GF.val = r ? {
        pass: r.pass === true,
        reason: r.reason || '',
        geofence_name: r.geofence_name || '',
        distance_m: r.distance_m == null ? null : Number(r.distance_m),
        radius: r.radius == null ? null : Number(r.radius),
        accuracy: Math.round(fix.accuracy)
      } : null;
      return GF.val;
    }, function (e) {
      GF.inflight = null; GF.inflightKey = ''; GF.at = Date.now();
      GF.err = (e && e.message) || 'ตรวจพื้นที่ลงเวลาไม่สำเร็จ';
      njfReport('JS_ERROR', 'face/gps-preflight', e,
                'gps error_code=- accuracy_m=' + Math.round(fix.accuracy) +
                ' build=' + String(w.NJHR_BUILD_VERSION || ''));
      return null;
    });
    return GF.inflight;
  }

  /* Preflight แบบครบวงจรสำหรับหน้าลงเวลา:
     มี Fix สดของ Session ที่อุ่นไว้ → ยิง njhr_gf_check → คืนผลจริง
     ไม่มี Fix → คืน { stage:'GPS' } ให้ UI แสดงว่ายังหาตำแหน่งอยู่ */
  function gpsPreflight(force) {
    var sid = G.sid;
    if (G.denied) {
      return Promise.resolve({ stage: 'GPS', pass: false, denied: true,
        reason: G.err || 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง' });
    }
    var fix = gpsPickFresh(sid);
    if (!fix) {
      return Promise.resolve({ stage: 'GPS', pass: false,
        reason: G.err || '', hasFix: !!(G.fixes && G.fixes.length) });
    }
    return gfCheck(fix, force).then(function (r) {
      if (!r) {
        return { stage: 'CHECK', pass: false, accuracy: Math.round(fix.accuracy),
                 reason: GF.err || 'ตรวจพื้นที่ลงเวลาไม่สำเร็จ กรุณาลองใหม่' };
      }
      return {
        stage: 'CHECK', pass: r.pass, reason: r.reason,
        accuracy: r.accuracy, geofence_name: r.geofence_name,
        distance_m: r.distance_m, radius: r.radius
      };
    });
  }

  /* [ข้อ 1] gpsStop ต้องระบุ sid เจ้าของเสมอ — Async ของ Attempt เก่าที่มาช้า
     จะหยุด watch ของ Attempt ใหม่ไม่ได้เด็ดขาด */
  function gpsStop(expectedSid) {
    if (expectedSid !== undefined && expectedSid !== G.sid) return;   // ไม่ใช่เจ้าของ = ไม่แตะ
    if (G.id && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(G.id); } catch (e) {}
    }
    G.id = 0;
  }

  /* [GPS WARMUP] เริ่ม watcher ล่วงหน้าตั้งแต่เปิดหน้าลงเวลา (Mobile เท่านั้น)
     คืน sid ของ Session ที่ใช้อยู่ — ถ้ามี Session ที่ยังเดินอยู่และเจ้าของเดิม จะใช้ต่อ ไม่ restart

     ทำไมต้องมี: gpsStart() เดิมถูกเรียกตอน "กดปุ่มลงเวลา" เท่านั้น GPS จึงเริ่ม Cold
     ทุกครั้ง ผู้ใช้ต้องรอ First Fix หลังกดปุ่มเสมอ
     ของใหม่เริ่มตั้งแต่เข้าหน้า → พอกดปุ่มมักมี Fix พร้อมอยู่แล้ว

     ⚠ ความปลอดภัย: ผูก Session กับ token+employee_id (gpsOwnerKey)
        เปลี่ยนคน/Logout/Login ใหม่ = owner ไม่ตรง → ทิ้ง Fix เดิมทั้งหมดแล้วเริ่มใหม่
        ไม่มีการ persist ลง storage ใด ๆ · อยู่ในหน่วยความจำของหน้าเท่านั้น */
  /* หน้าลงเวลาสั่งเปิด Warmup ไว้หรือไม่ — ใช้ตัดสินว่าหลังปิดจอสแกนควรอุ่นต่อไหม */
  var GPS_WARM_WANTED = false;

  function gpsWarmStart() {
    var key = gpsOwnerKey();
    if (G.id && G.owner === key && !G.denied) return G.sid;   // เดินอยู่แล้วและเจ้าของเดิม = ใช้ต่อ
    var sid = gpsStart();
    G.warm = true;
    G.owner = key;
    G.startedAt = Date.now();
    return sid;
  }

  /* [GPS WARMUP] สถานะสำหรับ UI — ไม่เปิดพิกัดออกไป คืนเฉพาะที่จำเป็นต่อการแสดงผล */
  function gpsWarmState() {
    var sid = G.sid;
    var alive = gpsWatchAlive(sid);
    var best = alive ? gpsPickFresh(sid) : null;
    return {
      active: !!G.id,
      denied: !!G.denied,
      error: G.err || '',
      hasFix: !!(G.fixes && G.fixes.length),
      ready: !!best,
      accuracy: best ? Math.round(best.accuracy) : null,
      ageMs: best ? (Date.now() - best.at) : null
    };
  }

  /* ขึ้น Punch Session ใหม่ — คืน sid ให้ผู้เรียกถือไว้เป็นเจ้าของ */
  function gpsStart() {
    gpsStop();                                   // ปิด watch ของ Attempt ก่อนหน้าแบบไม่มีเงื่อนไข
    G.sid++; G.err = null; G.first = null; G.fixes = []; G.denied = false;
    G.warm = false; G.owner = gpsOwnerKey(); G.startedAt = Date.now();
    var mySid = G.sid;
    if (!navigator.geolocation) {
      G.err = 'อุปกรณ์นี้ไม่รองรับ GPS';
      G.first = Promise.resolve({ ok: false, reason: G.err });
      return mySid;
    }
    var settle = null;
    G.first = new Promise(function (res) { settle = res; });
    G.id = navigator.geolocation.watchPosition(function (p) {
      if (mySid !== G.sid) return;               // Fix จาก Session เก่า = ทิ้ง
      G.err = null;
      /* [ข้อ 2] ใช้ position.timestamp จริงเมื่อมี — เป็นเวลาที่อุปกรณ์ได้พิกัดนั้นจริง
         ไม่ใช่เวลาที่ callback ถูกเรียก (ซึ่งอาจช้ากว่าเมื่อ main thread ติด) */
      var at = (p && typeof p.timestamp === 'number' && p.timestamp > 0) ? p.timestamp : Date.now();
      var fx = { ok: true, lat: p.coords.latitude, lng: p.coords.longitude,
                 accuracy: p.coords.accuracy, at: at, sid: mySid };
      /* [INSTRUMENTATION] gps_first_fix_ms = Fix แรกจริงของ Session นี้
         คิดจาก G.startedAt (ตอน watcher เริ่มเดิน = ตอน Warmup) ไม่ใช่ตอนกดปุ่ม */
      if (!G.fixes.length) perfBootSet('gps_first_fix_ms', Math.max(0, at - (G.startedAt || at)));
      G.fixes.push(fx);
      if (G.fixes.length > 20) G.fixes.shift();  // กันหน่วยความจำโตไม่จำกัด
      if (settle) { settle(fx); settle = null; } // Fix แรก = แจ้งสถานะบนจอ
      gpsNotify();                               // [ROOT CAUSE 5] อัปเดต UI จาก Callback ทันที
    }, function (e) {
      if (mySid !== G.sid) return;
      /* [ข้อ 5] PERMISSION_DENIED (code 1) เป็น Terminal — รอต่อไปก็ไม่มีทางได้ Fix
         จึงตั้ง denied เพื่อให้ gpsFresh() Fail Closed ทันที ไม่รอ GPS_WAIT_MS เต็ม
         ส่วน POSITION_UNAVAILABLE (2) / TIMEOUT (3) เป็นความผิดพลาดชั่วคราว
         ยังมีโอกาสได้ Fix จึงต้องรอต่อจนครบหน้าต่างเวลา ห้าม Fail เร็ว */
      G.denied = (e && e.code === 1);
      G.err = G.denied
        ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — เปิดสิทธิ์ตำแหน่งของเบราว์เซอร์แล้วลองใหม่'
        : 'ไม่สามารถอ่าน GPS ได้ กรุณาลองใหม่กลางที่โล่ง';
      /* [ROOT CAUSE 8] รายงานเฉพาะ Error Code · เวลาถึง Fix แรก · จำนวน Fix
         ⚠ ห้าม lat/lng · ห้าม Token · ห้าม Descriptor · ห้ามรูป · ห้าม Device ID
         รายงานครั้งเดียวต่อ Session (njErrPost มี de-dup ด้วย signature อยู่แล้ว) */
      try {
        var dvg = deviceInfo();
        njfReport('JS_ERROR', 'face/gps',
          { message: 'geolocation error code=' + ((e && e.code) || '-') },
          'gps_error_code=' + ((e && e.code) || '-') +
          ' had_fix=' + (G.fixes.length ? 'true' : 'false') +
          ' time_to_first_fix_ms=' + (G.fixes.length ? (G.fixes[0].at - G.startedAt) : -1) +
          ' browser=' + dvg.browser + ' os=' + dvg.os + ' device=' + dvg.device +
          ' build=' + String(w.NJHR_BUILD_VERSION || ''));
      } catch (eg) {}
      if (settle && !G.fixes.length) { settle({ ok: false, reason: G.err }); settle = null; }
      gpsNotify();                               // [ROOT CAUSE 5] แจ้ง UI ทันทีเมื่อสถานะเปลี่ยน
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    return mySid;
  }

  /* คืน Fix ที่ "สดจริง" และแม่นที่สุดของ Punch Session ที่ระบุ — ไม่มีก็คืน null
     [ข้อ 2] ไม่มี fallback ไป Fix ที่พ้นหน้าต่างความสดอีกต่อไป */
  function gpsPickFresh(sid) {
    var now = Date.now();
    /* watcher ยังเดินอยู่ = ใช้หน้าต่างกว้างขึ้น (ดูเหตุผลที่ GPS_LIVE_MS)
       watcher หยุด/มี error = กลับไปใช้เกณฑ์เข้มเดิมทันที */
    var win = gpsWatchAlive(sid) ? GPS_LIVE_MS : GPS_FRESH_MS;
    var fresh = G.fixes.filter(function (f) {
      return f.sid === sid && (now - f.at) <= win;
    });
    if (!fresh.length) return null;
    var best = fresh[0];
    for (var i = 1; i < fresh.length; i++) {
      var f = fresh[i];
      if (f.accuracy < best.accuracy || (f.accuracy === best.accuracy && f.at > best.at)) best = f;
    }
    return best;
  }

  /* ใช้ตอนกำลังจะส่ง RPC เท่านั้น
     มี Fix สด → ใช้ทันที · ยังไม่มี → รอ Fix ใหม่สั้น ๆ · ยังไม่ได้อีก → Fail Closed
     ห้ามส่ง Fix เก่าไปให้ njhr_att_punch_face เด็ดขาด */
  function gpsFresh(sid) {
    var p = gpsPickFresh(sid);
    if (p) return Promise.resolve(p);
    if (sid !== G.sid) {
      return Promise.resolve({ ok: false, reason: 'การลงเวลารอบนี้ถูกยกเลิกแล้ว' });
    }
    return new Promise(function (res) {
      var t0 = Date.now(), iv = 0, done = false;
      /* [ROOT CAUSE 4] เลือกกรอบเวลาตามสถานะจริงของ Session นี้
         ยังไม่เคยได้ Fix เลย = First Fix Deadline (นับจากตอน watcher เริ่มเดิน)
         มี Fix แล้ว = กรอบสั้นเดิมสำหรับหา Fix ที่สดกว่า */
      var coldStart = !G.fixes.length;
      var startedAt = G.startedAt || t0;
      function deadlineReached() {
        if (G.fixes.length || !coldStart) return (Date.now() - t0) >= GPS_WAIT_MS;
        /* ยังไม่มี Fix เลย — ให้เวลาเท่ากับที่ให้ watchPosition จริง แต่ไม่ต่ำกว่ากรอบสั้นเดิม */
        var byFirst = (Date.now() - startedAt) >= GPS_FIRST_MS;
        var byWait  = (Date.now() - t0) >= GPS_WAIT_MS;
        return byFirst && byWait;
      }
      function finish(v) { if (done) return; done = true; if (iv) clearInterval(iv); res(v); }
      iv = setInterval(function () {
        if (sid !== G.sid) {
          return finish({ ok: false, reason: 'การลงเวลารอบนี้ถูกยกเลิกแล้ว' });
        }
        var q = gpsPickFresh(sid);
        if (q) return finish(q);
        /* [ข้อ 5] ไม่ได้รับอนุญาต + ยังไม่มี Fix เลย = รอต่อไม่มีประโยชน์ (Fail ทันที) */
        if (G.denied && !G.fixes.length) return finish({ ok: false, reason: G.err });
        /* POSITION_UNAVAILABLE (2) / TIMEOUT (3) เป็นความผิดพลาดชั่วคราว
           ห้าม Fail ก่อนครบ First Fix Deadline — ยังมีโอกาสได้ Fix */
        if (deadlineReached()) {
          finish({ ok: false, reason: G.err ||
            'GPS ยังไม่พร้อม (ยังไม่ได้ตำแหน่งที่สดพอ) กรุณาลองใหม่กลางที่โล่ง' });
        }
      }, 250);
    });
  }

  /* ---------- หน้าจอ ---------- */
  function shell(title, sub) {
    addCss();
    var el = d.createElement('div');
    el.className = 'njf-overlay';
    el.innerHTML =
      '<div class="njf-top"><button class="njf-back" id="njf-x" aria-label="ปิด">&#10005;</button>' +
      '<div><b>' + esc(title) + '</b><small>' + esc(sub || 'NJL HR') + '</small></div></div>' +
      '<div class="njf-cam"><video id="njf-v" muted playsinline></video><canvas id="njf-c"></canvas>' +
      '<div class="njf-guide"><span class="njf-corner tl"></span><span class="njf-corner tr"></span>' +
      '<span class="njf-corner bl"></span><span class="njf-corner br"></span>' +
      '<div class="njf-oval" id="njf-oval"></div>' +
      /* [UI] วงแหวนความคืบหน้ารอบใบหน้า — SVG ซ้อนบน .njf-oval พอดี
         วาดเป็นวงกลม stroke-dasharray แล้วเลื่อน stroke-dashoffset ตามจำนวนมุมที่ผ่าน
         เป็น overlay ล้วน: pointer-events:none · ไม่แตะ <video> · ไม่แตะ <canvas>
         ที่ใช้จับภาพ จึงไม่กระทบการตรวจใบหน้า/คุณภาพภาพ/Descriptor เลย */
      '<svg class="njf-ring" id="njf-ring" viewBox="0 0 120 160" aria-hidden="true">' +
      /* bg = วงพื้นจาง · dash = เส้นประที่ไหลรอบวง (บอกว่าระบบกำลังทำงาน)
         hint = ส่วนโค้งไฮไลต์ฝั่งที่ต้องหมุนไป · fg = ความคืบหน้าจริง */
      '<ellipse class="njf-ring-bg" cx="60" cy="80" rx="57" ry="77"></ellipse>' +
      '<ellipse class="njf-ring-dash" id="njf-ring-dash" cx="60" cy="80" rx="57" ry="77"></ellipse>' +
      '<ellipse class="njf-ring-hint" id="njf-ring-hint" cx="60" cy="80" rx="57" ry="77"></ellipse>' +
      '<ellipse class="njf-ring-live" id="njf-ring-live" cx="60" cy="80" rx="49" ry="68"></ellipse>' +
      '<ellipse class="njf-ring-fg" id="njf-ring-fg" cx="60" cy="80" rx="57" ry="77"></ellipse>' +
      '</svg>' +
      /* ลูกศรโค้งบอกทิศ — แสดงเฉพาะมุมซ้าย/ขวา · ✓ กลางวงเมื่อผ่าน */
      '<div class="njf-turn" id="njf-turn" aria-hidden="true"></div>' +
      '<div class="njf-ok" id="njf-ok" aria-hidden="true">&#10003;</div>' +
      '<div class="njf-hint"><b id="njf-h1">มองกล้องให้อยู่ในกรอบ</b>' +
      '<small id="njf-h2">กรุณาอย่าขยับใบหน้า</small></div></div></div>' +
      '<div class="njf-panel" id="njf-panel"></div>';
    d.body.appendChild(el);
    S.root = el;
    S.video = el.querySelector('#njf-v');
    S.canvas = el.querySelector('#njf-c');
    el.querySelector('#njf-x').onclick = close;
    return el;
  }
  function hint(a, b) {
    var h1 = S.root && S.root.querySelector('#njf-h1');
    var h2 = S.root && S.root.querySelector('#njf-h2');
    if (h1 && a != null) h1.textContent = a;
    if (h2 && b != null) h2.textContent = b;
  }
  function stepsHtml(state, msg, isErr) {
    /* แสดงเฉพาะขั้นที่มีอยู่ใน state จริง
       ⚠ เข้าสู่ระบบด้วยใบหน้าไม่ส่ง gps มา จึงต้องไม่โชว์ขั้น "ตรวจ GPS"
         (เดิมโชว์ตายตัว 3 ขั้น ทำให้ผู้ใช้เข้าใจผิดว่า Face Login ใช้ตำแหน่ง) */
    var names = [['ตรวจคนจริง', 'live'], ['เทียบใบหน้า', 'match'], ['ตรวจ GPS', 'gps']]
      .filter(function (n) {
        return Object.prototype.hasOwnProperty.call(state || {}, n[1]);
      });
    var icons = { live: '&#128100;', match: '&#128373;', gps: '&#128205;' };
    var txt = { wait: 'รอดำเนินการ', run: 'กำลังตรวจสอบ', ok: 'ผ่าน', bad: 'ไม่ผ่าน' };
    return '<div class="njf-steps">' + names.map(function (n, i) {
      var st = state[n[1]] || 'wait';
      return (i ? '<span class="njf-line"></span>' : '') +
        '<div class="njf-step ' + st + '"><div class="ico">' + icons[n[1]] + '</div>' +
        '<b>' + n[0] + '</b><small>' + txt[st] + '</small></div>';
    }).join('') + '</div>' +
    '<div class="njf-msg' + (isErr ? ' err' : '') + '" id="njf-msg">' + esc(msg || '') + '</div>' +
    '<div class="njf-actions" id="njf-act"></div>';
  }
  function panel(html) {
    var p = S.root && S.root.querySelector('#njf-panel');
    if (p) p.innerHTML = html;
  }
  function setMsg(t, err) {
    var m = S.root && S.root.querySelector('#njf-msg');
    if (m) { m.textContent = t || ''; m.className = 'njf-msg' + (err ? ' err' : ''); }
  }
  function actions(list) {
    var a = S.root && S.root.querySelector('#njf-act');
    if (!a) return;
    a.innerHTML = list.map(function (b, i) {
      return '<button class="njf-btn ' + (b.style || 'plain') + '" data-i="' + i + '">' + esc(b.label) + '</button>';
    }).join('');
    a.onclick = function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-i]') : null;
      if (!t) return;
      var h = list[Number(t.dataset.i)];
      if (h && h.on) h.on();
    };
  }
  /* [ข้อ 1] Handoff Close — ใช้เฉพาะตอน "ลงทะเบียนใบหน้าจากการลงเวลา" สำเร็จ
     แล้วต้องส่งต่อไป doPunch() ด้วย Operation ID เดิม
     ปิดกล้อง · cancel RAF · เอา Overlay ออก · reset S.busy
     แต่ **ไม่** opInvalidate() และ **ไม่** เปลี่ยน S.mode ออกจาก 'ATTENDANCE'
     (ต่างจาก close() ปกติที่ใช้กับ Cancel/Manual Enroll/Face Login/Route/Logout/Error) */
  function closeSoft() {
    closeCam();
    attAbortAll();                            // [ข้อ 4] Network ของขั้นลงทะเบียนต้องไม่ค้าง
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.root = null; S.busy = false;
    /* คง S.mode = 'ATTENDANCE' และ OP.id เดิมไว้ */
  }

  function close() {
    closeCam();                               // ปิดกล้อง + cancelAnimationFrame (ดู closeCam)
    G.sid++;                                  // Attempt (GPS) ปัจจุบันหมดสิทธิ์ทันที
    opInvalidate();                           // Attendance Operation หมดอายุทันที
    enInvalidate();                           // Enrollment Run ปัจจุบันหมดสิทธิ์
    FLOW.kind = ''; FLOW.op = -1;             // [ข้อ 5] ปิดหน้าจอ = จบ Punch Flow · Retry นับใหม่
    attAbortAll();                            // [ข้อ 4] ยกเลิก Network ของ Attempt นี้ทั้งหมด
    gpsStop();                                // ปิด watchPosition ทุกกรณีที่ปิดหน้าจอ
    /* [GPS WARMUP] ถ้าหน้าลงเวลาเปิด Warmup ไว้ ให้กลับไปอุ่นต่อหลังปิดจอสแกน
       เพื่อให้กดลงเวลาครั้งถัดไป GPS ยังพร้อมอยู่ ไม่ต้อง Cold Start ใหม่
       ปิดหน้า/ออกจาก Route จริง ๆ จะถูกหยุดด้วย NJHRFace.gpsWarmStop() จากฝั่งหน้าจอ */
    if (GPS_WARM_WANTED) { try { gpsWarmStart(); } catch (e3) {} }
    S.mode = '';
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.root = null; S.busy = false;
  }

  /* ---------- ลงเวลาด้วยใบหน้า ---------- */
  /* ---------- ลงเวลา ----------
     ถ้ายังไม่มีใบหน้าต้นแบบของพนักงานคนนี้ ให้ลงทะเบียน 3 มุมก่อนอัตโนมัติ
     แล้วจึงกลับมาลงเวลาตามปกติ (Face → Liveness → Snapshot ใหม่ → GPS → Geofence)
     ครั้งต่อไปจะข้ามขั้นลงทะเบียนทันที ไม่ต้องหันซ้าย-ขวาอีก */
  /* [ข้อ 1] Attendance Operation ID — ครอบทั้ง Operation ตั้งแต่ punch() ไม่ใช่แค่ doPunch()
     ครอบคลุมช่วงที่ faceStatus() / enroll ครั้งแรก กำลังรออยู่ ซึ่ง cancelAttendance()
     เดิมมองไม่เห็นเพราะ S.mode ยังไม่ถูกตั้ง
     invalidate เมื่อ: Cancel · Route Change · Logout · Session invalid · Retry */
  var OP = { id: 0 };
  /* [ข้อ 5] Punch Flow — ครอบ Attempt 1..N ของการกด IN/OUT ครั้งเดียวกัน
     ใช้ให้ "จำนวน Retry" นับต่อ Flow ไม่ใช่ต่อ Attempt
     เปลี่ยน kind (IN↔OUT) หรือขึ้น Operation ใหม่ = Flow ใหม่ · รีเซ็ตตัวนับ + Evidence */
  var FLOW = { id: 0, kind: '', op: -1 };
  /* [ข้อ 5] Enrollment Run generation — แยกจาก Attendance Operation
     ใช้กับทั้ง Manual Enrollment (Profile/HR) และ Enrollment ที่เกิดจากการลงเวลา */
  var EN = { id: 0 };
  function enInvalidate() { EN.id++; }
  function opStart() { S.mode = 'ATTENDANCE'; return ++OP.id; }
  function opAlive(myOp) { return myOp === OP.id && S.mode === 'ATTENDANCE'; }
  function opInvalidate() { OP.id++; }

  function punch(kind, onDone, inheritOp) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;
    /* เริ่ม Operation ทันที ก่อนยิง faceStatus() — ตั้งแต่วินาทีนี้
       cancelAttendance() รู้แล้วว่ามีงานลงเวลาค้างอยู่ */
    var myOp = (typeof inheritOp === 'number') ? inheritOp : opStart();

    /* [PERF] Face Status มาจาก Cache ที่ Preload ไว้ตั้งแต่เข้าหน้า Attendance
       ถ้า Cache พร้อม = ไม่ยิง njhr_face_status ซ้ำ เข้ากล้อง/GPS ได้ทันที
       ถ้ายังไม่พร้อม (Preload ล้มเหลว) = ถามเซิร์ฟเวอร์ตรงนี้ตามเส้นทางเดิม
       ทุกอุปกรณ์ (Desktop / Android / iOS / iPad) ใช้เส้นทางเดียวกันทั้งหมด
       employee_id มาจาก Session เท่านั้น — เลิกใช้ p_employee:null + แถวแรก */
    var tFs = perfNow();
    faceStatus()
      .then(function (has) {
        /* [E2E] เวลารอ njhr_face_status ก่อนตัดสินเส้นทาง (Cache hit = เกือบ 0) */
        PERF.boot.marks.face_status_wait_ms =
          perfOn() ? Math.round((perfNow() - tFs) * 10) / 10 : PERF.boot.marks.face_status_wait_ms;
        if (!opAlive(myOp)) { S.busy = false; return; }   // ถูกยกเลิกระหว่างรอ = หยุดเงียบ
        if (has) { S.busy = false; return doPunch(kind, onDone, myOp); }
        S.busy = false;
        enrollThenPunch(kind, onDone, myOp);
      })
      ['catch'](function (e) {
        S.busy = false;
        if (!opAlive(myOp)) return;                        // ถูกยกเลิกระหว่างรอ = ไม่ขึ้น error
        attendanceStatusError(e);
      });
  }

  /* ลงทะเบียนใบหน้าต้นแบบครั้งแรก แล้วต่อด้วยการลงเวลาทันที
     ⚠ ลงทะเบียนสำเร็จ ≠ ลงเวลาสำเร็จ — ยังต้องผ่าน Face + Liveness + GPS + Geofence
       ถ้า GPS/Geofence ไม่ผ่าน ใบหน้าต้นแบบยังถูกเก็บไว้ ครั้งหน้าไม่ต้องลงทะเบียนใหม่ */
  /* [ROOT CAUSE 5+7] หน้าจอแจ้งผล Preflight ที่ไม่ผ่าน — ไม่เปิดกล้องเลย
     ผู้ใช้ไม่ต้องเสียเวลาสแกนหน้าจนครบแล้วค่อย Fail */
  function preflightFail(kind, msg, retry) {
    var title = kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน';
    shell('ตรวจตำแหน่ง', title);
    panel(stepsHtml({ live: 'wait', match: 'wait', gps: 'bad' }, msg, true));
    actions([
      { label: 'ปิด', style: 'plain', on: close },
      { label: '↻ ตรวจตำแหน่งอีกครั้ง', style: 'primary', on: function () {
        close();
        if (typeof retry === 'function') setTimeout(retry, 60);
      } }
    ]);
  }

  function enrollThenPunch(kind, onDone, myOp) {
    /* [ข้อ 1] ลงทะเบียนใบหน้าครั้งแรกที่เกิดจากการลงเวลา = ยังอยู่ใน Attendance Context
       ส่ง { attendance: true } เข้า enroll() เพื่อคง S.mode='ATTENDANCE'
       Route Change / Logout จึงปิดกล้องและยกเลิก Flow นี้ได้
       ส่วน Manual Enrollment จากหน้า Profile/HR ไม่ส่ง flag นี้ = Enrollment ปกติ */
    /* [ROOT CAUSE 5] GPS/Geofence Preflight ต้องผ่านก่อนเปิด Enrollment Camera
       รักษา GPS Watcher เดิมไว้ตลอด Enrollment (ไม่เรียก gpsStop) เพื่อให้ตอน Punch
       ยังมี Fix สดพร้อมใช้ทันที ไม่ต้อง Cold Start ใหม่ */
    perfPressFlagFirst();      // [E2E] รอบนี้ต้องลงทะเบียนใบหน้าก่อน = First Attendance
    var aid = gpsWarmStart();
    var alive = function () { return aid === G.sid && opAlive(myOp); };
    var title = kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน';
    shell('ตรวจตำแหน่ง', title);
    panel(stepsHtml({ live: 'wait', match: 'wait', gps: 'wait' }, 'กำลังค้นหาตำแหน่ง…'));
    actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);

    gpsFresh(aid).then(function (g) {
      if (!alive()) throw AbortAttendanceError();
      if (!g || !g.ok) throw new Error(g && g.reason ? g.reason : 'GPS ยังไม่พร้อม');
      panel(stepsHtml({ live: 'wait', match: 'wait', gps: 'run' }, 'กำลังตรวจพื้นที่ลงเวลา…'));
      actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      /* [GF CACHE] ใช้ผลที่ยังสดได้ (sid เดิม + gfKey เดิม + pass=true + อายุ ≤ 3 วินาที)
         หน้าลงเวลาเพิ่งถามไปเมื่อครู่ ไม่จำเป็นต้องยิงซ้ำทันทีที่กดปุ่ม
         ⚠ ไม่ผ่านเงื่อนไขข้อใดข้อหนึ่ง = ยิง RPC ใหม่และ Fail Closed
            และ njhr_att_punch_face ยังตรวจ Geofence ซ้ำฝั่ง Server ก่อนบันทึกเสมอ */
      return gfCheck(g, false);
    }).then(function (r) {
      if (!alive()) throw AbortAttendanceError();
      if (!r) throw new Error(GF.err || 'ตรวจพื้นที่ลงเวลาไม่สำเร็จ กรุณาลองใหม่');
      if (!r.pass) throw new Error(r.reason || 'ยังลงเวลาจากตำแหน่งนี้ไม่ได้');
      /* ผ่านด่านแล้วจึงเปิดกล้องลงทะเบียน */
      if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
      S.root = null;
      enroll(null, function (r2, handoff) {
        /* มาถึงที่นี่ได้เฉพาะเมื่อ Enrollment สำเร็จและยังเป็น Operation เดิม
           (enroll ใช้ closeSoft() ในโหมด attendance จึงไม่ถูก opInvalidate) */
        if (!opAlive(myOp)) return;             // ถูกยกเลิกจริง (Route/Logout) = ไม่ต่อ
        setTimeout(function () {
          if (!opAlive(myOp)) return;
          /* [ROOT CAUSE 7] ส่งหลักฐานสดจาก Enrollment Run เดิมต่อเข้า doPunch
             ไม่ปิดแล้วเปิดกล้องเพื่อสแกนรอบใหม่
             njhr_att_punch_face ยังตรวจ Face Match + Liveness + GPS + Geofence
             และบันทึก Attendance ครบเหมือนเดิมทุกประการ */
          doPunch(kind, onDone, myOp, handoff || null);
        }, 60);
      }, { attendance: true, attendanceOp: myOp, attendanceKind: kind });
    })['catch'](function (e) {
      if (isAborted(e) || !alive()) return;
      njfReport('JS_ERROR', 'face/gps-preflight', e,
                'stage=enroll-preflight build=' + String(w.NJHR_BUILD_VERSION || ''));
      preflightFail(kind, (e && e.message) || 'ตรวจตำแหน่งไม่สำเร็จ', function () {
        punch(kind, onDone);
      });
    });
  }

  /* [ROOT CAUSE 7] handoff = หลักฐานสดจาก Enrollment Run เดียวกัน
       { op, kind, desc, method, snapshotP }
     ยอมรับก็ต่อเมื่อพิสูจน์ได้ว่าเป็น Attendance Operation เดียวกันและเป็นการกดปุ่มเดียวกัน
     ถ้าพิสูจน์ไม่ได้ → ทิ้งทั้งก้อน แล้วเดินเส้นทางเปิดกล้องปกติ (ห้ามทำทางลัด) */
  function handoffValid(h, kind, myOp) {
    if (!h) return false;
    if (h.op !== myOp) return false;                       // คนละ Attendance Operation
    if (h.kind !== kind) return false;                     // คนละปุ่ม IN/OUT
    if (!h.desc || !h.desc.length) return false;           // ไม่มี Descriptor จริง
    if (!h.method) return false;                           // ไม่รู้ Liveness Method จริง
    return true;
  }

  function doPunch(kind, onDone, myOp, handoff) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;
    if (typeof myOp !== 'number') myOp = opStart();   // เผื่อถูกเรียกตรง
    if (!opAlive(myOp)) { S.busy = false; return; }
    /* [ROOT CAUSE 7] ใช้ Handoff ได้ก็ต่อเมื่อพิสูจน์ที่มาได้ครบเท่านั้น */
    var hand = handoffValid(handoff, kind, myOp) ? handoff : null;
    /* [ข้อ 5] Evidence ต้องเป็นของ "Attempt ปัจจุบัน" เท่านั้น — ล้างทุกครั้งที่เริ่ม Attempt
       กัน Special Request ของ OUT หยิบ Snapshot/GPS/Liveness/Similarity ที่ค้างจาก IN
       ส่วนจำนวน Retry นับตาม Punch Flow (กด IN/OUT 1 ครั้ง = 1 Flow) ไม่ใช่ต่อ Attempt */
    S.ctx = { snapshot: null, gps: null, similarity: null, distance: null,
              liveness: null, liveness_method: null, reason: null, ready: false };
    if (FLOW.kind !== kind || FLOW.op !== myOp) {
      FLOW.id++; FLOW.kind = kind; FLOW.op = myOp; S.attempts = 0;
    }
    var title = kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน';
    shell('สแกนใบหน้า', title);
    var st = { live: 'wait', match: 'wait', gps: 'wait' };
    panel(stepsHtml(st, 'กำลังเตรียมกล้อง…'));
    actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);

    /* [ข้อ 1] Attempt นี้เป็นเจ้าของ GPS Session หมายเลข aid เท่านั้น
       Async ที่ค้างจาก Attempt ก่อนหน้าจะแตะ watch / S.ctx ของ Attempt นี้ไม่ได้ */
    /* [FIX 1] ต้องเปิด Flow ก่อนแตะ GPS Gate — ไม่งั้น PERF.t ยังเป็น null
       ทำให้ gps_gate_wait_ms / gps_ready_ms / gps_preflight_ms หายทั้งชุด */
    perfStart('ATTENDANCE_' + kind);
    var tGps = perfNow();
    /* [GPS WARMUP] ใช้ watcher ที่อุ่นไว้ตั้งแต่เปิดหน้าต่อได้เลยถ้ายังเดินอยู่และเจ้าของเดิม
       ไม่เช่นนั้น gpsWarmStart() จะเริ่ม Session ใหม่ให้เอง (พฤติกรรมเท่ากับ gpsStart เดิม)
       → ตัดเวลา Cold Start ของ GPS ออกจากช่วงหลังกดปุ่ม */
    var aid = gpsWarmStart();
    netOwn('A' + aid);                        // [ข้อ 4] Network ของ Attempt นี้ผูกกับ aid
    /* เจ้าของ = ต้องตรงทั้ง GPS Session และ Attendance Operation */
    var mine = function () { return aid === G.sid && opAlive(myOp); };

    /* [GPS GATE] ประตูเดียวที่กล้อง/การสแกนใบหน้าจะผ่านไปได้
       Requirement: ห้ามเปิดกล้องก่อน GPS พร้อม
       - มี Fix ที่ใช้ได้แล้ว (จาก Warmup) → ผ่านทันที กล้องเปิดต่อเนื่องไม่มีสะดุด
       - ยังไม่มี → รอที่นี่ พร้อมแสดงสถานะ GPS ไม่ใช่ไปรอทีหลังตอนสแกนหน้าเสร็จ */
    /* [ROOT CAUSE 5] ด่านนี้ต้องผ่าน "ทั้ง Fix และ Geofence" ก่อนเปิดกล้อง
       เดิมผ่านแค่มี Fix → พนักงานสแกนหน้าครบแล้วค่อย Fail ที่ njhr_att_punch_face
       ของใหม่ถาม njhr_gf_check (RPC เดิม) ก่อน — accuracy · พื้นที่ที่ได้รับ · ระยะ · radius
       ⚠ ไม่ตัดการตรวจฝั่งเซิร์ฟเวอร์ออก njhr_att_punch_face ยังตรวจซ้ำก่อนบันทึกทุกครั้ง */
    var gpsGate = (function () {
      function preflight(fix) {
        /* [GF CACHE] ใช้ผลที่ยังสดได้ตามกติกา 3 วินาที — ไม่ Force โดยไม่มีเหตุผล
           Force สงวนไว้ให้ปุ่ม "ตรวจตำแหน่งอีกครั้ง" เท่านั้น */
        return gfCheck(fix, false).then(function (r) {
          if (!mine()) return { ok: false, reason: 'ยกเลิกแล้ว' };
          /* [FAIL-CLOSED] ถาม njhr_gf_check ไม่สำเร็จ (RPC Error / Timeout / Network)
             = ห้ามเปิดกล้องเด็ดขาด ห้ามลดความปลอดภัยเพื่อให้ Flow เดินต่อ
             กล้องเปิดได้เมื่อเซิร์ฟเวอร์ตอบ pass=true เท่านั้น
             ⚠ njhr_att_punch_face ยังตรวจ Geofence ซ้ำก่อนบันทึกเหมือนเดิมทุกประการ */
          if (!r) {
            st.gps = 'bad';
            return { ok: false,
                     reason: GF.err || 'ตรวจพื้นที่ลงเวลาไม่สำเร็จ กรุณาลองใหม่' };
          }
          if (!r.pass) {
            st.gps = 'bad';
            return { ok: false, reason: r.reason || 'ยังลงเวลาจากตำแหน่งนี้ไม่ได้' };
          }
          st.gps = 'run';
          return { ok: true };
        });
      }
      var have = gpsPickFresh(aid);
      if (have) {
        st.gps = 'run';
        perfMark('gps_ready_ms', tGps);
        perfMs('gps_gate_wait_ms', 0);        // [FIX 1] Warm = ไม่ต้องรอเลย (ลง marks)
        return preflight(have);
      }
      st.gps = 'wait';
      panel(stepsHtml(st, 'กำลังค้นหาตำแหน่ง…'));
      actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      var tGate = perfNow();
      return gpsFresh(aid).then(function (g) {
        perfMark('gps_gate_wait_ms', tGate);
        perfMark('gps_ready_ms', tGps);
        if (!mine()) return { ok: false, reason: 'ยกเลิกแล้ว' };
        if (g && g.ok !== false) {
          panel(stepsHtml(st, 'กำลังตรวจพื้นที่ลงเวลา…'));
          actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
          return preflight(g);
        }
        st.gps = 'bad';
        return { ok: false, reason: (g && g.reason) || 'GPS ยังไม่พร้อม' };
      });
    })();

    G.first.then(function (g) {
      perfMark('gps_wait_ms', tGps);          // เวลาถึง Fix แรกของ Session นี้
      if (!mine()) return;                    // Attempt เก่ามาช้า = ไม่แตะจอของ Attempt ใหม่
      if (!g.ok) {
        st.gps = 'bad';
        panel(stepsHtml(st, g.reason, true));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      }
    });

    /* [PERF] โมเดลโหลดขนานกับ GPS ได้เสมอ — ไม่ถูก Gate
       รอเฉพาะ GUIDE (550 KB) ก่อนเริ่มตรวจหน้า
       RECOGNITION (6.44 MB) โหลด Background แล้วไปรอเอาตอนสร้าง Descriptor ใน grabFrames() */
    var modelP = guideLoad();
    recogPrefetch();

    /* [GPS GATE] กล้องเปิด "หลัง" GPS พร้อมเท่านั้น
       เมื่อ Warmup ทำงานสำเร็จ gpsGate จะ resolve ทันที (0 ms) กล้องจึงเปิดต่อเนื่อง
       ไม่มีสะดุด — ได้ทั้งความปลอดภัยตาม Requirement และความเร็ว
       ถ้า GPS ไม่ผ่าน จะไม่เปิดกล้องเลย และ reject ให้ .catch เดิมจัดการตามเส้นทางปกติ */
    var camP = gpsGate.then(function (r) {
      if (!r.ok) throw new Error(r.reason || 'GPS ยังไม่พร้อม');
      if (!mine()) throw AbortAttendanceError();
      /* [ROOT CAUSE 7] มีหลักฐานสดจาก Enrollment Run เดิม = ไม่เปิดกล้องรอบที่สอง */
      if (hand) { perfSet('camera_reopen_skipped', 1); return null; }
      var tCam = perfNow();
      return openCam().then(function (v) { perfMark('camera_open_ms', tCam); return v; });
    });
    /* [ข้อ 3] จอง Signed Upload URL ขนานไปกับ Camera + Model + GPS
       ตัด 1 Network Round-trip ออกจากช่วงท้ายหลังสแกนใบหน้าผ่าน
       ล้มเหลวเงียบ → ตอน PUT จะขอใหม่พร้อม size จริงตามเส้นทางเดิม */
    var tResv = perfNow();
    var resvP = hand ? Promise.resolve(null)
                     : reserveUpload('PUNCH', kind, null).then(function (r) {
                         perfMark('upload_reserve_ms', tResv);   // [UPLOAD] จองสำเร็จ
                         return r;
                       }, function () {
                         perfMark('upload_reserve_ms', tResv);   // [UPLOAD] จองล้มเหลวก็ต้องมีตัวเลข
                         return null;
                       });
    camP.then(function () {
      if (hand) return;                        // [ROOT CAUSE 7] ไม่มีขั้นเตรียมกล้องแล้ว
      if (!S.guideReady) {
        panel(stepsHtml(st, 'กำลังเตรียมระบบตรวจสอบใบหน้า…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      }
    }, function () {});
    modelP['catch'](function () {});          // กัน unhandled rejection · error จริงจับที่ Promise.all
    /* [ROOT CAUSE 7] เส้นทางที่ใช้หลักฐานสดจาก Enrollment Run เดิม
       ไม่เปิดกล้อง · ไม่สแกนใหม่ · ไม่สร้าง Descriptor เพิ่ม
       Snapshot เป็นหลักฐานชนิด PUNCH ใหม่ (แยกจาก ENROLL Snapshot) ที่ถ่ายไว้ในกล้องรอบเดิม */
    var handScanP = !hand ? null : camP.then(function () {
      if (!mine()) throw AbortAttendanceError();
      st.live = 'ok'; st.match = 'run';
      panel(stepsHtml(st, 'กำลังเทียบใบหน้ากับข้อมูลที่ลงทะเบียน…'));
      actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      return (hand.snapshotP || Promise.resolve(null))['catch'](function () { return null; });
    }).then(function (path) {
      if (!mine()) throw AbortAttendanceError();
      var ctx = { frames: [{ desc: hand.desc }], live: { method: hand.method }, snapshot: path };
      return gpsFresh(aid).then(function (g) {
        if (!g || !g.ok) throw new Error(g && g.reason ? g.reason : 'GPS ยังไม่พร้อม');
        ctx.gps = g; return ctx;
      });
    });

    (handScanP || Promise.all([camP, modelP])
      .then(function () {
        perfMark('guide_visible_ms');          // กดปุ่ม → เห็นกล้อง+กรอบนำทาง
        S.running = true;
        st.live = 'run'; panel(stepsHtml(st, 'กำลังตรวจสอบบุคคลจริง…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        return grabFrames(6, function (warn) {
          if (!mine()) return;                  // [ข้อ 2] ห้าม Attempt เก่าเขียน UI
          if (warn) setMsg(warn, true); else setMsg('กำลังตรวจสอบบุคคลจริง…');
        }, mine);
      })
      .then(function (frames) {
        /* ---------- ตรวจบุคคลจริงแบบไม่ต้องทำท่าทาง ----------
           ⚠ การลงเวลาปกติต้องไม่บังคับกระพริบตา / หันซ้าย / หันขวา
             พนักงานแค่มองกล้อง ระบบตรวจเอง
           ถ้ารอบแรกยังตัดสินไม่ได้ ให้เก็บภาพเพิ่มอีกชุดแล้วตรวจซ้ำเงียบ ๆ
           ไม่ขอให้ผู้ใช้ทำอะไรเพิ่ม — ยังไม่ผ่านค่อยแจ้งให้กด "ลองใหม่" */
        var lv = passiveLiveness(frames);
        if (lv.pass) return { frames: frames, live: lv };
        if (!lv.challenge) throw new Error(lv.reason);
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 2] ห้ามเก็บเฟรมเพิ่มต่อหลัง Cancel
        setMsg('กำลังตรวจสอบบุคคลจริง…', false);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        /* [PERF] Incremental Evidence — ไม่ทิ้ง 6 เฟรมแรก ต่อยอดจนกว่าจะผ่าน
           ประเมินครั้งแรกเมื่อครบ BORDER_MIN (8) = ไม่เล็กกว่าหน้าต่างเดิม
           เพดาน BORDER_MAX (14) = กรณีแย่สุดเท่าเดิม · เกณฑ์ตัดสินใช้ passiveLiveness ตัวเดิม */
        var lvMore = null, extra0 = frames.length;
        var tBorder = perfNow();
        return grabFramesMore(frames, BORDER_MAX, null, mine, function (all) {
          if (all.length < BORDER_MIN) return false;
          var r = passiveLiveness(all);
          if (r.pass) { lvMore = r; return true; }
          return false;
        }).then(function (all) {
          if (!mine()) throw AbortAttendanceError();  // [ข้อ 2] ยกเลิกระหว่างเก็บเพิ่ม
          perfMark('borderline_extra_ms', tBorder);
          perfSet('borderline_extra_descriptor_count', Math.max(0, all.length - extra0));
          var lv2 = lvMore || passiveLiveness(all);
          if (lv2.pass) return { frames: all, live: lv2 };
          throw new Error('ตรวจสอบบุคคลจริงไม่ผ่าน กรุณามองกล้องให้ชัดแล้วลองใหม่');
        });
      })
      .then(function (ctx) {
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 3] ยกเลิกก่อน Snapshot/Upload
        st.live = 'ok'; st.match = 'run';
        panel(stepsHtml(st, 'กำลังเทียบใบหน้ากับข้อมูลที่ลงทะเบียน…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
        hint('กำลังบันทึก', 'กรุณาอย่าขยับใบหน้า');
        return snapshotBlob().then(function (b) {
          /* [ข้อ 3] Cancel เกิดได้ "ระหว่าง" สร้าง Blob → ตรวจซ้ำก่อน PUT
             ยกเลิกแล้ว = ห้าม PUT · ห้าม GPS Fresh · ห้าม Punch RPC
             Signed Reservation ที่ไม่ได้ใช้ปล่อยหมดอายุได้ เพราะยังไม่มี Object ถูกสร้าง */
          if (!mine()) { closeCam(); throw AbortAttendanceError(); }
          closeCam();                          // ปิดกล้องทันทีเมื่อได้ภาพครบ
          /* [UPLOAD] ถ้าการจองยังไม่เสร็จตอนสแกนจบ ต้องรู้ว่ารออีกกี่มิลลิวินาที */
          var tWaitResv = perfNow();
          return resvP.then(function (resv) {
            perfMark('reserve_wait_after_scan_ms', tWaitResv);
            if (!mine()) throw AbortAttendanceError();
            return putSnapshot(b, resv, 'PUNCH', kind, null);
          }).then(function (path) {
            ctx.snapshot = path;
            /* [PERF/หลักฐาน] ใช้ Fix ล่าสุด ณ วินาทีที่จะส่ง ไม่ใช่ Fix แรกตอนเริ่มกด */
            /* [ข้อ 2] ต้องได้ Fix "สดจริง" ของ Attempt นี้เท่านั้น ไม่มีก็ Fail Closed
               ไม่ส่ง Fix เก่าไปให้ njhr_att_punch_face เด็ดขาด */
            return gpsFresh(aid).then(function (g) {
              if (!g || !g.ok) throw new Error(g && g.reason ? g.reason : 'GPS ยังไม่พร้อม');
              ctx.gps = g; return ctx;
            });
          });
        });
      }))
      .then(function (ctx) {
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 3] ยกเลิกก่อนยิง Punch RPC
        var best = ctx.frames[ctx.frames.length - 1];
        perfMark('client_face_ms');
        var tRpcA = perfNow();
        perfBootCount('njhr_att_punch_face_calls');   // [INSTRUMENTATION] นับก่อนยิงจริง
        return rpc('njhr_att_punch_face', {
          p_token: token(), p_action: kind,
          p_descriptor: best.desc, p_faces_found: 1,
          p_liveness: true, p_liveness_method: ctx.live.method,
          p_lat: ctx.gps.ok ? ctx.gps.lat : null,
          p_lng: ctx.gps.ok ? ctx.gps.lng : null,
          p_accuracy: ctx.gps.ok ? ctx.gps.accuracy : null,
          p_snapshot: ctx.snapshot, p_device: deviceInfo()
        }).then(function (r) {
          /* [FIX 2] บันทึกเวลา RPC เท่านั้น — ห้ามปิด Flow ที่นี่
             เพราะยังไม่รู้ผลว่า r.ok เป็น true หรือไม่ และ .catch ต้องเขียน outcome ได้ */
          perfMark('rpc_ms', tRpcA);
          return { r: r, ctx: ctx };
        });
      })
      .then(function (o) {
        /* [ข้อ 2] ตรวจ Owner "ก่อน" เขียน Global State ทุกฟิลด์
           เดิมเขียน similarity/distance/liveness/liveness_method/snapshot ไปแล้ว
           ค่อยตรวจ mine() → Attempt เก่าที่ RPC ตอบช้าเขียนทับ Context รอบใหม่ได้
           ตอนนี้ประกอบเป็นก้อนเดียวใน local แล้ว Commit ทีเดียวเมื่อเป็นเจ้าของจริง */
        if (!mine()) return;                  // ผลของ Attempt เก่า = ทิ้งทั้งก้อน ไม่แตะแม้แต่ field เดียว
        var commit = {
          similarity: o.r ? o.r.similarity : null,
          distance: o.r ? o.r.verify_distance : null,
          liveness: true,
          liveness_method: o.ctx.live.method,
          snapshot: o.ctx.snapshot,
          gps: o.ctx.gps
        };
        Object.keys(commit).forEach(function (k) { S.ctx[k] = commit[k]; });
        if (!o.r || !o.r.ok) {
          st.match = 'bad';
          /* [FIX 2] ติดรหัสผลจริงไว้กับ Error เพื่อให้ฝั่ง failure บันทึก outcome ได้ถูกต้อง
             ไม่ส่งข้อความที่ผู้ใช้เห็นเข้าตัวชี้วัด (อาจมีชื่อพื้นที่/ระยะทาง) */
          var eRej = new Error((o.r && o.r.reason) || 'ยืนยันใบหน้าไม่สำเร็จ');
          eRej.punchCode = o.r ? 'PUNCH_REJECTED' : 'PUNCH_NO_RESPONSE';
          throw eRej;
        }
        st.match = 'ok'; st.gps = 'ok';
        /* [FIX 2] RPC สำเร็จและ r.ok === true → บันทึกผล แล้วปิด Flow ครั้งเดียว
           ⚠ ต้องบันทึกก่อน perfEnd เสมอ ไม่งั้น PERF.t เป็น null แล้วค่าหาย */
        perfSet('punch_result', 'OK');
        perfSet('final_result', 'SUCCESS');
        perfSet('error_code', null);
        perfEnd('total_attendance_ms');
        S.attempts = 0;
        gpsStop(aid);       // [ข้อ 4] Punch RPC เสร็จ = หยุด watch ของ Attempt นี้ทันที
        showSuccess(kind, o.r, o.ctx, onDone);
      })
      .catch(function (e) {
        /* [ข้อ 3] Flow ที่ถูก Cancel = เงียบสนิท ไม่ขึ้น Error UI ไม่นับ attempts
           ไม่ Upload หลักฐาน ไม่แตะ State ใด ๆ */
        if (isAborted(e) || !mine()) return;
        var msg = (e && e.message) || 'สแกนไม่สำเร็จ';
        /* [FIX 2] มาถึงที่นี่ขณะ PERF.t ยังไม่เป็น null เสมอ เพราะ .then แรกไม่ปิด Flow แล้ว
           บันทึก outcome จากผลจริงก่อน แล้วจึงปิด Flow ครั้งเดียว (perfEnd มี guard กันซ้ำ)
           error_code = รหัสจริง ไม่เก็บข้อความที่ผู้ใช้เห็น (อาจมีชื่อพื้นที่/ระยะทาง) */
        perfSet('punch_result', 'FAIL');
        perfSet('final_result', 'FAIL');
        perfSet('error_code',
          (e && e.camCode) ? e.camCode :
          (e && e.faceCode) ? e.faceCode :
          (e && e.punchCode) ? e.punchCode : 'FLOW_ERROR');
        perfEnd('total_attendance_ms');
        S.attempts++;
        S.ctx.reason = msg;
        // เก็บรูปหลักฐาน + GPS ไว้ก่อนปิดกล้อง เผื่อพนักงานกดส่งคำขออนุมัติพิเศษ
        var keep = (S.stream && S.video && S.video.videoWidth)
          ? snapshotBlob().then(function (b) {
              closeCam();
              /* [ข้อ 4] Blob เสร็จหลัง Retry/Cancel = ห้ามสร้าง Fetch ใหม่เด็ดขาด */
              if (!mine()) return null;
              return uploadSnapshot(b, 'REQUEST', kind, null).catch(function () { return null; });
            }).catch(function () { closeCam(); return null; })
          : Promise.resolve(null);
        /* [ข้อ 1+2] เก็บหลักฐานสำหรับ "คำขออนุมัติพิเศษ" แบบ Async
           ทุกจุดตรวจ mine() ก่อนเขียน S.ctx — ถ้าผู้ใช้กด "ลองใหม่" ระหว่างนี้
           Attempt เก่าจะไม่เขียนทับ Snapshot/GPS ของ Attempt ใหม่
           และ gpsStop(aid) จะไม่หยุด watch ของ Attempt ใหม่ */
        /* [ข้อ 2] หลักฐานสำหรับ "คำขออนุมัติพิเศษ" — เก็บใน local ก่อน
           แล้ว Commit เข้า S.ctx ครั้งเดียวเมื่อยังเป็นเจ้าของจริง */
        keep.then(function (path) {
          return gpsFresh(aid).then(function (g) { return { snapshot: path, gps: g }; },
                                    function () { return { snapshot: path, gps: null }; });
        }).then(function (ev) {
          if (!mine()) return;                // Attempt เก่า = ห้ามเขียนแม้แต่ field เดียว
          S.ctx.snapshot = ev.snapshot;
          if (ev.gps) S.ctx.gps = ev.gps;
          S.ctx.ready = true;                 // [ข้อ 5] Evidence ของ Attempt นี้พร้อมแล้ว
        }).catch(function () { if (mine()) S.ctx.ready = true; })
          .then(function () { gpsStop(aid); });
        if (st.live === 'run') st.live = 'bad';
        else if (st.match === 'run') st.match = 'bad';
        panel(stepsHtml(st, msg, true));
        var acts = [{ label: 'ยกเลิก', style: 'plain', on: close }];
        var maxTry = Number(w.NJHR_FACE_MAX_ATTEMPTS || 3);
        if (S.attempts < maxTry) {
          acts.unshift({ label: 'ลองใหม่ (' + S.attempts + '/' + maxTry + ')', style: 'primary',
            on: function () {
              close();                        // close() เรียก opInvalidate() + gpsStop() ให้แล้ว
              setTimeout(function () { punch(kind, onDone); }, 60);
            } });
        } else {
          acts.unshift({ label: 'ส่งคำขออนุมัติลงเวลา', style: 'primary',
            on: function () { specialRequest(kind, msg, onDone); } });
        }
        actions(acts);
        S.busy = false;
      });
  }

  /* ---------- หน้าผลสำเร็จ ---------- */
  function showSuccess(kind, r, ctx, onDone) {
    var t = kind === 'IN' ? r.check_in : r.check_out;
    var hm = t ? new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    var dt = t ? new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var cam = S.root && S.root.querySelector('.njf-cam');
    if (cam) cam.remove();
    var p = S.root && S.root.querySelector('#njf-panel');
    if (p) p.remove();

    var box = d.createElement('div');
    box.className = 'njf-result';
    box.innerHTML =
      '<div class="njf-check">&#10003;</div>' +
      '<h3>' + (kind === 'IN' ? 'ลงเวลาเข้างานสำเร็จ' : 'ลงเวลาออกงานสำเร็จ') + '</h3>' +
      '<p>บันทึกข้อมูลเรียบร้อยแล้ว</p>' +
      '<div class="njf-rows">' +
      '<div class="njf-row"><span class="k">เวลาที่บันทึก</span>' +
      '<span class="v">' + esc(hm) + ' น.<small>' + esc(dt) + '</small></span></div>' +
      '<div class="njf-row"><span class="k">ยืนยันใบหน้า</span><span class="v ok">สำเร็จ</span></div>' +
      '<div class="njf-row"><span class="k">ตรวจคนจริง (Liveness)</span><span class="v ok">ผ่าน</span></div>' +
      '<div class="njf-row"><span class="k">สถานะ GPS</span><span class="v ok">อยู่ในพื้นที่' +
      '<small>' + esc(r.geofence_name || '') +
      (ctx.gps && ctx.gps.ok ? ' · Accuracy ' + Math.round(ctx.gps.accuracy) + ' เมตร' : '') +
      '</small></span></div>' +
      (r.late_min > 0 ? '<div class="njf-row"><span class="k">มาสาย</span><span class="v">' +
        r.late_min + ' นาที</span></div>' : '') +
      (r.work_hours != null ? '<div class="njf-row"><span class="k">ชั่วโมงทำงาน</span><span class="v">' +
        r.work_hours + ' ชม.</span></div>' : '') +
      '<div class="njf-row"><span class="k">รูปหลักฐาน<small>' + esc(hm) + ' น. · ' + esc(dt) +
      '</small></span><img class="njf-shot" id="njf-shot" alt="รูปหลักฐาน"></div>' +
      '</div>' +
      '<div class="njf-actions" style="margin-top:18px">' +
      '<button class="njf-btn primary" id="njf-done">เสร็จสิ้น</button></div>';
    S.root.appendChild(box);

    snapshotUrl(ctx.snapshot).then(function (u) {
      var img = box.querySelector('#njf-shot');
      if (img && u) img.src = u;                 // Signed URL อายุ 60 วินาที
    }).catch(function () {});

    box.querySelector('#njf-done').onclick = function () {
      close();
      if (typeof onDone === 'function') onDone(r);
    };
    S.busy = false;
  }

  /* ---------- ส่งคำขออนุมัติลงเวลาพิเศษ ----------
     แนบข้อมูลจริงครบตามที่ระบบต้องใช้ตรวจสอบย้อนหลัง:
       Employee ID (จาก token) · เข้างาน/ออกงาน · เวลาที่พยายามลงเวลา
       Snapshot (path ใน bucket private) · Latitude · Longitude · GPS Accuracy
       สาเหตุที่สแกนไม่ผ่าน · Similarity Score · Liveness Result · เหตุผลจากพนักงาน
     ส่งเข้า njhr_att_correction_submit ซึ่งเป็นช่องทางอนุมัติเดิมของระบบ
     หัวหน้าอนุมัติแล้วจึงเขียน attendance จริง (ตรรกะอยู่ใน RPC ไม่ได้ทำที่เบราว์เซอร์) */
  function specialRequest(kind, failReason, onDone) {
    var now = new Date();
    var pad2 = function (n) { return ('0' + n).slice(-2); };
    var todayISO = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    var c = S.ctx || {};
    var g = c.gps || {};

    panel(
      '<div class="njf-msg">สแกนใบหน้าไม่ผ่าน — ส่งคำขอให้หัวหน้าอนุมัติลงเวลาแทน</div>' +
      '<div class="njf-rows" style="margin-bottom:12px">' +
      '<div class="njf-row"><span class="k">ประเภท</span><span class="v">' +
      (kind === 'IN' ? 'เข้างาน' : 'ออกงาน') + '</span></div>' +
      '<div class="njf-row"><span class="k">เวลาที่พยายามลงเวลา</span><span class="v">' +
      esc(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })) + ' น.</span></div>' +
      '<div class="njf-row"><span class="k">ตำแหน่ง GPS</span><span class="v">' +
      (g.ok ? 'บันทึกแล้ว<small>Accuracy ' + Math.round(g.accuracy) + ' เมตร</small>'
            : '<small>' + esc(g.reason || 'อ่านไม่ได้') + '</small>') + '</span></div>' +
      '<div class="njf-row"><span class="k">รูปหลักฐาน</span><span class="v">' +
      (c.snapshot ? 'แนบแล้ว' : '<small>ไม่มี</small>') + '</span></div>' +
      '</div>' +
      '<label style="display:block;font-size:13px;margin-bottom:6px">เหตุผลจากพนักงาน</label>' +
      '<textarea id="njf-why" rows="3" style="width:100%;padding:10px;border:1px solid #E2E8F0;' +
      'border-radius:10px;font-family:inherit;font-size:14px" ' +
      'placeholder="เช่น กล้องเสีย / แสงไม่พอ / ใบหน้าเปลี่ยนไป"></textarea>' +
      '<div class="njf-msg err" id="njf-rerr"></div>' +
      '<div class="njf-actions" id="njf-act"></div>');

    actions([
      { label: 'ยกเลิก', style: 'plain', on: close },
      { label: 'ส่งคำขอ', style: 'primary', on: function () {
          var btn = this;
          var why = String((S.root.querySelector('#njf-why') || {}).value || '').trim();
          var errB = S.root.querySelector('#njf-rerr');
          if (!why) { errB.textContent = 'กรุณาระบุเหตุผล'; return; }
          errB.textContent = '';
          if (btn.disabled) return;
          btn.disabled = true;

          // รวมข้อมูลตรวจสอบทั้งหมดไว้ในเหตุผล เพื่อให้หัวหน้าเห็นครบในใบเดียว
          var detail = [
            'ลงเวลาโดยอนุมัติพิเศษ (' + (kind === 'IN' ? 'เข้างาน' : 'ออกงาน') + ')',
            'เวลาที่พยายามลงเวลา: ' + now.toLocaleString('th-TH'),
            'เหตุผลจากพนักงาน: ' + why,
            'สาเหตุที่สแกนไม่ผ่าน: ' + (failReason || c.reason || '-'),
            'Liveness: ' + (c.liveness === true ? 'ผ่าน' : 'ไม่ผ่าน') +
              (c.liveness_method ? ' (' + c.liveness_method + ')' : ''),
            'Similarity: ' + (c.similarity != null ? c.similarity : '-') +
              (c.distance != null ? ' (distance ' + c.distance + ')' : ''),
            g.ok ? ('GPS: ' + g.lat.toFixed(6) + ', ' + g.lng.toFixed(6) +
                    ' · Accuracy ' + Math.round(g.accuracy) + ' ม.')
                 : ('GPS: อ่านไม่ได้ — ' + (g.reason || ''))
          ].join(' | ');

          var body = {
            p_token: token(), p_work_date: todayISO,
            p_requested_check_in: kind === 'IN' ? now.toISOString() : null,
            p_requested_check_out: kind === 'OUT' ? now.toISOString() : null,
            p_reason: detail,
            p_employee: null,
            p_attachment: c.snapshot
              ? { name: 'face-snapshot.jpg', path: c.snapshot, mime: 'image/jpeg', size: null }
              : null
          };

          rpc('njhr_att_correction_submit', body).then(function (r) {
            panel('<div class="njf-check" style="margin:0 auto 12px">&#10003;</div>' +
              '<div class="njf-msg"><b>ส่งคำขอเรียบร้อยแล้ว</b><br>' +
              'สถานะ: รออนุมัติ' + (r && r.id ? '<br><small>เลขที่คำขอ ' + esc(String(r.id).slice(0, 8)) + '</small>' : '') +
              '<br>ระบบจะบันทึกเวลาให้เมื่อหัวหน้าอนุมัติ</div>' +
              '<div class="njf-actions" id="njf-act"></div>');
            actions([{ label: 'เสร็จสิ้น', style: 'primary', on: function () {
              close(); if (typeof onDone === 'function') onDone(null);
            } }]);
          }).catch(function (e) {
            btn.disabled = false;
            var eb = S.root && S.root.querySelector('#njf-rerr');
            if (eb) eb.textContent = (e && e.message) || 'ส่งคำขอไม่สำเร็จ';
          });
        } }
    ]);
  }

  /* ---------- ลงทะเบียนใบหน้า ---------- */
  /* เกณฑ์มุม — คำนวณใหม่ทั้งชุดให้เข้ากับสเกลของ yaw() แบบ Landmark
     ค่าเดิม 0.18 / 0.20 เป็นสเกลของ Bounding Box (หารด้วยครึ่งความกว้างกรอบ)
     นำมาใช้กับสูตรใหม่ไม่ได้เด็ดขาด เพราะตัวหารคนละตัว (ระยะระหว่างตา ≈ 45% ของความกว้างกรอบ)

     สเกลใหม่: yaw ≈ 0.33 × tan(มุมหัน)
       0.09 ≈ 15°  → เกณฑ์ \"หน้าตรง\" (ยอมรับความไม่สมมาตรของจมูกแต่ละคน ±0.02–0.03)
       0.13 ≈ 21°  → เกณฑ์ \"หันซ้าย/ขวา\" คงระดับ \"หันเล็กน้อย\" ตามข้อความแนะนำเดิม
     ทิศทางเครื่องหมายเท่าเดิม: LEFT = ค่าบวก · RIGHT = ค่าลบ (ดูหมายเหตุใน yaw())
     y === null (อ่าน Landmark ไม่ได้) ต้องไม่ผ่านทุกท่า */
  var YAW_FRONT_MAX = 0.09, YAW_TURN_MIN = 0.13;

  /* [UI] title/done/arrow ของหน้าจอ Stepper 1-2-3 · ลำดับ FRONT→LEFT→RIGHT คงเดิม */
  var POSES = [
    { key: 'FRONT', label: 'หน้าตรง', icon: '&#128100;', hint: 'มองกล้องตรง ๆ',   test: function (y) { return y != null && Math.abs(y) < YAW_FRONT_MAX; },
      title: 'มองตรง',              done: 'มองตรง',      arrow: '' },
    { key: 'LEFT',  label: 'หันซ้าย',  icon: '&#11013;',  hint: 'หันหน้าไปทางซ้ายเล็กน้อย',  test: function (y) { return y != null && y > YAW_TURN_MIN; },
      title: 'ค่อย ๆ หันหน้าไปทางซ้าย', done: 'หันซ้าย ครบแล้ว', arrow: '&#8592;' },
    { key: 'RIGHT', label: 'หันขวา',   icon: '&#10145;',  hint: 'หันหน้าไปทางขวาเล็กน้อย',   test: function (y) { return y != null && y < -YAW_TURN_MIN; },
      title: 'ค่อย ๆ หันหน้าไปทางขวา',  done: 'หันขวา ครบแล้ว',  arrow: '&#8594;' }
  ];

  function enroll(employeeId, onDone, opts) {
    /* [ข้อ 1] opts.attendance = true → ลงทะเบียนนี้เกิดจากการลงเวลา
       คง S.mode='ATTENDANCE' ให้ Route Change / Logout ปิดกล้องและยกเลิกได้
       Manual Enrollment จากหน้า Profile/HR ไม่ส่ง flag นี้ → S.mode='ENROLL'
       cancelAttendance() จึงไม่แตะ และ Face Login (mode 'LOGIN') ก็ไม่ถูกกระทบ */
    var enAtt = !!(opts && opts.attendance);
    var enOp = (opts && typeof opts.attendanceOp === 'number') ? opts.attendanceOp : null;
    /* [ข้อ 4] ยังมีชีวิตอยู่ไหม — โหมด Attendance ผูกกับ Operation ID จริง
       โหมด Manual (Profile/HR) ไม่ผูก จึงทำงานแบบเดิมทุกประการ */
    /* [ข้อ 5] Enrollment Run ID — Manual Enrollment ก็ต้องมีเจ้าของจริง
       เดิม Manual คืน true ตลอด ทำให้ Run เก่ายัง capture/upload/ส่ง RPC ต่อได้หลังปิดหน้าจอ
       ตอนนี้ทุก Run มีหมายเลขของตัวเอง · ปิด/เปลี่ยน Route/Background = Run หมดสิทธิ์ทันที */
    var myRun = ++EN.id;
    netOwn('E' + myRun);                      // [ข้อ 4] Network ของ Enrollment Run นี้
    var enAlive = function () {
      if (myRun !== EN.id) return false;                 // Run เก่า = ตายทันที
      return enAtt ? (enOp === null || opAlive(enOp)) : true;
    };
    S.mode = enAtt ? 'ATTENDANCE' : 'ENROLL';
    if (S.busy) return;
    S.busy = true;
    /* opts.password มีค่า = "ลงทะเบียนใบหน้าใหม่" (ทับของเดิม)
       ต้องยืนยันรหัสผ่านมาแล้วจากหน้าข้อมูลส่วนตัว และฐานข้อมูลตรวจซ้ำอีกชั้น
       ⚠ ของเดิมจะถูกแทนที่ก็ต่อเมื่อ RPC สำเร็จเท่านั้น — ระหว่างถ่าย 3 มุมไม่แตะของเดิมเลย */
    var reNew = !!(opts && opts.password);
    shell(reNew ? 'ลงทะเบียนใบหน้าใหม่' : 'ลงทะเบียนใบหน้า', 'เก็บใบหน้า 3 มุม');
    var got = [], idx = 0, snapPath = null;
    /* [ROOT CAUSE 7] หลักฐานสำหรับ "ลงเวลาต่อทันที" ที่เก็บจากกล้องรอบเดียวกันนี้
       เก็บเฉพาะเมื่อ Enrollment ถูกเรียกจากการลงเวลา (enAtt) เท่านั้น
       Manual Enrollment จาก Profile/HR ไม่แตะส่วนนี้เลย และไม่บังคับ GPS ใด ๆ */
    var enKind = (opts && opts.attendanceKind) || '';
    var enPunch = null;

    /* [UI] หน้าจอลงทะเบียนแนวใหม่
         · Stepper วงกลม 1-2-3 (ผ่านแล้วเป็น ✓ เขียว · ขั้นปัจจุบันเป็นวงน้ำเงิน)
         · หัวข้อบอกสิ่งที่ต้องทำ + ลูกศรบอกทิศ
         · แถบ Progress + ตัวเลข n/3
       ทั้งหมดเป็นการ "แสดงผล" ล้วน — ไม่แตะการตรวจมุม/จำนวนภาพ/ลำดับ/Descriptor
       stepDone = true เมื่อเพิ่งบันทึกมุมนี้สำเร็จ (ใช้โชว์ข้อความ "ครบแล้ว ✓") */
    /* [UI] เลื่อนวงแหวนตามความคืบหน้า (0..1) · เปลี่ยนเป็นเขียวเมื่อครบมุม
       ไม่มีผลต่อ Logic ใด ๆ — ล้มเหลวเงียบถ้าไม่พบ element */
    function ringSet(ratio, done) {
      try {
        var fg = document.getElementById('njf-ring-fg');
        if (!fg) return;
        var len = fg.getTotalLength ? fg.getTotalLength() : 424;
        fg.style.strokeDasharray = len;
        fg.style.strokeDashoffset = String(len * (1 - Math.max(0, Math.min(1, ratio))));
        fg.classList.toggle('ok', !!done);
      } catch (e) {}
    }

    /* [UI] ตั้งทิศทางที่ต้องหมุน + สถานะผ่านของมุมปัจจุบัน
         cam.dataset.dir = ''|'left'|'right'  → CSS เอียงวงรีและวางลูกศร
         .njf-ring-hint  = ส่วนโค้งไฮไลต์ฝั่งที่ต้องหมุนไป
         .njf-ok         = เครื่องหมาย ✓ กลางวง
       เป็นการแสดงผลล้วน ไม่แตะการตรวจมุม/คุณภาพภาพ/Descriptor */
    /* [UI] Live feedback ระหว่างหมุนหน้า — ใช้ค่า y (yaw) ที่ลูปคำนวณอยู่แล้ว
       ไม่เพิ่มการประมวลผลใหม่ · ไม่เรียก detect เพิ่ม · ไม่แตะเกณฑ์ผ่าน

       prog = ความคืบหน้าของ "มุมนี้" 0..1 เทียบกับเกณฑ์จริงของแต่ละท่า
         FRONT ผ่านเมื่อ |y| < YAW_FRONT_MAX → ยิ่งเข้าใกล้ 0 ยิ่งใกล้ผ่าน
         LEFT  ผ่านเมื่อ y > YAW_TURN_MIN    → 0..YAW_TURN_MIN คือช่วงกำลังหมุน
         RIGHT ผ่านเมื่อ y < -YAW_TURN_MIN
       ตัวหารของ FRONT ใช้ YAW_FRONT_MAX × 3.33 เท่าอัตราส่วนเดิม (0.60 ต่อเกณฑ์ 0.18)
       state: 'far' ยังไม่ถึง · 'near' ใกล้แล้ว (>=70%) · 'hit' ถึงเกณฑ์
       ทั้งหมดเป็นการแสดงผล — เกณฑ์ผ่านจริงยังใช้ pose.test(y) เท่านั้น
       y === null (อ่าน Landmark ไม่ได้) → ถือเป็น 0% และไม่ hit */
    function poseLive(pose, y) {
      try {
        var cam = S.root && S.root.querySelector('.njf-cam');
        if (!cam || !pose) return;
        var prog = 0;
        if (y == null) {
          prog = 0;
        } else if (pose.key === 'FRONT') {
          prog = Math.max(0, Math.min(1, 1 - (Math.abs(y) / (YAW_FRONT_MAX * 3.33))));
        } else if (pose.key === 'LEFT') {
          prog = Math.max(0, Math.min(1, y / YAW_TURN_MIN));
        } else {
          prog = Math.max(0, Math.min(1, -y / YAW_TURN_MIN));
        }
        var hit = !!pose.test(y);
        cam.dataset.live = hit ? 'hit' : (prog >= 0.7 ? 'near' : 'far');

        /* วงแหวนชั้นในบอกความคืบหน้าของมุมนี้แบบสด */
        var lv = document.getElementById('njf-ring-live');
        if (lv) {
          var len = lv.getTotalLength ? lv.getTotalLength() : 424;
          lv.style.strokeDasharray = len;
          lv.style.strokeDashoffset = String(len * (1 - (hit ? 1 : prog)));
        }
      } catch (e) {}
    }

    function poseVisual(pose, done) {
      try {
        var cam = S.root && S.root.querySelector('.njf-cam');
        var oval = document.getElementById('njf-oval');
        var turn = document.getElementById('njf-turn');
        var ok = document.getElementById('njf-ok');
        var hintArc = document.getElementById('njf-ring-hint');
        var dir = (pose && pose.key === 'LEFT') ? 'left'
                : (pose && pose.key === 'RIGHT') ? 'right' : '';

        if (cam) {
          cam.dataset.dir = done ? '' : dir;
          cam.dataset.done = done ? '1' : '';
          cam.dataset.live = done ? 'hit' : 'far';   // เริ่มมุมใหม่ = รีเซ็ตสถานะสด
        }
        var lv0 = document.getElementById('njf-ring-live');
        if (lv0 && !done) { lv0.style.strokeDashoffset = ''; }
        if (oval) { oval.classList.toggle('ok', !!done); }
        if (turn) { turn.className = 'njf-turn' + (dir && !done ? ' show ' + dir : ''); }
        if (ok) { ok.classList.toggle('show', !!done); }
        if (hintArc) { hintArc.className.baseVal = 'njf-ring-hint' + (dir && !done ? ' ' + dir : ''); }
      } catch (e) {}
    }

    function drawPoses(msg, err, stepDone) {
      var cur = POSES[idx] || POSES[POSES.length - 1];
      var shown = Math.min(idx + (stepDone ? 1 : 0), POSES.length);
      var pct = Math.round((shown / POSES.length) * 100);
      ringSet(shown / POSES.length, !!stepDone);
      poseVisual(cur, !!stepDone);

      panel(
        '<div class="njf-steps">' + POSES.map(function (p, i) {
          var st = (i < idx || (i === idx && stepDone)) ? 'done' : (i === idx ? 'on' : '');
          return '<div class="njf-step ' + st + '"><span>' +
                 (st === 'done' ? '&#10003;' : String(i + 1)) + '</span></div>';
        }).join('<i class="njf-steps-line"></i>') + '</div>' +

        '<div class="njf-title' + (stepDone ? ' ok' : '') + '">' +
          (cur.arrow && !stepDone ? '<b class="njf-arrow">' + cur.arrow + '</b>' : '') +
          esc(stepDone ? (cur.done || cur.label) : (cur.title || cur.label)) +
          (stepDone ? ' <b class="njf-tick">&#10003;</b>' : '') +
        '</div>' +

        '<div class="njf-prog"><div class="njf-prog-bar" style="width:' + pct + '%"></div></div>' +
        '<div class="njf-prog-txt">' + shown + '/' + POSES.length + '</div>' +

        '<div class="njf-msg' + (err ? ' err' : '') + '" id="njf-msg">' + esc(msg || '') + '</div>' +
        '<div class="njf-actions" id="njf-act"></div>');
      actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
    }

    /* ค่าคงที่ของลูปเก็บภาพหนึ่งมุม
       STABLE_MIN   = เฟรมนำทางที่ผ่านทุกด่านติดกัน ก่อนเริ่มคำนวณ Descriptor
       LIVE_FRAMES  = จำนวน "เฟรมกล้องจริง คนละเวลา" ที่ส่งให้ passiveLiveness
                      (เท่ากับ grabFrames(6) ที่ใช้ในฝั่งลงเวลา/เข้าสู่ระบบ ซึ่งพิสูจน์แล้ว)
                      ห้าม concat/clone/reuse เฟรมเดิมเพื่อเพิ่มจำนวนเด็ดขาด
       POSE_TIMEOUT = ครบเวลาแล้ว "เริ่มนับมุมเดิมใหม่" ไม่ปิดกล้อง ไม่ล้ม Enrollment
       ERR_MAX / ERR_WINDOW = หลักฐานของ Fatal: ต้องพังติดกันครบจำนวน "และ" ต่อเนื่องนานพอ
                      Error ชั่วคราวเพียงไม่กี่เฟรมห้ามถูกยกระดับเป็น Fatal เด็ดขาด */
    var STABLE_MIN = 2, LIVE_FRAMES = 6, POSE_TIMEOUT = 25000, ERR_MAX = 30, ERR_WINDOW = 5000;
    /* [PERF] เดิมหน่วง setTimeout(700) ก่อนเริ่มมุมถัดไป = เวลาตายล้วน 700 x 2 = 1.4 วินาที
       ตรวจแล้วว่าไม่จำเป็นเชิงเทคนิค:
         · ผู้ใช้ต้องหมุนศีรษะเองซึ่งนานกว่า 700 ms อยู่แล้ว
         · มุมใหม่ยังต้องผ่าน STABLE_MIN = 2 เฟรมติดกันก่อนเก็บ Descriptor
           จึงเป็นไปไม่ได้ที่จะจับภาพท่าเก่าค้างมา
         · ฉากเดิม แสงเดิม กล้องตัวเดิม ไม่มีการ re-expose
       → เป็น UI feedback ล้วน (โชว์ "ครบแล้ว ✓")
       ของใหม่: เริ่ม Detection ของมุมถัดไป "ทันที" แล้วค้างจอ ✓ ไว้ DONE_HOLD
       ระหว่างค้างจอจะไม่เขียนข้อความ/วงแหวนทับ ✓ (msg()/poseLive ถูกกั้นไว้) */
    var DONE_HOLD = 320;

    function capturePose(opt) {
      var pose = POSES[idx];
      /* holding = ยังโชว์ ✓ ของมุมก่อนหน้าอยู่ — ตรวจจับเดินแล้ว แต่ยังไม่เขียนทับจอ */
      var holding = !!(opt && opt.holdMs > 0);
      function paintPose() {
        holding = false;
        hint(pose.hint, 'ระบบจะจับภาพอัตโนมัติเมื่อท่าถูกต้อง');
        drawPoses('กำลังตรวจ: ' + pose.label);
      }
      if (holding) {
        setTimeout(function () {
          if (!S.running || !enAlive() || POSES[idx] !== pose) return;
          paintPose();
        }, opt.holdMs);
      } else {
        paintPose();
      }
      /* ระหว่าง holding ห้ามเขียนข้อความ/วงแหวนทับหน้าจอ "ครบแล้ว ✓" */
      function msg(t, err) { if (!holding) setMsg(t, err); }
      function live(p, y) { if (!holding) poseLive(p, y); }
      var t0 = Date.now(), buf = [], stable = 0, errRun = 0, errFirst = 0;
      var poseT0 = perfNow();

      /* ลูปจะเดินต่อได้ก็ต่อเมื่อยังมีเจ้าของอยู่จริง
         Detection หยุดถาวรเฉพาะ: ยกเลิก · เปลี่ยน Route · ออกจากระบบ ·
         กล้องพังถาวร/ถูกถอนสิทธิ์ · เก็บครบแล้วเข้าสู่ finish() */
      function again() {
        if (!S.running || !enAlive()) return;
        S.raf = requestAnimationFrame(loop);
      }
      /* เริ่มนับมุมเดิมใหม่ — รีเซ็ตเฉพาะ timer / เฟรมที่เก็บไว้ / stable ของมุมปัจจุบัน
         ใช้ Camera Stream เดิม · ไม่ปิดกล้อง · ไม่ย้อนมุมที่ผ่านแล้ว · ไม่ล้าง got/snapPath */
      function resetPose(m) {
        t0 = Date.now(); buf.length = 0; stable = 0;
        if (m) msg(m, true);
      }
      /* Fatal จริงเท่านั้น — ต้องเก็บกวาดให้หมด ห้ามเหลือสถานะ "Detection หยุด แต่กล้องยังเปิด"
           closeCam() = camInvalidate + cancelAnimationFrame + stop ทุก Track + ล้าง srcObject + S.running=false
           ++EN.id     = Run นี้ตายทันที · Async ที่ค้างอยู่ (detect/blink/snapshot/upload) เขียน UI/State ไม่ได้อีก
           netOwn(0)   = คำขอเครือข่ายของ Run นี้หมดสิทธิ์
         แล้วแสดง Error ชัดเจนพร้อมทางเลือก ลองใหม่ / ปิด */
      function fatal(reason) {
        closeCam();
        EN.id++;
        netOwn(0);
        holding = false;
        buf.length = 0; stable = 0; errRun = 0; errFirst = 0;
        S.busy = false;
        drawPoses(reason, true);
        actions([
          { label: 'ปิด', style: 'plain', on: close },
          { label: 'ลองใหม่', style: 'primary', on: function () {
            close(); setTimeout(function () { enroll(employeeId, onDone, opts); }, 60);
          } }
        ]);
      }

      /* ยอมรับมุมนี้ — เรียกได้ก็ต่อเมื่อ Liveness ผ่านจริงแล้วเท่านั้น
         (ผ่าน Passive ตรง ๆ หรือผ่าน Blink Challenge) ไม่มีเส้นทางอื่นเข้าถึงจุดนี้ */
      function acceptPose(lvMethod) {
        /* [ข้อ 6] ตรวจ Owner ก่อนเขียน State / Upload / ไป Pose ถัดไป */
        if (!enAlive()) { closeCam(); return; }
        perfMark('enroll_' + pose.key.toLowerCase() + '_ms', poseT0);
        got.push(buf[buf.length - 1].desc);
        /* [ROOT CAUSE 7] มุมสุดท้ายที่ผ่าน Liveness จริง = หลักฐานสดของ Run นี้
           เก็บ Descriptor ตัวล่าสุด + Liveness Method จริงที่ผ่าน (PASSIVE หรือ BLINK)
           ไม่ Clone · ไม่ Reuse ข้ามมุม · ผูกกับ Attendance Operation เดียวกันเท่านั้น */
        if (enAtt && enOp !== null && enKind && idx === POSES.length - 1) {
          enPunch = {
            op: enOp, kind: enKind,
            desc: buf[buf.length - 1].desc,
            method: lvMethod || 'PASSIVE',
            snapshotP: null
          };
        }
        if (idx === 0) {
          snapshotBlob().then(function (b) {
            if (!enAlive()) return null;          // [ข้อ 6] ยกเลิกระหว่างสร้าง Blob
            return uploadSnapshot(b, 'ENROLL', null, employeeId || null);
          }).then(function (p2) {
            if (enAlive()) snapPath = p2;         // [ข้อ 6] Run เก่าห้ามเขียน State
          }).catch(function () {});
        }
        /* [UI] โชว์ "ครบแล้ว ✓" ของมุมที่เพิ่งผ่าน แล้วค่อยไปมุมถัดไป
           หน่วง 700ms เพื่อให้ผู้ใช้เห็นสถานะ — ไม่กระทบการตรวจใด ๆ */
        drawPoses('กำลังขึ้นขั้นตอนถัดไป…', false, true);
        idx++;
        if (!enAlive()) { closeCam(); return; }
        if (idx >= POSES.length) return finish();
        /* [PERF] เริ่มตรวจมุมถัดไปทันที ไม่หน่วง 700 ms — จอยังค้าง ✓ ไว้ DONE_HOLD */
        capturePose({ holdMs: DONE_HOLD });
      }

      /* Passive ก้ำกึ่ง → ต้องกระพริบตายืนยันจริง ห้ามข้ามเด็ดขาด
         ใช้ Camera Stream เดิม (blinkChallenge ไม่เปิด/ปิดกล้อง) และผูก Owner เป็น enAlive() */
      function runChallenge(reason) {
        msg(reason || 'ตรวจสอบบุคคลจริงไม่แน่ใจ กรุณากระพริบตา 1 ครั้ง', true);
        blinkChallenge(function (t) {
          if (S.running && enAlive()) msg(t, true);
        }, enAlive, ENROLL_INFER_TIMEOUT_MS).then(function (ok) {
          if (!S.running || !enAlive()) return;          // Async Boundary หลัง Challenge
          if (!ok) {                                     // ไม่ผ่าน/หมดเวลา = ตรวจมุมเดิมต่อ
            resetPose('ยืนยันบุคคลจริงไม่สำเร็จ — กรุณาลองทำท่าเดิมอีกครั้ง');
            return again();
          }
          /* [ROOT CAUSE 7] ผ่านด้วย Blink Challenge = Liveness Method จริงคือ BLINK */
          acceptPose('BLINK');
        }, function (e) {
          if (!S.running || !enAlive()) return;
          if (isAborted(e)) return;                      // ยกเลิกโดยระบบ = เงียบ
          resetPose((e && e.message) || 'ยืนยันบุคคลจริงไม่สำเร็จ กรุณาลองใหม่');
          again();
        });
      }

      function loop() {
        if (!S.running || !enAlive()) return;
        /* [PERF] ถ้าท่าถูกแล้วแต่ Recognition ยังโหลดไม่เสร็จ ห้ามนับเวลาหมดอายุใส่ผู้ใช้
           ลูปนำทางยังเดินต่อด้วย detectGuide() ตามปกติ ไม่ค้าง ไม่ปิดกล้อง */
        var waitRecog = (stable >= STABLE_MIN) && !S.recogReady;
        if (waitRecog) t0 = Date.now();
        if (!waitRecog && Date.now() - t0 > POSE_TIMEOUT) {
          resetPose('ยังจับภาพ' + pose.label + 'ไม่สำเร็จ — ปรับแสงและระยะ แล้วทำท่าเดิมต่อได้เลย');
          return again();
        }
        /* stable ครบ "และ" Recognition พร้อม เท่านั้นจึงยอมจ่ายค่า Descriptor ของเฟรมนี้ */
        var capturing = (stable >= STABLE_MIN) && !!S.recogReady;
        if (waitRecog) recogPrefetch();       // เผื่อยังไม่ได้เริ่ม (Single-flight ไม่โหลดซ้ำ)
        (capturing ? detect(ENROLL_INFER_TIMEOUT_MS) : detectGuide(ENROLL_INFER_TIMEOUT_MS)).then(function (r) {
          if (!S.running || !enAlive()) return;                    // ตอบหลังหมดอายุ = หยุดเงียบ
          errRun = 0; errFirst = 0;
          if (!r.length) { stable = 0; msg('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ', true); return again(); }
          if (r.length > 1) { stable = 0; msg('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง', true); return again(); }

          var f0 = r[0], box = f0.detection.box, q = frameQuality(box);
          var y = yaw(f0.landmarks);
          live(pose, y);          // [UI] อัปเดตวงแหวน/สีตามมุมปัจจุบัน
          if (!q || q.ratio < 0.045) { stable = 0; msg('เข้าใกล้กล้องขึ้นอีกเล็กน้อย', true); return again(); }
          if (q.brightness < 45)     { stable = 0; msg('แสงน้อยเกินไป กรุณาหาที่สว่างขึ้น', true); return again(); }
          if (q.sharpness < 12)      { stable = 0; msg('ภาพไม่ชัด กรุณาถือนิ่ง', true); return again(); }
          if (!pose.test(y))         { stable = 0; msg(pose.hint, false); return again(); }

          stable++;
          if (!capturing || !f0.descriptor) {   // ยังเป็นเฟรมนำทาง — ไม่มี/ไม่คำนวณ Descriptor
            msg(waitRecog ? 'ท่าถูกต้องแล้ว — กำลังเตรียมระบบยืนยันใบหน้า…'
                             : 'ท่าถูกต้องแล้ว — นิ่งไว้สักครู่');
            return again();
          }

          buf.push({ desc: Array.from(f0.descriptor), q: q, box: box, ear: eyeOpen(f0.landmarks) });
          msg('กำลังจับภาพ ' + pose.label + ' (' + buf.length + '/' + LIVE_FRAMES + ')');
          if (buf.length < LIVE_FRAMES) return again();

          /* เฟรมจริงจากกล้อง คนละเวลา ครบจำนวนแล้วจึงตรวจ Liveness
             ผ่าน       → ยอมรับมุมนี้
             ก้ำกึ่ง     → ต้องกระพริบตายืนยันจริงก่อนเท่านั้น
             ไม่ผ่าน     → เริ่มนับมุมเดิมใหม่
             ไม่มีเส้นทางใดที่ lv.pass=false แล้วเข้าสู่ acceptPose() ได้โดยตรง */
          var lv = passiveLiveness(buf);
          if (lv.pass) return acceptPose(lv.method);
          if (lv.challenge) return runChallenge(lv.reason);
          resetPose(lv.reason);
          return again();
        }).catch(function (e) {
          if (!S.running || !enAlive()) return;
          if (isAborted(e)) return;                 // ยกเลิกโดยระบบ = หยุดเงียบ
          errRun++;
          if (!errFirst) errFirst = Date.now();
          msg((e && e.message) || 'ตรวจใบหน้าไม่สำเร็จ', true);
          /* หลักฐานที่ 1 — กล้องตายจริง (ถูกถอนสิทธิ์/ถอดอุปกรณ์/ถูกแอปอื่นยึด) */
          if (!camUsable()) {
            return fatal('กล้องหยุดทำงานหรือถูกปิดสิทธิ์ — กรุณาเปิดสิทธิ์กล้องแล้วลองใหม่');
          }
          /* หลักฐานที่ 2 — พังติดกันครบจำนวน และต่อเนื่องนานพอ (ไม่ใช่สะดุดชั่วคราว) */
          if (errRun >= ERR_MAX && (Date.now() - errFirst) >= ERR_WINDOW) {
            return fatal('ตรวจใบหน้าไม่สำเร็จต่อเนื่อง — กรุณาลองใหม่อีกครั้ง');
          }
          again();
        });
      }
      loop();
    }

    /* [UI] หน้าจอกำลังบันทึก — pct 0..100 (ใช้เป็นภาพเท่านั้น ไม่ผูกกับความคืบหน้าจริงของ RPC) */
    function saveScreen(pct) {
      var items = POSES.map(function (p) {
        return '<div class="njf-save-li"><b>&#10003;</b>' + esc('บันทึกมุม' + p.label) + '</div>';
      }).join('') +
      '<div class="njf-save-li' + (pct >= 100 ? '' : ' wait') + '">' +
        (pct >= 100 ? '<b>&#10003;</b>' : '<i class="njf-dot"></i>') + 'ตรวจสอบความถูกต้อง</div>';

      panel(
        '<div class="njf-save">' +
        '<div class="njf-save-t">กำลังบันทึกข้อมูลใบหน้า</div>' +
        '<div class="njf-save-s">กรุณาอย่าออกจากหน้านี้</div>' +
        '<div class="njf-save-list">' + items + '</div>' +
        '<div class="njf-prog"><div class="njf-prog-bar" id="njf-save-bar" style="width:' +
          Math.max(0, Math.min(100, pct)) + '%"></div></div>' +
        '<div class="njf-prog-txt" id="njf-save-pct">' + Math.round(pct) + '%</div>' +
        '</div>' +
        '<div class="njf-actions" id="njf-act"></div>');
      actions([]);   // ระหว่างบันทึก ไม่ให้กดยกเลิก (พฤติกรรมเดิมของขั้นนี้)
    }

    /* ขยับแถบให้ผู้ใช้เห็นว่ากำลังทำงาน — หยุดเองเมื่อ RPC ตอบกลับ */
    var saveTick = 0;
    function saveProgressStart() {
      var pct = 8;
      saveTick = setInterval(function () {
        if (!enAlive()) { clearInterval(saveTick); return; }
        pct = Math.min(92, pct + 6);
        var bar = document.getElementById('njf-save-bar');
        var txt = document.getElementById('njf-save-pct');
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = Math.round(pct) + '%';
      }, 220);
    }
    function saveProgressStop() { if (saveTick) { clearInterval(saveTick); saveTick = 0; } }

    /* [ROOT CAUSE 7] ถ่ายหลักฐานสำหรับ "การลงเวลา" ก่อนปิดกล้อง
       ต้องเป็น Snapshot คนละใบกับ ENROLL Snapshot และเป็นชนิด PUNCH จริง
       (edge njhr-face-file รับ p_kind แยก PUNCH/ENROLL/REQUEST อยู่แล้ว)
       ล้มเหลว = ปล่อยเป็น null แล้วลงเวลาต่อได้ตามเดิม ไม่บล็อก Flow */
    function finish() {
      var canShoot = !!(enPunch && camUsable() && S.video && S.video.videoWidth);
      var shotP = canShoot ? snapshotBlob()['catch'](function () { return null; })
                           : Promise.resolve(null);
      shotP.then(function (b) {
        if (b && enPunch && enAlive()) {
          enPunch.snapshotP = uploadSnapshot(b, 'PUNCH', enPunch.kind, null)
            ['catch'](function () { return null; });
        }
        finishSave();
      }, function () { finishSave(); });
    }

    function finishSave() {
      closeCam();
      if (!enAlive()) { closeCam(); return; }              // [ข้อ 6] ก่อน finish()/เปลี่ยน UI
      /* [UI] หน้าจอ "กำลังบันทึกข้อมูลใบหน้า" — checklist มุมที่เก็บได้ + progress
         เป็นการแสดงผลล้วน: อ่านจาก POSES/got ที่มีอยู่แล้ว ไม่คำนวณอะไรใหม่
         ไม่แตะ RPC · ไม่แตะ descriptors · ไม่แตะเงื่อนไขบันทึก */
      saveScreen(0);
      saveProgressStart();
      /* ไม่ระบุ employeeId = พนักงานลงทะเบียนใบหน้าของตัวเองจากมือถือ
         ใช้ njhr_face_self_enroll ซึ่งไม่มีพารามิเตอร์ p_employee เลย
         พนักงานเป้าหมายมาจาก session ฝั่งฐานข้อมูลเท่านั้น จึงลงทะเบียนแทนคนอื่นไม่ได้
         ถ้าระบุ employeeId (หน้าจัดการพนักงานของ HR) ยังใช้ njhr_face_enroll เดิม */
      var isSelf = !employeeId;
      var q = { samples: got.length, captured_at: new Date().toISOString() };
      var fnName, body;
      if (!isSelf) {
        fnName = 'njhr_face_enroll';
        body = { p_token: token(), p_employee: employeeId, p_descriptors: got,
                 p_quality: q, p_snapshot: snapPath };
      } else if (reNew) {
        fnName = 'njhr_face_self_reenroll';
        body = { p_token: token(), p_password: opts.password, p_descriptors: got,
                 p_quality: q, p_snapshot: snapPath };
      } else {
        fnName = 'njhr_face_self_enroll';
        body = { p_token: token(), p_descriptors: got, p_quality: q, p_snapshot: snapPath };
      }
      if (!enAlive()) { closeCam(); return; }     // [ข้อ 4] ถูกยกเลิกก่อนส่ง = ห้ามส่ง RPC
      /* [INSTRUMENTATION] นับก่อนยิง RPC จริง — แยกตามชื่อฟังก์ชันที่ใช้จริง */
      if (fnName === 'njhr_face_self_enroll') perfBootCount('njhr_face_self_enroll_calls');
      rpc(fnName, body).then(function (r) {
        if (!enAlive()) { closeCam(); return; }   // [ข้อ 4] ถูกยกเลิกหลังส่ง = ไม่แสดงผล ไม่ Handoff
        faceStatusReset();     // [PERF/ถูกต้อง] Enrollment เปลี่ยน = Cache เดิมใช้ไม่ได้
        saveProgressStop();
        perfEnd('total_enrollment_ms');
        /* [UI] หน้าจอสำเร็จ — วงกลมเขียว ✓ + สรุปมุมที่เก็บได้
           ไม่แสดงรูปใบหน้าจริง (Snapshot อยู่ใน bucket private) จึงใช้ป้ายมุมแทน */
        panel(
          '<div class="njf-done">' +
          '<div class="njf-done-ic">&#10003;</div>' +
          '<div class="njf-done-t">' +
            esc(reNew ? 'ลงทะเบียนใบหน้าใหม่ สำเร็จ!' : 'ลงทะเบียนใบหน้า สำเร็จ!') + '</div>' +
          '<div class="njf-done-s">พร้อมใช้งานสแกนหน้าเข้าสู่ระบบ</div>' +
          '<div class="njf-done-tags">' + POSES.map(function (p) {
            return '<span class="njf-done-tag"><b>&#10003;</b>' + esc(p.label) + '</span>';
          }).join('') + '</div>' +
          '<div class="njf-done-n">เก็บใบหน้าไว้ ' +
            ((r && r.sample_count) || got.length) + ' มุม</div>' +
          '</div>' +
          '<div class="njf-actions" id="njf-act"></div>');
        actions([{ label: 'เสร็จสิ้น', style: 'primary', on: function () {
          /* [ข้อ 1] โหมด Attendance → Handoff (ไม่ฆ่า Operation) แล้วต่อไป doPunch()
             โหมด Manual → close() ปกติเหมือนเดิมทุกประการ */
          if (enAtt) closeSoft(); else close();
          /* [ROOT CAUSE 7] ส่งหลักฐานสดของ Run นี้ต่อให้ enrollThenPunch
             โหมด Manual (Profile/HR) enPunch เป็น null เสมอ → onDone(r) เหมือนเดิมทุกประการ */
          if (typeof onDone === 'function') onDone(r, enAtt ? enPunch : null);
        } }]);
      }).catch(function (e) {
        saveProgressStop();
        if (isAborted(e) || !enAlive()) return;   // [ข้อ 5] Run ถูกยกเลิก = เงียบ
        drawPoses((e && e.message) || 'บันทึกไม่สำเร็จ', true);
        actions([
          { label: 'ปิด', style: 'plain', on: close },
          { label: 'ลองใหม่', style: 'primary', on: function () {
            close(); setTimeout(function () { enroll(employeeId, onDone, opts); }, 60);
          } }
        ]);
      });
    }

    perfStart('ENROLL');
    drawPoses('กำลังเตรียมกล้อง…');
    var tCamE = perfNow();
    var camE = openCam();
    camE.then(function () { perfMark('camera_start_ms', tCamE); }, function () {});
    /* [PERF] เริ่มนำทาง 3 มุมได้ทันทีเมื่อ GUIDE พร้อม ไม่ต้องรอ Recognition 6.44 MB
       Recognition โหลด Background · capturePose() จะรอเองตอน stable ผ่านและถึงคิวทำ Descriptor */
    var modelE = guideLoad();
    recogPrefetch();
    camE.then(function () { if (!S.guideReady) drawPoses('กำลังเตรียมระบบตรวจสอบใบหน้า…'); }, function () {});
    modelE['catch'](function () {});
    Promise.all([camE, modelE]).then(function () {
      if (!enAlive()) { closeCam(); throw AbortAttendanceError(); }   // [ข้อ 5] หลัง Cam+Model
      perfMark('guide_visible_ms');
      S.running = true;
      capturePose();
    }).catch(function (e) {
      /* [ข้อ 3] Run เก่าที่ Reject ทีหลังห้าม closeCam() กล้องของ Run ใหม่
         และห้ามเขียน UI / S.busy ของ Run ใหม่ */
      if (isAborted(e) || !enAlive()) return;
      closeCam();                              // ฝั่งใดฝั่งหนึ่งล้มเหลว ต้องไม่ปล่อยกล้องค้างเปิด
      drawPoses((e && e.message) || 'เปิดกล้องไม่สำเร็จ', true);
      actions([{ label: 'ปิด', style: 'plain', on: close }]);
      S.busy = false;
    });
  }

  /* ---------- ปิดกล้องเมื่อออกจากหน้า ---------- */
  w.addEventListener('hashchange', close);
  /* ---------- [ข้อ 6] Background Cleanup แบบรู้โหมด ----------
     เดิม pagehide / visibilitychange เรียกแค่ closeCam() ซึ่งไม่พอสำหรับการลงเวลา
     เพราะ GPS Watch · Attendance Operation · Network ของ Attempt ยังทำงานต่อ

     ATTENDANCE / ENROLL → ยกเลิกทั้ง Operation อย่างปลอดภัย
        (invalidate OP+EN · closeCam+RAF · stop GPS Watch · abort Attempt Network · ปิด Overlay)
     LOGIN (Face Login) → คงพฤติกรรมเดิมทุกประการ: ปิดกล้องอย่างเดียว ไม่แตะ Logic
        เหตุผล: Face Login ไม่มี GPS/Operation และการปิด Flow ทิ้งจะทำให้ผู้ใช้
        กลับมาแล้วเจอหน้าจอค้าง — เดิมทำงานถูกอยู่แล้วจึงไม่แตะ */
  function bgCleanup() {
    if (S.mode === 'ATTENDANCE' || S.mode === 'ENROLL') { close(); return; }
    closeCam();
  }
  w.addEventListener('pagehide', bgCleanup);
  d.addEventListener('visibilitychange', function () { if (d.hidden) bgCleanup(); });

  /* ---------- สแกนใบหน้าเข้าสู่ระบบ ----------
     ⚠ ไม่ขอ GPS และไม่อ่านตำแหน่งใด ๆ — ตำแหน่งใช้เฉพาะการลงเวลาเท่านั้น
     ⚠ ไม่ถ่าย Snapshot และไม่สร้าง Attendance — เข้าสู่ระบบอย่างเดียว
     การตัดสินว่าใบหน้านี้เป็นใครทำที่ฐานข้อมูลทั้งหมด (njhr_face_login)
     เบราว์เซอร์ส่งไปแค่เวกเตอร์ของหน้าตัวเอง ไม่เคยได้รับทะเบียนใบหน้าของใคร */
  /* ข้อความที่พนักงานเห็น — ส่งต่อเฉพาะข้อความภาษาไทยที่ระบบเราตั้งใจสื่อสารเอง
     ข้อความอังกฤษจากฐานข้อมูล/PostgREST ถือเป็นข้อผิดพลาดทางเทคนิค แสดงเป็นข้อความกลาง */
  function faceUserMsg(e) {
    var raw = (e && e.message) || '';
    if (/[\u0E00-\u0E7F]/.test(raw)) return raw;
    return 'ไม่สามารถเข้าสู่ระบบด้วยใบหน้าได้ในขณะนี้ ' +
           'กรุณาลองใหม่หรือเข้าสู่ระบบด้วยรหัสผ่าน';
  }

  function login(onOk, onCancel) {
    if (S.busy) return;
    S.busy = true;
    S.mode = 'LOGIN';                         // [ข้อ 1/6] Face Login คนละ Context — ห้ามถูก cancelAttendance ปิด
    shell('สแกนใบหน้าเข้าสู่ระบบ', 'มองกล้องให้อยู่ในกรอบ');
    var st = { live: 'wait', match: 'wait' };
    panel(stepsHtml(st, 'กำลังเตรียมกล้อง…'));
    actions([{ label: 'ยกเลิก', style: 'ghost', on: function () {
      close(); if (typeof onCancel === 'function') onCancel();
    } }]);

    perfStart('LOGIN');
    var tCam = perfNow();
    var camL = openCam();
    camL.then(function () { perfMark('camera_start_ms', tCam); }, function () {});
    /* [PERF] Cold Start: รอเฉพาะ GUIDE (550 KB) แล้วเห็นกรอบใบหน้าได้ทันที
       Recognition (6.44 MB) โหลด Background — grabFrames() จะรอเองก่อนสร้าง Descriptor */
    var modelL = guideLoad();
    recogPrefetch();
    camL.then(function () {
      if (!S.guideReady) { panel(stepsHtml(st, 'กำลังเตรียมระบบตรวจสอบใบหน้า…')); }
    }, function () {});
    modelL['catch'](function () {});

    Promise.all([camL, modelL])
      .then(function () {
        perfMark('guide_visible_ms');          // กด Face Login → เห็นกล้อง+กรอบนำทาง
        S.running = true;
        st.live = 'run'; panel(stepsHtml(st, 'กำลังตรวจสอบบุคคลจริง…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: function () {
          close(); if (typeof onCancel === 'function') onCancel();
        } }]);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        return grabFrames(6, function (warn) { if (warn) setMsg(warn, true); });
      })
      .then(function (frames) {
        var lv = passiveLiveness(frames);
        if (lv.pass) return { frames: frames, live: lv };
        if (!lv.challenge) throw new Error(lv.reason);
        setMsg(lv.reason, false);
        hint('กรุณากระพริบตา 1 ครั้ง', 'ระบบกำลังยืนยันว่าเป็นบุคคลจริง');
        return blinkChallenge(function (t) { setMsg(t); }).then(function (ok) {
          if (!ok) throw new Error('ตรวจสอบบุคคลจริงไม่ผ่าน กรุณาลองใหม่');
          return grabFrames(3, null).then(function (f2) {
            return { frames: f2, live: { pass: true, method: 'BLINK' } };
          });
        });
      })
      .then(function (ctx) {
        st.live = 'ok'; st.match = 'run';
        closeCam();                            // ปิดกล้องก่อนยิงเซิร์ฟเวอร์
        panel(stepsHtml(st, 'กำลังยืนยันตัวตน…'));
        var best = ctx.frames[ctx.frames.length - 1];
        if (typeof w.NJHR_faceLogin !== 'function') {
          throw new Error('ระบบเข้าสู่ระบบด้วยใบหน้ายังไม่พร้อมใช้งาน');
        }
        perfMark('client_face_ms');                 // เวลาฝั่ง Client ล้วน (ยังไม่รวม RPC)
        var tRpc = perfNow();
        return w.NJHR_faceLogin(best.desc, ctx.live.method).then(function (row) {
          perfMark('rpc_ms', tRpc);                 // เวลาฝั่ง Server ล้วน — ห้ามรวมเป็นตัวเลขเดียว
          return row;
        });
      })
      .then(function (row) {
        perfEnd('total_face_login_ms');
        st.match = 'ok';
        panel('<div class="njf-check" style="margin:0 auto 12px">&#10003;</div>' +
          '<div class="njf-msg"><b>เข้าสู่ระบบสำเร็จ</b><br>' +
          esc(row.emp_name || row.username || '') + '</div>');
        S.busy = false;
        close();
        if (typeof onOk === 'function') onOk(row);
      })
      ['catch'](function (e) {
        closeCam();
        st.match = 'bad';
        /* ⚠ Error ดิบจากฐานข้อมูล/PostgREST (เช่น schema cache) ห้ามโชว์ให้พนักงาน
           แต่ต้องไม่กลบจนตรวจปัญหาไม่ได้ — Console ยังเห็นข้อความจริงเสมอ */
        try { console.error('[FACE LOGIN] ล้มเหลว:', e); } catch (e2) {}
        panel(stepsHtml(st, faceUserMsg(e), true));
        actions([
          { label: 'เข้าสู่ระบบด้วยรหัสผ่าน', style: 'plain', on: function () {
            close(); if (typeof onCancel === 'function') onCancel();
          } },
          { label: 'ลองใหม่', style: 'primary', on: function () {
            close(); setTimeout(function () { login(onOk, onCancel); }, 60);
          } }
        ]);
        S.busy = false;
      });
  }

  /* [BOOT JANK] เริ่มเก็บ longtask ทันทีที่โมดูลถูกโหลด
     ต้องอยู่ "ก่อน" ที่ผู้เรียกจะมีโอกาสเรียก NJHRFace.warmup() ได้
     ทำงานเฉพาะเมื่อเปิดโหมดวัดผลเท่านั้น — ปิดอยู่ = ไม่สร้าง Observer ใด ๆ */
  try { perfLongTaskStart(); } catch (e) {}

  w.NJHRFace = {
    /* [TEST KIT] ทางเข้าเดียวของ Performance API — ชี้ไปยัง Object เดิม ไม่ได้สร้างชุดใหม่ */
    perf: w.NJHRFacePerf,
    /* อุ่นเครื่องระบบตรวจใบหน้าไว้ล่วงหน้า (ไลบรารี + โมเดล) แบบไม่บล็อกหน้าจอ
       ใช้ S.loading/S.ready ตัวเดิมเป็น State กลาง จึงไม่โหลดซ้ำและกัน Concurrent Load ได้เอง
       ล้มเหลวก็เงียบ — ตอนกดสแกนจริงจะโหลดใหม่ตามเส้นทางเดิม */
    warmup: function () {
      addCss();
      swModelBind();            // ผูกก่อน warmup เสมอ ไม่งั้นสัญญาณรอบแรกหลุด
      /* [ข้อ 3] warmup() = โมเดลอย่างเดียว — Face Status ถูก Preload แยกต่างหาก
         ผ่าน statusPreload() เพื่อไม่ให้ติด flag "อุ่นแล้ว" ตอนสลับบัญชี
         [ROOT CAUSE 3] เดิมอุ่น GUIDE ให้เสร็จ "ก่อน" แล้วค่อยเริ่ม RECOGNITION (Serial)
         ทำให้เวลารวมเท่ากับผลบวกของสองเฟส ทั้งที่ทั้งคู่เป็น Network-bound คนละไฟล์
         ของใหม่เริ่มพร้อมกันแบบขนาน — ความหมายเดิมไม่เปลี่ยน:
         Promise ที่คืนยัง Resolve เมื่อพร้อมครบทั้ง 2 เฟส และล้มเหลวก็ยังเงียบ
         ⚠ หน้า Login ยังใช้ warmupGuide() ตามเดิม ไม่ดึง Recognition 6.44 MB
            ให้ผู้ที่เลือกเข้าสู่ระบบด้วยรหัสผ่านโดยไม่จำเป็น */
      return Promise.all([
        guideLoad()['catch'](function () {}),
        recogLoad()['catch'](function () {})
      ]).then(function () {})['catch'](function () {});
    },
    /* [PERF] อุ่นเฉพาะ GUIDE (550 KB) — ใช้บนหน้า Login เพื่อลด Cold Start
       ไม่ดึง Recognition 6.44 MB มาให้คนที่เข้าด้วยรหัสผ่านโดยไม่จำเป็น */
    warmupGuide: function () {
      addCss();
      swModelBind();
      return guideLoad()['catch'](function () {});
    },
    /* [PERF] สั่งโหลด Recognition แบบ Background · Single-flight ไม่โหลดซ้ำ
       ⚠ ตัวนี้ "สร้าง Model Graph" ด้วย ซึ่งกิน Main Thread บนเครื่อง Android รุ่นล่าง */
    prefetchRecognition: function () { recogPrefetch(); },
    /* [PERF · OPT-IN] ดึงไฟล์โมเดล Recognition เข้า HTTP/Service Worker Cache เท่านั้น
       ไม่แตะ faceapi ไม่สร้าง Model Graph จึงไม่กิน Main Thread
       ใช้สำหรับการวัด A/B บนเครื่องจริง (ดูหัวข้อ 1c ใน REAL-DEVICE-TEST-KIT.md)
       ⚠ ไม่ได้ถูกเรียกโดยค่าเริ่มต้น — กลยุทธ์ warmup ปัจจุบันยังเป็น Full parallel เหมือนเดิม
          จะเปลี่ยนค่าเริ่มต้นได้ต่อเมื่อมีตัวเลขจากเครื่องจริงยืนยันตามเกณฑ์ที่กำหนดไว้ */
    prefetchRecognitionBytes: function () {
      swModelBind();
      swModelBeginLoad();
      var urls = [MODEL_URL_LOCAL + '/face_recognition_model-weights_manifest.json',
                  MODEL_URL_LOCAL + '/face_recognition_model.bin'];
      var t0 = perfNow();
      return Promise.all(urls.map(function (u) {
        return fetch(u, { cache: 'force-cache' })['catch'](function () { return null; });
      })).then(function () {
        perfDur('recognition_bytes_prefetch_ms', t0);
      })['catch'](function () {});
    },
    /* [GPS WARMUP] เรียกจากหน้าลงเวลาเท่านั้น (Mobile · attendance_required === true)
       เริ่ม watchPosition ล่วงหน้าเพื่อให้ตอนกดปุ่มมี Fix พร้อมใช้ทันที
       ไม่เปิดกล้อง ไม่ยิง RPC ไม่เก็บพิกัดลง storage — อยู่ในหน่วยความจำของหน้าเท่านั้น */
    gpsWarmStart: function () {
      try { GPS_WARM_WANTED = true; return gpsWarmStart(); } catch (e) { return 0; }
    },
    /* ออกจากหน้าลงเวลา = หยุด watcher คืนแบตเตอรี่ และล้าง Fix ทั้งหมด */
    gpsWarmStop: function () {
      try {
        GPS_WARM_WANTED = false;
        gpsStop();
        G.fixes = []; G.warm = false; G.owner = '';
        gfReset();                              // [ROOT CAUSE 5] ผล Preflight ของหน้าเดิมใช้ต่อไม่ได้
      } catch (e) {}
    },
    /* [ROOT CAUSE 5] Preflight ด้วย njhr_gf_check (RPC เดิม ไม่มี SQL ใหม่)
       คืน { stage, pass, reason, accuracy, geofence_name, distance_m, radius }
       stage='GPS'   = ยังไม่มี Fix ที่ใช้ได้ · stage='CHECK' = ถามเซิร์ฟเวอร์แล้ว
       กัน RPC ซ้อนและ Throttle ให้อยู่แล้วภายใน ผู้เรียกไม่ต้องจัดการเอง */
    gpsPreflight: function (force) {
      try { return gpsPreflight(force === true); }
      catch (e) { return Promise.resolve(null); }
    },
    /* [GPS HANDOFF] รับ Fix ที่หน้าลงเวลาเก็บไว้จาก bootstrap watcher
       ก่อน face.js โหลดเสร็จ — ไม่ต้องรอ First Fix ใหม่ทั้งรอบ
       ยอมรับเฉพาะเมื่อครบทุกเงื่อนไข ไม่งั้นทิ้ง (Fail Closed):
         · watcher ตัวจริงเดินอยู่แล้ว (G.id)
         · Owner ตรงกับ Session ปัจจุบัน (gpsOwnerKey)
         · Session ที่ระบุตรงกับ G.sid ปัจจุบัน
         · Fix สดกว่า GPS_FRESH_MS และไม่เก่ากว่าตอน watcher เริ่มเดิน
         · watcher ตัวจริงยังไม่เคยได้ Fix เลย (ใช้เร่ง First Fix เท่านั้น)
       ⚠ ไม่ persist ลง storage ใด ๆ · ไม่ Export lat/lng
       ⚠ Server ยังตรวจ accuracy + geofence ซ้ำใน njhr_gf_check และ njhr_att_punch_face */
    gpsSeedFix: function (fix, sid) {
      try {
        if (!fix || fix.lat == null || fix.lng == null || fix.accuracy == null) return false;
        if (!G.id || !G.sid) return false;
        if (sid !== undefined && sid !== G.sid) return false;
        if (G.owner !== gpsOwnerKey()) return false;
        if (G.denied) return false;
        if (G.fixes.length) return false;
        var at = Number(fix.at);
        if (!isFinite(at) || at <= 0) return false;
        var now = Date.now();
        if ((now - at) > GPS_FRESH_MS) return false;
        if (at < (G.startedAt || now) - GPS_FRESH_MS) return false;
        var acc = Number(fix.accuracy);
        if (!isFinite(acc) || acc <= 0) return false;
        G.fixes.push({ ok: true, lat: Number(fix.lat), lng: Number(fix.lng),
                       accuracy: acc, at: at, sid: G.sid });
        perfBootSet('gps_first_fix_ms', Math.max(0, at - (G.startedAt || at)));
        perfBootCount('gps_seed_accepted');
        gpsNotify();
        return true;
      } catch (e) { return false; }
    },
    /* Session ปัจจุบันของ GPS — ใช้ผูก Fix ที่ส่งต่อให้ถูกรอบ */
    gpsSid: function () { try { return G.sid; } catch (e) { return 0; } },
    /* [GF CACHE] ผล pass ที่ยังสดสำหรับ Fix ปัจจุบัน — ไม่ยิง RPC ไม่มี Side Effect
       ใช้ให้ UI คงสถานะปุ่มไว้ได้โดยไม่ต้องปิด-เปิดทุกวินาที
       คืน null ทันทีเมื่อ Session เปลี่ยน · Fix เปลี่ยน · ผลหมดอายุ · pass ไม่ใช่ true */
    gpsPreflightCached: function () {
      try {
        var fix = gpsPickFresh(G.sid);
        var c = gfCacheValid(fix);
        if (!c) return null;
        return { stage: 'CHECK', pass: true, cached: true, reason: c.reason,
                 accuracy: c.accuracy, geofence_name: c.geofence_name,
                 distance_m: c.distance_m, radius: c.radius };
      } catch (e) { return null; }
    },
    /* [ROOT CAUSE 5] แจ้ง UI ทันทีที่ watchPosition ยิง Fix/Error — ไม่ต้องรอรอบ Poll
       คืนฟังก์ชันสำหรับยกเลิกการติดตาม */
    onGpsChange: function (fn2) {
      try { return gpsSubscribe(fn2); } catch (e) { return function () {}; }
    },
    /* [ROOT CAUSE 1] สภาพแวดล้อมกล้อง — ใช้แสดงคำแนะนำเฉพาะกรณีบนหน้าลงเวลา
       ไม่มีข้อมูลอ่อนไหวใด ๆ */
    cameraEnv: function () {
      try { return camEnv(); } catch (e) { return null; }
    },
    /* สถานะสำหรับ UI — คืนเฉพาะ active/denied/ready/accuracy ไม่คืนพิกัด */
    gpsState: function () { try { return gpsWarmState(); } catch (e) { return null; } },
    statusPreload: faceStatusPreload,
    statusReset: faceStatusReset,
    isReady: function () { return !!S.ready; },
    /* [PERF] สถานะแยกเฟส — ไว้ให้ UI/Diagnostic อ่าน ไม่มีโค้ดเดิมพึ่งพา */
    isGuideReady: function () { return !!S.guideReady; },
    isRecognitionReady: function () { return !!S.recogReady; },
    punch: punch,
    enroll: enroll,
    login: login,
    close: close,
    snapshotUrl: snapshotUrl,
    isOpen: function () { return !!S.root; },
    /* [ข้อ 5] ยกเลิกเฉพาะ Face "Attendance" ที่ค้างอยู่ (Route change / Logout / Session invalid)
       Face Login (mode ว่าง หรือโหมดอื่น) จะไม่ถูกปิดโดยไม่ตั้งใจเด็ดขาด */
    cancelAttendance: function () {
      if (S.mode !== 'ATTENDANCE') return false;
      close();                                 // closeCam + cancelAnimationFrame + clearWatch + invalidate aid
      return true;
    },
    mode: function () { return S.mode || ''; }
  };
})(window, document);
