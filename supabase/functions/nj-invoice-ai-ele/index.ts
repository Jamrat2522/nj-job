// checkdecl local112 — nj-invoice-ai-ele (ELE TYPE 0 · PDF→Excel AI · อ่าน INVOICE PDF Electrolux ด้วย Claude · Background Job + Polling · Cache กลางองค์กร 3 วัน)
// cg-v1 (17/11/2026): + NJL AI COST GUARD — ตรวจ/จองงบแบบ Atomic ก่อนเรียก Claude ทุกครั้ง · ปรับยอดจริงหลังตอบ · ระบบงบล้มเหลว = หยุด (Fail-Closed) · ต้องรัน SQL RUN-AI-COST-01 ก่อน Deploy
// local112: เลือกรุ่นได้ 2 รุ่น (claude-sonnet-5-5 / claude-opus-5-5 · รุ่นอื่น = 400 · Server ไม่สลับรุ่นเอง) + action "recheck" = อ่านซ้ำเฉพาะรายการที่ถูกฟ้อง (หน้าเดียว) · usage แยกตามรุ่น
// แยกจาก nj-invoice-ai (KDC / PDF→Excel) · nj-invoice-ai-tx (TEXAS DB12) · nj-invoice-ai-shell (THE SHELL) ทั้งหมด: Prompt / Tool Schema / prompt_ver / Cache Key ของตัวเอง
// ใช้ร่วมกับ nj-invoice-ai เดิม: Secret ANTHROPIC_API_KEY ตัวเดิม (ไม่สร้าง Key ใหม่) · เครดิตองค์กร · ตาราง nj_ai_jobs + Cache 3 วัน · Background Job + Polling แบบเดียวกัน
// ไม่เรียก nj-invoice-ai ตรง: ตัวเดิมรับเฉพาะ Session EDCAPL (edcapl_apl_auth) + Prompt/Schema ของ KDC · ไฟล์ละไม่เกิน 8 MB — แก้แล้วจะกระทบ KDC / PDF→Excel
// หน้าเว็บแบ่ง PDF เป็นชุดหน้า (Chunk) — แต่ละ Chunk = หน้าที่ "เป็นเจ้าของ" (owned) + หน้าถัดไป 1 หน้าเป็น "บริบท" (context) เพื่ออ่านรหัสบรรทัดที่ 2 ของรายการสุดท้ายที่ข้ามหน้า
// Cache Key = file_hash (SHA-256 ของ Chunk) + model + prompt_ver โดย prompt_ver = "ele-type0|<prompt>|<mapping>|<schema>|o<owned>of<pages>" → ไม่ชนโหมดอื่น
// ยืนยันตัวตน (ทุก Request ที่ Server): Session Token ของ checkdecl (calc_login) → ตรวจด้วย RPC calc_session_me (มีอยู่เดิม · อ่านอย่างเดียว)
// ตาราง nj_ai_jobs เก็บเฉพาะ: file_hash / model / prompt_ver / สถานะ / ผลที่ตรวจผ่านแล้ว / usage (ตัวเลข) / error — ไม่เก็บ PDF, Base64, ชื่อไฟล์, Key, Session, Username
// ไม่ Log เนื้อหาไฟล์ / Base64 / Key / Session / ผลอ่าน · ไม่ส่ง Raw API Error ให้ผู้ใช้
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const MODE = "ele-type0";
// รุ่นที่อนุญาต (ตรวจกับ /v1/models จริงก่อนเรียกทุกครั้งแรกของ Instance) · ไม่ส่ง model = Sonnet 5.5 · ห้ามสลับรุ่นเอง
// ราคา USD ต่อ 1M tokens ตามหน้า Pricing ทางการ ณ 2026-11: Sonnet 5.5 = 2 / 10 · Opus 5.5 = 4 / 20 (cost_usd_est = Tokens จริงจาก API × ราคานี้)
export const MODELS: Record<string, { in: number; out: number }> = { "claude-sonnet-5-5": { in: 2, out: 10 }, "claude-opus-5-5": { in: 4, out: 20 } };
export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const PROMPT_REV = "p1", MAPPING_VER = "m1", SCHEMA_VER = "s1";
export const PROMPT_BASE = `${MODE}|${PROMPT_REV}|${MAPPING_VER}|${SCHEMA_VER}`;
export const promptVer = (owned: number, pages: number) => `${PROMPT_BASE}|o${owned}of${pages}`;
export const RC_BASE = `${MODE}-rc|p1|s1`;   // อ่านซ้ำเฉพาะจุด: prompt_ver = RC_BASE|<SHA-256 ของรายการเป้าหมาย 16 ตัวแรก>|n<pages>
const MAX_TARGETS = 40;
const MAX_BYTES = 8 * 1024 * 1024, MAX_PAGES = 8, MAX_OUT = 32000, TIMEOUT_MS = 360_000, EFFORT = "medium";
const POLL_MS = 2500, STALE_RUN_MS = 7 * 60_000, STALE_PEND_MS = 2 * 60_000, JOBS = "nj_ai_jobs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, TOKEN = /^[0-9a-f]{64}$/;
const ORIGINS = [/^https:\/\/(www\.)?njl-logistic\.com$/, /^https:\/\/jamrat2522\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^null$/];
const corsOf = (req: Request) => { const o = req.headers.get("origin") || ""; const ok = ORIGINS.some((r) => r.test(o));
  return { ok, h: { ...(ok ? { "Access-Control-Allow-Origin": o } : {}), "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } as Record<string, string> }; };

// Strict Tool: ช่องข้อความเป็น string ล้วน ("" = ไม่มีพิมพ์ / อ่านไม่ชัด → Server แปลงเป็น null)
const S = (d: string) => ({ type: "string", description: d + ' — empty string "" if not printed or not clearly legible' });
export const TOOL = {
  name: "submit_ele_invoice_pages",
  description: "Return the page list and every product item row of the Electrolux spare-parts invoice pages, in printed order.",
  strict: true,
  input_schema: {
    type: "object", additionalProperties: false,
    properties: {
      pages: { type: "array", description: "one entry for EVERY page of this PDF file, in file order (owned pages and the context page)", items: { type: "object", additionalProperties: false, properties: {
        pg: { type: "integer", description: "1-based page number inside this PDF file" },
        page_type: { type: "string", enum: ["invoice", "customs_value", "package_list", "packing_list", "other"], description: "invoice = page titled Fattura-Invoice-Rechnung-Facture with the Codice / Descrizione / Quantita / Prezzo unitario / Importo item table; customs_value = rotated 'Value For Customs Of Spareparts' summary; package_list = 'Distinta colli - Package list'; packing_list = 'Distinta / Packing list' table with Netto / Netto totale columns" },
        printed_page_no: S("page number printed at the top right corner, digits only"),
        invoice_no: S("invoice number printed on this page (Fattura / Invoice N.), digits only"),
      }, required: ["pg", "page_type", "printed_page_no", "invoice_no"] } },
      invoices: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        invoice_no: S("invoice number exactly as printed under Fattura-Invoice-Rechnung-Facture N."),
        date: S("invoice date as YYYY-MM-DD (printed as YYYY/MM/DD next to the invoice number)"),
        date_text: S("invoice date exactly as printed"),
        currency: S("3-letter currency printed above the Importo / Amount column, e.g. EUR"),
        total_value: S("TOTAL VALUE amount if it is printed on an owned page, digits and decimal point only"),
        packing_expenses: S("PACKING EXPENSES amount if printed on an owned page, digits and decimal point only"),
        total: S("TOTAL (after packing expenses) if printed on an owned page, digits and decimal point only"),
        items: { type: "array", items: { type: "object", additionalProperties: false, properties: {
          pg: { type: "integer", description: "1-based page of this PDF file where the item's main row is printed (must be an owned page)" },
          row: { type: "integer", description: "1-based order of this item on its page, top to bottom" },
          code_left: S("code printed in the left Codice / Code column of the item's main row, all digits exactly"),
          code_below: S("code printed on the line directly BELOW the item's main row, starting under the description column (it may be on the next page), all digits exactly"),
          code_below_page: { type: "integer", description: "1-based page where code_below is printed (same as pg, or pg+1 when the item continues on the next page); 0 if not found" },
          desc: S("description exactly as printed on the item's main row (Italian text followed by English text); collapse runs of spaces to one space; do not translate or fix"),
          coo: S("2-letter country of origin printed in the * column of the item's main row"),
          qty: S("Quantita / Quantity of the item, digits only"),
          unit_price: S("Prezzo unitario / Unit price, digits and decimal point only"),
          amount: S("Importo / Amount of the item, digits and decimal point only"),
          our_order_no: S("number after OUR ORDER NO in the nearest order header line printed above this item (may be on an earlier page), digits only"),
          your_order_no: S("value after YOUR ORDER NO in that same order header line, exactly as printed"),
          note: S("why a field is empty or uncertain; empty string when everything is clear"),
        }, required: ["pg", "row", "code_left", "code_below", "code_below_page", "desc", "coo", "qty", "unit_price", "amount", "our_order_no", "your_order_no", "note"] } },
      }, required: ["invoice_no", "date", "date_text", "currency", "total_value", "packing_expenses", "total", "items"] } },
      complete: { type: "boolean", description: "true only if every owned page and every item row on the owned pages was read" },
      remarks: S("anything the user must check; empty string if none"),
    },
    required: ["pages", "invoices", "complete", "remarks"],
  },
};
export const promptOf = (owned: number, pages: number) => `You are transcribing pages of an Electrolux Appliances AB (Spare Division) commercial INVOICE PDF that was scanned (no text layer). The PDF is the only source of truth.
This file has ${pages} page(s). Pages 1 to ${owned} are OWNED pages.${pages > owned ? ` Page ${pages} is a CONTEXT page only: do not return any item whose main row is printed on page ${pages}; use page ${pages} ONLY to read code_below of the last item of page ${owned} when that code line continues at the top of page ${pages}.` : ""}
Rules:
- Return one "pages" entry for EVERY page of this file (including the context page) with its page_type, printed page number and invoice number.
- Items exist ONLY on "invoice" pages (title Fattura-Invoice-Rechnung-Facture, table Codice | Descrizione | * | Quantita | Prezzo unitario | Importo). Never return rows from the rotated "Value For Customs Of Spareparts" page, the "Distinta colli / Package list" page or the "Distinta / Packing list" pages — they repeat the same goods and are NOT items.
- Item layout: the main row prints code_left (Codice column), the description, the country of origin (* column), the quantity, the unit price and the amount. The NEXT line prints code_below (starting under the description column). code_below can be the same as code_left or a different number. When the main row is the last row of a page, code_below is printed at the top of the next page (then code_below_page = next page).
- A line at the top of an owned page that only shows a code (and maybe a text like "319 25 60-08/8 Replacing") belongs to the last item of the PREVIOUS page: it is NOT an item, do not return it.
- Lines "OUR ORDER NO ... YOUR ORDER NO ... Order date ..." are order headers, NOT items. Give every item the OUR ORDER NO / YOUR ORDER NO of the nearest header above it (it may be printed on an earlier page — if it is not visible in this file, return "" and say so in note).
- "TOTAL VALUE", "PACKING EXPENSES", "TOTAL", "non imp.art..." lines are NOT items. Return their amounts in the invoice fields total_value / packing_expenses / total only when printed on an owned page.
- NUMBER FORMAT: amounts and prices are printed with a comma decimal sign ("51,09" means 51.09; "13119,95" means 13119.95; "1.045,21" means 1045.21). Return numbers with "." as the decimal sign, no thousands separators, every printed decimal kept.
- Codes: copy every digit of code_left and code_below exactly (they can be 9 to 15 digits). Never round, never use scientific notation, never drop or add digits. If a code is split over two lines, join it.
- One printed item row = one item. Two rows with the same code, description, quantity or amount stay two items. Never merge, never sort, never skip, never invent rows. Keep the printed order (row 1, 2, 3 ... per page).
- Copy characters exactly; do not translate, normalise or fix spelling. If a character or value is not clearly legible, return "" for that field and explain in note. Never guess.
Return the result only through the submit_ele_invoice_pages tool.`;

