# MASSENGER V3 — Browser Regression Results

> Template สำหรับกรอกผลทดสอบจริง (Phase 2.8) · ผู้ทดสอบกรอกช่องว่าง
> Expected Result เติมจาก code-trace ไฟล์จริงไว้แล้ว · ห้ามแก้ Expected

- **Version:** MASSENGER v8.14 (V3 · หลัง Phase 2.6/2.7)
- **Build / MD5:** app.js `63c5543270425bf1cd4ff27082b13b3b` · css `6081e654…` · index `64f110c7…` · runtime-config `51419c7b…`
- **Test URL:**
- **Production URL:**
- **วันที่เริ่มทดสอบ:**
- **วันที่สิ้นสุด:**
- **ผู้ทดสอบ:**
- **Browser:**
- **Device:**
- **Screen size:**
- **Environment:** (E1 Desktop Chrome · E2 <768 · E3 Android · E4 iPhone Safari · E5 Offline→Online · E6 BG→FG · E7 2-tab · E8 2-device)
- **Runtime Config:** (ระบุ ENVIRONMENT / READ_ONLY / KILL_SWITCH / FEATURES / PAGE_SIZE ที่ใช้)
- **หมายเหตุ:**

> **สถานะที่ใช้:** PASS · FAIL · BLOCKED · NOT TESTED
> Config: A (RO=true) · B (RO=false·UAT เท่านั้น) · C (KILL=true) · D (config หาย/ผิด) · F-x (feature x=false)

---

## 1. Critical Boot Test

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BOOT-01 | E1 | any | A | Boot | โหลด Test URL | โหลดถึงหน้า login/landing ไม่ค้าง · loader หาย | | | | | | | |
| BOOT-02 | E1 | any | A | Script order | ดู Network | `runtime-config.js` โหลดก่อน `app.js` · ไม่มี app.js รันก่อน config | | | | | | | |
| BOOT-03 | E2/E3 | any | A | Boot mobile | โหลดบนมือถือ | boot ปกติ · tabbar แสดง | | | | | | | |

## 2. READ_ONLY Test

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ROA-01 | E1 | ทุก role | A | Read | เปิดเมนูตามสิทธิ์ | อ่าน/เปิดได้ทุกเมนูตาม role | | | | | | | |
| ROA-06 | E1 | MESSENGER | A | รับงาน | กดรับงาน | บล็อก (update) · toast READ_ONLY · ไม่มี write สำเร็จ | | | | | | | |
| ROA-07 | E1 | STAFF | A | สร้างงาน | บันทึกงานใหม่ | บล็อก (generate_job_number RPC + insert) | | | | | | | |
| ROA-08 | E1 | MESSENGER | A | ปิดงาน+แนบ+ลายเซ็น | กดปิดงาน | บล็อก (storage upload + insert + update) | | | | | | | |
| ROA-09 | E1 | SUPER_ADMIN | A | ลบงาน | กดลบ | บล็อก (delete + storage remove) | | | | | | | |
| ROA-10 | E1 | SHIPPING | A | ปิดเอกสาร/สถานะ | กด action | บล็อก (update + document_logs insert) | | | | | | | |
| ROA-11 | E1 | ADMIN | A | เพิ่ม/แก้ user | submit | บล็อก (admin_create_user / update) | | | | | | | |
| ROA-12 | E1 | any | A | สมัคร | submit register | บล็อก (self_register_user / auth.signUp) | | | | | | | |
| ROA-13 | E1 | any | A | ดูรูปแนบ | เปิดไฟล์/ลายเซ็น | เปิดดูได้ (download/getPublicUrl อนุญาต) | | | | | | | |
| ROA-05 | E1 | admin | A | Export | กด Export Excel | อ่าน+สร้างไฟล์ได้ (read ผ่าน) | | | | | | | |

## 3. KILL_SWITCH Test

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KILL-01 | E1 | any | C | Boot | โหลดหน้า | App หลักไม่ boot · เห็นหน้า Maintenance | | | | | | | |
| KILL-02 | E1 | any | C | Query | Network | ไม่มี query งาน/ผู้ใช้/เอกสาร | | | | | | | |
| KILL-03 | E1 | any | C | Realtime | Network (WS) | ไม่มี channel | | | | | | | |
| KILL-04 | E1 | any | C | Timer | audit | ไม่มี timer หลัก | | | | | | | |
| KILL-05 | E1 | any | C | Maintenance UI | ดูหน้า | ข้อความปิดปรับปรุง + ปุ่มไป Production (ถ้าตั้ง KILL_REDIRECT_URL) | | | | | | | |
| KILL-06 | E1 | any | C | Redirect | ตั้ง KILL_REDIRECT_URL | ลิงก์ใช้ได้ · ไม่มี redirect loop | | | | | | | |
| KILL-07 | E8 | any | C | Prod isolation | ระหว่าง kill | Production ไม่กระทบ | | | | | | | |

