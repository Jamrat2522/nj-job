# USER_DELETE_REPORT — ลบบัญชี USER ที่ยังไม่ได้เชื่อมพนักงาน

Build `njhr-v2-7d92b738` → **`njhr-v2-9f4d7232`**

---

## 1. ปัจจุบันมี RPC Delete หรือไม่

**มี 1 ตัว แต่ใช้ไม่ได้ — จึงสร้างใหม่ ไม่แก้ของเดิม**

```
admin_delete_user(app_code_param text, target_id uuid, caller_username text DEFAULT NULL) → jsonb
SECURITY DEFINER · owner = postgres
grant execute: PUBLIC, postgres, anon, authenticated, service_role
```

อ่าน Body จริงแล้วพบว่า **ทำงานบน `public.users` ไม่ใช่ `public.app_users`**

```sql
SELECT role INTO v_caller_role FROM public.users WHERE app_code = app_code_param ...
DELETE FROM public.users WHERE id = target_id AND app_code = app_code_param;
```

Loop เคลียร์ FK ก็กรองด้วย `tgt_rel.relname = 'users'` เท่านั้น

**เหตุผลที่ไม่แตะ 3 ข้อ**

1. เป็นคนละตารางกับที่ HR V2 ใช้ — แก้ให้รองรับ `app_users` = เขียนใหม่ทั้งตัว และกระทบทุกแอปที่เรียกอยู่
2. รับ `caller_username` เป็นพารามิเตอร์ ไม่ใช่ `p_token` — เบราว์เซอร์ปลอมชื่อผู้เรียกได้
   (ยิ่งกว่านั้น ถ้าส่ง `caller_username = NULL` จะ **ข้ามด่านตรวจสิทธิ์ทั้งบล็อก**)
3. `grant` ให้ `PUBLIC` และ `anon` — ระบบ HR V2 ทุก RPC ใช้ token-based

---

## 2. `app_users` ถูก Foreign Key จาก Table ใดบ้าง

| Constraint | ตาราง | คอลัมน์ | ON DELETE |
|---|---|---|---|
| `njhr_sessions_app_user_id_fkey` | `njhr_sessions` | `app_user_id` | **CASCADE** |
| `notifications_user_id_fkey` | `notifications` | `user_id` | **CASCADE** |
| `njhr_activation_requests_decided_by_fkey` | `njhr_activation_requests` | `decided_by` | **NO ACTION — บล็อก** |
| `njhr_activation_requests_linked_user_id_fkey` | `njhr_activation_requests` | `linked_user_id` | **NO ACTION — บล็อก** |

**คอลัมน์ที่เก็บชื่อผู้ใช้แต่ไม่มี FK** — `audit_log.actor` และ `created_by` / `updated_by` อีก 100+ คอลัมน์
ทั้งหมดเป็น `text` → ลบบัญชีแล้ว **ประวัติไม่หาย**

---

## 3. Hard Delete ปลอดภัยหรือไม่ — **ปลอดภัย**

ผลตรวจจริงจาก `B2_inspect_user_delete_blockers.sql`

```
VERDICT: HARD DELETE ปลอดภัยสำหรับบัญชีชุดนี้
         ไม่มีบัญชีใดถูก njhr_activation_requests อ้างอิง

candidates                 54
blocked_accounts            0
blocked_by_decided_by       0
blocked_by_linked_user_id   0
sessions                    0
notifications               0
njhr_push_subs              0
njhr_ann_reads              0
audit_log_rows_by_username  0
```

**Username / Email ปลดล็อกจริง** — unique index เป็นคู่กับ `app_code` ทุกตัว

```
app_users_username_app_code_key        (username, app_code)
app_users_lower_username_appcode_uidx  (lower(username), app_code)
app_users_email_app_code_uniq          (email, app_code)
```

`candidate_usernames_also_in_other_app_code = 105` → ชื่อซ้ำกับแอปอื่นเยอะ
แต่ index ผูกกับ `app_code` การลบใน `salary` จึงไม่กระทบ `pdf` `amend` `advance` `billing` `timeline` `transport`

