# P3_ATTENDANCE_TEST_REPORT

(รวม Correction และรายงานการลงเวลา `#/reports`)

Build `njhr-v2-eed72c68` · Chromium (`/opt/google/chrome/chrome`) + Playwright
RPC ดักด้วย `harness/fixtures.js` — ไม่แตะข้อมูล Production
สคริปต์ `harness/p3_feature.js` · ผลดิบ `harness/p3_feature_result.md`

| Test Case | ผล | หลักฐาน |
|---|---|---|
| ATT · เปิดหน้าลงเวลา | PASS | viewHost=3834B |
| ATT · โหลด views/attendance/main.js | PASS | js=/runtime/shared/report-export.js,/runtime/shared/requests.js,/views/attendance/main.js |
| ATT · ไม่โหลด Attendance Report | PASS | report=not_loaded |
| ATT · ไม่โหลด Compatibility / Employees / Leave / OT | PASS | moduleState=dashboard,attendance,shared-report,shared-requests |
| ATT · เปลี่ยนวันที่/เดือน | NOT TESTED | ไม่พบ #att-from บนหน้า (โครงสร้างจริงต่างจากที่ Prompt สมมติ) |
| ATT · เปลี่ยนแผนก | NOT TESTED | ไม่พบ #att-dept บนหน้า |
| ATT · Check-in / Check-out จริง | NOT TESTED | ห้ามสร้างเวลาจริง — ไม่มี Test Account บน Production |
| ATT · ไม่โหลด Correction ตอนเปิดหน้าลงเวลา | PASS | moduleState=not_loaded |
| ATT · กดแก้ไขเวลา จึงโหลด views/attendance/correction.js | PASS | moduleState.attendance-correction=loaded |
| ATT · เปิดฟอร์มแก้ไขเวลาได้ | PASS | modal="ขอแก้ไขเวลา" |
| ATT · เปิดรายงานลงเวลา (#/reports) | PASS | viewHost=2521B |
| ATT · โหลด views/attendance/report.js ตอนเปิดรายงานเท่านั้น | PASS | state=loaded |
| ATT · รายงานไม่ลาก Compatibility มาด้วย | PASS | compat=not_loaded |
| ATT · Back จากรายงาน | PASS | hash=#/attendance |
| ATT · Forward กลับรายงาน | PASS | hash=#/reports |
| ATT · Deep Link รายงาน | PASS | viewHost=2521 |
| ATT · ไม่มี unhandled error ตลอดชุด Attendance | PASS | ไม่มี |
| ATT · RPC ล้มเหลว → หน้าไม่พัง ไม่มีจอขาว | PASS | viewHost=3331 pageerror=0 |
