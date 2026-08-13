import { PAGE_SIZES } from '../core/config.js';
export function renderPagination(el, { page, size, total }, onChange) {
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(page, pages);
  const btn = (lb, tp, dis, cur) =>
    `<button data-p="${tp}" ${dis ? 'disabled' : ''} class="${cur ? 'cur' : ''}">${lb}</button>`;
  let nums = '';
  const from = Math.max(1, p - 2), to = Math.min(pages, p + 2);
  for (let i = from; i <= to; i++) nums += btn(i, i, false, i === p);
  el.innerHTML = `<div class="pgn">
    <span>ทั้งหมด ${total.toLocaleString('th-TH')} รายการ</span><span class="sp"></span>
    ${btn('⏮', 1, p === 1)}${btn('◀', p - 1, p === 1)}${nums}${btn('▶', p + 1, p === pages)}${btn('⏭', pages, p === pages)}
    <select class="sel" data-size>${PAGE_SIZES.map(s => `<option ${s === size ? 'selected' : ''}>${s}</option>`).join('')}</select>
  </div>`;
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => onChange({ page: Number(b.dataset.p), size }));
  el.querySelector('[data-size]').onchange = e => onChange({ page: 1, size: Number(e.target.value) });
}
