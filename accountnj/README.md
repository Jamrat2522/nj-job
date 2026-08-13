# BILLING NJ — ระบบบัญชี Billing ใหม่ (แยกจากระบบเดิม 100%)

- ตาราง/RPC ทั้งหมดขึ้นต้น `njacc_` — **ไม่แตะ** `service_charge_records` / `advance_charge_records` / `app_users` เดิม
- Login ด้วย Supabase Auth (session จริง + token หมดอายุ) — ไม่มี plaintext password ในระบบใหม่
- RLS: ตารางทั้งหมด SELECT-only ผ่าน policy · เขียนได้ผ่าน RPC (SECURITY DEFINER) เท่านั้น
- เลขเอกสารทุกชนิดออกโดย DB (row-lock กันเลขซ้ำ) · เงินคำนวณซ้ำฝั่ง DB · Void มี audit ครบ

## 1. ติดตั้งฐานข้อมูล

### FRESH INSTALL (ฐานข้อมูลใหม่ — กรณีของ Production ตอนนี้)
รันใน Supabase SQL Editor **ตามลำดับนี้เท่านั้น**

| ลำดับ | ไฟล์ | หน้าที่ |
|---|---|---|
| 1 | `sql/001_njacc_schema.sql` | **19 ตาราง** (18 หลัก + `njacc_job_financial_snapshot`) · schema สมบูรณ์ในไฟล์เดียว |
| 2 | `sql/002_njacc_constraints.sql` | PK/FK/UNIQUE/CHECK + trigger updated_at |
| 3 | `sql/003_njacc_indexes.sql` | index + GIN trigram · **PREFLIGHT ตรวจ pg_trgm และคอลัมน์ที่ต้องใช้** (ไม่สร้าง extension เอง) |
| 4 | `sql/004_njacc_rls.sql` | RLS ทุกตาราง · ปิด direct SELECT บน profiles/user_access |
| 5 | `sql/005_njacc_rpc.sql` | RPC ทั้งหมด (ไม่มี resolve_login แบบ anon) |
| 6 | `sql/006_njacc_seed.sql` | settings + SUPER ADMIN 2 คน + STEP B2/C bootstrap |
| 7 | `sql/008_njacc_features_v11.sql` | คอลัมน์ Case/Contact/CS/APL, can_delete, list/kpi/export/bulk/delete, invoice split |
| 8 | `sql/009_njacc_auth_hardening.sql` | Auth opaque identity + Create User state machine (PENDING/AUTH_CREATED/ACTIVE/FAILED_CLEANUP) |
| 9 | `sql/007_njacc_verify.sql` | ตรวจ FINAL STATE (อ่านอย่างเดียว — รันปิดท้าย) |

**Fresh Install ไม่ต้องรัน และห้ามรัน `sql/legacy/legacy_auth_upgrade.sql`**
ไฟล์ในเส้นทาง Fresh Install ไม่มี `@billing.app`, ไม่มี `njacc_resolve_login`,
ไม่มีการรับ `internal_username` จาก payload ใด ๆ

### LEGACY UPGRADE (เฉพาะฐานข้อมูลที่เคยติดตั้ง BILLING NJ ≤ v1.1.0)
1. รัน `sql/008_njacc_features_v11.sql` (ถ้ายังไม่เคยรัน)
2. รัน `sql/legacy/legacy_auth_upgrade.sql` — ล้าง seed เก่า + link auth model เดิมแบบมี guard
3. รัน `sql/009_njacc_auth_hardening.sql`
4. Dashboard → Authentication → Users → เปลี่ยน Email ของผู้ใช้เดิมเป็น opaque identity
   จาก VERIFICATION ข้อ 6 ของ `009` (auth_user_id ไม่เปลี่ยน รหัสผ่านเดิมใช้ได้)
5. รัน `sql/007_njacc_verify.sql`

## 2. Bootstrap ผู้ใช้ (ครั้งเดียว) — SUPER ADMIN 2 คน

