/* ข้อมูลหลัก (ADMIN+): ลูกค้า / บริษัท Invoice / รหัสค่าบริการ
   masters() คืนทุกแถวพร้อม field ครบ + active flag
   upsert keys ตรง RPC: customer → customer_name/customer_code/tax_id/branch_code/address/
   contact_name/email/phone/credit_term_days/active · company → company_name/company_code/active
   service_code → id(ตอนแก้)/code/description/default_charge/default_cost/vat_applicable/wht_applicable/active */
import { upsertCustomer, upsertCompany, upsertServiceCode } from './master-api.js';
import { masters } from './master-cache.js';
import { AppState } from '../core/state.js';
import { esc, money } from '../core/formatter.js';
import { openModal, closeModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { once } from '../core/request-manager.js';

let tab = 'customers';

export async function render(cnt, params = {}) {
  if (params.tab && ['customers','companies','service_codes'].includes(params.tab)) tab = params.tab;
  await masters(true);
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>ข้อมูลหลัก</h2></div>
      <div class="row">
        <button class="btn btn-o" id="ms-back">← กลับ</button>
        <button class="btn btn-p" id="ms-new">+ เพิ่มรายการ</button></div></div>
    <div class="rep-tabs">
      <button class="rep-tab ${tab === 'customers' ? 'active' : ''}" data-tab="customers">ลูกค้า</button>
      <button class="rep-tab ${tab === 'companies' ? 'active' : ''}" data-tab="companies">บริษัท Invoice</button>
      <button class="rep-tab ${tab === 'service_codes' ? 'active' : ''}" data-tab="service_codes">รหัสค่าบริการ</button>
    </div>
    <div id="ms-body"></div>`;
  cnt.querySelector('.rep-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab;
    cnt.querySelectorAll('.rep-tab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
    drawTable(cnt);
  });
  cnt.querySelector('#ms-back').onclick = () => history.back();
  cnt.querySelector('#ms-new').onclick = () => openEdit(cnt, null);
  cnt.querySelector('#ms-body').addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]'); if (!b) return;
    const list = AppState.masters[tab] || [];
    openEdit(cnt, list.find(x => x.id === b.dataset.edit));
  });
  drawTable(cnt);
}

function drawTable(cnt) {
  const body = cnt.querySelector('#ms-body');
  const m = AppState.masters;
  const stBdg = (a) => a !== false
    ? '<span class="bdg bdg-paid">ACTIVE</span>' : '<span class="bdg bdg-void">DISABLED</span>';
  if (tab === 'customers') {
    body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>ชื่อลูกค้า</th><th>เลขผู้เสียภาษี</th><th>สาขา</th><th>Credit Term</th><th>ติดต่อ</th><th>สถานะ</th><th></th>
    </tr></thead><tbody>${(m.customers || []).map(c => `<tr>
      <td class="t-b">${esc(c.name)}</td><td>${esc(c.tax_id || '-')}</td><td>${esc(c.branch_code || '-')}</td>
      <td>${c.credit_term_days != null ? c.credit_term_days + ' วัน' : '-'}</td>
      <td class="t-xs">${esc(c.contact_name || '-')} ${esc(c.phone || '')}</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">แก้ไข</button></td></tr>`).join('') ||
      '<tr><td colspan="7" class="empty">ยังไม่มีลูกค้า — กด "+ เพิ่มรายการ"</td></tr>'}</tbody></table></div>`;
  } else if (tab === 'companies') {
    body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>ชื่อบริษัท</th><th>รหัส</th><th>สถานะ</th><th></th>
    </tr></thead><tbody>${(m.companies || []).map(c => `<tr>
      <td class="t-b">${esc(c.name)}</td><td>${esc(c.code || '-')}</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">แก้ไข</button></td></tr>`).join('') ||
      '<tr><td colspan="4" class="empty">ยังไม่มีบริษัท Invoice</td></tr>'}</tbody></table></div>`;
  } else {
    body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>รหัส</th><th>รายละเอียด</th><th class="r">ราคาเริ่มต้น</th><th>VAT</th><th>WHT</th><th>สถานะ</th><th></th>
    </tr></thead><tbody>${(m.service_codes || []).map(c => `<tr>
      <td class="t-b">${esc(c.code)}</td><td>${esc(c.description)}</td>
      <td class="r">${c.default_charge != null ? money(c.default_charge) : '-'}</td>
      <td>${c.vat_applicable !== false ? '✓' : '—'}</td><td>${c.wht_applicable ? '✓' : '—'}</td>
      <td>${stBdg(c.active)}</td>
      <td><button class="btn btn-o btn-sm" data-edit="${c.id}">แก้ไข</button></td></tr>`).join('') ||
      '<tr><td colspan="7" class="empty">ยังไม่มีรหัสค่าบริการ</td></tr>'}</tbody></table></div>`;
  }
}

