# MASSENGER V3 — BROWSER REGRESSION CHECKLIST

> Gate ก่อนอนุมัติ Phase 3 · ทดสอบ manual บนเบราว์เซอร์จริง (sandbox รันไม่ได้)
> อ้างอิงสถานะหลัง **Phase 2.5** · ไม่แก้โค้ดระหว่างทดสอบ · พบ Fail = รายงาน ห้ามแก้อัตโนมัติ
> จัดทำ: หลัง Phase 2.5

> **Changelog (2026-07-13) — Role Verification:** ทดสอบเฉพาะ 5 role ที่พบใน Production DB (SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF) · ถอด ADMIN_MID / USER / MESSENGER_PENDING (ไม่พบใน prod DB · ไม่ใช่ role สำหรับ regression รอบนี้ · legacy code ที่อ้างถึงยังไม่ถูกลบ · freeze)

---

## 0. Baseline & วิธีใช้

**ไฟล์อ้างอิง UI Parity** = build **ก่อน Phase 2.5** (หลัง Phase 2)
- `js/app.js` ก่อน = md5 `9af23b69199a5d3fe824aac1b0e3c838`
- `js/app.js` หลัง (ที่ทดสอบ) = md5 `98bce794cbf2e76f2eb83d3765918a43`
- `css/app.css` = `6081e654…` (ไม่เปลี่ยน) · `index.html` = `64f110c7…` (ไม่เปลี่ยน)

**วิธีเทียบ Parity:** เปิด 2 หน้าจอคู่กัน — build ก่อน vs หลัง — role/หน้าเดียวกัน แล้วเทียบตำแหน่ง/สี/ขนาด/ระยะห่าง/responsive
**หลักฐาน (Evidence):** screenshot + DevTools (Network/Console/Application) เก็บชื่อไฟล์ในช่อง Evidence
**การนับ Channel/Timer:** DevTools → Sources/Network (WS) สำหรับ realtime · `performance`/manual audit สำหรับ timer (หรือ log ที่มีอยู่)

**สถานะเกณฑ์:** ⛔ = CRITICAL (ต้องผ่านเพื่อเปิด Phase 3) · ◽ = ควรผ่าน

---

## 1. Roles (จากโค้ดจริง `massenger-clean_min__62__edit-header.html`)

| Role | มีในโค้ด? | admin? | landing | หมายเหตุ |
|---|---|---|---|---|
| SUPER_ADMIN | ✅ | ใช่ | jobs | เห็นทุกงาน · ลบงานได้ · จัดการ user · ดูรหัสผ่าน |
| ADMIN | ✅ | ใช่ | jobs | เห็นทุกงาน · จัดการ user · **ลบงานไม่ได้** (deleteJob=SUPER เท่านั้น) |
| MESSENGER | ✅ | ไม่ | wait | เห็น WAIT + งานที่รับ/สร้าง · ตาม terminal · รับ/ปิดงาน |
| SHIPPING | ✅ | ไม่ | doc-new | shipping-only · เห็นเฉพาะเมนู DOCUMENT · ปิดเอกสาร |
| STAFF | ✅ | ไม่ | wait | own-docs viewer · เห็นเฉพาะงานที่ตัวเองสร้าง · createJob/closeJob ได้ |

**PERM map (โค้ดจริง):** dashboard/manageUsers = SUPER_ADMIN,ADMIN · deleteJob = SUPER_ADMIN · closeJob = SUPER_ADMIN,ADMIN,MESSENGER,USER,STAFF · closeDocument = SUPER_ADMIN,ADMIN,SHIPPING · createJob = SUPER_ADMIN,ADMIN,STAFF,MESSENGER

**✅ Production DB verified — Official V3 roles (5):** SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF · counts SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 · **ADMIN_MID = Not Found in Production Database (ปิด · PF-04)** · USER/MESSENGER_PENDING = **ไม่พบใน prod DB** → ถอดจาก matrix รอบนี้ · **Legacy Code Reference — Not Present in Current Production Data** (โค้ดเดิมยังไม่ลบ · freeze) · ⚠️ query ไม่ได้ filter `app_code` (โค้ดใช้ตาราง `users`) — แนะนำ re-run `app_code='massenger'`

---

## 2. Environments (ทดสอบทุกกรณีที่ทำได้)

