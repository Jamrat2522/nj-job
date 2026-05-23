// =========================================================
// app.js — Entry point: boot, event delegation, realtime
// =========================================================

import { sb, withTimeout, rpcHasSuperAdmin, TIMEOUT_QUERY, TIMEOUT_BOOT, WATCHDOG_LOADER } from './supabase.js';
import { S } from './state.js';
import {
  $, showOnly, hideAppLoader, refreshIcons, toast,
  togglePw, closeModal, openModal, confirmAction
} from './utils.js';
import {
  switchAuthTab, doLogin, doRegister, doSetupSuperAdmin, doLogout,
  loadCurrentUser
} from './auth.js';
import { renderSidebar, invalidateStatusCache } from './sidebar.js';
import {
  setView, renderJobsView, renderMessengers, toggleSort,
  setFilter, setFilterDebounced, gotoPage, clearFilters,
  toggleAdvFilter, acceptJob, editNote, deleteJobConfirm,
  filteredJobs
} from './jobs.js';
import {
  openCreateJob, openCancelJob, openCloseJob, submitCancel,
  openDetail, detailDeleteAttachment, removeCloseFile
} from './modals.js';
import {
  renderUsersView, approveUser, rejectUser, openUserEdit, deleteUser
} from './users.js';
import { renderDashboard, refreshDashboard, destroyDashboardCharts,
         dashSetPreset, dashSetPresetToday, dashSetPresetThisMonth,
         dashSetFrom, dashSetTo, toggleDashDatePicker } from './dashboard.js';
import { exportExcel, exportBackup, renderBackupView,
         triggerRestoreFilePicker, importBackup } from './export.js';
import { openPrintJob } from './print.js';
import { toggleSidebar, closeSidebar, updateMobileTabBar, isMobile } from './mobile.js';

// ========== BOOT ==========
let _watchdog = null;
let _jobsChannel = null;
let _usersChannel = null;
let _heartbeatTimer = null;

async function init(){
  refreshIcons();

  // file:// protocol warning (ES modules don't work without server)
  if(window.location.protocol === 'file:'){
    toast('ระบบนี้ต้องเปิดผ่าน Web Server (เช่น Live Server) — ไม่สามารถเปิดด้วย file:// ได้', 'error');
  }

  // Auth state change listener
  sb.auth.onAuthStateChange((event, session) => {
    if(event === 'SIGNED_OUT') {
      S.user = null; S.authUser = null;
      _teardownRealtime();
      clearInterval(_heartbeatTimer);
      showOnly('screen-auth');
    }
  });

  // Watchdog: if loader still showing after 3s, force boot
  _watchdog = setTimeout(() => {
    hideAppLoader();
    if(!S.user) showOnly('screen-auth');
  }, WATCHDOG_LOADER);

  await boot();
  clearTimeout(_watchdog);
}

async function boot(){
  try {
    // Check if first run (no super admin yet)
    const needsSetup = await withTimeout(rpcHasSuperAdmin(), TIMEOUT_BOOT, 'check setup');
    if(needsSetup){
      hideAppLoader();
      showOnly('screen-setup');
      return;
    }

    // Load current user (if any)
    const user = await withTimeout(loadCurrentUser(), TIMEOUT_BOOT, 'load user');
    hideAppLoader();

    if(!user){ showOnly('screen-auth'); return; }
    if(user.status === 'pending'){ showOnly('screen-pending'); return; }
    if(user.status === 'disabled'){ showOnly('screen-disabled'); return; }

    // Active user — show app
    showOnly('screen-app');
    renderApp();
  } catch(e){
    console.error('Boot error:', e);
    hideAppLoader();
    showOnly('screen-auth');
    toast('เชื่อมต่อไม่สำเร็จ: ' + (e.message || e), 'error');
  }
}

// ========== APP RENDERING ==========
function renderApp(){
  renderSidebar();
  renderView();
  setupRealtime();
  startHeartbeat();
  setOnline(true);

  // Background data load (parallel — don't block UI)
  loadAll();
}

