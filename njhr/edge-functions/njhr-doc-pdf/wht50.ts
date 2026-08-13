// ============================================================
//  wht50.ts — Renderer เฉพาะ "หนังสือรับรองการหักภาษี ณ ที่จ่าย"
//             ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร
//
//  แหล่งอ้างอิงแบบฟอร์ม (ไม่ได้วาดจากความจำ)
//    คำแนะนำในการออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ
//    กรมสรรพากร — https://www.rd.go.th/fileadmin/images/image_law/images/guide100248.pdf
//    ประกาศอธิบดีกรมสรรพากรเกี่ยวกับภาษีเงินได้ (ฉบับที่ 131)
//
//  ถ้อยคำที่ยึดตามเอกสารทางการทุกตัวอักษร
//    · ฉบับที่ 1 "สำหรับผู้ถูกหักภาษี ณ ที่จ่ายใช้แนบพร้อมกับแบบแสดงรายการ"
//    · ฉบับที่ 2 "สำหรับผู้ถูกหักภาษี ณ ที่จ่ายเก็บไว้เป็นหลักฐาน"
//    · รายการประเภทเงินได้พึงประเมินที่จ่าย ข้อ 1–6
//    · ผู้จ่ายเงิน (1) หัก ณ ที่จ่าย (2) ออกให้ตลอดไป (3) ออกให้ครั้งเดียว (4) อื่น ๆ
//    · เงินที่จ่ายเข้ากองทุน: กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน ·
//      กองทุนประกันสังคม · กองทุนสำรองเลี้ยงชีพ
//
//  หลักการ
//    · ข้อมูลทั้งหมดมาจาก Snapshot ของ njhr_wht50 เท่านั้น
//      ห้ามใช้ njhr_emp_documents.body และห้ามดึงข้อมูลปัจจุบันมาแทน Snapshot
//    · buildWht50Model() เป็น Layout Definition กลาง
//      ใช้ทั้ง Admin Preview (ฝั่งเว็บ) และ Final PDF (ไฟล์นี้)
//      เพื่อไม่ให้สิ่งที่ผู้ดูแลตรวจต่างจากสิ่งที่พนักงานได้รับ
//    · ไม่มีการเดาค่าใด ๆ — ค่าที่ไม่มีใน Snapshot จะถูกทำเครื่องหมายว่าขาด
//      แล้วให้ชั้นบนตัดสินใจ (ดู validateWht50Model)
// ============================================================

import { PDFArray, PDFDocument, PDFFont, PDFName, PDFNumber, PDFPage, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

const A4_W = 595.28;
const A4_H = 841.89;
const M_L = 34;
const M_R = 34;
const M_T = 34;
const M_B = 34;
const CW = A4_W - M_L - M_R;

const C_TEXT = rgb(0.06, 0.08, 0.12);
const C_LINE = rgb(0.35, 0.38, 0.44);
const C_THIN = rgb(0.62, 0.65, 0.70);

/* ---------- ประเภทแบบยื่นรายการ (checkbox บนหัวเอกสาร) ----------
   ลำดับตามแบบทางการ */
/* ค่า enum จริงใน njhr_wht50.form_type (Production) → ข้อความบนแบบฟอร์ม
   ห้ามเทียบสตริงภาษาไทยกับค่า enum ตรง ๆ */
export const WHT50_FORM_TYPES: { code: string; label: string }[] = [
  { code: "PND1A", label: "ภ.ง.ด.1ก" },
  { code: "PND1A_SPECIAL", label: "ภ.ง.ด.1ก พิเศษ" },
  { code: "PND2", label: "ภ.ง.ด.2" },
  { code: "PND3", label: "ภ.ง.ด.3" },
  { code: "PND2A", label: "ภ.ง.ด.2ก" },
  { code: "PND3A", label: "ภ.ง.ด.3ก" },
  { code: "PND53", label: "ภ.ง.ด.53" },
];

/* ---------- รายการประเภทเงินได้พึงประเมินที่จ่าย ข้อ 1–6 ----------
   ถ้อยคำตามคำแนะนำของกรมสรรพากร ห้ามย่อหรือเปลี่ยนชื่อรายการ */
/* key = ค่าจริงที่ Production เก็บใน income_section เช่น "40(1)"
   aliases รองรับรูปแบบเขียนอื่นที่อาจพบ เพื่อไม่ให้ยอดตกหล่นเงียบ ๆ */
export const WHT50_INCOME_ROWS: {
  key: string; aliases: string[]; no: string; label: string;
}[] = [
  { key: "40(1)", aliases: ["40_1", "40.1", "1"], no: "1.",
    label: "เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)" },
  { key: "40(2)", aliases: ["40_2", "40.2", "2"], no: "2.",
    label: "ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)" },
  { key: "40(3)", aliases: ["40_3", "40.3", "3"], no: "3.",
    label: "ค่าแห่งลิขสิทธิ์ หรือสิทธิอย่างอื่น ฯลฯ ตามมาตรา 40 (3)" },
  { key: "40(4)", aliases: ["40_4", "40.4", "4"], no: "4.",
    label: "(ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)" },
  { key: "3TRES", aliases: ["3เตรส", "5"], no: "5.",
    label: "การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส" },
  { key: "OTHER", aliases: ["อื่น", "6"], no: "6.",
    label: "เงินได้นอกจาก 1. – 5." },
];

/** แปลงค่า income_section ที่พบ → key มาตรฐานของตาราง (คืน "" ถ้าไม่รู้จัก) */
export function normalizeSection(v: unknown): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "";
  const flat = raw.replace(/\s/g, "").toUpperCase();
  for (const r of WHT50_INCOME_ROWS) {
    if (flat === r.key.toUpperCase()) return r.key;
    for (const a of r.aliases) if (flat === a.toUpperCase()) return r.key;
  }
  return "";
}

