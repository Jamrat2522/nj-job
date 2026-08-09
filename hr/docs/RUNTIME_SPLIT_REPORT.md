# RUNTIME SPLIT REPORT — HR V2 (Prompt 2)

**Build เดิม** `njhr-v2-2468079b` → **Build ใหม่** `njhr-v2-7c877a0c`

ทุกตัวเลขในเอกสารนี้มาจากการวัดจริงบน Chromium (`/opt/google/chrome/chrome`) ผ่าน Playwright
พร้อมเซิร์ฟเวอร์ทดสอบที่บีบ gzip -9 และตั้ง `Cache-Control: no-store` เพื่อปิด Browser Cache ทุกครั้ง
ทุก RPC ถูกดักตอบด้วย `harness/fixtures.js` (พนักงาน 108 · แผนก 10 · ผู้ใช้ 111) — **ไม่แตะข้อมูล Production เลย**

---

# 1. RUNTIME ARCHITECTURE

```
เบราว์เซอร์
   │
   ├─ index.html                    (no-store)
   ├─ styles.css?v=7eeecea0         render-blocking  ── ไม่แก้ ── byte เดิม
   ├─ mobile.css?v=319b5a7a         render-blocking  ── ไม่แก้ ── byte เดิม
   │
   ├─ config.js                     (no-store · network-only)  ── ต่างจากเดิมเฉพาะบรรทัด BUILD_VERSION
   │
   ├─ [ Environment Safety Gate ]   ── ตรรกะเดิมทุกเงื่อนไข CFG-001…007
   │        BLOCK → ล้าง URL/KEY/localStorage/Cache/SW → แสดงรหัส → จบ (ไม่โหลดอะไรต่อ)
   │        PASS  ↓
   │
   ├─ asset-manifest.js             ← Build ID + URL + hash ของ asset ทุกตัว (ที่เดียวของระบบ)
   ├─ runtime/namespace.js          ← NJHR namespace · Store · View Registry · Module Loader · Build ID Guard
   └─ runtime/core.js               ← Utils · Store · UI · Router · Layout · Auth/Supabase · Shared · Boot
              │
              │  Router ตรวจ session → ตรวจ role/permission → แล้วจึงสั่ง Module Loader
              │
              ├─ views/dashboard.js       โหลดเมื่อเข้า #/dashboard
              └─ compat/app-legacy.js     โหลดเมื่อเข้า Feature ที่ยังไม่แยก (ครั้งเดียว)
                      │
                      └─ lazy เดิมที่ยังทำงานเหมือนเดิม: face.js · face.css · master-salary.js · report-template.js
                         + CDN: xlsx · jszip · leaflet
```

## 1.1 ทำไม Runtime Core จึงเป็นไฟล์เดียว ไม่แยกเป็น 8 ไฟล์ตามตัวอย่าง

Prompt 2 อนุญาตให้โครงสร้างต่างจากตัวอย่างได้หาก Dependency จริงเหมาะสมกว่า — นี่คือเหตุผลจากข้อมูลจริง

| หลักฐาน | ผลต่อการแยก Core |
|---|---|
| โมดูล 01–06 อ้างอิงกัน **แบบวนสองทาง** — `02-store` ใช้ `sbUser`/`sbLoadUser` ของ `06-auth` และ `06-auth` ใช้ `db`/`audit`/`saveDB` ของ `02-store` | แยกเป็นคนละ `<script>` = คนละ closure → ต้องเขียน accessor ครอบตัวแปรกลายพันธุ์ทุกตัว (`db` `session` `uiState` `SB_*` `holCache`) เป็นการรื้อ Core ทั้งชั้น |
| `04-router` ต้องเรียก `renderShell`/`mountTabs` ของ `05-layout` และ `05-layout` ต้องเรียก `canAccess` ของ `04-router` | วนสองทางอีกคู่ |
| Core ทั้งก้อน = **21,370 B gzip** และถูกใช้ทุกหน้ารวมถึงหน้า Login | แยกย่อยแล้ว **ไม่ลดขนาดที่ต้องโหลดแม้แต่ไบต์เดียว** เพราะทุกชิ้นจำเป็นตั้งแต่หน้าแรก |
| การแยกเพิ่มจำนวน request จาก 1 เป็น 7 | เพิ่ม latency บนมือถือ โดยไม่ได้ประโยชน์ |

`runtime/namespace.js` **แยกจริง** เพราะต้องมีอยู่ก่อน Core และไม่มีการอ้างอิงย้อนกลับ — ตรวจแล้วว่าไม่พึ่งพา Core เลย

## 1.2 กลไกที่ทำให้แยก closure ได้โดยไม่ต้องเขียน Feature ใหม่

ปัญหาเดิม (จาก `PERFORMANCE_DEPENDENCY_MAP.md` §12.1 R1/R2): `app.js` เป็น IIFE เดียว 803 สัญลักษณ์
`ROUTES` อ้างฟังก์ชัน `viewXxx` 27 ตัวโดยตรง อาศัย function hoisting ข้าม 9 โมดูล

**วิธีแก้ 3 ชั้น**

1. **View Registry** — `ROUTES` เปลี่ยนจาก `view: viewDashboard` เป็น `view: 'viewDashboard', mod: 'dashboard'`
   Router resolve ผ่าน `NJHR.views` หลังโหลด chunk เสร็จ
2. **Scope Injection** — `runtime/core.js` เปิดเผย `NJHR.compat.scope` ซึ่ง `build.js` **สร้างอัตโนมัติจาก symbol จริง** ไม่มีการ hardcode
   chunk แต่ละตัวถูกห่อด้วย
   ```js
   (function () { 'use strict';
     var S = window.NJHR && NJHR.compat && NJHR.compat.scope;
     if (!S) throw new Error('RUNTIME_NOT_READY');
     var icon = S.icon, esc = S.esc, db = S.db, /* … */;
     /* ---- โค้ดเดิมของโมดูลไม่ถูกแก้ ---- */
     NJHR.views.register('viewDashboard', viewDashboard);
   })();
   ```
   **ไม่ใช้ `eval` · ไม่ใช้ `new Function` · ไม่ใช้ `with` · `mangle:false` และ `compress:false` คงเดิม**
3. **Compatibility Adapter** — ตัวแปร 3 ตัวที่ Core และ Feature เขียนร่วมกันจริงและถูกกำหนดค่าใหม่หลัง chunk โหลดไปแล้ว
   ส่งค่าแบบคัดลอกไม่ได้ ต้องอ่าน/เขียนผ่าน accessor เดียวกัน

   | ตัวแปร | ประกาศที่ | จุดที่แก้ใน Feature |
   |---|---|---|
   | `sbUser` | `06-auth` | `src/09:290` · `src/14:1471` (อ่านอย่างเดียว) |
   | `_lvPending` → `NJHR.state.lvPending` | `06-auth` | `src/11:9, 31, 165, 173` |
   | `_ntUnread` → `NJHR.state.ntUnread` | `06-core-shared-boot` | `src/13:1138, 1152` |

   ติดตั้งด้วย `Object.defineProperty` get/set ใน `src/06-core-shared-boot.js` — **รวม 8 บรรทัดในไฟล์ Feature ทั้งโปรเจกต์**

## 1.3 ด่านตรวจอัตโนมัติใน `build.js` (7 ด่าน · ทุกด่านเคยจับของจริงระหว่างพัฒนา)

| # | ด่าน | ผลถ้าไม่ผ่าน |
|---|---|---|
| 1 | ไฟล์ใน `src/` ทุกตัวต้องถูกจัดเข้า chunk และ chunk ต้องไม่อ้างไฟล์ที่ไม่มีจริง | BUILD FAILED |
| 2 | สัญลักษณ์ระดับ closure ต้องไม่ซ้ำข้าม chunk (Duplicate Global) | BUILD FAILED |
| 3 | chunk ต้องไม่ประกาศชื่อทับ symbol ของ Core | BUILD FAILED |
| 4 | chunk ต้องไม่เขียนค่าทับ Core symbol (ตรวจแยกตัวแปรภายในฟังก์ชันออกแล้ว) | BUILD FAILED |
| 5 | ทุก Route ต้องชี้ module ที่มีจริง และ view ต้องมีอยู่ใน chunk นั้นจริง | BUILD FAILED |
| 6 | ห้าม chunk อ้าง symbol ของ chunk อื่นที่ไม่ได้ฉีดเข้ามา (ตรวจบนสำเนาที่ตัดคอมเมนต์แล้ว) | BUILD FAILED |
| 7 | `new vm.Script()` ทุก output ก่อนเขียนลงดิสก์ | BUILD FAILED |

