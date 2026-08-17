/* Renderer เอกสาร RECEIPT / TAX INVOICE ชุดเดียว — Preview / Print / Save PDF
   ─────────────────────────────────────────────────────────────────────
   *** Template เดียวของทั้งระบบ *** receipt-form.js เรียกตัวนี้ตัวเดียว
   ไม่เปลี่ยนสถานะเอกสาร · ไม่เรียก RPC ใด ๆ · ไม่ออกเลขใบเสร็จเอง
   ตัวเลขทุกตัวมาจาก Backend (njacc_list_receipts) ที่คำนวณด้วย SQL แล้วเท่านั้น
   ที่นี่ทำแค่ "จัดกลุ่ม + จัดรูปแบบเพื่อแสดงผล" */
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

/* ไอคอน outline บาง สีเดียว (currentColor) — ชุดเดียวกับเอกสาร INVOICE */
const ICON = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
  tax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><circle cx="8.4" cy="11" r="2"/><path d="M5 16.4c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.6 10h4.2M14.6 13.4h4.2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.4"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3.8h3.6l1.6 4-2.2 1.4a12 12 0 0 0 5.8 5.8l1.4-2.2 4 1.6V18a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 3 6a2 2 0 0 1 2-2.2z"/></svg>',
  rc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M3.4 10h17.2M8 3v4M16 3v4"/></svg>',
  ref: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.4"/><path d="M8.6 15.4 12 8.6l3.4 6.8M9.8 13.2h4.4"/></svg>',
};
const ic = (k) => `<span class="rcd-ic">${ICON[k] || ''}</span>`;

/* ── รายการอ้างอิงใบแจ้งหนี้ ──
   ข้อมูลมาจาก njacc_list_receipts -> rows[].invoices[]
   ของเดิมส่งมาแค่ {invoice_no, amount}
   หลังรัน RUN-01_028 จะมี invoice_date / description / charge_type /
   subtotal / vat_amount / wht_amount / total_amount เพิ่มมาให้ครบ

   ADVANCE (ข้อ 12): ไม่แสดงเป็นรายการขายในใบเสร็จนี้
   แต่ "ไม่เงียบ" — ถ้ามีการตัดกับใบ ADVANCE จริง จะขึ้นบรรทัดกำกับใต้ตาราง
   เพื่อไม่ให้ยอดหายไปเฉย ๆ โดยไม่มีคำอธิบาย (รักษา Audit Trail) */
function splitInvoices(list) {
  const shown = [], excluded = [];
  for (const iv of (list || [])) {
    /* ตัดสินจาก charge_type จริงของใบแจ้งหนี้เท่านั้น
       ถ้า RPC ยังไม่ส่ง charge_type มา ถือว่าเป็น SERVICE ตามคิว FINANCE > Receipt
       (njacc_receipt_pending คัดเฉพาะ SERVICE อยู่แล้ว) */
    if (String(iv.charge_type || 'SERVICE').toUpperCase() === 'ADVANCE') excluded.push(iv);
    else shown.push(iv);
  }
  return { shown, excluded };
}

