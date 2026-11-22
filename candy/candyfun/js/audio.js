/* CANDY FUN ADVENTURE — audio.js : เสียงสังเคราะห์ด้วย WebAudio (สร้างเอง ไม่มีไฟล์เสียงภายนอก) */
(function (root) {
  'use strict';
  var ctx = null, master = null, on = { sfx: true, music: true }, timer = null, step = 0;
  function ensure() {
    if (ctx) return true;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); } catch (e) { ctx = null; return false; }
    return true;
  }
  function unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); if (on.music && !timer) music(true); }
  function tone(f, t0, dur, type, vol, f2) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + t0;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  var SC = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];
  function sfx(name, n) {
    if (!on.sfx || !ensure() || ctx.state !== 'running') return;
    n = n || 1;
    switch (name) {
      case 'click': tone(700, 0, 0.06, 'triangle', 0.15, 900); break;
      case 'swap': tone(420, 0, 0.09, 'sine', 0.14, 620); break;
      case 'bad': tone(240, 0, 0.14, 'square', 0.07, 150); break;
      case 'match': var i = Math.min(SC.length - 2, n - 1); tone(SC[i], 0, 0.16, 'triangle', 0.2); tone(SC[i + 1], 0.07, 0.2, 'triangle', 0.16); break;
      case 'special': tone(600, 0, 0.3, 'sawtooth', 0.08, 1500); tone(900, 0.05, 0.3, 'sine', 0.14, 1900); break;
      case 'blast': tone(180, 0, 0.32, 'sawtooth', 0.16, 45); tone(90, 0, 0.36, 'square', 0.09, 35); break;
      case 'coin': tone(1319, 0, 0.09, 'square', 0.07); tone(1760, 0.08, 0.2, 'square', 0.07); break;
      case 'star': tone(SC[2 + n], 0, 0.3, 'triangle', 0.2); tone(SC[4 + n], 0.09, 0.36, 'sine', 0.15); break;
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, k) { tone(f, k * 0.11, 0.26, 'triangle', 0.18); }); break;
      case 'fail': [392, 330, 262].forEach(function (f, k) { tone(f, k * 0.17, 0.3, 'sine', 0.16); }); break;
    }
  }
  var MEL = [0, 2, 4, 2, 5, 4, 2, 4, 0, 2, 4, 7, 5, 4, 2, -1], BASS = [262, 262, 349, 349, 220, 220, 196, 196], PENT = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  function music(start) {
    if (timer) { clearInterval(timer); timer = null; }
    if (!start || !on.music || !ensure()) return;
    timer = setInterval(function () {
      if (!ctx || ctx.state !== 'running' || document.hidden) return;
      var m = MEL[step % MEL.length];
      if (m >= 0) tone(PENT[m], 0, 0.3, 'sine', 0.045);
      if (step % 2 === 0) tone(BASS[(step / 2) % BASS.length] / 2, 0, 0.5, 'triangle', 0.05);
      step++;
    }, 300);
  }
  function set(k, v) { on[k] = !!v; if (k === 'music') music(on.music && ctx && ctx.state === 'running'); }
  root.CFAudio = { unlock: unlock, sfx: sfx, set: set };
})(window);
