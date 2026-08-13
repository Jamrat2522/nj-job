/* Dispatcher ของ Toolbar — ต่อไปยัง charge-import.js / charge-export.js
   ทุกอย่างทำงานบน njacc_* เท่านั้น (ไม่แตะตาราง BILLING เดิม) */
import { chargeKpi, bulkSetField, bulkSetStatus, contactList, quickCloseLookup } from './charge-api.js';
import { runMainImport, runAplUpload, runUpload19, runContactUpload, pickFile, readSheet } from './charge-import.js';
import { exportExcel, exportCsv, exportByCustomerZip, exportSoa, exportMaerskCase,
  showBulkResult, showTotals } from './charge-export.js';
import { openModal, closeModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { once } from '../core/request-manager.js';
import { esc, dmy } from '../core/formatter.js';
import { groupLabel } from '../config/charge-groups.js';

/* ดึง token ที่เป็นเลขอ้างอิงจากบรรทัดที่วางมา — ข้ามวันที่ (dd/mm/yyyy) และ token ว่าง */
export function extractRefToken(line) {
  const parts = String(line || '').split(/[\s\t,;|]+/).map(x => x.trim()).filter(Boolean);
  for (const p of parts) {
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(p)) continue;   // วันที่
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) continue;
    return p;
  }
  return '';
}