ผลรันจริง: `Scope injection: core เปิดเผย 83 symbol · dashboard รับเข้า 31 · compatibility รับเข้า 79 · Route mapping 27 route`

---

# 2. UPDATED BOOT FLOW

```
index.html
   │
[1] <script src="./config.js">                      parser-blocking · no-store
       ตั้ง ENV_NAME · BUILD_VERSION · SUPABASE_URL/KEY · PROJECT_ID · ALLOW_PRODUCTION
       บรรทัดสุดท้าย NJHR_CONFIG_FILE_OK = true
   │
[2] <script> inline — Boot Loader (เดิม ไม่แก้)
       NJHR_ENV = 'production' · NJHR_loadBootScript(src)  [script.async=false + Promise cache]
   │
[3] <script> inline — ENVIRONMENT SAFETY GATE (ตรรกะเดิมทั้งหมด)
       ┌── BLOCK (CFG-001…007) ────────────────────────────────────────┐
       │ SUPABASE_URL / ANON_KEY / API_BASE = undefined                │
       │ ลบ localStorage+sessionStorage 6 คีย์                          │
       │ caches.delete ทุก key ที่ขึ้นต้น 'njhr-v2-'                     │
       │ unregister SW เฉพาะ scope ใต้โฟลเดอร์ V2                       │
       │ แสดงรหัสบนจอ · ไม่มีปุ่มข้าม · หยุด ไม่โหลด asset ใด ๆ ต่อ       │
       └───────────────────────────────────────────────────────────────┘
       PASS ↓
[4] NJHR_loadBootScript('asset-manifest.js?v=e22c9d20')
       └── ไม่มี NJHR_ASSETS → throw ASSET_MANIFEST_MISSING → ไม่ Boot ต่อ
[5]      .then → NJHR_loadBootScript(A.runtime.namespace)
              Build ID Guard: manifest.buildId ≠ config.NJHR_BUILD_VERSION
                              → sessionStorage flag → location.reload() ครั้งเดียว → ไม่วน
              สร้าง NJHR.state / store / router / views / modules
[6]      .then → NJHR_loadBootScript(A.runtime.core)
              IIFE เดียว: 01 utils → 02 store → 03 ui → 04 router → 05 layout → 06 auth → 06 shared+boot
              ท้ายไฟล์: NJHR.compat.scope · NJHR.router.moduleMap · NJHR.core/auth/ui/layout
[7] njhrBootOnce()  (DOMContentLoaded หรือทันทีถ้า readyState พร้อม)
       loadDB → fillDbGaps → loadSession → loadUI → shMigrate → njFixCompanyName → holLoad
[8] njhrBoot()
       ไม่มี token → sbConnCheck → renderLogin
       มี token   → sbConnCheck ‖ sbSessionCheck (ขนาน · เงื่อนไขผ่านเหมือนเดิม)
                    ผิด → renderConnError / renderLogin
                    ผ่าน → njhrStartAfterSession
[9] render()   ← 04-router-guards
       sbAbortReads → ตรวจ session → ตรวจ user.active → normalize hash → canAccess
       ↓ ผ่านด่านสิทธิ์แล้วเท่านั้น
       navId = NJHR.router.bump()
       renderShell(hash) → mountTabs(hash)
       ├─ view เป็น function (เฉพาะ #/payslips redirect) → เรียกทันที
       ├─ NJHR.views.has(view)                          → render ทันที (พฤติกรรมเท่าเดิมทุกประการ)
       └─ ยังไม่มี → แสดง Loading → NJHR.modules.load(mod)
                       .then  ตรวจ navId · ตรวจ session · ตรวจ canAccess ซ้ำ → render
                       .catch แสดง Error State + ปุ่ม "ลองใหม่"
```

**Login ไม่โหลด Feature Bundle** — ยืนยันด้วยรายการ request จริง: `config.js, asset-manifest.js, namespace.js, core.js`

---

# 3. RUNTIME MODULE LIST

| ไฟล์ | ที่มา | raw | gzip | hash | โหลดเมื่อ |
|---|---|---:|---:|---|---|
| `asset-manifest.js` | build สร้างอัตโนมัติ | 1,457 | 666 | `e22c9d20` | ทุกครั้ง |
| `runtime/namespace.js` | `runtime-src/namespace.js` | 5,249 | 2,065 | `91c18dc7` | ทุกครั้ง |
| `runtime/core.js` | `src/01 02 03 04 05 06-auth 06-core-shared-boot` | 71,406 | 21,370 | `bcff66c9` | ทุกครั้ง |
| `views/dashboard.js` | `src/07` | 16,560 | 5,229 | `d1bb59f7` | `#/dashboard` |
| `compat/app-legacy.js` | `src/08 09 10 11 12 13 14 15` | 690,516 | 165,051 | `7e57920a` | Feature ที่ยังไม่แยก |
| `styles.css` | `src/css/styles.css` | 77,240 | 15,134 | `7eeecea0` | ทุกครั้ง (byte เดิม) |
| `mobile.css` | `src/css/mobile.css` | 41,277 | 7,435 | `319b5a7a` | ทุกครั้ง (byte เดิม) |
| `index.html` | แก้ boot sequence | 15,429 | 5,126 | — | ทุกครั้ง |
| `config.js` | ต่างเดิมเฉพาะ BUILD_VERSION | 5,378 | 1,878 | — | ทุกครั้ง |
| `sw.js` | แก้ CORE/LAZY/matcher | 5,173 | 2,127 | — | ทุกครั้ง |

## 3.1 Runtime Core มีอะไร

Utility ที่ทุกหน้าใช้ · Date/Time · String/Number · Store กลาง (`db` `session` `uiState`) · Current User/Session/Route
Toast · Modal พื้นฐาน · Loading/Error State ของ Router · Supabase Client + ชั้น RPC (timeout/dedup/abort/busy)
Login · Logout · Session Restore · Router · Route Guard · Layout Shell · Sidebar · BottomNav · Module Loader · View Registry · Boot Sequence

## 3.2 Runtime Core **ไม่มี** อะไร

Employee List/Form · Attendance Table · Leave/OT Form · Approval List · Payroll · Report · Excel Export
HR Documents · Template · Settings · Geofence · **Shift Editor** (`shRender`/`shMigrateTool`/`viewShifts` อยู่ compat)
Workflow Editor · User Management · Audit · Face Recognition · Salary Merge · Modal เฉพาะฟีเจอร์

---

# 4. DASHBOARD DEPENDENCY LIST

`views/dashboard.js` = `src/07-view-dashboard.js` ล้วน · register 1 view (`viewDashboard`) · **ไม่พึ่ง `compat/app-legacy.js` เลย**

รับจาก `NJHR.compat.scope` **31 symbol** (build คำนวณจากการอ้างอิงจริง)

```
icon esc pad money todayISO nowStamp fmtDate fmtMonthYear isHoliday holHas
db emp dept currentUser currentEmp empName balance remainDays idx audit notify
toast openModal closeModal confirmDialog nav render canAccess ROUTES
emptyState statusBadge startLiveClock empBE shAttToday shOf
```

RPC ที่ Dashboard เรียก: `njhr_event_list` · `njhr_ann_feed` · `njhr_ann_read` · `njhr_ann_ack` · `njhr_notify_list`

## 4.1 Shared Function ที่ย้ายเข้า Core (ไม่ copy ซ้ำที่ใด)

