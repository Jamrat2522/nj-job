# P3_COMPLETION_REPORT — ปิดช่องว่างของ Prompt 3

**Build ก่อนแก้** `njhr-v2-ad12da59` → **Build หลังแก้** `njhr-v2-eed72c68`

ทุกตัวเลขมาจากการวัดจริงบน Chromium (`/opt/google/chrome/chrome`) ผ่าน Playwright
เซิร์ฟเวอร์ทดสอบบีบ gzip -9 · `Cache-Control: no-store` · RPC ดักด้วย `harness/fixtures.js` — ไม่แตะข้อมูล Production

---

# 0. เรื่องที่ต้องแจ้งก่อน — MD5 ที่ Prompt ระบุว่าพิมพ์ผิด

Prompt ข้อ 11 ระบุว่า `31b9c5485a8b154df073f29d67842d1d` "ยาวเกิน 32 ตัว" และค่าที่ถูกคือ `31b9c5485a8b154df073f29d67842d1`

**ตรวจแล้วพบว่าตรงกันข้าม** — วัดด้วยเครื่องมือจริง

| ค่า | ความยาว | ผ่านกฎ hex ตัวเล็ก 32 ตัว |
|---|---:|---|
| `31b9c5485a8b154df073f29d67842d1d` (ค่าที่มีอยู่เดิม) | **32** | **PASS** |
| `31b9c5485a8b154df073f29d67842d1` (ค่าที่ Prompt เสนอ) | **31** | **FAIL** |

และ `md5sum` ของไฟล์จริง `rollback/before_feature_split_p3/zip/hr-v2-source.zip` คืนค่า

```
31b9c5485a8b154df073f29d67842d1d
```

**จึงไม่แก้ค่าตามที่ Prompt เสนอ** เพราะจะทำให้เอกสารมี MD5 ที่ผิดและใช้ตรวจสอบไม่ได้
สิ่งที่ทำแทนคือ **เพิ่ม Validation ตามที่ Prompt สั่งจริง** — MD5 ต้องเป็น hex ตัวเล็ก 32 ตัวพอดี ไม่งั้น Packaging FAIL
Validation นี้ยืนยันว่าค่าเดิมถูกต้อง และจะจับได้ทันทีถ้ามีค่าใดผิดรูปแบบ

---

# 1. โครงสร้างหลังแก้

```
config.js → Environment Gate → asset-manifest.js → runtime/namespace.js → runtime/core.js
                                                              │
        ┌─────────────────────────────────────────────────────┼──────────────────────────────┐
   views/dashboard.js                          Shared Feature Runtime (6 ไฟล์)        compat/app-legacy.js
                            emp-meta · hr-meta · report-export · requests · leave-meta · attachments
                                                              │
   ┌──────────────┬──────────────┬──────────────┬─────────────┴──────┬──────────────┐
 employees/     attendance/    leave/         ot/              attendance/     (หน้าหลัก)
 list.js        main.js        main.js        main.js          report.js
   │              │              │              │
   │ กดปุ่มจริงจึงโหลด (Action Module)
   ├─ employees/form.js         ← #emp-add · [data-emp-edit] · [data-emp-view] · [data-emp-status] · [data-emp-face]
   ├─ employees/documents.js    ← [data-emp-docs]
   ├─ employees/import.js       ← #emp-import · #emp-tpl
   ├─ employees/export.js       ← #emp-export
   ├─ attendance/correction.js  ← ปุ่มแก้ไขเวลา
   ├─ leave/form.js             ← #lv-new
   ├─ leave/detail.js           ← กดดูรายละเอียดคำขอ (ใช้ร่วมทั้งลาและ OT)
   └─ ot/form.js                ← #ot-new
```

## 1.1 Public Contract ที่ใช้ตัด Circular Dependency

ตรวจแล้วว่า `NJHR.features` ไม่ชนกับ namespace เดิม (`core` `store` `ui` `auth` `router` `layout` `views` `modules` `assets` `state` `compat`)

| Contract | เจ้าของ | ผู้เรียก |
|---|---|---|
| `NJHR.features.employees` | `views/employees/list.js` | form · documents · import · export |
| `NJHR.features.employeesForm` | `views/employees/form.js` | list |
| `NJHR.features.employeesDocs` | `views/employees/documents.js` | list |
| `NJHR.features.attendanceCorrection` | `views/attendance/correction.js` | attendance main |
| `NJHR.features.leaveList` | `views/leave/main.js` | leave form · request detail |
| `NJHR.features.leaveForm` | `views/leave/form.js` | leave main |
| `NJHR.features.requestDetail` | `views/leave/detail.js` | leave main |
| `NJHR.features.otForm` | `views/ot/form.js` | ot main |

