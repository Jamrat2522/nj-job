/* CANDY FUN ADVENTURE — save.js
 * เหรียญ / คลังตัวช่วย / ความคืบหน้า / รางวัลรายวัน / ภารกิจ — บันทึกอัตโนมัติ (Local Storage)
 * ออกแบบให้เปลี่ยน adapter เป็น Cloud Save ได้ภายหลัง (Save.init({read, write}))
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CFSave = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'cfa_save_v1';
  var ITEMS = [
    { k: 'hammer', ic: '🔨', name: 'ค้อนวิเศษ', desc: 'ทุบขนม 1 ช่อง', price: 100, target: true },
    { k: 'bomb', ic: '💣', name: 'ระเบิด', desc: 'ระเบิดพื้นที่ 3×3', price: 180, target: true },
    { k: 'rainbow', ic: '🌈', name: 'สายรุ้ง', desc: 'ลบขนมสีเดียวกันทั้งหมด', price: 250, target: true },
    { k: 'shuffle', ic: '🔀', name: 'สลับมหัศจรรย์', desc: 'สุ่มสลับขนมทั้งกระดาน', price: 120 },
    { k: 'moves5', ic: '✨', name: 'เพิ่ม 5 ตา', desc: 'เพิ่มจำนวนเดิน 5 ครั้ง', price: 200 },
    { k: 'rocket', ic: '🚀', name: 'จรวด', desc: 'ทำลายทั้งแถวหรือคอลัมน์', price: 150, target: true }
  ];
  var PRICE = {}; ITEMS.forEach(function (i) { PRICE[i.k] = i.price; });
  var DAILY = [50, 75, 100, 125, 150, 175, 200];
  var MISSIONS = [
    { id: 'win3', text: 'ผ่านด่าน 3 ด่าน', target: 3, reward: 80 },
    { id: 'clear150', text: 'เก็บขนม 150 ชิ้น', target: 150, reward: 60 },
    { id: 'combo3', text: 'ทำคอมโบ ×3 ให้ได้ 3 ครั้ง', target: 3, reward: 70 },
    { id: 'special6', text: 'สร้างขนมพิเศษ 6 ชิ้น', target: 6, reward: 70 },
    { id: 'star3', text: 'ผ่านด่านแบบ 3 ดาว 1 ด่าน', target: 1, reward: 100 },
    { id: 'boost1', text: 'ใช้ตัวช่วย 1 ครั้ง', target: 1, reward: 50 }
  ];
  var GIFT_MS = 4 * 3600 * 1000;

  var mem = null, data = null, now = function () { return Date.now(); };
  var adapter = {
    read: function () { try { return localStorage.getItem(KEY); } catch (e) { return mem; } },
    write: function (s) { mem = s; try { localStorage.setItem(KEY, s); } catch (e) { /* โหมดส่วนตัว: เก็บในหน่วยความจำ */ } }
  };

  function int(x, lo, hi, d) { x = Math.floor(Number(x)); if (!isFinite(x)) x = d; return Math.min(hi, Math.max(lo, x)); }
  function fresh() {
    return {
      v: 1, coins: 0, unlocked: 1, stars: {}, best: {},
      inv: { hammer: 0, bomb: 0, rainbow: 0, shuffle: 0, moves5: 0, rocket: 0 },
      daily: { last: '', streak: 0 }, missions: { date: '', list: [] }, gift: { last: 0 },
      deal: '', pending: null, settings: { sfx: true, music: true, fast: false }, wins: 0
    };
  }
  function sanitize(d) {
    var f = fresh(), k;
    if (!d || typeof d !== 'object') return f;
    f.coins = int(d.coins, 0, 1e9, 0);
    f.unlocked = int(d.unlocked, 1, 1e6, 1);
    f.wins = int(d.wins, 0, 1e9, 0);
    if (d.stars && typeof d.stars === 'object') for (k in d.stars) { var n = int(k, 1, 1e6, 0); if (n) f.stars[n] = int(d.stars[k], 1, 3, 1); }
    if (d.best && typeof d.best === 'object') for (k in d.best) f.best[int(k, 1, 1e6, 1)] = int(d.best[k], 0, 1e9, 0);
    for (k in f.inv) f.inv[k] = int(d.inv && d.inv[k], 0, 9999, 0);
    if (d.daily) { f.daily.last = String(d.daily.last || ''); f.daily.streak = int(d.daily.streak, 0, 7, 0); }
    if (d.missions && Array.isArray(d.missions.list)) {
      f.missions.date = String(d.missions.date || '');
      f.missions.list = d.missions.list.filter(function (m) { return m && typeof m.id === 'string'; })
        .map(function (m) { return { id: m.id, prog: int(m.prog, 0, 1e6, 0), claimed: !!m.claimed }; });
    }
    if (d.gift) f.gift.last = int(d.gift.last, 0, 1e15, 0);
    f.deal = String(d.deal || '');
    if (d.settings) for (k in f.settings) if (typeof d.settings[k] === 'boolean') f.settings[k] = d.settings[k];
    if (d.pending && typeof d.pending === 'object') {
      f.pending = { coins: int(d.pending.coins, 0, 5000, 0), parts: Array.isArray(d.pending.parts) ? d.pending.parts : [], items: {} };
      for (k in f.inv) if (d.pending.items && d.pending.items[k]) f.pending.items[k] = int(d.pending.items[k], 0, 10, 0);
    }
    return f;
  }

  function load() {
    var raw = adapter.read(), d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    data = sanitize(d);
    claimPending(); /* ปิดเกมก่อนกดรับรางวัล → เครดิตให้ครั้งเดียวตอนเปิดใหม่ */
    return data;
  }
  function save() { adapter.write(JSON.stringify(data)); }
  function init(a, clock) { if (a) adapter = a; if (clock) now = clock; return load(); }

  function dayStr(t) {
    var d = new Date(t == null ? now() : t), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function dayNum() { var d = new Date(now()); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

  function addCoins(n) { n = int(n, 0, 1e6, 0); data.coins = Math.min(1e9, data.coins + n); save(); return n; }
  function spend(n) {
    if (typeof n !== 'number' || !isFinite(n) || n < 0 || Math.floor(n) !== n) return false;
    if (data.coins < n) return false;
    data.coins -= n; save(); return true;
  }
  function addItem(k, n) { if (!(k in data.inv)) return false; data.inv[k] = Math.min(9999, data.inv[k] + int(n, 0, 99, 0)); save(); return true; }
  function useItem(k) { if (!(k in data.inv) || data.inv[k] <= 0) return false; data.inv[k]--; save(); return true; }
  function buy(k) { if (!(k in PRICE) || !spend(PRICE[k])) return false; data.inv[k]++; save(); return true; }

  /* ผ่านด่าน: คำนวณรางวัล → เก็บเป็น pending (เครดิตได้ครั้งเดียวผ่าน claimPending) */
  function recordWin(n, stars, score) {
    stars = int(stars, 1, 3, 1);
    var first = !data.stars[n], parts = [], items = {};
    parts.push({ label: 'ผ่านด่าน ' + stars + ' ดาว', amt: [0, 30, 50, 100][stars] });
    if (first) {
      parts.push({ label: 'ผ่านครั้งแรก', amt: 20 });
      if (n % 10 === 0) {
        parts.push({ label: 'หีบสมบัติ ครบ 10 ด่าน', amt: 500 });
        items[ITEMS[(n / 10) % ITEMS.length].k] = 1;
      } else if (n % 5 === 0) parts.push({ label: 'โบนัส ครบ 5 ด่าน', amt: 200 });
    }
    var coins = 0; parts.forEach(function (p) { coins += p.amt; });
    claimPending();
    data.stars[n] = Math.max(data.stars[n] || 0, stars);
    data.best[n] = Math.max(data.best[n] || 0, int(score, 0, 1e9, 0));
    data.unlocked = Math.max(data.unlocked, n + 1);
    data.wins++;
    data.pending = { coins: coins, parts: parts, items: items };
    save();
    return data.pending;
  }
  function claimPending() {
    var p = data.pending;
    if (!p) return null;
    data.pending = null;
    data.coins = Math.min(1e9, data.coins + int(p.coins, 0, 5000, 0));
    for (var k in p.items) if (k in data.inv) data.inv[k] += int(p.items[k], 0, 10, 0);
    save();
    return p;
  }

  function dailyInfo() {
    var today = dayStr(), yest = dayStr(now() - 86400000), d = data.daily;
    var can = d.last !== today && d.last < today || d.last === '';
    var next = d.last === yest ? (d.streak % 7) + 1 : (d.last === today ? d.streak : 1);
    return { can: can, day: next, streak: d.streak, table: DAILY };
  }
  function claimDaily() {
    var info = dailyInfo();
    if (!info.can) return null;
    data.daily = { last: dayStr(), streak: info.day };
    var amt = DAILY[info.day - 1], item = info.day === 7 ? 'rainbow' : null;
    data.coins += amt;
    if (item) data.inv[item]++;
    save();
    return { coins: amt, day: info.day, item: item };
  }

  function missions() {
    var today = dayStr();
    if (data.missions.date !== today) {
      var base = dayNum(), ids = [];
      for (var i = 0; ids.length < 3; i++) { var m = MISSIONS[(base * 5 + i * 7) % MISSIONS.length].id; if (ids.indexOf(m) < 0) ids.push(m); else base++; }
      data.missions = { date: today, list: ids.map(function (id) { return { id: id, prog: 0, claimed: false }; }) };
      save();
    }
    return data.missions.list.map(function (m) {
      var def = MISSIONS.filter(function (x) { return x.id === m.id; })[0] || MISSIONS[0];
      return { id: m.id, text: def.text, target: def.target, reward: def.reward, prog: Math.min(m.prog, def.target), claimed: m.claimed, done: m.prog >= def.target };
    });
  }
  function missionAdd(id, n) {
    if (!n) return;
    missions();
    data.missions.list.forEach(function (m) { if (m.id === id && !m.claimed) m.prog += n; });
    save();
  }
  function claimMission(id) {
    var list = missions(), amt = 0;
    list.forEach(function (m, i) {
      if (m.id === id && m.done && !m.claimed) { data.missions.list[i].claimed = true; amt = m.reward; }
    });
    if (!amt) return 0;
    data.coins += amt; save();
    return amt;
  }

  function giftInfo() { var left = GIFT_MS - (now() - data.gift.last); return { can: left <= 0, left: Math.max(0, left) }; }
  function claimGift(rand) {
    if (!giftInfo().can) return null;
    rand = rand || Math.random;
    data.gift.last = now();
    var res;
    if (rand() < 0.3) { var it = ITEMS[Math.floor(rand() * ITEMS.length)]; data.inv[it.k]++; res = { item: it.k, ic: it.ic, name: it.name }; }
    else { var amt = 40 + Math.floor(rand() * 12) * 10; data.coins += amt; res = { coins: amt }; }
    save();
    return res;
  }

  /* แพ็กตัวช่วยราคาพิเศษ (มีเป็นครั้งคราว: อังคาร ศุกร์ เสาร์ อาทิตย์ · ซื้อได้วันละ 1 ครั้ง) */
  function deal() {
    var dow = new Date(now()).getDay();
    if ([0, 2, 5, 6].indexOf(dow) < 0) return null;
    var b = dayNum(), ks = [ITEMS[b % 6], ITEMS[(b + 2) % 6], ITEMS[(b + 3) % 6]], full = 0;
    ks.forEach(function (i) { full += i.price; });
    return { items: ks, full: full, price: Math.round(full * 0.7 / 10) * 10, bought: data.deal === dayStr() };
  }
  function buyDeal() {
    var d = deal();
    if (!d || d.bought || !spend(d.price)) return false;
    d.items.forEach(function (i) { data.inv[i.k]++; });
    data.deal = dayStr(); save();
    return true;
  }

  function setSetting(k, v) { if (k in data.settings) { data.settings[k] = !!v; save(); } }
  function reset() { var s = data.settings; data = fresh(); data.settings = s; save(); }
  function totalStars() { var t = 0; for (var k in data.stars) t += data.stars[k]; return t; }

  return {
    ITEMS: ITEMS, PRICE: PRICE, DAILY: DAILY, init: init, load: load, save: save, get: function () { return data; },
    addCoins: addCoins, spend: spend, addItem: addItem, useItem: useItem, buy: buy,
    recordWin: recordWin, claimPending: claimPending, dailyInfo: dailyInfo, claimDaily: claimDaily,
    missions: missions, missionAdd: missionAdd, claimMission: claimMission, giftInfo: giftInfo, claimGift: claimGift,
    deal: deal, buyDeal: buyDeal, setSetting: setSetting, reset: reset, totalStars: totalStars,
    exportData: function () { return JSON.stringify(data); },
    importData: function (s) { data = sanitize(JSON.parse(s)); save(); return data; }
  };
});
