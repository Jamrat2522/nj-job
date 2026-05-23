// =========================================================
// print.js — Job order PDF / Print
// =========================================================

import { sb } from './supabase.js';
import { S } from './state.js';
import { $, esc, refreshIcons, fmtDateTime, openModal, closeModal, toast } from './utils.js';

const STATUS_LABEL_TH = {
  WAIT: 'รอรับงาน', GOING: 'กำลังดำเนินการ',
  DONE: 'เสร็จแล้ว', CANCELED: 'ยกเลิก'
};

export async function openPrintJob(jobId){
  const job = S.jobs.find(j => j.id === jobId);
  if(!job) return;

  // Fetch signature if exists
  const { data: sigs } = await sb.from('signatures').select('*').eq('job_id', jobId).limit(1);
  const sig = (sigs && sigs[0]) || null;

  $('print-body').innerHTML = renderJobPDFHtml(job, sig);
  refreshIcons();

  $('btn-print-pdf').onclick = () => downloadJobPDF(job);
  $('btn-print-window').onclick = () => window.print();

  openModal('modal-print');
}

function renderJobPDFHtml(job, sig){
  const showRecipientSig = job.status === 'DONE' && sig;

  return `<div class="job-pdf" id="job-pdf">
    <div class="pdf-head">
      <div class="pdf-logo">NJ</div>
      <div>
        <h1>N.J. LOGISTICS &amp; FRUITS CO., LTD.</h1>
        <div class="pdf-sub">ใบสั่งงาน · JOB ORDER</div>
      </div>
    </div>
    <table class="pdf-info">
      <tr><td class="lbl">JOB NO</td><td class="val">${esc(job.job_no || '—')}</td><td class="lbl">JOB NJ</td><td class="val">${esc(job.job_nj || '—')}</td></tr>
      <tr><td class="lbl">สถานะ</td><td class="val">${esc(STATUS_LABEL_TH[job.status] || job.status)}</td><td class="lbl">ประเภท</td><td class="val">${esc(job.category || '—')}</td></tr>
      <tr><td class="lbl">บริษัท</td><td class="val" colspan="3">${esc(job.company || '—')}</td></tr>
      <tr><td class="lbl">รายละเอียด</td><td class="val" colspan="3">${esc(job.description || '—')}</td></tr>
      <tr><td class="lbl">สถานที่รับ/ส่ง</td><td class="val" colspan="3">${esc(job.pickup_location || '—')}</td></tr>
      <tr><td class="lbl">เวลาส่ง/รับ</td><td class="val">${esc(fmtDateTime(job.pickup_time))}</td><td class="lbl">สร้างเมื่อ</td><td class="val">${esc(fmtDateTime(job.created_at))}</td></tr>
      <tr><td class="lbl">ผู้สร้าง</td><td class="val">${esc(job.created_by_name || '—')}</td><td class="lbl">แมสเซ็นเจอร์</td><td class="val">${esc(job.assigned_to_name || 'ยังไม่ได้รับ')}</td></tr>
      ${job.notes ? `<tr><td class="lbl">หมายเหตุ</td><td class="val" colspan="3" style="white-space:pre-wrap">${esc(job.notes)}</td></tr>` : ''}
      ${job.close_note ? `<tr><td class="lbl">หมายเหตุปิดงาน</td><td class="val" colspan="3" style="white-space:pre-wrap">${esc(job.close_note)}</td></tr>` : ''}
    </table>

    <div class="pdf-signs pdf-signs-3">
      <div class="pdf-sign">
        <div class="label">ผู้สั่งงาน</div>
        <div class="sign-area"><div style="border-top:1px dashed #aaa;width:80%;margin:0 auto"></div></div>
        <div class="line">${esc(job.created_by_name || '..............................')}</div>
        <div class="sub">วันที่ ${esc(fmtDateTime(job.created_at))}</div>
      </div>
      <div class="pdf-sign">
        <div class="label">แมสเซ็นเจอร์</div>
        <div class="sign-area"><div style="border-top:1px dashed #aaa;width:80%;margin:0 auto"></div></div>
        <div class="line">${esc(job.assigned_to_name || '..............................')}</div>
        <div class="sub">${job.accepted_at ? 'รับงานเมื่อ ' + esc(fmtDateTime(job.accepted_at)) : '..............................'}</div>
      </div>
      <div class="pdf-sign">
        <div class="label">ผู้รับ</div>
        <div class="sign-area ${showRecipientSig ? 'sign-area-img' : ''}">${showRecipientSig
          ? `<img src="${esc(sig.signature_url)}" alt="signature">`
          : '<div style="border-top:1px dashed #aaa;width:80%;margin:0 auto"></div>'}</div>
        <div class="line">${esc(showRecipientSig ? sig.signer_name : '..............................')}</div>
        <div class="sub">${job.closed_at ? 'รับเมื่อ ' + esc(fmtDateTime(job.closed_at)) : '..............................'}</div>
      </div>
    </div>
  </div>`;
}

async function downloadJobPDF(job){
  const node = $('job-pdf');
  if(!node){ toast('ไม่พบเนื้อหา', 'error'); return; }
  try {
    await html2pdf().set({
      margin: 0,
      filename: `JOB_${job.job_no || 'unknown'}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(node).save();
    toast('ดาวน์โหลด PDF แล้ว', 'success');
  } catch(e){
    toast(e.message || 'สร้าง PDF ไม่สำเร็จ', 'error');
  }
}
