/* HR V2 — components/modal.js
   Modal กลาง: desktop = กล่องกลางจอ · มือถือ ≤768px = เต็มจอ (CSS)
   open() คืน close() · confirm() สำหรับกล่องยืนยันมาตรฐาน */
export function createModal(root) {
  function close() {
    root.innerHTML = '';
    document.body.classList.remove('v2-modal-open');
  }
  function open(title, bodyHTML, footHTML, opts) {
    opts = opts || {};
    root.innerHTML =
      '<div class="v2m-overlay" id="v2m-overlay"><div class="v2m">' +
      '<div class="v2m-head">' +
      '<button class="v2m-back" id="v2m-back" aria-label="ย้อนกลับ">‹</button>' +
      '<h3></h3><button class="v2m-x" id="v2m-x" aria-label="ปิด">✕</button></div>' +
      '<div class="v2m-body">' + bodyHTML + '</div>' +
      (footHTML ? '<div class="v2m-foot">' + footHTML + '</div>' : '') +
      '</div></div>';
    root.querySelector('.v2m-head h3').textContent = title;
    document.body.classList.add('v2-modal-open');
    root.querySelector('#v2m-x').onclick = close;
    root.querySelector('#v2m-back').onclick = close;
    root.querySelector('#v2m-overlay').addEventListener('mousedown', function (ev) {
      if (ev.target === this && !opts.locked) close();
    });
    return close;
  }
  function confirm(title, msg, okLabel, onOk, danger) {
    const escd = String(msg == null ? '' : msg).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    open(title, '<p class="v2m-msg">' + escd + '</p>',
      '<button class="btn btn-ghost" id="v2m-no">ยกเลิก</button>' +
      '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" id="v2m-yes"></button>');
    root.querySelector('#v2m-yes').textContent = okLabel || 'ยืนยัน';
    root.querySelector('#v2m-no').onclick = close;
    root.querySelector('#v2m-yes').onclick = () => { close(); onOk && onOk(); };
  }
  return { open, close, confirm };
}
