  /* ================= LEAVE FORM (แบบฟอร์มขอลา + ไฟล์แนบ) =================
     ย้ายมาจาก 34-view-requests-leave.js โดยไม่แก้เนื้อใน
     สูตรจำนวนวันลา · ประเภทลา · Payload · Workflow — เหมือนเดิมทุกตัวอักษร
     โหลดเมื่อกด #lv-new เท่านั้น ================= */
  var LV_MAX_FILE = 5 * 1024 * 1024;                       // 5MB ต่อไฟล์

  var LV_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,image/*';

  function lvFileSize(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return '-';
    return v >= 1048576 ? (Math.round(v / 104857.6) / 10) + ' MB' : Math.max(1, Math.round(v / 1024)) + ' KB';
  }

  function lvFileKind(f) {
    var n = String(f.name || '').toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(n)) return 'รูปภาพ';
    if (/\.pdf$/.test(n)) return 'PDF';
    if (/\.(docx?|rtf)$/.test(n)) return 'เอกสาร Word';
    if (/\.(xlsx?|csv)$/.test(n)) return 'ไฟล์ Excel';
    return f.type || 'ไฟล์แนบ';
  }

  /* ---------- สิทธิ์ลาต้องพร้อมก่อนเปิดฟอร์มเสมอ ----------
     lvBal เป็น object ตัวเดียวกับหน้า "ลางาน" (chunk นี้รับมาตอนโหลด chunk ครั้งเดียว)
     มีข้อมูลแล้ว = ใช้ค่าเดิม ไม่ยิง RPC ซ้ำ
     ยังว่าง (กด "ขอลางาน" ก่อนหน้ารายการโหลดเสร็จ) = ยิง njhr_leave_balances ตัวเดิมก่อน
     lvBalPending เก็บคำขอที่กำลังวิ่ง กันกดซ้ำแล้วยิง RPC ซ้อนกันหลายรอบ
     ค่าโควตาทั้งหมดมาจาก njhr_leave_balances อย่างเดียว ไม่คำนวณเพิ่มเองที่หน้าจอ */
  var lvBalPending = null;

  function lvBalReady() {
    if (Object.keys(lvBal).length) return Promise.resolve();
    if (lvBalPending) return lvBalPending;
    lvBalPending = sbRpcList('njhr_leave_balances', { p_token: sbToken() }).then(function (rows) {
      lvBalPending = null;
      Object.keys(lvBal).forEach(function (k) { delete lvBal[k]; });
      (rows || []).forEach(function (b) { lvBal[b.leave_type] = b; });
    }).catch(function (er) {
      lvBalPending = null;
      try { console.error('[LEAVE] njhr_leave_balances ล้มเหลว:', er); } catch (e2) {}
      throw new Error('โหลดสิทธิ์การลาไม่สำเร็จ กรุณาลองใหม่');
    });
    return lvBalPending;
  }

  function leaveForm(listEl) {
    var e = currentEmp();
    if (!e) { toast('บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน', 'error'); return; }
    lvBalReady().then(
      function () { leaveFormBuild(listEl, e); },
      function (er) { toast(er.message || 'โหลดข้อมูลไม่สำเร็จ', 'error'); }
    );
  }

  function leaveFormBuild(listEl, e) {
    var files = [];                                        // { file, name, size, kind }
    var submitKey = uid('K');                              // Idempotency Key กันส่งซ้ำ
    var submitting = false;
    var submittedAt = nowStamp();

    openModal('ขอลางาน',
      '<form id="lv-f" novalidate>' +
      // ---------- ข้อมูลผู้ยื่นคำขอ (อ่านจาก Session ผู้ใช้แก้เองไม่ได้) ----------
      '<div class="ot-req-info">' +
      '<div><small>ผู้ยื่นคำขอ</small><b>' + esc(e.title + e.firstName + ' ' + e.lastName) + '</b></div>' +
      '<div><small>รหัสพนักงาน</small><b>' + esc(e.code) + '</b></div>' +
      '<div><small>แผนก</small><b>' + esc(dept(e.deptId)) + '</b></div>' +
      '<div><small>ตำแหน่ง</small><b>' + esc(e.position || '-') + '</b></div>' +
      '<div><small>วันที่ยื่นคำขอ</small><b>' + esc(submittedAt) + '</b></div>' +
      '<div><small>เลขที่คำขอ</small><b id="lvf-no" class="muted">สร้างเมื่อบันทึกสำเร็จ</b></div>' +
      '</div>' +
      '<label class="field"><span>ประเภทการลา <i class="req">*</i></span><select name="typeId" id="lvf-type">' +
      LEAVE_TYPES.map(function (t) {
        var b = lvBal[t.code];
        return '<option value="' + t.code + '">' + esc(t.name) +
          (b && b.quota != null ? ' (คงเหลือ ' + lvNum(b.remaining) + ' วัน)' : ' (ไม่จำกัด)') + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>รูปแบบการลา <i class="req">*</i></span><div class="seg" id="lvf-mode">' +
      [['FULL', 'เต็มวัน'], ['HALF_AM', 'ครึ่งวันเช้า'], ['HALF_PM', 'ครึ่งวันบ่าย'], ['HOURLY', 'รายชั่วโมง']].map(function (m, i2) {
        return '<button type="button" class="seg-btn' + (i2 === 0 ? ' active' : '') + '" data-mode="' + m[0] + '">' + m[1] + '</button>';
      }).join('') + '</div></label>' +
      '<div class="form-2col">' +
      '<label class="field"><span>วันที่เริ่ม <i class="req">*</i></span><input type="date" name="startDate" id="lvf-start" value="' + todayISO() + '"></label>' +
      '<label class="field" id="lvf-endwrap"><span>วันที่สิ้นสุด <i class="req">*</i></span><input type="date" name="endDate" id="lvf-end" value="' + todayISO() + '"></label></div>' +
      '<div class="form-2col" id="lvf-times" style="display:none">' +
      '<label class="field"><span>เวลาเริ่ม <i class="req">*</i></span><input type="time" name="startTime" id="lvf-st" value="09:00"></label>' +
      '<label class="field"><span>เวลาสิ้นสุด <i class="req">*</i></span><input type="time" name="endTime" id="lvf-et" value="12:00"></label></div>' +
      '<label class="field"><span>เหตุผลการลา <i class="req">*</i></span>' +
      '<textarea name="reason" rows="2" placeholder="ระบุเหตุผลการลา"></textarea></label>' +
      '<label class="field"><span>ผู้รับงานแทน <small class="muted">(ไม่บังคับ)</small></span>' +
      '<select name="delegate"><option value="">— ไม่ระบุ —</option>' +
      db.employees.filter(function (x) { return x.status === 'ACTIVE' && x.id !== e.id; })
        .map(function (x) { return '<option value="' + x.id + '">' + esc(x.code + ' — ' + x.firstName + ' ' + x.lastName) + '</option>'; }).join('') +
      '</select></label>' +
      // ---------- เอกสารแนบ: หลายไฟล์ ผูกกับใบลาใบนี้ ----------
      '<div class="field"><span>เอกสารแนบ <small class="muted" id="lvf-doc-hint"></small></span>' +
      '<div class="otj-flist" id="lvf-files"></div>' +
      '<label class="btn btn-ghost btn-sm otj-attach">' + icon('plus') + ' เพิ่มไฟล์แนบ' +
      '<input type="file" id="lvf-file" hidden multiple accept="' + LV_ACCEPT + '"></label></div>' +
      '<div class="form-error" id="lvf-err" role="alert" style="white-space:pre-line"></div></form>',
      '<button class="btn btn-ghost" id="lvf-cancel">ยกเลิก</button><button class="btn btn-primary" id="lvf-send">ส่งคำขอ</button>',
      { wide: true, fullMobile: true });

    var mode = 'FULL';
    var modeBox = document.getElementById('lvf-mode');
    modeBox.querySelectorAll('.seg-btn').forEach(function (b) {
      b.onclick = function () {
        modeBox.querySelectorAll('.seg-btn').forEach(function (x) { x.classList.remove('active'); });
        this.classList.add('active');
        mode = this.dataset.mode;
        document.getElementById('lvf-times').style.display = mode === 'HOURLY' ? '' : 'none';
        // ครึ่งวัน/รายชั่วโมง = วันเดียว จึงซ่อนวันที่สิ้นสุดกันกรอกผิด
        document.getElementById('lvf-endwrap').style.display = mode === 'FULL' ? '' : 'none';
        if (mode !== 'FULL') document.getElementById('lvf-end').value = document.getElementById('lvf-start').value;
        updateSum();
      };
    });

    function calc() {
      var fm = document.getElementById('lv-f');
      var d = {}; new FormData(fm).forEach(function (v, k) { d[k] = v; });
      d.mode = mode;
      d.startDate = String(d.startDate); d.endDate = mode === 'FULL' ? String(d.endDate) : d.startDate;
      var days = 0, hours = 0;
      if (mode === 'FULL') days = businessDays(d.startDate, d.endDate);
      else if (mode === 'HOURLY') { hours = hoursDiff(String(d.startTime), String(d.endTime)); days = 0; }
      else days = (isWeekend(d.startDate) || isHoliday(d.startDate)) ? 0 : 0.5;
      d.days = days; d.hours = hours;
      d.useDays = Math.round((days + hours / 8) * 100) / 100;
      return d;
    }

    function renderFiles() {
      var box = document.getElementById('lvf-files');
      if (!box) return;
      box.innerHTML = files.length ? files.map(function (f, i) {
        return '<div class="otj-file"><span class="otj-fname">' + icon('fileText', 'ic-sm') + ' ' + esc(f.name) +
          '<small class="muted"> · ' + esc(f.kind) + ' · ' + lvFileSize(f.size) + '</small></span>' +
          '<button type="button" class="btn-icon ic-red" data-fdel="' + i + '" aria-label="ลบไฟล์">' + icon('x') + '</button></div>';
      }).join('') : '<small class="muted">ยังไม่มีไฟล์แนบ</small>';
      box.querySelectorAll('[data-fdel]').forEach(function (b) {
        b.onclick = function () { files.splice(parseInt(b.dataset.fdel, 10), 1); renderFiles(); updateSum(); };
      });
    }
    document.getElementById('lvf-file').onchange = function () {
      var pend = Array.prototype.slice.call(this.files), err = document.getElementById('lvf-err');
      err.textContent = '';
      pend.forEach(function (file) {
        if (file.size > LV_MAX_FILE) { err.textContent = 'ไฟล์ ' + file.name + ' เกิน 5MB — ไม่แนบ'; return; }
        if (files.some(function (x) { return x.name === file.name && x.size === file.size; })) return;  // กันแนบซ้ำ
        files.push({ file: file, name: file.name, size: file.size, kind: lvFileKind(file) });
      });
      this.value = '';
      renderFiles(); updateSum();
    };
    renderFiles();

    // เดิมโหลดรายชื่อผู้อนุมัติ (njhr_leave_approvers) มาแสดงในกล่องสรุปเท่านั้น
    // เมื่อไม่มีกล่องสรุปแล้วจึงไม่ต้องเรียก RPC นี้ — การอนุมัติจริงยังใช้ตรรกะเดิมทุกอย่าง

    // ไม่แสดงกล่อง "สรุปก่อนส่ง" แล้ว — คงไว้เฉพาะคำเตือนเอกสารแนบตามประเภทการลา
    // การคำนวณวัน/ชั่วโมง โควตา และการตรวจสอบตอนกดส่ง ยังใช้ calc() ชุดเดิมทุกจุด
    function updateSum() {
      var d = calc();
      var lt = lvType(String(d.typeId));
      var hint = document.getElementById('lvf-doc-hint');
      if (hint) hint.textContent = lt.needDoc ? '(' + lt.name + ' ต้องแนบเอกสารประกอบ)' : '(ไม่บังคับ · ไฟล์ละไม่เกิน 5MB)';
    }
    ['lvf-type', 'lvf-start', 'lvf-end', 'lvf-st', 'lvf-et'].forEach(function (id2) {
      var el2 = document.getElementById(id2);
      if (el2) el2.onchange = updateSum;
    });
    document.getElementById('lv-f').addEventListener('input', debounce(updateSum, 200));
    updateSum();

    document.getElementById('lvf-cancel').onclick = closeModal;
    document.getElementById('lvf-send').onclick = function () {
      var btn = this, err = document.getElementById('lvf-err');
      var d = calc();
      var lt = lvType(String(d.typeId));
      var b = lvBal[lt.code], hasQuota = !!(b && b.quota != null);
      err.textContent = '';
      if (submitting || btn.disabled) return;
      // ตรวจเบื้องต้นที่หน้าจอเพื่อความเร็ว — เซิร์ฟเวอร์ตรวจซ้ำทุกข้อใน njhr_leave_submit
      if (!String(d.reason).trim()) { err.textContent = 'กรุณาระบุเหตุผลการลา'; return; }
      if (!d.startDate || (d.mode === 'FULL' && !d.endDate)) { err.textContent = 'กรุณาเลือกวันที่ให้ครบ'; return; }
      if (d.startDate > d.endDate) { err.textContent = 'วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด'; return; }
      if (d.mode !== 'HOURLY' && d.days <= 0) { err.textContent = 'ช่วงวันที่เลือกไม่มีวันทำงาน (ตรงกับวันหยุด)'; return; }
      if (d.mode === 'HOURLY' && d.hours <= 0) { err.textContent = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'; return; }
      if (hasQuota && lvNum(b.remaining) < d.useDays) { err.textContent = 'วันลาคงเหลือไม่เพียงพอ (คงเหลือ ' + lvNum(b.remaining) + ' วัน)'; return; }
      if (lt.needDoc && !files.length) { err.textContent = lt.name + ' ต้องแนบเอกสารประกอบ'; return; }

      submitting = true;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังส่ง…';
      function fail(msg) {
        submitting = false;
        btn.disabled = false; btn.innerHTML = 'ส่งคำขอ';
        err.textContent = msg;
      }
      // 1) อัปโหลดไฟล์ทั้งหมดเข้า Storage ก่อน 2) ส่ง RPC ที่บันทึกใบลา+ไฟล์แนบในธุรกรรมเดียว
      Promise.all(files.map(function (f) { return sbUploadLeaveFile(f.file, e.id); })).then(function (up) {
        return sbRpc('njhr_leave_submit', {
          p_token: sbToken(),
          p_leave_type: lt.code,
          p_mode: d.mode,
          p_start_date: d.startDate,
          p_end_date: d.endDate,
          p_start_time: d.mode === 'HOURLY' ? String(d.startTime) : null,
          p_end_time: d.mode === 'HOURLY' ? String(d.endTime) : null,
          p_reason: String(d.reason).trim(),
          p_delegate: String(d.delegate || '') || null,
          p_files: up.map(function (f) { return { name: f.name, url: f.url, size: f.size }; }),
          p_client_key: submitKey
        });
      }).then(function (r) {
        var no = r && r.id ? lvCode(r.id) : '';
        var noEl = document.getElementById('lvf-no');
        if (noEl) { noEl.textContent = no; noEl.classList.remove('muted'); }
        closeModal();
        toast(r && r.duplicated
          ? 'คำขอนี้ถูกส่งไปแล้ว เลขที่ ' + no
          : 'ส่งคำขอลาแล้ว เลขที่ ' + no + ' · แนบไฟล์ ' + ((r && r.file_count) || 0) + ' ไฟล์ · สถานะ: รออนุมัติ');
        NJHR.features.leaveList.resetPage();
        refreshLeavePending();
        viewLeave(listEl);
      }).catch(function (er) { fail(er.message || 'ส่งคำขอลาไม่สำเร็จ'); });
    };
  }

  /* Public Feature Contract ของ Leave Form */
  NJHR.features.leaveForm = { open: leaveForm };
