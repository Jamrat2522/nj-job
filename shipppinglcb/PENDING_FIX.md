# MASSENGER V3 — PENDING FIX REGISTER

> รายการที่ยัง **ไม่ผ่าน / รอแก้** · ห้ามแก้โค้ดจนกว่าได้รับอนุมัติ
> เป็น Gate ของ Phase 3 (บางรายการต้องเคลียร์ก่อน)
> จัดทำ: หลัง Phase 2.5 · อัปเดตตามการตัดสินใจผู้ใช้

| ID | หัวข้อ | สถานะ | บล็อก Phase 3? |
|---|---|---|---|
| PF-01 | Feature Flag ต้องเป็น Access Gate (ไม่ใช่แค่ซ่อนเมนู) | Code-complete (2.6) · ⚠️ ยังไม่ PASS — รอ Browser Regression จริง | ✅ ใช่ (จนกว่าผ่าน browser) |
| PF-02 | Safe Landing ของ SHIPPING เมื่อ documents=false | Code-complete (2.7) · ⚠️ ยังไม่ PASS — รอ Browser Regression จริง | ✅ ใช่ (จนกว่าผ่าน browser) |
| PF-03 | Pagination `DOC.pageSize=50` / `_ALLJOBS_PAGE=150` | Locked (คงเดิม) | ❌ ห้ามแตะใน 2.5/3 |
| PF-04 | Role Verification (Production DB) | ✅ VERIFIED · Production DB มี 5 role เท่านั้น | ❌ ปิดแล้ว |
| PF-05 | `manifest.json` / icon-192 ไม่อยู่ในชุดไฟล์ | Pending (เตรียมก่อน deploy) | ◽ ควรเคลียร์ |

---

## PF-01 · Feature Flag = Access Gate · Code-complete (2.6) · ⚠️ ยังไม่ PASS (รอ Browser Regression)

**ปัญหา:** Phase 2.5 wire feature flag แบบ **ซ่อนเมนูอย่างเดียว** → ถือว่า **ยังไม่ผ่าน**

**ต้องป้องกันครบทุกทาง เมื่อ feature = false:**
- ซ่อนเมนู (ทำแล้วใน 2.5)
- บล็อก `setView(...)` ตรง
- บล็อกการเรียกฟังก์ชัน render ตรง (เช่น `renderGraphsPage()`, `renderUsersView()`, `renderDocView()`, `exportExcel()`)
- บล็อกเปิดผ่าน URL / hash / state เดิม
- บล็อกปุ่ม / shortcut อื่น

**แนวทาง (Phase ถัดไป — ยังไม่ทำ):** เพิ่ม access gate ที่ชั้น Router/View Controller — จุดศูนย์กลางที่ `setView()` และ `renderView()` ตรวจ `getRuntimeFeature(...)` ก่อนสลับ/เรนเดอร์ view ที่ผูกกับ feature นั้น · ถ้าปิด → ส่งไป safe view/feature-unavailable

**map view ↔ feature (อ้างอิงจริง):**
- dashboard → `graphs` (renderGraphsPage), `dashboard` (renderDashboard)
- users → `users` (renderUsersView)
- documents → `doc-*` (renderDocView) + doc sidebar section
- export → `exportExcel()` (ปุ่ม + ฟังก์ชัน)

**Test:** FEAT-02, FEAT-04 (+ ครอบ documents/export ด้วยเมื่อลงมือแก้)
**กติกา:** feature flag เป็นชั้นเสริม · **ห้ามเปิด/เพิ่มสิทธิ์ให้ role ใด** · permission เดิมยังเป็นชั้นหลัก

---

## PF-02 · Safe Landing (SHIPPING) · Code-complete (2.7) · ⚠️ ยังไม่ PASS (รอ Browser Regression)

**ปัญหา:** SHIPPING landing = `doc-new` แต่ถ้า `documents=false` หมวด DOCUMENT ถูกซ่อน → เสี่ยงหน้าว่าง/loop/error

