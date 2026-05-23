// =========================================================
// utils.js — Common helpers: DOM, format, toast, modal, etc.
// =========================================================

import { AVATAR_COLORS } from './state.js';

// DOM
export function $(id){ return document.getElementById(id); }
export function el(html){
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstChild;
}

// Escape HTML
export function esc(s){
  if(s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}

// PERF: batched icon refresh — multiple calls in same frame merge into one
let _iconsPending = false;
export function refreshIcons(){
  if(_iconsPending) return;
  _iconsPending = true;
  requestAnimationFrame(() => {
    _iconsPending = false;
    try { window.lucide.createIcons(); } catch(e) {}
  });
}

// Screen visibility
export function show(id){ const e = $(id); if(e) e.style.display = ''; }
export function hide(id){ const e = $(id); if(e) e.style.display = 'none'; }
export function showOnly(id){
  ['screen-auth','screen-setup','screen-app','screen-pending','screen-disabled','loading'].forEach(s => {
    const e = $(s);
    if(!e) return;
    e.style.display = s === id ? (s === 'screen-app' ? 'flex' : 'block') : 'none';
  });
}

// App loader
export function hideAppLoader(){
  const loader = document.querySelector('.loading-screen,.loader,#loader,#loading');
  if(loader){
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    loader.style.transition = 'opacity .3s';
    setTimeout(() => { try { loader.remove(); } catch(_) {} }, 300);
  }
}

// Toast
export function toast(msg, type = 'info'){
  const wrap = $('toast-wrap');
  if(!wrap) return;
  const t = el(`<div class="toast t-${type}"><i data-lucide="${type==='success'?'check-circle':type==='error'?'alert-circle':'info'}"></i><span>${esc(msg)}</span></div>`);
  wrap.appendChild(t);
  refreshIcons();
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .3s';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// Modal
export function openModal(id){
  const m = $(id);
  if(!m) return;
  m.classList.add('show');
  if(id === 'modal-detail') document.body.classList.add('detail-open');
  refreshIcons();
}
export function closeModal(id){
  const m = $(id);
  if(!m) return;
  m.classList.remove('show');
  if(id === 'modal-detail') document.body.classList.remove('detail-open');
}

// Toggle password input visibility
export function togglePw(inputId, btn){
  const e = $(inputId);
  if(!e) return;
  e.type = e.type === 'password' ? 'text' : 'password';
  btn.innerHTML = `<i data-lucide="${e.type === 'password' ? 'eye' : 'eye-off'}"></i>`;
  refreshIcons();
}

// Confirm modal (uses #modal-confirm)
export function confirmAction(title, msg, onOk, okLabel = 'ยืนยัน', danger = false){
  $('cf-title').textContent = title;
  $('cf-msg').textContent = msg;
  const ok = $('cf-ok');
  ok.textContent = okLabel;
  ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  ok.onclick = async () => {
    closeModal('modal-confirm');
    try { await onOk(); }
    catch(e){
      console.error(e);
      toast(e.message || 'เกิดข้อผิดพลาด', 'error');
    }
  };
  openModal('modal-confirm');
}

// Avatar helpers
export function pickColor(s){
  let h = 0;
  for(const c of (s || '')) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}
export function avatar(name, color, size = 38){
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  const c = color || pickColor(name);
  return `<div class="avatar" style="background:${c};width:${size}px;height:${size}px;font-size:${Math.floor(size * 0.36)}px">${esc(initials)}</div>`;
}

// Date/time formatters (th-TH locale)
export function fmtTime(ts){
  if(!ts) return '—';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
export function fmtDate(ts){
  if(!ts) return '—';
  return new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
}
export function fmtDateTime(ts){
  if(!ts) return '—';
  return new Date(ts).toLocaleString('th-TH', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}
export function fmtRelative(ts){
  if(!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if(diff < 60) return 'เพิ่งสร้าง';
  if(diff < 3600) return Math.floor(diff / 60) + ' นาทีที่แล้ว';
  if(diff < 86400) return Math.floor(diff / 3600) + ' ชม. ที่แล้ว';
  return Math.floor(diff / 86400) + ' วันที่แล้ว';
}

// Status badge HTML
export function statusBadge(st){
  const m = { WAIT: 'b-wait', GOING: 'b-going', DONE: 'b-done', CANCELED: 'b-cancel' };
  const l = { WAIT: 'รอรับงาน', GOING: 'กำลังดำเนินการ', DONE: 'ปิดงาน', CANCELED: 'ยกเลิก' };
  return `<span class="badge ${m[st] || 'b-wait'}"><span class="d"></span>${l[st] || st}</span>`;
}

// Empty row helper
export function emptyRow(cols){
  return `<tr><td colspan="${cols || 5}"><div class="empty"><div class="icon-lg"><i data-lucide="inbox"></i></div>ยังไม่มีงาน</div></td></tr>`;
}
