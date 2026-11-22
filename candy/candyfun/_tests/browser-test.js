/* ทดสอบในเบราว์เซอร์จริง (Chrome headless): node _tests/browser-test.js  — ต้องมี playwright */
'use strict';
const path = require('path'), http = require('http'), fs = require('fs');
const APP = process.env.CF_APP || (require('fs').existsSync(path.join(__dirname, '..', 'index.html')) ? path.join(__dirname, '..') : path.join(__dirname, '..', 'candyfun'));
const OUT = process.env.CF_SHOTS || path.join(__dirname, 'shots');
const { chromium } = require(process.env.PW || 'playwright');
let pass = 0, fail = 0;
const clk = (page, sel, o) => page.click(sel, Object.assign({ force: true }, o || {}));
const ok = (c, n) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ FAIL: ' + n); } };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
let version = 'local004';
const server = http.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
  if (u === '/version.json') { s.writeHead(200, { 'content-type': 'application/json' }); return s.end(JSON.stringify({ version })); }
  const f = path.join(APP, u);
  if (!f.startsWith(APP) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(s);
});

async function drag(page, m) {
  const b = await page.evaluate(() => { const r = document.querySelector('#board').getBoundingClientRect(); return { x: r.left, y: r.top, cs: window.CFGame.state().cs }; });
  const p = (r, c) => [b.x + (c + .5) * b.cs, b.y + (r + .5) * b.cs];
  const [x1, y1] = p(m.r1, m.c1), [x2, y2] = p(m.r2, m.c2);
  await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 3 }); await page.mouse.move(x2, y2, { steps: 3 }); await page.mouse.up();
}
const idle = page => page.waitForFunction(() => { const g = window.CFGame.state(); return !g || !g.busy || !document.querySelector('#modal').hidden; }, null, { timeout: 30000 });
const domOk = page => page.evaluate(() => {
  const G = window.CFGame.state(), g = G.game; let n = 0, bad = 0;
  for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) { const x = g.grid[r][c]; if (!x) continue; n++; const t = G.tiles[x.id];
    if (!t || t.r !== r || t.c !== c || t.el.style.transform !== 'translate(' + c * G.cs + 'px, ' + r * G.cs + 'px)') bad++; }
  return { bad, n, dom: document.querySelectorAll('#l-tiles .tile').length };
});

