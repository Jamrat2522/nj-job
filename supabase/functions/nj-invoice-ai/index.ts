// EDCAPL local305 — nj-invoice-ai (v8: Background Job + Polling — ตอบ 202 พร้อม job_id ทันที แล้วอ่าน PDF เบื้องหลังด้วย EdgeRuntime.waitUntil · Cache กลาง 3 วันในตาราง nj_ai_jobs · effort medium)
// cg-v1 (17/11/2026): + NJL AI COST GUARD — ตรวจ/จองงบแบบ Atomic ก่อนเรียก Claude ทุกครั้ง · ปรับยอดจริงหลังตอบ · ระบบงบล้มเหลว = หยุด (Fail-Closed) · ต้องรัน SQL RUN-AI-COST-01 ก่อน Deploy
// ตาราง nj_ai_jobs เก็บเฉพาะ: file_hash / model / prompt_ver / สถานะ / Structured Result ที่ตรวจผ่านแล้ว / usage (ตัวเลข) / error — ไม่เก็บ PDF, Base64, ชื่อไฟล์, Key, Session, Username, Prompt, Response ดิบ
// Secret: ANTHROPIC_API_KEY (อ่านจาก Deno.env เท่านั้น) · ไม่ Log เนื้อหาไฟล์ / Base64 / Key / Session / ผลอ่าน
// ยืนยันตัวตน: Session Token ของ EDCAPL (ออกโดย RPC edcapl_login) ตรวจที่ Server ผ่าน RPC edcapl_apl_auth — ไม่มี Session ที่ใช้ได้ = 401
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// รุ่นที่อนุญาต (รุ่นอื่น = 400) · ไม่ส่ง model = Haiku (รองรับหน้าเว็บรุ่นเดิม) · Server ไม่เปลี่ยนรุ่นเอง และไม่อ่านสองรุ่น
// ราคา USD ต่อ 1M tokens ตามหน้า Pricing ทางการ ณ 2026-11: Haiku 5.5 = 0.10/0.50 (Prompt ≤100K) · 0.50/2.50 (>100K) · Sonnet 5.5 = 2/10
const MODELS: Record<string, { lo: { in: number; out: number }; hi: { in: number; out: number }; tier: number }> = {
  "claude-haiku-5-5":  { lo: { in: 0.10, out: 0.50 }, hi: { in: 0.50, out: 2.50 }, tier: 100_000 },
  "claude-sonnet-5-5": { lo: { in: 2, out: 10 }, hi: { in: 2, out: 10 }, tier: Number.MAX_SAFE_INTEGER },
};
const DEFAULT_MODEL = "claude-haiku-5-5";
const PROMPT_VER = "kdc-p2";   // p2 = Strict Tool ("" แทน null) + effort medium — แยก Cache ออกจากผลรุ่นก่อน
const MAX_BYTES = 8 * 1024 * 1024, MAX_OUT = 32000, TIMEOUT_MS = 360_000;   // เพดานเวลางานเบื้องหลัง (ไม่ผูกกับ Request Idle Timeout 150 วิ อีกต่อไป)
const EFFORT = "medium", POLL_MS = 2000, STALE_RUN_MS = 7 * 60_000, STALE_PEND_MS = 2 * 60_000, JOBS = "nj_ai_jobs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGINS = [/^https:\/\/(www\.)?njl-logistic\.com$/, /^https:\/\/jamrat2522\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const corsOf = (req: Request) => { const o = req.headers.get("origin") || ""; const ok = ORIGINS.some((r) => r.test(o));
  return { ok, h: { ...(ok ? { "Access-Control-Allow-Origin": o } : {}), "Vary": "Origin", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600" } as Record<string, string> }; };

// Strict Tool จำกัดช่องแบบ Union Type (เช่น ["string","null"]) รวมไม่เกิน 16 ช่องต่อคำขอ — Schema เดิมมี 20 ช่อง จึงให้ช่องข้อความเป็น string ล้วน
// โดย "" = อ่านไม่ชัด / ไม่มีพิมพ์ แล้ว Server แปลง "" กลับเป็น null (normalize) → ชื่อ Field / Required / โครงสร้างผลลัพธ์ที่หน้าเว็บได้รับเหมือนเดิมทุกประการ
const S = (d: string) => ({ type: "string", description: d + ' — empty string "" if not printed or not clearly legible' });
const TOOL = {
  name: "submit_invoices",
  description: "Return every line item of every invoice in the PDF, in document order.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      invoices: { type: "array", items: { type: "object", additionalProperties: false, properties: {
        invoice_no: S("INVOICE NO./RECHNUNG NR exactly as printed, keep leading zeros"),
        date: S("DATE SHIPPED as YYYY-MM-DD"),
        currency: S("3-letter currency printed in the PIECE PRICE / EXT PRICE header"),
        pkg: S("TOTAL/SUMME package count"), nw: S("NET/NETTO weight"), gw: S("GROSS weight"),
        mark: S("SHIPPING MARK text"), total_amount: S("invoice grand total (GESAMTRECHNUNGSBETRAG / TOTAL INVOICE), no thousands separators"),
        printed_pages_total: { type: ["integer", "null"], description: "N from the printed PAGE/SEITE x/N" },
        printed_pages_seen: { type: "array", items: { type: "integer" }, description: "every printed page number x that you actually saw" },
        items: { type: "array", items: { type: "object", additionalProperties: false, properties: {
          pg: { type: "integer", description: "1-based page of the PDF file where this row is" },
          part: S("PART NUMBER exactly as printed, joined without spaces, keep hyphens and leading zeros, e.g. N1WB-16164-AC"),
          desc: S("DESCRIPTION"), coo: S("ORIG, 2 letters"),
          qty_text: S("PART QTY exactly as printed including leading asterisks, e.g. ****12"),
          qty: S("PART QTY digits only"), wt: S("PIECE WT with all printed decimals"), uom: S("UOM"),
          price: S("PIECE PRICE with all printed decimals"), amt: S("EXT PRICE with all printed decimals"),
          note: S("why a field is empty / uncertain; empty string when everything is clear"),
        }, required: ["pg", "part", "desc", "coo", "qty_text", "qty", "wt", "uom", "price", "amt", "note"] } },
      }, required: ["invoice_no", "date", "currency", "pkg", "nw", "gw", "mark", "total_amount", "printed_pages_total", "printed_pages_seen", "items"] } },
      complete: { type: "boolean", description: "true only if every page and every item row was read" },
      remarks: S("anything the user must check; empty string if none"),
    },
    required: ["invoices", "complete", "remarks"],
  },
};
const PROMPT = `You are transcribing a commercial invoice PDF (often a scan) into structured data. The PDF is the only source of truth.
Rules:
- Read EVERY page in order, and every item row top to bottom. One scanned sheet may contain several printed pages (several "PAGE/SEITE x/N" headers) and a table may continue on the next sheet without a header.
- One printed item row = one item. Never merge rows with the same part number, never sort, never skip, never invent rows.
- Table headers, page headers, container lists, carried-forward lines and totals are NOT items.
- Copy characters exactly. Keep leading zeros, hyphens and every printed decimal. Do not fix, normalise or round anything. Numbers are returned as strings without thousands separators.
- If a character or value is not clearly legible, return an empty string "" for that field (it is treated as unreadable) and explain in "note". Never guess.
- Isolated "0" / "000" fragments printed between rows belong to other columns and are not part of weight, price or amount.
- Invoice-level values (date, currency, packages, net/gross weight, shipping mark, grand total) are returned once per invoice.
Return the result only through the submit_invoices tool.`;

