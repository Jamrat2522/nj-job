# DEPT_COLUMN_REPORT — หน้า "จัดการแผนก" เหลือเฉพาะข้อมูลแผนกและพนักงาน

Build `njhr-v2-9f4d7232` → **`njhr-v2-08a3516e`**

---

## 1. ตรวจของจริงก่อนแก้

### ไฟล์หน้า "จัดการแผนก"

| รายการ | ค่าจริง |
|---|---|
| Route | `#/departments` — `src/04-router-guards.js:31` · roles `SUPER_ADMIN` · `ADMIN` |
| View | `viewDepartments` — `src/13-view-admin-users.js:667` |
| Module | `compatibility` → `compat/app-legacy.js` |
| ฟังก์ชันที่วาดตาราง | `dpLoad()` — `src/13-view-admin-users.js:704` |

### RPC ที่ใช้โหลดข้อมูล

| RPC | ใช้ที่ไหน | บทบาท |
|---|---|---|
| `njhr_dept_list` | `dpLoad()` บรรทัด 707 | รายการแผนก + จำนวนพนักงาน + `leave_steps` / `ot_steps` |
| `njhr_dept_health` | `viewDepartments()` บรรทัด 691 | เตือนชื่อแผนกไม่สอดคล้อง |
| `njhr_dept_employees` | `dpEmps()` บรรทัด 767 | พนักงานในแผนกที่เลือก |
| `njhr_dept_save` / `njhr_dept_delete` / `njhr_dept_move` | ฟอร์มจัดการ | เขียนข้อมูลแผนก |

### จุดที่สร้าง Column "ตั้งค่าการอนุมัติ"

`src/13-view-admin-users.js` บรรทัด **715** (หัวตาราง) · **718–720** (สร้างตัวแปร `wf`) · **726** (`<td>`)

```js
['รหัส','ชื่อแผนก','พนักงาน (ปฏิบัติงาน)','พนักงานทั้งหมด','ตั้งค่าการอนุมัติ','จัดการ']
var wf = (d.leave_steps > 0 || d.ot_steps > 0)
  ? '<span class="badge badge-ok">ลา ' + d.leave_steps + ' ขั้น · OT ' + d.ot_steps + ' ขั้น</span>'
  : '<span class="badge badge-mut">ยังไม่ได้ตั้ง</span>';
```

### มีหน้าอื่นใช้ `leave_steps` / `ot_steps` หรือไม่

ค้นทั้ง `src/` พบ 2 จุดเท่านั้น

| จุด | แหล่งข้อมูล | ผลกระทบ |
|---|---|---|
| `src/13-view-admin-users.js:718–719` | `njhr_dept_list` | **จุดที่แก้ในรอบนี้** |
| `src/12-view-reports-settings.js:1851–1852` | **`njhr_wf_overview`** (คนละ RPC) | ไม่กระทบ |

จุดที่ 2 คือ `AS_TYPES[].ovKey` ของหน้า "ตั้งค่าการอนุมัติ" ใช้ใน `asLoadOverview()` บรรทัด 1986
ซึ่งอ่านจาก `njhr_wf_overview` ไม่ใช่ `njhr_dept_list` — **เป็นคนละเส้นทางข้อมูลกันโดยสิ้นเชิง**

### ผู้ใช้ `njhr_dept_list` รายอื่น

| จุด | ใช้ field อะไร |
|---|---|
| `src/12-view-reports-settings.js:1421` (Geofence — เติม dropdown แผนก) | `d.name` เท่านั้น |
| `src/12-view-reports-settings.js:4274` (ปฏิทินองค์กร — `calLoad`) | `d.id` · `d.name` |

**ไม่มีจุดใดนอกหน้าจัดการแผนกที่ใช้ `leave_steps` / `ot_steps` จาก `njhr_dept_list`**

---

## 2. ตัดสินใจเรื่อง RPC (STEP 5)

**ไม่แก้ `njhr_dept_list`** — Frontend อย่างเดียว

เหตุผล:

1. การเอา `leave_steps` / `ot_steps` ออกจาก `returns table (...)` ต้อง **`DROP FUNCTION` ก่อน** เพราะเปลี่ยนชนิดผลลัพธ์
   ระหว่าง drop กับ create ผู้ใช้ที่เปิดหน้าอยู่จะเจอ error
