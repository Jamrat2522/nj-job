/* REPORT > หัก ณ ที่จ่าย — ระบบออกหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
   ─────────────────────────────────────────────────────────────────────
   เดิมเป็น Modal เล็ก 6 ช่อง (ลูกค้า/วันที่/ประเภท/อ้างอิง/ฐานภาษี/อัตรา)
   บันทึกแล้วได้แค่แถวในตาราง ไม่มีเอกสารให้พิมพ์

   รอบนี้ขยายเป็น: กรอก -> บันทึกร่าง -> Preview -> ยืนยันรับเอกสาร -> Print/PDF

   ── สิ่งที่หน้านี้ "ไม่ทำ" ──
     ✗ ไม่แก้/ไม่เขียนทับ Invoice ต้นฉบับ (อ่านผ่าน njacc_wht_invoice_options เท่านั้น)
     ✗ ไม่ออกเลขหนังสือรับรองแทนผู้หัก — certificate_no ผู้ใช้กรอกเองล้วน
       เลข WHT{YY}-#### ที่ SQL ออกให้คือ "เลขอ้างอิงภายใน" ของ N.J. เท่านั้น
     ✗ ไม่คำนวณภาษีเป็นตัวเลขจริงเอง — SQL คำนวณ amount = base × rate/100 ซ้ำเสมอ
       (ตัวเลขบนฟอร์มคือ "ตัวอย่างระหว่างกรอก")
     ✗ ไม่ hardcode 3% — อัตรามาจาก Invoice ที่เลือก หรือผู้ใช้กรอกเอง
       ไม่ส่ง rate มา SQL จะโยน NJACC_WHT_RATE_REQUIRED (ไม่เดาให้เป็น 3%)
     ✗ ไม่แตะ Permission — ใช้ can('issue_receipt') / can('void') / isAdmin() เดิม

   ── ทิศทางภาษี — RECEIVED WHT ──
     N.J. ออก Invoice ขายบริการ -> Customer จ่ายเงินและเป็นผู้หักภาษี
     -> Customer ออกหนังสือรับรอง 50 ทวิ ให้ N.J.
        ก. ผู้มีหน้าที่หักภาษี = Customer (เลือกในฟอร์ม)
        ข. ผู้ถูกหักภาษี      = N.J. (Config กลาง · ไม่ต้องเลือก)
     เลขหนังสือรับรองเป็นเลขที่ "ผู้หัก" ออก -> ผู้ใช้กรอกเอง ระบบไม่สร้างให้

   Backend: sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql (ยังไม่ได้รัน)
            ยังไม่รัน -> หน้านี้แสดงกล่อง BACKEND REQUIRED ไม่แสดงปุ่มหลอก */
import { listWht, voidWht, whtInvoiceOptions, saveWhtDraft, postWht, whtView,
         deleteWhtDraft, isWhtBackendMissing, whtErrMessage } from './withholding-api.js';
import { openWhtDoc } from './wht-doc.js';
import { masters, customerOpts, activeCustomers } from '../master/master-cache.js';
import { esc, money, dmy, round2, ymd } from '../core/formatter.js';
import { ISSUER } from '../config/company-doc.js';
import { can, isAdmin } from '../core/permissions.js';
import { renderPagination } from '../components/pagination.js';
import { confirmModal, reasonModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once, nextToken, isCurrent, debounce } from '../core/request-manager.js';

const SQL_FILE = 'sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql';

const st = { customer: '', from: '', to: '', page: 1, size: 20 };
const pk = { q: '', page: 1, size: 10 };
let ed = null;   /* เอกสารที่กำลังแก้ */

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const pct = (v) => { const n = num(v); return (Number.isInteger(n) ? String(n) : String(round2(n))) + '%'; };

