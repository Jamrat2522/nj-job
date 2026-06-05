/* ============================================================================
 * NJ LOGISTIC HR SYSTEM  •  supabase.js
 * ----------------------------------------------------------------------------
 * - เชื่อมต่อ Supabase (Auth / Database / Storage)
 * - จัดการ Login ตามสเปก: trim() + lowercase() + email auto generate
 * - มี DEMO MODE สำรอง: ถ้ายังไม่ใส่ ANON KEY หรือเชื่อมต่อไม่ได้
 *   ระบบจะทำงานด้วยข้อมูลตัวอย่างในเครื่องทันที (ไม่พังหน้าจอ)
 * ========================================================================== */

/* ---- 1) ตั้งค่าโปรเจกต์ ---------------------------------------------------- */
const SUPABASE_CONFIG = {
  projectId: 'sytgqjglcnsabcszbngg',
  url: 'https://sytgqjglcnsabcszbngg.supabase.co',
  // ⚠️ ใส่ anon public key จาก Supabase > Project Settings > API
  // (ปกติใส่ผ่านหน้าตั้งค่าครั้งแรกของเว็บแอป — ไม่ต้องแก้ไฟล์นี้)
  anonKey: 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE',
};

// อ่านค่าที่ผู้ใช้บันทึกไว้ครั้งแรก (จากหน้าตั้งค่าก่อนเข้าระบบ) — มาก่อนค่าในไฟล์
try {
  const savedKey = localStorage.getItem('nj_supabase_key');
  const savedUrl = localStorage.getItem('nj_supabase_url');
  if (savedKey) SUPABASE_CONFIG.anonKey = savedKey;
  if (savedUrl) SUPABASE_CONFIG.url = savedUrl;
} catch (_) {}

const EMAIL_DOMAIN = '@salary.app';
const APP_CODE = 'salary';   // ระบบนี้เป็น Salary เท่านั้น → app_code = 'salary' (Salary Patch)

/* ---- 2) สร้าง client (ใช้ supabase-js v2 จาก CDN ใน index.html) ---------- */
let sb = null;
let USE_DEMO = true;
try {
  if (
    window.supabase &&
    SUPABASE_CONFIG.anonKey &&
    SUPABASE_CONFIG.anonKey !== 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE'
  ) {
    sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    USE_DEMO = false;
  }
} catch (e) {
  console.warn('Supabase init failed, falling back to DEMO MODE', e);
}

// helper สำหรับหน้าตั้งค่า — บันทึก key แล้วรีโหลดเพื่อเชื่อมต่อจริง
window.NJ_setSupabaseKey = (key, url) => {
  try {
    const k = (key || '').trim();
    if (!k) return false;
    localStorage.setItem('nj_supabase_key', k);
    if (url && url.trim()) localStorage.setItem('nj_supabase_url', url.trim());
    return true;
  } catch (_) { return false; }
};
window.NJ_clearSupabaseKey = () => {
  try { localStorage.removeItem('nj_supabase_key'); localStorage.removeItem('nj_supabase_url'); return true; }
  catch (_) { return false; }
};
window.NJ_isLive = () => !USE_DEMO;

/* ============================================================================
 * 3) NORMALIZE HELPERS  (สเปก: username lowercase + trim เสมอ)
 * ========================================================================== */
const Norm = {
  // soontaree01@salary.app -> username "soontaree" (ตัดท้าย @ และตัวเลข)
  username(input) {
    let v = String(input || '').trim().toLowerCase();
    if (v.includes('@')) v = v.split('@')[0]; // ตัด domain
    v = v.replace(/\d+$/, ''); // ตัดตัวเลขท้าย เช่น soontaree01 -> soontaree
    return v;
  },
  // สร้าง email จาก input: ถ้ามี @ อยู่แล้วใช้เลย, ถ้าไม่มีต่อ domain
  email(input) {
    const v = String(input || '').trim().toLowerCase();
    if (v.includes('@')) return v;
    return v + EMAIL_DOMAIN;
  },
};

/* ============================================================================
 * 4) DEMO DATA  (ใช้เมื่อยังไม่เชื่อม Supabase จริง)
 * ========================================================================== */
