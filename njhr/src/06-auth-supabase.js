  /* ================= LOGIN ================= */
  /* ================= SUPABASE AUTH LAYER =================
     USER จริงมาจากตาราง app_users (app_code='salary') เท่านั้น
     รหัสผ่านตรวจฝั่งเซิร์ฟเวอร์ด้วย RPC njhr_login (SECURITY DEFINER)
     localStorage เก็บได้เฉพาะ session/UI preference — ไม่มี password ไม่มี hash */
  var SB = {
    url: (window.NJHR_SUPABASE_URL || ''),      // ตั้งค่าใน index.html
    key: (window.NJHR_SUPABASE_ANON_KEY || '')  // publishable/anon key เท่านั้น ห้ามใส่ service role
  };
  var sbUser = null, sbLoginMsg = '';
  function sbSaveUser() { try { localStorage.setItem('njhr_sb_user', JSON.stringify(sbUser)); } catch (e) {} }
  function sbLoadUser() { try { sbUser = JSON.parse(localStorage.getItem('njhr_sb_user')); } catch (e) { sbUser = null; } }
  function sbClearUser() { sbUser = null; try { localStorage.removeItem('njhr_sb_user'); } catch (e) {} }
  function sbReady() { return !!(SB.url && SB.key); }
  // ทดสอบการเชื่อมต่อตอนเริ่มระบบ — อ่านอย่างเดียว ไม่แตะข้อมูล · Key ส่งทาง header เท่านั้น
  // 401/403 = Key ใช้ไม่ได้ · fetch reject = ไม่มีเน็ต/URL ผิด · สถานะอื่นถือว่า Key ผ่านแล้ว
  var SB_HEALTH = null;
  function sbConnCheck() {
    if (!sbReady()) return Promise.reject(new Error('CONFIG'));
    // เรียก RPC จริง ไม่ใช่แค่ GET /rest/v1/ — ตรวจทั้งการเชื่อมต่อ สิทธิ์ Key และ schema_version
    return sbRpc('njhr_healthcheck', {}).then(function (h) {
      SB_HEALTH = h || null;
      if (!h || h.ok !== true || h.project_ready !== true) throw new Error('SCHEMA');
      return h;
    }, function (e) {
      if (e && e.message === 'SCHEMA') throw e;
      SB_HEALTH = null;
      throw new Error('NETWORK');
    });
  }
  // ข้อความเดียวสำหรับทุกสาเหตุ — ไม่เปิดเผย Key และไม่บอกรายละเอียดที่ใช้เดา Key ได้
  function renderConnError() {
    document.getElementById('app').innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
      '<div class="login-brand"><span class="brand-badge big">NJ</span><h1>NJ LOGISTIC</h1><p>HR SYSTEM</p></div>' +
      '<div class="form-error" id="conn-msg" role="alert" style="text-align:center;line-height:1.8">' +
      'ไม่สามารถเชื่อมต่อฐานข้อมูล Supabase ได้<br>กรุณาตรวจสอบการตั้งค่าระบบหรือการเชื่อมต่ออินเทอร์เน็ต</div>' +
      (SB_HEALTH && SB_HEALTH.detail && SB_HEALTH.detail.missing && SB_HEALTH.detail.missing.length
        ? '<p class="muted note">ยังติดตั้งไม่ครบ: ' + esc(SB_HEALTH.detail.missing.join(', ')) +
          ' · schema ' + esc(String(SB_HEALTH.schema_version || '-')) + '</p>' : '') +
      '<button class="btn btn-primary btn-block btn-lg" id="conn-retry">ลองเชื่อมต่ออีกครั้ง</button>' +
      '</div></div>';
    document.getElementById('conn-retry').onclick = function () {
      var b = this; b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังเชื่อมต่อ…';
      njhrBoot();                                  // ใช้ลำดับเริ่มระบบเดิม ไม่ Refresh หน้าเว็บ
    };
  }
  /* ===== ตัวกลางเรียก RPC — Timeout + AbortController + Retry เฉพาะคำสั่งอ่าน =====
     - Timeout 13 วินาที ยกเลิกด้วย AbortController
     - Retry 1 ครั้ง เฉพาะ RPC ที่อ่านข้อมูล และเฉพาะเมื่อล้มเหลวระดับเครือข่าย/หมดเวลา
     - RPC ที่เขียนข้อมูลห้าม retry เด็ดขาด เพราะอาจทำให้เกิดข้อมูลซ้ำ
     - ข้อความผิดพลาดที่คืนออกไปเป็นภาษาที่ผู้ใช้เข้าใจได้ ส่วนรายละเอียดทางเทคนิคลง console
     - รูปแบบค่าที่ resolve เหมือนเดิมทุกประการ (list คืน array · single คืน object) */
  var SB_TIMEOUT_MS = 13000;
  /* เปิดค่าเดียวกันให้โมดูลแยกที่อยู่นอก IIFE นี้ใช้ร่วม (face.js)
     เพื่อให้มี Timeout ค่าเดียวทั้งระบบ ไม่ต้องประกาศซ้ำ */
  window.NJHR_SB_TIMEOUT_MS = SB_TIMEOUT_MS;
  var SB_WRITE_RPC = {
    'njhr_ann_ack': 1, 'njhr_ann_read': 1, 'njhr_att_migrate': 1, 'njhr_att_punch': 1,
    /* ลงเวลาของกลุ่มยกเว้นผู้บริหาร — เป็นคำสั่งเขียน ต้องอยู่ในรายการนี้เสมอ
       ไม่งั้นจะถูกจัดเป็นคำสั่งอ่าน แล้ว "ลองใหม่อัตโนมัติ" ทำให้ลงเวลาซ้ำได้ */
    'njhr_att_punch_exempt': 1,
    'njhr_dept_delete': 1, 'njhr_dept_move': 1, 'njhr_dept_save': 1, 'njhr_doc_delete': 1,
    'njhr_doc_flow': 1, 'njhr_doc_org_save': 1, 'njhr_doc_respond': 1, 'njhr_doc_save': 1,
    'njhr_doc_view': 1, 'njhr_emp_import': 1, 'njhr_emp_save': 1, 'njhr_emp_status': 1,
    'njhr_empfile_delete': 1, 'njhr_empfile_save': 1, 'njhr_face_delete': 1, 'njhr_gf_delete': 1,
    'njhr_gf_save': 1, 'njhr_holiday_delete': 1, 'njhr_holiday_save': 1, 'njhr_leave_cancel': 1,
    'njhr_leave_decide': 1, 'njhr_leave_submit': 1, 'njhr_leave_type_save': 1, 'njhr_login': 1,
    /* เพิ่มใหม่: ทั้งสามตัวเขียนข้อมูลจริง ห้าม retry
       njhr_face_login สร้าง session · njhr_face_self_enroll เขียนทะเบียนใบหน้า
       njhr_face_login_set เปลี่ยนสวิตช์ความปลอดภัยของบัญชี */
    'njhr_face_login': 1, 'njhr_face_login_set': 1, 'njhr_face_self_enroll': 1,
    'njhr_face_self_reenroll': 1,
    'njhr_logout': 1, 'njhr_notify_read': 1, 'njhr_notify_read_all': 1, 'njhr_ot_attach_add': 1,
    'njhr_ot_attach_delete': 1, 'njhr_pay_entry_bulk': 1, 'njhr_pay_entry_copy_apply': 1, 'njhr_pay_entry_delete': 1,
    'njhr_pay_entry_save': 1, 'njhr_pay_entry_set_active': 1, 'njhr_pay_item_delete': 1, 'njhr_pay_item_reorder': 1,
    'njhr_pay_item_save': 1, 'njhr_session_check': 1, 'njhr_shift_assign': 1, 'njhr_shift_save': 1,
    'njhr_shift_set_active': 1, 'njhr_slip_mark_sent': 1, 'njhr_sso_emp_save': 1, 'njhr_user_link': 1,
    'njhr_user_password': 1, 'njhr_user_save': 1, 'njhr_wf_delete': 1, 'njhr_wf_save': 1,
    'njhr_wf_step_delete': 1, 'njhr_wf_step_move': 1, 'njhr_wf_step_save': 1,
    /* เพิ่มจากการตรวจ Static: RPC เหล่านี้ Frontend เรียกจริงและ SQL เขียนข้อมูล
       (insert/update/delete) แต่เดิมถูกจัดเป็น Read จึงถูก Retry/Abort ได้ — อันตราย
       njhr_doc_confirm_text ไม่อยู่ในลิสต์นี้โดยเจตนา เพราะเป็น Read (stable) */
    'njhr_activation_link': 1, 'njhr_activation_reject': 1, 'njhr_activation_submit': 1,
    'njhr_att_correction_submit': 1, 'njhr_gov_holiday_apply': 1, 'njhr_gov_holiday_set': 1,
    'njhr_me_save': 1, 'njhr_user_delete': 1,
    /* ยืนยันจาก SQL แล้วว่าเขียนข้อมูลจริง (insert/update/delete) และไม่ใช่ stable
       F3_correction_workflow.sql · K2_shift_membership.sql · 44_approval_workflow.sql
       ใส่ไว้แม้ Frontend ปัจจุบันยังไม่ได้เรียกทุกตัว เพื่อกันการจัดชั้นผิดเมื่อมีการเรียกในอนาคต */
    'njhr_att_correction_approve': 1, 'njhr_att_correction_reject': 1,
    'njhr_shift_assign_many': 1, 'njhr_shift_no_shift_set': 1, 'njhr_shift_remove': 1,
    'njhr_wf_approver_add': 1, 'njhr_wf_approver_remove': 1, 'njhr_wf_step_toggle': 1,
    /* RPC ที่ Frontend เริ่มเรียกในรอบย้าย Data Source (OT · ประกาศ · ตั้งค่า) */
    'njhr_announcement_save': 1, 'njhr_announcement_set_active': 1,
    'njhr_ot_decide': 1, 'njhr_ot_submit': 1, 'njhr_setting_save': 1,
    /* 50 ทวิ — ทั้ง 4 ตัวเขียนข้อมูลจริงและมีผลข้างเคียง (ยืนยันจาก 87_wht50.sql)
         njhr_wht50_draft    insert แถวใหม่ + ออกเลขลำดับ
         njhr_wht50_update   update ร่าง + เขียน audit WHT50_EDIT
         njhr_wht50_confirm  ออกเลขที่เอกสาร (running number) + เปลี่ยนสถานะ
         njhr_wht50_send     สร้างแถวใน njhr_emp_documents + แจ้งเตือน
       ถ้าถูกจัดเป็น Read จะโดน Retry/Dedup ซึ่งทำให้เกิดเอกสารซ้ำหรือเลขกระโดด */
    'njhr_wht50_draft': 1, 'njhr_wht50_update': 1,
    'njhr_wht50_confirm': 1, 'njhr_wht50_send': 1
  };
  function sbIsWriteRpc(fn) { return SB_WRITE_RPC[fn] === 1; }
  function sbOnce(fn, body, ctl) {
    return fetch(SB.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var e = new Error((j && (j.message || j.hint)) || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
          e.sbServer = true;                       // เซิร์ฟเวอร์ตอบแล้วแต่ปฏิเสธ — ห้าม retry
          throw e;
        }
        return j;
      });
    });
  }
  /* ล็อกกันบันทึกซ้ำระดับข้อมูล — ใช้กับ RPC ที่เขียนข้อมูลเท่านั้น
     คีย์ = ชื่อ RPC + payload ที่ตัด token ออก
     - payload เหมือนกันเป๊ะและยังค้างอยู่ = การกดซ้ำ → ปฏิเสธทันที ไม่ยิงซ้ำ
     - payload ต่างกัน = คนละรายการ → ผ่านปกติ (อัปโหลดหลายไฟล์พร้อมกันยังทำงานได้)
     - ปลดล็อกเมื่อ settle เสมอ ไม่ว่าสำเร็จ ล้มเหลว หรือหมดเวลา จึงไม่มีล็อกค้าง */
  var SB_INFLIGHT = {};
  /* Busy State ระดับระบบ — ระหว่างที่มีคำสั่งเขียนข้อมูลค้างอยู่ ให้ body ได้ class 'njhr-busy'
     CSS จะทำให้ปุ่มทุกปุ่มกดไม่ได้และจางลง ผู้ใช้เห็นทันทีว่าระบบกำลังทำงาน
     ตัวนับปลดเมื่อคำสั่งจบเสมอ ทั้งสำเร็จ ล้มเหลว หมดเวลา และแม้ผู้ใช้เปลี่ยนหน้าไปแล้ว
     จึงไม่มีทางค้าง Disabled ถาวร */
  var SB_BUSY = 0;
  function sbBusy(delta) {
    SB_BUSY += delta;
    if (SB_BUSY < 0) SB_BUSY = 0;
    try {
      var b = document.body;
      if (!b) return;
      if (SB_BUSY > 0) b.classList.add('njhr-busy');
      else b.classList.remove('njhr-busy');
    } catch (e) {}
  }
  function sbWriteKey(fn, body) {
    var b = {}, k;
    for (k in body) { if (body.hasOwnProperty(k) && k !== 'p_token') b[k] = body[k]; }
    try { return fn + '|' + JSON.stringify(b); } catch (e) { return ''; }
  }
  /* รวม request อ่านที่ซ้ำกันและยังค้างอยู่ให้ใช้ผลเดียวกัน (In-flight Read Sharing)
     - ใช้เฉพาะ RPC ที่อ่านข้อมูล · ไม่มีการเก็บผลไว้ใช้ซ้ำหลังจบ จึงไม่มีข้อมูลเก่าค้าง
     - คีย์รวม p_token ด้วย ผู้ใช้คนละสิทธิ์จึงไม่ใช้ผลร่วมกัน (ไม่กระทบ RLS)
     - ล้างทันทีที่ request จบ ไม่ว่าสำเร็จหรือล้มเหลว */
  var SB_READ_INFLIGHT = {};
  /* ทะเบียน request อ่านที่กำลังวิ่ง — ใช้ยกเลิกเมื่อผู้ใช้เปลี่ยนหน้า/ตัวกรอง/ค้นหาใหม่
     ยกเลิกเฉพาะ RPC อ่านของ "เนื้อหาหน้า" เท่านั้น
     - ไม่แตะคำสั่งเขียน เพราะยกเลิกฝั่งเบราว์เซอร์ไม่ได้หยุดงานที่ฐานข้อมูลทำไปแล้ว
     - ไม่แตะ RPC ระดับ Shell/Boot (badge รออนุมัติ · แจ้งเตือน · สถานะระบบ)
       เพราะถูกยิงใหม่ทุกครั้งที่ render ถ้ายกเลิกจะทำให้ badge และ Shell ว่างเปล่า */
  var SB_NO_ABORT = {
    'njhr_healthcheck': 1, 'njhr_session_check': 1, 'njhr_leave_queue': 1,
    'njhr_notify_unread': 1, 'njhr_notify_list': 1, 'njhr_ann_feed': 1,
    'njhr_event_list': 1, 'njhr_holiday_list': 1
  };
  var SB_ABORTERS = [];
  function sbAbortReads() {
    var list = SB_ABORTERS, i;
    SB_ABORTERS = [];
    for (i = 0; i < list.length; i++) {
      try { list[i].abort(); } catch (e) {}
    }
    return list.length;
  }
  function sbCall(fn, body) {
    if (!sbReady()) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'));
    var isWrite = sbIsWriteRpc(fn), lockKey = '';
    if (isWrite) {
      lockKey = sbWriteKey(fn, body || {});
      if (lockKey && SB_INFLIGHT[lockKey]) {
        try { console.error('[RPC ' + fn + '] ถูกปฏิเสธ: คำสั่งเดิมยังทำงานไม่เสร็จ'); } catch (e) {}
        return Promise.reject(new Error('กำลังบันทึกรายการนี้อยู่ กรุณารอสักครู่'));
      }
      if (lockKey) SB_INFLIGHT[lockKey] = 1;
      sbBusy(1);
    }
    var canRetry = !isWrite, tried = 0;
    function attempt() {
      tried++;
      var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timedOut = false;
      var timer = setTimeout(function () { timedOut = true; if (ctl) ctl.abort(); }, SB_TIMEOUT_MS);
      if (ctl && !isWrite && SB_NO_ABORT[fn] !== 1) SB_ABORTERS.push(ctl);
      return sbOnce(fn, body, ctl).then(function (j) {
        clearTimeout(timer);
        return j;
      }, function (err) {
        clearTimeout(timer);
        if (err && err.sbServer) throw err;                 // เซิร์ฟเวอร์ปฏิเสธ — ส่งข้อความเดิมออกไป
        // ถูกยกเลิกเพราะผู้ใช้เปลี่ยนหน้า/ค้นหาใหม่ = พฤติกรรมปกติ ไม่ใช่ข้อขัดข้อง
        // คืนค่าว่างแบบเงียบ ไม่โยน error เพราะมี .catch กว่า 100 จุดที่แสดง ex.message ให้ผู้ใช้เห็น
        // ไม่ retry · ไม่เขียน console.error · sbRpcList แปลง null เป็น [] และ sbRpc คืน null
        if (!timedOut && err && err.name === 'AbortError') return null;
        try { console.error('[RPC ' + fn + '] ' + (err && err.message)); } catch (e) {}
        if (canRetry && tried === 1) return attempt();      // อ่านข้อมูล: ลองใหม่ครั้งเดียว
        throw new Error(timedOut
          ? 'เซิร์ฟเวอร์ตอบกลับช้าเกินไป กรุณาลองใหม่อีกครั้ง'
          : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      });
    }
    if (!isWrite) {
      var rk;
      try { rk = fn + '|' + JSON.stringify(body || {}); } catch (e) { rk = ''; }
      if (!rk) return attempt();
      if (SB_READ_INFLIGHT[rk]) return SB_READ_INFLIGHT[rk];
      var pr = attempt();
      SB_READ_INFLIGHT[rk] = pr;
      pr.then(function () { delete SB_READ_INFLIGHT[rk]; },
              function () { delete SB_READ_INFLIGHT[rk]; });
      return pr;
    }
    return attempt().then(function (v) {
      if (lockKey) delete SB_INFLIGHT[lockKey];
      sbBusy(-1);
      return v;
    }, function (e) {
      if (lockKey) delete SB_INFLIGHT[lockKey];
      sbBusy(-1);
      throw e;
    });
  }
  function sbRpcList(fn, body) {
    return sbCall(fn, body).then(function (j) { return Array.isArray(j) ? j : (j ? [j] : []); });
  }
  /* ---------- เรียก Edge Function njhr-doc-pdf ----------
     ตัวกลางตัวเดียวของทั้งระบบ — หน้าเอกสาร HR และหน้ารายงาน 50 ทวิ ใช้ร่วมกัน
     ต้องผ่านทางนี้เท่านั้น เพราะ njhr_doc_pdf_access ถูก revoke จาก anon/authenticated
     (I2_finalpdf.sql:534) เรียกตรงจากหน้าเว็บไม่ได้ และ RPC นี้คืน storage_path
     ไม่ใช่ URL — ตัว Edge Function เป็นผู้ออก Signed URL ด้วย service_role */
  function sbDocPdfFn(body) {
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

  function sbRpc(fn, body) {
    return sbCall(fn, body).then(function (j) { return Array.isArray(j) ? j[0] : j; });
  }
  // เก็บเฉพาะ token — role/employee_id ไม่ใช้ค่าที่อยู่ในเครื่องเป็นหลักฐานสิทธิ์
  function sbToken() { try { return localStorage.getItem('njhr_token') || ''; } catch (e) { return ''; } }
  function sbSetToken(t) { try { t ? localStorage.setItem('njhr_token', t) : localStorage.removeItem('njhr_token'); } catch (e) {} }
  // (1)(2)(3)(5) ตรวจ session กับเซิร์ฟเวอร์: คืนค่า user จาก server เท่านั้น
  function sbSessionCheck() {
    var t = sbToken();
    if (!t) return Promise.reject(new Error('NO_SESSION'));
    return sbRpc('njhr_session_check', { p_token: t }).then(function (row) {
      if (!row || !row.user_id) throw new Error('เซสชันไม่ถูกต้อง');
      if (!row.employee_id) throw new Error('บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ');
      sbUser = Object.assign({}, sbUser || {}, row);
      sbSaveUser();
      session = { userId: row.user_id, at: nowStamp(), src: 'supabase' };
      saveSession();
      return row;
    });
  }
  /* เข้าสู่ระบบ
     - ส่ง p_remember เป็น boolean เท่านั้น · Frontend ไม่กำหนดวันหมดอายุเอง
       เซิร์ฟเวอร์เป็นผู้คำนวณ expires_at (12 ชั่วโมง หรือ 30 วัน)
     - ถ้า SQL ฝั่งเซิร์ฟเวอร์ยังไม่ได้ติดตั้ง p_remember PostgREST จะตอบ 404
       จึงลองใหม่โดยไม่ส่ง p_remember เพื่อไม่ให้ผู้ใช้ทั้งระบบ Login ไม่ได้ระหว่างช่วง Deploy
       เมื่อติดตั้ง SQL ครบแล้ว เส้นทาง fallback นี้จะไม่ถูกใช้อีก */
  function sbLoginCall(body) {
    return fetch(SB.url + '/rest/v1/rpc/njhr_login', {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  function sbLoginParse(r) {
    return r.json().then(function (j) {
      if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'เข้าสู่ระบบไม่สำเร็จ');
      var row = Array.isArray(j) ? j[0] : j;
      if (!row || !row.user_id) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return row;
    });
  }
  function sbLogin(username, password, remember) {
    if (!sbReady()) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase (NJHR_SUPABASE_URL / ANON_KEY)'));
    var base = { p_username: username, p_password: password, p_ua: (navigator.userAgent || '').slice(0, 200) };
    var withRemember = { p_username: base.p_username, p_password: base.p_password, p_ua: base.p_ua,
                         p_remember: remember === true };
    return sbLoginCall(withRemember).then(function (r) {
      if (r.status === 404) return sbLoginCall(base).then(sbLoginParse);   // เซิร์ฟเวอร์ยังไม่รองรับ
      return sbLoginParse(r);
    });
  }

  /* ---------- เข้าสู่ระบบด้วยใบหน้า (มือถือ) ----------
     ใช้ตัวแปลผลลัพธ์ตัวเดียวกับรหัสผ่าน เพราะ njhr_face_login คืนคอลัมน์ชุดเดียวกับ njhr_login
     ⚠ ไม่แตะ sbLogin — เข้าด้วยรหัสผ่านยังทำงานเหมือนเดิมทุกประการ (ระบบสำรอง)
     ⚠ ไม่ส่ง GPS และไม่อ่านตำแหน่งใด ๆ — ตำแหน่งใช้เฉพาะการลงเวลาเท่านั้น */
  function sbFaceLoginKey() {
    /* คีย์อุปกรณ์สำหรับจำกัดจำนวนครั้งที่สแกนผิด — ไม่ใช่ความลับและไม่ใช่ข้อมูลชีวมาตร */
    var k = '';
    try { k = localStorage.getItem('njhr_dev_key') || ''; } catch (e) {}
    if (!k) {
      k = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem('njhr_dev_key', k); } catch (e) {}
    }
    return k;
  }
  function sbFaceLogin(descriptor, livenessMethod) {
    if (!sbReady()) return Promise.reject(new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'));
    return fetch(SB.url + '/rest/v1/rpc/njhr_face_login', {
      method: 'POST',
      headers: { 'apikey': SB.key, 'Authorization': 'Bearer ' + SB.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_descriptor: descriptor, p_faces_found: 1,
        p_liveness: true, p_liveness_method: livenessMethod || 'PASSIVE',
        p_device_key: sbFaceLoginKey(),
        p_ua: (navigator.userAgent || '').slice(0, 200)
      })
    }).then(sbLoginParse)['catch'](function (e) {
      /* ⚠ เก็บข้อความจริงไว้ใน Console เสมอ — face.js เป็นผู้แปลงเป็นข้อความที่ผู้ใช้อ่านได้
         ห้ามกลบจนตรวจปัญหาไม่ได้ (เช่น schema cache / signature ไม่ตรง) */
      try { console.error('[FACE LOGIN RPC] njhr_face_login ล้มเหลว:', e); } catch (e2) {}
      throw e;
    });
  }

  window.NJHR_faceLogin = function (descriptor, method) {
    return sbFaceLogin(descriptor, method);
  };

  /* ================= SUPABASE LEAVE DATA LAYER =================
     ประเภทการลายึด enum `leave_type` ของ Supabase (7 ค่า) เป็นแหล่งจริง
     โควตาอ่านจาก employees.leave_sick / leave_personal / leave_vacation ผ่าน RPC
     ตาราง leave_types จริงไม่มีคอลัมน์ color/quota/needDoc → เก็บเฉพาะ label/สี/กฎแนบเอกสารไว้ที่นี่
     ไม่มี fallback ไป db.* หรือ localStorage เมื่อ Supabase error */
  // รูปแบบการลาเดิม (FULL/HALF_AM/HALF_PM/HOURLY) เก็บใน approvals[0].meta.mode

  // อัปโหลดไฟล์แนบเข้า bucket leave-attachments แล้วคืน URL จริงให้ RPC บันทึกลง leave_attachments
  /* อัปโหลดไฟล์แนบขึ้น Supabase Storage — ใช้ร่วมกันทั้งใบลาและ OT
     เก็บเฉพาะ URL ไว้ในระบบ ไม่เก็บ base64 (base64 ทำให้ localStorage เต็มแล้วข้อมูลหาย) */

  // จำนวนใบลาที่รออนุมัติ (นับจากเซิร์ฟเวอร์) — ใช้กับ Badge เมนู
  var _lvPending = 0, _otPending = 0, _fxPending = 0;

  /* รีเฟรชตัวเลขรออนุมัติของ OT และลงชื่อย้อนหลังจาก Supabase
     ใช้ p_limit = 1 แล้วอ่าน total_count จึงไม่ดึงข้อมูลทั้งคิวมาเพียงเพื่อจะนับ
     เรียกจากจุดที่สถานะเปลี่ยนจริงเท่านั้น — ไม่มีการเรียกจาก render */
  function refreshOtPending() {
    var u = currentUser();
    if (!u || ['SUPER_ADMIN', 'ADMIN'].indexOf(u.role) < 0 || !sbToken()) return;
    sbRpcList('njhr_ot_list', { p_token: sbToken(), p_from: null, p_to: null,
      p_status: 'PENDING', p_dept: null, p_employee: null, p_q: null,
      p_mine: false, p_limit: 1, p_offset: 0 })
      .then(function (rows) {
        _otPending = rows.length ? Number(rows[0].total_count) : 0;
        refreshMenuBadge();
      })['catch'](function () { /* ไม่แตะ Badge เดิมเมื่อโหลดไม่สำเร็จ */ });
  }

  function refreshFixPending() {
    var u = currentUser();
    if (!u || !sbToken()) return;
    sbRpcList('njhr_att_correction_list', { p_token: sbToken(), p_employee: null,
      p_status: 'PENDING', p_from: null, p_to: null, p_limit: 1, p_offset: 0,
      p_mine_queue: true })
      .then(function (rows) {
        _fxPending = rows.length ? Number(rows[0].total_count) : 0;
        refreshMenuBadge();
      })['catch'](function () { /* ไม่แตะ Badge เดิมเมื่อโหลดไม่สำเร็จ */ });
  }

  /* ให้ chunk อื่นตั้งค่าตัวนับได้โดยตรงเมื่อโหลดคิวมาแล้ว (ไม่ต้องยิง RPC ซ้ำ) */
  function setOtPending(n) { _otPending = Number(n) || 0; refreshMenuBadge(); }
  function setFxPending(n) { _fxPending = Number(n) || 0; refreshMenuBadge(); }

  /* รีเฟรชครบทั้งสามประเภทในครั้งเดียว — ใช้ที่ Login และหลังทำรายการ */
  function refreshPendingAll() {
    refreshLeavePending();
    refreshOtPending();
    refreshFixPending();
  }

  function refreshLeavePending() {
    var u = currentUser();
    if (!u || ['SUPER_ADMIN', 'ADMIN'].indexOf(u.role) < 0 || !sbToken()) return;
    sbRpcList('njhr_leave_queue', { p_token: sbToken(), p_limit: 1, p_offset: 0 })
      .then(function (rows) {
        _lvPending = rows.length ? Number(rows[0].total_count) : 0;
        refreshMenuBadge();
      }).catch(function () { /* ไม่แตะ Badge เดิมเมื่อโหลดไม่สำเร็จ */ });
  }

  /* ---------- Hydrate db.settings หลัง Login (Cache Compatibility) ----------
     แหล่งจริงคือ system_settings ผ่าน njhr_setting_list
     db.settings ถูกคงไว้เป็น "สำเนาสำหรับหน้าที่ยังอ่านของเดิม" เท่านั้น
       สลิปเงินเดือน · เทมเพลตนำเข้าพนักงาน · ทะเบียนเอกสาร HR ยังอ่าน db.settings.companyName

     Key จริงจาก 78_system_settings.sql (ไม่ได้ตั้งชื่อเอง)
       company_name       → db.settings.companyName
       work_start_time    → db.settings.workStart
       late_grace_minutes → db.settings.lateGrace

     ยิงครั้งเดียวตอน Login สำเร็จ · ล้มเหลว = คงค่าเดิมในเครื่องไว้ ไม่ทำให้หน้าใดพัง
     คีย์ geofence* ไม่อยู่ในชุดนี้ — RPC ปฏิเสธคีย์นั้นโดยตรง โหมด GPS จึงคงพฤติกรรมเดิม */
  function hydrateSettings() {
    if (!sbReady() || !sbToken()) return;
    sbRpcList('njhr_setting_list', { p_token: sbToken(), p_category: null })
      .then(function (rows) {
        var map = {};
        (rows || []).forEach(function (r) { map[r.key] = r.value; });
        var changed = false;
        if (map.company_name != null) { db.settings.companyName = String(map.company_name); changed = true; }
        if (map.work_start_time != null) { db.settings.workStart = String(map.work_start_time); changed = true; }
        if (map.late_grace_minutes != null) { db.settings.lateGrace = parseInt(map.late_grace_minutes, 10) || 0; changed = true; }
        if (changed) saveDB();
      })['catch'](function (er) {
        try { console.error('[SETTINGS] hydrate จาก njhr_setting_list ล้มเหลว:', er); } catch (e) {}
      });
  }

  function renderLogin() {
    var app = document.getElementById('app');
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
      '<div class="login-brand"><span class="brand-badge big">NJ</span><h1>NJ LOGISTIC</h1><p>HR SYSTEM</p></div>' +
      '<form id="login-form" novalidate>' +
      '<label class="field"><span>ชื่อผู้ใช้</span><input type="text" id="lg-user" autocomplete="username" placeholder="เช่น admin" required></label>' +
      '<label class="field"><span>รหัสผ่าน</span><span class="pw-wrap"><input type="password" id="lg-pass" autocomplete="current-password" placeholder="รหัสผ่าน" required>' +
      '<button type="button" class="btn-icon pw-toggle" id="lg-eye" aria-label="แสดงรหัสผ่าน">' + icon('eye') + '</button></span></label>' +
      '<label class="check"><input type="checkbox" id="lg-remember"><span>จดจำการเข้าสู่ระบบ 30 วัน</span></label>' +
      '<div class="form-error" id="lg-error" role="alert"></div>' +
      '<button class="btn btn-primary btn-block btn-lg" id="lg-btn" type="submit">' + icon('login') + ' เข้าสู่ระบบ</button>' +
      '</form>' +
      '<div class="login-links">' +
      '<button type="button" class="btn btn-dark btn-block only-mobile lg-face-btn" id="lg-face">' +
      icon('camera') + ' สแกนใบหน้าเข้าสู่ระบบ</button>' +
      '<button type="button" class="btn btn-ghost btn-block" id="lg-activate">สมัครสมาชิกครั้งแรก</button>' +
      '</div>' +
      '</div></div>';

    var eyeOn = false;
    if (sbLoginMsg) {
      var lgErr = document.getElementById('lg-error');
      if (lgErr) lgErr.textContent = sbLoginMsg;
      sbLoginMsg = '';
    }
    document.getElementById('lg-eye').onclick = function () {
      eyeOn = !eyeOn;
      document.getElementById('lg-pass').type = eyeOn ? 'text' : 'password';
      this.innerHTML = icon(eyeOn ? 'eyeOff' : 'eye');
    };
    document.getElementById('login-form').onsubmit = function (ev) {
      ev.preventDefault();
      var uEl = document.getElementById('lg-user'), pEl = document.getElementById('lg-pass');
      var err = document.getElementById('lg-error'), btn = document.getElementById('lg-btn');
      err.textContent = '';
      var uname = uEl.value.trim(), pass = pEl.value;
      if (!uname || !pass) { err.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'; return; }
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังตรวจสอบ…';
      // ตรวจ USER จริงจาก Supabase (app_users · app_code='salary') ผ่าน RPC ฝั่งเซิร์ฟเวอร์
      // ไม่มี password/hash ส่งกลับมาที่ browser · ไม่ใช้ USER ใน mock-data.js
      function loginFail(msg) {
        btn.disabled = false; btn.innerHTML = icon('login') + ' เข้าสู่ระบบ';
        err.textContent = msg;
        db.audit.unshift({ at: nowStamp(), by: uname, action: 'LOGIN_FAILED', detail: msg }); saveDB();
      }
      var rmEl = document.getElementById('lg-remember');
      var remember = !!(rmEl && rmEl.checked);
      sbLogin(uname, pass, remember).then(function (u) {
        // สร้าง session จากผลฝั่งเซิร์ฟเวอร์เท่านั้น (role/employee_id ไม่รับจากฝั่ง browser)
        if (u.session_token) sbSetToken(u.session_token);   // token จากเซิร์ฟเวอร์เท่านั้น
        session = { userId: u.user_id, at: nowStamp(), src: 'supabase' };
        sbUser = u;
        saveSession(); sbSaveUser();
        audit('LOGIN', 'เข้าสู่ระบบสำเร็จ (Supabase · ' + u.role + ')');
        toast('ยินดีต้อนรับ ' + (u.emp_name || u.username));
        nav('#/dashboard');
        refreshPendingAll();
        refreshNotifyBadge();
        hydrateSettings();
      }).catch(function (e) { loginFail(e.message || 'เข้าสู่ระบบไม่สำเร็จ'); });
    };
    document.getElementById('lg-activate').onclick = function () { actOpenForm(); };

    /* ---------- สแกนใบหน้าเข้าสู่ระบบ (มือถือ) ----------
       ⚠ ไม่ขอ GPS · ไม่สร้าง Attendance · เข้า Dashboard เท่านั้น
       ใช้เส้นทางสร้าง session เดียวกับรหัสผ่านทุกบรรทัด (sbSetToken → session → nav)
       รหัสผ่านยังใช้ได้ตลอดเป็นระบบสำรอง — ปุ่มนี้เป็นทางเลือกเพิ่ม ไม่ได้แทนที่ */
    var faceBtn = document.getElementById('lg-face');
    if (faceBtn) faceBtn.onclick = function () {
      var err = document.getElementById('lg-error');
      if (err) err.textContent = '';
      faceBtn.disabled = true;
      faceBtn.innerHTML = '<span class="spinner"></span> กำลังเตรียมกล้อง…';
      function reset() {
        faceBtn.disabled = false;
        faceBtn.innerHTML = icon('camera') + ' สแกนใบหน้าเข้าสู่ระบบ';
      }
      function start() {
        if (!window.NJHRFace || typeof window.NJHRFace.login !== 'function') {
          reset();
          if (err) err.textContent = 'ระบบสแกนใบหน้ายังไม่พร้อมใช้งาน กรุณาเข้าสู่ระบบด้วยรหัสผ่าน';
          return;
        }
        reset();
        window.NJHRFace.login(function (u) {
          if (u.session_token) sbSetToken(u.session_token);
          session = { userId: u.user_id, at: nowStamp(), src: 'supabase' };
          sbUser = u;
          saveSession(); sbSaveUser();
          audit('LOGIN', 'เข้าสู่ระบบด้วยใบหน้าสำเร็จ (Supabase · ' + u.role + ')');
          toast('ยินดีต้อนรับ ' + (u.emp_name || u.username));
          nav('#/dashboard');
          refreshPendingAll();
          refreshNotifyBadge();
          hydrateSettings();
        }, function () { reset(); });
      }
      if (window.NJHRFace) return start();
      /* โหลดโมดูลกล้องเมื่อกดเท่านั้น — ไม่ถ่วงหน้า Login ของทุกคน */
      loadScriptOnce('face', njAsset('face.js'), 'NJHRFace').then(start)['catch'](function () {
        reset();
        if (err) err.textContent = 'โหลดระบบสแกนใบหน้าไม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่าน';
      });
    };
    document.getElementById('lg-user').focus();
  }

  /* ===== สมัครสมาชิกครั้งแรก =====
     พนักงานกรอก 9 ช่อง: รหัสพนักงาน · ชื่อ/นามสกุลไทย · ชื่อ/นามสกุลอังกฤษ ·
                        ชื่อเล่น · อีเมล · รหัสผ่าน · ยืนยันรหัสผ่าน
     ตัวจับคู่คือ emp_code + last_name_en (นามสกุลภาษาอังกฤษ) เท่านั้น
       · CASE A — employees.last_name_en มีค่า → ต้องตรงเป๊ะหลัง UPPER+TRIM
       · CASE B — employees.last_name_en ว่าง  → รับค่าที่กรอก รอ SUPER_ADMIN ตรวจตอนเชื่อม
     ไม่ใช้นามสกุลไทย · ไม่ใช้ชื่อเล่น · ไม่ใช้ Username · ไม่มี fallback · ไม่มี fuzzy
     SQL ตรวจซ้ำทุกข้อใน njhr_activation_submit — ฝั่งหน้าจอไม่ใช่ด่านความปลอดภัย
     ช่องที่ 5 = ข้อความช่วยใต้ชื่อช่อง · ช่องที่ 6 = true คือบังคับเป็นตัวพิมพ์ใหญ่ */
  var ACT_F = [
    ['act-code',  'รหัสพนักงาน',            'text',     'กรุณากรอกรหัสพนักงาน', 'กรอกให้ตรงกับข้อมูลพนักงานในระบบ'],
    ['act-fnm',   'ชื่อ (ภาษาไทย)',          'text',     'กรุณากรอกชื่อภาษาไทย'],
    ['act-lnm',   'นามสกุล (ภาษาไทย)',       'text',     'กรุณากรอกนามสกุลภาษาไทย'],
    ['act-fen',   'First Name (ภาษาอังกฤษ)', 'text',     'กรุณากรอกชื่อภาษาอังกฤษ', null, true],
    ['act-len',   'Last Name (ภาษาอังกฤษ)',  'text',     'กรุณากรอกนามสกุลภาษาอังกฤษ', 'ใช้ยืนยันตัวตนคู่กับรหัสพนักงาน', true],
    ['act-nick',  'ชื่อเล่น',                'text',     'กรุณากรอกชื่อเล่น'],
    ['act-mail',  'อีเมล',                  'email',    'กรุณากรอกอีเมล'],
    ['act-pw',    'รหัสผ่านใหม่',            'password', 'กรุณากรอกรหัสผ่าน'],
    ['act-pw2',   'ยืนยันรหัสผ่านใหม่',      'password', 'กรุณายืนยันรหัสผ่าน']
  ];

  function actField(f) {
    var isPw = f[2] === 'password';
    return '<label class="field"><span>' + f[1] + ' <i class="req">*</i>' +
      (f[4] ? ' <small class="muted">(' + f[4] + ')</small>' : '') + '</span>' +
      (isPw
        ? '<span class="pw-wrap"><input type="password" id="' + f[0] + '" autocomplete="new-password">' +
          '<button type="button" class="btn-icon pw-toggle" data-eye="' + f[0] + '" ' +
          'aria-label="แสดงรหัสผ่าน">' + icon('eye') + '</button></span>'
        : '<input type="' + f[2] + '" id="' + f[0] + '" autocomplete="off"' +
          (f[5] ? ' style="text-transform:uppercase"' : '') + '>') +
      '<small class="field-err" id="' + f[0] + '-err"></small></label>';
  }

  function actSetErr(id, msg) {
    var b = document.getElementById(id + '-err');
    if (b) b.textContent = msg || '';
    var i = document.getElementById(id);
    if (i) i.classList.toggle('inv', !!msg);
  }

  /* ตรวจทีละช่อง — คืนข้อความผิดพลาด หรือ '' เมื่อผ่าน
     เงื่อนไขรหัสผ่านตรงกับที่ SQL ตรวจซ้ำอีกชั้นใน njhr_activation_submit */
  function actCheck(id) {
    var v = String((document.getElementById(id) || {}).value || '').trim();
    var f = ACT_F.filter(function (x) { return x[0] === id; })[0];
    if (!v) return f ? f[3] : 'กรุณากรอกข้อมูล';
    if (id === 'act-mail' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return 'รูปแบบอีเมลไม่ถูกต้อง';
    if (id === 'act-pw') {
      if (v.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัว';
      if (!/[a-z]/.test(v)) return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว';
      if (!/[A-Z]/.test(v)) return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว';
      if (!/[0-9]/.test(v)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
      var code = String((document.getElementById('act-code') || {}).value || '').trim();
      if (code && v.toLowerCase() === code.toLowerCase()) return 'ห้ามใช้รหัสพนักงานเป็นรหัสผ่าน';
    }
    if (id === 'act-pw2') {
      var p1 = String((document.getElementById('act-pw') || {}).value || '');
      if (v !== p1) return 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
    }
    return '';
  }

  function actOpenForm() {
    openModal('สมัครสมาชิกครั้งแรก',
      '<p class="muted" style="margin-top:0">สำหรับพนักงานที่มีข้อมูลในระบบแล้วแต่ยังไม่มีบัญชี · ' +
      'ระบบยืนยันตัวตนด้วย <b>รหัสพนักงาน + นามสกุลภาษาอังกฤษ</b> · ' +
      'หลังส่งคำขอ ผู้ดูแลระบบสูงสุดจะตรวจสอบและเชื่อมบัญชีให้</p>' +
      '<form id="act-f" novalidate>' + ACT_F.map(actField).join('') +
      '<div class="form-error" id="act-err" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="act-back">กลับหน้าเข้าสู่ระบบ</button>' +
      '<button class="btn btn-primary" id="act-go">สมัครสมาชิก</button>',
      { wide: true, fullMobile: true });

    document.getElementById('act-back').onclick = closeModal;

    // รูปตาแยกกันของแต่ละช่องรหัสผ่าน
    document.querySelectorAll('[data-eye]').forEach(function (b) {
      b.onclick = function () {
        var inp = document.getElementById(this.dataset.eye);
        if (!inp) return;
        var on = inp.type === 'password';
        inp.type = on ? 'text' : 'password';
        this.innerHTML = icon(on ? 'eyeOff' : 'eye');
      };
    });

    // ข้อความผิดพลาดหายทันทีเมื่อแก้ถูก
    ACT_F.forEach(function (f) {
      var inp = document.getElementById(f[0]);
      if (!inp) return;
      inp.oninput = function () { actSetErr(f[0], ''); };
      inp.onblur = function () { actSetErr(f[0], actCheck(f[0])); };
    });

    document.getElementById('act-go').onclick = function () {
      var btn = this, err = document.getElementById('act-err');
      err.textContent = '';
      var bad = 0;
      ACT_F.forEach(function (f) {
        var m = actCheck(f[0]);
        actSetErr(f[0], m);
        if (m) bad++;
      });
      if (bad) { err.textContent = 'กรุณาแก้ไขข้อมูลที่ยังไม่ถูกต้อง'; return; }

      function val(id) { return String(document.getElementById(id).value).trim(); }
      withButtonLoading(btn, 'กำลังตรวจสอบ…', function () {
        /* ชื่อภาษาอังกฤษส่งเป็นตัวพิมพ์ใหญ่ — SQL Normalize ซ้ำด้วย UPPER(TRIM())
           จึงไม่พึ่งฝั่งหน้าจอเพียงอย่างเดียว */
        function valEn(id) { return val(id).toUpperCase(); }
        return sbRpc('njhr_activation_submit', {
          p_emp_code:      val('act-code'),
          p_first_name:    val('act-fnm'),
          p_last_name:     val('act-lnm'),
          p_first_name_en: valEn('act-fen'),
          p_last_name_en:  valEn('act-len'),
          p_nickname:      val('act-nick'),
          p_email:         val('act-mail'),
          p_password:      document.getElementById('act-pw').value
        }).then(function (r) {
          if (r && r.ok) { closeModal(); toast(r.message, 'success'); return; }
          err.textContent = (r && r.message) || 'ไม่สามารถสมัครสมาชิกได้';
        });
      })['catch'](function (e) {
        err.textContent = (e && e.message) || 'ไม่สามารถสมัครสมาชิกได้';
      });
    };
  }
  function doLogout(silent) {
    var t = sbToken();
    try { sbAbortReads(); } catch (e) {}   // ยกเลิกคำสั่งอ่านค้างของ session เดิม
    if (t && sbReady()) { sbRpc('njhr_logout', { p_token: t }).catch(function () {}); }  // เพิกถอนฝั่งเซิร์ฟเวอร์
    sbSetToken('');
    sbClearUser();
    _lvPending = 0; _otPending = 0; _fxPending = 0; _ntUnread = 0;
    try { NJHR.notify.reset(); } catch (e) {}   // หยุด Polling + ล้างป้ายแดงทุกจุด
    try { njExemptReset(); } catch (e) {}       // ล้างผลตรวจกลุ่มยกเว้นของบัญชีเดิม
    if (session) audit('LOGOUT', 'ออกจากระบบ');
    session = null; saveSession();
    if (location.hash === '#/login') renderLogin();
    else location.hash = '#/login'; // hashchange จะ render หน้า Login เอง
    if (!silent) toast('ออกจากระบบแล้ว', 'info');
  }

