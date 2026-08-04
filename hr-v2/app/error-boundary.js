/* HR V2 — app/error-boundary.js
   ครอบการ mount ของทุก module: error ที่หลุดมาถึงชั้นนี้ = Error State ในพื้นที่ของหน้านั้น
   ทั้งระบบต้องไม่เป็นหน้าว่างจาก error ของ module เดียว */
export function createErrorBoundary(ctx) {
  async function run(el, fn) {
    try {
      return await fn();
    } catch (e) {
      ctx.ui.renderError(el, 'เกิดข้อผิดพลาดในหน้านี้',
        () => location.reload(), 'โหลดใหม่', e && e.message);
      return undefined;
    }
  }
  /* กัน unhandled rejection ทำให้ console แดงโดยไม่มีใครเห็น — แจ้งเป็น toast */
  window.addEventListener('unhandledrejection', (ev) => {
    if (ev && ev.reason && ev.reason.silent) return;
    ctx.toast.show((ev.reason && ev.reason.message) || 'เกิดข้อผิดพลาดที่ไม่คาดคิด', 'error');
  });
  return { run };
}
