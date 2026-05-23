// =========================================================
// jobs.js — Jobs list view (filter, sort, paginate, actions)
// =========================================================

import { sb } from './supabase.js';
import { S, CATEGORIES, CATEGORY_ICONS } from './state.js';
import {
  $, esc, refreshIcons, fmtTime, fmtDate, fmtDateTime, fmtRelative,
  avatar, statusBadge, toast, confirmAction
} from './utils.js';
import {
  canCreateJob, canEditJob, canDeleteJob, canAcceptJob,
  isAdmin, isOwner, isAssigned
} from './permissions.js';
import { invalidateStatusCache, countStatuses } from './sidebar.js';

// ========== TOP-LEVEL VIEW DISPATCH ==========
export function setView(v){
  S.view = v;
  // Jobs view = active jobs only; sub-status views fix it
  if(v === 'jobs') S.filters.status = 'ACTIVE';
  else if(v === 'wait') S.filters.status = 'WAIT';
  else if(v === 'going') S.filters.status = 'GOING';
  else if(v === 'done') S.filters.status = 'DONE';
  else if(v === 'canceled') S.filters.status = 'CANCELED';
  else S.filters.status = 'ALL';
  S.filters.category = 'ALL';
  S.page = 1;
}

// ========== FILTERING ==========
export function filteredJobs(){
  const f = S.filters;
  let arr = S.jobs.slice();

  if(f.status && f.status !== 'ALL'){
    if(f.status === 'ACTIVE') arr = arr.filter(j => j.status === 'WAIT' || j.status === 'GOING');
    else arr = arr.filter(j => j.status === f.status);
  }
  if(f.category && f.category !== 'ALL'){
    arr = arr.filter(j => j.category === f.category);
  }
  if(f.search){
    const q = f.search.toLowerCase();
    arr = arr.filter(j =>
      (j.job_no || '').toLowerCase().includes(q) ||
      (j.job_nj || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q) ||
      (j.pickup_location || '').toLowerCase().includes(q) ||
      (j.assigned_to_name || '').toLowerCase().includes(q) ||
      (j.created_by_name || '').toLowerCase().includes(q)
    );
  }
  if(f.messenger) arr = arr.filter(j => j.assigned_to === f.messenger);
  if(f.company){
    const q = f.company.toLowerCase();
    arr = arr.filter(j => (j.company || '').toLowerCase().includes(q));
  }
  if(f.dateFrom){
    const from = new Date(f.dateFrom).getTime();
    arr = arr.filter(j => new Date(j.created_at).getTime() >= from);
  }
  if(f.dateTo){
    const to = new Date(f.dateTo).getTime() + 86400000;
    arr = arr.filter(j => new Date(j.created_at).getTime() < to);
  }
  return sortJobs(arr);
}

// ========== SORTING ==========
function jobNumericKey(j){
  const s = j.job_no || '';
  const m = s.match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}
function jobTimeKey(j){
  return new Date(j.pickup_time || j.delivery_time || j.created_at).getTime();
}

export function sortJobs(arr){
  const dir = S.sortDir === 'asc' ? 1 : -1;
  if(S.sortKey === 'job_number'){
    return arr.sort((a, b) => (jobNumericKey(a) - jobNumericKey(b)) * dir);
  }
  if(S.sortKey === 'time'){
    return arr.sort((a, b) => (jobTimeKey(a) - jobTimeKey(b)) * dir);
  }
  return arr;
}

export function toggleSort(key){
  if(S.sortKey === key){
    S.sortDir = S.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    S.sortKey = key;
    S.sortDir = 'desc';
  }
  renderJobsView();
}

function _sortArrow(key){
  if(S.sortKey !== key) return '<span class="sort-ind">▾</span>';
  return `<span class="sort-ind active">${S.sortDir === 'asc' ? '▲' : '▼'}</span>`;
}

// ========== FILTER SETTERS ==========
export function setFilter(name, value){
  S.filters[name] = value;
  S.page = 1;
  renderJobsView();
}

let _debSearch = null;
export function setFilterDebounced(name, value){
  clearTimeout(_debSearch);
  _debSearch = setTimeout(() => setFilter(name, value), 220);
}

export function gotoPage(p){
  const total = filteredJobs().length;
  const maxPage = Math.max(1, Math.ceil(total / S.pageSize));
  S.page = Math.min(Math.max(1, p), maxPage);
  renderJobsView();
}

