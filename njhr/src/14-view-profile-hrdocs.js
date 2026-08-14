  /* ============================================================
     หน้าโปรไฟล์มือถือ — ตามภาพอ้างอิงที่อนุมัติแล้ว
     พื้นกรมท่าเต็มหน้า · การ์ดพนักงานขาว · เมนู 6 รายการ
     ใช้ Route จริงชุดเดียวกับ Drawer เดิม ไม่มี Route ใหม่:
       ข้อมูลส่วนตัว    #/profile?sec=detail (การ์ดข้อมูลติดต่อในหน้าเดียวกัน)
       ปฏิทินองค์กร     #/calendar
       เอกสารของฉัน     #/hr-docs
       สลิปเงินเดือน     #/epayslip
       ประวัติการลงเวลา  #/attendance?sec=history
       ออกจากระบบ      doLogout() ตัวเดิม ผ่าน confirmDialog
     บล็อกนี้เป็น .only-mobile — Desktop ไม่เปลี่ยนแม้แต่บรรทัดเดียว
     ============================================================ */
  var PF_MENU = [
    ['detail',       '\u{1F464}', 'ข้อมูลส่วนตัว',     'm-blue',   ''],
    ['#/calendar',   '\u{1F4C5}', 'ปฏิทินองค์กร',      'm-sky',    ''],
    ['#/hr-docs',    '\u{1F4C1}', 'เอกสารของฉัน',      'm-purple', ''],
    ['#/epayslip',   '\u{1F4B5}', 'สลิปเงินเดือน',      'm-green',  ''],
    ['#/attendance?sec=history', '\u{1F553}', 'ประวัติการลงเวลา', 'm-indigo', ''],
    ['logout',       '\u{1F6AA}', 'ออกจากระบบ',        'm-red',    'pf-m-out']
  ];

  /* ============================================================
     รูปโปรไฟล์บนมือถือ
     ------------------------------------------------------------
     ต่อระบบแฟ้มพนักงานเดิมทั้งหมด ไม่สร้าง Storage ใหม่
       Edge Function njhr-emp-file  action = upload-url / download-url
       RPC njhr_empfile_save        เก็บทะเบียนไฟล์ + ทำ Versioning ให้เอง
       category = PERSONAL · doc_kind = PHOTO
     employee_id มาจาก njhr_me_get เท่านั้น (ผูกกับ Token) ไม่รับจาก URL
     ============================================================ */
  var PF_PHOTO_MAX = 10 * 1024 * 1024;        // ตรงกับ EMPF_MAX และ MAX_SIZE ใน Edge Function
  var PF_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];

  /* ---------- ข้อผิดพลาดของระบบรูปโปรไฟล์ ----------
     ⚠ ห้ามปล่อยข้อความดิบของเบราว์เซอร์ (เช่น "Load failed" ของ Safari/iPhone,
       "Failed to fetch" ของ Chrome) ออกหน้าจอ เพราะผู้ใช้อ่านไม่รู้เรื่อง
       และไม่บอกว่าพังขั้นไหน
     ทุกข้อผิดพลาดจะถูกติดป้ายขั้นตอน (pfStep) ไว้ก่อน แล้วแปลงเป็นข้อความไทยตอนแสดงผล
     รายละเอียดจริงลง Console เท่านั้น และต้องไม่มี token / signed url / key หลุดออกมา */
  /* ข้อความที่ผู้ใช้เห็น — ต้องเป็นภาษาไทยเสมอ
     ถ้าเป็นข้อความอังกฤษดิบของเบราว์เซอร์ ("Load failed" / "Failed to fetch" / "NetworkError")
     ให้แทนด้วยข้อความที่บอกได้ว่าติดที่การเชื่อมต่อบริการอัปโหลด */
  function pfPhotoUserMsg(ex) {
    var m = (ex && ex.message) || '';
    if (/[\u0E00-\u0E7F]/.test(m)) return m;
    return 'ไม่สามารถเชื่อมต่อบริการอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง';
  }

  function pfStepErr(step, msg, cause) {
    var e = new Error(msg);
    e.pfStep = step;
    if (cause) e.pfCause = cause;
    return e;
  }

  /* ล้างค่าที่เป็นความลับออกก่อนเขียน Console — กัน Signed URL / token / key รั่ว */
  function pfSafeDetail(x) {
    var t = (x && (x.message || x.error)) ? String(x.message || x.error) : String(x || '');
    return t.replace(/https?:\/\/[^\s"']+/gi, '[url]')
            .replace(/(token|apikey|key|signature|jwt)=[^&\s"']*/gi, '$1=[hidden]')
            .replace(/eyJ[A-Za-z0-9_.-]{10,}/g, '[token]')
            .slice(0, 300);
  }

  function pfEmpFn(body) {
    if (!sbReady()) {
      return Promise.reject(pfStepErr('CONFIG', 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'));
    }
    return fetch(SB.url + '/functions/v1/njhr-emp-file', {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: sbToken() }, body || {}))
    })['catch'](function (ne) {
      /* fetch โยน TypeError เมื่อต่อไม่ติด — รวมกรณีที่ Edge Function ยังไม่ถูก Deploy
         Safari แสดงเป็น "Load failed" · Chrome แสดงเป็น "Failed to fetch" */
      throw pfStepErr('EDGE_UNREACHABLE',
        'ไม่สามารถเชื่อมต่อบริการอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง', ne);
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = {};
        try { d = JSON.parse(t); } catch (e) { d = {}; }
        if (!r.ok) {
          throw pfStepErr('EDGE_ERROR',
            d.error || 'เข้าถึงไฟล์ไม่สำเร็จ (' + r.status + ')', 'HTTP ' + r.status);
        }
        return d;
      });
    });
  }

  function pfPhotoMsg(txt, isErr) {
    var box = document.getElementById('pfm-photo-msg');
    if (!box) return;
    if (!txt) { box.hidden = true; box.textContent = ''; return; }
    box.hidden = false;
    box.className = 'pfm-photo-msg' + (isErr ? ' is-err' : '');
    box.textContent = txt;
  }

  /* หารูปล่าสุดจากแฟ้มพนักงาน
     ⚠ ต้องค้นเสมอ ไม่ดูจาก employees.photo_url เพราะ njhr_empfile_save ไม่ได้เขียนคอลัมน์นั้น */
  function pfFindPhoto(empId) {
    return sbRpc('njhr_empfile_list', { p_token: sbToken(), p_employee: empId })
      .then(function (r) {
        var d = (r && r.data) || {};
        var files = Array.isArray(d.files) ? d.files : [];
        var list = files.filter(function (f) {
          return String(f.category) === 'PERSONAL' && String(f.doc_kind) === 'PHOTO' &&
            !f.deleted_at;
        });
        list.sort(function (a, b) {
          return String(b.updated_at || b.uploaded_at || '')
            .localeCompare(String(a.updated_at || a.uploaded_at || ''));
        });
        return list[0] || null;
      })['catch'](function (er) {
        console.error('[PROFILE] njhr_empfile_list ล้มเหลว:', er);
        return null;                       // หน้าโปรไฟล์ต้องไม่พังเพราะหารูปไม่เจอ
      });
  }

  function pfShowPhoto(url) {
    var box = document.getElementById('pfm-ava');
    if (!box || !url) return;
    var old = box.querySelector('.avatar, .pfm-photo-img');
    var img = document.createElement('img');
    img.className = 'pfm-photo-img';
    img.src = url;
    img.alt = 'รูปโปรไฟล์';
    img.onerror = function () { pfPhotoMsg('เปิดรูปโปรไฟล์ไม่สำเร็จ', true); };
    if (old) box.replaceChild(img, old); else box.insertBefore(img, box.firstChild);
  }

  /* ---------- Preview Local (ยังไม่ได้อัปโหลด) ----------
     ⚠ ต้องแยกให้ชัดจากรูปที่อัปโหลดสำเร็จแล้ว
       Preview ใช้ class เพิ่ม .is-preview + ข้อความกำกับว่ากำลังอัปโหลด
       ถ้าอัปโหลดล้มเหลว ต้องคืนรูปเดิมกลับ ห้ามปล่อยให้ Preview ค้างเหมือนสำเร็จ */
  var pfAvaBak = null;                     // HTML ของรูป/Avatar เดิม ไว้คืนเมื่อล้มเหลว
  var pfPreviewUrl = null;                 // objectURL ที่ต้อง revoke

  function pfShowPreview(file) {
    var box = document.getElementById('pfm-ava');
    if (!box) return;
    var old = box.querySelector('.avatar, .pfm-photo-img');
    pfAvaBak = old ? old.outerHTML : null;
    pfClearPreviewUrl();
    try { pfPreviewUrl = URL.createObjectURL(file); } catch (e) { pfPreviewUrl = null; }
    if (!pfPreviewUrl) return;
    var img = document.createElement('img');
    img.className = 'pfm-photo-img is-preview';
    img.src = pfPreviewUrl;
    img.alt = 'ตัวอย่างรูปที่เลือก (ยังไม่ได้อัปโหลด)';
    if (old) box.replaceChild(img, old); else box.insertBefore(img, box.firstChild);
  }

  function pfClearPreviewUrl() {
    if (!pfPreviewUrl) return;
    try { URL.revokeObjectURL(pfPreviewUrl); } catch (e) {}
    pfPreviewUrl = null;
  }

  /* คืนรูปเดิมกลับเมื่ออัปโหลดล้มเหลว — ไม่ให้ผู้ใช้เข้าใจผิดว่าเปลี่ยนรูปสำเร็จ */
  function pfRestoreAva() {
    var box = document.getElementById('pfm-ava');
    pfClearPreviewUrl();
    if (!box || pfAvaBak == null) { pfAvaBak = null; return; }
    var cur = box.querySelector('.avatar, .pfm-photo-img');
    if (cur) {
      var tmp = document.createElement('div');
      tmp.innerHTML = pfAvaBak;
      if (tmp.firstChild) box.replaceChild(tmp.firstChild, cur);
    }
    pfAvaBak = null;
  }

  var pfPhotoCur = null;                   // ไฟล์ PHOTO ปัจจุบัน ใช้ทำ Versioning ตอนเปลี่ยนรูป
  var pfPhotoBusy = false;

  function pfPhotoLoad(empId) {
    return pfFindPhoto(empId).then(function (f) {
      pfPhotoCur = f;
      if (!f) return null;                 // ไม่มีรูป → ใช้ avatarHTML() เดิมต่อไป
      return pfEmpFn({ action: 'download-url', file_id: f.id })
        .then(function (d) { if (d && d.url) pfShowPhoto(d.url); return d; })
        ['catch'](function (er) {
          console.error('[PROFILE] ขอลิงก์รูปไม่สำเร็จ:', er);
          return null;                     // ล้มเหลว → คงตัวอักษรย่อไว้ ไม่ทำหน้าพัง
        });
    });
  }

  function pfPhotoUpload(file, empId) {
    if (pfPhotoBusy) return;
    if (PF_PHOTO_MIME.indexOf(String(file.type || '').toLowerCase()) < 0) {
      pfPhotoMsg('รับเฉพาะไฟล์รูปภาพ JPG · PNG · WEBP เท่านั้น', true);
      return;
    }
    if (file.size > PF_PHOTO_MAX) {
      pfPhotoMsg('ไฟล์ใหญ่เกิน ' + (PF_PHOTO_MAX / 1048576) + ' MB', true);
      return;
    }

    pfPhotoBusy = true;
    var cam = document.getElementById('pfm-cam');
    if (cam) cam.classList.add('is-busy');
    pfShowPreview(file);                   // Preview หลัง Validate ผ่านแล้วเท่านั้น
    pfPhotoMsg('กำลังอัปโหลดรูป…', false);

    pfEmpFn({
      action: 'upload-url', employee_id: empId,
      category: 'PERSONAL', doc_kind: 'PHOTO',
      file_name: file.name, size: file.size
    }).then(function (d) {
      if (!d.upload_url || !d.path) {
        throw pfStepErr('SIGN_URL', 'ไม่สามารถขอสิทธิ์อัปโหลดรูปได้');
      }
      return fetch(d.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      })['catch'](function (ne) {
        throw pfStepErr('PUT_STORAGE', 'อัปโหลดรูปไปยัง Storage ไม่สำเร็จ', ne);
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) {
          throw pfStepErr('PUT_STORAGE', 'อัปโหลดรูปไปยัง Storage ไม่สำเร็จ',
            'HTTP ' + r.status + ' ' + String(t).slice(0, 120));
        });
        return { name: file.name, path: d.path, mime: file.type || '', size: file.size };
      });
    }).then(function (f) {
      /* มีรูปเดิมอยู่แล้ว → ส่ง p_id เดิมเพื่อให้ระบบทำ Versioning
         ไฟล์เก่าจะถูกเก็บใน njhr_emp_file_versions ไม่ถูกลบทิ้ง */
      return sbRpc('njhr_empfile_save', {
        p_token: sbToken(), p_employee: empId,
        p_category: 'PERSONAL', p_doc_kind: 'PHOTO',
        p_file: f, p_id: (pfPhotoCur && pfPhotoCur.id) || null,
        p_document_date: null, p_expiry_date: null, p_note: null
      })['catch'](function (se) {
        /* ไฟล์ขึ้น Storage แล้วแต่ทะเบียนไฟล์ไม่ถูกบันทึก — ต้องบอกให้ตรงความจริง */
        throw pfStepErr('SAVE_RECORD',
          'อัปโหลดไฟล์แล้ว แต่บันทึกข้อมูลรูปโปรไฟล์ไม่สำเร็จ', se);
      });
    }).then(function () {
      return pfPhotoLoad(empId);           // ดึงรูปล่าสุดกลับมาแสดงทันที
    }).then(function () {
      pfAvaBak = null;                     // สำเร็จแล้ว ไม่ต้องคืนรูปเดิม
      pfClearPreviewUrl();                 // รูปจริงจาก Signed URL แทน Preview แล้ว
      pfPhotoMsg('อัปโหลดรูปเรียบร้อย', false);
      toast('เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว');
    })['catch'](function (ex) {
      /* Console เห็นขั้นตอนที่พัง + รายละเอียดที่ล้างความลับแล้ว */
      try {
        console.error('[PROFILE] อัปโหลดรูปล้มเหลว · ขั้นตอน=' +
          ((ex && ex.pfStep) || 'UNKNOWN') + ' · ' + pfSafeDetail(ex && ex.pfCause) +
          ' · ' + pfSafeDetail(ex));
      } catch (e2) {}
      pfRestoreAva();                      // ล้มเหลว → คืนรูปเดิม ห้ามค้าง Preview
      pfPhotoMsg(pfPhotoUserMsg(ex), true);
    }).then(function () {
      pfPhotoBusy = false;
      if (cam) cam.classList.remove('is-busy');
      var inp = document.getElementById('pfm-photo');
      if (inp) inp.value = '';             // เลือกไฟล์เดิมซ้ำได้
    });
  }

  function pfPhotoInit(el, mePromise) {
    var cam = el.querySelector('#pfm-cam');
    var inp = el.querySelector('#pfm-photo');
    if (!cam || !inp) return;

    pfPhotoCur = null;
    mePromise.then(function (me) {
      if (!me || !me.id) return;
      pfPhotoLoad(me.id);

      /* อยู่ใน <a> จึงต้องกันไม่ให้ลิงก์ทำงานเมื่อกดปุ่มกล้อง */
      cam.onclick = function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        if (pfPhotoBusy) return;
        inp.click();
      };
      cam.onkeydown = function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault(); ev.stopPropagation();
        inp.click();
      };
      inp.onclick = function (ev) { ev.stopPropagation(); };
      inp.onchange = function () {
        var f = this.files && this.files[0];
        if (f) pfPhotoUpload(f, me.id);
      };
    });
  }

  /* ---------- วันที่แบบ DD/MM/YYYY (ค.ศ.) ----------
     ⚠ ไม่ใช้ empBE() เพราะอันนั้นแปลงเป็น พ.ศ.
       ตรวจรูปแบบเข้มก่อนเสมอ ค่าที่ไม่ใช่วันที่จริงคืน '-' ห้ามให้เกิด Invalid Date */
  function pfDMY(v) {
    var s = String(v == null ? '' : v).slice(0, 10);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return '-';
    var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (!isFinite(y) || !isFinite(mo) || !isFinite(d)) return '-';
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return '-';
    return m[3] + '/' + m[2] + '/' + m[1];
  }

  /* ---------- การ์ดข้อมูลส่วนตัวของมือถือ ----------
     ⚠ แยกจาก .pf-legacy ของ Desktop โดยสิ้นเชิง — Desktop จึงไม่เปลี่ยนแม้แต่พิกเซลเดียว
     ทุกช่องเป็นอ่านอย่างเดียว เพราะ njhr_me_save รับแก้เฉพาะ
       nickname · birth_date · national_id · phone · email · address · emergency_phone
     รหัสพนักงาน / แผนก / ตำแหน่ง / วันที่เริ่มงาน มาจาก Employee Master แก้ที่นี่ไม่ได้ */
  var PF_INFO_ROWS = [
    ['name', 'ชื่อ-นามสกุล'], ['code', 'รหัสพนักงาน'], ['dept', 'แผนก'],
    ['pos', 'ตำแหน่ง'], ['start', 'วันที่เริ่มงาน'], ['email', 'อีเมล'], ['phone', 'โทรศัพท์']
  ];

  function pfInfoHtml() {
    return '<section class="pfm-info" id="pfm-info" hidden ' +
      'aria-labelledby="pfm-info-h">' +
      '<div class="pfm-info-h" id="pfm-info-h">' + icon('user', 'ic-sm') +
      '<b>ข้อมูลส่วนตัว</b>' +
      '<button type="button" class="pfm-info-x" id="pfm-info-close" ' +
      'aria-label="ปิดข้อมูลส่วนตัว">' + icon('x') + '</button></div>' +
      PF_INFO_ROWS.map(function (r) {
        return '<div class="pfm-info-r"><span>' + esc(r[1]) + '</span>' +
          '<b id="pfi-' + r[0] + '">—</b></div>';
      }).join('') +
      '<p class="pfm-info-note">ข้อมูลจากทะเบียนพนักงาน · แก้ไขได้ที่ฝ่ายบุคคล</p></section>';
  }

  /* เติมค่าจริงจาก njhr_me_get — ไม่มี RPC ใหม่ ไม่มีการเดาชื่อฟิลด์ */
  function pfFillInfo(me) {
    if (!me) return;
    var v = {
      name: me.full_name || '', code: me.emp_code || '',
      dept: me.department_name || '', pos: me.position_name || '',
      start: pfDMY(me.start_date), email: me.email || '', phone: me.phone || ''
    };
    PF_INFO_ROWS.forEach(function (r) {
      var el = document.getElementById('pfi-' + r[0]);
      if (!el) return;
      var t = String(v[r[0]] == null ? '' : v[r[0]]).trim();
      el.textContent = t === '' ? '-' : t;
    });
  }

  /* เปิด/ปิด "ข้อมูลส่วนตัว" บนมือถือ
     ⚠ ยังใช้ .pf-show-mobile ตัวเดิมกับ .pf-legacy ไม่แตะกฎ CSS นั้นเลย
       และไม่แตะ .only-desktop เพื่อไม่ให้กระทบหน้าจออื่นทั้งระบบ */
  function pfToggleDetail(el, force) {
    var info = el.querySelector('#pfm-info');
    var box = el.querySelector('.pf-legacy');
    var open = (force === undefined) ? (info ? info.hidden : true) : !!force;
    if (info) info.hidden = !open;
    if (box) box.classList.toggle('pf-show-mobile', open);
    if (open) {
      var t = info || box;
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---------- ความปลอดภัยและการเข้าสู่ระบบ (มือถือเท่านั้น) ----------
     ⚠ ใช้ Face Template ชุดเดียวกับการลงเวลา (njhr_emp_faces) ไม่สร้างฐานใบหน้าชุดที่สอง
       ถ้าลงทะเบียนใบหน้าไว้แล้วจากการลงเวลา → เปิด Face Login ได้เลย ไม่ต้องถ่าย 3 มุมซ้ำ
       ถ้ายังไม่มี → ถ่าย 3 มุมก่อน แล้วจึงเปิด
     ⚠ ทุกการกระทำต้องยืนยันรหัสผ่านปัจจุบัน (ตรวจฝั่งฐานข้อมูลใน njhr_face_login_set) */
  function pfSecHtml() {
    return '<section class="pfm-info pfm-sec" id="pfm-sec">' +
      '<div class="pfm-info-h">' + icon('shield', 'ic-sm') +
      '<b>ความปลอดภัยและการเข้าสู่ระบบ</b></div>' +
      '<div class="pfm-sec-row">' +
      '<div class="pfm-sec-t"><b>สแกนใบหน้าเข้าสู่ระบบ</b>' +
      '<small id="pfsec-st">กำลังตรวจสอบ…</small></div></div>' +
      '<div class="pfm-sec-act" id="pfsec-act"></div>' +
      '<div class="pfm-sec-msg" id="pfsec-msg" hidden></div></section>';
  }

  function pfSecMsg(t, err) {
    var b = document.getElementById('pfsec-msg');
    if (!b) return;
    b.textContent = t || '';
    b.hidden = !t;
    b.className = 'pfm-sec-msg' + (err ? ' is-err' : '');
  }

  /* ถามรหัสผ่านปัจจุบัน — ฝั่งหน้าจอเป็นเพียงตัวรับค่า ฐานข้อมูลเป็นด่านจริง */
  function pfSecAskPw(title, okLabel) {
    return new Promise(function (resolve) {
      openModal(title,
        '<label class="field"><span>รหัสผ่านปัจจุบัน</span>' +
        '<input type="password" id="pfsec-pw" autocomplete="current-password"></label>' +
        '<div class="form-error" id="pfsec-pwerr" role="alert"></div>',
        '<button class="btn btn-ghost" id="pfsec-no">ยกเลิก</button>' +
        '<button class="btn btn-primary" id="pfsec-yes">' + esc(okLabel) + '</button>');
      document.getElementById('pfsec-no').onclick = function () { closeModal(); resolve(null); };
      document.getElementById('pfsec-yes').onclick = function () {
        var v = String((document.getElementById('pfsec-pw') || {}).value || '');
        if (!v) { document.getElementById('pfsec-pwerr').textContent = 'กรุณากรอกรหัสผ่าน'; return; }
        closeModal(); resolve(v);
      };
      var i = document.getElementById('pfsec-pw');
      if (i) i.focus();
    });
  }

  function pfSecSet(pw, enable) {
    return sbRpc('njhr_face_login_set',
      { p_token: sbToken(), p_password: pw, p_enable: enable });
  }

  function pfSecInit(el) {
    var box = el.querySelector('#pfm-sec');
    if (!box) return;

    function paint(s) {
      var st = document.getElementById('pfsec-st');
      var act = document.getElementById('pfsec-act');
      if (!st || !act) return;
      var on = !!(s && s.face_login_enabled);
      var enrolled = !!(s && s.enrolled);
      st.textContent = on ? 'เปิดใช้งาน' : (enrolled ? 'ปิดใช้งาน' : 'ยังไม่ได้ตั้งค่า');
      st.className = on ? 'is-on' : '';
      /* ปุ่ม "ลงทะเบียนใบหน้าใหม่" แสดงเมื่อมีใบหน้าต้นแบบอยู่แล้วเท่านั้น */
      act.innerHTML =
        (on ? '' : '<button type="button" class="btn btn-dark btn-block" id="pfsec-on">' +
                   icon('camera') + ' ตั้งค่าสแกนใบหน้าเข้าสู่ระบบ</button>') +
        (enrolled ? '<button type="button" class="btn btn-ghost btn-block" id="pfsec-re">' +
                    'ลงทะเบียนใบหน้าใหม่</button>' : '') +
        (on ? '<button type="button" class="btn btn-ghost btn-block" id="pfsec-off">' +
              'ปิดการเข้าสู่ระบบด้วยใบหน้า</button>' : '');
      bind(enrolled);
    }

    function load() {
      var st = document.getElementById('pfsec-st');
      var act = document.getElementById('pfsec-act');
      if (st) { st.textContent = 'กำลังตรวจสอบสถานะ…'; st.className = ''; }
      if (act) act.innerHTML = '';
      pfSecMsg('');
      sbRpc('njhr_face_login_status', { p_token: sbToken() })
        .then(paint)
        ['catch'](function (e) {
          /* ⚠ Error ดิบจากฐานข้อมูล/PostgREST ห้ามโชว์ให้พนักงาน
             แต่ Console ต้องเห็นข้อความจริงเสมอเพื่อให้ตรวจปัญหาได้ */
          try { console.error('[PROFILE] njhr_face_login_status ล้มเหลว:', e); } catch (e2) {}
          var st2 = document.getElementById('pfsec-st');
          var act2 = document.getElementById('pfsec-act');
          if (st2) st2.textContent = 'ไม่สามารถตรวจสอบสถานะได้';
          /* ต้องมีทางออกให้ผู้ใช้เสมอ — ห้ามค้างจนกดอะไรไม่ได้ */
          if (act2) {
            act2.innerHTML = '<button type="button" class="btn btn-ghost btn-block" ' +
              'id="pfsec-retry">ลองใหม่</button>';
            var rb = document.getElementById('pfsec-retry');
            if (rb) rb.onclick = function () { load(); };   // ยิง Request ใหม่จริง
          }
          pfSecMsg('ไม่สามารถตรวจสอบสถานะการสแกนใบหน้าได้ กรุณาลองใหม่', true);
        });
    }

    function bind(enrolled) {
      var on = document.getElementById('pfsec-on');
      var off = document.getElementById('pfsec-off');
      if (on) on.onclick = function () {
        pfSecMsg('');
        pfSecAskPw('ตั้งค่าสแกนใบหน้าเข้าสู่ระบบ', 'ยืนยัน').then(function (pw) {
          if (!pw) return;
          /* มี Face Template อยู่แล้ว → เปิดได้เลย ไม่ต้องถ่าย 3 มุมซ้ำ */
          if (enrolled) return pfSecSet(pw, true).then(function () {
            pfSecMsg('เปิดใช้งานการเข้าสู่ระบบด้วยใบหน้าสำเร็จ', false);
            load();
          });
          /* ยังไม่มี → ถ่าย 3 มุมก่อน แล้วจึงเปิด */
          return pfSecFaceModule().then(function () {
            window.NJHRFace.enroll(null, function () {
              pfSecSet(pw, true).then(function () {
                pfSecMsg('ตั้งค่าสแกนใบหน้าเข้าสู่ระบบสำเร็จ', false);
                load();
              })['catch'](function (e2) {
                pfSecMsg((e2 && e2.message) || 'เปิดใช้งานไม่สำเร็จ', true);
                load();
              });
            });
          });
        })['catch'](function (e) {
          pfSecMsg((e && e.message) || 'ดำเนินการไม่สำเร็จ', true);
        });
      };
      var re = document.getElementById('pfsec-re');
      if (re) re.onclick = function () {
        pfSecMsg('');
        pfSecAskPw('ลงทะเบียนใบหน้าใหม่', 'ยืนยัน').then(function (pw) {
          if (!pw) return;
          /* ⚠ ส่งรหัสผ่านเข้า enroll เพื่อให้ใช้ njhr_face_self_reenroll
             ใบหน้าต้นแบบเดิมจะถูกแทนที่ก็ต่อเมื่อ RPC สำเร็จเท่านั้น
             ถ้ากล้องปิด / Liveness ไม่ผ่าน / มุมไม่ครบ / RPC ล้ม → ของเดิมยังใช้ได้ */
          return pfSecFaceModule().then(function () {
            window.NJHRFace.enroll(null, function () {
              pfSecMsg('ลงทะเบียนใบหน้าใหม่สำเร็จ', false);
              load();
            }, { password: pw });
          });
        })['catch'](function (e) {
          pfSecMsg((e && e.message) || 'ดำเนินการไม่สำเร็จ', true);
        });
      };
      if (off) off.onclick = function () {
        pfSecMsg('');
        pfSecAskPw('ปิดการเข้าสู่ระบบด้วยใบหน้า', 'ปิดใช้งาน').then(function (pw) {
          if (!pw) return;
          return pfSecSet(pw, false).then(function () {
            pfSecMsg('ปิดการเข้าสู่ระบบด้วยใบหน้าแล้ว', false);
            load();
          });
        })['catch'](function (e) {
          pfSecMsg((e && e.message) || 'ดำเนินการไม่สำเร็จ', true);
        });
      };
    }

    function pfSecFaceModule() {
      if (window.NJHRFace) return Promise.resolve();
      return loadScriptOnce('face', njAsset('face.js'), 'NJHRFace');
    }

    load();
  }

  function pfMobileHtml(u, e) {
    var name = e ? (e.title + e.firstName + ' ' + e.lastName) : u.username;    return '<div class="only-mobile pfm">' +
      '<div class="pfm-brand"><span class="pfm-logo">NJL</span>' +
      '<div class="grow"><b>NJL HR</b><small>ระบบบริหารทรัพยากรบุคคล</small></div>' +
      '<button type="button" class="pfm-x" id="pfm-close" aria-label="กลับหน้าหลัก">' +
      icon('x') + '</button></div>' +

      /* ปุ่มกล้องซ้อนบนรูป — เปิด File Picker ของเครื่อง
         ห่อด้วย <span> ไม่ใช่ <button> เพราะอยู่ใน <a> จะซ้อน element กดไม่ได้
         input[type=file] ซ่อนไว้ รับเฉพาะรูปภาพ (ตรวจซ้ำอีกชั้นตอนเลือกไฟล์) */
      '<a class="pfm-emp" href="#/profile?sec=detail">' +
      '<span class="pfm-ava" id="pfm-ava">' + avatarHTML(name, 58) +
      '<span class="pfm-cam" id="pfm-cam" role="button" tabindex="0" ' +
      'aria-label="เปลี่ยนรูปโปรไฟล์" title="เปลี่ยนรูปโปรไฟล์">' + icon('camera') + '</span>' +
      '<input type="file" id="pfm-photo" accept="image/jpeg,image/png,image/webp" hidden></span>' +
      '<div class="grow"><b>' + esc(name) + '</b>' +
      '<small>รหัสพนักงาน: <i>' + esc((e && e.code) || '—') + '</i></small>' +
      '<small>แผนก: <i>' + esc((e && dept(e.deptId)) || '—') + '</i></small></div>' +
      '<span class="pfm-x2">' + icon('chevR') + '</span></a>' +
      '<div class="pfm-photo-msg" id="pfm-photo-msg" hidden></div>' +
      pfInfoHtml() +
      pfSecHtml() +

      '<nav class="pfm-menu">' + PF_MENU.map(function (m) {
        return '<button type="button" class="pfm-item ' + m[4] + '" data-pfm="' + esc(m[0]) + '">' +
          '<span class="pfm-ic ' + m[3] + '">' + m[1] + '</span>' +
          '<span class="grow">' + esc(m[2]) + '</span>' +
          '<span class="pfm-go">' + icon('chevR') + '</span></button>';
      }).join('') + '</nav></div>';
  }

  function viewProfile(el) {
    var u = currentUser(), e = currentEmp();
    el.innerHTML = pfMobileHtml(u, e) +
      '<div class="only-desktop pf-legacy">' +
      '<div class="card profile-card">' + avatarHTML(e ? e.firstName : u.username, 72) +
      '<b>' + esc(e ? e.title + e.firstName + ' ' + e.lastName : u.username) + '</b>' +
      '<small>' + (e ? esc(e.code + ' · ' + e.position + ' · ' + dept(e.deptId)) : '') + '</small>' +
      '<span class="chip chip-info">' + ROLE_TH[u.role] + '</span></div>' +
      (e ? '<div class="card"><div class="card-head"><h3>ข้อมูลติดต่อ</h3></div>' +
        '<form id="pf-f">' +
        '<label class="field"><span>โทรศัพท์</span><input name="phone" value="' + esc(e.phone || '') + '"></label>' +
        '<label class="field"><span>อีเมล</span><input type="email" name="email" value="' + esc(e.email || '') + '"></label>' +
        '<button class="btn btn-primary" type="button" id="pf-save">บันทึกข้อมูลติดต่อ</button></form></div>' : '') +
      '<div class="card"><div class="card-head"><h3>บัญชีผู้ใช้</h3></div>' +
      '<div class="detail-grid">' + dRow('ชื่อผู้ใช้', u.username) + dRow('Login ล่าสุด', u.lastLogin || '—') + '</div>' +
      '<button class="btn btn-danger-ghost" id="pf-logout">' + icon('logout') + ' ออกจากระบบ</button></div>' +
      '</div>';

    /* เมนูมือถือ — ทุกปุ่มไปที่ Route จริง ไม่มีปุ่มหลอก */
    var mnav = el.querySelector('.pfm-menu');
    if (mnav) mnav.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-pfm]') : null;
      if (!b) return;
      var to = b.dataset.pfm;
      if (to === 'logout') {
        confirmDialog('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่', 'ออกจากระบบ',
          function () { doLogout(false); }, true);
        return;
      }
      if (to === 'detail') {
        /* ข้อมูลส่วนตัว = การ์ดข้อมูลมือถือ + การ์ดข้อมูลติดต่อเดิม (ของเดิม ไม่สร้างหน้าใหม่)
           กดซ้ำ = ปิด · ปุ่ม × ในการ์ดก็ปิดได้ */
        pfToggleDetail(el);
        return;
      }
      window.location.hash = to;
    };
    var cx = document.getElementById('pfm-close');
    if (cx) cx.onclick = function () { window.location.hash = '#/dashboard'; };
    var empCard = el.querySelector('.pfm-emp');
    if (empCard) empCard.onclick = function (ev) {
      ev.preventDefault();
      pfToggleDetail(el);
    };

    var infoX = el.querySelector('#pfm-info-close');
    if (infoX) infoX.onclick = function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      pfToggleDetail(el, false);
    };

    /* ---------- njhr_me_get ครั้งเดียวต่อการเปิดหน้า ----------
       ทั้งฟอร์มข้อมูลติดต่อและรูปโปรไฟล์ใช้ผลลัพธ์ก้อนเดียวกัน
       employee.id ที่ได้มาจาก Token เท่านั้น ไม่รับจาก URL หรือ localStorage */
    var pfMe = null;
    var pfMePromise = (sbReady() && sbToken())
      ? sbRpc('njhr_me_get', { p_token: sbToken() }).then(function (r) {
          var d = (r && r.data) ? r.data : r;
          pfMe = (d && d.employee) || null;
          return pfMe;
        })['catch'](function (er) {
          console.error('[PROFILE] njhr_me_get ล้มเหลว:', er);
          return null;
        })
      : Promise.resolve(null);

    pfMePromise.then(function (me) { pfFillInfo(me); });
    pfSecInit(el);
    pfPhotoInit(el, pfMePromise);

    var saveBtn = document.getElementById('pf-save');
    if (saveBtn) {
      /* ---------- ข้อมูลติดต่อ: แหล่งจริงคือ employees ผ่าน njhr_me_get / njhr_me_save ----------
         เดิมแก้ e.phone / e.email ใน db.employees แล้ว saveDB() ลง localStorage
         ซึ่งเครื่องอื่นมองไม่เห็นและไม่เคยถึงฐานข้อมูลเลย

         ⚠ njhr_me_save เขียนทับครบทั้ง 7 คอลัมน์ของ allowlist ทุกครั้ง
            (nickname · birth_date · national_id · phone · email · address · emergency_phone)
            คีย์ที่ไม่ส่งไปจะกลายเป็น null → ต้องโหลดค่าปัจจุบันจาก njhr_me_get มาก่อน
            แล้วส่งกลับครบทั้ง 7 ค่าโดยแทนที่เฉพาะ phone/email ที่หน้านี้แก้ได้
         Audit ถูกเขียนโดย njhr_me_save แล้ว จึงไม่เรียก audit() ซ้ำ
         ช่องกรอกและหน้าตาเดิมทุกบรรทัด ไม่เพิ่ม/ลดช่องใด */
      /* ใช้ผลจาก njhr_me_get ก้อนเดียวกับรูปโปรไฟล์ — ไม่ยิง RPC ซ้ำ */
      pfMePromise.then(function (me) {
        if (!me) return;
        var fm0 = document.getElementById('pf-f');
        if (!fm0) return;
        fm0.elements.phone.value = me.phone || '';
        fm0.elements.email.value = me.email || '';
      });
      saveBtn.onclick = function () {
        var fm = document.getElementById('pf-f'), btn = this;
        if (!sbReady() || !sbToken()) { toast('ยังไม่ได้เชื่อมต่อ Supabase — บันทึกไม่ได้', 'error'); return; }
        if (!pfMe) { toast('กำลังโหลดข้อมูลเดิม กรุณารอสักครู่แล้วกดใหม่', 'info'); return; }
        if (btn.disabled) return;
        var label = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
        sbRpc('njhr_me_save', {
          p_token: sbToken(),
          p_data: {
            nickname: pfMe.nickname || '',
            birth_date: pfMe.birth_date || '',
            national_id: pfMe.national_id || '',
            phone: fm.elements.phone.value.trim(),
            email: fm.elements.email.value.trim(),
            address: pfMe.address || '',
            emergency_phone: pfMe.emergency_phone || ''
          }
        }).then(function (r) {
          var d = (r && r.data) ? r.data : r;
          if (d && d.employee) pfMe = d.employee;
          if (e) { e.phone = fm.elements.phone.value.trim(); e.email = fm.elements.email.value.trim(); }
          toast('บันทึกข้อมูลติดต่อแล้ว');
        }).catch(function (er) {
          console.error('[PROFILE] njhr_me_save ล้มเหลว:', er);
          toast((er && er.message) || 'บันทึกข้อมูลติดต่อไม่สำเร็จ', 'error');
        }).then(function () { btn.disabled = false; btn.innerHTML = label; });
      };
    }
    document.getElementById('pf-logout').onclick = function () {
      confirmDialog('ออกจากระบบ', 'ต้องการออกจากระบบใช่หรือไม่', 'ออกจากระบบ', function () { doLogout(false); }, true);
    };
  }

  /* ================= VIEW: ศูนย์จัดการเอกสาร HR =================
     ข้อมูลจริงจาก Supabase: njhr_emp_documents / _acks / _events + njhr_org_profile
     Workflow: Draft → รออนุมัติ → อนุมัติแล้ว → ส่งแล้ว → เปิดอ่านแล้ว → รับทราบแล้ว → เก็บเข้าประวัติ
     สิทธิ์ตรวจซ้ำฝั่งเซิร์ฟเวอร์ทุก RPC — พนักงานเห็นและรับทราบได้เฉพาะเอกสารของตนเอง
     PDF ใช้ Print → "Save as PDF" แนวเดียวกับ E-PAYSLIP (ไม่เพิ่มไลบรารีภายนอก) */
  var DOC_ACK_TEXT =
    'ข้าพเจ้าได้อ่านเอกสารฉบับนี้ครบถ้วนแล้ว และรับทราบเนื้อหาตามที่บริษัทแจ้ง ' +
    'การกดปุ่ม "รับทราบ" เป็นการยืนยันว่าได้รับเอกสารแล้ว ' +
    'มิใช่การยอมรับหรือยินยอมต่อเนื้อหาทั้งหมดของเอกสาร';

  function docBadge(s) {
    var x = docStat(s);
    return '<span class="badge ' + x.c + '">' + x.em + ' ' + esc(x.t) + '</span>';
  }
  function docCanManage() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  // เอกสารที่ยังเป็นร่าง = ยังไม่ออกใช้งาน
  function docIsIssued(st) { return ['DRAFT', 'PENDING', 'PENDING_APPROVAL'].indexOf(st) < 0; }
  /* สิทธิ์ลบเอกสาร (กฎเดียวกับฝั่งเซิร์ฟเวอร์ njhr_doc_delete)
     · ร่าง → ผู้สร้างเอกสาร / ADMIN / SUPER_ADMIN
     · ออกใช้งานแล้ว → SUPER_ADMIN เท่านั้น และต้องระบุเหตุผล */
  function docCanDelete(r) {
    if (!r) return false;
    var u = currentUser(), role = u.role;
    if (docIsIssued(r.status)) return role === 'SUPER_ADMIN';
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
    return String(r.issued_by || '').toLowerCase() === String(u.username || '').toLowerCase();
  }
  function docCanApprove() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  function docErr(msg) { var b = document.getElementById('doc-err'); if (b) b.textContent = msg || ''; }
  function docDate(v) { return v ? empBE(String(v).slice(0, 10)) : '—'; }
  // บริบทอุปกรณ์สำหรับบันทึกหลักฐานการรับทราบ (IP ฝั่งเบราว์เซอร์อ่านไม่ได้ จึงเว้นไว้ให้เซิร์ฟเวอร์)
  function docCtx() {
    var ua = navigator.userAgent || '';
    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return {
      channel: mobile ? '📱 Mobile Web' : '💻 Desktop Web',
      device: (mobile ? 'Mobile' : 'Desktop') + ' · ' +
        (/Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' :
         /Firefox/i.test(ua) ? 'Firefox' : /Edg/i.test(ua) ? 'Edge' : 'Browser'),
      user_agent: ua.slice(0, 400)
    };
  }

  var docRows = [], docOrg = null, docDetailData = null;

  /* เนื้อหาตั้งต้นของแต่ละประเภท — เติมข้อมูลจริงจากฐานข้อมูลตอนสร้าง
     ไม่ใช่ข้อมูลตัวอย่าง แต่เป็นร่างที่ HR แก้ไขต่อได้ก่อนส่งอนุมัติ */
  /* ---------- ข้อมูลจริงของพนักงาน → ข้อความในเอกสาร ----------
     ทุกค่าดึงจาก njhr_doc_emp_profile (ตาราง employees) ไม่มีการอ่านจาก localStorage */
  var DOC_TH_MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  function docThaiDate(iso) {                        // 2013-06-01 → 1 มิถุนายน 2556
    var p2 = String(iso || '').slice(0, 10).split('-');
    if (p2.length !== 3) return '';
    var m = parseInt(p2[1], 10), d = parseInt(p2[2], 10), y = parseInt(p2[0], 10);
    if (!isFinite(m) || !isFinite(d) || !isFinite(y) || m < 1 || m > 12) return '';
    return d + ' ' + DOC_TH_MONTH[m - 1] + ' ' + (y + 543);
  }
  function docMoney2(v) {                            // 25000 → 25,000.00 (ไม่มีค่า/0 = '')
    if (v == null || v === '' || !isFinite(Number(v)) || Number(v) <= 0) return '';
    return money(Number(v));
  }
  // ตารางแทนค่า — ใส่เฉพาะค่าที่มีจริง (ค่าที่ขาดจะไม่ถูกแทน จึงไม่มี undefined/null หลุดออกไป)
  // จำนวนวันพักงาน — นับรวมวันเริ่มและวันสิ้นสุด (คำนวณให้อัตโนมัติ ผู้ใช้ไม่ต้องกรอกซ้ำ)
  function docSuspDays(start, end) {
    var a = String(start || '').slice(0, 10), b = String(end || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return 0;
    var d1 = Date.parse(a + 'T00:00:00Z'), d2 = Date.parse(b + 'T00:00:00Z');
    if (!isFinite(d1) || !isFinite(d2) || d2 < d1) return 0;
    return Math.round((d2 - d1) / 86400000) + 1;
  }
  /* ---------- ตัวช่วยเอกสารรับรอง 3 ประเภท ---------- */
  var DOC_TH_NUM = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  var DOC_TH_POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  // อ่านจำนวนเต็มเป็นภาษาไทย (รองรับหลักล้านซ้อนกัน)
  function docThaiInt(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 0) return 'ศูนย์';
    if (n >= 1000000) {
      var head = Math.floor(n / 1000000), tail = n % 1000000;
      return docThaiInt(head) + 'ล้าน' + (tail ? docThaiInt(tail) : '');
    }
    var str = String(n), out = '', len = str.length;
    for (var i = 0; i < len; i++) {
      var d = Number(str.charAt(i)), pos = len - i - 1;
      if (d === 0) continue;
      if (pos === 1 && d === 1) out += 'สิบ';
      else if (pos === 1 && d === 2) out += 'ยี่สิบ';
      else if (pos === 0 && d === 1 && len > 1) out += 'เอ็ด';
      else out += DOC_TH_NUM[d] + DOC_TH_POS[pos];
    }
    return out;
  }
  // จำนวนเงินเป็นตัวอักษรไทย: 44,000.00 → สี่หมื่นสี่พันบาทถ้วน
  function docBahtText(v) {
    var n = Number(v);
    if (!isFinite(n)) return '';
    var neg = n < 0;
    n = Math.round(Math.abs(n) * 100) / 100;
    var baht = Math.floor(n), satang = Math.round((n - baht) * 100);
    var t = docThaiInt(baht) + 'บาท' + (satang ? docThaiInt(satang) + 'สตางค์' : 'ถ้วน');
    return (neg ? 'ลบ' : '') + t;
  }
  /* อายุงานตามปฏิทินจริง: ปี / เดือน / วัน (ไม่ใช้การหารจำนวนวันแบบประมาณค่า)
     วิธี: เดินเดือนจากวันเริ่มงานให้มากที่สุดเท่าที่ยังไม่เกินวันสิ้นสุด (ปัดวันสิ้นเดือนให้พอดี)
     แล้วนับวันที่เหลือ — ให้ผลตรงกับการนับอายุงานตามปฏิทินจริงทุกกรณี รวมวันสิ้นเดือน */
  function docDaysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function docAddMonths(y, m, d, add) {
    var t = (m - 1) + add;
    var ny = y + Math.floor(t / 12), nm = ((t % 12) + 12) % 12 + 1;
    return { y: ny, m: nm, d: Math.min(d, docDaysInMonth(ny, nm)) };
  }
  function docUTC(o) { return Date.UTC(o.y, o.m - 1, o.d); }
  function docServiceDuration(startISO, endISO) {
    var a = String(startISO || '').slice(0, 10), b = String(endISO || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null;
    var s1 = a.split('-').map(Number), s2 = b.split('-').map(Number);
    var st = { y: s1[0], m: s1[1], d: s1[2] }, en = { y: s2[0], m: s2[1], d: s2[2] };
    if (docUTC(en) < docUTC(st)) return null;             // พ้นสภาพก่อนเริ่มงาน = ข้อมูลผิด
    var total = (en.y - st.y) * 12 + (en.m - st.m);
    if (total > 0 && docUTC(docAddMonths(st.y, st.m, st.d, total)) > docUTC(en)) total--;
    if (total < 0) total = 0;
    var anchor = docAddMonths(st.y, st.m, st.d, total);
    var days = Math.round((docUTC(en) - docUTC(anchor)) / 86400000);
    if (days < 0) days = 0;
    return { years: Math.floor(total / 12), months: total % 12, days: days };
  }
  function docServiceText(startISO, endISO) {
    var r = docServiceDuration(startISO, endISO);
    if (!r) return '';
    var out = [];
    if (r.years) out.push(r.years + ' ปี');
    if (r.months) out.push(r.months + ' เดือน');
    if (r.days) out.push(r.days + ' วัน');
    if (!out.length) out.push('น้อยกว่า 1 วัน');
    return out.join(' ');
  }
  var DOC_EMP_STATUS_TH = {
    ACTIVE: 'พนักงานปัจจุบัน', PROBATION: 'พนักงานทดลองงาน',
    SUSPENDED: 'พักงานชั่วคราว', RESIGNED: 'พ้นสภาพการเป็นพนักงาน'
  };
  var DOC_PURPOSES = ['ประกอบการสมัครงาน', 'ประกอบการทำธุรกรรมกับธนาคาร',
    'ประกอบการขอสินเชื่อ', 'ประกอบการยื่นขอวีซ่า', 'เป็นหลักฐานต่อหน่วยงานราชการ'];
  /* ตัดคำซ้ำหน้าวัตถุประสงค์ — ข้อความในเอกสารเขียนว่า "เพื่อใช้{{certificate_purpose}}"
     ค่าที่บันทึกไว้เดิม (เช่น "ใช้ประกอบการสมัครงาน") จึงต้องตัด "ใช้ / เพื่อใช้ / ประกอบ" ซ้ำออกก่อน */
  function docPurposeText(v) {
    var t = String(v == null ? '' : v).trim();
    t = t.replace(/^เพื่อใช้\s*/, '').replace(/^เพื่อ\s*/, '').replace(/^ใช้\s*/, '');
    t = t.replace(/^ประกอบ\s+ประกอบ/, 'ประกอบ');
    return t.trim();
  }
  var DOC_CERT_TYPES = ['COE', 'SALARY_CERT', 'SEPARATION'];   // เอกสารรับรอง 3 ประเภท
  function docIsCert(t) { return DOC_CERT_TYPES.indexOf(t) >= 0; }
  /* รายได้ประจำที่ใช้ในหนังสือรับรองเงินเดือน — ดึงจากระบบเงินเดือนจริง
     opts.pay = ผลจาก RPC njhr_doc_salary_items { base_salary, items:[{code,name,amount}], total }
     ไม่รวม OT (calc_type='SYSTEM') · โบนัส/คอมมิชชันที่ไม่ใช่รายการประจำ · รายการหัก (DEDUCTION) */
  function docNum(v) { var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function docIncome(opts, p) {
    opts = opts || {}; p = p || {};
    var pay = opts.pay || {};
    var base = docNum(pay.base_salary != null ? pay.base_salary : p.base_salary);
    var items = (pay.items || []).map(function (x) {
      return { code: x.code, name: x.name, amount: docNum(x.amount) };
    }).filter(function (x) { return x.amount > 0; });
    var total = base;
    items.forEach(function (x) { total += x.amount; });
    return { base: base, items: items, total: total,
             period: pay.period_year ? (pay.period_month + '/' + pay.period_year) : '',
             source: pay.source || '' };
  }

  function docMergeMap(p, org, opts) {
    p = p || {}; opts = opts || {};
    var m = {};
    var ed = docThaiDate(opts.effective_date || p.effective_date);
    if (ed) m.effective_date_thai = ed;
    var idt = docThaiDate(opts.incident_date);
    if (idt) m.incident_date_thai = idt;
    var ddt = docThaiDate(opts.document_date || p.document_date);
    if (ddt) m.document_date_thai = ddt;
    var ss = docThaiDate(opts.suspension_start), se = docThaiDate(opts.suspension_end);
    if (ss) m.suspension_start_date_thai = ss;
    if (se) m.suspension_end_date_thai = se;
    var sd = docSuspDays(opts.suspension_start, opts.suspension_end);
    if (sd > 0) m.suspension_days = String(sd);
    var pr = String(opts.pay_rate_percent == null ? '' : opts.pay_rate_percent).trim();
    if (pr !== '' && isFinite(Number(pr))) m.pay_rate_percent = String(Number(pr));
    // หนังสือพักงาน — เรื่อง (มีค่าตั้งต้นมาตรฐาน) และรายละเอียดเหตุการณ์
    m.suspension_subject = String(opts.suspension_subject || '').trim() ||
      'แจ้งคำสั่งพักงานเพื่อสอบสวนข้อเท็จจริง';
    var idd = String(opts.incident_detail || '').trim();
    if (!idd) {                                  // รองรับ Draft เดิมที่เก็บเป็น 3 ข้อ
      idd = [1, 2, 3].map(function (k) { return String(opts['incident_item_' + k] || '').trim(); })
        .filter(Boolean).join(' · ');
    }
    if (idd) m.incident_detail = idd;
    // ---- เอกสารรับรอง 3 ประเภท
    var dtt = docThaiDate(opts.document_date || p.document_date);
    if (dtt) m.document_date_text_thai = dtt;
    // สถานะพนักงาน — ถ้าข้อมูลไม่มีค่า status ให้อนุมานจากวันที่พ้นสภาพ จะได้ไม่มี Placeholder ค้าง
    m.employment_status = DOC_EMP_STATUS_TH[p.status] ||
      (p.resign_date ? DOC_EMP_STATUS_TH.RESIGNED : DOC_EMP_STATUS_TH.ACTIVE);
    var td = docThaiDate(opts.termination_date || p.resign_date);
    if (td) m.termination_date_thai = td;
    var sv = docServiceText(p.start_date, opts.termination_date || p.resign_date);
    if (sv) m.service_duration_text = sv;
    var pp = docPurposeText(opts.certificate_purpose);
    if (pp) m.certificate_purpose = pp;
    if (String(opts.signer_name || '').trim()) m.authorized_signer_name = String(opts.signer_name).trim();
    if (String(opts.signer_position || '').trim()) m.authorized_signer_position = String(opts.signer_position).trim();
    var inc = docIncome(opts, p);
    if (inc.base > 0) {
      m.base_salary = money(inc.base);
      m.base_salary_text = docBahtText(inc.base);
      m.total_regular_income = money(inc.total);
      m.total_regular_income_text = docBahtText(inc.total);
    }
    if (String(opts.warning_subject || '').trim()) m.warning_subject = String(opts.warning_subject).trim();
    for (var wi = 1; wi <= 4; wi++) {
      var wv = String(opts['warning_item_' + wi] || '').trim();
      if (wv) m['warning_item_' + wi] = wv;
    }
    if (p.full_name) m.employee_name = p.full_name;
    if (p.emp_code) m.employee_code = p.emp_code;
    if (p.position_name) m.position = p.position_name;
    if (p.department_name) m.department = p.department_name;
    var td = docThaiDate(p.start_date);
    if (td) m.hire_date_thai = td;
    if (p.start_date) m.hire_date = empBE(p.start_date);
    var sal = docMoney2(p.base_salary);
    if (sal) m.salary = sal;
    m.supervisor_name = p.supervisor_name || 'กรรมการผู้จัดการ';   // ไม่มีผู้บังคับบัญชา → ใช้ค่านี้
    m.company_name = (org && org.company_name) || p.company || NJ_COMPANY_NAME;
    return m;
  }
  function docFillTokens(text, map) {
    return String(text == null ? '' : text).replace(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, function (all, k) {
      var v = map[String(k).toLowerCase()];
      return (v == null || v === '') ? all : v;      // ค่าที่ยังไม่มี → คง Placeholder ไว้ให้เห็นชัด
    });
  }
  function docLeftTokens(html) {
    var out = [], re = /\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, m;
    while ((m = re.exec(String(html || '')))) if (out.indexOf(m[1]) < 0) out.push(m[1]);
    return out;
  }
  // ข้อมูลที่ต้องมีก่อนออกเอกสาร แยกตามประเภท (ตรวจซ้ำอีกครั้งตอนกดบันทึก)
  var DOC_FIELD_TH = {
    full_name: 'ชื่อ-นามสกุล', emp_code: 'รหัสพนักงาน', position_name: 'ตำแหน่ง',
    department_name: 'แผนก', start_date: 'วันที่เริ่มงาน', base_salary: 'เงินเดือนพื้นฐาน',
    __eff: 'วันที่มีผล', __subject: 'เรื่องหนังสือตักเตือน', __incident: 'วันที่เกิดเหตุ',
    __item1: 'รายละเอียดความผิดข้อ 1', __docdate: 'วันที่จัดทำสัญญา',
    __sstart: 'วันที่เริ่มพักงาน', __send: 'วันที่สิ้นสุดการพักงาน',
    __sorder: 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม', __payrate: 'อัตราการจ่ายระหว่างพักงาน (%)',
    __incdetail: 'รายละเอียดเหตุการณ์หรือกรณีสอบสวน', __subject2: 'เรื่องเอกสาร',
    __purpose: 'วัตถุประสงค์การขอเอกสาร', __signer: 'ผู้มีอำนาจลงนาม',
    __signerpos: 'ตำแหน่งผู้มีอำนาจลงนาม', __docdate2: 'วันที่ออกเอกสาร',
    __active: 'สถานะพนักงานต้องยังปฏิบัติงานอยู่', __resigned: 'สถานะต้องเป็นพ้นสภาพแล้ว',
    __term: 'วันที่พ้นสภาพ', __service: 'อายุงาน (วันที่พ้นสภาพต้องไม่น้อยกว่าวันที่เริ่มงาน)',
    __income: 'รายได้ประจำ (เงินเดือนพื้นฐานต้องมากกว่า 0)'
  };
  var DOC_REQ_BY_TYPE = {
    CONTRACT: ['full_name', 'emp_code', 'position_name', 'department_name', 'start_date', 'base_salary'],
    PROBATION_RESULT: ['full_name', 'emp_code', 'position_name', 'department_name',
                       'start_date', 'base_salary', '__eff'],
    WARNING: ['full_name', 'emp_code', 'position_name', 'department_name',
              '__eff', '__subject', '__incident', '__item1'],
    CONTRACT_PROBATION: ['full_name', 'emp_code', 'position_name', 'department_name',
                         'start_date', 'base_salary', '__docdate'],
    SUSPENSION: ['full_name', 'emp_code', 'position_name', 'department_name',
                 '__subject2', '__incdetail', '__sstart', '__send', '__sorder', '__payrate', '__eff'],
    COE: ['full_name', 'emp_code', 'position_name', 'department_name', 'start_date',
          '__docdate2', '__purpose', '__signer', '__signerpos', '__eff', '__active'],
    SALARY_CERT: ['full_name', 'emp_code', 'position_name', 'department_name', 'start_date',
                  '__docdate2', '__purpose', '__signer', '__signerpos', '__eff', '__income'],
    SEPARATION: ['full_name', 'emp_code', 'position_name', 'department_name', 'start_date',
                 '__docdate2', '__purpose', '__signer', '__signerpos', '__eff',
                 '__resigned', '__term', '__service']
  };
  function docMissingFields(p, type, opts) {
    p = p || {}; opts = opts || {};
    var req = DOC_REQ_BY_TYPE[type];
    if (!req) return [];
    return req.filter(function (k) {
      if (k === '__eff') return !docThaiDate(opts.effective_date || p.effective_date);
      if (k === '__subject') return String(opts.warning_subject || '').trim() === '';
      if (k === '__incident') return !docThaiDate(opts.incident_date);
      if (k === '__item1') return String(opts.warning_item_1 || '').trim() === '';
      if (k === '__docdate') return !docThaiDate(opts.document_date || p.document_date);
      if (k === '__sstart') return !docThaiDate(opts.suspension_start);
      if (k === '__send') return !docThaiDate(opts.suspension_end);
      if (k === '__sorder') {
        return !!(docThaiDate(opts.suspension_start) && docThaiDate(opts.suspension_end) &&
          docSuspDays(opts.suspension_start, opts.suspension_end) <= 0);
      }
      if (k === '__payrate') {
        var pv = String(opts.pay_rate_percent == null ? '' : opts.pay_rate_percent).trim();
        return pv === '' || !isFinite(Number(pv)) || Number(pv) < 0 || Number(pv) > 100;
      }
      if (k === '__subject2') {
        return String(opts.suspension_subject || '').trim() === '';
      }
      if (k === '__incdetail') {
        return String(opts.incident_detail || '').trim() === '' &&
          [1, 2, 3].every(function (n2) { return String(opts['incident_item_' + n2] || '').trim() === ''; });
      }
      if (k === '__purpose') return String(opts.certificate_purpose || '').trim() === '';
      if (k === '__signer') return String(opts.signer_name || '').trim() === '';
      if (k === '__signerpos') return String(opts.signer_position || '').trim() === '';
      if (k === '__docdate2') return !docThaiDate(opts.document_date || p.document_date);
      if (k === '__active') return ['ACTIVE', 'PROBATION'].indexOf(p.status) < 0;
      if (k === '__resigned') return p.status !== 'RESIGNED';
      if (k === '__term') return !docThaiDate(opts.termination_date || p.resign_date);
      if (k === '__service') {
        var te = opts.termination_date || p.resign_date;
        return !(docThaiDate(te) && docServiceText(p.start_date, te));
      }
      if (k === '__income') return docIncome(opts, p).base <= 0;   // ต้องมีเงินเดือนพื้นฐานจริง
      if (k === 'base_salary') { var v = p[k]; return v == null || v === '' || Number(v) <= 0; }
      return p[k] == null || String(p[k]).trim() === '';
    }).map(function (k) { return DOC_FIELD_TH[k] || k; });
  }
  // ชื่อ Draft ตามพนักงาน — ไม่ให้ Draft ของแต่ละคนทับกัน
  function docDraftTitle(type, p) {
    if (!p || !p.emp_code) return docTypeLabel(type);
    return docTypeLabel(type) + ' - ' + p.emp_code + ' ' + (p.full_name || '');
  }
  /* ข้อความสัญญาจ้างงานมาตรฐาน (Template กลาง) — เก็บเป็น Placeholder แล้วแทนค่าตอนใช้งาน */
  function docContractTemplate() {
    function clause(no, head, paras) {
      return '<p><b>ข้อ ' + no + ' ' + head + '</b></p>' +
        paras.map(function (t) { return '<p>' + t + '</p>'; }).join('');
    }
    return [
      '<p>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ซึ่งต่อไปในสัญญานี้เรียกว่า “นายจ้าง” ฝ่ายหนึ่ง ' +
        'กับ {{employee_name}} รหัสพนักงาน {{employee_code}} ' +
        'ซึ่งต่อไปในสัญญานี้เรียกว่า “ลูกจ้าง” อีกฝ่ายหนึ่ง</p>',
      '<p>คู่สัญญาทั้งสองฝ่ายตกลงทำสัญญาจ้างงาน โดยมีรายละเอียดและเงื่อนไขดังต่อไปนี้</p>',
      clause(1, 'การจ้างและวันเริ่มปฏิบัติงาน', [
        'นายจ้างตกลงว่าจ้างลูกจ้างให้ปฏิบัติงานในตำแหน่ง {{position}} สังกัดแผนก {{department}} ' +
        'โดยให้ถือว่าลูกจ้างเริ่มปฏิบัติงานและมีอายุงานต่อเนื่องนับตั้งแต่วันที่ {{hire_date_thai}}'
      ]),
      clause(2, 'ค่าจ้างและสิทธิประโยชน์', [
        'นายจ้างตกลงจ่ายค่าจ้างให้แก่ลูกจ้างในอัตรา {{base_salary}} บาทต่อเดือน ({{base_salary_text}}) ' +
        'โดยจ่ายตามรอบและวิธีการจ่ายเงินเดือนที่บริษัทกำหนด',
        'ทั้งนี้ ค่าจ้าง สิทธิประโยชน์ และสวัสดิการของลูกจ้างต้องไม่น้อยกว่าที่กฎหมายกำหนด'
      ]),
      clause(3, 'การบังคับบัญชาและหน้าที่ความรับผิดชอบ', [
        'ลูกจ้างอยู่ภายใต้การบังคับบัญชาของกรรมการผู้จัดการ หรือบุคคลที่นายจ้างมอบหมาย ' +
        'และตกลงปฏิบัติหน้าที่ตามขอบเขตความรับผิดชอบของตำแหน่ง ' +
        'รวมถึงงานอื่นที่เกี่ยวข้องตามที่นายจ้างมอบหมายโดยชอบด้วยกฎหมาย'
      ]),
      clause(4, 'การปฏิบัติตามระเบียบของบริษัท', [
        'ลูกจ้างตกลงปฏิบัติตามข้อบังคับเกี่ยวกับการทำงาน ระเบียบ ประกาศ นโยบาย ' +
        'และคำสั่งอันชอบด้วยกฎหมายของนายจ้างอย่างเคร่งครัด',
        'ลูกจ้างต้องปฏิบัติหน้าที่ด้วยความซื่อสัตย์สุจริต มีความรับผิดชอบ ใช้ความระมัดระวัง ' +
        'และรักษาผลประโยชน์ของนายจ้างอย่างเต็มความสามารถ'
      ]),
      clause(5, 'การรักษาความลับ', [
        'ลูกจ้างตกลงเก็บรักษาข้อมูลทางธุรกิจ ข้อมูลลูกค้า ข้อมูลพนักงาน ข้อมูลทางการเงิน ' +
        'ความลับทางการค้า เอกสาร และข้อมูลภายในของนายจ้างไว้เป็นความลับ',
        'ลูกจ้างจะไม่นำข้อมูลดังกล่าวไปเปิดเผย ใช้ประโยชน์ หรือส่งต่อแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต ' +
        'ทั้งในระหว่างการจ้างงานและภายหลังสิ้นสุดการจ้าง ' +
        'เว้นแต่เป็นการดำเนินการตามหน้าที่หรือตามที่กฎหมายกำหนด'
      ]),
      clause(6, 'เงื่อนไขการทำงาน', [
        'วันและเวลาทำงาน วันหยุด วันลา การทำงานล่วงเวลา สวัสดิการ การประเมินผล ' +
        'การดำเนินการทางวินัย และการสิ้นสุดการจ้าง ' +
        'ให้เป็นไปตามข้อบังคับเกี่ยวกับการทำงานของบริษัทและกฎหมายที่ใช้บังคับ'
      ]),
      '<p>คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาฉบับนี้โดยครบถ้วนแล้ว ' +
        'จึงลงลายมือชื่อไว้เป็นหลักฐาน</p>'
    ].join('');
  }

  /* หนังสือแจ้งผลผ่านทดลองงาน — Template มาตรฐาน (HTML เพื่อคงตัวหนา/จัดกึ่งกลาง/จัดแนว) */
  function docProbationLabel(t) {
    return '<b style="display: inline-block; min-width: 118px">' + t + ' :</b> ';
  }
  function docProbationTemplate() {
    return [
      '<p><b>เรื่อง</b> แจ้งผลผ่านการทดลองงานและบรรจุเป็นพนักงานประจำ</p>',
      '<p><b>เรียน</b> {{employee_name}}</p>',
      '<p>ตามที่บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ได้ตกลงรับท่านเข้าปฏิบัติงานกับบริษัท ' +
        'โดยมีรายละเอียดดังต่อไปนี้</p>',
      '<p>' + docProbationLabel('ชื่อ–นามสกุล') + '{{employee_name}}</p>',
      '<p>' + docProbationLabel('รหัสพนักงาน') + '{{employee_code}}</p>',
      '<p>' + docProbationLabel('ตำแหน่ง') + '{{position}}</p>',
      '<p>' + docProbationLabel('แผนก') + '{{department}}</p>',
      '<p>' + docProbationLabel('วันที่เริ่มงาน') + '{{hire_date_thai}}</p>',
      '<p>' + docProbationLabel('เงินเดือน') + '{{salary}} บาทต่อเดือน</p>',
      '<p>และกำหนดให้ท่านอยู่ในระหว่างการทดลองงาน เพื่อประเมินความรู้ ความสามารถ ผลการปฏิบัติงาน ' +
        'ความประพฤติ และความเหมาะสมกับตำแหน่งงานนั้น</p>',
      '<p>บัดนี้ บริษัทได้ดำเนินการประเมินผลการปฏิบัติงานของท่านเรียบร้อยแล้ว ' +
        'และพิจารณาเห็นว่าท่านมีผลการปฏิบัติงานอยู่ในเกณฑ์ที่บริษัทกำหนด ' +
        'บริษัทจึงขอแจ้งผลการทดลองงานของท่านว่า</p>',
      '<p style="text-align: center"><b>“ผ่านการทดลองงาน”</b></p>',
      '<p>บริษัทตกลงบรรจุท่านเป็นพนักงานประจำ ในตำแหน่ง {{position}} แผนก {{department}} ' +
        'โดยมีผลตั้งแต่วันที่ {{effective_date_thai}} เป็นต้นไป ' +
        'และให้นับอายุงานต่อเนื่องตั้งแต่วันที่ {{hire_date_thai}}</p>',
      '<p>ท่านจะได้รับค่าจ้าง สิทธิประโยชน์ และสวัสดิการตามตำแหน่งงาน รวมถึงสิทธิต่าง ๆ ' +
        'ตามข้อบังคับเกี่ยวกับการทำงาน ระเบียบ ประกาศ และนโยบายของบริษัท ทั้งนี้ ' +
        'เงื่อนไขการจ้างงานอื่นให้เป็นไปตามสัญญาจ้างงานและระเบียบของบริษัทที่มีผลใช้บังคับ</p>',
      '<p>บริษัทขอแสดงความยินดี และหวังเป็นอย่างยิ่งว่าท่านจะปฏิบัติหน้าที่ด้วยความรับผิดชอบ ' +
        'ซื่อสัตย์สุจริต และร่วมพัฒนาองค์กรให้เจริญก้าวหน้าต่อไป</p>',
      '<p>จึงเรียนมาเพื่อทราบและถือปฏิบัติ</p>'
    ].join('');
  }

  /* หนังสือเตือนพนักงาน — Template มาตรฐาน (HTML คงตัวหนา/จัดแนว/Number List จริง) */
  function docWarningTemplate(opts) {
    opts = opts || {};
    var items = [];
    for (var i = 1; i <= 4; i++) {
      var v = String(opts['warning_item_' + i] || '').trim();
      if (v) items.push('<li>{{warning_item_' + i + '}}</li>');   // ข้อที่ว่างจะไม่ถูกแสดงเลย
    }
    if (!items.length) items.push('<li>{{warning_item_1}}</li>'); // ยังไม่กรอก → คง Placeholder ให้ตรวจจับได้
    return [
      '<p><b>เรื่อง</b> {{warning_subject}}</p>',
      '<p><b>เรียน</b> {{employee_name}}</p>',
      /* ข้อมูลพนักงาน 4 บรรทัดถูกยุบมาอยู่ในประโยคเปิด ไม่ซ้ำกับกล่องข้อมูลพนักงานด้านบนอีก
         ทุกค่ายังเป็น Token ของเอกสารจริง ไม่มีการ Hardcode */
      '<p>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ได้ตรวจสอบการปฏิบัติงานของ ' +
        '{{employee_name}} รหัสพนักงาน {{employee_code}} ตำแหน่ง {{position}} แผนก {{department}} ' +
        'และพบว่า เมื่อวันที่ {{incident_date_thai}} ท่านมีพฤติการณ์ในการปฏิบัติงานดังต่อไปนี้</p>',
      '<ol>' + items.join('') + '</ol>',
      '<p>พฤติการณ์ดังกล่าวถือเป็นการไม่ปฏิบัติตามข้อบังคับเกี่ยวกับการทำงาน ระเบียบ ' +
        'และคำสั่งของบริษัท บริษัทจึงออกหนังสือเตือนฉบับนี้ ' +
        'เพื่อให้ท่านตระหนักถึงหน้าที่และความรับผิดชอบของตน ตลอดจนปรับปรุงการปฏิบัติงาน ' +
        'และปฏิบัติตามคำสั่งของผู้บังคับบัญชาโดยเคร่งครัด</p>',
      '<p>บริษัทขอให้ท่านยุติพฤติการณ์ดังกล่าวและปรับปรุงการปฏิบัติงานโดยทันที ' +
        'หากภายหลังยังปรากฏพฤติการณ์ในลักษณะเดียวกัน หรือมีการกระทำผิดซ้ำ ' +
        'บริษัทจะพิจารณาดำเนินการทางวินัยตามข้อบังคับเกี่ยวกับการทำงาน ระเบียบของบริษัท ' +
        'และกฎหมายที่ใช้บังคับ ซึ่งอาจรวมถึงการพิจารณาเลิกจ้าง ' +
        'ทั้งนี้ บริษัทจะพิจารณาตามข้อเท็จจริงและความร้ายแรงของการกระทำเป็นรายกรณี</p>',
      '<p>หนังสือเตือนฉบับนี้จะถูกจัดเก็บไว้ในประวัติการทำงานของท่าน ' +
        'เพื่อใช้เป็นหลักฐานประกอบการบริหารงานบุคคลและการพิจารณาทางวินัยของบริษัทต่อไป</p>',
      '<p>จึงเรียนมาเพื่อทราบ และให้ปรับปรุงการปฏิบัติงานโดยเคร่งครัด</p>'
    ].join('');
  }

  /* หนังสือพักงาน — Template มาตรฐาน (HTML คงตัวหนา/Number List จริง)
     ใช้ข้อความตามที่กำหนดทุกตัวอักษร ไม่มีข้อความอื่นเพิ่ม */
  function docSuspensionTemplate() {
    return [
      '<p><b>เรื่อง</b> {{suspension_subject}}</p>',
      '<p><b>เรียน</b> {{employee_name}}</p>',
      '<p>ตามที่บริษัทได้รับรายงานเกี่ยวกับเหตุการณ์หรือการปฏิบัติงานของท่าน ' +
        'ซึ่งอาจเกี่ยวข้องกับกรณี {{incident_detail}}</p>',
      '<p>เพื่อให้การตรวจสอบข้อเท็จจริงเป็นไปด้วยความเรียบร้อย โปร่งใส และเป็นธรรม ' +
        'บริษัทจึงมีคำสั่งให้ท่านพักงานเป็นการชั่วคราวเพื่อสอบสวนข้อเท็จจริง ' +
        'ตั้งแต่วันที่ {{suspension_start_date_thai}} ถึงวันที่ {{suspension_end_date_thai}} ' +
        'รวมระยะเวลา {{suspension_days}} วัน</p>',
      '<p>ในระหว่างการพักงาน บริษัทจะจ่ายเงินให้ท่านในอัตราร้อยละ {{pay_rate_percent}} ' +
        'ของค่าจ้างในวันทำงาน โดยไม่น้อยกว่าอัตราที่กฎหมายกำหนด ' +
        'และจะจ่ายตามรอบการจ่ายค่าจ้างของบริษัท</p>',
      '<p>ระหว่างการพักงาน ขอให้ท่านปฏิบัติดังต่อไปนี้</p>',
      '<ol>' +
      '<li>ให้ความร่วมมือและเข้าชี้แจงข้อเท็จจริงตามวัน เวลา และสถานที่ที่บริษัทกำหนด</li>' +
      '<li>งดเข้าปฏิบัติงานหรือเข้าสถานที่ทำงาน เว้นแต่ได้รับอนุญาตจากบริษัท</li>' +
      '<li>งดเข้าถึง ใช้งาน หรือแก้ไขข้อมูล เอกสาร และระบบของบริษัทโดยไม่ได้รับอนุญาต</li>' +
      '<li>รักษาความลับเกี่ยวกับการสอบสวนและข้อมูลของบริษัทอย่างเคร่งครัด</li></ol>',
      '<p>คำสั่งพักงานฉบับนี้เป็นมาตรการชั่วคราวเพื่อประโยชน์ในการสอบสวนข้อเท็จจริง ' +
        'มิได้ถือเป็นการวินิจฉัยว่าท่านได้กระทำความผิดแล้ว เมื่อการสอบสวนเสร็จสิ้น ' +
        'บริษัทจะแจ้งผลให้ท่านทราบ และดำเนินการตามข้อเท็จจริง ข้อบังคับเกี่ยวกับการทำงาน ' +
        'และกฎหมายที่เกี่ยวข้องต่อไป</p>',
      '<p>จึงเรียนมาเพื่อทราบและถือปฏิบัติ</p>'
    ].join('');
  }

  /* สัญญาจ้างงานและข้อตกลงทดลองงาน — Template มาตรฐาน (HTML คงหัวข้อกึ่งกลาง/ตัวหนา/ย่อหน้า) */
  function docContractProbationTemplate() {
    function clause(no, head, body) {
      return '<p><b>ข้อ ' + no + ' ' + head + '</b></p><p>' + body + '</p>';
    }
    return [
      '<p style="text-align: center"><b>สัญญาจ้างงานและข้อตกลงทดลองงาน</b></p>',
      '<p>สัญญาฉบับนี้จัดทำขึ้น ณ วันที่ {{document_date_thai}} ระหว่าง ' +
        'บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ซึ่งต่อไปเรียกว่า “นายจ้าง” ฝ่ายหนึ่ง ' +
        'กับ {{employee_name}} รหัสพนักงาน {{employee_code}} ซึ่งต่อไปเรียกว่า “ลูกจ้าง” อีกฝ่ายหนึ่ง ' +
        'โดยทั้งสองฝ่ายตกลงกันดังต่อไปนี้</p>',
      clause(1, 'การว่าจ้าง',
        'นายจ้างตกลงจ้างลูกจ้างในตำแหน่ง {{position}} แผนก {{department}} ' +
        'เริ่มปฏิบัติงานตั้งแต่วันที่ {{hire_date_thai}} ' +
        'โดยอยู่ภายใต้การบังคับบัญชาของ {{supervisor_name}} หรือบุคคลที่บริษัทมอบหมาย'),
      clause(2, 'ค่าจ้าง',
        'นายจ้างตกลงจ่ายค่าจ้างให้ลูกจ้างในอัตรา {{salary}} บาทต่อเดือน ' +
        'โดยจ่ายตามรอบการจ่ายเงินเดือนของบริษัท'),
      clause(3, 'ระยะเวลาทดลองงาน',
        'ลูกจ้างตกลงทดลองงานเป็นระยะเวลาไม่เกิน 119 วัน นับตั้งแต่วันเริ่มปฏิบัติงาน ' +
        'เพื่อประเมินความรู้ ความสามารถ ผลการปฏิบัติงาน ความประพฤติ และความเหมาะสมกับตำแหน่ง'),
      clause(4, 'ผลการทดลองงาน',
        'เมื่อครบกำหนดทดลองงาน นายจ้างจะแจ้งผลการประเมินให้ลูกจ้างทราบ ' +
        'หากผ่านการทดลองงาน นายจ้างจะออกหนังสือแจ้งผลและบรรจุเป็นพนักงานประจำ ' +
        'หากไม่ผ่านการทดลองงาน นายจ้างอาจยุติการจ้างโดยดำเนินการตามกฎหมาย'),
      clause(5, 'หน้าที่ของลูกจ้าง',
        'ลูกจ้างตกลงปฏิบัติหน้าที่ด้วยความซื่อสัตย์สุจริต รับผิดชอบ ' +
        'และปฏิบัติตามข้อบังคับ ระเบียบ ประกาศ นโยบาย และคำสั่งอันชอบด้วยกฎหมายของนายจ้าง'),
      clause(6, 'การรักษาความลับ',
        'ลูกจ้างตกลงรักษาข้อมูลของบริษัท ลูกค้า คู่ค้า พนักงาน และความลับทางการค้าไว้เป็นความลับ ' +
        'ทั้งในระหว่างการจ้างและภายหลังสิ้นสุดการจ้าง'),
      clause(7, 'สิทธิและสวัสดิการ',
        'วันและเวลาทำงาน วันหยุด วันลา ค่าล่วงเวลา และสวัสดิการต่าง ๆ ' +
        'ให้เป็นไปตามข้อบังคับของบริษัทและกฎหมายที่ใช้บังคับ'),
      '<p>ทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญานี้แล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน</p>'
    ].join('');
  }

  /* เอกสารรับรอง 3 ประเภท — ส่วนท้ายลงนามชุดเดียว (ไม่ใช้ช่องลงนาม 4 ช่องของระบบ) */
  function docCertTail() {
    return [
      '<p>ออกให้ ณ วันที่ {{document_date_text_thai}}</p>',
      '<p class="doc-sig-line">ลงชื่อ ...............................................................</p>',
      '<p>({{authorized_signer_name}})</p>',
      '<p>ตำแหน่ง {{authorized_signer_position}}</p>',
      '<p>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</p>'
    ].join('');
  }
  function docCertRow(label, token) {
    return '<p><b style="display: inline-block; min-width: 148px">' + label + '</b>' + token + '</p>';
  }
  /* ท้ายหนังสือรับรองการทำงาน — บล็อกวันที่/ลายเซ็นชิดฝั่งขวา (เฉพาะ COE)
     ใช้ margin-left + text-align ซึ่งเป็น style ที่ docSanitizeHtml อนุญาต
     แยกจาก docCertTail() เพื่อไม่ให้กระทบหนังสือรับรองเงินเดือนและหนังสือพ้นสภาพ */
  function docCoeTail() {
    var R = ' style="margin-left: 52%; text-align: center"';
    return [
      '<p' + R + '>ออกให้ ณ วันที่ {{document_date_text_thai}}</p>',
      '<p' + R + '>&nbsp;</p>',
      '<p' + R + '>ลงชื่อ ...............................................</p>',
      '<p' + R + '>({{authorized_signer_name}})</p>',
      '<p' + R + '>ตำแหน่ง {{authorized_signer_position}}</p>',
      '<p' + R + '>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</p>'
    ].join('');
  }
  /* 1) หนังสือรับรองการทำงาน (พนักงานปัจจุบัน) — ไม่มีข้อมูลเงินเดือน
     ข้อความเป็นย่อหน้าจดหมายชิดซ้ายตามเอกสารตัวอย่างที่อนุมัติแล้ว
     ทุกค่ามาจาก Token ของเอกสารจริง ไม่มีการ Hardcode ชื่อ/รหัส/ตำแหน่ง/แผนก/วันที่ */
  function docCoeTemplate() {
    return [
      '<p><b>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</b> ขอรับรองว่า ' +
        '<b>{{employee_name}}</b> รหัสพนักงาน {{employee_code}} ' +
        'ปัจจุบันดำรงตำแหน่ง {{position}} สังกัดแผนก {{department}} ' +
        'โดยเริ่มปฏิบัติงานกับบริษัทตั้งแต่วันที่ {{hire_date_thai}} ' +
        'และยังคงมีสถานภาพเป็นพนักงานของบริษัทจนถึงปัจจุบัน ' +
        'ตลอดระยะเวลาการปฏิบัติงาน บุคคลดังกล่าวได้ปฏิบัติหน้าที่ตามตำแหน่ง ' +
        'และความรับผิดชอบที่ได้รับมอบหมายจากบริษัท</p>',
      '<p>หนังสือรับรองฉบับนี้ออกให้ตามคำขอของพนักงาน เพื่อใช้เป็นหลักฐาน{{certificate_purpose}} ' +
        'และเพื่อรับรองสถานภาพการทำงานตามรายละเอียดที่ปรากฏข้างต้น</p>',
      '<p style="text-align: center"><b>จึงออกหนังสือรับรองฉบับนี้ไว้เป็นหลักฐาน</b></p>',
      docCoeTail()
    ].join('');
  }
  /* 2) หนังสือรับรองเงินเดือน — ข้อความมาตรฐานตามที่กำหนด (รายได้ประจำเท่านั้น)
     รายการรายได้จัดเป็น 2 คอลัมน์แบบไม่มีเส้นขอบ · จำนวนเงินชิดขวา · ยอดรวมเป็นตัวหนา */
  function docPayRow(label, token, bold) {
    var b0 = bold ? '<b>' : '', b1 = bold ? '</b>' : '';
    return '<p style="display: flex">' +
      '<span style="min-width: 250px">' + b0 + label + b1 + '</span>' +
      '<span style="min-width: 150px; text-align: right">' + b0 + token + b1 + '</span>' +
      '<span style="min-width: 100px">&nbsp;บาทต่อเดือน</span></p>';
  }
  /* ท้ายหนังสือรับรองเงินเดือน — คัดตำแหน่งจาก PDF ตัวอย่างที่อนุมัติแล้ว
     วัดจากไฟล์จริง (กว้าง 594.96pt · ขอบเนื้อหา 56.7–538.3pt · กว้าง 481.6pt):
       "ออกให้ ณ วันที่ …"  เริ่มที่ x = 149.9  (ชิดซ้ายในกล่องที่เยื้อง 14%)
       "ลงชื่อ …"           เริ่มที่ x = 336.4  (จัดกึ่งกลางในกล่องที่เยื้อง 14% → บล็อกอยู่กลางค่อนไปทางขวา)
       ระยะวันที่ → ลายเซ็น 71 · ระยะภายในบล็อก 24 / 23 / 24
     ค่า 14% สอบเทียบจากไฟล์ PDF ที่ระบบสร้างจริง ไม่ได้คำนวณจากทฤษฎี
     ใช้ margin-left + text-align ซึ่งเป็น style ที่ docSanitizeHtml อนุญาต
     แยกจาก docCertTail() จึงไม่กระทบหนังสือรับรองการพ้นสภาพ */
  function docSalaryCertTail() {
    var S = ' style="margin-left: 14%; text-align: center"';
    return [
      '<p style="margin-left: 14%">ออกให้ ณ วันที่ {{document_date_text_thai}}</p>',
      '<p' + S + '>&nbsp;</p>',
      '<p' + S + '>&nbsp;</p>',
      '<p' + S + '>ลงชื่อ ..............................................</p>',
      '<p' + S + '>({{authorized_signer_name}})</p>',
      '<p' + S + '>ตำแหน่ง {{authorized_signer_position}}</p>',
      '<p' + S + '>บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด</p>'
    ].join('');
  }
  function docSalaryCertTemplate(opts) {
    var inc = docIncome(opts || {}, (opts || {}).profile || {});
    var rows = docPayRow('เงินเดือนพื้นฐาน', '{{base_salary}}', false) +
      inc.items.map(function (x) {
        return docPayRow(x.name, money(x.amount), false);   // ชื่อรายการจริงจากผังเงินเดือน
      }).join('') +
      docPayRow('รวมรายได้ประจำทั้งสิ้น', '{{total_regular_income}}', true);
    return [
      '<p>หนังสือฉบับนี้ออกให้เพื่อรับรองว่า {{employee_name}} รหัสพนักงาน {{employee_code}} ' +
        'ปัจจุบันเป็นพนักงานของ บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ' +
        'และได้รับเงินเดือนพร้อมรายได้ประจำ ดังต่อไปนี้</p>',
      '<div class="doc-pay">' + rows + '</div>',
      '<p>({{total_regular_income_text}})</p>',
      '<p>ทั้งนี้ รายได้ดังกล่าวเป็นรายได้ก่อนหักภาษีเงินได้ เงินสมทบประกันสังคม ' +
        'และรายการหักอื่นตามที่กฎหมายหรือระเบียบของบริษัทกำหนด โดยไม่รวมค่าล่วงเวลา โบนัส ' +
        'ค่าคอมมิชชัน และรายได้อื่นที่ไม่แน่นอน</p>',
      '<p>บริษัทออกหนังสือรับรองฉบับนี้ตามคำขอของพนักงาน เพื่อใช้{{certificate_purpose}} ' +
        'โดยรับรองเฉพาะข้อเท็จจริงตามข้อความที่ระบุไว้ข้างต้น ' +
        'และไม่ก่อให้เกิดภาระผูกพันหรือความรับผิดอื่นใดแก่บริษัท</p>',
      docSalaryCertTail()
    ].join('');
  }
  /* 3) หนังสือรับรองการทำงาน (พ้นสภาพ) — ไม่มีเงินเดือน ไม่มีข้อความว่ายังทำงานอยู่ */
  function docSeparationTemplate() {
    return [
      '<p>หนังสือฉบับนี้ออกให้เพื่อรับรองว่า {{employee_name}} รหัสพนักงาน {{employee_code}} ' +
        'เคยเป็นพนักงานของ บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรูทส์ จำกัด ' +
        'โดยมีรายละเอียดการทำงานดังต่อไปนี้</p>',
      docCertRow('ตำแหน่งสุดท้าย', '{{position}}'),
      docCertRow('แผนก', '{{department}}'),
      docCertRow('วันที่เริ่มงาน', '{{hire_date_thai}}'),
      docCertRow('วันที่สิ้นสุดการทำงาน', '{{termination_date_thai}}'),
      docCertRow('ระยะเวลาปฏิบัติงาน', '{{service_duration_text}}'),
      '<p>ตลอดระยะเวลาการทำงาน บุคคลดังกล่าวได้ปฏิบัติหน้าที่ตามตำแหน่งและความรับผิดชอบ ' +
        'ที่บริษัทมอบหมาย จนกระทั่งสิ้นสุดการเป็นพนักงานในวันที่ระบุไว้ข้างต้น</p>',
      '<p>บริษัทออกหนังสือรับรองฉบับนี้ตามคำขอของบุคคลดังกล่าว ' +
        'เพื่อใช้เป็นหลักฐาน{{certificate_purpose}}</p>',
      docCertTail()
    ].join('');
  }

  function docDefaultBody(type, p, org, opts) {
    var name = p.full_name || '', code = p.emp_code || '';
    var pos = p.position_name || '-', dep = p.department_name || '-';
    var co = (org && org.company_name) || NJ_COMPANY_NAME;
    var start = p.start_date ? empBE(p.start_date) : '-';
    var sal = (p.base_salary != null && p.base_salary !== '') ? money(Number(p.base_salary)) + ' บาท' : '-';
    var sup = p.supervisor_name || '-';
    var head = 'พนักงานชื่อ ' + name + ' รหัสพนักงาน ' + code + ' ตำแหน่ง ' + pos + ' แผนก ' + dep;
    switch (type) {
      case 'CONTRACT':
        return docFillTokens(docContractTemplate(), docMergeMap(p, org, opts));
      case 'CONTRACT_PROBATION':
        return docFillTokens(docContractProbationTemplate(), docMergeMap(p, org, opts));
      case 'WARNING':
        return docFillTokens(docWarningTemplate(opts), docMergeMap(p, org, opts));
      case 'SUSPENSION':
        return docFillTokens(docSuspensionTemplate(), docMergeMap(p, org, opts));
      case 'PROBATION_RESULT':
        return docFillTokens(docProbationTemplate(), docMergeMap(p, org, opts));
      case 'COE':
        return docFillTokens(docCoeTemplate(), docMergeMap(p, org, opts));
      case 'SALARY_CERT':
        return docFillTokens(docSalaryCertTemplate(
          Object.assign({}, opts, { profile: p })), docMergeMap(p, org, opts));
      case 'SEPARATION':
        return docFillTokens(docSeparationTemplate(), docMergeMap(p, org, opts));
      default:
        return head;
    }
  }

  /* ---------- โหลดข้อมูลบริษัทสำหรับหัวเอกสาร ---------- */
  function docLoadOrg() {
    if (docOrg) return Promise.resolve(docOrg);
    return sbRpc('njhr_doc_org', { p_token: sbToken() }).then(function (r) {
      docOrg = (r && r.data) || {};
      return docOrg;
    });
  }

  /* ---------- หน้าหลัก ---------- */
  function viewHrDocs(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    if (docState.openId) { docRenderDetail(el); return; }
    /* ---------- แยกหน้าตาม Role ----------
       ผู้ดูแล  → ศูนย์จัดการเอกสาร HR เดิม (ไม่เปลี่ยนอะไรเลย)
       พนักงาน → "เอกสารของฉัน" แบบ Self Service
       ทั้งสองหน้าอ่านจาก njhr_doc_center_list ตัวเดียวกัน = Document Record เดียวกัน
       ไม่มี Table แยก ไม่มี Backend แยก เปลี่ยนแค่การจัดหน้าจอ */
    if (!docCanManage()) { docMyView(el); return; }
    var seq = ++docState.seq, mng = docCanManage();

    el.innerHTML =
      '<div class="card doc-top"><div class="card-head doc-listhead"><h3>ศูนย์จัดการเอกสาร HR</h3>' +
      '<span class="grow"></span>' +
      (mng ? '<button class="btn btn-ghost btn-sm" id="doc-org">' + icon('building') + ' หัวเอกสาร</button>' +
             '<button class="btn btn-ghost btn-sm" id="doc-xls">' + icon('download') + ' Export Excel</button>' +
             '<button class="btn btn-primary btn-sm doc-newbtn" id="doc-new">' + icon('plus') + ' สร้างเอกสาร</button>' : '') +
      '</div>' +
      // พนักงานทั่วไปยังเห็นคำอธิบายเดิม · ฝ่ายบุคคลไม่ต้องมีข้อความอธิบายแล้ว
      (mng ? '' : '<p class="muted" style="margin-top:0">เอกสารที่บริษัทส่งถึงคุณ — เปิดอ่านและกดรับทราบได้ที่นี่</p>') +
      '<div class="toolbar doc-filters">' +
      '<span class="search-box doc-search"><input id="doc-q" placeholder="ค้นหา เลขที่ / หัวข้อ / ชื่อ / รหัสพนักงาน" value="' + esc(docState.q) + '"></span>' +
      '<select id="doc-ftype"><option value="">ทุกประเภท</option>' +
      DOC_TYPES.map(function (t) {
        return '<option value="' + t.code + '"' + (docState.type === t.code ? ' selected' : '') + '>' + t.em + ' ' + esc(t.label) + '</option>';
      }).join('') + '</select>' +
      '<select id="doc-fstatus"><option value="">ทุกสถานะ</option>' +
      ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'ACKNOWLEDGED', 'REJECTED', 'ARCHIVED', 'CANCELLED']
        .map(function (s) {
          return '<option value="' + s + '"' + (docState.status === s ? ' selected' : '') + '>' +
            DOC_STATUS[s].em + ' ' + esc(DOC_STATUS[s].t) + '</option>';
        }).join('') + '</select>' +
      '<label class="field doc-dt"><span class="doc-dt-lbl">ตั้งแต่</span>' +
      '<input type="date" id="doc-from" aria-label="ตั้งแต่วันที่" value="' + esc(docState.from) + '"></label>' +
      '<label class="field doc-dt"><span class="doc-dt-lbl">ถึง</span>' +
      '<input type="date" id="doc-to" aria-label="ถึงวันที่" value="' + esc(docState.to) + '"></label>' +
      '<button class="btn btn-ghost btn-sm doc-clearbtn" id="doc-clear">ล้างตัวกรอง</button>' +
      '<span class="grow"></span><span id="doc-sum" class="doc-count"></span>' +
      '</div></div>' +
      '<div class="card p0"><div class="table-wrap"><table id="doc-table"><thead><tr>' +
      [['doc_no', 'เลขที่เอกสาร'], ['doc_type', 'ประเภท'], ['emp_name', 'ชื่อพนักงาน'], ['department', 'แผนก'],
       ['issued_at', 'วันที่ออก'], ['status', 'สถานะ'], ['approver_name', 'ผู้อนุมัติ'],
       ['acked_by', 'ผู้รับทราบ'], ['acked_at', 'วันที่รับทราบ']]
        .map(function (h) {
          return '<th class="doc-sort" data-sort="' + h[0] + '">' + esc(h[1]) +
            (docState.sort === h[0] ? (docState.desc ? ' ▾' : ' ▴') : '') + '</th>';
        }).join('') + '<th>การจัดการ</th></tr></thead>' +
      '<tbody id="doc-body"><tr><td colspan="10" class="muted" style="padding:18px">กำลังโหลด…</td></tr></tbody></table></div></div>' +
      '<div class="form-error" id="doc-err" role="alert" style="white-space:pre-line"></div>';

    var qEl = document.getElementById('doc-q');
    qEl.oninput = debounce(function () { docState.q = this.value.trim(); docLoadList(el, ++docState.seq); }, 320);
    ['ftype:type', 'fstatus:status', 'from:from', 'to:to'].forEach(function (m) {
      var p = m.split(':'), n = document.getElementById('doc-' + p[0]);
      if (n) n.onchange = function () { docState[p[1]] = this.value; docLoadList(el, ++docState.seq); };
    });
    document.getElementById('doc-clear').onclick = function () {
      docState.q = ''; docState.type = ''; docState.status = '';
      docState.from = ''; docState.to = ''; docState.empId = '';
      viewHrDocs(el);
    };
    if (mng) {
      document.getElementById('doc-new').onclick = function () { docForm(null, el); };
      document.getElementById('doc-org').onclick = function () { docOrgForm(el); };
      document.getElementById('doc-xls').onclick = function () { docExportXlsx(); };
    }
    docLoadOrg().catch(function () {});
    docLoadList(el, seq);
  }


  /* ================= เอกสารของฉัน (USER) =================
     Source of Truth = njhr_doc_center_list ตัวเดียวกับหน้าผู้ดูแล
     Server scope ที่ H3 ยืนยันแล้ว: (c.is_manager or d.employee_id = c.employee_id)
     และซ่อนฉบับที่ยังไม่ถูกส่ง — Frontend ไม่ส่ง employee_id ไปเลย
     แยก 2 กลุ่มด้วยสถานะจริงจาก DB ไม่ใช่ค่าที่คิดเองในเบราว์เซอร์ ================= */
  var DOC_MY_PENDING_ST = ['SENT', 'VIEWED'];

  /* 50 ทวิ เป็นเอกสารแจ้งให้ทราบ ไม่ต้องกดรับทราบและไม่ต้องลงนาม
     (สร้างด้วย requires_signature = false และไม่มี ACK row)
     จึงไม่นับเป็น "รอดำเนินการ" เหมือนสัญญาหรือหนังสือเตือน */
  function docIsWht50(r) { return r && r.doc_type === 'WHT50'; }

  function docMyIsPending(r) {
    if (docIsWht50(r)) return false;
    return DOC_MY_PENDING_ST.indexOf(r.status) >= 0;
  }

  // ป้ายสถานะฝั่งพนักงาน — อ้างอิง requires_signature จริงของเอกสารฉบับนั้น
  function docMyStateText(r) {
    /* 50 ทวิ ใช้คำของตัวเอง — ห้ามขึ้นว่า "รอรับทราบ" */
    if (docIsWht50(r)) {
      if (r.status === 'SENT') return 'ยังไม่ได้เปิด';
      if (r.status === 'VIEWED') return 'เปิดแล้ว';
    }
    if (r.status === 'SENT' || r.status === 'VIEWED') {
      return r.requires_signature ? 'รอลงนาม' : 'รอรับทราบ';
    }
    if (r.status === 'SIGNED') return 'ลงนามและยอมรับแล้ว';
    if (r.status === 'ACKNOWLEDGED') return 'รับทราบแล้ว';
    if (r.status === 'REJECTED') return 'ปฏิเสธแล้ว';
    if (r.status === 'ARCHIVED') return 'เก็บเข้าประวัติแล้ว';
    return (DOC_STATUS[r.status] && DOC_STATUS[r.status].t) || r.status;
  }

  function docMyCard(r) {
    /* ---------- 50 ทวิ: การ์ดเฉพาะ ----------
       หัวข้อบอกปีภาษี · วันที่ได้รับ · สถานะ ยังไม่ได้เปิด/เปิดแล้ว
       ปุ่ม ดูเอกสาร (เปิด Modal ในหน้าเดิม) และ ดาวน์โหลด
       ไม่มีปุ่มรับทราบ/ลงนาม เพราะเอกสารภาษีไม่ต้องทำสองอย่างนั้น */
    if (docIsWht50(r)) {
      var yr = (r.doc_meta && r.doc_meta.tax_year)
        ? (Number(r.doc_meta.tax_year) + 543) : '';
      var opened = r.status === 'VIEWED';
      return '<div class="card doc-my-card doc-wht50">' +
        '<div class="doc-my-head"><b>🧾 ' +
        esc(yr ? ('50 ทวิ ประจำปีภาษี ' + yr) : (r.title || docTypeLabel(r.doc_type))) + '</b>' +
        '<span class="badge ' + (opened ? 'badge-ok' : 'badge-info') + '">' +
        esc(docMyStateText(r)) + '</span></div>' +
        '<small class="muted">' + esc(r.doc_no || '') +
        ' · วันที่ได้รับ ' + docTS(r.sent_at || r.issued_at) + '</small>' +
        (opened && r.viewed_at ? '<small class="muted">เปิดเมื่อ ' + docTS(r.viewed_at) + '</small>' : '') +
        '<div class="doc-my-act">' +
        '<button class="btn btn-ghost btn-sm" data-doc-open="' + esc(r.id) + '">' +
        icon('eye') + ' ดูเอกสาร</button>' +
        '<button class="btn btn-ghost btn-sm" data-doc-dl="' + esc(r.id) + '">' +
        icon('download') + ' ดาวน์โหลด</button></div></div>';
    }

    var pend = docMyIsPending(r);
    var t = docTypeLabel(r.doc_type);
    var em = pend ? (r.requires_signature ? '🟠' : '🟡') : (r.status === 'REJECTED' ? '⛔' : '✅');
    return '<div class="card doc-my-card">' +
      '<div class="doc-my-head"><b>' + em + ' ' + esc(t) + '</b>' +
      '<span class="badge ' + (pend ? 'badge-warn' : (r.status === 'REJECTED' ? 'badge-bad' : 'badge-ok')) + '">' +
      esc(docMyStateText(r)) + '</span></div>' +
      '<small class="muted">' + esc(r.doc_no) + ' · ฉบับที่ ' + (r.version || 1) +
      ' · ออกเมื่อ ' + docTS(r.issued_at) + '</small>' +
      (r.acked_at ? '<small class="muted">ดำเนินการเมื่อ ' + docTS(r.acked_at) + '</small>' : '') +
      (r.status === 'REJECTED' && r.reject_reason
        ? '<small class="t-red">เหตุผล: ' + esc(r.reject_reason) + '</small>' : '') +
      '<div class="doc-my-act">' +
      '<button class="btn ' + (pend ? 'btn-primary' : 'btn-ghost') + ' btn-sm" data-doc-open="' + esc(r.id) + '">' +
      icon('eye') + (pend ? ' เปิดเอกสาร' : ' ดูเอกสาร') + '</button></div></div>';
  }

  function docMyView(el) {
    var seq = ++docState.seq;
    el.innerHTML =
      '<div class="card doc-top"><div class="card-head"><h3>' + icon('fileText') + ' เอกสารของฉัน</h3>' +
      '<span class="grow"></span><span id="doc-my-sum" class="doc-count"></span></div>' +
      '<p class="muted" style="margin:0">เอกสารที่บริษัทส่งถึงคุณ — เปิดอ่านแล้วกดรับทราบหรือลงนามได้ที่นี่</p></div>' +
      '<div id="doc-my-body"><div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div></div>' +
      '<div class="form-error" id="doc-err" role="alert" style="white-space:pre-line"></div>';

    docErr('');
    // ไม่ส่ง p_employee — ให้ Server เป็นผู้ผูก employee_id จาก token เท่านั้น
    sbRpcList('njhr_doc_center_list', {
      p_token: sbToken(), p_q: null, p_type: null, p_status: null, p_dept: null,
      p_employee: null, p_from: null, p_to: null, p_limit: 300, p_offset: 0
    }).then(function (rows) {
      if (seq !== docState.seq) return;
      docRows = rows || [];
      var pend = docRows.filter(docMyIsPending);
      var done = docRows.filter(function (r) { return !docMyIsPending(r); });
      var box = document.getElementById('doc-my-body');
      if (!box) return;
      box.innerHTML =
        '<div class="doc-my-sec"><div class="doc-my-sech">รอดำเนินการ' +
        (pend.length ? ' <span class="badge badge-warn">' + pend.length + '</span>' : '') + '</div>' +
        (pend.length ? pend.map(docMyCard).join('')
                     : '<div class="card"><small class="muted">ไม่มีเอกสารที่รอดำเนินการ</small></div>') + '</div>' +
        '<div class="doc-my-sec"><div class="doc-my-sech">ดำเนินการแล้ว' +
        (done.length ? ' <span class="badge badge-mut">' + done.length + '</span>' : '') + '</div>' +
        (done.length ? done.map(docMyCard).join('')
                     : '<div class="card"><small class="muted">ยังไม่มีเอกสารที่ดำเนินการแล้ว</small></div>') + '</div>';

      var sum = document.getElementById('doc-my-sum');
      if (sum) sum.textContent = 'ทั้งหมด ' + docRows.length + ' ฉบับ · รอดำเนินการ ' + pend.length;

      box.onclick = function (ev) {
        /* ปุ่มดาวน์โหลดของการ์ด 50 ทวิ — ใช้เส้นทางเดิม docPdfDownload()
           ซึ่งขอ Signed URL ผ่าน njhr_doc_pdf_access (ตรวจสิทธิ์เจ้าของที่ Server)
           ไม่เปิดแท็บใหม่ และไม่เปลี่ยนสถานะเป็นเปิดแล้ว */
        var dl = ev.target.closest ? ev.target.closest('[data-doc-dl]') : null;
        if (dl) {
          ev.preventDefault(); ev.stopPropagation();
          docPdfDownload(dl.dataset.docDl, dl);
          return;
        }
        var b = ev.target.closest ? ev.target.closest('[data-doc-open]') : null;
        if (!b) return;
        docState.openId = b.dataset.docOpen;
        viewHrDocs(el);
      };
      // ตัวเลขบน Badge เมนูมาจาก RPC เสมอ ไม่คำนวณจาก array นี้
      if (NJHR.layout && NJHR.layout.refreshDocPending) NJHR.layout.refreshDocPending();
    })['catch'](function (ex) {
      if (seq !== docState.seq) return;
      var box = document.getElementById('doc-my-body');
      if (box) box.innerHTML = '<div class="card">' + emptyState('โหลดเอกสารของคุณไม่สำเร็จ') + '</div>';
      docErr(ex.message || 'โหลดข้อมูลไม่สำเร็จ');
    });
  }

  function docLoadList(el, seq) {
    var body = document.getElementById('doc-body');
    if (body) body.innerHTML = '<tr><td colspan="10" class="muted" style="padding:18px">กำลังโหลด…</td></tr>';
    docErr('');
    sbRpcList('njhr_doc_center_list', {
      p_token: sbToken(), p_q: docState.q || null, p_type: docState.type || null,
      p_status: docState.status || null, p_dept: docState.dept || null,
      p_employee: docState.empId || null,
      p_from: docState.from || null, p_to: docState.to || null,
      p_limit: 300, p_offset: 0
    }).then(function (rows) {
      if (seq !== docState.seq) return;
      docRows = rows || [];
      docRenderTable(el);
    }).catch(function (er) {
      if (seq !== docState.seq) return;
      docErr(er.message || 'โหลดรายการเอกสารไม่สำเร็จ');
      if (body) body.innerHTML = '<tr><td colspan="10" class="muted" style="padding:18px">โหลดข้อมูลไม่สำเร็จ</td></tr>';
    });
  }

  function docSorted() {
    var k = docState.sort, dir = docState.desc ? -1 : 1;
    return docRows.slice().sort(function (a, b) {
      var x = a[k], y = b[k];
      if (x == null) x = ''; if (y == null) y = '';
      return String(x).localeCompare(String(y), 'th') * dir;
    });
  }

  function docRenderTable(el) {
    var body = document.getElementById('doc-body');
    if (!body) return;
    var rows = docSorted();
    var sum = document.getElementById('doc-sum');
    if (sum) sum.textContent = 'พบ ' + rows.length + ' ฉบับ';

    body.innerHTML = rows.length ? rows.map(function (r) {
      var td = docTypeDef(r.doc_type);
      return '<tr data-doc="' + esc(r.id) + '">' +
        '<td class="doc-c-no"><b>' + esc(r.doc_no) + '</b>' + (r.version > 1 ? '<small class="muted">ฉบับที่ ' + r.version + '</small>' : '') + '</td>' +
        '<td class="doc-c-type"><span class="doc-1l">' + td.em + ' ' + esc(td.label) + '</span></td>' +
        '<td class="doc-c-emp"><span class="doc-1l">' + esc(r.emp_name) + '</span>' +
        '<small class="muted">' + esc(r.emp_code) + '</small></td>' +
        '<td class="doc-c-dept"><span class="doc-1l">' + esc(r.department || '—') + '</span></td>' +
        '<td class="doc-c-date">' + docDate(r.issued_at) + '</td>' +
        '<td class="doc-c-status">' + docBadge(r.status) + '</td>' +
        '<td class="doc-c-person"><span class="doc-1l">' + esc(r.approver_name || '—') + '</span></td>' +
        '<td class="doc-c-person"><span class="doc-1l">' + esc(r.acked_by || '—') + '</span></td>' +
        '<td class="doc-c-date">' + (r.acked_at ? docTS(r.acked_at) : '—') + '</td>' +
        '<td class="doc-c-act"><span class="doc-acts">' +
        '<button class="btn-icon" data-doc-open="' + esc(r.id) + '" aria-label="เปิดเอกสาร" title="ดูเอกสาร">' +
        icon('eye') + '</button>' +
        (docCanDelete(r)
          ? '<button class="btn-icon ic-red" data-doc-del="' + esc(r.id) + '" aria-label="ลบเอกสาร" title="ลบเอกสาร">' +
            icon('trash') + '</button>'
          : '<button class="btn-icon ic-red" disabled aria-label="ไม่มีสิทธิ์ลบเอกสาร" title="ไม่มีสิทธิ์ลบเอกสาร">' +
            icon('trash') + '</button>') +
        '</span></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="10" class="muted" style="padding:18px">ไม่พบเอกสารตามเงื่อนไขที่เลือก</td></tr>';

    /* ผูกคำสั่งไว้กับ "ปุ่ม" โดยตรงเท่านั้น — ไม่ผูกกับ <tr>/<td> หรือ Container ของแถว
       คลิกตำแหน่งอื่นในแถวจึงไม่เกิดการทำงานใด ๆ */
    body.onclick = null;
    body.querySelectorAll('[data-doc-open]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        docState.openId = b.dataset.docOpen;      // ใช้ Document ID ของแถวนั้นโดยตรง
        viewHrDocs(el);
      };
    });
    body.querySelectorAll('[data-doc-del]').forEach(function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        if (b.disabled) return;
        docAskDelete(b.dataset.docDel, el);
      };
    });
    var th = document.getElementById('doc-table');
    if (th) th.querySelectorAll('.doc-sort').forEach(function (h) {
      h.onclick = function () {
        var k = h.dataset.sort;
        if (docState.sort === k) docState.desc = !docState.desc;
        else { docState.sort = k; docState.desc = true; }
        viewHrDocs(el);
      };
    });
  }

  /* ---------- ลบเอกสาร (Soft Delete) ---------- */
  function docAskDelete(id, el) {
    var r = null;
    for (var i = 0; i < docRows.length; i++) if (docRows[i].id === id) r = docRows[i];
    if (!r) return;
    if (!docCanDelete(r)) { docErr('คุณไม่มีสิทธิ์ลบเอกสารฉบับนี้'); return; }
    var issued = docIsIssued(r.status);
    var td = docTypeDef(r.doc_type);
    openModal('ต้องการลบเอกสารนี้ใช่หรือไม่?',
      '<div class="doc-emp doc-del-info">' +
      '<div class="doc-f"><small>เลขที่เอกสาร</small><b>' + esc(r.doc_no) + '</b></div>' +
      '<div class="doc-f"><small>ประเภทเอกสาร</small><b>' + td.em + ' ' + esc(td.label) + '</b></div>' +
      '<div class="doc-f"><small>รหัสพนักงาน</small><b>' + esc(r.emp_code || '—') + '</b></div>' +
      '<div class="doc-f"><small>ชื่อพนักงาน</small><b>' + esc(r.emp_name || '—') + '</b></div>' +
      '<div class="doc-f"><small>สถานะเอกสาร</small><b>' + docStat(r.status).em + ' ' +
      esc(docStat(r.status).t) + '</b></div></div>' +
      (issued
        ? '<div class="ot-warn">เอกสารฉบับนี้ออกใช้งานแล้ว — ต้องระบุเหตุผลการลบ</div>' +
          '<label class="field"><span>เหตุผลการลบ <i class="req">*</i></span>' +
          '<textarea id="doc-del-why" rows="2" placeholder="ระบุเหตุผลการลบเอกสาร"></textarea></label>'
        : '<p class="muted note">เอกสารจะถูกซ่อนออกจากรายการ แต่ข้อมูล ประวัติเอกสาร ' +
          'และ Audit Log ยังถูกเก็บไว้ในระบบครบถ้วน</p>') +
      '<div class="form-error" id="doc-del-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="doc-del-cancel">ยกเลิก</button>' +
      '<button class="btn btn-danger" id="doc-del-go">ยืนยันลบ</button>');
    document.getElementById('doc-del-cancel').onclick = closeModal;
    document.getElementById('doc-del-go').onclick = function () {
      var btn = this;
      var whyEl = document.getElementById('doc-del-why');
      var why = whyEl ? String(whyEl.value || '').trim() : '';
      var e2 = document.getElementById('doc-del-err');
      if (issued && !why) { e2.textContent = 'กรุณาระบุเหตุผลการลบ'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังลบ…';
      sbRpc('njhr_doc_delete', { p_token: sbToken(), p_id: id, p_reason: why || null })
        .then(function () {
          closeModal();
          // ถอดแถวออกจากตารางทันที ไม่ต้องโหลดหน้าใหม่
          docRows = docRows.filter(function (x) { return x.id !== id; });
          docRenderTable(el);
          toast('ลบเอกสารเรียบร้อยแล้ว', 'info');
        })
        .catch(function (er) {
          btn.disabled = false; btn.innerHTML = 'ยืนยันลบ';
          e2.textContent = er.message || 'ลบเอกสารไม่สำเร็จ';
        });
    };
  }

  /* ---------- ฟอร์มสร้าง / แก้ไขเอกสาร ---------- */
  function docForm(id, el) {
    var editing = !!id, cur = null;
    var picked = null;                       // พนักงานที่เลือก (ข้อมูลจริงจาก RPC)
    var profLive = null;                     // โปรไฟล์พนักงานสด (โหมดแก้ไข) — ใช้เฉพาะค่าที่ snapshot ไม่มี
    var approver = null;
    var bodyAuto = !editing;                 // true = เนื้อหายังเป็นของระบบ · false = ผู้ใช้แก้เองแล้ว
    var docPayData = null;                   // รายได้ประจำจากระบบเงินเดือน (อ่านอย่างเดียว)

    /* ข้อมูลพนักงานที่ใช้เติมเอกสาร — เลือกคนใหม่ใช้ข้อมูลสด
       ถ้าเป็นการแก้ไขเอกสารเดิม ใช้ doc_meta และเติมจาก snapshot บนตัวเอกสารให้ครบเสมอ
       (เอกสารที่ออกก่อนหน้าซึ่ง doc_meta ไม่ครบ จึงยังเปิดแก้ไขและบันทึกได้) */
    function docProfOf() {
      if (picked) return picked;
      if (!cur) return null;
      var m = Object.assign({}, cur.doc_meta || {});
      if (!m.full_name) m.full_name = cur.emp_name_snap || '';
      if (!m.emp_code) m.emp_code = cur.emp_code_snap || '';
      if (!m.position_name) m.position_name = cur.position_snap || '';
      if (!m.department_name) m.department_name = cur.dept_snap || '';
      if (!m.effective_date) m.effective_date = cur.effective_date || '';
      /* สถานะพนักงานและวันพ้นสภาพเป็น "สถานะปัจจุบัน" ไม่เคยถูกเก็บลง doc_meta ตอนสร้างเอกสาร
         จึงต้องอ่านจากโปรไฟล์สดของพนักงานคนเดียวกัน (njhr_doc_emp_profile ตัวเดิม)
         ไม่งั้นเงื่อนไข __active / __resigned จะไม่ผ่านเสมอเมื่อเปิดแก้ไขเอกสารเดิม */
      if (profLive) {
        if (m.status == null || m.status === '') m.status = profLive.status;
        if (m.resign_date == null || m.resign_date === '') m.resign_date = profLive.resign_date;
      }
      return m;
    }
    // วันที่มีผลจากฟอร์ม (ใช้เติม {{effective_date_thai}} ให้ตรงกับกล่องข้อมูลพนักงาน)
    function docEffDate() {
      var x = document.querySelector('#doc-f [name="effective_date"]');
      return x ? x.value : '';
    }
    function docXv(n) {
      var x = document.querySelector('#docf-extra [name="' + n + '"]');
      return x ? String(x.value || '').trim() : '';
    }
    function docOpts() {
      var m = (cur && cur.doc_meta) || {};
      return {
        effective_date: docEffDate(),
        warning_subject: docXv('warning_subject') || m.warning_subject || '',
        incident_date: docXv('incident_date') || m.incident_date || '',
        warning_item_1: docXv('warning_item_1') || m.warning_item_1 || '',
        warning_item_2: docXv('warning_item_2') || m.warning_item_2 || '',
        warning_item_3: docXv('warning_item_3') || m.warning_item_3 || '',
        warning_item_4: docXv('warning_item_4') || m.warning_item_4 || '',
        internal_note: docXv('internal_note') || m.internal_note || '',
        document_date: docXv('document_date') || m.document_date || '',
        suspension_start: docXv('suspension_start') || m.suspension_start || '',
        suspension_end: docXv('suspension_end') || m.suspension_end || '',
        pay_rate_percent: docXv('pay_rate_percent') || (m.pay_rate_percent == null ? '' : m.pay_rate_percent),
        incident_item_1: docXv('incident_item_1') || m.incident_item_1 || '',
        incident_item_2: docXv('incident_item_2') || m.incident_item_2 || '',
        incident_item_3: docXv('incident_item_3') || m.incident_item_3 || '',
        suspension_subject: docXv('suspension_subject') || m.suspension_subject || '',
        incident_detail: docXv('incident_detail') || m.incident_detail || '',
        certificate_purpose: (function () {
          var sel = document.querySelector('#docf-extra [name="purpose_sel"]');
          if (!sel) return m.certificate_purpose || '';
          return sel.value === '__other' ? docXv('purpose_other') : sel.value;
        })(),
        signer_name: docXv('signer_name') || m.signer_name || '',
        signer_position: docXv('signer_position') || m.signer_position || '',
        termination_date: docXv('termination_date') || m.termination_date || '',
        // รายได้ประจำ: ใช้ค่าที่ดึงจากระบบเงินเดือน · เปิด Draft เดิมใช้ snapshot ที่บันทึกไว้
        pay: docPayData || (m.pay_snapshot || null)
      };
    }
    // ช่องกรอกเฉพาะหนังสือตักเตือน (เก็บลง doc_meta เดิม ไม่แก้โครงฐานข้อมูล)
    function docRenderExtra(type) {
      var box = document.getElementById('docf-extra');
      if (!box) return;
      if (['WARNING', 'CONTRACT_PROBATION', 'SUSPENSION'].indexOf(type) < 0 && !docIsCert(type)) {
        box.innerHTML = ''; return;
      }
      if (box.dataset.on === '1') return;                 // สร้างครั้งเดียว ไม่ล้างค่าที่ผู้ใช้กรอก
      var m = (cur && cur.doc_meta) || {};
      function f(n, l, req, ph, tp) {
        return '<label class="field"><span>' + esc(l) + (req ? ' <i class="req">*</i>' : '') + '</span>' +
          '<input type="' + (tp || 'text') + '" name="' + n + '" value="' + esc(m[n] || '') +
          '" placeholder="' + esc(ph || '') + '"></label>';
      }
      if (docIsCert(type)) {
        var pf0 = docProfOf() || {};
        var pur = m.certificate_purpose || '';
        var isOther = pur !== '' && DOC_PURPOSES.indexOf(pur) < 0;
        box.innerHTML =
          '<div class="doc-extra"><div class="doc-extra-h">รายละเอียดหนังสือรับรอง</div>' +
          '<div class="form-2col">' +
          '<label class="field"><span>วันที่ออกเอกสาร <i class="req">*</i></span>' +
          '<input type="date" name="document_date" value="' + esc(m.document_date || todayISO()) + '"></label>' +
          '<label class="field"><span>วัตถุประสงค์การขอเอกสาร <i class="req">*</i></span>' +
          '<select name="purpose_sel">' +
          DOC_PURPOSES.map(function (x) {
            return '<option value="' + esc(x) + '"' + (pur === x ? ' selected' : '') + '>' + esc(x) + '</option>';
          }).join('') +
          '<option value="__other"' + (isOther ? ' selected' : '') + '>อื่น ๆ (ระบุเอง)</option></select></label></div>' +
          '<label class="field" id="docf-purpose-other"' + (isOther ? '' : ' style="display:none"') + '>' +
          '<span>ระบุวัตถุประสงค์</span><input name="purpose_other" value="' +
          (isOther ? esc(pur) : '') + '" placeholder="ระบุวัตถุประสงค์การขอเอกสาร"></label>' +
          '<div class="form-2col">' +
          '<label class="field"><span>ผู้มีอำนาจลงนาม <i class="req">*</i></span>' +
          '<input name="signer_name" value="' +
          esc(m.signer_name || (docOrg && docOrg.ceo_signer) || '') + '"></label>' +
          '<label class="field"><span>ตำแหน่งผู้มีอำนาจลงนาม <i class="req">*</i></span>' +
          '<input name="signer_position" value="' +
          esc(m.signer_position || (docOrg && docOrg.ceo_position) || '') + '"></label></div>' +
          (type === 'SEPARATION'
            ? '<div class="form-2col">' +
              '<label class="field"><span>วันที่พ้นสภาพ <i class="req">*</i></span>' +
              '<input type="date" name="termination_date" value="' +
              esc(m.termination_date || (pf0.resign_date ? String(pf0.resign_date).slice(0, 10) : '')) + '"></label>' +
              '<label class="field"><span>อายุงาน</span>' +
              '<input id="docf-service" value="" readonly placeholder="คำนวณอัตโนมัติ"></label></div>'
            : '') +
          (type === 'SALARY_CERT'
            ? '<div class="doc-extra-h" style="margin-top:6px">รายได้ประจำ (ดึงจากระบบเงินเดือน)</div>' +
              '<div id="docf-pay">' +
              '<small class="muted" style="padding:8px;display:block">กำลังโหลดข้อมูลเงินเดือน…</small></div>' +
              '<button type="button" class="btn btn-ghost btn-sm" id="docf-income-reload">' +
              icon('history') + ' อัปเดตข้อมูลรายได้ล่าสุด</button>'
            : '') +
          '<label class="field" style="margin-top:8px"><span>หมายเหตุภายใน (ไม่แสดงในเอกสาร/PDF)</span>' +
          '<textarea name="internal_note" rows="2">' + esc(m.internal_note || '') + '</textarea></label></div>';
        box.dataset.on = '1';
        box.oninput = function (ev) { docSyncCert(); onExtraInput(ev); };
        box.onchange = function (ev) { docSyncCert(); onExtraInput(ev); };
        var rl = document.getElementById('docf-income-reload');
        if (rl) rl.onclick = function () { docLoadPay(true); };
        if (type === 'SALARY_CERT') docLoadPay(false);
        docSyncCert();
        return;
      }
      if (type === 'SUSPENSION') {
        box.innerHTML =
          '<div class="doc-extra"><div class="doc-extra-h">รายละเอียดการพักงาน</div>' +
          '<label class="field"><span>เรื่องเอกสาร <i class="req">*</i></span>' +
          '<input name="suspension_subject" value="' +
          esc(m.suspension_subject || 'แจ้งคำสั่งพักงานเพื่อสอบสวนข้อเท็จจริง') + '"></label>' +
          '<div class="form-3col">' +
          '<label class="field"><span>วันที่เริ่มพักงาน <i class="req">*</i></span>' +
          '<input type="date" name="suspension_start" value="' + esc(m.suspension_start || '') + '"></label>' +
          '<label class="field"><span>วันที่สิ้นสุดการพักงาน <i class="req">*</i></span>' +
          '<input type="date" name="suspension_end" value="' + esc(m.suspension_end || '') + '"></label>' +
          '<label class="field"><span>จำนวนวันพักงาน</span>' +
          '<input id="docf-suspdays" value="" readonly placeholder="คำนวณอัตโนมัติ"></label></div>' +
          '<label class="field"><span>อัตราการจ่ายระหว่างพักงาน (%) <i class="req">*</i></span>' +
          '<input type="number" name="pay_rate_percent" min="0" max="100" step="1" value="' +
          esc(m.pay_rate_percent == null ? '50' : m.pay_rate_percent) + '"></label>' +
          '<label class="field"><span>รายละเอียดเหตุการณ์หรือกรณีสอบสวน <i class="req">*</i></span>' +
          '<textarea name="incident_detail" rows="2" placeholder="เช่น ไม่ปฏิบัติตามคำสั่งของผู้บังคับบัญชา">' +
          esc(m.incident_detail || [1, 2, 3].map(function (k) { return m['incident_item_' + k] || ''; })
              .filter(Boolean).join(' · ')) + '</textarea></label>' +
          '<label class="field"><span>หมายเหตุภายใน (ไม่แสดงในเอกสาร/PDF)</span>' +
          '<textarea name="internal_note" rows="2">' + esc(m.internal_note || '') + '</textarea></label></div>';
        box.dataset.on = '1';
        box.oninput = function (ev) { docSyncSuspDays(); onExtraInput(ev); };
        box.onchange = function (ev) { docSyncSuspDays(); onExtraInput(ev); };
        docSyncSuspDays();
        return;
      }
      if (type === 'CONTRACT_PROBATION') {
        box.innerHTML =
          '<div class="doc-extra"><div class="doc-extra-h">รายละเอียดสัญญา</div>' +
          f('document_date', 'วันที่จัดทำสัญญา', true, '',
            'date').replace('value=""', 'value="' + esc(m.document_date || todayISO()) + '"') +
          '<label class="field"><span>หมายเหตุภายใน (ไม่แสดงในเอกสาร/PDF)</span>' +
          '<textarea name="internal_note" rows="2">' + esc(m.internal_note || '') + '</textarea></label></div>';
        box.dataset.on = '1';
        box.oninput = onExtraInput;
        return;
      }
      box.innerHTML =
        '<div class="doc-extra"><div class="doc-extra-h">รายละเอียดหนังสือตักเตือน</div>' +
        '<div class="form-2col">' +
        f('warning_subject', 'เรื่องหนังสือตักเตือน', true, 'เช่น การละเลยหน้าที่และก่อให้เกิดความเสียหายต่อบริษัท') +
        f('incident_date', 'วันที่เกิดเหตุ', true, '', 'date') + '</div>' +
        f('warning_item_1', 'รายละเอียดความผิดข้อ 1', true, 'ระบุพฤติการณ์ที่ตรวจพบ') +
        f('warning_item_2', 'รายละเอียดความผิดข้อ 2', false, 'ไม่บังคับ — เว้นว่างได้') +
        f('warning_item_3', 'รายละเอียดความผิดข้อ 3', false, 'ไม่บังคับ — เว้นว่างได้') +
        f('warning_item_4', 'รายละเอียดความผิดข้อ 4', false, 'ไม่บังคับ — เว้นว่างได้') +
        '<label class="field"><span>หมายเหตุภายใน (ไม่แสดงในเอกสาร/PDF)</span>' +
        '<textarea name="internal_note" rows="2">' + esc(m.internal_note || '') + '</textarea></label></div>';
      box.dataset.on = '1';
      box.oninput = onExtraInput;
    }
    // จำนวนวันพักงาน = คำนวณจากวันที่เริ่ม/สิ้นสุด (ช่องอ่านอย่างเดียว ผู้ใช้ไม่ต้องกรอกซ้ำ)
    function docSyncSuspDays() {
      var el2 = document.getElementById('docf-suspdays');
      if (!el2) return;
      var n = docSuspDays(docXv('suspension_start'), docXv('suspension_end'));
      el2.value = n > 0 ? n + ' วัน' : '';
    }
    /* โหลดรายได้ประจำจากระบบเงินเดือนจริง (njhr_doc_salary_items)
       ไม่ให้ผู้ใช้พิมพ์ตัวเลขเอง · ไม่มีข้อมูลก็ไม่สร้างข้อมูลปลอม */
    function docRenderPay() {
      var box = document.getElementById('docf-pay');
      if (!box) return;
      var pay = docPayData;
      if (!pay) { box.innerHTML = '<small class="muted" style="padding:8px;display:block">กำลังโหลด…</small>'; return; }
      var inc = docIncome({ pay: pay }, docProfOf() || {});
      var warn = '';
      if (inc.base <= 0) {
        warn = '<div class="ot-warn">ไม่พบเงินเดือนพื้นฐานของพนักงานคนนี้ — ' +
          'กรุณาแก้ไขข้อมูลพนักงานที่หน้า "พนักงาน" ก่อนออกหนังสือรับรองเงินเดือน</div>';
      } else if (pay.source === 'NO_ENTRY' || !inc.items.length) {
        warn = '<div class="ot-warn">ไม่พบรายการรายได้ประจำในระบบเงินเดือน — ' +
          'เอกสารจะแสดงเฉพาะเงินเดือนพื้นฐาน</div>';
      }
      box.innerHTML = warn +
        '<div class="doc-pay-list">' +
        '<div class="doc-pay-row"><span>เงินเดือนพื้นฐาน</span><b>' + money(inc.base) + '</b></div>' +
        inc.items.map(function (x) {
          return '<div class="doc-pay-row"><span>' + esc(x.name) + '</span><b>' + money(x.amount) + '</b></div>';
        }).join('') +
        '<div class="doc-pay-row doc-pay-total"><span>รวมรายได้ประจำทั้งสิ้น</span><b>' +
        money(inc.total) + '</b></div></div>' +
        '<small class="muted" style="display:block;margin-top:6px">' +
        (inc.period ? 'อ้างอิงงวดเงินเดือน ' + esc(inc.period) + ' · ' : '') +
        'ตัวเลขดึงจากระบบเงินเดือนโดยตรง แก้ไขได้ที่หน้าเงินเดือนเท่านั้น</small>';
    }
    function docLoadPay(notify) {
      var pf = docProfOf() || {};
      if (!pf.id && !picked) { docPayData = { base_salary: pf.base_salary || 0, items: [], source: 'NO_ENTRY' }; docRenderPay(); return; }
      var empId = picked ? picked.id : (cur && cur.employee_id);
      if (!empId) { docPayData = { base_salary: pf.base_salary || 0, items: [], source: 'NO_ENTRY' }; docRenderPay(); return; }
      sbRpc('njhr_doc_salary_items', { p_token: sbToken(), p_employee: empId })
        .then(function (r) {
          docPayData = (r && r.data) || { base_salary: 0, items: [], source: 'NO_ENTRY' };
          docRenderPay();
          docSyncCert();
          onExtraInput({});
          if (notify) toast('ดึงข้อมูลรายได้ล่าสุดจากระบบเงินเดือนแล้ว', 'info');
        })
        .catch(function (er) {
          docPayData = { base_salary: pf.base_salary || 0, items: [], source: 'ERROR' };
          docRenderPay();
          gfNoop(er);
        });
    }
    function gfNoop() {}
    // อายุงาน / รายได้รวม / ช่องวัตถุประสงค์อื่น ๆ — คำนวณและซ่อน-แสดงให้อัตโนมัติ
    function docSyncCert() {
      var box = document.getElementById('docf-extra');
      if (!box) return;
      var oth = document.getElementById('docf-purpose-other');
      var sel = box.querySelector('[name="purpose_sel"]');
      if (oth && sel) oth.style.display = sel.value === '__other' ? '' : 'none';
      var svEl = document.getElementById('docf-service');
      if (svEl) {
        var pf = docProfOf() || {};
        svEl.value = docServiceText(pf.start_date, docXv('termination_date')) || '';
      }

    }
    var onExtraInput = debounce(function () {
      var tSel = document.getElementById('docf-type');
      var pf = docProfOf();
      if (pf && bodyAuto) docRteSet('docf-body', docDefaultBody(tSel.value, pf, docOrg, docOpts()));
      docSyncWarn(pf, tSel.value);
    }, 350);
    // เตือนเมื่อข้อมูลที่จำเป็นยังไม่ครบ (สัญญาจ้างงาน · หนังสือแจ้งผลผ่านทดลองงาน)
    function docSyncWarn(p2, type) {
      var box = document.getElementById('docf-warn');
      if (!box) return;
      if (!DOC_REQ_BY_TYPE[type] || !p2) { box.innerHTML = ''; return; }
      var miss = docMissingFields(p2, type, docOpts());
      box.innerHTML = miss.length
        ? '<div class="ot-warn">ข้อมูลยังไม่ครบ: <b>' + esc(miss.join(' · ')) + '</b><br>' +
          'กรุณาแก้ไขข้อมูลพนักงานที่หน้า "พนักงาน" หรือกรอกข้อมูลในฟอร์มให้ครบก่อนบันทึก</div>'
        : '';
    }

    function shell(inner, foot) {
      openModal(editing ? 'แก้ไขเอกสาร' : 'สร้างเอกสารใหม่', inner, foot, { wide: true });
    }

    function build(d) {
      cur = d;
      shell(
        '<form id="doc-f" novalidate>' +
        '<div class="form-2col">' +
        '<label class="field"><span>ประเภทเอกสาร <i class="req">*</i></span><select name="doc_type" id="docf-type"' +
        (editing ? ' disabled' : '') + '>' +
        /* 50 ทวิ ออกจากหน้า "รายงาน > รายงาน 50 ทวิ" เท่านั้น
           จึงไม่ให้เลือกในฟอร์มสร้างเอกสาร HR ทั่วไป
           แต่ยังคงอยู่ใน DOC_TYPES เพื่อใช้ชื่อ/ไอคอน และใช้กรองประเภทได้ตามปกติ */
        DOC_TYPES.filter(function (t) { return t.code !== 'WHT50'; }).map(function (t) {
          return '<option value="' + t.code + '"' + (d && d.doc_type === t.code ? ' selected' : '') + '>' +
            t.em + ' ' + esc(t.label) + '</option>';
        }).join('') + '</select></label>' +
        '<label class="field"><span>เลขที่เอกสาร</span><input value="' +
        esc(d ? d.doc_no : 'สร้างอัตโนมัติเมื่อบันทึก') + '" readonly></label></div>' +
        (editing
          ? '<label class="field"><span>พนักงาน</span><input value="' +
            esc((d.emp_code_snap || '') + ' ' + (d.emp_name_snap || '')) + '" readonly></label>'
          : '<div class="field"><span>พนักงาน <i class="req">*</i></span>' +
            '<span class="search-box doc-ac-box">' + icon('search', 'ic-sm') +
            '<input id="docf-emp" autocomplete="off" placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / ชื่อเล่น">' +
            '<div class="rpt-ac" id="docf-emp-ac" hidden></div></span>' +
            '<div id="docf-emp-info" class="doc-empinfo muted">ยังไม่ได้เลือกพนักงาน</div></div>') +
        '<div class="form-2col">' +
        '<label class="field"><span>หัวข้อเอกสาร <i class="req">*</i></span>' +
        '<input name="title" id="docf-title" value="' + esc(d ? d.title : '') + '"></label>' +
        '<label class="field"><span>วันที่มีผล</span>' +
        '<input type="date" name="effective_date" value="' + esc(d && d.effective_date ? String(d.effective_date).slice(0, 10) : todayISO()) + '"></label></div>' +
        '<div class="field"><span>ผู้อนุมัติ</span>' +
        '<span class="search-box doc-ac-box">' + icon('search', 'ic-sm') +
        '<input id="docf-appr" autocomplete="off" value="' + esc(d ? (d.approver_name || '') : '') + '" placeholder="ค้นหาหัวหน้างาน / ผู้บริหาร">' +
        '<div class="rpt-ac" id="docf-appr-ac" hidden></div></span></div>' +
        '<div id="docf-extra"></div>' +
        '<div id="docf-warn"></div>' +
        '<div class="field"><span class="doc-lbl">เนื้อหาเอกสาร <i class="req">*</i>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="docf-tpl">' + icon('history') +
        ' ใช้ข้อความมาตรฐานใหม่</button></span>' +
        docRteHtml('docf-body', d ? d.body : '') + '</div>' +
        '<p class="muted note">รูปแบบเอกสารเป็น Template กลางแบบตายตัว แก้ไขได้เฉพาะหัวข้อ วันที่มีผล ผู้อนุมัติ และเนื้อหา</p>' +
        '<div class="form-error" id="docf-err" role="alert"></div></form>',
        '<button class="btn btn-ghost" id="docf-cancel">ยกเลิก</button>' +
        '<button class="btn btn-primary" id="docf-save">บันทึกเป็น Draft</button>');

      document.getElementById('docf-cancel').onclick = closeModal;
      docRteBind('docf-body');
      // ผู้ใช้พิมพ์แก้เองเมื่อไหร่ ระบบจะเลิกเขียนทับเนื้อหาให้อัตโนมัติ
      var edBody = document.getElementById('docf-body');
      if (edBody) edBody.addEventListener('input', function () { bodyAuto = false; });
      document.getElementById('docf-tpl').onclick = function () {
        var tSel = document.getElementById('docf-type');
        var pf = docProfOf();
        if (!pf || !(pf.full_name || pf.emp_code)) {
          document.getElementById('docf-err').textContent = 'กรุณาเลือกพนักงานก่อนใช้ข้อความมาตรฐาน';
          return;
        }
        // ปุ่มนี้เป็นเจตนาชัดเจนของผู้ใช้อยู่แล้ว จึงใส่ทันที (ไม่เปิด Dialog ซ้อนทับฟอร์ม)
        docRteSet('docf-body', docDefaultBody(tSel.value, pf, docOrg, docOpts()));
        bodyAuto = true;
        docSyncWarn(pf, tSel.value);
        document.getElementById('docf-err').textContent = '';
        toast('ใส่ข้อความมาตรฐานของ' + docTypeLabel(tSel.value) + 'ให้แล้ว', 'info');
      };
      docRenderExtra(editing ? (cur && cur.doc_type) : document.getElementById('docf-type').value);
      docSyncWarn(docProfOf(),
        editing ? (cur && cur.doc_type) : document.getElementById('docf-type').value);
      if (!editing) docBindEmpPicker();
      docBindApprPicker();
      document.getElementById('docf-save').onclick = doSave;
    }

    // ค้นหาพนักงานจริง แล้วดึงข้อมูลเต็มมาร่างเนื้อหาให้
    function docBindEmpPicker() {
      var inp = document.getElementById('docf-emp');
      var box = document.getElementById('docf-emp-ac');
      inp.oninput = debounce(function () {
        var q = inp.value.trim();
        if (!q) { box.hidden = true; box.innerHTML = ''; return; }
        sbRpcList('njhr_emp_list', { p_token: sbToken(), p_q: q, p_limit: 8, p_offset: 0 })
          .then(function (rows) {
            box.innerHTML = (rows || []).length ? rows.map(function (r) {
              return '<button type="button" class="rpt-ac-item" data-emp="' + esc(r.id) + '">' +
                '<b>' + esc(r.emp_code) + '</b> ' + esc(r.full_name) +
                '<small>' + esc(r.position_name || '-') + ' · ' + esc(r.department_name || '-') + '</small></button>';
            }).join('') : '<div class="rpt-ac-item muted">ไม่พบพนักงาน</div>';
            box.hidden = false;
          }).catch(function (er) { document.getElementById('docf-err').textContent = er.message || 'ค้นหาไม่สำเร็จ'; });
      }, 300);
      inp.onblur = function () { setTimeout(function () { box.hidden = true; }, 160); };
      box.onmousedown = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-emp]') : null;
        if (!b) return;
        ev.preventDefault();
        box.hidden = true;
        sbRpc('njhr_doc_emp_profile', { p_token: sbToken(), p_employee: b.dataset.emp })
          .then(function (r) {
            picked = (r && r.data) || null;
            if (!picked) throw new Error('ไม่พบข้อมูลพนักงาน');
            inp.value = picked.emp_code + ' ' + picked.full_name;
            document.getElementById('docf-emp-info').innerHTML =
              '<b>' + esc(picked.full_name) + '</b> · ' + esc(picked.emp_code) +
              '<small>ตำแหน่ง ' + esc(picked.position_name || '-') + ' · แผนก ' + esc(picked.department_name || '-') +
              ' · เริ่มงาน ' + (picked.start_date ? empBE(picked.start_date) : '-') +
              (picked.base_salary != null ? ' · เงินเดือน ' + money(Number(picked.base_salary)) : '') +
              ' · ผู้บังคับบัญชา ' + esc(picked.supervisor_name || '-') + '</small>';
            var tSel = document.getElementById('docf-type');
            var tEl = document.getElementById('docf-title');
            tEl.value = docDraftTitle(tSel.value, picked);        // ชื่อ Draft ตามพนักงาน ไม่ทับกัน
            // เติมเนื้อหาให้เมื่อยังว่าง หรือเนื้อหาปัจจุบันยังเป็นของระบบ (ผู้ใช้ยังไม่แก้เอง)
            if (!docRteText('docf-body') || bodyAuto) {
              docRteSet('docf-body', docDefaultBody(tSel.value, picked, docOrg, docOpts()));
              bodyAuto = true;
            }
            docSyncWarn(picked, tSel.value);
          })
          .catch(function (er) { document.getElementById('docf-err').textContent = er.message || 'ดึงข้อมูลพนักงานไม่สำเร็จ'; });
      };
      var effEl = document.querySelector('#doc-f [name="effective_date"]');
      if (effEl) effEl.onchange = function () {
        var tSel2 = document.getElementById('docf-type');
        var pf2 = docProfOf();
        if (pf2 && bodyAuto) docRteSet('docf-body', docDefaultBody(tSel2.value, pf2, docOrg, docOpts()));
        docSyncWarn(pf2, tSel2.value);
      };
      document.getElementById('docf-type').onchange = function () {
        var tEl = document.getElementById('docf-title');
        tEl.value = docDraftTitle(this.value, picked);
        document.getElementById('docf-extra').dataset.on = '';
        docRenderExtra(this.value);
        if (picked && (!docRteText('docf-body') || bodyAuto)) {
          docRteSet('docf-body', docDefaultBody(this.value, picked, docOrg, docOpts()));
          bodyAuto = true;
        }
        docSyncWarn(picked, this.value);
      };
    }

    function docBindApprPicker() {
      var inp = document.getElementById('docf-appr');
      var box = document.getElementById('docf-appr-ac');
      inp.oninput = debounce(function () {
        var q = inp.value.trim();
        if (!q) { box.hidden = true; box.innerHTML = ''; approver = null; return; }
        sbRpcList('njhr_doc_approvers', { p_token: sbToken(), p_q: q, p_limit: 8 }).then(function (rows) {
          box.innerHTML = (rows || []).length ? rows.map(function (r) {
            return '<button type="button" class="rpt-ac-item" data-appr="' + esc(r.employee_id) + '" data-nm="' + esc(r.name) + '">' +
              '<b>' + esc(r.emp_code) + '</b> ' + esc(r.name) +
              '<small>' + esc(r.position_name || '-') + ' · ' + esc(r.department || '-') + '</small></button>';
          }).join('') : '<div class="rpt-ac-item muted">ไม่พบพนักงาน</div>';
          box.hidden = false;
        }).catch(function () {});
      }, 300);
      inp.onblur = function () { setTimeout(function () { box.hidden = true; }, 160); };
      box.onmousedown = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-appr]') : null;
        if (!b) return;
        ev.preventDefault();
        approver = b.dataset.appr;
        inp.value = b.dataset.nm;
        box.hidden = true;
      };
    }

    function doSave() {
      var btn = this, fm = document.getElementById('doc-f');
      var ferr = document.getElementById('docf-err');
      function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? x.value : ''; }
      var docType = editing ? cur.doc_type : document.getElementById('docf-type').value;
      var prof = docProfOf();
      var xo = docOpts();                    // ต้องอ่านก่อนขั้นตอนตรวจสอบและก่อนแทนค่า Placeholder
      var title = String(fv('title')).trim();
      var body = docRteText('docf-body') ? docRteGet('docf-body') : '';   // ว่างจริงเมื่อไม่มีข้อความ
      if (!editing && !picked) { ferr.textContent = 'กรุณาเลือกพนักงาน'; return; }
      // ตั้งชื่อ Draft ตามพนักงานให้อัตโนมัติเมื่อยังว่างหรือยังเป็นชื่อทั่วไป
      if ((!title || title === docTypeLabel(docType)) && prof && prof.emp_code) {
        title = docDraftTitle(docType, prof);
        var tEl2 = fm.querySelector('[name="title"]');
        if (tEl2) tEl2.value = title;
      }
      if (!title) { ferr.textContent = 'กรุณาระบุหัวข้อเอกสาร'; return; }
      if (!body) { ferr.textContent = 'กรุณาระบุเนื้อหาเอกสาร'; return; }
      // แทนเฉพาะ Placeholder ที่ยังเหลือ — ไม่แตะข้อความหรือรูปแบบที่ผู้ใช้แก้เอง
      if (prof) body = docFillTokens(body, docMergeMap(prof, docOrg, xo));
      if (DOC_REQ_BY_TYPE[docType]) {
        var miss = docMissingFields(prof || {}, docType, xo);
        if (miss.length) {
          docSyncWarn(prof, docType);
          ferr.textContent = 'ข้อมูลยังไม่ครบ: ' + miss.join(' · ') +
            ' — กรุณาแก้ไขข้อมูลพนักงานหรือกรอกข้อมูลในฟอร์มให้ครบก่อนบันทึก';
          return;
        }
      }
      var left = docLeftTokens(body);
      if (left.length) {
        ferr.textContent = 'ยังมีข้อมูลที่แทนค่าไม่ได้: ' + left.join(', ') +
          ' — กรุณาตรวจข้อมูลพนักงานหรือแก้ข้อความในเอกสาร';
        return;
      }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';

      var meta = picked ? {
        emp_code: picked.emp_code, full_name: picked.full_name,
        position_name: picked.position_name, department_name: picked.department_name,
        start_date: picked.start_date, base_salary: picked.base_salary,
        supervisor_name: picked.supervisor_name, supervisor_position: picked.supervisor_position,
        national_id: picked.national_id, company: picked.company
      } : Object.assign({}, (cur && cur.doc_meta) || {});
      if (docIsCert(docType)) {
        meta.document_date = xo.document_date;
        meta.certificate_purpose = xo.certificate_purpose;
        meta.signer_name = xo.signer_name;
        meta.signer_position = xo.signer_position;
        meta.internal_note = xo.internal_note;
        if (docType === 'SEPARATION') {                 // snapshot ตำแหน่ง/แผนก/วันที่ ณ วันออกเอกสาร
          meta.termination_date = xo.termination_date;
          meta.service_duration_text = docServiceText((prof || {}).start_date, xo.termination_date);
        }
        if (docType === 'SALARY_CERT') {                // snapshot รายได้ที่ใช้ในเอกสารฉบับนี้
          var inc2 = docIncome(xo, prof || {});
          meta.pay_snapshot = xo.pay || null;            // ข้อมูลดิบจากระบบเงินเดือน ณ วันที่ออก
          meta.base_salary = inc2.base;
          meta.pay_items = inc2.items;
          meta.total_regular_income = inc2.total;
          meta.total_regular_income_text = docBahtText(inc2.total);
        }
      }
      if (docType === 'SUSPENSION') {
        meta.suspension_start = xo.suspension_start;
        meta.suspension_end = xo.suspension_end;
        meta.suspension_days = docSuspDays(xo.suspension_start, xo.suspension_end);
        meta.pay_rate_percent = xo.pay_rate_percent;
        meta.suspension_subject = xo.suspension_subject;
        meta.incident_detail = xo.incident_detail;
        meta.internal_note = xo.internal_note;
      }
      if (docType === 'CONTRACT_PROBATION') {
        meta.document_date = xo.document_date;
        meta.internal_note = xo.internal_note;
      }
      if (docType === 'WARNING') {          // เก็บรายละเอียดหนังสือตักเตือนไว้ใน doc_meta เดิม
        meta.warning_subject = xo.warning_subject;
        meta.incident_date = xo.incident_date;
        meta.warning_item_1 = xo.warning_item_1;
        meta.warning_item_2 = xo.warning_item_2;
        meta.warning_item_3 = xo.warning_item_3;
        meta.warning_item_4 = xo.warning_item_4;
        meta.internal_note = xo.internal_note;
      }

      sbRpc('njhr_doc_save', {
        p_token: sbToken(), p_id: id || null,
        p_type: docType,
        p_employee: editing ? cur.employee_id : picked.id,
        p_title: title, p_body: body,
        p_effective_date: fv('effective_date') || null,
        p_meta: meta, p_approver: approver || null
      }).then(function (r) {
        closeModal();
        toast('บันทึก Draft เรียบร้อยแล้ว' + (r && r.doc_no ? ' · เลขที่ ' + r.doc_no : ''));
        if (docState.openId) { docOpenDetail(docState.openId, el); } else { docLoadList(el, ++docState.seq); }
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึกเป็น Draft';
        ferr.textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    }

    if (!id) { docLoadOrg().then(function () { build(null); }, function () { build(null); }); return; }
    sbRpc('njhr_doc_detail', { p_token: sbToken(), p_id: id })
      .then(function (r) {
        var d = ((r && r.data) || {}).doc || {};
        if (!d.employee_id) { build(d); return; }
        // อ่านโปรไฟล์สดของพนักงานเจ้าของเอกสารก่อนเปิดฟอร์ม (RPC เดิม ไม่เพิ่มของใหม่)
        return sbRpc('njhr_doc_emp_profile', { p_token: sbToken(), p_employee: d.employee_id })
          .then(function (pr) { profLive = (pr && pr.data) || null; },
                function () { profLive = null; })
          .then(function () { build(d); });
      })
      .catch(function (er) { docErr(er.message || 'โหลดเอกสารไม่สำเร็จ'); });
  }

  /* ---------- หน้ารายละเอียดเอกสาร ---------- */
  function docOpenDetail(id, el) { docState.openId = id; viewHrDocs(el); }

  function docRenderDetail(el) {
    el.innerHTML = '<div class="card"><small class="muted">กำลังโหลดเอกสาร…</small></div>';
    docErr('');
    sbRpc('njhr_doc_detail', { p_token: sbToken(), p_id: docState.openId }).then(function (r) {
      docDetailData = (r && r.data) || null;
      if (!docDetailData || !docDetailData.doc) throw new Error('ไม่พบเอกสาร');
      var d = docDetailData.doc;
      // เจ้าของเอกสารเปิดอ่าน = บันทึกสถานะ "เปิดอ่านแล้ว" (เซิร์ฟเวอร์ตัดสินเองว่าจะนับไหม)
      var u = currentUser();
      if (!docCanManage() && d.status === 'SENT') {
        return sbRpc('njhr_doc_view', { p_token: sbToken(), p_id: d.id, p_ctx: docCtx() })
          .then(function () { return sbRpc('njhr_doc_detail', { p_token: sbToken(), p_id: docState.openId }); })
          .then(function (r2) { docDetailData = (r2 && r2.data) || docDetailData; docPaintDetail(el); }, function () { docPaintDetail(el); });
      }
      docPaintDetail(el);
    }).catch(function (er) {
      el.innerHTML = '<div class="card">' + emptyState(er.message || 'เปิดเอกสารไม่สำเร็จ') +
        '<div class="ta-c"><button class="btn btn-ghost" id="doc-back">← กลับรายการเอกสาร</button></div></div>';
      var b = document.getElementById('doc-back');
      if (b) b.onclick = function () { docState.openId = ''; viewHrDocs(el); };
    });
  }

  /* ---------- หน้ารายละเอียด 50 ทวิ (ฝั่งพนักงาน) ----------
     แสดงเฉพาะข้อมูลเอกสารและปุ่มดู/ดาวน์โหลด
     ไม่มี: รอรับทราบ · ACK · SIGN · ปุ่มรับทราบ/ปฏิเสธ · เนื้อความเอกสารทั่วไป
     ถ้า Final PDF พร้อมแล้ว ให้ดูไฟล์จริงผ่าน Signed URL
     จะได้ไม่มีหน้าตาอีกชุดที่ต่างจากไฟล์ที่ได้รับ */
  function docPaintWht50Detail(el) {
    var d = docDetailData.doc || {};
    var meta = d.doc_meta || {};
    var yr = meta.tax_year ? (Number(meta.tax_year) + 543) : '';
    var opened = d.status === 'VIEWED';
    var pdfReady = (d.final_pdf_status === 'READY');

    el.innerHTML =
      '<div class="card doc-top"><div class="card-head">' +
      '<button class="btn btn-ghost btn-sm" id="doc-back">← กลับรายการเอกสาร</button>' +
      '<span class="grow"></span>' +
      '<span class="badge ' + (opened ? 'badge-ok' : 'badge-info') + '">' +
      esc(docMyStateText(d)) + '</span></div>' +
      '<h3 style="margin:6px 0 2px">🧾 ' +
      esc(yr ? ('50 ทวิ ประจำปีภาษี ' + yr) : (d.title || docTypeLabel(d.doc_type))) + '</h3>' +
      '<div class="ot-req-info">' +
      [['เลขที่เอกสาร', d.doc_no || '—'],
       ['ปีภาษี', yr || '—'],
       ['วันที่ได้รับ', docTS(d.sent_at || d.issued_at)],
       ['สถานะ', docMyStateText(d)]].map(function (x) {
        return '<div><small>' + esc(x[0]) + '</small><b>' + esc(String(x[1])) + '</b></div>';
      }).join('') + '</div></div>' +
      '<div class="card" id="wht50-emp-view">' +
      (pdfReady
        ? '<div class="muted" style="padding:14px">กำลังเปิดเอกสาร…</div>'
        : '<div class="ot-warn">' + icon('info', 'ic-sm') +
          ' เอกสารกำลังจัดเตรียม กรุณาลองใหม่อีกครั้งภายหลัง</div>') +
      '<div class="doc-my-act" style="margin-top:12px">' +
      '<button class="btn btn-primary btn-sm" id="wht50-emp-dl"' +
      (pdfReady ? '' : ' disabled title="ยังไม่มีไฟล์ให้ดาวน์โหลด"') + '>' +
      icon('download') + ' ดาวน์โหลด</button>' +
      '<button class="btn btn-ghost btn-sm" id="wht50-emp-close">ปิด</button>' +
      '</div></div>' +
      '<div class="form-error" id="doc-err"></div>';

    document.getElementById('doc-back').onclick = function () { docState.openId = ''; viewHrDocs(el); };
    document.getElementById('wht50-emp-close').onclick = function () { docState.openId = ''; viewHrDocs(el); };
    document.getElementById('wht50-emp-dl').onclick = function () { docPdfDownload(d.id, this); };

    /* ดูไฟล์จริง — ขอ Signed URL ผ่าน Edge Function เท่านั้น ไม่มี URL สาธารณะ */
    if (pdfReady) {
      sbDocPdfFn({ action: 'download', document_id: d.id }).then(function (r) {
        var box = document.getElementById('wht50-emp-view');
        if (!box) return;
        if (!r || !r.url) throw new Error('เปิดไฟล์ไม่สำเร็จ');
        box.querySelector('.muted').outerHTML =
          '<iframe class="wht50-emp-pdf" src="' + esc(r.url) + '" title="50 ทวิ"></iframe>';
      })['catch'](function (ex) {
        var box = document.getElementById('wht50-emp-view');
        if (box && box.querySelector('.muted')) {
          box.querySelector('.muted').outerHTML =
            '<div class="ot-warn">' + icon('info', 'ic-sm') + ' ' +
            esc((ex && ex.message) || 'เปิดไฟล์ไม่สำเร็จ') + '</div>';
        }
      });
    }
  }

  function docPaintDetail(el) {
    /* ══════════ 50 ทวิ: ออกทางนี้ทันที ══════════
       เอกสารภาษีไม่มีการรับทราบและไม่มีการลงนาม จึงต้องไม่ตกไปเส้นทางเอกสาร HR ทั่วไป
       ซึ่งจะเรียก docA4Html() / docAckPanelHtml() และขึ้นคำว่า "รอรับทราบ"
       return ทันทีตรงนี้ ไม่ให้ไหลต่อแม้แต่บรรทัดเดียว */
    if (docIsWht50(docDetailData.doc)) { docPaintWht50Detail(el); return; }

    var d = docDetailData.doc, org = docDetailData.org || {}, ack = docDetailData.ack;
    var events = docDetailData.events || [];
    var mng = docCanManage(), appr = docCanApprove();
    var mine = currentUser() && NJHR.state.sbUser && d.employee_id === NJHR.state.sbUser.employee_id;
    var st = d.status;

    var acts = [];
    if (mng && ['DRAFT', 'REJECTED'].indexOf(st) >= 0) {
      acts.push(['edit', 'แก้ไข', 'edit', 'btn-ghost']);
      acts.push(['SUBMIT', 'ส่งขออนุมัติ', 'send', 'btn-primary']);
    }
    if (appr && st === 'PENDING_APPROVAL') {
      acts.push(['APPROVE', 'อนุมัติ', 'check', 'btn-primary']);
      acts.push(['REJECT_APPROVAL', 'ไม่อนุมัติ', 'ban', 'btn-ghost']);
    }
    if (mng && st === 'APPROVED') acts.push(['SEND', 'ส่งให้พนักงาน', 'send', 'btn-primary']);
    if (mng && ['SENT', 'VIEWED'].indexOf(st) >= 0) acts.push(['SEND', 'ส่งใหม่', 'send', 'btn-ghost']);
    if (mng && ['ACKNOWLEDGED', 'SIGNED', 'REJECTED'].indexOf(st) >= 0) acts.push(['ARCHIVE', 'เก็บเข้าประวัติ', 'fileText', 'btn-ghost']);
    if (mng && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'REJECTED'].indexOf(st) >= 0)
      acts.push(['CANCEL', 'ยกเลิกเอกสาร', 'x', 'btn-ghost t-red']);

    el.innerHTML =
      '<div class="card"><div class="card-head">' +
      '<button class="btn btn-ghost btn-sm" id="doc-back">← รายการเอกสาร</button>' +
      '<span class="grow"></span>' + docBadge(st) +
      '<span class="chip chip-info">' + docTypeDef(d.doc_type).em + ' ' + esc(docTypeLabel(d.doc_type)) + '</span>' +
      '<span class="chip">' + esc(d.doc_no) + (d.version > 1 ? ' · ฉบับที่ ' + d.version : '') + '</span></div>' +
      '<div class="toolbar doc-actions">' +
      '<button class="btn btn-ghost btn-sm" id="doc-print">' + icon('printer') + ' บันทึก PDF / พิมพ์</button>' +
      '<span class="grow"></span>' +
      acts.map(function (a) {
        return '<button class="btn ' + a[3] + ' btn-sm" data-doc-act="' + a[0] + '">' + icon(a[2]) + ' ' + esc(a[1]) + '</button>';
      }).join('') + '</div>' +
      (d.approval_note ? '<div class="ot-warn">หมายเหตุการอนุมัติ: ' + esc(d.approval_note) + '</div>' : '') +
      (d.reject_reason ? '<div class="ot-warn">เหตุผลที่ปฏิเสธ: ' + esc(d.reject_reason) + '</div>' : '') +
      (d.cancel_reason ? '<div class="ot-warn">เหตุผลการยกเลิก: ' + esc(d.cancel_reason) + '</div>' : '') +
      '</div>' +
      '<div class="card doc-preview-wrap"><div id="doc-a4">' + docA4Html(d, org, ack) + '</div></div>' +
      (mine && ['SENT', 'VIEWED'].indexOf(st) >= 0 ? docAckPanelHtml(d) : '') +
      (ack ? docAckProofHtml(ack) : '') +
      (['ACKNOWLEDGED', 'SIGNED', 'ARCHIVED'].indexOf(st) >= 0
        ? '<div class="card" id="doc-pdf-card"><div class="card-head"><h3>' + icon('fileText') +
          ' ไฟล์เอกสารฉบับสมบูรณ์</h3></div>' +
          '<div id="doc-pdf-body"><small class="muted">กำลังตรวจสถานะไฟล์…</small></div>' +
          '<div class="form-error" id="doc-pdf-err" role="alert"></div></div>'
        : '') +
      docHistHtml(events) +
      '<div class="form-error" id="doc-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('doc-back').onclick = function () { docState.openId = ''; viewHrDocs(el); };
    document.getElementById('doc-print').onclick = function () { docPrint(d, org, ack); };
    docBindHist();
    el.querySelectorAll('[data-doc-act]').forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.docAct;
        if (a === 'edit') { docForm(d.id, el); return; }
        docDoFlow(a, d, el);
      };
    });
    if (mine && ['SENT', 'VIEWED'].indexOf(d.status) >= 0) docBindAckPanel(d, el);
    // อ่านสถานะ Final PDF จาก Server ทุกครั้งที่เปิดเอกสาร — เป็นตัว Recovery หลักด้วย
    if (['ACKNOWLEDGED', 'SIGNED', 'ARCHIVED'].indexOf(d.status) >= 0) docPdfSync(d.id, false);
  }

  /* ================= FINAL PDF (I4) =================
     Frontend ไม่สร้าง PDF เอง ไม่คำนวณ hash เอง ไม่แตะ Storage ตรง
     ทุกอย่างผ่าน Edge Function njhr-doc-pdf ซึ่งตรวจสิทธิ์ที่ฐานข้อมูลจาก token
     สถานะที่รองรับ = PENDING / READY / FAILED ตามที่ Backend ใช้จริงเท่านั้น ========= */
  var docPdfBusy = {};        // กัน generate ซ้อนจากหน้าจอเดียวกัน (ตัวจริงกันที่ RPC claim)

  function docPdfFn(body) {
    if (!sbReady()) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'));
    return fetch(SB.url + '/functions/v1/njhr-doc-pdf', {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: sbToken() }, body || {}))
    }).then(function (r) {
      return r.text().then(function (t) {
        var d = {};
        try { d = JSON.parse(t); } catch (e) { d = {}; }
        if (!r.ok) throw new Error(d.error || 'ดำเนินการกับไฟล์ไม่สำเร็จ (' + r.status + ')');
        return d;
      });
    });
  }

  function docPdfErr(msg) {
    var b = document.getElementById('doc-pdf-err');
    if (b) b.textContent = msg || '';
  }

  /* อ่านสถานะจาก Server แล้ววาดใหม่
     autoGen = true → ถ้าเจอ PENDING ให้สั่งสร้างต่อทันที (ใช้ตอนเพิ่งลงนามเสร็จ
     และตอนเปิดเอกสารกลับมาเจองานค้างจากรอบก่อนที่ผู้ใช้ปิดเบราว์เซอร์ไป) */
  function docPdfSync(id, autoGen) {
    var box = document.getElementById('doc-pdf-body');
    if (!box) return Promise.resolve();
    return sbRpc('njhr_doc_pdf_status', { p_token: sbToken(), p_id: id })
      .then(function (r) {
        var st = (r && r.data) || {};
        docPdfRender(id, st);
        if (autoGen && st.final_pdf_status === 'PENDING' && st.can_generate) return docPdfGenerate(id);
      })['catch'](function (ex) {
        var b = document.getElementById('doc-pdf-body');
        if (b) b.innerHTML = '<small class="muted">ตรวจสถานะไฟล์ไม่สำเร็จ</small>';
        docPdfErr(ex.message || 'ตรวจสถานะไฟล์ไม่สำเร็จ');
      });
  }

  function docPdfRender(id, st) {
    var box = document.getElementById('doc-pdf-body');
    if (!box) return;
    var s = st.final_pdf_status || null;

    if (s === 'READY') {
      box.innerHTML =
        '<div class="ep-info"><span>สถานะไฟล์</span><span>:</span>' +
        '<b class="t-ok">✅ พร้อมดาวน์โหลด</b></div>' +
        (st.final_pdf_at ? '<div class="ep-info"><span>สร้างเมื่อ</span><span>:</span><b>' +
          docTS(st.final_pdf_at) + '</b></div>' : '') +
        (st.final_pdf_bytes ? '<div class="ep-info"><span>ขนาดไฟล์</span><span>:</span><b>' +
          Math.round(Number(st.final_pdf_bytes) / 1024) + ' KB</b></div>' : '') +
        (st.final_pdf_hash ? '<div class="ep-info"><span>SHA-256</span><span>:</span><b class="mono">' +
          esc(String(st.final_pdf_hash)) + '</b></div>' : '') +
        '<button class="btn btn-primary" id="doc-pdf-dl">' + icon('download') + ' ดาวน์โหลด PDF</button>' +
        '<p class="muted note">ไฟล์นี้ถูกตรึงไว้ตั้งแต่วันที่ลงนาม ทั้งพนักงานและฝ่ายบุคคลดาวน์โหลดไฟล์เดียวกัน</p>';
      var dl = document.getElementById('doc-pdf-dl');
      if (dl) dl.onclick = function () { docPdfDownload(id, this); };
      return;
    }

    if (s === 'PENDING') {
      // ไม่แสดงปุ่มดาวน์โหลดที่กดไม่ได้
      box.innerHTML =
        '<div class="ep-info"><span>สถานะไฟล์</span><span>:</span>' +
        '<b><span class="spinner"></span> ⏳ กำลังจัดเตรียม PDF…</b></div>' +
        '<button class="btn btn-ghost" id="doc-pdf-retry">' + icon('refresh') + ' ตรวจสถานะอีกครั้ง</button>' +
        '<p class="muted note">การลงนามของคุณบันทึกเรียบร้อยแล้ว ไฟล์กำลังถูกสร้างในเบื้องหลัง</p>';
      var rt = document.getElementById('doc-pdf-retry');
      if (rt) rt.onclick = function () { docPdfGenerate(id, this); };
      return;
    }

    if (s === 'FAILED') {
      box.innerHTML =
        '<div class="ep-info"><span>สถานะไฟล์</span><span>:</span>' +
        '<b class="t-red">⚠ สร้าง PDF ไม่สำเร็จ</b></div>' +
        (st.final_pdf_error ? '<small class="muted">' + esc(String(st.final_pdf_error)) + '</small>' : '') +
        (st.can_generate
          ? '<button class="btn btn-primary" id="doc-pdf-retry">' + icon('refresh') + ' ลองสร้าง PDF ใหม่</button>'
          : '<small class="muted">กรุณาแจ้งฝ่ายบุคคลเพื่อสร้างไฟล์ใหม่</small>') +
        '<p class="muted note">การรับทราบ/ลงนามของคุณยังสมบูรณ์ ไม่ต้องลงนามใหม่</p>';
      var rt2 = document.getElementById('doc-pdf-retry');
      if (rt2) rt2.onclick = function () { docPdfGenerate(id, this); };
      return;
    }

    // ยังไม่เคยเข้าคิวสร้าง (เช่นเอกสารเก่าก่อนเปิดใช้ระบบ Final PDF)
    box.innerHTML =
      '<div class="ep-info"><span>สถานะไฟล์</span><span>:</span><b>ยังไม่มีไฟล์</b></div>' +
      (st.can_generate
        ? '<button class="btn btn-primary" id="doc-pdf-retry">' + icon('fileText') + ' สร้าง PDF</button>'
        : '<small class="muted">เอกสารนี้ยังสร้างไฟล์ไม่ได้</small>');
    var rt3 = document.getElementById('doc-pdf-retry');
    if (rt3) rt3.onclick = function () { docPdfGenerate(id, this); };
  }

  /* สั่งสร้าง — Edge Function เป็นผู้ claim แบบ atomic
     READY แล้วจะได้ already_ready กลับมา ไม่สร้างซ้ำ ไม่ overwrite */
  function docPdfGenerate(id, btn) {
    if (docPdfBusy[id]) return Promise.resolve();
    docPdfBusy[id] = true;
    docPdfErr('');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้างไฟล์…'; }
    return docPdfFn({ action: 'generate', document_id: id })
      .then(function () {
        docPdfBusy[id] = false;
        return docPdfSync(id, false);
      })['catch'](function (ex) {
        docPdfBusy[id] = false;
        docPdfErr(ex.message || 'สร้างไฟล์ไม่สำเร็จ');
        return docPdfSync(id, false);      // อ่านสถานะจริงกลับมาเสมอ ไม่เดาเอง
      });
  }

  /* ดาวน์โหลด — Server ตรวจ token → user → employee → เอกสาร → READY
     แล้วจึงออก Signed URL อายุสั้น · Frontend ไม่รู้ storage path เลย */
  function docPdfDownload(id, btn) {
    docPdfErr('');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังเตรียมไฟล์…'; }
    function restore() {
      if (btn) { btn.disabled = false; btn.innerHTML = icon('download') + ' ดาวน์โหลด PDF'; }
    }
    return docPdfFn({ action: 'download', document_id: id })
      .then(function (d) {
        if (!d.url) throw new Error('ออกลิงก์ไฟล์ไม่สำเร็จ');
        var a = document.createElement('a');
        a.href = d.url;
        a.download = d.file_name || 'document.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        restore();
      })['catch'](function (ex) {
        restore();
        docPdfErr(ex.message || 'ดาวน์โหลดไม่สำเร็จ');
      });
  }

  /* ---------- ประวัติเอกสาร: ยุบ–ขยาย ----------
     ข้อมูลมาพร้อม njhr_doc_detail ตั้งแต่ตอนเปิดเอกสารแล้ว → กดยุบ/ขยายไม่โหลดซ้ำ
     และไม่ re-render ทั้งหน้า จึงไม่ทำให้หน้าจอเลื่อนกลับไปด้านบน */
  function docHistHtml(events) {
    var rows = (events || []).slice().reverse();     // ล่าสุดอยู่บนสุด (ต้นทางเรียงเก่า→ใหม่)
    return '<div class="card doc-hist">' +
      '<button type="button" class="doc-hist-bar" id="doc-hist-bar" aria-expanded="false" aria-controls="doc-hist-body">' +
      icon('history') + '<b>ประวัติเอกสาร</b>' +
      '<span class="badge badge-info">' + rows.length + ' รายการ</span>' +
      '<span class="grow"></span>' +
      '<span class="doc-hist-txt" id="doc-hist-txt">แสดงประวัติ</span>' +
      '<span class="doc-hist-ic" id="doc-hist-ic">' + icon('chevDown') + '</span></button>' +
      '<div class="doc-hist-body" id="doc-hist-body">' +
      '<div class="doc-hist-inner">' + (rows.length
        ? '<div class="doc-timeline">' + rows.map(function (v) {
            return '<div class="doc-tl-row"><span class="doc-tl-dot"></span><div>' +
              '<b>' + esc(docEventTh(v.event)) + '</b>' +
              '<small>' + docTS(v.at) + ' · ' + esc(v.actor || '-') +
              (v.actor_role ? ' (' + esc(ROLE_TH[v.actor_role] || v.actor_role) + ')' : '') +
              (v.detail ? ' · ' + esc(v.detail) : '') +
              (v.device ? ' · ' + esc(v.device) : '') + '</small></div></div>';
          }).join('') + '</div>'
        : '<p class="muted" style="margin:0">ยังไม่มีประวัติเอกสาร</p>') +
      '</div></div></div>';
  }
  function docBindHist() {
    var bar = document.getElementById('doc-hist-bar');
    var body = document.getElementById('doc-hist-body');
    if (!bar || !body) return;
    docState.histOpen = false;                       // ค่าเริ่มต้นทุกครั้งที่เปิดเอกสาร = ยุบ
    docSyncHist(false);
    bar.onclick = function () { docState.histOpen = !docState.histOpen; docSyncHist(true); };
    body.addEventListener('transitionend', function (ev) {
      if (ev.propertyName !== 'max-height') return;
      body.style.maxHeight = docState.histOpen ? 'none' : '0px';
    });
  }
  function docSyncHist(animate) {
    var bar = document.getElementById('doc-hist-bar');
    var body = document.getElementById('doc-hist-body');
    var txt = document.getElementById('doc-hist-txt');
    var ic = document.getElementById('doc-hist-ic');
    if (!bar || !body) return;
    var open = !!docState.histOpen;
    bar.setAttribute('aria-expanded', open ? 'true' : 'false');
    bar.classList.toggle('on', open);
    if (txt) txt.textContent = open ? 'ซ่อนประวัติ' : 'แสดงประวัติ';
    if (ic) ic.innerHTML = icon(open ? 'chevUp' : 'chevDown');
    if (!animate) { body.style.maxHeight = open ? 'none' : '0px'; return; }
    if (open) {
      // เผื่อกรณีอ่าน scrollHeight ไม่ได้ ให้ใช้ค่าสำรอง แล้วปลดเพดานหลังอนิเมชันจบ
      body.style.maxHeight = (body.scrollHeight || 2000) + 'px';
      setTimeout(function () { if (docState.histOpen) body.style.maxHeight = 'none'; }, 320);
    } else {
      body.style.maxHeight = (body.scrollHeight || 2000) + 'px';
      void body.offsetHeight;                        // บังคับ reflow ให้ transition ทำงาน
      body.style.maxHeight = '0px';
    }
  }

  function docEventTh(e) {
    return ({
      CREATE: 'สร้างเอกสาร', EDIT: 'แก้ไขเอกสาร', SUBMIT: 'ส่งขออนุมัติ',
      APPROVE: 'อนุมัติเอกสาร', REJECT_APPROVAL: 'ไม่อนุมัติ', SEND: 'ส่งให้พนักงาน',
      VIEW: 'พนักงานเปิดอ่าน', ACKNOWLEDGE: 'พนักงานกดรับทราบ', REJECT: 'พนักงานปฏิเสธรับทราบ',
      ARCHIVE: 'เก็บเข้าประวัติ', CANCEL: 'ยกเลิกเอกสาร', VERIFY_FAIL: 'ยืนยันตัวตนไม่สำเร็จ'
    })[e] || e;
  }

  /* ---------- Rich Text Editor (ใช้ contentEditable ของเบราว์เซอร์ — ไม่เพิ่มไลบรารีใหม่) ----------
     เก็บผลลัพธ์เป็น HTML ที่กรองแล้ว → ใช้ทั้งใน Preview และการพิมพ์ / บันทึก PDF
     เอกสารเดิมที่เก็บเป็นข้อความล้วน (\n) ยังเปิดและแสดงได้ตามปกติ */
  var DOC_FONTS = ['TH Sarabun New', 'Aptos', 'Sarabun', 'Prompt', 'Kanit',
                   'Angsana New', 'Cordia New', 'Tahoma', 'Arial', 'Times New Roman'];
  var DOC_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40];
  var DOC_FONT_DEFAULT = 'TH Sarabun New';
  var DOC_SIZE_DEFAULT = 16;
  var DOC_TAG_OK = { P: 1, DIV: 1, BR: 1, SPAN: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, STRIKE: 1,
                     UL: 1, OL: 1, LI: 1, H1: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, SUB: 1, SUP: 1, FONT: 1 };
  var DOC_STYLE_OK = ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration',
                      'text-decoration-line', 'color', 'background-color', 'text-align',
                      'margin-left', 'padding-left', 'line-height', 'display', 'min-width'];
  var DOC_FONT_PX = { 1: 11, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 42 };

  function docIsHtml(s) { return /<(p|div|br|span|ul|ol|li|b|strong|i|em|u|h[1-4]|font|blockquote)\b/i.test(String(s || '')); }
  function docTextToHtml(t) {
    var lines = String(t == null ? '' : t).split('\n');
    return lines.map(function (l) { return '<p>' + (l.trim() ? esc(l) : '<br>') + '</p>'; }).join('');
  }
  // กรอง HTML ให้เหลือเฉพาะแท็ก/สไตล์ที่ปลอดภัย (กัน script / on* / iframe และแท็กแปลกปลอม)
  function docSanitizeHtml(html) {
    var dom = new DOMParser().parseFromString('<div id="njrte">' + String(html || '') + '</div>', 'text/html');
    var root = dom.getElementById('njrte');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) { if (n.parentNode) n.parentNode.removeChild(n); return; }
        if (!DOC_TAG_OK[n.tagName]) {
          if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'IFRAME') {
            n.parentNode.removeChild(n); return;
          }
          while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);   // เก็บข้อความ ทิ้งแท็ก
          n.parentNode.removeChild(n);
          return;
        }
        if (n.tagName === 'FONT') {                       // <font> ของ execCommand รุ่นเก่า → span style
          var sp = dom.createElement('span');
          if (n.getAttribute('color')) sp.style.color = n.getAttribute('color');
          if (n.getAttribute('face')) sp.style.fontFamily = n.getAttribute('face');
          var px = DOC_FONT_PX[n.getAttribute('size')];
          if (px) sp.style.fontSize = px + 'px';
          while (n.firstChild) sp.appendChild(n.firstChild);
          n.parentNode.replaceChild(sp, n);
          n = sp;
        }
        var keep = (n.getAttribute && n.getAttribute('style')) || '';
        Array.prototype.slice.call(n.attributes || []).forEach(function (a) { n.removeAttribute(a.name); });
        var out = keep.split(';').map(function (x) {
          var i = x.indexOf(':'); if (i < 0) return '';
          var k = x.slice(0, i).trim().toLowerCase(), v = x.slice(i + 1).trim();
          if (DOC_STYLE_OK.indexOf(k) < 0) return '';
          if (/url\(|expression|javascript:|<|>/i.test(v)) return '';
          return k + ': ' + v;
        }).filter(Boolean).join('; ');
        if (out) n.setAttribute('style', out);
        walk(n);
      });
    })(root);
    return root.innerHTML;
  }
  // เนื้อหาสำหรับแสดงผล — รองรับทั้งเอกสารเดิม (ข้อความล้วน) และเอกสารใหม่ (HTML)
  function docBodyHtml(body) {
    var s = String(body == null ? '' : body);
    return docIsHtml(s) ? docSanitizeHtml(s) : docTextToHtml(s);
  }

  function docRteHtml(id, body) {
    function b(cmd, ic, title) {
      return '<button type="button" class="rte-b" data-cmd="' + cmd + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' + ic + '</button>';
    }
    return '<div class="rte" id="' + id + '-rte">' +
      '<div class="rte-bar">' +
      '<select class="rte-sel rte-font" data-cmd="fontName" title="แบบตัวอักษร" aria-label="แบบตัวอักษร">' +
      DOC_FONTS.map(function (f) {
        return '<option value="' + esc(f) + '"' + (f === DOC_FONT_DEFAULT ? ' selected' : '') + '>' + esc(f) + '</option>';
      }).join('') + '</select>' +
      '<select class="rte-sel rte-size" data-cmd="fontSize" title="ขนาดตัวอักษร" aria-label="ขนาดตัวอักษร">' +
      DOC_SIZES.map(function (s) {
        return '<option value="' + s + '"' + (s === DOC_SIZE_DEFAULT ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select>' +
      '<span class="rte-sep"></span>' +
      b('bold', '<b>B</b>', 'ตัวหนา') + b('italic', '<i>I</i>', 'ตัวเอียง') + b('underline', '<u>U</u>', 'ขีดเส้นใต้') +
      '<span class="rte-sep"></span>' +
      '<label class="rte-color" title="สีตัวอักษร"><b>A</b>' +
      '<input type="color" data-cmd="foreColor" value="#111827" aria-label="สีตัวอักษร"></label>' +
      '<label class="rte-color rte-hl" title="สีพื้นหลังข้อความ"><b>A</b>' +
      '<input type="color" data-cmd="hiliteColor" value="#FDE68A" aria-label="สีพื้นหลังข้อความ"></label>' +
      '<span class="rte-sep"></span>' +
      b('justifyLeft', icon('alignLeft', 'ic-sm'), 'ชิดซ้าย') +
      b('justifyCenter', icon('alignCenter', 'ic-sm'), 'กึ่งกลาง') +
      b('justifyRight', icon('alignRight', 'ic-sm'), 'ชิดขวา') +
      b('justifyFull', icon('alignJustify', 'ic-sm'), 'จัดเต็มบรรทัด') +
      '<span class="rte-sep"></span>' +
      b('insertUnorderedList', icon('listUl', 'ic-sm'), 'Bullet List') +
      b('insertOrderedList', icon('listOl', 'ic-sm'), 'Number List') +
      b('outdent', icon('outdent', 'ic-sm'), 'ลดระยะเยื้อง') +
      b('indent', icon('indent', 'ic-sm'), 'เพิ่มระยะเยื้อง') +
      '<span class="rte-sep"></span>' +
      b('undo', icon('undo', 'ic-sm'), 'ย้อนกลับ (Undo)') +
      b('redo', icon('redo', 'ic-sm'), 'ทำซ้ำ (Redo)') +
      b('clearFormat', icon('eraser', 'ic-sm'), 'ล้างรูปแบบข้อความ') +
      '</div>' +
      '<div class="rte-body" id="' + id + '" contenteditable="true" role="textbox" aria-multiline="true" ' +
      'data-ph="เลือกพนักงานแล้วระบบจะร่างเนื้อหาให้อัตโนมัติ">' + docBodyHtml(body) + '</div></div>';
  }

  function docRteGet(id) {
    var ed = document.getElementById(id);
    return ed ? docSanitizeHtml(ed.innerHTML) : '';
  }
  function docRteText(id) {
    var ed = document.getElementById(id);
    return ed ? String(ed.textContent || '').replace(/\u00a0/g, ' ').trim() : '';
  }
  function docRteSet(id, body) {
    var ed = document.getElementById(id);
    if (ed) ed.innerHTML = docBodyHtml(body);
  }

  function docRteBind(id) {
    var wrap = document.getElementById(id + '-rte');
    var ed = document.getElementById(id);
    if (!wrap || !ed) return;
    function focusEd() { if (document.activeElement !== ed) ed.focus(); }
    function exec(cmd, val, css) {
      focusEd();
      try { document.execCommand('styleWithCSS', false, css !== false); } catch (e) {}
      try { document.execCommand(cmd, false, val); } catch (e) {}
    }
    // ขนาดตัวอักษรเป็น px: ใช้ fontSize=7 เป็นตัวจับ แล้วแทนที่ด้วย span style ทันที
    function setSize(px) {
      focusEd();
      try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
      try { document.execCommand('fontSize', false, '7'); } catch (e) {}
      Array.prototype.slice.call(ed.querySelectorAll('font[size="7"]')).forEach(function (f) {
        var sp = document.createElement('span');
        sp.style.fontSize = px + 'px';
        if (f.getAttribute('color')) sp.style.color = f.getAttribute('color');
        if (f.getAttribute('face')) sp.style.fontFamily = f.getAttribute('face');
        while (f.firstChild) sp.appendChild(f.firstChild);
        f.parentNode.replaceChild(sp, f);
      });
    }
    // กด Toolbar ต้องไม่ทำให้เสียการเลือกข้อความ
    wrap.querySelector('.rte-bar').onmousedown = function (ev) {
      if (ev.target.closest && ev.target.closest('input[type="color"], select')) return;
      ev.preventDefault();
    };
    wrap.querySelectorAll('.rte-b').forEach(function (b) {
      b.onclick = function () {
        var c = b.dataset.cmd;
        if (c === 'clearFormat') { exec('removeFormat'); exec('justifyLeft'); }
        else if (c === 'undo' || c === 'redo') exec(c, null, false);
        else exec(c);
        ed.focus();
      };
    });
    wrap.querySelector('.rte-font').onchange = function () { exec('fontName', this.value); };
    wrap.querySelector('.rte-size').onchange = function () { setSize(Number(this.value)); };
    wrap.querySelectorAll('input[type="color"]').forEach(function (c) {
      c.oninput = function () {
        var cmd = c.dataset.cmd;
        if (cmd === 'hiliteColor') {
          focusEd();
          try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
          if (!document.execCommand('hiliteColor', false, c.value)) {
            try { document.execCommand('backColor', false, c.value); } catch (e) {}
          }
        } else exec(cmd, c.value);
      };
    });
    // วางข้อความจากภายนอกให้เป็นข้อความล้วน กัน HTML แปลกปลอมเข้ามา
    ed.addEventListener('paste', function (ev) {
      ev.preventDefault();
      var t = (ev.clipboardData || window.clipboardData).getData('text/plain') || '';
      try { document.execCommand('insertText', false, t); }
      catch (e) { document.execCommand('insertHTML', false, esc(t).replace(/\n/g, '<br>')); }
    });
  }

  /* ---------- แปลง HTML ของเนื้อหา → OOXML (คงฟอนต์ ขนาด สี การจัดตำแหน่ง) ---------- */
  var DOC_DX_BLOCK = { P: 1, DIV: 1, LI: 1, H1: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1 };
  function docCss(style, k) {
    var m = new RegExp('(?:^|;)\\s*' + k + '\\s*:\\s*([^;]+)', 'i').exec(style || '');
    return m ? m[1].trim() : '';
  }
  function docHexColor(v) {
    var s = String(v || '').trim();
    var m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
    function h(n) { return ('0' + Math.max(0, Math.min(255, parseInt(n, 10) || 0)).toString(16)).slice(-2); }
    if (m) return (h(m[1]) + h(m[2]) + h(m[3])).toUpperCase();
    m = /^#([0-9a-f]{3})$/i.exec(s);
    if (m) return (m[1][0] + m[1][0] + m[1][1] + m[1][1] + m[1][2] + m[1][2]).toUpperCase();
    m = /^#([0-9a-f]{6})$/i.exec(s);
    return m ? m[1].toUpperCase() : '';
  }
  function docDxStyle(inh, el) {
    var s = { font: inh.font, sizePx: inh.sizePx, bold: inh.bold, italic: inh.italic,
              underline: inh.underline, strike: inh.strike, color: inh.color, bg: inh.bg };
    var tag = el.tagName;
    if (tag === 'B' || tag === 'STRONG' || tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') s.bold = true;
    if (tag === 'I' || tag === 'EM') s.italic = true;
    if (tag === 'U') s.underline = true;
    if (tag === 'S' || tag === 'STRIKE') s.strike = true;
    var st = el.getAttribute('style') || '';
    var v;
    if ((v = docCss(st, 'font-family'))) s.font = v.split(',')[0].replace(/["']/g, '').trim();
    if ((v = docCss(st, 'font-size'))) {
      var px = parseFloat(v);
      if (isFinite(px)) s.sizePx = /pt\s*$/i.test(v) ? px * 4 / 3 : px;
    }
    if ((v = docCss(st, 'font-weight'))) s.bold = (v === 'bold' || parseInt(v, 10) >= 600);
    if ((v = docCss(st, 'font-style'))) s.italic = (v === 'italic' || v === 'oblique');
    if ((v = docCss(st, 'text-decoration') || docCss(st, 'text-decoration-line'))) {
      if (/underline/i.test(v)) s.underline = true;
      if (/line-through/i.test(v)) s.strike = true;
      if (/^\s*none\s*$/i.test(v)) { s.underline = false; s.strike = false; }
    }
    if ((v = docCss(st, 'color'))) s.color = docHexColor(v);
    if ((v = docCss(st, 'background-color'))) s.bg = docHexColor(v);
    return s;
  }
  function docDxRun(r) {
    if (r.br) return '<w:r><w:br/></w:r>';
    var s = r.s || {};
    var fam = docXml(s.font || DOC_FONT_DEFAULT);
    var sz = Math.max(8, Math.round((s.sizePx || DOC_SIZE_DEFAULT) * 1.5));   // px → half-point
    return '<w:r><w:rPr>' +
      '<w:rFonts w:ascii="' + fam + '" w:hAnsi="' + fam + '" w:cs="' + fam + '"/>' +
      (s.bold ? '<w:b/><w:bCs/>' : '') + (s.italic ? '<w:i/><w:iCs/>' : '') +
      (s.underline ? '<w:u w:val="single"/>' : '') + (s.strike ? '<w:strike/>' : '') +
      (s.color ? '<w:color w:val="' + s.color + '"/>' : '') +
      (s.bg ? '<w:shd w:val="clear" w:color="auto" w:fill="' + s.bg + '"/>' : '') +
      '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/></w:rPr>' +
      '<w:t xml:space="preserve">' + docXml(r.t) + '</w:t></w:r>';
  }
  function docDxFlush(ctx, out) {
    if (!ctx.runs.length) { ctx.prefix = ''; return; }
    var jc = { center: 'center', right: 'right', justify: 'both', left: 'left' }[ctx.align] || '';
    var runs = ctx.runs.slice();
    if (ctx.prefix) runs.unshift({ t: ctx.prefix, s: runs[0] && runs[0].s ? runs[0].s : {} });
    out.push('<w:p><w:pPr>' + (jc ? '<w:jc w:val="' + jc + '"/>' : '') +
      (ctx.indent ? '<w:ind w:left="' + ctx.indent + '"/>' : '') +
      '<w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr>' +
      runs.map(docDxRun).join('') + '</w:p>');
    ctx.runs = []; ctx.prefix = '';
  }
  function docDxWalk(node, inh, ctx, out) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var t = String(n.nodeValue || '').replace(/\u00a0/g, ' ');
        if (t.replace(/\s+/g, '') !== '') ctx.runs.push({ t: t, s: inh });
        return;
      }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'BR') { ctx.runs.push({ br: true }); return; }
      var st = docDxStyle(inh, n);
      var sty = n.getAttribute('style') || '';

      if (n.tagName === 'UL' || n.tagName === 'OL') {
        docDxFlush(ctx, out);
        var isOl = n.tagName === 'OL', i = 0;
        ctx.level = (ctx.level || 0) + 1;
        Array.prototype.slice.call(n.children).forEach(function (li) {
          if (li.tagName !== 'LI') return;
          i++;
          var prevA = ctx.align, prevI = ctx.indent;
          ctx.align = docCss(li.getAttribute('style') || '', 'text-align') || prevA;
          ctx.indent = ctx.level * 360;
          ctx.prefix = isOl ? (i + '. ') : '• ';
          docDxWalk(li, docDxStyle(st, li), ctx, out);
          docDxFlush(ctx, out);
          ctx.align = prevA; ctx.indent = prevI;
        });
        ctx.level--;
        return;
      }
      if (DOC_DX_BLOCK[n.tagName]) {
        docDxFlush(ctx, out);
        var pa = ctx.align, pi = ctx.indent;
        ctx.align = docCss(sty, 'text-align') || pa;
        var ml = parseFloat(docCss(sty, 'margin-left') || docCss(sty, 'padding-left'));
        if (isFinite(ml) && ml > 0) ctx.indent = Math.round(ml * 15);   // px → twips
        docDxWalk(n, st, ctx, out);
        docDxFlush(ctx, out);
        ctx.align = pa; ctx.indent = pi;
        return;
      }
      docDxWalk(n, st, ctx, out);     // inline element
    });
  }
  function docHtmlToDocx(body) {
    var dom = new DOMParser().parseFromString('<div id="njdx">' + docBodyHtml(body) + '</div>', 'text/html');
    var root = dom.getElementById('njdx');
    var out = [];
    var ctx = { runs: [], align: '', indent: 0, prefix: '', level: 0 };
    docDxWalk(root, { font: DOC_FONT_DEFAULT, sizePx: DOC_SIZE_DEFAULT }, ctx, out);
    docDxFlush(ctx, out);
    return out.join('') || docP(' ');
  }

  /* ---------- ส่วนลงนามท้ายเอกสาร — เลือกตามประเภทเอกสาร ----------
     ควบคุมเฉพาะ "การแสดงผล" เท่านั้น ข้อมูลผู้จัดทำ/HR/ผู้อนุมัติ/ผู้รับทราบ
     ยังถูกบันทึกในฐานข้อมูลและประวัติเอกสารครบเหมือนเดิมทุกประการ */
  var DOC_SIGN_NONE = ['COE', 'SALARY_CERT'];   // มีส่วนลงนามผู้มีอำนาจอยู่ในเนื้อหาแล้ว
  function docSignBox(label, name, sub, signed) {
    return '<div class="doc-sign"><div class="doc-sign-line' + (signed ? ' doc-signed' : '') + '"></div>' +
      '<b>' + esc(label) + '</b><small>' + esc(name || '—') + '</small>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  }
  /* แถบลงนามท้ายเอกสาร = 2 ช่องเท่านั้นทุกประเภท (ผู้อนุมัติ + พนักงานผู้รับทราบ)
     ช่อง "ผู้จัดทำ" และ "ฝ่ายบุคคล (HR)" ถูกถอดออกจากโครง HTML จริง ไม่ได้ซ่อนด้วย CSS
     ข้อมูล issued_by / hr_signer ยังถูกบันทึกในฐานข้อมูลและประวัติเอกสารครบเหมือนเดิม */
  function docSignsHtml(d, org, ack) {
    if (DOC_SIGN_NONE.indexOf(d.doc_type) >= 0) return '';
    return '<div class="doc-signs doc-signs-2">' +
      docSignBox('ผู้อนุมัติ', d.approver_name || (org && org.ceo_signer) || '',
                 (org && org.ceo_position) || '', false) +
      docSignBox('พนักงานผู้รับทราบ', ack ? ack.emp_name : d.emp_name_snap,
                 ack ? docTS(ack.acked_at) : '', !!ack) +
      '</div>';
  }

  /* ---------- Template A4 กลาง (โครงตายตัวทุกประเภท) ---------- */
  function docA4Html(d, org, ack) {
    var m = d.doc_meta || {};
    var logo = (org && org.logo_url) || NJ_LOGO_SRC;
    var co = (org && org.company_name) || NJ_COMPANY_NAME;
    function row(k, v) {
      return '<div class="doc-f"><small>' + esc(k) + '</small><b>' + esc(v == null || v === '' ? '—' : String(v)) + '</b></div>';
    }
    return '<div class="doc-a4-page doc-t-' + esc(String(d.doc_type || '').toLowerCase()) + '">' +
      '<div class="doc-a4">' +
      '<div class="doc-head">' +
      '<img class="doc-logo" src="' + esc(logo) + '" alt="logo">' +
      '<div class="doc-co"><b>' + esc(co) + '</b>' +
      (org && org.address ? '<small>' + esc(org.address) + '</small>' : '') +
      '<small>' + (org && org.phone ? 'โทร. ' + esc(org.phone) : '') +
      (org && org.email ? ' · ' + esc(org.email) : '') +
      (org && org.tax_id ? ' · เลขประจำตัวผู้เสียภาษี ' + esc(org.tax_id) : '') + '</small></div>' +
      '<div class="doc-meta"><small>เลขที่เอกสาร</small><b>' + esc(d.doc_no) + '</b>' +
      '<small>วันที่ออกเอกสาร</small><b>' + docDate(d.issued_at) + '</b></div>' +
      '</div>' +
      // หัวข้อภายในเอกสาร = ชื่อประเภทเอกสารเท่านั้น (ชื่อ Draft/ชื่อไฟล์ยังมีรหัส+ชื่อพนักงานตามเดิม)
      '<h2 class="doc-title">' + esc(docTypeLabel(d.doc_type)) + '</h2>' +
      '<div class="doc-emp">' +
      row('รหัสพนักงาน', d.emp_code_snap) + row('ชื่อ-นามสกุล', d.emp_name_snap) +
      row('ตำแหน่ง', d.position_snap) + row('แผนก', d.dept_snap) +
      row('วันที่เริ่มงาน', m.start_date ? empBE(m.start_date) : '—') +
      row('ผู้บังคับบัญชา', m.supervisor_name) +
      row('วันที่มีผล', d.effective_date ? empBE(String(d.effective_date).slice(0, 10)) : '—') +
      row('บริษัท', m.company || co) +
      '</div>' +
      '<div class="doc-body">' + docBodyHtml(d.body) + '</div>' +
      docSignsHtml(d, org, ack) +
      '<div class="doc-foot"><span>' + esc(d.doc_no) + ' · ฉบับที่ ' + (d.version || 1) + '</span>' +
      '<span>' + esc((org && org.footer_note) || 'เอกสารฉบับนี้ออกโดยระบบ NJ LOGISTIC HR SYSTEM') + '</span></div>' +
      '</div></div>';
  }

  /* ---------- แผงรับทราบของพนักงาน ----------
     ข้อความยืนยันต้องมาจาก DB (njhr_doc_confirm_text) ไม่ใช่ค่าคงที่ใน Frontend
     DOC_ACK_TEXT เหลือไว้เป็น Fallback ระหว่างรอ RPC ตอบเท่านั้น ไม่ใช่ Source of Truth
     Frontend ไม่ส่งข้อความนี้กลับไปให้ DB — njhr_doc_respond snapshot เองฝั่งเซิร์ฟเวอร์ */
  function docAckPanelHtml(d) {
    var sign = !!d.requires_signature;
    var goLabel = sign ? ' ยอมรับและลงนามอิเล็กทรอนิกส์' : ' รับทราบเอกสาร';
    return '<div class="card doc-ack-card"><div class="card-head"><h3>' +
      (sign ? 'การยอมรับและลงนามอิเล็กทรอนิกส์' : 'การรับทราบเอกสาร') + '</h3></div>' +
      '<p class="doc-ack-text" id="doc-ack-text">' + esc(DOC_ACK_TEXT) + '</p>' +
      '<label class="check"><input type="checkbox" id="doc-ack-chk"><span>' +
      (sign ? 'ข้าพเจ้าได้อ่านและยอมรับข้อความข้างต้นแล้ว' : 'ข้าพเจ้าได้อ่านและรับทราบแล้ว') + '</span></label>' +
      '<label class="field"><span>ยืนยันตัวตน — รหัสผ่านของคุณ <i class="req">*</i></span>' +
      '<input type="password" id="doc-ack-pw" autocomplete="current-password" placeholder="กรอกรหัสผ่านเพื่อยืนยันตัวตน"></label>' +
      '<div class="toolbar">' +
      '<button class="btn btn-primary" id="doc-ack-go" disabled>' + icon('check') + goLabel + '</button>' +
      '<button class="btn btn-ghost t-red" id="doc-ack-no">' + icon('ban') +
      (sign ? ' ปฏิเสธลงนาม' : ' ปฏิเสธรับทราบ') + '</button></div>' +
      '<div class="form-error" id="doc-ack-err" role="alert"></div></div>';
  }

  function docBindAckPanel(d, el) {
    var chk = document.getElementById('doc-ack-chk');
    var pw = document.getElementById('doc-ack-pw');
    var go = document.getElementById('doc-ack-go');
    var err = document.getElementById('doc-ack-err');
    var sign = !!d.requires_signature;
    var goLabel = sign ? ' ยอมรับและลงนามอิเล็กทรอนิกส์' : ' รับทราบเอกสาร';
    var busy = false;

    // ดึงข้อความยืนยันตัวจริงจาก DB — ตัวเดียวกับที่ njhr_doc_respond จะ snapshot ลงหลักฐาน
    sbRpc('njhr_doc_confirm_text', {
      p_doc_type: d.doc_type, p_requires_signature: sign, p_action: 'ACKNOWLEDGE'
    }).then(function (t) {
      var box = document.getElementById('doc-ack-text');
      if (box && t) box.textContent = String(t);
    })['catch'](function () { /* ใช้ข้อความ Fallback ที่แสดงอยู่ต่อไป */ });

    function sync() { go.disabled = busy || !(chk.checked && String(pw.value || '').length > 0); }
    chk.onchange = sync; pw.oninput = sync; sync();

    go.onclick = function () {
      if (go.disabled || busy) return;                 // กันกดซ้ำ / คอม+มือถือกดพร้อมกัน
      busy = true; go.disabled = true;
      go.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      err.textContent = '';
      var pass = pw.value;
      sbRpc('njhr_doc_respond', {
        p_token: sbToken(), p_id: d.id, p_action: 'ACKNOWLEDGE',
        p_password: pass, p_ctx: docCtx()
      }).then(function () {
        pw.value = '';                                  // ล้างรหัสผ่านทันทีหลังส่ง
        toast(sign ? 'ลงนามอิเล็กทรอนิกส์เรียบร้อยแล้ว' : 'บันทึกการรับทราบเรียบร้อยแล้ว');
        if (NJHR.layout && NJHR.layout.refreshDocPending) NJHR.layout.refreshDocPending();
        docRenderDetail(el);                            // โหลดสถานะใหม่จาก Server เสมอ
        // เข้าคิวสร้าง Final PDF ต่อทันที (DB ตั้ง PENDING ไว้ในทรานแซกชันเดียวกับ ACK แล้ว)
        setTimeout(function () { docPdfSync(d.id, true); }, 0);
      })['catch'](function (ex) {
        busy = false; pw.value = '';
        go.innerHTML = icon('check') + goLabel;
        err.textContent = ex.message || 'ยืนยันไม่สำเร็จ';
        sync();
      });
    };
    document.getElementById('doc-ack-no').onclick = function () {
      openModal('ปฏิเสธการรับทราบ',
        '<label class="field"><span>เหตุผล <i class="req">*</i></span>' +
        '<textarea id="doc-rj-why" rows="3" placeholder="ระบุเหตุผลที่ไม่รับทราบเอกสารฉบับนี้"></textarea></label>' +
        '<label class="field"><span>ยืนยันตัวตน — รหัสผ่านของคุณ <i class="req">*</i></span>' +
        '<input type="password" id="doc-rj-pw" autocomplete="current-password"></label>' +
        '<div class="form-error" id="doc-rj-err" role="alert"></div>',
        '<button class="btn btn-ghost" id="doc-rj-cancel">ยกเลิก</button>' +
        '<button class="btn btn-danger" id="doc-rj-go">ยืนยันการปฏิเสธ</button>');
      document.getElementById('doc-rj-cancel').onclick = closeModal;
      document.getElementById('doc-rj-go').onclick = function () {
        var b = this, why = String(document.getElementById('doc-rj-why').value || '').trim();
        var p = String(document.getElementById('doc-rj-pw').value || '');
        var e2 = document.getElementById('doc-rj-err');
        if (!why) { e2.textContent = 'กรุณาระบุเหตุผล'; return; }
        if (!p) { e2.textContent = 'กรุณากรอกรหัสผ่านเพื่อยืนยันตัวตน'; return; }
        if (b.disabled) return;
        b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
        sbRpc('njhr_doc_respond', {
          p_token: sbToken(), p_id: d.id, p_action: 'REJECT',
          p_password: p, p_ctx: docCtx(), p_reason: why
        }).then(function () {
          closeModal(); toast('บันทึกการปฏิเสธรับทราบแล้ว', 'info');
          if (NJHR.layout && NJHR.layout.refreshDocPending) NJHR.layout.refreshDocPending();
          docRenderDetail(el);
        }).catch(function (ex) {
          b.disabled = false; b.innerHTML = 'ยืนยันการปฏิเสธ';
          e2.textContent = ex.message || 'ดำเนินการไม่สำเร็จ';
        });
      };
    };
  }

  function docAckProofHtml(a) {
    return '<div class="card"><div class="card-head"><h3>หลักฐานการรับทราบ</h3></div>' +
      '<div class="doc-emp">' +
      '<div class="doc-f"><small>ผู้รับทราบ</small><b>' + esc((a.emp_code || '') + ' ' + (a.emp_name || '')) + '</b></div>' +
      '<div class="doc-f"><small>แผนก</small><b>' + esc(a.department || '—') + '</b></div>' +
      '<div class="doc-f"><small>วันที่และเวลา</small><b>' + docTS(a.acked_at) + '</b></div>' +
      '<div class="doc-f"><small>การดำเนินการ</small><b>' + (a.action === 'SIGN' ? 'ลงนาม' : 'รับทราบ') + '</b></div>' +
      '<div class="doc-f"><small>ช่องทาง</small><b>' + esc(a.channel || '—') + '</b></div>' +
      '<div class="doc-f"><small>อุปกรณ์</small><b>' + esc(a.device || '—') + '</b></div>' +
      '<div class="doc-f"><small>IP Address</small><b>' + esc(a.ip_address || '—') + '</b></div>' +
      '<div class="doc-f"><small>บันทึกโดยบัญชี</small><b>' + esc(a.acked_by || '—') + '</b></div>' +
      '</div>' +
      (a.user_agent ? '<p class="muted note" style="overflow-wrap:anywhere">Browser: ' + esc(a.user_agent) + '</p>' : '') +
      '</div>';
  }

  /* ---------- เดิน Workflow ---------- */
  function docDoFlow(action, d, el) {
    var needNote = ['REJECT_APPROVAL', 'CANCEL'].indexOf(action) >= 0;
    var titles = {
      SUBMIT: 'ส่งขออนุมัติ', APPROVE: 'อนุมัติเอกสาร', REJECT_APPROVAL: 'ไม่อนุมัติเอกสาร',
      SEND: 'ส่งเอกสารให้พนักงาน', ARCHIVE: 'เก็บเข้าประวัติพนักงาน', CANCEL: 'ยกเลิกเอกสาร'
    };
    function fire(note) {
      docErr('');
      return sbRpc('njhr_doc_flow', { p_token: sbToken(), p_id: d.id, p_action: action, p_note: note || null, p_ctx: docCtx() })
        .then(function () { toast(titles[action] + 'เรียบร้อยแล้ว'); docRenderDetail(el); })
        .catch(function (er) { docErr(er.message || 'ดำเนินการไม่สำเร็จ'); });
    }
    if (!needNote) {
      confirmDialog(titles[action],
        titles[action] + ' <b>' + esc(d.doc_no) + '</b><br>ของ <b>' + esc(d.emp_name_snap || '') + '</b> ใช่หรือไม่',
        'ยืนยัน', function () { return fire(''); }, action === 'CANCEL');
      return;
    }
    openModal(titles[action],
      '<label class="field"><span>เหตุผล <i class="req">*</i></span>' +
      '<textarea id="doc-fl-note" rows="3" placeholder="ระบุเหตุผล"></textarea></label>' +
      '<div class="form-error" id="doc-fl-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="doc-fl-cancel">ยกเลิก</button>' +
      '<button class="btn btn-danger" id="doc-fl-go">ยืนยัน</button>');
    document.getElementById('doc-fl-cancel').onclick = closeModal;
    document.getElementById('doc-fl-go').onclick = function () {
      var v = String(document.getElementById('doc-fl-note').value || '').trim();
      if (!v) { document.getElementById('doc-fl-err').textContent = 'กรุณาระบุเหตุผล'; return; }
      closeModal(); fire(v);
    };
  }

  /* ---------- พิมพ์ / บันทึก PDF (ใช้ Print Dialog เหมือน E-PAYSLIP) ---------- */
  function docPrintArea() {
    var a = document.getElementById('doc-print-area');
    if (!a) {
      a = document.createElement('div');
      a.id = 'doc-print-area';
      a.setAttribute('aria-hidden', 'true');
      document.body.appendChild(a);
    }
    return a;
  }
  function docPdfName(d) {
    var nm = docTypeLabel(d.doc_type) + '_' + (d.emp_code_snap || '') + '_' + (d.emp_name_snap || '');
    return nm.replace(/[\\/:*?"<>|]/g, '').replace(/[()]/g, '')
      .replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }
  var docTitleBak = null;
  function docPrint(d, org, ack) {
    var area = docPrintArea();
    area.innerHTML = docA4Html(d, org, ack);
    // ชื่อไฟล์ PDF ที่เบราว์เซอร์เสนอมาจาก document.title
    docTitleBak = document.title;
    document.title = docPdfName(d);
    document.body.classList.add('printing-doc');
    toast('ในหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น "Save as PDF" และปิด "Headers and footers" เพื่อให้ PDF ตรงกับตัวอย่าง', 'info');
    // รอให้เบราว์เซอร์วาดหน้าเสร็จก่อนสั่งพิมพ์ (มี fallback กรณีไม่มี requestAnimationFrame)
    var raf = window.requestAnimationFrame
      ? function (fn) { window.requestAnimationFrame(fn); }
      : function (fn) { setTimeout(fn, 30); };
    raf(function () { raf(function () { window.print(); }); });
  }
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('printing-doc');
    var a = document.getElementById('doc-print-area');
    if (a) a.innerHTML = '';
    if (docTitleBak != null) { document.title = docTitleBak; docTitleBak = null; }
  });

  /* ---------- [ปิดการใช้งาน] ตัวสร้างไฟล์ Word (.docx)
     ผู้ใช้แจ้งว่าต้องการเฉพาะ PDF จึงถอดปุ่ม "ดาวน์โหลด Word" ออกจากหน้าจอแล้ว
     โค้ดส่วนนี้คงไว้เฉย ๆ ไม่มีจุดเรียกใช้ — เปิดกลับมาได้ด้วยการใส่ปุ่มคืนเพียงบรรทัดเดียว ---------- */
  function docXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function docP(text, opt) {
    opt = opt || {};
    var pr = '<w:pPr>' +
      (opt.align ? '<w:jc w:val="' + opt.align + '"/>' : '') +
      '<w:spacing w:after="' + (opt.after == null ? 80 : opt.after) + '" w:line="300" w:lineRule="auto"/></w:pPr>';
    var rpr = '<w:rPr><w:rFonts w:ascii="TH Sarabun New" w:hAnsi="TH Sarabun New" w:cs="TH Sarabun New"/>' +
      '<w:sz w:val="' + (opt.size || 30) + '"/><w:szCs w:val="' + (opt.size || 30) + '"/>' +
      (opt.bold ? '<w:b/><w:bCs/>' : '') + '</w:rPr>';
    return '<w:p>' + pr + '<w:r>' + rpr + '<w:t xml:space="preserve">' + docXml(text) + '</w:t></w:r></w:p>';
  }
  function docExportDocx(d, org) {
    var m = d.doc_meta || {};
    var co = (org && org.company_name) || NJ_COMPANY_NAME;
    var parts = [];
    parts.push(docP(co, { bold: true, align: 'center', size: 34 }));
    if (org && org.address) parts.push(docP(org.address, { align: 'center', size: 26 }));
    if (org && (org.phone || org.email)) {
      parts.push(docP([org.phone ? 'โทร. ' + org.phone : '', org.email || ''].filter(Boolean).join(' · '),
        { align: 'center', size: 26 }));
    }
    parts.push(docP('เลขที่เอกสาร ' + d.doc_no + '        วันที่ ' + docDate(d.issued_at), { align: 'right', size: 28 }));
    parts.push(docP(d.title || docTypeLabel(d.doc_type), { bold: true, align: 'center', size: 36, after: 200 }));
    parts.push(docP('รหัสพนักงาน: ' + (d.emp_code_snap || '-') + '    ชื่อ-นามสกุล: ' + (d.emp_name_snap || '-')));
    parts.push(docP('ตำแหน่ง: ' + (d.position_snap || '-') + '    แผนก: ' + (d.dept_snap || '-')));
    parts.push(docP('วันที่เริ่มงาน: ' + (m.start_date ? empBE(m.start_date) : '-') +
      '    ผู้บังคับบัญชา: ' + (m.supervisor_name || '-'), { after: 200 }));
    parts.push(docHtmlToDocx(d.body));      // คงฟอนต์ ขนาด สี และการจัดตำแหน่งจากตัวแก้ไข
    parts.push(docP(' ', { after: 300 }));
    // แถบลงนาม 2 ช่องเท่ากับที่แสดงใน Preview/PDF (ส่วนนี้ปิดการใช้งานอยู่ แต่คงให้ตรงกัน)
    parts.push(docP('ผู้อนุมัติ ' + (d.approver_name || '........................................') +
      '        พนักงานผู้รับทราบ ........................................'));

    var docXmlStr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' + parts.join('') +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>' +
      '</w:sectPr></w:body></w:document>';

    return rptLoadZip().then(function () {
      var zip = new window.JSZip();
      zip.file('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>');
      zip.folder('_rels').file('.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>');
      zip.folder('word').file('document.xml', docXmlStr);
      return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = rptSafeName(d.doc_no + '_' + (d.emp_name_snap || '')) + '.docx';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('ดาวน์โหลดเอกสาร Word แล้ว');
    }).catch(function (ex) { docErr((ex && ex.message) || 'สร้างไฟล์ Word ไม่สำเร็จ'); });
  }

  /* ---------- Export Excel รายการเอกสาร ---------- */
  function docExportXlsx() {
    if (!docRows.length) { docErr('ไม่มีข้อมูลสำหรับ Export'); return; }
    var head = ['ลำดับ', 'เลขที่เอกสาร', 'ฉบับที่', 'ประเภทเอกสาร', 'รหัสพนักงาน', 'ชื่อพนักงาน',
      'แผนก', 'ตำแหน่ง', 'วันที่ออก', 'วันที่มีผล', 'สถานะ', 'ผู้อนุมัติ', 'วันที่อนุมัติ',
      'วันที่ส่ง', 'วันที่เปิดอ่าน', 'ผู้รับทราบ', 'วันที่รับทราบ', 'ผู้จัดทำ'];
    var rows = docSorted().map(function (r, i) {
      return [i + 1, r.doc_no, r.version, docTypeLabel(r.doc_type), r.emp_code, r.emp_name,
        r.department, r.position_name, docDate(r.issued_at),
        r.effective_date ? empBE(String(r.effective_date).slice(0, 10)) : '—',
        docStat(r.status).t, r.approver_name || '—', r.approved_at ? docTS(r.approved_at) : '—',
        r.sent_at ? docTS(r.sent_at) : '—', r.viewed_at ? docTS(r.viewed_at) : '—',
        r.acked_by || '—', r.acked_at ? docTS(r.acked_at) : '—', r.issued_by || '—'];
    });
    var title = [db.settings.companyName, 'ทะเบียนเอกสาร HR',
      'พิมพ์เมื่อ ' + nowStamp() + ' · ' + rows.length + ' ฉบับ'];
    docErr('');
    rptLoadZip().then(function () {
      return rptBuildXlsx('เอกสาร HR', head, rows,
        [6, 18, 7, 26, 12, 26, 20, 20, 13, 13, 16, 22, 18, 18, 18, 22, 18, 14], title);
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = rptSafeName('ทะเบียนเอกสารHR_' + todayISO()) + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      audit('EXPORT', 'Export ทะเบียนเอกสาร HR ' + rows.length + ' ฉบับ');
      toast('ดาวน์โหลดทะเบียนเอกสารแล้ว ' + rows.length + ' ฉบับ');
    }).catch(function (ex) { docErr((ex && ex.message) || 'Export ไม่สำเร็จ'); });
  }

  /* ---------- ตั้งค่าหัวเอกสาร (ข้อมูลบริษัท) ---------- */
  function docOrgForm(el) {
    docLoadOrg().then(function (o) {
      function f(n, l, ph) {
        return '<label class="field"><span>' + esc(l) + '</span>' +
          '<input name="' + n + '" value="' + esc(o[n] || '') + '" placeholder="' + esc(ph || '') + '"></label>';
      }
      openModal('ข้อมูลบริษัทบนหัวเอกสาร',
        '<form id="doc-org-f" novalidate>' +
        f('company_name', 'ชื่อบริษัท') +
        '<label class="field"><span>ที่อยู่</span><textarea name="address" rows="2">' + esc(o.address || '') + '</textarea></label>' +
        '<div class="form-2col">' + f('phone', 'เบอร์โทร') + f('email', 'อีเมล') + '</div>' +
        '<div class="form-2col">' + f('tax_id', 'เลขประจำตัวผู้เสียภาษี') + f('logo_url', 'URL โลโก้ (เว้นว่าง = ใช้โลโก้ระบบ)') + '</div>' +
        '<div class="form-2col">' + f('hr_signer', 'ผู้ลงนามฝ่ายบุคคล') + f('hr_position', 'ตำแหน่ง (HR)') + '</div>' +
        '<div class="form-2col">' + f('ceo_signer', 'ผู้อนุมัติ / ผู้บริหาร') + f('ceo_position', 'ตำแหน่ง (ผู้อนุมัติ)') + '</div>' +
        f('footer_note', 'ข้อความท้ายเอกสาร') +
        '<div class="form-error" id="doc-org-err" role="alert"></div></form>',
        '<button class="btn btn-ghost" id="doc-org-cancel">ยกเลิก</button>' +
        '<button class="btn btn-primary" id="doc-org-save">บันทึก</button>',
        { wide: true });
      document.getElementById('doc-org-cancel').onclick = closeModal;
      document.getElementById('doc-org-save').onclick = function () {
        var btn = this, fm = document.getElementById('doc-org-f');
        var data = {};
        ['company_name', 'address', 'phone', 'email', 'tax_id', 'logo_url',
         'hr_signer', 'hr_position', 'ceo_signer', 'ceo_position', 'footer_note'].forEach(function (k) {
          var x = fm.querySelector('[name="' + k + '"]');
          data[k] = x ? String(x.value || '').trim() : '';
        });
        if (btn.disabled) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
        sbRpc('njhr_doc_org_save', { p_token: sbToken(), p_data: data }).then(function (r) {
          docOrg = (r && r.data) || data;
          closeModal(); toast('บันทึกข้อมูลบริษัทแล้ว');
          if (docState.openId) docRenderDetail(el);
        }).catch(function (er) {
          btn.disabled = false; btn.innerHTML = 'บันทึก';
          document.getElementById('doc-org-err').textContent = er.message || 'บันทึกไม่สำเร็จ';
        });
      };
    }).catch(function (er) { docErr(er.message || 'โหลดข้อมูลบริษัทไม่สำเร็จ'); });
  }
