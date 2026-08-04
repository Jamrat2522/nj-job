/* HR V2 — services/supabase-client.js
   จุดเดียวที่คุยกับ Supabase REST /rpc (มาตรฐานเดียวกับ V1: publishable key + p_token ใน body)
   View/Module ห้าม fetch ตรง — ต้องผ่าน ctx.client เท่านั้น */
export function createClient(url, key) {
  if (!url || !key) throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase');

  async function call(fn, body, asList) {
    const r = await fetch(url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    let j = null;
    try { j = await r.json(); } catch (_) { /* body ว่าง */ }
    if (!r.ok) {
      const msg = (j && (j.message || j.hint)) || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ';
      const err = new Error(msg);
      err.status = r.status; err.code = j && j.code;
      throw err;
    }
    if (asList) return Array.isArray(j) ? j : (j ? [j] : []);
    return Array.isArray(j) ? j[0] : j;
  }

  return {
    url,
    rpc:     (fn, body) => call(fn, body, false),
    rpcList: (fn, body) => call(fn, body, true)
  };
}