| Env ID | รายละเอียด |
|---|---|
| E1 | Desktop Chrome (จอปกติ ≥1024px) |
| E2 | Responsive width < 768px (DevTools device toolbar) |
| E3 | Mobile Chrome / Android (เครื่องจริง) |
| E4 | iPhone Safari (ถ้ามีเครื่อง) |
| E5 | Offline → กลับ Online |
| E6 | Background → กลับเข้าแอป (visibilitychange) |
| E7 | เปิดพร้อมกัน 2 Tab |
| E8 | เปิดพร้อมกัน 2 เครื่อง (ถ้าทำได้) |

---

## 3. Config Scenarios (ตั้งใน `config/runtime-config.js`)

| ID | ENVIRONMENT | READ_ONLY | KILL_SWITCH | FEATURES |
|---|---|---|---|---|
| A | uat | true | false | ทุกตัว true |
| B | uat | false | false | ทุกตัว true (ทดสอบ UAT ที่อนุญาตเท่านั้น · ห้ามเขียน prod) |
| C | uat | (any) | true | — |
| D | uat | ไฟล์หาย / ค่าผิด | — | — |
| F* | uat | true | false | สลับปิดทีละตัว: dashboard/users/documents/export = false |

---

## 4. รูปแบบแถว Checklist (14 คอลัมน์)

`Test ID | Environment | Role | Config Scenario | View/Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | Pass/Fail | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่`

> ตารางด้านล่างเติม 7 ช่องแรกไว้แล้ว · ผู้ทดสอบเติม: Actual · Pass/Fail · Evidence · Console · Network · Tester · Date
> คอลัมน์ผลลัพธ์ย่อเป็น `Actual | P/F | Evidence | Console | Network | By | Date` ท้ายตาราง

---

## 5. LOGIN & SESSION  (S7 spec)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔LOGIN-01 | E1 | ทุก role | A | Login | ใส่ username/password เดิม | Login สำเร็จ เข้า landing ตาม role | | | | | | | |
| ⛔LOGIN-02 | E1 | ทุก role | A | Login | ใส่ username ตัวพิมพ์ใหญ่ | ระบบ lowercase ตาม logic เดิม · login ได้ | | | | | | | |
| ⛔LOGIN-03 | E1 | any | A | Session | Login แล้ว refresh หน้า | ยังล็อกอินอยู่ (restore จาก localStorage) | | | | | | | |
| LOGIN-04 | E1 | any | A | Session | ปิด browser แล้วเปิดใหม่ | ยังล็อกอิน (ถ้ายังไม่หมดอายุ 30 วัน) | | | | | | | |
| ⛔LOGIN-05 | E1 | any | A | Session key | DevTools→Application→localStorage | มี key `massenger_clean_user` (ไม่ใช่ `massenger_current_user`) | | | | | | | |
| ⛔LOGIN-06 | E1 | any | A | Auth key | ตรวจ Supabase auth storage | ใช้ `mass-dispatch-auth-clean` | | | | | | | |
| ⛔LOGIN-07 | E7/E8 | any | A | Session isolation | Login V3 ค้างไว้ · เปิด Production อีก tab/เครื่อง แล้ว login | V3 **ไม่** ถูก logout · session ไม่ชนกัน | | | | | | | |
| ⛔LOGIN-08 | E7/E8 | any | A | Session isolation | Login Production · เปิด V3 | Production **ไม่** ถูก logout | | | | | | | |
| LOGIN-09 | E1 | any | A | Logout | กด Logout | กลับหน้า login · ล้าง session V3 เท่านั้น | | | | | | | |

---

## 6. UI PARITY (S8) — เทียบ build ก่อน vs หลัง Phase 2.5

