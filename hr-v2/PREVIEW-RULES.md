# HR V2 — กติกาโหมด Preview (v2-preview-1)

สถานะ: **ระบบทดสอบ (Preview) เท่านั้น — ไม่ใช่ระบบใช้งานจริง · ห้าม Cutover จาก V1**

| # | เงื่อนไข | บังคับด้วยอะไร | สถานะในชุดนี้ |
|---|---|---|---|
| 1 | เปิดเฉพาะ SUPER_ADMIN + บัญชีผู้ทดสอบ | `njhr_version_v2_access` (SQL 96) — ค่าเริ่มต้น `roles:['SUPER_ADMIN'], users:[]` | ✅ โดยค่าเริ่มต้น (ไม่ต้องแก้อะไร) |
| 2 | Feature Flag พนักงานทั่วไปปิด | เหมือนข้อ 1 — ไม่มี role อื่นในรายการ | ✅ ปิดอยู่แล้ว |
| 3 | ห้าม Cutover จาก V1 | ไม่มีลิงก์/redirect จาก V1 มา V2 · V1 ไม่ถูกแตะไฟล์เดียว | ✅ |
| 4 | ห้ามประกาศให้พนักงานใช้งาน | เป็นกระบวนการ (คุณเป็นผู้ตัดสินใจ) + แถบ PREVIEW บนทุกหน้า | ✅ แถบเตือนแสดงตลอด |
| 5 | ห้ามบันทึกข้อมูลธุรกิจจริงจนกว่าจะทดสอบ RPC/RLS/ข้อมูลของ Module นั้นผ่าน | **Preview Write Lock** — `ctx.assertWrite()` บล็อกคำสั่งเขียนทุกชนิดทั้งระบบ | ✅ ล็อกเป็นค่าเริ่มต้น |
| 6 | V1 ไม่ถูกแก้ · V2 ไม่ครอบ Service Worker | V2 ไม่มีไฟล์ SW และไม่เรียก `serviceWorker.register` เลย (ทดสอบด้วย PRV-3) | ✅ + มีหน้าตรวจสถานะ SW ที่ `#/system` |
| 7 | รัน PRODUCTION-CHECKLIST และรายงานผลจริง | คุณเป็นผู้รัน (ผมเข้าถึงโดเมน/เบราว์เซอร์จริงไม่ได้) | ⏳ รอผลจากคุณ |
| 8 | ห้ามนับ Mock เป็น Production PASS | รายงานทุกฉบับระบุ "Mock" ชัดเจน · ตาราง Production ทุกช่องเป็น NOT RUN | ✅ |
| 9 | Force Update ทดสอบเฉพาะบัญชี/อุปกรณ์ทดสอบก่อน | Feature Flag ปิดพนักงานอยู่แล้ว → Maintenance/Force Update กระทบเฉพาะผู้ทดสอบ V2 | ✅ |
| 10 | พบ FAIL → ปิด Feature Flag และแก้เฉพาะ V2 | คำสั่ง SQL ปิดแฟล็กอยู่ท้ายเอกสารนี้ | ✅ |

## Preview Write Lock ทำงานอย่างไร
- ค่าเริ่มต้นใน `index.html`: `NJHR_V2_WRITE_LOCK = true` → คำสั่ง **เพิ่ม / แก้ไข / ลบ / อนุมัติ / ลงเวลา / ตั้งรหัสผ่าน / คัดลอกรายการเงินเดือน** ถูกบล็อกก่อนถึง RPC ทุกกรณี (ไม่มี network call ออกไปเลย)
- ปลดล็อกเพื่อทดสอบทีละ Module: `#/system` → "ปลดล็อกการบันทึก (ทดสอบ)"
  - เฉพาะ SUPER_ADMIN · มีผล **เฉพาะแท็บที่กด** · หายเมื่อปิดแท็บหรือเปลี่ยน BUILD · ไม่กระทบผู้ใช้คนอื่น
  - เมื่อปลดล็อก แถบด้านบนเปลี่ยนเป็นสีแดงเพื่อกันลืม
- ทดสอบเสร็จ → กด "ล็อกการบันทึกกลับ" และลบข้อมูลทดสอบทุกครั้ง

## เรื่อง Service Worker (ต้องตรวจก่อนอัปโหลด)
- V2 **ไม่มี** Service Worker (ยืนยันด้วยเทส PRV-3) จึงไม่มีทางครอบ scope ของ V1
- ⚠ ความเสี่ยงในทางกลับกัน: V1 เรียก `navigator.serviceWorker.register('sw.js')` — scope ของมันคือ **โฟลเดอร์ที่ V1 ติดตั้งอยู่**
  - ถ้า V1 อยู่ใน subfolder (เช่น `/hr/`) → scope = `/hr/` → **ไม่กระทบ `/hr-v2/`** ✅
  - ถ้า V1 อยู่ที่ root ของโดเมน (`/`) → scope = `/` → SW ของ V1 จะควบคุมหน้า `/hr-v2/` ด้วย ผลคือเวลาเน็ตหลุด การ navigate ใน V2 อาจได้ `index.html` ของ V1 กลับมา (navigate fallback ของ sw.js บรรทัด `caches.match('./index.html')`)
  - วิธีตรวจ: เปิด `/hr-v2/` → `#/system` → ดูช่อง "SW ที่ควบคุมหน้านี้" ถ้าขึ้น `sw.js` ของ V1 = อยู่ในกรณีที่สอง
  - **V2 จะไม่สั่ง unregister ให้เด็ดขาด** (จะไปทำลาย offline cache ของ V1 = แก้ไข V1 โดยอ้อม) — ถ้าเจอกรณีนี้ ให้แจ้งผม จะเสนอทางแก้ที่ปลอดภัยให้เลือกก่อน ไม่ลงมือเอง

## คำสั่ง SQL ที่ต้องใช้ (คุณเป็นผู้รันเอง — ผมไม่มีสิทธิ์ Production)
เพิ่มบัญชีผู้ทดสอบ (ใส่ username ตัวพิมพ์เล็ก):
```sql
update public.system_settings
set value = jsonb_set(value, '{v2_access,users}', '["tester1","tester2"]'::jsonb), updated_at = now()
where key = 'njhr_release';
```
ปิดการเข้าถึง V2 ทั้งหมดทันที (กรณีพบ FAIL — เหลือเฉพาะ SUPER_ADMIN):
```sql
update public.system_settings
set value = jsonb_set(jsonb_set(value, '{v2_access,users}', '[]'::jsonb),
                      '{v2_access,roles}', '["SUPER_ADMIN"]'::jsonb), updated_at = now()
where key = 'njhr_release';
```
ตรวจสถานะแฟล็กปัจจุบัน:
```sql
select value->'v2_access' from public.system_settings where key = 'njhr_release';
```
