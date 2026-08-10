# PERFORMANCE REPORT — MASSENGER V3 · 3.6.1 → 3.6.2

วันที่: 2026-08-10 · ตรวจจากซอร์สจริงใน `MASSENGER_V3_3.6.1.zip`
**ไม่ได้ execute SQL ใด ๆ · ไม่ได้ deploy · ไม่ได้แก้ข้อมูล Production**

---

## 0. สรุปผู้บริหาร

| หัวข้อในคำสั่ง | สถานะ |
|---|---|
| 1. ยกเลิก client-side distance backfill ตอน boot | ✅ **เสร็จ** |
| 2. หยุด client ซ่อมข้อมูลเอกสารตอน boot | ✅ **เสร็จ** |
| 3. ปรับการโหลดเอกสาร (badge RPC + query ต่อสถานะ) | ❌ **ไม่ได้ทำ** — ดูเหตุผลข้อ 5.1 |
| 4. Badge ขึ้นครบตั้งแต่หน้าแรก + count เจ้าของเดียว | ✅ **เสร็จ** |
| 5. แยก `heavy-doc.js` ลด app.js ≥30% | ❌ **ไม่ได้ทำ** — ดูเหตุผลข้อ 5.2 |
| 6. ลด Lucide เหลือ subset | ❌ **ทำไม่ได้** — ดูเหตุผลข้อ 5.3 |
| 7. เปิด `DOC_STATUS_RPC:true` + fallback | ✅ **เสร็จ** |
| 8. Search-on-demand คงเดิม + ไฟล์ index SQL | ✅ **เสร็จ** (ไฟล์ SQL แยก ยังไม่ execute) |
| 9. รายงาน Hosting header | ⚠️ **ตรวจไม่ได้จาก source** — ให้ขั้นตอนตรวจไว้ข้อ 6 |
| 10. ถอด seed users + รหัสผ่านออกจาก bundle | ✅ **เสร็จบางส่วน** — ดูข้อ 4 (สำคัญมาก) |

**ผลที่วัดได้จริง:** ขนาด boot ลด **1.6%** (เล็ก) · แต่ **request ตอน boot ของ ADMIN ลดลงมากที่สุดถึง ~500 requests**

---

## 1. ขนาดไฟล์ ก่อน/หลัง (gzip -9 วัดจริง)

| ไฟล์ | 3.6.1 | 3.6.2 | ต่าง |
|---|---:|---:|---:|
| `index.html` | 9,920 | 9,920 | 0 |
| `css/app.css` | 24,436 | 24,436 | 0 |
| `config/runtime-config.js` | 1,486 | 1,489 | +3 |
| `js/utils/format.js` | 686 | 686 | 0 |
| `js/core/runtime.js` | 2,407 | 2,407 | 0 |
| `js/app.js` | 125,386 | **122,689** | **−2,697** |
| **รวม boot** | **164,321** | **161,627** | **−2,694 (−1.6%)** |

`js/admin/seed-users.js` = 3,106 gzip · **ไม่โหลดตอน boot** (โหลดเมื่อ SUPER_ADMIN กด Sync Users เท่านั้น)

> **ห้ามอ้างว่าเร็วขึ้นมาก** — ตัวเลข 18 KB raw ที่ย้ายออกบีบอัดได้ดีมาก จึงลด gzip เพียง 2.7 KB
> เป้าหมาย "ลด app.js 30% gzip" **ยังไม่บรรลุ** ต้องแยก `heavy-doc.js` (ข้อ 5.2)

---

## 2. จำนวน Network Request ตอน boot (นับจากโค้ดจริง)

### ผู้ใช้ทั่วไป (USER / STAFF / MESSENGER / SHIPPING)

