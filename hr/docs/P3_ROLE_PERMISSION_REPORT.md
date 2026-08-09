# P3_ROLE_PERMISSION_REPORT

Build `njhr-v2-eed72c68` · ทดสอบ 3 Role ที่มีอยู่จริงในโค้ด — `SUPER_ADMIN` · `ADMIN` · `USER`
Role ถูกสลับที่ชั้นตอบกลับของ `njhr_login` / `njhr_session_check` ใน fixture (ไม่แตะ Production)

## สรุป

| Role | เมนู Sidebar | Route เข้าได้ | Route ถูก redirect | Access Denied | Module ที่ไม่มีสิทธิ์ |
|---|---:|---|---|---|---|
| SUPER_ADMIN | 17 ลิงก์ | 28/28 | — | — | — |
| ADMIN | 17 ลิงก์ | 27/27 | 1/1 (`#/geofence`) | toast เดิม | ไม่โหลด |
| USER | 7 ลิงก์ | 13/13 | 15/15 | toast เดิม | ไม่โหลด |

**Permission ถูกตรวจก่อนโหลด Module ทุกกรณี** — `render()` เรียก `canAccess()` ก่อน `NJHR.modules.load()` เสมอ
วัดจริง: `USER` เข้า `#/employees` แล้ว **ไม่มีไฟล์ JS ใหม่ถูกร้องขอเลยแม้แต่ไฟล์เดียว**
Action Module (form · documents · import · export · correction · leave-form · request-detail · ot-form)
ถูกเรียกจากปุ่มที่แสดงเฉพาะผู้มีสิทธิ์ และอยู่หลังด่าน Route Guard อีกชั้น

## ผลราย Test Case

| Test Case | ผล | หลักฐาน |
|---|---|---|
| ROLE SUPER_ADMIN · login + shell | PASS | role=SUPER_ADMIN hash=#/dashboard |
| ROLE SUPER_ADMIN · Dashboard เปิดได้ | PASS | viewHost=4535B |
| ROLE SUPER_ADMIN · เมนูไม่มีลิงก์ที่ไม่มีสิทธิ์ | PASS | เมนู 17 ลิงก์ · เกิน 0 |
| ROLE SUPER_ADMIN · route ที่มีสิทธิ์เปิดได้ 28/28 | PASS | ครบทุก route |
| ROLE SUPER_ADMIN · ไม่มี route ต้องห้าม (สิทธิ์สูงสุด) | PASS | denied=0 |
| ROLE SUPER_ADMIN · console ไม่มี error | PASS | ไม่มี |
| ROLE ADMIN · login + shell | PASS | role=ADMIN hash=#/dashboard |
| ROLE ADMIN · Dashboard เปิดได้ | PASS | viewHost=4540B |
| ROLE ADMIN · เมนูไม่มีลิงก์ที่ไม่มีสิทธิ์ | PASS | เมนู 17 ลิงก์ · เกิน 0 |
| ROLE ADMIN · route ที่มีสิทธิ์เปิดได้ 27/27 | PASS | ครบทุก route |
| ROLE ADMIN · route ไม่มีสิทธิ์ถูก redirect 1/1 | PASS | เด้งกลับ #/dashboard ทุกตัว |
| ROLE ADMIN · Access Denied แสดง toast | PASS | toast="ยินดีต้อนรับ พนักงาน ทดสอบ001คุณไม่มีสิท" |
| ROLE ADMIN · route ไม่มีสิทธิ์ไม่โหลด Module | PASS | js ที่โหลดเพิ่ม: ไม่มี |
| ROLE ADMIN · ไม่มี Feature Module ใดถูกโหลดจากการลองเข้าที่ไม่มีสิทธิ์ | PASS | moduleState={"dashboard":"loaded"} |
| ROLE ADMIN · console ไม่มี error | PASS | ไม่มี |
| ROLE USER · login + shell | PASS | role=USER hash=#/dashboard |
| ROLE USER · Dashboard เปิดได้ | PASS | viewHost=3860B |
| ROLE USER · เมนูไม่มีลิงก์ที่ไม่มีสิทธิ์ | PASS | เมนู 7 ลิงก์ · เกิน 0 |
| ROLE USER · route ที่มีสิทธิ์เปิดได้ 13/13 | PASS | ครบทุก route |
| ROLE USER · route ไม่มีสิทธิ์ถูก redirect 15/15 | PASS | เด้งกลับ #/dashboard ทุกตัว |
| ROLE USER · Access Denied แสดง toast | PASS | toast="คุณไม่มีสิทธิ์เข้าถึงหน้านี้คุณไม่มีสิทธ" |
| ROLE USER · route ไม่มีสิทธิ์ไม่โหลด Module | PASS | js ที่โหลดเพิ่ม: ไม่มี |
| ROLE USER · ไม่มี Feature Module ใดถูกโหลดจากการลองเข้าที่ไม่มีสิทธิ์ | PASS | moduleState={"dashboard":"loaded"} |
| ROLE USER · console ไม่มี error | PASS | ไม่มี |
| ROLE · เมนู USER ต่างจาก ADMIN | PASS | USER=7 ลิงก์ · ADMIN=17 ลิงก์ |
| ROLE · SUPER_ADMIN และ ADMIN มีเมนู Sidebar ชุดเดียวกัน (ตามการออกแบบเดิม) | PASS | ทั้งคู่ 17 ลิงก์ · ต่างกันที่ #/geofence ซึ่งเป็นแท็บ ไม่ใช่เมนู |
