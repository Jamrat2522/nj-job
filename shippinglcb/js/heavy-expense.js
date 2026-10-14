/* ============================================================
   heavy-expense.js — 💰 ปิดค่าใช้จ่าย (MESSENGER / shippinglcb)
   Lazy chunk (classic script · shared scope กับ app.js) · เมนู DOCUMENT → 💰 ปิดค่าใช้จ่าย
   หน้าต่าง/ตาราง/สี/ปุ่ม/Logic การกรอก/Export = ยกมาจาก SHIPPING FZ (shippingfz/index.html · 💰 ปิดค่าใช้จ่าย)
   ข้อมูลแยกจาก SHIPPING FZ: ตาราง ms_expense_* ผ่าน RPC ms_expense_* (sql/RUN-09_ms_expense.sql) เท่านั้น
   เพิ่มจาก SHIPPING FZ: เลือก JOB ที่ปล่อยเสร็จแล้ว (documents.doc_status = COMPLETED) ที่ยังไม่ปิด → ปิดได้ครั้งเดียว
   ไม่แก้/ไม่ลบ documents หรือ jobs ต้นฉบับ
   ============================================================ */
(function(){
"use strict";

/* ---------- CSS (ยกจาก SHIPPING FZ · เปลี่ยนเฉพาะ id ของ Modal) ---------- */
var EX_CSS = "/* from block1 (.ex- only) */\n.ex-wrap{max-width:100%}\n.ex-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px}\n.ex-title{display:flex;align-items:center;gap:12px;min-width:0}\n.ex-title .ex-ic{font-size:30px;line-height:1}\n.ex-title h2{margin:0;font-size:22px;color:var(--text)}\n.ex-title p{margin:2px 0 0;font-size:13px;color:var(--muted)}\n.ex-meta{display:flex;gap:10px;flex-wrap:wrap}\n.ex-fld{display:flex;flex-direction:column;gap:4px;min-width:0}\n.ex-fld label{font-size:11.5px;color:var(--muted);font-weight:600}\n.ex-fld input{height:40px;padding:0 10px;border:1px solid var(--line);border-radius:8px;\n  background:var(--card);color:var(--text);font-size:14px;min-width:0;width:170px;max-width:100%}\n.ex-fld input.ex-ro{background:var(--bg);opacity:.9}\n.ex-panel{padding:0;overflow:hidden}\n.ex-tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\n.ex-tbl{width:100%;min-width:900px;border-collapse:collapse}\n.ex-tbl thead th{background:#1E3A8A;color:#fff;font-size:13px;font-weight:700;\n  padding:11px 8px;text-align:center;white-space:nowrap;border:1px solid rgba(255,255,255,.18)}\n.ex-tbl tbody td{border:1px solid var(--line);padding:7px 8px;font-size:14px;vertical-align:middle}\n.ex-tbl .ex-c-no{width:62px;text-align:center;color:var(--muted)}\n.ex-tbl .ex-c-job{width:150px;background:#EFF6FF}\n.ex-tbl .ex-c-co{min-width:200px;background:#ECFDF5}\n.ex-tbl .ex-c-cost{width:150px;background:#FEFCE8}\n.ex-tbl .ex-c-rcp{width:150px;background:#FDF2F8}\n.ex-tbl .ex-c-sum{width:150px;background:#F5F3FF;text-align:right;font-weight:700}\n.ex-tbl .ex-c-place{width:190px;background:#EFF6FF}\n.ex-tbl .ex-c-act{width:112px;text-align:center;white-space:nowrap}\n.ex-tbl .ex-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-tbl input,.ex-tbl select{width:100%;height:36px;padding:0 8px;border:1px solid var(--line);\n  border-radius:7px;background:var(--card);color:var(--text);font-size:14px;min-width:0}\n.ex-tbl input.ex-in-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-tbl .ex-place-other{margin-top:5px}\n.ex-tbl .ex-ro-cell{display:block;padding:0 2px}\n.ex-tbl tr.ex-draft{background:rgba(59,130,246,.04)}\n.ex-ib{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:var(--card);\n  cursor:pointer;font-size:15px;line-height:1;margin:0 2px;transition:.15s}\n.ex-ib:hover{transform:translateY(-1px)}\n.ex-ib:disabled{opacity:.5;cursor:not-allowed;transform:none}\n.ex-ib-save{background:#2563EB;border-color:#2563EB;color:#fff}\n.ex-ib-edit{background:#F1F5F9}\n.ex-ib-del{background:#FEE2E2;border-color:#FCA5A5}\n.ex-ib-view{background:#DBEAFE;border-color:#93C5FD}\n.ex-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;\n  flex-wrap:wrap;padding:12px;border-top:1px solid var(--line)}\n.ex-bar-r{display:flex;gap:8px;flex-wrap:wrap}\n.ex-bar .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;font-size:14px;\n  border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex-btn-add{background:#16A34A}\n.ex-btn-list{background:#2563EB}\n.ex-btn-xls{background:#15803D}\n.ex-btn-pdf{background:#DC2626}\n.ex-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}\n.ex-card{display:flex;align-items:center;gap:12px;padding:16px;border-radius:14px;border:1px solid var(--line);min-width:0}\n.ex-card-ic{font-size:26px;line-height:1;flex:none}\n.ex-card-bd{min-width:0;flex:1}\n.ex-card-bd label{display:block;font-size:13px;font-weight:600;margin-bottom:3px}\n.ex-card-bd b{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;display:block}\n.ex-card-bd input{width:100%;height:42px;border:1px solid var(--line);border-radius:9px;\n  background:var(--card);padding:0 10px;font-size:22px;font-weight:800;text-align:right;\n  font-variant-numeric:tabular-nums;color:var(--text);min-width:0}\n.ex-card-adv{background:#EFF6FF;border-color:#BFDBFE}\n.ex-card-adv label{color:#1D4ED8}\n.ex-card-spent{background:#FEF2F2;border-color:#FECACA}\n.ex-card-spent label{color:#DC2626}\n.ex-card-spent b{color:#DC2626}\n.ex-card-bal{background:#ECFDF5;border-color:#A7F3D0}\n.ex-card-bal label{color:#047857}\n.ex-card-bal b{color:#047857}\n.ex-neg{color:#DC2626 !important}\n.ex-lfilter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}\n.ex-lfilter input{height:40px;padding:0 10px;border:1px solid var(--line);border-radius:8px;\n  background:var(--card);color:var(--text);font-size:14px;min-width:0}\n.ex-lfilter input[type=\"text\"]{flex:1;min-width:160px}\n.ex-ltbl{width:100%;border-collapse:collapse;min-width:720px}\n.ex-ltbl th{background:#1E3A8A;color:#fff;padding:9px 8px;font-size:13px;white-space:nowrap}\n.ex-ltbl td{border:1px solid var(--line);padding:7px 8px;font-size:13.5px}\n.ex-ltbl .ex-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-ltbl tr.ex-trsum td{background:#EFF6FF}\n.ex-st{display:inline-block;padding:2px 10px;border-radius:999px;background:#DCFCE7;color:#166534;font-size:12px;font-weight:700}\n.ex-dmeta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}\n.ex-dmeta>div{flex:1;min-width:120px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--bg)}\n.ex-dmeta label{display:block;font-size:11.5px;color:var(--muted);font-weight:600}\n.ex-dmeta b{font-size:17px;font-variant-numeric:tabular-nums}\n.ex-dacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.ex-dacts .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;border:0;cursor:pointer;color:#fff}\n.ex-tbl tbody td{color:#111 !important;background:#fff}\n.ex-tbl thead th{background:#1E3A8A !important;color:#fff !important}\n.ex-tbl tbody td.ex-c-no{color:#555 !important}\n.ex-tbl tbody td.ex-c-job{background:#EFF6FF !important}\n.ex-tbl tbody td.ex-c-co{background:#ECFDF5 !important}\n.ex-tbl tbody td.ex-c-cost{background:#FEFCE8 !important}\n.ex-tbl tbody td.ex-c-rcp{background:#FDF2F8 !important}\n.ex-tbl tbody td.ex-c-sum{background:#F5F3FF !important;color:#4C1D95 !important}\n.ex-tbl tbody td.ex-c-place{background:#EFF6FF !important}\n.ex-tbl tbody td.ex-c-act{background:#fff !important}\n.ex-tbl input,.ex-tbl select{background:#fff !important;color:#111 !important;border-color:#CBD5E1 !important}\n.ex-tbl input::placeholder{color:#94A3B8 !important}\n.ex-tbl tr.ex-draft td{background:#F8FAFF !important}\n.ex-tbl tr.ex-draft .ex-c-sum{background:#F5F3FF !important}\n.ex-card-bd input{background:#fff !important;color:#1D4ED8 !important;border-color:#BFDBFE !important}\n.ex-card-adv label{color:#1D4ED8 !important}\n.ex-fld input{color:var(--text)}\n.ex-fld input.ex-ro{color:var(--text)}\n.ex-ltbl td{color:#111 !important;background:#fff}\n.ex-ltbl tr.ex-trsum td{background:#EFF6FF !important}\n.ex-ib-edit{background:#F1F5F9 !important}\n.ex-dmeta b{color:var(--text)}\n@media (max-width:860px){.ex-head{flex-direction:column;gap:10px}\n.ex-meta{width:100%}\n.ex-fld{flex:1 1 150px}\n.ex-fld input{width:100%}\n.ex-title h2{font-size:19px}\n.ex-sum{grid-template-columns:1fr;gap:10px}\n.ex-card-bd b,.ex-card-bd input{font-size:21px}\n.ex-bar{flex-direction:column;align-items:stretch}\n.ex-bar .btn{width:100%;justify-content:center;min-height:46px}\n.ex-bar-r{flex-direction:column}\n.ex-tbl{min-width:860px}\n.ex-ib{width:38px;height:38px}\n.ex-lfilter input{width:100%}}\n\n/* ===== 💰 ปิดค่าใช้จ่าย — เส้นตารางครบทุกช่อง ===== */\n:root{ --ex-line:#9AA7BD; --ex-line-soft:#C3CEDF; }\n\n/* ---- ตารางหลัก: กรอบนอก + เส้นทุกช่อง ---- */\n.ex-tbl{border-collapse:separate !important;border-spacing:0;\n  border:1.5px solid var(--ex-line) !important;border-radius:10px;overflow:hidden}\n.ex-tbl thead th{border-right:1px solid rgba(255,255,255,.45) !important;\n  border-bottom:1.5px solid var(--ex-line) !important}\n.ex-tbl thead th:last-child{border-right:0 !important}\n.ex-tbl tbody td{border-right:1px solid var(--ex-line-soft) !important;\n  border-bottom:1px solid var(--ex-line-soft) !important;border-top:0 !important;border-left:0 !important}\n.ex-tbl tbody td:last-child{border-right:0 !important}\n.ex-tbl tbody tr:last-child td{border-bottom:0 !important}\n\n/* ---- ช่องกรอกในเซลล์: มีกรอบของตัวเอง ไม่กลืนพื้น ---- */\n.ex-tbl input,.ex-tbl select{border:1.5px solid #B6C2D6 !important;border-radius:7px !important;\n  background:#fff !important;box-sizing:border-box}\n.ex-tbl input:focus,.ex-tbl select:focus{outline:0 !important;\n  border-color:#2563EB !important;box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}  /* layout ไม่ขยับ */\n.ex-tbl input.ex-bad,.ex-tbl select.ex-bad{border-color:#DC2626 !important;\n  box-shadow:0 0 0 2px rgba(220,38,38,.18) !important;background:#FEF2F2 !important}\n.ex-tbl tbody td{height:48px}\n.ex-tbl .ex-c-act{padding:4px 6px !important}\n\n/* ---- หน้าต่างรายการ / รายละเอียด ---- */\n.ex-ltbl{border-collapse:separate !important;border-spacing:0;\n  border:1.5px solid var(--ex-line) !important;border-radius:10px;overflow:hidden}\n.ex-ltbl th{border-right:1px solid rgba(255,255,255,.45) !important;\n  border-bottom:1.5px solid var(--ex-line) !important}\n.ex-ltbl th:last-child{border-right:0 !important}\n.ex-ltbl td{border-right:1px solid var(--ex-line-soft) !important;\n  border-bottom:1px solid var(--ex-line-soft) !important;border-top:0 !important;border-left:0 !important}\n.ex-ltbl td:last-child{border-right:0 !important}\n.ex-ltbl tr.ex-trsum td{border-top:1.5px solid var(--ex-line) !important;font-weight:700}\n.ex-lrow{cursor:pointer}\n.ex-lrow:hover td{background:#F1F6FF !important}\n\n/* ---- การ์ดสรุป 3 กล่อง: กรอบชัด ---- */\n.ex-card{border-width:1.5px !important;border-style:solid !important;\n  box-shadow:0 1px 2px rgba(16,24,40,.06)}\n.ex-card-adv{border-color:#93C5FD !important}\n.ex-card-spent{border-color:#FCA5A5 !important}\n.ex-card-bal{border-color:#6EE7B7 !important}\n.ex-card-bd input{border:1.5px solid #93C5FD !important}\n.ex-card-bd input:focus{outline:0;border-color:#2563EB !important;\n  box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}\n\n/* ---- ฟิลด์หัวเอกสาร ---- */\n.ex-fld input{border:1.5px solid var(--ex-line-soft) !important}\n.ex-fld input:focus{outline:0;border-color:#2563EB !important;box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}\n.ex-dmeta>div{border-width:1.5px !important}\n\n/* ---- ปุ่มยกเลิกการแก้ไข / ปุ่มในรายละเอียด ---- */\n.ex-ib-cancel{background:#FEF3C7 !important;border-color:#FCD34D !important}\n.ex-btn-edit{background:#7C3AED}\n.ex-btn-rm{background:#DC2626}\n\n/* ---- มือถือ: เส้นต้องไม่หาย ---- */\n@media (max-width:860px){\n  .ex-tbl,.ex-ltbl{border-width:1.5px !important}\n  .ex-tbl tbody td,.ex-ltbl td{border-right:1px solid var(--ex-line-soft) !important;\n    border-bottom:1px solid var(--ex-line-soft) !important}\n  .ex-tbl thead th,.ex-ltbl th{border-right:1px solid rgba(255,255,255,.45) !important}\n  .ex-tbl input,.ex-tbl select{border-width:1.5px !important}\n}\n\n\n\n/* ===== 💰 ปิดค่าใช้จ่าย — หน้าหลัก + Modal ทำงาน ===== */\n.ex-head-acts{display:flex;gap:10px;flex-wrap:wrap}\n.ex-head-acts .btn{height:44px;padding:0 18px;border-radius:10px;font-weight:700;font-size:14.5px;\n  border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex-btn-new{background:#16A34A}\n.ex-btn-view{background:#2563EB}\n.ex-btn-save{background:#2563EB}\n.ex-btn-saverow{background:#2563EB}\n.ex-btn-cancel{background:#F59E0B}\n.ex-ib-xls{background:#DCFCE7 !important;border-color:#86EFAC !important}\n.ex-ib-pdf{background:#FEE2E2 !important;border-color:#FCA5A5 !important}\n.ex-home-tbl td.ex-c-act{white-space:nowrap;text-align:center}\n.ex-empty{padding:28px;text-align:center;color:var(--muted)}\n\n/* ---- Modal ทำงาน: ใหญ่กลางจอ ---- */\n#mx-ex-work .modal:has(.ex-workbody){max-width:1180px;width:96vw}\n.ex-workbody{max-height:calc(100vh - 150px);overflow:auto}\n.ex-workbody .ex-meta{margin-bottom:12px}\n.ex-workfoot{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;\n  padding-top:12px;border-top:1px solid var(--line)}\n.ex-workfoot .btn{height:46px;padding:0 20px;border-radius:10px;font-weight:700;border:0;cursor:pointer}\n.ex-workfoot .btn-secondary{border:1px solid var(--line)}\n\n/* ---- การ์ดเอกสาร (หน้าหลัก + รายงาน บนมือถือ) ---- */\n.ex-hcards{display:flex;flex-direction:column;gap:12px}\n.ex-hcard{border:1.5px solid var(--ex-line-soft);border-radius:12px;padding:12px;background:var(--card);cursor:pointer}\n.ex-hcard:active{background:#F1F6FF}\n.ex-hc-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.ex-hc-top b{font-size:15.5px}\n.ex-hc-sub{font-size:12.5px;color:var(--muted);margin:3px 0 9px}\n.ex-hc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}\n.ex-hc-n{border:1px solid var(--ex-line-soft);border-radius:8px;padding:6px 4px;text-align:center;min-width:0}\n.ex-hc-n label{display:block;font-size:10.5px;color:var(--muted)}\n.ex-hc-n b{font-size:12.5px;font-variant-numeric:tabular-nums;word-break:break-all}\n.ex-hc-adv{background:#EFF6FF;border-color:#BFDBFE}\n.ex-hc-sp{background:#FEF2F2;border-color:#FECACA}\n.ex-hc-bl{background:#ECFDF5;border-color:#A7F3D0}\n.ex-hc-adv b,.ex-hc-adv label{color:#1D4ED8}\n.ex-hc-sp b,.ex-hc-sp label{color:#DC2626}\n.ex-hc-bl b,.ex-hc-bl label{color:#047857}\n.ex-hc-acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}\n.ex-hc-acts .btn{height:40px;border-radius:9px;border:0;color:#fff;font-weight:700;font-size:13px;cursor:pointer}\n\n/* ---- การ์ดรายการ (มือถือ ใน Modal ทำงาน) ---- */\n.ex-mcards{display:flex;flex-direction:column;gap:12px}\n.ex-mc{border:1.5px solid var(--ex-line-soft);border-radius:12px;padding:12px;background:#fff;color:#111}\n.ex-mc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}\n.ex-mc-head b{font-size:14.5px;color:#1E3A8A}\n.ex-mc-badge{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px}\n.ex-mc-badge.ok{background:#DCFCE7;color:#166534}\n.ex-mc-badge.wait{background:#FEF3C7;color:#92400E}\n.ex-mc-badge.edit{background:#EDE9FE;color:#5B21B6}\n.ex-mc-saved{background:#F8FAFC}\n.ex-mc-line{font-size:14px;margin-bottom:6px}\n.ex-mc-line b{color:#1E3A8A}\n.ex-mc-line span{color:#444}\n.ex-mc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;\n  font-size:13px;color:#444;padding:4px 0;border-top:1px dashed var(--ex-line-soft)}\n.ex-mc-row b{color:#111;font-variant-numeric:tabular-nums}\n.ex-mc-sum{font-size:16px;color:#4C1D95 !important;font-weight:800}\n.ex-mc-btns{display:flex;gap:6px}\n.ex-mf{display:block;font-size:12.5px;color:#475569;font-weight:600;margin-bottom:8px}\n.ex-mf .req{color:#DC2626}\n.ex-mf input,.ex-mf select{display:block;width:100%;height:44px;margin-top:4px;padding:0 10px;\n  border:1.5px solid #B6C2D6;border-radius:8px;background:#fff;color:#111;font-size:15px;box-sizing:border-box}\n.ex-mf input:focus,.ex-mf select:focus{outline:0;border-color:#2563EB;box-shadow:0 0 0 2px rgba(37,99,235,.18)}\n.ex-mf input.ex-bad,.ex-mf select.ex-bad{border-color:#DC2626;background:#FEF2F2;box-shadow:0 0 0 2px rgba(220,38,38,.18)}\n.ex-mf input.ex-in-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-mf2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n.ex-mc-total{display:flex;align-items:center;justify-content:space-between;\n  background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:9px;padding:8px 12px;margin-bottom:10px}\n.ex-mc-total label{font-size:12.5px;color:#5B21B6;font-weight:600}\n.ex-mc-total b{font-size:19px;color:#4C1D95;font-weight:800;font-variant-numeric:tabular-nums}\n.ex-mc-acts{display:grid;grid-template-columns:1fr auto;gap:8px}\n.ex-mc-acts .btn{height:46px;border-radius:9px;border:0;color:#fff;font-weight:700;font-size:14px;\n  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 16px}\n\n@media (max-width:860px){\n  .ex-head-acts{width:100%}\n  .ex-head-acts .btn{flex:1;justify-content:center;min-height:46px}\n  #mx-ex-work .modal:has(.ex-workbody){width:100vw;max-width:100vw;border-radius:0}\n  /* เผื่อที่ให้แถบปุ่มล่างแบบ sticky ไม่ทับเนื้อหา */\n  .ex-workbody{max-height:calc(100vh - 110px);padding-bottom:4px}\n  .ex-workfoot{position:sticky;bottom:0;z-index:3;margin:14px -16px 0;padding:10px 16px;\n    background:var(--card);border-top:1.5px solid var(--line);\n    box-shadow:0 -6px 16px rgba(0,0,0,.18)}\n  .ex-workfoot .btn{flex:1;min-height:48px}\n  .ex-mcards{padding-bottom:4px}\n  .ex-mc-acts .btn{min-height:48px}\n  .ex-bar{margin-top:10px}\n}\n\n\n\n/* คอลัมน์บริษัทในตารางหน้าแรก */\n.ex-home-tbl td.ex-c-co2{max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.ex-dacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.ex-dacts .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;border:0;cursor:pointer;color:#fff}\n.ex-dacts .btn-secondary{border:1px solid var(--line)}\n\n\n/* ตารางหน้าแรก 9 คอลัมน์ — กว้างพอดี Desktop · ตัวเลขชิดขวา */\n.ex-home-tbl{min-width:1040px}\n.ex-home-tbl th{white-space:nowrap}\n.ex-home-tbl td.ex-money{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}\n.ex-home-tbl td.ex-c-co2{max-width:200px}\n.ex-home-tbl td.ex-c-act{width:104px;white-space:nowrap;text-align:center}\n\n\n/* ===== 💰 ปิดค่าใช้จ่าย — ธีมสว่าง (เฉพาะ Desktop · ไม่แตะ Mobile และเมนูอื่น) ===== */\n@media (min-width:861px){\n\n  /* --- พื้นหลังหน้าหลัก: ครอบทั้งพื้นที่ ไม่ให้เหลือสีดำ --- */\n  .main:has(.ex-wrap){background:#F5F8FF !important}\n  #view-root:has(.ex-wrap){background:#F5F8FF !important;min-height:100%}\n  .content.ex-wrap{\n    background:#F5F8FF !important;\n    min-height:100vh;\n  }\n  .content.ex-wrap .ex-title h2{color:#1E3A8A !important}\n  .content.ex-wrap .ex-title p{color:#5B6B86 !important}\n\n  /* แถบหัวหน้า: พื้นขาว ตัวอักษรกรมท่า */\n  .content.ex-wrap .ex-head{\n    background:#fff;border:1px solid #DCE4F2;border-radius:12px;\n    padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)\n  }\n\n  /* กล่องตาราง: ขาว ขอบเทาอ่อน มุมโค้ง 12px */\n  .content.ex-wrap .panel.ex-panel{\n    background:#fff !important;border:1px solid #DCE4F2 !important;\n    border-radius:12px !important;overflow:hidden;\n    box-shadow:0 1px 3px rgba(16,24,40,.06)\n  }\n\n  /* --- ตารางหน้าหลัก --- */\n  .ex-home-tbl{border:0 !important;border-radius:12px !important;background:#fff}\n  .ex-home-tbl thead th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;\n    color:#fff !important;border-bottom:0 !important;\n    border-right:1px solid rgba(255,255,255,.28) !important;\n    padding:13px 10px;font-size:13.5px\n  }\n  .ex-home-tbl thead th:last-child{border-right:0 !important}\n  .ex-home-tbl tbody td{\n    background:#fff !important;color:#17233B !important;\n    border-right:1px solid #E6ECF7 !important;\n    border-bottom:1px solid #E6ECF7 !important;\n    padding:13px 10px;font-size:14px\n  }\n  .ex-home-tbl tbody td:last-child{border-right:0 !important}\n  .ex-home-tbl tbody tr:last-child td{border-bottom:0 !important}\n  /* สลับฟ้าอ่อนเมื่อมีหลายรายการ */\n  .ex-home-tbl tbody tr:nth-child(even) td{background:#F7FAFF !important}\n  .ex-home-tbl tbody tr:hover td{background:#EAF2FF !important}\n  .ex-home-tbl tbody td b{color:#13233F}\n  .ex-home-tbl tbody td.ex-neg,.ex-home-tbl tbody td.ex-neg b{color:#DC2626 !important}\n\n  /* --- หน้าต่างรายงาน / รายการ: พื้นขาว --- */\n  #mx-ex-detail .modal:has(.ex-ltbl),\n  #mx-ex-detail .modal:has(.ex-dmeta),\n  #mx-ex-work .modal:has(.ex-workbody){\n    background:#fff !important;border-color:#DCE4F2 !important\n  }\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head{\n    background:#fff !important;border-bottom:1px solid #E6ECF7 !important\n  }\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head h2,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head h2,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head h2{color:#1E3A8A !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head .sub,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head .sub,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head .sub{color:#5B6B86 !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-body,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-body,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-body{background:#fff !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .x,\n  #mx-ex-detail .modal:has(.ex-dmeta) .x,\n  #mx-ex-work .modal:has(.ex-workbody) .x{background:#F1F5FC !important;color:#334155 !important}\n\n  /* ตารางในหน้าต่าง: หัวน้ำเงินแบบเดียวกัน */\n  #mx-ex-detail .ex-ltbl,#mx-ex-work .ex-ltbl{border:1px solid #DCE4F2 !important;border-radius:12px !important}\n  #mx-ex-detail .ex-ltbl th,#mx-ex-work .ex-ltbl th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;color:#fff !important;\n    border-right:1px solid rgba(255,255,255,.28) !important;border-bottom:0 !important\n  }\n  #mx-ex-detail .ex-ltbl th:last-child,#mx-ex-work .ex-ltbl th:last-child{border-right:0 !important}\n  #mx-ex-detail .ex-ltbl td,#mx-ex-work .ex-ltbl td{\n    background:#fff !important;color:#17233B !important;\n    border-right:1px solid #E6ECF7 !important;border-bottom:1px solid #E6ECF7 !important\n  }\n  #mx-ex-detail .ex-ltbl tbody tr:nth-child(even) td{background:#F7FAFF !important}\n  #mx-ex-detail .ex-ltbl tr.ex-trsum td{background:#EAF2FF !important;border-top:1.5px solid #C7D7F0 !important}\n  #mx-ex-detail .ex-ltbl td:last-child,#mx-ex-work .ex-ltbl td:last-child{border-right:0 !important}\n\n  /* กล่องสรุปในหน้าต่างรายงาน */\n  #mx-ex-detail .ex-dmeta>div{background:#F7FAFF !important;border-color:#DCE4F2 !important}\n  #mx-ex-detail .ex-dmeta label{color:#5B6B86 !important}\n  #mx-ex-detail .ex-dmeta b{color:#13233F !important}\n  #mx-ex-detail .ex-dmeta b.ex-neg{color:#DC2626 !important}\n\n  /* ช่องค้นหาในหน้าต่างรายการ */\n  #mx-ex-detail .ex-lfilter input{background:#fff !important;color:#17233B !important;border-color:#DCE4F2 !important}\n\n  /* ตารางกรอกใน Modal เปิดงาน: หัวน้ำเงินไล่เฉดให้เข้าชุด */\n  #mx-ex-work .ex-tbl thead th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;\n    border-bottom:0 !important\n  }\n  #mx-ex-work .ex-workbody .ex-fld label{color:#5B6B86 !important}\n  #mx-ex-work .ex-workbody .ex-fld input{background:#fff !important;color:#17233B !important}\n  #mx-ex-work .ex-workbody .ex-fld input.ex-ro{background:#F7FAFF !important}\n  #mx-ex-work .ex-workfoot{background:#fff !important;border-top-color:#E6ECF7 !important}\n  #mx-ex-work .ex-workfoot .btn-secondary{background:#F1F5FC !important;color:#334155 !important;border-color:#DCE4F2 !important}\n  #mx-ex-detail .ex-dacts .btn-secondary{background:#F1F5FC !important;color:#334155 !important;border-color:#DCE4F2 !important}\n\n  /* ตารางในหน้าต่างไม่ล้นจอ */\n  #mx-ex-detail .modal:has(.ex-dmeta),#mx-ex-detail .modal:has(.ex-ltbl){max-width:1120px;width:94vw}\n}\n\n\n\n/* ===== หัวตารางรายงาน: พื้นเดียวกันทุกช่อง ไม่มี Gradient (ทั้งคอมและมือถือ) ===== */\n.ex-home-tbl thead th,\n.ex-ltbl thead th, .ex-ltbl th,\n.ex-tbl thead th{\n  background:#EAF2FC !important;\n  background-image:none !important;          /* ยกเลิก Gradient เดิม */\n  color:#24466B !important;\n  border-right:1px solid #DCE5F0 !important;\n  border-bottom:1px solid #DCE5F0 !important;\n  font-weight:700;\n}\n.ex-home-tbl thead th:last-child,\n.ex-ltbl thead th:last-child, .ex-ltbl th:last-child,\n.ex-tbl thead th:last-child{ border-right:1px solid #DCE5F0 !important }\n/* เส้นตารางให้เท่ากันทุกช่อง */\n.ex-home-tbl, .ex-ltbl, .ex-tbl{ border:1px solid #DCE5F0 !important }\n.ex-home-tbl tbody td, .ex-ltbl tbody td, .ex-tbl tbody td{\n  border-right:1px solid #DCE5F0 !important;\n  border-bottom:1px solid #DCE5F0 !important;\n}\n.ex-home-tbl tbody tr:last-child td, .ex-ltbl tbody tr:last-child td{ border-bottom:0 !important }\n";
var PICK_CSS = [
  '#mx-ex-pick .modal{max-width:980px}',
  '.ex-pk-search{display:flex;gap:8px;margin-bottom:10px}',
  '.ex-pk-search input{flex:1;height:40px;border-radius:10px;border:1px solid var(--border);background:var(--bg2,#0f1623);color:var(--text);padding:0 12px;font-size:14px}',
  '.ex-pk-wrap{max-height:56vh;overflow:auto;border:1px solid var(--border);border-radius:12px}',
  '.ex-pk-tbl{width:100%;border-collapse:collapse;font-size:13.5px}',
  '.ex-pk-tbl th{position:sticky;top:0;background:#EAF2FC;color:#1E3A8A;font-weight:700;padding:9px 10px;text-align:left;border-bottom:1px solid var(--ex-line,#9AA7BD);white-space:nowrap;z-index:1}',
  '.ex-pk-tbl td{padding:9px 10px;border-bottom:1px solid var(--border-soft,#223);vertical-align:top}',
  '.ex-pk-tbl tr{cursor:pointer}',
  '.ex-pk-tbl tr.on td{background:rgba(59,130,246,.14)}',
  '.ex-pk-tbl input[type=checkbox]{width:18px;height:18px;cursor:pointer}',
  '.ex-pk-c-chk,.ex-pk-c-no{width:44px;text-align:center}',
  '.ex-pk-sub{color:var(--muted);font-size:12px;margin-top:2px;white-space:pre-line;max-height:3.2em;overflow:hidden}',
  '.ex-pk-foot{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-top:12px}',
  '.ex-pk-foot .ex-pk-r{display:flex;gap:8px;flex-wrap:wrap}',
  '.ex-pk-cnt{color:var(--muted);font-size:13px}',
  '.ex-pk-empty{padding:28px;text-align:center;color:var(--muted)}',
  '.ex-lock{display:inline-block;padding:6px 8px;border-radius:8px;background:rgba(148,163,184,.10);min-width:60px}',
  '@media (max-width:860px){#mx-ex-pick .modal{max-width:100%}.ex-pk-tbl .ex-pk-c-term,.ex-pk-tbl .ex-pk-c-date{display:none}}',
  /* Desktop: ธีมสว่างเดียวกับหน้าต่างปิดค่าใช้จ่าย */
  '@media (min-width:861px){#mx-ex-pick .modal{background:#fff !important;border-color:#DCE4F2 !important}#mx-ex-pick .modal-head{background:#fff !important;border-bottom:1px solid #E6ECF7 !important}#mx-ex-pick .modal-head h2{color:#1E3A8A !important}#mx-ex-pick .modal-head .sub{color:#5B6B86 !important}#mx-ex-pick .modal-body{background:#fff !important}#mx-ex-pick .x{background:#F1F5FC !important;color:#334155 !important}#mx-ex-pick .ex-pk-search input{background:#fff;color:#0f172a;border-color:#C3CEDF}#mx-ex-pick .ex-pk-wrap{border-color:#C3CEDF}#mx-ex-pick .ex-pk-tbl td{color:#0f172a;background:#fff;border-bottom-color:#E6ECF7}#mx-ex-pick .ex-pk-tbl tr.on td{background:#EAF2FC}#mx-ex-pick .ex-pk-sub,#mx-ex-pick .ex-pk-cnt,#mx-ex-pick .ex-pk-empty{color:#5B6B86}#mx-ex-pick .btn-secondary{background:#F1F5FC;color:#334155;border:1px solid #DCE4F2}}'
].join('\n');

function _exInjectCss(){
  if(document.getElementById('mx-ex-css')) return;
  var st=document.createElement('style'); st.id='mx-ex-css';
  st.textContent = EX_CSS + '\n' + PICK_CSS;
  document.head.appendChild(st);
}
/* Modal ของโหมดนี้เอง (ไม่ใช้ modal-detail ของ WORK เพื่อไม่ชน flow เดิม) */
function _exEnsureModals(){
  [['mx-ex-work','modal'],['mx-ex-detail','modal modal-lg'],['mx-ex-pick','modal modal-lg'],['mx-ex-confirm','modal']].forEach(function(p){
    if(document.getElementById(p[0])) return;
    var d=document.createElement('div'); d.id=p[0]; d.className='modal-back';
    d.innerHTML='<div class="'+p[1]+'"></div>';
    document.body.appendChild(d);
  });
}

/* ---------- helpers (เทียบเท่า SHIPPING FZ) ---------- */
const EXP_PLACES_OTHER = 'อื่นๆ';
function EXP_PLACES(){
  var base = (typeof TERMINAL_DROPDOWN_OPTS!=='undefined' ? TERMINAL_DROPDOWN_OPTS.map(function(o){return o[0];}) : []);
  return base.concat([EXP_PLACES_OTHER]);
}
function _pad(n){ return String(n).padStart(2,'0'); }
function fmtDateEx(s){ if(!s) return '—'; const d=new Date(String(s).slice(0,10)+'T00:00:00'); if(isNaN(d)) return s; return _pad(d.getDate())+'/'+_pad(d.getMonth()+1)+'/'+d.getFullYear(); }
function fmtDateTimeEx(s){ if(!s) return '—'; const d=new Date(s); if(isNaN(d)) return '—'; return _pad(d.getDate())+'/'+_pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+_pad(d.getHours())+':'+_pad(d.getMinutes()); }
function _vpMobile(){ return window.innerWidth<=860; }
function uname(){ const u=S.user||{}; return u.full_name||u.username||''; }
function _exRole(){ return String((S.user&&S.user.role)||'').toUpperCase().trim(); }
function canEditExpense(){ return !!S.user && _exRole()!=='MESSENGER'; }
function canDeleteExpense(){ const r=_exRole(); return r==='SUPER_ADMIN'||r==='ADMIN'; }
function _exTok(){ return (typeof _msTok==='function') ? _msTok() : null; }
async function _rpc(fn, args){
  const r = await sb.rpc(fn, Object.assign({ p_token:_exTok() }, args||{}));
  if(r.error){
    try{ if(typeof _msIsSessionErr==='function' && _msIsSessionErr(r.error) && typeof _msSessionLost==='function') _msSessionLost(); }catch(_){}
    throw r.error;
  }
  return r.data;
}
/* เปิด/ปิด Modal ของโหมดนี้โดยตรง (ไม่ผูก history ของ openModal เดิม — Modal ซ้อนกันได้โดยไม่ปิดตัวล่าง) */
function openM(id){ _exEnsureModals(); const m=document.getElementById(id); if(m) m.classList.add('show'); refreshIconsEx(m); }
function closeM(id){ const m=document.getElementById(id); if(m) m.classList.remove('show'); }
function _mbox(id){ _exEnsureModals(); return document.getElementById(id).querySelector('.modal'); }
function refreshIconsEx(el){ try{ if(typeof refreshIcons==='function') refreshIcons(el); }catch(_){} }

/* confirmDialog แบบ SHIPPING FZ (Promise) */
let _cfRes=null;
function confirmDialog(opts){
  return new Promise(function(res){
    const o=opts||{}; const title=o.title||'ยืนยัน', message=o.message||'', okLabel=o.okLabel||'ยืนยัน', okClass=o.okClass||'btn-primary';
    _cfRes=res;
    _mbox('mx-ex-confirm').innerHTML = `
      <div class="modal-head"><div><h2>${esc(title)}</h2></div><button class="x" onclick="_exConfirmResolve(false)">✕</button></div>
      <div class="modal-body"><div style="font-size:14px;line-height:1.6;color:#cbd5e1">${message}</div></div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="_exConfirmResolve(false)">ยกเลิก</button>
        <button class="btn ${okClass}" onclick="_exConfirmResolve(true)">${esc(okLabel)}</button>
      </div>`;
    openM('mx-ex-confirm');
  });
}
window._exConfirmResolve=function(v){ closeM('mx-ex-confirm'); const r=_cfRes; _cfRes=null; if(r) r(!!v); };

const EX = {
  doc: null,          // เอกสารปัจจุบัน
  items: [],          // รายการที่บันทึกแล้ว (เป็นฐานของยอดสรุปเสมอ)
  drafts: [],         // แถวที่ยังไม่บันทึก (ไม่นับรวมยอด ไม่ export)
  editing: new Set(), // id ของรายการที่กำลังแก้ไข — ยังอยู่ใน items ยอดจึงไม่เปลี่ยนก่อนบันทึก
  busy: new Set(),    // กันกดซ้ำรายแถว
  loading: false
};
let _exDraftSeq = 0;

function _exMoney(n){
  const v = Number(n||0);
  return v.toLocaleString('th-TH',{minimumFractionDigits:2, maximumFractionDigits:2});
}
function _exNum(v){
  const n = parseFloat(String(v==null?'':v).replace(/,/g,'').trim());
  return isFinite(n) ? n : 0;
}
function _exToday(){ const d=new Date(); return d.getFullYear()+'-'+_pad(d.getMonth()+1)+'-'+_pad(d.getDate()); }

/* ============================================================
   💰 ปิดค่าใช้จ่าย — หน้าหลัก = รายการเอกสาร (ไม่เปิดฟอร์มทันที)
   ============================================================ */
async function renderExpense(){
  _exInjectCss(); _exEnsureModals();
  const root = $('view-root');
  root.innerHTML = `<div class="content"><div class="panel" style="padding:28px;text-align:center;color:var(--muted)">
    <span class="spinner"></span> กำลังโหลด...</div></div>`;
  await exListLoad();
  exHomeRender();
}

function exRender(){
  if(_exWorkOpen()) return exWorkRender();
  if(S.view==='expense') return exHomeRender();
}
function _exWorkOpen(){
  const m = $('mx-ex-work');
  return !!(m && m.classList.contains('show') && m.querySelector('[data-ex-work]'));
}

function _exCoLabel(docId){
  const list = (EXL.co && EXL.co[docId]) || [];
  if(!list.length) return '—';
  return list.length===1 ? list[0] : `${list[0]} +${list.length-1}`;
}
function _exCoFull(docId){
  const list = (EXL.co && EXL.co[docId]) || [];
  return list.join(' · ');
}
function exHomeRender(){
  const root = $('view-root'); if(!root) return;
  if(S.view!=='expense') return;
  const rows = EXL.rows || [];
  const mob  = _vpMobile();

  const table = `
    <div class="ex-tblwrap">
      <table class="tbl ex-ltbl ex-home-tbl">
        <thead><tr>
          <th>เลขที่เอกสาร</th><th>วันที่</th><th>ผู้ปิดค่าใช้จ่าย</th><th>บริษัท</th>
          <th>จำนวนรายการ</th><th>เบิกเงิน (บาท)</th><th>ใช้ไป (บาท)</th>
          <th>เงินคงเหลือ (บาท)</th><th>จัดการ</th>
        </tr></thead>
        <tbody>${rows.length ? rows.map(r=>`
          <tr class="ex-lrow" title="คลิกเพื่อเปิดแก้ไขเอกสารนี้" onclick="exEditDoc('${esc(r.id)}')">
            <td><b>${esc(r.doc_no||'')}</b></td>
            <td>${r.expense_date?esc(fmtDateEx(r.expense_date)):'—'}</td>
            <td>${esc(r.closer_name||'—')}</td>
            <td class="ex-c-co2" title="${esc(_exCoFull(r.id))}">${esc(_exCoLabel(r.id))}</td>
            <td style="text-align:center">${r.items_count||0}</td>
            <td class="ex-money">${_exMoney(r.advance_amount)}</td>
            <td class="ex-money">${_exMoney(r.spent_total)}</td>
            <td class="ex-money ${_exNum(r.balance)<0?'ex-neg':''}"><b>${_exMoney(r.balance)}</b></td>
            <td class="ex-c-act" onclick="event.stopPropagation()">
              ${canDeleteExpense()?`<button class="ex-ib ex-ib-del" title="ลบ" onclick="event.stopPropagation();exDeleteDoc('${esc(r.id)}','${esc(r.doc_no||'')}')">🗑️</button>`:''}
            </td>
          </tr>`).join('')
          : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px">ยังไม่มีเอกสาร — กด "เปิดงาน" เพื่อเริ่ม</td></tr>`}
        </tbody>
      </table>
    </div>`;

  const cards = rows.length ? rows.map(r=>`
    <div class="ex-hcard" onclick="exOpenDetail('${esc(r.id)}')">
      <div class="ex-hc-top">
        <b>${esc(r.doc_no||'')}</b>
        <span class="ex-st">${esc(r.status||'ปกติ')}</span>
      </div>
      <div class="ex-hc-sub">${r.expense_date?esc(fmtDateEx(r.expense_date)):'—'} · ${esc(r.closer_name||'—')}</div>
      <div class="ex-hc-grid">
        <div class="ex-hc-n"><label>รายการ</label><b>${r.items_count||0}</b></div>
        <div class="ex-hc-n ex-hc-adv"><label>เบิกเงิน</label><b>${_exMoney(r.advance_amount)}</b></div>
        <div class="ex-hc-n ex-hc-sp"><label>ใช้ไป</label><b>${_exMoney(r.spent_total)}</b></div>
        <div class="ex-hc-n ex-hc-bl"><label>คงเหลือ</label><b class="${_exNum(r.balance)<0?'ex-neg':''}">${_exMoney(r.balance)}</b></div>
      </div>
      <div class="ex-hc-acts" onclick="event.stopPropagation()">
        <button class="btn ex-btn-view" onclick="exOpenDetail('${esc(r.id)}')">👁 ดู</button>
        <button class="btn ex-btn-xls"  onclick="exExportExcel('${esc(r.id)}')">📊 Excel</button>
        <button class="btn ex-btn-pdf"  onclick="exExportPDF('${esc(r.id)}')">📄 PDF</button>
      </div>
    </div>`).join('')
    : `<div class="ex-empty">ยังไม่มีเอกสาร — กด "เปิดงานใหม่" เพื่อเริ่ม</div>`;

  root.innerHTML = `
    <div class="content ex-wrap">
      <div class="ex-head">
        <div class="ex-title"><span class="ex-ic">💰</span>
          <div><h2>ปิดค่าใช้จ่าย</h2><p>จัดการปิดค่าใช้จ่าย และส่งออกเอกสารสรุป</p></div>
        </div>
        <div class="ex-head-acts">
          ${canEditExpense()?`<button class="btn ex-btn-new"  onclick="exOpenNewWork()">➕ เปิดงาน</button>`:''}
          <button class="btn ex-btn-list" onclick="exOpenList()">📋 รายงานปิดค่าใช้จ่าย</button>
        </div>
      </div>
      <div class="panel ex-panel">${mob ? `<div class="ex-hcards">${cards}</div>` : table}</div>
    </div>`;
  refreshIconsEx(root);
}

/* ---------- เปิดงานใหม่ ---------- */
/* ➕ เปิดงาน — เปิดหน้าต่างกรอกข้อมูลอย่างเดียว ไม่เขียนฐานข้อมูลใด ๆ
   เอกสารจริงจะถูกสร้าง "ตอนกด 💾 บันทึกรายการ แถวแรก" เท่านั้น (_exEnsureDoc) */
async function exOpenNewWork(){
  if(!canEditExpense()){ toast('ไม่มีสิทธิ์ปิดค่าใช้จ่าย','error'); return; }
  try{
    let preview = '';
    try{
      const dn = await _rpc('ms_expense_next_no', { p_date: _exToday() });
      preview = (typeof dn === 'string') ? dn : (Array.isArray(dn) ? dn[0] : (dn||''));
    }catch(_){ preview = ''; }
    EX.doc = {
      id: null, pending: true,
      doc_no: preview || '(ออกเลขเมื่อบันทึก)',
      expense_date: _exToday(),
      closer_user: String((S.user&&S.user.id)||''),
      closer_name: uname(),
      advance_amount: 0
    };
    EX.items = []; EX.drafts = []; EX.editing = new Set();
    exOpenWorkModal();
  }catch(e){ console.error(e); toast('เปิดงานใหม่ไม่สำเร็จ: '+(e.message||''),'error'); }
}

let _exCreating = null;
async function _exEnsureDoc(){
  if(EX.doc && EX.doc.id) return EX.doc;
  if(_exCreating) return _exCreating;
  _exCreating = (async ()=>{
    const row = await _rpc('ms_expense_doc_open', {
      p_date: (EX.doc&&EX.doc.expense_date) || _exToday(),
      p_advance: _exNum(EX.doc && EX.doc.advance_amount)
    });
    EX.doc = Object.assign({}, row, { pending:false });
    return EX.doc;
  })();
  try{ return await _exCreating; } finally { _exCreating = null; }
}

function exOpenWorkModal(){
  openM('mx-ex-work');
  exWorkRender();
}

/* ---------- ปิด Modal อย่างปลอดภัย (เตือนถ้ามีร่างค้าง) ---------- */
function _exDraftFilled(d){
  return d.editId || d.src_id || String(d.job_no||'').trim() || String(d.company||'').trim()
      || String(d.cost_amount||'').trim() || String(d.receipt_amount||'').trim();
}
async function exCloseWork(){
  const pending = EX.drafts.filter(_exDraftFilled);
  if(pending.length){
    const ok = await confirmDialog({
      title:'ยังมีรายการที่ยังไม่บันทึก',
      message:`มี <b>${pending.length}</b> รายการที่ยังไม่ได้กด 💾 บันทึก<br>ถ้าปิดตอนนี้ รายการเหล่านั้นจะหายไป (รายการที่บันทึกแล้วยังอยู่ครบ)`,
      okLabel:'ปิดโดยไม่บันทึก', okClass:'btn-danger'
    });
    if(!ok) return;
  }
  EX.drafts = []; EX.editing = new Set();
  closeM('mx-ex-work');
  await exListReload();
  exHomeRender();
}

/* 💾 บันทึก = บันทึกทุกแถวที่กรอกค้าง (ครั้งเดียว) แล้วปิดงานใบนี้ กลับหน้าหลัก */
let _exSavingWork = false;
async function exSaveWork(){
  if(_exSavingWork) return;
  _exSavingWork = true;
  try{
    // แถวที่กรอกแล้ว (รวม JOB ที่เลือก) → บันทึกทีละแถวตามลำดับ · ผิดแถวไหนหยุดที่แถวนั้น (ไฮไลต์)
    const keys = EX.drafts.filter(_exDraftFilled).map(d=>d.key);
    for(const k of keys){
      const ok = await exSaveDraft(k, true);
      if(!ok) return;
    }
    // แถวเปล่าที่ไม่ได้กรอก → ทิ้งได้
    EX.drafts = EX.drafts.filter(_exDraftFilled);
    if(!EX.items.length){
      toast('ยังไม่มีรายการที่บันทึก — เลือก JOB หรือกรอกรายการก่อน','error');
      exRender();
      return;
    }
    const docId = EX.doc && EX.doc.id;
    if(!docId){ toast('ไม่พบเอกสาร','error'); return; }
    EX.drafts = []; EX.editing = new Set();
    closeM('mx-ex-work');
    await exListReload();
    exHomeRender();
    toast('บันทึกงาน '+((EX.doc&&EX.doc.doc_no)||'')+' แล้ว','success');
    await exOpenDetail(docId);
  } finally { _exSavingWork = false; }
}

/* ---------- UI ทำงาน (ใน Modal) ---------- */
function exWorkRender(){
  const m = $('mx-ex-work'); if(!m) return;
  const d = EX.doc||{};

  const spent   = EX.items.reduce((s,x)=>s+_exNum(x.total_amount),0);
  const advance = _exNum(d.advance_amount);
  const balance = advance - spent;
  const mob     = _vpMobile();

  const rowsHtml = `
    ${EX.items.map((it,i)=>{
       const dr = EX.drafts.find(x=>x.editId===it.id);
       return dr ? exRowDraft(dr, i+1) : exRowSaved(it, i+1);
     }).join('')}
    ${EX.drafts.filter(x=>!x.editId).map((dr,i)=>exRowDraft(dr, EX.items.length+i+1)).join('')}`;

  const emptyRow = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">
      <div style="font-size:26px;opacity:.6">📄</div>ยังไม่มีรายการ — กด ➕ เพิ่มรายการ</td></tr>`;
  const deskTable = `
    <div class="ex-tblwrap">
      <table class="tbl ex-tbl">
        <thead><tr>
          <th class="ex-c-no">ลำดับ</th><th class="ex-c-job">Job N</th><th class="ex-c-co">บริษัท</th>
          <th class="ex-c-cost">ค่าใช้จ่าย (ต้นทุน)</th><th class="ex-c-rcp">+ ยอดใบเสร็จ =</th>
          <th class="ex-c-sum">ยอดรวม (บาท)</th><th class="ex-c-place">สถานที่</th><th class="ex-c-act">จัดการ</th>
        </tr></thead>
        <tbody>${rowsHtml.trim() ? rowsHtml : emptyRow}</tbody>
      </table>
    </div>`;

  const mobInner = `${EX.items.map((it,i)=>{
         const dr = EX.drafts.find(x=>x.editId===it.id);
         return dr ? exCardDraft(dr, i+1) : exCardSaved(it, i+1);
       }).join('')}
      ${EX.drafts.filter(x=>!x.editId).map((dr,i)=>exCardDraft(dr, EX.items.length+i+1)).join('')}`;
  const mobCards = `<div class="ex-mcards">${mobInner.trim() ? mobInner : `<div class="ex-empty">ยังไม่มีรายการ — กด ➕ เพิ่มรายการ</div>`}</div>`;

  m.querySelector('.modal').innerHTML = `
    <div class="modal-head" data-ex-work="1">
      <div><h2>💰 ปิดค่าใช้จ่าย</h2><p class="sub">กรอกรายการแล้วกด 💾 บันทึกทีละรายการ</p></div>
      <button class="x" onclick="exCloseWork()">✕</button>
    </div>
    <div class="modal-body ex-workbody">
      <div class="ex-meta">
        <div class="ex-fld"><label>เลขที่เอกสาร</label>
          <input type="text" value="${esc(d.doc_no||'—')}" readonly class="ex-ro"></div>
        <div class="ex-fld"><label>วันที่ปิดค่าใช้จ่าย</label>
          <input type="date" id="ex-date" value="${esc(d.expense_date||_exToday())}" onchange="exSaveHead()"></div>
        <div class="ex-fld"><label>ผู้ปิดค่าใช้จ่าย</label>
          <input type="text" value="${esc(d.closer_name||'')}" readonly class="ex-ro"></div>
      </div>

      ${mob ? mobCards : deskTable}

      <div class="ex-bar">
        <button class="btn ex-btn-add" onclick="exOpenPicker()">➕ เพิ่มรายการ</button>
        <div class="ex-bar-r">
          <button class="btn ex-btn-list" onclick="exOpenList()">📋 รายงาน</button>
          <button class="btn ex-btn-xls" onclick="exExportExcel()">📊 Excel</button>
          <button class="btn ex-btn-pdf" onclick="exExportPDF()">📄 PDF</button>
        </div>
      </div>

      <div class="ex-sum">
        <div class="ex-card ex-card-adv"><div class="ex-card-ic">💳</div>
          <div class="ex-card-bd"><label>เบิกเงิน (บาท)</label>
            <input type="text" inputmode="decimal" id="ex-adv" value="${_exMoney(advance)}"
                   onchange="exSaveAdvance()" onfocus="this.select()"></div></div>
        <div class="ex-card ex-card-spent"><div class="ex-card-ic">➡️</div>
          <div class="ex-card-bd"><label>ใช้ไป (บาท)</label><b>${_exMoney(spent)}</b></div></div>
        <div class="ex-card ex-card-bal"><div class="ex-card-ic">💵</div>
          <div class="ex-card-bd"><label>เงินคงเหลือ (บาท)</label>
            <b class="${balance<0?'ex-neg':''}">${_exMoney(balance)}</b></div></div>
      </div>

      <div class="ex-workfoot">
        <button class="btn btn-secondary" onclick="exCloseWork()">✖ ยกเลิก</button>
        <button class="btn ex-btn-save" onclick="exSaveWork()">💾 บันทึก</button>
      </div>
    </div>`;
  refreshIconsEx(m);
}

/* ---------- ช่องกรอก (JOB ที่เลือกจากระบบ = Job N / บริษัท / สถานที่ ล็อก ดึงอัตโนมัติ) ---------- */
function _exLockCell(v){ return `<span class="ex-ro-cell ex-lock" title="ดึงจากระบบอัตโนมัติ">${esc(v||'—')}</span>`; }
function _exPlaceLocked(dr){ return !!(dr.src_id && String(dr.src_place||'').trim()); }

/* ---------- การ์ดมือถือ: รายการที่บันทึกแล้ว ---------- */
function exCardSaved(it, no){
  const busy = EX.busy.has(it.id);
  return `<div class="ex-mc ex-mc-saved" data-ex-item="${esc(it.id)}">
    <div class="ex-mc-head">
      <b>รายการที่ ${no}</b>
      <span class="ex-mc-badge ok">✅ บันทึกแล้ว</span>
    </div>
    <div class="ex-mc-line"><b>${esc(it.job_no||'')}</b> <span>${esc(it.company||'')}</span></div>
    <div class="ex-mc-row">
      <span>ต้นทุน <b>${_exMoney(it.cost_amount)}</b></span>
      <span>ใบเสร็จ <b>${_exMoney(it.receipt_amount)}</b></span>
    </div>
    <div class="ex-mc-row"><span>ยอดรวม</span><b class="ex-mc-sum">${_exMoney(it.total_amount)}</b></div>
    <div class="ex-mc-row"><span>สถานที่ ${esc(it.place_name||'—')}</span>
      <span class="ex-mc-btns">
        <button class="ex-ib ex-ib-edit" ${busy?'disabled':''} onclick="exEditItem('${esc(it.id)}')">✏️</button>
        <button class="ex-ib ex-ib-del"  ${busy?'disabled':''} onclick="exDeleteItem('${esc(it.id)}')">🗑️</button>
      </span></div>
  </div>`;
}

/* ---------- การ์ดมือถือ: แถวที่กำลังกรอก/แก้ไข ---------- */
function exCardDraft(dr, no){
  const isOther = dr.place_code===EXP_PLACES_OTHER;
  const busy = EX.busy.has(dr.key);
  const total = _exNum(dr.cost_amount)+_exNum(dr.receipt_amount);
  const k = esc(dr.key);
  return `<div class="ex-mc ex-mc-draft" data-ex-draft="${k}">
    <div class="ex-mc-head">
      <b>รายการที่ ${no}</b>
      <span class="ex-mc-badge ${dr.editId?'edit':'wait'}">${dr.editId?'✏️ กำลังแก้ไข':'⚠️ ยังไม่บันทึก'}</span>
    </div>
    <label class="ex-mf">Job N <span class="req">*</span>
      ${dr.src_id ? _exLockCell(dr.job_no) : `<input type="text" data-f="job_no" value="${esc(dr.job_no||'')}" placeholder="J2025-001"
        oninput="exDraftSet('${k}','job_no',this.value)">`}</label>
    <label class="ex-mf">บริษัท <span class="req">*</span>
      ${dr.src_id ? _exLockCell(dr.company) : `<input type="text" data-f="company" value="${esc(dr.company||'')}" placeholder="ชื่อบริษัท"
        oninput="exDraftSet('${k}','company',this.value)">`}</label>
    <div class="ex-mf2">
      <label class="ex-mf">ค่าใช้จ่าย (ต้นทุน)
        <input type="text" inputmode="decimal" data-f="cost_amount" class="ex-in-money" value="${esc(dr.cost_amount||'')}"
          placeholder="0.00" oninput="exDraftSet('${k}','cost_amount',this.value)"></label>
      <label class="ex-mf">+ ยอดใบเสร็จ =
        <input type="text" inputmode="decimal" data-f="receipt_amount" class="ex-in-money" value="${esc(dr.receipt_amount||'')}"
          placeholder="0.00" oninput="exDraftSet('${k}','receipt_amount',this.value)"></label>
    </div>
    <div class="ex-mc-total"><label>ยอดรวม (บาท)</label>
      <b data-ex-total="${k}">${_exMoney(total)}</b></div>
    <label class="ex-mf">สถานที่ <span class="req">*</span>
      ${_exPlaceLocked(dr) ? _exLockCell(dr.src_place) : `<select data-f="place_code" onchange="exDraftSet('${k}','place_code',this.value)">
        <option value="">— เลือกสถานที่ —</option>${EX_PLACES_OPT(dr.place_code)}
      </select>`}</label>
    ${(!_exPlaceLocked(dr) && isOther)?`<label class="ex-mf">ระบุสถานที่
      <input type="text" data-f="place_other" value="${esc(dr.place_other||'')}" placeholder="กรอกชื่อสถานที่"
        oninput="exDraftSet('${k}','place_other',this.value)"></label>`:''}
    <div class="ex-mc-acts">
      <button class="btn ex-btn-saverow" ${busy?'disabled':''} onclick="exSaveDraft('${k}')">
        ${busy?'<span class="spinner"></span> กำลังบันทึก...':'💾 บันทึกรายการ'}</button>
      ${dr.editId
        ? `<button class="btn ex-btn-cancel" ${busy?'disabled':''} onclick="exCancelEdit('${k}')">✖ ยกเลิก</button>`
        : `<button class="btn ex-btn-rm" ${busy?'disabled':''} onclick="exRemoveDraft('${k}')">🗑️ ลบ</button>`}
    </div>
  </div>`;
}

/* ---------- แถวที่บันทึกแล้ว ---------- */
function exRowSaved(it, no){
  const busy = EX.busy.has(it.id);
  return `<tr data-ex-item="${esc(it.id)}">
    <td class="ex-c-no">${no}</td>
    <td class="ex-c-job"><span class="ex-ro-cell">${esc(it.job_no||'')}</span></td>
    <td class="ex-c-co"><span class="ex-ro-cell">${esc(it.company||'')}</span></td>
    <td class="ex-c-cost ex-money">${_exMoney(it.cost_amount)}</td>
    <td class="ex-c-rcp ex-money">${_exMoney(it.receipt_amount)}</td>
    <td class="ex-c-sum ex-money"><b>${_exMoney(it.total_amount)}</b></td>
    <td class="ex-c-place">${esc(it.place_name||'—')}</td>
    <td class="ex-c-act">
      <button class="ex-ib ex-ib-edit" title="แก้ไข" ${busy?'disabled':''} onclick="exEditItem('${esc(it.id)}')">✏️</button>
      <button class="ex-ib ex-ib-del" title="ลบ" ${busy?'disabled':''} onclick="exDeleteItem('${esc(it.id)}')">🗑️</button>
    </td>
  </tr>`;
}

/* ---------- แถวร่าง (ยังไม่บันทึก) ---------- */
function exRowDraft(dr, no){
  const isOther = dr.place_code===EXP_PLACES_OTHER;
  const busy = EX.busy.has(dr.key);
  const k = esc(dr.key);
  return `<tr class="ex-draft" data-ex-draft="${k}">
    <td class="ex-c-no">${no}</td>
    <td class="ex-c-job">${dr.src_id ? _exLockCell(dr.job_no) : `<input type="text" data-f="job_no" value="${esc(dr.job_no||'')}" placeholder="J2025-001"
        oninput="exDraftSet('${k}','job_no',this.value)">`}</td>
    <td class="ex-c-co">${dr.src_id ? _exLockCell(dr.company) : `<input type="text" data-f="company" value="${esc(dr.company||'')}" placeholder="ชื่อบริษัท"
        oninput="exDraftSet('${k}','company',this.value)">`}</td>
    <td class="ex-c-cost"><input type="text" inputmode="decimal" data-f="cost_amount" class="ex-in-money" value="${esc(dr.cost_amount||'')}"
        placeholder="0.00" oninput="exDraftSet('${k}','cost_amount',this.value)"></td>
    <td class="ex-c-rcp"><input type="text" inputmode="decimal" data-f="receipt_amount" class="ex-in-money" value="${esc(dr.receipt_amount||'')}"
        placeholder="0.00" oninput="exDraftSet('${k}','receipt_amount',this.value)"></td>
    <td class="ex-c-sum ex-money"><b data-ex-total="${k}">${_exMoney(_exNum(dr.cost_amount)+_exNum(dr.receipt_amount))}</b></td>
    <td class="ex-c-place">
      ${_exPlaceLocked(dr) ? _exLockCell(dr.src_place) : `<select data-f="place_code" onchange="exDraftSet('${k}','place_code',this.value)">
        <option value="">— เลือกสถานที่ —</option>
        ${EX_PLACES_OPT(dr.place_code)}
      </select>
      ${isOther?`<input type="text" data-f="place_other" class="ex-place-other" value="${esc(dr.place_other||'')}" placeholder="กรอกชื่อสถานที่"
        oninput="exDraftSet('${k}','place_other',this.value)">`:''}`}
    </td>
    <td class="ex-c-act">
      <button class="ex-ib ex-ib-save" title="บันทึก" ${busy?'disabled':''} onclick="exSaveDraft('${k}')">${busy?'<span class="spinner"></span>':'💾'}</button>
      ${dr.editId
        ? `<button class="ex-ib ex-ib-cancel" title="ยกเลิกการแก้ไข" ${busy?'disabled':''} onclick="exCancelEdit('${k}')">✖</button>`
        : `<button class="ex-ib ex-ib-del" title="ลบแถว" ${busy?'disabled':''} onclick="exRemoveDraft('${k}')">🗑️</button>`}
    </td>
  </tr>`;
}
function EX_PLACES_OPT(cur){
  const list = EXP_PLACES();
  return list.map(p=>`<option value="${esc(p)}" ${cur===p?'selected':''}>${esc(p)}</option>`).join('');
}

/* ---------- จัดการแถวร่าง ---------- */
function exAddDraft(silent){
  EX.drafts.push({ key:'d'+(++_exDraftSeq), job_no:'', company:'', cost_amount:'', receipt_amount:'', place_code:'', place_other:'' });
  if(!silent) exRender();
}
function exRemoveDraft(key){
  EX.drafts = EX.drafts.filter(x=>x.key!==key);
  exRender();
}
function exDraftSet(key, field, val){
  const dr = EX.drafts.find(x=>x.key===key); if(!dr) return;
  dr[field] = val;
  if(field==='cost_amount' || field==='receipt_amount'){
    const b = document.querySelector(`[data-ex-total="${CSS.escape(key)}"]`);
    if(b) b.textContent = _exMoney(_exNum(dr.cost_amount)+_exNum(dr.receipt_amount));
    return;
  }
  if(field==='place_code') exRender();
}

/* ============================================================
   ☑ เลือก JOB ที่ปล่อยเสร็จแล้ว (ยังไม่ปิดค่าใช้จ่าย) — ติ๊กได้หลายรายการ
   ✏️ กรอกเอง — เพิ่มแถวเปล่า (Logic เดิม SHIPPING FZ)
   ============================================================ */
const PK = { rows:[], sel:new Set(), q:'', loading:false };
let _pkTimer = null, _pkSeq = 0;
function _exUsedSrc(){
  const s = new Set();
  EX.drafts.forEach(d=>{ if(d.src_id) s.add(d.src_id); });
  EX.items.forEach(it=>{ if(it.source_doc_id) s.add(it.source_doc_id); });
  return s;
}
async function exOpenPicker(){
  PK.sel = new Set(); PK.q = '';
  openM('mx-ex-pick');
  _pkRender(true);
  await _pkLoad();
}
async function _pkLoad(){
  const my = ++_pkSeq;
  PK.loading = true; _pkRender();
  try{
    const data = await _rpc('ms_expense_pending_jobs', { p_q: PK.q || null });
    if(my!==_pkSeq) return;
    const used = _exUsedSrc();
    PK.rows = (Array.isArray(data)?data:[]).filter(r=>!used.has(r.id));
  }catch(e){
    console.error('[expense pick]', e);
    if(my===_pkSeq){ PK.rows=[]; toast('โหลด JOB ไม่สำเร็จ: '+_exErr(e),'error'); }
  }finally{
    if(my===_pkSeq){ PK.loading=false; _pkRender(); }
  }
}
function exPickSearch(v){ PK.q = v; clearTimeout(_pkTimer); _pkTimer = setTimeout(_pkLoad, 280); }
function exPickToggle(id, ev){
  if(ev && ev.target && ev.target.tagName==='INPUT') { /* checkbox เอง */ }
  if(PK.sel.has(id)) PK.sel.delete(id); else PK.sel.add(id);
  _pkRender();
}
function exPickAll(on){
  if(on) PK.rows.forEach(r=>PK.sel.add(r.id)); else PK.sel = new Set();
  _pkRender();
}
function _pkRender(first){
  const box = _mbox('mx-ex-pick'); if(!box) return;
  const rows = PK.rows;
  const allOn = rows.length>0 && rows.every(r=>PK.sel.has(r.id));
  const body = (first || (PK.loading && !rows.length))
    ? `<div class="ex-pk-empty"><span class="spinner"></span> กำลังโหลด...</div>`
    : (!rows.length ? `<div class="ex-pk-empty">ไม่มี JOB ที่ปล่อยเสร็จแล้วและยังไม่ปิดค่าใช้จ่าย</div>` : `
      <table class="ex-pk-tbl">
        <thead><tr>
          <th class="ex-pk-c-chk"><input type="checkbox" ${allOn?'checked':''} onclick="event.stopPropagation();exPickAll(this.checked)" title="เลือกทั้งหมด"></th>
          <th class="ex-pk-c-no">ลำดับ</th><th>JOB N</th><th>บริษัท</th><th class="ex-pk-c-term">สถานที่</th><th class="ex-pk-c-date">วันที่ปล่อยเสร็จ</th>
        </tr></thead>
        <tbody>${rows.map((r,i)=>{ const on=PK.sel.has(r.id); return `
          <tr class="${on?'on':''}" data-pk="${esc(r.id)}" onclick="exPickToggle('${esc(r.id)}')">
            <td class="ex-pk-c-chk"><input type="checkbox" ${on?'checked':''} onclick="event.stopPropagation();exPickToggle('${esc(r.id)}')"></td>
            <td class="ex-pk-c-no">${i+1}</td>
            <td><b>${esc(r.doc_no||'')}</b>${r.job_nj?`<div class="ex-pk-sub">${esc(r.job_nj)}</div>`:''}</td>
            <td>${esc(r.company||'—')}</td>
            <td class="ex-pk-c-term">${esc(r.import_terminal||'—')}</td>
            <td class="ex-pk-c-date">${esc(fmtDateTimeEx(r.completed_at))}</td>
          </tr>`; }).join('')}</tbody>
      </table>`);
  box.innerHTML = `
    <div class="modal-head"><div><h2>☑ เลือก JOB ที่ยังไม่ปิดค่าใช้จ่าย</h2>
      <p class="sub">JOB ที่ปล่อยเสร็จแล้ว · ติ๊กเลือกได้หลายรายการ · Job N / บริษัท / สถานที่ ดึงอัตโนมัติ</p></div>
      <button class="x" onclick="exPickClose()">✕</button></div>
    <div class="modal-body">
      <div class="ex-pk-search"><input type="text" id="ex-pk-q" placeholder="🔍 ค้นหา JOB N, บริษัท, สถานที่" value="${esc(PK.q)}" oninput="exPickSearch(this.value)"></div>
      <div class="ex-pk-wrap">${body}</div>
      <div class="ex-pk-foot">
        <button class="btn ex-btn-add" onclick="exPickManual()">✏️ กรอกเอง (เพิ่มแถวเปล่า)</button>
        <div class="ex-pk-r">
          <span class="ex-pk-cnt">เลือกแล้ว <b>${PK.sel.size}</b> รายการ</span>
          <button class="btn btn-secondary" onclick="exPickClose()">✖ ยกเลิก</button>
          <button class="btn ex-btn-save" ${PK.sel.size?'':'disabled'} onclick="exPickConfirm()">✔ ยืนยันการเลือก</button>
        </div>
      </div>
    </div>`;
  const q = document.getElementById('ex-pk-q');
  if(q && document.activeElement && document.activeElement.id!=='ex-pk-q' && PK.q){ /* คง focus เดิม */ }
}
function exPickClose(){ closeM('mx-ex-pick'); }
function exPickManual(){
  closeM('mx-ex-pick');
  exAddDraft();
}
function exPickConfirm(){
  const used = _exUsedSrc();
  const picked = PK.rows.filter(r=>PK.sel.has(r.id) && !used.has(r.id));
  picked.forEach(r=>{
    const term = String(r.import_terminal||'').trim();
    EX.drafts.push({
      key:'d'+(++_exDraftSeq), src_id:r.id, src_place:term,
      job_no: r.doc_no||'', company: r.company||'',
      cost_amount:'', receipt_amount:'',
      place_code: term, place_other: ''
    });
  });
  closeM('mx-ex-pick');
  exRender();
  if(picked.length) toast('เพิ่ม '+picked.length+' JOB แล้ว — กรอกค่าใช้จ่าย / ยอดใบเสร็จ แล้วกด 💾 บันทึก','success');
}

/* ---------- บันทึกรายการ ---------- */
function _exIsNum(v){ return /^-?[\d,]*\.?\d+$/.test(String(v).trim()); }
function _exClearInvalid(key){
  const tr = document.querySelector(`[data-ex-draft="${CSS.escape(String(key))}"]`);
  if(tr) tr.querySelectorAll('.ex-bad').forEach(e=>e.classList.remove('ex-bad'));
}
function _exInvalid(key, field, msg){
  toast(msg,'error');
  const tr = document.querySelector(`[data-ex-draft="${CSS.escape(String(key))}"]`);
  if(!tr) return;
  const el = tr.querySelector(`[data-f="${field}"]`);
  if(el){ el.classList.add('ex-bad'); try{ el.focus(); el.select && el.select(); }catch(_){ } }
}
async function exSaveDraft(key, quiet){
  if(EX.busy.has(key)) return false;
  const dr = EX.drafts.find(x=>x.key===key); if(!dr) return false;
  if(!EX.doc){ toast('ยังไม่มีเอกสาร','error'); return false; }

  _exClearInvalid(key);
  if(!String(dr.job_no||'').trim()){ _exInvalid(key,'job_no','กรอก Job N'); return false; }
  if(!String(dr.company||'').trim()){ _exInvalid(key,'company','กรอกชื่อบริษัท'); return false; }
  const rawCost = String(dr.cost_amount==null?'':dr.cost_amount).trim();
  const rawRcp  = String(dr.receipt_amount==null?'':dr.receipt_amount).trim();
  if(rawCost!=='' && !_exIsNum(rawCost)){ _exInvalid(key,'cost_amount','ค่าใช้จ่ายต้องเป็นตัวเลข'); return false; }
  if(rawRcp!==''  && !_exIsNum(rawRcp)){  _exInvalid(key,'receipt_amount','ยอดใบเสร็จต้องเป็นตัวเลข'); return false; }
  const cost = _exNum(dr.cost_amount), rcp = _exNum(dr.receipt_amount);
  if(cost<0){ _exInvalid(key,'cost_amount','จำนวนเงินติดลบไม่ได้'); return false; }
  if(rcp<0){  _exInvalid(key,'receipt_amount','จำนวนเงินติดลบไม่ได้'); return false; }
  if(!String(dr.place_code||'').trim()){ _exInvalid(key,'place_code','เลือกสถานที่'); return false; }
  if(dr.place_code===EXP_PLACES_OTHER && !String(dr.place_other||'').trim()){
    _exInvalid(key,'place_other','เลือก "อื่นๆ" ต้องกรอกชื่อสถานที่'); return false;
  }

  EX.busy.add(key); exRender();
  let ok = false;
  try{
    await _exEnsureDoc();
    const row = await _rpc('ms_expense_item_save', {
      p_doc_id: EX.doc.id,
      p_job_no: String(dr.job_no).trim(),
      p_company: String(dr.company||'').trim() || null,
      p_cost_amount: cost,
      p_receipt_amount: rcp,
      p_place_code: dr.place_code || null,
      p_place_other: dr.place_code===EXP_PLACES_OTHER ? String(dr.place_other||'').trim() : null,
      p_note: null,
      p_item_id: dr.editId || null,
      p_source_doc_id: dr.editId ? null : (dr.src_id || null)
    });
    if(dr.editId){
      const i = EX.items.findIndex(x=>x.id===dr.editId);
      if(i>=0) EX.items[i] = row; else EX.items.push(row);
      EX.editing.delete(dr.editId);
    } else {
      EX.items.push(row);
    }
    EX.items.sort((a,b)=>(a.seq||0)-(b.seq||0));
    EX.drafts = EX.drafts.filter(x=>x.key!==key);
    await exRefreshSummary();
    if(!quiet) toast('บันทึกรายการแล้ว','success');
    ok = true;
  }catch(e){
    console.error(e);
    const m = _exErr(e);
    toast('บันทึกไม่สำเร็จ: '+m,'error');
    // JOB ถูกปิดไปแล้ว (เครื่องอื่น/ซ้ำ) → เอาแถวนี้ออก ไม่ให้ปิดซ้ำ
    if(/ALREADY_CLOSED|ถูกปิดค่าใช้จ่ายแล้ว/.test(String((e&&e.message)||'')+m)){
      EX.drafts = EX.drafts.filter(x=>x.key!==key);
    }
  }finally{
    EX.busy.delete(key); exRender();
  }
  return ok;
}
function _exErr(e){
  const m = String((e&&e.message)||'');
  if(/negative_amount/i.test(m)) return 'จำนวนเงินติดลบไม่ได้';
  if(/missing_required_field/i.test(m)) return 'กรอกข้อมูลที่จำเป็นให้ครบ';
  if(/place_other_req/i.test(m)) return 'เลือก "อื่นๆ" ต้องกรอกชื่อสถานที่';
  if(/NJ_EXP_ALREADY_CLOSED/.test(m)) return 'JOB นี้ถูกปิดค่าใช้จ่ายแล้ว (ห้ามปิดซ้ำ)';
  if(/NJ_EXP_JOB_NOT_COMPLETED/.test(m)) return 'JOB นี้ยังไม่ปล่อยเสร็จ';
  if(/NJ_EXP_JOB_NOT_FOUND/.test(m)) return 'ไม่พบ JOB ต้นทาง';
  if(/NJ_EXP_DOC_NOT_FOUND/.test(m)) return 'ไม่พบเอกสาร';
  if(/NJ_FORBIDDEN/.test(m)) return 'ไม่มีสิทธิ์';
  if(/NJ_SESSION/.test(m)) return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  if(/item_not_found/i.test(m)) return 'ไม่พบรายการ';
  return m;
}

/* ---------- แก้ไข / ลบ ---------- */
function exEditItem(id){
  const it = EX.items.find(x=>x.id===id); if(!it) return;
  if(EX.drafts.some(d=>d.editId===id)) return;
  EX.editing.add(id);
  const isSrc = !!it.source_doc_id;
  EX.drafts.push({
    key:'d'+(++_exDraftSeq), editId: it.id,
    src_id: isSrc ? it.source_doc_id : null, src_place: isSrc ? (it.place_name||'') : '',
    job_no: it.job_no||'', company: it.company||'',
    cost_amount: String(it.cost_amount==null?'':it.cost_amount),
    receipt_amount: String(it.receipt_amount==null?'':it.receipt_amount),
    place_code: it.place_code||'', place_other: it.place_other||''
  });
  exRender();
  toast('แก้ไขแล้วกด 💾 บันทึก · กด ✖ เพื่อยกเลิก','info');
}
function exCancelEdit(key){
  const dr = EX.drafts.find(x=>x.key===key); if(!dr) return;
  if(dr.editId) EX.editing.delete(dr.editId);
  EX.drafts = EX.drafts.filter(x=>x.key!==key);
  exRender();
}
async function exDeleteItem(id){
  if(EX.busy.has(id)) return;
  const it = EX.items.find(x=>x.id===id); if(!it) return;
  const ok = await confirmDialog({
    title:'ลบรายการ',
    message:`ยืนยันลบรายการ <b>${esc(it.job_no||'')}</b> · ${esc(it.company||'')}<br>ยอดรวม ${_exMoney(it.total_amount)} บาท`
      + (it.source_doc_id ? '<br><small>JOB นี้จะกลับไปอยู่ในรายการรอปิดค่าใช้จ่าย</small>' : ''),
    okLabel:'🗑️ ลบ', okClass:'btn-danger'
  });
  if(!ok) return;
  EX.busy.add(id); exRender();
  try{
    await _rpc('ms_expense_item_delete', { p_item_id: id });
    EX.items = EX.items.filter(x=>x.id!==id);
    await exRefreshSummary();
    toast('ลบรายการแล้ว','success');
  }catch(e){
    console.error(e); toast('ลบไม่สำเร็จ: '+_exErr(e),'error');
  }finally{
    EX.busy.delete(id); exRender();
  }
}

/* ---------- หัวเอกสาร / เบิกเงิน ---------- */
async function exSaveAdvance(){
  const el = $('ex-adv'); if(!el || !EX.doc) return;
  const v = _exNum(el.value);
  if(v<0){ toast('เบิกเงินติดลบไม่ได้','error'); el.value=_exMoney(EX.doc.advance_amount); return; }
  if(!EX.doc.id){
    EX.doc.advance_amount = v; exRender(); return;
  }
  try{
    const sm = await _rpc('ms_expense_doc_update', { p_doc_id: EX.doc.id, p_expense_date: null, p_advance: v });
    if(sm) EX.doc = Object.assign({}, EX.doc, sm);
    exRender();
  }catch(e){ console.error(e); toast('บันทึกยอดเบิกไม่สำเร็จ: '+_exErr(e),'error'); }
}
async function exSaveHead(){
  const el = $('ex-date'); if(!el || !EX.doc) return;
  if(!EX.doc.id){ EX.doc.expense_date = el.value || _exToday(); return; }
  try{
    const sm = await _rpc('ms_expense_doc_update', { p_doc_id: EX.doc.id, p_expense_date: el.value || null, p_advance: null });
    if(sm) EX.doc = Object.assign({}, EX.doc, sm);
    toast('บันทึกวันที่แล้ว','success');
  }catch(e){ console.error(e); toast('บันทึกวันที่ไม่สำเร็จ: '+_exErr(e),'error'); }
}
async function exRefreshSummary(){
  if(!EX.doc||!EX.doc.id) return;
  try{
    const r = await _rpc('ms_expense_doc_get', { p_doc_id: EX.doc.id });
    if(r && r.head) EX.doc = Object.assign({}, EX.doc, r.head);
  }catch(_){}
}

/* ============================================================
   📋 หน้าต่างรายการปิดค่าใช้จ่าย (รายงานย้อนหลัง)
   ============================================================ */
const EXL = { rows:[], q:'', from:'', to:'', hitDocs:null, co:{} };
let _exlTimer = null;
function exListSearchSoon(){
  clearTimeout(_exlTimer);
  _exlTimer = setTimeout(()=>exListReload(), 280);
}

async function exEditDoc(id){
  if(!canEditExpense()){ return exOpenDetail(id); }
  try{
    const r = await _rpc('ms_expense_doc_get', { p_doc_id: id });
    if(!r || !r.head){ toast('ไม่พบเอกสาร','error'); return; }
    EX.doc = r.head; EX.items = r.items||[]; EX.drafts = []; EX.editing = new Set();
    closeM('mx-ex-detail');
    if(S.view!=='expense'){ S.view = 'expense'; try{ renderSidebar(); }catch(_){} }
    exOpenWorkModal();
    toast('เปิดเอกสาร '+(r.head.doc_no||'')+' แล้ว','success');
  }catch(e){ console.error(e); toast('เปิดเอกสารไม่สำเร็จ: '+_exErr(e),'error'); }
}

async function exDeleteDoc(id, docNo, fromDetail){
  if(!canDeleteExpense()){ toast('เฉพาะ ADMIN / SUPER ADMIN เท่านั้น','error'); return; }
  const ok = await confirmDialog({
    title:'ลบเอกสารปิดค่าใช้จ่าย',
    message:`ยืนยันลบเอกสาร <b>${esc(docNo||'')}</b><br>รายการทั้งหมดในเอกสารนี้จะถูกลบด้วย`,
    okLabel:'🗑️ ลบเอกสาร', okClass:'btn-danger'
  });
  if(!ok) return;
  try{
    await _rpc('ms_expense_doc_delete', { p_doc_id: id });
    if(EX.doc && EX.doc.id===id){ EX.doc=null; EX.items=[]; EX.drafts=[]; EX.editing=new Set(); }
    toast('ลบเอกสารแล้ว','success');
    await exListReload();
    const mdl = $('mx-ex-detail');
    const listOpen = mdl && mdl.classList.contains('show') && /รายการปิดค่าใช้จ่าย/.test(mdl.innerText||'');
    if(fromDetail){ closeM('mx-ex-detail'); exHomeRender(); }
    else if(listOpen){ exListRender(); }
    else { exHomeRender(); }
  }catch(e){ console.error(e); toast('ลบไม่สำเร็จ: '+_exErr(e),'error'); }
}
async function exOpenList(){
  openM('mx-ex-detail');
  _mbox('mx-ex-detail').innerHTML = `
    <div class="modal-head"><div><h2>📋 รายการปิดค่าใช้จ่าย</h2></div>
      <button class="x" onclick="exCloseDetailOnly()">✕</button></div>
    <div class="modal-body"><div style="padding:28px;text-align:center;color:var(--muted)">
      <span class="spinner"></span> กำลังโหลด...</div></div>`;
  await exListLoad();
  exListRender();
}
async function exListLoad(){
  try{
    const data = await _rpc('ms_expense_list', { p_from: EXL.from||null, p_to: EXL.to||null, p_q: String(EXL.q||'').trim()||null });
    EXL.rows = Array.isArray(data) ? data : [];
    EXL.co = {};
    EXL.rows.forEach(r=>{ EXL.co[r.id] = Array.isArray(r.companies) ? r.companies : []; });
    const term = String(EXL.q||'').trim();
    EXL.hitDocs = term ? new Set(EXL.rows.filter(r=>r.item_hit).map(r=>r.id)) : null;
  }catch(e){ console.error(e); toast('โหลดรายการไม่สำเร็จ: '+_exErr(e),'error'); EXL.rows=[]; }
}
function exListRender(){
  const mdl = $('mx-ex-detail'); if(!mdl) return;
  if(!mdl.classList.contains('show')) return;
  const qq = String(EXL.q||'').toLowerCase();
  const rows = EXL.rows.filter(r=>{
    if(!qq) return true;
    const head = [r.doc_no, r.closer_name, r.expense_date,
                  r.expense_date ? fmtDateEx(r.expense_date) : '']
                 .filter(Boolean).some(x=>String(x).toLowerCase().includes(qq));
    const inItems = EXL.hitDocs ? EXL.hitDocs.has(r.id) : false;
    return head || inItems;
  });
  const focusQ = document.activeElement && document.activeElement.id==='exl-q';
  mdl.querySelector('.modal').innerHTML = `
    <div class="modal-head"><div><h2>📋 รายการปิดค่าใช้จ่าย</h2>
      <p class="sub">${rows.length} เอกสาร</p></div>
      <button class="x" onclick="exCloseDetailOnly()">✕</button></div>
    <div class="modal-body">
      <div class="ex-lfilter">
        <input type="text" id="exl-q" placeholder="🔍 ค้นหา เลขที่เอกสาร / ผู้ปิด / วันที่..." value="${esc(EXL.q)}"
               oninput="EXL.q=this.value;exListSearchSoon()">
        <input type="date" value="${esc(EXL.from)}" onchange="EXL.from=this.value;exListReload()">
        <input type="date" value="${esc(EXL.to)}" onchange="EXL.to=this.value;exListReload()">
      </div>
      ${_vpMobile() ? `<div class="ex-hcards">${rows.length? rows.map(r=>`
        <div class="ex-hcard" onclick="exOpenDetail('${esc(r.id)}')">
          <div class="ex-hc-top"><b>${esc(r.doc_no||'')}</b><span class="ex-st">${esc(r.status||'ปกติ')}</span></div>
          <div class="ex-hc-sub">${r.expense_date?esc(fmtDateEx(r.expense_date)):'—'} · ${esc(r.closer_name||'—')}</div>
          <div class="ex-hc-grid">
            <div class="ex-hc-n"><label>รายการ</label><b>${r.items_count||0}</b></div>
            <div class="ex-hc-n ex-hc-adv"><label>เบิกเงิน</label><b>${_exMoney(r.advance_amount)}</b></div>
            <div class="ex-hc-n ex-hc-sp"><label>ใช้ไป</label><b>${_exMoney(r.spent_total)}</b></div>
            <div class="ex-hc-n ex-hc-bl"><label>คงเหลือ</label><b class="${_exNum(r.balance)<0?'ex-neg':''}">${_exMoney(r.balance)}</b></div>
          </div>
          <div class="ex-hc-acts" onclick="event.stopPropagation()">
            <button class="btn ex-btn-view" onclick="exOpenDetail('${esc(r.id)}')">👁 ดู</button>
            <button class="btn ex-btn-xls"  onclick="exExportExcel('${esc(r.id)}')">📊 Excel</button>
            <button class="btn ex-btn-pdf"  onclick="exExportPDF('${esc(r.id)}')">📄 PDF</button>
          </div>
        </div>`).join('') : `<div class="ex-empty">ไม่พบเอกสาร</div>`}</div>` : `
      <div style="overflow-x:auto">
        <table class="tbl ex-ltbl">
          <thead><tr>
            <th>เลขที่เอกสาร</th><th>วันที่</th><th>ผู้ปิดค่าใช้จ่าย</th><th>จำนวน</th>
            <th>เบิกเงิน</th><th>ใช้ไป</th><th>คงเหลือ</th><th>สถานะ</th><th>จัดการ</th>
          </tr></thead>
          <tbody>${rows.length? rows.map(r=>`
            <tr class="ex-lrow" onclick="exOpenDetail('${esc(r.id)}')">
              <td><b>${esc(r.doc_no||'')}</b></td>
              <td>${r.expense_date?esc(fmtDateEx(r.expense_date)):'—'}</td>
              <td>${esc(r.closer_name||'—')}</td>
              <td style="text-align:center">${r.items_count||0}</td>
              <td class="ex-money">${_exMoney(r.advance_amount)}</td>
              <td class="ex-money">${_exMoney(r.spent_total)}</td>
              <td class="ex-money ${_exNum(r.balance)<0?'ex-neg':''}">${_exMoney(r.balance)}</td>
              <td style="text-align:center"><span class="ex-st">${esc(r.status||'ปกติ')}</span></td>
              <td style="text-align:center" onclick="event.stopPropagation()">
                <button class="ex-ib ex-ib-view" title="ดูรายละเอียด" onclick="exOpenDetail('${esc(r.id)}')">🔍</button>
                ${canDeleteExpense() ? `<button class="ex-ib ex-ib-del" title="ลบเอกสาร" onclick="exDeleteDoc('${esc(r.id)}','${esc(r.doc_no||'')}')">🗑️</button>` : ''}
              </td>
            </tr>`).join('')
            : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:24px">ไม่พบเอกสาร</td></tr>`}
          </tbody>
        </table>
      </div>`}
    </div>`;
  if(focusQ){ const q=$('exl-q'); if(q){ q.focus(); try{ q.setSelectionRange(q.value.length,q.value.length); }catch(_){} } }
}
async function exListReload(){ await exListLoad(); exListRender(); }

/* ---------- รายละเอียดเอกสาร ---------- */
function exCloseDetailOnly(){ closeM('mx-ex-detail'); }
function exCloseDetail(){
  closeM('mx-ex-detail');
  if(S.view==='expense') exHomeRender();
}
async function exOpenDetail(id){
  openM('mx-ex-detail');
  _mbox('mx-ex-detail').innerHTML = `
    <div class="modal-head"><div><h2>รายละเอียดเอกสาร</h2></div>
      <button class="x" onclick="exCloseDetailOnly()">✕</button></div>
    <div class="modal-body"><div style="padding:28px;text-align:center;color:var(--muted)">
      <span class="spinner"></span> กำลังโหลด...</div></div>`;
  try{
    const r = await _rpc('ms_expense_doc_get', { p_doc_id: id });
    exDetailRender((r&&r.head)||{}, (r&&r.items)||[]);
  }catch(e){ console.error(e); toast('โหลดรายละเอียดไม่สำเร็จ: '+_exErr(e),'error'); }
}
function exDetailRender(h, items){
  const mdl = $('mx-ex-detail'); if(!mdl) return;
  const cost = items.reduce((s,x)=>s+_exNum(x.cost_amount),0);
  const rcp  = items.reduce((s,x)=>s+_exNum(x.receipt_amount),0);
  const sum  = items.reduce((s,x)=>s+_exNum(x.total_amount),0);
  mdl.querySelector('.modal').innerHTML = `
    <div class="modal-head">
      <div><h2>รายละเอียดเอกสาร ${esc(h.doc_no||'')}</h2>
        <p class="sub">${h.expense_date?esc(fmtDateEx(h.expense_date)):''} · ${esc(h.closer_name||'')}</p></div>
      <button class="x" onclick="exCloseDetailOnly()">✕</button></div>
    <div class="modal-body">
      <div class="ex-dmeta">
        <div><label>ยอดเบิกเงิน</label><b>${_exMoney(h.advance_amount)}</b></div>
        <div><label>ยอดใช้ไป</label><b>${_exMoney(h.spent_total)}</b></div>
        <div><label>เงินคงเหลือ</label><b class="${_exNum(h.balance)<0?'ex-neg':''}">${_exMoney(h.balance)}</b></div>
        <div><label>จำนวนรายการ</label><b>${h.items_count||0}</b></div>
        <div><label>สถานะ</label><b>${esc(h.status||'ปกติ')}</b></div>
      </div>
      <div style="overflow-x:auto">
        <table class="tbl ex-ltbl">
          <thead><tr><th>ลำดับ</th><th>Job N</th><th>บริษัท</th><th>ค่าใช้จ่าย (ต้นทุน)</th>
            <th>+ ยอดใบเสร็จ =</th><th>ยอดรวม (บาท)</th><th>สถานที่</th></tr></thead>
          <tbody>${items.map((it,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${esc(it.job_no||'')}</td>
            <td>${esc(it.company||'')}</td>
            <td class="ex-money">${_exMoney(it.cost_amount)}</td>
            <td class="ex-money">${_exMoney(it.receipt_amount)}</td>
            <td class="ex-money"><b>${_exMoney(it.total_amount)}</b></td>
            <td>${esc(it.place_name||'—')}</td></tr>`).join('')}
            <tr class="ex-trsum"><td colspan="3" style="text-align:right"><b>รวมทั้งหมด</b></td>
              <td class="ex-money"><b>${_exMoney(cost)}</b></td>
              <td class="ex-money"><b>${_exMoney(rcp)}</b></td>
              <td class="ex-money"><b>${_exMoney(sum)}</b></td><td></td></tr>
          </tbody>
        </table>
      </div>
      <div class="ex-dacts">
        <button class="btn btn-secondary" onclick="exCloseDetail()">✖ ปิด</button>
        ${canEditExpense() ? `<button class="btn ex-btn-edit" onclick="exEditDoc('${esc(h.id)}')">✏️ แก้ไข</button>` : ''}
        <button class="btn ex-btn-xls" onclick="exExportExcel('${esc(h.id)}')">📊 Export Excel</button>
        <button class="btn ex-btn-pdf" onclick="exExportPDF('${esc(h.id)}')">📄 Export PDF</button>
        ${canDeleteExpense() ? `<button class="btn ex-btn-rm" onclick="exDeleteDoc('${esc(h.id)}','${esc(h.doc_no||'')}',true)">🗑️ ลบ</button>` : ''}
      </div>
    </div>`;
}

/* ============================================================
   EXPORT — ดึงข้อมูลจากฐานข้อมูลจริงเสมอ · รูปแบบเดียวกับ SHIPPING FZ
   (เปลี่ยนเฉพาะชื่อระบบ SHIPPING FZ → MESSENGER)
   ============================================================ */
const EX_SYS = 'MESSENGER';
async function _exFetchForExport(docId){
  const id = docId || (EX.doc&&EX.doc.id);
  if(!id){ toast('ไม่พบเอกสาร','error'); return null; }
  const r = await _rpc('ms_expense_doc_get', { p_doc_id: id });
  const h = r && r.head, its = (r && r.items) || [];
  if(!h){ toast('ไม่พบเอกสาร','error'); return null; }
  if(!its.length){ toast('ยังไม่มีรายการที่บันทึก','error'); return null; }
  return { h, items: its };
}

async function _exPatchXlsx(buf){
  try{
    await loadPdfLib();
    const fz = window.fflate;
    if(!fz || !fz.unzipSync) return buf;
    const files = fz.unzipSync(new Uint8Array(buf));
    const key = Object.keys(files).find(k=>/^xl\/worksheets\/sheet1\.xml$/i.test(k));
    if(!key) return buf;
    let xml = fz.strFromU8(files[key]);
    const pane = '<sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/>'
               + '<selection pane="bottomLeft" activeCell="A5" sqref="A5"/></sheetView>';
    if(/<sheetViews>[\s\S]*?<\/sheetViews>/.test(xml)){
      xml = xml.replace(/<sheetViews>[\s\S]*?<\/sheetViews>/, '<sheetViews>'+pane+'</sheetViews>');
    } else {
      xml = xml.replace(/(<sheetData)/, '<sheetViews>'+pane+'</sheetViews>$1');
    }
    if(/<sheetPr[^>]*\/>/.test(xml)){
      xml = xml.replace(/<sheetPr([^>]*)\/>/, '<sheetPr$1><pageSetUpPr fitToPage="1"/></sheetPr>');
    } else if(/<sheetPr[^>]*>/.test(xml)){
      xml = xml.replace(/(<sheetPr[^>]*>)/, '$1<pageSetUpPr fitToPage="1"/>');
    } else {
      xml = xml.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
    }
    const ps = '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>';
    xml = xml.replace(/<pageSetup[^>]*\/>/g, '');
    if(/<\/worksheet>/.test(xml)) xml = xml.replace(/<\/worksheet>/, ps+'</worksheet>');
    files[key] = fz.strToU8(xml);
    return fz.zipSync(files, { level:6 }).buffer;
  }catch(e){
    console.warn('[xlsx patch]', e);
    return buf;
  }
}
function _exSaveBlob(buf, filename){
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1500);
}
async function exExportExcel(docId){
  try{
    const r = await _exFetchForExport(docId); if(!r) return;
    await loadXlsxStyle();
    const { h, items } = r;
    const TITLE = EX_SYS + ' - สรุปปิดค่าใช้จ่าย';
    const HEAD  = ['ลำดับ','Job N','บริษัท','ค่าใช้จ่าย (ต้นทุน)','+ ยอดใบเสร็จ =','ยอดรวม (บาท)','สถานที่','หมายเหตุ'];
    const aoa = [
      [TITLE],
      ['เลขที่เอกสาร', h.doc_no||'', '', 'วันที่', h.expense_date||'', '', 'ผู้ปิดค่าใช้จ่าย', h.closer_name||''],
      [],
      HEAD
    ];
    items.forEach((it,i)=> aoa.push([
      i+1, it.job_no||'', it.company||'',
      _exNum(it.cost_amount), _exNum(it.receipt_amount), _exNum(it.total_amount),
      it.place_name||'', it.note||''
    ]));
    const first = 5, last = 4+items.length;
    aoa.push(['','','รวมทั้งหมด',
      { f:`SUM(D${first}:D${last})` }, { f:`SUM(E${first}:E${last})` }, { f:`SUM(F${first}:F${last})` }, '','']);
    const totalRow = last+1;
    aoa.push([]);
    aoa.push(['เบิกเงิน (บาท)', _exNum(h.advance_amount), '', 'ใช้ไป (บาท)', { f:`F${totalRow}` }, '',
              'เงินคงเหลือ (บาท)', { f:`B${totalRow+2}-E${totalRow+2}` }]);
    aoa.push([]);
    aoa.push(['หมายเหตุ', h.note||'']);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:7} }];
    ws['!cols'] = [{wch:7},{wch:16},{wch:28},{wch:18},{wch:18},{wch:18},{wch:20},{wch:22}];
    ws['!margins'] = { left:0.3, right:0.3, top:0.4, bottom:0.4, header:0.2, footer:0.2 };

    const bd = { top:{style:'thin',color:{rgb:'FF999999'}}, bottom:{style:'thin',color:{rgb:'FF999999'}},
                 left:{style:'thin',color:{rgb:'FF999999'}}, right:{style:'thin',color:{rgb:'FF999999'}} };
    const COLORS = ['FFDBEAFE','FFDBEAFE','FFD1FAE5','FFFEF3C7','FFFCE7F3','FFEDE9FE','FFDBEAFE','FFF3F4F6'];
    const t = XLSX.utils.encode_cell({r:0,c:0});
    if(ws[t]) ws[t].s = { font:{bold:true,sz:15,color:{rgb:'FF1E3A8A'}}, alignment:{horizontal:'center'} };
    for(let c=0;c<HEAD.length;c++){
      const ref = XLSX.utils.encode_cell({r:3,c});
      if(!ws[ref]) ws[ref] = { t:'s', v:HEAD[c] };
      ws[ref].s = { font:{bold:true,sz:11}, fill:{fgColor:{rgb:COLORS[c]}},
                    alignment:{horizontal:'center',vertical:'center',wrapText:true}, border:bd };
    }
    for(let r=4; r<aoa.length; r++){
      for(let c=0;c<HEAD.length;c++){
        const ref = XLSX.utils.encode_cell({r,c});
        if(!ws[ref]) continue;
        ws[ref].s = Object.assign({ border:bd }, ws[ref].s||{});
        if(c>=3 && c<=5){ ws[ref].z = '#,##0.00'; ws[ref].s.alignment = { horizontal:'right' }; }
        if(c===0) ws[ref].s.alignment = { horizontal:'center' };
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'สรุปปิดค่าใช้จ่าย');
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Names = (wb.Workbook.Names||[]).concat([{
      Name:'_xlnm.Print_Titles', Sheet:0, Ref:"'สรุปปิดค่าใช้จ่าย'!$4:$4"
    }]);
    const buf = XLSX.write(wb, { type:'array', bookType:'xlsx' });
    const out = await _exPatchXlsx(buf);
    _exSaveBlob(out, `${h.doc_no||'expense'}.xlsx`);
    toast('ส่งออก Excel แล้ว','success');
  }catch(e){ console.error(e); toast('Export Excel ไม่สำเร็จ: '+(e.message||''),'error'); }
}

/* ---------- jsPDF + autoTable + ฟอนต์ไทย (ไฟล์เดียวกับ SHIPPING FZ: assets/pdf.bundle.js) ---------- */
let _pdfPromise = null;
function loadPdfLib(){
  if(window.jspdf && window.jspdf.jsPDF && window.SFZ_PDF_READY) return Promise.resolve();
  if(_pdfPromise) return _pdfPromise;
  _pdfPromise = loadScript('assets/pdf.bundle.js?v=3.9.3')
    .catch(e=>{ _pdfPromise=null; throw e; });
  return _pdfPromise;
}

async function exExportPDF(docId){
  try{
    const r = await _exFetchForExport(docId); if(!r) return;
    await loadPdfLib();
    if(!(window.jspdf && window.jspdf.jsPDF)) throw new Error('โหลดไลบรารี PDF ไม่สำเร็จ');

    const { h, items } = r;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const M  = 10;

    doc.setFont('Sarabun','normal');

    const cost = items.reduce((s,x)=>s+_exNum(x.cost_amount),0);
    const rcp  = items.reduce((s,x)=>s+_exNum(x.receipt_amount),0);
    const sum  = items.reduce((s,x)=>s+_exNum(x.total_amount),0);
    const adv  = _exNum(h.advance_amount);
    const bal  = adv - sum;

    const body = items.map((it,i)=>[
      String(i+1), it.job_no||'', it.company||'',
      _exMoney(it.cost_amount), _exMoney(it.receipt_amount), _exMoney(it.total_amount),
      it.place_name||'', it.note||''
    ]);
    body.push([
      { content:'รวมทั้งสิ้น', colSpan:3, styles:{ halign:'right', fontStyle:'bold', fillColor:[239,246,255] } },
      { content:_exMoney(cost), styles:{ halign:'right', fontStyle:'bold', fillColor:[239,246,255] } },
      { content:_exMoney(rcp),  styles:{ halign:'right', fontStyle:'bold', fillColor:[239,246,255] } },
      { content:_exMoney(sum),  styles:{ halign:'right', fontStyle:'bold', fillColor:[237,233,254] } },
      { content:'', colSpan:2, styles:{ fillColor:[239,246,255] } }
    ]);

    doc.autoTable({
      head: [[ 'ลำดับ','Job N','บริษัท','ค่าใช้จ่าย (ต้นทุน)','+ ยอดใบเสร็จ =','ยอดรวม (บาท)','สถานที่','หมายเหตุ' ]],
      body,
      startY: M + 22,
      margin: { left:M, right:M, top:M + 22, bottom:M + 4 },
      theme: 'grid',
      styles: {
        font:'Sarabun', fontStyle:'normal', fontSize:8.5,
        cellPadding:1.6, lineWidth:0.22, lineColor:[120,130,150],
        textColor:[17,17,17], overflow:'linebreak', valign:'middle'
      },
      headStyles: {
        font:'Sarabun', fontStyle:'bold', fontSize:8.5,
        fillColor:[30,58,138], textColor:[255,255,255],
        lineWidth:0.25, lineColor:[255,255,255], halign:'center'
      },
      columnStyles: {
        0:{ cellWidth:13, halign:'center' },
        1:{ cellWidth:26 },
        2:{ cellWidth:'auto' },
        3:{ cellWidth:30, halign:'right', fillColor:[254,252,232] },
        4:{ cellWidth:30, halign:'right', fillColor:[253,242,248] },
        5:{ cellWidth:30, halign:'right', fillColor:[245,243,255], fontStyle:'bold' },
        6:{ cellWidth:34 },
        7:{ cellWidth:28 }
      },
      didParseCell: (d)=>{
        if(d.section==='body' && d.row.index < items.length){
          if(d.column.index===1) d.cell.styles.fillColor=[239,246,255];
          if(d.column.index===2) d.cell.styles.fillColor=[236,253,245];
        }
      },
      didDrawPage: (d)=>{
        doc.setFont('Sarabun','bold'); doc.setFontSize(13);
        doc.setTextColor(30,58,138);
        doc.text('สรุปปิดค่าใช้จ่าย', PW/2, M + 8, { align:'center' });

        doc.setFontSize(10);
        doc.text('N.J. LOGISTICS', M, M + 6);
        doc.setFont('Sarabun','normal'); doc.setFontSize(7.5);
        doc.setTextColor(90,90,90);
        doc.text(EX_SYS, M, M + 10);

        doc.setFontSize(8);
        doc.setTextColor(17,17,17);
        const rx = PW - M;
        doc.text('เลขที่เอกสาร : ' + (h.doc_no||'-'), rx, M + 4, { align:'right' });
        doc.text('วันที่ปิดค่าใช้จ่าย : ' + (h.expense_date? fmtDateEx(h.expense_date) : '-'), rx, M + 8.5, { align:'right' });
        doc.text('ผู้ปิดค่าใช้จ่าย : ' + (h.closer_name||'-'), rx, M + 13, { align:'right' });

        doc.setDrawColor(30,58,138); doc.setLineWidth(0.5);
        doc.line(M, M + 16, PW - M, M + 16);

        const pg = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5); doc.setTextColor(110,110,110);
        doc.text('หน้า ' + pg, PW - M, PH - 4, { align:'right' });
      }
    });

    let y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : M + 30) + 6;
    const need = 52;
    if(y + need > PH - M){ doc.addPage(); y = M + 24; }

    const bw = (PW - M*2 - 8) / 3;
    const boxes = [
      { t:'เบิกเงิน (บาท)',    v:_exMoney(adv), bg:[239,246,255], fg:[29,78,216] },
      { t:'ใช้ไป (บาท)',       v:_exMoney(sum), bg:[254,242,242], fg:[220,38,38] },
      { t:'เงินคงเหลือ (บาท)', v:_exMoney(bal), bg:[236,253,245], fg: bal<0?[220,38,38]:[4,120,87] }
    ];
    boxes.forEach((b,i)=>{
      const x = M + i*(bw+4);
      doc.setFillColor(b.bg[0],b.bg[1],b.bg[2]);
      doc.setDrawColor(120,130,150); doc.setLineWidth(0.25);
      doc.rect(x, y, bw, 14, 'FD');
      doc.setFont('Sarabun','normal'); doc.setFontSize(8); doc.setTextColor(70,70,70);
      doc.text(b.t, x+3, y+5.5);
      doc.setFont('Sarabun','bold'); doc.setFontSize(11);
      doc.setTextColor(b.fg[0],b.fg[1],b.fg[2]);
      doc.text(b.v, x+bw-3, y+11, { align:'right' });
    });
    y += 19;

    doc.setDrawColor(150,150,150); doc.setLineWidth(0.22);
    doc.rect(M, y, PW - M*2, 12);
    doc.setFont('Sarabun','bold'); doc.setFontSize(8); doc.setTextColor(17,17,17);
    doc.text('หมายเหตุ', M+3, y+5);
    doc.setFont('Sarabun','normal');
    doc.text(String(h.note||''), M+22, y+5, { maxWidth: PW - M*2 - 26 });
    y += 18;

    const sw = (PW - M*2 - 16) / 3;
    const signs = [
      { l:'ผู้ปิดค่าใช้จ่าย', n:h.closer_name||'', d:h.expense_date? fmtDateEx(h.expense_date):'.............' },
      { l:'ผู้ตรวจสอบ',     n:'', d:'.............' },
      { l:'ผู้อนุมัติ',       n:'', d:'.............' }
    ];
    doc.setFontSize(8);
    signs.forEach((s,i)=>{
      const x = M + i*(sw+8);
      doc.setDrawColor(70,70,70); doc.setLineWidth(0.2);
      doc.line(x, y+10, x+sw, y+10);
      doc.setFont('Sarabun','normal'); doc.setTextColor(17,17,17);
      doc.text(s.l, x+sw/2, y+14.5, { align:'center' });
      doc.text('( ' + (s.n || '.............................') + ' )', x+sw/2, y+19, { align:'center' });
      doc.text('วันที่ ' + s.d, x+sw/2, y+23.5, { align:'center' });
    });

    doc.save(`${h.doc_no||'expense'}.pdf`);
    toast('ส่งออก PDF แล้ว','success');
  }catch(e){
    console.error(e);
    toast('Export PDF ไม่สำเร็จ: '+(e.message||''),'error');
  }
}

/* ---------- ส่งออกฟังก์ชันให้ onclick ใน HTML ---------- */
Object.assign(window, {
  renderExpense, exOpenNewWork, exCloseWork, exSaveWork, exAddDraft, exRemoveDraft, exDraftSet,
  exSaveDraft, exEditItem, exCancelEdit, exDeleteItem, exSaveAdvance, exSaveHead,
  exOpenList, exListReload, exListSearchSoon, exEditDoc, exDeleteDoc, exOpenDetail, exCloseDetail, exCloseDetailOnly,
  exExportExcel, exExportPDF, exOpenPicker, exPickSearch, exPickToggle, exPickAll, exPickClose, exPickManual, exPickConfirm,
  EXL, __EX: EX
});
})();
