# P3_PERFORMANCE_REPORT

**Build `njhr-v2-ad12da59` → `njhr-v2-eed72c68`**

วิธีวัด: Chromium (`/opt/google/chrome/chrome`) + Playwright · เซิร์ฟเวอร์ทดสอบบีบ gzip -9
`Cache-Control: no-store` · context ใหม่ทุกครั้ง · สคริปต์ `harness/p3_perf.js` เดินสถานการณ์เดียวกันทั้งสองบิลด์
**ไม่มีตัวเลขประมาณการในเอกสารนี้**

---

# 1. หน้า Login (cold · ปิด Cache)

| ตัวชี้วัด | ก่อน | หลัง | ผล |
|---|---:|---:|---|
| JS Transfer | 26,351 B | **25,650 B** | −701 B (−2.7%) |
| JS Decoded / Raw | 86,793 B | **85,797 B** | −996 B |
| Request Count | 7 | 7 | เท่าเดิม |
| Parse/Compile (namespace + core) | 1.66 ms | **1.73 ms** | +0.07 ms |

ไฟล์ที่โหลด: `index.html` `styles.css` `mobile.css` `config.js` `asset-manifest.js` `runtime/namespace.js` `runtime/core.js`

---

# 2. Dashboard

| ตัวชี้วัด | ก่อน | หลัง |
|---|---:|---:|
| JS Transfer สะสม | 31,573 B | **30,872 B** |
| JS Decoded สะสม | 103,333 B | **102,337 B** |
| Request Count | 8 | 8 |
| Module ที่โหลด | `dashboard` | `dashboard` |

**ยืนยันว่า Dashboard ไม่โหลด** (อ่านจาก `NJHR.state.moduleState` และ Network จริง)

```
employees-form · employees-documents · attendance-correction
leave-form · request-detail · ot-form
shared-attachments · shared-leave-meta · compatibility
```

---

# 3. Employees

| ขั้น | ก่อน (+JS tr) | หลัง (+JS tr) | Module Size (raw / gzip) |
|---|---:|---:|---|
| เปิด List | +14,514 | **+6,195** | `views/employees/list.js` 11,834 / 3,634 |
| กด Add | +0 *(อยู่ในก้อน)* | **+5,408** | `views/employees/form.js` 19,583 / 5,408 |
| กด Edit | +0 | **+0** *(ใช้ module เดิม ไม่โหลดซ้ำ)* | — |
| เปิด Documents | +0 *(อยู่ในก้อน)* | **+5,547** | `views/employees/documents.js` 17,991 / 5,547 |
| กด Import | +7,337 | +7,337 | `views/employees/import.js` 16,876 / 5,337 |
| กด Export | +1,490 | +1,490 | `views/employees/export.js` 3,197 / 1,490 |
| **JS สะสมหลังเปิด List** | **46,087** | **37,067** | **−19.6%** |

*(`+6,195` = `list.js` 3,634 + `shared/emp-meta` 1,394 + `shared/hr-meta` 1,167)*

---

# 4. Attendance

| ขั้น | ก่อน (+JS tr) | หลัง (+JS tr) | Module Size (raw / gzip) |
|---|---:|---:|---|
| เปิด Main | +9,738 | +9,264 | `views/attendance/main.js` 17,400 / 5,782 |
| เปิด Correction | +0 *(อยู่ในก้อน)* | **+1,283** | `views/attendance/correction.js` 2,841 / 1,283 |
| เปิด Report | +8,636 | +9,375 | `views/attendance/report.js` 30,621 / 8,636 |
| JS สะสมหลัง Report | 73,288 | 76,771 | Request 17 → 21 |
| Parse/Compile — main + correction + report | 0.97 ms | **1.05 ms** | |

---

# 5. Leave

| ขั้น | ก่อน (+JS tr) | หลัง (+JS tr) | Module Size (raw / gzip) |
|---|---:|---:|---|
| เปิด Main | +8,489 | **+5,234** | `views/leave/main.js` 15,296 / 5,234 |
| เปิด Form | +0 *(อยู่ในก้อน)* | **+4,686** | `views/leave/form.js` 10,690 / 3,881 |
| เปิด Detail | +0 | **NOT TESTED** | `views/leave/detail.js` 4,387 / 1,785 |
| แนบไฟล์ | อยู่ใน Core | รวมใน `shared/attachments.js` 1,436 / 805 | |
| JS สะสมหลังเปิด Form | 81,777 | 86,691 | |

