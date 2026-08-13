// ============================================================
// Supabase Edge Function: njhr-doc-pdf
// ประตูเดียวสำหรับ Final PDF ของเอกสาร HR (bucket private "njhr-doc-pdf")
//
// หลักการ (แนวเดียวกับ njhr-emp-file ที่ใช้อยู่แล้ว):
//   · เบราว์เซอร์ไม่มีสิทธิ์แตะ Storage โดยตรง (bucket private · ไม่มี policy ให้ anon)
//   · ทุกคำขอต้องแนบ njhr token จริง → ส่งไปให้ RPC ตรวจสิทธิ์ที่ฐานข้อมูล
//   · service_role key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ไม่เคยส่งออกไปที่เบราว์เซอร์
//
// action:
//   generate  → สร้าง Final PDF (idempotent · READY แล้วไม่สร้างซ้ำ)
//   download  → ออก Signed URL อายุสั้นให้ดาวน์โหลด
//
// Flow ของ generate:
//   njhr_doc_pdf_claim  (ล็อกแถว · ตรวจสิทธิ์ · คืน Snapshot)
//     → สร้าง PDF → SHA-256 ของ bytes จริง → upload (x-upsert: false)
//     → njhr_doc_pdf_commit   (เขียนได้ครั้งเดียว)
//   ล้มเหลวขั้นใดก็ตาม → njhr_doc_pdf_fail (สถานะเป็น FAILED เห็นได้เสมอ · retry ได้)
//
// Deploy:  supabase functions deploy njhr-doc-pdf
// ต้องมีไฟล์ fonts/Prompt-Regular.ttf และ fonts/Prompt-Bold.ttf ก่อน (ดู fonts/README.md)
// ============================================================

import { buildFinalPdf, Snapshot } from "./pdf.ts";
import { buildWht50Pdf, Wht50Snapshot } from "./wht50.ts";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "njhr-doc-pdf";
const SIGN_TTL = 60;                      // วินาที — เท่ากับ njhr-emp-file
const MAX_BYTES = 20 * 1024 * 1024;       // ต้องไม่เกิน file_size_limit ของ bucket

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** เรียก RPC ด้วย service_role — การตรวจสิทธิ์ทั้งหมดทำในฐานข้อมูลจาก p_token */
async function rpc(fn: string, body: Record<string, unknown>) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  if (!r.ok) {
    let msg = txt;
    try { msg = JSON.parse(txt).message || txt; } catch { /* ใช้ข้อความดิบ */ }
    throw Object.assign(new Error(msg), { status: r.status === 404 ? 404 : 403 });
  }
  return txt ? JSON.parse(txt) : null;
}

/** SHA-256 ของ bytes จริง → hex ตัวเล็ก 64 ตัว (ตรงกับที่ RPC commit ตรวจ) */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- ฟอนต์: TH Sarabun New — โหลดครั้งเดียวต่อ instance ----------
   ห้าม hardcode ชื่อไฟล์ → สแกนโฟลเดอร์ fonts/ จริงตอน runtime แล้วเลือกเอง
   ห้าม fallback ไปฟอนต์อื่น (Prompt / Loma / Helvetica) เด็ดขาด
   หาไม่ครบ = หยุดและแจ้งรายชื่อไฟล์ที่พบจริง เพื่อให้แก้ได้ตรงจุด            */
let FONTS: { reg: Uint8Array; bold: Uint8Array; regName: string; boldName: string } | null = null;

async function loadFonts() {
  if (FONTS) return FONTS;
  const dir = new URL("./fonts/", import.meta.url);

  const names: string[] = [];
  try {
    for await (const e of Deno.readDir(dir)) {
      if (e.isFile && e.name.toLowerCase().endsWith(".ttf")) names.push(e.name);
    }
  } catch {
    throw Object.assign(
      new Error("ไม่พบโฟลเดอร์ fonts/ ของ Edge Function"),
      { status: 500 },
    );
  }

  const lower = (s: string) => s.toLowerCase();
  const isItalic = (s: string) => /italic|oblique/.test(lower(s));
  const isBold = (s: string) => /bold/.test(lower(s));

  const boldName = names.find((n) => isBold(n) && !isItalic(n));
  const regName = names.find((n) => !isBold(n) && !isItalic(n));

  /* ขาดตัวไหนต้องบอกชื่อไฟล์ตัวนั้น — ห้าม fallback ไปฟอนต์ละติน
     เพราะข้อความไทยจะกลายเป็นช่องว่างทั้งฉบับโดยไม่มีใครรู้ */
  if (!regName || !boldName) {
    const want: string[] = [];
    if (!regName) want.push("Prompt-Regular.ttf");
    if (!boldName) want.push("Prompt-Bold.ttf");
    throw Object.assign(
      new Error(
        "Missing Thai font: " + want.join(", ") + " — " +
        "ไฟล์ .ttf ที่พบจริงในโฟลเดอร์ fonts/: " +
        (names.length ? names.join(", ") : "(ไม่มีเลย)") + " · " +
        "ต้องวางไฟล์ฟอนต์ไทยที่มีสิทธิ์ใช้งานก่อน Deploy (ดู fonts/README.md) · " +
        "ระบบจะไม่สลับไปใช้ฟอนต์อื่นแทนโดยอัตโนมัติ",
      ),
      { status: 500 },
    );
  }

  const [reg, bold] = await Promise.all([
    Deno.readFile(new URL(regName, dir)),
    Deno.readFile(new URL(boldName, dir)),
  ]);
  FONTS = { reg, bold, regName, boldName };
  return FONTS;
}

