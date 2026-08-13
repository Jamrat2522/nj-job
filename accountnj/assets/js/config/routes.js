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
  R['job/new'] = { title: 'เปิดงานใหม่', module: '../jobs/job-form.js' };
  R['job/:id'] = { title: 'รายละเอียดงาน', module: '../jobs/job-detail.js' };
  R['job/:id/edit'] = { title: 'แก้ไขงาน', module: '../jobs/job-form.js' };
  R['invoice/issue/:jobId'] = { title: 'ออก INVOICE', module: '../invoices/invoice-form.js',
    perm: () => can('invoice') };
  R['invoice/:id'] = { title: 'INVOICE', module: '../invoices/invoice-view.js' };
  R['receipts'] = { title: 'Receipt', module: '../receipts/receipt-page.js', perm: () => can('view') };
  R['receipts/new'] = { title: 'รับชำระเงิน', module: '../payments/payment-form.js',
    perm: () => can('receive_payment') };
  R['report'] = { title: 'Report', module: '../reports/report-page.js' };
  R['withholding'] = { title: 'ใบหัก ณ ที่จ่าย', module: '../withholding/withholding-page.js' };
  R['masters'] = { title: 'ข้อมูลหลัก', module: '../master/master-admin.js', perm: isAdmin };
  R['users'] = { title: 'ผู้ใช้งาน', module: '../system/users.js',
    perm: () => isAdmin() || can('manage_users') };
  R['audit'] = { title: 'ประวัติการทำงาน', module: '../system/audit.js', perm: isAdmin };
  R['backup'] = { title: 'Backup', module: '../system/backup.js' };
  return R;
}
