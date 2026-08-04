/* HR V2 — modules/geofence/geofence.js (SUPER_ADMIN เท่านั้น — ตาม ROUTES)
   njhr_gf_list / gf_save / gf_delete — รัศมีเมตร ตรวจจริงที่ RPC ตอนลงเวลา */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="gfp"><div class="v2-toolbar">' +
    '<span class="grow"></span><button class="btn btn-primary" id="gf-add">+ เพิ่มพื้นที่</button>' +
    '</div><div id="gf-table"></div></div>';
  const tableEl = el.querySelector('#gf-table');

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.geofence.list(null);
      if (!alive) return;
      renderTable(tableEl, [
        { key: 'name', label: 'ชื่อพื้นที่' },
        { key: 'lat', label: 'พิกัด', render: r => esc((r.lat != null ? Number(r.lat).toFixed(6) : '-') + ', ' + (r.lng != null ? Number(r.lng).toFixed(6) : '-')) },
        { key: 'radius', label: 'รัศมี (ม.)' },
        { key: 'active', label: 'สถานะ', render: r => badge(r.active === false ? 'ปิดใช้' : 'ใช้งาน', r.active === false ? '' : 'ok') },
        { key: '_a', label: '', render: r =>
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.id) + '">แก้ไข</button> ' +
          '<button class="btn btn-ghost" data-act="del" data-id="' + esc(r.id) + '">ลบ</button>' }
      ], rows, { empty: 'ยังไม่มีพื้นที่ลงเวลา' });
      tableEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const r = rows.find(x => String(x.id) === b.dataset.id);
        ctx.assertWrite();
        if (b.dataset.act === 'edit') openForm(r);
        else ctx.modal.confirm('ลบพื้นที่', 'ยืนยันลบพื้นที่ "' + (r.name || '') + '" — พนักงานที่ผูกพื้นที่นี้จะลงเวลาไม่ได้จนกว่าจะผูกใหม่',
          'ลบพื้นที่', async () => {
            try { await ctx.repo.geofence.del(r.id, true); ctx.toast.show('ลบพื้นที่แล้ว'); load(); }
            catch (e) { ctx.toast.show(e.message || 'ลบไม่สำเร็จ', 'error'); }
          }, true);
      }));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดพื้นที่ไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#gf-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  function openForm(r) {
    const isNew = !r; r = r || {};
    ctx.modal.open(isNew ? 'เพิ่มพื้นที่ลงเวลา' : 'แก้ไขพื้นที่ — ' + (r.name || ''),
      field({ id: 'gf-name', label: 'ชื่อพื้นที่', value: r.name, required: true }) +
      field({ id: 'gf-addr', label: 'ที่อยู่', value: r.address }) +
      '<div class="v2-grid2">' +
      field({ id: 'gf-lat', label: 'Latitude', type: 'number', step: '0.000001', value: r.lat, required: true }) +
      field({ id: 'gf-lng', label: 'Longitude', type: 'number', step: '0.000001', value: r.lng, required: true }) +
      field({ id: 'gf-radius', label: 'รัศมี (เมตร)', type: 'number', value: r.radius != null ? r.radius : 150, required: true }) +
      field({ id: 'gf-acc', label: 'ความแม่นยำสูงสุด (เมตร)', type: 'number', value: r.max_accuracy }) +
      '</div>' +
      '<button type="button" class="btn btn-ghost" id="gf-here">📍 ใช้ตำแหน่งปัจจุบันของฉัน</button>',
      '<button class="btn btn-ghost" id="gf-cancel">ยกเลิก</button><button class="btn btn-primary" id="gf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    root.querySelector('#gf-here').onclick = () => {
      if (!navigator.geolocation) return ctx.toast.show('อุปกรณ์ไม่รองรับ GPS', 'warn');
      navigator.geolocation.getCurrentPosition(p => {
        root.querySelector('#gf-lat').value = p.coords.latitude;
        root.querySelector('#gf-lng').value = p.coords.longitude;
      }, () => ctx.toast.show('อ่านตำแหน่งไม่สำเร็จ', 'error'));
    };
    document.getElementById('gf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('gf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['gf-name', 'gf-lat', 'gf-lng', 'gf-radius'])) return;
      try {
        await ctx.repo.geofence.save({ id: isNew ? null : r.id, name: val(root, 'gf-name'),
          address: val(root, 'gf-addr') || null, lat: Number(val(root, 'gf-lat')), lng: Number(val(root, 'gf-lng')),
          radius: Number(val(root, 'gf-radius')), maxAccuracy: val(root, 'gf-acc') ? Number(val(root, 'gf-acc')) : null });
        ctx.modal.close(); ctx.toast.show('บันทึกพื้นที่แล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
