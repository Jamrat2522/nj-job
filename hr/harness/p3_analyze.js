/* p3_analyze.js — วิเคราะห์การอ้างอิงระดับ "สัญลักษณ์" ในไฟล์ src/ เพื่อหาขอบเขต chunk ที่แยกได้จริง
   ใช้: node harness/p3_analyze.js [seedGroupJson]
   ไม่แก้ไฟล์ใด ๆ — อ่านอย่างเดียว */
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const CORE_FILES = ['01-core-icons-utils.js', '02-store.js', '03-ui-toast-modal.js', '04-router-guards.js',
  '05-layout-shell.js', '06-auth-supabase.js', '06-core-shared-boot.js'];
const DASH_FILES = ['07-view-dashboard.js'];
const COMPAT_FILES = ['08-view-employees.js', '09-view-attendance.js', '10-view-requests-leave-ot.js',
  '11-view-approvals-payroll.js', '12-view-reports-settings.js', '13-view-admin-users.js',
  '14-view-profile-hrdocs.js', '15-view-salary-merge-boot.js'];

function symbolsOf(file) {
  const s = fs.readFileSync(path.join(SRC, file), 'utf8');
  const out = [];
  const marks = [];
  let m, re = /^  (function\s+([A-Za-z_$][\w$]*)\s*\(|var\s+)/gm;
  while ((m = re.exec(s))) marks.push({ i: m.index, name: m[2], isVar: !m[2] });
  for (let k = 0; k < marks.length; k++) {
    const a = marks[k].i, b = k + 1 < marks.length ? marks[k + 1].i : s.length;
    const block = s.slice(a, b);
    if (marks[k].name) out.push({ name: marks[k].name, kind: 'fn', file, a, b, block });
    else {
      const head = block.split('\n')[0];
      const names = [];
      let d = 0, buf = '';
      for (const ch of head.replace(/^  var\s+/, '')) {
        if ('([{'.indexOf(ch) >= 0) d++; else if (')]}'.indexOf(ch) >= 0) d--;
        if (d === 0 && (ch === ',' || ch === '=' || ch === ';')) { names.push(buf.trim()); buf = ''; if (ch !== ',') break; }
        else if (d === 0) buf += ch;
      }
      if (buf.trim()) names.push(buf.trim());
      names.filter(n => /^[A-Za-z_$][\w$]*$/.test(n)).forEach((n, idx) =>
        out.push({ name: n, kind: 'var', file, a, b: idx === 0 ? b : a, block: idx === 0 ? block : '' }));
    }
  }
  return out;
}

const ALL = {};
const ORDER = [];
[...CORE_FILES, ...DASH_FILES, ...COMPAT_FILES].forEach(f => symbolsOf(f).forEach(s => {
  if (!ALL[s.name]) { ALL[s.name] = s; ORDER.push(s.name); }
}));
const isCore = n => CORE_FILES.indexOf(ALL[n].file) >= 0;
const isDash = n => DASH_FILES.indexOf(ALL[n].file) >= 0;
const isCompat = n => COMPAT_FILES.indexOf(ALL[n].file) >= 0;

// กราฟการอ้างอิง: sym -> set(sym อื่นที่มันเรียก)  (นับเฉพาะ symbol ที่อยู่ใน compat/dash)
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const EDGE = {};
ORDER.forEach(n => {
  if (isCore(n)) return;
  const body = stripComments(ALL[n].block || '');
  const set = new Set();
  ORDER.forEach(t => {
    if (t === n || isCore(t)) return;
    if (new RegExp('(?<![\\w$.\\-])' + t.replace(/\$/g, '\\$') + '(?![\\w$])').test(body)) set.add(t);
  });
  EDGE[n] = set;
});
// กราฟย้อนกลับ
const RDEP = {};
Object.keys(EDGE).forEach(n => EDGE[n].forEach(t => { (RDEP[t] = RDEP[t] || new Set()).add(n); }));

module.exports = { ALL, ORDER, EDGE, RDEP, isCore, isDash, isCompat, CORE_FILES, DASH_FILES, COMPAT_FILES };

if (require.main === module) {
  const seedsArg = process.argv[2];
  if (!seedsArg) {
    // โหมดสำรวจ: สรุปจำนวน symbol และ byte ต่อไฟล์
    const byFile = {};
    ORDER.forEach(n => {
      const f = ALL[n].file; byFile[f] = byFile[f] || { n: 0, b: 0 };
      byFile[f].n++; byFile[f].b += (ALL[n].block || '').length;
    });
    console.log('ไฟล์'.padEnd(34) + 'symbol'.padStart(8) + 'bytes'.padStart(10));
    Object.keys(byFile).sort().forEach(f => console.log(f.padEnd(34) + String(byFile[f].n).padStart(8) + String(byFile[f].b).padStart(10)));
    process.exit(0);
  }
  const groups = JSON.parse(fs.readFileSync(seedsArg, 'utf8'));
  // ปิด transitive closure ของแต่ละกลุ่มจาก seed
  const owner = {};
  const closure = {};
  Object.keys(groups).forEach(g => {
    const seen = new Set(), q = [...groups[g]];
    while (q.length) {
      const n = q.pop();
      if (!ALL[n]) { console.log('  !! ไม่พบ symbol: ' + n + ' (' + g + ')'); continue; }
      if (seen.has(n) || isCore(n)) continue;
      seen.add(n);
      (EDGE[n] || new Set()).forEach(t => { if (!seen.has(t) && !isCore(t)) q.push(t); });
    }
    closure[g] = seen;
  });
  // symbol ที่อยู่ใน closure มากกว่า 1 กลุ่ม = ต้องไป shared
  const count = {};
  Object.keys(closure).forEach(g => closure[g].forEach(n => { (count[n] = count[n] || []).push(g); }));
  const shared = Object.keys(count).filter(n => count[n].length > 1);
  console.log('\n=== ผลปิด transitive closure ===');
  Object.keys(closure).forEach(g => {
    const only = [...closure[g]].filter(n => count[n].length === 1);
    const b = only.reduce((a, n) => a + (ALL[n].block || '').length, 0);
    console.log('  ' + g.padEnd(22) + 'เฉพาะกลุ่มนี้ ' + String(only.length).padStart(4) + ' symbol  ' + String(b).padStart(8) + ' B');
  });
  const sb = shared.reduce((a, n) => a + (ALL[n].block || '').length, 0);
  console.log('  ' + 'SHARED (>1 กลุ่ม)'.padEnd(22) + String(shared.length).padStart(17) + ' symbol  ' + String(sb).padStart(8) + ' B');
  console.log('\n=== SHARED SYMBOLS ===');
  shared.sort().forEach(n => console.log('  ' + ALL[n].kind.padEnd(3) + ' ' + n.padEnd(26) + ALL[n].file.slice(0, 2) + '  ใช้โดย: ' + count[n].join(',')));
  // symbol ที่ไม่อยู่ใน closure ใดเลย = ยังอยู่ compat
  const rest = ORDER.filter(n => isCompat(n) && !count[n]);
  const rb = rest.reduce((a, n) => a + (ALL[n].block || '').length, 0);
  console.log('\n=== เหลือใน COMPAT: ' + rest.length + ' symbol · ' + rb + ' B ===');
  // ตรวจว่า compat ที่เหลืออ้าง symbol ในกลุ่มที่แยกออกไปหรือไม่
  const back = [];
  rest.forEach(n => (EDGE[n] || new Set()).forEach(t => {
    if (count[t] && count[t].length === 1) back.push([n, t, count[t][0]]);
  }));
  console.log('\n=== COMPAT ยังอ้าง symbol ที่ย้ายออก (' + back.length + ' เส้น) ===');
  const agg = {};
  back.forEach(([a, b2, g]) => { agg[b2] = agg[b2] || { g, from: new Set() }; agg[b2].from.add(a); });
  Object.keys(agg).sort().forEach(t => console.log('  ' + t.padEnd(26) + '(' + agg[t].g + ')  ถูกเรียกจาก: ' + [...agg[t].from].slice(0, 6).join(',')));
}
