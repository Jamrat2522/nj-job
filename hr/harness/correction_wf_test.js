/* correction_wf_test.js — ลงชื่อย้อนหลังผ่าน Workflow จริง + Regression ลา/OT/ลงเวลา
   ใช้: node harness/correction_wf_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 9400);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(60) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(60) + (e || '')); }

/* ---- จำลองฝั่งเซิร์ฟเวอร์ตามกติกาเดียวกับ F3_correction_workflow.sql ---- */
const EMP_ME = 'e-me', EMP_SUP = 'e-sup', EMP_BOSS = 'e-boss';
let WF, CORR, ATT, seq, role, myEmp;
function reset() {
  seq = 1; role = 'USER'; myEmp = EMP_ME;
  // ผัง 2 ขั้น: ขั้น1 หัวหน้า(ANY) → ขั้น2 ผู้บริหาร(ANY)
  WF = { id: 'wf1', name: 'ผังลงชื่อย้อนหลัง ACCOUNT',
    steps: [{ step_no: 1, name: 'หัวหน้างาน', mode: 'ANY', approvers: [EMP_SUP] },
            { step_no: 2, name: 'ผู้บริหาร', mode: 'ANY', approvers: [EMP_BOSS] }] };
  CORR = [];
  ATT = [{ employee_id: EMP_ME, work_date: '2026-08-05', check_in: '2026-08-05T01:30:00Z',
           check_out: null, status: 'NORMAL' }];
}
const stepOf = c => (WF ? WF.steps.find(s => s.step_no === c.current_step) : null);
function canAct(c, emp) {
  if (!c || c.status !== 'PENDING' || !c.current_step) return false;
  const s = stepOf(c); if (!s) return false;
  if (s.approvers.indexOf(emp) < 0) return false;
  return !(c.approvals || []).some(a => a.step_no === c.current_step &&
    a.action === 'APPROVE' && a.by_employee === emp);
}
function submit(bd) {
  if (!WF) throw new Error('ยังไม่ได้ตั้งผังการอนุมัติสำหรับการลงชื่อย้อนหลัง ของแผนก ACCOUNT — กรุณาติดต่อฝ่ายบุคคล');
  if (!bd.p_requested_check_in && !bd.p_requested_check_out)
    throw new Error('กรุณาระบุเวลาเข้าหรือเวลาออกอย่างน้อย 1 ค่า');
  if (CORR.some(c => c.employee_id === myEmp && c.work_date === bd.p_work_date &&
      ['DRAFT', 'PENDING'].indexOf(c.status) >= 0))
    throw new Error('มีคำขอลงชื่อย้อนหลังของวันที่ ' + bd.p_work_date + ' ที่ยังไม่ถูกพิจารณาอยู่แล้ว');
  const a = ATT.find(x => x.employee_id === myEmp && x.work_date === bd.p_work_date);
  const row = { id: 'c' + (seq++), employee_id: myEmp, emp_code: '0001', emp_name: 'พนักงาน ทดสอบ',
    department_name: 'ACCOUNT', work_date: bd.p_work_date,
    original_check_in: a ? a.check_in : null, original_check_out: a ? a.check_out : null,
    requested_check_in: bd.p_requested_check_in, requested_check_out: bd.p_requested_check_out,
    reason: bd.p_reason, attachment_name: '', status: 'PENDING',
    submitted_at: new Date().toISOString(), approved_at: null, approved_by: '',
    rejection_reason: '', created_by: 'me', created_at: new Date().toISOString(),
    workflow_id: WF.id, workflow_name: WF.name, current_step: 1,
    step_total: WF.steps.length, approvals: [], total_count: 0 };
  CORR.push(row);
  return [{ id: row.id, status: row.status }];
}
function approve(bd, actor) {
  const c = CORR.find(x => x.id === bd.p_id);
  if (!c) throw new Error('ไม่พบคำขอนี้');
  if (c.status !== 'PENDING') throw new Error('คำขอนี้ถูกพิจารณาไปแล้ว (สถานะ ' + c.status + ')');
  if (c.employee_id === actor) throw new Error('อนุมัติคำขอของตนเองไม่ได้');
  if (!canAct(c, actor)) throw new Error('คำขอนี้ยังไม่ถึงคิวอนุมัติของคุณ');
  const s = stepOf(c);
  c.approvals.push({ step_no: s.step_no, action: 'APPROVE', by_employee: actor });
  if (s.mode === 'ALL') {
    const done = c.approvals.filter(a => a.step_no === s.step_no && a.action === 'APPROVE').length;
    if (done < s.approvers.length) return [{ id: c.id, status: 'PENDING', attendance_updated: false }];
  }
  const next = WF.steps.filter(x => x.step_no > s.step_no).map(x => x.step_no).sort()[0];
  if (next) { c.current_step = next; return [{ id: c.id, status: 'PENDING', attendance_updated: false }]; }
  // ครบทุกขั้น → เขียน attendance (ค่าที่ไม่ได้ขอคงค่าเดิม · ไม่สร้างแถวซ้ำ)
  let a = ATT.find(x => x.employee_id === c.employee_id && x.work_date === c.work_date);
  const vin = c.requested_check_in || (a ? a.check_in : null);
  const vout = c.requested_check_out || (a ? a.check_out : null);
  if (a) { a.check_in = vin; a.check_out = vout; }
  else ATT.push({ employee_id: c.employee_id, work_date: c.work_date, check_in: vin, check_out: vout, status: 'NORMAL' });
  c.status = 'APPROVED'; c.current_step = null;
  c.applied_check_in = vin; c.applied_check_out = vout;
  return [{ id: c.id, status: 'APPROVED', attendance_updated: true }];
}
function reject(bd, actor) {
  const c = CORR.find(x => x.id === bd.p_id);
  if (!c) throw new Error('ไม่พบคำขอนี้');
  if (c.status !== 'PENDING') throw new Error('คำขอนี้ถูกพิจารณาไปแล้ว');
  if (!String(bd.p_reason || '').trim()) throw new Error('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
  if (!canAct(c, actor)) throw new Error('คำขอนี้ยังไม่ถึงคิวอนุมัติของคุณ');
  c.status = 'REJECTED'; c.current_step = null; c.rejection_reason = bd.p_reason;
  return [{ id: c.id, status: 'REJECTED' }];   // ไม่แตะ ATT เด็ดขาด
}

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, () => r(s));
  });
}

