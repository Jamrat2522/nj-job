/* Secure login: Browser ส่งเฉพาะ login_name + password ไปที่ Edge Function njacc-login
   Edge Function (service role) resolve บัญชีภายในและ authenticate ให้ แล้วคืนเฉพาะ token
   → Browser ไม่ต้องรู้ / ไม่ได้รับ internal username หรือ internal auth email อีกต่อไป */
import { rpc, sb } from '../core/supabase-client.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../core/config.js';

export async function loginWithName(loginName, password) {
  let res;
  try {
    res = await fetch(SUPABASE_URL + '/functions/v1/njacc-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ login_name: loginName, password }),
    });
  } catch (e) {
    throw new Error('เชื่อมต่อระบบยืนยันตัวตนไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok || !data || !data.access_token) {
    if (data && data.error === 'MAINTENANCE') throw new Error(data.message || 'ระบบกำลังปิดปรับปรุง');
    if (res.status === 401) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if (res.status === 404) throw new Error('ยังไม่ได้ติดตั้ง Edge Function njacc-login (ดูขั้นตอนใน README)');
    throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
  }
  const { error } = await sb().auth.setSession({
    access_token: data.access_token, refresh_token: data.refresh_token,
  });
  if (error) throw new Error('สร้าง session ไม่สำเร็จ กรุณาลองใหม่');
}
export async function loadMyProfile() { return rpc('njacc_my_profile'); }
