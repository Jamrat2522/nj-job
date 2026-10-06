/* TRANSPORT NJ — OFFICE (desktop + responsive) */
(function () {
  'use strict';
  if (!window.TNJ) return; // core.js stopped (file:// or libraries failed) — fatal screen already shown
  const T = window.TNJ, h = T.h, $ = T.$, $$ = T.$$;
  const M = { customers: [], drivers: [], vehicles: [], locations: [], at: 0 };
  const isMobile = () => window.innerWidth <= 640;

  async function loadMasters(force) {
    if (!force && Date.now() - M.at < 60000) return M;
    const [c, d, v, l] = await Promise.all(['customers', 'drivers', 'vehicles', 'locations'].map((k) => T.auth('tnj_master_list', { p_kind: k }, { silent: true })));
    Object.assign(M, { customers: c, drivers: d, vehicles: v, locations: l, at: Date.now() }); return M;
  }
  const opts = (arr, val, label, sel, empty = '— เลือก —') => `<option value="">${empty}</option>` + arr.map((x) => `<option value="${h(x[val])}" ${String(x[val]) === String(sel || '') ? 'selected' : ''}>${h(typeof label === 'function' ? label(x) : x[label])}</option>`).join('');
  const stOpts = (sel, list) => (list || T.STATUS).map((s) => `<option value="${s}" ${s === sel ? 'selected' : ''}>${h(T.ST_TH[s])}</option>`).join('');

  const NAV = [
    ['jobs', '🚚', 'งานขนส่ง'], ['reports', '📈', 'รายงานงานขนส่ง'], ['mileage', '⛽', 'รายงานไมล์ / น้ำมัน'], ['map', '🗺️', 'GPS'],
  ];
  const CARDS = [
    ['total', 'งานทั้งหมดวันนี้', '📋', null], ['waiting', 'รอรับ', '🕒', ['NEW', 'ASSIGNED']], ['going_pickup', 'กำลังไปรับตู้', '🚚', ['ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED_PICKUP']],
    ['picked', 'รับตู้แล้ว', '📦', ['CONTAINER_PICKED_UP']], ['going_factory', 'กำลังไปโรงงาน', '🏭', ['GOING_TO_FACTORY']], ['arrived_factory', 'ถึงโรงงานแล้ว', '🏢', ['ARRIVED_FACTORY', 'LEAVING_FACTORY']],
    ['returning', 'กำลังคืนตู้', '↩️', ['GOING_TO_RETURN', 'ARRIVED_RETURN']], ['returned', 'คืนตู้แล้ว', '✅', ['CONTAINER_RETURNED']], ['completed', 'เสร็จแล้ว', '🏁', ['COMPLETED']], ['problem', 'มีปัญหา', '⚠️', ['PROBLEM']],
  ];
  const MAP_GROUPS = [['all', 'รถทั้งหมด', '#1E6FE8'], ['running', 'กำลังวิ่ง', '#1E9E5A'], ['pickup', 'รอรับตู้', '#F08A1E'], ['factory', 'ไปโรงงาน', '#1E6FE8'], ['return', 'กำลังคืนตู้', '#0F9D9A'], ['problem', 'มีปัญหา', '#D93B3B']];

  /* ---------- shell ---------- */
  function shell(app, r) {
    if (!$('#officeShell')) {
      app.innerHTML = `<div class="shell" id="officeShell"><aside class="sidebar" id="sb"><div class="logo"><span class="lg">NJ</span><div><div class="t1">TRANSPORT NJ</div><div class="t2 sb-user" id="sbUser">👤 ${h(T.session.username || T.session.full_name || '-')}</div><div class="t2 sb-role" id="sbRole">${h(T.session.role)}</div></div></div>
        <nav class="nav" id="nav"><div class="nav-main">${NAV.map(([p, ic, l]) => `<a href="#/${p}" data-nav="${p}"><span class="ic">${ic}</span>${l}</a>`).join('')}</div>
        <div class="foot">เวอร์ชัน ${h(T.C.APP_VERSION)}<br><span id="rtState">●</span> Realtime</div>
        <div class="nav-bottom">${T.session.role === 'SUPER_ADMIN' ? '<a href="#/settings" data-nav="settings"><span class="ic">👥</span>จัดการผู้ใช้</a>' : ''}<button type="button" class="bell" id="bell" title="งานมีปัญหา"><span class="ic">🔔</span>แจ้งเตือน<span class="n hidden" id="bellN"></span></button><button type="button" id="logoutBtn"><span class="ic">🚪</span>ออกจากระบบ</button></div></nav></aside>
        <nav class="m-nav" id="mNav"><a href="#/jobs/new" data-m="new"><span>🚚</span>เปิดงาน</a><a href="#/m-tl" data-m="tl"><span>🕒</span>Timeline</a><a href="#/m-gps" data-m="gps"><span>📍</span>GPS</a><a href="#/m-acc" data-m="acc"><span>📋</span>ข้อมูล</a></nav>
        <div class="main"><div class="m-head"><span class="m-logo">🚚</span><div><div class="m-ht">NJ TRANSPORT</div><div class="m-hs" id="mTitle"></div></div></div><header class="topbar"><button class="btn btn-icon" id="sbToggle">☰</button><div class="search"><span class="ic">🔍</span><input class="inp" id="gSearch" placeholder="ค้นหา B/L, BOOKING / ลูกค้า / เบอร์ตู้ / ทะเบียนรถ / คนขับ ..."></div></header>
        <main class="content" id="page"></main></div></div>`;
      $('#logoutBtn').onclick = () => T.logout();
      $('#sbToggle').onclick = () => { $('#sb').classList.toggle('open'); let m = $('.sb-mask'); if ($('#sb').classList.contains('open') && !m) { m = document.createElement('div'); m.className = 'sb-mask'; m.onclick = () => { $('#sb').classList.remove('open'); m.remove(); }; document.body.appendChild(m); } else if (m) m.remove(); };
      $('#nav').onclick = () => { $('#sb').classList.remove('open'); const m = $('.sb-mask'); if (m) m.remove(); };
      $('#gSearch').onkeydown = (e) => { if (e.key === 'Enter') T.go('jobs?q=' + encodeURIComponent(e.target.value.trim())); };
      $('#bell').onclick = () => T.go('jobs?status=PROBLEM');
      refreshBell();
      let wasNarrow = isNarrow(); window.addEventListener('resize', T.debounce(() => { if (isNarrow() !== wasNarrow && $('#officeShell')) { wasNarrow = isNarrow(); T.render(); } }, 250)); // หมุนจอ / ข้ามขนาด Mobile ↔ Desktop
      T.subscribe('tnj:office', (p, ev) => { if (ev === 'problem') { T.toast(`⚠ แจ้งปัญหา: ${p.type || ''}`, 'err', 8000); refreshBell(); } if (ev === 'version') T.checkVersion(true); });
    }
    $$('#nav a').forEach((a) => a.classList.toggle('active', r.path === a.dataset.nav || r.path.startsWith(a.dataset.nav + '/')));
    const mk = r.path === 'jobs/new' ? 'new' : r.path.startsWith('m-tl') ? 'tl' : r.path === 'm-gps' ? 'gps' : r.path === 'm-acc' ? 'acc' : '';
    $$('#mNav a').forEach((a) => a.classList.toggle('active', a.dataset.m === mk)); const mt = $('#mTitle'); if (mt) mt.textContent = { new: 'เปิดงานใหม่', tl: 'Timeline', gps: 'สถานะ GPS', acc: 'ข้อมูล' }[mk] || '';
    const rt = T._rt['tnj:office']; const rs = $('#rtState'); if (rs) rs.style.color = rt && rt.state === 'SUBSCRIBED' ? '#4ADE80' : '#F59E0B';
    return $('#page');
  }
  async function refreshBell() { try { const d = await T.auth('tnj_dashboard_counts', {}, { silent: true }); const n = $('#bellN'); if (!n) return; n.textContent = d.problem_open; n.classList.toggle('hidden', !d.problem_open); } catch (_) { } }

  T.pages.office = async (app, r) => {
    const page = shell(app, r); const p = r.seg[0] || 'dashboard';
    // keep office channel alive across pages (stopRealtime removed it) — resubscribe
    if (!T._rt['tnj:office']) T.subscribe('tnj:office', (p2, ev) => { if (ev === 'problem') { T.toast(`⚠ แจ้งปัญหา: ${p2.type || ''}`, 'err', 8000); refreshBell(); } if (ev === 'version') T.checkVersion(true); });
    if (isNarrow() && (r.path === '' || r.path === 'dashboard' || (r.path === 'jobs' && !Object.keys(r.q).length))) { location.replace('#/jobs/new'); return; } // Mobile: เริ่มที่ 🚚 เปิดงาน
    if (p.startsWith('m-') && !isNarrow()) { location.replace(p === 'm-tl' && r.seg[1] ? `#/jobs/${r.seg[1]}?tab=timeline` : p === 'm-gps' ? '#/map' : '#/jobs'); return; } // Desktop ไม่ใช้หน้า Mobile
    if (p === 'm-tl') return pageMTimeline(page, r.seg[1]);
    if (p === 'm-gps') return pageMGps(page);
    if (p === 'm-acc') return pageMAcc(page);
    if (p === 'dashboard') return pageDashboard(page, r);
    if (p === 'jobs' && r.seg[1] === 'new') return pageJobForm(page, null);
    if (p === 'jobs' && r.seg[1]) return pageJobDetail(page, r.seg[1], r.q.tab);
    if (p === 'jobs') return pageJobs(page, r);
    if (p === 'map') return pageMap(page);
    if (p === 'schedule') return pageSchedule(page, r);
    if (p === 'mileage') return pageFuel(page, r);
    if (p === 'reports') return pageJobReport(page, r); // 📈 รายงานงานขนส่ง (เฉพาะ JOB ที่ปิดงานแล้ว · ค้นหาใต้หัวตาราง)
    if (p === 'documents') return pageDocuments(page, r);
    if (p === 'masters') return pageMasters(page, r.seg[1] || 'customers');
    if (p === 'settings') return pageSettings(page);
    page.innerHTML = '<div class="empty">ไม่พบหน้า</div>';
  };

  /* ---------- Leaflet helpers ---------- */
  function mkMap(el, center) { const map = L.map(el, { zoomControl: true }).setView(center || [13.1, 100.9], 9); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map); return map; }
  const truckIcon = (grp, stale) => L.divIcon({ className: 'truck-marker', html: `<div class="tm ${stale ? 'stale' : grp}">🚚</div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] });
  const pinIcon = (color, emo) => L.divIcon({ className: 'truck-marker', html: `<div class="pin" style="background:${color}"><span>${emo}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] });
  function vehPopup(v) { return `<b>${h(v.license_plate || '-')}</b> ${h(v.vehicle_name || '')}<br>👤 ${h(v.driver_name || '-')}<br>📋 <a href="#/jobs/${v.job_id}">ดูงาน</a><br>🏢 ${h(v.customer_name)}<br>📦 ${h(v.container_no || '-')}<br>${T.badge(v.status)}<br><span class="${v.gps_stale ? 'gps-stale' : 'gps-ok'}">${h(v.last_gps_at ? T.ago(v.last_gps_at) : 'ไม่มี GPS')}</span>${v.speed != null && !v.gps_stale ? ` · ${Math.round(v.speed * 3.6)} กม./ชม.` : ''}<br><a href="#/jobs/${v.job_id}" class="btn btn-sm btn-p" style="margin-top:6px;color:#fff">เปิด Job Detail</a>`; }
  // live map component (dashboard + full map)
  function liveMap(container, opt = {}) {
    container.innerHTML = `<div class="card"><div class="card-h"><div class="flex"><h3>แผนที่ GPS</h3><span class="muted small" id="lmCount"></span></div><div class="flex flex-wrap" id="lmChips">${MAP_GROUPS.map(([k, l, c]) => `<button class="chip ${k === 'all' ? 'active' : ''}" data-g="${k}"><span class="dot" style="background:${c}"></span>${l}</button>`).join('')}</div></div><div class="map ${opt.tall ? 'tall' : ''}" id="lmMap"></div></div>`;
    const map = mkMap($('#lmMap', container)); const layer = L.layerGroup().addTo(map); let grp = 'all', data = [], fitted = false;
    const draw = () => {
      layer.clearLayers(); const rows = data.filter((v) => v.lat != null && (grp === 'all' || (grp === 'running' ? !v.gps_stale && v.status !== 'PROBLEM' : v.map_group === grp)));
      rows.forEach((v) => L.marker([v.lat, v.lng], { icon: truckIcon(v.map_group, v.gps_stale) }).bindPopup(vehPopup(v)).addTo(layer));
      $('#lmCount', container).textContent = `(รถที่มีงาน ${data.length} คัน · มีตำแหน่ง ${rows.length})`;
      if (!fitted && rows.length) { fitted = true; map.fitBounds(rows.map((v) => [v.lat, v.lng]), { padding: [30, 30], maxZoom: 13 }); }
    };
    $$('#lmChips .chip', container).forEach((b) => b.onclick = () => { grp = b.dataset.g; $$('#lmChips .chip', container).forEach((x) => x.classList.toggle('active', x === b)); draw(); });
    const load = async () => { try { const d = await T.auth('tnj_live_vehicles', {}, { silent: true }); data = d.vehicles; T.server.offsetMs = new Date(d.server_time).getTime() - Date.now(); draw(); } catch (e) { console.warn(e); } };
    load(); T.subscribe('tnj:gps', T.debounce(load, 1500)); T.subscribe('tnj:office', T.debounce(load, 1500)); T.every('livemap', 60000, load);
    return { map, reload: load };
  }

  /* ---------- jobs table (งานหัวลาก) ---------- */
  const isNarrow = () => window.innerWidth <= 768;
  const schedTxt = (j) => j.factory_date ? `${hlDMY(j.factory_date)}${j.factory_time ? ' ' + T.fmtT(j.factory_time) : ''}` : '-';
  const lastSt = (j) => j.tl_status ? `<span class="hl-st-tag">${h(j.tl_status)}</span>` : T.badge(j.status);
  const jbtn = (j) => `<button type="button" class="btn btn-sm btn-p" data-tlu="${j.id}">อัปเดต Timeline</button>${T.isAdmin() ? ` <button type="button" class="btn btn-sm btn-r" data-jdel="${j.id}">ลบ</button>` : ''}`;
  const jobCardHtml = (j) => `<div class="jobcard click" data-job="${j.id}"><div class="flex between"><span class="jn" style="font-size:17px">${h(T.jobRef(j))}</span><span class="xs muted">${hlDMY(j.job_date)}</span></div>
      <div class="jc-kv"><span>ลูกค้า</span><b>${h(j.customer_name)}</b><span>B/L</span><b>${h(j.bl_no)}</b><span>เบอร์ตู้</span><b>${h(j.container_no || '-')}</b><span>กำหนดส่ง</span><b>${schedTxt(j)}</b><span>คนขับ</span><b>${h(j.driver_name || '-')}</b><span>สถานะล่าสุด</span><b>${lastSt(j)}</b></div>
      <div class="jc-act">${jbtn(j)}</div></div>`;
  const jobRowHtml = (j) => `<tr class="click" data-job="${j.id}"><td class="nowrap">${hlDMY(j.job_date)}</td><td class="ell" style="max-width:200px">${h(j.customer_name)}</td><td class="ell" style="max-width:150px">${h(j.bl_no)}</td><td class="nowrap">${h(j.container_no || '-')}</td><td class="nowrap">${schedTxt(j)}</td><td class="ell" style="max-width:150px">${h(j.driver_name || '-')}</td><td class="ell" style="max-width:240px">${lastSt(j)}</td><td class="nowrap">${jbtn(j)}</td></tr>`;
  function jobsTable(rows, opt = {}) {
    if (!rows.length) return '<div class="empty">ไม่พบงาน</div>';
    if (isNarrow()) return `<div class="jc-list">${rows.map(jobCardHtml).join('')}</div>`;
    return `<div class="tbl-wrap"><table class="tbl jobs-tbl"><thead><tr><th>วันที่งาน</th><th>ลูกค้า</th><th>B/L</th><th>เบอร์ตู้</th><th>กำหนดส่ง</th><th>คนขับ</th><th>สถานะล่าสุด</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(jobRowHtml).join('')}</tbody></table></div>`;
  }
  function bindJobRows(root, onDone) {
    $$('[data-tlu]', root).forEach((b) => b.onclick = (e) => { e.stopPropagation(); hualakDialog(b.dataset.tlu, onDone); });
    $$('[data-jdel]', root).forEach((b) => b.onclick = async (e) => { e.stopPropagation(); let job; try { T.loading(true); job = await T.auth('tnj_job_get', { p_job_id: b.dataset.jdel }, { silent: true }); } catch (er) { return T.err(er); } finally { T.loading(false); } await jobDelete(job, onDone); });
    // คลิกแถว (คอม) / แตะรายการ (มือถือ/แท็บเล็ต) → หน้าต่างแก้ไข JOB ของรายการนั้น · ปุ่ม อัปเดต Timeline หยุด propagation ด้านบน · ผู้ไม่มีสิทธิ์แก้ไข → รายละเอียดเหมือนเดิม
    $$('[data-job]', root).forEach((el) => el.onclick = (e) => { if (e.target.closest('a,button,input,select,textarea,label')) return; if (!T.canEdit()) { T.go('jobs/' + el.dataset.job); return; } jobEditDialog(el.dataset.job, onDone); });
  }
  // หน้าต่างแก้ไข JOB — Reuse ฟอร์ม + เปิดงาน (pageJobForm) · UPDATE JOB เดิมเท่านั้น · 🗑️ ลบ = tnj_job_cancel เดิม (Soft: ยกเลิกงาน · ข้อมูลลูกอยู่ครบ)
  let jfmOpen = false;
  async function jobEditDialog(jobId, onDone, eo = {}) { // eo.mobile = เปิดจากหน้า Mobile Timeline (Desktop เรียกแบบเดิม ไม่ส่ง eo)
    if (jfmOpen) return; jfmOpen = true;
    let job; try { T.loading(true); job = await T.auth('tnj_job_get', { p_job_id: jobId }, { silent: true }); } catch (e) { jfmOpen = false; return T.err(e); } finally { T.loading(false); }
    const closed = ['COMPLETED', 'CANCELLED'].includes(job.status); let vvOff = () => { };
    const m = T.modal({ title: `แก้ไขงาน — ${T.jobRef(job)}`, size: 'w jf-modal', noMask: true,
      body: `<div class="jfm-top" ${eo.mobile ? 'hidden' : ''}><a href="#/jobs/${h(job.id)}" id="jfmDet" class="small">📋 เปิดรายละเอียด JOB (Timeline / เอกสาร / ไมล์ / GPS) ›</a></div>${closed ? `<div class="alert info">งาน${job.status === 'CANCELLED' ? 'ยกเลิก' : 'ปิด'}แล้ว — แก้ไข/ลบไม่ได้</div>` : ''}<div id="jfmRoot"><div class="empty">กำลังโหลด...</div></div>`,
      foot: `<button type="button" class="btn btn-lg" data-close id="jfmCancel">ยกเลิก</button>${closed ? '' : '<button type="submit" form="jobForm" class="btn btn-p btn-lg" id="jfSave">💾 บันทึกการแก้ไข</button>'}${T.isAdmin() && !eo.mobile ? '<button type="button" class="btn btn-r btn-lg" id="jfDel">🗑️ ลบ JOB</button>' : ''}`,
      onClose: () => { jfmOpen = false; vvOff(); } });
    $('#jfmDet', m.el).onclick = () => m.close();
    // มือถือ: Keyboard ไม่บังช่องที่กำลังกรอก / ปุ่มบันทึก (ปรับความสูงตาม visualViewport + เลื่อนช่องมากลางจอ)
    const vv = window.visualViewport; const fit = () => { if (!vv) return; if (isNarrow()) Object.assign(m.el.style, { top: vv.offsetTop + 'px', height: vv.height + 'px', bottom: 'auto' }); else Object.assign(m.el.style, { top: '', height: '', bottom: '' }); };
    if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); fit(); vvOff = () => { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); }; }
    m.el.addEventListener('focusin', (e) => { if (isNarrow() && e.target.matches('input,select,textarea')) setTimeout(() => { if (e.target.isConnected) e.target.scrollIntoView({ block: 'center' }); }, 300); });
    await pageJobForm($('#jfmRoot', m.el), job, { el: m.el, closed, mobile: !!eo.mobile, saved: () => { m.close(); T.toast('บันทึกการแก้ไขแล้ว', 'ok'); onDone && onDone(); } });
    const del = $('#jfDel', m.el); if (del) del.onclick = () => jobDelete(job, onDone, () => m.close());
    // Mobile: เลื่อนไปที่ตู้ที่เลือกอยู่ในหน้า Timeline (ตู้ 2+) — แก้เฉพาะแถวของตู้นั้น ไม่กระทบตู้อื่น
    if (eo.mobile && eo.ct && eo.ct.id) { const row = $(`#jfCts [data-ct-id="${eo.ct.id}"]`, m.el); if (row) { row.classList.add('jf-ct-focus'); setTimeout(() => { if (row.isConnected) row.scrollIntoView({ block: 'center' }); }, 50); } }
  }
  // ลบงานจริงออกจากระบบ (SUPER_ADMIN / ADMIN) — Confirm → ลบไฟล์แนบใน Storage ผ่าน Edge Function เดิม → tnj_job_delete (ลบ JOB + ข้อมูลลูก ด้วย job.id ใน Transaction เดียว)
  async function jobDelete(job, onDone, closeFn) {
    const files = (job.files || []); const cts = (job.containers || []).length; const tl = (job.timeline || []).filter((t) => t.event_type === 'STATUS').length;
    if (!(await T.confirm('🗑️ ลบงาน', `<b>ยืนยันลบงานนี้?</b><br><br>ลูกค้า: ${h(job.customer_name || '-')}<br>B/L, BOOKING: ${h(job.bl_no || '-')}<br>เบอร์ตู้: ${h(job.container_no || '-')}<br><br><span class="small muted">ลบออกจากระบบจริง พร้อมข้อมูลที่ผูกกับงานนี้ (ตู้ / Timeline${tl ? ' ' + tl + ' รายการ' : ''} / ไฟล์แนบ${files.length ? ' ' + files.length + ' ไฟล์' : ''} / GPS / ไมล์ / น้ำมัน / เบิกเงิน) — กู้คืนไม่ได้</span>`, 'ยืนยันลบ', 'btn-r'))) return false;
    try { T.loading(true);
      for (const f of files) await T.files.del(f.id);
      await T.auth('tnj_job_delete', { p_job_id: job.id }, { silent: true });
    } catch (e) { T.err(e); return false; } finally { T.loading(false); }
    if (closeFn) closeFn(); $$(`#jBody [data-job="${job.id}"]`).forEach((el) => el.remove()); T.toast('ลบงานแล้ว', 'ok'); onDone && onDone({ deleted: job.id }); return true;
  }

  /* ---------- Timeline งานหัวลาก (12 สถานะ OFFICE) + Free Time ---------- */
  const HL_STATUS = ['รถถึงโรงงานเรียบร้อย รอคิวลงสินค้า', 'รถถึงโรงงานเรียบร้อย รอคิวบรรจุ', 'รอคิวลงสินค้า', 'ลงสินค้าได้ครึ่งตู้', 'ลงสินค้าเรียบร้อย ออกจากโรงงาน', 'รอรับตู้เปล่า', 'รถรับตู้หนาแน่น', 'รถติดในท่าเรือ', 'รถติดในลานตู้', 'บรรจุตู้เรียบร้อย ออกจากโรงงาน', 'คืนตู้เรียบร้อย', 'ลูกค้าแจ้งตัดหาง', 'ค้างคืน', '⏱️ เกิน Free Time เริ่มคิดค่าเสียเวลา', '✅ ปิดงาน'];
  const HL_CLOSE = '✅ ปิดงาน';
  const HL_OTHER = '__other'; // “อื่นๆ / กรอกสถานะเอง” (OFFICE) → ส่ง p_status = 'CUSTOM:<ข้อความ>' (RUN-14)
  const FT_END = ['ลงสินค้าเรียบร้อย ออกจากโรงงาน', 'บรรจุตู้เรียบร้อย ออกจากโรงงาน'];
  const FT_HOURS = 4;
  // Asia/Bangkok (+07:00, no DST) — independent of the browser time zone
  const bkk = (v) => { const s = new Date(new Date(v).getTime() + 7 * 3600e3).toISOString(); return { date: s.slice(0, 10), time: s.slice(11, 16) }; };
  function hlDMY(v) { if (!v) return '-'; const [y, m, d] = String(v).slice(0, 10).split('-'); return (y && m && d) ? `${d}/${m}/${y}` : String(v); }
  // ---- 1 JOB หลายตู้: ตู้ 🔴 1 = ข้อมูลตู้ในตัว JOB เดิม (Timeline container_id ว่าง) · ตู้ 2+ = transport_job_containers (seq คงที่) ----
  const CT_COLORS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫'];
  const ctBadge = (no) => `${CT_COLORS[(Number(no) - 1) % CT_COLORS.length]} ${no}`; // Display เท่านั้น — อ้างอิงตู้ด้วย Container ID จริง
  function hlContainers(job) {
    const c1 = { key: 'c1', id: null, no: 1, container_no: job.container_no, seal_no: job.seal_no, pickup_location_text: job.pickup_location_text, factory_date: job.factory_date, factory_time: job.factory_time, driver_name: job.driver_name, license_plate: job.license_plate, trailer_plate: job.trailer_plate, driver_phone: job.driver_phone };
    return [c1].concat((job.containers || []).map((k) => ({ key: k.id, id: k.id, no: k.seq, container_no: k.container_no, seal_no: k.seal_no, pickup_location_text: k.pickup_location_text || job.pickup_location_text, factory_date: k.factory_date, factory_time: k.factory_time, driver_name: k.driver_name, license_plate: k.license_plate, trailer_plate: k.trailer_plate, driver_phone: k.driver_phone })));
  }
  const ctOf = (job, key) => { const cs = hlContainers(job); return cs.find((c) => c.key === key) || cs[0]; };
  // Timeline ของตู้ (ห้ามปนข้ามตู้) — ไม่ระบุตู้ = ตู้ 🔴 1
  const hlItems = (job, ct) => (job.timeline || []).filter((t) => t.event_type === 'STATUS' && (HL_STATUS.includes(t.title) || t.is_custom_status) && (t.container_id || null) === ((ct && ct.id) || null))
    .sort((a, b) => (new Date(a.event_at) - new Date(b.event_at)) || ((a.seq || 0) - (b.seq || 0)));
  const ctClosed = (job, ct) => hlItems(job, ct).some((t) => t.title === HL_CLOSE);
  // แนบข้อมูลตู้ 2+ เข้ากับ JOB (tnj_job_containers_get · Server ยังไม่มี RUN-12 = ตู้เดียวเหมือนเดิม)
  async function hlLoadContainers(job) {
    try { const d = await T.auth('tnj_job_containers_get', { p_job_id: job.id }, { silent: true }); job.containers = d.containers || []; const m = d.timeline_container || {}; const cu = new Set(d.timeline_custom || []); (job.timeline || []).forEach((t) => { t.container_id = m[t.id] || null; t.is_custom_status = cu.has(t.id); }); }
    catch (e) { if (!/PGRST202|Could not find the function/.test(String((e && e.message) || e))) throw e; job.containers = []; }
    return job;
  }
  T.hlLoadContainers = hlLoadContainers;
  function freeTime(job, ct) {
    ct = ct || ctOf(job, 'c1');
    const base = { hours: FT_HOURS, over_min: 0, end_id: null };
    if (!ct.factory_date || !ct.factory_time) return Object.assign(base, { state: 'nosched', text: `🆓 Free Time ${FT_HOURS} ชม. | ยังไม่ระบุกำหนดส่ง — ยังคำนวณไม่ได้` });
    const ends = hlItems(job, ct).filter((t) => FT_END.includes(t.title));
    if (!ends.length) return Object.assign(base, { state: 'wait', text: `🆓 Free Time ${FT_HOURS} ชม. | ไม่มีสถานะออกจากโรงงาน — คำนวณไม่ได้` });
    const end = ends[ends.length - 1]; // latest by real DateTime
    const start = Date.parse(`${String(ct.factory_date).slice(0, 10)}T${String(ct.factory_time).slice(0, 5)}:00+07:00`);
    const freeEnd = start + FT_HOURS * 3600e3, endAt = new Date(end.event_at).getTime();
    Object.assign(base, { end_id: end.id, end_title: end.title, end_at: end.event_at, free_end: new Date(freeEnd).toISOString() });
    const until = `ถึง ${bkk(freeEnd).time} น.`;
    if (endAt <= freeEnd) return Object.assign(base, { state: 'ok', text: `🆓 Free Time ${FT_HOURS} ชม. ${until} | ไม่เกินเวลา — ไม่มีค่าใช้จ่าย` });
    const m = Math.floor((endAt - freeEnd) / 60000);
    return Object.assign(base, { state: 'over', over_min: m, text: `🆓 Free Time ${FT_HOURS} ชม. ${until} | เกิน ${Math.floor(m / 60)} ชม. ${m % 60} นาที — มีค่าใช้จ่าย` });
  }
  T.freeTime = freeTime;
  // ---- ข้อมูลตู้ (ระดับ JOB: ลูกค้า / B/L / ท่านำเข้า / คืนตู้เปล่า · รายตู้: ตู้ / ซีล / กำหนดส่ง / คนขับ / หัว-หาง / เบอร์โทร) ----
  const hlLines = (job, ct) => { ct = ct || ctOf(job, 'c1'); return [
    `ลูกค้า: ${job.customer_name || '-'}`, `B/L: ${job.bl_no || '-'}`, `ท่านำเข้า: ${ct.pickup_location_text || '-'} | คืนตู้เปล่า: ${job.return_location_text || '-'}`,
    `เบอร์ตู้: ${ct.container_no || '-'} | เบอร์ซีล: ${ct.seal_no || '-'}`, `กำหนดส่ง: ${hlDMY(ct.factory_date)} | ${ct.factory_time ? T.fmtT(ct.factory_time) + ' น.' : '-'}`, '',
    `👤 คนขับ: ${ct.driver_name || '-'}`, `🚛 หัว/หาง: ${ct.license_plate || '-'} / ${ct.trailer_plate || '-'}`, `📞 เบอร์โทร: ${ct.driver_phone || '-'}`]; };
  function hlHeader(job, ct) { return `<div class="hl-hd">${hlLines(job, ct).map((l) => l ? `<div>${h(l)}</div>` : '<div class="hl-gap"></div>').join('')}</div>`; }
  const hlItemText = (t) => `• ⏰ ${bkk(t.event_at).time} น. ${t.title}`;
  const fIcon = (f) => /image/.test(f.mime_type || '') || /\.(jpe?g|png)$/i.test(f.file_name || '') ? '🖼' : '📄';
  // Timeline ของตู้ในระบบ (ครบทุกรายการ): เลข/สีตู้ → หัวข้องาน → ข้อมูล → Timeline (แยกวันที่) → Free Time (เฉพาะตู้ที่ปิดงานแล้ว)
  function hualakTimelineHtml(job, opt = {}) {
    if (!opt.ct && hlContainers(job).length > 1) return hlContainers(job).map((c) => hualakTimelineHtml(job, Object.assign({}, opt, { ct: c }))).join('');
    const ct = opt.ct || ctOf(job, 'c1'); const items = hlItems(job, ct); let out = '', lastDate = null;
    if (opt.header) out += `<div class="hl-ct" data-ctno="${ct.no}">${ctBadge(ct.no)}</div><div class="hl-title">🚛 อัปเดตสถานะงานหัวลาก</div>${hlHeader(job, ct)}`;
    items.forEach((t) => {
      const b = bkk(t.event_at);
      if (b.date !== lastDate) { out += `<div class="hl-date">📅 วันที่ ${hlDMY(b.date)}</div>`; lastDate = b.date; }
      const files = t.files || [];
      out += `<div class="hl-entry" data-hl="${t.id}"><div class="hl-it${opt.actions ? ' hl-ie' : ''}"${opt.actions ? ` data-hie="${t.id}" title="คลิกเพื่อแก้เวลา / ข้อความ"` : ''}>${h(hlItemText(t))}</div>${t.note ? `<div class="hl-note">หมายเหตุ: ${h(t.note)}</div>` : ''}
        ${files.length ? `<div class="hl-files"><div class="hl-fh">📎 ไฟล์แนบ</div>${files.map((f) => `<div class="hl-file" data-fid="${f.id}"><span class="hl-fn">${fIcon(f)} ${h(f.file_name)}</span><button type="button" class="btn btn-sm" data-hdl="${f.id}">⬇ ดาวน์โหลด</button></div>`).join('')}</div>` : ''}
        ${opt.actions ? `<div class="hl-acts"><button type="button" class="btn btn-sm btn-r" data-hdel="${t.id}">ลบ</button><button type="button" class="btn btn-sm" data-hat="${t.id}">📎 แนบไฟล์</button></div>` : ''}</div>`;
    });
    if (!items.length) out += '<div class="empty small">ยังไม่มีการอัปเดตสถานะ</div>';
    if (ctClosed(job, ct)) { const ft = freeTime(job, ct); out += `<div class="hl-ft ${ft.state}" data-ft="${ft.state}">${h(ft.text)}</div>`; } // ก่อนปิดงาน: ไม่แสดง Free Time / ไม่เว้นพื้นที่
    if (opt.copy) out += hlContainers(job).length > 1 ? '<div class="hl-copy"><button type="button" class="btn btn-navy" data-hcopy>📋 COPY ตู้นี้</button><button type="button" class="btn btn-navy" data-hcopyall>📋 COPY รวมทุกตู้</button></div>' : '<div class="hl-copy"><button type="button" class="btn btn-navy" data-hcopy>📋 COPY TIMELINE</button></div>';
    return `<div class="hl-tl" data-ct="${ct.key}">${out}</div>`;
  }
  // ข้อความ COPY ลง LINE: เฉพาะตู้ที่เลือก · ไม่มี JOB · Timeline 3 รายการล่าสุด (เก่า → ใหม่ · แยกวันที่จริง) · Free Time เฉพาะตู้ที่ปิดงานแล้ว
  function hualakCopyText(job, ct) {
    ct = ct || ctOf(job, 'c1');
    const L = [ctBadge(ct.no), '', '🚛 อัปเดตสถานะงานหัวลาก', '', ...hlLines(job, ct)]; let lastDate = null;
    const all = hlItems(job, ct); const last3 = all.slice(Math.max(0, all.length - 3));
    last3.forEach((t) => {
      const b = bkk(t.event_at);
      if (b.date !== lastDate) { L.push(''); L.push(`📅 วันที่ ${hlDMY(b.date)}`); lastDate = b.date; }
      L.push(hlItemText(t)); if (t.note) L.push(`   หมายเหตุ: ${t.note}`);
    });
    if (ctClosed(job, ct)) L.push('', freeTime(job, ct).text);
    return L.join('\n');
  }
  // COPY รวมทุกตู้: หัวครั้งเดียว (X ตู้) + ทุกตู้เรียงตาม Container Sequence 1 → N · ข้อมูลตู้ + คนขับของตู้นั้นก่อนเสมอ · Timeline ล่าสุดไม่เกิน 3 (ไม่มี = จบที่ข้อมูลตู้ ไม่สร้างสถานะปลอม)
  function hualakCopyAll(job) {
    const cs = hlContainers(job).slice().sort((a, b) => a.no - b.no);
    const blocks = cs.map((ct) => { const B = [ctBadge(ct.no), `ลูกค้า: ${job.customer_name || '-'}`, `B/L: ${job.bl_no || '-'}`, `เบอร์ตู้: ${ct.container_no || '-'} | เบอร์ซีล: ${ct.seal_no || '-'}`, `กำหนดส่ง: ${hlDMY(ct.factory_date)} | ${ct.factory_time ? T.fmtT(ct.factory_time) + ' น.' : '-'}`,
        '', `👤 คนขับ: ${ct.driver_name || '-'}`, `🚛 หัว/หาง: ${ct.license_plate || '-'} / ${ct.trailer_plate || '-'}`, `📞 เบอร์โทร: ${ct.driver_phone || '-'}`];
      const all = hlItems(job, ct); let lastDate = null; all.slice(Math.max(0, all.length - 3)).forEach((t) => { const b = bkk(t.event_at); if (b.date !== lastDate) { B.push('', `📅 วันที่ ${hlDMY(b.date)}`); lastDate = b.date; } B.push(hlItemText(t)); });
      return B.join('\n'); });
    return [`🚛 อัปเดตสถานะงานหัวลาก ${cs.length} ตู้`, '', blocks.join('\n\n\n')].join('\n');
  }
  T.hualakCopyAll = hualakCopyAll;
  T.hualakCopyText = hualakCopyText;
  async function copyText(txt) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); return true; } } catch (_) { }
    const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) { ok = false; } ta.remove(); return ok;
  }
  const HL_ACCEPT = '.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx';
  const stSel = (id, sel, excl = [], other = false) => `<select class="inp" id="${id}"><option value="">— เลือกสถานะ —</option>${HL_STATUS.map((s, i) => excl.includes(s) ? '' : `<option value="${h(s)}" ${s === sel ? 'selected' : ''}>${i + 1}. ${h(s)}</option>`).join('')}${other ? `<option value="${HL_OTHER}" ${sel && !HL_STATUS.includes(sel) ? 'selected' : ''}>✏️ อื่นๆ / กรอกสถานะเอง</option>` : ''}</select>`;
  // ช่อง “กรอกสถานะเอง” แสดงเฉพาะเมื่อเลือก อื่นๆ · คืนค่าสถานะที่จะส่ง Server (null = ยังไม่กรอก)
  const stOther = (box, selId, inId) => { const s = $('#' + selId, box), f = $('#' + inId, box); if (!s || !f) return; const on = () => { const o = s.value === HL_OTHER; f.closest('.field').hidden = !o; const fm = s.closest('.hl-form'); if (fm) fm.classList.toggle('hl-other', o); }; s.addEventListener('change', on); on(); };
  const stValue = (box, selId, inId) => { const v = $('#' + selId, box).value; if (v !== HL_OTHER) return v; const c = ($('#' + inId, box).value || '').trim(); return c ? 'CUSTOM:' + c : null; };
  async function hualakDialog(jobId, onDone) {
    let job; try { job = await hlLoadContainers(await T.auth('tnj_job_get', { p_job_id: jobId }, { silent: true })); } catch (e) { return T.err(e); }
    T.modal({ title: `อัปเดต Timeline — ${T.jobRef(job)}`, size: 'w hl-modal', noMask: true, body: '<div id="hlRoot"></div>', foot: '<div id="hlFoot" class="hl-foot"></div><button class="btn btn-lg" data-close>ปิด</button>',
      onOpen: (el) => hualakMount($('#hlRoot', el), job, onDone, { foot: $('#hlFoot', el) }) });
  }
  // Timeline งานหัวลาก — ใช้ร่วม Desktop (Modal) / Mobile Office / Mobile DRIVER: mo.mobile = หัว JOB แบบ Card + แนบไฟล์ตอนบันทึก · mo.driver = คนขับ (เพิ่มสถานะ JOB ตัวเอง, ไม่แก้/ลบ, ไม่ปิดงาน)
  function hualakMount(root, job, onDone, mo = {}) {
    const office = T.canEdit(); let pending = []; let sel = null; // sel = ตู้ที่เลือก (Container key: 'c1' = ตู้ 🔴 1 / Container ID)
    {
      {
        const refresh = async (j2) => { job = await hlLoadContainers(j2 || await T.auth('tnj_job_get', { p_job_id: job.id }, { silent: true })); render(); onDone && onDone(); };
        const render = () => {
          const keep = {}; ['hlD', 'hlT', 'hlS', 'hlSC', 'hlN'].forEach((k) => { const i = $('#' + k, root); if (i) keep[k] = i.value; });
          const cs = hlContainers(job); if (!sel || !cs.some((c) => c.key === sel)) sel = (cs.find((c) => !ctClosed(job, c)) || cs[0]).key; const ct = ctOf(job, sel); const isClosed = ctClosed(job, ct);
          const canAdd = !isClosed && (mo.driver ? !['NEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'].includes(job.status) : office && !['COMPLETED', 'CANCELLED'].includes(job.status)); const canRow = !mo.driver && office && job.status !== 'CANCELLED'; const now = bkk(Date.now() + (T.server.offsetMs || 0));
          const ctSel = `<div class="hl-csel"><div class="field"><label>เลือกตู้</label><select class="inp" id="hlC">${cs.map((c) => `<option value="${h(c.key)}" ${c.key === sel ? 'selected' : ''}>${ctBadge(c.no)} | ${h(c.container_no || '-')}${ctClosed(job, c) ? ' (ปิดงานแล้ว)' : ''}</option>`).join('')}</select></div></div>`;
          root.innerHTML = `${ctSel}${mo.mobile ? hlMobileCard(job, ct) : ''}${canAdd ? `<div class="hl-form"><div class="field"><label>วันที่ <span class="req">*</span></label><input type="date" class="inp" id="hlD" value="${now.date}"></div><div class="field"><label>เวลา <span class="req">*</span></label><input type="time" class="inp" id="hlT" value="${now.time}"></div>
              <div class="field hl-fs"><label>สถานะ <span class="req">*</span></label>${stSel('hlS', '', mo.driver ? [HL_CLOSE] : [], !mo.driver)}</div><div class="field hl-fc" hidden><label>กรอกสถานะเอง <span class="req">*</span></label><input class="inp" id="hlSC" maxlength="100" placeholder="พิมพ์สถานะที่ต้องการ"></div>
              ${mo.mobile ? '<div class="field hl-fn"><label>หมายเหตุ (ไม่บังคับ)</label><textarea class="inp" id="hlN" maxlength="500" rows="2"></textarea></div>' : ''}${mo.mobile ? `<div class="field hl-fn"><label>📎 แนบไฟล์ / รูปภาพ (เลือกได้หลายไฟล์)</label><div class="m-att"><label class="btn">📷 ถ่ายรูป<input type="file" id="hlCam" accept="image/*" capture="environment" hidden></label><label class="btn">📎 เลือกไฟล์<input type="file" id="hlFiles" multiple accept="${HL_ACCEPT}" hidden></label></div><div class="m-pick" id="hlPick">${pending.map((f) => `<span>📎 ${h(f.name)}</span>`).join('')}</div></div>` : ''}${mo.foot ? '' : `<div class="hl-fb"><button type="button" class="btn btn-p btn-lg" id="hlGo">${mo.mobile ? '💾 บันทึก TIMELINE' : 'บันทึก Timeline'}</button></div>`}</div>`
            : `<div class="alert info" id="hlInfo">${isClosed && job.status !== 'COMPLETED' && job.status !== 'CANCELLED' ? `ตู้ ${ctBadge(ct.no)} ปิดงานแล้ว — ดู Timeline / แก้ไข / ลบ / แนบไฟล์ ได้ · ตู้อื่นยังอัปเดตต่อได้` : mo.driver && ['NEW', 'ASSIGNED'].includes(job.status) ? 'กด ✅ รับทราบงาน ก่อน จึงอัปเดตสถานะได้' : job.status === 'CANCELLED' ? 'งานถูกยกเลิกแล้ว — ดูได้อย่างเดียว' : job.status === 'COMPLETED' ? 'งานปิดแล้ว — เพิ่มสถานะใหม่ไม่ได้ (แก้ไข / ลบ / แนบไฟล์ ของรายการเดิมได้)' : 'สิทธิ์ดูอย่างเดียว'}</div>`}
            <div id="hlTl">${hualakTimelineHtml(job, { ct, header: !mo.mobile, actions: canRow, copy: true })}</div>`;
          Object.keys(keep).forEach((k) => { const i = $('#' + k, root); if (i && keep[k] !== undefined) i.value = keep[k]; });
          // Desktop Modal: ปุ่ม บันทึก Timeline อยู่ Footer ซ้ายสุด (ปิด ขวาสุด) — แสดงเฉพาะเมื่อเพิ่มสถานะได้
          if (mo.foot) mo.foot.innerHTML = canAdd ? '<button type="button" class="btn btn-p btn-lg" id="hlGo">💾 บันทึก Timeline</button>' : '';
          stOther(root, 'hlS', 'hlSC');
          if (mo.mobile) { const ft = $('#hlTl .hl-ft', root); if (ft) ft.innerHTML = h(ft.textContent).split(' | ').join('<br>'); }
          bind();
        };
        const bind = () => {
          const go = $('#hlGo', mo.foot || root); const ct = ctOf(job, sel);
          const cSel = $('#hlC', root); if (cSel) cSel.onchange = () => { sel = cSel.value; render(); };
          // Mobile: ✏️ แก้ไขข้อมูลงาน → ฟอร์มแก้ไข JOB เดิม (jobEditDialog) · บันทึกแล้วโหลด JOB + ตู้ใหม่ทันที (ตู้ที่เลือกคงเดิม)
          const je = mo.mobile && $('#mJobEdit', root); if (je) je.onclick = () => jobEditDialog(job.id, () => refresh(), { mobile: true, ct });
          if (mo.mobile) ['hlCam', 'hlFiles'].forEach((id) => { const inp = $('#' + id, root); if (!inp) return; inp.onchange = () => { const got = Array.from(inp.files || []); const bad = got.filter((f) => !/\.(pdf|jpe?g|png|xlsx?|docx?)$/i.test(f.name)); if (bad.length) T.toast('รองรับเฉพาะ PDF JPG JPEG PNG XLS XLSX DOC DOCX', 'warn'); pending = pending.concat(got.filter((f) => !bad.includes(f))); inp.value = ''; $('#hlPick', root).innerHTML = pending.map((f) => `<span>📎 ${h(f.name)}</span>`).join(''); }; });
          if (go) go.onclick = async () => {
            const d = $('#hlD', root).value, t = $('#hlT', root).value, s = stValue(root, 'hlS', 'hlSC'), nEl = $('#hlN', root), n = nEl ? nEl.value.trim() : '';
            if (!d || !t) return T.toast('กรุณาระบุวันที่และเวลา', 'warn'); if (!$('#hlS', root).value) return T.toast('กรุณาเลือกสถานะ', 'warn'); if (!s) { const f = $('#hlSC', root); if (f) f.focus(); return T.toast('กรุณากรอกสถานะ', 'warn'); }
            const multi = hlContainers(job).length > 1;
            if (s === HL_CLOSE && !(await T.confirm('ปิดงาน', `ยืนยัน <b>✅ ปิดงาน</b> ${multi ? `เฉพาะตู้ <b>${ctBadge(ct.no)} | ${h(ct.container_no || '-')}</b> (${h(T.jobRef(job))})` : h(T.jobRef(job))} ?<br><span class="small muted">ระบบจะบันทึกผู้ปิดงานและวันเวลาใน Audit${multi ? ' · JOB จะปิดเมื่อทุกตู้ปิดงานครบ' : ''}</span>`, 'ปิดงาน', 'btn-navy'))) return;
            go.disabled = true;
            try { T.loading(true); const at = `${d}T${t}:00+07:00`;
              const r = ct.id ? await T.auth('tnj_container_status', { p_job_id: job.id, p_container_id: ct.id, p_event_at: at, p_status: s, p_note: n || null }, { silent: true }) : await T.auth('tnj_timeline_status', { p_job_id: job.id, p_event_at: at, p_status: s, p_note: n || null }, { silent: true });
              if (mo.mobile && pending.length) { const files = pending; pending = []; for (const f of files) await T.files.upload(job.id, await T.files.shrink(f), 'อื่น ๆ', r.timeline_id, null); }
              T.toast(s === HL_CLOSE ? (multi ? `ปิดงานตู้ ${ctBadge(ct.no)} แล้ว${r.job && r.job.status === 'COMPLETED' ? ' · ทุกตู้ปิดครบ — ปิด JOB แล้ว' : ''}` : 'ปิดงานแล้ว') : 'บันทึก Timeline แล้ว', 'ok'); $('#hlS', root).value = ''; $('#hlSC', root).value = ''; if (nEl) nEl.value = ''; await refresh(mo.mobile ? null : r.job);
            } catch (e) { T.err(e); } finally { T.loading(false); if (go.isConnected) go.disabled = false; }
          };
          $$('[data-hdl]', root).forEach((b) => b.onclick = () => { const f = job.files.find((x) => x.id === b.dataset.hdl); if (f) T.files.download(f); });
          const cp = $('[data-hcopy]', root); if (cp) cp.onclick = async () => { if (await copyText(hualakCopyText(job, ctOf(job, sel)))) T.toast('คัดลอก Timeline แล้ว ✓', 'ok'); else T.toast('คัดลอกไม่สำเร็จ', 'err'); };
          const ca = $('[data-hcopyall]', root); if (ca) ca.onclick = async () => { if (await copyText(hualakCopyAll(job))) T.toast(`คัดลอกรวม ${hlContainers(job).length} ตู้แล้ว ✓`, 'ok'); else T.toast('คัดลอกไม่สำเร็จ', 'err'); };
          // แก้ไข Timeline แบบ Inline: คลิกเวลา / ข้อความ → [เวลา] [ข้อความ] [บันทึก] [ยกเลิก] · Enter = บันทึก · Esc = ยกเลิก · ใช้ tnj_timeline_status_edit เดิม (วันที่ / หมายเหตุเดิมคงไว้)
          $$('[data-hie]', root).forEach((el) => el.onclick = () => {
            if (el.querySelector('input')) return; const t = job.timeline.find((x) => x.id === el.dataset.hie); if (!t) return; const bt = bkk(t.event_at);
            el.innerHTML = `<div class="hl-ied"><input type="time" class="inp hl-iet" aria-label="เวลา" value="${bt.time}"><input class="inp hl-iex" maxlength="100" aria-label="ข้อความสถานะ" value="${h(t.title)}"><button type="button" class="btn btn-sm btn-p" data-ies>บันทึก</button><button type="button" class="btn btn-sm" data-iec>ยกเลิก</button></div>`;
            const ti = $('.hl-iet', el), tx = $('.hl-iex', el); tx.focus();
            const cancel = () => render();
            const save = async () => { const tm = ti.value.trim(), s0 = tx.value.trim();
              if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(tm)) { T.toast('กรุณาระบุเวลา HH:mm ให้ถูกต้อง', 'warn'); return ti.focus(); }
              if (!s0) { T.toast('กรุณากรอกข้อความสถานะ', 'warn'); return tx.focus(); }
              if (tm === bt.time && s0 === t.title) return cancel();
              if (s0 === HL_CLOSE && t.title !== HL_CLOSE && !(await T.confirm('ปิดงาน', `ยืนยัน <b>✅ ปิดงาน</b> ${h(T.jobRef(job))} ?`, 'ปิดงาน', 'btn-navy'))) return;
              try { T.loading(true); const r = await T.auth('tnj_timeline_status_edit', { p_timeline_id: t.id, p_event_at: `${bt.date}T${tm}:00+07:00`, p_status: HL_STATUS.includes(s0) ? s0 : 'CUSTOM:' + s0, p_note: t.note || null }, { silent: true }); T.toast('แก้ไข Timeline แล้ว', 'ok'); await refresh(r.job); } catch (e) { T.err(e); } finally { T.loading(false); } };
            $('[data-ies]', el).onclick = (e) => { e.stopPropagation(); save(); }; $('[data-iec]', el).onclick = (e) => { e.stopPropagation(); cancel(); };
            el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); } });
          });
          $$('[data-hdel]', root).forEach((b) => b.onclick = async () => {
            if (!(await T.confirm('ลบ Timeline', 'ยืนยันลบ Timeline รายการนี้?', 'ยืนยันลบ', 'btn-r'))) return;
            try { T.loading(true); const r = await T.auth('tnj_timeline_status_delete', { p_timeline_id: b.dataset.hdel }, { silent: true }); T.toast('ลบ Timeline แล้ว', 'ok'); await refresh(r.job); } catch (e) { T.err(e); } finally { T.loading(false); }
          });
          $$('[data-hat]', root).forEach((b) => b.onclick = () => {
            const tid = b.dataset.hat;
            T.modal({ title: '📎 แนบไฟล์ (เลือกได้หลายไฟล์)', size: 's', body: `<div class="field"><label>ไฟล์ (PDF / JPG / JPEG / PNG / Excel / Word)</label><input type="file" class="inp" id="haF" multiple accept="${HL_ACCEPT}"></div><div class="field"><label>ประเภทเอกสาร</label><select class="inp" id="haT">${T.FILE_TYPES.map((x) => `<option ${x === 'อื่น ๆ' ? 'selected' : ''}>${h(x)}</option>`).join('')}</select></div>`,
              foot: '<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="haGo">อัปโหลด</button>',
              onOpen: (m, close) => { $('#haGo', m).onclick = async () => {
                const files = Array.from($('#haF', m).files || []); if (!files.length) return T.toast('กรุณาเลือกไฟล์', 'warn');
                const bad = files.filter((f) => !/\.(pdf|jpe?g|png|xlsx?|docx?)$/i.test(f.name)); if (bad.length) return T.toast('รองรับเฉพาะ PDF JPG JPEG PNG XLS XLSX DOC DOCX', 'warn');
                const ft = $('#haT', m).value; let n = 0;
                try { T.loading(true); for (const f of files) { await T.files.upload(job.id, await T.files.shrink(f), ft, tid, null); n++; } close(); T.toast(`แนบไฟล์แล้ว ${n} ไฟล์`, 'ok'); } catch (e) { T.err(e); } finally { T.loading(false); if (n) await refresh(); } }; } });
          });
        };
        if (job.containers) render(); else { root.innerHTML = '<div class="empty">กำลังโหลด...</div>'; hlLoadContainers(job).then(render).catch((e) => { T.err(e); job.containers = []; render(); }); }
      }
    }
  }
  T.hualakMount = hualakMount;

  /* ---------- MOBILE OFFICE (≤768px) — Bottom Navigation: เปิดงาน / Timeline / GPS / ข้อมูล (Desktop ไม่ใช้ส่วนนี้) ---------- */
  const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  function hlMobileCard(job, ct) {
    const kv = (k, v) => `<div class="m-kv"><span>${k}</span><b>${v}</b></div>`; ct = ct || ctOf(job, 'c1'); const its = hlItems(job, ct); const lastSt = its.length ? its[its.length - 1].title : (ct.id ? '-' : (job.tl_status || job.status_th || T.ST_TH[job.status] || '-'));
    job = Object.assign({}, job, { container_no: ct.container_no, seal_no: ct.seal_no, pickup_location_text: ct.pickup_location_text, factory_date: ct.factory_date, factory_time: ct.factory_time, driver_name: ct.driver_name, license_plate: ct.license_plate, trailer_plate: ct.trailer_plate, driver_phone: ct.driver_phone });
    return `<div class="m-card m-jobcard"><div class="m-jc-h"><b>🚛 ${h(T.jobRef(job))}</b> <span class="hl-ct-tag">${ctBadge(ct.no)}</span></div><div class="m-jc-st">สถานะล่าสุด: <span class="hl-st-tag">${h(lastSt)}</span></div>
      <div class="m-kvs">${kv('ลูกค้า', h(job.customer_name || '-'))}${kv('B/L', h(job.bl_no || '-'))}${kv('ท่านำเข้า', h(job.pickup_location_text || '-'))}${kv('คืนตู้เปล่า', h(job.return_location_text || '-'))}</div>
      <div class="m-kvs">${kv('เบอร์ตู้', h(job.container_no || '-'))}${kv('เบอร์ซีล', h(job.seal_no || '-'))}${kv('กำหนดส่ง', job.factory_date ? `${hlDMY(job.factory_date)}${job.factory_time ? ' ' + T.fmtT(job.factory_time) : ''}` : '-')}</div>
      <div class="m-kvs">${kv('คนขับ', h(job.driver_name || '-'))}${kv('หัว/หาง', `${h(job.license_plate || '-')} / ${h(job.trailer_plate || '-')}`)}${kv('เบอร์โทร', job.driver_phone ? `<a class="m-tel" href="${telHref(job.driver_phone)}">📞 ${h(job.driver_phone)}</a>` : '-')}</div>${T.canEdit() && !['COMPLETED', 'CANCELLED'].includes(job.status) ? '<div class="m-jc-edit"><button type="button" class="btn" id="mJobEdit">✏️ แก้ไขข้อมูลงาน</button></div>' : ''}</div>`;
  }
  // 🕒 Timeline: A) ค้นหา JOB  B) เปิด JOB (ใช้ hualakMount เดิม)
  async function pageMTimeline(page, id) {
    if (id) {
      page.innerHTML = `<div class="m-page"><a class="m-back" href="#/m-tl">‹ ค้นหา JOB</a><div id="mtRoot"><div class="empty">กำลังโหลด...</div></div></div>`;
      let job; try { job = await T.auth('tnj_job_get', { p_job_id: id }, { silent: true }); } catch (e) { $('#mtRoot').innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
      if (!$('#mtRoot')) return; hualakMount($('#mtRoot'), job, null, { mobile: true }); return;
    }
    page.innerHTML = `<div class="m-page"><div class="m-search"><input class="inp" id="mtQ" placeholder="🔍 ค้นหา JOB / B/L / เบอร์ตู้ / ลูกค้า / คนขับ" autocomplete="off"></div><div id="mtList"><div class="empty">กำลังโหลด...</div></div></div>`;
    let all = [];
    const draw = () => {
      const box = $('#mtList'); if (!box) return; const q = $('#mtQ').value.trim().toLowerCase();
      const rows = all.filter((j) => j.status !== 'CANCELLED').filter((j) => !q || [j.bl_no, j.container_no, j.customer_name, j.driver_name, j.license_plate].some((v) => String(v || '').toLowerCase().includes(q)));
      box.innerHTML = rows.length ? rows.map((j) => `<a class="m-card m-jobitem" href="#/m-tl/${j.id}" data-mt="${j.id}"><div class="flex between"><b class="m-jn">${h(T.jobRef(j))}</b><span class="m-chev">›</span></div><div class="b">${h(j.customer_name || '-')}</div>
        <div class="small">B/L: ${h(j.bl_no || '-')} · เบอร์ตู้: ${h(j.container_no || '-')}</div><div class="small">คนขับ: ${h(j.driver_name || '-')}</div><div class="small">สถานะล่าสุด: <span class="hl-st-tag">${h(j.tl_status || j.status_th || '-')}</span></div></a>`).join('') : '<div class="empty">ไม่พบ JOB</div>';
    };
    $('#mtQ').addEventListener('input', T.debounce(draw, 120));
    try { let rows = [], pg = 1, total = 0; do { const d = await T.auth('tnj_job_list', { p: { page: pg, page_size: 500 } }, { silent: true }); rows = rows.concat(d.rows); total = d.total; pg++; } while (rows.length < total && pg < 200); all = rows; draw(); } catch (e) { T.err(e); }
  }
  // 📍 GPS: ข้อมูลเดิม tnj_live_vehicles + Master รถ (ไม่สร้างตำแหน่งเอง)
  async function pageMGps(page) {
    await loadMasters(); // ดูอย่างเดียว: ใช้ Cache 60 วิ (หน้าจัดการข้อมูล/ฟอร์ม ยังโหลดใหม่ทุกครั้ง)
    page.innerHTML = `<div class="m-page"><div class="m-search"><input class="inp" id="mgQ" placeholder="🔍 ค้นหาทะเบียน / คนขับ" autocomplete="off"></div><div class="map m-map" id="mgMap"></div>
      <div class="m-sum" id="mgSum"></div><div class="flex between m-sec"><b>🚛 รถทั้งหมด</b><button type="button" class="btn btn-sm" id="mgRef">🔄 รีเฟรช</button></div><div id="mgList"></div></div>`;
    const map = mkMap($('#mgMap')); const layer = L.layerGroup().addTo(map); const mk = {}; let rows = [], fitted = false;
    const ST = { on: ['🟢', 'Online', 'green'], park: ['🟠', 'จอด', 'amber'], off: ['⚪', 'Offline', 'gray'] };
    const stOf = (lv) => { if (!lv || lv.lat == null || lv.gps_stale) return 'off'; return (Number(lv.speed || 0) * 3.6) >= 1 ? 'on' : 'park'; };
    const draw = () => {
      if (!$('#mgList')) return; const q = $('#mgQ').value.trim().toLowerCase();
      const vis = rows.filter((x) => !q || [x.plate, x.driver].some((v) => String(v || '').toLowerCase().includes(q)));
      const cnt = { on: 0, park: 0, off: 0 }; vis.forEach((x) => { cnt[x.st]++; });
      $('#mgSum').innerHTML = `<span class="m-chip all">ทั้งหมด ${vis.length}</span><span class="m-chip on">Online ${cnt.on}</span><span class="m-chip park">จอด ${cnt.park}</span><span class="m-chip off">Offline ${cnt.off}</span>`;
      $('#mgList').innerHTML = vis.map((x) => { const [ic, lb, cl] = ST[x.st]; const lv = x.live;
        return `<div class="m-card m-veh" data-plate="${h(x.plate)}"><div class="flex between"><b class="m-jn">🚛 ${h(x.plate)}</b><span class="badge ${cl}">${ic} ${lb}</span></div><div class="small">${h(x.driver || '-')}</div>
          ${x.st === 'off' && !(lv && lv.lat != null) ? '<div class="small muted">ไม่มีข้อมูล GPS ล่าสุด</div>' : `<div class="small">ความเร็ว: ${Math.round(Number(lv.speed || 0) * 3.6)} กม./ชม.</div><div class="small">ตำแหน่งล่าสุด: <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${lv.lat},${lv.lng}">${Number(lv.lat).toFixed(5)}, ${Number(lv.lng).toFixed(5)}</a></div><div class="small muted">อัปเดต: ${hlDMY(bkk(lv.last_gps_at).date)} ${bkk(lv.last_gps_at).time}${lv.job_id ? ` · ${h(lv.customer_name || '')}` : ''}</div><button type="button" class="btn btn-p btn-block m-see" data-see="${h(x.plate)}">ดูบนแผนที่</button>`}</div>`; }).join('') || '<div class="empty">ไม่พบรถ</div>';
      $$('[data-see]').forEach((b) => b.onclick = (e) => { e.stopPropagation(); focus(b.dataset.see); });
      $$('#mgList .m-veh').forEach((c) => c.onclick = () => focus(c.dataset.plate));
    };
    const focus = (plate) => { const m = mk[plate]; if (!m) { T.toast('ไม่มีตำแหน่ง GPS ของรถคันนี้', 'warn'); return; } map.setView(m.getLatLng(), 15); m.openPopup(); $('#mgMap').scrollIntoView({ block: 'start', behavior: 'smooth' }); };
    const load = async () => { try {
      const d = await T.auth('tnj_live_vehicles', {}, { silent: true }); if (!$('#mgList')) return; T.server.offsetMs = new Date(d.server_time).getTime() - Date.now();
      const live = d.vehicles || []; const drvOf = (vid) => (M.drivers.find((x) => x.default_vehicle_id === vid) || {}).full_name;
      rows = M.vehicles.map((v) => { const lv = live.find((x) => x.license_plate === v.license_plate); return { plate: v.license_plate, driver: (lv && lv.driver_name) || drvOf(v.id) || '', live: lv, st: stOf(lv) }; });
      live.filter((lv) => lv.license_plate && !rows.some((x) => x.plate === lv.license_plate)).forEach((lv) => rows.push({ plate: lv.license_plate, driver: lv.driver_name, live: lv, st: stOf(lv) }));
      layer.clearLayers(); Object.keys(mk).forEach((k) => delete mk[k]);
      rows.forEach((x) => { const lv = x.live; if (lv && lv.lat != null) mk[x.plate] = L.marker([lv.lat, lv.lng], { icon: truckIcon(lv.map_group, lv.gps_stale) }).bindPopup(vehPopup(lv)).addTo(layer); });
      const pts = Object.values(mk).map((m) => m.getLatLng()); if (!fitted && pts.length) { fitted = true; map.fitBounds(pts, { padding: [30, 30], maxZoom: 13 }); }
      draw();
    } catch (e) { T.err(e); } };
    $('#mgQ').addEventListener('input', T.debounce(draw, 120)); $('#mgRef').onclick = () => load();
    await load(); T.subscribe('tnj:gps', T.debounce(load, 1500)); T.every('mgps', 60000, load);
  }
  // 📋 ข้อมูล: ผู้ใช้จาก Session + ทะเบียนรถจาก Master (transport_vehicles + transport_drivers) · รูปคนขับ: SUPER_ADMIN/ADMIN เปลี่ยนได้
  async function pageMAcc(page) {
    await loadMasters(); // ดูอย่างเดียว: ใช้ Cache 60 วิ (หน้าจัดการข้อมูล/ฟอร์ม ยังโหลดใหม่ทุกครั้ง)
    const items = M.vehicles.map((v) => { const d = M.drivers.find((x) => x.default_vehicle_id === v.id) || null; return { v, d }; });
    page.innerHTML = `<div class="m-page"><div class="m-card m-user"><div class="m-avatar">👤</div><div><div class="m-uname">${h(T.session.full_name || T.session.username || '-')}</div><div class="m-urole">${h(T.session.role)}</div><div class="xs muted">${h(T.session.username || '')}</div></div></div>
      <div class="m-card m-menu"><button type="button" id="mLogout">🚪 ออกจากระบบ<span class="m-chev">›</span></button></div>
      <div class="m-sec"><b>🚛 ทะเบียนรถ</b> <span class="xs muted">(กดดูข้อมูลได้)</span></div>
      <div id="maList">${items.map(({ v, d }, i) => `<button type="button" class="m-card m-vrow" data-vi="${i}"><span class="m-vic">${d && d.photo_data ? `<img src="${h(d.photo_data)}" alt="">` : '🚛'}</span><span class="m-vtx"><b>${h(v.license_plate)}</b><span class="small muted">${h(d ? d.full_name : '— ไม่มีคนขับประจำ')}</span></span><span class="m-chev">›</span></button>`).join('') || '<div class="empty">ยังไม่มีข้อมูลรถ</div>'}</div></div>`;
    $('#mLogout').onclick = () => T.logout();
    const openSheet = (idx) => {
      const { v, d } = items[idx]; const name = d ? d.full_name : '-', phone = d ? d.phone || '' : ''; const canPhoto = T.isAdmin() && d;
      const txt = ['ข้อมูลคนขับ', name, `ทะเบียนหัว ${v.license_plate || '-'}`, `ทะเบียนหาง ${v.trailer_plate || '-'}`, `เบอร์ ${String(phone).replace(/[^\d+]/g, '') || '-'}`].join('\n');
      T.modal({ title: `🚛 ${v.license_plate}`, sheet: true, size: 'm-sheet', body: `<div class="m-drv"><div class="m-photo">${d && d.photo_data ? `<img src="${h(d.photo_data)}" alt="รูปคนขับ">` : '<span>👤</span>'}</div>${canPhoto ? '<label class="btn btn-sm m-photo-btn">📷 เปลี่ยนรูปคนขับ<input type="file" id="mdPhoto" accept="image/*" hidden></label>' : ''}
          <div class="m-kvs"><div class="m-kv"><span>ทะเบียนหัว</span><b>${h(v.license_plate || '-')}</b></div><div class="m-kv"><span>ทะเบียนหาง</span><b>${h(v.trailer_plate || '-')}</b></div></div>
          <div class="m-sec"><b>ข้อมูลคนขับ</b></div><div class="m-uname">${h(name)}</div><div class="small">🚛 ทะเบียนหัว: ${h(v.license_plate || '-')}</div><div class="small">🚛 ทะเบียนหาง: ${h(v.trailer_plate || '-')}</div><div class="small">📞 เบอร์โทร: ${phone ? `<a class="m-tel" href="${telHref(phone)}">${h(phone)}</a>` : '-'}</div></div>`,
        foot: `<button type="button" class="btn btn-p" id="mdCopy">📋 COPY ข้อมูลทั้งหมด</button>${phone ? `<a class="btn btn-g" id="mdCall" href="${telHref(phone)}">📞 โทร</a>` : ''}<button type="button" class="btn" data-close>ปิด</button>`,
        onOpen: (el, close) => { $('#mdCopy', el).onclick = async () => { if (await copyText(txt)) T.toast('คัดลอกข้อมูลคนขับแล้ว ✓', 'ok'); else T.toast('คัดลอกไม่สำเร็จ', 'err'); };
          const ph = $('#mdPhoto', el); if (ph) ph.onchange = async () => { const f = ph.files && ph.files[0]; if (!f) return; try { T.loading(true); const data = await photoDataUrl(f); await T.auth('tnj_driver_photo_set', { p_driver_id: d.id, p_photo: data }, { silent: true }); T.toast('บันทึกรูปคนขับแล้ว ✓', 'ok'); close(); await loadMasters(true); const it = items[idx]; it.d = M.drivers.find((x) => x.id === d.id) || it.d; openSheet(idx); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
    };
    $$('#maList [data-vi]').forEach((b) => b.onclick = () => openSheet(Number(b.dataset.vi)));
  }
  // รูปคนขับ: ย่อเป็น JPEG ไม่เกิน 320px (เก็บใน transport_drivers.photo_data)
  const photoDataUrl = (file) => new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { const k = Math.min(1, 320 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82)); }; img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('อ่านรูปไม่สำเร็จ')); }; img.src = url; });
  T.photoDataUrl = photoDataUrl;

  /* ---------- dashboard ---------- */
  async function pageDashboard(page, r) {
    const date = r.q.date || T.todayISO(); let stFilter = null;
    page.innerHTML = `<div class="page-head"><div class="flex"><h1>Dashboard</h1><input type="date" class="inp" id="dbDate" value="${date}" style="width:160px"></div><div class="flex"><a class="btn btn-p" href="#/jobs/new">+ สร้างงานขนส่ง</a></div></div>
      <div class="stats" id="stats">${CARDS.map(([k, l, ic]) => `<div class="stat" data-k="${k}"><div class="ic">${ic}</div><div class="l">${l}</div><div class="v" id="st_${k}">-</div></div>`).join('')}</div>
      <div id="lm"></div>
      <div class="card mt2"><div class="card-h"><h3>รายการงานวันนี้ <span class="muted small" id="tdCount"></span></h3><div class="flex"><input class="inp" id="tdQ" placeholder="ค้นหา..." style="width:180px"><a class="btn btn-sm btn-p" href="#/jobs?date=${date}">ดูทั้งหมด</a></div></div><div id="tdList"></div></div>`;
    $('#dbDate').onchange = (e) => T.go('dashboard?date=' + e.target.value);
    liveMap($('#lm'));
    const loadCounts = async () => { try { const d = await T.auth('tnj_dashboard_counts', { p_date: date }, { silent: true }); CARDS.forEach(([k]) => { const el = $('#st_' + k); if (el) el.textContent = d[k]; }); const n = $('#bellN'); if (n) { n.textContent = d.problem_open; n.classList.toggle('hidden', !d.problem_open); } } catch (e) { console.warn(e); } };
    const loadList = async () => { try { const d = await T.auth('tnj_job_list', { p: { job_date: date, statuses: stFilter, q: $('#tdQ').value.trim(), page_size: 200 } }, { silent: true }); $('#tdCount').textContent = `(${d.total})`; $('#tdList').innerHTML = jobsTable(d.rows); bindJobRows($('#tdList'), loadList); } catch (e) { console.warn(e); } };
    $$('#stats .stat').forEach((c) => c.onclick = () => { const def = CARDS.find((x) => x[0] === c.dataset.k); const same = c.classList.contains('active'); $$('#stats .stat').forEach((x) => x.classList.remove('active')); if (same || !def[3]) { stFilter = null; } else { c.classList.add('active'); stFilter = def[3]; } loadList(); });
    $('#tdQ').oninput = T.debounce(loadList, 350);
    loadCounts(); loadList();
    const refresh = T.debounce(() => { loadCounts(); loadList(); }, 1200);
    T.subscribe('tnj:office', refresh); T.every('dash', 60000, refresh);
  }

  /* ---------- jobs list ---------- */
  // ค้นหาแยกรายหัว Column (กรองฝั่งหน้าเว็บจากรายการงานทั้งหมดที่ RPC tnj_job_list ส่งมา — ไม่แก้ DB/RPC)
  const JF_COLS = [['job_date', 'วันที่งาน', 'date'], ['customer', 'ลูกค้า', 'text'], ['bl', 'B/L', 'text'], ['container', 'เบอร์ตู้', 'text'], ['sched', 'กำหนดส่ง', 'date'], ['driver', 'คนขับ', 'text'], ['st', 'สถานะล่าสุด', 'status']];
  const jfInput = (k, label, type, val) => type === 'date' ? `<input type="date" class="inp jf-in" data-f="${k}" value="${h(val)}" aria-label="ค้นหา${h(label)}">`
    : type === 'status' ? `<select class="inp jf-in" data-f="${k}" aria-label="ค้นหา${h(label)}"><option value="">ทั้งหมด</option><optgroup label="สถานะ Timeline">${HL_STATUS.map((s) => `<option value="${h(s)}" ${s === val ? 'selected' : ''}>${h(s)}</option>`).join('')}</optgroup><optgroup label="สถานะงาน">${T.STATUS.filter((s) => s !== 'COMPLETED').map((s) => `<option value="${s}" ${s === val ? 'selected' : ''}>${h(T.ST_TH[s])}</option>`).join('')}</optgroup></select>`
    : `<input class="inp jf-in" data-f="${k}" value="${h(val)}" placeholder="ค้นหา${h(label)}" autocomplete="off">`;
  const jfMatch = (j, F) => {
    const has = (v, s) => !s || String(v == null ? '' : v).toLowerCase().includes(s.trim().toLowerCase());
    return has(j.customer_name, F.customer) && has(j.bl_no, F.bl) && has(j.container_no, F.container) && has(j.driver_name, F.driver)
      && (!F.job_date || String(j.job_date || '').slice(0, 10) === F.job_date) && (!F.sched || String(j.factory_date || '').slice(0, 10) === F.sched)
      && (!F.st || j.tl_status === F.st || j.status === F.st);
  };
  async function pageJobs(page, r) {
    await loadMasters(); const q = r.q; let pageNo = Number(q.page || 1); const hl = q.hl || ''; let hlDone = false; const PS = 50;
    const F = { job_date: q.date || '', customer: q.customer || '', bl: '', container: '', sched: '', driver: '', st: q.status || '' };
    let all = [], mode = null;
    page.innerHTML = `<div class="page-head"><div class="flex flex-wrap"><a class="btn btn-p" href="#/jobs/new" id="jNew">+ เปิดงาน</a><button class="btn btn-g" id="jXls">📊 EXPORT EXCEL</button><button class="btn" id="jRefresh">🔄 รีเฟรช</button></div><div class="flex"><h1>🚚 งานขนส่ง</h1></div></div>
      <div class="card"><div id="jList"></div><div class="pager" id="jPager"></div></div>`;
    // JOB ที่ลบ (Soft Delete = ยกเลิกงาน) ไม่แสดงในรายการ · ยังดูได้เมื่อเลือกสถานะ “ยกเลิกงาน”
    const shown = () => all.filter((j) => j.status !== 'COMPLETED' && (j.status !== 'CANCELLED' || F.st === 'CANCELLED')); // ปิดงานแล้ว (COMPLETED) → ย้ายไป 📈 รายงานงานขนส่ง
    const filtered = () => shown().filter((j) => jfMatch(j, F));
    const frame = () => {
      mode = isNarrow() ? 'm' : 'd'; const clr = '<button type="button" class="btn btn-sm" id="jfClear">ล้างการค้นหา</button>';
      $('#jList').innerHTML = mode === 'd'
        ? `<div class="tbl-wrap"><table class="tbl jobs-tbl"><thead><tr>${JF_COLS.map(([, l]) => `<th>${l}</th>`).join('')}<th>จัดการ</th></tr><tr class="jf-filter">${JF_COLS.map(([k, l, t]) => `<th>${jfInput(k, l, t, F[k])}</th>`).join('')}<th>${clr}</th></tr></thead><tbody id="jBody"></tbody></table></div>`
        : `<div class="jf-m">${JF_COLS.map(([k, l, t]) => `<div class="field"><label>${l}</label>${jfInput(k, l, t, F[k])}</div>`).join('')}<div class="jf-m-clr">${clr}</div></div><div class="jc-list" id="jBody"></div>`;
      const on = T.debounce(() => { pageNo = 1; draw(); }, 120);
      $$('#jList [data-f]').forEach((i) => { const ev = () => { F[i.dataset.f] = i.value; on(); }; i.addEventListener('input', ev); i.addEventListener('change', ev); });
      $('#jfClear').onclick = () => { Object.keys(F).forEach((k) => { F[k] = ''; }); $$('#jList [data-f]').forEach((i) => { i.value = ''; }); if (q.q) { T.go('jobs'); return; } pageNo = 1; draw(); };
    };
    const draw = () => {
      if (!$('#jBody')) return; // page left
      const rows = filtered(); const pages = Math.max(1, Math.ceil(rows.length / PS)); pageNo = Math.min(Math.max(1, pageNo), pages);
      const vis = rows.slice((pageNo - 1) * PS, pageNo * PS); const body = $('#jBody');
      body.innerHTML = vis.length ? vis.map(mode === 'd' ? jobRowHtml : jobCardHtml).join('') : (mode === 'd' ? `<tr><td colspan="${JF_COLS.length + 1}" class="empty">ไม่พบงาน</td></tr>` : '<div class="empty">ไม่พบงาน</div>');
      bindJobRows(body, (x) => { if (x && x.deleted) { all = all.filter((j) => j.id !== x.deleted); draw(); } load(); }); // ลบงาน → แถว/จำนวน/หน้า อัปเดตทันที
      if (hl) { const row = $(`#jBody [data-job="${hl}"]`); if (row) { row.classList.add('hl-new'); if (!hlDone) { hlDone = true; row.scrollIntoView({ block: 'center' }); } } }
      $('#jPager').innerHTML = `<span class="muted small">ทั้งหมด ${rows.length} รายการ${rows.length !== shown().length ? ` (จาก ${shown().length})` : ''} · หน้า ${pageNo}/${pages}</span><button class="btn btn-sm" id="pgPrev" ${pageNo <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="pgNext" ${pageNo >= pages ? 'disabled' : ''}>›</button>`;
      $('#pgPrev').onclick = () => { pageNo--; draw(); }; $('#pgNext').onclick = () => { pageNo++; draw(); };
    };
    const load = async () => { try {
      let rows = [], pg = 1, total = 0; const base = q.q ? { q: q.q } : {};
      do { const d = await T.auth('tnj_job_list', { p: Object.assign({}, base, { page: pg, page_size: 500 }) }, { silent: true }); rows = rows.concat(d.rows); total = d.total; pg++; } while (rows.length < total && pg < 200);
      if (!$('#jList')) return; all = rows; if (!$('#jBody') || mode !== (isNarrow() ? 'm' : 'd')) frame(); draw();
    } catch (e) { T.err(e); } };
    // ปุ่ม 📈 รายงาน / ⛽ รายงานไมล์-น้ำมัน ด้านบนถูกซ่อน (ซ้ำกับ Sidebar) — Function รายงานเดิมยังอยู่ครบ
    T.openReportModal = openReportModal;
    // 🔄 รีเฟรช: ใช้ตัวโหลดเดิม (load → tnj_job_list) · คง Filter / Search เดิม · ไม่ Reload Browser · ข้อมูลเดิมไม่หายถ้าโหลดไม่สำเร็จ
    $('#jRefresh').onclick = async () => { const b = $('#jRefresh'); if (b.disabled) return; b.disabled = true; b.textContent = '⏳ กำลังรีเฟรช...'; try { await load(); } finally { if (b.isConnected) { b.disabled = false; b.textContent = '🔄 รีเฟรช'; } } };
    $('#jXls').onclick = async () => { try { T.loading(true); await ensureXlsx();
      const rows = filtered();
      const rf = { include_cancelled: true, page: 0 };
      const rep = rows.length ? await T.auth('tnj_report_rows', { p: rf }, { silent: true }) : { rows: [] }; const mm = {}; rep.rows.forEach((x) => { mm[x.job_id] = x; });
      const N = (v) => (v != null && v !== '' ? Number(v) : '');
      const aoa = [['วันที่', 'B/L', 'Customer', 'Container No.', 'รถ', 'ทะเบียนรถ', 'คนขับ', 'ท่ารับตู้', 'โรงงาน', 'จุดคืนตู้', 'ไมล์ก่อน', 'ไมล์หลัง', 'ระยะทาง (กม.)', 'น้ำมัน (ลิตร)', 'ค่าน้ำมันรวม (บาท)', 'กม./ลิตร', 'Job Status', 'GPS ล่าสุด']]
        .concat(rows.map((j) => { const x = mm[j.id] || {}; return [j.job_date, j.bl_no, j.customer_name, j.container_no || '', j.vehicle_name || '', j.license_plate || '', j.driver_name || '', j.pickup_location_text || '', j.factory_location_text || '', j.return_location_text || '', N(x.start_mileage), N(x.end_mileage), N(x.total_distance), N(x.fuel_liters), N(x.fuel_amount), x.km_per_liter != null ? Number(x.km_per_liter) : '-', T.ST_TH[j.status] || j.status, j.last_gps_at ? T.fmtDT(j.last_gps_at) : '-']; }));
      const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [10, 14, 14, 24, 14, 14, 12, 16, 20, 20, 20, 11, 11, 12, 12, 14, 9, 14, 16].map((w) => ({ wch: w }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Jobs'); XLSX.writeFile(wb, `TransportNJ_Jobs_${F.job_date || ''}_${F.job_date || ''}.xlsx`); T.toast(`Export ${rows.length} งาน`, 'ok');
    } catch (e) { T.err(e); } finally { T.loading(false); } };
    load(); T.subscribe('tnj:office', T.debounce(load, 1500)); T.every('jobs', 60000, load);
  }

  /* ---------- job form (create / edit) ---------- */
  function locField(name, label, job, idKey, textKey, required) {
    const list = M.locations; const curId = job ? job[idKey] : ''; const curText = job ? job[textKey] : '';
    return `<div class="field"><label>${label}${required ? ' <span class="req">*</span>' : ''}</label><div class="flex"><input class="inp grow" name="${textKey}" list="dl_${name}" value="${h(curText || '')}" placeholder="เลือกจากรายการ หรือพิมพ์ชื่อสถานที่" data-loc="${name}" data-idkey="${idKey}"><input type="hidden" name="${idKey}" value="${h(curId || '')}"><button type="button" class="btn btn-icon" data-map="${name}" title="เปิด Google Maps">🗺</button></div><datalist id="dl_${name}">${list.map((l) => `<option value="${h(l.name)}">${h(l.location_type)} ${h(l.address || '')}</option>`).join('')}</datalist></div>`;
  }
  async function pageJobForm(page, job, mo) {
    await loadMasters(true); const isNew = !job; const v = (k, d = '') => h(job ? (job[k] == null ? '' : String(job[k]).slice(0, k.endsWith('_time') ? 5 : 2000)) : d);
    const vehOf = (d) => (d && d.default_vehicle_id ? M.vehicles.find((x) => x.id === d.default_vehicle_id) : null) || null;
    const drvLabel = (d) => { const x = vehOf(d); return `${d.full_name} | ${x ? x.license_plate : '-'} | ${x && x.trailer_plate ? x.trailer_plate : '-'} | ${d.phone || '-'}${d.active_job ? ' — กำลังทำงานอยู่' : ''}`; };
    const sizes = ["20'", "40'", "40'HC", "45'", 'LCL', 'อื่น ๆ'];
    // Mobile แก้ไขงาน: คนขับตู้ 1 เลือกได้ (ใช้ tnj_job_assign เดิม — ได้เฉพาะงาน NEW / ASSIGNED ตามกฎเดิม) + หมายเหตุ (job_note) · Desktop ไม่เปลี่ยน
    // แก้ไขงาน: คนขับตู้ 1 เลือกได้ทุก Row (NEW / ASSIGNED = tnj_job_assign เดิม · สถานะอื่น = tnj_job_driver_set RUN-17 ไม่เปลี่ยนสถานะงาน) · หมายเหตุ (job_note) เฉพาะ Mobile
    const mEdit = !isNew && !!(mo && mo.mobile); const mDrv = !isNew;
    page.innerHTML = `${mo ? '' : `<div class="page-head jf-head"><h1>${isNew ? '+ เปิดงานใหม่' : 'แก้ไขงาน — ' + h(T.jobRef(job))}</h1></div>`}<form id="jobForm" class="card card-b jf-form" autocomplete="off">
      <div class="jf-mode" id="jfMode"><span class="jf-mode-l">MODE:</span>${['IMPORT', 'EXPORT'].map((x) => `<label class="jf-mck"><input type="checkbox" data-mode value="${x}" ${job && (job.job_mode || []).includes(x) ? 'checked' : ''}> ${x}</label>`).join('')}</div>
      <div class="jf-row r4"><div class="field"><label>วันที่งาน</label><input type="date" class="inp" name="job_date" value="${v('job_date', T.todayISO())}" ${isNew ? '' : 'disabled'}></div>
        <div class="field"><label>ลูกค้า <span class="req">*</span></label><input class="inp" name="customer_name" list="dlCust2" value="${v('customer_name')}" required><datalist id="dlCust2">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div>
        <div class="field"><label>B/L, BOOKING <span class="req">*</span></label><input class="inp" name="bl_no" value="${v('bl_no')}" required></div><div class="field jf-cnt"><label>จำนวนตู้ <span class="req">*</span></label><input type="number" class="inp" id="jfCnt" min="1" max="50" step="1" inputmode="numeric" value="1" aria-label="จำนวนตู้"></div>${locField('return', 'รับ/คืนตู้เปล่า', job, 'return_location_id', 'return_location_text', true)}</div>
      <div class="jf-ctrow jf-ct1row" id="jfCt1"><div class="field jf-ctno"><label>ลำดับ</label><b class="jf-seq">1</b></div><div class="field"><label>เบอร์ตู้</label><input class="inp" name="container_no" value="${v('container_no')}"></div><div class="field"><label>เบอร์ซีล</label><input class="inp" name="seal_no" value="${v('seal_no')}"></div>
        <div class="field"><label>Size</label><select class="inp" name="container_size"><option value="">-</option>${sizes.map((s) => `<option ${job && job.container_size === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        ${locField('pickup', 'ท่านำเข้า', job, 'pickup_location_id', 'pickup_location_text', true).replace('<div class="field">', '<div class="field jf-ctpk">').replace('placeholder="เลือกจากรายการ หรือพิมพ์ชื่อสถานที่"', 'placeholder="ท่านำเข้า"')}
        <div class="field"><label>วันที่ส่ง</label><input type="date" class="inp" name="factory_date" aria-label="วันที่ส่ง ตู้ 1" value="${v('factory_date')}"></div><div class="field"><label>เวลา</label><input type="time" class="inp" name="factory_time" aria-label="เวลา ตู้ 1" value="${v('factory_time')}"></div>
        ${isNew || mDrv ? `<div class="field jf-ctdrv"><label>คนขับ</label><select class="inp" name="driver_id" id="jfDrv">${opts(!isNew && job.driver_id && !M.drivers.some((x) => x.id === job.driver_id) ? M.drivers.concat([{ id: job.driver_id, full_name: job.driver_name || '-', phone: job.driver_phone }]) : M.drivers, 'id', drvLabel, isNew ? '' : job.driver_id || '', '— ยังไม่เลือกคนขับ —')}</select></div>` : `<div class="field jf-ctdrv"><label>คนขับ</label><input class="inp ro" readonly tabindex="-1" value="${h([job.driver_name, job.license_plate, job.trailer_plate, job.driver_phone].map((x) => x || '-').join(' | '))}" title="เปลี่ยนรถ/คนขับได้ที่ปุ่ม &quot;สั่งงาน&quot; ในหน้ารายละเอียด (ก่อนคนขับรับงาน)"></div>`}<div class="jf-ctx"><button type="button" class="btn btn-sm" data-ct-rm data-c1>🗑 ลบ</button></div></div>
      <div class="jf-drvhide" hidden><input class="inp ro" id="jfName" readonly tabindex="-1" value="${v('driver_name')}"><input class="inp ro" id="jfHead" readonly tabindex="-1" value="${v('license_plate')}"><input class="inp ro" id="jfTail" readonly tabindex="-1" value="${v('trailer_plate')}"><input class="inp ro" id="jfPhone" readonly tabindex="-1" value="${v('driver_phone')}"></div>
      <div class="jf-cts" id="jfCts"></div><div class="jf-ctadd"><button type="button" class="btn" id="jfAddCt">+ เพิ่มตู้</button><span class="xs muted">1 JOB เพิ่มได้หลายตู้ · แต่ละตู้มีเบอร์ตู้ / เบอร์ซีล / Size / ท่านำเข้า / วันที่ส่ง / เวลา / คนขับ แยกกัน</span></div>
      <div class="jf-row r1"><div class="field"><label>ที่อยู่ออกใบเสร็จ</label><textarea class="inp" name="billing_address" rows="2">${v('billing_address')}</textarea></div></div>
      ${mEdit ? `<div class="jf-row r1"><div class="field"><label>หมายเหตุ</label><textarea class="inp" name="job_note" rows="2" maxlength="1000">${v('job_note')}</textarea></div></div>` : ''}
      ${isNew ? '' : '<div class="jf-row r1"><div class="field"><label>เหตุผลที่แก้ไข (บันทึกลง Timeline)</label><input class="inp" name="edit_note"></div></div>'}
      ${mo ? '' : `<div class="jf-btns"><button type="submit" class="btn btn-p btn-lg" id="jfSave">${isNew ? 'บันทึกเปิดงาน' : 'บันทึกการแก้ไข'}</button><a class="btn btn-lg" id="jfCancel" href="${isNew ? '#/jobs' : '#/jobs/' + job.id}">ยกเลิก</a></div>`}</form>`;
    if (mo && mo.closed) $$('#jobForm input, #jobForm select, #jobForm textarea, #jobForm button', page).forEach((x) => { x.disabled = true; });
    // location id sync + map
    $$('[data-loc]', page).forEach((inp) => { const hid = inp.parentElement.querySelector('input[type=hidden]'); const sync = () => { const l = M.locations.find((x) => x.name === inp.value.trim()); hid.value = l ? l.id : ''; }; inp.addEventListener('input', sync); inp.addEventListener('change', sync); });
    $$('[data-map]', page).forEach((b) => b.onclick = () => { const inp = $(`[data-loc="${b.dataset.map}"]`, page); const l = M.locations.find((x) => x.name === inp.value.trim()); window.open(T.mapsUrl(l, inp.value.trim()), '_blank'); });
    // ---- + เพิ่มตู้ (ตู้ลำดับ 2+) ----
    let extras = []; if (!isNew) { try { extras = (await hlLoadContainers({ id: job.id, timeline: [] })).containers || []; } catch (_) { extras = []; } }
    const ctNo = () => $$('#jfCts .jf-ct', page).length + 2; // ลำดับในฟอร์ม = เลขธรรมดา 1, 2, 3… (Re-number เมื่อเอาออก)
    const renum = () => $$('#jfCts .jf-ct', page).forEach((r, i) => { r.querySelector('.jf-seq').textContent = String(i + 2); });
    // 1 ตู้ = 1 แถว: ลำดับ | เบอร์ตู้ | เบอร์ซีล | Size | ท่านำเข้า | วันที่ส่ง | เวลา | คนขับ (ชื่อ | หัว | หาง | เบอร์โทร) | ✕ เอาออก
    const ctRow = (c, no) => `<div class="jf-ctrow jf-ct" ${c ? `data-ct-id="${h(c.id)}"` : 'data-new="1"'}><div class="jf-ctno"><b class="jf-seq">${no}</b></div>
        <div class="field"><input class="inp" data-ck="container_no" placeholder="เบอร์ตู้" aria-label="เบอร์ตู้" value="${h(c ? c.container_no || '' : '')}"></div><div class="field"><input class="inp" data-ck="seal_no" placeholder="เบอร์ซีล" aria-label="เบอร์ซีล" value="${h(c ? c.seal_no || '' : '')}"></div>
        <div class="field"><select class="inp" data-ck="container_size" aria-label="Container Size"><option value="">-</option>${sizes.map((x) => `<option ${c && c.container_size === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="field jf-ctpk"><input class="inp" data-ck="pickup_location_text" list="dl_pickup" placeholder="ท่านำเข้า *" aria-label="ท่านำเข้า" value="${h(c ? c.pickup_location_text || (job && job.pickup_location_text) || '' : '')}"></div>
        <div class="field"><input type="date" class="inp" data-ck="factory_date" aria-label="วันที่ส่ง" title="วันที่ส่ง" value="${h(c && c.factory_date ? String(c.factory_date).slice(0, 10) : '')}"></div><div class="field"><input type="time" class="inp" data-ck="factory_time" aria-label="เวลา" title="เวลา" value="${h(c && c.factory_time ? String(c.factory_time).slice(0, 5) : '')}"></div>
        <div class="field jf-ctdrv"><select class="inp" data-ck="driver_id" aria-label="คนขับ">${opts(M.drivers, 'id', drvLabel, c ? c.driver_id : '', '— คนขับ (ชื่อ | หัว | หาง | เบอร์โทร) —')}</select></div>
        <div class="jf-ctx"><button type="button" class="btn btn-sm" data-ct-rm>🗑 ลบ</button></div></div>`;
    const ctBox = $('#jfCts', page); ctBox.innerHTML = extras.map((c, i) => ctRow(c, i + 2)).join('');
    // ---- 🗑 ลบ ได้ทุกแถว (รวมลำดับ 1) · จำนวนตู้ = จำนวนแถวจริงเสมอ · ตัวตนของตู้ = Container ID (เลขลำดับเป็นแค่ลำดับแสดงผล) ----
    const ct1 = $('#jfCt1', page); const cntIn = $('#jfCnt', page);
    const allRows = () => [ct1, ...$$('#jfCts .jf-ct', page)];
    const cntSync = () => { const n = allRows().length; cntIn.value = String(n); $$('[data-ct-rm]', page).forEach((b) => { b.disabled = n <= 1 || !!(mo && mo.closed); b.title = n <= 1 ? 'JOB ต้องมีอย่างน้อย 1 ตู้' : ''; }); };
    const C1F = { container_no: '[name=container_no]', seal_no: '[name=seal_no]', container_size: '[name=container_size]', pickup_location_text: '[name=pickup_location_text]', factory_date: '[name=factory_date]', factory_time: '[name=factory_time]', driver_id: '#jfDrv' };
    const rowHasData = (r) => r === ct1 ? Object.values(C1F).some((q) => { const x = $(q, ct1); return x && x.value.trim() && !(q === '[name=pickup_location_text]' && !isNew); }) : $$('[data-ck]', r).some((x) => x.value.trim());
    // ตู้ลำดับ 2 (แถวแรกใน #jfCts) ขึ้นมาเป็นลำดับ 1: ย้ายค่า "ทั้งชุด" ของตู้นั้นลงช่องตู้ 1 แล้วเอาแถวเดิมออก (ข้อมูลไม่สลับกับตู้อื่น)
    const liftToC1 = (row) => { Object.entries(C1F).forEach(([k, q]) => { const dst = $(q, ct1); const src = row.querySelector(`[data-ck=${k}]`); if (dst && src) { dst.value = src.value; dst.dispatchEvent(new Event('input', { bubbles: true })); dst.dispatchEvent(new Event('change', { bubbles: true })); } }); row.remove(); };
    const rmLbl = (r) => { const cn = (r === ct1 ? $('[name=container_no]', ct1).value : (r.querySelector('[data-ck=container_no]') || {}).value || '').trim(); return cn ? `ยืนยันลบตู้ ${h(cn)} ?` : 'ยืนยันลบตู้รายการนี้ ?'; };
    // ลบ 1 แถว — ตู้ที่บันทึกบน Server แล้ว: Confirm → Server ก่อน (แถวหายเมื่อ Server ยืนยันเท่านั้น · ตู้ที่มี Timeline แล้ว Server ปฏิเสธ ข้อมูลอยู่ครบ)
    const rmRow = async (row, ask = true) => {
      if (allRows().length <= 1) { T.toast('JOB ต้องมีอย่างน้อย 1 ตู้', 'warn'); return false; }
      const saved = row === ct1 ? !isNew : !!row.dataset.ctId;
      if (saved && ask && !(await T.confirm('ลบตู้', rmLbl(row), '🗑 ลบ', 'btn-r'))) return false;
      if (row === ct1) {
        const first = $('#jfCts .jf-ct', page);
        if (!isNew && first && !first.dataset.ctId) { // ตู้ถัดไปยังไม่บันทึก: ตู้ 1 ต้องยังไม่มี Timeline สถานะ (กฎเดียวกับ Server) → ย้ายค่าลงตู้ 1 แล้วบันทึกตอนกด 💾
          if (hlItems(job, null).length) { T.toast('ตู้ 1 มี Timeline แล้ว — ลบไม่ได้', 'err'); return false; } liftToC1(first);
        } else if (!isNew) {
          let r; try { T.loading(true); r = await T.auth('tnj_job_container1_remove', { p_job_id: job.id }, { silent: true }); } catch (e) { T.err(e); return false; } finally { T.loading(false); }
          const up = $(`#jfCts .jf-ct[data-ct-id="${r.promoted_from}"]`, page) || first; Object.assign(job, r.job || {}); liftToC1(up);
        } else liftToC1(first);
      } else {
        if (row.dataset.ctId) { try { T.loading(true); await T.auth('tnj_job_containers_save', { p_job_id: job.id, p_items: [{ id: row.dataset.ctId, remove: true }] }, { silent: true }); } catch (e) { T.err(e); return false; } finally { T.loading(false); } }
        row.remove();
      }
      renum(); cntSync(); return true;
    };
    const bindCt = () => $$('[data-ct-rm]', page).forEach((b) => b.onclick = async () => { const row = b.closest('#jfCt1') || b.closest('.jf-ct'); const lbl = (row.querySelector('.jf-seq') || {}).textContent || ''; const saved = row.id === 'jfCt1' ? !isNew : !!row.dataset.ctId; if (await rmRow(row) && saved) T.toast(`ลบตู้ ${lbl} แล้ว`, 'ok'); });
    const addRow = () => { ctBox.insertAdjacentHTML('beforeend', ctRow(null, ctNo())); bindCt(); cntSync(); return ctBox.lastElementChild; };
    bindCt(); cntSync();
    $('#jfAddCt', page).onclick = () => { const last = addRow(); const f = last && last.querySelector('[data-ck=container_no]'); if (f) f.focus(); };
    // จำนวนตู้: เพิ่ม → เพิ่มแถวจนครบ · ลด → ลบแถวท้ายสุด (มีข้อมูล / บันทึกแล้ว ต้อง Confirm) · ค่าไม่ถูกต้อง → คืนค่าตามจำนวนแถวจริง
    let cntBusy = false;
    const cntApply = async () => {
      if (cntBusy) return; const cur = allRows().length; const raw = cntIn.value.trim();
      if (!/^\d+$/.test(raw) || Number(raw) < 1) { T.toast('จำนวนตู้ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป', 'warn'); cntSync(); return; }
      const n = Math.min(Number(raw), 50); if (n === cur) { cntSync(); return; }
      cntBusy = true;
      try {
        if (n > cur) { for (let i = cur; i < n; i++) addRow(); return; }
        const drop = allRows().slice(n).reverse(); const risky = drop.filter((r) => r.dataset.ctId || rowHasData(r));
        if (risky.length && !(await T.confirm('ลดจำนวนตู้', `ลดจำนวนตู้เป็น ${n} — ต้องลบ ${drop.length} ตู้ท้ายรายการ (มีข้อมูล ${risky.length} ตู้)<br>ยืนยันลบ?`, '🗑 ลบ', 'btn-r'))) return;
        for (const r of drop) { if (!(await rmRow(r, false))) break; }
      } finally { cntBusy = false; cntSync(); }
    };
    cntIn.addEventListener('change', cntApply); cntIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cntApply(); } });
    const ctItems = () => $$('#jfCts .jf-ct', page).map((r, i) => { const o = { id: r.dataset.ctId || null }; $$('[data-ck]', r).forEach((x) => { o[x.dataset.ck] = x.value.trim(); }); const l = M.locations.find((x) => x.name === o.pickup_location_text); o.pickup_location_id = l ? l.id : ''; Object.defineProperty(o, 'no', { value: i + 2 }); return o; }).filter((o) => o.id || o.container_no || o.seal_no || o.container_size || o.pickup_location_text || o.factory_date || o.factory_time || o.driver_id);
    const drvSel = $('#jfDrv', page);
    const fill = () => { const d = M.drivers.find((x) => x.id === drvSel.value); const x = vehOf(d); $('#jfName', page).value = d ? d.full_name : ''; $('#jfHead', page).value = x ? x.license_plate || '' : ''; $('#jfTail', page).value = x ? x.trailer_plate || '' : ''; $('#jfPhone', page).value = d ? d.phone || '' : ''; };
    if (drvSel) drvSel.onchange = fill;
    $('#jobForm', page).onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target); const p = {}; fd.forEach((val, k) => { p[k] = String(val).trim(); });
      // MODE งาน: ต้องเลือกอย่างน้อย 1 (JOB เก่าที่ยังไม่มี MODE แก้ไขได้โดยไม่บังคับ)
      const modes = $$('#jfMode [data-mode]:checked', page).map((x) => x.value);
      if (!modes.length && (isNew || (job.job_mode || []).length)) { T.toast('กรุณาเลือก MODE งาน', 'err'); const f = $('#jfMode [data-mode]', page); if (f) f.focus(); return; }
      const noPk = ctItems().find((o) => !o.pickup_location_text); if (noPk) { T.toast(`กรุณาระบุท่านำเข้า ตู้ ${noPk.no}`, 'err'); const f = $$('#jfCts .jf-ct', page)[noPk.no - 2]; if (f) f.querySelector('[data-ck=pickup_location_text]').focus(); return; }
      const btn = $('#jfSave', mo ? mo.el : page); btn.disabled = true;
      try {
        if (isNew) {
          const d = M.drivers.find((x) => x.id === p.driver_id); const x = vehOf(d);
          if (x) { p.vehicle_id = x.id; p.trailer_plate = x.trailer_plate || ''; }
          p.assign_now = !!p.driver_id;
          const items = ctItems(); const j = await T.auth('tnj_job_create', { p });
          await T.auth('tnj_job_mode_set', { p_job_id: j.id, p_mode: modes }, { silent: true });
          if (items.length) await T.auth('tnj_job_containers_save', { p_job_id: j.id, p_items: items }, { silent: true });
          T.toast(`เปิดงานแล้ว${items.length ? ` (${items.length + 1} ตู้)` : ''}${j.status === 'ASSIGNED' ? ' และสั่งงานคนขับแล้ว' : ''}`, 'ok'); T.go(isNarrow() ? 'm-tl/' + j.id : 'jobs?hl=' + j.id);
        } else { if (mDrv && job.driver_id && !p.driver_id) { T.toast('คนขับตู้ 1 เอาออกไม่ได้ — กรุณาเลือกคนขับใหม่แทน', 'err'); const f = $('#jfDrv', page); if (f) f.focus(); return; }
          const nd = mDrv && p.driver_id && p.driver_id !== (job.driver_id || '') ? M.drivers.find((x) => x.id === p.driver_id) : null; const nx = nd ? vehOf(nd) : null; if (nd) p.trailer_plate = nx ? nx.trailer_plate || '' : ''; delete p.driver_id;
          await T.auth('tnj_job_update', { p_job_id: job.id, p });
          if (nd) { if (['NEW', 'ASSIGNED'].includes(job.status)) await T.auth('tnj_job_assign', { p_job_id: job.id, p_vehicle_id: nx ? nx.id : null, p_driver_id: nd.id }, { silent: true }); else await T.auth('tnj_job_driver_set', { p_job_id: job.id, p_driver_id: nd.id }, { silent: true }); } if (modes.length) await T.auth('tnj_job_mode_set', { p_job_id: job.id, p_mode: modes }, { silent: true }); const items = ctItems(); if (items.length) await T.auth('tnj_job_containers_save', { p_job_id: job.id, p_items: items }, { silent: true }); if (mo) { mo.saved(); return; } T.toast('บันทึกการแก้ไขแล้ว', 'ok'); T.go('jobs/' + job.id); }
      } catch (er) { T.err(er); } finally { btn.disabled = false; }
    };
  }

  /* ---------- assign dialog ---------- */
  async function assignDialog(job, onDone) {
    await loadMasters(true);
    T.modal({ title: `สั่งงาน — ${T.jobRef(job)}`, size: 's', body: `<div class="field"><label>รถ / ทะเบียนรถ</label><select class="inp inp-lg" id="asVeh">${opts(M.vehicles, 'id', (x) => `${x.vehicle_name} (${x.license_plate})${x.active_job ? ' — มีงาน' : ''}`, job.vehicle_id)}</select></div>
      <div class="field"><label>คนขับ <span class="req">*</span></label><select class="inp inp-lg" id="asDrv">${opts(M.drivers, 'id', (x) => `${x.full_name}${x.phone ? ' · ' + x.phone : ''}${x.active_job ? ' — กำลังทำงานอยู่' : ''}`, job.driver_id)}</select></div><div class="alert info">คนขับจะเห็นงานบนมือถือทันที และต้องกด "รับงาน"</div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="asGo">🚚 สั่งงาน</button>`, onOpen: (el, close) => { $('#asGo', el).onclick = async () => { const d = $('#asDrv', el).value; if (!d) return T.toast('กรุณาเลือกคนขับ', 'warn'); try { await T.auth('tnj_job_assign', { p_job_id: job.id, p_vehicle_id: $('#asVeh', el).value || null, p_driver_id: d }); T.toast('สั่งงานแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } }; } });
  }

  /* ---------- UPDATE TIMELINE dialog (office) ---------- */
  function timelineDialog(job, onDone) {
    const cur = job.status; const allowed = T.STATUS.slice(2, 13).filter((s) => s !== cur && T.statusOrder(cur) >= 2);
    T.modal({ title: `+ UPDATE TIMELINE — ${T.jobRef(job)}`, body: `<div class="alert info">สถานะปัจจุบัน: ${T.badge(cur)} ${cur === 'PROBLEM' ? '— งานมีปัญหา ใช้ปุ่ม "แก้ไขปัญหาแล้ว" ก่อน' : ''}</div>
      <div class="field"><label>เปลี่ยนสถานะเป็น</label><select class="inp inp-lg" id="tlSt"><option value="">— ไม่เปลี่ยนสถานะ (บันทึกหมายเหตุ/ไฟล์เท่านั้น) —</option>${cur === 'PROBLEM' || cur === 'COMPLETED' || cur === 'CANCELLED' ? '' : allowed.map((s) => `<option value="${s}">${h(T.ST_TH[s])}${T.nextStatus(cur) === s ? ' (ขั้นถัดไป)' : ''}</option>`).join('')}</select></div>
      <div class="field"><label>หมายเหตุ</label><textarea class="inp" id="tlNote"></textarea></div>
      <div class="field"><label>แนบรูป / ไฟล์ (ผูกกับรายการนี้)</label><input type="file" class="inp" id="tlFiles" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx"><select class="inp mt1" id="tlFType">${T.FILE_TYPES.map((t) => `<option>${h(t)}</option>`).join('')}</select></div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="tlGo">บันทึก Timeline</button>`,
      onOpen: (el, close) => { $('#tlGo', el).onclick = async () => {
        const st = $('#tlSt', el).value, note = $('#tlNote', el).value.trim(), files = Array.from($('#tlFiles', el).files || []); if (!st && !note && !files.length) return T.toast('กรุณาเลือกสถานะ หรือใส่หมายเหตุ/ไฟล์', 'warn');
        try { T.loading(true); let tlId = null, j2 = job;
          if (st || note) { const r = await T.auth('tnj_timeline_note', { p_job_id: job.id, p_status: st || null, p_note: note || (st ? null : null) }, { silent: true }); j2 = r.job; tlId = r.timeline_id || (j2.timeline.length ? j2.timeline[j2.timeline.length - 1].id : null); }
          for (const f of files) await T.files.upload(job.id, await T.files.shrink(f), $('#tlFType', el).value, tlId, null);
          T.toast('บันทึก Timeline แล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
  }

  /* ---------- fuel / mileage dialogs ---------- */
  function fuelDialog(job, f, onDone) {
    const isEdit = !!f; const v = (k, d = '') => h(f ? (f[k] == null ? '' : f[k]) : d);
    T.modal({ title: isEdit ? 'แก้ไขรายการน้ำมัน' : 'เพิ่มรายการน้ำมัน', size: 's', body: `<div class="inline-row"><div class="field"><label>วันเวลาเติม</label><input type="datetime-local" class="inp" id="fuDate" value="${f ? T.toISODateTimeLocal(new Date(f.fuel_date)) : T.toISODateTimeLocal()}"></div><div class="field"><label>ปั๊มน้ำมัน</label><input class="inp" id="fuSt" value="${v('fuel_station')}"></div></div>
      <div class="inline-row"><div class="field"><label>ประเภทน้ำมัน</label><select class="inp" id="fuType">${['ดีเซล B7', 'ดีเซล B10', 'ดีเซล B20', 'ดีเซลพรีเมียม', 'NGV', 'อื่น ๆ'].map((t) => `<option ${f && f.fuel_type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div class="field"><label>เลขไมล์ตอนเติม</label><input type="number" step="1" class="inp" id="fuMile" value="${v('mileage')}"></div></div>
      <div class="inline-row"><div class="field"><label>จำนวนลิตร <span class="req">*</span></label><input type="number" step="0.01" min="0.01" class="inp" id="fuL" value="${v('liters')}" required></div><div class="field"><label>ราคาต่อลิตร <span class="req">*</span></label><input type="number" step="0.01" min="0" class="inp" id="fuP" value="${v('price_per_liter')}" required></div><div class="field"><label>จำนวนเงิน</label><input class="inp" id="fuTot" disabled value="${f ? T.num(f.total_amount, 2) : '-'}"></div></div>
      <div class="inline-row"><div class="field"><label>เลขใบเสร็จ</label><input class="inp" id="fuRc" value="${v('receipt_no')}"></div><div class="field"><label>หมายเหตุ</label><input class="inp" id="fuNote" value="${v('note')}"></div></div>
      ${isEdit ? '<div class="field"><label>เหตุผลที่แก้ไข <span class="req">*</span></label><input class="inp" id="fuReason"></div>' : '<div class="field"><label>รูปใบเสร็จ</label><input type="file" class="inp" id="fuFile" accept="image/*,.pdf"></div>'}`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="fuGo">บันทึก</button>`,
      onOpen: (el, close) => { const calc = () => { const l = Number($('#fuL', el).value), p = Number($('#fuP', el).value); $('#fuTot', el).value = l > 0 && p >= 0 ? T.num(l * p, 2) : '-'; }; $('#fuL', el).oninput = calc; $('#fuP', el).oninput = calc;
        $('#fuGo', el).onclick = async () => { const p = { fuel_date: $('#fuDate', el).value ? new Date($('#fuDate', el).value).toISOString() : null, fuel_station: $('#fuSt', el).value.trim(), fuel_type: $('#fuType', el).value, mileage: $('#fuMile', el).value, liters: $('#fuL', el).value, price_per_liter: $('#fuP', el).value, receipt_no: $('#fuRc', el).value.trim(), note: $('#fuNote', el).value.trim() };
          try { T.loading(true); if (isEdit) { const reason = $('#fuReason', el).value.trim(); if (!reason) return T.toast('กรุณาระบุเหตุผล', 'warn'); await T.auth('tnj_fuel_edit', { p_fuel_id: f.id, p: p, p_reason: reason }, { silent: true }); }
            else { const file = $('#fuFile', el).files[0]; if (file) { const up = await T.files.upload(job.id, await T.files.shrink(file), 'ใบเสร็จ', null, null); p.receipt_file = up.file_id; } const r = await T.auth('tnj_fuel_add', { p_job_id: job.id, p }, { silent: true }); if (r.warning_note) T.toast(r.warning_note, 'warn', 6000); }
            T.toast('บันทึกน้ำมันแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } });
  }
  function mileageEditDialog(job, onDone) {
    const m = job.mileage || {};
    T.modal({ title: `แก้ไขข้อมูลไมล์ (ADMIN) — ${T.jobRef(job)}`, size: 's', body: `<div class="alert warn">การแก้ไขจะถูกบันทึกใน Audit Log พร้อมค่าเดิม/ค่าใหม่</div><div class="inline-row"><div class="field"><label>ไมล์ก่อน</label><input type="number" step="1" class="inp" id="meS" value="${m.start_mileage != null ? Number(m.start_mileage) : ''}"></div><div class="field"><label>ไมล์หลัง</label><input type="number" step="1" class="inp" id="meE" value="${m.end_mileage != null ? Number(m.end_mileage) : ''}"></div></div><div class="field"><label>เหตุผล <span class="req">*</span></label><input class="inp" id="meR"></div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="meGo">บันทึก</button>`, onOpen: (el, close) => { $('#meGo', el).onclick = async () => { const r = $('#meR', el).value.trim(); if (!r) return T.toast('กรุณาระบุเหตุผล', 'warn'); try { await T.auth('tnj_mileage_edit', { p_job_id: job.id, p_start: $('#meS', el).value || null, p_end: $('#meE', el).value || null, p_reason: r }); T.toast('บันทึกแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } }; } });
  }

  /* ---------- job detail (page + drawer) ---------- */
  async function pageJobDetail(page, id, tab) { page.innerHTML = '<div class="empty">กำลังโหลด...</div>'; await renderJobDetail(page, id, { tab, pageMode: true }); }
  T.renderJobDetail = renderJobDetail;
  async function renderJobDetail(root, id, opt = {}) {
    let job; try { job = await hlLoadContainers(await T.auth('tnj_job_get', { p_job_id: id }, { silent: true })); } catch (e) { root.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
    const canEdit = T.canEdit(), admin = T.isAdmin(); const m = job.mileage || {}; let tab = opt.tab || 'info'; let map = null;
    const live = !['NEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'].includes(job.status);
    const canClose = canEdit && (job.status === 'CONTAINER_RETURNED' || (admin && T.ACTIVE.has(job.status) && job.status !== 'PROBLEM'));
    root.innerHTML = `<div class="page-head"><div><div class="flex flex-wrap"><h1>${h(T.jobRef(job))}</h1>${T.badge(job.status)}${job.incomplete_flag ? '<span class="badge amber">⚠ ข้อมูลไม่ครบ</span>' : ''}${m.warning_flag ? '<span class="badge amber">⚠ ตรวจสอบไมล์</span>' : ''}</div><div class="muted small">${h(job.customer_name)} · B/L ${h(job.bl_no)} · ${h(job.container_no || '-')} ${h(job.container_size || '')} · 🚛 ${h(job.license_plate || '-')} · 👤 ${h(job.driver_name || '-')}${job.driver_phone ? ` <a href="tel:${h(job.driver_phone)}">📞 ${h(job.driver_phone)}</a>` : ''}</div></div>
      <div class="flex flex-wrap" id="jdActions">${opt.pageMode ? '<a class="btn" href="#/jobs">‹ รายการงาน</a>' : `<a class="btn" href="#/jobs/${job.id}">เปิดหน้าเต็ม</a>`}
        ${canEdit && ['NEW', 'ASSIGNED'].includes(job.status) ? '<button class="btn btn-p" data-act="assign">🚚 สั่งงาน</button>' : ''}
        ${canEdit && !['COMPLETED', 'CANCELLED'].includes(job.status) ? '<button class="btn" data-act="edit">✏️ แก้ไข</button>' : ''}
        ${canEdit && job.status === 'PROBLEM' ? '<button class="btn btn-g" data-act="resolve">✅ แก้ไขปัญหาแล้ว</button>' : ''}
        ${canClose ? '<button class="btn btn-navy" data-act="close">🏁 ปิดงาน</button>' : ''}
        ${canEdit && !['COMPLETED', 'CANCELLED'].includes(job.status) ? '<button class="btn btn-r" data-act="cancel">ยกเลิกงาน</button>' : ''}</div></div>
      ${job.status === 'CANCELLED' ? `<div class="alert err">ยกเลิกงาน: ${h(job.cancel_reason || '')} (${T.fmtDT(job.cancelled_at)})</div>` : ''}
      ${job.incomplete_flag ? '<div class="alert warn">⚠ งานจบแล้ว แต่ยังไม่ได้บันทึกไมล์หลัง</div>' : ''}
      <div class="tabs" id="jdTabs">${[['info', 'รายละเอียดงาน'], ['timeline', `ไทม์ไลน์ (${job.timeline.length})`], ['docs', `เอกสาร (${job.files.length})`], ['fuel', '⛽ ไมล์รถ / น้ำมัน'], ['gps', 'Live GPS'], ['audit', 'ประวัติแก้ไข']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="jdBody"></div>`;
    const reload = () => renderJobDetail(root, id, Object.assign({}, opt, { tab }));
    const body = $('#jdBody', root);
    const draw = async () => {
      if (map) { map.remove(); map = null; }
      if (tab === 'info') {
        const loc = (t, l) => `${h(t)} <a class="btn btn-sm" target="_blank" rel="noopener" href="${T.mapsUrl(l, t)}">🗺 Maps</a>`;
        body.innerHTML = `<div class="grid g2"><div class="card card-b"><h3 class="mb1">ข้อมูลงาน</h3><div class="kv"><div class="k">ลูกค้า</div><div class="v">${h(job.customer_name)}</div><div class="k">B/L</div><div class="v">${h(job.bl_no)}</div><div class="k">Booking</div><div class="v">${h(job.booking_no || '-')}</div><div class="k">Container</div><div class="v">${h(job.container_no || '-')} ${h(job.container_size || '')}</div><div class="k">Seal</div><div class="v">${h(job.seal_no || '-')}</div><div class="k">รถ</div><div class="v">${h(job.vehicle_name || '-')} (${h(job.license_plate || '-')})</div><div class="k">คนขับ</div><div class="v">${h(job.driver_name || '-')}</div><div class="k">วันที่งาน</div><div class="v">${T.fmtD(job.job_date)}</div><div class="k">มอบหมาย</div><div class="v">${T.fmtDT(job.assigned_at)}</div><div class="k">รับงาน</div><div class="v">${T.fmtDT(job.accepted_at)}</div><div class="k">ปิดงาน</div><div class="v">${T.fmtDT(job.completed_at)}</div><div class="k">หมายเหตุ</div><div class="v">${h(job.job_note || '-')}</div></div></div>
          <div><div class="card card-b mb1"><h3 class="mb1">📍 จุดรับตู้</h3><div class="kv"><div class="k">ท่ารับตู้</div><div class="v">${loc(job.pickup_location_text, job.pickup_loc)}</div><div class="k">วัน/เวลา</div><div class="v">${T.fmtD(job.pickup_date)} ${T.fmtT(job.pickup_time)} น.</div><div class="k">หมายเหตุ</div><div class="v">${h(job.pickup_note || '-')}</div></div></div>
          <div class="card card-b mb1"><h3 class="mb1">🏭 จุดส่งโรงงาน</h3><div class="kv"><div class="k">โรงงาน</div><div class="v">${loc(job.factory_location_text, job.factory_loc)}</div><div class="k">วัน/เวลา</div><div class="v">${T.fmtD(job.factory_date)} ${T.fmtT(job.factory_time)}</div><div class="k">Contact</div><div class="v">${h(job.factory_contact || '-')} ${job.factory_phone ? `<a href="tel:${h(job.factory_phone)}">📞 ${h(job.factory_phone)}</a>` : ''}</div><div class="k">หมายเหตุ</div><div class="v">${h(job.factory_note || '-')}</div></div></div>
          <div class="card card-b"><h3 class="mb1">↩️ จุดคืนตู้</h3><div class="kv"><div class="k">สถานที่</div><div class="v">${loc(job.return_location_text, job.return_loc)}</div><div class="k">วัน/เวลา</div><div class="v">${T.fmtD(job.return_date)} ${T.fmtT(job.return_time)} น.</div><div class="k">หมายเหตุ</div><div class="v">${h(job.return_note || '-')}</div></div></div></div></div>`;
      } else if (tab === 'gps') {
        body.innerHTML = `<div class="card card-b"><div class="flex between mb1"><div><b>ตำแหน่งรถ</b> <span class="${job.gps_stale ? 'gps-stale' : 'gps-ok'}">${h(job.last_gps_at ? T.ago(job.last_gps_at) : 'ไม่มี GPS')}</span>${job.last_speed != null && !job.gps_stale ? ` · ${Math.round(job.last_speed * 3.6)} กม./ชม.` : ''}</div><div class="flex"><label class="check"><input type="checkbox" id="gpRoute" checked> เส้นทางย้อนหลัง</label><button class="btn btn-sm" id="gpRefresh">รีเฟรช</button></div></div><div class="map" id="jdMap"></div><div id="gpPts" class="small muted mt1"></div></div>`;
        map = mkMap($('#jdMap', body)); const lay = L.layerGroup().addTo(map); const pts = [];
        [['pickup_loc', 'pickup_location_text', '#F08A1E', '📍'], ['factory_loc', 'factory_location_text', '#1E6FE8', '🏭'], ['return_loc', 'return_location_text', '#0F9D9A', '↩']].forEach(([lk, tk, c, e]) => { const l = job[lk]; if (l && l.latitude && l.longitude) { L.marker([l.latitude, l.longitude], { icon: pinIcon(c, e) }).bindPopup(`<b>${h(job[tk])}</b>`).addTo(lay); pts.push([l.latitude, l.longitude]); } });
        const drawRoute = async () => { try { const r = await T.auth('tnj_gps_route', { p_job_id: job.id }, { silent: true }); if ($('#gpRoute', body).checked && r.points.length) { L.polyline(r.points.map((p) => [p.lat, p.lng]), { color: '#1E6FE8', weight: 4, opacity: .8 }).addTo(lay); r.points.forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 3, color: '#1E6FE8', fillOpacity: .8 }).bindTooltip(`${T.fmtDT(p.t)}${p.speed != null ? ' · ' + Math.round(p.speed * 3.6) + ' กม./ชม.' : ''}`).addTo(lay)); } $('#gpPts', body).textContent = `จุด GPS ทั้งหมด ${r.points.length} จุด`; if (r.points.length) pts.push(...r.points.slice(-50).map((p) => [p.lat, p.lng])); if (job.last_lat != null) { L.marker([job.last_lat, job.last_lng], { icon: truckIcon('factory', job.gps_stale) }).bindPopup(`<b>${h(job.license_plate || '')}</b> ${h(job.driver_name || '')}<br>${h(T.ago(job.last_gps_at))}`).addTo(lay).openPopup(); pts.push([job.last_lat, job.last_lng]); } if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 }); } catch (e) { console.warn(e); } };
        drawRoute(); $('#gpRefresh', body).onclick = reload; $('#gpRoute', body).onchange = reload;
      } else if (tab === 'timeline') {
        body.innerHTML = `<div class="card card-b mb2"><div class="flex between mb1"><h3>🚛 Timeline งานหัวลาก</h3><button class="btn btn-p" id="hlAdd">อัปเดต Timeline</button></div>${hualakTimelineHtml(job, { header: true })}</div><div class="card card-b"><div class="flex between mb2"><h3>Timeline</h3>${canEdit && job.status !== 'CANCELLED' && job.status !== 'COMPLETED' ? '<button class="btn btn-p" id="tlAdd">+ UPDATE TIMELINE</button>' : (canEdit ? '<button class="btn" id="tlAdd">+ เพิ่มหมายเหตุ / ไฟล์</button>' : '')}</div>${timelineHtml(job.timeline, admin)}</div>`;
        const b = $('#tlAdd', body); if (b) b.onclick = () => timelineDialog(job, reload);
        $('#hlAdd', body).onclick = () => hualakDialog(job.id, reload);
        bindTimeline(body, job, reload);
      } else if (tab === 'docs') {
        body.innerHTML = `<div class="card card-b"><div class="flex between mb1"><h3>เอกสาร (${job.files.length})</h3>${canEdit && job.status !== 'CANCELLED' ? '<button class="btn btn-p" id="upBtn">+ แนบไฟล์</button>' : ''}</div><div class="flex flex-wrap mb1" id="dfTypes"><button class="chip active" data-t="">ทั้งหมด</button>${[...new Set(job.files.map((f) => f.file_type))].map((t) => `<button class="chip" data-t="${h(t)}">${h(t)}</button>`).join('')}</div><div id="dfList">${job.files.map((f) => T.fileRow(f, canEdit)).join('') || '<div class="empty">ยังไม่มีเอกสาร</div>'}</div></div>`;
        const u = $('#upBtn', body); if (u) u.onclick = async () => { const r = await T.uploadDialog(job.id); if (r) reload(); };
        T.bindFileRows(body, job.files, reload);
        $$('#dfTypes .chip', body).forEach((c) => c.onclick = () => { $$('#dfTypes .chip', body).forEach((x) => x.classList.toggle('active', x === c)); const t = c.dataset.t; $$('.filebox', body).forEach((row) => { const f = job.files.find((x) => x.id === row.dataset.fid); row.classList.toggle('hidden', !!t && f.file_type !== t); }); });
      } else if (tab === 'fuel') {
        const mlOpen = !['NEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'].includes(job.status);
        const mlBtns = !canEdit || job.status === 'CANCELLED' ? '' : m.start_mileage == null ? (mlOpen ? '<button class="btn btn-sm btn-p" id="mlStart">+ บันทึกไมล์เริ่มงาน</button>' : '<span class="xs muted" id="mlHint">บันทึกไมล์เริ่มงานได้หลังคนขับรับงาน</span>') : m.end_mileage == null ? '<button class="btn btn-sm btn-p" id="mlEnd">+ บันทึกไมล์จบงาน</button>' : '';
        body.innerHTML = `<div class="card card-b mb2 fj-veh" id="fjVeh"><div class="kv"><div class="k">งาน</div><div class="v b">${h(T.jobRef(job))}</div><div class="k">ทะเบียนหัว</div><div class="v">${h(job.license_plate || '-')}</div><div class="k">ทะเบียนหาง</div><div class="v">${h(job.trailer_plate || '-')}</div><div class="k">คนขับ</div><div class="v">${h(job.driver_name || '-')}</div></div><div class="xs muted mt1">รถ / คนขับ อ้างอิงจาก JOB นี้อัตโนมัติ</div></div>
          <div class="grid g2"><div class="card card-b"><div class="flex between mb1"><h3>ไมล์ / ระยะทาง</h3><div class="flex">${mlBtns}${admin ? '<button class="btn btn-sm" id="meEdit">✏️ แก้ไข (ADMIN)</button>' : ''}</div></div>
          ${m.warning_note ? `<div class="alert warn">${h(m.warning_note)}</div>` : ''}<div class="kv"><div class="k">สถานะไมล์</div><div class="v">${h(job.mileage_status)}</div><div class="k">ไมล์ก่อน</div><div class="v">${T.num(m.start_mileage)} กม. <span class="muted xs">${m.start_at ? T.fmtDT(m.start_at) : ''}</span></div><div class="k">ไมล์หลัง</div><div class="v">${T.num(m.end_mileage)} กม. <span class="muted xs">${m.end_at ? T.fmtDT(m.end_at) : ''}</span></div><div class="k">ระยะทาง</div><div class="v b" style="font-size:18px">${T.num(m.total_distance)} กม.</div><div class="k">น้ำมันรวม</div><div class="v">${T.num(job.fuel_liters, 2)} ลิตร</div><div class="k">ค่าน้ำมันรวม</div><div class="v">${T.num(job.fuel_amount, 2)} บาท</div><div class="k">กม./ลิตร</div><div class="v b" style="font-size:18px">${T.kml(job.km_per_liter)}</div></div>
          <div class="mt1 flex flex-wrap">${[m.start_mileage_image, m.end_mileage_image].map((fid, i) => { const f = job.files.find((x) => x.id === fid); return f ? `<button class="btn btn-sm" data-img="${f.id}">🖼 รูปไมล์${i ? 'หลัง' : 'ก่อน'}</button>` : ''; }).join('')}</div></div>
          <div class="card card-b"><div class="flex between mb1"><h3>น้ำมัน (${job.fuel.length})</h3>${canEdit && job.status !== 'CANCELLED' ? '<button class="btn btn-sm btn-p" id="fuAdd">+ เพิ่มรายการเติมน้ำมัน</button>' : ''}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันเวลา</th><th>ปั๊ม</th><th>ไมล์</th><th class="r">ลิตร</th><th class="r">บาท/ลิตร</th><th class="r">รวม</th><th>ใบเสร็จ</th><th></th></tr></thead><tbody>${job.fuel.map((f) => `<tr><td class="nowrap">${T.fmtDT(f.fuel_date)}</td><td>${h(f.fuel_station || '-')}<div class="xs muted">${h(f.fuel_type || '')}</div></td><td>${T.num(f.mileage)}</td><td class="r">${T.num(f.liters, 2)}</td><td class="r">${T.num(f.price_per_liter, 2)}</td><td class="r b">${T.num(f.total_amount, 2)}</td><td>${h(f.receipt_no || '-')} ${f.receipt_file ? `<button class="btn btn-sm" data-img="${f.receipt_file}">🧾</button>` : ''}</td><td class="nowrap">${admin || (canEdit && job.status !== 'COMPLETED') ? `<button class="btn btn-sm" data-fe="${f.id}">✏️</button> <button class="btn btn-sm btn-r" data-fd="${f.id}">🗑</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">ยังไม่มีรายการน้ำมัน</td></tr>'}</tbody>${job.fuel.length ? `<tfoot><tr><td colspan="3">รวม</td><td class="r">${T.num(job.fuel_liters, 2)}</td><td></td><td class="r">${T.num(job.fuel_amount, 2)}</td><td colspan="2"></td></tr></tfoot>` : ''}</table></div></div></div>`;
        const me = $('#meEdit', body); if (me) me.onclick = () => mileageEditDialog(job, reload);
        ['mlStart', 'mlEnd'].forEach((bid) => { const b = $('#' + bid, body); if (!b) return; const isStart = bid === 'mlStart';
          b.onclick = async () => { const v = await T.prompt(isStart ? 'บันทึกไมล์เริ่มงาน' : 'บันทึกไมล์จบงาน', `เลขไมล์ (กม.)${isStart ? '' : ' — ไมล์เริ่ม ' + T.num(m.start_mileage)}`); if (v == null) return; const n = Number(String(v).replace(/,/g, ''));
            if (!String(v).trim() || !isFinite(n) || n < 0) return T.toast('กรุณากรอกเลขไมล์เป็นตัวเลข', 'warn'); if (!isStart && n < Number(m.start_mileage)) return T.toast('ไมล์จบงานต้องมากกว่าหรือเท่ากับไมล์เริ่มงาน', 'err');
            try { T.loading(true); const r = await T.auth(isStart ? 'tnj_mileage_start' : 'tnj_mileage_end', { p_job_id: job.id, p_mileage: n, p_image_id: null, p_lat: null, p_lng: null }, { silent: true }); if (r && r.warning) T.toast(r.warning_note, 'warn', 7000); else T.toast(isStart ? 'บันทึกไมล์เริ่มงานแล้ว' : 'บันทึกไมล์จบงานแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } finally { T.loading(false); } }; });
        const fa = $('#fuAdd', body); if (fa) fa.onclick = () => fuelDialog(job, null, reload);
        $$('[data-fe]', body).forEach((b) => b.onclick = () => fuelDialog(job, job.fuel.find((x) => x.id === b.dataset.fe), reload));
        $$('[data-fd]', body).forEach((b) => b.onclick = async () => { const r = await T.prompt('ลบรายการน้ำมัน', 'เหตุผล'); if (!r) return; try { await T.auth('tnj_fuel_delete', { p_fuel_id: b.dataset.fd, p_reason: r }); T.toast('ลบแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } });
        $$('[data-img]', body).forEach((b) => b.onclick = () => { const f = job.files.find((x) => x.id === b.dataset.img); if (f) T.files.preview(f); });
      } else if (tab === 'audit') {
        let rows = []; try { rows = await T.auth('tnj_audit_list', { p_job_id: job.id }, { silent: true }); } catch (e) { rows = []; }
        body.innerHTML = `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันเวลา</th><th>ผู้แก้ไข</th><th>การกระทำ</th><th>ตาราง</th><th>ฟิลด์</th><th>ค่าเดิม</th><th>ค่าใหม่</th></tr></thead><tbody>${rows.map((a) => `<tr><td class="nowrap">${T.fmtDT(a.changed_at)}</td><td>${h(a.user_name || '-')}</td><td><span class="badge gray">${h(a.action)}</span></td><td class="xs">${h(a.table_name)}</td><td>${h(a.field || '-')}</td><td class="small">${h(a.old_value || '-')}</td><td class="small b">${h(a.new_value || '-')}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">ยังไม่มีประวัติแก้ไข</td></tr>'}</tbody></table></div></div>`;
      }
    };
    $$('#jdTabs button', root).forEach((b) => b.onclick = () => { tab = b.dataset.tab; $$('#jdTabs button', root).forEach((x) => x.classList.toggle('active', x === b)); if (opt.pageMode) history.replaceState(null, '', `#/jobs/${id}?tab=${tab}`); draw(); });
    $$('#jdActions [data-act]', root).forEach((b) => b.onclick = async () => {
      const a = b.dataset.act;
      if (a === 'assign') return assignDialog(job, reload);
      if (a === 'edit') { const pg = $('#page'); if (pg) { history.replaceState(null, '', `#/jobs/${job.id}`); pageJobForm(pg, job); } return; }
      if (a === 'resolve') { const n = await T.prompt('แก้ไขปัญหาแล้ว', 'บันทึกการแก้ไข'); if (n == null) return; try { await T.auth('tnj_problem_resolve', { p_job_id: job.id, p_note: n }); T.toast('กลับสู่สถานะปกติแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } return; }
      if (a === 'close') { const openCt = hlContainers(job).filter((c) => !ctClosed(job, c)); if (hlContainers(job).length > 1 && openCt.length) { T.toast(`ยังไม่สามารถปิด JOB ได้ เนื่องจากยังมี ${openCt.length} ตู้ที่ไม่จบงาน`, 'err', 6000); return; } const warn = !m.end_mileage ? '<div class="alert warn">⚠ งานนี้ยังไม่ได้บันทึกไมล์หลัง — ปิดงานได้ แต่จะติดสถานะ "ข้อมูลไม่ครบ"</div>' : ''; if (!(await T.confirm('ปิดงาน', warn + `ยืนยันปิดงาน <b>${h(T.jobRef(job))}</b> ?`, 'ปิดงาน', 'btn-navy'))) return; try { await T.auth('tnj_status_update', { p_job_id: job.id, p_status: 'COMPLETED' }); T.toast('ปิดงานแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } return; }
      if (a === 'cancel') { const r = await T.prompt('ยกเลิกงาน', 'เหตุผลการยกเลิก'); if (!r) return; try { await T.auth('tnj_job_cancel', { p_job_id: job.id, p_reason: r }); T.toast('ยกเลิกงานแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } }
    });
    draw();
    if (opt.pageMode) { T.subscribe('tnj:job:' + job.id, T.debounce(reload, 1200)); if (live) { T.subscribe('tnj:office', T.debounce((p) => { if (p && p.job_id === job.id) reload(); }, 1200)); T.subscribe('tnj:gps', T.debounce((p) => { if (p && p.job_id === job.id && tab === 'gps') reload(); }, 3000)); T.every('jobdetail', 60000, reload); } }
  }
  function timelineHtml(tl, admin) {
    if (!tl.length) return '<div class="empty">ยังไม่มี Timeline</div>';
    return `<ul class="tl">${tl.map((t) => `<li class="${h(t.event_type)}" data-tl="${t.id}"><div class="flex flex-wrap"><span class="t">${T.fmtDT(t.event_at)}</span><span class="ttl">${h(t.title)}</span>${t.status ? T.badge(t.status) : ''}</div><div class="meta">${h(t.actor_name || '')} ${t.actor_role ? '(' + h(t.actor_role) + ')' : ''}${t.latitude != null ? ` · <a href="https://www.google.com/maps?q=${t.latitude},${t.longitude}" target="_blank" rel="noopener">📍 ตำแหน่ง</a>` : ''}${t.files && t.files.length ? ' · ' + t.files.map((f) => `<a href="#" data-tf="${f.id}">📎 ${h(f.file_name)}</a>`).join(' ') : ''}${admin ? ` · <a href="#" data-te="${t.id}">✏️</a>${t.event_type !== 'STATUS' ? ` <a href="#" data-td="${t.id}">🗑</a>` : ''}` : ''}</div>${t.note || t.problem_detail ? `<div class="note">${h(t.note || t.problem_detail)}</div>` : ''}</li>`).join('')}</ul>`;
  }
  function bindTimeline(root, job, reload) {
    $$('[data-tf]', root).forEach((a) => a.onclick = (e) => { e.preventDefault(); const f = job.files.find((x) => x.id === a.dataset.tf); if (f) T.files.preview(f); });
    $$('[data-te]', root).forEach((a) => a.onclick = (e) => { e.preventDefault(); const t = job.timeline.find((x) => x.id === a.dataset.te); T.modal({ title: 'แก้ไข Timeline (บันทึก Audit)', size: 's', body: `<div class="field"><label>เวลา</label><input type="datetime-local" class="inp" id="teAt" value="${T.toISODateTimeLocal(new Date(t.event_at))}"></div><div class="field"><label>หมายเหตุ</label><textarea class="inp" id="teNote">${h(t.note || '')}</textarea></div>`, foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="teGo">บันทึก</button>`, onOpen: (el, close) => { $('#teGo', el).onclick = async () => { try { await T.auth('tnj_timeline_edit', { p_timeline_id: t.id, p_note: $('#teNote', el).value.trim() || null, p_event_at: new Date($('#teAt', el).value).toISOString() }); T.toast('บันทึกแล้ว', 'ok'); close(); reload(); } catch (er) { T.err(er); } }; } }); });
    $$('[data-td]', root).forEach((a) => a.onclick = async (e) => { e.preventDefault(); const r = await T.prompt('ลบรายการ Timeline', 'เหตุผล'); if (!r) return; try { await T.auth('tnj_timeline_delete', { p_timeline_id: a.dataset.td, p_reason: r }); T.toast('ลบแล้ว', 'ok'); reload(); } catch (er) { T.err(er); } });
  }

  /* ---------- full map ---------- */
  // 🗺️ แผนที่ GPS — ข้อมูลเดิม: tnj_live_vehicles (ตำแหน่งล่าสุด) + tnj_gps_route (GPS History ของ JOB ที่รถกำลังวิ่ง) + Master รถ · ไม่สร้างพิกัดเอง
  const GM_ST = { run: ['🟢', 'กำลังวิ่ง', 'run'], park: ['🟠', 'จอด', 'park'], off: ['⚪', 'Offline', 'off'] };
  const gmSt = (lv) => { if (!lv || lv.lat == null || lv.gps_stale) return 'off'; return (Number(lv.speed || 0) * 3.6) >= 1 ? 'run' : 'park'; };
  const gmIcon = (plate, st, sel) => L.divIcon({ className: 'truck-marker gm-mk', html: `<div class="gm-pin ${st}${sel ? ' sel' : ''}"><div class="gm-plate">${h(plate)}</div><div class="gm-truck">🚛</div></div>`, iconSize: [96, 52], iconAnchor: [48, 52], popupAnchor: [0, -50] });
  const gmTime = (t) => { if (!t) return '-'; const b = bkk(t), today = bkk(new Date(Date.now() + (T.server.offsetMs || 0)).toISOString()).date; return b.date === today ? b.time : `${hlDMY(b.date)} ${b.time}`; };
  async function pageMap(page) {
    await loadMasters(); // ดูอย่างเดียว: ใช้ Cache 60 วิ (หน้าจัดการข้อมูล/ฟอร์ม ยังโหลดใหม่ทุกครั้ง)
    page.innerHTML = `<div class="page-head"><h1>แผนที่ GPS</h1><div class="flex flex-wrap gm-bar"><label class="gm-lbl" for="gmPlate">ทะเบียนรถ</label><select class="inp" id="gmPlate"><option value="">ทั้งหมด</option></select><span class="small muted" id="gmUpd"></span></div></div>
      <div class="gm-wrap"><div class="card gm-mapcard"><div class="map tall" id="gmMap"></div><div class="small muted gm-route" id="gmRoute"></div></div>
      <div class="card gm-side"><div class="gm-sum" id="gmSum"></div><div id="gmList"></div></div></div>`;
    const map = mkMap($('#gmMap')); const layer = L.layerGroup().addTo(map), rLayer = L.layerGroup().addTo(map); const mk = {}; let rows = [], sel = '', fitted = false, routeJob = null;
    const popup = (x) => { const lv = x.live || {}; const [ic, lb] = GM_ST[x.st]; return `<div class="gm-pop"><div><span class="muted">ทะเบียน:</span> <b>${h(x.plate)}</b></div><div><span class="muted">คนขับ:</span> ${h(x.driver || '-')}</div><div><span class="muted">สถานะ:</span> ${ic} ${lb}</div><div><span class="muted">ความเร็ว:</span> ${lv.lat != null ? Math.round(Number(lv.speed || 0) * 3.6) + ' กม./ชม.' : '-'}</div>
      <div><span class="muted">ตำแหน่งล่าสุด:</span> ${lv.lat != null ? `<a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${lv.lat},${lv.lng}">${Number(lv.lat).toFixed(5)}, ${Number(lv.lng).toFixed(5)}</a>` : '-'}</div><div><span class="muted">อัปเดตล่าสุด:</span> ${gmTime(lv.last_gps_at)}</div>${lv.job_id ? `<div><span class="muted">งาน:</span> <a href="#/jobs/${lv.job_id}">${h(lv.customer_name || 'ดูงาน')}</a></div>` : ''}
      <button type="button" class="btn btn-sm btn-p gm-rt" data-route="${h(x.plate)}">ดูเส้นทาง</button></div>`; };
    const drawRoute = async () => {
      rLayer.clearLayers(); const x = rows.find((r) => r.plate === sel); const info = $('#gmRoute'); if (!info) return;
      if (!x) { routeJob = null; info.textContent = ''; return; }
      if (!x.live || !x.live.job_id) { routeJob = null; info.textContent = `${x.plate}: ไม่มีงานที่กำลังวิ่ง — ไม่มีประวัติเส้นทาง GPS`; return; }
      routeJob = x.live.job_id; let r; try { r = await T.auth('tnj_gps_route', { p_job_id: routeJob }, { silent: true }); } catch (e) { info.textContent = T.parseErr(e).text; return; }
      if (sel !== x.plate || !$('#gmRoute')) return; rLayer.clearLayers(); const pts = (r.points || []).map((p) => [p.lat, p.lng]);
      if (pts.length) { L.polyline(pts, { color: '#1E6FE8', weight: 4, opacity: .85 }).addTo(rLayer);
        (r.points || []).forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 3, color: '#1E6FE8', fillOpacity: .9, weight: 1 }).bindTooltip(`${gmTime(p.t)}${p.speed != null ? ' · ' + Math.round(p.speed * 3.6) + ' กม./ชม.' : ''}`).addTo(rLayer));
        L.marker(pts[0], { icon: L.divIcon({ className: 'truck-marker', html: '<div class="gm-start">เริ่ม</div>', iconSize: [40, 20], iconAnchor: [20, 10] }) }).bindTooltip(`จุดเริ่มต้น · ${gmTime(r.points[0].t)}`).addTo(rLayer); }
      info.textContent = pts.length ? `เส้นทาง ${x.plate} · ${x.live.customer_name || ''} ${x.live.container_no || ''} · จุด GPS ${pts.length} จุด · เริ่ม ${gmTime(r.points[0].t)} → ล่าสุด ${gmTime(r.points[pts.length - 1].t)}` : `${x.plate}: ยังไม่มีประวัติ GPS ของงานนี้`;
    };
    const focus = (plate, fromList) => { sel = plate || ''; $('#gmPlate').value = sel; Object.entries(mk).forEach(([p, m]) => { const x = rows.find((r) => r.plate === p); if (x) m.setIcon(gmIcon(p, x.st, p === sel)); });
      if (!sel) { const pts = Object.values(mk).map((m) => m.getLatLng()); if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 }); map.closePopup(); }
      else { const m = mk[sel]; if (m) { map.setView(m.getLatLng(), 15); m.openPopup(); } else if (fromList !== false) T.toast(`ไม่มีตำแหน่ง GPS ของ ${sel}`, 'warn'); }
      drawList(); drawRoute(); };
    const drawList = () => { if (!$('#gmList')) return; const cnt = { run: 0, park: 0, off: 0 }; rows.forEach((x) => cnt[x.st]++);
      $('#gmSum').innerHTML = `<span class="m-chip all">ทั้งหมด ${rows.length}</span><span class="m-chip on">🟢 กำลังวิ่ง ${cnt.run}</span><span class="m-chip park">🟠 จอด ${cnt.park}</span><span class="m-chip">⚪ Offline ${cnt.off}</span>`;
      $('#gmList').innerHTML = rows.map((x) => { const [ic, lb, cl] = GM_ST[x.st]; const lv = x.live || {};
        return `<div class="gm-item${x.plate === sel ? ' active' : ''}" data-plate="${h(x.plate)}"><div class="gm-ip">${h(x.plate)}</div><div class="small">${h(x.driver || '-')}</div><div class="small"><span class="gm-st ${cl}">${ic} ${lb}</span>${x.st === 'run' ? ` · ${Math.round(Number(lv.speed || 0) * 3.6)} กม./ชม.` : ''}</div><div class="xs muted">${lv.lat != null ? 'อัปเดต ' + gmTime(lv.last_gps_at) : 'ไม่มีข้อมูล GPS ล่าสุด'}</div></div>`; }).join('') || '<div class="empty">ไม่มีรถ</div>';
      $$('#gmList .gm-item').forEach((c) => c.onclick = () => focus(c.dataset.plate)); };
    const load = async () => { try {
      const d = await T.auth('tnj_live_vehicles', {}, { silent: true }); if (!$('#gmList')) return; T.server.offsetMs = new Date(d.server_time).getTime() - Date.now();
      const live = d.vehicles || []; const drvOf = (vid) => (M.drivers.find((x) => x.default_vehicle_id === vid) || {}).full_name;
      const lvOf = (plate) => live.filter((x) => x.license_plate === plate).sort((a, b) => String(b.last_gps_at || '').localeCompare(String(a.last_gps_at || '')))[0];
      rows = M.vehicles.map((v) => { const lv = lvOf(v.license_plate); return { plate: v.license_plate, driver: (lv && lv.driver_name) || drvOf(v.id) || '', live: lv, st: gmSt(lv) }; });
      live.filter((lv) => lv.license_plate && !rows.some((x) => x.plate === lv.license_plate)).forEach((lv) => rows.push({ plate: lv.license_plate, driver: lv.driver_name, live: lvOf(lv.license_plate), st: gmSt(lvOf(lv.license_plate)) }));
      rows.sort((a, b) => a.plate.localeCompare(b.plate));
      const opt = $('#gmPlate'); const cur = opt.value; opt.innerHTML = '<option value="">ทั้งหมด</option>' + rows.map((x) => `<option value="${h(x.plate)}">${h(x.plate)}</option>`).join(''); opt.value = rows.some((x) => x.plate === cur) ? cur : '';
      // Marker เดิมเลื่อนไปตำแหน่งใหม่ (setLatLng) — ไม่สร้างใหม่ / ไม่ Reload หน้า
      const seen = new Set();
      rows.forEach((x) => { const lv = x.live; if (!lv || lv.lat == null) return; seen.add(x.plate); const ll = [lv.lat, lv.lng];
        if (mk[x.plate]) { mk[x.plate].setLatLng(ll); mk[x.plate].setIcon(gmIcon(x.plate, x.st, x.plate === sel)); mk[x.plate].setPopupContent(popup(x)); if (mk[x.plate].isPopupOpen()) bindPop(mk[x.plate].getPopup()); }
        else mk[x.plate] = L.marker(ll, { icon: gmIcon(x.plate, x.st, x.plate === sel), title: x.plate }).bindPopup(popup(x), { minWidth: 220 }).addTo(layer); });
      Object.keys(mk).forEach((p) => { if (!seen.has(p)) { layer.removeLayer(mk[p]); delete mk[p]; } });
      const pts = Object.values(mk).map((m) => m.getLatLng()); if (!fitted && pts.length && !sel) { fitted = true; map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 }); }
      $('#gmUpd').textContent = `อัปเดตล่าสุด ${gmTime(d.server_time)} น.`;
      drawList(); if (sel) { const x = rows.find((r) => r.plate === sel); if (x && x.live && x.live.job_id === routeJob) drawRoute(); else if (x) drawRoute(); }
    } catch (e) { console.warn(e); } };
    function bindPop(pp) { const el = pp && pp.getElement(); const b = el && el.querySelector('[data-route]'); if (b) b.onclick = () => focus(b.dataset.route); }
    map.on('popupopen', (e) => bindPop(e.popup));
    $('#gmPlate').onchange = (e) => focus(e.target.value);
    T.gpsMap = { reload: load, focus };
    await load(); T.subscribe('tnj:gps', T.debounce(load, 1500)); T.subscribe('tnj:office', T.debounce(load, 1500)); T.every('gpsmap', 15000, load);
  }

  /* ---------- schedule ---------- */
  async function pageSchedule(page, r) {
    await loadMasters(); const start = r.q.from || T.todayISO(); const d0 = new Date(start); const d1 = new Date(d0); d1.setDate(d1.getDate() + 6); const to = r.q.to || `${d1.getFullYear()}-${T.pad(d1.getMonth() + 1)}-${T.pad(d1.getDate())}`;
    page.innerHTML = `<div class="page-head"><h1>ตารางงาน</h1><div class="flex"><input type="date" class="inp" id="scFrom" value="${start}"><span>ถึง</span><input type="date" class="inp" id="scTo" value="${to}"><select class="inp" id="scDrv">${opts(M.drivers, 'id', 'full_name', r.q.driver_id, 'คนขับทั้งหมด')}</select><button class="btn btn-p" id="scGo">แสดง</button></div></div><div id="scBody"></div>`;
    $('#scGo').onclick = () => T.go(`schedule?from=${$('#scFrom').value}&to=${$('#scTo').value}&driver_id=${$('#scDrv').value}`);
    const load = async () => { try { const d = await T.auth('tnj_job_list', { p: { date_from: start, date_to: to, driver_id: r.q.driver_id || '', page_size: 500 } }, { silent: true }); const by = {}; d.rows.forEach((j) => { (by[j.pickup_date || j.job_date] = by[j.pickup_date || j.job_date] || []).push(j); }); const days = Object.keys(by).sort();
      $('#scBody').innerHTML = days.length ? days.map((day) => `<div class="card mb2"><div class="card-h"><h3>📅 ${T.fmtD(day)} <span class="muted small">(${by[day].length} งาน)</span></h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>เวลารับ</th><th>ลูกค้า</th><th>Container</th><th>ท่ารับ</th><th>โรงงาน (เวลา)</th><th>คืนตู้ (เวลา)</th><th>รถ / คนขับ</th><th>Status</th></tr></thead><tbody>${by[day].sort((a, b) => String(a.pickup_time).localeCompare(String(b.pickup_time))).map((j) => `<tr class="click" data-job="${j.id}"><td class="b">${T.fmtT(j.pickup_time)}</td><td>${h(j.customer_name)}</td><td>${h(j.container_no || '-')}</td><td>${h(j.pickup_location_text)}</td><td>${h(j.factory_location_text)} ${j.factory_time ? '(' + T.fmtT(j.factory_time) + ')' : ''}</td><td>${h(j.return_location_text)} (${T.fmtD(j.return_date)} ${T.fmtT(j.return_time)})</td><td>${h(j.license_plate || '-')} / ${h(j.driver_name || '-')}</td><td>${T.badge(j.status)}</td></tr>`).join('')}</tbody></table></div></div>`).join('') : '<div class="empty">ไม่มีงานในช่วงวันที่เลือก</div>'; bindJobRows($('#scBody')); } catch (e) { T.err(e); } };
    load(); T.subscribe('tnj:office', T.debounce(load, 1500));
  }

  /* ---------- ⛽ ไมล์รถ / น้ำมัน — Clone MODE Transport (ระบบ NJ Transport · ตาราง fuel_logs เดิม) ---------- */
  // สูตร/ค่าคงที่/ข้อความ ยกจาก Source ต้นแบบ (index.html: VEHICLES L2080, MIN_KPL L2091, kplStatus L2094, MNAMES L2105, fmt L2122, recalcEntry L2360, save L2492, updateStats L2593, groupByPlate L2757, buildMonthlyChart L2786, buildChart L2925, Excel L3257, openEdit L3397, calcFuel L3790)
  const FL_VEHICLES = [{ plate: '74-3116', driver: 'มนตรี' }, { plate: '74-2273', driver: 'ชัยวัตร' }, { plate: '74-3114', driver: 'สมบูรณ์' }, { plate: '74-2271', driver: 'เจนชัย' }, { plate: '74-2275', driver: 'น้อย' }];
  const FL_MIN_KPL = 3.00;
  const FL_PALETTE = ['#f5a623', '#4a9eff', '#3dba74', '#e05252', '#a855f7', '#ff6b6b', '#00d4aa'];
  const FL_MNAMES = { km_per_liter: 'กม./ลิตร', cost_per_km: 'บาท/กม.', distance_km: 'ระยะทางรวม (กม.)', total_cost: 'ต้นทุนน้ำมันรวม (บาท)', liters: 'ลิตรรวม', selling_price: 'ราคาขายรวม (บาท)', net_profit: 'กำไร/ขาดทุนสุทธิ (บาท)' };
  const FL_TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const FL_LIB = { chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', dl: 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js', xs: 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js' };
  const flFmt = (v, d = 2) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });
  const flGd = (p) => (FL_VEHICLES.find((v) => v.plate === p) || {}).driver || '';
  function flKplStatus(kpl) {
    const v = Number(kpl || 0); const diff = +(v - FL_MIN_KPL).toFixed(2);
    if (v <= 0) return { ok: null, icon: '—', text: 'รอข้อมูล', diff: 0, color: 'var(--muted)' };
    if (v >= FL_MIN_KPL) return { ok: true, icon: '✅', text: 'ผ่านเกณฑ์', diff, color: 'var(--green)' };
    return { ok: false, icon: '⚠️', text: 'ต่ำกว่าเกณฑ์', diff, color: 'var(--red)' };
  }
  const flBkkToday = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const flLoadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('โหลดไลบรารีไม่สำเร็จ (ตรวจอินเทอร์เน็ต): ' + src)); document.head.appendChild(s); });
  let flChartReady = null, flXS = null;
  // SheetJS (Export Excel) โหลดเมื่อกด Export ครั้งแรก — ไม่โหลดตอนเปิดระบบ (ไฟล์ ~880 KB)
  const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; let xlsxReady = null;
  const ensureXlsx = () => { if (window.XLSX && window.XLSX.utils) return Promise.resolve(window.XLSX); if (!xlsxReady) xlsxReady = flLoadScript(XLSX_URL).then(() => window.XLSX).catch((e) => { xlsxReady = null; throw e; }); return xlsxReady; };
  function flEnsureChart() {
    if (!flChartReady) flChartReady = (async () => {
      if (!window.Chart) await flLoadScript(FL_LIB.chart);
      if (!window.ChartDataLabels) await flLoadScript(FL_LIB.dl);
      Chart.register(ChartDataLabels);
      Chart.register({ id: 'minKplLine', afterDatasetsDraw(chart, args, opts) {
        if (!opts || !opts.show) return; const value = opts.value || 3.00; const isH = chart.options.indexAxis === 'y'; const { ctx, chartArea, scales } = chart; const vs = isH ? scales.x : scales.y; if (!vs) return; const pos = vs.getPixelForValue(value);
        ctx.save(); ctx.strokeStyle = 'rgba(224,82,82,.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath();
        if (isH) { ctx.moveTo(pos, chartArea.top); ctx.lineTo(pos, chartArea.bottom); } else { ctx.moveTo(chartArea.left, pos); ctx.lineTo(chartArea.right, pos); } ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = 'rgba(224,82,82,.95)'; ctx.font = "bold 10px 'Sarabun',sans-serif"; const text = `เกณฑ์ขั้นต่ำ ${value.toFixed(2)} กม./ลิตร`; const tw = ctx.measureText(text).width;
        if (isH) ctx.fillText(text, pos + 4, chartArea.top + 12); else ctx.fillText(text, chartArea.right - tw - 6, pos - 4); ctx.restore(); } });
    })().catch((e) => { flChartReady = null; throw e; });
    return flChartReady;
  }
  async function flEnsureXlsxStyle() { // xlsx-js-style แยกจาก SheetJS เดิมของระบบ (คืนค่า window.XLSX เดิม)
    if (flXS) return flXS; const orig = window.XLSX; try { await flLoadScript(FL_LIB.xs); flXS = window.XLSX; } finally { window.XLSX = orig; } return flXS;
  }
  // ฟอร์มบันทึก/แก้ไข (field เดียวกับ Source: f_* / e_*)
  function flFormHtml(px, edit) {
    const plateOpts = `<option value="">-- เลือกทะเบียน --</option>` + FL_VEHICLES.map((v) => `<option value="${v.plate}">${v.plate} (${v.driver})</option>`).join('');
    const cc = edit ? `<div class="inline-row"><div class="field"><label>ชื่อบริษัท</label><input class="inp" id="${px}_company" placeholder="เช่น บริษัท ABC จำกัด"></div><div class="field"><label>เบอร์ตู้</label><input class="inp" id="${px}_container" placeholder="เช่น TCNU1234567"></div></div>` : `<input type="hidden" id="${px}_company" value=""><input type="hidden" id="${px}_container" value="">`;
    return `<input type="hidden" id="${px}_runno">${edit ? `<input type="hidden" id="${px}_id">` : ''}<input type="hidden" id="${px}_cost_total">${cc}
      <div class="inline-row"><div class="field"><label>ทะเบียนรถ <span class="req">*</span></label><select class="inp" id="${px}_plate">${plateOpts}</select></div><div class="field"><label>ผู้ขับ <span class="req">*</span></label><input class="inp ro" id="${px}_driver" readonly></div><div class="field"><label>วันที่ <span class="req">*</span></label><input type="date" class="inp" id="${px}_date"></div></div>
      <div class="inline-row"><div class="field"><label>สถานที่วิ่ง</label><input class="inp" id="${px}_route" list="flRouteList" placeholder="พิมพ์หรือเลือกสถานที่..."></div><div class="field"><label>Job / BL</label><input class="inp" id="${px}_job" placeholder="เลข Job หรือ BL"></div></div>
      <div class="inline-row"><div class="field"><label>ไมล์ก่อนเติม</label><input type="number" class="inp" id="${px}_mb"></div><div class="field"><label>ไมล์หลังเติม</label><input type="number" class="inp" id="${px}_ma"></div><div class="field"><label>ระยะทาง (กม.) ⚡ อัตโนมัติ</label><input class="inp ro" id="${px}_dist" readonly></div></div>
      <div class="inline-row"><div class="field"><label>ราคารวมน้ำมัน (บาท)</label><input type="number" step="0.01" class="inp" id="${px}_tc"></div><div class="field"><label>ราคาต่อลิตร (บาท)</label><input type="number" step="0.01" class="inp" id="${px}_ppl"></div><div class="field"><label>จำนวนลิตร ⚡ อัตโนมัติ</label><input type="number" class="inp ro" id="${px}_lt" readonly></div></div>
      <div class="inline-row" style="display:none"><div class="field"><label>ราคาขาย (บาท)</label><input type="number" class="inp" id="${px}_sell"></div><div class="field"><label>ค่าใช้จ่ายอื่น (บาท)</label><input type="number" class="inp" id="${px}_other"></div></div>
      <div class="inline-row" style="display:none"><div class="field"><label>เงินล่วงหน้า (บาท)</label><input type="number" class="inp" id="${px}_adv"></div><div class="field"><label>ค่าเที่ยว (บาท)${edit ? ' 10%' : ''}</label><input type="number" class="inp" id="${px}_trip"></div></div>
      <div class="fl-kpl" id="${px}_kpl_box"><div class="xs muted">สถานะ กม./ลิตร — เกณฑ์ขั้นต่ำ 3.00</div><div class="flex between"><div id="${px}_kpl_status">— รอข้อมูล</div><div class="fl-kpl-v" id="${px}_kpl_val">—</div></div></div>
      <div class="field mt1"><label id="${px}_net_label">⚡ ยอดสุทธิ (บาท)</label><input class="inp ro" id="${px}_net" readonly></div>
      <div class="field"><label>หมายเหตุ</label><textarea class="inp" id="${px}_note" rows="1"></textarea></div>
      <div class="alert err hidden" id="${px}_err"></div><datalist id="flRouteList"></datalist>`;
  }
  function flUpdateKplBox(root, px, kpl) {
    const box = $('#' + px + '_kpl_box', root), status = $('#' + px + '_kpl_status', root), valEl = $('#' + px + '_kpl_val', root); if (!box || !status || !valEl) return;
    if (!kpl || kpl <= 0) { valEl.textContent = '—'; valEl.style.color = 'var(--muted)'; status.textContent = '— รอข้อมูล'; status.style.color = 'var(--muted)'; box.style.background = '#F7F9FC'; box.style.borderColor = 'var(--line)'; return; }
    const s = flKplStatus(kpl); valEl.textContent = kpl.toFixed(2); valEl.style.color = s.color; const diffStr = (s.diff >= 0 ? '+' : '') + s.diff.toFixed(2);
    status.innerHTML = `${s.icon} ${s.text} <b>${kpl.toFixed(2)}</b> กม./ลิตร <span class="muted small">(${diffStr} จากเกณฑ์)</span>`; status.style.color = s.color;
    if (s.ok) { box.style.background = 'rgba(61,186,116,.08)'; box.style.borderColor = 'rgba(61,186,116,.3)'; } else { box.style.background = 'rgba(224,82,82,.10)'; box.style.borderColor = 'rgba(224,82,82,.45)'; }
  }
  // recalcEntry (px='f') / recalcEdit (px='e' — + ค่าเที่ยว 10% ปัดลง)
  function flRecalc(root, px) {
    const n = (k) => Number($('#' + px + '_' + k, root).value); const mb = n('mb'), ma = n('ma'), tc = n('tc'), ppl = n('ppl'), sell = n('sell'), oth = n('other');
    $('#' + px + '_dist', root).value = ma > mb ? (ma - mb).toFixed(2) : '';
    $('#' + px + '_lt', root).value = tc > 0 && ppl > 0 ? (tc / ppl).toFixed(2) : '';
    const dist = ma > mb ? ma - mb : 0; const lt = (tc > 0 && ppl > 0) ? tc / ppl : 0; const kpl = lt > 0 ? dist / lt : 0; flUpdateKplBox(root, px, kpl);
    if (px === 'e') { const tripFee = sell > 0 ? Math.floor(sell * 0.10) : 0; $('#e_trip', root).value = tripFee > 0 ? tripFee : ''; }
    const costTotal = tc + oth; $('#' + px + '_cost_total', root).value = costTotal > 0 ? costTotal.toFixed(2) : '';
    const el = $('#' + px + '_net', root), lb = $('#' + px + '_net_label', root);
    if (sell > 0 || costTotal > 0) { const net = sell - costTotal; el.value = net.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); el.style.color = net >= 0 ? 'var(--green)' : 'var(--red)'; if (lb) lb.style.color = net >= 0 ? 'var(--green)' : 'var(--red)'; } else el.value = '';
  }
  // payload เดียวกับ Source (insert: trim route/job/note · edit: ไม่ trim ตาม Source)
  function flPayload(root, px, trim) {
    const g = (k) => $('#' + px + '_' + k, root).value; const N = (k) => Number(g(k)) || 0;
    const mb = N('mb'), ma = N('ma'), tc = N('tc'), ppl = N('ppl'); let lt = N('lt'); if (lt <= 0 && tc > 0 && ppl > 0) lt = +(tc / ppl).toFixed(2);
    const dist = (ma > mb) ? +(ma - mb).toFixed(2) : 0; const kpl = (lt > 0 && dist > 0) ? +(dist / lt).toFixed(2) : 0; const cpk = (dist > 0 && tc > 0) ? +(tc / dist).toFixed(2) : 0;
    const sell = N('sell'), oth = N('other'), adv = N('adv'), trip = N('trip'); const t = (v) => (trim ? v.trim() : v);
    return { fuel_date: g('date'), plate_no: g('plate'), driver_name: g('driver'), route_location: t(g('route')), job_bl: t(g('job')), company_name: g('company').trim(), container_no: g('container').trim(),
      mileage_before: mb, mileage_after: ma, distance_km: dist, liters: lt, price_per_liter: ppl, total_cost: tc, km_per_liter: kpl, cost_per_km: cpk,
      selling_price: sell, other_expenses: oth, advance_payment: adv, trip_fee: trip, net_profit: +(sell - tc - oth - trip).toFixed(2), note: t(g('note')) };
  }
  // ช่องค้นหาใต้หัว Column (กติกาเว็บ NJ) — ตารางครบ 18 Column ของ Source
  const FL_COLS = [['fuel_date', 'วันที่', 'd'], ['plate_no', 'ทะเบียน', 't'], ['driver_name', 'ผู้ขับ', 't'], ['company_name', 'ชื่อบริษัท', 't'], ['container_no', 'เบอร์ตู้', 't'], ['route_location', 'สถานที่', 't'], ['job_bl', 'Job/BL', 't'],
    ['mileage_before', 'ไมล์ก่อน', 'n', 0], ['mileage_after', 'ไมล์หลัง', 'n', 0], ['distance_km', 'ระยะ(กม.)', 'n', 2], ['liters', 'ลิตร', 'n', 2], ['price_per_liter', 'บาท/ลิตร', 'n', 2], ['total_cost', 'รวม(บาท)', 'n', 0],
    ['km_per_liter', 'กม./ลิตร', 'n', 2], ['cost_per_km', 'บาท/กม.', 'n', 2], ['note', 'หมายเหตุ', 't'], ['st', 'สถานะ', 's']];
  const flMatch = (r, F) => FL_COLS.every(([k, , t, d]) => {
    const s = (F[k] || '').trim(); if (!s) return true;
    if (t === 'd') return String(r.fuel_date || '').slice(0, 10) === s;
    if (t === 's') return flKplStatus(r.km_per_liter).text === s;
    const q = s.toLowerCase(); const v = r[k];
    return [v, t === 'n' && v != null ? flFmt(v, d) : null].some((x) => x != null && String(x).toLowerCase().includes(q));
  });
  async function pageFuel(page) {
    // รายงานไมล์ / น้ำมัน: ดู / ค้นหา / Filter / Export / วิเคราะห์ เท่านั้น — ไม่มีปุ่มเปิด/แก้/ลบรายการ (บันทึกใหม่ทำใน JOB → แท็บ ⛽ ไมล์รถ / น้ำมัน)
    const canAdd = false, canDel = false; const PAGE_SIZE = 20;
    const F = {}; FL_COLS.forEach(([k]) => { F[k] = ''; }); let ALL = [], RECS = [], pageNo = 1, maxId = null, routes = [];
    let chartInst = null, chartDir = 'x', chartMonthly = false, chartOpen = false;
    const STATS = [['fl_s_cpk', 'ต้นทุนเฉลี่ย', 'บาท / กม.', ''], ['fl_s_ppl', 'ราคาน้ำมันเฉลี่ย', 'บาท / ลิตร', ''], ['fl_s_kpl', 'เฉลี่ย กม./ลิตร', 'เกณฑ์ขั้นต่ำ 3.00', 'fl_sc_kpl_avg'], ['fl_s_below', 'ต่ำกว่าเกณฑ์', 'รายการ < 3.00', 'fl_sc_below'],
      ['fl_s_riskplate', 'ทะเบียนเสี่ยง', 'คันที่เฉลี่ย < 3.00', 'fl_sc_riskplate'], ['fl_s_dist', 'ระยะทางรวม', 'กิโลเมตร', ''], ['fl_s_lt', 'ลิตรรวม', 'ลิตร', ''], ['fl_s_tc', 'ค่าใช้จ่ายรวม', 'บาท', '']];
    page.innerHTML = `<div class="page-head"><h1>⛽ รายงานไมล์ / น้ำมัน</h1><a class="btn" href="#/jobs">‹ งานขนส่ง</a></div>
      <div class="card mb2" id="fjCard"><div class="card-h"><h3>ส่วนที่ 1 · ไมล์ / น้ำมัน จาก JOB <span class="muted small" id="fjCount"></span></h3><div class="flex flex-wrap"><input type="date" class="inp" id="fjFrom" style="width:auto"><input type="date" class="inp" id="fjTo" style="width:auto"><input class="inp" id="fjQ" placeholder="ค้นหา JOB / B/L / ทะเบียน / คนขับ" style="width:220px"><button class="btn btn-g" id="fjXls">📊 Excel</button></div></div>
        <div class="tbl-wrap"><table class="tbl" id="fjTbl"><thead><tr><th>วันที่</th><th>ลูกค้า</th><th>B/L</th><th>คนขับ</th><th>ทะเบียนหัว</th><th>ทะเบียนหาง</th><th class="r">ไมล์เริ่ม</th><th class="r">ไมล์จบ</th><th class="r">ระยะทาง</th><th class="r">ลิตร</th><th class="r">ค่าน้ำมัน</th><th class="r">บาท/ลิตร</th><th class="r">กม./ลิตร</th><th>สถานะไมล์</th><th></th></tr></thead><tbody id="fjBody"><tr><td colspan="15" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div>
      <div class="page-head fl-legacy-h"><h2>ส่วนที่ 2 · ข้อมูลระบบเดิม (fuel_logs) <span class="badge gray">ดูอย่างเดียว · ไม่มี JOB ต้นทาง</span></h2><div class="flex flex-wrap" id="flActs"><button class="btn" id="flCalc">⛽ คำนวณน้ำมัน</button>${canAdd ? '<button class="btn btn-p" id="flAdd">➕ บันทึกบิลขนส่ง</button>' : ''}<button class="btn" id="flReload">🔄 โหลดใหม่</button><button class="btn" id="flClear">↺ ล้างการค้นหา</button><button class="btn btn-g" id="flXls">📊 Excel</button><button class="btn btn-navy" id="flChartT">📊 แสดงกราฟ</button></div></div>
      <div class="fl-stats">${STATS.map(([id, l, u, cid]) => `<div class="stat fl-stat"${cid ? ` id="${cid}"` : ''}><div class="l">${l}</div><div class="v" id="${id}">-</div><div class="xs muted">${u}</div></div>`).join('')}</div>
      <div class="card card-b mb2 hidden" id="flChartBox"><div class="flex flex-wrap between mb1"><div class="flex flex-wrap"><select class="inp" id="flMetric" style="width:auto">${Object.entries(FL_MNAMES).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
          <button class="chip active" id="flVert">▐ แนวตั้ง</button><button class="chip" id="flHorz">━ แนวนอน</button><button class="chip active" id="flByPlate">🚛 ตามทะเบียน</button><button class="chip" id="flByMonth">📅 รายเดือน</button></div><button class="btn btn-sm" id="flSave">⬇ บันทึกกราฟ</button></div>
        <div class="fl-chart-wrap"><canvas id="flChart"></canvas></div></div>
      <div class="card"><div class="card-h"><h3 id="flTitle">ตารางข้อมูล <span class="muted small" id="flCount"></span></h3></div><div id="flList"></div><div class="pager" id="flPager"></div></div>`;
    // ---- summary (updateStats) ----
    const updateStats = (recs) => {
      const dist = recs.reduce((s, r) => s + Number(r.distance_km || 0), 0), lt = recs.reduce((s, r) => s + Number(r.liters || 0), 0), cost = recs.reduce((s, r) => s + Number(r.total_cost || 0), 0); const avgKpl = lt > 0 ? dist / lt : 0;
      $('#fl_s_cpk').textContent = flFmt(dist > 0 ? cost / dist : 0); $('#fl_s_ppl').textContent = flFmt(lt > 0 ? cost / lt : 0); $('#fl_s_kpl').textContent = flFmt(avgKpl);
      $('#fl_s_dist').textContent = flFmt(dist, 0); $('#fl_s_lt').textContent = flFmt(lt); $('#fl_s_tc').textContent = flFmt(cost, 0);
      const belowRecs = recs.filter((r) => { const v = Number(r.km_per_liter || 0); return v > 0 && v < FL_MIN_KPL; });
      const sB = $('#fl_s_below'); sB.textContent = flFmt(belowRecs.length, 0); sB.style.color = belowRecs.length > 0 ? 'var(--red)' : 'var(--green)';
      const plateAgg = {}; recs.forEach((r) => { const k = r.plate_no; if (!k) return; if (!plateAgg[k]) plateAgg[k] = { d: 0, l: 0, driver: r.driver_name || '' }; plateAgg[k].d += Number(r.distance_km || 0); plateAgg[k].l += Number(r.liters || 0); });
      const riskPlates = Object.entries(plateAgg).map(([plate, x]) => ({ plate, driver: x.driver, kpl: x.l > 0 ? x.d / x.l : 0 })).filter((p) => p.kpl > 0 && p.kpl < FL_MIN_KPL);
      const sR = $('#fl_s_riskplate'); sR.textContent = flFmt(riskPlates.length, 0); sR.style.color = riskPlates.length > 0 ? 'var(--red)' : 'var(--green)';
      $('#fl_sc_riskplate').title = riskPlates.length ? 'ทะเบียนที่ต่ำกว่าเกณฑ์:\n' + riskPlates.map((p) => `• ${p.plate} (${p.driver}) — ${p.kpl.toFixed(2)} กม./ลิตร`).join('\n') : 'ไม่มีทะเบียนที่ต่ำกว่าเกณฑ์';
      $('#fl_sc_below').title = belowRecs.length ? `${belowRecs.length} รายการที่ต่ำกว่าเกณฑ์ 3.00 กม./ลิตร — ดูรายละเอียดในตาราง` : 'ทุกรายการผ่านเกณฑ์';
      $('#fl_s_kpl').style.color = (avgKpl > 0 && avgKpl < FL_MIN_KPL) ? 'var(--red)' : 'var(--navy)';
    };
    // ---- table ----
    const frame = () => {
      // หน้ารายงาน: Header + ข้อมูลจริง (ไม่มีแถวช่องค้นหาใต้หัวตาราง)
      $('#flList').innerHTML = `<div class="tbl-wrap"><table class="tbl fl-tbl"><thead><tr>${FL_COLS.map(([, l, t]) => `<th${t === 'n' ? ' class="r"' : ''}>${l}</th>`).join('')}<th>JOB ต้นทาง</th></tr></thead><tbody id="flBody"></tbody></table></div>`;
    };
    const rowHtml = (r) => { const s = flKplStatus(r.km_per_liter); return `<tr data-fid="${r.id}"><td class="nowrap">${h(r.fuel_date)}</td><td><span class="badge blue">${h(r.plate_no)}</span></td><td class="nowrap">${h(r.driver_name)}</td><td>${h(r.company_name || '—')}</td><td class="mono" style="color:var(--blue)">${h(r.container_no || '—')}</td><td>${h(r.route_location || '—')}</td><td>${h(r.job_bl || '—')}</td>
      <td class="r">${flFmt(r.mileage_before, 0)}</td><td class="r">${flFmt(r.mileage_after, 0)}</td><td class="r b" style="color:var(--navy)">${flFmt(r.distance_km)}</td><td class="r">${flFmt(r.liters)}</td><td class="r">${flFmt(r.price_per_liter)}</td><td class="r b" style="color:var(--green)">${flFmt(r.total_cost, 0)}</td>
      <td class="r" style="${Number(r.km_per_liter) < FL_MIN_KPL ? 'color:var(--red);font-weight:700' : ''}">${flFmt(r.km_per_liter)}</td><td class="r">${flFmt(r.cost_per_km)}</td><td>${h(r.note || '—')}</td>
      <td class="nowrap"><span class="badge ${s.ok === true ? 'green' : s.ok === false ? 'red' : 'gray'}">${s.icon} ${s.text}</span></td><td class="nowrap">${!canAdd && !canDel ? '<span class="xs muted">ระบบเดิม · ไม่มี JOB</span>' : ''}${canAdd ? `<button class="btn btn-sm" data-eid="${r.id}">✏️ แก้ไข</button>` : ''}${canDel ? ` <button class="btn btn-sm btn-r" data-did="${r.id}">🗑️ ลบ</button>` : ''}</td></tr>`; };
    const renderTable = () => {
      if (!$('#flBody')) return; const pages = Math.max(1, Math.ceil(RECS.length / PAGE_SIZE)); pageNo = Math.min(Math.max(1, pageNo), pages);
      $('#flCount').textContent = `(${RECS.length} รายการ)`;
      const vis = RECS.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);
      $('#flBody').innerHTML = vis.length ? vis.map(rowHtml).join('') : `<tr><td colspan="${FL_COLS.length + 1}" class="empty">${ALL.length ? `ดึงข้อมูลได้ ${ALL.length} รายการ — แต่การค้นหาซ่อนหมด ลองกด ↺ ล้างการค้นหา` : 'ไม่พบข้อมูลในตาราง fuel_logs'}</td></tr>`;
      $$('#flBody [data-eid]').forEach((b) => b.onclick = () => openForm(ALL.find((x) => x.id === Number(b.dataset.eid))));
      $$('#flBody [data-did]').forEach((b) => b.onclick = async () => { if (!(await T.confirm('ลบรายการ', 'ยืนยันลบรายการนี้?', 'ยืนยันลบ', 'btn-r'))) return; try { await T.auth('tnj_fuel_logs_delete', { p_id: Number(b.dataset.did) }, { silent: true }); T.toast('ลบข้อมูลแล้ว', 'ok'); await renderAll(); } catch (e) { const p = T.parseErr(e); T.toast('ลบไม่สำเร็จ: ' + p.text, 'err'); } });
      $('#flPager').innerHTML = pages <= 1 ? `<span class="muted small">${RECS.length} รายการ</span>` : `<button class="btn btn-sm" id="flPrev" ${pageNo <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span class="muted small">หน้า ${pageNo}/${pages} · ${RECS.length} รายการ</span><button class="btn btn-sm" id="flNext" ${pageNo >= pages ? 'disabled' : ''}>ถัดไป ›</button>`;
      const pv = $('#flPrev'), nx = $('#flNext'); if (pv) pv.onclick = () => { pageNo--; renderTable(); }; if (nx) nx.onclick = () => { pageNo++; renderTable(); };
    };
    const apply = () => { if (!$('#flBody')) return; RECS = ALL.filter((r) => flMatch(r, F)); updateStats(RECS); renderTable(); if (chartOpen) buildChart(); };
    const renderAll = async () => {
      try { const d = await T.auth('tnj_fuel_logs_list', { p: {} }, { silent: true }); if (!$('#flList')) return; ALL = d.rows.map((r) => Object.assign({}, r, { id: Number(r.id) })); maxId = d.max_id; pageNo = 1; apply(); }
      catch (e) { T.err(e); }
    };
    const loadRoutes = async () => { try { routes = await T.auth('tnj_fuel_routes', {}, { silent: true }); } catch (_) { routes = []; } $$('#flRouteList').forEach((dl) => { dl.innerHTML = routes.map((x) => `<option value="${h(x)}">`).join(''); }); };
    // ---- chart (buildChart / buildMonthlyChart / groupByPlate) ----
    const groupByPlate = (recs) => { const map = {}; recs.forEach((r) => { const k = r.plate_no; if (!map[k]) map[k] = { plate: k, driver: r.driver_name, d: 0, l: 0, c: 0, s: 0, n: 0, trips: 0 }; map[k].d += Number(r.distance_km || 0); map[k].l += Number(r.liters || 0); map[k].c += Number(r.total_cost || 0); map[k].s += Number(r.selling_price || 0); map[k].n += Number(r.net_profit || 0); map[k].trips++; });
      return Object.values(map).map((x) => ({ label: `${x.plate}`, sublabel: x.driver, trips: x.trips, km_per_liter: x.l > 0 ? x.d / x.l : 0, cost_per_km: x.d > 0 ? x.c / x.d : 0, distance_km: x.d, total_cost: x.c, liters: x.l, selling_price: x.s, net_profit: x.n })); };
    const TICK = { color: '#4B5567', font: { family: "'Sarabun',sans-serif", size: 10 } }, GRID = { color: 'rgba(15,43,76,.07)' }, TIP = { backgroundColor: 'rgba(20,20,20,.95)', titleColor: '#f5a623', bodyColor: '#ccc', borderColor: '#333', borderWidth: 1, padding: 12 };
    const selPlates = () => { if (!F.plate_no.trim()) return []; const set = new Set(RECS.map((r) => r.plate_no)); const vp = FL_VEHICLES.map((v) => v.plate).filter((p) => set.has(p)); set.forEach((p) => { if (!vp.includes(p)) vp.push(p); }); return vp; }; // ค้นหาใต้ Column ทะเบียน = แทนตัวเลือกทะเบียนของ Source
    const buildMonthlyChart = (filtered, metric) => {
      const monthMap = {}; filtered.forEach((r) => { const month = (r.fuel_date || '').slice(0, 7); if (!month) return; const plate = r.plate_no; if (!monthMap[month]) monthMap[month] = {}; if (!monthMap[month][plate]) monthMap[month][plate] = { d: 0, l: 0, c: 0, s: 0, n: 0, trips: 0 }; const m = monthMap[month][plate]; m.d += Number(r.distance_km || 0); m.l += Number(r.liters || 0); m.c += Number(r.total_cost || 0); m.s += Number(r.selling_price || 0); m.n += Number(r.net_profit || 0); m.trips++; });
      const months = Object.keys(monthMap).sort(); if (chartInst) { chartInst.destroy(); chartInst = null; } if (!months.length) return;
      const platesInData = new Set(); Object.values(monthMap).forEach((mm) => Object.keys(mm).forEach((p) => platesInData.add(p))); const plates = FL_VEHICLES.filter((v) => platesInData.has(v.plate)).map((v) => v.plate);
      const fieldOf = { distance_km: 'd', liters: 'l', total_cost: 'c', selling_price: 's', net_profit: 'n' };
      const valueFor = (st) => { if (metric === 'km_per_liter') return st.l > 0 ? +(st.d / st.l).toFixed(2) : 0; if (metric === 'cost_per_km') return st.d > 0 ? +(st.c / st.d).toFixed(2) : 0; const f = fieldOf[metric]; return f ? +Number(st[f] || 0).toFixed(2) : 0; };
      const isAmount = ['distance_km', 'liters', 'total_cost', 'selling_price', 'net_profit'].includes(metric);
      const datasets = plates.map((plate, idx) => { const v = FL_VEHICLES.find((vv) => vv.plate === plate); return { label: `${plate}${v ? ` (${v.driver})` : ''}`, data: months.map((m) => monthMap[m][plate] ? valueFor(monthMap[m][plate]) : 0), backgroundColor: FL_PALETTE[idx % FL_PALETTE.length], borderRadius: 4, borderSkipped: false, borderWidth: 0, maxBarThickness: 38, stack: isAmount ? 'stack1' : undefined }; });
      const monthLabels = months.map((ms) => { const [y, mo] = ms.split('-'); const i = parseInt(mo, 10) - 1; return `${FL_TH_MONTHS[i] || mo} ${y.slice(2)}`; });
      chartInst = new Chart($('#flChart').getContext('2d'), { type: 'bar', data: { labels: monthLabels, datasets }, options: { indexAxis: chartDir, responsive: true, layout: { padding: { top: 20, right: 12 } }, maintainAspectRatio: true, aspectRatio: chartDir === 'x' ? 3.2 : 2.0,
        plugins: { legend: { display: true, position: 'top', align: 'end', labels: { color: '#4B5567', font: { family: "'Sarabun',sans-serif", size: 11 }, usePointStyle: true, pointStyle: 'rectRounded', padding: 10, boxWidth: 10 } }, minKplLine: { show: metric === 'km_per_liter', value: FL_MIN_KPL },
          datalabels: { display: (c) => { const v = c.dataset.data[c.dataIndex]; return v && Math.abs(v) > 0; }, anchor: 'center', align: 'center', color: '#fff', font: { family: "'IBM Plex Mono',monospace", size: 9, weight: '600' }, formatter: (v) => v ? Number(v).toLocaleString('th-TH', { maximumFractionDigits: 0 }) : '' },
          tooltip: Object.assign({}, TIP, { callbacks: { label: (item) => ` ${item.dataset.label}: ${flFmt(item.raw)}`, footer: (items) => { if (!isAmount) return ''; const total = items.reduce((s, i) => s + (i.raw || 0), 0); return `รวมเดือนนี้: ${flFmt(total)}`; } } }) },
        scales: { x: { stacked: isAmount, ticks: Object.assign({ maxRotation: 0 }, TICK), grid: GRID }, y: { stacked: isAmount, beginAtZero: true, ticks: TICK, grid: GRID } } } });
    };
    const buildChart = async () => {
      if (!chartOpen) return; try { await flEnsureChart(); } catch (e) { T.toast(e.message, 'err'); return; } if (!$('#flChart')) return;
      const metric = $('#flMetric').value; const sel = selPlates(); const isAll = sel.length === 0; const filtered = RECS;
      if (chartMonthly) return buildMonthlyChart(filtered, metric);
      const isSinglePlate = !isAll && sel.length === 1; let finalGroups;
      if (isSinglePlate) { const sorted = [...filtered].sort((a, b) => (a.fuel_date || '').localeCompare(b.fuel_date || '')); finalGroups = sorted.map((r) => ({ label: (r.fuel_date || '').slice(5), fullDate: r.fuel_date || '', sublabel: r.driver_name || '', route: r.route_location || '', trips: 1, km_per_liter: Number(r.km_per_liter || 0), cost_per_km: Number(r.cost_per_km || 0), distance_km: Number(r.distance_km || 0), total_cost: Number(r.total_cost || 0), liters: Number(r.liters || 0), selling_price: Number(r.selling_price || 0), net_profit: Number(r.net_profit || 0) })); }
      else { const gm = {}; groupByPlate(filtered).forEach((g) => { gm[g.label] = g; }); finalGroups = isAll ? Object.values(gm) : sel.map((plate) => { const v = FL_VEHICLES.find((x) => x.plate === plate); return gm[plate] || { label: plate, sublabel: v ? v.driver : '', trips: 0, km_per_liter: 0, cost_per_km: 0, distance_km: 0, total_cost: 0, liters: 0, selling_price: 0, net_profit: 0 }; }); }
      const labels = finalGroups.map((g) => g.label); const vals = finalGroups.map((g) => +Number(g[metric] || 0).toFixed(2)); const title = FL_MNAMES[metric] || metric;
      let bg; if (metric === 'net_profit') bg = vals.map((v) => v >= 0 ? 'rgba(61,186,116,.85)' : 'rgba(224,82,82,.85)');
      else if (metric === 'km_per_liter') bg = vals.map((v, i) => { if (v > 0 && v < FL_MIN_KPL) return 'rgba(224,82,82,.85)'; if (isSinglePlate) return '#f5a623'; return labels.length === 1 ? '#f5a623' : FL_PALETTE[i % FL_PALETTE.length]; });
      else if (isSinglePlate) bg = vals.map(() => '#f5a623'); else if (labels.length === 1) bg = ['#f5a623']; else bg = labels.map((_, i) => FL_PALETTE[i % FL_PALETTE.length]);
      if (chartInst) { chartInst.destroy(); chartInst = null; }
      chartInst = new Chart($('#flChart').getContext('2d'), { type: 'bar', data: { labels, datasets: [{ label: title, data: vals, backgroundColor: bg, borderRadius: 8, borderSkipped: false, borderWidth: 0, maxBarThickness: 32 }] },
        options: { indexAxis: chartDir, responsive: true, layout: { padding: { top: 20, right: 12 } }, maintainAspectRatio: true, aspectRatio: chartDir === 'x' ? 4.5 : 2.8,
          plugins: { legend: { display: false }, minKplLine: { show: metric === 'km_per_liter', value: FL_MIN_KPL },
            datalabels: { anchor: 'end', align: chartDir === 'x' ? 'top' : 'right', color: '#1B2430', font: { family: "'IBM Plex Mono',monospace", size: 10, weight: '600' }, formatter: (value) => { if (!value && value !== 0) return ''; return Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }, padding: { left: 4, right: 4, top: 2, bottom: 2 } },
            tooltip: Object.assign({}, TIP, { callbacks: { title: (items) => { const g = finalGroups[items[0].dataIndex]; return isSinglePlate ? (g && g.fullDate || items[0].label) : items[0].label; },
              label: (item) => { const g = finalGroups[item.dataIndex]; if (isSinglePlate) return [` ${title}: ${flFmt(item.raw)}`, ` ผู้ขับ: ${(g && g.sublabel) || '—'}`, ` เส้นทาง: ${(g && g.route) || '—'}`, ` ระยะ: ${flFmt((g && g.distance_km) || 0)} กม.`, ` ค่าน้ำมัน: ${flFmt((g && g.total_cost) || 0)} บาท`]; return [` ${title}: ${flFmt(item.raw)}`, ` ผู้ขับ: ${g ? g.sublabel : ''}`, ` เติมแล้ว ${g ? g.trips : 0} ครั้ง`]; } } }) },
          scales: { x: { ticks: Object.assign({ maxRotation: 0 }, TICK), grid: GRID }, y: { beginAtZero: true, ticks: TICK, grid: GRID } } } });
    };
    const seg = (on, off, fn) => { $(on).classList.add('active'); $(off).classList.remove('active'); fn(); buildChart(); };
    $('#flVert').onclick = () => seg('#flVert', '#flHorz', () => { chartDir = 'x'; }); $('#flHorz').onclick = () => seg('#flHorz', '#flVert', () => { chartDir = 'y'; });
    $('#flByPlate').onclick = () => seg('#flByPlate', '#flByMonth', () => { chartMonthly = false; }); $('#flByMonth').onclick = () => seg('#flByMonth', '#flByPlate', () => { chartMonthly = true; });
    $('#flMetric').onchange = () => buildChart();
    $('#flChartT').onclick = () => { chartOpen = !chartOpen; $('#flChartBox').classList.toggle('hidden', !chartOpen); $('#flChartT').textContent = chartOpen ? '✕ ซ่อนกราฟ' : '📊 แสดงกราฟ'; if (chartOpen) buildChart(); else if (chartInst) { chartInst.destroy(); chartInst = null; } };
    $('#flSave').onclick = () => { if (!chartInst) { T.toast('ไม่มีกราฟให้บันทึก', 'err'); return; } const a = document.createElement('a'); a.download = `nj-chart-${flBkkToday()}.png`; a.href = $('#flChart').toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); T.toast('บันทึกกราฟสำเร็จ ✓', 'ok'); };
    // ---- actions ----
    $('#flReload').onclick = async () => { T.toast('🔄 กำลังโหลดข้อมูลใหม่...'); await renderAll(); T.toast(`โหลดสำเร็จ ${ALL.length} รายการ ✓`, 'ok'); };
    $('#flClear').onclick = () => { Object.keys(F).forEach((k) => { F[k] = ''; }); $$('#flList [data-f]').forEach((i) => { i.value = ''; }); pageNo = 1; apply(); T.toast('ล้างการค้นหาแล้ว ✓', 'ok'); };
    $('#flCalc').onclick = () => T.modal({ title: '⛽ เครื่องคำนวณน้ำมัน', size: 's', body: `<div class="inline-row"><div class="field"><label>ระยะทาง (กม.)</label><input type="number" step="0.1" class="inp" id="c_dist" placeholder="เช่น 200"></div><div class="field"><label>กม. ต่อลิตร</label><input type="number" step="0.1" class="inp" id="c_kpl" placeholder="เช่น 5.5"></div><div class="field"><label>ราคาน้ำมัน (บาท/ลิตร)</label><input type="number" step="0.01" class="inp" id="c_price" placeholder="เช่น 29.50"></div></div>
        <div class="kv fl-calc"><div class="k">ลิตรที่ใช้</div><div class="v b" id="c_res_lt">—</div><div class="k">ค่าน้ำมัน (ราคาเต็ม)</div><div class="v b" id="c_res_cost">—</div><div class="k">80% ของราคา</div><div class="v b" id="c_res_half">—</div><div class="k">ค่าคนขับ (10%, ขั้นต่ำ 300)</div><div class="v b" id="c_res_driver">—</div><div class="k">ต้นทุน/กม.</div><div class="v b" id="c_res_cpk">—</div><div class="k">ต้นทุนรวม (น้ำมัน + คนขับ)</div><div class="v b" id="c_res_costtotal">—</div><div class="k">💰 ราคารวม (ขาย) (ค่าน้ำมัน + 80% + ค่าคนขับ)</div><div class="v b" id="c_res_total" style="color:var(--green)">—</div></div>`,
      foot: '<button class="btn" id="calcClearBtn">🗑 ล้างค่า</button><button class="btn" data-close>ปิด</button>',
      onOpen: (el) => { const fmtN = (v) => Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); const ids = ['c_res_lt', 'c_res_cost', 'c_res_half', 'c_res_driver', 'c_res_cpk', 'c_res_costtotal', 'c_res_total'];
        const calc = () => { const dist = Number($('#c_dist', el).value) || 0, kpl = Number($('#c_kpl', el).value) || 0, price = Number($('#c_price', el).value) || 0; if (!(dist > 0 && kpl > 0)) { ids.forEach((i) => { $('#' + i, el).textContent = '—'; }); return; }
          const liters = dist / kpl; const cost = liters * price; const half = cost * 0.8; const driver = cost > 0 ? Math.max(cost * 0.10, 300) : 0; const costTotal = cost + driver; const sellTotal = cost + half + driver;
          $('#c_res_lt', el).textContent = fmtN(liters) + ' ลิตร'; const pv = price > 0; $('#c_res_cost', el).textContent = pv ? fmtN(cost) + ' บาท' : '—'; $('#c_res_half', el).textContent = pv ? fmtN(half) + ' บาท' : '—'; $('#c_res_driver', el).textContent = pv ? fmtN(driver) + ' บาท' : '—'; $('#c_res_cpk', el).textContent = pv ? fmtN(price / kpl) + ' บาท/กม.' : '—'; $('#c_res_costtotal', el).textContent = pv ? fmtN(costTotal) + ' บาท' : '—'; $('#c_res_total', el).textContent = pv ? fmtN(sellTotal) + ' บาท' : '—'; };
        ['c_dist', 'c_kpl', 'c_price'].forEach((i) => $('#' + i, el).addEventListener('input', calc)); $('#calcClearBtn', el).onclick = () => { ['c_dist', 'c_kpl', 'c_price'].forEach((i) => { $('#' + i, el).value = ''; }); calc(); }; setTimeout(() => $('#c_dist', el).focus(), 30); } });
    // บันทึกบิลขนส่ง (insert) / แก้ไข (update รายการเดิม)
    const openForm = (r) => {
      const edit = !!r; const px = edit ? 'e' : 'f';
      T.modal({ title: edit ? '⛽ แก้ไขข้อมูลน้ำมัน' : '⛽ บันทึกข้อมูลน้ำมัน', size: 'w fl-modal', noMask: false, body: flFormHtml(px, edit),
        foot: edit ? '<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="flSaveE">💾 บันทึกการแก้ไข</button>' : '<button class="btn" id="flClr">🗑 ล้างฟอร์ม</button><button class="btn btn-p" id="flSaveF">💾 บันทึกข้อมูล</button>',
        onOpen: (el, close) => {
          const q = (k) => $('#' + px + '_' + k, el); loadRoutes();
          el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); });
          q('plate').onchange = () => { q('driver').value = flGd(q('plate').value); };
          ['mb', 'ma', 'tc', 'ppl', 'sell', 'other'].forEach((k) => q(k).addEventListener('input', () => flRecalc(el, px)));
          if (!edit) {
            q('date').value = flBkkToday(); q('runno').value = maxId != null ? '#' + (Number(maxId) + 1) : 'อัตโนมัติ';
            const clear = () => { ['plate', 'driver', 'route', 'job', 'mb', 'ma', 'dist', 'tc', 'ppl', 'lt', 'sell', 'other', 'adv', 'trip', 'net', 'note', 'cost_total'].forEach((k) => { q(k).value = ''; }); q('date').value = flBkkToday(); flUpdateKplBox(el, 'f', 0); };
            $('#flClr', el).onclick = clear;
            $('#flSaveF', el).onclick = async () => {
              const v = flPayload(el, 'f', true); const err = q('err'); err.classList.add('hidden');
              if (!v.fuel_date || !v.plate_no || !v.driver_name) { err.textContent = '⚠ กรุณากรอกวันที่ ทะเบียน และผู้ขับ'; err.classList.remove('hidden'); return; }
              try { T.loading(true); await T.auth('tnj_fuel_logs_save', { p_id: null, p: v }, { silent: true }); close(); T.toast('บันทึกเรียบร้อย ✓', 'ok'); await renderAll(); loadRoutes(); }
              catch (e) { err.textContent = '⚠ บันทึกไม่สำเร็จ: ' + T.parseErr(e).text; err.classList.remove('hidden'); } finally { T.loading(false); }
            };
          } else {
            q('id').value = r.id; q('runno').value = '#' + r.id; q('company').value = r.company_name || ''; q('container').value = r.container_no || ''; q('date').value = String(r.fuel_date || '').slice(0, 10); q('plate').value = r.plate_no; q('driver').value = r.driver_name;
            q('route').value = r.route_location || ''; q('job').value = r.job_bl || ''; q('mb').value = Number(r.mileage_before); q('ma').value = Number(r.mileage_after); q('lt').value = Number(r.liters);
            { const _tc = Number(r.total_cost), _ppl = Number(r.price_per_liter); if (_tc > 0 && _ppl > 0) q('lt').value = (_tc / _ppl).toFixed(2); }
            q('ppl').value = Number(r.price_per_liter); q('tc').value = Number(r.total_cost); q('sell').value = Number(r.selling_price) || ''; q('other').value = Number(r.other_expenses) || ''; q('adv').value = Number(r.advance_payment) || '';
            const _sellE = Number(r.selling_price || 0); q('trip').value = _sellE > 0 ? Math.floor(_sellE * 0.10) : (Number(r.trip_fee) || ''); q('note').value = r.note || '';
            const distV = Number(r.mileage_after) - Number(r.mileage_before); q('dist').value = distV > 0 ? distV.toFixed(2) : '—';
            const ct = Number(r.total_cost) + Number(r.other_expenses || 0); q('cost_total').value = ct > 0 ? ct.toFixed(2) : '';
            const net = Number(r.selling_price || 0) - ct; q('net').value = ct > 0 || Number(r.selling_price) ? net.toFixed(2) + ' บาท' : ''; q('net').style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
            flUpdateKplBox(el, 'e', Number(r.km_per_liter || 0));
            $('#flSaveE', el).onclick = async () => {
              const payload = flPayload(el, 'e', false);
              try { T.loading(true); await T.auth('tnj_fuel_logs_save', { p_id: Number(q('id').value), p: payload }, { silent: true }); close(); T.toast('แก้ไขข้อมูลแล้ว ✓', 'ok'); await renderAll(); }
              catch (e) { T.toast('แก้ไขไม่สำเร็จ: ' + T.parseErr(e).text, 'err'); } finally { T.loading(false); }
            };
          }
        } });
    };
    const ad = $('#flAdd'); if (ad) ad.onclick = () => openForm(null);
    // Excel (Fuel Report + Summary) — xlsx-js-style · ส่งออกทุกรายการตามการค้นหา (RECS ทุกหน้า) เหมือน Source
    $('#flXls').onclick = async () => {
      if (!RECS.length) { T.toast('ไม่มีข้อมูลสำหรับ Export', 'err'); return; }
      let X; try { T.loading(true); X = await flEnsureXlsxStyle(); } catch (e) { T.toast(e.message, 'err'); return; } finally { T.loading(false); }
      const data = RECS.map((r) => { const dist = Number(r.distance_km || 0), lt = Number(r.liters || 0), ppl = Number(r.price_per_liter || 0), tc = Number(r.total_cost || 0);
        const km_per_liter = lt > 0 ? dist / lt : 0; const expected_liters = FL_MIN_KPL > 0 ? dist / FL_MIN_KPL : 0; const excess_liters = Math.max(0, lt - expected_liters); const penalty = excess_liters * ppl;
        const status = (km_per_liter > 0 && km_per_liter < FL_MIN_KPL) ? 'ต้องหักเงิน' : 'ปกติ'; const adv = Number(r.advance_payment || 0), trip = Number(r.trip_fee || 0);
        return { 'วันที่': String(r.fuel_date || '').slice(0, 10), 'ทะเบียน': r.plate_no || '', 'คนขับ': r.driver_name || '', 'ระยะทาง (กม.)': +dist.toFixed(2), 'ลิตรจริง': +lt.toFixed(2), 'ราคาต่อลิตร': +ppl.toFixed(2), 'รวมเงิน': +tc.toFixed(2), 'เงินล่วงหน้า': +adv.toFixed(2), 'ค่าเที่ยว': +trip.toFixed(2),
          'กม./ลิตร': +km_per_liter.toFixed(2), 'ลิตรควรใช้': +expected_liters.toFixed(2), 'ลิตรเกิน': +excess_liters.toFixed(2), 'หักเงิน (บาท)': +penalty.toFixed(0), 'สถานะ': status }; });
      const SALARY_FIXED = 9300; const sm = {};
      RECS.forEach((r, i) => { const row = data[i]; const k = r.plate_no; if (!k) return; if (!sm[k]) sm[k] = { plate: r.plate_no, driver: r.driver_name || '', trips: 0, dist: 0, lt: 0, cost: 0, excess: 0, penalty: 0, below: 0, trip: 0, adv: 0 };
        sm[k].trips++; sm[k].dist += Number(r.distance_km || 0); sm[k].lt += Number(r.liters || 0); sm[k].cost += Number(r.total_cost || 0); sm[k].excess += row['ลิตรเกิน']; sm[k].penalty += row['หักเงิน (บาท)']; sm[k].trip += Number(r.trip_fee || 0); sm[k].adv += Number(r.advance_payment || 0); if (row['สถานะ'] === 'ต้องหักเงิน') sm[k].below++; });
      const summaryHeaders = ['ทะเบียน', 'คนขับ', 'จำนวนครั้ง', 'ระยะทางรวม (กม.)', 'ลิตรรวม', 'ค่าใช้จ่ายรวม (บาท)', 'เฉลี่ย กม./ลิตร', 'ลิตรเกินรวม', 'หักเงินรวม (บาท)', 'ครั้งที่ต้องหัก', 'เงินเดือน', 'ค่าเที่ยว', 'ยอดเงินได้', 'หักเงินล่วงหน้า', 'หักเงินรวม (บาท)', 'หักลากิจ', 'ยอดสุทธิต้องได้'];
      const summaryRows = Object.values(sm).map((x) => { const incomeTotal = SALARY_FIXED + x.trip; const lapakij = 0; const netPay = incomeTotal - x.adv - x.penalty - lapakij;
        return [x.plate, x.driver, x.trips, +x.dist.toFixed(2), +x.lt.toFixed(2), +x.cost.toFixed(2), +(x.lt > 0 ? x.dist / x.lt : 0).toFixed(2), +x.excess.toFixed(2), +x.penalty.toFixed(0), x.below, SALARY_FIXED, +x.trip.toFixed(2), +incomeTotal.toFixed(2), +x.adv.toFixed(2), +x.penalty.toFixed(0), lapakij, +netPay.toFixed(2)]; });
      const wb = X.utils.book_new(); const thin = { style: 'thin', color: { rgb: '000000' } }; const thinBorder = { top: thin, bottom: thin, left: thin, right: thin };
      const headerStyle = { fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } }, font: { sz: 12, bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: thinBorder }; const dataStyle = { font: { sz: 11 }, alignment: { vertical: 'center' }, border: thinBorder };
      const applyStyles = (sheet) => { const ref = sheet['!ref']; if (!ref) return; const range = X.utils.decode_range(ref); for (let R = range.s.r; R <= range.e.r; R++) for (let C = range.s.c; C <= range.e.c; C++) { const addr = X.utils.encode_cell({ r: R, c: C }); if (!sheet[addr]) sheet[addr] = { v: '', t: 's' }; sheet[addr].s = R === 0 ? headerStyle : dataStyle; } sheet['!rows'] = sheet['!rows'] || []; sheet['!rows'][0] = { hpt: 24 }; };
      const ws = X.utils.json_to_sheet(data); ws['!cols'] = [12, 10, 14, 13, 11, 12, 13, 13, 13, 11, 12, 11, 14, 14].map((w) => ({ wch: w })); applyStyles(ws); X.utils.book_append_sheet(wb, ws, 'Fuel Report');
      const ws2 = X.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]); ws2['!cols'] = [10, 14, 11, 18, 11, 18, 14, 13, 18, 13, 11, 11, 13, 16, 18, 11, 18].map((w) => ({ wch: w })); applyStyles(ws2); X.utils.book_append_sheet(wb, ws2, 'Summary');
      X.writeFile(wb, `NJ_Fuel_Report_${flBkkToday()}.xlsx`); T.toast('Export Excel สำเร็จ ✓', 'ok');
    };
    // ---- ส่วนที่ 1: จาก JOB (tnj_mileage_table เดิม — v_transport_job_report) · ทุกแถวกดกลับ JOB ต้นทาง ----
    let FJ = [];
    const fjLoad = async () => { const p = { page_size: 500, date_from: $('#fjFrom').value || null, date_to: $('#fjTo').value || null, q: $('#fjQ').value.trim() || null }; let rows = [], pg = 1, total = 0;
      const tp = {}; // ทะเบียนหาง: จาก JOB (tnj_job_list เดิม) — v_transport_job_report ไม่มีคอลัมน์นี้
      try { const jl = async () => { let pg2 = 1, n = 0, t2 = 0; do { const d = await T.auth('tnj_job_list', { p: { page: pg2, page_size: 500, date_from: p.date_from, date_to: p.date_to } }, { silent: true }); d.rows.forEach((x) => { tp[x.id] = x.trailer_plate; }); n += d.rows.length; t2 = d.total; pg2++; } while (n < t2 && pg2 < 20); };
        const ml = async () => { do { const d = await T.auth('tnj_mileage_table', { p: Object.assign({ page: pg }, p) }, { silent: true }); rows = rows.concat(d.rows); total = d.total; pg++; } while (rows.length < total && pg < 20); };
        await Promise.all([ml(), jl()]); rows.forEach((r) => { r.trailer_plate = tp[r.job_id] || null; r.ppl = Number(r.fuel_liters) > 0 ? Number(r.fuel_amount) / Number(r.fuel_liters) : null; }); } catch (e) { if ($('#fjBody')) $('#fjBody').innerHTML = `<tr><td colspan="15" class="empty">${h(T.parseErr(e).text)}</td></tr>`; return; }
      if (!$('#fjBody')) return; FJ = rows; $('#fjCount').textContent = `(${rows.length} JOB)`;
      $('#fjBody').innerHTML = rows.map((r) => `<tr data-job="${r.job_id}"><td class="nowrap">${hlDMY(r.job_date)}</td><td><a href="#/jobs/${r.job_id}?tab=fuel" class="b">${h(r.customer_name || r.bl_no || 'เปิดงาน')}</a></td><td>${h(r.bl_no || '-')}</td><td class="nowrap">${h(r.driver_name || '-')}</td><td><span class="badge blue">${h(r.license_plate || '-')}</span></td><td>${h(r.trailer_plate || '-')}</td><td class="r">${T.num(r.start_mileage)}</td><td class="r">${T.num(r.end_mileage)}</td><td class="r b">${T.num(r.total_distance)}</td><td class="r">${T.num(r.fuel_liters, 2)}</td><td class="r">${T.num(r.fuel_amount, 2)}</td><td class="r">${r.ppl != null ? T.num(r.ppl, 2) : '-'}</td><td class="r">${T.kml(r.km_per_liter)}</td><td class="small">${h(r.mileage_status || '-')}</td><td><a class="btn btn-sm" href="#/jobs/${r.job_id}?tab=fuel">เปิด JOB ›</a></td></tr>`).join('') || '<tr><td colspan="15" class="empty">ยังไม่มีข้อมูลจาก JOB</td></tr>'; };
    ['fjFrom', 'fjTo'].forEach((id) => { $('#' + id).onchange = fjLoad; }); $('#fjQ').addEventListener('input', T.debounce(fjLoad, 400));
    $('#fjXls').onclick = async () => { if (!FJ.length) return T.toast('ไม่มีข้อมูลสำหรับ Export', 'err'); try { T.loading(true); await ensureXlsx();
      const aoa = [['วันที่', 'ลูกค้า', 'B/L', 'คนขับ', 'ทะเบียนหัว', 'ทะเบียนหาง', 'ไมล์เริ่ม', 'ไมล์จบ', 'ระยะทาง (กม.)', 'ลิตร', 'ค่าน้ำมัน (บาท)', 'บาท/ลิตร', 'กม./ลิตร', 'สถานะไมล์']].concat(FJ.map((r) => [r.job_date, r.customer_name || '', r.bl_no || '', r.driver_name || '', r.license_plate || '', r.trailer_plate || '', r.start_mileage != null ? Number(r.start_mileage) : '', r.end_mileage != null ? Number(r.end_mileage) : '', r.total_distance != null ? Number(r.total_distance) : '', r.fuel_liters != null ? Number(r.fuel_liters) : '', r.fuel_amount != null ? Number(r.fuel_amount) : '', r.ppl != null ? +r.ppl.toFixed(2) : '', r.km_per_liter != null ? Number(r.km_per_liter) : '', r.mileage_status || '']));
      const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [11, 16, 16, 18, 11, 11, 10, 10, 12, 9, 13, 9, 9, 16].map((w) => ({ wch: w })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Job Mileage Fuel'); XLSX.writeFile(wb, `TransportNJ_Job_Mileage_Fuel_${flBkkToday()}.xlsx`); T.toast(`Export ${FJ.length} JOB`, 'ok'); } catch (e) { T.err(e); } finally { T.loading(false); } };
    fjLoad();
    frame(); await renderAll();
  }

  /* ---------- reports ---------- */
  /* ---------- 📈 รายงานงานขนส่ง: ค้นหาใต้หัวตาราง (แบบหน้างานขนส่ง) · เฉพาะ JOB ที่ปิดงานแล้ว ---------- */
  // ใช้ RPC / Filter เดิม tnj_report_rows (closed_only + customer / bl_no / container / tl_status / mode / date_from=date_to) — ไม่แก้ DB
  // กำหนดส่ง (factory_date) กรองฝั่งหน้าเว็บ · คนขับ = ทุกตู้ (RUN-17: drivers + ตัวกรอง driver ฝั่ง Server) · Pagination + จำนวนรายการ คิดจากผลหลังกรองทั้งหมด
  // ช่องค้นหา [key, ป้าย (มือถือ), ชนิด, placeholder] — เบอร์ตู้ (คอลัมน์ซ่อน) ค้นหาได้ในช่องใต้ "จำนวนตู้" · MODE อยู่ในช่องใต้ "จัดการ"
  const RJ_COLS = [['job_date', 'วันที่งาน', 'date'], ['customer', 'ลูกค้า', 'text'], ['bl_no', 'B/L, BOOKING', 'text', 'ค้นหา B/L / BOOKING'], ['container', 'เบอร์ตู้', 'text'], ['sched', 'กำหนดส่ง', 'date'], ['driver', 'คนขับ', 'text'], ['tl_status', 'สถานะล่าสุด', 'status'], ['mode', 'MODE', 'mode']];
  const RJ_HEAD = ['วันที่งาน', 'ลูกค้า', 'B/L, BOOKING', 'จำนวนตู้', 'กำหนดส่ง', 'คนขับ', 'สถานะล่าสุด', 'จัดการ'];
  const rjInput = (k, label, type, ph) => type === 'date' ? `<input type="date" class="inp jf-in" data-rf="${k}" aria-label="ค้นหา${h(label)}">`
    : type === 'status' ? `<select class="inp jf-in" data-rf="${k}" aria-label="ค้นหา${h(label)}"><option value="">ทั้งหมด</option>${HL_STATUS.map((x) => `<option value="${h(x)}">${h(x)}</option>`).join('')}</select>`
    : type === 'mode' ? `<select class="inp jf-in" data-rf="${k}" aria-label="ค้นหา${h(label)}"><option value="">ทั้งหมด</option><option value="IMPORT">IMPORT</option><option value="EXPORT">EXPORT</option><option value="BOTH">IMPORT+EXPORT</option></select>`
    : `<input class="inp jf-in" data-rf="${k}" placeholder="${h(ph || 'ค้นหา' + label)}" autocomplete="off">`;
  async function pageJobReport(page, r) {
    await loadMasters(); let pageNo = 1; const PS = 50; let rows = []; let seq = 0; let mode = '';
    const F = {}; RJ_COLS.forEach(([k]) => { F[k] = ''; });
    const modeTxt = (x) => (x.job_mode || []).slice().sort().reverse().join('+') || '-';
    // คนขับ: ชื่อ (ไม่เอานามสกุล) ของทุกตู้ เรียงตามลำดับตู้ ไม่ซ้ำ (RUN-17 drivers) · ก่อนรัน RUN-17 = คนขับตู้ 1
    const drvTxt = (x) => { const a = Array.isArray(x.drivers) ? x.drivers : (x.driver_name ? [String(x.driver_name).trim().split(/\s+/)[0]] : []); return a.filter(Boolean).join(', ') || '-'; };
    page.innerHTML = `<div class="page-head"><div class="flex flex-wrap"><button class="btn btn-g" id="rpXls">📊 EXPORT EXCEL</button></div><div class="flex"><h1>📈 รายงานงานขนส่ง</h1></div></div>
      <div class="card"><div id="rpList"></div><div class="pager" id="rpPager"></div></div>`;
    const server = () => { const o = { page: 0, closed_only: true }; ['customer', 'bl_no', 'container', 'tl_status', 'mode', 'driver'].forEach((k) => { if (F[k].trim()) o[k] = F[k].trim(); }); if (F.job_date) { o.date_from = F.job_date; o.date_to = F.job_date; } return o; };
    const has = (v, q) => !q || String(v == null ? '' : v).toLowerCase().includes(q.trim().toLowerCase());
    const filtered = () => rows.filter((x) => x.status === 'COMPLETED' && (!F.sched || String(x.factory_date || '').slice(0, 10) === F.sched) && (Array.isArray(x.drivers) || has(x.driver_name, F.driver))); // มี drivers (RUN-17) = Server กรองคนขับทุกตู้แล้ว
    const frame = () => {
      mode = isNarrow() ? 'm' : 'd'; const clr = '<button type="button" class="btn btn-sm" id="rpClear">ล้างการค้นหา</button>';
      const head = `<tr>${RJ_HEAD.map((l) => `<th>${l}</th>`).join('')}</tr>`; const fi = (k) => { const c = RJ_COLS.find((x) => x[0] === k); return rjInput(c[0], c[1], c[2], c[3]); };
      $('#rpList').innerHTML = mode === 'd'
        ? `<div class="tbl-wrap"><table class="tbl jobs-tbl" id="rpJobTbl"><thead>${head}<tr class="jf-filter">${['job_date', 'customer', 'bl_no', 'container', 'sched', 'driver', 'tl_status'].map((k) => `<th>${fi(k)}</th>`).join('')}<th><div class="rp-act">${fi('mode')}${clr}</div></th></tr></thead><tbody id="rpBody"></tbody></table></div>`
        : `<div class="jf-m">${RJ_COLS.map(([k, l, t, ph]) => `<div class="field"><label>${l}</label>${rjInput(k, l, t, ph)}</div>`).join('')}<div class="jf-m-clr">${clr}</div></div><div class="tbl-wrap"><table class="tbl jobs-tbl" id="rpJobTbl"><thead>${head}</thead><tbody id="rpBody"></tbody></table></div>`;
      $$('#rpList [data-rf]').forEach((i) => { i.value = F[i.dataset.rf] || ''; });
      const later = T.debounce(() => { pageNo = 1; load(); }, 400);
      $$('#rpList [data-rf]').forEach((i) => {
        const k = i.dataset.rf; const local = k === 'sched';
        const ev = () => { if (F[k] === i.value) return; F[k] = i.value; pageNo = 1; if (local) draw(); else if (i.tagName === 'INPUT' && i.type !== 'date') later(); else load(); };
        i.addEventListener(i.tagName === 'SELECT' || i.type === 'date' ? 'change' : 'input', ev);
        if (i.tagName === 'INPUT' && i.type !== 'date') i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); F[k] = i.value; pageNo = 1; if (local) draw(); else load(); } });
      });
      $('#rpClear').onclick = () => { Object.keys(F).forEach((k) => { F[k] = ''; }); $$('#rpList [data-rf]').forEach((i) => { i.value = ''; }); pageNo = 1; load(); };
    };
    const rowHtml = (x) => `<tr class="click" data-det="${x.job_id}"><td class="nowrap">${T.fmtD(x.job_date)}</td><td class="ell" style="max-width:200px">${h(x.customer_name)}</td><td class="b">${h(x.bl_no)}</td><td class="c b">${Number(x.container_count) || 1}</td><td class="nowrap">${x.factory_date ? T.fmtD(x.factory_date) : '-'}${x.factory_time ? ' ' + h(String(x.factory_time).slice(0, 5)) : ''}</td><td>${h(drvTxt(x))}</td><td>${x.tl_status ? `<span class="hl-st-tag">${h(x.tl_status)}</span>` : T.badge(x.status)}</td><td><a class="btn btn-sm" href="#/jobs/${x.job_id}" onclick="event.stopPropagation()">เปิด JOB ›</a></td></tr>`;
    const draw = () => {
      if (!$('#rpBody')) return;
      const list = filtered(); const pages = Math.max(1, Math.ceil(list.length / PS)); pageNo = Math.min(Math.max(1, pageNo), pages);
      const vis = list.slice((pageNo - 1) * PS, pageNo * PS);
      $('#rpBody').innerHTML = vis.map(rowHtml).join('') || `<tr><td colspan="${RJ_HEAD.length}" class="empty">ไม่พบข้อมูล</td></tr>`;
      $$('#rpBody [data-det]').forEach((b) => b.onclick = () => openReportDetail(b.dataset.det));
      $('#rpPager').innerHTML = `<span class="muted small">ทั้งหมด ${list.length} รายการ · หน้า ${pageNo}/${pages}</span><button class="btn btn-sm" id="rPrev" ${pageNo <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="rNext" ${pageNo >= pages ? 'disabled' : ''}>›</button>`;
      $('#rPrev').onclick = () => { pageNo--; draw(); }; $('#rNext').onclick = () => { pageNo++; draw(); };
    };
    const load = async () => { const my = ++seq; try {
      const d = await T.auth('tnj_report_rows', { p: server() }, { silent: true });
      if (my !== seq || !$('#rpList')) return; rows = d.rows || [];
      if (!$('#rpBody') || mode !== (isNarrow() ? 'm' : 'd')) frame(); draw();
    } catch (e) { if (my === seq) T.err(e); } };
    $('#rpXls').onclick = async () => { try { T.loading(true); await ensureXlsx();
      const list = filtered().slice().sort((a, b) => String(a.job_date).localeCompare(String(b.job_date)));
      const ja = [['Date', 'MODE', 'Customer', 'B/L, BOOKING', 'Container No.', 'Containers', 'Seal', 'Size', 'ท่านำเข้า', 'รับ/คืนตู้เปล่า', 'วันที่ส่ง', 'เวลา', 'Driver', 'License Plate', 'Trailer Plate', 'สถานะล่าสุด', 'ปิดงานเมื่อ', 'Job Status']].concat(list.map((x) => [x.job_date, modeTxt(x) === '-' ? '' : modeTxt(x), x.customer_name, x.bl_no, x.container_no || '', x.container_count || 1, x.seal_no || '', x.container_size || '', x.pickup_location_text || '', x.return_location_text || '', x.factory_date || '', x.factory_time ? String(x.factory_time).slice(0, 5) : '', x.driver_name || '', x.license_plate || '', x.trailer_plate || '', x.tl_status || '', x.completed_at ? T.fmtDT(x.completed_at) : '', T.ST_TH[x.status] || x.status]));
      ja.push([]); ja.push(['Total', `จำนวน Job: ${list.length}`]); const jws = XLSX.utils.aoa_to_sheet(ja); jws['!cols'] = [10, 14, 24, 16, 14, 9, 12, 8, 18, 18, 10, 7, 18, 12, 12, 26, 16, 12].map((w) => ({ wch: w })); const jwb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(jwb, jws, 'Jobs'); XLSX.writeFile(jwb, `TransportNJ_Job_Report_${T.todayISO()}.xlsx`); T.toast(`Export ${list.length} งาน`, 'ok');
    } catch (e) { T.err(e); } finally { T.loading(false); } };
    frame(); load(); T.subscribe('tnj:office', T.debounce(() => { if ($('#rpJobTbl')) load(); }, 1500)); // ปิดงาน / เปิดงานกลับ → รายงานอัปเดตเอง (Realtime เดิม)
  }
  async function pageReports(page, r, opt = {}) {
    await loadMasters(); let mode = r.q.mode || 'all'; let pageNo = 1; let lastFilter = {};
    const d0 = T.todayISO().slice(0, 8) + '01';
    if (opt.jobsOnly) mode = 'all'; // 📈 รายงานงานขนส่ง: หน้าเดียว + Filter (ไม่มี Tab ทั้งหมด / ตามรถ / ตาม Driver) · เฉพาะ JOB ที่ปิดงานแล้ว
    page.innerHTML = opt.jobsOnly ? `<div class="page-head"><h1>📈 รายงานงานขนส่ง</h1></div>
      <div class="card card-b mb2"><div id="rf" class="rp-jf"><div class="grid g4"><div class="field"><label>วันที่เริ่ม</label><input type="date" class="inp" name="date_from" value="${d0}"></div><div class="field"><label>วันที่สิ้นสุด</label><input type="date" class="inp" name="date_to" value="${T.todayISO()}"></div>
        <div class="field"><label>ลูกค้า</label><input class="inp" name="customer" list="dlCust3" placeholder="พิมพ์ค้นหาลูกค้า"><datalist id="dlCust3">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div><div class="field"><label>B/L, BOOKING</label><input class="inp" name="bl_no" placeholder="พิมพ์ค้นหา B/L / BOOKING"></div></div>
        <div class="grid g5"><div class="field"><label>เบอร์ตู้</label><input class="inp" name="container" placeholder="พิมพ์ค้นหาเบอร์ตู้"></div><div class="field"><label>ทะเบียนรถ</label><input class="inp" name="plate" placeholder="ทะเบียนหัว / หาง"></div>
        <div class="field"><label>คนขับ</label><select class="inp" name="driver_id">${opts(M.drivers, 'id', 'full_name', r.q.driver_id, 'ทั้งหมด')}</select></div><div class="field"><label>สถานะ (ล่าสุดของ Timeline)</label><select class="inp" name="tl_status"><option value="">ทั้งหมด</option>${HL_STATUS.map((x) => `<option value="${h(x)}">${h(x)}</option>`).join('')}</select></div>
        <div class="field"><label>MODE</label><select class="inp" name="mode"><option value="">ทั้งหมด</option><option value="IMPORT">IMPORT</option><option value="EXPORT">EXPORT</option><option value="BOTH">IMPORT+EXPORT</option></select></div></div></div>
        <div class="flex flex-wrap"><button class="btn btn-p" id="rpGo">🔍 ค้นหา</button><button class="btn" id="rpClear">ล้างตัวกรอง</button><button class="btn btn-g" id="rpXls">📊 EXPORT EXCEL</button></div></div>
      <div id="rpSum" class="stats" style="grid-template-columns:repeat(3,1fr)"></div><div class="card"><div id="rpList"></div><div class="pager" id="rpPager"></div></div>`
    : `<div class="page-head">${opt.modal ? '' : '<h1>📊 รายงาน</h1>'}<div class="tabs rp-tabs" style="margin:0;border:0"><button data-m="all" class="${mode === 'all' ? 'active' : ''}">ทั้งหมด</button><button data-m="vehicle" class="${mode === 'vehicle' ? 'active' : ''}">ตามรถ</button><button data-m="driver" class="${mode === 'driver' ? 'active' : ''}">ตาม Driver</button></div></div>
      <div class="card card-b mb2"><div class="grid g4" id="rf"><div class="field"><label>วันที่เริ่ม</label><input type="date" class="inp" name="date_from" value="${d0}"></div><div class="field"><label>วันที่สิ้นสุด</label><input type="date" class="inp" name="date_to" value="${T.todayISO()}"></div>
        <div class="field rp-all"><label>B/L</label><input class="inp" name="bl_no"></div><div class="field rp-all"><label>Customer</label><input class="inp" name="customer" list="dlCust3"><datalist id="dlCust3">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div>
        <div class="field rp-all rp-vehicle"><label>รถ / ทะเบียนรถ</label><select class="inp" name="vehicle_id">${opts(M.vehicles, 'id', (v) => `${v.vehicle_name} (${v.license_plate})`, r.q.vehicle_id, 'ทั้งหมด')}</select></div><div class="field rp-all"><label>ทะเบียนรถ (พิมพ์)</label><input class="inp" name="license_plate"></div>
        <div class="field rp-all rp-driver"><label>Driver</label><select class="inp" name="driver_id">${opts(M.drivers, 'id', 'full_name', r.q.driver_id, 'ทั้งหมด')}</select></div><div class="field rp-all"><label>Status</label><select class="inp" name="status"><option value="">ทั้งหมด</option>${stOpts('')}</select></div></div>
        <div class="flex flex-wrap"><button class="btn btn-p" id="rpGo">🔍 ค้นหา</button><button class="btn" id="rpClear">ล้างตัวกรอง</button><button class="btn btn-g" id="rpXls">📥 EXPORT EXCEL</button></div></div>
      <div id="rpSum" class="stats" style="grid-template-columns:repeat(8,1fr)"></div><div class="card"><div id="rpList"></div><div class="pager" id="rpPager"></div></div>`;
    const setMode = (mm) => { mode = mm; $$('.rp-tabs button', page).forEach((b) => b.classList.toggle('active', b.dataset.m === mode)); $$('#rf .field').forEach((f) => f.classList.toggle('hidden', !(f.classList.contains('rp-' + mode) || !f.className.includes('rp-')))); };
    $$('.rp-tabs button', page).forEach((b) => b.onclick = () => { setMode(b.dataset.m); pageNo = 1; load(); }); setMode(mode);
    const read = () => { const o = {}; $$('#rf [name]').forEach((i) => { if (i.value && !i.closest('.field').classList.contains('hidden')) o[i.name] = i.value; }); if (opt.jobsOnly) o.closed_only = true; return o; };
    if (opt.jobsOnly) $$('#rf input', page).forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pageNo = 1; load(); } })); // ค้นหาเมื่อกด Enter / ปุ่มค้นหา เท่านั้น
    const sumCards = (s, extra) => { const items = [['จำนวน Job', s.jobs], ['จำนวนรถ', s.vehicles], ['จำนวน Driver', s.drivers], ['ระยะทางรวม (กม.)', T.num(s.distance)], ['น้ำมันรวม (ลิตร)', T.num(s.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(s.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(s.kml)], ['งานข้อมูลไม่ครบ', s.incomplete]].concat(extra || []); return items.map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:20px">${v == null ? '-' : v}</div></div>`).join(''); };
    // 📈 รายงานงานขนส่ง: ข้อมูล JOB เท่านั้น (ไม่ปนไมล์ / น้ำมัน) — ใช้ RPC / ตัวกรองเดิม
    const modeTxt = (x) => (x.job_mode || []).slice().sort().reverse().join('+') || '-';
    const jobRowsHtml = (rows) => `<div class="tbl-wrap"><table class="tbl" id="rpJobTbl"><thead><tr><th>วันที่งาน</th><th>MODE</th><th>ลูกค้า</th><th>B/L, BOOKING</th><th>เบอร์ตู้</th><th>คนขับ</th><th>ทะเบียนรถ</th><th>สถานะล่าสุด</th><th>ปิดงานเมื่อ</th><th>จัดการ</th></tr></thead><tbody>${rows.map((x) => `<tr class="click" data-det="${x.job_id}"><td class="nowrap">${T.fmtD(x.job_date)}</td><td class="nowrap">${h(modeTxt(x))}</td><td class="ell" style="max-width:180px">${h(x.customer_name)}</td><td class="b">${h(x.bl_no)}</td><td class="nowrap">${h(x.container_no || '-')}${x.container_count > 1 ? ` <span class="xs muted">+${x.container_count - 1} ตู้</span>` : ''}</td><td>${h(x.driver_name || '-')}</td><td class="nowrap">${h(x.license_plate || '-')}${x.trailer_plate ? ' / ' + h(x.trailer_plate) : ''}</td><td>${x.tl_status ? `<span class="hl-st-tag">${h(x.tl_status)}</span>` : T.badge(x.status)}</td><td class="nowrap">${x.completed_at ? T.fmtDT(x.completed_at) : '-'}</td><td><a class="btn btn-sm" href="#/jobs/${x.job_id}" onclick="event.stopPropagation()">เปิด JOB ›</a></td></tr>`).join('') || '<tr><td colspan="10" class="empty">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
    const jobsOnlySum = () => { if (!opt.jobsOnly) return; $$('#rpSum .stat', page).forEach((st) => { const l = (st.querySelector('.l') || {}).textContent || ''; if (/ไมล์|น้ำมัน|ระยะ|กม\.|ข้อมูลไม่ครบ/.test(l)) st.remove(); }); };
    const rowsHtml = (rows) => opt.jobsOnly ? jobRowsHtml(rows) : isMobile() ? `<div class="rep-cards" style="padding:10px">${rows.map((x) => `<div class="jobcard"><div class="flex between"><b style="font-size:17px;color:var(--navy)">${h(T.jobRef(x))}</b>${T.badge(x.status)}</div><div class="small">B/L: ${h(x.bl_no)}<br>รถ: ${h(x.vehicle_name || '-')} · ทะเบียน: ${h(x.license_plate || '-')}<br>คนขับ: ${h(x.driver_name || '-')}</div><div class="small mt1">ระยะ: <b>${T.num(x.total_distance)} กม.</b> · น้ำมัน: ${T.num(x.fuel_liters, 2)} ลิตร<br>รวม: ${T.num(x.fuel_amount, 2)} บาท · เฉลี่ย: ${T.kml(x.km_per_liter)} กม./ลิตร</div><button class="btn btn-sm btn-p mt1" data-det="${x.job_id}">ดูรายละเอียด</button></div>`).join('') || '<div class="empty">ไม่พบข้อมูล</div>'}</div>`
      : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันที่</th><th>B/L</th><th>ลูกค้า</th><th>รถ</th><th>ทะเบียนรถ</th><th>คนขับ</th><th class="r">ไมล์ก่อน</th><th class="r">ไมล์หลัง</th><th class="r">ระยะ (กม.)</th><th class="r">น้ำมัน (ลิตร)</th><th class="r">รวม (บาท)</th><th class="r">กม./ลิตร</th><th>Status</th>${opt.modal ? '' : '<th>จัดการ</th>'}</tr></thead><tbody>${rows.map((x) => `<tr class="click" data-det="${x.job_id}"><td class="nowrap">${T.fmtD(x.job_date)}</td><td class="b">${h(x.bl_no)}</td><td class="ell" style="max-width:150px">${h(x.customer_name)}</td><td>${h(x.vehicle_name || '-')}</td><td>${h(x.license_plate || '-')}</td><td>${h(x.driver_name || '-')}</td><td class="r">${T.num(x.start_mileage)}</td><td class="r">${T.num(x.end_mileage)}</td><td class="r b">${T.num(x.total_distance)}</td><td class="r">${T.num(x.fuel_liters, 2)}</td><td class="r">${T.num(x.fuel_amount, 2)}</td><td class="r">${T.kml(x.km_per_liter)}</td><td>${T.badge(x.status)}${x.incomplete_flag ? ' ⚠' : ''}</td>${opt.modal ? '' : '<td><button class="btn btn-sm">ดูรายละเอียด</button></td>'}</tr>`).join('') || '<tr><td colspan="15" class="empty">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
    const bindDet = () => $$('[data-det]', page).forEach((b) => b.onclick = () => openReportDetail(b.dataset.det));
    const load = async () => { try { const f = read(); lastFilter = f;
      if (mode === 'all') { const d = await T.auth('tnj_report_rows', { p: Object.assign({ page: pageNo, page_size: 50 }, f) }, { silent: true }); $('#rpSum').innerHTML = sumCards(d.summary); $('#rpList').innerHTML = rowsHtml(d.rows); const pages = Math.max(1, Math.ceil(d.total / d.page_size)); $('#rpPager').innerHTML = `<span class="muted small">ทั้งหมด ${d.total} · หน้า ${d.page}/${pages}</span><button class="btn btn-sm" id="rPrev" ${d.page <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="rNext" ${d.page >= pages ? 'disabled' : ''}>›</button>`; $('#rPrev').onclick = () => { pageNo--; load(); }; $('#rNext').onclick = () => { pageNo++; load(); }; }
      else if (mode === 'vehicle') { if (!f.vehicle_id) { $('#rpSum').innerHTML = ''; $('#rpList').innerHTML = '<div class="empty">กรุณาเลือกทะเบียนรถ</div>'; $('#rpPager').innerHTML = ''; return; } const d = await T.auth('tnj_report_vehicle', { p_vehicle_id: f.vehicle_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); $('#rpSum').innerHTML = [['จำนวน Job', d.jobs], ['Drivers ที่เคยใช้', (d.drivers || []).join(', ') || '-'], ['ไมล์เริ่มต้น', T.num(d.first_mileage)], ['ไมล์ล่าสุด', T.num(d.last_mileage)], ['ระยะทางรวม (กม.)', T.num(d.distance)], ['น้ำมันรวม (ลิตร)', T.num(d.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(d.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(d.kml)]].map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:18px">${v}</div></div>`).join(''); $('#rpList').innerHTML = rowsHtml(d.rows); $('#rpPager').innerHTML = ''; }
      else { if (!f.driver_id) { $('#rpSum').innerHTML = ''; $('#rpList').innerHTML = '<div class="empty">กรุณาเลือก Driver</div>'; $('#rpPager').innerHTML = ''; return; } const d = await T.auth('tnj_report_driver', { p_driver_id: f.driver_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); $('#rpSum').innerHTML = [['Driver', h(d.driver.full_name)], ['จำนวน Job', d.jobs], ['รถที่ใช้', (d.vehicles || []).join(', ') || '-'], ['ระยะทางรวม (กม.)', T.num(d.distance)], ['น้ำมันรวม (ลิตร)', T.num(d.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(d.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(d.kml)], ['Completed / Problem / ไม่ครบ', `${d.completed} / ${d.problem} / ${d.incomplete}`]].map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:18px">${v}</div></div>`).join(''); $('#rpList').innerHTML = rowsHtml(d.rows); $('#rpPager').innerHTML = ''; }
      jobsOnlySum(); bindDet(); } catch (e) { T.err(e); } };
    $('#rpGo').onclick = () => { pageNo = 1; load(); }; $('#rpClear').onclick = () => { $$('#rf [name]').forEach((i) => { i.value = i.name === 'date_from' ? d0 : i.name === 'date_to' ? T.todayISO() : ''; }); pageNo = 1; load(); };
    $('#rpXls').onclick = async () => { try { T.loading(true); await ensureXlsx(); let rows, sum; const f = read();
      if (mode === 'all') { const d = await T.auth('tnj_report_rows', { p: Object.assign({ page: 0 }, f) }, { silent: true }); rows = d.rows; sum = d.summary; } else if (mode === 'vehicle') { if (!f.vehicle_id) throw new Error('TNJ_VALIDATION:กรุณาเลือกรถ'); const d = await T.auth('tnj_report_vehicle', { p_vehicle_id: f.vehicle_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); rows = d.rows; sum = d; } else { if (!f.driver_id) throw new Error('TNJ_VALIDATION:กรุณาเลือก Driver'); const d = await T.auth('tnj_report_driver', { p_driver_id: f.driver_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); rows = d.rows; sum = d; }
      rows = rows.slice().sort((a, b) => String(a.job_date).localeCompare(String(b.job_date)));
      if (opt.jobsOnly) { const ja = [['Date', 'MODE', 'Customer', 'B/L, BOOKING', 'Container No.', 'Containers', 'Seal', 'Size', 'ท่านำเข้า', 'รับ/คืนตู้เปล่า', 'วันที่ส่ง', 'เวลา', 'Driver', 'License Plate', 'Trailer Plate', 'สถานะล่าสุด', 'ปิดงานเมื่อ', 'Job Status']].concat(rows.map((x) => [x.job_date, modeTxt(x) === '-' ? '' : modeTxt(x), x.customer_name, x.bl_no, x.container_no || '', x.container_count || 1, x.seal_no || '', x.container_size || '', x.pickup_location_text || '', x.return_location_text || '', x.factory_date || '', x.factory_time ? String(x.factory_time).slice(0, 5) : '', x.driver_name || '', x.license_plate || '', x.trailer_plate || '', x.tl_status || '', x.completed_at ? T.fmtDT(x.completed_at) : '', T.ST_TH[x.status] || x.status]));
        ja.push([]); ja.push(['Total', `จำนวน Job: ${rows.length}`]); const jws = XLSX.utils.aoa_to_sheet(ja); jws['!cols'] = [10, 14, 24, 16, 14, 9, 12, 8, 18, 18, 10, 7, 18, 12, 12, 26, 16, 12].map((w) => ({ wch: w })); const jwb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(jwb, jws, 'Jobs'); XLSX.writeFile(jwb, `TransportNJ_Job_Report_${(f.date_from || '')}_${(f.date_to || '')}.xlsx`); T.toast(`Export ${rows.length} งาน`, 'ok'); return; }
      const aoa = [['Date', 'B/L', 'Customer', 'Container No.', 'Vehicle', 'License Plate', 'Driver', 'Start Mileage', 'End Mileage', 'Distance KM', 'Fuel Liters', 'Fuel Amount', 'KM/L', 'Job Status']].concat(rows.map((x) => [x.job_date, x.bl_no, x.customer_name, x.container_no || '', x.vehicle_name || '', x.license_plate || '', x.driver_name || '', x.start_mileage != null ? Number(x.start_mileage) : '', x.end_mileage != null ? Number(x.end_mileage) : '', x.total_distance != null ? Number(x.total_distance) : '', x.fuel_liters != null ? Number(x.fuel_liters) : '', x.fuel_amount != null ? Number(x.fuel_amount) : '', x.km_per_liter != null ? Number(x.km_per_liter) : '', x.status]));
      aoa.push([]); aoa.push(['Total', `จำนวน Job: ${sum.jobs}`, '', '', '', '', '', '', '', 'ระยะทางรวม', Number(sum.distance || 0), Number(sum.liters || 0), Number(sum.amount || 0), sum.kml != null ? Number(sum.kml) : '-', `กม./ลิตร เฉลี่ย: ${T.kml(sum.kml)}`]);
      const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [10, 14, 14, 24, 14, 14, 12, 16, 12, 12, 12, 12, 12, 8, 18].map((w) => ({ wch: w })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report'); XLSX.writeFile(wb, `TransportNJ_Report_${(f.date_from || '')}_${(f.date_to || '')}.xlsx`); T.toast(`Export ${rows.length} แถว`, 'ok'); } catch (e) { T.err(e); } finally { T.loading(false); } };
    load(); if (opt.jobsOnly) T.subscribe('tnj:office', T.debounce(() => { if ($('#rpJobTbl') || $('#rpList')) load(); }, 1500)); // ปิดงาน / เปิดงานกลับ → รายงานอัปเดตเอง (Realtime เดิม)
  }
  function openReportModal() {
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'rpModal'; ov.innerHTML = `<div class="modal w" style="max-width:1280px"><div class="modal-h"><h3>📈 รายงาน — ไมล์รถ / น้ำมัน (ผูกกับงานขนส่ง)</h3><button class="x" data-x>×</button></div><div class="modal-b" id="rpModalBody"></div></div>`; document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    pageReports($('#rpModalBody', ov), { q: {} }, { modal: true });
  }
  function openReportDetail(jobId) {
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.innerHTML = `<div class="modal w" style="max-width:1100px"><div class="modal-h"><h3>รายละเอียดงาน</h3><button class="x" data-x>×</button></div><div class="modal-b" id="rdBody"></div></div>`; document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = () => ov.remove(); ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    renderJobDetail($('#rdBody', ov), jobId, { tab: 'info', pageMode: false });
  }

  /* ---------- documents ---------- */
  async function pageDocuments(page, r) {
    page.innerHTML = `<div class="page-head"><h1>📁 เอกสาร</h1></div><div class="card card-b mb2"><div class="grid g4"><div class="field"><label>ค้นหา</label><input class="inp" id="dcQ" placeholder="Job / B/L / ชื่อไฟล์ / ลูกค้า"></div><div class="field"><label>ประเภท</label><select class="inp" id="dcT"><option value="">ทั้งหมด</option>${T.FILE_TYPES.map((t) => `<option>${h(t)}</option>`).join('')}</select></div><div class="field"><label>วันที่งาน</label><div class="inline-row"><input type="date" class="inp" id="dcF"><input type="date" class="inp" id="dcTo"></div></div></div></div><div class="card card-b" id="dcList"></div>`;
    let files = [];
    const load = async () => { try { const d = await T.auth('tnj_file_list', { p: { q: $('#dcQ').value.trim(), file_type: $('#dcT').value, date_from: $('#dcF').value, date_to: $('#dcTo').value } }, { silent: true }); files = d.rows; $('#dcList').innerHTML = files.map((f) => `<div class="filebox" data-fid="${f.id}"><div class="fi">${T.fileIcon(f.mime_type, f.file_name)}</div><div class="grow"><div class="b ell">${h(f.file_name)} <a class="xs" href="#/jobs/${f.job_id}?tab=docs">ดูงาน</a></div><div class="xs muted">${h(f.file_type)} · ${h(f.customer_name)} · B/L ${h(f.bl_no)} · ${T.size(f.size_bytes)} · ${h(f.uploaded_by_name || '')} · ${T.fmtDT(f.uploaded_at)}</div></div><div class="flex"><button class="btn btn-sm" data-prev>👁</button><button class="btn btn-sm" data-dl>⬇</button>${T.canEdit() ? '<button class="btn btn-sm btn-r" data-del>🗑</button>' : ''}</div></div>`).join('') || '<div class="empty">ไม่พบเอกสาร</div>'; T.bindFileRows($('#dcList'), files, load); } catch (e) { T.err(e); } };
    ['dcQ', 'dcT', 'dcF', 'dcTo'].forEach((id) => $('#' + id).addEventListener(id === 'dcQ' ? 'input' : 'change', T.debounce(load, 400))); load();
  }

  /* ---------- masters ---------- */
  async function pageMasters(page, kind) {
    await loadMasters(true); const canEdit = T.canEdit(), admin = T.isAdmin();
    const defs = { customers: ['ลูกค้า', ['code:รหัส', 'name:ชื่อลูกค้า*', 'contact:ผู้ติดต่อ', 'phone:เบอร์โทร', 'address:ที่อยู่']], drivers: ['คนขับ', ['driver_code:รหัสคนขับ', 'full_name:ชื่อ-สกุล*', 'phone:เบอร์โทร', 'license_no:เลขใบขับขี่', 'username:ชื่อผู้ใช้ (Login)*', 'password:รหัสผ่าน']], vehicles: ['รถ', ['vehicle_code:รหัสรถ', 'vehicle_name:ชื่อรถ', 'license_plate:ทะเบียนรถ*', 'vehicle_type:ประเภท', 'last_mileage:เลขไมล์ล่าสุด']], locations: ['สถานที่', ['name:ชื่อสถานที่*', 'location_type:ประเภท', 'address:ที่อยู่', 'latitude:ละติจูด', 'longitude:ลองจิจูด', 'contact:ผู้ติดต่อ', 'phone:เบอร์โทร', 'google_maps_url:ลิงก์ Google Maps']] };
    const [title, fields] = defs[kind]; const rows = M[kind]; const inactive = await T.auth('tnj_master_list', { p_kind: kind, p_include_inactive: true }, { silent: true });
    const cols = fields.filter((f) => !f.startsWith('password')); const canAdd = kind === 'drivers' ? admin : canEdit;
    page.innerHTML = `<div class="page-head"><h1>${title}</h1><div class="flex"><label class="check"><input type="checkbox" id="msAll"> แสดงที่ปิดใช้งาน</label>${canAdd ? `<button class="btn btn-p" id="msAdd">+ เพิ่ม${title}</button>` : ''}</div></div><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map((f) => `<th>${h(f.split(':')[1].replace('*', ''))}</th>`).join('')}${kind === 'drivers' || kind === 'vehicles' ? '<th>งานปัจจุบัน</th>' : ''}<th>สถานะ</th><th></th></tr></thead><tbody id="msBody"></tbody></table></div></div>`;
    const draw = () => { const list = $('#msAll').checked ? inactive : rows; $('#msBody').innerHTML = list.map((x) => `<tr>${cols.map((f) => { const k = f.split(':')[0]; let v = x[k]; if (k === 'google_maps_url' && v) v = '🔗'; if (k === 'last_mileage') v = T.num(v); return `<td>${h(v == null ? '-' : v)}</td>`; }).join('')}${kind === 'drivers' || kind === 'vehicles' ? `<td>${x.active_job ? `<a href="#/jobs/${x.active_job.id}">ดูงาน</a> ${T.badge(x.active_job.status)}` : '-'}</td>` : ''}<td>${x.is_active ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}</td><td class="nowrap">${kind === 'vehicles' ? `<button class="btn btn-sm" data-vdoc="${x.id}" title="เอกสารประจำรถ">📁</button> ` : ''}${canAdd ? `<button class="btn btn-sm" data-edit="${x.id}">✏️</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="${cols.length + 3}" class="empty">ยังไม่มีข้อมูล</td></tr>`; $$('[data-edit]', page).forEach((b) => b.onclick = () => form(inactive.find((x) => x.id === b.dataset.edit))); $$('[data-vdoc]', page).forEach((b) => b.onclick = () => vehicleDocs(inactive.find((x) => x.id === b.dataset.vdoc))); };
    const form = (x) => { T.modal({ title: (x ? 'แก้ไข' : 'เพิ่ม') + title, size: 's', body: fields.map((f) => { const [k, l] = f.split(':'); if (k === 'location_type') return `<div class="field"><label>${l}</label><select class="inp" name="${k}">${[['PORT', 'ท่าเรือ / ท่ารับตู้'], ['FACTORY', 'โรงงาน'], ['RETURN_YARD', 'ลานคืนตู้'], ['OTHER', 'อื่น ๆ']].map(([v, t]) => `<option value="${v}" ${x && x[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`; return `<div class="field"><label>${h(l.replace('*', ''))}${l.endsWith('*') ? ' <span class="req">*</span>' : ''}</label><input class="inp" name="${k}" ${k === 'password' ? 'type="password" autocomplete="new-password" placeholder="' + (x ? 'เว้นว่าง = ไม่เปลี่ยน' : '') + '"' : ''} ${k === 'username' && x ? 'disabled' : ''} value="${h(x && k !== 'password' ? (x[k] == null ? '' : x[k]) : '')}"></div>`; }).join('') + (x ? `<label class="check"><input type="checkbox" name="is_active" ${x.is_active ? 'checked' : ''}> เปิดใช้งาน</label>` : ''),
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="msGo">บันทึก</button>`, onOpen: (el, close) => { $('#msGo', el).onclick = async () => { const p = { id: x ? x.id : null }; $$('[name]', el).forEach((i) => { if (i.type === 'checkbox') p[i.name] = i.checked; else if (!i.disabled && i.value !== '') p[i.name] = i.value.trim(); else if (!i.disabled && i.name !== 'password') p[i.name] = ''; }); try { await T.auth('tnj_master_save', { p_kind: kind, p }); T.toast('บันทึกแล้ว', 'ok'); close(); pageMasters(page, kind); } catch (e) { T.err(e); } }; } }); };
    const add = $('#msAdd'); if (add) add.onclick = () => form(null); $('#msAll').onchange = draw; draw();
  }

  // 📁 เอกสารประจำรถ — ผูกกับ Vehicle ID (ไม่ผูก JOB) · แนบ/เปลี่ยนไฟล์/ลบ = SUPER_ADMIN/ADMIN · ROLE อื่นใน OFFICE ดู/ดาวน์โหลด
  const VD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
  async function vehicleDocs(v) {
    if (!v) return; const admin = T.isAdmin();
    const m = T.modal({ title: `📁 เอกสารประจำรถ — ${v.vehicle_name || ''} (${v.license_plate})`, size: 'w', body: '<div id="vdBody"><div class="empty">กำลังโหลด...</div></div>', foot: `<button class="btn" data-close>ปิด</button>${admin ? '<button class="btn btn-p" id="vdAdd">+ แนบเอกสาร</button>' : ''}` });
    const el = m.el || document.querySelector('.overlay:last-child'); let d = { rows: [], types: [] };
    const load = async () => {
      try { d = await T.auth('tnj_vfile_list', { p_vehicle_id: v.id }, { silent: true }); } catch (e) { $('#vdBody', el).innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
      $('#vdBody', el).innerHTML = d.rows.map((f) => `<div class="filebox vd-row" data-vf="${f.id}"><div class="fi">${T.vfiles.ICON[f.doc_type] || '📄'}</div><div class="grow"><div class="b">${h(f.doc_type)}</div><div class="ell">${h(f.file_name)}</div>${T.vfiles.expHtml(f)}<div class="xs muted">อัปโหลด ${T.fmtDT(f.uploaded_at)} · ${h(f.uploaded_by_name || '')} · ${T.size(f.size_bytes)}${f.note ? ' · ' + h(f.note) : ''}</div></div>
        <div class="flex"><button class="btn btn-sm" data-vprev title="ดู">👁 ดู</button><button class="btn btn-sm" data-vdl title="ดาวน์โหลด">⬇ ดาวน์โหลด</button>${admin ? '<button class="btn btn-sm" data-vrep>🔄 เปลี่ยนไฟล์</button><button class="btn btn-sm btn-r" data-vdel>🗑 ลบ</button>' : ''}</div></div>`).join('') || '<div class="empty">ยังไม่มีเอกสารประจำรถ</div>';
      $$('[data-vf]', el).forEach((row) => { const f = d.rows.find((x) => x.id === row.dataset.vf);
        $('[data-vprev]', row).onclick = () => T.vfiles.preview(f); $('[data-vdl]', row).onclick = () => T.vfiles.download(f);
        const rp = $('[data-vrep]', row); if (rp) rp.onclick = () => upForm(f);
        const dl = $('[data-vdel]', row); if (dl) dl.onclick = async () => { if (!(await T.confirm('ลบเอกสาร', `ลบ ${f.doc_type}: ${f.file_name} ?`, 'ลบ', 'btn-r'))) return; try { T.loading(true); await T.vfiles.del(f.id); T.toast('ลบแล้ว', 'ok'); load(); } catch (e) { T.err(e); } finally { T.loading(false); } }; });
    };
    // แนบใหม่ (หลายไฟล์ได้) / เปลี่ยนไฟล์ (rep = แถวเดิม)
    const upForm = (rep) => { const types = d.types.length ? d.types : ['ประกันรถ', 'พ.ร.บ.', 'กรมธรรม์', 'คู่มือรถ', 'คู่มืออุปกรณ์', 'เอกสารทะเบียนรถ', 'เอกสารตรวจสภาพ', 'เอกสารอื่น ๆ'];
      T.modal({ title: rep ? `เปลี่ยนไฟล์ — ${rep.doc_type}` : '+ แนบเอกสารประจำรถ', size: 's', body: `<div class="field"><label>ประเภทเอกสาร <span class="req">*</span></label><select class="inp" id="vdType">${types.map((t) => `<option ${rep && rep.doc_type === t ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></div>
        <div class="field"><label>ไฟล์ <span class="req">*</span> <span class="xs muted">PDF JPG JPEG PNG Word Excel</span></label><input type="file" class="inp" id="vdFile" accept="${VD_ACCEPT}" ${rep ? '' : 'multiple'}></div>
        <div class="field"><label>วันหมดอายุ (ถ้ามี)</label><input type="date" class="inp" id="vdExp" value="${h(rep && rep.expire_date ? String(rep.expire_date).slice(0, 10) : '')}"></div>
        <div class="field"><label>หมายเหตุ</label><input class="inp" id="vdNote" value="${h(rep && rep.note ? rep.note : '')}"></div>`,
        foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="vdGo">💾 บันทึก</button>`,
        onOpen: (el2, close) => { $('#vdGo', el2).onclick = async () => { const fs = Array.from($('#vdFile', el2).files || []); if (!fs.length) return T.toast('กรุณาเลือกไฟล์', 'warn');
          const bad = fs.find((f) => !/\.(pdf|jpe?g|png|docx?|xlsx?)$/i.test(f.name)); if (bad) return T.toast('รองรับเฉพาะ PDF JPG JPEG PNG Word Excel', 'warn');
          try { T.loading(true); for (const f of fs) await T.vfiles.upload(v.id, f, $('#vdType', el2).value, $('#vdExp', el2).value || null, $('#vdNote', el2).value.trim() || null, rep ? rep.id : null); T.toast(rep ? 'เปลี่ยนไฟล์แล้ว' : `แนบเอกสารแล้ว ${fs.length} ไฟล์`, 'ok'); close(); load(); } catch (e) { T.err(e); } finally { T.loading(false); } }; } }); };
    const add = $('#vdAdd', el); if (add) add.onclick = () => upForm(null);
    load();
  }

  /* ---------- settings ---------- */
  async function pageSettings(page) {
    if (!T.isAdmin()) { page.innerHTML = '<div class="empty">เฉพาะผู้ดูแลระบบ</div>'; return; }
    const sa = T.session.role === 'SUPER_ADMIN'; let d; try { d = await T.auth('tnj_settings_get', {}, { silent: true }); } catch (e) { return T.err(e); }
    const rel = d.release || {}; const same = rel.version === T.C.APP_VERSION;
    page.innerHTML = `<div class="page-head"><h1>⚙️ ตั้งค่า</h1></div><div class="grid g2">
      <div class="card card-b"><h3 class="mb1">เวอร์ชัน</h3><div class="kv"><div class="k">Build ที่เปิดอยู่</div><div class="v">${h(T.C.APP_VERSION)}</div><div class="k">เวอร์ชันบนเซิร์ฟเวอร์</div><div class="v">${h(rel.version || '-')}</div><div class="k">Maintenance</div><div class="v">${rel.maintenance_active ? 'กำลังปรับปรุง ถึง ' + T.fmtDT(rel.maintenance_ends_at) : 'ปกติ'}</div><div class="k">เวลาเซิร์ฟเวอร์</div><div class="v">${T.fmtDT(rel.server_time)}</div></div>
        <div class="alert info mt1">เวอร์ชันใช้แสดง/ตรวจสอบเท่านั้น — ไม่ใช้บล็อกการเข้าระบบ</div>
        <div class="small muted mt1">ขั้นตอน Deploy: อัปโหลดไฟล์ขึ้น GitHub → Reload หน้าเว็บ → Login ใช้งานได้ทันที</div></div>
      <div class="card card-b"><h3 class="mb1">GPS</h3><div class="field"><label>ส่ง GPS ทุก (วินาที)</label><input type="number" class="inp" id="gpsInt" value="${h(d.settings.gps_interval_sec || 30)}" ${sa ? '' : 'disabled'}></div><div class="field"><label>ถือว่า GPS ขาดหายหลัง (นาที)</label><input type="number" class="inp" id="gpsStale" value="${h(d.settings.gps_stale_min || 5)}" ${sa ? '' : 'disabled'}></div>${sa ? '<button class="btn btn-p" id="gpsSave">บันทึก</button>' : ''}</div></div>
      ${sa ? '<div class="card mt2"><div class="card-h"><h3>ผู้ใช้ / สิทธิ์ (app_code: transport)</h3><button class="btn btn-p btn-sm" id="usAdd">+ เพิ่มผู้ใช้</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อผู้ใช้</th><th>ชื่อ</th><th>สิทธิ์ TRANSPORT NJ</th><th>role เดิม (app_users)</th><th>สถานะ</th><th></th></tr></thead><tbody id="usBody"></tbody></table></div></div>' : ''}`;
    const vg = $('#verGo'); if (vg) vg.onclick = async () => { if (!(await T.confirm('ประกาศเวอร์ชัน', `ประกาศ <b>${h(T.C.APP_VERSION)}</b> — ระบบจะเข้าสู่โหมดปรับปรุง 10 นาที ผู้ใช้ทุกคน (รวมคุณ) จะถูกออกจากระบบและต้อง Login ใหม่หลังครบเวลา`, 'ประกาศ', 'btn-r'))) return; try { const r = await T.auth('tnj_version_set', { p_version: T.C.APP_VERSION, p_maintenance_minutes: 10 }); T.showMaintenance(r); } catch (e) { T.err(e); } };
    const gs = $('#gpsSave'); if (gs) gs.onclick = async () => { try { await T.auth('tnj_settings_set', { p: { gps_interval_sec: $('#gpsInt').value, gps_stale_min: $('#gpsStale').value } }); T.toast('บันทึกแล้ว', 'ok'); } catch (e) { T.err(e); } };
    if (sa) { const ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT', 'DRIVER', 'VIEWER']; const loadUsers = async () => { try { const us = await T.auth('tnj_users_list', {}, { silent: true }); $('#usBody').innerHTML = us.map((u) => `<tr><td class="b">${h(u.username)}</td><td>${h(u.full_name || '')}</td><td><span class="badge blue">${h(u.tnj_role)}</span></td><td class="xs muted">${h(u.base_role)}</td><td>${u.is_active ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}</td><td><button class="btn btn-sm" data-u="${u.id}">✏️</button></td></tr>`).join(''); $$('[data-u]', page).forEach((b) => b.onclick = () => uform(us.find((x) => x.id === b.dataset.u))); } catch (e) { T.err(e); } };
      const uform = (u) => T.modal({ title: u ? 'แก้ไขผู้ใช้ ' + u.username : 'เพิ่มผู้ใช้', size: 's', body: `${u ? '' : '<div class="field"><label>ชื่อผู้ใช้ <span class="req">*</span></label><input class="inp" id="uUser" autocapitalize="off"></div>'}<div class="field"><label>ชื่อ-สกุล</label><input class="inp" id="uName" value="${h(u ? u.full_name || '' : '')}"></div><div class="field"><label>รหัสผ่าน ${u ? '(เว้นว่าง = ไม่เปลี่ยน)' : '<span class="req">*</span>'}</label><input class="inp" id="uPw" type="password" autocomplete="new-password"></div><div class="field"><label>สิทธิ์</label><select class="inp" id="uRole">${ROLES.map((r) => `<option ${u && u.tnj_role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>${u ? `<label class="check"><input type="checkbox" id="uAct" ${u.is_active ? 'checked' : ''}> เปิดใช้งาน</label>` : ''}`, foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="uGo">บันทึก</button>`, onOpen: (el, close) => { $('#uGo', el).onclick = async () => { const p = { id: u ? u.id : null, username: u ? u.username : $('#uUser', el).value.trim(), full_name: $('#uName', el).value.trim(), password: $('#uPw', el).value || null, tnj_role: $('#uRole', el).value, is_active: u ? $('#uAct', el).checked : true }; try { await T.auth('tnj_users_save', { p }); T.toast('บันทึกแล้ว', 'ok'); close(); loadUsers(); } catch (e) { T.err(e); } }; } });
      $('#usAdd').onclick = () => uform(null); loadUsers(); }
  }
})();
