/* CANDY FUN ADVENTURE — engine.js
 * ตรรกะเกม Match-3 ล้วน ๆ (ไม่มี DOM) ใช้ได้ทั้ง Browser และ Node (สำหรับทดสอบ)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CFEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var BOX_HP = { b: 1, B: 2, X: 3, k: 1, K: 2 };
  var JELLY = { j: 1, J: 2, k: 1, K: 1 };

  function Game(level, opts) {
    opts = opts || {};
    this.rand = opts.rand || Math.random;
    this.level = level;
    this.R = level.rows; this.C = level.cols; this.colors = level.colors;
    this.moves = opts.moves != null ? opts.moves : level.moves;
    this.score = 0; this.nextId = 1;
    this.collected = [0, 0, 0, 0, 0, 0];
    this.stats = { specials: 0, maxCombo: 0, cleared: 0, combo3: 0 };
    this.grid = []; this.hole = []; this.jelly = [];
    this.jellyLeft = 0; this.boxLeft = 0; this.jellyTotal = 0; this.boxTotal = 0;
    this.stuck = false; this.lastSwap = null;
    for (var r = 0; r < this.R; r++) {
      this.grid.push([]); this.hole.push([]); this.jelly.push([]);
      for (var c = 0; c < this.C; c++) {
        var ch = level.layout[r].charAt(c);
        this.hole[r].push(ch === '#');
        var j = JELLY[ch] || 0; this.jelly[r].push(j); this.jellyLeft += j;
        if (BOX_HP[ch]) { this.grid[r].push({ id: this.nextId++, t: 'box', hp: BOX_HP[ch] }); this.boxLeft++; }
        else this.grid[r].push(null);
      }
    }
    this.jellyTotal = this.jellyLeft; this.boxTotal = this.boxLeft;
    this._fill();
    var n = level.presets || 0, plain = this._plain();
    while (n-- > 0 && plain.length) {
      var p = plain.splice(Math.floor(this.rand() * plain.length), 1)[0];
      this.grid[p.r][p.c].sp = ['h', 'v', 'bomb'][Math.floor(this.rand() * 3)];
    }
  }

  var P = Game.prototype;

  P._new = function (color) { return { id: this.nextId++, t: 'c', color: color, sp: null }; };
  P._rc = function () { return Math.floor(this.rand() * this.colors); };
  P._color = function (r, c) {
    if (r < 0 || c < 0 || r >= this.R || c >= this.C) return -1;
    var x = this.grid[r][c];
    return x && x.t === 'c' ? x.color : -1;
  };
  P._plain = function () {
    var out = [];
    for (var r = 0; r < this.R; r++) for (var c = 0; c < this.C; c++) {
      var x = this.grid[r][c];
      if (x && x.t === 'c' && !x.sp) out.push({ r: r, c: c });
    }
    return out;
  };

  P._fill = function () {
    for (var tries = 0; tries < 200; tries++) {
      for (var r = 0; r < this.R; r++) for (var c = 0; c < this.C; c++) {
        if (this.hole[r][c]) continue;
        var x = this.grid[r][c];
        if (x && x.t === 'box') continue;
        var k, g = 0;
        do {
          k = this._rc();
        } while (g++ < 30 && ((this._color(r, c - 1) === k && this._color(r, c - 2) === k) ||
                              (this._color(r - 1, c) === k && this._color(r - 2, c) === k)));
        if (x) x.color = k; else this.grid[r][c] = this._new(k);
      }
      if (!this.findGroups().length && this.findMoves(true).length) return;
    }
  };

  P._matchAt = function (r, c) {
    var k = this._color(r, c);
    if (k < 0) return false;
    var n = 1, i;
    for (i = c - 1; this._color(r, i) === k; i--) n++;
    for (i = c + 1; this._color(r, i) === k; i++) n++;
    if (n >= 3) return true;
    n = 1;
    for (i = r - 1; this._color(i, c) === k; i--) n++;
    for (i = r + 1; this._color(i, c) === k; i++) n++;
    return n >= 3;
  };

  P.canSwap = function (r1, c1, r2, c2) {
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return false;
    if (r1 < 0 || c1 < 0 || r2 < 0 || c2 < 0 || r1 >= this.R || r2 >= this.R || c1 >= this.C || c2 >= this.C) return false;
    var a = this.grid[r1][c1], b = this.grid[r2][c2];
    return !!(a && b && a.t === 'c' && b.t === 'c');
  };

  P.findMoves = function (firstOnly) {
    var out = [], g = this.grid, D = [[0, 1], [1, 0]];
    for (var r = 0; r < this.R; r++) for (var c = 0; c < this.C; c++) for (var d = 0; d < 2; d++) {
      var r2 = r + D[d][0], c2 = c + D[d][1];
      if (r2 >= this.R || c2 >= this.C) continue;
      var a = g[r][c], b = g[r2][c2];
      if (!a || !b || a.t !== 'c' || b.t !== 'c') continue;
      var ok;
      if (a.sp === 'rainbow' || b.sp === 'rainbow' || (a.sp && b.sp)) ok = true;
      else {
        g[r][c] = b; g[r2][c2] = a;
        ok = this._matchAt(r, c) || this._matchAt(r2, c2);
        g[r][c] = a; g[r2][c2] = b;
      }
      if (ok) { out.push({ r1: r, c1: c, r2: r2, c2: c2 }); if (firstOnly) return out; }
    }
    return out;
  };

  /* หา "กลุ่ม" ที่จับคู่ได้ทั้งหมด (รวมรูปตัว L / T) */
  P.findGroups = function () {
    var R = this.R, C = this.C, runs = [], r, c, e, k, i;
    for (r = 0; r < R; r++) for (c = 0; c < C;) {
      k = this._color(r, c);
      if (k < 0) { c++; continue; }
      for (e = c + 1; e < C && this._color(r, e) === k; e++);
      if (e - c >= 3) { var hc = []; for (i = c; i < e; i++) hc.push(r * C + i); runs.push({ dir: 'h', len: e - c, cells: hc, color: k }); }
      c = e;
    }
    for (c = 0; c < C; c++) for (r = 0; r < R;) {
      k = this._color(r, c);
      if (k < 0) { r++; continue; }
      for (e = r + 1; e < R && this._color(e, c) === k; e++);
      if (e - r >= 3) { var vc = []; for (i = r; i < e; i++) vc.push(i * C + c); runs.push({ dir: 'v', len: e - r, cells: vc, color: k }); }
      r = e;
    }
    if (!runs.length) return [];
    var par = runs.map(function (_, i) { return i; });
    function find(x) { while (par[x] !== x) x = par[x] = par[par[x]]; return x; }
    var owner = {};
    runs.forEach(function (run, idx) {
      run.cells.forEach(function (key) {
        if (owner[key] == null) owner[key] = idx; else par[find(idx)] = find(owner[key]);
      });
    });
    var map = {}, groups = [];
    runs.forEach(function (run, idx) {
      var p = find(idx), g = map[p];
      if (!g) { g = map[p] = { color: run.color, runs: [], cells: [], set: {}, cross: null }; groups.push(g); }
      g.runs.push(run);
      run.cells.forEach(function (key) {
        if (g.set[key]) g.cross = key; else { g.set[key] = 1; g.cells.push(key); }
      });
    });
    return groups;
  };

  P._groupSpecial = function (g) {
    var C = this.C, maxLen = 0, longest = null, hasH = false, hasV = false;
    g.runs.forEach(function (run) {
      if (run.len > maxLen) { maxLen = run.len; longest = run; }
      if (run.dir === 'h') hasH = true; else hasV = true;
    });
    var sp = null;
    if (maxLen >= 5) sp = 'rainbow';
    else if (hasH && hasV) sp = 'bomb';
    else if (maxLen === 4) sp = this.lastSwap ? (this.lastSwap.horiz ? 'h' : 'v') : longest.dir;
    if (!sp) return null;
    var key = null;
    if (this.lastSwap) this.lastSwap.cells.forEach(function (p) { var kk = p[0] * C + p[1]; if (g.set[kk]) key = kk; });
    if (key == null) key = sp === 'bomb' && g.cross != null ? g.cross : longest.cells[Math.floor(longest.len / 2)];
    return { r: Math.floor(key / C), c: key % C, color: sp === 'rainbow' ? -1 : g.color, sp: sp };
  };

  P._hud = function () {
    return { score: this.score, moves: this.moves, goals: this.goals().map(function (g) { return g.left; }) };
  };

  P._damageBox = function (r, c, step, boxSeen) {
    if (r < 0 || c < 0 || r >= this.R || c >= this.C) return;
    var x = this.grid[r][c];
    if (!x || x.t !== 'box') return;
    var key = r * this.C + c;
    if (boxSeen[key]) return;
    boxSeen[key] = 1;
    x.hp--;
    step.boxes.push({ id: x.id, r: r, c: c, hp: x.hp });
    step.score += 80;
    if (x.hp <= 0) { this.grid[r][c] = null; this.boxLeft--; step.score += 120; }
  };

  P._trigger = function (x, r, c, step, queue) {
    var i, j;
    step.score += 150;
    if (x.sp === 'h') { step.fx.push({ kind: 'row', r: r, c: c }); for (i = 0; i < this.C; i++) queue.push({ r: r, c: i }); }
    else if (x.sp === 'v') { step.fx.push({ kind: 'col', r: r, c: c }); for (i = 0; i < this.R; i++) queue.push({ r: i, c: c }); }
    else if (x.sp === 'bomb') {
      step.fx.push({ kind: 'blast', r: r, c: c, rad: 1 });
      for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) queue.push({ r: r + i, c: c + j });
    } else if (x.sp === 'rainbow') {
      var cnt = [0, 0, 0, 0, 0, 0], best = 0, to = [];
      for (i = 0; i < this.R; i++) for (j = 0; j < this.C; j++) { var k = this._color(i, j); if (k >= 0) cnt[k]++; }
      for (i = 1; i < 6; i++) if (cnt[i] > cnt[best]) best = i;
      for (i = 0; i < this.R; i++) for (j = 0; j < this.C; j++) if (this._color(i, j) === best) { queue.push({ r: i, c: j }); to.push([i, j]); }
      step.fx.push({ kind: 'zap', r: r, c: c, to: to });
    }
  };

  P._hit = function (h, step, queue, seen, boxSeen) {
    var r = h.r, c = h.c;
    if (r < 0 || c < 0 || r >= this.R || c >= this.C || this.hole[r][c]) return;
    var x = this.grid[r][c], key = r * this.C + c;
    if (x && x.t === 'box') { if (!h.match) this._damageBox(r, c, step, boxSeen); return; }
    if (seen[key]) return;
    seen[key] = 1;
    if (x) {
      this.grid[r][c] = null;
      step.removed.push({ id: x.id, r: r, c: c, color: x.color, sp: x.sp });
      if (x.color >= 0) this.collected[x.color]++;
      step.score += 60; this.stats.cleared++;
      if (h.match) {
        this._damageBox(r - 1, c, step, boxSeen); this._damageBox(r + 1, c, step, boxSeen);
        this._damageBox(r, c - 1, step, boxSeen); this._damageBox(r, c + 1, step, boxSeen);
      }
      if (x.sp) this._trigger(x, r, c, step, queue);
    }
    if (this.jelly[r][c] > 0) {
      this.jelly[r][c]--; this.jellyLeft--;
      step.jelly.push({ r: r, c: c, level: this.jelly[r][c] });
      step.score += 100;
    }
  };

  /* หนึ่ง "จังหวะระเบิด": ลบกลุ่มที่จับคู่ + ผลของขนมพิเศษ + สร้างขนมพิเศษใหม่ */
  P._clearStep = function (groups, extra, combo, ev) {
    var self = this;
    var step = { type: 'clear', removed: [], created: [], boxes: [], jelly: [], fx: [], transformed: [], score: 0, combo: combo };
    var queue = [], seen = {}, boxSeen = {}, creates = [];
    if (extra) {
      (extra.transformed || []).forEach(function (t) {
        var x = self.grid[t.r][t.c];
        if (x && x.t === 'c') { x.sp = t.sp; step.transformed.push({ id: x.id, r: t.r, c: t.c, color: x.color, sp: t.sp }); }
      });
      (extra.fx || []).forEach(function (f) { step.fx.push(f); });
      (extra.hits || []).forEach(function (h) { queue.push(h); });
    }
    groups.forEach(function (g) {
      var s = self._groupSpecial(g);
      if (s) creates.push(s);
      g.cells.forEach(function (key) { queue.push({ r: Math.floor(key / self.C), c: key % self.C, match: true }); });
    });
    while (queue.length) this._hit(queue.shift(), step, queue, seen, boxSeen);
    creates.forEach(function (s) {
      if (self.grid[s.r][s.c]) return;
      var x = self._new(s.color); x.sp = s.sp;
      self.grid[s.r][s.c] = x;
      step.created.push({ id: x.id, r: s.r, c: s.c, color: s.color, sp: s.sp });
      step.score += 120; self.stats.specials++;
    });
    var mult = combo >= 4 ? 5 : combo;
    step.mult = mult;
    step.score *= mult;
    this.score += step.score;
    if (combo > this.stats.maxCombo) this.stats.maxCombo = combo;
    if (combo === 3) this.stats.combo3++;
    step.hud = this._hud();
    ev.push(step);
  };

  /* ขนมตกลง + เกิดขนมใหม่ (รองรับช่องว่าง/กล่อง ด้วยการไหลแนวทแยง) */
  P._gravity = function (ev) {
    var R = this.R, C = this.C, g = this.grid, guard = 0, r, c;
    while (guard++ < 300) {
      var moves = [], spawns = [];
      for (c = 0; c < C; c++) {
        var sc = 0;
        for (r = R - 1; r >= 0; r--) {
          if (this.hole[r][c] || g[r][c]) continue;
          var rr = r - 1, found = false, blocked = false;
          while (rr >= 0) {
            var x = g[rr][c];
            if (this.hole[rr][c] || !x) { rr--; continue; }
            if (x.t === 'box') { blocked = true; break; }
            g[r][c] = x; g[rr][c] = null;
            moves.push({ id: x.id, r: r, c: c, fr: rr, fc: c });
            found = true; break;
          }
          if (!found && !blocked) {
            sc++;
            var n = this._new(this._rc());
            g[r][c] = n;
            spawns.push({ id: n.id, r: r, c: c, color: n.color, sp: null, fr: -sc });
          }
        }
      }
      if (moves.length || spawns.length) ev.push({ type: 'fall', moves: moves, spawns: spawns });
      var diag = [];
      for (r = 1; r < R; r++) for (c = 0; c < C; c++) {
        if (this.hole[r][c] || g[r][c]) continue;
        var first = this.rand() < 0.5 ? -1 : 1, opts2 = [first, -first];
        for (var i = 0; i < 2; i++) {
          var sc2 = c + opts2[i];
          if (sc2 < 0 || sc2 >= C) continue;
          var s = g[r - 1][sc2];
          if (s && s.t === 'c') {
            g[r][c] = s; g[r - 1][sc2] = null;
            diag.push({ id: s.id, r: r, c: c, fr: r - 1, fc: sc2 });
            break;
          }
        }
      }
      if (diag.length) ev.push({ type: 'fall', moves: diag, spawns: [], diag: true });
      else if (!moves.length && !spawns.length) break;
    }
  };

  P._shuffle = function (ev) {
    var cells = [], items = [], r, c, i, t, self = this;
    for (r = 0; r < this.R; r++) for (c = 0; c < this.C; c++) {
      var x = this.grid[r][c];
      if (x && x.t === 'c') { cells.push([r, c]); items.push(x); }
    }
    function ok() { return !self.findGroups().length && self.findMoves(true).length > 0; }
    var done = false;
    for (t = 0; t < 150 && !done; t++) {
      for (i = items.length - 1; i > 0; i--) {
        var j = Math.floor(this.rand() * (i + 1)), tmp = items[i]; items[i] = items[j]; items[j] = tmp;
      }
      for (i = 0; i < cells.length; i++) this.grid[cells[i][0]][cells[i][1]] = items[i];
      done = ok();
    }
    for (t = 0; t < 200 && !done; t++) {
      for (i = 0; i < items.length; i++) if (items[i].sp !== 'rainbow') items[i].color = this._rc();
      done = ok();
    }
    if (!done) this.stuck = true;
    ev.push({
      type: 'shuffle',
      tiles: cells.map(function (p, i) { return { id: items[i].id, r: p[0], c: p[1], color: items[i].color, sp: items[i].sp }; })
    });
  };

  P._resolve = function (ev, combo) {
    for (;;) {
      this._gravity(ev);
      var groups = this.findGroups();
      if (!groups.length) break;
      combo++;
      this._clearStep(groups, null, combo, ev);
    }
    if (this.status() === 'playing' && !this.findMoves(true).length) this._shuffle(ev);
  };

  P._all = function (fn) {
    var out = [];
    for (var r = 0; r < this.R; r++) for (var c = 0; c < this.C; c++) if (!this.hole[r][c] && (!fn || fn(r, c))) out.push({ r: r, c: c });
    return out;
  };

  P._swapCombo = function (a, b, pa, pb) {
    var self = this, hits = [], fx = [], transformed = [], i, j;
    var ra = a.sp === 'rainbow', rb = b.sp === 'rainbow';
    if (ra && rb) {
      a.sp = b.sp = null;
      return { hits: this._all(), fx: [{ kind: 'nova', r: pa.r, c: pa.c }] };
    }
    if (ra || rb) {
      var rain = ra ? a : b, other = ra ? b : a, pr = ra ? pa : pb, k = other.color, to = [];
      rain.sp = null;
      this._all(function (r, c) { return self._color(r, c) === k; }).forEach(function (p) {
        if (other.sp) {
          var sp = other.sp === 'bomb' ? 'bomb' : (self.rand() < 0.5 ? 'h' : 'v');
          transformed.push({ r: p.r, c: p.c, sp: sp });
        }
        hits.push(p); to.push([p.r, p.c]);
      });
      hits.push({ r: pr.r, c: pr.c });
      return { hits: hits, fx: [{ kind: 'zap', r: pr.r, c: pr.c, to: to }], transformed: transformed };
    }
    if (a.sp && b.sp) {
      var bombs = (a.sp === 'bomb' ? 1 : 0) + (b.sp === 'bomb' ? 1 : 0);
      a.sp = b.sp = null;
      hits.push({ r: pb.r, c: pb.c });
      if (bombs === 2) {
        for (i = -2; i <= 2; i++) for (j = -2; j <= 2; j++) hits.push({ r: pa.r + i, c: pa.c + j });
        fx.push({ kind: 'blast', r: pa.r, c: pa.c, rad: 2 });
      } else {
        var w = bombs === 1 ? 1 : 0;
        for (var d = -w; d <= w; d++) {
          if (pa.r + d >= 0 && pa.r + d < this.R) { fx.push({ kind: 'row', r: pa.r + d, c: pa.c }); for (i = 0; i < this.C; i++) hits.push({ r: pa.r + d, c: i }); }
          if (pa.c + d >= 0 && pa.c + d < this.C) { fx.push({ kind: 'col', r: pa.r, c: pa.c + d }); for (i = 0; i < this.R; i++) hits.push({ r: i, c: pa.c + d }); }
        }
      }
      return { hits: hits, fx: fx };
    }
    return null;
  };

  /* ผู้เล่นสลับขนม: คืน events สำหรับแอนิเมชัน หรือ null ถ้าสลับแล้วไม่เกิดการจับคู่ */
  P.swap = function (r1, c1, r2, c2) {
    if (this.status() !== 'playing' || !this.canSwap(r1, c1, r2, c2)) return null;
    var g = this.grid, a = g[r1][c1], b = g[r2][c2], ev = [];
    g[r1][c1] = b; g[r2][c2] = a;
    var sw = { type: 'swap', a: { id: a.id, r: r2, c: c2 }, b: { id: b.id, r: r1, c: c1 } };
    var combo = this._swapCombo(a, b, { r: r2, c: c2 }, { r: r1, c: c1 });
    if (combo) {
      this.moves--; ev.push(sw);
      this._clearStep([], combo, 1, ev);
    } else {
      var groups = this.findGroups();
      if (!groups.length) { g[r1][c1] = a; g[r2][c2] = b; return null; }
      this.moves--; ev.push(sw);
      this.lastSwap = { cells: [[r2, c2], [r1, c1]], horiz: r1 === r2 };
      this._clearStep(groups, null, 1, ev);
      this.lastSwap = null;
    }
    this._resolve(ev, 1);
    return ev;
  };

  /* ตัวช่วย: hammer / bomb / rocket / rainbow (ต้องเลือกช่อง), shuffle / moves5 (ใช้ทันที) */
  P.useBooster = function (type, r, c, dir) {
    if (this.status() !== 'playing') return null;
    var ev = [], self = this, i, j, hits = [], fx = [];
    if (type === 'moves5') { this.moves += 5; ev.push({ type: 'moves', hud: this._hud() }); return ev; }
    if (type === 'shuffle') { this._shuffle(ev); return ev; }
    if (r == null || r < 0 || c < 0 || r >= this.R || c >= this.C || this.hole[r][c]) return null;
    var x = this.grid[r][c];
    if (type === 'hammer') {
      if (!x) return null;
      if (x.t === 'box') x.hp = 1;
      hits.push({ r: r, c: c }); fx.push({ kind: 'smash', r: r, c: c });
    } else if (type === 'bomb') {
      for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) hits.push({ r: r + i, c: c + j });
      fx.push({ kind: 'blast', r: r, c: c, rad: 1 });
    } else if (type === 'rocket') {
      if (dir === 'v') { for (i = 0; i < this.R; i++) hits.push({ r: i, c: c }); fx.push({ kind: 'col', r: r, c: c }); }
      else { for (i = 0; i < this.C; i++) hits.push({ r: r, c: i }); fx.push({ kind: 'row', r: r, c: c }); }
    } else if (type === 'rainbow') {
      if (!x || x.t !== 'c' || x.color < 0) return null;
      var k = x.color, to = [];
      hits = this._all(function (rr, cc) { return self._color(rr, cc) === k; });
      hits.forEach(function (p) { to.push([p.r, p.c]); });
      fx.push({ kind: 'zap', r: r, c: c, to: to });
    } else return null;
    this._clearStep([], { hits: hits, fx: fx }, 1, ev);
    this._resolve(ev, 1);
    return ev;
  };

  P.addMoves = function (n) { this.moves += n; this.stuck = false; };

  P.goals = function () {
    var self = this;
    return this.level.goals.map(function (g) {
      var have, target = g.target;
      if (g.type === 'score') have = self.score;
      else if (g.type === 'color') have = self.collected[g.color];
      else if (g.type === 'jelly') { target = self.jellyTotal; have = target - self.jellyLeft; }
      else { target = self.boxTotal; have = target - self.boxLeft; }
      return { type: g.type, color: g.color, target: target, have: Math.min(have, target), left: Math.max(0, target - have), done: have >= target };
    });
  };

  P.status = function () {
    var done = this.goals().every(function (g) { return g.done; });
    /* ด่านเป้าคะแนนล้วน: เล่นให้ครบทุกตาเดิน แล้วตัดสินดาวจากคะแนนรวม */
    if (this.level.goals.every(function (g) { return g.type === 'score'; })) {
      if (this.moves > 0 && !this.stuck) return 'playing';
      return done ? 'won' : 'lost';
    }
    if (done) return 'won';
    if (this.moves <= 0 || this.stuck) return 'lost';
    return 'playing';
  };

  /* ผ่านด่านแล้ว: ตาที่เหลือกลายเป็นขนมพิเศษระเบิดฉลอง (โบนัสคะแนน) */
  P.finale = function () {
    if (this.status() !== 'won') return [];
    var ev = [], left = this.moves, n = Math.min(left, 10), plain = this._plain(), tr = [], hits = [];
    this.moves = 0;
    this.score += left * 150;
    ev.push({ type: 'finale', count: n, hud: this._hud() });
    while (n-- > 0 && plain.length) {
      var p = plain.splice(Math.floor(this.rand() * plain.length), 1)[0];
      tr.push({ r: p.r, c: p.c, sp: ['h', 'v', 'bomb'][Math.floor(this.rand() * 3)] });
      hits.push({ r: p.r, c: p.c });
    }
    if (tr.length) {
      this._clearStep([], { hits: hits, transformed: tr }, 1, ev);
      this._resolve(ev, 1);
    }
    return ev;
  };

  /* ---------- บอทจำลองผู้เล่น ใช้ปรับสมดุลด่านให้ "ผ่านได้จริง" ---------- */
  function botPick(game, rand) {
    var mv = game.findMoves(false);
    if (!mv.length) return null;
    var g = game.grid, goalColor = {}, needJ = false, needB = false;
    game.goals().forEach(function (q) {
      if (q.done) return;
      if (q.type === 'color') goalColor[q.color] = 1;
      if (q.type === 'jelly') needJ = true;
      if (q.type === 'box') needB = true;
    });
    function cellVal(r, c) {
      var x = g[r][c], v = 1;
      if (needJ && game.jelly[r][c] > 0) v += 3;
      if (needB) {
        var nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (var i = 0; i < 4; i++) {
          var y = nb[i][0] >= 0 && nb[i][0] < game.R && nb[i][1] >= 0 && nb[i][1] < game.C ? g[nb[i][0]][nb[i][1]] : null;
          if (y && y.t === 'box') v += 3;
        }
      }
      if (goalColor[x.color]) v += 2;
      if (x.sp) v += 3;
      return v;
    }
    function evalAt(r, c) {
      var k = game._color(r, c), i, v = 0, h = [], vv = [];
      if (k < 0) return 0;
      for (i = c - 1; game._color(r, i) === k; i--) h.push([r, i]);
      for (i = c + 1; game._color(r, i) === k; i++) h.push([r, i]);
      for (i = r - 1; game._color(i, c) === k; i--) vv.push([i, c]);
      for (i = r + 1; game._color(i, c) === k; i++) vv.push([i, c]);
      var okH = h.length >= 2, okV = vv.length >= 2;
      if (!okH && !okV) return 0;
      v += cellVal(r, c);
      if (okH) { h.forEach(function (p) { v += cellVal(p[0], p[1]); }); if (h.length >= 3) v += 3; }
      if (okV) { vv.forEach(function (p) { v += cellVal(p[0], p[1]); }); if (vv.length >= 3) v += 3; }
      if (okH && okV) v += 4;
      return v;
    }
    var best = null, bv = -1;
    mv.forEach(function (m) {
      var a = g[m.r1][m.c1], b = g[m.r2][m.c2], v = rand() * 1.5;
      if (a.sp === 'rainbow' || b.sp === 'rainbow') v += 9;
      else if (a.sp && b.sp) v += 8;
      else {
        g[m.r1][m.c1] = b; g[m.r2][m.c2] = a;
        v += evalAt(m.r1, m.c1) + evalAt(m.r2, m.c2);
        g[m.r1][m.c1] = a; g[m.r2][m.c2] = b;
      }
      if (v > bv) { bv = v; best = m; }
    });
    return best;
  }

  /* เล่นจำลอง 1 เกม: budget = จำนวนตาที่ให้ (ถ้าไม่ระบุ = เล่นจนผ่านหรือครบ cap) */
  function simulate(level, rand, budget, cap) {
    var game = new Game(level, { rand: rand, moves: budget != null ? budget : 9999 }), used = 0;
    cap = cap || 80;
    while (used < cap && game.status() === 'playing') {
      var m = botPick(game, rand);
      if (!m) break;
      game.swap(m.r1, m.c1, m.r2, m.c2);
      used++;
    }
    return { won: game.status() === 'won', used: used, score: game.score, left: game.moves };
  }

  function r10(x) { return Math.max(10, Math.round(x / 10) * 10); }
  function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }

  /* ปรับสมดุล: กำหนดจำนวนตา / เป้าคะแนน / เกณฑ์ดาว จากผลบอทจริง (deterministic ตาม seed) */
  function calibrate(level, seed, ease) {
    var rand = makeRng(seed), K = 14, i, res = [], out = { hard: false };
    var scoreGoal = null, others = 0;
    level.goals.forEach(function (g) { if (g.type === 'score') scoreGoal = g; else others++; });
    if (!others) {
      var saved = scoreGoal.target;
      scoreGoal.target = Infinity;
      for (i = 0; i < K; i++) res.push(simulate(level, rand, level.moves, level.moves).score);
      var m = median(res);
      scoreGoal.target = saved != null ? saved : Math.max(500, Math.round(m * 0.6 / ease / 100) * 100);
      var s2 = Math.max(r10(m * 0.75), r10(scoreGoal.target * 1.2));
      out.stars = [s2, Math.max(r10(m * 1.05), r10(s2 * 1.25))];
      out.moves = level.moves; out.target = scoreGoal.target;
      level.stars = out.stars;
      return out;
    }
    var used = [], fails = 0;
    for (i = 0; i < K; i++) { var s = simulate(level, rand, null, 80); res.push(s); used.push(s.won ? s.used : 80); if (!s.won) fails++; }
    used.sort(function (a, b) { return a - b; });
    var q = used[Math.floor(K * 0.75)];
    if (fails > K * 0.25) out.hard = true;
    out.moves = level.moves || Math.max(10, Math.ceil(q * ease) + 1);
    var est = res.map(function (s) { return s.score + Math.max(0, out.moves - s.used) * (s.score / Math.max(1, s.used)) * 1.1; });
    var me = median(est);
    out.stars = [r10(me * 0.75), r10(me * 1.05)];
    level.moves = out.moves; level.stars = out.stars;
    return out;
  }

  return { Game: Game, makeRng: makeRng, botPick: botPick, simulate: simulate, calibrate: calibrate };
});
