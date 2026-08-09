/* ============================================================
   Migration: njhr_db_v3 (localStorage) → Supabase  · รันซ้ำได้ (upsert ตาม primary key)
   วิธีใช้: เปิดแอปในเบราว์เซอร์ที่มีข้อมูลจริง → เปิด Console → วางไฟล์นี้ → migrate()
   ❗ สคริปต์นี้ยังไม่เคยรันจริงในสภาพแวดล้อมที่พัฒนา (ไม่มีการเชื่อมต่อ Supabase)
   ต้องรันบน staging และตรวจ log ให้ผ่านก่อนใช้กับข้อมูลจริง
   ============================================================ */
async function migrate(SUPABASE_URL, ANON_KEY, ACCESS_TOKEN) {
  const db = JSON.parse(localStorage.getItem('njhr_db_v3'));
  if (!db) throw new Error('ไม่พบข้อมูล njhr_db_v3 ในเครื่องนี้');
  // 1) สำรองก่อนเสมอ (ดาวน์โหลดเป็นไฟล์ + สำเนา read-only ใน localStorage)
  const backupKey = 'njhr_backup_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '');
  localStorage.setItem(backupKey, JSON.stringify(db));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], { type: 'application/json' }));
  a.download = backupKey + '.json'; a.click();
  const log = { backupKey, before: {}, after: {}, errors: [] };
  for (const k of ['departments','shifts','employees','users','leaveTypes','balances','leaves','notifications','audit','holidays'])
    log.before[k] = Array.isArray(db[k]) ? db[k].length : 0;

  const H = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + (ACCESS_TOKEN || ANON_KEY),
              'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' };
  const push = async (table, rows) => {
    for (let i = 0; i < rows.length; i += 500) {                    // batch 500 แถว
      const r = await fetch(SUPABASE_URL + '/rest/v1/' + table, { method: 'POST', headers: H, body: JSON.stringify(rows.slice(i, i + 500)) });
      if (!r.ok) log.errors.push(table + ' @' + i + ': ' + (await r.text()).slice(0, 200));
    }
  };
  // 2) แปลงชื่อฟิลด์ camelCase → snake_case แบบ 1:1 (ค่าไม่เปลี่ยน)
  await push('departments', db.departments.map(d => ({ id: d.id, name: d.name, active: d.active })));
  await push('shifts', (db.shifts||[]).map(s => ({ id: s.id, name: s.name, start_time: s.start, end_time: s.end,
    break_mins: s.breakMins, overnight: s.overnight, active: s.active, updated_at: s.updatedAt, updated_by: s.updatedBy })));
  await push('employees', db.employees.map(e => ({ id: e.id, code: e.code, title: e.title, first_name: e.firstName,
    last_name: e.lastName, nickname: e.nickname, gender: e.gender, dept_id: e.deptId, position: e.position,
    manager_id: e.managerId, hire_date: e.hireDate, status: e.status, emp_type: e.empType, phone: e.phone, email: e.email,
    shift: e.shift, shift_id: e.shiftId, base_salary: e.baseSalary, allowance: e.allowance, bank: e.bank, account: e.account })));
  await push('app_users', db.users.map(u => ({ id: u.id, username: u.username, role: u.role, emp_id: u.empId,
    active: u.active, last_login: u.lastLogin })));                  // ❗ ไม่ย้าย password — ใช้ Supabase Auth แทน
  await push('leave_types', db.leaveTypes.map(t => ({ id: t.id, name: t.name, quota: t.quota, need_doc: t.needDoc, active: t.active, color: t.color })));
  await push('leave_balances', db.balances.map(b => ({ emp_id: b.empId, type_id: b.typeId, year: b.year, quota: b.quota, used: b.used })));
  await push('leaves', db.leaves.map(l => ({ id: l.id, emp_id: l.empId, type_id: l.typeId, mode: l.mode,
    start_date: l.startDate, end_date: l.endDate, days: l.days, hours: l.hours, reason: l.reason, file: l.file,
    delegate: l.delegate, status: l.status, created_at: l.createdAt, idempotency_key: 'migrated:' + l.id })));
  const tl = [];
  db.leaves.forEach(l => (l.timeline || []).forEach(t => tl.push({ leave_id: l.id, at: t.at, by_name: t.by, action: t.action, note: t.note })));
  await push('leave_timeline', tl);
  await push('notifications', db.notifications.map(n => ({ id: n.id, user_id: n.userId, title: n.title, body: n.body, link: n.link, read: n.read, at: n.at })));
  await push('audit_log', db.audit.map(x => ({ at: x.at, by_name: x.by, action: x.action, detail: x.detail })));
  await push('holidays', db.holidays.map(h => ({ date: h.date, name: h.name })));

  // 3) ตรวจจำนวนหลังย้าย + ความสัมพันธ์
  const count = async (t) => {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + t + '?select=*', { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
    return Number((r.headers.get('content-range') || '/0').split('/')[1]);
  };
  for (const [k, t] of [['departments','departments'],['employees','employees'],['users','app_users'],
    ['leaveTypes','leave_types'],['balances','leave_balances'],['leaves','leaves'],['notifications','notifications']])
    log.after[t] = await count(t);
  log.timelineRows = tl.length;
  log.ok = log.errors.length === 0 && log.after.leaves >= log.before.leaves && log.after.employees >= log.before.employees;
  console.table(log.before); console.table(log.after);
  console.log(log.ok ? '✅ Migration ผ่าน — ตรวจจำนวนตรงแล้ว' : '❌ ไม่ผ่าน: ' + log.errors.join(' | '));
  localStorage.setItem('njhr_migration_log', JSON.stringify(log));
  return log;   // ยังไม่ลบ localStorage — เก็บเป็น backup อ่านอย่างเดียวจนกว่าจะตรวจครบ
}