/* ---------- ประเภทการออกภาษีของผู้จ่ายเงิน ---------- */
/* วิธีออกภาษี — ค่าที่เก็บใน njhr_wht50.tax_payment_mode
   (คอลัมน์นี้เพิ่มโดย 90_wht50_pdf.sql · ยังไม่ได้รันบน Production)
   ติ๊กเฉพาะตัวที่ตรงกับข้อมูลจริงเท่านั้น ห้ามติ๊กเองโดยไม่มีค่า */
export const WHT50_PAYMENT_MODES = [
  { code: "WITHHOLD", label: "หัก ณ ที่จ่าย" },
  { code: "PAID_CONTINUOUS", label: "ออกให้ตลอดไป" },
  { code: "PAID_ONCE", label: "ออกให้ครั้งเดียว" },
  { code: "OTHER", label: "อื่น ๆ" },
];

/* ============================================================
   Normalize Snapshot ให้ตรงกับ field จริงใน Production
   payer_snapshot : company_name · company_address · company_tax_id
   payee_snapshot : prefix · first_name · last_name · national_id · address
   ============================================================ */
export interface Wht50Party { name: string; address: string; taxid: string; }

export function normalizeWht50Snapshot(snap: Wht50Snapshot): {
  payer: Wht50Party; payee: Wht50Party;
} {
  const p = (snap.payer_snapshot ?? {}) as Record<string, any>;
  const e = (snap.payee_snapshot ?? {}) as Record<string, any>;

  /* ผู้มีหน้าที่หักภาษี — ใช้ชื่อ field จริงก่อนเสมอ */
  const payer: Wht50Party = {
    name: String(p.company_name ?? p.name ?? "").trim(),
    address: String(p.company_address ?? p.address ?? "").trim(),
    taxid: String(p.company_tax_id ?? p.tax_id ?? "").trim(),
  };

  /* ผู้ถูกหักภาษี — ประกอบชื่อจาก prefix + first_name + last_name
     ไม่คาดหวังว่าจะมี payee.name เสมอ */
  const built = [
    String(e.prefix ?? "").trim(),
    String(e.first_name ?? "").trim(),
    String(e.last_name ?? "").trim(),
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const payee: Wht50Party = {
    name: built || String(e.name ?? "").trim(),
    address: String(e.address ?? "").trim(),
    taxid: String(e.national_id ?? e.tax_id ?? "").trim(),
  };
  return { payer, payee };
}

export interface Wht50Snapshot {
  doc_no?: string;
  book_no?: string;
  tax_year?: number;
  issue_date?: string;
  form_type?: string;
  income_section?: string;
  seq_no?: string | number;
  payer_snapshot?: Record<string, any>;
  payee_snapshot?: Record<string, any>;
  income_final?: any;
  total_income?: number | string;
  total_tax?: number | string;
  total_sso?: number | string;
  total_pvd?: number | string;
  tax_payment_mode?: string;
  tax_payment_mode_other?: string;
  signer_name?: string;
  signer_position?: string;
  amend_seq?: number;
}

export interface Wht50Line {
  key: string;
  no: string;
  label: string;
  /** วัน เดือน หรือปีภาษีที่จ่าย */
  paid_on: string;
  amount: number | null;
  tax: number | null;
}

/* ============================================================
   CANONICAL WHT50 MODEL CONTRACT
   ------------------------------------------------------------
   นี่คือรูปข้อมูลชุดเดียวของทั้งระบบ
   ทั้ง Admin Preview (เบราว์เซอร์) และ Final PDF (Edge Function)
   ต้อง normalize ข้อมูลดิบจาก njhr_wht50 มาเป็นรูปนี้ให้ได้ค่าตรงกันทุกช่อง

   เบราว์เซอร์กับ Edge รันคนละ Runtime จึงแชร์ไฟล์เดียวกันไม่ได้
   แต่ชื่อช่องและวิธีคำนวณต้องเหมือนกันทุกตัว
   มี Fixture ชุดเดียวใน harness/wht50_test.js เทียบค่าทั้งสองฝั่ง
   ============================================================ */
export interface Wht50Model {
  taxYear: number | null;
  docNo: string;
  bookNo: string;
  seqNo: string;
  copyLabels: string[];
  title: string;
  subtitle: string;
  payer: { name: string; address: string; taxid: string };
  payee: { name: string; address: string; taxid: string };
  formType: { code: string; label: string; checked: boolean }[];
  incomeRows: Wht50Line[];
  totalIncome: number | null;
  totalTax: number | null;
  taxWords: string;
  totalGpf: number | null;
  totalSso: number | null;
  totalPvd: number | null;
  paymentMode: { code: string; label: string; checked: boolean }[];
  paymentModeOther: string;
  certifyText: string;
  signer: { name: string; position: string };
  issueDate: string;
  amendSeq: number;
  /** ช่องที่ไม่มีข้อมูลจริง — ชั้นบนใช้ตัดสินใจว่าจะออกเอกสารได้หรือไม่ */
  missing: string[];
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function money(v: number | null): string {
  if (v === null) return "";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function beDate(iso: unknown): string {
  const s = String(iso ?? "").slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? `${m[3]}/${m[2]}/${Number(m[1]) + 543}` : "";
}

/* ---------- จำนวนเงินเป็นตัวอักษรภาษาไทย ----------
   ใช้กับช่อง "รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)" ตามแบบ
   รองรับทศนิยม 2 ตำแหน่งเป็นสตางค์ */
const TH_NUM = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const TH_POS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function intToThai(n: number): string {
  if (n === 0) return TH_NUM[0];
  if (n >= 1000000) {
    const high = Math.floor(n / 1000000);
    const rest = n % 1000000;
    return intToThai(high) + "ล้าน" + (rest ? intToThai(rest) : "");
  }
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i]);
    const pos = s.length - i - 1;
    if (d === 0) continue;
    if (pos === 0 && d === 1 && s.length > 1) out += "เอ็ด";
    else if (pos === 1 && d === 1) out += "สิบ";
    else if (pos === 1 && d === 2) out += "ยี่สิบ";
    else out += TH_NUM[d] + TH_POS[pos];
    if (pos === 1 && d > 2) out += "";
  }
  return out;
}

