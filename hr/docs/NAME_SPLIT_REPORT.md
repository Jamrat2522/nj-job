# NAME_SPLIT_REPORT — แยกชื่อและนามสกุลพนักงานให้เป็นคนละฟิลด์

Build `njhr-v2-eed72c68` → **`njhr-v2-7d92b738`**

---

## 1. โครงสร้าง `employees` ปัจจุบัน (ตรวจของจริง ไม่เดา)

Pre-flight ใน `supabase-new/48_employees.sql` ยืนยัน 43 คอลัมน์ · คอลัมน์ชื่อที่ใช้จริง

| Column | สถานะ |
|---|---|
| `id` (uuid, PK) | มี |
| `emp_code` (text) | มี |
| `prefix` (text) | มี |
| `first_name` | ✅ มี — ชื่อภาษาไทย |
| `last_name` | ✅ มี — นามสกุลภาษาไทย |
| `first_name_en` | ✅ มี — ชื่อภาษาอังกฤษ |
| `last_name_en` | ✅ มี — นามสกุลภาษาอังกฤษ |
| `nickname` | มี |

**ไม่มีคอลัมน์ `full_name` / `name` / `employee_name` ใน `employees`**

`full_name` ที่เห็นทั่วระบบเป็น **ชื่อคอลัมน์ผลลัพธ์ของ RPC** ที่ concat ตอน SELECT เท่านั้น
(`first_name || ' ' || coalesce(last_name,'')`) ไม่ใช่ข้อมูลที่เก็บ

`app_users.full_name` เป็นคอลัมน์จริง แต่อยู่ในตารางกลางที่หลายแอปใช้ร่วมกัน
และผูกกับ Login/Session — **อยู่นอกขอบเขต ไม่แตะ**

---

## 2. จุดที่เก็บแยกถูกต้องอยู่แล้ว (ไม่แก้)

| จุด | สถานะ |
|---|---|
| `njhr_emp_save` INSERT | เขียนแยก 4 ฟิลด์ |
| `njhr_emp_save` UPDATE | เขียนแยก 4 ฟิลด์ · `p_data ? 'key'` = ไม่ส่ง = ไม่เปลี่ยนค่าเดิม |
| `njhr_emp_get` | คืนแยก 4 ฟิลด์ |
| `njhr_emp_import` | เขียนแยก `first_name` / `last_name` |
| `njhr_ctx` · `njhr_list_users` · `njhr_emp_list` | concat เฉพาะตอน SELECT เพื่อแสดงผล |
| `leave_requests.employee_id` → `employees.id` | ไม่แตะชื่อเลย |
| `app_users.employee_id` → `employees.id` | ผูกด้วย UUID แล้ว |

---

## 3. จุดที่ยังนำชื่อกับนามสกุลปนกัน — ที่แก้ในรอบนี้

| # | ไฟล์ | ปัญหาเดิม | แก้เป็น |
|---|---|---|---|
| **A** | `src/40-view-employees-form.js` | ฟอร์มเพิ่ม/แก้ไขพนักงานไม่มีช่อง `first_name_en` / `last_name_en` และ payload ไม่ส่ง → แก้ชื่ออังกฤษผ่าน UI ไม่ได้เลย ทั้งที่ DB รองรับครบ | เพิ่ม 2 ช่องแยก · ส่งใน payload · Label ระบุภาษาชัดเจน |
| **B** | `src/06-auth-supabase.js` | หน้าเปิดใช้งานบัญชี Label = `นามสกุล` ไม่ระบุภาษา ไม่มีข้อความช่วย | `นามสกุลภาษาไทย` + `กรอกให้ตรงกับข้อมูลพนักงานในระบบ` |
| **C** | `src/40-view-employees-form.js` | หน้ารายละเอียด: ชื่อไทยไม่ `.trim()` → นามสกุลว่างเหลือช่องว่างท้าย (บรรทัดภาษาอังกฤษ trim แล้ว) | เพิ่ม `.trim()` |

---

## 4. ไฟล์ที่แก้

| ไฟล์ Source | บรรทัด | สิ่งที่แก้ |
|---|---|---|
| `src/40-view-employees-form.js` | 18 | เพิ่ม `.trim()` ตอนแสดงชื่อไทย |
| `src/40-view-employees-form.js` | 63–64 | Label → `ชื่อ (ภาษาไทย)` / `นามสกุล (ภาษาไทย)` |
| `src/40-view-employees-form.js` | +65–68 | เพิ่มช่อง `first_name_en` / `last_name_en` (ไม่บังคับกรอก) |
| `src/40-view-employees-form.js` | 160–163 | เพิ่ม 2 คีย์ลง payload `njhr_emp_save` |
| `src/06-auth-supabase.js` | 337–348 | Label + ข้อความช่วย + คอมเมนต์ยืนยันตัวจับคู่ |
| `src/06-auth-supabase.js` | 352–353 | `actField()` รองรับข้อความช่วย `f[4]` |

