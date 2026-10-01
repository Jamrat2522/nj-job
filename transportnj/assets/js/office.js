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
    ['dashboard', '🏠', 'หน้าหลัก'], ['jobs', '🚚', 'งานขนส่ง'], ['jobs/new', '➕', 'สร้างงาน'], ['map', '🗺️', 'แผนที่ GPS'], ['schedule', '📅', 'ตารางงาน'],
    ['reports', '📊', 'รายงาน'], ['mileage', '⛽', 'ไมล์รถ/น้ำมัน'], ['documents', '📁', 'เอกสาร'], ['masters/customers', '🏢', 'ลูกค้า'], ['masters/drivers', '👤', 'คนขับ'],
    ['masters/vehicles', '🚛', 'รถ'], ['masters/locations', '📍', 'สถานที่'], ['settings', '⚙️', 'ตั้งค่า'],
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
      app.innerHTML = `<div class="shell" id="officeShell"><aside class="sidebar" id="sb"><div class="logo"><span class="lg">NJ</span><div><div class="t1">TRANSPORT NJ</div><div class="t2">CONTAINER LOGISTICS</div></div></div>
        <nav class="nav" id="nav">${NAV.map(([p, ic, l]) => `<a href="#/${p}" data-nav="${p}"><span class="ic">${ic}</span>${l}</a>`).join('')}</nav>
        <div class="foot">เวอร์ชัน ${h(T.C.APP_VERSION)}<br><span id="rtState">●</span> Realtime</div></aside>
        <div class="main"><header class="topbar"><button class="btn btn-icon" id="sbToggle">☰</button><div class="search"><span class="ic">🔍</span><input class="inp" id="gSearch" placeholder="ค้นหา Job No. / B/L / ลูกค้า / ทะเบียนรถ / คนขับ ..."></div>
          <div class="grow"></div><button class="btn btn-icon bell" id="bell" title="งานมีปัญหา">🔔<span class="n hidden" id="bellN"></span></button>
          <div class="user-chip"><div class="avatar">${h((T.session.full_name || '?').slice(0, 1))}</div><div class="nm"><div class="b small">${h(T.session.full_name)}</div><div class="xs muted">${h(T.session.role)}</div></div><button class="btn btn-sm" id="logoutBtn">ออก</button></div></header>
        <main class="content" id="page"></main></div></div>`;
      $('#logoutBtn').onclick = () => T.logout();
      $('#sbToggle').onclick = () => { $('#sb').classList.toggle('open'); let m = $('.sb-mask'); if ($('#sb').classList.contains('open') && !m) { m = document.createElement('div'); m.className = 'sb-mask'; m.onclick = () => { $('#sb').classList.remove('open'); m.remove(); }; document.body.appendChild(m); } else if (m) m.remove(); };
      $('#nav').onclick = () => { $('#sb').classList.remove('open'); const m = $('.sb-mask'); if (m) m.remove(); };
      $('#gSearch').onkeydown = (e) => { if (e.key === 'Enter') T.go('jobs?q=' + encodeURIComponent(e.target.value.trim())); };
      $('#bell').onclick = () => T.go('jobs?status=PROBLEM');
      refreshBell();
      T.subscribe('tnj:office', (p, ev) => { if (ev === 'problem') { T.toast(`⚠ แจ้งปัญหา ${p.job_no || ''}: ${p.type || ''}`, 'err', 8000); refreshBell(); } if (ev === 'version') T.checkVersion(true); });
    }
    $$('#nav a').forEach((a) => a.classList.toggle('active', r.path === a.dataset.nav || (a.dataset.nav !== 'jobs/new' && a.dataset.nav !== 'dashboard' && r.path.startsWith(a.dataset.nav))));
    const rt = T._rt['tnj:office']; const rs = $('#rtState'); if (rs) rs.style.color = rt && rt.state === 'SUBSCRIBED' ? '#4ADE80' : '#F59E0B';
    return $('#page');
  }
  async function refreshBell() { try { const d = await T.auth('tnj_dashboard_counts', {}, { silent: true }); const n = $('#bellN'); if (!n) return; n.textContent = d.problem_open; n.classList.toggle('hidden', !d.problem_open); } catch (_) { } }

  T.pages.office = async (app, r) => {
    const page = shell(app, r); const p = r.seg[0] || 'dashboard';
    // keep office channel alive across pages (stopRealtime removed it) — resubscribe
    if (!T._rt['tnj:office']) T.subscribe('tnj:office', (p2, ev) => { if (ev === 'problem') { T.toast(`⚠ แจ้งปัญหา ${p2.job_no || ''}: ${p2.type || ''}`, 'err', 8000); refreshBell(); } if (ev === 'version') T.checkVersion(true); });
    if (p === 'dashboard') return pageDashboard(page, r);
    if (p === 'jobs' && r.seg[1] === 'new') return pageJobForm(page, null);
    if (p === 'jobs' && r.seg[1]) return pageJobDetail(page, r.seg[1], r.q.tab);
    if (p === 'jobs') return pageJobs(page, r);
    if (p === 'map') return pageMap(page);
    if (p === 'schedule') return pageSchedule(page, r);
    if (p === 'mileage') return pageMileage(page, r);
    if (p === 'reports') return pageReports(page, r);
    if (p === 'documents') return pageDocuments(page, r);
    if (p === 'masters') return pageMasters(page, r.seg[1] || 'customers');
    if (p === 'settings') return pageSettings(page);
    page.innerHTML = '<div class="empty">ไม่พบหน้า</div>';
  };

  /* ---------- Leaflet helpers ---------- */
  function mkMap(el, center) { const map = L.map(el, { zoomControl: true }).setView(center || [13.1, 100.9], 9); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map); return map; }
  const truckIcon = (grp, stale) => L.divIcon({ className: 'truck-marker', html: `<div class="tm ${stale ? 'stale' : grp}">🚚</div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] });
  const pinIcon = (color, emo) => L.divIcon({ className: 'truck-marker', html: `<div class="pin" style="background:${color}"><span>${emo}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] });
  function vehPopup(v) { return `<b>${h(v.license_plate || '-')}</b> ${h(v.vehicle_name || '')}<br>👤 ${h(v.driver_name || '-')}<br>📋 <a href="#/jobs/${v.job_id}">${h(v.job_no)}</a><br>🏢 ${h(v.customer_name)}<br>📦 ${h(v.container_no || '-')}<br>${T.badge(v.status)}<br><span class="${v.gps_stale ? 'gps-stale' : 'gps-ok'}">${h(v.last_gps_at ? T.ago(v.last_gps_at) : 'ไม่มี GPS')}</span>${v.speed != null && !v.gps_stale ? ` · ${Math.round(v.speed * 3.6)} กม./ชม.` : ''}<br><a href="#/jobs/${v.job_id}" class="btn btn-sm btn-p" style="margin-top:6px;color:#fff">เปิด Job Detail</a>`; }
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

  /* ---------- jobs table ---------- */
  function jobsTable(rows, opt = {}) {
    if (!rows.length) return '<div class="empty">ไม่พบงาน</div>';
    if (isMobile()) return rows.map((j) => `<div class="jobcard click" data-job="${j.id}"><div class="flex between"><span class="jn" style="font-size:17px">${h(j.job_no)}</span>${T.badge(j.status)}</div><div class="small">${h(j.customer_name)} · B/L ${h(j.bl_no)} · ${h(j.container_no || '-')}</div><div class="small muted">🚛 ${h(j.license_plate || '-')} · 👤 ${h(j.driver_name || '-')}</div><div class="xs">📍 ${h(j.pickup_location_text)} → 🏭 ${h(j.factory_location_text)} → ↩️ ${h(j.return_location_text)}</div><div class="xs">${T.gpsCell(j)}</div></div>`).join('');
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Job No.</th><th>วันที่</th><th>ลูกค้า</th><th>B/L</th><th>Container</th><th>รถ</th><th>ทะเบียนรถ</th><th>คนขับ</th><th>ท่ารับ</th><th>โรงงาน</th><th>คืนตู้</th><th>Status</th><th>GPS ล่าสุด</th><th></th></tr></thead><tbody>
      ${rows.map((j) => `<tr class="click" data-job="${j.id}"><td class="b nowrap">${h(j.job_no)}</td><td class="nowrap">${T.fmtD(j.job_date)}</td><td class="ell" style="max-width:160px">${h(j.customer_name)}</td><td>${h(j.bl_no)}</td><td>${h(j.container_no || '-')}</td><td>${h(j.vehicle_name || '-')}</td><td class="nowrap">${h(j.license_plate || '-')}</td><td class="nowrap">${h(j.driver_name || '-')}</td><td class="ell" style="max-width:130px">${h(j.pickup_location_text)}</td><td class="ell" style="max-width:130px">${h(j.factory_location_text)}</td><td class="ell" style="max-width:130px">${h(j.return_location_text)}</td><td>${T.badge(j.status)}</td><td class="nowrap">${T.gpsCell(j)}</td><td class="nowrap"><a class="btn btn-sm" href="#/jobs/${j.id}">👁</a>${j.last_lat != null ? `<a class="btn btn-sm ml1" href="#/jobs/${j.id}?tab=gps">🗺</a>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function bindJobRows(root) { $$('[data-job]', root).forEach((el) => el.onclick = (e) => { if (e.target.closest('a')) return; T.go('jobs/' + el.dataset.job); }); }

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
    const loadList = async () => { try { const d = await T.auth('tnj_job_list', { p: { job_date: date, statuses: stFilter, q: $('#tdQ').value.trim(), page_size: 200 } }, { silent: true }); $('#tdCount').textContent = `(${d.total})`; $('#tdList').innerHTML = jobsTable(d.rows); bindJobRows($('#tdList')); } catch (e) { console.warn(e); } };
    $$('#stats .stat').forEach((c) => c.onclick = () => { const def = CARDS.find((x) => x[0] === c.dataset.k); const same = c.classList.contains('active'); $$('#stats .stat').forEach((x) => x.classList.remove('active')); if (same || !def[3]) { stFilter = null; } else { c.classList.add('active'); stFilter = def[3]; } loadList(); });
    $('#tdQ').oninput = T.debounce(loadList, 350);
    loadCounts(); loadList();
    const refresh = T.debounce(() => { loadCounts(); loadList(); }, 1200);
    T.subscribe('tnj:office', refresh); T.every('dash', 60000, refresh);
  }

  /* ---------- jobs list ---------- */
  async function pageJobs(page, r) {
    await loadMasters(); const q = r.q; let pageNo = Number(q.page || 1);
    page.innerHTML = `<div class="page-head"><h1>งานขนส่ง</h1><div class="flex"><button class="btn" id="jfClear">ล้างตัวกรอง</button><a class="btn btn-p" href="#/jobs/new">+ สร้างงานขนส่ง</a></div></div>
      <div class="card card-b mb2"><div class="grid g4" id="jf">
        <div class="field"><label>Keyword</label><input class="inp" name="q" value="${h(q.q || '')}" placeholder="Job No. / B/L / ลูกค้า / Container / คนขับ / ทะเบียน"></div>
        <div class="field"><label>วันที่</label><div class="inline-row"><input type="date" class="inp" name="date_from" value="${h(q.date || q.date_from || '')}"><input type="date" class="inp" name="date_to" value="${h(q.date || q.date_to || '')}"></div></div>
        <div class="field"><label>ลูกค้า</label><input class="inp" name="customer" list="dlCust" value="${h(q.customer || '')}"><datalist id="dlCust">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div>
        <div class="field"><label>คนขับ</label><select class="inp" name="driver_id">${opts(M.drivers, 'id', 'full_name', q.driver_id, 'ทั้งหมด')}</select></div>
        <div class="field"><label>รถ</label><select class="inp" name="vehicle_id">${opts(M.vehicles, 'id', (v) => `${v.vehicle_name} (${v.license_plate})`, q.vehicle_id, 'ทั้งหมด')}</select></div>
        <div class="field"><label>ทะเบียนรถ</label><input class="inp" name="license_plate" value="${h(q.license_plate || '')}"></div>
        <div class="field"><label>Status</label><select class="inp" name="status"><option value="">ทั้งหมด</option>${stOpts(q.status)}</select></div>
        <div class="field"><label>ท่ารับ / โรงงาน</label><div class="inline-row"><input class="inp" name="pickup" placeholder="ท่ารับ" value="${h(q.pickup || '')}"><input class="inp" name="factory" placeholder="โรงงาน" value="${h(q.factory || '')}"></div></div>
      </div></div><div class="card"><div id="jList"></div><div class="pager" id="jPager"></div></div>`;
    const read = () => { const o = { page: pageNo, page_size: 50 }; $$('#jf [name]').forEach((i) => { if (i.value) o[i.name] = i.value; }); return o; };
    const load = async () => { try { const d = await T.auth('tnj_job_list', { p: read() }, { silent: true }); $('#jList').innerHTML = jobsTable(d.rows); bindJobRows($('#jList')); const pages = Math.max(1, Math.ceil(d.total / d.page_size)); $('#jPager').innerHTML = `<span class="muted small">ทั้งหมด ${d.total} รายการ · หน้า ${d.page}/${pages}</span><button class="btn btn-sm" id="pgPrev" ${d.page <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="pgNext" ${d.page >= pages ? 'disabled' : ''}>›</button>`; $('#pgPrev').onclick = () => { pageNo--; load(); }; $('#pgNext').onclick = () => { pageNo++; load(); }; } catch (e) { T.err(e); } };
    $$('#jf [name]').forEach((i) => i.addEventListener(i.tagName === 'SELECT' || i.type === 'date' ? 'change' : 'input', T.debounce(() => { pageNo = 1; load(); }, 400)));
    $('#jfClear').onclick = () => T.go('jobs');
    load(); T.subscribe('tnj:office', T.debounce(load, 1500)); T.every('jobs', 60000, load);
  }

  /* ---------- job form (create / edit) ---------- */
  function locField(name, label, job, idKey, textKey, required) {
    const list = M.locations; const curId = job ? job[idKey] : ''; const curText = job ? job[textKey] : '';
    return `<div class="field"><label>${label}${required ? ' <span class="req">*</span>' : ''}</label><div class="flex"><input class="inp grow" name="${textKey}" list="dl_${name}" value="${h(curText || '')}" placeholder="เลือกจากรายการ หรือพิมพ์ชื่อสถานที่" data-loc="${name}" data-idkey="${idKey}"><input type="hidden" name="${idKey}" value="${h(curId || '')}"><button type="button" class="btn btn-icon" data-map="${name}" title="เปิด Google Maps">🗺</button></div><datalist id="dl_${name}">${list.map((l) => `<option value="${h(l.name)}">${h(l.location_type)} ${h(l.address || '')}</option>`).join('')}</datalist></div>`;
  }
  async function pageJobForm(page, job) {
    await loadMasters(true); const isNew = !job; const v = (k, d = '') => h(job ? (job[k] == null ? '' : String(job[k]).slice(0, k.endsWith('_time') ? 5 : 100)) : d);
    page.innerHTML = `<div class="page-head"><h1>${isNew ? '+ สร้างงานขนส่ง' : 'แก้ไขงาน ' + h(job.job_no)}</h1><a class="btn" href="${isNew ? '#/jobs' : '#/jobs/' + job.id}">ยกเลิก</a></div><form id="jobForm" class="card card-b" style="max-width:1100px">
      <div class="grid g2"><div class="form-section"><h4>📋 ข้อมูลงาน</h4>
        <div class="inline-row"><div class="field"><label>Job No.</label><input class="inp" value="${isNew ? 'สร้างอัตโนมัติ' : v('job_no')}" disabled></div><div class="field"><label>วันที่งาน</label><input type="date" class="inp" name="job_date" value="${v('job_date', T.todayISO())}" ${isNew ? '' : 'disabled'}></div></div>
        <div class="field"><label>ชื่อลูกค้า <span class="req">*</span></label><input class="inp" name="customer_name" list="dlCust2" value="${v('customer_name')}" required><datalist id="dlCust2">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div>
        <div class="inline-row"><div class="field"><label>B/L <span class="req">*</span></label><input class="inp" name="bl_no" value="${v('bl_no')}" required></div><div class="field"><label>Booking</label><input class="inp" name="booking_no" value="${v('booking_no')}"></div></div>
        <div class="inline-row"><div class="field"><label>Container No.</label><input class="inp" name="container_no" value="${v('container_no')}"></div><div class="field"><label>Container Size</label><select class="inp" name="container_size"><option value="">-</option>${["20'", "40'", "40'HC", "45'", 'LCL', 'อื่น ๆ'].map((s) => `<option ${job && job.container_size === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="field"><label>Seal No.</label><input class="inp" name="seal_no" value="${v('seal_no')}"></div></div>
        ${isNew ? `<div class="inline-row"><div class="field"><label>รถ / ทะเบียนรถ</label><select class="inp" name="vehicle_id">${opts(M.vehicles, 'id', (x) => `${x.vehicle_name} (${x.license_plate})${x.active_job ? ' — มีงาน ' + x.active_job.job_no : ''}`, '')}</select></div><div class="field"><label>ชื่อคนขับ <span class="req">*</span></label><select class="inp" name="driver_id">${opts(M.drivers, 'id', (x) => `${x.full_name}${x.active_job ? ' — กำลังทำ ' + x.active_job.job_no : ''}`, '')}</select></div></div>` : `<div class="alert info">รถ/คนขับ แก้ไขได้ที่ปุ่ม "สั่งงาน" ในหน้ารายละเอียด (ก่อนคนขับรับงาน)</div>`}
        <div class="field"><label>หมายเหตุงาน</label><textarea class="inp" name="job_note">${v('job_note')}</textarea></div></div>
      <div><div class="form-section"><h4>📍 จุดรับตู้</h4>${locField('pickup', 'ท่ารับตู้', job, 'pickup_location_id', 'pickup_location_text', true)}
        <div class="inline-row"><div class="field"><label>วันที่รับตู้ <span class="req">*</span></label><input type="date" class="inp" name="pickup_date" value="${v('pickup_date', T.todayISO())}" required></div><div class="field"><label>เวลา <span class="req">*</span></label><input type="time" class="inp" name="pickup_time" value="${v('pickup_time', '09:00')}" required></div></div>
        <div class="field"><label>หมายเหตุ</label><input class="inp" name="pickup_note" value="${v('pickup_note')}"></div></div>
      <div class="form-section"><h4>🏭 จุดส่งโรงงาน</h4>${locField('factory', 'สถานที่ส่งโรงงาน', job, 'factory_location_id', 'factory_location_text', true)}
        <div class="inline-row"><div class="field"><label>วันที่ถึงโรงงาน</label><input type="date" class="inp" name="factory_date" value="${v('factory_date')}"></div><div class="field"><label>เวลา</label><input type="time" class="inp" name="factory_time" value="${v('factory_time')}"></div></div>
        <div class="inline-row"><div class="field"><label>Contact โรงงาน</label><input class="inp" name="factory_contact" value="${v('factory_contact')}"></div><div class="field"><label>เบอร์โทร</label><input class="inp" name="factory_phone" value="${v('factory_phone')}"></div></div>
        <div class="field"><label>หมายเหตุ</label><input class="inp" name="factory_note" value="${v('factory_note')}"></div></div>
      <div class="form-section"><h4>↩️ จุดคืนตู้</h4>${locField('return', 'สถานที่คืนตู้', job, 'return_location_id', 'return_location_text', true)}
        <div class="inline-row"><div class="field"><label>วันที่คืนตู้ <span class="req">*</span></label><input type="date" class="inp" name="return_date" value="${v('return_date', T.todayISO())}" required></div><div class="field"><label>เวลา <span class="req">*</span></label><input type="time" class="inp" name="return_time" value="${v('return_time', '16:00')}" required></div></div>
        <div class="field"><label>หมายเหตุ</label><input class="inp" name="return_note" value="${v('return_note')}"></div></div></div></div>
      ${isNew ? '' : '<div class="field"><label>เหตุผลที่แก้ไข (บันทึกลง Timeline)</label><input class="inp" name="edit_note"></div>'}
      <div class="flex" style="justify-content:flex-end">${isNew ? '<button type="submit" class="btn btn-lg" data-mode="save">บันทึกงาน (ยังไม่สั่งงาน)</button><button type="submit" class="btn btn-p btn-lg" data-mode="assign">บันทึก + สั่งงาน</button>' : '<button type="submit" class="btn btn-p btn-lg">บันทึกการแก้ไข</button>'}</div></form>`;
    // location id sync + map
    $$('[data-loc]', page).forEach((inp) => { const hid = inp.parentElement.querySelector('input[type=hidden]'); const sync = () => { const l = M.locations.find((x) => x.name === inp.value.trim()); hid.value = l ? l.id : ''; }; inp.addEventListener('input', sync); inp.addEventListener('change', sync); });
    $$('[data-map]', page).forEach((b) => b.onclick = () => { const inp = $(`[data-loc="${b.dataset.map}"]`, page); const l = M.locations.find((x) => x.name === inp.value.trim()); window.open(T.mapsUrl(l, inp.value.trim()), '_blank'); });
    let mode = 'save'; $$('button[type=submit]', page).forEach((b) => b.onclick = () => { mode = b.dataset.mode || 'save'; });
    $('#jobForm').onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target); const p = {}; fd.forEach((val, k) => { p[k] = String(val).trim(); });
      if (mode === 'assign' && !p.driver_id) return T.toast('กรุณาเลือกคนขับก่อนสั่งงาน', 'warn');
      try { if (isNew) { p.assign_now = mode === 'assign'; const j = await T.auth('tnj_job_create', { p }); T.toast(`สร้างงาน ${j.job_no} แล้ว${j.status === 'ASSIGNED' ? ' และสั่งงานคนขับแล้ว' : ''}`, 'ok'); T.go('jobs/' + j.id); } else { await T.auth('tnj_job_update', { p_job_id: job.id, p }); T.toast('บันทึกการแก้ไขแล้ว', 'ok'); T.go('jobs/' + job.id); } } catch (er) { T.err(er); }
    };
  }

  /* ---------- assign dialog ---------- */
  async function assignDialog(job, onDone) {
    await loadMasters(true);
    T.modal({ title: `สั่งงาน ${job.job_no}`, size: 's', body: `<div class="field"><label>รถ / ทะเบียนรถ</label><select class="inp inp-lg" id="asVeh">${opts(M.vehicles, 'id', (x) => `${x.vehicle_name} (${x.license_plate})${x.active_job ? ' — มีงาน ' + x.active_job.job_no : ''}`, job.vehicle_id)}</select></div>
      <div class="field"><label>คนขับ <span class="req">*</span></label><select class="inp inp-lg" id="asDrv">${opts(M.drivers, 'id', (x) => `${x.full_name}${x.phone ? ' · ' + x.phone : ''}${x.active_job ? ' — กำลังทำ ' + x.active_job.job_no : ''}`, job.driver_id)}</select></div><div class="alert info">คนขับจะเห็นงานบนมือถือทันที และต้องกด "รับงาน"</div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="asGo">🚚 สั่งงาน</button>`, onOpen: (el, close) => { $('#asGo', el).onclick = async () => { const d = $('#asDrv', el).value; if (!d) return T.toast('กรุณาเลือกคนขับ', 'warn'); try { await T.auth('tnj_job_assign', { p_job_id: job.id, p_vehicle_id: $('#asVeh', el).value || null, p_driver_id: d }); T.toast('สั่งงานแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } }; } });
  }

  /* ---------- UPDATE TIMELINE dialog (office) ---------- */
  function timelineDialog(job, onDone) {
    const cur = job.status; const allowed = T.STATUS.slice(2, 13).filter((s) => s !== cur && T.statusOrder(cur) >= 2);
    T.modal({ title: `+ UPDATE TIMELINE — ${job.job_no}`, body: `<div class="alert info">สถานะปัจจุบัน: ${T.badge(cur)} ${cur === 'PROBLEM' ? '— งานมีปัญหา ใช้ปุ่ม "แก้ไขปัญหาแล้ว" ก่อน' : ''}</div>
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
    T.modal({ title: `แก้ไขข้อมูลไมล์ (ADMIN) — ${job.job_no}`, size: 's', body: `<div class="alert warn">การแก้ไขจะถูกบันทึกใน Audit Log พร้อมค่าเดิม/ค่าใหม่</div><div class="inline-row"><div class="field"><label>ไมล์ก่อน</label><input type="number" step="1" class="inp" id="meS" value="${m.start_mileage != null ? Number(m.start_mileage) : ''}"></div><div class="field"><label>ไมล์หลัง</label><input type="number" step="1" class="inp" id="meE" value="${m.end_mileage != null ? Number(m.end_mileage) : ''}"></div></div><div class="field"><label>เหตุผล <span class="req">*</span></label><input class="inp" id="meR"></div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="meGo">บันทึก</button>`, onOpen: (el, close) => { $('#meGo', el).onclick = async () => { const r = $('#meR', el).value.trim(); if (!r) return T.toast('กรุณาระบุเหตุผล', 'warn'); try { await T.auth('tnj_mileage_edit', { p_job_id: job.id, p_start: $('#meS', el).value || null, p_end: $('#meE', el).value || null, p_reason: r }); T.toast('บันทึกแล้ว', 'ok'); close(); onDone && onDone(); } catch (e) { T.err(e); } }; } });
  }

  /* ---------- job detail (page + drawer) ---------- */
  async function pageJobDetail(page, id, tab) { page.innerHTML = '<div class="empty">กำลังโหลด...</div>'; await renderJobDetail(page, id, { tab, pageMode: true }); }
  T.renderJobDetail = renderJobDetail;
  async function renderJobDetail(root, id, opt = {}) {
    let job; try { job = await T.auth('tnj_job_get', { p_job_id: id }, { silent: true }); } catch (e) { root.innerHTML = `<div class="empty">${h(T.parseErr(e).text)}</div>`; return; }
    const canEdit = T.canEdit(), admin = T.isAdmin(); const m = job.mileage || {}; let tab = opt.tab || 'info'; let map = null;
    const live = !['NEW', 'ASSIGNED', 'COMPLETED', 'CANCELLED'].includes(job.status);
    const canClose = canEdit && (job.status === 'CONTAINER_RETURNED' || (admin && T.ACTIVE.has(job.status) && job.status !== 'PROBLEM'));
    root.innerHTML = `<div class="page-head"><div><div class="flex flex-wrap"><h1>${h(job.job_no)}</h1>${T.badge(job.status)}${job.incomplete_flag ? '<span class="badge amber">⚠ ข้อมูลไม่ครบ</span>' : ''}${m.warning_flag ? '<span class="badge amber">⚠ ตรวจสอบไมล์</span>' : ''}</div><div class="muted small">${h(job.customer_name)} · B/L ${h(job.bl_no)} · ${h(job.container_no || '-')} ${h(job.container_size || '')} · 🚛 ${h(job.license_plate || '-')} · 👤 ${h(job.driver_name || '-')}${job.driver_phone ? ` <a href="tel:${h(job.driver_phone)}">📞 ${h(job.driver_phone)}</a>` : ''}</div></div>
      <div class="flex flex-wrap" id="jdActions">${opt.pageMode ? '<a class="btn" href="#/jobs">‹ รายการงาน</a>' : `<a class="btn" href="#/jobs/${job.id}">เปิดหน้าเต็ม</a>`}
        ${canEdit && ['NEW', 'ASSIGNED'].includes(job.status) ? '<button class="btn btn-p" data-act="assign">🚚 สั่งงาน</button>' : ''}
        ${canEdit && !['COMPLETED', 'CANCELLED'].includes(job.status) ? '<button class="btn" data-act="edit">✏️ แก้ไข</button>' : ''}
        ${canEdit && job.status === 'PROBLEM' ? '<button class="btn btn-g" data-act="resolve">✅ แก้ไขปัญหาแล้ว</button>' : ''}
        ${canClose ? '<button class="btn btn-navy" data-act="close">🏁 ปิดงาน</button>' : ''}
        ${canEdit && !['COMPLETED', 'CANCELLED'].includes(job.status) ? '<button class="btn btn-r" data-act="cancel">ยกเลิกงาน</button>' : ''}</div></div>
      ${job.status === 'CANCELLED' ? `<div class="alert err">ยกเลิกงาน: ${h(job.cancel_reason || '')} (${T.fmtDT(job.cancelled_at)})</div>` : ''}
      ${job.incomplete_flag ? '<div class="alert warn">⚠ งานจบแล้ว แต่ยังไม่ได้บันทึกไมล์หลัง</div>' : ''}
      <div class="tabs" id="jdTabs">${[['info', 'A. ข้อมูลงาน'], ['gps', 'B. Live GPS'], ['timeline', `C. Timeline (${job.timeline.length})`], ['docs', `D. เอกสาร (${job.files.length})`], ['fuel', 'E. ไมล์ / น้ำมัน'], ['audit', 'ประวัติแก้ไข']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'active' : ''}">${l}</button>`).join('')}</div><div id="jdBody"></div>`;
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
        body.innerHTML = `<div class="card card-b"><div class="flex between mb2"><h3>Timeline</h3>${canEdit && job.status !== 'CANCELLED' && job.status !== 'COMPLETED' ? '<button class="btn btn-p" id="tlAdd">+ UPDATE TIMELINE</button>' : (canEdit ? '<button class="btn" id="tlAdd">+ เพิ่มหมายเหตุ / ไฟล์</button>' : '')}</div>${timelineHtml(job.timeline, admin)}</div>`;
        const b = $('#tlAdd', body); if (b) b.onclick = () => timelineDialog(job, reload);
        bindTimeline(body, job, reload);
      } else if (tab === 'docs') {
        body.innerHTML = `<div class="card card-b"><div class="flex between mb1"><h3>เอกสาร (${job.files.length})</h3>${canEdit && job.status !== 'CANCELLED' ? '<button class="btn btn-p" id="upBtn">+ แนบไฟล์</button>' : ''}</div><div class="flex flex-wrap mb1" id="dfTypes"><button class="chip active" data-t="">ทั้งหมด</button>${[...new Set(job.files.map((f) => f.file_type))].map((t) => `<button class="chip" data-t="${h(t)}">${h(t)}</button>`).join('')}</div><div id="dfList">${job.files.map((f) => T.fileRow(f, canEdit)).join('') || '<div class="empty">ยังไม่มีเอกสาร</div>'}</div></div>`;
        const u = $('#upBtn', body); if (u) u.onclick = async () => { const r = await T.uploadDialog(job.id); if (r) reload(); };
        T.bindFileRows(body, job.files, reload);
        $$('#dfTypes .chip', body).forEach((c) => c.onclick = () => { $$('#dfTypes .chip', body).forEach((x) => x.classList.toggle('active', x === c)); const t = c.dataset.t; $$('.filebox', body).forEach((row) => { const f = job.files.find((x) => x.id === row.dataset.fid); row.classList.toggle('hidden', !!t && f.file_type !== t); }); });
      } else if (tab === 'fuel') {
        body.innerHTML = `<div class="grid g2"><div class="card card-b"><div class="flex between mb1"><h3>ไมล์ / ระยะทาง</h3>${admin ? '<button class="btn btn-sm" id="meEdit">✏️ แก้ไข (ADMIN)</button>' : ''}</div>
          ${m.warning_note ? `<div class="alert warn">${h(m.warning_note)}</div>` : ''}<div class="kv"><div class="k">สถานะไมล์</div><div class="v">${h(job.mileage_status)}</div><div class="k">ไมล์ก่อน</div><div class="v">${T.num(m.start_mileage)} กม. <span class="muted xs">${m.start_at ? T.fmtDT(m.start_at) : ''}</span></div><div class="k">ไมล์หลัง</div><div class="v">${T.num(m.end_mileage)} กม. <span class="muted xs">${m.end_at ? T.fmtDT(m.end_at) : ''}</span></div><div class="k">ระยะทาง</div><div class="v b" style="font-size:18px">${T.num(m.total_distance)} กม.</div><div class="k">น้ำมันรวม</div><div class="v">${T.num(job.fuel_liters, 2)} ลิตร</div><div class="k">ค่าน้ำมันรวม</div><div class="v">${T.num(job.fuel_amount, 2)} บาท</div><div class="k">กม./ลิตร</div><div class="v b" style="font-size:18px">${T.kml(job.km_per_liter)}</div></div>
          <div class="mt1 flex flex-wrap">${[m.start_mileage_image, m.end_mileage_image].map((fid, i) => { const f = job.files.find((x) => x.id === fid); return f ? `<button class="btn btn-sm" data-img="${f.id}">🖼 รูปไมล์${i ? 'หลัง' : 'ก่อน'}</button>` : ''; }).join('')}</div></div>
          <div class="card card-b"><div class="flex between mb1"><h3>น้ำมัน (${job.fuel.length})</h3>${canEdit && job.status !== 'CANCELLED' ? '<button class="btn btn-sm btn-p" id="fuAdd">+ เพิ่มรายการ</button>' : ''}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันเวลา</th><th>ปั๊ม</th><th>ไมล์</th><th class="r">ลิตร</th><th class="r">บาท/ลิตร</th><th class="r">รวม</th><th>ใบเสร็จ</th><th></th></tr></thead><tbody>${job.fuel.map((f) => `<tr><td class="nowrap">${T.fmtDT(f.fuel_date)}</td><td>${h(f.fuel_station || '-')}<div class="xs muted">${h(f.fuel_type || '')}</div></td><td>${T.num(f.mileage)}</td><td class="r">${T.num(f.liters, 2)}</td><td class="r">${T.num(f.price_per_liter, 2)}</td><td class="r b">${T.num(f.total_amount, 2)}</td><td>${h(f.receipt_no || '-')} ${f.receipt_file ? `<button class="btn btn-sm" data-img="${f.receipt_file}">🧾</button>` : ''}</td><td class="nowrap">${admin || (canEdit && job.status !== 'COMPLETED') ? `<button class="btn btn-sm" data-fe="${f.id}">✏️</button> <button class="btn btn-sm btn-r" data-fd="${f.id}">🗑</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">ยังไม่มีรายการน้ำมัน</td></tr>'}</tbody>${job.fuel.length ? `<tfoot><tr><td colspan="3">รวม</td><td class="r">${T.num(job.fuel_liters, 2)}</td><td></td><td class="r">${T.num(job.fuel_amount, 2)}</td><td colspan="2"></td></tr></tfoot>` : ''}</table></div></div></div>`;
        const me = $('#meEdit', body); if (me) me.onclick = () => mileageEditDialog(job, reload);
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
      if (a === 'close') { const warn = !m.end_mileage ? '<div class="alert warn">⚠ งานนี้ยังไม่ได้บันทึกไมล์หลัง — ปิดงานได้ แต่จะติดสถานะ "ข้อมูลไม่ครบ"</div>' : ''; if (!(await T.confirm('ปิดงาน', warn + `ยืนยันปิดงาน <b>${h(job.job_no)}</b> ?`, 'ปิดงาน', 'btn-navy'))) return; try { await T.auth('tnj_status_update', { p_job_id: job.id, p_status: 'COMPLETED' }); T.toast('ปิดงานแล้ว', 'ok'); reload(); } catch (e) { T.err(e); } return; }
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
  function pageMap(page) { page.innerHTML = `<div class="page-head"><h1>แผนที่ GPS</h1></div><div id="fm"></div>`; liveMap($('#fm'), { tall: true }); }

  /* ---------- schedule ---------- */
  async function pageSchedule(page, r) {
    await loadMasters(); const start = r.q.from || T.todayISO(); const d0 = new Date(start); const d1 = new Date(d0); d1.setDate(d1.getDate() + 6); const to = r.q.to || `${d1.getFullYear()}-${T.pad(d1.getMonth() + 1)}-${T.pad(d1.getDate())}`;
    page.innerHTML = `<div class="page-head"><h1>ตารางงาน</h1><div class="flex"><input type="date" class="inp" id="scFrom" value="${start}"><span>ถึง</span><input type="date" class="inp" id="scTo" value="${to}"><select class="inp" id="scDrv">${opts(M.drivers, 'id', 'full_name', r.q.driver_id, 'คนขับทั้งหมด')}</select><button class="btn btn-p" id="scGo">แสดง</button></div></div><div id="scBody"></div>`;
    $('#scGo').onclick = () => T.go(`schedule?from=${$('#scFrom').value}&to=${$('#scTo').value}&driver_id=${$('#scDrv').value}`);
    const load = async () => { try { const d = await T.auth('tnj_job_list', { p: { date_from: start, date_to: to, driver_id: r.q.driver_id || '', page_size: 500 } }, { silent: true }); const by = {}; d.rows.forEach((j) => { (by[j.pickup_date || j.job_date] = by[j.pickup_date || j.job_date] || []).push(j); }); const days = Object.keys(by).sort();
      $('#scBody').innerHTML = days.length ? days.map((day) => `<div class="card mb2"><div class="card-h"><h3>📅 ${T.fmtD(day)} <span class="muted small">(${by[day].length} งาน)</span></h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>เวลารับ</th><th>Job No.</th><th>ลูกค้า</th><th>Container</th><th>ท่ารับ</th><th>โรงงาน (เวลา)</th><th>คืนตู้ (เวลา)</th><th>รถ / คนขับ</th><th>Status</th></tr></thead><tbody>${by[day].sort((a, b) => String(a.pickup_time).localeCompare(String(b.pickup_time))).map((j) => `<tr class="click" data-job="${j.id}"><td class="b">${T.fmtT(j.pickup_time)}</td><td class="b">${h(j.job_no)}</td><td>${h(j.customer_name)}</td><td>${h(j.container_no || '-')}</td><td>${h(j.pickup_location_text)}</td><td>${h(j.factory_location_text)} ${j.factory_time ? '(' + T.fmtT(j.factory_time) + ')' : ''}</td><td>${h(j.return_location_text)} (${T.fmtD(j.return_date)} ${T.fmtT(j.return_time)})</td><td>${h(j.license_plate || '-')} / ${h(j.driver_name || '-')}</td><td>${T.badge(j.status)}</td></tr>`).join('')}</tbody></table></div></div>`).join('') : '<div class="empty">ไม่มีงานในช่วงวันที่เลือก</div>'; bindJobRows($('#scBody')); } catch (e) { T.err(e); } };
    load(); T.subscribe('tnj:office', T.debounce(load, 1500));
  }

  /* ---------- mileage / fuel table ---------- */
  async function pageMileage(page, r) {
    await loadMasters(); let pageNo = 1;
    page.innerHTML = `<div class="page-head"><h1>ไมล์รถ / น้ำมัน</h1></div><div class="card card-b mb2"><div class="grid g4" id="mf"><div class="field"><label>ค้นหา</label><input class="inp" name="q" placeholder="Job / B/L / ทะเบียน / คนขับ"></div><div class="field"><label>วันที่</label><div class="inline-row"><input type="date" class="inp" name="date_from"><input type="date" class="inp" name="date_to"></div></div><div class="field"><label>รถ</label><select class="inp" name="vehicle_id">${opts(M.vehicles, 'id', (v) => `${v.vehicle_name} (${v.license_plate})`, '', 'ทั้งหมด')}</select></div><div class="field"><label>สถานะข้อมูลไมล์</label><select class="inp" name="mileage_status"><option value="">ทั้งหมด</option>${['รอบันทึกไมล์ก่อน', 'กำลังวิ่งงาน', 'รอบันทึกไมล์หลัง', 'ข้อมูลไม่ครบ', 'ตรวจสอบ', 'ปิดงานแล้ว'].map((s) => `<option>${s}</option>`).join('')}</select></div></div></div><div class="card"><div id="mList"></div><div class="pager" id="mPager"></div></div>`;
    const msBadge = (s) => `<span class="badge ${s === 'ข้อมูลไม่ครบ' ? 'red' : s === 'ตรวจสอบ' ? 'amber' : s === 'ปิดงานแล้ว' ? 'green' : s === 'กำลังวิ่งงาน' ? 'blue' : 'gray'}">${h(s)}</span>`;
    const load = async () => { try { const p = { page: pageNo, page_size: 50 }; $$('#mf [name]').forEach((i) => { if (i.value) p[i.name] = i.value; }); const d = await T.auth('tnj_mileage_table', { p }, { silent: true });
      $('#mList').innerHTML = isMobile() ? d.rows.map((x) => `<div class="jobcard click" data-job="${x.job_id}"><div class="flex between"><b>${h(x.job_no)}</b>${msBadge(x.mileage_status)}</div><div class="small">B/L ${h(x.bl_no)} · ${h(x.license_plate || '-')} · ${h(x.driver_name || '-')}</div><div class="small">ไมล์ ${T.num(x.start_mileage)} → ${T.num(x.end_mileage)} = <b>${T.num(x.total_distance)} กม.</b> · ${T.num(x.fuel_liters, 2)} ล. · ${T.num(x.fuel_amount, 2)} บ. · ${T.kml(x.km_per_liter)} กม./ล.</div></div>`).join('') || '<div class="empty">ไม่พบข้อมูล</div>'
        : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Job / B/L</th><th>รถ</th><th>ทะเบียนรถ</th><th>คนขับ</th><th class="r">ไมล์ก่อน</th><th class="r">ไมล์หลัง</th><th class="r">ระยะ (กม.)</th><th class="r">น้ำมัน (ลิตร)</th><th class="r">รวม (บาท)</th><th class="r">กม./ลิตร</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${d.rows.map((x) => `<tr class="click" data-job="${x.job_id}"><td><b>${h(x.job_no)}</b><div class="xs muted">${h(x.bl_no)}</div></td><td>${h(x.vehicle_name || '-')}</td><td>${h(x.license_plate || '-')}</td><td>${h(x.driver_name || '-')}</td><td class="r">${T.num(x.start_mileage)}</td><td class="r">${T.num(x.end_mileage)}</td><td class="r b">${T.num(x.total_distance)}</td><td class="r">${T.num(x.fuel_liters, 2)}</td><td class="r">${T.num(x.fuel_amount, 2)}</td><td class="r">${T.kml(x.km_per_liter)}</td><td>${msBadge(x.mileage_status)}${x.warning_flag ? ' ⚠' : ''}</td><td><a class="btn btn-sm" href="#/jobs/${x.job_id}?tab=fuel">⛽ รายละเอียด</a></td></tr>`).join('') || '<tr><td colspan="12" class="empty">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
      bindJobRows($('#mList')); const pages = Math.max(1, Math.ceil(d.total / d.page_size)); $('#mPager').innerHTML = `<span class="muted small">ทั้งหมด ${d.total} · หน้า ${d.page}/${pages}</span><button class="btn btn-sm" id="mPrev" ${d.page <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="mNext" ${d.page >= pages ? 'disabled' : ''}>›</button>`; $('#mPrev').onclick = () => { pageNo--; load(); }; $('#mNext').onclick = () => { pageNo++; load(); }; } catch (e) { T.err(e); } };
    $$('#mf [name]').forEach((i) => i.addEventListener(i.tagName === 'SELECT' || i.type === 'date' ? 'change' : 'input', T.debounce(() => { pageNo = 1; load(); }, 400))); load();
  }

  /* ---------- reports ---------- */
  async function pageReports(page, r) {
    await loadMasters(); let mode = r.q.mode || 'all'; let pageNo = 1; let lastFilter = {};
    const d0 = T.todayISO().slice(0, 8) + '01';
    page.innerHTML = `<div class="page-head"><h1>📊 รายงาน</h1><div class="tabs" style="margin:0;border:0"><button data-m="all" class="${mode === 'all' ? 'active' : ''}">ทั้งหมด</button><button data-m="vehicle" class="${mode === 'vehicle' ? 'active' : ''}">ตามรถ</button><button data-m="driver" class="${mode === 'driver' ? 'active' : ''}">ตาม Driver</button></div></div>
      <div class="card card-b mb2"><div class="grid g4" id="rf"><div class="field"><label>วันที่เริ่ม</label><input type="date" class="inp" name="date_from" value="${d0}"></div><div class="field"><label>วันที่สิ้นสุด</label><input type="date" class="inp" name="date_to" value="${T.todayISO()}"></div>
        <div class="field rp-all"><label>Job No.</label><input class="inp" name="job_no"></div><div class="field rp-all"><label>B/L</label><input class="inp" name="bl_no"></div><div class="field rp-all"><label>Customer</label><input class="inp" name="customer" list="dlCust3"><datalist id="dlCust3">${M.customers.map((c) => `<option value="${h(c.name)}">`).join('')}</datalist></div>
        <div class="field rp-all rp-vehicle"><label>รถ / ทะเบียนรถ</label><select class="inp" name="vehicle_id">${opts(M.vehicles, 'id', (v) => `${v.vehicle_name} (${v.license_plate})`, r.q.vehicle_id, 'ทั้งหมด')}</select></div><div class="field rp-all"><label>ทะเบียนรถ (พิมพ์)</label><input class="inp" name="license_plate"></div>
        <div class="field rp-all rp-driver"><label>Driver</label><select class="inp" name="driver_id">${opts(M.drivers, 'id', 'full_name', r.q.driver_id, 'ทั้งหมด')}</select></div><div class="field rp-all"><label>Status</label><select class="inp" name="status"><option value="">ทั้งหมด</option>${stOpts('')}</select></div></div>
        <div class="flex flex-wrap"><button class="btn btn-p" id="rpGo">🔍 ค้นหา</button><button class="btn" id="rpClear">ล้างตัวกรอง</button><button class="btn btn-g" id="rpXls">📥 EXPORT EXCEL</button></div></div>
      <div id="rpSum" class="stats" style="grid-template-columns:repeat(8,1fr)"></div><div class="card"><div id="rpList"></div><div class="pager" id="rpPager"></div></div>`;
    const setMode = (mm) => { mode = mm; $$('.page-head .tabs button').forEach((b) => b.classList.toggle('active', b.dataset.m === mode)); $$('#rf .field').forEach((f) => f.classList.toggle('hidden', !(f.classList.contains('rp-' + mode) || !f.className.includes('rp-')))); };
    $$('.page-head .tabs button').forEach((b) => b.onclick = () => { setMode(b.dataset.m); pageNo = 1; load(); }); setMode(mode);
    const read = () => { const o = {}; $$('#rf [name]').forEach((i) => { if (i.value && !i.closest('.field').classList.contains('hidden')) o[i.name] = i.value; }); return o; };
    const sumCards = (s, extra) => { const items = [['จำนวน Job', s.jobs], ['จำนวนรถ', s.vehicles], ['จำนวน Driver', s.drivers], ['ระยะทางรวม (กม.)', T.num(s.distance)], ['น้ำมันรวม (ลิตร)', T.num(s.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(s.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(s.kml)], ['งานข้อมูลไม่ครบ', s.incomplete]].concat(extra || []); return items.map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:20px">${v == null ? '-' : v}</div></div>`).join(''); };
    const rowsHtml = (rows) => isMobile() ? `<div class="rep-cards" style="padding:10px">${rows.map((x) => `<div class="jobcard"><div class="flex between"><b style="font-size:17px;color:var(--navy)">${h(x.job_no)}</b>${T.badge(x.status)}</div><div class="small">B/L: ${h(x.bl_no)}<br>รถ: ${h(x.vehicle_name || '-')} · ทะเบียน: ${h(x.license_plate || '-')}<br>คนขับ: ${h(x.driver_name || '-')}</div><div class="small mt1">ระยะ: <b>${T.num(x.total_distance)} กม.</b> · น้ำมัน: ${T.num(x.fuel_liters, 2)} ลิตร<br>รวม: ${T.num(x.fuel_amount, 2)} บาท · เฉลี่ย: ${T.kml(x.km_per_liter)} กม./ลิตร</div><button class="btn btn-sm btn-p mt1" data-det="${x.job_id}">ดูรายละเอียด</button></div>`).join('') || '<div class="empty">ไม่พบข้อมูล</div>'}</div>`
      : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>วันที่</th><th>Job No.</th><th>B/L</th><th>ลูกค้า</th><th>รถ</th><th>ทะเบียนรถ</th><th>คนขับ</th><th class="r">ไมล์ก่อน</th><th class="r">ไมล์หลัง</th><th class="r">ระยะ (กม.)</th><th class="r">น้ำมัน (ลิตร)</th><th class="r">รวม (บาท)</th><th class="r">กม./ลิตร</th><th>Status</th><th>จัดการ</th></tr></thead><tbody>${rows.map((x) => `<tr><td class="nowrap">${T.fmtD(x.job_date)}</td><td class="b">${h(x.job_no)}</td><td>${h(x.bl_no)}</td><td class="ell" style="max-width:150px">${h(x.customer_name)}</td><td>${h(x.vehicle_name || '-')}</td><td>${h(x.license_plate || '-')}</td><td>${h(x.driver_name || '-')}</td><td class="r">${T.num(x.start_mileage)}</td><td class="r">${T.num(x.end_mileage)}</td><td class="r b">${T.num(x.total_distance)}</td><td class="r">${T.num(x.fuel_liters, 2)}</td><td class="r">${T.num(x.fuel_amount, 2)}</td><td class="r">${T.kml(x.km_per_liter)}</td><td>${T.badge(x.status)}${x.incomplete_flag ? ' ⚠' : ''}</td><td><button class="btn btn-sm" data-det="${x.job_id}">ดูรายละเอียด</button></td></tr>`).join('') || '<tr><td colspan="15" class="empty">ไม่พบข้อมูล</td></tr>'}</tbody></table></div>`;
    const bindDet = () => $$('[data-det]', page).forEach((b) => b.onclick = () => openReportDetail(b.dataset.det));
    const load = async () => { try { const f = read(); lastFilter = f;
      if (mode === 'all') { const d = await T.auth('tnj_report_rows', { p: Object.assign({ page: pageNo, page_size: 50 }, f) }, { silent: true }); $('#rpSum').innerHTML = sumCards(d.summary); $('#rpList').innerHTML = rowsHtml(d.rows); const pages = Math.max(1, Math.ceil(d.total / d.page_size)); $('#rpPager').innerHTML = `<span class="muted small">ทั้งหมด ${d.total} · หน้า ${d.page}/${pages}</span><button class="btn btn-sm" id="rPrev" ${d.page <= 1 ? 'disabled' : ''}>‹</button><button class="btn btn-sm" id="rNext" ${d.page >= pages ? 'disabled' : ''}>›</button>`; $('#rPrev').onclick = () => { pageNo--; load(); }; $('#rNext').onclick = () => { pageNo++; load(); }; }
      else if (mode === 'vehicle') { if (!f.vehicle_id) { $('#rpSum').innerHTML = ''; $('#rpList').innerHTML = '<div class="empty">กรุณาเลือกทะเบียนรถ</div>'; $('#rpPager').innerHTML = ''; return; } const d = await T.auth('tnj_report_vehicle', { p_vehicle_id: f.vehicle_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); $('#rpSum').innerHTML = [['จำนวน Job', d.jobs], ['Drivers ที่เคยใช้', (d.drivers || []).join(', ') || '-'], ['ไมล์เริ่มต้น', T.num(d.first_mileage)], ['ไมล์ล่าสุด', T.num(d.last_mileage)], ['ระยะทางรวม (กม.)', T.num(d.distance)], ['น้ำมันรวม (ลิตร)', T.num(d.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(d.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(d.kml)]].map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:18px">${v}</div></div>`).join(''); $('#rpList').innerHTML = rowsHtml(d.rows); $('#rpPager').innerHTML = ''; }
      else { if (!f.driver_id) { $('#rpSum').innerHTML = ''; $('#rpList').innerHTML = '<div class="empty">กรุณาเลือก Driver</div>'; $('#rpPager').innerHTML = ''; return; } const d = await T.auth('tnj_report_driver', { p_driver_id: f.driver_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); $('#rpSum').innerHTML = [['Driver', h(d.driver.full_name)], ['จำนวน Job', d.jobs], ['รถที่ใช้', (d.vehicles || []).join(', ') || '-'], ['ระยะทางรวม (กม.)', T.num(d.distance)], ['น้ำมันรวม (ลิตร)', T.num(d.liters, 2)], ['ค่าน้ำมันรวม (บาท)', T.num(d.amount, 2)], ['กม./ลิตร เฉลี่ย', T.kml(d.kml)], ['Completed / Problem / ไม่ครบ', `${d.completed} / ${d.problem} / ${d.incomplete}`]].map(([l, v]) => `<div class="stat"><div class="l">${l}</div><div class="v" style="font-size:18px">${v}</div></div>`).join(''); $('#rpList').innerHTML = rowsHtml(d.rows); $('#rpPager').innerHTML = ''; }
      bindDet(); } catch (e) { T.err(e); } };
    $('#rpGo').onclick = () => { pageNo = 1; load(); }; $('#rpClear').onclick = () => { $$('#rf [name]').forEach((i) => { i.value = i.name === 'date_from' ? d0 : i.name === 'date_to' ? T.todayISO() : ''; }); pageNo = 1; load(); };
    $('#rpXls').onclick = async () => { try { T.loading(true); let rows, sum; const f = read();
      if (mode === 'all') { const d = await T.auth('tnj_report_rows', { p: Object.assign({ page: 0 }, f) }, { silent: true }); rows = d.rows; sum = d.summary; } else if (mode === 'vehicle') { if (!f.vehicle_id) throw new Error('TNJ_VALIDATION:กรุณาเลือกรถ'); const d = await T.auth('tnj_report_vehicle', { p_vehicle_id: f.vehicle_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); rows = d.rows; sum = d; } else { if (!f.driver_id) throw new Error('TNJ_VALIDATION:กรุณาเลือก Driver'); const d = await T.auth('tnj_report_driver', { p_driver_id: f.driver_id, p_from: f.date_from || null, p_to: f.date_to || null }, { silent: true }); rows = d.rows; sum = d; }
      rows = rows.slice().sort((a, b) => (a.job_date + a.job_no).localeCompare(b.job_date + b.job_no));
      const aoa = [['Date', 'Job No.', 'B/L', 'Customer', 'Container No.', 'Vehicle', 'License Plate', 'Driver', 'Start Mileage', 'End Mileage', 'Distance KM', 'Fuel Liters', 'Fuel Amount', 'KM/L', 'Job Status']].concat(rows.map((x) => [x.job_date, x.job_no, x.bl_no, x.customer_name, x.container_no || '', x.vehicle_name || '', x.license_plate || '', x.driver_name || '', x.start_mileage != null ? Number(x.start_mileage) : '', x.end_mileage != null ? Number(x.end_mileage) : '', x.total_distance != null ? Number(x.total_distance) : '', x.fuel_liters != null ? Number(x.fuel_liters) : '', x.fuel_amount != null ? Number(x.fuel_amount) : '', x.km_per_liter != null ? Number(x.km_per_liter) : '', x.status]));
      aoa.push([]); aoa.push(['Total', `จำนวน Job: ${sum.jobs}`, '', '', '', '', '', '', '', 'ระยะทางรวม', Number(sum.distance || 0), Number(sum.liters || 0), Number(sum.amount || 0), sum.kml != null ? Number(sum.kml) : '-', `กม./ลิตร เฉลี่ย: ${T.kml(sum.kml)}`]);
      const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [10, 14, 14, 24, 14, 14, 12, 16, 12, 12, 12, 12, 12, 8, 18].map((w) => ({ wch: w })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report'); XLSX.writeFile(wb, `TransportNJ_Report_${(f.date_from || '')}_${(f.date_to || '')}.xlsx`); T.toast(`Export ${rows.length} แถว`, 'ok'); } catch (e) { T.err(e); } finally { T.loading(false); } };
    load();
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
    const load = async () => { try { const d = await T.auth('tnj_file_list', { p: { q: $('#dcQ').value.trim(), file_type: $('#dcT').value, date_from: $('#dcF').value, date_to: $('#dcTo').value } }, { silent: true }); files = d.rows; $('#dcList').innerHTML = files.map((f) => `<div class="filebox" data-fid="${f.id}"><div class="fi">${T.fileIcon(f.mime_type, f.file_name)}</div><div class="grow"><div class="b ell">${h(f.file_name)} <a class="xs" href="#/jobs/${f.job_id}?tab=docs">${h(f.job_no)}</a></div><div class="xs muted">${h(f.file_type)} · ${h(f.customer_name)} · B/L ${h(f.bl_no)} · ${T.size(f.size_bytes)} · ${h(f.uploaded_by_name || '')} · ${T.fmtDT(f.uploaded_at)}</div></div><div class="flex"><button class="btn btn-sm" data-prev>👁</button><button class="btn btn-sm" data-dl>⬇</button>${T.canEdit() ? '<button class="btn btn-sm btn-r" data-del>🗑</button>' : ''}</div></div>`).join('') || '<div class="empty">ไม่พบเอกสาร</div>'; T.bindFileRows($('#dcList'), files, load); } catch (e) { T.err(e); } };
    ['dcQ', 'dcT', 'dcF', 'dcTo'].forEach((id) => $('#' + id).addEventListener(id === 'dcQ' ? 'input' : 'change', T.debounce(load, 400))); load();
  }

  /* ---------- masters ---------- */
  async function pageMasters(page, kind) {
    await loadMasters(true); const canEdit = T.canEdit(), admin = T.isAdmin();
    const defs = { customers: ['ลูกค้า', ['code:รหัส', 'name:ชื่อลูกค้า*', 'contact:ผู้ติดต่อ', 'phone:เบอร์โทร', 'address:ที่อยู่']], drivers: ['คนขับ', ['driver_code:รหัสคนขับ', 'full_name:ชื่อ-สกุล*', 'phone:เบอร์โทร', 'license_no:เลขใบขับขี่', 'username:ชื่อผู้ใช้ (Login)*', 'password:รหัสผ่าน']], vehicles: ['รถ', ['vehicle_code:รหัสรถ', 'vehicle_name:ชื่อรถ', 'license_plate:ทะเบียนรถ*', 'vehicle_type:ประเภท', 'last_mileage:เลขไมล์ล่าสุด']], locations: ['สถานที่', ['name:ชื่อสถานที่*', 'location_type:ประเภท', 'address:ที่อยู่', 'latitude:ละติจูด', 'longitude:ลองจิจูด', 'contact:ผู้ติดต่อ', 'phone:เบอร์โทร', 'google_maps_url:ลิงก์ Google Maps']] };
    const [title, fields] = defs[kind]; const rows = M[kind]; const inactive = await T.auth('tnj_master_list', { p_kind: kind, p_include_inactive: true }, { silent: true });
    const cols = fields.filter((f) => !f.startsWith('password')); const canAdd = kind === 'drivers' ? admin : canEdit;
    page.innerHTML = `<div class="page-head"><h1>${title}</h1><div class="flex"><label class="check"><input type="checkbox" id="msAll"> แสดงที่ปิดใช้งาน</label>${canAdd ? `<button class="btn btn-p" id="msAdd">+ เพิ่ม${title}</button>` : ''}</div></div><div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map((f) => `<th>${h(f.split(':')[1].replace('*', ''))}</th>`).join('')}${kind === 'drivers' || kind === 'vehicles' ? '<th>งานปัจจุบัน</th>' : ''}<th>สถานะ</th><th></th></tr></thead><tbody id="msBody"></tbody></table></div></div>`;
    const draw = () => { const list = $('#msAll').checked ? inactive : rows; $('#msBody').innerHTML = list.map((x) => `<tr>${cols.map((f) => { const k = f.split(':')[0]; let v = x[k]; if (k === 'google_maps_url' && v) v = '🔗'; if (k === 'last_mileage') v = T.num(v); return `<td>${h(v == null ? '-' : v)}</td>`; }).join('')}${kind === 'drivers' || kind === 'vehicles' ? `<td>${x.active_job ? `<a href="#/jobs/${x.active_job.id}">${h(x.active_job.job_no)}</a> ${T.badge(x.active_job.status)}` : '-'}</td>` : ''}<td>${x.is_active ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}</td><td>${canAdd ? `<button class="btn btn-sm" data-edit="${x.id}">✏️</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="${cols.length + 3}" class="empty">ยังไม่มีข้อมูล</td></tr>`; $$('[data-edit]', page).forEach((b) => b.onclick = () => form(inactive.find((x) => x.id === b.dataset.edit))); };
    const form = (x) => { T.modal({ title: (x ? 'แก้ไข' : 'เพิ่ม') + title, size: 's', body: fields.map((f) => { const [k, l] = f.split(':'); if (k === 'location_type') return `<div class="field"><label>${l}</label><select class="inp" name="${k}">${[['PORT', 'ท่าเรือ / ท่ารับตู้'], ['FACTORY', 'โรงงาน'], ['RETURN_YARD', 'ลานคืนตู้'], ['OTHER', 'อื่น ๆ']].map(([v, t]) => `<option value="${v}" ${x && x[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`; return `<div class="field"><label>${h(l.replace('*', ''))}${l.endsWith('*') ? ' <span class="req">*</span>' : ''}</label><input class="inp" name="${k}" ${k === 'password' ? 'type="password" autocomplete="new-password" placeholder="' + (x ? 'เว้นว่าง = ไม่เปลี่ยน' : '') + '"' : ''} ${k === 'username' && x ? 'disabled' : ''} value="${h(x && k !== 'password' ? (x[k] == null ? '' : x[k]) : '')}"></div>`; }).join('') + (x ? `<label class="check"><input type="checkbox" name="is_active" ${x.is_active ? 'checked' : ''}> เปิดใช้งาน</label>` : ''),
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="msGo">บันทึก</button>`, onOpen: (el, close) => { $('#msGo', el).onclick = async () => { const p = { id: x ? x.id : null }; $$('[name]', el).forEach((i) => { if (i.type === 'checkbox') p[i.name] = i.checked; else if (!i.disabled && i.value !== '') p[i.name] = i.value.trim(); else if (!i.disabled && i.name !== 'password') p[i.name] = ''; }); try { await T.auth('tnj_master_save', { p_kind: kind, p }); T.toast('บันทึกแล้ว', 'ok'); close(); pageMasters(page, kind); } catch (e) { T.err(e); } }; } }); };
    const add = $('#msAdd'); if (add) add.onclick = () => form(null); $('#msAll').onchange = draw; draw();
  }

  /* ---------- settings ---------- */
  async function pageSettings(page) {
    if (!T.isAdmin()) { page.innerHTML = '<div class="empty">เฉพาะผู้ดูแลระบบ</div>'; return; }
    const sa = T.session.role === 'SUPER_ADMIN'; let d; try { d = await T.auth('tnj_settings_get', {}, { silent: true }); } catch (e) { return T.err(e); }
    const rel = d.release || {}; const same = rel.version === T.C.APP_VERSION;
    page.innerHTML = `<div class="page-head"><h1>⚙️ ตั้งค่า</h1></div><div class="grid g2">
      <div class="card card-b"><h3 class="mb1">เวอร์ชัน / Force Update</h3><div class="kv"><div class="k">Build ที่เปิดอยู่</div><div class="v">${h(T.C.APP_VERSION)}</div><div class="k">เวอร์ชันบนเซิร์ฟเวอร์</div><div class="v">${h(rel.version || '-')}</div><div class="k">Maintenance</div><div class="v">${rel.maintenance_active ? 'กำลังปรับปรุง ถึง ' + T.fmtDT(rel.maintenance_ends_at) : 'ปกติ'}</div><div class="k">เวลาเซิร์ฟเวอร์</div><div class="v">${T.fmtDT(rel.server_time)}</div></div>
        ${same ? '<div class="alert ok mt1">เวอร์ชันตรงกัน — ไม่ต้องประกาศ</div>' : `<div class="alert warn mt1">Build นี้ (${h(T.C.APP_VERSION)}) ยังไม่ได้ประกาศบนเซิร์ฟเวอร์ (${h(rel.version || '-')})</div>${sa ? `<button class="btn btn-r" id="verGo">📢 ประกาศเวอร์ชัน ${h(T.C.APP_VERSION)} + Maintenance 10 นาที</button>` : ''}`}
        <div class="small muted mt1">ขั้นตอน Deploy: 1) อัปโหลด Release ใหม่ทั้งชุดขึ้น GitHub 2) เปิดเว็บ (ระบบจะโหลดไฟล์ใหม่) 3) SUPER_ADMIN กด "ประกาศเวอร์ชัน" → ทุกเครื่องเข้าโหมดปรับปรุง 10 นาที ล้าง session เดิม และต้อง Login ใหม่</div></div>
      <div class="card card-b"><h3 class="mb1">GPS</h3><div class="field"><label>ส่ง GPS ทุก (วินาที)</label><input type="number" class="inp" id="gpsInt" value="${h(d.settings.gps_interval_sec || 30)}" ${sa ? '' : 'disabled'}></div><div class="field"><label>ถือว่า GPS ขาดหายหลัง (นาที)</label><input type="number" class="inp" id="gpsStale" value="${h(d.settings.gps_stale_min || 5)}" ${sa ? '' : 'disabled'}></div>${sa ? '<button class="btn btn-p" id="gpsSave">บันทึก</button>' : ''}</div></div>
      ${sa ? '<div class="card mt2"><div class="card-h"><h3>ผู้ใช้ / สิทธิ์ (app_code: transport)</h3><button class="btn btn-p btn-sm" id="usAdd">+ เพิ่มผู้ใช้</button></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ชื่อผู้ใช้</th><th>ชื่อ</th><th>สิทธิ์ TRANSPORT NJ</th><th>role เดิม (app_users)</th><th>สถานะ</th><th></th></tr></thead><tbody id="usBody"></tbody></table></div></div>' : ''}`;
    const vg = $('#verGo'); if (vg) vg.onclick = async () => { if (!(await T.confirm('ประกาศเวอร์ชัน', `ประกาศ <b>${h(T.C.APP_VERSION)}</b> — ระบบจะเข้าสู่โหมดปรับปรุง 10 นาที ผู้ใช้ทุกคน (รวมคุณ) จะถูกออกจากระบบและต้อง Login ใหม่หลังครบเวลา`, 'ประกาศ', 'btn-r'))) return; try { const r = await T.auth('tnj_version_set', { p_version: T.C.APP_VERSION, p_maintenance_minutes: 10 }); T.showMaintenance(r); } catch (e) { T.err(e); } };
    const gs = $('#gpsSave'); if (gs) gs.onclick = async () => { try { await T.auth('tnj_settings_set', { p: { gps_interval_sec: $('#gpsInt').value, gps_stale_min: $('#gpsStale').value } }); T.toast('บันทึกแล้ว', 'ok'); } catch (e) { T.err(e); } };
    if (sa) { const ROLES = ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT', 'DRIVER', 'VIEWER']; const loadUsers = async () => { try { const us = await T.auth('tnj_users_list', {}, { silent: true }); $('#usBody').innerHTML = us.map((u) => `<tr><td class="b">${h(u.username)}</td><td>${h(u.full_name || '')}</td><td><span class="badge blue">${h(u.tnj_role)}</span></td><td class="xs muted">${h(u.base_role)}</td><td>${u.is_active ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}</td><td><button class="btn btn-sm" data-u="${u.id}">✏️</button></td></tr>`).join(''); $$('[data-u]', page).forEach((b) => b.onclick = () => uform(us.find((x) => x.id === b.dataset.u))); } catch (e) { T.err(e); } };
      const uform = (u) => T.modal({ title: u ? 'แก้ไขผู้ใช้ ' + u.username : 'เพิ่มผู้ใช้', size: 's', body: `${u ? '' : '<div class="field"><label>ชื่อผู้ใช้ <span class="req">*</span></label><input class="inp" id="uUser" autocapitalize="off"></div>'}<div class="field"><label>ชื่อ-สกุล</label><input class="inp" id="uName" value="${h(u ? u.full_name || '' : '')}"></div><div class="field"><label>รหัสผ่าน ${u ? '(เว้นว่าง = ไม่เปลี่ยน)' : '<span class="req">*</span>'}</label><input class="inp" id="uPw" type="password" autocomplete="new-password"></div><div class="field"><label>สิทธิ์</label><select class="inp" id="uRole">${ROLES.map((r) => `<option ${u && u.tnj_role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>${u ? `<label class="check"><input type="checkbox" id="uAct" ${u.is_active ? 'checked' : ''}> เปิดใช้งาน</label>` : ''}`, foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="uGo">บันทึก</button>`, onOpen: (el, close) => { $('#uGo', el).onclick = async () => { const p = { id: u ? u.id : null, username: u ? u.username : $('#uUser', el).value.trim(), full_name: $('#uName', el).value.trim(), password: $('#uPw', el).value || null, tnj_role: $('#uRole', el).value, is_active: u ? $('#uAct', el).checked : true }; try { await T.auth('tnj_users_save', { p }); T.toast('บันทึกแล้ว', 'ok'); close(); loadUsers(); } catch (e) { T.err(e); } }; } });
      $('#usAdd').onclick = () => uform(null); loadUsers(); }
  }
})();
