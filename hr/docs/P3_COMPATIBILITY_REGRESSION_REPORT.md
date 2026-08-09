# P3_COMPATIBILITY_REGRESSION_REPORT

Build `njhr-v2-ad12da59` → `njhr-v2-eed72c68`

## 1. Regression DOM

`node harness/compare.js <deploy ad12da59> .` — 27 Route × 6 มิติ บน Chromium จริง

```
ตรวจ 162 จุด · ต่าง 0 จุด · REGRESSION PASS
console errors  ก่อน=2  หลัง=2   (403 storage probe เท่ากันทั้งสองฝั่ง)
```

## 2. Route ใน Compatibility Bundle — เปิดได้ครบ

| Test Case | ผล | หลักฐาน |
|---|---|---|
| เปิดครบทุก Route | PASS | **28/28** |
| `app-legacy.js` โหลดครั้งเดียว | PASS | ถูกร้องขอ 1 ครั้งตลอด 28 route |
| ไม่มี Module ใดถูกร้องขอซ้ำ | PASS | ทุกไฟล์ 1 ครั้ง |
| ไม่มี Boot / Router / Store / View ซ้ำ | PASS | registry 27 view ไม่ซ้ำ |
| console ไม่มี error ตลอด 28 route | PASS | ว่าง |

Feature ที่ยังอยู่ใน compat และยืนยันว่ายังทำงาน: Approvals · Approval Workflow · Payroll · E-Payslip
REPORT ALL · Calendar · SSO · Shift Editor · Geofence Editor · Pay Items · Users · Departments
Settings · Audit · Notifications · Announcements · Profile · HR Documents · Salary Merge

## 3. Regression ของ Prompt 2 — รันซ้ำบน build `eed72c68`

| ชุด | ผล |
|---|---|
| Environment Gate CFG-001…007 | **PASS 12 · FAIL 0** |
| Login · Login Error · Restore Session · ไม่มี Session · Session Expired · Refresh หลัง Login · Logout | PASS |
| Dashboard · Back · Forward · Deep Link · Retry · กดเมนูรัว · เปลี่ยน Route ระหว่างโหลด · Logout ระหว่างโหลด | PASS |
| Role · Permission · Redirect · Access Denied · Permission ก่อน Module Load | PASS |
| Listener Duplication | PASS — เพิ่ม 0 |
| Mobile 360 · Tablet 768 · Landscape 740×360 · Desktop 1440/1920 | PASS |
| Service Worker · Cache Version · Old Cache Cleanup · `config.js` no-store · Supabase/API/Signed URL ไม่ Cache | **PASS 26 · FAIL 0** |
| Compatibility Routes 28/28 | PASS |
| Console Error · Page Error · Unhandled Rejection | PASS — PAGEERROR 0 |
| **รวม `p2_suite`** | **PASS 80 · FAIL 0** |

## 4. Action Test เพิ่มเติมของรอบนี้

| Test Case | ผล | หลักฐาน |
|---|---|---|
| กด Add Employee แล้วกด Edit ต่อ | PASS | module `employees-form` โหลดครั้งเดียว (+0 B ในครั้งที่สอง) |
| เปิด Documents | PASS | `+documents.js` 5,547 B |
| เปิด Leave Form | PASS | `+form.js` 4,686 B |
| เปิด OT Form | PASS | `+form.js` 5,360 B |
| เปิด Attendance Correction | PASS | `+correction.js` 1,283 B |
| Module Load Failed → Error State + ปุ่มลองใหม่ | PASS | บล็อก `employees/list.js` จริง → `state=failed` |
| Module Retry → โหลดสำเร็จ | PASS | `state=loaded` · แถว 20 |
| Module โหลดเพียงครั้งเดียว | PASS | ทุกไฟล์ถูกร้องขอ 1 ครั้ง |
| Logout ระหว่าง Module โหลด → ไม่ render | PASS | กลับหน้า Login ไม่มี error |
| เปิด/ปิด Modal ซ้ำ Listener ไม่เพิ่ม | PASS | listener คงที่ |

**NOT TESTED** — เปิด Documents แล้ว Logout · เปิด Leave Detail แล้ว Forward · เปิด OT Form แล้ว Session Expired
เปิด Attendance Correction แล้วเปลี่ยน Route · กด Add ซ้ำเร็ว ๆ 10 รอบ
(ยังไม่ได้เขียนเป็นเคสอัตโนมัติในรอบนี้ — ไม่ยกเป็น PASS)

## 5. Rollback

`rollback/before_p3_completion_fix/` — 109 ไฟล์ รวม `src/` `runtime/` `views/` `compat/` `harness/`
รายงานของ build `ad12da59` · Deploy ZIP + Source ZIP ของ build `ad12da59` · `ROLLBACK.md` ครบ 8 หัวข้อ
