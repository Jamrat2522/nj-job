import { esc } from '../core/formatter.js';
export function openModal({ title, body, footer, large, fullscreen, wide, cls }) {
  closeModal();
  const bk = document.createElement('div');
  /* wide = Desktop แสดงเป็นกรอบ 80vw × 80vh กึ่งกลางจอ · Mobile ยังเป็น layout เดิม (เต็มจอ)
     ใช้เป็น modifier ซ้อนบน modal-fs — ไม่แตะ .fs-page ของหน้า route

     cls = modifier เสริมแบบ opt-in (ใส่ทั้งที่ backdrop และ .modal)
     ไม่ส่ง cls มา -> พฤติกรรมเดิมทุกประการ -> Modal อื่นทั้งหมดไม่กระทบ */
  const extra = cls ? ' ' + cls : '';
  bk.className = 'modal-bk' + (fullscreen ? ' modal-fs' : '') + (wide ? ' modal-bk-w80' : '') + extra;
  bk.id = 'nj-modal';
  const mCls = ['modal',
    fullscreen ? '' : (large ? 'modal-lg' : ''),
    wide ? 'modal-w80' : '', cls || ''].filter(Boolean).join(' ');
  bk.innerHTML = `<div class="${mCls}">
    <div class="modal-h"><h3>${esc(title)}</h3>
      <button class="btn-icon" data-close aria-label="ปิด">✕</button></div>
    <div class="modal-b"></div>
    ${footer ? '<div class="modal-f"></div>' : ''}</div>`;
  bk.querySelector('.modal-b').append(body instanceof Node ? body : Object.assign(document.createElement('div'), { innerHTML: body }));
  if (footer) bk.querySelector('.modal-f').append(footer);
  bk.addEventListener('click', e => { if (e.target === bk || e.target.closest('[data-close]')) closeModal(); });
  document.body.appendChild(bk);
  /* ── ล็อกการเลื่อนของหน้าเบื้องหลังขณะ Modal เปิด ──
     ROOT CAUSE ของ "แถบเลื่อนด้านซ้าย": ของเดิมไม่เคยล็อก
     -> หน้าเบื้องหลัง (documentElement) ยังเลื่อนได้พร้อมกับ Modal
        เกิดแถบเลื่อน 2 ชุดบนจอเดียว
     แก้ที่ต้นเหตุด้วยการล็อกเฉพาะช่วงที่ Modal เปิด แล้วคืนค่าเดิมตอนปิด
     *** ไม่ใช่ body{overflow:hidden} ถาวรใน CSS *** และไม่ใช้ !important */
  lockPageScroll();
  return bk;
}

/* จำค่า overflow เดิมไว้ เพื่อคืนให้ตรงของเดิมเป๊ะตอนปิด Modal */
let prevHtmlOverflow = null;
function lockPageScroll() {
  if (prevHtmlOverflow !== null) return;           /* ล็อกซ้อนไม่ได้ */
  prevHtmlOverflow = document.documentElement.style.overflow || '';
  document.documentElement.style.overflow = 'hidden';
}
function unlockPageScroll() {
  if (prevHtmlOverflow === null) return;
  document.documentElement.style.overflow = prevHtmlOverflow;
  prevHtmlOverflow = null;
}

export function closeModal() {
  const el = document.getElementById('nj-modal');
  if (el) el.remove();
  unlockPageScroll();
}

/* ══ Keyboard Flow: กรอกเสร็จกด Enter -> ไปช่องถัดไป ══════════════════════
   ใช้ร่วมกันทั้ง 4 โหมด (job-form.js = DOCUMENT · billing-modal.js = ACCOUNTING)
   เรียกครั้งเดียวต่อ scope · ผูก listener ที่ตัว scope (delegate)
   -> ตารางรายการที่ถูก draw() ใหม่ก็ยังใช้ได้ ไม่ต้อง bind ซ้ำ

   ── กติกา ──
   · ลำดับ = DOM order ของ input/select ที่ "กรอกได้จริง" ใน scope
     Grid วางลูกตาม DOM order อยู่แล้ว -> ซ้าย→ขวา บน→ล่าง ตรงกับที่เห็นบนจอ
     ไม่ hardcode ชื่อ field ใด ๆ
   · ข้ามอัตโนมัติ: disabled · readonly · type=hidden · ที่ถูกซ่อน (offsetParent = null)
     -> ช่อง readonly ของ ACCOUNTING และ Section ที่พับอยู่ถูกข้ามเอง
   · textarea ไม่ถูก intercept -> Enter ขึ้นบรรทัดใหม่ตามปกติ (ออกด้วย Tab)
   · <button> ไม่อยู่ในลำดับนี้ -> ไม่เด้งไป "+ จัดการ" แต่ยัง Tab/คลิกได้ปกติ
   · Combobox: ถ้ารายการเปิดอยู่ Enter เป็นของ combobox ก่อน (มันเรียก preventDefault)
     จะข้ามไปช่องถัดไปก็ต่อเมื่อ "เลือกสำเร็จแล้ว" คือ list ปิด + มี dataset.id
     -> ไม่มีทางกด Enter ข้าม Dropdown โดยยังไม่ได้เลือก
   · ช่องสุดท้าย: Enter ไม่ทำอะไร (โฟกัสอยู่ที่เดิม) และ preventDefault ไว้เสมอ
     -> กัน implicit form submit · ไม่แตะปุ่มบันทึก/POST ใด ๆ
   · องค์ประกอบใน [data-enter-skip] ถูกเว้นทั้งก้อน (เช่น แถบยืนยัน inline) */
export function enableEnterNav(scope) {
  if (!scope || scope.dataset.enterNav === '1') return;
  scope.dataset.enterNav = '1';
  const usable = (el) =>
    !el.disabled && !el.readOnly && el.type !== 'hidden' && el.offsetParent !== null;
  scope.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    const el = e.target;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'SELECT')) return;
    if (el.closest('[data-enter-skip]')) return;
    if (e.defaultPrevented) {
      /* combobox กิน Enter ไปแล้ว — ข้ามต่อได้เฉพาะเมื่อเลือกรายการสำเร็จ */
      const cbx = el.closest('.cbx');
      if (!cbx) return;
      const list = cbx.querySelector('.cbx-list');
      if (!list || !list.hidden || !el.dataset.id) return;
    } else {
      e.preventDefault();                 /* กัน Enter ไป submit ฟอร์ม */
    }
    const all = [...scope.querySelectorAll('input, select')].filter(usable);
    const i = all.indexOf(el);
    if (i < 0 || i >= all.length - 1) return;   /* ช่องสุดท้าย -> อยู่ที่เดิม */
    all[i + 1].focus();
  });
}
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
