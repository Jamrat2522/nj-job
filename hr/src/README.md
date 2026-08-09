# src/ — Source Modules ของ HR V2

## ทำไมต้องมี build step

`app.js` เป็น **IIFE ก้อนเดียว** `(function () { ... })();` มีตัวแปรระดับ closure 159 ตัว
และฟังก์ชัน 740 ตัวที่เรียกหากันได้อิสระภายใน scope เดียวกัน

JavaScript closure **ข้าม `<script>` tag ไม่ได้** และระบบต้องเปิดผ่าน `file://` ได้
(ES Modules ใช้กับ `file://` ไม่ได้เพราะติด CORS) จึงแยกเป็นหลายไฟล์ตอน runtime ไม่ได้

ทางออก: แยก **source** เป็น 15 โมดูลเพื่อการดูแลรักษา แล้ว **concat กลับเป็น `app.js`** ตอน deploy
ผลลัพธ์ byte-identical กับเดิม ไม่มีอะไรเปลี่ยนในเบราว์เซอร์

## วิธีใช้

```bash
node build.js            # รวม src/*.js → app.js
node build.js --check    # ตรวจว่า app.js ตรงกับ src/ (exit 1 ถ้าไม่ตรง)
```

**แก้โค้ดที่ `src/` เท่านั้น** แล้วรัน `node build.js` ก่อนอัปโหลด
ห้ามแก้ `app.js` ตรง ๆ เพราะจะถูกเขียนทับในการ build ครั้งถัดไป

## ลำดับการรวมไฟล์

รวมตามลำดับเลขนำหน้า (`01-` → `15-`) ห้ามสลับลำดับ เพราะ `01` เปิด IIFE และ `15` ปิด

| ไฟล์ | เนื้อหา | บรรทัดเดิมใน app.js |
|------|---------|---------------------|
| `01-core-icons-utils.js` | banner, เปิด IIFE, ไอคอน SVG, utils, วันหยุด | 1–170 |
| `02-store.js` | STORE — `DB_KEY`/`SES_KEY`/`UI_KEY`, `loadDB`, `saveDB`, `currentUser`, `audit` | 171–360 |
| `03-ui-toast-modal.js` | `toast`, `openModal`, `closeModal`, `confirmDialog` | 361–407 |
| `04-router-guards.js` | `ROUTES` 28 เส้นทาง, `canAccess`, router | 408–475 |
| `05-layout-shell.js` | `MENU_GROUPS`, `TABSETS`, `bottomNavItems`, `renderShell`, accordion | 476–787 |
| `06-auth-supabase.js` | `SB`, `sbRpc`, `sbRpcList`, `njhr_login`, session, leave data layer, upload | 788–1024 |
| `07-view-dashboard.js` | `viewDashboard`, `dashAdmin`, `dashEmployee`, feed มือถือ | 1025–1344 |
| `08-view-employees.js` | `viewEmployees`, ฟอร์ม, ประกันสังคม, import, export, แฟ้มเอกสาร | 1345–2642 |
| `09-view-attendance.js` | `viewAttendance` | 2643–3082 |
| `10-view-requests-leave-ot.js` | `viewRequests`, `viewReqHistory`, `viewLeave`, `viewOT` | 3083–4207 |
| `11-view-approvals-payroll.js` | `viewApprovals`, `viewPayroll`, `viewEPayslip` | 4208–5609 |
| `12-view-reports-settings.js` | `viewReportAll`, `viewShifts`, `viewGeofence`, `viewApprovalSettings`, `viewPayItems`, `viewSSO`, `viewReports`, `viewCalendar` | 5610–10907 |
| `13-view-admin-users.js` | `viewAnnouncements`, `viewUsers`, `viewDepartments`, `viewSettings`, `viewAudit`, `viewNotifications` | 10908–12009 |
| `14-view-profile-hrdocs.js` | `dRow`, `viewProfile`, `viewHrDocs` | 12010–15136 |
| `15-view-salary-merge-boot.js` | `viewSalaryMerge`, bootstrap, ปิด IIFE | 15137–15322 |

## ข้อควรระวัง

- โมดูลเหล่านี้ **ไม่ใช่ ES Module** ไม่มี `import` / `export` — เป็นการแบ่งไฟล์เชิงข้อความล้วน
- ห้ามใส่ `'use strict'` หรือ IIFE ซ้อนในไฟล์ย่อย จะทำให้ scope แตก
- ย้ายฟังก์ชันข้ามไฟล์ได้ แต่ต้องอยู่ในลำดับที่ถูกเรียกใช้หลังประกาศแล้ว
- หลังแก้ทุกครั้ง: `node build.js && node --check app.js` แล้วรัน `harness/compare.js`
