# PERFORMANCE REPORT — MASSENGER_V3_PERFORMANCE_SAFE
> โคลนจาก MASSENGER_V3_LAZY_FINAL_CANDIDATE (rev.3) · ต้นฉบับเก็บ rollback ไม่แตะ
> เป้าหมาย: ลดเวลาเปิด + ลดหน่วง มือถือ/คอม · ไม่แตะ UI/สิทธิ์/Flow/Supabase/Realtime/Export

## สรุปตรงไปตรงมา
งาน perf ส่วนใหญ่ (#5–#9) **ทำครบในโคลนเดิมอยู่แล้ว** · รอบนี้เพิ่มของใหม่จริง = **#10 (ลด GPU cost มือถือ)** และ **ไม่แยก documents/jobs** (เหตุผลด้านล่าง)

## สิ่งที่ตรวจแล้วว่ามีอยู่ (ไม่ต้องทำซ้ำ)
| ข้อ | สถานะ |
|---|---|
| #4 แยก export / graphs(dash) / users / ot | ✅ แยกแล้ว (chunk เดิม) |
| #5 โหลด chunk เมื่อเปิดเมนู | ✅ _loadChunk + _lazyRender |
| #6 คงชื่อ window function เดิม | ✅ wrapper คงชื่อ |
| #7 ใช้ #view-root container เดียว (ไม่เขียน main) | ✅ แก้แล้ว (rev.2) |
| #8 render เฉพาะแถวหน้าปัจจุบัน | ✅ pageJobs slice + diffJobsTbody/diffDocTbody |
| #9 realtime patch เฉพาะ record | ✅ S.jobs[idx] patch + _docRealtimeRefresh (ไม่ render ทั้งหน้า) |
| perf เดิม | ✅ content-visibility, cache innerWidth, tabhidden pause, defer×9 |

## สิ่งที่ทำใหม่รอบนี้ — #10 ลด GPU cost เฉพาะมือถือ (@media max-width:768px)
เพิ่มบล็อกท้าย css/app.css (scoped มือถือ · ไม่แตะ desktop/สีปุ่ม/โครง):
- **backdrop-filter:none** บน overlay (.modal-back/.modal-backdrop/.sidebar-overlay/#sb-overlay) — blur เป็น GPU ที่หนักสุด · overlay มืดคงเดิม (แทบมองไม่เห็นต่าง)
- **body background: solid** — ตัด radial-gradient glow เต็มจอ (ลด repaint พื้นที่ใหญ่ · glow จางมาก .07)
- **box-shadow:none** บน pill/chip/badge (element เล็กที่ repaint ตอน scroll)
- **box-shadow เบาลง** บน .info-card/.msg-card/.panel (คงมิติ ไม่ตัดทิ้ง)
- **skeleton shimmer animation:none** — ลด repaint ตอนโหลด

## ❌ ไม่แยก documents / jobs (แม้อยู่ในข้อ #4) — เหตุผลจากโค้ดจริง
- **documents = หน้าแรกของ SHIPPING** (`_defaultLandingView`→doc-new) · **jobs = หน้าแรกของ STAFF/USER/ADMIN**
- แยกเป็น lazy chunk = ต้องโหลด chunk **ทันทีหลัง login** ก่อน render หน้าแรก → **ย้ายเวลารอไปหลัง login** (บนเน็ตมือถือช้า = หน่วงกว่าเดิม) ไม่ได้ลดเวลาเปิดจริง
- `renderDocView` ถูก core อ้าง 14 จุด + doc มี popup timer/realtime หลัง login (ทุก role) → coupling สูง เสี่ยง regression
- **ตรงกับที่พี่รับ option ก ก่อนหน้า** (คง Document ใน app.js)
- ประโยชน์ที่แท้จริงของ code-split มาจากการเลื่อนโมดูล **ที่ไม่ใช้ตอนเปิด** (export/graphs/users/ot) — ซึ่งแยกครบแล้ว

## ขนาดก่อน/หลัง
- **js/app.js: ไม่เปลี่ยน** (489,670 bytes — เหมือน rev.3 เป๊ะ · ไม่แตะ JS)
- **css/app.css: 131341 → 131934 bytes** (+#10 mobile block)
- Initial JS คงเดิม (config+format+runtime+app ≈ 121KB gzip) · chunks lazy เดิม

## ไฟล์ที่แก้รอบนี้
- `css/app.css` (เพิ่มบล็อก #10 มือถือ) — **ไฟล์เดียว**
- JS/HTML/chunks/Supabase/realtime: **ไม่แตะ**

## Function ที่ย้าย (รอบนี้)
- **ไม่มี** — ไม่ย้าย function ใหม่ (chunk export/dash/ot/users แยกไว้ตั้งแต่รอบก่อน)