ทำต่อ role ที่มองเห็น view นั้น · ทั้ง E1 (desktop) และ E2/E3 (mobile)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected (เทียบ 9af23b69) | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔PAR-01 | E1+E2 | SUPER_ADMIN | A | Sidebar+Topbar | เทียบ 2 build | ตำแหน่ง/สี/badge/ลำดับเมนู เหมือน 100% | | | | | | | |
| ⛔PAR-02 | E1+E2 | ทุก role | A | Menu ตาม role | เทียบเมนูที่เห็น | ตรง role เดิมทุกตัว | | | | | | | |
| ⛔PAR-03 | E1 | admin | A | ตาราง jobs | เทียบ column/ลำดับ/badge | เหมือนเดิม (10 คอลัมน์) | | | | | | | |
| ⛔PAR-04 | E2/E3 | MESSENGER | A | Card มือถือ | เทียบ card layout | เหมือนเดิม | | | | | | | |
| ⛔PAR-05 | E1 | admin | A | Modal (create/detail/close/assign/cancel/print/user) | เปิดทีละตัว | ตำแหน่งปุ่ม/ฟิลด์ เหมือนเดิม | | | | | | | |
| ⛔PAR-06 | E1 | SHIPPING | A | Doc modals (detail/edit/postpone/cleared) | เปิดทีละตัว | เหมือนเดิม | | | | | | | |
| PAR-07 | E1 | admin | A | Dropdown/Search/Filter | ใช้งาน | รูป/พฤติกรรมเดิม | | | | | | | |
| ⛔PAR-08 | E1 | admin | A | Pagination | ดูจำนวน/ปุ่มหน้า | **desktop = 100/หน้า** (jobs view 150) · ปุ่มเหมือนเดิม | | | | | | | |
| ⛔PAR-09 | E2/E3 | MESSENGER/SHIPPING | A | Pagination mobile-ops | ดูจำนวน | **mobile-ops = 40/หน้า** | | | | | | | |
| PAR-10 | E1 | admin | A | Dashboard/Graphs | เปิด | กราฟ/การ์ด/ตาราง เหมือนเดิม | | | | | | | |
| PAR-11 | E1 | any | A | Timeline | เปิด detail | timeline steps เหมือนเดิม | | | | | | | |
| PAR-12 | E1 | any | A | Toast/Loading/Empty/Error state | trigger แต่ละแบบ | เหมือนเดิม | | | | | | | |
| ⛔PAR-13 | E2 | ทุก role | A | Responsive <768 | ย่อจอ | layout/tabbar เหมือนเดิม (breakpoint 768) | | | | | | | |

---

## 7. SCENARIO A — READ_ONLY=true (S5-A, S11 Data Safety)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔ROA-01 | E1 | ทุก role | A | Read | Login + เปิดเมนูตามสิทธิ์ | เปิด/อ่านได้ทุกเมนูตาม role | | | | | | | |
| ⛔ROA-02 | E1 | admin | A | Search/Filter | ใช้ search + filter | ทำงานปกติ · ข้อมูลถูก | | | | | | | |
| ⛔ROA-03 | E1 | any | A | Timeline | เปิด timeline งาน | เปิดได้ | | | | | | | |
| ⛔ROA-04 | E1 | admin | A | Dashboard | เปิด | เปิด/อ่านได้ | | | | | | | |
| ⛔ROA-05 | E1 | admin | A | Export | กด Export Excel | อ่านข้อมูล + สร้างไฟล์ได้ (read ผ่าน) | | | | | | | |
| ⛔ROA-06 | E1 | MESSENGER | A | รับงาน | กดรับงาน | **ถูกบล็อก** (update) · toast/console READ_ONLY · ไม่มี write สำเร็จใน Network | | | | | | | |
| ⛔ROA-07 | E1 | STAFF | A | สร้างงาน | กดบันทึกงานใหม่ | **ถูกบล็อก** (generate_job_number RPC + insert) | | | | | | | |
| ⛔ROA-08 | E1 | MESSENGER | A | ปิดงาน+แนบรูป+ลายเซ็น | กดปิดงาน | **ถูกบล็อก** (storage upload + insert + update) | | | | | | | |
| ⛔ROA-09 | E1 | admin | A | ลบงาน | กดลบ | **ถูกบล็อก** (delete + storage remove) | | | | | | | |
| ⛔ROA-10 | E1 | SHIPPING | A | ปิดเอกสาร/อัปเดตสถานะ | กด action | **ถูกบล็อก** (update + document_logs insert) | | | | | | | |
| ⛔ROA-11 | E1 | admin | A | เพิ่ม/แก้ user | submit | **ถูกบล็อก** (admin_create_user RPC / update) | | | | | | | |
| ⛔ROA-12 | E1 | any | A | สมัครสมาชิก | submit register | **ถูกบล็อก** (self_register_user RPC / auth.signUp) | | | | | | | |
| ⛔ROA-13 | E1 | any | A | ดูรูปแนบ | เปิดไฟล์แนบ/ลายเซ็น | **เปิดดูได้** (download/getPublicUrl อนุญาต) | | | | | | | |
| ⛔SAFE-01 | E1 | ทุก role | A | Network audit | ตลอด scenario A เปิด Network tab | **ไม่มี** write request สำเร็จ (insert/update/upsert/delete/upload/remove/move/copy/write-RPC/signUp) — response READ_ONLY_UAT/บล็อกก่อนส่ง | | | | | | | |
| ⛔SAFE-02 | E8 | admin | A | Data parity | ก่อน/หลังทดสอบ A เทียบข้อมูลจริง | ไม่มีข้อมูลใน DB เปลี่ยน | | | | | | | |