export function bahtText(v: number | null): string {
  if (v === null) return "";
  const neg = v < 0;
  const abs = Math.abs(Math.round(v * 100) / 100);
  const baht = Math.floor(abs);
  const satang = Math.round((abs - baht) * 100);
  let s = "";
  if (baht === 0 && satang === 0) s = "ศูนย์บาทถ้วน";
  else {
    if (baht > 0) s += intToThai(baht) + "บาท";
    if (satang > 0) s += (baht === 0 ? "" : "") + intToThai(satang) + "สตางค์";
    else s += "ถ้วน";
  }
  return (neg ? "ลบ" : "") + s;
}

/* ============================================================
   Layout Definition กลาง — ใช้ทั้ง Preview และ Final PDF
   ============================================================ */
export function buildWht50Model(snap: Wht50Snapshot): Wht50Model {
  const missing: string[] = [];
  const { payer, payee } = normalizeWht50Snapshot(snap);

  const pName = payer.name, pAddr = payer.address, pTax = payer.taxid;
  if (!pName) missing.push("ชื่อผู้มีหน้าที่หักภาษี ณ ที่จ่าย (payer_snapshot.company_name)");
  if (!pTax) missing.push("เลขประจำตัวผู้เสียภาษีอากรของบริษัท (payer_snapshot.company_tax_id)");

  const eName = payee.name, eAddr = payee.address, eTax = payee.taxid;
  if (!eName) missing.push("ชื่อผู้ถูกหักภาษี ณ ที่จ่าย (payee_snapshot.prefix/first_name/last_name)");
  if (!eTax) missing.push("เลขประจำตัวประชาชนของผู้ถูกหักภาษี (payee_snapshot.national_id)");

  /* ---- ประเภทแบบยื่นรายการ: เทียบด้วยค่า enum จริง ไม่ใช่ข้อความไทย ---- */
  const ft = String(snap.form_type ?? "").trim().toUpperCase();
  if (!ft) missing.push("ประเภทแบบยื่นรายการ (form_type)");
  else if (!WHT50_FORM_TYPES.some((f) => f.code === ft)) {
    missing.push(`form_type ไม่รู้จัก: ${ft}`);
  }
  const formType = WHT50_FORM_TYPES.map((f) => ({
    code: f.code, label: f.label, checked: f.code === ft,
  }));

  /* ---- ตารางเงินได้: อ่านจาก income_final ก่อน ----
     income_final เป็นรายการที่ผู้ดูแลยืนยันแล้ว
     ถ้าไม่มี ใช้ income_section ระบุว่าเงินได้อยู่ข้อไหน แล้วลงยอดรวมในข้อนั้น
     ห้าม hardcode ทุกเอกสารเป็น 40(1) */
  const secRaw = normalizeSection(snap.income_section);
  const totalIncome = num(snap.total_income);
  const totalTax = num(snap.total_tax);

  const byKey: Record<string, { paid_on: string; amount: number | null; tax: number | null }> = {};
  const fin = snap.income_final;
  const finArr = Array.isArray(fin)
    ? fin
    : (fin && Array.isArray((fin as { items?: unknown[] }).items)
      ? (fin as { items: unknown[] }).items
      : null);
  if (finArr && finArr.length) {
    for (const it of finArr) {
      const o = it as Record<string, unknown>;
      const k = normalizeSection(o.section ?? o.key) || secRaw;
      if (!k) continue;
      const prev = byKey[k] ?? { paid_on: "", amount: 0, tax: 0 };
      byKey[k] = {
        paid_on: String(o.paid_on ?? o.period ?? prev.paid_on ?? ""),
        amount: (num(o.amount) ?? 0) + (prev.amount ?? 0),
        tax: (num(o.tax) ?? 0) + (prev.tax ?? 0),
      };
    }
  } else if (secRaw) {
    byKey[secRaw] = {
      paid_on: snap.tax_year ? `ปีภาษี ${Number(snap.tax_year) + 543}` : "",
      amount: totalIncome,
      tax: totalTax,
    };
  } else {
    missing.push("ประเภทเงินได้ที่รู้จัก (income_section / income_final)");
  }

  const incomeRows: Wht50Line[] = WHT50_INCOME_ROWS.map((r) => {
    const v = byKey[r.key];
    return {
      key: r.key, no: r.no, label: r.label,
      paid_on: v ? v.paid_on : "",
      amount: v ? v.amount : null,
      tax: v ? v.tax : null,
    };
  });

  /* ---- วิธีออกภาษี ----
     ติ๊กจากค่าจริงใน tax_payment_mode เท่านั้น ไม่มีค่า = ไม่ติ๊กช่องใด
     และถือว่าข้อมูลไม่ครบ (แบบฟอร์มบังคับให้ระบุ) */
  const pmode = String(snap.tax_payment_mode ?? "").trim().toUpperCase();
  const pmodeOther = String(snap.tax_payment_mode_other ?? "").trim();
  if (!pmode) {
    missing.push("วิธีออกภาษี (tax_payment_mode)");
  } else if (!WHT50_PAYMENT_MODES.some((x) => x.code === pmode)) {
    missing.push(`วิธีออกภาษีไม่รู้จัก: ${pmode}`);
  } else if (pmode === "OTHER" && !pmodeOther) {
    missing.push("รายละเอียดวิธีออกภาษี (tax_payment_mode_other)");
  }
  const paymentMode = WHT50_PAYMENT_MODES.map((x) => ({
    code: x.code, label: x.label, checked: x.code === pmode,
  }));

  const signerName = String(snap.signer_name ?? "").trim();
  if (!signerName) missing.push("ชื่อผู้ลงนาม");
  const issue = beDate(snap.issue_date);
  if (!issue) missing.push("วันที่ออกหนังสือรับรองฯ");

  return {
    taxYear: snap.tax_year == null ? null : Number(snap.tax_year),
    docNo: String(snap.doc_no ?? ""),
    bookNo: String(snap.book_no ?? ""),
    seqNo: String(snap.seq_no ?? ""),
    copyLabels: [
      "ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่ายใช้แนบพร้อมกับแบบแสดงรายการ)",
      "ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่ายเก็บไว้เป็นหลักฐาน)",
    ],
    title: "หนังสือรับรองการหักภาษี ณ ที่จ่าย",
    subtitle: "ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร",
    payer, payee, formType, incomeRows,
    totalIncome, totalTax,
    taxWords: bahtText(totalTax),
    /* Production ยังไม่มีคอลัมน์ กบข./กสจ. — แสดงหัวข้อตามแบบแต่เว้นยอด */
    totalGpf: null,
    totalSso: num(snap.total_sso),
    totalPvd: num(snap.total_pvd),
    paymentMode,
    paymentModeOther: pmodeOther,
    certifyText: "ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ",
    signer: { name: signerName, position: String(snap.signer_position ?? "") },
    issueDate: issue,
    amendSeq: Number(snap.amend_seq ?? 0),
    missing,
  };
}

