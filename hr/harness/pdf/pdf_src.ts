// ============================================================
//  pdf.ts — ตัวสร้าง Final PDF จาก Snapshot ที่ DB คืนมา
//
//  หลักการที่ยึดตลอดไฟล์นี้:
//    · ใช้เฉพาะข้อมูลใน Snapshot ที่ njhr_doc_pdf_claim คืนมา
//      ห้ามดึงข้อมูลพนักงานปัจจุบันมาแทน (เอกสารย้อนหลังต้องไม่เปลี่ยนตามข้อมูลวันนี้)
//    · เวลาทั้งหมดมาจากเซิร์ฟเวอร์ (acked_at_th ที่ DB แปลงเป็นเวลาไทยมาแล้ว)
//      ห้ามใช้ new Date() ของเครื่องที่รัน
//    · ห้ามพิมพ์ password / token / session / ip / user_agent ลงใน PDF
//    · ฟอนต์ต้อง embed ลงในไฟล์เสมอ ไม่พึ่งฟอนต์ของเครื่องที่เปิด
//
//  ข้อจำกัดที่ต้องรู้ (รายงานตรง ๆ ไม่กลบ):
//    pdf-lib ไม่มีตัวตัดคำภาษาไทย (Thai word breaking ต้องใช้พจนานุกรม)
//    ไฟล์นี้จึงตัดบรรทัดด้วยความกว้างจริงของข้อความ และกันไม่ให้ตัดแยก
//    สระ/วรรณยุกต์ออกจากพยัญชนะ — อ่านออกถูกต้อง แต่จุดตัดอาจไม่ตรงหลักภาษา
// ============================================================

import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/* ---------- ขนาดกระดาษ A4 (จุด) และระยะขอบ ---------- */
const A4_W = 595.28;
const A4_H = 841.89;
const M_L = 56;          // ซ้าย
const M_R = 56;          // ขวา
const M_T = 56;          // บน
const M_B = 64;          // ล่าง (เผื่อเลขหน้า)
const CONTENT_W = A4_W - M_L - M_R;

const C_TEXT = rgb(0.07, 0.09, 0.15);
const C_MUTE = rgb(0.42, 0.46, 0.54);
const C_LINE = rgb(0.85, 0.87, 0.90);
const C_BRAND = rgb(0.65, 0.12, 0.13);

/* ---------- อักขระไทยที่ห้ามขึ้นต้นบรรทัด ----------
   สระบน/ล่าง วรรณยุกต์ และเครื่องหมายที่ต้องเกาะพยัญชนะตัวหน้า
   ถ้าตัดบรรทัดตรงนี้ ตัวอักษรจะลอยและอ่านผิด */
function isCombining(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (c === 0x0e31) || (c >= 0x0e33 && c <= 0x0e3a) || (c >= 0x0e47 && c <= 0x0e4e);
}

/* ---------- ตัดบรรทัดตามความกว้างจริง ---------- */
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    if (raw.trim() === "") { out.push(""); continue; }
    let line = "";
    for (const ch of raw) {
      const next = line + ch;
      if (font.widthOfTextAtSize(next, size) <= maxW || line === "") {
        line = next;
        continue;
      }
      // ย้อนกลับไม่ให้ตัดแยกสระ/วรรณยุกต์ออกจากพยัญชนะ
      let cut = line.length;
      while (cut > 1 && isCombining(line[cut - 1])) cut--;
      // ถ้ามีช่องว่างใกล้ ๆ ให้ตัดที่ช่องว่างแทน (ภาษาอังกฤษอ่านสวยกว่า)
      const sp = line.lastIndexOf(" ", cut - 1);
      if (sp > cut - 18 && sp > 0) cut = sp;
      out.push(line.slice(0, cut).replace(/\s+$/, ""));
      line = line.slice(cut).replace(/^\s+/, "") + ch;
    }
    out.push(line);
  }
  return out;
}

/* ---------- ตัวช่วยวาด ---------- */
interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  reg: PDFFont;
  bold: PDFFont;
  pages: PDFPage[];
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([A4_W, A4_H]);
  ctx.pages.push(ctx.page);
  ctx.y = A4_H - M_T;
}

/** ขอพื้นที่สูง h — ไม่พอก็ขึ้นหน้าใหม่ (กันข้อความถูกตัดครึ่ง) */
function need(ctx: Ctx, h: number) {
  if (ctx.y - h < M_B) newPage(ctx);
}

