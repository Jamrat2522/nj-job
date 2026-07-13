# MASSENGER V3 — ROLLBACK PLAN

> วิธีปิด V3 · กลับไปใช้ Production · Restore เมื่อเกิดปัญหา · Kill Switch · แผนสำรอง
> อัปเดตล่าสุด: Phase 1

---

## หลักการ

Production เป็นระบบจริงที่ **ไม่ถูกแตะ** ตลอดโปรเจกต์ V3
→ การ "กลับไปใช้ Production" คือแค่ **ให้ผู้ใช้เลิกใช้ URL V3 แล้วกลับไป URL prod เดิม** (prod ทำงานอยู่ตลอด ไม่เคยหยุด)
เพราะ V3 อยู่คนละ URL/hosting/project — การ rollback จึงเร็วและปลอดภัย

**ความเสี่ยงเดียวที่แท้จริง:** V3 ใช้ **DB เดิม + user เดิม** → หาก V3 เปิด write แล้วทำงานผิด อาจเขียนข้อมูลผิดลง `jobs`/`documents` จริง
→ ป้องกันด้วย READ_ONLY guard (UAT) และเปิด write เฉพาะหลัง sign-off

---

## 1. Kill Switch (ปิด V3 ทันที)

**ระดับที่ 1 — Config flag (เร็วสุด)**
- ตั้ง `KILL_SWITCH=true` ใน `/config/config.js` → V3 แสดงหน้า "ระบบปิดปรับปรุงชั่วคราว · กรุณาใช้งานที่ <URL Production>" และไม่โหลด app
- ผลทันทีเมื่อผู้ใช้รีเฟรช (ไม่ต้องรอ deploy ถ้าใช้ remote config)

**ระดับที่ 2 — Force READ_ONLY**
- ตั้ง `READ_ONLY=true` → block ทุก write ที่ชั้น Supabase client (insert/update/upsert/delete/storage/auth.signUp) ทันที
- ใช้เมื่อสงสัยว่า V3 กำลังเขียนข้อมูลผิด แต่ยังอยากให้ผู้ใช้ดู (read) ได้

**ระดับที่ 3 — Take down hosting**
- ปิด/unpublish hosting ของ V3 → URL V3 เข้าไม่ได้ · ผู้ใช้กลับ prod อัตโนมัติ

---

## 2. วิธีกลับไปใช้ Production

1. แจ้งผู้ใช้ใช้ **URL Production เดิม** (prod ทำงานปกติตลอด ไม่ต้อง restore)
2. เปิด Kill Switch V3 (ระดับ 1 หรือ 3) เพื่อกัน traffic หลงเข้า V3
3. ล้าง session ฝั่ง V3 ถ้าจำเป็น:
   - `localStorage.removeItem("massenger_clean_user")`
   - Supabase auth storageKey `mass-dispatch-auth-clean`
   - **ห้ามแตะ** key ฝั่ง Production (`massenger_current_user` / auth key ของ prod)
4. Service Worker: V3 ตัด SW อยู่แล้ว + unregister ของเก่า → ไม่มี cache ค้างข้าม URL

---

## 3. วิธี Restore เมื่อเกิดปัญหา

### 3.1 กรณี V3 render/logic พัง (ยังไม่เปิด write · READ_ONLY ON)
- ไม่มีข้อมูลเสีย (guard block write หมด) → แค่ Kill Switch + rollback deploy V3 กลับ commit ก่อนหน้า
- ไม่ต้อง restore DB

### 3.2 กรณีเผลอเปิด write แล้วข้อมูลผิด (หลัง UAT)
- Kill Switch ระดับ 2 (`READ_ONLY=true`) ทันที เพื่อหยุดเลือดก่อน
- ระบุขอบเขตความเสียหาย: ช่วงเวลา + ตาราง (`jobs`/`documents`/`*_logs`/`attachments`/`signatures`)
- Restore จาก backup (ดูข้อ 4) เฉพาะแถวที่กระทบ · ตรวจ `app_code="massenger"`
- ตรวจสอบ Supabase Point-in-Time Recovery / daily backup ของ project ถ้ามี