| Employee | ชื่อ | แผนก | Login User | Role |
|---|---|---|---|---|
| 0001 | Jamrat Phathep | MANAGER | `jamrat30` | SUPER_ADMIN |
| 0002 | SOONTAREE TIRANUKUL | MANAGER | `soontaree30` | SUPER_ADMIN |

ตัวตนที่ใช้กับ Supabase Auth เป็นแบบ **opaque**: `njacc-auth-<uuid>@auth.billing.local`
→ ไม่มีชื่อจริง / รหัสพนักงาน / เลข 80 อยู่ใน Auth identity หรือใน JWT
(`internal_username` เช่น `jamrat80` ยังเก็บได้ในฐานข้อมูลเป็น metadata ที่เบราว์เซอร์อ่านไม่ได้ และไม่ใช้ authenticate)

1. รัน `006` (หรือ `009` สำหรับระบบเดิม) → ระบบ generate `auth_identity` ให้อัตโนมัติ
   · SUPER ADMIN 2 คนถูก seed เป็น `provisioning_status='PENDING'`, `active=false` (ยัง login ไม่ได้)
2. รัน STEP B2 ใน `006` เพื่อดูอีเมล Auth ที่ต้องสร้าง (ผลลัพธ์อยู่ใน SQL Editor เท่านั้น)
3. Dashboard → Authentication → Users → **Add user** ตามอีเมลนั้น (Auto Confirm ✓) + ตั้งรหัสผ่านเอง
4. รัน STEP C ใน `006` — จะตั้ง `auth_user_id` + `provisioning_auth_user_id` + `provisioning_status='ACTIVE'` + `active=true` ในคำสั่งเดียว (idempotent)
5. ตรวจ `007` ข้อ 13 และ 15a: ต้องไม่มีแถวที่ ACTIVE แต่ `auth_user_id` เป็น NULL

**ระบบที่ติดตั้งไปแล้ว (upgrade):** หลังรัน `009` ให้เข้า Dashboard แก้ Email ของผู้ใช้เดิม
จาก `...80@billing.app` เป็นค่า opaque ที่ได้จาก VERIFICATION ข้อ 6 ของ `009`
(`auth_user_id` ไม่เปลี่ยน รหัสผ่านเดิมใช้ได้ ไม่ต้อง link ใหม่)

**ไม่มีรหัสผ่านอยู่ในไฟล์ใดของโปรเจกต์** — ตั้งใน Dashboard เท่านั้น

## 2.0 ลำดับ "ให้เข้าระบบได้ก่อน" (LOGIN FIRST)

รันตามนี้แล้วจะ login ได้ — ใช้ `sql/LOGIN_BOOTSTRAP.sql` ช่วยตรวจทีละขั้น

| ขั้น | ทำอะไร | ตรวจอย่างไร |
|---|---|---|
| 1 | รัน SQL `001 → 002 → 003 → 004 → 005 → 006 → 008 → 009` (ห้ามรัน `sql/legacy/*`) | `LOGIN_BOOTSTRAP` ส่วน A: tables=19, `njacc_app_status` = 1, เรียกได้ |
| 2 | ดูอีเมล Auth แบบ opaque | `LOGIN_BOOTSTRAP` ส่วน B |
| 3 | Dashboard → Authentication → Users → Add user (Auto Confirm ✓ + ตั้งรหัสผ่านเอง) | เห็น user ในรายการ |
| 4 | รัน `LOGIN_BOOTSTRAP` ส่วน C (STEP C) | ส่วน D: `active=t`, `ACTIVE`, `linked=t`, NOTICE `D4 ... OK` |
| 5 | Deploy Edge Function `njacc-login` โดย **ปิด Verify JWT** | `OPTIONS /functions/v1/njacc-login` ต้องได้ 2xx |
| 6 | Deploy `njacc-admin-user` โดย **เปิด Verify JWT** | ใช้หลัง login แล้วเท่านั้น |
| 7 | Login ด้วย **`jamrat30`** (ไม่ใช่ `jamrat`) + รหัสจากขั้น 3 | Console ต้องไม่มี 404 `njacc_app_status` |

