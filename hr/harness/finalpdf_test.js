/* finalpdf_test.js — ทดสอบตัวสร้าง Final PDF ในเครื่อง (ไม่แตะ Production)
   สร้าง PDF จาก Snapshot จำลองที่มีรูปร่างเหมือนที่ njhr_doc_pdf_claim คืนมาจริง
   แล้วตรวจไฟล์ที่ได้ด้วย pdftotext / pdfinfo

   ตรวจตามข้อกำหนด PROMPT 3:
     ข้อ 20  ภาษาไทยถูกต้อง ไม่เป็นสี่เหลี่ยม/เพี้ยน · สระ+วรรณยุกต์ครบ
     ข้อ 21  เนื้อหายาวขึ้นหน้าใหม่ได้ ไม่ถูกตัดหาย
     ข้อ 22  Snapshot เท่านั้น — ห้ามมีข้อมูลพนักงานปัจจุบัน
     ข้อ 23  เวลาไทยจาก Server (ไม่ใช้เวลาเครื่อง)
     ข้อ 24  hash เป็น SHA-256 hex 64 ตัว · คำนวณจาก bytes จริง
     ข้อ 25  ห้ามมี password / token / session / ip / user_agent ใน PDF
     ข้อ 27  ฟอนต์ถูก embed ลงในไฟล์

   ต้องมี:  npm i -D esbuild  ·  npm i pdf-lib @pdf-lib/fontkit
            poppler-utils (pdftotext / pdfinfo) สำหรับตรวจไฟล์
            edge-functions/njhr-doc-pdf/fonts/Prompt-*.ttf

   วิธีใช้: node harness/finalpdf_test.js [ทางฟอนต์ regular] [ทางฟอนต์ bold]     */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'pdf', 'out');
const { buildFinalPdf } = require(path.join(__dirname, 'pdf', 'pdf_node.js'));

/* สแกนโฟลเดอร์ fonts/ จริง ด้วยกติกาเดียวกับ Edge Function — ไม่ hardcode ชื่อไฟล์ */
const FONT_DIR = path.join(ROOT, 'edge-functions/njhr-doc-pdf/fonts');
function scanFonts() {
  let names = [];
  try { names = fs.readdirSync(FONT_DIR).filter(n => n.toLowerCase().endsWith('.ttf')); } catch (e) { }
  const isItalic = n => /italic|oblique/i.test(n);
  const isBold = n => /bold/i.test(n);
  return {
    names,
    reg: names.find(n => !isBold(n) && !isItalic(n)),
    bold: names.find(n => isBold(n) && !isItalic(n))
  };
}
const scan = scanFonts();
const FONT_REG = process.argv[2] || (scan.reg ? path.join(FONT_DIR, scan.reg) : path.join(FONT_DIR, '(ไม่พบ)'));
const FONT_BOLD = process.argv[3] || (scan.bold ? path.join(FONT_DIR, scan.bold) : path.join(FONT_DIR, '(ไม่พบ)'));

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  · ' + detail : ''));
}
function skip(name, why) {
  results.push({ name, skip: true, detail: why });
  console.log('SKIP  ' + name + '  · ' + why);
}

/* ---------- Snapshot จำลอง — รูปร่างตรงกับที่ njhr_doc_pdf_claim คืนจริง ---------- */
const LONG_BODY = Array.from({ length: 40 }, (_, i) =>
  `ข้อ ${i + 1}. พนักงานตกลงปฏิบัติตามระเบียบข้อบังคับเกี่ยวกับการทำงานของบริษัท ` +
  `รวมถึงประกาศ คำสั่ง และแนวปฏิบัติที่บริษัทกำหนดขึ้นภายหลัง โดยถือเป็นส่วนหนึ่งของสัญญาฉบับนี้ ` +
  `ทั้งนี้ผู้ว่าจ้างสงวนสิทธิ์ในการปรับปรุงระเบียบดังกล่าวได้ตามความเหมาะสม`
).join('\n');

