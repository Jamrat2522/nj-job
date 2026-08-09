# P3_FEATURE_DEPENDENCY_MAP — Employees · Attendance · Leave · OT

**สถานะ Prompt 2** ปิดสมบูรณ์ · build `njhr-v2-7c877a0c` · `node build.js --check` = ตรงกัน
**ZIP MD5** อยู่ใน `ZIP_MD5.txt` (ของตัวไฟล์ ZIP ไม่ใช่ของไฟล์ภายใน)

| ZIP | ไบต์ | MD5 |
|---|---:|---|
| `hr-v2-deploy.zip` | 322,688 | `dc6270d62bd125afee050fac581d3644` |
| `hr-v2-source.zip` | 3,612,694 | `31b9c5485a8b154df073f29d67842d1d` |

**Rollback ก่อน Prompt 3** สร้างแล้วที่ `rollback/before_feature_split_p3/` (72 ไฟล์ · 6.3 MB) รวม ZIP ทั้งสองของ Prompt 2

> เอกสารนี้คือ **ขั้นตอนที่ 2 ของ Prompt 3** ซึ่ง Prompt กำหนดไว้เองว่า
> **"ห้ามย้าย Function จนกว่า Dependency Map จะครบ"**
> ทุกตัวเลขและทุกเส้นการอ้างอิงในเอกสารนี้มาจากการวิเคราะห์ AST/สัญลักษณ์บนโค้ดจริงด้วย `harness/p3_analyze.js`
> ยังไม่มีการย้ายหรือแก้โค้ดใด ๆ ในรอบนี้

---

# 1. วิธีวิเคราะห์

`harness/p3_analyze.js` อ่าน `src/*.js` แล้ว

1. แยกสัญลักษณ์ระดับ closure ทุกตัว (`^  function NAME(` และ `^  var …`) พร้อมขอบเขตไบต์ของแต่ละตัว
2. ตัดคอมเมนต์ออกก่อนวิเคราะห์ เพื่อไม่ให้ข้อความในคอมเมนต์ทำให้ตรวจผิด
3. สร้างกราฟการอ้างอิงด้วย word-boundary regex ที่กัน `.prop` และกัน `data-xxx=` ในสตริง HTML
4. ปิด transitive closure จาก seed ของแต่ละ Feature แล้วหาตัวที่อยู่มากกว่า 1 กลุ่ม = ต้องเป็น Shared

**ข้อจำกัดที่ต้องบอกตรง ๆ** — เป็นการวิเคราะห์เชิงข้อความ ไม่ใช่ AST scope analysis เต็มรูปแบบ
จึงอาจรายงานเกินจริงได้ในกรณีที่ชื่อซ้ำกับตัวแปรภายในฟังก์ชัน แต่**ไม่มีทางรายงานขาด** ซึ่งเป็นทิศทางที่ปลอดภัยต่อการแยกไฟล์

---

# 2. ขนาดต้นทางปัจจุบัน

| ไฟล์ | สัญลักษณ์ | ไบต์ |
|---|---:|---:|
| `08-view-employees.js` | 52 | 76,645 |
| `09-view-attendance.js` | 19 | 21,348 |
| `10-view-requests-leave-ot.js` | 55 | 62,633 |
| `12-view-reports-settings.js` (เฉพาะกลุ่ม `rpt*`/`viewReports`) | 50 | 43,073 |
| `11-view-approvals-payroll.js` | 66 | 87,133 |
| `13-view-admin-users.js` | 46 | 67,784 |
| `14-view-profile-hrdocs.js` | 150 | 170,681 |
| `15-view-salary-merge-boot.js` | 1 | 9,998 |

`compat/app-legacy.js` ปัจจุบัน = **690,516 B raw / 165,051 B gzip**

---

# 3. Route · View · Permission ของ Feature ที่จะแยก

ตรวจจาก `ROUTES` ตัวจริงใน `src/04-router-guards.js`

