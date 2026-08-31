/* Dispatcher ของ Toolbar — ต่อไปยัง charge-import.js / charge-export.js
   ทุกอย่างทำงานบน njacc_* เท่านั้น (ไม่แตะตาราง BILLING เดิม) */
import { chargeKpi, bulkSetField, bulkSetCase, bulkSetStatus, contactList, quickCloseLookup } from './charge-api.js';
import { runMainImport, runAplUpload, runUpload19, runContactUpload, pickFile, readSheet,
  parseCloseUploadGrid } from './charge-import.js';
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

/* ── NJ token filter (ยกจาก BILLING เดิม: processBulkCase / processBulkETD) ──
   split ด้วย whitespace / , / ;  แล้วเก็บเฉพาะ token ที่ขึ้นต้นด้วย NJ
   -> วันที่ (15/05/2026) และรหัสอื่น (AIR260507 / FZ…) ถูกข้ามอัตโนมัติ
   dedupe ด้วย uppercase แต่คงรูปแบบเดิมไว้ query */
export function njTokens(text) {
  const raw = String(text || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  const seen = new Set(); const out = [];
  raw.filter(t => /^NJ/i.test(t)).forEach(t => {
    const u = t.toUpperCase();
    if (!seen.has(u)) { seen.add(u); out.push(t); }
  });
  return { total: raw.length, nj: raw.filter(t => /^NJ/i.test(t)).length, keys: out };
}

/* เติม ETD: BILLING เดิมบังคับ customer_name = 'MAERSK LOGISTICS' ที่ระดับ query
   ระบบใหม่ส่งเป็น customer_gate ให้ njacc_bulk_set_field บังคับฝั่ง DB (RUN-49) */
export const ETD_CUSTOMER_GATE = 'MAERSK LOGISTICS';

/* กล่องรับเลขอ้างอิงหลายบรรทัด (+ ค่าที่จะเติม + วันที่เสริม) */
function keysDialog(title, { withValue, valueLabel, valueType = 'text', okLabel = 'ดำเนินการ', extraDate, hint } = {}) {
  return new Promise(res => {
    const b = document.createElement('div');
    b.innerHTML = `
      <p class="t-sm t-2 mb-1">${hint || 'วางเลขอ้างอิงบรรทัดละ 1 รายการ (รองรับ Job No / Invoice No / Source Invoice No / Customer Job No)'}</p>
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
      closeModal(); res({ keys, value, date, raw: b.querySelector('#tk-keys').value });
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
      case 'new-job': {
        /* Modal "เปิดงานใหม่" ใช้ร่วมกันทั้ง 4 หน้า (DOCUMENT/ACCOUNTING × SERVICE/ADVANCE)
           charge/group ส่งมาจาก route ของหน้านั้น ๆ */
        const { openNewJobModal } = await import('../jobs/job-form.js');
        await openNewJobModal({ charge: ctx.charge, group: ctx.group, mode: ctx.mode, onSaved: ctx.refresh });
        return;
      }

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
        const k = await chargeKpi({ charge: ctx.charge, group: ctx.group, queue: ctx.queue, scope: ctx.scope, filters: ctx.filters });
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
        /* หา header (Invoice No. / Customer Job No.) ก่อน · ไม่พบ → อ่านทุก cell
           ตาม bulkClose ของ BILLING เดิม — ห้ามอ่าน Column A อย่างเดียว */
        const p = parseCloseUploadGrid(grid);
        if (!p.keys.length) { toast('ไม่พบเลขอ้างอิงในไฟล์', 'err'); return; }
        if (!(await confirmModal('ตัดจบงานจากไฟล์',
          `${p.usedHeader
            ? `อ่านตามหัวตาราง (แถว ${p.headerRow + 1})` + (p.invCol >= 0 ? ' · Invoice No.' : '')
              + (p.jobCol >= 0 ? ' · Customer Job No.' : '')
            : 'ไม่พบหัวตาราง — อ่านทุกช่องในไฟล์'}<br>
           พบ ${p.keys.length} เลขอ้างอิงในไฟล์ ${esc(file.name)} — ตั้งสถานะ CLOSE?<br>
           <span class="t-xs t-3">งานที่จบแล้ว/ถูกยกเลิก จะถูกข้าม · เลขที่ตรงหลายงานจะไม่ถูกเดา</span>`))) return;
        const res = await once('close-upload', () => bulkSetStatus(ctx.charge, ctx.group, p.keys, 'CLOSE'));
        showBulkResult('ผลตัดจบงานจากไฟล์', res); ctx.refresh(); return;
      }
      case 'bulk-case': {
        const r = await keysDialog('Bulk Case', { withValue: true, valueLabel: 'Case',
          okLabel: 'อัปเดต Case', extraDate: 'ETA (ถ้าต้องการเติมด้วย)',
          hint: 'ดึงเฉพาะ token ที่ขึ้นต้นด้วย NJ · ข้ามวันที่และรหัสอื่น (AIR/FZ)' });
        if (!r) return;
        /* NJ-prefix filter ตาม BILLING เดิม — วางทั้งบรรทัดได้
           เช่น "NJ2605-03795 15/05/2026 AIR260507" -> เอาเฉพาะ NJ2605-03795 */
        const t = njTokens(r.raw);
        if (!t.keys.length) { toast('ไม่พบ Invoice No. ที่ขึ้นต้นด้วย NJ', 'err'); return; }
        if (!(await confirmModal('ยืนยัน Bulk Case',
          `Case: <b>${esc(r.value)}</b>${r.date ? ` · ETA: <b>${esc(r.date)}</b>` : ''}<br>
           Invoice (NJ) ที่ดึงได้ ${t.nj} รายการ (ไม่ซ้ำ ${t.keys.length})<br>
           <span class="t-xs t-3">อัปเดตเฉพาะ Case${r.date ? ' และ ETA' : ' · ETA เดิมไม่ถูกล้าง'}
           · ไม่แตะ status / ยอดเงิน / field อื่น</span>`))) return;
        /* case_no + eta ใน operation เดียว (njacc_bulk_set_case) ตาม flow เดิม */
        const res = await once('bulk-case', () =>
          bulkSetCase(ctx.charge, ctx.group, t.keys, r.value, r.date));
        showBulkResult('ผลอัปเดต Case', res);
        ctx.refresh(); return;
      }
      case 'fill-etd': {
        const r = await keysDialog('เติม ETD', { withValue: true, valueLabel: 'ETD',
          valueType: 'date', okLabel: 'เติม ETD',
          hint: `ดึงเฉพาะ token ที่ขึ้นต้นด้วย NJ · อัปเดตเฉพาะงานของ ${ETD_CUSTOMER_GATE}` });
        if (!r) return;
        const t = njTokens(r.raw);
        if (!t.keys.length) { toast('ไม่พบ Invoice No. ที่ขึ้นต้นด้วย NJ', 'err'); return; }
        if (!(await confirmModal('ยืนยันเติม ETD',
          `ETD: <b>${esc(r.value)}</b><br>
           Invoice (NJ) ที่ดึงได้ ${t.nj} รายการ (ไม่ซ้ำ ${t.keys.length})<br>
           <span class="t-xs t-3">อัปเดตเฉพาะลูกค้า <b>${esc(ETD_CUSTOMER_GATE)}</b> เท่านั้น
           · Invoice ของลูกค้าอื่นจะถูกข้าม · แก้เฉพาะ field etd</span>`))) return;
        /* customer_gate บังคับฝั่ง DB (RUN-49) — ไม่ใช่แค่กันที่ UI */
        const res = await once('fill-etd', () =>
          bulkSetField(ctx.charge, ctx.group, t.keys, 'etd', r.value, ETD_CUSTOMER_GATE));
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
