# แฟ้มเอกสารพนักงาน — ลำดับการติดตั้ง

ต้องทำครบทั้ง 3 ขั้น ตามลำดับนี้เท่านั้น ระบบจึงจะทำงาน

---

## ขั้นที่ 1 — รัน SQL

Supabase Dashboard → SQL Editor → รัน `supabase-new/73_emp_files.sql`

จบแล้วดูผลใน `install_report` ต้องได้:

| ค่า | ที่ต้องเห็น |
|---|---|
| `table_files` | `true` |
| `table_versions` | `true` |
| `bucket` | `{"id": "njhr-emp-files", "public": false}` |
| `bucket_policies` | `0` — **ต้องเป็น 0** (ถ้าไม่ใช่ 0 แปลว่ามี policy ให้ anon แตะไฟล์ได้ ต้องลบทิ้ง) |
| `functions` | 6 รายการ ขึ้นต้น `njhr_empfile_` |

ถ้า `bucket` เป็น `null` ให้สร้างเองที่ Storage → New bucket → ชื่อ `njhr-emp-files` → **Public = ปิด**

---

## ขั้นที่ 2 — Deploy Edge Function

```bash
supabase functions deploy njhr-emp-file --no-verify-jwt
```

`--no-verify-jwt` จำเป็น เพราะระบบนี้ใช้ Auth ของตัวเอง (`app_users` + `njhr_token`)
ไม่ใช่ Supabase Auth — การตรวจสิทธิ์จริงทำที่ RPC `njhr_empfile_guard` ในฐานข้อมูล

ค่า `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` แพลตฟอร์มใส่ให้อัตโนมัติ
**ห้ามนำ service_role key ไปใส่ใน index.html หรือ app.js เด็ดขาด**

ทดสอบว่า Deploy สำเร็จ:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/njhr-emp-file \
  -H "Content-Type: application/json" -d '{}'
# ต้องได้ {"error":"เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"} พร้อม HTTP 401
```

---

## ขั้นที่ 3 — อัปโหลดไฟล์แอป

อัปโหลดทับที่ URL เดิม: `index.html` · `app.js` · `styles.css` · `sw.js`

`sw.js` เวอร์ชันแคชถูกเลื่อนเป็น `njhr-v67` แล้ว — ผู้ใช้ที่เปิดค้างอยู่จะได้ไฟล์ใหม่
หลังรีเฟรชครั้งถัดไป ถ้าต้องการให้เห็นทันทีให้กด Ctrl+Shift+R หนึ่งครั้ง

---

## กติกาความปลอดภัยที่บังคับไว้

| กติกา | บังคับที่ไหน |
|---|---|
| Bucket เป็น private ไม่มี policy ให้ anon | `73_emp_files.sql` ข้อ 9 |
| เบราว์เซอร์เข้าถึง Storage ตรงไม่ได้เลย | ไม่มี policy → PostgREST/Storage ปฏิเสธ |
| ทุกการดู/ดาวน์โหลดต้องผ่านการตรวจสิทธิ์ | Edge Function → `njhr_empfile_access` |
| ทุกการอัปโหลดต้องผ่านการตรวจสิทธิ์ | Edge Function → `njhr_empfile_upload_path` |
| Signed URL อายุ 60 วินาที | `SIGN_TTL` ใน Edge Function |
| พนักงานทั่วไปเห็นเฉพาะของตนเอง | `njhr_empfile_guard` |
| แนบ/แก้ = SUPER_ADMIN / ADMIN / HR | `njhr_empfile_guard(p_write := true)` |
| ลบ = SUPER_ADMIN + ต้องมีเหตุผล | `njhr_empfile_delete` |
| ลบแล้วไฟล์จริงไม่หาย (Soft Delete) | `deleted_at` + ไฟล์ยังอยู่ใน Storage |
| เปลี่ยนไฟล์แล้วไฟล์เดิมไม่หาย | `njhr_emp_file_versions` |
| ทุกการกระทำลง Audit Log | `njhr_audit_write` (EMPFILE_ADD/EDIT/DELETE/VIEW) |
