# Gap Analysis: Prototype (localStorage) ↔ Supabase ของจริง
สร้างจากผล inspection จริง ไม่มีการเดา

## A. สถานะข้อมูลจริงใน Supabase (นับแบบ exact)

| ตาราง | แถว | ความหมาย |
|---|---|---|
| employees | **108** | ข้อมูลพนักงานจริง มี work_start/work_end + โควตาลา (sick 30 / personal 10 / vacation 6) |
| departments | 5 | ใช้งานอยู่ |
| work_shifts | 3 | กะทำงานมีอยู่แล้ว (มี late_allow_minutes, ot_start_after, working_days) |
| leave_approvers | 4 | ตั้งค่าผู้อนุมัติรายแผนก (config jsonb) |
| leave_requests | **1** | แทบยังไม่ได้ใช้ |
| leave_types | **0** | ว่าง — ระบบ V.6 ใช้ **enum `leave_type`** แทนตาราง |
| attendance / ot_requests / notifications / holidays / leave_attachments | **0** | ยังไม่ได้ใช้ |
| app_users | 362 | ผูกกับ auth.users แค่ **2 คน** (auth.users มี 63) |

→ สรุป: **schema ครบและออกแบบดีอยู่แล้ว แต่ข้อมูลระบบลายังแทบว่าง** = ต่อยอดได้ปลอดภัย ไม่ต้องสร้างตารางใหม่

## B. ความต่างที่ต้อง map (prototype → Supabase)

| prototype | Supabase ของจริง | ต้องทำอะไร |
|---|---|---|
| `leaves.id` = text `LV-2604` | `leave_requests.id` uuid | สร้าง uuid ใหม่ + เก็บรหัสเดิมไว้ (ต้องเพิ่มคอลัมน์ `legacy_id` หรือใส่ใน reason) |
| `empId` = `E005` | `employee_id` uuid | จับคู่ผ่าน `employees.emp_code` (ของจริงเป็น `EMP0001`) |
| `typeId` = แถวในตาราง leaveTypes | `leave_type` **enum**: SICK, PERSONAL, VACATION, MATERNITY, ORDINATION, HALFDAY, OTHER | map ชื่อไทย → enum |
| `mode` FULL/HALF/HOURLY | `leave_unit` + `is_halfday` + `hours` + `total_days` | แปลงค่า |
| `status` มี **NEED_MORE_INFO / COMPLETED** | enum `request_status` มีแค่ PENDING/APPROVED/REJECTED/CANCELLED | **ต้องตัดสินใจ**: เพิ่มค่า enum หรือยุบสถานะ |
| `timeline[]` (array ใน record) | `approvals jsonb` | เก็บลง jsonb ได้เลย |
| `balances` (quota/used ต่อคนต่อประเภท) | **ไม่มีตาราง** — โควตาอยู่ที่ `employees.leave_sick/personal/vacation` ส่วน "used" **ไม่มีที่เก็บ** | **ต้องตัดสินใจ**: คำนวณสดจาก leave_requests หรือเพิ่มตารางใหม่ |
| `leaveTypes.needDoc / color / quota` | ไม่มี (leave_types ว่างและไม่มีคอลัมน์เหล่านี้) | **ต้องตัดสินใจ**: เพิ่มคอลัมน์ หรือเก็บใน `system_settings` (มีตารางนี้อยู่) |
| `file` (ชื่อไฟล์) | `leave_attachments` (file_name, file_url, file_size) | ใช้ของเดิม + Storage |
| `delegate` (ผู้รับงานแทน) | ไม่มีคอลัมน์ | **ต้องตัดสินใจ**: เพิ่มคอลัมน์ หรือเก็บใน approvals jsonb |
| `corrections` (ขอแก้เวลา) | ไม่มีตาราง | ต้องสร้างใหม่ (ตั้งชื่อกัน prefix ชน) |
| `shifts` ของ prototype | `work_shifts` + `employee_shifts` (มี effective_date ด้วย) | ใช้ของเดิมซึ่งดีกว่า |

## C. สิ่งที่ต้องตัดสินใจก่อนเขียน SQL (ผมจะไม่เลือกแทน)

1. ระบบลาใน Supabase (V.6) **จะใช้ต่อ** หรือให้ prototype นี้แทนที่?
2. `used` (วันลาที่ใช้ไปแล้ว) จะคำนวณสดจาก `leave_requests` หรือทำตารางสรุป?
3. สถานะ `NEED_MORE_INFO` / `COMPLETED` — เพิ่มเข้า enum `request_status` หรือยุบ?
4. ประเภทลาจะยึด **enum 7 ค่า** ของ Supabase (ทิ้งตาราง leave_types) หรือเปิดตาราง leave_types ให้แก้ชื่อ/โควตา/สีได้ตาม prototype?
5. app_code ของระบบ HR จะใช้ค่าอะไร (ปัจจุบันมี advance, amend, billing, pdf, salary, timeline, transport)