## 4. Feature Flag Access Gate (PF-01)

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FEAT-01 | E1 | admin | F-dashboard | Menu graphs | ดู sidebar | เมนู "กราฟงานทั้งหมด" ถูกซ่อน | | | | | | | |
| FEAT-02 | E1 | admin | F-dashboard | Direct access | `setView('graphs')` / `renderGraphsPage()` / ปุ่ม | เปิดไม่ได้ → redirect safe landing (jobs) หรือ panel | | | | | | | |
| FEAT-03 | E1 | admin | F-users | Menu users | ดู sidebar | เมนู "ผู้ใช้งาน" ถูกซ่อน | | | | | | | |
| FEAT-04 | E1 | admin | F-users | Direct access | `setView('users')` / `renderUsersView()` | เปิดไม่ได้ → safe landing/panel | | | | | | | |
| FEAT-05 | E1 | admin | F-export | Export button | ดู topbar jobs | ปุ่ม Export Excel ถูกซ่อน | | | | | | | |
| FEAT-06 | E1 | admin | F-documents | Doc section | ดู sidebar | หมวด DOCUMENT ถูกซ่อน | | | | | | | |
| FEAT-08 | E1 | ทุก role | F(true) | No change | เปิด feature true | เอาต์พุตเหมือนเดิม 100% | | | | | | | |
| FEAT-09 | E1 | STAFF | F(any) | No priv escalation | ตรวจสิทธิ์ | flag ไม่เพิ่มสิทธิ์เกิน role · permission ยังเป็นชั้นหลัก | | | | | | | |
| FEAT-10 | E1 | SHIPPING | F-documents | Direct doc access | `setView('doc-new')` / `renderDocView()` | เปิดไม่ได้ → FEATURE_UNAVAILABLE panel | | | | | | | |
| FEAT-11 | E1 | admin | F-export | Export direct | กดปุ่ม + `exportExcel()` | toast + return · ไม่ export | | | | | | | |
| FEAT-12 | E1 | admin | F-dashboard | URL/hash | ลองเปิดผ่าน URL/hash/state เดิม | ไม่มี view routing ผ่าน hash (hash routing=0) → เปิดไม่ได้ | | | | | | | |

## 5. SHIPPING Safe Landing (PF-02)

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FEAT-07 | E1 | SHIPPING | F-documents | Safe landing | Login | ไม่ไป documents · ไม่หน้าว่าง/loop/error · → FEATURE_UNAVAILABLE (ไม่เปิดสิทธิ์ใหม่) | | | | | | | |
| SL-01 | E1 | admin | F-dashboard | Safe landing | ไปหน้า graphs ที่ปิด | → safe landing = jobs (WORK) | | | | | | | |
| SL-02 | E1 | STAFF | F-documents | Safe landing | (STAFF ไม่ landing docs) | ไม่กระทบ · ยัง landing wait ปกติ | | | | | | | |
| SL-03 | E1 | SHIPPING | F(documents=true) | Normal | Login | landing doc-new ปกติ (ไม่ถูก gate) | | | | | | | |

## 6. Login และ Session

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LOGIN-01 | E1 | ทุก role | A | Login | user/pass เดิม | Login สำเร็จ เข้า landing ตาม role | | | | | | | |
| LOGIN-02 | E1 | any | A | Login | username พิมพ์ใหญ่ | lowercase ตาม logic เดิม · login ได้ | | | | | | | |
| LOGIN-03 | E1 | any | A | Session | refresh หน้า | ยังล็อกอิน (restore localStorage) | | | | | | | |
| LOGIN-04 | E1 | any | A | Session | ปิด/เปิด browser | ยังล็อกอิน (ยังไม่หมดอายุ 30 วัน) | | | | | | | |
| LOGIN-05 | E1 | any | A | Session key | Application→localStorage | มี `massenger_clean_user` | | | | | | | |
| LOGIN-06 | E1 | any | A | Auth key | ตรวจ auth storage | ใช้ `mass-dispatch-auth-clean` | | | | | | | |
| LOGIN-07 | E7/E8 | any | A | Session isolation | Login V3 + login Production | V3 ไม่ logout | | | | | | | |
| LOGIN-08 | E7/E8 | any | A | Session isolation | Login Production + เปิด V3 | Production ไม่ logout | | | | | | | |
| LOGIN-09 | E1 | any | A | Logout | กด logout | กลับ login · ล้าง session V3 เท่านั้น | | | | | | | |

