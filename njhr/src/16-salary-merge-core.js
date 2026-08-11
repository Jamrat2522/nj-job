/* ============================================================
   16-salary-merge-core.js — ตัวช่วยของ "รวมเงินเดือน" (ย้ายมาจาก 14 ตามที่เดิมทุกบรรทัด)
   แยกออกมาเพื่อให้ 14 (โปรไฟล์ + เอกสารของฉัน) แยกเป็น Lazy Module ของตัวเองได้
   ยังอยู่ใน chunk compatibility เหมือนเดิม คู่กับ 15-view-salary-merge-boot.js
   ไม่มีการแก้ตรรกะใด ๆ ในบล็อกนี้
   ============================================================ */
  /* ================= VIEW: SALARY MERGE (รวมเงินเดือน) ================= */
  // v2: Master ฝังมีหัวข้อ Q-AA ครบ 11 หัวข้อ + แถวรวม 116 อยู่แล้ว
  // ระบบอ่านหัวข้อจริงจาก Master → ตรวจลำดับ → เขียนค่าตามชื่อหัวข้อ (ไม่ hardcode ตำแหน่ง)
  // กรองข้อมูลตามเดือนเป้าหมายจากไฟล์สรุปเวลา / จับคู่รหัส 2 ชั้น + ตรวจชื่อ / กันรายการซ้ำข้ามชีต
  var SM = { timeFile: null, leaveFile: null };
  var SM_APPROVED = 'อนุมัติแล้ว';
  var SM_START_MIN = 8 * 60 + 30; // เวลาเริ่มงานมาตรฐาน 08:30
  var SM_KEYS = ['การลาหยุด', 'ทำงานล่วงเวลา', 'ลงชื่อย้อนหลัง', 'ลากิจ', 'ลาออก'];

  function smLoadLibs() {
    // ใช้ตัวโหลดกลาง — โหลดพร้อมกันได้เพราะไม่ขึ้นต่อกัน · เรียกซ้ำไม่โหลดซ้ำ
    return Promise.all([
      loadScriptOnce('xlsx', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX'),
      loadScriptOnce('jszip', 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip')
    ]);
  }

  /* ---------- utils ---------- */
  function smStr(v) { return v == null ? '' : String(v).trim(); }
  function smNum(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function smRnd(n) { return Math.round(n * 10000) / 10000; }
  function smRnd2(n) { return Math.round(Number((n * 100).toPrecision(12))) / 100; } // ปัดเชิงทศนิยม กันเคสครึ่งสตางค์เพี้ยนจาก float
  function smIsPure(raw) { return /^\s*\d+\s*$/.test(String(raw)); }
  function smDigits(raw) {
    var m = /^\s*(\d+)/.exec(String(raw));
    if (!m) return '';
    var d = m[1];
    return d.length < 4 ? ('0000' + d).slice(-4) : d;
  }
  function smNameKey(s) {
    return smStr(s).replace(/^(นางสาว|นาย|นาง|นส\.?|ดร\.?)\s*/, '').replace(/[\s.]+/g, '');
  }
  function smDISO(v) {
    var s = String(v == null ? '' : v);
    var m = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return m[0];
    m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return '';
  }
  function smNextDay(iso) {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------- การจับคู่รหัสพนักงาน 2 ชั้น (ต่อไฟล์) ---------- */
  // ชั้น 1: รหัสตรงตัว (คงเลขศูนย์นำหน้า) / ชั้น 2: รหัสมีอักขระท้าย เช่น "0410*" ใช้ได้เมื่อ
  // ไม่มีรหัสตรงตัวเดียวกันในไฟล์นั้น + เป็นรายการเดียว + ชื่อตรงกับ Master — ไม่งั้นข้าม+เตือน
  function smMakeResolver(pairs, label, out) {
    var exact = {}, junk = {}, cache = {};
    pairs.forEach(function (p) {
      var raw = smStr(p[0]);
      if (!raw) return;
      var d = smDigits(raw);
      if (!d) return;
      if (smIsPure(raw)) (exact[d] = exact[d] || {})[raw] = 1;
      else (junk[d] = junk[d] || {})[raw] = smStr(p[1]);
    });
    return function (rawV, nameV) {
      var raw = smStr(rawV);
      if (cache.hasOwnProperty(raw)) return cache[raw];
      var res = null;
      var d = smDigits(raw);
      if (smIsPure(raw)) {
        if (d && window.SALARY_MASTER.codes[d]) res = d;
        else if (d) out.warnings.push(label + ': รหัส ' + d + ' ไม่มีใน Master (ข้าม ไม่เพิ่มรายชื่อ)');
      } else if (d) {
        if (exact[d]) {
          out.warnings.push(label + ': "' + raw + '" เป็นคนละรายการกับ ' + d + ' (มีรหัสตรงตัวอยู่แล้ว) — ไม่รวมกัน');
        } else if (window.SALARY_MASTER.codes[d] && Object.keys(junk[d] || {}).length === 1 &&
          smNameKey(window.SALARY_MASTER.codes[d].n).indexOf(smNameKey(nameV)) >= 0) {
          out.notes.push(label + ': จับคู่สำรอง "' + raw + '" → ' + d + ' (ชื่อตรงกับ Master)');
          res = d;
        } else {
          out.warnings.push(label + ': จับคู่ "' + raw + '" ไม่ได้อย่างมั่นใจ — ข้ามรายการ');
        }
      }
      cache[raw] = res;
      return res;
    };
  }

  /* ---------- คำนวณ ---------- */
  function smCompute(timeAoA, leaveSheets) {
    var out = { T: {}, warnings: [], notes: [], filtered: { back: 0, ot: 0, otHours: 0, leave: 0, prorate: 0, dup: 0 } };
    function ent(c) {
      if (!out.T[c]) out.T[c] = { absIn: 0, absOut: 0, noSign: 0, late: 0, lateN: 0, ot: 0, back: 0, S: 0, Tk: 0, U: 0, V: 0,
        dt: { absIn: [], absOut: [], late: [], ot: [], back: [], S: {}, Tk: {}, U: {}, V: {} } };
      return out.T[c];
    }

    // ---- ไฟล์สรุปเวลา + เดือนเป้าหมายจากหัวคอลัมน์วันที่
    var hdr = (timeAoA[0] || []).map(smStr);
    var codeC = hdr.indexOf('รหัสพนักงาน');
    var nameC = hdr.indexOf('ชื่อ');
    if (codeC < 0) throw new Error('ไฟล์สรุปเวลาไม่พบหัวคอลัมน์ "รหัสพนักงาน"');
    var inCs = [], outCs = [], monthCnt = {};
    hdr.forEach(function (h, i) {
      if (h.indexOf('【in】') >= 0) inCs.push(i);
      else if (h.indexOf('【out】') >= 0) outCs.push(i);
      var m = /(\d{4})-(\d{2})-\d{2}/.exec(h);
      if (m) { var ym = m[1] + '-' + m[2]; monthCnt[ym] = (monthCnt[ym] || 0) + 1; }
    });
    if (!inCs.length || !outCs.length) throw new Error('ไฟล์สรุปเวลาไม่พบคอลัมน์เวลา 【in】/【out】');
    var target = Object.keys(monthCnt).sort(function (a, b) { return monthCnt[b] - monthCnt[a]; })[0];
    if (!target) throw new Error('อ่านเดือนเป้าหมายจากหัวคอลัมน์ไฟล์สรุปเวลาไม่ได้');
    var ty = parseInt(target.slice(0, 4), 10), tm = parseInt(target.slice(5, 7), 10);
    var mStart = target + '-01';
    var mEnd = target + '-' + ('0' + new Date(ty, tm, 0).getDate()).slice(-2);
    out.monthStart = mStart; out.monthEnd = mEnd;
    function inMonth(d) { return !!d && d >= mStart && d <= mEnd; }

    var resolveT = smMakeResolver(timeAoA.slice(1).map(function (r) { return [(r || [])[codeC], (r || [])[nameC]]; }), 'ไฟล์สรุปเวลา', out);
    var colDate = {};
    hdr.forEach(function (h, i) {
      var m = /(\d{4})-(\d{2})-(\d{2})/.exec(h);
      if (m) colDate[i] = m[0];
    });
    var timeRe = /(\d{1,2}):(\d{2})(?::\d{2})?\s*$/;
    for (var r = 1; r < timeAoA.length; r++) {
      var row = timeAoA[r] || [];
      var code = resolveT(row[codeC], row[nameC]);
      if (!code) continue;
      var e = ent(code);
      inCs.forEach(function (c) {
        var s = smStr(row[c]);
        if (s === 'ขาดงาน') { e.absIn++; if (colDate[c]) e.dt.absIn.push(colDate[c]); }
        else if (s === 'ไม่จำเป็นต้องลงชื่อเข้างาน') e.noSign++; // นับแยก ไม่รวมกับขาดงานเข้า
        else if (s.indexOf('มาสาย') === 0) {
          e.lateN++; // จำนวนครั้งมาสาย (สำหรับชีตรายละเอียด)
          if (colDate[c]) e.dt.late.push(colDate[c]);
          var m = timeRe.exec(s);
          if (m) e.late += Math.max(0, parseInt(m[1], 10) * 60 + parseInt(m[2], 10) - SM_START_MIN);
        }
      });
      outCs.forEach(function (c) {
        if (smStr(row[c]) === 'ขาดงาน') { e.absOut++; if (colDate[c]) e.dt.absOut.push(colDate[c]); }
      });
    }

    // ---- ไฟล์ลา: รวบรวมคู่รหัส-ชื่อทุกชีตก่อน แล้วประมวลผลพร้อมกรองเดือน + กันซ้ำ
    var lp = [];
    Object.keys(leaveSheets).forEach(function (sn) {
      var aoa = leaveSheets[sn];
      var hi = -1, h = null;
      for (var i = 0; i < aoa.length; i++) {
        var cells = (aoa[i] || []).map(smStr);
        if (cells.indexOf('สถานะการอนุมัติ') >= 0) { hi = i; h = cells; break; }
      }
      if (hi >= 0) {
        var ci = h.indexOf('รหัสพนักงานผู้ยื่นขอ'), ni = h.indexOf('ชื่อ-นามสกุล ผู้ยื่นขอ');
        for (var r2 = hi + 1; r2 < aoa.length; r2++) {
          var rr = aoa[r2] || [];
          if (ci >= 0 && rr[ci] != null) lp.push([rr[ci], ni >= 0 ? rr[ni] : '']);
        }
      } else {
        for (var r3 = 0; r3 < aoa.length; r3++) {
          var sv = (aoa[r3] || []).map(smStr);
          var idx = -1;
          for (var j = 0; j < sv.length; j++) if (SM_KEYS.indexOf(sv[j]) >= 0) { idx = j; break; }
          if (idx < 0) continue;
          for (var k = 0; k < sv.length; k++) if (k !== idx && /^\d{2,4}$/.test(sv[k])) { lp.push([sv[k], sv[1] || '']); break; }
        }
      }
    });
    var resolveL = smMakeResolver(lp, 'ไฟล์ลา', out);

    var seen = {};
    function dedupe(at, rid) {
      rid = smStr(rid).replace(/\.0$/, '');
      if (!rid) return true;
      var key = at + '|' + rid;
      if (seen[key]) { out.filtered.dup++; return false; }
      seen[key] = 1;
      return true;
    }
    // ลาข้ามเดือน: นับเฉพาะส่วนที่อยู่ในเดือนเป้าหมาย (แบ่งครึ่งวันเช้า/บ่าย เทียบสัดส่วนกับจำนวนวันในไฟล์)
    // คืนทั้งจำนวนวันและรายการวันที่ในเดือน (สำหรับ Sheet รวมลา)
    function leaveInMonth(sv2, ev2, fd) {
      var sd = smDISO(sv2), sh = String(sv2).indexOf('บ่าย') >= 0 ? 'PM' : 'AM';
      var ed = smDISO(ev2), eh = String(ev2).indexOf('บ่าย') >= 0 ? 'PM' : 'AM';
      if (!sd) return { days: fd, dates: [] };
      if (!ed) { ed = sd; eh = 'PM'; }
      var full = sd >= mStart && ed <= mEnd; // อยู่ในเดือนทั้งรายการ → ใช้ค่าในไฟล์
      var total = 0, inm = 0, d = sd, guard = 0, dates = [];
      while (d <= ed && guard++ < 400) {
        var s2 = 2;
        if (d === sd && sh === 'PM') s2 -= 1;
        if (d === ed && eh === 'AM') s2 -= 1;
        total += s2 / 2;
        if (inMonth(d) && s2 > 0) { inm += s2 / 2; dates.push(d); }
        d = smNextDay(d);
      }
      return { days: full ? fd : smRnd(inm * (total ? fd / total : 0)), dates: dates };
    }
    function addLeave(e, lt, d, dates) {
      var k = lt === 'ลากิจ' ? 'S' : lt === 'ลาพักร้อน' ? 'Tk' : lt === 'ลาป่วย' ? 'U' : 'V'; // ลาอื่น = ประเภทอื่นทั้งหมด
      e[k] += d;
      (dates || []).forEach(function (x) { e.dt[k][x] = 1; });
    }

    Object.keys(leaveSheets).forEach(function (sn) {
      var aoa = leaveSheets[sn];
      var hi = -1, h = null;
      for (var i = 0; i < aoa.length; i++) {
        var cells = (aoa[i] || []).map(smStr);
        if (cells.indexOf('สถานะการอนุมัติ') >= 0) { hi = i; h = cells; break; }
      }
      if (hi >= 0) {
        var col = function (n) { return h.indexOf(n); };
        var ciCode = col('รหัสพนักงานผู้ยื่นขอ'), ciSt = col('สถานะการอนุมัติ'), ciAt = col('ประเภทการอนุมัติ');
        var ciId = col('หมายเลขการอนุมัติ') >= 0 ? col('หมายเลขการอนุมัติ') : col('หมายเลข');
        var ciNm = col('ชื่อ-นามสกุล ผู้ยื่นขอ');
        var ciLt = col('ประเภทการลางาน'), ciDays = col('จำนวนวัน'), ciOt = col('ทำงานล่วงเวลา(ชั่วโมง)');
        var ciOtD = col('วันที่ทำงานล่วงเวลา'), ciBkD = col('วันที่ลงชื่อย้อนหลัง');
        var ciOtS = col('เวลาเริ่ม'), ciOtE = col('เวลาสิ้นสุด'), ciOtT = col('ประเภทการทำงานล่วงเวลา');
        var ciLs = col('เวลาเริ่มต้นการลา'), ciLe = col('เวลาสิ้นสุดการลา');
        var ciDur = col('ระยะเวลา (หน่วย)'), ciHs = col('เริ่มต้น');
        for (var r2 = hi + 1; r2 < aoa.length; r2++) {
          var row2 = aoa[r2] || [];
          if (ciCode < 0 || row2[ciCode] == null) continue;
          if (smStr(row2[ciSt]) !== SM_APPROVED) continue; // นับเฉพาะอนุมัติแล้ว
          var at = ciAt >= 0 ? smStr(row2[ciAt]) : '';
          if (!dedupe(at, ciId >= 0 ? row2[ciId] : '')) continue;
          var code2 = resolveL(row2[ciCode], ciNm >= 0 ? row2[ciNm] : '');
          if (!code2) continue;
          var e2 = ent(code2);
          if (at === 'ลงชื่อย้อนหลัง') {
            var bd = ciBkD >= 0 ? smDISO(row2[ciBkD]) : '';
            if (inMonth(bd)) { e2.back++; e2.dt.back.push(bd); }
            else out.filtered.back++;
          } else if (at === 'ทำงานล่วงเวลา') {
            var od = ciOtD >= 0 ? smDISO(row2[ciOtD]) : '';
            var oh = ciOt >= 0 ? smNum(row2[ciOt]) : 0;
            if (inMonth(od)) {
              e2.ot += oh;
              e2.dt.ot.push({ d: od, h: oh,
                st: ciOtS >= 0 ? smStr(row2[ciOtS]) : '', en: ciOtE >= 0 ? smStr(row2[ciOtE]) : '',
                tp: ciOtT >= 0 ? smStr(row2[ciOtT]) : '' });
            }
            else { out.filtered.ot++; out.filtered.otHours += oh; }
          } else if (at === 'การลาหยุด') {
            var fd = ciDays >= 0 ? smNum(row2[ciDays]) : 0;
            var lv = ciLs >= 0 ? leaveInMonth(row2[ciLs], ciLe >= 0 ? row2[ciLe] : '', fd) : { days: fd, dates: [] };
            if (Math.abs(lv.days - fd) > 1e-9) { if (lv.days > 0) out.filtered.prorate++; else out.filtered.leave++; }
            if (lv.days > 0) addLeave(e2, ciLt >= 0 ? smStr(row2[ciLt]) : '', lv.days, lv.dates);
          } else if (at === 'ลากิจ') {
            var hd = ciHs >= 0 ? smDISO(row2[ciHs]) : '';
            var hv = (ciDur >= 0 ? smNum(row2[ciDur]) : 0) / 8;
            if (inMonth(hd)) addLeave(e2, 'ลากิจ', hv, hd ? [hd] : []);
            else out.filtered.leave++;
          }
        }
      } else {
        // ชีตไม่มีหัวตาราง: ตำแหน่งอิงคำประเภทการอนุมัติ (สถานะ=ช่องถัดไป, ประเภทลา=+4, จำนวนวัน=+5, เริ่ม=+7, สิ้นสุด=+8)
        for (var r4 = 0; r4 < aoa.length; r4++) {
          var sv2 = (aoa[r4] || []).map(smStr);
          var idx2 = -1;
          for (var j2 = 0; j2 < sv2.length; j2++) if (SM_KEYS.indexOf(sv2[j2]) >= 0) { idx2 = j2; break; }
          if (idx2 < 0 || idx2 + 1 >= sv2.length || sv2[idx2 + 1] !== SM_APPROVED) continue;
          var at2 = sv2[idx2];
          if (!dedupe(at2, sv2[0])) continue;
          var cr = '';
          for (var k2 = 0; k2 < sv2.length; k2++) if (k2 !== idx2 && /^\d{2,4}$/.test(sv2[k2])) { cr = sv2[k2]; break; }
          var code3 = resolveL(cr, sv2[1] || '');
          if (!code3) continue;
          if (at2 === 'การลาหยุด') {
            var fd2 = smNum((aoa[r4] || [])[idx2 + 5]);
            var lv2 = leaveInMonth(sv2[idx2 + 7] || '', sv2[idx2 + 8] || '', fd2);
            if (Math.abs(lv2.days - fd2) > 1e-9) { if (lv2.days > 0) out.filtered.prorate++; else out.filtered.leave++; }
            if (lv2.days > 0) addLeave(ent(code3), sv2[idx2 + 4] || '', lv2.days, lv2.dates);
          }
        }
      }
    });
    return out;
  }

  /* ---------- อ่าน+ตรวจหัวข้อจริงจาก Master (ห้าม hardcode ตำแหน่ง) ---------- */
  function smReadMasterHeaders(sheetXml, sharedXml) {
    var sis = sheetXml && sharedXml ? (sharedXml.match(/<si>[\s\S]*?<\/si>/g) || []) : [];
    var texts = sis.map(function (si) {
      return (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map(function (t) {
        return t.replace(/<t[^>]*>/, '').replace('</t>', '');
      }).join('');
    });
    var M = window.SALARY_MASTER;
    var map = {};
    for (var i = 0; i < M.letters.length; i++) {
      var L = M.letters[i];
      var m = new RegExp('<c r="' + L + '1"[^>]*t="s"[^>]*><v>(\\d+)</v></c>').exec(sheetXml);
      if (!m) throw new Error('Master ไม่พบหัวข้อที่ช่อง ' + L + '1');
      var txt = texts[parseInt(m[1], 10)];
      if (txt !== M.headers[i]) {
        throw new Error('หัวข้อ Master ไม่ตรงที่คาด: ' + L + '1 = "' + txt + '" ต้องเป็น "' + M.headers[i] + '" — หยุดการ Export');
      }
      map[M.headers[i]] = L;
    }
    return map; // ชื่อหัวข้อ → คอลัมน์
  }

  /* ---------- styles: เพิ่ม numFmt "0.#" + xf จำนวนเต็ม/ครึ่งวัน (clone จาก xf 15 เดิมของ Q..AA) ---------- */
  function smPatchStylesXml(xml) {
    var nm = /<numFmts count="(\d+)">([\s\S]*?)<\/numFmts>/.exec(xml);
    if (!nm) throw new Error('Master styles.xml ไม่พบ numFmts');
    var maxId = 163;
    (nm[2].match(/numFmtId="(\d+)"/g) || []).forEach(function (x) {
      maxId = Math.max(maxId, parseInt(x.replace(/\D/g, ''), 10));
    });
    var halfFmtId = maxId + 1; // custom "0.#" — 0.5 แสดง 0.5
    var hoursFmtId = maxId + 2; // ชั่วโมง OT ทศนิยม ≤2 ตำแหน่ง
    var moneyM = /<numFmt formatCode="#,##0\.00" numFmtId="(\d+)"\/>/.exec(nm[2]);
    var moneyFmtId = moneyM ? parseInt(moneyM[1], 10) : maxId + 3; // จำนวนเงิน (ใช้ของเดิมถ้ามี)
    xml = xml.replace(nm[0], '<numFmts count="' + (parseInt(nm[1], 10) + (moneyM ? 2 : 3)) + '">' + nm[2] +
      '<numFmt formatCode="0.#" numFmtId="' + halfFmtId + '"/>' +
      '<numFmt formatCode="0.##" numFmtId="' + hoursFmtId + '"/>' +
      (moneyM ? '' : '<numFmt formatCode="#,##0.00" numFmtId="' + moneyFmtId + '"/>') + '</numFmts>');

    var m = /<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/.exec(xml);
    if (!m) throw new Error('Master styles.xml ไม่พบ cellXfs');
    var count = parseInt(m[1], 10);
    var xfs = m[2].match(/<xf\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/xf>)/g) || [];
    if (xfs.length !== count || count <= 15) throw new Error('โครงสร้าง cellXfs ของ Master ผิดจากที่คาด');
    function clone(fmtId) {
      return xfs[15]
        .replace(/numFmtId="\d+"/, 'numFmtId="' + fmtId + '"')
        .replace(/applyProtection=/, 'applyNumberFormat="true" applyProtection=');
    }
    // style สำหรับ Sheet รวมลา: รูปแบบเดิม (Cordia New 16 + กรอบ 4 ด้าน) เปิด Wrap Text ชิดซ้าย-บน
    var wrapClone = xfs[15]
      .replace(/horizontal="center"/, 'horizontal="left"')
      .replace(/vertical="center"/, 'vertical="top"')
      .replace(/wrapText="false"/, 'wrapText="true"')
      .replace(/shrinkToFit="true"/, 'shrinkToFit="false"');
    // สีหัวตารางชีตรายละเอียด: พนักงาน(น้ำเงินอ่อน) ขาดงาน(แดงอ่อน) การทำงาน(ส้มอ่อน) การลา(เขียวอ่อน)
    var mf = /<fills count="(\d+)">([\s\S]*?)<\/fills>/.exec(xml);
    if (!mf) throw new Error('Master styles.xml ไม่พบ fills');
    var fillBase = parseInt(mf[1], 10);
    var FILL_COLORS = ['FFD9E1F2', 'FFF4CCCC', 'FFFCE4D6', 'FFE2EFDA', 'FFDDEBF7'];
    xml = xml.replace(mf[0], '<fills count="' + (fillBase + 5) + '">' + mf[2] + FILL_COLORS.map(function (c) {
      return '<fill><patternFill patternType="solid"><fgColor rgb="' + c + '"/></patternFill></fill>';
    }).join('') + '</fills>');
    var hdrFontM = /fontId="(\d+)"/.exec(xfs[6]);
    var hdrFont = hdrFontM ? hdrFontM[1] : '7'; // ฟอนต์หัวตารางเดิม (Cordia New 16 หนา)
    function hdrXf(fillId) {
      return '<xf numFmtId="164" fontId="' + hdrFont + '" fillId="' + fillId + '" borderId="1" xfId="0" ' +
        'applyFont="true" applyFill="true" applyBorder="true" applyAlignment="true" applyProtection="false">' +
        '<alignment horizontal="center" vertical="center" textRotation="0" wrapText="true" indent="0" shrinkToFit="false"/></xf>';
    }
    xml = xml.replace(m[0], '<cellXfs count="' + (count + 10) + '">' + m[2] + clone(1) + clone(halfFmtId) + wrapClone +
      clone(hoursFmtId) + clone(moneyFmtId) +
      hdrXf(fillBase) + hdrXf(fillBase + 1) + hdrXf(fillBase + 2) + hdrXf(fillBase + 3) + hdrXf(fillBase + 4) + '</cellXfs>');
    return {
      xml: xml, intIdx: count, halfIdx: count + 1, wrapIdx: count + 2, hoursIdx: count + 3, moneyIdx: count + 4,
      hdr: { emp: count + 5, abs: count + 6, work: count + 7, leave: count + 8, blue: count + 9 }
    };
  }

  /* ---------- เขียนค่าลง sheet ตามชื่อหัวข้อ + อัปเดตค่าแคชแถวรวม ---------- */
  function smValuesOf(e) {
    e = e || { absIn: 0, absOut: 0, noSign: 0, late: 0, ot: 0, back: 0, S: 0, Tk: 0, U: 0, V: 0 };
    return {
      'ขาดงานเข้า': e.absIn, 'ขาดงานออก': e.absOut, 'ไม่จำเป็นต้องลงชื่อเข้างาน': e.noSign,
      'สายกี่นาที': e.late, 'ทำงานล่วงเวลา': smRnd2(e.otMoney || 0), 'ลงชื่อย้อนหลัง': e.back,
      'ลากี่วัน': smRnd(e.S + e.Tk + e.U + e.V), 'ลากิจ': smRnd(e.S), 'ลาพักร้อน': smRnd(e.Tk),
      'ลาป่วย': smRnd(e.U), 'ลาอื่น': smRnd(e.V)
    };
  }
  var SM_INT_HEADERS = ['ลงชื่อย้อนหลัง'];                                  // จำนวนรายการ → "0"
  var SM_DAY_HEADERS = ['ลากี่วัน', 'ลากิจ', 'ลาพักร้อน', 'ลาป่วย', 'ลาอื่น']; // วันลา → เต็ม "0" / ครึ่ง "0.#"

  function smPatchSheetXml(xml, headerMap, T, styleIdx) {
    var M = window.SALARY_MASTER;
    var totals = {};
    M.headers.forEach(function (hName) { totals[hName] = 0; });
    Object.keys(M.codes).forEach(function (code) {
      var row = M.codes[code].r;
      var vals = smValuesOf(T[code]);
      M.headers.forEach(function (hName) {
        var L = headerMap[hName];
        var v = vals[hName];
        totals[hName] += v;
        var sIdx = null;
        if (hName === 'ทำงานล่วงเวลา') sIdx = styleIdx.moneyIdx; // เงิน OT รวมจากชีต 4 (#,##0.00)
        else if (SM_INT_HEADERS.indexOf(hName) >= 0) sIdx = styleIdx.intIdx;
        else if (SM_DAY_HEADERS.indexOf(hName) >= 0) sIdx = (v === Math.round(v)) ? styleIdx.intIdx : styleIdx.halfIdx;
        var ref = L + row;
        var re = new RegExp('<c r="' + ref + '"([^>]*?)/>');
        if (!re.test(xml)) throw new Error('ไม่พบช่องว่าง ' + ref + ' ใน Master');
        xml = xml.replace(re, function (all, attrs) {
          if (sIdx != null) attrs = attrs.replace(/s="\d+"/, 's="' + sIdx + '"');
          return '<c r="' + ref + '"' + attrs + ' t="n"><v>' + v + '</v></c>';
        });
      });
    });
    // อัปเดตค่าแคชของแถวรวม (คงสูตร =SUM(?2:?111) ไว้)
    M.headers.forEach(function (hName) {
      var ref = headerMap[hName] + M.totalRow;
      var re = new RegExp('(<c r="' + ref + '"[^>]*>)(<f[^>]*>[^<]*</f>)(?:<v>[^<]*</v>)?(</c>)');
      if (!re.test(xml)) throw new Error('ไม่พบช่องแถวรวม ' + ref);
      xml = xml.replace(re, '$1$2<v>' + smRnd(totals[hName]) + '</v>$3');
    });
    return { xml: xml, totals: totals };
  }

  /* ---------- Sheet 2 "รวมลา" (สรุปต่อคน 1 แถว พร้อมรายละเอียดวันที่) ---------- */
  function smThaiDate(iso) { // 2026-07-05 → 05/07/2569
    var m = /(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? m[3] + '/' + m[2] + '/' + (parseInt(m[1], 10) + 543) : '';
  }
  function smFmtN(v) { v = smRnd(v); return String(v); }
  function smXmlEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function smBuildSheet2(T, styleIdx) {
    var M = window.SALARY_MASTER;
    var HEAD = ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ลากี่วัน', 'ลากิจ', 'ลาพักร้อน', 'ลาป่วย', 'ลาอื่น',
      'ขาดงานเข้า', 'ขาดงานออก', 'สาย', 'ลงชื่อย้อนหลัง'];
    var COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    function dayBlock(total, dateMap) { // บรรทัดแรก "X วัน" + วันที่เรียงเก่า→ใหม่
      if (!(total > 0)) return '-';
      var lines = [smFmtN(total) + ' วัน'];
      Object.keys(dateMap).sort().forEach(function (d) { lines.push(smThaiDate(d)); });
      return lines.join('\n');
    }
    function cntBlock(arr, unit) { // "X ครั้ง" + วันที่
      if (!arr.length) return '-';
      var lines = [arr.length + ' ' + unit];
      arr.slice().sort().forEach(function (d) { lines.push(smThaiDate(d)); });
      return lines.join('\n');
    }
    var rowsTxt = [];
    var codes = Object.keys(M.codes).sort(); // เรียงรหัสน้อย → มาก
    codes.forEach(function (code, i) {
      var e = (T[code]) || { absIn: 0, absOut: 0, ot: 0, back: 0, S: 0, Tk: 0, U: 0, V: 0,
        dt: { absIn: [], absOut: [], late: [], ot: [], back: [], S: {}, Tk: {}, U: {}, V: {} } };
      var totalLeave = smRnd(e.S + e.Tk + e.U + e.V);
      rowsTxt.push([String(i + 1), code, M.codes[code].n,
        totalLeave > 0 ? smFmtN(totalLeave) + ' วัน' : '-',
        dayBlock(e.S, e.dt.S), dayBlock(e.Tk, e.dt.Tk), dayBlock(e.U, e.dt.U), dayBlock(e.V, e.dt.V),
        cntBlock(e.dt.absIn, 'ครั้ง'), cntBlock(e.dt.absOut, 'ครั้ง'),
        cntBlock(e.dt.late || [], 'ครั้ง'), cntBlock(e.dt.back, 'ครั้ง')]); // สาย แทน OT (ข้อมูล OT อยู่ชีต 4 เท่านั้น)
    });
    // Auto Fit: กว้างตามบรรทัดที่ยาวสุดของแต่ละคอลัมน์ (รวมหัวตาราง)
    var widths = HEAD.map(function (h) { return h.length; });
    rowsTxt.forEach(function (cells) {
      cells.forEach(function (txt, c) {
        String(txt).split('\n').forEach(function (line) {
          if (line.length > widths[c]) widths[c] = line.length;
        });
      });
    });
    var colsXml = widths.map(function (w, c) {
      var width = Math.min(34, Math.max(8, w + 3));
      return '<col collapsed="false" customWidth="true" hidden="false" outlineLevel="0" max="' + (c + 1) + '" min="' + (c + 1) + '" style="1" width="' + width + '"/>';
    }).join('');
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="A1:L' + (rowsTxt.length + 1) + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="true" showRowColHeaders="true">' +
      '<pane xSplit="0" ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' + // Freeze หัวตาราง
      '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="20.1"/>' +
      '<cols>' + colsXml + '</cols><sheetData>';
    xml += '<row r="1" customHeight="true" ht="24">' + HEAD.map(function (h, c) {
      return '<c r="' + COLS[c] + '1" s="6" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(h) + '</t></is></c>';
    }).join('') + '</row>';
    rowsTxt.forEach(function (cells, i) {
      var lines = 1;
      cells.forEach(function (t) { lines = Math.max(lines, String(t).split('\n').length); });
      var r = i + 2;
      xml += '<row r="' + r + '" customHeight="true" ht="' + (lines * 20.1) + '">' + cells.map(function (t, c) {
        return '<c r="' + COLS[c] + r + '" s="' + styleIdx.wrapIdx + '" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(t) + '</t></is></c>';
      }).join('') + '</row>';
    });
    xml += '</sheetData><autoFilter ref="A1:L' + (rowsTxt.length + 1) + '"/></worksheet>'; // เปิด Filter
    return { xml: xml, rows: rowsTxt };
  }
  // เพิ่มชีตใหม่เข้า workbook (workbook.xml + rels + [Content_Types].xml)
  function smPatchWorkbookParts(wbXml, relsXml, ctXml, sheetDefs) {
    var maxRid = 0;
    (relsXml.match(/Id="rId(\d+)"/g) || []).forEach(function (x) {
      maxRid = Math.max(maxRid, parseInt(x.replace(/\D/g, ''), 10));
    });
    var maxSid = 0;
    (wbXml.match(/sheetId="(\d+)"/g) || []).forEach(function (x) {
      maxSid = Math.max(maxSid, parseInt(x.replace(/\D/g, ''), 10));
    });
    sheetDefs.forEach(function (def, i) {
      var rid = 'rId' + (maxRid + 1 + i);
      if (wbXml.indexOf('name="' + def.name + '"') >= 0) throw new Error('Master มีชีต ' + def.name + ' อยู่แล้ว');
      wbXml = wbXml.replace('</sheets>', '<sheet name="' + def.name + '" sheetId="' + (maxSid + 1 + i) + '" state="visible" r:id="' + rid + '"/></sheets>');
      relsXml = relsXml.replace('</Relationships>', '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/' + def.target + '"/></Relationships>');
      ctXml = ctXml.replace('</Types>', '<Override PartName="/xl/worksheets/' + def.target + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    });
    return { wb: wbXml, rels: relsXml, ct: ctXml };
  }

  /* ---------- Sheet 3 "รายละเอียดการลาและการมาทำงาน" ---------- */
  // รวมวันที่ต่อเนื่องอัตโนมัติ รูปแบบ DD/MM/YYYY:
  // [02,03,15,28,29,30] → "02/07/2026 - 03/07/2026, 15/07/2026, 28/07/2026 - 30/07/2026" / ไม่มีข้อมูล → "-"
  function smDMY(iso) {
    return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  }
  function smGroupDates(isoList) {
    var list = [];
    var seen = {};
    (isoList || []).forEach(function (d) { if (d && !seen[d]) { seen[d] = 1; list.push(d); } });
    if (!list.length) return '-';
    list.sort();
    var groups = [], start = list[0], prev = list[0];
    for (var i = 1; i <= list.length; i++) {
      var cur = list[i];
      if (cur && cur === smNextDay(prev)) { prev = cur; continue; }
      groups.push([start, prev]);
      start = prev = cur;
    }
    return groups.map(function (g) {
      return g[0] === g[1] ? smDMY(g[0]) : smDMY(g[0]) + ' - ' + smDMY(g[1]);
    }).join(', ');
  }
  function smBuildSheet3(T, styleIdx) {
    var M = window.SALARY_MASTER;
    var HEAD = [
      { t: 'ลำดับ', g: 'emp' }, { t: 'ชื่อพนักงาน', g: 'emp' },
      { t: 'ขาดงานเข้า', g: 'abs' }, { t: 'รายละเอียดขาดงานเข้า', g: 'abs' },
      { t: 'ขาดงานออก', g: 'abs' }, { t: 'รายละเอียดขาดงานออก', g: 'abs' },
      { t: 'สาย (ครั้ง)', g: 'work' }, { t: 'รายละเอียดสาย', g: 'work' },
      { t: 'ลงชื่อย้อนหลัง', g: 'work' }, { t: 'รายละเอียดลงชื่อย้อนหลัง', g: 'work' },
      { t: 'ลาป่วย (วัน)', g: 'leave' }, { t: 'รายละเอียดลาป่วย', g: 'leave' },
      { t: 'ลากิจ (วัน)', g: 'leave' }, { t: 'รายละเอียดลากิจ', g: 'leave' },
      { t: 'ลาพักร้อน (วัน)', g: 'leave' }, { t: 'รายละเอียดพักร้อน', g: 'leave' },
      { t: 'ลาอื่น (วัน)', g: 'leave' }, { t: 'รายละเอียดลาอื่น', g: 'leave' },
      { t: 'รวมวันลา', g: 'leave' }];
    var COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
    var NUM_COLS = { 0: 1, 2: 1, 4: 1, 6: 1, 8: 1, 10: 1, 12: 1, 14: 1, 16: 1, 18: 1 }; // คอลัมน์ตัวเลข
    var codes = Object.keys(M.codes).sort();
    var rows = [];
    codes.forEach(function (code, i) {
      var e = (T[code]) || { absIn: 0, absOut: 0, lateN: 0, ot: 0, back: 0, S: 0, Tk: 0, U: 0, V: 0,
        dt: { absIn: [], absOut: [], late: [], ot: [], back: [], S: {}, Tk: {}, U: {}, V: {} } };
      rows.push([
        i + 1, M.codes[code].n,
        e.absIn, smGroupDates(e.dt.absIn),
        e.absOut, smGroupDates(e.dt.absOut),
        e.lateN, smGroupDates(e.dt.late),
        e.back, smGroupDates(e.dt.back),
        smRnd(e.U), smGroupDates(Object.keys(e.dt.U)),
        smRnd(e.S), smGroupDates(Object.keys(e.dt.S)),
        smRnd(e.Tk), smGroupDates(Object.keys(e.dt.Tk)),
        smRnd(e.V), smGroupDates(Object.keys(e.dt.V)),
        smRnd(e.S + e.Tk + e.U + e.V)
      ]);
    });
    // Auto Fit ความกว้าง: ตามหัวตาราง/ข้อมูลบรรทัดยาวสุด
    var widths = HEAD.map(function (h) { return Math.ceil(h.t.length / 2) + 4; }); // หัวข้อ wrap ได้ 2 บรรทัด
    rows.forEach(function (cells) {
      cells.forEach(function (v, c) {
        var len = String(v).length;
        if (len > widths[c]) widths[c] = len;
      });
    });
    var colsXml = widths.map(function (w, c) {
      var width = Math.min(38, Math.max(8, w + 3));
      return '<col collapsed="false" customWidth="true" hidden="false" outlineLevel="0" max="' + (c + 1) + '" min="' + (c + 1) + '" style="1" width="' + width + '"/>';
    }).join('');
    var last = rows.length + 1;
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="A1:S' + last + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="true" showRowColHeaders="true">' +
      '<pane xSplit="0" ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' + // Freeze หัวตาราง
      '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="20.1"/>' +
      '<cols>' + colsXml + '</cols><sheetData>';
    xml += '<row r="1" customHeight="true" ht="42">' + HEAD.map(function (h, c) {
      return '<c r="' + COLS[c] + '1" s="' + styleIdx.hdr[h.g] + '" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(h.t) + '</t></is></c>';
    }).join('') + '</row>';
    rows.forEach(function (cells, i) {
      var r = i + 2;
      xml += '<row r="' + r + '">' + cells.map(function (v, c) {
        var ref = COLS[c] + r;
        if (NUM_COLS[c]) { // ตัวเลข: จัดกึ่งกลาง เต็ม="0" ครึ่ง/ทศนิยม="0.#" ไม่มี .0
          var s = (v === Math.round(v)) ? styleIdx.intIdx : styleIdx.halfIdx;
          return '<c r="' + ref + '" s="' + s + '" t="n"><v>' + v + '</v></c>';
        }
        return '<c r="' + ref + '" s="' + styleIdx.wrapIdx + '" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(v) + '</t></is></c>';
      }).join('') + '</row>';
    });
    xml += '</sheetData><autoFilter ref="A1:S' + last + '"/></worksheet>'; // เปิด Filter ทุกคอลัมน์
    return { xml: xml, rows: rows };
  }

  /* ---------- Sheet 4 "รายละเอียดและคำนวณ OT" ---------- */
  function smHM(dtStr) { // "2026-07-01 18:00:00" → นาทีของวัน + "18:00"
    var m = /(\d{2}):(\d{2})(?::\d{2})?$/.exec(smStr(dtStr));
    if (!m) return null;
    return { min: parseInt(m[1], 10) * 60 + parseInt(m[2], 10), txt: m[1] + ':' + m[2] };
  }
  // แบ่งชั่วโมงตามกฎบริษัท: วันธรรมดา = 1.5 เท่าทั้งช่วง /
  // วันหยุด: 08:30-17:30 = 1 เท่า, 17:30-18:00 ไม่คิด, 18:00 เป็นต้นไป = 3 เท่า
  function smOtSplit(isHoliday, startMin, endMin) {
    function ov(a1, a2, b1, b2) { return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)) / 60; }
    if (endMin <= startMin) return null; // ชั่วโมงติดลบ/ศูนย์ → ไม่คำนวณ
    if (!isHoliday) return { h15: (endMin - startMin) / 60, h1: 0, h3: 0 };
    return { h15: 0, h1: ov(startMin, endMin, 510, 1050), h3: ov(startMin, endMin, 1080, 100000) };
  }
  // PERF: โหลดฐานเงินเดือน (master-salary.js ~48KB) เฉพาะตอนเปิดโหมดรวมเงินเดือน ไม่ถ่วงการเปิดแอปของพนักงาน 150 คน
  function smEnsureMaster() {
    // ไฟล์ในโปรเจกต์ → ติด Build Version กันใช้ไฟล์ข้าม Build
    return loadScriptOnce('master-salary', njAsset('master-salary.js'), 'SALARY_MASTER');
  }

  function smBuildSheet4(T, styleIdx) {
    var M = window.SALARY_MASTER;
    var HEAD = [
      { t: 'ลำดับ', g: 'emp' }, { t: 'ชื่อพนักงาน', g: 'emp' }, { t: 'เงินเดือน', g: 'emp' },
      { t: 'วันที่ OT', g: 'emp' }, { t: 'ประเภทวัน', g: 'emp' }, { t: 'เวลาเริ่ม', g: 'emp' }, { t: 'เวลาสิ้นสุด', g: 'emp' },
      { t: 'ชั่วโมง OT วันธรรมดา 1.5 เท่า', g: 'blue' }, { t: 'ชั่วโมงวันหยุด 1 เท่า', g: 'work' }, { t: 'ชั่วโมงวันหยุด 3 เท่า', g: 'abs' },
      { t: 'ค่าแรงต่อวัน', g: 'emp' }, { t: 'ค่าแรงต่อชั่วโมง', g: 'emp' },
      { t: 'เงิน OT 1.5 เท่า', g: 'blue' }, { t: 'เงิน OT 1 เท่า', g: 'work' }, { t: 'เงิน OT 3 เท่า', g: 'abs' },
      { t: 'เงิน OT รวม', g: 'leave' }];
    var COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    var warnings = [];
    var recs = [];
    Object.keys(M.codes).sort().forEach(function (code) {
      var e = T[code];
      if (!e || !e.dt.ot.length) return;
      var salary = M.codes[code].sal;
      if (!(salary > 0)) { warnings.push('ชีต OT: ' + code + ' ไม่มีเงินเดือนใน Master — เงิน OT = 0'); salary = 0; }
      e.dt.ot.slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; }).forEach(function (o) {
        var st = smHM(o.st), en = smHM(o.en);
        var isHol = o.tp.indexOf('วันหยุด') >= 0; // ประเภทวันจากข้อมูลระบบบริษัท (ไม่ใช่ดูเสาร์-อาทิตย์)
        if (!st || !en) { warnings.push('ชีต OT: ' + code + ' ' + o.d + ' อ่านเวลาเริ่ม/สิ้นสุดไม่ได้ — ข้ามรายการ'); return; }
        var sp = smOtSplit(isHol, st.min, en.min);
        if (!sp) { warnings.push('ชีต OT: ' + code + ' ' + o.d + ' เวลาสิ้นสุดไม่มากกว่าเวลาเริ่ม — ข้ามรายการ'); return; }
        var calcH = smRnd2(sp.h15 + sp.h1 + sp.h3);
        if (isHol && Math.abs((sp.h15 + sp.h1 + sp.h3) - o.h) > 0.51 && st.min < 1080 && en.min > 1050) {
          // ช่วง 17:30-18:00 ถูกตัดตามกฎ — ไม่ใช่ข้อผิดพลาด
        } else if (Math.abs(calcH - smRnd2(o.h)) > 0.051 && !(isHol && calcH < o.h)) {
          warnings.push('ชีต OT: ' + code + ' ' + o.d + ' ชม.คำนวณ ' + calcH + ' ต่างจากที่กรอก ' + o.h);
        }
        var dayWage = smRnd2(salary / 30), hourWage = smRnd2(salary / 30 / 8);
        var m15 = smRnd2(salary / 30 / 8 * 1.5 * sp.h15);
        var m1 = smRnd2(salary / 30 / 8 * 1 * sp.h1);
        var m3 = smRnd2(salary / 30 / 8 * 3 * sp.h3);
        recs.push({
          code: code, name: M.codes[code].n, salary: salary, date: smDMY(o.d),
          type: isHol ? 'วันหยุด' : 'วันธรรมดา', st: st.txt, en: en.txt,
          h15: smRnd2(sp.h15), h1: smRnd2(sp.h1), h3: smRnd2(sp.h3),
          dayWage: dayWage, hourWage: hourWage, m15: m15, m1: m1, m3: m3, total: smRnd2(m15 + m1 + m3)
        });
      });
    });
    // รวมยอดเงิน OT ต่อพนักงาน → ส่งกลับชีต 1 (จับคู่ด้วยรหัสพนักงาน)
    var perEmp = {};
    recs.forEach(function (r) { perEmp[r.code] = smRnd2((perEmp[r.code] || 0) + r.total); });
    Object.keys(M.codes).forEach(function (code) {
      if (T[code]) T[code].otMoney = perEmp[code] || 0;
    });
    // สร้าง XML
    var widths = HEAD.map(function (h) { return Math.ceil(h.t.length / 2) + 4; });
    var rowsV = recs.map(function (r, i) {
      return [i + 1, r.name, r.salary, r.date, r.type, r.st, r.en, r.h15, r.h1, r.h3, r.dayWage, r.hourWage, r.m15, r.m1, r.m3, r.total];
    });
    rowsV.forEach(function (cells) {
      cells.forEach(function (v, c) {
        var len = String(v).length;
        if (len > widths[c]) widths[c] = len;
      });
    });
    var colsXml = widths.map(function (w, c) {
      var width = Math.min(30, Math.max(8, w + 3));
      return '<col collapsed="false" customWidth="true" hidden="false" outlineLevel="0" max="' + (c + 1) + '" min="' + (c + 1) + '" style="1" width="' + width + '"/>';
    }).join('');
    var last = rowsV.length + 1;
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<dimension ref="A1:P' + last + '"/>' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="true" showRowColHeaders="true">' +
      '<pane xSplit="0" ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' + // Freeze หัวตาราง
      '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>' +
      '<sheetFormatPr defaultRowHeight="20.1"/>' +
      '<cols>' + colsXml + '</cols><sheetData>';
    xml += '<row r="1" customHeight="true" ht="42">' + HEAD.map(function (h, c) {
      return '<c r="' + COLS[c] + '1" s="' + styleIdx.hdr[h.g] + '" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(h.t) + '</t></is></c>';
    }).join('') + '</row>';
    rowsV.forEach(function (cells, i) {
      var r = i + 2;
      xml += '<row r="' + r + '">' + cells.map(function (v, c) {
        var ref = COLS[c] + r;
        if (c === 0) return '<c r="' + ref + '" s="' + styleIdx.intIdx + '" t="n"><v>' + v + '</v></c>'; // ลำดับ
        if (c === 1) return '<c r="' + ref + '" s="' + styleIdx.wrapIdx + '" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(v) + '</t></is></c>'; // ชื่อชิดซ้าย
        if (c >= 3 && c <= 6) return '<c r="' + ref + '" s="15" t="inlineStr"><is><t xml:space="preserve">' + smXmlEsc(v) + '</t></is></c>'; // วันที่/ประเภท/เวลา กึ่งกลาง
        if (c >= 7 && c <= 9) return '<c r="' + ref + '" s="' + styleIdx.hoursIdx + '" t="n"><v>' + v + '</v></c>'; // ชั่วโมง ≤2 ตำแหน่ง
        return '<c r="' + ref + '" s="' + styleIdx.moneyIdx + '" t="n"><v>' + v + '</v></c>'; // เงิน #,##0.00
      }).join('') + '</row>';
    });
    xml += '</sheetData><autoFilter ref="A1:P' + last + '"/></worksheet>'; // เปิด Filter ทุกคอลัมน์
    return { xml: xml, rows: rowsV, recs: recs, perEmp: perEmp, warnings: warnings };
  }

  /* ---------- ตรวจสอบอัตโนมัติก่อน Export ---------- */
  function smXmlOk(str) {
    try {
      var d = new DOMParser().parseFromString(str, 'application/xml');
      return !d.getElementsByTagName('parsererror').length;
    } catch (e) { return false; }
  }
  function smVerifyExport(sheetOld, sheetNew, stylesOld, stylesNew, headerMap, styleIdx) {
    var fails = [];
    var M = window.SALARY_MASTER;
    if (!smXmlOk(sheetNew)) fails.push('sheet XML ไม่สมบูรณ์ (ไฟล์จะเสีย)');
    if (!smXmlOk(stylesNew)) fails.push('styles XML ไม่สมบูรณ์ (ไฟล์จะเสีย)');
    var ok = 0, total = Object.keys(M.codes).length * M.headers.length;
    Object.keys(M.codes).forEach(function (code) {
      var row = M.codes[code].r;
      M.headers.forEach(function (hName) {
        if (new RegExp('<c r="' + headerMap[hName] + row + '" s="\\d+" t="n"><v>[-0-9.]+</v></c>').test(sheetNew)) ok++;
        else if (fails.length < 5) fails.push('cell ' + headerMap[hName] + row + ' ไม่ถูกเติม');
      });
    });
    if (ok !== total) fails.push('เติมข้อมูลผ่าน ' + ok + '/' + total + ' cell');
    if ((sheetOld.match(/<f /g) || []).length !== (sheetNew.match(/<f /g) || []).length) fails.push('จำนวนสูตรใน Master เปลี่ยน');
    var r1 = /<row r="1"[\s\S]*?<\/row>/.exec(sheetOld);
    if (r1 && sheetNew.indexOf(r1[0]) < 0) fails.push('หัวตารางแถว 1 ถูกแก้ไข');
    var oldXfs = /<cellXfs count="\d+">([\s\S]*?)<\/cellXfs>/.exec(stylesOld);
    if (oldXfs && stylesNew.indexOf(oldXfs[1]) < 0) fails.push('style เดิมของ Master ถูกแก้ไข');
    return fails;
  }
  // เปิดไฟล์ที่สร้างแล้วอ่านซ้ำด้วย SheetJS เพื่อยืนยันหัวข้อ/ค่า/แถวรวม/Sheet รวมลา ก่อนให้ดาวน์โหลด
  function smReopenCheck(u8, headerMap, T, totals, sheet2rows, sheet3rows, sheet4) {
    var M = window.SALARY_MASTER;
    var wb = window.XLSX.read(u8, { type: 'array' });
    var ws = wb.Sheets[wb.SheetNames[0]];
    var fails = [];
    M.headers.forEach(function (hName, i) {
      var cell = ws[headerMap[hName] + '1'];
      if (!cell || smStr(cell.v) !== hName) fails.push('เปิดซ้ำ: หัวข้อ ' + headerMap[hName] + '1 ไม่ตรง');
    });
    var codes = Object.keys(M.codes);
    for (var i2 = 0; i2 < codes.length; i2 += 17) { // สุ่มตรวจทุก ๆ 17 รายชื่อ (~7 คน x 11 ช่อง)
      var code = codes[i2];
      var vals = smValuesOf(T[code]);
      M.headers.forEach(function (hName) {
        var cell = ws[headerMap[hName] + M.codes[code].r];
        if (!cell || Math.abs(smNum(cell.v) - vals[hName]) > 1e-9) fails.push('เปิดซ้ำ: ค่า ' + headerMap[hName] + M.codes[code].r + ' ไม่ตรง');
      });
    }
    M.headers.forEach(function (hName) {
      var cell = ws[headerMap[hName] + M.totalRow];
      if (!cell || Math.abs(smNum(cell.v) - smRnd(totals[hName])) > 1e-6) fails.push('เปิดซ้ำ: แถวรวม ' + headerMap[hName] + M.totalRow + ' ไม่ตรง');
    });
    // Sheet รวมลา
    if (wb.SheetNames.indexOf('รวมลา') < 0) fails.push('เปิดซ้ำ: ไม่พบชีต รวมลา');
    else {
      var w2 = wb.Sheets['รวมลา'];
      if (!w2.A1 || smStr(w2.A1.v) !== 'ลำดับ' || !w2.L1 || smStr(w2.L1.v) !== 'ลงชื่อย้อนหลัง') fails.push('เปิดซ้ำ: หัวตาราง รวมลา ไม่ตรง');
      for (var i3 = 0; i3 < sheet2rows.length; i3 += 23) { // สุ่มตรวจข้อความทั้งแถว
        var rr = i3 + 2;
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(function (L, c) {
          var cell = w2[L + rr];
          if (!cell || smStr(cell.v) !== smStr(sheet2rows[i3][c])) fails.push('เปิดซ้ำ: รวมลา ' + L + rr + ' ไม่ตรง');
        });
      }
      if (!w2['!autofilter']) fails.push('เปิดซ้ำ: รวมลา ไม่มี Filter');
    }
    // Sheet รายละเอียดการลาและการมาทำงาน
    if (wb.SheetNames.indexOf('รายละเอียดการลาและการมาทำงาน') < 0) fails.push('เปิดซ้ำ: ไม่พบชีตรายละเอียด');
    else if (sheet3rows) {
      var w3 = wb.Sheets['รายละเอียดการลาและการมาทำงาน'];
      if (!w3.A1 || smStr(w3.A1.v) !== 'ลำดับ' || !w3.S1 || smStr(w3.S1.v) !== 'รวมวันลา') fails.push('เปิดซ้ำ: หัวตารางชีตรายละเอียดไม่ตรง');
      var names = {};
      for (var i4 = 0; i4 < sheet3rows.length; i4++) {
        var nm = smStr(sheet3rows[i4][1]);
        if (names[nm]) fails.push('เปิดซ้ำ: ชื่อพนักงานซ้ำ ' + nm);
        names[nm] = 1;
      }
      var C3 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
      for (var i5 = 0; i5 < sheet3rows.length; i5 += 23) {
        var rr3 = i5 + 2;
        C3.forEach(function (L, c) {
          var cell = w3[L + rr3];
          var want = sheet3rows[i5][c];
          var okv = (typeof want === 'number') ? (cell && Math.abs(smNum(cell.v) - want) < 1e-9) : (cell && smStr(cell.v) === smStr(want));
          if (!okv) fails.push('เปิดซ้ำ: รายละเอียด ' + L + rr3 + ' ไม่ตรง');
        });
      }
    }
    // Sheet รายละเอียดและคำนวณ OT
    if (wb.SheetNames.indexOf('รายละเอียดและคำนวณ OT') < 0) fails.push('เปิดซ้ำ: ไม่พบชีตคำนวณ OT');
    else if (sheet4) {
      var w4 = wb.Sheets['รายละเอียดและคำนวณ OT'];
      if (!w4.A1 || smStr(w4.A1.v) !== 'ลำดับ' || !w4.P1 || smStr(w4.P1.v) !== 'เงิน OT รวม') fails.push('เปิดซ้ำ: หัวตารางชีต OT ไม่ตรง');
      for (var i6 = 0; i6 < sheet4.rows.length; i6 += 7) {
        var rr4 = i6 + 2;
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].forEach(function (L, c) {
          var cell = w4[L + rr4];
          var want = sheet4.rows[i6][c];
          var okv = (typeof want === 'number') ? (cell && Math.abs(smNum(cell.v) - want) < 1e-6) : (cell && smStr(cell.v) === smStr(want));
          if (!okv) fails.push('เปิดซ้ำ: ชีต OT ' + L + rr4 + ' ไม่ตรง');
        });
      }
      // ยอดเงินที่ส่งไปชีต 1 ต้องตรงชีต 4
      Object.keys(sheet4.perEmp).forEach(function (code) {
        var m = window.SALARY_MASTER;
        var cell = wb.Sheets[wb.SheetNames[0]][headerMap['ทำงานล่วงเวลา'] + m.codes[code].r];
        if (!cell || Math.abs(smNum(cell.v) - sheet4.perEmp[code]) > 0.005) fails.push('เปิดซ้ำ: เงิน OT ชีต 1 ไม่ตรงชีต 4 (' + code + ')');
      });
    }
    return fails;
  }

  /* ---------- UI ---------- */
