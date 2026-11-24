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
var EX_CSS = "/* from block1 (.ex- only) */\n.ex-wrap{max-width:100%}\n.ex-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px}\n.ex-title{display:flex;align-items:center;gap:12px;min-width:0}\n.ex-title .ex-ic{font-size:30px;line-height:1}\n.ex-title h2{margin:0;font-size:22px;color:var(--text)}\n.ex-title p{margin:2px 0 0;font-size:13px;color:var(--muted)}\n.ex-meta{display:flex;gap:10px;flex-wrap:wrap}\n.ex-fld{display:flex;flex-direction:column;gap:4px;min-width:0}\n.ex-fld label{font-size:11.5px;color:var(--muted);font-weight:600}\n.ex-fld input{height:40px;padding:0 10px;border:1px solid var(--line);border-radius:8px;\n  background:var(--card);color:var(--text);font-size:14px;min-width:0;width:170px;max-width:100%}\n.ex-fld input.ex-ro{background:var(--bg);opacity:.9}\n.ex-panel{padding:0;overflow:hidden}\n.ex-tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}\n.ex-tbl{width:100%;min-width:900px;border-collapse:collapse}\n.ex-tbl thead th{background:#1E3A8A;color:#fff;font-size:13px;font-weight:700;\n  padding:11px 8px;text-align:center;white-space:nowrap;border:1px solid rgba(255,255,255,.18)}\n.ex-tbl tbody td{border:1px solid var(--line);padding:7px 8px;font-size:14px;vertical-align:middle}\n.ex-tbl .ex-c-no{width:62px;text-align:center;color:var(--muted)}\n.ex-tbl .ex-c-job{width:150px;background:#EFF6FF}\n.ex-tbl .ex-c-co{min-width:200px;background:#ECFDF5}\n.ex-tbl .ex-c-cost{width:150px;background:#FEFCE8}\n.ex-tbl .ex-c-rcp{width:150px;background:#FDF2F8}\n.ex-tbl .ex-c-sum{width:150px;background:#F5F3FF;text-align:right;font-weight:700}\n.ex-tbl .ex-c-place{width:190px;background:#EFF6FF}\n.ex-tbl .ex-c-act{width:112px;text-align:center;white-space:nowrap}\n.ex-tbl .ex-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-tbl input,.ex-tbl select{width:100%;height:36px;padding:0 8px;border:1px solid var(--line);\n  border-radius:7px;background:var(--card);color:var(--text);font-size:14px;min-width:0}\n.ex-tbl input.ex-in-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-tbl .ex-place-other{margin-top:5px}\n.ex-tbl .ex-ro-cell{display:block;padding:0 2px}\n.ex-tbl tr.ex-draft{background:rgba(59,130,246,.04)}\n.ex-ib{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:var(--card);\n  cursor:pointer;font-size:15px;line-height:1;margin:0 2px;transition:.15s}\n.ex-ib:hover{transform:translateY(-1px)}\n.ex-ib:disabled{opacity:.5;cursor:not-allowed;transform:none}\n.ex-ib-save{background:#2563EB;border-color:#2563EB;color:#fff}\n.ex-ib-edit{background:#F1F5F9}\n.ex-ib-del{background:#FEE2E2;border-color:#FCA5A5}\n.ex-ib-view{background:#DBEAFE;border-color:#93C5FD}\n.ex-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;\n  flex-wrap:wrap;padding:12px;border-top:1px solid var(--line)}\n.ex-bar-r{display:flex;gap:8px;flex-wrap:wrap}\n.ex-bar .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;font-size:14px;\n  border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex-btn-add{background:#16A34A}\n.ex-btn-list{background:#2563EB}\n.ex-btn-xls{background:#15803D}\n.ex-btn-pdf{background:#DC2626}\n.ex-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}\n.ex-card{display:flex;align-items:center;gap:12px;padding:16px;border-radius:14px;border:1px solid var(--line);min-width:0}\n.ex-card-ic{font-size:26px;line-height:1;flex:none}\n.ex-card-bd{min-width:0;flex:1}\n.ex-card-bd label{display:block;font-size:13px;font-weight:600;margin-bottom:3px}\n.ex-card-bd b{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;display:block}\n.ex-card-bd input{width:100%;height:42px;border:1px solid var(--line);border-radius:9px;\n  background:var(--card);padding:0 10px;font-size:22px;font-weight:800;text-align:right;\n  font-variant-numeric:tabular-nums;color:var(--text);min-width:0}\n.ex-card-adv{background:#EFF6FF;border-color:#BFDBFE}\n.ex-card-adv label{color:#1D4ED8}\n.ex-card-spent{background:#FEF2F2;border-color:#FECACA}\n.ex-card-spent label{color:#DC2626}\n.ex-card-spent b{color:#DC2626}\n.ex-card-bal{background:#ECFDF5;border-color:#A7F3D0}\n.ex-card-bal label{color:#047857}\n.ex-card-bal b{color:#047857}\n.ex-neg{color:#DC2626 !important}\n.ex-lfilter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}\n.ex-lfilter input{height:40px;padding:0 10px;border:1px solid var(--line);border-radius:8px;\n  background:var(--card);color:var(--text);font-size:14px;min-width:0}\n.ex-lfilter input[type=\"text\"]{flex:1;min-width:160px}\n.ex-ltbl{width:100%;border-collapse:collapse;min-width:720px}\n.ex-ltbl th{background:#1E3A8A;color:#fff;padding:9px 8px;font-size:13px;white-space:nowrap}\n.ex-ltbl td{border:1px solid var(--line);padding:7px 8px;font-size:13.5px}\n.ex-ltbl .ex-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-ltbl tr.ex-trsum td{background:#EFF6FF}\n.ex-st{display:inline-block;padding:2px 10px;border-radius:999px;background:#DCFCE7;color:#166534;font-size:12px;font-weight:700}\n.ex-dmeta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}\n.ex-dmeta>div{flex:1;min-width:120px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:var(--bg)}\n.ex-dmeta label{display:block;font-size:11.5px;color:var(--muted);font-weight:600}\n.ex-dmeta b{font-size:17px;font-variant-numeric:tabular-nums}\n.ex-dacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.ex-dacts .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;border:0;cursor:pointer;color:#fff}\n.ex-tbl tbody td{color:#111 !important;background:#fff}\n.ex-tbl thead th{background:#1E3A8A !important;color:#fff !important}\n.ex-tbl tbody td.ex-c-no{color:#555 !important}\n.ex-tbl tbody td.ex-c-job{background:#EFF6FF !important}\n.ex-tbl tbody td.ex-c-co{background:#ECFDF5 !important}\n.ex-tbl tbody td.ex-c-cost{background:#FEFCE8 !important}\n.ex-tbl tbody td.ex-c-rcp{background:#FDF2F8 !important}\n.ex-tbl tbody td.ex-c-sum{background:#F5F3FF !important;color:#4C1D95 !important}\n.ex-tbl tbody td.ex-c-place{background:#EFF6FF !important}\n.ex-tbl tbody td.ex-c-act{background:#fff !important}\n.ex-tbl input,.ex-tbl select{background:#fff !important;color:#111 !important;border-color:#CBD5E1 !important}\n.ex-tbl input::placeholder{color:#94A3B8 !important}\n.ex-tbl tr.ex-draft td{background:#F8FAFF !important}\n.ex-tbl tr.ex-draft .ex-c-sum{background:#F5F3FF !important}\n.ex-card-bd input{background:#fff !important;color:#1D4ED8 !important;border-color:#BFDBFE !important}\n.ex-card-adv label{color:#1D4ED8 !important}\n.ex-fld input{color:var(--text)}\n.ex-fld input.ex-ro{color:var(--text)}\n.ex-ltbl td{color:#111 !important;background:#fff}\n.ex-ltbl tr.ex-trsum td{background:#EFF6FF !important}\n.ex-ib-edit{background:#F1F5F9 !important}\n.ex-dmeta b{color:var(--text)}\n@media (max-width:860px){.ex-head{flex-direction:column;gap:10px}\n.ex-meta{width:100%}\n.ex-fld{flex:1 1 150px}\n.ex-fld input{width:100%}\n.ex-title h2{font-size:19px}\n.ex-sum{grid-template-columns:1fr;gap:10px}\n.ex-card-bd b,.ex-card-bd input{font-size:21px}\n.ex-bar{flex-direction:column;align-items:stretch}\n.ex-bar .btn{width:100%;justify-content:center;min-height:46px}\n.ex-bar-r{flex-direction:column}\n.ex-tbl{min-width:860px}\n.ex-ib{width:38px;height:38px}\n.ex-lfilter input{width:100%}}\n\n/* ===== 💰 ปิดค่าใช้จ่าย — เส้นตารางครบทุกช่อง ===== */\n:root{ --ex-line:#9AA7BD; --ex-line-soft:#C3CEDF; }\n\n/* ---- ตารางหลัก: กรอบนอก + เส้นทุกช่อง ---- */\n.ex-tbl{border-collapse:separate !important;border-spacing:0;\n  border:1.5px solid var(--ex-line) !important;border-radius:10px;overflow:hidden}\n.ex-tbl thead th{border-right:1px solid rgba(255,255,255,.45) !important;\n  border-bottom:1.5px solid var(--ex-line) !important}\n.ex-tbl thead th:last-child{border-right:0 !important}\n.ex-tbl tbody td{border-right:1px solid var(--ex-line-soft) !important;\n  border-bottom:1px solid var(--ex-line-soft) !important;border-top:0 !important;border-left:0 !important}\n.ex-tbl tbody td:last-child{border-right:0 !important}\n.ex-tbl tbody tr:last-child td{border-bottom:0 !important}\n\n/* ---- ช่องกรอกในเซลล์: มีกรอบของตัวเอง ไม่กลืนพื้น ---- */\n.ex-tbl input,.ex-tbl select{border:1.5px solid #B6C2D6 !important;border-radius:7px !important;\n  background:#fff !important;box-sizing:border-box}\n.ex-tbl input:focus,.ex-tbl select:focus{outline:0 !important;\n  border-color:#2563EB !important;box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}  /* layout ไม่ขยับ */\n.ex-tbl input.ex-bad,.ex-tbl select.ex-bad{border-color:#DC2626 !important;\n  box-shadow:0 0 0 2px rgba(220,38,38,.18) !important;background:#FEF2F2 !important}\n.ex-tbl tbody td{height:48px}\n.ex-tbl .ex-c-act{padding:4px 6px !important}\n\n/* ---- หน้าต่างรายการ / รายละเอียด ---- */\n.ex-ltbl{border-collapse:separate !important;border-spacing:0;\n  border:1.5px solid var(--ex-line) !important;border-radius:10px;overflow:hidden}\n.ex-ltbl th{border-right:1px solid rgba(255,255,255,.45) !important;\n  border-bottom:1.5px solid var(--ex-line) !important}\n.ex-ltbl th:last-child{border-right:0 !important}\n.ex-ltbl td{border-right:1px solid var(--ex-line-soft) !important;\n  border-bottom:1px solid var(--ex-line-soft) !important;border-top:0 !important;border-left:0 !important}\n.ex-ltbl td:last-child{border-right:0 !important}\n.ex-ltbl tr.ex-trsum td{border-top:1.5px solid var(--ex-line) !important;font-weight:700}\n.ex-lrow{cursor:pointer}\n.ex-lrow:hover td{background:#F1F6FF !important}\n\n/* ---- การ์ดสรุป 3 กล่อง: กรอบชัด ---- */\n.ex-card{border-width:1.5px !important;border-style:solid !important;\n  box-shadow:0 1px 2px rgba(16,24,40,.06)}\n.ex-card-adv{border-color:#93C5FD !important}\n.ex-card-spent{border-color:#FCA5A5 !important}\n.ex-card-bal{border-color:#6EE7B7 !important}\n.ex-card-bd input{border:1.5px solid #93C5FD !important}\n.ex-card-bd input:focus{outline:0;border-color:#2563EB !important;\n  box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}\n\n/* ---- ฟิลด์หัวเอกสาร ---- */\n.ex-fld input{border:1.5px solid var(--ex-line-soft) !important}\n.ex-fld input:focus{outline:0;border-color:#2563EB !important;box-shadow:0 0 0 2px rgba(37,99,235,.18) !important}\n.ex-dmeta>div{border-width:1.5px !important}\n\n/* ---- ปุ่มยกเลิกการแก้ไข / ปุ่มในรายละเอียด ---- */\n.ex-ib-cancel{background:#FEF3C7 !important;border-color:#FCD34D !important}\n.ex-btn-edit{background:#7C3AED}\n.ex-btn-rm{background:#DC2626}\n\n/* ---- มือถือ: เส้นต้องไม่หาย ---- */\n@media (max-width:860px){\n  .ex-tbl,.ex-ltbl{border-width:1.5px !important}\n  .ex-tbl tbody td,.ex-ltbl td{border-right:1px solid var(--ex-line-soft) !important;\n    border-bottom:1px solid var(--ex-line-soft) !important}\n  .ex-tbl thead th,.ex-ltbl th{border-right:1px solid rgba(255,255,255,.45) !important}\n  .ex-tbl input,.ex-tbl select{border-width:1.5px !important}\n}\n\n\n\n/* ===== 💰 ปิดค่าใช้จ่าย — หน้าหลัก + Modal ทำงาน ===== */\n.ex-head-acts{display:flex;gap:10px;flex-wrap:wrap}\n.ex-head-acts .btn{height:44px;padding:0 18px;border-radius:10px;font-weight:700;font-size:14.5px;\n  border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex-btn-new{background:#16A34A}\n.ex-btn-view{background:#2563EB}\n.ex-btn-save{background:#2563EB}\n.ex-btn-saverow{background:#2563EB}\n.ex-btn-cancel{background:#F59E0B}\n.ex-ib-xls{background:#DCFCE7 !important;border-color:#86EFAC !important}\n.ex-ib-pdf{background:#FEE2E2 !important;border-color:#FCA5A5 !important}\n.ex-home-tbl td.ex-c-act{white-space:nowrap;text-align:center}\n.ex-empty{padding:28px;text-align:center;color:var(--muted)}\n\n/* ---- Modal ทำงาน: ใหญ่กลางจอ ---- */\n#mx-ex-work .modal:has(.ex-workbody){max-width:1180px;width:96vw}\n.ex-workbody{max-height:calc(100vh - 150px);overflow:auto}\n.ex-workbody .ex-meta{margin-bottom:12px}\n.ex-workfoot{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;\n  padding-top:12px;border-top:1px solid var(--line)}\n.ex-workfoot .btn{height:46px;padding:0 20px;border-radius:10px;font-weight:700;border:0;cursor:pointer}\n.ex-workfoot .btn-secondary{border:1px solid var(--line)}\n\n/* ---- การ์ดเอกสาร (หน้าหลัก + รายงาน บนมือถือ) ---- */\n.ex-hcards{display:flex;flex-direction:column;gap:12px}\n.ex-hcard{border:1.5px solid var(--ex-line-soft);border-radius:12px;padding:12px;background:var(--card);cursor:pointer}\n.ex-hcard:active{background:#F1F6FF}\n.ex-hc-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.ex-hc-top b{font-size:15.5px}\n.ex-hc-sub{font-size:12.5px;color:var(--muted);margin:3px 0 9px}\n.ex-hc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}\n.ex-hc-n{border:1px solid var(--ex-line-soft);border-radius:8px;padding:6px 4px;text-align:center;min-width:0}\n.ex-hc-n label{display:block;font-size:10.5px;color:var(--muted)}\n.ex-hc-n b{font-size:12.5px;font-variant-numeric:tabular-nums;word-break:break-all}\n.ex-hc-adv{background:#EFF6FF;border-color:#BFDBFE}\n.ex-hc-sp{background:#FEF2F2;border-color:#FECACA}\n.ex-hc-bl{background:#ECFDF5;border-color:#A7F3D0}\n.ex-hc-adv b,.ex-hc-adv label{color:#1D4ED8}\n.ex-hc-sp b,.ex-hc-sp label{color:#DC2626}\n.ex-hc-bl b,.ex-hc-bl label{color:#047857}\n.ex-hc-acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}\n.ex-hc-acts .btn{height:40px;border-radius:9px;border:0;color:#fff;font-weight:700;font-size:13px;cursor:pointer}\n\n/* ---- การ์ดรายการ (มือถือ ใน Modal ทำงาน) ---- */\n.ex-mcards{display:flex;flex-direction:column;gap:12px}\n.ex-mc{border:1.5px solid var(--ex-line-soft);border-radius:12px;padding:12px;background:#fff;color:#111}\n.ex-mc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}\n.ex-mc-head b{font-size:14.5px;color:#1E3A8A}\n.ex-mc-badge{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px}\n.ex-mc-badge.ok{background:#DCFCE7;color:#166534}\n.ex-mc-badge.wait{background:#FEF3C7;color:#92400E}\n.ex-mc-badge.edit{background:#EDE9FE;color:#5B21B6}\n.ex-mc-saved{background:#F8FAFC}\n.ex-mc-line{font-size:14px;margin-bottom:6px}\n.ex-mc-line b{color:#1E3A8A}\n.ex-mc-line span{color:#444}\n.ex-mc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;\n  font-size:13px;color:#444;padding:4px 0;border-top:1px dashed var(--ex-line-soft)}\n.ex-mc-row b{color:#111;font-variant-numeric:tabular-nums}\n.ex-mc-sum{font-size:16px;color:#4C1D95 !important;font-weight:800}\n.ex-mc-btns{display:flex;gap:6px}\n.ex-mf{display:block;font-size:12.5px;color:#475569;font-weight:600;margin-bottom:8px}\n.ex-mf .req{color:#DC2626}\n.ex-mf input,.ex-mf select{display:block;width:100%;height:44px;margin-top:4px;padding:0 10px;\n  border:1.5px solid #B6C2D6;border-radius:8px;background:#fff;color:#111;font-size:15px;box-sizing:border-box}\n.ex-mf input:focus,.ex-mf select:focus{outline:0;border-color:#2563EB;box-shadow:0 0 0 2px rgba(37,99,235,.18)}\n.ex-mf input.ex-bad,.ex-mf select.ex-bad{border-color:#DC2626;background:#FEF2F2;box-shadow:0 0 0 2px rgba(220,38,38,.18)}\n.ex-mf input.ex-in-money{text-align:right;font-variant-numeric:tabular-nums}\n.ex-mf2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n.ex-mc-total{display:flex;align-items:center;justify-content:space-between;\n  background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:9px;padding:8px 12px;margin-bottom:10px}\n.ex-mc-total label{font-size:12.5px;color:#5B21B6;font-weight:600}\n.ex-mc-total b{font-size:19px;color:#4C1D95;font-weight:800;font-variant-numeric:tabular-nums}\n.ex-mc-acts{display:grid;grid-template-columns:1fr auto;gap:8px}\n.ex-mc-acts .btn{height:46px;border-radius:9px;border:0;color:#fff;font-weight:700;font-size:14px;\n  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 16px}\n\n@media (max-width:860px){\n  .ex-head-acts{width:100%}\n  .ex-head-acts .btn{flex:1;justify-content:center;min-height:46px}\n  #mx-ex-work .modal:has(.ex-workbody){width:100vw;max-width:100vw;border-radius:0}\n  /* เผื่อที่ให้แถบปุ่มล่างแบบ sticky ไม่ทับเนื้อหา */\n  .ex-workbody{max-height:calc(100vh - 110px);padding-bottom:4px}\n  .ex-workfoot{position:sticky;bottom:0;z-index:3;margin:14px -16px 0;padding:10px 16px;\n    background:var(--card);border-top:1.5px solid var(--line);\n    box-shadow:0 -6px 16px rgba(0,0,0,.18)}\n  .ex-workfoot .btn{flex:1;min-height:48px}\n  .ex-mcards{padding-bottom:4px}\n  .ex-mc-acts .btn{min-height:48px}\n  .ex-bar{margin-top:10px}\n}\n\n\n\n/* คอลัมน์บริษัทในตารางหน้าแรก */\n.ex-home-tbl td.ex-c-co2{max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.ex-dacts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.ex-dacts .btn{height:42px;padding:0 16px;border-radius:9px;font-weight:700;border:0;cursor:pointer;color:#fff}\n.ex-dacts .btn-secondary{border:1px solid var(--line)}\n\n\n/* ตารางหน้าแรก 9 คอลัมน์ — กว้างพอดี Desktop · ตัวเลขชิดขวา */\n.ex-home-tbl{min-width:1040px}\n.ex-home-tbl th{white-space:nowrap}\n.ex-home-tbl td.ex-money{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}\n.ex-home-tbl td.ex-c-co2{max-width:200px}\n.ex-home-tbl td.ex-c-act{width:104px;white-space:nowrap;text-align:center}\n\n\n/* ===== 💰 ปิดค่าใช้จ่าย — ธีมสว่าง (เฉพาะ Desktop · ไม่แตะ Mobile และเมนูอื่น) ===== */\n@media (min-width:861px){\n\n  /* --- พื้นหลังหน้าหลัก: ครอบทั้งพื้นที่ ไม่ให้เหลือสีดำ --- */\n  .main:has(.ex-wrap){background:#F5F8FF !important}\n  #view-root:has(.ex-wrap){background:#F5F8FF !important;min-height:100%}\n  .content.ex-wrap{\n    background:#F5F8FF !important;\n    min-height:100vh;\n  }\n  .content.ex-wrap .ex-title h2{color:#1E3A8A !important}\n  .content.ex-wrap .ex-title p{color:#5B6B86 !important}\n\n  /* แถบหัวหน้า: พื้นขาว ตัวอักษรกรมท่า */\n  .content.ex-wrap .ex-head{\n    background:#fff;border:1px solid #DCE4F2;border-radius:12px;\n    padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)\n  }\n\n  /* กล่องตาราง: ขาว ขอบเทาอ่อน มุมโค้ง 12px */\n  .content.ex-wrap .panel.ex-panel{\n    background:#fff !important;border:1px solid #DCE4F2 !important;\n    border-radius:12px !important;overflow:hidden;\n    box-shadow:0 1px 3px rgba(16,24,40,.06)\n  }\n\n  /* --- ตารางหน้าหลัก --- */\n  .ex-home-tbl{border:0 !important;border-radius:12px !important;background:#fff}\n  .ex-home-tbl thead th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;\n    color:#fff !important;border-bottom:0 !important;\n    border-right:1px solid rgba(255,255,255,.28) !important;\n    padding:13px 10px;font-size:13.5px\n  }\n  .ex-home-tbl thead th:last-child{border-right:0 !important}\n  .ex-home-tbl tbody td{\n    background:#fff !important;color:#17233B !important;\n    border-right:1px solid #E6ECF7 !important;\n    border-bottom:1px solid #E6ECF7 !important;\n    padding:13px 10px;font-size:14px\n  }\n  .ex-home-tbl tbody td:last-child{border-right:0 !important}\n  .ex-home-tbl tbody tr:last-child td{border-bottom:0 !important}\n  /* สลับฟ้าอ่อนเมื่อมีหลายรายการ */\n  .ex-home-tbl tbody tr:nth-child(even) td{background:#F7FAFF !important}\n  .ex-home-tbl tbody tr:hover td{background:#EAF2FF !important}\n  .ex-home-tbl tbody td b{color:#13233F}\n  .ex-home-tbl tbody td.ex-neg,.ex-home-tbl tbody td.ex-neg b{color:#DC2626 !important}\n\n  /* --- หน้าต่างรายงาน / รายการ: พื้นขาว --- */\n  #mx-ex-detail .modal:has(.ex-ltbl),\n  #mx-ex-detail .modal:has(.ex-dmeta),\n  #mx-ex-work .modal:has(.ex-workbody){\n    background:#fff !important;border-color:#DCE4F2 !important\n  }\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head{\n    background:#fff !important;border-bottom:1px solid #E6ECF7 !important\n  }\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head h2,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head h2,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head h2{color:#1E3A8A !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-head .sub,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-head .sub,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-head .sub{color:#5B6B86 !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .modal-body,\n  #mx-ex-detail .modal:has(.ex-dmeta) .modal-body,\n  #mx-ex-work .modal:has(.ex-workbody) .modal-body{background:#fff !important}\n  #mx-ex-detail .modal:has(.ex-ltbl) .x,\n  #mx-ex-detail .modal:has(.ex-dmeta) .x,\n  #mx-ex-work .modal:has(.ex-workbody) .x{background:#F1F5FC !important;color:#334155 !important}\n\n  /* ตารางในหน้าต่าง: หัวน้ำเงินแบบเดียวกัน */\n  #mx-ex-detail .ex-ltbl,#mx-ex-work .ex-ltbl{border:1px solid #DCE4F2 !important;border-radius:12px !important}\n  #mx-ex-detail .ex-ltbl th,#mx-ex-work .ex-ltbl th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;color:#fff !important;\n    border-right:1px solid rgba(255,255,255,.28) !important;border-bottom:0 !important\n  }\n  #mx-ex-detail .ex-ltbl th:last-child,#mx-ex-work .ex-ltbl th:last-child{border-right:0 !important}\n  #mx-ex-detail .ex-ltbl td,#mx-ex-work .ex-ltbl td{\n    background:#fff !important;color:#17233B !important;\n    border-right:1px solid #E6ECF7 !important;border-bottom:1px solid #E6ECF7 !important\n  }\n  #mx-ex-detail .ex-ltbl tbody tr:nth-child(even) td{background:#F7FAFF !important}\n  #mx-ex-detail .ex-ltbl tr.ex-trsum td{background:#EAF2FF !important;border-top:1.5px solid #C7D7F0 !important}\n  #mx-ex-detail .ex-ltbl td:last-child,#mx-ex-work .ex-ltbl td:last-child{border-right:0 !important}\n\n  /* กล่องสรุปในหน้าต่างรายงาน */\n  #mx-ex-detail .ex-dmeta>div{background:#F7FAFF !important;border-color:#DCE4F2 !important}\n  #mx-ex-detail .ex-dmeta label{color:#5B6B86 !important}\n  #mx-ex-detail .ex-dmeta b{color:#13233F !important}\n  #mx-ex-detail .ex-dmeta b.ex-neg{color:#DC2626 !important}\n\n  /* ช่องค้นหาในหน้าต่างรายการ */\n  #mx-ex-detail .ex-lfilter input{background:#fff !important;color:#17233B !important;border-color:#DCE4F2 !important}\n\n  /* ตารางกรอกใน Modal เปิดงาน: หัวน้ำเงินไล่เฉดให้เข้าชุด */\n  #mx-ex-work .ex-tbl thead th{\n    background:linear-gradient(135deg,#368BD5 0%,#2455AD 100%) !important;\n    border-bottom:0 !important\n  }\n  #mx-ex-work .ex-workbody .ex-fld label{color:#5B6B86 !important}\n  #mx-ex-work .ex-workbody .ex-fld input{background:#fff !important;color:#17233B !important}\n  #mx-ex-work .ex-workbody .ex-fld input.ex-ro{background:#F7FAFF !important}\n  #mx-ex-work .ex-workfoot{background:#fff !important;border-top-color:#E6ECF7 !important}\n  #mx-ex-work .ex-workfoot .btn-secondary{background:#F1F5FC !important;color:#334155 !important;border-color:#DCE4F2 !important}\n  #mx-ex-detail .ex-dacts .btn-secondary{background:#F1F5FC !important;color:#334155 !important;border-color:#DCE4F2 !important}\n\n  /* ตารางในหน้าต่างไม่ล้นจอ */\n  #mx-ex-detail .modal:has(.ex-dmeta),#mx-ex-detail .modal:has(.ex-ltbl){max-width:1120px;width:94vw}\n}\n\n\n\n/* ===== หัวตารางรายงาน: พื้นเดียวกันทุกช่อง ไม่มี Gradient (ทั้งคอมและมือถือ) ===== */\n.ex-home-tbl thead th,\n.ex-ltbl thead th, .ex-ltbl th,\n.ex-tbl thead th{\n  background:#EAF2FC !important;\n  background-image:none !important;          /* ยกเลิก Gradient เดิม */\n  color:#24466B !important;\n  border-right:1px solid #DCE5F0 !important;\n  border-bottom:1px solid #DCE5F0 !important;\n  font-weight:700;\n}\n.ex-home-tbl thead th:last-child,\n.ex-ltbl thead th:last-child, .ex-ltbl th:last-child,\n.ex-tbl thead th:last-child{ border-right:1px solid #DCE5F0 !important }\n/* เส้นตารางให้เท่ากันทุกช่อง */\n.ex-home-tbl, .ex-ltbl, .ex-tbl{ border:1px solid #DCE5F0 !important }\n.ex-home-tbl tbody td, .ex-ltbl tbody td, .ex-tbl tbody td{\n  border-right:1px solid #DCE5F0 !important;\n  border-bottom:1px solid #DCE5F0 !important;\n}\n.ex-home-tbl tbody tr:last-child td, .ex-ltbl tbody tr:last-child td{ border-bottom:0 !important }\n\n/* ===== local322: คอลัมน์ \"เลขใบหัก\" (ระหว่าง ยอดรวม กับ สถานที่) + ให้ 9 คอลัมน์พอดีจอ Desktop ===== */\n.ex-tbl .ex-c-wht{background:#FFF7ED}\n.ex-tbl tbody td.ex-c-wht,.ex-tbl tr.ex-draft td.ex-c-wht{background:#FFF7ED !important}\n.ex-tbl .ex-c-wht .ex-ro-cell{word-break:break-all}\n.ex-mc-wht{word-break:break-all;text-align:right}\n@media (min-width:861px){\n  .ex-tbl{table-layout:fixed}\n  .ex-tbl thead th{white-space:normal !important;line-height:1.25}\n  .ex-tbl .ex-c-no{width:52px}\n  .ex-tbl .ex-c-job{width:12%}\n  .ex-tbl .ex-c-co{min-width:0}\n  .ex-tbl .ex-c-cost,.ex-tbl .ex-c-rcp,.ex-tbl .ex-c-sum{width:10.5%}\n  .ex-tbl .ex-c-wht{width:11%}\n  .ex-tbl .ex-c-place{width:13%}\n  .ex-tbl .ex-c-act{width:92px}\n  .ex-tbl .ex-c-co .ex-ro-cell,.ex-tbl .ex-c-job .ex-ro-cell{overflow-wrap:anywhere}\n}\n\n/* ===== local324: หน้าต่าง 💰 ปิดค่าใช้จ่าย — หัวตารางฟ้าเทาอ่อน อ่านง่าย (Desktop เท่านั้น · สีอย่างเดียว ไม่เปลี่ยนขนาด) ===== */\n@media (min-width:861px){\n  #mx-ex-work .ex-tbl thead th{\n    background:#DCE7F3 !important;background-image:none !important;\n    color:#27466D !important;font-weight:700 !important;\n    border-right:1px solid #D5DFEB !important\n  }\n  #mx-ex-work .ex-tbl thead th:last-child{border-right:1px solid #D5DFEB !important}\n  #mx-ex-work .ex-tbl tbody td{border-right:1px solid #D5DFEB !important;border-bottom-color:#D5DFEB !important}\n  #mx-ex-work .ex-tbl tbody tr td{background:#FFFFFF !important}\n  #mx-ex-work .ex-tbl tbody tr:nth-child(even) td{background:#F8FAFD !important}\n  #mx-ex-work .ex-tbl tbody tr:hover td{background:#EEF4FB !important}\n}\n";
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

