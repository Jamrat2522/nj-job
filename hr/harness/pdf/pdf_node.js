var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pdf_src_exports = {};
__export(pdf_src_exports, {
  buildFinalPdf: () => buildFinalPdf
});
module.exports = __toCommonJS(pdf_src_exports);
var import_pdf_lib = require("pdf-lib");
var import_fontkit = __toESM(require("@pdf-lib/fontkit"));
const A4_W = 595.28;
const A4_H = 841.89;
const M_L = 56;
const M_R = 56;
const M_T = 56;
const M_B = 64;
const CONTENT_W = A4_W - M_L - M_R;
const C_TEXT = (0, import_pdf_lib.rgb)(0.07, 0.09, 0.15);
const C_MUTE = (0, import_pdf_lib.rgb)(0.42, 0.46, 0.54);
const C_LINE = (0, import_pdf_lib.rgb)(0.85, 0.87, 0.9);
const C_BRAND = (0, import_pdf_lib.rgb)(0.65, 0.12, 0.13);
function isCombining(ch) {
  const c = ch.codePointAt(0);
  return c === 3633 || c >= 3635 && c <= 3642 || c >= 3655 && c <= 3662;
}
function wrap(text, font, size, maxW) {
  const out = [];
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    if (raw.trim() === "") {
      out.push("");
      continue;
    }
    let line2 = "";
    for (const ch of raw) {
      const next = line2 + ch;
      if (font.widthOfTextAtSize(next, size) <= maxW || line2 === "") {
        line2 = next;
        continue;
      }
      let cut = line2.length;
      while (cut > 1 && isCombining(line2[cut - 1])) cut--;
      const sp = line2.lastIndexOf(" ", cut - 1);
      if (sp > cut - 18 && sp > 0) cut = sp;
      out.push(line2.slice(0, cut).replace(/\s+$/, ""));
      line2 = line2.slice(cut).replace(/^\s+/, "") + ch;
    }
    out.push(line2);
  }
  return out;
}
function newPage(ctx) {
  ctx.page = ctx.doc.addPage([A4_W, A4_H]);
  ctx.pages.push(ctx.page);
  ctx.y = A4_H - M_T;
}
function need(ctx, h) {
  if (ctx.y - h < M_B) newPage(ctx);
}
function line(ctx, text, size, bold = false, color = C_TEXT, gap = 4) {
  const font = bold ? ctx.bold : ctx.reg;
  for (const l of wrap(text, font, size, CONTENT_W)) {
    need(ctx, size + gap);
    if (l !== "") ctx.page.drawText(l, { x: M_L, y: ctx.y - size, size, font, color });
    ctx.y -= size + gap;
  }
}
function hr(ctx, pad = 8) {
  need(ctx, pad * 2);
  ctx.y -= pad;
  ctx.page.drawLine({
    start: { x: M_L, y: ctx.y },
    end: { x: A4_W - M_R, y: ctx.y },
    thickness: 0.7,
    color: C_LINE
  });
  ctx.y -= pad;
}
function kv(ctx, label, value, size = 10) {
  const labelW = 132;
  const valW = CONTENT_W - labelW;
  const lines = wrap(value || "\u2014", ctx.reg, size, valW);
  need(ctx, lines.length * (size + 3) + 2);
  ctx.page.drawText(label, { x: M_L, y: ctx.y - size, size, font: ctx.bold, color: C_MUTE });
  lines.forEach((l, i) => {
    ctx.page.drawText(l, { x: M_L + labelW, y: ctx.y - size - i * (size + 3), size, font: ctx.reg, color: C_TEXT });
  });
  ctx.y -= lines.length * (size + 3) + 2;
}
const DOC_TYPE_TH = {
  CONTRACT: "\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E08\u0E49\u0E32\u0E07\u0E07\u0E32\u0E19",
  CONTRACT_PROBATION: "\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E08\u0E49\u0E32\u0E07\u0E17\u0E14\u0E25\u0E2D\u0E07\u0E07\u0E32\u0E19",
  WARNING: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
  SUSPENSION: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E1E\u0E31\u0E01\u0E07\u0E32\u0E19",
  PROBATION_RESULT: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E41\u0E08\u0E49\u0E07\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E17\u0E14\u0E25\u0E2D\u0E07\u0E07\u0E32\u0E19",
  COE: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19",
  SALARY_CERT: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19",
  SEPARATION: "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1E\u0E49\u0E19\u0E2A\u0E20\u0E32\u0E1E"
};
function beDate(iso) {
  const s = String(iso ?? "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) + 543}` : "\u2014";
}
async function buildFinalPdf(snap, fontRegular, fontBold) {
  const d = snap.doc ?? {};
  const a = snap.ack ?? {};
  const o = snap.org ?? {};
  const pdf = await import_pdf_lib.PDFDocument.create();
  pdf.registerFontkit(import_fontkit.default);
  const reg = await pdf.embedFont(fontRegular, { subset: false });
  const bold = await pdf.embedFont(fontBold, { subset: false });
  pdf.setTitle(`${d.doc_no ?? ""} v${d.version ?? 1}`);
  pdf.setSubject(DOC_TYPE_TH[d.doc_type] ?? String(d.doc_type ?? ""));
  pdf.setProducer("NJ LOGISTIC HR SYSTEM");
  pdf.setCreator("NJ LOGISTIC HR SYSTEM");
  pdf.setCreationDate(/* @__PURE__ */ new Date(0));
  pdf.setModificationDate(/* @__PURE__ */ new Date(0));
  const ctx = { doc: pdf, page: null, y: 0, reg, bold, pages: [] };
  newPage(ctx);
  const company = String(o.company_name ?? "N.J. LOGISTICS & FRUITS CO., LTD.");
  ctx.page.drawText(company, {
    x: M_L,
    y: ctx.y - 15,
    size: 15,
    font: bold,
    color: C_BRAND
  });
  ctx.y -= 15 + 5;
  if (o.address) line(ctx, String(o.address), 9, false, C_MUTE, 3);
  hr(ctx, 7);
  line(ctx, DOC_TYPE_TH[d.doc_type] ?? String(d.doc_type ?? ""), 13, true, C_TEXT, 5);
  line(ctx, String(d.title ?? ""), 12, true, C_TEXT, 8);
  kv(ctx, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", `${d.doc_no ?? "\u2014"}  \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 ${d.version ?? 1}`);
  kv(ctx, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", beDate(d.issued_at));
  if (d.effective_date) kv(ctx, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E1C\u0E25", beDate(d.effective_date));
  hr(ctx, 7);
  line(ctx, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19", 11, true, C_TEXT, 6);
  kv(ctx, "\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19", String(d.emp_code_snap ?? "\u2014"));
  kv(ctx, "\u0E0A\u0E37\u0E48\u0E2D \u2013 \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25", String(d.emp_name_snap ?? "\u2014"));
  kv(ctx, "\u0E41\u0E1C\u0E19\u0E01", String(d.dept_snap ?? "\u2014"));
  kv(ctx, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07", String(d.position_snap ?? "\u2014"));
  hr(ctx, 7);
  line(ctx, "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", 11, true, C_TEXT, 6);
  line(ctx, String(d.body ?? ""), 10.5, false, C_TEXT, 5);
  hr(ctx, 7);
  const signed = a.action === "SIGN";
  line(ctx, signed ? "\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19\u0E01\u0E32\u0E23\u0E25\u0E07\u0E19\u0E32\u0E21\u0E2D\u0E34\u0E40\u0E25\u0E47\u0E01\u0E17\u0E23\u0E2D\u0E19\u0E34\u0E01\u0E2A\u0E4C" : "\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A", 11, true, C_TEXT, 6);
  if (a.confirmation_text) {
    line(ctx, String(a.confirmation_text), 9.5, false, C_MUTE, 4);
    ctx.y -= 4;
  }
  kv(ctx, "\u0E1C\u0E39\u0E49\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23", `${a.emp_code ?? ""} ${a.emp_name ?? ""}`.trim() || "\u2014");
  kv(ctx, "\u0E41\u0E1C\u0E19\u0E01", String(a.department ?? "\u2014"));
  kv(ctx, "\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23", signed ? "\u0E25\u0E07\u0E19\u0E32\u0E21\u0E2D\u0E34\u0E40\u0E25\u0E47\u0E01\u0E17\u0E23\u0E2D\u0E19\u0E34\u0E01\u0E2A\u0E4C" : "\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23");
  kv(ctx, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32", `${a.acked_at_th ?? "\u2014"} \u0E19. (\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28\u0E44\u0E17\u0E22)`);
  kv(ctx, "\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E25\u0E07\u0E19\u0E32\u0E21", `\u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 ${a.doc_version ?? d.version ?? 1}`);
  if (a.channel) kv(ctx, "\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07", String(a.channel));
  hr(ctx, 7);
  line(ctx, "\u0E25\u0E32\u0E22\u0E19\u0E34\u0E49\u0E27\u0E21\u0E37\u0E2D\u0E14\u0E34\u0E08\u0E34\u0E17\u0E31\u0E25\u0E02\u0E2D\u0E07\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 (Document Hash)", 10, true, C_TEXT, 5);
  line(
    ctx,
    "\u0E04\u0E48\u0E32\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \u0E13 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E16\u0E36\u0E07\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 \u0E41\u0E25\u0E30\u0E16\u0E39\u0E01\u0E15\u0E23\u0E36\u0E07\u0E44\u0E27\u0E49\u0E16\u0E32\u0E27\u0E23 \u0E43\u0E0A\u0E49\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E25\u0E07\u0E19\u0E32\u0E21\u0E04\u0E37\u0E2D\u0E09\u0E1A\u0E31\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A",
    8.5,
    false,
    C_MUTE,
    4
  );
  ctx.y -= 2;
  kv(ctx, "SHA-256", String(d.content_hash ?? "\u2014"), 8.5);
  if (!snap.hash_match) {
    line(
      ctx,
      "\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19: \u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E43\u0E19\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E08\u0E49\u0E07\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
      9,
      true,
      C_BRAND,
      4
    );
  }
  const total = ctx.pages.length;
  ctx.pages.forEach((p, i) => {
    const foot = `${d.doc_no ?? ""} \xB7 \u0E09\u0E1A\u0E31\u0E1A\u0E17\u0E35\u0E48 ${d.version ?? 1} \xB7 \u0E2B\u0E19\u0E49\u0E32 ${i + 1} / ${total}`;
    p.drawLine({
      start: { x: M_L, y: M_B - 16 },
      end: { x: A4_W - M_R, y: M_B - 16 },
      thickness: 0.5,
      color: C_LINE
    });
    p.drawText(foot, { x: M_L, y: M_B - 30, size: 8, font: reg, color: C_MUTE });
    const note = "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34";
    p.drawText(note, {
      x: A4_W - M_R - reg.widthOfTextAtSize(note, 8),
      y: M_B - 30,
      size: 8,
      font: reg,
      color: C_MUTE
    });
  });
  return await pdf.save({ useObjectStreams: false });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildFinalPdf
});
