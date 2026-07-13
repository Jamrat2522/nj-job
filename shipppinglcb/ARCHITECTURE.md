# ARCHITECTURE — Lazy Chunk (classic-script)
## โครง
```
index.html
 └─ โหลด (defer): config/runtime-config.js → js/utils/format.js → js/core/runtime.js → js/app.js
      app.js (489KB, classic script)
        ├─ core: login, navigation, jobs, document, timeline, รับ/ปิดงาน, realtime, timer
        ├─ lazy loader: _loadChunk(name) / _lazyCall / _lazyRender
        └─ wrappers (onclick เดิม): openExportChooser, exportExcel, docExportExcel, exportBackup,
                                    openOTModal, renderGraphsPage, renderDashboard, renderUsersView
      [เมื่อกดเมนู/ปุ่ม → inject <script>]
        ├─ js/heavy-export.js  (window.HeavyExport)
        ├─ js/heavy-dash.js    (self-replacing globals)
        ├─ js/heavy-ot.js
        └─ js/heavy-users.js
```
## ทำไม classic-script ไม่ใช่ ES import()
app.js เป็น classic script (ไม่ใช่ module) · heavy-* แชร์ global scope กับ app.js (เข้าถึง sb/S/OT_CATEGORY/filteredJobs ได้) · ถ้าใช้ import() = ES module → scope แยก → พัง
## rollback
`js/app.monolithic.js` (559KB) = app.js เดิม monolithic เป๊ะ → เปลี่ยนชื่อทับ app.js + ลบ heavy-* = กลับเดิม
