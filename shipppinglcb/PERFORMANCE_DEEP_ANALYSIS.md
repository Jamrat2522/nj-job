# MASSENGER V3 — PERFORMANCE DEEP ANALYSIS (เจาะลึก · เน้นมือถือ)

> วิเคราะห์จากไฟล์จริง `js/app.js` (545,645 B / gzip 131,483) + `css/app.css` (126,754 B) · **read-only ไม่แตะโค้ด**
> ตัวเลขทั้งหมด grep จากไฟล์จริง · runtime จริง (LCP/TTI) ต้องยืนยันด้วย Lighthouse บนมือถือ

## สรุปผู้บริหาร — 3 ตัวการหลักที่ทำให้มือถือช้า
1. **JS 545KB ต้อง parse/compile บน CPU มือถือทั้งก้อนตอนเปิด** (ใหญ่สุด · main-thread block)
2. **Render ตาราง/การ์ดด้วย `innerHTML` ก้อนใหญ่** (136 จุด) → layout+paint หนัก โดยเฉพาะ 100 แถว/หน้า
3. **CSS paint แพง:** `box-shadow` 130 + `gradient` 62 + `backdrop-filter` 4 (blur) → jank ตอน scroll/modal บน GPU มือถือ

---

## อันดับผลกระทบ (มือถือ)

### 🔴 #1 — JS parse/compile 545KB ทั้งก้อนตอน startup
**หลักฐาน:** `js/app.js` 545,645 B raw · classic script (`defer` แต่ยัง parse ครบตอนโหลด) · `await` 276 จุด
**ทำไมช้าบนมือถือ:** CPU มือถือ (โดยเฉพาะเครื่องกลาง-ล่าง) parse+compile JS ช้ากว่าเดสก์ท็อป ~3–5 เท่า · 545KB = งาน main-thread ก้อนใหญ่ก่อนแตะจอได้ → TTI (time-to-interactive) สูงบนมือถือ
**ที่มา:** โครงเดิมเป็น single-file · การแยกเป็น classic script (core/runtime, utils/format) **ไม่ลด parse รวม** เพราะโหลดครบตอนเปิด
**ทางแก้ (ยังไม่ทำ · PENDING PERF-02):** lazy dynamic import ต่อเมนู (dashboard/users/export/documents โหลดเมื่อเปิด) → ลด JS ที่ parse ตอน login จริง · **ติดเงื่อนไข** onclick global 233 จุด → ต้องแปลง + browser regression

### 🔴 #2 — Render ด้วย `innerHTML` ก้อนใหญ่ (โดยเฉพาะ 100 แถว/หน้า)
**หลักฐาน:** `innerHTML=` **136 จุด** · `.map(...).join()` สร้าง HTML string 6 จุด · `renderDocView` อ้าง 38 ครั้ง · `renderJobsView` 11 · `PAGE_SIZE` desktop=100 / mobile-ops=40
**ทำไมช้าบนมือถือ:** สร้าง string ยาว → `innerHTML` parse HTML + สร้าง DOM subtree + layout + paint ทั้งก้อน · 100 แถว × (badge + icon + box-shadow) = DOM node เยอะ → หน่วงตอนสลับ view/filter บนมือถือ
**บรรเทาแล้วบางส่วน:** jobs มี `diffJobsTbody` (reuse แถวจาก data-job-ver) · แต่ **doc view (renderDocView) ยังหนัก** (อ้าง 38 จุด)
**หมายเหตุมือถือ:** ไม่มี list virtualization → ทุกแถวในหน้าถูกสร้างจริง (memory + paint บนเครื่อง low-end)
**ทางแก้ (PENDING PERF-03):** DocumentFragment · render เฉพาะแถวที่เปลี่ยน · virtualize (แต่เสี่ยง copy/select/modal → ต้องระวัง)