/* ── สรุปยอด ──
   ═══ FIX: หัก WHT ซ้ำซ้อน ═══════════════════════════════════════════
   Backend (RUN-03) ตัดชำระด้วย "ยอดที่ต้องรับจริง" = total_amount − wht_amount
   ดังนั้น njacc_receipt_allocations.amount ที่ส่งมาที่นี่คือ "เงินสดที่รับจริง"
   ซึ่งหัก WHT ออกไปแล้ว

   ของเดิมคิด  ratio = allocated / invoice.total_amount   ← หารด้วยยอด GROSS
     ตัวอย่างจริง Total 1,605 · WHT 45 · รับเต็มใบ = 1,560
       ratio = 1,560 / 1,605 = 0.9720
       SubTotal = 1,500 × 0.9720 = 1,458.00   ← ผิด ควรเป็น 1,500.00
       VAT      =   105 × 0.9720 =   102.06   ← ผิด ควรเป็น   105.00
       WHT      =    45 × 0.9720 =    43.74   ← ผิด ควรเป็น    45.00
       RECEIVED = 1,560 − 43.74  = 1,516.26   ← ผิด ควรเป็น 1,560.00
     => WHT ถูกหัก 2 ครั้ง (ครั้งแรกตอนตัดชำระที่ SQL · ครั้งที่สองที่บรรทัดนี้)

   ของใหม่คิด  ratio = allocated / netReceivable(iv)
                netReceivable = invoice.total_amount − invoice.wht_amount
     ตัดเต็มใบ  -> ratio = 1 -> ได้ตัวเลขจริงของใบนั้นตรง ๆ ไม่เพี้ยน
     ตัดบางส่วน -> เฉลี่ยตามสัดส่วนของ "ยอดที่ต้องรับ" ซึ่งเป็นฐานเดียวกับที่ SQL ใช้
     => ฐานคำนวณเดียวกันทั้งระบบ · ไม่มีการหัก WHT ซ้ำ

   WHT แยกอัตรา : ใช้ iv.wht_breakdown จาก njacc_list_receipts (05_RUN-04)
                  ซึ่งอ่านมาจาก njacc_invoice_items.wht_rate ของจริง
                  ยังไม่รัน 05_RUN-04 -> ไม่มี breakdown -> ถอยไปใช้ iv.wht_rate
                  ไม่มีทั้งคู่ -> แสดง "Withholding Tax" เฉย ๆ ไม่เดาอัตรา
   AMOUNT RECEIVED = ผลรวม allocation จริง (S.total) ไม่ลบ WHT ซ้ำอีก
     ตรงกับ njacc_receipts.total_received และ Payment จริงเสมอ
   Total (แถวก่อน WHT) = SubTotal + VAT = ส่วนของยอดใบแจ้งหนี้ที่ตัดครั้งนี้
     ความสัมพันธ์ที่ต้องเป็นจริงเสมอ:  Total − WHT = AMOUNT RECEIVED

   ถ้า RPC ยังไม่ส่งตัวเลขภาษีมา (ยังไม่รัน RUN_2_RECEIPT) -> hasTax=false
       จะแสดง "-" ในช่อง SubTotal/VAT/WHT แทนการเดาค่า
       และ AMOUNT RECEIVED = ผลรวม allocation ตามเดิม (ยังถูกต้อง) */
/* grossOf(iv) = ส่วนของ "ยอดเต็มใบแจ้งหนี้" ที่ถูกตัดด้วยเงินรับก้อนนี้
     ratio      = allocation / netReceivable          (net = total_amount − wht_amount)
     grossPortion = invoice.total_amount × ratio
   ตัดเต็มใบ  -> ratio = 1 -> grossPortion = total_amount เป๊ะ (1,605 ไม่ใช่ 1,560)
   ตัดบางส่วน -> เฉลี่ยตามสัดส่วนของยอดที่ต้องรับ ซึ่งเป็นฐานเดียวกับที่ SQL ใช้
   ไม่มีข้อมูลภาษี (ยังไม่รัน RUN_2_RECEIPT) -> คืน null ให้ผู้เรียกแสดง allocation ตามเดิม */
function grossOf(iv) {
  const invTotal = num(iv.total_amount);
  if (invTotal <= 0 || iv.subtotal === undefined || iv.subtotal === null) return null;
  const net = r2(invTotal - num(iv.wht_amount));
  if (net <= 0) return null;
  return { ratio: num(iv.amount) / net, net };
}

