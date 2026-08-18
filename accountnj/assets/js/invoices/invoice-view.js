/* ดู INVOICE + พิมพ์ + Void */
import { invoiceView, voidInvoice, postInvoice, unpostInvoice } from './invoice-api.js';
import { esc, money, payBadge, dmy as dmyLocal } from '../core/formatter.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';
/* ใช้ Renderer เอกสารกลางตัวเดียวกับ Preview / Print Draft (invoice-doc.js)
   เดิมหน้านี้มี template ของตัวเองอีกชุด -> Preview กับใบจริงหน้าตาไม่ตรงกัน
   ตอนนี้เหลือ template เดียวทั้งระบบ */
import { invoiceDocHTML } from './invoice-doc.js';
import { can } from '../core/permissions.js';
import { reasonModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once } from '../core/request-manager.js';
/* groupLabel/chargeLabel ไม่ใช้แล้วหลังย้ายไป renderer กลาง (เอกสารไม่แสดงป้ายกลุ่ม) */

/* ── ตัวสร้างหน้า INVOICE ชุดเดียว ใช้ร่วมกันทั้ง 2 โหมด ──
     view:'page'  = หน้าเต็มผ่าน route #/invoice/:id  -> มีปุ่ม "← กลับ"
     view:'modal' = เปิดเป็น Modal บนหน้าเดิม         -> ไม่มีปุ่มกลับ (ปิดที่ Modal shell)
   *** Logic เดียวกันทั้งหมด ไม่ duplicate ***
   ใช้ RPC เดิม njacc_invoice_view / njacc_post_invoice / njacc_unpost_invoice /
   njacc_void_invoice และ Renderer เอกสารกลาง invoiceDocHTML()
   onChanged = callback ให้รายการเบื้องหลังรีเฟรชเมื่อสถานะเปลี่ยน (POST/UNPOST/VOID) */