function line(ctx: Ctx, text: string, size: number, bold = false, color = C_TEXT, gap = 4) {
  const font = bold ? ctx.bold : ctx.reg;
  for (const l of wrap(text, font, size, CONTENT_W)) {
    need(ctx, size + gap);
    if (l !== "") ctx.page.drawText(l, { x: M_L, y: ctx.y - size, size, font, color });
    ctx.y -= size + gap;
  }
}

function hr(ctx: Ctx, pad = 8) {
  need(ctx, pad * 2);
  ctx.y -= pad;
  ctx.page.drawLine({
    start: { x: M_L, y: ctx.y }, end: { x: A4_W - M_R, y: ctx.y },
    thickness: 0.7, color: C_LINE,
  });
  ctx.y -= pad;
}

/** แถวข้อมูล ป้ายซ้าย–ค่าขวา ที่ห่อบรรทัดได้ */
function kv(ctx: Ctx, label: string, value: string, size = 10) {
  const labelW = 132;
  const valW = CONTENT_W - labelW;
  const lines = wrap(value || "—", ctx.reg, size, valW);
  need(ctx, lines.length * (size + 3) + 2);
  ctx.page.drawText(label, { x: M_L, y: ctx.y - size, size, font: ctx.bold, color: C_MUTE });
  lines.forEach((l, i) => {
    ctx.page.drawText(l, { x: M_L + labelW, y: ctx.y - size - i * (size + 3), size, font: ctx.reg, color: C_TEXT });
  });
  ctx.y -= lines.length * (size + 3) + 2;
}

/* ---------- ตัวสร้างหลัก ---------- */
export interface Snapshot {
  doc: Record<string, any>;
  ack: Record<string, any>;
  org: Record<string, any>;
  hash_match: boolean;
  storage_path: string;
}

const DOC_TYPE_TH: Record<string, string> = {
  CONTRACT: "สัญญาจ้างงาน",
  CONTRACT_PROBATION: "สัญญาจ้างทดลองงาน",
  WARNING: "หนังสือเตือนพนักงาน",
  SUSPENSION: "หนังสือพักงาน",
  PROBATION_RESULT: "หนังสือแจ้งผลการทดลองงาน",
  COE: "หนังสือรับรองการทำงาน",
  SALARY_CERT: "หนังสือรับรองเงินเดือน",
  SEPARATION: "หนังสือรับรองการทำงานพ้นสภาพ",
};