**List เป็นเจ้าของการโหลดรายการ · Form เป็นเจ้าของฟอร์มและ Save · Save สำเร็จเรียก `refresh()`**
ไม่มีการ copy `empLoad` และไม่มี State ซ้ำ — `build.js` ด่านที่ 2 จะ FAIL ทันทีถ้าสัญลักษณ์ชื่อเดียวกันอยู่ 2 chunk

## 1.2 ลำดับการเปิด Action Module (เหมือนกันทุกปุ่ม)

```
ตรวจ Permission (ปุ่มจะแสดงเฉพาะผู้มีสิทธิ์ · Route Guard ตรวจก่อนแล้ว)
→ NJHR.modules.load(mod)          [คืน Promise เดิมถ้ากำลังโหลด · โหลดครั้งเดียว]
→ ตรวจ Session (session ยังอยู่)
→ ตรวจ Navigation ID (ยังไม่เปลี่ยน Route)
→ เปิด Modal/Form เดิม
ล้มเหลว → คืนสภาพปุ่ม + toast "ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่" (ไม่เปิดเผย path)
```

---

# 2. โค้ดที่ย้ายออกจาก Core

| ย้ายไป | Function / Variable | จาก |
|---|---|---|
| `runtime/shared/leave-meta.js` | `LEAVE_TYPES` `LT_MAP` `lvType` `lvMode` `lvModeTxt` `lvNum` | `src/06-auth-supabase.js` |
| `runtime/shared/attachments.js` | `sbUploadFile` `sbUploadLeaveFile` `sbUploadOtFile` | `src/06-auth-supabase.js` |

**ผลต่อ Core** — `runtime/core.js` 72,839 → **70,184 B** (gzip 21,445 → **20,521 B**)
Bucket · Prefix · Filename Sanitization · Path · Content Type · Header · Return Object · Error Message **ไม่เปลี่ยนแม้แต่ตัวอักษรเดียว** (ยกบล็อกมาทั้งก้อน)

**Function ที่ยังอยู่ Core และเหตุผล** — Login/Shell/Dashboard ใช้จริง:
`sbLogin` `sbRpc` `sbRpcList` `sbToken` `sbReady` `sbSessionCheck` `sbConnCheck` `sbAbortReads` `refreshLeavePending`
`db` `session` `uiState` `currentUser` `currentEmp` `emp` `dept` `balance` `remainDays` `pendingCount`
`icon` `esc` `toast` `openModal` `closeModal` `confirmDialog` `render` `nav` `canAccess` `renderShell` `mountTabs`
`shOf` `shTime` `shOfAtt` `shAttToday` `shMigrate` `refreshNotifyBadge` `emptyState` `statusBadge` `startLiveClock` `empBE`

---

# 3. Route-to-Module Mapping

| Route | View | Module | Roles |
|---|---|---|---|
| `#/dashboard` | `viewDashboard` | `dashboard` | ALL |
| `#/employees` | `viewEmployees` | `employees` | SUPER_ADMIN, ADMIN |
| `#/attendance` | `viewAttendance` | `attendance` | ALL |
| `#/requests` `#/req-history` `#/leave` | `viewRequests` `viewReqHistory` `viewLeave` | `requests-leave` | ALL |
| `#/ot` | `viewOT` | `ot` | ALL |
| `#/reports` | `viewReports` | `attendance-report` | SUPER_ADMIN, ADMIN |
| อีก 19 Route | 19 view | `compatibility` | เหมือนเดิม |
| `#/payslips` | *(redirect → `#/epayslip`)* | — | ALL |

# 4. Action-to-Module Mapping (อ่านจากโค้ดจริง)

