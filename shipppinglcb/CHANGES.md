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
