/* ตารางรายการ — ลำดับคอลัมน์ LOCK (SERVICE 22 / ADVANCE 21) ห้ามเพิ่ม/ลบ
   SERVICE: Status, Remaining, Date, Invoice No., Customer name, Customer Job No.,
            Company Invoice, House B/L No., Service charge, Advance, VAT 7%, Amount,
            WHT 3%, Total Amount, I BILLING APL, Case, Contact, ETD, ETA, Due Date, NOTE, จัดการ
   ADVANCE: Status, Remaining, Date, Invoice No., Customer name, Customer Job No.,
            Company Invoice, House B/L No., Case, Contact, ETD, ETA, Advance, VAT 7%,
            Amount, WHT 3%, Total Amount, I BILLING APL, Due Date, NOTE, จัดการ

   ความหมายตัวเลข (ดู README ประกอบ):
     Amount       = subtotal (ยอดก่อน VAT) จาก INVOICE ที่ ISSUED หรือจาก snapshot ที่ import มา
     Total Amount = net_payable = Gross(subtotal+VAT) − WHT  ← ความหมายเดียวกับ Billing เดิม
     ไม่มีทั้ง INVOICE และ snapshot → แสดง '-' (ไม่ใช่ 0.00)
   Invoice No.  = เลข INVOICE ของระบบบัญชี · เลขจากไฟล์เดิมแสดงเป็นบรรทัด SRC: แยกชัด
   Due Date     = effective due (ใช้ due ของ INVOICE เมื่อ ISSUED, ไม่งั้นใช้ของงาน) */
import { esc, money, dmy, remainingBadge, statusBadge, payBadge } from '../core/formatter.js';

const SORT_DATE = '<th class="sortable" data-sort="date">Date ⇅</th>';
const SORT_INV = '<th class="sortable" data-sort="invoice_no">Invoice No. ⇅</th>';

/* ══ ชื่อหัวคอลัมน์ฝั่ง DOCUMENT — ต้องตรงกับชื่อฟิลด์ในฟอร์ม "เปิดงานใหม่" 1:1 ══
   ใช้ชุดเดียวกันทั้ง 4 หน้า (DOCUMENT Service/Advance และ ACCOUNTING Service/Advance)
   ห้ามหน้าไหนใช้ชื่อย่อคนละแบบ เช่น INVOICE SOURCE / HOUSE B/L / VESSEL
   ── นี่คือการเปลี่ยน "ป้ายชื่อ" เท่านั้น · field ที่ map อยู่ใต้หัวไม่เปลี่ยน ── */
const DOC_LABELS = [
  'เลขที่งาน',                 // job_no
  'บริษัท Invoice',            // company_invoice
  'ลูกค้า',                    // customer_name
  'Customer Job No.',          // customer_job_no
  'เลขใบขนสินค้า',             // customs_declaration_no
  'Invoice ต้นทาง (Source)',   // source_invoice_no
  'House B/L No.',             // house_bl_no
  'Master B/L No.',            // master_bl_no
  'Booking No.',               // booking_no
  'ชื่อเรือ / Vessel',          // vessel_name
  'จำนวนตู้',                  // qty_container  (จัดชิดขวา)
  'ETD',                       // etd
  'ETA',                       // eta
  'วันส่งมอบ',                 // delivery_date
];
/* ── คอลัมน์ที่ซ่อนเฉพาะหน้ารายการ DOCUMENT (Service + Advance) ──
   ซ่อนที่ "การแสดงผลตาราง" เท่านั้น
     ยังเก็บใน Database ครบ · ยังมีช่องกรอกในฟอร์มเปิดงาน/แก้ไขงาน
     ACCOUNTING ยังแสดงครบทั้ง 14 คอลัมน์เหมือนเดิม
     Export Excel ไม่ได้อ้าง DOC_LABELS อยู่แล้ว (คนละ logic) จึงไม่กระทบ
   ── ตัดทั้ง <th> และ <td> พร้อมกันจากลำดับเดียวกัน ──
   ไม่ได้ซ่อนด้วย CSS จึงไม่เหลือช่องว่างของคอลัมน์เดิม */
