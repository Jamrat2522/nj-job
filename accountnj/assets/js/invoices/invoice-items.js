import { esc, money } from '../core/formatter.js';
import { activeServiceCodes } from '../master/master-cache.js';
/* คอลัมน์รายการ: Item / Code / Description / Amount / Cost / Charge (+ ประเภท, VAT, WHT) */
export function itemRowHTML(it, i) {
  const codes = activeServiceCodes();
  const num = (k, w = 110) => `<input class="inp r" data-k="${k}" type="number" step="0.01" min="0"
    style="width:${w}px;text-align:right" value="${it[k] ?? ''}">`;
  return `<tr data-i="${i}">
    <td class="center">${i + 1}</td>
    <td><select class="sel" data-k="code" style="min-width:110px">
      <option value="">— กำหนดเอง —</option>
      ${codes.map(c => `<option value="${esc(c.code)}" ${c.code === it.code ? 'selected' : ''}>${esc(c.code)}</option>`).join('')}
    </select></td>
    <td><input class="inp w100" data-k="description" value="${esc(it.description || '')}" placeholder="Description"></td>
    <td>${num('amount', 120)}</td>
    <td>${num('cost')}</td>
    <td>${num('charge')}</td>
    <td><select class="sel" data-k="charge_kind" style="min-width:110px">
      <option value="SERVICE" ${it.charge_kind !== 'ADVANCE' ? 'selected' : ''}>SERVICE</option>
      <option value="ADVANCE" ${it.charge_kind === 'ADVANCE' ? 'selected' : ''}>ADVANCE</option>
    </select></td>
    <td class="center"><input type="checkbox" data-k="vat_applicable" ${it.vat_applicable !== false ? 'checked' : ''}></td>
    <td class="center"><input type="checkbox" data-k="wht_applicable" ${it.wht_applicable ? 'checked' : ''}></td>
    <td class="r" data-line>${money(0)}</td>
    <td><button class="btn btn-o btn-sm del" data-del>✕</button></td></tr>`;
}