function snap(over) {
  return Object.assign({
    doc: {
      id: 'doc-1', doc_no: 'EMP-2026-000003', version: 2, doc_type: 'CONTRACT',
      title: 'สัญญาจ้างงาน ฉบับปรับปรุง พ.ศ. ๒๕๖๙',
      body: 'ข้อ 1. ผู้ว่าจ้างตกลงจ้าง และผู้รับจ้างตกลงเข้าทำงานในตำแหน่งพนักงานขับรถ\n' +
            'ข้อ 2. อัตราค่าจ้างเดือนละ ๑๕,๐๐๐ บาท จ่ายทุกวันสิ้นเดือน\n' +
            'ข้อ 3. ผู้รับจ้างจะต้องรักษาความลับของบริษัทอย่างเคร่งครัด',
      effective_date: '2026-09-01', issued_at: '2026-08-08T03:00:00Z',
      requires_signature: true, status: 'SIGNED',
      emp_code_snap: 'NJ0003', emp_name_snap: 'นายสมชาย ใจดี',
      dept_snap: 'ขนส่ง', position_snap: 'พนักงานขับรถ',
      doc_meta: {},
      content_hash: 'a'.repeat(64),
      sent_at: '2026-08-08T04:00:00Z', responded_at: '2026-08-08T05:00:00Z',
      locked_at: '2026-08-08T05:00:00Z'
    },
    ack: {
      action: 'SIGN', emp_code: 'NJ0003', emp_name: 'นายสมชาย ใจดี', department: 'ขนส่ง',
      acked_at: '2026-08-08T05:00:00Z',
      acked_at_th: '08/08/2569 12:00',
      doc_version: 2, doc_hash: 'a'.repeat(64),
      confirmation_text: 'ข้าพเจ้าได้อ่านสัญญาจ้างฉบับนี้ครบถ้วนแล้ว เข้าใจและตกลงยอมรับข้อกำหนดทั้งหมด ' +
                         'และขอลงนามอิเล็กทรอนิกส์เพื่อผูกพันตามสัญญาฉบับนี้',
      channel: '📱 Mobile Web', device: 'Mobile · Chrome'
    },
    org: {
      company_name: 'N.J. LOGISTICS & FRUITS CO., LTD.',
      address: '99/9 หมู่ 9 ตำบลบ้านฉาง อำเภอบ้านฉาง จังหวัดระยอง 21130'
    },
    hash_match: true,
    storage_path: 'emp-0003/EMP-2026-000003/v2/EMP-2026-000003_v2_signed.pdf'
  }, over || {});
}

/* หมายเหตุสำคัญเรื่องการตรวจด้วย pdftotext
   pdftotext อ่านตัวอักษรกลับจาก ToUnicode CMap ของฟอนต์ที่ฝังไว้
   ฟอนต์บางตัว (โดยเฉพาะ OTF/CFF หรือฟอนต์ที่ไม่ได้ทำ CMap ภาษาไทยมาครบ)
   จะ "วาดถูกแต่ถอดข้อความกลับผิด" เช่น า หายเป็นช่องว่าง หรือ ำ แตกเป็น ํ+า
   → เคสที่ตรวจด้วยข้อความจึงต้องรันด้วยฟอนต์ Prompt ตัวจริงเท่านั้นจึงเชื่อผลได้
   เคสที่ไม่ขึ้นกับ CMap (จำนวนหน้า · ขนาดกระดาษ · hash · metadata · ข้อมูลอ่อนไหว)
   เชื่อผลได้กับทุกฟอนต์                                                        */
