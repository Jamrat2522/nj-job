/* สถานะ Backup — njacc_backup_status อ่านจาก njacc_settings keys: backup_last_at,
   backup_last_status, backup_verify_status, backup_restore_test */
import { rpc } from '../core/supabase-client.js';
import { esc } from '../core/formatter.js';

export async function render(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>สถานะ Backup</h2></div></div>
    <div id="bk-body"><div class="load-row"><div class="spin"></div></div></div>
    <div class="card card-pad mt-2 t-sm t-2">
      Layer 1: Supabase Managed Backup (ตามแพ็กเกจโปรเจกต์) ·
      Layer 2: ระบบ backup อิสระรายวัน 17:30 → Google Drive — เมื่อ pipeline อัปเดตค่า
      backup_* ใน njacc_settings สถานะจะแสดงที่นี่อัตโนมัติ
    </div>`;
  try {
    const s = await rpc('njacc_backup_status');
    const item = (lb, v, cls) => `<div class="card card-pad bk-item">
      <div class="t-xs t-2">${lb}</div><div class="st ${cls}">${esc(v)}</div></div>`;
    const at = s?.last_backup_at ? String(s.last_backup_at).replace('T', ' ').slice(0, 19) : 'ยังไม่มีข้อมูล';
    cnt.querySelector('#bk-body').innerHTML = `<div class="bk-grid">
      ${item('Backup ล่าสุด', at, s?.last_backup_at ? 'ok' : 'warn')}
      ${item('สถานะรอบล่าสุด', s?.last_backup_status || 'ยังไม่มีข้อมูล',
        s?.last_backup_status === 'SUCCESS' ? 'ok' : (s?.last_backup_status ? 'bad' : 'warn'))}
      ${item('ตรวจไฟล์ (Verify)', s?.last_verify_status || 'NOT VERIFIED',
        s?.last_verify_status === 'PASS' ? 'ok' : 'warn')}
      ${item('Restore Test ล่าสุด', s?.last_restore_test || 'NOT TESTED',
        s?.last_restore_test === 'PASS' ? 'ok' : 'warn')}
    </div>`;
  } catch (e) {
    cnt.querySelector('#bk-body').innerHTML =
      '<div class="card card-pad empty">โหลดสถานะไม่สำเร็จ — ลองรีเฟรชหน้าอีกครั้ง</div>';
    console.warn(e);
  }
}
