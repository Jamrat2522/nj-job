/* HR V2 — app/session.js
   ใช้ RPC เดิมทั้งหมด: njhr_login / njhr_session_check / njhr_logout (ไม่สร้าง auth ใหม่)
   localStorage เก็บเฉพาะ token (คีย์แยกจาก V1: njhr_v2_token — ไม่ชน session V1)
   role/employee_id เชื่อผลจากเซิร์ฟเวอร์เท่านั้น ไม่เก็บเป็นหลักฐานสิทธิ์ในเครื่อง */
const TOKEN_KEY = 'njhr_v2_token';

export function createSession(client) {
  let user = null;              // ผลล่าสุดจาก server (in-memory เท่านั้น)
  let v2Allowed = null;         // Feature Flag ผล njhr_version_v2_access

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } };
  const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (_) {} };

  async function login(username, password) {
    const row = await client.rpc('njhr_login', {
      p_username: username, p_password: password,
      p_ua: ('V2 · ' + (navigator.userAgent || '')).slice(0, 200)
    });
    if (!row || !row.user_id) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if (row.session_token) setToken(row.session_token);
    user = row;
    await checkV2Access();
    return row;
  }

  async function check() {
    const t = getToken();
    if (!t) { user = null; throw Object.assign(new Error('NO_SESSION'), { silent: true }); }
    const row = await client.rpc('njhr_session_check', { p_token: t });
    if (!row || !row.user_id) throw new Error('เซสชันไม่ถูกต้อง');
    if (!row.employee_id) throw new Error('บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ');
    user = row;
    return row;
  }

  async function checkV2Access() {
    const t = getToken();
    if (!t) { v2Allowed = false; return false; }
    try {
      const r = await client.rpc('njhr_version_v2_access', { p_token: t });
      v2Allowed = !!(r && r.allowed);
    } catch (_) { v2Allowed = false; }
    return v2Allowed;
  }

  async function logout() {
    const t = getToken();
    if (t) { try { await client.rpc('njhr_logout', { p_token: t }); } catch (_) {} }  // เพิกถอนฝั่งเซิร์ฟเวอร์
    setToken('');
    user = null; v2Allowed = null;
  }

  /* ใช้ตอน maintenance: ทำให้ session ในเครื่องใช้ต่อไม่ได้ + เพิกถอนที่เซิร์ฟเวอร์ */
  const invalidate = () => logout();

  return {
    getToken, login, check, logout, invalidate, checkV2Access,
    get user() { return user; },
    get role() { return user ? user.role : null; },
    get v2Allowed() { return v2Allowed; }
  };
}