const DOC_HIDDEN_IN_LIST = ['Booking No.', 'ชื่อเรือ / Vessel', 'วันส่งมอบ'];
/* index ของคอลัมน์ที่ซ่อน — ใช้ตัด cell ให้ตรงกับ header เป๊ะ */
const DOC_HIDDEN_IDX = DOC_HIDDEN_IN_LIST.map(l => DOC_LABELS.indexOf(l));

const thOf = (l) => `<th${l === 'จำนวนตู้' ? ' class="r"' : ''}>${l}</th>`;
/* ชุดเต็ม — ใช้กับ ACCOUNTING (ต้องเห็นข้อมูล DOCUMENT ครบตามที่กำหนดไว้เดิม) */
const DOC_HEAD_CELLS = DOC_LABELS.map(thOf).join('');
/* ชุดย่อ — ใช้กับหน้ารายการ DOCUMENT */
const DOC_HEAD_CELLS_LIST = DOC_LABELS
  .filter(l => !DOC_HIDDEN_IN_LIST.includes(l)).map(thOf).join('');

const ACT_HEAD = '<th class="center col-act">จัดการ</th>';

/* DOCUMENT = ชุด DOCUMENT (ซ่อน 3 คอลัมน์) + จัดการ */
const DOC_HEAD = DOC_HEAD_CELLS_LIST + ACT_HEAD;

/* ACCOUNTING = ชุด DOCUMENT (ชื่อเดียวกันเป๊ะ) แล้วต่อท้ายด้วยข้อมูลฝั่งบัญชี */
const ACC_TAIL_COMMON = '<th>Status</th><th>Remaining</th>' + SORT_DATE + SORT_INV +
  '<th>Case</th><th>Contact</th>';
const MONEY_SVC = '<th class="r">Service charge</th><th class="r">Advance</th><th class="r">VAT 7%</th>' +
  '<th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross − WHT">Total Amount</th>';
const MONEY_ADV = '<th class="r">Advance</th><th class="r">VAT 7%</th>' +
  '<th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross − WHT">Total Amount</th>';
const ACC_TAIL_END_CELLS = '<th>I BILLING APL</th><th>Due Date</th><th>NOTE</th>';
const ACC_TAIL_END = ACC_TAIL_END_CELLS + ACT_HEAD;

/* ══ ACCOUNTING > Advance — ชุดคอลัมน์เฉพาะ ══
   งาน Advance คือ "สำรองจ่าย" ไม่ใช่ยอดขาย จึงไม่ควรใช้ชุดเดียวกับ Service
   ตัดคอลัมน์ที่ไม่เกี่ยว (VAT / Amount / WHT / Case / Contact / Remaining /
   Invoice No. / I BILLING APL / Due Date และคอลัมน์ DOCUMENT ที่ไม่จำเป็น) ออกจาก "การแสดงผล"
   ── ซ่อนเฉพาะการแสดงผลตาราง ──
     ไม่ลบข้อมูลใน Database · RPC ยังส่งมาครบทุก field
     Export / Invoice / Modal ออกวางบิล ยังใช้ค่าเดิมได้ทั้งหมด */
const ADV_HEAD_CELLS =
  '<th>เลขที่งาน</th>' +
  '<th>ลูกค้า</th>' +
  '<th>Customer Job No.</th>' +
  SORT_DATE +
  '<th>สถานะ</th>' +
  '<th class="r">Advance</th>' +
  '<th class="r">Cost</th>' +
  '<th class="r">Charge</th>' +
  '<th class="r" title="Net Payable = Gross − WHT">Total</th>' +
  '<th>หมายเหตุ</th>';
/* ACCOUNTING > Advance — ชุดเดียวกันแต่ไม่มีคอลัมน์ "จัดการ" (คลิกแถวแทน) */
const ADV_HEAD_ACT = ADV_HEAD_CELLS + ACT_HEAD;

/* ── ACCOUNTING: ไม่มีคอลัมน์ "จัดการ" แล้ว ──────────────────────────────
   ปุ่มเดิมในคอลัมน์นั้นมีแค่ "ออกวางบิล" / "ดู INVOICE" ซึ่งทั้งคู่เปิด
   openBillingModal(jobId) ตัวเดียวกัน -> ถูกแทนด้วย "คลิกแถว" ทั้งหมด
   จึงไม่มี Action ที่ Row Click ทดแทนไม่ได้เหลืออยู่ -> ตัดคอลัมน์ทิ้งได้
   *** DOCUMENT ยังมีคอลัมน์ "จัดการ" *** เพราะยังมี ปิดงาน / ลบ ซึ่งเป็น
   Action คนละหน้าที่กับการเปิดงาน และผูกกับ Permission เฉพาะ
   mode 'advance' (FINANCE > Advance) และ 'closed' (Close Job) ไม่อยู่ในขอบเขต
   -> ยังใช้ ACC_TAIL_END / ADV_HEAD_ACT ที่มี ACT_HEAD เหมือนเดิมทุกประการ */
