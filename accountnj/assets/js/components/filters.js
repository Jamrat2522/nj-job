/* helper อ่านค่าฟิลเตอร์จาก fbar ตาม data-f attribute */
export function readFilters(root) {
  const out = {};
  root.querySelectorAll('[data-f]').forEach(el => { out[el.dataset.f] = el.value.trim(); });
  return out;
}
