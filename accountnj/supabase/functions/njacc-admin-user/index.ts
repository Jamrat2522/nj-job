// =====================================================================
// BILLING NJ — Admin Create User  (supabase/functions/njacc-admin-user)
// ---------------------------------------------------------------------
// เบราว์เซอร์ส่งเฉพาะข้อมูลปลอดภัย:
//   { request_id, employee_code, full_name, department, login_name, role, active, access[] }
// ห้ามส่ง internal_username / auth email / auth_user_id / auth_identity
// Response ไม่คืน identity, auth email, auth_user_id และ **ไม่คืนรหัสผ่านใด ๆ**
//
// STATE MACHINE (เก็บที่ njacc_profiles — service_role อ่านได้เท่านั้น)
//   PENDING → AUTH_CREATED → ACTIVE
//                         ↘ FAILED_CLEANUP (ลบ auth user ไม่สำเร็จ — ยัง track auth id ไว้)
//
// FLOW
//   1) njacc_admin_begin_user        (JWT ผู้เรียก)  profile PENDING + access + idempotency [1 txn]
//   2) njacc_admin_auth_identity     (service)      อ่าน opaque identity (ไม่ออกจาก server)
//   3a) njacc_admin_find_auth_user   (service)      RECONCILE ก่อนสร้างเสมอ — ถ้ามีของเดิมใช้ต่อ
//   3b) POST /auth/v1/admin/users    (service)      สร้าง auth user (ไม่ตั้งรหัสผ่าน)
//       timeout / 422 duplicate → reconcile อีกครั้ง ห้าม cleanup ทันที
//       auth user ของโปรไฟล์อื่น → AUTH_IDENTITY_CONFLICT (ไม่ยึดของคนอื่น)
//   4) njacc_admin_mark_auth_created (service)      บันทึก auth id ก่อน activate → กัน orphan
//   5) njacc_admin_complete_user     (service)      link + ACTIVE                          [1 txn]
//
// RECONCILIATION (สำคัญ): ถ้าขั้น 5 timeout / ตอบกลับไม่ชัด → **ห้ามลบ auth user ทันที**
//   ต้อง query njacc_admin_provision_state ก่อน:
//     - ACTIVE + auth_user_id ตรง → ถือว่าสำเร็จ คืน success (ไม่ลบ ไม่ rollback)
//     - ยังไม่ ACTIVE            → ลบ auth user แล้ว rollback (ถ้าลบไม่สำเร็จ → FAILED_CLEANUP)
//
// RETRY (request_id เดิม): REPLAY → ACTIVE คืนผลเดิม · AUTH_CREATED ใช้ auth user เดิมต่อ
//   · PENDING ทำต่อจากขั้นที่ค้าง — ไม่สร้าง profile/auth/identity ใหม่
// =====================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const REQ_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/* แปลง error ของ DB เป็นรหัสที่ผู้ใช้เข้าใจ — ห้ามส่ง raw SQL / secret / identity กลับ */
function friendly(raw: string): { code: string; status: number } {
  if (raw.includes('NJACC_FORBIDDEN')) return { code: 'FORBIDDEN', status: 403 };
  if (raw.includes('NJACC_LOGIN_EXISTS')) return { code: 'LOGIN_EXISTS', status: 409 };
  if (raw.includes('NJACC_EMPCODE_EXISTS')) return { code: 'EMPLOYEE_CODE_EXISTS', status: 409 };
  if (raw.includes('njacc_profiles_login_uq')) return { code: 'LOGIN_EXISTS', status: 409 };
  if (raw.includes('njacc_profiles_empcode_uq')) return { code: 'EMPLOYEE_CODE_EXISTS', status: 409 };
  if (raw.includes('njacc_idempotency_requests_pkey')) return { code: 'DUPLICATE_REQUEST', status: 409 };
  if (raw.includes('NJACC_BAD_REQUEST_ID')) return { code: 'BAD_REQUEST_ID', status: 400 };
  if (raw.includes('NJACC_BAD_ROLE')) return { code: 'BAD_ROLE', status: 400 };
  if (raw.includes('NJACC_BAD_INPUT')) return { code: 'MISSING_FIELDS', status: 400 };
  if (raw.includes('NJACC_NO_PROFILE')) return { code: 'NO_PROFILE', status: 400 };
  return { code: 'CREATE_PROFILE_FAILED', status: 400 };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const URL_ = Deno.env.get('SUPABASE_URL');
  const ANON = Deno.env.get('SUPABASE_ANON_KEY');
  const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!URL_ || !ANON || !SERVICE) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500);

  const caller = req.headers.get('Authorization') || '';
  if (!caller.startsWith('Bearer ')) return json({ error: 'UNAUTHORIZED' }, 401);

  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json({ error: 'BAD_REQUEST' }, 400); }

  const requestId = String(p.request_id ?? '');
  if (!REQ_ID_RE.test(requestId)) return json({ error: 'BAD_REQUEST_ID' }, 400);

  // ตัด field อ่อนไหวทิ้งเสมอ — เบราว์เซอร์กำหนดตัวตนภายในไม่ได้
  const safe = {
    employee_code: p.employee_code ?? null,
    full_name: p.full_name ?? null,
    department: p.department ?? null,
    login_name: p.login_name ?? null,
    role: p.role ?? 'USER',        // สิทธิ์ให้ role ถูกตรวจซ้ำที่ DB (SUPER_ADMIN เท่านั้น)
    active: p.active ?? true,
    access: Array.isArray(p.access) ? p.access : [],
  };
  if (!safe.full_name || !safe.login_name) return json({ error: 'MISSING_FIELDS' }, 400);

  const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };
  const rpcSvc = (fn: string, body: unknown) =>
    fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: svc, body: JSON.stringify(body) });

  const state = async (profileId: string) => {
    try {
      const r = await rpcSvc('njacc_admin_provision_state', { p_profile: profileId, p_request_id: requestId });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  };
  /* reconciliation: หา auth user ของ opaque identity นี้ (server-only, คืนแค่ uuid) */
  const findAuthUser = async (profileId: string) => {
    const r = await rpcSvc('njacc_admin_find_auth_user',
      { p_profile: profileId, p_request_id: requestId });
    if (!r.ok) {
      const t = await r.text();
      if (t.includes('NJACC_AUTH_IDENTITY_CONFLICT')) return { error: 'AUTH_IDENTITY_CONFLICT' };
      if (t.includes('NJACC_AUTH_IDENTITY_AMBIGUOUS')) return { error: 'AUTH_IDENTITY_AMBIGUOUS' };
      return { error: 'LOOKUP_FAILED' };
    }
    return await r.json();
  };
  const safeProfile = async (profileId: string) => {
    try {
      const r = await rpcSvc('njacc_admin_safe_profile', { p_profile: profileId });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  };
  const deleteAuthUser = async (authId: string) => {
    try {
      const r = await fetch(`${URL_}/auth/v1/admin/users/${authId}`, { method: 'DELETE', headers: svc });
      return r.ok || r.status === 404;
    } catch { return false; }
  };
  /* cleanup (compensating transaction) — ตรวจ HTTP status + body จริงทุกขั้น
     ผลลัพธ์ที่ยอมรับได้มี 2 แบบเท่านั้น:
       A) auth user ถูกลบจริง + profile ถูกลบจริง            → { ok:true }
       B) profile คงอยู่ใน FAILED_CLEANUP พร้อม auth id ที่ track ได้ → { ok:false, pending:true }
     ห้ามจบด้วย state กลางที่ตามไม่ได้ */
  const markFailedCleanup = async (profileId: string, reason: string) => {
    try { await rpcSvc('njacc_admin_mark_failed_cleanup',
      { p_profile: profileId, p_request_id: requestId, p_reason: reason }); } catch { /* state เดิมยัง track auth id ไว้ */ }
  };
  const cleanup = async (profileId: string, authId: string | null, reason: string) => {
    // 1) ลบ auth user ที่ track ไว้ (ถ้ามี)
    if (authId) {
      const deleted = await deleteAuthUser(authId);
      if (!deleted) {
        await markFailedCleanup(profileId, reason);   // B) ยัง track auth id ได้จาก column
        return { ok: false, pending: true };
      }
      // auth ถูกลบแล้ว — เคลียร์ tracking ทันที กัน stale uuid ค้างในโปรไฟล์
      try {
        const cl = await rpcSvc('njacc_admin_mark_auth_deleted',
          { p_profile: profileId, p_request_id: requestId, p_reason: reason });
        if (!cl.ok) { await markFailedCleanup(profileId, 'AUTH_DELETED_CLEAR_FAILED'); return { ok: false, pending: true }; }
      } catch {
        await markFailedCleanup(profileId, 'AUTH_DELETED_CLEAR_FAILED');
        return { ok: false, pending: true };
      }
    }
    // 2) rollback profile — ต้องตรวจทั้ง HTTP status และ body (fetch ไม่ throw ตอน 4xx/5xx)
    let rolledBack = false;
    try {
      const rb = await rpcSvc('njacc_admin_rollback_user',
        { p_profile: profileId, p_request_id: requestId, p_reason: reason, p_auth_deleted: true });
      if (rb.ok) {
        const body = await rb.json().catch(() => null);
        rolledBack = body?.rolled_back === true;
      }
    } catch { rolledBack = false; }
    // 3) verify final state จาก DB จริง (profile ต้องหายไปแล้ว)
    if (!rolledBack) {
      const st = await state(profileId);
      rolledBack = !!st && st.exists === false;
    }
    if (!rolledBack) { await markFailedCleanup(profileId, reason); return { ok: false, pending: true }; }
    return { ok: true, pending: false };
  };

  // ── 1) BEGIN (JWT ผู้เรียก → RPC ตรวจ SUPER_ADMIN + idempotency + unique เอง)
  const beginRes = await fetch(`${URL_}/rest/v1/rpc/njacc_admin_begin_user`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: caller, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p: safe, p_request_id: requestId }),
  });
  if (!beginRes.ok) {
    const f = friendly(await beginRes.text());
    return json({ error: f.code }, f.status);
  }
  const begun = await beginRes.json();
  const profileId: string = begun?.profile_id;
  if (!profileId) return json({ error: 'CREATE_PROFILE_FAILED' }, 400);

  // REPLAY: provision จบแล้ว → คืนผลเดิม ไม่สร้างอะไรใหม่
  if (begun.status === 'REPLAY' && begun.auth_linked) {
    return json({ status: 'ALREADY_CREATED', profile: await safeProfile(profileId) });
  }

  // ── 2) opaque identity (server-side เท่านั้น)
  const idRes = await rpcSvc('njacc_admin_auth_identity', { p_profile: profileId });
  if (!idRes.ok) {
    await cleanup(profileId, begun.provisioning_auth_user_id ?? null, 'AUTH_IDENTITY_FAILED');
    return json({ error: 'AUTH_IDENTITY_FAILED', retryable: true }, 500);
  }
  const identity = String(await idRes.json() || '').replace(/^"|"$/g, '');
  if (!identity) {
    await cleanup(profileId, begun.provisioning_auth_user_id ?? null, 'AUTH_IDENTITY_EMPTY');
    return json({ error: 'AUTH_IDENTITY_FAILED', retryable: true }, 500);
  }
  const email = `${identity}@auth.billing.local`;   // ไม่ log และไม่ส่งกลับเบราว์เซอร์

  // ── 3) auth user
  //  retry: ห้ามเชื่อ provisioning_auth_user_id ทันที — ต้อง verify กับ auth.users ก่อน
  let authId: string = begun.provisioning_auth_user_id ?? '';
  if (authId) {
    const chk = await findAuthUser(profileId);
    if (chk?.error === 'AUTH_IDENTITY_CONFLICT' || chk?.error === 'AUTH_IDENTITY_AMBIGUOUS') {
      return json({ error: chk.error, retryable: false }, 409);
    }
    if (!chk?.found) {
      // stale: auth user ถูกลบไปแล้ว → เคลียร์ tracking กลับเป็น PENDING แล้วสร้างใหม่
      try { await rpcSvc('njacc_admin_mark_auth_deleted',
        { p_profile: profileId, p_request_id: requestId, p_reason: 'STALE_AUTH_TRACKING' }); } catch { /* retry รอบหน้า */ }
      authId = '';
    } else if (chk.auth_user_id !== authId) {
      // tracking ไม่ตรงของจริง → เคลียร์แล้วใช้ตัวที่พบจาก identity
      try { await rpcSvc('njacc_admin_mark_auth_deleted',
        { p_profile: profileId, p_request_id: requestId, p_reason: 'STALE_AUTH_TRACKING' }); } catch { /* retry รอบหน้า */ }
      authId = '';
    }
  }

  if (!authId) {
    // 3a) RECONCILE ก่อนเสมอ: กันกรณี request ก่อนหน้าสร้าง auth user สำเร็จแต่ response หาย
    const pre = await findAuthUser(profileId);
    if (pre?.error === 'AUTH_IDENTITY_CONFLICT' || pre?.error === 'AUTH_IDENTITY_AMBIGUOUS') {
      return json({ error: pre.error, retryable: false }, 409);   // ห้ามยึด auth user ของคนอื่น
    }
    if (pre?.found) authId = pre.auth_user_id;
  }

  if (!authId) {
    // 3b) สร้างใหม่
    let created = false;
    try {
      // ไม่ตั้งรหัสผ่านที่นี่ — การตั้งรหัสผ่านทำผ่าน Dashboard / reset flow เท่านั้น
      const auRes = await fetch(`${URL_}/auth/v1/admin/users`, {
        method: 'POST', headers: svc,
        body: JSON.stringify({ email, email_confirm: true }),
      });
      if (auRes.ok) {
        authId = (await auRes.json())?.id || '';
        created = true;
      } else {
        // duplicate / already registered → ไม่ถือว่า fail ทันที ต้อง reconcile ก่อน
        const post = await findAuthUser(profileId);
        if (post?.error) return json({ error: post.error, retryable: false }, 409);
        if (post?.found) { authId = post.auth_user_id; created = true; }
      }
    } catch {
      // timeout/network: auth user อาจถูกสร้างจริง → ห้าม cleanup ทันที ให้ reconcile
      const post = await findAuthUser(profileId);
      if (post?.error) return json({ error: post.error, retryable: false }, 409);
      if (post?.found) { authId = post.auth_user_id; created = true; }
      if (!authId) {
        // ยังไม่พบของจริง → คงสถานะ PENDING ไว้ให้ retry ด้วย request_id เดิม (ไม่ rollback)
        return json({ error: 'AUTH_SERVICE_UNAVAILABLE', retryable: true }, 503);
      }
    }
    if (!created || !authId) {
      // ไม่พบ auth user และสร้างไม่สำเร็จ → คงสถานะ PENDING ให้ retry (ไม่มี orphan เพราะยังไม่มี auth user)
      return json({ error: 'CREATE_AUTH_USER_FAILED', retryable: true }, 502);
    }

    // ── 4) track auth id ก่อน activate เสมอ (invariant: AUTH_CREATED ต้องมี provisioning_auth_user_id)
    const markRes = await rpcSvc('njacc_admin_mark_auth_created',
      { p_profile: profileId, p_auth: authId, p_request_id: requestId });
    if (!markRes.ok) {
      // ยัง track ไม่ได้ → ลบ auth user ที่เพิ่งสร้างทิ้งแล้ว rollback (มี id อยู่ในมือ จึงไม่เกิด orphan)
      await cleanup(profileId, authId, 'MARK_AUTH_FAILED');
      return json({ error: 'CREATE_AUTH_USER_FAILED', retryable: true }, 500);
    }
  }

  // ── 5) COMPLETE + RECONCILIATION (ห้ามลบ auth user ก่อนตรวจสถานะจริงใน DB)
  let completed = false;
  try {
    const linkRes = await rpcSvc('njacc_admin_complete_user',
      { p_profile: profileId, p_auth: authId, p_request_id: requestId });
    completed = linkRes.ok;
  } catch {
    completed = false;   // timeout — ยังไม่รู้ผลจริง ต้อง reconcile
  }
  if (!completed) {
    const st = await state(profileId);
    if (st && st.exists && st.owned && st.provisioning_status === 'ACTIVE' && st.auth_user_id === authId) {
      // DB commit สำเร็จแล้ว แค่ response ไม่ถึง → ถือว่าสำเร็จ ห้ามลบ/rollback
      return json({ status: 'CREATED', reconciled: true, profile: await safeProfile(profileId) });
    }
    const cl = await cleanup(profileId, authId, 'LINK_FAILED');
    return json({ error: cl.ok ? 'LINK_FAILED' : 'LINK_FAILED_CLEANUP_PENDING', retryable: cl.ok }, 500);
  }

  // ── 6) สำเร็จ — คืนเฉพาะ safe profile (ไม่มีรหัสผ่าน / identity / auth id)
  return json({
    status: 'CREATED',
    profile: await safeProfile(profileId),
    password_activation: 'NOT_IMPLEMENTED',   // ผู้ดูแลต้องตั้งรหัสผ่านให้ผู้ใช้ผ่าน Dashboard/reset flow
  });
});
