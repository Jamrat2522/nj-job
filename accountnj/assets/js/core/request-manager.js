/* กัน stale response + debounce + double-click guard */
const tokens = new Map();
export function nextToken(key) { const t = (tokens.get(key) || 0) + 1; tokens.set(key, t); return t; }
export function isCurrent(key, t) { return tokens.get(key) === t; }

const timers = new Map();
export function debounce(key, fn, ms = 300) {
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(fn, ms));
}

const busy = new Set();
export async function once(key, fn) {   /* double-click guard */
  if (busy.has(key)) return null;
  busy.add(key);
  try { return await fn(); } finally { busy.delete(key); }
}
export function newRequestId() {        /* idempotency key ต่อ 1 การกดยืนยัน */
  return (crypto.randomUUID ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(36).slice(2));
}