async function loadAll(){
  try {
    await Promise.all([loadJobs(), loadUsers()]);
    invalidateStatusCache();
    renderSidebar();
    renderView();
  } catch(e){
    console.warn('loadAll err:', e);
  }
}

async function loadJobs(){
  // Slim column selection — skip large text fields in list view
  const { data, error } = await withTimeout(
    sb.from('jobs')
      .select('id,job_no,job_nj,status,company,category,description,pickup_location,pickup_time,delivery_time,destination,priority,notes,close_note,cancel_reason,assigned_to,assigned_to_name,accepted_at,created_by,created_by_name,created_at,updated_at,closed_at,closed_by,closed_by_name,canceled_at,canceled_by,canceled_by_name')
      .order('created_at', { ascending: false })
      .limit(500),
    TIMEOUT_QUERY, 'load jobs'
  );
  if(error) throw error;
  S.jobs = data || [];
}

async function loadUsers(){
  const { data, error } = await withTimeout(
    sb.from('users').select('*').order('created_at', { ascending: false }),
    TIMEOUT_QUERY, 'load users'
  );
  if(error) throw error;
  S.users = data || [];
  S.messengers = S.users.filter(u => u.role === 'MESSENGER' && u.status === 'active');
}

// ========== VIEW DISPATCH ==========
function renderView(){
  updateMobileTabBar();
  const v = S.view;
  if(v === 'messengers') return renderMessengers();
  if(v === 'users') return renderUsersView();
  if(v === 'dashboard') return renderDashboard();
  if(v === 'backup') return renderBackupView();
  // Default: jobs list
  destroyDashboardCharts();
  renderJobsView();
}

// ========== REALTIME ==========
function setupRealtime(){
  _teardownRealtime();

  let jobsThrottle, usersThrottle;
  const reloadJobsThrottled = () => {
    clearTimeout(jobsThrottle);
    jobsThrottle = setTimeout(async () => {
      try { await loadJobs(); invalidateStatusCache(); renderSidebar(); renderView(); }
      catch(_) {}
    }, 800);
  };
  const reloadUsersThrottled = () => {
    clearTimeout(usersThrottle);
    usersThrottle = setTimeout(async () => {
      try { await loadUsers(); renderSidebar(); if(S.view === 'users') renderView(); }
      catch(_) {}
    }, 1500);
  };

  // Patch-first realtime: try to apply changes from payload before full reload
  _jobsChannel = sb.channel('jobs-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
      try {
        if(payload.eventType === 'UPDATE' && payload.new){
          const idx = S.jobs.findIndex(j => j.id === payload.new.id);
          if(idx >= 0){
            S.jobs[idx] = { ...S.jobs[idx], ...payload.new };
            invalidateStatusCache();
            renderSidebar();
            if(S.view !== 'users' && S.view !== 'backup') renderView();
            return;
          }
        } else if(payload.eventType === 'DELETE' && payload.old){
          S.jobs = S.jobs.filter(j => j.id !== payload.old.id);
          invalidateStatusCache();
          renderSidebar();
          if(S.view !== 'users' && S.view !== 'backup') renderView();
          return;
        }
        // Fallback: full reload
        reloadJobsThrottled();
      } catch(_) { reloadJobsThrottled(); }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'job_logs' }, () => {
      reloadJobsThrottled();
    })
    .subscribe();

  _usersChannel = sb.channel('users-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      reloadUsersThrottled();
    })
    .subscribe();
}

function _teardownRealtime(){
  try { if(_jobsChannel) sb.removeChannel(_jobsChannel); } catch(_) {}
  try { if(_usersChannel) sb.removeChannel(_usersChannel); } catch(_) {}
  _jobsChannel = null;
  _usersChannel = null;
}

// Pause realtime on hidden tab
document.addEventListener('visibilitychange', () => {
  if(document.hidden){
    _teardownRealtime();
    clearInterval(_heartbeatTimer);
  } else if(S.user){
    setupRealtime();
    startHeartbeat();
  }
});

// ========== HEARTBEAT (online status) ==========
async function setOnline(on){
  if(!S.user) return;
  try {
    await sb.from('users').update({
      online: !!on,
      last_seen: new Date().toISOString()
    }).eq('id', S.user.id);
  } catch(_) {}
}