| ฟังก์ชัน | เดิมอยู่ | เหตุผลที่ต้องย้าย |
|---|---|---|
| `emptyState` | 07 | 7 chunk ฝั่ง compat เรียก |
| `statusBadge` | 07 | 10 และ 11 เรียก |
| `startLiveClock` + `clockTimer` | 07 | dashboard และ 09 เรียกทั้งคู่ |
| `empBE` | 08 | **dashboard เรียก** (ข้ามขอบเขต chunk) |
| `shGet` `shOf` `shTime` `shOfAtt` `shAttToday` | 12 | **dashboard เรียก `shAttToday`** ซึ่งพึ่ง `shOf`→`shGet` |
| `shMigrate` | 12 | `njhrBootOnce()` เรียกตอน boot ก่อน chunk ใด ๆ จะโหลด |
| `refreshNotifyBadge` + `_ntUnread` | 13 | `njhrStartAfterSession()` เรียกตอน boot และ `refreshMenuBadge` (05) อ่าน `_ntUnread` |

ยกมาทั้งบล็อกโดยไม่แก้เนื้อในแม้แต่ตัวอักษรเดียว — พิสูจน์ด้วย Regression 162/162

---

# 5. COMPATIBILITY BUNDLE CONTENT LIST

`compat/app-legacy.js` = `src/08 09 10 11 12 13 14 15` (หัก 8 ฟังก์ชันที่ย้ายเข้า Core)
register **26 view** · รับจาก scope **79 symbol** · **ไม่มี boot · ไม่มี router · ไม่มี auth listener · ไม่มี store · ไม่มี dashboard**

| โมดูล | ฟีเจอร์ | View ที่ register |
|---|---|---|
| 08 | พนักงาน · Import/Export · ไฟล์พนักงาน · Face | `viewEmployees` |
| 09 | ลงเวลา · Geofence check | `viewAttendance` |
| 10 | คำขอ · ลางาน · OT · ประวัติ | `viewRequests` `viewReqHistory` `viewLeave` `viewOT` |
| 11 | อนุมัติ · เงินเดือน · E-Payslip · Report Export | `viewApprovals` `viewPayroll` `viewEPayslip` |
| 12 | REPORT ALL · รายงาน · ปฏิทิน · กะ · Geofence · Workflow · Pay Items · ประกันสังคม | `viewReportAll` `viewReports` `viewCalendar` `viewShifts` `viewGeofence` `viewApprovalSettings` `viewPayItems` `viewSSO` |
| 13 | ประกาศ · ผู้ใช้ · แผนก · ตั้งค่า · Audit · แจ้งเตือน | `viewAnnouncements` `viewUsers` `viewDepartments` `viewSettings` `viewAudit` `viewNotifications` |
| 14 | โปรไฟล์ · เอกสาร HR · RTE · Salary Merge engine | `viewProfile` `viewHrDocs` |
| 15 | รวมเงินเดือน (หน้าจอ) | `viewSalaryMerge` |

**การเริ่มระบบเองตอนโหลด: ไม่มี** — บล็อก INIT ทั้งหมดถูกย้ายไป `src/06-core-shared-boot.js` แล้ว

---

# 6. ROUTE-TO-MODULE MAPPING

สร้างจาก `ROUTES` ตัวจริงใน `src/04-router-guards.js` — `build.js` อ่านและตรวจสอบตอน build
`NJHR.router.moduleMap` ถูกเติมตอน runtime จาก `ROUTES` เดียวกัน จึงไม่มีทางหลุดจากกัน

| Route | View | Module | Roles |
|---|---|---|---|
| `#/dashboard` | `viewDashboard` | **dashboard** | ALL |
| `#/payslips` | *(redirect → `#/epayslip`)* | — | ALL |
| `#/employees` | `viewEmployees` | compatibility | SUPER_ADMIN, ADMIN |
| `#/hr-docs` | `viewHrDocs` | compatibility | ALL |
| `#/attendance` | `viewAttendance` | compatibility | ALL |
| `#/requests` | `viewRequests` | compatibility | ALL |
| `#/req-history` | `viewReqHistory` | compatibility | ALL |
| `#/leave` | `viewLeave` | compatibility | ALL |
| `#/ot` | `viewOT` | compatibility | ALL |
| `#/payroll` | `viewPayroll` | compatibility | SUPER_ADMIN, ADMIN |
| `#/salary-merge` | `viewSalaryMerge` | compatibility | SUPER_ADMIN, ADMIN |
| `#/epayslip` | `viewEPayslip` | compatibility | ALL |
| `#/approval-settings` | `viewApprovalSettings` | compatibility | SUPER_ADMIN, ADMIN |
| `#/pay-items` | `viewPayItems` | compatibility | SUPER_ADMIN, ADMIN |
| `#/sso` | `viewSSO` | compatibility | SUPER_ADMIN, ADMIN |
| `#/approvals` | `viewApprovals` | compatibility | SUPER_ADMIN, ADMIN |
| `#/reports` | `viewReports` | compatibility | SUPER_ADMIN, ADMIN |
| `#/calendar` | `viewCalendar` | compatibility | ALL |
| `#/announcements` | `viewAnnouncements` | compatibility | ALL |
| `#/users` | `viewUsers` | compatibility | SUPER_ADMIN, ADMIN |
| `#/departments` | `viewDepartments` | compatibility | SUPER_ADMIN, ADMIN |
| `#/settings` | `viewSettings` | compatibility | SUPER_ADMIN, ADMIN |
| `#/geofence` | `viewGeofence` | compatibility | **SUPER_ADMIN** |
| `#/shifts` | `viewShifts` | compatibility | SUPER_ADMIN, ADMIN |
| `#/audit` | `viewAudit` | compatibility | SUPER_ADMIN, ADMIN |
| `#/reportall` | `viewReportAll` | compatibility | SUPER_ADMIN, ADMIN |
| `#/notifications` | `viewNotifications` | compatibility | ALL |
| `#/profile` | `viewProfile` | compatibility | ALL |

**Route · Hash · Query Parameter · Permission · Default Route · Redirect — ไม่มีตัวใดเปลี่ยน**

---

# 7. ASSET MANIFEST

```js
window.NJHR_ASSETS = {
  "buildId": "njhr-v2-7c877a0c",
  "runtime": {
    "namespace": "runtime/namespace.js?v=91c18dc7",
    "core":      "runtime/core.js?v=bcff66c9"
  },
  "modules": {
    "dashboard":     { "url": "views/dashboard.js?v=d1bb59f7",   "deps": [], "provides": ["viewDashboard"] },
    "compatibility": { "url": "compat/app-legacy.js?v=7e57920a", "deps": [], "provides": [ …26 view… ] }
  },
  "styles": { "main": "styles.css?v=7eeecea0", "mobile": "mobile.css?v=319b5a7a" }
};
```

| กฎที่กำหนดไว้ | สถานะ |
|---|---|
| URL Asset ประกาศที่เดียว | PASS — `build.js` สร้างไฟล์นี้ไฟล์เดียว |
| ห้าม hardcode hash กระจายหลายไฟล์ | PASS — `sw.js` `index.html` `config.js` ถูกเขียนโดย build |
| Manifest มี Build ID | PASS |
| Runtime และ SW ใช้ Build ID เดียวกัน | PASS — `sw.js V = njhr-v2-7c877a0c` |
| Manifest โหลดไม่ได้ = ห้าม Boot ต่อ | PASS — `throw ASSET_MANIFEST_MISSING` |
| Build ID ไม่ตรง → refresh ปลอดภัยครั้งเดียว | PASS — วัดได้ 1 ครั้งแล้วหยุด |
| ห้าม Refresh Loop | PASS — `sessionStorage['njhr_v2_build_reload']` |
| `config.js` ไม่ถูก cache | PASS — `sw.js` no-store + `netlify.toml` no-store |
| Manifest ไม่มีข้อมูลลับ | PASS — มีแต่ path และ hash |
| Manifest สร้างอัตโนมัติจาก build | PASS |

---

# 8. PERFORMANCE BEFORE / AFTER

