  /* ================= TOAST ================= */
  function toast(msg, type) {
    var wrap = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'success');
    el.innerHTML = '<span>' + (type === 'error' ? icon('ban') : type === 'info' ? icon('info') : icon('check')) + '</span><div>' + esc(msg) + '</div>';
    wrap.appendChild(el);
    setTimeout(function () { el.classList.add('show'); }, 10);
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 3200);
  }

  /* ---------- Toast ที่ปิดเองได้ (ใช้กับปุ่มดาวน์โหลดไฟล์แนบ) ----------
     แยกจาก toast() เดิมโดยสิ้นเชิง — toast() ของหน้าอื่นไม่เปลี่ยนพฤติกรรมแม้แต่จุดเดียว
     ต่างกันตรง: มีหัวข้อ + บรรทัดรอง · มีปุ่ม × ปิดเอง · อยู่นาน 5 วินาที
     ปิดแล้วปิดเฉพาะ Toast ใบนั้น ไม่แตะ Modal หรือหน้าเบื้องหลัง */
  function toastDismiss(title, sub, type) {
    var wrap = document.getElementById('toasts');
    if (!wrap) return null;
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'success') + ' toast-dis';
    el.innerHTML =
      '<span>' + (type === 'error' ? icon('ban') : type === 'info' ? icon('info') : icon('check')) + '</span>' +
      '<div class="toast-txt"><b>' + esc(title) + '</b>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>' +
      '<button type="button" class="toast-x" aria-label="ปิด">' + icon('x') + '</button>';
    wrap.appendChild(el);
    setTimeout(function () { el.classList.add('show'); }, 10);
    var gone = false;
    function bye() {
      if (gone) return; gone = true;
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }
    el.querySelector('.toast-x').onclick = bye;   // ปิดเฉพาะ Toast ใบนี้
    setTimeout(bye, 5000);                        // หายเองใน 5 วินาที (กด × ก่อนได้)
    return el;
  }

  /* ================= PREVIEW ไฟล์แนบ =================
     เปิดทับอยู่ในหน้าเดิม ไม่เปิดแท็บใหม่ ไม่ reload
     ใช้ container ของตัวเอง (#file-preview-root) แยกจาก #modal-root
     Timeline Modal ที่อยู่ข้างหลังจึงยังเปิดค้างอยู่ตำแหน่งเดิม ปิด Preview แล้วกลับมาเห็นทันที */
  function fpExt(name, url) {
    var s2 = String(name || '') || String(url || '');
    s2 = s2.split('?')[0].split('#')[0];
    var m = /\.([a-z0-9]+)$/i.exec(s2);
    return m ? m[1].toLowerCase() : '';
  }

  function filePreviewClose() {
    var r = document.getElementById('file-preview-root');
    if (r) r.remove();
    document.removeEventListener('keydown', fpKey);
  }

  function fpKey(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); filePreviewClose(); } }

  function filePreviewOpen(url, name) {
    filePreviewClose();
    var ext = fpExt(name, url);
    var isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].indexOf(ext) >= 0;
    var isPdf = ext === 'pdf';
    var inner = isImg
      ? '<img class="fp-img" src="' + esc(url) + '" alt="' + esc(name || '') + '">'
      : isPdf
        ? '<iframe class="fp-frame" src="' + esc(url) + '" title="' + esc(name || '') + '"></iframe>'
        : '<div class="fp-none">' + icon('fileText') +
          '<p>ไม่รองรับการดูตัวอย่างไฟล์นี้ กรุณาดาวน์โหลดไฟล์</p></div>';

    var root = document.createElement('div');
    root.id = 'file-preview-root';
    root.innerHTML =
      '<div class="fp-overlay" id="fp-overlay">' +
      '<div class="fp-box" role="dialog" aria-modal="true">' +
      '<div class="fp-head"><h3>' + esc(name || 'ไฟล์แนบ') + '</h3>' +
      '<button type="button" class="btn-icon" id="fp-x" aria-label="ปิด">' + icon('x') + '</button></div>' +
      '<div class="fp-body">' + inner + '</div>' +
      '<div class="fp-foot"><button type="button" class="btn btn-ghost" id="fp-close">ปิด</button></div>' +
      '</div></div>';
    document.body.appendChild(root);
    document.getElementById('fp-x').onclick = filePreviewClose;
    document.getElementById('fp-close').onclick = filePreviewClose;
    document.getElementById('fp-overlay').addEventListener('mousedown', function (ev) {
      if (ev.target === this) filePreviewClose();
    });
    document.addEventListener('keydown', fpKey);
  }

  /* ---------- ดาวน์โหลดไฟล์แนบ ----------
     ดึงไฟล์เป็น Blob แล้วสั่งบันทึก จึงไม่เปิดแท็บใหม่และไม่ reload
     สำเร็จ = Toast "เริ่มดาวน์โหลดแล้ว" · ล้มเหลว = Toast ผิดพลาด (ไม่แสดงว่าสำเร็จ)
     ไม่แตะ Storage / URL / ชื่อไฟล์ / Path เดิม */
  function fileDownload(url, name) {
    if (!url) { toastDismiss('ดาวน์โหลดไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง', 'error'); return; }
    var fname = String(name || 'file');
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    }).then(function (blob) {
      var href = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = href; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
      toastDismiss('เริ่มดาวน์โหลดแล้ว', fname, 'success');
    })['catch'](function (er) {
      try { console.error('[FILE] ดาวน์โหลดไม่สำเร็จ:', er); } catch (e) {}
      toastDismiss('ดาวน์โหลดไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง', 'error');
    });
  }

  /* ================= MODAL ================= */
  function openModal(title, bodyHTML, footHTML, opts) {
    opts = opts || {};
    closeModal();
    var root = document.getElementById('modal-root');
    root.innerHTML =
      '<div class="modal-overlay' + (opts.fullMobile ? ' modal-full' : '') + '" id="modal-overlay">' +
      '<div class="modal ' + (opts.wide ? 'modal-wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head">' +
      (opts.fullMobile ? '<button class="btn-icon only-mobile" id="modal-back" aria-label="ย้อนกลับ">' +
        icon('chevL') + '</button>' : '') +
      '<h3>' + title + '</h3><button class="btn-icon" id="modal-x" aria-label="ปิด">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + bodyHTML + '</div>' +
      (footHTML ? '<div class="modal-foot">' + footHTML + '</div>' : '') +
      '</div></div>';
    document.body.classList.add('modal-open');
    document.getElementById('modal-x').onclick = closeModal;
    var mb = document.getElementById('modal-back');
    if (mb) mb.onclick = closeModal;
    document.getElementById('modal-overlay').addEventListener('mousedown', function (ev) {
      if (ev.target === this && !opts.locked) closeModal();
    });
  }
  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
    document.body.classList.remove('modal-open');
  }
  /* ล็อกเฉพาะปุ่มที่ผู้ใช้กด — ไม่แตะปุ่มอื่นในหน้า
     - กันกดซ้ำด้วย data-busy บนตัวปุ่มเอง
     - เก็บ innerHTML และ disabled เดิมไว้ คืนค่าใน finally เสมอ
       ทั้งกรณีสำเร็จ ล้มเหลว และ timeout จึงไม่มีทางค้าง disabled ถาวร
     - คงความกว้างปุ่มเดิมไว้ระหว่างโหลด กัน layout กระโดด
     - ไม่ใช้ setTimeout ปลดล็อก
     ใช้กับปุ่มที่ยังไม่มี guard เดิม · ปุ่มที่มี btn.disabled guard อยู่แล้วไม่ต้องเปลี่ยน */
  function withButtonLoading(btn, loadingText, task) {
    if (!btn) return Promise.resolve(task());
    if (btn.dataset && btn.dataset.busy === '1') return Promise.resolve();
    var oldHtml = btn.innerHTML;
    var oldDisabled = btn.disabled;
    var oldWidth = btn.style.width;
    var rect = btn.getBoundingClientRect();
    if (rect && rect.width) btn.style.width = Math.round(rect.width) + 'px';
    if (btn.dataset) btn.dataset.busy = '1';
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<span class="spinner"></span> ' + esc(loadingText || 'กำลังดำเนินการ…');
    function restore() {
      btn.innerHTML = oldHtml;
      btn.disabled = oldDisabled;
      btn.style.width = oldWidth;
      btn.setAttribute('aria-busy', 'false');
      if (btn.dataset) btn.dataset.busy = '0';
    }
    var p;
    try { p = task(); } catch (e) { restore(); throw e; }
    if (!p || typeof p.then !== 'function') { restore(); return Promise.resolve(p); }
    return p.then(function (v) { restore(); return v; },
                  function (e) { restore(); throw e; });
  }

  function confirmDialog(title, msg, okLabel, onOk, danger) {
    openModal(title,
      '<p class="confirm-msg">' + msg + '</p><div class="form-error" id="cf-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="cf-no">ยกเลิก</button>' +
      '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" id="cf-yes">' + esc(okLabel) + '</button>');
    var noBtn = document.getElementById('cf-no');
    var yesBtn = document.getElementById('cf-yes');
    noBtn.onclick = closeModal;

    /* ป้องกันกดซ้ำ + รองรับ onOk ที่คืน Promise
       - งาน synchronous: ทำงานแล้วปิด Modal ทันทีเหมือนเดิม
       - งาน asynchronous: แสดง Loading ที่ปุ่มยืนยัน **ไม่ปิด Modal จนกว่าจะสำเร็จ**
       - ล้มเหลวหรือ throw: Modal ยังอยู่ · ปุ่มกลับมากดใหม่ได้ · แสดงข้อความผิดพลาด
       - ปุ่มยกเลิกถูกปิดระหว่างทำงาน กันปิด Modal ทิ้งกลางคัน */
    var cfBusy = false;
    yesBtn.onclick = function () {
      if (cfBusy) return;
      var btn = this;
      var oldHtml = btn.innerHTML;
      var oldWidth = btn.style.width;
      var rect = btn.getBoundingClientRect();
      var errEl = document.getElementById('cf-err');
      if (errEl) errEl.textContent = '';

      function lock() {
        cfBusy = true;
        if (rect && rect.width) btn.style.width = Math.round(rect.width) + 'px';
        btn.disabled = true;
        noBtn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.innerHTML = '<span class="spinner"></span> กำลังดำเนินการ…';
      }
      function unlock() {
        cfBusy = false;
        btn.innerHTML = oldHtml;
        btn.style.width = oldWidth;
        btn.disabled = false;
        noBtn.disabled = false;
        btn.setAttribute('aria-busy', 'false');
      }
      function fail(e) {
        unlock();
        var msg = (e && e.message) || 'ดำเนินการไม่สำเร็จ';
        var el = document.getElementById('cf-err');
        if (el) el.textContent = msg; else toast(msg, 'error');
      }

      var r;
      cfBusy = true;                       // กันกดรัวระหว่างเรียก onOk รอบแรก
      try { r = onOk(); } catch (e) { cfBusy = false; fail(e); return; }

      if (!r || typeof r.then !== 'function') { closeModal(); return; }   // synchronous เหมือนเดิม

      cfBusy = false; lock();              // async: แสดง Loading แล้วรอผล
      r.then(function () { unlock(); closeModal(); }, fail);
    };
  }