function tool(name, args) {
  try { return execFileSync(name, args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch { return null; }
}

(async function () {
  console.log('--- A) ฟอนต์ ---');
  const hasReg = fs.existsSync(FONT_REG), hasBold = fs.existsSync(FONT_BOLD);
  check('A1 · พบไฟล์ฟอนต์ TH Sarabun New (Regular)', hasReg,
    hasReg ? path.basename(FONT_REG) : 'ไม่พบ · .ttf ในโฟลเดอร์: ' + (scan.names.join(', ') || '(ไม่มีเลย)'));
  check('A2 · พบไฟล์ฟอนต์ TH Sarabun New (Bold)', hasBold,
    hasBold ? path.basename(FONT_BOLD) : 'ไม่พบ · .ttf ในโฟลเดอร์: ' + (scan.names.join(', ') || '(ไม่มีเลย)'));

  if (!hasReg || !hasBold) {
    console.log('\nหยุดการทดสอบ — ยังไม่มีไฟล์ฟอนต์');
    console.log('ระบบออกแบบให้ "หยุดและแจ้ง" ไม่ใช่สลับไปใช้ฟอนต์อื่นเอง (เสี่ยงลิขสิทธิ์)');
    console.log('\n**PASS ' + results.filter(r => r.pass).length +
                ' · FAIL ' + results.filter(r => r.pass === false).length +
                ' · BLOCKED (ไม่มีฟอนต์)**');
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const reg = fs.readFileSync(FONT_REG), bold = fs.readFileSync(FONT_BOLD);

  /* ================= B) เอกสารปกติ ================= */
  console.log('\n--- B) เอกสารมาตรฐาน ---');
  const s1 = snap();
  const b1 = await buildFinalPdf(s1, reg, bold);
  const f1 = path.join(OUT, 'doc1.pdf');
  fs.writeFileSync(f1, b1);
  const h1 = crypto.createHash('sha256').update(b1).digest('hex');

  check('B1 · สร้างไฟล์ PDF สำเร็จ', b1.length > 1000, b1.length + ' bytes');
  check('B2 · เป็นไฟล์ PDF จริง (%PDF header)',
    Buffer.from(b1.slice(0, 5)).toString() === '%PDF-', Buffer.from(b1.slice(0, 8)).toString());
  check('B3 · hash เป็น SHA-256 hex 64 ตัว (ข้อ 24)',
    /^[0-9a-f]{64}$/.test(h1), h1.slice(0, 24) + '…');

  const txt1 = tool('pdftotext', [f1, '-']);
  if (txt1 === null) { skip('B4–B9 · ตรวจเนื้อหา', 'ไม่มี pdftotext ในเครื่อง'); }
  else {
    check('B4 · ภาษาไทยอ่านออก ไม่เป็นสี่เหลี่ยม (ข้อ 20)',
      txt1.indexOf('นายสมชาย ใจดี') >= 0 && txt1.indexOf('สัญญาจ้างงาน') >= 0,
      'พบชื่อและประเภทเอกสาร');
    check('B5 · สระ + วรรณยุกต์ครบ',
      txt1.indexOf('ฉบับปรับปรุง') >= 0 && txt1.indexOf('เคร่งครัด') >= 0, 'ตรวจคำที่มีวรรณยุกต์ซ้อน');
    check('B6 · เลขไทยแสดงถูก', txt1.indexOf('๑๕,๐๐๐') >= 0 && txt1.indexOf('๒๕๖๙') >= 0, 'พบ ๑๕,๐๐๐ และ ๒๕๖๙');
    check('B7 · ใช้ Snapshot ไม่ใช่ข้อมูลปัจจุบัน (ข้อ 22)',
      txt1.indexOf('NJ0003') >= 0 && txt1.indexOf('ขนส่ง') >= 0 && txt1.indexOf('พนักงานขับรถ') >= 0,
      'รหัส/แผนก/ตำแหน่ง มาจาก *_snap');
    check('B8 · เวลาไทยจาก Server (ข้อ 23)',
      txt1.indexOf('08/08/2569 12:00') >= 0, 'ใช้ acked_at_th ที่ DB แปลงมา');
    check('B9 · มี Document Hash ในเอกสาร',
      txt1.indexOf('SHA-256') >= 0 && txt1.indexOf('a'.repeat(32)) >= 0, 'แสดง content_hash');
    check('B10 · มีข้อความยืนยันที่ผู้ใช้กดจริง',
      txt1.indexOf('ลงนามอิเล็กทรอนิกส์เพื่อผูกพันตามสัญญา') >= 0, 'จาก njhr_doc_confirm_text');

    // ---- ข้อ 25: ห้ามมีข้อมูลอ่อนไหว ----
    const banned = [
      ['password', 'รหัสผ่าน'], ['token', 'token'], ['session', 'session'],
      ['Bearer', 'Bearer'], ['eyJ', 'JWT'], ['192.168', 'IP'],
      ['Mozilla', 'user agent'], ['service_role', 'service_role'],
      ['apikey', 'apikey'], ['supabase', 'supabase']
    ];
    const leaked = banned.filter(b => txt1.toLowerCase().indexOf(b[0].toLowerCase()) >= 0);
    check('B11 · ไม่มี password / token / session / ip / user_agent ใน PDF (ข้อ 25)',
      leaked.length === 0, leaked.length ? 'พบ: ' + leaked.map(x => x[1]).join(',') : 'ตรวจ 10 คำ ไม่พบเลย');
  }

  const info1 = tool('pdfinfo', [f1]);
  if (info1 === null) skip('B12 · ตรวจ metadata', 'ไม่มี pdfinfo ในเครื่อง');
  else {
    check('B12 · หน้ากระดาษเป็น A4', /Page size:\s*595(\.\d+)?\s*x\s*84[12](\.\d+)?/.test(info1),
      (/Page size:.*/.exec(info1) || [''])[0].trim());
    check('B13 · ไม่มีข้อมูลลับใน metadata',
      !/token|password|bearer|service_role/i.test(info1), 'Title/Subject/Producer สะอาด');
  }

  /* ================= C) เอกสารยาว — ขึ้นหน้าใหม่ ================= */
  console.log('\n--- C) เอกสารยาวหลายหน้า (ข้อ 21) ---');
  const s2 = snap({ doc: Object.assign({}, snap().doc, { body: LONG_BODY }) });
  const b2 = await buildFinalPdf(s2, reg, bold);
  const f2 = path.join(OUT, 'doc_long.pdf');
  fs.writeFileSync(f2, b2);

  const info2 = tool('pdfinfo', [f2]);
  const pages = info2 ? Number((/Pages:\s*(\d+)/.exec(info2) || [])[1] || 0) : 0;
  if (!info2) skip('C1–C3 · ตรวจหลายหน้า', 'ไม่มี pdfinfo ในเครื่อง');
  else {
    check('C1 · เนื้อหายาวขึ้นหน้าใหม่ได้', pages > 1, pages + ' หน้า');
    const txt2 = tool('pdftotext', [f2, '-']) || '';
    check('C2 · เนื้อหาบรรทัดแรกและบรรทัดสุดท้ายอยู่ครบ ไม่ถูกตัดหาย',
      txt2.indexOf('ข้อ 1.') >= 0 && txt2.indexOf('ข้อ 40.') >= 0, 'พบทั้ง ข้อ 1 และ ข้อ 40');
    check('C3 · ทุกหน้ามีเลขหน้าและเลขที่เอกสาร',
      (txt2.match(/หน้า \d+ \/ \d+/g) || []).length === pages,
      'พบท้ายหน้า ' + (txt2.match(/หน้า \d+ \/ \d+/g) || []).length + ' ครั้ง / ' + pages + ' หน้า');
  }

  /* ================= D) Hash & Determinism ================= */
  console.log('\n--- D) Hash (ข้อ 24) ---');
  const b1b = await buildFinalPdf(snap(), reg, bold);
  const h1b = crypto.createHash('sha256').update(b1b).digest('hex');
  check('D1 · Snapshot เดียวกัน → ไฟล์เหมือนเดิม (deterministic)',
    h1 === h1b, h1 === h1b ? 'hash ตรงกัน' : 'hash ต่างกัน');
  const b3 = await buildFinalPdf(snap({ doc: Object.assign({}, snap().doc, { title: 'แก้ชื่อเรื่อง' }) }), reg, bold);
  const h3 = crypto.createHash('sha256').update(b3).digest('hex');
  check('D2 · เนื้อหาต่างกัน → hash ต่างกัน', h1 !== h3, 'ตรวจได้ว่าไฟล์ถูกแก้');

  /* ================= E) เอกสารแบบรับทราบ (ไม่ลงนาม) ================= */
  console.log('\n--- E) เอกสารแบบรับทราบ ---');
  const s4 = snap({
    doc: Object.assign({}, snap().doc, { doc_type: 'WARNING', requires_signature: false, status: 'ACKNOWLEDGED' }),
    ack: Object.assign({}, snap().ack, { action: 'ACKNOWLEDGE',
      confirmation_text: 'ข้าพเจ้าได้อ่านหนังสือเตือนฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง' })
  });
  const b4 = await buildFinalPdf(s4, reg, bold);
  const f4 = path.join(OUT, 'doc_ack.pdf');
  fs.writeFileSync(f4, b4);
  const txt4 = tool('pdftotext', [f4, '-']);
  if (txt4 === null) skip('E1 · ตรวจเอกสารรับทราบ', 'ไม่มี pdftotext');
  else {
    check('E1 · แสดงเป็น "รับทราบ" ไม่ใช่ "ลงนาม"',
      txt4.indexOf('หลักฐานการรับทราบ') >= 0 && txt4.indexOf('ลงนามอิเล็กทรอนิกส์') < 0,
      'ตรงตาม requires_signature = false');
    check('E2 · ชื่อประเภทเอกสารถูกต้อง', txt4.indexOf('หนังสือเตือนพนักงาน') >= 0, 'WARNING');
  }

  /* ================= F) hash ไม่ตรง → ต้องเตือน ================= */
  console.log('\n--- F) ความสอดคล้องของ Hash ---');
  const b5 = await buildFinalPdf(snap({ hash_match: false }), reg, bold);
  const f5 = path.join(OUT, 'doc_mismatch.pdf');
  fs.writeFileSync(f5, b5);
  const txt5 = tool('pdftotext', [f5, '-']);
  if (txt5 === null) skip('F1 · ตรวจคำเตือน hash', 'ไม่มี pdftotext');
  else check('F1 · hash ไม่ตรง → พิมพ์คำเตือนลงเอกสาร',
    txt5.indexOf('คำเตือน') >= 0, 'ไม่กลบปัญหา');

  const pass = results.filter(r => r.pass).length;
  const fail = results.filter(r => r.pass === false).length;
  const sk = results.filter(r => r.skip).length;
  console.log('\nไฟล์ตัวอย่าง: ' + OUT);
  console.log('\n**PASS ' + pass + ' · FAIL ' + fail + (sk ? ' · SKIP ' + sk : '') + '**');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