const DEMO = {
  users: [
    { username: 'phathep',  email: 'phathep01@salary.app',  password: 'Jam497522',  full_name: 'Phathep',   role: 'SUPER_ADMIN', emp_code: null },
    { username: 'soontaree', email: 'soontaree01@salary.app', password: 'soontaree01', full_name: 'Soontaree', role: 'SUPER_ADMIN', emp_code: null },
    { username: 'jamrus',   email: 'jamrus@salary.app',     password: 'jamrus',     full_name: 'จำรัส ผาเทพ', role: 'EMPLOYEE',    emp_code: 'EMP0001' },
  ],
  departments: ['ACCOUNT','CUSTOMER SERVICE EXPORT','CUSTOMER SERVICE IMPORT','MAID','MANAGER','SHIPPING AIRPORT','SHIPPING BKK','SHIPPING LBK','SHIPPING LCB'],
  employees: [
    mkEmp('EMP0001','จำรัส','ผาเทพ','รัส','MANAGER','General Manager',50000,'ACTIVE',{phone:'098-552-3945',email:'jamrus@njlogistic.com',bank:'กสิกรไทย',acc:'123-4-56789-0',pos_allow:3000,dil:2000,phone_a:1000,travel:1500,start:'2020-01-12',idcard:'1-2345-67890-12'}),
    mkEmp('EMP0002','พงศ์ศักดิ์','ใจดี','พงศ์','MANAGER','Assistant Manager',35000,'ACTIVE',{}),
    mkEmp('EMP0003','วิภา','สายทอง','','ACCOUNT','Accountant',28000,'ACTIVE',{}),
    mkEmp('EMP0004','สมชาย','รุ่งเรือง','','ACCOUNT','Senior Accountant',25000,'ACTIVE',{}),
    mkEmp('EMP0005','กมลวรรณ','คำดี','','CUSTOMER SERVICE IMPORT','CS Import',26000,'ACTIVE',{}),
    mkEmp('EMP0006','ธนกร','แสงทอง','','SHIPPING BKK','Shipping BKK Officer',22000,'ACTIVE',{}),
    mkEmp('EMP0007','ปวีณา','อินทร์ใจ','','SHIPPING LCB','Shipping LCB Officer',18000,'RESIGNED',{}),
  ],
  leaves: [
    { emp_code:'EMP0002', type:'PERSONAL', label:'ลากิจ', start:'2567-05-20', end:'2567-05-20', unit:'hour', hours:3, days:0, reason:'ธุระส่วนตัว', status:'PENDING_DEPARTMENT', approvals:[], when:'19 พ.ค. 2567' },
    { emp_code:'EMP0003', type:'SICK', label:'ลาป่วย', start:'2567-05-16', end:'2567-05-17', unit:'day', hours:0, days:2, reason:'เป็นไข้', status:'PENDING_SUPERVISOR', approvals:[{level:'DEPARTMENT',approver_name:'ฝ่ายบุคคล',action:'APPROVE',comment:'',approved_at:''}], when:'15 พ.ค. 2567' },
    { emp_code:'EMP0001', type:'PERSONAL', label:'ลากิจ', start:'2567-05-03', end:'2567-05-03', unit:'halfday', hours:0, days:0.5, reason:'ไปธนาคาร', status:'APPROVED', approvals:[], when:'2 พ.ค. 2567' },
    { emp_code:'EMP0001', type:'VACATION', label:'ลาพักร้อน', start:'2567-04-25', end:'2567-04-26', unit:'day', hours:0, days:2, reason:'พักผ่อน', status:'APPROVED', approvals:[], when:'20 เม.ย. 2567' },
    { emp_code:'EMP0002', type:'SICK', label:'ลาป่วย', start:'2567-04-10', end:'2567-04-10', unit:'day', hours:0, days:1, reason:'', status:'REJECTED', approvals:[], when:'9 เม.ย. 2567' },
  ],
  ots: [
    { emp_code:'EMP0002', date:'2567-05-16', start:'18:00', end:'21:00', hours:3, reason:'ปิดงบเดือน', status:'PENDING_DEPARTMENT', approvals:[], when:'16 พ.ค. 2567' },
    { emp_code:'EMP0003', date:'2567-05-14', start:'18:00', end:'20:00', hours:2, reason:'งานด่วนลูกค้า', status:'PENDING_SUPERVISOR', approvals:[{level:'DEPARTMENT',approver_name:'ฝ่ายบุคคล',action:'APPROVE',comment:'',approved_at:''}], when:'14 พ.ค. 2567' },
    { emp_code:'EMP0001', date:'2567-05-10', start:'17:30', end:'19:30', hours:2, reason:'ตรวจสต็อก', status:'APPROVED', approvals:[], when:'10 พ.ค. 2567' },
    { emp_code:'EMP0001', date:'2567-05-05', start:'18:00', end:'22:00', hours:4, reason:'', status:'REJECTED', approvals:[], when:'5 พ.ค. 2567' },
  ],
  attendance: [
    { date:'15 พ.ค. 2567', in:'08:05 น.', out:'17:28 น.', hours:'9 ชม. 23 นาที', status:'NORMAL', place:'ออฟฟิศใหญ่' },
    { date:'14 พ.ค. 2567', in:'08:11 น.', out:'17:35 น.', hours:'9 ชม. 24 นาที', status:'NORMAL', place:'ออฟฟิศใหญ่' },
    { date:'13 พ.ค. 2567', in:'08:20 น.', out:'17:40 น.', hours:'9 ชม. 20 นาที', status:'LATE',   place:'ออฟฟิศใหญ่' },
  ],
  // กะการทำงาน (work_shifts)
  shifts: [
    { id:1, icon:'🕒', shift_name:'OFFICE',      start_time:'08:30', end_time:'17:30', break_minutes:60, late_allow_minutes:15, ot_start_after:'17:30', working_days:'จ-ศ', status:'ACTIVE' },
    { id:2, icon:'🏭', shift_name:'WAREHOUSE',   start_time:'07:00', end_time:'16:00', break_minutes:60, late_allow_minutes:15, ot_start_after:'16:00', working_days:'จ-ส', status:'ACTIVE' },
    { id:3, icon:'🚚', shift_name:'TRANSPORT',   start_time:'06:00', end_time:'15:00', break_minutes:60, late_allow_minutes:15, ot_start_after:'15:00', working_days:'จ-ส', status:'ACTIVE' },
    { id:4, icon:'🌙', shift_name:'NIGHT SHIFT', start_time:'20:00', end_time:'05:00', break_minutes:60, late_allow_minutes:15, ot_start_after:'05:00', working_days:'จ-ส', status:'ACTIVE' },
  ],
  // employee_shifts: รหัสพนักงาน -> shift id
  employeeShifts: { EMP0001:1, EMP0002:1, EMP0003:1, EMP0004:1, EMP0005:1, EMP0006:2, EMP0007:3 },
};

function mkEmp(code,fn,ln,nick,dept,pos,salary,status,opt){
  opt = opt||{};
  return {
    emp_code:code, first_name:fn, last_name:ln, nickname:nick,
    department_name:dept, position_name:pos, base_salary:salary, status:status,
    phone:opt.phone||'', email:opt.email||'', bank_name:opt.bank||'', bank_account:opt.acc||'',
    position_allow:opt.pos_allow||0, diligence_allow:opt.dil||0, diligence_mode:opt.dil_mode||'AUTO', phone_allow:opt.phone_a||0,
    travel_allow:opt.travel||0, start_date:opt.start||'2566-01-01', gender:opt.gender||'',
    national_id:opt.idcard||'', employee_category:opt.category||'พนักงานประจำ',
  };
}