/** ตรวจว่า Model ออกเอกสารได้หรือไม่ — ไม่มีการเดาค่าแทน */
export function validateWht50Model(m: Wht50Model): { ok: boolean; missing: string[] } {
  return { ok: m.missing.length === 0, missing: m.missing.slice() };
}

/* ============================================================
   วาด PDF จาก Model
   ============================================================ */
interface Ctx {
  pdf: PDFDocument; page: PDFPage; y: number; reg: PDFFont; bold: PDFFont;
  /* fontkit font สำหรับคำนวณ glyph ที่ถูกวาดจริง (ใช้แก้ตาราง /W ทีหลัง) */
  fkReg: FkFont; fkBold: FkFont;
  usedReg: Map<number, number>; usedBold: Map<number, number>;
}

/* รูปของ fontkit เท่าที่ใช้ — ไม่ประกาศเกินจำเป็น */
interface FkGlyph { id: number; advanceWidth: number; }
interface FkFont {
  unitsPerEm: number;
  layout(text: string): { glyphs: FkGlyph[]; positions: { xAdvance: number }[] };
}

/* ============================================================
   บันทึก glyph ที่ถูกวาดจริงพร้อมความกว้างหลังผ่าน GSUB/GPOS
   ------------------------------------------------------------
   ฟอนต์ไทยเลือก glyph ตัวแปรตามบริบท เช่น ไม้เอกเหนือพยัญชนะมีหาง
   glyph กลุ่มนี้เข้าถึงได้จาก layout() เท่านั้น ไม่ได้มาจากรหัสอักขระตรง ๆ
   pdf-lib จึงไม่ใส่ไว้ในตาราง /W — ต้องเก็บเองแล้วเติมกลับหลัง save
   ============================================================ */
/* ข้อความครอบคลุมอักขระไทยทุกตัวและทุกคู่ที่ทำให้เกิด glyph ตัวแปร
   ใช้ลงทะเบียนความกว้างล่วงหน้า ไม่ได้วาดลงเอกสาร */
const THAI_COVERAGE = (function (): string {
  const cons = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ";
  const upper = ["", "ิ", "ี", "ึ", "ื", "ั", "็", "์"];
  const tones = ["", "่", "้", "๊", "๋", "์"];
  const lower = ["", "ุ", "ู", "ฺ"];
  const marks = ["ิ", "ี", "ึ", "ื", "ั", "็", "์", "่", "้", "๊", "๋", "ุ", "ู", "ฺ"];
  let out = cons + "ะาำเแโใไๅๆฯ๐๑๒๓๔๕๖๗๘๙";
  for (const c of cons) {
    for (const u of upper) {
      for (const t of tones) out += c + u + t + " ";
    }
    for (const l of lower) out += c + l + " ";
    /* ลำดับเครื่องหมายซ้อนกัน 2 ตัว — บางคู่ทำให้ฟอนต์เลือก glyph คนละตัวอีก
       เช่น "ฮูิ" และ "ฮูั" ให้ glyph ที่คู่เดี่ยวไม่เคยสร้าง */
    for (const m1 of marks) {
      for (const m2 of marks) out += c + m1 + m2 + " ";
    }
  }
  return out;
})();

