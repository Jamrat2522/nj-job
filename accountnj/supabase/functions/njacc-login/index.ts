// =====================================================================
// BILLING NJ — Secure Login Edge Function  (supabase/functions/njacc-login)
// ---------------------------------------------------------------------
// Browser ส่งมาแค่: { login_name, password }
// ฟังก์ชันนี้ (รันฝั่ง server ด้วย SERVICE_ROLE) จะ:
//   1) resolve login_name → internal account ภายใน  (Browser ไม่ได้รับค่านี้)
//   2) authenticate กับ GoTrue
//   3) คืนเฉพาะ session tokens + ข้อมูลที่ UI ต้องใช้
//
// ห้าม hardcode รหัสผ่าน / service key ในโค้ด — อ่านจาก Environment เท่านั้น
// Deploy:  Supabase Dashboard → Edge Functions → New function → njacc-login
//          (วางไฟล์นี้) → Secrets ที่ต้องมี:
//            SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//          ทั้งสามค่านี้ Supabase ใส่ให้อัตโนมัติในโปรเจกต์ส่วนใหญ่
//
// ข้อจำกัดที่ต้องรู้ (แจ้งตามจริง):
//   access_token ของ GoTrue เป็น JWT มาตรฐานซึ่ง payload มี email claim ติดมาด้วยเสมอ
//   จึงใช้ Auth identity แบบ opaque (njacc-auth-<uuid>@auth.billing.local)
//   → decode JWT แล้วจะไม่เจอชื่อจริง / รหัสพนักงาน / เลข 80
//   (ตัวเลข 80 ยังเก็บได้ใน njacc_profiles.internal_username ซึ่งเบราว์เซอร์อ่านไม่ได้)
// =====================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const URL_ = Deno.env.get('SUPABASE_URL');
  const ANON = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!URL_ || !ANON || !SERVICE) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500);

  let login_name = '', password = '';
  try {
    const b = await req.json();
    login_name = String(b.login_name || '').trim();
    password = String(b.password || '');
  } catch { return json({ error: 'BAD_REQUEST' }, 400); }
  if (!login_name || !password) return json({ error: 'MISSING_CREDENTIALS' }, 400);

  // 0) ปิดกั้นระหว่าง Maintenance (Force Update) — server เป็นผู้ตัดสิน
  const stRes = await fetch(`${URL_}/rest/v1/rpc/njacc_app_status`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (stRes.ok) {
    const st = await stRes.json();
    if (st?.maintenance_active) {
      return json({ error: 'MAINTENANCE', message: st.maintenance_message }, 503);
    }
  }

  // 1) resolve ตัวตนภายในผ่าน RPC ที่ GRANT ให้ service_role เท่านั้น
  //    คืน auth_identity แบบ opaque (njacc-auth-<uuid>) — ไม่มีชื่อจริง/รหัสพนักงานอยู่ในนั้น
  const idRes = await fetch(`${URL_}/rest/v1/rpc/njacc_auth_lookup`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_login: login_name }),
  });
  if (!idRes.ok) return json({ error: 'INVALID_CREDENTIALS' }, 401); // ไม่บอกว่า user ผิดหรือรหัสผิด
  const identity = String(await idRes.json() || '').replace(/^"|"$/g, '');
  if (!identity) return json({ error: 'INVALID_CREDENTIALS' }, 401);
  const email = `${identity}@auth.billing.local`;   // ไม่ log ค่านี้

  // 2) authenticate
  const tRes = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!tRes.ok) return json({ error: 'INVALID_CREDENTIALS' }, 401);
  const tok = await tRes.json();

  // 3) LOGIN AUDIT ครั้งเดียวหลัง authenticate สำเร็จ (best-effort — ไม่ทำให้ login ล้ม)
  //    ไม่ส่ง password / auth email / identity / token เข้า audit
  try {
    await fetch(`${URL_}/rest/v1/rpc/njacc_log_login_success`, {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_login: login_name }),
    });
  } catch { /* best-effort: audit ล้มไม่กระทบการเข้าสู่ระบบ และไม่เปิดเผยรายละเอียดกลับ Browser */ }

  // 4) คืนเฉพาะสิ่งที่ Browser ต้องใช้ตั้ง session — ไม่คืน internal email/username
  return json({
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_in: tok.expires_in,
  });
});
