export function tableShell(headHTML) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${headHTML}</tr></thead>
    <tbody></tbody></table></div><div data-pgn></div>`;
}

/* ══ Row Click = เปิดข้อมูลของแถวนั้น ══════════════════════════════════════
   helper กลางใช้ร่วมกันทุกหน้ารายการ — ไม่เขียนโค้ดซ้ำ

   enableRowOpen(tbody, open)
     tbody = <tbody> ที่มีแถวข้อมูล (delegate จึงรองรับการ re-render แถวใหม่)
     open(tr, ev) = ฟังก์ชันเปิดข้อมูลของหน้านั้น ๆ (Flow เดิมของแต่ละหน้า)
                    return false = แถวนี้เปิดไม่ได้

   · ผูก listener ครั้งเดียวต่อ tbody (กัน bind ซ้ำด้วย data-rowopen)
   · คลิกโดน Control ในแถว (button / a / input / select / textarea / label /
     [data-act] / .row-menu) -> ไม่เปิดงาน ปล่อยให้ Control ทำหน้าที่ตัวเอง
   · ใส่ class .rowclick ที่ <table> -> CSS ให้ cursor:pointer + hover
   · ไม่แตะ handler เดิมของปุ่มใด ๆ */
export function enableRowOpen(tbody, open) {
  if (!tbody || tbody.dataset.rowopen === '1') return;
  tbody.dataset.rowopen = '1';
  const table = tbody.closest('table');
  if (table) table.classList.add('rowclick');
  tbody.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, select, textarea, label, [data-act], .row-menu')) return;
    const tr = e.target.closest('tr');
    if (!tr || tr.parentElement !== tbody) return;
    if (tr.querySelector('td[colspan]')) return;      /* แถวว่าง / กำลังโหลด */
    open(tr, e);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   COLUMN MANAGER — ลาก / ซ่อน-แสดง / จำ Layout  (ใช้ร่วมกันทุกหน้ารายการ)

   ── ทำไมทำที่ระดับ DOM หลัง render ไม่ไปแก้ตัวสร้าง <th>/<td> ──
   ทุกหน้าสร้างหัวตารางกับเซลล์เป็นสตริงคู่ขนานกัน ถ้าไปสลับลำดับในตัวสร้าง
   มีโอกาสหัวกับข้อมูลหลุดคนละช่อง วิธีนี้ย้าย "โหนดจริง" โดยอ้าง data-ci
   (index เดิม) ชุดเดียวกันทั้ง <th> และ <td> -> ย้ายพร้อมกันเสมอ
   และ Renderer เดิมของทุกหน้าไม่ถูกแก้เลย

   ── ที่เก็บค่า ── ตรวจแล้วระบบไม่มี User Preference/Settings Storage เดิม
   ใช้ localStorage: nj_columns_<userId>_<MODE_KEY>  แยกทั้ง User และ Mode
   *** ไม่เก็บข้อมูลธุรกิจ *** เก็บแค่ลำดับ/การซ่อนคอลัมน์
   ══════════════════════════════════════════════════════════════════════════ */
import { esc } from '../core/formatter.js';
import { AppState } from '../core/state.js';
import { openModal, closeModal } from './modal.js';

const layKey = (modeKey) => 'nj_columns_' +
  ((AppState.profile && AppState.profile.id) || 'anon') + '_' + String(modeKey || '').toUpperCase();

function headRow(table) {
  return (table && table.tHead && table.tHead.rows[0]) || null;
}
function tagColumns(table) {
  const hr = headRow(table); if (!hr) return [];
  if (hr.dataset.ciTagged !== '1') {
    [...hr.cells].forEach((th, i) => { th.dataset.ci = String(i); });
    hr.dataset.ciTagged = '1';
  }
  return [...hr.cells].sort((a, b) => Number(a.dataset.ci) - Number(b.dataset.ci));
}
/* รายการคอลัมน์จริงของหน้านั้น — อ่านจากหัวตารางที่ render ออกมาจริง
   ไม่ hardcode ชุดเดียวใช้ทุกหน้า จึงถูกต้องต่อ Mode เสมอ */
export function columnDefs(table) {
  return tagColumns(table).map(th => {
    const label = (th.textContent || '').replace(/⇅/g, '').replace(/\s+/g, ' ').trim();
    return {
      i: Number(th.dataset.ci),
      label: label || ('คอลัมน์ ' + (Number(th.dataset.ci) + 1)),
      /* คอลัมน์บังคับ (อิง Source จริง ไม่เดา):
         .col-act = คอลัมน์ "จัดการ" ของตารางงาน (sticky right · ที่อยู่ของปุ่มสั่งงานแถว)
         หัวข้อ "จัดการ" ของหน้า FINANCE/REPORT = ที่อยู่ของ POST/ลบร่าง/Void/แก้ไขร่าง
         ทั้งสองเป็นทางเดียวที่สั่งงานแถวได้ -> ซ่อนไม่ได้ · อยู่ท้ายสุดเสมอ
         หน้าที่ไม่มีคอลัมน์นี้แล้ว (Row Click แทนหมด) จะไม่มีคอลัมน์บังคับเลย */
      required: th.classList.contains('col-act') || label === 'จัดการ',
      /* คอลัมน์ที่ "มีให้เลือก แต่ซ่อนไว้เป็นค่าเริ่มต้น"
         ประกาศที่ <th data-col-default="hidden"> ของหน้านั้น ๆ
         มีผลเฉพาะตอนที่ผู้ใช้ยังไม่เคยบันทึก layout เอง (lay = null)
         -> ตารางไม่บวมตั้งแต่เปิดหน้า แต่เปิดใช้ได้จาก "จัดการคอลัมน์" */
      defHidden: th.dataset.colDefault === 'hidden',
    };
  });
}
const sigOf = (defs) => defs.length + '|' + defs.map(d => d.label).join('|');

export function loadLayout(modeKey, defs) {
  try {
    const raw = localStorage.getItem(layKey(modeKey));
    if (!raw) return null;
    const o = JSON.parse(raw);
    /* ชุดคอลัมน์เปลี่ยน (อัปเดตระบบ) -> ทิ้งค่าเก่า กลับไปใช้ Default อัตโนมัติ */
    if (!o || !Array.isArray(o.order) || o.sig !== sigOf(defs)) return null;
    return o;
  } catch (_) { return null; }
}
export function saveLayout(modeKey, defs, order, hidden) {
  try {
    localStorage.setItem(layKey(modeKey), JSON.stringify({
      sig: sigOf(defs), order: order.slice(), hidden: (hidden || []).slice(),
    }));
  } catch (_) { /* โควตาเต็ม/โหมดส่วนตัว -> ใช้ Default ต่อไป ไม่ทำให้หน้าพัง */ }
}
export function resetLayout(modeKey) {
  try { localStorage.removeItem(layKey(modeKey)); } catch (_) {}
}

export function effectiveOrder(defs, lay) {
  const req = defs.filter(d => d.required).map(d => d.i);
  const valid = new Set(defs.map(d => d.i));
  let order = (lay && lay.order ? lay.order : defs.map(d => d.i)).filter(i => valid.has(i));
  defs.forEach(d => { if (!order.includes(d.i)) order.push(d.i); });
  order = order.filter(i => !req.includes(i)).concat(req);   /* คอลัมน์บังคับท้ายสุดเสมอ */
  /* ยังไม่เคยบันทึก layout -> ใช้ค่าเริ่มต้นจาก data-col-default ของหัวตาราง
     เคยบันทึกแล้ว -> เชื่อค่าที่ผู้ใช้ตั้งไว้เท่านั้น (ไม่ย้อนกลับไป default) */
  const base = lay && lay.hidden ? lay.hidden : defs.filter(d => d.defHidden).map(d => d.i);
  const hidden = new Set(base.filter(i => valid.has(i) && !req.includes(i)));
  return { order, hidden };
}

/* ใช้ layout กับตารางจริง — เรียกซ้ำได้ทุกครั้งหลัง render แถวใหม่ */
export function applyColumnLayout(table, modeKey) {
  const hr = headRow(table); if (!hr) return;
  const defs = columnDefs(table);
  const { order, hidden } = effectiveOrder(defs, loadLayout(modeKey, defs));
  const visN = order.filter(i => !hidden.has(i)).length;

  /* ══ Fast path (V.186) ═══════════════════════════════════════════════════
     ผู้ใช้ส่วนใหญ่ไม่เคยลากสลับคอลัมน์ -> order เป็นลำดับธรรมชาติ 0,1,2,...
     กรณีนั้น *** ไม่ต้อง appendChild เลย *** แค่ toggle hidden ก็พอ
     ของเดิม appendChild ทุก cell ทุกแถวเสมอ = 100 แถว x 35 คอลัมน์
     = 3,500 ครั้งต่อการโหลด 1 รอบ ซึ่งบังคับ reflow ทุกครั้ง
     ผลลัพธ์ที่ได้เหมือนเดิมทุกประการ — ต่างแค่ไม่ย้าย node ที่อยู่ถูกที่แล้ว */
  const identity = order.length === defs.length && order.every((v, i) => v === i);

  const byCi = {};
  [...hr.cells].forEach(th => { byCi[th.dataset.ci] = th; });
  if (identity) {
    order.forEach(i => { const th = byCi[i]; if (th) th.hidden = hidden.has(i); });
  } else {
    /* ย้ายผ่าน DocumentFragment -> แตะ DOM จริงครั้งเดียวต่อแถว */
    const frag = document.createDocumentFragment();
    order.forEach(i => { const th = byCi[i]; if (th) { th.hidden = hidden.has(i); frag.appendChild(th); } });
    hr.appendChild(frag);
  }

  [...table.tBodies].forEach(tb => {
    [...tb.rows].forEach(tr => {
      const cells = [...tr.cells];
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) { cells[0].colSpan = visN; return; }
      if (cells.length !== defs.length) return;             /* กันแถวรูปแบบอื่น */
      if (tr.dataset.collay !== '1') {
        cells.forEach((td, i) => { td.dataset.ci = String(i); });
        tr.dataset.collay = '1';
      }
      if (identity) {
        /* ลำดับตรงอยู่แล้ว -> เซ็ต hidden อย่างเดียว ไม่ย้าย node */
        cells.forEach((td, i) => { td.hidden = hidden.has(i); });
        return;
      }
      const byTd = {};
      cells.forEach(td => { byTd[td.dataset.ci] = td; });
      const frag = document.createDocumentFragment();
      order.forEach(i => { const td = byTd[i]; if (td) { td.hidden = hidden.has(i); frag.appendChild(td); } });
      tr.appendChild(frag);
    });
  });
}


/* ── ลากหัวคอลัมน์ด้วยเมาส์ (Desktop) ──
   ใช้ mousedown/mousemove/mouseup ของเบราว์เซอร์ ไม่เพิ่ม Library ใด ๆ
   · ต้องขยับเกิน 5px จึงนับเป็นการลาก -> คลิกสั้น = Sort เดิมยังทำงาน
   · ลากแล้วกลืน click ที่ตามมา 1 ครั้ง -> ไม่ trigger Sort และไม่ trigger Row Click
   · ไม่แตะ overflow ของ .tbl-wrap -> เลื่อนตารางซ้าย/ขวายังใช้ได้
   · มือถือใช้หน้าต่าง "จัดการคอลัมน์" แทน (ไม่ผูก touch เพื่อไม่ให้ scroll เพี้ยน) */
export function enableHeaderDrag(table, modeKey, onChange) {
  if (!table || !table.tHead || table.tHead.dataset.dragOn === '1') return;
  table.tHead.dataset.dragOn = '1';
  const hr = table.tHead.rows[0];
  let src = null, startX = 0, moved = false, target = null;
  const clearMarks = () => [...hr.cells].forEach(th => th.classList.remove('th-drag', 'th-drop-b', 'th-drop-a'));
  const isLocked = (th) => th.classList.contains('col-act') ||
    (th.textContent || '').replace(/\s+/g, ' ').trim() === 'จัดการ';
  function onMove(e) {
    if (!src) return;
    if (!moved && Math.abs(e.clientX - startX) < 5) return;
    if (!moved) { moved = true; src.classList.add('th-drag'); document.body.classList.add('is-coldrag'); }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el && el.closest ? el.closest('th') : null;
    clearMarks(); src.classList.add('th-drag');
    if (!cell || cell === src || cell.parentElement !== hr || isLocked(cell)) { target = null; return; }
    const r = cell.getBoundingClientRect();
    const after = e.clientX > r.left + r.width / 2;
    cell.classList.add(after ? 'th-drop-a' : 'th-drop-b');
    target = { cell, after };
  }
  function onUp() {
    const didMove = moved, tg = target, s = src;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.classList.remove('is-coldrag');
    clearMarks(); src = null; target = null; moved = false;
    if (!didMove || !s) return;
    /* กลืน click ที่เกิดหลัง mouseup ครั้งเดียว เพื่อไม่ให้ไป trigger Sort
       *** ผูกที่แถวหัวตารางเท่านั้น *** ถ้าผูกที่ document จะกลืนคลิกถัดไป
       ของทั้งหน้า (เช่น ปุ่ม "⚙ คอลัมน์") ซึ่งเป็นบั๊กจริงที่เจอตอนทดสอบ */
    const eat = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    hr.addEventListener('click', eat, { capture: true, once: true });
    if (!tg) return;
    if (tg.after) tg.cell.after(s); else tg.cell.before(s);
    const defs = columnDefs(table);
    const order = [...hr.cells].map(th => Number(th.dataset.ci));
    const hidden = [...hr.cells].filter(th => th.hidden).map(th => Number(th.dataset.ci));
    saveLayout(modeKey, defs, order, hidden);
    if (typeof onChange === 'function') onChange();
  }
  hr.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const th = e.target.closest('th');
    if (!th || th.parentElement !== hr || isLocked(th)) return;
    src = th; startX = e.clientX; moved = false; target = null;
    e.preventDefault();                        /* กันการลากเลือกข้อความ */
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

/* ── หน้าต่าง "จัดการคอลัมน์" ── ติ๊ก = แสดง/ซ่อน · ลากที่ ☰ = จัดลำดับ */
export function openColumnManager(table, modeKey, onSaved) {
  const defs = columnDefs(table);
  const cur = effectiveOrder(defs, loadLayout(modeKey, defs));
  const byI = {}; defs.forEach(d => { byI[d.i] = d; });
  const itemHTML = (d, on) => `<li class="colmg-it${d.required ? ' is-req' : ''}" data-ci="${d.i}">
      <span class="colmg-h" title="ลากเพื่อจัดลำดับ">☰</span>
      <label class="colmg-lb"><input type="checkbox" ${on ? 'checked' : ''}
        ${d.required ? 'disabled' : ''}> <span>${esc(d.label)}</span></label>
      ${d.required ? '<span class="colmg-req">บังคับ</span>' : ''}</li>`;

  const b = document.createElement('div');
  const hasReq = defs.some(d => d.required);
  const draw = (order, hidden) => {
    b.innerHTML = `<div class="colmg">
      <div class="colmg-hint">ลากที่ <b>☰</b> เพื่อจัดลำดับ · ติ๊กเพื่อแสดง / เอาติ๊กออกเพื่อซ่อน${
        hasReq ? '<br>คอลัมน์ <b>จัดการ</b> เป็นคอลัมน์บังคับ (ปุ่มสั่งงานแถวอยู่ในนั้น) ซ่อนไม่ได้และอยู่ท้ายสุดเสมอ' : ''}</div>
      <ul class="colmg-list">${order.map(i => itemHTML(byI[i], !hidden.has(i))).join('')}</ul></div>`;
    bindDrag();
  };
  function bindDrag() {
    const ul = b.querySelector('.colmg-list');
    ul.addEventListener('mousedown', (e) => {
      const h = e.target.closest('.colmg-h'); if (!h) return;
      const src = h.closest('.colmg-it');
      if (!src || src.classList.contains('is-req')) return;
      e.preventDefault();
      src.classList.add('is-drag');
      const move = (ev) => {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const li = el && el.closest ? el.closest('.colmg-it') : null;
        if (!li || li === src || li.classList.contains('is-req')) return;
        const r = li.getBoundingClientRect();
        if (ev.clientY > r.top + r.height / 2) li.after(src); else li.before(src);
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        src.classList.remove('is-drag');
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }
  draw(cur.order, cur.hidden);

  const f = document.createElement('div');
  f.style.display = 'contents';           /* ปุ่มเป็นลูกของ .modal-f โดยตรง -> แถวเดียว */
  f.innerHTML = `<div class="mf-left">
      <button class="btn btn-o" id="colmg-reset">↺ คืนค่าเริ่มต้น</button></div>
    <div class="mf-right">
      <button class="btn btn-p" id="colmg-save">💾 บันทึก</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;
  openModal({ title: 'จัดการคอลัมน์', body: b, footer: f, large: true });

  f.querySelector('#colmg-reset').onclick = () => {
    resetLayout(modeKey);
    const d2 = effectiveOrder(defs, null);
    draw(d2.order, d2.hidden);
  };
  f.querySelector('#colmg-save').onclick = () => {
    const items = [...b.querySelectorAll('.colmg-it')];
    const order = items.map(li => Number(li.dataset.ci));
    const hidden = items.filter(li => {
      const cb = li.querySelector('input[type=checkbox]');
      return cb && !cb.checked;
    }).map(li => Number(li.dataset.ci));
    saveLayout(modeKey, defs, order, hidden);
    closeModal();
    if (typeof onSaved === 'function') onSaved();
  };
}

/* ── ตัวช่วยเรียกครั้งเดียวต่อการ render ──
   initColumns({ table, modeKey, host })
     · ติดตั้ง drag ที่หัวตาราง (ครั้งเดียวต่อ thead)
     · mount ปุ่ม "⚙ คอลัมน์" ลงใน host (ไม่ซ้ำ)
     · apply layout ปัจจุบัน
   เรียกซ้ำได้ทุกครั้งหลังโหลดแถวใหม่ */
export function initColumns({ table, modeKey, host }) {
  if (!table || !modeKey) return;
  const relayout = () => applyColumnLayout(table, modeKey);
  enableHeaderDrag(table, modeKey, relayout);
  if (host && !host.querySelector('[data-colmg]')) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-o btn-sm';
    btn.type = 'button';
    btn.setAttribute('data-colmg', '');
    btn.textContent = '⚙ คอลัมน์';
    btn.title = 'จัดการคอลัมน์ — ลากเพื่อเรียง · ติ๊กเพื่อซ่อน/แสดง';
    btn.onclick = () => openColumnManager(table, modeKey, relayout);
    host.appendChild(btn);
  }
  relayout();
}