// ── อ่านซ้ำเฉพาะจุด (recheck): ระบุหน้า + ลำดับแถว + ตัวช่วยหาแถว (ไม่ส่งค่าที่ถูกฟ้องให้ AI เห็น เพื่อไม่ให้ลอกค่าเดิม) ──
export const RC_TOOL = {
  name: "submit_ele_rechecks",
  description: "Return a fresh transcription of each requested invoice item row.",
  strict: true,
  input_schema: { type: "object", additionalProperties: false, properties: {
    answers: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      ref: { type: "string", description: "the ref of the requested item, copied exactly" },
      found: { type: "boolean", description: "true only if you located exactly this item row on the page" },
      code_left: S("code in the left Codice column of the item's main row, all digits exactly"),
      code_below: S("code printed on the line directly below the main row (may be at the top of the next page), all digits exactly"),
      desc: S("description exactly as printed on the main row; collapse runs of spaces to one space"),
      coo: S("2-letter country of origin in the * column"),
      qty: S("Quantity, digits only"), unit_price: S("Unit price, digits and decimal point only"), amount: S("Amount, digits and decimal point only"),
      note: S("why a value is empty or uncertain; empty string when everything is clear"),
    }, required: ["ref", "found", "code_left", "code_below", "desc", "coo", "qty", "unit_price", "amount", "note"] } },
  }, required: ["answers"] },
};
export const rcPromptOf = (pages: number, targets: any[]) => `You are re-checking specific item rows of a scanned Electrolux Appliances AB (Spare Division) INVOICE page. The PDF image is the only source of truth.
This file has ${pages} page(s). The requested rows are on page 1${pages > 1 ? "; page 2 is the following page, use it only when an item's code_below continues at its top" : ""}.
For each requested item: find the row on its page (count item main rows from the top of the item table, 1 = first item row; order header lines "OUR ORDER NO ..." and lines that only show a code are NOT item rows), confirm it with the location hints, then transcribe ALL its fields again directly from the image. Do not assume the hints are correct values.
Item layout: main row = Codice (code_left) | description | * (country of origin) | quantity | unit price | amount; the NEXT line prints code_below under the description.
Amounts and prices are printed with a comma decimal sign ("51,09" = 51.09, "1.045,21" = 1045.21). Return "." as the decimal sign, no thousands separators. Copy every digit of codes exactly; never use scientific notation.
If you cannot locate the row with certainty, set found = false. If a value is not clearly legible, return "" and explain in note. Never guess.
Requested items:
${targets.map((t) => `- ref "${t.ref}": page ${t.pg}, item row ${t.row} on that page; location hints: code_left about "${t.hint_code || "?"}", description starts like "${t.hint_desc || "?"}"; check especially: ${(t.fields || []).join(", ") || "all fields"}`).join("\n")}
Return the result only through the submit_ele_rechecks tool.`;