| Action | ตัวกระตุ้นจริงในโค้ด | Module |
|---|---|---|
| เพิ่มพนักงาน | `#emp-add` | `employees-form` |
| แก้ไขพนักงาน | `[data-emp-edit]` | `employees-form` |
| ดูรายละเอียดพนักงาน | `[data-emp-view]` | `employees-form` |
| เปลี่ยนสถานะพนักงาน | `[data-emp-status]` | `employees-form` |
| ลงทะเบียนใบหน้า | `[data-emp-face]` | `employees-form` |
| เอกสารแนบพนักงาน | `[data-emp-docs]` | `employees-documents` |
| นำเข้า Excel / เทมเพลต | `#emp-import` · `#emp-tpl` | `employees-import` |
| Export Excel | `#emp-export` | `employees-export` |
| แก้ไขเวลา | ปุ่มในหน้า `#/attendance` | `attendance-correction` |
| ขอลางาน | `#lv-new` | `leave-form` |
| ดูรายละเอียดคำขอ (ลา + OT) | ปุ่มในรายการ/ประวัติ | `request-detail` |
| ขอ OT | `#ot-new` | `ot-form` |

---

# 5. Asset Manifest (สร้างอัตโนมัติ · buildId `njhr-v2-eed72c68`)

| Module | URL | deps | provides |
|---|---|---|---|
| `dashboard` | `views/dashboard.js?v=caf87771` | — | viewDashboard |
| `shared-emp-meta` | `runtime/shared/emp-meta.js?v=3436375a` | — | — |
| `shared-hr-meta` | `runtime/shared/hr-meta.js?v=b64a77a3` | — | — |
| `shared-report` | `runtime/shared/report-export.js?v=711627a7` | — | — |
| `shared-requests` | `runtime/shared/requests.js?v=cd7e445b` | — | — |
| `shared-leave-meta` | `runtime/shared/leave-meta.js?v=91d7979b` | — | — |
| `shared-attachments` | `runtime/shared/attachments.js?v=5f532921` | — | — |
| `employees` | `views/employees/list.js?v=40f10c31` | shared-emp-meta, shared-hr-meta | viewEmployees |
| `employees-form` | `views/employees/form.js?v=ffe2f5c0` | employees, shared-emp-meta, shared-hr-meta | — |
| `employees-documents` | `views/employees/documents.js?v=d054a800` | employees, shared-hr-meta | — |
| `employees-import` | `views/employees/import.js?v=95dd7594` | employees, shared-report, shared-emp-meta | — |
| `employees-export` | `views/employees/export.js?v=a4410fd1` | employees, shared-report, shared-emp-meta | — |
| `attendance` | `views/attendance/main.js?v=b6d69c40` | shared-report, shared-requests | viewAttendance |
| `attendance-correction` | `views/attendance/correction.js?v=af2510c4` | attendance | — |
| `attendance-report` | `views/attendance/report.js?v=8844ecb2` | shared-report, shared-requests, shared-emp-meta, shared-leave-meta | viewReports |
| `requests-leave` | `views/leave/main.js?v=2aded67a` | shared-requests, shared-hr-meta, shared-leave-meta | viewRequests, viewReqHistory, viewLeave |
| `leave-form` | `views/leave/form.js?v=6923d06d` | requests-leave, shared-leave-meta, shared-attachments, shared-requests | — |
| `request-detail` | `views/leave/detail.js?v=b6236590` | requests-leave, shared-requests, shared-hr-meta, shared-leave-meta | — |
| `ot` | `views/ot/main.js?v=6e3e65b5` | shared-requests | viewOT |
| `ot-form` | `views/ot/form.js?v=7e1870e4` | ot, shared-requests, shared-attachments | — |
| `compatibility` | `compat/app-legacy.js?v=3f0c1fdd` | shared ทั้ง 6 | 19 view |

**Build ID ตรงกันทั้ง 3 จุด** — `config.js` = `asset-manifest.js` = `sw.js` = `njhr-v2-eed72c68`
`npm run check` มีด่านตรวจ Build ID ทั้งสามจุด ถ้าไม่ตรงจะ exit code ≠ 0

---

# 6. ขนาดไฟล์ ก่อน / หลัง