function collectGlyphs(font: FkFont, text: string, out: Map<number, number>): void {
  if (!text) return;
  let r;
  try { r = font.layout(text); } catch { return; }
  for (let i = 0; i < r.glyphs.length; i++) {
    const g = r.glyphs[i];
    const adv = r.positions[i] ? r.positions[i].xAdvance : g.advanceWidth;
    /* แปลงเป็นหน่วย 1/1000 em ตามที่ PDF ใช้ */
    out.set(g.id, Math.round((adv / font.unitsPerEm) * 1000));
  }
}

function txt(ctx: Ctx, s: string, x: number, y: number, size: number, bold = false, color = C_TEXT) {
  if (!s) return;
  collectGlyphs(bold ? ctx.fkBold : ctx.fkReg, s, bold ? ctx.usedBold : ctx.usedReg);
  ctx.page.drawText(s, { x, y, size, font: bold ? ctx.bold : ctx.reg, color });
}

function txtR(ctx: Ctx, s: string, xRight: number, y: number, size: number, bold = false) {
  if (!s) return;
  collectGlyphs(bold ? ctx.fkBold : ctx.fkReg, s, bold ? ctx.usedBold : ctx.usedReg);
  const f = bold ? ctx.bold : ctx.reg;
  const w = f.widthOfTextAtSize(s, size);
  ctx.page.drawText(s, { x: xRight - w, y, size, font: f, color: C_TEXT });
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, color = C_LINE, thickness = 0.7) {
  ctx.page.drawRectangle({ x, y, width: w, height: h, borderColor: color, borderWidth: thickness });
}

/** ช่องติ๊ก — ติ๊กด้วยเครื่องหมายถูกตามแบบ */
function checkbox(ctx: Ctx, x: number, y: number, checked: boolean, label: string, size = 8) {
  const s = 7.5;
  box(ctx, x, y - 1, s, s, C_LINE, 0.7);
  if (checked) txt(ctx, "X", x + 1.7, y + 0.2, 7, true);
  txt(ctx, label, x + s + 3, y, size);
  return x + s + 5 + ctx.reg.widthOfTextAtSize(label, size);
}

function dotted(ctx: Ctx, x: number, y: number, w: number) {
  ctx.page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: 0.5, color: C_THIN });
}

/**
 * วาดหนังสือรับรองฯ 1 ฉบับ (1 หน้า)
 * @param copyLabel ข้อความหัวมุมขวาบน — ฉบับที่ 1 หรือ ฉบับที่ 2
 */