const INV_S = ["invoice_no", "date", "date_text", "currency", "total_value", "packing_expenses", "total"];
const ITEM_S = ["code_left", "code_below", "desc", "coo", "qty", "unit_price", "amount", "our_order_no", "your_order_no", "note"];
const nz = (v: unknown) => (typeof v === "string" && (v.trim() === "" || /^null$/i.test(v.trim())) ? null : v);
const RC_S = ["code_left", "code_below", "desc", "coo", "qty", "unit_price", "amount", "note"];
export function normalizeRc(r: any): any { if (r && Array.isArray(r.answers)) for (const a of r.answers) { if (a && typeof a === "object") for (const k of RC_S) a[k] = nz(a[k]); } return r; }
export function normalize(r: any): any { if (!r || !Array.isArray(r.invoices)) return r; r.remarks = nz(r.remarks);
  if (Array.isArray(r.pages)) for (const p of r.pages) { if (p && typeof p === "object") { p.printed_page_no = nz(p.printed_page_no); p.invoice_no = nz(p.invoice_no); } }
  for (const iv of r.invoices) { if (!iv || typeof iv !== "object") continue; for (const k of INV_S) iv[k] = nz(iv[k]);
    if (Array.isArray(iv.items)) for (const it of iv.items) { if (!it || typeof it !== "object") continue; for (const k of ITEM_S) it[k] = nz(it[k]); } }
  return r; }