วิธีวัด: Chromium · เซิร์ฟเวอร์ gzip -9 · `Cache-Control: no-store` · context ใหม่ทุกครั้ง
ตัวเลขเวลารัน **3 รอบสลับ BEFORE/AFTER** แล้วรายงานค่ากลาง (ขนาดคงที่ทุกรอบ)

## 8.1 หน้า Login (cold, ปิด cache)

| ตัวชี้วัด | ก่อน | หลัง | ผล |
|---|---:|---:|---|
| **JS — Transfer Size** | 188,979 B | **25,979 B** | **−86.3 %** |
| **JS — Decoded Size** | 775,292 B | **83,490 B** | **−89.2 %** |
| **JS — Raw Size (บนดิสก์)** | 775,292 B | 83,490 B | −89.2 % |
| Asset ทั้งหมด — Transfer | 216,340 B | **53,674 B** | −75.2 % |
| Asset ทั้งหมด — Decoded | 908,280 B | **217,436 B** | −76.1 % |
| Request Count | 5 | 7 | +2 |
| DOMContentLoaded | 246 ms | 245 ms | เท่ากัน |
| Load Event | 391 ms | **321 ms** | −18 % |
| FCP | 588 ms | **536 ms** | −9 % |
| **JS Parse/Compile (V8)** | **13.62 ms** | **1.76 ms** | **−87.1 %** |
| Long Tasks | 87–123 ms | 97–119 ms | แยกไม่ออกจากสัญญาณรบกวน |
| JS Heap | 2.9 MB | **1.6 MB** | **−45 %** |
| DOM Nodes | 53 | 55 | +2 |

**ต้องพูดตรง ๆ เรื่องเวลา** — การทดสอบนี้รันบน `127.0.0.1` ซึ่งความหน่วงเครือข่ายเกือบเป็นศูนย์
DCL/FCP จึงแทบไม่ต่าง ประโยชน์จริงของการลด Transfer Size 163 KB จะปรากฏบนเน็ตมือถือจริงเท่านั้น
**ผมยังไม่ได้วัดบนเครือข่ายจริง จึงไม่รับรองตัวเลขเวลาบนอุปกรณ์ผู้ใช้**
สิ่งที่วัดได้แน่นอนและไม่ขึ้นกับเครือข่ายคือ **ขนาดที่ต้องดาวน์โหลด** และ **เวลา Parse/Compile**

## 8.2 หลัง Login เปิด Dashboard

| ตัวชี้วัด | ก่อน | หลัง |
|---|---:|---:|
| JS สะสม — Transfer | 188,979 B | **31,208 B** (−83.5 %) |
| JS สะสม — Decoded | 775,292 B | **100,050 B** (−87.1 %) |
| Asset สะสม — Transfer | 216,340 B | **58,903 B** |
| Request Count | 5 | 8 |
| Dashboard Module | (อยู่ใน `app.js`) | **5,229 B gzip / 16,560 B raw** |
| Parse/Compile สะสม | 13.62 ms | **2.09 ms** |
| **Compatibility Bundle** | — | **ไม่ถูกโหลด** |
| JS Heap | 3.1 MB | 1.9 MB |

## 8.3 หลังเปิด Feature เดิมครั้งแรก (`#/employees`)

| ตัวชี้วัด | ค่า |
|---|---|
| Compatibility Bundle — Transfer | 165,051 B |
| Compatibility Bundle — Decoded / Raw | 690,516 B |
| Request รวมสะสม | 9 |
| JS สะสม — Transfer | 196,259 B |
| Parse/Compile สะสม | 13.71 ms |
| เปิด compat route **ที่ 2** (`#/attendance`) | **ไม่มี request เพิ่ม** (คงที่ 9) |
| จำนวนครั้งที่ `app-legacy.js` ถูกร้องขอตลอด 28 route | **1 ครั้ง** |

## 8.4 เทียบกับเป้าหมายที่ Prompt 2 ตั้งไว้

| เป้าหมาย | ผลจริง | สถานะ |
|---|---|---|
| หน้า Login ไม่โหลด Feature Bundle | โหลดแค่ 4 ไฟล์ JS | PASS |
| Login + Runtime เล็กกว่า `app.js` เดิมชัดเจน | 25,979 vs 188,979 B | PASS |
| Dashboard โหลดเฉพาะ Dashboard Module | ยืนยันจาก request จริง | PASS |
| Dashboard ไม่โหลด Compatibility Bundle | `moduleState.compatibility = not_loaded` | PASS |
| Compat โหลดเมื่อเปิด Feature อื่นเท่านั้น | ยืนยัน | PASS |
| Initial JS หน้า Login < 100 KB | **25.4 KB** | PASS |
| Dashboard Module 30–60 KB | **16.2 KB raw / 5.1 KB gzip** — เล็กกว่าเป้าเพราะ 07 มีขนาดเท่านี้จริง | PASS |
| Login + Dashboard < 160 KB | **30.5 KB** | PASS |

---

# 9. TEST RESULT

## 9.1 Environment Gate Report — PASS 12 / FAIL 0

ทุกเคส BLOCK ตรวจพร้อมกัน 6 เงื่อนไข: รหัสถูกต้อง · แสดงรหัสบนหน้าจอ · `SUPABASE_URL`/`ANON_KEY` เป็น `undefined` · `localStorage` (`njhr_token`, `njhr_sb_user`) ถูกล้าง · **โหลด runtime 0 ไฟล์** · **เรียก Supabase 0 ครั้ง**

| # | Test Case | ผล |
|---|---|---|
| 1 | CFG-001 · `config.js` โหลดไม่ครบ / ถูกตัดกลางคัน | PASS |
| 2 | CFG-002 · ค่ายังเป็น `__PLACEHOLDER__` | PASS |
| 3 | CFG-002 · ENV=staging แต่ยังไม่กรอก `STAGING_PROJECT_ID` | PASS |
| 4 | CFG-003 · `NJHR_ENV_NAME` ไม่ใช่ staging/production | PASS |
| 5 | CFG-004 · URL ไม่ใช่รูปแบบ Supabase ที่อนุญาต | PASS |
| 6 | CFG-004 · URL เป็น Supabase แต่ Project ไม่อยู่ในรายการอนุญาต | PASS |
| 7 | CFG-005 · URL ชี้ Production แต่ `ALLOW_PRODUCTION !== true` | PASS |
| 8 | CFG-005 · ENV=staging แต่ตั้ง `ALLOW_PRODUCTION = true` | PASS |
| 9 | CFG-006 · ENV=staging แต่ URL ชี้ Production | PASS |
| 10 | CFG-007 · ENV=production แต่ URL ชี้ Staging | PASS |
| 11 | Gate ผ่าน · โหลด runtime 3 ชนิด · ไม่โหลด feature · Build ID Guard รีเฟรช 1 ครั้งแล้วหยุด | PASS |
| 12 | ไม่มีปุ่ม/ลิงก์ข้าม Gate บนหน้าจอ Error (นับได้ 0) | PASS |

## 9.2 Role Test Report — PASS 24 / FAIL 0

| Role | เมนู Sidebar | Route เข้าได้ | Route ถูก redirect | Access Denied | Module ที่ไม่มีสิทธิ์ | Console |
|---|---:|---|---|---|---|---|
| SUPER_ADMIN | 17 ลิงก์ | 28/28 | — | — | — | ไม่มี error |
| ADMIN | 17 ลิงก์ | 27/27 | 1/1 (`#/geofence`) | toast "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" | ไม่โหลด · `compatibility=not_loaded` | ไม่มี error |
| USER | 7 ลิงก์ | 13/13 | 15/15 | toast เดียวกัน | ไม่โหลด · `compatibility=not_loaded` | ไม่มี error |

