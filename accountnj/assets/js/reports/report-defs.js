/* ══ REPORT — นิยามรายงานทั้ง 8 (แหล่งความจริงเดียว) ═══════════════════════
   ใช้ร่วมกันระหว่าง report-home.js (UI) และ report-export.js (ดึงข้อมูล+Excel)

   *** ไม่มี Business Logic ใหม่ในไฟล์นี้ *** เป็นเพียง mapping ว่า
   รายงานแต่ละตัวใช้ "แหล่งข้อมูลเดิม" ตัวไหน และใช้เงื่อนไขเดิมข้อไหน

   ── แหล่งข้อมูล (มีอยู่แล้วใน Production ทั้งคู่ ไม่ได้สร้าง RPC ใหม่) ──
   src:'job'  -> njacc_export_charges(p)  ภายในเรียก njacc_build_charge_set(p)
                 queue = คิวเดิมของระบบ:
                   'document'        = operational_status <> 'CLOSE'      (ยังไม่ปิดงาน)
                   'pending_invoice' = operational_status  = 'CLOSE'
                                       AND NOT njacc_inv_is_final(invoice_status)
                 *** ยกเงื่อนไขมาจาก RUN-NOW/07 ตรง ๆ ไม่ได้ตีความใหม่ ***
   src:'inv'  -> njacc_report(p) (invoice-based) พร้อมคอลัมน์ที่ server คำนวณให้แล้ว:
                   received · outstanding · overdue
                 และ KPI ที่กรองด้วย njacc_inv_is_final (ISSUED+POSTED) ตาม RUN-13

   ── ความหมายของ key ในนิยาม ──
   lock  : ค่าตัวกรองที่รายงานนั้นบังคับไว้ (ช่องยังแสดงครบ 8 แต่แก้ไม่ได้)
   post  : ชื่อ post-filter ที่ทำฝั่ง Frontend *** โดยใช้คอลัมน์ที่ server คำนวณมาแล้วเท่านั้น ***
           ไม่มีการคำนวณยอด/เงื่อนไขใหม่ที่ Frontend
   note  : ข้อความอธิบายใต้ตัวกรอง (ผู้ใช้เห็น) */

export const REPORT_DEFS = [
  { group: 'DOCUMENT', no: '1.1', key: 'open-jobs',
    title: 'รายการยังไม่ปิดงาน',
    src: 'job', queue: 'document',
    note: 'เงื่อนไขเดิมของระบบ: งานที่ยังไม่ถูกกด “ปิดงาน” (operational_status ≠ CLOSE)' },

  { group: 'ACCOUNTING', no: '2.1', key: 'no-invoice',
    title: 'รายการยังไม่ออกใบแจ้งหนี้',
    src: 'job', queue: 'pending_invoice',
    note: 'เงื่อนไขเดียวกับคิว ACCOUNTING: ปิดงานจาก DOCUMENT แล้ว และ INVOICE ยังไม่ถูก POST' },

  { group: 'ACCOUNTING', no: '2.2', key: 'invoice-all',
    title: 'รายงาน Invoice ทั้งหมด',
    src: 'inv',
    note: 'INVOICE ทั้งหมดตามตัวกรองที่เลือก' },

  { group: 'ACCOUNTING', no: '2.3', key: 'billing-total',
    title: 'รายงานยอดออกบิลรวม',
    src: 'inv', post: 'billed', summary: true,
    note: 'นับเฉพาะ INVOICE ที่มีผลทางบัญชี (ISSUED + POSTED) ตาม njacc_inv_is_final ของระบบ' },

  { group: 'FINANCE', no: '3.1', key: 'paid',
    title: 'รายงานรับชำระแล้ว',
    src: 'inv', lock: { payment_status: 'PAID' },
    note: 'ล็อกสถานะชำระ = ครบ (PAID) ตามความหมายของรายงาน' },

  { group: 'FINANCE', no: '3.2', key: 'outstanding',
    title: 'รายงานคงค้าง',
    src: 'inv', post: 'outstanding',
    note: 'ใช้คอลัมน์ outstanding ที่ njacc_report คำนวณให้ (ยอดรวม − ยอดตัดชำระที่ POSTED) '
        + 'ยังไม่รวมผลของ Credit Note' },

  { group: 'FINANCE', no: '3.3', key: 'overdue',
    title: 'รายงานเกินกำหนด',
    src: 'inv', post: 'overdue',
    note: 'ใช้คอลัมน์ overdue ที่ njacc_report คำนวณให้ (มีผลทางบัญชี · ยังไม่ชำระครบ · เลย Due Date)' },

  { group: 'FINANCE', no: '3.4', key: 'paid-status',
    title: 'รายงานชำระครบ / บางส่วน',
    src: 'inv', post: 'paid-partial',
    note: 'เลือก “ครบ” หรือ “บางส่วน” ได้ที่ช่องสถานะชำระ — ถ้าไม่เลือกจะได้ทั้งสองสถานะ' },
];

/* ลำดับหมวดบนหน้าจอ (ข้อกำหนดข้อ 1 · ห้ามเติมคำว่า REPORT ซ้ำ — ข้อ 10) */
export const REPORT_GROUPS = ['DOCUMENT', 'ACCOUNTING', 'FINANCE'];

export const defByKey = (k) => REPORT_DEFS.find(d => d.key === k) || null;
export const defsOfGroup = (g) => REPORT_DEFS.filter(d => d.group === g);
