/* TRANSPORT NJ — DRIVER mobile (minimal UI) + GPS tracker */
(function () {
  'use strict';
  if (!window.TNJ) return; // core.js stopped (file:// or libraries failed) — fatal screen already shown
  const T = window.TNJ, h = T.h, $ = T.$, $$ = T.$$;
  const S = { data: null, at: 0 };

  /* ---------- GPS tracker ---------- */
  const GPS = T.gps = {
    watchId: null, jobId: null, buf: [], timer: null, lastSent: null, lastFix: null, wakeLock: null, status: 'off', QKEY: 'tnj.gpsq',
    start(jobId) {
      if (!navigator.geolocation) { GPS.status = 'unsupported'; return; }
      if (GPS.watchId != null && GPS.jobId === jobId) return;
      GPS.stop(false); GPS.jobId = jobId; GPS.status = 'starting';
      GPS.watchId = navigator.geolocation.watchPosition((p) => { GPS.status = 'on'; GPS.lastFix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, speed: p.coords.speed, heading: p.coords.heading, t: new Date(p.timestamp).toISOString() }; const last = GPS.buf[GPS.buf.length - 1]; if (!last || Date.now() - new Date(last.t).getTime() >= 5000) GPS.buf.push(GPS.lastFix); GPS.draw(); }, (e) => { GPS.status = e.code === 1 ? 'denied' : 'error'; GPS.draw(); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
      clearInterval(GPS.timer); GPS.timer = setInterval(() => GPS.flush(), Math.max(10, T.settings.gps_interval_sec || 30) * 1000);
      GPS.lock(); GPS.draw();
    },
    stop(flush = true) { if (GPS.watchId != null) navigator.geolocation.clearWatch(GPS.watchId); GPS.watchId = null; clearInterval(GPS.timer); GPS.timer = null; if (flush) GPS.flush(); GPS.jobId = null; GPS.status = 'off'; if (GPS.wakeLock) { try { GPS.wakeLock.release(); } catch (_) { } GPS.wakeLock = null; } GPS.draw(); },
    async lock() { try { if ('wakeLock' in navigator && !GPS.wakeLock) { GPS.wakeLock = await navigator.wakeLock.request('screen'); GPS.wakeLock.addEventListener('release', () => { GPS.wakeLock = null; }); } } catch (_) { } },
    queue() { try { return JSON.parse(localStorage.getItem(GPS.QKEY) || '[]'); } catch (_) { return []; } },
    async flush() {
      if (!T.session) return;
      let q = GPS.queue(); if (GPS.buf.length && GPS.jobId) { q.push({ job_id: GPS.jobId, points: GPS.buf.splice(0, GPS.buf.length) }); }
      if (!q.length) return; try { localStorage.setItem(GPS.QKEY, JSON.stringify(q.slice(-200))); } catch (_) { }
      if (!navigator.onLine) return;
      const rest = [];
      for (const item of q) { try { await T.rpc('tnj_gps_insert', { p_token: T.session.token, p_job_id: item.job_id, p_points: item.points }, { silent: true }); GPS.lastSent = Date.now(); } catch (e) { const p = T.parseErr(e); if (!p.code || p.code === 'TNJ_MAINTENANCE' || p.code === 'TNJ_SESSION_INVALID' || p.code === 'TNJ_VERSION_MISMATCH') { rest.push(item); if (p.code) { T.err(e); break; } } } }
      try { if (rest.length) localStorage.setItem(GPS.QKEY, JSON.stringify(rest.slice(-200))); else localStorage.removeItem(GPS.QKEY); } catch (_) { }
      GPS.draw();
    },
    draw() { const el = $('#gpsBar'); if (!el) return; const q = GPS.queue().length; const txt = GPS.status === 'on' ? `GPS ทำงาน · ส่งล่าสุด ${GPS.lastSent ? T.fmtTime(new Date(GPS.lastSent)) : '-'}${q ? ` · รอส่ง ${q}` : ''}` : GPS.status === 'denied' ? 'ไม่ได้รับอนุญาตใช้ตำแหน่ง — เปิด Location ให้เว็บนี้' : GPS.status === 'starting' ? 'กำลังหาสัญญาณ GPS...' : GPS.status === 'unsupported' ? 'อุปกรณ์ไม่รองรับ GPS' : GPS.status === 'error' ? 'หาสัญญาณ GPS ไม่ได้' : 'GPS ปิด (ไม่มีงานที่กำลังทำ)'; el.innerHTML = `<span class="${GPS.status === 'on' ? 'dot-live' : 'dot-off'}"></span><span class="grow">${h(txt)}</span>${GPS.status === 'on' ? '<span class="xs muted">เปิดหน้านี้ค้างไว้ขณะวิ่งงาน</span>' : ''}`; },
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && GPS.jobId) { GPS.lock(); GPS.flush(); } });
  window.addEventListener('online', () => GPS.flush());

  /* ---------- data ---------- */
  async function loadJobs(force) {
    if (!force && S.data && Date.now() - S.at < 5000) return S.data;
    S.data = await T.auth('tnj_driver_jobs', {}, { silent: true }); S.at = Date.now(); T.server.offsetMs = new Date(S.data.server_time).getTime() - Date.now();
    if (S.data.gps_interval_sec) T.settings.gps_interval_sec = S.data.gps_interval_sec;
    const a = S.data.active; if (a && T.ACTIVE.has(a.status)) GPS.start(a.id); else if (GPS.jobId) GPS.stop(true);
    return S.data;
  }
  async function getJob(id) { const d = await loadJobs(); if (d.active && d.active.id === id) return d.active; return T.auth('tnj_job_get', { p_job_id: id }, { silent: true }); }

  /* ---------- shell ---------- */
  function shell(app, title, back, nav) {
    app.innerHTML = `<div class="drv"><header class="drv-top">${back ? `<button class="back" data-back>‹</button>` : '<span style="width:36px"></span>'}<h2>${title}</h2><span style="width:36px"></span></header><div class="gpsbar" id="gpsBar"></div><div class="drv-body" id="dbody"></div>
      <nav class="drv-nav">${[['d/jobs', '📋', 'งานของฉัน'], ['d/map', '🗺️', 'แผนที่'], ['d/docs', '📁', 'เอกสาร'], ['d/profile', '👤', 'โปรไฟล์']].map(([p, ic, l]) => `<a href="#/${p}" class="${nav === p ? 'active' : ''}"><span class="ic">${ic}</span>${l}</a>`).join('')}</nav></div>`;
    const b = $('[data-back]', app); if (b) b.onclick = () => T.go(back); GPS.draw(); return $('#dbody', app);
  }
  T.pages.driver = async (app, r) => {
    const p = r.seg[1] || 'jobs';
    if (!T._rt['tnj:driver:' + T.session.driver_id]) T.subscribe('tnj:driver:' + T.session.driver_id, (pl, ev) => { S.at = 0; if (ev === 'job' && pl.event === 'assigned') { T.toast('🔔 มีงานใหม่มอบหมายให้คุณ', 'ok', 6000); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (_) { } } if (pl.event === 'cancelled') T.toast('งานถูกยกเลิก', 'warn', 6000); T.render(); });
    if (p === 'jobs' && r.seg[2]) return pageJob(app, r.seg[2], r.q.tab);
    if (p === 'jobs') return pageJobs(app);
    if (p === 'map') return pageMap(app);
    if (p === 'docs') return pageDocs(app);
    if (p === 'profile') return pageProfile(app);
    T.go('d/jobs');
  };

  /* ---------- pages ---------- */
  const card = (j, active) => `<div class="jobcard"><div class="flex between"><span class="jn">${h(j.job_no)}</span>${T.badge(j.status)}</div>
    <div class="mt1"><b>${h(j.customer_name)}</b><div class="small muted">B/L: ${h(j.bl_no)} · ตู้: ${h(j.container_no || '-')} ${h(j.container_size || '')}</div></div>
    <div class="pt"><div class="ic a">📍</div><div><div class="l">ท่ารับตู้ · ${T.fmtD(j.pickup_date)} ${T.fmtT(j.pickup_time)} น.</div><div class="v">${h(j.pickup_location_text)}</div></div></div>
    <div class="pt"><div class="ic b">🏭</div><div><div class="l">โรงงาน${j.factory_date ? ' · ' + T.fmtD(j.factory_date) + ' ' + T.fmtT(j.factory_time) : ''}</div><div class="v">${h(j.factory_location_text)}</div></div></div>
    <div class="pt" style="border:0"><div class="ic c">↩️</div><div><div class="l">จุดคืนตู้ · ${T.fmtD(j.return_date)} ${T.fmtT(j.return_time)} น.</div><div class="v">${h(j.return_location_text)}</div></div></div>
    ${j.pickup_note || j.job_note ? `<div class="alert info mt1 small">${h(j.job_note || '')} ${h(j.pickup_note || '')}</div>` : ''}
    <div class="grid g2 mt1">${active ? `<a class="btn btn-lg btn-p" href="#/d/jobs/${j.id}">ดูรายละเอียด</a><button class="btn btn-lg btn-g" data-next="${j.id}">${nextLabel(j)}</button>` : `<a class="btn btn-lg" href="#/d/jobs/${j.id}">ดูรายละเอียด</a><button class="btn btn-lg btn-g" data-accept="${j.id}">✅ รับงาน</button>`}</div></div>`;
  const nextLabel = (j) => { if (j.status === 'PROBLEM') return '⚠ แจ้งปัญหาอยู่'; const n = T.nextStatus(j.status); return n ? `${T.ST_BTN[n][1]} ${T.ST_BTN[n][0]}` : 'อัปเดต Timeline'; };

  async function pageJobs(app) {
    const body = shell(app, 'งานของฉัน', null, 'd/jobs'); body.innerHTML = '<div class="empty">กำลังโหลด...</div>';
    let d; try { d = await loadJobs(true); } catch (e) { body.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; T.err(e); return; }
    body.innerHTML = `${d.active ? `<h3 class="mb1">งานปัจจุบัน</h3>${card(d.active, true)}` : '<div class="card card-b c muted mb2">ยังไม่มีงานที่กำลังทำ</div>'}
      <h3 class="mb1">งานรอรับ (${d.assigned.length})</h3>${d.assigned.map((j) => card(j, false)).join('') || '<div class="card card-b c muted mb2">ไม่มีงานรอรับ</div>'}
      ${d.recent.length ? `<h3 class="mb1 mt2">งานล่าสุด</h3>${d.recent.map((j) => `<a class="card card-b flex between mb1" href="#/d/jobs/${j.id}" style="color:inherit"><span><b>${h(j.job_no)}</b> <span class="small muted">${h(j.customer_name)}</span></span>${T.badge(j.status)}</a>`).join('')}` : ''}`;
    $$('[data-accept]', body).forEach((b) => b.onclick = () => accept(b.dataset.accept));
    $$('[data-next]', body).forEach((b) => b.onclick = () => statusSheet(d.active, () => T.render()));
    T.every('drvjobs', 30000, () => { S.at = 0; T.render(); });
  }
  async function accept(id) {
    if (!(await T.confirm('รับงาน', 'ยืนยันรับงานนี้? ระบบจะบันทึกเวลา ตำแหน่ง และเริ่มส่ง GPS', 'รับงาน', 'btn-g'))) return;
    try { T.loading(true); const pos = await T.getPos(); const j = await T.auth('tnj_driver_accept', { p_job_id: id, p_lat: pos && pos.lat, p_lng: pos && pos.lng, p_acc: pos && pos.acc }, { silent: true }); T.toast('รับงานแล้ว ✅', 'ok'); S.at = 0; GPS.start(j.id); T.go('d/jobs/' + j.id); } catch (e) { T.err(e); } finally { T.loading(false); }
  }

  async function pageJob(app, id, tab) {
    const body = shell(app, '', 'd/jobs', 'd/jobs'); body.innerHTML = '<div class="empty">กำลังโหลด...</div>';
    let j; try { j = await getJob(id); } catch (e) { body.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
    $('.drv-top h2', app).innerHTML = `${h(j.job_no)}<div class="xs" style="font-weight:400">${h(T.ST_TH[j.status])}</div>`;
    const active = T.ACTIVE.has(j.status), assigned = j.status === 'ASSIGNED', closed = ['COMPLETED', 'CANCELLED'].includes(j.status); const m = j.mileage || {};
    tab = tab || 'info';
    const reload = () => { S.at = 0; pageJob(app, id, tab); };
    body.innerHTML = `${j.status === 'PROBLEM' ? '<div class="alert err">⚠ งานอยู่ในสถานะมีปัญหา — เมื่อแก้ไขแล้วกด "แก้ไขปัญหาแล้ว" เพื่อทำงานต่อ</div>' : ''}
      <div class="tabs" id="dtabs">${[['info', 'ข้อมูลงาน'], ['tl', `Timeline (${j.timeline.length})`], ['docs', `เอกสาร (${j.files.length})`], ['fuel', 'ไมล์/น้ำมัน']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="dtb"></div>
      ${closed ? '' : `<div class="bigbtns">
        <button class="btn btn-navy" data-a="map"><span class="ic">🗺️</span>เปิดแผนที่</button>
        ${assigned ? '<button class="btn btn-g" data-a="accept"><span class="ic">✅</span>รับงาน</button>' : j.status === 'PROBLEM' ? '<button class="btn btn-g" data-a="resolve"><span class="ic">✅</span>แก้ไขปัญหาแล้ว</button>' : '<button class="btn btn-p" data-a="status"><span class="ic">📝</span>อัปเดต Timeline</button>'}
        <button class="btn btn-o" data-a="mile" ${assigned ? 'disabled' : ''}><span class="ic">⛽</span>${!m.start_mileage ? 'บันทึกไมล์ก่อน' : !m.end_mileage ? 'บันทึกไมล์หลัง' : 'ไมล์ / น้ำมัน'}</button>
        <button class="btn" data-a="docs"><span class="ic">📷</span>ถ่ายรูป / แนบไฟล์</button>
        <button class="btn btn-r" data-a="problem" ${assigned ? 'disabled' : ''}><span class="ic">⚠️</span>แจ้งปัญหา</button>
        <button class="btn" data-a="fuel" ${assigned ? 'disabled' : ''}><span class="ic">🛢️</span>เติมน้ำมัน</button></div>`}`;
    const tb = $('#dtb', body);
    const draw = () => {
      if (tab === 'info') tb.innerHTML = `<div class="jobcard"><div class="kv"><div class="k">ลูกค้า</div><div class="v">${h(j.customer_name)}</div><div class="k">B/L</div><div class="v">${h(j.bl_no)}</div><div class="k">Container</div><div class="v">${h(j.container_no || '-')} ${h(j.container_size || '')}</div><div class="k">Seal</div><div class="v">${h(j.seal_no || '-')}</div><div class="k">รถ</div><div class="v">${h(j.license_plate || '-')}</div></div>
        <div class="pt mt1"><div class="ic a">📍</div><div class="grow"><div class="l">ท่ารับตู้ · ${T.fmtD(j.pickup_date)} ${T.fmtT(j.pickup_time)} น.</div><div class="v">${h(j.pickup_location_text)}</div>${j.pickup_note ? `<div class="small muted">${h(j.pickup_note)}</div>` : ''}</div><a class="btn btn-sm" target="_blank" rel="noopener" href="${T.mapsUrl(j.pickup_loc, j.pickup_location_text)}">🧭</a></div>
        <div class="pt"><div class="ic b">🏭</div><div class="grow"><div class="l">โรงงาน · ${j.factory_date ? T.fmtD(j.factory_date) + ' ' + T.fmtT(j.factory_time) : '-'}</div><div class="v">${h(j.factory_location_text)}</div>${j.factory_contact || j.factory_phone ? `<div class="small">${h(j.factory_contact || '')} ${j.factory_phone ? `<a href="tel:${h(j.factory_phone)}">📞 ${h(j.factory_phone)}</a>` : ''}</div>` : ''}${j.factory_note ? `<div class="small muted">${h(j.factory_note)}</div>` : ''}</div><a class="btn btn-sm" target="_blank" rel="noopener" href="${T.mapsUrl(j.factory_loc, j.factory_location_text)}">🧭</a></div>
        <div class="pt" style="border:0"><div class="ic c">↩️</div><div class="grow"><div class="l">จุดคืนตู้ · ${T.fmtD(j.return_date)} ${T.fmtT(j.return_time)} น.</div><div class="v">${h(j.return_location_text)}</div>${j.return_note ? `<div class="small muted">${h(j.return_note)}</div>` : ''}</div><a class="btn btn-sm" target="_blank" rel="noopener" href="${T.mapsUrl(j.return_loc, j.return_location_text)}">🧭</a></div>${j.job_note ? `<div class="alert info small mt1">${h(j.job_note)}</div>` : ''}</div>`;
      else if (tab === 'tl') tb.innerHTML = `<div class="jobcard">${j.timeline.length ? `<ul class="tl">${j.timeline.map((t) => `<li class="${h(t.event_type)}"><div class="flex"><span class="t">${T.fmtTime(t.event_at)}</span><span class="ttl">${h(t.title)}</span></div><div class="meta">${T.fmtD(t.event_at)} · ${h(t.actor_name || '')}${t.files && t.files.length ? ' · 📎 ' + t.files.length : ''}</div>${t.note || t.problem_detail ? `<div class="note">${h(t.note || t.problem_detail)}</div>` : ''}</li>`).join('')}</ul>` : '<div class="empty">ยังไม่มี Timeline</div>'}</div>`;
      else if (tab === 'docs') { tb.innerHTML = `<div class="jobcard">${j.files.map((f) => T.fileRow(f, !closed && f.uploaded_by === T.session.user_id)).join('') || '<div class="empty">ยังไม่มีเอกสาร</div>'}${closed ? '' : '<button class="btn btn-lg btn-block btn-p mt1" data-a="docs">📷 ถ่ายรูป / แนบไฟล์</button>'}</div>`; T.bindFileRows(tb, j.files, reload); const b = $('[data-a=docs]', tb); if (b) b.onclick = act; }
      else tb.innerHTML = `<div class="jobcard">${m.warning_note ? `<div class="alert warn">${h(m.warning_note)}</div>` : ''}<div class="kv"><div class="k">ไมล์ก่อน</div><div class="v">${T.num(m.start_mileage)} กม.</div><div class="k">ไมล์หลัง</div><div class="v">${T.num(m.end_mileage)} กม.</div><div class="k">ระยะทาง</div><div class="v">${T.num(m.total_distance)} กม.</div><div class="k">น้ำมันรวม</div><div class="v">${T.num(j.fuel_liters, 2)} ลิตร / ${T.num(j.fuel_amount, 2)} บาท</div><div class="k">กม./ลิตร</div><div class="v">${T.kml(j.km_per_liter)}</div></div>
        ${j.fuel.length ? `<div class="mt1">${j.fuel.map((f) => `<div class="flex between small" style="padding:6px 0;border-top:1px solid #EEF1F5"><span>${T.fmtDT(f.fuel_date)} ${h(f.fuel_station || '')}</span><b>${T.num(f.liters, 2)} ล. · ${T.num(f.total_amount, 2)} บ.</b></div>`).join('')}</div>` : ''}</div>`;
    };
    $$('#dtabs button', body).forEach((b) => b.onclick = () => { tab = b.dataset.tab; $$('#dtabs button', body).forEach((x) => x.classList.toggle('active', x === b)); history.replaceState(null, '', `#/d/jobs/${id}?tab=${tab}`); draw(); });
    async function act(e) {
      const a = e.currentTarget.dataset.a;
      if (a === 'map') return T.go('d/map?job=' + j.id);
      if (a === 'accept') return accept(j.id);
      if (a === 'status') return statusSheet(j, reload);
      if (a === 'resolve') { const n = await T.prompt('แก้ไขปัญหาแล้ว', 'อธิบายสั้น ๆ'); if (n == null) return; try { await T.auth('tnj_problem_resolve', { p_job_id: j.id, p_note: n }); T.toast('กลับสู่สถานะปกติ', 'ok'); reload(); } catch (er) { T.err(er); } return; }
      if (a === 'mile') return mileSheet(j, reload);
      if (a === 'docs') { const r = await T.uploadDialog(j.id, { sheet: true }); if (r) reload(); return; }
      if (a === 'problem') return problemSheet(j, reload);
      if (a === 'fuel') return fuelSheet(j, reload);
    }
    $$('.bigbtns [data-a]', body).forEach((b) => b.onclick = act); draw();
    if (active) { T.subscribe('tnj:job:' + j.id, T.debounce(reload, 1500)); T.every('drvjob', 45000, reload); }
  }

  /* ---------- sheets ---------- */
  function statusSheet(j, onDone) {
    const next = T.nextStatus(j.status); const steps = T.STATUS.slice(3, 13);
    T.modal({ title: `อัปเดตสถานะ — ${j.job_no}`, sheet: true, body: `<div class="alert info">สถานะปัจจุบัน: <b>${h(T.ST_TH[j.status])}</b> — กดได้เฉพาะขั้นถัดไป</div><div class="stlist">${steps.map((s) => { const [l, ic, cls] = T.ST_BTN[s]; const isNext = s === next; const done = T.statusOrder(s) <= T.statusOrder(j.status); return `<button class="btn ${isNext ? cls + ' next' : ''}" data-st="${s}" ${isNext ? '' : 'disabled'}>${ic} ${l}${done ? ' ✓' : ''}</button>`; }).join('')}</div><div class="field mt2"><label>หมายเหตุ (ถ้ามี)</label><input class="inp inp-lg" id="stNote"></div><label class="check"><input type="checkbox" id="stPhoto"> ถ่ายรูปแนบด้วย</label>`,
      onOpen: (el, close) => { $$('[data-st]', el).forEach((b) => b.onclick = async () => { const st = b.dataset.st; const note = $('#stNote', el).value.trim(); const photo = $('#stPhoto', el).checked;
        if (st === 'COMPLETED') { const m = j.mileage || {}; if (!m.end_mileage && !(await T.confirm('ปิดงาน', '⚠ ยังไม่ได้บันทึกไมล์หลัง — ปิดงานเลยหรือไม่? (แนะนำให้บันทึกไมล์หลังก่อน)', 'ปิดงานเลย', 'btn-r'))) return; }
        try { T.loading(true); const pos = await T.getPos(); const r = await T.auth('tnj_status_update', { p_job_id: j.id, p_status: st, p_note: note || null, p_lat: pos && pos.lat, p_lng: pos && pos.lng, p_acc: pos && pos.acc }, { silent: true }); T.toast(`✅ ${T.ST_BTN[st][0]}`, 'ok'); close(); if (GPS.jobId === j.id && GPS.lastFix) { GPS.buf.push(GPS.lastFix); GPS.flush(); }
          if (st === 'COMPLETED') { GPS.stop(true); S.at = 0; T.go('d/jobs'); return; }
          if (photo) { const tl = r.timeline[r.timeline.length - 1]; await T.uploadDialog(j.id, { sheet: true, timelineId: tl && tl.id, defaultType: st === 'CONTAINER_PICKED_UP' ? 'รูปตู้' : st === 'ARRIVED_FACTORY' ? 'เอกสารโรงงาน' : st === 'CONTAINER_RETURNED' ? 'EIR คืนตู้' : 'อื่น ๆ' }); }
          onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }); } });
  }
  function mileSheet(j, onDone) {
    const m = j.mileage || {}; const isStart = !m.start_mileage; if (m.start_mileage && m.end_mileage) { T.toast('บันทึกไมล์ครบแล้ว', 'ok'); return; }
    if (!isStart && !['ARRIVED_RETURN', 'CONTAINER_RETURNED', 'PROBLEM', 'LEAVING_FACTORY', 'GOING_TO_RETURN'].includes(j.status) && j.status !== 'COMPLETED') { /* allow anyway but warn */ }
    T.modal({ title: isStart ? 'บันทึกไมล์ก่อนเริ่มงาน' : 'บันทึกไมล์หลังจบงาน', sheet: true, body: `${!isStart ? `<div class="alert info">ไมล์ก่อน: <b>${T.num(m.start_mileage)}</b> กม.</div>` : ''}<div class="field"><label>เลขไมล์${isStart ? 'ก่อน' : 'หลัง'} (กม.) <span class="req">*</span></label><input type="number" inputmode="numeric" class="inp inp-xl" id="mlV" placeholder="125000"></div><div id="mlDist" class="c b" style="font-size:18px;color:var(--navy)"></div><label class="btn btn-lg btn-block btn-navy mt1"><span>📷 ถ่ายรูปเลขไมล์</span><input type="file" accept="image/*" capture="environment" id="mlImg" class="hidden"></label><div id="mlImgN" class="c small muted mt1">ยังไม่ได้ถ่ายรูป</div>`,
      foot: `<button class="btn btn-lg" data-close>ยกเลิก</button><button class="btn btn-lg btn-p" id="mlGo">บันทึก</button>`,
      onOpen: (el, close) => { $('#mlImg', el).onchange = (e) => { $('#mlImgN', el).textContent = e.target.files[0] ? '📷 ' + e.target.files[0].name : 'ยังไม่ได้ถ่ายรูป'; }; if (!isStart) $('#mlV', el).oninput = (e) => { const d = Number(e.target.value) - Number(m.start_mileage); $('#mlDist', el).textContent = e.target.value ? (d >= 0 ? `ระยะทาง ${T.num(d)} กม.` : '⚠ ต่ำกว่าไมล์ก่อน') : ''; };
        $('#mlGo', el).onclick = async () => { const v = Number($('#mlV', el).value); if (!$('#mlV', el).value || v < 0) return T.toast('กรุณากรอกเลขไมล์', 'warn'); if (!isStart && v < Number(m.start_mileage)) return T.toast('ไมล์หลังต้องไม่ต่ำกว่าไมล์ก่อน', 'err');
          try { T.loading(true); const pos = await T.getPos(); let img = null; const f = $('#mlImg', el).files[0]; if (f) { const up = await T.files.upload(j.id, await T.files.shrink(f), 'รูปเลขไมล์', null, isStart ? 'ไมล์ก่อน' : 'ไมล์หลัง'); img = up.file_id; }
            const r = await T.auth(isStart ? 'tnj_mileage_start' : 'tnj_mileage_end', { p_job_id: j.id, p_mileage: v, p_image_id: img, p_lat: pos && pos.lat, p_lng: pos && pos.lng }, { silent: true }); if (r.warning) T.toast(r.warning_note, 'warn', 7000); else T.toast(isStart ? 'บันทึกไมล์ก่อนแล้ว' : `บันทึกไมล์หลังแล้ว ระยะทาง ${T.num(r.distance)} กม.`, 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
  }
  function fuelSheet(j, onDone) {
    T.modal({ title: 'บันทึกเติมน้ำมัน', sheet: true, body: `<div class="inline-row"><div class="field"><label>จำนวนลิตร <span class="req">*</span></label><input type="number" inputmode="decimal" step="0.01" class="inp inp-lg" id="fL"></div><div class="field"><label>ราคา/ลิตร <span class="req">*</span></label><input type="number" inputmode="decimal" step="0.01" class="inp inp-lg" id="fP"></div></div><div class="c b" id="fTot" style="font-size:20px;color:var(--navy)"></div>
      <div class="inline-row"><div class="field"><label>ปั๊มน้ำมัน</label><input class="inp" id="fSt" placeholder="PTT บางนา"></div><div class="field"><label>ประเภท</label><select class="inp" id="fT">${['ดีเซล B7', 'ดีเซล B10', 'ดีเซล B20', 'ดีเซลพรีเมียม', 'NGV', 'อื่น ๆ'].map((t) => `<option>${t}</option>`).join('')}</select></div></div>
      <div class="inline-row"><div class="field"><label>เลขไมล์ตอนเติม</label><input type="number" inputmode="numeric" class="inp" id="fM"></div><div class="field"><label>เลขใบเสร็จ</label><input class="inp" id="fR"></div></div>
      <label class="btn btn-lg btn-block btn-navy"><span>📷 ถ่ายรูปใบเสร็จ</span><input type="file" accept="image/*" capture="environment" id="fImg" class="hidden"></label><div id="fImgN" class="c small muted mt1">ยังไม่ได้ถ่ายรูป</div><div class="field mt1"><label>หมายเหตุ</label><input class="inp" id="fN"></div>`,
      foot: `<button class="btn btn-lg" data-close>ยกเลิก</button><button class="btn btn-lg btn-p" id="fGo">บันทึก</button>`,
      onOpen: (el, close) => { const calc = () => { const l = Number($('#fL', el).value), p = Number($('#fP', el).value); $('#fTot', el).textContent = l > 0 && p > 0 ? `รวม ${T.num(l * p, 2)} บาท` : ''; }; $('#fL', el).oninput = calc; $('#fP', el).oninput = calc; $('#fImg', el).onchange = (e) => { $('#fImgN', el).textContent = e.target.files[0] ? '📷 ' + e.target.files[0].name : ''; };
        $('#fGo', el).onclick = async () => { const p = { liters: $('#fL', el).value, price_per_liter: $('#fP', el).value, fuel_station: $('#fSt', el).value.trim(), fuel_type: $('#fT', el).value, mileage: $('#fM', el).value, receipt_no: $('#fR', el).value.trim(), note: $('#fN', el).value.trim() }; if (!(Number(p.liters) > 0)) return T.toast('กรุณากรอกจำนวนลิตร', 'warn'); if (p.price_per_liter === '') return T.toast('กรุณากรอกราคาต่อลิตร', 'warn');
          try { T.loading(true); const pos = await T.getPos(); if (pos) { p.lat = pos.lat; p.lng = pos.lng; } const f = $('#fImg', el).files[0]; if (f) { const up = await T.files.upload(j.id, await T.files.shrink(f), 'ใบเสร็จ', null, null); p.receipt_file = up.file_id; } const r = await T.auth('tnj_fuel_add', { p_job_id: j.id, p }, { silent: true }); if (r.warning_note) T.toast(r.warning_note, 'warn', 6000); T.toast('บันทึกน้ำมันแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
  }
  function problemSheet(j, onDone) {
    T.modal({ title: '⚠ แจ้งปัญหา', sheet: true, body: `<div class="field"><label>ประเภทปัญหา <span class="req">*</span></label><div class="grid g2" id="pbTypes">${T.PROBLEM_TYPES.map((t) => `<button class="btn btn-lg" data-t="${h(t)}">${h(t)}</button>`).join('')}</div></div><div class="field"><label>รายละเอียด <span class="req">*</span></label><textarea class="inp inp-lg" id="pbD" placeholder="อธิบายปัญหา"></textarea></div><label class="btn btn-lg btn-block"><span>📷 ถ่ายรูป / แนบไฟล์</span><input type="file" accept="image/*,.pdf" multiple id="pbImg" class="hidden"></label><div id="pbImgN" class="c small muted mt1"></div>`,
      foot: `<button class="btn btn-lg" data-close>ยกเลิก</button><button class="btn btn-lg btn-r" id="pbGo">ส่งแจ้งปัญหา</button>`,
      onOpen: (el, close) => { let type = ''; $$('#pbTypes button', el).forEach((b) => b.onclick = () => { type = b.dataset.t; $$('#pbTypes button', el).forEach((x) => x.classList.toggle('btn-r', x === b)); }); $('#pbImg', el).onchange = (e) => { $('#pbImgN', el).textContent = `${e.target.files.length} ไฟล์`; };
        $('#pbGo', el).onclick = async () => { const d = $('#pbD', el).value.trim(); if (!type) return T.toast('กรุณาเลือกประเภทปัญหา', 'warn'); if (!d) return T.toast('กรุณากรอกรายละเอียด', 'warn');
          try { T.loading(true); const pos = await T.getPos(); const r = await T.auth('tnj_problem_report', { p_job_id: j.id, p_type: type, p_detail: d, p_lat: pos && pos.lat, p_lng: pos && pos.lng, p_acc: pos && pos.acc }, { silent: true }); for (const f of Array.from($('#pbImg', el).files || [])) await T.files.upload(j.id, await T.files.shrink(f), 'รูปปัญหา', r.timeline_id, null); T.toast('แจ้งปัญหาแล้ว เจ้าหน้าที่ได้รับแจ้งเตือน', 'ok', 5000); close(); onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
  }

  /* ---------- map ---------- */
  async function pageMap(app) {
    const body = shell(app, 'แผนที่', null, 'd/map'); let d; try { d = await loadJobs(); } catch (e) { body.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
    const q = T.route().q; let j = d.active; if (q.job && (!j || j.id !== q.job)) { try { j = await T.auth('tnj_job_get', { p_job_id: q.job }, { silent: true }); } catch (_) { } }
    if (!j) { body.innerHTML = '<div class="card card-b c muted">ยังไม่มีงานที่กำลังทำ</div>'; return; }
    const nextLoc = T.statusOrder(j.status) <= 5 ? ['pickup_loc', 'pickup_location_text', 'ท่ารับตู้'] : T.statusOrder(j.status) <= 8 ? ['factory_loc', 'factory_location_text', 'โรงงาน'] : ['return_loc', 'return_location_text', 'จุดคืนตู้'];
    body.innerHTML = `<div class="jobcard" style="padding:10px 14px"><div class="flex between"><b>${h(j.job_no)}</b>${T.badge(j.status)}</div><div class="small muted" id="mpGps">${GPS.lastFix ? 'GPS ทำงาน' : h(T.ago(j.last_gps_at))}</div></div><div class="map" id="dmap" style="height:52vh"></div>
      <div class="jobcard mt1" style="padding:12px 14px"><div class="l small muted">จุดถัดไป: ${nextLoc[2]}</div><div class="b">${h(j[nextLoc[1]])}</div><a class="btn btn-lg btn-block btn-p mt1" target="_blank" rel="noopener" href="${T.mapsUrl(j[nextLoc[0]], j[nextLoc[1]])}">🧭 เปิดใน Google Maps</a></div>`;
    const map = L.map('dmap').setView([13.1, 100.9], 9); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map); const pts = [];
    [['pickup_loc', 'pickup_location_text', '#F08A1E', '📍'], ['factory_loc', 'factory_location_text', '#1E6FE8', '🏭'], ['return_loc', 'return_location_text', '#0F9D9A', '↩']].forEach(([lk, tk, c, e]) => { const l = j[lk]; if (l && l.latitude && l.longitude) { L.marker([l.latitude, l.longitude], { icon: L.divIcon({ className: 'truck-marker', html: `<div class="pin" style="background:${c}"><span>${e}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 28] }) }).bindPopup(h(j[tk])).addTo(map); pts.push([l.latitude, l.longitude]); } });
    let me = null; const drawMe = (lat, lng) => { if (!me) { me = L.marker([lat, lng], { icon: L.divIcon({ className: 'truck-marker', html: '<div class="tm factory">🚚</div>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map); pts.push([lat, lng]); if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 }); } else me.setLatLng([lat, lng]); };
    if (GPS.lastFix) drawMe(GPS.lastFix.lat, GPS.lastFix.lng); else if (j.last_lat != null) drawMe(j.last_lat, j.last_lng); else { const p = await T.getPos(); if (p) drawMe(p.lat, p.lng); else if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 13 }); }
    T.every('drvmap', 10000, () => { if (GPS.lastFix) { drawMe(GPS.lastFix.lat, GPS.lastFix.lng); $('#mpGps').textContent = `GPS ทำงาน · ${T.fmtTime(GPS.lastFix.t)}${GPS.lastFix.speed != null ? ' · ' + Math.round(GPS.lastFix.speed * 3.6) + ' กม./ชม.' : ''}`; } });
  }
  async function pageDocs(app) {
    const body = shell(app, 'เอกสาร', null, 'd/docs'); let d; try { d = await loadJobs(); } catch (e) { body.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
    const j = d.active; if (!j) { body.innerHTML = '<div class="card card-b c muted">ยังไม่มีงานที่กำลังทำ — เอกสารของงานเก่าดูได้จากหน้างานนั้น</div>'; return; }
    body.innerHTML = `<div class="jobcard"><div class="flex between"><b>${h(j.job_no)}</b>${T.badge(j.status)}</div><div class="small muted">${h(j.customer_name)} · B/L ${h(j.bl_no)}</div></div><div class="tabs" id="dcT"><button class="active" data-t="">ทั้งหมด ${j.files.length}</button><button data-t="img">รูปภาพ</button><button data-t="pdf">PDF</button></div><div class="jobcard" id="dcL">${j.files.map((f) => T.fileRow(f, f.uploaded_by === T.session.user_id)).join('') || '<div class="empty">ยังไม่มีเอกสาร</div>'}</div><button class="btn btn-lg btn-block btn-p" id="dcUp">📷 ถ่ายรูป / แนบไฟล์</button>`;
    T.bindFileRows($('#dcL', body), j.files, () => { S.at = 0; T.render(); });
    $$('#dcT button', body).forEach((b) => b.onclick = () => { $$('#dcT button', body).forEach((x) => x.classList.toggle('active', x === b)); $$('.filebox', body).forEach((row) => { const f = j.files.find((x) => x.id === row.dataset.fid); row.classList.toggle('hidden', b.dataset.t === 'img' ? !/image/.test(f.mime_type || '') : b.dataset.t === 'pdf' ? !/pdf/.test(f.mime_type || '') : false); }); });
    $('#dcUp', body).onclick = async () => { const r = await T.uploadDialog(j.id, { sheet: true }); if (r) { S.at = 0; T.render(); } };
  }
  async function pageProfile(app) {
    const body = shell(app, 'โปรไฟล์', null, 'd/profile'); const q = GPS.queue().length;
    body.innerHTML = `<div class="jobcard c"><div class="avatar" style="width:64px;height:64px;font-size:28px;margin:0 auto 8px">${h((T.session.full_name || '?').slice(0, 1))}</div><h3>${h(T.session.full_name)}</h3><div class="muted small">${h(T.session.username)} · คนขับ</div></div>
      <div class="jobcard"><div class="kv"><div class="k">สถานะ GPS</div><div class="v">${h(GPS.status)}</div><div class="k">รอส่ง GPS</div><div class="v">${q} ชุด</div><div class="k">ส่ง GPS ทุก</div><div class="v">${T.settings.gps_interval_sec} วินาที</div><div class="k">เวอร์ชันแอป</div><div class="v">${h(T.C.APP_VERSION)}</div><div class="k">เซิร์ฟเวอร์</div><div class="v">${h(T.server.version || '-')}</div></div><button class="btn btn-block mt1" id="pfSync">🔄 ส่ง GPS ที่ค้างอยู่</button></div>
      <div class="alert info small">คำแนะนำ: ขณะวิ่งงานให้เปิดหน้าแอปค้างไว้ (หน้าจอไม่ล็อก) เพื่อให้ส่ง GPS ต่อเนื่อง หากปิดหน้าจอ GPS อาจหยุดส่งชั่วคราวและจะส่งต่อเมื่อเปิดแอปอีกครั้ง</div>
      <button class="btn btn-lg btn-block btn-r" id="pfOut">ออกจากระบบ</button>`;
    $('#pfSync', body).onclick = async () => { await GPS.flush(); T.toast('ส่งแล้ว', 'ok'); T.render(); };
    $('#pfOut', body).onclick = async () => { if (await T.confirm('ออกจากระบบ', 'GPS จะหยุดส่งเมื่อออกจากระบบ', 'ออกจากระบบ', 'btn-r')) { GPS.stop(true); T.logout(); } };
  }
})();
