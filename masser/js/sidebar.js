// =========================================================
// sidebar.js — Sidebar render (work section + system section)
// =========================================================

import { S, APP_VERSION } from './state.js';
import { $, esc, refreshIcons } from './utils.js';
import { isSuperAdmin, isAdmin } from './permissions.js';

// PERF: memoize countStatuses — avoid re-iterating S.jobs every render
let _statusCountCache = { key: null, value: null };
export function countStatuses(){
  const key = S.jobs.length + '|' +
              (S.jobs[0] ? S.jobs[0].updated_at || '' : '') + '|' +
              (S.jobs[S.jobs.length - 1] ? S.jobs[S.jobs.length - 1].id || '' : '');
  if(_statusCountCache.key === key) return _statusCountCache.value;
  const v = S.jobs.reduce((a, j) => {
    a[j.status] = (a[j.status] || 0) + 1;
    return a;
  }, { WAIT: 0, GOING: 0, DONE: 0, CANCELED: 0 });
  _statusCountCache = { key, value: v };
  return v;
}

export function invalidateStatusCache(){
  _statusCountCache = { key: null, value: null };
}

export function renderSidebar(){
  const u = S.user;
  if(!u) return;

  // User card
  const card = $('user-card');
  const initials = ((u.full_name || u.username) || '?').trim().slice(0, 2).toUpperCase();
  card.innerHTML = `
    <div class="avatar" style="background:linear-gradient(135deg,#10B981,#0EA672);width:64px;height:64px;font-size:20px">${esc(initials)}</div>
    <div class="user-info">
      <div class="user-name">${esc(u.full_name || u.username)} <span class="dot-online"></span></div>
      <div class="user-role">${esc(u.role.replace('_', ' '))}</div>
    </div>`;

  const isSuper = isSuperAdmin();
  const isAdm = isAdmin();
  const counts = countStatuses();

  const menu = $('menu');
  menu.innerHTML = `
    <div class="menu-section">
      <div class="title">WORK</div>
      <button class="menu-item ${S.view === 'jobs' ? 'active' : ''}" data-nav="jobs">
        <span class="icon"><i data-lucide="clipboard-list"></i></span> งานทั้งหมด
        <span class="badge badge-all" data-zero="${S.jobs.length === 0 ? '1' : '0'}">${S.jobs.length}</span>
      </button>
      <button class="menu-item ${S.view === 'wait' ? 'active' : ''}" data-nav="wait">
        <span class="dot dot-wait"></span> รอรับงาน
        <span class="badge badge-wait" data-zero="${counts.WAIT === 0 ? '1' : '0'}">${counts.WAIT}</span>
      </button>
      <button class="menu-item ${S.view === 'going' ? 'active' : ''}" data-nav="going">
        <span class="dot dot-going"></span> กำลังดำเนินการ
        <span class="badge badge-going" data-zero="${counts.GOING === 0 ? '1' : '0'}">${counts.GOING}</span>
      </button>
      <button class="menu-item ${S.view === 'done' ? 'active' : ''}" data-nav="done">
        <span class="dot dot-done"></span> งานเสร็จแล้ว
        <span class="badge badge-done" data-zero="${counts.DONE === 0 ? '1' : '0'}">${counts.DONE}</span>
      </button>
      <button class="menu-item ${S.view === 'canceled' ? 'active' : ''}" data-nav="canceled">
        <span class="dot dot-cancel"></span> ยกเลิก
        <span class="badge badge-cancel" data-zero="${counts.CANCELED === 0 ? '1' : '0'}">${counts.CANCELED}</span>
      </button>
    </div>
    <div class="menu-section">
      <div class="title system">SYSTEM</div>
      <button class="menu-item ${S.view === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
        <span class="icon"><i data-lucide="layout-dashboard"></i></span> Dashboard
      </button>
      <button class="menu-item ${S.view === 'messengers' ? 'active' : ''}" data-nav="messengers">
        <span class="icon"><i data-lucide="users"></i></span> แมสเซ็นเจอร์ทั้งหมด
      </button>
      ${isSuper ? `<button class="menu-item ${S.view === 'users' ? 'active' : ''}" data-nav="users">
        <span class="icon"><i data-lucide="user-cog"></i></span> ผู้ใช้งาน
      </button>` : ''}
      ${isAdm ? `<button class="menu-item ${S.view === 'backup' ? 'active' : ''}" data-nav="backup">
        <span class="icon"><i data-lucide="package"></i></span> Backup
      </button>` : ''}
      <button class="menu-item" data-action="logout">
        <span class="icon"><i data-lucide="log-out"></i></span> ออกจากระบบ
      </button>
    </div>
    <div class="sidebar-ver">v${APP_VERSION}</div>`;
  refreshIcons();
}
