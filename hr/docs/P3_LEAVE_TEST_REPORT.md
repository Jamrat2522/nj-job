# P3_LEAVE_TEST_REPORT

(รวม `#/requests` `#/req-history` · Leave Form · Request Detail)

Build `njhr-v2-eed72c68` · Chromium (`/opt/google/chrome/chrome`) + Playwright
RPC ดักด้วย `harness/fixtures.js` — ไม่แตะข้อมูล Production
สคริปต์ `harness/p3_feature.js` · ผลดิบ `harness/p3_feature_result.md`

| Test Case | ผล | หลักฐาน |
|---|---|---|
| LEAVE · เปิดหน้าลางาน | PASS | viewHost=1923B |
| LEAVE · โหลด views/leave/main.js | PASS | js=/runtime/shared/requests.js,/runtime/shared/hr-meta.js,/runtime/shared/leave-meta.js,/views/leave/main.js |
| LEAVE · ไม่โหลด OT / Employees Import / Compatibility | PASS | moduleState=dashboard,requests-leave,shared-requests,shared-hr-meta,shared-leave-meta |
| LEAVE · แสดงสิทธิ์ลา | PASS | ข้อความ="ลาป่วย 0 วัน สิทธิ์ 30 วัน/ปี ลากิจ 0 วัน สิทธิ์ 6 วัน/ปี ลา" |
| LEAVE · ไม่โหลด Leave Form / Detail ตอนเปิดหน้า | PASS | moduleState={"dashboard":"loaded","requests-leave":"loaded","shared-requests":"loaded","shared-hr-meta":"loaded","shared-leave-meta":"loaded"} |
| LEAVE · กดขอลา จึงโหลด views/leave/form.js | PASS | moduleState.leave-form=loaded |
| LEAVE · เปิดฟอร์มขอลาได้ | PASS | modal="ขอลางาน" |
| LEAVE · ฟอร์มมีช่องประเภทลา/ช่วงวันที่/เต็มวัน-ครึ่งวัน/เหตุผล/ไฟล์แนบครบ | PASS | {"type":true,"start":true,"end":true,"mode":true,"note":true,"file":true,"send":true,"err":true} |
| LEAVE · Validation ทำงาน (กดส่งโดยไม่กรอกเหตุผล) | PASS | ข้อความ="กรุณาระบุเหตุผลการลา" |
| LEAVE · ตัวเลือกเต็มวัน/ครึ่งวัน/รายชั่วโมง คงเดิม | PASS | เต็มวัน ครึ่งวันเช้า ครึ่งวันบ่าย รายชั่วโมง |
| LEAVE · เปิดรายละเอียดคำขอ | NOT TESTED | ไม่พบแถวคำขอใน fixture (ประวัติว่าง) |
| LEAVE · ประวัติลาและ OT (#/req-history) เปิดได้ | PASS | viewHost=814 |
| LEAVE · #/req-history ใช้ chunk เดียวกัน ไม่โหลดเพิ่ม | PASS | ไม่มี compat |
| LEAVE · หน้ารวมคำขอ (#/requests) เปิดได้ | PASS | hash=#/requests |
| LEAVE · Submit Success / Submit Error กับข้อมูลจริง | NOT TESTED | ห้ามสร้างคำขอจริงบน Production |
| LEAVE · ไม่มี unhandled error ตลอดชุด Leave | PASS | ไม่มี |
