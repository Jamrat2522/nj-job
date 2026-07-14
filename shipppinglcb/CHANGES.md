# CHANGES — Round 1 Code Split (Candidate)
> โคลนสำหรับ Browser Test · Production ไม่ถูกแตะ

## สรุป
แยกโค้ดเมนูหนักออกจาก `app.js` เป็น Lazy Chunk (โหลดเมื่อใช้จริง) แบบ classic-script injection

## แยกอะไรออก
| Chunk | ไฟล์ | ขนาด | ฟังก์ชัน |
|---|---|---|---|
| Export (Excel/ZIP) | `js/heavy-export.js` | 28 KB | 15 (openExportChooser, exportExcel, docExportExcel, exportBackup + _exp*) |
| Dashboard/Charts | `js/heavy-dash.js` | 29 KB | 19 (renderGraphsPage, renderDashboard + graph/dash helpers) |
| OT | `js/heavy-ot.js` | 12 KB | 8 (openOTModal + modal fns) |
| User Management | `js/heavy-users.js` | 5 KB | 4 (renderUsersView, userRow, approveUser, deleteUserConfirm) |

## ขนาด
- `app.js`: **559,483 → 489,240 bytes** (−70,243 / −12.5%)
- Initial JS (index.html): config + format + runtime + app.js = **497,738 raw / 120,843 gzip**
- Chunks (ไม่นับ initial): 28 + 29 + 12 + 5 = ~74 KB

## กลไก
- `index.html` โหลดเฉพาะ 4 core (config → format → runtime → **app.js**) · heavy-* ไม่อยู่ใน index.html
- Lazy loader อยู่ใน `app.js` (`_loadChunk` + `_lazyCall` + `_lazyRender`) → inject `<script src="js/heavy-*.js">` เมื่อกดเมนู/ปุ่มครั้งแรก · cache promise (`_chunkP`) ไม่โหลดซ้ำ
- onclick + ชื่อ global เดิมคงไว้ (wrapper) · sub-fn เป็น global หลัง chunk โหลด
- Fallback: chunk พัง → toast/alert + reset promise (retry ได้) + ไม่ค้าง

## ไม่แตะ (คงใน app.js)
Document ทั้งหมด (renderDocView, `_docV2*`, `_docSp*`, 53 Other), Timeline, รับ/ปิดงาน, Realtime, Timer, Modal สร้างงานใหม่ (+ CSS +20%), Excel format, KPI, validation, DB/schema/permission

---
## rev.2 (2026-07-14) — Bug fixes + sync
1. **[บั๊กหน้าผู้ใช้งาน]** `_lazyRender` เขียน loading ลง `querySelector(...,main)` = จับ `<main>` ที่ครอบ `#view-root` → innerHTML ทับ = view-root หาย → `renderUsersView` หา `$("view-root")` ไม่เจอ (null) → "โหลดหน้าไม่สำเร็จ" · แก้: เขียน loading ลง `getElementById("view-root")` เอง (ไม่ทำลาย view-root) + guard ใน renderUsersView (`if(!container)return`) · ครอบคลุม `[rt jobs]` (ต้นเหตุเดียวกัน) · ไม่แตะ realtime
2. **[edit-mode]** เอา `onclick="_docV2EditHeader()"` ออกจากการ์ด cell (โหมด/ลูกค้า/B/L/โกดัง) — เปิดแก้ไขเฉพาะปุ่ม + `event.stopPropagation()`
3. **[search]** เพิ่ม `job_nj` (เลขใบขน/B/L) ใน client filter + server orExpr

---
## rev.3 (2026-07-14) — สิทธิ์การเห็นงาน STAFF/USER (js/app.js เท่านั้น · ไม่แตะ UI/Supabase/realtime)
- **A** เอา "jobs" ออกจาก `_ADMIN_ONLY_VIEWS` + แก้ gate ซ้อนใน `renderView` (`v==="jobs"&&!canSeeAdminDashboard()`) ให้ bounce เฉพาะ MESSENGER → STAFF/USER เปิด "งานทั้งหมด" ได้
- **B** `_defaultLandingView`: SHIPPING→doc-new · MESSENGER→wait · SUPER/ADMIN/STAFF/USER→jobs
- **C** เพิ่ม `isJobOwnedByUser(job,u)`: เทียบ created_by===id ก่อน · ไม่ตรง → เทียบ created_by_name กับ username/full_name/display_user (trim+lowercase · ไม่จับชื่อว่าง)
- **D** ใช้ `isJobOwnedByUser` แทน `created_by===id` ใน canEditJob, _workCloseAllowed, canViewJob, _jobVisibleToMe, _visibleJobs
- **F** MESSENGER คง `_msgTerminalMatch` (WAIT ตามท่า + assigned + owned)
- **G/H** ไม่แตะระบบเอกสาร SHIPPING · ไม่เพิ่ม USER ใน createJob · ไม่แตะ realtime/KPI/modal
- หมายเหตุ: STAFF/USER landing=jobs (งานทั้งหมด) — ไม่เพิ่มปุ่ม sidebar (ห้ามแก้ UI) · wait/going ยังกรอง TODAY เดิม (ไม่อยู่ใน A–H)