function summarize(shown) {
  let total = 0, sub = 0, vat = 0, wht = 0, gross = 0, hasTax = false;
  const rates = new Set();
  /* WHT แยกตามอัตราจริงรายใบ — ไม่ยุบเป็นอัตราเดียว ไม่ hardcode
     Map<rate, amount> · ใช้ได้ทั้งกรณีอัตราเดียวและหลายอัตราปนกันในใบเสร็จเดียว */
  const whtBy = new Map();
  for (const iv of shown) {
    const alloc = num(iv.amount);
    total = r2(total + alloc);
    const g = grossOf(iv);
    if (!g) continue;
    hasTax = true;
    gross = r2(gross + num(iv.total_amount) * g.ratio);
    sub = r2(sub + num(iv.subtotal) * g.ratio);
    vat = r2(vat + num(iv.vat_amount) * g.ratio);
    const w = r2(num(iv.wht_amount) * g.ratio);
    wht = r2(wht + w);
    if (num(iv.vat_rate) > 0) rates.add(num(iv.vat_rate));
    /* ── อัตรา WHT ต้องมาจาก Backend จริงเท่านั้น · ไม่มี fallback 3% ──
       ลำดับความน่าเชื่อถือของข้อมูล:
       1) iv.wht_breakdown  = [{rate, amount}] จาก njacc_invoice_items.wht_rate
          (RPC njacc_list_receipts หลังรัน 05_RUN-04) ← แม่นที่สุด
          1 ใบแจ้งหนี้มีได้หลายอัตราพร้อมกัน เช่น ขนส่ง 1% + บริการ 3%
          เฉลี่ยตาม ratio เดียวกับช่องอื่น -> Partial Payment ก็ถูก
       2) iv.wht_rate ระดับใบ (ถ้า RPC รุ่นเก่าส่งมา) = อัตราเดียวทั้งใบ
       3) ไม่รู้อัตราเลย -> คีย์ null -> แสดง "Withholding Tax" เฉย ๆ
          *** ห้ามเดาเปอร์เซ็นต์ *** */
    const bd = Array.isArray(iv.wht_breakdown) ? iv.wht_breakdown : null;
    if (bd && bd.length) {
      for (const b of bd) {
        const amt = r2(num(b.amount) * g.ratio);
        if (amt === 0) continue;
        const k = (b.rate === null || b.rate === undefined || b.rate === '')
          ? null : num(b.rate);
        whtBy.set(k, r2((whtBy.get(k) || 0) + amt));
      }
    } else if (w !== 0) {
      const k = (iv.wht_rate === null || iv.wht_rate === undefined || iv.wht_rate === '')
        ? null : num(iv.wht_rate);
      whtBy.set(k, r2((whtBy.get(k) || 0) + w));
    }
  }
  const vatRate = rates.size === 1 ? [...rates][0] : (rates.size === 0 ? 0 : null);
  /* อัตราเดียวและรู้ค่าจริง -> ใช้แสดงบน label · หลายอัตราหรือไม่รู้ -> null (ไม่เดา) */
  const wKeys = [...whtBy.keys()];
  const whtRate = (wKeys.length === 1 && wKeys[0] !== null) ? wKeys[0] : null;
  /* grossTotal = ยอดเต็มใบแจ้งหนี้ส่วนที่ตัดครั้งนี้
     ความสัมพันธ์ที่ต้องเป็นจริงเสมอ: grossTotal − wht = total (เงินรับจริง) */
  const grossTotal = hasTax ? gross : total;
  return { total, sub, vat, wht, hasTax, vatRate, whtRate, whtBy,
           grossTotal, received: total };
}

