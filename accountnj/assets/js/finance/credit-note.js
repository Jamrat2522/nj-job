/* FINANCE > Credit Note — หน้าใบลดหนี้ (ของจริง)
   ─────────────────────────────────────────────────────────────────────
   เดิมไฟล์นี้เป็น PLACEHOLDER ล้วน (ไม่เรียก RPC ใด ๆ) เพราะ Backend ยังไม่มี
   ตรวจ Production เมื่อ 17/08/2026 แล้วยืนยันว่า:
       ไม่มีตาราง njacc_credit_notes / njacc_credit_note_items
       ไม่มี RPC njacc_*credit_note* แม้แต่ตัวเดียว
   Backend ทั้งชุดอยู่ใน sql/dev/RUN_3_CREDIT_NOTE.sql (ยังไม่รัน)

   *** หน้านี้ตรวจ Backend ก่อนเสมอ ***
   ถ้ายังไม่ได้รัน 029 → แสดงกล่อง "BACKEND REQUIRED" พร้อมชื่อไฟล์ SQL
   ไม่แสดงปุ่มหลอก · ไม่ mock ข้อมูล · ไม่ทำให้หน้าอื่นพัง

   ── สิ่งที่หน้านี้ "ไม่ทำ" ──
     ✗ ไม่แก้/ไม่เขียนทับ INVOICE ต้นฉบับ (อ่านอย่างเดียวผ่าน njacc_credit_note_source)
     ✗ ไม่ออกเลขเอกสารเอง — เลข CD{YYYYMM}-##### ออกที่ SQL ตอน POST เท่านั้น
     ✗ ไม่คำนวณ VAT เอง — ตัวเลขที่บันทึกจริงคำนวณที่ SQL จาก vat_rate ของบรรทัดต้นฉบับ
       (ตัวเลขที่เห็นบนฟอร์มคือ "ตัวอย่างระหว่างกรอก" เท่านั้น)
     ✗ ไม่บังคับเพดานลดหนี้ด้วย Frontend อย่างเดียว — SQL เป็นด่านจริง
       (ฝั่งจอเตือนให้เร็ว แต่ถ้าหลุดมา SQL จะโยน NJACC_CN_EXCEEDS_CREDITABLE)
     ✗ ไม่แตะ Permission — ใช้ can('invoice') / can('void') เดิม ตามที่ routes.js กำหนด */
import { cnList, cnInvoiceOptions, cnSource, cnSaveDraft, cnPost, cnView,
         cnDeleteDraft, cnVoid, isBackendMissing, cnErrMessage } from './credit-note-api.js';