**เงื่อนไข `role = 'USER'` ใช้ได้ 100%**

```
USER         105  (เชื่อมแล้ว 51 · ยังไม่เชื่อม 54)
ADMIN          4  (ยังไม่เชื่อม 0)
SUPER_ADMIN    2  (ยังไม่เชื่อม 0)
```

ไม่มี ADMIN / SUPER_ADMIN ตัวใด `employee_id IS NULL` → ไม่มีทางลบผิดตัว

**RLS** — `app_users` เปิด RLS 4 policy แต่ `force_rls = false` และ owner = `postgres`
SECURITY DEFINER จึงทำงานได้ตามปกติ

---

## 4. ไฟล์ที่แก้

| ไฟล์ | สิ่งที่แก้ |
|---|---|
| `src/13-view-admin-users.js` | `usMenu()` เพิ่ม `canDelete` · `usDelete()` เรียก `njhr_user_delete` |
| `supabase-new/B3_user_delete.sql` | **ใหม่** — RPC `njhr_user_delete` |
| `supabase-new/B1_inspect_user_delete.sql` | **ใหม่** — READ-ONLY |
| `supabase-new/B2_inspect_user_delete_blockers.sql` | **ใหม่** — READ-ONLY |
| `harness/user_delete_test.js` | **ใหม่** — ชุดทดสอบ |
| `rollback/before_user_delete/` | **ใหม่** — 111 ไฟล์ + `ROLLBACK.md` |

---

## 5. SQL Migration ที่ต้องรัน

**`supabase-new/B3_user_delete.sql`** — สร้าง RPC 1 ตัว

- ไม่สร้าง / ไม่ลบ / ไม่แก้ตารางใด ๆ
- ไม่แตะ `admin_delete_user` · `njhr_login` · `njhr_ctx` · `njhr_user_save` · `njhr_user_link` · `njhr_user_password`
- มี PRE-FLIGHT ตรวจว่า `app_users` `njhr_sessions` `audit_log` `njhr_ctx` `njhr_user_guard` มีจริง
  และ `audit_log` มีคอลัมน์ครบ 10 ตัวที่ RPC เขียน
- รันซ้ำได้ (`create or replace`)

### ลำดับด่านใน `njhr_user_delete(p_token, p_user_id)`

| # | ด่าน | ข้อความเมื่อไม่ผ่าน |
|---|---|---|
| 1 | Session ถูกต้อง (`njhr_user_guard`) | เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่ |
| 2 | ผู้เรียกเป็น SUPER_ADMIN | เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบบัญชีได้ |
| 3 | Target อยู่ใน `app_code='salary'` | ไม่พบบัญชีผู้ใช้นี้ในระบบ HR |
| 4 | Target ไม่ใช่บัญชีผู้เรียก | ลบบัญชีของตนเองไม่ได้ |
| 5 | Target `role = 'USER'` | ลบได้เฉพาะบัญชีสิทธิ์ USER เท่านั้น (บัญชีนี้เป็น X) |
| 6 | Target `employee_id IS NULL` | บัญชีนี้เชื่อมกับข้อมูลพนักงานแล้ว ต้องยกเลิกการเชื่อมก่อน |
| 7 | ไม่ถูก `njhr_activation_requests` อ้างอิง | บัญชีนี้ผูกอยู่กับคำขอเปิดใช้งานบัญชี จึงลบไม่ได้ |
| 8 | เพิกถอน Session ของ Target | — |
| 9 | `DELETE FROM app_users` (จำกัด `app_code='salary'` ซ้ำ) | — |
| 10 | เขียน `audit_log` action `USER_DELETE` พร้อม `old_value` | — |

**สิทธิ์:** SUPER_ADMIN เท่านั้น — ระบบเดิมไม่เคยมี RPC ลบ ADMIN จึงไม่เคยมีสิทธิ์นี้ ไม่เพิ่มสิทธิ์ใหม่โดยเดา

---

## 6. จุด Frontend ที่แก้

### Before

