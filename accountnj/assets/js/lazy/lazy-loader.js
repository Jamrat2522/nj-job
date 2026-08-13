/* โหลด library หนักเมื่อจำเป็นเท่านั้น (เตรียมไว้สำหรับ Export Excel ใน Release ถัดไป) */
const loaded = new Map();
export function loadScript(url) {
  if (loaded.has(url)) return loaded.get(url);
  const p = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.onload = () => res(true); s.onerror = () => rej(new Error('โหลดสคริปต์ไม่สำเร็จ: ' + url));
    document.head.appendChild(s);
  });
  loaded.set(url, p);
  return p;
}