export function clearFilters(){
  S.filters.search = '';
  S.filters.messenger = '';
  S.filters.company = '';
  S.filters.dateFrom = '';
  S.filters.dateTo = '';
  S.page = 1;
  renderJobsView();
}

export function toggleAdvFilter(){
  const wrap = $('adv-filter');
  if(!wrap) return;
  wrap.style.display = wrap.style.display === 'none' ? '' : 'none';
  refreshIcons();
}

// ========== JOB ROW HTML ==========
function jobRowFull(j){
  const cat = j.category || '—';
  const pickupStr = j.pickup_location || '—';

  let editBtn = '';
  if(canEditJob(j)) editBtn = `<button class="row-act ra-edit" title="แก้ไข" data-act="edit" data-id="${esc(j.id)}"><i data-lucide="pencil"></i><span>แก้ไข</span></button>`;
  const printBtn = `<button class="row-act ra-print" title="พิมพ์/PDF" data-act="print" data-id="${esc(j.id)}"><i data-lucide="printer"></i><span>พิมพ์</span></button>`;
  const viewBtn = `<button class="row-act ra-view" title="ดูรายละเอียด" data-act="view" data-id="${esc(j.id)}"><i data-lucide="eye"></i><span class="ra-view-lbl">ดู</span></button>`;
  let delBtn = '';
  if(canDeleteJob()) delBtn = `<button class="row-act ra-delete" title="ลบ" data-act="delete" data-id="${esc(j.id)}"><i data-lucide="trash-2"></i><span>ลบ</span></button>`;

  const timeDisplay = j.pickup_time
    ? `<span class="dt-cell">${esc(fmtTime(j.pickup_time))}<small class="cell-sub">${esc(fmtDate(j.pickup_time))}</small></span>`
    : '<span class="dt-cell" style="color:var(--muted)">—</span>';

  const userBlock = `<div class="msg-cell">${avatar(j.created_by_name || '?', null, 22)}<span>${esc(j.created_by_name || '—')}</span></div>`;
  const msgBlock = j.assigned_to_name
    ? `<div class="msg-cell">${avatar(j.assigned_to_name, null, 22)}<span>${esc(j.assigned_to_name)}</span></div>`
    : '<span class="no-msg">ยังไม่ได้รับ</span>';

  return `<tr data-jid="${esc(j.id)}">
    <td data-label="JOB NO"><div class="job-no">${esc(j.job_no || '—')}<small class="cell-sub">${esc(j.job_nj || '—')}</small></div></td>
    <td data-label="สถานะ">${statusBadge(j.status)}</td>
    <td data-label="บริษัท"><div class="company">${esc(j.company || '—')}</div></td>
    <td data-label="ประเภทงาน"><span class="cat-cell">${esc(cat)}</span></td>
    <td data-label="รายละเอียด"><div class="desc">${esc(j.description || '—')}</div></td>
    <td data-label="สถานที่รับ/ส่ง"><div class="loc-cell">${esc(pickupStr)}</div></td>
    <td data-label="เวลาส่ง/รับ">${timeDisplay}</td>
    <td data-label="USER">${userBlock}</td>
    <td data-label="แมส">${msgBlock}</td>
    <td class="td-actions" data-label="การจัดการ"><div class="row-actions">${viewBtn}${editBtn}${printBtn}${delBtn}</div></td>
  </tr>`;
}

