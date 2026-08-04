/* HR V2 — components/ui-states.js
   สถานะกลาง: Loading / Empty / Error — ทุก module ใช้ชุดเดียวกัน */
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function renderLoading(el, msg) {
  el.innerHTML = '<div class="v2-state"><span class="v2-spin"></span><p>' + esc(msg || 'กำลังโหลด…') + '</p></div>';
}
export function renderEmpty(el, msg) {
  el.innerHTML = '<div class="v2-state"><div class="v2-state-ic">📭</div><p>' + esc(msg || 'ยังไม่มีข้อมูล') + '</p></div>';
}
export function renderError(el, msg, onRetry, retryLabel, detail) {
  el.innerHTML =
    '<div class="v2-state v2-state-err"><div class="v2-state-ic">⚠️</div>' +
    '<p><b>' + esc(msg || 'เกิดข้อผิดพลาด') + '</b></p>' +
    (detail ? '<p class="v2-state-d">' + esc(String(detail).slice(0, 200)) + '</p>' : '') +
    (onRetry ? '<button class="btn btn-primary" id="v2-retry">' + esc(retryLabel || 'ลองอีกครั้ง') + '</button>' : '') +
    '</div>';
  if (onRetry) { const b = el.querySelector('#v2-retry'); if (b) b.onclick = onRetry; }
}
