# P3_RUNTIME_SPLIT_REPORT — แยก Employees · Attendance · Leave · OT

**Build ก่อน Prompt 3** `njhr-v2-7c877a0c` → **Build หลัง Prompt 3** `njhr-v2-ad12da59` → **Build หลัง Prompt 3 FIX** `njhr-v2-eed72c68`

> เอกสารนี้อธิบายการแยกรอบ Prompt 3 (build `ad12da59`)
> การซอยละเอียดเพิ่มในรอบ Prompt 3 FIX (build `eed72c68`) อยู่ใน **`P3_COMPLETION_REPORT.md`**
> ตาราง Asset Manifest · Route/Action Mapping · ขนาดไฟล์ล่าสุด ให้ยึดตาม `P3_COMPLETION_REPORT.md`

ทุกตัวเลขมาจากการวัดจริงบน Chromium (`/opt/google/chrome/chrome`) ผ่าน Playwright
เซิร์ฟเวอร์ทดสอบบีบ gzip -9 และตั้ง `Cache-Control: no-store` เพื่อปิด Browser Cache
RPC ทุกตัวถูกดักด้วย `harness/fixtures.js` — **ไม่แตะข้อมูล Production เลย**

---

# 1. โครงสร้าง Runtime หลัง Prompt 3

```
config.js  →  Environment Safety Gate  →  asset-manifest.js
                                           →  runtime/namespace.js
                                           →  runtime/core.js
                                                  │
                Router ตรวจ session → ตรวจ role/permission → แล้วจึงสั่ง Module Loader
                                                  │
   ┌──────────────────────────────────────────────┼────────────────────────────────────┐
   │                                              │                                    │
views/dashboard.js                    Shared Feature Runtime                   compat/app-legacy.js
(#/dashboard)                    ┌─────────────────────────────────┐          (Feature ที่ยังไม่แยก)
                                 │ runtime/shared/emp-meta.js      │
                                 │ runtime/shared/hr-meta.js       │
                                 │ runtime/shared/report-export.js │
                                 │ runtime/shared/requests.js      │
                                 └───────────────┬─────────────────┘
                                                 │  (โหลดเป็น deps เท่านั้น)
        ┌───────────────┬──────────────┬─────────┴───────┬──────────────┬─────────────┐
   employees/list.js  employees/    employees/     attendance/     attendance/    leave/main.js
   (#/employees)      import.js     export.js      main.js         report.js      (#/requests
                      (กด Import)   (กด Export)    (#/attendance)  (#/reports)     #/req-history
                                                                                   #/leave)
                                                                                        │
                                                                                   ot/main.js
                                                                                   (#/ot)
```

## 1.1 กลไกที่ทำให้ chunk อ้างถึงกันได้

Prompt 2 ให้ **Core** เปิดเผยผ่าน `NJHR.compat.scope` ตัวเดียว
Prompt 3 ขยายเป็น: **ทุก chunk เขียนสิ่งที่ chunk อื่นต้องใช้ลงใน `NJHR.compat.scope` เดียวกัน**
ลำดับการโหลดถูกบังคับด้วย `deps` ใน Asset Manifest จึงไม่มีทางอ่านก่อนเขียน

`build.js` คำนวณให้อัตโนมัติจากการอ้างอิงจริง ไม่มีการ hardcode:

| chunk | publish | inject | view | deps |
|---|---:|---:|---:|---|
| core | 81 | 0 | 0 | — |
| dashboard | 0 | 30 | 1 | — |
| shared-emp-meta | 6 | 1 | 0 | — |
| shared-hr-meta | 7 | 2 | 0 | — |
| shared-report | 5 | 1 | 0 | — |
| shared-requests | 14 | 17 | 0 | — |
| employees | 2 | 32 | 1 | shared-emp-meta, shared-hr-meta |
| employees-import | 2 | 15 | 0 | employees, shared-report |
| employees-export | 1 | 13 | 0 | employees, shared-report |
| attendance | 0 | 30 | 1 | shared-report, shared-requests |
| requests-leave | 0 | 41 | 3 | shared-requests, shared-hr-meta |
| ot | 0 | 34 | 1 | shared-requests |
| attendance-report | 0 | 29 | 1 | shared-report, shared-requests, shared-emp-meta |
| compatibility | 0 | 84 | 19 | shared ทั้ง 4 |

