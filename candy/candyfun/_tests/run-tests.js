/* ชุดทดสอบ Node: node _tests/run-tests.js  (ไม่ต้องติดตั้งอะไรเพิ่ม) */
'use strict';
const path = require('path');
const APP = process.env.CF_APP || (require('fs').existsSync(path.join(__dirname, '..', 'index.html')) ? path.join(__dirname, '..') : path.join(__dirname, '..', 'candyfun'));
const E = require(path.join(APP, 'js/engine.js'));
const L = require(path.join(APP, 'js/levels.js'));
const S = require(path.join(APP, 'js/save.js'));

let pass = 0, fail = 0;
function ok(cond, name) { if (cond) pass++; else { fail++; console.log('  ✗ FAIL: ' + name); } }
function section(s) { console.log('\n■ ' + s); }

function flat(rows, cols, colors) {
  return { rows, cols, colors: colors || 5, moves: 20, layout: Array(rows).fill('.'.repeat(cols)), goals: [{ type: 'score', target: 1e9 }] };
}
function setBoard(g, rows) {
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const x = g.grid[r][c];
    x.color = Number(ch); x.sp = null;
  }));
}
function noMatches(g) { return g.findGroups().length === 0; }
function ids(g) { const s = []; g.grid.forEach(row => row.forEach(x => x && s.push(x.id))); return s; }

/* จำลองฝั่ง UI: เล่น events ซ้ำบนโมเดลเงา แล้วต้องตรงกับสถานะจริงของ engine */
function snapshot(g) {
  const m = new Map();
  g.grid.forEach((row, r) => row.forEach((x, c) => { if (x) m.set(x.id, { r, c, t: x.t, color: x.color, sp: x.sp || null, hp: x.hp }); }));
  return m;
}
function replay(shadow, ev) {
  for (const e of ev) {
    if (e.type === 'swap') { for (const k of ['a', 'b']) { const t = shadow.get(e[k].id); t.r = e[k].r; t.c = e[k].c; } }
    else if (e.type === 'clear') {
      e.transformed.forEach(t => { shadow.get(t.id).sp = t.sp; });
      e.removed.forEach(t => { if (!shadow.delete(t.id)) throw new Error('remove unknown id'); });
      e.boxes.forEach(b => { if (b.hp <= 0) shadow.delete(b.id); else shadow.get(b.id).hp = b.hp; });
      e.created.forEach(t => shadow.set(t.id, { r: t.r, c: t.c, t: 'c', color: t.color, sp: t.sp }));
    } else if (e.type === 'fall') {
      e.moves.forEach(m => { const t = shadow.get(m.id); if (t.r !== m.fr || t.c !== m.fc) throw new Error('fall from mismatch'); t.r = m.r; t.c = m.c; });
      e.spawns.forEach(s => shadow.set(s.id, { r: s.r, c: s.c, t: 'c', color: s.color, sp: null }));
    } else if (e.type === 'shuffle') {
      e.tiles.forEach(t => { const x = shadow.get(t.id); x.r = t.r; x.c = t.c; x.color = t.color; x.sp = t.sp || null; });
    }
  }
}
function sameState(shadow, g) {
  const real = snapshot(g);
  if (real.size !== shadow.size) return false;
  for (const [id, a] of real) {
    const b = shadow.get(id);
    if (!b || a.r !== b.r || a.c !== b.c || a.color !== b.color || (a.sp || null) !== (b.sp || null)) return false;
    if (a.t === 'box' && a.hp !== b.hp) return false;
  }
  const seen = new Set();
  for (const [, b] of shadow) { const k = b.r + ',' + b.c; if (seen.has(k)) return false; seen.add(k); }
  return true;
}

