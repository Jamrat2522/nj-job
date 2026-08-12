# NJ HR V.10 — ชุดไฟล์รวม

อัปเดตล่าสุด: 2 สิงหาคม 2569

---

## 1. ไฟล์แอปพลิเคชัน (อัปโหลดขึ้นเว็บ)

| ไฟล์ | หมายเหตุ |
|---|---|
| `index.html` | หน้าเดียวจบ · ฝัง Supabase URL + anon key ไว้แล้ว |
| `app.js` | โค้ดทั้งระบบ |
| `styles.css` | |
| `sw.js` | Service Worker — **เวอร์ชัน `njhr-v36`** |
| `report-template.js` | Template Excel ของ REPORT ALL (3 Sheet เดิม) |
| `master-salary.js` | Template ของรวมเงินเดือน |
| `assets/nj-logistic-logo.png` | โลโก้บริษัทในสลิปเงินเดือน |

**หลังอัปโหลดทุกครั้ง: Hard refresh (Ctrl+Shift+R)** เพื่อล้าง Service Worker เก่า

---

## 2. ไฟล์ SQL — ลำดับการรัน

รันบน Supabase Dashboard → SQL Editor เรียงตามลำดับนี้

### รันไปแล้วบน production (ยืนยันด้วย install_report)

| ไฟล์ | สร้างอะไร |
|---|---|
| `41_leave_rpc.sql` | โมดูลลางาน — 11 RPC |
| `42_core_migration.sql` | healthcheck · notifications · leave_types · audit_log |
| `48_employees.sql` | โมดูลพนักงาน — 6 RPC · ยืนยัน 108 คน / 5 แผนก |
| `49_emp_import.sql` | นำเข้าพนักงานจาก Excel (dry run + ทั้งชุดหรือไม่เลย) |

### ยังไม่ได้รัน — ต้องรันตามลำดับ

| ลำดับ | ไฟล์ | สร้างอะไร |
|---|---|---|
| 1 | `43_pay_items.sql` | รายการเงินเดือน (master + รายเดือนต่อพนักงาน) |
| 2 | `44_approval_workflow.sql` | ตั้งค่าการอนุมัติ (workflow / steps / approvers) |
| 3 | `45_leave_reports.sql` | รายงานการลา + วันลาคงเหลือ + ตารางปรับวันลา |
| 4 | `46_leave_form.sql` | ใบลาแนบไฟล์หลายไฟล์ — **ต้องรันก่อนอัปโหลด app.js** |
| 5 | `47_ot_attachments.sql` | ไฟล์แนบ OT ขึ้น Supabase Storage |
| 6 | `51_core_schema.sql` | njhr_ot_jobs · payroll.tax · is_overnight · late_allow_minutes |
| 7 | `52_users.sql` | จัดการผู้ใช้ เชื่อม app_users.employee_id = employees.id |
| 8 | `53_payslip.sql` | E-PAYSLIP อ่านจากตาราง payroll จริง |
| 9 | `54_payslip_list.sql` | รายชื่อพนักงาน + ตัวกรอง + บันทึกการส่งสลิป |
| 10 | `55_departments.sql` | จัดการแผนก + sync ชื่อแผนกกับพนักงานและตั้งค่าการอนุมัติ |
| 11 | **`58_holidays.sql`** | **ล่าสุด** — วันหยุดบริษัท ใช้ตาราง holidays เดิมชุดเดียวกับระบบลา/OT |

### ไฟล์ตรวจสอบ (อ่านอย่างเดียว ไม่แก้ข้อมูล)

`50a_columns.sql` · `50b_constraints.sql` · `50c_functions.sql` · `50d_samples.sql`
รันเมื่อไหร่ก็ได้ ใช้ยืนยันโครงสร้างก่อนพัฒนาต่อ

`50_inspect_all.sql` = รวม 10 ส่วนในไฟล์เดียว (Supabase แสดงแค่ผลลัพธ์สุดท้าย จึงแนะนำใช้ 50a–50d แทน)

`42_inspect_remaining.sql` = ไฟล์ตรวจสอบรุ่นเก่า ใช้ 50a–50d แทนได้

---

## 3. โครงสร้างฐานข้อมูลที่ยืนยันแล้ว

