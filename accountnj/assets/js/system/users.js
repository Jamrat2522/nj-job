/* ผู้ใช้และสิทธิ์ (SUPER_ADMIN) — เบราว์เซอร์ไม่รู้จักและไม่ส่งตัวตนภายในใด ๆ
   สร้างผู้ใช้ใหม่ผ่าน Edge Function njacc-admin-user (server เป็นผู้สร้าง auth identity แบบ opaque)
   แก้ไขผู้ใช้เดิมผ่าน RPC njacc_admin_upsert_user (safe fields เท่านั้น) */
import { rpc, sb } from '../core/supabase-client.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../core/config.js';
import { AppState } from '../core/state.js';
import { esc } from '../core/formatter.js';
import { openModal, closeModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { once, newRequestId } from '../core/request-manager.js';
import { COMPANY_GROUPS, CHARGE_TYPES } from '../config/charge-groups.js';

const PERMS = [
  ['can_view', 'ดูข้อมูล'], ['can_create', 'เปิดงาน'], ['can_edit', 'แก้ไขงาน'],
  ['can_invoice', 'ออก INVOICE'], ['can_receive_payment', 'รับชำระ'],
  ['can_issue_receipt', 'ออกใบเสร็จ'], ['can_export', 'Export'], ['can_void', 'Void/ยกเลิก'],
  ['can_delete', 'ลบข้อมูล'],
];

export async function render(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>ผู้ใช้และสิทธิ์</h2></div>
      <button class="btn btn-p" id="us-new">+ เพิ่มผู้ใช้</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>รหัสพนักงาน</th><th>ชื่อ</th><th>แผนก</th><th>ชื่อผู้ใช้ (login)</th>
      <th>Role</th><th>สิทธิ์</th><th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="us-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    <p class="t-xs t-3 mt-1">* การตั้ง/เปลี่ยนรหัสผ่านทำใน Supabase Dashboard เท่านั้น (ระบบไม่เก็บรหัสผ่านเอง)</p>`;

  let users = [];
  async function load() {
    try {
      users = await rpc('njacc_admin_list_users');
      cnt.querySelector('#us-tbody').innerHTML = users.length ? users.map(u => `<tr>
        <td>${esc(u.employee_code || '-')}</td>
        <td class="t-b">${esc(u.full_name)}</td>
        <td>${esc(u.department || '-')}</td>
        <td>${esc(u.login_name)}</td>
        <td><span class="us-role ${esc(u.role)}">${esc(u.role)}</span></td>
        <td class="t-xs">${u.role === 'SUPER_ADMIN' ? 'ทุกสิทธิ์' :
          (u.access || []).map(a => esc(a.charge_type) + '/' + esc(a.company_group)).join(', ') || '-'}</td>
        <td>${u.active ? '<span class="bdg bdg-paid">ACTIVE</span>' : '<span class="bdg bdg-void">DISABLED</span>'}</td>
        <td><div class="ch-act"><button class="btn btn-o btn-sm" data-edit="${u.id}">แก้ไข</button></div></td>
      </tr>`).join('') : '<tr><td colspan="8" class="empty">ยังไม่มีผู้ใช้</td></tr>';
    } catch (e) { handleErr(e); }
  }
  cnt.querySelector('#us-new').onclick = () => openEdit(null, load);
  cnt.querySelector('#us-tbody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]'); if (!b) return;
    openEdit(users.find(u => u.id === b.dataset.edit), load);
  });
  load();
}

