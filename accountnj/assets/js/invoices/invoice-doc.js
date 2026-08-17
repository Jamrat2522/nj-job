/* Renderer เอกสาร INVOICE ชุดเดียว — ใช้ทั้ง Preview / Print Draft / ใบจริง / Save PDF
   ─────────────────────────────────────────────────────────────────────
   *** เป็น Template เดียวของทั้งระบบ ***
   หน้า INVOICE (invoice-view.js) เรียก invoiceDocHTML() ตัวนี้เหมือนกัน
   จึงไม่มีทางที่ Preview กับใบจริงจะเป็นคนละหน้าตา
   ต่างกันแค่ป้าย DRAFT และเลขที่ยังเป็นเลขชั่วคราวเท่านั้น

   ไม่เปลี่ยนสถานะเอกสาร · ไม่เรียก RPC ใด ๆ · ไม่ POST อัตโนมัติ
   ไม่คำนวณธุรกิจใหม่ — ตัวเลขทุกตัวมาจาก Backend (njacc_invoice_view /
   njacc_invoice_draft_view) ที่คำนวณด้วย SQL เดิมแล้วเท่านั้น
   ที่นี่ทำแค่ "จัดกลุ่มเพื่อแสดงผล" ตามผล VAT จริงของแต่ละบรรทัด */
import { esc, money, dmy } from '../core/formatter.js';
import { openModal } from '../components/modal.js';
import { ISSUER } from '../config/company-doc.js';

/* ตัวเลขในเอกสาร: ชิดขวา · คั่นหลักพัน · 2 ตำแหน่ง · ไม่เกี่ยวข้อง = "-"
   ใช้ money() เดิมของระบบ ไม่เขียน format ใหม่ */
const cell = (n) => (n === null || n === undefined || n === '' || Number(n) === 0 ? '-' : money(n));
const txt = (v, fb = '-') => {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  return esc(s || fb);
};
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;

/* ── ไอคอน outline บาง สีเดียว (currentColor) ขนาดเล็ก พิมพ์ขาวดำก็ยังอ่านออก ── */
const ICON = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
  tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',
  job: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 16h6"/></svg>',
  sum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 9V3.6h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6.4"/></svg>',
};
const ic = (k) => `<span class="ivd-ic">${ICON[k] || ''}</span>`;

/* ── สรุปยอดตาม Design (ยึดตัวเลขจริงจาก Backend) ──
   vatBase = ยอดของบรรทัดที่ "มี VAT จริง" (vat_amount > 0 หรือ vat_rate > 0)
   nonVat  = ยอดของบรรทัดที่ไม่มี VAT (ตามระบบจริง = รายการ ADVANCE)
   -> ไม่ได้ตัดสินจากคำว่า ADVANCE อย่างเดียว แต่ดูผลคำนวณจริงของ Service Master
      ถ้าวันหนึ่งมีรายการ Service ตั้งไว้ 0% ยอดจะไปฝั่ง Non-VAT เองอย่างถูกต้อง
   GRAND TOTAL = vatBase + vat + nonVat = subtotal + vat = total_amount ของ Backend */
function summarize(inv, items) {
  let vatBase = 0, nonVat = 0;
  for (const it of items) {
    const hasVat = num(it.vat_amount) > 0 || num(it.vat_rate) > 0;
    if (hasVat) vatBase = r2(vatBase + num(it.amount));
    else nonVat = r2(nonVat + num(it.amount));
  }
  const vat = r2(inv.vat_amount);
  /* อัตรา VAT บนหัวตาราง — อ่านจากบรรทัดจริง ไม่ hardcode 7 */
  const rates = [...new Set(items.map(it => num(it.vat_rate)).filter(x => x > 0))];
  const vatRate = rates.length === 1 ? rates[0] : (num(inv.vat_rate) || 7);
  const total = r2(vatBase + vat);
  return { vatBase, nonVat, vat, vatRate, total, grand: r2(total + nonVat) };
}

/* WHT แยกตามอัตราจริงรายบรรทัด (njacc_invoice_items.wht_rate / wht_amount)
   1% = ค่าขนส่ง · 3% = ค่าบริการ · อัตราอื่นที่พบจะต่อท้ายให้เอง ไม่ตัดทิ้ง */
function whtRows(items) {
  const by = new Map();
  for (const it of items) {
    const rate = num(it.wht_rate);
    if (rate <= 0) continue;
    by.set(rate, r2((by.get(rate) || 0) + num(it.wht_amount)));
  }
  const out = [
    { rate: 1, label: 'Transportation', amt: by.get(1) || 0 },
    { rate: 3, label: 'Service', amt: by.get(3) || 0 },
  ];
  for (const [rate, amt] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
    if (rate !== 1 && rate !== 3) out.push({ rate, label: 'Other', amt });
  }
  return out;
}

