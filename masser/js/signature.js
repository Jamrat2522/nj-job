// =========================================================
// signature.js — Canvas signature pad (retina, pointer events)
// =========================================================

import { S } from './state.js';
import { $ } from './utils.js';

// Initialize / reset signature canvas (called when opening close modal)
export function initSignature(){
  const canvasOld = $('sig-canvas');
  if(!canvasOld) return;

  // Re-clone to drop any old listeners — fresh state
  const canvas = canvasOld.cloneNode(true);
  canvasOld.parentNode.replaceChild(canvas, canvasOld);

  // Retina-aware sizing (cap dpr at 2 to avoid massive canvases)
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#000';

  // Reset state
  S.sigCtx = ctx;
  S.sigDrawing = false;
  S.sigDirty = false;
  S.sigStrokes = 0;
  S.sigPathLen = 0;

  // Pointer position helper
  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  let lastX = 0, lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    S.sigDrawing = true;
    S.sigStrokes++;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });

  canvas.addEventListener('pointermove', (e) => {
    if(!S.sigDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    const dx = p.x - lastX, dy = p.y - lastY;
    S.sigPathLen += Math.sqrt(dx * dx + dy * dy);
    lastX = p.x; lastY = p.y;
    if(!S.sigDirty){
      S.sigDirty = true;
      canvas.classList.add('dirty');
    }
  });

  const stop = (e) => {
    if(!S.sigDrawing) return;
    S.sigDrawing = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch(_) {}
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('pointerleave', () => { S.sigDrawing = false; });

  // Bind clear button
  const btnClear = $('btn-sig-clear');
  if(btnClear){
    btnClear.onclick = clearSig;
  }
}

export function clearSig(){
  const canvas = $('sig-canvas');
  if(!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  S.sigCtx = canvas.getContext('2d');
  S.sigCtx.setTransform(1, 0, 0, 1, 0, 0);
  S.sigCtx.clearRect(0, 0, canvas.width, canvas.height);
  S.sigCtx.scale(dpr, dpr);
  S.sigCtx.lineCap = 'round';
  S.sigCtx.lineJoin = 'round';
  S.sigCtx.lineWidth = 2.5;
  S.sigCtx.strokeStyle = '#000';
  S.sigDirty = false;
  S.sigStrokes = 0;
  S.sigPathLen = 0;
  canvas.classList.remove('dirty');
}
