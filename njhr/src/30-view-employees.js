  /* ================= VIEW: EMPLOYEES ================= */
  /* ================= VIEW: EMPLOYEES (Supabase) =================
     ข้อมูลจากตาราง employees จริงผ่าน RPC njhr_emp_* — ไม่ใช้ db.employees อีกต่อไป
     ค้นหา/กรอง/เรียง/แบ่งหน้า ทำฝั่งเซิร์ฟเวอร์ · ข้อมูลเงินเดือนเปิดตามสิทธิ์ */

  // สิทธิ์เปิดแฟ้มเอกสารพนักงาน — ตรงกับ njhr_empfile_guard ฝั่งเซิร์ฟเวอร์ (MANAGER ไม่เข้าข่าย)



  /* ---------- รายละเอียดพนักงาน ---------- */

  /* ---------- ฟอร์มเพิ่ม / แก้ไข ---------- */

  /* ---------- ช่องประกันสังคมในฟอร์มพนักงาน ----------
     ค่าทั้งหมดมาจาก njhr_emp_get และบันทึกผ่าน njhr_sso_emp_save
     ไม่มีสูตรคำนวณที่นี่ — ฐานและยอดสมทบคำนวณที่ฐานข้อมูลด้วย njhr_sso_base() */


  /* ---------- แก้ไขประกันสังคมจากหน้ารายการ (ใช้ RPC เดียวกัน) ---------- */

  /* ---------- เปลี่ยนสถานะ / บันทึกลาออก (ไม่ลบข้อมูลจริง) ---------- */

  /* ---------- นำเข้าพนักงานจาก Excel ----------
     หัวคอลัมน์ในไฟล์ (ภาษาไทย) → คีย์ที่ RPC njhr_emp_import ต้องการ
     ตรวจสอบทั้งไฟล์ก่อน (Dry Run) แสดงผลให้ดู แล้วจึงยืนยันบันทึกทั้งชุด */
  /* หัวคอลัมน์และลำดับยึดตามไฟล์ Template ของบริษัท 100% (28 คอลัมน์)
     การนำเข้าอ่านค่าจาก "ชื่อหัวคอลัมน์" ไม่ได้อ่านจากตำแหน่ง จึงรองรับไฟล์รุ่นก่อนที่มีช่องว่างคั่นด้วย */

  // เทมเพลตพร้อมหัวคอลัมน์ + ตัวอย่าง 1 แถว

  /* สรุปหลังนำเข้า: ช่องที่ถูกปล่อยว่าง + แถวที่ไม่ถูกนำเข้า */

  /* ใช้ตัวโหลดกลาง — เรียกซ้ำได้ไม่โหลดซ้ำ · ล้มเหลวแล้วกดใหม่ลองใหม่ได้ · มี timeout
     โหลดเมื่อผู้ใช้กด Import/Export เท่านั้น ไม่โหลดตั้งแต่หน้า Login */
  // แปลงค่าจากเซลล์ Excel เป็นข้อความมาตรฐาน (วันที่ → YYYY-MM-DD, เวลา → HH:MM)
  /* ประเภทพนักงาน — ค่ามาตรฐานของระบบ (คอลัมน์ employees.emp_type ชนิด text เก็บภาษาไทยตรง)
     ใช้ทั้งฟอร์มแก้ไขและการนำเข้า Excel เพื่อให้เป็นค่าชุดเดียวกัน */
  /* แปลงค่าที่พิมพ์มาไม่ตรงเป๊ะให้เป็นค่ามาตรฐาน — ตัดช่องว่างหน้า/หลัง/ตรงกลาง
     รองรับตัวย่อและตัวพิมพ์อังกฤษ · ค่าที่ไม่รู้จักคืน '' (ปล่อยเฉพาะช่องนี้ว่าง ไม่ทิ้งทั้งแถว) */



  /* ---------- Export Excel (ดึงทุกหน้าตามตัวกรองปัจจุบัน) ---------- */

  /* ---------- ลงทะเบียนใบหน้า (เรียกโมดูล face.js — ไม่ยัดโค้ดกล้องลง app.js) ---------- */

  /* ================= แฟ้มเอกสารพนักงาน (ไฟล์แนบรายบุคคล) =================
     ข้อมูลจริงจาก Supabase: njhr_emp_files (+ njhr_emp_file_versions) ผ่าน RPC njhr_empfile_*
     ไฟล์เก็บใน bucket "njhr-emp-files" แบบ private 100% เบราว์เซอร์แตะ Storage ตรงไม่ได้
     ทุกครั้งที่ ดู / ดาวน์โหลด / อัปโหลด ต้องผ่าน Edge Function njhr-emp-file
     ซึ่งส่ง token ไปให้ฐานข้อมูลตรวจสิทธิ์ก่อน แล้วจึงออก Signed URL อายุ 60 วินาที
     หนังสือที่ระบบ HR ออกเอง (njhr_emp_documents) แสดงในหมวด "เอกสารจากบริษัท" อัตโนมัติ
     เป็นรายการอ่านอย่างเดียว และปิดการอัปโหลดซ้ำในหมวดนั้น */
  // หนังสือจากศูนย์เอกสาร HR → หมวดย่อยในแฟ้มนี้ (CONTRACT_PROBATION รวมอยู่ใน "สัญญาจ้าง")

  // เอกสารหมดอายุ / ใกล้หมดอายุ ภายใน 30 วัน

  /* ---------- เรียก Edge Function (ประตูเดียวสู่ไฟล์ private) ---------- */
  /* อัปโหลด 1 ไฟล์: ขอสิทธิ์ → PUT ขึ้น Storage ด้วย Signed Upload URL → บันทึกข้อมูลผ่าน RPC */

  /* ---------- หน้าต่างหลัก ---------- */

  /* ---------- ฟอร์มแนบไฟล์ (หลายไฟล์พร้อมกัน) ---------- */

  /* ---------- ฟอร์มแก้ไขข้อมูล / เปลี่ยนไฟล์ ---------- */

  /* ---------- ลบเอกสาร (SUPER_ADMIN เท่านั้น · ต้องระบุเหตุผล) ---------- */
  /* ================= EMPLOYEES (list · form · detail · files · status) =================
     ย้ายมาจาก 08-view-employees.js โดยไม่แก้เนื้อใน ================= */
  function empCanEdit() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }

  function empCanDocs() { return ['SUPER_ADMIN', 'ADMIN'].indexOf(currentUser().role) >= 0; }

  function empErr(msg) { var b = document.getElementById('emp-err'); if (b) b.textContent = msg || ''; }

  var empState = { q: '', dept: '', status: '', sort: 'emp_code', desc: false, page: 1, per: 20, seq: 0 };

  var empRows = [], empDepts = [];

  /* ---------- ตัวโหลด Action Module (ใช้ร่วมกันทุกปุ่มในหน้าพนักงาน) ----------
     กันกดซ้ำระหว่างโหลด · ตรวจ session และ Navigation ID ก่อนเปิด · ไม่เปิดของเก่าหลังเปลี่ยนหน้า
     โหลดไม่สำเร็จ = คืนปุ่มกลับสภาพเดิมและแจ้งด้วยข้อความสั้น ไม่เปิดเผย path */
  function empOpenAction(mod, btn, fn) {
    if (!btn || btn.getAttribute('data-busy') === '1') return;
    var navId = NJHR.router.navId(), route = NJHR.state.currentRoute;
    function ok() { return navId === NJHR.router.navId() && route === NJHR.state.currentRoute && !!currentUser(); }
    if (NJHR.modules.isLoaded(mod)) { if (ok()) fn(); return; }
    var html = btn.innerHTML, dis = btn.disabled;
    btn.setAttribute('data-busy', '1'); btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    function restore() { btn.removeAttribute('data-busy'); btn.disabled = dis; btn.innerHTML = html; }
    NJHR.modules.load(mod).then(function () {
      restore();
      if (ok()) fn();
    })['catch'](function (e) {
      restore();
      try { console.error('[MODULE] ' + (e && e.message ? e.message : e)); } catch (e2) {}
      if (ok()) toast('ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่', 'error');
    });
  }
  /* Public Feature Contract ของ Employees List — Form/Documents เรียกผ่านตัวนี้เท่านั้น
     ห้าม Module อื่นอ้าง closure viewEmployees / empLoad โดยตรง */
  NJHR.features.employees = {
    refresh: function (el) { viewEmployees(el || empState.host); },
    getHost: function () { return empState.host; },
    openAction: function (mod, btn, fn) { return empOpenAction(mod, btn, fn); }
  };

  function viewEmployees(el) {
    empState.host = el;   // เก็บ host ไว้ให้ Public Contract refresh() ใช้
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    /* ---------- แยกทางตั้งแต่ก่อนยิง Query ----------
       SUPER_ADMIN  → Employee Management เดิมทั้งหมด (ไม่เปลี่ยนอะไรเลย)
       role อื่น     → Self Service ของตัวเอง
       สำคัญ: return ตรงนี้ก่อน แปลว่า njhr_emp_list / njhr_emp_departments
       ไม่เคยถูกเรียกเลยสำหรับ USER/ADMIN — ไม่ใช่โหลดมาทั้งบริษัทแล้วค่อยกรอง */
    if (currentUser().role !== 'SUPER_ADMIN') { meView(el); return; }
    var s = empState, seq = ++s.seq, edit = empCanEdit();

    el.innerHTML =
      '<div class="toolbar emp-filters">' +
      '<span class="search-box emp-search"><input id="emp-q" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / เบอร์ / อีเมล / ตำแหน่ง" value="' + esc(s.q) + '"></span>' +
      '<select id="emp-dept" aria-label="แผนก"><option value="">ทุกแผนก</option></select>' +
      '<select id="emp-status"><option value="">ทุกสถานะ</option>' +
      EMP_STATUS.map(function (x) { return '<option value="' + x[0] + '"' + (s.status === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      '<select id="emp-sort">' +
      [['emp_code', 'เรียงตามรหัส'], ['full_name', 'เรียงตามชื่อ'], ['department_name', 'เรียงตามแผนก'],
       ['start_date', 'เรียงตามวันเริ่มงาน'], ['status', 'เรียงตามสถานะ']]
        .map(function (x) { return '<option value="' + x[0] + '"' + (s.sort === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      '<button class="btn btn-ghost btn-sm emp-dirbtn" id="emp-dir">' + (s.desc ? 'มาก→น้อย' : 'น้อย→มาก') + '</button>' +
      '<span class="grow"></span>' +
      /* "ดาวน์โหลดเทมเพลต" อยู่ในแถวตัวกรองตามเดิม */
      (edit ? '<button class="btn btn-ghost emp-tbtn" id="emp-tpl">' + icon('download') + ' <span class="emp-btxt">ดาวน์โหลดเทมเพลต</span></button>' : '') +
      /* ---------- กลุ่มปุ่มจัดการข้อมูล ----------
         นำเข้า Excel · Export Excel · เพิ่มพนักงาน
         วางไว้ท้าย DOM ตำแหน่งเดิมทุกประการ — id · class · Handler ไม่เปลี่ยนแม้แต่ตัวเดียว
         บนจอคอมพิวเตอร์ CSS จะดันกลุ่มนี้ขึ้นไปเป็นแถวบน (order: -1) และชิดซ้าย
         บนมือถือ CSS ตั้ง display: contents ทำให้ปุ่มไหลอยู่ในแถบเดิมเหมือนก่อนแก้ทุกอย่าง */
      '<div class="emp-actions">' +
      (edit ? '<button class="btn btn-ghost emp-tbtn" id="emp-import">' + icon('upload') + ' <span class="emp-btxt">นำเข้า Excel</span></button>' : '') +
      '<button class="btn btn-ghost emp-tbtn" id="emp-export">' + icon('download') + ' <span class="emp-btxt">Export Excel</span></button>' +
      (edit ? '<button class="btn btn-primary emp-addbtn" id="emp-add">' + icon('plus') + ' เพิ่มพนักงาน</button>' : '') +
      '</div></div>' +
      '<div class="card p0" id="emp-table"><div class="muted" style="padding:18px">กำลังโหลดข้อมูลจาก Supabase…</div></div>' +
      '<div class="pager" id="emp-pager"></div>' +
      '<div class="form-error" id="emp-err" role="alert" style="white-space:pre-line"></div>';

    document.getElementById('emp-q').oninput = debounce(function () {
      s.q = this.value; s.page = 1; viewEmployees(el);
      var q2 = document.getElementById('emp-q');
      if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    }, 300);
    document.getElementById('emp-status').onchange = function () { s.status = this.value; s.page = 1; viewEmployees(el); };
    document.getElementById('emp-sort').onchange = function () { s.sort = this.value; s.page = 1; viewEmployees(el); };
    document.getElementById('emp-dir').onclick = function () { s.desc = !s.desc; viewEmployees(el); };
    /* Runtime Split — Export/Template/Import อยู่คนละ chunk แล้ว
       กดปุ่มจึงโหลดไฟล์ครั้งแรก แล้วเรียกฟังก์ชันเดิมด้วยพารามิเตอร์ชุดเดิมทุกประการ
       ผลบนหน้าจอเหมือนเดิม ต่างเพียงมีสถานะกำลังโหลดชั่วครู่ตอนกดครั้งแรก */
    function empRunLazy(mod, btn, fn) {
      var busy = btn.getAttribute('data-busy') === '1';
      if (busy) return;
      if (NJHR.modules.isLoaded(mod)) { fn(); return; }
      var html = btn.innerHTML;
      btn.setAttribute('data-busy', '1'); btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';
      NJHR.modules.load(mod).then(function () {
        btn.removeAttribute('data-busy'); btn.disabled = false; btn.innerHTML = html;
        fn();
      })['catch'](function (e) {
        btn.removeAttribute('data-busy'); btn.disabled = false; btn.innerHTML = html;
        try { console.error('[MODULE] ' + (e && e.message ? e.message : e)); } catch (e2) {}
        toast('ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่', 'error');
      });
    }
    document.getElementById('emp-export').onclick = function () {
      var b = this;
      empRunLazy('employees-export', b, function () { NJHR.compat.scope.empExport(b); });
    };
    if (edit) {
      document.getElementById('emp-add').onclick = function () { empOpenAction('employees-form', this, function () { NJHR.features.employeesForm.open(null, el); }); };
      document.getElementById('emp-tpl').onclick = function () {
        var b = this;
        empRunLazy('employees-import', b, function () { NJHR.compat.scope.empTemplate(b); });
      };
      document.getElementById('emp-import').onclick = function () {
        var b = this;
        empRunLazy('employees-import', b, function () { NJHR.compat.scope.empImportForm(el); });
      };
    }

    // แผนกจากข้อมูลจริง — จำนวนในวงเล็บนับด้วยเกณฑ์เดียวกับตัวกรองรายชื่อ (department_name)
    // ทุกครั้งที่เพิ่ม/ลบ/เปลี่ยนแผนก/นำเข้า Excel จะเรียก viewEmployees() ใหม่ ตัวเลขจึงอัปเดตเองทันที
    sbRpcList('njhr_emp_departments', { p_token: sbToken() }).then(function (ds) {
      if (seq !== s.seq) return;
      // แก้ค่าใน Array ตัวเดิม ไม่สร้างตัวใหม่ — chunk employees-form รับ empDepts ผ่าน
      // NJHR.compat.scope ตอนโหลด chunk (อ้างถึงตัวเดียวกันครั้งเดียว) ถ้าสร้าง Array ใหม่
      // ฝั่งฟอร์มจะยังชี้ Array ว่างใบเดิมตลอด ทำให้ Dropdown แผนกไม่มีรายการ
      empDepts.length = 0;
      Array.prototype.push.apply(empDepts, ds || []);
      var sel = document.getElementById('emp-dept');
      if (!sel) return;
      // แผนกที่เลือกไว้ถูกลบไปแล้ว = ล้างตัวกรอง ไม่ให้ค้างกับแผนกที่ไม่มีอยู่
      if (s.dept && !empDepts.some(function (d) { return d.name === s.dept; })) {
        s.dept = ''; s.page = 1;
      }
      sel.innerHTML = '<option value="">ทุกแผนก (' +
        empDepts.reduce(function (n, d) { return n + (Number(d.employees) || 0); }, 0) + ')</option>' +
        empDepts.map(function (d) {
          return '<option value="' + esc(d.name) + '"' + (s.dept === d.name ? ' selected' : '') + '>' +
            esc(d.name) + ' (' + (Number(d.employees) || 0) + ')</option>';
        }).join('');
      sel.onchange = function () { s.dept = this.value; s.page = 1; viewEmployees(el); };
    }).catch(function (er) {
      console.error('[EMPLOYEE] njhr_emp_departments ล้มเหลว:', er);
      var sel = document.getElementById('emp-dept');
      if (sel) sel.innerHTML = '<option value="">โหลดรายชื่อแผนกไม่สำเร็จ</option>';
    });

    empLoad(el, seq);
  }

  function empLoad(el, seq) {
    var s = empState;
    sbRpcList('njhr_emp_list', {
      p_token: sbToken(), p_q: s.q || null, p_dept: s.dept || null, p_status: s.status || null,
      p_sort: s.sort, p_desc: s.desc, p_limit: s.per, p_offset: (s.page - 1) * s.per
    }).then(function (rows) {
      if (seq !== s.seq) return;
      // แก้ค่าใน Array ตัวเดิม ไม่สร้างตัวใหม่ — เหตุผลเดียวกับ empDepts
      // chunk employees-form รับ empRows ผ่าน NJHR.compat.scope ตอนโหลด chunk ครั้งเดียว
      empRows.length = 0;
      Array.prototype.push.apply(empRows, rows);
      var total = rows.length ? Number(rows[0].total_count) : 0;
      var pages = Math.max(1, Math.ceil(total / s.per));
      var edit = empCanEdit();
      var docs = empCanDocs();
      var box = document.getElementById('emp-table');
      if (!box) return;
      box.innerHTML = rows.length
        ? '<div class="table-wrap only-desktop"><table><thead><tr>' +
          // ซ่อนคอลัมน์ "ตำแหน่ง" ในตาราง (UI เท่านั้น) — ข้อมูล position_name ยังอยู่ครบ
          // ใช้ในหน้ารายละเอียด · ฟอร์มแก้ไข · ค้นหา · Export · Import ตามเดิม
          ['พนักงาน', 'แผนก', 'เริ่มงาน', 'ประเภท', 'สถานะ', 'จัดการ']
            .map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (e) {
            return '<tr><td><div class="cell-user">' + avatarHTML(e.full_name, 34) +
              '<div><b>' + esc(e.full_name) + '</b><small>' + esc(e.emp_code) +
              (e.nickname ? ' · ' + esc(e.nickname) : '') + '</small></div></div></td>' +
              '<td>' + esc(e.department_name || '—') + '</td>' +
              '<td>' + empBE(e.start_date) + '</td><td>' + esc(e.emp_type || '—') + '</td>' +
              '<td>' + empStatusBadge(e.status) + '</td>' +
              '<td class="ta-r"><button class="btn-icon" data-emp-view="' + e.id + '" aria-label="ดูข้อมูล">' + icon('eye') + '</button>' +
              (docs ? '<button class="btn-icon" data-emp-docs="' + e.id + '" aria-label="เอกสาร" title="เอกสาร">' + icon('folder') + '</button>' +
                      '<button class="btn-icon" data-emp-face="' + e.id + '" aria-label="ลงทะเบียนใบหน้า" title="ลงทะเบียนใบหน้า">' + icon('camera') + '</button>' : '') +
              (edit ? '<button class="btn-icon" data-emp-edit="' + e.id + '" aria-label="แก้ไข">' + icon('edit') + '</button>' +
                '<button class="btn-icon ic-red" data-emp-status="' + e.id + '" aria-label="เปลี่ยนสถานะ">' + icon('ban') + '</button>' +
                (e.status === 'RESIGNED' ? '' :
                  '<button class="btn-icon ic-red" data-emp-del="' + e.id + '" aria-label="ลบพนักงาน" title="ลบพนักงาน">' + icon('trash') + '</button>') : '') +
              '</td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="card-list only-mobile">' + rows.map(function (e) {
            return '<div class="m-card"><div class="m-card-top">' + avatarHTML(e.full_name, 40) +
              '<div class="grow"><b>' + esc(e.full_name) + '</b><small>' + esc(e.emp_code) + ' · ' +
              esc(e.department_name || '—') + '</small></div>' + empStatusBadge(e.status) + '</div>' +
              '<div class="m-card-actions"><button class="btn btn-ghost btn-sm" data-emp-view="' + e.id + '">ดูข้อมูล</button>' +
              (docs ? '<button class="btn btn-ghost btn-sm" data-emp-docs="' + e.id + '">เอกสาร</button>' +
                      '<button class="btn btn-ghost btn-sm" data-emp-face="' + e.id + '">ใบหน้า</button>' : '') +
              (edit ? '<button class="btn btn-ghost btn-sm" data-emp-edit="' + e.id + '">แก้ไข</button>' +
                '<button class="btn btn-ghost btn-sm t-red" data-emp-status="' + e.id + '">เปลี่ยนสถานะ</button>' +
                (e.status === 'RESIGNED' ? '' :
                  '<button class="btn btn-ghost btn-sm t-red" data-emp-del="' + e.id + '">ลบพนักงาน</button>') : '') + '</div></div>';
          }).join('') + '</div>'
        : emptyState('ไม่พบพนักงานตามเงื่อนไขที่เลือก');

      var pg = document.getElementById('emp-pager');
      if (pg) {
        pg.innerHTML = '<span>ทั้งหมด ' + total + ' คน</span><span class="grow"></span>' +
          '<button class="btn-icon" id="emp-prev"' + (s.page <= 1 ? ' disabled' : '') + '>' + icon('chevL') + '</button>' +
          '<span>หน้า ' + s.page + ' / ' + pages + '</span>' +
          '<button class="btn-icon" id="emp-next"' + (s.page >= pages ? ' disabled' : '') + '>' + icon('chevR') + '</button>';
        document.getElementById('emp-prev').onclick = function () { if (s.page > 1) { s.page--; viewEmployees(el); } };
        document.getElementById('emp-next').onclick = function () { if (s.page < pages) { s.page++; viewEmployees(el); } };
      }

      box.onclick = function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-emp-view],[data-emp-edit],[data-emp-status],[data-emp-docs],[data-emp-face],[data-emp-del]') : null;
        if (!b) return;
        // Runtime Split — ปุ่มแต่ละตัวโหลด Action Module ของตัวเองก่อน แล้วเรียกฟังก์ชันเดิมด้วยพารามิเตอร์ชุดเดิม
        if (b.dataset.empView) empOpenAction('employees-form', b, function () { NJHR.features.employeesForm.detail(b.dataset.empView); });
        else if (b.dataset.empFace) empOpenAction('employees-form', b, function () { NJHR.features.employeesForm.face(b.dataset.empFace); });
        else if (b.dataset.empDocs) empOpenAction('employees-documents', b, function () { NJHR.features.employeesDocs.open(b.dataset.empDocs); });
        else if (b.dataset.empEdit) empOpenAction('employees-form', b, function () { NJHR.features.employeesForm.open(b.dataset.empEdit, el); });
        else if (b.dataset.empDel) empOpenAction('employees-form', b, function () { NJHR.features.employeesForm.remove(b.dataset.empDel, el); });
        else empOpenAction('employees-form', b, function () { NJHR.features.employeesForm.status(b.dataset.empStatus, el); });
      };
    }).catch(function (er) {
      if (seq !== s.seq) return;
      var box = document.getElementById('emp-table');
      if (box) box.innerHTML = emptyState('โหลดข้อมูลพนักงานไม่สำเร็จ');
      empErr('โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er));
    });
  }

  function empStatusBadge(st) {
    var cls = st === 'ACTIVE' ? 'badge-ok' : st === 'RESIGNED' ? 'badge-bad' : 'badge-mut';
    return '<span class="badge ' + cls + '">' + esc(EMP_STATUS_MAP[st] || st) + '</span>';
  }

  /* ================= EMPLOYEE SELF SERVICE (USER / ADMIN) =================
     ข้อมูลทั้งหมดมาจาก njhr_me_get(p_token) ตัวเดียว
     employee_id มาจาก session ฝั่งเซิร์ฟเวอร์ ไม่เคยรับจาก browser
     จึงไม่มีทางเปิดข้อมูลพนักงานคนอื่นได้ ต่อให้แก้ URL หรือ Payload

     แก้ได้เฉพาะ 7 ช่อง — บังคับซ้ำที่ njhr_me_save ด้วย Allowlist ฝั่งเซิร์ฟเวอร์
     ข้อมูลบริษัททั้งหมดแสดงอย่างเดียว ไม่มี input ไม่มีทางส่งกลับ

     ไม่มีปุ่ม "ส่งตรวจ" ตามที่ตกลง — แสดงเพียงว่าครบหรือยังขาดอะไร ================= */
  var ME_FIELDS = [
    ['nickname',        'ชื่อเล่น',                'text'],
    ['birth_date',      'วันเกิด',                 'date'],
    ['national_id',     'เลขบัตรประชาชน',          'text'],
    ['phone',           'เบอร์โทร',                'tel'],
    ['email',           'อีเมล',                   'email'],
    ['address',         'ที่อยู่',                  'text'],
    ['emergency_phone', 'เบอร์โทรติดต่อฉุกเฉิน',   'tel']
  ];

  var meState = { host: null, data: null, seq: 0 };

  function meView(el) {
    meState.host = el;
    var seq = ++meState.seq;
    el.innerHTML = '<div class="card"><div class="muted" style="padding:18px">กำลังโหลดข้อมูลของคุณ…</div></div>';
    sbRpc('njhr_me_get', { p_token: sbToken() }).then(function (r) {
      if (seq !== meState.seq) return;
      meState.data = (r && r.data) || null;
      meRender();
    }).catch(function (er) {
      if (seq !== meState.seq) return;
      el.innerHTML = '<div class="card"><div class="form-error" role="alert">' +
        esc(er.message || 'โหลดข้อมูลของคุณไม่สำเร็จ') + '</div>' +
        '<button class="btn btn-ghost" id="me-retry">ลองใหม่</button></div>';
      var rt = document.getElementById('me-retry');
      if (rt) rt.onclick = function () { meView(el); };
    });
  }

  function meRow(k, v) {
    return '<div class="ep-info"><span>' + esc(k) + '</span><span>:</span><b>' +
      esc(v == null || v === '' ? '—' : v) + '</b></div>';
  }

  function meRender() {
    var el = meState.host, d = meState.data;
    if (!el || !d) return;
    var e = d.employee || {}, p = d.personal || {}, dc = d.documents || {};
    var missP = p.missing || [], missD = dc.missing || [];

    el.innerHTML =
      // ---------- หัวข้อมูลพนักงาน (อ่านอย่างเดียวทั้งหมด) ----------
      '<div class="card profile-card">' + avatarHTML(e.full_name || '', 72) +
      '<b>' + esc(e.full_name || '—') + '</b>' +
      '<small>' + esc(e.emp_code || '—') + (e.nickname ? ' · ' + esc(e.nickname) : '') + '</small>' +
      empStatusBadge(e.status) + '</div>' +

      '<div class="card"><div class="card-head"><h3>ข้อมูลการทำงาน</h3>' +
      '<span class="badge badge-mut">🔒 แก้ไขโดยฝ่ายบุคคลเท่านั้น</span></div>' +
      '<div class="detail-grid">' +
      meRow('รหัสพนักงาน', e.emp_code) + meRow('แผนก', e.department_name) +
      meRow('ตำแหน่ง', e.position_name) +
      meRow('วันที่เริ่มงาน', e.start_date ? empBE(e.start_date) : '') +
      meRow('ประเภทพนักงาน', e.emp_type) +
      meRow('สถานะ', EMP_STATUS_MAP[e.status] || e.status) +
      '</div>' +
      '<p class="muted note">ข้อมูลชุดนี้เป็นข้อมูลบริษัท ไม่นับรวมในการตรวจความครบถ้วนของคุณ</p></div>' +

      // ---------- ข้อมูลส่วนตัว 7 ช่อง ----------
      '<div class="card"><div class="card-head"><h3>ข้อมูลส่วนตัว</h3>' +
      (p.complete
        ? '<span class="badge badge-ok">✅ ครบ ' + (p.filled || 0) + '/' + (p.total || 7) + '</span>'
        : '<span class="badge badge-warn">⚠ ยังไม่ครบ ' + (p.filled || 0) + '/' + (p.total || 7) + '</span>') +
      '</div>' +
      (missP.length
        ? '<div class="form-error" style="white-space:pre-line">⚠ ข้อมูลส่วนตัวยังไม่ครบ\nขาด: ' +
          missP.map(function (m) { return esc(m.label); }).join(' · ') + '</div>'
        : '') +
      '<form id="me-f" novalidate>' +
      ME_FIELDS.map(function (f) {
        var miss = missP.some(function (m) { return m.field === f[0]; });
        var extra = f[0] === 'national_id' ? ' maxlength="13" inputmode="numeric"' :
                    (f[2] === 'tel' ? ' inputmode="tel"' : '');
        return '<label class="field"><span>' + esc(f[1]) + ' <i class="req">*</i>' +
          (miss ? ' <small class="t-red">ยังไม่ได้กรอก</small>' : '') + '</span>' +
          '<input type="' + f[2] + '" name="' + f[0] + '" value="' +
          esc(e[f[0]] == null ? '' : e[f[0]]) + '"' + extra + '></label>';
      }).join('') +
      '<div class="form-error" id="me-err" role="alert"></div></form>' +
      '<button class="btn btn-primary" type="button" id="me-save">บันทึกข้อมูล</button>' +
      '<p class="muted note">กรอกไม่ครบก็บันทึกไว้ก่อนได้ ระบบจะแจ้งว่ายังขาดช่องใด</p></div>' +

      // ---------- เอกสารบังคับ 3 รายการ ----------
      '<div class="card"><div class="card-head"><h3>เอกสารประกอบ</h3>' +
      (dc.complete
        ? '<span class="badge badge-ok">✅ ครบ ' + (dc.filled || 0) + '/' + (dc.total || 3) + '</span>'
        : '<span class="badge badge-warn">⚠ ยังไม่ครบ ' + (dc.filled || 0) + '/' + (dc.total || 3) + '</span>') +
      '</div>' +
      '<div class="detail-grid">' +
      (dc.items || []).map(function (it) {
        return '<div class="ep-info"><span>' + (it.uploaded ? '✅' : '❌') + ' ' + esc(it.label) +
          '</span><span>:</span><b>' +
          (it.uploaded && it.file ? esc(it.file.file_name) : 'ยังไม่ได้แนบ') + '</b></div>';
      }).join('') + '</div>' +
      (missD.length
        ? '<div class="form-error" style="white-space:pre-line">⚠ เอกสารยังไม่ครบ\nขาด: ' +
          missD.map(function (x) { return esc(x); }).join(' · ') + '</div>'
        : '') +
      '<button class="btn btn-ghost" type="button" id="me-docs">' + icon('folder') + ' เอกสารของฉัน</button>' +
      '<p class="muted note">แนบทีละรายการได้ ไม่ต้องแนบครบในครั้งเดียว ไฟล์ที่แนบแล้วจะถูกเก็บไว้</p></div>' +

      // ---------- สรุปรวม ----------
      '<div class="card">' +
      (d.overall_complete
        ? '<div class="badge badge-ok" style="font-size:15px;padding:10px 14px">✅ ข้อมูลพนักงานครบถ้วน</div>'
        : '<div class="badge badge-warn" style="font-size:15px;padding:10px 14px">⚠ ข้อมูลพนักงานยังไม่ครบถ้วน</div>') +
      '</div>';

    document.getElementById('me-save').onclick = meSave;
    document.getElementById('me-docs').onclick = function () {
      var b = this;
      empOpenAction('employees-documents', b, function () {
        NJHR.features.employeesDocs.open(e.id, function () { meView(meState.host); });
      });
    };
  }

  function meSave() {
    var btn = this, fm = document.getElementById('me-f');
    var err = document.getElementById('me-err');
    err.textContent = '';
    if (btn.disabled) return;

    function fv(n) { var x = fm.querySelector('[name="' + n + '"]'); return x ? String(x.value).trim() : ''; }

    // ตรวจเบื้องต้นที่หน้าจอเพื่อความเร็ว — เซิร์ฟเวอร์ตรวจซ้ำทุกข้อใน njhr_me_save
    if (fv('national_id') && !/^[0-9]{13}$/.test(fv('national_id'))) {
      err.textContent = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'; return;
    }
    if (fv('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fv('email'))) {
      err.textContent = 'รูปแบบอีเมลไม่ถูกต้อง'; return;
    }

    // ส่งเฉพาะ 7 key นี้เท่านั้น — ตรงกับ Allowlist ฝั่งเซิร์ฟเวอร์
    var payload = {};
    ME_FIELDS.forEach(function (f) { payload[f[0]] = fv(f[0]); });

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> กำลังบันทึก…';
    sbRpc('njhr_me_save', { p_token: sbToken(), p_data: payload }).then(function (r) {
      // RPC คืนสถานะล่าสุดชุดเดียวกับ njhr_me_get — อัปเดตหน้าจอได้เลย ไม่ต้องยิงซ้ำ
      meState.data = (r && r.data) || meState.data;
      meRender();
      toast('บันทึกข้อมูลส่วนตัวแล้ว');
    }).catch(function (ex) {
      btn.disabled = false; btn.innerHTML = 'บันทึกข้อมูล';
      var e2 = document.getElementById('me-err');
      if (e2) e2.textContent = ex.message || 'บันทึกไม่สำเร็จ';
    });
  }



