```js
['del', '🗑️', 'ลบบัญชี', !isSelf, 't-red']
```
แสดงกับ **ทุกบัญชี** และ `usDelete()` เรียก `njhr_user_save` ด้วย `p_employee: null, p_is_active: false`
= ปิดใช้งาน + **ตัดการเชื่อมพนักงานทิ้ง** ไม่ใช่ลบ

### After

```js
var canDelete = !isSelf && me && me.role === 'SUPER_ADMIN' &&
                u.role === 'USER' && !u.employee_id;
['del', '🗑️', 'ลบบัญชี', canDelete, 't-red']
```
`usDelete()` เรียก `njhr_user_delete` · Confirmation ตามสเปกข้อ 3 · สำเร็จแล้ว `viewUsers(el)` รีเฟรชตาราง จำนวนบัญชี และตัวกรองทันที

---

## 7. ผล Test 15 ข้อ — `harness/user_delete_test.js`

**PASS 26 · FAIL 0 · NOT TESTED 3**

| # | Test Case | ผล | หลักฐาน |
|---|---|---|---|
| 1 | USER + `employee_id` NULL → มีเมนู "ลบบัญชี" | PASS | `edit,role,pass,toggle,link,del` |
| 2 | USER ที่เชื่อม `employee_id` แล้ว → ไม่มีเมนูลบ | PASS | `edit,role,pass,toggle,link,unlink` |
| 3 | ADMIN → ลบไม่ได้ | PASS | ไม่มีเมนู + ปลอม Request ถูกปฏิเสธ |
| 4 | SUPER_ADMIN (เป้าหมาย) → ลบไม่ได้ | PASS | ไม่มีเมนู |
| 5 | `app_code` อื่นไม่ถูกแตะ | PASS | `billing/freeuser1` ยังอยู่ · ปลอม Request ถูกปฏิเสธ |
| 6 | กดยกเลิก Confirmation → ไม่มีการเปลี่ยนแปลง | PASS | เรียก RPC 0 ครั้ง |
| 7 | ลบ USER ที่ยังไม่เชื่อม → สำเร็จ | PASS | แถวหายทันที · `ทั้งหมด 4 บัญชี` · Filter UNLINKED รีเฟรช |
| 8 | หลังลบค้น Username เดิม → ไม่พบใน salary | PASS | 0 แถว |
| 9 | Session เดิมใช้งานไม่ได้ | NOT TESTED (ยืนยันฝั่ง SQL) | `njhr_ctx` → "เซสชันหมดอายุ" |
| 10 | Audit Log ที่ต้องเก็บไม่สูญหาย | NOT TESTED (ยืนยันฝั่ง SQL) | audit เพิ่มจาก 2 → 3 แถว |
| 11 | Username/Email เดิมสมัครใหม่ได้ | PASS | INSERT สำเร็จบน PostgreSQL จริง |
| 12 | ปลอม Request ลบ USER ที่เชื่อมแล้ว → ปฏิเสธ | PASS | "บัญชีนี้เชื่อมกับข้อมูลพนักงานแล้ว…" |
| 13 | ไม่กระทบข้อมูล `employees` | PASS | `employees=10` ก่อน/หลังเท่ากัน |
| 14 | ไม่กระทบ `leave_requests` | PASS | RPC ไม่มีคำสั่งใดแตะ |
| 15 | ไม่กระทบ FLOW Login / ลา / อนุมัติ | NOT TESTED (ครอบคลุมโดยชุดอื่น) | `p2_suite` + `p3_feature` |

### ทดสอบ SQL จริงบน PostgreSQL 16.14

สร้าง schema จำลองตรงตามโครงสร้าง Production (FK · enum · RLS · unique index) แล้วติดตั้ง RPC จริง

**ปฏิเสธถูกทั้ง 7 กรณี**