- เมนูของทุก Role ไม่มีลิงก์ไปหน้าที่ตัวเองไม่มีสิทธิ์แม้แต่ลิงก์เดียว
- **Route ที่ไม่มีสิทธิ์ไม่มีการดาวน์โหลด JS เพิ่มแม้แต่ไฟล์เดียว** — เพราะ Router เรียก `NJHR.modules.load()` หลังผ่าน `canAccess()` แล้วเท่านั้น
- SUPER_ADMIN กับ ADMIN มีเมนู Sidebar ชุดเดียวกัน **ตามการออกแบบเดิม** เพราะ `#/geofence` อยู่ใน `TABSETS` ใต้ `#/settings` ไม่ได้อยู่ใน `MENU_GROUPS` — ความต่างของสิทธิ์พิสูจน์ที่ระดับ Route แล้ว

## 9.3 Session Test Report — PASS 10 / FAIL 0

| Test Case | ผล | หลักฐาน |
|---|---|---|
| ไม่มี Session → หน้า Login | PASS | `hash=#/login shell=false` |
| หน้า Login ไม่โหลด compat/dashboard | PASS | js = `config.js, asset-manifest.js, namespace.js, core.js` |
| Login สำเร็จ → Dashboard | PASS | `hash=#/dashboard` |
| Refresh หลัง Login → Restore Session | PASS | `hash=#/dashboard role=SUPER_ADMIN` |
| Logout → กลับหน้า Login | PASS | `shell=false hash=#/login` |
| Session หมดอายุ → หน้า Login | PASS | `njhr_session_check` คืน null → `shell=false` |
| Session หมดอายุ ไม่โหลด Feature Module | PASS | js = 4 ไฟล์ runtime เท่านั้น |
| Logout ระหว่าง Module กำลังโหลด → ไม่ render view | PASS | `shell=false` · navId + session guard ทำงาน |
| Logout ระหว่างโหลด ไม่มี unhandled error | PASS | console ว่าง |
| Session เปลี่ยนระหว่าง Route กำลังโหลด → ปลอดภัย | PASS | `shell=false` · ไม่มี error |

## 9.4 Dashboard Test Report — PASS 16 / FAIL 0

| Test Case | ผล | หลักฐาน |
|---|---|---|
| เปิดหลัง Login | PASS | `viewHost=4,535 B` |
| โหลดเฉพาะ `dashboard.js` ไม่โหลด compat | PASS | js 5 ไฟล์ ไม่มี `app-legacy.js` |
| Back | PASS | กลับ `#/dashboard` เนื้อหาครบ |
| Forward | PASS | ไป `#/attendance` |
| Refresh บน Route ปัจจุบัน | PASS | `#/attendance` คงเดิม |
| Deep Link `#/dashboard` | PASS | `viewHost=4,540 B` |
| กด Dashboard ซ้ำ | PASS | navId 2→3 · ไม่พัง |
| กดเมนูรัว 6 ครั้ง | PASS | ลงที่ `#/profile` ถูกต้อง |
| กดเมนูรัวแล้วไม่มีจอขาว | PASS | ข้อความบนจอ 458 ตัวอักษร |
| เปลี่ยน Route ระหว่างโหลด → Route เก่าไม่ render ทับ | PASS | จบที่ `#/dashboard` เนื้อหาถูกต้อง |
| Module โหลดไม่สำเร็จ → Error State | PASS | บล็อก `app-legacy.js` จริง → `state=failed` + ปุ่ม "ลองใหม่" |
| Error State ไม่เปิดเผย path / ชื่อไฟล์ / stack | PASS | ข้อความ = "ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่ ลองใหม่" |
| โหลดไม่สำเร็จแล้วไม่เปิด Route ต่อ | PASS | ค้างที่ Error State |
| กด "ลองใหม่" แล้วโหลดสำเร็จ | PASS | `state=loaded` · `viewHost=59,475 B` |
| ไม่มี infinite retry | PASS | loader ไม่มี auto-retry — retry เมื่อผู้ใช้กดเท่านั้น |
| ไม่มี unhandled error ตลอดชุด | PASS | console ว่าง |

## 9.5 Listener Duplication Report — PASS

วิธีวัด: hook `EventTarget.prototype.addEventListener` ตั้งแต่ก่อนสคริปต์แรกทำงาน นับเฉพาะ target = `window` / `document` / `body`
จับค่าฐานหลังอุ่นเครื่อง (เปิด `#/attendance` `#/epayslip` `#/profile` `#/dashboard` ให้ compat โหลดครบแล้ว)
จากนั้นเปิดหน้าซ้ำ 3 รอบ + Back/Forward + Logout/Login ใหม่

| | ก่อนแยก | หลังแยก |
|---|---|---|
| listener ทั้งหมด | `{load:1, hashchange:1, keydown:1, resize:1, afterprint:2}` | `{load:1, hashchange:1, keydown:1, resize:1, afterprint:2}` |
| เพิ่มขึ้นหลังใช้งานหนัก | **0** | **0** |

ตรวจซ้ำครบ 5 viewport (360×740 · 740×360 · 768×1024 · 1440×900 · 1920×1080) — **ค่าเท่ากันทุกช่อง**

| ประเภท | สถานะ |
|---|---|
| Auth Listener | ไม่มี listener ระดับ window — auth ทำงานผ่าน `onsubmit` ของฟอร์มซึ่งตายไปกับ `innerHTML` |
| Hashchange / Popstate | `hashchange` = 1 ผูกครั้งเดียวใน boot |
| Click Delegation | ไม่มี delegation ระดับ document — ทุก handler เป็น `.onclick =` บน element (292 จุด) จึงถูกแทนที่เสมอ ไม่สะสม |
| Resize | 1 |
| Visibility Change | ไม่มีในระบบนี้ (ตรวจแล้วไม่พบ `visibilitychange`) |
| Dashboard Listener | ไม่มี listener ระดับ window — มี `setInterval` ของนาฬิกา ซึ่ง `startLiveClock` `clearInterval` ก่อนตั้งใหม่เสมอ และ `tick()` เคลียร์ตัวเองเมื่อไม่พบ `#live-clock` |
| `afterprint` ×2 | มาจาก `src/11` และ `src/14` — ผูกตอน compat โหลดครั้งแรก **เท่ากับบิลด์เดิมทุกประการ** |

## 9.6 Mobile / Desktop Report — PASS 20 / FAIL 0

| Viewport | ล้นจอจริง | h-scroll | Sidebar | BottomNav | การ์ด Dashboard | Modal | ปุ่ม "ลองใหม่" |
|---|---:|---:|---|---|---:|---|---|
| 360×740 (Mobile Portrait) | 0 | 0 px | มี | มี | 5 | 360 / 360 px | 79×48 px |
| 740×360 (Mobile Landscape) | 0 | 0 px | มี | มี | 5 | 740 / 740 px | 89×48 px |
| 768×1024 (Tablet) | 0 | 0 px | มี | มี | 5 | 768 / 768 px | 89×48 px |
| 1440×900 (Desktop) | 0 | 0 px | มี | — | 5 | 480 / 1440 px | 81×42 px |
| 1920×1080 (Desktop) | 0 | 0 px | มี | — | 5 | 480 / 1920 px | 81×42 px |

- Loading State · Error State · ปุ่ม Retry ตรวจครบทุกความกว้าง ไม่มีตัวใดล้นขอบ
- `.side-brand` และองค์ประกอบในลิ้นชักเมนู 204 ตัวอยู่นอกจอเมื่อลิ้นชักปิด — **นับได้ 206 เท่ากันทั้งก่อนและหลังแยก** จึงเป็นการออกแบบเดิม ไม่ใช่การถดถอย (หลักฐาน: `harness/p2_env_compare.json`)
- Browser ที่ทดสอบ: **Chromium เท่านั้น**

> **NOT TESTED — iPhone Safari (WebKit จริง)**
> สภาพแวดล้อมนี้มีเฉพาะ Chromium ไม่มีอุปกรณ์ iPhone และไม่มี WebKit build
> **ยังไม่ได้ทดสอบบนอุปกรณ์ iPhone Safari จริง** และไม่มีการประมาณผลแทน
> Microsoft Edge ใช้เครื่องยนต์ Chromium เดียวกัน แต่ยังไม่ได้รันบน Edge binary จริงเช่นกัน → **NOT TESTED**

