// MAPPING EXPORT NJ local309 (เริ่ม local305) — nj-invoice-ai-shell (THE SHELL · อ่าน INVOICE PDF ด้วย Claude · Background Job + Polling · Cache กลางองค์กร 3 วัน)
// cg-v1 (17/11/2026): + NJL AI COST GUARD — ตรวจ/จองงบแบบ Atomic ก่อนเรียก Claude ทุกครั้ง · ปรับยอดจริงหลังตอบ · ระบบงบล้มเหลว = หยุด (Fail-Closed) · ต้องรัน SQL RUN-AI-COST-01 ก่อน Deploy
// แยกจาก nj-invoice-ai (KDC / PDF→Excel) และ nj-invoice-ai-tx (TEXAS DB12) ทั้งหมด: Prompt / Tool Schema / prompt_ver / mapping_ver / Cache Key ของตัวเอง
// ใช้ร่วม: ANTHROPIC_API_KEY (Supabase Secrets) · เครดิตองค์กร · ตาราง nj_ai_jobs (ไม่แก้โครงสร้าง) · cron nj_ai_jobs_purge (ลบงานหมดอายุ)
// Cache Key = file_hash + model + prompt_ver โดย prompt_ver ของโหมดนี้ = "the-shell|<prompt>|<mapping>|<schema>" → ไม่ชนโหมดอื่น
// ยืนยันตัวตน (ทุก Request ที่ Server): (ก) Session Token จาก RPC nj_shell_login → ตรวจด้วย RPC nj_shell_auth (service_role)
//                                     (ข) ผู้ใช้ที่ Login ผ่าน Supabase Auth → ตรวจ JWT ด้วย auth.getUser แล้วเช็กสิทธิ์ใน nj_shell_users (local307)
// ตาราง nj_ai_jobs เก็บเฉพาะ: file_hash / model / prompt_ver / สถานะ / ผลที่ตรวจผ่านแล้ว / usage (ตัวเลข) / error — ไม่เก็บ PDF, Base64, ชื่อไฟล์, Key, Session, Username
// ไม่ Log เนื้อหาไฟล์ / Base64 / Key / Session / ผลอ่าน · ไม่ส่ง Raw API Error ให้ผู้ใช้
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const MODE = "the-shell";
export const MODEL = "claude-sonnet-5-5";                  // กำหนดโดยผู้ใช้ — ตรวจกับ /v1/models ก่อนเรียกจริง
export const PROMPT_REV = "p2", MAPPING_VER = "m1", SCHEMA_VER = "s1";
export const PROMPT_VER = `${MODE}|${PROMPT_REV}|${MAPPING_VER}|${SCHEMA_VER}`;
const PRICE = { in: 2, out: 10 };                          // USD ต่อ 1M tokens (Sonnet 5.5 ตามหน้า Pricing ทางการ ณ 2026-11 — ชุดเดียวกับ nj-invoice-ai)
const MAX_BYTES = 8 * 1024 * 1024, MAX_OUT = 32000, TIMEOUT_MS = 360_000, EFFORT = "medium";
const POLL_MS = 2500, STALE_RUN_MS = 7 * 60_000, STALE_PEND_MS = 2 * 60_000, JOBS = "nj_ai_jobs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, TOKEN = /^[0-9a-f]{64}$/;
const ORIGINS = [/^https:\/\/(www\.)?njl-logistic\.com$/, /^https:\/\/jamrat2522\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/, /^null$/];
const corsOf = (req: Request) => { const o = req.headers.get("origin") || ""; const ok = ORIGINS.some((r) => r.test(o));
  return { ok, h: { ...(ok ? { "Access-Control-Allow-Origin": o } : {}), "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } as Record<string, string> }; };

// Strict Tool: ช่องข้อความเป็น string ล้วน ("" = ไม่มีพิมพ์ / อ่านไม่ชัด → Server แปลงเป็น null)
const S = (d: string) => ({ type: "string", description: d + ' — empty string "" if not printed or not clearly legible' });
export const TOOL = {
  name: "submit_shell_invoices",
  description: "Return every product line item of every invoice in the PDF, in printed order.",
  strict: true,
  input_schema: {
    type: "object", additionalProperties: false,
    properties: {
      invoices: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        invoice_no: S("Invoice number exactly as printed (e.g. the Pro-forma Invoice Number), keep leading zeros"),
        invoice_label: S("the printed label next to the invoice number, e.g. Pro-forma Invoice Number"),
        date: S("Invoice Date as YYYY-MM-DD (read the printed day/month order from the document's own date format)"),
        date_text: S("Invoice Date exactly as printed"),
        currency: S("3-letter currency of the invoice amounts"),
        delivery_refs: { type: "array", items: { type: "string" }, description: "every Delivery / Delivery Note / Outbound Delivery / Shipment / Order reference number printed on the invoice, exactly as printed" },
        total_amount: S("invoice grand total amount, digits and decimal point only"),
        total_pkg: S("total number of packages printed, digits only"), pkg_unit: S("package unit printed for the total packages, e.g. CAR, PAIL, DRUM, PAL"),
        nw: S("total net weight, digits and decimal point only"), gw: S("total gross weight, digits and decimal point only"), weight_uom: S("unit of the total weights, e.g. KG"),
        printed_pages_total: { type: ["integer", "null"], description: "N from a printed 'Page x of N' if any" },
        printed_pages_seen: { type: "array", items: { type: "integer" }, description: "every printed page number x that you actually saw" },
        items: { type: "array", items: { type: "object", additionalProperties: false, properties: {
          pg: { type: "integer", description: "1-based page of the PDF file where this item row starts" },
          item_no: S("item number exactly as printed, keep leading zeros, e.g. 000001"),
          product_code: S("material / product code exactly as printed, keep - / . and leading zeros"),
          desc: S("product description exactly as printed; join a description that wraps onto following lines with one space; do not translate or rename"),
          qty1: S("first printed quantity of the item, digits and decimal point only"), uom1: S("unit of qty1 exactly as printed, e.g. CAR"),
          qty2: S("second printed quantity of the same item if printed (e.g. the weight in KG), digits and decimal point only"), uom2: S("unit of qty2 exactly as printed, e.g. KG"),
          price: S("unit price with all printed decimals, digits and decimal point only"), price_ccy: S("currency of the unit price"),
          price_per: S("price basis quantity, e.g. 100 for 'USD / 100 KG', 1 for 'USD / EA'"), price_uom: S("price basis unit, e.g. KG in 'USD / 100 KG'"),
          amount: S("line amount of this item with all printed decimals, digits and decimal point only"),
          nw: S("item net weight if printed"), gw: S("item gross weight if printed"),
          note: S("why a field is empty or uncertain; empty string when everything is clear"),
        }, required: ["pg", "item_no", "product_code", "desc", "qty1", "uom1", "qty2", "uom2", "price", "price_ccy", "price_per", "price_uom", "amount", "nw", "gw", "note"] } },
      }, required: ["invoice_no", "invoice_label", "date", "date_text", "currency", "delivery_refs", "total_amount", "total_pkg", "pkg_unit", "nw", "gw", "weight_uom", "printed_pages_total", "printed_pages_seen", "items"] } },
      complete: { type: "boolean", description: "true only if every page and every item row was read" },
      remarks: S("anything the user must check; empty string if none"),
    },
    required: ["invoices", "complete", "remarks"],
  },
};
export const PROMPT = `You are transcribing a Shell lubricants commercial / pro-forma INVOICE PDF (text PDF or scan) into structured data. The PDF is the only source of truth.
Rules:
- Read EVERY page in order, and every product item row top to bottom. A table may continue on the next page without a header.
- One PDF usually contains SEVERAL invoices. Each invoice starts with a summary page (Pro-forma Invoice Number, Date, "Total Amount (Excl VAT)") followed by its "Supplementary" page(s) with the item rows; "Page x / N" restarts for each invoice. Return every invoice separately, in the order they appear.
- NUMBER FORMAT differs between invoices. Decide it per invoice from the printed numbers: quantities and weights are printed with exactly 3 decimals and money with exactly 2 decimals. So "39,000 CAR" means 39.000 and "12.795,99" means 12795.99 (comma = decimal sign), while "1,920.000 CAR" means 1920.000 and "29,328.22" means 29328.22 (dot = decimal sign). Always RETURN numbers with "." as the decimal sign, no thousands separators, and every printed decimal kept (39.000, 12795.99).
- total_amount is the "Total Amount (Excl VAT)" in the invoice currency (the USD line), never the THB line. Dates are printed DD.MM.YYYY.
- delivery_refs: the "Delivery Number" printed above the items (number only, without any date after "/") and the "Order Number".
- Item layout: the item row has item number, description, quantity + unit, price ("385,63 USD / 100 KG") and amount. A second quantity line in KG may follow (qty2/uom2). The next line prints "<net weight> KG <gross weight> KG <product code>": return them as the item's nw, gw (KG) and product_code. The "Net Price" line repeats the amount and is NOT an item.
- One printed product item = one item. Two items with the same description or product code stay two items. Never merge, never sort, never skip, never invent rows.
- NOT items: table headers, page headers/footers, "Net Price" / net value lines, "Tax Analysis" / tax summary lines, sub-totals, carried-forward lines and the invoice total. Do not count them twice.
- For each item return the printed quantities with their units separately (e.g. qty1 400 uom1 CAR, qty2 8294.400 uom2 KG). Do not convert units.
- Unit price: copy the number, currency and the price basis separately (e.g. "321.58 USD / 100 KG" → price 321.58, price_ccy USD, price_per 100, price_uom KG). Do not recompute any amount.
- Copy characters exactly. Keep leading zeros, "-", "/", "." and meaningful spaces in codes and descriptions. Do not fix, translate, normalise or round. Numbers are returned without thousands separators.
- If a character or value is not clearly legible, return "" for that field and explain in "note". Never guess.
- Invoice-level values (invoice number, date, currency, delivery references, totals, packages, weights) are returned once per invoice.
Return the result only through the submit_shell_invoices tool.`;

