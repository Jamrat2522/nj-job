// =========================================================
// state.js — Global app state (single source of truth)
// =========================================================

export const APP_VERSION = '5.0.0';

// Status / Category / Avatar constants
export const STATUS_LABELS = {
  WAIT: 'รอรับงาน',
  GOING: 'กำลังดำเนินการ',
  DONE: 'งานเสร็จแล้ว',
  CANCELED: 'ยกเลิก'
};

export const STATUS_LABELS_SHORT = {
  WAIT: 'รอรับงาน',
  GOING: 'กำลังดำเนินการ',
  DONE: 'ปิดงาน',
  CANCELED: 'ยกเลิก'
};

export const CATEGORIES = [
  'รับ-ส่งทั่วไป',
  'รับ-ส่งดีโอ',
  'รับ-ส่งวางบิล',
  'รับ-ส่งเอกสารชิปปิ้ง',
  'ชุดงานปล่อย FZ ระยองเหมราช',
  'ชุดงานปล่อย FZ อมตะซิตี้',
  'ชุดงานปล่อย FZ อื่นๆ'
];

export const CATEGORY_ICONS = {
  'รับ-ส่งทั่วไป': 'box',
  'รับ-ส่งดีโอ': 'file-text',
  'รับ-ส่งวางบิล': 'receipt',
  'รับ-ส่งเอกสารชิปปิ้ง': 'file-stack',
  'ชุดงานปล่อย FZ ระยองเหมราช': 'truck',
  'ชุดงานปล่อย FZ อมตะซิตี้': 'truck',
  'ชุดงานปล่อย FZ อื่นๆ': 'truck',
  'ALL': 'list'
};

export const AVATAR_COLORS = [
  '#10B981', '#3B82F6', '#A855F7', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#84CC16'
];

// Global state singleton
export const S = {
  user: null,         // current user record from public.users
  authUser: null,     // supabase auth user
  view: 'jobs',
  jobs: [],
  users: [],
  messengers: [],
  filters: {
    search: '',
    status: 'ALL',
    category: 'ALL',
    messenger: '',
    company: '',
    dateFrom: '',
    dateTo: ''
  },
  dashFilters: { from: null, to: null },
  sortKey: 'job_number',   // 'job_number' | 'time'
  sortDir: 'desc',          // 'asc' | 'desc'
  page: 1,
  pageSize: 50,
  currentJob: null,
  currentUser: null,
  // Signature working state
  sigCtx: null,
  sigDrawing: false,
  sigDirty: false,
  sigStrokes: 0,
  sigPathLen: 0
};

// Reset filters helper
export function resetFilters(){
  S.filters = {
    search: '',
    status: 'ALL',
    category: 'ALL',
    messenger: '',
    company: '',
    dateFrom: '',
    dateTo: ''
  };
}