| Route | View Function | โมดูลต้นทาง | Roles | หมายเหตุ |
|---|---|---|---|---|
| `#/employees` | `viewEmployees` | 08 | SUPER_ADMIN, ADMIN | |
| `#/attendance` | `viewAttendance` | 09 | ALL | |
| `#/requests` | `viewRequests` | 10 | ALL | หน้ารวมคำขอ |
| `#/req-history` | `viewReqHistory` | 10 | ALL | ประวัติลา + OT รวมกัน |
| `#/leave` | `viewLeave` | 10 | ALL | |
| `#/ot` | `viewOT` | 10 | ALL | |
| `#/reports` | `viewReports` | 12 | SUPER_ADMIN, ADMIN | **"รายงานการลงเวลา"** = Attendance Report |

**ข้อเท็จจริงที่ต่างจากที่ Prompt สมมติไว้ — ต้องบันทึกไว้**

1. **ไม่มี Route แยกสำหรับ Employee Form / Import / Export / Documents**
   ทั้งหมดเป็น Modal ที่เปิดจากภายในหน้า `#/employees` ไม่มี hash ของตัวเอง
   จึงต้องแยกด้วย **Action-triggered module load** ไม่ใช่ Route-to-Module
2. **Attendance Report ไม่ได้อยู่ในโมดูล 09** แต่อยู่ใน `12-view-reports-settings.js` (`viewReports` + กลุ่ม `rpt*`)
3. **ไม่มีหน้า Attendance Correction แยก** — มีฟังก์ชัน `correctionForm()` ใน `09` เป็น Modal ภายในหน้าลงเวลา
4. **Leave Detail และ OT Detail ไม่มี Route แยก** — เป็น Modal (`rhDetail`, `lvShowTimeline`, `showTimeline`) และหน้า `#/req-history` เป็นหน้าประวัติรวมของทั้งลาและ OT
5. **Leave Attachments / OT Attachments ไม่ใช่โมดูลแยก** — เป็นฟังก์ชันในฟอร์ม (`lvFileKind`, `lvFileSize`, `otFileKind`, `otFileSize`, `otBindJobFiles`) และอัปโหลดผ่าน `sbUploadLeaveFile` / `sbUploadOtFile` ซึ่งอยู่ใน **Runtime Core** (`06-auth-supabase.js`) แล้ว

ตามข้อ "ห้ามยึดชื่อใน Prompt นี้หากโครงสร้างจริงต่างออกไป" — โครงสร้าง chunk จะอิงข้อเท็จจริงข้างต้น

---

# 4. Supabase Dependency (ไม่แตะ · บันทึกไว้เพื่อยืนยันว่าไม่เปลี่ยน)

| Feature | RPC | Storage Bucket | Upload Function |
|---|---|---|---|
| **Employees** (08) | `njhr_emp_list` `njhr_emp_get` `njhr_emp_save` `njhr_emp_status` `njhr_emp_import` `njhr_emp_departments` `njhr_empfile_list` `njhr_empfile_save` `njhr_empfile_delete` `njhr_face_status` `njhr_face_delete` `njhr_sso_emp_save` | `njhr-emp-file` (Edge Function) · `njhr-emp-files` | ผ่าน Edge Function `njhr-emp-file` |
| **Attendance** (09) | `njhr_att_today` `njhr_att_report` `njhr_att_migrate` `njhr_gf_check` | — | — |
| **Leave + OT** (10) | `njhr_leave_list` `njhr_leave_detail` `njhr_leave_submit` `njhr_leave_cancel` `njhr_leave_balances` `njhr_ot_list` `njhr_ot_get` `njhr_ot_attach_add` `njhr_ot_attach_delete` | ผ่าน `sbUploadLeaveFile` / `sbUploadOtFile` ใน Core | `sbUploadLeaveFile` `sbUploadOtFile` (อยู่ใน Core แล้ว) |
| **Attendance Report** (12 `rpt*`) | `njhr_att_report` `njhr_leave_report` `njhr_leave_balance_report` `njhr_ot_list` `njhr_emp_list` `njhr_emp_departments` `njhr_dept_list` | — | — |

**ไลบรารีภายนอกที่โหลดแบบ lazy อยู่แล้ว (ไม่ต้องแก้)**
`08:593` `loadScriptOnce('xlsx', …)` · `08:908` `loadScriptOnce('face', …)` · `09:337` `loadScriptOnce('face', …)`
→ ข้อกำหนด "ห้ามโหลด Library สำหรับ Excel ตั้งแต่เปิดหน้าพนักงาน" **เป็นจริงอยู่แล้วตั้งแต่ก่อน Prompt 3**

