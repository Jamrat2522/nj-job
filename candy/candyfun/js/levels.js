/* CANDY FUN ADVENTURE — levels.js
 * ด่าน 1–30 ออกแบบมือ + ระบบสร้างด่านต่อเนื่อง (31 → ไม่จำกัด) แบบ deterministic
 * จำนวนตา/เป้าคะแนน/เกณฑ์ดาว ปรับสมดุลจากบอทจำลอง (engine.calibrate) เพื่อให้ผ่านได้จริง
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.CFLevels = factory(root.CFEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';

  var WORLDS = [
    { name: 'เมืองลูกกวาด', icon: '🍭', deco: ['🍭', '🍬', '🏠', '🎈', '🧁'] },
    { name: 'ป่าผลไม้', icon: '🍓', deco: ['🍓', '🌳', '🍊', '🍇', '🌴'] },
    { name: 'ปราสาทขนม', icon: '🏰', deco: ['🏰', '🍰', '🍩', '👑', '🍪'] },
    { name: 'โลกมหัศจรรย์', icon: '🌈', deco: ['🌈', '⭐', '🪐', '🎠', '🦄'] }
  ];
  function worldOf(n) { return Math.floor((n - 1) / 25) % 4; }

  var SHAPES = {
    full: function () { return true; },
    corners: function (r, c, R, C) { return !((r === 0 || r === R - 1) && (c === 0 || c === C - 1)); },
    corners2: function (r, c, R, C) { return Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 2; },
    diamond: function (r, c, R, C) { return Math.min(r, R - 1 - r) + Math.min(c, C - 1 - c) >= 3; },
    ring: function (r, c, R, C) { return !((r === (R >> 1) - 1 || r === (R >> 1)) && (c === (C >> 1) - 1 || c === (C >> 1))); },
    cross: function (r, c, R, C) { return !((r < 2 || r >= R - 2) && (c < 2 || c >= C - 2)); },
    windows: function (r, c, R, C) { return !((r === 2 || r === R - 3) && (c === 2 || c === C - 3)); },
    pillars: function (r, c, R, C) { return !((c === 2 || c === C - 3) && (r === (R >> 1) - 1 || r === (R >> 1))); },
    heart: function (r, c, R, C) {
      if (r === 0) return !(c === 0 || c === C - 1 || c === (C >> 1) - 1 || c === (C >> 1));
      var fromBottom = R - 1 - r;
      if (fromBottom < 3) return Math.min(c, C - 1 - c) >= 3 - fromBottom;
      return true;
    },
    steps: function (r, c, R, C) { return r + c >= 2 && (R - 1 - r) + (C - 1 - c) >= 2; }
  };

  /* puts: [ch, r0, c0, r1, c1, 'x'?]  ('x' = วางแบบตารางหมากรุก) */
  function build(rows, cols, shape, puts) {
    var g = [], r, c;
    for (r = 0; r < rows; r++) { g.push([]); for (c = 0; c < cols; c++) g[r].push(SHAPES[shape](r, c, rows, cols) ? '.' : '#'); }
    (puts || []).forEach(function (p) {
      for (r = p[1]; r <= p[3]; r++) for (c = p[2]; c <= p[4]; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols || g[r][c] === '#') continue;
        if (p[5] === 'x' && (r + c) % 2) continue;
        g[r][c] = p[0];
      }
    });
    return g.map(function (row) { return row.join(''); });
  }

  function col(color, target) { return { type: 'color', color: color, target: target }; }
  var SCORE = function () { return { type: 'score' }; }, JEL = { type: 'jelly' }, BOX = { type: 'box' };

  /* ---------- ด่านที่ออกแบบจริง 30 ด่าน ---------- */
  /* local005: ปรับสมดุลเฉพาะ 8/12/24/27/28/29 ด้วยจำนวนตาเดิน
   * ไม่แตะ shape/goals/colors/puts หรือ game engine เพื่อรักษากติกาและความเข้ากันได้กับ save เดิม
   * เทียบผลผ่านของบอท 30 seeds ต่อด่าน ก่อนปล่อยใช้งานจริง */
  var D = [null,
    { rows: 7, cols: 7, shape: 'full', colors: 4, goals: [SCORE()], moves: 14, ease: 1.4, tip: 'ลากขนมไปสลับกับช่องข้าง ๆ ให้เรียงกัน 3 ชิ้นขึ้นไป' },
    { rows: 7, cols: 7, shape: 'full', colors: 4, goals: [col(0, 12)], ease: 1.4, tip: 'เก็บขนมให้ครบตามเป้าหมายด้านบนก่อนตาเดินหมด' },
    { rows: 7, cols: 7, shape: 'corners', colors: 4, goals: [col(2, 14), col(3, 14)], ease: 1.4, free: { hammer: 1 }, tip: 'เรียง 4 ชิ้น = จรวด ทำลายทั้งแถว! ลองใช้ 🔨 ค้อนวิเศษฟรีด้านล่าง' },
    { rows: 8, cols: 8, shape: 'full', colors: 4, goals: [SCORE()], moves: 16, ease: 1.4, free: { rocket: 1 }, tip: 'เรียงเป็นรูปตัว L หรือ T = ระเบิด 3×3 · ลองใช้ 🚀 จรวดฟรี' },
    { rows: 8, cols: 8, shape: 'corners', colors: 4, goals: [SCORE()], moves: 14, ease: 1.4, bonus: true, presets: 4, free: { bomb: 1 }, tip: 'ด่านโบนัส! เรียง 5 ชิ้น = ลูกอมสายรุ้ง · ลองใช้ 💣 ระเบิดฟรี' },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [JEL], puts: [['j', 2, 2, 5, 5]], ease: 1.4, free: { shuffle: 1 }, tip: 'จับคู่บนเยลลี่สีชมพูเพื่อล้างให้หมด · ลองใช้ 🔀 สลับมหัศจรรย์ฟรี' },
    { rows: 8, cols: 8, shape: 'corners2', colors: 5, goals: [col(4, 18), col(1, 18)], ease: 1.4, free: { rainbow: 1 }, tip: 'ลองใช้ 🌈 สายรุ้ง แตะขนมสีที่ต้องการ ลบทั้งกระดาน!' },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [JEL], puts: [['j', 6, 0, 7, 7]], moves: 28, ease: 1.25, free: { moves5: 1 }, tip: 'ตาเดินใกล้หมด? ใช้ ✨ เพิ่ม 5 ตา ได้เลย (ฟรี 1 ครั้ง)' },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [BOX], puts: [['b', 4, 1, 4, 6]], ease: 1.25, tip: 'จับคู่ขนมข้าง ๆ กล่องของขวัญ เพื่อเปิดกล่อง' },
    { rows: 8, cols: 8, shape: 'diamond', colors: 5, goals: [SCORE()], moves: 18, ease: 1.25, bonus: true, presets: 3, tip: 'สลับขนมพิเศษ 2 ชิ้นเข้าหากัน จะเกิดพลังรวมสุดแรง!' },
    { rows: 8, cols: 8, shape: 'ring', colors: 5, goals: [col(0, 20), col(4, 20)], ease: 1.12 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [JEL], puts: [['j', 0, 1, 0, 6], ['j', 7, 1, 7, 6], ['j', 3, 3, 4, 4]], moves: 23, ease: 1.12 },
    { rows: 8, cols: 8, shape: 'cross', colors: 5, goals: [BOX], puts: [['b', 3, 2, 4, 5]], ease: 1.12 },
    { rows: 8, cols: 8, shape: 'corners', colors: 5, goals: [JEL], puts: [['j', 3, 0, 4, 7], ['j', 0, 3, 7, 4]], ease: 1.12 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [SCORE()], moves: 16, ease: 1.3, bonus: true, presets: 5 },
    { rows: 8, cols: 8, shape: 'windows', colors: 5, goals: [col(3, 24), col(2, 24), col(4, 24)], ease: 1.12 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [BOX], puts: [['b', 2, 2, 5, 2], ['b', 2, 5, 5, 5]], ease: 1.12 },
    { rows: 8, cols: 8, shape: 'corners2', colors: 5, goals: [JEL], puts: [['j', 2, 2, 5, 5], ['J', 3, 3, 4, 4]], ease: 1.1 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [BOX, col(1, 15)], puts: [['B', 2, 2, 2, 2], ['B', 2, 5, 2, 5], ['B', 5, 2, 5, 2], ['B', 5, 5, 5, 5], ['b', 3, 3, 4, 4]], ease: 1.1 },
    { rows: 8, cols: 8, shape: 'ring', colors: 5, goals: [SCORE()], moves: 18, ease: 1.3, bonus: true, presets: 5 },
    { rows: 9, cols: 8, shape: 'full', colors: 5, goals: [JEL], puts: [['j', 7, 0, 8, 7], ['j', 0, 3, 0, 4]], ease: 1.06 },
    { rows: 8, cols: 8, shape: 'steps', colors: 5, goals: [col(0, 22), col(3, 22)], ease: 1.06 },
    { rows: 8, cols: 8, shape: 'full', colors: 6, goals: [SCORE()], moves: 22, ease: 1.12, tip: 'ขนมสีใหม่มาแล้ว! มองหาโอกาสเรียง 4–5 ชิ้น' },
    { rows: 8, cols: 8, shape: 'cross', colors: 5, goals: [JEL], puts: [['j', 0, 2, 7, 5], ['J', 2, 2, 5, 5]], moves: 26, ease: 1.05 },
    { rows: 8, cols: 8, shape: 'heart', colors: 5, goals: [SCORE()], moves: 16, ease: 1.3, bonus: true, presets: 6 },
    { rows: 8, cols: 8, shape: 'pillars', colors: 5, goals: [BOX], puts: [['b', 5, 1, 5, 6], ['B', 6, 3, 6, 4]], ease: 1.05 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [JEL], puts: [['j', 0, 0, 1, 1], ['j', 0, 6, 1, 7], ['j', 6, 0, 7, 1], ['j', 6, 6, 7, 7], ['J', 3, 3, 4, 4]], moves: 33, ease: 1.05 },
    { rows: 8, cols: 8, shape: 'diamond', colors: 6, goals: [col(5, 16), col(4, 16)], moves: 26, ease: 1.05 },
    { rows: 8, cols: 8, shape: 'full', colors: 5, goals: [BOX, JEL], puts: [['b', 2, 1, 5, 6, 'x'], ['j', 6, 0, 7, 7]], moves: 30, ease: 1.05 },
    { rows: 8, cols: 8, shape: 'corners', colors: 5, goals: [SCORE()], moves: 20, ease: 1.3, bonus: true, presets: 6 }
  ];
  var DESIGNED = D.length - 1;

  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
  function wpick(rand, list) {
    var sum = 0, i; for (i = 0; i < list.length; i++) sum += list[i][1];
    var x = rand() * sum;
    for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x <= 0) return list[i][0]; }
    return list[0][0];
  }

  function jellyPuts(rand, R, C, n) {
    var ch = n > 100 && rand() < Math.min(0.45, n / 900) ? 'J' : 'j', k = Math.floor(rand() * 7), h = R >> 1;
    switch (k) {
      case 0: return [[ch, h - 2, 2, h + 1, C - 3]];
      case 1: return [[ch, R - 2 - Math.floor(rand() * 2), 0, R - 1, C - 1]];
      case 2: return [[ch, 0, 0, 0, C - 1], [ch, R - 1, 0, R - 1, C - 1], [ch, 1, 0, R - 2, 0], [ch, 1, C - 1, R - 2, C - 1]];
      case 3: return [[ch, 0, 1, R - 1, 2], [ch, 0, C - 3, R - 1, C - 2]];
      case 4: return [[ch, 0, 0, R - 1, C - 1, 'x']];
      case 5: return [[ch, 0, 0, 1, 1], [ch, 0, C - 2, 1, C - 1], [ch, R - 2, 0, R - 1, 1], [ch, R - 2, C - 2, R - 1, C - 1], ['j', h - 1, 3, h, C - 4]];
      default: return [['j', 1, 1, R - 2, C - 2], [ch, h - 1, 3, h, C - 4]];
    }
  }
  function boxPuts(rand, R, C, n) {
    var ch = n > 150 && rand() < 0.22 ? 'X' : (n > 40 && rand() < 0.4 ? 'B' : 'b'), k = Math.floor(rand() * 6), h = R >> 1;
    switch (k) {
      case 0: return [[ch, h - 1 + Math.floor(rand() * 3), 1, h - 1 + 0, C - 2]].map(function (p) { p[3] = p[1]; return p; });
      case 1: return [[ch, 2, 2, R - 3, 2], [ch, 2, C - 3, R - 3, C - 3]];
      case 2: return [[ch, h - 1, 2, h, C - 3]];
      case 3: return [[ch, 2, 1, R - 3, C - 2, 'x']];
      case 4: return [[ch, 1, 1, 2, 2], [ch, 1, C - 3, 2, C - 2], [ch, R - 3, 1, R - 2, 2], [ch, R - 3, C - 3, R - 2, C - 2]];
      default: return [[ch, R - 2, 1, R - 2, C - 2], ['b', h - 1, 3, h - 1, C - 4]];
    }
  }

  function generate(n, salt) {
    var rand = E.makeRng(n * 9973 + salt * 131 + 7);
    var rows = n > 60 && rand() < 0.3 ? 9 : 8, cols = 8;
    var colors = n > 40 && rand() < Math.min(0.4, 0.12 + n / 3000) ? 6 : 5;
    var shapes = ['full', 'full', 'corners', 'corners2', 'ring', 'cross'];
    if (n > 100) shapes.push('diamond', 'windows');
    if (n > 200) shapes.push('steps', 'pillars');
    if (n > 300) shapes.push('heart');
    var shape = pick(rand, shapes), bonus = n % 5 === 0;
    var w = (n % 10) / 10, gl = Math.min(1, n / 400);
    var def = { rows: rows, cols: cols, shape: shape, colors: colors, goals: [], puts: [], ease: 1.12 - 0.10 * w - 0.07 * gl };
    if (salt) def.ease += 0.08 * salt;
    var type = bonus ? 'score' : wpick(rand, [['score', 1], ['collect', 3], ['jelly', 3], ['box', 2],
      ['cj', n > 60 ? 1.5 : 0], ['cb', n > 80 ? 1 : 0], ['jb', n > 120 ? 1.5 : 0]]);
    function collect(k) {
      var pool = []; for (var i = 0; i < colors; i++) pool.push(i);
      while (k-- > 0) {
        var c = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        def.goals.push(col(c, 14 + Math.floor(rand() * 5) * 2 + Math.min(16, Math.floor(n / 40) * 2) - salt * 4));
      }
    }
    if (type === 'score') { def.goals.push(SCORE()); def.moves = 18 + Math.floor(rand() * 8); }
    if (type === 'collect') collect(2 + (rand() < 0.35 ? 1 : 0));
    if (type === 'jelly' || type === 'cj' || type === 'jb') { def.goals.push(JEL); def.puts = def.puts.concat(jellyPuts(rand, rows, cols, n)); }
    if (type === 'box' || type === 'cb' || type === 'jb') { def.goals.push(BOX); def.puts = def.puts.concat(boxPuts(rand, rows, cols, n)); }
    if (type === 'cj' || type === 'cb') collect(1);
    if (bonus) { def.bonus = true; def.presets = 4 + Math.floor(rand() * 4); def.ease = 1.3; }
    return def;
  }

  function finish(n, def, salt) {
    var lv = {
      n: n, rows: def.rows, cols: def.cols, colors: def.colors, moves: def.moves,
      layout: build(def.rows, def.cols, def.shape, def.puts),
      goals: def.goals.map(function (g) { return { type: g.type, color: g.color, target: g.target }; }),
      bonus: !!def.bonus, presets: def.presets || 0, free: def.free || {}, tip: def.tip || '',
      world: worldOf(n), designed: n <= DESIGNED
    };
    /* เป้าหมายกล่อง/เยลลี่ต้องมีของจริงบนกระดาน */
    var flat = lv.layout.join('');
    lv.goals = lv.goals.filter(function (g) {
      if (g.type === 'jelly') return /[jJkK]/.test(flat);
      if (g.type === 'box') return /[bBXkK]/.test(flat);
      return true;
    });
    if (!lv.goals.length) { lv.goals = [{ type: 'score' }]; lv.moves = lv.moves || 20; }
    var cal = E.calibrate(lv, n * 7919 + 13 + salt, def.ease || 1.2);
    lv.hard = cal.hard;
    return lv;
  }

  var cache = {};
  function get(n) {
    n = Math.max(1, Math.floor(n));
    if (cache[n]) return cache[n];
    var lv;
    if (n <= DESIGNED) lv = finish(n, D[n], 0);
    else {
      for (var salt = 0; salt < 4; salt++) {
        lv = finish(n, generate(n, salt), salt);
        if (!lv.hard && lv.moves <= 40) break;
      }
    }
    cache[n] = lv;
    return lv;
  }

  return { get: get, worldOf: worldOf, WORLDS: WORLDS, DESIGNED: DESIGNED, SHAPES: SHAPES, build: build };
});
