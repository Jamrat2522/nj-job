# ⛔ หยุดก่อน — อย่ารัน 01/02/03 ซ้ำจนกว่าจะแก้

## เกิดอะไรขึ้น (จาก error จริงที่คุณส่งมา)

1. `"emp_id" and "id" are of incompatible types: text and uuid`
   → ตาราง `employees` **มีอยู่แล้ว** ในโปรเจกต์ และ `id` เป็น **uuid**
   `create table if not exists` จึงข้ามไป ไม่ได้สร้างตามสคริปต์ผม แล้ว FK ที่ผมประกาศเป็น `text` เลยชนกัน

2. `column "auth_uid" does not exist · HINT: "app_users.auth_id"`
   → ตาราง `app_users` **มีอยู่แล้ว** และใช้ชื่อคอลัมน์ `auth_id` ไม่ใช่ `auth_uid`

3. `type "leaves" does not exist`
   → ไฟล์ 01 หยุดกลางทาง ตาราง `leaves` ยังไม่ถูกสร้าง ไฟล์ 03 ที่อ้างถึงจึงพัง

**สาเหตุราก: ผมเขียน SQL โดยสมมติว่าโปรเจกต์ว่าง — ผิดกฎ "ห้ามเดา" ของคุณเอง**

## ความเสียหายต่อข้อมูลเดิม: ไม่มี (แต่ต้องตรวจยืนยัน)

- `create table if not exists` **ไม่แตะ** ตารางที่มีอยู่แล้ว ไม่มี drop/alter/delete ในสคริปต์ผมเลย
- สคริปต์หยุดตอน error → อาจมีตารางใหม่บางตัวถูกสร้างค้างไว้ ให้รัน `00_inspect.sql` ข้อ (7) เพื่อดู

## ต้องตัดสินใจ 3 เรื่องก่อนผมเขียนใหม่

1. **กันชนกับแอปอื่น** — โปรเจกต์นี้แชร์กับ MASSENGER / BILLING / SHIPPING ฯลฯ
   ชื่อกลาง ๆ อย่าง `employees`, `leaves`, `notifications` เสี่ยงชนของจริง
   ผมแนะนำ **schema แยก** `create schema njhr;` หรือ prefix `njhr_*` ทุกตาราง
2. **ชนิด id** — ของเดิมเป็น uuid ส่วนข้อมูลใน localStorage เป็น text (`E005`, `LV-2604`)
   ต้องเลือก: map ไป uuid ตอน migrate (เก็บรหัสเดิมไว้คอลัมน์ `legacy_id`) หรือใช้ text ในตารางใหม่
3. **ระบบ auth** — ถ้า `auth.users` ว่าง แปลว่าใช้ custom auth (`app_users` + รหัสผ่านในตาราง)
   → RLS แบบ `auth.uid()` **ใช้ไม่ได้** ต้องเปลี่ยนวิธี (ย้ายไป Supabase Auth หรือใช้ Edge Function เป็นด่านสิทธิ์)

## สิ่งที่ต้องส่งกลับมา

รัน `00_inspect.sql` (อ่านอย่างเดียว) แล้วส่งผลข้อ (1)–(5) มา
ผมจะเขียน schema/RLS/migration ใหม่ให้ตรงของจริง 100% ไม่เดาอีก