2. RPC เดียวกันนี้ถูกใช้อีก 2 หน้า (Geofence · ปฏิทินองค์กร) — ความเสี่ยงไม่คุ้มกับกำไรที่ได้
3. Prompt STEP 5 ระบุว่า *"หากสามารถลด Query ได้โดยไม่กระทบหน้าอื่น จึงค่อยปรับ RPC"* — เงื่อนไข "ไม่กระทบหน้าอื่น" ไม่เป็นจริงในเชิงความเสี่ยงการ deploy

Backend จึงยังส่ง `leave_steps` / `ot_steps` มาเหมือนเดิม UI แค่ไม่ใช้ — ไม่มี error และไม่มีข้อมูล Workflow ใดถูกแตะ

**SQL Migration ที่ต้องรัน: ไม่มี**

---

## 3. ไฟล์ที่แก้

| ไฟล์ | บรรทัด | สิ่งที่แก้ |
|---|---|---|
| `src/13-view-admin-users.js` | 715 | ลบ `'ตั้งค่าการอนุมัติ'` ออกจากหัวตาราง |
| `src/13-view-admin-users.js` | 718–720 | ลบตัวแปร `wf` ทั้งบล็อก |
| `src/13-view-admin-users.js` | 726 | ลบ `'<td>' + wf + '</td>'` |

**ไฟล์ใหม่:** `harness/dept_column_test.js` · `rollback/before_dept_column/` (111 ไฟล์ + `ROLLBACK.md`)

---

## 4. Before / After

### Before

| รหัส | ชื่อแผนก | พนักงาน (ปฏิบัติงาน) | พนักงานทั้งหมด | **ตั้งค่าการอนุมัติ** | จัดการ |
|---|---|---|---|---|---|
| D01 | ปฏิบัติการ | 12 คน | 15 คน | `ลา 2 ขั้น · OT 1 ขั้น` | ⋯ |
| D02 | บัญชี | 5 คน | 6 คน | `ยังไม่ได้ตั้ง` | ⋯ |

### After

| รหัส | ชื่อแผนก | พนักงาน (ปฏิบัติงาน) | พนักงานทั้งหมด | จัดการ |
|---|---|---|---|---|
| D01 | ปฏิบัติการ | 12 คน | 15 คน | ⋯ |
| D02 | บัญชี | 5 คน | 6 คน | ⋯ |

---

## 5. จำนวนพนักงานมาจาก `employees` จริง (STEP 4)

`njhr_dept_list` ใน `supabase-new/55_departments.sql` บรรทัด 67–70 — **ไม่ได้แก้ คงเดิมทุกตัวอักษร**

```sql
-- พนักงาน (ปฏิบัติงาน)
(select count(*)::int from public.employees e
  where e.department_id = d.id and e.status::text = 'ACTIVE')
-- พนักงานทั้งหมด
(select count(*)::int from public.employees e where e.department_id = d.id)
```

| รายการ | ค่าจริง |
|---|---|
| Column ที่อ้างอิงแผนก | **`employees.department_id`** (uuid → `departments.id`) ไม่ใช่ `department` หรือ `dept_code` |
| กฎ "ปฏิบัติงาน" | **`status = 'ACTIVE'` เท่านั้น** — `PROBATION` ไม่ถูกนับ |

**คง Logic เดิมทั้งหมด ไม่แก้กฎสถานะ** ตามที่ระบุใน STEP 4

---

## 6. ผล Test 18 ข้อ — `harness/dept_column_test.js`

**PASS 25 · FAIL 0 · NOT TESTED 1**

Fixture ยังส่ง `leave_steps` / `ot_steps` มาเหมือน RPC จริง เพื่อพิสูจน์ว่า UI เลิกใช้แล้ว ไม่ใช่เพราะ Backend หยุดส่ง