/* ---------------------------------------------------------------- */
section('1) ตรวจจับ Match-3 / ขนมพิเศษ');
{
  const g = new E.Game(flat(6, 6), { rand: E.makeRng(1) });
  setBoard(g, ['012340', '120431', '001234', '123401', '234012', '340123']);
  ok(noMatches(g), 'กระดานตั้งต้นไม่มี match');
  const before = g.moves;
  ok(g.swap(0, 0, 0, 1) === null, 'สลับที่ไม่เกิด match ต้องคืน null');
  ok(g.moves === before && g.grid[0][0].color === 0, 'สลับไม่สำเร็จ: ตาเดิน/กระดานไม่เปลี่ยน');
  ok(g.swap(0, 0, 2, 2) === null, 'สลับช่องไม่ติดกันไม่ได้');
  /* (1,0)=1 สลับลง (2,0)=0 → แถว 2: 1 0 1.. ไม่ match ; ใช้เคสจริง: (1,2)=0 ลงไป (2,2) → แถว2: 0 0 0 */
  const ev = g.swap(1, 2, 2, 2);
  ok(Array.isArray(ev) && ev[0].type === 'swap' && ev[1].type === 'clear', 'จับคู่ 3 ชิ้นสำเร็จ');
  ok(ev[1].removed.length >= 3 && g.moves === before - 1, 'ลบ ≥3 ชิ้น และหักตาเดิน 1');
  ok(noMatches(g), 'หลัง resolve ไม่มี match ค้าง');
}
{
  const g = new E.Game(flat(6, 6), { rand: E.makeRng(2) });
  setBoard(g, ['112144', '334233', '443412', '120340', '234012', '340123']);
  /* แถว 0: 1 1 2 1 → สลับ (0,2)<->(1,2)=4? ไม่ใช่ ใช้ (0,2)=2 กับ (0,3)=1 → 1 1 1 2 (3 ชิ้น) */
  g.grid[1][2].color = 1; /* ให้ (1,2)=1 → สลับขึ้นไปที่ (0,2) ได้ 1 1 1 1 = 4 ชิ้น */
  const ev = g.swap(1, 2, 0, 2);
  ok(ev && ev[1].created.length === 1 && (ev[1].created[0].sp === 'h' || ev[1].created[0].sp === 'v'), 'เรียง 4 ชิ้น → จรวด');
  ok(ev && ev[1].created[0].r === 0 && ev[1].created[0].c === 2, 'จรวดเกิดที่ช่องที่ผู้เล่นสลับ');
}
{
  const g = new E.Game(flat(6, 6), { rand: E.makeRng(3) });
  setBoard(g, ['110114', '331233', '443412', '120340', '234012', '340123']);
  const ev = g.swap(1, 2, 0, 2); /* 1 1 [1] 1 1 = 5 ชิ้น */
  ok(ev && ev[1].created.some(x => x.sp === 'rainbow'), 'เรียง 5 ชิ้น → ลูกอมสายรุ้ง');
}
{
  const g = new E.Game(flat(6, 6), { rand: E.makeRng(4) });
  setBoard(g, ['112034', '330233', '441412', '121340', '234012', '340123']);
  /* (0,0)(0,1)=1 ; คอลัมน์ 2: (1,2)... ทำตัว L: ต้องการ (0,2)=1,(1,2)=1,(2,2)=1 → ตั้ง (1,2)=1 และ (2,2)=1, สลับ (0,3)... */
  g.grid[1][2].color = 1; g.grid[0][3].color = 1; g.grid[0][2].color = 0;
  /* แถว0: 1 1 0 1 ; คอลัมน์2: 0,1,1 → สลับ (0,2)<->(0,3): แถว0 = 1 1 1 0 + คอลัมน์ 2 = 1 1 1 → L */
  const ev = g.swap(0, 3, 0, 2);
  ok(ev && ev[1].created.some(x => x.sp === 'bomb'), 'เรียงรูปตัว L → ระเบิด');
}