// ========== MAIN VIEW RENDER ==========
export function renderJobsView(){
  const list = filteredJobs();
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / S.pageSize));
  if(S.page > totalPages) S.page = totalPages;
  const start = (S.page - 1) * S.pageSize;
  const slice = list.slice(start, start + S.pageSize);

  const sc = countStatuses();
  const titleMap = {
    jobs: ['งานทั้งหมด', `ทั้งหมด ${S.jobs.length} งาน`],
    wait: ['รอรับงาน', `รอรับงาน ${sc.WAIT} งาน`],
    going: ['กำลังดำเนินการ', `กำลังดำเนินการ ${sc.GOING} งาน`],
    done: ['งานเสร็จแล้ว', `งานเสร็จแล้ว ${sc.DONE} งาน`],
    canceled: ['ยกเลิก', `งานที่ถูกยกเลิก ${sc.CANCELED} งาน`]
  };
  const [title, sub] = titleMap[S.view] || ['งานทั้งหมด', ''];

  const adv = `
    <div id="adv-filter" class="panel-body" style="display:none;background:var(--panel2);border-bottom:1px solid var(--border-soft)">
      <div class="grid-2">
        <div class="field">
          <label>แมสเซ็นเจอร์</label>
          <select id="filter-messenger" class="select input">
            <option value="">ทั้งหมด</option>
            ${(S.messengers || []).map(m => `<option value="${esc(m.id)}" ${S.filters.messenger === m.id ? 'selected' : ''}>${esc(m.full_name || m.username)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>บริษัท</label>
          <input id="filter-company" type="text" class="input" value="${esc(S.filters.company)}" placeholder="ค้นหาบริษัท...">
        </div>
        <div class="field">
          <label>วันที่จาก</label>
          <input id="filter-from" type="date" class="input" value="${esc(S.filters.dateFrom)}">
        </div>
        <div class="field">
          <label>ถึง</label>
          <input id="filter-to" type="date" class="input" value="${esc(S.filters.dateTo)}">
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" id="btn-clear-filters" style="margin-top:10px"><i data-lucide="rotate-ccw"></i> รีเซ็ตตัวกรอง</button>
    </div>`;

  const root = $('view-root');
  root.innerHTML = `
    <div class="topbar">
      <div><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p></div>
      <div class="topbar-actions">
        <div class="search-bar"><i data-lucide="search"></i><input id="search" class="input" placeholder="ค้นหา JOB NO, บริษัท, ผู้สร้าง..." value="${esc(S.filters.search)}"></div>
        <button class="btn btn-ghost btn-sm" id="btn-toggle-filters"><i data-lucide="sliders-horizontal"></i> ตัวกรอง</button>
        ${canCreateJob() ? `<button class="btn btn-primary" id="btn-create-job"><i data-lucide="plus"></i> สร้างงานใหม่</button>` : ''}
      </div>
    </div>
    <div class="content">
      <div class="pill-row">
        ${['ALL', ...CATEGORIES].map(c => {
          const active = S.filters.category === c ? 'active' : '';
          const lbl = c === 'ALL' ? 'หมวดงานทั้งหมด' : c;
          const ico = CATEGORY_ICONS[c] || 'tag';
          return `<button class="pill ${active}" data-action="cat" data-cat="${esc(c)}"><i data-lucide="${ico}" class="ico"></i> ${esc(lbl)}</button>`;
        }).join('')}
      </div>
      <div class="pill-row">
        ${['ACTIVE','ALL','WAIT','GOING','DONE','CANCELED'].map(s => {
          let active = '';
          if(S.filters.status === s) active = 'active';
          const cls = { ACTIVE: 's-active', WAIT: 's-wait', GOING: 's-going', DONE: 's-done', CANCELED: 's-cancel', ALL: '' }[s];
          const ico = { ACTIVE: '<i data-lucide="zap" class="ico"></i>', ALL: '' }[s] || '';
          const lbl = { ACTIVE: 'เฉพาะ Active', ALL: 'ทุกสถานะ', WAIT: 'รอรับงาน', GOING: 'กำลังดำเนินการ', DONE: 'เสร็จแล้ว', CANCELED: 'ยกเลิก' }[s];
          const cnt = (s === 'ALL' || s === 'ACTIVE') ? '' : `<span class="count">${sc[s]}</span>`;
          return `<button class="pill ${cls} ${active}" data-action="status" data-status="${s}">${ico}${esc(lbl)} ${cnt}</button>`;
        }).join('')}
        <div style="margin-left:auto;color:var(--muted);font-size:12px;align-self:center">${total} งาน · หน้า ${S.page}/${totalPages}</div>
      </div>
      <div class="panel">
        ${adv}
        <div style="overflow-x:auto">
          <table class="tbl tbl-10">
            <thead><tr>
              <th class="sortable ${S.sortKey === 'job_number' ? 'sort-active' : ''}" data-sort="job_number">JOB NO ${_sortArrow('job_number')}</th>
              <th>สถานะ</th><th>บริษัท</th><th>ประเภท</th><th>รายละเอียด</th><th>สถานที่รับ/ส่ง</th>
              <th class="sortable ${S.sortKey === 'time' ? 'sort-active' : ''}" data-sort="time">เวลาส่ง/รับ ${_sortArrow('time')}</th>
              <th>USER</th><th>แมส</th><th class="th-actions">การจัดการ</th>
            </tr></thead>
            <tbody>${slice.length ? slice.map(jobRowFull).join('') : `<tr><td colspan="10"><div class="empty"><div class="icon-lg"><i data-lucide="inbox"></i></div>ไม่พบงานในเกณฑ์นี้</div></td></tr>`}</tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
        <div class="paginator">
          <button class="pg-btn" data-pg="first" ${S.page === 1 ? 'disabled' : ''}>«</button>
          <button class="pg-btn" data-pg="prev" ${S.page === 1 ? 'disabled' : ''}>‹</button>
          <span class="pg-info">หน้า ${S.page} / ${totalPages}</span>
          <button class="pg-btn" data-pg="next" ${S.page === totalPages ? 'disabled' : ''}>›</button>
          <button class="pg-btn" data-pg="last" ${S.page === totalPages ? 'disabled' : ''}>»</button>
        </div>` : ''}
      </div>
    </div>`;
  refreshIcons();
}