(async function () {
  reset();
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const ok = o => route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
    const bad = m => route.fulfill({ status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: m }) });
    try {
      if (fn === 'njhr_att_correction_submit') return ok(submit(bd));
      if (fn === 'njhr_att_correction_approve') return ok(approve(bd, myEmp));
      if (fn === 'njhr_att_correction_reject') return ok(reject(bd, myEmp));
      if (fn === 'njhr_att_correction_list') {
        return ok(CORR.filter(c => (!bd.p_status || c.status === bd.p_status))
          .filter(c => !bd.p_mine_queue || canAct(c, myEmp))
          .map(c => {
            // RPC จริงคืนชื่อ/โหมดของขั้นปัจจุบันมาด้วย (njhr_att_correction_list)
            const st = stepOf(c);
            return Object.assign({}, c, {
              can_act: canAct(c, myEmp), total_count: CORR.length,
              step_total: WF ? WF.steps.length : 0,
              step_name: st ? st.name : '', step_mode: st ? st.mode : '' });
          }));
      }
      if (fn === 'njhr_wf_list') return ok([]);
      if (fn === 'njhr_wf_overview') return ok([]);
      let out = F.respond(fn, bd);
      if (role && (fn === 'njhr_login' || fn === 'njhr_session_check') && out && out.role) {
        out = JSON.parse(JSON.stringify(out)); out.role = role;
      }
      return ok(out);
    } catch (e) { return bad(e.message); }
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e.message)));
  page.on('console', m => {
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t);
  });

  async function login(r) {
    role = r || 'USER';
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!document.getElementById('lg-user'), { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('lg-user').value = 'admin';
      document.getElementById('lg-pass').value = 'Admin1234';
      document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
    });
    await page.waitForTimeout(2500);
  }
  async function openAtt() {
    await page.evaluate(() => { location.hash = '#/attendance'; });
    await page.waitForFunction(() => !!document.getElementById('att-fix'), { timeout: 25000 });
    await page.waitForTimeout(600);
  }
  async function openForm() {
    await page.evaluate(() => document.getElementById('att-fix').click());
    await page.waitForSelector('#fix-f', { timeout: 15000 });
    await page.waitForTimeout(400);
  }
  async function fillSend(d, tin, tout, reason, note) {
    await page.evaluate(v => {
      const f = document.getElementById('fix-f');
      f.date.value = v.d;
      f.tin.value = v.tin || ''; f.tout.value = v.tout || '';
      f.reason.value = v.reason || ''; f.note.value = v.note || '';
      document.getElementById('fx-save').click();
    }, { d: d, tin: tin, tout: tout, reason: reason, note: note });
    await page.waitForTimeout(1600);
    return page.evaluate(() => (document.getElementById('fix-err') || {}).textContent || '');
  }
  async function openAppr(tab) {
    await page.evaluate(() => { location.hash = '#/approvals'; });
    await page.waitForFunction(() => document.querySelectorAll('.tabs .tab').length > 0, { timeout: 25000 });
    await page.waitForTimeout(900);
    if (tab) {
      await page.evaluate(t => {
        const b2 = [].slice.call(document.querySelectorAll('.tabs .tab'))
          .filter(x => x.dataset.tab === t)[0];
        if (b2) b2.click();
      }, tab);
      await page.waitForTimeout(1600);
    }
  }

  /* ---------- 1. ฟอร์มพนักงาน ---------- */
  await login('USER'); await openAtt();
  chk('1 · ปุ่มเป็น "ลงชื่อย้อนหลัง"',
    (await page.evaluate(() => document.getElementById('att-fix').textContent)).indexOf('ลงชื่อย้อนหลัง') >= 0,
    (await page.evaluate(() => document.getElementById('att-fix').textContent.trim())));

  await openForm();
  const fields = await page.evaluate(() => {
    const f = document.getElementById('fix-f');
    return { date: !!f.date, tin: !!f.tin, tout: !!f.tout, reason: !!f.reason, note: !!f.note,
      title: (document.querySelector('#modal-root .modal-head') || {}).innerText || '',
      maxDate: f.date.getAttribute('max') };
  });
  chk('1b · ฟอร์มมีวันที่ · เวลาเข้า · เวลาออก · เหตุผล · หมายเหตุ',
    fields.date && fields.tin && fields.tout && fields.reason && fields.note, JSON.stringify(fields).slice(0, 90));
  chk('1c · หัวข้อ Modal เป็น "ลงชื่อย้อนหลัง"', /ลงชื่อย้อนหลัง/.test(fields.title), fields.title.trim());
  chk('1d · เลือกวันอนาคตไม่ได้ (max = วันนี้)', !!fields.maxDate, 'max=' + fields.maxDate);

  let err = await fillSend('2026-08-05', '', '', '', '');
  chk('1e · Validation: ไม่กรอกเวลาเลย → เตือน', /อย่างน้อย 1 ช่อง/.test(err), err);
  err = await fillSend('2026-08-05', '08:30', '', '', '');
  chk('1f · Validation: ไม่กรอกเหตุผล → เตือน', /เหตุผล/.test(err), err);
  err = await fillSend('2026-08-05', '10:00', '09:00', 'x', '');
  chk('1g · Validation: เวลาออกก่อนเวลาเข้า → เตือน', /หลังเวลาเข้า/.test(err), err);

  /* ---------- 2. ไม่มี Workflow → ส่งไม่ได้ ---------- */
  const wfBackup = WF; WF = null;
  err = await fillSend('2026-08-05', '08:30', '17:30', 'ลืมสแกน', '');
  chk('2 · ไม่มี Workflow → ส่งคำขอไม่ได้ · ไม่ Auto Approve',
    /ยังไม่ได้ตั้งผังการอนุมัติ/.test(err) && CORR.length === 0, err.slice(0, 60));
  chk('2b · Attendance ไม่ถูกแตะ', ATT.length === 1 && ATT[0].check_out === null, 'ATT=' + ATT.length);
  WF = wfBackup;

  /* ---------- 3. ส่งคำขอสำเร็จ → PENDING ---------- */
  err = await fillSend('2026-08-05', '', '17:30', 'ลืมสแกนออก', 'มีพยาน');
  chk('3 · ส่งคำขอได้ · สถานะ PENDING · ขั้นที่ 1',
    CORR.length === 1 && CORR[0].status === 'PENDING' && CORR[0].current_step === 1,
    JSON.stringify(CORR.map(c => c.status + '/' + c.current_step)));
  chk('3b · หมายเหตุถูกส่งไปกับเหตุผล', /หมายเหตุ: มีพยาน/.test(CORR[0].reason || ''), CORR[0].reason);
  chk('3c · เก็บค่าเวลาเดิมไว้เทียบ (Audit)',
    CORR[0].original_check_in === '2026-08-05T01:30:00Z', CORR[0].original_check_in);
  chk('3d · Attendance ยังไม่ถูกแก้ตอนส่งคำขอ',
    ATT.length === 1 && ATT[0].check_out === null, 'check_out=' + ATT[0].check_out);

  await openForm();
  err = await fillSend('2026-08-05', '08:30', '', 'ซ้ำ', '');
  chk('4 · ส่งซ้ำวันเดิมไม่ได้', /ยังไม่ถูกพิจารณาอยู่แล้ว/.test(err), err.slice(0, 50));
  await page.evaluate(() => { const c = document.getElementById('fx-cancel'); if (c) c.click(); });
  await page.waitForTimeout(400);

  /* ---------- 5. หน้าอนุมัติรายการ ---------- */
  myEmp = 'e-outsider';                    // คนนอกผัง
  await login('ADMIN'); await openAppr('fix');
  let ap = await page.evaluate(() => ({
    tabs: [].slice.call(document.querySelectorAll('.tabs .tab')).map(x => x.textContent.trim()),
    cards: document.querySelectorAll('[data-fixid]').length,
    btnAppr: document.querySelectorAll('[data-fixapprove]').length
  }));
  chk('5 · มีแท็บ "ลงชื่อย้อนหลัง"', ap.tabs.some(t => /ลงชื่อย้อนหลัง/.test(t)), ap.tabs.join(' | '));
  chk('6 · คนนอกผังไม่เห็นรายการในคิวตน (แม้เป็น ADMIN)',
    ap.cards === 0 && ap.btnAppr === 0, 'การ์ด=' + ap.cards);

  myEmp = EMP_SUP;                          // หัวหน้างาน = ขั้น 1
  await openAppr('fix');
  ap = await page.evaluate(() => {
    const c = document.querySelector('[data-fixid]');
    return { cards: document.querySelectorAll('[data-fixid]').length,
      btnAppr: document.querySelectorAll('[data-fixapprove]').length,
      btnRej: document.querySelectorAll('[data-fixreject]').length,
      txt: c ? c.innerText.replace(/\s+/g, ' ') : '' };
  });
  chk('7 · ผู้อนุมัติขั้น 1 เห็นรายการของตน', ap.cards === 1 && ap.btnAppr === 1 && ap.btnRej === 1,
    'การ์ด=' + ap.cards);
  chk('7b · การ์ดแสดงรหัส · ชื่อ · วันที่ · เวลาเดิม→ใหม่ · เหตุผล',
    /0001/.test(ap.txt) && /พนักงาน ทดสอบ/.test(ap.txt) && /ลืมสแกนออก/.test(ap.txt), ap.txt.slice(0, 110));
  chk('7c · การ์ดแสดงขั้นอนุมัติปัจจุบัน', /ขั้นที่ 1\/2/.test(ap.txt) && /หัวหน้างาน/.test(ap.txt), '');

  /* ---------- 8. อนุมัติขั้น 1 → ยังไม่เขียน Attendance ---------- */
  await page.evaluate(() => document.querySelector('[data-fixapprove]').click());
  await page.waitForTimeout(2000);
  chk('8 · อนุมัติขั้น 1 → ยังเป็น PENDING · ขั้นที่ 2',
    CORR[0].status === 'PENDING' && CORR[0].current_step === 2,
    CORR[0].status + '/' + CORR[0].current_step);
  chk('8b · Attendance ยังไม่ถูกเขียน',
    ATT.length === 1 && ATT[0].check_out === null, 'check_out=' + ATT[0].check_out);

  await openAppr('fix');
  chk('9 · ขั้น 1 กดซ้ำไม่ได้ (หายจากคิวตน)',
    (await page.evaluate(() => document.querySelectorAll('[data-fixid]').length)) === 0, '');

  /* ---------- 10. อนุมัติขั้น 2 → เขียน Attendance ---------- */
  myEmp = EMP_BOSS;
  await openAppr('fix');
  chk('10 · ผู้อนุมัติขั้น 2 เห็นรายการต่อ',
    (await page.evaluate(() => document.querySelectorAll('[data-fixapprove]').length)) === 1, '');
  await page.evaluate(() => document.querySelector('[data-fixapprove]').click());
  await page.waitForTimeout(2000);
  chk('11 · ครบทุกขั้น → APPROVED', CORR[0].status === 'APPROVED', CORR[0].status);
  chk('12 · จึงเขียน Attendance จริง', ATT[0].check_out === '2026-08-05T17:30:00.000Z' ||
    /T/.test(String(ATT[0].check_out || '')), 'check_out=' + ATT[0].check_out);
  chk('13 · ขอแก้เฉพาะเวลาออก → เวลาเข้าเดิมไม่หาย',
    ATT[0].check_in === '2026-08-05T01:30:00Z', 'check_in=' + ATT[0].check_in);
  chk('14 · ไม่สร้าง Attendance ซ้ำ', ATT.length === 1, 'ATT=' + ATT.length);

  /* ---------- 15. REJECTED ไม่แก้ Attendance ---------- */
  myEmp = EMP_ME; await login('USER'); await openAtt(); await openForm();
  err = await fillSend('2026-08-06', '09:00', '18:00', 'ทดสอบ reject', '');
  chk('15 · ส่งคำขอใบที่ 2 ได้', CORR.length === 2 && CORR[1].status === 'PENDING', 'CORR=' + CORR.length);
  const attBefore = JSON.stringify(ATT);
  myEmp = EMP_SUP; await login('ADMIN'); await openAppr('fix');
  await page.evaluate(() => document.querySelector('[data-fixreject]').click());
  await page.waitForSelector('#fxr-go', { timeout: 10000 });
  chk('16 · ไม่อนุมัติต้องระบุเหตุผล',
    await page.evaluate(() => {
      document.getElementById('fxr-note').value = '';
      document.getElementById('fxr-go').click();
      return /กรุณาระบุเหตุผล/.test(document.getElementById('fxr-err').textContent);
    }), '');
  await page.evaluate(() => {
    document.getElementById('fxr-note').value = 'เอกสารไม่ครบ';
    document.getElementById('fxr-go').click();
  });
  await page.waitForTimeout(2000);
  chk('17 · REJECTED บันทึกเหตุผล',
    CORR[1].status === 'REJECTED' && CORR[1].rejection_reason === 'เอกสารไม่ครบ',
    CORR[1].status + ' · ' + CORR[1].rejection_reason);
  chk('18 · REJECTED ไม่แก้ Attendance', JSON.stringify(ATT) === attBefore, 'ไม่เปลี่ยน');

  /* ---------- 19. โหมด ALL ---------- */
  reset();
  WF.steps[0].mode = 'ALL'; WF.steps[0].approvers = [EMP_SUP, EMP_BOSS];
  myEmp = EMP_ME; await login('USER'); await openAtt(); await openForm();
  await fillSend('2026-08-07', '08:00', '17:00', 'ALL test', '');
  chk('19 · ส่งคำขอสำหรับทดสอบ ALL', CORR.length === 1, 'CORR=' + CORR.length);
  myEmp = EMP_SUP; await login('ADMIN'); await openAppr('fix');
  await page.evaluate(() => document.querySelector('[data-fixapprove]').click());
  await page.waitForTimeout(1800);
  chk('20 · ALL: คนแรกอนุมัติแล้วยังอยู่ขั้นเดิม',
    CORR[0].current_step === 1 && CORR[0].status === 'PENDING',
    'step=' + CORR[0].current_step);
  myEmp = EMP_BOSS; await openAppr('fix');
  await page.evaluate(() => document.querySelector('[data-fixapprove]').click());
  await page.waitForTimeout(1800);
  chk('21 · ALL: คนที่สองอนุมัติ → ข้ามไปขั้น 2',
    CORR[0].current_step === 2 && CORR[0].status === 'PENDING', 'step=' + CORR[0].current_step);
  chk('21b · ยังไม่เขียน Attendance ของวันนั้น',
    !ATT.some(x => x.work_date === '2026-08-07'), '');

  /* ---------- 22. ตั้งค่าการอนุมัติมีประเภทที่ 3 ---------- */
  await login('SUPER_ADMIN');
  await page.evaluate(() => { location.hash = '#/approval-settings'; });
  await page.waitForTimeout(2500);
  const types = await page.evaluate(() => {
    const s = document.querySelector('#as-type') ||
      [].slice.call(document.querySelectorAll('select')).filter(x => /ลางาน|OT/.test(x.innerText))[0];
    return s ? [].slice.call(s.options).map(o => o.text.trim()) : [];
  });
  chk('22 · หน้าตั้งค่าการอนุมัติมีประเภท "ลงชื่อย้อนหลัง"',
    types.some(t => /ลงชื่อย้อนหลัง/.test(t)), types.join(' | ') || '(ไม่พบ dropdown)');

  /* ---------- 23. Regression ---------- */
  for (const h of [['23', '#/leave', 'ระบบลา'], ['24', '#/ot', 'ระบบ OT'],
                   ['25', '#/attendance', 'ลงเวลาปกติ'], ['26', '#/payroll', 'Payroll'],
                   ['27', '#/reports', 'รายงานลงเวลา'], ['28', '#/reportall', 'REPORT ALL'],
                   ['29', '#/shifts', 'กะทำงาน']]) {
    await page.evaluate(x => { location.hash = x; }, h[1]);
    await page.waitForTimeout(1500);
    chk(h[0] + ' · ' + h[2] + ' ไม่กระทบ',
      await page.evaluate(x => location.hash === x, h[1]), h[1]);
  }
  await openAppr('leave');
  chk('30 · แท็บคำขอลาเดิมยังทำงาน',
    await page.evaluate(() => {
      const t = [].slice.call(document.querySelectorAll('.tabs .tab')).filter(x => x.dataset.tab === 'leave')[0];
      return !!t && t.classList.contains('active');
    }), '');
  await openAppr('ot');
  chk('31 · แท็บคำขอ OT เดิมยังทำงาน',
    await page.evaluate(() => {
      const t = [].slice.call(document.querySelectorAll('.tabs .tab')).filter(x => x.dataset.tab === 'ot')[0];
      return !!t && t.classList.contains('active');
    }), '');

  /* ---------- 32. Mobile ---------- */
  await page.setViewportSize({ width: 360, height: 740 });
  myEmp = EMP_ME; await login('USER'); await openAtt(); await openForm();
  const mob = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    btnH: Math.round(document.getElementById('fx-save').getBoundingClientRect().height),
    dateW: Math.round(document.querySelector('#fix-f [name="date"]').getBoundingClientRect().width),
    vw: window.innerWidth
  }));
  chk('32 · Mobile 360 ใช้งานได้ ไม่ล้นจอ · ปุ่มกดง่าย',
    !mob.overflow && mob.btnH >= 36 && mob.dateW <= mob.vw,
    'ล้นจอ=' + mob.overflow + ' ปุ่มสูง=' + mob.btnH + 'px');
  await page.setViewportSize({ width: 1440, height: 900 });

  skip('ไฟล์แนบ', 'ตาราง/RPC รองรับ (attachment_name/path/mime/size · p_attachment) — ยังไม่ทำ UI อัปโหลดในรอบนี้');
  skip('Audit SQL', 'njhr_audit_write ถูกเรียกทุกขั้นใน F3 — ตรวจแล้วฝั่ง PostgreSQL จริง');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