export function headHTML(charge, mode) {
  /* โหมดที่ "คลิกแถว" แทนปุ่มเปิดข้อมูลได้ทั้งหมด -> ไม่มีคอลัมน์ "จัดการ"
       accounting = เดิมมีแค่ ออกวางบิล / ดู INVOICE
       closed     = เดิมมีแค่ ดู / ดู INVOICE
     ส่วน document (ปิดงาน/ลบ) และ advance (settle/พิมพ์) ยังมีคอลัมน์นี้อยู่ */
  const noAct = mode === 'accounting' || mode === 'closed';
  if (mode === 'document') return DOC_HEAD;
  if (charge === 'ADVANCE' && mode === 'accounting') return ADV_HEAD_CELLS;
  if (charge === 'ADVANCE' && mode === 'advance') return ADV_HEAD_ACT;
  return DOC_HEAD_CELLS + ACC_TAIL_COMMON +
    (charge === 'SERVICE' ? MONEY_SVC : MONEY_ADV) +
    (noAct ? ACC_TAIL_END_CELLS : ACC_TAIL_END);
}
/* นับจากหัวตารางจริง — กันกรณีแก้คอลัมน์แล้วลืมอัปเดตตัวเลข colspan */
export const COL_COUNT = (charge, mode) => (headHTML(charge, mode).match(/<th/g) || []).length;

/* Status = Operational (บน) + Accounting (บรรทัดเล็กล่าง) — ไม่รวมเป็น state เดียว */
function statusCell(r) {
  let acc;
  if (!r.invoice_id) acc = '<span class="st-sub st-sub-none">ยังไม่ออก INV</span>';
  else if (r.invoice_status === 'VOID') acc = '<span class="st-sub st-sub-void">VOID</span>';
  else acc = `<span class="st-sub st-sub-${esc((r.payment_status || 'UNPAID').toLowerCase())}">${esc(r.payment_status || 'UNPAID')}</span>`;
  return `<td class="col-status">${statusBadge(r.operational_status)}<div>${acc}</div></td>`;
}

/* Invoice No. — accounting invoice เป็นค่าหลัก · source แสดงเป็น SRC: บรรทัดเล็ก */
function invoiceCell(r) {
  const main = r.invoice_no
    ? `<span class="t-b">${esc(r.invoice_no)}</span>`
    : '<span class="t-3">ยังไม่ออก INV</span>';
  const src = r.source_invoice_no
    ? `<div class="inv-src" title="เลข Invoice จากระบบเดิม/ต้นทาง">SRC: ${esc(r.source_invoice_no)}</div>` : '';
  return `<td class="nowrap col-inv">${main}${src}</td>`;
}