**ไฟล์ใหม่**

- `supabase-new/A1_inspect_employee_name.sql` — Query ตรวจฐานข้อมูลจริง READ-ONLY ทั้งไฟล์
- `harness/name_split_test.js` — ชุดทดสอบ 18 ข้อ
- `rollback/before_name_split/` — 110 ไฟล์ + `ROLLBACK.md` + ZIP ของ build เดิม

**ไม่แตะ:** Login · Session · Approval Workflow · FLOW ลา · ผู้อนุมัติ · OT · Payroll · Attendance
Face Scan · Import/Export Excel · CSS · Database · RPC · การเรียงใน `njhr_emp_list`

---

## 5. SQL Migration ที่ต้องรัน

**ไม่มี**

- Column ที่เพิ่ม: **ไม่มี** — ทั้ง 4 ฟิลด์มีครบและถูกต้องอยู่แล้ว
- Column ที่ลบ: **ไม่มี**
- RPC ที่แก้: **ไม่มี**

มีเพียงไฟล์ตรวจสอบ `A1_inspect_employee_name.sql` ที่เป็น READ-ONLY — ไม่เปลี่ยนแปลงข้อมูลใด ๆ

---

## 6. Before / After

**ก่อน** — ฟอร์มพนักงานมี 2 ช่อง

```
p_data = { first_name:"สมชาย", last_name:"ใจดี", ... }
```
`first_name_en` / `last_name_en` มีใน DB และ `njhr_emp_save` รองรับ แต่แก้ผ่าน UI ไม่ได้

**หลัง** — 4 ช่องแยกชัดเจน แบ่งกลุ่มไทย/อังกฤษ

```
p_data = { first_name:"สมชาย", last_name:"ใจดี",
           first_name_en:"Mary-Jane O'Neil", last_name_en:"van der Berg", ... }
```
ไม่มี `full_name` / `name` / `employee_name` ใน payload (27 keys)

---

## 7. ผล Test 18 ข้อ — `harness/name_split_test.js`

**PASS 28 · FAIL 0 · NOT TESTED 1**

| # | Test Case | ผล | หลักฐาน |
|---|---|---|---|
| 1 | เพิ่มพนักงานใหม่ ชื่อไทย/นามสกุลไทยแยกถูกต้อง | PASS | `{"first_name":"สมชาย","last_name":"ใจดี"}` |
| 2 | เพิ่มชื่ออังกฤษ/นามสกุลอังกฤษแยกถูกต้อง | PASS | `{"first_name_en":"Mary-Jane O'Neil","last_name_en":"van der Berg"}` |
| 3 | แก้เฉพาะชื่อ ไม่กระทบนามสกุล | PASS | `["สมศักดิ์","ใจดี","SOMCHAI","JAIDEE"]` |
| 4 | แก้เฉพาะนามสกุล ไม่กระทบชื่อ | PASS | `["สมชาย","มีสุข","JAIDEE"]` |
| 5 | แก้ชื่ออังกฤษ ไม่กระทบชื่อไทย | PASS | `["สมชาย","SOMSAK"]` |
| 6 | แสดงชื่อไทยรวมกันถูกต้อง | PASS | `"สมชาย ใจดี"` |
| 7 | แสดงชื่ออังกฤษรวมกันถูกต้อง | PASS | `"SOMCHAI JAIDEE"` |
| 8 | USER เดิมยัง Login ได้ | PASS | `hash=#/dashboard` |
| 9 | `employee_id` เดิมไม่เปลี่ยน | PASS | `empId=emp-0001` |
| 10 | ใบลาเดิมยังผูกพนักงานเดิม | PASS | `#/req-history` เปิดได้ · ไม่พบคำต้องสงสัย |
| 11 | เปิดใช้งานบัญชีใช้ `emp_code` + นามสกุลไทย | PASS | `{"p_emp_code":"NJ0001","p_last_name":"ใจดี"}` |
| 12 | ไม่ใช้ `last_name_en` เป็นตัวจับคู่ | PASS | ส่งเฉพาะ `p_emp_code,p_last_name,p_nickname,p_email,p_password` |
| 12b | กรอก `last_name_en` แทนนามสกุลไทยแล้วต้องไม่จับคู่ | **NOT TESTED** | ต้องตรวจฝั่ง SQL จริง — รอผล `A1_inspect_employee_name.sql` |
| 13 | Username เดิมไม่เปลี่ยน | PASS | `username=admin` |
| 14 | Role เดิมไม่เปลี่ยน | PASS | `role=SUPER_ADMIN` |
| 15 | ข้อมูลพนักงานเดิมไม่สูญหาย | PASS | แถว=40 |
| 16 | หน้าจัดการผู้ใช้แสดงชื่อ–นามสกุลถูกต้อง | PASS | พบ `"สมชาย ใจดี"` |
| 16b | นามสกุลว่าง → ไม่เกิดช่องว่างซ้ำ | PASS | ไม่พบ `สมชาย  ` |
| 17 | รายงานเดิมไม่เกิด null / undefined | PASS | ไทย=`"สมหญิง"` EN=`"SOMYING"` · `[]` |
| 18 | ไม่มี Column/ช่อง/คีย์ใหม่ซ้ำกับของเดิม | PASS | ไม่มี `full_name` ทั้งในฟอร์มและ payload |

