import { jobDetail } from './job-api.js';
import { esc, dmy, statusBadge } from '../core/formatter.js';
import { can } from '../core/permissions.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';

export async function render(cnt, { id, from }) {
  const j = await jobDetail(id);
  const f = (lb, v) => `<div class="fld"><label>${lb}</label><div>${v || '-'}</div></div>`;
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>งาน ${esc(j.job_no)}</h2>${statusBadge(j.operational_status)}</div>
      <div class="row">
        ${can('edit', j.charge_type, j.company_group) && !j.invoice_id && j.operational_status !== 'CANCELED'
          ? `<button class="btn btn-o" id="jd-edit">✏ แก้ไข</button>` : ''}
        ${can('invoice', j.charge_type, j.company_group) && !j.invoice_id && j.operational_status !== 'CANCELED'
          ? `<span class="t-xs t-3">ออก Invoice ได้ที่ ACCOUNTING &gt; ปุ่ม “ออกวางบิล”</span>` : ''}
        ${j.invoice_id ? `<button class="btn btn-o" id="jd-viewinv">ดู INVOICE</button>` : ''}
        <button class="btn btn-o" id="jd-back">← กลับ</button></div></div>
    <div class="card card-pad">
      <div class="fgrid">
        ${f('ประเภท', chargeLabel(j.charge_type) + ' · ' + groupLabel(j.company_group))}
        ${f('ประเภทข้อมูล', esc(j.data_type))}
        ${f('วันที่อ้างอิง', dmy(j.reference_date))}
        ${f('เลขอ้างอิง', esc(j.reference_no))}
        ${f('ลูกค้า', esc(j.customer_name))}
        ${f('Customer Job No', esc(j.customer_job_no))}
        ${f('บริษัท Invoice', esc(j.company_invoice))}
        ${f('เลขใบขน', esc(j.customs_declaration_no))}
        ${f('Invoice ต้นทาง', esc(j.source_invoice_no))}
        ${f('House B/L', esc(j.house_bl_no))}
        ${f('Master B/L', esc(j.master_bl_no))}
        ${f('Booking No', esc(j.booking_no))}
        ${f('Vessel', esc(j.vessel_name))}
        ${f('จำนวนตู้', j.qty_container)}
        ${f('ETD', dmy(j.etd))}
        ${f('ETA', dmy(j.eta))}
        ${f('วันส่งมอบ', dmy(j.delivery_date))}
        ${f('Case', esc(j.case_no))}
        ${f('Contact', esc(j.contact))}
        ${f('CS', esc(j.cs_name))}
        ${f('I BILLING APL', esc(j.i_billing_apl))}
        ${f('Credit Term', j.credit_term_days != null ? j.credit_term_days + ' วัน' : '-')}
        ${f('Due Date', dmy(j.due_date))}
        ${f('สถานะเอกสารบัญชี', j.invoice_id ? 'ออก INVOICE แล้ว' : 'ยังไม่ออก INVOICE')}
      </div>
      <div class="fsec"><div class="fsec-t">ตู้คอนเทนเนอร์</div>
        ${(j.containers || []).length
          ? (j.containers).map(c => `<span class="bdg bdg-due-ok" style="margin:2px">${esc(c.container_no)}${c.container_type ? ' · ' + esc(c.container_type) : ''}</span>`).join(' ')
          : '<span class="t-3">ไม่มีข้อมูลตู้</span>'}</div>
      <div class="fsec"><div class="fsec-t">หมายเหตุ</div><div>${esc(j.note) || '-'}</div></div>
    </div>`;
  /* กลับหน้าที่มาจริง (DOCUMENT/ACCOUNTING) — ไม่มี context ค่อยใช้ route เดิม */
  const src = ['document', 'accounting'].includes(from) ? from : null;
  const backHash = src
    ? '#/' + src + '/' + String(j.charge_type).toLowerCase()
    : '#/charges/' + j.charge_type + '/' + j.company_group;
  cnt.querySelector('#jd-back').onclick = () => location.hash = backHash;
  /* เข้าโหมดแก้ไขจากหน้าดู — พา context ไปด้วยเพื่อให้บันทึก/ยกเลิกกลับถูกหน้า
     ใช้ Job ID เดิม → บันทึกทับ Record เดิม ไม่สร้างงานใหม่ */
  const e1 = cnt.querySelector('#jd-edit');
  if (e1) e1.onclick = () => location.hash = '#/job/' + id + '/edit' + (src ? '?mode=' + src : '');
  const e3 = cnt.querySelector('#jd-viewinv');
  if (e3) e3.onclick = () => {
    /* จำหน้าที่กดมา (ดูงาน) เพื่อให้ปุ่มกลับในหน้า INVOICE กลับมาที่นี่ */
    try { sessionStorage.setItem('nj-inv-from', location.hash); } catch (_) {}
    location.hash = '#/invoice/' + j.invoice_id;
  };
}