// "" / "null" จาก Strict Tool → null (ค่าที่หน้าเว็บใช้แทน "อ่านไม่ชัด" เหมือนเวอร์ชันก่อน) · ไม่แก้ไข / ไม่เดาค่าอื่นใด
const INV_S = ["invoice_no", "date", "currency", "pkg", "nw", "gw", "mark", "total_amount"], ITEM_S = ["part", "desc", "coo", "qty_text", "qty", "wt", "uom", "price", "amt", "note"];
const nz = (v: unknown) => (typeof v === "string" && (v.trim() === "" || /^null$/i.test(v.trim())) ? null : v);
function normalize(r: any): any { if (!r || !Array.isArray(r.invoices)) return r; r.remarks = nz(r.remarks);
  for (const iv of r.invoices) { if (!iv || typeof iv !== "object") continue; for (const k of INV_S) iv[k] = nz(iv[k]);
    if (Array.isArray(iv.items)) for (const it of iv.items) { if (!it || typeof it !== "object") continue; for (const k of ITEM_S) it[k] = nz(it[k]); } }
  return r; }
function b64ToBytes(b64: string): Uint8Array { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sha256Hex(u: Uint8Array): Promise<string> { const d = await crypto.subtle.digest("SHA-256", u); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
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

Deno.serve(async (req: Request) => {
  const cors = corsOf(req);
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors.h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(cors.ok ? "ok" : "forbidden", { status: cors.ok ? 200 : 403, headers: cors.h });
  if (!cors.ok) return json({ success: false, error: "origin", msg: "ไม่อนุญาตให้เรียกจากโดเมนนี้" }, 403);
  if (req.method !== "POST") return json({ success: false, error: "method" }, 405);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BYTES * 1.4 + 4096) return json({ success: false, error: "too_large", msg: "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  let body: any; try { body = await req.json(); } catch { return json({ success: false, error: "bad_json" }, 400); }
  const name = String(body?.name || "").slice(0, 200), F = name ? `ไฟล์ ${name}: ` : "";

  // 1) ยืนยันตัวตนที่ Server — ไม่เชื่อ Username / Role จาก Browser
  const session = String(body?.session || "");
  if (!session) return json({ success: false, error: "unauthorized", msg: "ยังไม่ได้เข้าสู่ระบบ" }, 401);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: auth, error: authErr } = await db.rpc("edcapl_apl_auth", { p_session: session });
  const me = Array.isArray(auth) ? auth[0] : auth;
  if (authErr || !me?.username) return json({ success: false, error: "unauthorized", msg: "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);

  // คำสั่งสถานะ / Super Admin (ไม่เรียก AI)
  if (body?.action === "guard") return json({ success: true, guard: (await cgState(db)) ?? { on: false }, role: me.role });
  // cg-v1: วงเงินเป็นเพดานบังคับ — ไม่มีการเปิดใช้งานต่อเกินวงเงิน (ห้ามเพิ่มวงเงินอัตโนมัติ)
  if (body?.action === "override") return json({ success: false, error: "no_override", msg: "วงเงินค่า AI เป็นเพดานบังคับ ไม่สามารถเปิดใช้งานต่อเกินวงเงินได้", guard: (await cgState(db)) ?? { on: false } }, 403);
  if (body?.action === "budget") { const b = await cgBudget(db, me.role); return json(b.body, b.status); }   // cg-v1: ยอดสะสม / คงเหลือ — SUPER_ADMIN เท่านั้น

  // Polling: ตรวจ Session แล้ว (ด้านบน) → คืนสถานะ Job · ไม่รับ PDF · ไม่เรียก Claude
  if (body?.action === "job_status") { const id = String(body?.job_id || ""); if (!UUID.test(id)) return json({ success: false, pending: false, error: "bad_job", msg: "job_id ไม่ถูกต้อง" }, 400);
    const { data: row, error } = await db.from(JOBS).select("*").eq("id", id).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) return json({ success: false, pending: false, error: "jobs_off", msg: "อ่านสถานะงานไม่ได้ (ตาราง nj_ai_jobs)" }, 503);
    if (!row) return json({ success: false, pending: false, error: "job_not_found", msg: "ไม่พบงานนี้ หรือหมดอายุแล้ว กรุณาลองใหม่" }, 404);
    return json(jobView(await staleFix(db, row))); }

  // 2) ตรวจไฟล์: .pdf + application/pdf + ลายเซ็น %PDF + ขนาด
  if (!/\.pdf$/i.test(name) || String(body?.mime || "") !== "application/pdf") return json({ success: false, error: "not_pdf", msg: F + "รับเฉพาะไฟล์ .pdf (application/pdf)" }, 415);
  const b64 = String(body?.pdf || ""); if (!b64) return json({ success: false, error: "no_file", msg: F + "ไม่มีข้อมูลไฟล์" }, 400);
  if (b64.length > MAX_BYTES * 1.4) return json({ success: false, error: "too_large", msg: F + "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  let bytes: Uint8Array; try { bytes = b64ToBytes(b64); } catch { return json({ success: false, error: "bad_file", msg: F + "ข้อมูลไฟล์เสียหาย" }, 400); }
  if (bytes.length > MAX_BYTES) return json({ success: false, error: "too_large", msg: F + "ไฟล์ใหญ่เกิน 8 MB" }, 413);
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) return json({ success: false, error: "not_pdf", msg: F + "เนื้อไฟล์ไม่ใช่ PDF" }, 415);

  const MODEL = body?.model == null || body.model === "" ? DEFAULT_MODEL : String(body.model);
  if (!MODELS[MODEL]) return json({ success: false, error: "bad_model", msg: F + "ไม่รองรับ Model นี้ (ใช้ได้เฉพาะ claude-haiku-5-5 และ claude-sonnet-5-5)" }, 400);
  const PRICE = MODELS[MODEL];

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ success: false, error: "no_api_key", msg: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ใน Supabase Secrets" }, 503);

  const fileHash = await sha256Hex(bytes);

  // ── Background Job ──────────────────────────────────────────────────────────
  const key = { file_hash: fileHash, model: MODEL, prompt_ver: PROMPT_VER }, nowIso = () => new Date().toISOString();
  const jobsOff = () => json({ success: false, error: "jobs_off", msg: F + "ยังไม่ได้ติดตั้งตาราง nj_ai_jobs (RUN-02) — ยังไม่ได้ส่งให้ AI" }, 503);
  // 1) Cache กลาง (ทั้งองค์กร): ผลสำเร็จเดิมที่ยังไม่หมดอายุ → ไม่เรียก Claude · ค่า API รอบนี้ = 0 · ไม่ต่ออายุ expires_at
  { const { data: hit, error } = await db.from(JOBS).select("*").match(key).eq("status", "success").gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return jobsOff();
    if (hit && hit.result) { await db.from(JOBS).update({ hit_count: Number(hit.hit_count || 0) + 1, last_used_at: nowIso() }).eq("id", hit.id);
      return json({ success: true, pending: false, cached: true, cache_scope: "organization", model: hit.usage?.model ?? MODEL, model_requested: MODEL, prompt_ver: PROMPT_VER, file_hash: fileHash, result: hit.result,
        usage: { input_tokens: 0, output_tokens: 0, cost_usd_est: 0, attempts: 0, cached: true }, guard: (await cgState(db)) ?? { on: false } }); } }
  // 2) งานเดียวกันกำลังทำอยู่ → คืน job_id เดิม · ไม่สร้างซ้ำ · ไม่เรียก Claude ซ้ำ
  const active = async () => { const { data } = await db.from(JOBS).select("*").match(key).in("status", ["pending", "running"]).gt("expires_at", nowIso()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return null; const r = await staleFix(db, data); return r.status === "pending" || r.status === "running" ? r : null; };
  const accepted = (r: any) => json({ success: true, pending: true, job_id: r.id, status: r.status, poll_after_ms: POLL_MS }, 202);
  { const a = await active(); if (a) return accepted(a); }
  { const gate = await cgGate(db); if (gate) return json({ ...gate.body, guard: gate.g ?? { on: false } }, gate.status); }   // cg-v1: ถึงวงเงิน = 402 · ระบบงบไม่พร้อม = 503 · ไม่สร้างงาน ไม่เรียก Claude
  // 3) สร้าง Job ใหม่ → ตอบ 202 ก่อน แล้วจึงอ่าน PDF เบื้องหลัง
  const { data: job, error: insErr } = await db.from(JOBS).insert({ ...key, status: "pending" }).select("id,status").single();
  if (insErr || !job) { if ((insErr as any)?.code === "23505") { const a = await active(); if (a) return accepted(a); } return jobsOff(); }
  const task = processInvoiceJob(db, job.id, b64, bytes.length, MODEL, apiKey, String(me.username));
  const ER = (globalThis as any).EdgeRuntime; if (ER?.waitUntil) ER.waitUntil(task); else task.catch(() => {});
  return accepted(job);
});

// สถานะ Job → คำตอบให้หน้าเว็บ (ไม่มีผลบางส่วน: result ส่งเฉพาะ status = success)
function jobView(r: any): any {
  if (r.status === "pending" || r.status === "running") return { success: true, pending: true, job_id: r.id, status: r.status, poll_after_ms: POLL_MS };
  if (r.status === "success" && r.result) return { success: true, pending: false, cached: false, job_id: r.id, model: r.usage?.model ?? r.model, model_requested: r.model, prompt_ver: r.prompt_ver, file_hash: r.file_hash, result: r.result, usage: r.usage || {} };
  return { success: false, pending: false, job_id: r.id, error: r.error_code || "error", msg: r.error_message || "อ่าน PDF ไม่สำเร็จ", usage: r.usage || null };
}
// งานค้าง: running เกิน 7 นาที / pending เกิน 2 นาที → error stale_job (ไม่ถือเป็น Cache)
async function staleFix(db: any, r: any): Promise<any> {
  const now = Date.now(), run = r.status === "running" && now - Date.parse(r.started_at || r.created_at) > STALE_RUN_MS, pend = r.status === "pending" && now - Date.parse(r.created_at) > STALE_PEND_MS;
  if (!run && !pend) return r;
  const patch = { status: "error", error_code: "stale_job", error_message: "งานอ่าน PDF หยุดก่อนเสร็จ กรุณาลองใหม่", result: null, finished_at: new Date().toISOString() };
  await db.from(JOBS).update(patch).eq("id", r.id).eq("status", r.status); return { ...r, ...patch };
}
// อ่าน PDF เบื้องหลัง: เรียก Claude 1 ครั้ง (ลองซ้ำอัตโนมัติเฉพาะ HTTP 429 หนึ่งครั้ง) · ไม่เปลี่ยนรุ่น · ผลไม่ครบ = error และ result = NULL
async function processInvoiceJob(db: any, jobId: string, b64: string, nBytes: number, MODEL: string, apiKey: string, who: string): Promise<void> {
  const fin = async (patch: Record<string, unknown>) => { try { await db.from(JOBS).update({ ...patch, finished_at: new Date().toISOString() }).eq("id", jobId); } catch { /* ignore */ } };
  const fail = (code: string, msg: string, usage: unknown = null) => fin({ status: "error", error_code: code, error_message: msg.slice(0, 500), usage, result: null });
  let cgT: CgTicket | null = null, cgDone = false;   // cg-v1: ตั๋วจองงบของคำขอนี้
  const cgEnd = async (r: Response | null, o: any) => { if (cgT && !cgDone) { cgDone = true; await cgSettle(db, cgT, r, o); } };
  try {
    await db.from(JOBS).update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    const PRICE = MODELS[MODEL];
    const reqBody = { model: MODEL, max_tokens: MAX_OUT, output_config: { effort: EFFORT }, tools: [TOOL], tool_choice: { type: "auto" },
      messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: PROMPT }] }] };
    const payload = JSON.stringify(reqBody);
    const cg = await cgReserve(db, apiKey, fetch, { fn: "nj-invoice-ai", kind: "read", model: MODEL, req: reqBody, who, jobId });   // cg-v1: จองงบก่อนเรียก Claude — ไม่ผ่าน = ไม่เรียก
    if (!cg.ok) return await fail(cg.code, cg.msg);
    cgT = cg.t;
    const t0 = Date.now(); let res: Response | null = null, netErr = "", attempts = 0;
    for (let i = 0; i < 2; i++) {
      attempts++; const ac = new AbortController(), left = TIMEOUT_MS - (Date.now() - t0); if (left < 5000) break; const tm = setTimeout(() => ac.abort(), left);
      try { res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ac.signal, headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: payload }); netErr = ""; }
      catch (e) { res = null; netErr = (e as Error)?.name === "AbortError" ? "timeout" : "network"; }
      finally { clearTimeout(tm); }
      if (!res || res.status !== 429) break;                           // ลองซ้ำเฉพาะ 429 เท่านั้น
      if (cgIsBilling(429, await res.clone().json().catch(() => null))) break;   // cg-v1: 429 จากวงเงิน/เครดิต = ไม่ลองซ้ำ
      if (i === 0) { try { await res.body?.cancel(); } catch { /* ignore */ } await sleep(Math.min(10_000, Math.max(1500, Number(res.headers.get("retry-after") || 2) * 1000))); }
    }
    const ms = Date.now() - t0;
    if (!res) { await cgEnd(null, null); return await fail(netErr || "network", netErr === "timeout" ? "AI ใช้เวลานานเกินกำหนด (Timeout)" : "เชื่อมต่อ Claude API ไม่สำเร็จ", { attempts, ms }); }   // cg-v1: ไม่ทราบผล = คิดเต็มยอดจอง
    let out: any = null; try { out = await res.json(); } catch { /* ignore */ }
    await cgEnd(res, out);   // cg-v1: บันทึก Token / ค่าใช้จ่ายจริง แล้วปรับยอดจอง
    if (!res.ok && cgIsBilling(res.status, out)) return await fail("cost_stop", CG_STOP_MSG, { ms, api_status: res.status });   // cg-v1: Anthropic แจ้งเกินวงเงิน → หยุดทั้งเดือน
    if (!res.ok) { const st = res.status, em = String(out?.error?.message || out?.error?.type || "").slice(0, 200);
      const msg = st === 401 || st === 403 ? "API Key ใช้ไม่ได้ / หมดอายุ" : st === 429 ? "ถูกจำกัดอัตราการใช้งาน (Rate Limit) — ลองใหม่ภายหลัง" : st === 413 ? "ไฟล์ใหญ่เกินที่ API รับได้" : `Claude API ตอบ ${st}` + (em ? `: ${em}` : "");
      return await fail(st === 429 ? "rate_limit" : st === 401 || st === 403 ? "api_key" : "api_error", msg, { attempts, ms, api_status: st }); }
    const u = out?.usage || {}, inTok = Number(u.input_tokens || 0) + Number(u.cache_creation_input_tokens || 0) + Number(u.cache_read_input_tokens || 0), outTok = Number(u.output_tokens || 0);
    const p = inTok > PRICE.tier ? PRICE.hi : PRICE.lo, cost = (inTok * p.in + outTok * p.out) / 1e6;
    const usage = { input_tokens: inTok, output_tokens: outTok, cost_usd_est: cost, stop_reason: out?.stop_reason ?? null, model: out?.model ?? MODEL, effort: EFFORT, attempts, ms };
    console.log(JSON.stringify({ fn: "nj-invoice-ai", job: jobId, model: usage.model, effort: EFFORT, cost_usd: Number(cost.toFixed(6)), ok: out?.stop_reason === "tool_use", bytes: nBytes, in: inTok, out: outTok, stop: out?.stop_reason, ms, attempts }));   // Log เฉพาะตัวเลข — ไม่มีชื่อไฟล์ / เนื้อหา
    if (out?.stop_reason === "max_tokens") return await fail("truncated", "ผลอ่านไม่ครบ: คำตอบยาวเกินเพดาน Output ของรุ่น (รายการมากเกินไปสำหรับ 1 คำขอ)", usage);
    const tool = (out?.content || []).find((c: any) => c.type === "tool_use" && c.name === TOOL.name);
    if (!tool || !Array.isArray(tool.input?.invoices)) return await fail("no_result", "AI ไม่ได้ส่งผลแบบมีโครงสร้าง", usage);
    if (out?.model && !String(out.model).startsWith(MODEL)) return await fail("model", "รุ่นที่ตอบไม่ใช่ " + MODEL, usage);
    const r = tool.input, miss: string[] = [];
    if (r.complete !== true) miss.push("AI แจ้งว่าอ่านไม่ครบทุกหน้า/ทุกรายการ");
    for (const iv of r.invoices) { const N = iv?.printed_pages_total; if (!Number.isInteger(N) || N < 1) continue;
      const seen = new Set((Array.isArray(iv.printed_pages_seen) ? iv.printed_pages_seen : []).filter((x: any) => Number.isInteger(x) && x >= 1 && x <= N));
      if (seen.size < N) miss.push(`พบหน้า ${seen.size}/${N}`); }
    if (miss.length) return await fail("incomplete", "ผลอ่านไม่ครบ — ไม่นำผลบางส่วนมาใช้ (" + miss.slice(0, 5).join(" · ") + ")", usage);
    await fin({ status: "success", result: normalize(r), usage, error_code: null, error_message: null });
  } catch (_e) { await cgEnd(null, null); await fail("internal", "เกิดข้อผิดพลาดระหว่างอ่าน PDF กรุณาลองใหม่"); }
}