**STEP 10 (Validation)** — `Mary-Jane O'Neil` / `van der Berg` บันทึกได้ครบ
รับเว้นวรรค · ขีดกลาง · Apostrophe · Trim หัวท้าย · **ไม่เปลี่ยนตัวพิมพ์อัตโนมัติ**

---

## 8. ยืนยันไม่กระทบระบบเดิม

| ชุดทดสอบ | ผล |
|---|---|
| `build.js --check` + `harness/check-all-js.js` | **CHECK PASSED** — Syntax 26 · Manifest 25 · Module 21 · View 27 · Build ID ตรง 3 จุด · SW CORE 8 รายการ |
| `harness/compare.js` (DOM regression 27 route × 6 มิติ) | **ตรวจ 162 จุด · ต่าง 0 จุด · REGRESSION PASS** · console error ก่อน=2 หลัง=2 (403 storage probe เท่ากัน) |
| `harness/p2_suite.js` | **PASS 80 · FAIL 0** · Compatibility 28/28 |
| `harness/p3_feature.js` | **PASS 76 · FAIL 0 · NOT TESTED 10** (เท่าเดิมกับ baseline) |
| `harness/p2_sw.js` | **PASS 26 · FAIL 0** |
| `harness/p2_gate.js` | **PASS 12 · FAIL 0** |
| Responsive ฟอร์มพนักงาน (2 ช่องใหม่) | 360×740 · 768×1024 · 1440×900 — modal ไม่ล้นจอ · ช่องล้น 0 · ช่อง EN แสดงผลครบ |

### ไฟล์ Deploy ที่เปลี่ยน — 6 จาก 35

`asset-manifest.js` · `config.js` · `index.html` · `runtime/core.js` · `sw.js` · `views/employees/form.js`

**29 ไฟล์ที่เหลือ MD5 เดิมทุกไบต์** — ยืนยันด้วย `cmp` รวม `styles.css` · `mobile.css` · `compat/app-legacy.js`

---

## 9. ยังไม่ได้ทำ (ระบุตรง ๆ)

| รายการ | เหตุผล |
|---|---|
| ตรวจ `njhr_activation_submit` / `njhr_activation_link` ของจริง | SQL ไม่มีในโปรเจกต์ — ต้องรัน `A1_inspect_employee_name.sql` บน Supabase จริงก่อน |
| Test ข้อ 12b | ขึ้นกับผลข้างบน |
| เพิ่มคอลัมน์ EN ใน Import/Export Excel | ผู้ใช้สั่งไม่แตะ Template เดิม |
| เปลี่ยนการเรียงใน `njhr_emp_list` เป็น `first_name, last_name` | ผู้ใช้สั่งคงเดิม |
| iPhone Safari (WebKit จริง) | สภาพแวดล้อมทดสอบมีเฉพาะ Chromium |

---

## 10. ลำดับการอัปโหลด

1. `runtime/` `views/` `compat/` `assets/`
2. `styles.css` `mobile.css` `asset-manifest.js`
3. `config.js`
4. `index.html`
5. `sw.js` **ท้ายสุดเสมอ**

ตรวจหลังอัปโหลด: Console → `NJHR_DIAG().build` ต้องได้ `njhr-v2-7d92b738`