| ลำดับ | Request | 3.6.1 | 3.6.2 |
|---|---|---|---|
| 1 | `rpc has_super_admin` (cache หลังครั้งแรก) | 1 | 1 |
| 2 | `users` select — ตรวจ session | 1 | 1 |
| 3 | `users.update online` (ไม่บล็อก) | 1 | 1 |
| 4 | `jobs` ตามสถานะของหน้า landing | 1 | 1 |
| 5 | `massenger_sidebar_counts` | 1 | 1 |
| 6 | `users` select — loadUsers | 1 | 1 |
| 7 | `shipping_location_routes` | 1 | 1 |
| 8 | `documents` ×2 (idle · nonblocking) | 2 | 2 |
| 9 | `doc_card_statuses` | 1 | 1 |
| 10 | **`_resetStalePostponed` select + update ทีละแถว** | 1 + N | **0** |
| 11 | **`_syncOrphanedDirectDocs` select + update ทีละแถว** | 1 + N | **0** |
| **บล็อกก่อนใช้งานได้** | | **4–5** | **4–5** |
| **รวมทั้งหมด** | | 11 + 2N | **9** |

### ADMIN / SUPER_ADMIN — จุดที่เปลี่ยนมากที่สุด

| Request | 3.6.1 | 3.6.2 |
|---|---|---|
| `jobs` select 500 แถว (distance backfill) | 1 | **0** |
| `jobs.update` ทีละแถว ชุดละ 5 เว้น 120 ms | **สูงสุด 500** | **0** |
| เวลาที่ยิงต่อเนื่องหลัง login | **~12 วินาที** | **0** |

**ADMIN boot ลด request สูงสุด ~501 รายการ** — นี่คือผลลัพธ์หลักของรอบนี้ ไม่ใช่ขนาดไฟล์

---

## 3. รายการแก้ไขทีละจุด

| # | ไฟล์ | Function | เดิม | ใหม่ |
|---|---|---|---|---|
| 1 | `js/app.js` | boot IIFE | `setupRealtime();_scheduleDistanceBackfillGlobal();` | `setupRealtime();` — ฟังก์ชันยังอยู่ เรียกมือได้ |
| 2 | `js/app.js` | `loadDocuments()` | `_resetStalePostponed().then(...)` + `_syncOrphanedDirectDocs().then(...)` | ตัดออกทั้งคู่ · ฟังก์ชันยังอยู่ · ย้ายไป SQL |
| 3 | `js/app.js` | `loadJobs()` | `cacheJobsDebounced(S.jobs);loadStatusCounts();` | ตัด `loadStatusCounts()` ออก |
| 4 | `js/app.js` | `_mergeUserTerminals()` | MESSENGER เรียก `loadStatusCounts()` ซ้ำ | ตัดออก · ยังคง `renderSidebar()`/`renderView()` เดิม |
| 5 | `js/app.js` | `loadAll()` | ไม่ await count | `await Promise.all([loadJobs(),loadUsers()])` → `await loadStatusCounts()` |
| 6 | `js/app.js` | `getSeedUsers()` | array 121 บัญชี + รหัสผ่าน ฝังใน bundle | อ่านจาก `window.__SEED_USERS` · เพิ่ม `_ensureSeedUsers()` โหลด lazy |
| 7 | `js/app.js` | `syncUsersFromSeed()` | ใช้ array ในไฟล์ | `await _ensureSeedUsers()` ก่อน |
| 8 | `js/admin/seed-users.js` | **ไฟล์ใหม่** | — | ย้าย array มาไว้ที่นี่ · **ไม่ถูกอ้างจาก `index.html`** |
| 9 | `js/heavy-users.js` | `renderUsersView()` | `getSeedUsers().length` | โหลด lazy แล้ว re-render — ตัวเลข "SEED N คน" ยังแสดงเหมือนเดิม |
| 10 | `config/runtime-config.js` | — | `DOC_STATUS_RPC:false` · build 3.6.1 | `true` · build **3.6.2** |
| 11 | `js/core/runtime.js` | `_RC_DEFAULTS` | 3.6.1 | 3.6.2 |
| 12 | `index.html` | `?v=` 5 จุด | 3.6.1 | 3.6.2 |

**ไฟล์ที่ไม่แตะเลย:** `css/app.css` · `js/utils/format.js` · `js/heavy-jobs.js` · `js/heavy-dash.js` · `js/heavy-export.js` · `js/heavy-ot.js` · `js/app.monolithic.js`

