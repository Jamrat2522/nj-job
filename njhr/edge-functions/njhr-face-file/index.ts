// ============================================================
// Supabase Edge Function: njhr-face-file
// ประตูเดียวสำหรับรูป Snapshot การสแกนใบหน้า (bucket private "njhr-face")
//
// รูปแบบเดียวกับ njhr-emp-file ที่ใช้งานได้แล้ว
//   · bucket เป็น private ไม่มี policy ให้ anon → เบราว์เซอร์แตะ Storage ตรงไม่ได้
//   · ทุกคำขอต้องแนบ njhr token จริง → ส่งไปให้ RPC ตัดสินสิทธิ์ที่ฐานข้อมูล
//   · service_role key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ไม่เคยส่งออกไปเบราว์เซอร์
//
// Deploy:  supabase functions deploy njhr-face-file --no-verify-jwt
// (--no-verify-jwt จำเป็น เพราะระบบใช้ Auth ของตัวเอง ไม่ใช่ Supabase Auth)
// ============================================================

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "njhr-face";
const MAX_SIZE = 3 * 1024 * 1024;   // รูป Snapshot ไม่ควรเกิน 3 MB
const SIGN_TTL = 60;                // วินาที

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let p: Record<string, string | number>;
  try {
    p = await req.json();
  } catch {
    return json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, 400);
  }

  const token = String(p.token || "");
  if (!token) return json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);

  try {
    // ---------- ขอสิทธิ์อัปโหลดรูป ----------
    // size เป็น "ตัวเลือก": ถ้า Client ส่งมา (รู้ขนาดแล้ว) ยังตรวจเหมือนเดิมทุกประการ
    // ถ้าไม่ส่ง (Upload Reservation ล่วงหน้าก่อนมี Blob) จะไม่ตรวจที่นี่ — และไม่ตรวจก็ปลอดภัย
    // เพราะบัคเก็ต njhr-face ถูกบังคับที่ชั้น Storage จริงแล้ว:
    //     file_size_limit = 3 MB · allowed_mime_types = image/jpeg
    // Storage เป็นผู้ Reject การอัปโหลดจริงที่เกินขนาดหรือ MIME ผิด
    // ไม่มีการรับ size = 0 หรือ size ปลอมมาใช้หลบ Validation
    if (p.action === "upload-url") {
      if (p.size !== undefined && p.size !== null) {
        const size = Number(p.size);
        if (!Number.isFinite(size) || size < 0) {
          return json({ error: "ขนาดไฟล์ไม่ถูกต้อง" }, 400);
        }
        if (size > MAX_SIZE) {
          return json({ error: `รูปใหญ่เกิน ${MAX_SIZE / 1024 / 1024} MB` }, 413);
        }
      }
      const rows = await rpc("njhr_face_upload_path", {
        p_token: token,
        p_kind: p.kind ?? "PUNCH",
        p_action: p.punch_action ?? null,
        p_employee: p.employee_id ?? null,
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.storage_path) return json({ error: "ออกเส้นทางรูปไม่สำเร็จ" }, 500);

      const s = await fetch(
        `${SB_URL}/storage/v1/object/upload/sign/${BUCKET}/${encodeURI(row.storage_path)}`,
        {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (!s.ok) return json({ error: "ขอสิทธิ์อัปโหลดไม่สำเร็จ" }, 500);
      const d = await s.json();     // { url: "/object/upload/sign/<bucket>/<path>?token=..." }
      return json({ path: row.storage_path, upload_url: `${SB_URL}/storage/v1${d.url}` });
    }

    // ---------- ขอ URL เปิดดูรูป ----------
    if (p.action === "view-url") {
      const rows = await rpc("njhr_face_snapshot_access", { p_token: token, p_path: p.path });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.storage_path) return json({ error: "ไม่พบรูปนี้" }, 404);

      const s = await fetch(
        `${SB_URL}/storage/v1/object/sign/${BUCKET}/${encodeURI(row.storage_path)}`,
        {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: SIGN_TTL }),
        },
      );
      if (!s.ok) return json({ error: "ออกลิงก์รูปไม่สำเร็จ" }, 500);
      const d = await s.json();     // { signedURL: "/object/sign/<bucket>/<path>?token=..." }
      return json({ url: `${SB_URL}/storage/v1${d.signedURL}`, expires_in: SIGN_TTL });
    }

    return json({ error: "ไม่รู้จักคำสั่งนี้" }, 400);
  } catch (e) {
    const st = (e as { status?: number }).status ?? 403;
    return json({ error: (e as Error).message || "ดำเนินการไม่สำเร็จ" }, st);
  }
});