**Modal ที่ใช้** — Employees 11 จุด · Attendance 1 จุด · Leave+OT 5 จุด (ทั้งหมดผ่าน `openModal`/`closeModal` ของ Core)

---

# 5. เส้นการอ้างอิงข้ามไฟล์ทั้งหมด (วัดได้ · ครบถ้วน)

## 5.1 ขาออก — Feature อ้างของนอกตัวเอง

| จาก | สัญลักษณ์ | อยู่ที่ | ถูกเรียกโดย |
|---|---|---|---|
| 08 | `docStat` `docState` `docTypeLabel` | 14 (HR Docs) | `empfRender` |
| 08 | `rptBuildXlsx` `rptLoadZip` | 12 | `empTemplate` `empExport` |
| 08 | `rptSafeName` | 12 | `empExport` |
| 08 | `viewSSO` | 12 | `ssoEditModal` |
| 09 | `rptDateBE` | 12 | `attExportCsv` `attLoad` |
| 10 | `RQ_CARDS` `rqPick` `rqState` | 09 | `viewRequests` `rqRenderBal` |
| 10 | `docTS` | 14 | `rhTimeline` |
| 10 | `epNum` | 11 | `otJobsOf` |

## 5.2 ขาเข้า — ส่วนที่เหลือใน compat อ้างของ Feature

| สัญลักษณ์ | อยู่ที่ | ขนาด | ถูกเรียกโดย |
|---|---|---:|---|
| `EMP_STATUS_MAP` | 08 | 114 B | `shUnassignedHtml` (12) · `dpEmps` (13) |
| `ssoEditModal` | 08 | 3,396 B | `ssoRender` (12) |
| `apprTab` | 10 | 25 B | `viewApprovals` `apprRender` `approvalCard` `doApprove` (11) |
| `_lvQueue` | 10 | 152 B | `viewApprovals` `apprRender` `lvDecide` (11) |
| `lvCode` | 10 | 85 B | `leaveApprovalCard` `lvDecide` (11) · `rptLeaveCells` (12) |
| `lvShowTimeline` | 10 | 2,053 B | `apprRender` (11) |
| `showTimeline` | 10 | 1,428 B | `apprRender` (11) |
| `otJobsHTML` | 10 | 2,456 B | `approvalCard` (11) |
| `otJobsOf` | 10 | 382 B | `approvalCard` `viewPayroll` (11) · `rptOtRows` (12) |
| `otJobHours` | 10 | 119 B | `viewPayroll` (11) · `rptOtRows` (12) |
| `otJobEndDate` | 10 | 176 B | `rptOtRows` (12) |

## 5.3 ข้อค้นพบสำคัญ 3 ข้อ

1. **`ssoEditModal` ไม่ถูกเรียกจากที่ใดใน 08 เลย** — ถูกเรียกจาก `ssoRender` (12) เท่านั้น
   → ย้ายไปอยู่กับ `viewSSO` ในโมดูล 12 ได้ทันที **ตัดเส้น 08→12 และ 12→08 ออกพร้อมกัน**
2. **`docState` เป็น object literal ที่ไม่เคยถูกกำหนดค่าใหม่** (มีแต่ `docState.x = …` 30 กว่าจุด)
   → แชร์แบบส่ง reference ได้ปลอดภัย ไม่ต้องใช้ accessor แบบ `NJHR.state`
3. **Leave กับ OT แยกจากกันได้** — มีเส้นข้ามกลุ่มเพียง **1 เส้น** คือ `viewOT → bindReqCardActions`

---

# 6. การจัดกลุ่ม Dependency

## 6.1 Core Runtime (มีอยู่แล้ว · ไม่แตะ)

`runtime/core.js` — Utils · Store · UI · Router · Layout · Auth/Supabase · Shared จาก Prompt 2
Feature ทั้งสี่กลุ่มรับผ่าน `NJHR.compat.scope` เหมือน chunk อื่นทุกประการ
รวมถึง `sbUploadLeaveFile` · `sbUploadOtFile` · `shOf` · `shTime` · `shOfAtt` · `shAttToday` · `empBE` · `emptyState` · `statusBadge`