function drawOne(ctx: Ctx, m: Wht50Model, copyLabel: string) {
  let y = A4_H - M_T;

  /* ---- หัวเอกสาร ---- */
  txtR(ctx, copyLabel, A4_W - M_R, y, 8);
  y -= 16;
  const tW = ctx.bold.widthOfTextAtSize(m.title, 14);
  txt(ctx, m.title, (A4_W - tW) / 2, y, 14, true);
  y -= 15;
  const sW = ctx.reg.widthOfTextAtSize(m.subtitle, 10);
  txt(ctx, m.subtitle, (A4_W - sW) / 2, y, 10);

  /* เล่มที่ / เลขที่ มุมขวา */
  txt(ctx, "เล่มที่", A4_W - M_R - 150, y + 15, 9);
  dotted(ctx, A4_W - M_R - 122, y + 14, 50);
  txt(ctx, m.bookNo, A4_W - M_R - 120, y + 15, 9);
  txt(ctx, "เลขที่", A4_W - M_R - 66, y + 15, 9);
  dotted(ctx, A4_W - M_R - 40, y + 14, 40);
  txt(ctx, m.docNo, A4_W - M_R - 38, y + 15, 9);
  if (m.amendSeq > 0) {
    txtR(ctx, `(ฉบับแก้ไขครั้งที่ ${m.amendSeq})`, A4_W - M_R, y - 10, 8);
  }
  y -= 20;

  /* ---- ผู้มีหน้าที่หักภาษี ณ ที่จ่าย ---- */
  txt(ctx, "ผู้มีหน้าที่หักภาษี ณ ที่จ่าย :-", M_L, y, 9, true);
  y -= 13;
  txt(ctx, "ชื่อ", M_L + 8, y, 9);
  dotted(ctx, M_L + 26, y - 2, CW - 200);
  txt(ctx, m.payer.name, M_L + 30, y, 9);
  txt(ctx, "เลขประจำตัวผู้เสียภาษีอากร", A4_W - M_R - 170, y, 8);
  dotted(ctx, A4_W - M_R - 78, y - 2, 78);
  txt(ctx, m.payer.taxid, A4_W - M_R - 76, y, 9);
  y -= 13;
  txt(ctx, "ที่อยู่", M_L + 8, y, 9);
  dotted(ctx, M_L + 30, y - 2, CW - 38);
  txt(ctx, m.payer.address, M_L + 34, y, 8);
  y -= 16;

  /* ---- ผู้ถูกหักภาษี ณ ที่จ่าย ---- */
  txt(ctx, "ผู้ถูกหักภาษี ณ ที่จ่าย :-", M_L, y, 9, true);
  y -= 13;
  txt(ctx, "ชื่อ", M_L + 8, y, 9);
  dotted(ctx, M_L + 26, y - 2, CW - 200);
  txt(ctx, m.payee.name, M_L + 30, y, 9);
  txt(ctx, "เลขประจำตัวประชาชน", A4_W - M_R - 170, y, 8);
  dotted(ctx, A4_W - M_R - 78, y - 2, 78);
  txt(ctx, m.payee.taxid, A4_W - M_R - 76, y, 9);
  y -= 13;
  txt(ctx, "ที่อยู่", M_L + 8, y, 9);
  dotted(ctx, M_L + 30, y - 2, CW - 38);
  txt(ctx, m.payee.address, M_L + 34, y, 8);
  y -= 18;

  /* ---- ประเภทแบบยื่นรายการ + ลำดับที่ในแบบ ---- */
  let x = M_L;
  txt(ctx, "ลำดับที่", x, y, 8);
  dotted(ctx, x + 30, y - 2, 34);
  txt(ctx, m.seqNo, x + 34, y, 8);
  x += 70;
  for (const f of m.formType) {
    if (x > A4_W - M_R - 70) { y -= 13; x = M_L + 70; }
    x = checkbox(ctx, x, y, f.checked, f.label, 8) + 4;
  }
  y -= 18;

  /* ---- ตารางเงินได้ ---- */
  const colNo = M_L;
  const colLabel = M_L + 16;
  const colDate = M_L + CW - 200;
  const colAmt = M_L + CW - 120;
  const colTax = M_L + CW;
  const hHead = 26;

  box(ctx, M_L, y - hHead, CW, hHead);
  txt(ctx, "ประเภทเงินได้พึงประเมินที่จ่าย", colLabel + 40, y - 11, 8, true);
  txt(ctx, "วัน เดือน", colDate + 8, y - 8, 7.5, true);
  txt(ctx, "หรือปีภาษีที่จ่าย", colDate + 2, y - 17, 7.5, true);
  /* หัวสองคอลัมน์ขวาแบ่งสองบรรทัด — คอลัมน์ภาษีกว้าง 42pt
     ถ้าเขียนบรรทัดเดียวจะยาวเกินและไปทับคอลัมน์จำนวนเงิน */
  txt(ctx, "จำนวนเงิน", colAmt + 16, y - 8, 7.5, true);
  txt(ctx, "ที่จ่าย", colAmt + 26, y - 17, 7.5, true);
  txt(ctx, "ภาษีที่หัก", colAmt + 84, y - 8, 7, true);
  txt(ctx, "และนำส่งไว้", colAmt + 80, y - 17, 7, true);
  ctx.page.drawLine({ start: { x: colDate, y: y - hHead }, end: { x: colDate, y }, thickness: 0.7, color: C_LINE });
  ctx.page.drawLine({ start: { x: colAmt, y: y - hHead }, end: { x: colAmt, y }, thickness: 0.7, color: C_LINE });
  ctx.page.drawLine({ start: { x: colAmt + 78, y: y - hHead }, end: { x: colAmt + 78, y }, thickness: 0.7, color: C_LINE });
  y -= hHead;

  for (const ln of m.incomeRows) {
    const h = ln.key === "3TRES" ? 26 : 17;
    box(ctx, M_L, y - h, CW, h);
    ctx.page.drawLine({ start: { x: colDate, y: y - h }, end: { x: colDate, y }, thickness: 0.7, color: C_LINE });
    ctx.page.drawLine({ start: { x: colAmt, y: y - h }, end: { x: colAmt, y }, thickness: 0.7, color: C_LINE });
    ctx.page.drawLine({ start: { x: colAmt + 78, y: y - h }, end: { x: colAmt + 78, y }, thickness: 0.7, color: C_LINE });
    txt(ctx, ln.no, colNo + 3, y - 12, 8);
    if (ln.key === "3TRES") {
      txt(ctx, "การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากร", colLabel, y - 11, 7.5);
      txt(ctx, "ที่ออกตามมาตรา 3 เตรส", colLabel, y - 21, 7.5);
    } else {
      txt(ctx, ln.label, colLabel, y - 12, 7.5);
    }
    txt(ctx, ln.paid_on, colDate + 4, y - 12, 7.5);
    txtR(ctx, money(ln.amount), colAmt + 74, y - 12, 8);
    txtR(ctx, money(ln.tax), colTax - 4, y - 12, 8);
    y -= h;
  }

  /* ---- รวม ---- */
  const hSum = 18;
  box(ctx, M_L, y - hSum, CW, hSum);
  ctx.page.drawLine({ start: { x: colAmt, y: y - hSum }, end: { x: colAmt, y }, thickness: 0.7, color: C_LINE });
  ctx.page.drawLine({ start: { x: colAmt + 78, y: y - hSum }, end: { x: colAmt + 78, y }, thickness: 0.7, color: C_LINE });
  txt(ctx, "รวมเงินที่จ่ายและภาษีที่หักนำส่ง", colLabel + 60, y - 12, 8, true);
  txtR(ctx, money(m.totalIncome), colAmt + 74, y - 12, 8, true);
  txtR(ctx, money(m.totalTax), colTax - 4, y - 12, 8, true);
  y -= hSum;

  const hTxt = 18;
  box(ctx, M_L, y - hTxt, CW, hTxt);
  txt(ctx, "รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)", colLabel, y - 12, 8);
  txt(ctx, m.taxWords, colLabel + 130, y - 12, 8, true);
  y -= hTxt + 10;

  /* ---- เงินที่จ่ายเข้ากองทุน ---- */
  txt(ctx, "เงินที่จ่ายเข้า", M_L, y, 8);
  let fx = M_L + 52;
  const funds = [
    { label: "กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน", amount: m.totalGpf },
    { label: "กองทุนประกันสังคม", amount: m.totalSso },
    { label: "กองทุนสำรองเลี้ยงชีพ", amount: m.totalPvd },
  ];
  for (const f of funds) {
    txt(ctx, f.label, fx, y, 7.5);
    const lw = ctx.reg.widthOfTextAtSize(f.label, 7.5);
    dotted(ctx, fx + lw + 3, y - 2, 46);
    txtR(ctx, money(f.amount), fx + lw + 47, y, 7.5);
    fx += lw + 54;
    if (fx > A4_W - M_R - 100) { y -= 12; fx = M_L + 52; }
  }
  y -= 16;

  /* ---- ผู้จ่ายเงิน ---- */
  txt(ctx, "ผู้จ่ายเงิน", M_L, y, 8, true);
  let px = M_L + 46;
  m.paymentMode.forEach((p, i) => {
    px = checkbox(ctx, px, y, p.checked, `(${i + 1}) ${p.label}`, 8) + 6;
  });
  if (m.paymentModeOther) {
    dotted(ctx, px, y - 2, 90);
    txt(ctx, m.paymentModeOther, px + 2, y, 8);
  }
  y -= 20;

  /* ---- คำรับรอง + ลงชื่อ ---- */
  txt(ctx, m.certifyText, M_L, y, 8);
  y -= 26;

  const sx = A4_W - M_R - 210;
  txt(ctx, "ลงชื่อ", sx, y, 8);
  dotted(ctx, sx + 26, y - 2, 150);
  const nmW = ctx.reg.widthOfTextAtSize(m.signer.name, 8);
  txt(ctx, m.signer.name, sx + 26 + (150 - nmW) / 2, y + 2, 8);
  txt(ctx, "ผู้จ่ายเงิน", sx + 180, y - 12, 8);
  y -= 14;
  if (m.signer.position) {
    const poW = ctx.reg.widthOfTextAtSize(m.signer.position, 7.5);
    txt(ctx, m.signer.position, sx + 26 + (150 - poW) / 2, y, 7.5);
    y -= 12;
  }
  txt(ctx, "วัน เดือน ปี ที่ออกหนังสือรับรองฯ", sx - 10, y, 8);
  dotted(ctx, sx + 118, y - 2, 58);
  txt(ctx, m.issueDate, sx + 122, y, 8);

  /* ตรานิติบุคคล (ถ้ามี) */
  box(ctx, M_L, y - 34, 92, 46, C_THIN, 0.5);
  txt(ctx, "ประทับตรานิติบุคคล", M_L + 12, y - 14, 7);
  txt(ctx, "(ถ้ามี)", M_L + 34, y - 24, 7);
}