export async function renderInvoice(cnt, { id, view = 'page', onChanged } = {}) {
  const isModal = view === 'modal';
  const inv = await invoiceView(id);
  const isVoid = inv.status === 'VOID';
  /* ── สถานะจริงจาก Backend (migration 019) — ไม่มีการเดาสถานะฝั่ง browser ──
     ISSUED = ออกใบแล้ว ยังไม่ POST · POSTED = POST เข้าบัญชีแล้ว
     POST และ UNPOST ห้าม active พร้อมกัน → ดูจาก inv.status ตัวเดียว */
  const isPosted = inv.status === 'POSTED';
  const canPost = can('invoice', inv.charge_type, inv.company_group);
  /* ── ข้อมูลงาน / ใบแจ้งหนี้ ──
     ใช้ Pattern เดียวกับหน้า "ดูงาน" (jobs/job-detail.js):
       page-head + card card-pad + fgrid + .fld  (ยืมเฉพาะ UI/Layout/Navigation)
     *** ไม่ copy Business Logic ของ Job Detail ***
     ข้อมูลทุกช่องมาจาก njacc_invoice_view เดิม (job / customer / company_invoice /
     created_by_name) -> ไม่เรียก RPC เพิ่ม ไม่แตะ SQL ไม่สร้าง Field ปลอม
     ช่องที่ RPC ไม่ส่งมา (Booking No. / Vessel / Reference) จึงไม่แสดง */
  const j = inv.job || {};
  const c = inv.customer || {};
  const f = (lb, v) => `<div class="fld"><label>${lb}</label><div>${v || '-'}</div></div>`;

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE ${esc(inv.invoice_no)}</h2>
      ${isVoid ? '<span class="bdg bdg-void">VOID</span>' : payBadge(inv.payment_status)}
      ${isVoid ? '' : `<span class="bdg ${isPosted ? 'bdg-paid' : 'bdg-due-ok'}">${isPosted ? 'POSTED' : 'ยังไม่ POST'}</span>`}</div>
      <div class="row">
        ${!isVoid && canPost && !isPosted
          ? '<button class="btn btn-p" id="ivv-post">⇧ POST</button>' : ''}
        ${!isVoid && canPost && isPosted
          ? '<button class="btn btn-o" id="ivv-unpost">⇩ UNPOST</button>' : ''}
        <button class="btn btn-print" id="ivv-print">🖨 ${isPosted ? 'Print Invoice' : 'Print Draft'}</button>
        ${!isVoid && can('void', inv.charge_type, inv.company_group) && Number(inv.paid) === 0
          ? '<button class="btn btn-danger-soft" id="ivv-void">🗑 Void</button>' : ''}
        ${isModal ? '' : '<button class="btn btn-o" id="ivv-back">← กลับ</button>'}</div></div>

    <div class="card card-pad iv-info">
      <div class="fgrid">
        ${f('เลขที่งาน', esc(j.job_no))}
        ${f('Invoice No.', esc(inv.invoice_no))}
        ${f('ประเภท', chargeLabel(inv.charge_type) + ' · ' + groupLabel(inv.company_group))}
        ${f('สถานะ', isVoid ? 'VOID' : (isPosted ? 'POSTED' : 'ISSUED — ยังไม่ POST'))}
        ${f('ลูกค้า', esc(c.name))}
        ${f('บริษัท Invoice', esc(inv.company_invoice))}
        ${f('Customer Job No.', esc(j.customer_job_no))}
        ${f('เลขใบขนสินค้า', esc(j.customs_declaration_no))}
        ${f('Invoice ต้นทาง', esc(j.source_invoice_no))}
        ${f('House B/L', esc(j.house_bl_no))}
        ${f('Master B/L', esc(j.master_bl_no))}
        ${f('Invoice Date', dmyLocal(inv.invoice_date))}
        ${f('Due Date', dmyLocal(inv.due_date))}
        ${f('ผู้ออกใบ', esc(inv.created_by_name))}
      </div>
      ${j.note ? `<div class="fld mt-2"><label>NOTE</label><div>${esc(j.note)}</div></div>` : ''}
    </div>

    <div class="page-head iv-pv-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE PREVIEW</h2>
      <span class="t-xs t-3">ตรวจเอกสารก่อน แล้วจึงกดปุ่ม
        ${isPosted ? 'Print Invoice' : 'Print Draft'} เพื่อสั่งพิมพ์</span></div>
      <div class="row">
        <button class="btn btn-print" id="ivv-print2">🖨 ${isPosted ? 'Print Invoice' : 'Print Draft'}</button>
      </div></div>

    ${invoiceDocHTML(inv, { draft: false })}
    ${isVoid ? `<div class="card card-pad mt-2 t-sm" style="color:var(--red-600)">VOID เมื่อ: ${dmyLocal(inv.voided_at)} · เหตุผล: ${esc(inv.void_reason || '-')}</div>` : ''}
    ${Number(inv.paid) > 0 ? `<div class="card card-pad mt-2 iv-paid-note"><div class="r-line"><span>รับชำระแล้ว</span><span class="money-pos">${money(inv.paid)}</span></div><div class="r-line"><span>คงค้าง</span><span class="money-neg">${money(inv.total_amount - inv.paid)}</span></div></div>` : ''}`;
  /* ── ปุ่มกลับ — กลับหน้าที่กดเข้ามาจริง ──
     ACCOUNTING > SERVICE -> #/accounting/service
     ACCOUNTING > ADVANCE -> #/accounting/advance
     DOCUMENT / FINANCE / ดูงาน -> route ของหน้านั้น ๆ
     origin บันทึกตอนกด "ดู INVOICE" (charge-page / job-detail / receipt-page)
     ไม่มี origin (เปิด URL ตรง / รีเฟรช) -> ถอยไปใช้ route เดิมของระบบ */
  const bb = cnt.querySelector('#ivv-back');
  if (bb) {
    let backTo = '';
    try { backTo = sessionStorage.getItem('nj-inv-from') || ''; } catch (_) { backTo = ''; }
    if (!backTo.startsWith('#/') || backTo.startsWith('#/invoice/')) {
      backTo = '#/charges/' + inv.charge_type + '/' + inv.company_group;
    }
    bb.onclick = () => { location.hash = backTo; };
  }
  /* Print เกิดจากการกดปุ่มเท่านั้น — หน้านี้ไม่เคยเรียก window.print() อัตโนมัติ
     มี 2 ปุ่ม (บนสุด และเหนือ Preview) ทำงานเหมือนกัน */
  const doPrint = () => window.print();
  cnt.querySelector('#ivv-print').onclick = doPrint;
  const p2 = cnt.querySelector('#ivv-print2'); if (p2) p2.onclick = doPrint;
  /* POST → SERVICE เข้าคิว RECEIPT · ADVANCE เข้าคิว ADVANCE (server เป็นคนตัดสิน) */
  const pb = cnt.querySelector('#ivv-post');
  if (pb) pb.onclick = async () => {
    const ok = await confirmModal('POST INVOICE ' + inv.invoice_no,
      'เมื่อ POST แล้วงานจะเข้าคิว <b>' +
      (inv.charge_type === 'ADVANCE' ? 'FINANCE &gt; Advance (รอจ่าย/เคลียร์)' : 'FINANCE &gt; Receipt (รอรับชำระ)') +
      '</b><br>และหลุดจากคิวรอออก Invoice', 'POST');
    if (!ok) return;
    try {
      const res = await once('post-inv-' + id, () => postInvoice(id, newRequestId()));
      toast('POST แล้ว — งานเข้าคิว ' + (res && res.queue === 'advance_active' ? 'Advance' : 'Receipt'), 'ok');
      if (onChanged) onChanged();          /* ให้รายการเบื้องหลังรีเฟรชสถานะจริงจาก server */
      renderInvoice(cnt, { id, view, onChanged });
    } catch (e) { handleErr(e); }
  };
  const ub = cnt.querySelector('#ivv-unpost');
  if (ub) ub.onclick = async () => {
    const reason = await reasonModal('UNPOST INVOICE ' + inv.invoice_no + ' (ต้องระบุเหตุผล)');
    if (!reason) return;
    try {
      await once('unpost-inv-' + id, () => unpostInvoice(id, reason, newRequestId()));
      toast('UNPOST แล้ว — กลับไปสถานะ ISSUED', 'ok');
      if (onChanged) onChanged();
      renderInvoice(cnt, { id, view, onChanged });
    } catch (e) { handleErr(e); }
  };
  const vb = cnt.querySelector('#ivv-void');
  if (vb) vb.onclick = async () => {
    const reason = await reasonModal('Void INVOICE ' + inv.invoice_no + ' (ต้องระบุเหตุผล)');
    if (!reason) return;
    try {
      await once('void-inv-' + id, () => voidInvoice(id, reason, newRequestId()));
      toast('Void INVOICE แล้ว — งานกลับไปสถานะยังไม่ออก INVOICE', 'ok');
      if (onChanged) onChanged();
      renderInvoice(cnt, { id, view, onChanged });
    } catch (e) { handleErr(e); }
  };
}

/* Route #/invoice/:id — หน้าเต็มตามเดิม (พฤติกรรมไม่เปลี่ยน) */
export async function render(cnt, { id }) {
  return renderInvoice(cnt, { id, view: 'page' });
}