---

## 8. SCENARIO B — READ_ONLY=false (S5-B) · **UAT ที่อนุญาตเท่านั้น · ห้ามเขียน Production**

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔ROB-01 | E1 | STAFF | B | Permission | ลองสร้างงาน | สร้างได้ (createJob ครอบ STAFF) | | | | | | | |
| ⛔ROB-02 | E1 | STAFF | B | Permission | ลองลบงาน | **ทำไม่ได้** (deleteJob=SUPER เท่านั้น) · ปุ่มไม่โผล่ | | | | | | | |
| ⛔ROB-03 | E1 | ADMIN | B | Permission | ลบงาน | **ทำไม่ได้** (SUPER เท่านั้น) | | | | | | | |
| ⛔ROB-04 | E1 | SUPER_ADMIN | B | Permission | ลบงาน | ทำได้ | | | | | | | |
| ROB-05 | E1 | MESSENGER | B | Permission | รับ/ปิดงานตัวเอง | ทำได้ตามเดิม | | | | | | | |
| ⛔ROB-06 | E1 | any | B | Guard ซ้อน | ทำ write ปกติ | ไม่มี guard ซ้อน · ไม่มี READ_ONLY block ผิดพลาด · ไม่มี error ใหม่ | | | | | | | |
| ROB-07 | E1 | any | B | Data parity | เขียนบน UAT | ข้อมูลเปลี่ยนเฉพาะ UAT ที่อนุญาต | | | | | | | |

---

## 9. SCENARIO C — KILL_SWITCH=true (S5-C)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔KILL-01 | E1 | any | C | Boot | โหลดหน้า | App หลัก **ไม่ boot** · เห็นหน้า Maintenance | | | | | | | |
| ⛔KILL-02 | E1 | any | C | Query | Network tab | **ไม่มี** query งาน/ผู้ใช้/เอกสาร | | | | | | | |
| ⛔KILL-03 | E1 | any | C | Realtime | Network (WS) | **ไม่มี** realtime channel | | | | | | | |
| ⛔KILL-04 | E1 | any | C | Timer | audit | **ไม่มี** timer หลัก (heartbeat/overdue/completed) | | | | | | | |
| ⛔KILL-05 | E1 | any | C | Maintenance UI | ดูหน้า | มีข้อความปิดปรับปรุง + ปุ่ม "ไปที่ระบบ Production" | | | | | | | |
| ⛔KILL-06 | E1 | any | C | Redirect | ตั้ง KILL_REDIRECT_URL แล้วโหลด | ลิงก์ใช้งานได้ · **ไม่มี redirect loop** (ไม่ auto-redirect) | | | | | | | |
| ⛔KILL-07 | E1 | any | C | Prod isolation | ระหว่าง kill | Production ไม่ได้รับผลกระทบ | | | | | | | |

---

## 10. SCENARIO D — config หาย/ผิด (S5-D)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔CFGD-01 | E1 | any | D | Missing file | ลบ/rename runtime-config.js แล้วโหลด | **ไม่ crash** · ทำงานต่อได้ | | | | | | | |
| ⛔CFGD-02 | E1 | any | D | READ_ONLY fallback | config หาย | READ_ONLY = **true** (UAT safe) · write ถูกบล็อก | | | | | | | |
| ⛔CFGD-03 | E1 | any | D | Pagination fallback | config หาย | desktop=100 / mobile-ops=40 (เฉพาะจุดที่ wire แล้ว) | | | | | | | |
| ⛔CFGD-04 | E1 | any | D | Feature fallback | config หาย | ทุก feature = true (เมนูครบ) | | | | | | | |
| CFGD-05 | E1 | any | D | Bad values | ใส่ READ_ONLY:"yes", PAGE:-5/"abc" | ใช้ default + warn เฉพาะ UAT | | | | | | | |
| ⛔CFGD-06 | E1 | any | D | No secret | ดู Console | ไม่มี key/password/secret ถูก log | | | | | | | |

---