section('2) ผลของขนมพิเศษและพลังรวม');
{
  const g = new E.Game(flat(7, 7), { rand: E.makeRng(5) });
  g.grid[3][3].sp = 'h'; g.grid[3][4].sp = 'v';
  const ev = g.swap(3, 3, 3, 4);
  ok(ev && ev[1].removed.length >= 13, 'จรวด+จรวด ล้างทั้งแถวและคอลัมน์ (' + (ev && ev[1].removed.length) + ')');
  ok(noMatches(g), 'ไม่มี match ค้างหลังพลังรวม');
}
{
  const g = new E.Game(flat(7, 7), { rand: E.makeRng(6) });
  g.grid[3][3].sp = 'bomb'; g.grid[3][4].sp = 'bomb';
  const ev = g.swap(3, 3, 3, 4);
  ok(ev && ev[1].removed.length >= 20, 'ระเบิด+ระเบิด ล้างพื้นที่ 5×5');
}
{
  const g = new E.Game(flat(7, 7), { rand: E.makeRng(7) });
  g.grid[3][3].sp = 'rainbow'; g.grid[3][3].color = -1;
  const k = g.grid[3][4].color;
  let cnt = 0; g.grid.forEach(row => row.forEach(x => { if (x.color === k) cnt++; }));
  const ev = g.swap(3, 3, 3, 4);
  ok(ev && ev[1].removed.filter(x => x.color === k).length === cnt, 'สายรุ้ง+ขนมสี ลบสีนั้นทั้งกระดาน');
}
{
  const g = new E.Game(flat(7, 7), { rand: E.makeRng(8) });
  g.grid[3][3].sp = 'rainbow'; g.grid[3][3].color = -1; g.grid[3][4].sp = 'rainbow'; g.grid[3][4].color = -1;
  const ev = g.swap(3, 3, 3, 4);
  ok(ev && ev[1].removed.length === 49, 'สายรุ้ง+สายรุ้ง ล้างทั้งกระดาน');
}

section('3) สิ่งกีดขวาง: กล่องของขวัญ / เยลลี่ / ช่องว่าง');
{
  const lv = { rows: 6, cols: 6, colors: 5, moves: 30, layout: ['......', '......', '.jj...', '..b...', '......', '......'], goals: [{ type: 'jelly' }, { type: 'box' }] };
  const g = new E.Game(lv, { rand: E.makeRng(9) });
  ok(g.boxLeft === 1 && g.jellyLeft === 2, 'นับกล่อง/เยลลี่ตั้งต้นถูกต้อง');
  ok(g.swap(3, 2, 3, 3) === null, 'กล่องของขวัญสลับไม่ได้');
  const e1 = g.useBooster('hammer', 3, 2);
  ok(e1 && g.boxLeft === 0, 'ค้อนทุบกล่องได้');
  const e2 = g.useBooster('bomb', 2, 1);
  ok(e2 && g.jellyLeft === 0, 'ระเบิด 3×3 ล้างเยลลี่');
  ok(g.status() === 'won', 'ครบเป้าหมาย → สถานะ won');
}
{
  const lv = { rows: 7, cols: 7, colors: 5, moves: 30, layout: ['.......', '.bbbbb.', '.......', '..###..', '.......', '.......', '.......'], goals: [{ type: 'score', target: 1e9 }] };
  let okAll = true, filled = true;
  for (let seed = 1; seed <= 40 && okAll; seed++) {
    const rand = E.makeRng(seed), g = new E.Game(lv, { rand });
    for (let i = 0; i < 25; i++) {
      const m = E.botPick(g, rand); if (!m) break;
      const sh = snapshot(g), ev = g.swap(m.r1, m.c1, m.r2, m.c2);
      try { replay(sh, ev); if (!sameState(sh, g)) okAll = false; } catch (err) { okAll = false; }
      if (!noMatches(g)) okAll = false;
    }
    /* ช่องใต้กล่องต้องถูกเติมด้วยการไหลแนวทแยง (ขอบซ้าย/ขวาเปิด) */
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (!g.hole[r][c] && !g.grid[r][c]) filled = false;
  }
  ok(okAll, 'events ↔ สถานะจริง ตรงกันทุกตา (กระดานมีกล่อง+ช่องว่าง)');
  ok(filled, 'ไม่มีช่องว่างค้างใต้กล่อง (ไหลแนวทแยงทำงาน)');
}

