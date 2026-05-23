// =========================================================
// users.js — Users management view (SUPER_ADMIN only)
// =========================================================

import { sb } from './supabase.js';
import { S } from './state.js';
import {
  $, esc, refreshIcons, fmtDateTime, openModal, closeModal,
  toast, confirmAction, avatar
} from './utils.js';
import { canViewUsersPage } from './permissions.js';

let _editingUserId = null;

export function renderUsersView(){
  if(!canViewUsersPage()){
    $('view-root').innerHTML = '<div class="content"><div class="empty">ไม่มีสิทธิ์เข้าถึงหน้านี้</div></div>';
    return;
  }
  const pending = S.users.filter(u => u.status === 'pending');
  const active = S.users.filter(u => u.status === 'active');
  const disabled = S.users.filter(u => u.status === 'disabled');

  $('view-root').innerHTML = `
    <div class="topbar">
      <div><h1>ผู้ใช้งาน</h1><p class="sub">ทั้งหมด ${S.users.length} คน · รออนุมัติ ${pending.length}</p></div>
    </div>
    <div class="content">
      ${pending.length ? `
        <div class="panel" style="margin-bottom:18px;border-color:rgba(245,158,11,.3)">
          <div class="panel-head"><h3 style="color:#FCD34D"><i data-lucide="hourglass" style="display:inline;width:16px;height:16px"></i> รออนุมัติ (${pending.length})</h3></div>
          <div style="overflow-x:auto"><table class="tbl">
            <thead><tr><th>ชื่อ</th><th>Username</th><th>แผนก</th><th>สมัครเมื่อ</th><th>การจัดการ</th></tr></thead>
            <tbody>${pending.map(userRow).join('')}</tbody>
          </table></div>
        </div>` : ''}

      <div class="panel">
        <div class="panel-head"><h3>ผู้ใช้ทั้งหมด (${active.length + disabled.length})</h3></div>
        <div style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>ชื่อ</th><th>Username</th><th>แผนก</th><th>สิทธิ์</th><th>สถานะ</th><th>การจัดการ</th></tr></thead>
          <tbody>${[...active, ...disabled].map(userRow).join('') || '<tr><td colspan="6" class="empty">ไม่มีผู้ใช้</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>`;
  refreshIcons();
}

function userRow(u){
  const isPending = u.status === 'pending';
  const actions = isPending ? `
    <button class="row-act ra-view" data-uact="approve" data-id="${esc(u.id)}" title="อนุมัติ"><i data-lucide="check"></i></button>
    <button class="row-act ra-delete" data-uact="reject" data-id="${esc(u.id)}" title="ปฏิเสธ"><i data-lucide="x"></i></button>` : `
    <button class="row-act ra-edit" data-uact="edit" data-id="${esc(u.id)}" title="แก้ไข"><i data-lucide="pencil"></i></button>
    <button class="row-act ra-delete" data-uact="delete" data-id="${esc(u.id)}" title="ลบ"><i data-lucide="trash-2"></i></button>`;
  return `<tr>
    <td data-label="ชื่อ"><div style="display:flex;align-items:center;gap:10px">${avatar(u.full_name || u.username, u.avatar_color)}<div><div style="font-weight:600">${esc(u.full_name || u.username)}</div><div style="color:var(--muted);font-size:12px">${esc(u.email || '')}</div></div></div></td>
    <td data-label="Username"><code style="font-family:'Inter',monospace;font-size:12.5px">${esc(u.username)}</code></td>
    <td data-label="แผนก">${esc(u.department || '—')}</td>
    ${isPending ? `<td data-label="สมัครเมื่อ">${esc(fmtDateTime(u.created_at))}</td>` : `<td data-label="สิทธิ์"><span class="role-badge r-${u.role}">${esc(u.role.replace('_',' '))}</span></td>`}
    ${isPending ? '' : `<td data-label="สถานะ"><span class="s-${u.status}">${esc(u.status)}</span></td>`}
    <td data-label="การจัดการ"><div class="row-actions">${actions}</div></td>
  </tr>`;
}

export async function approveUser(userId){
  try {
    const { error } = await sb.from('users').update({ status: 'active' }).eq('id', userId);
    if(error) throw error;
    toast('อนุมัติเรียบร้อย', 'success');
  } catch(e){ toast(e.message || 'อนุมัติไม่สำเร็จ', 'error'); }
}

export function rejectUser(userId){
  confirmAction(
    'ปฏิเสธ',
    'ปฏิเสธคำขอสมัครนี้?',
    async () => {
      const { error } = await sb.from('users').delete().eq('id', userId);
      if(error) throw error;
      toast('ปฏิเสธเรียบร้อย', 'success');
    },
    'ปฏิเสธ', true
  );
}

export function openUserEdit(userId){
  const u = S.users.find(x => x.id === userId);
  if(!u) return;
  _editingUserId = userId;
  $('usr-title').textContent = 'แก้ไขผู้ใช้';
  $('usr-username').value = u.username || '';
  $('usr-fullname').value = u.full_name || '';
  $('usr-email').value = u.email || '';
  $('usr-department').value = u.department || '';
  $('usr-role').value = u.role || 'STAFF';
  $('usr-status').value = u.status || 'active';
  $('usr-newpw').value = '';
  $('btn-submit-user').onclick = submitUserEdit;
  openModal('modal-user');
}

async function submitUserEdit(){
  const payload = {
    username: $('usr-username').value.trim(),
    full_name: $('usr-fullname').value.trim() || null,
    email: $('usr-email').value.trim() || null,
    department: $('usr-department').value.trim() || null,
    role: $('usr-role').value,
    status: $('usr-status').value
  };
  const newPw = $('usr-newpw').value.trim();
  if(newPw) payload.password_display = newPw;

  try {
    const { error } = await sb.from('users').update(payload).eq('id', _editingUserId);
    if(error) throw error;
    closeModal('modal-user');
    toast('บันทึกแล้ว', 'success');
  } catch(e){ toast(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
}

export function deleteUser(userId){
  const u = S.users.find(x => x.id === userId);
  if(!u) return;
  confirmAction(
    'ลบผู้ใช้',
    `ลบผู้ใช้ ${u.username}? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    async () => {
      const { error } = await sb.from('users').delete().eq('id', userId);
      if(error) throw error;
      toast('ลบผู้ใช้เรียบร้อย', 'success');
    },
    'ลบผู้ใช้', true
  );
}