## 11. FEATURE FLAGS (S6) — ปิดทีละตัว (Scenario F)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔FEAT-01 | E1 | admin | F(dashboard=false) | Menu graphs | ดู sidebar | เมนู "กราฟงานทั้งหมด" **ถูกซ่อน** | | | | | | | |
| ⛔FEAT-02 | E1 | admin | F(dashboard=false) | Direct access | `setView('graphs')` / `renderGraphsPage()` ตรง / state เดิม / ปุ่ม | **Fixed 2.6 — verify:** ทุก vector ถูกบล็อก → redirect safe landing (jobs) หรือ panel · เปิด module ไม่ได้ · URL/hash ไม่ใช่ vector (hash routing=0) | | | | | | | |
| ⛔FEAT-03 | E1 | admin | F(users=false) | Menu users | ดู sidebar | เมนู "ผู้ใช้งาน" **ถูกซ่อน** | | | | | | | |
| ⛔FEAT-04 | E1 | admin | F(users=false) | Direct access | `setView('users')` / `renderUsersView()` ตรง / ปุ่ม | **Fixed 2.6 — verify:** ถูกบล็อก → safe landing/panel · เปิด module ไม่ได้ | | | | | | | |
| ⛔FEAT-05 | E1 | admin | F(export=false) | Export button | ดู topbar jobs | ปุ่ม "Export Excel" **ถูกซ่อน** | | | | | | | |
| ⛔FEAT-06 | E1 | admin | F(documents=false) | Doc section | ดู sidebar | หมวด DOCUMENT **ถูกซ่อน** | | | | | | | |
| ⛔FEAT-07 | E1 | **SHIPPING** | F(documents=false) | Safe landing | Login | **Fixed 2.7 — verify:** ไม่ไป documents · ไม่หน้าว่าง/loop/error · SHIPPING → FEATURE_UNAVAILABLE (ไม่เปิดสิทธิ์ใหม่) · ลำดับ WORK→DASHBOARD→FEATURE_UNAVAILABLE | | | | | | | |
| ⛔FEAT-08 | E1 | ทุก role | F(any=true) | No change | เปิด feature true | เอาต์พุตเหมือนเดิม 100% | | | | | | | |
| ⛔FEAT-09 | E1 | STAFF | F(any) | No priv escalation | ตรวจสิทธิ์ | feature flag **ไม่เพิ่มสิทธิ์** เกิน role เดิม · permission ยังเป็นชั้นหลัก | | | | | | | |

| ⛔FEAT-10 | E1 | SHIPPING | F(documents=false) | Direct doc access | `setView('doc-new')` / `renderDocView()` ตรง | **Fixed 2.6 — verify:** ถูกบล็อก → FEATURE_UNAVAILABLE panel | | | | | | | |
| ⛔FEAT-11 | E1 | admin | F(export=false) | Export direct | กดปุ่ม + เรียก `exportExcel()` ตรง | **Fixed 2.6 — verify:** toast + return · ไม่ export | | | | | | | |

> หมายเหตุ: feature `messenger` **ยังไม่ wire** (ไม่มีจุด toggle ปลอดภัย) — ไม่ต้องทดสอบ · บันทึกเป็น pending

---

## 12. REALTIME & TIMER (S9) — DevTools · บันทึกตัวเลขก่อน/หลัง

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔RT-01 | E1 | admin | A | Channel count | หลัง login นับ WS channel | ตรงกับเดิม (jobs-rt / users-rt / documents-rt ตาม role) | | | | | | | |
| ⛔RT-02 | E1 | admin | A | เปลี่ยนเมนู | สลับ view หลายครั้ง | channel **ไม่เพิ่มซ้ำ** | | | | | | | |
| ⛔RT-03 | E1 | admin | A | Logout | logout | channel ถูกปิด | | | | | | | |
| ⛔RT-04 | E6 | admin | A | Background→foreground | สลับแท็บ/ย่อ | ไม่มี channel ซ้อน (teardown/re-subscribe เดิม) | | | | | | | |
| ⛔RT-05 | E5 | admin | A | Offline→Online | ตัด/ต่อเน็ต | ไม่มี query ซ้ำผิดปกติ · resync เดิม | | | | | | | |
| ⛔RT-06 | E1 | admin | A | Timer count | เปลี่ยนเมนูหลายครั้ง | timer **ไม่เพิ่มทุกครั้ง** (singleton) | | | | | | | |
| ⛔RT-07 | E1 | any | C | Kill | KILL_SWITCH=true | **ไม่มี** channel และ timer | | | | | | | |
| RT-08 | E1 | any | A | RT error | ดู console | ไม่มี realtime error ใหม่ | | | | | | | |

