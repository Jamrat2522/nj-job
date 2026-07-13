# MASSENGER V3 — SECURITY AUDIT

> สแกนจากไฟล์จริง · ปิดบังค่าลับ · **ไม่แก้ Auth/Database/RPC ในงานนี้** (ต้องแยก track + อนุมัติ) — ตามคำสั่ง

## สรุปผลสแกน (js/app.js + js/core/runtime.js + config)

| รายการ | พบ | ค่า | ระดับ |
|---|---|---|---|
| Service Role Key | ❌ 0 | — | ✅ ดี (ไม่มีใน frontend) |
| Anon key literal ในโค้ด | ไม่พบเป็น literal `eyJ…` | (ใช้ผ่านตัวแปร) | ปกติ (anon key เปิดเผยได้) |
| Supabase URL | มี (project `sytgqjglcnsabcszbngg`) | domain เท่านั้น | ปกติ |
| **`login_plain` (RPC ล็อกอิน)** | ✅ 3 จุด | — | 🔴 High |
| **`password_display` (คอลัมน์รหัสผ่าน)** | ✅ 6 จุด | *ปิดบัง* | 🔴 High |
| **`password_audit_logs` (ฟีเจอร์ดูรหัสผ่าน)** | ✅ 1 | — | 🟠 Medium |
| Token / secret / private credential ฝัง | ไม่พบเพิ่มเติม | — | — |

> ⚠️ ไม่แสดงค่ารหัสผ่านจริงใดๆ ในรายงานนี้

## ประเด็นความปลอดภัย (รายงาน · ยังไม่แก้)

### SEC-01 · Plaintext login + password_display 🔴 High
- ระบบใช้ RPC `login_plain` และมีคอลัมน์ `password_display` — บ่งชี้ว่ารหัสผ่านถูกเก็บ/แสดงแบบ plaintext และยืนยันตัวตนแบบ custom (ไม่ผ่าน Supabase Auth hashing)
- **ความเสี่ยง:** ใครเข้าถึง DB/endpoint ได้ อาจอ่านรหัสผ่านผู้ใช้ · frontend ที่ดึง `password_display` = ส่งรหัสผ่านมาที่ browser
- **แนวทาง (ต้องอนุมัติ + แยก track):** ย้ายไป Supabase Auth หรือ hash ฝั่ง server (bcrypt/argon2) · เลิกส่ง `password_display` มา frontend · reset password flow ที่ปลอดภัย
- **ทำไมยังไม่แก้ในงานนี้:** ต้องแก้ Database schema + RPC + login/permission flow = ขัดคำสั่ง "ห้ามเปลี่ยน RPC/Table/Login Flow" และต้อง migration ข้อมูลจริง → **ห้ามเดา ห้ามแก้ DB เอง**

### SEC-02 · ฟีเจอร์ดูรหัสผ่าน (password_audit_logs) 🟠 Medium
- มีฟีเจอร์ให้ (SUPER_ADMIN) ดูรหัสผ่านผู้ใช้ + log — พึ่งพา plaintext storage (ผูกกับ SEC-01)
- **แนวทาง:** เมื่อย้ายไป hash แล้ว ฟีเจอร์นี้ต้องเปลี่ยนเป็น reset-only (ดูรหัสไม่ได้อีก)

## ข้อสรุป
- ✅ ไม่มี Service Role Key รั่วใน frontend (ดี)
- 🔴 มีรูปแบบ plaintext credential (login_plain + password_display) = ต้องแก้ แต่**อยู่นอกขอบเขต Safe-Fix pass นี้** เพราะกระทบ DB/RPC/Auth flow
- **Action:** เปิดงานความปลอดภัยแยก (Security Track) — ต้องอนุมัติ + วางแผน migration + ทดสอบ ก่อนแตะ auth ใดๆ
