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
      /* เทียบกับคำขออื่นที่ยังมีผล (รออนุมัติ / อนุมัติแล้ว)
         แหล่งข้อมูล = otSbRows ที่หน้า #/ot โหลดมาจาก njhr_ot_list (Supabase) แล้ว
         เดิมวนจาก db.ots ใน localStorage ซึ่งเป็นคำขอเก่าที่ยังไม่อยู่ในฐานข้อมูล
         จึงบล็อกการยื่นใหม่ทั้งที่ฝั่งเซิร์ฟเวอร์ยังว่าง
         การตรวจนี้เป็นเพียงการเตือนล่วงหน้า — njhr_ot_submit ตรวจซ้ำและเป็นผู้ตัดสินจริง */
      var srv = otSbRows || [];
      for (var oi = 0; oi < srv.length; oi++) {
        var o = srv[oi];
        if (o.id === skipReqId) continue;
        if (['PENDING', 'APPROVED'].indexOf(String(o.status || '')) < 0) continue;   // ไม่อนุมัติ/ยกเลิก ไม่บล็อก
        var sp = otSpan({ date: String(o.ot_date || '').slice(0, 10),
                          start: String(o.start_time || '').slice(0, 5),
                          end: String(o.end_time || '').slice(0, 5),
                          nextDay: !!o.spans_next_day });
        if (sp && spans[i].s < sp.e && sp.s < spans[i].e) {
          errs[i] = 'ช่วงเวลารายการนี้ซ้อนกับคำขอ ' + (o.request_no || o.id) + ' ของคุณที่ยังมีผลอยู่';
          break;
        }
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
      '<form id="ot-f" novalidate>' +
      // ---------- ข้อมูลผู้ยื่นคำขอ: อ่านจาก Session แก้เองไม่ได้ ----------
      // ใช้แถบร่วม reqInfoBar() ตัวเดียวกับหน้า "ขอลางาน" จึงเป็นรูปแบบเดียวกันแน่นอน
      reqInfoBar(e, submittedAt, 'otf-no') +
      /* แถบ "กะทำงานของคุณ" ถูกถอดออกจาก UI แล้ว (ทำให้ Modal กระชับขึ้น)
         ข้อมูลกะ (sh) ยังถูกใช้งานครบเหมือนเดิม ไม่ได้ลบ Logic ใด ๆ
           · ค่าเริ่มต้นของช่อง "เวลาเริ่ม" = sh.end (เวลาเลิกงานของกะ)
           · คำเตือนเมื่อเวลา OT ซ้อนกับเวลาทำงานปกติของกะ (ovl ใน otfRecalc)
           · shTime(sh) ในข้อความคำเตือน */
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
          '<label class="btn btn-ghost btn-sm otj-attach" title="ไฟล์แนบไม่บังคับ">' + icon('paperclip', 'ic-sm') + ' แนบไฟล์' +
          '<input type="file" hidden multiple data-f="fileadd" accept=".pdf,.xls,.xlsx,.doc,.docx,image/*"></label>' +
          '<button type="button" class="btn btn-ghost btn-sm t-red" data-del="' + i + '">' + icon('trash', 'ic-sm') + ' ลบรายการ</button>' +
          '</span></span></div>';
      }).join('') : '<div class="muted otj-empty">ยังไม่มีรายการ — กด "เพิ่มรายการ" เพื่อระบุงาน OT (ไฟล์แนบไม่บังคับ · แนบได้หลายไฟล์ต่อรายการ)</div>';

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
        /* ไฟล์แนบที่เพิ่งแนบในฟอร์ม — ใช้ตัวช่วยชุดเดียวกับ Timeline
           👁 Preview ทับในหน้าเดิม · ⬇ ดาวน์โหลดพร้อม Toast ที่ปิดได้ */
        rowEl.querySelectorAll('[data-fview]').forEach(function (b) {
          b.onclick = function (ev) {
            ev.preventDefault();
            var f = jobs[i].files[parseInt(b.dataset.fview, 10)];
            if (f) filePreviewOpen(f.url || f.data, f.name);
          };
        });
        rowEl.querySelectorAll('[data-fdl]').forEach(function (b) {
          b.onclick = function (ev) {
            ev.preventDefault();
            var f = jobs[i].files[parseInt(b.dataset.fdl, 10)];
            if (f) fileDownload(f.url || f.data, f.name);
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

      /* ---------- ส่งคำขอไปที่ Supabase เท่านั้น: njhr_ot_submit ----------
         RPC ทำครบในตัวแล้ว: insert ot_requests + njhr_ot_jobs · ตรวจช่วงเวลาทับ ·
         หารชั่วโมงลงแต่ละรายการงาน · เขียน Audit · แจ้งเตือนผู้อนุมัติ
         จึงไม่ push ลง db.ots · ไม่ saveDB() · ไม่เรียก notifyApprovers()/audit() ซ้ำ

         p_jobs ใช้ชื่อคีย์ตาม Signature จริงของ RPC: job_code · detail · job_type · note
         ไฟล์แนบยังลงทะเบียนด้วย njhr_ot_attach_add ตัวเดิม โดยใช้ id จริงจากฐานข้อมูล */
      var d = {}; new FormData(document.getElementById('ot-f')).forEach(function (v, k) { d[k] = v; });
      var jobsPayload = jobs.map(function (j) {
        return { job_code: j.job.trim(), detail: j.detail.trim(), job_type: j.jobType, note: '' };
      });

      sbRpc('njhr_ot_submit', {
        p_token: sbToken(),
        p_date: h.date,
        p_start: h.start,
        p_end: h.end,
        p_next_day: !!h.nextDay,
        p_jobs: jobsPayload,
        p_reason: String(d.note || '').trim() || null
      }).then(function (res) {
        var otId = res && res.id;
        if (!otId) throw new Error('เซิร์ฟเวอร์ไม่ได้คืนเลขคำขอ');
        var hrs = (res && res.ot_hours != null) ? res.ot_hours : total;
        /* ลงทะเบียนไฟล์แนบกับคำขอจริงในฐานข้อมูล (job_no เรียงตามลำดับที่ส่งไป)
           ต้องรอให้ครบทุกไฟล์ก่อนปิดหน้าต่างและขึ้นข้อความสำเร็จ
           ไม่งั้นจะเกิดกรณี "แจ้งว่าสำเร็จแล้ว แต่ไฟล์แนบยังลงทะเบียนไม่ครบ"
           ซึ่งผู้อนุมัติจะเปิดดูแล้วไม่เห็นไฟล์โดยไม่มีใครรู้ */
        var attachJobs = [];
        jobs.forEach(function (j, i) {
          (j.files || []).forEach(function (f) {
            if (!f.path) return;
            attachJobs.push({ job: j, idx: i, file: f });
          });
        });

        var attachFail = [];
        return Promise.all(attachJobs.map(function (t) {
          return sbRpc('njhr_ot_attach_add', {
            p_token: sbToken(), p_ot_id: otId, p_job_no: t.idx + 1, p_job_code: t.job.job.trim(),
            p_file_name: t.file.name, p_file_path: t.file.path, p_file_url: t.file.url,
            p_file_size: t.file.size, p_content_type: t.file.type || null
          })['catch'](function (er) {
            /* เก็บไว้รายงานรวม ไม่ throw เพื่อให้ไฟล์ที่เหลือลงทะเบียนต่อจนครบ
               คำขอถูกบันทึกไปแล้วจริง จึงไม่ย้อนสถานะ แต่ต้องบอกผู้ใช้ตามจริง */
            console.error('[OT] njhr_ot_attach_add ล้มเหลว:', er);
            /* เก็บข้อมูลครบทุกช่องเพื่อให้แนบใหม่ได้โดยไม่ต้องอัปโหลดไฟล์ซ้ำ
               (ไฟล์อยู่บน Storage แล้ว ขาดแค่การลงทะเบียนใน njhr_ot_attachments) */
            attachFail.push({
              name: t.file.name, path: t.file.path, url: t.file.url,
              size: t.file.size, type: t.file.type,
              job_no: t.idx + 1, job_code: t.job.job.trim(),
              msg: (er && er.message) || 'ไม่ทราบสาเหตุ'
            });
          });
        })).then(function () {
          var noEl = document.getElementById('otf-no');
          if (noEl) { noEl.textContent = otId; noEl.classList.remove('muted'); }

          if (attachFail.length) {
            /* ---------- คำขอถูกสร้างแล้ว แต่ไฟล์แนบไม่ครบ ----------
               ห้ามเปิดปุ่ม "ส่งคำขอ" อีก เพราะจะเกิดคำขอ OT ซ้ำ
               (njhr_ot_submit ไม่มี Duplicate Guard — ยิงซ้ำได้แถวใหม่ทันที)
               จึงคง submitting = true ไว้ตลอด แล้วเปลี่ยนปุ่มเป็น "แนบไฟล์ใหม่"
               ซึ่งยิงเฉพาะ njhr_ot_attach_add ของไฟล์ที่ล้ม โดยใช้ ot_id เดิม */
            otAttachRecover(otId, attachFail, attachJobs.length, btn, err, listEl);
            return;
          }

          closeModal();
          /* กลุ่มยกเว้นผู้บริหาร njhr_ot_submit คืน status = APPROVED มาเลย
             จึงต้องขึ้นข้อความอนุมัติอัตโนมัติ ห้ามขึ้น "รออนุมัติ" */
          toast((String(res && res.status) === 'APPROVED'
              ? 'บันทึก OT เรียบร้อย · อนุมัติอัตโนมัติแล้ว · '
              : 'ส่งคำขอ OT แล้ว · ') +
            jobsPayload.length + ' รายการ รวม ' + hrs + ' ชม.' +
            (attachJobs.length ? ' · แนบไฟล์ ' + attachJobs.length + ' ไฟล์' : ''));
          refreshOtPending();            // ยื่นคำขอใหม่ → นับ Badge ใหม่
          viewOT(listEl);
        });
      })['catch'](function (ex) {
        submitting = false;
        btn.disabled = false; btn.innerHTML = 'ส่งคำขอ';
        console.error('[OT] njhr_ot_submit ล้มเหลว:', ex);
        err.textContent = (ex && ex.message) || 'ส่งคำขอไม่สำเร็จ';
      });
    };
  }

  /* ---------- แนบไฟล์ใหม่เฉพาะที่ล้มเหลว ----------
     ใช้คำขอ OT เดิมที่สร้างสำเร็จไปแล้ว จึงไม่มีทางเกิดคำขอซ้ำ
     ไฟล์ที่แนบสำเร็จรอบก่อนไม่ถูกส่งซ้ำ จึงไม่มีไฟล์แนบซ้ำ
     ปุ่ม "ส่งคำขอ" ไม่กลับมาอีกในหน้าต่างนี้ */
  function otAttachRecover(otId, failed, totalFiles, btn, err, listEl) {
    var pending = failed.slice();

    function paint() {
      err.innerHTML =
        '<b>สร้างคำขอ OT เลขที่ ' + esc(String(otId)) + ' แล้ว</b><br>' +
        'แต่แนบไฟล์ไม่สำเร็จ ' + pending.length + ' จาก ' + totalFiles + ' ไฟล์:<br>' +
        pending.map(function (x) { return '· ' + esc(x.name); }).join('<br>');
      btn.disabled = false;
      btn.innerHTML = 'แนบไฟล์ใหม่ (' + pending.length + ')';
    }
    paint();

    /* เปลี่ยนหน้าที่ของปุ่มเดิม — ไม่เรียก njhr_ot_submit อีกแล้ว */
    btn.onclick = function () {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> กำลังแนบไฟล์…';
      var stillFail = [];
      Promise.all(pending.map(function (t) {
        return sbRpc('njhr_ot_attach_add', {
          p_token: sbToken(), p_ot_id: otId, p_job_no: t.job_no, p_job_code: t.job_code,
          p_file_name: t.name, p_file_path: t.path, p_file_url: t.url,
          p_file_size: t.size, p_content_type: t.type || null
        })['catch'](function (er) {
          console.error('[OT] แนบไฟล์ใหม่ล้มเหลว:', er);
          stillFail.push(t);
        });
      })).then(function () {
        if (stillFail.length) {
          pending = stillFail;
          paint();
          return;
        }
        /* ครบแล้วจึงถือว่าสำเร็จ */
        closeModal();
        toast('แนบไฟล์ครบแล้ว · คำขอ OT เลขที่ ' + otId);
        refreshOtPending();
        viewOT(listEl);
      });
    };
  }

  /* Public Feature Contract ของ OT Form */
  NJHR.features.otForm = { open: otForm };
