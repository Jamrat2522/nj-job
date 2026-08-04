/* ============================================================
   HR V2 — app/version-guard.js
   เทียบ BUILD ในเบราว์เซอร์กับ deployment version บนเซิร์ฟเวอร์ (njhr_version_status)
   จุดตรวจ: boot · เปลี่ยน route · แท็บกลับมา active · network กลับมา online · ทุก 3 นาที
   ใช้เวลาเซิร์ฟเวอร์เท่านั้น (server_time เทียบ ends_at) — ไม่เชื่อนาฬิกาเครื่องผู้ใช้

   ผล:
   - maintenance mode 'full'     → invalidate session + หน้า Maintenance + นับถอยหลัง + recheck อัตโนมัติ
   - maintenance mode 'readonly' → ใช้งานต่อได้ แต่ ctx.readOnly = true + แถบประกาศ (ห้ามเขียน)
   - version ไม่ตรง (ไม่มี maintenance) → บังคับโหลดชุดไฟล์ใหม่ทันที (cache-bust ด้วย query)
   - SUPER_ADMIN bypass เฉพาะ maintenance ได้ (ระบบ role รองรับจริง — ตรวจกับ server ทุกครั้ง)
   ============================================================ */
export function createVersionGuard(ctx) {
  let timer = null, countdown = null, lastState = null, checking = null, wasBlocked = false;

  const status = () => ctx.client.rpc('njhr_version_status', {});

  async function isSuperAdmin() {
    try { const u = await ctx.session.check(); return u && u.role === 'SUPER_ADMIN'; }
    catch (_) { return false; }
  }

  function forceReloadNewBuild(serverVersion) {
    /* URL สาธารณะไม่เปลี่ยน — โหลด index.html รอบใหม่ด้วย query กัน cache ตัวกลาง
       index.html รุ่นใหม่จะพา BUILD ใหม่มาเอง
       กันลูปรีโหลดไม่รู้จบ: ถ้าเซิร์ฟเวอร์ประกาศเวอร์ชันใหม่แต่ไฟล์ชุดใหม่ยังไม่ถูกอัปโหลด
       (deploy ไม่ครบ) รีโหลดเกิน 2 ครั้งสำหรับเวอร์ชันเดียวกัน → หยุดและแสดงข้อความควบคุม */
    let n = 0;
    try {
      const k = 'njhr_v2_reload_' + serverVersion;
      n = Number(sessionStorage.getItem(k) || 0) + 1;
      sessionStorage.setItem(k, String(n));
    } catch (_) {}
    if (n > 2) {
      ctx.appEl.innerHTML =
        '<div class="mt-wrap"><div class="mt-card"><div class="mt-ic">⚠️</div>' +
        '<h1>การอัปเดตยังไม่สมบูรณ์</h1>' +
        '<p class="mt-msg">เซิร์ฟเวอร์ประกาศเวอร์ชัน <b>' + esc(serverVersion) + '</b> แต่ไฟล์ชุดใหม่ยังโหลดไม่ได้ ' +
        'กรุณาแจ้งผู้ดูแลระบบ (อัปโหลดไฟล์ให้ครบก่อนประกาศเวอร์ชัน)</p>' +
        '<button class="btn btn-primary" onclick="location.reload()">ลองอีกครั้ง</button></div></div>';
      return;
    }
    const u = new URL(location.href);
    u.searchParams.set('r', serverVersion || Date.now().toString(36));
    location.replace(u.toString());
  }

  function renderMaintenance(st) {
    stopCountdown();
    document.title = 'ปิดปรับปรุงระบบ — NJ HR';
    ctx.appEl.innerHTML =
      '<div class="mt-wrap"><div class="mt-card">' +
      '<div class="mt-ic">🛠️</div>' +
      '<h1>ระบบกำลังปรับปรุง</h1>' +
      '<p class="mt-msg">' + esc(st.maintenance_message || 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที') + '</p>' +
      '<div class="mt-clock" id="mt-clock">—:—</div>' +
      '<p class="mt-sub">ระบบจะเปิดให้เข้าสู่ระบบใหม่โดยอัตโนมัติ ไม่ต้องรีเฟรชหน้า</p>' +
      '</div></div>';
    /* นับถอยหลังจากส่วนต่างเวลาเซิร์ฟเวอร์ (ไม่ใช้นาฬิกาเครื่องเป็นฐาน) */
    let remain = st.maintenance_ends_at
      ? Math.max(0, Math.floor((new Date(st.maintenance_ends_at) - new Date(st.server_time)) / 1000))
      : 0;
    const el = () => document.getElementById('mt-clock');
    const tick = () => {
      const c = el(); if (!c) return stopCountdown();
      const m = Math.floor(remain / 60), s = remain % 60;
      c.textContent = m + ':' + String(s).padStart(2, '0');
      if (remain <= 0) { stopCountdown(); checkNow(); return; }   // ครบเวลา → ถามเซิร์ฟเวอร์ทันที
      remain--;
    };
    tick();
    countdown = setInterval(tick, 1000);
  }

  function stopCountdown() { if (countdown) { clearInterval(countdown); countdown = null; } }

  function readOnlyBanner(on, msg) {
    let b = document.getElementById('v2-ro-banner');
    if (!on) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div');
      b.id = 'v2-ro-banner'; b.className = 'v2-ro-banner';
      document.body.prepend(b);
    }
    b.textContent = '🔒 ' + (msg || 'ระบบอยู่ในโหมดอ่านอย่างเดียว — ดูข้อมูลได้ แต่เพิ่ม/แก้ไข/ลบ/อนุมัติไม่ได้ชั่วคราว');
  }

  async function apply(st) {
    lastState = st;

    /* 1) Maintenance ก่อนเสมอ */
    if (st.maintenance_active) {
      if (st.maintenance_mode === 'readonly') {
        ctx.readOnly = true;
        readOnlyBanner(true, st.maintenance_message);
        return { blocked: false, readOnly: true };
      }
      /* full: SUPER_ADMIN เข้าได้ (ตรวจกับเซิร์ฟเวอร์ทุกครั้ง ไม่เชื่อค่าที่เก็บในเครื่อง) */
      if (await isSuperAdmin()) {
        ctx.readOnly = false;
        readOnlyBanner(true, 'โหมดปรับปรุงระบบ (คุณเข้าใช้ในฐานะผู้ดูแลระบบสูงสุด)');
        return { blocked: false, readOnly: false, superBypass: true };
      }
      await ctx.session.invalidate();          // ล้าง token เครื่องนี้ + เพิกถอนฝั่งเซิร์ฟเวอร์
      wasBlocked = true;
      renderMaintenance(st);
      return { blocked: true };
    }

    /* 2) พ้น maintenance แล้ว — ถ้าค้างอยู่หน้าปิดปรับปรุง ให้เปิดระบบใหม่อัตโนมัติ
       (session ถูกเพิกถอนไปแล้วตอนเริ่ม maintenance → ทุกคนต้อง login ใหม่เสมอ) */
    if (wasBlocked) {
      wasBlocked = false;
      location.reload();
      return { blocked: true };
    }
    ctx.readOnly = false;
    readOnlyBanner(false);

    /* 3) เทียบ deployment version */
    if (st.version && st.version !== ctx.BUILD) {
      /* เวอร์ชันบนเซิร์ฟเวอร์ใหม่กว่า → ห้ามใช้ไฟล์ชุดเก่าต่อ
         มี session ค้าง → เพิกถอนก่อน (deploy ใหม่ต้อง login ใหม่เสมอ) */
      await ctx.session.invalidate();
      forceReloadNewBuild(st.version);
      return { blocked: true };
    }
    return { blocked: false };
  }

  async function checkNow() {
    if (checking) return checking;             // กันเรียกซ้อน (หลาย trigger พร้อมกัน)
    checking = (async () => {
      try {
        const st = await status();
        return await apply(st);
      } catch (e) {
        /* เซิร์ฟเวอร์ไม่ตอบ: ถ้ากำลังอยู่หน้า maintenance ให้ค้างไว้ (fail-safe)
           ถ้าระบบใช้งานปกติอยู่ ให้ใช้งานต่อ — จะตรวจใหม่รอบถัดไป */
        if (lastState && lastState.maintenance_active && lastState.maintenance_mode === 'full') {
          return { blocked: true };
        }
        return { blocked: false, offline: true };
      } finally { checking = null; }
    })();
    return checking;
  }

  function startWatch() {
    if (timer) return;
    timer = setInterval(checkNow, 3 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNow(); });
    window.addEventListener('online', () => checkNow());
    window.addEventListener('hashchange', () => checkNow());
  }
  startWatch();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { checkNow, get state() { return lastState; } };
}
