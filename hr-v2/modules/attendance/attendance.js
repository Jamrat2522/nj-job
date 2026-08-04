/* HR V2 — modules/attendance/attendance.js
   njhr_att_today / att_punch (GPS + geofence ตรวจที่เซิร์ฟเวอร์) / att_correction_submit / att_correction_list
   กฎเดิม: เวลาอ้างเซิร์ฟเวอร์ (RPC ใช้ now() เมื่อ p_at null) · geofence ตรวจใน RPC ไม่เชื่อ browser */
import { renderTable, statusBadge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false, clockTimer = null;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="attp">' +
    '<div class="v2-card attp-clock"><div class="mb-lbl">เวลาปัจจุบัน (Asia/Bangkok)</div>' +
    '<div class="attp-now" id="att-now">--:--:--</div>' +
    '<div id="att-today" style="margin-top:8px"></div>' +
    '<div class="attp-btns"><button class="btn btn-primary" id="att-in">ลงเวลาเข้า</button>' +
    '<button class="btn btn-ghost" id="att-out">ลงเวลาออก</button></div>' +
    '<p class="hm-sub" id="att-gps">ระบบจะขอตำแหน่ง GPS ตอนกดลงเวลา — ตรวจพื้นที่ที่เซิร์ฟเวอร์</p></div>' +
    '<div class="v2-card"><div style="display:flex;align-items:center;gap:10px">' +
    '<h3 style="flex:1">คำขอแก้ไขเวลา</h3><button class="btn btn-ghost" id="attc-add">+ ขอแก้ไขเวลา</button></div>' +
    '<div id="attc-list"></div></div></div>';

  /* นาฬิกา: อิงเวลาเซิร์ฟเวอร์จาก njhr_version_status แล้วเดินต่อในเครื่อง (แสดงผลเท่านั้น) */
  let offset = 0;
  ctx.client.rpc('njhr_version_status', {}).then(s => { offset = new Date(s.server_time) - Date.now(); }).catch(() => {});
  const tick = () => {
    const now = el.querySelector('#att-now');
    if (!now) return;
    now.textContent = new Date(Date.now() + offset).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false });
  };
  tick(); clockTimer = setInterval(tick, 1000);

  const todayEl = el.querySelector('#att-today');
  async function loadToday() {
    try {
      const t = await ctx.repo.attendance.today();
      if (!alive) return;
      todayEl.innerHTML =
        '<div class="v2-kv"><span class="k">เข้างานวันนี้</span><span class="v">' + esc((t && t.check_in) ? String(t.check_in).slice(11, 16) : '—') + '</span></div>' +
        '<div class="v2-kv"><span class="k">ออกงานวันนี้</span><span class="v">' + esc((t && t.check_out) ? String(t.check_out).slice(11, 16) : '—') + '</span></div>' +
        (t && t.status ? '<div class="v2-kv"><span class="k">สถานะ</span><span class="v">' + statusBadge(t.status) + '</span></div>' : '');
    } catch (e) { if (alive) todayEl.innerHTML = '<p class="hm-sub">' + esc(e.message) + '</p>'; }
  }

  function getGPS() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('อุปกรณ์นี้ไม่รองรับ GPS'));
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => rej(new Error('ไม่สามารถอ่านตำแหน่ง GPS — กรุณาเปิดสิทธิ์ตำแหน่ง')),
        { enableHighAccuracy: true, timeout: 12000 });
    });
  }

  async function punch(action, btn) {
    ctx.assertWrite();
    btn.disabled = true;
    try {
      const g = await getGPS();
      /* p_at = null → เซิร์ฟเวอร์ใช้ now() เอง (ไม่เชื่อนาฬิกาเครื่อง) · geofence ตรวจใน RPC */
      const r = await ctx.repo.attendance.punch(action, null, g.lat, g.lng, g.accuracy);
      ctx.toast.show(r && r.message ? r.message : (action === 'IN' ? 'ลงเวลาเข้าแล้ว' : 'ลงเวลาออกแล้ว'));
      loadToday();
    } catch (e) { if (!e.silent) ctx.toast.show(e.message || 'ลงเวลาไม่สำเร็จ', 'error'); }
    finally { btn.disabled = false; }
  }
  el.querySelector('#att-in').addEventListener('click', function () { punch('IN', this); });
  el.querySelector('#att-out').addEventListener('click', function () { punch('OUT', this); });

  const listEl = el.querySelector('#attc-list');
  async function loadCorrections() {
    ctx.ui.renderLoading(listEl);
    try {
      const rows = await ctx.repo.attendance.correctionList({ limit: 10, offset: 0 });
      if (!alive) return;
      renderTable(listEl, [
        { key: 'work_date', label: 'วันที่', render: r => esc((r.work_date || '').slice(0, 10)) },
        { key: 'requested_check_in', label: 'เข้า(ใหม่)', render: r => esc((r.requested_check_in || '').slice(11, 16) || '-') },
        { key: 'requested_check_out', label: 'ออก(ใหม่)', render: r => esc((r.requested_check_out || '').slice(11, 16) || '-') },
        { key: 'reason', label: 'เหตุผล' },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
      ], rows, { empty: 'ยังไม่มีคำขอแก้ไขเวลา' });
    } catch (e) { if (alive) ctx.ui.renderError(listEl, 'โหลดไม่สำเร็จ', loadCorrections, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#attc-add').addEventListener('click', () => {
    ctx.assertWrite();
    ctx.modal.open('ขอแก้ไขเวลา',
      field({ id: 'c-date', label: 'วันที่ทำงาน', type: 'date', required: true }) +
      '<div class="v2-grid2">' +
      field({ id: 'c-in', label: 'เวลาเข้าที่ถูกต้อง', type: 'time' }) +
      field({ id: 'c-out', label: 'เวลาออกที่ถูกต้อง', type: 'time' }) +
      '</div>' +
      field({ id: 'c-reason', label: 'เหตุผล', type: 'textarea', required: true }),
      '<button class="btn btn-ghost" id="c-cancel">ยกเลิก</button><button class="btn btn-primary" id="c-save">ส่งคำขอ</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    document.getElementById('c-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('c-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['c-date', 'c-reason'])) return;
      const d = val(root, 'c-date'), ci = val(root, 'c-in'), co = val(root, 'c-out');
      if (!ci && !co) { ctx.toast.show('กรอกเวลาเข้าหรือออกอย่างน้อย 1 ช่อง', 'warn'); return; }
      try {
        await ctx.repo.attendance.correctionSubmit({ workDate: d,
          checkIn: ci ? d + 'T' + ci + ':00+07:00' : null,
          checkOut: co ? d + 'T' + co + ':00+07:00' : null,
          reason: val(root, 'c-reason') });
        ctx.modal.close(); ctx.toast.show('ส่งคำขอแก้ไขเวลาแล้ว'); loadCorrections();
      } catch (e) { ctx.toast.show(e.message || 'ส่งไม่สำเร็จ', 'error'); }
    });
  });

  loadToday();
  loadCorrections();
}

export function unmount() { alive = false; if (clockTimer) { clearInterval(clockTimer); clockTimer = null; } }
