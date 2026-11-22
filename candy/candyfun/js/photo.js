/* CANDY FUN ADVENTURE — photo.js : รูปผู้เล่น (อัปโหลด / ครอป / เปลี่ยน / ลบ)
 * เก็บภาพใน IndexedDB ของเครื่องนี้เท่านั้น — ไม่ใช้ Local Storage ไม่ส่งออกนอกเครื่อง ไม่แตะเซฟเกม cfa_save_v1
 * หมายเหตุ: เกมยังไม่มีระบบ AI แปลงรูปเป็น 3D — ให้อัปโหลดรูปถ่าย หรือภาพตัวละคร 3D ที่เตรียมไว้แล้ว
 * เมื่อมีระบบสมาชิก: เรียก CFPhoto.setUser(USER_ID) เพื่อแยกรูปตามผู้เล่น (ค่าเริ่มต้น 'local')
 */
(function (root) {
  'use strict';
  var DB = 'cfa_photo_v1', STORE = 'photos', MAX = 10 * 1024 * 1024, TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  var VW = 270, VH = 360, uid = 'local', urls = { sq: null, pt: null }, saved = true;
  /* ตัวการ์ตูนประจำเกม (ออกแบบและเรนเดอร์ 3D เอง) ใช้เมื่อผู้เล่นยังไม่ได้อัปโหลดรูป */
  var CH = 'assets/candy3d/character/', DEF = { sq: CH + 'profile-256.webp', pt: CH + 'game-600.webp', win: CH + 'win-600.webp' }, defOk = false;
  function cur(k) { return urls[k] || (defOk ? DEF[k] : null); }
  function $(s) { return document.querySelector(s); }
  function ui() { return root.CFGame || {}; }
  function say(m, ms) { if (ui().toast) ui().toast(m, ms || 2600); }

  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var rq;
      try { rq = root.indexedDB.open(DB, 1); } catch (e) { return rej(e); }
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
      rq.onerror = function () { rej(rq.error); };
      rq.onsuccess = function () {
        var db = rq.result, out, t;
        try { t = db.transaction(STORE, mode); out = fn(t.objectStore(STORE)); } catch (e) { db.close(); return rej(e); }
        t.oncomplete = function () { db.close(); res(out && out.result); };
        t.onerror = t.onabort = function () { db.close(); rej(t.error); };
      };
    });
  }
  function setUrls(rec) {
    ['sq', 'pt'].forEach(function (k) {
      if (urls[k]) URL.revokeObjectURL(urls[k]);
      urls[k] = rec && rec[k] ? URL.createObjectURL(new Blob([rec[k].buf], { type: rec[k].type })) : null;
    });
  }

  /* ---------- แสดงผล ---------- */
  function refresh() {
    var av = $('#pf-avatar'), hm = $('#pf-home'), sd = $('#pf-side');
    var sq = cur('sq'), pt = cur('pt'), cut = !urls.pt;
    if (av) av.innerHTML = urls.sq ? '<img alt="รูปผู้เล่น" src="' + urls.sq + '">' : sq ? '<img alt="ตัวละคร" src="' + sq + '"><i class="pf-cam">📷</i>' : '<span>📷</span><em>เพิ่มรูป</em>';
    if (av) { av.classList.toggle('has', !!urls.sq); av.classList.toggle('def', !urls.sq && !!sq); }
    if (hm) { hm.hidden = !pt; hm.classList.toggle('cut', cut); if (pt) hm.querySelector('img').src = pt; }
    if (sd) { sd.classList.toggle('on', !!pt); sd.classList.toggle('cut', cut); if (pt) sd.querySelector('img').src = pt; }
    decorate();
  }
  /* ตัวละครในหน้า GAME: อยู่ในแถบข้อความเหนือกระดาน จึงไม่บังช่องจับคู่และปุ่มตัวช่วย */
  function decorate() {
    var tip = $('#tip'); if (!tip) return;
    var old = tip.querySelector('.g-char'); if (old) old.remove();
    var sq = cur('sq');
    tip.classList.toggle('has-char', !!sq);
    if (sq) tip.insertAdjacentHTML('afterbegin', '<span class="g-char pf-ring"><img alt="" src="' + sq + '"></span>');
  }
  function winHTML() {
    var src = urls.pt || (defOk ? DEF.win : null);
    return src ? '<div class="pf-win' + (urls.pt ? '' : ' cut') + '"><i class="pf-rays"></i><span class="pf-card' + (urls.pt ? '' : ' cut') + '"><img alt="" src="' + src + '"></span><b>🎉</b><b>⭐</b><b>🍭</b></div>' : '';
  }

  /* ---------- โปรไฟล์ ---------- */
  function profile() {
    var g = ui(); if (!g.modal) return;
    var S = root.CFSave, d = S.get(), stars = S.totalStars();
    var card = g.modal('<h2>👤 โปรไฟล์ผู้เล่น</h2>' +
      '<div class="pf-big pf-ring">' + (cur('sq') ? '<img alt="รูปผู้เล่น" src="' + cur('sq') + '">' : '<span>📷</span>') + '</div>' +
      (urls.sq ? '' : defOk ? '<p class="muted">ตอนนี้ใช้ตัวการ์ตูนประจำเกม — อัปโหลดรูปของคุณมาแทนได้</p>' : '') +
      '<p><b>ด่าน ' + d.unlocked + '</b> · ⭐ ' + stars + ' · 🪙 ' + Number(d.coins).toLocaleString('en-US') + '</p>' +
      (saved ? '' : '<p style="color:#d11a1a">⚠️ รูปนี้ยังบันทึกลงเครื่องไม่สำเร็จ (จะหายเมื่อปิดเกม)</p>') +
      '<div class="m-btns"><button class="btn green big" data-up>📷 ' + (urls.sq ? 'เปลี่ยนรูป' : 'อัปโหลดรูปผู้เล่น') + '</button>' +
      (urls.sq ? '<button class="btn red" data-del>🗑 ลบรูป</button>' : '') + '</div>' +
      '<p class="muted">JPG / PNG / WEBP ไม่เกิน 10 MB · รูปเก็บในเครื่องนี้เท่านั้น ผู้เล่นคนอื่นมองไม่เห็น<br>ถ้ามีภาพตัวละคร 3D ที่เตรียมไว้ อัปโหลดภาพนั้นได้เลย (เกมยังไม่มีระบบ AI แปลงรูปอัตโนมัติ)</p>', true);
    card.querySelector('[data-up]').onclick = pick;
    var del = card.querySelector('[data-del]'), armed = false;
    if (del) del.onclick = function () {
      if (!armed) { armed = true; del.textContent = '⚠️ แตะอีกครั้งเพื่อยืนยันการลบรูป'; return; }
      idb('readwrite', function (s) { return s.delete(uid); }).catch(function () { /* ไม่มีที่เก็บ = ไม่มีอะไรต้องลบ */ }).then(function () {
        setUrls(null); saved = true; refresh(); g.close(); say('ลบรูปผู้เล่นแล้ว');
      });
    };
  }
  function pick() { var f = $('#pf-file'); f.value = ''; f.click(); }
  function onFile(f) {
    if (!f) return;
    if (TYPES.indexOf(f.type) < 0) return say('⚠️ รองรับเฉพาะไฟล์ JPG / PNG / WEBP');
    if (f.size > MAX) return say('⚠️ ไฟล์ใหญ่เกิน 10 MB (' + (f.size / 1048576).toFixed(1) + ' MB)');
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () { if (img.naturalWidth < 64 || img.naturalHeight < 64) { URL.revokeObjectURL(url); return say('⚠️ รูปเล็กเกินไป'); } cropper(img, url); };
    img.onerror = function () { URL.revokeObjectURL(url); say('⚠️ เปิดไฟล์รูปนี้ไม่ได้'); };
    img.src = url;
  }

  /* ---------- Preview / Crop ---------- */
  function cropper(img, url) {
    var g = ui(), W = img.naturalWidth, H = img.naturalHeight, min = Math.max(VW / W, VH / H), st = { z: 1, x: 0, y: 0 };
    var card = g.modal('<h2>✂️ จัดตำแหน่งรูป</h2><p class="muted">ลากเพื่อเลื่อน · ใช้แถบเพื่อซูม · ส่วนในเส้นประคือรูปโปรไฟล์</p>' +
      '<div class="pf-crop" style="width:' + VW + 'px;height:' + VH + 'px"><i class="pf-guide"></i></div>' +
      '<input class="pf-zoom" type="range" min="1" max="4" step="0.01" value="1" aria-label="ซูม">' +
      '<div class="m-btns"><button class="btn green big" data-ok>✓ ใช้รูปนี้</button></div><div class="m-btns row"><button class="btn blue" data-other>เลือกรูปอื่น</button><button class="btn ghost" data-no>ยกเลิก</button></div>', false);
    var box = card.querySelector('.pf-crop'), zoom = card.querySelector('.pf-zoom'), drag = null;
    img.className = 'pf-img'; img.draggable = false; box.insertBefore(img, box.firstChild);
    function place() {
      var s = min * st.z;
      st.x = Math.min(0, Math.max(VW - W * s, st.x)); st.y = Math.min(0, Math.max(VH - H * s, st.y));
      img.style.width = W * s + 'px'; img.style.height = H * s + 'px'; img.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px)';
    }
    st.x = (VW - W * min) / 2; st.y = Math.min(0, (VH - H * min) * 0.25); place();
    zoom.oninput = function () {
      var s0 = min * st.z, cx = (VW / 2 - st.x) / s0, cy = (VH / 2 - st.y) / s0;
      st.z = +zoom.value; var s1 = min * st.z; st.x = VW / 2 - cx * s1; st.y = VH / 2 - cy * s1; place();
    };
    box.addEventListener('pointerdown', function (e) { drag = { x: e.clientX - st.x, y: e.clientY - st.y }; try { box.setPointerCapture(e.pointerId); } catch (er) { /* ไม่จำเป็น */ } e.preventDefault(); });
    box.addEventListener('pointermove', function (e) { if (!drag) return; st.x = e.clientX - drag.x; st.y = e.clientY - drag.y; place(); });
    box.addEventListener('pointerup', function () { drag = null; }); box.addEventListener('pointercancel', function () { drag = null; });
    function done() { URL.revokeObjectURL(url); }
    card.querySelector('[data-no]').onclick = function () { done(); g.close(); if (urls.sq) profile(); };
    card.querySelector('[data-other]').onclick = function () { done(); g.close(); pick(); };
    card.querySelector('[data-ok]').onclick = function () {
      var b = card.querySelector('[data-ok]'); b.disabled = true; b.textContent = 'กำลังบันทึก…';
      var s = min * st.z, sx = -st.x / s, sy = -st.y / s;
      Promise.all([render(img, sx, sy, VW / s, VH / s, 720, 960), render(img, sx, sy, VW / s, VW / s, 512, 512)]).then(function (r) {
        var rec = { v: 1, pt: r[0], sq: r[1], updated: Date.now() };
        return idb('readwrite', function (o) { return o.put(rec, uid); }).then(function () { saved = true; }, function () { saved = false; }).then(function () { return rec; });
      }).then(function (rec) {
        done(); setUrls(rec); refresh(); g.close(); profile();
        say(saved ? '✓ บันทึกรูปผู้เล่นแล้ว' : '⚠️ ใช้รูปได้ชั่วคราว แต่บันทึกลงเครื่องไม่สำเร็จ', 3000);
      }).catch(function () { b.disabled = false; b.textContent = '✓ ใช้รูปนี้'; say('⚠️ ประมวลผลรูปไม่สำเร็จ ลองรูปอื่น'); });
    };
  }
  function render(img, sx, sy, sw, sh, w, h) {
    return new Promise(function (res, rej) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      c.toBlob(function (bl) {
        if (!bl) return rej(new Error('encode'));
        new Response(bl).arrayBuffer().then(function (buf) { res({ buf: buf, type: bl.type }); }, rej);
      }, 'image/webp', 0.9);
    });
  }

  function load() {
    return idb('readonly', function (s) { return s.get(uid); }).then(function (rec) { setUrls(rec && rec.sq ? rec : null); }, function () { setUrls(null); }).then(refresh);
  }
  function init() {
    var top = $('.home-top'), home = $('#scr-home');
    if (!top || $('#pf-avatar')) return;
    var av = document.createElement('button'); av.id = 'pf-avatar'; av.className = 'pf-av pf-ring'; av.setAttribute('aria-label', 'รูปผู้เล่น');
    top.insertBefore(av, top.children[1] || null);
    av.onclick = profile;
    home.insertAdjacentHTML('beforeend', '<button id="pf-home" class="pf-card" hidden aria-label="โปรไฟล์ผู้เล่น"><img alt=""></button>');
    $('#pf-home').onclick = profile;
    document.body.insertAdjacentHTML('beforeend', '<div id="pf-side" class="pf-card" aria-hidden="true"><img alt=""></div><input id="pf-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>');
    $('#pf-file').addEventListener('change', function () { onFile(this.files && this.files[0]); });
    refresh(); load();
    var n = 0, bad = false;
    ['sq', 'pt', 'win'].forEach(function (k) {
      var im = new Image();
      im.onload = function () { if (!bad && ++n === 3) { defOk = true; refresh(); } };
      im.onerror = function () { bad = true; };
      im.src = DEF[k];
    });
  }
  root.CFPhoto = { init: init, decorate: decorate, winHTML: winHTML, profile: profile, setUser: function (id) { uid = String(id || 'local'); return load(); }, has: function () { return !!urls.sq; }, urls: urls };
  init();
})(window);