/** วันที่ ค.ศ. → พ.ศ. แบบ DD/MM/YYYY (ใช้กับ date ล้วนที่ DB ส่งมาเป็น YYYY-MM-DD) */
function beDate(iso: unknown): string {
  const s = String(iso ?? "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) + 543}` : "—";
}

export async function buildFinalPdf(
  snap: Snapshot,
  fontRegular: Uint8Array,
  fontBold: Uint8Array,
): Promise<Uint8Array> {
  const d = snap.doc ?? {};
  const a = snap.ack ?? {};
  const o = snap.org ?? {};

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const reg = await pdf.embedFont(fontRegular, { subset: true });
  const bold = await pdf.embedFont(fontBold, { subset: true });

  // Metadata — ไม่มีข้อมูลลับ · เวลาตรึงไว้เพื่อให้ผลลัพธ์ deterministic
  pdf.setTitle(`${d.doc_no ?? ""} v${d.version ?? 1}`);
  pdf.setSubject(DOC_TYPE_TH[d.doc_type] ?? String(d.doc_type ?? ""));
  pdf.setProducer("NJ LOGISTIC HR SYSTEM");
  pdf.setCreator("NJ LOGISTIC HR SYSTEM");
  pdf.setCreationDate(new Date(0));
  pdf.setModificationDate(new Date(0));

  const ctx: Ctx = { doc: pdf, page: null as unknown as PDFPage, y: 0, reg, bold, pages: [] };
  newPage(ctx);

  /* ---------- หัวเอกสาร ---------- */
  const company = String(o.company_name ?? "N.J. LOGISTICS & FRUITS CO., LTD.");
  ctx.page.drawText(company, {
    x: M_L, y: ctx.y - 15, size: 15, font: bold, color: C_BRAND,
  });
  ctx.y -= 15 + 5;
  if (o.address) line(ctx, String(o.address), 9, false, C_MUTE, 3);
  hr(ctx, 7);

  /* ---------- ชื่อเรื่อง ---------- */
  line(ctx, DOC_TYPE_TH[d.doc_type] ?? String(d.doc_type ?? ""), 13, true, C_TEXT, 5);
  line(ctx, String(d.title ?? ""), 12, true, C_TEXT, 8);

  kv(ctx, "เลขที่เอกสาร", `${d.doc_no ?? "—"}  ฉบับที่ ${d.version ?? 1}`);
  kv(ctx, "วันที่ออกเอกสาร", beDate(d.issued_at));
  if (d.effective_date) kv(ctx, "วันที่มีผล", beDate(d.effective_date));
  hr(ctx, 7);

  /* ---------- ข้อมูลพนักงาน (Snapshot ณ วันออกเอกสาร) ---------- */
  line(ctx, "ข้อมูลพนักงาน", 11, true, C_TEXT, 6);
  kv(ctx, "รหัสพนักงาน", String(d.emp_code_snap ?? "—"));
  kv(ctx, "ชื่อ – นามสกุล", String(d.emp_name_snap ?? "—"));
  kv(ctx, "แผนก", String(d.dept_snap ?? "—"));
  kv(ctx, "ตำแหน่ง", String(d.position_snap ?? "—"));
  hr(ctx, 7);

  /* ---------- เนื้อหาเอกสาร ---------- */
  line(ctx, "เนื้อหาเอกสาร", 11, true, C_TEXT, 6);
  line(ctx, String(d.body ?? ""), 10.5, false, C_TEXT, 5);
  hr(ctx, 7);

  /* ---------- หลักฐานการรับทราบ / ลงนาม ---------- */
  const signed = a.action === "SIGN";
  line(ctx, signed ? "หลักฐานการลงนามอิเล็กทรอนิกส์" : "หลักฐานการรับทราบ", 11, true, C_TEXT, 6);

  // ข้อความยืนยันที่ผู้ใช้เห็นและกดยืนยันจริง — มาจาก DB ไม่ใช่จาก client
  if (a.confirmation_text) {
    line(ctx, String(a.confirmation_text), 9.5, false, C_MUTE, 4);
    ctx.y -= 4;
  }
  kv(ctx, "ผู้ดำเนินการ", `${a.emp_code ?? ""} ${a.emp_name ?? ""}`.trim() || "—");
  kv(ctx, "แผนก", String(a.department ?? "—"));
  kv(ctx, "การดำเนินการ", signed ? "ลงนามอิเล็กทรอนิกส์" : "รับทราบเอกสาร");
  kv(ctx, "วันที่และเวลา", `${a.acked_at_th ?? "—"} น. (เวลาประเทศไทย)`);
  kv(ctx, "ฉบับที่ลงนาม", `ฉบับที่ ${a.doc_version ?? d.version ?? 1}`);
  if (a.channel) kv(ctx, "ช่องทาง", String(a.channel));

  hr(ctx, 7);

  /* ---------- ลายนิ้วมือดิจิทัลของเอกสาร ---------- */
  line(ctx, "ลายนิ้วมือดิจิทัลของเอกสาร (Document Hash)", 10, true, C_TEXT, 5);
  line(ctx,
    "ค่าด้านล่างคำนวณจากเนื้อหาเอกสาร ณ วินาทีที่ส่งถึงพนักงาน และถูกตรึงไว้ถาวร " +
    "ใช้ตรวจสอบว่าเอกสารที่ลงนามคือฉบับเดียวกับที่เก็บไว้ในระบบ",
    8.5, false, C_MUTE, 4);
  ctx.y -= 2;
  kv(ctx, "SHA-256", String(d.content_hash ?? "—"), 8.5);
  if (!snap.hash_match) {
    line(ctx,
      "คำเตือน: ค่าที่บันทึกไว้ในหลักฐานการรับทราบไม่ตรงกับค่าปัจจุบันของเอกสาร " +
      "กรุณาแจ้งผู้ดูแลระบบเพื่อตรวจสอบ",
      9, true, C_BRAND, 4);
  }

  /* ---------- ท้ายทุกหน้า: เลขหน้า + เลขที่เอกสาร ---------- */
  const total = ctx.pages.length;
  ctx.pages.forEach((p, i) => {
    const foot = `${d.doc_no ?? ""} · ฉบับที่ ${d.version ?? 1} · หน้า ${i + 1} / ${total}`;
    p.drawLine({
      start: { x: M_L, y: M_B - 16 }, end: { x: A4_W - M_R, y: M_B - 16 },
      thickness: 0.5, color: C_LINE,
    });
    p.drawText(foot, { x: M_L, y: M_B - 30, size: 8, font: reg, color: C_MUTE });
    const note = "เอกสารฉบับนี้ออกโดยระบบอัตโนมัติ";
    p.drawText(note, {
      x: A4_W - M_R - reg.widthOfTextAtSize(note, 8), y: M_B - 30,
      size: 8, font: reg, color: C_MUTE,
    });
  });

  return await pdf.save({ useObjectStreams: false });
}