/* local330: หน้าเปิดงาน / สรุปค่าใช้จ่าย (ของใหม่ทั้งหมด · class ex2-*) */
var EX2_CSS = "/* ===== 💰 ค่าใช้จ่าย (Expenses) — หน้าเปิดงาน / สรุปค่าใช้จ่าย (ของใหม่ทั้งหมด · ไม่แก้ CSS เดิม) ===== */\n.ex2{color-scheme:light}\n@media (min-width:861px){ .ex-workbody.ex2{min-height:min(620px, calc(100vh - 150px))} }\n.ex2 .req{color:#DC2626}\n.ex2-tabs{display:flex;gap:8px;margin:0 0 14px;flex-wrap:wrap}\n.ex2-tab{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:10px;\n  border:1.5px solid #C7D7F0;background:#F1F6FD;color:#24466B;font:inherit;font-weight:700;font-size:14.5px;cursor:pointer}\n.ex2-tab.on{background:#1E3A8A;border-color:#1E3A8A;color:#fff}\n.ex2-tcnt{font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.85);color:#1E3A8A}\n.ex2-tab:not(.on) .ex2-tcnt{background:#DCE7F3}\n.ex2-head{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;margin-bottom:10px}\n.ex2-head .ex-fld input,.ex2-head .ex-fld select{width:100%;height:40px;padding:0 10px;border:1.5px solid #C3CEDF;border-radius:8px;\n  background:#fff;color:#17233B;font:inherit;font-size:14px;min-width:0;box-sizing:border-box}\n.ex2-head .ex-fld input.ex-ro{background:#F7FAFF;color:#17233B}\n.ex2-head .ex-fld input:disabled,.ex2-head .ex-fld select:disabled{background:#F1F5F9;color:#64748B;cursor:not-allowed}\n.ex2-head .ex2-jobfld{grid-column:span 2}\n.ex2-head .ex2-cofld{grid-column:span 1}\n.ex2-in-money{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}\n.ex2-jobbox{position:relative}\n.ex2-dd{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:60;background:#fff;border:1px solid #C7D7F0;border-radius:10px;\n  box-shadow:0 14px 32px rgba(15,23,42,.22);max-height:340px;overflow:auto;padding:4px}\n.ex2-dd-sec{font-size:11.5px;font-weight:700;color:#5B6B86;padding:8px 10px 4px;text-transform:none}\n.ex2-dd-it{display:grid;grid-template-columns:auto 1fr;gap:0 10px;width:100%;text-align:left;border:0;background:#fff;border-radius:8px;\n  padding:8px 10px;cursor:pointer;font:inherit;color:#17233B}\n.ex2-dd-it:hover,.ex2-dd-it.on{background:#EAF2FC}\n.ex2-dd-it b{font-size:14px;color:#1E3A8A;white-space:nowrap}\n.ex2-dd-it span{font-size:13px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.ex2-dd-it small{grid-column:1 / -1;font-size:11.5px;color:#64748B;justify-self:start}\n.ex2-dd-more{padding:10px;font-size:12.5px;color:#64748B;text-align:center}\n.ex2-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:2px 0 12px}\n.ex2-chips-l{font-size:12.5px;color:#5B6B86;font-weight:600;margin-right:2px}\n.ex2-chip{border:1.5px solid #C7D7F0;background:#fff;color:#1E3A8A;border-radius:999px;padding:4px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}\n.ex2-chip small{display:inline-block;min-width:18px;padding:0 5px;border-radius:999px;background:#DCE7F3;color:#24466B;font-size:11px;text-align:center}\n.ex2-chip.on{background:#1E3A8A;border-color:#1E3A8A;color:#fff}\n.ex2-chip.on small{background:rgba(255,255,255,.85)}\n.ex2-chip.ex2-closed:not(.on){background:#F1F5F9;color:#475569;border-color:#CBD5E1}\n.ex2-jhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 8px}\n.ex2-st{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}\n.ex2-st.ex2-open{background:#FEF3C7;color:#92400E}\n.ex2-st.ex2-closed{background:#DCFCE7;color:#166534}\n.ex2-st.ex2-new{background:#E0E7FF;color:#3730A3}\n.ex2-muted{color:#64748B !important;font-size:12.5px}\n.ex2-empty{padding:28px 14px;text-align:center;color:#475569;background:#F7FAFF;border:1.5px dashed #C7D7F0;border-radius:12px;font-size:14px}\n.ex2-pill{display:inline-block;padding:2px 10px;border-radius:999px;background:#DBEAFE;color:#1E3A8A;font-weight:700;font-size:13px;white-space:nowrap}\n/* ตารางเปิดงาน 7 คอลัมน์ */\n.ex2-wtbl{min-width:820px !important}\n.ex2-wtbl .ex2-c-job{width:150px;text-align:center}\n.ex2-wtbl .ex2-c-desc{min-width:220px}\n.ex2-wtbl .ex2-c-qty{width:90px}\n.ex2-wtbl .ex2-c-amt{width:140px}\n.ex2-wtbl .ex-c-act{width:96px}\n.ex2-wtbl tbody td.ex2-c-desc,.ex2-wtbl tbody td.ex2-c-qty,.ex2-wtbl tbody td.ex2-c-amt,.ex2-wtbl tbody td.ex2-c-job{background:#fff !important}\n.ex2-wtbl tr.ex2-dirty td{background:#FFFBEB !important}\n.ex2-wtbl tr.ex2-ro td{background:#F8FAFC !important}\n.ex2-wtbl tr.ex2-jtot td{background:#DBEAFE !important;color:#1E3A8A !important;font-weight:800;text-align:center}\n.ex2-wtbl tr.ex2-jtot td.ex-money{text-align:right}\n.ex2-tdempty{text-align:center;color:#64748B !important;padding:20px !important}\n.ex2-bar{border-top:0 !important;padding:12px 0 0 !important}\n.ex2-mtot{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:10px;padding:10px 12px;border-radius:10px;background:#DBEAFE;color:#1E3A8A;font-size:13.5px}\n.ex2-mtot b{font-variant-numeric:tabular-nums}\n.ex2-mf3{display:grid;grid-template-columns:.7fr 1fr 1fr;gap:8px}\n.ex-mc.ex2-dirty{border-color:#F59E0B}\n/* สรุปค่าใช้จ่าย */\n.ex2-filters{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px}\n.ex2-fb{height:38px;padding:0 16px;border-radius:999px;border:1.5px solid #C7D7F0;background:#fff;color:#24466B;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}\n.ex2-fb.on{background:#1E3A8A;border-color:#1E3A8A;color:#fff}\n.ex2-stbl{min-width:860px}\n.ex2-stbl th{text-align:center}\n.ex2-stbl .ex2-ck{width:42px;text-align:center}\n.ex2-stbl .ex2-ck input{width:18px;height:18px;cursor:pointer;accent-color:#1E3A8A}\n.ex2-stbl .ex2-c{text-align:center}\n.ex2-stbl tbody tr.ex2-on td{background:#EFF6FF !important}\n.ex2-stbl td.ex2-tot{background:#ECFDF5 !important;font-weight:800;color:#065F46 !important}\n.ex2-stbl tr.ex2-selrow td{background:#1E3A8A !important;color:#fff !important;font-weight:800;border-color:#1E3A8A !important}\n.ex2-stbl tr.ex2-selrow td.ex-money{text-align:right}\n.ex2-link{border:0;background:#E0E7FF;color:#3730A3;border-radius:999px;padding:3px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}\n.ex2-link:hover{background:#C7D2FE}\n.ex2-sumacts{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}\n.ex2-sumacts .btn{height:42px;padding:0 14px;border-radius:9px;font-weight:700;font-size:13.5px;border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex2-sumacts .btn:disabled{opacity:.6;cursor:wait}\n.ex2-sp{flex:1}\n.ex2-b-ghost{background:#F1F5FC !important;color:#24466B !important;border:1.5px solid #C7D7F0 !important}\n.ex2-b-close{background:#7C3AED}\n.ex2-b-blue{background:#2563EB}\n.ex2-note{font-size:12.5px;color:#5B6B86;margin:10px 0 0;line-height:1.6}\n.ex2 .ex-card-adv .ex-card-bd b{color:#1D4ED8}\n.ex2-tab{white-space:nowrap}\n.ex2-reopen{margin-top:12px}\n.ex2-reopen label{display:block;font-size:12.5px;font-weight:700;color:#5B6B86;margin-bottom:4px}\n.ex2-reopen input{width:100%;height:40px;border:1.5px solid #C3CEDF;border-radius:8px;padding:0 10px;font:inherit;background:#fff;color:#17233B}\n@media (max-width:860px){\n  .ex2-head{grid-template-columns:1fr 1fr}\n  .ex2-head .ex2-jobfld{grid-column:1 / -1}\n  .ex2-head .ex2-cofld{grid-column:1 / -1}\n  .ex2-tab{flex:1;justify-content:center;padding:0 8px;font-size:13px;gap:5px}\n  .ex2-tcnt{font-size:11px;padding:1px 6px}\n  .ex2-sumacts .btn{flex:1 1 calc(50% - 8px);justify-content:center;min-height:46px}\n  .ex2-sp{display:none}\n  .ex2-stbl{min-width:760px}\n  .ex2-chips-l{width:100%}\n}\n@media (max-width:420px){ .ex2-tcnt{display:none} }\n";
var EX3_CSS = "\n/* ===== local331: EXPENSES Desktop UI — กรอบข้อมูลหลัก · ตาราง 8 คอลัมน์ (มี Tax number) · ปุ่มล่างแถวเดียว ===== */\n#mx-ex-work .modal:has(.ex2){max-width:1320px;width:96vw}\n#mx-ex-work .modal:has(.ex2) .modal-head h2{font-size:22px;line-height:1.3}\n#mx-ex-work .modal:has(.ex2) .modal-head .sub{font-size:14px;margin-top:4px;line-height:1.5}\n.ex2-tab{height:46px;font-size:15px}\n.ex2-tab:not(.on){background:#EAF1FA;border-color:#D3E0F0;color:#1E3A8A}\n.ex2-headbox{border:1px solid #D9E2EC;border-radius:12px;padding:14px 16px 16px;background:#FBFCFE;margin:0 0 12px}\n.ex2-head{gap:12px !important;margin:0 !important}\n.ex2-head .ex-fld{gap:6px}\n.ex2-head .ex-fld label{font-size:13px !important;font-weight:700;color:#334155 !important}\n.ex2-head .ex-fld input,.ex2-head .ex-fld select{height:42px !important;border:1px solid #D9E2EC !important;border-radius:9px !important;font-size:15px !important}\n.ex2-head .ex-fld input.ex-ro{background:#F1F5FA !important;color:#17233B !important}\n.ex2-head #ex-jobq,.ex2-head #ex-co{font-weight:600;color:#0F2A5C !important}\n.ex2-head .ex2-in-money{text-align:right !important;font-variant-numeric:tabular-nums}\n.ex2-statusrow{display:flex !important;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px !important}\n.ex2-statusrow .ex2-chips-l{font-weight:700;color:#334155;width:auto !important}\n.ex2-statusrow .ex2-st{font-size:12px;padding:3px 10px}\n.ex2-chip{white-space:nowrap}\n.ex2-wtbl{table-layout:fixed !important;width:100% !important;min-width:1040px !important;border-collapse:separate !important;border-spacing:0;border:1px solid #D9E2EC !important;border-radius:10px;overflow:hidden}\n.ex2-wtbl col.w-no{width:5%}.ex2-wtbl col.w-job{width:14%}.ex2-wtbl col.w-desc{width:30%}.ex2-wtbl col.w-qty{width:7%}\n.ex2-wtbl col.w-amt{width:12%}.ex2-wtbl col.w-tax{width:12%}.ex2-wtbl col.w-act{width:8%}\n#mx-ex-work .ex2-wtbl thead th{background:#E3EEFA !important;background-image:none !important;color:#1E3A8A !important;height:46px;padding:0 8px !important;\n  vertical-align:middle !important;text-align:center;font-size:13.5px;font-weight:800 !important;border-right:1px solid #D9E2EC !important;border-bottom:1px solid #D9E2EC !important;white-space:nowrap !important;width:auto !important}\n#mx-ex-work .ex2-wtbl thead th:last-child,#mx-ex-work .ex2-wtbl tbody td:last-child{border-right:0 !important}\n#mx-ex-work .ex2-wtbl tbody td{height:54px;padding:8px 10px !important;border-right:1px solid #D9E2EC !important;border-bottom:1px solid #D9E2EC !important;\n  vertical-align:middle;background:#FFFFFF !important;width:auto !important}\n#mx-ex-work .ex2-wtbl tbody tr:nth-child(even) td{background:#F7FAFE !important}\n#mx-ex-work .ex2-wtbl tbody tr.ex2-dirty td{background:#FFFBEB !important}\n#mx-ex-work .ex2-wtbl tbody tr.ex2-jtot td{background:#E3EEFA !important;color:#1E3A8A !important;font-weight:800;border-bottom:0 !important}\n#mx-ex-work .ex2-wtbl tbody td.ex-c-no{text-align:center;color:#334155 !important}\n#mx-ex-work .ex2-wtbl .ex2-c-job{text-align:center}\n.ex2-wtbl .ex2-pill{background:#E0ECFB;color:#123B82;font-weight:800;font-size:13px;padding:4px 10px;white-space:nowrap;overflow:visible}\n#mx-ex-work .ex2-wtbl input{height:38px !important;border:1px solid #CBD5E1 !important;border-radius:8px !important;font-size:14px !important;padding:0 9px !important;width:100%}\n#mx-ex-work .ex2-wtbl input.ex-in-money{text-align:right}\n#mx-ex-work .ex2-wtbl td.ex-c-act{text-align:center;white-space:nowrap;padding:8px 4px !important}\n#mx-ex-work .ex2-wtbl .ex-ib{width:38px;height:38px;margin:0 2px;border-radius:9px}\n#mx-ex-work .ex2-wtbl .ex-ib-save{background:#2563EB !important;border-color:#2563EB !important;color:#fff}\n#mx-ex-work .ex2-wtbl .ex-ib-del{background:#FEE2E2 !important;border-color:#FECACA !important}\n.ex2-wtbl td.ex2-c-tax{word-break:break-all}\n#mx-ex-work .ex2-wtbl thead th.ex2-c-tax{text-transform:none !important;letter-spacing:0}\n.ex2-actbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}\n.ex2-actbar .btn{height:44px !important;padding:0 18px;border-radius:10px;font-weight:700;font-size:14.5px;border:0;cursor:pointer;color:#fff;display:inline-flex;align-items:center;gap:6px}\n.ex2-actbar .ex2-b-add{background:#16A34A}\n.ex2-actbar .ex-btn-pdf{background:#DC2626}\n.ex2-actbar .ex-btn-save{background:#1E40AF}\n.ex2-actbar .btn-secondary{background:#F1F5FC !important;color:#334155 !important;border:1px solid #DCE4F2 !important}\n@media (max-width:860px){ .ex2-actbar .btn{flex:1 1 calc(50% - 10px);justify-content:center} .ex2-actbar .ex2-sp{display:none} }\n";
function _exInjectCss(){
  if(document.getElementById('mx-ex-css')) return;
  var st=document.createElement('style'); st.id='mx-ex-css';
  st.textContent = EX_CSS + '\n' + PICK_CSS + '\n' + EX2_CSS + '\n' + EX3_CSS;
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
function canEditExpense(){ return !!S.user && _exRole()!=='MESSENGER' && !(typeof _admRo354==='function'&&_admRo354())/* local354: ADMIN ดูอย่างเดียว */; }
function canDeleteExpense(){ const r=_exRole(); return r==='SUPER_ADMIN'/* local361: ADMIN = USER (ลบ/ยกเลิกปิดสรุป ไม่ได้) */; }
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

var _exMoneyFmt366=null;/* local366: สร้างตัวจัดรูปแบบครั้งเดียว · ผลเหมือนเดิม */
function _exMoney(n){
  const v = Number(n||0);
  try{ if(!_exMoneyFmt366) _exMoneyFmt366 = new Intl.NumberFormat('th-TH',{minimumFractionDigits:2, maximumFractionDigits:2}); return _exMoneyFmt366.format(v); }catch(_){ return v.toLocaleString('th-TH',{minimumFractionDigits:2, maximumFractionDigits:2}); }
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
function _exAdvDoc(r){ return _exNum(r && r.advance_amount) + _exNum(r && r.nj_advance_total); }   // เบิกเงิน = ระดับเอกสาร (ข้อมูลเดิม) + Nj advance ราย JOB
function _exBalDoc(r){ return _exAdvDoc(r) - _exNum(r && r.spent_total); }
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
            <td class="ex-money">${_exMoney(_exAdvDoc(r))}</td>
            <td class="ex-money">${_exMoney(r.spent_total)}</td>
            <td class="ex-money ${_exBalDoc(r)<0?'ex-neg':''}"><b>${_exMoney(_exBalDoc(r))}</b></td>
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
        <div class="ex-hc-n ex-hc-adv"><label>เบิกเงิน</label><b>${_exMoney(_exAdvDoc(r))}</b></div>
        <div class="ex-hc-n ex-hc-sp"><label>ใช้ไป</label><b>${_exMoney(r.spent_total)}</b></div>
        <div class="ex-hc-n ex-hc-bl"><label>คงเหลือ</label><b class="${_exBalDoc(r)<0?'ex-neg':''}">${_exMoney(_exBalDoc(r))}</b></div>
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

/* ============================================================
   💰 ค่าใช้จ่าย (Expenses) — บันทึกราย Item → สรุปราย JOB → เลือกปิดสรุป → PDF   (local330 · SQL RUN-14)
   ข้อมูล: ms_expense_docs · ms_expense_jobs (Nj advance / สถานะปิดสรุป ราย JOB) · ms_expense_items (รายละเอียด / QTY / Cost / Receipt · job_doc_id)
   ทุกคำสั่งผ่าน RPC ms_expense_* (ตรวจ session + สิทธิ์ฝั่ง DB) · ข้อมูลเดิม (ไม่มี job_doc_id) = ปิดสรุปแล้ว (ดู/พิมพ์ได้)
   ============================================================ */
Object.assign(EX, { jobs:[], cur:null, tab:'work', edit:{}, adv:{}, sumFilter:'all', sumSel:new Set(), info:{} });
const EX_DESC_OPTS  = ['Service charge','Lift on','Over time','Custom fee','Storage charge','Demurrage','Amend entry','Re-fund','Check list'];
function _exQty(n){ const v = Number(n==null?1:n); return v.toLocaleString('th-TH',{minimumFractionDigits:0, maximumFractionDigits:2}); }
/* ตรวจตัวเลข: ห้ามติดลบ · ทศนิยมไม่เกิน 2 · mustPos = ต้อง > 0 (QTY) */
function _exAmt(raw, label, mustPos){
  const s = String(raw==null?'':raw).replace(/,/g,'').trim();
  if(s==='') return mustPos ? { ok:false, msg:label+' ต้องมากกว่า 0' } : { ok:true, val:0 };
  if(/^-/.test(s)) return { ok:false, msg:label+' ติดลบไม่ได้' };
  if(!/^\d*\.?\d+$/.test(s)) return { ok:false, msg:label+' ต้องเป็นตัวเลข' };
  if((s.split('.')[1]||'').length > 2) return { ok:false, msg:label+' ทศนิยมได้ไม่เกิน 2 ตำแหน่ง' };
  const v = parseFloat(s);
  if(mustPos && !(v > 0)) return { ok:false, msg:label+' ต้องมากกว่า 0' };
  return { ok:true, val:v };
}
function _exIsUuid(s){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||'')); }