/* ============================================================
   ตรวจฟอนต์ไทยก่อนวาด — ห้าม fallback Helvetica
   ------------------------------------------------------------
   pdf-lib ไม่มีฟอนต์ไทยในตัว ถ้าใช้ Helvetica ข้อความไทยจะกลายเป็นช่องว่าง
   หรือเครื่องหมายคำถามทั้งหน้า ซึ่งเป็นเอกสารภาษีที่ใช้ไม่ได้
   จึงต้องหยุดตั้งแต่ต้นและบอกชื่อไฟล์ที่ขาดให้ชัด
   ============================================================ */
export const WHT50_FONT_FILES = {
  regular: "Prompt-Regular.ttf",
  bold: "Prompt-Bold.ttf",
};

/** ขนาดขั้นต่ำที่ถือว่าเป็นไฟล์ฟอนต์จริง ไม่ใช่ไฟล์เปล่าหรือ placeholder */
const FONT_MIN_BYTES = 20000;

export function assertThaiFontsReady(
  fontRegular: Uint8Array | null | undefined,
  fontBold: Uint8Array | null | undefined,
): void {
  const missing: string[] = [];
  if (!fontRegular || fontRegular.length < FONT_MIN_BYTES) {
    missing.push(WHT50_FONT_FILES.regular);
  }
  if (!fontBold || fontBold.length < FONT_MIN_BYTES) {
    missing.push(WHT50_FONT_FILES.bold);
  }
  if (missing.length) {
    throw new Error("Missing Thai font: " + missing.join(", "));
  }
}

/* ============================================================
   เติมความกว้างของ glyph ไทยที่ pdf-lib ตกหล่นในตาราง /W
   ------------------------------------------------------------
   อาการเดิม: มีช่องว่างกว้างเท่าตัวอักษรแทรกหลังวรรณยุกต์ทุกตำแหน่ง
              เช่น "ที่จ่าย" แสดงเป็น "ที่  จ่าย"

   สาเหตุ (พิสูจน์จากไฟล์ PDF จริง ไม่ใช่การเดา):
     pdf-lib 1.17.1 สร้างตาราง /W จาก glyph ที่ map ตรงจากรหัสอักขระเท่านั้น
     แต่ฟอนต์ไทยเลือก glyph ตัวแปรผ่าน GSUB เช่น
       glyph 720 ไม้เอกปกติ        → มีใน /W width 0   ✓
       glyph 721 · 723 · 724 ตัวแปร → ไม่มีใน /W        ✗
     โปรแกรมอ่าน PDF จึงใช้ค่าปริยาย /DW = 1000

   วิธีแก้ที่ใช้:
     ไม่ตั้ง /DW 0 ทั้งฟอนต์ (เสี่ยงทำให้ glyph อื่นที่ตกหล่นกว้าง 0 ไปด้วย)
     แต่เติม /W เฉพาะ glyph ที่วาดจริงและยังไม่มีในตาราง
     โดยใช้ความกว้างจริงจาก fontkit หลังผ่าน GSUB/GPOS

     ต้องทำหลัง save เพราะ pdf-lib สร้าง Font Dictionary ตอน save เท่านั้น
     จึง save → โหลดกลับ → แก้ /W ของ CIDFontType2 → save อีกครั้ง
     ผลลัพธ์จึงพิสูจน์ได้จากไบต์สุดท้ายจริง
   ============================================================ */