/* ============================================================================
 * 5) AUTH API
 * ========================================================================== */
const Auth = {
  current: null,

  async login(rawUsername, password) {
    const username = Norm.username(rawUsername);
    const email = Norm.email(rawUsername);
    const pass = String(password || '').trim();

    if (USE_DEMO) {
      // ค้นจาก username ที่ normalize แล้ว
      const u = DEMO.users.find(x => Norm.username(x.username) === username);
      if (!u) return { error: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' };
      if (u.password !== pass && u.password !== password)
        return { error: 'รหัสผ่านไม่ถูกต้อง' };
      this.current = { username:u.username, email:u.email, full_name:u.full_name, role:u.role, emp_code:u.emp_code };
      this._persist();
      return { user: this.current };
    }

    // ════════════════════════════════════════════════════════════════════
    // โหมดจริง (LIVE): Login ด้วย public.app_users เท่านั้น
    //   - ไม่ใช้ auth.users / Supabase Auth / sb.auth.* / Email Login / internal_username
    //   - ตรวจ: username + password + app_code='salary' + status='active'
    //   - Frontend ใช้ anon key เท่านั้น → ต้องเปิด RLS ให้ anon SELECT app_users
    // ════════════════════════════════════════════════════════════════════
    try {
      // 1) ดึง user จาก app_users ด้วย username + app_code = 'salary'
      const { data: appUser, error } = await sb
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('app_code', APP_CODE)
        .maybeSingle();

      // ถ้า Supabase error จริง → แสดง error จริง (ห้ามขึ้นว่าสำเร็จ)
      if (error) return { error: 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ: ' + error.message };
      if (!appUser) return { error: 'ไม่พบชื่อผู้ใช้นี้ในระบบ' };

      // 2) ตรวจสถานะต้อง active
      if (String(appUser.status || '').trim().toLowerCase() !== 'active')
        return { error: 'บัญชีนี้ถูกระงับการใช้งาน' };

      // 3) ตรวจรหัสผ่าน (เก็บใน app_users.password)
      const dbPass = String(appUser.password ?? '');
      if (dbPass !== pass && dbPass !== password)
        return { error: 'รหัสผ่านไม่ถูกต้อง' };

      // 4) normalize role ให้เข้ากันกับระบบเดิม (USER → EMPLOYEE)
      let role = String(appUser.role || 'user').trim().toUpperCase();
      if (role === 'USER') role = 'EMPLOYEE';

      // emp_code: รองรับทั้ง employee_id และ emp_code
      const empCode = appUser.employee_id ?? appUser.emp_code ?? null;

      this.current = {
        username,
        email: appUser.email || (username + EMAIL_DOMAIN),
        full_name: appUser.full_name || username,
        role,
        emp_code: empCode,
        app_code: APP_CODE,
        user_id: appUser.id ?? null,
      };
      this._persist();
      return { user: this.current };
    } catch (e) {
      return { error: 'เกิดข้อผิดพลาด: ' + e.message };
    }
  },

  async logout() {
    // V.6: ไม่ใช้ Supabase Auth → ไม่มี session ฝั่ง auth ให้ signOut
    this.current = null;
    localStorage.removeItem('nj_hr_session');
  },

  restore() {
    try {
      const s = localStorage.getItem('nj_hr_session');
      if (s) { this.current = JSON.parse(s); return true; }
    } catch {}
    return false;
  },

  _persist() {
    localStorage.setItem('nj_hr_session', JSON.stringify(this.current));
  },

  isAdmin() {
    return ['SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER'].includes(this.current?.role);
  },

  // สิทธิ์แก้ไขกะการทำงาน: เฉพาะ SUPER_ADMIN / ADMIN / HR
  canEditShift() {
    return ['SUPER_ADMIN','ADMIN','HR'].includes(this.current?.role);
  },

  // สิทธิ์แก้ไขเบี้ยขยัน: เฉพาะ SUPER_ADMIN / ADMIN / HR (USER/EMPLOYEE อ่านอย่างเดียว)
  canEditDiligence() {
    return ['SUPER_ADMIN','ADMIN','HR'].includes(this.current?.role);
  },
};

/* ============================================================================
 * 6) DATA API  (เลือก Supabase จริง หรือ DEMO อัตโนมัติ)
 * ========================================================================== */
const Data = {
  async employees() {
    if (USE_DEMO) return DEMO.employees;
    const { data, error } = await sb.from('v_employee_full').select('*').order('emp_code');
    if (error) { console.warn(error); return DEMO.employees; }
    return data;
  },

  // โหลดรายชื่อผู้ใช้งานจริงจาก app_users (เฉพาะระบบ salary)
  async appUsers() {
    if (USE_DEMO) return DEMO.users;
    const { data, error } = await sb.from('app_users')
      .select('*').eq('app_code', APP_CODE).order('username');
    if (error) { console.warn(error); return DEMO.users; }
    return data || [];
  },

  // เปลี่ยนรหัสผ่านของสมาชิก (เฉพาะระบบ salary) — คืน {error} ถ้าไม่สำเร็จ
  async updatePassword(userId, newPassword) {
    if (USE_DEMO) return { ok:true };
    const { error } = await sb.from('app_users')
      .update({ password: String(newPassword) })
      .eq('id', userId).eq('app_code', APP_CODE);
    if (error) return { error: error.message };
    return { ok:true };
  },

  async leaves() {
    if (USE_DEMO) return DEMO.leaves;
    const { data } = await sb.from('leave_requests').select('*').order('created_at', { ascending:false });
    if (!data) return DEMO.leaves;
    return data.map(normalizeLeaveRow);
  },

  // ----- OT -----
  async ots() {
    if (USE_DEMO) return DEMO.ots;
    const { data } = await sb.from('ot_requests').select('*').order('created_at', { ascending:false });
    return data || DEMO.ots;
  },
  async submitOT(p) {
    if (USE_DEMO) {
      DEMO.ots.unshift({
        emp_code: Auth.current?.emp_code || null,
        date: p.date, start: p.start, end: p.end, hours: p.hours,
        reason: p.reason, status: 'PENDING_DEPARTMENT', approvals: [], when: 'วันนี้',
        file_name: p.file ? p.file.name : null,
      });
      return { ok: true };
    }
    try {
      let employee_id = null;
      try {
        if (Auth.current?.emp_code) {
          const { data: emp } = await sb.from('employees').select('id').eq('emp_code', Auth.current.emp_code).maybeSingle();
          employee_id = emp?.id || null;
        }
        if (!employee_id && Auth.current?.user_id) {
          const { data: au } = await sb.from('app_users').select('employee_id').eq('id', Auth.current.user_id).maybeSingle();
          employee_id = au?.employee_id || null;
        }
      } catch (_) {}
      const { error } = await sb.from('ot_requests').insert({
        employee_id, ot_date: p.date, start_time: p.start, end_time: p.end,
        ot_hours: p.hours, reason: p.reason, status: 'PENDING',
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  },

  // ----- บันทึกคำขอลา (Supabase จริง / demo = in-memory) -----
  // p: { typeLabel, leaveEnum, unit, start_date, end_date, start_time, end_time, hours, days, reason, file }
  async submitLeave(p) {
    if (USE_DEMO) {
      DEMO.leaves.unshift({
        emp_code: Auth.current?.emp_code || null,
        type: p.leaveEnum, label: p.typeLabel,
        start: p.start_date, end: p.end_date,
        days: p.days, hours: p.hours, unit: p.unit,
        reason: p.reason,
        status: 'PENDING_DEPARTMENT', approvals: [], when: 'วันนี้',
        file_name: p.file ? p.file.name : null,
      });
      return { ok: true };
    }
    try {
      let employee_id = null;
      try {
        if (Auth.current?.emp_code) {
          const { data: emp } = await sb.from('employees').select('id').eq('emp_code', Auth.current.emp_code).maybeSingle();
          employee_id = emp?.id || null;
        }
        if (!employee_id && Auth.current?.user_id) {
          const { data: au } = await sb.from('app_users')
            .select('employee_id').eq('id', Auth.current.user_id).maybeSingle();
          employee_id = au?.employee_id || null;
        }
      } catch (_) {}
      const { data: leave, error } = await sb.from('leave_requests').insert({
        employee_id,
        leave_type: p.leaveEnum,
        start_date: p.start_date,
        end_date: p.end_date,
        leave_unit: p.unit,                       // 'day' | 'halfday' | 'hour'
        start_time: p.start_time || null,
        end_time: p.end_time || null,
        hours: p.hours || 0,
        total_days: p.days || 0,
        is_halfday: p.unit === 'halfday',
        reason: p.reason,
        status: 'PENDING',
      }).select().single();
      if (error) return { ok: false, error: error.message };

      // อัปโหลดไฟล์แนบทุกนามสกุล -> Supabase Storage (bucket: leave-attachments)
      if (p.file && leave) {
        const path = `${leave.id}/${Date.now()}_${p.file.name}`;
        const up = await sb.storage.from('leave-attachments').upload(path, p.file, { upsert: false });
        if (!up.error) {
          const { data: pub } = sb.storage.from('leave-attachments').getPublicUrl(path);
          await sb.from('leave_attachments').insert({
            leave_id: leave.id, file_name: p.file.name,
            file_url: pub?.publicUrl, file_size: p.file.size,
          });
        }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // ----- อนุมัติ/ไม่อนุมัติ ลา/OT: บันทึกสถานะ + approvals ลง Supabase -----
  async updateLeaveStatus(id, status, approvals) {
    if (USE_DEMO) return { ok:true };
    if (!sb || !id) return { ok:false, error:'ไม่พบรหัสคำขอลา' };
    const { error } = await sb.from('leave_requests')
      .update({ status, approvals }).eq('id', id);
    if (error) return { ok:false, error: error.message };
    return { ok:true };
  },
  async updateOtStatus(id, status, approvals) {
    if (USE_DEMO) return { ok:true };
    if (!sb || !id) return { ok:false, error:'ไม่พบรหัสคำขอ OT' };
    const { error } = await sb.from('ot_requests')
      .update({ status, approvals }).eq('id', id);
    if (error) return { ok:false, error: error.message };
    return { ok:true };
  },

  // ----- บันทึกการสแกนหน้าเข้า/ออก ลง Supabase จริง (attendance + gps_logs + face_scan_logs) -----
  // rec = { type:'in'|'out', time, face_image_base64, latitude, longitude, location_name, distance_meter, gps_status, shift_id }
  async saveAttendanceScan(rec) {
    if (USE_DEMO) return { ok:true };
    if (!sb) return { ok:false, error:'ยังไม่ได้เชื่อมต่อฐานข้อมูล' };
    try {
      // 1) resolve employee_id ของผู้ที่ login
      let employee_id = null;
      if (Auth.current?.emp_code) {
        const { data: emp } = await sb.from('employees').select('id').eq('emp_code', Auth.current.emp_code).maybeSingle();
        employee_id = emp?.id || null;
      }
      if (!employee_id && Auth.current?.user_id) {
        const { data: au } = await sb.from('app_users').select('employee_id').eq('id', Auth.current.user_id).maybeSingle();
        employee_id = au?.employee_id || null;
      }

      const nowISO = new Date().toISOString();
      const today  = nowISO.slice(0, 10);
      const scanType = rec.type === 'in' ? 'IN' : 'OUT';

      // 2) อัปโหลดรูปใบหน้า (base64) ขึ้น storage — ถ้าไม่สำเร็จไม่บล็อกการลงเวลา
      let image_url = null;
      try {
        if (rec.face_image_base64 && rec.face_image_base64.startsWith('data:')) {
          const blob = await (await fetch(rec.face_image_base64)).blob();
          const path = `${today}/${employee_id || 'unknown'}_${scanType}_${Date.now()}.jpg`;
          const up = await sb.storage.from('face-scans').upload(path, blob, { contentType:'image/jpeg', upsert:true });
          if (!up.error) { const { data: pub } = sb.storage.from('face-scans').getPublicUrl(path); image_url = pub?.publicUrl || null; }
        }
      } catch (_) { /* ข้าม ถ้าอัปโหลดรูปไม่ได้ ยังบันทึกเวลา/พิกัดต่อ */ }

      // 3) gps_logs
      const gpsRes = await sb.from('gps_logs').insert({
        employee_id, scan_type: scanType,
        latitude: rec.latitude, longitude: rec.longitude,
        accuracy: rec.accuracy ?? null, shift_id: rec.shift_id ? String(rec.shift_id) : null,
        captured_at: nowISO,
      });
      if (gpsRes.error) return { ok:false, error:'gps_logs: ' + gpsRes.error.message };

      // 4) face_scan_logs
      const faceRes = await sb.from('face_scan_logs').insert({
        employee_id, scan_type: scanType, image_url,
        latitude: rec.latitude, longitude: rec.longitude,
        shift_id: rec.shift_id ? String(rec.shift_id) : null,
        matched: true, captured_at: nowISO,
      });
      if (faceRes.error) return { ok:false, error:'face_scan_logs: ' + faceRes.error.message };

      // 5) attendance_logs (log ดิบ)
      await sb.from('attendance_logs').insert({
        employee_id, work_date: today,
        check_in:  scanType === 'IN'  ? nowISO : null,
        check_out: scanType === 'OUT' ? nowISO : null,
        status: 'PRESENT', source: 'face_scan',
      });

      // 6) attendance (สรุปรายวัน) — เข้า = insert/มีอยู่แล้วเติม check_in, ออก = เติม check_out
      const { data: existing } = await sb.from('attendance')
        .select('id,check_in,check_out').eq('employee_id', employee_id).eq('work_date', today).maybeSingle();
      if (existing?.id) {
        const patch = scanType === 'IN' ? { check_in: nowISO } : { check_out: nowISO };
        const r = await sb.from('attendance').update({ ...patch, status:'PRESENT', place: rec.location_name || null }).eq('id', existing.id);
        if (r.error) return { ok:false, error:'attendance: ' + r.error.message };
      } else {
        const r = await sb.from('attendance').insert({
          employee_id, work_date: today,
          check_in:  scanType === 'IN'  ? nowISO : null,
          check_out: scanType === 'OUT' ? nowISO : null,
          status: 'PRESENT', place: rec.location_name || null,
        });
        if (r.error) return { ok:false, error:'attendance: ' + r.error.message };
      }

      return { ok:true, employee_id };
    } catch (e) {
      return { ok:false, error: e.message };
    }
  },

  async attendanceHistory() {
    if (USE_DEMO) return DEMO.attendance;
    const { data } = await sb.from('attendance').select('*').order('work_date', { ascending:false }).limit(10);
    return data || DEMO.attendance;
  },

  // เข้างานวันนี้ (อ่านอย่างเดียว สำหรับ Dashboard) — DEMO ไม่มีข้อมูลวันนี้ -> []
  async attendanceToday() {
    if (USE_DEMO) return [];
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await sb.from('attendance').select('status,check_in,employee_id').eq('work_date', today);
    return data || [];
  },

  // ----- กะการทำงาน -----
  async shifts() {
    if (USE_DEMO) return DEMO.shifts;
    const { data } = await sb.from('work_shifts').select('*').order('start_time');
    return data || DEMO.shifts;
  },
  async myShift(empCode) {
    if (USE_DEMO) {
      const sid = DEMO.employeeShifts[empCode] || 1;
      return DEMO.shifts.find(s => s.id === sid) || DEMO.shifts[0];
    }
    // Supabase: query employee_shifts ด้วย emp_code + status ACTIVE -> join work_shifts
    const { data: emp } = await sb.from('employees').select('id').eq('emp_code', empCode).maybeSingle();
    if (emp?.id) {
      const { data } = await sb.from('employee_shifts')
        .select('work_shifts(*)').eq('employee_id', emp.id).eq('status', 'ACTIVE')
        .order('effective_date', { ascending: false }).limit(1).maybeSingle();
      if (data?.work_shifts) return data.work_shifts;
    }
    const all = await this.shifts();
    return all[0] || DEMO.shifts[0];
  },

  // ----- บันทึกกะ (เพิ่ม/แก้ไข) -----
  async saveShift(shift) {
    if (USE_DEMO) return { ok: true };
    const row = {
      icon: shift.icon,
      shift_name: shift.shift_name, start_time: shift.start_time, end_time: shift.end_time,
      break_minutes: shift.break_minutes, late_allow_minutes: shift.late_allow_minutes,
      ot_start_after: shift.ot_start_after, working_days: shift.working_days, status: shift.status,
    };
    // แก้ไขของเดิม: ใช้ id (uuid จาก work_shifts) เป็นคีย์ → upsert จะ update ไม่สร้างใหม่
    const key = shift.uuid || shift.id;
    if (key) row.id = key;
    const { error } = await sb.from('work_shifts').upsert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  // ----- จัดพนักงานเข้ากะ -----
  async assignShift(shiftUuid, empCodes) {
    if (USE_DEMO) return { ok: true };
    // ปิด record เดิมของกะนี้ แล้ว insert ชุดใหม่
    await sb.from('employee_shifts').delete().eq('shift_id', shiftUuid);
    if (empCodes.length) {
      const { data: emps } = await sb.from('employees').select('id,emp_code').in('emp_code', empCodes);
      const rows = (emps || []).map(e => ({ employee_id: e.id, shift_id: shiftUuid, status: 'ACTIVE' }));
      if (rows.length) {
        const { error } = await sb.from('employee_shifts').insert(rows);
        if (error) return { ok: false, error: error.message };
      }
    }
    return { ok: true };
  },

  // ===== โครงสร้างรายการรับ/หัก (ตามสเปก: เขียว=รับ, เหลือง=หัก) =============
  INCOME_KEYS: ['ฐานเงินเดือน','ค่าตำแหน่ง','ค่าโทรศัพท์','ค่าเดินทาง','ค่าน้ำมัน','ค่าเบี้ยขยัน','ค่ากะ','ค่าล่วงเวลา','โบนัส','ค่าคอมมิชชั่น','ค่าอื่นๆ'],
  DEDUCT_KEYS: ['หักลากิจ','หักปกส.5%','หักกยศ.','หักอื่นๆ'],

  // ----- คำนวณเงินเดือน : ดึงจากพนักงานอัตโนมัติ + ตัวแปรรายเดือน (override) --
  // เชื่อมด้วยรหัสพนักงาน (emp_code) เป็นหลัก — ไม่ใช้ชื่อ
  calcPayroll(emp, monthly) {
    monthly = monthly || {};
    emp = emp || {};
    const n = num0;
    const base = n(emp.base_salary);

    // จำนวนวันของเดือน: ใช้ override ถ้ามี ('วันในเดือน') ไม่งั้นใช้เดือนปัจจุบัน
    const today = new Date();
    const daysInMonth = n(monthly['วันในเดือน']) || new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const personalLeaveDays = n(monthly['ลากิจ']);              // ลากิจ (วัน) — เท่านั้นที่ถูกหัก
    const dailySalary = daysInMonth > 0 ? base / daysInMonth : 0;

    // ค่ากะ = อัตราต่อวัน × วันทำงานจริง (รวมเสาร์-อาทิตย์ แต่ไม่นับวันลากิจ)
    const shiftRate = n(monthly['ค่ากะ']);
    const workDays = Math.max(0, daysInMonth - personalLeaveDays);
    const shiftAmount = shiftRate * workDays;

    const income = {
      'ฐานเงินเดือน':  base,
      'ค่าตำแหน่ง':    n(emp.position_allow),
      'ค่าโทรศัพท์':   n(emp.phone_allow),
      'ค่าเดินทาง':    n(emp.travel_allow),
      'ค่าน้ำมัน':     n(emp.fuel_allow),
      'ค่าเบี้ยขยัน':  monthly['ค่าเบี้ยขยัน'] != null ? n(monthly['ค่าเบี้ยขยัน']) : n(emp.diligence_allow),
      'ค่ากะ':         shiftAmount,
      'ค่าล่วงเวลา':   n(monthly['ค่าล่วงเวลา']),   // OT (กรอกเอง)
      'โบนัส':         n(monthly['โบนัส']),
      'ค่าคอมมิชชั่น': n(monthly['ค่าคอมมิชชั่น']),
      'ค่าอื่นๆ':      n(monthly['ค่าอื่นๆ']),
    };
    const totalIncome = sumObj(income);

    // ประกันสังคม = ฐานเงินเดือน × % (ค่าเริ่มต้น 5%) สูงสุด 750
    const ssoPercent = monthly['ปกส.%'] != null ? n(monthly['ปกส.%']) : 5;
    const sso = Math.min(base * ssoPercent / 100, 750);

    // นโยบาย: ไม่หักมาสาย / ไม่หักวันลาทุกประเภท ยกเว้นลากิจ
    const deduct = {
      'หักลากิจ':   Math.round(personalLeaveDays * dailySalary),
      'หักปกส.5%':  Math.round(sso),
      'หักกยศ.':    n(monthly['หักกยศ.']),       // กรอกเอง
      'หักอื่นๆ':   n(monthly['หักอื่นๆ']),       // กรอกเอง
    };
    const totalDeduct = sumObj(deduct);

    return {
      income, deduct, totalIncome, totalDeduct, net: totalIncome - totalDeduct,
      meta: { daysInMonth, dailySalary, workDays, shiftRate, shiftAmount, personalLeaveDays, ssoPercent, lateDeduction: 0 },
    };
  },

  // ----- Import พนักงาน (เฉพาะข้อมูลหลัก) เชื่อม/อัปเดตด้วย emp_code -----
  async importEmployees(rows) {
    const mapped = rows.map(mapEmployeeRow).filter(r => r.emp_code);
    if (USE_DEMO) {
      mapped.forEach(m => {
        const i = DEMO.employees.findIndex(e => e.emp_code === m.emp_code);
        if (i >= 0) DEMO.employees[i] = { ...DEMO.employees[i], ...m };
        else DEMO.employees.push(m);
      });
      return { ok: true, count: mapped.length };
    }
    const { error } = await sb.from('employees').upsert(mapped, { onConflict: 'emp_code' });
    if (error) return { ok: false, error: error.message };
    return { ok: true, count: mapped.length };
  },

  // ----- บันทึกพนักงานใหม่ (จาก Modal เพิ่มพนักงาน) -----
  async saveEmployee(emp) {
    if (USE_DEMO) {
      const i = DEMO.employees.findIndex(e => e.emp_code === emp.emp_code);
      if (i >= 0) DEMO.employees[i] = { ...DEMO.employees[i], ...emp };
      else DEMO.employees.push(emp);
      return { ok: true };
    }
    // Supabase: insert เฉพาะคอลัมน์ที่มีใน schema เดิม (ไม่เปลี่ยน schema)
    const row = {
      emp_code: emp.emp_code, first_name: emp.first_name, last_name: emp.last_name,
      nickname: emp.nickname, national_id: emp.id_card, gender: emp.gender,
      birth_date: emp.birth_date || null, phone: emp.phone, email: emp.email, address: emp.address,
      department_name: emp.department_name, position_name: emp.position_name, status: emp.status,
      start_date: emp.start_date || null,
      base_salary: emp.base_salary, position_allow: emp.position_allow,
      diligence_allow: emp.diligence_allow, phone_allow: emp.phone_allow, travel_allow: emp.travel_allow,
      bank_name: emp.bank_name, bank_account: emp.bank_account, bank_account_name: emp.account_name,
    };
    const { error } = await sb.from('employees').upsert(row, { onConflict: 'emp_code' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  // ----- ลบพนักงาน (DEMO = in-memory / Supabase = delete by emp_code) -----
  async deleteEmployee(empCode) {
    if (USE_DEMO) {
      const i = DEMO.employees.findIndex(e => e.emp_code === empCode);
      if (i >= 0) DEMO.employees.splice(i, 1);
      return { ok: true };
    }
    const { error } = await sb.from('employees').delete().eq('emp_code', empCode);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  // ----- เบี้ยขยัน AUTO: คำนวณจากจำนวน "พฤติกรรมเสีย" ในเดือน -----
  //  ลากิจ(วัน) + มาสาย(ครั้ง) + ขาดงาน(ครั้ง):  0 ครั้ง=400, 1=350, 2=300, ≥3=0
  computeDiligence(counts) {
    counts = counts || {};
    const issues = (Number(counts.personalLeaveDays) || 0) + (Number(counts.lateCount) || 0) + (Number(counts.absentCount) || 0);
    if (issues <= 0) return 400;
    if (issues === 1) return 350;
    if (issues === 2) return 300;
    return 0;
  },

  // ----- อัปเดตเบี้ยขยัน + โหมด (DEMO = in-memory / Supabase = update) -----
  async updateDiligence(empCode, mode, value) {
    const val = Number(value) || 0;
    const md = mode === 'MANUAL' ? 'MANUAL' : 'AUTO';
    if (USE_DEMO) {
      const e = DEMO.employees.find(x => x.emp_code === empCode);
      if (e) { e.diligence_allow = val; e.diligence_mode = md; }
      return { ok: true };
    }
    // พยายามอัปเดตพร้อม diligence_mode; ถ้าคอลัมน์ยังไม่มีในฐานข้อมูล -> fallback อัปเดตเฉพาะค่า
    let res = await sb.from('employees').update({ diligence_allow: val, diligence_mode: md }).eq('emp_code', empCode);
    if (res.error && /diligence_mode|column/i.test(res.error.message || '')) {
      res = await sb.from('employees').update({ diligence_allow: val }).eq('emp_code', empCode);
    }
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  },

  // ----- บันทึก Audit Log (DEMO = in-memory / Supabase = insert audit_logs) -----
  async logAudit(entry) {
    entry = entry || {};
    if (USE_DEMO) {
      (DEMO.audit = DEMO.audit || []).unshift({ ...entry, by: Auth.current?.full_name || Auth.current?.username || '-', created_at: new Date().toISOString() });
      return { ok: true };
    }
    try {
      const detail = { ...(entry.detail || {}), by: Auth.current?.full_name || Auth.current?.username || '-' };
      const { error } = await sb.from('audit_logs').insert({ user_id: Auth.current?.user_id || null, action: entry.action || '', entity: entry.entity || '', detail });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  },

  // ----- Import เงินเดือนรายเดือน: อ่านรหัส -> ดึงพนักงาน -> รวม -> คำนวณ -----
  buildPayrollFromImport(rows, employees) {
    const byCode = {};
    employees.forEach(e => { byCode[String(e.emp_code)] = e; });
    return rows.map(row => {
      const code = String(row['รหัสพนักงาน'] ?? row['emp_code'] ?? '').trim().padStart(4, '0');
      const emp = byCode[code] || byCode[code.replace(/^0+/, '')] || null;
      if (!emp) return null;
      const monthly = mapPayrollMonthly(row);
      const calc = this.calcPayroll(emp, monthly);
      return { emp, monthly, calc };
    }).filter(Boolean);
  },
};

/* ---- helpers สำหรับ payroll / import ------------------------------------- */
function num0(v) {
  if (v === '' || v == null || v === '.') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}
function sumObj(o) { return Object.values(o).reduce((a, b) => a + Number(b || 0), 0); }

// แปลงค่าวันที่จาก Excel (string 'YYYY/MM/DD', serial number, หรือ Date) -> 'YYYY-MM-DD' | null
function toDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString().slice(0, 10);
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 86400000)); return isNaN(d) ? null : d.toISOString().slice(0, 10); }
  let s = String(v).trim(); if (!s) return null;
  s = s.replace(/\//g, '-');
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  return null;
}
// แปลงสถานะพนักงานจาก Excel -> enum
function mapEmpStatus(s) {
  const x = String(s || '');
  if (/ลาออก|RESIGN/i.test(x)) return 'RESIGNED';
  if (/พักงาน|SUSPEND/i.test(x)) return 'SUSPENDED';
  return 'ACTIVE';
}
const mapSalaryType = (s) => /วัน|DAILY/i.test(String(s || '')) ? 'DAILY' : (/เหมา|CONTRACT/i.test(String(s || '')) ? 'CONTRACT' : 'MONTHLY');
const mapPayMethod = (s) => /เงินสด|CASH/i.test(String(s || '')) ? 'CASH' : 'BANK';

// ป้ายภาษาไทยของประเภทลา (ใช้ตอน normalize แถวจาก Supabase)
const LEAVE_LABEL_TH = { SICK: 'ลาป่วย', PERSONAL: 'ลากิจ', VACATION: 'ลาพักร้อน', ANNUAL: 'ลาพักร้อน', MATERNITY: 'ลาคลอด', ORDINATION: 'ลาบวช', OTHER: 'ลาอื่นๆ' };
// แปลงแถว leave_requests (Supabase) ให้มีฟิลด์รูปแบบเดียวกับ DEMO เพื่อให้ UI แสดงผลถูกต้อง
function normalizeLeaveRow(r) {
  if (!r || typeof r !== 'object') return r;
  const type = r.type || r.leave_type || 'OTHER';
  return {
    ...r,                                   // คงฟิลด์เดิมไว้ (รายงานยังอ่าน leave_type/start_date/total_days ได้)
    type,
    label: r.label || LEAVE_LABEL_TH[String(type).toUpperCase()] || type,
    start: r.start || r.start_date || '',
    end:   r.end   || r.end_date   || '',
    unit:  r.unit  || r.leave_unit || 'day',
    days:  r.days != null ? r.days : (r.total_days != null ? r.total_days : 0),
    hours: r.hours != null ? r.hours : 0,
    when:  r.when || (r.created_at ? toDate(r.created_at) : ''),
    approvals: r.approvals || [],
  };
}

// map แถวจากไฟล์ "พนักงาน" -> employees (เฉพาะข้อมูลหลัก)
function mapEmployeeRow(r) {
  const g = (...keys) => { for (const k of keys) if (r[k] != null && r[k] !== '') return r[k]; return ''; };
  const code = String(g('รหัสพนักงาน', 'emp_code', 'Employee Code')).trim();
  return {
    emp_code: code ? code.padStart(4, '0') : '',
    prefix:        g('คำนำหน้า'),
    first_name:    g('ชื่อ', 'First Name'),
    last_name:     g('นามสกุล', 'Last Name'),
    first_name_en: g('ชื่อ(ภาษาอังกฤษ)', 'ชื่อภาษาอังกฤษ', 'First Name EN'),
    last_name_en:  g('นาม(สกุลภาษาอังกฤษ)', 'นามสกุลภาษาอังกฤษ', 'Last Name EN'),
    nickname:      g('ชื่อเล่น', 'Nickname'),
    national_id:   String(g('เลขที่บัตรประชาชน', 'เลขบัตรประชาชน') || ''),
    birth_date:    toDate(g('วัน/เดือน/ปีเกิด', 'วันเกิด')),
    phone:         String(g('เบอร์โทรศัพท์', 'Phone') || ''),
    email:         g('อีเมลส่วนตัว', 'อีเมล', 'Email'),
    department_name: g('แผนก', 'Department'),
    position_name:   g('ตำแหน่ง', 'Position'),
    status:        mapEmpStatus(g('สถานะพนักงาน', 'สถานะ')),
    start_date:    toDate(g('วันที่เริ่มงาน')),
    resign_date:   toDate(g('วันที่ลาออก')),
    probation_days: num0(g('ระยะเวลาทดลองงาน (วัน)', 'ระยะเวลาทดลองงาน')),
    probation_pass_date: toDate(g('วันที่ผ่านทดลองงาน')),
    salary_type:   mapSalaryType(g('ประเภทการคำนวณเงินเดือน')),
    payment_method:mapPayMethod(g('ช่องทางการจ่ายเงินเดือน')),
    base_salary:    num0(g('ฐานเงินเดือน', 'Salary', 'base_salary')),
    position_allow: num0(g('ค่าตำแหน่ง')),
    phone_allow:    num0(g('ค่าโทรศัพท์')),
    fuel_allow:     num0(g('ค่าน้ำมัน')),
    diligence_allow:num0(g('ค่าเบี้ยขยัน')),
    bank_name:    g('ธนาคาร', 'Bank'),
    bank_account: String(g('เลขบัญชี', 'Bank Account') || ''),
  };
}

// map แถวจากไฟล์ "เงินเดือน" -> ตัวแปรรับ/หักรายเดือน
function mapPayrollMonthly(r) {
  const g = (k) => num0(r[k]);
  return {
    'ค่าเบี้ยขยัน': g('ค่าเบี้ยขยัน'),
    'ค่ากะ':        g('ค่ากะ'),            // อัตราต่อวัน
    'ค่าล่วงเวลา':  g('ค่าล่วงเวลา'),       // OT
    'โบนัส':        g('โบนัส'),
    'ค่าคอมมิชชั่น':g('ค่าคอมมิชชั่น'),
    'ค่าอื่นๆ':     g('ค่าอื่นๆ'),
    'ลากิจ':        g('ลากิจ') || g('ลากิจ(วัน)'),   // จำนวนวันลากิจ
    'วันในเดือน':   g('วันในเดือน'),
    'ปกส.%':        g('ปกส.%') || g('ประกันสังคม%'),
    'หักกยศ.':      g('หักกยศ') || g('หักกยศ.'),
    'หักอื่นๆ':     g('หักอื่นๆ'),
  };
}

/* ---- export ไปยัง global ใช้ใน app.js ------------------------------------ */
window.NJ = { SUPABASE_CONFIG, USE_DEMO, Norm, Auth, Data, DEMO, sb };
