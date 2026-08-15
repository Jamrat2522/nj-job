// ============================================================
// Supabase Edge Function: njhr-req-file
// ประตูเดียวสำหรับ "เปิด/ดาวน์โหลด" ไฟล์แนบใบลา + OT หลังปิด Public
//   bucket: leave-attachments · ot-attachments (เป็น private แล้วโดย SQL 104)
//
// หลักการ (ลอกแบบ njhr-emp-file ที่ใช้งานจริงอยู่แล้ว):
//   · เบราว์เซอร์ส่ง njhr token + path ของไฟล์
//   · ตรวจสิทธิ์ทั้งหมดที่ฐานข้อมูลผ่าน RPC njhr_reqfile_access
//     (เจ้าของ | HR | SUPER_ADMIN | ADMIN ใน Workflow — กติกาเดียวกับ RPC เดิม)
//   · ผ่านแล้วออก Signed URL อายุ 60 วินาที ด้วย service_role
//   · Upload ผ่าน action=upload-url — token ถูกต้องเท่านั้น จึงได้ Signed Upload URL
//     (โฟลเดอร์ผูกกับ employee_id ของเจ้าของ token — ปลอมเป็นคนอื่นไม่ได้)
//     anon ไม่มี INSERT policy อีกต่อไป อัปโหลดตรงเข้า Storage ไม่ได้
//
// Deploy:  supabase functions deploy njhr-req-file
// ============================================================

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGN_TTL = 60;               // วินาที — อายุสั้นตามข้อกำหนด
const BUCKETS = ["leave-attachments", "ot-attachments"];

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
    // ---------- ขอสิทธิ์อัปโหลด (แทน INSERT policy ของ anon ที่ถูกถอนแล้ว) ----------
    if (p.action === "upload-url") {
      const rows = await rpc("njhr_reqfile_upload_path", {
        p_token: token,
        p_kind: String(p.kind || ""),          // 'leave' | 'ot'
        p_file_name: String(p.file_name || ""),
      });
      const path = Array.isArray(rows) ? rows[0]?.storage_path : rows?.storage_path;
      if (!path) return json({ error: "ออกเส้นทางไฟล์ไม่สำเร็จ" }, 500);
      const bucket = path.startsWith("leave/") ? "leave-attachments" : "ot-attachments";

      const s = await fetch(
        `${SB_URL}/storage/v1/object/upload/sign/${bucket}/${encodeURI(path)}`,
        {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (!s.ok) return json({ error: "ขอสิทธิ์อัปโหลดไม่สำเร็จ" }, 500);
      const d = await s.json();          // { url: "/object/upload/sign/<bucket>/<path>?token=..." }
      return json({ path, upload_url: `${SB_URL}/storage/v1${d.url}` });
    }

    if (p.action === "download-url") {
      const rows = await rpc("njhr_reqfile_access", {
        p_token: token,
        p_path: String(p.path || ""),
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row?.storage_path || !BUCKETS.includes(row.bucket_id)) {
        return json({ error: "ไม่พบไฟล์" }, 404);
      }

      const s = await fetch(
        `${SB_URL}/storage/v1/object/sign/${row.bucket_id}/${encodeURI(row.storage_path)}`,
        {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: SIGN_TTL }),
        },
      );
      if (!s.ok) return json({ error: "ออกลิงก์ไฟล์ไม่สำเร็จ" }, 500);
      const d = await s.json();          // { signedURL: "/object/sign/<bucket>/<path>?token=..." }
      const dl = p.download ? `&download=${encodeURIComponent(row.file_name)}` : "";
      return json({
        url: `${SB_URL}/storage/v1${d.signedURL}${dl}`,
        file_name: row.file_name,
        mime_type: row.mime_type,
        expires_in: SIGN_TTL,
      });
    }

    return json({ error: "ไม่รู้จักคำสั่งนี้" }, 400);
  } catch (e) {
    const st = (e as { status?: number }).status ?? 403;
    return json({ error: (e as Error).message || "ดำเนินการไม่สำเร็จ" }, st);
  }
});