---

## 13. NETWORK & CONSOLE (S10)

| ID | Env | Role | Cfg | View/Feature | ขั้นตอน | Expected | Actual | P/F | Evidence | Console | Network | By | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ⛔NET-01 | E1 | any | A | 404 | โหลดหน้า ดู Network | ไม่มี 404 จาก css/ js/ config/ assets/ | | | | | | | |
| ⛔NET-02 | E1 | any | A | manifest/icon | ดู Network | manifest.json / icon-192 ถ้าหายต้อง**รายงาน** (ยังไม่รวมในชุดไฟล์) | | | | | | | |
| ⛔NET-03 | E1 | any | A | Script order | ดูลำดับโหลด | runtime-config.js โหลด**ก่อน** app.js · ไม่มี app.js รันก่อน config | | | | | | | |
| ⛄NET-04 | E1 | any | A | Query count | เทียบกับ build ก่อน | ไม่มี query เพิ่มจาก Phase 2 | | | | | | | |
| ⛔NET-05 | E1 | any | A | Console | ตลอดการใช้งาน | ไม่มี error ใหม่ | | | | | | | |
| ⛔NET-06 | E1 | any | D | Warning | ค่า config ผิด | warn `[RUNTIME_CONFIG]` เฉพาะ UAT · ไม่มี secret | | | | | | | |

---

## 14. เกณฑ์อนุมัติ Phase 3 (Gate)

ยังไม่อนุมัติจนกว่า **ทุกข้อ ⛔ ผ่าน 100%** และ:

- [ ] Login & Session ผ่าน Official 5 role (SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF) · ✅ ADMIN_MID = Not Found in prod DB (ปิด)
- [ ] READ_ONLY=true → **ไม่มี write หลุด** (SAFE-01/02 ผ่าน)
- [ ] KILL_SWITCH → ไม่ boot / ไม่มี realtime / ไม่มี timer / มี maintenance + ลิงก์ / ไม่มี loop
- [ ] Scenario D → ไม่ crash · fallback ครบ · ไม่มี secret log
- [ ] UI Parity ผ่าน Desktop + Mobile (เทียบ build `9af23b69`)
- [ ] ไม่มี Console error ใหม่ · ไม่มี 404
- [ ] Realtime channel ไม่ซ้ำ · Timer ไม่ซ้ำ
- [ ] Production ↔ V3 session ไม่ชนกัน (LOGIN-07/08)
- [ ] **Feature Flag = Access Gate (router/view) ไม่ใช่แค่ซ่อนเมนู** — FEAT-02/04 ปัจจุบัน = FAIL/Pending Fix (PF-01) ต้องแก้+ผ่านก่อน
- [ ] **Safe Landing ของ SHIPPING เมื่อ documents=false มีข้อสรุป** — FEAT-07 = FAIL/Pending Fix (PF-02) ต้องแก้+ผ่านก่อน
- [ ] Role ยืนยันจาก Production Database ครบ

**พบ Fail:** รายงานสาเหตุ + เสนอวิธีแก้ · **ห้ามแก้โค้ดจนได้รับอนุมัติ**

**เมื่อผ่าน + อนุมัติ:** Phase 3 เริ่มที่ **Login Module** เท่านั้น

---

## 15. Pending Items (ยกไป Phase Performance — ห้ามแตะใน 2.5/3 จนกว่าจะทดสอบครบ)

- `DOC.pageSize = 50` (docs desktop) — คงเดิม · ยังไม่เปลี่ยนเป็น 100
- `_ALLJOBS_PAGE = 150` (jobs "all" view) — คงเดิม
- เหตุผล: เกี่ยวกับ Documents/งานทั้งหมด/KPI/Search/Filter/Export/Realtime — ต้องวิเคราะห์+ทดสอบแยก · ห้ามรวมกับ Runtime Config
- แก้ได้ต่อเมื่อมี Browser Regression + Data Parity ยืนยันครบ

## 16. Sign-off

| บทบาท | ชื่อ | วันที่ | ผล (ผ่าน/ไม่ผ่าน) | หมายเหตุ |
|---|---|---|---|---|
| ผู้ทดสอบ | | | | |
| ผู้อนุมัติ (เปิด Phase 3) | | | | |