/* ---------- จัดกลุ่ม 1 JOB = 1 แถว (Nj advance นับครั้งเดียวต่อ JOB) ---------- */
function _exGroupsOf(items, jobs){
  const map = new Map();
  (jobs||[]).forEach(j=>{
    const key = j.job_doc_id || ('ej:'+j.id);
    map.set(key, { key, job_doc_id:j.job_doc_id||null, src_doc_id:null, job_no:j.job_no||'', company:j.company||'',
                   adv:_exNum(j.nj_advance), status:j.status||'OPEN', legacy:false, row:j, items:[] });
  });
  (items||[]).forEach(it=>{
    let key;
    if(it.job_doc_id){
      key = it.job_doc_id;
      if(!map.has(key)) map.set(key, { key, job_doc_id:it.job_doc_id, src_doc_id:null, job_no:it.job_no||'', company:it.company||'',
                                       adv:0, status:'OPEN', legacy:false, row:null, items:[] });
    } else {                                          // ข้อมูลเดิม → ถือว่าปิดสรุปแล้ว
      key = 'L:' + (it.source_doc_id || ('n:'+String(it.job_no||'').trim()));
      if(!map.has(key)) map.set(key, { key, job_doc_id:null, src_doc_id:it.source_doc_id||null, job_no:it.job_no||'', company:it.company||'',
                                       adv:0, status:'CLOSED', legacy:true, row:null, items:[] });
    }
    map.get(key).items.push(it);
  });
  const arr = [...map.values()];
  arr.forEach(g=>{
    g.items.sort((a,b)=>(a.seq||0)-(b.seq||0));
    g.qty  = g.items.reduce((s,x)=>s+_exNum(x.qty==null?1:x.qty),0);
    g.cost = g.items.reduce((s,x)=>s+_exNum(x.cost_amount),0);
    g.rcp  = g.items.reduce((s,x)=>s+_exNum(x.receipt_amount),0);
    g.total = g.cost + g.rcp;                         // Total Amount = Cost + Receipt (ไม่รวม Nj advance)
  });
  arr.sort((a,b)=>String(a.job_no).localeCompare(String(b.job_no),'en',{numeric:true}) || String(a.key).localeCompare(String(b.key)));
  return arr;
}
function _exGroups(){ return _exGroupsOf(EX.items, EX.jobs); }
function _exSums(list){
  return (list||[]).reduce((s,g)=>{ s.n++; s.items+=g.items.length; s.qty+=g.qty; s.adv+=g.adv; s.cost+=g.cost; s.rcp+=g.rcp; s.total+=g.total; return s; },
                           { n:0, items:0, qty:0, adv:0, cost:0, rcp:0, total:0 });
}
/* เบิกเงิน = Nj advance ของ JOB ที่เลือก (+ ยอดเบิกระดับเอกสารของข้อมูลเดิม เมื่อเลือกครบทุก JOB ของเอกสาร) */
function _exAdvTotal(sel, all, h){
  let v = _exSums(sel).adv;
  const docAdv = _exNum(h && h.advance_amount);
  if(docAdv > 0 && sel.length && sel.length === (all||[]).length) v += docAdv;
  return v;
}
function _exStatusOf(g){
  if(!g) return { cls:'new', label:'' };
  if(g.status==='CLOSED') return { cls:'closed', label: g.legacy ? '🔒 ปิดสรุปแล้ว (ข้อมูลเดิม)' : '🔒 ปิดสรุปแล้ว' };
  if(g.items.length) return { cls:'open', label:'✅ บันทึกแล้ว / รอปิดสรุป' };
  return { cls:'new', label:'🆕 ยังไม่มีรายการที่บันทึก' };
}
function _exGroupEditable(g){ return !!(g && canEditExpense() && !g.legacy && g.status!=='CLOSED' && g.job_doc_id); }
/* JOB ที่กำลังทำงาน (มีในเอกสารแล้ว หรือเพิ่งเลือกจากรายการรอปิด) */
function _exCurGroup(groups){
  if(!EX.cur) return null;
  const gs = groups || _exGroups();
  const g = gs.find(x=>x.key===EX.cur);
  if(g) return g;
  if(!_exIsUuid(EX.cur)) return null;
  const inf = EX.info[EX.cur] || (EXJ.rows||[]).find(r=>r.id===EX.cur) || {};
  return { key:EX.cur, job_doc_id:EX.cur, src_doc_id:null, job_no:inf.doc_no||'', company:inf.company||'',
           adv:_exNum(EX.adv[EX.cur]), status:'NEW', legacy:false, row:null, items:[], qty:0, cost:0, rcp:0, total:0 };
}
function _exDirtyKeys(){
  const ks = Object.keys(EX.edit||{});
  (EX.drafts||[]).forEach(d=>{ if(String(d.description||'').trim() || String(d.cost||'').trim() || String(d.receipt||'').trim() || String(d.tax||'').trim() || String(d.qty||'1').trim()!=='1') ks.push(d.key); });
  return ks;
}


