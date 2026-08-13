/* in-memory cache สั้น ๆ สำหรับ masters — ไม่ใช้ localStorage เก็บข้อมูลธุรกิจ */
const store = new Map();
export function cGet(key, maxAgeMs = 300000) {
  const e = store.get(key);
  if (!e || Date.now() - e.t > maxAgeMs) return null;
  return e.v;
}
export function cSet(key, v) { store.set(key, { v, t: Date.now() }); }
export function cClear() { store.clear(); }
