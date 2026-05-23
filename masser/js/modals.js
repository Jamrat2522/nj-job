// =========================================================
// modals.js — Create / Edit / Cancel / Close / Detail / Note
// =========================================================

import { sb, BUCKET_SIGNATURES } from './supabase.js';
import { rpcNextJobNo } from './supabase.js';
import { S } from './state.js';
import {
  $, esc, refreshIcons, fmtDateTime, openModal, closeModal,
  toast, confirmAction, avatar, statusBadge
} from './utils.js';
import { initAutocompletes } from './autocomplete.js';
import {
  canCreateJob, canEditJob, canDeleteJob, canAcceptJob,
  canCloseJob, canCancelJob, isAdmin, isOwner, isAssigned,
  isOwnerOnlyClose
} from './permissions.js';
import { initSignature } from './signature.js';
import { uploadAttachment, deleteAttachment } from './attachments.js';
import { renderTimeline } from './timeline.js';
import { invalidateStatusCache } from './sidebar.js';

// ========== HELPERS ==========
function localDatetimeNow(){
  const d = new Date(); d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

// ========== CREATE JOB MODAL ==========
let _editingJobId = null;

export async function openCreateJob(prefill = null){
  _editingJobId = prefill ? prefill.id : null;

  // Title swap (create vs edit)
  $('create-title').textContent = prefill ? 'แก้ไขงาน' : 'สร้างงานใหม่';
  const submitBtn = $('btn-submit-create');
  submitBtn.innerHTML = prefill
    ? '<i data-lucide="save"></i> บันทึก'
    : '<i data-lucide="check"></i> บันทึกงาน';

  // Set datetime label
  const now = new Date();
  $('cj-datetime').textContent = now.toLocaleString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Pre-fill or fresh
  if(prefill){
    $('cj-jobno').textContent = prefill.job_no || '—';
    $('cj-jobnj').value = prefill.job_nj || '';
    $('cj-category').value = prefill.category || 'รับ-ส่งทั่วไป';
    $('cj-company').value = prefill.company || '';
    $('cj-pickup').value = prefill.pickup_location || '';
    $('cj-pickup-time').value = prefill.pickup_time
      ? new Date(prefill.pickup_time).toISOString().slice(0, 16)
      : '';
    $('cj-desc').value = prefill.description || '';
    $('cj-notes').value = prefill.notes || '';
  } else {
    $('cj-jobno').textContent = '— กำลังขอเลข —';
    $('cj-jobnj').value = '';
    $('cj-category').value = 'รับ-ส่งทั่วไป';
    $('cj-company').value = '';
    $('cj-pickup').value = '';
    $('cj-pickup-time').value = localDatetimeNow();
    $('cj-desc').value = '';
    $('cj-notes').value = '';
    // Get next job no
    try {
      const no = await rpcNextJobNo();
      $('cj-jobno').textContent = no;
    } catch(e){
      $('cj-jobno').textContent = 'JOB' + Date.now().toString().slice(-6);
    }
  }

  // Bind submit
  submitBtn.onclick = submitCreate;
  openModal('modal-create');
  initAutocompletes();
  refreshIcons();
}

async function submitCreate(){
  const company = $('cj-company').value.trim();
  const category = $('cj-category').value;
  const pickup = $('cj-pickup').value.trim();
  const time = $('cj-pickup-time').value;
  const desc = $('cj-desc').value.trim();
  const notes = $('cj-notes').value.trim();
  const jobnj = $('cj-jobnj').value.trim();

  if(!company || !pickup || !time){
    toast('กรอกข้อมูล * ให้ครบ', 'error');
    return;
  }

  const submit = $('btn-submit-create');
  submit.disabled = true;
  submit.innerHTML = '<span class="spinner"></span> กำลังบันทึก...';

  try {
    if(_editingJobId){
      // Update
      const { error } = await sb.from('jobs').update({
        company, category,
        description: desc || null,
        pickup_location: pickup,
        pickup_time: time ? new Date(time).toISOString() : null,
        notes: notes || null,
        job_nj: jobnj || null
      }).eq('id', _editingJobId);
      if(error) throw error;
      toast('แก้ไขงานเรียบร้อย', 'success');
    } else {
      // Create
      const job_no = $('cj-jobno').textContent.trim();
      const { error } = await sb.from('jobs').insert({
        job_no, job_nj: jobnj || null,
        status: 'WAIT', company, category,
        description: desc || null,
        pickup_location: pickup,
        pickup_time: time ? new Date(time).toISOString() : null,
        notes: notes || null,
        created_by: S.user.id,
        created_by_name: S.user.full_name || S.user.username
      });
      if(error) throw error;
      invalidateStatusCache();
      toast('สร้างงาน ' + job_no + ' เรียบร้อย', 'success');
    }
    closeModal('modal-create');
    _editingJobId = null;
  } catch(e){
    toast(e.message || 'บันทึกไม่สำเร็จ', 'error');
  } finally {
    submit.disabled = false;
    submit.innerHTML = _editingJobId
      ? '<i data-lucide="save"></i> บันทึก'
      : '<i data-lucide="check"></i> บันทึกงาน';
    refreshIcons();
  }
}

// ========== CANCEL JOB MODAL ==========
let _cancelingJobId = null;

export function openCancelJob(jobId){
  const j = S.jobs.find(x => x.id === jobId);
  if(!j || !canCancelJob(j)) return;
  _cancelingJobId = jobId;
  $('cancel-reason').value = '';
  openModal('modal-cancel');
}

export async function submitCancel(){
  const reason = $('cancel-reason').value.trim();
  if(!reason){ toast('กรอกเหตุผล', 'error'); return; }
  const btn = $('btn-submit-cancel');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังยกเลิก...';
  try {
    const { error } = await sb.from('jobs').update({
      status: 'CANCELED',
      cancel_reason: reason,
      canceled_at: new Date().toISOString(),
      canceled_by: S.user.id,
      canceled_by_name: S.user.full_name || S.user.username
    }).eq('id', _cancelingJobId);
    if(error) throw error;
    await sb.from('job_logs').insert({
      job_id: _cancelingJobId, action: 'canceled',
      user_id: S.user.id, user_name: S.user.full_name || S.user.username,
      note: reason
    });
    closeModal('modal-cancel');
    closeModal('modal-detail');
    invalidateStatusCache();
    toast('ยกเลิกงานเรียบร้อย', 'success');
  } catch(e){ toast(e.message || 'ยกเลิกไม่สำเร็จ', 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="x-circle"></i> ยกเลิกงาน';
    refreshIcons();
  }
}

// ========== CLOSE JOB MODAL ==========
let _closingJobId = null;
let _closeFiles = [];  // Local file queue

export function openCloseJob(jobId){
  const j = S.jobs.find(x => x.id === jobId);
  if(!j || !canCloseJob(j)) return;
  _closingJobId = jobId;
  _closeFiles = [];
  $('close-files').value = '';
  $('close-note').value = '';
  $('sig-name').value = '';
  renderCloseFileList();

  // Toggle owner-only confirm UI
  const isOwnerConfirm = isOwnerOnlyClose(j);
  $('modal-close-title').textContent = isOwnerConfirm ? 'ยืนยันรับเอกสาร' : 'ปิดงาน';
  $('btn-submit-close').innerHTML = isOwnerConfirm
    ? '<i data-lucide="check-circle"></i> ยืนยันรับเอกสาร'
    : '<i data-lucide="check-circle"></i> ปิดงาน';
  $('modal-close-alert').innerHTML = isOwnerConfirm
    ? 'ยืนยันว่า <b>ได้รับเอกสาร</b> เรียบร้อย — ระบบจะปิดงานให้อัตโนมัติ'
    : 'ต้องแนบหลักฐาน <b>อย่างน้อย 1 ไฟล์</b> และ <b>ลายเซ็นผู้รับ</b>';

  $('btn-submit-close').onclick = submitClose;
  openModal('modal-close');

  // Bind file input
  $('close-files').onchange = (e) => {
    const files = Array.from(e.target.files || []);
    for(const f of files){
      if(_closeFiles.length >= 10){ toast('แนบไฟล์เกิน 10 ไฟล์', 'error'); break; }
      _closeFiles.push(f);
    }
    e.target.value = '';
    renderCloseFileList();
  };

  // Init signature pad
  setTimeout(initSignature, 50);
  refreshIcons();
}

function renderCloseFileList(){
  const list = $('close-files-list');
  if(!_closeFiles.length){ list.innerHTML = ''; return; }
  list.innerHTML = _closeFiles.map((f, i) => `
    <div class="att-item">
      <i data-lucide="${/^image/.test(f.type) ? 'image' : 'file-text'}" style="width:18px;height:18px"></i>
      <div class="meta">
        <div class="nm">${esc(f.name)}</div>
        <div class="sub">${(f.size / 1024).toFixed(1)} KB</div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" data-act="rmclose" data-idx="${i}"><i data-lucide="x"></i></button>
      </div>
    </div>`).join('');
  refreshIcons();
}

export function removeCloseFile(idx){
  _closeFiles.splice(idx, 1);
  renderCloseFileList();
}

async function submitClose(){
  const job = S.jobs.find(j => j.id === _closingJobId);
  if(!job){ toast('งานหายไป', 'error'); return; }
  const isOwnerConfirm = isOwnerOnlyClose(job);
  const note = $('close-note').value.trim();
  const sigName = $('sig-name').value.trim();

  if(!isOwnerConfirm){
    if(!_closeFiles.length){ toast('แนบไฟล์อย่างน้อย 1 ไฟล์', 'error'); return; }
    if(!S.sigDirty || S.sigStrokes < 1 || S.sigPathLen < 60){
      toast('กรุณาลงลายเซ็น', 'error'); return;
    }
    if(!sigName){ toast('กรอกชื่อผู้เซ็น', 'error'); return; }
  }

  const btn = $('btn-submit-close');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังปิดงาน...';

  try {
    // 1) Update job status FIRST (so attachments / signatures can reference it)
    const { error: upErr } = await sb.from('jobs').update({
      status: 'DONE',
      closed_at: new Date().toISOString(),
      closed_by: S.user.id,
      closed_by_name: S.user.full_name || S.user.username,
      close_note: note || null
    }).eq('id', _closingJobId);
    if(upErr) throw upErr;

    // 2) Upload attachments (if any)
    for(const f of _closeFiles){
      try { await uploadAttachment(_closingJobId, f); }
      catch(e){ console.warn('attachment upload failed', e); }
    }

    // 3) Save signature (if not owner-confirm)
    if(!isOwnerConfirm){
      const canvas = $('sig-canvas');
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const path = `${_closingJobId}/${Date.now()}.png`;
      const up = await sb.storage.from(BUCKET_SIGNATURES).upload(path, blob, { contentType: 'image/png' });
      if(!up.error){
        const { data: pub } = sb.storage.from(BUCKET_SIGNATURES).getPublicUrl(path);
        await sb.from('signatures').insert({
          job_id: _closingJobId,
          signer_name: sigName,
          signature_url: pub.publicUrl,
          storage_path: path,
          signed_by: S.user.id
        });
      }
    }

    // 4) Log
    await sb.from('job_logs').insert({
      job_id: _closingJobId, action: 'closed',
      user_id: S.user.id, user_name: S.user.full_name || S.user.username,
      note: note || null
    });

    closeModal('modal-close');
    closeModal('modal-detail');
    invalidateStatusCache();
    toast('ปิดงานเรียบร้อย', 'success');
  } catch(e){
    toast(e.message || 'ปิดงานไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    refreshIcons();
  }
}

// ========== NOTE EDIT MODAL ==========
let _noteJobId = null;

export function openNoteModal(job){
  _noteJobId = job.id;
  $('note-text').value = job.notes || '';
  $('btn-submit-note').onclick = submitNote;
  openModal('modal-note');
}

async function submitNote(){
  const val = $('note-text').value.trim();
  try {
    const { error } = await sb.from('jobs').update({ notes: val || null }).eq('id', _noteJobId);
    if(error) throw error;
    closeModal('modal-note');
    toast('บันทึกหมายเหตุแล้ว', 'success');
  } catch(e){ toast(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
}

// ========== DETAIL MODAL ==========
export async function openDetail(jobId){
  const job = S.jobs.find(j => j.id === jobId);
  if(!job) return;
  S.currentJob = job;

  $('dt-jobno').textContent = job.job_no || '—';
  $('dt-statusbadge').innerHTML = statusBadge(job.status);
  $('dt-priority').textContent = job.priority || 'ปกติ';

  // Load supporting data in parallel
  const [aRes, sRes, lRes] = await Promise.all([
    sb.from('attachments').select('*').eq('job_id', jobId).order('created_at'),
    sb.from('signatures').select('*').eq('job_id', jobId).order('created_at'),
    sb.from('job_logs').select('*').eq('job_id', jobId).order('created_at')
  ]);
  const attachments = aRes.data || [];
  const signatures = sRes.data || [];
  const logs = lRes.data || [];

  renderDetail(job, attachments, signatures, logs);
  openModal('modal-detail');
}

function renderDetail(job, attachments, signatures, logs){
  // Action card (left bottom of right column)
  let actionCard = '';
  if(canAcceptJob(job)){
    actionCard = `
      <div class="action-card">
        <div class="big-badge"><i data-lucide="zap"></i> รับงาน</div>
        <div class="sub">กดปุ่มเพื่อรับผิดชอบงานนี้</div>
        <button class="btn btn-primary" data-action="accept" data-id="${esc(job.id)}"><i data-lucide="check-circle"></i> รับงาน</button>
      </div>`;
  } else if(canCloseJob(job)){
    const owner = isOwnerOnlyClose(job);
    actionCard = `
      <div class="action-card">
        <div class="big-badge"><i data-lucide="check-circle"></i> ${owner ? 'ยืนยันรับเอกสาร' : 'ปิดงาน'}</div>
        <div class="sub">${owner ? 'ยืนยันว่าได้รับเอกสาร' : 'แนบหลักฐาน + ลายเซ็น'}</div>
        <button class="btn btn-going" data-action="open-close" data-id="${esc(job.id)}"><i data-lucide="check-circle"></i> ${owner ? 'ยืนยัน' : 'ปิดงาน'}</button>
      </div>`;
  } else if(job.status === 'DONE'){
    actionCard = `
      <div class="action-card">
        <div class="big-badge" style="color:#6EE7B7"><i data-lucide="check-circle"></i> งานเสร็จแล้ว</div>
        <div class="sub">ปิดเมื่อ ${esc(fmtDateTime(job.closed_at))}</div>
      </div>`;
  } else if(job.status === 'CANCELED'){
    actionCard = `
      <div class="action-card">
        <div class="big-badge" style="color:#FCA5A5"><i data-lucide="x-circle"></i> งานถูกยกเลิก</div>
        <div class="sub">เหตุผล: ${esc(job.cancel_reason || '—')}</div>
      </div>`;
  }

  let dangerZone = '';
  if(canCancelJob(job)){
    dangerZone += `
      <div class="danger-zone">
        <h4><i data-lucide="alert-triangle" style="width:14px;height:14px;display:inline"></i> ยกเลิกงาน</h4>
        <div class="note">การยกเลิกจะหยุดดำเนินงานทันที</div>
        <button class="btn btn-danger" data-action="open-cancel" data-id="${esc(job.id)}"><i data-lucide="x-circle"></i> ยกเลิกงาน</button>
      </div>`;
  }
  if(canDeleteJob()){
    dangerZone += `
      <div class="danger-zone">
        <h4><i data-lucide="trash-2" style="width:14px;height:14px;display:inline"></i> ลบงาน</h4>
        <div class="note">การลบจะลบประวัติทั้งหมด</div>
        <button class="btn btn-danger" data-action="delete-job" data-id="${esc(job.id)}"><i data-lucide="trash-2"></i> ลบงาน</button>
      </div>`;
  }

  // Attachments
  const attHtml = attachments.length ? attachments.map(a => `
    <div class="att-item">
      ${/^image/.test(a.file_type) ? `<img class="thumb" src="${esc(a.file_url)}" alt="">` : `<i data-lucide="file-text" style="width:24px;height:24px"></i>`}
      <div class="meta">
        <div class="nm"><a href="${esc(a.file_url)}" target="_blank" rel="noopener">${esc(a.file_name)}</a></div>
        <div class="sub">${((a.file_size || 0) / 1024).toFixed(1)} KB · ${esc(a.uploaded_by_name || '')} · ${esc(fmtDateTime(a.created_at))}</div>
      </div>
      ${(isAdmin() || a.uploaded_by === S.user.id) ? `<div class="actions"><button class="btn btn-ghost btn-sm" data-action="del-att" data-id="${esc(a.id)}"><i data-lucide="x"></i></button></div>` : ''}
    </div>`).join('') : '<div style="color:var(--muted);font-size:13px;padding:8px 0">ยังไม่มีไฟล์แนบ</div>';

  // Signatures
  const sigHtml = signatures.length ? `
    <div class="info-card">
      <div class="head"><h4>ลายเซ็นผู้รับ</h4></div>
      ${signatures.map(s => `<div style="text-align:center">
        <img src="${esc(s.signature_url)}" style="max-width:240px;max-height:100px;border:1px solid var(--border);border-radius:8px;background:#fff;padding:6px">
        <div style="font-size:13px;font-weight:600;margin-top:6px">${esc(s.signer_name)}</div>
      </div>`).join('')}
    </div>` : '';

  const noteEditBtn = (canEditJob(job))
    ? `<button class="btn btn-ghost btn-sm" data-action="edit-note" data-id="${esc(job.id)}"><i data-lucide="pencil"></i> แก้</button>`
    : '';

  $('dt-body').innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="info-card">
          <div class="head"><h4>ข้อมูลงาน</h4></div>
          <div class="info-row"><div class="lbl"><i data-lucide="hash"></i> JOB NJ</div><div class="val">${esc(job.job_nj || '—')}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="building-2"></i> บริษัท</div><div class="val">${esc(job.company || '—')}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="tag"></i> ประเภทงาน</div><div class="val">${esc(job.category || '—')}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="file-text"></i> รายละเอียด</div><div class="val">${esc(job.description || '—')}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="map-pin"></i> สถานที่รับ/ส่ง</div><div class="val">${esc(job.pickup_location || '—')}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="clock"></i> เวลาส่ง/รับ</div><div class="val">${esc(fmtDateTime(job.pickup_time))}</div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="user"></i> User สร้าง</div><div class="val">${esc(job.created_by_name || '—')} <span style="color:var(--muted);font-size:12px">· ${esc(fmtDateTime(job.created_at))}</span></div></div>
          <div class="info-row"><div class="lbl"><i data-lucide="truck"></i> แมสเซ็นเจอร์</div><div class="val">${esc(job.assigned_to_name || 'ยังไม่ได้รับ')}</div></div>
        </div>

        <div class="info-card">
          <div class="head"><h4>หมายเหตุ</h4>${noteEditBtn}</div>
          <div style="white-space:pre-wrap;color:#cdd3df;font-size:13.5px">${esc(job.notes || '—')}</div>
        </div>

        <div class="info-card">
          <div class="head"><h4>Timeline</h4></div>
          ${renderTimeline(job, logs)}
        </div>
      </div>
      <div>
        ${actionCard}
        <div class="info-card">
          <div class="head"><h4>ไฟล์แนบ</h4></div>
          <div class="att-list">${attHtml}</div>
        </div>
        ${sigHtml}
        ${dangerZone}
      </div>
    </div>
    <div class="detail-actions-mobile">
      ${canCloseJob(job) ? `<button class="btn btn-going" data-action="open-close" data-id="${esc(job.id)}"><i data-lucide="check-circle"></i> ${isOwnerOnlyClose(job) ? 'ยืนยัน' : 'ปิดงาน'}</button>` : ''}
      ${canAcceptJob(job) ? `<button class="btn btn-primary" data-action="accept" data-id="${esc(job.id)}"><i data-lucide="check-circle"></i> รับงาน</button>` : ''}
      ${canCancelJob(job) ? `<button class="btn btn-danger" data-action="open-cancel" data-id="${esc(job.id)}"><i data-lucide="x-circle"></i> ยกเลิก</button>` : ''}
    </div>`;
  refreshIcons();
}

// Detail attachment delete handler
export async function detailDeleteAttachment(attId){
  const job = S.currentJob;
  if(!job) return;
  const { data: row } = await sb.from('attachments').select('*').eq('id', attId).maybeSingle();
  if(!row) return;
  confirmAction(
    'ลบไฟล์',
    'ลบไฟล์ ' + (row.file_name || '') + '?',
    async () => {
      await deleteAttachment(row);
      await openDetail(job.id);
      toast('ลบไฟล์แล้ว', 'success');
    },
    'ลบไฟล์', true
  );
}