async function flow(browser, name, vp, touch) {
  console.log('\n■ ' + name + ' (' + vp.width + '×' + vp.height + ')');
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8377/'); await page.waitForSelector('#scr-home.on');
  ok(await page.evaluate(() => window.CF_VERSION) === 'local004', 'โหลดเวอร์ชันจาก version.json = local004');
  await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, name + '-1-home.png') });
  await clk(page, '#btn-play'); await page.waitForSelector('#scr-map.on'); await page.waitForTimeout(400);
  ok(await page.locator('.node.cur').count() === 1 && await page.locator('.node.lock').count() >= 5, 'แผนที่: ด่านปัจจุบัน 1 จุด ด่านถัดไปล็อก');
  await page.screenshot({ path: path.join(OUT, name + '-2-map.png') });
  await clk(page, '.node.cur'); await page.waitForSelector('[data-go]'); await clk(page, '[data-go]'); await page.waitForSelector('#scr-game.on'); await page.waitForTimeout(300);
  const fit = await page.evaluate(() => { const b = document.querySelector('#board').getBoundingClientRect(), bo = document.querySelector('#boosters').getBoundingClientRect(), h = document.querySelector('.hud').getBoundingClientRect();
    return { in: b.left >= 0 && b.right <= innerWidth + .5 && b.top >= h.bottom - 30 && b.bottom <= bo.top + .5, cs: window.CFGame.state().cs, sw: document.documentElement.scrollWidth <= innerWidth }; });
  ok(fit.in && fit.sw, 'กระดานไม่ล้นจอ ไม่ทับ HUD/แถบตัวช่วย (ช่องละ ' + fit.cs + 'px)');
  ok(fit.cs >= 36, 'ขนาดช่องกดง่าย ≥36px');
  await page.screenshot({ path: path.join(OUT, name + '-3-game.png') });
  /* สลับที่ไม่ถูกต้อง: ต้องไม่เสียตาเดิน */
  const inv = await page.evaluate(() => { const g = window.CFGame.state().game; for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C - 1; c++) { const ok2 = g.findMoves().some(m => m.r1 === r && m.c1 === c && m.r2 === r && m.c2 === c + 1); if (!ok2) return { r1: r, c1: c, r2: r, c2: c + 1, moves: g.moves }; } });
  await drag(page, inv); await page.waitForTimeout(600);
  ok(await page.evaluate(() => window.CFGame.state().game.moves) === inv.moves, 'ลากสลับที่ไม่เกิดคู่ → เด้งกลับ ไม่เสียตาเดิน');
  /* เล่นจริงด้วยการลาก จนผ่านด่าน */
  let shot = false, steps = 0, syncBad = 0;
  for (; steps < 60; steps++) {
    await idle(page);
    if (await page.evaluate(() => !document.querySelector('#modal').hidden)) break;
    const m = await page.evaluate(() => { const G = window.CFGame.state(); return window.CFEngine.botPick(G.game, Math.random); });
    if (!m) break;
    const before = await page.evaluate(() => window.CFGame.state().game.moves);
    if (steps % 2) { await page.evaluate(() => 0); await drag(page, m); }
    else { /* แตะ-แตะ */
      const b = await page.evaluate(() => { const r = document.querySelector('#board').getBoundingClientRect(); return { x: r.left, y: r.top, cs: window.CFGame.state().cs }; });
      for (const [r, c] of [[m.r1, m.c1], [m.r2, m.c2]]) { await page.mouse.move(b.x + (c + .5) * b.cs, b.y + (r + .5) * b.cs); await page.mouse.down(); await page.mouse.up(); }
    }
    if (steps === 1 && !shot) { await page.waitForTimeout(260); await page.screenshot({ path: path.join(OUT, name + '-4-match.png') }); shot = true; }
    if (steps === 3) await clk(page, '#g-skip').catch(() => {});
    await idle(page);
    if (await page.evaluate(() => !document.querySelector('#modal').hidden)) break;
    const d = await domOk(page); if (d.bad || d.dom !== d.n) syncBad++;
    if (await page.evaluate(() => window.CFGame.state().game.moves) !== before - 1) syncBad++;
  }
  ok(syncBad === 0, 'ภาพบนจอตรงกับสถานะเกมทุกตา (' + steps + ' ตา ทั้งลากและแตะ + กดข้ามแอนิเมชัน)');
  await page.waitForSelector('[data-next]', { timeout: 20000 }); await page.waitForTimeout(1600);
  ok(true, 'ผ่านด่าน 1 → หน้าผ่านด่านแสดง');
  await page.screenshot({ path: path.join(OUT, name + '-5-win.png') });
  const c0 = await page.evaluate(() => window.CFSave.get().coins);
  const reward = await page.evaluate(() => window.CFSave.get().pending.coins);
  await clk(page, '[data-claim]'); await clk(page, '[data-claim]', { force: true }).catch(() => {}); await page.evaluate(() => document.querySelector('[data-claim]').click());
  const c1 = await page.evaluate(() => window.CFSave.get().coins);
  ok(c1 === c0 + reward && reward >= 50, 'กดรับรางวัลซ้ำ 3 ครั้ง → ได้เหรียญครั้งเดียว (+' + reward + ')');
  ok(await page.evaluate(() => window.CFSave.get().unlocked) === 2, 'ปลดล็อกด่าน 2');
  await clk(page, '[data-next]'); await page.waitForFunction(() => window.CFGame.state() && window.CFGame.state().n === 2);
  ok(true, 'NEXT LEVEL → เข้าด่าน 2 ทันที');
  /* ตัวช่วย: ให้เหรียญทดสอบแล้วซื้อจากในด่าน */
  await page.evaluate(() => window.CFSave.addCoins(1000));
  const hb = await page.evaluate(() => ({ coins: window.CFSave.get().coins, n: document.querySelectorAll('#l-tiles .tile').length }));
  await clk(page, '.bst[data-k="hammer"]'); await page.waitForSelector('[data-buy]'); await clk(page, '[data-buy]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.CFSave.get().coins) === hb.coins - 100 && await page.evaluate(() => window.CFSave.get().inv.hammer) === 1, 'ซื้อค้อนในด่าน: −100 เหรียญ เข้าคลัง 1');
  await clk(page, '.bst[data-k="hammer"]'); ok(await page.isVisible('#target-bar'), 'โหมดเลือกช่องเปิด');
  const b = await page.evaluate(() => { const r = document.querySelector('#board').getBoundingClientRect(); return { x: r.left, y: r.top, cs: window.CFGame.state().cs, mv: window.CFGame.state().game.moves }; });
  await page.mouse.move(b.x + 3.5 * b.cs, b.y + 3.5 * b.cs); await page.mouse.down(); await page.mouse.up(); await idle(page);
  ok(await page.evaluate(() => window.CFSave.get().inv.hammer) === 0 && await page.evaluate(() => window.CFGame.state().game.moves) === b.mv, 'ใช้ค้อน: คลังลดเหลือ 0 ไม่เสียตาเดิน');
  const d2 = await domOk(page); ok(!d2.bad && d2.dom === d2.n, 'หลังใช้ตัวช่วย กระดานเต็มและตรงกับสถานะ');
  /* ร้านค้า + รางวัล */
  await clk(page, '#g-pause'); await clk(page, '[data-map]'); await page.waitForSelector('#scr-map.on'); await clk(page, '#map-shop'); await page.waitForSelector('[data-buy="bomb"]');
  await page.screenshot({ path: path.join(OUT, name + '-6-shop.png') });
  const cs = await page.evaluate(() => window.CFSave.get().coins); await clk(page, '[data-buy="bomb"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.CFSave.get().coins) === cs - 180, 'ร้านค้า: ซื้อระเบิด −180');
  await clk(page, '[data-x]'); await clk(page, '#map-back'); await clk(page, '#btn-rewards'); await page.waitForSelector('[data-daily]');
  await page.screenshot({ path: path.join(OUT, name + '-7-rewards.png') });
  const cd = await page.evaluate(() => window.CFSave.get().coins); await clk(page, '[data-daily]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.CFSave.get().coins) === cd + 50 && await page.locator('[data-daily]').isDisabled(), 'รางวัลรายวัน +50 และรับซ้ำไม่ได้');
  await clk(page, '[data-x]');
  /* บันทึก: รีโหลดแล้วข้อมูลอยู่ครบ */
  const snap = await page.evaluate(() => JSON.stringify([window.CFSave.get().coins, window.CFSave.get().unlocked, window.CFSave.get().stars, window.CFSave.get().inv]));
  await page.reload(); await page.waitForSelector('#scr-home.on');
  ok(await page.evaluate(() => JSON.stringify([window.CFSave.get().coins, window.CFSave.get().unlocked, window.CFSave.get().stars, window.CFSave.get().inv])) === snap, 'ปิด/เปิดใหม่: เหรียญ ด่าน ดาว ตัวช่วย อยู่ครบ');
  /* ด่านที่มีสิ่งกีดขวาง + แพ้ → เพิ่ม 5 ตา */
  await page.evaluate(() => { window.CFSave.get().unlocked = 30; window.CFGame.start(29); }); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, name + '-8-level29.png') });
  await page.evaluate(() => { const G = window.CFGame.state(); G.game.moves = 1; });
  const m = await page.evaluate(() => window.CFEngine.botPick(window.CFGame.state().game, Math.random)); await drag(page, m); await idle(page);
  if (await page.locator('[data-more]').count()) {
    const cb = await page.evaluate(() => window.CFSave.get().coins); await clk(page, '[data-more]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => window.CFGame.state().game.moves) === 5 && await page.evaluate(() => window.CFSave.get().coins) === cb - 200, 'ตาเดินหมด → ใช้เหรียญเพิ่ม 5 ตา (−200) เล่นต่อได้');
  } else ok(await page.locator('[data-next]').count() === 1, 'ตาสุดท้ายผ่านด่านพอดี');
  /* อัปเดตเวอร์ชันอัตโนมัติ */
  await page.evaluate(() => window.CFGame.save.save());
  if (await page.locator('#g-pause').isVisible()) { await clk(page, '#g-pause').catch(() => {}); await clk(page, '[data-map]').catch(() => {}); }
  version = 'local005';
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => window.CF_VERSION === 'local005', null, { timeout: 8000 }).then(() => ok(true, 'ตรวจพบ version ใหม่ → โหลดใหม่เองเป็น local005'), () => ok(false, 'อัปเดตเวอร์ชันอัตโนมัติ'));
  version = 'local004';
  await page.waitForSelector('#scr-home.on');
  ok(await page.evaluate(() => window.CFSave.get().unlocked) === 30, 'อัปเดตเวอร์ชันแล้วเซฟเกมไม่หาย');
  ok(errs.length === 0, 'ไม่มี JavaScript error' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await ctx.close();
}


