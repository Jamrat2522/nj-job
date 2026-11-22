/* CANDY FUN ADVENTURE — art.js : กราฟิก SVG วาดเองทั้งหมด (ไม่ใช้ทรัพย์สินของเกมอื่น) */
(function (root) {
  'use strict';
  var COL = [
    ['#ffb3bd', '#f43a57', '#a50e2e'], ['#ffd79a', '#ff8d1f', '#b55200'], ['#fff7a6', '#ffd420', '#b58300'],
    ['#c4f7a8', '#41cb4c', '#15792a'], ['#b5e6ff', '#2f9dff', '#0e4eae'], ['#e9c6ff', '#a34df2', '#5a1a9a']
  ];
  /* ธีมใหม่เปลี่ยนเฉพาะภาพ; color index, item IDs, ด่าน และเซฟเดิมไม่เปลี่ยน */
  var THEME = 'animals';
  try { THEME = root.localStorage.getItem('cfa_theme_v1') === 'candy' ? 'candy' : 'animals'; } catch(e) {}
  var ANIMAL_EMOJI=['🦊','🐴','🐰','🐸','🦖','🐼'];
  var NAMES = THEME === 'animals' ? ['จิ้งจอก','ม้า','กระต่าย','กบ','ไดโนเสาร์','แพนด้า'] : ['สตรอว์เบอร์รีฮาร์ต', 'ส้มฝาน', 'ดาวเลมอน', 'เยลลี่แอปเปิล', 'อัญมณีบลูเบอร์รี', 'กัมดรอปองุ่น'];

  function star(cx, cy, ro, ri) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro;
      p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }
  var FACE = '<g id="cf-face"><circle cx="40" cy="52" r="4.6" fill="#3b1d3f"/><circle cx="60" cy="52" r="4.6" fill="#3b1d3f"/>' +
    '<circle cx="41.5" cy="50.4" r="1.6" fill="#fff"/><circle cx="61.5" cy="50.4" r="1.6" fill="#fff"/>' +
    '<path d="M43 62q7 7 14 0" fill="none" stroke="#3b1d3f" stroke-width="3" stroke-linecap="round"/></g>';

  function body(i) {
    var f = 'fill="url(#cf-g' + i + ')" stroke="' + COL[i][2] + '" stroke-width="4" stroke-linejoin="round"';
    switch (i) {
      case 0: return '<path ' + f + ' d="M50 88C20 64 8 46 8 31C8 17 19 9 31 9C40 9 47 14 50 21C53 14 60 9 69 9C81 9 92 17 92 31C92 46 80 64 50 88Z"/><ellipse cx="29" cy="27" rx="11" ry="7" fill="#fff" opacity=".55" transform="rotate(-30 29 27)"/>';
      case 1: return '<circle ' + f + ' cx="50" cy="50" r="41"/><circle cx="50" cy="50" r="31" fill="#ffe2b0" opacity=".55"/>' +
        '<g stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"><path d="M50 21v58M25 35.5l50 29M25 64.5l50-29"/></g><ellipse cx="33" cy="27" rx="10" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 33 27)"/>';
      case 2: return '<polygon ' + f + ' stroke-width="7" points="' + star(50, 53, 44, 23) + '"/><ellipse cx="41" cy="33" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-25 41 33)"/>';
      case 3: return '<rect ' + f + ' x="11" y="11" width="78" height="78" rx="24"/><rect x="20" y="18" width="44" height="13" rx="6.5" fill="#fff" opacity=".5"/>';
      case 4: return '<polygon ' + f + ' points="50,7 88,28 88,72 50,93 12,72 12,28"/><polygon points="50,19 76,34 50,48 24,34" fill="#fff" opacity=".45"/>';
      default: return '<path ' + f + ' d="M50 7C66 29 87 46 87 63A37 37 0 0 1 13 63C13 46 34 29 50 7Z"/><ellipse cx="38" cy="45" rx="7" ry="12" fill="#fff" opacity=".5" transform="rotate(22 38 45)"/>';
    }
  }
  function box(id, a, b, rib, extra) {
    return '<symbol id="' + id + '" viewBox="0 0 100 100"><rect x="12" y="36" width="76" height="54" rx="9" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
      '<rect x="43" y="36" width="14" height="54" fill="' + rib + '"/><rect x="7" y="22" width="86" height="21" rx="7" fill="' + a + '" stroke="' + b + '" stroke-width="4"/>' +
      '<rect x="43" y="22" width="14" height="21" fill="' + rib + '"/><ellipse cx="38" cy="17" rx="13" ry="8" fill="' + rib + '" stroke="' + b + '" stroke-width="3"/>' +
      '<ellipse cx="62" cy="17" rx="13" ry="8" fill="' + rib + '" stroke="' + b + '" stroke-width="3"/><circle cx="50" cy="19" r="6" fill="' + rib + '" stroke="' + b + '" stroke-width="3"/>' + (extra || '') + '</symbol>';
  }

  function defs() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';
    for (var i = 0; i < 6; i++) {
      s += '<radialGradient id="cf-g' + i + '" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="' + COL[i][0] + '"/><stop offset=".55" stop-color="' + COL[i][1] + '"/><stop offset="1" stop-color="' + COL[i][2] + '"/></radialGradient>';
    }
    s += FACE;
    for (i = 0; i < 6; i++) s += '<symbol id="cf-c' + i + '" viewBox="0 0 100 100">' + body(i) + '<use href="#cf-face"/></symbol><symbol id="cf-b' + i + '" viewBox="0 0 100 100">' + body(i) + '</symbol>';
    s += '<symbol id="cf-sp-h" viewBox="0 0 100 100"><rect x="15" y="39" width="70" height="22" rx="11" fill="#fff" opacity=".92"/><path d="M3 50l15-13v26zM97 50l-15-13v26z" fill="#fff" stroke="#ff4fa0" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 50h40" stroke="#ff4fa0" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/></symbol>';
    s += '<symbol id="cf-sp-v" viewBox="0 0 100 100"><use href="#cf-sp-h" transform="rotate(90 50 50)"/></symbol>';
    s += '<symbol id="cf-sp-bomb" viewBox="0 0 100 100"><circle cx="50" cy="52" r="26" fill="#2b1838" opacity=".88" stroke="#fff" stroke-width="5"/><path d="M50 26q4-14 16-12" fill="none" stroke="#ffe27a" stroke-width="5" stroke-linecap="round"/><polygon points="' + star(69, 12, 9, 4) + '" fill="#ffd420" stroke="#ff7a00" stroke-width="1.5"/><ellipse cx="41" cy="43" rx="7" ry="4.5" fill="#fff" opacity=".6" transform="rotate(-30 41 43)"/></symbol>';
    var arcs = '', cs = ['#f43a57', '#ff8d1f', '#ffd420', '#41cb4c', '#2f9dff', '#a34df2'];
    for (i = 0; i < 6; i++) {
      var a0 = i * Math.PI / 3, a1 = (i + 1) * Math.PI / 3;
      arcs += '<path d="M50 50L' + (50 + 42 * Math.cos(a0)).toFixed(1) + ' ' + (50 + 42 * Math.sin(a0)).toFixed(1) + 'A42 42 0 0 1 ' + (50 + 42 * Math.cos(a1)).toFixed(1) + ' ' + (50 + 42 * Math.sin(a1)).toFixed(1) + 'Z" fill="' + cs[i] + '"/>';
    }
    s += '<symbol id="cf-rainbow" viewBox="0 0 100 100">' + arcs + '<circle cx="50" cy="50" r="42" fill="none" stroke="#fff" stroke-width="5"/><circle cx="50" cy="50" r="19" fill="#fff"/><polygon points="' + star(50, 51, 15, 7) + '" fill="#ff4fa0"/></symbol>';
    s += box('cf-box1', '#ff8fc0', '#c2307a', '#ffe066');
    s += box('cf-box2', '#6fc3ff', '#1c5fb5', '#ffe066', '<rect x="12" y="57" width="76" height="12" fill="#ffe066"/>');
    s += box('cf-box3', '#b9c2d6', '#4a5470', '#7d879f', '<rect x="12" y="57" width="76" height="12" fill="#7d879f"/><g fill="#4a5470"><circle cx="22" cy="46" r="3.5"/><circle cx="78" cy="46" r="3.5"/><circle cx="22" cy="80" r="3.5"/><circle cx="78" cy="80" r="3.5"/></g><rect x="40" y="52" width="20" height="22" rx="5" fill="#ffd420" stroke="#8a6200" stroke-width="3"/>');
    return s + '</defs></svg>';
  }

  function svg(inner) { return '<svg viewBox="0 0 100 100">' + inner + '</svg>'; }

  /* ---------- Premium 3D sprites (เรนเดอร์จากโมเดล 3D จริง) + fallback เป็น SVG เดิมถ้าโหลดภาพไม่ได้ ---------- */
  var SPR = { ok: false, size: 0, base: 'assets/candy3d/' };
  function pickSize() {
    var dpr = Math.min(3, root.devicePixelRatio || 1), css = Math.min(78, Math.min(root.innerWidth || 400, 560) / 8);
    var px = css * dpr;
    return px <= 100 ? 96 : px <= 170 ? 160 : 256;
  }
  function load(cb) {
    var done = false, n = 0, size = pickSize(), q = root.CF_VERSION ? '?v=' + encodeURIComponent(root.CF_VERSION) : '';
    var files = { t: (THEME === 'animals' ? 'assets/animal3d/tiles/' : 'assets/candy3d/tiles/') + 'tiles-' + size + '.webp', sp: 'assets/candy3d/special/special-' + size + '.webp', b: 'assets/candy3d/boosters/boosters-160.webp' }, urls = {};
    function fin(ok) {
      if (done) return;
      if (!ok) { done = true; return cb(false); }
      if (++n < 3) return;
      done = true; SPR.ok = true; SPR.size = size;
      var st = document.documentElement.style;
      for (var k in urls) st.setProperty('--at-' + k, 'url("' + urls[k] + '")');
      document.documentElement.classList.add('spr-ok');
      cb(true);
    }
    for (var k in files) (function (k) {
      var im = new Image();
      try { urls[k] = new URL(files[k] + q, document.baseURI || location.href).href; } catch (e) { urls[k] = files[k] + q; }
      im.onload = function () { fin(im.naturalWidth > 0); }; im.onerror = function () { fin(false); };
      im.src = urls[k];
    })(k);
    setTimeout(function () { fin(false); }, 6000);
  }
  function sp(set, i, cls) { return '<i class="spr s-' + set + (cls ? ' ' + cls : '') + '" style="background-position:' + (i * 20) + '% 0"></i>'; }
  function inner(x) {
    if (!SPR.ok) {
      if (THEME === 'animals' && x.t === 'c' && !x.sp && x.color >= 0) return '<span class="animal-fallback">' + ANIMAL_EMOJI[x.color] + '</span>';
      if (x.t === 'box') return svg('<use href="#cf-box' + Math.max(1, Math.min(3, x.hp)) + '"/>');
      if (x.sp === 'animal-orb' && THEME === 'animals') return '<span class="animal-orb-tile"><span class="animal-fallback">' + ANIMAL_EMOJI[x.color] + '</span><i class="orb-aura"></i></span>';
      if (x.sp === 'rainbow' || x.color < 0) return svg('<use href="#cf-rainbow"/>');
      if (x.sp) return svg('<use href="#cf-b' + x.color + '"/><use href="#cf-sp-' + x.sp + '"/>');
      return svg('<use href="#cf-c' + x.color + '"/>');
    }
    if (x.t === 'box') return sp('sp', 2 + Math.max(1, Math.min(3, x.hp)));
    if (x.sp === 'animal-orb' && THEME === 'animals') return '<span class="animal-orb-tile">' + sp('t', x.color) + '<i class="orb-aura"></i></span>';
    if (x.sp === 'rainbow' || x.color < 0) return sp('sp', 0);
    if (x.sp === 'bomb') return sp('t', x.color) + sp('sp', 1, 'ov bm');
    if (x.sp) return sp('t', x.color) + sp('sp', 2, 'ov rk' + (x.sp === 'v' ? ' rot' : ''));
    return sp('t', x.color);
  }
  function tile(x) { return '<span class="tin">' + inner(x) + '</span>'; }
  function sig(x) { return x.t === 'box' ? 'box' + x.hp : x.color + ':' + (x.sp || ''); }
  function icon(kind, color) {
    if (kind === 'color') return SPR.ok ? '<span class="gi">' + sp('t', color) + '</span>' : (THEME === 'animals' ? '<span class="animal-goal">' + ANIMAL_EMOJI[color] + '</span>' : svg('<use href="#cf-c' + color + '"/>'));
    if (kind === 'box') return SPR.ok ? '<span class="gi">' + sp('sp', 3) + '</span>' : svg('<use href="#cf-box1"/>');
    if (kind === 'jelly') return '<span class="ico-jelly"></span>';
    return '<span class="ico-emoji ic3 star">⭐</span>';
  }
  function booster(i, emoji) { return SPR.ok ? '<i class="spr s-b bic" style="background-position:' + (i * 20) + '% 0"></i>' : emoji; }
  /* มาสคอต "น้องคัพเค้ก" */
  function mascot() {
    return '<svg viewBox="0 0 200 200" class="mascot"><g class="m-arm"><path d="M52 118q-26-18-30-44" stroke="#ffb07a" stroke-width="13" stroke-linecap="round" fill="none"/>' +
      '<path d="M148 118q26-18 30-44" stroke="#ffb07a" stroke-width="13" stroke-linecap="round" fill="none"/></g>' +
      '<path d="M50 112h100l-13 66a8 8 0 0 1-8 6H71a8 8 0 0 1-8-6z" fill="#ffb07a" stroke="#b05a2a" stroke-width="5" stroke-linejoin="round"/>' +
      '<g stroke="#b05a2a" stroke-width="4" opacity=".45"><path d="M76 116l6 64M100 116v66M124 116l-6 64"/></g>' +
      '<path d="M38 112c-10-22 6-40 24-40c2-22 22-34 40-30c20-8 44 8 42 30c18 2 30 20 20 40z" fill="#ff8fc0" stroke="#c2307a" stroke-width="5" stroke-linejoin="round"/>' +
      '<ellipse cx="74" cy="66" rx="14" ry="7" fill="#fff" opacity=".55" transform="rotate(-25 74 66)"/><circle cx="104" cy="34" r="12" fill="#f43a57" stroke="#a50e2e" stroke-width="4"/>' +
      '<circle cx="82" cy="92" r="6.5" fill="#3b1d3f"/><circle cx="120" cy="92" r="6.5" fill="#3b1d3f"/><circle cx="84" cy="90" r="2.2" fill="#fff"/><circle cx="122" cy="90" r="2.2" fill="#fff"/>' +
      '<path d="M90 100q11 12 22 0" fill="#fff" stroke="#3b1d3f" stroke-width="4" stroke-linejoin="round"/><circle cx="68" cy="100" r="6" fill="#ff5f9e" opacity=".5"/><circle cx="134" cy="100" r="6" fill="#ff5f9e" opacity=".5"/></svg>';
  }
  root.CFArt = { defs: defs, tile: tile, sig: sig, icon: icon, mascot: mascot, COL: COL, NAMES: NAMES, THEME: THEME, load: load, booster: booster, SPR: SPR };
})(window);
