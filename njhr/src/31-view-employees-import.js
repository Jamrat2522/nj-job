  /* ================= EMPLOYEES IMPORT =================
     ย้ายมาจาก 08-view-employees.js โดยไม่แก้เนื้อใน
     โหลดเมื่อกดปุ่ม #emp-import หรือ #emp-template เท่านั้น ================= */
  var EMP_IMP_MAP = [
    ['รหัสพนักงาน', 'emp_code'], ['คำนำหน้า', 'prefix'], ['ชื่อ', 'first_name'], ['นามสกุล', 'last_name'],
    ['ชื่อเล่น', 'nickname'], ['เพศ', 'gender'], ['วันเกิด', 'birth_date'], ['เลขบัตรประชาชน', 'national_id'],
    ['เบอร์โทร', 'phone'], ['แผนก', 'department_name'], ['ตำแหน่ง', 'position_name'],
    ['วันที่เริ่มงาน', 'start_date'], ['ประเภทพนักงาน', 'emp_type'],
    ['เงินเดือนพื้นฐาน', 'base_salary'], ['ค่าน้ำมัน', 'fuel_allow'], ['ค่าโทรศัพท์', 'phone_allow'],
    ['ค่าตำแหน่ง', 'position_allow'],
    ['ธนาคาร', 'bank_name'], ['สาขา', 'bank_branch'], ['เลขที่บัญชี', 'bank_account'],
    ['เวลาเข้างาน', 'work_start'], ['เวลาเลิกงาน', 'work_end'],
    ['ลาป่วย (วัน/ปี)', 'leave_sick'], ['ลากิจ (วัน/ปี)', 'leave_personal'], ['ลาพักร้อน (วัน/ปี)', 'leave_vacation'],
    ['อีเมล', 'email'], ['ที่อยู่', 'address'], ['ระดับ', 'level']
  ];

  var EMP_IMP_REQUIRED = ['รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'วันที่เริ่มงาน'];

  var EMP_NUM_KEYS = ['base_salary', 'position_allow', 'fuel_allow', 'phone_allow',
    'leave_sick', 'leave_personal', 'leave_vacation'];



  function empCell(v, key) {
    if (v == null) return '';
    if (v instanceof Date) {
      if (key === 'work_start' || key === 'work_end') return pad(v.getHours()) + ':' + pad(v.getMinutes());
      return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    }
    if (typeof v === 'number') {
      // เวลาที่ Excel เก็บเป็นตัวเลขทศนิยมของวัน (0.354166 = 08:30)
      if ((key === 'work_start' || key === 'work_end') && v > 0 && v < 1) {
        var mins = Math.round(v * 24 * 60);
        return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60);
      }
      return String(v);
    }
    var t = String(v).trim();
    // ประเภทพนักงาน: ตัดช่องว่างและแปลงให้ตรงค่ามาตรฐานก่อนส่งเข้า RPC
    if (key === 'emp_type') return empNormType(t);
    // กันกรณีเซลล์ถูกบันทึกเป็นข้อความที่มีตัวคั่นหลักพัน เช่น "50,000.00"
    if (EMP_NUM_KEYS.indexOf(key) >= 0 && /^-?[\d,]+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
    // เวลาที่พิมพ์ด้วยจุดหรือไม่มีตัวคั่น เช่น "08.30" / "0830" → "08:30"
    if (key === 'work_start' || key === 'work_end') {
      var m = t.match(/^(\d{1,2})[.:\s]?(\d{2})$/);
      if (m) t = pad(+m[1]) + ':' + m[2];
    }
    return t;
  }

  function empTemplate(btn) {
    if (btn.disabled) return;
    var label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้าง…';
    var head = EMP_IMP_MAP.map(function (x) { return x[0]; });
    // แถวคำอธิบาย 5 บรรทัดเหมือนไฟล์ต้นฉบับ
    var title = ['เทมเพลตนำเข้าพนักงาน — ' + db.settings.companyName,
      'ช่องบังคับ: ' + EMP_IMP_REQUIRED.join(' · '),
      'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD เท่านั้น เช่น 2026-01-15',
      'แผนกต้องตรงกับชื่อแผนกที่มีอยู่ในระบบ · สถานะ: ACTIVE / PROBATION / SUSPENDED / RESIGNED',
      'ลบแถวตัวอย่างออกก่อนนำเข้าจริง'];
    var sample = EMP_IMP_MAP.map(function (x) {
      return ({ emp_code: '0501', prefix: 'นาย', first_name: 'สมชาย', last_name: 'ใจดี', nickname: 'ชาย',
        gender: 'ชาย', birth_date: '1990-05-20', national_id: '1234567890123', phone: '0812345678',
        department_name: 'ACCOUNT', position_name: 'เจ้าหน้าที่บัญชี', start_date: '2026-01-15',
        emp_type: 'พนักงานประจำ', base_salary: 25000, fuel_allow: 0, phone_allow: 0, position_allow: 0,
        bank_name: 'กสิกรไทย', bank_branch: 'สำนักงานใหญ่', bank_account: '1234567890',
        work_start: '08.30', work_end: '17.30', leave_sick: 30, leave_personal: 10, leave_vacation: 6,
        email: 'somchai@nj.co', address: 'กรุงเทพฯ', level: '' })[x[1]];
    }).map(function (v) { return v === undefined ? '' : v; });
    rptLoadZip().then(function () {
      return rptBuildXlsx('เทมเพลตพนักงาน', head, [sample],
        head.map(function (h) { return Math.min(Math.max(String(h).length + 6, 12), 26); }), title);
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'เทมเพลตนำเข้าพนักงาน.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('ดาวน์โหลดเทมเพลตแล้ว');
    }).catch(function (ex) { empErr((ex && ex.message) || 'สร้างเทมเพลตไม่สำเร็จ'); })
      .then(function () { btn.disabled = false; btn.innerHTML = label; });
  }

  function empImportReport(warned, rejected) {
    openModal('สรุปผลการนำเข้า',
      (rejected.length
        ? '<div class="ot-warn"><b>ไม่ถูกนำเข้า ' + rejected.length + ' แถว</b> (ข้อมูลบังคับไม่ครบ)</div>' +
          '<div class="table-wrap empi-table"><table><thead><tr><th>แถว</th><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>เหตุผล</th></tr></thead><tbody>' +
          rejected.map(function (x) {
            return '<tr class="row-bad"><td>' + x.row_no + '</td><td>' + esc(x.emp_code || '—') + '</td>' +
              '<td>' + esc(x.full_name || '—') + '</td><td>' + esc(x.message) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '') +
      (warned.length
        ? '<div class="ot-warn"><b>นำเข้าแล้วแต่ปล่อยบางช่องว่าง ' + warned.length + ' แถว</b> — กรุณาแก้ไขภายหลังที่หน้าแก้ไขพนักงาน</div>' +
          '<div class="table-wrap empi-table"><table><thead><tr><th>แถว</th><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ช่องที่ปล่อยว่าง</th></tr></thead><tbody>' +
          warned.map(function (x) {
            return '<tr class="row-warn"><td>' + x.row_no + '</td><td><b>' + esc(x.emp_code || '—') + '</b></td>' +
              '<td>' + esc(x.full_name || '—') + '</td><td><small>' + esc(x.warnings) + '</small></td></tr>';
          }).join('') + '</tbody></table></div>'
        : ''),
      '<button class="btn btn-ghost" id="empr-copy">คัดลอกรายการ</button>' +
      '<button class="btn btn-primary" id="empr-close">ปิด</button>', { wide: true });
    document.getElementById('empr-close').onclick = closeModal;
    document.getElementById('empr-copy').onclick = function () {
      var txt = rejected.map(function (x) {
        return 'แถว ' + x.row_no + ' · ' + (x.emp_code || '-') + ' · ' + (x.full_name || '-') + ' · ไม่นำเข้า: ' + x.message;
      }).concat(warned.map(function (x) {
        return 'แถว ' + x.row_no + ' · ' + (x.emp_code || '-') + ' · ' + (x.full_name || '-') + ' · ปล่อยว่าง: ' + x.warnings;
      })).join('\n');
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('คัดลอกรายการแล้ว'); }
      catch (e) { toast('คัดลอกไม่สำเร็จ', 'error'); }
      ta.remove();
    };
  }

  function empLoadXlsx() {
    return loadScriptOnce('xlsx',
      'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
  }

  function empImportForm(listEl) {
    var parsed = [], fileName = '';
    openModal('นำเข้าพนักงานจาก Excel',
      '<p class="confirm-msg">อ่านหัวคอลัมน์ภาษาไทยจากไฟล์ แล้วตรวจสอบทุกแถวก่อนบันทึก</p>' +
      '<p class="muted note">ใช้ไฟล์ตามรูปแบบ <b>เทมเพลตนำเข้าพนักงาน</b> ของบริษัทเท่านั้น · ' +
      'ช่องบังคับ: <b>' + EMP_IMP_REQUIRED.join(' · ') + '</b> · วันที่ต้องเป็น YYYY-MM-DD · ' +
      'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก · แผนกต้องตรงกับชื่อแผนกในระบบ · นำเข้าได้ครั้งละไม่เกิน 2,000 แถว</p>' +
      '<label class="field"><span>กรณีรหัสพนักงานซ้ำกับในระบบ</span><select id="empi-mode">' +
      '<option value="SKIP">ข้ามแถวนั้น (ไม่แก้ข้อมูลเดิม)</option>' +
      '<option value="UPDATE">อัปเดตข้อมูลเดิม</option></select></label>' +
      '<label class="btn btn-ghost otj-attach" style="margin-bottom:10px">' + icon('plus') + ' เลือกไฟล์ Excel' +
      '<input type="file" id="empi-file" hidden accept=".xlsx,.xls"></label>' +
      '<div id="empi-name" class="muted"></div>' +
      '<div id="empi-result"></div>' +
      '<div class="form-error" id="empi-err" role="alert" style="white-space:pre-line"></div>',
      '<button class="btn btn-ghost" id="empi-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="empi-confirm" disabled>ยืนยันนำเข้า</button>',
      { wide: true });

    var errEl = document.getElementById('empi-err');
    document.getElementById('empi-cancel').onclick = closeModal;
    document.getElementById('empi-mode').onchange = function () { if (parsed.length) runDry(); };

    document.getElementById('empi-file').onchange = function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      errEl.textContent = '';
      document.getElementById('empi-result').innerHTML = '';
      document.getElementById('empi-confirm').disabled = true;
      fileName = f.name;
      document.getElementById('empi-name').textContent = 'ไฟล์: ' + f.name;
      empLoadXlsx().then(function () {
        return f.arrayBuffer();
      }).then(function (buf) {
        var wb = window.XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error('ไม่พบข้อมูลในไฟล์');
        // raw:true = อ่านค่าดิบ ตัวเลขที่จัดรูปแบบในไฟล์ (เช่น 50,000.00) จะได้ค่าจริงไม่ติดคอมมา
        var aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true, cellDates: true });
        // หาแถวหัวคอลัมน์ (ข้ามบล็อกหัวรายงานของเทมเพลต)
        var hIdx = -1;
        for (var i = 0; i < Math.min(aoa.length, 20); i++) {
          var joined = (aoa[i] || []).map(function (x) { return String(x).trim(); });
          if (joined.indexOf('รหัสพนักงาน') >= 0 && joined.indexOf('ชื่อ') >= 0) { hIdx = i; break; }
        }
        if (hIdx < 0) throw new Error('ไม่พบหัวคอลัมน์ "รหัสพนักงาน" และ "ชื่อ" ในไฟล์ — กรุณาใช้เทมเพลตของระบบ');
        var head = (aoa[hIdx] || []).map(function (x) { return String(x).trim(); });
        var miss = EMP_IMP_REQUIRED.filter(function (h) { return head.indexOf(h) < 0; });
        if (miss.length) throw new Error('ไฟล์ขาดคอลัมน์บังคับ: ' + miss.join(', '));
        var colOf = {};
        EMP_IMP_MAP.forEach(function (m) {
          if (!m[0] || !m[1]) return;                 // ข้ามคอลัมน์ว่างของ Template
          var ci = head.indexOf(m[0]);
          if (ci >= 0) colOf[m[1]] = ci;
        });

        parsed = [];
        for (var rI = hIdx + 1; rI < aoa.length; rI++) {
          var row = aoa[rI] || [];
          var o = {};
          Object.keys(colOf).forEach(function (k) { o[k] = empCell(row[colOf[k]], k); });
          // ข้ามแถวว่างทั้งแถว
          if (!Object.keys(o).some(function (k) { return String(o[k]).trim() !== ''; })) continue;
          parsed.push(o);
        }
        if (!parsed.length) throw new Error('ไฟล์ไม่มีข้อมูลพนักงาน');
        if (parsed.length > 2000) throw new Error('นำเข้าได้ครั้งละไม่เกิน 2,000 แถว (พบ ' + parsed.length + ' แถว)');
        return runDry();
      }).catch(function (ex) {
        parsed = [];
        errEl.textContent = (ex && ex.message) || 'อ่านไฟล์ไม่สำเร็จ';
      });
    };

    // ตรวจสอบทั้งไฟล์ที่เซิร์ฟเวอร์ (ไม่เขียนข้อมูล) แล้วแสดงผลรายแถว
    function runDry() {
      var box = document.getElementById('empi-result');
      box.innerHTML = '<div class="muted" style="padding:10px"><span class="spinner"></span> กำลังตรวจสอบข้อมูล…</div>';
      return sbRpcList('njhr_emp_import', {
        p_token: sbToken(), p_rows: parsed,
        p_mode: document.getElementById('empi-mode').value, p_dry_run: true
      }).then(function (res) {
        var ins = res.filter(function (x) { return x.action === 'INSERT'; }).length;
        var upd = res.filter(function (x) { return x.action === 'UPDATE'; }).length;
        var skp = res.filter(function (x) { return x.action === 'SKIP'; }).length;
        var err = res.filter(function (x) { return x.action === 'ERROR'; });
        var warned = res.filter(function (x) { return x.warnings; });
        box.innerHTML =
          '<div class="bal-grid">' +
          [['ทั้งหมด', res.length], ['เพิ่มใหม่', ins], ['อัปเดต', upd], ['ข้าม', skp],
           ['ปล่อยว่างบางช่อง', warned.length], ['ปฏิเสธ', err.length]]
            .map(function (x) { return '<div class="bal-item"><div class="bal-top"><span>' + x[0] + '</span><b>' + x[1] + '</b></div></div>'; }).join('') +
          '</div>' +
          (err.length
            ? '<div class="ot-warn">มี ' + err.length + ' แถวที่ข้อมูลบังคับไม่ครบ จะ<b>ไม่ถูกนำเข้า</b> ' +
              'ส่วนแถวที่เหลือจะนำเข้าตามปกติ</div>'
            : '') +
          (warned.length
            ? '<div class="ot-warn">มี ' + warned.length + ' แถวที่บางช่องตรวจไม่ผ่าน ' +
              'ระบบจะ<b>นำเข้าแถวนั้นต่อโดยปล่อยช่องที่ผิดไว้ว่าง</b> ให้แก้ไขภายหลัง</div>'
            : '') +
          (!err.length && !warned.length
            ? '<div class="lv-summary">ตรวจสอบผ่านทั้งหมด กด "ยืนยันนำเข้า" เพื่อบันทึก</div>' : '') +
          '<div class="table-wrap empi-table"><table><thead><tr><th>แถว</th><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>ผล</th>' +
          '<th>รายละเอียด</th><th>ประเภทพนักงาน</th><th>ช่องที่ปล่อยว่าง</th></tr></thead><tbody>' +
          res.map(function (x) {
            var src = parsed[Number(x.row_no) - 1] || {};
            var ety = String(src.emp_type || '');
            return '<tr class="' + (x.action === 'ERROR' ? 'row-bad' : (x.warnings ? 'row-warn' : '')) + '">' +
              '<td>' + x.row_no + '</td>' +
              '<td>' + esc(x.emp_code || '—') + '</td><td>' + esc(x.full_name || '—') + '</td>' +
              '<td>' + ({ INSERT: '<span class="badge badge-ok">เพิ่มใหม่</span>',
                          UPDATE: '<span class="badge badge-ok">อัปเดต</span>',
                          SKIP: '<span class="badge badge-mut">ข้าม</span>',
                          ERROR: '<span class="badge badge-bad">ปฏิเสธ</span>' }[x.action] || x.action) + '</td>' +
              '<td>' + esc(x.message) + '</td>' +
              '<td>' + (ety ? esc(ety) : '<small class="t-red">—</small>') + '</td>' +
              '<td>' + (x.warnings ? '<small class="t-red">' + esc(x.warnings) + '</small>' : '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
        // นำเข้าได้ตราบใดที่ยังมีแถวที่ผ่านอย่างน้อย 1 แถว (ไม่บล็อกทั้งไฟล์เพราะบางแถวผิด)
        document.getElementById('empi-confirm').disabled = ((ins + upd) === 0);
      }).catch(function (ex) {
        box.innerHTML = '';
        errEl.textContent = (ex && ex.message) || 'ตรวจสอบข้อมูลไม่สำเร็จ';
      });
    }

    document.getElementById('empi-confirm').onclick = function () {
      var btn = this;
      if (btn.disabled || !parsed.length) return;
      var mode = document.getElementById('empi-mode').value;
      confirmDialog('ยืนยันนำเข้าพนักงาน',
        'นำเข้าข้อมูลจากไฟล์ <b>' + esc(fileName) + '</b> จำนวน <b>' + parsed.length + ' แถว</b><br>' +
        'กรณีรหัสซ้ำ: <b>' + (mode === 'UPDATE' ? 'อัปเดตข้อมูลเดิม' : 'ข้ามแถวนั้น') + '</b><br>' +
        '<small class="muted">แถวที่บางช่องตรวจไม่ผ่านจะถูกนำเข้าโดยปล่อยช่องนั้นไว้ว่าง · ' +
        'เฉพาะแถวที่ข้อมูลบังคับไม่ครบเท่านั้นที่จะไม่ถูกนำเข้า</small>',
        'ยืนยันนำเข้า', function () {
          btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังนำเข้า…';
          return sbRpcList('njhr_emp_import', {
            p_token: sbToken(), p_rows: parsed, p_mode: mode, p_dry_run: false
          }).then(function (res) {
            var ins = res.filter(function (x) { return x.action === 'INSERT'; }).length;
            var upd = res.filter(function (x) { return x.action === 'UPDATE'; }).length;
            var skp = res.filter(function (x) { return x.action === 'SKIP'; }).length;
            var rej = res.filter(function (x) { return x.action === 'ERROR'; });
            var wrn = res.filter(function (x) { return x.warnings; });
            closeModal();
            toast('นำเข้าสำเร็จ · เพิ่มใหม่ ' + ins + ' · อัปเดต ' + upd + ' · ข้าม ' + skp +
              (rej.length ? ' · ไม่นำเข้า ' + rej.length : ''));
            viewEmployees(listEl);
            // รายงานช่องที่ถูกปล่อยว่าง เพื่อให้ผู้ใช้ตามไปแก้ภายหลัง
            if (wrn.length || rej.length) setTimeout(function () { empImportReport(wrn, rej); }, 300);
          }).catch(function (ex) {
            btn.disabled = false; btn.innerHTML = 'ยืนยันนำเข้า';
            errEl.textContent = (ex && ex.message) || 'นำเข้าไม่สำเร็จ';
          });
        });
    };
  }