export function invoiceDocHTML(inv, { draft = false } = {}) {
  const items = inv.items || [];
  const S = summarize(inv, items);

  /* ── Data Mapping — รองรับทั้ง 2 RPC ──
     njacc_invoice_view       คืน customer{} / job{} ซ้อนกัน
     njacc_invoice_draft_view คืน customer_* / job_no แบบแบน
     ฟิลด์ที่ RPC ยังไม่ส่งมา แสดง "-" ไม่ใช่ค่ามั่ว
     (เปิดครบได้หลังรัน sql/dev/RUN-01_027_invoice_doc_fields.sql) */
  const c = inv.customer || {};
  const j = inv.job || {};
  const D = {
    cusName: inv.customer_name || c.name,
    cusTax: inv.customer_tax_id || c.tax_id,
    cusBranch: inv.customer_branch_code || c.branch_code,
    cusAddr: inv.customer_address || c.address,
    cusTel: inv.customer_phone || c.phone,
    invNo: (draft && inv.has_real_no === false) ? null : inv.invoice_no,
    invDate: inv.invoice_date,
    jobNo: inv.job_no || j.job_no,
    declNo: inv.customs_declaration_no || j.customs_declaration_no,
    cusPo: inv.customer_job_no || j.customer_job_no,
    master: inv.master_bl_no || j.master_bl_no,
    house: inv.house_bl_no || j.house_bl_no,
    remarks: inv.remarks || inv.job_note || j.note,
    companyInvoice: inv.company_invoice,
    createdBy: inv.created_by_name || inv.issued_by_name,
  };

  const rows = items.map((it, i) => {
    const isAdv = num(it.vat_amount) <= 0 && num(it.vat_rate) <= 0;
    const amt = num(it.amount);
    return `<tr>
      <!-- คอลัมน์ No. ถูกตัดออกจากเอกสาร Final ตามคำสั่งผู้ใช้
           line_no ยังถูกเก็บและใช้เรียงลำดับตามเดิม เพียงไม่พิมพ์ลงกระดาษ -->
      <td class="ivd-desc">${txt(it.description, '')}</td>
      <td class="r">${isAdv ? '-' : cell(amt)}</td>
      <td class="r">${isAdv ? cell(amt) : '-'}</td>
      <td class="r">${cell(it.unit_price)}</td>
      <td class="r">${cell(amt)}</td></tr>`;
  }).join('') || '<tr><td colspan="5" class="ivd-empty">ยังไม่มีรายการ</td></tr>';

  const wht = whtRows(items).map(w =>
    `<div class="ivd-wl"><span>${w.rate} % ${w.label}</span><span>${money(w.amt)}</span></div>`).join('');

  const sign = (title) => `<div class="ivd-sign">
      <div class="ivd-sign-t">${title}</div>
      <div class="ivd-sign-line"></div>
      <div class="ivd-sign-d"><i></i> / <i></i> / <i></i></div>
      <div class="ivd-sign-c">Authorized Signature</div></div>`;

  return `
    <div class="ivd print-area${draft ? ' ivd-draft' : ''}">
      ${draft ? '<div class="ivd-badge">DRAFT</div>' : ''}

      <header class="ivd-head">
        <div class="ivd-head-l">
          <img class="ivd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="ivd-co">
            <div class="ivd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="ivd-co-ad">${esc(ISSUER.address)}</div>
            <div class="ivd-co-tl">Tel. ${esc(ISSUER.tel)} <i>|</i> Fax. ${esc(ISSUER.fax)}
              <i>|</i> Tax ID ${esc(ISSUER.taxId)}</div>
          </div>
        </div>
        <div class="ivd-head-r"><div class="ivd-title">INVOICE / ใบแจ้งหนี้</div></div>
      </header>

      <section class="ivd-cards">
        <div class="ivd-card">
          <div class="ivd-card-t">CUSTOMER</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${ic('user')}<div class="ivd-fb"><label>Customer Name</label>
              <div class="v v-b">${txt(D.cusName)}</div></div></div>
            <div class="ivd-f">${ic('tax')}<div class="ivd-fb ivd-2col">
              <div><label>Tax ID</label><div class="v v-b">${txt(D.cusTax)}</div></div>
              <div><label>Branch</label><div class="v v-b">${txt(D.cusBranch)}</div></div>
            </div></div>
            <div class="ivd-f">${ic('pin')}<div class="ivd-fb"><label>Address</label>
              <div class="v">${txt(D.cusAddr, '')}</div></div></div>
            <div class="ivd-f ivd-f-last">${ic('tel')}<div class="ivd-fb"><label>Tel.</label>
              <div class="v v-b">${txt(D.cusTel)}</div></div></div>
          </div>
        </div>
        <div class="ivd-card">
          <div class="ivd-card-t">INVOICE DETAILS</div>
          <div class="ivd-card-b">
            <div class="ivd-f">${ic('doc')}<div class="ivd-fb ivd-kv">
              <label>Invoice No.</label><div class="v v-b v-lg">${
                D.invNo ? esc(D.invNo) : '<span class="v-draft">ยังไม่ออกเลข (ร่าง)</span>'}</div></div></div>
            <div class="ivd-f">${ic('cal')}<div class="ivd-fb ivd-kv">
              <label>Date</label><div class="v v-b v-lg">${dmy(D.invDate)}</div></div></div>
            <div class="ivd-f ivd-f-last">${ic('job')}<div class="ivd-fb ivd-kv">
              <label>Job No.</label><div class="v v-b v-lg">${txt(D.jobNo)}</div></div></div>
          </div>
        </div>
      </section>

      <section class="ivd-ref">
        <div class="ivd-rf"><label>Decl No.</label><span>${txt(D.declNo)}</span></div>
        <div class="ivd-rf"><label>Customer PO</label><span>${txt(D.cusPo)}</span></div>
        <div class="ivd-rf"><label>Master</label><span>${txt(D.master)}</span></div>
        <div class="ivd-rf"><label>House</label><span>${txt(D.house)}</span></div>
      </section>

      <table class="ivd-tbl">
        <colgroup><col class="w-desc"><col class="w-srv">
          <col class="w-adv"><col class="w-unit"><col class="w-tot"></colgroup>
        <thead><tr>
          <th>Description</th>
          <th class="r">Service<small>(VAT ${S.vatRate}%)</small></th>
          <th class="r">Advance<small>(Non-VAT)</small></th>
          <th class="r">Unit Price</th><th class="r">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="ivd-trow">
          <td class="ivd-trow-l">${ic('sum')}<b>TOTAL</b></td>
          <td class="r">${cell(S.vatBase)}</td>
          <td class="r">${cell(S.nonVat)}</td>
          <td></td>
          <td class="r ivd-trow-g">${money(r2(S.vatBase + S.nonVat))}</td>
        </tr></tfoot>
      </table>

      <section class="ivd-mid">
        <div class="ivd-remark">
          <div class="ivd-rm-t">REMARKS : <span>${txt(D.remarks, '')}</span></div>
          <div class="ivd-rm-l"></div><div class="ivd-rm-l"></div><div class="ivd-rm-l"></div>
          <div class="ivd-ci"><b>Company Invoice :</b> ${txt(D.companyInvoice, '')}</div>
        </div>
        <div class="ivd-sum">
          <div class="ivd-sl"><span>SubTotal ${S.vatRate} %</span><span>${money(S.vatBase)}</span></div>
          <div class="ivd-sl"><span>VAT ${S.vatRate} %</span><span>${money(S.vat)}</span></div>
          <div class="ivd-sl ivd-sl-m"><span>Total</span><span>${money(S.total)}</span></div>
          <div class="ivd-sl"><span>Advance (Non-VAT)</span><span>${money(S.nonVat)}</span></div>
          <div class="ivd-sl ivd-sl-g"><span>GRAND TOTAL</span><span>${money(S.grand)}</span></div>
        </div>
      </section>

      <section class="ivd-foot3">
        <div class="ivd-wht"><div class="ivd-wht-t">Withholding Tax Detail</div>${wht}</div>
        ${sign('For The Customer')}
        ${sign('For The ' + esc(ISSUER.nameEn))}
      </section>

      <footer class="ivd-bar">
        <div>${ic('user')}Created By : <b>${txt(D.createdBy)}</b></div>
        <div>${ic('print')}Printed Date : <b>${dmy(new Date().toISOString().slice(0, 10))}</b></div>
      </footer>
      <div class="ivd-edge"></div>
    </div>`;
}

/* เปิดดูเอกสารในหน้าต่าง — print=true จะสั่งพิมพ์ให้เลย
   ไม่แตะสถานะเอกสารใด ๆ */
export function openInvoiceDoc(inv, { draft = false, print = false } = {}) {
  const b = document.createElement('div');
  b.innerHTML = invoiceDocHTML(inv, { draft });
  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="ivd-print">🖨 ${draft ? 'Print Draft' : 'Print Invoice'}</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;
  openModal({ title: draft ? 'Preview — ร่างใบแจ้งหนี้' : 'ใบแจ้งหนี้',
              body: b, footer: f, fullscreen: true, wide: true });
  f.querySelector('#ivd-print').onclick = () => window.print();
  if (print) setTimeout(() => window.print(), 60);
}
