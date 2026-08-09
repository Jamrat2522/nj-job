const {PDFDocument, rgb} = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs'), crypto = require('crypto');
(async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const ttf = fs.readFileSync('/usr/share/fonts/opentype/tlwg/Loma.otf');
  let font;
  try { font = await doc.embedFont(ttf, { subset: false }); }
  catch (e) { console.log('embed FAIL:', e.message); return; }
  const p = doc.addPage([595, 842]);
  const s = 'นายสมชาย ใจดี — เลขที่ EMP-2026-000003 ฉบับที่ 1 ลงนามแล้ว ๑๒๓';
  try {
    p.drawText(s, { x: 50, y: 780, size: 14, font, color: rgb(0,0,0) });
    console.log('drawText OK · width =', font.widthOfTextAtSize(s, 14).toFixed(1));
  } catch (e) { console.log('drawText FAIL:', e.message); return; }
  doc.setCreationDate(new Date(0)); doc.setModificationDate(new Date(0));
  const bytes = await doc.save();
  fs.writeFileSync('/tmp/thai.pdf', bytes);
  console.log('bytes =', bytes.length, '· sha256 =', crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16)+'…');
})();
