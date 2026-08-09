/* doc_coe_pdf_test.js — หนังสือรับรองการทำงาน (COE) ต้องพิมพ์ออกเป็น A4 หน้าเดียว
   สร้าง PDF จริงด้วย Chromium (เส้นทางเดียวกับ Save as PDF ของเบราว์เซอร์) แล้วนับหน้า
   ใช้: node harness/doc_coe_pdf_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8941);
const OUT = process.argv[4] || path.join(os.tmpdir(), 'njhr-coe-test.pdf');
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }

const FX = require(__dirname + '/doc_coe_fixture.js');
const ORG = FX.ORG, DOC = FX.DOC;

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
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', function (route) {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    let out;
    if (fn === 'njhr_doc_center_list') out = [Object.assign({ total_count: 1 }, DOC)];
    else if (fn === 'njhr_doc_detail') out = { data: { doc: DOC, org: ORG, ack: null, events: [], versions: [] } };
    else if (fn === 'njhr_doc_org') out = { data: ORG };
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-doc-open]', { timeout: 15000 });
  await pg.evaluate(() => { document.querySelector('[data-doc-open]').click(); });
  await pg.waitForSelector('#doc-a4 .doc-a4-page', { timeout: 10000 });

  chk('Preview เปิดได้และเป็น COE',
    (await pg.$('#doc-a4 .doc-a4-page.doc-t-coe')) !== null);

  /* เตรียมพื้นที่พิมพ์แบบเดียวกับปุ่ม "บันทึก PDF / พิมพ์" แต่ไม่เรียก window.print()
     (Playwright สั่ง page.pdf() แทน ซึ่งเป็น Print Pipeline ตัวเดียวกับ Save as PDF) */
  await pg.evaluate(() => {
    const btn = document.getElementById('doc-print');
    const realPrint = window.print;
    window.print = function () {};                 // กัน dialog ค้างใน headless
    btn.click();
    window.print = realPrint;
  });
  await pg.waitForFunction(() => {
    const a = document.getElementById('doc-print-area');
    return a && a.querySelector('.doc-a4-page') && document.body.classList.contains('printing-doc');
  }, { timeout: 5000 });
  await pg.waitForTimeout(400);

  /* วัดความสูงจริงของกล่องพิมพ์ เทียบกับความสูง A4 (ต้องอยู่ในโหมด print) */
  await pg.emulateMedia({ media: 'print' });
  const geo = await pg.evaluate(() => {
    const el = document.querySelector('#doc-print-area .doc-a4-page');
    const r = el.getBoundingClientRect();
    const mm = 96 / 25.4;
    return { h: Math.round(r.height), w: Math.round(r.width),
      a4h: Math.round(297 * mm), scroll: Math.round(el.scrollHeight),
      bodyH: Math.round(document.body.getBoundingClientRect().height) };
  });
  chk('กล่อง A4 ไม่สูงเกิน 1 หน้า', geo.h <= geo.a4h, geo.h + ' / ' + geo.a4h + 'px');
  chk('เนื้อหาไม่ล้นกล่อง (scrollHeight ≤ ความสูงกล่อง)',
    geo.scroll <= geo.h + 1, geo.scroll + ' / ' + geo.h + 'px');
  chk('ความสูงเอกสารตอนพิมพ์ = 1 หน้า A4 พอดี (ไม่มีของแอปค้างใน layout)',
    geo.bodyH <= geo.a4h, geo.bodyH + ' / ' + geo.a4h + 'px');

  await pg.pdf({ path: OUT, format: 'A4', printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });

  const info = JSON.parse(require('child_process').execSync(
    'python3 -c "' +
    "import pypdf,json,sys;r=pypdf.PdfReader(sys.argv[1]);" +
    "print(json.dumps({'n':len(r.pages)," +
    "'sizes':[[round(float(p.mediabox.width),1),round(float(p.mediabox.height),1)] for p in r.pages]," +
    "'text':[(p.extract_text() or '').strip() for p in r.pages]}))" +
    '" ' + JSON.stringify(OUT)).toString());

  chk('PAGE COUNT = 1 (ไม่มีหน้า 2)', info.n === 1, 'พบ ' + info.n + ' หน้า');
  chk('ไม่มีหน้า Blank', info.text.every(t => t.length > 0),
    JSON.stringify(info.text.map(t => t.length)));
  chk('A4 Portrait 210×297mm', info.sizes.every(s => Math.abs(s[0] - 595.3) < 3 && Math.abs(s[1] - 841.9) < 3),
    JSON.stringify(info.sizes));

  const t = info.text[0].replace(/\s+/g, ' ');
  /* ตัวสกัดข้อความของ PDF แยกสระ/วรรณยุกต์ไทยออกมาไม่ครบ — เทียบแบบตัดเครื่องหมายประกอบทิ้ง */
  /* U+F700–U+F71F = สระ/วรรณยุกต์ตำแหน่งพิเศษของฟอนต์ตระกูล TH Sarabun (Private Use Area) */
  var THAI_MARK = /[\s\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\uF700-\uF71F]/g;
  function nm(x) { return String(x).replace(/\u0E33/g, '\u0E32').replace(THAI_MARK, ''); }
  const tn = nm(info.text[0]);
  chk('Header เดิมครบ (ชื่อบริษัท + ที่อยู่ + เลขที่ + วันที่ออก)',
    /N\.J\. LOGISTICS & FRUITS CO\., LTD\./.test(t) && /Thung Sukhla/.test(t) &&
    /COE-2026-000002/.test(t) && /03\/08\/2569/.test(t), t.slice(0, 90));
  chk('ชื่อเรื่อง "หนังสือรับรองการทำงาน"',
    tn.indexOf(nm('หนังสือรับรองการทำงาน')) >= 0, tn.slice(0, 80));
  chk('Employee Card เดิมครบ 8 ช่อง',
    ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'แผนก', 'วันที่เริ่มงาน', 'ผู้บังคับบัญชา', 'วันที่มีผล', 'บริษัท']
      .every(k => tn.indexOf(nm(k)) >= 0), tn.slice(0, 200));
  chk('ข้อมูลจริงของเอกสาร (0004 · GENERAL MANAGER · 07/01/2556)',
    /0004/.test(t) && /GENERAL MANAGER/.test(t) && /07\/01\/2556/.test(t));
  chk('เนื้อหาจดหมายไม่ถูกตัด (มี "จึงออกหนังสือรับรองฉบับนี้ไว้เป็นหลักฐาน")',
    tn.indexOf(nm('จึงออกหนังสือรับรองฉบับนี้ไว้เป็นหลักฐาน')) >= 0, tn.slice(-160));
  chk('Signature block อยู่หน้าเดียวกัน',
    /Soontaree Tiranukul/.test(t) && /Managing Director/.test(t));
  chk('Footer อยู่หน้าเดียวกัน',
    /COE-2026-000002/.test(t) && /NJ LOGISTIC HR SYSTEM/.test(t));

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\nไฟล์ PDF ที่สร้าง: ' + OUT);
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
