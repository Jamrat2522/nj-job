/* HR V2 — components/form.js · ตัวช่วยฟอร์มกลาง (สร้าง HTML + เก็บค่า + validate + กัน double-submit) */
import { esc } from './ui-states.js';

export function field(o) {
  const req = o.required ? ' <i class="v2-req">*</i>' : '';
  let input;
  if (o.type === 'select') {
    input = '<select id="' + o.id + '"' + (o.disabled ? ' disabled' : '') + '>' +
      (o.options || []).map(x => '<option value="' + esc(x.value) + '"' +
        (String(o.value) === String(x.value) ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') +
      '</select>';
  } else if (o.type === 'textarea') {
    input = '<textarea id="' + o.id + '" rows="' + (o.rows || 3) + '"' + (o.disabled ? ' disabled' : '') + '>' +
      esc(o.value == null ? '' : o.value) + '</textarea>';
  } else {
    input = '<input type="' + (o.type || 'text') + '" id="' + o.id + '" value="' + esc(o.value == null ? '' : o.value) + '"' +
      (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
      (o.step ? ' step="' + o.step + '"' : '') + (o.min != null ? ' min="' + o.min + '"' : '') +
      (o.disabled ? ' disabled' : '') + '>';
  }
  return '<label class="v2-field" data-f="' + o.id + '"><span>' + esc(o.label) + req + '</span>' + input +
    '<em class="v2-ferr" id="' + o.id + '-err"></em></label>';
}

export function val(root, id) {
  const e = root.querySelector('#' + id);
  if (!e) return null;
  if (e.type === 'checkbox') return e.checked;
  return String(e.value).trim();
}
export function setErr(root, id, msg) {
  const em = root.querySelector('#' + id + '-err');
  const f = root.querySelector('[data-f="' + id + '"]');
  if (em) em.textContent = msg || '';
  if (f) f.classList.toggle('bad', !!msg);
}
export function requireAll(root, ids) {
  let ok = true;
  ids.forEach(id => {
    const v = val(root, id);
    setErr(root, id, v ? '' : 'จำเป็นต้องกรอก');
    if (!v) ok = false;
  });
  return ok;
}
/* กัน double-submit: ปิดปุ่มระหว่างทำงานเสมอ */
export function busyBtn(btn, fn) {
  let busy = false;
  return async (...a) => {
    if (busy) return;
    busy = true;
    const old = btn.textContent;
    btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
    try { return await fn(...a); }
    finally { busy = false; btn.disabled = false; btn.textContent = old; }
  };
}
