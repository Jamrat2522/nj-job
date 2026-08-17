/* app-boot.js — Entry point ของแอป (ไฟล์นี้ถูก bundle เป็น assets/js/app.bundle.js)
   สร้างขึ้นใหม่ให้ตรงกับโค้ดที่อยู่ใน bundle เดิมทุกบรรทัด เพื่อให้ build ใหม่ได้ทั้งไฟล์
   แทนการแก้ bundle ทีละจุดด้วยมือ (วิธีเดิมทำให้ export บางตัวหายโดยไม่รู้ตัว) */
import { checkNow, startVersionGuard } from './assets/js/core/version-guard.js';
import { startRouter } from './assets/js/core/router.js';
import { restoreSession } from './assets/js/auth/session.js';
import { renderLogin } from './assets/js/auth/login-page.js';

(async () => {
  try {
    if (!window.supabase) {
      document.body.innerHTML = '<div class="login-wrap"><div class="login-card"><div class="login-logo">NJ</div><h2 class="login-t">เปิดระบบไม่สำเร็จ</h2><p class="login-s">ไม่สามารถโหลด Supabase SDK กรุณาตรวจสอบอินเทอร์เน็ต แล้วรีเฟรชหน้าอีกครั้ง</p></div></div>';
      return;
    }
    const ok = await checkNow('boot');
    if (!ok) return;
    startVersionGuard();
    const enterApp = async () => {
      await startRouter();
    };
    if (await restoreSession()) await enterApp();
    else await renderLogin(enterApp);
  } catch (e) {
    console.error('[BILLING NJ boot]', e);
    document.body.innerHTML = '<div class="login-wrap"><div class="login-card"><div class="login-logo">NJ</div><h2 class="login-t">เปิดระบบไม่สำเร็จ</h2><p class="login-s">ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต แล้วรีเฟรชหน้าอีกครั้ง</p></div></div>';
  }
})();