/** อัปโหลดขึ้น Storage — x-upsert: false เพื่อกันเขียนทับไฟล์เดิมเด็ดขาด */
async function upload(path: string, bytes: Uint8Array) {
  const r = await fetch(
    `${SB_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/pdf",
        "x-upsert": "false",
        "cache-control": "no-store",
      },
      body: bytes,
    },
  );
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ (${r.status}): ${t.slice(0, 200)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let p: Record<string, string>;
  try {
    p = await req.json();
  } catch {
    return json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, 400);
  }

  const token = String(p.token || "");
  const docId = String(p.document_id || "");
  if (!token) return json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);
  if (!docId) return json({ error: "ไม่ได้ระบุเอกสาร" }, 400);

  // ---------- ขอ URL ดาวน์โหลด ----------
  if (p.action === "download") {
    try {
      const rows = await rpc("njhr_doc_pdf_access", { p_token: token, p_id: docId });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.storage_path) return json({ error: "ไม่พบไฟล์" }, 404);

      const s = await fetch(
        `${SB_URL}/storage/v1/object/sign/${BUCKET}/${encodeURI(row.storage_path)}`,
        {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: SIGN_TTL }),
        },
      );
      if (!s.ok) return json({ error: "ออกลิงก์ไฟล์ไม่สำเร็จ" }, 500);
      const d = await s.json();
      const dl = `&download=${encodeURIComponent(row.file_name)}`;
      return json({
        url: `${SB_URL}/storage/v1${d.signedURL}${dl}`,
        file_name: row.file_name,
        mime_type: row.mime_type,
        expires_in: SIGN_TTL,
      });
    } catch (e) {
      const st = (e as { status?: number }).status ?? 403;
      return json({ error: (e as Error).message || "ดำเนินการไม่สำเร็จ" }, st);
    }
  }

  // ---------- สร้าง Final PDF ----------
  if (p.action === "generate") {
    let claimed = false;
    try {
      // 1) จองสิทธิ์สร้าง — DB เป็นผู้ตรวจสิทธิ์และล็อกแถวกันสร้างซ้อน
      const rows = await rpc("njhr_doc_pdf_claim", { p_token: token, p_id: docId });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) return json({ error: "จองสิทธิ์สร้างไฟล์ไม่สำเร็จ" }, 500);

      // สร้างไว้แล้ว = ไม่สร้างซ้ำ ไม่เขียนทับ (Idempotent)
      if (row.already_ready === true) {
        return json({ ok: true, already_ready: true, status: "READY" });
      }
      claimed = true;

      const snap = row.data as Snapshot;
      /* 50 ทวิ ไม่มีการรับทราบ/ลงนาม จึงไม่มี ack — ตรวจเงื่อนไขแยกจากเอกสารทั่วไป */
      const isWht50 = String(snap?.doc?.doc_type ?? "") === "WHT50";
      if (!snap?.doc || !snap?.storage_path || (!isWht50 && !snap?.ack)) {
        throw new Error("ข้อมูลเอกสารไม่ครบสำหรับสร้าง PDF");
      }
      if (isWht50 && !(snap as any).wht50) {
        throw new Error("ไม่พบ Snapshot ของ 50 ทวิ (njhr_wht50) จาก Claim");
      }

      // 2) สร้าง PDF จาก Snapshot ล้วน
      //    WHT50 ใช้ Renderer เฉพาะ · เอกสารประเภทอื่นใช้ Renderer เดิม 100%
      const fonts = await loadFonts();
      const bytes = isWht50
        ? await buildWht50Pdf((snap as any).wht50 as Wht50Snapshot, fonts.reg, fonts.bold)
        : await buildFinalPdf(snap, fonts.reg, fonts.bold);
      if (!bytes?.length) throw new Error("สร้างไฟล์ PDF ไม่สำเร็จ (ไฟล์ว่าง)");
      if (bytes.length > MAX_BYTES) {
        throw new Error(`ไฟล์ใหญ่เกิน ${MAX_BYTES / 1024 / 1024} MB`);
      }

      // 3) SHA-256 ของ bytes จริงที่จะอัปโหลด (ไม่ใช่ของ HTML หรือ input)
      const hash = await sha256Hex(bytes);

      // 4) อัปโหลด แล้วจึงบันทึกลง DB — ลำดับนี้ทำให้ไม่มี READY ที่ไม่มีไฟล์จริง
      await upload(snap.storage_path, bytes);

      // 5) บันทึกผล (RPC ปฏิเสธเองถ้ามีไฟล์อยู่แล้ว)
      const done = await rpc("njhr_doc_pdf_commit", {
        p_token: token, p_id: docId,
        p_path: snap.storage_path, p_hash: hash, p_bytes: bytes.length,
      });
      const okRow = Array.isArray(done) ? done[0] : done;

      return json({
        ok: true, status: "READY",
        final_pdf_hash: okRow?.final_pdf_hash ?? hash,
        bytes: bytes.length,
        pages_note: "ตรวจจำนวนหน้าได้จากไฟล์ที่ดาวน์โหลด",
      });
    } catch (e) {
      const msg = (e as Error).message || "สร้าง Final PDF ไม่สำเร็จ";
      // บันทึกความล้มเหลวไว้เสมอ — ไม่มี silent failure และ retry ได้
      if (claimed) {
        try {
          await rpc("njhr_doc_pdf_fail", { p_token: token, p_id: docId, p_error: msg });
        } catch { /* ถ้าบันทึกไม่ได้ ก็ยังต้องตอบ error กลับไป */ }
      }
      const st = (e as { status?: number }).status ?? 500;
      return json({ ok: false, status: "FAILED", error: msg }, st);
    }
  }

  return json({ error: "ไม่รู้จักคำสั่งนี้" }, 400);
});