## 9.7 Service Worker Cache Report — PASS 20 / FAIL 0

**Cache Version** `njhr-v2-7c877a0c` = `manifest.buildId` = `config.js NJHR_BUILD_VERSION` (ตรงทั้งสามจุด)

**Precache หลัง install (8 รายการ — อ่านจาก Cache Storage จริง)**

```
/
/index.html
/asset-manifest.js?v=e22c9d20
/runtime/namespace.js?v=91c18dc7
/runtime/core.js?v=bcff66c9
/styles.css?v=7eeecea0
/mobile.css?v=319b5a7a
/assets/nj-logistic-logo.png
```

**Lazy — ไม่อยู่ใน precache**

| Asset | ตอน install | หลังเปิด Dashboard | หลังเปิด `#/employees` |
|---|---|---|---|
| `views/dashboard.js` | ไม่มี | **เข้า cache** | มี |
| `compat/app-legacy.js` | ไม่มี | **ยังไม่มี** | **เข้า cache** |
| `face.js` · `face.css` · `master-salary.js` · `report-template.js` | ไม่มี | ไม่มี | ตามการใช้งานจริง |

| ข้อกำหนด | ผล |
|---|---|
| `config.js` ไม่ถูก cache | PASS — ไม่พบทั้งตอน install และหลังใช้งานจริง (`network-only` + `no-store`) |
| Supabase / API / Signed URL ไม่ถูก cache | PASS — 0 รายการใน cache (SW `return` ทันทีเมื่อ origin ต่าง) |
| ข้อมูลส่วนตัวไม่ถูก cache | PASS — cache มีแต่ static asset 10 รายการ |
| Cache เก่าถูกลบหลัง activate | PASS — ใส่ `njhr-v2-OLDBUILD` แล้ว re-register → หายไป |
| ไม่ลบ cache ของแอปอื่นบน origin เดียวกัน | PASS — `other-app-cache` ยังอยู่ครบ |
| ไม่มี Asset จาก Build เก่าปะปน | PASS — hash ของทุกรายการตรงกับ manifest ปัจจุบัน 10/10 |
| SW ไม่โหลด Lazy Module ทุกตัวตอน install | PASS — install ดึงแค่ 8 core asset |

## 9.8 Compatibility Route Report — PASS 5 / FAIL 0

| Test Case | ผล | หลักฐาน |
|---|---|---|
| เปิดครบทุก Route | PASS | **28/28** แสดงเนื้อหา ไม่มี Error State |
| Bundle โหลดครั้งเดียว | PASS | `app-legacy.js` ถูกร้องขอ **1 ครั้ง** ตลอด 28 route |
| `dashboard.js` โหลดครั้งเดียว | PASS | ร้องขอ **1 ครั้ง** |
| ไม่มี Boot / Router / Store / Dashboard ซ้ำ | PASS | `NJHR.views.list().length = 27` · `moduleState` มี 2 คีย์ · `NJHR.router` ตัวเดียว |
| console ไม่มี error ตลอด 28 route | PASS | ว่าง |

ไฟล์ JS ที่ถูกโหลดตลอดทั้งชุด: `config.js` `asset-manifest.js` `namespace.js` `core.js` `dashboard.js` `app-legacy.js` `master-salary.js`

## 9.9 Regression (DOM เทียบก่อน–หลัง)

`node harness/compare.js rollback/before_runtime_dashboard_split .`
27 Route × 6 มิติ (title · menu · table header · row count · button · text)

```
ตรวจ 162 จุด · ต่าง 0 จุด · REGRESSION PASS
console errors ก่อน=2  หลัง=2   (403 ของ storage probe เท่ากันทั้งสองฝั่ง)
```

รันซ้ำอีกครั้ง **หลังลบ `app.js`** → ผลเดิม **162 จุด · ต่าง 0 จุด · PASS**

## 9.10 Console Error Report

| สถานการณ์ | ก่อนแยก | หลังแยก |
|---|---|---|
| Boot หน้า Login | 403 (storage probe) ×1 | 403 (storage probe) ×1 |
| Login → Dashboard | 403 ×1 | 403 ×1 |
| เปิดครบ 28 route | 2 (403 ทั้งคู่) | 2 (403 ทั้งคู่) |
| Role test 3 role | — | 0 |
| Session test 10 เคส | — | 0 |
| Dashboard test 16 เคส | — | 0 |
| PAGEERROR / Unhandled Rejection | 0 | **0** |

403 มาจาก `**/storage/v1/**` ที่ตัวดักทดสอบตอบกลับ **เกิดเท่ากันทั้งสองบิลด์** จึงไม่ใช่ผลจากการแยก

## 9.11 Network Request Report

| สถานะ | ก่อน | หลัง | ไฟล์ |
|---|---:|---:|---|
| หน้า Login | 5 | 7 | `+asset-manifest.js` `+namespace.js` (`app.js` → `core.js`) |
| หลังเข้า Dashboard | 5 | 8 | `+views/dashboard.js` |
| หลังเข้า Feature เดิม | 5 | 9 | `+compat/app-legacy.js` |
| เข้า Feature เดิมตัวที่ 2 | 5 | **9 (ไม่เพิ่ม)** | ใช้ของเดิม |

RPC ตอน boot คงเดิม 7 ตัว — ไม่มี RPC เพิ่มจากการแยก

---

# 10. รายชื่อไฟล์

## 10.1 ไฟล์ที่แก้ไข

| ไฟล์ | บรรทัดที่ต่าง | สาระ |
|---|---:|---|
| `index.html` | — | Gate PASS โหลด manifest → namespace → core แทน `app.js` · ข้อความ boot-check · placeholder `?v=__BUILD__` |
| `config.js` | 1 | เฉพาะ `NJHR_BUILD_VERSION` (build เขียนให้) |
| `sw.js` | — | `CORE` เป็นรายการที่ build เขียนให้ · `LAZY_PATHS` เพิ่ม `dashboard.js` `app-legacy.js` · matcher เทียบ path เต็ม |
| `build.js` | เขียนใหม่ | Multi-chunk · Scope Injection · Route mapping · 7 ด่านตรวจ · Asset Manifest · Bundle Size Report |
| `netlify.toml` | — | header `/app.js` → `/asset-manifest.js` `/runtime/*` `/views/*` `/compat/*` |
| `package.json` | — | v2.3.0 · สคริปต์ `check` `test:regression` `test:p2` `test:gate` `test:sw` `test:perf` |
| `src/04-router-guards.js` | 111 | `ROUTES` เป็น `view` (string) + `mod` · `render()` รองรับ lazy + navId + Loading/Error/Retry |
| `src/07-view-dashboard.js` | 23 | ตัด `emptyState` `statusBadge` `startLiveClock` `clockTimer` ออก (ย้ายเข้า Core) |
| `src/08-view-employees.js` | 4 | ตัด `empBE` ออก |
| `src/09-view-attendance.js` | 2 | `sbUser` → `NJHR.state.sbUser` (1 จุด) |
| `src/11-view-approvals-payroll.js` | 8 | `_lvPending` → `NJHR.state.lvPending` (4 จุด) |
| `src/12-view-reports-settings.js` | 48 | ตัด `shGet` `shOf` `shTime` `shOfAtt` `shAttToday` `shMigrate` ออก |
| `src/13-view-admin-users.js` | 20 | ตัด `refreshNotifyBadge` + `_ntUnread` ออก · `_ntUnread` → `NJHR.state.ntUnread` (2 จุด) |
| `src/14-view-profile-hrdocs.js` | 2 | `sbUser` → `NJHR.state.sbUser` (1 จุด) |
| `src/15-view-salary-merge-boot.js` | 73 | ย้ายบล็อก INIT/boot ออกไป Core เหลือเฉพาะ `viewSalaryMerge` |

**ไม่ถูกแตะเลย:** `src/01` `src/02` `src/03` `src/05` `src/06-auth-supabase.js` `src/10` `src/css/styles.css` `src/css/mobile.css`
`styles.css` และ `mobile.css` ที่ deploy มี **MD5 เดิมทุกไบต์** (`7eeecea0…` / `319b5a7a…`)

