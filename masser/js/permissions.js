// =========================================================
// permissions.js — centralized role/status permission checks
// =========================================================

import { S } from './state.js';

// Role identity
export function isSuperAdmin(){ return S.user && S.user.role === 'SUPER_ADMIN'; }
export function isAdmin(){ return S.user && ['SUPER_ADMIN','ADMIN'].includes(S.user.role); }
export function isStaff(){ return S.user && S.user.role === 'STAFF'; }
export function isMessenger(){ return S.user && S.user.role === 'MESSENGER'; }

// Job-level permissions
export function isOwner(job){
  return S.user && job && job.created_by === S.user.id;
}
export function isAssigned(job){
  return S.user && job && job.assigned_to === S.user.id;
}

// === Job action permissions (taken verbatim from old system) ===

// Anyone authenticated can create a job
export function canCreateJob(){
  return S.user && ['SUPER_ADMIN','ADMIN','STAFF','MESSENGER'].includes(S.user.role);
}

// Admin or job creator can edit
export function canEditJob(job){
  return isAdmin() || isOwner(job);
}

// Admin only can delete
export function canDeleteJob(){
  return isAdmin();
}

// Only MESSENGER role can accept a WAIT job
export function canAcceptJob(job){
  return job && job.status === 'WAIT' && isMessenger();
}

// Close GOING job: admin, assigned messenger, OR owner (= ยืนยันรับเอกสาร)
export function canCloseJob(job){
  return job && job.status === 'GOING' && (isAdmin() || isAssigned(job) || isOwner(job));
}

// Detect "owner-confirm" close path (owner who is neither admin nor assigned)
export function isOwnerOnlyClose(job){
  return canCloseJob(job) && isOwner(job) && !isAdmin() && !isAssigned(job);
}

// Cancel WAIT/GOING job: admin, owner, or assigned messenger
export function canCancelJob(job){
  return job && ['WAIT','GOING'].includes(job.status) &&
    (isAdmin() || isOwner(job) || isAssigned(job));
}

// === Page-level permissions ===
export function canViewUsersPage(){ return isSuperAdmin(); }
export function canViewBackupPage(){ return isAdmin(); }