| ตาราง | Unique Key | Enum | แถว |
|---|---|---|---|
| `employees` | `emp_code` | `emp_status` = ACTIVE / PROBATION / RESIGNED / SUSPENDED | 108 |
| `departments` | — | — | 5 |
| `attendance` | `(employee_id, work_date)` | `attendance_status` = NORMAL / LATE / ABSENT / LEAVE / HOLIDAY | 0 |
| `ot_requests` | **ไม่มี** | `request_status` = PENDING / APPROVED / REJECTED / CANCELLED | 0 |
| `payroll` | `(employee_id, period_year, period_month)` | `payroll_status` = DRAFT / CALCULATED / PAID | 0 |
| `work_shifts` | — | text | 3 |
| `employee_shifts` | — | text | 1 |
| `payslips` | — | — | 0 |
| `system_settings` | `key` | jsonb | 1 |

### กะทำงานจริง 3 กะ

| กะ | เวลา | พัก | สาย | OT หลัง | วันทำงาน |
|---|---|---|---|---|---|
| OFFICE | 08:30–17:30 | 60 | 0 | 17:30 | จ-ศ |
| เช้า | 08:30–20:00 | 60 | 0 | 20:01 | จ-ศ |
| ดึก | 20:00–05:00 (ข้ามวัน) | 60 | 0 | 05:01 | จ-ศ |

**หมายเหตุ:** `late_allow_minutes = 0` ทั้ง 3 กะ = สาย 1 นาทีก็นับสาย
ปรับได้ที่หน้าตั้งค่ากะทำงาน ไม่ต้องแก้โค้ด

---

## 4. ข้อตกลงที่ยืนยันแล้ว

1. รายการงาน OT ใช้ตารางลูก `njhr_ot_jobs` — ไม่แตะ `ot_requests` เดิม
2. ภาษีใช้คอลัมน์ `payroll.tax` แยก — **ห้ามรวมใน `other_deduct`**
3. นาทีอนุโลมมาสายอ่านจาก `work_shifts.late_allow_minutes` ต่อกะ — **ห้าม Hardcode**
4. กะข้ามวันดูจาก `end_time < start_time` → `work_shifts.is_overnight` คำนวณอัตโนมัติ แก้มือไม่ได้
5. `system_settings.payroll_state` คงของเดิม — **ห้ามแก้**

---

## 5. โมดูลที่ยังไม่ได้ย้ายขึ้น Supabase

ยังอ่าน/เขียน `db.*` ใน localStorage ซึ่งว่างเปล่าบน production

- ลงเวลา / แก้ไขเวลา (`attendance`)
- OT (`ot_requests` + `njhr_ot_jobs`)
- เงินเดือน / สลิป / รวมเงินเดือน / ประกันสังคม (`payroll`)
- REPORT ALL
- กะทำงาน (`work_shifts` / `employee_shifts`)
- ตั้งค่าระบบ (`system_settings`)

โครงสร้างพร้อมแล้วทั้งหมด เหลือเขียน RPC + ต่อ UI

---

## 6. ข้อควรระวัง

- `njhr_emp_import` นำเข้าแบบ **ทั้งชุดหรือไม่เลย** — ไฟล์ 500 แถวผิด 1 แถว จะไม่นำเข้าอะไรเลย ทดสอบด้วยไฟล์เล็กก่อน
- bucket `leave-attachments` และ `ot-attachments` เป็น **public** — ใครมี URL เปิดไฟล์ได้ ควรเปลี่ยนเป็น private + Signed URL
- policy `nj_v6_anon_all` (using=true) ยังเปิดกว้าง — โปรเจกต์แชร์กับอีก 6 แอป **ห้ามลบ**
- ยังไม่เคยเปิดไฟล์ Excel ที่ระบบสร้างด้วย Microsoft Excel จริง (ตรวจโครงสร้าง XML แล้วเท่านั้น)
- ยังไม่เคยทดสอบพิมพ์สลิปเป็น PDF จริงบน Chrome

---

## 7. โฟลเดอร์ `supabase/` (ของเก่า เก็บไว้อ้างอิง)

ไฟล์ชุดแรกจากตอนเริ่มโปรเจกต์ — สำรวจโครงสร้าง · ตั้งค่า auth · map พนักงานกับ user
**รันไปแล้วทั้งหมด ไม่ต้องรันซ้ำ** เก็บไว้เพื่อดูประวัติการตัดสินใจเท่านั้น

ไฟล์ที่ใช้งานจริงอยู่ในโฟลเดอร์ `supabase-new/`