**ไม่ใช้ `eval` · ไม่ใช้ `new Function` · ไม่ใช้ `with` · `mangle: false` · `compress: false` · CSS `level 2: false` คงเดิมทุกข้อ**

## 1.2 Lazy entry point ที่ต้องประกาศตรง ๆ

`views/employees/list.js` เรียก `NJHR.compat.scope.empImportForm` / `empTemplate` / `empExport` แบบ property access
ซึ่งตรวจด้วย word-boundary ไม่ได้ จึงประกาศไว้ใน `CHUNKS[].exports` และ build ตรวจว่ามีอยู่จริงในไฟล์นั้น

---

# 2. Shared Feature Runtime

| Module | ที่มา | สัญลักษณ์ | raw | gzip | ใช้โดย |
|---|---|---|---:|---:|---|
| `runtime/shared/emp-meta.js` | 08, 12 | `EMP_STATUS` `EMP_STATUS_MAP` `EMP_TYPE_OPTS` `empNormType` `ssoBindForm` `ssoFormPayload` | 4,264 | 1,394 | employees · employees-import · attendance-report · compatibility |
| `runtime/shared/hr-meta.js` | 14 | `DOC_TYPES` `DOC_STATUS` `docState` `docStat` `docTypeDef` `docTypeLabel` `docTS` | 2,806 | 1,167 | employees · requests-leave · compatibility |
| `runtime/shared/report-export.js` | 12 | `rptXmlEsc` `rptSafeName` `rptColLetter` `rptSheetXml` `rptBuildXlsx` `rptLoadZip` `rptDateBE` `rptNorm` | 6,079 | 2,000 | employees-import · employees-export · attendance · attendance-report · compatibility |
| `runtime/shared/requests.js` | 09, 10, 11 | `rqState` `RQ_CARDS` `rqPick` `epNum` `lvCode` `showTimeline` `lvShowTimeline` `otJobsHTML` `otJobsOf` `otJobHours` `otJobEndDate` `otMin` `otDayIdx` `otNextDay` `otSpan` `otDMY` `bindReqCardActions` `otBindJobFiles` `otReqHours` `otFileCount` | 9,481 | 3,482 | attendance · requests-leave · ot · attendance-report · compatibility |

**รวม Shared 22,630 B raw / 8,043 B gzip** — ไม่มีตัวใดเข้า Core หน้า Login และ Dashboard จึงไม่โตขึ้นจากส่วนนี้เลย
**ไม่มีการ copy ฟังก์ชันซ้ำ** — build ด่านที่ 2 จะ FAIL ทันทีถ้าสัญลักษณ์ชื่อเดียวกันถูกประกาศใน 2 chunk

---

# 3. Route-to-Module Mapping (อัปเดต)

อ่านจาก `ROUTES` ตัวจริงใน `src/04-router-guards.js` · `build.js` ตรวจว่าทุก view มีอยู่ใน chunk ที่ระบุจริง

| Route | View | Module | Roles |
|---|---|---|---|
| `#/dashboard` | `viewDashboard` | `dashboard` | ALL |
| `#/employees` | `viewEmployees` | **`employees`** | SUPER_ADMIN, ADMIN |
| `#/attendance` | `viewAttendance` | **`attendance`** | ALL |
| `#/requests` | `viewRequests` | **`requests-leave`** | ALL |
| `#/req-history` | `viewReqHistory` | **`requests-leave`** | ALL |
| `#/leave` | `viewLeave` | **`requests-leave`** | ALL |
| `#/ot` | `viewOT` | **`ot`** | ALL |
| `#/reports` | `viewReports` | **`attendance-report`** | SUPER_ADMIN, ADMIN |
| `#/payslips` | *(redirect → `#/epayslip`)* | — | ALL |
| `#/hr-docs` `#/payroll` `#/salary-merge` `#/epayslip` `#/approval-settings` `#/pay-items` `#/sso` `#/approvals` `#/calendar` `#/announcements` `#/users` `#/departments` `#/settings` `#/geofence` `#/shifts` `#/audit` `#/reportall` `#/notifications` `#/profile` | 19 view | `compatibility` | เหมือนเดิม |