## 7. Role และ Permission

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ROB-01 | E1 | STAFF | B | createJob | สร้างงาน | สร้างได้ (createJob ครอบ STAFF) | | | | | | | |
| ROB-02 | E1 | STAFF | B | deleteJob | ลบงาน | ทำไม่ได้ (SUPER เท่านั้น) · ปุ่มไม่โผล่ | | | | | | | |
| ROB-03 | E1 | ADMIN | B | deleteJob | ลบงาน | ทำไม่ได้ (SUPER เท่านั้น) | | | | | | | |
| ROB-04 | E1 | SUPER_ADMIN | B | deleteJob | ลบงาน | ทำได้ | | | | | | | |
| ROB-05 | E1 | MESSENGER | B | close own | รับ/ปิดงานตัวเอง | ทำได้ | | | | | | | |
| ROB-06 | E1 | SHIPPING | B | closeDocument | ปิดเอกสาร | ทำได้ (closeDocument ครอบ SHIPPING) | | | | | | | |

## 8. Menu และ View Access

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MENU-01 | E1 | ทุก role | A | Menu per role | เทียบเมนูที่เห็น | ตรง role เดิมทุกตัว (WORK/DOCUMENT/PENDING/SYSTEM) | | | | | | | |
| MENU-02 | E1 | STAFF | A | Admin-only view | `setView('users'/'graphs')` ตรง | remap ไป landing ที่มีสิทธิ์ (ไม่มี priv escalation) | | | | | | | |
| MENU-03 | E2/E3 | ทุก role | A | Mobile tabbar | ดู tabbar | ปุ่ม/ลำดับเหมือนเดิม (shipping-only vs ทั่วไป) | | | | | | | |

## 9. Messenger Workflow

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MSG-01 | E1 | STAFF/ADMIN | B | สร้างงาน | สร้างงานใหม่ | ออกเลขงาน (RPC) + insert สำเร็จ · โผล่ในรายการ | | | | | | | |
| MSG-02 | E1/E3 | MESSENGER | B | รับงาน | กดรับงาน (WAIT→GOING) | สถานะเปลี่ยน · row-level update · timeline log | | | | | | | |
| MSG-03 | E1/E3 | MESSENGER | B | ปิดงาน | แนบรูป+ลายเซ็น+ปิด | อัปโหลด+ลายเซ็น+DONE · GPS/distance | | | | | | | |
| MSG-04 | E1 | MESSENGER | B | ยกเลิก | ยกเลิกงาน GOING | CANCELED + เหตุผล | | | | | | | |
| MSG-05 | E1 | SUPER_ADMIN | B | ย้อนกลับ | ย้อน CANCELED→WAIT | กลับเข้าคิว | | | | | | | |
| MSG-06 | E1 | admin | B | มอบหมาย | assign แมส | GOING + assigned | | | | | | | |
| MSG-07 | E1 | STAFF | B | OT | สร้างงาน OT หลายรายการ | บันทึก + สรุปยอด/ใบ | | | | | | | |
| MSG-08 | E1 | any | A/B | ใบสั่งงาน/พิมพ์ | เปิด print modal | render ใบสั่งงานถูกต้อง | | | | | | | |

## 10. Documents Workflow

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOC-01 | E1/E3 | SHIPPING | B | รับเอกสาร | doc NEW→RECEIVED | สถานะเปลี่ยน · row-level | | | | | | | |
| DOC-02 | E1 | SHIPPING | B | อัปเดตสถานะ | update doc status | document_logs + timeline | | | | | | | |
| DOC-03 | E1 | SHIPPING | B | เลื่อนตรวจปล่อย | POSTPONED ↔ RECEIVED | สถานะสลับถูก | | | | | | | |
| DOC-04 | E1 | SHIPPING | B | ตรวจปล่อยเสร็จ | CLEARED→COMPLETED | ปิดงานเอกสาร | | | | | | | |
| DOC-05 | E1 | admin | A | FZ/OT docs | เปิด view doc-* | รายการถูกต้อง (RECEIVED sort/leadtime) | | | | | | | |

