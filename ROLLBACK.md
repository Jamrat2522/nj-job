# ROLLBACK — PERFORMANCE_SAFE
## ระดับ 1 — ยกเลิกเฉพาะ #10 (perf CSS)
ลบบล็อกท้าย css/app.css ที่ขึ้นต้น `/* ... PERF #10 ... */` → กลับเป็น rev.3 (โค้ด JS ไม่เคยแตะ)

## ระดับ 2 — กลับทั้งโคลนเป็น rev.3
ใช้โฟลเดอร์ต้นฉบับ `MASSENGER_V3_LAZY_FINAL_CANDIDATE` แทนทั้งชุด

## ระดับ 3 — กลับเป็น monolithic เดิม (ก่อน code-split)
`js/app.monolithic.js` (SHA256 5c7e15fd · 559,483 bytes) → rename เป็น js/app.js + ลบ heavy-*.js
ไม่แตะ Database → rollback ปลอดภัยทันที
