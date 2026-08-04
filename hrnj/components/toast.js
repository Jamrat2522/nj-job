/* HR V2 — components/toast.js */
export function createToast(root) {
  function show(msg, type) {
    const t = document.createElement('div');
    t.className = 'v2-toast' + (type === 'error' ? ' err' : type === 'warn' ? ' warn' : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3800);
  }
  return { show };
}
