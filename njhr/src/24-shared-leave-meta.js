  /* ================= SHARED: LEAVE METADATA =================
     ย้ายมาจาก 06-auth-supabase.js โดยไม่แก้เนื้อใน — ไม่จำเป็นต่อ Login/Dashboard
     ใช้ร่วมกันโดย requests-leave · leave-form · request-detail · attendance-report · compatibility ================= */
  var LEAVE_TYPES = [
    { code: 'SICK',       name: 'ลาป่วย',     color: '#DC2626', needDoc: true },
    { code: 'PERSONAL',   name: 'ลากิจ',      color: '#2563EB', needDoc: false },
    { code: 'VACATION',   name: 'ลาพักร้อน',  color: '#059669', needDoc: false },
    { code: 'MATERNITY',  name: 'ลาคลอด',     color: '#DB2777', needDoc: false },
    { code: 'ORDINATION', name: 'ลาบวช',      color: '#D97706', needDoc: false },
    { code: 'HALFDAY',    name: 'ลาครึ่งวัน', color: '#7C3AED', needDoc: false },
    { code: 'OTHER',      name: 'ลาอื่น ๆ',   color: '#64748B', needDoc: false }
  ];

  var LT_MAP = {};
  LEAVE_TYPES.forEach(function (t) { LT_MAP[t.code] = t; });

  function lvType(code) { return LT_MAP[String(code || '').toUpperCase()] || { code: code, name: code, color: '#64748B', needDoc: false }; }

  function lvMode(r) {
    var m = r && r.approvals && r.approvals[0] && r.approvals[0].meta && r.approvals[0].meta.mode;
    if (m) return m;
    return r && r.leave_unit === 'hour' ? 'HOURLY' : (r && r.is_halfday ? 'HALF_AM' : 'FULL');
  }

  function lvModeTxt(m) { return { FULL: 'เต็มวัน', HALF_AM: 'ครึ่งวันเช้า', HALF_PM: 'ครึ่งวันบ่าย', HOURLY: 'รายชั่วโมง' }[m] || m; }

  function lvNum(v) { var n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : 0; }