### 🔴 #3 — CSS paint cost: box-shadow / gradient / backdrop-filter
**หลักฐาน:** `box-shadow` **130** · `gradient` **62** · `backdrop-filter` **4** · `position:fixed/sticky` 18
**ทำไมช้าบนมือถือ:**
- **`backdrop-filter: blur`** = แพงสุดบน GPU มือถือ · ถ้าอยู่บน overlay/modal ที่มี content เลื่อนด้านหลัง → re-composite ทุกเฟรม = jank ชัดตอนเปิด modal + scroll
- **`box-shadow` 130 จุด** บนการ์ด/แถวในลิสต์ยาว → repaint แพงตอน scroll (shadow ต้อง re-rasterize)
- **`gradient` 62** + **fixed/sticky 18** → fixed element ต้อง repaint ตาม scroll
**ทางแก้ (PENDING):** จำกัด backdrop-filter เฉพาะที่จำเป็น · แทน box-shadow ในลิสต์ยาวด้วย border/เงาเบา · `will-change`/`contain` เฉพาะจุด (ตอนนี้ใช้แค่ `will-change` 1, `contain` 1, `content-visibility` 3 = ยังใช้น้อยมาก = โอกาสปรับ)

### 🟠 #4 — Continuous animation (กิน battery/paint บนมือถือ)
**หลักฐาน:** `animation` 14 · `@keyframes` 6 · `transition` 36 (ส่วนใหญ่เป็น transform/box-shadow — transform ดี เพราะ composite ได้)
**ทำไมช้า:** ถ้า keyframe animation (spinner/pulse/progress) วิ่งต่อเนื่องแม้ไม่เห็น → compositor ทำงานตลอด = กิน battery + paint บนมือถือ
**ทางแก้ (PENDING):** หยุด animation เมื่อ element ไม่อยู่ใน viewport / เมื่อ tab hidden · ตรวจว่า loader/spinner ถูกถอดออกจริงหลังโหลดเสร็จ

### 🟠 #5 — Timer 5 ตัว + Realtime วิ่งบนมือถือ
**หลักฐาน:** `setInterval` 5 (doc overdue 60s · doc completed 60s · heartbeat 60s · boot poll · watchdog) · `clearInterval` 7 (มี guard) · realtime 3 channel
**ทำไมช้า/เปลืองมือถือ:** interval ปลุก CPU ทุก 60s + WebSocket realtime → กัน device เข้า idle → battery drain · ถ้า background ไม่ teardown ครบจะยิ่งเปลือง (มี `_teardownRealtime` ตอน hidden — ดีแล้ว แต่ต้องยืนยัน runtime)
**ทางแก้ (ยืนยัน browser):** หยุด interval ตอน tab hidden · ยืนยัน teardown/re-subscribe ไม่ทับซ้อน (REGRESSION §16/17)

### 🟠 #6 — DOM lookup ซ้ำ + อ่าน innerWidth บ่อย (layout thrashing)
**หลักฐาน:** `getElementById` **193** · `querySelector` 79 · `querySelectorAll` 30 · **`window.innerWidth` 71 จุด** (mobile branch)
**ทำไมช้าบนมือถือ:** อ่าน `innerWidth` = บังคับ browser คำนวณ layout (reflow) · ถ้าอ่านสลับกับเขียน DOM ในลูป/หลาย ๆ จุด (71 ครั้ง) → **layout thrashing** = หน่วงชัดบนมือถือ · getElementById 193 ครั้งซ้ำ ๆ ใน 각 render โดยไม่ cache = งานเพิ่ม
**ทางแก้ (PENDING):** cache `innerWidth`/`isMobile` ไว้ 1 ค่า อัปเดตตอน resize (debounced) · cache DOM reference ที่ใช้ซ้ำ