## 6.2 Shared Feature Runtime (สร้างใหม่ · โหลดเป็น dependency เท่านั้น)

| Shared Module | สัญลักษณ์ | ไบต์ | ใช้โดย |
|---|---|---:|---|
| `runtime/shared/requests.js` | `rqState` `RQ_CARDS` `rqPick` (จาก 09) · `lvCode` `showTimeline` `lvShowTimeline` `otJobsHTML` `otJobsOf` `otJobHours` `otJobEndDate` `otMin` `otDayIdx` `otNextDay` `otSpan` `apprTab` `_lvQueue` `bindReqCardActions` (จาก 10) · `epNum` (จาก 11) | ~9,000 | leave · ot · attendance-report · compatibility |
| `runtime/shared/xlsx-export.js` | `rptXmlEsc` `rptSafeName` `rptColLetter` `rptSheetXml` `rptBuildXlsx` `rptLoadZip` `rptDateBE` (จาก 12) | 7,242 | employees · attendance · attendance-report · compatibility |
| `runtime/shared/hr-meta.js` | `DOC_TYPES` `DOC_STATUS` `docState` `docStat` `docTypeDef` `docTypeLabel` `docTS` (จาก 14) | 2,510 | employees · leave · compatibility |
| `runtime/shared/emp-meta.js` | `EMP_STATUS` `EMP_STATUS_MAP` (จาก 08) | 238 | employees · attendance-report · compatibility |

**รวม Shared ≈ 19 KB (ก่อน minify)** — ไม่มีตัวใดเข้าไปอยู่ใน Core จึงไม่ทำให้หน้า Login/Dashboard ใหญ่ขึ้นแม้แต่ไบต์เดียว
Shared ทุกตัวประกาศเป็น `deps` ของ Feature Module ที่ต้องใช้ · โหลดครั้งเดียว · ไม่ Copy ซ้ำ

## 6.3 Feature Chunk ที่จะสร้าง

| Chunk | ที่มา | สัญลักษณ์ | ไบต์ (src) | deps |
|---|---|---:|---:|---|
| `employees` | 08 (หัก sso trio + EMP_STATUS*) | 47 | 70,872 | `shared/xlsx-export` `shared/hr-meta` `shared/emp-meta` |
| `attendance` | 09 (หัก rq*) | 16 | 20,568 | `shared/xlsx-export` |
| `leave` | 10 ส่วนลา | 29 | 32,528 | `shared/requests` `shared/hr-meta` |
| `ot` | 10 ส่วน OT | 13 | 22,290 | `shared/requests` |
| `attendance-report` | 12 กลุ่ม `rpt*` + `viewReports` | 43 | 35,831 | `shared/xlsx-export` `shared/requests` `shared/emp-meta` |
| `compatibility` | ที่เหลือ | 438 → ลดลง | ~578,000 | `shared/*` ตามที่ใช้จริง |

**ประมาณการการลดของ Compatibility Bundle**
690,516 B raw ปัจจุบัน − (70,872 + 20,568 + 32,528 + 22,290 + 35,831) ที่ย้ายออก ≈ **ลดลงราว 182,000 B ก่อน minify**
ตัวเลขจริงหลัง minify/gzip ต้องวัดหลัง build — **ยังไม่ได้วัด ห้ามถือเป็นผลลัพธ์**

## 6.4 Compatibility Only (ยังอยู่ใน `compat/app-legacy.js`)

Approvals · Approval Workflow · Payroll · E-Payslip · REPORT ALL · Calendar · SSO · Shift Editor · Geofence Editor
Pay Items · Pay Entry · Users · Departments · System Settings · Audit · Notifications · Announcements
Profile · HR Documents · Rich Text Editor · Salary Merge

---

# 7. อุปสรรคที่ต้องตัดสินใจก่อนย้ายโค้ด

