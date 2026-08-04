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
  const OVERRIDE_KEY = 'njhr_v2_version_override';
  /* true เมื่อผู้ดูแลระบบเลือก "เข้าสู่ระบบเพื่อแก้ไขเวอร์ชัน" สำหรับคู่เวอร์ชันนี้ (แท็บนี้เท่านั้น) */
  const hasOverride = (serverVersion) => {
    try { return sessionStorage.getItem(OVERRIDE_KEY) === serverVersion + '|' + ctx.BUILD; }
    catch (_) { return false; }
  };

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
      /* รีโหลดแล้วไฟล์ในเบราว์เซอร์ยังเป็นเวอร์ชันเดิม = รีโหลดต่อไปก็ไม่ช่วย
         เกิดได้ 2 กรณี:
           (ก) ประกาศเวอร์ชันใหม่แต่ไฟล์ยังอัปโหลดไม่ครบ → ต้องอัปโหลดไฟล์ให้ครบ
           (ข) อัปโหลดไฟล์ชุดใหม่แล้ว แต่ยังไม่ได้ประกาศเวอร์ชันบนเซิร์ฟเวอร์ (server เก่ากว่าไฟล์)
         กรณี (ข) ต้องเปิดทางให้ผู้ดูแลระบบเข้าไปตั้งเวอร์ชันที่ #/system ได้ ไม่งั้นระบบตันถาวร */
      ctx.appEl.innerHTML =
        '<div class="mt-wrap"><div class="mt-card"><div class="mt-ic">⚠️</div>' +
        '<h1>เวอร์ชันไม่ตรงกัน</h1>' +
        '<p class="mt-msg">เซิร์ฟเวอร์ประกาศเวอร์ชัน <b>' + esc(serverVersion) + '</b> ' +
        'แต่ไฟล์ที่เครื่องนี้โหลดได้คือ <b>' + esc(ctx.BUILD) + '</b> — โหลดใหม่แล้วยังไม่ตรง</p>' +
        '<div class="mt-hint">' +
        '<p><b>ถ้าเพิ่งอัปโหลดไฟล์ชุดใหม่:</b> ยังไม่ได้ประกาศเวอร์ชันบนเซิร์ฟเวอร์ ' +
        'ให้ผู้ดูแลระบบกดปุ่มด้านล่างแล้วไปที่ "สถานะระบบและเวอร์ชัน" เพื่อบันทึกเวอร์ชัน <b>' + esc(ctx.BUILD) + '</b></p>' +
        '<p><b>ถ้าเพิ่งประกาศเวอร์ชันใหม่:</b> ไฟล์ชุดใหม่ยังอัปโหลดไม่ครบ ให้อัปโหลดไฟล์ให้ครบก่อน</p>' +
        '</div>' +
        '<button class="btn btn-primary" id="vg-admin">เข้าสู่ระบบเพื่อแก้ไขเวอร์ชัน (ผู้ดูแลระบบ)</button> ' +
        '<button class="btn btn-ghost" onclick="location.reload()">ลองอีกครั้ง</button></div></div>';
      const ab = document.getElementById('vg-admin');
      if (ab) ab.onclick = () => {
        /* ข้ามการตรวจเวอร์ชันชั่วคราวเฉพาะแท็บนี้ และเฉพาะคู่เวอร์ชันนี้เท่านั้น
           ไม่ข้าม Maintenance · ไม่ข้ามสิทธิ์ · หายเมื่อปิดแท็บ */
        try { sessionStorage.setItem(OVERRIDE_KEY, serverVersion + '|' + ctx.BUILD); } catch (_) {}
        location.hash = '#/login';
        location.reload();          // เริ่มระบบใหม่ในโหมดแก้ไขเวอร์ชัน (ผู้ใช้เป็นคนสั่งเอง ไม่ใช่ลูปอัตโนมัติ)
      };
      return;
    }
    const u = new URL(location.href);
    u.searchParams.set('r', serverVersion || Date.now().toString(36));
    location.replace(u.toString());
  }

  /* แถบเตือนเวอร์ชันไม่ตรง (แสดงเฉพาะตอนอยู่ในโหมดแก้ไขเวอร์ชัน) */
  function versionBanner(serverVersion) {
    let b = document.getElementById('v2-ver-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'v2-ver-banner';
      b.className = 'v2-ver-banner';
      document.body.appendChild(b);
    }
    b.innerHTML = '⚠ โหมดแก้ไขเวอร์ชัน — ไฟล์ในเครื่อง <b>' + esc(ctx.BUILD) +
      '</b> · เซิร์ฟเวอร์ <b>' + esc(serverVersion) + '</b> · ' +
      'ไปที่ "สถานะระบบและเวอร์ชัน" เพื่อบันทึกเวอร์ชันให้ตรงกัน';
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
    if (st.version && st.version !== ctx.BUILD && hasOverride(st.version)) {
      /* โหมดแก้ไขเวอร์ชัน: ใช้งานต่อได้เพื่อให้ผู้ดูแลระบบไปตั้งเวอร์ชันที่ #/system
         แจ้งเตือนค้างไว้บนจอตลอด กันลืมว่ากำลังอยู่ในสถานะไม่ปกติ */
      versionBanner(st.version);
      return { blocked: false, versionMismatch: true };
    }
    if (st.version && st.version !== ctx.BUILD) {
      /* เวอร์ชันบนเซิร์ฟเวอร์ใหม่กว่า → ห้ามใช้ไฟล์ชุดเก่าต่อ
         มี session ค้าง → เพิกถอนก่อน (deploy ใหม่ต้อง login ใหม่เสมอ) */
      await ctx.session.invalidate();
      forceReloadNewBuild(st.version);
      return { blocked: true };
    }
    /* เวอร์ชันตรงกันแล้ว — ล้างสถานะโหมดแก้ไขเวอร์ชันและแถบเตือนทิ้ง */
    try { sessionStorage.removeItem(OVERRIDE_KEY); } catch (_) {}
    const vb = document.getElementById('v2-ver-banner');
    if (vb) vb.remove();
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
