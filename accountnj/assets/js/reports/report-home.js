/* ══ REPORT — หน้าเดียวจบ: เลือกหมวด → เลือกรายงาน → ตัวกรอง → Export Excel ══
   ── หลักการของหน้านี้ (ข้อกำหนดข้อ 1-7) ──────────────────────────────────
   เปิดหน้า      : แสดงเฉพาะหัวข้อ DOCUMENT / ACCOUNTING / FINANCE
                   *** ไม่ยิง Query ใด ๆ *** ไม่มี Table · ไม่มี KPI · ไม่มี Preview
   กดหมวด        : Accordion เปิดทีละหมวด — เปิด/ปิดเมนูย่อยเท่านั้น ไม่ยิง Query
   กดรายงาน      : แสดงตัวกรอง 8 ช่องในแถวเดียว — *** ยังไม่ยิง Query รายงาน ***
                   (โหลด Master ลูกค้าครั้งเดียวเพื่อทำ dropdown เท่านั้น
                    ใช้ cache เดิม AppState.masters ที่หน้าอื่นโหลดไว้แล้ว)
   กดแสดงรายงาน  : Query ตามตัวกรอง แล้ว Export Excel ทันที
                   *** ไม่แสดง Table · ไม่มี Modal · ไม่มี Popup · ไม่เปลี่ยนหน้า ***

   ── URL เดิมยังใช้ได้ ──
   route 'report/<key>' (open-jobs · no-invoice · invoice-all · billing-total ·
   paid · outstanding · overdue · paid-status) ยังอยู่ครบใน routes.js
   เข้ามาแล้วหน้านี้จะกางหมวดและเลือกรายงานนั้นให้อัตโนมัติ
   *** ไม่ลบ route · ไม่เปลี่ยน URL · Bookmark เดิมไม่ 404 ***
   การกดเลือกรายงานในหน้า *** ไม่แตะ location.hash *** จึงไม่มีการเปลี่ยนหน้า */

import { REPORT_GROUPS, defByKey, defsOfGroup } from './report-defs.js';
import { loadReport, runReport, invCell } from './report-export.js';
import { toAoA } from '../charges/charge-export.js';
import { renderPagination } from '../components/pagination.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { COMPANY_GROUPS } from '../config/charge-groups.js';
import { handleErr } from '../core/error-handler.js';
import { toast } from '../components/toast.js';
import { once } from '../core/request-manager.js';
import { money as money2 } from '../core/formatter.js';

/* สถานะ INVOICE ตามค่าจริงของ njacc_invoices (CHECK constraint) */
const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'POSTED', 'VOID'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON = {
  DOCUMENT: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>',
  ACCOUNTING: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 16h4"/></svg>',
  FINANCE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/></svg>',
};

/* ── Backward-compat ──
   report-page.js (หน้าเดิมที่เลิกใช้ route แล้ว แต่ *** ยังไม่ถูกลบออกจาก Source ***)
   import ตัวนี้แบบ dynamic เพื่ออ่านชื่อรายงาน — คงรูปแบบเดิมไว้ให้ไม่พัง */
export const REPORT_CARDS = REPORT_GROUPS.map(g => ({
  group: g,
  items: defsOfGroup(g).map((d, i) => ({ key: d.key, no: i + 1, title: d.title, desc: d.note || '', ready: true })),
}));

/* state ของหน้า — อยู่ในหน่วยความจำเท่านั้น ไม่เขียน localStorage */
/* ── V.205 ── เก็บผลลัพธ์ที่ดึงมาแล้วไว้ในหน่วยความจำ
   แบ่งหน้าฝั่ง Browser จากชุดเดียวกัน -> ไม่ยิง RPC ซ้ำตอนเปลี่ยนหน้า/ขนาดหน้า
   (ตัวกรอง/เงื่อนไขของ Report ยังส่งเข้า RPC เดิมทุกตัวตอนกด "แสดงรายงาน") */
const st = { group: '', key: '', mastersLoaded: false,
             data: null, page: 1, size: 20 };