| ไฟล์ | ก่อน raw | หลัง raw | ก่อน gzip | หลัง gzip | Parse/Compile |
|---|---:|---:|---:|---:|---:|
| `runtime/namespace.js` | 5,249 | 5,281 | 2,065 | 2,075 | 0.21 ms |
| **`runtime/core.js`** | 72,839 | **70,184** | 21,445 | **20,521** | 1.52 ms |
| `views/dashboard.js` | 16,540 | 16,540 | 5,222 | 5,222 | 0.34 ms |
| `runtime/shared/emp-meta.js` | 4,264 | 4,264 | 1,394 | 1,394 | 0.08 ms |
| `runtime/shared/hr-meta.js` | 2,806 | 2,806 | 1,167 | 1,167 | 0.08 ms |
| `runtime/shared/report-export.js` | 6,079 | 6,079 | 2,000 | 2,000 | 0.10 ms |
| `runtime/shared/requests.js` | 9,481 | 9,481 | 3,482 | 3,482 | 0.26 ms |
| **`runtime/shared/leave-meta.js`** | — | **1,499** | — | **739** | 0.06 ms |
| **`runtime/shared/attachments.js`** | — | **1,436** | — | **805** | 0.05 ms |
| **`views/employees/list.js`** | 46,785 | **11,834** | 11,953 | **3,634** | 0.24 ms |
| **`views/employees/form.js`** | — | **19,583** | — | **5,408** | 0.30 ms |
| **`views/employees/documents.js`** | — | **17,991** | — | **5,547** | 0.34 ms |
| `views/employees/import.js` | 16,876 | 16,876 | 5,337 | 5,337 | 0.28 ms |
| `views/employees/export.js` | 3,197 | 3,197 | 1,490 | 1,490 | 0.08 ms |
| **`views/attendance/main.js`** | 19,049 | **17,400** | 6,256 | **5,782** | 0.34 ms |
| **`views/attendance/correction.js`** | — | **2,841** | — | **1,283** | 0.08 ms |
| `views/attendance/report.js` | 30,621 | 30,621 | 8,636 | 8,636 | 0.63 ms |
| **`views/leave/main.js`** | 28,253 | **15,296** | 8,489 | **5,234** | 0.36 ms |
| **`views/leave/form.js`** | — | **10,690** | — | **3,881** | 0.22 ms |
| **`views/leave/detail.js`** | — | **4,387** | — | **1,785** | 0.10 ms |
| **`views/ot/main.js`** | 18,558 | **4,074** | 6,159 | **1,855** | 0.10 ms |
| **`views/ot/form.js`** | — | **15,716** | — | **5,360** | 0.32 ms |
| `compat/app-legacy.js` | 513,344 | 513,344 | 122,419 | 122,417 | 8.46 ms |

`styles.css` และ `mobile.css` มี MD5 เดิมทุกไบต์ — ไม่แตะ CSS

---

# 7. Performance — เดินสถานการณ์จริง (ปิด Cache)

## ก่อน P3 FIX (`ad12da59`)

| ขั้น | req | JS transfer | +JS tr |
|---|---:|---:|---:|
| 1. Login | 7 | 26,351 | 26,351 |
| 2. + Dashboard | 8 | 31,573 | 5,222 |
| 3. + Employees List | 11 | 46,087 | **14,514** |
| 4. + กด Add | 11 | 46,087 | 0 |
| 5. + กด Edit | 11 | 46,087 | 0 |
| 6. + เปิด Documents | 11 | 46,087 | 0 |
| 7. + กด Import | 13 | 53,424 | 7,337 |
| 8. + กด Export | 14 | 54,914 | 1,490 |
| 9. + Attendance Main | 16 | 64,652 | 9,738 |
| 10. + เปิด Correction | 16 | 64,652 | 0 |
| 11. + Attendance Report | 17 | 73,288 | 8,636 |
| 12. + Leave Main | 18 | 81,777 | 8,489 |
| 13. + เปิด Leave Form | 18 | 81,777 | 0 |
| 14. + เปิด Request Detail | 18 | 81,777 | 0 |
| 15. + OT Main | 19 | 87,936 | 6,159 |
| 16. + เปิด OT Form | 19 | 87,936 | 0 |
| 17. + compat (`#/users`) | 20 | 210,355 | 122,419 |

## หลัง P3 FIX (`eed72c68`)