/* ประเภทเงินได้ — ค่าที่ระบบเก็บจริงใน wht_type / income_type (ของเดิม 4 ค่า) */
const INCOME_TYPES = [
  ['SERVICE', 'ค่าบริการ / ค่าจ้างทำของ'],
  ['TRANSPORT', 'ค่าขนส่ง'],
  ['RENT', 'ค่าเช่า'],
  ['OTHER', 'อื่น ๆ'],
];
const incomeOpts = (sel) => INCOME_TYPES.map(([v, l]) =>
  `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');

/* สถานะ — ใช้ของเดิมของระบบ ไม่สร้างสถานะใหม่
   DRAFT = ร่าง · ISSUED = ออกจริงแล้ว · VOID = ยกเลิก */
const ST_BDG = {
  DRAFT: ['bdg-due-ok', 'ร่าง'],
  ISSUED: ['bdg-issued', 'บันทึกแล้ว'],
  VOID: ['bdg-void', 'VOID'],
};
const stBadge = (s) => {
  const [c, t] = ST_BDG[String(s || '').toUpperCase()] || ['bdg-due-ok', s || '-'];
  return `<span class="bdg ${c}">${esc(t)}</span>`;
};

function backendPanel(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>หัก ณ ที่จ่าย — ทะเบียนหนังสือรับรอง 50 ทวิ ที่ได้รับ</h2></div></div>
    <div class="card card-pad whp-req">
      <h3 class="t-b">BACKEND REQUIRED — ยังใช้งานไม่ได้</h3>
      <p class="t-2 mt-1">ตรวจกับฐานข้อมูลจริงแล้ว ระบบยังไม่มีโครงสร้างของหนังสือรับรอง 50 ทวิ</p>
      <ul class="whp-req-l">
        <li>ไม่มีตาราง <code>njacc_wht_items</code> — เก็บได้ 1 รายการต่อ 1 ใบเท่านั้น</li>
        <li>สถานะยังไม่รองรับ <code>DRAFT</code> — บันทึกร่างแล้วกลับมาแก้ไม่ได้</li>
        <li><code>njacc_list_wht</code> ยังไม่คืน เลขผู้เสียภาษี / สาขา / ที่อยู่ ของผู้หักภาษี</li>
        <li>ไม่มี RPC สำหรับเลือก INVOICE มาอ้างอิงพร้อมอัตรา WHT และวันที่จ่ายเงินจริง</li>
        <li>ไม่มีคอลัมน์ <code>certificate_no</code> — แยกเลขหนังสือรับรองของผู้หัก
            ออกจากเลขอ้างอิงภายในไม่ได้</li>
        <li><code>njacc_create_wht</code> เดิมยังเปิดให้ยิงตรงและมี Default 3%</li>
      </ul>
      <p class="t-sm t-3 mt-2">ให้รันไฟล์นี้บน Supabase ก่อน แล้วรีเฟรชหน้านี้อีกครั้ง:</p>
      <p class="whp-req-f"><code>${esc(SQL_FILE)}</code></p>
      <p class="t-sm t-3 mt-2">ระหว่างที่ยังไม่รัน หน้าอื่นทั้งหมดของระบบทำงานตามปกติ
        — ไฟล์ SQL นี้ไม่แตะ INVOICE / RECEIPT / CREDIT NOTE / สิทธิ์ผู้ใช้เดิม</p>
    </div>`;
}

export async function render(cnt) {
  ed = null;
  await masters();
  await renderList(cnt);
}

/* ══════════════════════════════════════════════════════════════════
   1 · หน้ารายการ
   ══════════════════════════════════════════════════════════════════ */