/* ---------- โหลดข้อมูลเอกสาร (RPC ms_expense_doc_get: head + items + jobs + infos) ---------- */
function _exApplyDocGet(r){
  if(!r) return;
  if(r.head) EX.doc = Object.assign({}, EX.doc||{}, r.head, { pending:false });
  if(Array.isArray(r.items)) EX.items = r.items;
  EX.jobs = Array.isArray(r.jobs) ? r.jobs : [];
  if(r.infos && typeof r.infos==='object') Object.keys(r.infos).forEach(k=>{ EX.info[k] = r.infos[k]; });
}
async function _exLoadDocData(){
  const id = EX.doc && EX.doc.id;
  if(!id){ EX.items = []; EX.jobs = []; return; }
  _exApplyDocGet(await _rpc('ms_expense_doc_get', { p_doc_id: id }));
}
async function _exReloadJobs(){ if(EX.doc && EX.doc.id) await _exLoadDocData(); }
/* ข้อมูลหัว JOB ที่ยังไม่อยู่ในเอกสาร → ใช้แถวจากรายการรอปิด (อ่านอย่างเดียว) */
async function _exEnsureInfo(ids){
  (ids||[]).forEach(id=>{ if(id && !EX.info[id]){ const r=(EXJ.rows||[]).find(x=>x.id===id); if(r) EX.info[id]=r; } });
}
/* JOB ที่ปล่อยเสร็จแล้ว (ตั้งแต่ 15/10/2026) ยังไม่ถูกใช้ในเอกสารใด — กรอง Scope ฝั่ง DB (ms_expense_pending_jobs) */
async function _exLoadPending(){
  if(EXJ.loading) return;
  EXJ.loading = true;
  try{
    const data = await _rpc('ms_expense_pending_jobs', { p_q: null });
    EXJ.rows = Array.isArray(data) ? data : [];
  }catch(e){
    console.error('[expense job]', e);
    toast('โหลดรายการ JOB ไม่สำเร็จ: '+_exErr(e),'error');
  }finally{
    EXJ.loading = false;
    if(_exWorkOpen() && EX.tab==='work') exJobDDRender();
  }
}

/* ---------- เปิดงานใหม่ (ไม่เขียนฐานข้อมูล · เอกสารจริงสร้างตอนบันทึกรายการแรก) ---------- */
async function exOpenNewWork(){
  if(!canEditExpense()){ toast('ไม่มีสิทธิ์ปิดค่าใช้จ่าย','error'); return; }
  try{
    let preview = '';
    try{
      const dn = await _rpc('ms_expense_next_no', { p_date: _exToday() });
      preview = (typeof dn === 'string') ? dn : (Array.isArray(dn) ? dn[0] : (dn||''));
    }catch(_){ preview = ''; }
    EX.doc = { id:null, pending:true, doc_no: preview || '(ออกเลขเมื่อบันทึก)', expense_date:_exToday(),
               closer_user:String((S.user&&S.user.id)||''), closer_name:uname(), advance_amount:0, import_terminal:'' };
    EX.items = []; EX.jobs = []; EX.drafts = []; EX.edit = {}; EX.adv = {}; EX.editing = new Set();
    EX.cur = null; EX.tab = 'work'; EX.sumSel = new Set(); EX.sumFilter = 'all'; EXJ.q = '';
    exOpenWorkModal();
    _exLoadPending();
  }catch(e){ console.error(e); toast('เปิดงานใหม่ไม่สำเร็จ: '+(e.message||''),'error'); }
}
let _exCreating = null;
async function _exEnsureDoc(){
  if(EX.doc && EX.doc.id) return EX.doc;
  if(_exCreating) return _exCreating;
  _exCreating = (async ()=>{
    const keepTerm = EX.doc && EX.doc.import_terminal;
    const row = await _rpc('ms_expense_doc_open', { p_date: (EX.doc&&EX.doc.expense_date) || _exToday(), p_advance: 0 });
    EX.doc = Object.assign({}, row, { pending:false });
    if(keepTerm){ try{ await _rpc('ms_expense_doc_set_terminal', { p_doc_id: EX.doc.id, p_terminal: keepTerm }); EX.doc.import_terminal = keepTerm; }catch(_){} }
    return EX.doc;
  })();
  try{ return await _exCreating; } finally { _exCreating = null; }
}
function exOpenWorkModal(){ openM('mx-ex-work'); exWorkRender(); }

/* เปิดเอกสารเดิม: 'work' = เปิดงานค่าใช้จ่าย · 'sum' = สรุปค่าใช้จ่าย (ไม่สร้างเอกสารใหม่ เลขที่เดิม) */
async function exOpenDoc(id, tab){
  try{
    const r = await _rpc('ms_expense_doc_get', { p_doc_id: id });
    if(!r || !r.head){ toast('ไม่พบเอกสาร','error'); return; }
    EX.doc = null; EX.items = []; EX.jobs = []; EX.drafts = []; EX.edit = {}; EX.adv = {}; EX.editing = new Set();
    EX.cur = null; EX.tab = tab || 'work'; EX.sumSel = new Set(); EX.sumFilter = 'all'; EXJ.q = '';
    _exApplyDocGet(r);
    closeM('mx-ex-detail');
    if(S.view!=='expense'){ S.view = 'expense'; try{ renderSidebar(); }catch(_){} }
    const gs = _exGroups();
    const firstOpen = gs.find(g=>g.status!=='CLOSED') || gs[0];
    if(firstOpen) EX.cur = firstOpen.key;
    exOpenWorkModal();
    if(canEditExpense()) _exLoadPending();
  }catch(e){ console.error(e); toast('เปิดเอกสารไม่สำเร็จ: '+_exErr(e),'error'); }
}
async function exCloseWork(){
  const n = _exDirtyKeys().length;
  if(n){
    const ok = await confirmDialog({ title:'ยังมีรายการที่ยังไม่บันทึก',
      message:`มี <b>${n}</b> รายการที่ยังไม่ได้กด 💾 บันทึก<br>ถ้าปิดตอนนี้ รายการเหล่านั้นจะหายไป (รายการที่บันทึกแล้วยังอยู่ครบ)`,
      okLabel:'ปิดโดยไม่บันทึก', okClass:'btn-danger' });
    if(!ok) return;
  }
  EX.drafts = []; EX.edit = {}; EX.editing = new Set();
  _exJobDDHide();
  closeM('mx-ex-work');
  await exListReload();
  exHomeRender();
}

function exSetTab(t){ EX.tab = (t==='sum') ? 'sum' : 'work'; _exJobDDHide(); exWorkRender(); }
function exWorkRender(){
  const m = $('mx-ex-work'); if(!m) return;
  const d = EX.doc || {};
  const groups = _exGroups();
  const cOpen = groups.filter(g=>g.status!=='CLOSED').length;
  const cClosed = groups.filter(g=>g.status==='CLOSED').length;
  const g = _exCurGroup(groups);
  const dirty = _exDirtyKeys().length;
  m.querySelector('.modal').innerHTML = `
    <div class="modal-head" data-ex-work="1">
      <div><h2>💰 ค่าใช้จ่าย (Expenses)</h2><p class="sub">${esc(d.doc_no||'')} · บันทึกราย Item → สรุปราย JOB → เลือกปิดสรุป</p></div>
      <button class="x" onclick="exCloseWork()">✕</button>
    </div>
    <div class="modal-body ex-workbody ex2">
      <div class="ex2-tabs" role="tablist">
        <button type="button" class="ex2-tab ${EX.tab==='work'?'on':''}" data-ex-tab="work" onclick="exSetTab('work')">📝 เปิดงานค่าใช้จ่าย</button>
        <button type="button" class="ex2-tab ${EX.tab==='sum'?'on':''}" data-ex-tab="sum" onclick="exSetTab('sum')">📊 สรุปค่าใช้จ่าย
          <span class="ex2-tcnt" title="รอปิดสรุป / ปิดสรุปแล้ว">${cOpen} / ${cClosed}</span></button>
      </div>
      ${EX.tab==='sum' ? _exSumHtml(groups) : _exWorkHtml(groups, g)}
      <datalist id="ex-desc-list">${EX_DESC_OPTS.map(o=>`<option value="${esc(o)}"></option>`).join('')}</datalist>
      <div class="ex-workfoot ex2-actbar">
        ${EX.tab==='work' && g && _exGroupEditable(g) ? `<button class="btn ex-btn-add ex2-b-add" onclick="exAddDraft()">➕ เพิ่มรายการ</button>` : ''}
        <span class="ex2-sp"></span>
        <button class="btn btn-secondary ex2-b-close" onclick="exCloseWork()">✖ ปิด</button>
        ${EX.tab==='work' && g && _exGroupEditable(g) ? `<button class="btn ex-btn-save" data-ex-saveall="1" onclick="exSaveAllDirty()">💾 บันทึกทั้งหมด${dirty?` (${dirty})`:''}</button>` : ''}
        ${EX.tab==='work' && g ? `<button class="btn ex-btn-pdf" data-ex-jobpdf="1" onclick="exExportJobPdf()">📄 EXPORT PDF — JOB นี้</button>` : ''}
      </div>
    </div>`;
  if(typeof refreshIcons==='function') refreshIcons(m);
}
function exRender(){
  if(_exWorkOpen()) return exWorkRender();
  if(S.view==='expense') return exHomeRender();
}

/* ---------- PART 1–2: เปิดงานค่าใช้จ่าย ---------- */
function _exWorkHtml(groups, g){
  const d = EX.doc || {};
  const canHead = canEditExpense();
  const term = d.import_terminal || '';
  const termOpts = `<option value="">— ทั้งหมด —</option>`
    + ((term && !TERMINAL_DROPDOWN_OPTS.some(t=>t[0]===term)) ? `<option value="${esc(term)}" selected>${esc(term)}</option>` : '')
    + TERMINAL_DROPDOWN_OPTS.map(t=>`<option value="${esc(t[0])}" ${term===t[0]?'selected':''}>${esc(t[1])}</option>`).join('');
  const editable = _exGroupEditable(g);
  const advVal = g ? (g.row ? g.adv : _exNum(EX.adv[g.key])) : 0;
  const st = _exStatusOf(g);
  const mob = _vpMobile();

  const chips = (groups.length || g) ? `<div class="ex2-chips ex2-statusrow"><span class="ex2-chips-l">JOB ในเอกสารนี้ :</span>${groups.map(x=>{
      const s = _exStatusOf(x);
      return `<button type="button" class="ex2-chip ${x.key===EX.cur?'on':''} ex2-${s.cls}" data-ex-chip="${esc(x.key)}" onclick="exPickJob('${esc(x.key)}')"
        title="${esc(x.company||'')}">${esc(x.job_no||'—')} (${x.items.length} รายการ)${x.status==='CLOSED'?' 🔒':''}</button>`; }).join('') || '<span class="ex2-muted">—</span>'}
      ${g ? `<span class="ex2-st ex2-${st.cls}" data-ex-status="1">${st.label}</span>` : ''}
      ${g && g.status==='CLOSED' && g.row && g.row.closed_at ? `<small class="ex2-muted">ปิดโดย ${esc(g.row.closed_by_name||'—')} · ${esc(fmtDateTimeEx(g.row.closed_at))}</small>`:''}</div>` : '';

  let body;
  if(!g){
    body = `<div class="ex2-empty">🔍 เลือก JOB จากช่อง <b>เลือก JOB</b> ด้านบน แล้วกด ➕ เพิ่มรายการ เพื่อบันทึกค่าใช้จ่ายราย Item</div>`;
  } else {
    const rows = [];
    g.items.forEach((it,i)=> rows.push(mob ? _exCardItem(it.id, it, null, i+1, editable) : _exRowItem(it.id, it, null, i+1, editable)));
    if(editable) EX.drafts.forEach((dr,i)=> rows.push(mob ? _exCardItem(dr.key, null, dr, g.items.length+i+1, true) : _exRowItem(dr.key, null, dr, g.items.length+i+1, true)));
    const tot = `<tr class="ex2-jtot"><td colspan="3">รวม JOB : ${esc(g.job_no||'')} (${g.items.length} รายการ)</td>
        <td class="ex-money">${_exQty(g.qty)}</td><td class="ex-money">${_exMoney(g.cost)}</td><td class="ex-money">${_exMoney(g.rcp)}</td><td></td><td></td></tr>`;
    const table = mob
      ? `<div class="ex-mcards">${rows.join('') || '<div class="ex2-empty">ยังไม่มีรายการ</div>'}</div>
         <div class="ex2-mtot">รวม JOB : <b>${esc(g.job_no||'')}</b> (${g.items.length} รายการ)
           <span>QTY <b>${_exQty(g.qty)}</b></span><span>Cost <b>${_exMoney(g.cost)}</b></span><span>Receipt <b>${_exMoney(g.rcp)}</b></span></div>`
      : `<div class="ex-tblwrap"><table class="tbl ex-tbl ex2-wtbl">
          <colgroup><col class="w-no"><col class="w-job"><col class="w-desc"><col class="w-qty"><col class="w-amt"><col class="w-amt"><col class="w-tax"><col class="w-act"></colgroup>
          <thead><tr><th class="ex-c-no">ITEM</th><th class="ex2-c-job">JOB</th><th class="ex2-c-desc">รายละเอียด</th>
            <th class="ex2-c-qty">QTY</th><th class="ex2-c-amt">COST</th><th class="ex2-c-amt">RECEIPT</th><th class="ex2-c-tax">Tax number</th><th class="ex-c-act">จัดการ</th></tr></thead>
          <tbody>${rows.join('') || `<tr><td colspan="8" class="ex2-tdempty">ยังไม่มีรายการ — กด ➕ เพิ่มรายการ</td></tr>`}${tot}</tbody>
        </table></div>`;
    body = table;
  }

  return `
    <div class="ex2-headbox"><div class="ex2-head">
      <div class="ex-fld"><label>เลขที่เอกสาร</label><input type="text" value="${esc(d.doc_no||'—')}" readonly class="ex-ro"></div>
      <div class="ex-fld"><label>วันที่เปิดค่าใช้จ่าย</label>
        <input type="date" id="ex-date" value="${esc(d.expense_date||_exToday())}" ${canHead?'':'disabled'} onchange="exSaveHead()"></div>
      <div class="ex-fld"><label>ผู้เปิดค่าใช้จ่าย</label><input type="text" value="${esc(d.closer_name||'')}" readonly class="ex-ro"></div>
      <div class="ex-fld"><label>ท่านำเข้า</label>
        <select id="ex-term" ${canHead?'':'disabled'} onchange="exSetTerminal(this.value)">${termOpts}</select></div>
      <div class="ex-fld ex2-jobfld"><label>เลือก JOB <span class="req">*</span></label>
        <div class="ex2-jobbox">
          <input type="search" id="ex-jobq" autocomplete="off" placeholder="🔍 ค้นหา JOB No. / บริษัท"
                 value="${esc(g ? g.job_no : '')}" onfocus="exJobDDOpen(this)" oninput="exJobDDSearch(this.value)">
          <div id="ex-jobdd" class="ex2-dd" hidden></div>
        </div></div>
      <div class="ex-fld ex2-cofld"><label>บริษัท</label><input type="text" id="ex-co" value="${esc(g?g.company:'')}" readonly class="ex-ro" title="${esc(g?g.company:'')}"></div>
      <div class="ex-fld ex2-advfld"><label>Nj advance (บาท)</label>
        <input type="text" inputmode="decimal" id="ex-jadv" class="ex2-in-money" value="${g?_exMoney(advVal):''}" placeholder="0.00"
               ${editable?'':'disabled'} onfocus="this.select()" onchange="exSaveJobAdv(this.value)"></div>
    </div></div>
    ${chips}
    ${body}`;
}

