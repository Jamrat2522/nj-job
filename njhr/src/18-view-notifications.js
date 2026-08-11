/* ============================================================
   18-view-notifications.js — หน้าการแจ้งเตือน (ย้ายมาจาก 13 ตามเดิมทุกบรรทัด)
   Badge จำนวนแจ้งเตือนอยู่ที่ runtime/core.js (refreshNotifyBadge) เหมือนเดิม
   จึงไม่ต้องโหลดโมดูลนี้เพื่อแสดง Badge
   ============================================================ */
  /* ================= VIEW: NOTIFICATIONS (Supabase) =================
     อ่าน/เขียนที่ตาราง notifications ผ่าน njhr_notify_* — ไม่ใช้ db.notifications อีกต่อไป
     link มาจากคอลัมน์ link (ถ้าแถวเก่าไม่มี เซิร์ฟเวอร์เดาจาก icon/module ให้) */
  var _ntPage = 0, _ntSeq = 0;
  var NT_PER = 20;


  function viewNotifications(el) {
    if (!sbReady()) { el.innerHTML = emptyState('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase'); return; }
    var seq = ++_ntSeq;
    el.innerHTML =
      '<div class="toolbar"><h3>การแจ้งเตือน</h3><span class="grow"></span>' +
      '<span class="muted" id="nt-count"></span>' +
      '<button class="btn btn-ghost" id="nt-all" style="display:none">อ่านทั้งหมดแล้ว</button></div>' +
      '<div class="card" id="nt-box"><small class="muted" style="padding:14px;display:block">กำลังโหลดข้อมูลจาก Supabase…</small></div>' +
      '<div class="toolbar" id="nt-pager"></div>' +
      '<div class="form-error" id="nt-err" role="alert" style="white-space:pre-line"></div>';
    ntLoad(el, seq);
  }

  function ntLoad(el, seq) {
    sbRpcList('njhr_notify_list', { p_token: sbToken(), p_limit: NT_PER, p_offset: _ntPage * NT_PER })
      .then(function (rows) {
        if (seq !== _ntSeq) return;
        var box = document.getElementById('nt-box');
        if (!box) return;
        var total = rows.length ? Number(rows[0].total_count) : 0;
        NJHR.state.ntUnread = rows.length ? Number(rows[0].unread_count) : 0;
        try { NJHR.notify.paint(); } catch (e) {}   // เปิดหน้านี้ = ซิงก์ป้ายแดง ไม่ได้ทำเครื่องหมายว่าอ่าน
        refreshMenuBadge();

        box.innerHTML = rows.length ? '<div class="list">' + rows.map(function (n) {
          return '<a href="' + esc(n.link) + '" class="list-row nt-row' + (n.is_read ? ' read' : '') + '" data-nt="' + n.id + '">' +
            '<span class="nt-dot' + (n.is_read ? ' off' : '') + '"></span>' +
            '<div class="grow"><b>' + esc(n.title) + '</b><small>' + esc(n.body) + ' · ' +
            esc(String(n.created_at || '').replace('T', ' ').slice(0, 16)) + '</small></div>' + icon('chevR') + '</a>';
        }).join('') + '</div>' : emptyState('ไม่มีการแจ้งเตือน');

        var cnt = document.getElementById('nt-count');
        if (cnt) cnt.textContent = total ? 'ทั้งหมด ' + total + ' รายการ' : '';
        var allBtn = document.getElementById('nt-all');
        if (allBtn) {
          allBtn.style.display = NJHR.state.ntUnread ? '' : 'none';
          allBtn.onclick = function () {
            var b = this; b.disabled = true;
            sbRpc('njhr_notify_read_all', { p_token: sbToken() }).then(function () {
              try { NJHR.state.ntUnread = 0; NJHR.notify.paint(); } catch (e) {}   // ป้ายแดงทุกจุดอัปเดตทันที
              toast('ทำเครื่องหมายอ่านทั้งหมดแล้ว', 'info');
              viewNotifications(el);
            }).catch(function (er) {
              b.disabled = false;
              document.getElementById('nt-err').textContent = er.message || 'ทำเครื่องหมายไม่สำเร็จ';
            });
          };
        }

        var pages = Math.ceil(total / NT_PER) || 1, pg = document.getElementById('nt-pager');
        if (pg) {
          pg.innerHTML = pages > 1
            ? '<button class="btn btn-ghost btn-sm" id="nt-prev"' + (_ntPage === 0 ? ' disabled' : '') + '>ก่อนหน้า</button>' +
              '<span class="muted">หน้า ' + (_ntPage + 1) + ' / ' + pages + '</span>' +
              '<button class="btn btn-ghost btn-sm" id="nt-next"' + (_ntPage + 1 >= pages ? ' disabled' : '') + '>ถัดไป</button>' : '';
          if (pages > 1) {
            document.getElementById('nt-prev').onclick = function () { if (_ntPage > 0) { _ntPage--; viewNotifications(el); } };
            document.getElementById('nt-next').onclick = function () { if (_ntPage + 1 < pages) { _ntPage++; viewNotifications(el); } };
          }
        }
        // ผูก event ครั้งเดียวต่อการเรนเดอร์
        box.onclick = function (ev) {
          var a = ev.target.closest ? ev.target.closest('[data-nt]') : null;
          if (!a || !box.contains(a)) return;
          sbRpc('njhr_notify_read', { p_token: sbToken(), p_id: a.dataset.nt })
            .then(function () { refreshNotifyBadge(true); }).catch(function () {});
        };
      }).catch(function (er) {
        if (seq !== _ntSeq) return;
        var box = document.getElementById('nt-box');
        if (box) box.innerHTML = emptyState('โหลดการแจ้งเตือนไม่สำเร็จ');
        var e2 = document.getElementById('nt-err');
        if (e2) e2.textContent = 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ: ' + (er.message || er);
      });
  }