## 11. Timeline

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TL-01 | E1 | any | A | Job timeline | เปิด detail งาน | steps created→accepted→closed ถูก | | | | | | | |
| TL-02 | E1 | SHIPPING | A | Doc timeline | เปิด doc timeline | log เอกสารถูก · ไม่ซ้ำ | | | | | | | |

## 12. Dashboard

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DASH-01 | E1 | admin | A | Dashboard/Graphs | เปิด | กราฟ/การ์ด/ตารางเหมือนเดิม | | | | | | | |
| DASH-02 | E1 | admin | A | Date filter | เปลี่ยนช่วงวันที่ | อัปเดตถูก · cap 30 วัน | | | | | | | |
| DASH-03 | E1 | admin | A | Graph PNG | Export PNG กราฟ | ได้รูป (read) | | | | | | | |

## 13. Export

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EXP-01 | E1 | admin | A | Export Excel | กด Export | ZIP 2 ไฟล์ (งานเสร็จ + สถานที่วิ่งงาน) | | | | | | | |
| EXP-02 | E1 | admin | F-export | Export off | feature ปิด | ปุ่มซ่อน + เรียกตรง = toast/return | | | | | | | |

## 14. Search และ Filter

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SF-01 | E1 | admin | A | Search jobs | ค้นหา JOB/บริษัท/รายละเอียด | ผลถูกต้อง (local + server search desktop) | | | | | | | |
| SF-02 | E1 | admin | A | Filter | category/status/terminal/user/date | กรองถูก · KPI ตรง | | | | | | | |
| SF-03 | E1 | SHIPPING | A | Doc search/filter | ค้น+กรองเอกสาร | ผลถูก | | | | | | | |

## 15. Pagination (🔒 Locked)

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PAG-01 | E1 | admin | A | Jobs desktop | ดูจำนวน/หน้า | desktop = 100/หน้า (jobs "all" view = 150) | | | | | | | |
| PAG-02 | E2/E3 | MESSENGER/SHIPPING | A | Mobile-ops | ดูจำนวน | mobile-ops = 40/หน้า | | | | | | | |
| PAG-03 | E1 | SHIPPING | A | Docs desktop | ดูจำนวน | **DOC.pageSize = 50 คงเดิม (Locked · ห้ามเปลี่ยน)** | | | | | | | |

## 16. Realtime

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RT-01 | E1 | admin | A | Channel count | นับ WS หลัง login | jobs-rt / users-rt / documents-rt ตาม role | | | | | | | |
| RT-02 | E1 | admin | A | เปลี่ยนเมนู | สลับ view หลายครั้ง | channel ไม่เพิ่มซ้ำ | | | | | | | |
| RT-03 | E1 | admin | A | Logout | logout | channel ถูกปิด | | | | | | | |
| RT-08 | E1 | any | A | RT error | ดู console | ไม่มี realtime error ใหม่ | | | | | | | |

## 17. Timer และ Cleanup

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TM-01 | E1 | admin | A | Timer count | เปลี่ยนเมนูหลายครั้ง | timer ไม่เพิ่มทุกครั้ง (singleton) | | | | | | | |
| TM-02 | E1 | any | C | Kill timer | KILL_SWITCH=true | ไม่มี timer หลัก | | | | | | | |

## 18. Offline / Online

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OO-01 | E5 | admin | A | Offline banner | ตัดเน็ต | แสดง offline banner | | | | | | | |
| OO-02 | E5 | admin | A | Resync | ต่อเน็ตกลับ | resync · ไม่มี query ซ้ำผิดปกติ | | | | | | | |

## 19. Background / Foreground

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BG-01 | E6 | admin | A | Teardown/resub | ย่อ/สลับแท็บแล้วกลับ | channel teardown แล้ว re-subscribe · ไม่ซ้อน | | | | | | | |
| BG-02 | E6 | admin | A | Resync >30s | background นานกลับมา | reload jobs · render ถูก | | | | | | | |

## 20. Multi-tab / Multi-device

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MT-01 | E7 | any | A | 2 tab | เปิด 2 แท็บ | ทำงานถูก · heartbeat leader ไม่ชน | | | | | | | |
| MT-02 | E8 | MESSENGER | B | 2 device realtime | อัปเดตเครื่อง A | เครื่อง B เห็น realtime | | | | | | | |