/* แถวตาราง (Desktop) — saved: แก้ได้จนกว่าจะปิดสรุป · draft: ยังไม่บันทึก */
function _exRowVals(key, it, dr){
  if(dr) return dr;
  const f2 = v => (v==null || v==='') ? '' : _exNum(v).toFixed(2);
  return EX.edit[key] || { description: it.description||'', qty: String(it.qty==null?1:_exQty(it.qty).replace(/,/g,'')),
                           cost: f2(it.cost_amount), receipt: f2(it.receipt_amount), tax: it.wht_no||'' };
}
function _exRowItem(key, it, dr, no, editable){
  const g = _exCurGroup();
  const jobNo = it ? (it.job_no||'') : (g ? g.job_no : '');
  if(!editable){
    return `<tr data-ex-item="${esc(key)}" class="ex2-ro">
      <td class="ex-c-no">${no}</td><td class="ex2-c-job"><span class="ex2-pill">${esc(jobNo)}</span></td>
      <td class="ex2-c-desc">${it.description ? esc(it.description) : '<span class="ex2-muted">—</span>'}</td>
      <td class="ex2-c-qty ex-money">${_exQty(it.qty)}</td><td class="ex2-c-amt ex-money">${_exMoney(it.cost_amount)}</td>
      <td class="ex2-c-amt ex-money">${_exMoney(it.receipt_amount)}</td><td class="ex2-c-tax">${it.wht_no ? esc(it.wht_no) : '<span class="ex2-muted">—</span>'}</td>
      <td class="ex-c-act"><span title="ปิดสรุปแล้ว">🔒</span></td></tr>`;
  }
  const v = _exRowVals(key, it, dr);
  const busy = EX.busy.has(key);
  const dirty = !!dr || !!EX.edit[key];
  const k = esc(key);
  return `<tr data-ex-draft="${k}" ${it?`data-ex-item="${k}"`:''} class="${dr?'ex-draft':''} ${dirty?'ex2-dirty':''}">
    <td class="ex-c-no">${no}</td>
    <td class="ex2-c-job"><span class="ex2-pill">${esc(jobNo)}</span></td>
    <td class="ex2-c-desc"><input type="text" list="ex-desc-list" value="${esc(v.description||'')}" placeholder="เลือกหรือพิมพ์รายละเอียด" maxlength="200"
        oninput="exRowSet('${k}','description',this.value)"></td>
    <td class="ex2-c-qty"><input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.qty==null?'1':v.qty)}"
        oninput="exRowSet('${k}','qty',this.value)" onfocus="this.select()"></td>
    <td class="ex2-c-amt"><input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.cost||'')}" placeholder="0.00"
        oninput="exRowSet('${k}','cost',this.value)" onfocus="this.select()"></td>
    <td class="ex2-c-amt"><input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.receipt||'')}" placeholder="0.00"
        oninput="exRowSet('${k}','receipt',this.value)" onfocus="this.select()"></td>
    <td class="ex2-c-tax"><input type="text" value="${esc(v.tax||'')}" placeholder="—" maxlength="60" autocomplete="off"
        oninput="exRowSet('${k}','tax',this.value)"></td>
    <td class="ex-c-act">
      <button class="ex-ib ex-ib-save" title="บันทึก" ${busy?'disabled':''} onclick="exSaveRow('${k}')">${busy?'<span class="spinner"></span>':'💾'}</button>
      <button class="ex-ib ex-ib-del" title="ลบ" ${busy?'disabled':''} onclick="exDeleteRow('${k}')">🗑️</button>
    </td>
  </tr>`;
}
/* การ์ด (มือถือ) — ลำดับช่องเหมือนตาราง: รายละเอียด / QTY / Cost / Receipt */
function _exCardItem(key, it, dr, no, editable){
  const k = esc(key);
  if(!editable){
    return `<div class="ex-mc ex-mc-saved" data-ex-item="${k}">
      <div class="ex-mc-head"><b>Item ${no}</b><span class="ex-mc-badge ok">🔒</span></div>
      <div class="ex-mc-line"><b>${it.description?esc(it.description):'—'}</b></div>
      <div class="ex-mc-row"><span>QTY <b>${_exQty(it.qty)}</b></span><span>Cost <b>${_exMoney(it.cost_amount)}</b></span><span>Receipt <b>${_exMoney(it.receipt_amount)}</b></span></div>
      <div class="ex-mc-row"><span>Tax number <b>${it.wht_no?esc(it.wht_no):'—'}</b></span></div>
    </div>`;
  }
  const v = _exRowVals(key, it, dr);
  const busy = EX.busy.has(key);
  const dirty = !!dr || !!EX.edit[key];
  return `<div class="ex-mc ex-mc-draft ${dirty?'ex2-dirty':''}" data-ex-draft="${k}" ${it?`data-ex-item="${k}"`:''}>
    <div class="ex-mc-head"><b>Item ${no}</b>
      <span class="ex-mc-badge ${dr?'wait':(dirty?'edit':'ok')}">${dr?'⚠️ ยังไม่บันทึก':(dirty?'✏️ แก้ไขแล้ว':'✅ บันทึกแล้ว')}</span></div>
    <label class="ex-mf">รายละเอียด <span class="req">*</span>
      <input type="text" list="ex-desc-list" value="${esc(v.description||'')}" placeholder="เลือกหรือพิมพ์รายละเอียด" maxlength="200"
        oninput="exRowSet('${k}','description',this.value)"></label>
    <div class="ex2-mf3">
      <label class="ex-mf">QTY<input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.qty==null?'1':v.qty)}" oninput="exRowSet('${k}','qty',this.value)"></label>
      <label class="ex-mf">Cost<input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.cost||'')}" placeholder="0.00" oninput="exRowSet('${k}','cost',this.value)"></label>
      <label class="ex-mf">Receipt<input type="text" inputmode="decimal" class="ex-in-money" value="${esc(v.receipt||'')}" placeholder="0.00" oninput="exRowSet('${k}','receipt',this.value)"></label>
    </div>
    <label class="ex-mf">Tax number<input type="text" value="${esc(v.tax||'')}" placeholder="—" maxlength="60" autocomplete="off" oninput="exRowSet('${k}','tax',this.value)"></label>
    <div class="ex-mc-acts">
      <button class="btn ex-btn-saverow" ${busy?'disabled':''} onclick="exSaveRow('${k}')">${busy?'<span class="spinner"></span> กำลังบันทึก...':'💾 บันทึก'}</button>
      <button class="btn ex-btn-rm" ${busy?'disabled':''} onclick="exDeleteRow('${k}')">🗑️ ลบ</button>
    </div>
  </div>`;
}

/* ---------- เลือก JOB (ค้นหา) ---------- */
function _exJobCandidates(){
  const q = String(EXJ.q||'').trim().toLowerCase();
  const term = (EX.doc && EX.doc.import_terminal) || '';
  const gs = _exGroups();
  const inIds = new Set(gs.map(g=>g.key));
  const match = x => !q || [x.doc_no, x.company, x.place, x.term].some(v=>String(v||'').toLowerCase().includes(q));
  const inDoc = gs.map(g=>({ id:g.key, doc_no:g.job_no, company:g.company, st:_exStatusOf(g), n:g.items.length })).filter(match);
  const pend = (EXJ.rows||[])
    .filter(r=>!inIds.has(r.id) && (!term || (r.import_terminal||'')===term))
    .map(r=>({ id:r.id, doc_no:r.doc_no, company:r.company, place:_exJobPlace(r), term:_exTermLabel(r.import_terminal), completed_at:r.completed_at }))
    .filter(match);
  return { inDoc, pend };
}
function exJobDDOpen(inp){
  EXJ.q = '';
  if(inp){ try{ inp.select(); }catch(_){} }
  const dd = $('ex-jobdd'); if(!dd) return;
  dd.hidden = false;
  exJobDDRender();
  setTimeout(()=>document.addEventListener('mousedown', _exJobDDOutside, true), 0);
}
function _exJobDDOutside(e){
  const box = document.querySelector('.ex2-jobbox');
  if(box && box.contains(e.target)) return;
  _exJobDDHide();
}
function _exJobDDHide(){
  const dd = $('ex-jobdd'); if(dd) dd.hidden = true;
  document.removeEventListener('mousedown', _exJobDDOutside, true);
  const inp = $('ex-jobq'); const g = _exCurGroup();
  if(inp && document.activeElement!==inp) inp.value = g ? (g.job_no||'') : '';
}
function exJobDDSearch(v){ EXJ.q = v||''; const dd=$('ex-jobdd'); if(dd && dd.hidden){ dd.hidden=false; setTimeout(()=>document.addEventListener('mousedown', _exJobDDOutside, true),0); } exJobDDRender(); }
function exJobDDRender(){
  const dd = $('ex-jobdd'); if(!dd || dd.hidden) return;
  const { inDoc, pend } = _exJobCandidates();
  const MAX = 60;
  const term = (EX.doc && EX.doc.import_terminal) || '';
  dd.innerHTML = `
    ${inDoc.length ? `<div class="ex2-dd-sec">JOB ในเอกสารนี้</div>${inDoc.map(x=>`
      <button type="button" class="ex2-dd-it ${x.id===EX.cur?'on':''}" data-ex-pick="${esc(x.id)}" onmousedown="event.preventDefault()" onclick="exPickJob('${esc(x.id)}')">
        <b>${esc(x.doc_no||'—')}</b><span>${esc(x.company||'')}</span><small class="ex2-st ex2-${x.st.cls}">${x.n} รายการ</small></button>`).join('')}` : ''}
    <div class="ex2-dd-sec">รอปิดค่าใช้จ่าย${term?` · ${esc(_exTermLabel(term))}`:''} ${EXJ.loading?'<span class="spinner"></span>':`(${pend.length})`}</div>
    ${pend.length ? pend.slice(0,MAX).map(x=>`
      <button type="button" class="ex2-dd-it" data-ex-pick="${esc(x.id)}" onmousedown="event.preventDefault()" onclick="exPickJob('${esc(x.id)}')">
        <b>${esc(x.doc_no||'—')}</b><span>${esc(x.company||'')}</span><small>${esc(x.place||'')} · ${esc(fmtDateTimeEx(x.completed_at))}</small></button>`).join('')
      + (pend.length>MAX ? `<div class="ex2-dd-more">แสดง ${MAX} จาก ${pend.length} — พิมพ์เพื่อค้นหาเพิ่ม</div>` : '')
      : `<div class="ex2-dd-more">${EXJ.loading?'กำลังโหลด...':'ไม่พบ JOB ที่รอปิดค่าใช้จ่าย'}</div>`}`;
}
async function exPickJob(id){
  if(id === EX.cur){ _exJobDDHide(); return; }
  const n = _exDirtyKeys().length;
  if(n){
    const ok = await confirmDialog({
      title:'ยังมีรายการที่ยังไม่บันทึก',
      message:`JOB ปัจจุบันมี <b>${n}</b> รายการที่ยังไม่ได้กด 💾 บันทึก<br>ถ้าเปลี่ยน JOB ตอนนี้ รายการเหล่านั้นจะหายไป`,
      okLabel:'เปลี่ยน JOB', okClass:'btn-danger'
    });
    if(!ok) return;
  }
  EX.drafts = []; EX.edit = {}; EX.cur = id; EXJ.q = '';
  _exJobDDHide();
  const g0 = _exGroups().find(x=>x.key===id);
  await _exEnsureInfo([g0 ? (g0.job_doc_id||g0.src_doc_id) : id]);
  const g = _exCurGroup();
  if(g && _exGroupEditable(g) && !g.items.length) exAddDraft(true);   // JOB ใหม่ → มีแถวว่างให้กรอกทันที
  exWorkRender();
}
function exGoWork(key){ EX.tab = 'work'; if(key===EX.cur) exWorkRender(); else exPickJob(key); }
async function exSetTerminal(v){
  if(!EX.doc) return;
  EX.doc.import_terminal = v || '';
  if(EX.doc.id){
    try{
      await _rpc('ms_expense_doc_set_terminal', { p_doc_id: EX.doc.id, p_terminal: v || null });
    }catch(e){ console.error(e); toast('บันทึกท่านำเข้าไม่สำเร็จ: '+_exErr(e),'error'); }
  }
  exJobDDRender();
}

/* ---------- จัดการแถว ---------- */
function exAddDraft(silent){
  const g = _exCurGroup();
  if(!g){ toast('เลือก JOB ก่อนเพิ่มรายการ','error'); const q=$('ex-jobq'); if(q) try{ q.focus(); }catch(_){} return; }
  if(!_exGroupEditable(g)){ toast('JOB นี้ปิดสรุปแล้ว เพิ่มรายการไม่ได้','error'); return; }
  EX.drafts.push({ key:'d'+(++_exDraftSeq), description:'', qty:'1', cost:'', receipt:'', tax:'' });
  if(!silent) exWorkRender();
}
function exRowSet(key, field, val){
  let v = EX.drafts.find(x=>x.key===key);
  if(!v){
    const it = EX.items.find(x=>x.id===key); if(!it) return;
    if(!EX.edit[key]) EX.edit[key] = Object.assign({}, _exRowVals(key, it, null));
    v = EX.edit[key];
  }
  v[field] = val;
  const row = document.querySelector(`[data-ex-draft="${CSS.escape(key)}"]`);
  if(row) row.classList.add('ex2-dirty');
  const b = document.querySelector('[data-ex-saveall]');
  if(b){ const n = _exDirtyKeys().length; b.textContent = '💾 บันทึกทั้งหมด' + (n?` (${n})`:''); }
}
async function exSaveRow(key, opts){
  if(EX.busy.has(key)) return false;
  const g = _exCurGroup();
  if(!g){ toast('เลือก JOB ก่อน','error'); return false; }
  if(!_exGroupEditable(g)){ toast('JOB นี้ปิดสรุปแล้ว แก้ไขไม่ได้','error'); return false; }
  const dr = EX.drafts.find(x=>x.key===key);
  const it = dr ? null : EX.items.find(x=>x.id===key);
  if(!dr && !it) return false;
  const v = _exRowVals(key, it, dr);
  _exClearInvalid(key);
  const desc = String(v.description||'').trim();
  if(!desc){ _exInvalid(key, 0, 'กรอกหรือเลือกรายละเอียด'); return false; }
  const q = _exAmt(v.qty, 'QTY', true);      if(!q.ok){ _exInvalid(key, 1, q.msg); return false; }
  const c = _exAmt(v.cost, 'Cost');          if(!c.ok){ _exInvalid(key, 2, c.msg); return false; }
  const r = _exAmt(v.receipt, 'Receipt');    if(!r.ok){ _exInvalid(key, 3, r.msg); return false; }
  const tok = _exTok();
  if(!tok){ toast('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่','error'); return false; }
  EX.busy.add(key); exWorkRender();
  let ok = false;
  try{
    await _exEnsureDoc();
    const hadRow = !!g.row;
    const args = {
      p_doc_id: EX.doc.id, p_job_doc_id: g.job_doc_id, p_item_id: dr ? null : key,
      p_description: desc, p_qty: q.val, p_cost: c.val, p_receipt: r.val,
      p_nj_advance: hadRow ? null : _exNum(EX.adv[g.key]),
      p_wht_no: String(v.tax||'').trim()                         // Tax number (เลขใบหัก · ไม่บังคับ · บันทึกราย ITEM) — RUN-15
    };
    let row;
    try{ row = await _rpc('ms_expense_item_upsert', args); }
    catch(e1){
      // ยังไม่ได้รัน RUN-15 → บันทึกแบบเดิม (ไม่มี Tax number) เพื่อไม่ให้การบันทึกรายการหยุดทำงาน
      if(!/PGRST202|Could not find the function/i.test(String((e1&&e1.message)||'')+' '+String((e1&&e1.code)||''))) throw e1;
      delete args.p_wht_no;
      row = await _rpc('ms_expense_item_upsert', args);
      toast('บันทึกรายการแล้ว แต่ยังบันทึก Tax number ไม่ได้ — ต้องรัน SQL RUN-15 ก่อน','error');
    }
    if(dr){ EX.items.push(row); EX.drafts = EX.drafts.filter(x=>x.key!==key); }
    else { const i = EX.items.findIndex(x=>x.id===key); if(i>=0) EX.items[i] = row; else EX.items.push(row); delete EX.edit[key]; }
    EX.items.sort((a,b)=>(a.seq||0)-(b.seq||0));
    if(!hadRow){ await _exReloadJobs(); delete EX.adv[g.key]; }
    await exRefreshSummary();
    if(!(opts && opts.quiet)) toast('บันทึกรายการแล้ว','success');
    ok = true;
  }catch(e){
    console.error(e);
    toast('บันทึกไม่สำเร็จ: '+_exErr(e),'error');
  }finally{
    EX.busy.delete(key); exWorkRender();
  }
  return ok;
}
async function exSaveAllDirty(){
  const keys = _exDirtyKeys();
  if(!keys.length){ toast('ไม่มีรายการที่ต้องบันทึก','info'); return; }
  let n = 0;
  for(const k of keys){
    if(!(await exSaveRow(k, { quiet:true }))) break;
    n++;
  }
  if(n) toast('บันทึก '+n+' รายการแล้ว','success');
}
async function exDeleteRow(key){
  if(EX.busy.has(key)) return;
  const dr = EX.drafts.find(x=>x.key===key);
  if(dr){
    const has = String(dr.description||'').trim() || String(dr.cost||'').trim() || String(dr.receipt||'').trim();
    if(has){
      const ok = await confirmDialog({ title:'ลบรายการ', message:'ลบแถวที่ยังไม่บันทึกนี้?', okLabel:'🗑️ ลบ', okClass:'btn-danger' });
      if(!ok) return;
    }
    EX.drafts = EX.drafts.filter(x=>x.key!==key);
    exWorkRender(); return;
  }
  const it = EX.items.find(x=>x.id===key); if(!it) return;
  const g = _exCurGroup();
  if(!_exGroupEditable(g)){ toast('JOB นี้ปิดสรุปแล้ว ลบไม่ได้','error'); return; }
  const ok = await confirmDialog({
    title:'ลบรายการ',
    message:`ยืนยันลบรายการ <b>${esc(it.description||'')}</b> · JOB ${esc(it.job_no||'')}<br>QTY ${_exQty(it.qty)} · Cost ${_exMoney(it.cost_amount)} · Receipt ${_exMoney(it.receipt_amount)}
             <br><small>ลบเฉพาะรายการนี้ · JOB และรายการอื่นยังอยู่ครบ</small>`,
    okLabel:'🗑️ ลบ', okClass:'btn-danger'
  });
  if(!ok) return;
  const tok = _exTok();
  if(!tok){ toast('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่','error'); return; }
  EX.busy.add(key); exWorkRender();
  try{
    await _rpc('ms_expense_item_remove', { p_item_id: key });
    EX.items = EX.items.filter(x=>x.id!==key);
    delete EX.edit[key];
    await exRefreshSummary();
    toast('ลบรายการแล้ว','success');
  }catch(e){
    console.error(e); toast('ลบไม่สำเร็จ: '+_exErr(e),'error');
  }finally{
    EX.busy.delete(key); exWorkRender();
  }
}
async function exSaveJobAdv(raw){
  const g = _exCurGroup(); if(!g) return;
  if(!_exGroupEditable(g)){ exWorkRender(); return; }
  const a = _exAmt(raw, 'Nj advance');
  if(!a.ok){ toast(a.msg,'error'); exWorkRender(); return; }
  if(!g.row){                                // JOB ยังไม่มีรายการที่บันทึก → บันทึกพร้อมรายการแรก
    EX.adv[g.key] = a.val; exWorkRender();
    toast('Nj advance จะถูกบันทึกพร้อมรายการแรกของ JOB นี้','info'); return;
  }
  const tok = _exTok();
  if(!tok){ toast('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่','error'); return; }
  try{
    const row = await _rpc('ms_expense_job_set_advance', { p_doc_id: EX.doc.id, p_job_doc_id: g.job_doc_id, p_nj_advance: a.val });
    const i = EX.jobs.findIndex(j=>j.id===row.id); if(i>=0) EX.jobs[i] = row; else EX.jobs.push(row);
    await exRefreshSummary();
    toast('บันทึก Nj advance แล้ว','success');
  }catch(e){ console.error(e); toast('บันทึก Nj advance ไม่สำเร็จ: '+_exErr(e),'error'); }
  finally{ exWorkRender(); }
}