/* กล่องรับเลขอ้างอิงหลายบรรทัด (+ ค่าที่จะเติม + วันที่เสริม) */
function keysDialog(title, { withValue, valueLabel, valueType = 'text', okLabel = 'ดำเนินการ', extraDate } = {}) {
  return new Promise(res => {
    const b = document.createElement('div');
    b.innerHTML = `
      <p class="t-sm t-2 mb-1">วางเลขอ้างอิงบรรทัดละ 1 รายการ
        (รองรับ Job No / Invoice No / Source Invoice No / Customer Job No)</p>
      <div class="fld"><textarea class="inp w100" id="tk-keys" rows="8" style="min-height:150px"></textarea></div>
      ${withValue ? `<div class="fld"><label>${esc(valueLabel)}</label>
        <input class="inp w100" id="tk-val" type="${valueType}"></div>` : ''}
      ${extraDate ? `<div class="fld"><label>${esc(extraDate)}</label>
        <input class="inp w100" id="tk-date" type="date"></div>` : ''}`;
    const f = document.createElement('div');
    f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
      <button class="btn btn-p" id="tk-ok">${esc(okLabel)}</button>`;
    const m = openModal({ title, body: b, footer: f, large: true });
    f.querySelector('#tk-ok').onclick = () => {
      const keys = b.querySelector('#tk-keys').value.split(/[\r\n\t,;]+/).map(s => s.trim()).filter(Boolean);
      if (!keys.length) { toast('ยังไม่ได้วางเลขอ้างอิง', 'err'); return; }
      const value = withValue ? b.querySelector('#tk-val').value.trim() : null;
      if (withValue && !value) { toast('กรอก' + valueLabel, 'err'); return; }
      const date = extraDate ? (b.querySelector('#tk-date').value || '') : '';
      closeModal(); res({ keys, value, date });
    };
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) res(null);
    });
  });
}

export async function runTool(action, ctx) {
  try {
    switch (action) {
      case 'refresh': ctx.refresh(); return;
      case 'new-job': location.hash = `#/job/new?charge=${ctx.charge}&group=${ctx.group}`; return;

      /* ---- Export ---- */
      case 'export-excel': return exportExcel(ctx, false);
      case 'export-all':   return exportExcel(ctx, true);
      case 'export-csv':   return exportCsv(ctx);
      case 'export-cust':  return exportByCustomerZip(ctx);
      case 'export-soa':   return exportSoa(ctx);
      case 'export-case':  return exportMaerskCase(ctx);

      /* ---- Import / Upload ---- */
      case 'upload':     return runMainImport(ctx);
      case 'apl-upload': return runAplUpload(ctx);
      case 'upload-19':  return runUpload19(ctx);

      /* ---- ยอดรวม ---- */
      case 'sum': {
        const k = await chargeKpi({ charge: ctx.charge, group: ctx.group, filters: ctx.filters });
        showTotals(k, ctx); return;
      }

      /* ---- Contact List (ดู + อัปโหลด LIST NAME) ---- */
      case 'contacts': {
        const list = await contactList(ctx.charge, ctx.group);
        const body = list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
            <th>Company Invoice</th><th>รหัส</th><th>Contact (LIST NAME)</th><th class="r">จำนวนงาน</th>
          </tr></thead><tbody>${list.map(c => `<tr>
            <td class="t-b">${esc(c.company_invoice)}</td><td>${esc(c.company_code || '-')}</td>
            <td>${esc(c.master_contact || '-')}</td><td class="r">${c.job_count ?? ''}</td>
          </tr>`).join('')}</tbody></table></div>
          <p class="t-xs t-3 mt-1">Contact ที่แสดงในตารางรายการ = Contact ของงาน (ถ้ามี) มิฉะนั้นใช้ค่าจาก LIST NAME นี้</p>`
          : '<div class="empty">ยังไม่มีบริษัท Invoice ที่มีงานในหน้านี้</div>';
        const f = document.createElement('div');
        f.innerHTML = `<button class="btn btn-o" id="ct-up">📁 อัปโหลด LIST NAME</button>
          <button class="btn btn-p" data-close>ปิด</button>`;
        openModal({ title: 'Contact List — ' + groupLabel(ctx.group), body, footer: f, large: true });
        f.querySelector('#ct-up').onclick = async () => { closeModal(); await runContactUpload(); };
        return;
      }

      /* ---- Bulk ---- */
      case 'paste-close': {
        const r = await keysDialog('Paste จบงาน (ตั้งสถานะ CLOSE)', { okLabel: 'จบงานทั้งหมด' });
        if (!r) return;
        if (!(await confirmModal('ยืนยันจบงาน',
          `จะตั้งสถานะ CLOSE ให้ ${r.keys.length} รายการ (เฉพาะงานที่ยังไม่ถูกยกเลิก)`))) return;
        const res = await once('bulk-close', () =>
          bulkSetStatus(ctx.charge, ctx.group, r.keys.map(extractRefToken).filter(Boolean), 'CLOSE'));
        showBulkResult('ผลการจบงาน', res); ctx.refresh(); return;
      }
      case 'close-upload': {
        const file = await pickFile(); if (!file) return;
        const grid = await readSheet(file);
        const keys = grid.map(r => String(r[0] ?? '').trim())
          .filter(k => k && !/^(invoice|job|เลข)/i.test(k));
        if (!keys.length) { toast('ไม่พบเลขอ้างอิงในไฟล์', 'err'); return; }
        if (!(await confirmModal('ตัดจบงานจากไฟล์',
          `พบ ${keys.length} รายการในไฟล์ ${esc(file.name)} — ตั้งสถานะ CLOSE ทั้งหมด?`))) return;
        const res = await once('close-upload', () => bulkSetStatus(ctx.charge, ctx.group, keys, 'CLOSE'));
        showBulkResult('ผลตัดจบงานจากไฟล์', res); ctx.refresh(); return;
      }
      case 'bulk-case': {
        const r = await keysDialog('Bulk Case', { withValue: true, valueLabel: 'Case',
          okLabel: 'อัปเดต Case', extraDate: 'ETA (ถ้าต้องการเติมด้วย)' });
        if (!r) return;
        /* รองรับวางทั้งบรรทัดจากงานจริง เช่น "NJ2605-03795 15/05/2026 AIR260507"
           → ใช้เฉพาะ token แรกที่เป็นเลขอ้างอิง (ไม่เอาวันที่/รหัสอื่นไป query) */
        const keys = r.keys.map(extractRefToken).filter(Boolean);
        if (!keys.length) { toast('ไม่พบเลขอ้างอิงในข้อความที่วาง', 'err'); return; }
        const res = await once('bulk-case', () => bulkSetField(ctx.charge, ctx.group, keys, 'case_no', r.value));
        showBulkResult('ผลอัปเดต Case', res);
        if (r.date) {
          const res2 = await bulkSetField(ctx.charge, ctx.group, keys, 'eta', r.date);
          showBulkResult('ผลเติม ETA', res2);
        }
        ctx.refresh(); return;
      }
      case 'fill-etd': {
        const r = await keysDialog('เติม ETD', { withValue: true, valueLabel: 'ETD', valueType: 'date', okLabel: 'เติม ETD' });
        if (!r) return;
        const res = await once('fill-etd', () =>
          bulkSetField(ctx.charge, ctx.group, r.keys.map(extractRefToken).filter(Boolean), 'etd', r.value));
        showBulkResult('ผลเติม ETD', res); ctx.refresh(); return;
      }

      /* ---- ADVANCE Quick Close ---- */
      case 'quick-close': {
        const el = document.getElementById('qc-key');
        const key = el ? el.value.trim() : '';
        if (!key) { toast('พิมพ์เลข JOB หรือ Invoice ก่อน', 'err'); return; }
        const res = await quickCloseLookup(ctx.charge, ctx.group, key);
        const matches = res.matches || [];
        if (!matches.length) { toast('ไม่พบรายการ: ' + key, 'err'); return; }
        if (matches.length > 1) { showMatches(matches, key); return; }
        const m = matches[0];
        if (m.operational_status === 'CLOSE') { toast('งานนี้จบแล้ว', 'err'); return; }
        if (m.operational_status === 'CANCELED') { toast('งานนี้ถูกยกเลิก จบงานไม่ได้', 'err'); return; }
        const ok = await confirmModal('ยืนยันจบงาน',
          `${esc(m.job_no)} · ${esc(m.customer_name || '-')}<br>
           Invoice: ${esc(m.invoice_no || m.source_invoice_no || '-')} · Due: ${dmy(m.due_date)}`);
        if (!ok) return;
        const r2 = await once('quick-close', () => bulkSetStatus(ctx.charge, ctx.group, [key], 'CLOSE'));
        if (r2.matched) { toast('จบงานแล้ว', 'ok'); if (el) el.value = ''; }
        else showBulkResult('ผลการจบงาน', r2);
        ctx.refresh(); return;
      }

      default: toast('ยังไม่รองรับคำสั่งนี้', 'err');
    }
  } catch (e) { handleErr(e); }
}

function showMatches(matches, key) {
  openModal({
    title: 'พบหลายรายการสำหรับ ' + key,
    body: `<p class="t-sm t-2">ระบบไม่จบงานให้อัตโนมัติเมื่อพบมากกว่า 1 รายการ — โปรดตรวจสอบ</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>Job No</th><th>Invoice</th><th>SRC</th><th>ลูกค้า</th><th>สถานะ</th><th>Due</th>
      </tr></thead><tbody>${matches.map(m => `<tr>
        <td>${esc(m.job_no)}</td><td>${esc(m.invoice_no || '-')}</td>
        <td>${esc(m.source_invoice_no || '-')}</td><td>${esc(m.customer_name || '-')}</td>
        <td>${esc(m.operational_status)}</td><td>${dmy(m.due_date)}</td>
      </tr>`).join('')}</tbody></table></div>`,
    footer: Object.assign(document.createElement('div'),
      { innerHTML: '<button class="btn btn-p" data-close>ปิด</button>' }),
    large: true,
  });
}
