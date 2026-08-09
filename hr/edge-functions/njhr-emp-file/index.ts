// ============================================================
// Supabase Edge Function: njhr-emp-file
// ประตูเดียวสำหรับเข้าถึงไฟล์ในบัคเก็ต private "njhr-emp-files"
//
// หลักการ:
//   · เบราว์เซอร์ไม่มีสิทธิ์แตะ Storage โดยตรง (bucket private ไม่มี policy ให้ anon)
//   · ทุกคำขอต้องแนบ njhr token จริง → ฟังก์ชันนี้ส่งไปให้ RPC ตรวจสิทธิ์ที่ฐานข้อมูล
//   · ผ่านแล้วจึงออก Signed URL อายุ 60 วินาที ด้วย service_role
//   · service_role key อยู่ในฝั่งเซิร์ฟเวอร์เท่านั้น ไม่เคยส่งออกไปที่เบราว์เซอร์
//
// Deploy:  supabase functions deploy njhr-emp-file
// (ค่า SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY แพลตฟอร์มใส่ให้อัตโนมัติ)
// ============================================================

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "njhr-emp-files";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB ต่อไฟล์
const SIGN_TTL = 60;               // วินาที

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
    // ---------- ขอสิทธิ์อัปโหลด ----------
    if (p.action === "upload-url") {
      const size = Number(p.size || 0);
      if (size > MAX_SIZE) {
        return json({ error: `ไฟล์ใหญ่เกิน ${MAX_SIZE / 1024 / 1024} MB` }, 413);
      }
      const rows = await rpc("njhr_empfile_upload_path", {
        p_token: token,
        p_employee: p.employee_id,
        p_category: p.category,
        p_doc_kind: p.doc_kind,
        p_file_name: p.file_name,
      });
      const path = Array.isArray(rows) ? rows[0]?.storage_path : rows?.storage_path;
      if (!path) return json({ error: "ออกเส้นทางไฟล์ไม่สำเร็จ" }, 500);

      const s = await fetch(
        `${SB_URL}/storage/v1/object/upload/sign/${BUCKET}/${encodeURI(path)}`,
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

    // ---------- ขอ URL ดู / ดาวน์โหลด ----------
    if (p.action === "download-url") {
      const rows = await rpc("njhr_empfile_access", { p_token: token, p_id: p.file_id });
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