**สาเหตุที่พบบ่อยเมื่อ login ไม่ผ่าน**
- Console ขึ้น `404 njacc_app_status` → ยังไม่ได้รัน SQL (ขั้น 1)
- Console ขึ้น CORS / `ERR_FAILED` ที่ `njacc-login` → ยังไม่ได้ deploy Edge Function หรือ **ยังเปิด Verify JWT ไว้**
  (ฟังก์ชันนี้ถูกเรียกตอนยังไม่มี JWT — ถ้าเปิดไว้ preflight จะไม่ผ่านและเบราว์เซอร์รายงานเป็น CORS)
- `NJACC_LOGIN_NOT_FOUND` → ยังไม่ได้ link (ขั้น 4) หรือพิมพ์ชื่อผู้ใช้ผิด

## 2.1 ติดตั้ง Edge Functions (จำเป็น 2 ตัว)

| Function | หน้าที่ |
|---|---|
| `njacc-login` | รับ `login_name` + `password` → resolve ตัวตนภายในฝั่ง server → คืนเฉพาะ token |
| `njacc-admin-user` | สร้างผู้ใช้ใหม่แบบ retry-safe: BEGIN (PENDING) → สร้าง auth user → mark AUTH_CREATED → COMPLETE (ACTIVE) · timeout จะ reconcile กับ DB ก่อนตัดสินใจลบ · request_id ซ้ำไม่สร้างซ้ำ |

### PASSWORD ACTIVATION FLOW = **NOT IMPLEMENTED**
ระบบ **ไม่สร้างและไม่ส่งรหัสผ่านผ่านเบราว์เซอร์** โดยเจตนา
เมื่อสร้างผู้ใช้สำเร็จ auth user จะถูกสร้างแบบ**ไม่มีรหัสผ่าน** ผู้ดูแลต้องตั้งรหัสผ่านให้ผ่าน
Supabase Dashboard → Authentication → Users (ดูอีเมล opaque ของผู้ใช้จาก `009` VERIFICATION ข้อ 6)
หากต้องการ invite / reset-password flow ในแอป ต้องสั่งเพิ่มเป็นงานรอบถัดไป

Dashboard → **Edge Functions** → New function → วางไฟล์จาก `supabase/functions/<ชื่อ>/index.ts` → Deploy

| Function | Verify JWT | เหตุผล |
|---|---|---|
| `njacc-login` | **ปิด (false)** | ถูกเรียกก่อนผู้ใช้มี JWT · ฟังก์ชันตรวจ login_name + password กับ GoTrue เอง |
| `njacc-admin-user` | **เปิด (true)** | ใช้เฉพาะผู้ที่ล็อกอินแล้ว · RPC ตรวจ SUPER_ADMIN ซ้ำที่ DB |

ถ้า deploy ด้วย Supabase CLI ค่าเหล่านี้อยู่ใน `supabase/config.toml` ให้แล้ว
Secrets ที่ต้องมี: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (ปกติ Supabase ใส่ให้อัตโนมัติ)

**Security model ที่ได้จริง**
- เบราว์เซอร์ไม่มี mapping `jamrat30 → jamrat80@...` และไม่ได้รับตัวตนภายในจาก API ใด
- `njacc_profiles` / `njacc_user_access` ไม่ GRANT ให้ `authenticated` และไม่มี policy → `supabase.from('njacc_profiles').select()` อ่านไม่ได้
- อ่านโปรไฟล์ได้ทางเดียวคือ `njacc_my_profile()` ซึ่งคืนเฉพาะ id / employee_code / full_name / department / login_name / role / active / access
- JWT ของ GoTrue ยังมี email claim ตามมาตรฐาน แต่ค่าที่อยู่ในนั้นเป็น opaque identity จึงไม่เปิดเผยชื่อจริงหรือเลข 80
- สร้างผู้ใช้ใหม่: เบราว์เซอร์ส่งเฉพาะ safe fields + `request_id` — auth identity สร้างโดยฐานข้อมูล (DEFAULT) ไม่ใช่โดยเบราว์เซอร์
- Create User ไม่ทิ้ง orphan: ถ้าสร้าง auth user หรือ link ไม่สำเร็จ ระบบลบ auth user ที่เพิ่งสร้างและลบ profile PENDING ของ request นั้นให้ (ลบเฉพาะแถวที่ request นี้สร้าง และต้องไม่มี dependency)
- ตรวจโปรไฟล์ค้างได้จาก VERIFICATION ของ `007` ข้อ 15a–15e และ audit `CREATE_USER_BEGIN / COMPLETE / ROLLBACK`
- **สร้างผู้ใช้มีทางเดียว**: Edge Function `njacc-admin-user` → `njacc_admin_begin_user`
  · `njacc_admin_upsert_user` เป็น **EDIT ONLY** (ส่ง id ว่างจะได้ `NJACC_CREATE_USER_USE_EDGE`)
  · แก้ role/active ของ SUPER_ADMIN คนสุดท้ายไม่ได้ (`NJACC_LAST_SUPER_ADMIN`) — ตรวจที่ DB