section('4) ตัวช่วย 6 ชนิด');
{
  const mk = s => new E.Game(flat(7, 7), { rand: E.makeRng(s) });
  let g = mk(11); const id = g.grid[3][3].id;
  let ev = g.useBooster('hammer', 3, 3);
  ok(ev && ev[0].removed.some(x => x.id === id) && g.moves === 20, 'ค้อน: ลบ 1 ช่อง ไม่เสียตาเดิน');
  g = mk(12); ev = g.useBooster('bomb', 3, 3); ok(ev && ev[0].removed.length >= 9, 'ระเบิด: 3×3');
  g = mk(13); ev = g.useBooster('rocket', 2, 4, 'h'); ok(ev && ev[0].removed.filter(x => x.r === 2).length === 7, 'จรวดแนวนอน: ทั้งแถว');
  g = mk(14); ev = g.useBooster('rocket', 2, 4, 'v'); ok(ev && ev[0].removed.filter(x => x.c === 4).length === 7, 'จรวดแนวตั้ง: ทั้งคอลัมน์');
  g = mk(15); const k = g.grid[0][0].color; let cnt = 0; g.grid.forEach(r => r.forEach(x => { if (x.color === k) cnt++; }));
  ev = g.useBooster('rainbow', 0, 0); ok(ev && ev[0].removed.filter(x => x.color === k).length === cnt, 'สายรุ้ง: ลบสีเดียวกันทั้งหมด');
  g = mk(16); const b4 = ids(g).sort().join(); ev = g.useBooster('shuffle');
  ok(ev && ev[0].type === 'shuffle' && ids(g).sort().join() === b4 && noMatches(g) && g.findMoves(true).length > 0, 'สลับมหัศจรรย์: ขนมครบ ไม่มี match ค้าง มีทางเดิน');
  g = mk(17); g.useBooster('moves5'); ok(g.moves === 25, 'เพิ่ม 5 ตา');
}

section('5) กระดานไม่มีทางเดิน → สลับอัตโนมัติ');
{
  const g = new E.Game(flat(4, 4, 6), { rand: E.makeRng(21) });
  setBoard(g, ['0123', '2345', '4501', '0123']);
  ok(g.findMoves(true).length === 0, 'ตรวจได้ว่าไม่มีทางเดิน');
  const ev = []; g._resolve(ev, 0);
  ok(ev.some(e => e.type === 'shuffle') && (g.findMoves(true).length > 0 || g.stuck), 'เรียก shuffle อัตโนมัติ และมีทางเดินใหม่');
}

section('6) เล่นสุ่มจำนวนมาก: ความถูกต้องของ engine + ลำดับ events');
{
  let bad = 0, games = 0, combos = 0;
  for (const n of [1, 6, 9, 12, 13, 17, 19, 21, 26, 29, 37, 55, 88, 131, 240, 377, 512, 999]) {
    const lv = L.get(n);
    for (let s = 0; s < 6; s++) {
      const rand = E.makeRng(n * 100 + s), g = new E.Game(lv, { rand, moves: 40 });
      games++;
      let guard = 0;
      while (g.status() === 'playing' && guard++ < 40) {
        const m = E.botPick(g, rand); if (!m) { bad++; break; }
        const sh = snapshot(g), sc = g.score, mv = g.moves, ev = g.swap(m.r1, m.c1, m.r2, m.c2);
        if (!ev) { bad++; break; }
        try { replay(sh, ev); if (!sameState(sh, g)) bad++; } catch (e) { bad++; }
        if (!noMatches(g) || g.score < sc || g.moves !== mv - 1) bad++;
        if (new Set(ids(g)).size !== ids(g).length) bad++;
        ev.forEach(e => { if (e.type === 'clear' && e.combo >= 2) combos++; });
      }
      if (g.status() === 'won') { const sh = snapshot(g), ev = g.finale(); try { replay(sh, ev); if (!sameState(sh, g)) bad++; } catch (e) { bad++; } }
    }
  }
  ok(bad === 0, 'ไม่มีความผิดพลาดใน ' + games + ' เกม');
  ok(combos > 50, 'คอมโบลูกโซ่เกิดจริง (' + combos + ' ครั้ง)');
}

