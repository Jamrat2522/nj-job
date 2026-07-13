# MASSENGER V3 — PERFORMANCE AUDIT

> **วัดได้เฉพาะ static (sandbox ไม่มี browser/Lighthouse/เครือข่าย)** · ตัวเลข runtime (LCP/TTI/parse จริง) ต้องวัดบนเครื่อง/CI ของทีม · **ไม่ให้คะแนน 10/10 · ไม่กล่าวอ้างว่าเร็วขึ้นโดยไม่มีผลวัดจริง**

## 1. ขนาดไฟล์ (static · raw / gzip)
| ไฟล์ | ก่อน raw | ก่อน gzip | หลัง raw | หลัง gzip |
|---|---:|---:|---:|---:|
| js/app.js | 551,481 | ~133,580 | 546,443 | 131,724 |
| js/core/runtime.js | — | — | 5,412 | 2,236 |
| css/app.css | 126,754 | 23,094 | 126,754 | 23,094 |
| index.html | 43,258 | 9,861 | 43,617 | 9,963 |
| config/runtime-config.js | 1,839 | 972 | 1,839 | 972 |

**JS ที่ต้อง parse ตอนเปิด (login):** runtime.js + app.js = **~546K+5K raw / ~134K gzip** — *เท่าเดิมโดยรวม* (แยกไฟล์ classic ไม่ได้ลดการ parse รวม)

## 2. สิ่งที่น่าจะเร็วขึ้นจริง (เชิงกลไก · ต้องยืนยันด้วย Lighthouse)
- **`defer` ทั้ง config+app** → ไม่บล็อกการ parse HTML/render อีกต่อไป (เดิม app.js classic บล็อกที่ท้าย body) → คาดว่า **FCP/แสดงหน้าแรกเร็วขึ้น** และไม่ต้อง poll supabase
- **Cache-version** → ข้าม deploy ไม่โหลดไฟล์เก่าผิดเวอร์ชัน (ถูกต้อง > เร็ว)
- **onerror CDN** → diagnostic เร็วขึ้นเมื่อ CDN ล่ม

## 3. สิ่งที่ **ยังไม่ได้ทำ** (จึงยังไม่ลด parse ตอนเปิด) → PENDING
การลด JS-parse ตอน login จริง ต้องใช้ **lazy dynamic import (ES module)** ต่อเมนู — แต่:
- โค้ดเป็น **minified single-file** + **onclick global 233 จุด** → แปลง ES module = ปุ่มหายถ้าไม่ export ครบ = เสี่ยงสูง
- **แยกเป็น classic script ไม่ลด parse รวม** (โหลดครบตอนเปิดอยู่ดี)
- ต้อง **browser regression** คั่นทุกก้อน (ยังไม่มี env)
→ บันทึกใน `PENDING_FIX.md` (PERF-01..03) ทำเป็น Phase แยก เมื่อมี env ทดสอบ

## 4. จุดที่ตรวจแล้วแต่ยังไม่แตะ (ต้อง browser ยืนยันก่อน)
- **Realtime subscribe ซ้ำ / teardown:** โค้ดมี teardown ตอน hidden + filter app_code แล้ว แต่ยืนยันจำนวน channel จริงต้องดู DevTools (REGRESSION §16)
- **Timer ซ้ำ:** 5 interval — ต้องยืนยันว่าไม่เพิ่มต่อการเปลี่ยนเมนู (REGRESSION §17)
- **innerHTML/DOM:** ตารางใหญ่ใช้ diff/row-level อยู่แล้ว — ปรับเพิ่ม (DocumentFragment/content-visibility) = เสี่ยงกระทบ layout → ยังไม่แตะ (PENDING)
- **CSS ซ้ำ/ไม่ใช้:** ห้ามลบจนยืนยันว่าไม่ได้ถูกสร้างจาก template string → ยังไม่ลบ

## 5. สรุปคะแนน (ตามกฎ: ไม่ให้ 10/10)
- ทำสำเร็จ (verifiable): defer, cache-version, onerror, แยก core/runtime.js (node --check ผ่าน)
- **ยังไม่ยืนยัน:** ผล runtime จริง (ต้อง Lighthouse) · lazy-load (PENDING) · duplicate timer/subscription (ต้อง browser)
- **ยังไม่ควรให้คะแนนเต็ม** — ต้องรัน browser regression + Lighthouse ก่อนสรุป

---
## อัปเดต (util split รอบ 2)
- แยก `js/utils/format.js` (pure formatters) — app.js raw 546,443→545,645 · format.js raw 1,186/gzip 686
- **ยังเป็น classic scripts ทั้งหมด → parse รวมตอนเปิดยังใกล้เดิม** (การลด parse จริงต้อง lazy import = PENDING PERF-02)
- Realtime/timer static ผ่าน (teardown/clear/PK) · no-dup runtime = ต้อง browser
