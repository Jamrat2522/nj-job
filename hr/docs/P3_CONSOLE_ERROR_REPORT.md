# P3_CONSOLE_ERROR_REPORT

Build `njhr-v2-eed72c68` · เก็บจาก `page.on('pageerror')` และ `page.on('console')` ระดับ error

| ชุดทดสอบ | Console Error | Page Error |
|---|---|---|
| Regression 27 route (`compare.js`) | 2 (403 storage probe) | 0 |
| Environment Gate 12 เคส | 0 | 0 |
| Service Worker 26 เคส | 0 | 0 |
| `p2_suite` 80 เคส (Role · Session · Dashboard · Listener · Responsive · Compat 28/28) | 0 | 0 |
| `p3_feature` 76 เคส (Employees · Attendance · Leave · OT) | 0 | 0 |
| **รวม** | **2 (403 เท่าเดิมกับ baseline)** | **0** |

`403` มาจาก `**/storage/v1/**` ที่ตัวดักทดสอบตอบกลับ — เกิดเท่ากันทั้ง baseline `ad12da59` และ build นี้
**ไม่มี Unhandled Promise Rejection แม้แต่รายการเดียว**

## Environment Gate — ผลราย Test Case

| Test Case | ผล | หลักฐาน |
|---|---|---|
| CFG-001 · config.js โหลดไม่ครบ / ถูกตัดกลางคัน | PASS | code=CFG-001 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-002 · ค่ายังเป็น __PLACEHOLDER__ | PASS | code=CFG-002 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-002 · ENV=staging แต่ยังไม่กรอก STAGING_PROJECT_ID | PASS | code=CFG-002 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-003 · NJHR_ENV_NAME ไม่ใช่ staging/production | PASS | code=CFG-003 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-004 · URL ไม่ใช่รูปแบบ Supabase ที่อนุญาต | PASS | code=CFG-004 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-004 · URL เป็น Supabase แต่ Project ไม่อยู่ในรายการอนุญาต | PASS | code=CFG-004 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-005 · URL ชี้ Production แต่ ALLOW_PRODUCTION !== true | PASS | code=CFG-005 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-005 · ENV=staging แต่ตั้ง ALLOW_PRODUCTION = true | PASS | code=CFG-005 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-006 · ENV=staging แต่ URL ชี้ Production | PASS | code=CFG-006 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| CFG-007 · ENV=production แต่ URL ชี้ Staging | PASS | code=CFG-007 · ข้อความบนจอมีรหัส=true · URL/KEY ถูกล้าง=true · localStorage ถูกล้าง=true · โหลด runtime=0 · โหลด feature=0 · เรียก supabase=0 |
| GATE PASS · ค่าถูกต้องครบ → Gate ผ่าน | PASS | CONFIG_OK=true · runtime ชนิดที่โหลด=asset-manifest.js,namespace.js,core.js · โหลดหน้าทั้งหมด 3 รอบ (Build ID Guard รีเฟรช 1 ครั้งแล้วหยุด) · feature=ไม่มี · NJHR=true · NJHR_ASSETS=true |
| GATE · ไม่มีปุ่มข้าม Gate บนหน้าจอ Error | PASS | ปุ่ม/ลิงก์บนหน้า Error = 0 |

**PASS 12 · FAIL 0**
