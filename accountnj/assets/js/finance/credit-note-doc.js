/* Renderer เอกสาร CREDIT NOTE / ใบลดหนี้ — Preview / Print / PDF ชุดเดียวกัน
   ─────────────────────────────────────────────────────────────────────
   *** เอกสารเฉพาะของ FINANCE > Credit Note เท่านั้น ***
   คลาสทั้งหมดขึ้นต้น .cnd* → ไม่ทับ .ivd* (INVOICE) / .rcd* (RECEIPT) / .apd* (ADVANCE)
   แก้ไฟล์นี้ไม่กระทบเอกสารประเภทอื่นแม้แต่บรรทัดเดียว

   ไม่เรียก RPC · ไม่เปลี่ยนสถานะ · ไม่ออกเลขเอกสารเอง · ไม่คำนวณภาษีเอง
   ตัวเลขทุกตัวมาจาก njacc_credit_note_view() ที่ SQL คำนวณไว้แล้ว
   ที่นี่ทำแค่ "จัดรูปแบบเพื่อแสดงผล"

   ── Data Mapping (ตรวจจาก sql/dev/RUN_3_CREDIT_NOTE.sql จริง) ──
     Credit Note No.   : njacc_credit_notes.credit_note_no    (CD{YYYYMM}-#####)
     Credit Note Date  : njacc_credit_notes.credit_note_date
     Invoice Reference : njacc_invoices.invoice_no  (ผ่าน credit_note_view.invoice)
     Reason            : njacc_credit_notes.reason  ← ผู้ใช้กรอกเอง ไม่มีค่าตัวอย่าง
     Customer          : njacc_customers.customer_name / tax_id / branch_code /
                         address / phone
     Invoice Reference table : credit_note_view.invoice_items (บรรทัดของใบต้นฉบับ)
     Credit Note Items       : njacc_credit_note_items
                               (line_no, description, amount, vat_rate,
                                vat_amount, credit_amount)

   *** โลโก้ใช้ไฟล์จริง assets/img/nj-logo.png ผ่าน ISSUER.logo — ไม่วาดใหม่
       object-fit:contain เสมอ → คงสัดส่วน 426x231 ไม่ยืด ไม่บิด ไม่เปลี่ยนสี *** */
import { esc, money, dmy } from '../core/formatter.js';
import { openModal } from '../components/modal.js';
import { bahtText } from '../core/baht-text.js';
import { ISSUER } from '../config/company-doc.js';

const txt = (v, fb = '-') => {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  return esc(s || fb);
};
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;
/* อัตรา VAT พิมพ์แบบไม่มีทศนิยมเกินจำเป็น: 7 → "7%" · 1.5 → "1.5%" · 0 → "0%" */
const pct = (v) => {
  const n = num(v);
  return (Number.isInteger(n) ? String(n) : String(r2(n))) + '%';
};

/* ไอคอน outline บาง สีเดียว (currentColor) — ชุดของเอกสารนี้เอง */
const ICON = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4.4" y="3" width="15.2" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.6" cy="11" r="2"/><path d="M5.4 16.2c.5-1.5 1.7-2.3 3.2-2.3s2.7.8 3.2 2.3M14.6 10h4.2M14.6 13.4h3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21c4-4.6 6-7.9 6-10.6A6 6 0 0 0 6 10.4C6 13.1 8 16.4 12 21z"/><circle cx="12" cy="10.3" r="2.3"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.2 3.8h3.2l1.6 4-2 1.4a12 12 0 0 0 5.8 5.8l1.4-2 4 1.6v3.2a1.6 1.6 0 0 1-1.8 1.6C11.5 18.7 5.3 12.5 4.6 5.6a1.6 1.6 0 0 1 1.6-1.8z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.4" y="5" width="17.2" height="15.6" rx="2"/><path d="M3.4 9.6h17.2M8 3.4v3.4M16 3.4v3.4"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',
  abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16.6 3.8 20.2 7.4 8 19.6l-4.4.8.8-4.4z"/><path d="M14.4 6l3.6 3.6"/></svg>',
};
const ic = (k) => `<span class="cnd-ic">${ICON[k] || ''}</span>`;
const bub = (k) => `<span class="cnd-bub">${ICON[k] || ''}</span>`;