### 🟡 #7 — Font 8 ไฟล์ (Inter×4 + Sarabun×4)
**หลักฐาน:** `family=Inter:wght@400;600;700;800&family=Sarabun:wght@400;600;700;800`
**ทำไมช้าบนมือถือ:** 2 family × 4 น้ำหนัก = สูงสุด 8 ไฟล์ font บนเน็ตมือถือ · มี `display=swap` (ดี — กัน FOIT) และ preconnect fonts.gstatic (ดี)
**ทางแก้ (PENDING · ปลอดภัยปานกลาง):** ตัดน้ำหนักที่ไม่ได้ใช้จริง (เช่นเหลือ 400/700) หลังยืนยันว่าไม่กระทบดีไซน์ — **ต้องเช็ค reference ใน CSS ก่อน · ห้ามเดา**

### 🟡 #8 — รูปจากกล้องมือถือ
**หลักฐาน:** `compressImageIfNeeded` (resize max 1280 · JPEG q0.65 · canvas · HEIC 2-layer)
**ทำไมช้า:** decode รูปกล้อง (หลาย MB) + canvas resize บน main thread → หน่วงชั่วขณะบนมือถือตอนแนบรูป (แต่ตั้งค่า compress สมเหตุผลแล้ว)
**ทางแก้ (ถ้าจะทำ):** ย้าย decode/resize ไป `createImageBitmap`/Web Worker (ลด main-thread block) — เป็น optimization เสริม

---

## ตารางสรุปหลักฐาน (grep จริง)

| ตัวชี้วัด | ค่า | ผลต่อมือถือ |
|---|---:|---|
| app.js raw / gzip | 545,645 / 131,483 | 🔴 parse บน CPU มือถือ |
| innerHTML= | 136 | 🔴 render ก้อนใหญ่ |
| box-shadow | 130 | 🔴 repaint ตอน scroll |
| gradient | 62 | 🟠 paint |
| backdrop-filter | 4 | 🔴 blur แพงบน GPU มือถือ |
| position:fixed/sticky | 18 | 🟠 repaint ตาม scroll |
| animation / @keyframes | 14 / 6 | 🟠 battery ถ้าวิ่งต่อเนื่อง |
| window.innerWidth (อ่าน) | 71 | 🟠 layout thrashing |
| getElementById | 193 | 🟠 DOM lookup ซ้ำ |
| setInterval / clearInterval | 5 / 7 | 🟠 battery (มี clear guard) |
| content-visibility / contain / will-change | 3 / 1 / 1 | 🟢 ใช้น้อย = โอกาสปรับ |
| createIcons ทั้งหน้า / refreshIconsIn scoped | 1 / 24 | 🟢 icon ส่วนใหญ่ scoped แล้ว (ดี) |
| diffJobsTbody (row reuse) | มี | 🟢 jobs list บรรเทาแล้ว |

---

## แผนปรับ (จัดลำดับ · ทั้งหมดยัง PENDING — ไม่แตะในงานวิเคราะห์นี้)
1. **Lazy dynamic import ต่อเมนู** → ลด JS parse ตอน login (ผลกระทบสูงสุด · ติด onclick global → ต้อง browser regression) — PERF-02
2. **ลด paint:** จำกัด backdrop-filter · box-shadow ในลิสต์ยาว · เพิ่ม `content-visibility:auto`/`contain` ให้แถว/การ์ด (มือถือ) — PERF-03
3. **cache innerWidth/isMobile + DOM reference** ลด layout thrashing (71 จุด) — PERF-03
4. **หยุด animation/interval ตอน tab hidden / นอก viewport** — PERF-03
5. **DocumentFragment / render เฉพาะแถวที่เปลี่ยน** ใน renderDocView (doc view หนักสุด) — PERF-03
6. Font subset · image decode ไป Worker — optional

> ⚠️ ทั้งหมดต้องทำ **ทีละจุด + browser/Lighthouse ยืนยัน** (มือถือจริง) · ไม่ให้คะแนนเต็มจนกว่าจะวัดจริง · ห้ามเดาลบ CSS/แก้ layout