| # | ประเด็น | ข้อเท็จจริง | ทางเลือก |
|---|---|---|---|
| 1 | `docStat` `docState` `docTypeLabel` `docTypeDef` `DOC_TYPES` `DOC_STATUS` `docTS` อยู่ในโมดูล 14 (HR Documents) ซึ่ง **Prompt 3 สั่งห้ามแตะ** | เป็นการ **ย้ายตำแหน่ง** ไม่ใช่แก้ตรรกะ · `docState` ไม่เคยถูก reassign จึงแชร์ได้ปลอดภัย · รวม 2,510 B | (ก) ย้ายไป `shared/hr-meta.js` — ต้องแตะ `src/14` เชิงโครงสร้าง · (ข) ไม่ย้าย แล้วให้ `employees` และ `leave` ประกาศ `deps: ['compatibility']` ซึ่ง**ทำให้การแยกไร้ความหมาย** |
| 2 | `ssoEditModal` `ssoBindForm` `ssoFormPayload` (5,535 B) อยู่ใน 08 แต่เป็นของฟีเจอร์ประกันสังคม ซึ่ง Prompt 3 สั่งห้ามแตะ | ไม่มีที่ใดใน 08 เรียกใช้เลย · เรียกจาก `ssoRender` (12) เท่านั้น | ย้ายเข้า `compat` ข้าง `viewSSO` — ตัดเส้นพันกันสองทางออกได้หมด **ผมแนะนำทางนี้** |
| 3 | Attendance Report อยู่ในโมดูล 12 ปนกับ Shift/Geofence/Workflow/Pay Items ซึ่งห้ามแตะ | แยกได้จริง เหลืออ้างออกนอกกลุ่มแค่ 4 ค่าคงที่ (`LV_STATUS_TH` `OT_STATUS_TH` `EMP_STATUS_TH` `EMP_ATT_STATUS`) และ compat เรียกกลับเข้ามาแค่ `rptNorm` (จาก `viewReportAll`) | ย้าย 4 ค่าคงที่ + `rptNorm` เข้า `shared` |
| 4 | Employee Form / Import / Export / Documents **ไม่มี Route แยก** | ต้องเปลี่ยนปุ่มเป็น "โหลด module แล้วค่อยเปิด Modal" ซึ่งเป็นการแก้ handler ในหน้าพนักงาน (ประมาณ 4 จุด) | ต้องได้รับอนุมัติเพราะแตะ handler ของ UI เดิม (พฤติกรรมบนจอเหมือนเดิม แต่มีสถานะ Loading เพิ่มระหว่างโหลดครั้งแรก) |
| 5 | ภายในโมดูล 08 ฟังก์ชัน import/export เรียก `empLoad` กลับเพื่อรีเฟรชรายการ | ปิด transitive closure แล้วพบว่า `empImportForm` ลากเอา `viewEmployees` มาทั้งชุด | แยกเป็น sub-module ที่ประกาศ `deps: ['employees']` — โหลด employees ก่อนเสมอ ซึ่งเป็นจริงอยู่แล้วเพราะผู้ใช้ต้องเปิดหน้าพนักงานก่อนจึงจะกดปุ่มได้ |

---

# 8. สิ่งที่ทำไปแล้วในรอบนี้

| งาน | สถานะ |
|---|---|
| ตรวจว่า Prompt 2 ปิดสมบูรณ์ (`build.js --check` ผ่าน · รายงาน + ZIP ครบ) | เสร็จ |
| สร้าง `ZIP_MD5.txt` (MD5 ของตัว ZIP ไม่ใช่ของไฟล์ภายใน) | เสร็จ |
| สร้าง `rollback/before_feature_split_p3/` — 72 ไฟล์ 6.3 MB รวม `src/` `runtime/` `views/` `compat/` `harness/` รายงาน Prompt 2 และ ZIP ทั้งสอง | เสร็จ |
| สร้าง `harness/p3_analyze.js` เครื่องมือวิเคราะห์การอ้างอิงระดับสัญลักษณ์ | เสร็จ |
| `P3_FEATURE_DEPENDENCY_MAP.md` (เอกสารนี้) | เสร็จ |
| ย้ายโค้ด / สร้าง Feature Chunk / แก้ build / แก้ sw / ทดสอบ / รายงาน 14 ฉบับ / ZIP | **ยังไม่ได้ทำ** |

**ยังไม่มีไฟล์ใดใน `src/` `runtime/` `views/` `compat/` ถูกแก้ในรอบนี้** — `node build.js --check` ยังคืน `ตรงกัน (build 7c877a0c)`
