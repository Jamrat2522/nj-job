# ROLLBACK — MASSENGER V3 · 3.6.2 → 3.6.1

## กฎสำคัญ
- **ไม่มี SQL migration ใดของ 3.6.2 ถูก execute** → ไม่มีอะไรต้อง rollback ฝั่งฐานข้อมูล
- **ไม่มีการลบหรือแก้ข้อมูลใด ๆ** → ข้อมูลไม่ต้องกู้คืน
- Rollback = อัปโหลดไฟล์เดิมทับกลับเท่านั้น

---

## วิธี Rollback แบบเร็ว (2 นาที)

อัปโหลดไฟล์จาก `MASSENGER_V3_3.6.1.zip` ทับตามลำดับ:

| ลำดับ | ไฟล์ |
|---|---|
| 1 | `config/runtime-config.js` (3.6.1) |
| 2 | `js/core/runtime.js` (3.6.1) |
| 3 | `js/app.js` (3.6.1) |
| 4 | `js/heavy-users.js` (3.6.1) |
| 5 | `index.html` (3.6.1 · `?v=3.6.1`) ← ท้ายสุด |

แล้ว Hard refresh — เสร็จ

> `js/admin/seed-users.js` ลบทิ้งได้ 3.6.1 ไม่ได้ใช้ (มี array อยู่ใน `app.js` เอง)

---

## Rollback บางส่วน (ไม่ต้องย้อนทั้งชุด)

| อาการ | แก้เฉพาะจุด |
|---|---|
| คอลัมน์สถานะในหน้าเอกสารเพี้ยน | `config/runtime-config.js` → `DOC_STATUS_RPC: false` แล้วอัปไฟล์เดียว |
| ปุ่ม Sync Users ใช้ไม่ได้ | อัปโหลด `js/admin/seed-users.js` เพิ่ม |
| Badge ไม่ขึ้น / เป็น 0 | ตรวจว่า RPC `massenger_sidebar_counts` ยังอยู่ · ถ้าลบไปแล้วระบบจะ fallback นับจาก memory อัตโนมัติ |

---

## ถ้ารัน SQL ของ 3.6.2 ไปแล้ว (ไม่แนะนำให้ย้อน)

ทั้ง 3 ไฟล์เป็น **additive ล้วน** — สร้าง function ใหม่ ไม่แตะ schema/ข้อมูล
ปล่อยไว้ได้อย่างปลอดภัย ไม่มีผลถ้า frontend ไม่เรียกใช้

ถ้าต้องการลบจริง ๆ:
```sql
DROP FUNCTION IF EXISTS public.massenger_maint_distance_backfill(boolean,integer);
DROP FUNCTION IF EXISTS public.massenger_maint_reset_stale_postponed(boolean);
DROP FUNCTION IF EXISTS public.massenger_maint_sync_direct_docs(boolean);
DROP FUNCTION IF EXISTS public.massenger_doc_status_rows(text[],text[],text[],text[]);
-- index (ถ้าสร้างไปแล้ว)
DROP INDEX IF EXISTS public.idx_jobs_trgm_jobno;
DROP INDEX IF EXISTS public.idx_jobs_trgm_company;
DROP INDEX IF EXISTS public.idx_jobs_trgm_jobnj;
DROP INDEX IF EXISTS public.idx_docs_trgm_docno;
DROP INDEX IF EXISTS public.idx_docs_trgm_srcjob;
DROP INDEX IF EXISTS public.idx_docs_trgm_company;
```

⚠️ **ห้าม DROP** `massenger_sidebar_counts` และ `massenger_status_counts` — 3.6.1 ใช้อยู่

---

## ทางเลือกสุดท้าย — Monolithic

`js/app.monolithic.js` คือระบบเดิมแบบรวมไฟล์ ใช้เมื่อทุกทางล้มเหลว
**ห้ามลบ** และ **ห้ามโหลดในระบบปกติ**

---

## หลัง Rollback ต้องทำ

1. Hard refresh ทุกเครื่อง (`Ctrl+Shift+R`)
2. ตรวจ badge ขึ้นครบ
3. ตรวจโมดูลเอกสารเปิดได้
4. แจ้งผู้พัฒนาว่า rollback เพราะอาการอะไร เพื่อแก้ให้ตรงจุด