- **Auth reconciliation**: ถ้า Auth API timeout หรือคืน duplicate ระบบจะ `njacc_admin_find_auth_user`
  หา auth user ของ opaque identity เดิมก่อนเสมอ — ไม่สร้างซ้ำ ไม่ลบมั่ว
  ถ้าเจอ auth user ที่เป็นของโปรไฟล์อื่น → `AUTH_IDENTITY_CONFLICT` (ไม่ยึดของคนอื่น)
- **LOGIN audit** บันทึกครั้งเดียวหลัง authenticate สำเร็จ ผ่าน `njacc_log_login_success`
  (best-effort — audit ล้มไม่ทำให้ login ล้ม) · `njacc_my_profile()` เป็น READ-ONLY ไม่เขียน audit
- **Audit sanitization**: `njacc_list_audit` ตัด key อ่อนไหว (password/auth_identity/auth_user_id/token/…) ที่ฝั่ง server
- **ขอบเขต Grant**: SQL ทุกไฟล์ REVOKE/GRANT เฉพาะ 18 ตาราง `njacc_` แบบระบุชื่อ
  ไม่มี `ON ALL TABLES IN SCHEMA public` และไม่มี statement ใดแตะสิทธิ์ของตารางอื่นใน public schema
  (`service_charge_records` / `advance_charge_records` / `app_users` ไม่ถูกแตะเลย — ตรวจซ้ำได้จาก `007` ข้อ 16d ก่อน/หลัง migration)
- **DB Invariants** (CHECK บังคับที่ฐานข้อมูล ไม่พึ่ง application):
  ACTIVE ⇒ มี `auth_user_id` · AUTH_CREATED ⇒ มี `provisioning_auth_user_id` · `active=true` ⇒ provision สำเร็จแล้ว
- **Login guard**: `njacc_auth_lookup` resolve เฉพาะโปรไฟล์ที่ `active=true` + `ACTIVE` + link แล้ว
  (โปรไฟล์ที่ provision ค้างจะ login ไม่ได้)

## 3. Deploy ผ่าน GitHub Website (วิธีเดียวที่ใช้)

1. github.com → repo → **Add file → Upload files** → ลากทั้งโฟลเดอร์นี้ → Commit
   (ไฟล์ทั้งหมด ≤100 ไฟล์ ต่อการอัปโหลด — โปรเจกต์นี้มี ~90 ไฟล์)
2. เปิดผ่าน GitHub Pages / hosting ที่ชี้ไปที่ repo

## 4. Force Update + Maintenance (ทุกครั้งที่ปล่อยเวอร์ชันใหม่)

**ลำดับที่ถูกต้อง — ห้ามสลับ:**

1. แก้เลขเวอร์ชันใหม่ให้ตรงกัน 2 จุดในโค้ด: `assets/js/core/config.js` (`APP_VERSION`) และ `index.html` (`window.__BUILD` + `?v=` ทุกบรรทัด)
2. **อัปโหลด Release ใหม่ทั้งชุดขึ้น GitHub ให้เสร็จก่อน** (release ครบ = เงื่อนไขก่อนเริ่ม Maintenance)
3. รันใน SQL Editor:
   ```sql
   SELECT public.njacc_set_deploy_version('1.0.1');
   ```
   → server ตั้ง `maintenance_active=true` + หน้าต่างเวลา **10 นาที** (เวลา server เป็นหลัก — หลายเครื่องเช็คพร้อมกันไม่รีเซ็ต timer)
