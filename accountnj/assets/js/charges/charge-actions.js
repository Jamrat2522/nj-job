/* Row actions — Operational Status เท่านั้น (ไม่แตะสถานะ Invoice/Payment/Receipt) */
import { setJobStatus, updateNote, deleteJob, documentCloseJob } from './charge-api.js';
import { confirmModal, reasonModal, openModal, closeModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { once } from '../core/request-manager.js';

export async function handleAction(act, id, refresh) {
  try {
    if (act === 'close') {
      /* ปิดงาน = ปิดงาน + ส่งเข้า ACCOUNTING ใน Action เดียว (ไม่มีปุ่ม "ส่ง ACCOUNTING" แยก)
         njacc_document_close_job() ทำใน Transaction เดียว:
           1) njacc_set_job_status(id,'CLOSE') ตัวเดิม (สิทธิ์ 'edit' + Audit เดิมครบ)
           2) ตรวจซ้ำว่างานเข้าคิว pending_invoice ของ ACCOUNTING แล้วจริง
           3) ตรวจไม่ผ่าน → rollback ทั้งชุด งานยังอยู่ใน DOCUMENT
         Job เดิม ID เดิม เลขงานเดิม — ไม่สร้าง/ไม่ copy/ไม่ลบ Record
         SERVICE → ACCOUNTING > Service · ADVANCE → ACCOUNTING > Advance
           (charge_type ไม่ถูกแตะ · หน้าปลายทางกรองด้วย charge_type ที่ server) */
      if (!(await confirmModal('ปิดงาน (ส่งเข้า ACCOUNTING)',
        'ยืนยันว่าเอกสารของงานนี้ทำเสร็จแล้ว<br><br>' +
        'งานจะถูกส่งเข้า <b>ACCOUNTING</b> เพื่อรอออก Invoice ทันที<br>' +
        'เป็นงานใบเดิม เลขงานเดิม ไม่มีการสร้างงานใหม่', 'ปิดงาน'))) return;
      /* รอผลจาก Backend ให้เสร็จก่อนเสมอ — ถ้า throw จะตกไป catch แจ้ง Error
         และ "ไม่" เรียก refresh() ที่บรรทัดนี้ → แถวยังอยู่ใน DOCUMENT ให้กดซ้ำได้ */
      const res = await once('close-' + id, () => documentCloseJob(id));
      const jobNo = (res && res.job_no) ? ' ' + res.job_no : '';
      toast('ปิดงาน' + jobNo + ' แล้ว — เข้า ACCOUNTING เรียบร้อย', 'ok'); refresh();

    } else if (act === 'reopen') {
      if (!(await confirmModal('คืนงาน', 'ยืนยันคืนงานกลับเป็น OPEN?'))) return;
      await once('reopen-' + id, () => setJobStatus(id, 'OPEN'));
      toast('คืนงานแล้ว', 'ok'); refresh();

    } else if (act === 'undo') {          /* ถอย: CANCELED → OPEN */
      if (!(await confirmModal('ถอยรายการที่ยกเลิก',
        'ยืนยันถอยงานที่ถูกยกเลิก กลับมาเป็นสถานะ OPEN?'))) return;
      await once('undo-' + id, () => setJobStatus(id, 'OPEN'));
      toast('ถอยรายการกลับเป็น OPEN แล้ว', 'ok'); refresh();

    } else if (act === 'cancel') {
      const reason = await reasonModal('ยกเลิกงาน (ต้องระบุเหตุผล)');
      if (!reason) return;
      await once('cancel-' + id, () => setJobStatus(id, 'CANCELED', reason));
      toast('ยกเลิกงานแล้ว', 'ok'); refresh();

    } else if (act === 'delete') {
      const reason = await reasonModal('ลบงานถาวร (ต้องระบุเหตุผล — ตรวจสิทธิ์ที่ฐานข้อมูล)');
      if (!reason) return;
      if (!(await confirmModal('ยืนยันลบถาวร',
        'ลบแล้วกู้คืนไม่ได้ (ระบบเก็บ snapshot ไว้ใน Audit Log) — ยืนยัน?', 'ลบถาวร'))) return;
      await once('delete-' + id, () => deleteJob(id, reason));
      toast('ลบงานแล้ว', 'ok'); refresh();
    }
  } catch (e) { handleErr(e); }
}

export function editNote(id, current, refresh) {
  const b = document.createElement('div');
  b.innerHTML = `<div class="fld"><label>NOTE</label>
    <textarea class="inp w100" id="nj-note">${(current || '').replace(/</g, '&lt;')}</textarea></div>`;
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
    <button class="btn btn-p" id="nj-note-ok">บันทึก</button>`;
  openModal({ title: 'แก้ไข NOTE', body: b, footer: f });
  f.querySelector('#nj-note-ok').onclick = async () => {
    try {
      await once('note-' + id, () => updateNote(id, b.querySelector('#nj-note').value.trim()));
      closeModal(); toast('บันทึก NOTE แล้ว', 'ok'); refresh();
    } catch (e) { handleErr(e); }
  };
}
