  /* ================= VIEW: ANNOUNCEMENTS =================
     ข้อมูลจริงจากตาราง company_announcements ผ่าน RPC เดิม (77_announcements.sql)
       list        njhr_announcement_list
       detail      njhr_announcement_get
       create/edit njhr_announcement_save   (มี Audit + Notification เมื่อ p_notify=true)
       ปิดใช้งาน   njhr_announcement_set_active (มี Audit)
     ไม่อ่านและไม่เขียน db.announcements อีกต่อไป · ไม่สร้าง audit()/notify() ซ้ำที่ Frontend
     โครง DOM · คลาส · ปุ่ม · ข้อความ เหมือนเดิมทุกบรรทัด

     "ปักหมุด" ของหน้าจอผูกกับคอลัมน์ priority ของฐานข้อมูล
       ติ๊กปักหมุด = HIGH · ไม่ติ๊ก = NORMAL · แสดงหมุดเมื่อ priority เป็น HIGH หรือ URGENT
     (company_announcements ไม่มีคอลัมน์ pinned — priority เป็นฟิลด์เดียวที่ใช้จัดลำดับ
      และ njhr_announcement_list เรียง URGENT/HIGH ขึ้นก่อนอยู่แล้ว ตรงกับพฤติกรรมเดิม) ================= */
  var anRows = [], anSeq = 0;

  function anPinned(a) { return ['HIGH', 'URGENT'].indexOf(String(a.priority || '').toUpperCase()) >= 0; }
  function anDate(a) { return String(a.publish_at || a.created_at || '').slice(0, 10); }

  function viewAnnouncements(el) {
    var u = currentUser();
    var canManage = ['SUPER_ADMIN', 'ADMIN'].indexOf(u.role) >= 0;
    var seq = ++anSeq;

    function paint(list, err) {
      el.innerHTML =
        '<div class="toolbar"><h3>ประกาศบริษัท</h3><span class="grow"></span>' +
        (canManage ? '<button class="btn btn-primary" id="an-add">' + icon('plus') + ' เพิ่มประกาศ</button>' : '') + '</div>' +
        '<div class="req-list">' + (err
          ? '<div class="card"><div class="form-error" role="alert">' + esc(err) + '</div></div>'
          : (list === null
            ? '<div class="card"><small class="muted">กำลังโหลดข้อมูลจาก Supabase…</small></div>'
            : (list.length ? list.map(function (a) {
                return '<div class="card req-card' + (!a.is_active ? ' inactive-card' : '') + '">' +
                  '<div class="req-top"><div class="grow"><b>' + (anPinned(a) ? icon('pin', 'ic-sm ic-red') + ' ' : '') + esc(a.title) + '</b>' +
                  '<small>' + fmtDate(anDate(a)) + ' · ' + esc(a.created_by) + (!a.is_active ? ' · ปิดใช้งานแล้ว' : '') + '</small></div></div>' +
                  '<div class="req-actions"><button class="btn btn-ghost btn-sm" data-an-view="' + esc(a.id) + '">อ่านประกาศ</button>' +
                  (canManage ? '<button class="btn btn-ghost btn-sm" data-an-edit="' + esc(a.id) + '">แก้ไข</button>' +
                    (a.is_active ? '<button class="btn btn-ghost btn-sm t-red" data-an-off="' + esc(a.id) + '">ปิดใช้งาน</button>' : '') : '') + '</div></div>';
              }).join('') : '<div class="card">' + emptyState('ยังไม่มีประกาศ') + '</div>'))) + '</div>';

      var addBtn = document.getElementById('an-add');
      if (addBtn) addBtn.onclick = function () { anForm(null, el); };
      el.querySelectorAll('[data-an-view]').forEach(function (b) {
        b.onclick = function () { anView(b.dataset.anView); };
      });
      el.querySelectorAll('[data-an-edit]').forEach(function (b) { b.onclick = function () { anForm(b.dataset.anEdit, el); }; });
      el.querySelectorAll('[data-an-off]').forEach(function (b) {
        b.onclick = function () {
          confirmDialog('ปิดใช้งานประกาศ', 'ปิดประกาศนี้ไม่ให้พนักงานเห็นใช่หรือไม่', 'ปิดใช้งาน', function () {
            // njhr_announcement_set_active เขียน Audit เองแล้ว จึงไม่เรียก audit() ซ้ำ
            return sbRpc('njhr_announcement_set_active', {
              p_token: sbToken(), p_id: b.dataset.anOff, p_active: false
            }).then(function () {
              closeModal(); toast('ปิดใช้งานประกาศแล้ว', 'info'); viewAnnouncements(el);
            }).catch(function (er) {
              closeModal();
              console.error('[ANNOUNCE] njhr_announcement_set_active ล้มเหลว:', er);
              toast((er && er.message) || 'ปิดใช้งานประกาศไม่สำเร็จ', 'error');
            });
          }, true);
        };
      });
    }

    paint(null, '');
    if (!sbReady() || !sbToken()) { paint([], 'ยังไม่ได้เชื่อมต่อ Supabase — โหลดประกาศไม่ได้'); return; }
    sbRpcList('njhr_announcement_list', { p_token: sbToken(), p_q: null, p_limit: 100, p_offset: 0 })
      .then(function (rows) {
        if (seq !== anSeq) return;
        anRows = rows || [];
        paint(anRows, '');
      }).catch(function (er) {
        if (seq !== anSeq) return;
        console.error('[ANNOUNCE] njhr_announcement_list ล้มเหลว:', er);
        paint([], 'โหลดประกาศจาก Supabase ไม่สำเร็จ: ' + ((er && er.message) || er));
      });
  }

  function anView(id) {
    openModal('ประกาศบริษัท', '<div class="muted"><span class="spinner"></span> กำลังโหลด…</div>',
      '<button class="btn btn-ghost" id="an-close">ปิด</button>');
    var cb = document.getElementById('an-close');
    if (cb) cb.onclick = closeModal;
    sbRpc('njhr_announcement_get', { p_token: sbToken(), p_id: id }).then(function (r) {
      var a = (r && r.data) ? r.data : r;
      var body = document.querySelector('#modal-root .modal-body');
      if (!body || !a) return;
      var h = document.querySelector('#modal-root .modal-head h3');
      if (h) h.textContent = a.title || 'ประกาศบริษัท';
      body.innerHTML = '<p class="an-body">' + esc(a.content || '') + '</p>' +
        '<small class="muted">' + fmtDate(anDate(a)) + ' · ' + esc(a.created_by || '') + '</small>';
    }).catch(function (er) {
      var body = document.querySelector('#modal-root .modal-body');
      console.error('[ANNOUNCE] njhr_announcement_get ล้มเหลว:', er);
      if (body) body.innerHTML = '<div class="form-error">' + esc((er && er.message) || 'โหลดประกาศไม่สำเร็จ') + '</div>';
    });
  }

  function anForm(id, listEl) {
    var a = id ? anRows.find(function (x) { return String(x.id) === String(id); }) : null;
    openModal(a ? 'แก้ไขประกาศ' : 'เพิ่มประกาศ',
      '<form id="an-f" novalidate>' +
      '<label class="field"><span>หัวข้อ <i class="req">*</i></span><input name="title" value="' + esc(a ? a.title : '') + '"></label>' +
      '<label class="field"><span>เนื้อหา <i class="req">*</i></span><textarea name="body" rows="5">' + esc(a ? (a.content || '') : '') + '</textarea></label>' +
      '<label class="check"><input type="checkbox" name="pinned" ' + (a && anPinned(a) ? 'checked' : '') + '><span>ปักหมุดประกาศนี้</span></label>' +
      '<div class="form-error" id="an-err" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="anf-cancel">ยกเลิก</button><button class="btn btn-primary" id="anf-save">' + (a ? 'บันทึกการแก้ไข' : 'เผยแพร่ประกาศ') + '</button>');
    document.getElementById('anf-cancel').onclick = closeModal;
    document.getElementById('anf-save').onclick = function () {
      var fm = document.getElementById('an-f'), btn = this;
      /* ใช้ fm.elements — ชื่อฟิลด์ "title"/"body" ชนกับ property ของ HTMLElement
         การอ้าง fm.title ตรง ๆ จะได้ค่า attribute title (string) ไม่ใช่ช่องกรอก */
      var title = fm.elements.title.value.trim(), body = fm.elements.body.value.trim();
      if (!title || !body) { document.getElementById('an-err').textContent = 'กรุณากรอกหัวข้อและเนื้อหา'; return; }
      if (btn.disabled) return;
      var label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      /* p_notify=true เฉพาะตอนสร้างใหม่ — ให้พฤติกรรมตรงกับของเดิมที่แจ้งเตือนเมื่อเพิ่มประกาศเท่านั้น
         RPC เป็นผู้สร้าง Notification และ Audit จึงไม่เรียก notify()/audit() ซ้ำที่ Frontend
         ตอนแก้ไขต้องส่ง p_publish_at เดิมกลับไปด้วย มิฉะนั้น RPC จะตั้งวันเผยแพร่เป็นเวลาปัจจุบัน */
      sbRpc('njhr_announcement_save', {
        p_token: sbToken(),
        p_id: a ? a.id : null,
        p_title: title,
        p_content: body,
        p_priority: fm.elements.pinned.checked ? 'HIGH' : 'NORMAL',
        p_publish_at: a ? (a.publish_at || null) : null,
        p_expire_at: a ? (a.expire_at || null) : null,
        p_notify: !a
      }).then(function () {
        closeModal();
        toast(a ? 'บันทึกประกาศแล้ว' : 'เผยแพร่ประกาศแล้ว');
        viewAnnouncements(listEl);
      }).catch(function (er) {
        console.error('[ANNOUNCE] njhr_announcement_save ล้มเหลว:', er);
        var eb = document.getElementById('an-err');
        if (eb) eb.textContent = (er && er.message) || 'บันทึกประกาศไม่สำเร็จ';
      }).then(function () { btn.disabled = false; btn.innerHTML = label; });
    };
  }

  /* ================= VIEW: USERS ================= */
  // จัดการสมาชิก: อ่าน USER จริงจาก public.app_users (app_code='salary') ผ่าน RPC njhr_list_users
  // เชื่อมชื่อพนักงานด้วย app_users.employee_id = employees.id (ทำฝั่งเซิร์ฟเวอร์)
  var usPage = 0, usTotal = 0, usSeq = 0;
  function usCanEdit() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  var US_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'];   // ระบบ HR ใช้ 3 Role เท่านั้น

  var usState = { q: '', role: '', status: '', dept: '', menu: null };

  /* ===== คำขอเปิดใช้งานบัญชีครั้งแรก (เฉพาะ SUPER_ADMIN) =====
     แสดงรายการสถานะรอเชื่อม พร้อมเปรียบเทียบชื่อเล่นเดิม/ใหม่ และอีเมลเดิม/ใหม่ */
  var actRows = [], actSeq = 0, usListEl = null;

  function actLoadPending() {
    var box = document.getElementById('act-panel');
    if (!box) return;
    if (currentUser().role !== 'SUPER_ADMIN') { box.innerHTML = ''; return; }
    var seq = ++actSeq;
    box.innerHTML = '<div class="card"><div class="muted" style="padding:14px">' +
      '<span class="spinner"></span> กำลังโหลดคำขอเปิดใช้งาน…</div></div>';
    sbRpcList('njhr_activation_list', { p_token: sbToken(), p_status: 'PENDING' })
      .then(function (rows) {
        if (seq !== actSeq) return;
        actRows = rows || [];
        actRenderPending();
      })
      .catch(function (er) {
        if (seq !== actSeq) return;
        var b = document.getElementById('act-panel');
        if (b) b.innerHTML = '<div class="card"><div class="form-error">' +
          esc((er && er.message) || 'โหลดคำขอเปิดใช้งานไม่สำเร็จ') + '</div></div>';
      });
  }

  function actRenderPending() {
    var box = document.getElementById('act-panel');
    if (!box) return;
    if (!actRows.length) { box.innerHTML = ''; return; }
    box.innerHTML =
      '<div class="card" style="margin-top:16px"><div class="card-head">' +
      '<h3>คำขอเปิดใช้งานบัญชี</h3>' +
      '<span class="badge badge-warn">' + actRows.length + ' รายการรอเชื่อม</span></div>' +
      '<div class="list">' + actRows.map(function (r) {
        return '<div class="list-row">' + avatarHTML(r.emp_name || '', 36) +
          '<div class="grow"><b>' + esc(r.emp_name || '—') + '</b>' +
          '<small>' + esc(r.emp_code || '') + ' · ' + esc(r.department_name || '—') +
          ' · ยื่นเมื่อ ' + esc(String(r.requested_at || '').replace('T', ' ').slice(0, 16)) + '</small></div>' +
          '<button class="btn btn-primary btn-sm" data-act-link="' + esc(r.id) + '">เชื่อมกับข้อมูลพนักงาน</button>' +
          '<button class="btn btn-ghost btn-sm t-red" data-act-rej="' + esc(r.id) + '">ไม่อนุมัติ</button>' +
          '</div>';
      }).join('') + '</div></div>';

    box.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act-link],[data-act-rej]') : null;
      if (!b) return;
      if (b.dataset.actLink) actLinkModal(b.dataset.actLink);
      else actRejectModal(b.dataset.actRej);
    };
  }

  function actFind(id) {
    for (var i = 0; i < actRows.length; i++) if (actRows[i].id === id) return actRows[i];
    return null;
  }

  /* เปรียบเทียบค่าเดิมกับค่าใหม่ก่อนยืนยัน — ตามข้อกำหนดขั้นตอนที่ 9 */
  function actLinkModal(id) {
    var r = actFind(id);
    if (!r) return;
    /* ข้อมูลเดิม | ข้อมูลที่สมัคร — ครบ 7 แถวตามข้อกำหนด
       แถวที่ค่าเดิมว่างจะถูกทำเครื่องหมายไว้ชัดเจน */
    function cmp(label, oldV, newV, readOnly) {
      var blank = !String(oldV == null ? '' : oldV).trim();
      return '<div class="act-cmp"><span class="act-cmp-l">' + label + '</span>' +
        '<span class="act-cmp-o' + (blank ? ' t-red' : '') + '">' +
        esc(blank ? '— (ว่าง)' : oldV) + '</span>' +
        '<span class="act-cmp-a">' + (readOnly ? '' : icon('chevR')) + '</span>' +
        '<span class="act-cmp-n">' + esc(newV == null ? '' : newV) +
        (readOnly ? ' <small class="muted">(ไม่เปลี่ยน)</small>' : '') + '</span></div>';
    }
    openModal('เชื่อมกับข้อมูลพนักงาน',
      '<div class="doc-empinfo"><b>' + esc(r.emp_code || '') + ' · ' + esc(r.emp_name || '') + '</b>' +
      '<small>' + esc(r.department_name || '—') + ' · ' + esc(r.position_name || '—') + '</small></div>' +
      (r.last_name_en_was_empty
        ? '<p class="form-error" style="margin-top:10px">ข้อมูลเดิมว่าง — จะเพิ่มข้อมูลใหม่เมื่อกดเชื่อม</p>'
        : '') +
      '<p class="muted note" style="margin-top:10px">เมื่อกดเชื่อม ระบบจะอัปเดต ' +
      '<b>ชื่ออังกฤษ · นามสกุลอังกฤษ · ชื่อเล่น · อีเมล</b> เข้าข้อมูลพนักงาน ' +
      'และบันทึกทั้งค่าเดิมและค่าใหม่ไว้ในประวัติการใช้งาน<br>' +
      'รหัสพนักงาน ชื่อไทย นามสกุลไทย และแผนก ไม่ถูกเปลี่ยน</p>' +
      '<div class="act-cmp act-cmp-head"><span class="act-cmp-l"></span>' +
      '<span class="act-cmp-o"><b>ข้อมูลเดิม</b></span><span class="act-cmp-a"></span>' +
      '<span class="act-cmp-n"><b>ข้อมูลที่สมัคร</b></span></div>' +
      cmp('รหัสพนักงาน', r.emp_code, r.emp_code, true) +
      cmp('ชื่อไทย', r.old_first_name, r.new_first_name, true) +
      cmp('นามสกุลไทย', r.old_last_name, r.new_last_name, true) +
      cmp('ชื่ออังกฤษ', r.old_first_name_en, r.new_first_name_en) +
      cmp('นามสกุลอังกฤษ', r.old_last_name_en, r.new_last_name_en) +
      cmp('ชื่อเล่น', r.old_nickname, r.new_nickname) +
      cmp('อีเมล', r.old_email, r.new_email) +
      /* ไม่มีช่องให้พิมพ์ Username อีกแล้ว — เซิร์ฟเวอร์เป็นผู้หาบัญชีเดิมของพนักงานคนนี้เอง
         ผู้ดูแลจึงเลือกบัญชีผิดคนไม่ได้ และชื่อผู้ใช้หลังเชื่อมเป็นรหัสพนักงานเสมอ */
      '<p class="muted note" style="margin-top:12px">ชื่อผู้ใช้หลังเชื่อมจะเป็น ' +
      '<b>' + esc(r.emp_code || '') + '</b> (รหัสพนักงาน) โดยอัตโนมัติ ' +
      'ระบบจะเลือกบัญชีเดิมของพนักงานรายนี้ให้เอง</p>' +
      '<div class="form-error" id="actl-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="actl-cancel">ยกเลิก</button>' +
      '<button class="btn btn-primary" id="actl-go">ยืนยันเชื่อมบัญชี</button>');

    document.getElementById('actl-cancel').onclick = closeModal;
    document.getElementById('actl-go').onclick = function () {
      var eb = document.getElementById('actl-err');
      eb.textContent = '';
      withButtonLoading(this, 'กำลังเชื่อมบัญชี…', function () {
        /* Signature ของ RPC คงเดิมทุกตัว (p_token · p_request_id · p_username)
           ส่ง p_username = null เสมอ เพื่อให้เซิร์ฟเวอร์ resolve บัญชีเดิมจาก employee เอง */
        return sbRpc('njhr_activation_link', {
          p_token: sbToken(), p_request_id: id, p_username: null
        }).then(function (res) {
          closeModal();
          toast((res && res.message) || 'เชื่อมบัญชีเรียบร้อยแล้ว', 'success');
          actLoadPending();
          viewUsers(usListEl);   // แถวเดิมเปลี่ยนจาก "รอเชื่อม" เป็น "เชื่อมแล้ว" ไม่สร้างแถวซ้ำ
        });
      })['catch'](function (e) {
        eb.textContent = (e && e.message) || 'เชื่อมบัญชีไม่สำเร็จ';
      });
    };
  }

  function actRejectModal(id) {
    var r = actFind(id);
    if (!r) return;
    openModal('ไม่อนุมัติคำขอ',
      '<p class="confirm-msg">ไม่อนุมัติคำขอของ <b>' + esc(r.emp_code || '') + ' · ' +
      esc(r.emp_name || '') + '</b></p>' +
      '<label class="field"><span>เหตุผล <i class="req">*</i></span>' +
      '<textarea id="actr-why" rows="3" placeholder="ระบุเหตุผล"></textarea></label>' +
      '<div class="form-error" id="actr-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="actr-cancel">ยกเลิก</button>' +
      '<button class="btn btn-danger" id="actr-go">ยืนยันไม่อนุมัติ</button>');

    document.getElementById('actr-cancel').onclick = closeModal;
    document.getElementById('actr-go').onclick = function () {
      var eb = document.getElementById('actr-err');
      var why = String(document.getElementById('actr-why').value || '').trim();
      eb.textContent = '';
      if (!why) { eb.textContent = 'กรุณาระบุเหตุผล'; return; }
      withButtonLoading(this, 'กำลังบันทึก…', function () {
        return sbRpc('njhr_activation_reject', {
          p_token: sbToken(), p_request_id: id, p_reason: why
        }).then(function (res) {
          closeModal();
          toast((res && res.message) || 'บันทึกแล้ว', 'info');
          actLoadPending();
          viewUsers(usListEl);
        });
      })['catch'](function (e) {
        eb.textContent = (e && e.message) || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  function viewUsers(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++usSeq, edit = usCanEdit();
    var isSuper = currentUser().role === 'SUPER_ADMIN';
    usListEl = el;
    el.innerHTML =
      '<div class="toolbar us-filters">' +
      '<span class="ep-qbox us-search">' + icon('search', 'ic-sm') +
      '<input id="us-q" placeholder="ค้นหา username / อีเมล / รหัสพนักงาน / ชื่อ / แผนก" value="' + esc(usState.q) + '"></span>' +
      '<select id="us-role"><option value="">ทุกสิทธิ์</option>' +
      US_ROLES.map(function (r) {
        return '<option value="' + r + '"' + (usState.role === r ? ' selected' : '') + '>' + r + '</option>';
      }).join('') + '</select>' +
      '<select id="us-status">' +
      [['', 'ทั้งหมด'],
       ['REG_WAITING', 'รอสมัคร'], ['REG_PENDING', 'รอเชื่อม'], ['REG_LINKED', 'เชื่อมแล้ว'],
       ['REG_ORPHAN', 'บัญชีไม่ผูกพนักงาน'],
       ['ACTIVE', 'ใช้งาน'], ['INACTIVE', 'ระงับใช้งาน'],
       ['LINKED', 'เชื่อมพนักงานแล้ว'], ['UNLINKED', 'ยังไม่เชื่อมพนักงาน']]
        .map(function (x) { return '<option value="' + x[0] + '"' + (usState.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') +
      '</select>' +
      '<select id="us-dept"><option value="">ทุกแผนก</option></select>' +
      '<span class="grow"></span><span class="muted" id="us-count"></span>' +
      (edit ? '<button class="btn btn-primary" id="us-add">' + icon('plus') + ' เพิ่มผู้ใช้</button>' : '') + '</div>' +
      '<div class="card p0"><div class="us-table"><table><colgroup>' +
      // รวมกันได้ 100% พอดี ไม่มีคอลัมน์ px คงที่ จึงไม่ล้นขอบจอ
      ['20%', '12%', '9%', '19%', '10%', '11%', '9%', '10%']
        .map(function (w) { return '<col style="width:' + w + '">'; }).join('') +
      '</colgroup><thead><tr>' +
      ['ชื่อ–นามสกุล', 'Username', 'รหัสพนักงาน', 'แผนก', 'สิทธิ์', 'สถานะ', 'วันที่สร้าง', 'การจัดการ']
        .map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody id="us-body"><tr><td colspan="8" class="muted" style="padding:18px">' +
      '<span class="spinner"></span> กำลังโหลดข้อมูลจาก Supabase…</td></tr></tbody></table></div>' +
      '<div class="card-list us-cards" id="us-cards"></div>' +
      '<div class="toolbar" id="us-pager"></div></div>' +
      '<p class="muted note">รหัสพนักงาน ชื่อ และแผนก อ่านจากตาราง <code>employees</code> โดยตรงทุกครั้ง ' +
      'แก้ข้อมูลพนักงานแล้วหน้านี้จะเปลี่ยนตามทันที</p>' +
      '<div class="form-error" id="us-err" style="white-space:pre-line"></div>' +
      '<div id="act-panel"></div>';

    actLoadPending();

    document.getElementById('us-q').oninput = debounce(function () {
      usState.q = this.value; usPage = 0; loadUsers();
      var q2 = document.getElementById('us-q');
      if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    }, 300);
    ['role', 'status', 'dept'].forEach(function (k) {
      var sel = document.getElementById('us-' + k);
      if (sel) sel.onchange = function () { usState[k] = this.value; usPage = 0; loadUsers(); };
    });
    if (edit) document.getElementById('us-add').onclick = function () { usForm(null, el); };

    // ตัวเลือกแผนกจากข้อมูลจริง ไม่ hardcode
    sbRpcList('njhr_emp_departments', { p_token: sbToken() }).then(function (ds) {
      var sel = document.getElementById('us-dept');
      if (!sel) return;
      sel.innerHTML = '<option value="">ทุกแผนก</option>' + (ds || []).map(function (d) {
        return '<option value="' + esc(d.name) + '"' + (usState.dept === d.name ? ' selected' : '') + '>' + esc(d.name) + '</option>';
      }).join('');
      sel.onchange = function () { usState.dept = this.value; usPage = 0; loadUsers(); };
    }).catch(function () { });

    loadUsers();

    function loadUsers() {
      var mySeq = seq, errEl = document.getElementById('us-err');
      if (errEl) errEl.textContent = '';
      usState.menu = null;
      /* หน้าจัดการสมาชิกยึด employees เป็นหลัก (njhr_member_list)
         คอลัมน์ 18 ตัวแรกเหมือน njhr_list_users ทุกตัวและลำดับเดียวกัน
         จึงใช้ตัวอ่านค่าเดิมได้ทั้งหมด + เพิ่ม reg_status / request_id */
      sbRpcList('njhr_member_list', {
        p_token: sbToken(), p_q: usState.q || null, p_role: usState.role || null,
        p_status: usState.status || null, p_dept: usState.dept || null,
        p_limit: 50, p_offset: usPage * 50
      }).then(function (list) {
        if (mySeq !== usSeq) return;
        usTotal = list.length ? Number(list[0].total_count) : 0;
        usRows = list;
        var body = document.getElementById('us-body'), cards = document.getElementById('us-cards');
        if (!body) return;

        if (!list.length) {
          var msg = (usState.q || usState.role || usState.status || usState.dept)
            ? 'ไม่พบข้อมูลตามคำค้นหา' : 'ไม่พบข้อมูลพนักงานหรือบัญชีผู้ใช้งาน';
          body.innerHTML = '<tr><td colspan="8" class="muted" style="padding:24px;text-align:center">' + msg + '</td></tr>';
          if (cards) cards.innerHTML = '<div class="muted" style="padding:20px;text-align:center">' + msg + '</div>';
          document.getElementById('us-count').textContent = 'ทั้งหมด 0 รายการ';
          document.getElementById('us-pager').innerHTML = '';
          return;
        }

        function linkedCell(u) {
          if (u.employee_id && u.emp_code) {
            return '<div class="us-emp"><span class="us-1l" title="' + esc(u.emp_code + ' — ' + (u.emp_name || '')) + '">' +
              esc(u.emp_name || '') + '</span>' +
              '<small class="muted us-1l">' + esc(u.emp_code) +
              (u.emp_department ? ' · ' + esc(u.emp_department) : '') + '</small></div>';
          }
          if (u.employee_id) {
            return '<div class="us-emp"><span class="muted us-1l">ข้อมูลเชื่อมโยงไม่ถูกต้อง</span></div>';
          }
          return '<div class="us-emp"><span class="muted us-1l">ยังไม่เชื่อมพนักงาน</span></div>';
        }
        function statusCell(u) {
          return u.is_active
            ? '<span class="badge badge-ok">ใช้งาน</span>'
            : '<span class="badge badge-bad">ระงับใช้งาน</span>';
        }
        /* สถานะตาม Flow สมัครสมาชิก — รอสมัคร / รอเชื่อม / เชื่อมแล้ว
           ORPHAN_ACCOUNT = บัญชีที่ยังไม่ผูกพนักงาน (ยังต้องแสดงเพื่อให้จัดการบัญชีเดิมได้) */
        function regCell(u) {
          if (u.reg_status === 'WAITING_REGISTER') return '<span class="badge badge-mut">รอสมัคร</span>';
          if (u.reg_status === 'WAITING_LINK')     return '<span class="badge badge-warn">รอเชื่อม</span>';
          if (u.reg_status === 'ORPHAN_ACCOUNT')   return '<span class="badge badge-mut">บัญชีไม่ผูกพนักงาน</span>';
          return '<span class="badge badge-ok">เชื่อมแล้ว</span>' +
            (u.is_active ? '' : ' <span class="badge badge-bad">ปิดใช้งาน</span>');
        }

        /* ปุ่มจัดการ — แถวที่มีบัญชีใช้ปุ่มเดิมครบทุกตัว (แก้ไข · เปิด/ปิด · เมนู ⋮)
           แถวที่ยังไม่มีบัญชีจึงไม่มีปุ่มเหล่านั้นให้กด เพราะยังไม่มีอะไรให้จัดการ
           แถว "รอเชื่อม" ได้ปุ่มเชื่อม เฉพาะ SUPER_ADMIN เท่านั้น (SQL ตรวจซ้ำอีกชั้น) */
        function actionCell(u) {
          if (!edit) return '';
          if (u.reg_status === 'WAITING_LINK') {
            return isSuper
              ? '<button class="btn btn-primary btn-sm" data-act-link="' + esc(u.request_id) + '">เชื่อม</button>'
              : '<span class="muted">รอผู้ดูแลระบบสูงสุด</span>';
          }
          if (!u.user_id) return '<span class="muted">—</span>';
          return '<button class="btn-icon us-btn" data-us-edit="' + esc(u.user_id) + '" aria-label="แก้ไข" title="แก้ไขข้อมูล">' +
            icon('edit') + '</button>' +
            '<button class="btn-icon us-btn" data-us-toggle="' + esc(u.user_id) + '" aria-label="เปิด/ปิดบัญชี" title="' +
            (u.is_active ? 'ปิดใช้งานบัญชี' : 'เปิดใช้งานบัญชี') + '">' +
            icon(u.is_active ? 'ban' : 'check') + '</button>' +
            '<button class="btn-icon us-btn" data-us-menu="' + esc(u.user_id) + '" aria-label="เพิ่มเติม" title="คำสั่งเพิ่มเติม">' +
            icon('more') + '</button>';
        }

        body.innerHTML = list.map(function (u) {
          var hasEmp = !!(u.employee_id && u.emp_code);
          return '<tr' + (u.user_id && !u.is_active ? ' class="us-off"' : '') + '>' +
            '<td><span class="us-1l" title="' + esc(u.emp_name || '') + '">' +
            (u.emp_name ? '<b>' + esc(u.emp_name) + '</b>'
                        : '<span class="muted">ยังไม่ได้เชื่อมโยง</span>') + '</span></td>' +
            '<td><span class="us-1l" title="' + esc(u.username || '') + '">' +
            (u.username ? esc(u.username) : '<span class="muted">—</span>') + '</span></td>' +
            '<td>' + (u.emp_code ? '<span class="us-1l">' + esc(u.emp_code) + '</span>'
                                 : '<span class="muted">—</span>') + '</td>' +
            '<td><span class="us-1l" title="' + esc(u.emp_department || '') + '">' +
            (u.emp_department ? esc(u.emp_department) : '<span class="muted">—</span>') + '</span></td>' +
            '<td>' + (u.role ? '<span class="chip ' + usRoleClass(u.role) + '">' + esc(u.role) + '</span>'
                             : '<span class="muted">—</span>') + '</td>' +
            '<td>' + regCell(u) + '</td>' +
            '<td><span class="us-1l">' + (u.created_at
              ? esc(empBE(String(u.created_at).slice(0, 10))) : '—') + '</span></td>' +
            '<td class="ta-r us-act">' + actionCell(u) + '</td></tr>';
        }).join('');

        // ---- มือถือ: การ์ดต่อบัญชี ไม่ต้องเลื่อนแนวนอน
        if (cards) cards.innerHTML = list.map(function (u) {
          return '<div class="m-card"><div class="m-card-top">' +
            '<div class="grow"><b>' + esc(u.username || u.emp_code || '—') + '</b>' +
            (u.email ? '<small>' + esc(u.email) + '</small>' : '') + '</div>' + regCell(u) + '</div>' +
            '<div class="m-card-top">' +
            (u.role ? '<span class="chip chip-info">' + esc(u.role) + '</span>' : '') +
            '<span class="grow"></span>' +
            (u.emp_department ? '<small class="muted">' + esc(u.emp_department) + '</small>' : '') + '</div>' +
            '<div class="m-card-top">' + linkedCell(u) + '</div>' +
            (edit ? '<div class="m-card-actions">' +
              (u.reg_status === 'WAITING_LINK'
                ? (isSuper ? '<button class="btn btn-primary btn-sm" data-act-link="' + esc(u.request_id) + '">เชื่อม</button>' : '')
                : (u.user_id
                    ? '<button class="btn btn-ghost btn-sm" data-us-menu="' + esc(u.user_id) + '">' + icon('more') + ' จัดการ</button>'
                    : '')) + '</div>' : '') +
            '</div>';
        }).join('');

        document.getElementById('us-count').textContent = 'ทั้งหมด ' + usTotal + ' รายการ';
        var pg = document.getElementById('us-pager'), pages = Math.ceil(usTotal / 50) || 1;
        pg.innerHTML = pages > 1
          ? '<span class="grow"></span><button class="btn btn-ghost btn-sm" id="us-prev"' + (usPage === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
            '<span class="muted">หน้า ' + (usPage + 1) + ' / ' + pages + '</span>' +
            '<button class="btn btn-ghost btn-sm" id="us-next"' + (usPage + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button>' : '';
        if (pages > 1) {
          document.getElementById('us-prev').onclick = function () { usPage--; loadUsers(); };
          document.getElementById('us-next').onclick = function () { usPage++; loadUsers(); };
        }

        function onClick(ev) {
          var b = ev.target.closest
            ? ev.target.closest('[data-us-menu],[data-us-link],[data-us-edit],[data-us-toggle],[data-act-link]') : null;
          if (!b) return;
          if (b.dataset.actLink) { actLinkModal(b.dataset.actLink); return; }
          if (b.dataset.usLink) { usForm(b.dataset.usLink, el); return; }
          if (b.dataset.usEdit) { usForm(b.dataset.usEdit, el); return; }
          if (b.dataset.usToggle) {
            var uu = usRows.find(function (x) { return x.user_id === b.dataset.usToggle; });
            if (uu) usToggle(uu, el);
            return;
          }
          usMenu(b, b.dataset.usMenu, el);
        }
        body.onclick = onClick;
        if (cards) cards.onclick = onClick;
      }).catch(function (e) {
        if (mySeq !== usSeq) return;
        var body = document.getElementById('us-body'), cards = document.getElementById('us-cards');
        if (body) body.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center">' +
          '<div class="ep-state ep-state-bad"><b>โหลดข้อมูลผู้ใช้งานไม่สำเร็จ</b>' +
          '<small class="muted">' + esc(e.message || '') + '</small>' +
          '<button class="btn btn-primary btn-sm" id="us-retry">' + icon('history') + ' ลองใหม่</button></div></td></tr>';
        if (cards) cards.innerHTML = '';
        var rb = document.getElementById('us-retry');
        if (rb) rb.onclick = function () { loadUsers(); };
      });
    }
  }

  /* ---------- เมนูจัดการ (ปุ่มสามจุด) ---------- */
  /* สีป้ายสิทธิ์ — ครอบคลุมทุก Role ที่ระบบใช้จริง */
  function usRoleClass(role) {
    var r = String(role || '').toUpperCase();
    if (r === 'SUPER_ADMIN') return 'chip-bad';
    if (r === 'ADMIN') return 'chip-ok';
    if (r === 'ADMIN') return 'chip-warn';
    return 'chip-info';                       // USER · MESSENGER · SHIPPING · อื่น ๆ
  }

  function usMenu(btn, userId, el) {
    var u = usRows.find(function (x) { return x.user_id === userId; }) || {};
    var me = currentUser();
    var isSelf = me && u.username === me.username;
    /* "ลบบัญชี" = ลบถาวรจริงผ่าน njhr_user_delete
       แสดงเฉพาะกรณีที่ RPC ยอมลบเท่านั้น เพื่อไม่ให้ผู้ใช้กดแล้วเจอ error
       เงื่อนไขชุดเดียวกันนี้ถูกตรวจซ้ำฝั่ง SQL อีกชั้น — การซ่อนปุ่มไม่ใช่ด่านความปลอดภัย */
    var canDelete = !isSelf && me && me.role === 'SUPER_ADMIN' &&
                    u.role === 'USER' && !u.employee_id;
    // ทุกคำสั่งของบัญชีอยู่ในเมนูนี้ทั้งหมด ตารางหลักจึงเหลือเฉพาะข้อมูล
    var items = [
      ['edit',   '\u{270F}\u{FE0F}', 'แก้ไขข้อมูล', true, ''],
      ['role',   '\u{1F464}', 'เปลี่ยนสิทธิ์', true, ''],
      ['pass',   '\u{1F512}', 'รีเซ็ตรหัสผ่าน', true, ''],
      ['toggle', u.is_active ? '\u{1F534}' : '\u{1F7E2}',
                 u.is_active ? 'เปลี่ยนสถานะ: ปิดใช้งาน' : 'เปลี่ยนสถานะ: เปิดใช้งาน',
                 !isSelf, u.is_active ? 't-red' : 't-green'],
      /* ตัด "เชื่อมโยงพนักงาน / เปลี่ยนพนักงานที่เชื่อม" ออกจากเมนู
         การเชื่อมบัญชีต้องมาจากคำขอสมัคร (แถว "รอเชื่อม") เท่านั้น
         เซิร์ฟเวอร์บล็อกซ้ำอีกชั้นใน njhr_user_link — การซ่อนปุ่มไม่ใช่ด่านความปลอดภัย
         "ยกเลิกการเชื่อมพนักงาน" ยังอยู่ เพราะไม่ใช่ทางลัดข้าม Activation Flow */
      ['unlink', '\u{1F517}', 'ยกเลิกการเชื่อมพนักงาน', !!u.employee_id, ''],
      ['del',    '\u{1F5D1}\u{FE0F}', 'ลบบัญชี', canDelete, 't-red']
    ].filter(function (x) { return x[3]; });

    var old = document.getElementById('us-menu-pop');
    if (old) old.remove();
    var pop = document.createElement('div');
    pop.id = 'us-menu-pop';
    pop.className = 'us-menu';
    pop.innerHTML =
      '<div class="us-menu-h"><b>' + esc(u.username || '') + '</b>' +
      (u.is_active ? '<span class="badge badge-ok">ใช้งาน</span>'
                   : '<span class="badge badge-bad">ปิดใช้งาน</span>') + '</div>' +
      items.map(function (x) {
        return '<button type="button" class="us-menu-item ' + x[4] + '" data-act="' + x[0] + '">' +
          '<span class="us-menu-ic">' + x[1] + '</span>' + esc(x[2]) + '</button>';
      }).join('');
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    pop.style.top = (r.bottom + window.scrollY + 4) + 'px';
    pop.style.left = Math.max(8, r.right + window.scrollX - pop.offsetWidth) + 'px';

    function close() { pop.remove(); document.removeEventListener('mousedown', outside, true); }
    function outside(ev) { if (!pop.contains(ev.target)) close(); }
    setTimeout(function () { document.addEventListener('mousedown', outside, true); }, 0);

    pop.onclick = function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      var a = b.dataset.act;
      close();
      if (a === 'edit' || a === 'link' || a === 'role') usForm(userId, el);
      else if (a === 'pass') usPassForm(userId, el);
      else if (a === 'unlink') usUnlink(userId, el);
      else if (a === 'del') usDelete(u, el);
      else usToggle(u, el);
    };
  }

  /* ---------- ระงับ / เปิดใช้งานบัญชี ---------- */
  /* ลบบัญชีถาวร — เฉพาะ USER ที่ยังไม่เชื่อมพนักงาน (employee_id IS NULL)
     ใช้ RPC njhr_user_delete ซึ่งตรวจเงื่อนไขทั้งหมดซ้ำฝั่งเซิร์ฟเวอร์
     ไม่ส่ง SQL DELETE จากเบราว์เซอร์ · ไม่แตะ admin_delete_user ของแอปอื่น
     เมื่อลบสำเร็จ Username และ Email เดิมจะว่างให้พนักงานสมัครใหม่ได้ทันที */
  function usDelete(u, el) {
    confirmDialog('ต้องการลบบัญชีนี้หรือไม่?',
      '<b>' + esc(u.username) + '</b>' +
      (u.emp_name ? '<br><small class="muted">' + esc(u.emp_name) + '</small>' : '') +
      '<br><small class="muted">สถานะ: ยังไม่ได้เชื่อมพนักงาน</small>' +
      '<br><br>บัญชีนี้จะถูกลบ และพนักงานสามารถสมัครบัญชีใหม่ได้',
      'ลบบัญชี', function () {
        return sbRpc('njhr_user_delete', { p_token: sbToken(), p_user_id: u.user_id })
          .then(function () {
            toast('ลบบัญชี ' + u.username + ' แล้ว', 'success');
            viewUsers(el);                     // อัปเดตตาราง จำนวนบัญชี และตัวกรองทันที
          });
      }, true);
  }

  function usToggle(u, el) {
    var on = !u.is_active;
    confirmDialog(on ? 'เปิดใช้งานบัญชี' : 'ระงับใช้งานบัญชี',
      (on ? 'เปิดใช้งานบัญชี <b>' : 'ระงับใช้งานบัญชี <b>') + esc(u.username) + '</b> ใช่หรือไม่<br>' +
      '<small class="muted">' + (on ? 'ผู้ใช้จะเข้าสู่ระบบได้อีกครั้ง' : 'ผู้ใช้จะเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานใหม่') + '</small>',
      on ? 'เปิดใช้งาน' : 'ระงับใช้งาน', function () {
        return sbRpc('njhr_user_save', {
          p_token: sbToken(), p_user_id: u.user_id, p_username: u.username, p_role: u.role,
          p_employee: u.employee_id || null, p_email: null, p_password: null, p_is_active: on
        }).then(function () {
          toast(on ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับใช้งานบัญชีแล้ว', 'info');
          viewUsers(el);
        }).catch(function (er) {
          var e2 = document.getElementById('us-err');
          if (e2) e2.textContent = er.message || 'ดำเนินการไม่สำเร็จ';
        });
      }, !on);
  }

  var usRows = [];

  /* ---------- ฟอร์มเพิ่ม / แก้ไขผู้ใช้ ---------- */
  function usForm(userId, listEl) {
    if (!usCanEdit()) { toast('คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน', 'error'); return; }
    var u = userId ? usRows.find(function (x) { return x.user_id === userId; }) : null;
    var isSelf = u && currentUser() && u.username === currentUser().username;
    var pickedEmp = u && u.employee_id ? { id: u.employee_id, code: u.emp_code, name: u.emp_name } : null;

    openModal(u ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน',
      '<form id="us-f" novalidate>' +
      '<div class="form-2col">' +
      '<label class="field"><span>ชื่อผู้ใช้ <i class="req">*</i></span>' +
      '<input name="username" value="' + esc(u ? u.username : '') + '" placeholder="a-z 0-9 . _ - (3–50 ตัว)"></label>' +
      '<label class="field"><span>สิทธิ์ <i class="req">*</i></span><select name="role"' + (isSelf ? ' disabled' : '') + '>' +
      US_ROLES.filter(function (r) { return r !== 'SUPER_ADMIN' || currentUser().role === 'SUPER_ADMIN'; })
        .map(function (r) { return '<option value="' + r + '"' + (u && u.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
      '</select></label></div>' +
      '<label class="field"><span>อีเมล</span><input type="email" name="email" value="' + esc(u ? (u.email || '') : '') + '"></label>' +
      '<label class="field"><span>รหัสผ่าน' + (u ? ' <small class="muted">(เว้นว่าง = ไม่เปลี่ยน)</small>' : ' <i class="req">*</i>') + '</span>' +
      '<input type="password" name="password" autocomplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร"></label>' +
      '<label class="check"><input type="checkbox" name="is_active" ' + (!u || u.is_active ? 'checked' : '') +
      (isSelf ? ' disabled' : '') + '><span>เปิดใช้งานบัญชี</span></label>' +
      (isSelf ? '<p class="muted note">นี่คือบัญชีของคุณเอง — เปลี่ยนสิทธิ์และปิดใช้งานตัวเองไม่ได้</p>' : '') +
      /* ---- เชื่อมพนักงาน ----
         ตัดช่องค้นหาและเลือกพนักงานออก เพราะเป็นทางลัดข้าม Activation Flow
         การเชื่อมบัญชีต้องมาจากคำขอสมัคร (แถว "รอเชื่อม") เท่านั้น
         แสดงพนักงานที่เชื่อมอยู่แบบอ่านอย่างเดียว · เอาออกได้ที่เมนู "ยกเลิกการเชื่อมพนักงาน" */
      '<div class="emp-sec">เชื่อมกับพนักงาน</div>' +
      '<div id="us-picked">' + (pickedEmp
        ? '<div class="list-row"><div class="grow"><b>' + esc(pickedEmp.code + ' — ' + pickedEmp.name) + '</b></div></div>'
        : '<small class="muted">ยังไม่ได้เชื่อมกับพนักงาน</small>') + '</div>' +
      '<p class="muted note">การเชื่อมบัญชีกับพนักงานทำได้จากคำขอ ' +
      '<b>"รอเชื่อม"</b> เท่านั้น — พนักงานต้องกดสมัครสมาชิกครั้งแรกก่อน</p>' +
      '<div class="form-error" id="us-ferr" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="usf-cancel">ยกเลิก</button><button class="btn btn-primary" id="usf-save">บันทึก</button>',
      { wide: true });

    /* ค่าเดิมเสมอ — ฟอร์มนี้เปลี่ยนการเชื่อมพนักงานไม่ได้อีกแล้ว
       ส่งค่าเดิมกลับไปให้ njhr_user_save เพื่อไม่ให้การเชื่อมที่มีอยู่หลุด */
    var empId = pickedEmp ? pickedEmp.id : null;
    document.getElementById('usf-cancel').onclick = closeModal;

    /* ตัวค้นหาพนักงาน (njhr_user_candidates) ถูกถอดออกพร้อมกับช่องเลือกพนักงาน
       เพราะเป็นทางลัดข้าม Activation Flow — ไม่มี element ให้ผูก event แล้ว */

    document.getElementById('usf-save').onclick = function () {
      var btn = this, fm = document.getElementById('us-f'), ferr = document.getElementById('us-ferr');
      function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? String(x.value).trim() : ''; }
      ferr.textContent = '';
      var un = fv('username').toLowerCase();
      var pw = fv('password');
      if (!un) { ferr.textContent = 'กรุณาระบุชื่อผู้ใช้'; return; }
      if (!/^[a-z0-9._-]{3,50}$/.test(un)) { ferr.textContent = 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 . _ - ยาว 3–50 ตัว'; return; }
      if (!u && !pw) { ferr.textContent = 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่'; return; }
      if (pw && pw.length < 8) { ferr.textContent = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'; return; }
      if (fv('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fv('email'))) {
        ferr.textContent = 'รูปแบบอีเมลไม่ถูกต้อง'; return;
      }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_user_save', {
        p_token: sbToken(), p_user_id: userId || null, p_username: un,
        p_role: isSelf ? u.role : fm.querySelector('[name="role"]').value,
        p_employee: empId || null, p_email: fv('email') || null,
        p_password: pw || null,
        p_is_active: isSelf ? true : fm.querySelector('[name="is_active"]').checked
      }).then(function (r) {
        closeModal();
        toast((userId ? 'บันทึกผู้ใช้แล้ว: ' : 'เพิ่มผู้ใช้แล้ว: ') + r.username);
        viewUsers(listEl);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        ferr.textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ---------- ตั้งรหัสผ่านใหม่ ---------- */
  function usPassForm(userId, listEl) {
    var u = usRows.find(function (x) { return x.user_id === userId; }) || {};
    openModal('ตั้งรหัสผ่านใหม่',
      '<p class="confirm-msg">บัญชี <b>' + esc(u.username || '') + '</b></p>' +
      '<label class="field"><span>รหัสผ่านใหม่ <i class="req">*</i></span>' +
      '<input type="password" id="usp-pw" autocomplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร"></label>' +
      '<p class="muted note">ระบบจะเก็บเป็น bcrypt และยกเลิกเซสชันเดิมของบัญชีนี้ทั้งหมด</p>' +
      '<div class="form-error" id="usp-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="usp-cancel">ยกเลิก</button><button class="btn btn-primary" id="usp-ok">บันทึก</button>');
    document.getElementById('usp-cancel').onclick = closeModal;
    document.getElementById('usp-ok').onclick = function () {
      var btn = this, pw = document.getElementById('usp-pw').value;
      var err = document.getElementById('usp-err');
      err.textContent = '';
      if (!pw || pw.length < 8) { err.textContent = 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_user_password', { p_token: sbToken(), p_user_id: userId, p_password: pw })
        .then(function () { closeModal(); toast('ตั้งรหัสผ่านใหม่แล้ว'); viewUsers(listEl); })
        .catch(function (er) {
          btn.disabled = false; btn.innerHTML = 'บันทึก';
          err.textContent = er.message || 'บันทึกไม่สำเร็จ';
        });
    };
  }

  /* ---------- ยกเลิกการเชื่อมพนักงาน ---------- */
  function usUnlink(userId, listEl) {
    var u = usRows.find(function (x) { return x.user_id === userId; }) || {};
    confirmDialog('ยกเลิกการเชื่อมพนักงาน',
      'ยกเลิกการเชื่อมบัญชี <b>' + esc(u.username || '') + '</b> ออกจากพนักงาน <b>' +
      esc((u.emp_code || '') + ' ' + (u.emp_name || '')) + '</b> ใช่หรือไม่<br>' +
      '<small class="muted">บัญชียังอยู่ แต่จะไม่ผูกกับข้อมูลพนักงานอีก</small>',
      'ยกเลิกการเชื่อม', function () {
        return sbRpc('njhr_user_link', { p_token: sbToken(), p_user_id: userId, p_employee: null })
          .then(function () { toast('ยกเลิกการเชื่อมแล้ว', 'info'); viewUsers(listEl); })
          .catch(function (er) {
            var e2 = document.getElementById('us-err');
            if (e2) e2.textContent = er.message || 'ดำเนินการไม่สำเร็จ';
          });
      }, true);
  }


  /* ================= VIEW: DEPARTMENTS ================= */
  /* ================= VIEW: จัดการแผนก =================
     โครงสร้างองค์กรจากตาราง departments จริง · พนักงานอ่านจาก employees ตรง ๆ ไม่เก็บซ้ำ
     "ตั้งค่าการอนุมัติ" ใช้ของเดิมที่หน้า #/approval-settings — ที่นี่แค่แสดงสถานะและลิงก์ไป */
  var dpState = { q: '', openId: null, empQ: '', seq: 0 };
  var dpRows = [];

  function dpCanEdit() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }
  function dpErr(m) { var b = document.getElementById('dp-err'); if (b) b.textContent = m || ''; }

  function viewDepartments(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++dpState.seq, edit = dpCanEdit();
    var canWf = ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0;

    el.innerHTML =
      '<div class="toolbar dp-filters"><h3 style="margin:0">แผนกทั้งหมด</h3>' +
      '<span class="ep-qbox">' + icon('search', 'ic-sm') +
      '<input id="dp-q" placeholder="ค้นหาชื่อแผนก หรือรหัสแผนก" value="' + esc(dpState.q) + '"></span>' +
      '<span class="grow"></span>' +
      (edit ? '<button class="btn btn-primary" id="dp-add">' + icon('plus') + ' เพิ่มแผนก</button>' : '') + '</div>' +
      '<div id="dp-health"></div>' +
      '<div class="card p0" id="dp-table"><div class="ep-state"><span class="spinner"></span> กำลังโหลดข้อมูลจาก Supabase…</div></div>' +
      '<div id="dp-emps"></div>' +
      '<div class="form-error" id="dp-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('dp-q').oninput = debounce(function () {
      dpState.q = this.value; dpLoad(el, ++dpState.seq);
      var q2 = document.getElementById('dp-q');
      if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    }, 300);
    if (edit) document.getElementById('dp-add').onclick = function () { dpForm(null, el); };

    // เตือนเมื่อชื่อแผนกไม่สอดคล้องกัน (กระทบตั้งค่าการอนุมัติที่อ้างด้วยชื่อ)
    sbRpcList('njhr_dept_health', { p_token: sbToken() }).then(function (hs) {
      if (seq !== dpState.seq) return;
      var box = document.getElementById('dp-health');
      if (box && hs && hs.length) {
        box.innerHTML = '<div class="ot-warn">' + hs.map(function (h) {
          return esc(h.issue) + (h.detail && h.detail !== '-' ? ' (' + esc(h.detail) + ')' : '') + ' — ' + h.cnt + ' รายการ';
        }).join('<br>') + '</div>';
      }
    }).catch(function () { });

    dpLoad(el, seq, canWf, edit);
  }

  function dpLoad(el, seq, canWf, edit) {
    if (canWf === undefined) canWf = ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0;
    if (edit === undefined) edit = dpCanEdit();
    sbRpcList('njhr_dept_list', { p_token: sbToken(), p_q: dpState.q || null }).then(function (rows) {
      if (seq !== dpState.seq) return;
      dpRows = rows || [];
      var box = document.getElementById('dp-table');
      if (!box) return;
      if (!dpRows.length) { box.innerHTML = emptyState('ไม่พบแผนกตามคำค้น'); return; }
      box.innerHTML =
        '<div class="table-wrap"><table><thead><tr>' +
        ['รหัส', 'ชื่อแผนก', 'พนักงาน (ปฏิบัติงาน)', 'พนักงานทั้งหมด', 'จัดการ']
          .map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        dpRows.map(function (d) {
          return '<tr' + (dpState.openId === d.id ? ' class="row-on"' : '') + '>' +
            '<td>' + esc(d.code || '—') + '</td>' +
            '<td><b>' + esc(d.name) + '</b></td>' +
            '<td>' + d.employees_active + ' คน</td>' +
            '<td>' + d.employees_total + ' คน</td>' +
            '<td class="ta-r"><button class="btn-icon" data-dp-view="' + esc(d.id) + '" aria-label="ดูพนักงาน">' + icon('users') + '</button>' +
            (canWf ? '<button class="btn-icon" data-dp-wf="' + esc(d.name) + '" aria-label="ตั้งค่าการอนุมัติ">' + icon('checkSquare') + '</button>' : '') +
            (edit ? '<button class="btn-icon" data-dp-edit="' + esc(d.id) + '" aria-label="แก้ไข">' + icon('edit') + '</button>' +
              '<button class="btn-icon ic-red" data-dp-del="' + esc(d.id) + '" aria-label="ลบ">' + icon('x') + '</button>' : '') +
            '</td></tr>';
        }).join('') + '</tbody></table></div>';

      box.onclick = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-dp-view],[data-dp-wf],[data-dp-edit],[data-dp-del]') : null;
        if (!b) return;
        if (b.dataset.dpView) {
          dpState.openId = dpState.openId === b.dataset.dpView ? null : b.dataset.dpView;
          dpState.empQ = '';
          dpLoad(el, ++dpState.seq);
        } else if (b.dataset.dpWf) {
          // ใช้หน้าตั้งค่าการอนุมัติเดิม ไม่สร้างระบบใหม่
          asState.jumpDept = b.dataset.dpWf;
          location.hash = '#/approval-settings';
        } else if (b.dataset.dpEdit) dpForm(b.dataset.dpEdit, el);
        else dpDelete(b.dataset.dpDel, el);
      };
      if (dpState.openId) dpEmps(el, seq); else {
        var eb = document.getElementById('dp-emps');
        if (eb) eb.innerHTML = '';
      }
    }).catch(function (er) {
      if (seq !== dpState.seq) return;
      var box = document.getElementById('dp-table');
      if (box) box.innerHTML = emptyState('โหลดข้อมูลแผนกไม่สำเร็จ');
      dpErr(er.message || 'โหลดข้อมูลไม่สำเร็จ');
    });
  }

  /* ---------- พนักงานในแผนกที่เลือก ---------- */
  function dpEmps(el, seq) {
    var d = dpRows.find(function (x) { return x.id === dpState.openId; });
    if (!d) return;
    var box = document.getElementById('dp-emps');
    box.innerHTML = '<div class="card"><div class="card-head"><h3>พนักงานในแผนก ' + esc(d.name) + '</h3></div>' +
      '<div class="ep-state"><span class="spinner"></span> กำลังโหลด…</div></div>';
    sbRpcList('njhr_dept_employees', {
      p_token: sbToken(), p_dept_id: dpState.openId, p_q: dpState.empQ || null, p_limit: 200
    }).then(function (rows) {
      if (seq !== dpState.seq) return;
      var edit = dpCanEdit();
      box.innerHTML =
        '<div class="card p0"><div class="toolbar dp-filters">' +
        '<b>พนักงานในแผนก ' + esc(d.name) + ' (' + rows.length + ' คน)</b>' +
        '<span class="ep-qbox">' + icon('search', 'ic-sm') +
        '<input id="dp-eq" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น" value="' + esc(dpState.empQ) + '"></span>' +
        '<span class="grow"></span>' +
        '<button class="btn btn-ghost btn-sm" id="dp-close">ปิด</button></div>' +
        (rows.length
          ? '<div class="table-wrap"><table><thead><tr>' +
            ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'ตำแหน่ง', 'วันที่เริ่มงาน', 'สถานะ', 'ย้ายแผนก']
              .map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
            rows.map(function (r) {
              return '<tr><td><b>' + esc(r.emp_code || '—') + '</b></td>' +
                '<td>' + esc(r.emp_name || '—') + '</td><td>' + esc(r.nickname || '—') + '</td>' +
                '<td>' + esc(r.position_name || '—') + '</td>' +
                '<td>' + (r.start_date ? rptDateBE(r.start_date) : '—') + '</td>' +
                '<td>' + esc(EMP_STATUS_MAP[r.emp_status] || r.emp_status) + '</td>' +
                '<td class="ta-r">' + (edit
                  ? '<button class="btn btn-ghost btn-sm" data-dp-move="' + esc(r.employee_id) +
                    '" data-dp-name="' + esc(r.emp_code + ' ' + r.emp_name) + '">ย้ายแผนก</button>' : '') + '</td></tr>';
            }).join('') + '</tbody></table></div>'
          : emptyState('ยังไม่มีพนักงานในแผนกนี้')) + '</div>';

      document.getElementById('dp-close').onclick = function () {
        dpState.openId = null; dpState.empQ = ''; dpLoad(el, ++dpState.seq);
      };
      document.getElementById('dp-eq').oninput = debounce(function () {
        dpState.empQ = this.value; dpEmps(el, ++dpState.seq);
        var q2 = document.getElementById('dp-eq');
        if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
      }, 300);
      box.onclick = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-dp-move]') : null;
        if (!b) return;
        dpMoveForm(b.dataset.dpMove, b.dataset.dpName, el);
      };
    }).catch(function (er) {
      if (seq !== dpState.seq) return;
      box.innerHTML = '';
      dpErr(er.message || 'โหลดพนักงานไม่สำเร็จ');
    });
  }

  /* ---------- ย้ายพนักงานไปแผนกอื่น ---------- */
  function dpMoveForm(empId, empName, el) {
    openModal('ย้ายแผนกพนักงาน',
      '<p class="confirm-msg">' + esc(empName) + '</p>' +
      '<label class="field"><span>แผนกปลายทาง <i class="req">*</i></span><select id="dpm-dept">' +
      '<option value="">— ไม่ระบุแผนก —</option>' +
      dpRows.map(function (x) {
        return '<option value="' + esc(x.id) + '"' + (x.id === dpState.openId ? ' selected' : '') + '>' + esc(x.name) + '</option>';
      }).join('') + '</select></label>' +
      '<p class="muted note">ระบบจะปรับทั้งรหัสแผนกและชื่อแผนกของพนักงานให้ตรงกัน ' +
      'จำนวนพนักงานของทั้งสองแผนกจะอัปเดตทันที</p>' +
      '<div class="form-error" id="dpm-err" role="alert"></div>',
      '<button class="btn btn-ghost" id="dpm-cancel">ยกเลิก</button><button class="btn btn-primary" id="dpm-ok">ย้าย</button>');
    document.getElementById('dpm-cancel').onclick = closeModal;
    document.getElementById('dpm-ok').onclick = function () {
      var btn = this, to = document.getElementById('dpm-dept').value;
      var err = document.getElementById('dpm-err');
      err.textContent = '';
      if (to === dpState.openId) { err.textContent = 'พนักงานอยู่ในแผนกนี้อยู่แล้ว'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังย้าย…';
      sbRpc('njhr_dept_move', { p_token: sbToken(), p_employees: [empId], p_dept_id: to || null })
        .then(function (r) {
          closeModal();
          toast('ย้ายพนักงานไปแผนก ' + (r.dept_name || '(ไม่ระบุแผนก)') + ' แล้ว');
          dpLoad(el, ++dpState.seq);         // จำนวนและรายชื่ออัปเดตทันที
        }).catch(function (er) {
          btn.disabled = false; btn.innerHTML = 'ย้าย';
          err.textContent = er.message || 'ย้ายไม่สำเร็จ';
        });
    };
  }

  /* ---------- เพิ่ม / แก้ไขแผนก ---------- */
  function dpForm(id, el) {
    if (!dpCanEdit()) { toast('คุณไม่มีสิทธิ์แก้ไขแผนก', 'error'); return; }
    var d = id ? dpRows.find(function (x) { return x.id === id; }) : null;
    openModal(d ? 'แก้ไขแผนก' : 'เพิ่มแผนก',
      '<form id="dp-f" novalidate><div class="form-2col">' +
      '<label class="field"><span>ชื่อแผนก <i class="req">*</i></span>' +
      '<input name="dept_name" value="' + esc(d ? d.name : '') + '" placeholder="เช่น ACCOUNT"></label>' +
      '<label class="field"><span>รหัสแผนก</span>' +
      '<input name="dept_code" value="' + esc(d ? (d.code || '') : '') + '" placeholder="ไม่บังคับ"></label></div>' +
      (d ? '<p class="muted note">เปลี่ยนชื่อแผนกแล้ว ระบบจะปรับชื่อแผนกของพนักงาน ' + d.employees_total +
        ' คน และการตั้งค่าการอนุมัติของแผนกนี้ให้ตรงกันอัตโนมัติ</p>' : '') +
      '<div class="form-error" id="dp-ferr" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="dpf-cancel">ยกเลิก</button><button class="btn btn-primary" id="dpf-save">บันทึก</button>');
    document.getElementById('dpf-cancel').onclick = closeModal;
    document.getElementById('dpf-save').onclick = function () {
      var btn = this, fm = document.getElementById('dp-f');
      function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? String(x.value).trim() : ''; }
      var ferr = document.getElementById('dp-ferr');
      ferr.textContent = '';
      if (!fv('dept_name')) { ferr.textContent = 'กรุณาระบุชื่อแผนก'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_dept_save', {
        p_token: sbToken(), p_id: id || null, p_name: fv('dept_name'), p_code: fv('dept_code') || null
      }).then(function (r) {
        closeModal();
        toast((id ? 'บันทึกแผนกแล้ว: ' : 'เพิ่มแผนกแล้ว: ') + r.name +
          (r.synced_employees ? ' · ปรับพนักงาน ' + r.synced_employees + ' คน' : '') +
          (r.synced_workflows ? ' · ปรับตั้งค่าการอนุมัติ ' + r.synced_workflows + ' ชุด' : ''));
        viewDepartments(el);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        ferr.textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ---------- ลบแผนก ---------- */
  function dpDelete(id, el) {
    var d = dpRows.find(function (x) { return x.id === id; }) || {};
    dpErr('');
    sbRpc('njhr_dept_delete', { p_token: sbToken(), p_id: id, p_confirm: false }).then(function (r) {
      if (r && r.deleted) { toast('ลบแผนกแล้ว', 'info'); dpLoad(el, ++dpState.seq); return; }
      if (r && r.employees_count > 0) {
        dpErr('ลบแผนก "' + (r.dept_name || d.name) + '" ไม่ได้ — ยังมีพนักงานอยู่ ' + r.employees_count +
          ' คน กรุณาย้ายพนักงานออกก่อน');
        return;
      }
      confirmDialog('ลบแผนก',
        'แผนก <b>' + esc(r.dept_name || d.name) + '</b><br>' +
        '<span class="t-red">มีการตั้งค่าการอนุมัติผูกอยู่ ' + (r.workflow_steps || 0) + ' ขั้น</span> ' +
        'การลบจะปิดการตั้งค่าการอนุมัติของแผนกนี้ด้วย<br>ยืนยันลบหรือไม่',
        'ยืนยันลบ', function () {
          return sbRpc('njhr_dept_delete', { p_token: sbToken(), p_id: id, p_confirm: true })
            .then(function () { toast('ลบแผนกแล้ว', 'info'); dpLoad(el, ++dpState.seq); });
        }, true);
    }).catch(function (er) { dpErr(er.message || 'ลบไม่สำเร็จ'); });
  }

  /* ================= VIEW: SETTINGS ================= */
  /* ---------- ตั้งค่าทั่วไป: อ่าน/เขียนที่ system_settings ผ่าน RPC เดิม ----------
     njhr_setting_list / njhr_setting_save (78_system_settings.sql) เป็นแหล่งจริง
     คีย์ที่หน้านี้ดูแล 3 คีย์: company_name · work_start_time · late_grace_minutes
     ยังเขียนกลับลง db.settings ด้วย เพื่อไม่ให้จุดอื่นที่อ่าน db.settings.companyName
     (สลิป · เทมเพลตนำเข้า · ทะเบียนเอกสาร) เปลี่ยนพฤติกรรม — Supabase เป็นแหล่งจริง
     ส่วน db.settings เป็นเพียงสำเนาสำหรับแสดงผลของหน้าที่ยังไม่ได้ย้าย

     njhr_setting_save มี Audit ในตัวแล้ว จึงไม่สร้าง audit() ซ้ำที่ Frontend
     โหมด Geofence ไม่ผ่าน RPC นี้ เพราะ njhr_setting_save ปฏิเสธคีย์ geofence*
     (พิกัดอยู่ที่ njhr_geofences เท่านั้น) จึงคงพฤติกรรมเดิมไว้ทั้งหมด */
  var ST_KEYS = { companyName: 'company_name', workStart: 'work_start_time', lateGrace: 'late_grace_minutes' };

  function stSetErr(msg) { var b = document.getElementById('st-err'); if (b) b.textContent = msg || ''; }

  function stLoad() {
    if (!sbReady() || !sbToken()) { stSetErr('ยังไม่ได้เชื่อมต่อ Supabase — ค่าที่แสดงเป็นค่าในเครื่อง'); return; }
    sbRpcList('njhr_setting_list', { p_token: sbToken(), p_category: null }).then(function (rows) {
      var map = {};
      (rows || []).forEach(function (r) { map[r.key] = r.value; });
      var fm = document.getElementById('st-f');
      if (!fm) return;
      /* value เป็น jsonb — string มาเป็น string, number มาเป็น number อยู่แล้ว */
      if (map.company_name != null) { db.settings.companyName = String(map.company_name); fm.elements.companyName.value = db.settings.companyName; }
      if (map.work_start_time != null) { db.settings.workStart = String(map.work_start_time); fm.elements.workStart.value = db.settings.workStart; }
      if (map.late_grace_minutes != null) { db.settings.lateGrace = parseInt(map.late_grace_minutes, 10) || 0; fm.elements.lateGrace.value = db.settings.lateGrace; }
      saveDB();
      stSetErr('');
    }).catch(function (er) {
      console.error('[SETTINGS] njhr_setting_list ล้มเหลว:', er);
      stSetErr('โหลดการตั้งค่าจาก Supabase ไม่สำเร็จ: ' + ((er && er.message) || er));
    });
  }

  function viewSettings(el) {
    el.innerHTML =
      '<div class="dash-cols"><div class="col">' +
      '<div class="card"><div class="card-head"><h3>ประเภทการลา</h3>' +
      '<small class="muted">7 ประเภทตาม enum ของฐานข้อมูล</small></div>' +
      '<div class="table-wrap"><table><thead><tr><th>ประเภท</th><th>สิทธิ์/ปี</th><th>ต้องแนบเอกสาร</th><th>สถานะ</th><th class="ta-r"></th></tr></thead>' +
      '<tbody id="lt-body"><tr><td colspan="5" class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</td></tr></tbody></table></div>' +
      '<div class="form-error" id="lt-err" role="alert"></div></div></div>' +
      '<div class="col"><div class="card"><div class="card-head"><h3>ตั้งค่าทั่วไป</h3></div>' +
      '<form id="st-f">' +
      '<label class="field"><span>ชื่อบริษัท</span><input name="companyName" value="' + esc(db.settings.companyName) + '"></label>' +
      '<label class="field"><span>เวลาเริ่มงานมาตรฐาน</span><input type="time" name="workStart" value="' + esc(db.settings.workStart) + '"></label>' +
      '<label class="field"><span>อนุโลมมาสาย (นาที)</span><input type="number" name="lateGrace" min="0" value="' + db.settings.lateGrace + '"></label>' +
      '<label class="field"><span>รัศมี Geofence (เมตร)</span><input type="number" value="' + gfGet().radius + '" disabled>' +
      '<small class="muted">ตั้งค่าที่หน้า ' + (currentUser().role === 'SUPER_ADMIN' ? '<a class="link" href="#/geofence">พื้นที่ลงเวลา</a>' : '"พื้นที่ลงเวลา" (เฉพาะ Super Admin)') + '</small></label>' +
      // โหมดระบบลงเวลาเป็นค่าระดับระบบ จึงย้ายมาไว้ที่นี่ (เดิมอยู่หน้าพื้นที่ลงเวลา)
      '<label class="field"><span>โหมดระบบลงเวลา</span><select name="gfMode" id="st-gfmode"' +
      (currentUser().role === 'SUPER_ADMIN' ? '' : ' disabled') + '>' +
      '<option value="PROTOTYPE"' + (gfGet().mode === 'PROTOTYPE' ? ' selected' : '') + '>โหมดจำลอง GPS</option>' +
      '<option value="PRODUCTION"' + (gfGet().mode === 'PRODUCTION' ? ' selected' : '') + '>Production (บังคับ GPS จริง)</option></select>' +
      '<small class="muted">' + (currentUser().role === 'SUPER_ADMIN'
        ? 'มีผลกับการลงเวลาทั้งระบบ — Production จะบังคับตรวจพิกัด GPS จริงทุกครั้ง'
        : 'แก้ไขได้เฉพาะ Super Admin') + '</small></label>' +
      '<button class="btn btn-primary" id="st-save" type="button">บันทึกการตั้งค่า</button>' +
      '<div class="form-error" id="st-err" role="alert" style="white-space:pre-line"></div></form></div></div></div>';

    ltLoad(el);
    stLoad();
    document.getElementById('st-save').onclick = function () {
      var fm = document.getElementById('st-f'), btn = this;
      stSetErr('');
      var vals = {
        companyName: fm.elements.companyName.value.trim() || db.settings.companyName,
        workStart: fm.elements.workStart.value,
        lateGrace: parseInt(fm.elements.lateGrace.value, 10) || 0
      };
      // โหมดระบบลงเวลา — เขียนเฉพาะฟิลด์ mode ของ geofence เดิม ไม่แตะพิกัด/รัศมี
      // (คีย์ geofence* บันทึกผ่าน njhr_setting_save ไม่ได้ตามกฎของ RPC จึงคงพฤติกรรมเดิม)
      var md = document.getElementById('st-gfmode');
      if (md && !md.disabled && currentUser().role === 'SUPER_ADMIN') {
        var g0 = gfGet();
        if (g0.mode !== md.value) {
          g0.mode = md.value;
          g0.updatedAt = nowStamp();
          g0.updatedBy = currentUser().username + ' (' + currentUser().id + ')';
          g0.updatedByRole = currentUser().role;
          audit('GEOFENCE_UPDATE', 'เปลี่ยนโหมดระบบลงเวลาเป็น ' + md.value);
          saveDB();
        }
      }
      if (!sbReady() || !sbToken()) { stSetErr('ยังไม่ได้เชื่อมต่อ Supabase — บันทึกการตั้งค่าไม่ได้'); return; }
      if (btn.disabled) return;
      var label = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      /* บันทึกทีละคีย์ตาม Signature จริงของ njhr_setting_save(p_token, p_key, p_value jsonb, ...)
         value เป็น jsonb — ส่งเป็น string/number ตรง ๆ ตามที่ seed ไว้ใน 78_system_settings.sql
         Audit ถูกเขียนโดย RPC แล้ว จึงไม่เรียก audit() ซ้ำ */
      Promise.all([
        sbRpc('njhr_setting_save', { p_token: sbToken(), p_key: ST_KEYS.companyName, p_value: vals.companyName }),
        sbRpc('njhr_setting_save', { p_token: sbToken(), p_key: ST_KEYS.workStart, p_value: vals.workStart }),
        sbRpc('njhr_setting_save', { p_token: sbToken(), p_key: ST_KEYS.lateGrace, p_value: vals.lateGrace })
      ]).then(function () {
        // สำเนาในเครื่องสำหรับหน้าที่ยังอ่าน db.settings อยู่ (สลิป/เทมเพลต) — ไม่ใช่แหล่งจริง
        db.settings.companyName = vals.companyName;
        db.settings.workStart = vals.workStart;
        db.settings.lateGrace = vals.lateGrace;
        saveDB();
        toast('บันทึกการตั้งค่าแล้ว');
      }).catch(function (er) {
        console.error('[SETTINGS] njhr_setting_save ล้มเหลว:', er);
        stSetErr('บันทึกการตั้งค่าไม่สำเร็จ: ' + ((er && er.message) || er));
      }).then(function () { btn.disabled = false; btn.innerHTML = label; });
    };
  }
  // โหลด/แก้ Metadata ประเภทการลาจาก Supabase (ตาราง leave_types · RPC njhr_leave_types*)
  // ประเภทถูกกำหนดโดย enum leave_type 7 ค่า จึงเพิ่ม/ลบประเภทไม่ได้ แก้ได้เฉพาะการแสดงผลและกฎเอกสาร
  var _ltRows = [];
  function ltLoad(listEl) {
    var body = document.getElementById('lt-body');
    sbRpcList('njhr_leave_types', { p_token: sbToken() }).then(function (rows) {
      _ltRows = rows;
      body = document.getElementById('lt-body');
      if (!body) return;
      var QUOTA_TH = { leave_sick: 'ลาป่วย', leave_personal: 'ลากิจ', leave_vacation: 'ลาพักร้อน' };
      body.innerHTML = rows.map(function (t) {
        return '<tr><td><span class="chip" style="background:' + esc(t.color) + '18;color:' + esc(t.color) + '">' + esc(t.label_th) + '</span></td>' +
          '<td>' + (t.quota_field ? '<small class="muted">employees.' + esc(t.quota_field) + '</small>' : 'ไม่จำกัด/ตามจริง') + '</td>' +
          '<td>' + (t.need_doc ? 'ต้องแนบ' + (Number(t.doc_after_days) > 0 ? ' (เกิน ' + lvNum(t.doc_after_days) + ' วัน)' : '') : '—') + '</td>' +
          '<td>' + (t.active ? '<span class="badge badge-ok">เปิด</span>' : '<span class="badge badge-mut">ปิด</span>') + '</td>' +
          '<td class="ta-r"><button class="btn-icon" data-lt-edit="' + esc(t.code) + '" aria-label="แก้ไข">' + icon('edit') + '</button>' +
          '<button class="btn-icon ' + (t.active ? 'ic-red' : '') + '" data-lt-toggle="' + esc(t.code) + '" aria-label="เปิด/ปิด">' + icon(t.active ? 'ban' : 'check') + '</button></td></tr>';
      }).join('');
      body.onclick = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-lt-edit],[data-lt-toggle]') : null;
        if (!b) return;
        if (b.dataset.ltEdit) ltForm(b.dataset.ltEdit, listEl);
        else ltToggle(b.dataset.ltToggle, listEl);
      };
    }).catch(function (er) {
      body = document.getElementById('lt-body');
      if (body) body.innerHTML = '<tr><td colspan="5" class="muted" style="padding:18px">โหลดประเภทการลาไม่สำเร็จ</td></tr>';
      var e2 = document.getElementById('lt-err');
      if (e2) e2.textContent = er.message || 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ';
    });
  }
  function ltFind(code) { return _ltRows.find(function (x) { return x.code === code; }); }

  function ltToggle(code, listEl) {
    var t = ltFind(code);
    if (!t) return;
    sbRpc('njhr_leave_type_save', {
      p_token: sbToken(), p_code: code, p_label_th: null, p_color: null,
      p_active: !t.active, p_need_doc: null, p_doc_after_days: null
    }).then(function () {
      toast((!t.active ? 'เปิด' : 'ปิด') + 'ประเภทลาแล้ว', 'info');
      ltLoad(listEl);
    }).catch(function (er) {
      var e2 = document.getElementById('lt-err');
      if (e2) e2.textContent = er.message || 'บันทึกไม่สำเร็จ';
    });
  }

  function ltForm(code, listEl) {
    var t = ltFind(code);
    if (!t) return;
    openModal('แก้ไขประเภทลา · ' + esc(t.label_th),
      '<form id="lt-f" novalidate>' +
      '<label class="field"><span>ชื่อที่แสดง <i class="req">*</i></span><input name="label_th" value="' + esc(t.label_th) + '"></label>' +
      '<div class="form-2col">' +
      '<label class="field"><span>สี</span><input type="color" name="color" value="' + esc(t.color) + '"></label>' +
      '<label class="field"><span>ต้องแนบเอกสารเมื่อลาเกิน (วัน · 0 = ทุกครั้ง)</span><input type="number" name="doc_after_days" min="0" step="0.5" value="' + lvNum(t.doc_after_days) + '"></label></div>' +
      '<label class="check"><input type="checkbox" name="need_doc" ' + (t.need_doc ? 'checked' : '') + '><span>ต้องแนบเอกสารประกอบ</span></label>' +
      '<p class="muted note">รหัสประเภท <b>' + esc(t.code) + '</b> มาจาก enum <code>leave_type</code> ของฐานข้อมูล จึงเพิ่มหรือลบประเภทจากหน้านี้ไม่ได้' +
      (t.quota_field ? ' · โควตาต่อปีตั้งที่ <code>employees.' + esc(t.quota_field) + '</code>' : ' · ประเภทนี้ไม่จำกัดจำนวนวัน') + '</p>' +
      '<div class="form-error" id="lt-ferr" role="alert"></div></form>',
      '<button class="btn btn-ghost" id="ltf-cancel">ยกเลิก</button><button class="btn btn-primary" id="ltf-save">บันทึก</button>');
    document.getElementById('ltf-cancel').onclick = closeModal;
    document.getElementById('ltf-save').onclick = function () {
      var btn = this, fm = document.getElementById('lt-f');
      var name = fm.label_th.value.trim();
      if (!name) { document.getElementById('lt-ferr').textContent = 'กรุณากรอกชื่อที่แสดง'; return; }
      if (btn.disabled) return;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
      sbRpc('njhr_leave_type_save', {
        p_token: sbToken(), p_code: t.code, p_label_th: name, p_color: fm.color.value,
        p_active: null, p_need_doc: fm.need_doc.checked,
        p_doc_after_days: Number(fm.doc_after_days.value) || 0
      }).then(function () {
        closeModal(); toast('บันทึกประเภทลาแล้ว'); ltLoad(listEl);
      }).catch(function (er) {
        btn.disabled = false; btn.innerHTML = 'บันทึก';
        document.getElementById('lt-ferr').textContent = er.message || 'บันทึกไม่สำเร็จ';
      });
    };
  }

  /* ================= VIEW: AUDIT / NOTIFICATIONS / PROFILE ================= */
  /* ================= VIEW: AUDIT (Supabase) ================= */
  var _adPage = 0, _adQ = '', _adSeq = 0;
  var AD_PER = 50;
  function viewAudit(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++_adSeq;
    el.innerHTML =
      '<div class="toolbar"><span class="search-box">' + icon('search') +
      '<input id="ad-q" placeholder="ค้นหา ผู้ใช้ / การกระทำ / รายละเอียด" value="' + esc(_adQ) + '"></span>' +
      '<span class="grow"></span><span class="muted" id="ad-count"></span></div>' +
      '<div class="card p0"><div class="table-wrap"><table><thead><tr>' +
      '<th>เวลา</th><th>ผู้ใช้</th><th>สิทธิ์</th><th>การกระทำ</th><th>โมดูล</th><th>รายละเอียด</th></tr></thead>' +
      '<tbody id="ad-body"><tr><td colspan="5" class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</td></tr></tbody></table></div>' +
      '<div class="toolbar" id="ad-pager"></div></div>' +
      '<p class="muted note">Audit Log เขียนโดยเซิร์ฟเวอร์เท่านั้น แก้ไขหรือลบผ่านหน้าจอไม่ได้</p>' +
      '<div class="form-error" id="ad-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('ad-q').oninput = debounce(function () {
      _adQ = this.value; _adPage = 0; viewAudit(el);
    }, 300);
    adLoad(el, seq);
  }

  function adLoad(el, seq) {
    sbRpcList('njhr_audit_list', { p_token: sbToken(), p_q: _adQ || null, p_limit: AD_PER, p_offset: _adPage * AD_PER })
      .then(function (rows) {
        if (seq !== _adSeq) return;
        var body = document.getElementById('ad-body');
        if (!body) return;
        var total = rows.length ? Number(rows[0].total_count) : 0;
        body.innerHTML = rows.length ? rows.map(function (a) {
          return '<tr><td><small class="muted">' + esc(String(a.created_at || '').replace('T', ' ').slice(0, 16)) + '</small></td>' +
            '<td><b>' + esc(a.actor || '—') + '</b></td>' +
            '<td><small class="muted">' + esc(a.actor_role || '—') + '</small></td>' +
            '<td><span class="chip chip-info">' + esc(a.action) + '</span></td>' +
            '<td><small class="muted">' + esc(a.module || '—') + '</small></td>' +
            '<td>' + esc(a.detail || '') + '</td></tr>';
        }).join('') : '<tr><td colspan="5" class="muted" style="padding:18px">ไม่พบประวัติการใช้งาน</td></tr>';

        var cnt = document.getElementById('ad-count');
        if (cnt) cnt.textContent = total ? 'ทั้งหมด ' + total + ' รายการ' : '';
        var pages = Math.ceil(total / AD_PER) || 1, pg = document.getElementById('ad-pager');
        if (pg) {
          pg.innerHTML = pages > 1
            ? '<button class="btn btn-ghost btn-sm" id="ad-prev"' + (_adPage === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
              '<span class="muted">หน้า ' + (_adPage + 1) + ' / ' + pages + '</span>' +
              '<button class="btn btn-ghost btn-sm" id="ad-next"' + (_adPage + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button>' : '';
          if (pages > 1) {
            document.getElementById('ad-prev').onclick = function () { if (_adPage > 0) { _adPage--; viewAudit(el); } };
            document.getElementById('ad-next').onclick = function () { if (_adPage + 1 < pages) { _adPage++; viewAudit(el); } };
          }
        }
      }).catch(function (er) {
        if (seq !== _adSeq) return;
        var body = document.getElementById('ad-body');
        if (body) body.innerHTML = '<tr><td colspan="5" class="muted" style="padding:18px">โหลดประวัติไม่สำเร็จ</td></tr>';
        var e2 = document.getElementById('ad-err');
        if (e2) e2.textContent = 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er);
      });
  }