import { openCreditNoteDoc } from './credit-note-doc.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { esc, money, dmy, ymd, round2 } from '../core/formatter.js';
import { can, isAdmin } from '../core/permissions.js';
import { renderPagination } from '../components/pagination.js';
import { confirmModal, reasonModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { newRequestId, once, nextToken, isCurrent, debounce } from '../core/request-manager.js';

const SQL_FILE = 'sql/RUN-NOW/ (ดู README_RUN-NOW.txt)';

/* state ของหน้า — คงอยู่ระหว่างสลับ view ในหน้าเดียวกัน */
const st = { q: '', customer: '', status: '', from: '', to: '', page: 1, size: 20 };
const pk = { q: '', page: 1, size: 10 };
let ed = null;              /* ข้อมูลใบที่กำลังแก้ */

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const pct = (v) => { const n = num(v); return (Number.isInteger(n) ? String(n) : String(round2(n))) + '%'; };

const ST_BDG = {
  DRAFT: ['bdg-due-ok', 'ร่าง'],
  POSTED: ['bdg-issued', 'POSTED'],
  VOID: ['bdg-void', 'VOID'],
};
const stBadge = (s) => {
  const [c, t] = ST_BDG[String(s || '').toUpperCase()] || ['bdg-due-ok', s || '-'];
  return `<span class="bdg ${c}">${esc(t)}</span>`;
};

/* Backend ยังไม่พร้อม — บอกตรง ๆ ว่าต้องรันไฟล์ไหน ไม่แสดงปุ่มที่กดแล้วพัง */
function backendPanel(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE — CREDIT NOTE / ใบลดหนี้</h2></div></div>
    <div class="card card-pad cnp-req">
      <h3 class="t-b">BACKEND REQUIRED — ยังใช้งานไม่ได้</h3>
      <p class="t-2 mt-1">ตรวจกับฐานข้อมูลจริงแล้ว ระบบยังไม่มีโครงสร้างของใบลดหนี้</p>
      <ul class="cnp-req-l">
        <li>ไม่มีตาราง <code>njacc_credit_notes</code> และ <code>njacc_credit_note_items</code></li>
        <li>ไม่มี RPC ของ Credit Note (สร้างร่าง / POST / ออกเลขที่ / ตรวจเพดานลดหนี้)</li>
        <li>ไม่มีเลขรันของใบลดหนี้ใน <code>njacc_document_sequences</code></li>
      </ul>
      <p class="t-sm t-3 mt-2">ให้รันไฟล์นี้บน Supabase ก่อน แล้วรีเฟรชหน้านี้อีกครั้ง:</p>
      <p class="cnp-req-f"><code>${esc(SQL_FILE)}</code></p>
      <p class="t-sm t-3 mt-2">จากนั้นรัน <code>SECTION 3</code> ในไฟล์เดียวกัน
        เพื่อยืนยันผล (อ่านอย่างเดียว ไม่แก้ข้อมูล)</p>
      <p class="t-sm t-3 mt-2">ระหว่างที่ยังไม่รัน หน้าอื่นทั้งหมดของระบบทำงานตามปกติ
        — ไฟล์ SQL นี้ไม่แตะ INVOICE / RECEIPT / JOB / สิทธิ์ผู้ใช้เดิม</p>
    </div>`;
}

export async function render(cnt) {
  ed = null;
  await masters();
  await renderList(cnt);
}

/* ══════════════════════════════════════════════════════════════════
   1 · หน้ารายการใบลดหนี้
   ══════════════════════════════════════════════════════════════════ */
async function renderList(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>FINANCE — CREDIT NOTE / ใบลดหนี้</h2></div>
      ${can('invoice') ? '<button class="btn btn-p" id="cn-new">+ สร้างใบลดหนี้</button>' : ''}</div>
    <div class="fbar">
      <input class="inp" data-f="q" value="${esc(st.q)}" placeholder="ค้นหา เลขที่ใบลดหนี้ / INVOICE / ลูกค้า">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <select class="sel" data-f="status">
        <option value="">— ทุกสถานะ —</option>
        <option value="DRAFT" ${st.status === 'DRAFT' ? 'selected' : ''}>ร่าง</option>
        <option value="POSTED" ${st.status === 'POSTED' ? 'selected' : ''}>POSTED</option>
        <option value="VOID" ${st.status === 'VOID' ? 'selected' : ''}>VOID</option>
      </select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="cn-go">ค้นหา</button>
    </div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เลขที่ใบลดหนี้</th><th>วันที่</th><th>ลูกค้า</th><th>INVOICE อ้างอิง</th>
      <th>เหตุผล</th><th class="r">ยอดลดหนี้</th><th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="cn-tbody">
      <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="cn-pgn"></div>`;

  const nb = cnt.querySelector('#cn-new');
  if (nb) nb.onclick = () => renderPick(cnt);
  cnt.querySelector('#cn-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => { st[el.dataset.f] = el.value; });
    st.page = 1; load();
  };
  cnt.querySelector('#cn-tbody').addEventListener('click', (e) => onRowAction(e, cnt, load));

  async function load() {
    const t = nextToken('cn-list');
    const tb = cnt.querySelector('#cn-tbody'); if (!tb) return;
    try {
      const res = await cnList({ q: st.q || null, customer_id: st.customer || null,
        status: st.status || null, from: st.from || null, to: st.to || null,
        page: st.page, size: st.size });
      if (!isCurrent('cn-list', t)) return;
      const rows = res.rows || [];
      tb.innerHTML = rows.length ? rows.map(r => {
        const s = String(r.status || '').toUpperCase();
        const no = String(r.credit_note_no || '');
        return `<tr>
        <td class="t-b">${/^CNDRAFT-/.test(no) ? '<span class="t-3">— ร่าง —</span>' : esc(no)}</td>
        <td>${dmy(r.credit_note_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name || '-')}</td>
        <td class="t-b">${esc(r.invoice_no || '-')}</td>
        <td class="ellip t-xs" style="max-width:180px">${esc(r.reason || '-')}</td>
        <td class="r t-b">${money(r.total_amount)}</td>
        <td>${stBadge(s)}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-doc="${r.id}">ดู / พิมพ์</button>
          ${s === 'DRAFT' && can('invoice')
            ? `<button class="btn btn-o btn-sm" data-edit="${r.invoice_id}" data-cn="${r.id}">แก้ไขร่าง</button>
               <button class="btn btn-p btn-sm" data-post="${r.id}">POST</button>
               <button class="btn btn-danger btn-sm" data-del="${r.id}">ลบร่าง</button>` : ''}
          ${s === 'POSTED' && (isAdmin() || can('void'))
            ? `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(no)}">Void</button>` : ''}
        </div></td></tr>`; }).join('')
        : '<tr><td colspan="8" class="empty">ยังไม่มีใบลดหนี้</td></tr>';
      renderPagination(cnt.querySelector('#cn-pgn'),
        { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) {
      if (!isCurrent('cn-list', t)) return;
      if (isBackendMissing(e)) { backendPanel(cnt); return; }
      tb.innerHTML = '<tr><td colspan="8" class="empty">โหลดรายการไม่สำเร็จ</td></tr>';
      toast(cnErrMessage(e), 'err');
    }
  }
  await load();
}

async function onRowAction(e, cnt, reload) {
  const doc = e.target.closest('[data-doc]');
  if (doc) {
    try { openCreditNoteDoc(await cnView(doc.dataset.doc)); }
    catch (ex) { toast(cnErrMessage(ex), 'err'); }
    return;
  }
  const eb = e.target.closest('[data-edit]');
  if (eb) { openEditor(cnt, eb.dataset.edit, eb.dataset.cn); return; }

  const pb = e.target.closest('[data-post]');
  if (pb) {
    if (!await confirmModal('POST ใบลดหนี้',
      'ระบบจะออกเลขที่ใบลดหนี้จริง (CD{ปีเดือน}-#####) และล็อกยอดไว้<br>' +
      'INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ', 'POST')) return;
    try {
      const r = await once('cn-post-' + pb.dataset.post,
        () => cnPost(pb.dataset.post, newRequestId()));
      if (r) toast('POST สำเร็จ — เลขที่ใบลดหนี้ ' + (r.credit_note_no || ''), 'ok');
      reload();
    } catch (ex) { toast(cnErrMessage(ex), 'err'); }
    return;
  }
  const db = e.target.closest('[data-del]');
  if (db) {
    const reason = await reasonModal('ลบร่างใบลดหนี้ (ลบได้เฉพาะร่างที่ยังไม่ POST)');
    if (!reason) return;
    try {
      await once('cn-del-' + db.dataset.del, () => cnDeleteDraft(db.dataset.del, reason));
      toast('ลบร่างแล้ว', 'ok'); reload();
    } catch (ex) { toast(cnErrMessage(ex), 'err'); }
    return;
  }
  const vb = e.target.closest('[data-void]');
  if (vb) {
    const reason = await reasonModal('Void ใบลดหนี้ ' + vb.dataset.no);
    if (!reason) return;
    try {
      await once('cn-void-' + vb.dataset.void,
        () => cnVoid(vb.dataset.void, reason, newRequestId()));
      toast('Void ใบลดหนี้แล้ว', 'ok'); reload();
    } catch (ex) { toast(cnErrMessage(ex), 'err'); }
  }
}

/* ══════════════════════════════════════════════════════════════════
   2 · เลือก INVOICE ที่จะลดหนี้
   server เป็นคนกรองว่าใบไหนออกใบลดหนี้ได้ (ISSUED / POSTED เท่านั้น)
   ══════════════════════════════════════════════════════════════════ */
async function renderPick(cnt) {
  pk.page = 1;
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>สร้างใบลดหนี้ — เลือก INVOICE</h2></div>
      <button class="btn btn-o" id="cn-back">← กลับรายการ</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">เลือกใบแจ้งหนี้ที่ต้องการลดหนี้ · แสดงเฉพาะใบที่ออกแล้วและยังลดได้
        · “ลดได้อีก” คำนวณจากยอดก่อน VAT หักด้วยใบลดหนี้ที่ POST แล้ว</p>
      <div class="fbar mt-2">
        <input class="inp" id="cn-pq" value="${esc(pk.q)}" placeholder="ค้นหา เลขที่ INVOICE / ชื่อลูกค้า">
        <button class="btn btn-o btn-sm" id="cn-pgo">ค้นหา</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>ลูกค้า</th><th>ประเภท</th>
        <th class="r">ยอดก่อน VAT</th><th class="r">ลดไปแล้ว</th><th class="r">ลดได้อีก</th>
        <th class="center">จัดการ</th>
      </tr></thead><tbody id="cn-ptb">
        <tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="cn-ppgn"></div>
    </div>`;

  cnt.querySelector('#cn-back').onclick = () => renderList(cnt);
  const q = cnt.querySelector('#cn-pq');
  cnt.querySelector('#cn-pgo').onclick = () => { pk.q = q.value.trim(); pk.page = 1; loadPick(); };
  q.addEventListener('input', () => debounce('cn-pick', () => {
    pk.q = q.value.trim(); pk.page = 1; loadPick();
  }, 350));
  cnt.querySelector('#cn-ptb').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) openEditor(cnt, b.dataset.pick, null);
  });

  async function loadPick() {
    const t = nextToken('cn-pick-load');
    const tb = cnt.querySelector('#cn-ptb'); if (!tb) return;
    try {
      const res = await cnInvoiceOptions({ q: pk.q || null, page: pk.page, size: pk.size });
      if (!isCurrent('cn-pick-load', t)) return;
      const rows = res.rows || [];
      tb.innerHTML = rows.length ? rows.map(r => {
        const rem = num(r.creditable_remaining);
        return `<tr>
        <td class="t-b">${esc(r.invoice_no || '-')}</td>
        <td>${dmy(r.invoice_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name || '-')}</td>
        <td>${esc(r.charge_type || '-')}</td>
        <td class="r">${money(r.subtotal)}</td>
        <td class="r">${money(r.credited)}</td>
        <td class="r t-b">${money(rem)}</td>
        <td><div class="ch-act">
          ${rem > 0
            ? `<button class="btn btn-p btn-sm" data-pick="${r.id}">เลือก</button>`
            : '<span class="t-3 t-xs">ลดครบแล้ว</span>'}
        </div></td></tr>`; }).join('')
        : '<tr><td colspan="8" class="empty">ไม่พบ INVOICE ที่ออกใบลดหนี้ได้</td></tr>';
      renderPagination(cnt.querySelector('#cn-ppgn'),
        { page: pk.page, size: pk.size, total: res.total || 0 },
        ({ page, size }) => { pk.page = page; pk.size = size; loadPick(); });
    } catch (e) {
      if (!isCurrent('cn-pick-load', t)) return;
      if (isBackendMissing(e)) { backendPanel(cnt); return; }
      tb.innerHTML = '<tr><td colspan="8" class="empty">โหลดรายการไม่สำเร็จ</td></tr>';
      toast(cnErrMessage(e), 'err');
    }
  }
  await loadPick();
}

/* ══════════════════════════════════════════════════════════════════
   3 · ฟอร์มร่างใบลดหนี้
   ══════════════════════════════════════════════════════════════════ */
async function openEditor(cnt, invoiceId, creditNoteId) {
  cnt.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';
  let src;
  try { src = await cnSource(invoiceId); }
  catch (e) {
    if (isBackendMissing(e)) { backendPanel(cnt); return; }
    toast(cnErrMessage(e), 'err');
    return renderList(cnt);
  }

  const inv = src.invoice || {};
  const c = src.customer || {};
  const job = src.job || {};
  const cnId = creditNoteId || src.existing_draft_id || null;

  /* เปิดร่างเดิมกลับมาแก้ → เติมค่าที่เคยกรอกไว้ (อ่านจาก server ไม่ใช่ localStorage) */
  let prev = null;
  if (cnId) { try { prev = await cnView(cnId); } catch (_) { prev = null; } }
  const prevBy = new Map();
  ((prev && prev.items) || []).forEach(it => {
    if (it.invoice_item_id) prevBy.set(it.invoice_item_id, it);
  });

  ed = {
    cnId,
    invoiceId: inv.id,
    date: (prev && prev.credit_note_date) || ymd(new Date()),
    reason: (prev && prev.reason) || '',
    lines: (src.items || []).map(it => {
      const p = prevBy.get(it.invoice_item_id);
      return {
        invoice_item_id: it.invoice_item_id,
        line_no: it.line_no,
        description: p ? p.description : it.description,
        origin: num(it.amount),
        credited: num(it.credited),
        remaining: num(it.remaining),
        vat_rate: num(it.vat_rate),
        on: !!p,
        amount: p ? num(p.amount) : num(it.remaining),
      };
    }),
  };

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${cnId ? 'แก้ไขร่างใบลดหนี้' : 'สร้างใบลดหนี้'} — INVOICE ${esc(inv.invoice_no || '')}</h2></div>
      <button class="btn btn-o" id="cn-back">← กลับรายการ</button></div>

    <div class="cnp-top">
      <div class="card card-pad">
        <h3 class="t-b">ลูกค้า</h3>
        <div class="cnp-kv"><label>ชื่อลูกค้า</label><span class="t-b">${esc(c.name || '-')}</span></div>
        <div class="cnp-kv"><label>เลขประจำตัวผู้เสียภาษี</label><span>${esc(c.tax_id || '-')}</span></div>
        <div class="cnp-kv"><label>สาขา</label><span>${esc(c.branch_code || '-')}</span></div>
        <div class="cnp-kv"><label>ที่อยู่</label><span>${esc(c.address || '-')}</span></div>
        <div class="cnp-kv"><label>โทร.</label><span>${esc(c.phone || '-')}</span></div>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">ใบแจ้งหนี้ต้นฉบับ</h3>
        <div class="cnp-kv"><label>เลขที่ INVOICE</label><span class="t-b">${esc(inv.invoice_no || '-')}</span></div>
        <div class="cnp-kv"><label>วันที่</label><span>${dmy(inv.invoice_date)}</span></div>
        <div class="cnp-kv"><label>สถานะ</label><span>${esc(inv.status || '-')}</span></div>
        <div class="cnp-kv"><label>เลขที่งาน</label><span>${esc(job.job_no || '-')}</span></div>
        <div class="cnp-kv"><label>ยอดสุทธิเดิม</label><span class="t-b">${money(inv.total_amount)}</span></div>
        <p class="t-xs t-3 mt-1">ใบแจ้งหนี้ต้นฉบับจะไม่ถูกแก้ไขจากการออกใบลดหนี้</p>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">รายละเอียดใบลดหนี้</h3>
        <div class="fld"><label>วันที่ออกใบลดหนี้</label>
          <input class="inp w100" type="date" id="cn-date" value="${esc(ed.date)}"></div>
        <div class="fld"><label>เหตุผลในการลดหนี้ <span class="req">*</span></label>
          <input class="inp w100" id="cn-reason" list="cn-reason-sug"
            value="${esc(ed.reason)}" placeholder="ระบุเหตุผล เช่น ปรับลดค่าบริการตามการตกลง">
          <datalist id="cn-reason-sug">
            <option value="ปรับลดค่าบริการ"></option>
            <option value="คิดค่าบริการเกิน"></option>
            <option value="แก้ไขรายการ"></option>
            <option value="ยกเลิกรายการบางส่วน"></option>
          </datalist>
          <p class="t-xs t-3">ข้อความนี้จะถูกพิมพ์ลงบนเอกสาร — ระบบไม่เติมข้อความตัวอย่างให้เอง</p>
        </div>
        <div class="cnp-kv"><label>เลขที่ใบลดหนี้</label>
          <span class="t-3">ออกให้อัตโนมัติตอน POST</span></div>
      </div>
    </div>

    <div class="card card-pad mt-2">
      <h3 class="t-b">รายการลดหนี้ — เลือกรายการจาก INVOICE ต้นฉบับ</h3>
      <p class="t-xs t-3">อัตรา VAT ยึดตามบรรทัดต้นฉบับ · ยอดที่กรอกต้องไม่เกิน “ลดได้อีก”
        · ตัวเลขบนหน้าจอเป็นตัวอย่าง ระบบจะคำนวณและตรวจซ้ำที่ฐานข้อมูลตอนบันทึก</p>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th class="center" style="width:48px">เลือก</th>
        <th>รายการ</th>
        <th class="r">ยอดเดิม</th>
        <th class="r">ลดไปแล้ว</th>
        <th class="r">ลดได้อีก</th>
        <th class="r" style="width:132px">ยอดลด (ก่อน VAT)</th>
        <th class="center">VAT</th>
        <th class="r">VAT</th>
        <th class="r">ยอดลดหนี้</th>
      </tr></thead><tbody id="cn-ltb"></tbody></table></div>

      <div class="cnp-foot mt-2">
        <div class="cnp-tot">
          <div><span>รวมก่อน VAT</span><b id="cn-t-sub">0.00</b></div>
          <div><span>รวม VAT</span><b id="cn-t-vat">0.00</b></div>
          <div class="cnp-tot-g"><span>รวมจำนวนเงินลดหนี้</span><b id="cn-t-tot">0.00</b></div>
        </div>
        <div class="cnp-btn">
          <button class="btn btn-o" id="cn-save">บันทึกร่าง</button>
          <button class="btn btn-o" id="cn-prev" ${cnId ? '' : 'disabled'}>ดูตัวอย่าง / พิมพ์</button>
          <button class="btn btn-p" id="cn-post" ${cnId ? '' : 'disabled'}>POST ออกเลขจริง</button>
        </div>
      </div>
      ${cnId ? '' : '<p class="t-xs t-3 mt-1">ดูตัวอย่างและ POST ได้หลังบันทึกร่างแล้ว (เอกสารพิมพ์จากข้อมูลจริงในฐานข้อมูลเท่านั้น)</p>'}
    </div>`;

  cnt.querySelector('#cn-back').onclick = () => renderList(cnt);
  cnt.querySelector('#cn-date').onchange = (e) => { ed.date = e.target.value; };
  cnt.querySelector('#cn-reason').oninput = (e) => { ed.reason = e.target.value; };

  const tb = cnt.querySelector('#cn-ltb');
  drawLines();

  tb.addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    if (e.target.dataset.k === 'on') { ed.lines[i].on = e.target.checked; drawLines(); }
  });
  tb.addEventListener('input', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    const k = e.target.dataset.k;
    if (k === 'amount') {
      ed.lines[i].amount = num(e.target.value);
      e.target.classList.toggle('cnp-bad', ed.lines[i].amount > ed.lines[i].remaining);
      refreshRow(i); refreshTotals();
    } else if (k === 'desc') {
      ed.lines[i].description = e.target.value;
    }
  });

  cnt.querySelector('#cn-save').onclick = (e) => doSave(cnt, e.target);
  cnt.querySelector('#cn-prev').onclick = async () => {
    if (!ed.cnId) return;
    try { openCreditNoteDoc(await cnView(ed.cnId)); }
    catch (ex) { toast(cnErrMessage(ex), 'err'); }
  };
  cnt.querySelector('#cn-post').onclick = async () => {
    if (!ed.cnId) return;
    if (!await confirmModal('POST ใบลดหนี้',
      'ระบบจะออกเลขที่ใบลดหนี้จริง (CD{ปีเดือน}-#####) และล็อกยอดไว้<br>' +
      'INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ', 'POST')) return;
    try {
      const r = await once('cn-post-' + ed.cnId, () => cnPost(ed.cnId, newRequestId()));
      if (r) toast('POST สำเร็จ — เลขที่ใบลดหนี้ ' + (r.credit_note_no || ''), 'ok');
      renderList(cnt);
    } catch (ex) { toast(cnErrMessage(ex), 'err'); }
  };

  /* วาดทั้งตาราง — ใช้ตอนเปิดหน้าและตอนติ๊ก/เอาติ๊กออกเท่านั้น
     (การพิมพ์ตัวเลขไม่ redraw ทั้งตาราง เพื่อไม่ให้ cursor เด้ง) */
  function drawLines() {
    tb.innerHTML = ed.lines.length ? ed.lines.map((l, i) => {
      const over = l.on && l.amount > l.remaining;
      const vat = round2(l.on ? l.amount * l.vat_rate / 100 : 0);
      return `<tr class="${l.on ? '' : 'cnp-off'}">
        <td class="center"><input type="checkbox" data-i="${i}" data-k="on" ${l.on ? 'checked' : ''}
          ${l.remaining > 0 ? '' : 'disabled'}></td>
        <td>${l.on
          ? `<input class="inp w100" data-i="${i}" data-k="desc" value="${esc(l.description || '')}">`
          : `<span class="ellip">${esc(l.description || '-')}</span>`}</td>
        <td class="r">${money(l.origin)}</td>
        <td class="r">${money(l.credited)}</td>
        <td class="r t-b">${money(l.remaining)}</td>
        <td class="r">${l.on
          ? `<input class="inp r${over ? ' cnp-bad' : ''}" type="number" step="0.01" min="0"
               max="${l.remaining}" data-i="${i}" data-k="amount" value="${l.amount}">`
          : '<span class="t-3">-</span>'}</td>
        <td class="center">${esc(pct(l.vat_rate))}</td>
        <td class="r" data-vat="${i}">${l.on ? money(vat) : '<span class="t-3">-</span>'}</td>
        <td class="r t-b" data-cr="${i}">${l.on ? money(round2(l.amount + vat)) : '<span class="t-3">-</span>'}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="9" class="empty">INVOICE ใบนี้ไม่มีรายการ</td></tr>';
    refreshTotals();
  }

  /* อัปเดตเฉพาะช่อง VAT / ยอดลดหนี้ ของแถวที่กำลังพิมพ์ */
  function refreshRow(i) {
    const l = ed.lines[i]; if (!l) return;
    const vat = round2(l.amount * l.vat_rate / 100);
    const cv = tb.querySelector(`[data-vat="${i}"]`);
    const cc = tb.querySelector(`[data-cr="${i}"]`);
    if (cv) cv.textContent = money(vat);
    if (cc) cc.textContent = money(round2(l.amount + vat));
  }

  function refreshTotals() {
    let sub = 0, vat = 0;
    for (const l of ed.lines) {
      if (!l.on) continue;
      sub = round2(sub + l.amount);
      vat = round2(vat + round2(l.amount * l.vat_rate / 100));
    }
    const a = cnt.querySelector('#cn-t-sub'); if (a) a.textContent = money(sub);
    const b = cnt.querySelector('#cn-t-vat'); if (b) b.textContent = money(vat);
    const d = cnt.querySelector('#cn-t-tot'); if (d) d.textContent = money(round2(sub + vat));
  }
}

