/* HR V2 — modules/home/system.js
   หน้า SUPER_ADMIN: ควบคุม Deployment Version + Maintenance Mode ของระบบ HR
   ทุกคำสั่งตรวจสิทธิ์จริงที่ RPC (njhr_ctx) — หน้านี้เป็นเพียง UI */
let cleanup = [];

export function mount(el, ctx) {
  const esc = ctx.ui.esc;
  let busy = false;

  function html(s) {
    el.innerHTML =
      '<div class="sysp">' +
      '<div class="v2-card"><h3>เวอร์ชันปัจจุบัน</h3><div id="sys-cur"></div></div>' +
      '<div class="v2-card"><h3>โหมด Preview และการล็อกบันทึกข้อมูล</h3>' +
      '<div id="sys-preview"></div>' +
      '<p class="hm-sub">รอบนี้เป็นการทดสอบ Production Integration เท่านั้น — ห้าม cutover จาก V1 ' +
      'และห้ามบันทึกข้อมูลธุรกิจจริงจนกว่าจะทดสอบ RPC/RLS/ข้อมูลจริงของ Module นั้นผ่าน<br>' +
      'ปุ่มปลดล็อกมีผลเฉพาะแท็บนี้ หายเมื่อปิดแท็บ และไม่มีผลกับผู้ใช้คนอื่น</p>' +
      '<div class="sys-btns"><button class="btn btn-danger" id="sys-unlock">ปลดล็อกการบันทึก (ทดสอบ)</button>' +
      '<button class="btn btn-ghost" id="sys-lock">ล็อกการบันทึกกลับ</button></div>' +
      '<div id="sys-sw" style="margin-top:10px"></div></div>' +
      '<div class="v2-card"><h3>เปลี่ยน Deployment Version</h3>' +
      '<p class="hm-sub">ลำดับ deploy ที่ถูกต้อง: ① อัปโหลดไฟล์ V2 ชุดใหม่ (BUILD ใหม่ใน index.html) ให้ครบก่อน ' +
      '② จึงกดบันทึกเวอร์ชันที่นี่ — ห้ามสลับลำดับ (กันผู้ใช้ถูกเปิดเข้าชุดไฟล์ที่ยังอัปโหลดไม่ครบ)</p>' +
      '<label class="v2-field"><span>เวอร์ชันใหม่ (ต้องตรงกับ NJHR_V2_BUILD ในไฟล์ที่อัปโหลดแล้ว)</span>' +
      '<input type="text" id="sys-ver" placeholder="เช่น v2-preview-2"></label>' +
      '<label class="v2-check"><input type="checkbox" id="sys-mt"><span>เริ่ม Maintenance 10 นาทีพร้อมกัน (บังคับออกจากระบบทุกคน)</span></label>' +
      '<label class="v2-check"><input type="checkbox" id="sys-ro"><span>ใช้โหมดอ่านอย่างเดียวแทนการปิดทั้งหมด</span></label>' +
      '<button class="btn btn-primary" id="sys-save">บันทึกเวอร์ชัน</button></div>' +
      '<div class="v2-card"><h3>Maintenance Mode (ระบบ HR เท่านั้น)</h3>' +
      '<div class="sys-btns">' +
      '<button class="btn btn-danger" id="sys-mt-full">เริ่มปิดปรับปรุง 10 นาที</button>' +
      '<button class="btn btn-ghost" id="sys-mt-ro">เริ่มโหมดอ่านอย่างเดียว 10 นาที</button>' +
      '<button class="btn btn-ghost" id="sys-mt-stop">ปิด Maintenance ทันที</button>' +
      '</div></div>' +
      '</div>';
  }
  html();

  const prev = el.querySelector('#sys-preview'), swBox = el.querySelector('#sys-sw');
  function refreshPreview() {
    const locked = ctx.isWriteLocked ? ctx.isWriteLocked() : false;
    prev.innerHTML =
      '<div class="v2-kv"><span class="k">โหมด</span><span class="v">' +
      (ctx.preview ? '<b style="color:#B45309">PREVIEW (ทดสอบ)</b>' : 'ใช้งานจริง') + '</span></div>' +
      '<div class="v2-kv"><span class="k">การบันทึกข้อมูล</span><span class="v">' +
      (locked ? '<b style="color:#15803D">ล็อกอยู่ — บันทึกไม่ได้</b>'
              : '<b style="color:#B91C1C">ปลดล็อกชั่วคราว — บันทึกลงข้อมูลจริงได้</b>') + '</span></div>';
    import('../../app/app-shell.js?v=' + ctx.BUILD).then(m => m.refreshPreviewBar(ctx)).catch(() => {});
  }
  el.querySelector('#sys-unlock').onclick = () => ctx.modal.confirm('ปลดล็อกการบันทึกข้อมูล',
    'คำสั่งเพิ่ม/แก้ไข/ลบ/อนุมัติ จะเขียนลงฐานข้อมูลจริงทันที ใช้เฉพาะการทดสอบ Module ที่ตรวจ RPC/RLS ผ่านแล้ว ' +
    'และต้องลบข้อมูลทดสอบทุกครั้ง — ยืนยันหรือไม่', 'ปลดล็อก', () => {
      if (!ctx.setWriteUnlock(true)) return ctx.toast.show('เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น', 'error');
      ctx.toast.show('ปลดล็อกการบันทึกเฉพาะแท็บนี้แล้ว'); refreshPreview();
    }, true);
  el.querySelector('#sys-lock').onclick = () => {
    ctx.setWriteUnlock(false); ctx.toast.show('ล็อกการบันทึกกลับแล้ว'); refreshPreview();
  };
  refreshPreview();

  /* สถานะ Service Worker: V2 ไม่ลงทะเบียนเอง — รายงานอย่างเดียว ไม่ unregister (กันกระทบ V1) */
  (function () {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
      swBox.innerHTML = '<p class="hm-sub">เบราว์เซอร์นี้ไม่รองรับ Service Worker</p>'; return;
    }
    const ctrl = navigator.serviceWorker.controller;
    navigator.serviceWorker.getRegistrations().then(rs => {
      const mine = rs.filter(r => String(r.scope).indexOf('/hr-v2/') >= 0);
      swBox.innerHTML =
        '<div class="v2-kv"><span class="k">SW ของ V2</span><span class="v">' +
        (mine.length ? '<b style="color:#B91C1C">พบ ' + mine.length + ' ตัว (ไม่ควรมี)</b>' : 'ไม่มี (ถูกต้อง)') + '</span></div>' +
        '<div class="v2-kv"><span class="k">SW ที่ควบคุมหน้านี้</span><span class="v">' +
        (ctrl ? esc(ctrl.scriptURL) + ' <b style="color:#B45309">(ของแอปอื่น — V2 ไม่แตะต้อง)</b>' : 'ไม่มี') + '</span></div>' +
        '<p class="hm-sub">ถ้ามี SW ของแอปอื่นครอบ /hr-v2/ อยู่ ให้แก้ที่ scope ของแอปนั้นเอง — ห้ามสั่ง unregister จากหน้านี้ เพราะจะกระทบ V1</p>';
    }).catch(() => { swBox.innerHTML = '<p class="hm-sub">อ่านสถานะ Service Worker ไม่สำเร็จ</p>'; });
  })();

  const cur = el.querySelector('#sys-cur');
  async function refresh() {
    ctx.ui.renderLoading(cur);
    try {
      const s = await ctx.client.rpc('njhr_version_status', {});
      cur.innerHTML =
        '<p>เซิร์ฟเวอร์: <b>' + esc(s.version) + '</b> · เครื่องนี้: <b>' + esc(ctx.BUILD) + '</b></p>' +
        '<p>Maintenance: <b>' + (s.maintenance_active ? ('เปิด (' + esc(s.maintenance_mode) + ') ถึง ' +
          esc(new Date(s.maintenance_ends_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }))) : 'ปิด') + '</b></p>';
    } catch (e) { ctx.ui.renderError(cur, 'อ่านสถานะไม่สำเร็จ', refresh, 'ลองอีกครั้ง', e.message); }
  }
  refresh();

  async function run(fn, okMsg) {
    if (busy) return;
    busy = true;
    try {
      await fn();
      ctx.toast.show(okMsg);
      await refresh();
      await ctx.guard.checkNow();
    } catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
    finally { busy = false; }
  }

  el.querySelector('#sys-save').onclick = () => {
    const v = el.querySelector('#sys-ver').value.trim();
    const mt = el.querySelector('#sys-mt').checked;
    const ro = el.querySelector('#sys-ro').checked;
    if (!v) { ctx.toast.show('กรุณากรอกเวอร์ชันใหม่', 'warn'); return; }
    ctx.modal.confirm('ยืนยันเปลี่ยนเวอร์ชัน',
      'เปลี่ยน deployment version เป็น "' + v + '"' + (mt ? ' และเริ่ม Maintenance 10 นาทีทันที ผู้ใช้ทุกคนจะถูกบังคับออกจากระบบ' : '') +
      ' — ยืนยันว่าไฟล์ชุดใหม่อัปโหลดครบแล้วใช่หรือไม่',
      'ยืนยัน', () => run(
        () => ctx.client.rpc('njhr_version_set', {
          p_token: ctx.session.getToken(), p_version: v, p_note: null,
          p_maintenance_minutes: mt ? 10 : 0, p_mode: ro ? 'readonly' : 'full', p_message: null
        }), 'บันทึกเวอร์ชันแล้ว'), true);
  };
  el.querySelector('#sys-mt-full').onclick = () =>
    ctx.modal.confirm('เริ่มปิดปรับปรุง', 'ผู้ใช้ทุกคน (ยกเว้นผู้ดูแลระบบสูงสุด) จะถูกบังคับออกจากระบบ 10 นาที ยืนยันหรือไม่',
      'เริ่มปิดปรับปรุง', () => run(
        () => ctx.client.rpc('njhr_version_maintenance', {
          p_token: ctx.session.getToken(), p_action: 'start', p_minutes: 10, p_mode: 'full', p_message: null
        }), 'เริ่ม Maintenance แล้ว'), true);
  el.querySelector('#sys-mt-ro').onclick = () => run(
    () => ctx.client.rpc('njhr_version_maintenance', {
      p_token: ctx.session.getToken(), p_action: 'start', p_minutes: 10, p_mode: 'readonly', p_message: null
    }), 'เริ่มโหมดอ่านอย่างเดียวแล้ว');
  el.querySelector('#sys-mt-stop').onclick = () => run(
    () => ctx.client.rpc('njhr_version_maintenance', {
      p_token: ctx.session.getToken(), p_action: 'stop', p_minutes: 10, p_mode: 'full', p_message: null
    }), 'ปิด Maintenance แล้ว');
}

export function unmount() { cleanup.forEach(f => { try { f(); } catch (_) {} }); cleanup = []; }