function b64ToBytes(b64: string): Uint8Array { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sha256Hex(u: Uint8Array): Promise<string> { const d = await crypto.subtle.digest("SHA-256", u as BufferSource); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
// ══ NJL AI COST GUARD cg-v1 (17/11/2026) — บล็อกเดียวกันทุกไบต์ใน nj-invoice-ai / -tx / -shell / -grohe / -ele · ห้ามแก้แยกตัว ══
// ก่อนเรียก Claude ทุกครั้ง (อ่านหลัก · ตรวจซ้ำ Opus · Retry · งานเบื้องหลัง): นับ Token จริงด้วย /v1/messages/count_tokens (ไม่คิดเงิน)
//   → จองงบแบบ Atomic ที่ DB (nj_ai_budget_reserve ล็อกแถวเดือน) = Input จริง + Output สูงสุด (max_tokens) → เรียก → ปรับยอดจริง (nj_ai_budget_settle)
// DB / RPC / ระบบตรวจงบล้มเหลว = ไม่เรียก Claude (Fail-Closed) · ไม่มีการเพิ่มเครดิตหรือวงเงินอัตโนมัติ · ไม่มีทางข้ามเพดาน (no override)
// ไม่ Log / ไม่ส่งค่า Key · ส่งเฉพาะตัวเลข Token / USD เข้า DB
const CG_STOP_MSG = "หยุดอ่าน AI ชั่วคราว เนื่องจากค่าใช้จ่ายถึงวงเงินที่กำหนด กรุณาติดต่อ SUPER_ADMIN";
const CG_OFF_MSG = "ระบบตรวจงบประมาณ AI ไม่พร้อม จึงหยุดเรียก AI ชั่วคราวเพื่อไม่ให้ค่าใช้จ่ายเกินวงเงิน กรุณาติดต่อ SUPER_ADMIN";
// ราคา USD ต่อ 1M tokens — platform.claude.com/docs/en/about-claude/pricing (ตรวจ 17/11/2026)
// Haiku 5.5: Prompt ≤100K = 0.10/0.50 · >100K = 0.50/2.50 · Sonnet 5.5 = 2/10 · Opus 5.5 = 4/20 · Cache hit 0.1× (Haiku) / 0.05× (Sonnet, Opus) · Cache write คิด 2× (สูงสุด, ฝั่งปลอดภัย)
const CG_PRICE: Record<string, { in: number; out: number; hiIn?: number; hiOut?: number; tier?: number; hit: number }> = {
  "claude-haiku-5-5": { in: 0.10, out: 0.50, hiIn: 0.50, hiOut: 2.50, tier: 100_000, hit: 0.1 },
  "claude-sonnet-5-5": { in: 2, out: 10, hit: 0.05 },
  "claude-opus-5-5": { in: 4, out: 20, hit: 0.05 },
};
const CG_FALLBACK_IN = 1_000_000;   // นับ Token ไม่ได้ → จองเผื่อเต็ม Context 1M ของรุ่น (ฝั่งปลอดภัย)
type CgTicket = { id: string; model: string; reserve: number };
function cgCost(model: string, inTok: number, outTok: number, cw = 0, cr = 0): number | null {
  const p = CG_PRICE[model]; if (!p) return null;
  const hi = !!p.tier && inTok + cw + cr > p.tier, pi = hi ? p.hiIn! : p.in, po = hi ? p.hiOut! : p.out;
  return (inTok * pi + cw * pi * 2 + cr * pi * p.hit + outTok * po) / 1e6;
}
// Anthropic แจ้งว่าเกินวงเงิน / เครดิตไม่พอ (400 invalid_request_error · 402 billing_error · 429 spend limit)
function cgIsBilling(status: number, out: any): boolean {
  const t = `${out?.error?.type ?? ""} ${out?.error?.message ?? ""}`;
  return status === 402 || ([400, 403, 429].includes(status) && /credit balance|usage limit|spend(ing)? (limit|cap)|billing|payment|enforced_spend_limit|insufficient/i.test(t));
}
function cgIsSuper(role: unknown): boolean { return String(role ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_") === "SUPER_ADMIN"; }
// สถานะงบเดือนนี้ — อ่านไม่ได้ = null (ผู้เรียกต้องถือว่า "ไม่พร้อม" ห้ามปล่อยผ่าน)
async function cgState(db: any): Promise<any | null> {
  try { const { data, error } = await db.rpc("nj_ai_guard_state"); if (error || !data || data.on !== true) return null; return data; } catch { return null; }
}
// ตรวจก่อนสร้างงานใหม่ (ไม่เรียก AI): null = ผ่าน · มีค่า = ปฏิเสธ (503 ระบบงบไม่พร้อม / 402 ถึงวงเงิน)
async function cgGate(db: any): Promise<{ status: number; body: Record<string, unknown>; g: any } | null> {
  const g = await cgState(db);
  if (!g) return { status: 503, body: { success: false, error: "budget_off", msg: CG_OFF_MSG }, g: null };
  if (g.blocked) return { status: 402, body: { success: false, error: "cost_stop", msg: CG_STOP_MSG }, g };
  return null;
}
// action "budget": ยอดสะสม / คงเหลือ สำหรับ SUPER_ADMIN (ยอดประเมิน NJL แยกจากยอดจริง Anthropic ที่บันทึกจาก Console)
async function cgBudget(db: any, role: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!cgIsSuper(role)) return { status: 403, body: { success: false, error: "forbidden", msg: "เฉพาะ SUPER_ADMIN" } };
  const g = await cgState(db);
  if (!g) return { status: 503, body: { success: false, error: "budget_off", msg: CG_OFF_MSG } };
  return { status: 200, body: { success: true, budget: g } };
}
// จองงบก่อนเรียก Claude 1 ครั้ง (ครอบคลุมการลองซ้ำ 429 ภายในครั้งนั้น เพราะคำขอที่ถูกปฏิเสธไม่ถูกคิดเงิน)
async function cgReserve(db: any, apiKey: string, fetchFn: typeof fetch, o: { fn: string; kind: string; model: string; req: any; who: string; jobId: string }): Promise<{ ok: true; t: CgTicket } | { ok: false; code: string; msg: string }> {
  if (!CG_PRICE[o.model]) return { ok: false, code: "budget_off", msg: CG_OFF_MSG };
  let estIn = CG_FALLBACK_IN;
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 60_000);
  try {
    const r = await fetchFn("https://api.anthropic.com/v1/messages/count_tokens", { method: "POST", signal: ac.signal,
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: o.req.model, messages: o.req.messages, tools: o.req.tools, tool_choice: o.req.tool_choice }) });
    const j: any = await r.json().catch(() => null);
    if (r.ok && Number.isInteger(j?.input_tokens) && j.input_tokens > 0) estIn = j.input_tokens;
  } catch { /* นับไม่ได้ → จองเต็ม CG_FALLBACK_IN */ } finally { clearTimeout(tm); }
  const reserve = Math.ceil((cgCost(o.model, estIn, Number(o.req.max_tokens) || 0) ?? 0) * 1e6) / 1e6;
  try {
    const { data, error } = await db.rpc("nj_ai_budget_reserve", { p_fn: o.fn, p_kind: o.kind, p_model: o.model, p_reserve_usd: reserve, p_est_input: estIn, p_username: o.who || null, p_job_id: o.jobId || null });
    if (error || !data) return { ok: false, code: "budget_off", msg: CG_OFF_MSG };
    if (data.ok === true && data.id) return { ok: true, t: { id: String(data.id), model: o.model, reserve } };
    if (data.error === "cost_stop") return { ok: false, code: "cost_stop", msg: CG_STOP_MSG };
    return { ok: false, code: "budget_off", msg: CG_OFF_MSG };
  } catch { return { ok: false, code: "budget_off", msg: CG_OFF_MSG }; }
}
// ปรับยอดจองเป็นยอดจริง: มี usage = คิดตาม usage · HTTP Error = ไม่คิดเงิน · ไม่มีคำตอบ/อ่าน usage ไม่ได้ = คิดเต็มยอดจอง (ฝั่งปลอดภัย)
// DB ล้มเหลวตอนปรับยอด = ยอดจองค้าง → nj_ai_budget_expire คิดเต็มยอดจองหลัง 15 นาที (ไม่มีทางหลุดจากบัญชี)
async function cgSettle(db: any, t: CgTicket, res: Response | null, out: any): Promise<void> {
  let basis = "reserved_full", cost: number | null = null, block = false, code: string | null = res ? null : "no_response";
  const u = out?.usage, n = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0);
  const iT = u ? n(u.input_tokens) : null, oT = u ? n(u.output_tokens) : null, cw = u ? n(u.cache_creation_input_tokens) : null, cr = u ? n(u.cache_read_input_tokens) : null;
  if (res && !res.ok) { basis = "none"; cost = 0; block = cgIsBilling(res.status, out); code = block ? "api_spend_limit" : `http_${res.status}`; }
  else if (res && u) { const c = cgCost(t.model, iT!, oT!, cw!, cr!); if (c != null) { basis = "usage"; cost = Math.round(c * 1e6) / 1e6; } }
  else if (res) code = "no_usage";
  try { await db.rpc("nj_ai_budget_settle", { p_id: t.id, p_input: iT, p_output: oT, p_cache_write: cw, p_cache_read: cr, p_cost: cost, p_basis: basis, p_api_status: res ? res.status : null, p_error: code, p_api_block: block }); }
  catch { /* ค้าง → expire คิดเต็มยอดจอง */ }
}
// ══ จบ NJL AI COST GUARD cg-v1 ══

