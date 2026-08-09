  /* ================= ATTENDANCE CORRECTION (แก้ไข/บันทึกเวลาย้อนหลัง) =================
     ย้ายมาจาก 33-view-attendance.js โดยไม่แก้เนื้อใน
     โหลดเมื่อกด #att-fix เท่านั้น ================= */
  /* ฟอร์ม "ลงชื่อย้อนหลัง"
     ส่งเข้า njhr_att_correction_submit (Supabase) เท่านั้น — ไม่เขียน db.corrections / localStorage
     RPC บังคับผ่าน njhr_wf_route ก่อนสร้างคำขอ · ไม่มีผังการอนุมัติ = ส่งไม่ได้
     สถานะเริ่มต้น PENDING เสมอ · ห้าม Auto Approve · Attendance จริงเขียนเมื่ออนุมัติครบทุกขั้น */
  function correctionForm() {
    var today = todayISO();
    openModal('\u{1F552} ลงชื่อย้อนหลัง',
      '<form id="fix-f" novalidate>' +
      '<p class="muted note" style="margin-top:0">กรอกเวลาที่ถูกต้องของวันนั้น ' +
      'ระบบจะส่งให้ผู้อนุมัติตามผังที่ตั้งไว้ · เวลาที่ไม่ได้กรอกจะคงค่าเดิมไว้</p>' +
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
      '<button class="btn btn-primary" id="fx-save">ส่งคำขอ</button>');

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
          toast('ส่งคำขอลงชื่อย้อนหลังแล้ว รอการอนุมัติตามผัง', 'success');
          render();
        });
      })['catch'](function (e) {
        err.textContent = (e && e.message) || 'ส่งคำขอไม่สำเร็จ';
      });
    };
  }

  /* Public Feature Contract ของ Attendance Correction */
  NJHR.features.attendanceCorrection = { open: correctionForm };