export function rowHTML(r, charge, perms, mode) {
  const txt = (v, w) => `<td class="ellip" style="max-width:${w}px" title="${esc(v || '')}">${esc(v || '-')}</td>`;

  /* ══ ชุดเซลล์ฝั่ง DOCUMENT — ลำดับตรงกับ DOC_LABELS 1:1 ══
     ใช้ชุดเดียวกันทั้ง DOCUMENT และ ACCOUNTING → หัวกับข้อมูลไม่มีทางเลื่อนผิดคอลัมน์
     field ที่ map ไว้เป็นของเดิมทุกตัว (ไม่แตะ Database / RPC / Save Logic) */
  /* เรียงตรงกับ DOC_LABELS 1:1 — เก็บเป็น array เพื่อตัดคอลัมน์ที่ซ่อนด้วย index เดียวกัน
     จึงไม่มีทางที่หัวกับข้อมูลจะเลื่อนคนละช่อง */
  const docCellArr = [
    `<td class="nowrap"><b>${esc(r.job_no || '-')}</b></td>`,   /* เลขที่งาน */
    txt(r.company_invoice, 130),                                /* บริษัท Invoice */
    txt(r.customer_name, 180),                                  /* ลูกค้า */
    txt(r.customer_job_no, 120),                                /* Customer Job No. */
    txt(r.customs_declaration_no, 130),                         /* เลขใบขนสินค้า */
    txt(r.source_invoice_no, 120),                              /* Invoice ต้นทาง (Source) */
    txt(r.house_bl_no, 130),                                    /* House B/L No. */
    txt(r.master_bl_no, 130),                                   /* Master B/L No. */
    txt(r.booking_no, 120),                                     /* Booking No. */
    txt(r.vessel_name, 140),                                    /* ชื่อเรือ / Vessel */
    `<td class="r">${r.qty_container ?? '-'}</td>`,              /* จำนวนตู้ */
    `<td class="nowrap">${dmy(r.etd)}</td>`,                     /* ETD */
    `<td class="nowrap">${dmy(r.eta)}</td>`,                     /* ETA */
    `<td class="nowrap">${dmy(r.delivery_date)}</td>`,           /* วันส่งมอบ */
  ];
  const docCells = docCellArr.join('');                                   /* ชุดเต็ม — ACCOUNTING */
  const docCellsList = docCellArr.filter((_, i) => !DOC_HIDDEN_IDX.includes(i)).join('');  /* ชุดย่อ — DOCUMENT */

  const actCell = (menu) => menu
    ? `<td class="col-act center"><div class="row-menu">
         <button class="btn-dots" data-rowmenu aria-label="จัดการ">⋮</button>
         <div class="row-drop">${actionsHTML(r, perms, mode)}</div>
       </div></td>`
    : `<td class="col-act"><div class="ch-act">${actionsHTML(r, perms, mode)}</div></td>`;

  /* DOCUMENT แสดงปุ่มตรงในตาราง (ไม่ซ่อนหลังเมนู ⋮) — เหลือ 3 ปุ่มอยู่แถวเดียว */
  if (mode === 'document') return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}" data-inv="${esc(r.invoice_id || '')}">${docCellsList + actCell(false)}</tr>`;

  /* ══ ACCOUNTING = ชุด DOCUMENT (หัวเดียวกันเป๊ะ) + ข้อมูลฝั่งบัญชีต่อท้าย ══ */
  const accCommon = statusCell(r) +
    `<td>${remainingBadge(r.due_date, r)}</td>
     <td class="nowrap">${dmy(r.date)}</td>` + invoiceCell(r) +
    `<td>${esc(r.case_no || '-')}</td>
     <td class="ellip" style="max-width:140px" title="${esc(r.contact || '')}">${esc(r.contact || '-')}</td>`;
  const moneySvc = `<td class="r">${money(r.service_amount)}</td>
      <td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} − WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`;
  const moneyAdv = `<td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} − WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`;
  const accEnd = `<td>${esc(r.i_billing_apl || '-')}</td>
      <td class="nowrap" title="${r.invoice_status === 'ISSUED' ? 'Due จาก INVOICE' : 'Due จากงาน'}">${dmy(r.due_date)}</td>
      <td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${r.id}"
        title="${esc(r.note || 'คลิกเพื่อแก้ NOTE')}">${esc(r.note || '＋ NOTE')}</span></td>` +
      ((mode === 'accounting' || mode === 'closed') ? '' : actCell(false));

  /* ── ACCOUNTING > Advance: ชุดคอลัมน์เฉพาะ (เรียงตรงกับ ADV_HEAD 1:1) ──
     Cost / Charge ยังไม่มีแหล่งข้อมูลระดับงาน (มีแค่รายบรรทัดใน njacc_invoice_items
     และ njacc_build_charge_set ไม่ได้ส่งมา) → แสดงค่าว่าง ไม่คำนวณเองและไม่เดา */
  if (charge === 'ADVANCE') {
    const advBody =
      `<td class="nowrap"><b>${esc(r.job_no || '-')}</b></td>` +
      txt(r.customer_name, 200) +
      txt(r.customer_job_no, 130) +
      `<td class="nowrap">${dmy(r.date)}</td>` +
      statusCell(r) +
      `<td class="r">${money(r.advance_amount)}</td>` +
      `<td class="r t-3" title="ยังไม่มีแหล่งข้อมูลระดับงาน — ดูรายละเอียดที่ INVOICE">${
        r.cost == null ? '-' : money(r.cost)}</td>` +
      `<td class="r t-3" title="ยังไม่มีแหล่งข้อมูลระดับงาน — ดูรายละเอียดที่ INVOICE">${
        r.charge == null ? '-' : money(r.charge)}</td>` +
      `<td class="r t-b" title="Gross ${money(r.gross_total)} − WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>` +
      `<td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${r.id}"
        title="${esc(r.note || 'คลิกเพื่อแก้ NOTE')}">${esc(r.note || '＋ NOTE')}</span></td>` +
      ((mode === 'accounting' || mode === 'closed') ? '' : actCell(false));
    return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}" data-inv="${esc(r.invoice_id || '')}">${advBody}</tr>`;
  }

  const body = docCells + accCommon + (charge === 'SERVICE' ? moneySvc : moneyAdv) + accEnd;
  return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}" data-inv="${esc(r.invoice_id || '')}">${body}</tr>`;
}