export async function render(cnt, args) {
  const wanted = (args && args.key) || '';
  const wdef = defByKey(wanted);
  st.group = wdef ? wdef.group : '';
  st.key = wdef ? wdef.key : '';

  cnt.innerHTML = `
    <div class="rpt2 rpt2-ws">
      <aside class="rpt2-menu">${REPORT_GROUPS.map(groupHTML).join('')}</aside>
      <section id="rpt2-panel" class="rpt2-panel"></section>
    </div>`;

  const root = cnt.querySelector('.rpt2');

  /* ── Accordion + เลือกรายงาน (event delegation จุดเดียว) ── */
  root.addEventListener('click', (e) => {
    const h = e.target.closest('.rpt2-h');
    if (h) { toggleGroup(root, h.dataset.grp); return; }
    const it = e.target.closest('.rpt2-item');
    if (it) { selectReport(root, it.dataset.key); }
  });

  paintGroups(root);
  if (st.key) await paintPanel(root);      /* เข้ามาทาง URL รายงานย่อย */
}

function groupHTML(g) {
  const items = defsOfGroup(g).map(d => `
    <button type="button" class="rpt2-item" data-key="${esc(d.key)}">
      <span class="rpt2-no">${esc(d.no)}</span>
      <span class="rpt2-title">${esc(d.title)}</span>
    </button>`).join('');
  return `<section class="rpt2-sec rpt2-${g.toLowerCase()}" data-sec="${g}">
    <button type="button" class="rpt2-h" data-grp="${g}" aria-expanded="false">
      <span class="rpt2-ic">${ICON[g]}</span>
      <span class="rpt2-h-t">${g}</span>
      <span class="rpt2-caret" aria-hidden="true"></span>
    </button>
    <div class="rpt2-body">${items}</div>
  </section>`;
}

/* เปิดได้ทีละหมวด — กดหมวดเดิมซ้ำ = ยุบ (ข้อกำหนดข้อ 9) */
function toggleGroup(root, g) {
  st.group = (st.group === g) ? '' : g;
  paintGroups(root);
}