```
ADMIN ลบ                → เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบบัญชีได้
USER ลบ                 → คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน
ลบ ADMIN                → ลบได้เฉพาะบัญชีสิทธิ์ USER เท่านั้น (บัญชีนี้เป็น ADMIN)
ลบ USER ที่เชื่อมแล้ว     → บัญชีนี้เชื่อมกับข้อมูลพนักงานแล้ว ต้องยกเลิกการเชื่อมก่อน
ลบบัญชี app_code อื่น     → ไม่พบบัญชีผู้ใช้นี้ในระบบ HR
ลบตัวเอง                → ลบบัญชีของตนเองไม่ได้
Token ปลอม              → เซสชันหมดอายุ
ถูก activation อ้างอิง   → บัญชีนี้ผูกอยู่กับคำขอเปิดใช้งานบัญชี จึงลบไม่ได้
```

**ลบสำเร็จ**

```
ก่อน:  salary=12  billing_free1=1  emp=10  notif=2  audit=2  sess=6
ผล:    deleted=free1  sessions_removed=2
หลัง:  salary=11  billing_free1=1  emp=10  notif=1  audit=3  sess=4

audit: USER_DELETE | actor=boss | ลบบัญชี free1 (ยังไม่เชื่อมพนักงาน) · เพิกถอน session 2 รายการ
สมัคร username/email เดิมใหม่: สำเร็จ
```

---

## 8. ยืนยันไม่กระทบระบบเดิม

| ชุดทดสอบ | ผล |
|---|---|
| `build.js --check` + `check-all-js.js` | **CHECK PASSED** — Build ID ตรง 3 จุด `njhr-v2-9f4d7232` |
| `compare.js` (DOM regression 27 route × 6 มิติ) | **ตรวจ 162 จุด · ต่าง 0 จุด · REGRESSION PASS** |
| `p2_suite.js` | **PASS 80 · FAIL 0** |
| `p3_feature.js` | **PASS 76 · FAIL 0 · NOT TESTED 10** |
| `p2_sw.js` | **PASS 26 · FAIL 0** |
| `name_split_test.js` (รอบก่อน) | **PASS 28 · FAIL 0 · NOT TESTED 1** |
| `user_delete_test.js` (รอบนี้) | **PASS 26 · FAIL 0 · NOT TESTED 3** |

**Deploy 35 ไฟล์ — เปลี่ยน 5:** `compat/app-legacy.js` `asset-manifest.js` `config.js` `index.html` `sw.js`
`runtime/core.js` · `views/**` · `styles.css` · `mobile.css` — MD5 เดิมทุกไบต์

---

## 9. ลำดับการติดตั้ง

1. **รัน `supabase-new/B3_user_delete.sql`** ใน Supabase SQL Editor ก่อน
   ดูผล `install_report` ต้องได้ `function_installed = 1` · `admin_delete_user_untouched = true`
2. อัปโหลด `runtime/` `views/` `compat/` `assets/`
3. อัปโหลด `styles.css` `mobile.css` `asset-manifest.js`
4. อัปโหลด `config.js`
5. อัปโหลด `index.html`
6. อัปโหลด `sw.js` **ท้ายสุดเสมอ**

ตรวจ: Console → `NJHR_DIAG().build` = `njhr-v2-9f4d7232`

> ถ้าอัปโหลด Frontend ก่อนรัน SQL เมนู "ลบบัญชี" จะขึ้น error `function njhr_user_delete does not exist`
> ระบบส่วนอื่นไม่กระทบ

---

## 10. ยังไม่ได้ทำ (ระบุตรง ๆ)

| รายการ | เหตุผล |
|---|---|
| ทดสอบบน Production จริง 54 บัญชี | ห้ามลบข้อมูลจริง — ทดสอบด้วย fixture + PostgreSQL จำลอง |
| ล้าง enum `user_role` ที่มีขยะ 10 ค่า | นอกขอบเขต · ไม่มีแถวใดใช้ค่าเหล่านั้น |
| ล้าง unique index ที่ซ้ำซ้อน 6 ตัวบน `app_users` | นอกขอบเขต · ไม่กระทบการทำงาน |
| iPhone Safari (WebKit จริง) | สภาพแวดล้อมทดสอบมีเฉพาะ Chromium |