## 21. Console และ Network

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NET-01 | E1 | any | A | 404 | ดู Network | ไม่มี 404 จาก css/ js/ config/ | | | | | | | |
| NET-02 | E1 | any | A | manifest/icon | ดู Network | manifest.json / icon-192 = **คาด 404 (PF-05 ยังไม่มีไฟล์) → บันทึก known** | | | | | | | |
| NET-03 | E1 | any | A | Script order | ดูลำดับ | runtime-config ก่อน app.js | | | | | | | |
| NET-05 | E1 | any | A | Console | ตลอดการใช้งาน | ไม่มี error ใหม่ | | | | | | | |
| NET-06 | E1 | any | D | Warning | config ผิด | warn `[RUNTIME_CONFIG]` เฉพาะ UAT · ไม่มี secret | | | | | | | |

## 22. UI Parity — Desktop

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PARD-01 | E1 | SUPER_ADMIN | A | Sidebar/Topbar/Badge | เทียบ build ก่อน (9af23b69) | เหมือน 100% | | | | | | | |
| PARD-02 | E1 | admin | A | ตาราง/Modal/Dropdown | เทียบ | ตำแหน่ง/สี/ขนาด/ระยะห่างเหมือนเดิม | | | | | | | |
| PARD-03 | E1 | any | A | Toast/Loading/Empty/Error | trigger | เหมือนเดิม | | | | | | | |

## 23. UI Parity — Mobile

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PARM-01 | E2/E3 | MESSENGER | A | Card/tabbar | เทียบ build ก่อน | เหมือน 100% | | | | | | | |
| PARM-02 | E2 | ทุก role | A | Responsive <768 | ย่อจอ | layout เหมือนเดิม (breakpoint 768) | | | | | | | |
| PARM-03 | E4 | any | A | iPhone Safari | ทดสอบ | ทำงาน/หน้าตาปกติ | | | | | | | |

## 24. ADMIN_MID DB Verification

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DBV-01 | prod DB | — | — | ADMIN_MID | รัน SELECT role,count | ❌ ไม่พบ ADMIN_MID · พบ SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 | ไม่พบ ADMIN_MID | PASS | query result | — | app_users | | |

## 25. Data Safety

| Test ID | Environment | Role | Config Scenario | View / Feature | ขั้นตอนทดสอบ | Expected Result | Actual Result | PASS / FAIL | Evidence | Console Error | Network Note | ผู้ทดสอบ | วันที่ทดสอบ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SAFE-01 | E1 | ทุก role | A | Network audit | ทำ flow เขียนทุกชนิด | ไม่มี write สำเร็จ (insert/update/upsert/delete/upload/remove/move/copy/write-RPC/signUp) | | | | | | | |
| SAFE-02 | E8 | admin | A | Data parity | เทียบข้อมูลก่อน/หลัง A | ไม่มีข้อมูล DB เปลี่ยน | | | | | | | |

---

## สรุปผลรวม

| หมวด | จำนวนทั้งหมด | PASS | FAIL | BLOCKED | NOT TESTED | หมายเหตุ |
|---|---:|---:|---:|---:|---:|---|
| 1. Critical Boot | 3 | | | | | |
| 2. READ_ONLY | 10 | | | | | |
| 3. KILL_SWITCH | 7 | | | | | |
| 4. Feature Flag Access Gate | 11 | | | | | |
| 5. SHIPPING Safe Landing | 4 | | | | | |
| 6. Login/Session | 9 | | | | | |
| 7. Role/Permission | 6 | | | | | |
| 8. Menu/View Access | 3 | | | | | |
| 9. Messenger Workflow | 8 | | | | | |
| 10. Documents Workflow | 5 | | | | | |
| 11. Timeline | 2 | | | | | |
| 12. Dashboard | 3 | | | | | |
| 13. Export | 2 | | | | | |
| 14. Search/Filter | 3 | | | | | |
| 15. Pagination (Locked) | 3 | | | | | |
| 16. Realtime | 4 | | | | | |
| 17. Timer/Cleanup | 2 | | | | | |
| 18. Offline/Online | 2 | | | | | |
| 19. Background/Foreground | 2 | | | | | |
| 20. Multi-tab/device | 2 | | | | | |
| 21. Console/Network | 5 | | | | | |
| 22. UI Parity Desktop | 3 | | | | | |
| 23. UI Parity Mobile | 3 | | | | | |
| 24. ADMIN_MID DB | 1 | 1 | 0 | 0 | 0 | ✅ Not Found · ปิด |
| 25. Data Safety | 2 | | | | | |
| **รวม** | **105** | | | | | |

