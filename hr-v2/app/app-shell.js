/* HR V2 — app/app-shell.js
   โครงหน้าจอหลังเข้าสู่ระบบ: Sidebar (เมนูจัดกลุ่มแบบ V1) + Topbar + <main id="v2-outlet">
   สร้างครั้งเดียว — Router เปลี่ยนเฉพาะเนื้อใน outlet · badge แจ้งเตือนอ่านจากเซิร์ฟเวอร์ */
export function mountShell(ctx) {
  const u = ctx.session.user;
  const esc = ctx.ui.esc;

  const groups = {};
  Object.keys(ctx.ROUTES).forEach(h => {
    const d = ctx.ROUTES[h];
    if (d.public || h === '#/home' || h === '#/notifications' || h === '#/profile') return;
    if (d.roles && d.roles.indexOf(ctx.session.role) < 0) return;
    const g = d.group || '';
    (groups[g] = groups[g] || []).push('<a href="' + h + '">' + esc(d.title) + '</a>');
  });
  let menu = '';
  ['', 'บุคลากร', 'คำขอ', 'เงินเดือน', 'รายงาน', 'ระบบ'].forEach(g => {
    if (!groups[g]) return;
    if (g) menu += '<div class="v2-nav-g">' + esc(g) + '</div>';
    menu += groups[g].join('');
  });

  ctx.appEl.innerHTML =
    '<div class="v2-shell">' +
      '<aside class="v2-side" id="v2-side">' +
        '<div class="v2-brand"><span class="v2-badge">NJ</span><div><b>NJ LOGISTIC</b><small>HR SYSTEM · V2</small></div>' +
          '<button class="v2-x" id="v2-side-x" aria-label="ปิดเมนู">✕</button></div>' +
        '<a class="v2-me" href="#/profile"><b>' + esc(u.emp_name || u.username) + '</b>' +
          '<small>' + esc(ctx.ROLE_TH[u.role] || u.role) + '</small></a>' +
        '<nav class="v2-nav">' + menu + '</nav>' +
        '<button class="v2-logout" id="v2-logout">ออกจากระบบ</button>' +
      '</aside>' +
      '<div class="v2-main">' +
        '<header class="v2-top">' +
          '<button class="v2-burger" id="v2-burger" aria-label="เปิดเมนู">☰</button>' +
          '<span class="v2-top-title" id="v2-top-title">NJ HR V2</span>' +
          '<a class="v2-bell" href="#/notifications" aria-label="การแจ้งเตือน">🔔<i id="v2-bell-n" hidden></i></a>' +
          '<span class="v2-build" title="Deployment Version">' + esc(ctx.BUILD) + '</span>' +
        '</header>' +
        (ctx.preview ? '<div class="v2-preview-bar" id="v2-preview-bar">' +
          '⚠ PREVIEW — ระบบทดสอบ ยังไม่เปิดใช้งานจริง · ห้ามใช้แทน V1 · ' +
          '<b id="v2-lock-txt">ล็อกการบันทึกข้อมูล</b></div>' : '') +
        '<main id="v2-outlet" class="v2-outlet"></main>' +
      '</div>' +
      '<div class="v2-scrim" id="v2-scrim"></div>' +
    '</div>';

  const side = document.getElementById('v2-side'), scrim = document.getElementById('v2-scrim');
  const open = (on) => { side.classList.toggle('open', on); scrim.classList.toggle('show', on); };
  document.getElementById('v2-burger').onclick = () => open(true);
  document.getElementById('v2-side-x').onclick = () => open(false);
  scrim.onclick = () => open(false);
  side.querySelectorAll('a').forEach(a => a.addEventListener('click', () => open(false)));

  document.getElementById('v2-logout').onclick = () => {
    ctx.modal.confirm('ออกจากระบบ', 'ยืนยันออกจากระบบใช่หรือไม่', 'ออกจากระบบ', async () => {
      await ctx.session.logout();
      location.hash = '#/login';
      location.reload();          // ล้างสถานะใน memory ทั้งหมด กัน Browser Back เห็นข้อมูลเดิม
    }, true);
  };

  refreshBell(ctx);
  refreshPreviewBar(ctx);
  warnForeignServiceWorker(ctx);
}

/* แถบ Preview บอกสถานะล็อกเขียนตามจริงทุกครั้งที่สถานะเปลี่ยน */
export function refreshPreviewBar(ctx) {
  const t = document.getElementById('v2-lock-txt');
  if (!t) return;
  const locked = ctx.isWriteLocked ? ctx.isWriteLocked() : false;
  t.textContent = locked ? 'ล็อกการบันทึกข้อมูล' : 'ปลดล็อกการบันทึกชั่วคราว (เฉพาะแท็บนี้)';
  const bar = document.getElementById('v2-preview-bar');
  if (bar) bar.classList.toggle('unlocked', !locked);
}

/* V2 ไม่ลงทะเบียน Service Worker เลย — ถ้าพบว่ามี SW ควบคุมหน้านี้ แปลว่าเป็น SW ของแอปอื่น
   (เช่น sw.js ของ V1 ที่ scope ครอบโดเมน) แจ้งเตือนเฉพาะ SUPER_ADMIN เท่านั้น และไม่แตะต้องมัน */
export function warnForeignServiceWorker(ctx) {
  if (ctx.session.role !== 'SUPER_ADMIN') return;
  if (typeof navigator === 'undefined' || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  const bar = document.getElementById('v2-preview-bar');
  if (!bar) return;
  bar.insertAdjacentHTML('beforeend',
    ' · <b style="color:#B45309">ตรวจพบ Service Worker ของแอปอื่นควบคุมหน้านี้ — ดู #/system</b>');
}

export function refreshBell(ctx) {
  const el = document.getElementById('v2-bell-n');
  if (!el) return;
  ctx.repo.notify.unread().then(r => {
    const n = Number((r && (r.unread_count != null ? r.unread_count : r.count)) || 0);
    el.hidden = !n;
    el.textContent = n > 99 ? '99+' : String(n);
  }).catch(() => {});   // โหลดไม่สำเร็จ → ไม่แตะ badge
}