/* ---------- local002: ทดสอบกราฟิก 3D / Save เดิม / Fallback / ประสิทธิภาพ ---------- */
async function gfx(browser) {
  console.log('\n■ กราฟิก Premium 3D (390×844 @3x)');
  const SAMPLE = fs.readFileSync(process.env.CF_SAMPLE || path.join(__dirname, 'sample_save_local001.json'), 'utf8'), want = JSON.parse(SAMPLE);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage(), errs = [], reqs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('response', r => reqs.push(r.url()));
  const t0 = Date.now(); await page.goto('http://127.0.0.1:8377/'); await page.waitForSelector('#scr-home.on'); const loadMs = Date.now() - t0;
  /* Save เดิมจาก local001 */
  await page.evaluate(s => localStorage.setItem('cfa_save_v1', s), SAMPLE); await page.reload(); await page.waitForSelector('#scr-home.on');
  const got = await page.evaluate(() => JSON.parse(JSON.stringify(window.CFSave.get())));
  ok(got.coins === want.coins + want.pending.coins && got.unlocked === want.unlocked && got.wins === want.wins, 'Save local001: เหรียญ ' + want.coins + ' + รางวัลค้าง ' + want.pending.coins + ' = ' + got.coins + ' · ด่าน ' + got.unlocked + ' · ชนะ ' + got.wins + ' ครั้ง');
  ok(JSON.stringify(got.stars) === JSON.stringify(want.stars) && JSON.stringify(got.best) === JSON.stringify(want.best), 'Save local001: ดาวและคะแนนสูงสุดทุกด่านอยู่ครบ');
  ok(JSON.stringify(got.inv) === JSON.stringify(want.inv) && JSON.stringify(got.daily) === JSON.stringify(want.daily) && got.gift.last === want.gift.last && got.settings.music === false && got.deal === want.deal, 'Save local001: ตัวช่วย / สถิติรายวัน / กล่องของขวัญ / ตั้งค่า อยู่ครบ (ภารกิจประจำวันเปลี่ยนตามวันที่ตามกติกาเดิม)');
  ok(await page.evaluate(() => Object.keys(localStorage).sort().join()) === 'cfa_save_v1', 'ใช้คีย์ cfa_save_v1 เดิมคีย์เดียว ไม่สร้าง/ลบคีย์เซฟ');
  await page.screenshot({ path: path.join(OUT, 'gfx-1-home.png') });
  ok(await page.evaluate(() => document.documentElement.classList.contains('spr-ok') && window.CFArt.SPR.size) === 160, 'มือถือจอ 3x เลือก Sprite 160px/ชิ้น (ช่องจริง ~46px × 3 = 138px)');
  ok(await page.waitForFunction(() => { const i = document.querySelector('.logo3d'); return !!i && i.complete && i.naturalWidth > 0 && /logo-(640|1200)\.webp/.test(i.currentSrc); }, null, { timeout: 5000 }).then(() => true, () => false), 'โลโก้ 3D โหลดสำเร็จ');
  await page.evaluate(() => window.CFGame.start(17)); await page.waitForTimeout(500);
  const chk = await page.evaluate(() => { const G = window.CFGame.state(), g = G.game; let n = 0, bad = 0, sq = 0;
    for (let r = 0; r < g.R; r++) for (let c = 0; c < g.C; c++) { const x = g.grid[r][c]; if (!x) continue; n++; const s = G.tiles[x.id].el.querySelector('.spr'); if (!s) { bad++; continue; }
      const cs = getComputedStyle(s), b = s.getBoundingClientRect(); if (!/tiles-160|special-160/.test(cs.backgroundImage)) bad++; if (Math.abs(b.width - b.height) > 0.6 || b.width < G.cs * 0.9) sq++; }
    return { n, bad, sq, cs: G.cs }; });
  ok(chk.bad === 0 && chk.n > 40, 'ทุกชิ้นบนกระดานมีภาพ 3D ครบ ไม่มีสัญลักษณ์หาย (' + chk.n + ' ชิ้น)');
  ok(chk.sq === 0, 'ภาพไม่ผิดสัดส่วน (1:1) ขนาดช่อง ' + chk.cs + 'px → sprite 160px พอสำหรับจอ 3x (' + Math.round(chk.cs * 3) + 'px)');
  await page.screenshot({ path: path.join(OUT, 'gfx-2-level17.png') });
  /* ขนมพิเศษ: แยกจากขนมธรรมดา */
  await page.evaluate(() => { const G = window.CFGame.state(), g = G.game; const sp = ['h', 'v', 'bomb', 'rainbow']; let k = 0;
    for (let c = 1; c < g.C && k < 4; c += 2) { const x = g.grid[0][c]; if (x && x.t === 'c') { x.sp = sp[k]; if (sp[k] === 'rainbow') x.color = -1; k++; } }
    window.dispatchEvent(new Event('resize')); }); await page.waitForTimeout(500);
  const spc = await page.evaluate(() => { const G = window.CFGame.state(), g = G.game, o = []; for (let c = 0; c < g.C; c++) { const x = g.grid[0][c]; if (x && x.sp) o.push(x.sp + ':' + G.tiles[x.id].el.querySelectorAll('.spr').length + ':' + (G.tiles[x.id].el.querySelector('.ov,.s-sp') ? 1 : 0)); } return o; });
  ok(spc.length === 4 && spc.every(s => s.endsWith(':1')), 'จรวด/ระเบิด/สายรุ้ง มีภาพเฉพาะ แยกจากขนมธรรมดา (' + spc.join(' ') + ')');
  await page.screenshot({ path: path.join(OUT, 'gfx-3-specials.png') });
  /* เล่นจริง + วัด FPS + ตรวจ element สะสม */
  const dom0 = await page.evaluate(() => document.querySelectorAll('#scr-game *').length);
  let fpsMin = 999, fpsSum = 0, fpsN = 0, bad = 0;
  for (let round = 0; round < 3; round++) {
    await page.evaluate(n => window.CFGame.start(n), [17, 6, 9][round]); await page.waitForTimeout(300);
    for (let i = 0; i < 12; i++) {
      await idle(page); if (await page.evaluate(() => !document.querySelector('#modal').hidden)) break;
      const m = await page.evaluate(() => window.CFEngine.botPick(window.CFGame.state().game, Math.random)); if (!m) break;
      await drag(page, m); await page.waitForTimeout(350);
      if (round === 0 && i === 2) await page.screenshot({ path: path.join(OUT, 'gfx-4-effects.png') });
      await idle(page); if (await page.evaluate(() => !document.querySelector('#modal').hidden)) break;
      const d = await domOk(page); if (d.bad || d.dom !== d.n) bad++;
      const f = await page.evaluate(() => window.CFGame.gfx.fps); if (f) { fpsMin = Math.min(fpsMin, f); fpsSum += f; fpsN++; }
    }
    await page.evaluate(() => { const m = document.querySelector('#modal'); if (!m.hidden) { const b = document.querySelector('[data-map]'); if (b) b.click(); } });
  }
  ok(bad === 0, 'เล่น 3 ด่านต่อเนื่อง ภาพตรงกับสถานะเกมทุกตา ไม่มีแอนิเมชันค้าง');
  await page.evaluate(() => window.CFGame.start(17)); await page.waitForTimeout(1500);
  const dom1 = await page.evaluate(() => ({ all: document.querySelectorAll('#scr-game *').length, fx: document.querySelector('#l-fx').children.length, fly: document.querySelectorAll('.coinfly,.cf,.fw').length }));
  ok(dom1.fx === 0 && dom1.fly === 0 && Math.abs(dom1.all - dom0) <= 12, 'ไม่มี element เอฟเฟกต์สะสม (ก่อน ' + dom0 + ' / หลัง ' + dom1.all + ' · เอฟเฟกต์ค้าง ' + dom1.fx + ')');
  const mem = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
  console.log('  · FPS (Chrome headless, เรนเดอร์ด้วยซอฟต์แวร์ ไม่ใช่เครื่องจริง): เฉลี่ย ' + Math.round(fpsSum / Math.max(1, fpsN)) + ' ต่ำสุด ' + fpsMin + ' · JS heap ' + mem + ' MB · โหลดหน้าแรก ' + loadMs + ' ms');
  const bytes = reqs.filter(u => /assets\//.test(u)).map(u => u.split('/').pop().split('?')[0]);
  console.log('  · ภาพที่โหลดจริงบนมือถือ: ' + [...new Set(bytes)].join(', '));
  ok(!bytes.some(b => /wide|bg-720/.test(b)), 'มือถือไม่โหลดภาพ 4K/ภาพจอกว้าง (Adaptive Resolution)');
  /* ตั้งค่ากราฟิก */
  const before = await page.evaluate(() => localStorage.getItem('cfa_save_v1'));
  await page.evaluate(() => window.CFGame.setGfx('low'));
  ok(await page.evaluate(() => document.body.classList.contains('gfx-low')), 'ตั้งค่า LOW → ลดเอฟเฟกต์ทันที');
  await page.reload(); await page.waitForSelector('#scr-home.on');
  ok(await page.evaluate(() => window.CFGame.gfx.mode === 'low' && document.body.classList.contains('gfx-low')) && await page.evaluate(() => localStorage.getItem('cfa_save_v1')) === before, 'ค่ากราฟิกจำได้หลังเปิดใหม่ และไม่แตะข้อมูลเซฟ');
  await page.evaluate(() => window.CFGame.setGfx('auto')); ok(await page.evaluate(() => window.CFGame.gfx.mode) === 'auto', 'ค่าเริ่มต้น/กลับเป็น AUTO ได้');
  await page.click('#btn-settings', { force: true }); await page.waitForSelector('[data-gfx]'); ok(await page.locator('[data-gfx]').count() === 3, 'หน้าตั้งค่ามี AUTO / HIGH / LOW');
  await page.screenshot({ path: path.join(OUT, 'gfx-5-settings.png') });
  ok(errs.length === 0, 'ไม่มี JavaScript error' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
  await ctx.close();

  console.log('\n■ จอ 1x (360×640) และ Fallback เมื่อโหลดภาพไม่ได้');
  const c2 = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 1 }), p2 = await c2.newPage();
  await p2.goto('http://127.0.0.1:8377/'); await p2.waitForSelector('#scr-home.on');
  ok(await p2.evaluate(() => window.CFArt.SPR.size) === 96, 'จอ 1x เลือก Sprite ขนาดเล็ก (96px) ประหยัดหน่วยความจำ');
  await c2.close();
  const c3 = await browser.newContext({ viewport: { width: 390, height: 844 } }), p3 = await c3.newPage(), e3 = [];
  p3.on('pageerror', e => e3.push(String(e)));
  await p3.route('**/assets/**', r => r.abort());
  await p3.goto('http://127.0.0.1:8377/'); await p3.waitForSelector('#scr-home.on'); await p3.evaluate(() => window.CFGame.start(1)); await p3.waitForTimeout(400);
  ok(await p3.evaluate(() => !document.documentElement.classList.contains('spr-ok') && document.querySelectorAll('#l-tiles .tile svg').length === 49) && !e3.length, 'ภาพ 3D โหลดไม่ได้ → ใช้กราฟิก SVG เดิมแทน เกมยังเล่นได้');
  const m = await p3.evaluate(() => window.CFEngine.botPick(window.CFGame.state().game, Math.random)); await drag(p3, m); await idle(p3);
  ok(await p3.evaluate(() => window.CFGame.state().game.moves) === 13, 'โหมด Fallback: จับคู่และหักตาเดินถูกต้อง');
  await c3.close();
}