**ไม่มี Route · Hash · Query Parameter · Permission · Default Route · Redirect ใดเปลี่ยน**

## 3.1 Action-to-Module (ไม่มี Route)

| Action | ปุ่ม/ตัวกระตุ้นจริง | Module |
|---|---|---|
| นำเข้า Excel | `#emp-import` | `employees-import` |
| ดาวน์โหลดเทมเพลต | `#emp-tpl` | `employees-import` |
| Export Excel | `#emp-export` | `employees-export` |
| เพิ่ม/แก้ไขพนักงาน · เอกสารแนบ | `#emp-add` · `[data-emp-edit]` · `[data-emp-docs]` | อยู่ใน `employees` (แยกไม่ได้ ดู §7) |
| แบบฟอร์มขอลา | `#lv-new` | อยู่ใน `requests-leave` |
| แบบฟอร์มขอ OT | `#ot-new` | อยู่ใน `ot` |

---

# 4. Asset Manifest (สร้างอัตโนมัติ)

```js
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-ad12da59",
  "runtime": {
    "namespace": "runtime/namespace.js?v=91c18dc7",
    "core":      "runtime/core.js?v=5808bc46"
  },
  "modules": {
    "dashboard":        { url: "views/dashboard.js?v=caf87771",              deps: [],                                             provides: ["viewDashboard"] },
    "shared-emp-meta":  { url: "runtime/shared/emp-meta.js?v=3436375a",      deps: [],                                             provides: [] },
    "shared-hr-meta":   { url: "runtime/shared/hr-meta.js?v=b64a77a3",       deps: [],                                             provides: [] },
    "shared-report":    { url: "runtime/shared/report-export.js?v=711627a7", deps: [],                                             provides: [] },
    "shared-requests":  { url: "runtime/shared/requests.js?v=cd7e445b",      deps: [],                                             provides: [] },
    "employees":        { url: "views/employees/list.js?v=1e136e0f",         deps: ["shared-emp-meta","shared-hr-meta"],           provides: ["viewEmployees"] },
    "employees-import": { url: "views/employees/import.js?v=95dd7594",       deps: ["employees","shared-report"],                  provides: [] },
    "employees-export": { url: "views/employees/export.js?v=a4410fd1",       deps: ["employees","shared-report"],                  provides: [] },
    "attendance":       { url: "views/attendance/main.js?v=…",               deps: ["shared-report","shared-requests"],            provides: ["viewAttendance"] },
    "requests-leave":   { url: "views/leave/main.js?v=…",                    deps: ["shared-requests","shared-hr-meta"],           provides: ["viewRequests","viewReqHistory","viewLeave"] },
    "ot":               { url: "views/ot/main.js?v=…",                       deps: ["shared-requests"],                            provides: ["viewOT"] },
    "attendance-report":{ url: "views/attendance/report.js?v=…",             deps: ["shared-report","shared-requests","shared-emp-meta"], provides: ["viewReports"] },
    "compatibility":    { url: "compat/app-legacy.js?v=…",                   deps: ["shared-emp-meta","shared-hr-meta","shared-report","shared-requests"], provides: [ …19 view… ] }
  },
  "styles": { "main": "styles.css?v=7eeecea0", "mobile": "mobile.css?v=319b5a7a" }
};
```

`sw.js` `V = 'njhr-v2-ad12da59'` · `config.js NJHR_BUILD_VERSION = 'njhr-v2-ad12da59'` — ตรงกันทั้งสามจุด

---

# 5. Build — ด่านตรวจ 15 ข้อ