function paintGroups(root) {
  root.querySelectorAll('.rpt2-sec').forEach(sec => {
    const on = sec.dataset.sec === st.group;
    sec.classList.toggle('open', on);
    const h = sec.querySelector('.rpt2-h');
    if (h) h.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
  root.querySelectorAll('.rpt2-item').forEach(b => {
    b.classList.toggle('on', b.dataset.key === st.key);
  });
}

async function selectReport(root, key) {
  const d = defByKey(key);
  if (!d) return;
  st.key = key;
  st.group = d.group;
  paintGroups(root);
  await paintPanel(root);
}

/* ══ Filter Bar แถวเดียว — *** ชุดเดียวในหน้านี้ *** (V.205) ════════════════
   บริษัท | ลูกค้า | สถานะ INVOICE | สถานะชำระ | วันที่จาก | วันที่ถึง | แสดงรายงาน
   ── ถอด "ทุกประเภท" (charge_type) ออก ──
   การเลือก Report ทางเมนูซ้ายเป็นตัวกำหนดประเภทของรายงานอยู่แล้ว
   ค่าที่ส่งเข้า RPC จึงเป็น charge_type = '' เสมอ = "ทุกประเภท" (ค่า Default เดิม)
   *** ตรรกะของ RPC ไม่เปลี่ยน *** report-export.js วนทุกประเภทตามสิทธิ์เหมือนเดิม

   *** ไม่มี Modal / Popup / Drawer / Filter ชุดที่ 2 ในหน้านี้ ***
   ช่องที่รายงานล็อกไว้ยังแสดงครบ แต่แก้ไม่ได้ (disabled) */
async function paintPanel(root) {
  const panel = root.querySelector('#rpt2-panel');
  const d = defByKey(st.key);
  if (!panel || !d) return;

  if (!st.mastersLoaded) {
    panel.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังเตรียมตัวกรอง…</div></div>';
    try { await masters(); st.mastersLoaded = true; }
    catch (e) { handleErr(e, 'โหลดข้อมูลลูกค้าไม่สำเร็จ'); }
  }

  const lock = d.lock || {};
  const lk = (f) => Object.prototype.hasOwnProperty.call(lock, f);
  const dis = (f) => (lk(f) ? ' disabled' : '');
  const sel = (f, v) => (lock[f] === v ? ' selected' : '');

  panel.innerHTML = `
    <div class="rpt2-panel-h">
      <span class="rpt2-no">${esc(d.no)}</span>
      <span class="rpt2-panel-t">${esc(d.title)}</span>
    </div>
    <div class="fbar rpt2-fbar">
      <select class="sel" data-f="company_group" title="บริษัท"${dis('company_group')}>
        <option value="">ทุกบริษัท</option>
        ${COMPANY_GROUPS.map(g => `<option value="${g.key}"${sel('company_group', g.key)}>${esc(g.label)}</option>`).join('')}
      </select>
      <select class="sel" data-f="customer_id" title="ลูกค้า"${dis('customer_id')}>${customerOpts(lock.customer_id || '')}</select>
      <select class="sel" data-f="status" title="สถานะ INVOICE"${dis('status')}>
        <option value="">สถานะ INVOICE ทั้งหมด</option>
        ${INVOICE_STATUSES.map(v => `<option value="${v}"${sel('status', v)}>${v}</option>`).join('')}
      </select>
      <select class="sel" data-f="payment_status" title="สถานะชำระ"${dis('payment_status')}>
        <option value="">สถานะชำระทั้งหมด</option>
        <option value="UNPAID"${sel('payment_status', 'UNPAID')}>ยังไม่ชำระ</option>
        <option value="PARTIAL"${sel('payment_status', 'PARTIAL')}>บางส่วน</option>
        <option value="PAID"${sel('payment_status', 'PAID')}>ครบ</option>
      </select>
      <input class="inp" type="date" data-f="from" title="วันที่จาก" placeholder="วว/ดด/ปปปป">
      <input class="inp" type="date" data-f="to" title="วันที่ถึง" placeholder="วว/ดด/ปปปป">
      <button type="button" class="btn btn-p btn-sm" id="rpt2-go">แสดงรายงาน</button>
    </div>
    <p class="rpt2-note">${esc(d.note || '')}</p>
    <p class="rpt2-status" id="rpt2-status"></p>
    ${/* ── พื้นที่ผลลัพธ์: ปุ่ม Export + ตาราง + แบ่งหน้า ── */ ''}
    <div class="rpt2-res" id="rpt2-res" hidden>
      <div class="rpt2-res-h">
        <span class="rpt2-res-t" id="rpt2-res-t"></span>
        <button type="button" class="btn btn-o btn-sm" id="rpt2-xls">⬇ Export Excel</button>
      </div>
      <div class="tbl-wrap rpt2-tbl"><table class="tbl">
        <thead id="rpt2-th"></thead><tbody id="rpt2-tb"></tbody></table></div>
      <div id="rpt2-pgn"></div>
    </div>`;

  st.data = null; st.page = 1;
  panel.querySelector('#rpt2-go').onclick = () => doShow(panel, d);
  panel.querySelector('#rpt2-xls').onclick = () => doExport(panel, d);
}

/* อ่านค่าจาก Filter Bar — charge_type ไม่มีช่องแล้ว จึงเป็น '' เสมอ (= ทุกประเภท) */
function readFilters(panel, d) {
  const f = { charge_type: '', company_group: '', customer_id: '', status: '',
              payment_status: '', from: '', to: '' };
  panel.querySelectorAll('[data-f]').forEach(el => { f[el.dataset.f] = el.value || ''; });
  Object.assign(f, d.lock || {});          /* ค่าที่รายงานล็อกไว้ชนะเสมอ */
  return f;
}

/* ══ แสดงรายงาน = Query ด้วย RPC เดิม แล้ววาดตารางในหน้าเดียวกัน ══════════
   *** ไม่เปิดหน้าต่างใด ๆ *** และไม่มีขั้นตอนให้เลือกเงื่อนไขซ้ำ */
async function doShow(panel, d) {
  const btn = panel.querySelector('#rpt2-go');
  const stat = panel.querySelector('#rpt2-status');
  const f = readFilters(panel, d);
  if (f.from && f.to && f.from > f.to) { toast('วันที่จากต้องไม่เกินวันที่ถึง', 'err'); return; }

  await once('rpt2-show', async () => {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'กำลังดึงข้อมูล…';
    stat.textContent = 'กำลังดึงข้อมูล…';
    try {
      st.data = await loadReport(d, f, (nRow, total) => {
        stat.textContent = total
          ? `กำลังดึงข้อมูล ${nRow.toLocaleString('th-TH')} / ${total.toLocaleString('th-TH')} แถว`
          : `กำลังดึงข้อมูล ${nRow.toLocaleString('th-TH')} แถว`;
      });
      st.page = 1;
      stat.textContent = '';
      drawTable(panel, d);
    } catch (e) {
      stat.textContent = '';
      handleErr(e, 'ดึงรายงานไม่สำเร็จ');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
}

/* วาดตารางจากชุดข้อมูลที่โหลดไว้ (แบ่งหน้าฝั่ง Browser · ไม่ยิง RPC ซ้ำ) */
function drawTable(panel, d) {
  const box = panel.querySelector('#rpt2-res');
  const th = panel.querySelector('#rpt2-th');
  const tb = panel.querySelector('#rpt2-tb');
  const pg = panel.querySelector('#rpt2-pgn');
  if (!box || !st.data) return;
  const { rows, cols, money, src } = st.data;
  box.hidden = false;
  panel.querySelector('#rpt2-res-t').textContent =
    `พบ ${rows.length.toLocaleString('th-TH')} รายการ`;
  panel.querySelector('#rpt2-xls').disabled = !rows.length;

  th.innerHTML = '<tr>' + cols.map(c =>
    `<th${money.includes(c[0]) ? ' class="r"' : ''}>${esc(c[1])}</th>`).join('') + '</tr>';

  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="${cols.length}" class="center t-3">ไม่มีข้อมูลตามเงื่อนไขที่เลือก</td></tr>`;
    pg.innerHTML = '';
    return;
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / st.size));
  if (st.page > pages) st.page = pages;
  const slice = rows.slice((st.page - 1) * st.size, st.page * st.size);

  /* ── ค่าที่แสดง = ชุดเดียวกับที่เขียนลง Excel ──
     job: toAoA/COMPAT_COLS ตัวเดิมของ charge-export.js
     inv: invCell() ตัวเดียวกับที่ report-export.js ใช้สร้างไฟล์
     -> ตัวเลขบนจอกับในไฟล์ตรงกันเสมอ */
  const cell = (r, c) => (src === 'job')
    ? toAoA([r], [c])[1][0]
    : invCell(r, c);

  tb.innerHTML = slice.map(r => '<tr>' + cols.map(c => {
    const v = cell(r, c);
    const isNum = money.includes(c[0]);
    const txt = (v === null || v === undefined || v === '') ? '-'
      : (isNum && typeof v === 'number' ? money2(v) : String(v));
    return `<td${isNum ? ' class="r"' : ''}>${esc(txt)}</td>`;
  }).join('') + '</tr>').join('');

  renderPagination(pg, { page: st.page, size: st.size, total }, (o) => {
    st.page = o.page; st.size = o.size; drawTable(panel, d);
  });
}

/* ══ Export Excel — ใช้ตัวกรองชุดเดียวกับปุ่มแสดงรายงาน ═══════════════════ */
async function doExport(panel, d) {
  const btn = panel.querySelector('#rpt2-xls');
  const stat = panel.querySelector('#rpt2-status');
  const f = readFilters(panel, d);

  if (f.from && f.to && f.from > f.to) {
    toast('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', 'err');
    return;
  }

  await once('rpt2-export', async () => {
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'กำลังสร้างไฟล์…';
    stat.textContent = 'กำลังดึงข้อมูล…';
    try {
      const res = await runReport(d, f, (n, total) => {
        stat.textContent = total
          ? `กำลังดึงข้อมูล ${n.toLocaleString('th-TH')} / ${total.toLocaleString('th-TH')} แถว`
          : `กำลังดึงข้อมูล ${n.toLocaleString('th-TH')} แถว`;
      });
      if (!res.rows) {
        stat.textContent = 'ไม่มีข้อมูลตามเงื่อนไขที่เลือก — ไม่ได้สร้างไฟล์';
        toast('ไม่มีข้อมูลตามเงื่อนไขที่เลือก', 'err');
      } else {
        stat.textContent = `ส่งออกแล้ว ${res.rows.toLocaleString('th-TH')} แถว`;
        toast(`ส่งออก Excel ${res.rows.toLocaleString('th-TH')} แถว`, 'ok');
      }
    } catch (e) {
      stat.textContent = '';
      handleErr(e, 'สร้างรายงานไม่สำเร็จ');
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
}
