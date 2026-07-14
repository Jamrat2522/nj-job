# PERF2 — Realtime row-level patch + render เฉพาะหน้าปัจจุบัน
> โคลนจาก MASSENGER_V3_PERFORMANCE_SAFE (เก็บ rollback ไม่แตะ)
> แก้ js/app.js อย่างเดียว · หยุดแยกโมดูลเพิ่ม · ไม่แตะ UI/สิทธิ์/Supabase/subscription/search/export/heavy-users.js

## ข้อ 1 — Render เฉพาะหน้าปัจจุบัน
**ตรวจแล้วว่าทำถูกอยู่ก่อนหน้า** (ไม่ต้องแก้):
- jobs: `filteredJobs()` (filter/search จากทั้งหมด) → `_jobsPaged.slice(start,end)` → `diffJobsTbody` (สร้าง DOM เฉพาะ pageRows · ไม่ซ่อนด้วย CSS)
- doc: `_docComputeRows()` filter ทั้งหมด → `list.slice(start,start+DOC.pageSize)` → row-level diff
- ใช้ PK จริง: `data-job-id="${j.id}"`, `data-doc-id="${d.id}"` (ไม่ใช้ index/เลข JOB ตัดสั้น)
- Pagination / total / Badge / KPI คำนวณจากชุดเต็ม → ไม่เปลี่ยน

## ข้อ 2 — Realtime patch เฉพาะรายการ (แก้จริงรอบนี้)
### JOBS — `_scheduleJobsReload` เขียนใหม่ (เลิกเรียก renderView ทุกอัปเดต)
เดิม: ทุก INSERT/UPDATE/DELETE → patch state แล้วเรียก `_scheduleLightRender()` → **`renderSidebar();renderView()` (render ทั้ง view)**
ใหม่:
- **UPDATE + สถานะเดิม** → `updateSidebarCounts()` + `_rtPatchOneJobRow(id)` = แก้ **1 แถว** (`tr.outerHTML=jobRowFull(j)`) · ไม่เรียก renderView
- **UPDATE + สถานะเปลี่ยน** (อาจย้าย/หายจาก view) → `updateSidebarCounts()` + `refreshCurrentPage("job status X->Y")` (log เหตุผล)
- **INSERT** → `updateSidebarCounts()` + แจ้งเตือน · ถ้าอยู่หน้า jobs-list และ `S.page===1` เท่านั้น → `refreshCurrentPage("insert visible job")` (หน้าอื่น = อัปเดต count อย่างเดียว ไม่กระพริบ)
- **DELETE** → `updateSidebarCounts()` + ลบ `tr[data-job-id]` เฉพาะแถวนั้น · ถ้าหน้าว่างจึง `refreshCurrentPage("delete emptied page")`
- Badge/KPI (`updateSidebarCounts`) เรียกแยกจากการ render ตารางทุกกรณี
- `refreshCurrentPage(reason)` ใหม่ = log เหตุผลก่อน render (อนุญาตเฉพาะกรณีจำเป็น)

### DOC — `_docRealtimeRefresh`
- เดิม desktop rebuild ทั้ง tbody (`v.rows.map(_docRow)`) → เปลี่ยนเป็น **`diffDocTbody`** (row-level diff เท่ากับ mobile) · UPDATE = patch เฉพาะแถวที่ `data-doc-ver` เปลี่ยน
- นอกหน้า doc → `updateSidebarCounts()` อย่างเดียว (เดิมทำอยู่แล้ว)

## ฟังก์ชันที่แก้/เพิ่ม (js/app.js เท่านั้น)
- แก้: `_scheduleJobsReload`, `_docRealtimeRefresh`
- เพิ่ม: `refreshCurrentPage(reason)`, `_rtPatchOneJobRow(id)`, `_rtOnJobsListView()`
- **ไม่แตะ:** `setupRealtime`, `_onDocRealtime`, subscription, `_scheduleLightRender` (คงไว้ให้ users realtime), `diffJobsTbody`, `diffDocTbody`, search, export, heavy-users.js

## ไม่แตะ (ยืนยัน static)
UI/สี/layout · สิทธิ์/created_by/assigned_to · Supabase schema/RLS · workflow/สถานะ · เลข JOB · search · export · subscription เดิม · heavy-users.js (diff = เหมือนต้นฉบับ)

## ขนาด
- js/app.js: ก่อน 489,670 → หลัง ~490KB (เพิ่ม 3 helper เล็ก) · CSS/HTML/chunks ไม่แตะ