| # | ด่าน | สถานะ |
|---|---|---|
| 1 | Syntax ทุก output ด้วย `new vm.Script()` ก่อนเขียนดิสก์ | มี |
| 2 | Duplicate Global — สัญลักษณ์ระดับ closure ต้องไม่ซ้ำข้าม chunk | มี |
| 3 | Duplicate Module — ชื่อ chunk ต้องไม่ซ้ำ | มี (โครงสร้าง object) |
| 4 | Duplicate View — `views.register` โยน error ถ้าชื่อซ้ำ + build ตรวจ view ต่อ chunk | มี |
| 5 | Missing Asset — ทุก URL ใน manifest ต้องมีไฟล์จริง | มี |
| 6 | Missing Route Mapping — ทุก Route ต้องชี้ module ที่มีจริง | มี |
| 7 | Missing Dependency — อ้าง symbol ข้าม chunk ต้องประกาศ `deps` | มี |
| 8 | **Circular Dependency** — เดินกราฟ deps และ FAIL ทันทีถ้าวน | มี (เพิ่มใน P3) |
| 9 | Asset Hash — md5 ต่อไฟล์ | มี |
| 10 | Build ID — md5 ของชุด hash ทั้งหมด | มี |
| 11 | Compatibility Bundle Size | อยู่ใน `BUNDLE_SIZE_REPORT.md` |
| 12 | Feature Bundle Size | อยู่ใน `BUNDLE_SIZE_REPORT.md` |
| 13 | Manifest Consistency — เขียนจาก `CHUNKS` ตัวเดียวกับที่ประกอบไฟล์ | มี |
| 14 | Service Worker Version — build เขียน `V` และ `CORE`/`LAZY_PATHS` ให้ | มี |
| 15 | Source/Deploy Consistency — `node build.js --check` | มี |

**บั๊กที่ด่านตรวจจับได้จริงระหว่าง Prompt 3** — `topLevel()` เดิมอ่าน `var a = [], b = 0, c = false;` ได้แค่ตัวแรก
ทำให้ `_lvQSeq` / `_lvQLoading` ไม่ถูกลงทะเบียนเป็นสัญลักษณ์และหลุดจากการฉีดข้าม chunk
พบจาก Regression (`ReferenceError: _lvQSeq is not defined`) แล้วแก้ตัว parser ให้เก็บครบทุก declarator

---

# 6. รายชื่อไฟล์

## 6.1 ไฟล์ที่แก้ไข

| ไฟล์ | สาระ |
|---|---|
| `build.js` | นิยาม 14 chunk · Scope Injection ข้าม chunk · Circular Dependency · `exports` · Manifest/SW/Size Report จาก `CHUNKS` · แก้ parser `var` หลายตัวแปร |
| `src/04-router-guards.js` | เปลี่ยน `mod` ของ 7 Route ไปยัง module ใหม่ (Route/roles/title ไม่เปลี่ยน) |
| `src/11-view-approvals-payroll.js` | ตัด `epNum` ออกไป shared · รับ `apprTab`/`_lvQueue`/`_lvQSeq`/`_lvQLoading` กลับมาเป็นเจ้าของ |
| `src/12-view-reports-settings.js` | ตัดกลุ่ม `rpt*` + `viewReports` + `ssoBindForm`/`ssoFormPayload` ออก · รับ `ssoEditModal` เข้ามาอยู่ข้าง `viewSSO` |
| `src/14-view-profile-hrdocs.js` | ตัด `DOC_TYPES` `DOC_STATUS` `docState` `docStat` `docTypeDef` `docTypeLabel` `docTS` ออกไป shared |
| `sw.js` | `LAZY_PATHS` สร้างจาก chunk จริง (build เขียนให้) · `CORE` เท่าเดิมกับ Prompt 2 |
| `asset-manifest.js` | สร้างอัตโนมัติ |

## 6.2 ไฟล์ต้นทางที่สร้างใหม่