### Badge — ยืนยันว่ามีเจ้าของเดียวต่อ flow

| Flow | ผู้เรียก `loadStatusCounts()` | จำนวน |
|---|---|---|
| Boot | `loadAll()` | 1 |
| ปุ่มรีเฟรช | `refreshAll()` | 1 |
| Realtime | `scheduleStatusCounts()` (debounce 600 ms) | 1 ต่อชุด |

Badge รอรับงาน / กำลังดำเนินการ / พรุ่งนี้ / ล่วงหน้า / FZ / งานทั้งหมด มาจาก RPC `massenger_sidebar_counts` ทั้งหมด — **ตัวเลขไม่เปลี่ยนจาก 3.6.1**

---

## 4. 🔴 SECURITY — เรื่องที่สำคัญที่สุดในรายงานนี้

พบใน `js/app.js` ของ 3.6.1:

```
getSeedUsers() → array 121 บัญชี
  username + password แบบ plaintext
  SUPER_ADMIN 2 · ADMIN 4 · STAFF 115
```

**ไฟล์นี้ถูกส่งให้ทุกเบราว์เซอร์ที่เปิดระบบ** — ใครก็ตามที่เปิด DevTools หรือเปิด URL `js/app.js` ตรง ๆ จะเห็นรหัสผ่าน SUPER_ADMIN ทั้งหมด

### ที่ทำไปแล้วใน 3.6.2
- ย้าย array ออกจาก `js/app.js` → `js/admin/seed-users.js`
- `index.html` **ไม่อ้างอิงไฟล์นี้** โหลดเฉพาะเมื่อ SUPER_ADMIN กด "Sync Users"
- `js/app.js` เหลือรหัสผ่าน **0 รายการ** (ตรวจแล้ว)

### ⚠️ ที่ยัง**ไม่ปลอดภัย**
ไฟล์ `js/admin/seed-users.js` ยังเปิดได้จาก URL ตรง ๆ — **ยังไม่แก้ปัญหาที่ราก**

**สิ่งที่ต้องทำ เรียงตามความเร่งด่วน:**
1. **เปลี่ยนรหัสผ่านทั้ง 121 บัญชีทันที** โดยเฉพาะ SUPER_ADMIN 2 บัญชี — ถือว่ารหัสเดิมรั่วแล้ว
2. **อย่า deploy `js/admin/seed-users.js` ขึ้น hosting** ถ้าไม่ได้ใช้ Sync Users แล้ว (ระบบทำงานปกติโดยไม่มีไฟล์นี้ — จะขึ้น error เฉพาะตอนกดปุ่ม Sync)
3. ถ้ายังต้องใช้ Sync Users → ย้าย seed ไปเก็บฝั่ง server แล้วให้ client เรียก RPC ที่ไม่ส่งรหัสผ่านกลับมา
4. ตรวจ `login_plain` ว่าเก็บรหัสผ่านแบบ hash หรือ plaintext (`password_display` ใน `USER_COLS` บ่งชี้ว่าอาจเป็น plaintext)

**ผมไม่ได้เปลี่ยนบัญชีใด ๆ ไม่ได้ลบใคร และไม่ได้แก้ระบบรหัสผ่าน** ตามที่สั่ง

### READ_ONLY — รายงานความไม่ตรงกัน (ไม่ได้แก้)

| แหล่ง | ค่า |
|---|---|
| `config/runtime-config.js` คอมเมนต์ | "false = เขียนข้อมูลได้ (live) · true = อ่านอย่างเดียว (UAT)" |
| `config/runtime-config.js` ค่าจริง | `READ_ONLY: false` · `ENVIRONMENT: "uat"` |
| `js/core/runtime.js` `_RC_DEFAULTS` | `READ_ONLY: true` (fail-safe ถ้า config โหลดไม่ติด) |
| `js/app.js` | มีตัวแปร `MASSENGER_READ_ONLY` และ `RO_RPC_ALLOW` |

