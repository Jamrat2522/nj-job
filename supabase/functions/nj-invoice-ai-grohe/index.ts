// MAPPING EXPORT NJ local316 — nj-invoice-ai-grohe (AUTO: Sonnet อ่านทั้งไฟล์ → Opus ตรวจซ้ำเฉพาะจุดที่ถูกฟ้อง) (GROHE SIAM · อ่าน INVOICE PDF ด้วย Claude · Background Job + Polling · Cache กลางองค์กร 3 วัน)
// cg-v1 (17/11/2026): + NJL AI COST GUARD — ตรวจ/จองงบแบบ Atomic ก่อนเรียก Claude ทุกครั้ง · ปรับยอดจริงหลังตอบ · ระบบงบล้มเหลว = หยุด (Fail-Closed) · ต้องรัน SQL RUN-AI-COST-01 ก่อน Deploy
// แยกจาก nj-invoice-ai (KDC) · nj-invoice-ai-tx (TEXAS DB12) · nj-invoice-ai-shell (THE SHELL) ทั้งหมด: Prompt / Tool Schema / prompt_ver / mapping_ver / Cache Key ของตัวเอง
// ใช้ร่วม: ANTHROPIC_API_KEY (Supabase Secrets) · เครดิตองค์กร · ตาราง nj_ai_jobs (ไม่แก้โครงสร้าง) · cron nj_ai_jobs_purge (ลบงานหมดอายุ)
// Cache Key = file_hash + model + prompt_ver โดย prompt_ver ของโหมดนี้ = "grohe|<prompt>|<mapping>|<schema>" → ไม่ชนโหมดอื่น
// ยืนยันตัวตน (ทุก Request ที่ Server): (ก) Session Token จาก RPC nj_shell_login → ตรวจด้วย RPC nj_shell_auth (service_role)
//                                     (ข) ผู้ใช้ที่ Login ผ่าน Supabase Auth → ตรวจ JWT ด้วย auth.getUser แล้วเช็กสิทธิ์ใน nj_shell_users (local307)
// ตาราง nj_ai_jobs เก็บเฉพาะ: file_hash / model / prompt_ver / สถานะ / ผลที่ตรวจผ่านแล้ว / usage (ตัวเลข) / error — ไม่เก็บ PDF, Base64, ชื่อไฟล์, Key, Session, Username
// ไม่ Log เนื้อหาไฟล์ / Base64 / Key / Session / ผลอ่าน · ไม่ส่ง Raw API Error ให้ผู้ใช้
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const MODE = "grohe";
export const MODEL = "claude-sonnet-5-5";                  // ค่าเริ่มต้น (อ่านทั้งไฟล์) — ตรวจกับ /v1/models ก่อนเรียกจริง
export const MODEL_OPUS = "claude-opus-5-5";               // ใช้ตรวจซ้ำเฉพาะจุดที่ถูกฟ้อง (local316)
export const MODELS: Record<string, string> = { sonnet: MODEL, opus: MODEL_OPUS };
export const PROMPT_REV = "p3", MAPPING_VER = "m1", SCHEMA_VER = "s1";   // local314: เพิ่ม document_no (ใช้จับคู่ Billing Document ของ XLSX)
export const PROMPT_VER = `${MODE}|${PROMPT_REV}|${MAPPING_VER}|${SCHEMA_VER}`;
export const RECHECK_VER = `${MODE}|rx1`;                  // local316: Cache ของงานตรวจซ้ำ (แยกจากงานอ่านทั้งไฟล์)
// ราคา USD ต่อ 1M tokens — ตั้งที่ Server เท่านั้น · ไม่มีราคาของรุ่นไหน = รายงานเฉพาะจำนวน Tokens (ไม่เดาค่าใช้จ่าย)
const PRICE: Record<string, { in: number; out: number } | null> = { [MODEL]: { in: 2, out: 10 }, [MODEL_OPUS]: null };
const priceOf = (m: string, env: (k: string) => string | undefined) => {
  const key = m === MODEL_OPUS ? "ANTHROPIC_PRICE_OPUS" : "ANTHROPIC_PRICE_SONNET";
  const v = env(key); if (v && /^\s*\d+(\.\d+)?\s*[,/]\s*\d+(\.\d+)?\s*$/.test(v)) { const [i, o] = v.split(/[,/]/).map((x) => parseFloat(x)); return { in: i, out: o }; }
  return PRICE[m] ?? null;
};
const MAX_BYTES = 8 * 1024 * 1024, MAX_OUT = 32000, TIMEOUT_MS = 360_000, EFFORT = "medium";
const POLL_MS = 2500, STALE_RUN_MS = 7 * 60_000, STALE_PEND_MS = 2 * 60_000, JOBS = "nj_ai_jobs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, TOKEN = /^[0-9a-f]{64}$/;
const ORIGINS = [/^https:\/\/(www\.)?njl-logistic\.com$/, /^https:\/\/jamrat2522\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^null$/];
const corsOf = (req: Request) => { const o = req.headers.get("origin") || ""; const ok = ORIGINS.some((r) => r.test(o));
  return { ok, h: { ...(ok ? { "Access-Control-Allow-Origin": o } : {}), "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } as Record<string, string> }; };

// Strict Tool: ช่องข้อความเป็น string ล้วน ("" = ไม่มีพิมพ์ / อ่านไม่ชัด → Server แปลงเป็น null)
const S = (d: string) => ({ type: "string", description: d + ' — empty string "" if not printed or not clearly legible' });
export const TOOL = {
  name: "submit_grohe_invoices",
  description: "Return every invoice and every printed product line item of the GROHE invoice PDF, in printed order.",
  strict: true,
  input_schema: {
    type: "object", additionalProperties: false,
    properties: {
      invoices: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        invoice_no: S("Invoice number exactly as printed, keep leading zeros"),
        document_no: S("the number printed under the label 'Document no.' (or 'Document number') of this invoice, exactly as printed"),
        date: S("Invoice date as YYYY-MM-DD (read the printed day/month order from the document's own date format)"),
        date_text: S("Invoice date exactly as printed"),
        currency: S("3-letter currency of the invoice amounts"),
        total_amount: S("invoice total amount, digits and decimal point only"),
        delivery_refs: { type: "array", items: { type: "string" }, description: "every Delivery note / Delivery / Shipment / Billing document reference printed for this invoice, exactly as printed" },
        printed_pages_total: { type: ["integer", "null"], description: "N from a printed 'Page x of N' if any" },
        printed_pages_seen: { type: "array", items: { type: "integer" }, description: "every printed page number x that you actually saw for this invoice" },
        items: { type: "array", items: { type: "object", additionalProperties: false, properties: {
          pg: { type: "integer", description: "1-based page of the PDF file where this item row starts" },
          item_no: S("line/position number exactly as printed"),
          product: S("article / material / product number exactly as printed, keep leading zeros and letters"),
          desc: S("product description exactly as printed; join a description that wraps onto following lines with one space"),
          qty: S("quantity of the item, digits and decimal point only"), uom: S("unit of the quantity exactly as printed, e.g. PCS"),
          unit_price: S("unit price exactly as printed, digits and decimal point only"),
          amount: S("line amount exactly as printed, digits and decimal point only"),
          coo: S("country of origin printed for this item, 2-letter code if printed"),
          delivery_ref: S("delivery note / packing reference printed for this item, if any"),
          note: S("why a field is empty or uncertain; empty string when everything is clear"),
        }, required: ["pg", "item_no", "product", "desc", "qty", "uom", "unit_price", "amount", "coo", "delivery_ref", "note"] } },
      }, required: ["invoice_no", "document_no", "date", "date_text", "currency", "total_amount", "delivery_refs", "printed_pages_total", "printed_pages_seen", "items"] } },
      complete: { type: "boolean", description: "true only if every page and every item row was read" },
      remarks: S("anything the user must check; empty string if none"),
    },
    required: ["invoices", "complete", "remarks"],
  },
};
export const PROMPT = `You are transcribing a GROHE commercial INVOICE PDF (scanned pages) into structured data. The PDF is the only source of truth.
Rules:
- Read EVERY page in order, and every product line item top to bottom. A table may continue on the next page without a header.
- One PDF may contain SEVERAL invoices. Return every invoice separately, in the order they appear.
- A PACKING LIST / delivery note / weight list page is NOT a sales item list: never return its lines as invoice items, and never repeat an item that was already returned from the invoice pages. Use those pages only to read delivery / packing reference numbers.
- Items come only from the invoice's own item table (position / article / description / quantity / unit price / amount).
- NOT items: table headers, page headers and footers, subtotals, carried-forward lines, freight / charge lines without an article number, tax lines and the invoice total.
- Copy characters exactly. Keep leading zeros and letters in article / product numbers. Do not translate, rename, fix or round anything.
- Numbers: return them with "." as the decimal sign and no thousands separators, keeping every printed decimal. Decide the printed number format per invoice from the printed values.
- Return quantity, unit price and amount of each item separately, exactly as printed. Do not recompute any amount.
- If a character or value is not clearly legible, return "" for that field and explain in "note". Never guess.
- The invoice header table prints "Document no.", "Customer no." and "Head office" side by side: return the value under "Document no." in document_no — it is NOT the invoice number.
- Invoice-level values (invoice number, document number, date, currency, total, delivery references) are returned once per invoice.
Return the result only through the submit_grohe_invoices tool.`;