section('7) ระบบเหรียญ / ร้านค้า / บันทึก');
{
  let store = null, t = new Date(2026, 10, 21, 10, 0, 0).getTime();
  const ad = { read: () => store, write: s => { store = s; } };
  S.init(ad, () => t);
  ok(S.get().coins === 0 && S.get().unlocked === 1, 'เริ่มเกมใหม่: 0 เหรียญ ด่าน 1');
  ok(S.buy('hammer') === false && S.get().coins === 0 && S.get().inv.hammer === 0, 'เหรียญไม่พอ ซื้อไม่ได้ เหรียญไม่ติดลบ');
  ok(S.spend(-50) === false && S.spend(1) === false, 'spend ค่าลบ/เกินยอด ถูกปฏิเสธ');
  ok(S.useItem('hammer') === false, 'ใช้ไอเทมเกินจำนวนไม่ได้');
  let p = S.recordWin(1, 3, 5000);
  ok(p.coins === 120 && S.get().coins === 0, 'ผ่านด่าน 3 ดาวครั้งแรก = 100+20 (รอรับ)');
  ok(S.claimPending().coins === 120 && S.get().coins === 120, 'กดรับรางวัล → +120');
  ok(S.claimPending() === null && S.get().coins === 120, 'กดรับซ้ำ → ไม่เพิ่มเหรียญ');
  p = S.recordWin(1, 2, 3000); S.claimPending();
  ok(p.coins === 50 && S.get().stars[1] === 3 && S.get().best[1] === 5000, 'เล่นซ้ำ: ไม่ได้โบนัสครั้งแรกซ้ำ ดาว/คะแนนสูงสุดไม่ลด');
  ok(S.get().unlocked === 2, 'ปลดล็อกด่านถัดไปทันที');
  p = S.recordWin(5, 1, 100); ok(p.coins === 30 + 20 + 200, 'ครบ 5 ด่าน +200');
  p = S.recordWin(10, 1, 100); ok(p.coins === 30 + 20 + 500 && Object.keys(p.items).length === 1, 'ครบ 10 ด่าน +500 + หีบสมบัติ');
  /* ปิดเกมก่อนกดรับ → เปิดใหม่ต้องได้รับครั้งเดียว */
  const c0 = JSON.parse(store).coins; S.init(ad, () => t);
  ok(S.get().coins === c0 + 550 && S.get().pending === null, 'ปิดเกมก่อนรับรางวัล → เครดิตครั้งเดียวตอนเปิดใหม่');
  S.init(ad, () => t); ok(S.get().coins === c0 + 550, 'โหลดซ้ำไม่เพิ่มเหรียญ');
  const c1 = S.get().coins;
  ok(S.buy('hammer') && S.get().coins === c1 - 100 && S.get().inv.hammer === 1, 'ซื้อค้อน 100 เหรียญ เข้าคลัง');
  ok(S.useItem('hammer') && S.get().inv.hammer === 0 && !S.useItem('hammer'), 'ใช้ได้ตามจำนวนที่มีเท่านั้น');
  let d = S.claimDaily(); ok(d && d.coins === 50 && d.day === 1, 'รางวัลรายวัน วันที่ 1 = 50');
  ok(S.claimDaily() === null, 'รับรายวันซ้ำในวันเดียวกันไม่ได้');
  t += 86400000; d = S.claimDaily(); ok(d && d.day === 2 && d.coins === 75, 'วันถัดไป = วันที่ 2 (ต่อเนื่อง)');
  t += 3 * 86400000; d = S.claimDaily(); ok(d && d.day === 1, 'ขาดช่วง → เริ่มนับวันที่ 1 ใหม่');
  t -= 10 * 86400000; ok(S.dailyInfo().can === false, 'ย้อนนาฬิกาเครื่อง → รับไม่ได้'); t += 10 * 86400000;
  const ms = S.missions(); ok(ms.length === 3 && new Set(ms.map(m => m.id)).size === 3, 'ภารกิจประจำวัน 3 ภารกิจไม่ซ้ำ');
  const m0 = ms[0]; ok(S.claimMission(m0.id) === 0, 'ภารกิจยังไม่สำเร็จ รับไม่ได้');
  S.missionAdd(m0.id, m0.target); const c2 = S.get().coins;
  ok(S.claimMission(m0.id) === m0.reward && S.claimMission(m0.id) === 0 && S.get().coins === c2 + m0.reward, 'รับรางวัลภารกิจได้ครั้งเดียว');
  const g1 = S.claimGift(E.makeRng(3)); ok(g1 && S.claimGift() === null, 'กล่องของขวัญฟรี: รับแล้วต้องรอรอบถัดไป');
  t += 4 * 3600 * 1000 + 1; ok(S.claimGift(E.makeRng(4)) !== null, 'ครบ 4 ชม. รับกล่องของขวัญได้อีก');
  store = '{"coins":-999,"inv":{"hammer":-5,"bomb":"x"},"unlocked":"abc","stars":{"1":9}}'; S.init(ad, () => t);
  ok(S.get().coins === 0 && S.get().inv.hammer === 0 && S.get().inv.bomb === 0 && S.get().unlocked === 1 && S.get().stars[1] === 3, 'ข้อมูลเสีย/ถูกแก้ → ปรับเป็นค่าปลอดภัย');
  store = '{not json'; S.init(ad, () => t); ok(S.get().coins === 0, 'JSON พัง → เริ่มใหม่อย่างปลอดภัย');
  const priceOk = S.ITEMS.map(i => i.price).join() === '100,180,250,120,200,150';
  ok(priceOk, 'ราคาตัวช่วยตรงตามสเปก (100/180/250/120/200/150)');
}