**ต้องกำหนด Safe Landing (เมื่อ documents=false และ SHIPPING login):**
- ❌ ห้ามส่งไปหน้า documents
- ❌ ห้ามหน้าว่าง · ห้าม loop · ห้าม error

**ลำดับ Safe Landing (แนะนำ · Phase ถัดไป):**
1. work/messenger view — ถ้า role มีสิทธิ์เข้าถึง
2. dashboard — ถ้าเปิด (feature) และ role มีสิทธิ์
3. maintenance / feature-unavailable page

**กติกาเหล็ก:** **ห้ามเปิดสิทธิ์ใหม่ให้ SHIPPING เพียงเพื่อให้มีหน้า landing** — ถ้า role ไม่มี view ใดเข้าได้เลย → แสดง feature-unavailable page (ไม่ใช่บังคับให้เห็น view ที่ไม่มีสิทธิ์)

**หมายเหตุ:** SHIPPING เดิมเป็น shipping-only (department/role=SHIPPING) — โดยปกติเห็นเฉพาะ DOCUMENT · จึงกรณีปิด documents สำหรับ SHIPPING มักตกที่ข้อ 3 (feature-unavailable) เว้นแต่ config ให้สิทธิ์อื่น
**Test:** FEAT-07

---

## PF-03 · Pagination (Locked)

- `DOC.pageSize = 50` (docs desktop) · `_ALLJOBS_PAGE = 150` (jobs "all" view) → **คงเดิม**
- **ยังไม่อนุมัติเปลี่ยนเป็น 100 ทั้งใน Phase 2.5 และ Phase 3**
- เหตุผล: เกี่ยวข้อง Documents / งานทั้งหมด / KPI / Search / Filter / Export / Realtime → ต้องวิเคราะห์+ทดสอบแยก (Phase Performance)
- แก้ได้ต่อเมื่อมี Browser Regression + Data Parity ยืนยันครบ
- (ที่ wire แล้วใน 2.5 = เฉพาะ jobs desktop `PAGE_SIZE`→100 และ mobile-ops→40)

---

## PF-04 · ADMIN_MID ✅ CLOSED (Not Found in Production Database)

- ✅ ตรวจ Production DB แล้ว (`SELECT role, COUNT(*) FROM app_users GROUP BY role`): **ไม่พบ ADMIN_MID**
- ผลจริง: SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115
- **สรุป:** ADMIN_MID ไม่มีทั้งในโค้ดและ Production DB → **ไม่รองรับ · ปิดถาวร** · ห้ามสร้าง permission · ห้ามเพิ่ม logic · ห้ามเดาสิทธิ์
- Official 5 role: SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF
- **USER + MESSENGER_PENDING:** ไม่พบใน prod DB เช่นกัน → ถอดจาก active matrix · **Legacy Code Reference — Not Present in Current Production Data** (โค้ดเดิมยังมี logic · ไม่ลบ · freeze · วิเคราะห์ใน Phase Refactor)
- ⚠️ query รันบน `app_users` โดยไม่ filter `app_code` (โค้ด client ใช้ `users`) — แนะนำ re-run `where app_code='massenger'` ยืนยันเฉพาะ MASSENGER
- **Test:** DBV-01 (ปิดแล้ว)

---

## PF-05 · manifest.json / icons

- `index.html` อ้าง `manifest.json`, `icon-192.png`, `theme-color` (จาก prod เดิม) — ยังไม่รวมในชุดไฟล์ V3
- ต้องเตรียม/ตรวจก่อน deploy จริง (กัน 404) — **รายงาน ห้ามเดาสร้างเนื้อหา**
- **Test:** NET-02


---