// ========== MESSENGERS GRID ==========
export function renderMessengers(){
  const messengers = S.users.filter(u => u.role === 'MESSENGER' && u.status === 'active');
  $('view-root').innerHTML = `
    <div class="topbar">
      <div><h1>แมสเซ็นเจอร์ทั้งหมด</h1><p class="sub">${messengers.length} คน</p></div>
    </div>
    <div class="content">
      <div class="cards-grid">${
        messengers.map(m => {
          const myJobs = S.jobs.filter(j => j.assigned_to === m.id);
          return `<div class="msg-card">
            <div class="top">
              ${avatar(m.full_name || m.username, m.avatar_color, 46)}
              <div>
                <div class="nm">${esc(m.full_name || m.username)}</div>
                <div class="st"><span class="dot-online"></span>${m.online ? 'ONLINE' : 'OFFLINE'}</div>
              </div>
            </div>
            <div class="stats">
              <div class="going"><div class="n">${myJobs.filter(j => j.status === 'GOING').length}</div><div class="l">กำลังทำ</div></div>
              <div class="done"><div class="n">${myJobs.filter(j => j.status === 'DONE').length}</div><div class="l">เสร็จ</div></div>
              <div class="total"><div class="n">${myJobs.length}</div><div class="l">รวม</div></div>
            </div>
          </div>`;
        }).join('') || '<div class="empty"><div class="icon-lg"><i data-lucide="users"></i></div>ยังไม่มีแมสเซ็นเจอร์</div>'
      }</div>
    </div>`;
  refreshIcons();
}

// ========== ACTIONS ==========
export async function acceptJob(jobId){
  const job = S.jobs.find(j => j.id === jobId);
  if(!job || !canAcceptJob(job)) return;
  try {
    const { error } = await sb.from('jobs').update({
      status: 'GOING',
      assigned_to: S.user.id,
      assigned_to_name: S.user.full_name || S.user.username,
      accepted_at: new Date().toISOString()
    }).eq('id', jobId);
    if(error) throw error;

    await sb.from('job_logs').insert({
      job_id: jobId, action: 'accepted',
      user_id: S.user.id, user_name: S.user.full_name || S.user.username
    });
    toast('รับงานเรียบร้อย', 'success');
  } catch(e){ toast(e.message || 'รับงานไม่สำเร็จ', 'error'); }
}

export async function editNote(jobId){
  const job = S.jobs.find(j => j.id === jobId);
  if(!job) return;
  const { openNoteModal } = await import('./modals.js');
  openNoteModal(job);
}

export function deleteJobConfirm(jobId){
  const job = S.jobs.find(j => j.id === jobId);
  if(!job) return;
  confirmAction(
    'ลบงาน',
    `ลบงาน ${job.job_no || ''}? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    () => deleteJob(jobId),
    'ลบงาน',
    true
  );
}

async function deleteJob(jobId){
  try {
    const { error } = await sb.from('jobs').delete().eq('id', jobId);
    if(error) throw error;
    invalidateStatusCache();
    toast('ลบงานเรียบร้อย', 'success');
  } catch(e){ toast(e.message || 'ลบงานไม่สำเร็จ', 'error'); }
}
