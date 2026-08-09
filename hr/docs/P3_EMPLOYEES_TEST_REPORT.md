# P3_EMPLOYEES_TEST_REPORT

Build `njhr-v2-eed72c68` · Chromium (`/opt/google/chrome/chrome`) + Playwright
RPC ดักด้วย `harness/fixtures.js` — ไม่แตะข้อมูล Production
สคริปต์ `harness/p3_feature.js` · ผลดิบ `harness/p3_feature_result.md`

| Test Case | ผล | หลักฐาน |
|---|---|---|
| EMP · Dashboard ไม่โหลด P3 Module | PASS | js=/config.js,/asset-manifest.js,/runtime/namespace.js,/runtime/core.js,/views/dashboard.js |
| EMP · เปิด Employees List | PASS | แถว=20 viewHost=59475B |
| EMP · โหลด views/employees/list.js | PASS | js=/runtime/shared/emp-meta.js,/runtime/shared/hr-meta.js,/views/employees/list.js |
| EMP · ไม่โหลด Import / Export / Form / Documents ตอนเปิดรายการ | PASS | moduleState={"dashboard":"loaded","employees":"loaded","shared-emp-meta":"loaded","shared-hr-meta":"loaded"} |
| EMP · ไม่โหลด Compatibility Bundle | PASS | compat=not_loaded |
| EMP · ไม่โหลด Leave / OT / Attendance | PASS | ไม่พบใน request |
| EMP · Search ทำงาน | PASS | แถวหลังค้นหา=1 |
| EMP · Filter สถานะทำงาน | PASS | แถว=20 |
| EMP · หัวตารางสำหรับ Sort ยังอยู่ | PASS | th[data-sort]=0 |
| EMP · กดเพิ่มพนักงาน จึงโหลด views/employees/form.js | PASS | moduleState.employees-form=loaded |
| EMP · กดเพิ่มพนักงาน เปิดฟอร์มได้ | PASS | modal="เพิ่มพนักงาน" |
| EMP · Validation Error แสดงและไม่ปิดฟอร์ม | PASS | ข้อความ="กรุณาระบุรหัสพนักงาน" |
| EMP · กดแก้ไขพนักงาน เปิดฟอร์มได้ | PASS | modal="แก้ไขข้อมูลพนักงาน" |
| EMP · กดเอกสารแนบ จึงโหลด views/employees/documents.js | PASS | moduleState.employees-documents=loaded |
| EMP · เปิดเอกสารแนบพนักงานได้ | PASS | modal="แฟ้มเอกสารพนักงาน" |
| EMP · กด Import จึงโหลด views/employees/import.js | PASS | moduleState.employees-import=loaded |
| EMP · กด Import เปิดฟอร์มนำเข้าได้ | PASS | modal="นำเข้าพนักงานจาก Excel" |
| EMP · Import ไม่ลาก Export ตามมา | PASS | export=not_loaded |
| EMP · Import ไฟล์ถูก / ไฟล์ผิด / บาง Field ผิด | NOT TESTED | ต้องอัปโหลดไฟล์ .xlsx จริงผ่าน File API — ยังไม่ได้ทำในรอบนี้ |
| EMP · Upload / Download / Delete เอกสารแนบ | NOT TESTED | ต้องใช้ Storage และ Signed URL จริง — ทดสอบด้วย fixture ไม่ครอบคลุม |
| EMP · Save Success / Save Error กับข้อมูลจริง | NOT TESTED | ห้ามเขียนข้อมูล Production — fixture ตอบ 200 เสมอ |
| EMP · กด Export จึงโหลด views/employees/export.js | PASS | moduleState.employees-export=loaded |
| EMP · Export ดึง shared/report-export.js มาด้วย | PASS | โหลดแล้ว |
| EMP · Back กลับหน้าพนักงาน | PASS | hash=#/employees |
| EMP · Forward | PASS | hash=#/dashboard |
| EMP · Deep Link + Refresh | PASS | แถว=20 |
| EMP · กดเมนูรัวแล้วลงหน้าถูกต้อง | PASS | viewHost=59514 |
| EMP · ไม่มี unhandled error ตลอดชุด Employees | PASS | ไม่มี |
| EMP · Logout ระหว่าง Module โหลด → ไม่ render | PASS | กลับหน้า Login |
| EMP · ไม่มี unhandled error | PASS | ไม่มี |
| EMP · USER ไม่มีสิทธิ์ → Access Denied เดิม | PASS | hash=#/dashboard |
| EMP · USER ไม่มีสิทธิ์ → ไม่โหลด Module | PASS | js ใหม่=ไม่มี |
| EMP · Module โหลดไม่สำเร็จ → Error State + ปุ่มลองใหม่ | PASS | state=failed |
| EMP · กดลองใหม่แล้วโหลดสำเร็จ | PASS | state=loaded แถว=20 |
