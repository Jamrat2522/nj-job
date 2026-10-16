/* =====================================================================
 * J&P LOGISTICS — jp-core.js  (local120)
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
    SEAL: 'รูปซีล', CLOSED: 'ประตูตู้ปิดสนิท', OPEN2: 'เปิดตู้สองข้าง', OPEN1: 'เปิดตู้ข้างเดียว', OTHER: 'รูปเพิ่มเติม'
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
  /* ---------- local112: PACKING LIST -> [{container, seal}] in document order (MASTER for Container/Seal No.) ---------- */
  // pdf.js text items of one page -> text lines top→bottom, items left→right
  function pdfItemsToLines(items) {
    const rows = [];
    for (const it of items || []) {
      const str = String(it.str || ''); if (!str.trim()) continue;
      const tr = it.transform || [1, 0, 0, 1, 0, 0], x = tr[4], y = tr[5], hgt = Math.abs(tr[3]) || it.height || 8;
      let row = rows.find(r => Math.abs(r.y - y) <= Math.max(2, hgt * 0.45));
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, str });
    }
    rows.sort((a, b) => b.y - a.y);
    return rows.map(r => r.items.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
  }
  const RE_PL_CNTR = /\b([A-Z]{4})\s?(\d{6})\s?(\d)\b/g;
  // pages: [[line, ...], ...] ; opts.ocr = true when the lines come from OCR of a scanned page
  function extractPackingList(pages, opts) {
    opts = opts || {};
    const res = { found: false, pages: [], rows: [], total: 0, unclear: [] };
    const isPL = lines => lines.some(l => /PACKING\s*LIST/i.test(l) && !/CERTIFICATE/i.test(l));
    const otherTitle = lines => lines.some(l => /INVOICE|BILL\s+OF\s+LADING|WAYBILL|CERTIF|BENEFICIARY|FAX\s+COPY|ใบขนสินค้า|บันทึกข้อความ/i.test(l));
    const use = [];
    (pages || []).forEach((lines, i) => {
      if (isPL(lines)) use.push(i);
      else if (use.length && use[use.length - 1] === i - 1 && !otherTitle(lines) && lines.some(l => { RE_PL_CNTR.lastIndex = 0; return RE_PL_CNTR.test(l.toUpperCase()); })) use.push(i);   // continuation page
    });
    if (!use.length) return res;
    res.found = true; res.pages = use.map(i => i + 1);
    const seen = new Set();
    for (const pi of use) for (const raw of pages[pi]) {
      const line = String(raw).toUpperCase();
      const tm = /TOTAL\s+(?:NUMBER\s+OF\s+)?CONTAINERS?\s*[:\-]?\s*(\d{1,4})/.exec(line); if (tm) res.total = Math.max(res.total, +tm[1]);
      RE_PL_CNTR.lastIndex = 0; let m;
      while ((m = RE_PL_CNTR.exec(line))) {
        const code = m[1] + m[2] + m[3];
        if (!isoContainerValid(code)) { res.unclear.push(code); continue; }
        if (seen.has(code)) continue;
        // seal = first token after the container on the same row with >= 5 digits (weights "16,121" / units "20" never match)
        const rest = line.slice(m.index + m[0].length).replace(/^[\s\/:\-]+/, '');
        const tok = rest.split(/[\s\/]+/).find(t => /^[A-Z]{0,4}\d{5,12}[A-Z]?$/.test(t) && (t.match(/\d/g) || []).length >= 5);
        const seal = tok && !RE_PL_CNTR.test(tok) ? tok : '';
        RE_PL_CNTR.lastIndex = m.index + m[0].length;
        seen.add(code);
        res.rows.push({ container: code, seal });
      }
    }
    res.ocr = !!opts.ocr;
    return res;
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
      // close-up of the seal: little texture, almost no dark background (sky / container interior), paint-dominant, few colours
      s.SEAL = clamp01(1.3 - f.texture / 45) * 0.4 + clamp01(f.pinkRatio * 1.6) * 0.25 + clamp01(1 - f.hueEntropy / 2.2) * 0.15 + clamp01(1 - f.darkRatio * 4) * 0.2;
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
      // brute-force best assignment of k photos to k of the 4 standard slots (slots may stay empty when < 4 photos,
      // so 2 photos of opened doors are NOT forced into SEAL/CLOSED). cap search at 12 photos.
      const cand = scored.slice(0, 12);
      let best = null, bestScore = -1;
      (function rec(slot, chosen, used, count) {
        if (slot === PHOTO_TYPES.length) {
          if (count !== k) return;
          let sc = 0;
          for (let i = 0; i < chosen.length; i++) if (chosen[i] >= 0) sc += cand[chosen[i]].s[PHOTO_TYPES[i]];
          if (sc > bestScore) { bestScore = sc; best = chosen.slice(); }
          return;
        }
        const left = PHOTO_TYPES.length - slot;
        if (k - count < left) { chosen.push(-1); rec(slot + 1, chosen, used, count); chosen.pop(); }   // leave slot empty
        if (count < k) for (let i = 0; i < cand.length; i++) if (!used.has(i)) { used.add(i); chosen.push(i); rec(slot + 1, chosen, used, count + 1); chosen.pop(); used.delete(i); }
      })(0, [], new Set(), 0);
      const usedIds = new Set();
      if (best) {
        for (let i = 0; i < best.length; i++) {
          if (best[i] < 0) continue;
          const c = cand[best[i]];
          const sorted = Object.values(c.s).sort((a, b) => b - a);
          const margin = sorted[0] - (sorted[1] || 0);
          result.push({ id: c.p.id, type: PHOTO_TYPES[i], confidence: clamp01(margin / 0.25) });
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

  /* ---------- local114: ONE A4 portrait photo page, fixed 2×2 by photo type ----------
   * top-left = CLOSED (ปิดตู้) · top-right = OPEN1 (เปิดครึ่งตู้ / ข้างเดียว) · bottom-left = OPEN2 (เปิดเต็มตู้ / สองข้าง) · bottom-right = SEAL
   * a missing type leaves its cell empty (no placeholder photo); the first photo of each type is used */
  const A4_SLOTS = ['CLOSED', 'OPEN1', 'OPEN2', 'SEAL'];
  function collageSlotsA4(photos) { return A4_SLOTS.map(t => (photos || []).find(p => p && p.type === t) || null); }
  // ctx: 2D canvas W×H (A4 ratio); slots: [{img, rotation} | null] x4; m = outer margin px, gap = gap px. Cells are cover-cropped (no stretching).
  function drawCollageA4(ctx, slots, W, H, m, gap) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const cw = (W - 2 * m - gap) / 2, ch = (H - 2 * m - gap) / 2;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const it = slots[i]; if (!it || !it.img) continue;
      const x = m + (i % 2) * (cw + gap), y = m + Math.floor(i / 2) * (ch + gap);
      const rot = ((it.rotation || 0) % 360 + 360) % 360, iw = it.img.width, ih = it.img.height;
      const dw = (rot === 90 || rot === 270) ? ih : iw, dh = (rot === 90 || rot === 270) ? iw : ih;
      const sc = Math.max(cw / dw, ch / dh);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, cw, ch); ctx.clip();
      ctx.translate(x + cw / 2, y + ch / 2); ctx.rotate(rot * Math.PI / 180);
      ctx.drawImage(it.img, -iw * sc / 2, -ih * sc / 2, iw * sc, ih * sc);
      ctx.restore(); n++;
    }
    return { n, cell: { w: cw, h: ch } };
  }

  /* ---------- local118: 💰 วางบิล — ③ บัญชี files live in storage only: {owner}/{job}/ACCOUNT/{ts}-{base64url(name)}.pdf ---------- */
  function b64urlEncode(str) { const b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(str))) : Buffer.from(str, 'utf8').toString('base64'); return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64urlDecode(b) { b = b.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; try { return typeof atob === 'function' ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, 'base64').toString('utf8'); } catch (e) { return ''; } }
  function accountObjectName(fileName, ts) { return String(ts || Date.now()) + '-' + b64urlEncode(String(fileName || 'account.pdf').slice(0, 120)) + '.pdf'; }
  function accountFileName(objectName) { const m = /^(\d+)-([A-Za-z0-9_-]+)\.pdf$/.exec(String(objectName || '')); return m ? (b64urlDecode(m[2]) || objectName) : String(objectName || ''); }
  // docs [{bytes, rotations}] -> ONE PDF, pages exactly in the given order (no reordering, no extra pages)
  async function mergePdfsInOrder(PDFLib, docs, title) {
    const { PDFDocument, degrees } = PDFLib; const out = await PDFDocument.create();
    if (title) out.setTitle(title); out.setProducer('J&P LOGISTICS');
    for (const d of docs) {
      const src = await PDFDocument.load(d.bytes, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((pg, i) => { const extra = d.rotations && d.rotations[i] ? d.rotations[i] : 0; if (extra) pg.setRotation(degrees(((pg.getRotation().angle || 0) + extra) % 360)); out.addPage(pg); });
    }
    const bytes = await out.save({ useObjectStreams: true });
    return { bytes, pageCount: out.getPageCount() };
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
      if (cg.a4) {                                                 // local114: A4 portrait photo page
        const page = out.addPage([A4W, A4H]);
        page.drawImage(img, { x: 0, y: 0, width: A4W, height: A4H });
      } else {
        const side = 576;                                          // 8 inch square (reference page 15 = 576 x 576 pt)
        const page = out.addPage([side, side]);
        page.drawImage(img, { x: 0, y: 0, width: side, height: side });
      }
    }
    progress('กำลังสร้างไฟล์ PDF', 0.96);
    const bytes = await out.save({ useObjectStreams: true });
    return { bytes, pageCount: out.getPageCount(), parts: { pdfPages, photoPages: photos.length, collagePages: collages.length } };
  }

  /* ================================================================ OCR (local102)
   * Pure helpers — the browser (tesseract.js + canvas) and the node tests (tesseract.js + node-canvas)
   * provide getRGBA() / recognize(); everything else is shared here.
   * Rule: never guess. A container number is accepted automatically only when its ISO 6346 check digit is
   * read and valid; a seal only when it matches the declaration. Anything else is filled as "ต้องยืนยัน".
   * ================================================================ */
  const OWNER_FIX = { '0': 'O', '1': 'I', '2': 'Z', '5': 'S', '6': 'G', '8': 'B', '4': 'A' };
  // only the classic OCR confusions; the CHECK digit is never converted from a letter (must be read as a digit)
  const DIGIT_FIX = { O: '0', D: '0', Q: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' };
  const CONTAINER_UNREAD = '⚠️ ไม่สามารถอ่านเลขตู้ได้ กรุณาตรวจสอบหรือกรอกเอง';

  // white paint text (most container doors) -> black text on white
  function ocrBinaryWhiteText(rgba, w, h) {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h * 4; i += 4) {
      const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      const v = (mn > 165 && mx - mn < 70) ? 0 : 255;
      out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
    }
    return out;
  }
  // dark text on light paint (white/grey containers) -> black text on white
  function ocrBinaryDarkText(rgba, w, h) {
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h * 4; i += 4) {
      const l = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
      const v = l < 70 ? 0 : 255;
      out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
    }
    return out;
  }
  function isTagColor(r, g, b) { return r > 140 && g > 90 && r - b > 80 && g - b > 40; }   // yellow / orange seal tag

  // Seal tag: find the yellow/orange tag rows, keep dark ink inside the tag span, split into text-line bands.
  // -> { tagRatio, bands: [{ data: RGBA (black on white, padded, x2), w, h }] }   (max 3 biggest bands)
  function ocrSealBands(rgba, w, h, opts) {
    opts = opts || {};
    const scale = opts.scale || 2, pad = 20, maxBands = opts.maxBands || 3;
    const L = new Int32Array(h).fill(-1), R = new Int32Array(h).fill(-1), cnt = new Int32Array(h);
    let tagPx = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isTagColor(rgba[i], rgba[i + 1], rgba[i + 2])) { if (L[y] < 0) L[y] = x; R[y] = x; cnt[y]++; tagPx++; }
    }
    const tagRatio = tagPx / (w * h);
    if (tagRatio < 0.002) return { tagRatio, bands: [] };
    let maxC = 0; for (let y = 0; y < h; y++) if (cnt[y] > maxC) maxC = cnt[y];
    let y0 = -1, y1 = -1;
    for (let y = 0; y < h; y++) if (cnt[y] > maxC * 0.35) { if (y0 < 0) y0 = y; y1 = y; }
    if (y0 < 0) return { tagRatio, bands: [] };
    const ink = new Uint8Array(w * h), rowInk = new Int32Array(h);
    for (let y = y0; y <= y1; y++) {
      if (L[y] < 0) continue;
      for (let x = L[y]; x <= R[y]; x++) {
        const i = (y * w + x) * 4;
        if ((rgba[i] + rgba[i + 1]) / 2 < 110 && !isTagColor(rgba[i], rgba[i + 1], rgba[i + 2])) { ink[y * w + x] = 1; rowInk[y]++; }
      }
    }
    const bands = []; let s = -1;
    for (let y = y0; y <= y1 + 1; y++) {
      const on = y <= y1 && rowInk[y] > 4;
      if (on && s < 0) s = y;
      if (!on && s >= 0) { if (y - s > 8) bands.push([s, y - 1]); s = -1; }
    }
    const out = [];
    for (const [b0, b1] of bands) {
      let x0 = w, x1 = -1, area = 0;
      for (let y = b0; y <= b1; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; area++; }
      const bw = x1 - x0 + 1, bh = b1 - b0 + 1;
      if (x1 < 0 || bh < 12 || bw < bh * 2) continue;
      const W2 = (bw + pad * 2) * scale, H2 = (bh + pad * 2) * scale;
      const data = new Uint8ClampedArray(W2 * H2 * 4).fill(255);
      for (let y = b0; y <= b1; y++) for (let x = x0; x <= x1; x++) if (ink[y * w + x]) {
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
          const j = (((y - b0 + pad) * scale + dy) * W2 + (x - x0 + pad) * scale + dx) * 4;
          data[j] = data[j + 1] = data[j + 2] = 0;
        }
      }
      out.push({ data, w: W2, h: H2, area });
    }
    out.sort((a, b) => b.area - a.area);
    return { tagRatio, bands: out.slice(0, maxBands) };
  }

  function isoCheckDigit(code10) {
    const map = {}; let v = 10;
    for (let i = 0; i < 26; i++) { if (v % 11 === 0) v++; map[String.fromCharCode(65 + i)] = v; v++; }
    let sum = 0;
    for (let i = 0; i < 10; i++) { const ch = code10[i]; const val = i < 4 ? map[ch] : +ch; if (val == null || isNaN(val)) return -1; sum += val * Math.pow(2, i); }
    return (sum % 11) % 10;
  }
  // OCR words -> container reads: [{owner, serial, check(null|digit), raw, valid, code}]
  function parseContainerOcr(text) {
    const t = ' ' + String(text || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ') + ' ';
    const re = /(?=\s?([A-Z0-9]{3}[UJZ0-9])\s?([A-Z0-9]{6})(?:\s?([A-Z0-9]))?(?=\s))/g;
    const out = [], seen = new Set();
    let m;
    while ((m = re.exec(t))) {
      re.lastIndex = m.index + 1;
      const ownerRaw = m[1], serialRaw = m[2], checkRaw = m[3] || '';
      const owner = ownerRaw.split('').map((c, i) => (i < 3 ? (OWNER_FIX[c] || c) : (c === '0' ? 'U' : c))).join('');
      if (!/^[A-Z]{3}[UJZ]$/.test(owner)) continue;
      if ((ownerRaw.match(/[A-Z]/g) || []).length < 2) continue;   // local110: digits-only text (e.g. a seal number) is never a container no.
      const digitsInSerial = (serialRaw.match(/\d/g) || []).length;
      if (digitsInSerial < 5) continue;
      const serial = serialRaw.split('').map(c => DIGIT_FIX[c] || c).join('');
      if (!/^\d{6}$/.test(serial)) continue;
      const chk = /^\d$/.test(checkRaw) ? +checkRaw : null;   // letter in the check position = check digit NOT read
      const key = owner + serial + (chk == null ? '?' : chk);
      if (seen.has(key)) continue; seen.add(key);
      const valid = chk != null && isoCheckDigit(owner + serial) === chk;
      out.push({ owner, serial, check: chk, raw: (ownerRaw + ' ' + serialRaw + ' ' + checkRaw).trim(), valid, code: valid ? owner + serial + chk : '' });
    }
    // prefer reads with a check digit / valid
    out.sort((a, b) => (b.valid - a.valid) || ((b.check != null) - (a.check != null)));
    return out;
  }
  function hamming(a, b) { if (a.length !== b.length) return 99; let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; }
  // single-character corrections of the serial that make the read check digit valid
  function containerFixCandidates(read) {
    if (read.check == null) return [];
    const res = [];
    for (let i = 0; i < 6; i++) for (let d = 0; d <= 9; d++) {
      if (String(d) === read.serial[i]) continue;
      const s2 = read.serial.slice(0, i) + d + read.serial.slice(i + 1);
      if (isoCheckDigit(read.owner + s2) === read.check) res.push(read.owner + s2 + read.check);
    }
    return res;
  }
  /* ---------- local110: Container No. OCR — locate the code, crop / rotate / enhance only that area ---------- */
  // crop rect of an RGBA image, rotate by deg around the crop centre, scale (bilinear) -> RGBA
  function ocrCropRotScale(rgba, w, h, rect, deg, scale) {
    const x0 = Math.max(0, Math.floor(rect.x0)), y0 = Math.max(0, Math.floor(rect.y0)), x1 = Math.min(w, Math.ceil(rect.x1)), y1 = Math.min(h, Math.ceil(rect.y1));
    const cw = Math.max(1, x1 - x0), ch = Math.max(1, y1 - y0), W = Math.max(1, Math.round(cw * scale)), H = Math.max(1, Math.round(ch * scale));
    const out = new Uint8ClampedArray(W * H * 4), a = -deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const cx = x0 + cw / 2, cy = y0 + ch / 2;
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      const u = (X + 0.5) / scale - cw / 2, v = (Y + 0.5) / scale - ch / 2;
      let sx = cx + u * ca - v * sa - 0.5, sy = cy + u * sa + v * ca - 0.5;
      if (sx < 0) sx = 0; if (sy < 0) sy = 0; if (sx > w - 1) sx = w - 1; if (sy > h - 1) sy = h - 1;
      const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy, ix2 = Math.min(w - 1, ix + 1), iy2 = Math.min(h - 1, iy + 1);
      const o = (Y * W + X) * 4;
      for (let c = 0; c < 3; c++) {
        const p00 = rgba[(iy * w + ix) * 4 + c], p10 = rgba[(iy * w + ix2) * 4 + c], p01 = rgba[(iy2 * w + ix) * 4 + c], p11 = rgba[(iy2 * w + ix2) * 4 + c];
        out[o + c] = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
      }
      out[o + 3] = 255;
    }
    return { data: out, w: W, h: H };
  }
  // local-contrast binarisation (handles shadows of the door bars): white paint text (polarity 'white') or dark text ('dark')
  function ocrAdaptiveBin(rgba, w, h, opts) {
    const win = Math.max(3, opts.win | 0), k = opts.k, white = opts.polarity !== 'dark';
    const v = new Float32Array(w * h), sat = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], mn = Math.min(r, g, b), mx = Math.max(r, g, b);
      v[i] = white ? mn : 0.299 * r + 0.587 * g + 0.114 * b; sat[i] = mx - mn;
    }
    const I = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += v[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
    const out = new Uint8ClampedArray(w * h * 4), r = win >> 1;
    for (let y = 0; y < h; y++) {
      const ya = Math.max(0, y - r), yb = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const xa = Math.max(0, x - r), xb = Math.min(w, x + r + 1);
        const m = (I[yb * (w + 1) + xb] - I[ya * (w + 1) + xb] - I[yb * (w + 1) + xa] + I[ya * (w + 1) + xa]) / ((xb - xa) * (yb - ya));
        const i = y * w + x;
        const on = white ? (v[i] - m > k && v[i] > 55 && sat[i] < 100) : (m - v[i] > k && v[i] < 150);
        out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = on ? 0 : 255; out[i * 4 + 3] = 255;
      }
    }
    return out;
  }
  // morphological opening of black ink with a k×k square: removes thin lines (check-digit box, bar edges, scratches), keeps strokes
  function ocrOpenBin(rgba, w, h, k) {
    if (!k || k < 2) return rgba;
    const r = k >> 1, n = w * h;
    let a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = rgba[i * 4] === 0 ? 1 : 0;
    const pass = (src, horiz, erode) => {
      const dst = new Uint8Array(n), L = horiz ? w : h, M = horiz ? h : w;
      for (let m = 0; m < M; m++) {
        let cnt = 0; const at = t => (horiz ? src[m * w + t] : src[t * w + m]);
        for (let t = 0; t < Math.min(r, L); t++) cnt += at(t);
        for (let t = 0; t < L; t++) {
          if (t + r < L) cnt += at(t + r);
          if (t - r - 1 >= 0) cnt -= at(t - r - 1);
          const span = Math.min(L - 1, t + r) - Math.max(0, t - r) + 1;
          const val = erode ? (cnt === span && span === 2 * r + 1 ? 1 : 0) : (cnt > 0 ? 1 : 0);
          if (horiz) dst[m * w + t] = val; else dst[t * w + m] = val;
        }
      }
      return dst;
    };
    a = pass(pass(a, true, true), false, true);
    a = pass(pass(a, true, false), false, false);
    const out = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) { const vv = a[i] ? 0 : 255; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = vv; out[i * 4 + 3] = 255; }
    return out;
  }
  // connected-component clean-up of a binarised crop (T = expected character height in px):
  // drops door bars / frames (too tall), long thin lines, specks, and the outline box drawn around the check digit
  function ocrCleanBin(rgba, w, h, T) {
    const n = w * h, ink = new Uint8Array(n), lab = new Int32Array(n).fill(-1), comps = [];
    for (let i = 0; i < n; i++) ink[i] = rgba[i * 4] === 0 ? 1 : 0;
    const stack = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      if (!ink[i] || lab[i] >= 0) continue;
      const id = comps.length; let sp = 0, x0 = w, y0 = h, x1 = -1, y1 = -1, area = 0;
      stack[sp++] = i; lab[i] = id;
      while (sp) {
        const j = stack[--sp], x = j % w, y = (j - x) / w; area++;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (x > 0 && ink[j - 1] && lab[j - 1] < 0) { lab[j - 1] = id; stack[sp++] = j - 1; }
        if (x < w - 1 && ink[j + 1] && lab[j + 1] < 0) { lab[j + 1] = id; stack[sp++] = j + 1; }
        if (y > 0 && ink[j - w] && lab[j - w] < 0) { lab[j - w] = id; stack[sp++] = j - w; }
        if (y < h - 1 && ink[j + w] && lab[j + w] < 0) { lab[j + w] = id; stack[sp++] = j + w; }
      }
      comps.push({ x0, y0, x1, y1, area, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
    const drop = comps.map(c => c.h > 1.9 * T || (c.w > 3 * T && c.h < 0.45 * T) || (c.w < 0.3 * T && c.h < 0.3 * T) || c.area < 0.01 * T * T);
    comps.forEach((c, k) => {                                   // outline box: char-sized, hollow, with another component inside
      if (drop[k] || c.h < 0.7 * T || c.w < 0.35 * T || c.w > 1.6 * T || c.area / (c.w * c.h) > 0.3) return;
      if (comps.some((d, m) => m !== k && !drop[m] && d.x0 > c.x0 && d.x1 < c.x1 && d.y0 > c.y0 && d.y1 < c.y1)) drop[k] = true;
    });
    const out = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) { const v = ink[i] && !drop[lab[i]] ? 0 : 255; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
    return out;
  }
  // skew of the text in a binarised crop (projection profile): the rotation (deg, for ocrCropRotScale) that makes text lines sharpest
  function ocrEstimateSkew(rgba, w, h, maxDeg) {
    const xs = [], ys = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4] === 0) { xs.push(x - w / 2); ys.push(y - h / 2); }
    if (xs.length < 50) return 0;
    const step = Math.max(1, Math.floor(xs.length / 40000));
    let best = 0, bestScore = -1;
    for (let d = -maxDeg; d <= maxDeg; d += 0.5) {
      const a = d * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), bins = new Float64Array(h * 2 + 4);
      for (let i = 0; i < xs.length; i += step) { const yy = Math.round(xs[i] * sa + ys[i] * ca + h); if (yy >= 0 && yy < bins.length) bins[yy]++; }
      let sc = 0; for (let i = 1; i < bins.length; i++) { const df = bins[i] - bins[i - 1]; sc += df * df; }
      if (sc > bestScore) { bestScore = sc; best = d; }
    }
    return best;
  }
  // OCR words that look like the owner code (e.g. ONEU) or the serial -> anchor boxes for the crop
  function containerAnchors(words) {
    const out = [];
    for (const wd of words || []) {
      const t = String(wd.text || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), b = wd.bbox; if (!b || !t) continue;
      const hgt = b.y1 - b.y0; if (hgt < 8) continue;
      const head = t.slice(0, 4), letters = (head.match(/[A-Z]/g) || []).length;
      const bl = wd.baseline, tilt = (bl && bl.has_baseline !== false && bl.x1 - bl.x0 > hgt * 1.5) ? Math.atan2(bl.y1 - bl.y0, bl.x1 - bl.x0) * 180 / Math.PI : 0;
      if (t.length >= 4 && letters >= 2 && /^[A-Z0-9]{3}[UJZ0]$/.test(head)) out.push({ kind: 'owner', bbox: b, h: hgt, tilt, polarity: wd.polarity, conf: wd.confidence || 0, score: 2 + (letters === 4 ? 1 : 0) });
      else if (/^\d{5,7}$/.test(t.replace(/[OD]/g, '0'))) out.push({ kind: 'serial', bbox: b, h: hgt, tilt, polarity: wd.polarity, conf: wd.confidence || 0, score: 1 });
    }
    out.sort((a, b) => (b.score - a.score) || (b.conf - a.conf));
    const picked = [];
    for (const a of out) if (!picked.some(p => Math.abs(p.bbox.y0 - a.bbox.y0) < p.h && Math.abs(p.bbox.x0 - a.bbox.x0) < p.h * 12)) picked.push(a);
    return picked.slice(0, 2);
  }
  // merge reads of ONE photo: same number read by several passes = one read with votes
  function mergeContainerReads(reads) {
    const m = new Map();
    for (const r of reads) {
      const key = r.owner + r.serial + (r.check == null ? '?' : r.check);
      const cur = m.get(key);
      if (cur) cur.votes = (cur.votes || 1) + (r.votes || 1); else m.set(key, Object.assign({}, r, { votes: r.votes || 1 }));
    }
    return Array.from(m.values()).sort((a, b) => (b.valid - a.valid) || (b.votes - a.votes) || ((b.check != null) - (a.check != null)));
  }
  // safety: a "valid" read whose owner code disagrees with what most passes of the same photo read (e.g. OHEU / GIEU vs ONEU)
  // is a lucky check-digit coincidence, not a read -> it is kept only as an unconfirmed raw read (never filled)
  function consensusFilter(reads) {
    const ov = {}, sv = {};
    reads.forEach(r => { ov[r.owner] = (ov[r.owner] || 0) + (r.votes || 1); });
    const topOwner = Object.keys(ov).sort((a, b) => ov[b] - ov[a])[0];
    reads.forEach(r => { if (r.owner === topOwner) sv[r.serial] = (sv[r.serial] || 0) + (r.votes || 1); });
    return reads.map(r => {
      if (!r.valid) return r;
      const badOwner = r.owner !== topOwner && ov[topOwner] >= 2 * ov[r.owner];
      const near = Object.keys(sv).some(s2 => s2 !== r.serial && sv[s2] >= 2 && hamming(s2, r.serial) <= 1) || (sv[r.serial] || 0) >= 1;
      if (badOwner || !near) return Object.assign({}, r, { valid: false, code: '', rejected: badOwner ? 'owner' : 'serial' });
      return r;
    });
  }
  // one photo -> container reads. Full-image passes first (unchanged), then a focused crop around the code:
  // crop -> rotate (tilted photos) -> upscale -> local-contrast binarise -> remove thin lines -> OCR (single block / sparse)
  async function ocrContainerPhoto(env) {
    const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const img = await env.getRGBA(0, 2000);
    let reads = [], words = [];
    const run = async (data, w, h, psm) => { const r = await env.recognize(data, w, h, { psm, whitelist: AZ }); return r || { text: '' }; };
    const okReads = () => consensusFilter(mergeContainerReads(reads)).filter(r => r.valid);
    let budget = 30;                                             // max focused OCR passes per photo (speed)
    const strong = () => { const v = okReads(); return v.length && (v[0].votes >= 2) && (v.length === 1 || v[0].votes >= 2 * v[1].votes); };
    const tag = (ws, pol) => (ws || []).map(x => Object.assign({}, x, { polarity: pol }));
    let r = await run(ocrBinaryWhiteText(img.data, img.w, img.h), img.w, img.h, 11);
    reads = reads.concat(parseContainerOcr(r.text)); words = words.concat(tag(r.words, 'white'));
    if (!reads.some(x => x.check != null)) {
      r = await run(ocrBinaryDarkText(img.data, img.w, img.h), img.w, img.h, 11);
      reads = reads.concat(parseContainerOcr(r.text)); words = words.concat(tag(r.words, 'dark'));
    }
    let anchors = containerAnchors(words);
    if (!anchors.length && !reads.some(x => x.valid)) {       // nothing found: one local-contrast pass over the whole photo to locate the code
      for (const pol of ['white', 'dark']) {
        r = await run(ocrAdaptiveBin(img.data, img.w, img.h, { win: Math.max(15, Math.round(Math.max(img.w, img.h) / 60)) | 1, k: 20, polarity: pol }), img.w, img.h, 11);
        reads = reads.concat(parseContainerOcr(r.text)); anchors = containerAnchors(tag(r.words, pol));
        if (anchors.length) break;
      }
    }
    for (const an of anchors) {
      if (strong()) break;
      const hU = an.h, b = an.bbox, est = Math.abs(an.tilt || 0) >= 1 ? an.tilt : 0;
      const drift = Math.min(4, Math.tan(Math.max(Math.abs(est) * 2.5, 3) * Math.PI / 180) * 15) * hU;    // tilted text drifts up/down along the crop
      const X = an.kind === 'owner' ? [b.x0 - hU, b.x0 + 15 * hU] : [b.x0 - 8 * hU, b.x1 + 3 * hU];
      const rects = [
        { x0: X[0], x1: X[1], y0: b.y0 - 0.7 * hU - drift / 2, y1: b.y1 + 0.7 * hU + drift / 2 },                       // one text line
        { x0: X[0], x1: X[1], y0: b.y0 - (an.kind === 'owner' ? 0.7 : 2.6) * hU - drift / 2, y1: b.y1 + (an.kind === 'owner' ? 2.6 : 0.7) * hU + drift / 2 }   // owner / number on 2 lines
      ];
      const scale = Math.max(1, Math.min(4, 100 / hU)), T = hU * scale;
      // skew from the projection profile of the (tall) crop; fall back to the word baseline
      const probe = ocrCropRotScale(img.data, img.w, img.h, rects[1], 0, Math.min(scale, 2));
      const pb = ocrCleanBin(ocrAdaptiveBin(probe.data, probe.w, probe.h, { win: Math.round(hU * Math.min(scale, 2) * 0.3) | 1, k: 20, polarity: an.polarity || 'white' }), probe.w, probe.h, hU * Math.min(scale, 2));
      const sk = ocrEstimateSkew(pb, probe.w, probe.h, 14);
      if (env.debug) env.debug('skew ' + sk + ' (baseline tilt ' + (an.tilt || 0).toFixed(1) + ')');
      const angles = uniq([Math.abs(sk) >= 1 ? sk : 0, est ? -est * 2 : 0, 0, Math.abs(sk) >= 1 ? sk + (sk > 0 ? 2 : -2) : -4, est ? -est * 3 : 4].map(d => String(Math.round(d)))).map(Number);
      const pols = an.polarity ? [an.polarity] : ['white', 'dark'];
      outer:
      for (let ri = 0; ri < rects.length; ri++) {
        for (const deg of angles) {
          const c = ocrCropRotScale(img.data, img.w, img.h, rects[ri], deg, scale);
          for (const pol of pols) {
            let got = false;
            for (const [wf, mode] of [[0.3, 'clean'], [0.45, 'clean'], [0.3, 'open']]) {
              const raw = ocrAdaptiveBin(c.data, c.w, c.h, { win: Math.round(T * wf) | 1, k: 20, polarity: pol });
              const bin = mode === 'clean' ? ocrCleanBin(raw, c.w, c.h, T) : ocrOpenBin(ocrCleanBin(raw, c.w, c.h, T), c.w, c.h, Math.round(T * 0.07));
              if (env.debugBin) env.debugBin(bin, c.w, c.h, ri + '_' + deg + '_' + pol + '_' + wf + '_' + mode);
              for (const psm of ri === 0 ? [6] : [6, 11]) {
                if (--budget < 0) break outer;
                const rr = parseContainerOcr((await run(bin, c.w, c.h, psm)).text);
                if (env.debug) env.debug('rect' + ri + ' ' + deg + '° ' + pol + ' ' + wf + ' ' + mode + ' psm' + psm + ': ' + rr.map(x => x.raw + (x.valid ? '✔' : '')).join(','));
                if (rr.length) { got = true; an.polarity = pol; }
                reads = reads.concat(rr);
                if (strong()) break outer;
              }
            }
            if (got) break;
          }
          if (okReads().length) break;                                                      // this angle gives a valid code -> no other angle
        }
        if (okReads().length) break;                                                        // one-line crop worked -> skip the 2-line crop
      }
    }
    return consensusFilter(mergeContainerReads(reads));
  }
  // reads (all photos of one container) + known containers from the declaration -> decision
  // -> { value, confirmed, source, note, raw }
  function resolveContainerOcr(reads, known) {
    const K = uniq((known || []).map(cleanCode).filter(c => /^[A-Z]{4}\d{7}$/.test(c)));
    const raw = reads.map(r => r.raw).join(' / ');
    const valid = reads.filter(r => r.valid);
    if (valid.length) {
      // reads are merged per photo (votes = passes that read the same number) -> per code: photos + votes; a clearly dominant code wins
      const agg = {}; valid.forEach(r => { const a = agg[r.code] || (agg[r.code] = { code: r.code, photos: 0, votes: 0 }); a.photos++; a.votes += r.votes || 1; });
      const ranked = Object.values(agg).sort((a, b) => (b.photos - a.photos) || (b.votes - a.votes));
      const dominant = ranked.length > 1 && ranked[0].photos >= ranked[1].photos && ranked[0].votes >= 2 * ranked[1].votes && !K.includes(ranked[1].code);
      let codes = dominant ? [ranked[0].code] : ranked.map(a => a.code);
      const inK = codes.filter(c => K.includes(c));
      const seenTwice = codes.length === 1 && agg[codes[0]].photos >= 2;     // same valid number read in >= 2 photos
      if (codes.length === 1 && (inK.length || (!K.length && seenTwice)))
        return { value: codes[0], confirmed: true, source: 'OCR', note: 'อ่านจากรูป (check digit ถูกต้อง)' + (inK.length ? ' · ตรงกับใบขน' : ' · ตรงกัน ' + agg[codes[0]].photos + ' รูป'), raw };
      if (inK.length === 1) return { value: inK[0], confirmed: false, source: 'OCR', note: 'อ่านได้หลายเลข (' + codes.join(', ') + ') — กรุณายืนยัน', raw };
      if (!inK.length && K.length) {
        // valid-looking read that is NOT in the declaration: check whether it is 1 character away from a declaration container
        const near = K.filter(k => codes.some(c => hamming(k, c) <= 2));
        return { value: near.length === 1 ? near[0] : codes[0], confirmed: false, source: 'OCR', note: 'เลขตู้จากรูป (' + codes.join(', ') + ') ไม่ตรงกับใบขน' + (near.length === 1 ? ' ใกล้เคียง ' + near[0] : '') + ' — กรุณายืนยัน', raw };
      }
      return { value: codes.length === 1 ? codes[0] : '', confirmed: false, source: 'OCR', note: codes.length > 1 ? 'อ่านได้หลายเลข (' + codes.join(', ') + ') — กรุณากรอก/ยืนยัน' : 'อ่านจากรูป 1 รูป — กรุณายืนยัน', raw };
    }
    // fuzzy match against the declaration: same owner, serial differs by <= 1, check digit equal (when read)
    const fuzzy = [];
    for (const r of reads) for (const k of K) {
      if (k.slice(0, 4) !== r.owner) continue;
      if (hamming(k.slice(4, 10), r.serial) <= 1 && (r.check == null || +k[10] === r.check)) fuzzy.push(k);
    }
    const fz = uniq(fuzzy);
    if (fz.length === 1) return { value: fz[0], confirmed: false, source: 'OCR+DECL', note: 'อ่านได้ไม่ชัด (' + raw + ') ตรงกับเลขตู้ในใบขน — กรุณายืนยัน', raw };
    const fixes = uniq([].concat(...reads.map(containerFixCandidates)));
    if (fixes.length === 1) return { value: fixes[0], confirmed: false, source: 'OCR-FIX', note: 'อ่านได้ไม่ชัด (' + raw + ') — กรุณายืนยัน', raw };
    if (reads.length) return { value: '', confirmed: false, source: 'NONE', note: CONTAINER_UNREAD + ' (อ่านได้ไม่ชัด: ' + raw + ')', raw };
    return { value: '', confirmed: false, source: 'NONE', note: CONTAINER_UNREAD, raw: '' };
  }
  // OCR text of the seal passes -> digit strings 6..10 long
  function parseSealOcr(texts) {
    const out = [];
    for (const t of texts || []) {
      const toks = String(t || '').toUpperCase().replace(/[^0-9A-Z]+/g, ' ').split(' ');
      for (const tok of toks) { const d = tok.replace(/[^0-9]/g, ''); if (/^[A-Z]{0,4}\d{6,10}$/.test(tok) && d.length >= 6 && d.length <= 10) out.push(tok); }
    }
    return out;
  }
  // seal reads + container + declaration pairs -> decision
  function resolveSealOcr(reads, container, pairs) {
    const counts = {}; (reads || []).forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    const list = Object.keys(counts);
    const P = (pairs || []).filter(p => p && p.seal);
    const forC = P.filter(p => container && cleanCode(p.container) === cleanCode(container)).map(p => cleanCode(p.seal));
    const anyDecl = uniq(P.map(p => cleanCode(p.seal)));
    const hit = (s) => list.some(r => r === s || (r.length > s.length && r.includes(s)));
    for (const s of forC) if (hit(s)) return { value: s, confirmed: true, source: 'OCR+DECL', note: 'อ่านจากรูป ตรงกับซีลในใบขน' };
    for (const s of anyDecl) if (hit(s)) return { value: s, confirmed: !container, source: 'OCR+DECL', note: container ? 'ซีลตรงกับใบขนแต่เป็นของตู้อื่น — กรุณายืนยัน' : 'อ่านจากรูป ตรงกับซีลในใบขน' };
    if (!list.length) return { value: '', confirmed: false, source: 'NONE', note: 'อ่านเลขซีลไม่ได้ — กรุณากรอกเอง' };
    list.sort((a, b) => (counts[b] - counts[a]) || (Math.abs(a.length - 8) - Math.abs(b.length - 8)));
    return { value: list[0], confirmed: false, source: 'OCR', note: 'อ่านจากรูป — กรุณายืนยัน' + (list.length > 1 ? ' (พบ: ' + list.slice(0, 3).join(', ') + ')' : '') };
  }

  // Orchestration (same in browser and node). env = { getRGBA(rotDeg, maxEdge) -> {data,w,h}, recognize(data,w,h,{psm,whitelist}) -> {text} }
  // PSM: 7 single line, 11 sparse text
  async function ocrAnalyzePhoto(env, opts) {
    const res = { containerReads: [], sealReads: [], tagRatio: 0 };
    if (opts.container) res.containerReads = await ocrContainerPhoto(env);          // local110
    if (opts.seal) {
      for (const rot of [90, 270, 0, 180]) {
        const img = await env.getRGBA(rot, 1600);
        const sb = ocrSealBands(img.data, img.w, img.h);
        res.tagRatio = Math.max(res.tagRatio, sb.tagRatio);
        if (!sb.bands.length) { if (sb.tagRatio < 0.002) break; continue; }
        const texts = [];
        for (const b of sb.bands) {
          texts.push((await env.recognize(b.data, b.w, b.h, { psm: 11, whitelist: '0123456789' })).text);
          texts.push((await env.recognize(b.data, b.w, b.h, { psm: 7, whitelist: '0123456789' })).text);
        }
        res.sealReads = res.sealReads.concat(parseSealOcr(texts));
      }
    }
    return res;
  }

  /* ======================================================= container rows (local102) */
  const STANDARD_TYPES = PHOTO_TYPES;   // SEAL, CLOSED, OPEN2, OPEN1
  const ROW_STATUS_LABEL = { WAITING: 'รอรูป', INCOMPLETE: 'รูปไม่ครบ', READY: 'พร้อม EXPORT', EXPORTED: 'EXPORT แล้ว' };
  // row: {container_no, seal_no, container_confirmed, seal_confirmed, export_path, export_stale}; photos: [{type}]
  function containerRowStatus(row, photos) {
    photos = photos || [];
    const types = new Set(photos.map(p => p.type));
    const missingTypes = photos.length ? STANDARD_TYPES.filter(t => !types.has(t)) : STANDARD_TYPES.slice();
    const missingData = [];
    if (!cleanCode(row.container_no)) missingData.push('Container No.');
    else if (!row.container_confirmed) missingData.push('ยืนยัน Container No.');
    if (!cleanCode(row.seal_no)) missingData.push('Seal No.');
    else if (!row.seal_confirmed) missingData.push('ยืนยัน Seal No.');
    const exportedValid = !!row.export_path && !row.export_stale;
    let status;
    if (exportedValid) status = 'EXPORTED';
    else if (!photos.length) status = 'WAITING';
    else if (missingTypes.length || missingData.length) status = 'INCOMPLETE';
    else status = 'READY';
    const canExport = photos.length > 0 && missingData.length === 0;
    let label = ROW_STATUS_LABEL[status];
    if (status === 'INCOMPLETE' && !missingTypes.length && missingData.length) label = 'รอยืนยันข้อมูล';
    return { status, label, missingTypes, missingData, canExport, exportedValid, stale: !!row.export_path && !!row.export_stale };
  }
  // JOB status for the report
  function jobStatus(j) {
    const total = +j.rows_count || +j.container_count || 0, done = +j.exported_count || 0;
    if (!(+j.decl_files)) return { code: 'SAVED', label: 'บันทึกแล้ว' };
    if (total > 0 && done >= total) return { code: 'DONE', label: 'EXPORT ครบ' };
    if (done > 0) return { code: 'PARTIAL', label: 'ดำเนินการบางส่วน' };
    return { code: 'WAITING', label: 'รอรูป' };
  }
  // "12 OCT 2026-A0050691019519_ONEYRICGU0155500_ONEU7578511.pdf"
  function exportPdfName(job, containerNo) {
    return sanitizeFileName(buildBaseName(job).base + '_' + (cleanCode(containerNo) || 'NO-CONTAINER')) + '.pdf';
  }
  // job.pdf_layout -> buildMergedPdf options
  function layoutOptions(pdfLayout) {
    // local114: both layouts -> photos only as ONE A4 2×2 page (no single-photo pages); document page order unchanged
    return pdfLayout === 'REFERENCE'
      ? { photoLayout: 'full', memoAfterFirstPage: true, collage: true, singlePhotos: false, collageA4: true }
      : { photoLayout: 'a4header', memoAfterFirstPage: false, collage: true, singlePhotos: false, collageA4: true };
  }

  return {
    MONTHS, PHOTO_TYPES, PHOTO_TYPE_LABEL,
    formatDateDDMMMYYYY, parseDateInput, parseISODate, toISODate,
    sanitizeFileName, cleanCode, buildBaseName,
    extractFieldsFromText, classifyPdfCategory, isoContainerValid,
    readJpegOrientation, exifToRotation,
    analyzeImageFeatures, scorePhotoTypes, autoOrderPhotos,
    photoHeader, splitList, buildMergedPdf, collageLayout, drawCollage, A4_SLOTS, collageSlotsA4, drawCollageA4,
    ocrBinaryWhiteText, ocrBinaryDarkText, ocrSealBands, isoCheckDigit, parseContainerOcr, containerFixCandidates,
    resolveContainerOcr, parseSealOcr, resolveSealOcr, ocrAnalyzePhoto,
    consensusFilter, ocrCropRotScale, ocrAdaptiveBin, ocrOpenBin, ocrCleanBin, ocrEstimateSkew, containerAnchors, mergeContainerReads, ocrContainerPhoto, CONTAINER_UNREAD,
    pdfItemsToLines, extractPackingList,
    accountObjectName, accountFileName, mergePdfsInOrder,
    STANDARD_TYPES, ROW_STATUS_LABEL, containerRowStatus, jobStatus, exportPdfName, layoutOptions
  };
}));
