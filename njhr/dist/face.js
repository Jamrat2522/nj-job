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
    ready: false, loading: null, cssAdded: false, mode: '',
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
    return new Promise(function (res, rej) {
      if (w.faceapi) return res();
      var s = d.createElement('script');
      s.src = src; s.async = true;
      s.onload = res;
      s.onerror = function () {
        s.remove();
        rej(new Error('โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ ตรวจอินเทอร์เน็ต'));
      };
      d.head.appendChild(s);
    });
  }
  function faceNets(base) {
    var f = w.faceapi;
    return Promise.all([
      f.nets.tinyFaceDetector.loadFromUri(base),
      f.nets.faceLandmark68Net.loadFromUri(base),
      f.nets.faceRecognitionNet.loadFromUri(base)
    ]);
  }
  function loadModels() {
    if (S.ready) return Promise.resolve();
    if (S.loading) return S.loading;
    /* Local ก่อน → พลาดค่อยถอยไป CDN (แจ้งใน Console ให้ผู้ดูแลเห็นว่า Deploy โมเดลไม่ครบ)
       พลาดทั้งคู่ = Error ข้อความเดิม และ S.loading ถูกล้างให้กดลองใหม่ได้เหมือนเดิม */
    S.loading = faceScript(FACE_API_LOCAL)['catch'](function () {
      try { console.error('[FACE] โหลด assets/models/face-api.js ไม่สำเร็จ — ใช้ CDN สำรอง'); } catch (e2) {}
      return faceScript(FACE_API_CDN);
    }).then(function () {
      return faceNets(MODEL_URL_LOCAL)['catch'](function () {
        try { console.error('[FACE] โหลดโมเดลจาก assets/models ไม่สำเร็จ — ใช้ CDN สำรอง'); } catch (e2) {}
        return faceNets(MODEL_URL_CDN);
      });
    }).then(function () {
      S.ready = true;
    }).catch(function (e) {
      S.loading = null;
      throw new Error(e.message || 'โหลดโมเดลตรวจใบหน้าไม่สำเร็จ');
    });
    return S.loading;
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

  function openCam() {
    if (S.stream) return Promise.resolve(S.stream);   // กันเปิดซ้ำ
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('อุปกรณ์นี้ไม่รองรับการเปิดกล้อง'));
    }
    var myGen = CAM.gen;
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    }).then(function (st) {
      /* คำขอนี้หมดอายุแล้ว (ถูก Cancel/Logout/Route Change ระหว่างรอสิทธิ์กล้อง)
         → ปิด Track ทิ้งทันที ห้ามเขียน S.stream ห้าม srcObject ห้าม play()
         แล้วจบแบบ Cancel เงียบ */
      if (myGen !== CAM.gen || !S.video) {
        try { st.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e2) {} }); } catch (e3) {}
        throw AbortAttendanceError();
      }
      S.stream = st;
      S.video.srcObject = st;
      S.video.setAttribute('playsinline', '');   // iPhone ต้องมี ไม่งั้นเปิดเต็มจอ
      return S.video.play().then(function () {
        if (myGen !== CAM.gen) {                 // หมดอายุระหว่างรอ play()
          closeCam();
          throw AbortAttendanceError();
        }
        return st;
      });
    }).catch(function (e) {
      if (isAborted(e)) throw e;                 // ยกเลิกเงียบ ไม่แปลงเป็นข้อความ Error
      var n = e && e.name;
      if (n === 'NotAllowedError' || n === 'SecurityError') {
        throw new Error('กล้องไม่ได้รับอนุญาต — เปิดสิทธิ์กล้องในตั้งค่าเบราว์เซอร์แล้วลองใหม่');
      }
      if (n === 'NotFoundError') throw new Error('ไม่พบกล้องหน้าบนอุปกรณ์นี้');
      if (n === 'NotReadableError') throw new Error('กล้องถูกใช้งานโดยแอปอื่นอยู่');
      throw new Error('เปิดกล้องไม่สำเร็จ');
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

  /* ---------- ตรวจใบหน้าหนึ่งเฟรม ---------- */
  function detect() {
    var f = w.faceapi;
    var opt = new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
    return f.detectAllFaces(S.video, opt).withFaceLandmarks().withFaceDescriptors();
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
  // ตำแหน่งปลายจมูกเทียบกึ่งกลางกรอบ — ใช้ประมาณการหันซ้าย/ขวา
  function yaw(lm, box) {
    try {
      var n = lm.getNose(), tip = n[n.length - 1];
      return (tip.x - (box.x + box.width / 2)) / (box.width / 2);
    } catch (e) { return 0; }
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
    return new Promise(function (res, rej) {
      var tries = 0;
      (function loop() {
        if (!S.running || !live()) return rej(AbortAttendanceError());
        detect().then(function (res2) {
          if (!live()) return rej(AbortAttendanceError());   // detect ตอบหลังหมดอายุ = หยุดทันที
          tries++;
          if (!res2.length) {
            if (onTick) onTick('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ');
          } else if (res2.length > 1) {
            if (onTick) onTick('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง');
            out.length = 0;
          } else {
            var f0 = res2[0], box = f0.detection.box;
            var q = frameQuality(box);
            if (!q || q.ratio < 0.035) {
              if (onTick) onTick('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น');
            } else {
              out.push({ box: box, desc: Array.from(f0.descriptor), q: q,
                         ear: eyeOpen(f0.landmarks), yaw: yaw(f0.landmarks, box) });
              if (onTick) onTick(null, out.length / count);
            }
          }
          if (!live()) return rej(AbortAttendanceError());
          if (out.length >= count) return res(out);
          if (tries > count * 12) return rej(new Error('ตรวจใบหน้าไม่สำเร็จ กรุณาลองใหม่'));
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) { rej(live() ? e : AbortAttendanceError()); });
      })();
    });
  }

  // ขอให้กระพริบตา — ใช้เมื่อ Passive ก้ำกึ่ง
  function blinkChallenge(onTick) {
    var seenOpen = false, seenClose = false, t0 = Date.now();
    return new Promise(function (res, rej) {
      (function loop() {
        if (!S.running) return rej(new Error('ยกเลิกแล้ว'));
        if (Date.now() - t0 > 9000) return res(false);
        detect().then(function (r) {
          if (r.length === 1) {
            var e = eyeOpen(r[0].landmarks);
            if (e != null) {
              if (e > 0.26) seenOpen = true;
              if (seenOpen && e < 0.17) seenClose = true;
              if (seenOpen && seenClose) return res(true);
            }
            if (onTick) onTick('กรุณากระพริบตา 1 ครั้ง');
          } else if (onTick) onTick('จัดใบหน้าให้อยู่ในกรอบ');
          S.raf = requestAnimationFrame(loop);
        }).catch(rej);
      })();
    });
  }

  /* ---------- Snapshot ---------- */
  function snapshotBlob() {
    return new Promise(function (res) {
      var c = S.canvas, vw = S.video.videoWidth || 640, vh = S.video.videoHeight || 480;
      var scale = Math.min(1, 480 / Math.max(vw, vh));
      c.width = Math.round(vw * scale); c.height = Math.round(vh * scale);
      c.getContext('2d').drawImage(S.video, 0, 0, c.width, c.height);
      c.toBlob(function (b) { res(b); }, 'image/jpeg', 0.82);
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
      return fetchT(r.upload_url,
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ')
        .then(function (up) {
          if (!up.ok) {
            njfReport('EDGE_FAIL', 'njhr-face/signed-put', { message: 'HTTP ' + up.status });
            throw njfMark(new Error('อัปโหลดภาพไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
          }
          return r.path;
        })['catch'](function (e) {
          /* ห้าม log: Signed URL · เนื้อไฟล์ · token · รูปใบหน้า */
          if (!njfDone(e)) njfReport('EDGE_FAIL', 'njhr-face/signed-put', e, 'transport');
          throw e;
        });
    });
  }

  function uploadSnapshot(blob, kind, action, employeeId) {
    if (!blob) return Promise.resolve(null);
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
  var G = { id: 0, err: null, first: null, fixes: [], sid: 0, denied: false };

  /* หน้าต่างความสดของ Fix ณ วินาทีที่ส่ง (มิลลิวินาที)
     ที่มา: watchPosition ยิง Fix ราว 1 ครั้ง/วินาที → 3000ms ครอบคลุม ~3 Fix สุดท้าย
     เพียงพอให้เลือกตัวที่แม่นที่สุด โดยไม่ย้อนไปไกลจนกลายเป็นตำแหน่งเก่า */
  var GPS_FRESH_MS = 3000;
  /* ถ้ายังไม่มี Fix สดตอนจะส่ง ให้รอ Fix ใหม่ได้นานสุดเท่านี้ แล้ว Fail Closed
     ไม่ใช่ค่าสุ่ม: = หน้าต่างความสด + 1 รอบ watch (ราว 1 วินาที) */
  var GPS_WAIT_MS = 4000;

  /* [ข้อ 1] gpsStop ต้องระบุ sid เจ้าของเสมอ — Async ของ Attempt เก่าที่มาช้า
     จะหยุด watch ของ Attempt ใหม่ไม่ได้เด็ดขาด */
  function gpsStop(expectedSid) {
    if (expectedSid !== undefined && expectedSid !== G.sid) return;   // ไม่ใช่เจ้าของ = ไม่แตะ
    if (G.id && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(G.id); } catch (e) {}
    }
    G.id = 0;
  }

  /* ขึ้น Punch Session ใหม่ — คืน sid ให้ผู้เรียกถือไว้เป็นเจ้าของ */
  function gpsStart() {
    gpsStop();                                   // ปิด watch ของ Attempt ก่อนหน้าแบบไม่มีเงื่อนไข
    G.sid++; G.err = null; G.first = null; G.fixes = []; G.denied = false;
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
      G.fixes.push(fx);
      if (G.fixes.length > 20) G.fixes.shift();  // กันหน่วยความจำโตไม่จำกัด
      if (settle) { settle(fx); settle = null; } // Fix แรก = แจ้งสถานะบนจอ
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
      if (settle && !G.fixes.length) { settle({ ok: false, reason: G.err }); settle = null; }
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    return mySid;
  }

  /* คืน Fix ที่ "สดจริง" และแม่นที่สุดของ Punch Session ที่ระบุ — ไม่มีก็คืน null
     [ข้อ 2] ไม่มี fallback ไป Fix ที่พ้นหน้าต่างความสดอีกต่อไป */
  function gpsPickFresh(sid) {
    var now = Date.now();
    var fresh = G.fixes.filter(function (f) {
      return f.sid === sid && (now - f.at) <= GPS_FRESH_MS;
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
      function finish(v) { if (done) return; done = true; if (iv) clearInterval(iv); res(v); }
      iv = setInterval(function () {
        if (sid !== G.sid) {
          return finish({ ok: false, reason: 'การลงเวลารอบนี้ถูกยกเลิกแล้ว' });
        }
        var q = gpsPickFresh(sid);
        if (q) return finish(q);
        /* [ข้อ 5] ไม่ได้รับอนุญาต + ยังไม่มี Fix เลย = รอต่อไม่มีประโยชน์ */
        if (G.denied && !G.fixes.length) return finish({ ok: false, reason: G.err });
        if (Date.now() - t0 >= GPS_WAIT_MS) {
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
    faceStatus()
      .then(function (has) {
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
  function enrollThenPunch(kind, onDone, myOp) {
    /* [ข้อ 1] ลงทะเบียนใบหน้าครั้งแรกที่เกิดจากการลงเวลา = ยังอยู่ใน Attendance Context
       ส่ง { attendance: true } เข้า enroll() เพื่อคง S.mode='ATTENDANCE'
       Route Change / Logout จึงปิดกล้องและยกเลิก Flow นี้ได้
       ส่วน Manual Enrollment จากหน้า Profile/HR ไม่ส่ง flag นี้ = Enrollment ปกติ */
    enroll(null, function () {
      /* มาถึงที่นี่ได้เฉพาะเมื่อ Enrollment สำเร็จและยังเป็น Operation เดิม
         (enroll ใช้ closeSoft() ในโหมด attendance จึงไม่ถูก opInvalidate) */
      if (!opAlive(myOp)) return;             // ถูกยกเลิกจริง (Route/Logout) = ไม่ต่อ
      setTimeout(function () {
        if (!opAlive(myOp)) return;
        doPunch(kind, onDone, myOp);          // ต่อด้วย Face + Liveness + GPS + Geofence ตามเดิม
      }, 60);
    }, { attendance: true, attendanceOp: myOp });
  }

  function doPunch(kind, onDone, myOp) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;
    if (typeof myOp !== 'number') myOp = opStart();   // เผื่อถูกเรียกตรง
    if (!opAlive(myOp)) { S.busy = false; return; }
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
    var aid = gpsStart();
    netOwn('A' + aid);                        // [ข้อ 4] Network ของ Attempt นี้ผูกกับ aid
    /* เจ้าของ = ต้องตรงทั้ง GPS Session และ Attendance Operation */
    var mine = function () { return aid === G.sid && opAlive(myOp); };
    G.first.then(function (g) {
      if (!mine()) return;                    // Attempt เก่ามาช้า = ไม่แตะจอของ Attempt ใหม่
      st.gps = g.ok ? 'run' : 'bad';
      /* GPS ตอบกลับมาเมื่อไรก็ได้ ต้องไม่ลบสถานะ "กำลังเตรียมระบบตรวจสอบใบหน้า" ทิ้ง
         ถ้าโมเดลยังไม่พร้อม ให้คงข้อความเดิมไว้ */
      panel(stepsHtml(st, g.ok ? (S.ready ? '' : 'กำลังเตรียมระบบตรวจสอบใบหน้า…') : g.reason, !g.ok));
      actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
    });

    /* กล้องกับโมเดลทำงานขนานกัน — ไม่บังคับให้กล้องรอโมเดลโหลดเสร็จก่อนอีกต่อไป
       กล้องพร้อมก่อน = เห็นภาพตัวเองทันที ระหว่างนั้นแจ้งสถานะการเตรียมระบบตรวจใบหน้า
       การตรวจใบหน้าเริ่มก็ต่อเมื่อโมเดลพร้อมจริงเท่านั้น (Promise.all ด้านล่าง) */
    var camP = openCam();
    var modelP = loadModels();
    /* [ข้อ 3] จอง Signed Upload URL ขนานไปกับ Camera + Model + GPS
       ตัด 1 Network Round-trip ออกจากช่วงท้ายหลังสแกนใบหน้าผ่าน
       ล้มเหลวเงียบ → ตอน PUT จะขอใหม่พร้อม size จริงตามเส้นทางเดิม */
    var resvP = reserveUpload('PUNCH', kind, null)['catch'](function () { return null; });
    camP.then(function () {
      if (!S.ready) {
        panel(stepsHtml(st, 'กำลังเตรียมระบบตรวจสอบใบหน้า…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
      }
    }, function () {});
    modelP['catch'](function () {});          // กัน unhandled rejection · error จริงจับที่ Promise.all
    Promise.all([camP, modelP])
      .then(function () {
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
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 2] ห้ามเปิด grabFrames(8) ต่อหลัง Cancel
        setMsg('กำลังตรวจสอบบุคคลจริง…', false);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        return grabFrames(8, null, mine).then(function (f2) {
          if (!mine()) throw AbortAttendanceError();  // [ข้อ 2] ยกเลิกระหว่างชุดที่สอง
          var lv2 = passiveLiveness(f2);
          if (lv2.pass) return { frames: f2, live: lv2 };
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
          return resvP.then(function (resv) {
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
      })
      .then(function (ctx) {
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 3] ยกเลิกก่อนยิง Punch RPC
        var best = ctx.frames[ctx.frames.length - 1];
        return rpc('njhr_att_punch_face', {
          p_token: token(), p_action: kind,
          p_descriptor: best.desc, p_faces_found: 1,
          p_liveness: true, p_liveness_method: ctx.live.method,
          p_lat: ctx.gps.ok ? ctx.gps.lat : null,
          p_lng: ctx.gps.ok ? ctx.gps.lng : null,
          p_accuracy: ctx.gps.ok ? ctx.gps.accuracy : null,
          p_snapshot: ctx.snapshot, p_device: deviceInfo()
        }).then(function (r) { return { r: r, ctx: ctx }; });
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
          throw new Error((o.r && o.r.reason) || 'ยืนยันใบหน้าไม่สำเร็จ');
        }
        st.match = 'ok'; st.gps = 'ok';
        S.attempts = 0;
        gpsStop(aid);       // [ข้อ 4] Punch RPC เสร็จ = หยุด watch ของ Attempt นี้ทันที
        showSuccess(kind, o.r, o.ctx, onDone);
      })
      .catch(function (e) {
        /* [ข้อ 3] Flow ที่ถูก Cancel = เงียบสนิท ไม่ขึ้น Error UI ไม่นับ attempts
           ไม่ Upload หลักฐาน ไม่แตะ State ใด ๆ */
        if (isAborted(e) || !mine()) return;
        var msg = (e && e.message) || 'สแกนไม่สำเร็จ';
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
  /* [UI] เพิ่ม title/done/arrow สำหรับหน้าจอแนวใหม่ (Stepper 1-2-3)
     ⚠ test() · เกณฑ์มุม 0.18 / 0.20 · ลำดับ FRONT→LEFT→RIGHT ไม่ถูกแตะแม้แต่จุดเดียว */
  var POSES = [
    { key: 'FRONT', label: 'หน้าตรง', icon: '&#128100;', hint: 'มองกล้องตรง ๆ',   test: function (y) { return Math.abs(y) < 0.18; },
      title: 'มองตรง',              done: 'มองตรง',      arrow: '' },
    { key: 'LEFT',  label: 'หันซ้าย',  icon: '&#11013;',  hint: 'หันหน้าไปทางซ้ายเล็กน้อย',  test: function (y) { return y > 0.20; },
      title: 'ค่อย ๆ หันหน้าไปทางซ้าย', done: 'หันซ้าย ครบแล้ว', arrow: '&#8592;' },
    { key: 'RIGHT', label: 'หันขวา',   icon: '&#10145;',  hint: 'หันหน้าไปทางขวาเล็กน้อย',   test: function (y) { return y < -0.20; },
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
         FRONT ผ่านเมื่อ |y| < 0.18 → ยิ่งเข้าใกล้ 0 ยิ่งใกล้ผ่าน
         LEFT  ผ่านเมื่อ y > 0.20   → 0..0.20 คือช่วงกำลังหมุน
         RIGHT ผ่านเมื่อ y < -0.20
       state: 'far' ยังไม่ถึง · 'near' ใกล้แล้ว (>=70%) · 'hit' ถึงเกณฑ์
       ทั้งหมดเป็นการแสดงผล — เกณฑ์ผ่านจริงยังใช้ pose.test(y) ตัวเดิมเท่านั้น */
    function poseLive(pose, y) {
      try {
        var cam = S.root && S.root.querySelector('.njf-cam');
        if (!cam || !pose) return;
        var prog = 0;
        if (pose.key === 'FRONT') {
          prog = Math.max(0, Math.min(1, 1 - (Math.abs(y) / 0.60)));
        } else if (pose.key === 'LEFT') {
          prog = Math.max(0, Math.min(1, y / 0.20));
        } else {
          prog = Math.max(0, Math.min(1, -y / 0.20));
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

    function capturePose() {
      var pose = POSES[idx];
      hint(pose.hint, 'ระบบจะจับภาพอัตโนมัติเมื่อท่าถูกต้อง');
      drawPoses('กำลังตรวจ: ' + pose.label);
      var t0 = Date.now(), buf = [];
      (function loop() {
        if (!S.running) return;
        if (Date.now() - t0 > 25000) { setMsg('จับภาพ ' + pose.label + ' ไม่สำเร็จ กรุณาลองใหม่', true); return; }
        detect().then(function (r) {
          if (!r.length) setMsg('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ', true);
          else if (r.length > 1) setMsg('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง', true);
          else {
            var f0 = r[0], box = f0.detection.box, q = frameQuality(box);
            var y = yaw(f0.landmarks, box);
            poseLive(pose, y);          // [UI] อัปเดตวงแหวน/สีตามมุมปัจจุบัน
            if (!q || q.ratio < 0.045) setMsg('เข้าใกล้กล้องขึ้นอีกเล็กน้อย', true);
            else if (q.brightness < 45) setMsg('แสงน้อยเกินไป กรุณาหาที่สว่างขึ้น', true);
            else if (q.sharpness < 12) setMsg('ภาพไม่ชัด กรุณาถือนิ่ง', true);
            else if (!pose.test(y)) setMsg(pose.hint, false);
            else {
              buf.push({ desc: Array.from(f0.descriptor), q: q, box: box, ear: eyeOpen(f0.landmarks) });
              setMsg('กำลังจับภาพ ' + pose.label + ' (' + buf.length + '/3)');
              if (buf.length >= 3) {
                var lv = passiveLiveness(buf.concat(buf));
                if (!lv.pass && !lv.challenge) { buf.length = 0; setMsg(lv.reason, true); }
                else {
                  /* [ข้อ 6] ตรวจ Owner ก่อนเขียน State / Upload / ไป Pose ถัดไป */
                  if (!enAlive()) { closeCam(); return; }
                  got.push(buf[buf.length - 1].desc);
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
                  return new Promise(function (res) {
                    setTimeout(function () {
                      if (!enAlive()) { closeCam(); return res(); }
                      res(capturePose());
                    }, 700);
                  });
                }
              }
            }
          }
        if (!enAlive()) return;                                    // [ข้อ 3] ก่อน RAF
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) { setMsg((e && e.message) || 'ตรวจใบหน้าไม่สำเร็จ', true); });
      })();
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

    function finish() {
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
      rpc(fnName, body).then(function (r) {
        if (!enAlive()) { closeCam(); return; }   // [ข้อ 4] ถูกยกเลิกหลังส่ง = ไม่แสดงผล ไม่ Handoff
        faceStatusReset();     // [PERF/ถูกต้อง] Enrollment เปลี่ยน = Cache เดิมใช้ไม่ได้
        saveProgressStop();
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
          if (typeof onDone === 'function') onDone(r);
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

    drawPoses('กำลังเตรียมกล้อง…');
    var camE = openCam();
    var modelE = loadModels();
    camE.then(function () { if (!S.ready) drawPoses('กำลังเตรียมระบบตรวจสอบใบหน้า…'); }, function () {});
    modelE['catch'](function () {});
    Promise.all([camE, modelE]).then(function () {
      if (!enAlive()) { closeCam(); throw AbortAttendanceError(); }   // [ข้อ 5] หลัง Cam+Model
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

    var camL = openCam();
    var modelL = loadModels();
    camL.then(function () {
      if (!S.ready) { panel(stepsHtml(st, 'กำลังเตรียมระบบตรวจสอบใบหน้า…')); }
    }, function () {});
    modelL['catch'](function () {});

    Promise.all([camL, modelL])
      .then(function () {
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
        return w.NJHR_faceLogin(best.desc, ctx.live.method);
      })
      .then(function (row) {
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

  w.NJHRFace = {
    /* อุ่นเครื่องระบบตรวจใบหน้าไว้ล่วงหน้า (ไลบรารี + โมเดล) แบบไม่บล็อกหน้าจอ
       ใช้ S.loading/S.ready ตัวเดิมเป็น State กลาง จึงไม่โหลดซ้ำและกัน Concurrent Load ได้เอง
       ล้มเหลวก็เงียบ — ตอนกดสแกนจริงจะโหลดใหม่ตามเส้นทางเดิม */
    warmup: function () {
      addCss();
      /* [ข้อ 3] warmup() = โมเดลอย่างเดียว — Face Status ถูก Preload แยกต่างหาก
         ผ่าน statusPreload() เพื่อไม่ให้ติด flag "อุ่นแล้ว" ตอนสลับบัญชี */
      return loadModels()['catch'](function () {});
    },
    statusPreload: faceStatusPreload,
    statusReset: faceStatusReset,
    isReady: function () { return !!S.ready; },
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
