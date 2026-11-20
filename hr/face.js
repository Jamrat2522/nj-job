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

  /* [RUN-214] Timeout ครอบ "ตั้งแต่ส่ง Request จนอ่าน Response Body เสร็จ"
     เดิม: ได้ Header แล้ว clearTimeout ทันที -> r.text() ค้างได้ไม่มีกำหนด (เน็ตหลุดกลางทาง)
     ใหม่: นาฬิกาเดินต่อจนอ่าน Body จบ · ครบเวลา = abort จริง + reject ผู้ที่รอ Body อยู่
     noBody = ผู้เรียกไม่อ่าน Body (Signed PUT) -> จบที่ Header เหมือนเดิม
     ข้อความ Error เดิมทุกตัวอักษร */
  function fetchT(url, opt, label, noBody) {
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timedOut = false, finished = false, bodyRej = null;
    var untrack = netTrack(ctl);
    var ms = netTimeout();
    function fin() { if (finished) return; finished = true; clearTimeout(timer); untrack(); }
    function mapErr(e) {
      if (timedOut) return new Error((label || 'การเชื่อมต่อ') + 'ใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      /* ถูก abort จาก attAbortAll() = Attempt ถูกยกเลิก → เงียบ ไม่ขึ้น Error UI */
      if (e && (e.name === 'AbortError')) return AbortAttendanceError();
      return new Error((label || 'การเชื่อมต่อ') + 'ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    }
    var timer = setTimeout(function () {
      timedOut = true;
      if (ctl) { try { ctl.abort(); } catch (e0) {} }
      if (finished) return;
      finished = true; untrack();
      if (bodyRej) { var rj = bodyRej; bodyRej = null; rj(mapErr(null)); }
    }, ms);
    var o = Object.assign({}, opt || {});
    if (ctl) o.signal = ctl.signal;
    return fetch(url, o).then(function (r) {
      if (noBody || !r) { fin(); return r; }
      var wrapped = false;
      ['text', 'json', 'blob', 'arrayBuffer'].forEach(function (mth) {
        var orig = r[mth];
        if (typeof orig !== 'function') return;
        try {
          r[mth] = function () {
            return new Promise(function (res, rej) {
              if (timedOut) return rej(mapErr(null));
              bodyRej = rej;
              orig.call(r).then(function (v) { bodyRej = null; fin(); res(v); },
                                function (e) { bodyRej = null; fin(); rej(mapErr(e)); });
            });
          };
          wrapped = true;
        } catch (e1) {}
      });
      if (!wrapped) fin();
      return r;
    }, function (e) {
      var er = mapErr(e);
      fin();
      throw er;
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

  function rpc(fn, body, quiet404) {
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
          /* [RUN-216] ติดรหัสจริงไว้กับ Error (ข้อความเดิม) · quiet404 = การถามว่าเซิร์ฟเวอร์มี function ใหม่หรือยัง ไม่ใช่ความผิดพลาด */
          var eR = new Error(msg);
          eR.httpStatus = r.status; eR.pgCode = (j && j.code) ? String(j.code) : '';
          eR.pgMsg = (j && j.message) ? String(j.message) : '';
          /* [RUN-218] "ปฏิเสธแน่นอน" = HTTP 4xx ที่มีรหัสผิดพลาดจากฐานข้อมูล/PostgREST จริง (คำสั่งจบด้วย Error = Transaction ถูกยกเลิกทั้งก้อน)
             5xx / ไม่มีรหัส / ตอบผิดรูปแบบ = ไม่ทราบผล (เช่น 504 จาก Gateway ขณะฐานข้อมูลยังทำงานอยู่) */
          eR.definite = r.status >= 400 && r.status < 500 &&
                        /^([0-9A-Z]{5}|PGRST\d+)$/.test(eR.pgCode);
          sessNote(eR);                           // [RUN-222] จำว่าเซิร์ฟเวอร์ตอบ "Session หมดอายุ" (ใช้แสดงผลให้ตรงต้นเหตุเท่านั้น)
          if (!(quiet404 && r.status === 404)) {
            njfReport('RPC_FAIL', fn, { message: msg },
                      'status=' + r.status + ((j && j.code) ? (' code=' + j.code) : ''));
          }
          throw njfMark(eR);                      // ข้อความเดิมทุกประการ
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
          var eRr = new Error(msg);                 // [RUN-221] ข้อความเดิม + รหัสจริง (ใช้แยก Session หมดอายุ)
          eRr.httpStatus = r.status; eRr.pgCode = (j && j.code) ? String(j.code) : '';
          sessNote(eRr);
          throw njfMark(eRr);
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
    S.cssP = w.NJHR_loadStyleOnce('face-css', href);   // [RUN-212] ให้ attCamLock() รอ CSS ได้
    S.cssP['catch'](function (e) {
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
  /* [STEP-0C ข้อ 10] Factory เดียว — Initial State กับ Reset State ต้อง Schema ตรงกัน 100%
     ถ้าเพิ่ม field ใหม่ ให้เพิ่มที่นี่ที่เดียว clear()/resetRun() จะได้ครบเสมอ */
  function newPerfBootState() {
    return { marks: {}, counters: {}, timeline: [], gps: [] };
  }
  var PERF = { on: null, t: null, boot: newPerfBootState(),
               /* [STEP-0] COLD = เปิด Attendance ครั้งแรกของ Session · WARM = เข้าซ้ำ */
               runType: '',
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
  /* ---------- [STEP-0 INSTRUMENTATION] Timeline · GPS Ledger · RPC ----------
     รอบนี้ "วัดอย่างเดียว" ไม่แก้ Timing / Threshold / Liveness / Cache / Strategy ใด ๆ
     ปิดอยู่ (ค่าเริ่มต้น Production) = ทุกฟังก์ชันคืนทันที ไม่สร้าง Object ไม่มี overhead

     ⚠ ความเป็นส่วนตัว: ค่าเริ่มต้น "ไม่เก็บพิกัดดิบ"
        เก็บเป็น d_m = ระยะห่างจาก Fix แรกของ Session (เมตร) + accuracy + อายุ เท่านั้น
        ถ้าต้องการ lat/lng ดิบเพื่อวิเคราะห์ ต้องเปิด Flag ที่ 2 แยกต่างหาก:
          localStorage.setItem('njhr_face_perf_gps','1')
        ยังคงห้ามเก็บ Descriptor · รูปใบหน้า · Token · Signed URL เด็ดขาด */
  var PERF_TL_MAX = 400, PERF_GPS_MAX = 200;
  function perfGpsRaw() {
    try { return localStorage.getItem('njhr_face_perf_gps') === '1'; } catch (e) { return false; }
  }
  /* บันทึกเหตุการณ์ลง Timeline เดียวของ Session — ใช้ประกอบลำดับตามข้อ 2 */
  /* [STEP-0B] atMs = เวลาที่ Event เกิดจริง (monotonic เดียวกับ perfNow)
     ผู้เรียกจาก Early Boot ต้องส่งมาเสมอ — ห้ามประทับเวลาใหม่ตอน Flush
     bseq = ลำดับจาก Buffer ใช้กัน Duplicate ถ้า Flush ซ้ำ */
  function perfEvent(name, extra, atMs, bseq) {
    if (!perfOn()) return;
    var tl = PERF.boot.timeline;
    if (tl.length >= PERF_TL_MAX) return;
    if (bseq != null) {
      if (!PERF.seen) PERF.seen = {};
      if (PERF.seen['b' + bseq]) return;
      PERF.seen['b' + bseq] = 1;
    }
    var o = { t_ms: (typeof atMs === 'number' && isFinite(atMs))
                      ? Math.round(atMs * 10) / 10
                      : Math.round(perfNow() * 10) / 10,
              name: String(name) };
    if (extra) { for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k]; } }
    tl.push(o);
    tl.sort(function (a, b) { return a.t_ms - b.t_ms; });   // [ข้อ 18] เรียงตามเวลาจริงเสมอ
  }
  /* [STEP-0B] รับ Buffer จาก Early Boot ครั้งเดียว — เวลาเดิมทุกรายการ */
  function perfFlushBoot(p) {
    if (!perfOn() || !p || PERF.bootFlushed) return;
    PERF.bootFlushed = true;
    var i;
    /* [STEP-0C] Run นี้ยังไม่ได้เริ่มฝั่ง face.js (Cold path: face.js โหลดหลัง route)
       จึงเริ่มให้ที่นี่ด้วยข้อมูลของ Run เดียวกัน — ห้ามใช้ค่าค้างจาก Run ก่อน */
    if (p.run_id != null && (!PERF.run || PERF.run.run_id !== p.run_id)) {
      var keepEv = PERF.boot.timeline, keepMk = PERF.boot.marks, keepGps = PERF.boot.gps;
      perfRunStart({ run_id: p.run_id, run_type: p.run_type,
                     start_epoch: p.start_epoch, start_ms: p.start_ms });
      PERF.boot.timeline = keepEv; PERF.boot.marks = keepMk; PERF.boot.gps = keepGps;
      PERF.bootFlushed = true;
    }
    if (p.run_type) perfRunType(p.run_type);
    if (p.gps) {
      if (p.gps.boot_epoch) PERF.gpsBootEpoch = p.gps.boot_epoch;
      if (p.gps.first_fix) PERF.gpsBootFix = p.gps.first_fix;
    }
    if (p.marks) for (i = 0; i < p.marks.length; i++) {
      if (p.marks[i] && p.marks[i].key != null) PERF.boot.marks[p.marks[i].key] = p.marks[i].ms;
    }
    if (p.events) for (i = 0; i < p.events.length; i++) {
      var e = p.events[i];
      if (e) perfEvent(e.name, e.extra, e.t, e.seq);
    }
  }
  /* COLD / WARM — ผู้เรียก (หน้าลงเวลา) เป็นคนกำหนดจากสถานะจริง */
  function perfRunType(v) {
    if (typeof v === 'string' && v) PERF.runType = v;
    return PERF.runType;
  }
  /* ระยะห่างโดยประมาณ (เมตร) — ใช้เพื่อวัด Jitter/การเคลื่อนที่เท่านั้น */
  function perfGeoDist(a, b) {
    try {
      var R = 6371000, rad = Math.PI / 180;
      var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
      var la = a.lat * rad, lb = b.lat * rad;
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    } catch (e) { return 0; }
  }
  /* บันทึก Fix 1 รายการ — คืน seq ไว้ผูกกับผล RPC ภายหลัง */
  function perfGpsFix(fx, source) {
    if (!perfOn() || !fx) return null;
    var arr = PERF.boot.gps;
    if (arr.length >= PERF_GPS_MAX) return null;
    var seq = arr.length + 1;
    var base = PERF.gpsBase || null;
    if (!base) { base = PERF.gpsBase = { lat: fx.lat, lng: fx.lng }; }
    var rec = {
      seq: seq,
      t_ms: Math.round(perfNow() * 10) / 10,
      accuracy: Math.round(fx.accuracy),
      age_ms: Math.max(0, Date.now() - (fx.at || Date.now())),
      d_m: Math.round(perfGeoDist(base, fx)),
      source: source || 'watcher',
      original_timestamp: fx.at || null,
      received_by_perf_at: Math.round(perfNow() * 10) / 10,
      selected_as_current: false,
      selected_seq: null,
      sent_to_rpc: false,
      rpc_result: null,
      stale_result: false
    };
    if (perfGpsRaw()) { rec.latitude = fx.lat; rec.longitude = fx.lng; }
    arr.push(rec);
    return seq;
  }
  /* [STEP-0B ข้อ 10-11-14] ปิด timing ของ RPC หนึ่ง Request — ใช้ทั้งเส้นทางสำเร็จและ error
     บันทึก rpc_fix_seq กับ current_fix_seq_at_response เพื่อให้เห็น stale จริง
     ⚠ ไม่ตัดสินใจแทน Flow — Business Logic ว่าจะใช้ผลเก่าหรือไม่ ยังเป็นของเดิมทั้งหมด */
  function perfRpcEnd(rseq, t0, fix, result, err) {
    if (!perfOn()) return;
    var ms = Math.round((perfNow() - t0) * 10) / 10;
    var fseq = (fix && fix.__pseq != null) ? fix.__pseq : null;
    var cur = (PERF.curSeq == null ? null : PERF.curSeq);
    var stale = !!(fseq != null && cur != null && cur !== fseq);
    if (!PERF.rpc) PERF.rpc = [];
    if (PERF.rpc.length < 200) {
      PERF.rpc.push({ rpc_seq: rseq, ms: ms, result: result, error: err || null,
                      rpc_fix_seq: fseq, current_fix_seq_at_response: cur, stale: stale });
    }
    perfBootSet('gf_rpc_ms', ms);
    if (ms > (PERF.boot.marks.gf_rpc_max_ms || 0)) perfBootSet('gf_rpc_max_ms', ms);
    perfEvent('gf_rpc_end', { rpc_seq: rseq, ms: ms, result: result,
                              rpc_fix_seq: fseq, current_fix_seq_at_response: cur, stale: stale });
    if (stale) {
      perfBootCount('gps_stale_result_count');
      perfGpsTag(fseq, { stale_result: true });
    }
    if (result !== 'ERROR') perfGpsTag(fseq, { rpc_result: result });
  }
  function perfGpsTag(seq, patch) {
    if (!perfOn() || seq == null || !patch) return;
    var arr = PERF.boot.gps, i;
    for (i = arr.length - 1; i >= 0; i--) {
      if (arr[i].seq === seq) {
        for (var k in patch) { if (Object.prototype.hasOwnProperty.call(patch, k)) arr[i][k] = patch[k]; }
        return;
      }
    }
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

  /* [STEP-0C] ล้างเฉพาะ State ที่เป็นของ "Run" — ใช้ร่วมกันทั้ง clear() และ resetRun()
     ⚠ ไม่แตะ PERF.on (Flag) และไม่แตะสถานะ COLD/WARM ระดับ Session ซึ่งอยู่ที่หน้าลงเวลา */
  function perfRunScopedReset() {
    PERF.boot = newPerfBootState();
    PERF.modelPending = false;
    PERF.press = null;
    PERF.pressEpoch = null;
    PERF.pressFirst = false;
    PERF.seen = {};            // กัน Duplicate ของ Early Event — ต่อ Run
    PERF.rpc = [];             // RPC ledger — ต่อ Run
    PERF.rpcN = 0;
    PERF.selN = 0;
    PERF.curSeq = null;
    PERF.gpsBase = null;       // จุดอ้างอิงระยะทางของ Ledger
    PERF.gpsBootEpoch = 0;     // [ROOT CAUSE #2] ห้าม reuse ของ Run ก่อน
    PERF.gpsBootFix = null;
    PERF.bootFlushed = false;  // [ROOT CAUSE #1] Run ใหม่ต้อง Flush ได้อีก
    /* [STEP-0D ROOT CAUSE #3] Measurement State ของ Face Flow ต้องไม่ค้างข้าม Run
       ⚠ Reset เฉพาะตัววัด — ไม่แตะ S.guideReady / S.recogReady / Model Cache
          เพื่อให้ COLD/WARM ยังวัดของจริงตาม Behavior เดิม */
    PERF.t = null;
    /* [STEP-0E] Snapshot ของ Face Flow ที่จบไปแล้วในรอบก่อน ต้องไม่ค้างข้าม Run */
    PERF.completed = null;
    /* [STEP-0D ROOT CAUSE #2] Long Task ต้อง Reset ทั้งถัง Run และถัง Boot
       Observer เป็น Global singleton — ไม่สร้างใหม่ ไม่ทำลาย */
    try { perfLongTaskReset(); } catch (e) {}
    try { perfLongTaskBootReset(); } catch (e) {}
  }
  /* clear() เดิม = ล้างประวัติ Debug (คง run_id/run_type ปัจจุบันไว้) */
  function perfBootReset() {
    perfRunScopedReset();
  }
  /* [STEP-0C ข้อ 2-3] เริ่ม Measurement Run ใหม่ — เรียกจากจุดเริ่ม Attendance Run จริง
     ห้ามเรียกตอน face.js โหลด / gpsSeedFix / เปิดกล้อง / กดสแกน */
  function perfRunStart(info) {
    if (!perfOn()) return;
    perfRunScopedReset();
    info = info || {};
    PERF.run = {
      run_id: info.run_id != null ? info.run_id : ((PERF.run && PERF.run.run_id || 0) + 1),
      run_type: info.run_type || '',
      start_epoch: info.start_epoch || null,
      start_ms: info.start_ms != null ? info.start_ms : Math.round(perfNow() * 10) / 10
    };
    if (info.run_type) PERF.runType = info.run_type;
  }
  /* [ข้อ 7-8] ฐานเวลาเดียวของ Run นี้ = GPS Bootstrap Start จริง (epoch)
     ใช้ทั้ง gps_first_fix_ms และ gps_usable_fix_ms · ไม่ Clamp · ไม่ถูกต้อง = INVALID */
  function perfGpsDelta(atEpoch) {
    var b = PERF.gpsBootEpoch || 0;
    if (!b || !atEpoch) return 'INVALID_NO_BASE';
    var dd = atEpoch - b;
    if (dd < 0) return 'INVALID_NEGATIVE';
    return Math.round(dd * 10) / 10;
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
    /* [STEP-0E] Freeze Snapshot ของ Run ปัจจุบัน "ก่อน" ปล่อย PERF.t
       ไม่งั้น Export หลัง perfEnd() จะไม่เหลือ Face Metrics ของรอบนี้เลย
       คัดลอกค่าออกมาใหม่ (perfCloneFlat) จึงไม่เปลี่ยนตามถ้ามีใครแก้ t.marks ทีหลัง
       ⚠ ไม่มีรูปใบหน้า · ไม่มี Descriptor จริง — เก็บเฉพาะชื่อขั้นตอนกับตัวเลข */
    PERF.completed = {
      run_id: (PERF.run && PERF.run.run_id != null) ? PERF.run.run_id : null,
      run_type: (PERF.run && PERF.run.run_type) || PERF.runType || '',
      flow: t.flow,
      platform: t.platform,
      ms: perfCloneFlat(t.marks),
      count: perfCloneFlat(t.counters),
      completed_at: Math.round(perfNow() * 10) / 10
    };
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
  /* [STEP-0D ROOT CAUSE #4] แยกให้ออกว่า metric "ยังไม่เกิด" กับ "ฐานเวลาผิด" ต่างกัน
     VALID · NOT_OBSERVED · INVALID_NO_BASE · INVALID_NEGATIVE
     ⚠ Invalid ต้องเป็น null + status เสมอ ห้ามรายงาน 0ms */
  function perfStatus(v) {
    if (typeof v === 'number' && isFinite(v)) return 'VALID';
    if (typeof v === 'string' && v.indexOf('INVALID') === 0) return v;
    return 'NOT_OBSERVED';
  }
  function perfErr(v) {
    var st = perfStatus(v);
    return st === 'VALID' ? null : st;
  }

  /* [STEP-0E] คัดลอกค่าออกมาเป็น Object ใหม่ — Snapshot ต้องไม่อ้าง reference เดิม
     ไม่งั้นแก้ t.marks ทีหลังแล้ว Export เปลี่ยนตาม (ค่าที่เก็บเป็น number/string/boolean ล้วน) */
  function perfCloneFlat(o) {
    var out = {}, k;
    if (!o) return out;
    for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k]; }
    return out;
  }
  /* [STEP-0E] Face Flow ที่จบแล้วของ "Run ปัจจุบัน" — ใช้ได้เฉพาะเมื่อ run_id ตรง และ Flow ถูกประเภท
     ⚠ ไม่ใช่ Historical Log · ไม่มีการหยิบ Run อื่นหรือ Session อื่นมาใช้เด็ดขาด */
  function perfCompletedForRun() {
    var c = PERF.completed;
    if (!c) return null;
    var cur = (PERF.run && PERF.run.run_id != null) ? PERF.run.run_id : null;
    if (cur == null || c.run_id !== cur) return null;              // คนละ Run = ห้ามใช้
    if (String(c.flow || '').indexOf('ATTENDANCE') !== 0) return null;  // Flow ผิดประเภท = ห้ามใช้
    return c;
  }

  /* [STEP-0D] สถานะของ "Run ปัจจุบัน" เท่านั้น — boot marks + marks ของ Flow ที่กำลังวัดอยู่
     ลำดับความสำคัญ: PERF.t (Flow ปัจจุบัน) > PERF.boot (Run ปัจจุบัน) */
  function perfCurrentRun() {
    var ms = {}, ct = {}, k;
    for (k in PERF.boot.marks) {
      if (Object.prototype.hasOwnProperty.call(PERF.boot.marks, k)) ms[k] = PERF.boot.marks[k];
    }
    for (k in PERF.boot.counters) {
      if (Object.prototype.hasOwnProperty.call(PERF.boot.counters, k)) ct[k] = PERF.boot.counters[k];
    }
    /* [STEP-0E] ลำดับของ Face Data ใน Run ปัจจุบัน
         1) Active Flow (PERF.t) — Face Flow ยังไม่จบ
         2) Completed Snapshot ของ run_id เดียวกัน — จบแล้ว (PERF.t = null)
         3) ไม่มีทั้งคู่ = ไม่เติมอะไร → null / 0 / NOT_OBSERVED
       ห้ามถอยไปใช้ Historical Log เด็ดขาด */
    var face = PERF.t || perfCompletedForRun();
    if (face) {
      var fms = PERF.t ? face.marks : face.ms;
      var fct = PERF.t ? face.counters : face.count;
      for (k in fms) {
        if (Object.prototype.hasOwnProperty.call(fms, k)) ms[k] = fms[k];
      }
      for (k in fct) {
        if (Object.prototype.hasOwnProperty.call(fct, k)) ct[k] = fct[k];
      }
    }
    return { ms: ms, ct: ct };
  }

  /* รวมตัวชี้วัดของ Flow ล่าสุดที่เกี่ยวข้อง + Boot/Warmup metrics
     [STEP-0D ROOT CAUSE #1] currentOnly = true → Baseline ใช้ Current Run เท่านั้น
     ของเดิมเอา ATTENDANCE Log รอบก่อนมา Merge "ทีหลัง" จึงทับค่าของ Run ปัจจุบัน
     (เช่น Current 1300ms ถูก Log เก่า 700ms ทับ) — ห้ามเกิดอีก
     โหมดรวมประวัติยังคงไว้ให้ผู้เรียกเดิม แต่ Historical จะไม่ override Current แล้ว */
  function perfMerged(currentOnly) {
    if (currentOnly === true) {
      var cur = perfCurrentRun();
      return { ms: cur.ms, ct: cur.ct, att: null, enr: null };
    }
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
    /* [STEP-0D] Historical เติมได้เฉพาะ field ที่ Current Run "ไม่มีจริง"
       ห้าม override ค่าที่ Run ปัจจุบันวัดไว้แล้วเด็ดขาด */
    [enr, att].forEach(function (e) {
      if (!e) return;
      for (var a in e.ms) {
        if (Object.prototype.hasOwnProperty.call(e.ms, a) && ms[a] == null) ms[a] = e.ms[a];
      }
      for (var b in e.count) {
        if (Object.prototype.hasOwnProperty.call(e.count, b) && ct[b] == null) ct[b] = e.count[b];
      }
    });
    var curT = perfCurrentRun();
    for (var c1 in curT.ms) {
      if (Object.prototype.hasOwnProperty.call(curT.ms, c1)) ms[c1] = curT.ms[c1];
    }
    for (var c2 in curT.ct) {
      if (Object.prototype.hasOwnProperty.call(curT.ct, c2)) ct[c2] = curT.ct[c2];
    }
    return { ms: ms, ct: ct, att: att, enr: enr };
  }

  /* [STEP-0D] ชุดตัวเลขสำหรับ Baseline — Current Run เท่านั้น
     Long Task อ่านจาก LT สด ซึ่งถูก Reset ทุก Run แล้ว จึงไม่มีทางปนข้าม Run
     Invalid timing → value = null พร้อม *_error บอกสาเหตุ */
  function perfBaselineMetrics() {
    var m = perfMerged(true), ms = m.ms, ct = m.ct;
    var ltOff = (LT.supported === false);
    return {
      policy: 'CURRENT_RUN_ONLY',
      face_source: PERF.t ? 'ACTIVE_FLOW'
                   : (perfCompletedForRun() ? 'COMPLETED_SNAPSHOT' : 'NOT_OBSERVED'),
      face_completed_at: (function () { var c = perfCompletedForRun(); return c ? c.completed_at : null; })(),
      gps_boot_start_ms:        perfNum(ms.gps_boot_start_ms),
      gps_boot_start_error:     perfErr(ms.gps_boot_start_ms),
      gps_first_fix_ms:         perfNum(ms.gps_first_fix_ms),
      gps_first_fix_error:      perfErr(ms.gps_first_fix_ms),
      gps_usable_fix_ms:        perfNum(ms.gps_usable_fix_ms),
      gps_usable_fix_error:     perfErr(ms.gps_usable_fix_ms),
      gps_preflight_start_ms:   perfNum(ms.gps_preflight_start_ms),
      gps_preflight_ms:         perfNum(ms.gps_preflight_ms),
      gps_gate_wait_ms:         perfNum(ms.gps_gate_wait_ms),
      gf_rpc_ms:                perfNum(ms.gf_rpc_ms),
      gf_rpc_max_ms:            perfNum(ms.gf_rpc_max_ms),
      gf_rpc_count:             (ct.gf_rpc_count || 0),
      gps_fix_count:            (ct.gps_fix_count || 0),
      gf_retry_count:           (ct.gf_retry_count || 0),
      gps_stale_result_count:   (ct.gps_stale_result_count || 0),
      gf_cache_hits:            (ct.gf_cache_hits || 0),
      face_warmup_start_ms:     perfNum(ms.face_warmup_start_ms),
      guide_model_load_ms:      perfNum(ms.guide_model_load_ms),
      recognition_bytes_prefetch_ms: perfNum(ms.recognition_bytes_prefetch_ms),
      recognition_model_load_ms: perfNum(ms.recognition_model_load_ms),
      recognition_wait_ms:      perfNum(ms.recognition_wait_ms),
      button_to_camera_ms:      perfNum(ms.button_to_camera_ms),
      camera_ready_ms:          perfNum(ms.video_ready_ms),
      face_detect_first_ms:     perfNum(ms.face_detect_first_ms),
      descriptor_count:         (ct.descriptor_samples != null ? ct.descriptor_samples
                                 : (ct.descriptor_calls || 0)),
      descriptor_p50_ms:        perfNum(ms.descriptor_p50_ms),
      descriptor_max_ms:        perfNum(ms.descriptor_max_ms),
      button_to_result_ms:      perfNum(ms.button_to_result_ms),
      route_start_ms:           perfNum(ms.route_start_ms),
      route_to_attendance_ready_ms: perfNum(ms.route_to_attendance_ready_ms),
      route_to_gate_ready_ms:   perfNum(ms.route_to_gate_ready_ms),
      long_task_total_ms:       ltOff ? null : LT.total,
      long_task_max_ms:         ltOff ? null : LT.max,
      long_task_count:          ltOff ? null : LT.count,
      boot_long_task_total_ms:  ltOff ? null : LT.bootTotal,
      boot_long_task_max_ms:    ltOff ? null : LT.bootMax,
      boot_long_task_count:     ltOff ? null : LT.bootCount
    };
  }

  function perfExportTemplate() {
    var dev = perfDevice();
    var m = perfMerged(true), ms = m.ms, ct = m.ct;
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
      /* [STEP-0] ข้อมูลสำหรับเก็บ Baseline — วัดอย่างเดียว ไม่มีผลต่อ Flow */
      run: {
        run_id: (PERF.run && PERF.run.run_id != null) ? PERF.run.run_id : null,
        start_time: (PERF.run && PERF.run.start_epoch)
                      ? new Date(PERF.run.start_epoch).toISOString() : null,
        run_type: (PERF.run && PERF.run.run_type) || PERF.runType || 'UNKNOWN',
        screen: (function () {
          try { return (w.screen ? (w.screen.width + 'x' + w.screen.height) : '') +
                       ' @' + (w.devicePixelRatio || 1) + 'x'; } catch (e) { return ''; }
        })(),
        viewport: (function () {
          try { return (w.innerWidth || 0) + 'x' + (w.innerHeight || 0); } catch (e) { return ''; }
        })(),
        network_detail: (function () {
          try {
            var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!c) return null;
            return { effective_type: c.effectiveType || null,
                     downlink_mbps: (typeof c.downlink === 'number') ? c.downlink : null,
                     rtt_ms: (typeof c.rtt === 'number') ? c.rtt : null,
                     save_data: !!c.saveData };
          } catch (e) { return null; }
        })(),
        gps_raw_coords_enabled: perfGpsRaw()
      },
      step0_metrics: perfBaselineMetrics(),
      gf_rpc: (function () {
        var a = (PERF.rpc || []).map(function (x) {
          var o = {}; for (var kk in x) { if (Object.prototype.hasOwnProperty.call(x, kk)) o[kk] = x[kk]; }
          return o;
        });
        var v = a.map(function (x) { return x.ms; }).sort(function (p, q) { return p - q; });
        function pick(f) { return v.length ? v[Math.min(v.length - 1, Math.floor(f * (v.length - 1)))] : null; }
        return { count: a.length, p50_ms: pick(0.5), p95_ms: pick(0.95),
                 max_ms: v.length ? v[v.length - 1] : null, requests: a };
      })(),
      timeline: PERF.boot.timeline.slice(),
      gps_fixes: PERF.boot.gps.map(function (r) {
        var o = {}; for (var k in r) { if (k.charAt(0) !== '_') o[k] = r[k]; } return o;
      }),
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
    /* [STEP-0] Timeline / COLD-WARM — วัดอย่างเดียว ไม่มีผลต่อ Flow */
    event: function (name, extra, atMs, bseq) { try { perfEvent(name, extra, atMs, bseq); } catch (e) {} },
    flushBoot: function (p) { try { perfFlushBoot(p); } catch (e) {} },
    /* [STEP-0C] เริ่ม Measurement Run ใหม่ — ล้าง State ของ Run ก่อนทั้งหมด */
    runStart: function (info) { try { perfRunStart(info); } catch (e) {} },
    runInfo: function () { try { return PERF.run ? JSON.parse(JSON.stringify(PERF.run)) : null; }
                           catch (e) { return null; } },
    /* [STEP-0D] ตัวเลข Baseline ของ Run ปัจจุบันล้วน ๆ (ไม่ปนประวัติรอบก่อน) */
    baseline: function () { try { return perfBaselineMetrics(); } catch (e) { return null; } },
    rpcLog: function () { try { return (PERF.rpc || []).slice(); } catch (e) { return []; } },
    runType: function (v) { try { return perfRunType(v); } catch (e) { return ''; } },
    gpsLedger: function () { try { return PERF.boot.gps.slice(); } catch (e) { return []; } },
    timeline: function () { try { return PERF.boot.timeline.slice(); } catch (e) { return []; } },
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
  /* [RUN-184] Single-flight ของ prefetchRecognitionBytes — เรียกซ้ำได้ ไม่ดาวน์โหลดซ้ำ */
  var RECOG_BYTES = { p: null };

  /* โหลด face-api.js ครั้งเดียว ใช้ร่วมกันทั้ง 2 เฟส */
  /* ---------- [TIMEOUT] เพดานเวลาของทุกขั้นที่รอทรัพยากรภายนอก ----------
     เดิม: faceScript รอ onload/onerror เท่านั้น · loadFromUri ไม่มีเพดาน · detect ไม่มีเพดาน
     บนเครือข่ายที่ค้างกลางทาง (ไม่ error ไม่ตอบ) ผู้ใช้จะค้างไม่มีกำหนด
     ⚠ Timeout ห้ามแปลงเป็น PASS — ต้องโยน Error ที่มี .faceCode จริงเสมอ */
  var LIB_TIMEOUT_MS   = 12000;   // โหลด face-api.js ต่อ 1 แหล่ง
  var MODEL_TIMEOUT_MS = 15000;   // loadFromUri ต่อ 1 แหล่ง
  var INFER_TIMEOUT_MS = 8000;    // ใช้งานปกติ: 1 เฟรมของ detect()/detectGuide()
  /* [ANDROID ATTENDANCE] Samsung A55/A56/A32 และ Android บางเครื่องใช้เวลา
     Detector/Descriptor ต่อเฟรมเกิน 8s ได้ แม้กล้องและใบหน้าปกติ
     ขยายเฉพาะ Flow ลงเวลาเป็น 20s ผ่าน parameter ของ grabFrames เท่านั้น
     ⚠ ไม่แก้ค่า Global 8s เพื่อไม่กระทบ Face Login / iOS / Desktop / Flow อื่น
     ⚠ ไม่ลดจำนวนเฟรม · Threshold · Liveness · Quality · Face Match ใด ๆ */
  var ANDROID_ATT_INFER_TIMEOUT_MS = 20000;
  var ANDROID_ATT_LITE_INPUT_SIZE = 160;
  var ANDROID_ATT_LITE_KEY = 'njhr_android_att_face_lite_v1';
  /* [RUN-215] เพดานต่อ inference ของ Android มาจาก "ผลวัดจริงของเครื่องนี้" (ไม่ดูชื่อรุ่น)
     ยังไม่มีผลวัด = 20s เดิม · มีแล้ว = 10 เท่าของค่ากลางที่ช้าที่สุด (ไม่ต่ำกว่า 8s เท่า iOS/Desktop · ไม่เกิน 20s)
     -> เครื่องที่ปกติเร็ว ไม่ต้องยืนรอ 20s เมื่อ Backend ค้าง · ไม่เปลี่ยน Model / Input Size / เกณฑ์เลือก Flow */
  var AI_STAT_KEY = 'njhr_att_ai_stats_v1';
  function aiMedian(a) {
    if (!a || !a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; });
    return b[Math.floor(b.length / 2)];
  }
  function aiStatLoad() {
    try { var j = JSON.parse(localStorage.getItem(AI_STAT_KEY) || 'null'); return (j && typeof j === 'object') ? j : null; }
    catch (e) { return null; }
  }
  function aiStatSave() {
    try {
      var g = INF.sg || [], dd = INF.sd || [];
      if (!g.length || g.length + dd.length < 5) return;
      var m = tfMem();
      localStorage.setItem(AI_STAT_KEY, JSON.stringify({
        b: m ? m.backend : '', g: aiMedian(g), d: aiMedian(dd), ng: g.length, nd: dd.length, t: Date.now() }));
    } catch (e) {}
  }
  function attendanceInferTimeoutMs() {
    try {
      if (deviceInfo().os !== 'Android') return INFER_TIMEOUT_MS;
      var st = aiStatLoad(), m = tfMem();
      if (st && (Number(st.ng) || 0) + (Number(st.nd) || 0) >= 5 && (!m || !m.backend || st.b === m.backend)) {
        var slow = Math.max(Number(st.g) || 0, Number(st.d) || 0);
        if (slow > 0) return Math.max(INFER_TIMEOUT_MS, Math.min(ANDROID_ATT_INFER_TIMEOUT_MS, slow * 10));
      }
      return ANDROID_ATT_INFER_TIMEOUT_MS;
    } catch (e) { return INFER_TIMEOUT_MS; }
  }
  /* [ANDROID SLOW-PATH] ไม่จับชื่อรุ่นจาก UA เพราะ Chrome รุ่นใหม่ซ่อนรุ่นเครื่องเป็น Android ... K
     เปิดโหมดเบาเฉพาะเครื่อง Android ที่เคยเกิด FACE_INFER_TIMEOUT จริงเท่านั้น
     จึงไม่เปลี่ยน Flow ของ Android เครื่องปกติ / iOS / Desktop
     localStorage เก็บเพียง flag ประสิทธิภาพของอุปกรณ์ ไม่มีใบหน้า/Descriptor/Token */
  function androidAttLiteEnabled() {
    try { return deviceInfo().os === 'Android' && localStorage.getItem(ANDROID_ATT_LITE_KEY) === '1'; }
    catch (e) { return false; }
  }
  function androidAttLiteEnable() {
    try { if (deviceInfo().os === 'Android') localStorage.setItem(ANDROID_ATT_LITE_KEY, '1'); } catch (e) {}
  }
  /* [ANDROID COMPAT BACKEND]
     เมื่อเครื่องเคย FACE_INFER_TIMEOUT แล้ว Slow-path จะย้าย TensorFlow จาก WebGL -> CPU
     ก่อนรัน Detector ใหม่ เพื่อหลีกเลี่ยง GPU/WebGL driver stall ที่การลดเฟรม/เพิ่มเวลาแก้ไม่ได้
     ทำเฉพาะ Android ที่มี slow-path flag เท่านั้น; เครื่องปกติ/iOS/Desktop ไม่แตะ backend
     หลังสลับ backend ต้อง dispose + reload nets เพื่อไม่ใช้ weight tensor ที่สร้างบน backend เดิม */
  function androidAttCpuPrepare(onTick) {
    if (!androidAttLiteEnabled()) return Promise.resolve(false);
    return libLoad().then(function () {
      var f = w.faceapi, tf = f && f.tf;
      if (!tf || typeof tf.setBackend !== 'function') return false;
      var cur = '';
      try { cur = typeof tf.getBackend === 'function' ? String(tf.getBackend() || '') : ''; } catch (e) {}
      if (cur === 'cpu') return true;
      if (onTick) onTick('กำลังเปิดโหมดเข้ากันได้สำหรับเครื่องนี้…');

      /* [RUN-214] ห้าม dispose โมเดล/สลับ Backend ขณะ inference เดิมยังวิ่งอยู่ (งานที่ Timeout ยังไม่จบจริง)
         รอให้จบก่อนไม่เกิน INF_WAIT_MS · ไม่จบ = แจ้งสาเหตุ ไม่ฝืนสลับ · setBackend()/ready() มีเพดานเวลา
         สลับทางเดียว WebGL -> CPU ครั้งเดียว (cur === 'cpu' คืนทันทีด้านบน) ไม่สลับกลับไปมา */
      return inferWaitIdle(INF_WAIT_MS).then(function (idle) {
      if (!idle) { INF.stuck++; throw faceErr('FACE_BACKEND_STUCK', MSG_AI_STUCK); }
      /* โมเดลอาจถูกโหลดบน WebGL จาก Attempt แรกแล้ว — dispose ก่อนเปลี่ยน backend */
      try { if (f.nets.tinyFaceDetector && typeof f.nets.tinyFaceDetector.dispose === 'function') f.nets.tinyFaceDetector.dispose(); } catch (e1) {}
      try { if (f.nets.faceLandmark68Net && typeof f.nets.faceLandmark68Net.dispose === 'function') f.nets.faceLandmark68Net.dispose(); } catch (e2) {}
      try { if (f.nets.faceRecognitionNet && typeof f.nets.faceRecognitionNet.dispose === 'function') f.nets.faceRecognitionNet.dispose(); } catch (e3) {}
      S.guideReady = false; S.recogReady = false; S.ready = false;
      S.guideLoading = null; S.recogLoading = null;

      return withTimeout(Promise.resolve(tf.setBackend('cpu')), BACKEND_SWITCH_MS, 'FACE_CPU_BACKEND_FAILED',
        'เปิดโหมดเข้ากันได้ของระบบตรวจใบหน้าไม่สำเร็จ (หมดเวลารอ) กรุณาลองใหม่').then(function (ok) {
        if (ok === false) throw faceErr('FACE_CPU_BACKEND_FAILED', 'เปิดโหมดเข้ากันได้ของระบบตรวจใบหน้าไม่สำเร็จ');
        return (typeof tf.ready === 'function')
          ? withTimeout(Promise.resolve(tf.ready()), BACKEND_SWITCH_MS, 'FACE_CPU_BACKEND_FAILED',
              'เปิดโหมดเข้ากันได้ของระบบตรวจใบหน้าไม่สำเร็จ (หมดเวลารอ) กรุณาลองใหม่')
          : null;
      }).then(function () {
        perfSet('android_att_cpu_backend', 1);
        return true;
      });
      });
    });
  }
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
  /* [RUN-221] ผล passiveLiveness ที่ไม่ผ่าน: ติดรหัสแยก "คุณภาพภาพ" (แสง/ความคม/เก็บภาพไม่พอ) ออกจาก "ตรวจคนจริงไม่ผ่าน"
     ข้อความเดิมทุกตัวอักษร · เกณฑ์ Liveness ไม่เปลี่ยน — ใช้เพื่อแสดงขั้นที่ล้มให้ตรงจริงและบันทึก Log เท่านั้น */
  function lvErr(reason) {
    return faceErr(/บุคคลจริง/.test(String(reason || '')) ? 'FACE_LIVENESS_FAIL' : 'FACE_QUALITY_LOW', reason);
  }
  /* [RUN-221] ประเภทความล้มเหลวตาม "ขั้นที่ล้มจริง" (ใช้กับจอสแกนลงเวลา)
     SESSION · MATCH · LIVE · QUALITY · POS · AI · CAM · TIME · GPS · SAVE · OTHER (OTHER = แสดงผลแบบเดิมของ local378) */
  function failKind(e) {
    try {
      if (!e) return 'OTHER';
      if (e.faceCode === 'SESSION_EXPIRED' || sessGone(e)) return 'SESSION';
      if (e.punchCode === 'PUNCH_REJECTED') return 'MATCH';
      var c = String(e.camCode || e.faceCode || e.punchCode || e.faceStage || '');
      var m = String(e.message || '');
      if (c === 'FACE_LIVENESS_FAIL') return 'LIVE';
      if (c === 'FACE_QUALITY_LOW') return 'QUALITY';
      if (c === 'FACE_POSITION_TIMEOUT' || e.faceStage === 'NO_FACE' || e.faceStage === 'FRAME_TIMEOUT') return 'POS';
      if (/DEADLINE/.test(c)) return 'TIME';
      if (/^FACE_(INFER|BACKEND|MODEL|CPU)/.test(c) || /^DETECT_/.test(String(e.faceStage || ''))) return 'AI';
      if (e.camCode || /^CAM_|^VIDEO_/.test(c) || /^VIDEO_/.test(String(e.faceStage || ''))) return 'CAM';
      if (/SNAPSHOT|^ATT_|PUNCH_NO_RESPONSE/.test(c)) return 'SAVE';
      if (/GPS|นอกพื้นที่|พื้นที่ลงเวลา|พื้นที่ที่ได้รับ|ตำแหน่ง/.test(m) && !/ใบหน้า/.test(m)) return 'GPS';
      return 'OTHER';
    } catch (x) { return 'OTHER'; }
  }

  /* ---------- [RUN-221 · P1] Session หมดอายุ: แยกออกจาก "GPS ไม่ผ่าน" ----------
     ยืนยันจากเซิร์ฟเวอร์เท่านั้น: HTTP 401/403 หรือรหัส 28000 และข้อความ "เซสชันหมดอายุ" ของ njhr_*_guard
     เดิม: njhr_gf_check ตอบ 403 -> หน้าลงเวลาแสดง "ยังลงเวลาจากตำแหน่งนี้ไม่ได้" + ปุ่มตรวจตำแหน่งอีกครั้ง (ไม่มีทางไปเข้าระบบใหม่)
     ใหม่: พาไปหน้าเข้าสู่ระบบด้วยตัวออกจากระบบกลางของแอป (NJHR.auth.logout) พร้อมข้อความ — ครั้งเดียวต่อ Token (ไม่วน)
       ไม่แตะอายุ Session · ไม่แตะรายการลงเวลาที่รอตรวจสอบ (เก็บตามรหัสพนักงาน ตรวจต่อได้หลังเข้าระบบใหม่) */
  var MSG_SESSION = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  var SESS = { tok: '', seen: '' };
  /* [RUN-222] เซิร์ฟเวอร์ตอบว่า Session หมดอายุให้ Token ปัจจุบัน (จาก RPC ใดก็ตามของโมดูลนี้) */
  function sessNote(e) { try { if (sessGone(e)) SESS.seen = token(); } catch (x) {} }
  function sessSeen() { try { var t = token(); return !!t && SESS.seen === t; } catch (x) { return false; } }
  function sessGone(e) {
    try {
      return !!(e && /เซสชันหมดอายุ/.test(String(e.message || '')) &&
                (e.httpStatus === 401 || e.httpStatus === 403 || e.pgCode === '28000'));
    } catch (x) { return false; }
  }
  function sessLogout(fromUser) {
    try {
      var tk = token();
      if (!tk) return;
      if (!fromUser && S.root) return;         // มีหน้าจอสแกนเปิดอยู่ = หน้าจอนั้นแจ้งเองพร้อมปุ่ม (ไม่ดึงผู้ใช้ออกกลางหน้าจอ)
      if (SESS.tok === tk) return;             // Token นี้จัดการไปแล้ว = ไม่ทำซ้ำ (กันวน)
      SESS.tok = tk;
      if (!fromUser) faceTel({ mode: 'ATTENDANCE', outcome: 'SESSION_EXPIRED', stage: 'PREFLIGHT', code: 'SESSION_EXPIRED', sess: 'EXPIRED' });   // ครั้งเดียวต่อ Token
      setTimeout(function () {
        try {
          if (token() !== tk) return;          // เข้าระบบใหม่ไปแล้ว
          if (w.NJHR && w.NJHR.auth && typeof w.NJHR.auth.logout === 'function') {
            w.NJHR.auth.logout(true);
            if (w.NJHR.ui && typeof w.NJHR.ui.toast === 'function') w.NJHR.ui.toast(MSG_SESSION, 'error');
          }
        } catch (e2) {}
      }, 0);
    } catch (e) {}
  }

  /* ---------- [RUN-222] Telemetry ผลการสแกน (njhr_face_telemetry_write) ----------
     local380 ส่ง 26 พารามิเตอร์ไปที่ njhr_error_log_write ซึ่งบน Production มีอยู่แล้วแบบ 10 พารามิเตอร์ -> 404 -> หยุดส่ง
     ของใหม่: RPC ชื่อใหม่ (ไม่ชน Signature เดิม) รับ 1 เหตุการณ์เป็น JSON · RPC เดิมและ Client รุ่นเก่าไม่ถูกแตะ
       · 1 เหตุการณ์ = 1 รหัสอ้างอิง (id) -> เซิร์ฟเวอร์ไม่นับซ้ำ · ส่งซ้ำได้อย่างปลอดภัยเมื่อเครือข่ายล้ม (จำกัด 1 ครั้ง)
         เหตุการณ์ที่ส่งคำสั่งลงเวลาแล้ว: id แปลงทางเดียวจากรหัสคำขอ (ไม่ส่งรหัสคำขอจริง) -> UNKNOWN/PENDING ถูกปิดเป็นผลจริงภายหลังในแถวเดิม
       · ผลลัพธ์: OK (เซิร์ฟเวอร์ยืนยันแล้วเท่านั้น) · FAIL · UNKNOWN (ส่งแล้วไม่ทราบผล) · CANCELLED · SESSION_EXPIRED · PENDING
       · ตรวจคำตอบ: SUCCESS / REJECTED / NOT_AVAILABLE / NETWORK_ERROR (ดู telResult)
       · RPC ใหม่ยังไม่ติดตั้ง (404) = ใช้ RPC เดิม 10 พารามิเตอร์ เฉพาะเหตุการณ์ FAIL/UNKNOWN ของผู้ที่เข้าระบบแล้ว (1 เหตุการณ์ไปที่เดียว ไม่ส่งสองที่)
     Fire-and-forget หลังหน้าจอแสดงผล (requestIdleCallback) · การสแกน/บันทึกเวลาไม่รอผล Log
     ไม่ส่ง: Token ลงในข้อมูล (ใช้ให้เซิร์ฟเวอร์ระบุตัวเท่านั้น) · รหัสผ่าน · ภาพ · Descriptor · พิกัด · ข้อความดิบจากเซิร์ฟเวอร์
     ค่าสถานะ: PASS/FAIL เฉพาะขั้นที่ตรวจจริงในรอบนี้ · ไม่ได้ตรวจ = NA · ไม่ทราบผล = UNKNOWN
     ปิดได้ด้วย window.NJHR_FACE_TEL = false */
  var TEL = { mode: 'NEW', n: 0, cur: null, pause: 0, bad: 0, legacyBadTok: '',
              stat: { ok: 0, rejected: 0, na: 0, net: 0, legacy: 0, retry: 0 }, last: '' };
  var TEL_MAX = 40;                 // ต่อการเปิดหน้า 1 ครั้ง
  var TEL_NET_MS = 8000;
  function telOn() { return w.NJHR_FACE_TEL !== false; }
  function telBackend() {
    try { var tf = w.faceapi && w.faceapi.tf; return tf && typeof tf.getBackend === 'function' ? String(tf.getBackend() || 'none') : 'none'; }
    catch (e) { return 'err'; }
  }
  function telCam() {
    try {
      if (!S.stream) return 'CLOSED';
      var t = S.stream.getVideoTracks ? S.stream.getVideoTracks()[0] : null;
      if (!t) return 'NO_TRACK';
      return String(t.readyState || '').toUpperCase() + (t.muted ? '_MUTED' : '') + (S.video && S.video.videoWidth ? '' : '_NOFRAME');
    } catch (e) { return 'ERR'; }
  }
  function telRecovery() {
    try {
      if ((INF.recN || 0) >= INF_RECOVER_MAX && INF.lost) return 'FAILED';
      if (INF.recovered) return 'RECOVERED';
      if (INF.recN) return 'ATTEMPTED';
      return 'NONE';
    } catch (e) { return 'NA'; }
  }
  function telSteps(tl, t0) {
    try {
      if (!tl) return '';
      var o = [], k = ['gps', 'cam', 'ai', 'frames', 'scan', 'send', 'end'];
      for (var i = 0; i < k.length; i++) if (tl[k[i]]) o.push(k[i] + '=' + Math.max(0, Math.round(tl[k[i]] - t0)));
      if (tl.lite) o.push('lite=1');
      if (tl.hand) o.push('hand=1');
      return o.join(';');
    } catch (e) { return ''; }
  }
  function telHex(n) { return ('00000000' + (n >>> 0).toString(16)).slice(-8); }
  function telId() {
    try { if (w.crypto && typeof w.crypto.randomUUID === 'function') return w.crypto.randomUUID(); } catch (e) {}
    try {
      var a = new Uint32Array(4); w.crypto.getRandomValues(a);
      return telFmt(telHex(a[0]) + telHex(a[1]) + telHex(a[2]) + telHex(a[3]));
    } catch (e2) {}
    return telFmt(telHex(Math.random() * 4294967296) + telHex(Math.random() * 4294967296) + telHex(Date.now()) + telHex(Math.random() * 4294967296));
  }
  function telFmt(h) { return h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-a' + h.slice(17, 20) + '-' + h.slice(20, 32); }
  /* รหัสอ้างอิงเหตุการณ์จากรหัสคำขอ: แปลงทางเดียว (ย้อนกลับเป็นรหัสคำขอไม่ได้) · ค่าเดิมได้ผลเดิมเสมอ -> ปิด UNKNOWN/PENDING ได้ในแถวเดิม */
  function telIdFrom(s) {
    try {
      s = 'njhr-face-event:' + String(s || '');
      var h = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        h[0] = Math.imul(h[0] ^ c, 16777619);
        h[1] = Math.imul(h[1] + c, 2246822519) ^ (h[1] >>> 13);
        h[2] = Math.imul(h[2] ^ (c + i), 3266489917) ^ (h[2] >>> 15);
        h[3] = Math.imul(h[3] + (c << (i % 8)), 668265263) ^ (h[3] >>> 11);
      }
      for (var k = 0; k < 4; k++) { h[k] ^= h[(k + 1) % 4] >>> 7; h[k] = Math.imul(h[k], 2654435761); }
      return telFmt(telHex(h[0]) + telHex(h[1]) + telHex(h[2]) + telHex(h[3]));
    } catch (e) { return telId(); }
  }
  /* เหตุการณ์ของ 1 รอบสแกน: เริ่ม -> จบได้ครั้งเดียว (ปิดจอก่อนจบ = close() ปิดให้เป็น CANCELLED หรือ UNKNOWN ถ้าส่งคำสั่งบันทึกไปแล้ว) */
  function telBegin(mode) {
    var old = TEL.cur;                        // รอบก่อนที่ไม่ได้จบผ่าน close() (ถูกรอบใหม่แทนที่) = ปิดให้ก่อน ไม่ทิ้งค้าง ไม่นับเป็นสำเร็จ/ล้มเหลว
    if (old && !old.done) telEnd(old, old.sent ? 'UNKNOWN' : 'CANCELLED', telOpen(old, old.sent ? 'REPLACED_AFTER_SEND' : 'REPLACED', 'SUPERSEDED'));
    var ev = { id: telId(), mode: mode, t0: Date.now(), done: false, sent: false, cold: !INF.okN, tl: null };
    TEL.cur = ev;
    return ev;
  }
  /* ช่องสถานะของรอบที่จบก่อนถึงปลายทาง (ปิดจอ / ถูกแทนที่): รายงานเฉพาะขั้นที่ผ่านจริงแล้ว ณ ตอนนั้น · ที่เหลือ = NA */
  function telOpen(ev, stage, code) {
    var tl = ev.tl || null;
    return { stage: stage, code: code, cam: telCam(), steps: telSteps(tl, ev.t0), match: ev.sent ? 'UNKNOWN' : 'NA',
             gps: (tl && tl.gps) ? 'PASS' : 'NA', pos: (tl && tl.gate && tl.frames && !tl.hand) ? 'PASS' : 'NA',
             live: tl ? (tl.hand ? 'HANDOFF' : (tl.scan ? 'PASS' : 'NA')) : 'NA' };
  }
  function telEnd(ev, outcome, f) {
    try {
      if (!ev || ev.done) return;
      ev.done = true;
      if (TEL.cur === ev) TEL.cur = null;
      var o = { id: ev.id, mode: ev.mode, outcome: outcome, ms: Date.now() - ev.t0, start: ev.cold ? 'COLD' : 'WARM' };
      for (var k in (f || {})) if (Object.prototype.hasOwnProperty.call(f, k)) o[k] = f[k];
      faceTel(o);
    } catch (e) {}
  }
  function telClean(v, n) { return String(v == null ? '' : v).replace(/[^A-Za-z0-9_]/g, '_').slice(0, n || 40); }      // รหัสสั้นเท่านั้น (ไม่มีจุดทศนิยม/ช่องว่าง)
  function telVer(v, n) { return String(v == null ? '' : v).replace(/[^A-Za-z0-9_.\-]/g, '_').slice(0, n || 40); }
  function faceTel(o) {
    try {
      if (!telOn() || TEL.mode === 'OFF' || TEL.n >= TEL_MAX || !o) return;
      var c = sb();
      if (!c || !c.url || !c.key || typeof w.fetch !== 'function') return;
      TEL.n++;
      var dv = deviceInfo();
      var ev = {
        id: o.id || telId(), mode: telClean(o.mode, 12).toUpperCase(), outcome: telClean(o.outcome || 'FAIL', 20).toUpperCase(),
        stage: telClean(o.stage, 40), code: telClean(o.code, 60),
        ms: Math.max(0, Math.round(Number(o.ms) || 0)), start: telClean(o.start || 'NA', 8),
        backend: telClean(telBackend(), 12), timeout: Math.max(0, Math.round(Number(o.timeout) || 0)),
        cam: telClean(o.cam || 'NA', 24), pos: telClean(o.pos || 'NA', 12), live: telClean(o.live || 'NA', 12),
        match: telClean(o.match || 'NA', 12), gps: telClean(o.gps || 'NA', 12), sess: telClean(o.sess || 'NA', 12),
        retry: Math.max(0, Math.round(Number(o.retry) || 0)), recovery: telClean(telRecovery(), 12),
        steps: String(o.steps || ''), build: telVer(w.NJHR_BUILD_VERSION, 40), release: telVer(w.NJHR_RELEASE, 20),
        device: telClean(dv.device, 12), browser: telClean(dv.browser, 12), os: telClean(dv.os, 12)
      };
      var tk = token() || null;                // Token ใช้ให้เซิร์ฟเวอร์ระบุผู้ส่งเท่านั้น (ไม่ถูกเก็บ) · Face Login สำเร็จ = ใช้ Token ใหม่ที่ได้ตอนส่ง
      var go = function () { try { if (!tk) tk = token() || null; } catch (e0) {} telSend(c, tk, ev, 0); };
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(go, { timeout: 4000 });
      else setTimeout(go, 0);
    } catch (e) {}
  }
  function telPost(c, path, body) {
    var ctl = null, tm = 0;
    try { if (typeof AbortController === 'function') { ctl = new AbortController(); tm = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, TEL_NET_MS); } } catch (e0) { ctl = null; }
    var init = { method: 'POST', keepalive: true,
                 headers: { 'apikey': c.key, 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                 body: JSON.stringify(body) };
    if (ctl) init.signal = ctl.signal;
    return w.fetch(c.url + '/rest/v1/rpc/' + path, init).then(function (r) {
      return r.text().then(function (t) {
        clearTimeout(tm);
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = undefined; }
        return { status: r.status, json: j, raw: t };
      });
    }, function (e) { clearTimeout(tm); return { status: 0, json: null, raw: '' }; });
  }
  /* จัดประเภทคำตอบของ RPC ใหม่ (คืนชื่อประเภท) */
  function telResult(r) {
    var st = r.status, code = (r.json && typeof r.json === 'object' && r.json.code) ? String(r.json.code) : '';
    if (st === 0) return 'NETWORK_ERROR';
    if (st === 200) {
      var s = typeof r.json === 'string' ? r.json : '';
      if (s === 'OK' || s === 'DUP' || s === 'UPDATED') return 'SUCCESS';
      return 'REJECTED';                                      // LIMIT / INVALID / BUSY / คำตอบผิดรูปแบบ
    }
    if (st === 404 && (code === 'PGRST202' || code === '42883' || !code)) return 'NOT_AVAILABLE';   // ยังไม่ได้ติดตั้ง RPC ใหม่
    if (st === 429 || st >= 500) return 'SERVER_BUSY';
    return 'REJECTED';                                        // 400 Payload ไม่ถูกต้อง · 401/403 ไม่มีสิทธิ์ · 404 อื่น ๆ
  }
  function telSend(c, tk, ev, attempt) {
    try {
      if (TEL.mode === 'OFF') return;
      if (TEL.mode === 'LEGACY') return telLegacy(c, tk, ev);
      if (Date.now() < TEL.pause) { TEL.stat.rejected++; TEL.last = 'PAUSED'; return; }
      telPost(c, 'njhr_face_telemetry_write', { p_token: tk, p_event: ev }).then(function (r) {
        var k = telResult(r);
        TEL.last = k + ':' + r.status + (typeof r.json === 'string' ? ':' + r.json : '');
        if (k === 'SUCCESS') { TEL.stat.ok++; TEL.bad = 0; return; }
        if (k === 'NOT_AVAILABLE') {                           // ไม่มี RPC ใหม่ = เหตุการณ์นี้ยังไม่ถูกเก็บที่ใด -> ใช้ RPC เดิม (ไม่ซ้ำ)
          TEL.stat.na++; TEL.mode = 'LEGACY';
          return telLegacy(c, tk, ev);
        }
        if (k === 'NETWORK_ERROR' || k === 'SERVER_BUSY') {
          if (k === 'NETWORK_ERROR') TEL.stat.net++; else TEL.stat.rejected++;
          if (r.status === 429) { TEL.pause = Date.now() + 300000; return; }     // ถูกจำกัดอัตรา = พัก 5 นาที ไม่ส่งซ้ำ
          if (attempt < 1) {                                   // ส่งซ้ำได้ 1 ครั้ง — รหัสอ้างอิงเดิม เซิร์ฟเวอร์ไม่นับซ้ำ
            TEL.stat.retry++;
            setTimeout(function () { telSend(c, tk, ev, attempt + 1); }, 3000);
          } else { TEL.pause = Date.now() + 60000; }
          return;
        }
        TEL.stat.rejected++;                                   // REJECTED: ไม่ส่งซ้ำ ไม่สลับไป RPC เดิม (กันข้อมูลซ้ำ/ข้อมูลผิดรูปแบบ)
        if (r.status === 200 && r.json === 'LIMIT') TEL.pause = Date.now() + 600000;     // เซิร์ฟเวอร์จำกัดจำนวน = พัก 10 นาที
        else if (++TEL.bad >= 3) TEL.mode = 'OFF';             // Payload ไม่ถูกต้อง (400/INVALID) หรือไม่มีสิทธิ์ (401/403) ซ้ำ 3 ครั้ง = หยุดทั้งหน้านี้
      });
    } catch (e) {}
  }
  /* RPC เดิมของ Production: njhr_error_log_write 10 พารามิเตอร์ (ต้องมี Session ที่ใช้ได้ · เซิร์ฟเวอร์จำกัด 30 แถว/ชั่วโมง/คน)
     ใช้เฉพาะเมื่อ RPC ใหม่ยังไม่ติดตั้ง และเฉพาะ FAIL / UNKNOWN — เป็น "บันทึกข้อผิดพลาด" ไม่ใส่เหตุการณ์สำเร็จ/ยกเลิก */
  function telLegacy(c, tk, ev) {
    try {
      if (!tk || TEL.legacyBadTok === tk) return;
      if (ev.outcome !== 'FAIL' && ev.outcome !== 'UNKNOWN') return;
      var msg = 'FACE_EVENT outcome=' + ev.outcome + ' mode=' + ev.mode + ' stage=' + ev.stage + ' code=' + ev.code +
                ' ms=' + ev.ms + ' ai=' + ev.start + '/' + ev.backend + ' cam=' + ev.cam + ' pos=' + ev.pos + ' live=' + ev.live +
                ' match=' + ev.match + ' gps=' + ev.gps + ' sess=' + ev.sess + ' retry=' + ev.retry + ' rec=' + ev.recovery +
                ' steps=' + ev.steps + ' ev=' + ev.id.slice(0, 8);
      telPost(c, 'njhr_error_log_write', { p_token: tk, p_kind: 'JS_ERROR', p_source: 'face-telemetry/' + ev.mode.toLowerCase(),
        p_message: msg.slice(0, 900), p_stack: '', p_route: '', p_build: ev.build, p_device: ev.device, p_browser: ev.browser, p_os: ev.os
      }).then(function (r) {
        TEL.last = 'LEGACY:' + r.status;
        if (r.status >= 200 && r.status < 300) { TEL.stat.legacy++; return; }
        if (r.status === 404) { TEL.stat.na++; TEL.mode = 'OFF'; return; }           // ไม่มีทั้งสอง RPC = หยุด
        if (r.status === 401 || r.status === 403) { TEL.stat.rejected++; TEL.legacyBadTok = tk; return; }
        if (r.status === 0) { TEL.stat.net++; return; }                             // RPC เดิมไม่มีรหัสกันซ้ำ = ไม่ส่งซ้ำ
        TEL.stat.rejected++;
      });
    } catch (e) {}
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

  /* ---------- [RUN-214] AI Inference Controller (ตัวกลางตัวเดียวของ detect()/detectGuide()) ----------
     ปัญหาเดิม: withTimeout() แค่ "เลิกรอ" — งาน inference เดิมยังวิ่งอยู่ใน Backend (WebGL/CPU)
       รอบถัดไป/กด Retry เริ่ม inference ใหม่ซ้อนทันที = เครื่องค้าง · และ Slow-path dispose โมเดลขณะงานเดิมยังใช้อยู่
     ของใหม่:
       · INF.cur = งานที่ยัง "วิ่งจริง" ใน Backend (ไม่ใช่งานที่ยังรออยู่) — เคลียร์เมื่องานจบจริงเท่านั้น
       · จอสแกนลงเวลา (gated): ห้ามเริ่มงานใหม่ถ้างานเดิมยังไม่จบ — รอได้ไม่เกิน INF_WAIT_MS
         ไม่จบ = FACE_BACKEND_STUCK (แจ้งสาเหตุ ไม่ซ้อนงาน) · ไม่ใช่การเพิ่ม Timeout
       · ผลของงานที่หมดเวลาแล้วถูกทิ้ง (withTimeout) + ผู้เรียกตรวจ CAM.gen / mine() ซ้ำ = งานเก่าเปลี่ยนสถานะรอบใหม่ไม่ได้
       · Timeout ที่เกิดเพราะหน้าจอถูกพัก (ล็อกจอ/สลับแอป) = FACE_INFER_INTERRUPTED ไม่นับเป็นเครื่องช้า
       · WebGL Context Lost = FACE_BACKEND_LOST (แจ้งสาเหตุ + ให้โหลดหน้าใหม่)
     Face Login / ลงทะเบียนใบหน้า (ไม่ gated): เดินเส้นทางเดิมทุกประการ — นับสถิติอย่างเดียว */
  var INF_WAIT_MS = 8000;
  /* [RUN-221 · R3] Cold Start แยกจาก Warm Start
     งาน AI "ครั้งแรก" บน Backend (หลังเปิดหน้า / หลังกู้ Backend) ต้องคอมไพล์ Shader + เตรียม Kernel — ช้ากว่างานถัดไปหลายเท่า
     local373–378: ครั้งแรกเกินเพดานปกติ (iPhone/คอม 8 วิ) = FACE_INFER_TIMEOUT ทั้งที่งานยังเดินอยู่ -> กดลองใหม่รอได้อีก 8 วิ
       -> "AI ค้าง" + ปุ่มโหลดหน้าใหม่ -> โหลดหน้า = ต้องคอมไพล์ใหม่ตั้งแต่ต้น วนซ้ำ
     ของใหม่: เฉพาะงานครั้งแรกของ Backend (และการรองานครั้งแรกนั้น) ใช้เพดาน INF_COLD_MS
       งานถัดไปทุกงานใช้เพดานเดิมทุกประการ (ไม่เพิ่มเวลารอของการสแกนปกติ) · ยังห้ามรันซ้อน · Deadline รวมของรอบสแกน (60 วิ) และของการลงเวลา (90 วิ) คุมเหมือนเดิม
     ⚠ ไม่แตะ Model · Threshold · Liveness · Descriptor · จำนวนเฟรม · ไม่ Dispose/สลับ Backend ขณะงานยังเดิน */
  var INF_COLD_MS = 25000;
  var BACKEND_SWITCH_MS = 10000;
  /* [RUN-221 · R3] ไม่บอกให้โหลดหน้าใหม่ตั้งแต่ครั้งแรก: กด "ลองใหม่" = รองานเดิมให้จบก่อน (ไม่ซ้อน)
     "โหลดหน้าใหม่" เสนอเฉพาะเมื่อกู้ในหน้านี้ไม่ได้จริง: Backend หลุดและกู้ไม่สำเร็จ หรือรองานเดิมครบเวลาแล้ว 2 ครั้ง */
  var MSG_AI_STUCK = 'ระบบ AI ของเครื่องยังประมวลผลรอบก่อนหน้าไม่เสร็จ กรุณารอสักครู่แล้วกดลองใหม่';
  var MSG_AI_STUCK_AGAIN = 'ระบบ AI ของเครื่องยังประมวลผลรอบก่อนหน้าไม่เสร็จ (รอครบเวลาแล้ว 2 ครั้ง) กรุณากดโหลดหน้าใหม่เพื่อเริ่มระบบ AI ใหม่';
  var MSG_AI_LOST = 'ระบบประมวลผลภาพของเครื่องหยุดทำงานชั่วคราว กรุณาโหลดหน้าใหม่แล้วสแกนอีกครั้ง';
  var INF = { cur: null, runs: 0, overlap: 0, late: 0, stuck: 0, lost: false, watch: false, hiddenAt: 0, visAt: 0 };
  /* [RUN-222] งานกำพร้า = งาน AI ที่ Video ของมันถูกปิดและถอด Stream ไปแล้ว (อ่านภาพต่อไม่ได้อีก) และเกินเวลาสูงสุดของงานนั้นแล้ว
     งานแบบนี้ไม่มีวันจบเอง (รอ Video ที่ไม่มีวันพร้อม) และไม่ได้ใช้ GPU อยู่ -> ปล่อยคิวให้รอบใหม่ทำงานได้ ไม่ต้องโหลดหน้าใหม่
     ชั้นสำรองของ infDetachLater (เบราว์เซอร์ที่ลด readyState เองเมื่อกล้องหยุด) · Video ยังใช้งานอยู่ = ไม่เข้าเงื่อนไขนี้ (พฤติกรรมเดิมทุกประการ) */
  function infOrphan(cur) {
    try {
      var v = INF.curVid;
      if (!cur || INF.cur !== cur || !v || v === S.video) return false;
      if (v.srcObject || v.readyState >= 3) return false;
      return (Date.now() - (INF.curT0 || 0)) > (INF.curLim || 8000);
    } catch (e) { return false; }
  }
  function inferWaitIdle(ms) {
    var cur = INF.cur;
    if (!cur) return Promise.resolve(true);
    return new Promise(function (res) {
      var done = false, iv = 0;
      var fin = function (v) { if (done) return; done = true; clearTimeout(tm); clearInterval(iv); res(v); };
      var tm = setTimeout(function () { fin(false); }, ms);
      var chk = function () {
        if (!infOrphan(cur)) return;
        INF.cur = null; if (INF.coldCur === cur) INF.coldCur = null;
        INF.curVid = null; INF.orphan = (INF.orphan || 0) + 1;
        fin(true);
      };
      iv = setInterval(chk, 250);
      cur.then(function () { fin(true); });
      chk();
    });
  }
  function infBackendLost() {
    try {
      if (!INF.lost) return false;
      var tf = w.faceapi && w.faceapi.tf;
      return !tf || typeof tf.getBackend !== 'function' || String(tf.getBackend() || '') === 'webgl';
    } catch (e) { return true; }
  }
  function infWatchBackend() {
    try {
      if (INF.watch) return;
      var tf = w.faceapi && w.faceapi.tf;
      if (!tf || typeof tf.backend !== 'function' || String(tf.getBackend() || '') !== 'webgl') return;
      var b = tf.backend();
      var cv = b && (b.canvas || (b.gpgpu && b.gpgpu.canvas));
      if (!cv || typeof cv.addEventListener !== 'function') return;
      INF.watch = true;
      cv.addEventListener('webglcontextlost', function () {
        INF.lost = true;
        try { perfBootCount('webgl_context_lost'); } catch (e2) {}
        try { if (INF.onLost) { var fl = INF.onLost; INF.onLost = null; fl(); } } catch (e3) {}
        try { var hk = (INF.hooks || []).slice(); INF.hooks = []; hk.forEach(function (h) { try { h(); } catch (e4) {} }); } catch (e5) {}
      });
    } catch (e) {}
  }
  /* [RUN-215] กู้คืน Backend อัตโนมัติเมื่อ WebGL Context Lost (iPhone/iPad สลับแอป · หน่วยความจำกราฟิกถูกยึด)
     ทดสอบจริงกับ face-api/tfjs 4.16: หลัง Context Lost งาน inference ค้างตลอดไป (ไม่มีวันจบ)
     -> งานที่ค้างบน Context ที่ถูกทำลายแล้วไม่มีทรัพยากรให้ใช้ร่วม จึงปลดทิ้งได้
     ขั้นตอน: จำ Factory เดิม -> dispose โมเดล -> removeBackend -> registerBackend(เดิม) -> setBackend('webgl') = Context ใหม่
              -> โหลดโมเดลซ้ำจาก Cache (Single-flight เดิม)
     จำกัด INF_RECOVER_MAX ครั้งต่อการเปิดหน้า · ทำไม่ได้ = FACE_BACKEND_LOST (แจ้งสาเหตุ + โหลดหน้าใหม่) */
  var INF_RECOVER_MAX = 2;
  function infRecover() {
    if (INF.recP) return INF.recP;
    if ((INF.recN || 0) >= INF_RECOVER_MAX) return Promise.reject(faceErr('FACE_BACKEND_LOST', MSG_AI_LOST));
    INF.recN = (INF.recN || 0) + 1;
    INF.recP = Promise.resolve().then(function () {
      var f = w.faceapi, tf = f && f.tf;
      if (!tf || typeof tf.findBackendFactory !== 'function' || typeof tf.removeBackend !== 'function' ||
          typeof tf.registerBackend !== 'function') throw new Error('no-api');
      var fac = tf.findBackendFactory('webgl');
      if (typeof fac !== 'function') throw new Error('no-factory');
      INF.cur = null;                          // งานบน Context ที่ตายแล้ว = ไม่มีวันจบ ปลดออกจากคิว
      INF.coldCur = null; INF.okN = 0; INF.bgen = (INF.bgen || 0) + 1;   // [RUN-221 · R3] Backend ใหม่ = งานแรกเป็น Cold อีกครั้ง
      ['tinyFaceDetector', 'faceLandmark68Net', 'faceRecognitionNet'].forEach(function (n) {
        try { if (f.nets[n] && typeof f.nets[n].dispose === 'function') f.nets[n].dispose(); } catch (e0) {}
      });
      MODEL.gen++;                              // โหลดโมเดลรอบเก่าทั้งหมดหมดสิทธิ์เขียนสถานะ
      S.guideReady = false; S.recogReady = false; S.ready = false;
      S.guideLoading = null; S.recogLoading = null;
      tf.removeBackend('webgl');
      tf.registerBackend('webgl', fac, 2);
      return withTimeout(Promise.resolve(tf.setBackend('webgl')), BACKEND_SWITCH_MS, 'FACE_BACKEND_LOST', MSG_AI_LOST)
        .then(function (ok) {
          if (ok === false) throw new Error('set-failed');
          return (typeof tf.ready === 'function')
            ? withTimeout(Promise.resolve(tf.ready()), BACKEND_SWITCH_MS, 'FACE_BACKEND_LOST', MSG_AI_LOST) : null;
        });
    }).then(function () {
      INF.lost = false; INF.watch = false;
      return guideLoad(true);                   // โหลด Guide ใหม่บน Context ใหม่ (ไฟล์มาจาก Cache) — Recognition ตามหลังเมื่อกู้เสร็จ
    }).then(function () {
      INF.recP = null;
      recogPrefetch();
      INF.recovered = (INF.recovered || 0) + 1;
      try { perfBootCount('ai_backend_recovered'); } catch (e1) {}
    }, function () {
      INF.recP = null;
      INF.recN = INF_RECOVER_MAX;              // กู้ไม่สำเร็จ = ไม่วนกู้ซ้ำ
      throw faceErr('FACE_BACKEND_LOST', MSG_AI_LOST);
    });
    return INF.recP;
  }
  /* [RUN-215] ตัวอย่างเวลา inference จริงของเครื่องนี้ (เฉพาะจอสแกนลงเวลา) — ใช้ตั้งเพดานเวลารอบถัดไป */
  function infSample(kind, ms) {
    try {
      var a = kind === 'd' ? (INF.sd || (INF.sd = [])) : (INF.sg || (INF.sg = []));
      a.push(Math.round(ms)); if (a.length > 40) a.shift();
    } catch (e) {}
  }
  function inferRun(make, inferMs, msg, kind) {
    var gated = attScanOn();
    if (gated && infBackendLost()) {
      return infRecover().then(function () { return inferRun(make, inferMs, msg, kind); });
    }
    if (INF.cur) {
      /* [RUN-215] ทุกโหมดใช้ Backend ร่วมกัน: งานเดิมยังไม่จบ = ห้ามเริ่มงานใหม่ (รวมงานค้างข้ามโหมด)
         ปกติ (ไม่มีงานค้าง) ไม่เข้าทางนี้เลย -> Face Login/ลงทะเบียน เดินเส้นทางเดิมทุกประการ
         โหมดอื่นที่รอไม่ไหว = FACE_INFER_TIMEOUT รหัส/ข้อความเดิมของโหมดนั้น */
      /* งานที่ค้างคือ "รอบอุ่น Backend" ของเราเอง = รอได้เท่าเพดาน inference ปกติ (ต้นทุนเดียวกับที่การสแกนต้องจ่ายเองอยู่แล้ว) */
      /* [RUN-221 · R3] งานที่ค้างคือ "งานครั้งแรกของ Backend" (ยังคอมไพล์อยู่) = รอได้ถึงเพดาน Cold · งานปกติรอเท่าเดิม */
      var waitMs = INF.cur === INF.warmCur ? Math.max(inferMs, 20000)
                 : (gated && INF.cur === INF.coldCur ? Math.max(inferMs, INF_COLD_MS) : INF_WAIT_MS);
      return inferWaitIdle(waitMs).then(function (idle) {
        if (!idle) {
          INF.stuck++;
          throw gated ? faceErr('FACE_BACKEND_STUCK', INF.stuck >= 2 ? MSG_AI_STUCK_AGAIN : MSG_AI_STUCK) : faceErr('FACE_INFER_TIMEOUT', msg);
        }
        return inferRun(make, inferMs, msg, kind);
      });
    }
    var t0 = Date.now(), task, expired = false;
    /* [RUN-221 · R3] Cold = ยังไม่เคยมีงาน AI จบสำเร็จบน Backend นี้ · เพดาน Cold ใช้เฉพาะจอสแกนลงเวลา (Face Login/ลงทะเบียน เพดานเดิม) */
    var cold = gated && !INF.okN;
    var limMs = cold ? Math.max(inferMs, INF_COLD_MS) : inferMs;
    var myGen = INF.bgen || 0;
    try { task = Promise.resolve(make()); } catch (e) { return Promise.reject(e); }
    INF.runs++;
    if (INF.cur) INF.overlap++;
    var track = task.then(function () { if ((INF.bgen || 0) === myGen) INF.okN = (INF.okN || 0) + 1; }, function () {}).then(function () {
      if (expired) INF.late++;                 // งานจบหลังหมดเวลา = ผลถูกทิ้ง
      if (INF.cur === track) INF.cur = null;
      if (INF.coldCur === track) INF.coldCur = null;
    });
    INF.cur = track;
    INF.curVid = S.video || null; INF.curT0 = t0; INF.curLim = limMs;   // [RUN-222] ใช้ตรวจ "งานกำพร้า" (ดู infOrphan)
    if (cold) { INF.coldCur = track; INF.coldN = (INF.coldN || 0) + 1; }
    var p = withTimeout(task, limMs, 'FACE_INFER_TIMEOUT', msg, function () { expired = true; });
    if (!gated) return p;
    /* Context Lost ระหว่างงานนี้ = เลิกรอทันที (ไม่ต้องรอจนครบ Timeout) แล้วให้รอบถัดไปกู้ Backend */
    return new Promise(function (res, rej) {
      var done = false;
      var onLost = function () {
        if (done) return; done = true; expired = true;
        rej(faceErr('FACE_INFER_INTERRUPTED', msg));
      };
      INF.onLost = onLost;
      p.then(function (v) {
        if (INF.onLost === onLost) INF.onLost = null;
        if (done) return; done = true;
        infSample(kind, Date.now() - t0);
        res(v);
      }, function (e) {
        if (INF.onLost === onLost) INF.onLost = null;
        if (done) return; done = true;
        /* หน้าจอถูกพักช่วงใดช่วงหนึ่งของงานนี้ (ซ่อนระหว่างงาน · ยังซ่อนอยู่ตอนหมดเวลา · เพิ่งกลับมา) หรือ Context หลุด = ไม่ใช่เครื่องช้า */
        if (e && e.faceCode === 'FACE_INFER_TIMEOUT' && (INF.hiddenAt >= t0 || INF.visAt >= t0 || d.hidden || INF.lost)) {
          e.faceCode = 'FACE_INFER_INTERRUPTED';
        }
        rej(e);
      });
    });
  }
  /* [RUN-216] จอสแกนลงเวลา: รอ Guide Model โดยรองรับ Context Lost "ระหว่างโหลดโมเดล"
     หลุดระหว่างโหลด (โหลดค้าง/ล้ม) -> กู้ Backend แล้วโหลดใหม่ 1 รอบ (นับรวมในเพดาน INF_RECOVER_MAX) */
  function attGuideReady() {
    return new Promise(function (res, rej) {
      var done = false;
      function fin(fn, v) { if (done) return; done = true; var k = (INF.hooks || []).indexOf(hook); if (k >= 0) INF.hooks.splice(k, 1); fn(v); }
      function hook() { if (done) return; infRecover().then(function () { fin(res); }, function (e) { fin(rej, e); }); }
      (INF.hooks || (INF.hooks = [])).push(hook);
      guideLoad().then(function () { if (infBackendLost()) return hook(); fin(res); },
                       function (e) { if (infBackendLost()) return hook(); fin(rej, e); });
    });
  }
  /* [RUN-216] อุ่น Backend ด้วย inference จริง 1 รอบตอนหน้าว่าง (หลังโมเดลพร้อม)
     ผลวัดจริง: inference ครั้งแรกหลังโหลดหน้าใช้เวลา 3–4 วินาที (คอมไพล์ Shader/เตรียม Kernel) ครั้งถัดไป ~0.5 วินาที
     ย้ายต้นทุนครั้งแรกออกจากช่วงที่ผู้ใช้ยืนสแกน — ใช้ภาพว่าง ไม่ใช้กล้อง ไม่มีข้อมูลบุคคล ไม่เปลี่ยน Model/Input Size
     ผ่านตัวคุม inferRun เดียวกัน (ไม่ซ้อนกับการสแกนจริง: ถ้าผู้ใช้กดสแกนระหว่างนี้ การสแกนรอให้รอบอุ่นจบก่อน)
     ปิดได้ด้วย window.NJHR_FACE_NO_WARM_INFER = true */
  function aiWarmInfer() {
    try {
      if (INF.warmed || w.NJHR_FACE_NO_WARM_INFER === true) return;
      /* [RUN-217] มือถือ/แท็บเล็ต (Android · iPhone · iPad) ปิดเป็นค่าเริ่มต้น · เปิดเองได้ด้วย window.NJHR_FACE_WARM_INFER = true
         [RUN-225 · local384] local382/383 เคยเปิดบนมือถือเป็นค่าเริ่มต้น — ถอนกลับเป็นแนวทางเดิม เพราะพิสูจน์ได้ว่าไม่ปลอดภัยกับเครื่องช้า:
           รอบอุ่นทำงานบน Main Thread (คอมไพล์ Shader + อ่านผลจาก GPU แบบ Synchronous) เครื่องช้าใช้ 10–18 วินาที
           ระหว่างนั้นเบราว์เซอร์ส่งตำแหน่ง GPS ใหม่เข้ามาไม่ได้ -> กดสแกนช่วงนั้น ด่าน GPS (ต้องการตำแหน่งสดไม่เกิน 3 วิ · รอได้ 4 วิ)
           ไม่ได้ตำแหน่ง = "ไม่สามารถอ่าน GPS ได้" ทั้งที่ GPS ปกติ (ทำซ้ำได้ในชุดทดสอบเมื่อเครื่องทดสอบโหลดหนัก · ปิดรอบอุ่น = สแกนได้ตามปกติ)
           ด่าน GPS ห้ามแตะ จึงไม่ย้ายต้นทุนครั้งแรกออกจากรอบสแกนบนมือถือ จนกว่าจะมีผลวัดจากเครื่องจริง
         คอมพิวเตอร์: ทำงานตามเดิม (ผลวัดเดิม ครั้งแรก ~3.3s -> ~0.5s) */
      if (w.NJHR_FACE_WARM_INFER !== true && aiWarmIsMobile()) return;
      if (!S.guideReady || !S.recogReady || INF.cur || S.root || d.hidden || infBackendLost()) return;
      var f = w.faceapi;
      if (!f || typeof f.detectAllFaces !== 'function') return;
      INF.warmed = true;
      var cv = d.createElement('canvas'); cv.width = 320; cv.height = 240;
      var cx = cv.getContext('2d'); cx.fillStyle = '#777'; cx.fillRect(0, 0, 320, 240);
      var t0 = perfNow();
      var pW = inferRun(function () {
        return Promise.resolve(f.detectAllFaces(cv, detectOpt(320))).then(function () {
          return (typeof f.detectFaceLandmarks === 'function') ? f.detectFaceLandmarks(cv) : null;
        }).then(function () {
          return (typeof f.computeFaceDescriptor === 'function') ? f.computeFaceDescriptor(cv) : null;
        });
      }, 30000, 'warm');
      INF.warmCur = INF.cur;
      pW.then(function () {
        INF.warmMs = Math.round(perfNow() - t0);
        try { perfBootSet('ai_warm_infer_ms', INF.warmMs); } catch (e1) {}
        try { cv.width = 0; cv.height = 0; } catch (e2) {}
      }, function () { INF.warmMs = -1; });
    } catch (e) {}
  }
  function aiWarmIsMobile() {
    try {
      var o = deviceInfo().os, ua = navigator.userAgent || '';
      if (o === 'Android' || o === 'iOS') return true;
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
      return /Mac/i.test(navigator.platform || '') && (navigator.maxTouchPoints || 0) > 1;      // iPadOS รายงานตัวเป็น Mac
    } catch (e) { return true; }
  }
  function aiWarmSoon() {
    try {
      var go = function () { setTimeout(aiWarmInfer, 0); };
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
    } catch (e) {}
  }
  function tfMem() {
    try {
      var tf = w.faceapi && w.faceapi.tf;
      var m = (tf && typeof tf.memory === 'function') ? tf.memory() : null;
      if (!m) return null;
      return { tensors: m.numTensors, bytes: m.numBytes,
               backend: (typeof tf.getBackend === 'function') ? String(tf.getBackend() || '') : '' };
    } catch (e) { return null; }
  }
  function attTfMark(key) {
    try { var m = tfMem(); if (m) { perfSet('tf_tensors_' + key, m.tensors); perfSet('tf_backend', m.backend); } } catch (e) {}
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
  /* [RUN-216] Model Generation: การกู้คืน Backend (infRecover) เพิ่ม MODEL.gen
       โหลดรอบเก่าที่จบทีหลัง = ห้ามตั้ง ready / ห้ามล้าง Promise ของรอบใหม่ (น้ำหนักโมเดลของมันอยู่บน Backend ที่ถูกทิ้งแล้ว)
       ระหว่างกู้คืน: ผู้เรียกภายนอกรอการกู้คืนก่อน -> Guide และ Recognition ไม่โหลดซ้อนกับขั้นกู้คืน
     ไม่มีการกู้คืน (gen ไม่เปลี่ยน) = เส้นทางเดิมทุกประการ */
  var MODEL = { gen: 0 };
  function guideLoad(fromRecover) {
    if (INF.recP && !fromRecover) return INF.recP.then(function () { return guideLoad(); });
    if (S.guideReady) return Promise.resolve();
    if (S.guideLoading) return S.guideLoading;
    var genG = MODEL.gen;
    swModelBind();              // ต้องผูก listener "ก่อน" ยิงคำขอไฟล์โมเดล
    swModelBeginLoad();
    var tG = perfNow();
    S.guideLoading = libLoad().then(function () {
      /* เฝ้า WebGL Context Lost ตั้งแต่ Backend พร้อม (ครอบช่วงโหลดโมเดลด้วย) */
      try { var tf0 = w.faceapi && w.faceapi.tf; if (tf0 && typeof tf0.ready === 'function') tf0.ready().then(infWatchBackend, function () {}); } catch (e0) {}
      return netsWithFallback(['tinyFaceDetector', 'faceLandmark68Net'], 'guide');
    }).then(function () {
      if (genG !== MODEL.gen) return INF.recP || guideLoad();   // รอบเก่า: ไม่เขียนทับสถานะของรอบใหม่
      perfDur('guide_model_load_ms', tG);
      infWatchBackend();                     // [RUN-214] เฝ้า WebGL Context Lost (ครั้งเดียว)
      S.guideReady = true;
      S.ready = !!(S.guideReady && S.recogReady);
    })['catch'](function (e) {
      if (genG === MODEL.gen) S.guideLoading = null;
      /* [FACE CODE] ต้องไม่กลืน .faceCode — ไม่งั้น Export จะได้ FLOW_ERROR แทน Timeout จริง */
      throw faceErr((e && e.faceCode) || 'FACE_MODEL_LOAD_FAILED',
                    (e && e.message) || 'โหลดโมเดลตรวจใบหน้าไม่สำเร็จ');
    });
    return S.guideLoading;
  }

  /* STAGE B — RECOGNITION (Descriptor) 6.44 MB — โหลด Background ห้าม Block Guide */
  function recogLoad() {
    if (INF.recP) return INF.recP.then(function () { return recogLoad(); });
    if (S.recogReady) return Promise.resolve();
    if (S.recogLoading) return S.recogLoading;
    var genR = MODEL.gen;
    swModelBind();
    swModelBeginLoad();
    var tR = perfNow();
    S.recogLoading = libLoad().then(function () {
      return netsWithFallback(['faceRecognitionNet'], 'recognition');
    }).then(function () {
      if (genR !== MODEL.gen) return recogLoad();              // รอบเก่า: โหลดใหม่บน Backend ปัจจุบัน
      perfDur('recognition_model_load_ms', tR);
      S.recogReady = true;
      S.ready = !!(S.guideReady && S.recogReady);
    })['catch'](function (e) {
      if (genR === MODEL.gen) S.recogLoading = null;
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
  var CAM = { gen: 0, resuming: false };
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

  /* ---------- [RUN-223 · local382] เปิดกล้องไม่สำเร็จแบบ "ชั่วคราว" — ลองใหม่อัตโนมัติ 1 ครั้ง ----------
     ลองใหม่เฉพาะกรณีที่ชี้ได้ว่าไม่ใช่การปฏิเสธถาวร (ไม่มีการวนซ้ำ · สูงสุด 1 ครั้งต่อการเปิดกล้อง 1 รอบ):
       GRANTED  NotAllowedError แต่ Permissions API ของเบราว์เซอร์ตอบ state = 'granted' (สิทธิ์อนุญาตอยู่แล้ว)
       HIDDEN   NotAllowedError ขณะหน้าไม่อยู่หน้าจอ (สลับแอป/ล็อกจอ/แถบแจ้งเตือน) — รอหน้ากลับมาก่อน
       BUSY     NotReadableError / TrackStartError / AbortError (กล้องยังไม่ถูกปล่อยจากรอบก่อนหรือแอปอื่น)
     ไม่ลองใหม่: state = 'denied' / 'prompt' · ไม่มี Permissions API · SecurityError · ไม่พบกล้อง · หมดเวลา (CAM_TIMEOUT)
     -> ข้อความ/Error Code เดิมทุกประการ · ไม่แตะ GPS Gate · ไม่เปิดกล้องก่อนผู้ใช้กด · ไม่เปิด Stream ซ้อน */
  var CAM_RETRY_WAIT_MS = 600;       // เว้นช่วงให้อุปกรณ์ปล่อยกล้อง
  var CAM_RETRY_VISIBLE_MS = 4000;   // รอหน้ากลับมาแสดงไม่เกินเท่านี้
  function camRetryWhy(e) {
    try {
      if (!e || e.camCode || isAborted(e)) return Promise.resolve('');
      var n = e.name || '';
      if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return Promise.resolve('BUSY');
      if (n !== 'NotAllowedError') return Promise.resolve('');
      if (d.hidden) return Promise.resolve('HIDDEN');
      var pm = navigator.permissions;
      if (!pm || typeof pm.query !== 'function') return Promise.resolve('');
      return new Promise(function (res) {
        var done = false;
        var t = setTimeout(function () { if (!done) { done = true; res(''); } }, 800);
        var fin = function (v) { if (done) return; done = true; clearTimeout(t); res(v); };
        try {
          pm.query({ name: 'camera' }).then(function (st) { fin(st && st.state === 'granted' ? 'GRANTED' : ''); },
                                            function () { fin(''); });
        } catch (e1) { fin(''); }
      });
    } catch (e2) { return Promise.resolve(''); }
  }
  function camRetryWait(why) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() {
        if (!d.hidden && Date.now() - t0 >= CAM_RETRY_WAIT_MS) return res();
        if (Date.now() - t0 >= CAM_RETRY_VISIBLE_MS) return res();
        setTimeout(tick, 100);
      })();
    });
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
    /* [ข้อ 6] Single Stream Guard — คงไว้ แต่ต้องพิสูจน์ว่า Stream เดิม "ยังใช้ได้จริง"
       Track live = คืน Stream เดิม ห้ามเรียก getUserMedia() ใหม่
       Track ended = Stream ตายจริง จึงล้าง State เดิมอย่างปลอดภัยก่อนเปิดใหม่ */
    if (S.stream) {
      if (camStreamLive()) return Promise.resolve(S.stream);
      camLifeLog('STREAM_ENDED_REOPEN');
      closeCam('STREAM_ENDED_REOPEN');
    }
    var env = camEnv();
    var pre = camPrecheck(env);
    if (pre) {
      njfReport('JS_ERROR', 'face/camera', pre, camEnvText(env, pre.camCode, 'precheck'));
      return Promise.reject(pre);
    }
    var myGen = CAM.gen;
    return camGetStream(myGen)['catch'](function (e0) {
      /* [RUN-223 · local382] ความล้มเหลว "ชั่วคราว" ของ getUserMedia = ลองใหม่เอง 1 ครั้ง ก่อนแจ้งผู้ใช้
         (เดิม: NotAllowedError ทุกกรณี = แจ้ง "กล้องไม่ได้รับอนุญาต" ทันที แม้เบราว์เซอร์ยืนยันว่าสิทธิ์ = อนุญาตแล้ว) */
      return camRetryWhy(e0).then(function (why) {
        if (!why || myGen !== CAM.gen || !S.video) throw e0;
        perfBootCount('camera_open_retry');
        try { perfSet('camera_open_retry_why', why); } catch (eP) {}
        return camRetryWait(why).then(function () {
          if (myGen !== CAM.gen || !S.video) throw AbortAttendanceError();
          return camGetStream(myGen);
        });
      });
    }).then(function (st) {
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
        camStreamDiag();
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

  /* ---------- [CAMERA STREAM DIAGNOSTIC] ----------
     วัตถุประสงค์: พิสูจน์จาก Log จริงว่ากล้องถูกปิด/เปิดใหม่ "เพราะอะไร"
     แทนการเดาว่าเป็น visibilitychange หรือ resize
     ⚠ ไม่เก็บภาพ · ไม่เก็บ Descriptor · ไม่เก็บค่า deviceId (เก็บแค่ว่าอ่านได้ไหม)
     ⚠ ไม่เปลี่ยนพฤติกรรมใด ๆ — บันทึกอย่างเดียว */
  var CAM_CLOSE_REASONS = ['USER_CANCEL_CLOSE', 'ROUTE_CHANGE_CLOSE', 'PAGEHIDE_REAL_CLOSE',
                           'VISIBILITY_HIDDEN', 'CAMERA_ERROR', 'FLOW_COMPLETE_CLOSE',
                           'CANCEL', 'HANDOFF', 'STREAM_ENDED_REOPEN', 'UNSPECIFIED'];
  function camCloseReason(reason) {
    var r = String(reason || 'UNSPECIFIED');
    return CAM_CLOSE_REASONS.indexOf(r) >= 0 ? r : 'UNSPECIFIED';
  }

  /* ---------- [CAMERA LIFECYCLE LOG] ----------
     บันทึกว่า Lifecycle Event แต่ละครั้ง "ระบบตัดสินใจทำอะไร" เพื่อพิสูจน์จาก Log จริง
     ว่ากล้องถูกเก็บไว้หรือถูกปิด และถูกเปิดใหม่เพราะอะไร
     ⚠ ไม่เก็บภาพ · ไม่เก็บ Descriptor · บันทึกเฉพาะชื่อเหตุการณ์กับจำนวนครั้ง */
  var CAM_LIFE_EVENTS = ['VISIBILITY_HIDDEN_KEEP_STREAM', 'VISIBILITY_VISIBLE_REUSE_STREAM',
                         'VISIBILITY_VISIBLE_PLAY_RESUME', 'STREAM_ENDED_REOPEN',
                         'PAGEHIDE_BFCACHE_KEEP', 'PAGEHIDE_REAL_CLOSE', 'ROUTE_CHANGE_CLOSE',
                         'USER_CANCEL_CLOSE', 'FLOW_COMPLETE_CLOSE'];
  function camLifeLog(evt) {
    var e = String(evt || '');
    if (CAM_LIFE_EVENTS.indexOf(e) < 0) return;
    try {
      perfSet('camera_life_last', e);
      perfBootCount('camera_life_' + e.toLowerCase());
    } catch (err) {}
  }

  /* Stream ปัจจุบันยังใช้ได้จริงไหม — ใช้ Track จริงเป็นหลักฐาน ไม่เดา */
  function camStreamLive() {
    try {
      if (!S.stream) return false;
      var ts = S.stream.getVideoTracks ? S.stream.getVideoTracks() : null;
      if (!ts || !ts.length) return false;
      return ts[0] && ts[0].readyState === 'live';
    } catch (e) { return false; }
  }

  /* Face Flow ยังทำงานอยู่จริงไหม — Overlay ยังอยู่ + มี Stream ที่ Track ยัง live
     ใช้เป็น Gate ว่า visibilitychange/pagehide ครั้งนี้เป็น "ชั่วคราว" หรือ "ออกจริง" */
  function camFlowActive() {
    return !!(S.root && S.video && camStreamLive());
  }

  /* สภาพ Stream/Video/Viewport ณ ขณะที่กล้องพร้อมใช้จริง */
  function camStreamDiag() {
    try {
      var v = S.video;
      var t = null;
      try {
        var ts = S.stream && S.stream.getVideoTracks ? S.stream.getVideoTracks() : null;
        t = ts && ts.length ? ts[0] : null;
      } catch (e) {}
      var st = {};
      try { st = (t && t.getSettings) ? (t.getSettings() || {}) : {}; } catch (e) { st = {}; }
      perfSet('video_width', v ? (v.videoWidth || 0) : 0);
      perfSet('video_height', v ? (v.videoHeight || 0) : 0);
      perfSet('video_ready_state', v ? (v.readyState || 0) : 0);
      perfSet('video_paused', v ? !!v.paused : null);
      perfSet('track_ready_state', camTrackState());
      perfSet('track_label', t ? String(t.label || '') : '');
      perfSet('track_facing_mode', st.facingMode == null ? null : String(st.facingMode));
      perfSet('track_settings_w', st.width == null ? null : st.width);
      perfSet('track_settings_h', st.height == null ? null : st.height);
      /* ค่า deviceId เป็น Fingerprint ของเครื่อง จึงบันทึกเฉพาะว่าอ่านได้หรือไม่ */
      perfSet('track_device_id_readable', !!st.deviceId);
      try { perfSet('visibility_state', String(d.visibilityState || '')); } catch (e) {}
      try {
        perfSet('viewport_w', w.innerWidth || 0);
        perfSet('viewport_h', w.innerHeight || 0);
      } catch (e) {}
      /* ขนาดกล่อง Preview จริง — ใช้พิสูจน์ว่ากรอบภาพนิ่งหรือเปลี่ยนสัดส่วนระหว่างสแกน */
      try {
        var cam = S.root && S.root.querySelector('.njf-cam');
        if (cam) {
          var b = cam.getBoundingClientRect();
          perfSet('preview_box_w', Math.round(b.width));
          perfSet('preview_box_h', Math.round(b.height));
        }
      } catch (e) {}
    } catch (e) {}
  }

  function closeCam(reason) {
    /* บันทึกก่อนปิด ขณะที่ยังอ่านสถานะ Stream ได้ */
    if (S.stream) {
      perfSet('camera_close_reason', camCloseReason(reason));
      perfBootCount('camera_close_count');
    }
    camInvalidate();                            // [ข้อ 2] คำขอกล้องที่ค้างอยู่หมดสิทธิ์ทันที
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    S.running = false;
    if (S.stream) {
      S.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      S.stream = null;
    }
    if (S.video) {
      try { S.video.pause(); } catch (e) {}
      /* [RUN-222] งาน AI ที่เริ่มกับ Video นี้ยังเดินอยู่ = ยังไม่ถอด Stream ออกจาก Element จนกว่างานนั้นจะจบ
         ต้นเหตุ (พิสูจน์ด้วย face-api จริง): face-api อ่านภาพจาก Video ซ้ำทุกขั้น (ตรวจจับ -> Landmark -> Descriptor) และ "รอจน Video พร้อม" ก่อนอ่าน
         ถ้าจอถูกปิดระหว่างขั้น (srcObject = null -> readyState 0) การรอนั้นไม่มีวันจบ -> งานค้างถาวร
         local371 ไม่มีตัวคุมคิว AI งานค้างจึงไม่กระทบรอบถัดไป · ตั้งแต่มีตัวคุมคิว (inferRun) งานค้าง 1 งาน = สแกนไม่ได้อีกเลยจนกว่าจะโหลดหน้าใหม่
         กล้องถูกปิดจริงแล้วที่ t.stop() ด้านบน (ไฟกล้องดับทันที) — ที่เลื่อนคือการถอด Stream ที่หยุดแล้วออกจาก Element เท่านั้น · ผลของงานเก่าถูกทิ้งตามเดิม */
      var vC = S.video;
      if (INF.cur && INF.curVid === vC) infDetachLater(vC, INF.cur);
      else vC.srcObject = null;
    }
  }
  function infDetachLater(v, job) {
    var done = false;
    var go = function () {
      if (done) return; done = true;
      try { if (v.srcObject && v.srcObject !== S.stream) v.srcObject = null; } catch (e) {}   // Element ถูกใช้กับกล้องรอบใหม่แล้ว = ไม่แตะ
    };
    try { job.then(go, go); } catch (e) {}
    setTimeout(go, 30000);                      // เพดาน: ไม่ถือ Stream ที่หยุดแล้วไว้เกิน 30 วิ
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
  function detectOpt(inputSize) {
    var f = w.faceapi;
    var sz = Number(inputSize) > 0 ? Number(inputSize) : 320;
    return new f.TinyFaceDetectorOptions({ inputSize: sz, scoreThreshold: 0.45 });
  }
  /* CAPTURE — Detection + Landmarks + Descriptor (ของเดิม ไม่เปลี่ยนพฤติกรรม)
     ใช้โดย Face Login / Face Attendance / Blink Challenge / ทดสอบใบหน้า ตามเดิมทุกจุด */
  function detect(timeoutMs, inputSize) {
    var f = w.faceapi;
    perfCount('descriptor_calls');
    var myGen = CAM.gen;                        // [TIMEOUT] Generation guard
    var t = perfNow();
    var inferMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : INFER_TIMEOUT_MS;
    return inferRun(function () {
      if (myGen !== CAM.gen) throw AbortAttendanceError();   // รอคิวจนกล้องรอบนี้ถูกปิดไปแล้ว = ไม่เริ่มงาน
      return f.detectAllFaces(S.video, detectOpt(inputSize)).withFaceLandmarks().withFaceDescriptors();
    }, inferMs, 'ประมวลผลใบหน้าไม่ทันเวลา กรุณาลองใหม่', 'd').then(function (r) {
      /* กล้องถูกปิด/เปลี่ยนรอบระหว่างรอ inference = ผลนี้ใช้ไม่ได้ ต้องยกเลิกเงียบ */
      if (myGen !== CAM.gen) throw AbortAttendanceError();
      perfDescSample(perfNow() - t);
      return r;
    });
  }
  /* GUIDANCE — Detection + Landmarks เท่านั้น ห้ามคำนวณ Descriptor
     ใช้เฉพาะลูปนำทางท่าทางของ \"ลงทะเบียนใบหน้า\" (enroll) เท่านั้น
     Descriptor เป็นขั้นที่แพงที่สุดของ face-api การไม่คำนวณทุกเฟรมทำให้ลูปนำทางลื่นขึ้นมาก */
  function detectGuide(timeoutMs, inputSize) {
    var f = w.faceapi;
    perfCount('guide_calls');
    var myGen = CAM.gen;                        // [TIMEOUT] Generation guard
    var tG = perfNow();
    var inferMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : INFER_TIMEOUT_MS;
    return inferRun(function () {
      if (myGen !== CAM.gen) throw AbortAttendanceError();
      return f.detectAllFaces(S.video, detectOpt(inputSize)).withFaceLandmarks();
    }, inferMs, 'ตรวจใบหน้าไม่ทันเวลา กรุณาลองใหม่', 'g').then(function (r) {
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

  /* ---------- [RUN-212/213 · FACE POSITION GATE] ใบหน้าต้องอยู่ใน "กรอบสี่เหลี่ยมคงที่" ----------
     จอสแกนลงเวลาไม่มีวงรี/วงแหวนใน DOM — ด่านนี้เทียบกับ #njf-frame ตัวเดียวกับที่ผู้ใช้เห็น

     Coordinate Mapping (object-fit: cover + object-position: center + mirror)
       · Detector อ่านพิกเซลดิบจาก <video> => box อยู่ในพิกัด "source video" (videoWidth/Height)
       · พื้นที่แสดงผลจริง = getBoundingClientRect() ของ <video> เอง
         scale = max(boxW/vw, boxH/vh) · ส่วนของ source ที่มองเห็น = boxW/scale x boxH/scale (กึ่งกลาง)
       · Mirror อ่านจาก computed transform จริงของ <video> (matrix a < 0) : จุดบนจอ fx -> source 1-fx
       · แปลงขอบทั้ง 4 ด้านของกรอบกลับเป็นพิกัด source แล้วเทียบกับ box ของใบหน้า

     [RUN-213] ตรวจ 3 อย่างให้ตรงกับกรอบที่แสดงจริง (เดิมตรวจเฉพาะจุดกึ่งกลาง)
       1 CENTER จุดกึ่งกลางใบหน้าอยู่ในโซนกลางกรอบ  (FACE_POS_SAFE ของครึ่งกว้าง/ครึ่งสูง)
       2 SIZE   กว้างใบหน้า >= FACE_FRAME_MIN_W ของกรอบ (ไกลไป) และ กว้าง/สูง <= กรอบ (ใกล้ไป)
       3 EDGE   ขอบใบหน้าไม่ล้นกรอบเกินระยะเผื่อ FACE_FRAME_MARGIN ของขนาดกรอบ
     คืน { ready, inside, code }  code = '' | 'CENTER' | 'FAR' | 'NEAR' | 'EDGE'
       ready=false เมื่อกล้อง/กรอบ/พิกัดยังไม่พร้อม หรือกำลังปรับ Layout => "ไม่ผ่าน" เสมอ (Fail Closed)

     ไม่แตะ: Threshold การจำหน้า · Descriptor · Liveness · จำนวนเฟรม · q.ratio 0.035 เดิม (ยังตรวจก่อนด่านนี้) */
  var FACE_POS_SAFE = 0.55;        // จุดกึ่งกลางใบหน้า: ภายใน 55% ของครึ่งกว้าง/ครึ่งสูงของกรอบ (ค่าเดิม)
  var FACE_FRAME_MIN_W = 0.30;     // ใบหน้ากว้างอย่างน้อย 30% ของความกว้างกรอบ
  var FACE_FRAME_MARGIN = 0.15;    // ระยะเผื่อขอบ: ล้นกรอบได้ไม่เกิน 15% ของขนาดกรอบต่อด้าน

  function facePosInFrame(box) {
    var no = { ready: false, inside: false, code: '' };
    try {
      if (!box) return no;
      if (attLayoutBusy()) return no;
      var v = S.video;
      var vw = v && v.videoWidth, vh = v && v.videoHeight;
      if (!vw || !vh) return no;
      var fr = S.root && S.root.querySelector('#njf-frame');
      if (!fr) return no;
      var vb = v.getBoundingClientRect(), fb = fr.getBoundingClientRect();
      if (!(vb.width > 1) || !(vb.height > 1) || !(fb.width > 1) || !(fb.height > 1)) return no;

      var scale = Math.max(vb.width / vw, vb.height / vh);
      var visW = vb.width / scale, visH = vb.height / scale;
      var offX = (vw - visW) / 2, offY = (vh - visH) / 2;

      var mirrored = true;
      try {
        var tf = w.getComputedStyle(v).transform;
        if (tf && tf !== 'none') {
          var m = /matrix\(\s*(-?[\d.eE+-]+)/.exec(tf);
          if (m) mirrored = Number(m[1]) < 0;
        } else { mirrored = false; }
      } catch (e1) {}

      var fl = (fb.left - vb.left) / vb.width, frr = (fb.right - vb.left) / vb.width;
      var ft = (fb.top - vb.top) / vb.height, fbt = (fb.bottom - vb.top) / vb.height;
      var sx0 = offX + (mirrored ? (1 - frr) : fl) * visW;
      var sx1 = offX + (mirrored ? (1 - fl) : frr) * visW;
      var sy0 = offY + ft * visH, sy1 = offY + fbt * visH;
      var FW = sx1 - sx0, FH = sy1 - sy0;
      if (!(FW > 0) || !(FH > 0)) return no;
      var cx = (sx0 + sx1) / 2, cy = (sy0 + sy1) / 2;

      var bw = Number(box.width), bh = Number(box.height);
      var fcx = box.x + bw / 2, fcy = box.y + bh / 2;
      if (!isFinite(fcx) || !isFinite(fcy) || !(bw > 0) || !(bh > 0)) return no;

      var code = '';
      if (bw < FW * FACE_FRAME_MIN_W) code = 'FAR';
      else if (bw > FW || bh > FH) code = 'NEAR';
      else if (Math.abs(fcx - cx) > (FW / 2) * FACE_POS_SAFE || Math.abs(fcy - cy) > (FH / 2) * FACE_POS_SAFE) code = 'CENTER';
      else if (box.x < sx0 - FW * FACE_FRAME_MARGIN || box.x + bw > sx1 + FW * FACE_FRAME_MARGIN ||
               box.y < sy0 - FH * FACE_FRAME_MARGIN || box.y + bh > sy1 + FH * FACE_FRAME_MARGIN) code = 'EDGE';
      return { ready: true, inside: code === '', code: code };
    } catch (e) { return no; }
  }
  function facePosMsg(pos) {
    if (!pos || !pos.ready) return 'กำลังปรับหน้าจอ กรุณารอสักครู่…';
    if (pos.code === 'FAR') return 'กรุณาเข้าใกล้กล้องอีกนิด ให้ใบหน้าพอดีกรอบ';
    if (pos.code === 'NEAR') return 'กรุณาถอยห่างจากกล้องเล็กน้อย ให้ใบหน้าพอดีกรอบ';
    return 'กรุณาจัดใบหน้าให้อยู่กลางกรอบ';
  }

  /* ---------- [ATT SCAN SCOPE] Gate ใช้เฉพาะ "จอสแกนใบหน้าเพื่อลงเวลา" ----------
     grabFrames()/grabFramesLoop() ถูกใช้ร่วมกับ Face Login จึงต้องมีเงื่อนไขชัดเจน
       · จอสแกนลงเวลา : S.root[data-att-scan="1"] ที่ shell(…,'att') ตั้งไว้จุดเดียว
     ทำงานทั้ง Desktop และ Mobile · Flow อื่น (Face Login / ลงทะเบียน) ไม่โดน Gate นี้ */
  /* ---------- [RUN-221] "จอสแกนใบหน้าเพื่อลงเวลา" (ทุกอุปกรณ์) ----------
     คุมพฤติกรรมของจอลงเวลาตาม local378 เดิมทุกอย่าง: Deadline รวม · ตรวจเฉพาะเฟรมใหม่จริง · ห้าม AI ซ้อน · กู้ Backend · พักเมื่อปรับ Layout
       · จอสแกนลงเวลา : S.root[data-att-scan="1"] ที่ doPunch() ตั้งไว้จุดเดียว
     Flow อื่น (Face Login / ลงทะเบียน) ไม่มีค่านี้ */
  function attScanOn() {
    try {
      return !!(S.root && S.root.getAttribute('data-att-scan') === '1');
    } catch (e) { return false; }
  }
  /* ---------- [RUN-221 · R1] ด่านตรวจตำแหน่งใบหน้า = เฉพาะ "ลงเวลาด้วยใบหน้าบนมือถือ" (เงื่อนไขเดียวกับ local371) ----------
     ต้นเหตุ Regression: local372 เปิดด่านนี้บนคอมพิวเตอร์ด้วย -> คอมพิวเตอร์ออฟฟิศปฏิเสธหน้าเยื้องจากกลาง (local372) และหน้าใหญ่/นั่งใกล้กล้อง (local373)
     ของใหม่: คอมพิวเตอร์ไม่ผ่านด่านนี้เลย (เหมือน local371) จึงไม่โดนทั้งกฎกึ่งกลาง/ขนาด/ขอบ
       · มือถือ = deviceInfo().device === 'Mobile' (ตัวเดิมในไฟล์นี้) — Logic ของมือถือ (facePosInFrame) ไม่เปลี่ยนจาก local378
       · iPadOS Safari รายงาน UA เป็น Macintosh = Desktop = ไม่ติดด่าน (พฤติกรรม local371)
     ด่านนี้เป็นด่านช่วยจัดตำแหน่งเท่านั้น — คุณภาพใบหน้า (q.ratio) · ตรวจคนจริง · เทียบใบหน้า · GPS ยังตรวจทุกอุปกรณ์เหมือนเดิม */
  function attFacePosGateOn() {
    try {
      if (!attScanOn()) return false;
      return deviceInfo().device === 'Mobile';
    } catch (e) { return false; }
  }

  /* ---------- [RUN-213] Layout + ล็อกขนาดพื้นที่กล้อง/กรอบ (เฉพาะจอสแกนลงเวลา) ----------
     ปัญหา local372: Layout แนวนอน/แนวตั้งตัดสินด้วย CSS @media (max-height:520px ฯลฯ)
     แต่ JS ล็อกใหม่เฉพาะเมื่อ "กว้างเปลี่ยน / หมุน / สูงเปลี่ยนเกิน 140px"
     => สูงเปลี่ยนเล็กน้อยข้าม Breakpoint (เช่น 530 -> 510 · Windows Scaling · แถบเบราว์เซอร์)
        CSS สลับ Layout แต่ความสูงกล่องกล้อง/ขนาดกรอบยังเป็นค่าเก่า = กรอบเลื่อน

     ของใหม่: JS เป็นเจ้าของ Layout แต่เพียงผู้เดียว (data-att-layout="col|row") — CSS ไม่มี @media ของ Layout
       row = กล้องซ้าย · สถานะขวา  เมื่อ กว้าง >= 900 (คอม/แท็บเล็ตแนวนอน) หรือ แนวนอนและสูง <= 520
       col = กล้องบน · สถานะล่าง    (มี Hysteresis กันสลับไปมาที่ขอบ)
     ล็อกใหม่เมื่ออย่างใดอย่างหนึ่งเปลี่ยน: Layout · ความกว้าง · devicePixelRatio (Scaling/Zoom) · แนวจอ
       · หรือพื้นที่ที่ล็อกไว้ "ไม่พอดีจออีกต่อไป" · หรือความสูงเปลี่ยนมาก (เกิน 140px และเกิน 20%)
     สูงเปลี่ยนเล็กน้อย (แถบเบราว์เซอร์) หรือข้อความ/สถานะเปลี่ยน = ไม่ล็อกใหม่ ภาพไม่กระโดด
     ทุกครั้งที่ล็อกใหม่ระหว่างสแกน: พักการเก็บเฟรม ATT_RELOCK_PAUSE_MS แล้วตรวจต่อเอง (ไม่เปิดกล้องใหม่)
     เป็นงาน Layout ล้วน — ไม่แตะ <canvas> · videoWidth/Height · Stream · Detector */
  var ATT_RELOCK_PAUSE_MS = 450;
  var ATT_LOCK = { root: null, w: 0, vh: 0, dpr: 0, land: false, layout: '', ok: false, busyUntil: 0, gen: 0 };

  function attLayoutWant(prev) {
    var W = w.innerWidth || 0, H = w.innerHeight || 0;
    if (W >= (prev === 'row' ? 860 : 900)) return 'row';
    if (W > H && H <= (prev === 'row' ? 560 : 520)) return 'row';
    return 'col';
  }
  function attLayoutBusy() { return Date.now() < ATT_LOCK.busyUntil; }

  function attCamLock(force) {
    try {
      var root = S.root;
      if (!root || root.getAttribute('data-att-scan') !== '1') return false;
      var cam = root.querySelector('.njf-cam'), fr = root.querySelector('#njf-frame');
      var pn = root.querySelector('#njf-panel'), cp = root.querySelector('.njf-capt');
      if (!cam || !fr) return false;
      var W = Math.round(w.innerWidth || 0), VH = Math.round(w.innerHeight || 0);
      var dpr = Math.round((w.devicePixelRatio || 1) * 100) / 100;
      var land = W > VH;
      var same = ATT_LOCK.ok && ATT_LOCK.root === root;
      var want = attLayoutWant(same ? ATT_LOCK.layout : '');
      /* [RUN-215] จอแนวตั้งเตี้ย (iPhone SE · มือถือจอเล็ก · แถบเบราว์เซอร์กินที่): Panel/หัวจอแบบกระชับ = พื้นที่กล้องใหญ่ขึ้น
         ตัดสินเฉพาะตอนล็อก (ไม่ใช่ทุกครั้งที่ความสูงขยับ) จึงไม่ทำให้กรอบเลื่อนระหว่างสแกน */
      var cmpNew = want === 'col' && VH < 640;
      if (!force && same && ATT_LOCK.w === W && ATT_LOCK.dpr === dpr && ATT_LOCK.land === land &&
          ATT_LOCK.layout === want) {
        var dH = Math.abs(ATT_LOCK.vh - VH);
        var big = dH > 140 && dH > ATT_LOCK.vh * 0.2;
        var fits = true;
        try {
          var rb = root.getBoundingClientRect(), cbb = cam.getBoundingClientRect();
          var low = cp ? cp.getBoundingClientRect().bottom : cbb.bottom;
          fits = low <= rb.bottom + 0.5 && cbb.top >= rb.top - 0.5 &&
                 (want === 'row' || !pn || pn.getBoundingClientRect().height >= 96);
        } catch (e0) {}
        if (!big && fits) return true;
      }
      /* กลับไปใช้ Layout จาก CSS ชั่วครู่เพื่อวัดพื้นที่ที่เหลือจริงของ Layout ที่ต้องการ */
      root.removeAttribute('data-cam-locked');
      root.setAttribute('data-att-layout', want);
      root.setAttribute('data-att-compact', cmpNew ? '1' : '0');
      cam.style.height = ''; cam.style.flex = '';
      var cb = cam.getBoundingClientRect();
      if (!(cb.width > 60) || !(cb.height > 60)) { ATT_LOCK.ok = false; return false; }
      var cw = cb.width;
      var h = Math.floor(Math.min(cb.height, cw * 4 / 3));
      cam.style.flex = 'none';
      cam.style.height = h + 'px';
      var fw = Math.floor(Math.min(cw * 0.66, h * 0.80 * 0.75));
      fr.style.width = fw + 'px';
      fr.style.height = Math.round(fw * 4 / 3) + 'px';
      fr.style.maxHeight = 'none';             // ค่าสำรองใน CSS (max-height:76%) ต้องไม่บีบกรอบที่ล็อกแล้ว
      root.setAttribute('data-cam-locked', '1');
      /* พักการเก็บเฟรมเฉพาะเมื่อ "พื้นที่กล้อง/กรอบเปลี่ยนจริง" ระหว่างสแกน
         ล็อกซ้ำแล้วได้ค่าเดิม (เช่น ล็อกยืนยันหลัง CSS โหลด) = ไม่พัก ไม่ขึ้นสีส้ม */
      var moved = !same || ATT_LOCK.layout !== want || ATT_LOCK.h !== h || ATT_LOCK.fw !== fw ||
                  Math.abs((ATT_LOCK.cw || 0) - cw) > 0.5;
      var keep = ATT_LOCK.busyUntil > Date.now() ? ATT_LOCK.busyUntil : 0;
      ATT_LOCK = { root: root, w: W, vh: VH, dpr: dpr, land: land, layout: want, ok: true,
                   h: h, fw: fw, cw: cw,
                   busyUntil: (same && moved && S.running) ? Math.max(keep, Date.now() + ATT_RELOCK_PAUSE_MS) : keep,
                   gen: (ATT_LOCK.gen || 0) + 1 };
      return true;
    } catch (e) { return false; }
  }
  try {
    w.addEventListener('resize', function () { attCamLock(false); });
    w.addEventListener('orientationchange', function () {
      ATT_LOCK.busyUntil = Date.now() + ATT_RELOCK_PAUSE_MS + 300;   // พักเก็บเฟรมระหว่างจอกำลังหมุน
      setTimeout(function () { attCamLock(true); }, 250);
    });
  } catch (eLk) {}

  /* ---------- [RUN-212] สีกรอบ 4 มุม + แถบ Progress ใต้ภาพกล้อง ----------
     เปลี่ยนเฉพาะ "สี" (data-state) และความยาวแถบ — ไม่แตะตำแหน่ง/ขนาดกรอบ ไม่สร้าง Element ใหม่
       wait = ขาว รอใบหน้าเข้ากรอบ · run = ฟ้า กำลังตรวจสอบ · adjust = ส้ม จัดตำแหน่งใหม่
       ok = เขียว ผ่าน · bad = แดง ไม่ผ่าน
     จอที่ไม่ใช่สแกนลงเวลา (ไม่มี #njf-frame) = ไม่ทำอะไรเลย */
  function attFrame(state, prog) {
    try {
      var root = S.root; if (!root) return;
      var fr = root.querySelector('#njf-frame'); if (!fr) return;
      var bar = root.querySelector('#njf-scanbar');
      if (state && fr.getAttribute('data-state') !== state) {
        fr.setAttribute('data-state', state);
        if (bar) bar.setAttribute('data-state', state);
      }
      if (prog != null && bar) {
        var p = Math.max(0, Math.min(1, Number(prog) || 0));
        var pv = String(Math.round(p * 100));
        if (bar.getAttribute('aria-valuenow') !== pv) {
          bar.setAttribute('aria-valuenow', pv);
          var fg = bar.firstChild;
          if (fg && fg.style) fg.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        }
      }
    } catch (e) {}
  }

  /* ---------- [RUN-213] ป้ายสถานะบนพื้นที่กล้อง ตอนที่ "ยังไม่มีภาพกล้อง / ปิดกล้องแล้ว" ----------
     ปัญหา local372: ช่วงรอ GPS · เตรียมกล้อง · หลังปิดกล้องเพื่อส่งหลักฐาน เห็นแค่กรอบบนพื้นดำ
     kind: 'gps' | 'cam' | 'save' (มีวงหมุน) · 'ok' | 'bad' (ไอคอนผล) · null = ซ่อน (มีภาพกล้องแล้ว)
     เป็น Element เดียวที่สร้างไว้ใน shell() — เปลี่ยนเฉพาะข้อความ/attribute ไม่สร้างใหม่ */
  function attCover(kind, text) {
    try {
      var root = S.root; if (!root) return;
      var c = root.querySelector('#njf-camstate'); if (!c) return;
      if (!kind) { if (!c.hidden) c.hidden = true; return; }
      if (c.getAttribute('data-kind') !== kind) c.setAttribute('data-kind', kind);
      var t = c.querySelector('#njf-camstate-t');
      if (t && text != null && t.textContent !== text) t.textContent = text;
      if (c.hidden) c.hidden = false;
    } catch (e) {}
  }

  /* ---------- [FACE POSITION GATE · WAIT] หน้าออกนอกกรอบ = สถานะรอ ไม่ใช่ Error ----------
     ใช้กับ Flow สำรองของ Android ที่เป็น One-shot: ถ้าขยับออกนอกกรอบชั่วครู่
     ต้องไม่จบรอบสแกนและไม่บังคับให้ผู้ใช้กด "ลองใหม่"
     ทางออกมี 3 ทาง ไม่มี Infinite Loop:
       1 ใบหน้าเข้ากลางกรอบ            -> คืนผลตรวจเฟรมนั้นให้ด่านเดิมทำงานต่อ
       2 live() เป็นเท็จ (Cancel/Route/Logout/Timeout เดิม) -> AbortAttendanceError เดิม
       3 ครบเพดานเวลา FACE_POS_WAIT_MS -> แจ้งข้อความเดิมและจบรอบตามกลไกเดิม
     ⚠ ไม่แตะ Threshold · Descriptor · Liveness · จำนวนเฟรม · เกณฑ์คุณภาพภาพเดิม */
  var FACE_POS_WAIT_MS = 20000;   // เพดานรอของเส้นทางสำรอง Android แบบ One-shot (ค่าเดิม ไม่เปลี่ยน)
  var FACE_POS_WAIT_TICK_MS = 250;
  /* [RUN-221 · R4] เส้นทางสแกนลงเวลาปกติ: เวลารอจัดตำแหน่ง ~9 วินาที (local373–378 = 20 วินาที)
     · เริ่มนับเมื่อ "Detector ตอบผลจริงครั้งแรกของรอบนี้" = กล้องส่งเฟรม + AI ประมวลผลได้แล้ว (ไม่นับเวลาเปิดกล้อง/โหลดโมเดล/AI รอบแรก)
     · ต้องได้ดูภาพจริงอย่างน้อย ATT_POS_WAIT_MIN_LOOKS ครั้งก่อนตัดสิน — เครื่องที่ AI ช้าไม่ถูกตัดเร็วกว่าที่ได้ดูจริง
       (local371 ตัดด้วยจำนวนรอบ 96 รอบ ไม่ใช่เวลา)
     · พบใบหน้าที่ใช้ได้เมื่อไหร่ ตัวนับถูกล้างและเดินต่อทันที ไม่มีการรอให้ครบเวลา */
  var ATT_POS_WAIT_MS = 9000;
  var ATT_POS_WAIT_MIN_LOOKS = 12;
  var POS_WHY = { NOFACE: 'ไม่พบใบหน้าในกล้อง', MULTI: 'พบมากกว่า 1 ใบหน้า', SMALL: 'ใบหน้าอยู่ไกลกล้องเกินไป',
                  CENTER: 'ใบหน้าไม่อยู่กลางกรอบ', FAR: 'ใบหน้าอยู่ไกลกล้องเกินไป', NEAR: 'ใบหน้าอยู่ใกล้กล้องเกินไป',
                  EDGE: 'ใบหน้าล้นขอบกรอบ', NOTREADY: 'หน้าจอยังปรับไม่เสร็จ' };

  /* [RUN-215] ทุกรอบ: ตรวจ ยกเลิก/Session/Deadline "ก่อน" เรียก Detector และ "หลัง" Detector ตอบ
       ยกเลิกแล้ว/หมดเวลาแล้ว = ไม่เรียก Detector เพิ่มแม้แต่ครั้งเดียว · ผลที่ตอบหลังหมดเวลา = ไม่มีสิทธิ์ผ่าน
       จอสแกนลงเวลา: รอเฟรมใหม่จริงก่อนตรวจ (ไม่ตรวจเฟรมเดิมซ้ำ) · Timer รอรอบถัดไปถูกยกเลิกเมื่อ Session จบ */
  function waitFaceCenter(detectFn, onTick, live, deadline) {
    var att = attFacePosGateOn();
    function expired() { return att && Date.now() >= deadline; }
    function toErr() { return faceErr('FACE_POSITION_TIMEOUT', 'หมดเวลาจัดตำแหน่งใบหน้า กรุณาลองใหม่'); }   // [RUN-221] ข้อความเดิม + รหัสจริง
    if (!live()) return Promise.reject(AbortAttendanceError());
    if (expired()) return Promise.reject(toErr());
    return (att ? frameFresh(live, deadline) : Promise.resolve(true)).then(function () {
      if (!live()) throw AbortAttendanceError();
      if (expired()) throw toErr();
      return detectFn();
    }).then(function (r) {
      if (!live()) throw AbortAttendanceError();
      var one = !!(r && r.length === 1);
      /* ไม่อยู่ใน Scope (ไม่ใช่จอสแกนลงเวลา) = ไม่ต้องรอ คืนทันที (พฤติกรรมเดิม) */
      if (!att) return r;
      if (expired()) throw toErr();                         // ตอบหลังหมดเวลา = ไม่รับผล แม้ใบหน้าจะอยู่ในกรอบ
      var pos = one ? facePosInFrame(r[0].detection.box) : null;
      if (pos && pos.ready && pos.inside) return r;
      if (onTick) {
        if (one) onTick(facePosMsg(pos), undefined, 'ADJUST');
        else if (r && r.length > 1) onTick('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง', undefined, 'ADJUST');
        else onTick('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ', undefined, 'NOFACE');
      }
      return new Promise(function (res, rej) {
        var tm = setTimeout(function () { clearInterval(iv); res(); }, FACE_POS_WAIT_TICK_MS);
        var iv = setInterval(function () {                  // ยกเลิกระหว่างรอ = เลิกรอทันที ไม่ปล่อย Timer ค้าง
          if (!live()) { clearTimeout(tm); clearInterval(iv); rej(AbortAttendanceError()); }
        }, 50);
      }).then(function () { return waitFaceCenter(detectFn, onTick, live, deadline); });
    }, function (e) {
      if (att && e && e.faceCode === 'FACE_INFER_INTERRUPTED' && live() && !expired()) {
        return waitFaceCenter(detectFn, onTick, live, deadline);   // ถูกพักจอ/กู้ Backend = ตรวจต่อภายในเวลาเดิม
      }
      throw e;
    });
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
  /* [RUN-200] เลือก "เฟรมที่ดีที่สุด" จากเฟรมที่ผ่านด่านเดิมมาครบทุกด่านแล้ว
     แทนการหยิบเฟรมสุดท้ายแบบเดิม (ctx.frames[length-1])

     ทำไม: ลูปเก็บเฟรมสร้าง Descriptor หลายเฟรม แต่ส่งขึ้นเซิร์ฟเวอร์เพียงเฟรมเดียว
       ของเดิมหยิบ "เฟรมสุดท้าย" ซึ่งอาจเบลอหรือหน้าเอียงกว่าเฟรมอื่นในชุดเดียวกัน
       ทำให้ระยะห่าง (face_distance) แย่กว่าที่ควรเป็น และเฉียดเกณฑ์โดยไม่จำเป็น

     ⚠ ไม่แตะเกณฑ์ Face Match · ไม่แตะ Liveness · ไม่แตะจำนวนเฟรม · ไม่แตะคุณภาพขั้นต่ำ
     ⚠ ไม่เรียกโมเดลเพิ่มแม้แต่ครั้งเดียว — ใช้เฉพาะค่าที่ grabFramesLoop เก็บไว้ทุกเฟรมอยู่แล้ว
     ⚠ ทุกเฟรมในชุดนี้ผ่านด่านเดิมมาแล้วทั้งหมด (1 ใบหน้า · ratio · วงรี · Liveness)
       จึงเป็นเพียงการ "เลือกใช้" เฟรมที่ถูกต้องอยู่แล้วเฟรมไหน ไม่ใช่การรับเฟรมที่เคยถูกปฏิเสธ
     ⚠ อ่านค่าไม่ได้เมื่อไหร่ คืนเฟรมสุดท้ายเท่าเดิม = พฤติกรรมเดิมทุกประการ

     เกณฑ์เลือก (ใช้เฉพาะจัดอันดับ ไม่ใช่รับ/ไม่รับ):
       ความคม (sharpness)  — ตัวหลัก ภาพเบลอทำให้ Descriptor เพี้ยนมากที่สุด
       ใบหน้าตรง (|yaw|)   — มุมที่ลงทะเบียนไว้เป็นมุมตรง เฟรมตรงกว่าจึงเทียบได้ดีกว่า
       ขนาดใบหน้า (ratio)  — ใบหน้าใหญ่ในเฟรมให้รายละเอียดมากกว่า */
  function pickBestFrame(frames) {
    if (!frames || !frames.length) return null;
    var best = frames[frames.length - 1], bestScore = -1;
    for (var i = 0; i < frames.length; i++) {
      var fr = frames[i], q = fr && fr.q;
      if (!q || !(q.sharpness > 0)) continue;
      var ya = Math.abs(Number(fr.yaw) || 0);
      var score = q.sharpness * (1 / (1 + 4 * ya)) * (1 + (Number(q.ratio) || 0));
      if (score > bestScore) { bestScore = score; best = fr; }
    }
    return best;
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
  function grabFrames(count, onTick, alive, inferTimeoutMs, deadline) {
    var live = (typeof alive === 'function') ? alive : function () { return !!S.running; };
    var out = [];
    /* [RUN-214] จอสแกนลงเวลา: ไม่ยืนรอ Recognition 6.44 MB ก่อนเริ่ม — Guide ตรวจตำแหน่ง/บอกผู้ใช้ได้ทันที
       Descriptor เริ่มสร้างเมื่อ S.recogReady จริงเท่านั้น (Single-flight เดิม · ไม่โหลดซ้ำ) */
    if (attScanOn()) {
      var rec = { e: null };
      recogLoad()['catch'](function (e) { rec.e = e || new Error('โหลดโมเดลยืนยันใบหน้าไม่สำเร็จ'); });
      if (!S.running || !live()) return Promise.reject(AbortAttendanceError());
      if (onTick) onTick(null, 0);
      var tFa = perfNow();
      return grabFramesLoop(count, onTick, live, out, null, inferTimeoutMs, deadline, rec).then(function (r) {
        perfMark('grab_frames_ms', tFa);
        return r;
      });
    }
    /* [PERF] grabFrames สร้าง Descriptor ทุกเฟรม (passiveLiveness ใช้ค่า dd จริง)
       จึงต้องมั่นใจว่า Recognition พร้อมก่อนเริ่มลูป — รอที่นี่จุดเดียว ไม่รอกลางลูป
       recogLoad() เป็น Single-flight: ถ้าโหลดเสร็จแล้วจะ Resolve ทันที ไม่มีค่าใช้จ่าย */
    var tW = perfNow();
    return recogLoad().then(function () {
      perfMark('recognition_wait_ms', tW);
      if (!S.running || !live()) throw AbortAttendanceError();
      if (onTick) onTick(null, 0);
      var tF = perfNow();
      return grabFramesLoop(count, onTick, live, out, null, inferTimeoutMs).then(function (r) {
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
  var ATT_FLOW_MAX_MS = 90000;       // [RUN-215] Deadline รวมตั้งแต่กดลงเวลา จนถึง "ส่งคำสั่งบันทึก"
  var ATT_SAVE_RESERVE_MS = 8000;    // เวลาที่กันไว้ให้ขั้น รูปหลักฐาน/Upload/GPS ก่อนส่ง
  var SNAPSHOT_MIN_BYTES = 1500;     // รูปหลักฐาน JPEG ที่เล็กกว่านี้ = ภาพว่าง/เสีย
  var ATT_SCAN_MAX_MS = 60000;   // [RUN-213] เพดานเวลารวมของลูปสแกนลงเวลา 1 รอบ (กันค้าง)

  function grabFramesLoop(count, onTick, live, out, stopWhen, inferTimeoutMs, deadline, rec) {
    return new Promise(function (res, rej) {
      var tries = 0, stable = 0, badRun = 0;
      /* [RUN-221 · R3] บอกผู้ใช้ตามจริงระหว่าง AI รอบแรก / ระหว่างรองานเดิมหลังกดลองใหม่ (เฉพาะจอสแกนลงเวลา) */
      if (attScanOn() && onTick) {
        try {
          if (!INF.okN) onTick('กำลังเตรียมระบบ AI…', undefined, 'PREP');
          else if (INF.cur) onTick('กำลังรอระบบ AI ทำงานรอบก่อนหน้าให้เสร็จ…', undefined, 'PREP');
        } catch (eP) {}
      }
      /* [RUN-213] จอสแกนลงเวลา: ระยะรอจัดใบหน้าคุมด้วย "เวลาจริง" เท่ากันทุกอุปกรณ์
         เดิม ไม่พบหน้า/หน้าเล็ก/หลายหน้า หักโควตา tries (จำนวนรอบ) -> เครื่องเร็วหมดรอบใน 2–3 วินาที เครื่องช้า 15+ วินาที
         ใหม่ เฟรมที่ยังใช้ไม่ได้ = แจ้งจัดตำแหน่ง + ตรวจต่อเอง ไม่หักโควตา
              · อยู่ในสภาพใช้ไม่ได้ต่อเนื่องเกิน ATT_POS_WAIT_MS (~9 วิ · RUN-221 R4 · เดิม 20 วิ) = จบรอบ
              · ทั้งลูปยาวเกิน ATT_SCAN_MAX_MS (60 วิ) = จบรอบ  -> ไม่มี Infinite Loop
         Face Login (att=false) ใช้ตรรกะนับรอบเดิมทุกบรรทัด */
      var att = attScanOn();                   // พฤติกรรมจอลงเวลา (ทุกอุปกรณ์ — เหมือน local378)
      var posGate = attFacePosGateOn();        // [RUN-221 · R1] ด่านตำแหน่ง = เฉพาะมือถือ (local371)
      /* [RUN-214] เวลาจริงคุมทั้งหมด (เลิกใช้จำนวนรอบเป็นเงื่อนไขหยุดของจอสแกนลงเวลา)
           dl       = Total Scan Deadline ของรอบสแกนนี้ (ใช้ร่วมกันทั้ง 6 เฟรมแรก + เฟรมเพิ่มกรณีก้ำกึ่ง) ไม่มีการ Reset
           waitUsed = เวลารอ "ผู้ใช้จัดใบหน้า" ต่อเนื่อง 20s ตามเวลาจริง เท่ากันทุกเครื่อง (เครื่องเร็ว/ช้าไม่ต่างกัน)
                      ไม่นับช่วงพักจอ · ช่วงปรับ Layout · ช่วงกล้องค้าง — งบเวลาแยกจาก Timeout ต่อ inference และ dl */
      var loopT0 = Date.now(), lastTick = loopT0, waitUsed = 0;
      var waitArmed = false, waitLooks = 0, lastWhy = '';   // [RUN-221 · R4]
      var dl = att ? (Number(deadline) > 0 ? Number(deadline) : loopT0 + ATT_SCAN_MAX_MS) : 0;
      var lastSeq = '', noFrameT0 = 0, kicked = false, camRestarting = false;
      var MSG_DL = 'สแกนใบหน้าใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
      function attWait(msg, code, why) {       // คืน true = ปิดรอบแล้ว (ผู้เรียกต้อง return)
        tries--;
        var now = Date.now();
        if (!waitArmed) { waitArmed = true; lastTick = now; }    // [RUN-221 · R4] ผลจริงครั้งแรกของ Detector = เริ่มนับจากตรงนี้
        if (INF.visAt > lastTick) lastTick = INF.visAt;          // ช่วงพักจอ/สลับแอป ไม่นับเป็นเวลารอของผู้ใช้
        waitUsed += Math.max(0, now - lastTick);
        lastTick = now;
        waitLooks++; lastWhy = why || code || '';
        if (waitUsed > ATT_POS_WAIT_MS && waitLooks >= ATT_POS_WAIT_MIN_LOOKS) {
          /* บอกสาเหตุจริงของรอบนี้ · ติดรหัสจริง (ไม่ใช่ผลตรวจคนจริง — ยังไม่ได้ตรวจ Liveness) */
          failWith('FACE_POSITION_TIMEOUT', 'หมดเวลาจัดตำแหน่งใบหน้า' + (POS_WHY[lastWhy] ? ' (' + POS_WHY[lastWhy] + ')' : '') +
                   ' กรุณาลองใหม่', 'FACE_POSITION_TIMEOUT');
          return true;
        }
        if (onTick) onTick(msg, undefined, code);
        return false;
      }
      var frameInferMs = Number(inferTimeoutMs) > 0 ? Number(inferTimeoutMs) : null;
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
          if (telOn()) throw 0;               // [RUN-222] เหตุการณ์เดียวกันถูกบันทึกทาง Telemetry แล้ว (ไม่ส่ง Log ซ้อน) · ปิด Telemetry = ใช้ทางเดิม
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
        if (lastWhy) e3.posWhy = lastWhy;  // [RUN-221 · R8] สถานะจัดตำแหน่งล่าสุด (รหัส ไม่ใช่พิกัด)
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

        /* [RUN-213] กำลังปรับ Layout (หมุนจอ/เปลี่ยนขนาด) = พักเก็บเฟรม แล้วตรวจต่อเองเมื่อพิกัดนิ่ง
           ไม่เรียก Detector · ไม่นับ tries · ไม่แตะกล้อง — มีเพดานเวลารวมกันค้าง */
        if (att && attLayoutBusy()) {
          stable = 0; lastTick = Date.now();
          if (Date.now() > dl) return failWith('SCAN_DEADLINE', MSG_DL, 'FACE_SCAN_DEADLINE');
          if (onTick) onTick('กำลังปรับหน้าจอ กรุณารอสักครู่…', undefined, 'ADJUST');
          S.raf = requestAnimationFrame(loop);
          return;
        }

        if (att) {
          if (rec && rec.e) return rej(rec.e);            // โหลด Recognition ล้มเหลว = จบด้วย Error จริง
          if (rec && !S.recogReady && !S.recogLoading) {  // [RUN-215] หลังกู้ Backend: โหลด Recognition ใหม่ (Single-flight)
            recogLoad()['catch'](function (eR) { rec.e = eR || new Error('โหลดโมเดลยืนยันใบหน้าไม่สำเร็จ'); });
          }
          if (camRestarting) { S.raf = requestAnimationFrame(loop); return; }
          /* [RUN-214] ตรวจเฉพาะ "เฟรมใหม่จริง" — ไม่ประมวลผลเฟรมเดิมซ้ำ · เฟรมซ้ำไม่ถูกนับเป็นหลักฐานหลายเฟรม
             Track ยัง live แต่ภาพหยุดเดิน: พัก AI -> play() Stream เดิม -> ยังค้าง = จบรอบพร้อมสาเหตุ */
          var fq = frameSeq();
          if (!fq || !fq.sure || fq.seq === lastSeq) {            // พิสูจน์ไม่ได้ว่าเป็นเฟรมใหม่ = ไม่ตรวจ
            var nowF = Date.now();
            if (!noFrameT0 || INF.visAt > noFrameT0) noFrameT0 = nowF;   // กลับจากพักจอ = เริ่มจับเวลาใหม่
            if (nowF > dl) return failWith('SCAN_DEADLINE', MSG_DL, 'FACE_SCAN_DEADLINE');
            if (nowF - noFrameT0 > FRAME_DEAD_MS) {
              return failWith('VIDEO_STALLED', 'กล้องหยุดส่งภาพ กรุณาลองใหม่อีกครั้ง', 'CAM_FRAME_STALLED');
            }
            /* [RUN-215] play() แล้วยังไม่มีเฟรม: เปิดกล้องใหม่ "ภายในรอบสแกนนี้" 1 ครั้ง (ปิด Stream เดิมก่อนเสมอ ไม่ซ้อน)
               ทำไม่ได้/ยังค้าง = จบรอบพร้อมสาเหตุตามเพดานด้านบน */
            if (!S.attCamRestartUsed && nowF - noFrameT0 > FRAME_RESTART_MS && typeof S.attCamRestart === 'function') {
              S.attCamRestartUsed = true; camRestarting = true; stable = 0;
              if (onTick) onTick('กำลังเปิดกล้องใหม่…', undefined, 'ADJUST');
              S.attCamRestart().then(function () {
                camRestarting = false; noFrameT0 = 0; lastSeq = ''; lastTick = Date.now();
              }, function () {
                camRestarting = false;
                if (live()) failWith('VIDEO_STALLED', 'กล้องหยุดส่งภาพ กรุณาลองใหม่อีกครั้ง', 'CAM_FRAME_STALLED');
              });
              S.raf = requestAnimationFrame(loop);
              return;
            }
            if (nowF - noFrameT0 > FRAME_STALL_MS) {
              stable = 0; lastTick = nowF;
              if (!kicked) { kicked = true; camKick(); try { perfBootCount('camera_frame_stall'); } catch (eK) {} }
              if (onTick) onTick('กล้องหยุดส่งภาพชั่วคราว กำลังกู้คืน…', undefined, 'ADJUST');
            }
            S.raf = requestAnimationFrame(loop);
            return;
          }
          lastSeq = fq.seq;
          noFrameT0 = 0; kicked = false;
        }

        /* Stage A ก่อนเสมอ · Stage B เฉพาะเมื่อนิ่งครบแล้ว
           [RUN-214] จอสแกนลงเวลา: Stage B เริ่มเมื่อ Recognition พร้อมจริง — ระหว่างนั้น Guide ยังตรวจตำแหน่งต่อ */
        var capturing = stable >= GRAB_STABLE_MIN && (!rec || !!S.recogReady);
        (capturing ? detect(frameInferMs) : detectGuide(frameInferMs)).then(function (res2) {
          if (!live()) return rej(AbortAttendanceError());   // detect ตอบหลังหมดอายุ = หยุดทันที
          /* [RUN-214] Detector ตอบกลับหลัง Total Scan Deadline = ไม่มีสิทธิ์ผ่าน (ตรวจก่อนใช้ผลทุกครั้ง) */
          if (att && Date.now() > dl) return failWith('SCAN_DEADLINE', MSG_DL, 'FACE_SCAN_DEADLINE');
          tries++;
          if (!firstDetect) { firstDetect = 1; perfMark('face_detect_first_ms', tLoop); try { if (S.tl && !S.tl.ai) S.tl.ai = Date.now(); } catch (eTl) {} }
          if (!res2.length) {
            badRun++;
            /* [SAMSUNG FIX] เฟรมเสียเดี่ยว ๆ ไม่ควรล้างความนิ่งทั้งหมด
               Detector บนมือถือสะดุดเป็นระยะ ถ้ารีเซ็ตทุกครั้งจะไม่มีวันครบ 6 เฟรม */
            if (badRun >= GRAB_BAD_RESET) stable = 0;
            if (att) { if (attWait('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ', 'NOFACE', 'NOFACE')) return; }
            else if (onTick) onTick('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ', undefined, 'NOFACE');
          } else if (res2.length > 1) {
            badRun = 0; stable = 0;
            out.length = 0;
            if (att) { if (attWait('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง', 'ADJUST', 'MULTI')) return; }
            else if (onTick) onTick('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง', undefined, 'ADJUST');
          } else {
            var f0 = res2[0], box = f0.detection.box;
            var q = frameQuality(box);
            var pos = null;
            if (!q || q.ratio < 0.035) {
              badRun++;
              if (badRun >= GRAB_BAD_RESET) stable = 0;
              if (att) { if (attWait('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น', 'ADJUST', 'SMALL')) return; }
              else if (onTick) onTick('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น', undefined, 'ADJUST');
            } else if (posGate && (pos = facePosInFrame(box), !(pos.ready && pos.inside))) {
              /* [FACE POSITION GATE] ตรวจ "ทุกเฟรม" รวมเฟรมที่กำลังจะใช้สร้าง Descriptor (capturing)
                 ไม่อยู่ในกรอบ (กึ่งกลาง/ขนาด/ขอบ) หรือพิกัดยังไม่พร้อม = ไม่สะสมความนิ่ง ไม่เก็บ Descriptor
                 ⚠ [RUN-221 · R1] มีผลเฉพาะจอสแกนลงเวลา "บนมือถือ" — คอมพิวเตอร์ / Face Login ข้ามสาขานี้ทั้งหมด (local371) */
              stable = 0;
              if (attWait(facePosMsg(pos), 'ADJUST', pos.ready ? (pos.code || 'CENTER') : 'NOTREADY')) return;
            } else if (!capturing || !f0.descriptor) {
              /* Stage A ผ่าน แต่ยังไม่ถึงคิวสร้าง Descriptor — นับความนิ่งไว้ก่อน */
              badRun = 0; stable++; waitUsed = 0; lastTick = Date.now();
              if (rec && !S.recogReady && stable >= GRAB_STABLE_MIN) {
                if (onTick) onTick('กำลังเตรียมระบบยืนยันใบหน้า…', out.length / count, 'PREP');
              } else if (onTick) onTick(null, out.length / count);
            } else {
              badRun = 0; waitUsed = 0; lastTick = Date.now();
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
          if (att && Date.now() > dl) return failWith('SCAN_DEADLINE', MSG_DL, 'FACE_SCAN_DEADLINE');
          /* เพดานนับเฉพาะรอบที่ "ได้ภาพจริง" แล้วเท่านั้น */
          if (!att && tries > count * 12 + GRAB_STABLE_MIN * 12) {
            return failWith(out.length ? 'FRAME_TIMEOUT' : 'NO_FACE',
              'ตรวจใบหน้าไม่สำเร็จ กรุณาลองใหม่');
          }
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) {
          if (!live()) return rej(AbortAttendanceError());
          if (isAborted(e)) return rej(e);
          if (att && e && e.faceCode === 'FACE_INFER_INTERRUPTED') {
            /* [RUN-214] inference ถูกพักเพราะล็อกจอ/สลับแอป — ไม่ใช่เครื่องช้า: ตรวจเฟรมใหม่ต่อ (ภายใน Deadline เดิม) */
            if (Date.now() > dl) return failWith('SCAN_DEADLINE', MSG_DL, 'FACE_SCAN_DEADLINE');
            stable = 0; lastTick = Date.now();
            S.raf = requestAnimationFrame(loop);
            return;
          }
          if (e && (e.faceCode === 'FACE_BACKEND_STUCK' || e.faceCode === 'FACE_BACKEND_LOST')) {
            return failWith('DETECT_BACKEND', e.message, e.faceCode);   // คงรหัสจริง -> หน้าจอเสนอ "โหลดหน้าใหม่"
          }
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
  function grabFramesMore(seed, maxTotal, onTick, alive, stopWhen, inferTimeoutMs, deadline) {
    var live = (typeof alive === 'function') ? alive : function () { return !!S.running; };
    return recogLoad().then(function () {
      if (!S.running || !live()) throw AbortAttendanceError();
      return grabFramesLoop(maxTotal, onTick, live, seed, stopWhen, inferTimeoutMs, deadline);
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
  function blinkChallenge(onTick, alive, inferTimeoutMs, inputSize, challengeMs) {
    var live = (typeof alive === 'function') ? alive : null;
    var seenOpen = false, seenClose = false, t0 = Date.now();
    var limitMs = Number(challengeMs) > 0 ? Number(challengeMs) : 9000;
    return new Promise(function (res, rej) {
      (function loop() {
        if (!S.running) return rej(new Error('ยกเลิกแล้ว'));
        if (live && !live()) return rej(AbortAttendanceError());   // ก่อน detect
        if (Date.now() - t0 > limitMs) return res(false);
        /* [RUN-215] จอสแกนลงเวลา: แต่ละรอบของการกระพริบตาต้องเป็นเฟรมใหม่จริง (เฟรมซ้ำ/กล้องค้างไม่นับ) */
        (attScanOn() ? frameFresh(live, t0 + limitMs) : Promise.resolve(true)).then(function () {
          if (live && !live()) throw AbortAttendanceError();
          return detectGuide(inferTimeoutMs, inputSize);
        }).then(function (r) {
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

  /* ---------- Android Attendance Lite หลังเกิด Timeout จริง ----------
     เป้าหมาย: ตัดงาน Recognition ที่แพงจาก 6–14 Descriptor เหลือ 1 Descriptor สด
     ความปลอดภัยยัง Fail Closed: ต้องพบ 1 ใบหน้า + คุณภาพภาพ + Active Blink Liveness
     แล้วจึงสร้าง Descriptor สด 1 ครั้งและส่งให้ RPC เดิมเทียบ Threshold เดิมบน Server
     TinyFaceDetector ใช้ inputSize 224 เฉพาะ Slow-path นี้ เพราะใบหน้าถูกบังคับให้อยู่เต็มกรอบ
     Flow ปกติทุกอุปกรณ์ยังใช้ inputSize 320 และ Passive Liveness เดิม */
  function androidAttendanceLiteScan(onTick, alive, inferTimeoutMs, deadline) {
    var live = (typeof alive === 'function') ? alive : function () { return !!S.running; };
    var ms = Number(inferTimeoutMs) > 0 ? Number(inferTimeoutMs) : ANDROID_ATT_INFER_TIMEOUT_MS;
    var input = ANDROID_ATT_LITE_INPUT_SIZE;
    if (!live()) return Promise.reject(AbortAttendanceError());
    /* [RUN-214] Total Scan Deadline เดียวกับเส้นทางปกติ — ทุกขั้นตรวจก่อนเดินต่อ (ไม่รอ 20s ซ้ำหลายรอบไม่มีกำหนด) */
    var dlAll = Number(deadline) > 0 ? Number(deadline) : 0;
    function chk() {
      if (!live()) throw AbortAttendanceError();
      if (dlAll && Date.now() > dlAll) throw faceErr('FACE_SCAN_DEADLINE', 'สแกนใบหน้าใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
    }
    if (onTick) onTick('กำลังเตรียมโหมดสำรองสำหรับเครื่องนี้');

    /* Samsung/Android ที่เคย Timeout: เปลี่ยน backend ก่อน แล้วโหลด Guide nets ใหม่บน CPU
       จุดนี้คือความต่างหลักจากรุ่นก่อนที่ยังรัน detectGuide บน WebGL เดิม */
    return androidAttCpuPrepare(onTick).then(function () {
      chk();
      return guideLoad();
    }).then(function () {
      chk();
      /* [FACE POSITION GATE] รอให้ใบหน้าเข้ากลางกรอบก่อน แล้วค่อยส่งเฟรมนั้นเข้าด่านเดิม
         Android ใช้เกณฑ์กรอบเดียวกับเส้นทางปกติ แต่ "รอ" ไม่ใช่ "จบรอบ" */
      return waitFaceCenter(function () { return detectGuide(ms, input); },
        onTick, live, Math.min(Date.now() + FACE_POS_WAIT_MS, dlAll || Infinity));
    }).then(function (r) {
      chk();
      if (!r || r.length !== 1) {
        if (r && r.length > 1) throw new Error('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง');
        throw new Error('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ');
      }
      var q = frameQuality(r[0].detection.box);
      if (!q || q.ratio < 0.035) throw new Error('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น');
      if (q.brightness < 45) throw new Error('แสงน้อยเกินไป กรุณาหาที่สว่างขึ้น');
      if (q.brightness > 232) throw new Error('แสงจ้าเกินไป กรุณาเลี่ยงแสงย้อน');
      if (q.sharpness < 8) throw new Error('ภาพไม่ชัด กรุณาถือนิ่งและลองใหม่');

      /* 2) Active Liveness ด้วย Landmark เท่านั้น — ไม่แตะ Recognition Model */
      if (onTick) onTick('โหมดสำรองเข้ากันได้ — กรุณากระพริบตา 1 ครั้ง');
      return blinkChallenge(function (t) { if (onTick) onTick(t); }, live, ms, input,
        dlAll ? Math.max(1000, Math.min(15000, dlAll - Date.now())) : 15000);
    }).then(function (ok) {
      chk();
      if (!ok) throw faceErr('FACE_LIVENESS_FAIL', 'ตรวจสอบบุคคลจริงไม่ผ่าน กรุณากระพริบตาแล้วลองใหม่');

      /* 3) Liveness ผ่านแล้วค่อยโหลด Recognition 6.44 MB — ไม่แข่งกับ Guide Detection */
      if (onTick) onTick('กำลังเทียบใบหน้ากับข้อมูลที่ลงทะเบียน…');
      return recogLoad();
    }).then(function () {
      chk();
      /* [FACE POSITION GATE] ระหว่างรอ Recognition 6.44 MB ผู้ใช้อาจขยับออกนอกกรอบ
         รอด้วย Guide Detection ที่ราคาถูกก่อน แล้วจึงเรียก detect() สร้าง Descriptor
         [RUN-213] ตรวจตำแหน่งของ "เฟรมที่ใช้สร้าง Descriptor จริง" ด้วย — ไม่อยู่ในกรอบ = รอแล้วถ่ายใหม่
         ภายในเพดานเวลาเดียวกัน (ปกติยังสร้าง Descriptor ครั้งเดียวเหมือนเดิม) */
      var dlShot = Math.min(Date.now() + FACE_POS_WAIT_MS, dlAll || Infinity);
      return (function shot() {
        return waitFaceCenter(function () { return detectGuide(ms, input); }, onTick, live, dlShot)
          .then(function () {
            chk();
            return frameFresh(live, dlShot, true); // Descriptor ต้องมาจากเฟรมที่มาถึงหลังจุดนี้
          }).then(function () {
            chk();
            return detect(ms, input);
          }).then(function (r) {
            chk();
            if (attFacePosGateOn() && r && r.length === 1) {
              var ps = facePosInFrame(r[0].detection.box);
              if (!(ps.ready && ps.inside)) {
                if (Date.now() >= dlShot) throw faceErr('FACE_POSITION_TIMEOUT', 'หมดเวลาจัดตำแหน่งใบหน้า กรุณาลองใหม่');
                if (onTick) onTick(facePosMsg(ps), undefined, 'ADJUST');
                return shot();
              }
            }
            return r;
          });
      })();
    }).then(function (r) {
      chk();
      if (!r || r.length !== 1) {
        if (r && r.length > 1) throw new Error('พบมากกว่า 1 ใบหน้า — ให้มีเพียงคนเดียวในกล้อง');
        throw new Error('ไม่พบใบหน้า — จัดใบหน้าให้อยู่ในกรอบ');
      }
      var f0 = r[0], q = frameQuality(f0.detection.box);
      if (!f0.descriptor) throw new Error('สร้างข้อมูลใบหน้าไม่สำเร็จ กรุณาลองใหม่');
      if (!q || q.ratio < 0.035) throw new Error('กรุณาจัดใบหน้าให้อยู่ในกรอบและเข้าใกล้กล้องขึ้น');
      return {
        frames: [{ box: f0.detection.box, desc: Array.from(f0.descriptor), q: q,
                   ear: eyeOpen(f0.landmarks), yaw: yaw(f0.landmarks) }],
        live: { pass: true, score: 1, method: 'BLINK' },
        lite: true
      };
    });
  }

  /* ---------- Snapshot ---------- */
  /* ---------- [RUN-214] นาฬิกาเฟรมกล้อง: เฟรมนี้เป็น "ภาพใหม่จริง" หรือไม่ ----------
     requestVideoFrameCallback (ถ้ามีและพิสูจน์แล้วว่ายิงจริง) = ตัวตัดสินหลัก
     Fallback = video.currentTime (ถือว่าเชื่อได้เมื่อเห็นค่าเปลี่ยนจริงแล้วเท่านั้น)
     ยังพิสูจน์กลไกไม่ได้ = sure:false -> ไม่ใช้เป็น Gate (พฤติกรรมเดิม) ไม่ตัดสินว่ากล้องค้างจากการเดา */
  var FR = { v: null, n: 0, ok: false, ct: -1, c: 0 };
  function frameWatch() {
    var v = S.video;
    if (!v || FR.v === v) return;
    var mineF = FR = { v: v, n: 0, ok: false, ct: -1, c: 0 };
    if (typeof v.requestVideoFrameCallback !== 'function') return;
    (function arm() {
      try {
        v.requestVideoFrameCallback(function () {
          if (FR !== mineF) return;            // <video> ของรอบก่อน = เลิกติดตาม
          mineF.n++; mineF.ok = true; mineF.t = Date.now();
          arm();
        });
      } catch (e) {}
    })();
  }
  /* [RUN-216] เฟรมใหม่ต้อง "พิสูจน์ได้" เสมอ — ไม่มีทางผ่านโดยอัตโนมัติอีกต่อไป (เดิม sure:false = ผ่าน)
       1) requestVideoFrameCallback (ยิงจริงแล้ว)                      -> เลขเฟรม
       2) getVideoPlaybackQuality().totalVideoFrames / webkitDecodedFrameCount (เห็นค่าขยับจริงแล้ว) -> ตัวนับเฟรมที่ถอดรหัส
       3) ลายเซ็นพิกเซล 32x32 กลางภาพของเฟรมปัจจุบัน                   -> ภาพเปลี่ยน = เฟรมใหม่ (ภาพค้าง = ค่าเดิม)
     ไม่มีวิดีโอ/อ่านไม่ได้ = sure:false = "ยังไม่มีเฟรมใหม่" (รอ จนกว่าจะพิสูจน์ได้ หรือหมดเวลา) */
  function framePixSig(v) {
    try {
      var c = FR.pc || (FR.pc = d.createElement('canvas'));
      if (c.width !== 32) { c.width = 32; c.height = 32; }
      var g = FR.pg || (FR.pg = c.getContext('2d', { willReadFrequently: true }));
      var vw = v.videoWidth, vh = v.videoHeight;
      g.drawImage(v, Math.max(0, (vw >> 1) - 16), Math.max(0, (vh >> 1) - 16), 32, 32, 0, 0, 32, 32);
      var a = g.getImageData(0, 0, 32, 32).data, h = 2166136261;
      for (var i = 0; i < a.length; i += 3) { h ^= a[i]; h = (h * 16777619) >>> 0; }
      return h;
    } catch (e) { return null; }
  }
  function frameSeq() {
    var v = S.video;
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    frameWatch();
    if (FR.ok) return { seq: 'f' + FR.n, sure: true };
    var q = null;
    try {
      if (typeof v.getVideoPlaybackQuality === 'function') q = v.getVideoPlaybackQuality().totalVideoFrames;
      else if (typeof v.webkitDecodedFrameCount === 'number') q = v.webkitDecodedFrameCount;
    } catch (e) { q = null; }
    if (typeof q === 'number' && q > 0) {
      if (FR.q != null && q !== FR.q) FR.qOk = true;
      FR.q = q;
      if (FR.qOk) return { seq: 'q' + q, sure: true };
    }
    var sig = framePixSig(v);
    if (sig != null) return { seq: 'p' + sig, sure: true };
    return { seq: '', sure: false };
  }
  function camKick() {
    try {
      var v = S.video;
      if (!v || !S.stream) return;
      if (v.srcObject !== S.stream) v.srcObject = S.stream;
      var p = v.play();
      if (p && typeof p['catch'] === 'function') p['catch'](function () {});
    } catch (e) {}
  }
  /* รอ "เฟรมใหม่จริง" ก่อนเรียก Detector / ถ่ายรูปหลักฐาน — ใช้ร่วมกัน Normal Flow (รูปหลักฐาน) · Android Lite · Blink
     ลำดับตรวจทุกรอบ: ยกเลิก -> Deadline -> เฟรม   (หมดเวลาแล้ว = ไม่ผ่าน แม้เพิ่งมีเฟรมใหม่)
     กล้องเงียบ: 1.5s play() Stream เดิม -> 3s เปิดกล้องใหม่ในรอบเดิม 1 ครั้ง (ตัวเดียวกับ Normal Flow) -> 6s CAM_FRAME_STALLED
     fromNow = ต้องเป็นเฟรมที่มาถึง "หลังจากนี้" (ก่อน Descriptor / รูปหลักฐาน) */
  function frameFresh(live, deadline, fromNow) {
    return new Promise(function (res, rej) {
      var t0 = Date.now(), kicked = false, restarting = false;
      if (fromNow) { var f0 = frameSeq(); FR.last = (f0 && f0.sure) ? f0.seq : '\u0000'; }
      (function wait() {
        if (live && !live()) return rej(AbortAttendanceError());
        var now = Date.now();
        if (deadline && now > deadline) return rej(faceErr('CAM_FRAME_STALLED', 'กล้องยังไม่ส่งภาพใหม่ภายในเวลาที่กำหนด กรุณาลองใหม่อีกครั้ง'));
        if (restarting) return void requestAnimationFrame(wait);
        var fq = frameSeq();
        if (fq && fq.sure && fq.seq !== FR.last) { FR.last = fq.seq; return res(true); }
        if (INF.visAt > t0) t0 = now;                       // กลับจากพักจอ = เริ่มจับเวลาใหม่
        if (now - t0 > FRAME_DEAD_MS) return rej(faceErr('CAM_FRAME_STALLED', 'กล้องหยุดส่งภาพ กรุณาลองใหม่อีกครั้ง'));
        if (!kicked && now - t0 > FRAME_STALL_MS) { kicked = true; camKick(); try { perfBootCount('camera_frame_stall'); } catch (e) {} }
        if (now - t0 > FRAME_RESTART_MS && typeof S.attCamRestart === 'function' && !S.attCamRestartUsed) {
          S.attCamRestartUsed = true; restarting = true;
          S.attCamRestart().then(function () { restarting = false; t0 = Date.now(); FR.last = '\u0000'; },
                                 function () { restarting = false; });
        }
        requestAnimationFrame(wait);
      })();
    });
  }
  var FRAME_STALL_MS = 1500;   // ไม่มีเฟรมใหม่นานเท่านี้ = พัก AI + สั่ง play() กับ Stream เดิม
  var FRAME_RESTART_MS = 3000; // play() ไม่ช่วย = เปิดกล้องใหม่ในรอบสแกนเดิม 1 ครั้ง
  var FRAME_DEAD_MS = 6000;    // ยังไม่มีเฟรมใหม่ = จบรอบพร้อมสาเหตุ (ลองใหม่ = เปิดกล้องใหม่อย่างปลอดภัย)
  var SNAPSHOT_TIMEOUT_MS = 4000;

  /* [RUN-214] opt (เฉพาะจอสแกนลงเวลา): { own:true, ms }
       own = Canvas ชั่วคราวของรอบนี้เอง (ไม่ใช้ S.canvas ร่วมกับรอบอื่น) · คืนหน่วยความจำหลังใช้
       ms  = เพดานเวลา toBlob · เกิน = reject FACE_SNAPSHOT_TIMEOUT (เดิมค้างไม่มีกำหนด)
       Video ไม่พร้อมจริง = ไม่ถ่าย (เดิมวาดภาพดำ 640x480)
     ไม่ส่ง opt = พฤติกรรมเดิมทุกประการ (ลงทะเบียนใบหน้า) */
  function snapshotBlob(opt) {
    var tEnc = perfNow();
    var own = !!(opt && opt.own), ms = (opt && Number(opt.ms) > 0) ? Number(opt.ms) : 0;
    return new Promise(function (res, rej) {
      var done = false, timer = 0, c = null;
      function fin(b, err) {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        perfMark('snapshot_encode_ms', tEnc);
        perfSet('snapshot_bytes', b ? b.size : 0);
        if (own && c) { try { c.width = 0; c.height = 0; } catch (e0) {} }
        if (err) rej(err); else res(b || null);
      }
      var v = S.video;
      if (own && !(v && v.videoWidth > 0 && v.videoHeight > 0 && (v.readyState || 0) >= VIDEO_READY_STATE_MIN)) {
        return fin(null);
      }
      c = own ? d.createElement('canvas') : S.canvas;
      var vw = S.video.videoWidth || 640, vh = S.video.videoHeight || 480;
      var scale = Math.min(1, 480 / Math.max(vw, vh));
      c.width = Math.round(vw * scale); c.height = Math.round(vh * scale);
      c.getContext('2d').drawImage(S.video, 0, 0, c.width, c.height);
      if (ms) {
        timer = setTimeout(function () {
          perfSet('snapshot_timeout', 1);
          fin(null, faceErr('FACE_SNAPSHOT_TIMEOUT', 'สร้างรูปหลักฐานไม่สำเร็จ กรุณาลองใหม่'));
        }, ms);
      }
      c.toBlob(function (b) { fin(b); }, 'image/jpeg', 0.82);
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
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ', true)
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
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ', true)
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
    /* [STEP-0B ข้อ 12] ชื่อเดิม gps_retry_count กว้างเกินจริง — นี่คือ "Geofence retry"
       เท่านั้น (Fix เปลี่ยนขณะ RPC ค้าง) ไม่ใช่ GPS acquisition retry */
      perfBootCount('gf_retry_count');
      perfEvent('gf_rpc_queued', { reason: 'fix_changed_while_inflight' });
      return GF.inflight['catch'](function () { return null; }).then(function () {
        if (myGen !== GF.gen || mySid !== G.sid) return null;   // Session/Generation เปลี่ยน
        var c2 = force ? null : gfCacheValid(fix);
        if (c2) { perfBootCount('gf_cache_hits'); return c2; }
        return gfCheck(fix, force);                            // ยิงใหม่ด้วย Fix ปัจจุบัน
      });
    }
    var t0 = perfNow();
    perfBootCount('njhr_gf_check_calls');                      // นับก่อนยิงจริง
    perfBootCount('gf_rpc_count');
    var __rseq = (PERF.rpcN = (PERF.rpcN || 0) + 1);
    perfEvent('gf_rpc_start', { rpc_seq: __rseq, fix_seq: (fix.__pseq == null ? null : fix.__pseq),
                                accuracy: Math.round(fix.accuracy) });
    /* [ข้อ 13] sent_to_rpc แยกจาก selected_as_current เด็ดขาด */
    perfGpsTag(fix.__pseq, { sent_to_rpc: true });
    GF.inflightSid = mySid; GF.inflightKey = k; GF.inflightGen = myGen;
    GF.inflight = rpcRows('njhr_gf_check', {
      p_token: token(), p_lat: fix.lat, p_lng: fix.lng, p_accuracy: fix.accuracy
    }).then(function (rows) {
      GF.inflight = null; GF.inflightKey = ''; GF.at = Date.now();
      var r = (rows && rows.length) ? rows[0] : null;
      perfRpcEnd(__rseq, t0, fix, (r ? (r.pass === true ? 'PASS' : 'FAIL') : 'NULL'), null);
      if (myGen !== GF.gen) {                                  // Generation เปลี่ยน = ทิ้งผล
        perfEvent('gf_rpc_dropped', { rpc_seq: __rseq, reason: 'generation' });
        return null;
      }
      if (mySid !== G.sid) {                                   // Session เปลี่ยน = ทิ้งผล
        perfEvent('gf_rpc_dropped', { rpc_seq: __rseq, reason: 'session' });
        return null;
      }
      perfDur('gps_preflight_ms', t0);   /* [STEP-0B ข้อ 9] ลง boot ด้วย ไม่ผูกกับ Face Flow */
      GF.key = k; GF.sid = mySid; GF.err = ''; GF.sess = false;
      /* [GPS] Fix แรกของ Session นี้ที่ผ่านการตรวจของเซิร์ฟเวอร์จริง (pass=true)
         แยกจาก gps_first_fix_ms ซึ่งเป็น Fix แรกที่อ่านได้เฉย ๆ
         ไม่ hardcode max_accuracy ฝั่ง Client — ใช้คำตอบจริงจาก njhr_gf_check */
      /* [STEP-0C ROOT CAUSE #3] เดิมใช้ Math.max(0, fix.at - G.startedAt)
         G.startedAt ตั้งตอน face.js โหลด ซึ่งช้ากว่า GPS Bootstrap เสมอ → ติดลบ → Clamp เป็น 0 หลอก
         ของใหม่ใช้ฐานเดียวกับ gps_first_fix_ms คือ GPS Bootstrap Start จริง */
      if (r && r.pass === true && PERF.boot.marks.gps_usable_fix_ms == null) {
        perfBootSet('gps_usable_fix_ms', perfGpsDelta(fix.at || Date.now()));
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
      /* [STEP-0B ข้อ 10] เส้นทาง Error ต้องปิด timing เสมอ ไม่งั้น Baseline ไม่ครบ */
      perfRpcEnd(__rseq, t0, fix, 'ERROR', (e && e.message) ? String(e.message).slice(0, 120) : 'error');
      GF.err = (e && e.message) || 'ตรวจพื้นที่ลงเวลาไม่สำเร็จ';
      GF.sess = sessGone(e);                    // [RUN-221 · P1] เซิร์ฟเวอร์ยืนยันว่า Session หมดอายุ (ไม่ใช่ผลตรวจพื้นที่)
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
    if (PERF.boot.marks.gps_preflight_start_ms == null) {
      perfBootSet('gps_preflight_start_ms', Math.round(perfNow() * 10) / 10);
    }
    perfEvent('gps_preflight_start', { force: force === true });
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
      if (!r && GF.sess) {
        /* [RUN-221 · P1] Session หมดอายุ ≠ GPS ไม่ผ่าน: ไม่คืนผลเป็น "ตรวจพื้นที่ไม่ผ่าน" · พาไปเข้าระบบใหม่ครั้งเดียว */
        sessLogout();
        return { stage: 'SESSION', pass: false, session: true, reason: MSG_SESSION };
      }
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
    /* [STEP-0B ข้อ 3] gps_boot_start_ms มาจาก attGpsBootStart() เท่านั้น
       ที่นี่คือตอน watcher ของ face.js เริ่ม ซึ่งเกิดทีหลัง — บันทึกเป็นเหตุการณ์แยก */
    perfEvent('gps_watch_start');
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
      /* [STEP-0B] ตั้งค่าเฉพาะเมื่อยังไม่มีใครตั้ง — Bootstrap/Seed มาก่อนเสมอ
         ฐานเวลาใช้ gps_boot_start จริงถ้ามี · ไม่มีจึงถอยไปใช้ G.startedAt · ไม่ Clamp */
      if (perfOn() && PERF.boot.marks.gps_first_fix_ms == null) {
        perfBootSet('gps_first_fix_ms', perfGpsDelta(at));
      }
      if (perfOn()) {
        perfBootCount('gps_fix_count');
        fx.__pseq = perfGpsFix(fx);
        perfEvent('gps_fix', { seq: fx.__pseq, accuracy: Math.round(fx.accuracy) });
      }
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
    /* [STEP-0B ข้อ 13] จุดนี้คือ "Selection จริง" — ไม่ใช่ตอนส่ง RPC
       ตรรกะการเลือกไม่เปลี่ยนแม้แต่บรรทัดเดียว เพิ่มเฉพาะการบันทึก */
    if (perfOn() && best && best.__pseq != null && PERF.curSeq !== best.__pseq) {
      PERF.selN = (PERF.selN || 0) + 1;
      PERF.curSeq = best.__pseq;
      perfGpsTag(best.__pseq, { selected_as_current: true, selected_seq: PERF.selN });
      perfEvent('gps_fix_selected', { seq: best.__pseq, order: PERF.selN });
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
  function shell(title, sub, mode) {
    addCss();
    var el = d.createElement('div');
    el.className = 'njf-overlay';
    /* [RUN-212] จอสแกนใบหน้าเพื่อลงเวลา (mode === 'att') ใช้ Markup ชุดใหม่แยกขาด:
       กรอบสี่เหลี่ยมคงที่ 4 มุมชุดเดียว + แถบ Progress ใต้ภาพกล้อง
       ไม่มี .njf-oval / .njf-ring / .njf-turn / .njf-ok ใน DOM เลย (ไม่ใช่ซ่อนด้วย CSS)
       โหมดอื่น (ตรวจตำแหน่ง · ลงทะเบียนใบหน้า · Face Login) ใช้ Markup เดิมด้านล่างทุกตัวอักษร */
    if (mode === 'att') {
      el.setAttribute('data-att-scan', '1');
      el.setAttribute('data-att-layout', attLayoutWant(''));   // [RUN-213] Layout กำหนดโดย JS จุดเดียว
      el.innerHTML =
        '<div class="njf-top"><button class="njf-back" id="njf-x" aria-label="ปิด">&#10005;</button>' +
        '<div><b>' + esc(title) + '</b><small>' + esc(sub || 'NJL HR') + '</small></div></div>' +
        '<div class="njf-cam"><video id="njf-v" muted playsinline></video><canvas id="njf-c"></canvas>' +
        /* [RUN-213] ป้ายสถานะเมื่อยังไม่มีภาพกล้อง (รอ GPS · เตรียมกล้อง · กำลังบันทึก) — อยู่ใต้กรอบ */
        '<div class="njf-camstate" id="njf-camstate" data-kind="gps" role="status" aria-live="polite">' +
        '<i class="njf-camstate-ic" aria-hidden="true"></i><b id="njf-camstate-t">กำลังตรวจตำแหน่ง GPS…</b></div>' +
        '<div class="njf-guide">' +
        '<div class="njf-frame" id="njf-frame" data-state="wait" aria-hidden="true">' +
        '<span class="njf-corner tl"></span><span class="njf-corner tr"></span>' +
        '<span class="njf-corner bl"></span><span class="njf-corner br"></span></div></div></div>' +
        '<div class="njf-scanbar" id="njf-scanbar" data-state="wait" role="progressbar" ' +
        'aria-label="ความคืบหน้าการสแกนใบหน้า" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>' +
        /* [RUN-213] ข้อความกำกับย้ายออกมาอยู่ "ใต้ภาพกล้อง" — ไม่ทับใบหน้า (id เดิม hint() ใช้ได้เหมือนเดิม) */
        '<div class="njf-capt"><b id="njf-h1">มองกล้องให้อยู่ในกรอบ</b>' +
        '<small id="njf-h2">กรุณาอย่าขยับใบหน้า</small></div>' +
        '<div class="njf-panel" id="njf-panel"></div>';
      d.body.appendChild(el);
      S.root = el;
      S.video = el.querySelector('#njf-v');
      S.canvas = el.querySelector('#njf-c');
      el.querySelector('#njf-x').onclick = function () { camLifeLog('USER_CANCEL_CLOSE'); close('USER_CANCEL_CLOSE'); };
      /* ล็อกขนาดหลัง face.css พร้อม (ครั้งแรกที่เปิด CSS อาจยังโหลดไม่เสร็จ) และซ้ำอีกครั้งก่อนเริ่มสแกน */
      attCamLock(true);
      try {
        (S.cssP || Promise.resolve()).then(function () {
          if (S.root === el) { attCamLock(true); setTimeout(function () { if (S.root === el) attCamLock(true); }, 60); }
        }, function () {});
      } catch (eCss) {}
      return el;
    }
    /* [RUN-225 · local384] Face Login · ลงทะเบียนใบหน้า · จอตรวจตำแหน่ง = กรอบสี่เหลี่ยม 4 มุม "ชุดเดียว" + แถบ Progress แนวนอน
       (ต้นแบบ = จอสแกนลงเวลา IN/OUT) — ไม่มี .njf-oval / .njf-ring / มุมตกแต่งชุดเก่า ใน DOM เลย (ไม่ใช่ซ่อนด้วย CSS)
       เป็นงานแสดงผลล้วน: ไม่มี data-att-scan -> ด่านตรวจตำแหน่งใบหน้าของการลงเวลา (attFacePosGateOn) ไม่ทำงานในจอเหล่านี้
       คงเดิม: ลูกศรบอกทิศ (.njf-turn) · เครื่องหมาย ✓ (.njf-ok) · ข้อความกำกับ (.njf-hint #njf-h1/#njf-h2) · Panel · ปุ่ม · Logic ทั้งหมด */
    el.setAttribute('data-face-rect', '1');
    el.innerHTML =
      '<div class="njf-top"><button class="njf-back" id="njf-x" aria-label="ปิด">&#10005;</button>' +
      '<div><b>' + esc(title) + '</b><small>' + esc(sub || 'NJL HR') + '</small></div></div>' +
      '<div class="njf-cam"><video id="njf-v" muted playsinline></video><canvas id="njf-c"></canvas>' +
      '<div class="njf-guide">' +
      '<div class="njf-frame" id="njf-frame" data-state="wait" aria-hidden="true">' +
      '<span class="njf-corner tl"></span><span class="njf-corner tr"></span>' +
      '<span class="njf-corner bl"></span><span class="njf-corner br"></span></div>' +
      /* ลูกศรบอกทิศ — แสดงเฉพาะมุมซ้าย/ขวา · ✓ กลางกรอบเมื่อผ่าน */
      '<div class="njf-turn" id="njf-turn" aria-hidden="true"></div>' +
      '<div class="njf-ok" id="njf-ok" aria-hidden="true">&#10003;</div>' +
      '<div class="njf-hint"><b id="njf-h1">มองกล้องให้อยู่ในกรอบ</b>' +
      '<small id="njf-h2">กรุณาอย่าขยับใบหน้า</small></div></div></div>' +
      '<div class="njf-scanbar" id="njf-scanbar" data-state="wait" role="progressbar" ' +
      'aria-label="ความคืบหน้าการสแกนใบหน้า" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>' +
      '<div class="njf-panel" id="njf-panel"></div>';
    d.body.appendChild(el);
    S.root = el;
    S.video = el.querySelector('#njf-v');
    S.canvas = el.querySelector('#njf-c');
    el.querySelector('#njf-x').onclick = function () { camLifeLog('USER_CANCEL_CLOSE'); close('USER_CANCEL_CLOSE'); };
    rectLock(el);
    try {
      (S.cssP || Promise.resolve()).then(function () {
        if (S.root === el) { rectLock(el); setTimeout(function () { if (S.root === el) rectLock(el); }, 60); }
      }, function () {});
      if (typeof w.ResizeObserver === 'function') {      // กล่องกล้องเปลี่ยนขนาด (ข้อความใน Panel ยาวขึ้น · หมุนจอ) = ปรับกรอบให้พอดีเสมอ
        var ro = new w.ResizeObserver(function () { if (S.root === el) rectLock(el); else { try { ro.disconnect(); } catch (eD) {} } });
        ro.observe(el.querySelector('.njf-cam'));
      }
    } catch (eCss2) {}
    return el;
  }
  /* [RUN-225 · local384] ขนาดกรอบ 4 มุมของจอ Face Login / ลงทะเบียน / ตรวจตำแหน่ง — สูตรเดียวกับจอลงเวลา (attCamLock)
     กว้าง = น้อยสุดของ (66% ของความกว้างกล่องกล้อง , 80% ของความสูงกล่องกล้อง x 3/4) · สัดส่วน 3:4 · กึ่งกลางกล่องกล้อง (CSS)
     -> กรอบไม่ใหญ่เกินพื้นที่กล้องทุกขนาดจอ · เป็นงาน Layout ล้วน ไม่แตะ <video>/<canvas>/Detector */
  function rectLock(root) {
    try {
      root = root || S.root;
      if (!root || root.getAttribute('data-face-rect') !== '1') return false;
      var cam = root.querySelector('.njf-cam'), fr = root.querySelector('#njf-frame');
      if (!cam || !fr) return false;
      var cb = cam.getBoundingClientRect();
      if (!(cb.width > 40) || !(cb.height > 40)) return false;
      var fw = Math.floor(Math.min(cb.width * 0.66, cb.height * 0.80 * 0.75));
      if (fr.getAttribute('data-fw') === String(fw)) return true;
      fr.setAttribute('data-fw', String(fw));
      fr.style.width = fw + 'px';
      fr.style.height = Math.round(fw * 4 / 3) + 'px';
      fr.style.maxHeight = 'none';
      return true;
    } catch (e) { return false; }
  }
  try {
    w.addEventListener('resize', function () { rectLock(); });
    w.addEventListener('orientationchange', function () { setTimeout(function () { rectLock(); }, 250); });
  } catch (eRl) {}
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
    closeCam('HANDOFF');
    attAbortAll();                            // [ข้อ 4] Network ของขั้นลงทะเบียนต้องไม่ค้าง
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.root = null; S.busy = false;
    /* คง S.mode = 'ATTENDANCE' และ OP.id เดิมไว้ */
  }

  function close(reason) {
    /* [RUN-213] เซิร์ฟเวอร์ยืนยันบันทึกเวลาแล้ว (S.attDone ถูกตั้งไว้) และผู้ใช้เป็นคนปิดจอเอง
       (X ระหว่างกรอบเขียว 300ms · X บนหน้าผล · ปุ่มเสร็จสิ้น) -> แจ้งหน้าลงเวลาให้อัปเดต "ครั้งเดียว"
       เดิม: X = ไม่เรียก onDone หน้าลงเวลาจึงยังแสดงข้อมูลเก่า
       ปิดเพราะเปลี่ยน Route/Logout/pagehide = ไม่เรียก (หน้าใหม่โหลดข้อมูลเองอยู่แล้ว ไม่วาดทับหน้าอื่น) */
    var doneFn = S.attDone; S.attDone = null;
    var doneNow = !!doneFn && (reason === 'USER_CANCEL_CLOSE' || reason === 'DONE');
    /* [RUN-222] รอบสแกนที่ยังไม่จบถูกปิดด้วยการปิดจอ (X · ยกเลิก · เปลี่ยนหน้า · ออกจากระบบ)
       ยังไม่ได้ส่งคำสั่งบันทึก = CANCELLED · ส่งคำสั่งบันทึกไปแล้ว = UNKNOWN (ห้ามนับเป็น OK หรือ FAIL) — บันทึก Log อย่างเดียว */
    try {
      var evC = TEL.cur;
      if (evC && !evC.done) {
        telEnd(evC, evC.sent ? 'UNKNOWN' : 'CANCELLED', telOpen(evC, evC.sent ? 'CLOSED_AFTER_SEND' : 'CLOSED', telClean(reason || 'CLOSE', 40)));
      }
    } catch (eTc) {}
    closeCam(reason);                         // ปิดกล้อง + cancelAnimationFrame (ดู closeCam)
    G.sid++;                                  // Attempt (GPS) ปัจจุบันหมดสิทธิ์ทันที
    opInvalidate();                           // Attendance Operation หมดอายุทันที
    lockRelease();                            // [RUN-219] ปล่อยล็อกข้ามแท็บ (ไม่เกี่ยวกับรายการค้าง)
    LG.id++;                                  // [RUN-219] Face Login รอบที่ค้างอยู่หมดสิทธิ์แตะ State
    enInvalidate();                           // Enrollment Run ปัจจุบันหมดสิทธิ์
    FLOW.kind = ''; FLOW.op = -1; FLOW.carry = null;
    S.attCamRestart = null;             // [ข้อ 5] ปิดหน้าจอ = จบ Punch Flow · Retry นับใหม่
    attAbortAll();                            // [ข้อ 4] ยกเลิก Network ของ Attempt นี้ทั้งหมด
    gpsStop();                                // ปิด watchPosition ทุกกรณีที่ปิดหน้าจอ
    /* [GPS WARMUP] ถ้าหน้าลงเวลาเปิด Warmup ไว้ ให้กลับไปอุ่นต่อหลังปิดจอสแกน
       เพื่อให้กดลงเวลาครั้งถัดไป GPS ยังพร้อมอยู่ ไม่ต้อง Cold Start ใหม่
       ปิดหน้า/ออกจาก Route จริง ๆ จะถูกหยุดด้วย NJHRFace.gpsWarmStop() จากฝั่งหน้าจอ */
    if (GPS_WARM_WANTED) { try { gpsWarmStart(); } catch (e3) {} }
    S.mode = '';
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.root = null; S.busy = false;
    if (doneNow) { try { doneFn(); } catch (eDone) {} }
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
  var LG = { id: 0 };                          // [RUN-219] รอบของ Face Login (กัน Callback รอบเก่าแตะ S.busy / ปิดหน้าจอของรอบใหม่)
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

  /* ---------- [RUN-219] ล็อกข้ามแท็บ (ต่อรหัสพนักงาน) ----------
     Web Locks API (ถือไว้ตลอด Operation · แท็บปิด/พัง = เบราว์เซอร์ปล่อยให้เอง ไม่มีล็อกค้าง)
     ไม่มี Web Locks: สัญญาเช่าใน localStorage (ต่ออายุทุก 2s · หมดอายุ 8s = แท็บที่พังไม่ทำให้ล็อกค้างถาวร)
     ปล่อยล็อก ≠ ล้างรายการค้าง · ด่านหลักกันบันทึกซ้ำข้ามอุปกรณ์ยังเป็นเซิร์ฟเวอร์ (ล็อกรายคน + Request ID) */
  var LOCK = { seq: 0, mode: '', rel: null, emp: '', hb: 0, op: -1,
               tab: (function () { try { return attReqId(); } catch (e) { return String(Math.random()); } })() };
  var LOCK_LEASE_MS = 8000, LOCK_BEAT_MS = 2000;
  function lockKey(emp) { return 'njhr_att_lock_v1:' + emp; }
  function leaseRead(emp) { try { return JSON.parse(localStorage.getItem(lockKey(emp)) || 'null'); } catch (e) { return undefined; } }
  function leaseWrite(emp) { try { localStorage.setItem(lockKey(emp), JSON.stringify({ tab: LOCK.tab, exp: Date.now() + LOCK_LEASE_MS })); return true; } catch (e) { return false; } }
  function lockRelease() {
    LOCK.seq++;
    var m = LOCK.mode, emp = LOCK.emp, rel = LOCK.rel;
    LOCK.mode = ''; LOCK.rel = null; LOCK.emp = ''; LOCK.op = -1;
    if (LOCK.hb) { clearInterval(LOCK.hb); LOCK.hb = 0; }
    if (m === 'wl' && rel) { try { rel(); } catch (e) {} }
    if (m === 'lease') { try { var j = leaseRead(emp); if (j && j.tab === LOCK.tab) localStorage.removeItem(lockKey(emp)); } catch (e2) {} }
  }
  function lockDrop(op) { if (LOCK.op === -1 || LOCK.op === op) lockRelease(); }
  /* ยังถือล็อกอยู่จริงหรือไม่ — ตรวจก่อนส่งคำสั่งบันทึกทุกครั้ง (สัญญาเช่าหมดอายุขณะแท็บถูกพัก แล้วแท็บอื่นรับไป = ไม่ส่ง) */
  function lockMine() {
    if (LOCK.mode === 'wl' || LOCK.mode === 'none') return true;
    if (LOCK.mode !== 'lease') return false;
    var j = leaseRead(LOCK.emp);
    if (j === undefined) return true;                                   // อ่าน localStorage ไม่ได้ = ประสานงานไม่ได้ (เซิร์ฟเวอร์เป็นด่านหลัก)
    if (j && j.tab !== LOCK.tab && j.exp > Date.now()) return false;
    return leaseWrite(LOCK.emp) || true;
  }
  function lockLease(emp, my) {
    return new Promise(function (res) {
      if (my !== LOCK.seq) return res(false);
      var j = leaseRead(emp);
      if (j === undefined) { LOCK.mode = 'none'; LOCK.emp = emp; return res(true); }
      if (j && j.tab !== LOCK.tab && j.exp > Date.now()) return res(false);
      if (!leaseWrite(emp)) { LOCK.mode = 'none'; LOCK.emp = emp; return res(true); }
      /* สองแท็บเขียนพร้อมกัน: รอสั้น ๆ แล้วอ่านกลับ — ผู้เขียนคนสุดท้ายเป็นเจ้าของ อีกแท็บถอย */
      setTimeout(function () {
        if (my !== LOCK.seq) return res(false);
        var k = leaseRead(emp);
        if (!k || k.tab !== LOCK.tab) return res(false);
        LOCK.mode = 'lease'; LOCK.emp = emp;
        LOCK.hb = setInterval(function () {
          var c = leaseRead(emp);
          if (c && c.tab !== LOCK.tab && c.exp > Date.now()) return;      // เสียสิทธิ์ไปแล้ว: ไม่เขียนทับ (lockMine() จะตอบ false)
          leaseWrite(emp);
        }, LOCK_BEAT_MS);
        res(true);
      }, 140 + Math.floor(Math.random() * 80));
    });
  }
  function lockAcquire(emp) {
    lockRelease();
    var my = LOCK.seq;
    if (!emp) { LOCK.mode = 'none'; return Promise.resolve(true); }
    var L = null;
    try { L = w.navigator && w.navigator.locks; } catch (e) { L = null; }
    if (!L || typeof L.request !== 'function') return lockLease(emp, my);
    /* ขอแบบ ifAvailable: ไม่ได้ = ลองซ้ำสั้น ๆ อีก 2 ครั้ง (ล็อกของรอบก่อนในแท็บเดียวกันอาจยังปล่อยไม่เสร็จ) แล้วจึงสรุปว่าแท็บอื่นถืออยู่ */
    function attempt(n) {
      return new Promise(function (res) {
        var settled = false;
        function done(v) { if (settled) return; settled = true; clearTimeout(tm); res(v); }
        var tm = setTimeout(function () { done('lease'); }, 1500);
        try {
          L.request('njhr_att_punch:' + emp, { ifAvailable: true }, function (lk) {
            if (!lk) { done(false); return undefined; }
            if (settled || my !== LOCK.seq) { done(false); return undefined; }   // มาช้า/รอบนี้ถูกยกเลิกแล้ว = ปล่อยทันที
            return new Promise(function (rel) { LOCK.mode = 'wl'; LOCK.emp = emp; LOCK.rel = rel; done(true); });
          })['catch'](function () { done('lease'); });
        } catch (e2) { done('lease'); }
      }).then(function (v) {
        if (v === 'lease') return lockLease(emp, my);
        if (v || my !== LOCK.seq || n >= 3) return v;
        return new Promise(function (r2) { setTimeout(r2, 200); }).then(function () { return my !== LOCK.seq ? false : attempt(n + 1); });
      });
    }
    return attempt(1);
  }

  var PEND_AGAIN = 0;                          // ทอดที่เท่าไรของการ "ตรวจรายการค้างแล้วเริ่มใหม่เอง" (กันวนเอง)
  function punch(kind, onDone, inheritOp, pendChecked) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;
    if (!pendChecked) { S.flowT0 = Date.now(); S.pendAgain = PEND_AGAIN; PEND_AGAIN = 0; }  // เวลาที่ผู้ใช้กดลงเวลา = จุดเริ่ม Deadline รวม (ไม่ Reset)
    /* [RUN-218] สร้าง Operation "ก่อน" อ่านที่จัดเก็บ — ปิด/ยกเลิก/เปลี่ยนหน้าระหว่างอ่าน = Operation หมดอายุ
       ผลการอ่านที่มาถึงทีหลังจะไม่เปิดหน้าต่าง ไม่เปิดกล้อง ไม่เริ่ม AI */
    if (!pendChecked) {
      var opR = (typeof inheritOp === 'number') ? inheritOp : opStart();
      /* [RUN-219] ตรวจ Operation "ก่อน" แตะ S.busy ทุกครั้ง — งานรอบเก่าที่ตอบกลับทีหลังห้ามปลดล็อก/เปิดหน้าจอของรอบใหม่
         (รอบเก่าถูกปิดด้วย close() ซึ่งคืน S.busy ให้แล้ว)
         ล็อกข้ามแท็บตามรหัสพนักงาน: ได้ล็อกก่อนจึงอ่านรายการค้าง -> สองแท็บไม่มีทาง "ไม่พบรายการค้าง" พร้อมกันแล้วเริ่มธุรกรรมใหม่ทั้งคู่ */
      var empL = currentSessionEmployeeId();
      lockAcquire(empL).then(function (got) {
        if (!opAlive(opR)) { if (got) lockDrop(opR); return null; }
        if (!got) {
          S.busy = false; S.mode = ''; opInvalidate();
          attendanceStatusError(new Error('กำลังลงเวลาอยู่ในแท็บหรือหน้าต่างอื่นของเบราว์เซอร์นี้ กรุณาทำรายการในหน้านั้นให้เสร็จ หรือปิดหน้านั้นก่อน'));
          return null;
        }
        LOCK.op = opR;
        return pendRead();
      }).then(function (rd) {
        if (!rd || !opAlive(opR)) return;
        S.busy = false;
        if (rd.state !== 'NOT_FOUND') return attPendingStandalone(rd, kind, onDone, opR);
        punch(kind, onDone, opR, true);
      }, function () {
        if (!opAlive(opR)) return;
        S.busy = false;
        attPendingStandalone({ state: 'READ_ERROR', list: [], bad: [], complete: false }, kind, onDone, opR);
      });
      return;
    }
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
        if (!opAlive(myOp)) return;                        // ถูกยกเลิกระหว่างรอ = หยุดเงียบ · ไม่แตะ S.busy ของรอบใหม่
        if (has) { S.busy = false; return doPunch(kind, onDone, myOp); }
        S.busy = false;
        enrollThenPunch(kind, onDone, myOp);
      })
      ['catch'](function (e) {
        if (!opAlive(myOp)) return;                        // ถูกยกเลิกระหว่างรอ = ไม่ขึ้น error · ไม่แตะ S.busy ของรอบใหม่
        S.busy = false; S.mode = ''; opInvalidate(); lockRelease();   // จบ Operation นี้ (ไม่มีหน้าจอให้ปิด) = ปล่อยล็อกข้ามแท็บ
        if (sessGone(e)) { sessLogout(); return; }   // [RUN-221 · P1]
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
      if (GF.sess) { close(); sessLogout(true); return; }   // [RUN-221 · P1] Session หมดอายุ = ไปเข้าระบบใหม่ ไม่แสดงเป็น GPS ไม่ผ่าน
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

  /* ---------- [RUN-214] ผลบันทึกเวลา "ไม่ทราบผล" (ส่งถึงเซิร์ฟเวอร์แล้วแต่ไม่ได้คำตอบ) ----------
     เดิม: Timeout/เน็ตหลุดหลังยิง njhr_att_punch_face = ขึ้น "ลองใหม่" ทันที ทั้งที่เซิร์ฟเวอร์อาจบันทึกแล้ว
     ใหม่: ถาม njhr_att_today (RPC เดิมของหน้าลงเวลา · อ่านอย่างเดียว) ก่อนตัดสิน
       บันทึกแล้ว (เวลา check_in/check_out ของรอบนี้) = แสดงสำเร็จตามข้อมูลเซิร์ฟเวอร์ ไม่ยิงซ้ำ
       ยังไม่บันทึก = Error เดิม ลองใหม่ได้ · ถามไม่ได้ = ต้อง "ตรวจสอบอีกครั้ง" ก่อนอนุญาตลองใหม่
     ไม่ข้ามการตรวจฝั่งเซิร์ฟเวอร์ — ความสำเร็จมาจากแถวที่เซิร์ฟเวอร์บันทึกเองเท่านั้น */
  /* [RUN-215] ยืนยันด้วย "รหัสรายการบันทึกของเซิร์ฟเวอร์" (njhr_att_punch_log.id) ไม่ใช่ช่วงเวลา
       ก่อนส่ง : attLogBase() จดรหัสรายการล่าสุดของพนักงานคนนี้ (RPC เดิม njhr_att_punch_history · อ่านอย่างเดียว)
                 จดไม่ได้ = ไม่ส่งคำสั่งบันทึก (ไม่มีทางเกิด "ส่งแล้วแต่ตรวจย้อนไม่ได้")
       หลังส่ง : รายการ "ใหม่" (รหัสไม่อยู่ในชุดก่อนส่ง) ของ พนักงานคนเดิม + ประเภท IN/OUT เดียวกัน = รายการของรอบนี้
                 แล้วเทียบกับ njhr_att_today (วันทำงาน + เวลาเข้า/ออก ตรงกับรายการนั้น) ก่อนแสดงผล
       รายการเก่า (แม้เพิ่งบันทึกเมื่อครู่) มีรหัสอยู่ในชุดก่อนส่งแล้ว -> ไม่มีวันถูกนับเป็นผลของรอบใหม่
       เซิร์ฟเวอร์ (njhr_att_punch) ล็อกรายคน + ปฏิเสธ IN/OUT ซ้ำของวันทำงานเดียวกันอยู่แล้ว = บันทึกซ้ำไม่ได้ */
  function attLogRows(emp) {
    return rpcRows('njhr_att_punch_history', { p_token: token(), p_employee: emp, p_limit: 12 });
  }
  function attLogBase() {
    var emp = currentSessionEmployeeId();
    if (!emp) return Promise.reject(new Error('ไม่พบข้อมูลพนักงานของบัญชีนี้ กรุณาเข้าสู่ระบบใหม่'));
    /* วันทำงานปัจจุบันตามกฎของเซิร์ฟเวอร์ (njhr_att_today) จดไว้คู่กับรายการ — ใช้ปิดสถานะรอตรวจสอบเมื่อเซิร์ฟเวอร์เปลี่ยนรอบวันทำงานแล้วเท่านั้น */
    var wdP = rpc('njhr_att_today', { p_token: token() }).then(function (r) { return (r && r.work_date) ? String(r.work_date) : ''; },
                                                             function () { return ''; });
    return Promise.all([attLogRows(emp), wdP]).then(function (a) {
      var ids = {};
      (a[0] || []).forEach(function (x) { if (x && x.id) ids[String(x.id)] = 1; });
      return { emp: emp, ids: ids, wd: a[1] || '' };
    });
  }
  function attVerifyOnce(kind, base) {
    return attLogRows(base.emp).then(function (rows) {
      var hit = null;
      (rows || []).forEach(function (x) {
        if (hit || !x || !x.id || base.ids[String(x.id)]) return;
        if (String(x.employee_id || '') !== base.emp) return;
        if (String(x.action || '').toUpperCase() !== kind) return;
        hit = x;
      });
      if (!hit) return null;
      var out = { ok: true, verified_after_timeout: true, log_id: String(hit.id), reason: '',
                  work_date: hit.work_date, check_in: kind === 'IN' ? hit.punched_at : null,
                  check_out: kind === 'OUT' ? hit.punched_at : null, status: '', work_hours: null,
                  late_min: 0, geofence_name: hit.geofence_name || '' };
      /* เติมข้อมูลแสดงผลจากแถว attendance จริง — ใช้เฉพาะเมื่อวันทำงานและเวลาตรงกับรายการที่ยืนยันแล้ว */
      return rpc('njhr_att_today', { p_token: token() }).then(function (row) {
        var v = row ? (kind === 'IN' ? row.check_in : row.check_out) : null;
        if (row && String(row.work_date || '') === String(hit.work_date || '') && v &&
            Math.abs(Date.parse(v) - Date.parse(hit.punched_at)) < 2000) {
          out.check_in = row.check_in; out.check_out = row.check_out; out.status = row.status;
          out.work_hours = row.work_hours; out.late_min = row.late_min;
        }
        return out;
      }, function () { return out; });
    });
  }
  /* ---------- [RUN-216] Request ID + สถานะ "ไม่ทราบผล" (PUNCH_UNKNOWN) ----------
     ทุกธุรกรรมลงเวลามี Request ID ของตัวเอง (UUID) และถูกจดลง localStorage "ก่อนส่ง"
     เซิร์ฟเวอร์มี RUN-216 (njhr_att_punch_face2):  ส่ง p_request_id · ถามผลด้วย njhr_att_punch_req_status(request_id)
        = ยืนยันเฉพาะธุรกรรมนี้ของเครื่องนี้ (รายการจากอุปกรณ์อื่นมี request_id อื่น ไม่มีทางถูกนับ) · ส่งซ้ำ id เดิมไม่สร้างรายการใหม่
     เซิร์ฟเวอร์ยังไม่มี RUN-216: ใช้ทางเดิม + ตรวจจากรหัสรายการ (punch_log.id) ก่อน/หลังส่ง
        พบรายการใหม่ = แจ้งว่า "พบรายการในระบบแล้ว" (ไม่อ้างว่าเป็นคำสั่งของเครื่องนี้)
     ส่งแล้วไม่ได้คำตอบ = "รอตรวจสอบผลบันทึก": ไม่มีปุ่มลงเวลาซ้ำ · ไม่สร้างธุรกรรมใหม่จนกว่าจะทราบผล
        ไม่พบรายการ = ยังไม่ทราบผล (ดู RUN-217 ด้านล่าง)
     ปิดหน้าต่าง/โหลดหน้าใหม่/กลับเข้าแอป: รายการที่ค้างถูกตรวจก่อนเสมอเมื่อกดลงเวลาครั้งถัดไป */
  /* [RUN-217]
     - ไม่มีการสรุป "ไม่ได้บันทึก" จากเวลาอีกต่อไป (เลิก 30 วินาที) — ไม่ทราบผล = คงสถานะรอตรวจสอบ
       เซิร์ฟเวอร์มี RUN-216: ถามด้วย Request ID เดิม -> ไม่พบ = สั่ง njhr_att_punch_req_void (ปิดคำขอภายใต้ล็อกเดียวกับการลงเวลา)
           VOID = เซิร์ฟเวอร์ยืนยันว่าไม่ได้บันทึกและจะไม่ถูกบันทึก (คำสั่งเดิมที่มาถึงทีหลังถูกปฏิเสธ) · DONE = บันทึกแล้ว
       เซิร์ฟเวอร์ยังไม่มี RUN-216: ยืนยันรายรายการไม่ได้ -> รอจนพบรายการ หรือจนเซิร์ฟเวอร์เปลี่ยนรอบวันทำงาน
     - ไม่พบ/ไม่มีสิทธิ์เรียก RPC ตรวจสอบ (เช่น ระหว่าง Rollback) = ยังไม่ทราบผล ไม่ใช่ "ไม่ได้บันทึก"
     - รายการค้างจดแยกตามพนักงาน ใน localStorage + IndexedDB (สำรอง) · เขียนแล้วอ่านกลับตรวจ · เขียนไม่ได้ทั้งสองที่ = ไม่ส่งคำสั่งบันทึก
       เก็บเฉพาะ: รหัสคำขอ · IN/OUT · รหัสพนักงาน · เวลา · โหมด · รหัสรายการก่อนส่ง · วันทำงาน  (ไม่มีใบหน้า/รูป/Token)
       ไม่มีการลบตามอายุ — ลบเมื่อทราบผลเท่านั้น */
  var PEND_KEY = 'njhr_att_pending_v2';
  var PEND_DB = 'njhr_att_v1', PEND_STORE = 'pending';
  var REQ_SRV_KEY = 'njhr_att_req_srv_v1';
  var ATT_PENDING_AUTO_MS = 5000;
  var ATT_PENDING_AUTO_MAX = 6;
  var ATT_VOID_AFTER_MS = 15000;                // ไม่พบรายการ: เริ่มสั่งปิดคำขอได้หลังส่งไปแล้วเท่านี้ (ให้คำสั่งเดิมมีโอกาสถึงเซิร์ฟเวอร์ก่อน) — ผลตัดสินมาจากเซิร์ฟเวอร์ ไม่ใช่เวลา
  var REQ_SRV_RECHECK_MS = 10 * 60 * 1000;
  var MSG_PENDING = 'รอตรวจสอบผลบันทึก — ส่งคำสั่งบันทึกเวลาแล้ว แต่ยังไม่ได้รับคำตอบจากเซิร์ฟเวอร์';
  var MSG_STORE = 'อุปกรณ์นี้บันทึกข้อมูลรายการลงเวลาไม่ได้ (พื้นที่จัดเก็บของเบราว์เซอร์เต็ม ถูกปิด หรือเป็นโหมดส่วนตัว) จึงยังไม่ได้ส่งคำสั่งบันทึกเวลา กรุณาแก้ไขแล้วลองใหม่';
  function voidAfterMs() { return Number(w.NJHR_ATT_VOID_AFTER_MS) > 0 ? Number(w.NJHR_ATT_VOID_AFTER_MS) : ATT_VOID_AFTER_MS; }
  function attReqId() {
    try { if (w.crypto && typeof w.crypto.randomUUID === 'function') return w.crypto.randomUUID(); } catch (e) {}
    var b = new Uint8Array(16), i;
    try { w.crypto.getRandomValues(b); } catch (e2) { for (i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = []; for (i = 0; i < 16; i++) h.push((b[i] + 256).toString(16).slice(1));
    return h.slice(0, 4).join('') + '-' + h.slice(4, 6).join('') + '-' + h.slice(6, 8).join('') + '-' +
           h.slice(8, 10).join('') + '-' + h.slice(10).join('');
  }
  function reqSrvState() {                     // 1 = มี face2 · 0 = ยังไม่มี (เพิ่งถาม) · null = ยังไม่รู้ ต้องลอง
    try {
      var j = JSON.parse(localStorage.getItem(REQ_SRV_KEY) || 'null');
      if (!j) return null;
      if (j.v === 1) return 1;
      return (Date.now() - (Number(j.t) || 0) < REQ_SRV_RECHECK_MS) ? 0 : null;
    } catch (e) { return null; }
  }
  function reqSrvSet(v) { try { localStorage.setItem(REQ_SRV_KEY, JSON.stringify({ v: v ? 1 : 0, t: Date.now() })); } catch (e) {} }
  /* เซิร์ฟเวอร์ตอบชัดเจนว่า "ไม่มี function นี้" หรือ "ไม่มีสิทธิ์เรียก" = คำสั่งไม่ได้ถูกประมวลผลแน่นอน */
  function isNoFn(e) {
    if (!e) return false;
    if (e.httpStatus === 404 && (e.pgCode === 'PGRST202' || /could not find the function/i.test(String(e.message || '')))) return true;
    /* 42501 ที่มาจาก "ไม่มีสิทธิ์เรียก function" เท่านั้น — 42501 ที่ฟังก์ชันลงเวลาโยนเอง (เช่น อยู่นอกพื้นที่) คือคำปฏิเสธปกติ */
    return (e.httpStatus === 401 || e.httpStatus === 403) && e.pgCode === '42501' &&
           /permission denied for function/i.test(String(e.pgMsg || ''));
  }
  /* [RUN-218] ที่จัดเก็บรายการค้าง (ต่อ 1 Request ID ไม่ทับกัน — รองรับหลายแท็บ/กดพร้อมกัน)
       localStorage : njhr_att_pending_v2:<emp>:<id>   + สำเนาล่าสุด njhr_att_pending_v2:<emp> (รูปแบบเดียวกับ local376 = ย้อนรุ่นได้)
       IndexedDB    : njhr_att_v1/pending  key <emp>:<id> + สำเนาล่าสุด key <emp>
       local375     : njhr_att_pending_v1 (คีย์เดียว) -> ย้ายเข้า v2 เมื่อเจ้าของตรงกับผู้ใช้ปัจจุบัน แล้วลบ v1 หลังอ่านกลับได้แล้วเท่านั้น
     ผลการอ่าน: FOUND · NOT_FOUND · READ_ERROR · CONFLICT (มีมากกว่า 1 รายการ/สองแหล่งไม่ตรงกัน -> ตรวจทุกรายการ) */
  var PEND_V1 = 'njhr_att_pending_v1';
  /* [RUN-219] ความสมบูรณ์ของรายการค้าง
       - ทุกรายการที่ local378 จด มี c = ผลรวมตรวจสอบของข้อมูลสำคัญ (id · emp · kind · mode · wd · t · ids)
       - อ่านไม่ออก / โครงสร้างผิด / ข้อมูลสำคัญหาย / ผลรวมไม่ตรง = "เสียหาย" -> READ_ERROR (ไม่ข้าม ไม่ลบเอง)
         กู้คืนได้เฉพาะเมื่ออีกแหล่งมีสำเนาของ Request ID เดียวกันที่ผ่านการตรวจ
       - Request ID เดียวกันแต่ข้อมูลสำคัญไม่ตรงกันระหว่างแหล่ง = CONFLICT -> ไม่เลือกข้าง ไม่เขียนทับ ตรวจกับเซิร์ฟเวอร์เท่านั้น
       - อ่านได้ไม่ครบ (IndexedDB อ่านไม่ได้) = ยังไม่ถือว่าตรวจครบ เว้นแต่มีหลักฐานว่าไม่มีรายการที่อยู่ใน IndexedDB อย่างเดียว (เครื่องหมาย IO) */
  var PEND_IO = 'njhr_att_io_v1', PEND_HOLD = 'njhr_att_hold_v1';
  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function pendSig(j, noT) {
    return [j.id, j.emp, j.kind, j.mode, j.wd || '', noT ? '' : j.t, (j.ids || []).join(',')].join('|');
  }
  function pendSum(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function pendValid(j, emp) {
    if (!(j && typeof j === 'object' && typeof j.id === 'string' && UUID_RE.test(j.id))) return false;
    if (!(j.kind === 'IN' || j.kind === 'OUT') || !(j.mode === 'req' || j.mode === 'log')) return false;
    if (!(typeof j.t === 'number' && isFinite(j.t) && j.t > 0)) return false;
    if (!j.emp || j.emp !== emp) return false;
    if (j.ids != null && !Array.isArray(j.ids)) return false;
    if (j.wd != null && typeof j.wd !== 'string') return false;
    if (j.c != null && j.c !== pendSum(pendSig(j))) return false;
    return true;
  }
  /* สำเนาสำหรับจด: เฉพาะข้อมูลที่ต้องใช้ตรวจผล (ไม่มีใบหน้า/รูป/Token) + ผลรวมตรวจสอบ */
  function pendPack(p) {
    var q = { id: p.id, kind: p.kind, emp: p.emp, t: p.t, mode: p.mode, ids: (p.ids || []).slice(), wd: p.wd || '' };
    if (p.b) q.b = 1;
    if (p.hr && p.hr.t) q.hr = { id: String(p.hr.id || ''), t: p.hr.t };
    q.c = pendSum(pendSig(q));
    return q;
  }
  function pendSame(a, b) {                    // ข้อมูลสำคัญตรงกันหรือไม่ (รายการรุ่นเก่าที่ไม่มี c: เวลาอาจต่างกันระดับมิลลิวินาทีระหว่างสองแหล่ง จึงไม่นำเวลามาเทียบ)
    var noT = !(a.c && b.c);
    return pendSig(a, noT) === pendSig(b, noT);
  }
  function lsKey(emp) { return PEND_KEY + ':' + emp; }
  function lsKeyR(emp, id) { return PEND_KEY + ':' + emp + ':' + id; }
  function lsPut(p) {
    try {
      localStorage.setItem(lsKeyR(p.emp, p.id), JSON.stringify(p));
      var back = JSON.parse(localStorage.getItem(lsKeyR(p.emp, p.id)) || 'null');      // อ่านกลับตรวจครบทุกข้อมูลสำคัญ
      if (!(pendValid(back, p.emp) && pendSig(back) === pendSig(p))) return false;
      try { localStorage.setItem(lsKey(p.emp), JSON.stringify(p)); } catch (e1) {}         // สำเนาให้ local376
      return true;
    } catch (e) { return false; }
  }
  function lsScan(emp) {
    try {
      var out = [], bad = [], m = lsKey(emp), n = localStorage.length, k, j, raw, idK;
      for (var i = 0; i < n; i++) {
        k = localStorage.key(i);
        if (!k || (k !== m && k.indexOf(m + ':') !== 0)) continue;
        raw = localStorage.getItem(k);
        try { j = JSON.parse(raw || 'null'); } catch (eP) { j = null; }
        idK = k === m ? '' : k.slice(m.length + 1);
        if (pendValid(j, emp) && (!idK || idK === j.id)) out.push({ rec: j, perId: k !== m });
        else bad.push({ src: 'ls', key: k, id: UUID_RE.test(idK) ? idK : '', mirror: k === m });
      }
      return { st: 'OK', list: out, bad: bad };
    } catch (e) { return { st: 'ERR', list: [], bad: [] }; }
  }
  function lsGet(emp) { var r = lsScan(emp); return r.list.length ? r.list[0].rec : null; }
  function idbRun(mode, fn) {
    return new Promise(function (res, rej) {
      var done = false, tm = setTimeout(function () { if (done) return; done = true; rej(idbErr('ERR', 'idb-timeout')); }, 1500);
      function fin(f, v) { if (done) return; done = true; clearTimeout(tm); f(v); }
      try {
        if (!w.indexedDB) return fin(rej, idbErr('NA', 'no-idb'));
        var rq = w.indexedDB.open(PEND_DB, 1);
        rq.onupgradeneeded = function () { try { rq.result.createObjectStore(PEND_STORE); } catch (e) {} };
        rq.onerror = function () { fin(rej, idbErr('NA', 'idb-open')); };       // เปิดไม่ได้ (เช่น โหมดส่วนตัว) = เขียนไม่ได้ตั้งแต่แรก
        rq.onblocked = function () { fin(rej, idbErr('ERR', 'idb-blocked')); };
        rq.onsuccess = function () {
          try {
            var db = rq.result, tx = db.transaction(PEND_STORE, mode), out;
            var r2 = fn(tx.objectStore(PEND_STORE));
            if (r2 && r2.multi) { /* หลายคำขอใน Transaction เดียว */ }
            else if (r2) r2.onsuccess = function () { out = r2.result; };
            tx.oncomplete = function () {
              if (r2 && r2.multi) out = r2.multi.map(function (x) { return x.result; });
              try { db.close(); } catch (e) {} fin(res, out);
            };
            tx.onerror = tx.onabort = function () { try { db.close(); } catch (e) {} fin(rej, idbErr('ERR', 'idb-tx')); };
          } catch (e) { fin(rej, idbErr('ERR', 'idb-tx')); }
        };
      } catch (e) { fin(rej, idbErr('NA', 'idb-open')); }
    });
  }
  function idbErr(kind, m) { var e = new Error(m); e.idb = kind; return e; }
  /* งาน IndexedDB เข้าคิวเดียว: "จด" ต้องจบก่อน "ลบ" เสมอ (กันรายการที่ทราบผลแล้วถูกจดทับกลับมาค้าง) */
  var IDBQ = Promise.resolve();
  function idbSeq(fn) { var r = IDBQ.then(fn, fn); IDBQ = r.then(function () {}, function () {}); return r; }
  function idbPut(p) { return idbSeq(function () { return idbPutNow(p); }); }
  function idbPutNow(p) {
    return idbRun('readwrite', function (st) { st.put(p, p.emp + ':' + p.id); st.put(p, p.emp); }).then(function () {
      return idbRun('readonly', function (st) { return st.get(p.emp + ':' + p.id); });   // อ่านกลับตรวจครบทุกข้อมูลสำคัญ
    }).then(function (back) { return !!(pendValid(back, p.emp) && pendSig(back) === pendSig(p)); },
            function () { return false; });
  }
  function idbScan(emp) {
    return idbRun('readonly', function (st) { return { multi: [st.getAllKeys(), st.getAll()] }; }).then(function (kv) {
      var out = [], bad = [], keys = (kv && kv[0]) || [], vals = (kv && kv[1]) || [];
      keys.forEach(function (k0, i) {
        var k = String(k0), j = vals[i];
        if (k !== emp && k.indexOf(emp + ':') !== 0) return;                 // ของพนักงานคนอื่น = ไม่แตะ
        var idK = k === emp ? '' : k.slice(emp.length + 1);
        if (pendValid(j, emp) && (!idK || idK === j.id)) out.push({ rec: j, perId: k !== emp });
        else bad.push({ src: 'idb', key: k, id: UUID_RE.test(idK) ? idK : '', mirror: k === emp });
      });
      return { st: 'OK', list: out, bad: bad };
    }, function (e) { return { st: (e && e.idb === 'NA') ? 'NA' : 'ERR', list: [], bad: [] }; });
  }
  /* เครื่องหมาย IO = หลักฐานว่า "มีรายการที่จดได้เฉพาะใน IndexedDB" (localStorage เขียนไม่ได้ตอนนั้น)
     จดไว้ 2 ที่ที่ไม่ขึ้นกับ IndexedDB: Cookie + localStorage · ตั้ง "ก่อน" ส่งคำสั่ง ตั้งไม่ได้ = ไม่ส่ง
     e:1 (epoch) = เคยอ่านที่จัดเก็บได้ครบด้วยรุ่นนี้แล้ว (รายการรุ่นเก่าถูกย้ายเข้า localStorage ครบ) -> เครื่องหมายนี้ใช้เป็นหลักฐานได้ */
  function ioCk(emp) { return 'njhr_att_io_' + String(emp).replace(/[^0-9a-zA-Z]/g, '').slice(0, 16); }
  function ioCookieGet(emp) {
    try {
      var m = ('; ' + d.cookie).split('; ' + ioCk(emp) + '=');
      if (m.length < 2) return [];
      return m.pop().split(';')[0].split('.').filter(function (x) { return !!x; });
    } catch (e) { return null; }
  }
  function ioCookieSet(emp, ids) {
    try {
      d.cookie = ioCk(emp) + '=' + ids.join('.') + '; path=/; SameSite=Lax; max-age=' + (ids.length ? 31536000 : 0);
      var back = ioCookieGet(emp);
      return !!back && back.join('.') === ids.join('.');
    } catch (e) { return false; }
  }
  function ioLs(emp) {
    try { var j = JSON.parse(localStorage.getItem(PEND_IO + ':' + emp) || 'null'); return (j && typeof j === 'object' && Array.isArray(j.ids)) ? j : null; }
    catch (e) { return null; }
  }
  function ioLsSet(emp, j) { try { localStorage.setItem(PEND_IO + ':' + emp, JSON.stringify(j)); return true; } catch (e) { return false; } }
  function ioIds(emp) {
    var a = ioCookieGet(emp) || [], b = (ioLs(emp) || {}).ids || [], o = {};
    a.concat(b).forEach(function (x) { o[x] = 1; });
    return Object.keys(o);
  }
  function ioMark(emp, id, on) {
    var s = String(id).slice(0, 8), ids = ioIds(emp).filter(function (x) { return x !== s; });
    if (on) ids.push(s);
    var j = ioLs(emp) || { e: 0, ids: [] };
    j.ids = ids;
    var a = ioCookieSet(emp, ids), b = ioLsSet(emp, j);
    return on ? (a || b) : true;
  }
  function ioEpoch(emp) { var j = ioLs(emp); return !!(j && j.e === 1); }
  function ioEpochSet(emp) { var j = ioLs(emp) || { e: 0, ids: ioIds(emp) }; if (j.e === 1) return; j.e = 1; ioLsSet(emp, j); }
  /* คืน true เมื่อจดรายการได้และอ่านกลับตรวจครบอย่างน้อย 1 ที่ — localStorage ผ่าน = ไม่ต้องรอ IndexedDB (จดสำรองตามหลัง)
     localStorage ไม่ผ่าน = ต้องตั้งเครื่องหมาย IO ให้ได้ก่อน แล้วจึงจดลง IndexedDB */
  function pendSave(p, hold) {                 // hold = { idb: Promise } รับผลการจดสำรองลง IndexedDB (ใช้ตอนย้ายข้อมูลรุ่นเก่า)
    var q = pendPack(p);
    if (lsPut(q)) { var bk = idbPut(q); if (hold) hold.idb = bk; return Promise.resolve(true); }
    if (!ioMark(q.emp, q.id, true)) return Promise.resolve(false);
    return idbPut(q).then(function (ok) { if (!ok) ioMark(q.emp, q.id, false); return ok; });
  }
  function pendClear(p) {                      // เรียกเมื่อ "ทราบผลแล้ว" เท่านั้น (ดู [RUN-219] ที่ attPendingUI)
    if (!p || !p.emp || !p.id) return;
    try {
      localStorage.removeItem(lsKeyR(p.emp, p.id));
      var m = JSON.parse(localStorage.getItem(lsKey(p.emp)) || 'null');
      if (m && m.id === p.id) {
        localStorage.removeItem(lsKey(p.emp));
        /* ยังมีรายการอื่นค้าง -> สำเนาสำหรับ local376 ชี้ไปที่รายการที่เก่าที่สุดที่เหลือ (ย้อนรุ่นแล้วยังเห็นรายการค้าง) */
        var rest = lsScan(p.emp).list.filter(function (x) { return x.perId; }).map(function (x) { return x.rec; })
                     .sort(function (a, b) { return a.t - b.t; });
        if (rest.length) localStorage.setItem(lsKey(p.emp), JSON.stringify(rest[0]));
      }
      var v1 = JSON.parse(localStorage.getItem(PEND_V1) || 'null');
      if (v1 && v1.id === p.id) localStorage.removeItem(PEND_V1);
    } catch (e) {}
    ioMark(p.emp, p.id, false);
    idbSeq(function () {
      return idbRun('readwrite', function (st) {
        st['delete'](p.emp + ':' + p.id);
        var g = st.get(p.emp);
        g.onsuccess = function () { if (g.result && g.result.id === p.id) st['delete'](p.emp); };
      });
    })['catch'](function () {});
  }
  function pendLoad() { var emp = currentSessionEmployeeId(); return emp ? lsGet(emp) : null; }
  /* รายการ "ตรวจในเครื่องไม่ได้" (ข้อมูลเสียหาย / อ่านที่จัดเก็บได้ไม่ครบ) — ไม่ถูกจดเพิ่ม ตัวข้อมูลที่เสียหายเองคือเครื่องหมาย
     ref = รหัสอ้างอิงสำหรับคำขอฝ่ายบุคคล (รู้ Request ID จากชื่อคีย์ = ใช้ Request ID นั้น) */
  function holdRef(emp) {
    var k = PEND_HOLD + ':' + emp, j = null;
    try { j = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { j = null; }
    if (j && typeof j.ref === 'string' && j.t > 0) return j;
    j = { ref: 'HOLD-' + String(emp).slice(0, 8) + '-' + attReqId().slice(0, 8), t: Date.now() };
    try { localStorage.setItem(k, JSON.stringify(j)); } catch (e2) { j = { ref: 'HOLD-' + String(emp).slice(0, 8), t: new Date().setHours(0, 0, 0, 0) }; }
    return j;
  }
  /* ลบข้อมูลที่เสียหาย/เครื่องหมาย — เรียกได้เฉพาะหลังทราบผลสุดท้ายที่ตรวจสอบได้ (เซิร์ฟเวอร์ยืนยัน หรือฝ่ายบุคคลพิจารณาแล้ว + พนักงานยืนยันเอง) */
  function holdClear(x) {
    var idbKeys = [];
    (x.bad || []).forEach(function (b) {
      if (b.src === 'idb') idbKeys.push(b.key);
      else { try { localStorage.removeItem(b.key); } catch (e) {} }
    });
    if (x.id) pendClear({ emp: x.emp, id: x.id });
    if (x.io) { ioIds(x.emp).forEach(function (s) { ioMark(x.emp, s, false); }); }
    if (x.ref) { try { localStorage.removeItem(PEND_HOLD + ':' + x.emp); } catch (e2) {} }
    if (idbKeys.length) {
      idbSeq(function () { return idbRun('readwrite', function (st) { idbKeys.forEach(function (k) { st['delete'](k); }); }); })['catch'](function () {});
    }
  }
  function itemClear(x) { if (x.mode === 'bad') holdClear(x); else pendClear({ emp: x.emp, id: x.id }); }
  /* อ่านรายการค้างทั้งหมดของผู้ใช้ปัจจุบัน (localStorage + IndexedDB + v1) แล้วย้ายเข้ารูปแบบปัจจุบันให้ครบทุก Request ID
     คืน { state, list, bad, complete }
       NOT_FOUND  = อ่านได้ครบและไม่มีรายการค้างจริง (ทางเดียวที่เริ่มธุรกรรมใหม่ได้)
       FOUND      = 1 รายการ · CONFLICT = หลายรายการ หรือ Request ID เดียวกันแต่ข้อมูลไม่ตรงกัน
       READ_ERROR = มีข้อมูลเสียหายที่กู้ไม่ได้ หรืออ่านที่จัดเก็บได้ไม่ครบ (list อาจมีรายการที่อ่านได้ — ต้องตรวจก่อนเช่นกัน) */
  var IDB_READ_TRIES = 3, IDB_READ_GAP_MS = 250;
  function pendRead() {
    var emp = currentSessionEmployeeId();
    if (!emp) return Promise.resolve({ state: 'NOT_FOUND', list: [], bad: [], complete: true });
    var ls = lsScan(emp), v1 = null, lsErr = ls.st !== 'OK', bad = ls.bad.slice();
    try {
      var raw = localStorage.getItem(PEND_V1);
      if (raw) {
        var j1 = null, okJ = true;
        try { j1 = JSON.parse(raw); } catch (eJ) { okJ = false; }
        if (okJ && j1 && typeof j1 === 'object' && j1.emp && j1.emp !== emp) { /* ของพนักงานคนอื่น = ไม่แตะ ไม่ใช้ */ }
        else if (okJ && pendValid(j1, emp)) v1 = j1;
        else bad.push({ src: 'v1', key: PEND_V1, id: '', mirror: false });
      }
    } catch (e) { lsErr = true; }
    function scan(n) {                          // IndexedDB อ่านไม่ได้ = ลองซ้ำแบบจำกัดรอบและเวลา (ไม่วนไม่จำกัด)
      return idbSeq(function () { return idbScan(emp); }).then(function (r) {
        if (r.st !== 'ERR' || n >= IDB_READ_TRIES) return r;
        return new Promise(function (res) { setTimeout(res, IDB_READ_GAP_MS); }).then(function () { return scan(n + 1); });
      });
    }
    return scan(1).then(function (idb) {
      bad = bad.concat(idb.bad);
      var groups = {}, order = [];
      function add(r, src, perId) {
        var g = groups[r.id];
        if (!g) { g = groups[r.id] = { recs: [], ls: false, idb: false }; order.push(r.id); }
        g.recs.push(r);
        if (perId && src === 'ls') g.ls = true;
        if (perId && src === 'idb') g.idb = true;
      }
      ls.list.forEach(function (x) { add(x.rec, 'ls', x.perId); });
      idb.list.forEach(function (x) { add(x.rec, 'idb', x.perId); });
      if (v1) add(v1, 'v1', false);
      var list = [], mig = [];
      order.forEach(function (id) {
        var g = groups[id], a = g.recs[0], same = g.recs.every(function (r) { return pendSame(a, r); });
        if (!same) {
          /* Request ID เดียวกัน ข้อมูลสำคัญไม่ตรงกัน: ไม่เลือกข้าง ไม่เขียนทับ — ส่งทุกสำเนาไปตรวจกับเซิร์ฟเวอร์ */
          var kinds = {}; g.recs.forEach(function (r) { kinds[r.kind] = 1; });
          list.push({ id: id, emp: emp, mode: 'conflict', kind: Object.keys(kinds).length === 1 ? a.kind : '?',
                      t: Math.max.apply(null, g.recs.map(function (r) { return r.t; })), wd: a.wd || '', variants: g.recs.slice() });
          return;
        }
        var rec = a;
        g.recs.forEach(function (r) { if (r.t > rec.t) rec = r; });
        var hr = null; g.recs.forEach(function (r) { if (r.hr && r.hr.t) hr = r.hr; });
        rec = pendPack(hr ? Object.assign({}, rec, { hr: hr }) : rec);
        list.push(rec);
        if (!g.ls || !g.idb) mig.push(rec);       // ยังไม่มีคีย์ต่อรายการครบทั้งสองแหล่ง (มาจาก v1 / local376 / แหล่งเดียว) -> ย้าย · ทำซ้ำได้ ไม่สร้างซ้ำ (คีย์เดิม)
      });
      /* ข้อมูลเสียหายที่ "รู้ Request ID" และอีกแหล่งมีสำเนาที่ผ่านการตรวจ (ไม่ใช่ CONFLICT) = กู้คืนจากสำเนานั้น */
      var good = {}; list.forEach(function (r) { if (r.mode !== 'conflict') good[r.id] = r; });
      var mirrorOk = { ls: ls.list.some(function (x) { return !x.perId; }), idb: idb.list.some(function (x) { return !x.perId; }) };
      bad = bad.filter(function (b) {
        if (b.id && good[b.id]) { if (mig.indexOf(good[b.id]) < 0) mig.push(good[b.id]); return false; }
        /* สำเนาล่าสุด (คีย์รวม) เสียหาย แต่คีย์รวมของอีกแหล่งอ่านได้ = เป็นสำเนาของรายการที่อ่านได้อยู่แล้ว */
        if (b.mirror && ((b.src === 'ls' && mirrorOk.idb) || (b.src === 'idb' && mirrorOk.ls))) { b.fix = true; return false; }
        return true;
      });
      return Promise.all(mig.map(function (r) {
        var hold = {};
        return pendSave(r, hold).then(function (ok) {
          if (!(ok && v1 && v1.id === r.id)) return ok;
          /* ลบต้นทาง v1 หลัง "ข้อมูลใหม่ครบ" เท่านั้น: อ่านกลับจากคีย์ใหม่ใน localStorage ได้ และการจดสำรองลง IndexedDB จบแล้ว (เครื่องที่ไม่มี IndexedDB = จบด้วยผล false) */
          return Promise.resolve(hold.idb).then(null, function () { return false; }).then(function () {
            var still = lsScan(emp).list.some(function (x) { return x.perId && x.rec.id === r.id; });
            if (still) { try { localStorage.removeItem(PEND_V1); } catch (e2) {} }
            return ok;
          });
        });
      })).then(function () {
        /* ซ่อมสำเนาล่าสุดของ localStorage ที่เสียหาย (มีหลักฐานจากอีกแหล่งแล้ว) */
        if (ls.bad.some(function (b) { return b.fix; })) {
          var first = list.filter(function (r) { return r.mode !== 'conflict'; }).sort(function (x, y) { return x.t - y.t; })[0];
          try { if (first) localStorage.setItem(lsKey(emp), JSON.stringify(first)); else localStorage.removeItem(lsKey(emp)); } catch (e3) {}
        }
        var idbOk = idb.st === 'OK';
        if (!lsErr && (idbOk || idb.st === 'NA') && !ioEpoch(emp)) {
          /* อ่านครบครั้งแรกด้วยรุ่นนี้: รายการที่อยู่ใน IndexedDB อย่างเดียวถูกย้ายเข้า localStorage แล้ว (ย้ายไม่ได้ = ตั้งเครื่องหมายใน pendSave) */
          if (idbOk) list.forEach(function (r) { if (r.mode !== 'conflict' && !lsScan(emp).list.some(function (x) { return x.perId && x.rec.id === r.id; })) ioMark(emp, r.id, true); });
          ioEpochSet(emp);
        }
        var marked = ioIds(emp).length > 0;
        var complete = !lsErr && (idbOk || (idb.st === 'NA' && !marked) || (idb.st === 'ERR' && ioEpoch(emp) && !marked));
        var conflict = list.length > 1 || list.some(function (r) { return r.mode === 'conflict'; });
        var state = (bad.length || !complete) ? 'READ_ERROR' : conflict ? 'CONFLICT' : list.length ? 'FOUND' : 'NOT_FOUND';
        return { state: state, list: list, bad: bad, complete: complete, partial: !complete,
                 src: { ls: lsErr ? 'ERR' : 'OK', idb: idb.st, marked: marked } };
      });
    });
  }
  function pendResult(p, row) {
    return { ok: true, verified_after_timeout: true, request_id: p.id, reason: '', work_date: row.work_date,
             check_in: row.check_in, check_out: row.check_out, status: row.status,
             work_hours: row.work_hours, late_min: row.late_min, geofence_name: row.geofence_name || '' };
  }
  /* ถามผลของธุรกรรมที่ค้าง -> { state: 'SAVED' (r, exact) | 'NOT_SAVED' | 'CLOSED' | 'WAIT' (note) }
     NOT_SAVED เกิดได้ทางเดียว: เซิร์ฟเวอร์ตอบ state = VOID ของ Request ID นี้ · ไม่มีเงื่อนไขเวลา */
  /* ตรวจจากรายการบนเซิร์ฟเวอร์ (ใช้ได้เมื่อจดรหัสรายการก่อนส่งไว้): พบรายการใหม่ = SAVED · ไม่พบ = ยังไม่ทราบผล (manual = เซิร์ฟเวอร์ตอบแล้วแต่ตัดสินไม่ได้) */
  function pendLogCheck(p, note) {
    var base = { emp: p.emp, ids: {} };
    (p.ids || []).forEach(function (x) { base.ids[String(x)] = 1; });
    return attVerifyOnce(p.kind, base).then(function (r) {
      if (r) return { state: 'SAVED', exact: false, r: r };
      return { state: 'WAIT', note: note, hr: true, manual: true };
    })['catch'](function (e) {
      if (isAborted(e)) throw e;
      return { state: 'WAIT', note: 'ยังติดต่อเซิร์ฟเวอร์ไม่ได้', hr: true };
    });
  }
  /* ถามเซิร์ฟเวอร์ด้วย Request ID อย่างเดียว (ไม่สั่งปิดคำขอ) — ใช้กับข้อมูลเสียหาย/ขัดแย้งที่ไม่รู้ประเภทแน่ชัด
     kinds = ประเภทที่ยอมรับ (null = ยอมรับตามที่เซิร์ฟเวอร์ตอบ) · คืน null = ตัดสินไม่ได้ · reached = เซิร์ฟเวอร์ตอบแล้ว */
  function pendStatusOnly(id, kinds, allowVoid) {
    return rpc('njhr_att_punch_req_status', { p_token: token(), p_request_id: id }, true).then(function (row) {
      var out = { reached: true, res: null };
      if (!row || typeof row !== 'object' || row.found !== true || String(row.request_id || '') !== id) return out;
      var act = String(row.action || '').toUpperCase();
      if (act !== 'IN' && act !== 'OUT') return out;
      if (kinds && kinds.indexOf(act) < 0) return out;
      if (row.state === 'VOID') { if (allowVoid) out.res = { state: 'NOT_SAVED' }; return out; }
      var t = act === 'IN' ? row.check_in : row.check_out;
      if (row.state === 'DONE' && row.ok === true && row.log_id && row.work_date && t && !isNaN(Date.parse(t))) {
        out.res = { state: 'SAVED', exact: true, kind: act, r: pendResult({ id: id }, row) };
      }
      return out;
    }, function (e) {
      if (isAborted(e)) throw e;
      return { reached: isNoFn(e), res: null };
    });
  }
  function pendCheckSpecial(p) {
    var NOTE = 'ยืนยันรายการเดิมจากข้อมูลในเครื่องไม่ได้ กรุณาแจ้งฝ่ายบุคคลตรวจสอบ';
    if (p.mode === 'bad') {
      if (!p.id) return Promise.resolve({ state: 'WAIT', note: NOTE, hr: true, manual: true });
      return pendStatusOnly(p.id, null, true).then(function (o) {
        return o.res || { state: 'WAIT', note: o.reached ? NOTE : 'ยังติดต่อเซิร์ฟเวอร์ไม่ได้', hr: true, manual: o.reached };
      });
    }
    /* conflict: สำเนาไม่ตรงกัน -> เชื่อคำตอบของเซิร์ฟเวอร์เท่านั้น · ไม่สั่งปิดคำขอ (ไม่รู้ว่าสำเนาใดถูก) */
    var V = p.variants || [], kinds = {}, ids = {}, canLog = false, anyLog = false;
    V.forEach(function (v) {
      kinds[v.kind] = 1;
      if (v.mode === 'log') anyLog = true;
      if (v.mode === 'log' || v.b) canLog = true;
      (v.ids || []).forEach(function (x) { ids[String(x)] = 1; });
    });
    var ks = Object.keys(kinds);
    return pendStatusOnly(p.id, ks, !anyLog).then(function (o) {
      if (o.res) return o.res;
      if (!canLog || ks.length !== 1) return { state: 'WAIT', note: o.reached ? NOTE : 'ยังติดต่อเซิร์ฟเวอร์ไม่ได้', hr: true, manual: o.reached };
      return pendLogCheck({ emp: p.emp, kind: ks[0], ids: Object.keys(ids) }, NOTE);
    });
  }
  function pendCheck(p) {
    var WAIT = function (note) { return { state: 'WAIT', note: note || '' }; };
    if (p.mode === 'bad' || p.mode === 'conflict') return pendCheckSpecial(p);
    if (p.mode === 'req') {
      var status = function () { return rpc('njhr_att_punch_req_status', { p_token: token(), p_request_id: p.id }, true); };
      /* ตัดสินได้เฉพาะคำตอบที่ตรวจรูปแบบครบ: Request ID เดียวกัน · ประเภทเดียวกัน · DONE ต้องมี log_id + วันทำงาน + เวลาของประเภทนั้น */
      var done = function (row) {
        if (!row || typeof row !== 'object' || row.found !== true || String(row.request_id || '') !== p.id) return null;
        if (String(row.action || '').toUpperCase() !== p.kind) return null;
        if (row.state === 'VOID') return { state: 'NOT_SAVED' };
        var t = p.kind === 'IN' ? row.check_in : row.check_out;
        if (row.state === 'DONE' && row.ok === true && row.log_id && row.work_date && t && !isNaN(Date.parse(t))) {
          return { state: 'SAVED', exact: true, r: pendResult(p, row) };
        }
        return null;
      };
      return status().then(function (row) {
        var d1 = done(row);
        if (d1) return d1;
        if (Date.now() - p.t < voidAfterMs()) return WAIT();
        return rpc('njhr_att_punch_req_void', { p_token: token(), p_request_id: p.id, p_action: p.kind }, true).then(function (v) {
          if (!v || String(v.request_id || '') !== p.id) return WAIT();
          if (v.state === 'VOID') return { state: 'NOT_SAVED' };
          if (v.state === 'DONE') return status().then(function (row2) { return done(row2) || WAIT(); });
          return WAIT();
        });
      })['catch'](function (e) {
        if (isAborted(e)) throw e;
        if (isNoFn(e)) {                         // เช่น ระหว่าง Rollback: ไม่ใช่หลักฐานว่าไม่ได้บันทึก
          var nN = 'ระบบตรวจสอบรายการของเซิร์ฟเวอร์ยังไม่พร้อม กรุณาแจ้งฝ่ายบุคคล';
          if (!p.b) return { state: 'WAIT', note: nN, hr: true };
          /* คงสถานะรอตรวจสอบ (ผลของ Request ID นี้ต้องมาจากระบบตรวจสอบเมื่อกลับมาใช้ได้ หรือจากฝ่ายบุคคล)
             ตรวจรายการบนเซิร์ฟเวอร์เพื่อกำหนดว่า "ปิดรายการค้างเอง" ทำได้หรือไม่เท่านั้น: พบรายการใหม่ = ห้ามปิดเอง */
          return pendLogCheck(p, nN).then(function (v) {
            return { state: 'WAIT', note: nN, hr: true, manual: v.state === 'WAIT' && v.manual === true };
          });
        }
        return WAIT('ยังติดต่อเซิร์ฟเวอร์ไม่ได้');
      });
    }
    /* เซิร์ฟเวอร์ยังไม่มี RUN-216: ยืนยันได้ทางเดียวคือพบรายการใหม่ของพนักงาน/ประเภทนี้
       ไม่พบ = ยังไม่ทราบผล (ไม่ใช้การเปลี่ยนรอบวันทำงานหรือเวลาเป็นหลักฐาน) -> ช่องทางแจ้งฝ่ายบุคคล */
    return pendLogCheck(p, 'เซิร์ฟเวอร์รุ่นนี้ยืนยันรายรายการไม่ได้ หากยังไม่พบรายการ กรุณาแจ้งฝ่ายบุคคลตรวจสอบ');
  }
  /* ส่งคำสั่งบันทึก 1 ธุรกรรม — ok:true เกิดได้จากคำตอบของเซิร์ฟเวอร์เท่านั้น
     ทุกเส้นทางก่อนส่ง (รวม RPC สำรอง): ตรวจ ยกเลิก/Session + Deadline + จดรายการสำเร็จ */
  /* ตรวจคำตอบของคำสั่งบันทึก: 'OK' บันทึกสำเร็จ · 'REJECTED' เซิร์ฟเวอร์ตอบว่าไม่ผ่าน (ไม่ได้บันทึก) · 'INVALID' ตัดสินไม่ได้ */
  function attResCheck(r, kind, pend) {
    if (!r || typeof r !== 'object' || typeof r.ok !== 'boolean') return 'INVALID';
    var v2 = pend.mode === 'req';
    if (v2 && String(r.request_id || '') !== pend.id) return 'INVALID';
    if (r.ok === false) return (typeof r.reason === 'string' && r.reason) ? 'REJECTED' : 'INVALID';
    var t = kind === 'IN' ? r.check_in : r.check_out;
    if (!r.work_date || !t || isNaN(Date.parse(t))) return 'INVALID';
    if (v2 && !r.log_id) return 'INVALID';
    return 'OK';
  }
  function attSend(kind, body, o) {
    var emp = currentSessionEmployeeId();
    if (!emp) return Promise.reject(new Error('ไม่พบข้อมูลพนักงานของบัญชีนี้ กรุณาเข้าสู่ระบบใหม่'));
    var srv = reqSrvState();
    var use2 = srv !== 0;
    var baseP = (srv === 1) ? Promise.resolve(null) : (o.baseP || attLogBase());
    var NOT_SENT = 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ยังไม่ได้บันทึกเวลา กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    var pend = null;
    function gate() {                          // โยน Error = ยังไม่ได้ส่งอะไร (ล้างรายการที่จดไว้ได้อย่างปลอดภัย)
      try {
        if (!o.mine()) throw AbortAttendanceError();
        if (!lockMine()) {                     // ล็อกข้ามแท็บหลุดไปอยู่กับแท็บอื่น (แท็บนี้ถูกพักนานเกิน) = ไม่ส่ง · บอกสาเหตุ ไม่ค้างเงียบ
          var eL = new Error('มีการลงเวลาเปิดอยู่ในแท็บหรือหน้าต่างอื่น จึงยังไม่ได้ส่งคำสั่งบันทึกเวลาจากหน้านี้ กรุณาลองใหม่');
          eL.faceCode = 'ATT_LOCK_LOST'; throw eL;
        }
        o.chkDl();
      }
      catch (eG) { if (pend) pendClear(pend); throw eG; }
    }
    function keep(mode) {
      pend.mode = mode;
      return pendSave(pend).then(function (saved) {
        if (!saved) { var eS = new Error(MSG_STORE); eS.faceCode = 'ATT_STORE_FAILED'; throw eS; }
        gate();
      });
    }
    return baseP['catch'](function (eB) {
      if (isAborted(eB)) throw eB;
      if (sessGone(eB)) throw eB;                // [RUN-222] ยังไม่ได้ส่งอะไร: บอกสาเหตุจริง (Session หมดอายุ) แทนข้อความเครือข่ายทั่วไป
      throw new Error(NOT_SENT);
    }).then(function (base) {
      gate();
      pend = { id: attReqId(), kind: kind, emp: emp, t: Date.now(), mode: use2 ? 'req' : 'log',
               ids: base ? Object.keys(base.ids) : [], wd: base ? (base.wd || '') : '', b: base ? 1 : 0 };
      function legacy() { return keep('log').then(function () { return rpc('njhr_att_punch_face', body); }); }
      return keep(pend.mode).then(function () {
        o.onSent(pend);                       // t = เวลาที่จด (ก่อนส่งทันที) ไม่แก้หลังจด — สองแหล่งต้องมีข้อมูลตรงกันทุกค่า
        if (!use2) return rpc('njhr_att_punch_face', body);
        return rpc('njhr_att_punch_face2', Object.assign({}, body, { p_request_id: pend.id }), true).then(function (r) {
          reqSrvSet(1); return r;
        }, function (e) {
          /* สลับไป RPC เดิมได้เฉพาะเมื่อเซิร์ฟเวอร์ยืนยันว่า function ใหม่ไม่มี/เรียกไม่ได้ (คำสั่งไม่ได้ถูกประมวลผล)
             Network Timeout / ไม่ทราบผล = ไม่สลับ · ก่อนสลับตรวจ ยกเลิก + Deadline ซ้ำ (หมดแล้ว = ไม่ส่ง) */
          if (!isNoFn(e)) throw e;
          reqSrvSet(0);
          if (!base) { pendClear(pend); throw new Error(NOT_SENT); }
          gate();
          return legacy();
        });
      }).then(function (r) {
        /* HTTP 200 ไม่ใช่หลักฐานโดยตัวเอง — ตรวจรูปแบบคำตอบก่อนล้างรายการค้าง */
        var v = attResCheck(r, kind, pend);
        if (v === 'INVALID') { var eI = new Error('invalid-response'); eI.invalidResponse = true; throw eI; }
        pendClear(pend); return r;
      }, function (e) { throw e; }).then(null, function (e) {
        if (isAborted(e)) throw e;             // ปิดจอระหว่างรอคำตอบ = ยังไม่ทราบผล -> รายการค้างถูกตรวจเมื่อกดลงเวลาครั้งถัดไป
        if (e && (e.faceCode === 'ATT_STORE_FAILED' || e.faceCode === 'FACE_FLOW_DEADLINE' || e.faceCode === 'ATT_LOCK_LOST')) throw e;   // ยังไม่ได้ส่ง
        if (e && e.definite) { pendClear(pend); throw e; }   // 4xx + รหัสฐานข้อมูล = ปฏิเสธแน่นอน (Transaction ถูกยกเลิกทั้งก้อน)
        /* อื่น ๆ ทั้งหมด = ไม่ทราบผล: 5xx · Timeout · เน็ตหลุด · Body ไม่ครบ · คำตอบผิดรูปแบบ · Request ID ไม่ตรง */
        try { perfBootCount('punch_unknown_outcome'); } catch (e0) {}
        var e3 = new Error(MSG_PENDING);
        e3.punchUnknown = true; e3.punchCode = 'PUNCH_UNKNOWN'; e3.pend = pend;
        throw e3;
      });
    });
  }
  /* เซิร์ฟเวอร์ยังไม่มี Request ID: พบรายการใหม่ของพนักงาน/ประเภทนี้ = รายงานตามข้อมูลเซิร์ฟเวอร์ ไม่อ้างว่าเป็นคำสั่งจากเครื่องนี้ */
  function showFound(kind, r) {
    var t = kind === 'IN' ? r.check_in : r.check_out;
    var hm = t ? new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
    attFrame('ok', 1);
    attCover('ok', 'พบรายการในระบบแล้ว');
    panel(stepsHtml({ live: 'ok', match: 'ok', gps: 'ok' },
      'พบรายการ' + (kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน') + 'ของคุณในระบบแล้ว เวลา ' + hm +
      ' น. (ยืนยันจากข้อมูลบนเซิร์ฟเวอร์)'));
    actions([{ label: 'เสร็จสิ้น', style: 'primary', on: close }]);
    S.busy = false;
  }
  /* ---------- [RUN-219] คำขอฝ่ายบุคคลของรายการค้าง ----------
     ส่งคำขอสำเร็จ ≠ ทราบผลธุรกรรม: รายการค้าง "ไม่ถูกล้าง" — เปลี่ยนเป็น "รอฝ่ายบุคคลตรวจสอบ"
     ความเชื่อมโยง = Request ID (หรือรหัสอ้างอิง HOLD-…) ที่อยู่ในเหตุผลของคำขอ -> ถามสถานะจากเซิร์ฟเวอร์ได้เสมอ
       (ปิดหน้าต่าง / โหลดหน้าใหม่ / กลับเข้าแอป / ข้อมูลในเครื่องหาย ก็ยังหาเจอ · กันส่งคำขอซ้ำ)
     ล้างรายการได้เมื่อ: เซิร์ฟเวอร์ตอบ DONE / VOID · พบรายการใหม่บนเซิร์ฟเวอร์ · ฝ่ายบุคคลอนุมัติ (ระบบบันทึกเวลาให้แล้ว)
     ฝ่ายบุคคลไม่อนุมัติ + ยังไม่ทราบผลเดิม: ไม่ปลดเอง — ส่งคำขอใหม่ได้ หรือพนักงาน "ยืนยันปิดรายการค้าง" เอง
       (ทำได้เฉพาะเมื่อเซิร์ฟเวอร์ตอบในรอบเดียวกันว่า ฝ่ายบุคคลไม่อนุมัติ + ตรวจแล้วไม่พบ/ยืนยันรายการเดิมไม่ได้) */
  function hrRefOf(x) { return x.ref || x.id; }
  function hrFetch(emp) { return rpcRows('njhr_att_correction_list', { p_token: token(), p_employee: emp, p_limit: 200 }); }
  function hrFind(rows, x) {
    var ref = hrRefOf(x), best = null;
    (rows || []).forEach(function (r) {
      if (!r || String(r.employee_id || '') !== x.emp) return;
      if (String(r.reason || '').indexOf(ref) < 0) return;
      var ts = Date.parse(r.submitted_at || r.created_at || '') || 0;
      if (x.ref && x.t && ts && ts < x.t - 60000) return;
      if (!best || ts >= best.ts) best = { ts: ts, row: r };
    });
    if (!best) return { st: 'NONE' };
    var s = String(best.row.status || '').toUpperCase();
    return { st: s === 'APPROVED' ? 'APPROVED' : (s === 'PENDING' || s === 'DRAFT') ? 'PENDING' : 'REJECTED',
             id: String(best.row.id || ''), why: String(best.row.rejection_reason || '') };
  }
  var MSG_BAD = 'อ่านข้อมูลรายการลงเวลาที่ค้างอยู่ในเครื่องไม่ได้ครบ หรือข้อมูลเสียหาย จึงยังไม่เริ่มลงเวลาใหม่ (กันการบันทึกซ้ำ)';
  /* หน้าจอ "รอตรวจสอบผลบันทึก" (รองรับหลายรายการ + ข้อมูลเสียหาย + ข้อมูลขัดแย้ง): ตรวจเองทุก 5s ไม่เกิน 6 ครั้ง · ปิดได้เสมอ · ไม่มีปุ่มลงเวลาซ้ำ
     ทุกรายการต้องทราบผลก่อนจึงอนุญาตลงเวลาใหม่ · เซิร์ฟเวอร์ยืนยันว่าบันทึกแล้ว = รีเฟรชหน้าลงเวลาครั้งเดียว */
  /* [RUN-222] รายการที่เคย "ไม่ทราบผล" ได้ผลจริงจากเซิร์ฟเวอร์แล้ว -> ปิดเหตุการณ์เดิม (รหัสอ้างอิงเดิม) · บันทึก Log อย่างเดียว */
  function telResolved(x, kind, outcome) {
    try {
      if (!x || !x.id) return;
      faceTel({ id: telIdFrom(x.id), mode: (kind === 'IN' || kind === 'OUT') ? kind : 'ATTENDANCE', outcome: outcome,
                stage: 'RESOLVED', code: outcome === 'OK' ? 'OK' : 'PUNCH_NOT_SAVED', match: outcome === 'OK' ? 'PASS' : 'NA', sess: 'OK',
                ms: x.t ? Math.max(0, Date.now() - x.t) : 0 });
    } catch (e) {}
  }
  function attPendingUI(list, onDone, o) {
    var root = S.root, n = 0, busy = false, timer = 0, items = list.slice(), hrShow = false, closed = false;
    var st = o.st || { live: 'ok', match: 'run', gps: 'ok' };
    var fired = false;
    var once = function (x) { if (fired) return; fired = true; if (typeof onDone === 'function') onDone(x); };
    function alive() { return !!root && S.root === root && (!o.alive || o.alive()); }
    function refTxt() { return ' · รหัสรายการ ' + items.map(function (x) { return String(hrRefOf(x)).slice(0, 13); }).join(', '); }
    function hrOf(x) { return x._hr || { st: x.hr ? 'PENDING' : 'UNKNOWN' }; }
    function canHr(x) { var s = hrOf(x).st; return s === 'NONE' || s === 'REJECTED'; }
    function elig(x) { return hrOf(x).st === 'REJECTED' && x._manual === true; }
    function allBad() { return items.length > 0 && items.every(function (x) { return x.mode === 'bad'; }); }
    function waiting(note) {
      var pd = items.filter(function (x) { return hrOf(x).st === 'PENDING'; });
      var rj = items.filter(function (x) { return hrOf(x).st === 'REJECTED'; });
      var bad = allBad();
      if (bad) { attFrame('bad', 0); attCover('bad', pd.length ? 'รอฝ่ายบุคคลตรวจสอบ' : 'อ่านข้อมูลในเครื่องไม่ได้'); }
      else { attFrame('adjust'); attCover('save', pd.length ? 'รอฝ่ายบุคคลตรวจสอบ' : 'รอตรวจสอบผลบันทึก…'); }
      var msg = (bad ? MSG_BAD : MSG_PENDING) + (items.length > 1 ? ' (' + items.length + ' รายการ)' : '');
      if (items.some(function (x) { return x.mode === 'conflict'; })) msg += ' · ข้อมูลในเครื่องของรายการนี้ไม่ตรงกัน ต้องยืนยันกับเซิร์ฟเวอร์';
      if (pd.length) msg += ' · ส่งคำขอให้ฝ่ายบุคคลแล้ว' + (pd[0]._hr && pd[0]._hr.id ? ' (เลขที่คำขอ ' + pd[0]._hr.id.slice(0, 8) + ')' : '') +
                            ' สถานะ: รอฝ่ายบุคคลตรวจสอบ — ยังลงเวลาใหม่ไม่ได้จนกว่าจะทราบผล';
      if (rj.length) msg += ' · ฝ่ายบุคคลไม่อนุมัติคำขอ' + (rj[0]._hr.why ? ' (' + rj[0]._hr.why + ')' : '') +
                            ' — ยังไม่ทราบผลของรายการเดิม จึงยังไม่ปลดให้ลงเวลาใหม่โดยอัตโนมัติ';
      var sx = sessSeen();                      // [RUN-222] เซิร์ฟเวอร์ตอบว่า Session หมดอายุ: แสดงสาเหตุจริง · รายการค้างยังถูกเก็บไว้ครบ · ไม่ส่งคำสั่งเดิมซ้ำ
      if (sx) { msg += ' · ' + MSG_SESSION + ' — รายการนี้ยังถูกเก็บไว้ ระบบจะตรวจผลต่อหลังเข้าสู่ระบบใหม่'; if (/ติดต่อเซิร์ฟเวอร์ไม่ได้/.test(note || '')) note = ''; }
      panel(stepsHtml(st, msg + (note ? ' (' + note + ')' : '') + refTxt(), bad));
      var a = bad ? [{ label: 'ลองอีกครั้ง', style: 'primary', on: o.reread || o.again }]
                  : [{ label: 'ตรวจสอบอีกครั้ง', style: sx ? 'ghost' : 'primary', on: function () { check(); } }];
      if (sx) a.unshift({ label: 'เข้าสู่ระบบใหม่', style: 'primary', on: function () { close(); sessLogout(true); } });
      if ((hrShow || bad) && items.some(canHr)) {
        a.push({ label: rj.length ? 'ส่งคำขอฝ่ายบุคคลอีกครั้ง' : 'แจ้งฝ่ายบุคคลตรวจสอบ', style: 'ghost', on: hr });
      }
      if (items.length && items.every(elig)) a.push({ label: 'ยืนยันปิดรายการค้าง', style: 'ghost', on: manual });
      a.push({ label: 'ปิด', style: 'plain', on: close });              // ปิดได้เสมอ — รายการค้างยังถูกจดไว้
      actions(a);
    }
    function auto() {
      if (allBad()) return;                                               // ข้อมูลในเครื่องเสียหาย: ไม่ตั้งเวลาวนตรวจ — ผู้ใช้กดเอง
      if (n >= ATT_PENDING_AUTO_MAX) { if (!hrShow) { hrShow = true; waiting(); } return; }
      n++;
      timer = setTimeout(function () { if (alive()) check(); }, ATT_PENDING_AUTO_MS);
    }
    function hr() {
      clearTimeout(timer);
      var tg = items.filter(canHr);
      if (!tg.length) return;
      var x0 = tg[0], k0 = (x0.kind === 'IN' || x0.kind === 'OUT') ? x0.kind : (o.kind || 'IN');
      specialRequest(k0, x0.mode === 'bad' ? 'ข้อมูลรายการลงเวลาในเครื่องเสียหาย/อ่านไม่ครบ ไม่ทราบผลการบันทึกเวลา'
                                           : 'ไม่ทราบผลการบันทึกเวลา (ส่งคำสั่งแล้วไม่ได้รับคำตอบจากเซิร์ฟเวอร์)', o.onHrDone || null, {
        at: x0.mode === 'bad' ? 0 : x0.t, workDate: x0.wd || '',
        head: 'ไม่ทราบผลการบันทึกเวลา — ส่งให้ฝ่ายบุคคลตรวจสอบและบันทึกให้',
        note: 'Request ID: ' + tg.map(function (x) { return hrRefOf(x) + ' (' + (x.kind || '?') + ', ' + x.mode + ', ' +
              new Date(x.t).toLocaleString('th-TH') + ')'; }).join(' ; '),
        /* ส่งคำขอสำเร็จ = จดว่า "รอฝ่ายบุคคลตรวจสอบ" คู่กับ Request ID เดิม — ไม่ล้างรายการค้าง */
        after: function (r) {
          tg.forEach(function (x) {
            x.hr = { id: (r && r.id) ? String(r.id) : '', t: Date.now() };
            x._hr = { st: 'PENDING', id: x.hr.id, why: '' };
            if (x.mode === 'req' || x.mode === 'log') pendSave(x);
          });
        }
      });
    }
    function manual() {
      clearTimeout(timer);
      panel(stepsHtml(st, 'ยืนยันปิดรายการค้าง: ฝ่ายบุคคลพิจารณาคำขอแล้ว (ไม่อนุมัติ) และเซิร์ฟเวอร์ไม่พบ/ยืนยันรายการเดิมไม่ได้ ' +
        'ระบบจะตรวจกับเซิร์ฟเวอร์อีกครั้งก่อนปิด · หลังปิดแล้วจึงลงเวลาใหม่ได้ (เซิร์ฟเวอร์ยังปฏิเสธการลงเวลาซ้ำตามกฎเดิม)' + refTxt(), true));
      actions([{ label: 'ยืนยัน', style: 'primary', on: function () { check(true); } },
               { label: 'ย้อนกลับ', style: 'plain', on: function () { waiting(); } }]);
    }
    function fin(left, saved, appr, note, closing) {
      busy = false;
      if (!alive()) return;
      items = left;
      if (closing && items.length && items.every(elig)) {
        items.forEach(itemClear); items = []; closed = true;
        try { perfBootCount('punch_manual_close'); } catch (e0) {}
      }
      if (saved.length) { try { perfBootCount('punch_recovered'); } catch (e1) {} once(saved[0].v.r); }   // เซิร์ฟเวอร์ยืนยัน = รีเฟรชทันที ครั้งเดียว
      else if (appr.length) once(null);
      /* เหลือแต่ "ที่จัดเก็บอ่านไม่ครบ/เสียหายแบบไม่รู้ Request ID" (ไม่ใช่ธุรกรรม) และมีรายการที่เซิร์ฟเวอร์ยืนยันแล้ว = แสดงผลที่ยืนยันได้
         การกดลงเวลาครั้งถัดไปยังถูกกั้นด้วยการอ่านที่จัดเก็บใหม่เสมอ (ไม่ใช่ NOT_FOUND = ไม่เริ่มธุรกรรมใหม่) */
      var onlyHold = items.every(function (x) { return x.mode === 'bad' && !x.id; });
      if (items.length && !(saved.length && onlyHold)) { waiting(note); auto(); return; }
      if (saved.length) {
        var sv = saved[0];
        if (sv.v.exact) showSuccess(sv.kind, sv.v.r, { gps: null, snapshot: null }, once);
        else showFound(sv.kind, sv.v.r);
        return;
      }
      if (appr.length) {
        attFrame('ok', 1); attCover('ok', 'ฝ่ายบุคคลบันทึกเวลาให้แล้ว');
        panel(stepsHtml({ live: 'ok', match: 'ok', gps: 'ok' },
          'ฝ่ายบุคคลอนุมัติคำขอและระบบบันทึกเวลาให้แล้ว (ยืนยันจากเซิร์ฟเวอร์) — ปิดรายการค้างเรียบร้อย'));
        actions([{ label: 'เสร็จสิ้น', style: 'primary', on: close }]);
        return;
      }
      if (closed) {
        attFrame('bad'); attCover('bad', 'ปิดรายการค้างแล้ว');
        st.match = 'bad';
        panel(stepsHtml(st, 'ปิดรายการค้างตามผลการพิจารณาของฝ่ายบุคคลแล้ว หากยังไม่ได้ลงเวลา กรุณาลงเวลาใหม่', true));
        actions([{ label: 'ลงเวลาใหม่', style: 'primary', on: o.reread || o.again }, { label: 'ปิด', style: 'plain', on: close }]);
        return;
      }
      if (o.autoAgain) return o.again();
      attFrame('bad'); attCover('bad', 'ยังไม่ได้บันทึก');
      st.match = 'bad';
      panel(stepsHtml(st, 'เซิร์ฟเวอร์ยืนยันแล้ว: รายการนี้ไม่ได้ถูกบันทึก (ปิดคำขอเดิมแล้ว) กรุณาลงเวลาใหม่', true));
      actions([{ label: 'ลงเวลาใหม่', style: 'primary', on: o.reread || o.again },
               { label: 'ปิด', style: 'plain', on: close }]);
    }
    function check(closing) {
      if (busy || !alive()) return;
      busy = true; clearTimeout(timer);
      setMsg('กำลังตรวจสอบผลการบันทึกกับเซิร์ฟเวอร์…', false);
      var cur = items.slice();
      Promise.all(cur.map(function (x) {
        return pendCheck(x).then(null, function (e) { if (isAborted(e)) throw e; return { state: 'WAIT', note: 'ยังติดต่อเซิร์ฟเวอร์ไม่ได้' }; });
      })).then(function (vs) {
        if (!alive()) { busy = false; return; }
        var left = [], saved = [], note = '';
        vs.forEach(function (v, k) {
          var x = cur[k];
          if (v.state === 'SAVED') { itemClear(x); saved.push({ p: x, v: v, kind: v.kind || x.kind }); telResolved(x, v.kind || x.kind, 'OK'); }
          else if (v.state === 'NOT_SAVED') { itemClear(x); telResolved(x, x.kind, 'FAIL'); }
          else { x._manual = v.manual === true; left.push(x); if (v.note) note = v.note; if (v.hr) hrShow = true; }
        });
        if (!left.length) return fin(left, saved, [], note, closing);
        /* ยังมีรายการที่ไม่ทราบผล -> ถามสถานะคำขอฝ่ายบุคคลจากเซิร์ฟเวอร์ (ผูกด้วย Request ID) */
        return hrFetch(cur[0].emp).then(function (rows) {
          var appr = [];
          left = left.filter(function (x) {
            x._hr = hrFind(rows, x);
            if (x._hr.st === 'APPROVED') { itemClear(x); appr.push(x); return false; }
            if (x._hr.st === 'PENDING' && !x.hr) {             // คำขอถึงเซิร์ฟเวอร์แล้วแต่เครื่องนี้ไม่ได้รับคำตอบตอนส่ง
              x.hr = { id: x._hr.id, t: Date.now() };
              if (x.mode === 'req' || x.mode === 'log') pendSave(x);
            }
            return true;
          });
          fin(left, saved, appr, note, closing);
        }, function (e) {
          if (isAborted(e)) throw e;
          left.forEach(function (x) { x._hr = { st: x.hr ? 'PENDING' : 'UNKNOWN' }; });   // ถามไม่ได้ = ไม่แสดงปุ่มส่งคำขอ (กันส่งซ้ำ) และไม่ให้ปิดเอง
          fin(left, saved, [], (note ? note + ' · ' : '') + 'ยังตรวจสถานะคำขอฝ่ายบุคคลไม่ได้', false);
        });
      }).then(null, function (e) {
        busy = false;
        if (!alive() || isAborted(e)) return;
        waiting('ยังติดต่อเซิร์ฟเวอร์ไม่ได้'); auto();
      });
    }
    waiting();
    check();
  }
  /* กดลงเวลาขณะมีธุรกรรมเดิมค้าง / ข้อมูลในเครื่องเสียหาย / อ่านที่จัดเก็บได้ไม่ครบ:
     ตรวจทุกรายการก่อน — ไม่เปิดกล้อง ไม่สร้างธุรกรรมใหม่ (ใช้ Operation ที่สร้างไว้ก่อนอ่านที่จัดเก็บ)
     เริ่มธุรกรรมใหม่ได้ทางเดียว: อ่านที่จัดเก็บใหม่แล้วได้ NOT_FOUND */
  function attPendingStandalone(rd, kind, onDone, opP) {
    var emp = currentSessionEmployeeId(), items = rd.list.slice(), noId = [];
    (rd.bad || []).forEach(function (b) {
      if (b.id) items.push({ id: b.id, emp: emp, kind: '?', mode: 'bad', t: Date.now(), wd: '', bad: [b] });
      else noId.push(b);
    });
    if (noId.length || !rd.complete) {
      var h = holdRef(emp);
      items.push({ id: '', ref: h.ref, emp: emp, kind: kind, mode: 'bad', t: h.t, wd: '', bad: noId, io: !rd.complete });
    }
    shell('สแกนใบหน้า', kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน', 'att');
    if (S.root) S.root.setAttribute('data-att-scan', '1');
    S.attDone = null;
    attFrame('wait', 0);
    netOwn('P' + opP);
    /* [RUN-222] กดลงเวลาขณะมีรายการเดิมรอตรวจสอบ = PENDING (ไม่ใช่ FAIL / ไม่ใช่ OK / ไม่มีการสแกนหรือส่งคำสั่งใหม่)
       เป็นเหตุการณ์ของ "การกดครั้งนี้" (รหัสอ้างอิงของตัวเอง) — เหตุการณ์ของรายการเดิมยังเป็น UNKNOWN จนกว่าเซิร์ฟเวอร์จะยืนยันผล */
    faceTel({ mode: kind, outcome: 'PENDING', stage: 'PENDING_FOUND', code: 'PENDING_' + items.length, match: 'NA' });
    var auto = S.pendAgain < 2;                 // กันวนเอง: ตรวจแล้วเริ่มใหม่เองได้ไม่เกิน 2 ทอดต่อการกด 1 ครั้ง
    attPendingUI(items, onDone, {
      kind: kind,
      alive: function () { return opAlive(opP); },
      autoAgain: auto,
      again: function () { var k = S.pendAgain + 1; close(); setTimeout(function () { PEND_AGAIN = k; punch(kind, onDone); }, 60); },
      reread: function () { close(); setTimeout(function () { punch(kind, onDone); }, 60); }
    });
  }

  var ATT_OK_HOLD_MS = 300;   // [RUN-212] เวลาค้างกรอบเขียวก่อนแสดงหน้าผลสำเร็จ

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
      FLOW.id++; FLOW.kind = kind; FLOW.op = myOp;
      /* [RUN-214] "ลองใหม่" ของ Flow เดิม = นับต่อ (เดิม close() ล้าง Flow -> นับ 1/3 ใหม่ทุกครั้ง = ลองได้ไม่จำกัด) */
      S.attempts = (FLOW.carry && FLOW.carry.kind === kind) ? FLOW.carry.n : 0;
      FLOW.carry = null;
    }
    var title = kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน';
    shell('สแกนใบหน้า', title, 'att');
    /* [ATT SCAN SCOPE] เครื่องหมายบอกว่า Overlay นี้คือ "จอสแกนใบหน้าเพื่อลงเวลา" เท่านั้น
       เป็นแหล่งความจริงเดียวของทั้ง Face Position Gate (JS) และ CSS กรอบสแกน (RUN-212)
       จอ GPS ของลงเวลา · Face Login · ลงทะเบียนใบหน้า (รวมที่เรียกจากลงเวลา) ไม่มีค่านี้ */
    if (S.root) S.root.setAttribute('data-att-scan', '1');
    S.attDone = null;                        // [RUN-213] ผลสำเร็จของรอบก่อนไม่ข้ามมารอบนี้
    attFrame('wait', 0);
    attCover('gps', 'กำลังตรวจตำแหน่ง GPS…');   // [RUN-213] ยังไม่เปิดกล้อง = บอกสถานะ ไม่ปล่อยกรอบบนพื้นดำ
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
    var halted = false, settled = false, dlTimer = 0;
    var own = function () { return aid === G.sid && opAlive(myOp); };
    var mine = function () { return !halted && own(); };
    /* [RUN-215] Deadline รวม "ตั้งแต่กดลงเวลา" ครอบ: ตรวจสถานะ · GPS · กล้อง · โมเดล · ตรวจจับ · ตรวจคนจริง · รูปหลักฐาน · Upload
       ไม่มีการ Reset · หมดเวลาก่อนส่งคำสั่งบันทึก = จบรอบพร้อมสาเหตุ (ยังไม่มีอะไรถูกบันทึก)
       ส่งคำสั่งบันทึกแล้ว = ไม่ตัดจบ -> Timeout เครือข่ายรายขั้น + ระบบตรวจผล "ไม่ทราบผล" เป็นผู้ปิด (ไม่ให้กดซ้ำทันที)
       หลังลงทะเบียนใบหน้า (hand) เริ่มนับที่นี่ เพราะเวลาที่ผู้ใช้ลงทะเบียนไม่ใช่เวลาสแกนลงเวลา */
    /* [RUN-216] ไม่มีการ Reset เมื่อขั้นเตรียมสถานะใช้เวลานาน — นับจากเวลาที่กดปุ่มเสมอ (punch() ตั้งค่าใหม่ทุกครั้งที่กด) */
    var flowT0 = (!hand && S.flowT0) ? S.flowT0 : Date.now();
    var flowDl = flowT0 + (Number(w.NJHR_ATT_FLOW_MAX_MS) > 0 ? Number(w.NJHR_ATT_FLOW_MAX_MS) : ATT_FLOW_MAX_MS);
    var MSG_FLOW = 'ใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
    /* [RUN-221 · R8] เวลาแต่ละขั้นของรอบนี้ (เก็บในหน่วยความจำ · ส่งเฉพาะตอนจบรอบ) */
    var tl = { gps: 0, cam: 0, ai: 0, frames: 0, scan: 0, send: 0, end: 0, lite: false, hand: !!hand, gate: attFacePosGateOn() };
    S.tl = tl;
    var ev = telBegin(kind);                  // [RUN-222] 1 รอบสแกน = 1 เหตุการณ์
    ev.t0 = flowT0; ev.tl = tl;
    function chkDl() { if (Date.now() > flowDl) throw faceErr('FACE_FLOW_DEADLINE', MSG_FLOW); }
    var logBaseP = null;

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
        /* [RUN-221 · P1] การตรวจพื้นที่ครั้งล่าสุดได้คำตอบ "Session หมดอายุ" = ไม่ใช้ผลผ่านที่จำไว้ ถามเซิร์ฟเวอร์ใหม่เสมอ */
        return gfCheck(fix, GF.sess === true).then(function (r) {
          if (!mine()) return { ok: false, reason: 'ยกเลิกแล้ว' };
          /* [FAIL-CLOSED] ถาม njhr_gf_check ไม่สำเร็จ (RPC Error / Timeout / Network)
             = ห้ามเปิดกล้องเด็ดขาด ห้ามลดความปลอดภัยเพื่อให้ Flow เดินต่อ
             กล้องเปิดได้เมื่อเซิร์ฟเวอร์ตอบ pass=true เท่านั้น
             ⚠ njhr_att_punch_face ยังตรวจ Geofence ซ้ำก่อนบันทึกเหมือนเดิมทุกประการ */
          if (!r && GF.sess) return { ok: false, sess: true, reason: MSG_SESSION };   // [RUN-221 · P1] ไม่ใช่ GPS ไม่ผ่าน
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
    var attLite = androidAttLiteEnabled();
    var modelP = attGuideReady();             // [RUN-216] รองรับ Context Lost ระหว่างโหลดโมเดล
    /* Slow-path ที่ถูกจดจำจาก Timeout ก่อนหน้า: ห้าม compile Recognition 6.44 MB แข่งกับ Guide
       เครื่องปกติยัง prefetch เหมือนเดิมทุกประการ */
    if (!attLite) recogPrefetch();

    /* [GPS GATE] กล้องเปิด "หลัง" GPS พร้อมเท่านั้น
       เมื่อ Warmup ทำงานสำเร็จ gpsGate จะ resolve ทันที (0 ms) กล้องจึงเปิดต่อเนื่อง
       ไม่มีสะดุด — ได้ทั้งความปลอดภัยตาม Requirement และความเร็ว
       ถ้า GPS ไม่ผ่าน จะไม่เปิดกล้องเลย และ reject ให้ .catch เดิมจัดการตามเส้นทางปกติ */
    var camP = gpsGate.then(function (r) {
      if (!r.ok) throw (r.sess ? faceErr('SESSION_EXPIRED', r.reason) : new Error(r.reason || 'GPS ยังไม่พร้อม'));
      if (!mine()) throw AbortAttendanceError();
      chkDl();
      tl.gps = Date.now();
      /* [ROOT CAUSE 7] มีหลักฐานสดจาก Enrollment Run เดิม = ไม่เปิดกล้องรอบที่สอง */
      if (hand) { perfSet('camera_reopen_skipped', 1); return null; }
      var tCam = perfNow();
      attCover('cam', 'กำลังเตรียมกล้อง…');
      return openCam().then(function (v) { perfMark('camera_open_ms', tCam); myStream = S.stream; tl.cam = Date.now(); return v; });
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
        attCover('cam', 'กำลังเตรียมระบบตรวจสอบใบหน้า…');
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
      attFrame('run', 0.7);
      attCover('save', 'กำลังเทียบใบหน้าและบันทึกข้อมูล…');
      return (hand.snapshotP || Promise.resolve(null))['catch'](function () { return null; });
    }).then(function (path) {
      if (!mine()) throw AbortAttendanceError();
      chkDl();
      if (!path) throw faceErr('FACE_SNAPSHOT_INVALID', 'สร้างรูปหลักฐานไม่สำเร็จ กรุณาสแกนลงเวลาอีกครั้ง');   // [RUN-215] ไม่บันทึกโดยไม่มีหลักฐาน
      if (reqSrvState() !== 1) { logBaseP = attLogBase(); logBaseP['catch'](function () {}); }
      var ctx = { frames: [{ desc: hand.desc }], live: { method: hand.method }, snapshot: path };
      return gpsFresh(aid).then(function (g) {
        if (!g || !g.ok) throw new Error(g && g.reason ? g.reason : 'GPS ยังไม่พร้อม');
        ctx.gps = g; return ctx;
      });
    });

    /* [ANDROID ATTENDANCE TIMEOUT] เลือกเพดานเฉพาะ Attempt ลงเวลานี้
       Android = 20s ต่อ inference; iOS/Desktop = 8s เดิม
       ไม่เปลี่ยน Face Login/Enrollment เพราะส่งค่าเฉพาะจาก doPunch() เท่านั้น */
    var attInferMs = attendanceInferTimeoutMs();
    /* [RUN-214] เจ้าของ Camera Stream ของ Attempt นี้ — งานเก่า (Snapshot/Blob ที่ตอบช้า) ปิดได้เฉพาะ Stream ของตัวเอง
       เดิม: closeCam() ไม่ดูเจ้าของ -> Attempt เก่าปิดกล้องของ Attempt ใหม่หลังกด "ลองใหม่" = จอดำ */
    var myStream = null, scanDl = 0, tSend = 0;
    function closeMyCam(reason) {
      if (myStream && S.stream === myStream) { closeCam(reason); return; }
      if (myStream) {
        try { myStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e1) {} }); } catch (e2) {}
        return;
      }
      if (mine()) closeCam(reason);
    }
    var snapOpt = { own: true, ms: SNAPSHOT_TIMEOUT_MS };

    (handScanP || Promise.all([camP, modelP])
      .then(function () {
        perfMark('guide_visible_ms');          // กดปุ่ม → เห็นกล้อง+กรอบนำทาง
        attCamLock(false);                     // [RUN-212] ยืนยันล็อกขนาดกล้อง/กรอบก่อนเริ่มตรวจ (ล็อกแล้ว = ไม่ทำซ้ำ)
        attFrame('wait', 0.1);
        attCover(null);                        // มีภาพกล้องแล้ว = เอาป้ายสถานะออก
        S.running = true;
        chkDl();
        /* Deadline ของขั้นสแกน: ไม่เกิน 60s และไม่เกิน Deadline รวม (กันเวลาไว้ให้ขั้นบันทึก) — ไม่ Reset */
        scanDl = Math.min(Date.now() + ATT_SCAN_MAX_MS, flowDl - ATT_SAVE_RESERVE_MS);
        /* [RUN-215] กล้องค้างระหว่างสแกน: เปิดใหม่ในรอบเดิมได้ 1 ครั้ง — ปิด Stream เดิมก่อน แล้วโอนความเป็นเจ้าของ */
        S.attCamRestartUsed = false;             // 1 ครั้งต่อรอบสแกน — ใช้ร่วมกันทั้ง Normal Flow และ Android Lite
        S.attCamRestart = function () {
          if (!mine()) return Promise.reject(AbortAttendanceError());
          try { perfBootCount('camera_restart_in_scan'); } catch (eC) {}
          var old = S.stream;
          if (old) { try { old.getTracks().forEach(function (t) { try { t.stop(); } catch (e1) {} }); } catch (e2) {} }
          S.stream = null;
          try { if (S.video) S.video.srcObject = null; } catch (e3) {}
          return openCam().then(function () {
            if (!mine()) { closeMyCam(); throw AbortAttendanceError(); }
            myStream = S.stream; FR.v = null;                // นาฬิกาเฟรมเริ่มใหม่กับ Stream ใหม่
          });
        };
        attTfMark('start');
        st.live = 'run'; panel(stepsHtml(st, 'กำลังตรวจสอบบุคคลจริง…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
        hint('มองกล้องให้อยู่ในกรอบ', attLite ? 'หากระบบแจ้ง กรุณากระพริบตา 1 ครั้ง' : 'กรุณาอย่าขยับใบหน้า');

        /* เครื่อง Android ที่เคย Timeout จริง → ใช้ Low-load Active Liveness + Descriptor 1 ครั้ง
           เครื่องอื่นทุกเครื่องเดิน Flow เดิมด้านล่าง */
        if (attLite) {
          tl.lite = true;
          perfSet('android_att_lite', 1);
          return androidAttendanceLiteScan(function (warn, ratio, code) {
            if (!mine()) return;
            if (warn) setMsg(warn, false);
            attFrame(code === 'NOFACE' ? 'wait' : (code === 'ADJUST' ? 'adjust' : 'run'), code ? null : 0.4);
          }, mine, attInferMs, scanDl);
        }

        return grabFrames(6, function (warn, ratio, code) {
          if (!mine()) return;                  // [ข้อ 2] ห้าม Attempt เก่าเขียน UI
          if (warn) setMsg(warn, code !== 'PREP'); else setMsg('กำลังตรวจสอบบุคคลจริง…');
          /* [RUN-212] สีกรอบ + แถบ Progress ตามสถานะจริงของลูปตรวจ */
          if (warn && code !== 'PREP') attFrame(code === 'NOFACE' ? 'wait' : 'adjust');
          else attFrame('run', 0.1 + 0.5 * Math.max(0, Math.min(1, Number(ratio) || 0)));
        }, mine, attInferMs, scanDl);
      })
      .then(function (framesOrCtx) {
        tl.frames = Date.now();                // [RUN-222] เก็บเฟรมครบ (ผ่านด่านคุณภาพ/ตำแหน่งของลูปแล้ว)
        /* Slow-path คืน Context ที่ผ่าน Active Blink แล้ว ไม่ต้องรัน Passive Liveness ซ้ำ */
        if (framesOrCtx && framesOrCtx.lite === true) return framesOrCtx;
        var frames = framesOrCtx;
        /* ---------- ตรวจบุคคลจริงแบบไม่ต้องทำท่าทาง ----------
           ⚠ การลงเวลาปกติต้องไม่บังคับกระพริบตา / หันซ้าย / หันขวา
             พนักงานแค่มองกล้อง ระบบตรวจเอง
           ถ้ารอบแรกยังตัดสินไม่ได้ ให้เก็บภาพเพิ่มอีกชุดแล้วตรวจซ้ำเงียบ ๆ
           ไม่ขอให้ผู้ใช้ทำอะไรเพิ่ม — ยังไม่ผ่านค่อยแจ้งให้กด "ลองใหม่" */
        var lv = passiveLiveness(frames);
        if (lv.pass) return { frames: frames, live: lv };
        if (!lv.challenge) throw lvErr(lv.reason);    // [RUN-221] ข้อความเดิม + รหัส (คุณภาพภาพ / ตรวจคนจริงไม่ผ่าน)
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 2] ห้ามเก็บเฟรมเพิ่มต่อหลัง Cancel
        setMsg('กำลังตรวจสอบบุคคลจริง…', false);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        attFrame('run', 0.62);
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
        }, attInferMs, scanDl).then(function (all) {
          if (!mine()) throw AbortAttendanceError();  // [ข้อ 2] ยกเลิกระหว่างเก็บเพิ่ม
          perfMark('borderline_extra_ms', tBorder);
          perfSet('borderline_extra_descriptor_count', Math.max(0, all.length - extra0));
          var lv2 = lvMore || passiveLiveness(all);
          if (lv2.pass) return { frames: all, live: lv2 };
          throw faceErr('FACE_LIVENESS_FAIL', 'ตรวจสอบบุคคลจริงไม่ผ่าน กรุณามองกล้องให้ชัดแล้วลองใหม่');
        });
      })
      .then(function (ctx) {
        if (!mine()) throw AbortAttendanceError();   // [ข้อ 3] ยกเลิกก่อน Snapshot/Upload
        tl.scan = Date.now();
        st.live = 'ok'; st.match = 'run';
        panel(stepsHtml(st, 'กำลังเทียบใบหน้ากับข้อมูลที่ลงทะเบียน…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
        hint('กำลังบันทึก', 'กรุณาอย่าขยับใบหน้า');
        attFrame('run', 0.7);
        /* [RUN-215] รูปหลักฐาน = ข้อมูลบังคับของการลงเวลาด้วยใบหน้า (เซิร์ฟเวอร์ยังรับค่าว่างได้ จึงบังคับที่นี่)
           ต้องเป็นภาพของ Session นี้ จากกล้องที่ยังส่งเฟรมใหม่อยู่ · JPEG จริงขนาดไม่ต่ำกว่า SNAPSHOT_MIN_BYTES
           ค้าง/ว่าง/เสีย = ถ่ายซ้ำ 1 ครั้ง · ยังไม่ได้ = หยุด ไม่ส่งคำสั่งบันทึก */
        chkDl();
        /* เซิร์ฟเวอร์มี Request ID แล้ว = ไม่ต้องจดรหัสรายการก่อนส่ง (ลด 1 คำขอ) · ยังไม่มี/ยังไม่รู้ = จดขนานกับการถ่าย/อัปโหลดรูป */
        if (reqSrvState() !== 1) { logBaseP = attLogBase(); logBaseP['catch'](function () {}); }
        var shoot = function () {
          return frameFresh(mine, Math.min(Date.now() + 7000, flowDl), true).then(function () {   // รูปหลักฐาน = เฟรมที่มาถึงหลังจุดนี้เท่านั้น
            if (!mine()) throw AbortAttendanceError();
            return snapshotBlob(snapOpt);
          }).then(function (b0) {
            if (!b0 || !(b0.size >= SNAPSHOT_MIN_BYTES) || (b0.type && b0.type !== 'image/jpeg')) {
              throw faceErr('FACE_SNAPSHOT_INVALID', 'สร้างรูปหลักฐานไม่สำเร็จ กรุณาลองใหม่');
            }
            return b0;
          });
        };
        return shoot()['catch'](function (eS) {
          var c = eS && eS.faceCode;
          if (!mine() || (c !== 'FACE_SNAPSHOT_TIMEOUT' && c !== 'FACE_SNAPSHOT_INVALID')) throw eS;
          try { perfBootCount('snapshot_retry'); } catch (e0) {}
          return shoot();
        }).then(function (b) {
          /* [ข้อ 3] Cancel เกิดได้ "ระหว่าง" สร้าง Blob → ตรวจซ้ำก่อน PUT
             ยกเลิกแล้ว = ห้าม PUT · ห้าม GPS Fresh · ห้าม Punch RPC
             Signed Reservation ที่ไม่ได้ใช้ปล่อยหมดอายุได้ เพราะยังไม่มี Object ถูกสร้าง */
          if (!mine()) { closeMyCam(); throw AbortAttendanceError(); }
          camLifeLog('FLOW_COMPLETE_CLOSE');
          closeCam('FLOW_COMPLETE_CLOSE');     // ปิดกล้องทันทีเมื่อได้ภาพครบ
          attCover('save', 'กำลังบันทึกข้อมูล…');   // [RUN-213] ปิดกล้องแล้ว = บอกว่ากำลังบันทึก
          /* [UPLOAD] ถ้าการจองยังไม่เสร็จตอนสแกนจบ ต้องรู้ว่ารออีกกี่มิลลิวินาที */
          var tWaitResv = perfNow();
          return resvP.then(function (resv) {
            perfMark('reserve_wait_after_scan_ms', tWaitResv);
            if (!mine()) throw AbortAttendanceError();
            return putSnapshot(b, resv, 'PUNCH', kind, null);
          }).then(function (path) {
            if (!path) throw faceErr('FACE_SNAPSHOT_INVALID', 'อัปโหลดรูปหลักฐานไม่สำเร็จ กรุณาลองใหม่');
            ctx.snapshot = path;
            attFrame('run', 0.82);
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
        /* [RUN-200] เดิม: ctx.frames[ctx.frames.length - 1] (เฟรมสุดท้าย)
           ใหม่: เฟรมที่คมและตรงที่สุดในชุดเดียวกัน — จำนวนเฟรมและด่านเดิมไม่เปลี่ยน */
        var best = pickBestFrame(ctx.frames) || ctx.frames[ctx.frames.length - 1];
        perfMark('client_face_ms');
        attFrame('run', 0.9);
        chkDl();                                 // หมด Deadline รวมก่อนส่ง = ไม่ส่ง (ยังไม่มีอะไรถูกบันทึก)
        var tRpcA = perfNow();
        perfBootCount('njhr_att_punch_face_calls');   // [INSTRUMENTATION] นับก่อนยิงจริง
        return attSend(kind, {
          p_token: token(), p_action: kind,
          p_descriptor: best.desc, p_faces_found: 1,
          p_liveness: true, p_liveness_method: ctx.live.method,
          p_lat: ctx.gps.ok ? ctx.gps.lat : null,
          p_lng: ctx.gps.ok ? ctx.gps.lng : null,
          p_accuracy: ctx.gps.ok ? ctx.gps.accuracy : null,
          p_snapshot: ctx.snapshot, p_device: deviceInfo()
        }, {
          mine: mine, chkDl: chkDl, baseP: logBaseP,
          onSent: function (pend) {
            tSend = pend.t; tl.send = Date.now();
            ev.sent = true; ev.id = telIdFrom(pend.id);   // [RUN-222] ส่งคำสั่งบันทึกแล้ว: รหัสอ้างอิงผูกกับธุรกรรม (แปลงทางเดียว) · ปิดจอหลังจุดนี้ = UNKNOWN
            clearTimeout(dlTimer);               // ส่งแล้ว = Watchdog ก่อนส่งหมดหน้าที่ · หลังจากนี้ Timeout ไม่ใช่ "ล้มเหลว" แต่คือ "รอตรวจสอบผล"
          }
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
        if (settled) return;                  // [RUN-215] รอบนี้ถูกปิดด้วย Deadline ไปแล้ว
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
        settled = true; clearTimeout(dlTimer); S.attCamRestart = null; aiStatSave();
        /* [FIX 2] RPC สำเร็จและ r.ok === true → บันทึกผล แล้วปิด Flow ครั้งเดียว
           ⚠ ต้องบันทึกก่อน perfEnd เสมอ ไม่งั้น PERF.t เป็น null แล้วค่าหาย */
        perfSet('punch_result', 'OK');
        tl.end = Date.now();
        telEnd(ev, 'OK', { stage: 'DONE', code: 'OK', timeout: attInferMs, retry: S.attempts,   // [RUN-222] เซิร์ฟเวอร์ยืนยันแล้วเท่านั้น (r.ok === true)
                  gps: 'PASS', sess: 'OK', match: 'PASS', cam: tl.cam ? 'OK' : 'NA',
                  pos: (tl.gate && tl.frames && !hand) ? 'PASS' : 'NA', live: hand ? 'HANDOFF' : (tl.scan ? 'PASS' : 'NA'),
                  steps: telSteps(tl, flowT0) });
        perfSet('final_result', 'SUCCESS');
        perfSet('error_code', null);
        attTfMark('end');
        perfEnd('total_attendance_ms');
        S.attempts = 0;
        gpsStop(aid);       // [ข้อ 4] Punch RPC เสร็จ = หยุด watch ของ Attempt นี้ทันที
        /* [RUN-212] เซิร์ฟเวอร์ยืนยันแล้ว -> กรอบเขียว + แถบเต็ม ค้างให้เห็น ATT_OK_HOLD_MS แล้วจึงแสดงหน้าผล
           ผู้ใช้ปิดหน้าจอระหว่างนี้ = เหมือนกด X บนหน้าผลเดิม (ข้อมูลบันทึกแล้ว ไม่เปิดหน้าผลซ้อน) */
        var rootOk = S.root;
        if (rootOk && rootOk.querySelector('#njf-frame')) {
          /* [RUN-213] onDone ทำงานได้ "ครั้งเดียว" ไม่ว่าจะปิดด้วย X / เสร็จสิ้น / ระหว่างกรอบเขียว
             ผู้เรียก = close() เท่านั้น (ดู close) · S.busy ยังเป็น true ตลอดช่วงค้าง -> กดลงเวลาซ้ำไม่ได้ */
          var fired = false;
          S.attDone = function () {
            if (fired) return; fired = true;
            if (typeof onDone === 'function') onDone(o.r);
          };
          /* [RUN-215] เซิร์ฟเวอร์ยืนยันแล้ว = อัปเดตหน้าลงเวลา "ทันที" ไม่รอให้กดเสร็จสิ้น/ปิดหน้าต่าง
             (ครั้งเดียว — X / เสร็จสิ้น / close() ภายหลังเรียกซ้ำไม่ได้เพราะ fired แล้ว) */
          try { S.attDone(); } catch (eD) {}
          attFrame('ok', 1);
          attCover('ok', 'ผ่านการตรวจสอบใบหน้า');
          panel(stepsHtml(st, 'บันทึกเวลาเรียบร้อยแล้ว'));
          setTimeout(function () {
            if (S.root !== rootOk) return;     // ผู้ใช้ปิดไปแล้ว — close() แจ้งหน้าลงเวลาให้แล้ว
            showSuccess(kind, o.r, o.ctx, onDone);
          }, ATT_OK_HOLD_MS);
          return;
        }
        showSuccess(kind, o.r, o.ctx, onDone);
      })
      .catch(function (e) { fail(e); });

    /* [RUN-215] Watchdog ของ Deadline รวม — ทำงานเฉพาะ "ก่อนส่งคำสั่งบันทึก" (ขั้นที่ค้างโดยไม่มี Timeout ของตัวเอง เช่น รอสิทธิ์กล้อง)
       ยกเลิก Network ของรอบนี้ -> แสดงสาเหตุ -> halted: ผลที่ตามมาทีหลังของรอบนี้ไม่มีสิทธิ์เดินต่อ/ส่งบันทึก */
    dlTimer = setTimeout(function () {
      if (settled || tSend || !own()) return;
      abortAttempt('A' + aid);
      fail(faceErr('FACE_FLOW_DEADLINE', MSG_FLOW));
      halted = true;
    }, Math.max(0, flowDl - Date.now()));

    function fail(e) {
        if (settled) return;
        /* [ข้อ 3] Flow ที่ถูก Cancel = เงียบสนิท ไม่ขึ้น Error UI ไม่นับ attempts
           ไม่ Upload หลักฐาน ไม่แตะ State ใด ๆ */
        if (isAborted(e) || !own()) return;
        settled = true; clearTimeout(dlTimer); S.attCamRestart = null; aiStatSave();
        if (e && e.punchUnknown && e.pend) {
          /* [RUN-216] ส่งคำสั่งบันทึกแล้วแต่ไม่ทราบผล: ไม่นับเป็นความล้มเหลว ไม่มีปุ่มลองใหม่ ไม่สร้างธุรกรรมใหม่
             -> หน้าจอรอตรวจสอบผล (ตรวจรายการเดิมกับเซิร์ฟเวอร์) */
          perfSet('punch_result', 'UNKNOWN'); perfSet('final_result', 'UNKNOWN'); perfSet('error_code', 'PUNCH_UNKNOWN');
          tl.end = Date.now();
          ev.id = telIdFrom(e.pend.id);
          telEnd(ev, 'UNKNOWN', { stage: 'SEND', code: 'PUNCH_UNKNOWN', timeout: attInferMs, retry: S.attempts,   // [RUN-222] ไม่นับเป็น OK หรือ FAIL
                    gps: tl.gps ? 'PASS' : 'NA', sess: sessSeen() ? 'EXPIRED' : 'UNKNOWN', match: 'UNKNOWN', cam: tl.cam ? 'OK' : 'NA',
                    pos: (tl.gate && tl.frames && !hand) ? 'PASS' : 'NA', live: hand ? 'HANDOFF' : (tl.scan ? 'PASS' : 'NA'),
                    steps: telSteps(tl, flowT0) });
          attTfMark('end'); perfEnd('total_attendance_ms');
          closeMyCam(); gpsStop(aid);
          st.match = 'run';
          attPendingUI([e.pend], onDone, {
            st: st, alive: own,
            again: function () {
              var nA = S.attempts;
              close();
              FLOW.carry = { kind: kind, n: nA };
              setTimeout(function () { punch(kind, onDone); }, 60);
            }
          });
          S.busy = false;
          return;
        }
        var msg = (e && e.message) || 'สแกนไม่สำเร็จ';
        var fk = failKind(e);                  // [RUN-221] ขั้นที่ล้มจริง
        /* [RUN-222] เซิร์ฟเวอร์ตอบ "Session หมดอายุ" ให้ Token นี้ระหว่างรอบนี้ (เช่น ตอนจดรหัสรายการก่อนส่ง / ขอที่อัปโหลดรูป)
           แต่ Error ที่จบรอบเป็นข้อความทั่วไปของขั้นถัดไป -> แสดงต้นเหตุจริง · ยังไม่มีคำสั่งบันทึกถูกส่ง (กรณีส่งแล้วไม่ทราบผลแยกไปด้านบน) */
        if (fk !== 'SESSION' && fk !== 'MATCH' && sessSeen()) { fk = 'SESSION'; msg = MSG_SESSION; }
        var telCamNow = telCam();
        attFrame('bad');                       // [RUN-212] กรอบแดง = ตรวจสอบไม่ผ่าน
        attCover('bad', fk === 'SESSION' ? 'เซสชันหมดอายุ' : 'ตรวจสอบไม่ผ่าน');      // [RUN-213] กล้องกำลังปิด = บอกผลบนพื้นที่กล้อง
        tl.end = Date.now();
        telEnd(ev, fk === 'SESSION' ? 'SESSION_EXPIRED' : 'FAIL', {
                  stage: String((e && e.faceStage) || fk),
                  code: fk === 'SESSION' ? 'SESSION_EXPIRED'
                      : String((e && (e.camCode || e.faceCode || e.punchCode || e.faceStage)) || (fk === 'GPS' ? 'GPS_FAIL' : 'FLOW_ERROR')),
                  timeout: attInferMs, retry: S.attempts, cam: telCamNow,
                  /* PASS เฉพาะขั้นที่ตรวจจริงและผ่านในรอบนี้ · "กำลังตรวจ" ไม่นับเป็นผ่าน · ไม่ได้ตรวจ = NA */
                  gps: fk === 'GPS' ? (/นอกพื้นที่/.test(msg) ? 'OUTSIDE' : 'FAIL') : (tl.gps ? 'PASS' : 'NA'),
                  pos: fk === 'POS' ? String((e && e.posWhy) || 'TIMEOUT') : ((tl.gate && tl.frames && !hand) ? 'PASS' : 'NA'),
                  live: fk === 'LIVE' ? 'FAIL' : (hand ? 'HANDOFF' : (tl.scan ? 'PASS' : 'NA')),
                  match: fk === 'MATCH' ? 'REJECT' : 'NA',
                  sess: fk === 'SESSION' ? 'EXPIRED' : (tl.gps ? 'OK' : 'NA'),
                  steps: telSteps(tl, flowT0) });
        var androidTimedOut = !!(e && e.faceCode === 'FACE_INFER_TIMEOUT' && deviceInfo().os === 'Android');
        if (androidTimedOut) {
          /* จำเฉพาะเครื่องที่ Timeout จริง: กด Retry รอบถัดไปจะไม่เดินเส้นหนักเดิมอีก */
          androidAttLiteEnable();
        }
        /* [FIX 2] มาถึงที่นี่ขณะ PERF.t ยังไม่เป็น null เสมอ เพราะ .then แรกไม่ปิด Flow แล้ว
           บันทึก outcome จากผลจริงก่อน แล้วจึงปิด Flow ครั้งเดียว (perfEnd มี guard กันซ้ำ)
           error_code = รหัสจริง ไม่เก็บข้อความที่ผู้ใช้เห็น (อาจมีชื่อพื้นที่/ระยะทาง) */
        perfSet('punch_result', 'FAIL');
        perfSet('final_result', 'FAIL');
        perfSet('error_code',
          (e && e.camCode) ? e.camCode :
          (e && e.faceCode) ? e.faceCode :
          (e && e.punchCode) ? e.punchCode : 'FLOW_ERROR');
        attTfMark('end');
        perfEnd('total_attendance_ms');
        if (fk !== 'SESSION') S.attempts++;    // [RUN-221 · P1] Session หมดอายุ ไม่ใช่การสแกนไม่ผ่าน
        S.ctx.reason = msg;
        // เก็บรูปหลักฐาน + GPS ไว้ก่อนปิดกล้อง เผื่อพนักงานกดส่งคำขออนุมัติพิเศษ
        var keep = (S.stream && S.video && S.video.videoWidth)
          ? snapshotBlob(snapOpt).then(function (b) {
              closeMyCam();
              /* [ข้อ 4] Blob เสร็จหลัง Retry/Cancel = ห้ามสร้าง Fetch ใหม่เด็ดขาด */
              if (!own()) return null;
              return uploadSnapshot(b, 'REQUEST', kind, null).catch(function () { return null; });
            }).catch(function () { closeMyCam(); return null; })
          : (closeMyCam(), Promise.resolve(null));   // [RUN-215] ไม่มีภาพให้เก็บ = ปิดกล้อง/ยกเลิกคำขอกล้องที่ค้าง ไม่เปิดค้าง
        /* [ข้อ 1+2] เก็บหลักฐานสำหรับ "คำขออนุมัติพิเศษ" แบบ Async
           ทุกจุดตรวจ own() ก่อนเขียน S.ctx — ถ้าผู้ใช้กด "ลองใหม่" ระหว่างนี้
           Attempt เก่าจะไม่เขียนทับ Snapshot/GPS ของ Attempt ใหม่
           และ gpsStop(aid) จะไม่หยุด watch ของ Attempt ใหม่ */
        /* [ข้อ 2] หลักฐานสำหรับ "คำขออนุมัติพิเศษ" — เก็บใน local ก่อน
           แล้ว Commit เข้า S.ctx ครั้งเดียวเมื่อยังเป็นเจ้าของจริง */
        keep.then(function (path) {
          return gpsFresh(aid).then(function (g) { return { snapshot: path, gps: g }; },
                                    function () { return { snapshot: path, gps: null }; });
        }).then(function (ev) {
          if (!own()) return;                // Attempt เก่า = ห้ามเขียนแม้แต่ field เดียว
          S.ctx.snapshot = ev.snapshot;
          if (ev.gps) S.ctx.gps = ev.gps;
          S.ctx.ready = true;                 // [ข้อ 5] Evidence ของ Attempt นี้พร้อมแล้ว
        }).catch(function () { if (own()) S.ctx.ready = true; })
          .then(function () { gpsStop(aid); });
        /* [RUN-221] ขั้นที่ "กำลังทำ" ถูกแสดงเป็นไม่ผ่านเฉพาะเมื่อขั้นนั้นคือต้นเหตุจริง
           เดิม: ทุกสาเหตุระหว่างสแกน (หมดเวลาจัดตำแหน่ง · AI ช้า · กล้อง · Session) ขึ้น "ตรวจคนจริง: ไม่ผ่าน" ทั้งที่ยังไม่ได้ตรวจ
           OTHER (ไม่ทราบประเภท) = แสดงแบบเดิม */
        if (st.live === 'run') st.live = (fk === 'LIVE' || fk === 'OTHER') ? 'bad' : 'wait';
        else if (st.match === 'run') st.match = (fk === 'MATCH' || fk === 'OTHER') ? 'bad' : 'wait';
        if (fk === 'GPS') st.gps = 'bad';
        panel(stepsHtml(st, msg, true));
        var acts = [{ label: 'ยกเลิก', style: 'plain', on: close }];
        var maxTry = Number(w.NJHR_FACE_MAX_ATTEMPTS || 3);
        if (S.attempts < maxTry) {
          acts.unshift({ label: (androidTimedOut ? 'ลองใหม่ · โหมดสำรอง (' : 'ลองใหม่ (') + S.attempts + '/' + maxTry + ')', style: 'primary',
            on: function () {
              var carryN = S.attempts;
              close();                        // close() เรียก opInvalidate() + gpsStop() ให้แล้ว
              FLOW.carry = { kind: kind, n: carryN };   // [RUN-214] นับ Retry ต่อจากเดิม ไม่เริ่ม 1 ใหม่
              setTimeout(function () { punch(kind, onDone); }, 60);
            } });
        } else {
          acts.unshift({ label: 'ส่งคำขออนุมัติลงเวลา', style: 'primary',
            on: function () { specialRequest(kind, msg, onDone); } });
        }
        /* [RUN-214] Backend AI ค้าง/หลุด = กู้คืนในหน้านี้ไม่ได้อย่างปลอดภัย -> บอกสาเหตุ + ทางออกที่ชัดเจน
           [RUN-221 · R3] "โหลดหน้าใหม่" เฉพาะเมื่อกู้ในหน้าไม่ได้จริง:
             FACE_BACKEND_LOST = Backend หลุดและกู้อัตโนมัติไม่สำเร็จ (ระบบกู้ให้ก่อนแล้วไม่เกิน INF_RECOVER_MAX ครั้ง)
             FACE_BACKEND_STUCK ครั้งที่ 2 ขึ้นไป = รองานเดิมครบเวลาแล้วยังไม่จบ
           STUCK ครั้งแรก = "ลองใหม่" (รองานเดิมก่อน ไม่ซ้อน) — ไม่ส่งผู้ใช้ไปโหลดหน้าใหม่ */
        if (e && (e.faceCode === 'FACE_BACKEND_LOST' || (e.faceCode === 'FACE_BACKEND_STUCK' && INF.stuck >= 2))) {
          acts.push({ label: 'โหลดหน้าใหม่', style: 'ghost', on: function () {
            close();
            try { w.location.reload(); } catch (eR) {}
          } });
        }
        if (fk === 'SESSION') {                 // [RUN-221 · P1] ไม่มีปุ่มลองใหม่/ส่งคำขอ — ต้องเข้าระบบใหม่ก่อน
          acts = [{ label: 'ยกเลิก', style: 'plain', on: close },
                  { label: 'เข้าสู่ระบบใหม่', style: 'primary', on: function () { close(); sessLogout(true); } }];
        }
        actions(acts);
        S.busy = false;
    }
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

    var attMode = !!S.attDone;
    box.querySelector('#njf-done').onclick = function () {
      /* [RUN-213] มี S.attDone (จอสแกนลงเวลา) = close('DONE') เป็นผู้เรียก onDone ครั้งเดียว
         ไม่มี = เส้นทางเดิมทุกประการ */
      if (attMode) { close('DONE'); return; }   // กดซ้ำ = S.attDone ถูกใช้ไปแล้ว -> ไม่เรียก onDone รอบสอง
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
  function specialRequest(kind, failReason, onDone, opt) {
    /* [RUN-218] opt (ใช้จากหน้าจอ "รอตรวจสอบผลบันทึก"): at = เวลาที่ส่งคำสั่งเดิม · workDate · head · note (Request ID) · after (ส่งสำเร็จ)
       ไม่ส่ง opt = พฤติกรรมเดิมทุกประการ */
    opt = opt || {};
    var now = opt.at ? new Date(opt.at) : new Date();
    var pad2 = function (n) { return ('0' + n).slice(-2); };
    var todayISO = opt.workDate || (now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate()));
    var c = S.ctx || {};
    var g = c.gps || {};

    panel(
      '<div class="njf-msg">' + (opt.head ? esc(opt.head) : 'สแกนใบหน้าไม่ผ่าน — ส่งคำขอให้หัวหน้าอนุมัติลงเวลาแทน') + '</div>' +
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
          ].concat(opt.note ? [opt.note] : []).join(' | ');

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
            if (typeof opt.after === 'function') { try { opt.after(r); } catch (eA) {} }
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
    if (S.busy) return;                       // [RUN-219] กันกดซ้ำ "ก่อน" แตะ State ใด ๆ (เดิมเปลี่ยน EN.id / S.mode ของงานที่กำลังทำอยู่ก่อนแล้วค่อยตรวจ)
    var myRun = ++EN.id;
    netOwn('E' + myRun);                      // [ข้อ 4] Network ของ Enrollment Run นี้
    var evE = telBegin('ENROLL');             // [RUN-222] บันทึก Log อย่างเดียว — Logic/หน้าจอลงทะเบียนไม่เปลี่ยน
    var enAlive = function () {
      if (myRun !== EN.id) return false;                 // Run เก่า = ตายทันที
      return enAtt ? (enOp === null || opAlive(enOp)) : true;
    };
    S.mode = enAtt ? 'ATTENDANCE' : 'ENROLL';
    S.busy = true;
    /* opts.password มีค่า = "ลงทะเบียนใบหน้าใหม่" (ทับของเดิม)
       ต้องยืนยันรหัสผ่านมาแล้วจากหน้าข้อมูลส่วนตัว และฐานข้อมูลตรวจซ้ำอีกชั้น
       ⚠ ของเดิมจะถูกแทนที่ก็ต่อเมื่อ RPC สำเร็จเท่านั้น — ระหว่างถ่าย 3 มุมไม่แตะของเดิมเลย */
    var reNew = !!(opts && opts.password);
    /* [ANDROID TIMEOUT FALLBACK]
       เปิดได้เฉพาะ Enrollment รอบที่ผู้ใช้กด "ลองใหม่" หลัง FACE_INFER_TIMEOUT บน Android
       เท่านั้น — รอบปกติ / iOS / Desktop / Android ที่ไม่ Timeout ไม่เข้าเส้นนี้เด็ดขาด
       โหมดสำรองเก็บหน้าตรง 4 Descriptor จาก 4 เฟรมจริง และยังผ่าน Liveness/Quality ครบ */
    var fallbackFront = !!(opts && opts.androidTimeoutFallback) &&
                        (function () { try { return deviceInfo().os === 'Android'; } catch (e) { return false; } })();
    var poses = fallbackFront ? [POSES[0]] : POSES;
    var FALLBACK_SAMPLES = 4;
    var FALLBACK_INFER_TIMEOUT_MS = 20000;
    shell(reNew ? 'ลงทะเบียนใบหน้าใหม่' : 'ลงทะเบียนใบหน้า',
          fallbackFront ? 'โหมดสำรอง · มองตรง 4 ตัวอย่าง' : 'เก็บใบหน้า 3 มุม');
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
    /* [RUN-225 · local384] ความคืบหน้าเดิมของวงแหวน -> แถบ Progress แนวนอน + สีกรอบ 4 มุม (แสดงผลล้วน) */
    function rectProg(ratio, done) { attFrame(done ? 'ok' : null, Math.max(0, Math.min(1, Number(ratio) || 0))); }

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
        attFrame(hit ? 'ok' : (prog >= 0.7 ? 'run' : 'wait'));   // [RUN-225] สีเดิมของวงแหวนสด: ถึงเกณฑ์ = เขียว · ใกล้ = ฟ้า · ยัง = ขาว

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
        attFrame(done ? 'ok' : 'wait');                       // [RUN-225] มุมนี้ผ่าน = กรอบเขียว · เริ่มมุมใหม่ = ขาว
        if (turn) { turn.className = 'njf-turn' + (dir && !done ? ' show ' + dir : ''); }
        if (ok) { ok.classList.toggle('show', !!done); }
        if (hintArc) { hintArc.className.baseVal = 'njf-ring-hint' + (dir && !done ? ' ' + dir : ''); }
      } catch (e) {}
    }

    function drawPoses(msg, err, stepDone) {
      var cur = poses[idx] || poses[poses.length - 1];
      var shown = Math.min(idx + (stepDone ? 1 : 0), poses.length);
      var pct = Math.round((shown / poses.length) * 100);
      ringSet(shown / poses.length, !!stepDone);
      rectProg(shown / poses.length, !!stepDone);
      poseVisual(cur, !!stepDone);

      panel(
        '<div class="njf-steps">' + poses.map(function (p, i) {
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
        '<div class="njf-prog-txt">' + shown + '/' + poses.length + '</div>' +

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
    /* โหมดสำรองลดงานเฉพาะ Enrollment รอบสำรอง: 4 เฟรมจริง = 4 Descriptor
       passiveLivenessCore รองรับตั้งแต่ 4 เฟรมขึ้นไปอยู่แล้ว; Threshold อื่นไม่เปลี่ยน */
    var liveFrames = fallbackFront ? FALLBACK_SAMPLES : LIVE_FRAMES;
    var enrollInferMs = fallbackFront ? FALLBACK_INFER_TIMEOUT_MS : ENROLL_INFER_TIMEOUT_MS;
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
      var pose = poses[idx];
      /* holding = ยังโชว์ ✓ ของมุมก่อนหน้าอยู่ — ตรวจจับเดินแล้ว แต่ยังไม่เขียนทับจอ */
      var holding = !!(opt && opt.holdMs > 0);
      function paintPose() {
        holding = false;
        hint(pose.hint, 'ระบบจะจับภาพอัตโนมัติเมื่อท่าถูกต้อง');
        drawPoses('กำลังตรวจ: ' + pose.label);
      }
      if (holding) {
        setTimeout(function () {
          if (!S.running || !enAlive() || poses[idx] !== pose) return;
          paintPose();
        }, opt.holdMs);
      } else {
        paintPose();
      }
      /* ระหว่าง holding ห้ามเขียนข้อความ/วงแหวนทับหน้าจอ "ครบแล้ว ✓" */
      function msg(t, err) { if (!holding) setMsg(t, err); }
      function live(p, y) { if (!holding) poseLive(p, y); }
      var t0 = Date.now(), buf = [], stable = 0, errRun = 0, errFirst = 0;
      var fallbackWaitingRecog = false;
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
      function fatal(reason, useAndroidFallback) {
        telEnd(evE, 'FAIL', { stage: 'SCAN', cam: telCam(),
                  code: String((reason && (reason.camCode || reason.faceCode || reason.faceStage)) || 'ENROLL_SCAN_FAIL') });   // [RUN-222] บันทึกอย่างเดียว
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
            var nextOpts = opts;
            if (useAndroidFallback) {
              nextOpts = {};
              if (opts) {
                Object.keys(opts).forEach(function (k) { nextOpts[k] = opts[k]; });
              }
              nextOpts.androidTimeoutFallback = true;
            }
            close(); setTimeout(function () { enroll(employeeId, onDone, nextOpts); }, 60);
          } }
        ]);
      }

      /* ยอมรับมุมนี้ — เรียกได้ก็ต่อเมื่อ Liveness ผ่านจริงแล้วเท่านั้น
         (ผ่าน Passive ตรง ๆ หรือผ่าน Blink Challenge) ไม่มีเส้นทางอื่นเข้าถึงจุดนี้ */
      function acceptPose(lvMethod) {
        /* [ข้อ 6] ตรวจ Owner ก่อนเขียน State / Upload / ไป Pose ถัดไป */
        if (!enAlive()) { closeCam(); return; }
        perfMark('enroll_' + pose.key.toLowerCase() + '_ms', poseT0);
        if (fallbackFront) {
          /* 4 ตัวอย่างต้องมาจาก 4 เฟรมจริงคนละเวลา — ไม่ clone/reuse Descriptor */
          var takeFrom = Math.max(0, buf.length - FALLBACK_SAMPLES);
          for (var gi = takeFrom; gi < buf.length; gi++) got.push(buf[gi].desc);
        } else {
          got.push(buf[buf.length - 1].desc);
        }
        /* [ROOT CAUSE 7] มุมสุดท้ายที่ผ่าน Liveness จริง = หลักฐานสดของ Run นี้
           เก็บ Descriptor ตัวล่าสุด + Liveness Method จริงที่ผ่าน (PASSIVE หรือ BLINK)
           ไม่ Clone · ไม่ Reuse ข้ามมุม · ผูกกับ Attendance Operation เดียวกันเท่านั้น */
        if (enAtt && enOp !== null && enKind && idx === poses.length - 1) {
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
        if (idx >= poses.length) return finish();
        /* [PERF] เริ่มตรวจมุมถัดไปทันที ไม่หน่วง 700 ms — จอยังค้าง ✓ ไว้ DONE_HOLD */
        capturePose({ holdMs: DONE_HOLD });
      }

      /* Passive ก้ำกึ่ง → ต้องกระพริบตายืนยันจริง ห้ามข้ามเด็ดขาด
         ใช้ Camera Stream เดิม (blinkChallenge ไม่เปิด/ปิดกล้อง) และผูก Owner เป็น enAlive() */
      function runChallenge(reason) {
        msg(reason || 'ตรวจสอบบุคคลจริงไม่แน่ใจ กรุณากระพริบตา 1 ครั้ง', true);
        blinkChallenge(function (t) {
          if (S.running && enAlive()) msg(t, true);
        }, enAlive, enrollInferMs).then(function (ok) {
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
        /* โหมดสำรอง: เมื่อท่าหน้าตรงนิ่งครบแล้ว ให้หยุด Guide Inference ชั่วคราวระหว่าง
           เตรียม Recognition Model เพื่อไม่ให้สองงานหนักแข่ง Main Thread บน Android รุ่นช้า */
        if (fallbackFront && fallbackWaitingRecog) {
          if (!S.recogReady) {
            msg('ท่าถูกต้องแล้ว — กำลังเตรียมระบบยืนยันใบหน้า…');
            setTimeout(again, 120);
            return;
          }
          fallbackWaitingRecog = false;
          stable = 0; t0 = Date.now();
        }
        var waitRecog = (stable >= STABLE_MIN) && !S.recogReady;
        if (fallbackFront && waitRecog) {
          fallbackWaitingRecog = true;
          t0 = Date.now();
          recogPrefetch();
          msg('ท่าถูกต้องแล้ว — กำลังเตรียมระบบยืนยันใบหน้า…');
          setTimeout(again, 120);
          return;
        }
        if (waitRecog) t0 = Date.now();
        if (!waitRecog && Date.now() - t0 > POSE_TIMEOUT) {
          resetPose('ยังจับภาพ' + pose.label + 'ไม่สำเร็จ — ปรับแสงและระยะ แล้วทำท่าเดิมต่อได้เลย');
          return again();
        }
        /* stable ครบ "และ" Recognition พร้อม เท่านั้นจึงยอมจ่ายค่า Descriptor ของเฟรมนี้ */
        var capturing = (stable >= STABLE_MIN) && !!S.recogReady;
        if (waitRecog) recogPrefetch();       // เผื่อยังไม่ได้เริ่ม (Single-flight ไม่โหลดซ้ำ)
        (capturing ? detect(enrollInferMs) : detectGuide(enrollInferMs)).then(function (r) {
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
          msg('กำลังจับภาพ ' + pose.label + ' (' + buf.length + '/' + liveFrames + ')');
          if (buf.length < liveFrames) return again();

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
          /* รอบปกติ Android ถ้าเจอ FACE_INFER_TIMEOUT จริง → หยุดรอบนี้และให้ผู้ใช้กด
             "ลองใหม่" เพื่อเข้าโหมดหน้าตรง 4 ตัวอย่างอัตโนมัติ
             ไม่ใช้กับ Face mismatch / Liveness / แสง / กล้อง / GPS และไม่แตะอุปกรณ์อื่น */
          if (e && e.faceCode === 'FACE_INFER_TIMEOUT') {
            if (!fallbackFront) {
              var isAndroid = false;
              try { isAndroid = deviceInfo().os === 'Android'; } catch (e0) {}
              if (isAndroid) {
                return fatal('ตรวจใบหน้าไม่ทันเวลา — กด “ลองใหม่” เพื่อใช้โหมดสำรอง มองตรง 4 ตัวอย่าง', true);
              }
            } else {
              return fatal('โหมดสำรองยังประมวลผลใบหน้าไม่ทันเวลา — กรุณากด “ลองใหม่” อีกครั้ง', true);
            }
          }
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
      var items = (fallbackFront
        ? '<div class="njf-save-li"><b>&#10003;</b>' + esc('บันทึกหน้าตรง ' + FALLBACK_SAMPLES + ' ตัวอย่าง') + '</div>'
        : poses.map(function (p) {
            return '<div class="njf-save-li"><b>&#10003;</b>' + esc('บันทึกมุม' + p.label) + '</div>';
          }).join('')) +
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
      var q = { samples: got.length, captured_at: new Date().toISOString(), capture_mode: fallbackFront ? 'ANDROID_TIMEOUT_FRONT_4' : 'THREE_POSE' };
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
      evE.sent = true;                           // [RUN-222] ส่งคำสั่งบันทึกแล้ว: ปิดจอหลังจุดนี้ = UNKNOWN (บันทึก Log อย่างเดียว)
      rpc(fnName, body).then(function (r) {
        if (!enAlive()) { closeCam(); return; }   // [ข้อ 4] ถูกยกเลิกหลังส่ง = ไม่แสดงผล ไม่ Handoff
        faceStatusReset();     // [PERF/ถูกต้อง] Enrollment เปลี่ยน = Cache เดิมใช้ไม่ได้
        saveProgressStop();
        telEnd(evE, 'OK', { stage: 'DONE', code: 'OK', cam: 'OK', sess: 'OK', live: 'PASS' });   // [RUN-222] เซิร์ฟเวอร์บันทึกแล้ว
        perfEnd('total_enrollment_ms');
        /* [UI] หน้าจอสำเร็จ — วงกลมเขียว ✓ + สรุปมุมที่เก็บได้
           ไม่แสดงรูปใบหน้าจริง (Snapshot อยู่ใน bucket private) จึงใช้ป้ายมุมแทน */
        panel(
          '<div class="njf-done">' +
          '<div class="njf-done-ic">&#10003;</div>' +
          '<div class="njf-done-t">' +
            esc(reNew ? 'ลงทะเบียนใบหน้าใหม่ สำเร็จ!' : 'ลงทะเบียนใบหน้า สำเร็จ!') + '</div>' +
          '<div class="njf-done-s">พร้อมใช้งานสแกนหน้าเข้าสู่ระบบ</div>' +
          '<div class="njf-done-tags">' + (fallbackFront
            ? '<span class="njf-done-tag"><b>&#10003;</b>' + esc('หน้าตรง ' + FALLBACK_SAMPLES + ' ตัวอย่าง') + '</span>'
            : poses.map(function (p) {
                return '<span class="njf-done-tag"><b>&#10003;</b>' + esc(p.label) + '</span>';
              }).join('')) + '</div>' +
          '<div class="njf-done-n">เก็บใบหน้าไว้ ' +
            ((r && r.sample_count) || got.length) + (fallbackFront ? ' ตัวอย่าง' : ' มุม') + '</div>' +
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
        var sxE = sessGone(e), srvE = !!(e && e.httpStatus);   // [RUN-222] บันทึกอย่างเดียว: เซิร์ฟเวอร์ตอบปฏิเสธ = FAIL · ส่งแล้วไม่มีคำตอบ = UNKNOWN
        telEnd(evE, sxE ? 'SESSION_EXPIRED' : (srvE ? 'FAIL' : 'UNKNOWN'), { stage: 'SAVE', sess: sxE ? 'EXPIRED' : 'NA',
                  code: sxE ? 'SESSION_EXPIRED' : (srvE ? 'ENROLL_SAVE_HTTP_' + e.httpStatus : 'ENROLL_SAVE_NO_RESPONSE') });
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
    /* รอบปกติคงพฤติกรรมเดิมทุกอุปกรณ์; รอบ fallback เท่านั้นเลื่อน Recognition
       ไปเริ่มหลังหน้าตรงนิ่งครบ เพื่อไม่ให้ compile แข่งกับ Guide Detection */
    if (!fallbackFront) recogPrefetch();
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
      telEnd(evE, 'FAIL', { stage: 'CAMERA', cam: telCam(), code: String((e && (e.camCode || e.faceCode)) || 'ENROLL_OPEN_FAIL') });   // [RUN-222] บันทึกอย่างเดียว
      closeCam();                              // ฝั่งใดฝั่งหนึ่งล้มเหลว ต้องไม่ปล่อยกล้องค้างเปิด
      drawPoses((e && e.message) || 'เปิดกล้องไม่สำเร็จ', true);
      actions([{ label: 'ปิด', style: 'plain', on: close }]);
      S.busy = false;
    });
  }

  /* ---------- ปิดกล้องเมื่อออกจากหน้า ---------- */
  w.addEventListener('hashchange', function () { camLifeLog('ROUTE_CHANGE_CLOSE'); close('ROUTE_CHANGE_CLOSE'); });
  /* ---------- [ข้อ 6] Background Cleanup แบบรู้โหมด ----------
     เดิม pagehide / visibilitychange เรียกแค่ closeCam() ซึ่งไม่พอสำหรับการลงเวลา
     เพราะ GPS Watch · Attendance Operation · Network ของ Attempt ยังทำงานต่อ

     ATTENDANCE / ENROLL → ยกเลิกทั้ง Operation อย่างปลอดภัย
        (invalidate OP+EN · closeCam+RAF · stop GPS Watch · abort Attempt Network · ปิด Overlay)
     LOGIN (Face Login) → คงพฤติกรรมเดิมทุกประการ: ปิดกล้องอย่างเดียว ไม่แตะ Logic
        เหตุผล: Face Login ไม่มี GPS/Operation และการปิด Flow ทิ้งจะทำให้ผู้ใช้
        กลับมาแล้วเจอหน้าจอค้าง — เดิมทำงานถูกอยู่แล้วจึงไม่แตะ */
  function bgCleanup(reason) {
    if (S.mode === 'ATTENDANCE' || S.mode === 'ENROLL') { close(reason); return; }
    closeCam(reason);
  }

  /* ---------- [LIFECYCLE] กลับมา visible ----------
     ลำดับตัดสินใจใช้ "สถานะจริง" ทั้งหมด ไม่มี setTimeout เดาสุ่ม:
       1. Overlay ยังอยู่ไหม        -> ไม่อยู่ = ไม่ใช่ Flow เดิม ไม่ต้องทำอะไร
       2. มี Stream ไหม             -> ไม่มี = ยังไม่เคยเปิดกล้อง
       3. Track ยัง live ไหม        -> ไม่ live = ตายจริง จึงเปิดใหม่ได้ (ทางเดียวที่อนุญาต)
       4. srcObject ยังผูกอยู่ไหม   -> หลุด = ผูกกลับกับ Stream เดิม ไม่เปิดใหม่
       5. <video> paused ไหม        -> paused = play() กับ Stream เดิมก่อนเสมอ */
  function camResumeVisible() {
    if (!S.root || !S.video) return;
    if (!S.stream) return;
    if (!camStreamLive()) {
      /* Stream ตายจริง = ทางเดียวที่อนุญาตให้เปิดกล้องใหม่
         การ Log STREAM_ENDED_REOPEN ทำที่ openCam() ที่เดียว เพื่อไม่ให้นับซ้ำ */
      if (CAM.resuming) return;
      CAM.resuming = true;
      try {
        openCam().then(function () { CAM.resuming = false; },
                       function () { CAM.resuming = false; });
      } catch (e) { CAM.resuming = false; }
      return;
    }
    var v = S.video;
    if (v.srcObject !== S.stream) { try { v.srcObject = S.stream; } catch (e) {} }
    if (v.paused) {
      camLifeLog('VISIBILITY_VISIBLE_PLAY_RESUME');
      try {
        var p = v.play();
        if (p && typeof p['catch'] === 'function') p['catch'](function () {});
      } catch (e) {}
      return;
    }
    camLifeLog('VISIBILITY_VISIBLE_REUSE_STREAM');
  }

  w.addEventListener('pagehide', function (e) {
    /* [ข้อ 4] pagehide ที่ persisted = เข้า bfcache ยังมีโอกาสกลับหน้าเดิม
       ถ้า Flow ยัง Active ห้ามทำลาย State — เบราว์เซอร์เป็นผู้ระงับ Track เองระหว่างถูก Freeze */
    if (e && e.persisted === true && camFlowActive()) {
      camLifeLog('PAGEHIDE_BFCACHE_KEEP');
      return;
    }
    camLifeLog('PAGEHIDE_REAL_CLOSE');
    bgCleanup('PAGEHIDE_REAL_CLOSE');
  });

  d.addEventListener('visibilitychange', function () {
    /* [RUN-214] จอสแกนลงเวลา: จำเวลาที่ถูกพัก/กลับมา — inference ที่ค้างเพราะพักจอไม่นับเป็น Timeout ของเครื่อง
       กลับมาแล้วพักเก็บเฟรมชั่วครู่ ให้ Stream/Video ส่งเฟรมใหม่จริงก่อนตรวจต่อ (ลูปตรวจรอเฟรมใหม่เองอีกชั้น) */
    try {
      if (d.hidden) INF.hiddenAt = Date.now();
      else {
        INF.visAt = Date.now();
        if (attScanOn()) ATT_LOCK.busyUntil = Math.max(ATT_LOCK.busyUntil || 0, Date.now() + 600);
      }
    } catch (eV) {}
    if (d.hidden) {
      /* [ข้อ 1] ซ่อนชั่วคราวขณะ Flow ยังทำงาน = ห้าม track.stop() / srcObject=null
         GPS ไม่ได้ถูกยืดอายุจากตรงนี้: gpsPickFresh() ยังกรอง Fix ด้วย GPS_FRESH_MS/GPS_LIVE_MS
         ตามเดิม Fix เก่าก่อนสลับแอปจึงใช้ลงเวลาไม่ได้อยู่แล้ว */
      if (camFlowActive()) { camLifeLog('VISIBILITY_HIDDEN_KEEP_STREAM'); return; }
      bgCleanup('VISIBILITY_HIDDEN');
      return;
    }
    camResumeVisible();
  });

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
    var myL = ++LG.id;                        // [RUN-219] ปิด/ยกเลิก/เริ่มรอบใหม่ = รอบนี้หมดสิทธิ์
    var evL = telBegin('LOGIN');              // [RUN-222] บันทึก Log อย่างเดียว — Logic/หน้าจอ Face Login ไม่เปลี่ยน
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
        attFrame('run', 0.15);                 // [RUN-225] แสดงผลล้วน: ฟ้า = กำลังตรวจสอบ
        actions([{ label: 'ยกเลิก', style: 'ghost', on: function () {
          close(); if (typeof onCancel === 'function') onCancel();
        } }]);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        return grabFrames(6, function (warn) { if (warn) setMsg(warn, true); attFrame(warn ? 'adjust' : 'run'); });
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
        attFrame('run', 0.7);                  // [RUN-225] แสดงผลล้วน
        camLifeLog('FLOW_COMPLETE_CLOSE');
        closeCam('FLOW_COMPLETE_CLOSE');       // ปิดกล้องก่อนยิงเซิร์ฟเวอร์
        panel(stepsHtml(st, 'กำลังยืนยันตัวตน…'));
        /* [RUN-200] เดิม: ctx.frames[ctx.frames.length - 1] (เฟรมสุดท้าย) */
        var best = pickBestFrame(ctx.frames) || ctx.frames[ctx.frames.length - 1];
        if (typeof w.NJHR_faceLogin !== 'function') {
          throw new Error('ระบบเข้าสู่ระบบด้วยใบหน้ายังไม่พร้อมใช้งาน');
        }
        perfMark('client_face_ms');                 // เวลาฝั่ง Client ล้วน (ยังไม่รวม RPC)
        var tRpc = perfNow();
        evL.sent = true;                            // [RUN-222] ส่งคำขอเข้าระบบแล้ว (บันทึก Log อย่างเดียว)
        return w.NJHR_faceLogin(best.desc, ctx.live.method).then(function (row) {
          perfMark('rpc_ms', tRpc);                 // เวลาฝั่ง Server ล้วน — ห้ามรวมเป็นตัวเลขเดียว
          return row;
        });
      })
      .then(function (row) {
        if (myL !== LG.id) return;             // [RUN-219] รอบเก่า (ถูกปิด/ยกเลิกไปแล้ว) = ไม่แตะ State ไม่ปิดหน้าจอของรอบใหม่
        perfEnd('total_face_login_ms');
        telEnd(evL, 'OK', { stage: 'DONE', code: 'OK', live: 'PASS', match: 'PASS', cam: 'OK' });   // [RUN-222] เซิร์ฟเวอร์ยืนยันแล้ว
        st.match = 'ok';
        attFrame('ok', 1);                     // [RUN-225] แสดงผลล้วน
        panel('<div class="njf-check" style="margin:0 auto 12px">&#10003;</div>' +
          '<div class="njf-msg"><b>เข้าสู่ระบบสำเร็จ</b><br>' +
          esc(row.emp_name || row.username || '') + '</div>');
        S.busy = false;
        close();
        if (typeof onOk === 'function') onOk(row);
      })
      ['catch'](function (e) {
        if (myL !== LG.id) return;             // [RUN-219] รอบเก่า = ไม่ปิดกล้อง/ไม่เขียนหน้าจอ/ไม่แตะ S.busy ของรอบใหม่
        /* [RUN-222] บันทึกอย่างเดียว: ยังไม่ได้ส่ง = FAIL ที่ขั้นสแกน · ส่งแล้วเซิร์ฟเวอร์ตอบว่าไม่สำเร็จ = FAIL (เซิร์ฟเวอร์ไม่ยืนยันตัวตน)
           ส่งแล้วไม่มีคำตอบ (fetch ล้ม) = UNKNOWN — คำขอเข้าระบบของ core.js ไม่ส่งรหัส HTTP กลับมา จึงไม่ระบุว่า "ใบหน้าไม่ตรง" (ไม่ทราบจริง) */
        var netL = !!(e && (e.name === 'TypeError' || e.name === 'AbortError'));
        telEnd(evL, (evL.sent && netL) ? 'UNKNOWN' : 'FAIL', {
                  stage: evL.sent ? 'MATCH' : String((e && e.faceStage) || 'SCAN'),
                  code: evL.sent ? (netL ? 'LOGIN_NO_RESPONSE' : 'LOGIN_NOT_CONFIRMED')
                                 : String((e && (e.camCode || e.faceCode || e.faceStage)) || 'FLOW_ERROR'),
                  cam: evL.sent ? 'OK' : telCam(),
                  live: st.live === 'ok' ? 'PASS' : (/บุคคลจริง/.test(String((e && e.message) || '')) ? 'FAIL' : 'NA'),
                  match: evL.sent ? (netL ? 'UNKNOWN' : 'NOPASS') : 'NA' });   // [RUN-222] บันทึกอย่างเดียว
        attFrame('bad');                       // [RUN-225] แสดงผลล้วน: แดง = ไม่ผ่าน
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
    /* [RUN-214] ตัวเลขวินิจฉัย (อ่านอย่างเดียว): งาน AI ซ้อน/ค้าง · เฟรมกล้อง · Tensor · จำนวน Retry */
    diag: function () {
      return { inf: { runs: INF.runs, overlap: INF.overlap, late: INF.late, stuck: INF.stuck,
                      busy: !!INF.cur, lost: !!INF.lost, recovered: INF.recovered || 0, orphan: INF.orphan || 0,
                      guideMs: aiMedian(INF.sg), descMs: aiMedian(INF.sd), inferLimitMs: attendanceInferTimeoutMs(),
                      warmMs: INF.warmMs == null ? null : INF.warmMs, modelGen: MODEL.gen },
               req: { server: reqSrvState(), pending: !!pendLoad(), mode: (pendLoad() || {}).mode || null },
               att: { busy: !!S.busy, op: OP.id, lock: LOCK.mode },
               ai: { okN: INF.okN || 0, coldN: INF.coldN || 0, cold: !INF.okN },
               tel: { n: TEL.n, mode: TEL.mode, off: TEL.mode === 'OFF', last: TEL.last, ok: TEL.stat.ok, rejected: TEL.stat.rejected,
                      na: TEL.stat.na, net: TEL.stat.net, legacy: TEL.stat.legacy, retry: TEL.stat.retry, open: !!TEL.cur },
               gate: { pos: attFacePosGateOn(), att: attScanOn() },
               frame: { rvfc: !!FR.ok, n: FR.n }, tf: tfMem(), attempts: S.attempts,
               stream: !!S.stream, running: !!S.running };
    },
    /* อุ่นเครื่องระบบตรวจใบหน้าไว้ล่วงหน้า (ไลบรารี + โมเดล) แบบไม่บล็อกหน้าจอ
       ใช้ S.loading/S.ready ตัวเดิมเป็น State กลาง จึงไม่โหลดซ้ำและกัน Concurrent Load ได้เอง
       ล้มเหลวก็เงียบ — ตอนกดสแกนจริงจะโหลดใหม่ตามเส้นทางเดิม */
    warmup: function () {
      addCss();
      perfBootSet('face_warmup_start_ms', Math.round(perfNow() * 10) / 10);
      perfEvent('face_warmup_start');
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
      ]).then(function () { aiWarmSoon(); })['catch'](function () {});
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
      /* [RUN-184] Single-flight — ครั้งที่ 2 เป็นต้นไปคืน Promise เดิม ไม่ยิง fetch ซ้ำ */
      if (RECOG_BYTES.p) return RECOG_BYTES.p;
      swModelBind();
      swModelBeginLoad();
      var urls = [MODEL_URL_LOCAL + '/face_recognition_model-weights_manifest.json',
                  MODEL_URL_LOCAL + '/face_recognition_model.bin'];
      var t0 = perfNow();
      RECOG_BYTES.p = Promise.all(urls.map(function (u) {
        return fetch(u, { cache: 'force-cache' })['catch'](function () { return null; });
      })).then(function () {
        perfDur('recognition_bytes_prefetch_ms', t0);
      })['catch'](function () {});
      return RECOG_BYTES.p;
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
        var seeded = { ok: true, lat: Number(fix.lat), lng: Number(fix.lng),
                       accuracy: acc, at: at, sid: G.sid };
        G.fixes.push(seeded);
        /* [STEP-0B ข้อ 4-7] Fix นี้เกิดก่อน face.js — ต้องใช้เวลาเดิมของมัน
           ฐานเวลาคือจุดที่ GPS Bootstrap เริ่มจริง (ส่งมาจาก attGpsBootStart)
           ถ้าไม่มีฐาน หรือคำนวณได้ติดลบ = รายงาน INVALID ห้าม Clamp เป็น 0 */
        if (perfOn()) {
          seeded.__pseq = perfGpsFix(seeded, 'bootstrap_seed');
          if (PERF.boot.marks.gps_first_fix_ms == null) {
            perfBootSet('gps_first_fix_ms', perfGpsDelta(at));
          }
          perfBootCount('gps_fix_count');
          perfEvent('gps_first_fix', { accuracy: Math.round(acc), source: 'bootstrap_seed' });
        }
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
      close('CANCEL');                         // closeCam + cancelAnimationFrame + clearWatch + invalidate aid
      return true;
    },
    mode: function () { return S.mode || ''; }
  };
})(window, document);