**ประเด็น:** `ENVIRONMENT` ยังเป็น `"uat"` ทั้งที่ใช้งานจริงมา 1 เดือน → `_rcWarn()` จะ `console.warn` ทุกครั้งที่อ่านค่าผิดชนิด
**ผมไม่ได้เปลี่ยนค่าใด ๆ** ตามที่สั่ง — ให้คุณตัดสินใจว่าจะตั้ง `ENVIRONMENT:"production"` หรือไม่

---

## 5. หัวข้อที่ยังไม่ได้ทำ และเหตุผล

### 5.1 ข้อ 3 — ปรับการโหลดเอกสาร (ไม่ได้ทำ)

**ตรวจปริมาณจริงแล้วพบว่าไม่คุ้มความเสี่ยง:**

| ก้อน | เพดานในโค้ด | แถวจริง |
|---|---|---|
| `_open` (7 สถานะเปิด) | 800 | **81** |
| `_win` มือถือ (COMPLETED วันนี้) | 300 | **64** |
| `_win` คอม (สร้าง 7 วันล่าสุด) | 800 | **521** |

มือถือโหลดจริง **~145 แถว** ไม่ใช่ 1,100 ตามเพดาน · **ไม่มีข้อมูลตกหล่น** (ห่างเพดาน 5–10 เท่า)

การรื้อเป็น query ต่อสถานะ + `.range()` ต้องแก้ `_docComputeRows()` / `docCounts()` / `_docVisibleList()` ซึ่งเมนูเอกสาร **ทุกสถานะใช้ร่วมกัน** — ความเสี่ยงสูงมากเทียบกับผลที่ได้จาก 145 แถว

**ข้อเสนอ:** ทำเมื่อ `_win` คอมเข้าใกล้ 750 แถว (ตอนนี้ 521)

### 5.2 ข้อ 5 — แยก `heavy-doc.js` (ไม่ได้ทำ)

เป็นงานใหญ่ที่สุดในคำสั่งนี้ ต้องย้าย Document UI + Modal + Timeline + Status + Detail ออกจาก `app.js` ซึ่งผูกกับ `initDocModule()` และ `setupDocRealtime()` ตอน boot

**ผมเลือกไม่ทำในรอบเดียวกับข้ออื่น** เพราะถ้าทำพลาดจะกระทบทั้งโมดูลเอกสาร และไม่มีทางทดสอบกับเบราว์เซอร์จริงจากฝั่งผม
**นี่คือข้อที่ให้ผลด้านขนาดมากที่สุดที่เหลืออยู่ (คาด −25–35% gzip) — ควรทำเป็นรอบแยกที่มีเวลาทดสอบเต็ม**

### 5.3 ข้อ 6 — Lucide subset (ทำไม่ได้)

ไอคอนที่ใช้จริงนับได้ **69 ชื่อ** จาก `data-lucide` ทุกไฟล์ (+ ~6 ชื่อจาก icon map แบบ dynamic) จากไลบรารีที่มีราว 1,600 ไอคอน

**อุปสรรค:** สภาพแวดล้อมที่ผมทำงานอยู่เข้าถึง `unpkg.com` / `cdn.jsdelivr.net` ไม่ได้ จึงดึง SVG path ของ lucide มาสร้าง subset ไม่ได้

**สิ่งที่คุณทำได้:** ส่ง `lucide.min.js` หรือ SVG ของ 69 ไอคอนมาให้ ผมจะสร้าง `js/icons.js` + แก้ `refreshIconsIn()` ให้ inject จาก map แทน (จะทำให้ `lucide.createIcons()` หายไปทั้งหมด ไม่ต้องสแกน DOM อีก)

> หมายเหตุ: `refreshIconsIn(scope)` แก้ไปแล้วตั้งแต่รอบก่อน — ลอง `lucide.createIcons({root:scope})` ก่อน ถ้าไอคอนใน scope ยังเหลือจึง fallback สแกนทั้งหน้า จึงไม่มีไอคอนหาย

---

## 6. Hosting — ตรวจไม่ได้จาก source (ข้อ 9)

ผมไม่มี URL ที่ deploy จริง จึง **ไม่เดาว่าเปิด Brotli แล้วหรือยัง**

**ขั้นตอนตรวจ:** DevTools → Network → Hard refresh → คลิก `js/app.js` → แท็บ Headers