function startHeartbeat(){
  clearInterval(_heartbeatTimer);
  _heartbeatTimer = setInterval(() => { setOnline(true); }, 5 * 60 * 1000);
}

window.addEventListener('beforeunload', () => {
  try {
    if(S.user){
      navigator.sendBeacon && fetch(`${sb.supabaseUrl}/rest/v1/users?id=eq.${S.user.id}`, {
        method: 'PATCH',
        headers: { 'apikey': sb.supabaseKey, 'Authorization': 'Bearer ' + sb.supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: false, last_seen: new Date().toISOString() }),
        keepalive: true
      });
    }
  } catch(_) {}
});

// ========== EVENT DELEGATION ==========
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action], [data-nav], [data-tab], [data-close], [data-toggle-pw], [data-view], [data-act], [data-uact], [data-cat], [data-status], [data-sort], [data-pg], [data-dpreset]');
  if(!t) return;

  // --- Tab switch ---
  if(t.hasAttribute('data-tab')){
    switchAuthTab(t.getAttribute('data-tab'));
    return;
  }

  // --- Password toggle ---
  if(t.hasAttribute('data-toggle-pw')){
    togglePw(t.getAttribute('data-toggle-pw'), t);
    return;
  }

  // --- Modal close ---
  if(t.hasAttribute('data-close')){
    closeModal(t.getAttribute('data-close'));
    return;
  }

  // --- Sidebar nav ---
  if(t.hasAttribute('data-nav')){
    const v = t.getAttribute('data-nav');
    setView(v);
    renderSidebar();
    renderView();
    if(isMobile()) closeSidebar();
    return;
  }

  // --- Mobile bottom tabbar ---
  if(t.hasAttribute('data-view')){
    const v = t.getAttribute('data-view');
    setView(v);
    renderSidebar();
    renderView();
    return;
  }

  // --- Category pill ---
  if(t.hasAttribute('data-cat')){
    setFilter('category', t.getAttribute('data-cat'));
    return;
  }

  // --- Status pill ---
  if(t.hasAttribute('data-status')){
    setFilter('status', t.getAttribute('data-status'));
    return;
  }

  // --- Sort header ---
  if(t.hasAttribute('data-sort')){
    toggleSort(t.getAttribute('data-sort'));
    return;
  }

  // --- Pagination ---
  if(t.hasAttribute('data-pg')){
    const pg = t.getAttribute('data-pg');
    const total = filteredJobs().length;
    const totalPages = Math.max(1, Math.ceil(total / S.pageSize));
    if(pg === 'first') gotoPage(1);
    else if(pg === 'prev') gotoPage(S.page - 1);
    else if(pg === 'next') gotoPage(S.page + 1);
    else if(pg === 'last') gotoPage(totalPages);
    return;
  }

  // --- Dashboard preset ---
  if(t.hasAttribute('data-dpreset')){
    const p = t.getAttribute('data-dpreset');
    if(p === 'today') dashSetPresetToday();
    else if(p === 'month') dashSetPresetThisMonth();
    else dashSetPreset(parseInt(p, 10));
    return;
  }

  // --- Row actions ---
  if(t.hasAttribute('data-act')){
    const act = t.getAttribute('data-act');
    const id = t.getAttribute('data-id');
    if(act === 'view') openDetail(id);
    else if(act === 'edit'){
      const job = S.jobs.find(j => j.id === id);
      if(job) openCreateJob(job);
    }
    else if(act === 'print') openPrintJob(id);
    else if(act === 'delete') deleteJobConfirm(id);
    else if(act === 'rmclose') removeCloseFile(parseInt(t.getAttribute('data-idx'), 10));
    return;
  }

  // --- User actions ---
  if(t.hasAttribute('data-uact')){
    const act = t.getAttribute('data-uact');
    const id = t.getAttribute('data-id');
    if(act === 'approve') approveUser(id);
    else if(act === 'reject') rejectUser(id);
    else if(act === 'edit') openUserEdit(id);
    else if(act === 'delete') deleteUser(id);
    return;
  }

  // --- Named actions (data-action) ---
  if(t.hasAttribute('data-action')){
    const a = t.getAttribute('data-action');
    if(a === 'logout') return doLogout();
    if(a === 'toggle-sidebar') return toggleSidebar();
    if(a === 'open-cancel') return openCancelJob(t.getAttribute('data-id'));
    if(a === 'open-close') return openCloseJob(t.getAttribute('data-id'));
    if(a === 'accept') return acceptJob(t.getAttribute('data-id'));
    if(a === 'edit-note') return editNote(t.getAttribute('data-id'));
    if(a === 'delete-job') return deleteJobConfirm(t.getAttribute('data-id'));
    if(a === 'del-att') return detailDeleteAttachment(t.getAttribute('data-id'));
    if(a === 'cat') return setFilter('category', t.getAttribute('data-cat'));
    if(a === 'status') return setFilter('status', t.getAttribute('data-status'));
  }
});

