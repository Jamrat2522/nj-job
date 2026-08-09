# P3_OT_TEST_REPORT

(รวม OT Form · OT Detail ผ่าน module `request-detail`)

Build `njhr-v2-eed72c68` · Chromium (`/opt/google/chrome/chrome`) + Playwright
RPC ดักด้วย `harness/fixtures.js` — ไม่แตะข้อมูล Production
สคริปต์ `harness/p3_feature.js` · ผลดิบ `harness/p3_feature_result.md`

| Test Case | ผล | หลักฐาน |
|---|---|---|
| OT · เปิดหน้า OT | PASS | viewHost=1003B |
| OT · โหลด views/ot/main.js | PASS | js=/runtime/shared/requests.js,/views/ot/main.js |
| OT · ไม่โหลด Employees Import / Attendance Report / Compatibility | PASS | moduleState=dashboard,ot,shared-requests |
| OT · ไม่โหลด OT Form ตอนเปิดหน้า | PASS | moduleState={"dashboard":"loaded","ot":"loaded","shared-requests":"loaded"} |
| OT · กดขอ OT จึงโหลด views/ot/form.js | PASS | moduleState.ot-form=loaded |
| OT · เปิดฟอร์มขอ OT ได้ | PASS | modal="ขอ OT" |
| OT · ฟอร์มมีวันที่/เวลาเริ่ม-สิ้นสุด/ชั่วโมง/ปุ่มเพิ่มรายการงานครบ | PASS | {"date":true,"start":true,"end":true,"hours":true,"addJob":true,"rows":true,"send":true,"err":true} |
| OT · เพิ่มรายการงานได้ | PASS | รายการ 0 -> 1 |
| OT · Validation เวลา/ข้อมูลไม่ครบทำงาน | PASS | ข้อความ="กรุณากรอก JOB · ประเภทงาน ให้ครบทุกรายการ" |
| OT · Submit Success / Submit Error กับข้อมูลจริง | NOT TESTED | ห้ามสร้างคำขอจริงบน Production |
| OT · กดเมนูรัวแล้วลงหน้าถูกต้อง | PASS | viewHost=1003 |
| OT · Deep Link + Refresh | PASS | viewHost=1003 |
| OT · ไม่มี unhandled error ตลอดชุด OT | PASS | ไม่มี |