async function renderList(cnt) {
  const mayIssue = isAdmin() || can('issue_receipt');
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>หัก ณ ที่จ่าย — ทะเบียนหนังสือรับรอง 50 ทวิ ที่ได้รับ</h2></div>
      ${mayIssue ? '<button class="btn btn-p" id="wh-new">+ บันทึกหนังสือรับรองที่ได้รับ</button>' : ''}</div>
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="wh-go">ค้นหา</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เลขหนังสือรับรอง</th><th>วันที่</th><th>ผู้หักภาษี (ลูกค้า)</th><th>อ้างอิง INVOICE</th>
      <th class="r">ฐานภาษี</th><th class="center">อัตรา</th><th class="r">ยอดหัก</th>
      <th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="wh-tbody">
      <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="wh-pgn"></div>`;

  const nb = cnt.querySelector('#wh-new');
  if (nb) nb.onclick = () => renderPick(cnt);
  cnt.querySelector('#wh-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => { st[el.dataset.f] = el.value; });
    st.page = 1; load();
  };
  cnt.querySelector('#wh-tbody').addEventListener('click', (e) => onRowAction(e, cnt, load));

  async function load() {
    const t = nextToken('wht');
    const tb = cnt.querySelector('#wh-tbody'); if (!tb) return;
    try {
      const res = await listWht({ p_customer: st.customer || null, p_from: st.from || null,
        p_to: st.to || null, p_page: st.page, p_size: st.size });
      if (!isCurrent('wht', t)) return;
      const rows = res.rows || [];
      /* RPC รุ่นเก่ายังไม่คืน item_count -> แปลว่ายังไม่ได้รัน 06_RUN-05 */
      if (rows.length && rows[0].item_count === undefined) { backendPanel(cnt); return; }
      tb.innerHTML = rows.length ? rows.map(r => {
        const s = String(r.status || '').toUpperCase();
        const no = String(r.document_no || '');
        const isDraft = s === 'DRAFT' || /^WHTDRAFT-/.test(no);
        const cert = String(r.certificate_no || '').trim();
        return `<tr>
        <td class="t-b">${cert ? esc(cert)
          : (isDraft ? '<span class="t-3">— ร่าง —</span>'
                     : '<span class="t-3">ยังไม่ได้รับเลข</span>')}
          ${!isDraft && no ? `<div class="t-xs t-3">ภายใน: ${esc(no)}</div>` : ''}</td>
        <td>${dmy(r.document_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name || '-')}</td>
        <td class="t-b">${esc(r.invoice_no || r.reference_no || '-')}</td>
        <td class="r">${money(r.tax_base)}</td>
        <td class="center"><span class="wht-rate-chip">${esc(pct(r.rate))}</span></td>
        <td class="r t-b">${money(r.amount)}</td>
        <td>${stBadge(s)}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-doc="${r.id}">ดู / พิมพ์</button>
          ${isDraft && (isAdmin() || can('issue_receipt'))
            ? `<button class="btn btn-o btn-sm" data-edit="${r.id}">แก้ไขร่าง</button>
               <button class="btn btn-p btn-sm" data-post="${r.id}">ยืนยันรับเอกสาร</button>
               <button class="btn btn-danger btn-sm" data-del="${r.id}">ลบร่าง</button>` : ''}
          ${s === 'ISSUED' && (isAdmin() || can('void'))
            ? `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(no)}">Void</button>` : ''}
        </div></td></tr>`; }).join('')
        : '<tr><td colspan="9" class="empty">ยังไม่มีหนังสือรับรองหัก ณ ที่จ่าย</td></tr>';
      renderPagination(cnt.querySelector('#wh-pgn'),
        { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) {
      if (!isCurrent('wht', t)) return;
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      tb.innerHTML = '<tr><td colspan="9" class="empty">โหลดรายการไม่สำเร็จ</td></tr>';
      handleErr(e);
    }
  }
  await load();
}

async function onRowAction(e, cnt, reload) {
  const doc = e.target.closest('[data-doc]');
  if (doc) {
    try { openWhtDoc(await whtView(doc.dataset.doc)); }
    catch (ex) { isWhtBackendMissing(ex) ? backendPanel(cnt) : toast(whtErrMessage(ex), 'err'); }
    return;
  }
  const eb = e.target.closest('[data-edit]');
  if (eb) { openEditor(cnt, { whtId: eb.dataset.edit }); return; }

  const pb = e.target.closest('[data-post]');
  if (pb) {
    if (!await confirmModal('ยืนยันบันทึกหนังสือรับรองที่ได้รับ',
      'ระบบจะออกเลขอ้างอิงภายในและล็อกยอดไว้<br>' +
      'ต้นฉบับออกโดยลูกค้าผู้หักภาษี — N.J. เป็นผู้บันทึกเท่านั้น<br>' +
      'INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ', 'ยืนยันรับเอกสาร')) return;
    try {
      const r = await once('post-wht-' + pb.dataset.post, () => postWht(pb.dataset.post, newRequestId()));
      if (r) toast('บันทึกเอกสารที่ได้รับแล้ว — เลขอ้างอิงภายใน ' + (r.document_no || ''), 'ok');
      reload();
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }
  const db = e.target.closest('[data-del]');
  if (db) {
    const reason = await reasonModal('ลบร่างหนังสือรับรอง (ลบได้เฉพาะร่างที่ยังไม่ออกจริง)');
    if (!reason) return;
    try {
      await once('del-wht-' + db.dataset.del, () => deleteWhtDraft(db.dataset.del, reason));
      toast('ลบร่างแล้ว', 'ok'); reload();
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }
  const vb = e.target.closest('[data-void]');
  if (vb) {
    const reason = await reasonModal('Void หนังสือรับรอง ' + vb.dataset.no);
    if (!reason) return;
    try {
      await once('void-wht-' + vb.dataset.void, () => voidWht(vb.dataset.void, reason, newRequestId()));
      toast('Void เอกสารแล้ว', 'ok'); reload();
    } catch (ex) { handleErr(ex); }
  }
}

/* ══════════════════════════════════════════════════════════════════
   2 · เลือก INVOICE ต้นทาง (ข้ามได้ถ้าออกเอกสารโดยไม่อ้าง Invoice)
   ══════════════════════════════════════════════════════════════════ */
async function renderPick(cnt) {
  pk.page = 1;
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>บันทึกหนังสือรับรองหัก ณ ที่จ่าย — เลือก INVOICE ต้นทาง</h2></div>
      <button class="btn btn-o" id="wh-back">← กลับรายการ</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">เลือกใบแจ้งหนี้เพื่อดึงผู้หักภาษี / ลูกค้าผู้จ่ายเงิน · รายการ · อัตรา WHT จริง
        · หรือกด “ข้าม” เพื่อกรอกเองทั้งหมด</p>
      <div class="fbar mt-2">
        <input class="inp" id="wh-pq" value="${esc(pk.q)}" placeholder="ค้นหา เลขที่ INVOICE / ชื่อลูกค้า">
        <button class="btn btn-o btn-sm" id="wh-pgo">ค้นหา</button>
        <button class="btn btn-o btn-sm" id="wh-skip">ข้าม — กรอกเองทั้งหมด</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>ลูกค้า</th><th>ประเภท</th>
        <th class="r">ยอดสุทธิ</th><th>อัตรา WHT</th><th class="r">WHT</th>
        <th>วันที่จ่ายจริง</th><th class="center">จัดการ</th>
      </tr></thead><tbody id="wh-ptb">
        <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="wh-ppgn"></div>
    </div>`;

  cnt.querySelector('#wh-back').onclick = () => renderList(cnt);
  cnt.querySelector('#wh-skip').onclick = () => openEditor(cnt, {});
  const q = cnt.querySelector('#wh-pq');
  cnt.querySelector('#wh-pgo').onclick = () => { pk.q = q.value.trim(); pk.page = 1; loadPick(); };
  q.addEventListener('input', () => debounce('wh-pick', () => {
    pk.q = q.value.trim(); pk.page = 1; loadPick();
  }, 350));
  cnt.querySelector('#wh-ptb').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) openEditor(cnt, { invoice: JSON.parse(b.dataset.pick) });
  });

  async function loadPick() {
    const t = nextToken('wh-pick');
    const tb = cnt.querySelector('#wh-ptb'); if (!tb) return;
    try {
      const res = await whtInvoiceOptions({ q: pk.q || null, page: pk.page, size: pk.size });
      if (!isCurrent('wh-pick', t)) return;
      const rows = res.rows || [];
      tb.innerHTML = rows.length ? rows.map(r => {
        const bd = r.wht_breakdown || [];
        const rateTxt = bd.length ? bd.map(b => pct(b.rate)).join(' + ') : '-';
        return `<tr>
        <td class="t-b">${esc(r.invoice_no || '-')}</td>
        <td>${dmy(r.invoice_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name || '-')}</td>
        <td>${esc(r.charge_type || '-')}</td>
        <td class="r">${money(r.total_amount)}</td>
        <td class="center">${esc(rateTxt)}</td>
        <td>${r.payment_date ? dmy(r.payment_date)
          : ((r.payments || []).length > 1
             ? '<span class="t-3">' + (r.payments || []).length + ' ครั้ง — เลือกเอง</span>'
             : '<span class="t-3">ยังไม่รับชำระ</span>')}</td>
        <td><div class="ch-act">
          <button class="btn btn-p btn-sm" data-pick='${JSON.stringify(r).replace(/'/g, "&#39;")}'>เลือก</button>
        </div></td></tr>`; }).join('')
        : '<tr><td colspan="9" class="empty">ไม่พบ INVOICE — กด “ข้าม” เพื่อกรอกเองได้</td></tr>';
      renderPagination(cnt.querySelector('#wh-ppgn'),
        { page: pk.page, size: pk.size, total: res.total || 0 },
        ({ page, size }) => { pk.page = page; pk.size = size; loadPick(); });
    } catch (e) {
      if (!isCurrent('wh-pick', t)) return;
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      tb.innerHTML = '<tr><td colspan="9" class="empty">โหลดรายการไม่สำเร็จ</td></tr>';
      toast(whtErrMessage(e), 'err');
    }
  }
  await loadPick();
}