## 10.2 ไฟล์ที่สร้างใหม่

| ไฟล์ | บทบาท |
|---|---|
| `src/06-core-shared-boot.js` | Shared Function ที่ย้ายเข้า Core + Compatibility Adapter + บล็อก INIT/boot |
| `runtime-src/namespace.js` | ต้นฉบับ Runtime Namespace · Store · View Registry · Module Loader · Build ID Guard |
| `asset-manifest.js` | **สร้างอัตโนมัติ** |
| `runtime/namespace.js` | **สร้างอัตโนมัติ** |
| `runtime/core.js` | **สร้างอัตโนมัติ** |
| `views/dashboard.js` | **สร้างอัตโนมัติ** |
| `compat/app-legacy.js` | **สร้างอัตโนมัติ** |
| `BUNDLE_SIZE_REPORT.md` | **สร้างอัตโนมัติทุก build** |
| `RUNTIME_SPLIT_REPORT.md` | เอกสารฉบับนี้ |
| `rollback/before_runtime_dashboard_split/` | สแนปช็อตเต็ม 55 ไฟล์ + `ROLLBACK.md` |
| `harness/p2_suite.js` | ชุดทดสอบ Role · Session · Dashboard · Listener · Responsive · Compat |
| `harness/p2_gate.js` | ชุดทดสอบ Environment Gate CFG-001…007 |
| `harness/p2_sw.js` | ชุดทดสอบ Service Worker Cache |
| `harness/p2_env_compare.js` | เทียบ listener และการล้นจอระหว่างสองบิลด์ |
| `harness/measure.js` | วัด Transfer/Decoded/DCL/FCP/Heap/Long Task |

## 10.3 ไฟล์ที่ลบออกจาก Deploy

| ไฟล์ | เหตุผล | เก็บไว้ที่ |
|---|---|---|
| `app.js` (769,914 B · MD5 `3bc20e7e47f7c324e7b9a3ad590f58b6`) | ถูกแทนด้วย `runtime/core.js` + `views/dashboard.js` + `compat/app-legacy.js` | `rollback/before_runtime_dashboard_split/app.js` (อยู่ใน Source ZIP) |

ลบหลังจากผ่านครบทุกเงื่อนไขของข้อ 9 แล้วเท่านั้น:
Compatibility Route 28/28 · Role 24/24 · Session 10/10 · Listener PASS · Console ไม่มี error · Rollback PASS

---

# 11. วิธี BUILD

```bash
npm install                # ครั้งแรกเท่านั้น (terser 5.49.1 · clean-css 5.3.3)
node build.js              # สร้างไฟล์ deploy ทั้งหมด + เขียน Build ID ให้ sw.js/config.js/index.html
node build.js --check      # เทียบว่าไฟล์ deploy ตรงกับ src/ (ไม่เขียนทับ) — exit 0 = ตรง
node build.js --raw        # ไม่ minify ไว้ debug
npm run check              # build --check + node --check ทุก chunk
```

ผลลัพธ์ที่ได้จาก `node build.js`

```
asset-manifest.js
runtime/namespace.js
runtime/core.js
views/dashboard.js
compat/app-legacy.js
styles.css
mobile.css
BUNDLE_SIZE_REPORT.md
+ เขียน Build ID ลง sw.js · config.js · index.html
```

ข้อบังคับที่ฝังในตัว build และห้ามผ่อน: `mangle: false` · `compress: false` · CSS `level 2: false`

---

# 12. วิธี DEPLOY

อัปโหลดทั้งหมดนี้ไปที่ราก publish ของโดเมนเดิม (โครงสร้างโฟลเดอร์ต้องคงไว้)

```
index.html
config.js                 ← ตรวจค่าให้ตรง Environment ก่อนอัปโหลด
asset-manifest.js
sw.js
netlify.toml
styles.css
mobile.css
runtime/namespace.js
runtime/core.js
views/dashboard.js
compat/app-legacy.js
face.js  face.css  master-salary.js  report-template.js
assets/nj-logistic-logo.png
```

**ลำดับที่ปลอดภัย** — อัปโหลด asset ทุกตัวให้ครบก่อน แล้วค่อยอัปโหลด `index.html` + `asset-manifest.js` เป็นชุดสุดท้าย
เพราะสองไฟล์นี้เป็นตัวชี้ว่า build ปัจจุบันคืออะไร ถ้าขึ้นก่อนจะมีช่วงที่ผู้ใช้ได้ manifest ใหม่แต่ไฟล์ยังเก่า

**`app.js` เดิมบนเซิร์ฟเวอร์** — ลบทิ้งได้หลังยืนยันว่าเวอร์ชันใหม่ทำงานปกติ ระบบใหม่ไม่เรียกไฟล์นี้แล้ว
ถ้ายังไม่มั่นใจ ปล่อยไว้ก่อนได้ ไม่มีผลใด ๆ เพราะไม่มีที่ใดอ้างถึง

---

# 13. วิธี VERIFY หลัง Deploy

```bash
# 1) Build ID ตรงกันทั้งสามจุด
curl -s https://<โดเมน>/asset-manifest.js | grep buildId
curl -s https://<โดเมน>/config.js        | grep NJHR_BUILD_VERSION
curl -s https://<โดเมน>/sw.js            | grep "const V"

# 2) index.html และ config.js ต้องไม่ถูกแคช
curl -sI https://<โดเมน>/          | grep -i cache-control     # คาดหวัง no-store
curl -sI https://<โดเมน>/config.js | grep -i cache-control     # คาดหวัง no-store

# 3) chunk ต้องแคชยาวและถูกบีบอัด
curl -sI -H "Accept-Encoding: br" https://<โดเมน>/runtime/core.js?v=bcff66c9 | grep -i "content-encoding\|cache-control"
curl -sI -H "Accept-Encoding: br" https://<โดเมน>/compat/app-legacy.js?v=7e57920a | grep -i content-encoding

# 4) สคริปต์ตรวจชุดเดิม
bash verify-netlify.sh
```

**ตรวจบนเบราว์เซอร์**

1. เปิด DevTools → Network → ติ๊ก Disable cache → โหลดหน้า Login
   ต้องเห็น JS แค่ 4 ไฟล์: `config.js` `asset-manifest.js` `runtime/namespace.js` `runtime/core.js`
   **ต้องไม่เห็น `app-legacy.js` และ `dashboard.js`**
2. Login → ต้องเห็น `views/dashboard.js` เพิ่มมา 1 ไฟล์ **ยังไม่มี `app-legacy.js`**
3. กดเมนู "พนักงาน" → เพิ่ง เห็น `compat/app-legacy.js` และเห็นครั้งเดียว
4. กดเมนูอื่นต่อ → ไม่มี request JS เพิ่ม
5. Console → ต้องไม่มี error
6. Application → Cache Storage → ต้องมี cache ชื่อ `njhr-v2-<BUILD>` ชื่อเดียว และ **ต้องไม่มี `config.js`**

---

# 14. วิธี ROLLBACK

```bash
# 1) กู้ไฟล์กลับ
cp -r rollback/before_runtime_dashboard_split/* <โฟลเดอร์โปรเจกต์>/

# 2) ยืนยันว่าตรงกับต้นฉบับเดิม
md5sum app.js index.html sw.js config.js styles.css mobile.css
#   app.js      3bc20e7e47f7c324e7b9a3ad590f58b6
#   index.html  70d4f427176b67a8c3796e18dc8ae33b
#   sw.js       3a356afd19bf3ffb68709472be3747cf
#   config.js   a90777298ecf73b7aa3a9793a27a9be4
#   styles.css  7eeecea05a69adcec9ad8186d0076963
#   mobile.css  319b5a7affb218b933f76d1b7e449d91

# 3) ยืนยันว่า build เดิมสร้างซ้ำได้
node build.js --check       # คาดหวัง: ตรงกัน  ไฟล์ deploy = src/  (build 2468079b)

# 4) ลบโฟลเดอร์ของเวอร์ชันใหม่ออกจากเซิร์ฟเวอร์
rm -rf runtime/ views/ compat/ asset-manifest.js

# 5) อัปโหลดทับโดเมนเดิม แล้วโหลดหน้าเว็บ 1 ครั้ง
#    sw.js เวอร์ชันเก่าจะ activate และลบ cache ของ build ใหม่ให้เอง
#    (เงื่อนไข: ลบเฉพาะ key ที่ขึ้นต้น 'njhr-v2-' และไม่ตรง V ปัจจุบัน)
```