// local316: ตรวจซ้ำเฉพาะจุด — ส่งเฉพาะหน้าที่มีปัญหา + รายการคำถาม · ตอบเฉพาะค่าที่อ่านได้จริงจากภาพ
export const RECHECK_TOOL = {
  name: "submit_grohe_recheck",
  description: "Re-read only the asked fields of the asked line items from the attached invoice pages.",
  strict: true,
  input_schema: {
    type: "object", additionalProperties: false,
    properties: {
      answers: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        id: S("the id of the question you are answering, copied exactly"),
        product: S("article / product number of that line, exactly as printed"),
        qty: S("quantity of that line, digits and decimal point only"),
        amount: S("line amount of that line, digits and decimal point only"),
        desc: S("product description of that line, exactly as printed"),
        legible: { type: "boolean", description: "true only if you could read the asked fields clearly on the page" },
        note: S("what is unclear, or why a field is empty"),
      }, required: ["id", "product", "qty", "amount", "desc", "legible", "note"] } },
      missing_items: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        pg: { type: "integer", description: "1-based page of the attached file" },
        item_no: S("line/position number exactly as printed"), product: S("article / product number exactly as printed"),
        desc: S("product description exactly as printed"), qty: S("quantity, digits and decimal point only"),
        unit_price: S("unit price, digits and decimal point only"), amount: S("line amount, digits and decimal point only"),
        coo: S("country of origin printed for this item"),
      }, required: ["pg", "item_no", "product", "desc", "qty", "unit_price", "amount", "coo"] } },
      remarks: S("anything the user must check; empty string if none"),
    },
    required: ["answers", "missing_items", "remarks"],
  },
};
export const RECHECK_PROMPT = `The attached pages are part of a GROHE invoice PDF. Another reader already transcribed them and some values are in doubt.
For EVERY question in the list below, find that exact line item on the attached pages and read the asked fields again from the image.
Rules:
- Answer each question with its id, copied exactly.
- Read only from the attached pages. Copy characters exactly, keep leading zeros and letters. Do not translate, round or recompute anything.
- Numbers use "." as the decimal sign and no thousands separators.
- Set legible = true only when you can actually read the asked fields on the page; otherwise set legible = false, return "" for what you cannot read and explain in note.
- Never guess a value to make it match anything. An empty string is the correct answer when the print is not clear.
- If a question says the item list may be incomplete, also return in missing_items every printed product line of those pages that is NOT in the question list, in printed order.
Questions:
`;