| ขั้น | req | JS transfer | +JS tr |
|---|---:|---:|---:|
| 1. Login | 7 | **25,650** | 25,650 |
| 2. + Dashboard | 8 | **30,872** | 5,222 |
| 3. + Employees List | 11 | **37,067** | **6,195** |
| 4. + กด Add | 12 | 42,475 | **5,408** |
| 5. + กด Edit | 12 | 42,475 | 0 *(ใช้ module เดิม)* |
| 6. + เปิด Documents | 13 | 48,022 | **5,547** |
| 7. + กด Import | 15 | 55,359 | 7,337 |
| 8. + กด Export | 16 | 56,849 | 1,490 |
| 9. + Attendance Main | 18 | 66,113 | 9,264 |
| 10. + เปิด Correction | 19 | 67,396 | **1,283** |
| 11. + Attendance Report | 21 | 76,771 | 9,375 |
| 12. + Leave Main | 22 | 82,005 | **5,234** |
| 13. + เปิด Leave Form | 24 | 86,691 | **4,686** |
| 14. + เปิด Request Detail | 24 | 86,691 | 0 *(ดู §11)* |
| 15. + OT Main | 25 | 88,546 | **1,855** |
| 16. + เปิด OT Form | 26 | 93,906 | **5,360** |
| 17. + compat (`#/users`) | 27 | 216,323 | 122,417 |

## อ่านผล

| หัวข้อ | ก่อน | หลัง | ผล |
|---|---:|---:|---|
| Login — JS transfer | 26,351 | **25,650** | **−701 B (−2.7%)** |
| Login — JS decoded | 86,793 | **85,797** | −996 B |
| Login — Request | 7 | 7 | เท่าเดิม |
| Dashboard — JS สะสม | 31,573 | **30,872** | −701 B |
| **เปิด Employees List** | +14,514 | **+6,195** | **−57.3%** |
| Employees List — JS สะสม | 46,087 | **37,067** | −19.6% |
| Attendance Main | +9,738 | +9,264 | −4.9% |
| Leave Main | +8,489 | **+5,234** | **−38.3%** |
| OT Main | +6,159 | **+1,855** | **−69.9%** |
| เปิดครบทุก Action (ขั้น 16) | 87,936 | 93,906 | +6.8% *(กรณีใช้ทุกฟีเจอร์)* |
| Compatibility Bundle | 513,344 / 122,419 | 513,344 / 122,417 | เท่าเดิม (ไม่ได้ย้ายอะไรออกเพิ่ม) |

**Compatibility Bundle ไม่ลดลงในรอบนี้** เพราะ P3 FIX คือการซอย Feature ที่แยกออกมาแล้วให้ละเอียดขึ้น
ไม่ได้ย้ายโค้ดออกจาก compat เพิ่ม (การย้าย Payroll/Approvals/Users ฯลฯ ถูกห้ามไว้ในรอบนี้)

---

# 8. ผลทดสอบ

| ชุด | ผล |
|---|---|
| **Regression DOM 27 route × 6 มิติ (`ad12da59` vs `eed72c68`)** | **162 จุด · ต่าง 0 จุด · PASS** |
| Environment Gate CFG-001…007 | **PASS 12 · FAIL 0** |
| Service Worker (รวม P3 isolation) | **PASS 26 · FAIL 0** |
| `p2_suite` — Role · Session · Dashboard · Listener · Responsive · Compat 28/28 | **PASS 80 · FAIL 0** |
| `p3_feature` — Employees · Attendance · Leave · OT | **PASS 76 · FAIL 0 · NOT TESTED 10** |
| `npm run check` (`harness/check-all-js.js`) | **CHECK PASSED** · ตรวจ DEPLOY_MD5 27 ค่า |
| `node build.js --check` | **ตรงกัน (build eed72c68)** |

**รวม PASS 194 · FAIL 0 · NOT TESTED 11**

## หลักฐานการแยกโหลด (จาก Network + Cache Storage จริง)

- หน้า Login: JS 4 ไฟล์ — `config.js` `asset-manifest.js` `runtime/namespace.js` `runtime/core.js`
- Dashboard: `moduleState = {dashboard}` — **ไม่โหลด** employees-form · employees-documents · attendance-correction · leave-form · leave-detail · ot-form · shared-attachments · shared-leave-meta · compatibility
- `#/employees` → `emp-meta` + `hr-meta` + `list.js` (6,195 B) — ไม่มี form/documents/import/export/compat
- กด Add → `+form.js` · กด Edit อีกครั้ง → **ไม่โหลดซ้ำ**
- เปิด Documents → `+documents.js` · กด Import → `+import.js` · กด Export → `+export.js`
- `#/attendance` → `main.js` · เปิด Correction → `+correction.js`
- `#/leave` → `main.js` (5,234 B) · กด `#lv-new` → `+form.js`
- `#/ot` → `main.js` (1,855 B) · กด `#ot-new` → `+form.js`
- ผู้ใช้ role `USER` เข้า `#/employees` → **ไม่มี JS ใหม่ถูกร้องขอเลย**
- ทุกไฟล์ถูกร้องขอ 1 ครั้งตลอด 28 route