async function patchGlyphWidths(
  bytes: Uint8Array,
  usedReg: Map<number, number>,
  usedBold: Map<number, number>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const ctx = (doc as unknown as {
    context: { enumerateIndirectObjects(): Array<[unknown, unknown]> };
  }).context;
  if (!ctx || typeof ctx.enumerateIndirectObjects !== "function") return bytes;

  let patched = 0;
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    const dict = obj as unknown as {
      get?: (k: unknown) => unknown;
      lookup?: (k: unknown) => unknown;
    };
    if (!dict || typeof dict.get !== "function") continue;

    const sub = dict.get(PDFName.of("Subtype"));
    if (!sub || String(sub) !== "/CIDFontType2") continue;

    const base = dict.get(PDFName.of("BaseFont"));
    const baseName = base ? String(base) : "";
    /* แยกว่าเป็นฟอนต์ตัวปกติหรือตัวหนา จากชื่อที่ pdf-lib ตั้งให้ */
    const used = /Bold/i.test(baseName) ? usedBold : usedReg;
    if (!used.size) continue;

    const wArr = dict.get(PDFName.of("W")) as PDFArray | undefined;
    if (!wArr || typeof wArr.size !== "function") continue;

    /* อ่านว่า CID ไหนมีความกว้างระบุไว้แล้ว
       รูปแบบที่ pdf-lib เขียนคือ  cid [ w ]  เรียงต่อกัน */
    const have = new Set<number>();
    for (let k = 0; k < wArr.size(); k++) {
      const cur = wArr.get(k);
      const nxt = k + 1 < wArr.size() ? wArr.get(k + 1) : null;
      const curNum = cur as unknown as { asNumber?: () => number };
      const nxtArr = nxt as unknown as { size?: () => number };
      if (typeof curNum.asNumber === "function" && nxtArr &&
          typeof nxtArr.size === "function") {
        const start = curNum.asNumber();
        const n = (nxt as PDFArray).size();
        for (let q = 0; q < n; q++) have.add(start + q);
      }
    }

    /* เติมเฉพาะตัวที่ขาด — ไม่แตะของเดิมเลย */
    for (const [gid, w] of used) {
      if (have.has(gid)) continue;
      const one = doc.context.obj([w]) as PDFArray;
      wArr.push(PDFNumber.of(gid));
      wArr.push(one);
      patched++;
    }
  }
  if (!patched) return bytes;
  return await doc.save();
}

/**
 * สร้าง PDF หนังสือรับรองการหักภาษี ณ ที่จ่าย/**
 * สร้าง PDF หนังสือรับรองการหักภาษี ณ ที่จ่าย
 * ออก 2 ฉบับตามที่กรมสรรพากรกำหนด (ฉบับที่ 1 และ ฉบับที่ 2) หน้าละฉบับ
 */
export async function buildWht50Pdf(
  snap: Wht50Snapshot,
  fontRegular: Uint8Array,
  fontBold: Uint8Array,
): Promise<Uint8Array> {
  /* ตรวจฟอนต์ก่อนอย่างอื่น — ถ้าขาดต้องไม่สร้างไฟล์และไม่ commit READY
     ตัวเรียก (index.ts) จะส่งต่อไป njhr_doc_pdf_fail ตาม Pipeline เดิม */
  assertThaiFontsReady(fontRegular, fontBold);

  const m = buildWht50Model(snap);
  const v = validateWht50Model(m);
  if (!v.ok) {
    throw new Error("ข้อมูล 50 ทวิ ไม่ครบ: " + v.missing.join(" · "));
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // subset: false เหมือน Renderer เดิม — กันสระ/วรรณยุกต์ไทยหายจากการ subset
  const reg = await pdf.embedFont(fontRegular, { subset: false });
  const bold = await pdf.embedFont(fontBold, { subset: false });

  pdf.setTitle(`50TAWI-${m.docNo}`);
  pdf.setSubject("หนังสือรับรองการหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ");
  pdf.setProducer("NJ LOGISTIC HR SYSTEM");
  pdf.setCreator("NJ LOGISTIC HR SYSTEM");
  pdf.setCreationDate(new Date(0));
  pdf.setModificationDate(new Date(0));

  const fkReg = fontkit.create(fontRegular) as unknown as FkFont;
  const fkBold = fontkit.create(fontBold) as unknown as FkFont;
  const usedReg = new Map<number, number>();
  const usedBold = new Map<number, number>();

  /* ลงทะเบียน glyph ตัวแปรของไทยไว้ล่วงหน้าทุกแบบ
     เพราะข้อมูลจริง (ชื่อคน · ที่อยู่) มีอักษรอะไรก็ได้
     ถ้ารอเก็บเฉพาะตอนวาด จะพลาดตัวแปรที่เอกสารฉบับนี้บังเอิญไม่มี
     แล้วเอกสารของคนถัดไปที่มีอักษรนั้นจะเกิดช่องว่างทันที
     รวมทุกคู่ พยัญชนะ × (สระบน/ล่าง) × วรรณยุกต์ — เพิ่มไม่กี่สิบรายการ */
  for (const f of [{ fk: fkReg, out: usedReg }, { fk: fkBold, out: usedBold }]) {
    collectGlyphs(f.fk, THAI_COVERAGE, f.out);
  }

  for (const copyLabel of m.copyLabels) {
    const page = pdf.addPage([A4_W, A4_H]);
    drawOne({ pdf, page, y: A4_H - M_T, reg, bold, fkReg, fkBold, usedReg, usedBold },
      m, copyLabel);
  }

  /* เติมความกว้าง glyph ไทยที่ pdf-lib ตกหล่น ก่อนคืนไบต์สุดท้าย */
  return await patchGlyphWidths(await pdf.save(), usedReg, usedBold);
}