// Static button hooks (login / register / setup / actions in the rendered topbar)
document.addEventListener('click', async (e) => {
  const id = e.target.closest('[id]')?.id;
  if(!id) return;
  switch(id){
    case 'btn-login': { if(await doLogin()) boot(); break; }
    case 'btn-register': doRegister(); break;
    case 'btn-setup': { if(await doSetupSuperAdmin()) boot(); break; }
    case 'btn-create-job': openCreateJob(); break;
    case 'btn-toggle-filters': toggleAdvFilter(); break;
    case 'btn-clear-filters': clearFilters(); break;
    case 'btn-submit-cancel': submitCancel(); break;
    case 'sb-overlay': closeSidebar(); break;
    case 'dash-date-toggle': toggleDashDatePicker(); break;
    case 'btn-do-backup': exportBackup(); break;
    case 'btn-trigger-restore': triggerRestoreFilePicker(); break;
  }
});

// Search input — debounced
document.addEventListener('input', (e) => {
  if(e.target.id === 'search'){
    setFilterDebounced('search', e.target.value);
  } else if(e.target.id === 'filter-company'){
    setFilterDebounced('company', e.target.value);
  } else if(e.target.id === 'filter-from'){
    setFilter('dateFrom', e.target.value);
  } else if(e.target.id === 'filter-to'){
    setFilter('dateTo', e.target.value);
  } else if(e.target.id === 'filter-messenger'){
    setFilter('messenger', e.target.value);
  } else if(e.target.id === 'dash-from'){
    dashSetFrom(e.target.value);
  } else if(e.target.id === 'dash-to'){
    dashSetTo(e.target.value);
  }
});

// Restore file input
document.addEventListener('change', (e) => {
  if(e.target.id === 'restore-file-input'){
    const f = e.target.files && e.target.files[0];
    if(f){ importBackup(f); e.target.value = ''; }
  }
});

// Enter key for forms
document.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter') return;
  const a = document.activeElement;
  if(!a) return;
  if(['lg-username','lg-password'].includes(a.id)){ e.preventDefault(); doLogin().then(ok => { if(ok) boot(); }); }
  else if(['rg-username','rg-password','rg-password2','rg-email','rg-department'].includes(a.id)){ e.preventDefault(); doRegister(); }
  else if(['su-username','su-password','su-password2','su-fullname','su-email'].includes(a.id)){ e.preventDefault(); doSetupSuperAdmin().then(ok => { if(ok) boot(); }); }
});

// Mobile sidebar overlay close
document.getElementById('sb-overlay')?.addEventListener('click', closeSidebar);

// Click row body to view detail (excluding action buttons)
document.addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-jid]');
  if(!tr) return;
  // Ignore if clicking action buttons
  if(e.target.closest('[data-act]')) return;
  if(e.target.closest('[data-action]')) return;
  if(e.target.closest('button')) return;
  openDetail(tr.getAttribute('data-jid'));
});

// Re-render Mobile tabbar on resize
window.addEventListener('resize', () => {
  updateMobileTabBar();
});

// Kick off
init();