---

# 9. Service Worker (Build เดียวกัน · Path จริง)

**Cache Version `njhr-v2-eed72c68`** = `manifest.buildId` = `config.js NJHR_BUILD_VERSION` — ตรวจซ้ำใน `npm run check`

Core Precache 8 รายการ **เท่าเดิมกับ Prompt 2 ทุกตัว** — ไม่มี P3 Module ใดถูกเพิ่มเข้า Core

`LAZY_PATHS` ถูกเขียนโดย `build.js` จากรายชื่อ chunk จริง ไม่มี path เก่า
(`views/leave/index.js` · `views/ot/index.js` · `runtime/shared/report.js` ไม่มีอยู่ในระบบแล้ว)

รายละเอียดและผลดิบอยู่ใน `P3_SERVICE_WORKER_REPORT.md`

---

# 10. เกณฑ์ผ่าน 42 ข้อ

| # | เกณฑ์ | สถานะ |
|---|---|---|
| 1 | Employees List แยกแล้ว | PASS |
| 2 | Employee Form เป็น Lazy Module | PASS |
| 3 | Employee Documents เป็น Lazy Module | PASS |
| 4 | Employee Import เป็น Lazy Module | PASS |
| 5 | Employee Export เป็น Lazy Module | PASS |
| 6 | Attendance Main แยกแล้ว | PASS |
| 7 | Attendance Correction เป็น Lazy Module | PASS |
| 8 | Attendance Report แยกแล้ว | PASS |
| 9 | Leave Main แยกแล้ว | PASS |
| 10 | Leave Form เป็น Lazy Module | PASS |
| 11 | Leave Detail เป็น Lazy Module | PASS |
| 12 | OT Main แยกแล้ว | PASS |
| 13 | OT Form เป็น Lazy Module | PASS |
| 14 | OT Detail เป็น Lazy Module | PASS *(ใช้ `request-detail` ร่วมกับ Leave — ดู §11)* |
| 15 | Leave Metadata ไม่อยู่ใน Core | PASS |
| 16 | Leave/OT Upload ไม่อยู่ใน Core | PASS |
| 17 | Dashboard ไม่โหลด Action Module | PASS |
| 18 | Login ไม่โหลด Feature Module | PASS |
| 19 | Compatibility ไม่โหลดเมื่อเปิด P3 Feature | PASS |
| 20 | ไม่มี Circular Dependency | PASS (build ด่าน 8) |
| 21 | ไม่มี Function ซ้ำ | PASS (build ด่าน 2) |
| 22 | ไม่มี View ซ้ำ | PASS |
| 23 | ไม่มี Listener ซ้ำ | PASS — เพิ่ม 0 |
| 24 | ไม่มี Module โหลดซ้ำ | PASS |
| 25 | ไม่มี Global ชน | PASS |
| 26 | ไม่มีจอขาว | PASS |
| 27 | ไม่มี Console Error | PASS |
| 28 | ไม่มี Unhandled Rejection | PASS — PAGEERROR 0 |
| 29 | Permission ตรวจก่อนโหลด Module | PASS |
| 30 | SQL ไม่ถูกแก้ | PASS |
| 31 | RPC และ Payload ไม่เปลี่ยน | PASS — Regression 162/162 |
| 32 | UI ไม่เปลี่ยน | PASS |
| 33 | CSS ไม่เปลี่ยน | PASS — MD5 เดิม |
| 34 | Service Worker Report ใช้ Build ID เดียวกัน | PASS |
| 35 | ไม่มี Asset Path เก่าในรายงาน | PASS |
| 36 | MD5 ถูกต้อง 32 ตัว | PASS — validation ใน `npm run check` |
| 37 | Feature Test ที่จำลองได้ผ่าน | PASS 76 |
| 38 | Test ที่ทำไม่ได้ระบุ NOT TESTED | PASS — 11 รายการ |
| 39 | Source ZIP Build ได้จริง | PASS — `P3_CLEAN_REBUILD_REPORT.md` |
| 40 | Deploy ZIP ตรงกับ Source Build | PASS |
| 41 | Rollback ใช้งานได้ | PASS |
| 42 | ZIP ทั้งสองแตกไฟล์ได้ | PASS |