---

## Failure Report

> ทำ 1 บล็อกต่อ 1 รายการที่ FAIL · **ห้ามใส่แนวทางแก้โดยการเดา** — ส่งให้ทีมโค้ดวิเคราะห์จากไฟล์จริงแยกต่างหาก

- **Test ID:**
- **Role:**
- **Environment:**
- **Config Scenario:**
- **อาการ:**
- **ขั้นตอนที่ทำให้เกิดปัญหา:**
- **Expected Result:**
- **Actual Result:**
- **Console Error:**
- **Network Request:**
- **Screenshot / Evidence:**
- **เกิดซ้ำได้หรือไม่:**
- **ความรุนแรง:** ☐ Critical ☐ High ☐ Medium ☐ Low
- **กระทบ Production หรือไม่:**
- **หมายเหตุ:**

*(คัดลอกบล็อกนี้ซ้ำตามจำนวน FAIL)*

---

## ADMIN_MID Verification

> SELECT เท่านั้น · ห้ามแก้ข้อมูล · บันทึกเฉพาะ role + count · **ห้ามบันทึก Username / Password / Email / PII**
> ⚠️ โค้ด client ใช้ตาราง `public.users` (`.from("users")`) — ถ้า schema จริงชื่อ `app_users` ให้สลับชื่อตาราง · ต้อง filter `app_code='massenger'`

```sql
-- ตัวหลัก (ตรงกับโค้ด client)
select role, count(*) as n
from public.users
where app_code = 'massenger'
group by role
order by role;

-- ถ้า schema ใช้ app_users
select role, count(*) as n
from public.app_users
where app_code = 'massenger'
group by role
order by role;
```

- **พบ ADMIN_MID หรือไม่:** ❌ ไม่พบ (Not Found in Production Database)
- **จำนวนผู้ใช้ (role · count):** SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 (รวม 177)
- **วันที่ตรวจ:**
- **ผู้ตรวจ:**
- **Query แบบ Read-only (วางที่ใช้จริง):**
- **ผลสรุป:** Official 5 role = SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF · ADMIN_MID ปิดถาวร · USER/MESSENGER_PENDING มีใน code · 0 ใน prod DB · ⚠️ query รันบน `app_users` โดยไม่ filter `app_code` (โค้ด client ใช้ `users`) — แนะนำ re-run `where app_code='massenger'` ยืนยันเฉพาะ MASSENGER
- **ต้องแก้ Role Mapping หรือไม่:** (ถ้าพบ → ห้ามแก้จนได้รับอนุมัติ · คง least-privilege)

---

## Gate Sign-off (ก่อน Phase 3)

| Gate | สถานะ | Evidence | ผู้อนุมัติ | วันที่ |
|---|---|---|---|---|
| Critical Test ผ่าน 100% | | | | |
| PF-01 ผ่านจริง | | | | |
| PF-02 ผ่านจริง | | | | |
| READ_ONLY ผ่านจริง | | | | |
| KILL_SWITCH ผ่านจริง | | | | |
| ADMIN_MID ยืนยันแล้ว | ✅ PASS — Not Found in prod DB | SELECT app_users | | |
| ไม่มี Console Error ใหม่ | | | | |
| ไม่มี Realtime Channel ซ้ำ | | | | |
| ไม่มี Timer ซ้ำ | | | | |
| UI Parity Desktop ผ่าน | | | | |
| UI Parity Mobile ผ่าน | | | | |

---

## Phase 3 Decision

**สถานะ (เลือกหนึ่ง):**
☐ NOT APPROVED  ☐ APPROVED WITH CONDITIONS  ☐ APPROVED

- **เหตุผล:**
- **รายการที่ยังค้าง:**
- **ผู้อนุมัติ:**
- **วันที่อนุมัติ:**

> เมื่อ APPROVED → Phase 3 เริ่ม **Login Module** เป็นก้อนแรก


---

## Decision Log — Role Verification (2026-07-13)
- Query (read-only): `SELECT role, COUNT(*) FROM public.app_users GROUP BY role ORDER BY role;`
- ผล: SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 (รวม 177)
- Official 5 role: SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF
- ไม่พบ: ADMIN_MID, USER, MESSENGER_PENDING → ถอด test row รอบนี้ · legacy code ไม่ลบ (freeze)
- caveat: query ไม่ filter `app_code` (โค้ดใช้ตาราง `users`) — แนะนำ re-run `app_code='massenger'`
- ไม่บันทึก PII