const INV_S = ["invoice_no", "invoice_label", "date", "date_text", "currency", "total_amount", "total_pkg", "pkg_unit", "nw", "gw", "weight_uom"];
const ITEM_S = ["item_no", "product_code", "desc", "qty1", "uom1", "qty2", "uom2", "price", "price_ccy", "price_per", "price_uom", "amount", "nw", "gw", "note"];
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
let modelChecked: { ok: boolean; at: number } | null = null;
async function modelAvailable(apiKey: string, fetchFn: typeof fetch): Promise<boolean> {
  if (modelChecked && modelChecked.ok && Date.now() - modelChecked.at < 6 * 3600e3) return true;
  try { const r = await fetchFn(`https://api.anthropic.com/v1/models/${MODEL}`, { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
    try { await r.body?.cancel(); } catch { /* ignore */ }
    if (r.status === 404) { modelChecked = { ok: false, at: Date.now() }; return false; }
    modelChecked = { ok: true, at: Date.now() }; return true;     // 200 หรือ error ชั่วคราว → ให้การเรียกจริงตัดสิน
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
  const authOff = () => json({ success: false, error: "auth_off", msg: "ระบบ Session ของ THE SHELL ยังไม่พร้อม (RUN-01)" }, 503);
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
      if (!u || u.active !== true) return json({ success: false, error: "forbidden", msg: "ผู้ใช้ไม่มีสิทธิ์ใช้งาน THE SHELL" }, 403);
      me = { username: u.username, role: u.role, can_shell: u.can_shell }; }
    catch { return expired(); }
  } else return expired();
  if (!me?.username) return expired();
  if (me.can_shell !== true) return json({ success: false, error: "forbidden", msg: "ผู้ใช้ไม่มีสิทธิ์ใช้งาน THE SHELL" }, 403);

  // ตรวจความพร้อม (ไม่เรียก AI)
  // local309: ตรวจเพิ่มว่า Server มี ANTHROPIC_API_KEY และเข้าถึงตาราง nj_ai_jobs ได้จริง (อ่านอย่างเดียว 1 แถว) — ส่งกลับเฉพาะ true/false ไม่ส่งค่า Key
  if (body?.action === "probe") {
    const hasKey = !!deps.env("ANTHROPIC_API_KEY");
    let jobs = false;
    try { const { error } = await db.from(JOBS).select("id").eq("prompt_ver", PROMPT_VER).limit(1); jobs = !error; } catch { jobs = false; }
    return json({ success: true, username: me.username, role: me.role, model: MODEL, prompt_ver: PROMPT_VER, api_key: hasKey, jobs, ready: hasKey && jobs });
  }
  if (body?.action === "budget") { const b = await cgBudget(db, me.role); return json(b.body, b.status); }   // cg-v1: ยอดสะสม / คงเหลือ — SUPER_ADMIN เท่านั้น

  // Polling: อ่านสถานะอย่างเดียว · ไม่รับ PDF · ไม่เรียก Claude · เปิดได้เฉพาะงานของโหมดนี้
  if (body?.action === "job_status") { const id = String(body?.job_id || ""); if (!UUID.test(id)) return json({ success: false, pending: false, error: "bad_job", msg: "รหัสงานไม่ถูกต้อง" }, 400);
    const { data: row, error } = await db.from(JOBS).select("*").eq("id", id).eq("prompt_ver", PROMPT_VER).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) return json({ success: false, pending: false, error: "jobs_off", msg: "อ่านสถานะงานไม่ได้ กรุณาลองใหม่" }, 503);
    if (!row) return json({ success: false, pending: false, error: "job_not_found", msg: "ไม่พบงานนี้ หรือหมดอายุแล้ว กรุณากดตรวจสอบใหม่" }, 404);
    return json(jobView(await staleFix(db, row))); }

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

  const key = { file_hash: fileHash, model: MODEL, prompt_ver: PROMPT_VER }, nowIso = () => new Date().toISOString();
  const jobsOff = () => json({ success: false, error: "jobs_off", msg: F + "ระบบงานเบื้องหลังไม่พร้อม — ยังไม่ได้ส่งให้ AI กรุณาลองใหม่" }, 503);
  // (1) Cache กลาง: ผลสำเร็จที่ยังไม่หมดอายุ → ไม่เรียก Claude · ค่า API = 0 · ไม่ต่ออายุ
  { const { data: hit, error } = await db.from(JOBS).select("*").match(key).eq("status", "success").gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return jobsOff();
    if (hit) { if (!validResult(hit.result)) return json({ success: false, pending: false, error: "cache_bad", msg: F + "ผล Cache ไม่สมบูรณ์ — ไม่นำมาใช้ (ติดต่อ Super Admin)" }, 409);
      await db.from(JOBS).update({ hit_count: Number(hit.hit_count || 0) + 1, last_used_at: nowIso() }).eq("id", hit.id);
      return json({ success: true, pending: false, cached: true, cache_scope: "organization", job_id: hit.id, model: hit.usage?.model ?? MODEL, prompt_ver: PROMPT_VER, file_hash: fileHash, expires_at: hit.expires_at, result: hit.result,
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
  deps.waitUntil(processJob(db, job.id, b64, bytes.length, apiKey, deps.fetch, String(me.username)));
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
export async function processJob(db: any, jobId: string, b64: string, nBytes: number, apiKey: string, fetchFn: typeof fetch, who = ""): Promise<void> {
  const fin = async (patch: Record<string, unknown>) => { try { await db.from(JOBS).update({ ...patch, finished_at: new Date().toISOString() }).eq("id", jobId); } catch { /* ignore */ } };
  const fail = (code: string, msg: string, usage: unknown = null) => fin({ status: "error", error_code: code, error_message: msg.slice(0, 500), usage, result: null });
  let cgT: CgTicket | null = null, cgDone = false;   // cg-v1: ตั๋วจองงบของคำขอนี้
  const cgEnd = async (r: Response | null, o: any) => { if (cgT && !cgDone) { cgDone = true; await cgSettle(db, cgT, r, o); } };
  try {
    await db.from(JOBS).update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    if (!(await modelAvailable(apiKey, fetchFn))) return await fail("model_unavailable", `ไม่สามารถเชื่อมต่อระบบ AI ได้ (Model ${MODEL} ไม่พร้อมใช้งานกับบัญชีนี้)`);
    const reqBody = { model: MODEL, max_tokens: MAX_OUT, output_config: { effort: EFFORT }, tools: [TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: PROMPT }] }] };
    const payload = JSON.stringify(reqBody);
    const cg = await cgReserve(db, apiKey, fetchFn, { fn: "nj-invoice-ai-shell", kind: "read", model: MODEL, req: reqBody, who, jobId });   // cg-v1: จองงบก่อนเรียก Claude — ไม่ผ่าน = ไม่เรียก
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
    console.log(JSON.stringify({ fn: "nj-invoice-ai-shell", job: jobId, model: usage.model, cost_usd: Number(cost.toFixed(6)), bytes: nBytes, in: inTok, out: outTok, stop: out?.stop_reason, ms, attempts }));
    if (out?.stop_reason === "max_tokens") return await fail("truncated", "ผลอ่านไม่ครบ: รายการมากเกินไปสำหรับ 1 คำขอ — กรุณาแยกไฟล์", usage);
    const tool = (out?.content || []).find((c: any) => c.type === "tool_use" && c.name === TOOL.name);
    if (!tool || !Array.isArray(tool.input?.invoices)) return await fail("no_result", "AI ไม่ได้ส่งผลแบบมีโครงสร้าง กรุณาลองใหม่", usage);
    if (out?.model && !String(out.model).startsWith(MODEL)) return await fail("model", "รุ่น AI ที่ตอบไม่ตรงกับที่กำหนด", usage);
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

// ── Entry (Supabase Edge Runtime) ──
if (!(globalThis as any).__NJ_SHELL_TEST__) {   // ทดสอบในเครื่องตั้งค่านี้เพื่อไม่ให้เปิด Server
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  Deno.serve((req: Request) => handle(req, { db, env: (k) => Deno.env.get(k), fetch: globalThis.fetch.bind(globalThis),
    waitUntil: (p) => { const ER = (globalThis as any).EdgeRuntime; if (ER?.waitUntil) ER.waitUntil(p); else p.catch(() => {}); } }));
}