**ผลทดสอบ Rollback จริง** — กู้ลงโฟลเดอร์เปล่า → MD5 ตรงทุกไฟล์ → `node build.js --check` = `ตรงกัน (build 2468079b)` → boot สำเร็จทั้ง `http://` และ `file://` ไม่มี console error

---

# 15. เกณฑ์ผ่าน Prompt 2

| # | เกณฑ์ | ผล | หลักฐาน |
|---|---|---|---|
| 1 | `app.js` ก้อนเดิมไม่โหลดตอนเปิดเว็บไซต์ | PASS | ลบออกจาก deploy แล้ว · request หน้า Login มี 4 JS |
| 2 | Environment Safety Gate เดิมยังทำงาน | PASS | CFG-001…007 ครบ 12/12 |
| 3 | Login ทำงาน | PASS | Session Test |
| 4 | Restore Session ทำงาน | PASS | Refresh หลัง Login → Dashboard |
| 5 | Logout ทำงาน | PASS | กลับหน้า Login |
| 6 | Router ทำงาน | PASS | 28/28 route |
| 7 | Route Guard ทำงาน | PASS | Role Test 24/24 |
| 8 | Layout เดิมไม่เปลี่ยน | PASS | Regression 162/162 · CSS MD5 เดิม |
| 9 | Dashboard ถูกแยกเป็น Module | PASS | `views/dashboard.js` 16,560 B |
| 10 | Dashboard ไม่โหลด Compatibility Bundle | PASS | `moduleState.compatibility = not_loaded` |
| 11 | Feature อื่นโหลด Compat เมื่อเปิดครั้งแรก | PASS | วัดจาก Network |
| 12 | Compat โหลดเพียงครั้งเดียว | PASS | 1 request ตลอด 28 route |
| 13 | ไม่มี Boot ซ้ำ | PASS | `njhrBooted` guard · INIT อยู่ Core ที่เดียว |
| 14 | ไม่มี Auth Listener ซ้ำ | PASS | Listener Report |
| 15 | ไม่มี Router ซ้ำ | PASS | `DUPLICATE_ROUTER` guard ใน namespace |
| 16 | ไม่มี Store ซ้ำ | PASS | `DUPLICATE_STORE` guard |
| 17 | ไม่มี Dashboard ซ้ำ | PASS | `views.register` โยน error ถ้าชื่อซ้ำ · registry 27 ตัว |
| 18 | ไม่มี Event Listener ซ้ำ | PASS | เท่าบิลด์เดิมทุกช่อง 5 viewport |
| 19 | ไม่มี Function หาย | PASS | ด่านตรวจ 6 ใน build + Regression 162/162 |
| 20 | ไม่มี Global ชน | PASS | ด่านตรวจ 2 · `NJHR` ตรวจแล้วไม่ชนของเดิม |
| 21 | ไม่มีจอขาว | PASS | ทุกเคสรวมกดเมนูรัว |
| 22 | ไม่มี Unhandled Error | PASS | PAGEERROR = 0 ทุกชุด |
| 23 | Back/Forward ทำงาน | PASS | Dashboard Test |
| 24 | Refresh Route ทำงาน | PASS | Deep Link + Refresh |
| 25 | Role และ Permission เดิมครบ | PASS | 3 role ครบ |
| 26 | SQL ไม่ถูกแก้ | PASS | ไม่แตะ `supabase/` `supabase-new/` `edge-functions/` เลย |
| 27 | สูตรไม่ถูกแก้ | PASS | ไม่มีการแตะฟังก์ชันคำนวณใด · Regression 162/162 |
| 28 | UI ไม่ถูกแก้ | PASS | CSS MD5 เดิม · Regression 162/162 (รวม text/button/header) |
| 29 | SW ไม่ Precache Compatibility Bundle | PASS | อ่านจาก Cache Storage จริง |
| 30 | Rollback ใช้งานได้ | PASS | กู้จริง + build --check + boot |
| 31 | มีตัวเลข Performance ก่อนและหลังจริง | PASS | §8 |

---

# 16. สรุปสุดท้าย

| หัวข้อ | ก่อนแก้ | หลังแก้ | สถานะ |
|---|---|---|---|
| Initial JS หน้า Login (transfer) | 188,979 B | **25,979 B** | PASS · −86.3 % |
| Initial JS หน้า Login (decoded/raw) | 775,292 B | **83,490 B** | PASS · −89.2 % |
| JS หลัง Dashboard (transfer) | 188,979 B | **31,208 B** | PASS · −83.5 % |
| JS Parse/Compile หน้า Login | 13.62 ms | **1.76 ms** | PASS · −87.1 % |
| JS Heap หน้า Login | 2.9 MB | **1.6 MB** | PASS · −45 % |
| Request Count (Login / Dashboard / Feature) | 5 / 5 / 5 | 7 / 8 / 9 | PASS · แลกกับขนาดที่ลดลง |
| Dashboard Load | อยู่ในก้อน 769 KB | **16,560 B แยกอิสระ** | PASS |
| Compatibility Bundle | — | โหลดเมื่อเปิด Feature เดิม · **1 ครั้ง** | PASS |
| Console Error | 2 (403 storage) | 2 (403 storage) | PASS · ไม่เพิ่ม |
| SQL Changed | — | **ไม่มี** | PASS |
| UI Changed | — | **ไม่มี** (CSS MD5 เดิม · Regression 162/162) | PASS |
| Rollback | — | ทดสอบกู้จริงสำเร็จ | PASS |
| Desktop Test | — | Chromium 1440×900 · 1920×1080 | PASS |
| Mobile Test | — | Chromium 360×740 · 740×360 · 768×1024 | PASS |
| iPhone Safari (WebKit จริง) | — | — | **NOT TESTED** |
| Microsoft Edge (binary จริง) | — | — | **NOT TESTED** |
| Regression DOM 27 route × 6 มิติ | — | **162 จุด · ต่าง 0 จุด** | PASS |
| รวมผลทดสอบ | — | **PASS 111 · FAIL 0 · NOT TESTED 2** | PASS |

---

# 17. สิ่งที่ยังไม่ได้ทำและข้อจำกัด (ระบุตรง ๆ)

1. **ยังไม่ได้ทดสอบบนอุปกรณ์ iPhone Safari จริง** — ไม่มี WebKit ในสภาพแวดล้อมนี้ ผลทั้งหมดมาจาก Chromium และ Responsive Emulation
2. **ยังไม่ได้ทดสอบบน Microsoft Edge binary จริง** — Edge ใช้เครื่องยนต์ Chromium เดียวกันแต่ไม่ได้รันจริง
3. **ตัวเลขเวลา (DCL/FCP/Load) วัดบน `127.0.0.1`** ความหน่วงเครือข่ายเกือบศูนย์ ผลบนเน็ตมือถือจริงยังไม่ได้วัด
4. **ยังไม่ได้ยืนยัน Brotli บนโดเมนจริง** — ต้องรัน `verify-netlify.sh` หลัง deploy
5. **ยังไม่ได้ทดสอบกับข้อมูล Production จริง 111 บัญชี** — ทุกการทดสอบใช้ fixture
6. **Feature อื่นยังไม่ถูกแยก** ตามขอบเขต Prompt 2 — ทั้งหมดยังอยู่ใน `compat/app-legacy.js` (165 KB gzip) รอ Prompt 3

**หยุดที่นี่ตามคำสั่ง — ไม่เริ่ม Prompt 3 และไม่แยก Feature เพิ่ม**
