  /* ================= REQUEST DETAIL (รายละเอียดคำขอลา และ OT) =================
     ย้ายมาจาก 34-view-requests-leave.js โดยไม่แก้เนื้อใน
     rhDetail(kind, id, el) เป็นฟังก์ชันเดียวที่รองรับทั้ง 'leave' และ 'ot'
     จึงเป็น Module เดียว ไม่แยกเป็น leave/detail.js กับ ot/detail.js เพื่อไม่ให้ต้อง Copy โค้ดซ้ำ
     โหลดเมื่อกดดูรายละเอียดเท่านั้น ================= */
  function rhDetail(kind, id, el) {
    if (!id) return;
    openModal(kind === 'OT' ? 'รายละเอียดคำขอ OT' : 'รายละเอียดใบลา',
      '<div class="muted"><span class="spinner"></span> กำลังโหลดจาก Supabase…</div>',
      '<button class="btn btn-ghost" id="rhd-close">ปิด</button>',
      { wide: true, fullMobile: true });
    document.getElementById('rhd-close').onclick = function () { closeModal(); rhRender(el); };

    var call = kind === 'OT'
      ? sbRpc('njhr_ot_get', { p_token: sbToken(), p_id: id })
      : sbRpc('njhr_leave_detail', { p_token: sbToken(), p_leave_id: id });

    call.then(function (r) {
      var body = document.querySelector('#modal-root .modal-body');
      if (!body) return;
      var d = (r && r.data) ? r.data : r;           // njhr_ot_get คืน data jsonb
      if (!d) { body.innerHTML = emptyState('ไม่พบรายละเอียดคำขอนี้'); return; }
      body.innerHTML = kind === 'OT' ? rhOtHtml(d, id) : rhLeaveHtml(d, id);
      /* OT: ไฟล์อยู่ในแต่ละรายการงาน (index ตรงกับ jobs) · ใบลา: อยู่ใน attachments */
      var fl = kind === 'OT'
        ? (d.jobs || []).map(function (j) { return { url: j.file_url, name: j.file_name }; })
        : (d.attachments || []);
      bindFileButtons(body, fl);
    }).catch(function (ex) {
      var body = document.querySelector('#modal-root .modal-body');
      if (body) body.innerHTML = '<div class="form-error">' +
        esc((ex && ex.message) || 'โหลดรายละเอียดไม่สำเร็จ') + '</div>';
    });
  }

  function rhTimeline(approvals) {
    var a = approvals || [];
    if (!a.length) return '<p class="muted note">ยังไม่มีประวัติการอนุมัติ</p>';
    return '<div class="rh-tl">' + a.map(function (x) {
      var act = String(x.action || '').toUpperCase();
      var cls = act.indexOf('APPROV') >= 0 ? 'ok' : act.indexOf('REJECT') >= 0 ? 'bad' : '';
      return '<div class="rh-tl-row ' + cls + '"><span class="rh-tl-dot"></span>' +
        '<div class="grow"><b>' + esc(x.action_text || x.action || '') +
        (x.by_name ? ' · ' + esc(x.by_name) : '') + '</b>' +
        '<small>' + esc(x.at ? docTS(x.at) : '') +
        (x.note ? ' · ' + esc(x.note) : '') + '</small></div></div>';
    }).join('') + '</div>';
  }

  function rhLeaveHtml(d, id) {
    var st = rhStatus(d.ui_status || d.status);
    var files = d.attachments || [];
    return '<div class="rh-det">' +
      rhRow('เลขที่คำขอ', '<code>' + esc(String(id).slice(0, 8)) + '</code>') +
      rhRow('ประเภทคำขอ', esc(d.leave_type || 'ใบลา')) +
      rhRow('ผู้ยื่น', esc(d.emp_name || '')) +
      rhRow('สถานะ', '<span class="badge ' + st.c + '">' + st.t + '</span>') +
      (d.reason ? rhRow('เหตุผล', esc(d.reason)) : '') +
      /* ไฟล์แนบ: ปุ่ม 👁 เปิด Preview ทับในหน้าเดิม · ปุ่ม ⬇ ดาวน์โหลดพร้อม Toast
         ไม่ใช้ <a target="_blank"> แล้ว — ผูก Event หลัง render ด้วย bindFileButtons() */
      (files.length ? rhRow('ไฟล์แนบ', '<div class="otj-flist">' + files.map(function (f, i) {
        return '<div class="otj-file"><span class="otj-fname">' + icon('fileText', 'ic-sm') + ' ' +
          esc(f.name || 'ไฟล์แนบ') + '</span>' +
          '<button type="button" class="btn-icon" data-fp="' + i + '" aria-label="ดู">' + icon('eye') + '</button>' +
          '<button type="button" class="btn-icon" data-fd="' + i + '" aria-label="ดาวน์โหลด">' + icon('download') + '</button></div>';
      }).join('') + '</div>') : rhRow('ไฟล์แนบ', '—')) +
      '</div>' +
      '<h4 style="margin:16px 0 6px;font-size:14.5px">Timeline การอนุมัติ</h4>' +
      rhTimeline(d.approvals);
  }

  function rhOtHtml(d, id) {
    var st = rhStatus(d.status);
    var jobs = d.jobs || [];
    return '<div class="rh-det">' +
      rhRow('เลขที่คำขอ', '<code>' + esc(String(id).slice(0, 8)) + '</code>') +
      rhRow('ประเภทคำขอ', 'ขอทำงานล่วงเวลา (OT)') +
      rhRow('วันที่ทำ OT', esc(d.ot_date ? fmtDateDMY(d.ot_date) : '')) +
      rhRow('เวลา', esc(String(d.start_time || '').slice(0, 5) + ' – ' +
        String(d.end_time || '').slice(0, 5) + (d.spans_next_day ? ' (วันถัดไป)' : ''))) +
      rhRow('จำนวนชั่วโมง', (d.ot_hours != null ? d.ot_hours + ' ชม.' : '—')) +
      rhRow('สถานะ', '<span class="badge ' + st.c + '">' + st.t + '</span>') +
      (d.reason ? rhRow('เหตุผล', esc(d.reason)) : '') +
      '</div>' +
      (jobs.length
        ? '<h4 style="margin:16px 0 6px;font-size:14.5px">รายการงาน ' + jobs.length + ' รายการ</h4>' +
          '<div class="rh-det">' + jobs.map(function (j, i) {
            return '<div class="rh-drow"><span class="v">' +
              '<b>' + esc(j.job_no || j.job || '') + '</b>' +
              (j.job_type ? ' <span class="chip">' + esc(j.job_type) + '</span>' : '') +
              (j.detail ? '<br><small class="muted">' + esc(j.detail) + '</small>' : '') +
              (j.file_name
                ? '<br><span class="otj-file otj-file-inline"><span class="otj-fname">' +
                  icon('fileText', 'ic-sm') + ' ' + esc(j.file_name) + '</span>' +
                  '<button type="button" class="btn-icon" data-fp="' + i + '" aria-label="ดู">' + icon('eye') + '</button>' +
                  '<button type="button" class="btn-icon" data-fd="' + i + '" aria-label="ดาวน์โหลด">' + icon('download') + '</button></span>'
                : '') +
              '</span></div>';
          }).join('') + '</div>'
        : '') +
      '<h4 style="margin:16px 0 6px;font-size:14.5px">Timeline การอนุมัติ</h4>' +
      rhTimeline(d.approvals);
  }

  /* Public Feature Contract ของ Request Detail (ใช้ทั้งลาและ OT) */
  NJHR.features.requestDetail = { open: rhDetail };
