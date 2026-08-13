export function toast(msg, type = '') {
  let w = document.querySelector('.toast-wrap');
  if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}
