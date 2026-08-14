  /* ================= ATTENDANCE CORRECTION (แก้ไข/บันทึกเวลาย้อนหลัง) =================
     ย้ายมาจาก 33-view-attendance.js โดยไม่แก้เนื้อใน
     โหลดเมื่อกด #att-fix เท่านั้น ================= */
  /* ฟอร์ม "ลงชื่อย้อนหลัง"
     ส่งเข้า njhr_att_correction_submit (Supabase) เท่านั้น — ไม่เขียน db.corrections / localStorage
     พนักงานทั่วไป: Server หา Workflow → PENDING → เขียน Attendance เมื่ออนุมัติครบทุกขั้น
     MANAGING DIRECTOR / SUPER_ADMIN ที่ Server ตรวจว่าเป็นกลุ่มยกเว้น: APPROVED + เขียน Attendance ทันที
     Frontend อ่าน status ที่ RPC คืนจริงเท่านั้น ห้ามตัดสินสิทธิ์เอง */
  function correctionForm() {
    var today = todayISO();
    openModal('ลงชื่อย้อนหลัง',
      /* การ์ดพนักงานบนหัวฟอร์ม (เฉพาะมือถือ) — ข้อมูลจาก currentEmp() ไม่ hardcode
         แผนกไม่มีข้อมูลจริง = 'ไม่ระบุ' ไม่ดึงชื่อจาก Session มากลบ */
      '<div class="fm-emp only-mobile">' + (function () {
        var e2 = currentEmp() || {};
        var nm = ((e2.title || '') + (e2.firstName || '') + ' ' + (e2.lastName || '')).trim() ||
                 ((currentUser() || {}).username || '');
        var dp = (e2.deptId ? dept(e2.deptId) : '') || e2.deptName || '';
        if (!dp || dp === '\u2014') dp = 'ไม่ระบุ';
        return avatarHTML(nm, 44) +
          '<span class="grow"><b>' + esc(nm) + '</b>' +
          '<small>' + esc(e2.code || '-') + ' · ' + esc(dp) + '</small></span>';
      })() + '</div>' +

      '<form id="fix-f" novalidate>' +
      '<p class="muted note" style="margin-top:0">กรอกเวลาที่ถูกต้องของวันนั้น ' +
      'ระบบจะตรวจสิทธิ์และผังอนุมัติจากเซิร์ฟเวอร์ · กลุ่มผู้บริหารที่ได้รับยกเว้นจะอนุมัติและบันทึกทันที ' +
      '· เวลาที่ไม่ได้กรอกจะคงค่าเดิมไว้</p>' +
      '<label class="field"><span>วันที่ <i class="req">*</i></span>' +
      '<input type="date" name="date" value="' + today + '" max="' + today + '"></label>' +
      '<div class="form-2col">' +
      '<label class="field"><span>เวลาเข้า</span><input type="time" name="tin"></label>' +
      '<label class="field"><span>เวลาออก</span><input type="time" name="tout"></label>' +
      '</div>' +
      '<label class="field"><span>เหตุผล <i class="req">*</i></span>' +
      '<textarea name="reason" rows="3" placeholder="เช่น เครื่องสแกนค้าง ลืมสแกนออก"></textarea></label>' +
      '<label class="field"><span>หมายเหตุ</span>' +
      '<input type="text" name="note" placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"></label>' +
      '<div class="form-error" id="fix-err" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="fx-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="fx-save">ส่งคำขอ</button>',
      { fullMobile: true });

    document.getElementById('fx-cancel').onclick = closeModal;
    document.getElementById('fx-save').onclick = function () {
      var btn = this, err = document.getElementById('fix-err');
      var d = {};
      new FormData(document.getElementById('fix-f')).forEach(function (v, k) { d[k] = String(v).trim(); });
      err.textContent = '';
      if (!d.date) { err.textContent = 'กรุณาเลือกวันที่'; return; }
      if (!d.tin && !d.tout) { err.textContent = 'กรุณากรอกเวลาเข้าหรือเวลาออกอย่างน้อย 1 ช่อง'; return; }
      if (!d.reason) { err.textContent = 'กรุณาระบุเหตุผล'; return; }
      if (d.tin && d.tout && d.tout <= d.tin) { err.textContent = 'เวลาออกต้องหลังเวลาเข้า'; return; }

      /* ประกอบเป็น timestamptz ตามเขตเวลาเครื่อง (Asia/Bangkok บนเครื่องผู้ใช้จริง)
         ให้ตรงกับวันที่ที่เลือก ไม่เลื่อนไปวันก่อน/วันถัดไป */
      function ts(hm) {
        if (!hm) return null;
        var p = d.date.split('-'), t = hm.split(':');
        return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1], 0).toISOString();
      }
      var reason = d.reason + (d.note ? ' · หมายเหตุ: ' + d.note : '');

      withButtonLoading(btn, 'กำลังส่ง…', function () {
        return sbRpc('njhr_att_correction_submit', {
          p_token: sbToken(), p_work_date: d.date,
          p_requested_check_in: ts(d.tin), p_requested_check_out: ts(d.tout),
          p_reason: reason, p_employee: null, p_attachment: null
        }).then(function (r) {
          closeModal();
          /* กลุ่มยกเว้นผู้บริหาร RPC จะคืน status = APPROVED มาเลย
             จึงห้ามขึ้นข้อความ "รออนุมัติ" — อ่านจากค่าที่เซิร์ฟเวอร์คืนจริงเท่านั้น */
          toast(String(r && r.status) === 'APPROVED'
            ? 'บันทึกลงชื่อย้อนหลังเรียบร้อย · อนุมัติอัตโนมัติแล้ว'
            : 'ส่งคำขอลงชื่อย้อนหลังแล้ว รอการอนุมัติตามผัง', 'success');
          refreshFixPending();           // ยื่นคำขอใหม่ → นับ Badge ใหม่
          render();
        });
      })['catch'](function (e) {
        err.textContent = (e && e.message) || 'ส่งคำขอไม่สำเร็จ';
      });
    };
  }

  /* Public Feature Contract ของ Attendance Correction */
  NJHR.features.attendanceCorrection = { open: correctionForm };
