/* face_perf_test.js — วัดเวลาจริงของ Face Scan + ตรวจ Timeout / Warm-up / กันบันทึกซ้ำ
   ใช้: node harness/face_perf_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8861);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(56) + (e || '')); }

/* face-api ปลอมที่หน่วงเวลาเท่าของจริงบนมือถือ (โหลดสคริปต์ + 3 โมเดล)
   ใช้วัด "ลำดับการทำงาน" ว่ากล้องต้องรอโมเดลหรือไม่ ไม่ได้ใช้ตัดสินคุณภาพการตรวจใบหน้า */
const MODEL_DELAY = 1500;

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(function (r) {
    const s = http.createServer(function (rq, rs) {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, function () { r(s); });
  });
}

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({
    executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  const errs = [];
  const ctx = await b.newContext({
    viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true,
    serviceWorkers: 'block', permissions: ['camera', 'geolocation'],
    geolocation: { latitude: 13.08, longitude: 100.93 }
  });

  const net = [];
  await ctx.route('**/*', function (route) {
    const url = route.request().url();
    if (url.indexOf('localhost:' + PORT) < 0) net.push(url);
    // จำลองไลบรารีตรวจใบหน้าจาก CDN ให้ช้าเท่าของจริงบนมือถือ
    if (/face-api\.js$/.test(url)) {
      return setTimeout(function () {
        route.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_FACEAPI });
      }, MODEL_DELAY);
    }
    if (url.indexOf('/rest/v1/rpc/') >= 0 || url.indexOf('/functions/v1/') >= 0) {
      const fn = url.split('/').pop().split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      let out = F.respond(fn, bd);
      if (fn === 'njhr_att_report') out = [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    }
    if (url.indexOf('fonts.googleapis.com') >= 0 || url.indexOf('fonts.gstatic.com') >= 0) {
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    }
    route.continue();
  });

  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });

  /* ---------- กล้องต้องไม่รอโมเดล (วัดแบบ "ครั้งแรก" บนหน้าใหม่ที่ยังไม่ Warm-up) ---------- */
  const cold = await ctx.newPage();
  cold.on('pageerror', e => errs.push(String(e)));
  await cold.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
  await cold.goto('http://localhost:' + PORT + '/#/dashboard', { waitUntil: 'domcontentloaded' });
  await cold.waitForFunction(() => typeof window.NJHR_loadScriptOnce === 'function', { timeout: 15000 });
  const seq = await cold.evaluate((delay) => new Promise(res => {
    const mark = { camAt: 0, modelAt: 0, msg: '', start: 0 };
    const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (c) {
      return origGUM(c).then(s => {
        mark.camAt = Date.now() - mark.start;
        setTimeout(() => {
          const p = document.querySelector('#njf-panel');
          if (p && !mark.msg) mark.msg = p.textContent;
        }, 60);
        return s;
      });
    };
    window.NJHR_loadScriptOnce('face', window.NJHR_asset('face.js'), 'NJHRFace').then(() => {
      mark.start = Date.now();
      window.NJHRFace.punch('IN', function () {});
      (function poll() {
        if (window.faceapi && window.faceapi.__loadedAt && !mark.modelAt) {
          mark.modelAt = window.faceapi.__loadedAt - mark.start;
        }
        if (mark.camAt && mark.modelAt && mark.msg) return res(mark);
        if (Date.now() - mark.start > delay + 8000) return res(mark);
        setTimeout(poll, 50);
      })();
    }, () => res(mark));
  }), MODEL_DELAY);
  console.log('   TIMING (ครั้งแรก ไม่ Warm-up) · เปิดกล้อง ' + seq.camAt + 'ms · โมเดลพร้อม ' + seq.modelAt +
    'ms (หน่วงไลบรารีจำลอง ' + MODEL_DELAY + 'ms)');
  chk('กล้องเปิดได้โดยไม่รอโมเดลโหลดเสร็จ',
    seq.camAt > 0 && seq.camAt < seq.modelAt, 'กล้อง ' + seq.camAt + 'ms · โมเดล ' + seq.modelAt + 'ms');
  chk('กล้องพร้อมเร็วกว่าโมเดลอย่างมีนัยสำคัญ',
    seq.modelAt - seq.camAt > MODEL_DELAY * 0.5, 'เร็วกว่า ~' + (seq.modelAt - seq.camAt) + 'ms');
  chk('ระหว่างรอโมเดลแสดงสถานะ "กำลังเตรียมระบบตรวจสอบใบหน้า…"',
    seq.msg.indexOf('กำลังเตรียมระบบตรวจสอบใบหน้า') >= 0, seq.msg.slice(0, 70));
  await cold.evaluate(() => { try { window.NJHRFace.close(); } catch (e) {} });
  await cold.close();

  const t0 = Date.now();
  await pg.goto('http://localhost:' + PORT + '/#/attendance', { waitUntil: 'domcontentloaded' });
  const tDom = Date.now() - t0;
  await pg.waitForSelector('#att-in', { timeout: 20000 });
  const tUsable = Date.now() - t0;
  console.log('   TIMING · DOMContentLoaded ' + tDom + 'ms · หน้าลงเวลาใช้งานได้ ' + tUsable + 'ms');

  /* ---------- Warm-up ---------- */
  const warm = await pg.evaluate(() => new Promise(res => {
    const t = Date.now();
    (function poll() {
      if (window.NJHRFace) return res({ ok: true, ms: Date.now() - t });
      if (Date.now() - t > 8000) return res({ ok: false, ms: Date.now() - t });
      setTimeout(poll, 60);
    })();
  }));
  chk('เข้าหน้าลงเวลาแล้ว face.js ถูก Warm-up เองแบบไม่บล็อก', warm.ok, 'พร้อมใน ' + warm.ms + 'ms');
  chk('Warm-up ไม่ทำให้หน้าลงเวลาใช้งานช้า (< 6s)', tUsable < 6000, tUsable + 'ms');
  const modelReady = await pg.evaluate(() => new Promise(res => {
    const t = Date.now();
    (function poll() {
      if (window.NJHRFace && window.NJHRFace.isReady()) return res(Date.now() - t);
      if (Date.now() - t > 15000) return res(-1);
      setTimeout(poll, 60);
    })();
  }));
  chk('โมเดลถูกเตรียมล่วงหน้าจน isReady() = true', modelReady >= 0, 'พร้อมใน ' + modelReady + 'ms หลังเปิดหน้า');

  /* ---------- กันกดซ้ำ ---------- */
  const dbl = await pg.evaluate(() => {
    const before = !!document.querySelector('#njf-root, .njf-root, [id^="njf"]');
    document.getElementById('att-in').disabled = false;
    document.getElementById('att-in').click();
    document.getElementById('att-in').click();
    return { before: before, roots: document.querySelectorAll('[id="njf-root"]').length,
      busyGuard: typeof window.NJHRFace.isOpen === 'function' && window.NJHRFace.isOpen() };
  });
  chk('กดปุ่มสแกนรัวไม่เปิดซ้อนหลายชุด', dbl.roots <= 1, 'พบ ' + dbl.roots + ' ชุด');

  await pg.evaluate(() => window.NJHRFace.close());

  /* ---------- Timeout / Recovery ---------- */
  const to = await pg.evaluate(() => {
    const ms = Number(window.NJHR_SB_TIMEOUT_MS);
    return { central: ms };
  });
  chk('face.js ใช้ค่า Timeout กลางตัวเดียวกับ runtime (SB_TIMEOUT_MS)',
    to.central === 13000, 'window.NJHR_SB_TIMEOUT_MS = ' + to.central);

  // เน็ตค้างจริง: ให้ Edge Function ไม่ตอบเลย แล้วดูว่ามีการ abort ภายในเวลา
  await pg.evaluate(() => { window.NJHR_SB_TIMEOUT_MS = 1200; });
  const hang = await pg.evaluate(() => new Promise(res => {
    const origFetch = window.fetch;
    let aborted = false, done = false;
    window.fetch = function (url, opt) {
      if (String(url).indexOf('/functions/v1/njhr-face-file') >= 0) {
        return new Promise((_, rej) => {
          if (opt && opt.signal) opt.signal.addEventListener('abort', () => {
            aborted = true;
            const e = new Error('aborted'); e.name = 'AbortError'; rej(e);
          });
        });
      }
      return origFetch.apply(this, arguments);
    };
    const t = Date.now();
    window.NJHRFace.snapshotUrl('some/path')
      .then(() => { done = true; }, () => { done = true; })
      .then(() => { window.fetch = origFetch; res({ aborted: aborted, done: done, ms: Date.now() - t }); });
    setTimeout(() => { if (!done) { window.fetch = origFetch; res({ aborted: aborted, done: false, ms: Date.now() - t }); } }, 6000);
  }));
  chk('เน็ตค้าง → Abort Request จริงและไม่หมุนค้าง',
    hang.aborted === true && hang.done === true && hang.ms < 4000,
    'abort=' + hang.aborted + ' · จบใน ' + hang.ms + 'ms');
  await pg.evaluate(() => { window.NJHR_SB_TIMEOUT_MS = 13000; });

  /* ---------- External requests ---------- */
  const ext = Array.from(new Set(net.map(u => u.split('/').slice(0, 3).join('/'))));
  console.log('   EXTERNAL ORIGINS: ' + (ext.join(' · ') || 'ไม่มี'));

  chk('ไม่มี JavaScript Error ใหม่', errs.length === 0, errs.slice(0, 2).join(' | '));

  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();

/* ไลบรารีจำลองสำหรับวัดลำดับเวลาเท่านั้น — ไม่ได้ใช้ตัดสินความแม่นยำการตรวจใบหน้า */
const FAKE_FACEAPI = `
window.faceapi = {
  __loadedAt: Date.now(),
  nets: {
    tinyFaceDetector:  { loadFromUri: function () { return Promise.resolve(); } },
    faceLandmark68Net: { loadFromUri: function () { return Promise.resolve(); } },
    faceRecognitionNet:{ loadFromUri: function () { return Promise.resolve(); } }
  },
  TinyFaceDetectorOptions: function (o) { this.o = o; },
  detectAllFaces: function () {
    return { withFaceLandmarks: function () {
      return { withFaceDescriptors: function () { return Promise.resolve([]); } };
    } };
  }
};
`;