const INV_S = ["invoice_no", "document_no", "date", "date_text", "currency", "total_amount"];
const ITEM_S = ["item_no", "product", "desc", "qty", "uom", "unit_price", "amount", "coo", "delivery_ref", "note"];
const nz = (v: unknown) => (typeof v === "string" && (v.trim() === "" || /^null$/i.test(v.trim())) ? null : v);
export function normalize(r: any): any { if (!r || !Array.isArray(r.invoices)) return r; r.remarks = nz(r.remarks);
  for (const iv of r.invoices) { if (!iv || typeof iv !== "object") continue; for (const k of INV_S) iv[k] = nz(iv[k]);
    iv.delivery_refs = (Array.isArray(iv.delivery_refs) ? iv.delivery_refs : []).map((x: unknown) => String(x ?? "").trim()).filter(Boolean);
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
async function modelAvailable(apiKey: string, fetchFn: typeof fetch, model = MODEL): Promise<boolean> {
  const c = modelChecked[model];
  if (c && c.ok && Date.now() - c.at < 6 * 3600e3) return true;
  try { const r = await fetchFn(`https://api.anthropic.com/v1/models/${model}`, { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
    try { await r.body?.cancel(); } catch { /* ignore */ }
    if (r.status === 404) { modelChecked[model] = { ok: false, at: Date.now() }; return false; }
    modelChecked[model] = { ok: true, at: Date.now() }; return true;     // 200 หรือ error ชั่วคราว → ให้การเรียกจริงตัดสิน
  } catch { return true; }
}

export interface Deps { db: any; env: (k: string) => string | undefined; fetch: typeof fetch; waitUntil: (p: Promise<unknown>) => void; }

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const cors = corsOf(req);
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors.h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(cors.ok ? "ok" : "forbidden", { status: cors.ok ? 200 : 403, headers: cors.h });
  if (!cors.ok) return json({ success: false, error: "origin", msg: "ไม่อนุญาตให้เรียกจากโดเมนนี้" }, 403);
  if (req.method !== "POST") return json({ success: false, error: "method" }, 405);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BYTES * 1.4 + 4096) return json({ success: false, error: "too_large", msg: "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  let body: any; try { body = await req.json(); } catch { return json({ success: false, error: "bad_json", msg: "คำขอไม่ถูกต้อง" }, 400); }
  const name = String(body?.name || "").slice(0, 200), F = name ? `ไฟล์ ${name}: ` : "";
  const db = deps.db;

  // 1) ยืนยันตัวตนที่ Server ทุกคำขอ — ไม่เชื่อ Username / Role จาก Browser
  const session = String(body?.session || ""), jwt = String(body?.access_token || "");
  const expired = () => json({ success: false, error: "unauthorized", msg: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);
  const authOff = () => json({ success: false, error: "auth_off", msg: "ระบบ Session ของ GROHE SIAM ยังไม่พร้อม (RUN-01)" }, 503);
  let me: any = null;
  if (TOKEN.test(session)) {
    try { const { data, error } = await db.rpc("nj_shell_auth", { p_session: session }); if (error) return authOff(); me = Array.isArray(data) ? data[0] : data; }
    catch { return authOff(); }
  } else if (jwt && jwt.length < 4096 && jwt.split(".").length === 3) {
    // Supabase Auth: Server ยืนยัน JWT เอง (ลายเซ็น/วันหมดอายุ) → username = ส่วนหน้า @ ของ Email โดเมน @nj.co เท่านั้น
    try { const { data, error } = await db.auth.getUser(jwt); const email = String(data?.user?.email || "").toLowerCase();
      if (error || !/^[a-z0-9._-]+@nj\.co$/.test(email)) return expired();
      const { data: u, error: ue } = await db.from("nj_shell_users").select("username,role,can_shell,active").eq("username", email.split("@")[0]).maybeSingle();
      if (ue) return authOff();
      if (!u || u.active !== true) return json({ success: false, error: "forbidden", msg: "ผู้ใช้ไม่มีสิทธิ์ใช้งาน GROHE SIAM" }, 403);
      me = { username: u.username, role: u.role, can_shell: u.can_shell }; }
    catch { return expired(); }
  } else return expired();
  if (!me?.username) return expired();
  if (me.can_shell !== true) return json({ success: false, error: "forbidden", msg: "ผู้ใช้ไม่มีสิทธิ์ใช้งาน GROHE SIAM" }, 403);

  // ตรวจความพร้อม (ไม่เรียก AI)
  // local309: ตรวจเพิ่มว่า Server มี ANTHROPIC_API_KEY และเข้าถึงตาราง nj_ai_jobs ได้จริง (อ่านอย่างเดียว 1 แถว) — ส่งกลับเฉพาะ true/false ไม่ส่งค่า Key
  if (body?.action === "probe") {
    const hasKey = !!deps.env("ANTHROPIC_API_KEY");
    let jobs = false;
    try { const { error } = await db.from(JOBS).select("id").eq("prompt_ver", PROMPT_VER).limit(1); jobs = !error; } catch { jobs = false; }
    return json({ success: true, username: me.username, role: me.role, model: MODEL, prompt_ver: PROMPT_VER, api_key: hasKey, jobs, ready: hasKey && jobs });
  }
  if (body?.action === "budget") { const b = await cgBudget(db, me.role); return json(b.body, b.status); }   // cg-v1: ยอดสะสม / คงเหลือ — SUPER_ADMIN เท่านั้น

  // local316: เลือกรุ่น AI จากฝั่ง Server เท่านั้น (รับได้เฉพาะ sonnet / opus) — ไม่เปลี่ยนรุ่นเองเงียบ ๆ
  const want = String(body?.model || "sonnet").toLowerCase();
  const useModel = MODELS[want];
  if (!useModel) return json({ success: false, error: "bad_model", msg: "รุ่น AI ที่ขอไม่อยู่ในรายการที่อนุญาต" }, 400);

  // Polling: อ่านสถานะอย่างเดียว · ไม่รับ PDF · ไม่เรียก Claude · เปิดได้เฉพาะงานของโหมดนี้
  if (body?.action === "job_status") { const id = String(body?.job_id || ""); if (!UUID.test(id)) return json({ success: false, pending: false, error: "bad_job", msg: "รหัสงานไม่ถูกต้อง" }, 400);
    const { data: row, error } = await db.from(JOBS).select("*").eq("id", id).eq("prompt_ver", PROMPT_VER).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) return json({ success: false, pending: false, error: "jobs_off", msg: "อ่านสถานะงานไม่ได้ กรุณาลองใหม่" }, 503);
    if (!row) return json({ success: false, pending: false, error: "job_not_found", msg: "ไม่พบงานนี้ หรือหมดอายุแล้ว กรุณากดตรวจสอบใหม่" }, 404);
    return json(jobView(await staleFix(db, row))); }

  // local316: ตรวจซ้ำเฉพาะจุด (Opus) — รับเฉพาะหน้าที่มีปัญหา + คำถาม · Cache ด้วย SHA ของหน้า + คำถาม (กดซ้ำไม่คิดเงินซ้ำ)
  if (body?.action === "recheck") {
    const qs = Array.isArray(body?.questions) ? body.questions.slice(0, 200) : [];
    if (!qs.length) return json({ success: false, error: "no_questions", msg: "ไม่มีรายการให้ตรวจซ้ำ" }, 400);
    const b64r = String(body?.pdf || "");
    if (!b64r || b64r.length > MAX_BYTES * 1.4) return json({ success: false, error: "bad_file", msg: "ข้อมูลหน้าที่ส่งมาตรวจซ้ำไม่ถูกต้อง" }, 400);
    let rb: Uint8Array; try { rb = b64ToBytes(b64r); } catch { return json({ success: false, error: "bad_file", msg: "ข้อมูลไฟล์เสียหาย" }, 400); }
    if (!(rb[0] === 0x25 && rb[1] === 0x50 && rb[2] === 0x44 && rb[3] === 0x46)) return json({ success: false, error: "not_pdf", msg: "เนื้อไฟล์ไม่ใช่ PDF" }, 415);
    const apiKeyR = deps.env("ANTHROPIC_API_KEY");
    if (!apiKeyR) return json({ success: false, error: "no_api_key", msg: "ไม่สามารถเชื่อมต่อระบบ AI ได้ (ยังไม่ได้ตั้งค่า API Key ที่ Server)" }, 503);
    const qTxt = qs.map((q: any, i: number) => `${i + 1}) id=${String(q?.id ?? "").slice(0, 60)} | page ${Number(q?.pg) || "?"} | invoice ${String(q?.invoice ?? "").slice(0, 40)} | item ${String(q?.item_no ?? "").slice(0, 20)}`
      + ` | read again: ${(Array.isArray(q?.fields) ? q.fields : []).map((f: unknown) => String(f).slice(0, 20)).join(", ") || "product, qty, amount"}`
      + ` | transcribed as: product=${String(q?.product ?? "")} qty=${String(q?.qty ?? "")} amount=${String(q?.amount ?? "")}`
      + (q?.why ? ` | why: ${String(q.why).slice(0, 160)}` : "")).join("\n")
      + (body?.scan_missing ? "\nThe item list of these pages may be incomplete: also return every printed product line that is not listed above in missing_items." : "");
    const qHash = await sha256Hex(new TextEncoder().encode(qTxt));
    const fileHashR = (await sha256Hex(rb)) + "#" + qHash.slice(0, 16);
    const keyR = { file_hash: fileHashR, model: useModel, prompt_ver: RECHECK_VER }, nowR = () => new Date().toISOString();
    { const { data: hit } = await db.from(JOBS).select("*").match(keyR).eq("status", "success").gt("expires_at", nowR()).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (hit && hit.result) { await db.from(JOBS).update({ hit_count: Number(hit.hit_count || 0) + 1, last_used_at: nowR() }).eq("id", hit.id);
        return json({ success: true, pending: false, cached: true, job_id: hit.id, model: useModel, result: hit.result, usage: { input_tokens: 0, output_tokens: 0, cost_usd_est: 0, cached: true, model: useModel } }); } }
    { const { data } = await db.from(JOBS).select("*").match(keyR).in("status", ["pending", "running"]).gt("expires_at", nowR()).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) { const r = await staleFix(db, data); if (r.status === "pending" || r.status === "running") return json({ success: true, pending: true, reused: true, job_id: r.id, status: r.status, poll_after_ms: POLL_MS }, 202); } }
    { const gate = await cgGate(db); if (gate) return json(gate.body, gate.status); }   // cg-v1: ถึงวงเงิน = 402 · ระบบงบไม่พร้อม = 503 · ไม่สร้างงาน ไม่เรียก Claude
    const { data: jobR, error: insR } = await db.from(JOBS).insert({ ...keyR, status: "pending" }).select("id,status").single();
    if (insR || !jobR) { if ((insR as any)?.code === "23505") { const { data } = await db.from(JOBS).select("*").match(keyR).in("status", ["pending", "running"]).limit(1).maybeSingle();
        if (data) return json({ success: true, pending: true, reused: true, job_id: data.id, status: data.status, poll_after_ms: POLL_MS }, 202); }
      return json({ success: false, error: "jobs_off", msg: "ระบบงานเบื้องหลังไม่พร้อม — ยังไม่ได้ส่งให้ AI กรุณาลองใหม่" }, 503); }
    deps.waitUntil(processRecheck(db, jobR.id, b64r, rb.length, qTxt, apiKeyR, deps.fetch, useModel, priceOf(useModel, deps.env), String(me.username)));
    return json({ success: true, pending: true, reused: false, job_id: jobR.id, status: jobR.status, poll_after_ms: POLL_MS }, 202);
  }

  // 2) ตรวจไฟล์: .pdf + application/pdf + ลายเซ็น %PDF + ขนาด + SHA-256 ตรงกับที่หน้าเว็บคำนวณ (Idempotency Key)
  if (!/\.pdf$/i.test(name) || String(body?.mime || "") !== "application/pdf") return json({ success: false, error: "not_pdf", msg: F + "รับเฉพาะไฟล์ .pdf" }, 415);
  const b64 = String(body?.pdf || ""); if (!b64) return json({ success: false, error: "no_file", msg: F + "ไม่มีข้อมูลไฟล์" }, 400);
  if (b64.length > MAX_BYTES * 1.4) return json({ success: false, error: "too_large", msg: F + "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  let bytes: Uint8Array; try { bytes = b64ToBytes(b64); } catch { return json({ success: false, error: "bad_file", msg: F + "ข้อมูลไฟล์เสียหาย" }, 400); }
  if (bytes.length > MAX_BYTES) return json({ success: false, error: "too_large", msg: F + "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) return json({ success: false, error: "not_pdf", msg: F + "เนื้อไฟล์ไม่ใช่ PDF" }, 415);
  const fileHash = await sha256Hex(bytes);
  const idem = String(body?.idempotency_key || "");
  if (idem && idem !== fileHash) return json({ success: false, error: "hash_mismatch", msg: F + "ไฟล์เสียหายระหว่างส่ง (SHA-256 ไม่ตรง) กรุณาลองใหม่" }, 400);

  const apiKey = deps.env("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ success: false, error: "no_api_key", msg: "ไม่สามารถเชื่อมต่อระบบ AI ได้ (ยังไม่ได้ตั้งค่า API Key ที่ Server)" }, 503);

  const key = { file_hash: fileHash, model: useModel, prompt_ver: PROMPT_VER }, nowIso = () => new Date().toISOString();
  const jobsOff = () => json({ success: false, error: "jobs_off", msg: F + "ระบบงานเบื้องหลังไม่พร้อม — ยังไม่ได้ส่งให้ AI กรุณาลองใหม่" }, 503);
  // (1) Cache กลาง: ผลสำเร็จที่ยังไม่หมดอายุ → ไม่เรียก Claude · ค่า API = 0 · ไม่ต่ออายุ
  { const { data: hit, error } = await db.from(JOBS).select("*").match(key).eq("status", "success").gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return jobsOff();
    if (hit) { if (!validResult(hit.result)) return json({ success: false, pending: false, error: "cache_bad", msg: F + "ผล Cache ไม่สมบูรณ์ — ไม่นำมาใช้ (ติดต่อ Super Admin)" }, 409);
      await db.from(JOBS).update({ hit_count: Number(hit.hit_count || 0) + 1, last_used_at: nowIso() }).eq("id", hit.id);
      return json({ success: true, pending: false, cached: true, cache_scope: "organization", job_id: hit.id, model: hit.usage?.model ?? useModel, prompt_ver: PROMPT_VER, file_hash: fileHash, expires_at: hit.expires_at, result: hit.result,
        usage: { input_tokens: 0, output_tokens: 0, cost_usd_est: 0, attempts: 0, cached: true } }); } }
  // (2) งานเดียวกันกำลังทำ → คืน job_id เดิม (ผู้ใช้หลายคน / กดซ้ำ / Refresh) · ไม่เรียก Claude ซ้ำ
  const active = async () => { const { data } = await db.from(JOBS).select("*").match(key).in("status", ["pending", "running"]).gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return null; const r = await staleFix(db, data); return r.status === "pending" || r.status === "running" ? r : null; };
  const accepted = (r: any, reused: boolean) => json({ success: true, pending: true, reused, job_id: r.id, status: r.status, poll_after_ms: POLL_MS, file_hash: fileHash }, 202);
  { const a = await active(); if (a) return accepted(a, true); }
  { const gate = await cgGate(db); if (gate) return json(gate.body, gate.status); }   // cg-v1: ถึงวงเงิน = 402 · ระบบงบไม่พร้อม = 503 · ไม่สร้างงาน ไม่เรียก Claude
  // (3) สร้างงานใหม่ (Unique Index nj_ai_jobs_active_uq กันงานซ้ำแบบ Atomic) → ตอบ 202 แล้วอ่านเบื้องหลัง
  const { data: job, error: insErr } = await db.from(JOBS).insert({ ...key, status: "pending" }).select("id,status").single();
  if (insErr || !job) { if ((insErr as any)?.code === "23505") { const a = await active(); if (a) return accepted(a, true); } return jobsOff(); }
  deps.waitUntil(processJob(db, job.id, b64, bytes.length, apiKey, deps.fetch, useModel, priceOf(useModel, deps.env), String(me.username)));
  return accepted(job, false);
}

function validResult(r: any): boolean { return !!r && Array.isArray(r.invoices) && r.invoices.length > 0 && r.invoices.every((iv: any) => iv && Array.isArray(iv.items)); }
function jobView(r: any): any {
  if (r.status === "pending" || r.status === "running") return { success: true, pending: true, job_id: r.id, status: r.status, poll_after_ms: POLL_MS };
  if (r.status === "success") { if (!validResult(r.result)) return { success: false, pending: false, job_id: r.id, error: "cache_bad", msg: "ผลอ่านไม่สมบูรณ์ — ไม่นำมาใช้ กรุณาลองใหม่" };
    return { success: true, pending: false, cached: false, job_id: r.id, model: r.usage?.model ?? r.model, prompt_ver: r.prompt_ver, file_hash: r.file_hash, expires_at: r.expires_at, result: r.result, usage: r.usage || {} }; }
  return { success: false, pending: false, job_id: r.id, error: r.error_code || "error", msg: r.error_message || "อ่าน PDF ไม่สำเร็จ", usage: r.usage || null };
}
async function staleFix(db: any, r: any): Promise<any> {
  const now = Date.now(), run = r.status === "running" && now - Date.parse(r.started_at || r.created_at) > STALE_RUN_MS, pend = r.status === "pending" && now - Date.parse(r.created_at) > STALE_PEND_MS;
  if (!run && !pend) return r;
  const patch = { status: "error", error_code: "stale_job", error_message: "งานอ่าน PDF หยุดก่อนเสร็จ กรุณากดลองใหม่", result: null, finished_at: new Date().toISOString() };
  await db.from(JOBS).update(patch).eq("id", r.id).eq("status", r.status); return { ...r, ...patch };
}
// อ่าน PDF เบื้องหลัง: ตรวจ Model → เรียก Claude 1 ครั้ง (ลองซ้ำเฉพาะ 429 หนึ่งครั้ง) · ผลไม่ครบ = error และ result = NULL (ไม่เป็น Cache)
export async function processJob(db: any, jobId: string, b64: string, nBytes: number, apiKey: string, fetchFn: typeof fetch, model = MODEL, price: { in: number; out: number } | null = PRICE[MODEL] ?? null, who = ""): Promise<void> {
  const fin = async (patch: Record<string, unknown>) => { try { await db.from(JOBS).update({ ...patch, finished_at: new Date().toISOString() }).eq("id", jobId); } catch { /* ignore */ } };
  const fail = (code: string, msg: string, usage: unknown = null) => fin({ status: "error", error_code: code, error_message: msg.slice(0, 500), usage, result: null });
  let cgT: CgTicket | null = null, cgDone = false;   // cg-v1: ตั๋วจองงบของคำขอนี้
  const cgEnd = async (r: Response | null, o: any) => { if (cgT && !cgDone) { cgDone = true; await cgSettle(db, cgT, r, o); } };
  try {
    await db.from(JOBS).update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    if (!(await modelAvailable(apiKey, fetchFn, model))) return await fail("model_unavailable", `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${model} ไม่พร้อมใช้งานกับบัญชีนี้)`);
    const reqBody = { model, max_tokens: MAX_OUT, output_config: { effort: EFFORT }, tools: [TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: PROMPT }] }] };
    const payload = JSON.stringify(reqBody);
    const cg = await cgReserve(db, apiKey, fetchFn, { fn: "nj-invoice-ai-grohe", kind: "read", model: model, req: reqBody, who, jobId });   // cg-v1: จองงบก่อนเรียก Claude — ไม่ผ่าน = ไม่เรียก
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
      const msg = st === 401 || st === 403 ? "ไม่สามารถเชื่อมต่อระบบ AI ได้ (สิทธิ์ API ที่ Server)" : st === 429 ? "ระบบ AI มีผู้ใช้งานมาก กรุณาลองใหม่ภายหลัง" : st === 413 ? "ไฟล์ใหญ่เกินที่ระบบ AI รับได้" : st === 404 ? `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${model})` : `ระบบ AI ตอบผิดพลาด (${st}) กรุณาลองใหม่`;
      return await fail(st === 429 ? "rate_limit" : st === 401 || st === 403 ? "api_key" : st === 404 ? "model_unavailable" : "api_error", msg, { attempts, ms, api_status: st }); }
    const u = out?.usage || {}, inTok = Number(u.input_tokens || 0) + Number(u.cache_creation_input_tokens || 0) + Number(u.cache_read_input_tokens || 0), outTok = Number(u.output_tokens || 0);
    const cost = price ? (inTok * price.in + outTok * price.out) / 1e6 : null;     // ไม่ได้ตั้งราคาของรุ่นนี้ = ไม่เดาค่าใช้จ่าย (รายงานเฉพาะ Tokens)
    const usage = { input_tokens: inTok, output_tokens: outTok, cost_usd_est: cost, priced: !!price, stop_reason: out?.stop_reason ?? null, model: out?.model ?? model, effort: EFFORT, attempts, ms };
    console.log(JSON.stringify({ fn: "nj-invoice-ai-grohe", job: jobId, model: usage.model, cost_usd: cost == null ? null : Number(cost.toFixed(6)), bytes: nBytes, in: inTok, out: outTok, stop: out?.stop_reason, ms, attempts }));
    if (out?.stop_reason === "max_tokens") return await fail("truncated", "ผลอ่านไม่ครบ: รายการมากเกินไปสำหรับ 1 คำขอ — กรุณาแยกไฟล์", usage);
    const tool = (out?.content || []).find((c: any) => c.type === "tool_use" && c.name === TOOL.name);
    if (!tool || !Array.isArray(tool.input?.invoices)) return await fail("no_result", "AI ไม่ได้ส่งผลแบบมีโครงสร้าง กรุณาลองใหม่", usage);
    if (out?.model && !String(out.model).startsWith(model)) return await fail("model", "รุ่น AI ที่ตอบไม่ตรงกับที่กำหนด", usage);
    const r = tool.input, miss: string[] = [];
    if (r.complete !== true) miss.push("AI แจ้งว่าอ่านไม่ครบทุกหน้า/ทุกรายการ");
    if (!r.invoices.length) miss.push("ไม่พบเลข Invoice");
    for (const iv of r.invoices) { if (!Array.isArray(iv?.items) || !iv.items.length) miss.push(`Invoice ${iv?.invoice_no || "?"}: ไม่พบรายการสินค้า`);
      const N = iv?.printed_pages_total; if (!Number.isInteger(N) || N < 1) continue;
      const seen = new Set((Array.isArray(iv.printed_pages_seen) ? iv.printed_pages_seen : []).filter((x: any) => Number.isInteger(x) && x >= 1 && x <= N));
      if (seen.size < N) miss.push(`Invoice ${iv?.invoice_no || "?"}: พบหน้า ${seen.size}/${N}`); }
    if (miss.length) return await fail("incomplete", "ผลอ่านไม่ครบ — ไม่นำผลบางส่วนมาใช้ (" + miss.slice(0, 5).join(" · ") + ")", usage);
    await fin({ status: "success", result: normalize(r), usage, error_code: null, error_message: null });
  } catch (_e) { await cgEnd(null, null); await fail("internal", "เกิดข้อผิดพลาดระหว่างอ่าน PDF กรุณาลองใหม่"); }
}

// local316: ตรวจซ้ำเฉพาะจุดด้วย Opus — ส่งเฉพาะหน้าที่เกี่ยวข้อง · ตอบเฉพาะคำถามที่ถูกถาม
export async function processRecheck(db: any, jobId: string, b64: string, nBytes: number, qTxt: string, apiKey: string, fetchFn: typeof fetch, model: string, price: { in: number; out: number } | null, who = ""): Promise<void> {
  const fin = async (patch: Record<string, unknown>) => { try { await db.from(JOBS).update({ ...patch, finished_at: new Date().toISOString() }).eq("id", jobId); } catch { /* ignore */ } };
  const fail = (code: string, msg: string, usage: unknown = null) => fin({ status: "error", error_code: code, error_message: msg.slice(0, 500), usage, result: null });
  let cgT: CgTicket | null = null, cgDone = false;   // cg-v1: ตั๋วจองงบของคำขอนี้
  const cgEnd = async (r: Response | null, o: any) => { if (cgT && !cgDone) { cgDone = true; await cgSettle(db, cgT, r, o); } };
  try {
    await db.from(JOBS).update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    if (!(await modelAvailable(apiKey, fetchFn, model))) return await fail("model_unavailable", `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${model} ไม่พร้อมใช้งานกับบัญชีนี้)`);
    const reqBody = { model, max_tokens: MAX_OUT, output_config: { effort: EFFORT }, tools: [RECHECK_TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: RECHECK_PROMPT + qTxt }] }] };
    const payload = JSON.stringify(reqBody);
    const cg = await cgReserve(db, apiKey, fetchFn, { fn: "nj-invoice-ai-grohe", kind: "recheck", model: model, req: reqBody, who, jobId });   // cg-v1: จองงบก่อนเรียก Claude — ไม่ผ่าน = ไม่เรียก
    if (!cg.ok) return await fail(cg.code, cg.msg);
    cgT = cg.t;
    const t0 = Date.now(); let res: Response | null = null, netErr = "";
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try { res = await fetchFn("https://api.anthropic.com/v1/messages", { method: "POST", signal: ac.signal, headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: payload }); }
    catch (e) { res = null; netErr = (e as Error)?.name === "AbortError" ? "timeout" : "network"; }
    finally { clearTimeout(tm); }
    const ms = Date.now() - t0;
    if (!res) { await cgEnd(null, null); return await fail(netErr || "network", netErr === "timeout" ? "AI ใช้เวลานานเกินกำหนด กรุณาลองใหม่" : "ไม่สามารถเชื่อมต่อระบบ AI ได้", { ms, model }); }   // cg-v1: ไม่ทราบผล = คิดเต็มยอดจอง
    let out: any = null; try { out = await res.json(); } catch { /* ignore */ }
    await cgEnd(res, out);   // cg-v1: บันทึก Token / ค่าใช้จ่ายจริง แล้วปรับยอดจอง
    if (!res.ok && cgIsBilling(res.status, out)) return await fail("cost_stop", CG_STOP_MSG, { ms, api_status: res.status });   // cg-v1: Anthropic แจ้งเกินวงเงิน → หยุดทั้งเดือน
    if (!res.ok) { const st = res.status;
      const msg = st === 401 || st === 403 ? "ไม่สามารถเชื่อมต่อระบบ AI ได้ (สิทธิ์ API ที่ Server)" : st === 429 ? "ระบบ AI มีผู้ใช้งานมาก กรุณาลองใหม่ภายหลัง" : st === 404 ? `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${model})` : `ระบบ AI ตอบผิดพลาด (${st}) กรุณาลองใหม่`;
      return await fail(st === 429 ? "rate_limit" : st === 401 || st === 403 ? "api_key" : st === 404 ? "model_unavailable" : "api_error", msg, { ms, api_status: st, model }); }
    const u = out?.usage || {}, inTok = Number(u.input_tokens || 0) + Number(u.cache_creation_input_tokens || 0) + Number(u.cache_read_input_tokens || 0), outTok = Number(u.output_tokens || 0);
    const cost = price ? (inTok * price.in + outTok * price.out) / 1e6 : null;
    const usage = { input_tokens: inTok, output_tokens: outTok, cost_usd_est: cost, priced: !!price, stop_reason: out?.stop_reason ?? null, model: out?.model ?? model, effort: EFFORT, ms, recheck: true };
    console.log(JSON.stringify({ fn: "nj-invoice-ai-grohe", job: jobId, mode: "recheck", model: usage.model, cost_usd: cost == null ? null : Number(cost.toFixed(6)), bytes: nBytes, in: inTok, out: outTok, ms }));
    const tool = (out?.content || []).find((c: any) => c.type === "tool_use" && c.name === RECHECK_TOOL.name);
    if (!tool || !Array.isArray(tool.input?.answers)) return await fail("no_result", "AI ไม่ได้ส่งผลแบบมีโครงสร้าง กรุณาลองใหม่", usage);
    if (out?.model && !String(out.model).startsWith(model)) return await fail("model", "รุ่น AI ที่ตอบไม่ตรงกับที่กำหนด", usage);
    const r = tool.input;
    r.answers = r.answers.map((a: any) => { const o: any = { ...a }; for (const k of ["product", "qty", "amount", "desc", "note"]) o[k] = nz(o[k]); return o; });
    r.missing_items = (Array.isArray(r.missing_items) ? r.missing_items : []).map((x: any) => { const o: any = { ...x }; for (const k of ["item_no", "product", "desc", "qty", "unit_price", "amount", "coo"]) o[k] = nz(o[k]); return o; });
    r.remarks = nz(r.remarks);
    await fin({ status: "success", result: r, usage, error_code: null, error_message: null });
  } catch (_e) { await cgEnd(null, null); await fail("internal", "เกิดข้อผิดพลาดระหว่างตรวจซ้ำ กรุณาลองใหม่"); }
}

// ── Entry (Supabase Edge Runtime) ──
if (!(globalThis as any).__NJ_GROHE_TEST__) {   // ทดสอบในเครื่องตั้งค่านี้เพื่อไม่ให้เปิด Server
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  Deno.serve((req: Request) => handle(req, { db, env: (k) => Deno.env.get(k), fetch: globalThis.fetch.bind(globalThis),
    waitUntil: (p) => { const ER = (globalThis as any).EdgeRuntime; if (ER?.waitUntil) ER.waitUntil(p); else p.catch(() => {}); } }));
}