function openEdit(cnt, row) {
  const isNew = !row; row = row || {};
  const b = document.createElement('div');
  const activeSel = `<select class="sel" id="me-active">
    <option value="true" ${row.active !== false ? 'selected' : ''}>ACTIVE</option>
    <option value="false" ${row.active === false ? 'selected' : ''}>DISABLED</option></select>`;
  if (tab === 'customers') {
    b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>ชื่อลูกค้า <span class="req">*</span></label><input class="inp" id="me-name" value="${esc(row.name || '')}"></div>
      <div class="fld"><label>รหัสลูกค้า</label><input class="inp" id="me-code" value="${esc(row.code || '')}"></div>
      <div class="fld"><label>เลขผู้เสียภาษี</label><input class="inp" id="me-tax" value="${esc(row.tax_id || '')}"></div>
      <div class="fld"><label>รหัสสาขา</label><input class="inp" id="me-branch" value="${esc(row.branch_code || '')}"></div>
      <div class="fld"><label>Credit Term (วัน)</label><input class="inp" type="number" min="0" id="me-term" value="${row.credit_term_days ?? ''}"></div>
      <div class="fld"><label>ผู้ติดต่อ</label><input class="inp" id="me-contact" value="${esc(row.contact_name || '')}"></div>
      <div class="fld"><label>โทร</label><input class="inp" id="me-phone" value="${esc(row.phone || '')}"></div>
      <div class="fld"><label>อีเมล</label><input class="inp" id="me-email" value="${esc(row.email || '')}"></div>
      <div class="fld"><label>สถานะ</label>${activeSel}</div>
    </div>
    <div class="fld mt-2"><label>ที่อยู่</label><textarea class="inp w100" id="me-addr">${esc(row.address || '')}</textarea></div>`;
  } else if (tab === 'companies') {
    b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>ชื่อบริษัท <span class="req">*</span></label><input class="inp" id="me-name" value="${esc(row.name || '')}"></div>
      <div class="fld"><label>รหัสบริษัท</label><input class="inp" id="me-code" value="${esc(row.code || '')}"></div>
      <div class="fld"><label>Contact (LIST NAME)</label>
        <input class="inp" id="me-contact" value="${esc(row.contact_name || '')}"></div>
      <div class="fld"><label>สถานะ</label>${activeSel}</div>
    </div>`;
  } else {
    b.innerHTML = `<div class="fgrid">
      <div class="fld"><label>รหัส <span class="req">*</span></label><input class="inp" id="me-code" value="${esc(row.code || '')}"></div>
      <div class="fld"><label>รายละเอียด <span class="req">*</span></label><input class="inp" id="me-desc" value="${esc(row.description || '')}"></div>
      <div class="fld"><label>ราคาเริ่มต้น (charge)</label><input class="inp" type="number" step="0.01" min="0" id="me-charge" value="${row.default_charge ?? ''}"></div>
      <div class="fld"><label>ต้นทุนเริ่มต้น (cost)</label><input class="inp" type="number" step="0.01" min="0" id="me-cost" value="${row.default_cost ?? ''}"></div>
      <div class="fld"><label>คิด VAT</label><select class="sel" id="me-vat">
        <option value="true" ${row.vat_applicable !== false ? 'selected' : ''}>ใช่</option>
        <option value="false" ${row.vat_applicable === false ? 'selected' : ''}>ไม่</option></select></div>
      <div class="fld"><label>เข้าเกณฑ์ WHT</label><select class="sel" id="me-wht">
        <option value="false" ${!row.wht_applicable ? 'selected' : ''}>ไม่</option>
        <option value="true" ${row.wht_applicable ? 'selected' : ''}>ใช่</option></select></div>
      <div class="fld"><label>สถานะ</label>${activeSel}</div>
    </div>`;
  }
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
    <button class="btn btn-p" id="me-save">บันทึก</button>`;
  const titles = { customers: 'ลูกค้า', companies: 'บริษัท Invoice', service_codes: 'รหัสค่าบริการ' };
  openModal({ title: (isNew ? 'เพิ่ม' : 'แก้ไข') + titles[tab], body: b, footer: f, large: true });

  f.querySelector('#me-save').onclick = async (e) => {
    btnBusy(e.target, true);
    try {
      if (tab === 'customers') {
        const name = b.querySelector('#me-name').value.trim();
        if (!name) { toast('กรอกชื่อลูกค้า', 'err'); btnBusy(e.target, false); return; }
        await once('ms-save', () => upsertCustomer({
          id: row.id || null,
          customer_name: name,
          customer_code: b.querySelector('#me-code').value.trim() || null,
          tax_id: b.querySelector('#me-tax').value.trim() || null,
          branch_code: b.querySelector('#me-branch').value.trim() || null,
          address: b.querySelector('#me-addr').value.trim() || null,
          contact_name: b.querySelector('#me-contact').value.trim() || null,
          phone: b.querySelector('#me-phone').value.trim() || null,
          email: b.querySelector('#me-email').value.trim() || null,
          credit_term_days: b.querySelector('#me-term').value !== '' ? Number(b.querySelector('#me-term').value) : null,
          active: b.querySelector('#me-active').value === 'true',
        }));
      } else if (tab === 'companies') {
        const name = b.querySelector('#me-name').value.trim();
        if (!name) { toast('กรอกชื่อบริษัท', 'err'); btnBusy(e.target, false); return; }
        await once('ms-save', () => upsertCompany({
          id: row.id || null,
          company_name: name,
          company_code: b.querySelector('#me-code').value.trim() || null,
          contact_name: b.querySelector('#me-contact').value.trim() || null,
          active: b.querySelector('#me-active').value === 'true',
        }));
      } else {
        const code = b.querySelector('#me-code').value.trim();
        const desc = b.querySelector('#me-desc').value.trim();
        if (!code || !desc) { toast('กรอกรหัสและรายละเอียด', 'err'); btnBusy(e.target, false); return; }
        await once('ms-save', () => upsertServiceCode({
          id: row.id || null,
          code, description: desc,
          default_charge: b.querySelector('#me-charge').value !== '' ? Number(b.querySelector('#me-charge').value) : null,
          default_cost: b.querySelector('#me-cost').value !== '' ? Number(b.querySelector('#me-cost').value) : null,
          vat_applicable: b.querySelector('#me-vat').value === 'true',
          wht_applicable: b.querySelector('#me-wht').value === 'true',
          active: b.querySelector('#me-active').value === 'true',
        }));
      }
      closeModal(); toast('บันทึกแล้ว', 'ok');
      await masters(true);
      render(cnt);
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
