  /* ================= SHARED: REQUEST (LEAVE / OT) RUNTIME =================
     ย้ายมาจาก 09 · 10 · 11 โดยไม่แก้เนื้อใน
     ใช้ร่วมกันโดย attendance · requests-leave · ot · attendance-report · compatibility ================= */
  var rqState = { seq: 0, bal: [], err: '' };

  var RQ_CARDS = [
    { key: 'sick',  cls: 'rq-sick', em: '\u{1F912}', label: 'ลาป่วย',  match: ['ป่วย', 'SICK'] },
    { key: 'biz',   cls: 'rq-biz',  em: '\u{1F464}', label: 'ลากิจ',   match: ['กิจ', 'PERSONAL', 'BUSINESS'] },
    { key: 'vac',   cls: 'rq-vac',  em: '\u{1F334}', label: 'พักร้อน', match: ['พักร้อน', 'VACATION', 'ANNUAL'] }
  ];

  /* ---------- กติกาแสดงยอดวันลาในหน้า Leave ----------
     ทุกประเภทแสดงเฉพาะ "ลาแล้ว X วัน" จาก used (นับเฉพาะ APPROVED — pending ไม่นับ)
     มีเพียง "ลาพักร้อน" ประเภทเดียวที่แสดง "คงเหลือ X วัน" จาก remaining เพิ่มได้
     ไม่แสดง quota ("สิทธิ์ X วัน/ปี") ของประเภทใดเลย
     เป็นการเปลี่ยนเฉพาะการแสดงผล ไม่แตะ RPC และไม่แตะการคำนวณสิทธิ์ */
  function lvIsVacation(code) {
    var t = String(code || '').toUpperCase();
    return t.indexOf('VACATION') >= 0 || t.indexOf('ANNUAL') >= 0 || t.indexOf('พักร้อน') >= 0;
  }

  /* จำนวนวันที่ลาไปแล้วจริง — used เท่านั้น ไม่รวม pending
     ไม่มีข้อมูล = 0 (แสดง "ลาแล้ว 0 วัน" ไม่ซ่อน) */
  function lvUsedDays(r) {
    var n = Number(r && r.used);
    return isFinite(n) ? Math.round(n * 10) / 10 : 0;
  }

  /* คงเหลือ — ใช้กับลาพักร้อนเท่านั้น · null = ไม่จำกัดสิทธิ์ */
  function lvRemainDays(r) {
    if (!r || r.remaining == null) return null;
    var n = Number(r.remaining);
    return isFinite(n) ? Math.round(n * 10) / 10 : null;
  }

  function rqPick(rows, card) {
    for (var i = 0; i < rows.length; i++) {
      var t = String(rows[i].leave_type || '').toUpperCase();
      for (var j = 0; j < card.match.length; j++) {
        if (t.indexOf(String(card.match[j]).toUpperCase()) >= 0) return rows[i];
      }
    }
    return null;
  }

  function epNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }   // กัน NaN/undefined



  /* เลขที่คำขอ: ใช้ request_no จากฐานข้อมูล (YYMMDD-0001) เป็นหลัก
     คำขอเก่าที่ยังไม่มีเลข (request_no = null) ถอยไปใช้รูปแบบเดิม LV-XXXXXX
     รับได้ทั้ง object ของคำขอ และ id เดี่ยว ๆ เพื่อไม่ต้องแก้จุดเรียกทุกจุด */
  function lvCode(x) {
    if (x && typeof x === 'object') {
      var no = x.request_no || x.requestNo;
      if (no) return String(no);
      x = x.id;
    }
    return 'LV-' + String(x || '').slice(0, 6).toUpperCase();
  }

  /* ---------- แถบข้อมูลผู้ยื่นคำขอ (ใช้ร่วมกันทั้งหน้า "ขอลางาน" และ "ขอ OT") ----------
     รูปแบบเดียวกันทั้งสองหน้า เรียงซ้าย → ขวา
       เลขที่คำขอ · วันที่ยื่น · ผู้ยื่น · รหัส · แผนก
     Desktop = แถวเดียว 5 ช่อง · Mobile = ไหลตามพื้นที่ (ลำดับเดิม)

     เลขที่คำขอก่อนบันทึกสำเร็จแสดง "—" แล้วให้ Flow เดิมเขียนทับด้วยเลขจริง
     ผ่าน element id ที่ส่งเข้ามา (lvf-no / otf-no) — ไม่แตะ Logic การออกเลข

     "ตำแหน่ง" ถูกซ่อนเฉพาะ UI ของสองหน้านี้เท่านั้น
     ข้อมูลใน employees · RPC · หน้าโปรไฟล์ ไม่ถูกแตะ

     ใช้ข้อมูลจริงจาก currentEmp() ที่ระบบโหลดอยู่ ไม่ hardcode */
  function reqInfoBar(e, submittedAt, noId) {
    var nm = ((e.title || '') + (e.firstName || '') + ' ' + (e.lastName || '')).trim() || '—';
    var dp = (e.deptId ? dept(e.deptId) : '') || e.deptName || '';
    if (!dp || dp === '\u2014') dp = '—';
    function cell(cls, label, val, id) {
      return '<div class="' + cls + '"><small>' + label + '</small>' +
        '<b' + (id ? ' id="' + id + '" class="muted"' : '') + '>' + esc(val) + '</b></div>';
    }
    return '<div class="ot-req-info">' +
      cell('ri-no', 'เลขที่คำขอ', '—', noId) +
      cell('ri-at', 'วันที่ยื่น', submittedAt) +
      cell('ri-nm', 'ผู้ยื่น', nm) +
      cell('ri-cd', 'รหัส', e.code || '—') +
      cell('ri-dp', 'แผนก', dp) +
      '</div>';
  }

  /* ผูกปุ่มดู/ดาวน์โหลดไฟล์แนบภายในกล่องที่กำหนด
     ใช้ filePreviewOpen() และ fileDownload() จาก core — ไม่เปิดแท็บใหม่ ไม่ reload
     รับ list ของไฟล์เพื่ออ่าน url/ชื่อจริง ไม่ต้องฝัง URL ลงใน attribute */
  function bindFileButtons(box, files) {
    if (!box) return;
    box.querySelectorAll('[data-fp]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.preventDefault();
        var f = files[parseInt(b.dataset.fp, 10)];
        if (f) filePreviewOpen(f.url, f.name);
      };
    });
    box.querySelectorAll('[data-fd]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.preventDefault();
        var f = files[parseInt(b.dataset.fd, 10)];
        if (f) fileDownload(f.url, f.name);
      };
    });
  }

  function showTimeline(kind, id) {
    var arr = kind === 'leave' ? db.leaves : kind === 'ot' ? db.ots : db.corrections;
    var it = arr.find(function (x) { return x.id === id; });
    if (!it) return;
    var jobsHTML = (kind === 'ot') ? otJobsHTML(it) : '';
    var noteHTML = (kind === 'ot' && it.note) ? '<p class="muted note">หมายเหตุรวม: ' + esc(it.note) + '</p>' : '';
    openModal('Timeline · ' + esc(id),
      noteHTML + jobsHTML +
      '<div class="timeline">' + it.timeline.map(function (tl) {
        var cls = tl.action.indexOf('อนุมัติ') === 0 ? 'tl-ok' : tl.action.indexOf('ไม่อนุมัติ') === 0 ? 'tl-bad' : tl.action.indexOf('ยกเลิก') === 0 ? 'tl-mut' : 'tl-info';
        return '<div class="tl-item ' + cls + '"><span class="tl-dot"></span><div><b>' + esc(tl.action) + '</b><small>' + esc(tl.by) + ' · ' + esc(tl.at) + '</small>' + (tl.note ? '<p>' + esc(tl.note) + '</p>' : '') + '</div></div>';
      }).join('') + '</div>',
      '<button class="btn btn-ghost" id="tl-close">ปิด</button>');
    document.getElementById('tl-close').onclick = closeModal;
    if (kind === 'ot') otBindJobFiles(document.getElementById('modal-root'), it);
  }

  function lvShowTimeline(id) {
    openModal('Timeline · ' + esc(lvCode(id)), '<div class="muted">กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="tl-close">ปิด</button>');
    var closeBtn = document.getElementById('tl-close');
    if (closeBtn) closeBtn.onclick = closeModal;
    return sbRpc('njhr_leave_detail', { p_token: sbToken(), p_leave_id: id }).then(function (d) {
      var body = document.querySelector('#modal-root .modal-body');
      if (!body || !d) return;
      var files = d.attachments || [];
      var tl = (d.approvals || []).slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
      body.innerHTML =
        /* ปุ่ม 👁 เปิด Preview ทับในหน้าเดิม (ไม่เปิดแท็บใหม่) · ปุ่ม ⬇ ดาวน์โหลดพร้อม Toast
           ผูก Event ด้วย data-fp / data-fd หลัง render — ไม่ใช้ <a target="_blank"> อีกต่อไป */
        (files.length ? '<div class="otj-flist">' + files.map(function (f, i) {
          return '<div class="otj-file"><span class="otj-fname">' + icon('fileText', 'ic-sm') + ' ' + esc(f.name) + '</span>' +
            '<button type="button" class="btn-icon" data-fp="' + i + '" aria-label="ดู">' + icon('eye') + '</button>' +
            '<button type="button" class="btn-icon" data-fd="' + i + '" aria-label="ดาวน์โหลด">' + icon('download') + '</button></div>';
        }).join('') + '</div>' : '') +
        '<div class="timeline">' + tl.map(function (x) {
          var act = x.action_th || { SUBMIT: 'ส่งคำขอ', APPROVE: 'อนุมัติ', REJECT: 'ไม่อนุมัติ', INFO: 'ขอข้อมูลเพิ่ม', CANCEL: 'ยกเลิกคำขอ' }[x.action] || x.action;
          var cls = x.action === 'APPROVE' ? 'tl-ok' : x.action === 'REJECT' ? 'tl-bad' : x.action === 'CANCEL' ? 'tl-mut' : 'tl-info';
          return '<div class="tl-item ' + cls + '"><span class="tl-dot"></span><div><b>' + esc(act) + '</b>' +
            '<small>' + esc(x.by_name || '') + ' · ' + esc(x.at || '') + '</small>' +
            (x.note ? '<p>' + esc(x.note) + '</p>' : '') + '</div></div>';
        }).join('') + '</div>';
      bindFileButtons(body, files);
    }).catch(function (er) {
      var body = document.querySelector('#modal-root .modal-body');
      if (body) body.innerHTML = '<div class="form-error">' + esc(er.message || 'โหลดรายละเอียดไม่สำเร็จ') + '</div>';
    });
  }

  function otJobsHTML(it) {
    var js = otJobsOf(it);                       // คำขอเก่าถูกแปลงเป็น 1 รายการอัตโนมัติ (อ่านอย่างเดียว)
    if (!js.length) return '';
    var e0 = emp(it.empId);
    return '<div class="otj-view">' +
      '<div class="otj-vhead"><b>รายการงาน OT (' + js.length + ' รายการ)</b>' +
      '<small class="muted">' + esc(it.id) + ' · ' + esc(e0 ? e0.code : '') + ' ' + esc(empName(it.empId)) +
      ' · ' + esc(it.deptSnap || dept(e0 ? e0.deptId : '')) +
      ' · ' + esc(it.positionSnap || (e0 ? e0.position : '') || '-') +
      ' · ยื่น ' + esc(it.createdAt || '') + '</small></div>' +
      (it.note ? '<p class="otj-note">หมายเหตุรวม: ' + esc(it.note) + '</p>' : '') +
      js.map(function (j) {
        var files = j.files || [];
        return '<div class="otj-vrow"><div class="otj-vtop">' +
          '<span class="chip">รายการที่ ' + j.no + '</span><b>JOB ' + esc(j.job) + '</b>' +
          (j.jobType ? '<span class="chip chip-info">' + esc(j.jobType) + '</span>' : '') +
          '<span class="muted">' + otDMY(j.date) + ' · ' + esc(j.start) + ' – ' + esc(j.end) +
          (j.nextDay ? ' (สิ้นสุดวันที่ ' + otDMY(j.endDate || otJobEndDate(j)) + ')' : '') + '</span>' +
          '<span class="chip">' + (isFinite(j.hours) ? j.hours : otJobHours(j)) + ' ชม.</span></div>' +
          (j.detail ? '<p class="otj-vdetail">' + esc(j.detail) + '</p>' : '') +
          (files.length
            ? '<div class="otj-flist"><small class="muted">ไฟล์แนบของรายการที่ ' + j.no +
              ' (JOB ' + esc(j.job) + ') · ' + files.length + ' ไฟล์</small>' +
              files.map(function (f, fi) {
                return '<div class="otj-file"><span class="otj-fname">' + icon('fileText', 'ic-sm') + ' ' + esc(f.name) + '</span>' +
                  '<button type="button" class="btn-icon" data-jview="' + j.no + '-' + fi + '" aria-label="ดู">' + icon('eye') + '</button>' +
                  '<button type="button" class="btn-icon" data-jdl="' + j.no + '-' + fi + '" aria-label="ดาวน์โหลด">' + icon('download') + '</button></div>';
              }).join('') + '</div>'
            : '<small class="muted">ไม่มีไฟล์แนบในรายการนี้</small>') + '</div>';
      }).join('') +
      '<div class="otj-sum">รวม <b>' + js.length + '</b> รายการ | OT รวม <b>' + otReqHours(it) +
      '</b> ชั่วโมง | ไฟล์แนบ <b>' + otFileCount(it) + '</b> ไฟล์</div></div>';
  }

  function otJobsOf(o) {
    if (o && o.jobs && o.jobs.length) return o.jobs;
    if (!o) return [];
    return [{
      no: 1, job: o.task ? String(o.task) : '(ไม่ระบุ JOB)', detail: o.reason || '', jobType: '',
      date: o.date, start: o.start, end: o.end, nextDay: false,
      hours: epNum(o.hours), files: o.file ? [{ name: o.file, data: '' }] : [], legacy: true
    }];
  }

  function otJobHours(j) {
    var sp = otSpan(j);
    return sp ? Math.round((sp.e - sp.s) / 60 * 100) / 100 : 0;
  }

  function otJobEndDate(j) { return j.nextDay ? otNextDay(j.date) : j.date; }

  function otMin(t) { var p = String(t || '').split(':'); return p.length >= 2 ? (+p[0]) * 60 + (+p[1]) : null; }

  function otDayIdx(iso) { var d = new Date(String(iso) + 'T00:00:00'); return isFinite(d) ? Math.round(d.getTime() / 86400000) : null; }

  function otNextDay(iso) {
    var d = new Date(String(iso) + 'T00:00:00');
    if (!isFinite(d)) return iso;
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function otSpan(j) {
    var di = otDayIdx(j.date), st = otMin(j.start), en = otMin(j.end);
    if (di === null || st === null || en === null) return null;
    var s0 = di * 1440 + st;
    var e0 = di * 1440 + en + (j.nextDay ? 1440 : 0);
    if (e0 <= s0) return null;                       // เวลาไม่ถูกต้อง (ต้องติ๊ก "สิ้นสุดวันถัดไป")
    return { s: s0, e: e0 };
  }

  // แสดงวันที่รูปแบบ DD/MM/YYYY — ใช้ตัวแปลงกลาง fmtDateDMY() ตัวเดียวของระบบ
  function otDMY(iso) { return fmtDateDMY(iso); }

  function bindReqCardActions(el, kind) {
    el.querySelectorAll('[data-detail]').forEach(function (b) {
      b.onclick = function () { showTimeline(kind, this.dataset.detail); };
    });
    el.querySelectorAll('[data-cancel]').forEach(function (b) {
      b.onclick = function () {
        var id = this.dataset.cancel;
        confirmDialog('ยกเลิกคำขอ', 'ต้องการยกเลิกคำขอ <b>' + esc(id) + '</b> ใช่หรือไม่', 'ยกเลิกคำขอ', function () {
          var arr = kind === 'leave' ? db.leaves : db.ots;
          var it = arr.find(function (x) { return x.id === id; });
          it.status = 'CANCELLED';
          it.timeline.push({ at: nowStamp(), by: empName(it.empId), action: 'ยกเลิกคำขอ', note: '' });
          audit('CANCEL', 'ยกเลิก ' + id); saveDB(); toast('ยกเลิกคำขอแล้ว', 'info'); render();
        }, true);
      };
    });
  }

  function otBindJobFiles(scope, it) {
    if (!scope || !it) return;
    var js = otJobsOf(it);
    function jf(key) {
      var p = String(key).split('-');
      var j = js.find(function (x) { return x.no === parseInt(p[0], 10); });
      return j && j.files && j.files[parseInt(p[1], 10)];
    }
    /* ไฟล์แนบของรายการงาน OT — ใช้ตัวช่วยชุดเดียวกับไฟล์แนบใบลา
       👁 เปิด Preview ทับในหน้าเดิม (เดิมใช้ window.open เปิดแท็บใหม่)
       ⬇ ดาวน์โหลดพร้อม Toast ที่ปิดได้ (เดิมคลิก <a download> เงียบ ๆ ไม่มีการแจ้งผล) */
    scope.querySelectorAll('[data-jview]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.preventDefault();
        var f = jf(b.dataset.jview);
        if (f) filePreviewOpen(f.url || f.data, f.name);
      };
    });
    scope.querySelectorAll('[data-jdl]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.preventDefault();
        var f = jf(b.dataset.jdl);
        if (f) fileDownload(f.url || f.data, f.name);
      };
    });
  }

  function otReqHours(o) {
    var js = otJobsOf(o);
    return Math.round(js.reduce(function (n, j) { return n + (isFinite(j.hours) ? Number(j.hours) : otJobHours(j)); }, 0) * 100) / 100;
  }

  function otFileCount(o) {
    return otJobsOf(o).reduce(function (n, j) { return n + ((j.files && j.files.length) || 0); }, 0);
  }