/* ---------- PART 3: สรุปค่าใช้จ่าย (1 JOB = 1 แถว) ---------- */
function _exSumHtml(groups){
  const f = EX.sumFilter;
  const cnt = { all:groups.length, open:groups.filter(g=>g.status!=='CLOSED').length, closed:groups.filter(g=>g.status==='CLOSED').length };
  const keys = new Set(groups.map(g=>g.key));
  [...EX.sumSel].forEach(k=>{ if(!keys.has(k)) EX.sumSel.delete(k); });
  const list = groups.filter(g=> f==='all' || (f==='open' ? g.status!=='CLOSED' : g.status==='CLOSED'));
  const sel  = groups.filter(g=>EX.sumSel.has(g.key));
  const ss   = _exSums(sel);
  const adv  = _exAdvTotal(sel, groups, EX.doc);
  const bal  = adv - ss.total;
  const allOn = list.length>0 && list.every(g=>EX.sumSel.has(g.key));
  const docAdv = _exNum(EX.doc && EX.doc.advance_amount);
  const rows = list.map((g,i)=>{
    const on = EX.sumSel.has(g.key), st = _exStatusOf(g);
    return `<tr class="${on?'ex2-on':''}" data-ex-sumrow="${esc(g.key)}">
      <td class="ex2-ck"><input type="checkbox" ${on?'checked':''} onchange="exSumToggle('${esc(g.key)}',this.checked)" aria-label="เลือก JOB ${esc(g.job_no)}"></td>
      <td class="ex2-c">${i+1}</td>
      <td><span class="ex2-pill">${esc(g.job_no||'—')}</span> <span class="ex2-st ex2-${st.cls}">${g.status==='CLOSED'?'ปิดสรุปแล้ว':'รอปิดสรุป'}</span></td>
      <td class="ex2-c"><button type="button" class="ex2-link" onclick="exViewGroup('${esc(g.key)}')">${g.items.length} รายการ</button></td>
      <td class="ex-money">${_exQty(g.qty)}</td>
      <td class="ex-money">${_exMoney(g.adv)}</td>
      <td class="ex-money">${_exMoney(g.cost)}</td>
      <td class="ex-money">${_exMoney(g.rcp)}</td>
      <td class="ex-money ex2-tot">${_exMoney(g.total)}</td>
    </tr>`; }).join('');
  return `
    <div class="ex2-filters">
      <button type="button" class="ex2-fb ${f==='all'?'on':''}" data-ex-filter="all" onclick="exSumFilter('all')">ทั้งหมด (${cnt.all})</button>
      <button type="button" class="ex2-fb ${f==='open'?'on':''}" data-ex-filter="open" onclick="exSumFilter('open')">⏳ รอปิดสรุป (${cnt.open})</button>
      <button type="button" class="ex2-fb ${f==='closed'?'on':''}" data-ex-filter="closed" onclick="exSumFilter('closed')">🔒 ปิดสรุปแล้ว (${cnt.closed})</button>
    </div>
    <div class="ex-tblwrap"><table class="tbl ex-ltbl ex2-stbl">
      <thead><tr>
        <th class="ex2-ck"><input type="checkbox" ${allOn?'checked':''} ${list.length?'':'disabled'} onchange="exSumAll(this.checked)" title="เลือกทั้งหมดที่แสดง"></th>
        <th>Item</th><th>Job</th><th>รายละเอียด</th><th>QTY</th><th>Nj advance</th><th>Cost</th><th>Receipt</th><th>Total Amount</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="9" class="ex2-tdempty">ไม่มี JOB${f==='all'?' — บันทึกรายการในแท็บ เปิดงานค่าใช้จ่าย ก่อน':''}</td></tr>`}
        <tr class="ex2-selrow" data-ex-selrow="1"><td></td><td colspan="3">รวมเฉพาะ JOB ที่เลือก (${ss.n} JOB)</td>
          <td class="ex-money">${_exQty(ss.qty)}</td><td class="ex-money">${_exMoney(ss.adv)}</td>
          <td class="ex-money">${_exMoney(ss.cost)}</td><td class="ex-money">${_exMoney(ss.rcp)}</td><td class="ex-money">${_exMoney(ss.total)}</td></tr>
      </tbody>
    </table></div>
    <div class="ex2-sumacts">
      <button type="button" class="btn ex2-b-ghost" onclick="exSumAll(true)">☑ เลือกทั้งหมด</button>
      <button type="button" class="btn ex2-b-ghost" onclick="exSumClear()">ยกเลิกการเลือก</button>
      <button type="button" class="btn ex2-b-ghost" data-ex-view="1" onclick="exSumView()">🔍 ดูรายละเอียด</button>
      <span class="ex2-sp"></span>
      <button type="button" class="btn ex-btn-xls" data-ex-xls="1" onclick="exSumExcel()">📊 EXPORT EXCEL</button>
      <button type="button" class="btn ex-btn-pdf" data-ex-pdf="sum" onclick="exExportSel('sum')">📄 Export PDF ใบสรุป</button>
      <button type="button" class="btn ex2-b-blue" data-ex-pdf="jobs" onclick="exExportSel('jobs')">📄 Export PDF รายละเอียด JOB</button>
      <button type="button" class="btn ex-btn-xls" data-ex-pdf="all" onclick="exExportSel('all')">📚 Export PDF รวมชุด</button>
      <button type="button" class="btn ex2-b-blue" data-ex-pdf="print" onclick="exExportSel('print')">🖨 PRINT</button>
      ${canEditExpense() ? `<button type="button" class="btn ex2-b-close" data-ex-close="1" onclick="exCloseSelected()">🔒 ปิดสรุปที่เลือก</button>` : ''}
    </div>
    <div class="ex-sum">
      <div class="ex-card ex-card-adv"><div class="ex-card-ic">💳</div>
        <div class="ex-card-bd"><label>เบิกเงิน (บาท)</label><b data-ex-box="adv">${_exMoney(adv)}</b></div></div>
      <div class="ex-card ex-card-spent"><div class="ex-card-ic">➡️</div>
        <div class="ex-card-bd"><label>ใช้ไป (บาท)</label><b data-ex-box="spent">${_exMoney(ss.total)}</b></div></div>
      <div class="ex-card ex-card-bal"><div class="ex-card-ic">💵</div>
        <div class="ex-card-bd"><label>เงินคงเหลือ (บาท)</label><b data-ex-box="bal" class="${bal<0?'ex-neg':''}">${_exMoney(bal)}</b></div></div>
    </div>
    <p class="ex2-note">ยอดในกล่องคำนวณจาก JOB ที่เลือก · เบิกเงิน = รวม Nj advance (นับครั้งเดียวต่อ JOB) · ใช้ไป = รวม Total Amount · คงเหลือ = เบิกเงิน − ใช้ไป
      ${docAdv>0 ? `<br>เอกสารนี้มียอดเบิกเงินระดับเอกสาร (ข้อมูลเดิม) ${_exMoney(docAdv)} บาท — รวมในยอดเบิกเงินเมื่อเลือกครบทุก JOB` : ''}
      <br>การบันทึก / Export / Print ไม่ปิดสรุปอัตโนมัติ — ต้องกด 🔒 ปิดสรุปที่เลือก เท่านั้น</p>`;
}
function exSumFilter(f){ EX.sumFilter = f; exWorkRender(); }
function exSumToggle(key, on){ if(on) EX.sumSel.add(key); else EX.sumSel.delete(key); exWorkRender(); }
function exSumAll(on){
  const f = EX.sumFilter;
  _exGroups().filter(g=> f==='all' || (f==='open' ? g.status!=='CLOSED' : g.status==='CLOSED'))
    .forEach(g=>{ if(on) EX.sumSel.add(g.key); else EX.sumSel.delete(g.key); });
  exWorkRender();
}
function exSumClear(){ EX.sumSel = new Set(); exWorkRender(); }
/* ดูรายละเอียด = รายการย่อยของ JOB ที่เลือก (เลือก 1 JOB) */
function exSumView(){
  const sel = _exGroups().filter(g=>EX.sumSel.has(g.key));
  if(sel.length !== 1){ toast(sel.length ? 'เลือกครั้งละ 1 JOB เพื่อดูรายละเอียด (หรือกด "n รายการ" ในแถว)' : 'ยังไม่ได้เลือก JOB','error'); return; }
  exViewGroup(sel[0].key);
}
/* EXPORT EXCEL = ไฟล์ Excel เดิมของเอกสาร (รูปแบบเดิม ไม่เปลี่ยน) */
function exSumExcel(){
  if(!EX.doc || !EX.doc.id){ toast('ยังไม่มีรายการที่บันทึก','error'); return; }
  return exExportExcel(EX.doc.id);
}

async function exCloseSelected(){
  if(!canEditExpense()){ toast('ไม่มีสิทธิ์ปิดสรุป','error'); return; }
  const groups = _exGroups();
  const sel = groups.filter(g=>EX.sumSel.has(g.key));
  if(!sel.length){ toast('ยังไม่ได้เลือก JOB','error'); return; }
  const can = sel.filter(g=>g.status!=='CLOSED' && !g.legacy && g.job_doc_id && g.items.length>0);
  const skip = sel.length - can.length;
  if(!can.length){ toast('JOB ที่เลือกปิดสรุปแล้ว หรือยังไม่มีรายการ — ไม่มี JOB ที่ปิดสรุปได้','error'); return; }
  if(_exDirtyKeys().length){ toast('ยังมีรายการที่ยังไม่บันทึก — กด 💾 บันทึก ก่อนปิดสรุป','error'); return; }
  const ss = _exSums(can);
  const ok = await confirmDialog({
    title:'ยืนยันปิดสรุป',
    message:`ปิดสรุป <b>${can.length}</b> JOB: ${can.map(g=>esc(g.job_no)).join(', ')}<br>
             รวม Total Amount <b>${_exMoney(ss.total)}</b> บาท · Nj advance ${_exMoney(ss.adv)} บาท<br>
             หลังปิดสรุป รายการจะแก้ไข/ลบไม่ได้ (ดูและพิมพ์ได้ · ยกเลิกปิดสรุปได้โดย ADMIN)
             ${skip ? `<br><small>ข้าม ${skip} JOB ที่ปิดสรุปแล้วหรือยังไม่มีรายการ</small>` : ''}`,
    okLabel:'🔒 ปิดสรุป', okClass:'btn-primary'
  });
  if(!ok) return;
  const tok = _exTok();
  if(!tok){ toast('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่','error'); return; }
  const b = document.querySelector('[data-ex-close]'); if(b){ b.disabled = true; b.innerHTML = '<span class="spinner"></span> กำลังปิดสรุป...'; }
  try{
    const res = await _rpc('ms_expense_jobs_close', { p_doc_id: EX.doc.id, p_job_doc_ids: can.map(g=>g.job_doc_id) });
    const n = (res && res.closed) || can.length;
    await _exReloadJobs();
    await exRefreshSummary();
    EX.sumSel = new Set();
    toast('ปิดสรุปแล้ว '+n+' JOB','success');
  }catch(e){ console.error(e); toast('ปิดสรุปไม่สำเร็จ (ยังไม่ปิด JOB ใด): '+_exErr(e),'error'); }
  finally{ exWorkRender(); }
}

/* ดูรายการของ JOB (คลิก "n รายการ") + ยกเลิกปิดสรุป (ADMIN / SUPER_ADMIN) */
function exViewGroup(key){
  const g = _exGroups().find(x=>x.key===key); if(!g) return;
  const st = _exStatusOf(g);
  const canReopen = g.status==='CLOSED' && !g.legacy && !!g.job_doc_id && canDeleteExpense();
  openM('mx-ex-detail');
  const mdl = $('mx-ex-detail');
  mdl.querySelector('.modal').innerHTML = `
    <div class="modal-head"><div><h2>รายละเอียด JOB ${esc(g.job_no||'')}</h2>
      <p class="sub">${esc(g.company||'')} · ${st.label}</p></div>
      <button class="x" onclick="closeM('mx-ex-detail')">✕</button></div>
    <div class="modal-body">
      <div class="ex-dmeta">
        <div><label>Nj advance</label><b>${_exMoney(g.adv)}</b></div>
        <div><label>QTY</label><b>${_exQty(g.qty)}</b></div>
        <div><label>Cost</label><b>${_exMoney(g.cost)}</b></div>
        <div><label>Receipt</label><b>${_exMoney(g.rcp)}</b></div>
        <div><label>Total Amount</label><b>${_exMoney(g.total)}</b></div>
      </div>
      ${g.row && g.row.closed_at && g.status==='CLOSED' ? `<p class="ex2-note">ปิดสรุปโดย ${esc(g.row.closed_by_name||'—')} · ${esc(fmtDateTimeEx(g.row.closed_at))}</p>` : ''}
      ${g.row && g.row.reopened_at ? `<p class="ex2-note">ยกเลิกปิดสรุปล่าสุดโดย ${esc(g.row.reopened_by_name||'—')} · ${esc(fmtDateTimeEx(g.row.reopened_at))}${g.row.reopen_reason?` · เหตุผล: ${esc(g.row.reopen_reason)}`:''}</p>` : ''}
      <div style="overflow-x:auto"><table class="tbl ex-ltbl">
        <thead><tr><th>Item</th><th>รายละเอียด</th><th>QTY</th><th>Cost</th><th>Receipt</th><th>Total</th><th>บันทึกโดย</th></tr></thead>
        <tbody>${g.items.map((it,i)=>`<tr>
          <td style="text-align:center">${i+1}</td><td>${it.description?esc(it.description):'—'}</td>
          <td class="ex-money">${_exQty(it.qty)}</td><td class="ex-money">${_exMoney(it.cost_amount)}</td>
          <td class="ex-money">${_exMoney(it.receipt_amount)}</td><td class="ex-money"><b>${_exMoney(it.total_amount)}</b></td>
          <td>${esc(it.updated_by_name||it.created_by_name||'—')}</td></tr>`).join('') || `<tr><td colspan="7" style="text-align:center">ยังไม่มีรายการ</td></tr>`}
          <tr class="ex-trsum"><td colspan="2" style="text-align:right"><b>รวม</b></td><td class="ex-money">${_exQty(g.qty)}</td>
            <td class="ex-money">${_exMoney(g.cost)}</td><td class="ex-money">${_exMoney(g.rcp)}</td><td class="ex-money">${_exMoney(g.total)}</td><td></td></tr>
        </tbody></table></div>
      ${canReopen ? `<div class="ex2-reopen"><label>เหตุผลการยกเลิกปิดสรุป</label>
          <input type="text" id="ex-reopen-reason" maxlength="300" placeholder="ระบุเหตุผล (ถ้ามี)"></div>` : ''}
      <div class="ex-dacts">
        <button class="btn btn-secondary" onclick="closeM('mx-ex-detail')">✖ ปิด</button>
        ${g.status!=='CLOSED' ? `<button class="btn ex-btn-edit" onclick="closeM('mx-ex-detail');exGoWork('${esc(g.key)}')">✏️ แก้ไขในหน้าเปิดงาน</button>` : ''}
        <button class="btn ex-btn-pdf" onclick="exExportGroupPdf('${esc(g.key)}')">📄 EXPORT PDF — JOB นี้</button>
        ${canReopen ? `<button class="btn ex-btn-cancel" data-ex-reopen="1" onclick="exReopenGroup('${esc(g.key)}')">↩️ ยกเลิกปิดสรุป</button>` : ''}
      </div>
    </div>`;
}
async function exReopenGroup(key){
  if(!canDeleteExpense()){ toast('เฉพาะ ADMIN / SUPER ADMIN เท่านั้น','error'); return; }
  const g = _exGroups().find(x=>x.key===key); if(!g || !g.job_doc_id) return;
  const reason = (($('ex-reopen-reason')||{}).value || '').trim();
  const ok = await confirmDialog({
    title:'ยกเลิกปิดสรุป',
    message:`ยกเลิกปิดสรุป JOB <b>${esc(g.job_no)}</b> → กลับเป็น "รอปิดสรุป" และแก้ไขได้อีกครั้ง<br>ข้อมูลรายการทั้งหมดคงเดิม ไม่มีการลบ`,
    okLabel:'↩️ ยกเลิกปิดสรุป', okClass:'btn-danger'
  });
  if(!ok) return;
  try{
    await _rpc('ms_expense_job_reopen', { p_doc_id: EX.doc.id, p_job_doc_id: g.job_doc_id, p_reason: reason || null });
    await _exReloadJobs();
    await exRefreshSummary();
    closeM('mx-ex-detail');
    toast('ยกเลิกปิดสรุป JOB '+g.job_no+' แล้ว','success');
  }catch(e){ console.error(e); toast('ยกเลิกปิดสรุปไม่สำเร็จ: '+_exErr(e),'error'); }
  finally{ exWorkRender(); }
}


/* ---------- ตรวจ / แจ้งข้อผิดพลาด ---------- */
function _exIsNum(v){ return /^-?[\d,]*\.?\d+$/.test(String(v).trim()); }
function _exClearInvalid(key){
  const tr = document.querySelector(`[data-ex-draft="${CSS.escape(String(key))}"]`);
  if(tr) tr.querySelectorAll('.ex-bad').forEach(e=>e.classList.remove('ex-bad'));
}
function _exInvalid(key, idx, msg){
  toast(msg,'error');
  const tr = document.querySelector(`[data-ex-draft="${CSS.escape(String(key))}"]`);
  if(!tr) return;
  const el = tr.querySelectorAll('input, select')[idx];
  if(el){ el.classList.add('ex-bad'); try{ el.focus(); el.select && el.select(); }catch(_){ } }
}
function _exErr(e){
  const m = String((e&&(e.message||e.details))||'');
  if(/Could not find the function|PGRST202|ms_expense_jobs.*does not exist|column [\w."]*(description|qty|job_doc_id)"? does not exist/i.test(m)) return 'ยังไม่ได้ติดตั้ง SQL RUN-14 (ระบบค่าใช้จ่ายแบบใหม่) — แจ้งผู้ดูแลระบบ';
  if(/NJ_SESSION/.test(m)) return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  if(/NJ_FORBIDDEN/.test(m)) return 'ไม่มีสิทธิ์';
  if(/qty_invalid/i.test(m)) return 'QTY ต้องมากกว่า 0';
  if(/decimal_places/i.test(m)) return 'ทศนิยมได้ไม่เกิน 2 ตำแหน่ง';
  if(/negative_amount/i.test(m)) return 'จำนวนเงินติดลบไม่ได้';
  if(/legacy_locked/i.test(m)) return 'รายการเดิม (ก่อนระบบใหม่) ถือว่าปิดสรุปแล้ว แก้ไข/ลบไม่ได้';
  let j;
  if((j=m.match(/job_closed_locked:\s*(\S+)/))) return 'JOB '+j[1]+' ปิดสรุปแล้ว แก้ไข/ลบไม่ได้';
  if((j=m.match(/job_already_summary_closed:\s*(\S+)/))) return 'JOB '+j[1]+' ปิดสรุปไปแล้ว';
  if((j=m.match(/job_no_items:\s*(\S+)/))) return 'JOB '+j[1]+' ยังไม่มีรายการ ปิดสรุปไม่ได้';
  if((j=m.match(/job_already_closed:\s*(\S+)\s*\(([^)]*)\)/))) return 'JOB '+j[1]+' ถูกใช้ในเอกสารค่าใช้จ่ายแล้ว (เอกสาร '+j[2]+')';
  if(/job_status_rpc_only/i.test(m)) return 'เปลี่ยนสถานะได้ผ่านปุ่มปิดสรุป/ยกเลิกปิดสรุปเท่านั้น';
  if(/job_not_in_doc/i.test(m)) return 'ไม่พบ JOB ในเอกสารนี้';
  if(/doc_cancelled/i.test(m)) return 'เอกสารถูกยกเลิกแล้ว';
  if(/missing_required_field/i.test(m)) return 'กรอกข้อมูลที่จำเป็นให้ครบ';
  if(/NJ_EXP_ALREADY_CLOSED/.test(m)) return 'JOB นี้ถูกปิดค่าใช้จ่ายแล้ว (ห้ามปิดซ้ำ)';
  if(/NJ_EXP_JOB_NOT_COMPLETED/.test(m)) return 'JOB นี้ยังไม่ปล่อยเสร็จ';
  if(/NJ_EXP_JOB_NOT_FOUND/.test(m)) return 'ไม่พบ JOB ต้นทาง';
  if(/NJ_EXP_DOC_NOT_FOUND/.test(m)) return 'ไม่พบเอกสาร';
  if(/item_not_found/i.test(m)) return 'ไม่พบรายการ (อาจถูกลบไปแล้ว)';
  return m;
}
const EXJ = { rows:[], q:'', loading:false };
function _exTermLabel(v){ return String(v||'').trim(); }
function _exJobPlace(r){ return _exTermLabel(r.import_terminal) || '—'; }

/* ---------- หัวเอกสาร ---------- */
async function exSaveHead(){
  const el = $('ex-date'); if(!el || !EX.doc) return;
  if(!canEditExpense()){ el.value = EX.doc.expense_date || ''; return; }
  if(!EX.doc.id){ EX.doc.expense_date = el.value || _exToday(); return; }
  try{
    const sm = await _rpc('ms_expense_doc_update', { p_doc_id: EX.doc.id, p_expense_date: el.value || null, p_advance: null });
    if(sm) EX.doc = Object.assign({}, EX.doc, sm);
    toast('บันทึกวันที่แล้ว','success');
  }catch(e){ console.error(e); toast('บันทึกวันที่ไม่สำเร็จ: '+_exErr(e),'error'); }
}
async function exRefreshSummary(){
  if(!EX.doc||!EX.doc.id) return;
  try{ const r = await _rpc('ms_expense_doc_get', { p_doc_id: EX.doc.id }); if(r && r.head) EX.doc = Object.assign({}, EX.doc, r.head); }catch(_){}
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

/* เปิดเอกสารเดิม — หน้าต่างเดียวกับ ➕ เปิดงาน (แท็บ เปิดงานค่าใช้จ่าย) · ไม่มีสิทธิ์แก้ = แท็บสรุป (ดูอย่างเดียว) */
async function exEditDoc(id){ return exOpenDoc(id, canEditExpense() ? 'work' : 'sum'); }

async function exDeleteDoc(id, docNo, fromDetail){
  if(!canDeleteExpense()){ toast('เฉพาะ ADMIN / SUPER ADMIN เท่านั้น','error'); return; }
  // ข้อมูลที่ปิดสรุปแล้ว (รวมข้อมูลเดิมก่อนระบบใหม่) ห้ามลบ
  const _hd = (EXL.rows||[]).find(x=>x.id===id);
  if(_hd && (_exNum(_hd.jobs_closed) > 0 || _exNum(_hd.legacy_items) > 0)){
    toast('เอกสาร '+(docNo||'')+' มี JOB ที่ปิดสรุปแล้ว — ลบไม่ได้ (ข้อมูลที่ปิดสรุปห้ามลบ · ADMIN ยกเลิกปิดสรุปได้)','error'); return;
  }
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
            <div class="ex-hc-n ex-hc-adv"><label>เบิกเงิน</label><b>${_exMoney(_exAdvDoc(r))}</b></div>
            <div class="ex-hc-n ex-hc-sp"><label>ใช้ไป</label><b>${_exMoney(r.spent_total)}</b></div>
            <div class="ex-hc-n ex-hc-bl"><label>คงเหลือ</label><b class="${_exBalDoc(r)<0?'ex-neg':''}">${_exMoney(_exBalDoc(r))}</b></div>
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
              <td class="ex-money">${_exMoney(_exAdvDoc(r))}</td>
              <td class="ex-money">${_exMoney(r.spent_total)}</td>
              <td class="ex-money ${_exBalDoc(r)<0?'ex-neg':''}">${_exMoney(_exBalDoc(r))}</td>
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
/* ดูรายละเอียด = เปิดหน้าต่างเอกสารที่แท็บ สรุปค่าใช้จ่าย (ดู/พิมพ์ได้ · JOB ที่ปิดแล้วแก้ไม่ได้) */
async function exOpenDetail(id){ return exOpenDoc(id, 'sum'); }

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

/* ============================================================
   PART 4 — PDF: ใบสรุป (แนวนอน · 8 คอลัมน์) / รายละเอียดราย JOB (ฟอร์ม JOB-NJ แนวนอน ขาวดำ) / รวมชุด / Print
   · ดึงข้อมูลจากฐานข้อมูลจริงเสมอ · ไม่ปิดสรุปอัตโนมัติ
   ============================================================ */
async function _exPdfLib(){
  await loadPdfLib();
  if(!(window.jspdf && window.jspdf.jsPDF)) throw new Error('โหลดไลบรารี PDF ไม่สำเร็จ');
  return window.jspdf.jsPDF;
}
/* โหลดเอกสาร + JOB + รายการ จากฐานข้อมูล (สำหรับ Export จากหน้าแรก/รายงาน) */
async function _exFetchDocFull(docId){
  const r = await _rpc('ms_expense_doc_get', { p_doc_id: docId });
  if(!r || !r.head) return null;
  if(r.infos && typeof r.infos==='object') Object.keys(r.infos).forEach(k=>{ EX.info[k] = r.infos[k]; });
  return { h: r.head, groups: _exGroupsOf(r.items||[], r.jobs||[]) };
}
function _exFileSafe(s){ return String(s||'').replace(/[\\/:*?"<>|\s]+/g,'_'); }

/* ---------- ใบสรุป (ตาม EC20261101-001 · คอลัมน์ใหม่ 8 ช่อง) ---------- */
function _exPdfSummary(doc, h, sel, all){
  const PW = doc.internal.pageSize.getWidth();    // 297
  const PH = doc.internal.pageSize.getHeight();   // 210
  const M  = 10;
  doc.setFont('Sarabun','normal');
  const ss  = _exSums(sel);
  const adv = _exAdvTotal(sel, all, h);
  const bal = adv - ss.total;

  const body = sel.map((g,i)=>[
    String(i+1), g.job_no||'', g.items.length+' รายการ', _exQty(g.qty),
    _exMoney(g.adv), _exMoney(g.cost), _exMoney(g.rcp), _exMoney(g.total)
  ]);
  const F = [239,246,255];
  body.push([
    { content:'รวมทั้งสิ้น', colSpan:3, styles:{ halign:'right', fontStyle:'bold', fillColor:F } },
    { content:_exQty(ss.qty),     styles:{ halign:'right', fontStyle:'bold', fillColor:F } },
    { content:_exMoney(ss.adv),   styles:{ halign:'right', fontStyle:'bold', fillColor:F } },
    { content:_exMoney(ss.cost),  styles:{ halign:'right', fontStyle:'bold', fillColor:F } },
    { content:_exMoney(ss.rcp),   styles:{ halign:'right', fontStyle:'bold', fillColor:F } },
    { content:_exMoney(ss.total), styles:{ halign:'right', fontStyle:'bold', fillColor:[237,233,254] } }
  ]);

  const startPage = doc.internal.getNumberOfPages();
  doc.autoTable({
    head: [[ 'Item','Job','รายละเอียด','QTY','Nj advance','Cost','Receipt','Total Amount' ]],
    body,
    startY: M + 22,
    margin: { left:M, right:M, top:M + 22, bottom:M + 4 },
    theme: 'grid',
    styles: { font:'Sarabun', fontStyle:'normal', fontSize:9, cellPadding:1.8, lineWidth:0.22, lineColor:[120,130,150],
              textColor:[17,17,17], overflow:'linebreak', valign:'middle' },
    headStyles: { font:'Sarabun', fontStyle:'bold', fontSize:9, fillColor:[30,58,138], textColor:[255,255,255],
                  lineWidth:0.25, lineColor:[255,255,255], halign:'center' },
    columnStyles: {
      0:{ cellWidth:16, halign:'center' },
      1:{ cellWidth:'auto' },
      2:{ cellWidth:30, halign:'center' },
      3:{ cellWidth:22, halign:'right' },
      4:{ cellWidth:34, halign:'right', fillColor:[239,246,255] },
      5:{ cellWidth:34, halign:'right', fillColor:[254,252,232] },
      6:{ cellWidth:34, halign:'right', fillColor:[253,242,248] },
      7:{ cellWidth:38, halign:'right', fillColor:[245,243,255], fontStyle:'bold' }
    },
    didDrawPage: ()=>{
      doc.setFont('Sarabun','bold'); doc.setFontSize(13); doc.setTextColor(30,58,138);
      doc.text('สรุปปิดค่าใช้จ่าย', PW/2, M + 8, { align:'center' });
      doc.setFontSize(10);
      doc.text('N.J. LOGISTICS', M, M + 6);
      doc.setFont('Sarabun','normal'); doc.setFontSize(7.5); doc.setTextColor(90,90,90);
      doc.text(EX_SYS, M, M + 10);
      doc.setFontSize(8); doc.setTextColor(17,17,17);
      const rx = PW - M;
      doc.text('เลขที่เอกสาร : ' + (h.doc_no||'-'), rx, M + 4, { align:'right' });
      doc.text('วันที่ปิดค่าใช้จ่าย : ' + (h.expense_date ? fmtDateEx(h.expense_date) : '-'), rx, M + 8.5, { align:'right' });
      doc.text('ผู้ปิดค่าใช้จ่าย : ' + (h.closer_name||'-'), rx, M + 13, { align:'right' });
      doc.setDrawColor(30,58,138); doc.setLineWidth(0.5);
      doc.line(M, M + 16, PW - M, M + 16);
      const pg = doc.internal.getNumberOfPages() - startPage + 1;
      doc.setFontSize(7.5); doc.setTextColor(110,110,110);
      doc.text('หน้า ' + pg, PW - M, PH - 4, { align:'right' });
    }
  });

  // ---------- เบิกเงิน / ใช้ไป / คงเหลือ + ลายเซ็น 3 ช่อง ----------
  let y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : M + 30) + 6;
  if(y + 42 > PH - M){
    doc.addPage('a4','landscape'); y = M + 24;
    doc.setFont('Sarabun','normal'); doc.setFontSize(7.5); doc.setTextColor(110,110,110);
    doc.text('หน้า ' + (doc.internal.getNumberOfPages() - startPage + 1), PW - M, PH - 4, { align:'right' });
  }
  const bw = (PW - M*2 - 8) / 3;
  [
    { t:'เบิกเงิน (บาท)',    v:_exMoney(adv),      bg:[239,246,255], fg:[29,78,216] },
    { t:'ใช้ไป (บาท)',       v:_exMoney(ss.total), bg:[254,242,242], fg:[220,38,38] },
    { t:'เงินคงเหลือ (บาท)', v:_exMoney(bal),      bg:[236,253,245], fg: bal<0?[220,38,38]:[4,120,87] }
  ].forEach((b,i)=>{
    const x = M + i*(bw+4);
    doc.setFillColor(b.bg[0],b.bg[1],b.bg[2]); doc.setDrawColor(120,130,150); doc.setLineWidth(0.25);
    doc.rect(x, y, bw, 14, 'FD');
    doc.setFont('Sarabun','normal'); doc.setFontSize(8); doc.setTextColor(70,70,70);
    doc.text(b.t, x+3, y+5.5);
    doc.setFont('Sarabun','bold'); doc.setFontSize(11); doc.setTextColor(b.fg[0],b.fg[1],b.fg[2]);
    doc.text(b.v, x+bw-3, y+11, { align:'right' });
  });
  y += 22;                                           // ไม่แสดงช่องหมายเหตุ (ตามแบบอนุมัติล่าสุด)
  const sw = (PW - M*2 - 16) / 3;
  [
    { l:'ผู้ปิดค่าใช้จ่าย', n:h.closer_name||'', d:h.expense_date ? fmtDateEx(h.expense_date) : '.............' },
    { l:'ผู้ตรวจสอบ', n:'', d:'.............' },
    { l:'ผู้อนุมัติ', n:'', d:'.............' }
  ].forEach((s,i)=>{
    const x = M + i*(sw+8);
    doc.setDrawColor(70,70,70); doc.setLineWidth(0.2);
    doc.line(x, y+10, x+sw, y+10);
    doc.setFont('Sarabun','normal'); doc.setFontSize(8); doc.setTextColor(17,17,17);
    doc.text(s.l, x+sw/2, y+14.5, { align:'center' });
    doc.text('( ' + (s.n || '.............................') + ' )', x+sw/2, y+19, { align:'center' });
    doc.text('วันที่ ' + s.d, x+sw/2, y+23.5, { align:'center' });
  });
}

/* ---------- รายละเอียดราย JOB — ฟอร์ม JOB-NJ (A4 แนวนอน · ขาวดำ · ตามต้นฉบับ JOB-NJ_JOB.pdf ที่ตัดหัวข้อแล้ว) ----------
   ด้านบน: Checkbox 9 หัวข้อ · JOB NJ / เลขที่ใบขนฯ / บริษัท (ค่าจาก JOB จริง)
   ตาราง 6 คอลัมน์ · 11 แถวคงที่ + Total Amount · Item ถูกรวมยอดเข้าแถวตามรายละเอียด (ไม่ตรงหัวข้อ → Other)
   Nj advance นับครั้งเดียวต่อ JOB · ยอดรวมเดิม (Total = Nj advance / Cost / Receipt ของ JOB) */
const EX_PDF_ROWS = [
  ['Nj advance',        null],
  ['Service charge',    ['service charge']],
  ['Lift on /Lift off', ['lift on','lift off','lift on /lift off','lift on / lift off','lift on/lift off']],
  ['Over time',         ['over time','overtime']],
  ['Custom fee',        ['custom fee','customs fee']],
  ['Storage charge',    ['storage charge']],
  ['Demurrage charge',  ['demurrage','demurrage charge']],
  ['Amend entry',       ['amend entry']],
  ['Re-fund',           ['re-fund','refund']],
  ['Check list',        ['check list','checklist']],
  ['Other',             null]
];
function _exPdfRowIdx(desc){
  const d = String(desc||'').toLowerCase().replace(/\s+/g,' ').trim();
  for(let i=1;i<EX_PDF_ROWS.length-1;i++){ if(EX_PDF_ROWS[i][1].includes(d)) return i; }
  return EX_PDF_ROWS.length - 1;                     // Other
}
/* local371: หัวกระดาษบริษัท (ใช้ร่วมกันทุกหน้า: Export PDF / PRINT / Preview) · โลโก้จริง NJ สีแดงเข้ม กว้าง 38 มม. · พื้นขาว ไม่มีเส้นคั่น/กรอบ
   ชื่อบริษัท 20pt หนา น้ำเงินเข้ม · ที่อยู่ 12pt หนา · Tel/Fax/Tax ID 11pt · คืนค่าตำแหน่ง y ที่เริ่ม Checklist ได้ (ห่างหัวกระดาษ ≈ 10 มม.) */
const EX_PDF_LOGO = 'data:image/png;base64,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';
const EX_PDF_CO = {
  name: 'N.J. LOGISTICS & FRUITS CO., LTD.',
  addr: '62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)',
  tel:  'Tel. 033-000870  |  Fax. 033-000870  |  Tax ID 0205557004651'
};
function _exPdfHead(doc){
  const L = 12, LW = 38, LH = LW * 336 / 1118;      // 38 × 11.4 มม. (อัตราส่วนภาพจริง)
  try{ doc.addImage(EX_PDF_LOGO, 'PNG', L, 13.4, LW, LH, 'NJLOGO371'); }catch(e){ try{ console.warn('[expense pdf] logo', e); }catch(_){} }
  const X = L + LW + 8;
  doc.setLineDashPattern([],0);
  doc.setFont('Sarabun','bold');   doc.setFontSize(20); doc.setTextColor(16,42,110); doc.text(EX_PDF_CO.name, X, 14.6);
  doc.setFont('Sarabun','bold');   doc.setFontSize(12); doc.setTextColor(30,41,59);  doc.text(EX_PDF_CO.addr, X, 21.6);
  doc.setFont('Sarabun','normal'); doc.setFontSize(11); doc.setTextColor(51,65,85);  doc.text(EX_PDF_CO.tel,  X, 27.9);
  doc.setTextColor(0,0,0);
  return 39;
}
function _exPdfJobForm(doc, g, info){
  const PW = doc.internal.pageSize.getWidth();       // 297
  const L = 12, R = PW - 12;
  const K = [0,0,0];
  info = info || {};
  const line = (x1,y1,x2,y2,w)=>{ doc.setLineDashPattern([],0); doc.setDrawColor(0,0,0); doc.setLineWidth(w||0.25); doc.line(x1,y1,x2,y2); };
  const dot = (x1,x2,y)=>{ doc.setLineDashPattern([0.35,0.65],0); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); doc.line(x1,y,x2,y); doc.setLineDashPattern([],0); };
  const txt = (t,x,y,o,sz,b)=>{ doc.setFont('Sarabun', b?'bold':'normal'); doc.setFontSize(sz||10.5); doc.setTextColor(K[0],K[1],K[2]); doc.text(String(t==null?'':t), x, y, o||{}); };
  const val = (t,x,y,maxW)=>{
    const s = String(t==null?'':t).replace(/\s*\n\s*/g,', ').trim(); if(!s) return;
    let f = 11; doc.setFont('Sarabun','normal'); doc.setFontSize(f);
    while(f > 7 && doc.getTextWidth(s) > maxW){ f -= 0.5; doc.setFontSize(f); }
    doc.setTextColor(0,0,0);
    doc.text(doc.getTextWidth(s) > maxW ? doc.splitTextToSize(s, maxW)[0] : s, x, y);
  };

  // 0) หัวกระดาษบริษัท (local371) → Checklist เริ่มที่ OY
  const OY = _exPdfHead(doc);
  // 1) Checkbox 9 หัวข้อ (ว่าง)
  doc.setLineDashPattern([],0); doc.setDrawColor(0,0,0); doc.setLineWidth(0.25);
  doc.rect(L, OY, R - L, 11);
  const CB = ['ยกเว้น','เปิดตรวจ','FCL','LCL','FZ','FZ+FZ','ค่าธรรมเนียม','ล่วงเวลา','Check list'];
  doc.setFont('Sarabun','normal'); doc.setFontSize(10.5);
  const ws = CB.map(t=>6.6 + doc.getTextWidth(t));                 // กล่อง + ชื่อ
  const gap = (R - L - 8 - ws.reduce((a,b)=>a+b,0)) / (CB.length - 1);
  let cx = L + 4;
  CB.forEach((t,i)=>{
    doc.setLineDashPattern([],0); doc.setDrawColor(0,0,0); doc.setLineWidth(0.25); doc.rect(cx, OY + 3.2, 4.6, 4.6);
    txt(t, cx + 6.6, OY + 6.9, null, 10.5);
    cx += ws[i] + gap;
  });

  // 2) JOB NJ / เลขที่ใบขนฯ (แถว 1) · บริษัท (แถว 2)
  txt('JOB NJ:', L, OY + 21, null, 11);           dot(L + 15, 148, OY + 21.6);  val(info.nj_job_no || g.job_no, L + 17, OY + 20.6, 130 - L);
  txt('เลขที่ใบขนฯ:', 156, OY + 21, null, 11);     dot(178, R, OY + 21.6);       val(info.job_nj, 180, OY + 20.6, R - 182);
  txt('บริษัท:', L, OY + 30, null, 11);            dot(L + 13, R, OY + 30.6);    val(g.company || info.company, L + 15, OY + 29.6, R - L - 17);

  // 3) ตาราง 6 คอลัมน์ · 11 แถว + Total
  const X = [L, L+18, L+105, L+145, L+188, L+231, R];
  const RH = 8.6, top = OY + 39;                    // local371: แถว 8.6 มม. → หัวกระดาษ + ตาราง 11 แถว + ลงชื่อ อยู่ในหน้าเดียว (A4 แนวนอน)
  const sums = EX_PDF_ROWS.map(()=>({ n:0, c:0, r:0, t:[] }));
  (g.items||[]).forEach(it=>{ const s = sums[_exPdfRowIdx(it.description)]; s.n++; s.c += _exNum(it.cost_amount); s.r += _exNum(it.receipt_amount);
    const w = String(it.wht_no||'').trim(); if(w) s.t.push(w); });
  const rows = EX_PDF_ROWS.map((d,i)=>({
    no:String(i+1), d:d[0],
    a: i===0 ? _exMoney(g.adv) : '',
    c: (i>0 && sums[i].n) ? _exMoney(sums[i].c) : '',
    r: (i>0 && sums[i].n) ? _exMoney(sums[i].r) : '',
    t: sums[i].t.join(', ')
  }));
  rows.push({ no:'', d:'Total Amount', a:_exMoney(g.adv), c:_exMoney(g.cost), r:_exMoney(g.rcp), bold:true });
  const TW = X[6]-X[5]-4;
  const taxLines = (r)=>{ if(!r.t) return []; doc.setFont('Sarabun','normal'); doc.setFontSize(9.5); return doc.splitTextToSize(r.t, TW); };
  const rowH = (r)=> Math.max(RH, taxLines(r).length * 4.1 + 3.4);
  const PB = doc.internal.pageSize.getHeight() - 6;
  const header = (y)=>{
    line(L, y, R, y); line(L, y+RH, R, y+RH); X.forEach(x=>line(x, y, x, y+RH));
    const by = y + RH/2 + 1.6;
    txt('Item', (X[0]+X[1])/2, by, { align:'center' }, 10.5);
    txt('Description', X[1]+2.5, by, null, 10.5);
    txt('Nj advance', (X[2]+X[3])/2, by, { align:'center' }, 10.5);
    txt('Cost Amount', (X[3]+X[4])/2, by, { align:'center' }, 10.5);
    txt('Receipt Amount', (X[4]+X[5])/2, by, { align:'center' }, 10.5);
    txt('Tax number', (X[5]+X[6])/2, by, { align:'center' }, 10.5);
    return y + RH;
  };
  let y = header(top);
  rows.forEach((r,i)=>{
    const h = rowH(r);
    const tail = (i === rows.length-1) ? 12 : 0;                    // แถวสุดท้าย + ช่องลงชื่อต้องอยู่หน้าเดียวกัน
    if(y + h + tail > PB){                                           // ต่อหน้าใหม่อัตโนมัติ (หัวตารางซ้ำ)
      doc.addPage('a4','landscape');
      const cy = _exPdfHead(doc);                                   // local371: หัวกระดาษทุกหน้า
      txt('JOB NJ: ' + (info.nj_job_no || g.job_no || '') + '  (ต่อ)', L, cy - 2, null, 9);
      y = header(cy + 1);
    }
    line(L, y+h, R, y+h); X.forEach(x=>line(x, y, x, y+h));
    const by = y + Math.min(h, RH)/2 + 1.6;
    if(r.no) txt(r.no, (X[0]+X[1])/2, by, { align:'center' }, 10.5);
    txt(r.d, X[1]+2.5, by, null, 10.5);
    if(r.a) txt(r.a, X[3]-2.5, by, { align:'right' }, 10.5, r.bold);
    if(r.c) txt(r.c, X[4]-2.5, by, { align:'right' }, 10.5, r.bold);
    if(r.r) txt(r.r, X[5]-2.5, by, { align:'right' }, 10.5, r.bold);
    taxLines(r).forEach((ln,k)=>{ doc.setFont('Sarabun','normal'); doc.setFontSize(9.5); doc.setTextColor(0,0,0); doc.text(ln, X[5]+2, by + k*4.1); });
    y += h;
  });
  const bottom = y;

  // 4) ลายมือชื่อ
  const sy = bottom + 10;
  txt('Name Cs', L, sy, null, 11);          dot(L + 18, L + 80, sy + 0.5);
  txt('Name Shipping', L + 96, sy, null, 11); dot(L + 124, L + 180, sy + 0.5);
  txt('Date', L + 196, sy, null, 11);       dot(L + 207, R, sy + 0.5);
}

/* ---------- สร้าง PDF ตามโหมด: sum / jobs / all ---------- */
async function _exBuildPdf(mode, h, sel, all){
  const jsPDF = await _exPdfLib();
  await _exEnsureInfo(sel.map(g=>g.job_doc_id||g.src_doc_id));
  let doc = null;
  if(mode==='sum' || mode==='all'){
    doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    doc.setFont('Sarabun','normal');
    _exPdfSummary(doc, h, sel, all);
  }
  if(mode==='jobs' || mode==='all'){
    sel.forEach(g=>{
      if(!doc){ doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' }); }
      else doc.addPage('a4','landscape');
      _exPdfJobForm(doc, g, EX.info[g.job_doc_id||g.src_doc_id] || {});
    });
  }
  return doc;
}
function _exPdfName(mode, h, sel){
  const base = _exFileSafe(h.doc_no || 'expense');
  if(mode==='sum') return base + '.pdf';
  if(mode==='jobs') return base + '_' + (sel.length===1 ? _exFileSafe(sel[0].job_no) : 'JOB') + '.pdf';
  return base + '_SUMMARY_JOB.pdf';                 // ชื่อไฟล์ ASCII (บางเบราว์เซอร์ไม่รับชื่อไฟล์ภาษาไทย)
}
/* PRINT — ใช้ PDF ชุดเดียวกัน (ใบสรุป + รายละเอียด JOB ที่เลือก) */
function _exPrintPdf(doc, name){
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  if(_vpMobile()){ window.open(url, '_blank'); setTimeout(()=>URL.revokeObjectURL(url), 60000); return; }
  let fr = document.getElementById('ex-print-frame'); if(fr) fr.remove();
  fr = document.createElement('iframe');
  fr.id = 'ex-print-frame'; fr.title = name || 'print';
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  fr.onload = ()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(_){ window.open(url, '_blank'); } };
  fr.src = url;
  document.body.appendChild(fr);
  setTimeout(()=>URL.revokeObjectURL(url), 120000);
}

/* ปุ่มในหน้าสรุป: sum / jobs / all / print — ใช้ JOB ที่เลือก */
async function exExportSel(mode){
  const all = _exGroups();
  const sel = all.filter(g=>EX.sumSel.has(g.key));
  if(!sel.length){ toast('ยังไม่ได้เลือก JOB — ติ๊กเลือก JOB ที่ต้องการก่อน','error'); return; }
  const btn = document.querySelector(`[data-ex-pdf="${mode}"]`);
  const old = btn ? btn.innerHTML : '';
  if(btn){ btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> กำลังสร้าง...'; }
  try{
    const h = EX.doc || {};
    const doc = await _exBuildPdf(mode==='print' ? 'all' : mode, h, sel, all);
    const name = _exPdfName(mode==='print' ? 'all' : mode, h, sel);
    if(mode==='print'){ _exPrintPdf(doc, name); }
    else { doc.save(name); toast('ส่งออก PDF แล้ว','success'); }
  }catch(e){ console.error(e); toast('สร้าง PDF ไม่สำเร็จ: '+(e.message||''),'error'); }
  finally{ if(btn && document.body.contains(btn)){ btn.disabled = false; btn.innerHTML = old; } }
}
/* EXPORT PDF — JOB นี้ (หน้าเปิดงาน) */
async function exExportJobPdf(){
  const g = _exCurGroup();
  if(!g){ toast('เลือก JOB ก่อน','error'); return; }
  return exExportGroupPdf(g.key);
}
async function exExportGroupPdf(key){
  const g = _exGroups().find(x=>x.key===key);
  if(!g || !g.items.length){ toast('JOB นี้ยังไม่มีรายการที่บันทึก','error'); return; }
  if(key===EX.cur && _exDirtyKeys().length) toast('มีรายการที่ยังไม่บันทึก — PDF ใช้เฉพาะข้อมูลที่บันทึกแล้ว','info');
  try{
    const h = EX.doc || {};
    const doc = await _exBuildPdf('jobs', h, [g], _exGroups());
    doc.save(_exPdfName('jobs', h, [g]));
    toast('ส่งออก PDF แล้ว','success');
  }catch(e){ console.error(e); toast('Export PDF ไม่สำเร็จ: '+(e.message||''),'error'); }
}

/* ---------- EXPORT PDF จากหน้าแรก / รายงาน = ใบสรุปทุก JOB ในเอกสาร ---------- */
async function exExportPDF(docId){
  try{
    const id = docId || (EX.doc && EX.doc.id);
    if(!id){ toast('ไม่พบเอกสาร','error'); return; }
    const r = await _exFetchDocFull(id);
    if(!r){ toast('ไม่พบเอกสาร','error'); return; }
    if(!r.groups.length || !r.groups.some(g=>g.items.length)){ toast('ยังไม่มีรายการที่บันทึก','error'); return; }
    const doc = await _exBuildPdf('sum', r.h, r.groups, r.groups);
    doc.save(_exPdfName('sum', r.h, r.groups));
    toast('ส่งออก PDF แล้ว','success');
  }catch(e){
    console.error(e);
    toast('Export PDF ไม่สำเร็จ: '+_exErr(e),'error');
  }
}


/* ---------- ส่งออกฟังก์ชันให้ onclick ใน HTML ---------- */
Object.assign(window, {
  renderExpense, exOpenNewWork, exCloseWork, exSaveHead,
  exOpenList, exListReload, exListSearchSoon, exEditDoc, exDeleteDoc, exOpenDetail, exCloseDetail, exCloseDetailOnly,
  exExportExcel, exExportPDF,
  exOpenDoc, exSetTab, exPickJob, exGoWork, exSetTerminal, exJobDDOpen, exJobDDSearch, exAddDraft, exRowSet, exSaveRow, exSaveAllDirty,
  exDeleteRow, exSaveJobAdv, exSumFilter, exSumToggle, exSumAll, exSumClear, exCloseSelected, exViewGroup, exReopenGroup,
  exExportSel, exExportJobPdf, exExportGroupPdf, exSumView, exSumExcel,
  EXL, __EX: EX
});
})();