/* ---------- local003: รูปผู้เล่น ---------- */
async function photo(browser) {
  console.log('\n■ รูปผู้เล่น (มือถือ 390×844)');
  const IMG = n => path.join(__dirname, n);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8377/'); await page.waitForSelector('#scr-home.on');
  await page.evaluate(() => { window.CFSave.addCoins(777); });
  const save0 = await page.evaluate(() => localStorage.getItem('cfa_save_v1'));
  ok(await page.locator('#pf-avatar').isVisible() && !(await page.evaluate(() => window.CFPhoto.has())), 'HOME มีปุ่มรูปผู้เล่น (ยังไม่ได้อัปโหลดรูป)');
  await page.waitForFunction(() => { const i = document.querySelector('#pf-home img'); return i && /character\/game/.test(i.src) && i.naturalWidth > 0; }, null, { timeout: 5000 }).catch(() => {});
  const def = await page.evaluate(() => ({ home: /character\/game/.test(document.querySelector('#pf-home img').src) && !document.querySelector('#pf-home').hidden, av: /character\/profile/.test((document.querySelector('#pf-avatar img') || {}).src || ''), win: /character\/win/.test(window.CFPhoto.winHTML()), hit: (() => { const a = document.querySelector('#pf-home').getBoundingClientRect(); return [...document.querySelectorAll('#btn-play,.home-row .btn')].some(b => { const r = b.getBoundingClientRect(); return !(a.right <= r.left || a.left >= r.right || a.bottom <= r.top || a.top >= r.bottom); }); })() }));
  ok(def.home && def.av && def.win, 'ตัวการ์ตูนประจำเกมแสดงเป็นค่าเริ่มต้น (HOME / โปรไฟล์ / ผ่านด่าน)');
  ok(!def.hit, 'ตัวการ์ตูนหน้า HOME ไม่ทับปุ่ม PLAY / SHOP / REWARDS / SETTINGS');
  await page.screenshot({ path: path.join(OUT, 'char-1-home.png') });
  await page.evaluate(() => window.CFGame.start(1)); await page.waitForTimeout(400);
  ok(await page.evaluate(() => /character\/profile/.test((document.querySelector('.g-char img') || {}).src || '')), 'GAME แสดงตัวการ์ตูนประจำเกม');
  await page.screenshot({ path: path.join(OUT, 'char-2-game.png') });
  await page.evaluate(() => { document.querySelector('#g-pause').click(); }); await page.click('[data-map]', { force: true }); await page.click('#map-back', { force: true }); await page.waitForSelector('#scr-home.on');
  const toast = () => page.evaluate(() => document.querySelector('#toast').textContent);
  await page.setInputFiles('#pf-file', { name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(11 * 1024 * 1024, 1) }); await page.waitForTimeout(200);
  ok(/10 MB/.test(await toast()) && await page.locator('.pf-crop').count() === 0, 'ไฟล์เกิน 10 MB ถูกปฏิเสธ');
  await page.setInputFiles('#pf-file', { name: 'a.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') }); await page.waitForTimeout(200);
  ok(/JPG/.test(await toast()) && await page.locator('.pf-crop').count() === 0, 'ไฟล์ที่ไม่ใช่ JPG/PNG/WEBP ถูกปฏิเสธ');
  await page.setInputFiles('#pf-file', IMG('test-photo-a.png')); await page.waitForSelector('.pf-crop .pf-img');
  ok(true, 'เลือกรูป PNG → หน้า Preview / Crop เปิด');
  const t0 = await page.evaluate(() => document.querySelector('.pf-img').style.transform);
  const bx = await page.locator('.pf-crop').boundingBox();
  await page.evaluate(() => { const z = document.querySelector('.pf-zoom'); z.value = 2; z.dispatchEvent(new Event('input')); });
  await page.mouse.move(bx.x + 135, bx.y + 180); await page.mouse.down(); await page.mouse.move(bx.x + 95, bx.y + 130, { steps: 4 }); await page.mouse.up();
  const t1 = await page.evaluate(() => { const i = document.querySelector('.pf-img'), b = i.getBoundingClientRect(), c = document.querySelector('.pf-crop').getBoundingClientRect(); return { t: i.style.transform, cover: b.left <= c.left + .5 && b.top <= c.top + .5 && b.right >= c.right - .5 && b.bottom >= c.bottom - .5 }; });
  ok(t1.t !== t0 && t1.cover, 'ซูมและลากเลื่อนได้ รูปเต็มกรอบเสมอ');
  await page.screenshot({ path: path.join(OUT, 'photo-1-crop.png') });
  await page.click('[data-ok]'); await page.waitForSelector('#pf-avatar.has img'); await page.waitForTimeout(300);
  const dims = await page.evaluate(async () => { const one = u => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth + 'x' + i.naturalHeight); i.src = u; }); return [await one(window.CFPhoto.urls.sq), await one(window.CFPhoto.urls.pt)]; });
  ok(dims[0] === '512x512' && dims[1] === '720x960', 'สร้างภาพ PROFILE 512×512 และ CHARACTER 720×960');
  await page.screenshot({ path: path.join(OUT, 'photo-2-profile.png') });
  await page.click('[data-x]');
  ok(await page.locator('#pf-home').isVisible() && await page.locator('#pf-avatar img').isVisible(), 'HOME แสดงรูปโปรไฟล์และรูปตัวละคร');
  await page.screenshot({ path: path.join(OUT, 'photo-3-home.png') });
  const ls = await page.evaluate(() => Object.keys(localStorage).map(k => k + ':' + localStorage.getItem(k).length));
  ok(await page.evaluate(() => localStorage.getItem('cfa_save_v1')) === save0 && ls.every(x => +x.split(':')[1] < 4000), 'ไม่เก็บภาพใน Local Storage และเซฟเกมไม่เปลี่ยน (' + ls.join(', ') + ')');
  const rec = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('cfa_photo_v1', 1); q.onsuccess = () => { const g = q.result.transaction('photos').objectStore('photos').get('local'); g.onsuccess = () => r(g.result ? [g.result.sq.buf.byteLength, g.result.pt.buf.byteLength] : null); }; }));
  ok(rec && rec[0] > 500 && rec[1] > 500, 'ภาพถูกบันทึกใน IndexedDB (' + (rec ? Math.round((rec[0] + rec[1]) / 1024) + ' KB' : '-') + ')');
  /* GAME */
  await page.click('#btn-play', { force: true }); await page.click('.node.cur', { force: true }); await page.click('[data-go]', { force: true }); await page.waitForSelector('#scr-game.on'); await page.waitForTimeout(400);
  const lay = await page.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(), hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const c = r('.g-char'), b = r('#board'), bo = r('#boosters'), h = r('.hud'); return { vis: c.width > 40, board: hit(c, b), boost: hit(c, bo), fit: b.left >= 0 && b.right <= innerWidth && b.bottom <= bo.top + 1 && b.top >= h.bottom - 30, cs: window.CFGame.state().cs }; });
  ok(lay.vis && !lay.board && !lay.boost, 'GAME แสดงตัวละคร ไม่บังกระดานและปุ่มตัวช่วย');
  ok(lay.fit && lay.cs >= 36, 'กระดานยังพอดีจอ (ช่องละ ' + lay.cs + 'px)');
  await page.screenshot({ path: path.join(OUT, 'photo-4-game.png') });
  for (let i = 0; i < 40; i++) { await idle(page); if (await page.evaluate(() => !document.querySelector('#modal').hidden)) break;
    const m = await page.evaluate(() => window.CFEngine.botPick(window.CFGame.state().game, Math.random)); if (!m) break; await drag(page, m); await page.waitForTimeout(120); await page.click('#g-skip', { force: true }).catch(() => {}); }
  await page.waitForSelector('[data-next]', { timeout: 20000 }); await page.waitForTimeout(1300);
  ok(await page.locator('.pf-win img').isVisible() && await page.locator('.stars3').isVisible() && await page.evaluate(() => /^blob:/.test(document.querySelector('.pf-win img').src)), 'PASS LEVEL แสดงรูปที่อัปโหลด (แทนตัวการ์ตูน) พร้อมเอฟเฟกต์ฉลอง');
  await page.screenshot({ path: path.join(OUT, 'photo-5-win.png') });
  ok(await page.evaluate(() => window.CFSave.get().unlocked) === 2 && await page.evaluate(() => window.CFSave.get().pending.coins) >= 50, 'เกมเดิมทำงานปกติ: ผ่านด่าน ปลดล็อกด่าน 2 ได้รางวัล');
  await page.click('[data-map]', { force: true });
  /* ปิด-เปิดใหม่ */
  const coins = await page.evaluate(() => window.CFSave.get().coins);
  await page.reload(); await page.waitForSelector('#scr-home.on'); await page.waitForSelector('#pf-avatar.has img', { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => window.CFPhoto.has()) && await page.evaluate(() => window.CFSave.get().coins) === coins && await page.evaluate(() => window.CFSave.get().unlocked) === 2, 'ปิดแล้วเปิดใหม่: รูปยังอยู่ เหรียญและด่านไม่หาย');
  /* เปลี่ยนรูป */
  await page.click('#pf-avatar', { force: true }); await page.waitForSelector('[data-up]');
  await page.setInputFiles('#pf-file', IMG('test-photo-b.jpg')); await page.waitForSelector('.pf-crop .pf-img'); await page.click('[data-ok]'); await page.waitForSelector('.pf-big img'); await page.waitForTimeout(300);
  const rec2 = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('cfa_photo_v1', 1); q.onsuccess = () => { const g = q.result.transaction('photos').objectStore('photos').get('local'); g.onsuccess = () => r([g.result.sq.buf.byteLength, g.result.pt.buf.byteLength]); }; }));
  ok(rec2[0] !== rec[0], 'เปลี่ยนรูป (JPG) ได้ และบันทึกทับรูปเดิม');
  /* ลบรูป */
  await page.click('[data-del]'); await page.click('[data-del]'); await page.waitForFunction(() => !window.CFPhoto.has());
  await page.reload(); await page.waitForSelector('#scr-home.on'); await page.waitForTimeout(400);
  ok(!(await page.evaluate(() => window.CFPhoto.has())) && await page.evaluate(() => /character\/game/.test(document.querySelector('#pf-home img').src)), 'ลบรูปได้ เปิดใหม่ก็ไม่กลับมา (กลับเป็นตัวการ์ตูนประจำเกม)');
  await page.evaluate(() => window.CFGame.start(2)); await page.waitForTimeout(300);
  ok(await page.evaluate(() => /character\/profile/.test(document.querySelector('.g-char img').src)) && await page.locator('#l-tiles .tile').count() > 40, 'ไม่มีรูปผู้เล่น → ใช้ตัวการ์ตูนประจำเกม กระดานปกติ');
  ok(errs.length === 0, 'ไม่มี JavaScript error' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
  await ctx.close();

  console.log('\n■ รูปผู้เล่น (Desktop 1366×768)');
  const c2 = await browser.newContext({ viewport: { width: 1366, height: 768 } }), p2 = await c2.newPage();
  await p2.goto('http://127.0.0.1:8377/'); await p2.waitForSelector('#scr-home.on');
  await p2.click('#pf-avatar', { force: true }); await p2.setInputFiles('#pf-file', IMG('test-photo-a.png')); await p2.waitForSelector('.pf-crop .pf-img'); await p2.click('[data-ok]'); await p2.waitForSelector('.pf-big img'); await p2.click('[data-x]');
  await p2.evaluate(() => window.CFGame.start(1)); await p2.waitForTimeout(500);
  const d = await p2.evaluate(() => { const s = document.querySelector('#pf-side').getBoundingClientRect(), a = document.querySelector('#app').getBoundingClientRect(); return { vis: s.width > 150 && getComputedStyle(document.querySelector('#pf-side')).display !== 'none', clear: s.right <= a.left + 1 && s.left >= 0 }; });
  ok(d.vis && d.clear, 'Desktop: ตัวละครครึ่งตัวอยู่ข้างกระดาน ไม่ทับพื้นที่เกม');
  await p2.screenshot({ path: path.join(OUT, 'photo-6-desktop.png') });
  await c2.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(8377, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  try {
    if (process.env.CF_ONLY === 'photo') { await photo(browser); throw { message: 'SKIP-REST' }; }
    await flow(browser, 'mobile', { width: 390, height: 844 }, true);
    await flow(browser, 'mobile-small', { width: 360, height: 640 }, true);
    await flow(browser, 'desktop', { width: 1366, height: 768 }, false);
    await gfx(browser);
    await photo(browser);
    console.log('\n■ เปิดไฟล์ตรง ๆ (file://) แบบ Open check');
    const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } }), page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto('file://' + path.join(APP, 'index.html')); await page.waitForSelector('#scr-home.on');
    await clk(page, '#btn-play'); await clk(page, '.node.cur'); await clk(page, '[data-go]'); await page.waitForSelector('#scr-game.on');
    ok(await page.locator('#l-tiles .tile').count() === 49 && !errs.length, 'ดับเบิลคลิก index.html เล่นได้เลย (กระดาน 7×7 = 49 ชิ้น)');
    await ctx.close();
  } catch (e) { if (e.message === 'SKIP-REST') console.log('(รันเฉพาะส่วนรูปผู้เล่น)'); else { fail++; console.log('  ✗ EXCEPTION: ' + e.message.split('\n').slice(0, 4).join(' / ')); } }
  await browser.close(); server.close();
  console.log('\nผลรวม Browser: PASS ' + pass + ' / FAIL ' + fail);
  process.exit(fail ? 1 : 0);
})();
