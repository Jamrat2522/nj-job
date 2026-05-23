// =========================================================
// dashboard.js — Dashboard (5 KPIs + 4 charts, Chart.js lazy)
// =========================================================

import { S } from './state.js';
import { $, esc, refreshIcons, avatar } from './utils.js';
import { isDesktopForGraph } from './mobile.js';

// In-memory chart cache (destroy/recreate when refreshing)
const _dashboardGraphCache = window._dashboardGraphCache = window._dashboardGraphCache || {};
let _chartJsLoaded = false;

// ---------- DATE HELPERS ----------
function _todayRange(){
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const to = new Date(t); to.setHours(23, 59, 59, 999);
  return { from: t.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
}
function _presetRange(days){
  const to = new Date(); to.setHours(23, 59, 59, 999);
  const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
}

// Initialize default range = today
function _ensureDashDefaults(){
  if(!S.dashFilters.from || !S.dashFilters.to){
    const r = _todayRange();
    S.dashFilters = { from: r.from, to: r.to };
  }
  // Cap range to 30 days
  const max = 30;
  const from = new Date(S.dashFilters.from);
  const to = new Date(S.dashFilters.to);
  const days = Math.floor((to - from) / 86400000) + 1;
  if(days > max){
    const newFrom = new Date(to); newFrom.setDate(newFrom.getDate() - (max - 1));
    S.dashFilters.from = newFrom.toISOString().slice(0,10);
  }
}

// ---------- PRESETS ----------
export function dashSetPreset(days){
  S.dashFilters = _presetRange(days);
  refreshDashboard();
}
export function dashSetPresetToday(){
  S.dashFilters = _todayRange();
  refreshDashboard();
}
export function dashSetPresetThisMonth(){
  const t = new Date();
  const from = new Date(t.getFullYear(), t.getMonth(), 1);
  const to = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  S.dashFilters = { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
  refreshDashboard();
}

// Debounced date setters
let _dashDeb = null;
export function dashSetFrom(v){
  clearTimeout(_dashDeb);
  _dashDeb = setTimeout(() => { S.dashFilters.from = v; refreshDashboard(); }, 300);
}
export function dashSetTo(v){
  clearTimeout(_dashDeb);
  _dashDeb = setTimeout(() => { S.dashFilters.to = v; refreshDashboard(); }, 300);
}

export function toggleDashDatePicker(){
  const wrap = $('dash-datepicker');
  if(!wrap) return;
  wrap.style.display = wrap.style.display === 'none' ? '' : 'none';
}

// ---------- LAZY CHART.JS LOADER ----------
async function loadChartJs(){
  if(_chartJsLoaded || window.Chart) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  _chartJsLoaded = true;
}

// ---------- DESTROY CHARTS ----------
export function destroyDashboardCharts(){
  Object.keys(_dashboardGraphCache).forEach(k => {
    try { _dashboardGraphCache[k].destroy(); } catch(_) {}
    delete _dashboardGraphCache[k];
  });
}

// ---------- AGGREGATION ----------
function _aggregateForGraphs(){
  const from = new Date(S.dashFilters.from + 'T00:00:00');
  const to = new Date(S.dashFilters.to + 'T23:59:59');
  const inRange = j => {
    const t = new Date(j.created_at).getTime();
    return t >= from.getTime() && t <= to.getTime();
  };
  const jobs = S.jobs.filter(inRange);

  // Daily counts (BAR + LINE)
  const days = [];
  const cur = new Date(from);
  while(cur <= to){
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  const daily = days.map(d => {
    const dayJobs = jobs.filter(j => j.created_at.slice(0, 10) === d);
    return {
      day: d,
      WAIT: dayJobs.filter(j => j.status === 'WAIT').length,
      GOING: dayJobs.filter(j => j.status === 'GOING').length,
      DONE: dayJobs.filter(j => j.status === 'DONE').length,
      CANCELED: dayJobs.filter(j => j.status === 'CANCELED').length,
      total: dayJobs.length
    };
  });

  // Status totals (DOUGHNUT)
  const totals = {
    WAIT: jobs.filter(j => j.status === 'WAIT').length,
    GOING: jobs.filter(j => j.status === 'GOING').length,
    DONE: jobs.filter(j => j.status === 'DONE').length,
    CANCELED: jobs.filter(j => j.status === 'CANCELED').length
  };

  // User table
  const byUser = {};
  for(const j of jobs){
    const k = j.assigned_to || 'unassigned';
    if(!byUser[k]) byUser[k] = { name: j.assigned_to_name || 'ยังไม่ได้รับ', total: 0, going: 0, done: 0 };
    byUser[k].total++;
    if(j.status === 'GOING') byUser[k].going++;
    if(j.status === 'DONE') byUser[k].done++;
  }
  const users = Object.values(byUser).sort((a, b) => b.total - a.total).slice(0, 12);

  return { daily, totals, users, jobs };
}

// ---------- RENDER ----------
export function renderDashboard(){
  _ensureDashDefaults();
  const fromStr = new Date(S.dashFilters.from).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  const toStr = new Date(S.dashFilters.to).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });

  const range = _aggregateForGraphs();
  const all = range.jobs;
  const kpi = {
    total: all.length,
    wait: all.filter(j => j.status === 'WAIT').length,
    going: all.filter(j => j.status === 'GOING').length,
    done: all.filter(j => j.status === 'DONE').length,
    canceled: all.filter(j => j.status === 'CANCELED').length
  };

  $('view-root').innerHTML = `
    <div class="topbar dash-topbar">
      <div><h1>Dashboard</h1><p class="sub">งานในช่วง ${esc(fromStr)} – ${esc(toStr)}</p></div>
      <div class="topbar-actions">
        <button class="btn dash-date-btn" id="dash-date-toggle"><i data-lucide="calendar"></i> ${esc(fromStr)} – ${esc(toStr)}</button>
      </div>
    </div>
    <div class="dash-datepicker" id="dash-datepicker" style="display:none">
      <div class="dash-filter-presets">
        <button class="pill" data-dpreset="today">วันนี้</button>
        <button class="pill" data-dpreset="7">7 วัน</button>
        <button class="pill" data-dpreset="30">30 วัน</button>
        <button class="pill" data-dpreset="month">เดือนนี้</button>
      </div>
      <div class="dash-filter-dates">
        <div><label>จาก</label><input id="dash-from" type="date" class="input" value="${esc(S.dashFilters.from)}"></div>
        <div><label>ถึง</label><input id="dash-to" type="date" class="input" value="${esc(S.dashFilters.to)}"></div>
      </div>
    </div>

    <div class="content">
      <div class="stats-grid">
        <div class="stat-card s-all"><div class="label">งานทั้งหมด</div><div class="val">${kpi.total}</div></div>
        <div class="stat-card s-wait"><div class="label">รอรับงาน</div><div class="val">${kpi.wait}</div></div>
        <div class="stat-card s-going"><div class="label">กำลังดำเนินการ</div><div class="val">${kpi.going}</div></div>
        <div class="stat-card s-done"><div class="label">เสร็จแล้ว</div><div class="val">${kpi.done}</div></div>
        <div class="stat-card s-cancel"><div class="label">ยกเลิก</div><div class="val">${kpi.canceled}</div></div>
      </div>

      <div class="dash-graph-area">
        <div class="dash-row">
          <div class="dash-card">
            <div class="dash-card-head">
              <i data-lucide="bar-chart-3" class="dash-card-ico"></i>
              <div><h3>งานต่อวัน</h3><p>แยกตามสถานะ</p></div>
            </div>
            <div class="dash-canvas-wrap"><canvas id="dash-bar"></canvas></div>
          </div>
          <div class="dash-card">
            <div class="dash-card-head">
              <i data-lucide="pie-chart" class="dash-card-ico"></i>
              <div><h3>สัดส่วนสถานะ</h3><p>ภาพรวมในช่วงเลือก</p></div>
            </div>
            <div class="dash-doughnut-wrap">
              <div class="dash-canvas-wrap" style="flex:1"><canvas id="dash-doughnut"></canvas></div>
              <div class="dash-doughnut-legend">
                ${[
                  ['WAIT',  '#FFC107', 'รอรับงาน', kpi.wait],
                  ['GOING', '#2196F3', 'กำลังดำเนินการ', kpi.going],
                  ['DONE',  '#10B981', 'เสร็จแล้ว', kpi.done],
                  ['CANCELED','#EF5350', 'ยกเลิก', kpi.canceled]
                ].map(([k, c, l, v]) => `<div class="lg-row"><span class="lg-dot" style="background:${c}"></span><span class="lg-name">${esc(l)}</span><span class="lg-val">${v}</span></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
        <div class="dash-row">
          <div class="dash-card">
            <div class="dash-card-head">
              <i data-lucide="trending-up" class="dash-card-ico"></i>
              <div><h3>แนวโน้มงานเสร็จต่อวัน</h3><p>เส้นแนวโน้ม</p></div>
            </div>
            <div class="dash-canvas-wrap"><canvas id="dash-line"></canvas></div>
          </div>
          <div class="dash-card">
            <div class="dash-card-head">
              <i data-lucide="user-check" class="dash-card-ico"></i>
              <div><h3>ผลงานแมสเซ็นเจอร์</h3><p>เรียงตามจำนวนงาน</p></div>
            </div>
            <div class="dash-user-table" id="dash-user-table"></div>
          </div>
        </div>
        <div class="dash-footer">
          <span><span class="dash-status-dot">●</span> ข้อมูลในช่วงที่เลือก</span>
          <span>คำนวณจาก ${all.length} งาน</span>
        </div>
      </div>
    </div>`;
  refreshIcons();

  if(!isDesktopForGraph()){
    return;  // No charts on mobile/tablet
  }

  // Async render charts
  loadChartJs().then(() => _renderAllDashboardCharts(range)).catch(() => {});
}

function _renderAllDashboardCharts(range){
  destroyDashboardCharts();
  if(!window.Chart) return;
  const { daily, totals, users } = range;

  const labels = daily.map(d => new Date(d.day).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }));
  const colors = { WAIT: '#FFC107', GOING: '#2196F3', DONE: '#10B981', CANCELED: '#EF5350' };

  // BAR chart
  const barEl = $('dash-bar');
  if(barEl) _dashboardGraphCache.bar = new Chart(barEl.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'รอรับ', data: daily.map(d => d.WAIT), backgroundColor: colors.WAIT, stack: 's' },
        { label: 'กำลังทำ', data: daily.map(d => d.GOING), backgroundColor: colors.GOING, stack: 's' },
        { label: 'เสร็จ', data: daily.map(d => d.DONE), backgroundColor: colors.DONE, stack: 's' },
        { label: 'ยกเลิก', data: daily.map(d => d.CANCELED), backgroundColor: colors.CANCELED, stack: 's' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#cbd5e1' } } },
      scales: {
        x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' } }
      }
    }
  });

  // DOUGHNUT chart
  const dEl = $('dash-doughnut');
  const sumStatus = totals.WAIT + totals.GOING + totals.DONE + totals.CANCELED;
  if(dEl){
    if(sumStatus === 0){
      dEl.parentElement.innerHTML = '<div class="dash-chart-empty"><i data-lucide="pie-chart"></i>ไม่มีข้อมูล</div>';
      refreshIcons();
    } else {
      _dashboardGraphCache.doughnut = new Chart(dEl.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['รอรับ','กำลังทำ','เสร็จ','ยกเลิก'],
          datasets: [{
            data: [totals.WAIT, totals.GOING, totals.DONE, totals.CANCELED],
            backgroundColor: [colors.WAIT, colors.GOING, colors.DONE, colors.CANCELED],
            borderColor: '#0F172A', borderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  // LINE chart (DONE only)
  const lEl = $('dash-line');
  if(lEl) _dashboardGraphCache.line = new Chart(lEl.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'งานเสร็จ', data: daily.map(d => d.DONE),
        borderColor: colors.DONE, backgroundColor: 'rgba(16,185,129,.15)',
        tension: 0.3, fill: true, pointRadius: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#cbd5e1' } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' }, beginAtZero: true }
      }
    }
  });

  // USER TABLE
  const tEl = $('dash-user-table');
  if(tEl){
    tEl.innerHTML = users.length ? `
      <table class="user-summary-tbl">
        <thead><tr><th>แมสเซ็นเจอร์</th><th class="num">กำลังทำ</th><th class="num">เสร็จ</th><th class="num">รวม</th></tr></thead>
        <tbody>${users.map(u => {
          const init = (u.name || '?').slice(0, 2).toUpperCase();
          return `<tr><td><span class="usr-avatar">${esc(init)}</span>${esc(u.name)}</td><td class="num">${u.going}</td><td class="num">${u.done}</td><td class="num">${u.total}</td></tr>`;
        }).join('')}</tbody>
      </table>` : '<div class="dash-chart-empty"><i data-lucide="users"></i>ไม่มีข้อมูล</div>';
    refreshIcons();
  }
}

// External refresh handle (called on realtime changes too)
export function refreshDashboard(){
  if(S.view !== 'dashboard') return;
  renderDashboard();
}