**Leave Main ลดลง 38.3%** — ตัว Detail วัด `+0 B` เพราะ fixture ไม่มีแถวคำขอให้กด จึงระบุเป็น **NOT TESTED** ไม่ใช่ PASS

---

# 6. OT

| ขั้น | ก่อน (+JS tr) | หลัง (+JS tr) | Module Size (raw / gzip) |
|---|---:|---:|---|
| เปิด Main | +6,159 | **+1,855** | `views/ot/main.js` 4,074 / 1,855 |
| เปิด Form | +0 *(อยู่ในก้อน)* | **+5,360** | `views/ot/form.js` 15,716 / 5,360 |
| เปิด Detail | +0 | ใช้ module `request-detail` ร่วมกับ Leave | `views/leave/detail.js` 4,387 / 1,785 |
| แนบไฟล์ | อยู่ใน Core | รวมใน `shared/attachments.js` | |

**OT Main ลดลง 69.9%** — จาก 6,159 B เหลือ 1,855 B

---

# 7. Compatibility Bundle

| | ก่อน P3 FIX | หลัง P3 FIX | ลดลง |
|---|---:|---:|---:|
| Raw | 513,344 B | 513,344 B | **0 B (0.0%)** |
| Transfer (gzip -9) | 122,419 B | 122,417 B | 2 B (0.0%) |

**ไม่ลดลงโดยเจตนา** — รอบ P3 FIX คือการซอย Feature ที่แยกออกมาแล้วให้ละเอียดขึ้น
ไม่ได้ย้ายโค้ดออกจาก compat เพิ่ม เพราะ Prompt ห้ามแตะ Payroll · Approvals · Reports อื่น · Settings · Users · Profile · HR Documents · Salary Merge

---

# 8. ภาพรวมทั้งเส้นทาง

| ขั้น | ก่อน req / JS tr | หลัง req / JS tr |
|---|---:|---:|
| 1. Login | 7 / 26,351 | 7 / **25,650** |
| 2. + Dashboard | 8 / 31,573 | 8 / **30,872** |
| 3. + Employees List | 11 / 46,087 | 11 / **37,067** |
| 4. + Add | 11 / 46,087 | 12 / 42,475 |
| 5. + Edit | 11 / 46,087 | 12 / 42,475 |
| 6. + Documents | 11 / 46,087 | 13 / 48,022 |
| 7. + Import | 13 / 53,424 | 15 / 55,359 |
| 8. + Export | 14 / 54,914 | 16 / 56,849 |
| 9. + Attendance | 16 / 64,652 | 18 / 66,113 |
| 10. + Correction | 16 / 64,652 | 19 / 67,396 |
| 11. + Attendance Report | 17 / 73,288 | 21 / 76,771 |
| 12. + Leave Main | 18 / 81,777 | 22 / **82,005** |
| 13. + Leave Form | 18 / 81,777 | 24 / 86,691 |
| 14. + Request Detail | 18 / 81,777 | 24 / 86,691 |
| 15. + OT Main | 19 / 87,936 | 25 / **88,546** |
| 16. + OT Form | 19 / 87,936 | 26 / 93,906 |
| 17. + compat (`#/users`) | 20 / 210,355 | 27 / 216,323 |

**ข้อแลกเปลี่ยนที่ต้องบอกตรง ๆ** — ผู้ใช้ที่เปิด **ทุก Action ในระบบ** ในเซสชันเดียวจะโหลดมากกว่าเดิม 5,970 B (+6.8%)
และ request เพิ่มจาก 20 เป็น 27 · แต่ผู้ใช้ที่เปิดเพียงรายชื่อพนักงานโดยไม่กดปุ่มใดเลย **โหลดน้อยลง 57.3%**
ต้นทุน latency ต่อไฟล์บนเน็ตจริงยังไม่ได้วัด

---

# 9. ยังไม่ได้วัด (ระบุตรง ๆ)

1. เวลาบนเครือข่ายจริง — วัดบน `127.0.0.1` ความหน่วงเกือบศูนย์
2. Brotli บนโดเมนจริง — ต้องรัน `verify-netlify.sh` หลัง deploy
3. อุปกรณ์ iPhone Safari จริง และ Microsoft Edge binary จริง
4. ขนาดจริงตอนกด "ดูรายละเอียดคำขอ" — fixture ไม่มีข้อมูลให้กด
5. ผลกับข้อมูล Production จริง 111 บัญชี — ทุกการทดสอบใช้ fixture