/* บันทึกร่าง — ส่งเฉพาะ invoice_item_id / description / amount
   VAT และยอดรวมคำนวณที่ SQL ทั้งหมด (ไม่ส่งตัวเลขภาษีจากเบราว์เซอร์) */
async function doSave(cnt, btn) {
  if (!ed) return;
  const picked = ed.lines.filter(l => l.on);
  if (!ed.reason.trim()) { toast('กรุณาระบุเหตุผลในการลดหนี้', 'err'); return; }
  if (!picked.length) { toast('เลือกรายการที่ต้องการลดอย่างน้อย 1 รายการ', 'err'); return; }
  for (const l of picked) {
    if (!(l.amount > 0)) { toast('ยอดลดต้องมากกว่า 0 ทุกรายการที่เลือก', 'err'); return; }
    if (l.amount > l.remaining) {
      toast('ลดเกินยอดที่ลดได้ของรายการ "' + l.description + '" (สูงสุด ' + money(l.remaining) + ')', 'err');
      return;
    }
  }
  const payload = {
    credit_note_id: ed.cnId || null,
    invoice_id: ed.invoiceId,
    credit_note_date: ed.date || null,
    reason: ed.reason.trim(),
    items: picked.map(l => ({
      invoice_item_id: l.invoice_item_id,
      description: l.description,
      amount: round2(l.amount),
    })),
  };
  if (btn) btn.disabled = true;
  try {
    const r = await once('cn-save', () => cnSaveDraft(payload));
    if (r && r.id) {
      ed.cnId = r.id;
      const pv = cnt.querySelector('#cn-prev'); if (pv) pv.disabled = false;
      const po = cnt.querySelector('#cn-post'); if (po) po.disabled = false;
      toast('บันทึกร่างแล้ว — ยอดรวม ' + money(r.total_amount), 'ok');
    }
  } catch (ex) { toast(cnErrMessage(ex), 'err'); }
  finally { if (btn) btn.disabled = false; }
}