`src/20-shared-emp-meta.js` · `src/21-shared-hr-meta.js` · `src/22-shared-report.js` · `src/23-shared-requests.js`
`src/30-view-employees.js` · `src/31-view-employees-import.js` · `src/32-view-employees-export.js`
`src/33-view-attendance.js` · `src/34-view-requests-leave.js` · `src/35-view-ot.js` · `src/36-view-attendance-report.js`

**ทุกบล็อกถูกยกมาโดยไม่แก้เนื้อในแม้แต่ตัวอักษรเดียว** ยกเว้น 3 ปุ่มใน `src/30` ที่เปลี่ยนเป็น lazy-load (ดู §7)

## 6.3 ไฟล์ผลลัพธ์ที่สร้างใหม่

`runtime/shared/emp-meta.js` · `runtime/shared/hr-meta.js` · `runtime/shared/report-export.js` · `runtime/shared/requests.js`
`views/employees/list.js` · `views/employees/import.js` · `views/employees/export.js`
`views/attendance/main.js` · `views/attendance/report.js` · `views/leave/main.js` · `views/ot/main.js`

## 6.4 ไฟล์ที่ลบ

| ไฟล์ | เหตุผล |
|---|---|
| `src/08-view-employees.js` | เนื้อหาถูกกระจายไป `20/30/31/32` ครบ (ตรวจด้วย build ด่าน 1: ไฟล์ต้องอยู่ใน chunk ครบ) |
| `src/09-view-attendance.js` | → `23/33` |
| `src/10-view-requests-leave-ot.js` | → `23/34/35` |

**ไม่มีไฟล์ deploy ใดถูกลบ** — `app.js` ถูกลบไปแล้วตั้งแต่ Prompt 2

## 6.5 สิ่งที่นำออกจาก Compatibility Bundle

Employees (list/form/detail/documents/status/face) · Employee Import · Employee Export
Attendance (รวม `correctionForm` การแก้ไขเวลา) · Attendance Report (`viewReports` + `rpt*`)
Requests + Leave (`viewRequests` `viewReqHistory` `viewLeave` + ฟอร์มขอลา + ไฟล์แนบ)
OT (`viewOT` + ฟอร์มขอ OT + รายการงาน + ไฟล์แนบ) · Shared Function 4 ชุดข้างต้น

**ยังอยู่ใน Compatibility Bundle** — Approvals · Approval Workflow · Payroll · E-Payslip · REPORT ALL · Calendar
SSO · Shift Editor · Geofence Editor · Pay Items · Pay Entry · Users · Departments · Settings · Audit
Notifications · Announcements · Profile · HR Documents · Rich Text Editor · Salary Merge

---

# 7. สิ่งที่แยกไม่ได้ และเหตุผลจริงจากโค้ด

| รายการ | เหตุผล |
|---|---|
| **Employee Form / Detail / Documents แยกจาก List ไม่ได้** | ปิด transitive closure แล้วพบวงอ้างอิง `empLoad → empForm` และ `empLoad → empFilesOpen` และ `empFilesReopen → empFilesOpen` — ฟอร์มถูกเรียกจากรายการ และรายการถูกเรียกกลับหลังบันทึก แยกได้ต้องแก้ตรรกะซึ่งขัดข้อห้ามข้อ 4/8 |
| **Import / Export แยกได้** | เป็น entry point ทางเดียว ถูกเรียกจาก `viewEmployees` เท่านั้น จึงเปลี่ยนปุ่มเป็น lazy-load ได้ |
| **Leave Detail / OT Detail ไม่มี Route แยก** | เป็น Modal (`rhDetail`, `lvShowTimeline`, `showTimeline`) เรียกจากรายการโดยตรง |
| **Leave / OT Attachments ไม่ใช่โมดูลแยก** | เป็นฟังก์ชันในฟอร์ม และ `sbUploadLeaveFile` / `sbUploadOtFile` อยู่ใน Runtime Core มาตั้งแต่ Prompt 2 |
| **Attendance Correction ไม่มี Route** | `correctionForm()` เป็น Modal ในหน้าลงเวลา — ย้ายไปพร้อม chunk `attendance` |
| **XLSX / JSZip** | `loadScriptOnce('xlsx', …)` lazy อยู่แล้วตั้งแต่ก่อน Prompt 3 |

