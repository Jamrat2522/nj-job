/* CANDY FUN ADVENTURE — ui.js : หน้าจอ / การควบคุม / แอนิเมชัน */
(function () {
  'use strict';
  var root0 = window, E = window.CFEngine, L = window.CFLevels, S = window.CFSave, A = window.CFAudio, Art = window.CFArt;
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  var ITEM = {}; S.ITEMS.forEach(function (i) { ITEM[i.k] = i; });

  var G = null, screenName = 'home', pendingReload = false, mapFrom = 0, toastT = null;

  /* ---------- คุณภาพกราฟิก AUTO / HIGH / LOW (เก็บแยกคีย์ ไม่แตะเซฟเกม cfa_save_v1) ---------- */
  var GFX = { mode: 'auto', autoLow: false, low: false, fps: 0, min: 0, bad: 0 };
  try { var gm = localStorage.getItem('cfa_gfx_v1'); if (gm === 'high' || gm === 'low' || gm === 'auto') GFX.mode = gm; } catch (e) { /* ใช้ค่า auto */ }
  function applyGfx() {
    GFX.low = GFX.mode === 'low' || (GFX.mode === 'auto' && GFX.autoLow);
    document.body.classList.toggle('gfx-low', GFX.low);
  }
  function setGfx(m) { GFX.mode = m; GFX.bad = 0; if (m !== 'auto') GFX.autoLow = false; try { localStorage.setItem('cfa_gfx_v1', m); } catch (e) { /* ไม่บันทึกก็ยังใช้ได้ */ } applyGfx(); }
  function fpsLoop() {
    var frames = 0, last = performance.now();
    function tick(now) {
      frames++;
      if (now - last >= 1000) {
        GFX.fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now;
        if (screenName === 'game' && !document.hidden) {
          if (!GFX.min || GFX.fps < GFX.min) GFX.min = GFX.fps;
          if (GFX.mode === 'auto' && !GFX.autoLow) {
            GFX.bad = GFX.fps < 40 ? GFX.bad + 1 : Math.max(0, GFX.bad - 1);
            if (GFX.bad >= 3) { GFX.autoLow = true; applyGfx(); }
          }
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var board, lCells, lJel, lTiles, lFx;
  var FUN = { cheerTimer: null, previewCells: [], reactionIndex: 0 };
  var BOOSTER_NAMES = { hammer: 'ค้อน', bomb: 'ระเบิด', rainbow: 'สายรุ้ง', shuffle: 'สลับ', moves5: '+5 ตา', rocket: 'จรวด' };
  var BOOSTER_TIPS = {
    hammer: 'ทุบ 1 ช่อง เหมาะกับกล่องหรือเยลลี่ที่เหลือชิ้นสุดท้าย',
    bomb: 'ล้างบริเวณ 3×3 เลือกจุดที่มีสิ่งกีดขวางหนาแน่น',
    rainbow: 'เลือกตัวสัตว์หรือขนมชนิดที่ต้องการ เพื่อลบทั้งหมดที่เหมือนกันบนกระดาน',
    shuffle: 'สลับตำแหน่งตัวจับคู่ เมื่อหาคู่ไม่เจอ',
    moves5: 'เพิ่มตาเดิน 5 ครั้งทันที เหมาะกับด่านที่ใกล้ถึงเป้าหมาย',
    rocket: 'เลือกแนวนอนหรือแนวตั้ง แล้วแตะจุดที่ต้องการยิงทั้งแถว' };
  function cheer(msg) {
    if (!G || screenName !== 'game') return;
    var tip = $('#tip'); if (!tip) return;
    var bubble = tip.querySelector('.fun-cheer');
    if (!bubble) { bubble = el('span','fun-cheer'); bubble.setAttribute('aria-live','polite'); tip.appendChild(bubble); }
    bubble.textContent = '💖 ' + msg; bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on');
    clearTimeout(FUN.cheerTimer);
    FUN.cheerTimer = setTimeout(function () { bubble.classList.remove('on'); }, 1500);
  }
  function clearPreview() {
    FUN.previewCells.forEach(function (ce) { ce.classList.remove('impact'); }); FUN.previewCells = [];
  }
  function drawPreview(r,c) {
    clearPreview(); if (!G || !G.target || !G.cells) return;
    var g = G.game, type = G.target, x = g.grid[r] && g.grid[r][c];
    var add = function (rr,cc) { if (rr < 0 || cc < 0 || rr >= g.R || cc >= g.C || g.hole[rr][cc]) return; var ce=G.cells[rr * g.C+cc]; if (ce) { ce.classList.add('impact'); FUN.previewCells.push(ce); } };
    if (type === 'hammer') { if (x) add(r,c); }
    else if (type === 'bomb') { for (var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++) add(r+dr,c+dc); }
    else if (type === 'rocket') { if (G.dir === 'v') for(var rr=0;rr<g.R;rr++) add(rr,c); else for(var cc=0;cc<g.C;cc++) add(r,cc); }
    else if (type === 'rainbow' && x && x.t === 'c' && x.color >= 0) { for (var rr=0;rr<g.R;rr++) for(var cc=0;cc<g.C;cc++) if (g.grid[rr][cc] && g.grid[rr][cc].t === 'c' && g.grid[rr][cc].color === x.color) add(rr,cc); }
  }
  function celebrateBooster(k,r,c) {
    if (!G || screenName !== 'game') return;
    comboText(ITEM[k].ic + ' ' + BOOSTER_NAMES[k] + '!'); cheer(['เยี่ยมเลย ใช้ตัวช่วยได้เก่งมาก!', 'เก่งจัง! ไปกันต่อ!', 'ว้าว! ใกล้ผ่านแล้ว!'][FUN.reactionIndex++ % 3]);
    if (GFX.low || G.skip || r == null || c == null) return;
    var x=(c+.5)*G.cs, y=(r+.5)*G.cs;
    for(var i=0;i<8;i++) {
      var a=i*Math.PI/4, p=fxEl('fun-spark',{left:x+'px',top:y+'px'},580);
      if(p) { p.textContent=['⭐','✨','🍬','💖'][i%4];p.style.setProperty('--dx',Math.cos(a)*G.cs*1.4+'px');p.style.setProperty('--dy',Math.sin(a)*G.cs*1.4+'px'); }
    }
  }
  function boosterGuide() {
    var html = '<h2>✨ ตัวช่วยแสนสนุก</h2><p class="muted">ใช้เฉพาะเมื่ออยากได้ความช่วยเหลือ — ทุกด่านเล่นต่อได้ตามปกติ</p><div class="list">' + S.ITEMS.map(function(it,i) {
      return '<div class="item guide-row"><span class="ic">'+ Art.booster(i,it.ic) + '</span><div class="tx"><b>'+it.name+'</b><span>'+ BOOSTER_TIPS[it.k] +'</span></div><span class="guide-count">'+(G ? avail(it.k) : S.get().inv[it.k])+' ชิ้น</span></div>';
    }).join('') + '</div><div class="m-btns"><button class="btn green" data-close>เข้าใจแล้ว ▶</button></div>';
    var card=openModal(html,true,function(){if(G) scheduleHint();});
    on(card,'[data-close]',function(){closeModal();if(G) scheduleHint();});
  }

  /* ---------------- พื้นฐาน ---------------- */
  function show(name) {
    ['home', 'map', 'game'].forEach(function (s) { $('#scr-' + s).classList.toggle('on', s === name); });
    screenName = name;
    refreshCoins();
    if (name === 'home') refreshHome();
    if (name !== 'game') { if (pendingReload) doReload(); else checkVersion(); }
  }
  function refreshCoins(bump) {
    var c = fmt(S.get().coins);
    document.querySelectorAll('[data-coins]').forEach(function (b) {
      b.textContent = c;
      if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
  }
  function toast(msg, ms) {
    var t = $('#toast'); t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 1800);
  }
  function openModal(html, closable, onClose) {
    var m = $('#modal'), card = $('#modal-card');
    card.innerHTML = (closable ? '<button class="m-x" data-x>✕</button>' : '') + html;
    m.hidden = false; card.scrollTop = 0;
    m._close = closable ? function () { closeModal(); if (onClose) onClose(); } : null;
    var x = card.querySelector('[data-x]'); if (x) x.onclick = function () { A.sfx('click'); m._close(); };
    return card;
  }
  function closeModal() { $('#modal').hidden = true; $('#modal-card').innerHTML = ''; }
  function on(card, sel, fn) { var b = card.querySelector(sel); if (b) b.onclick = function (e) { A.unlock(); A.sfx('click'); fn(e, b); }; return b; }

  /* ---------------- เวอร์ชันกลาง (version.json) ---------------- */
  /* ลด network call ซ้ำ: ตรวจเวอร์ชันไม่เกินหนึ่งครั้งต่อ 60 วินาที
   * ยกเว้นกลับมาออนไลน์หลังออฟไลน์ (force) เพื่อรับเวอร์ชันใหม่เร็วขึ้น */
  var lastVersionCheck = Date.now(), versionCheckBusy = false;
  function checkVersion(force) {
    if (!window.CF_VERSION || location.protocol === 'file:' || !window.fetch) return;
    var now = Date.now();
    if (versionCheckBusy || (!force && now - lastVersionCheck < 60000)) return;
    versionCheckBusy = true; lastVersionCheck = now;
    fetch(new URL('version.json?t=' + now, document.baseURI || location.href).href, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw Error('version HTTP ' + r.status); return r.json(); }).then(function (j) {
      if (j && j.version && j.version !== window.CF_VERSION) { if (screenName === 'game' && G) pendingReload = true; else doReload(); }
    }).catch(function () { /* ออฟไลน์: เล่นต่อได้ */ }).then(function () { versionCheckBusy = false; });
  }
  function doReload() {
    pendingReload = false;
    toast('🔄 มีเวอร์ชันใหม่ กำลังอัปเดต…', 3000);
    setTimeout(function () { location.reload(); }, 900);
  }

  /* ---------------- หน้าหลัก ---------------- */
  function townSVG() {
    var s = '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice"><ellipse cx="90" cy="250" rx="230" ry="90" fill="#ff9fd0"/><ellipse cx="330" cy="262" rx="220" ry="100" fill="#ffc46b"/><ellipse cx="200" cy="290" rx="330" ry="90" fill="#b6ec9c"/>';
    function house(x, y, w, h, wall, roof) {
      return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + wall + '" stroke="#fff" stroke-width="3"/>' +
        '<path d="M' + (x - 8) + ' ' + (y + 4) + 'q' + (w / 4 + 4) + ' -' + (h * 0.7) + ' ' + (w / 2 + 8) + ' -' + (h * 0.75) + 'q' + (w / 4 + 4) + ' ' + (h * 0.05) + ' ' + (w / 2 + 8) + ' ' + (h * 0.75) + 'z" fill="' + roof + '" stroke="#fff" stroke-width="3"/>' +
        '<circle cx="' + (x + w / 2) + '" cy="' + (y - h * 0.78) + '" r="7" fill="#f43a57" stroke="#fff" stroke-width="2"/>' +
        '<rect x="' + (x + w / 2 - 8) + '" y="' + (y + h - 26) + '" width="16" height="26" rx="8" fill="#7a3b00" opacity=".75"/>' +
        '<rect x="' + (x + 8) + '" y="' + (y + 12) + '" width="13" height="13" rx="4" fill="#fff8c4"/><rect x="' + (x + w - 21) + '" y="' + (y + 12) + '" width="13" height="13" rx="4" fill="#fff8c4"/></g>';
    }
    function lolly(x, y, r, c1, c2) {
      return '<g class="sway"><rect x="' + (x - 3) + '" y="' + y + '" width="6" height="' + (r * 2.6) + '" rx="3" fill="#fff"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c1 + '" stroke="#fff" stroke-width="3"/>' +
        '<path d="M' + x + ' ' + y + 'm-' + (r * 0.6) + ' 0a' + (r * 0.6) + ' ' + (r * 0.6) + ' 0 1 1 ' + (r * 0.6) + ' ' + (r * 0.6) + 'a' + (r * 0.3) + ' ' + (r * 0.3) + ' 0 1 1 -' + (r * 0.3) + ' -' + (r * 0.3) + '" fill="none" stroke="' + c2 + '" stroke-width="4" stroke-linecap="round"/></g>';
    }
    s += house(40, 150, 70, 70, '#ffe9b8', '#ff7ab8') + house(150, 130, 90, 92, '#d9f0ff', '#a34df2') + house(285, 158, 72, 64, '#ffd9ec', '#41cb4c');
    s += lolly(22, 150, 17, '#ff8d1f', '#fff') + lolly(128, 168, 13, '#2f9dff', '#fff') + lolly(262, 150, 18, '#f43a57', '#fff') + lolly(378, 160, 15, '#ffd420', '#fff');
    return s + '</svg>';
  }
  function refreshHome() {
    var d = S.get();
    $('#home-level').textContent = fmt(d.unlocked);
    $('#home-stars').textContent = fmt(S.totalStars());
    var w = L.WORLDS[L.worldOf(d.unlocked)];
    $('#home-world').textContent = w.icon + ' ' + w.name;
    var ms = S.missions().some(function (m) { return m.done && !m.claimed; });
    $('#rw-dot').hidden = !(S.dailyInfo().can || S.giftInfo().can || ms);
    $('#ver').textContent = window.CF_VERSION ? 'Deploy github ' + window.CF_VERSION : '';
    var completed = Math.max(0, d.unlocked - 1), next5 = (Math.floor(completed / 5) + 1) * 5;
    var left = next5 - completed, pct = ((completed % 5) / 5) * 100;
    var day = S.dailyInfo(), gift = S.giftInfo(), missions = S.missions();
    var readyMissions = missions.filter(function(m){return m.done && !m.claimed;}).length;
    var count = (day.can ? 1:0) + (gift.can ? 1:0) + readyMissions;
    $('#fun-message').textContent = count ? '🎁 รางวัลพร้อมรับ ' + count + ' รายการ!' : '🍭 วันนี้มีเรื่องสนุกให้ทำ!';
    $('#fun-open').textContent = count ? 'รับเลย ✨' : 'ดูของขวัญ 🎁';
    $('#fun-mission').textContent = readyMissions ? '✅ ภารกิจสำเร็จ ' + readyMissions : '🎯 ภารกิจวันนี้ ' + missions.filter(function(m){return m.claimed;}).length + '/3';
    $('#fun-next').textContent = (next5 % 10 === 0 ? '🎁 หีบใหญ่' : '💎 โบนัส') + ' อีก ' + left + ' ด่าน';
    $('#fun-progress').style.width = pct + '%';
  }

  /* ---------------- แผนที่ ---------------- */
  /* local010 — TRUE 3D illustrated Animal World Map
   * 3D scene image is BACKGROUND ONLY, all level numbers and state buttons remain actual DOM.
   * Never modify save, coin, stars, user, game engine, or level unlock rules. */
  var ANIMAL_MAP_WORLDS = [
    {name:'หมู่บ้านกระต่าย', icon:'🐰'}, {name:'น้ำตกไดโนเสาร์',icon:'🦖'},
    {name:'ทุ่งหญ้าผองเพื่อน',icon:'🐴'}, {name:'ปราสาทสัตว์น้อย',icon:'🏰'}
  ];
  /* Positions measured on the 941x1672 original 3D island image.
   * Map is shown with CSS background-size:cover; same transform is used for buttons.
   * [1] is at island bottom, [10] near top/castle. */
  var ANIMAL_TRAIL = [
    [285,1480], [320,1360], [275,1250], [370,1130], [290,1010],
    [640,900], [460,780], [315,645], [440,515], [480,390]
  ];
  function renderAnimalMap(showOlder) {
    var d = S.get(), cur = Math.max(1, d.unlocked);
    /* Only mount nearby chapters. Show older chapters on explicit request. */
    var from = Math.max(1, mapFrom || cur - 21), to = cur + 9;
    var firstPart = Math.floor((from - 1) / 10);
    var lastPart = Math.floor((to - 1) / 10);
    var inner = $('#map-inner'), scroll = $('#map-scroll');
    var width = Math.max(300, inner.clientWidth || scroll.clientWidth || 390);
    var sceneH = Math.round(Math.max(1020, width * (1672 / 941)));
    var totalH = (lastPart - firstPart + 1) * sceneH;
    inner.innerHTML = ''; inner.style.height = totalH + 'px';
    var world = ANIMAL_MAP_WORLDS[Math.floor((cur - 1) / 25) % ANIMAL_MAP_WORLDS.length];
    var worldLabel = $('#map-world'), curLabel = $('#map-current');
    if (worldLabel) worldLabel.textContent = world.icon + ' ' + world.name;
    if (curLabel) curLabel.textContent = 'ด่าน ' + cur;
    var scale = Math.max(width / 941, sceneH / 1672);
    var xOffset = (width - 941 * scale) / 2;
    var yOffset = (sceneH - 1672 * scale) / 2;
    function xyOf(n) {
      var part = Math.floor((n - 1) / 10);
      var pos = ANIMAL_TRAIL[(n - 1) % 10];
      return {
        x: Math.max(31, Math.min(width - 31, xOffset + pos[0] * scale)),
        y: (lastPart - part) * sceneH + yOffset + pos[1] * scale
      };
    }
    /* Island plates are reversed: chapter 1 at bottom, later chapters above. */
    for (var p = lastPart; p >= firstPart; p--) {
      var top = (lastPart - p) * sceneH;
      var scene = el('div', 'map-scene-3d w' + (p % 4));
      scene.style.top = top + 'px'; scene.style.height = sceneH + 'px';
      scene.setAttribute('aria-hidden','true'); inner.appendChild(scene);
      var title = el('div','map-chapter-label',ANIMAL_MAP_WORLDS[Math.floor(p/3)%4].icon + ' ' + ANIMAL_MAP_WORLDS[Math.floor(p/3)%4].name);
      title.style.top = (top + 12) + 'px'; title.setAttribute('aria-hidden','true'); inner.appendChild(title);
    }
    for (var n = firstPart * 10 + 1; n <= (lastPart+1)*10; n++) (function(num) {
      var pos = xyOf(num), stars = d.stars[num] || 0;
      var locked = num > cur, current = num === cur;
      var cls = 'node animal-map-node' + (current ? ' cur' : locked ? ' lock' : ' done');
      var buttonText = String(num) + (locked ? '<span class="lock-ic" aria-hidden="true">🔒</span>' : '');
      if (stars) buttonText += '<span class="st" aria-hidden="true">' + '★'.repeat(stars) + '</span>';
      if (num % 10 === 0) buttonText += '<span class="tag" aria-hidden="true">🎁</span>';
      else if (num % 5 === 0) buttonText += '<span class="tag" aria-hidden="true">🏅</span>';
      var button = el('button',cls,buttonText);
      button.type='button';button.style.left=pos.x+'px';button.style.top=pos.y+'px';
      button.setAttribute('aria-label','ด่าน '+num+(locked?' ยังไม่ปลดล็อก':current?' ด่านปัจจุบัน':' ผ่านแล้ว '+stars+' ดาว'));
      if (current) button.setAttribute('aria-current','step');
      button.onclick = function () {
        A.unlock(); A.sfx('click');
        if (locked) toast('🔒 ผ่านด่าน ' + (num - 1) + ' ก่อนนะ'); else preLevel(num);
      };
      inner.appendChild(button);
    })(n);
    if (firstPart > 0) {
      var more = el('button','btn btn-mini more','⬇ ดูด่านก่อนหน้า');
      more.style.position='absolute';more.style.left='50%';more.style.bottom='16px';more.style.transform='translateX(-50%)';
      more.onclick=function(){mapFrom=Math.max(1,firstPart*10-29);renderAnimalMap(true);};
      inner.appendChild(more);
    }
    $('#map-stars').textContent = fmt(S.totalStars());
    var curPos = xyOf(cur).y;
    scroll.scrollTop = showOlder ? Math.max(0,totalH-scroll.clientHeight) : Math.max(0,curPos-scroll.clientHeight*0.52);
  }
  function renderMap() {
    if (Art.THEME === 'animals') { renderAnimalMap(); return; }
    var d = S.get(), cur = d.unlocked, from = Math.max(1, mapFrom || cur - 45), to = cur + 12;
    var SP = 96, padB = 90, padT = 110, H = padB + padT + (to - from) * SP;
    var inner = $('#map-inner'); inner.innerHTML = ''; inner.style.height = H + 'px';
    function yOf(n) { return H - padB - (n - from) * SP; }
    function xOf(n) { return 50 + 30 * Math.sin(n * 0.85); }
    var n, a = from;
    while (a <= to) {
      var seg = Math.floor((a - 1) / 25), b = Math.min(to, (seg + 1) * 25), w = seg % 4;
      var top = b === to ? 0 : yOf(b) - SP / 2, bot = a === from ? H : yOf(a) + SP / 2;
      var band = el('div', 'band w' + w); band.style.top = top + 'px'; band.style.height = (bot - top) + 'px';
      band.appendChild(el('div', 'band-title', L.WORLDS[w].icon + ' ' + L.WORLDS[w].name + ' · ด่าน ' + (seg * 25 + 1) + '–' + ((seg + 1) * 25)));
      for (n = a; n <= b; n += 2) {
        var de = el('div', 'deco', L.WORLDS[w].deco[n % 5]);
        de.style.left = (xOf(n) > 50 ? 6 + (n * 7) % 14 : 74 + (n * 7) % 14) + '%';
        de.style.top = (yOf(n) - top - 20) + 'px'; de.style.animationDelay = (-(n % 5)) + 's';
        band.appendChild(de);
      }
      inner.appendChild(band); a = b + 1;
    }
    var pts = []; for (n = from; n <= to; n++) pts.push(xOf(n).toFixed(1) + ',' + yOf(n));
    inner.insertAdjacentHTML('beforeend', '<svg id="map-path" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none"><polyline points="' + pts.join(' ') + '" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".95"/>' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#ff9fd0" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 26" vector-effect="non-scaling-stroke"/></svg>');
    for (n = from; n <= to; n++) (function (n) {
      var st = d.stars[n] || 0, cls = 'node' + (n === cur ? ' cur' : st ? ' done' : n > cur ? ' lock' : '');
      var nd = el('button', cls, (n > cur ? '🔒' : n) + (st ? '<span class="st">' + '★★★'.slice(0, st) + '☆☆☆'.slice(0, 3 - st) + '</span>' : '') +
        (n % 10 === 0 ? '<span class="tag">' + (st ? '📭' : '🎁') + '</span>' : n % 5 === 0 ? '<span class="tag">💎</span>' : ''));
      nd.style.left = xOf(n) + '%'; nd.style.top = yOf(n) + 'px';
      nd.onclick = function () { A.unlock(); A.sfx('click'); if (n > cur) toast('🔒 ผ่านด่าน ' + (n - 1) + ' ก่อนนะ'); else preLevel(n); };
      inner.appendChild(nd);
    })(n);
    if (from > 1) {
      var more = el('button', 'btn btn-mini more', '⬇ ดูด่านก่อนหน้า');
      more.style.position = 'absolute'; more.style.left = '50%'; more.style.bottom = '6px'; more.style.transform = 'translateX(-50%)';
      more.onclick = function () { mapFrom = Math.max(1, from - 100); renderMap(); };
      inner.appendChild(more);
    }
    $('#map-stars').textContent = fmt(S.totalStars());
    var sc = $('#map-scroll'); sc.scrollTop = yOf(cur) - sc.clientHeight / 2;
  }
  function openMap() { mapFrom = 0; show('map'); renderMap(); }

  function goalChips(list, useLeft) {
    return list.map(function (g) {
      var num = g.type === 'score' ? fmt(g.target) : (useLeft ? g.left : (g.target != null ? g.target : 'ทั้งหมด'));
      return '<div class="goal' + (useLeft && g.done ? ' done' : '') + '">' + Art.icon(g.type, g.color) + '<span>' + (useLeft && g.done ? '✓' : num) + '</span></div>';
    }).join('');
  }
  function themify(s) { return Art.THEME === 'animals' ? String(s).replace(/ลูกอม|ขนม/g, 'สัตว์').replace(/สีเดียวกัน/g, 'ชนิดเดียวกัน') : s; }
  function goalText(lv) {
    return lv.goals.map(function (g) {
      if (g.type === 'score') return 'ทำคะแนนให้ถึง ' + fmt(g.target);
      if (g.type === 'color') return (Art.THEME === 'animals' ? 'รวบรวม ' : 'เก็บ') + Art.NAMES[g.color] + ' ' + g.target + ' ชิ้น';
      if (g.type === 'jelly') return 'ล้างเยลลี่ให้หมด';
      return 'เปิดกล่องของขวัญให้ครบ';
    }).join(' · ');
  }
  function preLevel(n) {
    var lv = L.get(n), d = S.get(), st = d.stars[n] || 0, w = L.WORLDS[lv.world];
    var free = Object.keys(lv.free).map(function (k) { return ITEM[k].ic + ' ' + ITEM[k].name; }).join(', ');
    var card = openModal('<h2>ด่าน ' + n + (lv.bonus ? ' 💎' : '') + '</h2><p class="muted">' + w.icon + ' ' + w.name + (lv.bonus ? ' · ด่านโบนัส' : '') + (n % 10 === 0 ? ' · มีหีบสมบัติ 🎁' : '') + '</p>' +
      '<div class="stars3" style="transform:scale(.6);margin:-14px 0"><span class="' + (st > 0 ? 'on' : '') + '">★</span><span class="' + (st > 1 ? 'on' : '') + '">★</span><span class="' + (st > 2 ? 'on' : '') + '">★</span></div>' +
      '<h3 style="text-align:center">🎯 เป้าหมาย</h3><div class="goal-list">' + goalChips(lv.goals) + '</div><p>' + goalText(lv) + '</p><p>👣 ตาเดิน <b>' + lv.moves + '</b> ครั้ง</p>' +
      (free ? '<p style="color:#c97f00">🎁 ทดลองฟรี: ' + free + '</p>' : '') + (d.best[n] ? '<p class="muted">คะแนนสูงสุด ' + fmt(d.best[n]) + '</p>' : '') +
      '<div class="m-btns"><button class="btn green big" data-go>▶ เล่นเลย!</button></div>', true);
    on(card, '[data-go]', function () { startLevel(n); });
  }

  /* ---------------- เริ่มด่าน / วางกระดาน ---------------- */
  function startLevel(n) {
    closeModal(); cfToken++; $('#confetti').innerHTML = '';
    var lv = L.get(n), free = {}, k;
    for (k in lv.free) free[k] = lv.free[k];
    G = { n: n, lv: lv, game: new E.Game(lv), tiles: {}, jel: {}, busy: false, skip: false, sel: null, drag: null, target: null, dir: 'h', free: free,
      last: { cleared: 0, specials: 0, combo3: 0 }, hintT: null, hinted: [], cs: 44, needLayout: false };
    show('game'); clearPreview(); clearTimeout(FUN.cheerTimer);
    $('#scr-game').className = 'screen on w' + lv.world;
    $('#g-level').textContent = n + (lv.bonus ? ' 💎' : '');
    var tip = $('#tip'); tip.hidden = false; tip.innerHTML = lv.tip ? '💡 ' + themify(lv.tip) : '🎯 ' + goalText(lv);
    if (window.CFPhoto) window.CFPhoto.decorate();
    cancelTarget(); layout(); hud(); boosters(); hideSkip(); scheduleHint();
  }
  function layout() {
    if (!G) return;
    var g = G.game, wrap = $('#board-wrap'), cs0 = getComputedStyle(wrap);
    var w = wrap.clientWidth - parseFloat(cs0.paddingLeft) - parseFloat(cs0.paddingRight);
    var h = wrap.clientHeight - parseFloat(cs0.paddingTop) - parseFloat(cs0.paddingBottom);
    var cs = Math.max(24, Math.min(78, Math.floor(Math.min(w / g.C, h / g.R))));
    G.cs = cs; G.needLayout = false;
    board.style.width = g.C * cs + 'px'; board.style.height = g.R * cs + 'px'; board.style.setProperty('--cs', cs + 'px');
    lCells.innerHTML = ''; lJel.innerHTML = ''; lTiles.innerHTML = ''; lFx.innerHTML = ''; G.tiles = {}; G.jel = {}; G.cells = {};
    for (var r = 0; r < g.R; r++) for (var c = 0; c < g.C; c++) {
      if (g.hole[r][c]) continue;
      var ce = el('div', 'cell'); pos(ce, r, c); lCells.appendChild(ce); G.cells[r * g.C + c] = ce;
      var je = el('div', 'jel l' + g.jelly[r][c]); pos(je, r, c); lJel.appendChild(je); G.jel[r * g.C + c] = je;
      if (g.grid[r][c]) mkTile(g.grid[r][c], r, c);
    }
  }
  function pos(e, r, c) { e.style.transform = 'translate(' + (c * G.cs) + 'px,' + (r * G.cs) + 'px)'; }
  function mkTile(x, r, c) {
    var e = el('div', 'tile' + (x.sp ? ' sp' : ''), Art.tile(x));
    e._sig = Art.sig(x); pos(e, r, c); lTiles.appendChild(e);
    return (G.tiles[x.id] = { el: e, r: r, c: c });
  }
  function retile(t, x) { t.el.innerHTML = Art.tile(x); t.el._sig = Art.sig(x); t.el.classList.toggle('sp', !!x.sp); }
  /* ให้ DOM ตรงกับสถานะจริงของ engine เสมอ (กันภาพค้างจากแอนิเมชัน) */
  function sync() {
    var g = G.game, seen = {}, id, r, c;
    for (r = 0; r < g.R; r++) for (c = 0; c < g.C; c++) {
      var x = g.grid[r][c];
      if (!g.hole[r][c]) G.jel[r * g.C + c].className = 'jel l' + g.jelly[r][c];
      if (!x) continue;
      seen[x.id] = 1;
      var t = G.tiles[x.id];
      if (!t) { mkTile(x, r, c); continue; }
      if (t.r !== r || t.c !== c) { t.r = r; t.c = c; pos(t.el, r, c); }
      if (t.el._sig !== Art.sig(x)) retile(t, x);
      t.el.classList.remove('pop', 'born', 'shake');
    }
    for (id in G.tiles) if (!seen[id]) { G.tiles[id].el.remove(); delete G.tiles[id]; }
    var kids = lTiles.children, alive = {};
    for (id in G.tiles) alive[id] = G.tiles[id].el;
    for (var i = kids.length - 1; i >= 0; i--) { var keep = false; for (id in alive) if (alive[id] === kids[i]) { keep = true; break; } if (!keep) kids[i].remove(); }
  }

  /* ---------------- HUD ---------------- */
  function hud() { hudFrom(G.game._hud()); }
  function hudFrom(h) {
    var lv = G.lv, goals = G.game.goals();
    goals.forEach(function (g, i) { g.left = h.goals[i]; g.done = g.left <= 0; });
    $('#g-goals').innerHTML = goalChips(goals, true);
    $('#g-moves').textContent = h.moves;
    $('.hud-m').classList.toggle('low', h.moves <= 3 && h.moves > 0);
    $('#g-score').textContent = fmt(h.score);
    var s3 = lv.stars[1], s2 = lv.stars[0], s1 = Math.round(s2 * 0.45);
    $('#g-bar').style.width = Math.min(100, h.score / s3 * 100) + '%';
    [[s1, '#g-s1'], [s2, '#g-s2'], [s3, '#g-s3']].forEach(function (p) {
      var e = $(p[1]); e.style.left = Math.min(100, p[0] / s3 * 100) + '%'; e.classList.toggle('on', h.score >= p[0]);
    });
  }

  /* ---------------- ตัวช่วย ---------------- */
  function avail(k) { return (G.free[k] || 0) + S.get().inv[k]; }
  function boosters() {
    var bar = $('#boosters'); bar.innerHTML = '';
    S.ITEMS.forEach(function (it, idx) {
      var n = avail(it.k), fr = G.free[it.k] > 0;
      var b = el('button', 'bst bst-' + it.k + (G.target === it.k ? ' act' : ''), Art.booster(idx, it.ic) + '<span class="bst-name">' + BOOSTER_NAMES[it.k] + '</span><b class="' + (fr ? 'free' : n ? '' : 'zero') + '">' + (fr ? 'ฟรี' : n ? n : '+') + '</b>');
      b.setAttribute('aria-label', it.name + ' — ' + it.desc + ' มี ' + n + ' ชิ้น');
      b.title = it.name + ' — ' + it.desc; b.dataset.k = it.k;
      b.onclick = function () {
        A.unlock(); if (!G || G.busy) return; A.sfx('click'); clearHint();
        if (G.target === it.k) return cancelTarget();
        if (avail(it.k) <= 0) return buyOne(it.k);
        if (it.target) setTarget(it.k); else applyBooster(it.k);
      };
      bar.appendChild(b);
    });
  }
  function buyOne(k) {
    var it = ITEM[k], can = S.get().coins >= it.price;
    var card = openModal('<div style="font-size:60px">' + it.ic + '</div><h2>' + it.name + '</h2><p>' + it.desc + '</p><p class="muted">มีเหรียญ 🪙 ' + fmt(S.get().coins) + '</p>' +
      '<div class="m-btns"><button class="btn gold big" data-buy ' + (can ? '' : 'disabled') + '>' + (can ? 'ซื้อ 🪙 ' + it.price : 'เหรียญไม่พอ (🪙 ' + it.price + ')') + '</button></div>' +
      '<p class="muted">ไม่บังคับซื้อ — ทุกด่านผ่านได้โดยไม่ใช้ตัวช่วย</p>', true);
    on(card, '[data-buy]', function () {
      if (S.buy(k)) { A.sfx('coin'); closeModal(); refreshCoins(true); boosters(); toast(it.ic + ' ซื้อ ' + it.name + ' แล้ว แตะเพื่อใช้ได้เลย'); }
    });
  }
  function setTarget(k) {
    clearPreview(); G.target = k; G.dir = 'h'; setSel(null); cheer('เลือกจุดที่เหมาะที่สุด แล้วแตะได้เลย!');
    board.classList.add('targeting');
    $('#target-bar').hidden = false;
    $('#target-text').textContent = ITEM[k].ic + ' แตะช่องบนกระดานที่ต้องการใช้ ' + ITEM[k].name;
    var db = $('#target-dir'); db.hidden = k !== 'rocket'; db.textContent = '↔ แนวนอน';
    boosters();
  }
  function cancelTarget() {
    if (G) G.target = null; clearPreview();
    board.classList.remove('targeting'); $('#target-bar').hidden = true;
    if (G) boosters();
  }
  function applyBooster(k, r, c) {
    if (avail(k) <= 0) return;
    var ev = G.game.useBooster(k, r, c, G.dir);
    if (!ev) { A.sfx('bad'); toast('ใช้กับช่องนี้ไม่ได้ ลองช่องอื่นนะ'); return; }
    if (G.free[k] > 0) G.free[k]--; else S.useItem(k);
    S.missionAdd('boost1', 1);
    cancelTarget(); A.sfx('special'); celebrateBooster(k,r,c);
    if (k === 'moves5') toast('✨ เพิ่ม 5 ตาเดินแล้ว!');
    run(ev);
  }

  /* ---------------- การควบคุม (สัมผัส / เมาส์) ---------------- */
  function cellAt(e) {
    var rc = board.getBoundingClientRect(), c = Math.floor((e.clientX - rc.left) / G.cs), r = Math.floor((e.clientY - rc.top) / G.cs);
    if (r < 0 || c < 0 || r >= G.game.R || c >= G.game.C || G.game.hole[r][c]) return null;
    return { r: r, c: c };
  }
  function setSel(p) {
    var C = G.game.C;
    if (G.sel) { var x0 = G.game.grid[G.sel.r][G.sel.c], t0 = x0 && G.tiles[x0.id]; if (t0) t0.el.classList.remove('sel'); var c0 = G.cells[G.sel.r * C + G.sel.c]; if (c0) c0.classList.remove('on'); }
    G.sel = p;
    if (p) { var x = G.game.grid[p.r][p.c], t = x && G.tiles[x.id]; if (t) t.el.classList.add('sel'); var c1 = G.cells[p.r * C + p.c]; if (c1) c1.classList.add('on'); }
  }
  function bindBoard() {
    board.addEventListener('pointermove', function (e) {
      if (!G || !G.target || G.busy || e.pointerType === 'touch') return;
      var p = cellAt(e); if (!p) clearPreview(); else drawPreview(p.r,p.c);
    });
    board.addEventListener('pointerleave',clearPreview);
    board.addEventListener('pointerdown', function (e) {
      A.unlock();
      if (!G || G.busy) return;
      e.preventDefault();
      var p = cellAt(e); if (!p) return;
      clearHint();
      if (G.target) return applyBooster(G.target, p.r, p.c);
      G.drag = { r: p.r, c: p.c, x: e.clientX, y: e.clientY, done: false };
    });
    window.addEventListener('pointermove', function (e) {
      if (!G || !G.drag || G.drag.done || G.busy) return;
      var dx = e.clientX - G.drag.x, dy = e.clientY - G.drag.y, th = G.cs * 0.32;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      G.drag.done = true;
      var dr = 0, dc = 0;
      if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1; else dr = dy > 0 ? 1 : -1;
      trySwap(G.drag.r, G.drag.c, G.drag.r + dr, G.drag.c + dc);
    });
    function up() {
      if (!G || !G.drag) return;
      var d = G.drag; G.drag = null;
      if (d.done || G.busy) return;
      var s = G.sel;
      if (s && Math.abs(s.r - d.r) + Math.abs(s.c - d.c) === 1) return trySwap(s.r, s.c, d.r, d.c);
      var x = G.game.grid[d.r][d.c];
      if (s && s.r === d.r && s.c === d.c) setSel(null);
      else if (x && x.t === 'c') { setSel({ r: d.r, c: d.c }); A.sfx('click'); }
      else setSel(null);
      scheduleHint();
    }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', function () { if (G) G.drag = null; });
  }
  function trySwap(r1, c1, r2, c2) {
    var g = G.game;
    setSel(null);
    if (G.busy || !g.canSwap(r1, c1, r2, c2)) return;
    clearHint(); G.busy = true;
    var a = g.grid[r1][c1], b = g.grid[r2][c2], ta = G.tiles[a.id], tb = G.tiles[b.id], me = G;
    var ev = g.swap(r1, c1, r2, c2);
    if (ev) { A.sfx('swap'); return run(ev); }
    A.sfx('bad'); pos(ta.el, r2, c2); pos(tb.el, r1, c1);
    wait(170).then(function () {
      if (G !== me) return;
      pos(ta.el, r1, c1); pos(tb.el, r2, c2); ta.el.classList.add('shake'); tb.el.classList.add('shake');
      return wait(200);
    }).then(function () {
      if (G !== me) return;
      ta.el.classList.remove('shake'); tb.el.classList.remove('shake'); G.busy = false; scheduleHint();
    });
  }

  /* ---------------- แอนิเมชัน ---------------- */
  function wait(ms) {
    return new Promise(function (res) {
      if (!G || G.skip) return res();
      setTimeout(res, ms * (S.get().settings.fast ? 0.55 : 1));
    });
  }
  function showSkip() { $('#g-skip').hidden = false; }
  function hideSkip() { $('#g-skip').hidden = true; if (G) G.skip = false; board.classList.remove('noanim'); }
  function fxEl(cls, css, ms) {
    if (!G || G.skip) return;
    var e = el('div', cls); for (var k in css) e.style[k] = css[k];
    lFx.appendChild(e); setTimeout(function () { e.remove(); }, ms || 520);
    return e;
  }
  function burst(r, c, color, n) {
    if (!G || G.skip) return;
    var cs = G.cs, col = color >= 0 ? Art.COL[color][1] : '#fff';
    if (GFX.low) n = 1;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, d = cs * (0.5 + Math.random() * 0.8);
      var p = fxEl('p', { left: (c + 0.5) * cs + 'px', top: (r + 0.5) * cs + 'px', background: i % 3 === 2 ? '#fff' : col }, 580);
      if (p) { p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', (Math.sin(a) * d + cs * 0.35) + 'px'); p.style.setProperty('--rot', (Math.random() * 600 - 300) + 'deg'); }
    }
    if (!GFX.low && Art.SPR.ok) {
      var s = fxEl('spk', { left: (c + 0.5) * cs + 'px', top: (r + 0.5) * cs + 'px' }, 620), a2 = Math.random() * 6.283;
      if (s) { s.style.setProperty('--dx', Math.cos(a2) * cs * 0.5 + 'px'); s.style.setProperty('--dy', (Math.sin(a2) * cs * 0.5 - cs * 0.4) + 'px'); }
    }
  }
  function boardKick(cls, ms) {
    if (!G || G.skip || GFX.low) return;
    board.classList.remove(cls); void board.offsetWidth; board.classList.add(cls);
    setTimeout(function () { board.classList.remove(cls); }, ms);
  }
  function playFx(f) {
    var g = G.game, cs = G.cs;
    if (f.kind === 'blast' || f.kind === 'smash' || f.kind === 'nova') {
      boardKick('shake-b', 340);
      var fl = fxEl('flash', {}, 400);
      if (fl) { fl.style.setProperty('--fx', (f.c + 0.5) / g.C * 100 + '%'); fl.style.setProperty('--fy', (f.r + 0.5) / g.R * 100 + '%'); }
    }
    if (f.kind === 'row') fxEl('beam', { left: '0', top: (f.r + 0.2) * cs + 'px', width: g.C * cs + 'px', height: cs * 0.6 + 'px' });
    else if (f.kind === 'col') fxEl('beam v', { top: '0', left: (f.c + 0.2) * cs + 'px', height: g.R * cs + 'px', width: cs * 0.6 + 'px' });
    else if (f.kind === 'blast' || f.kind === 'smash' || f.kind === 'nova') {
      var rad = f.kind === 'nova' ? Math.max(g.R, g.C) : f.kind === 'smash' ? 0.5 : f.rad + 0.7, sz = rad * 2 * cs;
      fxEl('ring', { left: (f.c + 0.5) * cs - sz / 2 + 'px', top: (f.r + 0.5) * cs - sz / 2 + 'px', width: sz + 'px', height: sz + 'px' });
    } else if (f.kind === 'zap') {
      f.to.slice(0, 36).forEach(function (p) {
        var dx = (p[1] - f.c) * cs, dy = (p[0] - f.r) * cs;
        fxEl('zap', { left: (f.c + 0.5) * cs + 'px', top: (f.r + 0.5) * cs + 'px', width: Math.sqrt(dx * dx + dy * dy) + 'px', transform: 'rotate(' + Math.atan2(dy, dx) + 'rad)' }, 400);
      });
    }
  }
  function comboText(txt) {
    if (!G || G.skip) return;
    var e = $('#combo'); e.textContent = txt; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show');
  }
  var PRAISE = ['', '', 'หวานสุด ๆ!', 'สุดยอด!', 'มหัศจรรย์!', 'เทพมาก!'];
  function plusGlow() { var m = $('.hud-m'); m.classList.remove('plus'); void m.offsetWidth; m.classList.add('plus'); setTimeout(function () { m.classList.remove('plus'); }, 950); }
  /* เหรียญรางวัลบินเข้ากระเป๋า (ภาพประกอบเท่านั้น ยอดเหรียญมาจาก Save ตามเดิม) */
  function coinFly(fromEl) {
    var to = document.querySelector('.screen.on [data-coins]'), app = $('#app');
    if (!fromEl || !to || GFX.low) return;
    var a = fromEl.getBoundingClientRect(), b = to.getBoundingClientRect(), o = app.getBoundingClientRect();
    for (var i = 0; i < 7; i++) (function (i) {
      var c = el('i', 'coinfly', '🪙');
      var sx = a.left + a.width / 2 - o.left - 15 + (Math.random() * 60 - 30), sy = a.top - o.top + (Math.random() * 20 - 10);
      c.style.transform = 'translate(' + sx + 'px,' + sy + 'px) scale(.6)';
      app.appendChild(c);
      setTimeout(function () { c.style.transform = 'translate(' + (b.left - o.left - 20) + 'px,' + (b.top - o.top - 4) + 'px) scale(1)'; c.style.opacity = '.2'; }, 30 + i * 70);
      setTimeout(function () { c.remove(); }, 900 + i * 70);
    })(i);
  }

  var H = {
    swap: async function (e) {
      [e.a, e.b].forEach(function (p) { var t = G.tiles[p.id]; if (t) { t.r = p.r; t.c = p.c; t.el.style.setProperty('--d', '.16s'); pos(t.el, p.r, p.c); } });
      await wait(170);
    },
    clear: async function (e) {
      var me = G, dying = [], cx = 0, cy = 0, n = 0;
      if (e.transformed.length) {
        e.transformed.forEach(function (t) { var tt = G.tiles[t.id]; if (tt) { retile(tt, { t: 'c', color: t.color, sp: t.sp }); tt.el.classList.add('born'); } });
        A.sfx('special'); await wait(330); if (G !== me) return;
      }
      e.fx.forEach(playFx);
      var per = e.removed.length > 24 ? 2 : 4;
      e.removed.forEach(function (t) {
        var tt = G.tiles[t.id]; if (!tt) return;
        tt.el.classList.remove('sp', 'sel', 'hint'); tt.el.classList.add('pop'); burst(t.r, t.c, t.color, per);
        dying.push(tt.el); delete G.tiles[t.id]; cx += t.c; cy += t.r; n++;
      });
      e.boxes.forEach(function (b) {
        var tt = G.tiles[b.id]; if (!tt) return;
        burst(b.r, b.c, 2, 5);
        if (b.hp <= 0) { tt.el.classList.add('pop'); dying.push(tt.el); delete G.tiles[b.id]; }
        else { retile(tt, { t: 'box', hp: b.hp }); tt.el.classList.add('shake'); }
      });
      e.jelly.forEach(function (j) { var je = G.jel[j.r * G.game.C + j.c]; if (je) je.className = 'jel l' + j.level; });
      A.sfx(e.fx.length ? 'blast' : 'match', e.combo);
      if (n && e.score) {
        var f = fxEl('float', { left: (cx / n + 0.5) * G.cs + 'px', top: (cy / n + 0.5) * G.cs + 'px' }, 820);
        if (f) f.textContent = '+' + fmt(e.score);
      }
      if (e.combo >= 2) { comboText('🍭 COMBO ×' + e.mult + ' ' + PRAISE[Math.min(5, e.combo)]); boardKick('combo-glow', 620); if (e.combo >= 3) cheer('โอ้โห! คอมโบสุดยอด!'); }
      else if (e.created.length) cheer('เก่งมาก! ได้ขนมพิเศษด้วย!');
      hudFrom(e.hud);
      await wait(250); if (G !== me) return;
      dying.forEach(function (d) { d.remove(); });
      if (e.created.length) {
        e.created.forEach(function (t) { mkTile({ t: 'c', id: t.id, color: t.color, sp: t.sp }, t.r, t.c).el.classList.add('born'); });
        A.sfx('special'); await wait(120);
      }
    },
    fall: async function (e) {
      var maxD = 1;
      function dur(d) { return Math.min(0.46, 0.1 + 0.05 * d); }
      e.spawns.forEach(function (s) { mkTile(s, s.fr, s.c); });
      if (e.spawns.length) void board.offsetWidth;
      e.moves.forEach(function (m) {
        var t = G.tiles[m.id]; if (!t) return;
        var d = Math.max(1, Math.abs(m.r - m.fr)); if (d > maxD) maxD = d;
        t.el.style.setProperty('--d', dur(d) + 's'); t.r = m.r; t.c = m.c; pos(t.el, m.r, m.c);
      });
      e.spawns.forEach(function (s) {
        var t = G.tiles[s.id], d = s.r - s.fr; if (d > maxD) maxD = d;
        t.el.style.setProperty('--d', dur(d) + 's'); t.r = s.r; t.c = s.c; pos(t.el, s.r, s.c);
      });
      await wait(dur(maxD) * 1000 + 30);
    },
    shuffle: async function (e) {
      toast('🔀 สลับขนมทั้งกระดาน!'); A.sfx('special');
      e.tiles.forEach(function (p) { var t = G.tiles[p.id]; if (t) { t.el.style.setProperty('--d', '.42s'); t.r = p.r; t.c = p.c; pos(t.el, p.r, p.c); if (!G.skip && !GFX.low) t.el.classList.add('spin'); } });
      await wait(460);
      e.tiles.forEach(function (p) { var t = G.tiles[p.id]; if (t) t.el.classList.remove('spin'); });
    },
    finale: async function (e) {
      hudFrom(e.hud);
      if (e.count > 0) { comboText('🎉 SUGAR RUSH!'); A.sfx('special'); await wait(750); }
    },
    moves: async function (e) { hudFrom(e.hud); plusGlow(); await wait(200); }
  };
  async function play(ev) {
    var me = G;
    for (var i = 0; i < ev.length; i++) {
      if (G !== me) return false;
      await H[ev[i].type](ev[i]);
    }
    if (G !== me) return false;
    sync(); hud();
    return true;
  }
  async function run(ev) {
    var me = G;
    G.busy = true; showSkip();
    if (!(await play(ev))) return;
    var g = G.game, st = g.stats, la = G.last;
    S.missionAdd('clear150', st.cleared - la.cleared); S.missionAdd('special6', st.specials - la.specials); S.missionAdd('combo3', st.combo3 - la.combo3);
    G.last = { cleared: st.cleared, specials: st.specials, combo3: st.combo3 };
    var status = g.status();
    if (status === 'won') {
      await wait(250); if (G !== me) return;
      if (!(await play(g.finale()))) return;
      hideSkip();
      return win();
    }
    hideSkip();
    if (G.needLayout) layout();
    if (status === 'lost') { A.sfx('fail'); return failDialog(); }
    G.busy = false; scheduleHint();
  }

  function scheduleHint() {
    if (!G) return;
    clearTimeout(G.hintT);
    G.hintT = setTimeout(function () {
      if (!G || G.busy || G.target || !$('#modal').hidden) return;
      var m = G.game.findMoves(true)[0]; if (!m) return;
      [[m.r1, m.c1], [m.r2, m.c2]].forEach(function (p) {
        var x = G.game.grid[p[0]][p[1]], t = x && G.tiles[x.id];
        if (t) { t.el.classList.add('hint'); G.hinted.push(t.el); }
      });
    }, G.n <= 3 ? 2200 : 6000);
  }
  function clearHint() {
    if (!G) return;
    clearTimeout(G.hintT);
    G.hinted.forEach(function (e) { e.classList.remove('hint'); }); G.hinted = [];
  }

  /* ---------------- ผ่านด่าน / แพ้ / หยุดเกม ---------------- */
  var cfToken = 0;
  function confetti() {
    var tk = ++cfToken, box = $('#confetti'), cols = ['#f43a57', '#ff8d1f', '#ffd420', '#41cb4c', '#2f9dff', '#a34df2', '#fff'], i;
    for (i = 0; i < (GFX.low ? 14 : 70); i++) {
      var c = el('i', 'cf');
      c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % 7];
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; c.style.animationDelay = Math.random() * 0.6 + 's';
      c.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); c.style.setProperty('--rot', (Math.random() * 1440 - 720) + 'deg');
      box.appendChild(c);
    }
    for (var b = 0; b < (GFX.low ? 0 : 4); b++) (function (b) {
      setTimeout(function () {
        if (tk !== cfToken) return;
        var x = 15 + Math.random() * 70, y = 10 + Math.random() * 35; A.sfx('blast');
        for (var k = 0; k < 16; k++) {
          var p = el('i', 'fw'), a = k / 16 * 6.283;
          p.style.left = x + '%'; p.style.top = y + '%'; p.style.background = cols[(b + k) % 6];
          p.style.setProperty('--dx', Math.cos(a) * 90 + 'px'); p.style.setProperty('--dy', Math.sin(a) * 90 + 'px');
          box.appendChild(p);
        }
      }, 250 + b * 420);
    })(b);
    setTimeout(function () { if (tk === cfToken) box.innerHTML = ''; }, 4200);
  }
  function win() {
    var g = G.game, lv = G.lv, n = G.n;
    var stars = 1 + (g.score >= lv.stars[0] ? 1 : 0) + (g.score >= lv.stars[1] ? 1 : 0);
    var rw = S.recordWin(n, stars, g.score);
    S.missionAdd('win3', 1); if (stars === 3) S.missionAdd('star3', 1);
    A.sfx('win'); confetti();
    for (var s = 1; s <= stars; s++) (function (s) { setTimeout(function () { A.sfx('star', s); }, 350 + s * 330); })(s);
    var items = Object.keys(rw.items).map(function (k) { return '<div><span>🎁 ' + ITEM[k].ic + ' ' + ITEM[k].name + '</span><span>×' + rw.items[k] + '</span></div>'; }).join('');
    var milestone = n % 10 === 0 && rw.items && Object.keys(rw.items).length ? '<div class="fun-milestone big">🎁 เปิดหีบสมบัติแล้ว!<small>โบนัสพิเศษครบ 10 ด่าน · รับได้ครั้งเดียว</small></div>' :
      n % 5 === 0 && rw.parts.some(function(p){return p.label.indexOf('ครบ 5 ด่าน') >= 0;}) ? '<div class="fun-milestone">💎 ด่านโบนัส!<small>รางวัลครบ 5 ด่าน</small></div>' : '';
    var card = openModal(((window.CFPhoto && window.CFPhoto.winHTML()) || Art.mascot()) + '<h2>ผ่านด่าน ' + n + ' แล้ว! 🎉</h2>' + milestone + '<div class="stars3">' +
      [1, 2, 3].map(function (i) { return '<span class="' + (i <= stars ? 'on' : '') + '" style="animation-delay:' + (0.3 + i * 0.33) + 's">★</span>'; }).join('') + '</div>' +
      '<div class="muted">คะแนน</div><div class="bigscore">' + fmt(g.score) + '</div>' +
      '<div class="rw">' + rw.parts.map(function (p) { return '<div><span>' + p.label + '</span><span>🪙 +' + p.amt + '</span></div>'; }).join('') + items +
      '<div class="tot"><span>รวมรางวัล</span><span>🪙 +' + rw.coins + '</span></div></div>' +
      '<div class="m-btns"><button class="btn green big" data-next>NEXT LEVEL ▶</button></div><div class="m-btns row"><button class="btn gold" data-claim>🪙 รับรางวัล +' + rw.coins + '</button><button class="btn ghost" data-map>🗺 แผนที่</button></div>', false);
    function claim() {
      var p = S.claimPending(), b = card.querySelector('[data-claim]');
      if (b) { b.disabled = true; b.textContent = '✓ รับรางวัลแล้ว'; }
      if (p) { A.sfx('coin'); coinFly(b); refreshCoins(true); }
    }
    on(card, '[data-claim]', claim);
    on(card, '[data-next]', function () { claim(); startLevel(n + 1); });
    on(card, '[data-map]', function () { claim(); quitToMap(); });
  }
  function failDialog() {
    var g = G.game, own = avail('moves5'), coins = S.get().coins, stuck = g.stuck;
    var goals = g.goals();
    var more = stuck ? '' : own > 0 ? '<button class="btn gold big" data-more>✨ ใช้เพิ่ม 5 ตา (มี ' + own + ')</button>' :
      '<button class="btn gold big" data-more ' + (coins >= S.PRICE.moves5 ? '' : 'disabled') + '>✨ เพิ่ม 5 ตา 🪙 ' + S.PRICE.moves5 + '</button>';
    var card = openModal('<div style="font-size:54px">🥺</div><h2>' + (stuck ? 'ไม่มีทางเดินแล้ว' : 'ตาเดินหมดแล้ว!') + '</h2><p>เหลืออีกนิดเดียวเอง ลองอีกครั้งนะ</p>' +
      '<div class="goal-list">' + goalChips(goals, true) + '</div><div class="m-btns">' + more +
      '<button class="btn green big" data-retry>🔄 เล่นใหม่ทันที</button><button class="btn ghost" data-map>🗺 แผนที่</button></div>' +
      (!stuck && own <= 0 ? '<p class="muted">มีเหรียญ 🪙 ' + fmt(coins) + '</p>' : ''), false);
    on(card, '[data-more]', function () {
      if (G.free.moves5 > 0) G.free.moves5--;
      else if (S.get().inv.moves5 > 0) { if (!S.useItem('moves5')) return; }
      else if (!S.spend(S.PRICE.moves5)) return;
      S.missionAdd('boost1', 1);
      g.addMoves(5); closeModal(); refreshCoins(true); hud(); boosters(); A.sfx('special'); plusGlow(); toast('✨ +5 ตาเดิน สู้ ๆ!');
      G.busy = false; scheduleHint();
    });
    on(card, '[data-retry]', function () { startLevel(G.n); });
    on(card, '[data-map]', quitToMap);
  }
  function quitToMap() { closeModal(); clearPreview(); clearTimeout(FUN.cheerTimer); if (G) clearTimeout(G.hintT); G = null; cfToken++; $('#confetti').innerHTML = ''; openMap(); }
  function toggleRow(label, key) { return '<div class="toggle"><span>' + label + '</span><button class="sw' + (S.get().settings[key] ? ' on' : '') + '" data-sw="' + key + '"></button></div>'; }
  function bindToggles(card) {
    card.querySelectorAll('[data-sw]').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.sw, v = !S.get().settings[k];
        S.setSetting(k, v); b.classList.toggle('on', v);
        if (k !== 'fast') A.set(k, v);
        A.unlock(); A.sfx('click');
      };
    });
  }
  function pauseDialog() {
    if (!G) return;
    clearHint();
    var card = openModal('<h2>⏸ หยุดเกม</h2><p class="muted">ด่าน ' + G.n + ' · ' + goalText(G.lv) + '</p><div class="list">' + toggleRow('🔊 เสียงเอฟเฟกต์', 'sfx') + toggleRow('🎵 เพลงประกอบ', 'music') + toggleRow('⚡ แอนิเมชันเร็ว', 'fast') + '</div>' +
      '<div class="m-btns"><button class="btn green big" data-res>▶ เล่นต่อ</button><button class="btn blue" data-retry>🔄 เริ่มด่านใหม่</button><button class="btn ghost" data-map>🗺 กลับแผนที่</button></div>', true, scheduleHint);
    bindToggles(card);
    on(card, '[data-res]', function () { closeModal(); scheduleHint(); });
    on(card, '[data-retry]', function () { startLevel(G.n); });
    on(card, '[data-map]', quitToMap);
  }

  /* ---------------- ร้านค้า / รางวัล / ตั้งค่า ---------------- */
  function shop() {
    var d = S.get(), deal = S.deal(), html = '<h2>🛒 ร้านตัวช่วย</h2><div class="pill" style="margin-bottom:10px"><span class="ic3 coin">🪙</span><b data-coins>' + fmt(d.coins) + '</b></div>';
    if (deal) {
      html += '<div class="item" style="background:#fff3a6"><div class="ic">🎀</div><div class="tx"><b>แพ็กราคาพิเศษวันนี้ −30%</b><span>' +
        deal.items.map(function (i) { return i.ic + ' ' + i.name; }).join(' + ') + ' <s>🪙' + deal.full + '</s></span></div>' +
        '<button class="btn gold" data-deal ' + (deal.bought || d.coins < deal.price ? 'disabled' : '') + '>' + (deal.bought ? 'ซื้อแล้ว' : '🪙 ' + deal.price) + '</button></div><div style="height:8px"></div>';
    }
    html += '<div class="list">' + S.ITEMS.map(function (it) {
      return '<div class="item"><div class="ic" style="position:relative;height:42px">' + Art.booster(S.ITEMS.indexOf(it), it.ic) + '</div><div class="tx"><b>' + it.name + '<span class="own">มี ' + d.inv[it.k] + '</span></b><span>' + themify(it.desc) + '</span></div>' +
        '<button class="btn gold" data-buy="' + it.k + '" ' + (d.coins < it.price ? 'disabled' : '') + '>🪙 ' + it.price + '</button></div>';
    }).join('') + '</div><p class="muted">ใช้เหรียญจากการเล่นเท่านั้น ไม่มีการเติมเงินจริง</p>';
    var card = openModal(html, true, function () { if (G) { boosters(); scheduleHint(); } });
    card.querySelectorAll('[data-buy]').forEach(function (b) {
      b.onclick = function () {
        A.unlock();
        if (S.buy(b.dataset.buy)) { A.sfx('coin'); toast(ITEM[b.dataset.buy].ic + ' ซื้อ ' + ITEM[b.dataset.buy].name + ' แล้ว'); shop(); refreshCoins(true); }
        else A.sfx('bad');
      };
    });
    on(card, '[data-deal]', function () { if (S.buyDeal()) { A.sfx('coin'); toast('🎀 ซื้อแพ็กพิเศษแล้ว!'); shop(); refreshCoins(true); } });
  }
  function rewards() {
    var di = S.dailyInfo(), gi = S.giftInfo(), ms = S.missions();
    var html = '<h2>🎁 รางวัล</h2><h3>📅 เข้าเล่นต่อเนื่อง 7 วัน</h3><div class="days">' + S.DAILY.map(function (amt, i) {
      var day = i + 1, got = di.can ? day < di.day : day <= di.day;
      return '<div class="day' + (got ? ' got' : di.can && day === di.day ? ' now' : '') + '">วัน ' + day + '<b>🪙' + amt + '</b>' + (day === 7 ? '🌈' : got ? '✓' : '&nbsp;') + '</div>';
    }).join('') + '</div><div class="m-btns"><button class="btn gold" data-daily ' + (di.can ? '' : 'disabled') + '>' + (di.can ? 'รับรางวัลวันที่ ' + di.day + ' 🪙 ' + S.DAILY[di.day - 1] : '✓ วันนี้รับแล้ว กลับมาใหม่พรุ่งนี้') + '</button></div>';
    var mins = Math.ceil(gi.left / 60000);
    html += '<h3>🎁 กล่องของขวัญสุ่มฟรี</h3><div class="item"><div class="ic">🎁</div><div class="tx"><b>สุ่มเหรียญหรือตัวช่วย</b><span>' + (gi.can ? 'พร้อมเปิดแล้ว!' : 'เปิดได้อีกใน ' + Math.floor(mins / 60) + ' ชม. ' + (mins % 60) + ' นาที') + '</span></div>' +
      '<button class="btn green" data-gift ' + (gi.can ? '' : 'disabled') + '>เปิด</button></div>';
    html += '<h3>📋 ภารกิจประจำวัน</h3><div class="list">' + ms.map(function (m) {
      return '<div class="item"><div class="ic">' + (m.claimed ? '✅' : '🎯') + '</div><div class="tx"><b>' + m.text + '</b><span>' + m.prog + ' / ' + m.target + '</span><div class="prog"><i style="width:' + (m.prog / m.target * 100) + '%"></i></div></div>' +
        '<button class="btn gold" data-ms="' + m.id + '" ' + (m.done && !m.claimed ? '' : 'disabled') + '>' + (m.claimed ? 'รับแล้ว' : '🪙 ' + m.reward) + '</button></div>';
    }).join('') + '</div>';
    var card = openModal(html, true, refreshHome);
    on(card, '[data-daily]', function () {
      var r = S.claimDaily(); if (!r) return;
      A.sfx('coin'); toast('🎉 รางวัลรายวัน! 🪙 +' + r.coins + (r.item ? ' และ 🌈 สายรุ้ง ×1' : ''), 2500); refreshCoins(true); rewards();
    });
    on(card, '[data-gift]', function () {
      var r = S.claimGift(); if (!r) return;
      A.sfx('coin'); toast('🎊 เปิดกล่องแล้ว! ' + (r.coins ? '🪙 +' + r.coins : r.ic + ' ' + r.name + ' ×1') + '!', 2500); refreshCoins(true); rewards();
    });
    card.querySelectorAll('[data-ms]').forEach(function (b) {
      b.onclick = function () { var a = S.claimMission(b.dataset.ms); if (a) { A.sfx('coin'); toast('📋 ภารกิจสำเร็จ 🪙 +' + a); refreshCoins(true); rewards(); } };
    });
  }
  function settings() {
    var card = openModal('<h2>⚙️ ตั้งค่า</h2><div class="list">' + toggleRow('🔊 เสียงเอฟเฟกต์', 'sfx') + toggleRow('🎵 เพลงประกอบ', 'music') + toggleRow('⚡ แอนิเมชันเร็ว', 'fast') + '</div>' +
      '<h3>🐾 ธีมเกม (ไม่กระทบด่านหรือเหรียญ)</h3><div class="seg">' + [['animals','🐰 สัตว์ 3D'], ['candy','🍬 Candy เดิม']].map(function(o){return '<button data-theme="'+o[0]+'" class="'+(Art.THEME===o[0]?'on':'')+'">'+o[1]+'</button>';}).join('')+'</div>' +
      '<p class="muted">สลับธีมได้ตลอด โดยคงความคืบหน้าและเหรียญเดิม</p>' +
      '<h3>🎨 คุณภาพกราฟิก</h3><div class="seg">' + [['auto', 'AUTO'], ['high', 'HIGH'], ['low', 'LOW']].map(function (o) { return '<button data-gfx="' + o[0] + '" class="' + (GFX.mode === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<p class="muted">AUTO = ระบบเลือกให้ · LOW = ลดเอฟเฟกต์เพื่อความลื่น' + (GFX.mode === 'auto' && GFX.autoLow ? ' (ตอนนี้ AUTO ใช้ระดับ LOW)' : '') + '</p>' +
      '<p class="muted">ความคืบหน้าบันทึกอัตโนมัติในเครื่องนี้ (Local Storage)</p><div class="m-btns"><button class="btn red" data-reset>🗑 ล้างความคืบหน้าทั้งหมด</button></div>' +
      '<p class="muted">' + (Art.THEME === 'animals' ? 'ANIMAL FRIENDS ADVENTURE ' : 'CANDY FUN ADVENTURE ') + (window.CF_VERSION || '') + '<br>กราฟิกและเสียงสร้างขึ้นเองทั้งหมด</p>', true, refreshHome);
    bindToggles(card);
    card.querySelectorAll('[data-theme]').forEach(function(b){ b.onclick=function(){var next=b.dataset.theme;if(next===Art.THEME)return;try{localStorage.setItem('cfa_theme_v1',next);}catch(e){}location.reload();};});
    card.querySelectorAll('[data-gfx]').forEach(function (b) { b.onclick = function () { A.unlock(); A.sfx('click'); setGfx(b.dataset.gfx); card.querySelectorAll('[data-gfx]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    var armed = false;
    on(card, '[data-reset]', function (e, b) {
      if (!armed) { armed = true; b.textContent = '⚠️ แตะอีกครั้งเพื่อยืนยันการล้างข้อมูล'; return; }
      S.reset(); closeModal(); refreshCoins(); refreshHome(); toast('ล้างความคืบหน้าแล้ว');
    });
  }

  /* ---------------- เริ่มระบบ ---------------- */
  function init() {
    document.title = Art.THEME === 'animals' ? 'ANIMAL FRIENDS ADVENTURE' : 'CANDY FUN ADVENTURE';
    document.body.insertAdjacentHTML('afterbegin', Art.defs());
    board = $('#board'); lCells = $('#l-cells'); lJel = $('#l-jel'); lTiles = $('#l-tiles'); lFx = $('#l-fx');
    var d = S.init();
    A.set('sfx', d.settings.sfx); A.set('music', d.settings.music);
    $('#town').innerHTML = townSVG();
    function tap(sel, fn) { $(sel).onclick = function () { A.unlock(); A.sfx('click'); fn(); }; }
    tap('#btn-play', openMap); tap('#btn-shop', shop); tap('#btn-rewards', rewards); tap('#btn-settings', settings);
    tap('#map-back', function () { show('home'); }); tap('#map-shop', shop);
    tap('#g-pause', pauseDialog); tap('#g-guide', boosterGuide); tap('#fun-open', rewards);
    tap('#g-skip', function () { if (G && G.busy) { G.skip = true; board.classList.add('noanim'); } });
    tap('#target-cancel', cancelTarget);
    tap('#target-dir', function () { G.dir = G.dir === 'h' ? 'v' : 'h'; $('#target-dir').textContent = G.dir === 'h' ? '↔ แนวนอน' : '↕ แนวตั้ง'; clearPreview(); });
    $('#modal').addEventListener('pointerdown', function (e) { if (e.target === this && this._close) this._close(); });
    bindBoard();
    var rt = null;
    function relayout() {
      clearTimeout(rt);
      rt = setTimeout(function () { if (!G || screenName !== 'game') return; if (G.busy) G.needLayout = true; else { clearHint(); setSel(null); layout(); scheduleHint(); } }, 150);
    }
    window.addEventListener('resize', relayout); window.addEventListener('orientationchange', relayout);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkVersion(); });
    window.addEventListener('online', function () { checkVersion(true); }); window.addEventListener('focus', checkVersion); window.addEventListener('pageshow', checkVersion);
    setInterval(checkVersion, 5 * 60 * 1000);
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    if (root0.matchMedia && root0.matchMedia('(prefers-reduced-motion: reduce)').matches) GFX.autoLow = true;
    if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2)) GFX.autoLow = true;
    applyGfx(); fpsLoop();
    window.CFGame = { state: function () { return G; }, start: startLevel, save: S, levels: L, gfx: GFX, setGfx: setGfx, modal: openModal, close: closeModal, toast: toast };
    /* FAST START: แสดงเกมทันทีด้วย SVG fallback; ไม่รอรูป 3D หรือ time-out 6 วินาที */
    var boot = $('#boot'); if (boot) boot.remove();
    $('#app').hidden = false; show('home');
    window.CF_PERF_READY = performance.now() - (window.CF_PERF_START || 0);
    /* โหลดสไปรต์ 3D แบบไม่ขวางหน้า HOME; เมื่อสำเร็จ re-render เฉพาะภาพ
     * ห้ามกระทบ Game Engine หรือ Save; หากกำลังเล่นอยู่ อย่ารีเซ็ตสถานะเกม */
    setTimeout(function () {
      Art.load(function (ok) {
        if (!ok || !G || screenName !== 'game') return;
        if (G.busy) { G.needLayout = true; return; }
        clearHint(); setSel(null); layout(); hud(); boosters(); scheduleHint();
      });
    }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
