  function viewSalaryMerge(el) {
    smEnsureMaster().catch(function (e) { toast(e.message, 'error'); }); // เตรียมฐานเงินเดือนตอนเข้าหน้านี้
    function box(id, label, f) {
      return '<label class="card sm-box' + (f ? ' sm-ok' : '') + '" for="' + id + '">' +
        icon(f ? 'check' : 'download', f ? 'ic-sm' : '') + '<b>' + label + '</b>' +
        '<small>' + (f ? esc(f.name) : 'แตะเพื่อเลือกไฟล์ .xlsx / .xls') + '</small>' +
        '<input type="file" id="' + id + '" accept=".xlsx,.xls" hidden></label>';
    }
    var ready = SM.timeFile && SM.leaveFile;
    el.innerHTML =
      '<div class="card"><div class="card-head"><h3>รวมเงินเดือน</h3></div>' +
      '<p class="muted" style="margin-top:0">อัปโหลด 2 ไฟล์ แล้วกด EXPORT ระบบจะเติม 11 หัวข้อ (ขาดงานเข้า/ออก · ไม่จำเป็นต้องลงชื่อเข้างาน · สายกี่นาที · ทำงานล่วงเวลา · ลงชื่อย้อนหลัง · ลากี่วัน · ลากิจ · ลาพักร้อน · ลาป่วย · ลาอื่น) ลง MASTER ที่ฝังในระบบ นับเฉพาะรายการอนุมัติแล้วของเดือนเป้าหมาย พร้อมตรวจสอบอัตโนมัติและเปิดไฟล์ตรวจซ้ำก่อนดาวน์โหลด</p>' +
      '<div class="sm-grid">' + box('sm-time', '1. ไฟล์สรุปเวลา', SM.timeFile) + box('sm-leave', '2. ไฟล์ลา', SM.leaveFile) + '</div>' +
      '<div class="clock-btns"><button class="btn btn-primary btn-lg" id="sm-export" ' + (ready ? '' : 'disabled') + '>' + icon('download') + ' EXPORT EXCEL</button></div>' +
      '<div class="form-error" id="sm-err" role="alert"></div><div class="muted note" id="sm-note" style="white-space:pre-line"></div></div>';

    function bindFile(id, key) {
      document.getElementById(id).onchange = function () {
        if (this.files.length) { SM[key] = this.files[0]; viewSalaryMerge(el); }
      };
    }
    bindFile('sm-time', 'timeFile');
    bindFile('sm-leave', 'leaveFile');

    var exBtn = document.getElementById('sm-export');
    exBtn.onclick = function () {
      if (!window.SALARY_MASTER) { // กันกรณีกดก่อนไฟล์ฐานโหลดเสร็จ (พฤติกรรมผลลัพธ์เท่าเดิม)
        exBtn.disabled = true; exBtn.innerHTML = '<span class="spinner"></span> กำลังเตรียมข้อมูล…';
        smEnsureMaster().then(function () { exBtn.disabled = false; exBtn.innerHTML = icon('download') + ' EXPORT EXCEL'; exBtn.onclick(); })
          .catch(function (e) { exBtn.disabled = false; exBtn.innerHTML = icon('download') + ' EXPORT EXCEL'; document.getElementById('sm-err').textContent = e.message; });
        return;
      }
      var err = document.getElementById('sm-err'), note = document.getElementById('sm-note');
      err.textContent = ''; note.textContent = '';
      exBtn.disabled = true; exBtn.innerHTML = '<span class="spinner"></span> กำลังประมวลผล…';
      function done() { exBtn.disabled = false; exBtn.innerHTML = icon('download') + ' EXPORT EXCEL'; }
      function readAB(file) {
        return new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload = function () { res(new Uint8Array(fr.result)); };
          fr.onerror = function () { rej(new Error('อ่านไฟล์ไม่สำเร็จ: ' + file.name)); };
          fr.readAsArrayBuffer(file);
        });
      }
      var state = {};
      smLoadLibs().then(function () {
        return Promise.all([readAB(SM.timeFile), readAB(SM.leaveFile)]);
      }).then(function (bufs) {
        var X = window.XLSX;
        function toAoA(ws2) { return X.utils.sheet_to_json(ws2, { header: 1, raw: true, defval: null }); }
        var wbT = X.read(bufs[0], { type: 'array' });
        var timeAoA = toAoA(wbT.Sheets[wbT.SheetNames[0]]);
        var wbL = X.read(bufs[1], { type: 'array' });
        var leaveSheets = {};
        wbL.SheetNames.forEach(function (sn) { leaveSheets[sn] = toAoA(wbL.Sheets[sn]); });
        state.calc = smCompute(timeAoA, leaveSheets);
        return window.JSZip.loadAsync(window.SALARY_MASTER.b64, { base64: true });
      }).then(function (zip) {
        state.zip = zip;
        return Promise.all([
          zip.file('xl/worksheets/sheet1.xml').async('string'),
          zip.file('xl/styles.xml').async('string'),
          zip.file('xl/sharedStrings.xml').async('string'),
          zip.file('xl/workbook.xml').async('string'),
          zip.file('xl/_rels/workbook.xml.rels').async('string'),
          zip.file('[Content_Types].xml').async('string')
        ]);
      }).then(function (xmls) {
        var sheetOld = xmls[0], stylesOld = xmls[1], sharedOld = xmls[2];
        // 1) อ่าน+ตรวจหัวข้อจริงจาก Master (ลำดับต้องตรง 11 หัวข้อ ไม่งั้นหยุด)
        state.headerMap = smReadMasterHeaders(sheetOld, sharedOld);
        // 2) styles + ชีต 4 OT (คำนวณเงิน OT รวมต่อคน) → เติมชีต 1 + แถวรวม
        var st = smPatchStylesXml(stylesOld);
        var s4 = smBuildSheet4(state.calc.T, st); // ต้องมาก่อนชีต 1: ส่งยอดเงิน OT รวมกลับคอลัมน์ ทำงานล่วงเวลา
        state.sheet4 = s4;
        var patched = smPatchSheetXml(sheetOld, state.headerMap, state.calc.T, st);
        state.totals = patched.totals;
        // 3) Sheet "รวมลา" + "รายละเอียดการลาและการมาทำงาน" (ไม่มี OT) + ผูกเข้า workbook
        var s2 = smBuildSheet2(state.calc.T, st);
        state.sheet2rows = s2.rows;
        var s3 = smBuildSheet3(state.calc.T, st);
        state.sheet3rows = s3.rows;
        var parts = smPatchWorkbookParts(xmls[3], xmls[4], xmls[5], [
          { name: 'รวมลา', target: 'sheet2.xml' },
          { name: 'รายละเอียดการลาและการมาทำงาน', target: 'sheet3.xml' },
          { name: 'รายละเอียดและคำนวณ OT', target: 'sheet4.xml' }
        ]);
        // 4) ตรวจสอบอัตโนมัติก่อนสร้างไฟล์
        var fails = smVerifyExport(sheetOld, patched.xml, stylesOld, st.xml, state.headerMap, st);
        if (!smXmlOk(s2.xml)) fails.push('Sheet รวมลา XML ไม่สมบูรณ์');
        if (!smXmlOk(s3.xml)) fails.push('Sheet รายละเอียด XML ไม่สมบูรณ์');
        if (!smXmlOk(s4.xml)) fails.push('Sheet คำนวณ OT XML ไม่สมบูรณ์');
        if (s3.rows.length !== Object.keys(window.SALARY_MASTER.codes).length) fails.push('จำนวนพนักงานชีตรายละเอียดไม่ตรงชีตสรุป');
        if (s3.xml.indexOf('OT') >= 0) fails.push('ชีตรายละเอียดยังมีข้อมูล OT เหลืออยู่');
        if (s2.xml.indexOf('ทำงานล่วงเวลา') >= 0) fails.push('ชีตรวมลายังมีข้อมูล OT เหลืออยู่');
        s4.recs.forEach(function (r) {
          if (r.h15 < 0 || r.h1 < 0 || r.h3 < 0) fails.push('ชีต OT: ชั่วโมงติดลบ ' + r.name + ' ' + r.date);
          if (Math.abs(smRnd2(r.m15 + r.m1 + r.m3) - r.total) > 0.005) fails.push('ชีต OT: เงินรวมไม่ตรงผลรวมทุกอัตรา ' + r.name + ' ' + r.date);
          if (Math.abs(smRnd2(r.salary / 30) - r.dayWage) > 0.005) fails.push('ชีต OT: ค่าแรงต่อวันผิด ' + r.name);
          if (Math.abs(smRnd2(r.salary / 30 / 8) - r.hourWage) > 0.005) fails.push('ชีต OT: ค่าแรงต่อชั่วโมงผิด ' + r.name);
        });
        Object.keys(s4.perEmp).forEach(function (code) {
          var sum = smRnd2(s4.recs.filter(function (r) { return r.code === code; }).reduce(function (a, r) { return a + r.total; }, 0));
          if (Math.abs(sum - s4.perEmp[code]) > 0.005) fails.push('ชีต OT: ยอดส่งชีตเงินเดือนไม่ตรงชีต 4 (' + code + ')');
        });
        if (!smXmlOk(parts.wb) || !smXmlOk(parts.rels) || !smXmlOk(parts.ct)) fails.push('workbook parts ไม่สมบูรณ์');
        if (fails.length) throw new Error('ตรวจสอบก่อน Export ไม่ผ่าน: ' + fails.join(' | '));
        state.zip.file('xl/worksheets/sheet1.xml', patched.xml, { createFolders: false });
        state.zip.file('xl/styles.xml', st.xml, { createFolders: false });
        state.zip.file('xl/worksheets/sheet2.xml', s2.xml, { createFolders: false });
        state.zip.file('xl/worksheets/sheet3.xml', s3.xml, { createFolders: false });
        state.zip.file('xl/worksheets/sheet4.xml', s4.xml, { createFolders: false });
        state.zip.file('xl/workbook.xml', parts.wb, { createFolders: false });
        state.zip.file('xl/_rels/workbook.xml.rels', parts.rels, { createFolders: false });
        state.zip.file('[Content_Types].xml', parts.ct, { createFolders: false });
        return state.zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
      }).then(function (u8) {
        // 4) เปิดไฟล์ที่สร้างแล้วตรวจซ้ำก่อนดาวน์โหลด
        var fails = smReopenCheck(u8, state.headerMap, state.calc.T, state.totals, state.sheet2rows, state.sheet3rows, state.sheet4);
        if (fails.length) throw new Error('เปิดไฟล์ตรวจซ้ำไม่ผ่าน: ' + fails.slice(0, 4).join(' | '));
        var blob = new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = window.SALARY_MASTER.fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
        var c = state.calc, M = window.SALARY_MASTER;
        var matched = Object.keys(c.T).filter(function (x) { return M.codes[x]; }).length;
        note.textContent =
          'Export สำเร็จ 4 ชีต (เงินเดือน + รวมลา + รายละเอียดการลาและการมาทำงาน + รายละเอียดและคำนวณ OT ' + (state.sheet4 ? state.sheet4.rows.length : 0) + ' รายการ) · เดือนเป้าหมาย ' + c.monthStart + ' ถึง ' + c.monthEnd + '\n' +
          'จับคู่รหัสพนักงานได้ ' + matched + ' คน จาก Master ' + Object.keys(M.codes).length + ' คน · ตรวจอัตโนมัติ + เปิดไฟล์ตรวจซ้ำผ่าน\n' +
          'กรองรายการนอกเดือน: OT ' + c.filtered.ot + ' รายการ (' + smRnd(c.filtered.otHours) + ' ชม.) · ลงชื่อย้อนหลัง ' + c.filtered.back + ' รายการ · ลา ' + c.filtered.leave + ' รายการ · ลาข้ามเดือนคิดเฉพาะส่วนในเดือน ' + c.filtered.prorate + ' รายการ' +
          (c.filtered.dup ? ' · ตัดรายการซ้ำ ' + c.filtered.dup : '') +
          (c.notes.length ? '\n' + c.notes.join('\n') : '') +
          (c.warnings.concat(state.sheet4.warnings).length ? '\nคำเตือน:\n' + c.warnings.concat(state.sheet4.warnings).join('\n') : '');
        audit('SALARY_MERGE_EXPORT', 'Export ' + M.fileName);
        toast('Export ' + M.fileName + ' สำเร็จ');
        done();
      }).catch(function (ex) {
        err.textContent = String(ex && ex.message || ex);
        done();
      });
    };
  }