| Header | ค่าที่ควรเป็น | ถ้าไม่ใช่ |
|---|---|---|
| `content-encoding` | `br` | ถ้าเป็น `gzip` → เปิด Brotli ที่ hosting = ลดอีก ~20% โดยไม่แตะโค้ด |
| `cache-control` (ไฟล์ที่มี `?v=`) | `public, max-age=31536000, immutable` | ถ้าสั้นกว่านี้ → ผู้ใช้โหลดซ้ำทุกครั้ง |
| `cache-control` (`index.html`) | `no-cache` หรือ `max-age=0, must-revalidate` | ถ้ายาว → Force Update ไม่ทำงาน ผู้ใช้ค้างเวอร์ชันเก่า |
| Protocol (คอลัมน์ Protocol) | `h2` หรือ `h3` | ถ้า `http/1.1` → request ต่อคิวกัน |

ส่งค่าทั้ง 4 มา ผมจะบอกว่าต้องปรับตรงไหนของ hosting ที่คุณใช้

---

## 7. ผลทดสอบ

### `node --check` — ผ่านทุกไฟล์
```
app.js · heavy-jobs.js · heavy-dash.js · heavy-export.js · heavy-ot.js
heavy-users.js · core/runtime.js · utils/format.js · config/runtime-config.js
admin/seed-users.js
```

### ตรวจเชิงสถิตที่รันแล้ว
| ตรวจ | ผล |
|---|---|
| `password:` ใน `js/app.js` | **0** (เดิม 121) |
| `_scheduleDistanceBackfillGlobal()` ใน boot path | **0** |
| `_resetStalePostponed()` ใน `loadDocuments()` | **0** |
| `_syncOrphanedDirectDocs()` ใน `loadDocuments()` | **0** |
| `loadStatusCounts()` ใน `loadJobs()` | **0** |
| `loadStatusCounts()` ใน `_mergeUserTerminals()` | **0** |
| `limit(1e4)` ทั้งไฟล์ | **0** |
| เมนู "งานทั้งหมด" มือถือ | ซ่อน (`isSuper&&_IW>768`) |
| เมนู "เอกสารทั้งหมด" มือถือ | ซ่อน (`_docIsSuper()&&_IW>768`) |
| `setView` redirect มือถือ | `jobs→wait` · `doc-all→doc-new` |
| Search on demand | `.range()` + `count:"exact"` + AbortController · 50 แถว/หน้า |

### ⚠️ ที่ยัง **ไม่ได้ทดสอบ** (ผมทำไม่ได้)
- ทดสอบด้วยเบราว์เซอร์จริงทุก role (SUPER_ADMIN / ADMIN / STAFF / USER / MESSENGER / SHIPPING)
- Realtime · สร้างงาน · รับงาน · ปิดงาน · โมดูลเอกสาร
- Lighthouse · Network waterfall จริง
- SQL migration ทั้ง 3 ไฟล์ (ยังไม่ execute ตามคำสั่ง)

**จึงยังอ้างไม่ได้ว่า "ผ่านการทดสอบทั้งหมด"** — ต้องทดสอบตาม `DEPLOY_FILES.txt` ก่อนขึ้น production

---

## 8. งานที่เหลือ เรียงตามผลลัพธ์

| ลำดับ | งาน | ผลคาด | ใครทำ |
|---|---|---|---|
| 1 | **เปลี่ยนรหัสผ่าน 121 บัญชี** | ปิดช่องโหว่ | คุณ — เร่งด่วนที่สุด |
| 2 | ตรวจ Brotli / cache-control / HTTP2 | อาจลดอีก ~20% ฟรี | คุณ (ส่งค่ามา) |
| 3 | แยก `heavy-doc.js` | −25–35% gzip | ผม (รอบแยก) |
| 4 | Lucide subset 69 ไอคอน | ตัด CDN + ตัด DOM scan | ผม (ต้องได้ SVG จากคุณ) |
| 5 | รัน `migration_massenger_maintenance.sql` แบบ DRY RUN | ทดแทนงานซ่อมที่ถอดออก | คุณ |