| # | Test Case | ผล | หลักฐาน |
|---|---|---|---|
| 1 | ไม่มี Column "ตั้งค่าการอนุมัติ" | PASS | `รหัส \| ชื่อแผนก \| พนักงาน (ปฏิบัติงาน) \| พนักงานทั้งหมด \| จัดการ` |
| 2 | ไม่มีข้อความ "ยังไม่ได้ตั้ง" | PASS | ไม่พบใน HTML ของตาราง |
| 3 | ไม่มี "ลา x ขั้น · OT x ขั้น" | PASS | ไม่พบ |
| 3b | หัวตารางเหลือ 5 คอลัมน์ตามสเปก | PASS | ตรงทุกตัวอักษร |
| 3c | ทุกแถวมี `<td>` เท่าหัวตาราง | PASS | `5,5,5,5` |
| 4 | รหัสแผนกยังแสดงถูก | PASS | `D01` · แถวไม่มีรหัสแสดง `—` |
| 5 | ชื่อแผนกยังแสดงถูก | PASS | `ปฏิบัติการ,บัญชี,ทรัพยากรบุคคล,ขนส่ง` |
| 6 | จำนวนพนักงานปฏิบัติงานยังถูก | PASS | `12,5,3,8 คน` |
| 7 | จำนวนพนักงานทั้งหมดยังถูก | PASS | `15,6,3,11 คน` |
| 8a | ปุ่มจัดการเดิมครบ | PASS | `ดูพนักงาน \| ตั้งค่าการอนุมัติ \| แก้ไข \| ลบ` |
| 8b | ปุ่ม "ดูพนักงานในแผนก" ใช้งานได้ | PASS | `พนักงานในแผนก ปฏิบัติการ (1 คน) … NJ0001 สมชาย` |
| 8c | ปุ่ม "แก้ไขแผนก" เปิดฟอร์มได้ | PASS | modal `แก้ไขแผนก` |
| 9 | ค้นหาแผนกยังใช้ได้ | PASS | ค้น "บัญชี" → 1 แถว |
| 9b | ผลค้นหาก็ไม่มีคอลัมน์นั้น | PASS | 5 คอลัมน์ |
| 10 | Filter/Sort เดิม | **NOT TESTED** | หน้านี้ไม่มี Filter/Sort — มีเพียงช่องค้นหา (ตรวจจากไฟล์จริง) |
| 11 | หน้า "ตั้งค่าการอนุมัติ" ยังเปิดได้ | PASS | `viewHost=5940B` |
| 12 | Workflow เดิมยังอยู่ครบ | PASS | คำเตือนอ่าน `njhr_wf_overview` ได้ปกติ |
| 13 | ไม่มีการเรียก RPC เขียน Workflow | PASS | ดัก 8 ตัว (`njhr_wf_save` `njhr_wf_delete` `njhr_wf_step_*` `njhr_wf_approver_*`) → 0 ครั้ง |
| 14 | ระบบลาไม่กระทบ | PASS | `#/leave` เปิดได้ |
| 15 | ระบบ OT ไม่กระทบ | PASS | `#/ot` เปิดได้ |
| 16 | ไม่มี Error จาก `leave_steps` / `ot_steps` ที่เลิกใช้ | PASS | ไม่มี console error |
| 16b | Backend ยังส่ง field เดิมมา | PASS | RPC ไม่ถูกแก้ |
| 17 | มือถือ 360×740 ไม่ล้นจอ | PASS | ตาราง 479px / กรอบ 326px / จอ 360px (เลื่อนแนวนอนในกรอบตามดีไซน์เดิม) |
| 17b | แท็บเล็ต 768×1024 ไม่ล้นจอ | PASS | ตาราง 734px / กรอบ 734px / จอ 768px |
| 18 | คอมพิวเตอร์ 1440×900 จัดตารางพอดี | PASS | ตาราง 1120px / กรอบ 1120px / จอ 1440px |

---

## 7. ยืนยันว่า Workflow เดิมไม่ได้ถูกแก้

| รายการ | สถานะ |
|---|---|
| `njhr_approval_workflows` · `njhr_approval_steps` | **ไม่แตะ** |
| `njhr_wf_*` ทุก RPC (15 ตัว) | **ไม่แตะ** |
| `njhr_dept_list` | **ไม่แตะ** — ยังคืน `leave_steps` / `ot_steps` เหมือนเดิม |
| `src/12-view-reports-settings.js` (หน้าตั้งค่าการอนุมัติ) | **ไม่แตะแม้แต่ไบต์เดียว** |
| ผู้อนุมัติ · ลำดับขั้น · ANY/ALL · Priority · LEAVE/OT/BOTH · Mapping แผนก · สถานะเปิด/ปิด | **ไม่แตะ** |
| SQL Migration | **ไม่มี** |