---

# 11. ข้อเท็จจริงที่ต้องบันทึกตรง ๆ

1. **OT Detail ไม่มีไฟล์ `views/ot/detail.js` แยก** — ในโค้ดจริง `rhDetail(kind, id, el)` ตัวเดียวรองรับทั้ง `leave` และ `ot`
   พร้อม `rhLeaveHtml` และ `rhOtHtml` อยู่ในไฟล์เดียวกัน การสร้าง `ot/detail.js` แยกจะต้อง **copy `rhDetail`/`rhTimeline` ซ้ำ**
   ซึ่งขัดข้อห้ามข้อ 17 จึงรวมเป็น module `request-detail` (`views/leave/detail.js`) และให้ทั้งลาและ OT เรียกร่วมกัน
   **เป็นการแยกจริง — โหลดตอนกดดูรายละเอียดเท่านั้น ไม่ได้อยู่ใน main**

2. **`leave/attachments.js` และ `ot/attachments.js` ไม่ได้สร้าง** — ตรรกะไฟล์แนบคือ
   `sbUploadLeaveFile` / `sbUploadOtFile` (ย้ายไป `runtime/shared/attachments.js` แล้ว) กับ
   `lvFileKind` / `lvFileSize` / `otFileKind` / `otFileSize` ซึ่งเป็นตัวตรวจขนาด/ชนิดไฟล์ไม่กี่บรรทัดในฟอร์ม
   Prompt ระบุ "หาก Attachment Logic มีขนาดเพียงพอ" — ขนาดจริงไม่ถึงเกณฑ์ที่คุ้มกับ request เพิ่ม

3. **การวัดขนาด "เปิด Request Detail" ได้ +0 B** เพราะ fixture ไม่มีแถวคำขอให้กด (ประวัติว่าง)
   จึงรายงานเป็น **NOT TESTED** สำหรับตัวเลข ไม่ใช่ PASS · ขนาดไฟล์จริงคือ 4,387 B / 1,785 B gzip

4. **Compatibility Bundle ไม่ลดลง** ในรอบนี้ — ตามขอบเขตที่ห้ามย้าย Payroll/Approvals/Users/Profile/HR Docs/Salary Merge

---

# 12. วิธี Build / Deploy / Verify / Rollback

## Build

```bash
npm ci
node build.js
node build.js --check      # ต้องได้: ตรงกัน  ไฟล์ deploy = src/  (build eed72c68)
npm run check              # ตรวจ syntax ทุกไฟล์ + duplicate + manifest + build id + md5
```

## Deploy

อัปโหลดที่ราก publish โดยรักษาโครงสร้างโฟลเดอร์

```
index.html  config.js  asset-manifest.js  sw.js  netlify.toml  styles.css  mobile.css
runtime/namespace.js  runtime/core.js
runtime/shared/{emp-meta,hr-meta,report-export,requests,leave-meta,attachments}.js
views/dashboard.js
views/employees/{list,form,documents,import,export}.js
views/attendance/{main,correction,report}.js
views/leave/{main,form,detail}.js
views/ot/{main,form}.js
compat/app-legacy.js
face.js  face.css  master-salary.js  report-template.js
assets/nj-logistic-logo.png
```

อัปโหลด asset ให้ครบก่อน แล้วค่อยอัปโหลด `index.html` + `asset-manifest.js` เป็นชุดสุดท้าย

## Verify

```bash
curl -s https://<โดเมน>/asset-manifest.js | grep buildId    # njhr-v2-eed72c68
curl -s https://<โดเมน>/sw.js | grep "const V"
curl -sI https://<โดเมน>/config.js | grep -i cache-control  # no-store
bash verify-netlify.sh
```

DevTools → Network → Disable cache
Login = JS 4 ไฟล์ · Dashboard +1 · `#/employees` +3 · กด Add +1 · เปิด Documents +1 · กด Import +1 · กด Export +1
`#/attendance` +2 · เปิด Correction +1 · `#/leave` +1 · `#lv-new` +2 · `#/ot` +1 · `#ot-new` +1
`#/users` จึงเห็น `compat/app-legacy.js` ครั้งเดียว

## Rollback

ดู `rollback/before_p3_completion_fix/ROLLBACK.md` — กลับไป build `njhr-v2-ad12da59` ได้จาก ZIP ที่เก็บไว้