## 7.1 การเปลี่ยนแปลงพฤติกรรมเดียวที่เกิดขึ้น

ปุ่ม **Export Excel · ดาวน์โหลดเทมเพลต · นำเข้า Excel** — ตอนกด**ครั้งแรก** จะแสดง spinner บนปุ่มระหว่างโหลดไฟล์ chunk
แล้วเรียกฟังก์ชันเดิมด้วยพารามิเตอร์ชุดเดิมทุกประการ ครั้งถัดไปทำงานทันทีเหมือนเดิม
**ข้อความ · CSS Class · DOM ID · ผลลัพธ์ไฟล์ Excel ไม่เปลี่ยน** — ยืนยันด้วย Regression 162/162

---

# 8. เกณฑ์ผ่าน Prompt 3

| # | เกณฑ์ | ผล | หลักฐาน |
|---|---|---|---|
| 1 | Employees แยกออกจาก Compatibility | PASS | `views/employees/list.js` · เปิด `#/employees` ไม่โหลด `app-legacy.js` |
| 2 | Attendance แยกออก | PASS | `views/attendance/main.js` |
| 3 | Attendance Report แยกออก | PASS | `views/attendance/report.js` |
| 4 | Leave แยกออก | PASS | `views/leave/main.js` |
| 5 | OT แยกออก | PASS | `views/ot/main.js` |
| 6 | Employee Import โหลดเมื่อกดเท่านั้น | PASS | ก่อนกด `not_loaded` → หลังกด `loaded` |
| 7 | Employee Export โหลดเมื่อกดเท่านั้น | PASS | เช่นเดียวกัน |
| 8 | Employee Documents โหลดเมื่อเปิดเท่านั้น | **บางส่วน** | อยู่ใน chunk `employees` เพราะวงอ้างอิง (§7) — ไม่อยู่ใน compat แล้ว |
| 9 | Leave Form โหลดเมื่อกดขอลา | **บางส่วน** | อยู่ใน chunk `requests-leave` เดียวกับหน้าลา |
| 10 | OT Form โหลดเมื่อกดขอ OT | **บางส่วน** | อยู่ใน chunk `ot` เดียวกับหน้า OT |
| 11 | Dashboard ไม่โหลด P3 Modules | PASS | `moduleState = {dashboard}` |
| 12 | Login ไม่โหลด P3 Modules | PASS | JS 4 ไฟล์ |
| 13 | Compatibility Bundle เล็กลง | PASS | −25.7% raw · −25.8% gzip |
| 14 | Compatibility Feature อื่นยังทำงาน | PASS | 28/28 route |
| 15 | ไม่มี Function ซ้ำ | PASS | build ด่าน 2 |
| 16 | ไม่มี View ซ้ำ | PASS | registry 27 ตัว ไม่ซ้ำ |
| 17 | ไม่มี Listener ซ้ำ | PASS | เพิ่ม 0 |
| 18 | ไม่มี Module โหลดซ้ำ | PASS | ทุกไฟล์ถูกร้องขอ 1 ครั้งตลอด 28 route |
| 19 | ไม่มี Global ชน | PASS | build ด่าน 2 + 3 |
| 20 | ไม่มีจอขาว | PASS | ทุกเคสรวมกดเมนูรัว |
| 21 | ไม่มี Unhandled Error | PASS | PAGEERROR = 0 |
| 22 | Back/Forward ทำงาน | PASS | Employees · Attendance · Report |
| 23 | Refresh Route ทำงาน | PASS | |
| 24 | Deep Link ทำงาน | PASS | |
| 25 | Role และ Permission เดิมครบ | PASS | 3 role 24/24 |
| 26 | SQL ไม่ถูกแก้ | PASS | ไม่แตะ `supabase/` `supabase-new/` `edge-functions/` |
| 27 | สูตรไม่ถูกแก้ | PASS | Regression 162/162 |
| 28 | UI ไม่ถูกแก้ | PASS | CSS MD5 เดิม · Regression 162/162 |
| 29 | SW ไม่ Precache P3 Modules | PASS | precache 8 core asset เท่าเดิม |
| 30 | Rollback ใช้งานได้ | PASS | ทดสอบกู้จริง |
| 31 | มีผลวัดจริง | PASS | `P3_PERFORMANCE_REPORT.md` |
| 32 | ZIP และ MD5 ครบ | PASS | `ZIP_MD5.txt` |

