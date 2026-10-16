/* =====================================================================
 * J&P LOGISTICS — jp-core.js  (local101)
 * Pure logic shared by the browser app (index.html) and the node test suite.
 * No DOM / no network here: date & file-name rules, PDF field extraction,
 * photo auto-ordering heuristics, EXIF orientation, merged-PDF builder.
 * ===================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JPCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const PHOTO_TYPES = ['SEAL', 'CLOSED', 'OPEN2', 'OPEN1'];
  const PHOTO_TYPE_LABEL = {
    SEAL: 'Seal No.', CLOSED: 'ประตูตู้ปิดสนิท', OPEN2: 'เปิดตู้สองข้าง', OPEN1: 'เปิดตู้ข้างเดียว', OTHER: 'รูปเพิ่มเติม'
  };

  /* ---------------------------------------------------------------- dates */
  function pad2(n) { return String(n).padStart(2, '0'); }

  // Date | 'YYYY-MM-DD' -> '12 OCT 2026'
  function formatDateDDMMMYYYY(d) {
    const dt = typeof d === 'string' ? parseISODate(d) : d;
    if (!dt || isNaN(dt.getTime())) return '';
    return pad2(dt.getDate()) + ' ' + MONTHS[dt.getMonth()] + ' ' + dt.getFullYear();
  }
  function parseISODate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  function toISODate(dt) {
    if (!dt || isNaN(dt.getTime())) return '';
    return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  }
  // Accepts: 12 OCT 2026 | 12-OCT-2026 | 12/10/2026 | 12-10-2026 | 2026-10-12 | 12 ต.ค. 2026 (not supported -> null)
  function parseDateInput(str) {
    const s = String(str || '').trim().toUpperCase();
    if (!s) return null;
    let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
    if (m) return validDate(+m[1], +m[2], +m[3]);
    m = /^(\d{1,2})[\s\-/.]+([A-Z]{3})[A-Z]*[\s\-/.]+(\d{2,4})$/.exec(s);
    if (m) {
      const mi = MONTHS.indexOf(m[2]);
      if (mi < 0) return null;
      let y = +m[3]; if (y < 100) y += 2000;
      return validDate(y, mi + 1, +m[1]);
    }
    m = /^(\d{1,2})[\s\-/.](\d{1,2})[\s\-/.](\d{2,4})$/.exec(s);
    if (m) { let y = +m[3]; if (y < 100) y += 2000; return validDate(y, +m[2], +m[1]); }
    return null;
  }
  function validDate(y, mo, d) {
    if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  /* ----------------------------------------------------------- file names */
  // Characters not allowed in Windows/macOS file names, plus control chars.
  function sanitizeFileName(s) {
    return String(s || '')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/g, '')
      .trim();
  }
  function cleanCode(s) { return String(s || '').toUpperCase().replace(/\s+/g, '').trim(); }

  // -> { base, ok, missing[] }   base = "12 OCT 2026-A0050691019519_ONEYRICGU0155500"
  function buildBaseName(job) {
    const missing = [];
    const dateTxt = formatDateDDMMMYYYY(job.doc_date);
    const decl = cleanCode(job.declaration_no);
    const bl = cleanCode(job.bl_no);
    if (!dateTxt) missing.push('วันที่เอกสาร');
    if (!decl) missing.push('เลขใบขน');
    if (!bl) missing.push('B/L No.');
    const base = sanitizeFileName((dateTxt || 'DD MMM YYYY') + '-' + (decl || 'เลขใบขน') + '_' + (bl || 'BL'));
    return { base, ok: missing.length === 0, missing };
  }

  /* --------------------------------------------- PDF text -> field values */
  const RE_DECL = /\bA\d{13}\b/g;
  const RE_CONTAINER = /\b([A-Z]{3}[UJZ])\s?(\d{6})\s?(\d)\b/g;      // ISO 6346, tolerate a space before check digit
  const RE_BL_LABELED = /(?:BILL OF LADING(?: NUMBER| NO\.?)?|B\/L NO\.?|SEA WAYBILL NO\.?|ใบตราส่งเลขที่|ใบตราส่ง)\s*[:：]?\s*\(?\s*([A-Z]{2,5}[A-Z0-9]{6,20})\s*\)?/gi;
  const RE_SEAL_AFTER_CNTR = /\b[A-Z]{4}\d{7}\s*[\/|,:-]?\s*(?:SEAL(?: NO\.?)?\s*[:：]?\s*)?(\d{6,10})\b/g;

  function isoContainerValid(code) {
    const c = cleanCode(code);
    if (!/^[A-Z]{4}\d{7}$/.test(c)) return false;
    // ISO 6346 check digit
    const map = {};
    let v = 10;
    for (let i = 0; i < 26; i++) { if (v % 11 === 0) v++; map[String.fromCharCode(65 + i)] = v; v++; }
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const ch = c[i];
      const val = i < 4 ? map[ch] : +ch;
      sum += val * Math.pow(2, i);
    }
    return (sum % 11) % 10 === +c[10];
  }

  function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

  // text: concatenated text of the PDF (pdf.js), fileName: original name (fallback for decl/BL)
  function extractFieldsFromText(text, fileName) {
    const t = String(text || '').replace(/ /g, ' ');
    const out = { declaration_no: '', bl_no: '', containers: [], seals: [], hints: { isDeclaration: false, isMemo: false } };

    const decls = uniq((t.match(RE_DECL) || []));
    if (decls.length) out.declaration_no = decls[0];

    // B/L: labeled first
    let m; RE_BL_LABELED.lastIndex = 0;
    const bls = [];
    while ((m = RE_BL_LABELED.exec(t))) { const v = cleanCode(m[1]); if (v.length >= 8 && !/^A\d{13}$/.test(v)) bls.push(v); }
    if (bls.length) out.bl_no = mostCommon(bls);

    // containers (ISO 6346 with valid check digit preferred)
    const cs = [];
    RE_CONTAINER.lastIndex = 0;
    while ((m = RE_CONTAINER.exec(t))) { const code = m[1] + m[2] + m[3]; if (isoContainerValid(code)) cs.push(code); }
    out.containers = uniq(cs);

    // seals: number right after a container code  (e.g. "ONEU7578511 / 60518695", "ONEU7578511 60518695")
    const seals = [];
    RE_SEAL_AFTER_CNTR.lastIndex = 0;
    while ((m = RE_SEAL_AFTER_CNTR.exec(t))) {
      const cntr = m[0].slice(0, 11);
      if (isoContainerValid(cntr)) seals.push({ container: cntr, seal: m[1] });
    }
    out.seals = seals;

    // fallback from file name "A0050691019519_ONEYRICGU0155500.pdf"
    const fn = String(fileName || '').toUpperCase();
    const fnDecl = /A\d{13}/.exec(fn);
    if (!out.declaration_no && fnDecl) out.declaration_no = fnDecl[0];
    if (!out.bl_no) {
      const fnBl = /A\d{13}[_\- ]+([A-Z]{2,5}[A-Z0-9]{6,20})/.exec(fn);
      if (fnBl) out.bl_no = fnBl[1];
    }

    out.hints.isDeclaration = decls.length > 0 || /ใบขนสินค้า|COMMERCIAL INVOICE|PACKING LIST|SEA WAYBILL|BILL OF LADING/i.test(t);
    out.hints.isMemo = /บันทึกข้อความ|แจ้งการขนย้าย/.test(t);
    return out;
  }
  function mostCommon(arr) {
    const c = {}; let best = arr[0], bn = 0;
    for (const v of arr) { c[v] = (c[v] || 0) + 1; if (c[v] > bn) { bn = c[v]; best = v; } }
    return best;
  }

  // Decide which card a dropped PDF belongs to: 'DECLARATION' | 'MEMO'
  function classifyPdfCategory(text, fileName, pageCount, state) {
    const f = extractFieldsFromText(text, fileName);
    const fn = String(fileName || '').toLowerCase();
    if (f.declaration_no && !f.hints.isMemo) return 'DECLARATION';
    if (f.hints.isMemo) return 'MEMO';
    if (/memo|บันทึก|note/.test(fn)) return 'MEMO';
    if (/^\d{3,6}(\D|$)/.test(fn)) return 'MEMO';                // e.g. 9519.pdf
    if (f.hints.isDeclaration) return 'DECLARATION';
    if (state && state.declarationCount === 0) return 'DECLARATION';
    if (pageCount && pageCount <= 3) return 'MEMO';
    return 'DECLARATION';
  }

  /* ------------------------------------------------------ EXIF orientation */
  // Returns EXIF orientation 1..8 (1 = normal) for a JPEG byte array, or 1 when absent.
  function readJpegOrientation(bytes) {
    try {
      const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      if (u8.length < 4 || u8[0] !== 0xFF || u8[1] !== 0xD8) return 1;
      let off = 2;
      while (off + 4 <= u8.length) {
        if (u8[off] !== 0xFF) return 1;
        const marker = u8[off + 1];
        if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) { off += 2; continue; }
        const len = (u8[off + 2] << 8) | u8[off + 3];
        if (marker === 0xE1 && u8[off + 4] === 0x45 && u8[off + 5] === 0x78 && u8[off + 6] === 0x69 && u8[off + 7] === 0x66) {
          const t = off + 10;                 // TIFF header
          const little = u8[t] === 0x49 && u8[t + 1] === 0x49;
          const r16 = (p) => little ? (u8[p] | (u8[p + 1] << 8)) : ((u8[p] << 8) | u8[p + 1]);
          const r32 = (p) => little ? (u8[p] | (u8[p + 1] << 8) | (u8[p + 2] << 16) | (u8[p + 3] << 24)) >>> 0
                                    : ((u8[p] << 24) | (u8[p + 1] << 16) | (u8[p + 2] << 8) | u8[p + 3]) >>> 0;
          const ifd = t + r32(t + 4);
          const n = r16(ifd);
          for (let i = 0; i < n; i++) {
            const e = ifd + 2 + i * 12;
            if (e + 12 > u8.length) return 1;
            if (r16(e) === 0x0112) { const v = r16(e + 8); return (v >= 1 && v <= 8) ? v : 1; }
          }
          return 1;
        }
        if (marker === 0xDA) return 1;        // start of scan — no more metadata
        off += 2 + len;
      }
    } catch (e) { /* ignore */ }
    return 1;
  }
  // EXIF orientation -> clockwise rotation (degrees) needed to display upright (mirror flags ignored)
  function exifToRotation(o) { return ({ 3: 180, 4: 180, 5: 90, 6: 90, 7: 270, 8: 270 })[o] || 0; }

  /* ---------------------------------------------- photo analysis heuristic */
  // rgba: Uint8ClampedArray/Uint8Array of w*h*4 (small, e.g. ~96px wide). Returns feature set.
  function analyzeImageFeatures(rgba, w, h) {
    const n = w * h;
    const gray = new Float32Array(n);
    let satSum = 0, pinkSum = 0, darkSum = 0, brightSum = 0;
    const hueHist = new Float32Array(12);
    for (let i = 0; i < n; i++) {
      const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const l = (mx + mn) / 2;
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      satSum += sat;
      if (l < 40) darkSum++;
      if (l > 215) brightSum++;
      // hue
      let hue = 0;
      if (mx !== mn) {
        if (mx === r) hue = ((g - b) / (mx - mn)) % 6;
        else if (mx === g) hue = (b - r) / (mx - mn) + 2;
        else hue = (r - g) / (mx - mn) + 4;
        hue = (hue * 60 + 360) % 360;
      }
      if (sat > 0.25 && l > 40) hueHist[Math.floor(hue / 30) % 12] += 1;
      if (sat > 0.3 && (hue >= 300 || hue < 20) && l > 50) pinkSum++;   // magenta/pink/red container paint
    }
    // gradient energy (texture) per half + vertical-edge dominance
    let gx = 0, gy = 0, texL = 0, texR = 0, cntL = 0, cntR = 0, texC = 0, cntC = 0;
    const halfW = w >> 1;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const dx = Math.abs(gray[i + 1] - gray[i - 1]);
        const dy = Math.abs(gray[i + w] - gray[i - w]);
        gx += dx; gy += dy;
        const mag = dx + dy;
        if (x < halfW) { texL += mag; cntL++; } else { texR += mag; cntR++; }
        if (x > w * 0.3 && x < w * 0.7 && y > h * 0.3 && y < h * 0.7) { texC += mag; cntC++; }
      }
    }
    const texture = (gx + gy) / Math.max(1, (w - 2) * (h - 2));
    texL /= Math.max(1, cntL); texR /= Math.max(1, cntR); texC /= Math.max(1, cntC);
    // hue entropy (colourfulness spread)
    let tot = 0; for (let i = 0; i < 12; i++) tot += hueHist[i];
    let ent = 0;
    if (tot > 0) for (let i = 0; i < 12; i++) { const p = hueHist[i] / tot; if (p > 0) ent -= p * Math.log2(p); }
    return {
      texture,                              // overall detail (seal close-up = low)
      vEdgeRatio: gx / Math.max(1, gx + gy),// >0.5 = vertical structures (door bars)
      asym: Math.abs(texL - texR) / Math.max(1, texL + texR), // one door open = strong L/R asymmetry
      texCenter: texC,
      meanSat: satSum / n,
      pinkRatio: pinkSum / n,               // container paint share
      darkRatio: darkSum / n,
      hueEntropy: ent,                      // goods = many colours
      aspect: w / h
    };
  }

  // -> {SEAL, CLOSED, OPEN2, OPEN1} scores 0..1 (relative, used for assignment)
  function scorePhotoTypes(f, fileName) {
    const s = { SEAL: 0, CLOSED: 0, OPEN2: 0, OPEN1: 0 };
    if (f) {
      // SEAL: close-up, little texture, paint-dominant, low colour entropy
      s.SEAL = clamp01(1.2 - f.texture / 18) * 0.5 + clamp01(f.pinkRatio * 1.6) * 0.25 + clamp01(1 - f.hueEntropy / 2.2) * 0.25;
      // CLOSED: paint-dominant, vertical bars, low colour entropy, symmetric
      s.CLOSED = clamp01(f.pinkRatio * 2.2) * 0.4 + clamp01((f.vEdgeRatio - 0.45) * 8) * 0.25 + clamp01(1 - f.hueEntropy / 2.6) * 0.2 + clamp01(1 - f.asym * 3) * 0.15;
      // OPEN2: colourful goods everywhere, little paint, symmetric, high texture
      s.OPEN2 = clamp01(f.hueEntropy / 2.6) * 0.4 + clamp01(1 - f.pinkRatio * 3) * 0.3 + clamp01(1 - f.asym * 3) * 0.15 + clamp01(f.texture / 25) * 0.15;
      // OPEN1: half goods / half paint -> strong asymmetry, medium paint
      s.OPEN1 = clamp01(f.asym * 3.2) * 0.5 + clamp01(1 - Math.abs(f.pinkRatio - 0.3) * 3) * 0.3 + clamp01(f.hueEntropy / 2.6) * 0.2;
    }
    // file-name hints override strongly
    const fn = String(fileName || '').toLowerCase();
    if (/seal|ซีล/.test(fn)) s.SEAL += 1;
    if (/close|closed|ปิด/.test(fn)) s.CLOSED += 1;
    if (/open2|both|สองข้าง|open_2|open-2/.test(fn)) s.OPEN2 += 1;
    else if (/open1|one|ข้างเดียว|open_1|open-1|half/.test(fn)) s.OPEN1 += 1;
    else if (/open|เปิด/.test(fn)) { s.OPEN2 += 0.5; s.OPEN1 += 0.5; }
    return s;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // photos: [{id, features, fileName, container}] -> ordered array of {id, type, confidence}
  // Within each container group: 4 slots SEAL, CLOSED, OPEN2, OPEN1 (best assignment), rest keep input order.
  function autoOrderPhotos(photos) {
    const groups = new Map();
    for (const p of photos) {
      const key = p.container || 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    const result = [];
    for (const [, list] of Array.from(groups.entries()).sort((a, b) => a[0] - b[0])) {
      const scored = list.map(p => ({ p, s: scorePhotoTypes(p.features, p.fileName) }));
      const k = Math.min(4, scored.length);
      // brute-force best assignment of k slots (<= 4! * C(n,4) combos, n small -> fine, cap n at 12 for search)
      const cand = scored.slice(0, 12);
      let best = null, bestScore = -1;
      const slots = PHOTO_TYPES.slice(0, k);
      const idx = cand.map((_, i) => i);
      (function rec(chosen, used) {
        if (chosen.length === k) {
          let sc = 0;
          for (let i = 0; i < k; i++) sc += cand[chosen[i]].s[slots[i]];
          if (sc > bestScore) { bestScore = sc; best = chosen.slice(); }
          return;
        }
        for (const i of idx) if (!used.has(i)) { used.add(i); chosen.push(i); rec(chosen, used); chosen.pop(); used.delete(i); }
      })([], new Set());
      const usedIds = new Set();
      if (best) {
        for (let i = 0; i < k; i++) {
          const c = cand[best[i]];
          const sorted = Object.values(c.s).sort((a, b) => b - a);
          const margin = sorted[0] - (sorted[1] || 0);
          result.push({ id: c.p.id, type: slots[i], confidence: clamp01(margin / 0.25) });
          usedIds.add(c.p.id);
        }
      }
      for (const c of scored) if (!usedIds.has(c.p.id)) result.push({ id: c.p.id, type: 'OTHER', confidence: 1 });
    }
    return result;
  }

  /* --------------------------------------------------------- photo header */
  // "PHOTO 01 | CONTAINER NO. ONEU7578511 | SEAL NO. 60518695"  (blank parts omitted — never invented)
  function photoHeader(n, container, seal) {
    const parts = ['PHOTO ' + pad2(n)];
    if (cleanCode(container)) parts.push('CONTAINER NO. ' + cleanCode(container));
    if (cleanCode(seal)) parts.push('SEAL NO. ' + cleanCode(seal));
    return parts.join(' | ');
  }
  function splitList(s) { return String(s || '').split(/[,;\n]+/).map(x => cleanCode(x)).filter(Boolean); }

  /* ------------------------------------------------------- photo collage */
  // grid for n photos (max 4): 1 -> 1x1, 2 -> 2x1, 3..4 -> 2x2
  function collageLayout(n) { return n <= 1 ? { cols: 1, rows: 1 } : n === 2 ? { cols: 2, rows: 1 } : { cols: 2, rows: 2 }; }
  // Draw a square photo collage like the reference export (page 15): cells cover-cropped, small white gaps.
  // ctx: 2D canvas context (browser or node-canvas); items: [{img (has width/height), rotation (cw deg)}]
  function drawCollage(ctx, items, size, gap) {
    size = size || 2400; gap = gap == null ? 8 : gap;
    const n = Math.min(4, items.length);
    const { cols, rows } = collageLayout(n);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    const cw = (size - gap * (cols + 1)) / cols, ch = (size - gap * (rows + 1)) / rows;
    for (let i = 0; i < n; i++) {
      const it = items[i];
      const c = i % cols, r = Math.floor(i / cols);
      const x = gap + c * (cw + gap), y = gap + r * (ch + gap);
      const rot = ((it.rotation || 0) % 360 + 360) % 360;
      const iw = it.img.width, ih = it.img.height;
      const dw = (rot === 90 || rot === 270) ? ih : iw, dh = (rot === 90 || rot === 270) ? iw : ih;
      const sc = Math.max(cw / dw, ch / dh);                       // cover
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, cw, ch); ctx.clip();
      ctx.translate(x + cw / 2, y + ch / 2);
      ctx.rotate(rot * Math.PI / 180);
      ctx.drawImage(it.img, -iw * sc / 2, -ih * sc / 2, iw * sc, ih * sc);
      ctx.restore();
    }
    return { cols, rows, n };
  }

  /* ------------------------------------------------------- merged PDF build */
  // opts = { PDFLib, pdfDocs: [{bytes, rotations:[deg per page], label, type:'DECLARATION'|'MEMO'}],
  //          photos: [{bytes, isPng, rotation(cw deg), header, name}],
  //          collages: [{bytes, isPng, name}]                 // square collage images, appended last
  //          photoLayout: 'full' (default, like the reference) | 'a4header' (1 photo per A4 + PHOTO header)
  //          memoAfterFirstPage: true (default) -> page order = declaration p.1, memo pages, declaration p.2.., photos, collages
  //          onProgress(msg, frac) }
  // -> { bytes: Uint8Array, pageCount, parts: {pdfPages, photoPages, collagePages} }
  async function buildMergedPdf(opts) {
    const { PDFDocument, StandardFonts, rgb, degrees } = opts.PDFLib;
    const out = await PDFDocument.create();
    out.setTitle(opts.title || 'J&P LOGISTICS');
    out.setProducer('J&P LOGISTICS');
    const progress = opts.onProgress || (() => {});
    const layout = opts.photoLayout || 'full';
    const memoAfterFirst = opts.memoAfterFirstPage !== false;
    let pdfPages = 0;
    const docs = opts.pdfDocs || [];
    // load + copy every source document first (originals untouched)
    const loaded = [];
    for (let d = 0; d < docs.length; d++) {
      const doc = docs[d];
      progress('กำลังอ่าน ' + (doc.label || 'PDF') + ' (' + (d + 1) + '/' + docs.length + ')', 0.05 + 0.35 * d / Math.max(1, docs.length));
      let src;
      try { src = await PDFDocument.load(doc.bytes, { ignoreEncryption: true }); }
      catch (e) { throw new Error('ไฟล์ PDF เปิดไม่ได้: ' + (doc.label || '') + ' — ' + (e && e.message ? e.message : e)); }
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((pg, i) => { const extra = (doc.rotations && doc.rotations[i]) ? doc.rotations[i] : 0; if (extra) pg.setRotation(degrees(((pg.getRotation().angle || 0) + extra) % 360)); });
      loaded.push({ doc, pages: copied, type: doc.type || (d === 0 ? 'DECLARATION' : 'MEMO') });
    }
    // page order (reference export): declaration page 1 -> memo (all) -> rest of declaration -> other declaration files
    const decl = loaded.filter(l => l.type === 'DECLARATION'), memo = loaded.filter(l => l.type !== 'DECLARATION');
    const order = [];
    if (memoAfterFirst && decl.length && decl[0].pages.length) {
      order.push(decl[0].pages[0]);
      memo.forEach(m => order.push(...m.pages));
      order.push(...decl[0].pages.slice(1));
      decl.slice(1).forEach(l => order.push(...l.pages));
    } else {
      decl.forEach(l => order.push(...l.pages));
      memo.forEach(l => order.push(...l.pages));
    }
    order.forEach(pg => { out.addPage(pg); pdfPages++; });

    const photos = opts.photos || [];
    let font = null;
    if (photos.length && layout === 'a4header') font = await out.embedFont(StandardFonts.HelveticaBold);
    const A4W = 595.28, A4H = 841.89, M = 28, HEADER_H = 42, MAX_EDGE = 1474;
    for (let i = 0; i < photos.length; i++) {
      const ph = photos[i];
      progress('กำลังใส่รูปภาพ PHOTO ' + pad2(i + 1) + ' (' + (i + 1) + '/' + photos.length + ')', 0.45 + 0.4 * i / photos.length);
      let img;
      try { img = ph.isPng ? await out.embedPng(ph.bytes) : await out.embedJpg(ph.bytes); }
      catch (e) { throw new Error('รูปภาพเปิดไม่ได้: ' + (ph.name || ('PHOTO ' + pad2(i + 1))) + ' — ' + (e && e.message ? e.message : e)); }
      const rot = ((ph.rotation || 0) % 360 + 360) % 360;        // clockwise, as shown to the user
      const iw = img.width, ih = img.height;
      const dispW = (rot === 90 || rot === 270) ? ih : iw;        // displayed dimensions after rotation
      const dispH = (rot === 90 || rot === 270) ? iw : ih;
      let page, L, B, dW, dH, scale;
      if (layout === 'a4header') {
        page = out.addPage([A4W, A4H]);
        page.drawText(ph.header || photoHeader(i + 1), { x: M, y: A4H - 26, size: 11, font, color: rgb(0.07, 0.2, 0.45) });
        page.drawLine({ start: { x: M, y: A4H - HEADER_H + 6 }, end: { x: A4W - M, y: A4H - HEADER_H + 6 }, thickness: 0.8, color: rgb(0.75, 0.8, 0.9) });
        const boxX = M, boxY = M, boxW = A4W - 2 * M, boxH = A4H - HEADER_H - 2 * M;
        scale = Math.min(boxW / dispW, boxH / dispH);
        dW = dispW * scale; dH = dispH * scale;
        L = boxX + (boxW - dW) / 2; B = boxY + (boxH - dH) / 2;
      } else {
        // full-page photo: page size = displayed image size (1 px = 1 pt, like the reference), capped for huge photos
        scale = Math.min(1, MAX_EDGE / Math.max(dispW, dispH));
        dW = dispW * scale; dH = dispH * scale;
        page = out.addPage([dW, dH]);
        L = 0; B = 0;
      }
      const w = iw * scale, h = ih * scale;                       // unrotated drawing size
      // pdf-lib rotates counter-clockwise around (x,y); clockwise UI rotation r == CCW (360-r)
      let x = L, y = B, ccw = (360 - rot) % 360;
      if (ccw === 90) { x = L + h; y = B; }           // occupies [x-h,x] x [y,y+w]
      else if (ccw === 180) { x = L + w; y = B + h; } // occupies [x-w,x] x [y-h,y]
      else if (ccw === 270) { x = L; y = B + w; }     // occupies [x,x+h] x [y-w,y]
      page.drawImage(img, { x, y, width: w, height: h, rotate: degrees(ccw) });
    }
    // collage page(s): square, like the last page of the reference export
    const collages = opts.collages || [];
    for (let i = 0; i < collages.length; i++) {
      const cg = collages[i];
      progress('กำลังใส่หน้ารวมรูป (' + (i + 1) + '/' + collages.length + ')', 0.9);
      let img;
      try { img = cg.isPng ? await out.embedPng(cg.bytes) : await out.embedJpg(cg.bytes); }
      catch (e) { throw new Error('หน้ารวมรูปสร้างไม่ได้: ' + (e && e.message ? e.message : e)); }
      const side = 576;                                            // 8 inch square (reference page 15 = 576 x 576 pt)
      const page = out.addPage([side, side]);
      page.drawImage(img, { x: 0, y: 0, width: side, height: side });
    }
    progress('กำลังสร้างไฟล์ PDF', 0.96);
    const bytes = await out.save({ useObjectStreams: true });
    return { bytes, pageCount: out.getPageCount(), parts: { pdfPages, photoPages: photos.length, collagePages: collages.length } };
  }

  return {
    MONTHS, PHOTO_TYPES, PHOTO_TYPE_LABEL,
    formatDateDDMMMYYYY, parseDateInput, parseISODate, toISODate,
    sanitizeFileName, cleanCode, buildBaseName,
    extractFieldsFromText, classifyPdfCategory, isoContainerValid,
    readJpegOrientation, exifToRotation,
    analyzeImageFeatures, scorePhotoTypes, autoOrderPhotos,
    photoHeader, splitList, buildMergedPdf, collageLayout, drawCollage
  };
}));