### 3.3 กรณี Deploy V3 พังทั้งหน้า
- Rollback hosting V3 → build/commit เสถียรตัวก่อน
- ไม่มีผลต่อ prod (คนละ hosting)

---

## 4. แผนสำรอง / Backup

- ระบบมีปุ่ม **Export JSON Backup** (admin) → `backups` table + ไฟล์ JSON: users · jobs · job_logs · attachments · signatures
  - ตั้งชื่อ `MASS_DISPATCH_BACKUP_{timestamp}.json`
- **ก่อนเปิด write บน V3 ครั้งแรก:** สั่ง Export Backup 1 ชุด เก็บนอกระบบ (มือ)
- แนะนำเปิด Supabase automated backup / PITR ของ project `sytgqjglcnsabcszbngg`
- เก็บ Source ของ V3 ทุก Phase เป็น commit แยก (rollback ได้ทีละ Phase)
- เก็บไฟล์ Clone ต้นฉบับ (`massenger-clean_min__62__edit-header.html`) เป็น read-only reference — ห้ามเขียนทับ

---

## 5. Checklist ก่อน Go-Live (เปิด write จริง)

- [ ] Regression Phase 5 ผ่านครบ (7 role × desktop/mobile)
- [ ] Export Backup ล่าสุดเก็บไว้แล้ว
- [ ] Kill Switch ทั้ง 3 ระดับทดสอบแล้วว่าใช้ได้จริง
- [ ] `READ_ONLY` toggle ทดสอบ block write ได้จริง
- [ ] URL/hosting V3 แยกจาก prod ยืนยันแล้ว
- [ ] storageKey/localStorage แยกจาก prod ยืนยันแล้ว
- [ ] ทีมรู้ขั้นตอน rollback + ใครมีสิทธิ์กด Kill Switch
- [ ] Sign-off เป็นลายลักษณ์ก่อนปิด READ_ONLY

---

## 6. สรุปสั้น (การ์ดฉุกเฉิน)

| เหตุการณ์ | ทำทันที |
|---|---|
| V3 เขียนข้อมูลผิด | `READ_ONLY=true` → หยุดเลือด → ประเมิน → restore backup |
| V3 หน้าพัง | Kill Switch → rollback deploy V3 |
| ต้องปิด V3 ด่วน | `KILL_SWITCH=true` หรือ take down hosting |
| ผู้ใช้กลับ prod | ใช้ URL prod เดิม (prod ไม่เคยหยุด) |

> Production ไม่เคยถูกแตะ · การกลับไปใช้จึงคือแค่เปลี่ยน URL — เร็วและปลอดภัยเสมอ

---

## 7. Rollback Phase 2.5 (Wire Runtime Config)

- **เต็มรูป:** คืน `js/app.js` → md5 `9af23b69199a5d3fe824aac1b0e3c838` (หลัง Phase 2) · css/index/config ไม่ต้องแตะ (ไม่เปลี่ยน)
- **ชั่วคราวผ่าน config (ไม่ deploy):** `runtime-config.js` → `READ_ONLY:false · KILL_SWITCH:false · FEATURES ทุกตัว true` → พฤติกรรมกลับใกล้เดิม
- app.js หลัง Phase 2.5 md5: `98bce794cbf2e76f2eb83d3765918a43`


---

## Freeze Baseline ปัจจุบัน (full MD5 · ห้ามแก้)
- js/app.js = `63c5543270425bf1cd4ff27082b13b3b`
- css/app.css = `6081e65469f7f70520476b793b15caa4`
- index.html = `64f110c765d0700587bd3fd58cde8a2e`
- config/runtime-config.js = `51419c7b588e9fa0f3b0622450bdc525`

> Role decision + Legacy Code Reference ดู Decision Log ใน PENDING_FIX / ARCHITECTURE
