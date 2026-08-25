import { COMPANY_GROUPS, CHARGE_TYPES, groupLabel, chargeLabel } from './charge-groups.js';
import { can, isAdmin } from '../core/permissions.js';

/* Route ตาม FINAL LOCK — ไม่มี dashboard/audit ในเมนู
   'masters' คงไว้เป็นหน้าเสริมสำหรับ ADMIN (เข้าจากฟอร์มเปิดงาน) ไม่แสดงใน Sidebar */
export function buildRoutes() {
  const R = {};
  for (const c of CHARGE_TYPES) for (const g of COMPANY_GROUPS) {
    R[`charges/${c.key}/${g.key}`] = {
      title: chargeLabel(c.key) + ' — ' + groupLabel(g.key),
      module: '../charges/charge-page.js',
      args: { charge: c.key, group: g.key },
      perm: () => can('view', c.key, g.key),
    };
  }
  /* ── โครงเมนูใหม่: DOCUMENT (งานต้นทางทั้งหมด) / ACCOUNTING (คิวรอออก Invoice) ──
     ทั้งสองใช้ Job record เดียวกัน · ต่างกันที่เงื่อนไข query ที่ server (queue=pending_invoice)
     route เดิม charges/:charge/:group ยังคงอยู่ (ปุ่มย้อนกลับจากหน้า job/invoice ใช้อยู่) */
  for (const c of CHARGE_TYPES) {
    const key = c.key.toLowerCase();
    R[`document/${key}`] = {
      title: 'DOCUMENT — ' + c.key,
      module: '../charges/charge-page.js',
      args: { charge: c.key, group: 'NJ', mode: 'document' },
      perm: () => can('view', c.key, 'NJ'),
    };
    R[`accounting/${key}`] = {
      title: 'ACCOUNTING — ' + c.key,
      module: '../charges/charge-page.js',
      args: { charge: c.key, group: 'NJ', mode: 'accounting' },
      perm: () => can('invoice', c.key, 'NJ'),
    };
  }
  /* Credit Note: หน้าใช้งานจริงแล้ว (renderer + RPC ชุด njacc_*credit_note*)
     สิทธิ์ยังใช้ can('invoice') ตามเดิม — ไม่เพิ่มคอลัมน์สิทธิ์ใหม่ใน njacc_user_access
     Backend อยู่ที่ sql/dev/RUN_3_CREDIT_NOTE.sql */
  R['finance/credit-note'] = { title: 'FINANCE — CREDIT NOTE', module: '../finance/credit-note.js',
    perm: () => can('invoice') };
  /* ── ปลายทางของ Flow (Backend: migration 019 + 020) ──
     งานเดียวกัน (1 JOB = 1 RECORD) เปลี่ยนมุมมองตามสถานะจริงที่ server
     SERVICE POSTED → receipt · ADVANCE POSTED → advance · จบครบวงจร → close-job */
  R['finance/advance'] = { title: 'FINANCE — ADVANCE', module: '../charges/charge-page.js',
    args: { charge: 'ADVANCE', group: 'NJ', mode: 'advance' }, perm: () => can('view') };
  /* JOB CONTROL > CLOSE JOB — *** Route เดิม finance/close-job ไม่เปลี่ยน ***
   (เมนู Sidebar อยู่ใต้หมวด JOB CONTROL อยู่แล้ว · เปลี่ยนเฉพาะ Label บนหัวหน้า)
   ── V.190 ── ถอด scope:'all' ออก แล้วแยกเป็น Tab [SERVICE] [ADVANCE] แทน
   scope='all' ทำให้ 2 ประเภทปนกันใน Queue เดียว ซึ่งขัดกับข้อกำหนดข้อ 22
   charge ที่ส่งมาคือ Tab เริ่มต้น — หน้าเปลี่ยน Tab เองโดยไม่แตะ Route/hash */
  R['finance/close-job'] = { title: 'JOB CONTROL — CLOSE JOB', module: '../charges/charge-page.js',
    args: { charge: 'SERVICE', group: 'NJ', mode: 'closed' }, perm: () => can('view') };
  R['finance/receipt'] = { title: 'FINANCE — RECEIPT', module: '../receipts/receipt-page.js',
    perm: () => can('view') };
  R['report/withholding'] = { title: 'REPORT — ใบหัก ณ ที่จ่าย', module: '../withholding/withholding-page.js' };

  /* DOCUMENT > Job Form — แบบฟอร์มงาน A4 สำหรับพิมพ์ (renderer ใหม่ ไม่แตะของเดิม)
     job-form      = เลือกงานก่อน (ค้นหาจาก RPC เดิม njacc_charge_page_bundle)
     job-form/:id  = เปิดฟอร์มของงานนั้นตรง ๆ
     สิทธิ์: can('view') เท่ากับหน้ารายการ DOCUMENT — ไม่เพิ่มสิทธิ์ใหม่ */
  R['job-form'] = { title: 'DOCUMENT — Job Form', module: '../jobs/job-form-doc.js',
    perm: () => can('view') };
  R['job-form/:id'] = { title: 'DOCUMENT — Job Form', module: '../jobs/job-form-doc.js',
    perm: () => can('view') };

  R['job/new'] = { title: 'เปิดงานใหม่', module: '../jobs/job-form.js' };
  R['job/:id'] = { title: 'รายละเอียดงาน', module: '../jobs/job-detail.js' };
  R['job/:id/edit'] = { title: 'แก้ไขงาน', module: '../jobs/job-form.js' };
  /* Legacy route — คงไว้เพื่อ Bookmark/URL เก่าเท่านั้น
     ออก Invoice ที่นี่ไม่ได้แล้ว · หน้าจะพาไป ACCOUNTING > ออกวางบิล */
  R['invoice/issue/:jobId'] = { title: 'ออก Invoice ผ่าน ACCOUNTING', module: '../invoices/invoice-form.js',
    perm: () => can('invoice') };
  R['invoice/:id'] = { title: 'INVOICE', module: '../invoices/invoice-view.js' };
  R['receipts'] = { title: 'Receipt', module: '../receipts/receipt-page.js', perm: () => can('view') };
  R['receipts/new'] = { title: 'รับชำระเงิน', module: '../payments/payment-form.js',
    perm: () => can('receive_payment') };
  /* REPORT — Landing เลือกประเภทรายงาน (ไม่ยิง Query ใด ๆ) */
  R['report'] = { title: 'Report', module: '../reports/report-home.js' };
  /* รายงานย่อย — *** URL เดิมทั้ง 8 ตัวยังอยู่ครบ ไม่ลบ ไม่เปลี่ยนชื่อ ***
     REPORT รวมเป็นหน้าเดียว (Accordion + ตัวกรอง + Export) แล้ว
     -> ชี้มาที่ report-home.js ตัวเดียวกัน พร้อม args.key เพื่อกางหมวด
        และเลือกรายงานนั้นให้อัตโนมัติ Bookmark เดิมจึงไม่ 404 และได้รายงานเดิม */
  ['open-jobs', 'no-invoice', 'invoice-all', 'billing-total',
   'paid', 'outstanding', 'overdue', 'paid-status'].forEach((k) => {
    R['report/' + k] = { title: 'Report', module: '../reports/report-home.js', args: { key: k } };
  });
  R['withholding'] = { title: 'ใบหัก ณ ที่จ่าย', module: '../withholding/withholding-page.js' };
  R['masters'] = { title: 'ข้อมูลหลัก', module: '../master/master-admin.js', perm: isAdmin };
  /* SYSTEM: 2 หน้าแยกกันจริง — คนละ route คนละหน้า (ไม่ใช่แท็บในหน้าเดียว)
     ใช้ renderer เดิม master-admin.js โดยล็อกไว้ทีละ master (args.only) → ไม่สร้างหน้าซ้ำ
     route 'masters' เดิมยังอยู่ครบ (ใช้กับ บริษัท Invoice และปุ่มเดิมที่ลิงก์มา) */
  /* SYSTEM > ตั้งค่า — หน้าเดียว 2 แท็บ (ตั้งค่าลูกค้า | ตั้งค่ารายการบริการ)
     แยกเป็น sub-route เพื่อให้ Refresh/Bookmark เปิดแท็บเดิมได้ และ Sidebar ยัง Active ที่ "ตั้งค่า"
     ใช้ renderer เดิม master-admin.js · ข้อมูล/Save/Validation ของแต่ละ Master แยกกันเหมือนเดิม */
  R['settings/customers'] = { title: 'ตั้งค่า', module: '../master/master-admin.js',
    args: { only: 'customers', tabs: 'settings' }, perm: isAdmin };
  R['settings/services'] = { title: 'ตั้งค่า', module: '../master/master-admin.js',
    args: { only: 'service_codes', tabs: 'settings' }, perm: isAdmin };
  /* Route เดิม — คงไว้ไม่ให้ Bookmark เก่ากลายเป็น 404 · redirect ไปแท็บที่ถูกต้อง */
  R['system/customers'] = { title: 'ตั้งค่า', module: '../master/master-admin.js',
    args: { redirectTo: 'settings/customers' }, perm: isAdmin };
  R['system/service-codes'] = { title: 'ตั้งค่า', module: '../master/master-admin.js',
    args: { redirectTo: 'settings/services' }, perm: isAdmin };
  R['users'] = { title: 'ผู้ใช้งาน', module: '../system/users.js',
    perm: () => isAdmin() || can('manage_users') };
  R['audit'] = { title: 'ประวัติการทำงาน', module: '../system/audit.js', perm: isAdmin };
  R['backup'] = { title: 'Backup', module: '../system/backup.js' };
  return R;
}