export function receiptDocHTML(r) {
  const { shown, excluded } = splitInvoices(r.invoices);
  const S = summarize(shown);
  const isVoid = String(r.status || '').toUpperCase() === 'VOID';

  /* Invoice Reference บนหัวการ์ด (ข้อ 7) */
  const refTop = shown.length === 0 ? '-'
    : shown.length === 1 ? esc(shown[0].invoice_no || '-')
    : 'Multiple (See Below) / หลายใบ (ดูด้านล่าง)';

  const rows = shown.map((iv, i) => `<tr>
      <td class="rcd-no">${i + 1}</td>
      <td class="rcd-inv">${txt(iv.invoice_no)}</td>
      <td class="rcd-dt">${iv.invoice_date ? dmy(iv.invoice_date) : '-'}</td>
      <td class="rcd-ds">${txt(iv.description, '-')}</td>
      <td class="r">${(() => { const g = grossOf(iv);
        /* ข้อ 2: คอลัมน์นี้คือ "ยอดใบแจ้งหนี้" (GROSS) ไม่ใช่เงินสดที่รับ
           รับเต็มใบ -> 1,605.00 (ไม่ใช่ 1,560.00)
           ไม่มีข้อมูลภาษี -> ถอยไปแสดง allocation ตามเดิม ดีกว่าเดาค่า */
        return money(g ? r2(num(iv.total_amount) * g.ratio) : iv.amount); })()}</td></tr>`).join('')
    || '<tr><td colspan="5" class="rcd-empty">ไม่มีรายการอ้างอิงใบแจ้งหนี้</td></tr>';

  /* label อัตรา — สะท้อนค่าจริงเท่านั้น
     hasTax=false (RPC ยังไม่ส่งตัวเลขภาษีมา) -> ไม่พิมพ์ % เลย กันเข้าใจผิดว่าเป็น 0%
     หลายอัตราปนกัน -> ไม่พิมพ์ % เช่นกัน (ยอดรวมยังถูกต้อง) */
  const vatLbl = !S.hasTax || S.vatRate === null ? '' : `${S.vatRate} %`;
  const whtLbl = !S.hasTax || S.whtRate === null ? '' : `${S.whtRate} %`;
  /* ── แถว Withholding Tax ──
     ยังไม่มีข้อมูลภาษี      -> แสดง "-"
     อัตราเดียวและรู้ค่าจริง -> "Withholding Tax 1 %" / "3 %" ตามค่าจริง
     หลายอัตราปนกัน          -> แยกบรรทัดตามอัตราจริง ไม่ยุบเป็นอัตราเดียว
     ไม่รู้อัตรา (RPC ไม่ส่ง) -> "Withholding Tax" เฉย ๆ ไม่เดาเปอร์เซ็นต์ */
  const whtEntries = [...(S.whtBy || new Map()).entries()];
  const pctTxt = (k) => (k === null ? '' :
    ' ' + (Number.isInteger(k) ? String(k) : String(r2(k))) + ' %');
  const whtLines = !S.hasTax
    ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>-</span></div>`
    : (whtEntries.length === 0
        ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax</span><span>${money(0)}</span></div>`
        : (whtEntries.length === 1
            ? `<div class="rcd-sl rcd-sl-w"><span>Withholding Tax${esc(pctTxt(whtEntries[0][0]))}</span>
                 <span>-${money(whtEntries[0][1])}</span></div>`
            : whtEntries
                .sort((a, b) => (a[0] ?? 1e9) - (b[0] ?? 1e9))
                .map(([k, v]) => `<div class="rcd-sl rcd-sl-w">
                   <span>Withholding Tax${esc(pctTxt(k))}</span><span>-${money(v)}</span></div>`).join('')
              + `<div class="rcd-sl rcd-sl-w"><span>Total Withholding Tax</span>
                   <span>-${money(S.wht)}</span></div>`));
  const m = (v) => (S.hasTax ? money(v) : '-');

  return `
    <div class="rcd print-area${isVoid ? ' rcd-void' : ''}">
      ${isVoid ? '<div class="rcd-badge">VOID / ยกเลิก</div>' : ''}

      <header class="rcd-head">
        <div class="rcd-head-l">
          <img class="rcd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
          <div class="rcd-co">
            <div class="rcd-co-nm">${esc(ISSUER.nameEn)}</div>
            <div class="rcd-co-ad">${esc(ISSUER.address)}</div>
            <div class="rcd-co-tl">Tel. ${esc(ISSUER.tel)} <i>|</i> Fax. ${esc(ISSUER.fax)}
              <i>|</i> Tax ID ${esc(ISSUER.taxId)}</div>
          </div>
        </div>
        <div class="rcd-head-r">
          <div class="rcd-title">RECEIPT /<br>ใบเสร็จรับเงิน</div>
          <div class="rcd-sub">TAX INVOICE / ใบกำกับภาษี</div>
        </div>
      </header>

      <section class="rcd-cards">
        <div class="rcd-card">
          <div class="rcd-card-t">${ic('user')}CUSTOMER / ลูกค้า</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${ic('user')}<div class="rcd-fb">
              <label>Customer Name / ชื่อลูกค้า:</label>
              <div class="v v-b">${txt(r.customer_name)}</div></div></div>
            <div class="rcd-f">${ic('tax')}<div class="rcd-fb rcd-2col">
              <div><label>Tax ID / เลขประจำตัวผู้เสียภาษี:</label>
                <div class="v v-b">${txt(r.customer_tax_id)}</div></div>
              <div><label>Branch / สาขา:</label>
                <div class="v v-b">${txt(r.customer_branch_code)}</div></div>
            </div></div>
            <div class="rcd-f">${ic('pin')}<div class="rcd-fb">
              <label>Address / ที่อยู่:</label>
              <div class="v">${txt(r.customer_address, '')}</div></div></div>
            <div class="rcd-f rcd-f-last">${ic('tel')}<div class="rcd-fb">
              <label>Tel. / โทร.:</label>
              <div class="v v-b">${txt(r.customer_phone)}</div></div></div>
          </div>
        </div>
        <div class="rcd-card">
          <div class="rcd-card-t">${ic('rc')}RECEIPT DETAILS / รายละเอียดใบเสร็จ</div>
          <div class="rcd-card-b">
            <div class="rcd-f">${ic('rc')}<div class="rcd-fb rcd-kv">
              <label>Receipt No. / เลขที่ใบเสร็จ:</label>
              <div class="v v-b v-lg">${txt(r.receipt_no)}</div></div></div>
            <div class="rcd-f">${ic('cal')}<div class="rcd-fb rcd-kv">
              <label>Receipt Date / วันที่ออกใบเสร็จ:</label>
              <div class="v v-b v-lg">${dmy(r.receipt_date)}</div></div></div>
            <div class="rcd-f rcd-f-last">${ic('ref')}<div class="rcd-fb">
              <label>Invoice Reference / อ้างอิงใบแจ้งหนี้:</label>
              <div class="v v-b v-md">${refTop}</div></div></div>
          </div>
        </div>
      </section>

      <section class="rcd-tblwrap">
        <div class="rcd-tbl-t">INVOICE REFERENCE / รายการอ้างอิงใบแจ้งหนี้</div>
        <table class="rcd-tbl">
          <colgroup><col class="w-no"><col class="w-inv"><col class="w-dt">
            <col class="w-ds"><col class="w-amt"></colgroup>
          <thead><tr>
            <th class="c">No.</th>
            <th>Invoice No. /<small>เลขที่ใบแจ้งหนี้</small></th>
            <th>Invoice Date /<small>วันที่ใบแจ้งหนี้</small></th>
            <th>Description /<small>รายการ</small></th>
            <th class="r">Amount (THB) /<small>จำนวนเงิน (บาท)</small></th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="rcd-trow">
            <td colspan="4" class="r">Total Amount / รวมเงินตามใบแจ้งหนี้</td>
            <!-- FIX: ต้องเป็น GROSS ให้ตรงกับคอลัมน์ Amount ของแต่ละแถว
                 ของเดิมใช้ S.total ซึ่งเป็นเงินสดที่รับจริง (หัก WHT แล้ว)
                 -> แถวรวม 1,605.00 แต่ Footer โชว์ 1,560.00 ไม่ตรงกันเอง
                 S.grossTotal = Σ (invoice.total_amount × ratio) ของทุกแถวที่แสดง
                 = ผลรวม Amount ของแถวเป๊ะ ๆ
                 *** AMOUNT RECEIVED ด้านล่างยังเป็น Net Cash เหมือนเดิม ไม่แตะ *** -->
            <td class="r rcd-trow-g">${money(S.grossTotal)}</td>
          </tr></tfoot>
        </table>
        ${excluded.length ? `<div class="rcd-note">* ไม่รวมรายการสำรองจ่าย (Advance) จำนวน
          ${excluded.length} ใบ — ออกเป็นเอกสาร Advance แยกต่างหาก</div>` : ''}
      </section>

      <section class="rcd-mid">
        <div class="rcd-words">
          <div class="rcd-w-t">${ic('abc')}<span>Amount in words / จำนวนเงินเป็นตัวอักษร</span></div>
          <div class="rcd-w-v">(${esc(bahtText(S.received))})</div>
        </div>
        <div class="rcd-sum">
          <div class="rcd-sl"><span>SubTotal${vatLbl ? " " + vatLbl : ""}</span><span>${m(S.sub)}</span></div>
          <div class="rcd-sl"><span>VAT${vatLbl ? " " + vatLbl : ""}</span><span>${m(S.vat)}</span></div>
          <div class="rcd-sl rcd-sl-m"><span>Total</span><span>${money(S.grossTotal)}</span></div>
          ${whtLines}
          <div class="rcd-sl rcd-sl-g"><span>AMOUNT RECEIVED /<i>ยอดรับชำระสุทธิ</i></span>
            <span>${money(S.received)}</span></div>
        </div>
      </section>
      <div class="rcd-edge"></div>
    </div>`;
}

/* เปิดดูเอกสาร — print=true สั่งพิมพ์ให้เลย · ไม่แตะสถานะเอกสารใด ๆ */
export function openReceiptDoc(r, { print = false } = {}) {
  const b = document.createElement('div');
  b.innerHTML = receiptDocHTML(r);
  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left"></div><div class="mf-right">
      <button class="btn btn-print" id="rcd-print">🖨 Print Receipt</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;
  openModal({ title: 'ใบเสร็จรับเงิน ' + (r.receipt_no || ''),
              body: b, footer: f, fullscreen: true, wide: true });
  f.querySelector('#rcd-print').onclick = () => window.print();
  if (print) setTimeout(() => window.print(), 60);
}