## อัปเดต PF-01 / PF-02 (Phase 2.6/2.7)
- Gate ฝัง 7 จุด (setView·renderView·renderGraphsPage·renderUsersView·renderDocView·renderDashboard·exportExcel) + safe landing resolver
- URL/hash ไม่ใช่ view vector (hash routing = 0)
- SHIPPING+documents=false → FEATURE_UNAVAILABLE (ไม่เปิดสิทธิ์ใหม่)
- Node gate test 27/27 · **รอ browser regression (FEAT-*) ยืนยันปิดงาน**
- ดู MASSENGER_V3_PHASE_2_6_2_7_CHANGES.md · app.js md5 98bce794→63c55432


---

## Decision Log — Role Verification (2026-07-13)
- **วันที่ตรวจ Production DB:** 2026-07-13
- **Query (read-only):** `SELECT role, COUNT(*) FROM public.app_users GROUP BY role ORDER BY role;`
- **ผลจำนวน role:** SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 (รวม 177)
- **Role ที่รองรับอย่างเป็นทางการ (5):** SUPER_ADMIN, ADMIN, SHIPPING, MESSENGER, STAFF
- **Role ที่ไม่พบใน Production DB:** ADMIN_MID, USER, MESSENGER_PENDING
- **การตัดสินใจ:** ถอดทั้ง 3 role ออกจากเอกสาร/matrix/checklist/gate รอบนี้ · **ไม่แก้ logic เดิมในโค้ด** (ลบโค้ด = logic change · freeze) → คงเป็น **Legacy Code Reference — Not Present in Current Production Data** เพื่อวิเคราะห์ใน Phase Refactor
- **caveat:** query รันบน `app_users` โดยไม่ filter `app_code` (โค้ด client ใช้ตาราง `users`) — แนะนำ re-run `where app_code='massenger'` ยืนยันเฉพาะ MASSENGER
- ไม่บันทึก PII (username/password/email)

## Freeze Baseline (full MD5 · ห้ามแก้)
- js/app.js = `63c5543270425bf1cd4ff27082b13b3b`
- css/app.css = `6081e65469f7f70520476b793b15caa4`
- index.html = `64f110c765d0700587bd3fd58cde8a2e`
- config/runtime-config.js = `51419c7b588e9fa0f3b0622450bdc525`

---

## Safe-Fix Pass (2026-07-13) — รายการที่ "คงโค้ดเดิมไว้ก่อน" (เสี่ยงสูง/ยืนยันไม่ครบ)

| ID | หัวข้อ | เหตุผลที่ยังไม่ทำ |
|---|---|---|
| PERF-01 | แยก util/component/per-menu module เพิ่มจาก app.js | source เป็น minified single-line → ตัดกลาง scope เสี่ยง · แยก classic ไม่ลด parse · ต้อง browser regression คั่น (ยังไม่มี env) |
| PERF-02 | Lazy dynamic import (ES module) ต่อเมนู เพื่อลด JS-parse ตอน login | onclick global 233 จุด → ES module ทำปุ่มหายถ้า export ไม่ครบ · ต้องแปลง + ทดสอบทีละเมนูบน browser |
| PERF-03 | DOM/CSS optimization (DocumentFragment, content-visibility, ลบ CSS ไม่ใช้) | เสี่ยงกระทบ layout/responsive · CSS อาจถูกสร้างจาก template string → ต้องยืนยัน reference ครบก่อนลบ |
| SEC-01 | Plaintext login (`login_plain` + `password_display`) | ต้องแก้ DB schema + RPC + auth flow = ขัด "ห้ามเปลี่ยน RPC/Table/Login" · แยก Security Track + อนุมัติ (ดู SECURITY_AUDIT.md) |
| SEC-02 | ฟีเจอร์ดูรหัสผ่าน (`password_audit_logs`) | ผูกกับ SEC-01 · แก้เมื่อย้ายไป hash แล้ว |

**หลักการ:** ตามคำสั่ง — จุดเสี่ยงสูง/ยืนยัน dependency ไม่ครบ ให้คงโค้ดเดิม + บันทึกที่นี่ · ห้ามเดาวิธีแก้ · correctness > completeness