/* ══════════════════════════════════════════════════════════════════
   3 · ฟอร์มหนังสือรับรอง
   ══════════════════════════════════════════════════════════════════ */
async function openEditor(cnt, { whtId = null, invoice = null } = {}) {
  cnt.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';

  let prev = null;
  if (whtId) {
    try { prev = await whtView(whtId); }
    catch (e) {
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      toast(whtErrMessage(e), 'err'); return renderList(cnt);
    }
  }

  const today = ymd(new Date());
  ed = {
    whtId: whtId || null,
    customer_id: prev ? prev.customer_id : (invoice ? invoice.customer_id : ''),
    invoice_id: prev ? (prev.invoice_id || null) : (invoice ? invoice.id : null),
    invoice_no: prev ? (prev.invoice && prev.invoice.invoice_no) : (invoice ? invoice.invoice_no : null),
    document_date: prev ? prev.document_date : today,
    /* *** วันที่จ่ายเงินจริง ห้ามใช้ invoice_date แทน (คนละความหมาย) ***
       มี Payment เดียว -> เติมจาก njacc_payments.payment_date จริง
       ไม่มี Payment หรือมีหลายรายการ -> เว้นว่าง ให้ผู้ใช้ระบุเอง
       (มีหลายรายการ SQL จะคืน payment_date = null เพราะไม่เดาว่าจะเอาวันไหน) */
    pay_date: prev ? (prev.pay_date || '') : (invoice ? (invoice.payment_date || '') : ''),
    payments: invoice ? (invoice.payments || []) : [],
    certificate_no: prev ? (prev.certificate_no || '') : '',
    reference_no: prev ? (prev.reference_no || '') : (invoice ? (invoice.invoice_no || '') : ''),
    note: prev ? (prev.note || '') : '',
    lines: [],
  };

  if (prev && (prev.items || []).length) {
    ed.lines = prev.items.map(it => ({
      pay_date: it.pay_date || ed.pay_date,
      income_type: String(it.income_type || 'SERVICE').toUpperCase(),
      description: it.description || '',
      tax_base: num(it.tax_base),
      rate: num(it.rate),
    }));
  } else if (invoice) {
    /* Auto Fill จาก Invoice — อัตราและฐานมาจาก njacc_invoice_items จริง ไม่ hardcode */
    const bd = invoice.wht_breakdown || [];
    const autoPay = invoice.payment_date || '';   /* ว่างได้ — ห้าม fallback เป็น invoice_date */
    ed.lines = bd.length ? bd.map(b => ({
      pay_date: autoPay,
      income_type: String(invoice.charge_type || '').toUpperCase() === 'ADVANCE' ? 'OTHER' : 'SERVICE',
      description: b.description || invoice.description || '',
      tax_base: num(b.tax_base),
      rate: num(b.rate),
    })) : [{ pay_date: autoPay, income_type: 'SERVICE',
             description: invoice.description || '', tax_base: num(invoice.subtotal), rate: 0 }];
  }
  if (!ed.lines.length) {
    ed.lines = [{ pay_date: '', income_type: 'SERVICE', description: '', tax_base: 0, rate: 0 }];
  }

  const cust = activeCustomers().find(c => c.id === ed.customer_id) || null;

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${ed.whtId ? 'แก้ไขร่าง' : 'บันทึก'}หนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ</h2></div>
      <button class="btn btn-o" id="wh-back">← กลับรายการ</button></div>

    <div class="whp-top">
      <div class="card card-pad">
        <h3 class="t-b">ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</h3>
        <p class="t-xs t-3">ลูกค้าผู้จ่ายเงินเป็นผู้หักภาษีและออกหนังสือรับรองให้ N.J.</p>
        <div class="fld"><label>ลูกค้า / ผู้จ่ายเงิน <span class="req">*</span></label>
          <select class="sel w100" id="wh-cust">${customerOpts(ed.customer_id)}</select></div>
        <div id="wh-payee" class="whp-payee"></div>
        <div class="whp-nj">
          <div class="whp-nj-t">ข. ผู้ถูกหักภาษี ณ ที่จ่าย</div>
          <div class="whp-nj-v">${esc(ISSUER.nameEn)}</div>
          <div class="whp-nj-s">เลขประจำตัวผู้เสียภาษี ${esc(ISSUER.taxId)} · สำนักงานใหญ่</div>
          <div class="whp-nj-s">${esc(ISSUER.address)}</div>
          <p class="t-xs t-3">ดึงจาก Company Config กลาง — ไม่ต้องเลือกและแก้ไม่ได้</p>
        </div>
      </div>
      <div class="card card-pad">
        <h3 class="t-b">ข้อมูลเอกสาร</h3>
        <div class="fld"><label>หนังสือรับรองเลขที่ (ผู้หักเป็นผู้ออก)</label>
          <input class="inp w100" id="wh-cert" value="${esc(ed.certificate_no)}"
            placeholder="กรอกตามเอกสารตัวจริงที่ได้รับจากลูกค้า">
          <p class="t-xs t-3">ระบบไม่สร้างเลขนี้ให้ เพราะเป็นเลขที่ผู้หักภาษีเป็นผู้ออก
            · ยังไม่ได้รับเอกสารตัวจริงให้เว้นว่างได้</p></div>
        <div class="whp-kv"><label>เลขอ้างอิงภายใน</label>
          <span class="t-3">${ed.whtId && prev && !/^WHTDRAFT-/.test(String(prev.document_no || ''))
            ? esc(prev.document_no) : 'ออกให้อัตโนมัติตอนบันทึกเอกสารจริง'}</span></div>
        <div class="fld"><label>วันที่ออกเอกสาร <span class="req">*</span></label>
          <input class="inp w100" type="date" id="wh-ddate" value="${esc(ed.document_date)}"></div>
        <div class="fld"><label>วันที่จ่ายเงินจริง <span class="req">*</span></label>
          <input class="inp w100" type="date" id="wh-pdate" value="${esc(ed.pay_date || '')}">
          ${ed.payments && ed.payments.length > 1
            ? `<p class="t-xs whp-warn">ใบแจ้งหนี้นี้มีการรับชำระ ${ed.payments.length} ครั้ง —
                ระบบไม่เลือกให้ กรุณาระบุวันที่ตรงกับหนังสือรับรองที่ได้รับ:
                ${ed.payments.map(x => esc(dmy(x.payment_date)) + ' (' + esc(x.payment_no || '-') + ')').join(' · ')}</p>`
            : (ed.payments && ed.payments.length === 1
              ? `<p class="t-xs t-3">เติมจากการรับชำระจริง ${esc(ed.payments[0].payment_no || '')}
                  ${esc(dmy(ed.payments[0].payment_date))}</p>`
              : '<p class="t-xs t-3">ใบแจ้งหนี้นี้ยังไม่มีการรับชำระในระบบ — ต้องระบุวันที่จ่ายเงินจริงตามเอกสารที่ได้รับ</p>')}
          <p class="t-xs t-3">คนละข้อมูลกับวันที่ใบแจ้งหนี้ · ต้องมีค่าก่อนยืนยันบันทึกจริง</p></div>
        <div class="fld"><label>เลขอ้างอิง / INVOICE</label>
          <input class="inp w100" id="wh-ref" value="${esc(ed.reference_no)}"
            placeholder="เช่น NJ202608-00001">
          ${ed.invoice_no ? `<p class="t-xs t-3">ผูกกับ INVOICE จริงแล้ว: <b>${esc(ed.invoice_no)}</b>
            (เก็บด้วย invoice_id ไม่ใช่ข้อความ)</p>` : ''}</div>
        <div class="fld"><label>หมายเหตุ</label>
          <input class="inp w100" id="wh-note" value="${esc(ed.note)}"></div>
      </div>
    </div>

    <div class="card card-pad mt-2">
      <div class="whp-ihead">
        <h3 class="t-b">รายการเงินได้ที่จ่ายและภาษีที่หัก</h3>
        <button class="btn btn-o btn-sm" id="wh-add">+ เพิ่มรายการ</button>
      </div>
      <p class="t-xs t-3">อัตราภาษีมาจากข้อมูลจริง (ถ้าเลือก INVOICE จะเติมให้จาก njacc_invoice_items)
        · ตัวเลขบนหน้าจอเป็นตัวอย่าง ระบบคำนวณและตรวจซ้ำที่ฐานข้อมูลตอนบันทึก</p>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th style="width:132px">วันที่จ่ายจริง <span class="req">*</span></th>
        <th style="width:170px">ประเภทเงินได้</th>
        <th>รายละเอียด</th>
        <th class="r" style="width:130px">จำนวนเงินที่จ่าย</th>
        <th class="r" style="width:96px">อัตรา %</th>
        <th class="r" style="width:120px">ภาษีที่หัก</th>
        <th class="center" style="width:56px">ลบ</th>
      </tr></thead><tbody id="wh-ltb"></tbody></table></div>

      <div class="whp-foot mt-2">
        <div class="whp-tot">
          <div><span>รวมจำนวนเงินที่จ่าย</span><b id="wh-t-base">0.00</b></div>
          <div class="whp-tot-g"><span>รวมภาษีที่หัก ณ ที่จ่าย</span><b id="wh-t-tax">0.00</b></div>
        </div>
        <div class="whp-btn">
          <button class="btn btn-o" id="wh-save">บันทึกร่าง</button>
          <button class="btn btn-o" id="wh-prev" ${ed.whtId ? '' : 'disabled'}>Preview / ดูหนังสือรับรอง</button>
          <button class="btn btn-p" id="wh-post" ${ed.whtId ? '' : 'disabled'}>ยืนยันรับเอกสาร</button>
        </div>
      </div>
      ${ed.whtId ? '' : '<p class="t-xs t-3 mt-1">Preview และยืนยันรับเอกสารทำได้หลังบันทึกร่างแล้ว (พิมพ์จากข้อมูลจริงในฐานข้อมูลเท่านั้น)</p>'}
    </div>`;

  const tb = cnt.querySelector('#wh-ltb');
  cnt.querySelector('#wh-back').onclick = () => renderList(cnt);
  cnt.querySelector('#wh-ddate').onchange = (e) => { ed.document_date = e.target.value; };
  cnt.querySelector('#wh-pdate').onchange = (e) => { ed.pay_date = e.target.value; };
  cnt.querySelector('#wh-cert').oninput = (e) => { ed.certificate_no = e.target.value; };
  cnt.querySelector('#wh-ref').oninput = (e) => { ed.reference_no = e.target.value; };
  cnt.querySelector('#wh-note').oninput = (e) => { ed.note = e.target.value; };
  cnt.querySelector('#wh-cust').onchange = (e) => {
    ed.customer_id = e.target.value;
    /* เปลี่ยนผู้หักภาษีแล้ว Invoice เดิมอาจไม่ใช่ของรายนี้ -> ตัดความผูกพันทิ้ง
       (SQL ก็กันซ้ำด้วย NJACC_WHT_INVOICE_MISMATCH) */
    if (ed.invoice_id) { ed.invoice_id = null; ed.invoice_no = null; }
    drawPayee();
  };
  cnt.querySelector('#wh-add').onclick = () => {
    ed.lines.push({ pay_date: ed.pay_date || '',
      income_type: 'SERVICE', description: '', tax_base: 0, rate: 0 });
    drawLines();
  };

  tb.addEventListener('input', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    const k = e.target.dataset.k;
    if (k === 'tax_base' || k === 'rate') { ed.lines[i][k] = num(e.target.value); refreshRow(i); refreshTotals(); }
    else if (k === 'description') ed.lines[i].description = e.target.value;
  });
  tb.addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    const k = e.target.dataset.k;
    if (k === 'pay_date' || k === 'income_type') ed.lines[i][k] = e.target.value;
  });
  tb.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-line]');
    if (!b) return;
    if (ed.lines.length <= 1) { toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return; }
    ed.lines.splice(Number(b.dataset.delLine), 1); drawLines();
  });

  cnt.querySelector('#wh-save').onclick = (e) => doSave(cnt, e.target);
  cnt.querySelector('#wh-prev').onclick = async () => {
    if (!ed.whtId) return;
    try { openWhtDoc(await whtView(ed.whtId)); }
    catch (ex) { toast(whtErrMessage(ex), 'err'); }
  };
  cnt.querySelector('#wh-post').onclick = async () => {
    if (!ed.whtId) return;
    /* วันที่จ่ายเงินจริงต้องครบ — SQL บังคับซ้ำอีกชั้นด้วย NJACC_WHT_PAY_DATE_REQUIRED */
    if (!ed.pay_date) { toast('ต้องระบุวันที่จ่ายเงินจริงก่อนยืนยันบันทึก', 'err'); return; }
    if (ed.lines.some(l => !l.pay_date)) {
      toast('ทุกรายการต้องมีวันที่จ่ายเงินจริง', 'err'); return; }
    if (!await confirmModal('ยืนยันบันทึกหนังสือรับรองที่ได้รับ',
      'ระบบจะออกเลขอ้างอิงภายในและล็อกยอดไว้<br>' +
      'ต้นฉบับหนังสือรับรองออกโดยลูกค้าผู้หักภาษี — N.J. เป็นผู้บันทึกเท่านั้น<br>' +
      'INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ', 'ยืนยันรับเอกสาร')) return;
    try {
      const r = await once('post-wht-' + ed.whtId, () => postWht(ed.whtId, newRequestId()));
      if (r) toast('บันทึกเอกสารที่ได้รับแล้ว — เลขอ้างอิงภายใน ' + (r.document_no || ''), 'ok');
      renderList(cnt);
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
  };

  drawPayee();
  drawLines();

  /* ข้อมูลผู้หักภาษี (ลูกค้า) ที่ Auto Fill จาก Customer Master — Tax ID + สาขา บรรทัดเดียวกัน */
  function drawPayee() {
    const c = activeCustomers().find(x => x.id === ed.customer_id) || null;
    const el = cnt.querySelector('#wh-payee');
    if (!el) return;
    el.innerHTML = c ? `
      <div class="whp-kv whp-kv-2">
        <div><label>เลขประจำตัวผู้เสียภาษี</label><span class="t-b">${esc(c.tax_id || '-')}</span></div>
        <div><label>สาขา</label><span>${esc(c.branch_code || '-')}</span></div>
      </div>
      <div class="whp-kv"><label>ที่อยู่</label><span>${esc(c.address || '-')}</span></div>
      <div class="whp-kv"><label>โทร.</label><span>${esc(c.phone || '-')}</span></div>`
      : '<p class="t-xs t-3">เลือกลูกค้าผู้จ่ายเงินเพื่อดึงเลขผู้เสียภาษี / สาขา / ที่อยู่</p>';
  }

  function drawLines() {
    tb.innerHTML = ed.lines.map((l, i) => {
      const tax = round2(l.tax_base * l.rate / 100);
      return `<tr>
        <td><input class="inp w100" type="date" data-i="${i}" data-k="pay_date"
              value="${esc(l.pay_date || '')}"></td>
        <td><select class="sel w100" data-i="${i}" data-k="income_type">${incomeOpts(l.income_type)}</select></td>
        <td><input class="inp w100" data-i="${i}" data-k="description"
              value="${esc(l.description || '')}" placeholder="รายละเอียด (ถ้ามี)"></td>
        <td><input class="inp r" type="number" step="0.01" min="0" data-i="${i}" data-k="tax_base"
              value="${l.tax_base}"></td>
        <td><input class="inp r" type="number" step="0.01" min="0" max="100" data-i="${i}" data-k="rate"
              value="${l.rate}"></td>
        <td class="r t-b" data-tax="${i}">${money(tax)}</td>
        <td class="center"><button class="btn btn-danger btn-sm" data-del-line="${i}">✕</button></td>
      </tr>`;
    }).join('');
    refreshTotals();
  }

  function refreshRow(i) {
    const l = ed.lines[i]; if (!l) return;
    const c = tb.querySelector(`[data-tax="${i}"]`);
    if (c) c.textContent = money(round2(l.tax_base * l.rate / 100));
  }

  function refreshTotals() {
    let base = 0, tax = 0;
    for (const l of ed.lines) {
      base = round2(base + l.tax_base);
      tax = round2(tax + round2(l.tax_base * l.rate / 100));
    }
    const a = cnt.querySelector('#wh-t-base'); if (a) a.textContent = money(base);
    const b = cnt.querySelector('#wh-t-tax'); if (b) b.textContent = money(tax);
  }
}

/* บันทึกร่าง — ส่งเฉพาะข้อมูลดิบ ภาษีและยอดรวมคำนวณที่ SQL ทั้งหมด */
async function doSave(cnt, btn) {
  if (!ed) return;
  if (!ed.customer_id) { toast('เลือกผู้หักภาษี / ลูกค้าผู้จ่ายเงินก่อน', 'err'); return; }
  if (!ed.lines.length) { toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return; }
  for (const l of ed.lines) {
    if (!(l.tax_base > 0)) { toast('จำนวนเงินที่จ่ายต้องมากกว่า 0 ทุกรายการ', 'err'); return; }
    if (l.rate < 0 || l.rate > 100) { toast('อัตราภาษีต้องอยู่ระหว่าง 0–100', 'err'); return; }
  }
  const payload = {
    wht_id: ed.whtId || null,
    customer_id: ed.customer_id,
    certificate_no: (ed.certificate_no || '').trim() || null,
    invoice_id: ed.invoice_id || null,
    document_date: ed.document_date || null,
    pay_date: ed.pay_date || null,
    wht_type: ed.lines[0].income_type,
    reference_no: (ed.reference_no || '').trim() || null,
    note: (ed.note || '').trim() || null,
    items: ed.lines.map(l => ({
      pay_date: l.pay_date || null,
      income_type: l.income_type,
      description: (l.description || '').trim() || null,
      tax_base: round2(l.tax_base),
      rate: round2(l.rate),
    })),
  };
  if (btn) btn.disabled = true;
  try {
    const r = await once('save-wht', () => saveWhtDraft(payload));
    if (r && r.id) {
      ed.whtId = r.id;
      const pv = cnt.querySelector('#wh-prev'); if (pv) pv.disabled = false;
      const po = cnt.querySelector('#wh-post'); if (po) po.disabled = false;
      toast('บันทึกร่างแล้ว — ภาษีหักรวม ' + money(r.amount), 'ok');
    }
  } catch (ex) { toast(whtErrMessage(ex), 'err'); }
  finally { if (btn) btn.disabled = false; }
}
