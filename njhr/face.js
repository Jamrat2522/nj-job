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

  var FACE_API_SRC = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js';
  var MODEL_URL = w.NJHR_FACE_MODEL_URL ||
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

  var S = {
    ready: false, loading: null, cssAdded: false,
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
  function fetchT(url, opt, label) {
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timedOut = false;
    var ms = netTimeout();
    var timer = setTimeout(function () { timedOut = true; if (ctl) ctl.abort(); }, ms);
    var o = Object.assign({}, opt || {});
    if (ctl) o.signal = ctl.signal;
    return fetch(url, o).then(function (r) {
      clearTimeout(timer);
      return r;
    }, function (e) {
      clearTimeout(timer);
      if (timedOut) {
        throw new Error((label || 'การเชื่อมต่อ') + 'ใช้เวลานานเกินไป กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      }
      throw new Error((label || 'การเชื่อมต่อ') + 'ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    });
  }

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
        if (!r.ok) throw new Error((j && (j.message || j.error)) || ('เรียก ' + fn + ' ไม่สำเร็จ'));
        return Array.isArray(j) ? j[0] : j;
      });
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
        if (!r.ok) throw new Error((j && (j.message || j.error)) || ('เรียก ' + fn + ' ไม่สำเร็จ'));
        if (j == null) return [];
        return Array.isArray(j) ? j : [j];
      });
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

  function mobileAttendanceFaceStatus() {
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
        if (!r.ok) throw new Error(j.error || 'เข้าถึงรูปไม่สำเร็จ');
        return j;
      });
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
  function loadModels() {
    if (S.ready) return Promise.resolve();
    if (S.loading) return S.loading;
    S.loading = new Promise(function (res, rej) {
      if (w.faceapi) return res();
      var s = d.createElement('script');
      s.src = FACE_API_SRC; s.async = true;
      s.onload = res;
      s.onerror = function () { rej(new Error('โหลดไลบรารีตรวจใบหน้าไม่สำเร็จ ตรวจอินเทอร์เน็ต')); };
      d.head.appendChild(s);
    }).then(function () {
      var f = w.faceapi;
      return Promise.all([
        f.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        f.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        f.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
    }).then(function () {
      S.ready = true;
    }).catch(function (e) {
      S.loading = null;
      throw new Error(e.message || 'โหลดโมเดลตรวจใบหน้าไม่สำเร็จ');
    });
    return S.loading;
  }

  /* ---------- กล้อง ---------- */
  function openCam() {
    if (S.stream) return Promise.resolve(S.stream);   // กันเปิดซ้ำ
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('อุปกรณ์นี้ไม่รองรับการเปิดกล้อง'));
    }
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    }).then(function (st) {
      S.stream = st;
      S.video.srcObject = st;
      S.video.setAttribute('playsinline', '');   // iPhone ต้องมี ไม่งั้นเปิดเต็มจอ
      return S.video.play().then(function () { return st; });
    }).catch(function (e) {
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
  function grabFrames(count, onTick) {
    var out = [];
    return new Promise(function (res, rej) {
      var tries = 0;
      (function loop() {
        if (!S.running) return rej(new Error('ยกเลิกแล้ว'));
        detect().then(function (res2) {
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
          if (out.length >= count) return res(out);
          if (tries > count * 12) return rej(new Error('ตรวจใบหน้าไม่สำเร็จ กรุณาลองใหม่'));
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) { rej(e); });
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
  function uploadSnapshot(blob, kind, action, employeeId) {
    if (!blob) return Promise.resolve(null);
    return fn('upload-url', {
      kind: kind, punch_action: action || null,
      employee_id: employeeId || null, size: blob.size
    }).then(function (r) {
      return fetchT(r.upload_url,
        { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }, 'อัปโหลดภาพ')
        .then(function (up) {
          if (!up.ok) throw new Error('อัปโหลดภาพไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
          return r.path;
        });
    });
  }
  function snapshotUrl(path) {
    if (!path) return Promise.resolve('');
    return fn('view-url', { path: path }).then(function (r) { return r.url || ''; });
  }

  /* ---------- GPS ---------- */
  function getGps() {
    return new Promise(function (res) {
      if (!navigator.geolocation) return res({ ok: false, reason: 'อุปกรณ์นี้ไม่รองรับ GPS' });
      navigator.geolocation.getCurrentPosition(function (p) {
        res({ ok: true, lat: p.coords.latitude, lng: p.coords.longitude,
              accuracy: p.coords.accuracy });
      }, function (e) {
        res({ ok: false, reason: e && e.code === 1
          ? 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — เปิดสิทธิ์ตำแหน่งแล้วลองใหม่'
          : 'ไม่สามารถอ่าน GPS ได้ กรุณาลองใหม่กลางที่โล่ง' });
      }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
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
  function close() {
    closeCam();
    if (S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    S.root = null; S.busy = false;
  }

  /* ---------- ลงเวลาด้วยใบหน้า ---------- */
  /* ---------- ลงเวลา ----------
     ถ้ายังไม่มีใบหน้าต้นแบบของพนักงานคนนี้ ให้ลงทะเบียน 3 มุมก่อนอัตโนมัติ
     แล้วจึงกลับมาลงเวลาตามปกติ (Face → Liveness → Snapshot ใหม่ → GPS → Geofence)
     ครั้งต่อไปจะข้ามขั้นลงทะเบียนทันที ไม่ต้องหันซ้าย-ขวาอีก */
  function punch(kind, onDone) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;

    /* แก้เฉพาะ Mobile Face Attendance:
       HR/SUPER_ADMIN ที่ส่ง p_employee=null จะได้หลายแถวจาก Production RPC
       จึงต้องระบุ employee_id ของ Session ปัจจุบันและห้ามเลือก [0] แบบสุ่ม
       Desktop คง Flow เดิมทุกประการตามขอบเขตงาน */
    if (deviceInfo().device === 'Mobile') {
      mobileAttendanceFaceStatus()
        .then(function (has) {
          if (has) { S.busy = false; return doPunch(kind, onDone); }
          S.busy = false;
          enrollThenPunch(kind, onDone);
        })
        ['catch'](function (e) {
          S.busy = false;
          attendanceStatusError(e);
        });
      return;
    }

    rpc('njhr_face_status', { p_token: token(), p_employee: null, p_q: null })
      .then(function (r) {
        /* Desktop คงพฤติกรรมเดิม — งานนี้แก้เฉพาะ Mobile */
        var row = Array.isArray(r) ? r[0] : r;
        return !!(row && row.enrolled && row.is_active);
      })
      ['catch'](function () { return true; })  // อ่านสถานะไม่ได้ → ไปเส้นทางเดิม ให้ RPC ตัดสิน
      .then(function (has) {
        if (has) { S.busy = false; return doPunch(kind, onDone); }
        S.busy = false;
        enrollThenPunch(kind, onDone);
      });
  }

  /* ลงทะเบียนใบหน้าต้นแบบครั้งแรก แล้วต่อด้วยการลงเวลาทันที
     ⚠ ลงทะเบียนสำเร็จ ≠ ลงเวลาสำเร็จ — ยังต้องผ่าน Face + Liveness + GPS + Geofence
       ถ้า GPS/Geofence ไม่ผ่าน ใบหน้าต้นแบบยังถูกเก็บไว้ ครั้งหน้าไม่ต้องลงทะเบียนใหม่ */
  function enrollThenPunch(kind, onDone) {
    enroll(null, function () {
      setTimeout(function () { doPunch(kind, onDone); }, 60);
    });
  }

  function doPunch(kind, onDone) {
    if (S.busy) return;                       // กันกดซ้ำ
    S.busy = true;
    var title = kind === 'IN' ? 'ลงเวลาเข้างาน' : 'ลงเวลาออกงาน';
    shell('สแกนใบหน้า', title);
    var st = { live: 'wait', match: 'wait', gps: 'wait' };
    panel(stepsHtml(st, 'กำลังเตรียมกล้อง…'));
    actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);

    var gpsP = getGps();                      // ขอ GPS พร้อมกันไปเลย ไม่ต้องรอ
    gpsP.then(function (g) {
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
        return grabFrames(6, function (warn) { if (warn) setMsg(warn, true); else setMsg('กำลังตรวจสอบบุคคลจริง…'); });
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
        setMsg('กำลังตรวจสอบบุคคลจริง…', false);
        hint('มองกล้องให้อยู่ในกรอบ', 'กรุณาอย่าขยับใบหน้า');
        return grabFrames(8, null).then(function (f2) {
          var lv2 = passiveLiveness(f2);
          if (lv2.pass) return { frames: f2, live: lv2 };
          throw new Error('ตรวจสอบบุคคลจริงไม่ผ่าน กรุณามองกล้องให้ชัดแล้วลองใหม่');
        });
      })
      .then(function (ctx) {
        st.live = 'ok'; st.match = 'run';
        panel(stepsHtml(st, 'กำลังเทียบใบหน้ากับข้อมูลที่ลงทะเบียน…'));
        actions([{ label: 'ยกเลิก', style: 'ghost', on: close }]);
        hint('กำลังบันทึก', 'กรุณาอย่าขยับใบหน้า');
        return snapshotBlob().then(function (b) {
          closeCam();                          // ปิดกล้องทันทีเมื่อได้ภาพครบ
          return uploadSnapshot(b, 'PUNCH', kind, null).then(function (path) {
            ctx.snapshot = path;
            return gpsP.then(function (g) { ctx.gps = g; return ctx; });
          });
        });
      })
      .then(function (ctx) {
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
        S.ctx.similarity = o.r ? o.r.similarity : null;
        S.ctx.distance = o.r ? o.r.verify_distance : null;
        S.ctx.liveness = true;
        S.ctx.liveness_method = o.ctx.live.method;
        S.ctx.snapshot = o.ctx.snapshot;
        S.ctx.gps = o.ctx.gps;
        if (!o.r || !o.r.ok) {
          st.match = 'bad';
          throw new Error((o.r && o.r.reason) || 'ยืนยันใบหน้าไม่สำเร็จ');
        }
        st.match = 'ok'; st.gps = 'ok';
        S.attempts = 0;
        showSuccess(kind, o.r, o.ctx, onDone);
      })
      .catch(function (e) {
        var msg = (e && e.message) || 'สแกนไม่สำเร็จ';
        S.attempts++;
        S.ctx.reason = msg;
        // เก็บรูปหลักฐาน + GPS ไว้ก่อนปิดกล้อง เผื่อพนักงานกดส่งคำขออนุมัติพิเศษ
        var keep = (S.stream && S.video && S.video.videoWidth)
          ? snapshotBlob().then(function (b) {
              closeCam();
              return uploadSnapshot(b, 'REQUEST', kind, null).catch(function () { return null; });
            }).catch(function () { closeCam(); return null; })
          : Promise.resolve(null);
        keep.then(function (path) {
          S.ctx.snapshot = path;
          return gpsP;
        }).then(function (g) { S.ctx.gps = g; }).catch(function () {});
        if (st.live === 'run') st.live = 'bad';
        else if (st.match === 'run') st.match = 'bad';
        panel(stepsHtml(st, msg, true));
        var acts = [{ label: 'ยกเลิก', style: 'plain', on: close }];
        var maxTry = Number(w.NJHR_FACE_MAX_ATTEMPTS || 3);
        if (S.attempts < maxTry) {
          acts.unshift({ label: 'ลองใหม่ (' + S.attempts + '/' + maxTry + ')', style: 'primary',
            on: function () { close(); setTimeout(function () { punch(kind, onDone); }, 60); } });
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
  var POSES = [
    { key: 'FRONT', label: 'หน้าตรง', icon: '&#128100;', hint: 'มองกล้องตรง ๆ',   test: function (y) { return Math.abs(y) < 0.18; } },
    { key: 'LEFT',  label: 'หันซ้าย',  icon: '&#11013;',  hint: 'หันหน้าไปทางซ้ายเล็กน้อย',  test: function (y) { return y > 0.20; } },
    { key: 'RIGHT', label: 'หันขวา',   icon: '&#10145;',  hint: 'หันหน้าไปทางขวาเล็กน้อย',   test: function (y) { return y < -0.20; } }
  ];

  function enroll(employeeId, onDone, opts) {
    if (S.busy) return;
    S.busy = true;
    /* opts.password มีค่า = "ลงทะเบียนใบหน้าใหม่" (ทับของเดิม)
       ต้องยืนยันรหัสผ่านมาแล้วจากหน้าข้อมูลส่วนตัว และฐานข้อมูลตรวจซ้ำอีกชั้น
       ⚠ ของเดิมจะถูกแทนที่ก็ต่อเมื่อ RPC สำเร็จเท่านั้น — ระหว่างถ่าย 3 มุมไม่แตะของเดิมเลย */
    var reNew = !!(opts && opts.password);
    shell(reNew ? 'ลงทะเบียนใบหน้าใหม่' : 'ลงทะเบียนใบหน้า', 'เก็บใบหน้า 3 มุม');
    var got = [], idx = 0, snapPath = null;

    function drawPoses(msg, err) {
      panel('<div class="njf-poses">' + POSES.map(function (p, i) {
        return '<div class="njf-pose ' + (i < idx ? 'done' : i === idx ? 'on' : '') + '">' +
          '<i>' + p.icon + '</i>' + esc(p.label) + '</div>';
      }).join('') + '</div>' +
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
                  got.push(buf[buf.length - 1].desc);
                  if (idx === 0) {
                    snapshotBlob().then(function (b) {
                      return uploadSnapshot(b, 'ENROLL', null, employeeId || null);
                    }).then(function (p2) { snapPath = p2; }).catch(function () {});
                  }
                  idx++;
                  if (idx >= POSES.length) return finish();
                  return capturePose();
                }
              }
            }
          }
          S.raf = requestAnimationFrame(loop);
        }).catch(function (e) { setMsg((e && e.message) || 'ตรวจใบหน้าไม่สำเร็จ', true); });
      })();
    }

    function finish() {
      closeCam();
      drawPoses('กำลังบันทึกข้อมูลใบหน้า…');
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
      rpc(fnName, body).then(function (r) {
        panel('<div class="njf-check" style="margin:0 auto 12px">&#10003;</div>' +
          '<div class="njf-msg"><b>' + (reNew ? 'ลงทะเบียนใบหน้าใหม่สำเร็จ' : 'ลงทะเบียนใบหน้าสำเร็จ') +
          '</b><br>เก็บใบหน้าไว้ ' +
          ((r && r.sample_count) || got.length) + ' มุม</div>' +
          '<div class="njf-actions" id="njf-act"></div>');
        actions([{ label: 'เสร็จสิ้น', style: 'primary', on: function () {
          close(); if (typeof onDone === 'function') onDone(r);
        } }]);
      }).catch(function (e) {
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
      S.running = true;
      capturePose();
    }).catch(function (e) {
      closeCam();                              // ฝั่งใดฝั่งหนึ่งล้มเหลว ต้องไม่ปล่อยกล้องค้างเปิด
      drawPoses((e && e.message) || 'เปิดกล้องไม่สำเร็จ', true);
      actions([{ label: 'ปิด', style: 'plain', on: close }]);
      S.busy = false;
    });
  }

  /* ---------- ปิดกล้องเมื่อออกจากหน้า ---------- */
  w.addEventListener('hashchange', close);
  w.addEventListener('pagehide', closeCam);
  d.addEventListener('visibilitychange', function () { if (d.hidden) closeCam(); });

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
      return loadModels()['catch'](function () {});
    },
    isReady: function () { return !!S.ready; },
    punch: punch,
    enroll: enroll,
    login: login,
    close: close,
    snapshotUrl: snapshotUrl,
    isOpen: function () { return !!S.root; }
  };
})(window, document);