function openEdit(u, onDone) {
  const isNew = !u;
  /* idempotency key ต่อ 1 ฟอร์ม — กดซ้ำ/เน็ตหลุดแล้วลองใหม่ จะไม่สร้างผู้ใช้ซ้ำ */
  const requestId = newRequestId();
  u = u || { role: 'USER', active: true, access: [] };
  const isSuper = (AppState.profile || {}).role === 'SUPER_ADMIN';
  const accOf = (c, g) => (u.access || []).find(a =>
    (a.charge_type === c || a.charge_type === '*') && (a.company_group === g || a.company_group === '*')) || {};

  const gridRows = [];
  for (const c of CHARGE_TYPES) for (const g of COMPANY_GROUPS) {
    const a = accOf(c.key, g.key);
    gridRows.push(`<tr data-c="${c.key}" data-g="${g.key}">
      <td class="t-xs nowrap">${c.key} · ${g.key}</td>
      ${PERMS.map(([k]) => `<td class="center"><input type="checkbox" data-p="${k}" ${a[k] ? 'checked' : ''}></td>`).join('')}
    </tr>`);
  }

  const b = document.createElement('div');
  b.innerHTML = `
    <div class="fgrid">
      <div class="fld"><label>รหัสพนักงาน</label><input class="inp" id="ue-code" value="${esc(u.employee_code || '')}" ${isNew ? '' : 'disabled'}></div>
      <div class="fld"><label>ชื่อ-นามสกุล <span class="req">*</span></label><input class="inp" id="ue-name" value="${esc(u.full_name || '')}"></div>
      <div class="fld"><label>แผนก</label><input class="inp" id="ue-dept" value="${esc(u.department || '')}"></div>
      <div class="fld"><label>ชื่อผู้ใช้ login <span class="req">*</span></label>
        <input class="inp" id="ue-login" value="${esc(u.login_name || '')}" ${isNew ? '' : 'disabled'}></div>
      <div class="fld"><label>Role</label>
        <select class="sel" id="ue-role" ${isSuper ? '' : 'disabled'}>
          <option value="USER" ${u.role === 'USER' ? 'selected' : ''}>USER</option>
          <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          <option value="SUPER_ADMIN" ${u.role === 'SUPER_ADMIN' ? 'selected' : ''}>SUPER_ADMIN</option>
        </select></div>
      <div class="fld"><label>สถานะ</label>
        <select class="sel" id="ue-active">
          <option value="true" ${u.active ? 'selected' : ''}>ACTIVE</option>
          <option value="false" ${!u.active ? 'selected' : ''}>DISABLED</option></select></div>
    </div>
    <div class="fsec"><div class="fsec-t">สิทธิ์ราย charge × บริษัท (ไม่ใช้กับ SUPER_ADMIN)</div>
    <div class="tbl-wrap" style="max-height:320px"><table class="tbl"><thead><tr>
      <th>เมนู</th>${PERMS.map(([, lb]) => `<th class="center t-xs">${lb}</th>`).join('')}
    </tr></thead><tbody>${gridRows.join('')}</tbody></table></div></div>
    ${isNew ? `<p class="t-xs t-3 mt-1">ระบบจะสร้างบัญชีเข้าใช้งานฝั่งเซิร์ฟเวอร์โดยไม่สร้างรหัสผ่าน
      ผู้ดูแลต้องตั้งรหัสผ่านผ่าน Supabase Dashboard หรือ Password Activation Flow เมื่อระบบรองรับ</p>` : ''}`;
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
    <button class="btn btn-p" id="ue-save">บันทึก</button>`;
  openModal({ title: isNew ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้ ' + esc(u.full_name), body: b, footer: f, large: true });

  f.querySelector('#ue-save').onclick = async (e) => {
    const name = b.querySelector('#ue-name').value.trim();
    const login = b.querySelector('#ue-login').value.trim();
    if (!name || !login) { toast('กรอกชื่อและชื่อผู้ใช้', 'err'); return; }
    const access = [...b.querySelectorAll('tbody tr')].map(tr => {
      const row = { charge_type: tr.dataset.c, company_group: tr.dataset.g };
      let any = false;
      PERMS.forEach(([k]) => { row[k] = tr.querySelector(`[data-p="${k}"]`).checked; if (row[k]) any = true; });
      return any ? row : null;
    }).filter(Boolean);
    /* payload ปลอดภัย — ไม่มี internal identity ใด ๆ ออกจากเบราว์เซอร์ */
    const safe = {
      employee_code: b.querySelector('#ue-code').value.trim() || null,
      full_name: name,
      department: b.querySelector('#ue-dept').value.trim() || null,
      login_name: login,
      role: b.querySelector('#ue-role').value,
      active: b.querySelector('#ue-active').value === 'true',
      access,
    };
    btnBusy(e.target, true);
    try {
      if (isNew) {
        const res = await once('create-user', () => createUserViaServer(safe, requestId));
        closeModal();
        if (res.status === 'ALREADY_CREATED') {
          toast('ผู้ใช้นี้ถูกสร้างไว้แล้วจากคำขอเดียวกัน — ไม่ได้สร้างซ้ำ', 'ok');
        } else {
          showCreated(res);
        }
      } else {
        await once('save-user', () => rpc('njacc_admin_upsert_user', { p: { id: u.id, ...safe } }));
        closeModal(); toast('บันทึกผู้ใช้แล้ว', 'ok');
      }
      onDone();
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}

/* สร้างผู้ใช้ใหม่ผ่าน Edge Function — server เป็นผู้สร้าง auth identity และ auth user */
const CREATE_ERR = {
  FORBIDDEN: 'เฉพาะ SUPER_ADMIN เท่านั้นที่เพิ่มผู้ใช้ได้',
  LOGIN_EXISTS: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่น',
  EMPLOYEE_CODE_EXISTS: 'รหัสพนักงานนี้ถูกใช้แล้ว',
  DUPLICATE_REQUEST: 'คำขอนี้กำลังถูกดำเนินการอยู่ กรุณารอสักครู่แล้วตรวจรายชื่อผู้ใช้',
  MISSING_FIELDS: 'กรอกข้อมูลที่จำเป็นให้ครบ',
  BAD_ROLE: 'Role ไม่ถูกต้อง',
  BAD_REQUEST_ID: 'คำขอไม่ถูกต้อง กรุณาปิดหน้าต่างแล้วลองใหม่',
  CREATE_AUTH_USER_FAILED: 'สร้างบัญชีเข้าใช้งานไม่สำเร็จ ระบบยกเลิกรายการให้แล้ว — ลองใหม่ได้',
  LINK_FAILED_CLEANUP_PENDING: 'สร้างไม่สำเร็จและเก็บกวาดไม่ครบ — ระบบเก็บรายการไว้ให้ผู้ดูแลตรวจสอบ (สถานะ FAILED_CLEANUP)',
  AUTH_SERVICE_UNAVAILABLE: 'ระบบยืนยันตัวตนไม่ตอบสนอง ระบบยกเลิกรายการให้แล้ว — ลองใหม่อีกครั้ง',
  AUTH_IDENTITY_FAILED: 'เตรียมบัญชีไม่สำเร็จ ระบบยกเลิกรายการให้แล้ว — ลองใหม่ได้',
  AUTH_IDENTITY_CONFLICT: 'บัญชีเข้าใช้งานนี้ถูกใช้กับผู้ใช้รายอื่นแล้ว — ต้องให้ผู้ดูแลตรวจสอบก่อน',
  AUTH_IDENTITY_AMBIGUOUS: 'พบบัญชีเข้าใช้งานซ้ำในระบบยืนยันตัวตน — ต้องให้ผู้ดูแลตรวจสอบก่อน',
  NJACC_CREATE_USER_USE_EDGE: 'สร้างผู้ใช้ต้องทำผ่านหน้าเพิ่มผู้ใช้เท่านั้น',
  NJACC_USER_NOT_PROVISIONED: 'เปิดใช้งานไม่ได้ — ผู้ใช้รายนี้ยังตั้งบัญชีเข้าใช้งานไม่เสร็จ',
  NJACC_LAST_SUPER_ADMIN: 'ต้องเหลือ SUPER_ADMIN ที่ใช้งานได้อย่างน้อย 1 คน',
  LINK_FAILED: 'เชื่อมบัญชีไม่สำเร็จ ระบบยกเลิกรายการให้แล้ว — ลองใหม่ได้',
};

/* สร้างผู้ใช้ใหม่ผ่าน Edge Function — server สร้าง auth identity/auth user และจัดการ rollback เอง */
async function createUserViaServer(safe, requestId) {
  const { data } = await sb().auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  let res;
  try {
    res = await fetch(SUPABASE_URL + '/functions/v1/njacc-admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token },
      body: JSON.stringify({ ...safe, request_id: requestId }),
    });
  } catch (e) {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — กดบันทึกอีกครั้งได้ ระบบจะไม่สร้างผู้ใช้ซ้ำ');
  }
  let out = null;
  try { out = await res.json(); } catch (e) { out = null; }
  if (!res.ok || !out || !(out.status === 'CREATED' || out.status === 'ALREADY_CREATED')) {
    if (res.status === 404) throw new Error('ยังไม่ได้ติดตั้ง Edge Function njacc-admin-user (ดู README)');
    const code = out && out.error ? out.error : '';
    throw new Error(CREATE_ERR[code] || 'สร้างผู้ใช้ไม่สำเร็จ กรุณาลองใหม่');
  }
  return out;
}

/* แจ้งผลสำเร็จ — ไม่มีรหัสผ่านใด ๆ ผ่านเบราว์เซอร์ */
function showCreated(res) {
  const pf = res.profile || {};
  const b = document.createElement('div');
  b.innerHTML = `<p>สร้างผู้ใช้ <b>${esc(pf.login_name || '')}</b> (${esc(pf.full_name || '')}) เรียบร้อย</p>
    <p class="t-sm t-2 mt-2">ขั้นตอนถัดไป: ผู้ดูแลระบบต้องตั้งรหัสผ่านให้ผู้ใช้รายนี้
      ผ่าน Supabase Dashboard → Authentication → Users (หรือ reset-password flow)</p>
    <p class="t-xs t-3 mt-1">ระบบไม่สร้างและไม่ส่งรหัสผ่านผ่านหน้าจอนี้โดยเจตนา
      — ดูอีเมลบัญชีของผู้ใช้ได้จาก SQL Editor (009 VERIFICATION ข้อ 6)</p>`;
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-p" data-close>ปิด</button>`;
  openModal({ title: 'สร้างผู้ใช้สำเร็จ', body: b, footer: f });
}
