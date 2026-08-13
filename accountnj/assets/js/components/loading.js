export const loadingHTML = '<div class="load-row"><div class="spin"></div></div>';
export function btnBusy(btn, busy) {
  if (!btn) return;
  btn.disabled = busy;
  if (busy) { btn.dataset.txt = btn.innerHTML; btn.innerHTML = 'กำลังทำรายการ…'; }
  else if (btn.dataset.txt) { btn.innerHTML = btn.dataset.txt; }
}