4. ผลอัตโนมัติกับผู้ใช้ทุกคน (เช็คตอน start / เปลี่ยนหน้า / สลับแท็บ / เน็ตกลับมา / ทุก 60 วิ):
   - sign out ทันที + ล้าง session + บล็อค login
   - เห็นข้อความ: *ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที* พร้อมเวลานับถอยหลัง
   - ครบเวลา → หน้าโหลดใหม่พร้อม cache-bust → ต้อง login ใหม่ (session เก่าไม่ถูกกู้คืน)
5. ถ้าอัปโหลดไม่ครบ/พลาด: **อย่า** ปิด maintenance — ต่อเวลาได้ด้วย
   ```sql
   UPDATE public.njacc_settings SET value=(now()+interval '10 minutes')::text WHERE key='maintenance_until';
   ```
   แล้วอัปโหลดให้ครบก่อนปล่อยหมดเวลา

หมายเหตุ: ไม่ใช้ Service Worker ในระบบนี้ (ตัดปัญหา cache ค้าง) — HTML มี no-cache meta และ asset ทุกตัวโหลดด้วย `?v=`

## 5. เมนู (FINAL LOCK)

```
💼 SERVICE CHARGE → NJ / DSV / Maersk / Kuehne / Rhenus
💳 ADVANCE CHARGE → NJ / DSV / Maersk / Kuehne / Rhenus
🧾 ACCOUNTING     → Report / Receipt / ใบหัก ณ ที่จ่าย
⚙️ SYSTEM         → Backup / ผู้ใช้งาน / ออกจากระบบ
```
หน้า "ข้อมูลหลัก" (`#/masters`) และ "ประวัติการทำงาน" (`#/audit`) ยังใช้งานได้สำหรับ ADMIN
ผ่าน URL โดยตรง แต่ **ไม่แสดงใน Sidebar** ตาม Requirement ล็อก

## 6. สถานะการทดสอบของ Release นี้

- `node --check` ผ่านทุกไฟล์ JS ✅ · import path resolution ผ่าน ✅ · CSS brace balance ผ่าน ✅
- SQL: manual review — **ยังไม่ได้รันกับ Supabase จริง (NOT TESTED)**
- Edge Functions `njacc-login` / `njacc-admin-user`: **NOT TESTED** (ต้อง deploy แล้วทดสอบจริง)
- Create User: rollback / retry / reconciliation / concurrent duplicate — **NOT TESTED** (ต้องทดสอบหลัง deploy)
- Production `sytgqjglcnsabcszbngg`: **ยังไม่ได้รัน DDL ใด ๆ** — รอบนี้เป็น Source fix เท่านั้น
- RLS / Grant / direct-select test: **SOURCE VERIFIED เท่านั้น — NOT TESTED กับ DB จริง**
- Toolbar/Export/Bulk tools, Row actions, Pagination: **NOT TESTED** (ต้องทดสอบกับข้อมูลจริง)
- BILLING เดิม: ไม่มี runtime dependency — ที่พบในไฟล์เป็น existence check / comment เท่านั้น


---

## 7. ความหมายตัวเลขในหน้ารายการ (สำคัญ)

| ชื่อที่แสดง | ค่าที่ใช้ | หมายเหตุ |
|---|---|---|
| Service charge / Advance | `service_amount` / `advance_amount` | จาก INVOICE ที่ ISSUED หรือจาก snapshot ที่ import |
| Amount | `subtotal` | ยอดก่อน VAT |
| VAT 7% | `vat_amount` | |
| WHT 3% | `wht_amount` | |
| **Total Amount** | **`net_payable` = Gross − WHT** | ความหมายเดียวกับ Billing เดิม (Net after WHT) |
| (ไม่แสดงในตาราง) | `gross_total` = subtotal + VAT | ยอดของระบบบัญชี ใช้ตัดชำระ/Report |

