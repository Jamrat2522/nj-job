import { esc } from '../core/formatter.js';
export function openModal({ title, body, footer, large }) {
  closeModal();
  const bk = document.createElement('div');
  bk.className = 'modal-bk'; bk.id = 'nj-modal';
  bk.innerHTML = `<div class="modal ${large ? 'modal-lg' : ''}">
    <div class="modal-h"><h3>${esc(title)}</h3>
      <button class="btn-icon" data-close aria-label="ปิด">✕</button></div>
    <div class="modal-b"></div>
    ${footer ? '<div class="modal-f"></div>' : ''}</div>`;
  bk.querySelector('.modal-b').append(body instanceof Node ? body : Object.assign(document.createElement('div'), { innerHTML: body }));
  if (footer) bk.querySelector('.modal-f').append(footer);
  bk.addEventListener('click', e => { if (e.target === bk || e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(bk);
  return bk;
}
export function closeModal() { document.getElementById('nj-modal')?.remove(); }
export function confirmModal(title, msg, okLabel = 'ยืนยัน') {
  return new Promise(res => {
    const f = document.createElement('div');
    f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
      <button class="btn btn-p" id="nj-cf-ok">${okLabel}</button>`;
    const m = openModal({ title, body: `<p>${msg}</p>`, footer: f });
    f.querySelector('#nj-cf-ok').onclick = () => { closeModal(); res(true); };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) res(false); });
  });
}
export function reasonModal(title) {
  return new Promise(res => {
    const b = document.createElement('div');
    b.innerHTML = `<div class="fld"><label>เหตุผล <span class="req">*</span></label>
      <textarea class="inp w100" id="nj-rs"></textarea></div>`;
    const f = document.createElement('div');
    f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
      <button class="btn btn-danger" id="nj-rs-ok">ยืนยัน</button>`;
    const m = openModal({ title, body: b, footer: f });
    f.querySelector('#nj-rs-ok').onclick = () => {
      const v = b.querySelector('#nj-rs').value.trim();
      if (!v) { b.querySelector('#nj-rs').focus(); return; }
      closeModal(); res(v);
    };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) res(null); });
  });
}
