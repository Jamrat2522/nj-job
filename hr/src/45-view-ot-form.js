  /* ================= OT FORM (แบบฟอร์มขอ OT + รายการงาน + ไฟล์แนบ) =================
     ย้ายมาจาก 35-view-ot.js โดยไม่แก้เนื้อใน
     สูตร OT · ประเภทงาน · Payload · Workflow — เหมือนเดิมทุกตัวอักษร
     โหลดเมื่อกด #ot-new เท่านั้น ================= */
  var OT_MAX_FILE = 5 * 1024 * 1024;                    // 5MB ต่อไฟล์ (เท่ากับฟอร์มขอลา)

  function otFileKind(f) {
    var n = String(f.name || '').toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp)$/.test(n)) return 'รูปภาพ';
    if (/\.pdf$/.test(n)) return 'PDF';
    if (/\.(docx?|rtf)$/.test(n)) return 'เอกสาร Word';
    if (/\.(xlsx?|csv)$/.test(n)) return 'ไฟล์ Excel';
    return f.type || 'ไฟล์แนบ';
  }

  function otFileSize(n) {
    var v = Number(n);
    if (!isFinite(v) || v <= 0) return '-';
    return v >= 1048576 ? (Math.round(v / 104857.6) / 10) + ' MB' : Math.max(1, Math.round(v / 1024)) + ' KB';
  }

  function otJobInfoValid(j) {
    return !!(String(j.job || '').trim() && j.jobType);
  }

  function otOverlapErrors(jobs, empId, skipReqId) {
    var errs = {};
    var spans = jobs.map(otSpan);
    for (var i = 0; i < jobs.length; i++) {
      if (!spans[i]) continue;
      for (var k = 0; k < i; k++) {
        if (!spans[k]) continue;
        if (spans[i].s < spans[k].e && spans[k].s < spans[i].e) {   // ต่อกันพอดีไม่ถือว่าซ้อน
          errs[i] = 'ช่วงเวลารายการนี้ซ้อนกับรายการที่ ' + (k + 1) + ' กรุณาตรวจสอบเวลาเริ่มต้นและเวลาสิ้นสุด';
          break;
        }
      }
      if (errs[i]) continue;
      // เทียบกับคำขออื่นที่ยังมีผล (รออนุมัติ / อนุมัติแล้ว)
      for (var oi = 0; oi < db.ots.length; oi++) {
        var o = db.ots[oi];
        if (o.empId !== empId || o.id === skipReqId) continue;
        if (['PENDING', 'APPROVED'].indexOf(o.status) < 0) continue;   // ไม่อนุมัติ/ยกเลิก ไม่บล็อก
        var hit = otJobsOf(o).some(function (oj) {
          var sp = otSpan(oj);
          return sp && spans[i].s < sp.e && sp.s < spans[i].e;
        });
        if (hit) { errs[i] = 'ช่วงเวลารายการนี้ซ้อนกับคำขอ ' + o.id + ' ของคุณที่ยังมีผลอยู่'; break; }
      }
    }
    return errs;
  }

  function otForm(listEl) {
    var e = currentEmp();
    var sh = shOf(e);
    var jobs = [];                       // รายการงาน: JOB / รายละเอียด / ประเภทงาน / ไฟล์แนบ
    var submitKey = uid('K');            // Idempotency Key กันส่งซ้ำ
    var submitting = false;
    var submittedAt = nowStamp();

    openModal('ขอ OT',
      '<form id="ot-f" novalidate>' +
      // ---------- ข้อมูลผู้ยื่นคำขอ: อ่านจาก Session แก้เองไม่ได้ ----------
      '<div class="ot-req-info">' +
      '<div><small>ผู้ยื่นคำขอ</small><b>' + esc(e.title + e.firstName + ' ' + e.lastName) + '</b></div>' +
      '<div><small>รหัสพนักงาน</small><b>' + esc(e.code) + '</b></div>' +
      '<div><small>แผนก</small><b>' + esc(dept(e.deptId)) + '</b></div>' +
      '<div><small>ตำแหน่ง</small><b>' + esc(e.position || '-') + '</b></div>' +
      '<div><small>วันที่ยื่นคำขอ</small><b>' + esc(submittedAt) + '</b></div>' +
      '<div><small>เลขที่คำขอ</small><b id="otf-no" class="muted">สร้างเมื่อบันทึกสำเร็จ</b></div>' +
      '</div>' +
      '<div class="ot-shift-info">' + icon('timer', 'ic-sm') + ' กะทำงานของคุณ: <b>' + esc(sh.name) + '</b> · เลิกงาน <b>' + esc(sh.end) + (sh.overnight ? ' (วันถัดไป)' : '') + '</b></div>' +
      // ---------- ข้อมูล OT: วันที่/เวลาของทั้งคำขอ ----------
      '<div class="otj-head"><b>ข้อมูล OT</b></div>' +
      '<div class="ot-main">' +
      '<label class="field"><span>วันที่ <i class="req">*</i></span>' +
      '<input type="date" name="otDate" id="otf-date" value="' + todayISO() + '"></label>' +
      '<label class="field"><span>เวลาเริ่ม <i class="req">*</i></span>' +
      '<input type="time" name="otStart" id="otf-start" value="' + esc(sh.end) + '"></label>' +
      '<label class="field"><span>เวลาสิ้นสุด <i class="req">*</i></span>' +
      '<input type="time" name="otEnd" id="otf-end" value="20:30"></label>' +
      '<label class="field"><span>สิ้นสุดวัน</span><select name="otNext" id="otf-next">' +
      '<option value="">วันเดียวกัน</option><option value="1">วันถัดไป</option></select></label>' +
      '<label class="field"><span>จำนวนชั่วโมง</span>' +
      '<input id="otf-hours" value="0" readonly tabindex="-1" aria-readonly="true"></label>' +
      '</div>' +
      '<div class="ot-endnote muted" id="otf-endnote"></div>' +
      // ---------- รายการงาน OT: เหลือเฉพาะข้อมูลของงาน ----------
      '<div class="otj-head"><b>รายการงาน OT</b><button type="button" class="btn btn-ghost btn-sm" id="otj-add">' + icon('plus') + ' เพิ่มรายการ</button></div>' +
      '<div class="otj-table"><div class="otj-cols">' +
      ['JOB', 'ประเภทงาน', 'จัดการ']
        .map(function (h) { return '<span>' + h + '</span>'; }).join('') +
      '</div><div id="otj-rows"></div></div>' +
      '<div class="otj-sum" id="otj-sum"></div>' +
      '<div class="ot-warn" id="otf-warn"></div>' +
      // ---------- หมายเหตุ: ล่างสุดเหนือปุ่ม ----------
      '<label class="field"><span>หมายเหตุเพิ่มเติม (ถ้ามี)</span>' +
      '<textarea name="note" rows="2" placeholder="ข้อความเพิ่มเติมของทั้งคำขอ — ไม่บังคับกรอก"></textarea></label>' +
      '<div class="form-error" id="otf-err" role="alert" style="white-space:pre-line"></div></form>',
      '<button class="btn btn-ghost" id="otf-cancel">ยกเลิก</button><button class="btn btn-primary" id="otf-send">ส่งคำขอ</button>',
      { wide: true, fullMobile: true });

    // ช่วงเวลาของทั้งคำขอ (ใช้ตัวช่วยเดิม otSpan/otJobHours ไม่แตะสูตร)
    function otHead() {
      var fm = document.getElementById('ot-f');
      function v(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? x.value : ''; }
      return { date: v('otDate'), start: v('otStart'), end: v('otEnd'), nextDay: !!v('otNext') };
    }
    function headHours() { return otJobHours(otHead()); }

    function renderSum() {
      var h = otHead(), hrs = headHours();
      var box = document.getElementById('otf-hours');
      if (box) box.value = hrs;
      var note = document.getElementById('otf-endnote');
      if (note) note.textContent = (h.nextDay && h.date)
        ? 'สิ้นสุดวันที่ ' + otDMY(otJobEndDate(h)) + ' เวลา ' + h.end : '';
      var files = jobs.reduce(function (n, j) { return n + j.files.length; }, 0);
      var okJobs = jobs.filter(otJobInfoValid).length;
      var sum = document.getElementById('otj-sum');
      if (sum) sum.innerHTML = '<b>รวม ' + jobs.length + ' รายการ</b> | <b>OT รวม ' + hrs + ' ชั่วโมง</b> | <b>ไฟล์แนบ ' + files + ' ไฟล์</b>' +
        (okJobs < jobs.length ? ' <small class="muted">(มี ' + (jobs.length - okJobs) + ' รายการที่ข้อมูลยังไม่ครบ)</small>' : '');
      // เตือนเมื่อ OT ซ้อนเวลาทำงานปกติของกะ (แจ้งเตือน ไม่บล็อก)
      var st = h.start;
      var ovl = st && (sh.overnight ? (st >= sh.start || st < sh.end) : (st >= sh.start && st < sh.end));
      var warnEl = document.getElementById('otf-warn');
      if (warnEl) warnEl.textContent = ovl ? 'เวลา OT ที่เลือกซ้อนกับเวลาทำงานปกติของกะ (' + shTime(sh) + ') กรุณาตรวจสอบ' : '';
    }

    function renderJobs() {
      var box = document.getElementById('otj-rows');
      box.innerHTML = jobs.length ? jobs.map(function (j, i) {
        return '<div class="otj-row" data-i="' + i + '">' +
          '<span class="otj-cell" data-l="JOB"><input data-f="job" placeholder="เลข JOB" value="' + esc(j.job) + '"></span>' +
          '<span class="otj-cell" data-l="ประเภทงาน"><select data-f="jobType"><option value="">— เลือก —</option>' +
          OT_JOB_TYPES.map(function (t) { return '<option' + (j.jobType === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></span>' +
          '<span class="otj-cell otj-files" data-l="จัดการ">' +
          '<div class="otj-flist">' + j.files.map(function (f, fi) {
            return '<div class="otj-file"><span class="otj-fname">' + icon('fileText', 'ic-sm') + ' ' + esc(f.name) +
              '<small class="muted"> · ' + esc(otFileKind(f)) + ' · ' + otFileSize(f.size) + '</small></span>' +
              '<button type="button" class="btn-icon" data-fview="' + fi + '" aria-label="ดู">' + icon('eye') + '</button>' +
              '<button type="button" class="btn-icon" data-fdl="' + fi + '" aria-label="ดาวน์โหลด">' + icon('download') + '</button>' +
              '<button type="button" class="btn-icon ic-red" data-fdel="' + fi + '" aria-label="ลบ">' + icon('x') + '</button></div>';
          }).join('') +
          (j.uploading ? '<small class="muted"><span class="spinner"></span> กำลังอัปโหลด ' + j.uploading + ' ไฟล์…</small>' : '') +
          '</div>' +
          '<span class="otj-actions">' +
          '<label class="btn btn-ghost btn-sm otj-attach">' + icon('paperclip', 'ic-sm') + ' แนบไฟล์' +
          '<input type="file" hidden multiple data-f="fileadd" accept=".pdf,.xls,.xlsx,.doc,.docx,image/*"></label>' +
          '<button type="button" class="btn btn-ghost btn-sm t-red" data-del="' + i + '">' + icon('trash', 'ic-sm') + ' ลบรายการ</button>' +
          '</span></span></div>';
      }).join('') : '<div class="muted otj-empty">ยังไม่มีรายการ — กด "เพิ่มรายการ" เพื่อระบุงาน OT (แนบไฟล์ได้หลายไฟล์ต่อรายการ)</div>';

      box.querySelectorAll('.otj-row').forEach(function (rowEl) {
        var i = parseInt(rowEl.dataset.i, 10);
        rowEl.querySelectorAll('[data-f]').forEach(function (inp) {
          if (inp.dataset.f === 'fileadd') {
            inp.onchange = function () {
              var pend = Array.prototype.slice.call(inp.files);
              var errEl = document.getElementById('otf-err');
              inp.value = '';
              if (!pend.length) return;
              if (!sbReady() || !sbToken()) { errEl.textContent = 'ยังไม่ได้เชื่อมต่อ Supabase — แนบไฟล์ไม่ได้'; return; }
              var ok = pend.filter(function (file) {
                if (file.size > OT_MAX_FILE) {
                  errEl.textContent = 'ไฟล์ ' + file.name + ' เกิน ' + (OT_MAX_FILE / 1048576) + 'MB — ไม่แนบ';
                  return false;
                }
                if (jobs[i].files.some(function (x) { return x.name === file.name && x.size === file.size; })) return false;
                return true;
              });
              if (!ok.length) { renderJobs(); renderSum(); return; }
              jobs[i].uploading = (jobs[i].uploading || 0) + ok.length;
              renderJobs(); renderSum();
              ok.forEach(function (file) {
                sbUploadOtFile(file, e.id).then(function (up) {
                  jobs[i].files.push({ name: up.name, size: up.size, type: up.type, url: up.url, path: up.path });
                }).catch(function (ex) {
                  errEl.textContent = 'แนบไฟล์ ' + file.name + ' ไม่สำเร็จ: ' + ((ex && ex.message) || ex);
                }).then(function () {
                  jobs[i].uploading = Math.max(0, (jobs[i].uploading || 1) - 1);
                  renderJobs(); renderSum();
                });
              });
            };
          } else {
            inp.oninput = function () { jobs[i][inp.dataset.f] = inp.value; inp.classList.remove('inv'); renderSum(); };
            inp.onchange = inp.oninput;
          }
        });
        rowEl.querySelectorAll('[data-fview]').forEach(function (b) {
          b.onclick = function () {
            var f = jobs[i].files[parseInt(b.dataset.fview, 10)];
            window.open(f.url || f.data, '_blank');
          };
        });
        rowEl.querySelectorAll('[data-fdl]').forEach(function (b) {
          b.onclick = function () {
            var f = jobs[i].files[parseInt(b.dataset.fdl, 10)];
            var a = document.createElement('a'); a.href = f.url || f.data; a.download = f.name;
            if (f.url) a.target = '_blank';
            document.body.appendChild(a); a.click(); a.remove();
          };
        });
        rowEl.querySelectorAll('[data-fdel]').forEach(function (b) {
          b.onclick = function () {
            var f = jobs[i].files[parseInt(b.dataset.fdel, 10)];
            jobs[i].files.splice(parseInt(b.dataset.fdel, 10), 1);
            renderJobs(); renderSum();
            if (f && f.path && f.registered) {
              sbRpc('njhr_ot_attach_delete', { p_token: sbToken(), p_path: f.path }).catch(function () { });
            }
          };
        });
      });
      box.querySelectorAll('[data-del]').forEach(function (b) {
        b.onclick = function () { jobs.splice(parseInt(b.dataset.del, 10), 1); renderJobs(); renderSum(); };
      });
      renderSum();
    }

    document.getElementById('otj-add').onclick = function () {
      jobs.push({ job: '', detail: '', jobType: '', files: [] });
      renderJobs();
    };
    renderJobs();
    ['otf-date', 'otf-start', 'otf-end', 'otf-next'].forEach(function (id) {
      var el2 = document.getElementById(id);
      if (el2) el2.onchange = renderSum;
    });
    document.getElementById('otf-cancel').onclick = closeModal;

    document.getElementById('otf-send').onclick = function () {
      var btn = this, err = document.getElementById('otf-err');
      err.textContent = '';
      if (submitting) return;
      if (!currentUser() || !sbToken()) { err.textContent = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'; return; }

      var h = otHead(), total = headHours();
      if (!h.date) { err.textContent = 'กรุณาเลือกวันที่'; return; }
      if (!h.start || !h.end) { err.textContent = 'กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด'; return; }
      if (!otSpan(h)) { err.textContent = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น หรือเลือก "สิ้นสุดวัน = วันถัดไป"'; return; }
      if (!jobs.length) { err.textContent = 'กรุณาเพิ่มรายการงาน OT อย่างน้อย 1 รายการ'; return; }
      if (jobs.some(function (j) { return j.uploading; })) {
        err.textContent = 'กำลังอัปโหลดไฟล์แนบ กรุณารอสักครู่แล้วกดส่งอีกครั้ง'; return;
      }
      // ตรวจช่องบังคับรายแถว (ขึ้นกรอบแดงตรงช่องที่ผิด)
      var bad = 0;
      document.querySelectorAll('#otj-rows .otj-row').forEach(function (rowEl) {
        var i = parseInt(rowEl.dataset.i, 10), j = jobs[i];
        ['job', 'jobType'].forEach(function (f) {
          var inp = rowEl.querySelector('[data-f="' + f + '"]');
          var empty = !String(j[f] || '').trim();
          inp.classList.toggle('inv', empty);
          if (empty) bad++;
        });
      });
      if (bad) { err.textContent = 'กรุณากรอก JOB · ประเภทงาน ให้ครบทุกรายการ'; return; }
      // ทับช่วงเวลากับคำขออื่นที่ยังมีผล (ตรรกะเดิม otOverlapErrors)
      var ov = otOverlapErrors([h], e.id, null);
      if (ov[0]) { err.textContent = ov[0]; return; }

      submitting = true;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      setTimeout(function () {
        try {
          if (db.ots.some(function (x) { return x.clientKey === submitKey; })) { closeModal(); return; }
          var d = {}; new FormData(document.getElementById('ot-f')).forEach(function (v, k) { d[k] = v; });
          // ทุกรายการงานใช้วันที่/เวลาชุดเดียวกันของคำขอ
          // ชั่วโมงถูกหารเฉลี่ยต่อรายการ เพื่อให้ผลรวมทุกที่ (เงินเดือน / REPORT ALL / รายงาน OT)
          // เท่ากับช่วงเวลาจริงพอดี ไม่ถูกนับซ้ำตามจำนวน JOB
          var per = Math.round((total / jobs.length) * 100) / 100;
          var jobRows = jobs.map(function (j, i) {
            return {
              no: i + 1, job: j.job.trim(), detail: j.detail.trim(), jobType: j.jobType,
              date: h.date, start: h.start, end: h.end,
              nextDay: !!h.nextDay, endDate: otJobEndDate(h),
              // รายการสุดท้ายรับเศษที่เหลือ ผลรวมจึงตรงกับ total เป๊ะ
              hours: i === jobs.length - 1
                ? Math.round((total - per * (jobs.length - 1)) * 100) / 100 : per,
              files: j.files
            };
          });
          var o = {
            id: uid('OT'), empId: e.id, clientKey: submitKey,
            empCodeSnap: e.code, deptSnap: dept(e.deptId), positionSnap: e.position || '',
            date: h.date, start: h.start, end: h.end, hours: total,
            spansNextDay: !!h.nextDay,
            reason: String(d.note || '').trim(),
            note: String(d.note || '').trim(),
            jobs: jobRows,
            status: 'PENDING', createdAt: submittedAt,
            timeline: [{ at: submittedAt, by: e.firstName + ' ' + e.lastName, action: 'ส่งคำขอ', note: '' }]
          };
          db.ots.push(o);
          notifyApprovers('คำขอ OT ใหม่', e.firstName + ' ขอ OT ' + jobRows.length + ' รายการ รวม ' + total + ' ชม.', '#/approvals');
          audit('OT_REQ', 'ส่งคำขอ OT ' + o.id + ' (' + jobRows.length + ' รายการงาน · ' + total + ' ชม.)');
          saveDB();
          if (!saveDbGuard()) {
            db.ots = db.ots.filter(function (x) { return x.id !== o.id; });
            submitting = false; btn.disabled = false; btn.innerHTML = 'ส่งคำขอ';
            err.textContent = 'บันทึกคำขอไม่สำเร็จ: พื้นที่จัดเก็บในเบราว์เซอร์เต็ม';
            return;
          }
          jobRows.forEach(function (j) {
            (j.files || []).forEach(function (f) {
              if (!f.path) return;
              sbRpc('njhr_ot_attach_add', {
                p_token: sbToken(), p_ot_id: o.id, p_job_no: j.no, p_job_code: j.job,
                p_file_name: f.name, p_file_path: f.path, p_file_url: f.url,
                p_file_size: f.size, p_content_type: f.type || null
              }).then(function () { f.registered = true; saveDB(); }).catch(function () { });
            });
          });
          var noEl = document.getElementById('otf-no');
          if (noEl) { noEl.textContent = o.id; noEl.classList.remove('muted'); }
          closeModal();
          toast('ส่งคำขอ OT แล้ว เลขที่ ' + o.id + ' · ' + jobRows.length + ' รายการ รวม ' + total + ' ชม.');
          viewOT(listEl);
        } catch (ex) {
          submitting = false;
          btn.disabled = false; btn.innerHTML = 'ส่งคำขอ';
          err.textContent = 'บันทึกไม่สำเร็จ: ' + ((ex && ex.message) || ex);
        }
      }, 0);
    };
  }

  /* Public Feature Contract ของ OT Form */
  NJHR.features.otForm = { open: otForm };
