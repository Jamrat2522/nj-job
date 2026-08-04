/* HR V2 — modules/settings/settings.js
   3 แท็บ: วันหยุดบริษัท (njhr_holiday_*) · ประเภทการลา (njhr_leave_types/type_save) · ข้อมูลองค์กร (njhr_doc_org/org_save) */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="stp"><div class="v2-tabs">' +
    '<button class="on" data-t="hol">วันหยุดบริษัท</button>' +
    '<button data-t="lt">ประเภทการลา</button>' +
    '<button data-t="org">ข้อมูลองค์กร</button></div>' +
    '<div id="st-body"></div></div>';
  const body = el.querySelector('#st-body');
  let tab = 'hol';
  el.querySelectorAll('.v2-tabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.t;
    el.querySelectorAll('.v2-tabs button').forEach(x => x.classList.toggle('on', x === b));
    load();
  }));

  async function load() {
    ctx.ui.renderLoading(body);
    try {
      if (tab === 'hol') {
        const yr = new Date().getFullYear();
        const rows = await ctx.repo.settings.holidays(yr + '-01-01', yr + '-12-31');
        if (!alive || tab !== 'hol') return;
        body.innerHTML = '<div class="v2-toolbar"><b style="flex:1">วันหยุดปี ' + yr + ' (' + rows.length + ' วัน)</b>' +
          '<button class="btn btn-primary" id="hl-add">+ เพิ่มวันหยุด</button></div><div id="hl-table"></div>';
        renderTable(body.querySelector('#hl-table'), [
          { key: 'holiday_date', label: 'วันที่', render: r => esc(((r.holiday_date || r.date || '') + '').slice(0, 10)) },
          { key: 'name', label: 'ชื่อวันหยุด', render: r => esc(r.name || r.holiday_name || '') },
          { key: '_a', label: '', render: r => '<button class="btn btn-ghost" data-id="' + esc(r.id) + '">ลบ</button>' }
        ], rows, { empty: 'ยังไม่มีวันหยุดปีนี้' });
        body.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
          const r = rows.find(x => String(x.id) === b.dataset.id);
          ctx.assertWrite();
          /* วันหยุดกระทบการคำนวณวันลา/OT ย้อนหลัง — ยืนยันก่อนเสมอ (กฎเดิม holiday_impact) */
          ctx.modal.confirm('ลบวันหยุด', 'ยืนยันลบ "' + (r.name || r.holiday_name || '') + '" — มีผลต่อการคำนวณวันลาและ OT', 'ลบ', async () => {
            try { await ctx.repo.settings.holidayDelete(r.id); ctx.toast.show('ลบวันหยุดแล้ว'); load(); }
            catch (e) { ctx.toast.show(e.message || 'ลบไม่สำเร็จ', 'error'); }
          }, true);
        }));
        body.querySelector('#hl-add').onclick = () => {
          ctx.assertWrite();
          ctx.modal.open('เพิ่มวันหยุดบริษัท',
            field({ id: 'hl-date', label: 'วันที่', type: 'date', required: true }) +
            field({ id: 'hl-name', label: 'ชื่อวันหยุด', required: true }),
            '<button class="btn btn-ghost" id="hl-cancel">ยกเลิก</button><button class="btn btn-primary" id="hl-save">บันทึก</button>');
          const root = document.getElementById('v2-modal-root');
          document.getElementById('hl-cancel').onclick = ctx.modal.close;
          const sb = document.getElementById('hl-save');
          sb.onclick = busyBtn(sb, async () => {
            ctx.assertWrite();
            if (!requireAll(root, ['hl-date', 'hl-name'])) return;
            try {
              await ctx.repo.settings.holidaySave(null, val(root, 'hl-date'), val(root, 'hl-name'));
              ctx.modal.close(); ctx.toast.show('เพิ่มวันหยุดแล้ว'); load();
            } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
          });
        };
      } else if (tab === 'lt') {
        const rows = await ctx.repo.leave.types();
        if (!alive || tab !== 'lt') return;
        body.innerHTML = '<div id="lt-table"></div><p class="hm-sub">โควตาและการนับวัน คำนวณที่ RPC — หน้าจอนี้ตั้งค่าป้าย/เอกสารเท่านั้น</p>';
        renderTable(body.querySelector('#lt-table'), [
          { key: 'code', label: 'รหัส' },
          { key: 'label_th', label: 'ชื่อ (ไทย)', render: r => esc(r.label_th || r.name_th || '') },
          { key: 'need_doc', label: 'ต้องแนบเอกสาร', render: r => r.need_doc ? badge('ต้องแนบ', 'warn') : '-' },
          { key: 'active', label: 'สถานะ', render: r => badge(r.active === false ? 'ปิดใช้' : 'ใช้งาน', r.active === false ? '' : 'ok') },
          { key: '_a', label: '', render: r => '<button class="btn btn-ghost" data-c="' + esc(r.code) + '">แก้ไข</button>' }
        ], rows, { empty: 'ยังไม่มีประเภทการลา' });
        body.querySelectorAll('button[data-c]').forEach(b => b.addEventListener('click', () => {
          const r = rows.find(x => x.code === b.dataset.c);
          ctx.assertWrite();
          ctx.modal.open('แก้ไขประเภทการลา — ' + r.code,
            field({ id: 'lt-label', label: 'ชื่อ (ไทย)', value: r.label_th || r.name_th, required: true }) +
            field({ id: 'lt-color', label: 'สี (hex)', value: r.color }) +
            '<label class="v2-check"><input type="checkbox" id="lt-doc"' + (r.need_doc ? ' checked' : '') + '><span>ต้องแนบเอกสาร</span></label>' +
            field({ id: 'lt-docdays', label: 'ต้องแนบเมื่อลาเกิน (วัน)', type: 'number', value: r.doc_after_days }) +
            '<label class="v2-check"><input type="checkbox" id="lt-active"' + (r.active === false ? '' : ' checked') + '><span>ใช้งาน</span></label>',
            '<button class="btn btn-ghost" id="lt-cancel">ยกเลิก</button><button class="btn btn-primary" id="lt-save">บันทึก</button>');
          const root = document.getElementById('v2-modal-root');
          document.getElementById('lt-cancel').onclick = ctx.modal.close;
          const sb = document.getElementById('lt-save');
          sb.onclick = busyBtn(sb, async () => {
            ctx.assertWrite();
            if (!requireAll(root, ['lt-label'])) return;
            try {
              await ctx.repo.leave.typeSave({ code: r.code, labelTh: val(root, 'lt-label'),
                color: val(root, 'lt-color') || null, needDoc: root.querySelector('#lt-doc').checked,
                docAfterDays: val(root, 'lt-docdays') ? Number(val(root, 'lt-docdays')) : null,
                active: root.querySelector('#lt-active').checked });
              ctx.modal.close(); ctx.toast.show('บันทึกแล้ว'); load();
            } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
          });
        }));
      } else {
        const org = await ctx.repo.hrdocs.org().catch(() => ({}));
        if (!alive || tab !== 'org') return;
        const o = (org && org.data) || org || {};
        body.innerHTML = '<div class="v2-card" style="max-width:640px">' +
          field({ id: 'og-name', label: 'ชื่อบริษัท (ไทย)', value: o.company_name_th || o.name_th }) +
          field({ id: 'og-name-en', label: 'ชื่อบริษัท (อังกฤษ)', value: o.company_name_en || o.name_en }) +
          field({ id: 'og-addr', label: 'ที่อยู่', type: 'textarea', value: o.address }) +
          field({ id: 'og-tax', label: 'เลขผู้เสียภาษี', value: o.tax_id }) +
          field({ id: 'og-tel', label: 'โทรศัพท์', value: o.phone }) +
          '<button class="btn btn-primary" id="og-save">บันทึกข้อมูลองค์กร</button></div>';
        const sb = body.querySelector('#og-save');
        sb.onclick = busyBtn(sb, async () => {
          ctx.assertWrite();
          try {
            await ctx.repo.hrdocs.orgSave({
              company_name_th: val(body, 'og-name') || null, company_name_en: val(body, 'og-name-en') || null,
              address: val(body, 'og-addr') || null, tax_id: val(body, 'og-tax') || null, phone: val(body, 'og-tel') || null });
            ctx.toast.show('บันทึกข้อมูลองค์กรแล้ว');
          } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
        });
      }
    } catch (e) { if (alive) ctx.ui.renderError(body, 'โหลดการตั้งค่าไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  load();
}

export function unmount() { alive = false; }