- งานที่ยังไม่มี INVOICE และไม่มี snapshot → ทุกช่องเงินแสดง `-` (ไม่ใช่ `0.00`)
- **ตรวจ Production BILLING เดิมแล้วพบว่า Amount ≠ Service+Advance ใน 64% ของแถว**
  ระบบใหม่จึงไม่คำนวณ Amount แทนข้อมูลเก่า — Import เก็บค่าตามไฟล์ต้นทางลง `njacc_job_financial_snapshot` ตรง ๆ
- Report ฝั่งบัญชีใช้ **Gross** · หน้ารายการใช้ **Net Payable** (มี tooltip กำกับทุกช่อง)

## 8. Due Date / Remaining
- `effective due` = due ของ **INVOICE ที่ ISSUED** ถ้ามี, ไม่งั้นใช้ due ของงาน (INVOICE VOID ไม่ถูกนับ)
- ใช้ค่าเดียวกันทั้ง คอลัมน์ Due, Remaining, Due filter และ KPI Overdue
- **CLOSE ≠ PAID**: งาน CLOSE ที่ INVOICE ยัง UNPAID/PARTIAL ยังแสดง Remaining ตามปกติ

## 9. Import / Upload
- **Upload (Main)** = Import Engine จริง อ่านหัวคอลัมน์ไฟล์ Billing เดิม 27 คอลัมน์
  · `Invoice No.` → `source_invoice_no` (ไม่ใช่ accounting invoice)
  · ยอดเงิน → `njacc_job_financial_snapshot` (ไม่สร้าง INVOICE ปลอม)
  · scope `charge_type`/`company_group` บังคับจากหน้าที่กด — ไม่อ่านกลุ่มจากไฟล์
  · คอลัมน์ที่ไม่มีใน header จะไม่ถูกแก้ · ซ้ำในไฟล์ยึดแถวล่างสุดและรายงาน
  · master ใช้ exact-normalized เท่านั้น ไม่มี fuzzy — ไม่พบ/กำกวมจะข้ามและรายงาน
  · ส่งเป็น batch 100 แถว/ครั้งผ่าน `njacc_import_jobs_batch`
- **APL Billing** = อัปเดต `i_billing_apl` เท่านั้น (batch)
- **Upload 1.9** = อ่าน Invoice=คอลัมน์ C, ETA=M, ETD=N · อัปเดตเฉพาะ eta/etd · ค่าว่างไม่ทับของเดิม
- **Contact List** = อัปโหลด LIST NAME (Company Invoice → Contact) เก็บที่ `njacc_company_invoices.contact_name`
  · คอลัมน์ Contact ในตาราง = `coalesce(job.contact, company.contact_name)`

## 10. Export
- **Export Excel / ทั้งหมด** = 27 คอลัมน์ compatibility (หัว `Total Amout` สะกดตามไฟล์เดิมโดยตั้งใจ)
- **Export Customer** = 1 ไฟล์ต่อ 1 ลูกค้า รวมเป็น ZIP
- **Export SOA** = 21 คอลัมน์ · **บังคับเลือก Customer ก่อน** · ช่องที่ New DB ไม่มีข้อมูลจะเว้นว่าง (ไม่เดา)
- **Export Excel CASE** = เฉพาะ MAERSK · เฉพาะแถวที่ Customer Job No. ว่าง/N/A · แยก CASE / NO CASE เป็น ZIP

## 11. สถานะที่ยังไม่ได้ทำ (แจ้งตามจริง)
- **WHT SETTLEMENT = NOT IMPLEMENTED** — การตัดชำระยังคิดจากเงินสดเทียบ Gross เท่านั้น
  ยังไม่ผูก `njacc_withholding_docs` เข้ากับ outstanding ของ INVOICE
  (ถ้า WHT ถูกหักจริง INVOICE จะยังเหลือ outstanding เท่ายอด WHT จนกว่าจะทำส่วนนี้)
- **PASSWORD ACTIVATION FLOW = NOT IMPLEMENTED**
- SOA: Container Number / PO / Kewill dates ยังไม่มีในฐานข้อมูลใหม่ → เว้นว่าง