section('8) ด่าน 1–30 (ออกแบบ) + ระบบสร้างด่านถึง 1,000+ : โครงสร้างและ "ผ่านได้จริง"');
{
  const list = [];
  for (let n = 1; n <= 60; n++) list.push(n);
  for (let n = 65; n <= 1000; n += 17) list.push(n);
  list.push(1000, 1001, 1500, 5000);
  let structBad = 0, minRate = 1, minAt = 0, sumRate = 0, maxMoves = 0, t0 = Date.now(), slow = 0, rows = [];
  for (const n of list) {
    const t1 = Date.now(), lv = L.get(n), dt = Date.now() - t1; if (dt > slow) slow = dt;
    const cells = lv.layout.join('').replace(/#/g, '').length;
    if (lv.layout.length !== lv.rows || lv.layout.some(r => r.length !== lv.cols) || cells < 36 || !lv.goals.length || !(lv.moves >= 10) || !(lv.stars[1] > lv.stars[0])) structBad++;
    if ((n % 5 === 0) !== !!lv.bonus) structBad++;
    const g0 = new E.Game(lv, { rand: E.makeRng(n) });
    if (!g0.findMoves(true).length || g0.findGroups().length) structBad++;
    let wins = 0; const K = 30;
    for (let s = 0; s < K; s++) if (E.simulate(lv, E.makeRng(900000 + n * 37 + s), lv.moves, lv.moves).won) wins++;
    const rate = wins / K; sumRate += rate;
    if (rate < minRate) { minRate = rate; minAt = n; }
    if (lv.moves > maxMoves) maxMoves = lv.moves;
    if (n <= 30) rows.push(String(n).padStart(2) + ' | ' + (lv.rows + 'x' + lv.cols) + ' | สี ' + lv.colors + ' | ตา ' + String(lv.moves).padStart(2) + ' | ' +
      lv.goals.map(g => g.type === 'score' ? 'คะแนน ' + g.target : g.type === 'color' ? 'เก็บสี' + g.color + '×' + g.target : g.type).join(', ').padEnd(34) + ' | บอทผ่าน ' + Math.round(rate * 100) + '%');
  }
  console.log(rows.join('\n'));
  console.log('  ตรวจ ' + list.length + ' ด่าน · อัตราผ่านของบอทเฉลี่ย ' + Math.round(sumRate / list.length * 100) + '% · ต่ำสุด ' + Math.round(minRate * 100) + '% (ด่าน ' + minAt + ') · ตาเดินสูงสุด ' + maxMoves + ' · สร้างด่านช้าสุด ' + slow + 'ms');
  ok(structBad === 0, 'โครงสร้างด่านถูกต้องทุกด่าน (กระดานมีทางเล่น ไม่มี match ตั้งต้น ด่านโบนัสทุก 5 ด่าน)');
  ok(minRate >= 0.5, 'ทุกด่านผ่านได้จริงโดยไม่ใช้ตัวช่วย (บอทผ่าน ≥50% ทุกด่าน)');
  ok(sumRate / list.length >= 0.7, 'ความยากเฉลี่ยไม่สูงเกินไป (บอทผ่านเฉลี่ย ≥70%)');
  ok(maxMoves <= 45, 'จำนวนตาเดินไม่ยืดเยื้อ (≤45)');
  const a = JSON.stringify(L.get(123)); delete require.cache[require.resolve(path.join(APP, 'js/levels.js'))];
  ok(JSON.stringify(require(path.join(APP, 'js/levels.js')).get(123)) === a, 'ด่านที่สร้างอัตโนมัติคงที่ (deterministic)');
}

console.log('\n══════════════════════════════');
console.log('ผลรวม: PASS ' + pass + ' / FAIL ' + fail);
process.exit(fail ? 1 : 0);