/* Row actions ตามสถานะ Operational (แยกจากสถานะบัญชีโดยสิ้นเชิง) */
function actionsHTML(r, perms, mode) {
  /* ── ACCOUNTING (Service/Advance): คอลัมน์ "จัดการ" เหลือปุ่มเดียว ──
     ทุกอย่างต้องทำผ่าน Flow เดียว: ออกวางบิล → DOCUMENT → วางบิล → INVOICE → ออก Invoice
     จึงไม่ render ปุ่ม ดู / แก้ / จบงาน / ยกเลิก / คืนงาน / ถอย / ลบ ที่นี่เลย
     (ลบ trigger ออกจาก HTML จริง ไม่ได้ซ่อนด้วย CSS · handler ฝั่ง charge-page
      ก็มี guard กันเรียก action เหล่านี้จากหน้า ACCOUNTING อีกชั้น)
     งานที่ออก Invoice แล้วยังกด "ดู INVOICE" ได้ตามเดิม
     ── Backend / RPC / Business Logic ของ action เหล่านั้นไม่ถูกลบ ──
     หน้า DOCUMENT ยังใช้ครบทุกปุ่มเหมือนเดิม */
  /* FINANCE > Advance — งาน ADVANCE ที่ POST แล้ว รอจ่าย/เคลียร์
     สถานะมาจาก njacc_jobs.advance_status ที่ server (ไม่ได้คิดเองใน browser) */
  if (mode === 'advance') {
    const st2 = r.advance_status || 'PENDING';
    const nxt = st2 === 'PENDING' ? 'PAID' : st2 === 'PAID' ? 'SETTLED' : null;
    const lbl = { PAID: 'บันทึกจ่ายแล้ว', SETTLED: 'เคลียร์ครบ (ปิดงาน)' };
    return (perms.invoice && nxt
      ? `<button class="btn btn-p btn-sm" data-act="settle" data-id="${r.id}" data-next="${nxt}">${lbl[nxt]}</button>`
      : '<span class="t-xs t-3">—</span>') +
      /* พิมพ์ใบรับชำระเงินล่วงหน้า — เอกสารเฉพาะของ ADVANCE (finance/advance-doc.js)
         อ่านอย่างเดียว: ไม่เปลี่ยนสถานะ ไม่ออกเลขเอกสารใหม่
         คิว advance_active บังคับ invoice_status='POSTED' อยู่แล้ว → invoice_id มีเสมอ
         แต่ยังเช็ค r.invoice_id กันไว้ ไม่ render ปุ่มที่กดแล้วไม่มีข้อมูล */
      /* ปุ่ม "ดู INVOICE" ถูกแทนด้วยคลิกแถว (ปลายทางเดิม #/invoice/:id)
         ปุ่มพิมพ์ใบรับชำระเงินล่วงหน้า = เอกสารคนละใบ Row Click แทนไม่ได้ -> คงไว้ */
      (r.invoice_id ? `<button class="btn btn-print btn-sm" data-act="apdoc" data-inv="${r.invoice_id}" data-adv="${esc(r.advance_status || 'PENDING')}" title="พิมพ์ใบรับชำระเงินล่วงหน้า">🖨 พิมพ์</button>` : '');
  }
  /* FINANCE > Close Job — งานที่จบครบวงจรแล้ว: ดูอย่างเดียว ไม่ใช่หน้าทำงาน */
  /* FINANCE > Close Job — เดิมมีแต่ปุ่มเปิดข้อมูล (ดู / ดู INVOICE)
     ถูกแทนด้วย "คลิกแถว" ทั้งหมด -> ไม่มี Action เหลือ -> ตัดคอลัมน์ "จัดการ" ไปด้วย
     (ปลายทางเดิมย้ายไปที่ openRow() ใน charge-page.js ใช้เงื่อนไข invoice_id ชุดเดิม) */
  if (mode === 'closed') return '';
  if (mode === 'accounting') {
    if (r.invoice_id)
      return `<button class="btn btn-o btn-sm" data-act="viewinv" data-id="${r.id}" data-inv="${r.invoice_id}">ดู INVOICE</button>`;
    if (perms.invoice && r.operational_status !== 'CANCELED')
      return `<button class="btn btn-p btn-sm" data-act="bill" data-id="${r.id}">ออกวางบิล</button>`;
    return '<span class="t-xs t-3">—</span>';
  }

  /* ── DOCUMENT: เหลือ 3 ปุ่ม  ดู | ปิดงาน | ลบ ──
     ดู      → หน้า Job Detail (ข้อมูลครบทุกช่อง) และมีปุ่ม "แก้ไข" อยู่ในหน้านั้น
               → แก้แล้วบันทึกกลับ Record เดิม ไม่สร้างงานใหม่
               (ไม่ทำปุ่ม "แก้ไข" แยกในตารางตามที่กำหนด)
     ปิดงาน  → DOCUMENT ทำงานเสร็จ ส่ง Job เดิมเข้า ACCOUNTING
               ใช้ njacc_set_job_status(id,'CLOSE') ของเดิม ไม่สร้างสถานะใหม่
     ลบ      → ตามสิทธิ์เดิม · ห้ามลบถ้ามี Invoice แล้ว
     ปุ่มที่เอาออก: แก้ · ยกเลิก · คืนงาน · ถอย · ดู INVOICE
     (Backend/RPC ของ action เหล่านั้นไม่ถูกลบ — Workflow อื่นยังใช้ได้) */
  /* ── ปุ่ม "ดู" ถูกลบออกจากคอลัมน์นี้ ──
     ถูกแทนด้วย "คลิกแถว = เปิดงาน" (charge-page.js) ซึ่งใช้เงื่อนไขเดิมทุกประการ:
       ยังไม่มี INVOICE -> เปิดฟอร์มงานที่แก้ไขได้ทันที (openNewJobModal)
       มี INVOICE แล้ว  -> หน้ารายละเอียดอ่านอย่างเดียว (#/job/:id)
     ข้อมูล invoice_id ย้ายไปอยู่ที่ <tr data-inv> แทน data-locked ของปุ่มเดิม
     คอลัมน์ "จัดการ" ของ DOCUMENT ยังอยู่ เพราะยังมี ปิดงาน / ลบ ที่คลิกแถวแทนไม่ได้ */
  const a = [];
  const st = r.operational_status;

  /* ปิดงานได้เฉพาะงานที่ยังทำเอกสารอยู่ และยังไม่ถูกส่งเข้า ACCOUNTING */
  if (perms.edit && (st === 'OPEN' || st === 'PROCESSING'))
    a.push(`<button class="btn btn-green btn-sm" data-act="close" data-id="${r.id}">✅ ปิดงาน</button>`);
  /* ไม่มีป้าย "ส่ง ACCOUNTING แล้ว" อีกแล้ว (025)
     งานที่ปิดแล้ว (CLOSE) ถูกกรองออกจากคิว document ที่ server → ไม่มีทางมาถึงบรรทัดนี้
     ปุ่มถูก "ไม่ render" ไม่ได้ซ่อนด้วย CSS · .ch-act เป็น flex+gap จึงไม่เหลือช่องว่าง */

  if (perms.delete && !r.invoice_id)
    a.push(`<button class="btn btn-danger-soft btn-sm" data-act="delete" data-id="${r.id}">🗑 ลบ</button>`);
  return a.length ? a.join('') : '<span class="t-xs t-3">—</span>';
}

export const paymentCell = (r) => r.invoice_id
  ? payBadge(r.payment_status) : '<span class="bdg bdg-due-ok">ยังไม่ออก INVOICE</span>';