ข้อ 8 · 9 · 10 ระบุ **"บางส่วน"** ตามข้อเท็จจริง ไม่ยกเป็น PASS เต็ม — เหตุผลเชิงโครงสร้างอยู่ใน §7

---

# 9. วิธี Build

```bash
npm install
node build.js              # สร้าง runtime/ views/ compat/ asset-manifest.js + เขียน Build ID
node build.js --check      # เทียบ deploy กับ src/ — ต้องได้ "ตรงกัน (build ad12da59)"
npm run check
```

# 10. วิธี Deploy

อัปโหลดทั้งหมดนี้ที่ราก publish โดยรักษาโครงสร้างโฟลเดอร์

```
index.html  config.js  asset-manifest.js  sw.js  netlify.toml  styles.css  mobile.css
runtime/namespace.js  runtime/core.js
runtime/shared/emp-meta.js  runtime/shared/hr-meta.js  runtime/shared/report-export.js  runtime/shared/requests.js
views/dashboard.js
views/employees/list.js  views/employees/import.js  views/employees/export.js
views/attendance/main.js  views/attendance/report.js
views/leave/main.js  views/ot/main.js
compat/app-legacy.js
face.js  face.css  master-salary.js  report-template.js
assets/nj-logistic-logo.png
```

**ลำดับที่ปลอดภัย** — อัปโหลด asset ทุกตัวให้ครบก่อน แล้วค่อยอัปโหลด `index.html` + `asset-manifest.js` เป็นชุดสุดท้าย

# 11. วิธี Verify

```bash
curl -s https://<โดเมน>/asset-manifest.js | grep buildId       # njhr-v2-ad12da59
curl -s https://<โดเมน>/sw.js | grep "const V"                 # ต้องตรงกัน
curl -sI https://<โดเมน>/config.js | grep -i cache-control     # no-store
bash verify-netlify.sh
```

บนเบราว์เซอร์ (DevTools → Network → Disable cache)

1. หน้า Login เห็น JS 4 ไฟล์: `config.js` `asset-manifest.js` `runtime/namespace.js` `runtime/core.js`
2. Login → เพิ่ม `views/dashboard.js` ไฟล์เดียว
3. เมนู "พนักงาน" → เพิ่ม `emp-meta.js` `hr-meta.js` `employees/list.js` — **ต้องไม่มี** `app-legacy.js`
4. กด "นำเข้า Excel" → เพิ่ง เห็น `employees/import.js`
5. กด "Export Excel" → เพิ่ง เห็น `employees/export.js`
6. เมนู "ลงเวลา" → `attendance/main.js` · "รายงานการลงเวลา" → `attendance/report.js`
7. "ลางาน" → `leave/main.js` · "OT" → `ot/main.js`
8. "จัดการสมาชิก" → เพิ่ง เห็น `compat/app-legacy.js` และเห็นครั้งเดียว
9. Console ไม่มี error · Cache Storage มี `njhr-v2-ad12da59` ชื่อเดียว และไม่มี `config.js`

# 12. วิธี Rollback

ดู `rollback/before_feature_split_p3/ROLLBACK.md` — กู้ `src/` `runtime/` `views/` `compat/` + ไฟล์ราก
แล้วลบ `runtime/shared/` `views/employees/` `views/attendance/` `views/leave/` `views/ot/` ออกจากเซิร์ฟเวอร์
`node build.js --check` ต้องได้ `ตรงกัน (build 7c877a0c)`
