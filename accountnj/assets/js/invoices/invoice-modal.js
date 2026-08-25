/* ดู INVOICE แบบ Modal — ใช้กับ ACCOUNTING > SERVICE / ADVANCE
   ─────────────────────────────────────────────────────────────────────
   *** ไม่สร้าง Logic ใหม่ ไม่ duplicate ***
   ใช้ตัวสร้างเดียวกับหน้าเต็ม: invoice-view.js -> renderInvoice(cnt, {view:'modal'})
   จึงได้ครบเหมือนกันทุกอย่าง:
     · ข้อมูลงาน/ใบแจ้งหนี้ (การ์ด .iv-info)
     · หัวข้อ INVOICE PREVIEW + เอกสารจาก Renderer กลาง invoiceDocHTML()
     · ปุ่ม POST / UNPOST / Void / Print  (RPC เดิมทั้งหมด)
   RPC ที่ใช้จริง (ผ่าน invoice-api.js เดิม ไม่แตะ):
     njacc_invoice_view · njacc_post_invoice · njacc_unpost_invoice · njacc_void_invoice

   *** ห้ามใช้ billing-modal.js ***
   billing-modal.js เป็น Modal "ออกวางบิล" ซึ่งมี guard
       if (j.invoice_id) { toast('งานนี้ออก INVOICE แล้ว','err'); return; }
   งานที่กด "ดู INVOICE" มี invoice_id เสมอ -> ถ้าใช้ตัวนั้นจะเด้ง error ทันที

   Modal shell ใช้ components/modal.js (fullscreen + wide) ตัวเดียวกับ
   ออกวางบิล / เปิดงานใหม่ / เอกสารอื่น ๆ — ไม่สร้าง shell ใหม่ */
import { openModal, closeModal } from '../components/modal.js';
import { renderInvoice } from './invoice-view.js';
import { handleErr } from '../core/error-handler.js';

/* openInvoiceModal({ id, onChanged })
     id        = njacc_invoices.id ของงานนั้น (มาจาก data-inv ของปุ่ม)
     onChanged = เรียกเมื่อสถานะเปลี่ยนจริง (POST / UNPOST / Void)
                 -> ให้หน้ารายการเบื้องหลัง load() ใหม่จาก server
                    ไม่แก้แถวใน DOM เอง ไม่เดาสถานะฝั่ง browser */
export async function openInvoiceModal({ id, onChanged }) {
  const body = document.createElement('div');
  const footer = document.createElement('div');
  footer.innerHTML = `<div class="mf-left"></div>
    <div class="mf-right"><button class="btn btn-o" data-close>✕ ปิด</button></div>`;

  /* เปิด Modal ก่อนแล้วค่อยโหลด — ผู้ใช้เห็นการตอบสนองทันที ไม่ค้างหน้าเดิม */
  openModal({ title: 'ดู INVOICE', body, footer, fullscreen: true, wide: true });
  body.innerHTML = '<div class="load-row"><div class="spin"></div></div>';

  try {
    /* Logic เดียวกับหน้าเต็มทุกประการ ต่างแค่ไม่มีปุ่ม "← กลับ" */
    await renderInvoice(body, { id, view: 'modal', onChanged });
  } catch (e) {
    closeModal();
    handleErr(e);
  }
}
