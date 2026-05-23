// =========================================================
// export.js — Excel export + JSON backup + Restore Import
// =========================================================

import { sb } from './supabase.js';
import { S } from './state.js';
import { $, esc, refreshIcons, toast, confirmAction, fmtDateTime } from './utils.js';
import { canViewBackupPage } from './permissions.js';
import { filteredJobs } from './jobs.js';

// ========== EXPORT EXCEL ==========
export function exportExcel(){
  const list = filteredJobs();
  const arr = list.length ? list : S.jobs;
  if(!arr.length){ toast('ไม่มีข้อมูล', 'error'); return; }

  const rows = arr.map(j => ({
    'JOB NO': j.job_no || '',
    'JOB NJ': j.job_nj || '',
    'บริษัท': j.company || '',
    'ประเภท': j.category || '',
    'รายละเอียด': j.description || '',
    'สถานที่รับ': j.pickup_location || '',
    'เวลาส่ง/รับ': j.pickup_time ? new Date(j.pickup_time).toLocaleString('th-TH') : '',
    'สถานะ': ({ WAIT: 'รอรับงาน', GOING: 'กำลังดำเนินการ', DONE: 'เสร็จแล้ว', CANCELED: 'ยกเลิก' }[j.status]) || j.status,
    'แมสเซ็นเจอร์': j.assigned_to_name || '',
    'ผู้สร้าง': j.created_by_name || '',
    'สร้างเมื่อ': j.created_at ? new Date(j.created_at).toLocaleString('th-TH') : '',
    'ปิดเมื่อ': j.closed_at ? new Date(j.closed_at).toLocaleString('th-TH') : '',
    'เหตุผลยกเลิก': j.cancel_reason || '',
    'หมายเหตุ': j.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Jobs');

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `MASS_DISPATCH_EXPORT_${stamp}.xlsx`);
  toast('Export สำเร็จ', 'success');
}

// ========== BACKUP ==========
export async function exportBackup(){
  if(!canViewBackupPage()) return;

  try {
    // Pull live data
    const [jobs, users, logs, atts, sigs] = await Promise.all([
      sb.from('jobs').select('*'),
      sb.from('users').select('*'),
      sb.from('job_logs').select('*'),
      sb.from('attachments').select('*'),
      sb.from('signatures').select('*')
    ]);

    const data = {
      _meta: {
        version: '5.0.0',
        exported_at: new Date().toISOString(),
        exported_by: S.user.full_name || S.user.username,
        record_counts: {
          jobs: (jobs.data || []).length,
          users: (users.data || []).length,
          job_logs: (logs.data || []).length,
          attachments: (atts.data || []).length,
          signatures: (sigs.data || []).length
        }
      },
      jobs: jobs.data || [],
      users: users.data || [],
      job_logs: logs.data || [],
      attachments: atts.data || [],
      signatures: sigs.data || []
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MASS_DISPATCH_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Log to backups table
    try {
      await sb.from('backups').insert({
        file_name: a.download,
        created_by: S.user.id,
        created_by_name: S.user.full_name || S.user.username
      });
    } catch(_) {}

    toast('Backup สำเร็จ', 'success');
  } catch(e){
    console.error(e);
    toast(e.message || 'Backup ไม่สำเร็จ', 'error');
  }
}

// ========== RESTORE (IMPORT — MERGE mode) ==========
export function triggerRestoreFilePicker(){
  $('restore-file-input').click();
}

export async function importBackup(file){
  if(!file) return;
  if(!canViewBackupPage()) return;

  // Step 1: parse + validate
  let payload;
  try {
    const text = await file.text();
    payload = JSON.parse(text);
  } catch(e){
    toast('ไฟล์ Backup ไม่ถูกต้อง: ' + e.message, 'error');
    return;
  }

  if(!payload._meta || !Array.isArray(payload.jobs)){
    toast('โครงสร้าง Backup ไม่ถูกต้อง', 'error');
    return;
  }

  const counts = {
    jobs: (payload.jobs || []).length,
    users: (payload.users || []).length,
    job_logs: (payload.job_logs || []).length,
    attachments: (payload.attachments || []).length,
    signatures: (payload.signatures || []).length
  };

  // Step 2: confirm
  confirmAction(
    'Import (Merge)',
    `Import ข้อมูล:\n• Jobs: ${counts.jobs}\n• Users: ${counts.users}\n• Logs: ${counts.job_logs}\n• Attachments: ${counts.attachments}\n• Signatures: ${counts.signatures}\n\nจะ MERGE เข้าฐานข้อมูล (ไม่ลบของเดิม) — แถวที่ ID ซ้ำจะถูกอัปเดต`,
    async () => {
      await _doImportMerge(payload);
    },
    'เริ่ม Import'
  );
}

async function _doImportMerge(payload){
  const tables = [
    { name: 'users', rows: payload.users || [] },
    { name: 'jobs', rows: payload.jobs || [] },
    { name: 'job_logs', rows: payload.job_logs || [] },
    { name: 'attachments', rows: payload.attachments || [] },
    { name: 'signatures', rows: payload.signatures || [] }
  ];

  let ok = 0, fail = 0;
  for(const t of tables){
    if(!t.rows.length){ continue; }
    toast(`กำลัง Import ${t.name} (${t.rows.length})...`, 'info');
    // Batch upsert in chunks of 100 (avoid request-size limits)
    const chunkSize = 100;
    for(let i = 0; i < t.rows.length; i += chunkSize){
      const chunk = t.rows.slice(i, i + chunkSize);
      const { error } = await sb.from(t.name).upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
      if(error){
        fail++;
        console.warn(`Import error on ${t.name}:`, error.message);
      } else {
        ok += chunk.length;
      }
    }
  }
  toast(`Import เสร็จ — สำเร็จ ${ok} แถว · ล้มเหลว ${fail} ครั้ง`, fail ? 'error' : 'success');
  // Note: app.js realtime will refresh state automatically
}

// ========== BACKUP PAGE VIEW ==========
export async function renderBackupView(){
  if(!canViewBackupPage()){
    $('view-root').innerHTML = '<div class="content"><div class="empty">ไม่มีสิทธิ์เข้าถึงหน้านี้</div></div>';
    return;
  }

  // Load history
  let history = [];
  try {
    const { data } = await sb.from('backups').select('*').order('created_at', { ascending: false }).limit(50);
    history = data || [];
  } catch(_) {}

  $('view-root').innerHTML = `
    <div class="topbar">
      <div><h1>Backup &amp; Restore</h1><p class="sub">สำรอง / กู้คืนข้อมูล</p></div>
    </div>
    <div class="content">
      <div class="grid-2" style="margin-bottom:24px">
        <div class="panel">
          <div class="panel-head"><h3><i data-lucide="download" style="width:16px;height:16px;display:inline"></i> Backup (Export)</h3><div class="sub">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</div></div>
          <div class="panel-body">
            <p style="color:var(--muted);font-size:13px;margin-top:0">ไฟล์ Backup จะมีข้อมูลทั้งหมด: Jobs, Users, Logs, Attachments, Signatures</p>
            <button class="btn btn-primary" id="btn-do-backup"><i data-lucide="download"></i> สร้างไฟล์ Backup</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3><i data-lucide="upload" style="width:16px;height:16px;display:inline"></i> Import (Merge)</h3><div class="sub">นำเข้าจากไฟล์ JSON · จะ MERGE เข้ากับข้อมูลเดิม</div></div>
          <div class="panel-body">
            <p style="color:var(--muted);font-size:13px;margin-top:0">⚠️ ระบบใช้โหมด MERGE: แถว ID ซ้ำจะถูก UPDATE แถวใหม่จะถูก INSERT — ของเดิมไม่ถูกลบ</p>
            <button class="btn btn-warn" id="btn-trigger-restore"><i data-lucide="upload"></i> เลือกไฟล์ Backup</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>ประวัติ Backup</h3><div class="sub">${history.length} รายการล่าสุด</div></div>
        <div style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>ไฟล์</th><th>โดย</th><th>วันที่</th></tr></thead>
          <tbody>${history.length ? history.map(h => `
            <tr>
              <td data-label="ไฟล์"><code style="font-family:'Inter',monospace;font-size:12.5px">${esc(h.file_name)}</code></td>
              <td data-label="โดย">${esc(h.created_by_name || '—')}</td>
              <td data-label="วันที่">${esc(fmtDateTime(h.created_at))}</td>
            </tr>`).join('') : '<tr><td colspan="3" class="empty">ยังไม่มีประวัติ Backup</td></tr>'}
          </tbody>
        </table></div>
      </div>
    </div>`;
  refreshIcons();
}
