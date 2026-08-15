// ============================================================
// Supabase Edge Function: njhr-push-dispatch
// ส่ง Web Push แบบ "ไม่มี payload" ให้อุปกรณ์ที่ลงทะเบียนไว้
//
// ทำไมไม่มี payload:
//   Push ที่มี body ต้องเข้ารหัส aes128gcm และเนื้อหาจะวิ่งผ่านเซิร์ฟเวอร์ของ
//   Google/Apple/Mozilla → ข้อกำหนดคือห้ามมีข้อมูลแจ้งเตือนอยู่บนเส้นทางนั้น
//   จึงส่งเป็นสัญญาณเปล่า · Service Worker แสดงข้อความกลาง
//   ผู้ใช้กดแล้วเปิดแอป → โหลดเนื้อหาจริงด้วย njhr_notify_list ของตัวเอง
//
// ใครเรียกได้:
//   ต้องแนบ njhr session token ที่ใช้ได้จริง (ตรวจด้วย njhr_ctx ผ่าน service_role)
//   ผู้เรียกไม่ได้รับข้อมูลของใครกลับไปเลย — คืนแค่จำนวน
//
// Deploy: supabase functions deploy njhr-push-dispatch --no-verify-jwt
// Secrets ที่ต้องตั้ง (Dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY   (base64url · 87 ตัวอักษร)
//   VAPID_PRIVATE_KEY  (base64url · 43 ตัวอักษร)  ← ห้ามลง GitHub เด็ดขาด
//   VAPID_SUBJECT      เช่น mailto:hr@njlogistics.co.th
// ============================================================

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUB = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hr@example.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function b64urlToBytes(s: string): Uint8Array {
  const p = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(p);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** เรียก RPC ด้วย service_role — การตรวจสิทธิ์ทั้งหมดทำในฐานข้อมูล */
async function rpc(fn: string, body: Record<string, unknown>) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
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

/** สร้าง VAPID JWT (ES256) สำหรับปลายทางหนึ่ง origin */
async function vapidAuth(audience: string): Promise<string> {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,   // อายุ 12 ชม. ตามสเปก (สูงสุด 24)
    sub: VAPID_SUB,
  })));
  const data = new TextEncoder().encode(`${header}.${payload}`);

  // private key (d) 32 ไบต์ + public key (x,y) จาก VAPID_PUBLIC_KEY (0x04 || x || y)
  const pub = b64urlToBytes(VAPID_PUB);
  if (pub.length !== 65) throw new Error("VAPID_PUBLIC_KEY ไม่ถูกต้อง (ต้องยาว 65 ไบต์)");
  const jwk: JsonWebKey = {
    kty: "EC", crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: VAPID_PRIV,
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data));
  return `${header}.${payload}.${bytesToB64url(sig)}`;   // WebCrypto คืน r||s ตรงตามที่ VAPID ต้องการ
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!VAPID_PUB || !VAPID_PRIV) return json({ error: "ยังไม่ได้ตั้งค่า VAPID" }, 500);

  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, 400); }

  const token = String(p.token ?? "");
  if (!token) return json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);

  try {
    // ต้องเป็น session ที่ใช้ได้จริง — njhr_ctx raise 28000 ถ้าไม่ผ่าน
    await rpc("njhr_ctx", { p_token: token });

    const pend = await rpc("njhr_push_pending", { p_limit: 100 }) as Array<
      { notification_id: string; endpoint: string; p256dh: string; auth: string }
    > | null;
    const rows = pend ?? [];
    if (!rows.length) return json({ sent: 0, failed: 0, marked: 0 });

    const okIds = new Set<string>();
    let failed = 0;
    const authCache = new Map<string, string>();

    for (const row of rows) {
      try {
        const origin = new URL(row.endpoint).origin;
        let jwt = authCache.get(origin);
        if (!jwt) { jwt = await vapidAuth(origin); authCache.set(origin, jwt); }

        const res = await fetch(row.endpoint, {
          method: "POST",
          headers: {
            TTL: "3600",
            Authorization: `vapid t=${jwt}, k=${VAPID_PUB}`,
            "Content-Length": "0",          // no-payload push
          },
        });

        if (res.status === 404 || res.status === 410) {
          await rpc("njhr_push_disable", { p_endpoint: row.endpoint }).catch(() => {});
          failed++;
        } else if (res.ok || res.status === 201 || res.status === 202) {
          okIds.add(row.notification_id);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    let marked = 0;
    if (okIds.size) {
      marked = Number(await rpc("njhr_push_mark", { p_ids: [...okIds] })) || 0;
    }
    // คืนเฉพาะจำนวน — ไม่คืนข้อมูลผู้ใช้หรือเนื้อหาแจ้งเตือนใด ๆ
    return json({ sent: okIds.size, failed, marked });
  } catch (e) {
    const st = (e as { status?: number }).status ?? 403;
    return json({ error: (e as Error).message || "ดำเนินการไม่สำเร็จ" }, st);
  }
});
