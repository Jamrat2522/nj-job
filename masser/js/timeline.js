// =========================================================
// timeline.js — Job action timeline
// =========================================================

import { esc, fmtDateTime } from './utils.js';

export function renderTimeline(job, logs){
  const events = [];

  // Step 1: Created (always)
  events.push({
    state: 'done',
    title: 'สร้างงาน',
    meta: 'โดย ' + (job.created_by_name || 'ระบบ'),
    time: job.created_at
  });

  // Step 2: Accepted (if applicable)
  const acceptedLog = (logs || []).find(l => l.action === 'accepted');
  if(job.status === 'GOING' || job.status === 'DONE' || acceptedLog){
    events.push({
      state: job.status === 'GOING' ? 'active' : 'done',
      title: 'แมสเซ็นเจอร์รับงาน',
      meta: job.assigned_to_name || (acceptedLog ? acceptedLog.user_name : '—'),
      time: job.accepted_at || (acceptedLog ? acceptedLog.created_at : null)
    });
  } else if(job.status === 'WAIT'){
    events.push({
      state: 'pending',
      title: 'รอแมสเซ็นเจอร์รับงาน',
      meta: '—',
      time: null
    });
  }

  // Step 3: Closed (if applicable)
  if(job.status === 'DONE'){
    events.push({
      state: 'done',
      title: 'ปิดงาน',
      meta: 'โดย ' + (job.closed_by_name || '—') + (job.close_note ? '\n' + job.close_note : ''),
      time: job.closed_at
    });
  } else if(job.status === 'GOING'){
    events.push({
      state: 'pending',
      title: 'ปิดงาน',
      meta: '—',
      time: null
    });
  } else if(job.status === 'CANCELED'){
    events.push({
      state: 'canceled',
      title: 'ยกเลิกงาน',
      meta: 'โดย ' + (job.canceled_by_name || '—') + (job.cancel_reason ? '\nเหตุผล: ' + job.cancel_reason : ''),
      time: job.canceled_at
    });
  }

  return `<div class="timeline">${
    events.map(e => `
      <div class="tl-step ${e.state}">
        <div class="tl-dot"></div>
        <div>
          <div class="tl-title">${esc(e.title)}</div>
          <div class="tl-meta" style="white-space:pre-line">${esc(e.meta || '')}</div>
        </div>
        <div class="tl-time">${e.time ? esc(fmtDateTime(e.time)) : ''}</div>
      </div>
    `).join('')
  }</div>`;
}