/* ── สรุปยอด ──
   ยึด "ผลรวมของบรรทัดที่แสดงในตาราง" เป็นหลัก → ยอดสรุปกับตารางไม่มีทางไม่ตรง
   vatRate: อ่านจาก njacc_credit_note_items.vat_rate ของแต่ละบรรทัดจริง
            อัตราเดียวทั้งใบ → พิมพ์อัตรานั้น (รวม 0%)
            หลายอัตราปนกัน   → ไม่พิมพ์ % (ยอดยังถูกต้อง)
   *** ไม่ hardcode 7% *** */
function summarize(items) {
  let sub = 0, vat = 0, tot = 0;
  const rates = new Set();
  for (const it of items) {
    sub = r2(sub + num(it.amount));
    vat = r2(vat + num(it.vat_amount));
    tot = r2(tot + num(it.credit_amount));
    rates.add(num(it.vat_rate));
  }
  const vatRate = rates.size === 1 ? [...rates][0] : null;
  return { sub, vat, total: tot, vatRate };
}

export function creditNoteDocHTML(cn) {
  const items = cn.items || [];
  const S = summarize(items);
  const c = cn.customer || {};
  const inv = cn.invoice || {};
  const invItems = cn.invoice_items || [];
  const st = String(cn.status || '').toUpperCase();
  const isDraft = st === 'DRAFT';
  const isVoid = st === 'VOID';

  /* ร่างยังไม่มีเลขจริง (SQL เก็บเป็น CNDRAFT-xxxxxxxx) → ไม่โชว์เลขปลอมบนเอกสาร */
  const noRaw = String(cn.credit_note_no || '');
  const cnNo = (isDraft || /^CNDRAFT-/.test(noRaw)) ? null : noRaw;

  /* แถบ TAX INVOICE — ใบลดหนี้จะเป็นใบกำกับภาษีก็ต่อเมื่อมี VAT จริงในเอกสาร
     VAT 0% ทั้งใบ → ไม่ติดป้ายนี้ เพื่อไม่ให้เอกสารอ้างสถานะภาษีที่ไม่จริง */
  const isTaxDoc = S.vat > 0;

  const invRows = invItems.length
    ? invItems.map((it, i) => `<tr>
        <td class="cnd-c cnd-dim">${it.line_no ?? (i + 1)}</td>
        <td class="cnd-c cnd-b">${txt(inv.invoice_no)}</td>
        <td class="cnd-c">${dmy(inv.invoice_date)}</td>
        <td class="cnd-ds">${txt(it.description, '-')}</td>
        <td class="cnd-r">${money(it.amount)}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="cnd-empty">ไม่พบรายการของใบแจ้งหนี้ต้นฉบับ</td></tr>';
  const invTotal = invItems.reduce((s, it) => r2(s + num(it.amount)), 0);

  /* ── Original / Correct / Difference ──
     original_amount     = มูลค่าเดิมของบรรทัด Invoice ต้นฉบับ (snapshot จาก SQL)
     difference          = njacc_credit_note_items.amount (ยอดที่ลดของ "ใบนี้" ก่อน VAT)
     prior_credited      = ยอดที่ลดไปแล้วจากใบลดหนี้อื่นที่ POSTED และมาก่อนใบนี้
     correct_amount      = original − prior_credited − difference

     *** Correct Amount ต้องคิด Credit สะสม ไม่ใช่แค่ใบปัจจุบัน ***
       Original 10,000 · CN#1 ลด 2,000 -> Correct 8,000
                         CN#2 ลด 1,500 -> Correct 6,500  (ไม่ใช่ 8,500)
     ค่าทั้งหมดคำนวณที่ SQL (njacc_credit_note_view) แล้วส่งมา
     ที่นี่ไม่คำนวณสะสมเอง เพราะเบราว์เซอร์ไม่เห็นใบลดหนี้ใบอื่น

     ยังไม่ได้รัน RUN-02 -> ไม่มี original_amount / correct_amount
     -> แสดง "-" ไม่เดาค่าให้ (ห้าม fallback เป็น original − amount เพราะจะผิดเมื่อมีหลายใบ) */
  const hasOrig = items.some(it => it.original_amount !== null && it.original_amount !== undefined);
  const corrOf = (it) => (it.correct_amount === null || it.correct_amount === undefined)
    ? null : num(it.correct_amount);
  let tOrig = 0, tCorr = 0, tCorrOk = true;
  for (const it of items) {
    if (it.original_amount === null || it.original_amount === undefined) continue;
    tOrig = r2(tOrig + num(it.original_amount));
    const c = corrOf(it);
    if (c === null) tCorrOk = false; else tCorr = r2(tCorr + c);
  }

  const cnRows = items.length
    ? items.map((it, i) => {
      const hasO = it.original_amount !== null && it.original_amount !== undefined;
      const corr = corrOf(it);   /* คำนวณที่ SQL แล้ว — หักสะสมทุกใบที่ POSTED ก่อนหน้า */
      return `<tr>
        <td class="cnd-c cnd-dim">${it.line_no ?? (i + 1)}</td>
        <td class="cnd-ds">${txt(it.description, '-')}</td>
        <td class="cnd-r">${hasO ? money(it.original_amount) : '-'}</td>
        <td class="cnd-r">${corr === null ? '-' : money(corr)}</td>
        <td class="cnd-r cnd-df">${money(it.amount)}</td>
        <td class="cnd-c">${esc(pct(it.vat_rate))}</td>
        <td class="cnd-r">${money(it.vat_amount)}</td>
        <td class="cnd-r cnd-cr">${money(it.credit_amount)}</td>
      </tr>`;
    }).join('')
    : '<tr><td colspan="8" class="cnd-empty">ยังไม่มีรายการลดหนี้ในเอกสารนี้</td></tr>';

  const vatLbl = S.vatRate === null ? 'VAT / ภาษีมูลค่าเพิ่ม' : `VAT ${pct(S.vatRate)} / ภาษีมูลค่าเพิ่ม ${pct(S.vatRate)}`;
  const vatLblShort = S.vatRate === null ? 'Total VAT / รวมภาษีมูลค่าเพิ่ม' : 'Total VAT / รวมภาษีมูลค่าเพิ่ม';

  return `
    <div class="cnd print-area${isVoid ? ' cnd-void' : ''}${isDraft ? ' cnd-draft' : ''}">
      ${isVoid ? '<div class="cnd-badge cnd-badge-v">VOID / ยกเลิก</div>' : ''}
      ${isDraft ? '<div class="cnd-badge cnd-badge-d">DRAFT / ร่าง — ยังไม่ออกเลขที่เอกสาร</div>' : ''}

      <header class="cnd-head">
        <div class="cnd-head-l">
          <img class="cnd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="cnd-co">
            <div class="cnd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="cnd-co-ad">${esc(ISSUER.address)}</div>
            <div class="cnd-co-tl">
              ${ic('tel')} ${esc(ISSUER.tel)} <i>|</i>
              ${ic('doc')} ${esc(ISSUER.fax)} <i>|</i>
              Tax ID: ${esc(ISSUER.taxId)}
            </div>
          </div>
        </div>
        <div class="cnd-head-r">
          <div class="cnd-title">CREDIT NOTE</div>
          <div class="cnd-title-th">ใบลดหนี้</div>
          ${isTaxDoc ? '<div class="cnd-chip">TAX INVOICE <i>/</i> ใบกำกับภาษี</div>' : ''}
        </div>
      </header>
      <div class="cnd-band"></div>

      <section class="cnd-grid">
        <div class="cnd-box">
          <div class="cnd-box-t">${bub('user')}<span>CUSTOMER / ลูกค้า</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f">${ic('user')}
              <div class="cnd-f-b"><div class="cnd-l">Customer Name / ชื่อลูกค้า</div>
                <div class="cnd-v cnd-v-b">${txt(c.name)}</div></div></div>
            <div class="cnd-f cnd-f-2">${ic('id')}
              <div class="cnd-f-b"><div class="cnd-l">Tax ID / เลขประจำตัวผู้เสียภาษี</div>
                <div class="cnd-v">${txt(c.tax_id)}</div></div>
              <div class="cnd-f-b cnd-f-br"><div class="cnd-l">Branch / สาขา</div>
                <div class="cnd-v">${txt(c.branch_code)}</div></div></div>
            <div class="cnd-f">${ic('pin')}
              <div class="cnd-f-b"><div class="cnd-l">Address / ที่อยู่</div>
                <div class="cnd-v cnd-v-ml">${txt(c.address)}</div></div></div>
            <div class="cnd-f cnd-f-last">${ic('tel')}
              <div class="cnd-f-b"><div class="cnd-l">Tel. / โทร.</div>
                <div class="cnd-v cnd-v-b">${txt(c.phone)}</div></div></div>
          </div>
        </div>

        <div class="cnd-box">
          <div class="cnd-box-t">${bub('doc')}<span>CREDIT NOTE DETAILS / รายละเอียดใบลดหนี้</span></div>
          <div class="cnd-box-b">
            <div class="cnd-f cnd-f-kv">${ic('doc')}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note No. / เลขที่ใบลดหนี้</div></div>
              <div class="cnd-kv">${cnNo ? esc(cnNo) : '<span class="cnd-pend">รอออกเลขตอน POST</span>'}</div></div>
            <div class="cnd-f cnd-f-kv">${ic('cal')}
              <div class="cnd-f-b"><div class="cnd-l">Credit Note Date / วันที่ออกใบลดหนี้</div></div>
              <div class="cnd-kv cnd-kv-s">${dmy(cn.credit_note_date)}</div></div>
            <div class="cnd-f cnd-f-kv">${ic('cal')}
              <div class="cnd-f-b"><div class="cnd-l">Invoice Reference / อ้างอิงใบแจ้งหนี้</div></div>
              <div class="cnd-kv cnd-kv-s">${txt(inv.invoice_no)}</div></div>
            <div class="cnd-f cnd-f-last">${ic('note')}
              <div class="cnd-f-b"><div class="cnd-l">Reason / เหตุผลในการลดหนี้</div>
                <div class="cnd-v cnd-v-ml">${txt(cn.reason)}</div></div></div>
          </div>
        </div>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">INVOICE REFERENCE <i>/ รายการอ้างอิงใบแจ้งหนี้</i></div>
        <table class="cnd-tbl cnd-tbl-ref">
          <colgroup><col class="w-no"><col class="w-ino"><col class="w-idt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Invoice No. / เลขที่ใบแจ้งหนี้</th>
            <th class="cnd-c">Invoice Date / วันที่ใบแจ้งหนี้</th>
            <th class="cnd-c">Description / รายการ</th>
            <th class="cnd-c">Amount (THB) / จำนวนเงิน</th>
          </tr></thead>
          <tbody>${invRows}</tbody>
          <tfoot><tr class="cnd-sumrow">
            <td colspan="4" class="cnd-r">Total Referenced Amount / รวมจำนวนเงินอ้างอิง</td>
            <td class="cnd-r cnd-b">${money(invTotal)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="cnd-sec">
        <div class="cnd-sec-t">CREDIT NOTE ITEMS <i>/ รายการลดหนี้</i></div>
        <table class="cnd-tbl cnd-tbl-cn">
          <colgroup><col class="w-no"><col class="w-ds"><col class="w-og"><col class="w-co">
            <col class="w-df"><col class="w-vr"><col class="w-va"><col class="w-cr"></colgroup>
          <thead><tr>
            <th class="cnd-c">No.</th>
            <th class="cnd-c">Description / รายการ</th>
            <th class="cnd-c">Original /<br>มูลค่าเดิม</th>
            <th class="cnd-c">Correct /<br>มูลค่าที่ถูกต้อง</th>
            <th class="cnd-c">Difference /<br>ผลต่างที่ลด</th>
            <th class="cnd-c">VAT Rate /<br>อัตรา VAT</th>
            <th class="cnd-c">VAT Diff. /<br>VAT ที่ลด</th>
            <th class="cnd-c">Credit Amount /<br>จำนวนเงินลดหนี้</th>
          </tr></thead>
          <tbody>${cnRows}</tbody>
          <tfoot>
            ${hasOrig ? `<tr class="cnd-sumrow">
              <td colspan="2" class="cnd-r">Total / รวม</td>
              <td class="cnd-r">${money(tOrig)}</td>
              <td class="cnd-r">${tCorrOk ? money(tCorr) : '-'}</td>
              <td class="cnd-r cnd-df">${money(S.sub)}</td>
              <td></td>
              <td class="cnd-r">${money(S.vat)}</td>
              <td class="cnd-r">${money(S.total)}</td></tr>` : ''}
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">Total Credit (Before VAT) / รวมก่อนภาษีมูลค่าเพิ่ม</td>
              <td class="cnd-r">${money(S.sub)}</td></tr>
            <tr class="cnd-sumrow">
              <td colspan="7" class="cnd-r">${esc(vatLblShort)}</td>
              <td class="cnd-r">${money(S.vat)}</td></tr>
            <tr class="cnd-sumrow cnd-sumrow-g">
              <td colspan="7" class="cnd-r">TOTAL CREDIT AMOUNT / รวมจำนวนเงินลดหนี้</td>
              <td class="cnd-r">${money(S.total)}</td></tr>
          </tfoot>
        </table>
      </section>

      <section class="cnd-mid">
        <div class="cnd-words">
          <div class="cnd-words-t">Amount in words / จำนวนเงินเป็นตัวอักษร</div>
          <div class="cnd-words-v">( ${esc(bahtText(S.total))} )</div>
          <div class="cnd-words-ln"></div>
        </div>
        <div class="cnd-sum">
          <div class="cnd-sl"><span>SubTotal (Before VAT) / รวมก่อนภาษีมูลค่าเพิ่ม</span>
            <span>${money(S.sub)}</span></div>
          <div class="cnd-sl"><span>${esc(vatLbl)}</span><span>${money(S.vat)}</span></div>
          <div class="cnd-sl cnd-sl-g"><span>TOTAL CREDIT AMOUNT / รวมจำนวนเงินลดหนี้</span>
            <span>${money(S.total)}</span></div>
        </div>
      </section>

      <section class="cnd-note">
        <div class="cnd-note-t">NOTE / หมายเหตุ</div>
        <ol class="cnd-note-l">
          <li><span>This Credit Note is issued for the amount as stated above.</span>
              <em>ใบลดหนี้นี้ออกสำหรับจำนวนเงินตามที่ระบุข้างต้น</em></li>
          <li><span>This Credit Note will be used to adjust the payment in the next invoice.</span>
              <em>ใบลดหนี้นี้จะถูกนำไปใช้ปรับยอดรับชำระในใบแจ้งหนี้ถัดไป</em></li>
          <li><span>No cash refund for this Credit Note.</span>
              <em>ใบลดหนี้นี้ไม่สามารถขอคืนเป็นเงินสดได้</em></li>
        </ol>
      </section>

      <div class="cnd-edge"></div>
    </div>`;
}

/* เปิดดูเอกสาร — print=true สั่งพิมพ์ให้เลย
   Preview / Print / PDF ใช้ HTML ชุดเดียวกันทั้งหมด (ไม่มี template แยก)
   ไม่แตะสถานะเอกสารใด ๆ */
export function openCreditNoteDoc(cn, { print = false } = {}) {
  const b = document.createElement('div');
  b.innerHTML = creditNoteDocHTML(cn);
  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="cnd-print">🖨 Print Credit Note</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;
  const no = String(cn.credit_note_no || '');
  openModal({
    title: 'ใบลดหนี้ ' + (/^CNDRAFT-/.test(no) || String(cn.status).toUpperCase() === 'DRAFT' ? '(ร่าง)' : no),
    body: b, footer: f, fullscreen: true, wide: true });
  f.querySelector('#cnd-print').onclick = () => window.print();
  if (print) setTimeout(() => window.print(), 60);
}
