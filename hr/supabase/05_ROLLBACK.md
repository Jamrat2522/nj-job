# Rollback Guide (กลับไปใช้ localStorage เดิม)

ระบบยังไม่ถูกสลับไป Supabase — ไฟล์ในโฟลเดอร์นี้เป็นสคริปต์เตรียมไว้ ยังไม่ถูกรัน

## ถ้ารัน Migration แล้วต้องการย้อนกลับ
1. ข้อมูลเดิม **ไม่ถูกลบ** — ยังอยู่ที่ `localStorage['njhr_db_v3']` และไฟล์สำรอง `njhr_backup_<เวลา>.json` ที่ดาวน์โหลดตอนเริ่ม migrate
2. ถ้าข้อมูลในเครื่องถูกแก้ไปแล้ว: เปิด Console →
   `localStorage.setItem('njhr_db_v3', <เนื้อหาไฟล์ backup>)` แล้ว refresh
3. ฝั่ง Supabase: `truncate table leave_timeline, leaves, leave_balances, notifications, audit_log cascade;`
   (ตารางอ้างอิง employees/leave_types ปล่อยไว้ได้ ไม่กระทบแอปเดิม)
4. ไม่มีการแก้โค้ดแอปให้ชี้ Supabase ในเวอร์ชันนี้ → **ไม่ต้อง rollback โค้ด**

## Rollback การแก้ประสิทธิภาพ (Phase 1)
- สำรองไฟล์ทั้งชุดก่อนแก้อยู่ที่ `nj-hr-backup-<HHMM>/` (โฟลเดอร์ระดับเดียวกับโปรเจกต์)
- คืนค่า: คัดลอก `app.js`, `index.html` จากโฟลเดอร์สำรองทับไฟล์ปัจจุบัน แล้ว refresh
- ไม่มีการเปลี่ยนโครงสร้างข้อมูลใน Phase 1 → ข้อมูลเดิมใช้ได้ทันทีทั้งสองทาง
