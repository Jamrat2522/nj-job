# P3_SERVICE_WORKER_REPORT

**Build `njhr-v2-eed72c68` — ใช้ build เดียวกันทั้งรายงานและผลดิบ**
สร้างจากการรัน `harness/p2_sw.js` ใหม่บน build นี้ และอ่าน Cache Storage จริงในเบราว์เซอร์

## 1. Build ID ตรงกันทุกจุด

| จุด | ค่า |
|---|---|
| `config.js` `NJHR_BUILD_VERSION` | `njhr-v2-eed72c68` |
| `asset-manifest.js` `buildId` | `njhr-v2-eed72c68` |
| `sw.js` `const V` | `njhr-v2-eed72c68` |
| Cache Storage key | `njhr-v2-eed72c68` |

`npm run check` มีด่านตรวจ Build ID ทั้งสามจุด — ไม่ตรงจะ exit code ≠ 0

## 2. Core Precache — 8 รายการ เท่าเดิมกับ Prompt 2

```
/
/index.html
/asset-manifest.js?v=<hash>
/runtime/namespace.js?v=<hash>
/runtime/core.js?v=<hash>
/styles.css?v=7eeecea0
/mobile.css?v=319b5a7a
/assets/nj-logistic-logo.png
```

**ไม่มี P3 Module ใดถูกเพิ่มเข้า Core Precache**

## 3. Asset Path ปัจจุบัน (ไม่มี path เก่า)

`LAZY_PATHS` ถูกเขียนโดย `build.js` จากรายชื่อ chunk จริงทุกครั้งที่ build
path เก่าอย่าง `views/leave/index.js` · `views/ot/index.js` · `runtime/shared/report.js` **ไม่มีอยู่ในระบบแล้ว**

## 4. ผลราย Test Case (ผลดิบจากการรันบน build นี้)

| Test Case | ผล | หลักฐาน |
|---|---|---|
| SW · Cache Version ตรงกับ Build ID ใน Manifest | PASS | sw.js V=njhr-v2-eed72c68 · manifest.buildId=njhr-v2-eed72c68 |
| SW · มี cache เดียวชื่อตาม Build ID | PASS | cache=njhr-v2-eed72c68 |
| SW · Precache index.html | PASS | /,/index.html |
| SW · Precache CSS หลัก 2 ไฟล์ | PASS | /styles.css?v=7eeecea0,/mobile.css?v=319b5a7a |
| SW · Precache โลโก้ที่ใช้จริง | PASS | /assets/nj-logistic-logo.png |
| SW · Precache Asset Manifest | PASS | /asset-manifest.js?v=de5a8f55 |
| SW · Precache Runtime Namespace | PASS | /runtime/namespace.js?v=815b8995 |
| SW · Precache Runtime Core | PASS | /runtime/core.js?v=99d882f1 |
| SW · ไม่ Precache config.js | PASS | ไม่มีใน cache |
| SW · ไม่ Precache Dashboard Module | PASS | ไม่มีใน cache ตอน install |
| SW · ไม่ Precache Compatibility Bundle | PASS | ไม่มีใน cache ตอน install |
| SW · ไม่ Precache face.js / master-salary.js / report-template.js | PASS | ไม่มีใน cache ตอน install |
| SW · Dashboard Module ถูก cache หลังเปิด Dashboard ครั้งแรก | PASS | /views/dashboard.js?v=caf87771 |
| SW · Compatibility ยังไม่ถูก cache ตอนอยู่หน้า Dashboard | PASS | compat ใน cache = 0 |
| SW · เปิด Employees ได้ chunk ของ Employees | PASS | /runtime/shared/emp-meta.js?v=3436375a,/runtime/shared/hr-meta.js?v=b64a77a3,/views/employees/list.js?v=40f10c31 |
| SW · เปิด Employees ไม่ดาวน์โหลด Compatibility | PASS | compat ใน cache = 0 |
| SW · เปิด Employees ไม่ดาวน์โหลด Leave / OT / Attendance Report | PASS | ไม่พบใน cache |
| SW · เปิด Employees ไม่ดาวน์โหลด Import / Export | PASS | ไม่พบใน cache |
| SW · เปิด Leave ไม่ดาวน์โหลด Employees Import | PASS | ไม่พบใน cache |
| SW · เปิด OT ไม่ดาวน์โหลด Attendance Report | PASS | ไม่พบใน cache |
| SW · Compatibility ถูก cache เมื่อเปิด Feature เดิมครั้งแรก (#/users) | PASS | /compat/app-legacy.js?v=3f0c1fdd |
| SW · ไม่ cache request ของ Supabase / Signed URL / API | PASS | รายการที่เป็น API ใน cache = 0 |
| SW · config.js ยังไม่ถูก cache หลังใช้งานจริง | PASS | config.js ใน cache = 0 |
| SW · รายการใน Cache หลังใช้งานจริง | PASS | `/ , /index.html , /asset-manifest.js?v=de5a8f55 , /runtime/namespace.js?v=815b8995 , /runtime/core.js?v=99d882f1 , /styles.css?v=7eeecea0 , /mobile.css?v=319b5a7a , /assets/nj-logistic-logo.png , /views/dashboard.js?v=caf87771 , /runtime/shared/emp-meta.js?v=3436375a , /runtime/shared/hr-meta.js?v=b64a77a3 , /views/employees/list.js?v=40f10c31 , /runtime/shared/requests.js?v=cd7e445b , /runtime/shared/leave-meta.js?v=91d7979b , /views/leave/main.js?v=2aded67a , /views/ot/main.js?v=6e3e65b5 , /runtime/shared/report-export.js?v=711627a7 , /runtime/shared/attachments.js?v=5f532921 , /compat/app-legacy.js?v=3f0c1fdd` |
| SW · Activate ลบ cache ของ build เก่า | PASS | cache ที่เหลือ = njhr-v2-eed72c68,other-app-cache |
| SW · ไม่ลบ cache ของแอปอื่นบน origin เดียวกัน | PASS | other-app-cache ยังอยู่ = true |
| SW · ไม่มี Asset จาก build เก่าปะปนใน cache ปัจจุบัน | PASS | รายการ 19 ตัว · ไม่ตรง manifest 0 |

**PASS 26 · FAIL 0**

