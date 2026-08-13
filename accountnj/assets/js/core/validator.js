export function required(v) { return v != null && String(v).trim() !== ''; }
export function isPositive(v) { const n = Number(v); return !isNaN(n) && n > 0; }
export function nonNegative(v) { const n = Number(v); return !isNaN(n) && n >= 0; }
export function isDate(v) { return !v || /^\d{4}-\d{2}-\d{2}$/.test(v); }
export function markInvalid(el, msg) {
  const fld = el.closest('.fld'); if (!fld) return;
  fld.classList.add('invalid');
  let e = fld.querySelector('.err-msg');
  if (!e) { e = document.createElement('div'); e.className = 'err-msg'; fld.appendChild(e); }
  e.textContent = msg;
}
export function clearInvalid(root) {
  root.querySelectorAll('.fld.invalid').forEach(f => f.classList.remove('invalid'));
  root.querySelectorAll('.err-msg').forEach(e => e.remove());
}