// ตรวจ Model ID กับ API จริงก่อนเรียกอ่าน (ฟรี ไม่คิด Token) · จำผลไว้ใน Instance
const modelChecked: Record<string, { ok: boolean; at: number }> = {};
async function modelStatus(model: string, apiKey: string, fetchFn: typeof fetch): Promise<"ok" | "missing" | "unknown"> {
  const c = modelChecked[model]; if (c && Date.now() - c.at < 6 * 3600e3) return c.ok ? "ok" : "missing";
  try { const r = await fetchFn(`https://api.anthropic.com/v1/models/${model}`, { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
    try { await r.body?.cancel(); } catch { /* ignore */ }
    if (r.status === 404) { modelChecked[model] = { ok: false, at: Date.now() }; return "missing"; }
    if (r.ok) { modelChecked[model] = { ok: true, at: Date.now() }; return "ok"; }
    return "unknown";
  } catch { return "unknown"; }
}
async function modelAvailable(model: string, apiKey: string, fetchFn: typeof fetch): Promise<boolean> { return (await modelStatus(model, apiKey, fetchFn)) !== "missing"; }

export interface Deps { db: any; env: (k: string) => string | undefined; fetch: typeof fetch; waitUntil: (p: Promise<unknown>) => void; }

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const cors = corsOf(req);
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors.h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(cors.ok ? "ok" : "forbidden", { status: cors.ok ? 200 : 403, headers: cors.h });
  if (!cors.ok) return json({ success: false, error: "origin", msg: "ไม่อนุญาตให้เรียกจากโดเมนนี้" }, 403);
  if (req.method !== "POST") return json({ success: false, error: "method" }, 405);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BYTES * 1.4 + 4096) return json({ success: false, error: "too_large", msg: "ชุดหน้า PDF ใหญ่เกิน 8 MB" }, 413);
  let body: any; try { body = await req.json(); } catch { return json({ success: false, error: "bad_json", msg: "คำขอไม่ถูกต้อง" }, 400); }
  const name = String(body?.name || "").slice(0, 200), F = name ? `ไฟล์ ${name}: ` : "";
  const db = deps.db;

  // 1) ยืนยันตัวตนที่ Server ทุกคำขอ — Session Token ของ checkdecl เท่านั้น · ไม่เชื่อ Username / Role จาก Browser
  const session = String(body?.session || "");
  const expired = () => json({ success: false, error: "unauthorized", msg: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);
  if (!TOKEN.test(session)) return expired();
  let me: any = null;
  try { const { data, error } = await db.rpc("calc_session_me", { p_token: session }); if (error) return json({ success: false, error: "auth_off", msg: "ตรวจ Session ไม่ได้ กรุณาลองใหม่" }, 503);
    me = typeof data === "string" ? JSON.parse(data) : data; }
  catch { return json({ success: false, error: "auth_off", msg: "ตรวจ Session ไม่ได้ กรุณาลองใหม่" }, 503); }
  if (!me || me.success !== true || !me.username) return expired();

  // ชุดหน้า: owned = จำนวนหน้าที่เป็นเจ้าของ · pages = จำนวนหน้าทั้งหมดใน Chunk (owned หรือ owned+1)
  const owned = Number(body?.owned), pages = Number(body?.pages);
  const shapeOk = Number.isInteger(owned) && Number.isInteger(pages) && owned >= 1 && pages <= MAX_PAGES && (pages === owned || pages === owned + 1);

  // ตรวจความพร้อม (ไม่เรียก AI) — ส่งกลับเฉพาะ true/false ไม่ส่งค่า Key
  if (body?.action === "probe") {
    const hasKey = !!deps.env("ANTHROPIC_API_KEY");
    let jobs = false;
    try { const { error } = await db.from(JOBS).select("id").like("prompt_ver", `${PROMPT_BASE}|%`).limit(1); jobs = !error; } catch { jobs = false; }
    const models: Record<string, string> = {};
    if (hasKey) for (const m of Object.keys(MODELS)) models[m] = await modelStatus(m, deps.env("ANTHROPIC_API_KEY")!, deps.fetch);
    return json({ success: true, username: me.username, role: me.role, models, default_model: DEFAULT_MODEL, prompt_ver: PROMPT_BASE, api_key: hasKey, jobs, ready: hasKey && jobs && models[DEFAULT_MODEL] !== "missing" });
  }
  if (body?.action === "budget") { const b = await cgBudget(db, me.role); return json(b.body, b.status); }   // cg-v1: ยอดสะสม / คงเหลือ — SUPER_ADMIN เท่านั้น
  const MODEL = body?.model == null || body.model === "" ? DEFAULT_MODEL : String(body.model);
  if (!MODELS[MODEL]) return json({ success: false, error: "bad_model", msg: F + "ไม่รองรับ Model นี้ (ใช้ได้เฉพาะ " + Object.keys(MODELS).join(" / ") + ")" }, 400);
  const isRc = body?.action === "recheck";
  const targets: any[] = isRc && Array.isArray(body?.targets) ? body.targets.slice(0, MAX_TARGETS + 1).map((t: any) => ({ ref: String(t?.ref || "").slice(0, 80), pg: Number(t?.pg), row: Number(t?.row),
    hint_code: String(t?.hint_code || "").replace(/[^0-9A-Za-z\-\/.]/g, "").slice(0, 30), hint_desc: String(t?.hint_desc || "").replace(/["\\\n\r]/g, " ").slice(0, 40), fields: (Array.isArray(t?.fields) ? t.fields : []).map((f: any) => String(f).replace(/[^a-z_]/g, "")).slice(0, 10) })) : [];
  if (isRc && (!targets.length || targets.length > MAX_TARGETS || targets.some((t) => !t.ref || !Number.isInteger(t.pg) || t.pg !== 1 || !Number.isInteger(t.row) || t.row < 1) || !(Number.isInteger(pages) && pages >= 1 && pages <= 2)))
    return json({ success: false, error: "bad_targets", msg: F + "รายการตรวจซ้ำไม่ถูกต้อง" }, 400);
  if (!isRc && body?.action !== "job_status" && !shapeOk) return json({ success: false, error: "bad_chunk", msg: F + "รูปแบบชุดหน้าไม่ถูกต้อง" }, 400);
  const PV = isRc ? `${RC_BASE}|${(await sha256Hex(new TextEncoder().encode(JSON.stringify(targets)))).slice(0, 16)}|n${pages}` : promptVer(owned, pages);

  // Polling: อ่านสถานะอย่างเดียว · ไม่รับ PDF · ไม่เรียก Claude · เปิดได้เฉพาะงานของโหมดนี้
  if (body?.action === "job_status") { const id = String(body?.job_id || ""); if (!UUID.test(id)) return json({ success: false, pending: false, error: "bad_job", msg: "รหัสงานไม่ถูกต้อง" }, 400);
    const { data: row, error } = await db.from(JOBS).select("*").eq("id", id).like("prompt_ver", `${MODE}%`).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) return json({ success: false, pending: false, error: "jobs_off", msg: "อ่านสถานะงานไม่ได้ กรุณาลองใหม่" }, 503);
    if (!row) return json({ success: false, pending: false, error: "job_not_found", msg: "ไม่พบงานนี้ หรือหมดอายุแล้ว กรุณากด EXPORT ใหม่" }, 404);
    return json(jobView(await staleFix(db, row))); }

  // 2) ตรวจไฟล์: .pdf + application/pdf + ลายเซ็น %PDF + ขนาด + SHA-256 ตรงกับที่หน้าเว็บคำนวณ (Idempotency Key)
  if (!/\.pdf$/i.test(name) || String(body?.mime || "") !== "application/pdf") return json({ success: false, error: "not_pdf", msg: F + "รับเฉพาะไฟล์ .pdf" }, 415);
  const b64 = String(body?.pdf || ""); if (!b64) return json({ success: false, error: "no_file", msg: F + "ไม่มีข้อมูลไฟล์" }, 400);
  if (b64.length > MAX_BYTES * 1.4) return json({ success: false, error: "too_large", msg: F + "ชุดหน้า PDF ใหญ่เกิน 8 MB" }, 413);
  let bytes: Uint8Array; try { bytes = b64ToBytes(b64); } catch { return json({ success: false, error: "bad_file", msg: F + "ข้อมูลไฟล์เสียหาย" }, 400); }
  if (bytes.length > MAX_BYTES) return json({ success: false, error: "too_large", msg: F + "ชุดหน้า PDF ใหญ่เกิน 8 MB" }, 413);
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) return json({ success: false, error: "not_pdf", msg: F + "เนื้อไฟล์ไม่ใช่ PDF" }, 415);
  const fileHash = await sha256Hex(bytes);
  const idem = String(body?.idempotency_key || "");
  if (idem && idem !== fileHash) return json({ success: false, error: "hash_mismatch", msg: F + "ไฟล์เสียหายระหว่างส่ง (SHA-256 ไม่ตรง) กรุณาลองใหม่" }, 400);

  const apiKey = deps.env("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ success: false, error: "no_api_key", msg: "ไม่สามารถเชื่อมต่อระบบ AI ได้ (ยังไม่ได้ตั้งค่า API Key ที่ Server)" }, 503);

  const key = { file_hash: fileHash, model: MODEL, prompt_ver: PV }, nowIso = () => new Date().toISOString();
  const jobsOff = () => json({ success: false, error: "jobs_off", msg: F + "ระบบงานเบื้องหลังไม่พร้อม — ยังไม่ได้ส่งให้ AI กรุณาลองใหม่" }, 503);
  // (1) Cache กลาง: ผลสำเร็จที่ยังไม่หมดอายุ → ไม่เรียก Claude · ค่า API = 0
  { const { data: hit, error } = await db.from(JOBS).select("*").match(key).eq("status", "success").gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return jobsOff();
    if (hit) { if (!validAny(hit.result, PV)) return json({ success: false, pending: false, error: "cache_bad", msg: F + "ผล Cache ไม่สมบูรณ์ — ไม่นำมาใช้ (ติดต่อ Super Admin)" }, 409);
      await db.from(JOBS).update({ hit_count: Number(hit.hit_count || 0) + 1, last_used_at: nowIso() }).eq("id", hit.id);
      return json({ success: true, pending: false, cached: true, cache_scope: "organization", job_id: hit.id, model: hit.usage?.model ?? MODEL, prompt_ver: PV, file_hash: fileHash, expires_at: hit.expires_at, result: hit.result,
        usage: { input_tokens: 0, output_tokens: 0, cost_usd_est: 0, attempts: 0, cached: true } }); } }
  // (2) งานเดียวกันกำลังทำ → คืน job_id เดิม · ไม่เรียก Claude ซ้ำ
  const active = async () => { const { data } = await db.from(JOBS).select("*").match(key).in("status", ["pending", "running"]).gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return null; const r = await staleFix(db, data); return r.status === "pending" || r.status === "running" ? r : null; };
  const accepted = (r: any, reused: boolean) => json({ success: true, pending: true, reused, job_id: r.id, status: r.status, poll_after_ms: POLL_MS, file_hash: fileHash }, 202);
  { const a = await active(); if (a) return accepted(a, true); }
  { const gate = await cgGate(db); if (gate) return json(gate.body, gate.status); }   // cg-v1: ถึงวงเงิน = 402 · ระบบงบไม่พร้อม = 503 · ไม่สร้างงาน ไม่เรียก Claude
  // (3) สร้างงานใหม่ (Unique Index nj_ai_jobs_active_uq กันงานซ้ำแบบ Atomic) → ตอบ 202 แล้วอ่านเบื้องหลัง
  const { data: job, error: insErr } = await db.from(JOBS).insert({ ...key, status: "pending" }).select("id,status").single();
  if (insErr || !job) { if ((insErr as any)?.code === "23505") { const a = await active(); if (a) return accepted(a, true); } return jobsOff(); }
  deps.waitUntil(processJob(db, job.id, b64, bytes.length, apiKey, deps.fetch, owned, pages, MODEL, isRc ? targets : null, String(me.username)));
  return accepted(job, false);
}

// ผลที่ใช้ได้: มี pages ครบทุกหน้าของ Chunk (1..pages ไม่ซ้ำ) · รายการทุกตัวอยู่บนหน้า owned
export function validResult(r: any, owned: number, pages: number): boolean {
  if (!r || !Array.isArray(r.invoices) || !Array.isArray(r.pages)) return false;
  const pg = r.pages.map((p: any) => p && p.pg).filter((x: any) => Number.isInteger(x));
  if (pg.length !== pages || new Set(pg).size !== pages || pg.some((x: number) => x < 1 || x > pages)) return false;
  return r.invoices.every((iv: any) => iv && Array.isArray(iv.items) && iv.items.every((it: any) => it && Number.isInteger(it.pg) && it.pg >= 1 && it.pg <= owned));
}
// ตรวจผลตามชนิดงานจาก prompt_ver: อ่านหลัก = o<owned>of<pages> · ตรวจซ้ำ = answers
export function validRc(r: any): boolean { return !!r && Array.isArray(r.answers) && r.answers.every((a: any) => a && typeof a.ref === "string" && typeof a.found === "boolean"); }
export function validAny(r: any, pv: string): boolean {
  if (String(pv).startsWith(RC_BASE)) return validRc(r);
  const m = /\|o(\d+)of(\d+)$/.exec(String(pv)); return !!m && validResult(r, +m[1], +m[2]);
}
function jobView(r: any): any {
  if (r.status === "pending" || r.status === "running") return { success: true, pending: true, job_id: r.id, status: r.status, poll_after_ms: POLL_MS };
  if (r.status === "success") { if (!validAny(r.result, r.prompt_ver)) return { success: false, pending: false, job_id: r.id, error: "cache_bad", msg: "ผลอ่านไม่สมบูรณ์ — ไม่นำมาใช้ กรุณาลองใหม่" };
    return { success: true, pending: false, cached: false, job_id: r.id, model: r.usage?.model ?? r.model, prompt_ver: r.prompt_ver, file_hash: r.file_hash, expires_at: r.expires_at, result: r.result, usage: r.usage || {} }; }
  return { success: false, pending: false, job_id: r.id, error: r.error_code || "error", msg: r.error_message || "อ่าน PDF ไม่สำเร็จ", usage: r.usage || null };
}
async function staleFix(db: any, r: any): Promise<any> {
  const now = Date.now(), run = r.status === "running" && now - Date.parse(r.started_at || r.created_at) > STALE_RUN_MS, pend = r.status === "pending" && now - Date.parse(r.created_at) > STALE_PEND_MS;
  if (!run && !pend) return r;
  const patch = { status: "error", error_code: "stale_job", error_message: "งานอ่าน PDF หยุดก่อนเสร็จ กรุณากด EXPORT ใหม่", result: null, finished_at: new Date().toISOString() };
  await db.from(JOBS).update(patch).eq("id", r.id).eq("status", r.status); return { ...r, ...patch };
}
// อ่าน PDF เบื้องหลัง: ตรวจ Model → เรียก Claude 1 ครั้ง (ลองซ้ำเฉพาะ 429 หนึ่งครั้ง) · ผลไม่ครบ = error และ result = NULL (ไม่เป็น Cache)
export async function processJob(db: any, jobId: string, b64: string, nBytes: number, apiKey: string, fetchFn: typeof fetch, owned: number, pages: number, MODEL: string, targets: any[] | null, who = ""): Promise<void> {
  const PRICE = MODELS[MODEL], TL = targets ? RC_TOOL : TOOL;
  const fin = async (patch: Record<string, unknown>) => { try { await db.from(JOBS).update({ ...patch, finished_at: new Date().toISOString() }).eq("id", jobId); } catch { /* ignore */ } };
  const fail = (code: string, msg: string, usage: unknown = null) => fin({ status: "error", error_code: code, error_message: msg.slice(0, 500), usage, result: null });
  let cgT: CgTicket | null = null, cgDone = false;   // cg-v1: ตั๋วจองงบของคำขอนี้
  const cgEnd = async (r: Response | null, o: any) => { if (cgT && !cgDone) { cgDone = true; await cgSettle(db, cgT, r, o); } };
  try {
    await db.from(JOBS).update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    if (!(await modelAvailable(MODEL, apiKey, fetchFn))) return await fail("model_unavailable", `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${MODEL} ไม่พร้อมใช้งานกับบัญชีนี้)`);
    const reqBody = { model: MODEL, max_tokens: MAX_OUT, output_config: { effort: EFFORT }, tools: [TL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: targets ? rcPromptOf(pages, targets) : promptOf(owned, pages) }] }] };
    const payload = JSON.stringify(reqBody);
    const cg = await cgReserve(db, apiKey, fetchFn, { fn: "nj-invoice-ai-ele", kind: targets ? "recheck" : "read", model: MODEL, req: reqBody, who, jobId });   // cg-v1: จองงบก่อนเรียก Claude — ไม่ผ่าน = ไม่เรียก
    if (!cg.ok) return await fail(cg.code, cg.msg);
    cgT = cg.t;
    const t0 = Date.now(); let res: Response | null = null, netErr = "", attempts = 0;
    for (let i = 0; i < 2; i++) {
      attempts++; const ac = new AbortController(), left = TIMEOUT_MS - (Date.now() - t0); if (left < 5000) break; const tm = setTimeout(() => ac.abort(), left);
      try { res = await fetchFn("https://api.anthropic.com/v1/messages", { method: "POST", signal: ac.signal, headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: payload }); netErr = ""; }
      catch (e) { res = null; netErr = (e as Error)?.name === "AbortError" ? "timeout" : "network"; }
      finally { clearTimeout(tm); }
      if (!res || res.status !== 429) break;
      if (cgIsBilling(429, await res.clone().json().catch(() => null))) break;   // cg-v1: 429 จากวงเงิน/เครดิต = ไม่ลองซ้ำ
      if (i === 0) { try { await res.body?.cancel(); } catch { /* ignore */ } await sleep(Math.min(10_000, Math.max(1500, Number(res.headers.get("retry-after") || 2) * 1000))); }
    }
    const ms = Date.now() - t0;
    if (!res) { await cgEnd(null, null); return await fail(netErr || "network", netErr === "timeout" ? "AI ใช้เวลานานเกินกำหนด กรุณาลองใหม่" : "ไม่สามารถเชื่อมต่อระบบ AI ได้", { attempts, ms }); }   // cg-v1: ไม่ทราบผล = คิดเต็มยอดจอง
    let out: any = null; try { out = await res.json(); } catch { /* ignore */ }
    await cgEnd(res, out);   // cg-v1: บันทึก Token / ค่าใช้จ่ายจริง แล้วปรับยอดจอง
    if (!res.ok && cgIsBilling(res.status, out)) return await fail("cost_stop", CG_STOP_MSG, { ms, api_status: res.status });   // cg-v1: Anthropic แจ้งเกินวงเงิน → หยุดทั้งเดือน
    if (!res.ok) { const st = res.status;   // ไม่ส่งข้อความ Error ดิบของ API ให้ผู้ใช้
      const msg = st === 401 || st === 403 ? "ไม่สามารถเชื่อมต่อระบบ AI ได้ (สิทธิ์ API ที่ Server)" : st === 429 ? "ระบบ AI มีผู้ใช้งานมาก กรุณาลองใหม่ภายหลัง" : st === 413 ? "ไฟล์ใหญ่เกินที่ระบบ AI รับได้" : st === 404 ? `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${MODEL})` : `ระบบ AI ตอบผิดพลาด (${st}) กรุณาลองใหม่`;
      return await fail(st === 429 ? "rate_limit" : st === 401 || st === 403 ? "api_key" : st === 404 ? "model_unavailable" : "api_error", msg, { attempts, ms, api_status: st }); }
    const u = out?.usage || {}, inTok = Number(u.input_tokens || 0) + Number(u.cache_creation_input_tokens || 0) + Number(u.cache_read_input_tokens || 0), outTok = Number(u.output_tokens || 0);
    const cost = (inTok * PRICE.in + outTok * PRICE.out) / 1e6;
    const usage = { input_tokens: inTok, output_tokens: outTok, cost_usd_est: cost, stop_reason: out?.stop_reason ?? null, model: out?.model ?? MODEL, effort: EFFORT, attempts, ms };
    console.log(JSON.stringify({ fn: "nj-invoice-ai-ele", kind: targets ? "recheck" : "read", job: jobId, model: usage.model, cost_usd: Number(cost.toFixed(6)), bytes: nBytes, pages, owned, in: inTok, out: outTok, stop: out?.stop_reason, ms, attempts }));
    if (out?.stop_reason === "max_tokens") return await fail("truncated", "ผลอ่านไม่ครบ: รายการมากเกินไปสำหรับ 1 คำขอ", usage);
    const tool = (out?.content || []).find((c: any) => c.type === "tool_use" && c.name === TL.name);
    if (out?.model && !String(out.model).startsWith(MODEL)) return await fail("model", "รุ่น AI ที่ตอบไม่ตรงกับที่กำหนด", usage);
    if (targets) {   // ตรวจซ้ำ: ต้องตอบครบทุก ref ที่ขอ
      if (!tool || !validRc(tool.input)) return await fail("no_result", "AI ไม่ได้ส่งผลตรวจซ้ำแบบมีโครงสร้าง", usage);
      const got = new Set(tool.input.answers.map((a: any) => a.ref)); const lost = targets.filter((t) => !got.has(t.ref)).length;
      if (lost) return await fail("incomplete", `ผลตรวจซ้ำไม่ครบ (ขาด ${lost} รายการ)`, usage);
      return await fin({ status: "success", result: normalizeRc(tool.input), usage, error_code: null, error_message: null });
    }
    if (!tool || !Array.isArray(tool.input?.invoices) || !Array.isArray(tool.input?.pages)) return await fail("no_result", "AI ไม่ได้ส่งผลแบบมีโครงสร้าง กรุณาลองใหม่", usage);
    const r = tool.input, miss: string[] = [];
    if (r.complete !== true) miss.push("AI แจ้งว่าอ่านไม่ครบทุกหน้า/ทุกรายการ");
    if (!validResult(r, owned, pages)) miss.push(`รายการหน้าไม่ครบ ${pages} หน้า หรือมีรายการบนหน้าบริบท`);
    if (miss.length) return await fail("incomplete", "ผลอ่านไม่ครบ — ไม่นำผลบางส่วนมาใช้ (" + miss.slice(0, 5).join(" · ") + ")", usage);
    await fin({ status: "success", result: normalize(r), usage, error_code: null, error_message: null });
  } catch (_e) { await cgEnd(null, null); await fail("internal", "เกิดข้อผิดพลาดระหว่างอ่าน PDF กรุณาลองใหม่"); }
}

// ── Entry (Supabase Edge Runtime) ──
if (!(globalThis as any).__NJ_ELE_TEST__) {   // ทดสอบในเครื่องตั้งค่านี้เพื่อไม่ให้เปิด Server
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  Deno.serve((req: Request) => handle(req, { db, env: (k) => Deno.env.get(k), fetch: globalThis.fetch.bind(globalThis),
    waitUntil: (p) => { const ER = (globalThis as any).EdgeRuntime; if (ER?.waitUntil) ER.waitUntil(p); else p.catch(() => {}); } }));
}