ชุดทดสอบดัก RPC เขียน Workflow ทั้ง 8 ตัวตลอดการรัน → **เรียก 0 ครั้ง**

---

## 8. ยืนยันไม่กระทบระบบเดิม

| ชุดทดสอบ | ผล |
|---|---|
| `build.js --check` + `check-all-js.js` | **CHECK PASSED** — Build ID ตรง 3 จุด `njhr-v2-08a3516e` |
| `compare.js` (DOM regression 27 route × 6 มิติ) | **ตรวจ 162 จุด · ต่าง 2 จุด** |
| `p2_suite.js` | **PASS 80 · FAIL 0** |
| `p3_feature.js` | **PASS 76 · FAIL 0 · NOT TESTED 10** |
| `user_delete_test.js` | **PASS 26 · FAIL 0 · NOT TESTED 3** (รัน 3 รอบติดกันเสถียร) |
| `name_split_test.js` | **PASS 28 · FAIL 0 · NOT TESTED 1** |
| `dept_column_test.js` | **PASS 25 · FAIL 0 · NOT TESTED 1** |

### 2 จุดที่ต่างใน Regression = การเปลี่ยนแปลงที่ตั้งใจพอดี

```
DIFF #/departments [ths]
  ก่อน: รหัส|ชื่อแผนก|พนักงาน (ปฏิบัติงาน)|พนักงานทั้งหมด|ตั้งค่าการอนุมัติ|จัดการ
  หลัง: รหัส|ชื่อแผนก|พนักงาน (ปฏิบัติงาน)|พนักงานทั้งหมด|จัดการ

DIFF #/departments [text]
  ต่างที่ข้อความ "ตั้งค่าการอนุมัติ" และ "ยังไม่ได้ตั้ง" หายไป
```

**อีก 160 จุดจาก 26 route ที่เหลือเหมือนเดิมทุกตัวอักษร** · console error ก่อน = หลัง = 2 (403 storage probe เท่ากัน)

### ไฟล์ Deploy ที่เปลี่ยน (5 จาก 35)

`compat/app-legacy.js` · `asset-manifest.js` · `config.js` · `index.html` · `sw.js`
`runtime/core.js` · `views/**` · `styles.css` · `mobile.css` — **MD5 เดิมทุกไบต์**

---

## 9. เรื่องที่ต้องยืนยันเพิ่ม

ในคอลัมน์ "จัดการ" ยังมีปุ่มไอคอน **"ตั้งค่าการอนุมัติ"** (`data-dp-wf`) ที่กดแล้วกระโดดไปหน้า `#/approval-settings`

**คงไว้ตามเดิม** เพราะ

- STEP 2 ระบุ *"ลบ**เฉพาะ** Column ตั้งค่าการอนุมัติ"*
- STEP 6 ห้าม *"เพิ่ม"* ปุ่ม Workflow — ปุ่มนี้มีอยู่เดิมแล้ว ไม่ใช่ของใหม่
- ปุ่มนี้เป็นเพียงทางลัดไปหน้าอื่น ไม่ได้จัดการ Workflow ในหน้านี้

**ถ้าต้องการให้เอาปุ่มนี้ออกด้วย สั่งได้ — เป็นการลบ 1 บรรทัด**

เช่นเดียวกับกล่องเตือน `dp-health` ที่มีข้อความอ้างถึงตั้งค่าการอนุมัติ (เตือนเรื่องชื่อแผนกไม่สอดคล้อง) — คงไว้เพราะเป็นการเตือนความถูกต้องข้อมูล ไม่ใช่การแสดงสถานะ Workflow

---

## 10. ลำดับการอัปโหลด

1. `runtime/` `views/` `compat/` `assets/`
2. `styles.css` `mobile.css` `asset-manifest.js`
3. `config.js`
4. `index.html`
5. `sw.js` **ท้ายสุดเสมอ**

ตรวจ: Console → `NJHR_DIAG().build` = `njhr-v2-08a3516e`

**ไม่ต้องรัน SQL ใด ๆ ในรอบนี้**
