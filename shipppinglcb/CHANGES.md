# MASSENGER V3 — CHANGES (Safe Fix Pass · 2026-07-13)

> ทำแบบ incremental · แก้เฉพาะจุดที่ verify ได้ · เสี่ยงสูงคงไว้ + บันทึก PENDING_FIX
> **ไม่รัน browser/Lighthouse** (sandbox ไม่มี) → ตัวเลข perf เป็น static เท่านั้น · ไม่กล่าวอ้าง regression PASS

## ไฟล์ที่แก้
| ไฟล์ | การเปลี่ยน |
|---|---|
| `index.html` | cache-version `?v=3.1.0` (css/config/runtime/app) · เปลี่ยน config+app เป็น `defer` · เพิ่ม `js/core/runtime.js` · เพิ่ม `onerror` diagnostic ให้ CDN 2 ตัว |
| `js/app.js` | **ย้ายออก** บล็อก Runtime Config reader + Feature Gate ไป `js/core/runtime.js` (pure relocation · ไม่แก้ logic) |

## ไฟล์ที่เพิ่ม
| ไฟล์ | เนื้อหา |
|---|---|
| `js/core/runtime.js` | Runtime Config reader (`getRuntimeBoolean/Number/Feature`, `_rcRaw/_rcValidate/_rcShowKill`) + Feature Access Gate (`_featureForView/_viewFeatureEnabled/_safeLandingView/_renderFeatureUnavailable`) |

## Function ที่ย้าย (ต้นทาง → ปลายทาง)
ทั้งหมดจาก `js/app.js` → `js/core/runtime.js` (ยังเป็น global · classic script โหลดก่อน app.js):
`getRuntimeBoolean, getRuntimeNumber, getRuntimeFeature, _rcRaw, _rcFeatRaw, _rcIsUat, _rcWarn, _rcValidate, _rcShowKill, _featureForView, _viewFeatureEnabled, _safeLandingView, _renderFeatureUnavailable` (+ `var _RC_DEFAULTS, _FEAT_DEFAULTS`)
- call site ทั้งหมดใน app.js ยังอยู่ครบ (เรียกผ่าน global scope)
- แต่ละ definition มี **1 ชุดพอดี** (app.js=0 def / runtime.js=1 def) — ตรวจแล้ว

## Phase 2 — Safe Loading (ทำสำเร็จ)
1. **Cache-version** `?v=3.1.0` → กัน browser ใช้ไฟล์เก่าข้าม deploy (แนะนำ Cache-Control: index=no-cache, ไฟล์มี v = immutable — ตั้งที่ hosting)
2. **defer** ทั้ง config+app → non-blocking parse · ลำดับ supabase→lucide→config→runtime→app ยังคง · `window.supabase` พร้อมก่อน app.js → polling กลายเป็น fallback (โครง boot เดิมรองรับ `readyState!=="loading"→_bootWhenReady()`)
3. **onerror** CDN → ตั้ง `window.__cdnError[]` + console.error (diagnostic เพิ่ม · flow เดิม 5s-timeout→screen-auth ยังอยู่)

## Phase 3 — Safe Modularization (ทำเฉพาะก้อนที่ปลอดภัย 100%)
- แยก `core/runtime.js` (pure relocation · comment-delimited · function declaration ล้วน · ไม่มี side-effect ตอนโหลด) — node --check ผ่านทั้ง 2 ไฟล์
- **ไม่ทำต่อ** (คงไว้ใน app.js + PENDING): util/component/per-menu module + lazy import — เหตุผลใน PENDING_FIX

## สิ่งที่ยืนยัน (static)
- `node --check` ✅ config, core/runtime.js, app.js
- Path check ✅ ทุกไฟล์ที่ index.html อ้างมีจริง
- Supabase URL/anon/table/RPC/bucket/channel/primary key/permission/role/flow — **ไม่แตะ**
- UI/CSS/layout/text/responsive — **ไม่แตะ**

## สิ่งที่ยัง **ไม่ได้ทดสอบ** (ตรงไปตรงมา)
- Browser/Lighthouse/Supabase runtime — sandbox รันไม่ได้ → **ยังไม่ยืนยัน regression PASS** · ต้องรัน manual ตาม REGRESSION_CHECKLIST (โดยเฉพาะ: defer boot จริง · 233 onclick · realtime channel count · timer)

## Hash (SHA-256)
| ไฟล์ | ก่อน | หลัง |
|---|---|---|
| index.html | `d447590d…` | `a970b820beca026ef4aaf7f94383c4fe1c8d923a73b5b22c930c3b376d0a3489` |
| js/app.js | `46cf5d7c…` | `43709f68b6b2252c1c731164ce191c50f04c26ee2da78e793f1f3c66fef08528` |
| js/core/runtime.js | (ใหม่) | `82b534f7f0e60763db3131a45ea981bd4acb12d44f7c68bab9112265344cf41d` |
| css/app.css | `589c2a6c…` | `589c2a6cf495ec1f852eddc732f5234b89fb64c3f4ed63a7aa26ce8e6f8f69d1` (ไม่เปลี่ยน) |
| config/runtime-config.js | `59e1a1df…` | `59e1a1df6e0e9ca88066abd1ed0ff83f9e9a2a5f988fb2e1a20bcd372ff6b2c3` (ไม่เปลี่ยน) |

---

## รอบต่อ (2026-07-13 · Safe util split เพิ่ม)
**เพิ่ม `js/utils/format.js`** — ย้าย pure formatter จาก app.js (ไม่เปลี่ยนชื่อ · global เดิม):
`esc, fmtDate, fmtDateTime, _fmtBytes, _fmtDtShort` — ตรวจแล้ว pure (external calls = built-in ล้วน) · unique · ไม่มี side-effect ตอนโหลด
- app.js def=0 / format.js def=1 ทุกตัว · call site คงครบ (esc 279, fmtDateTime 17, fmtDate 5, _fmtBytes 1)
- index.html ลำดับใหม่: config → **utils/format.js** → core/runtime.js → app.js (defer ทั้งหมด)
- node --check ผ่านทั้ง 4 ไฟล์ JS

### Realtime/Timer (static verify · ต้อง browser ยืนยัน no-dup runtime)
- `removeChannel` 6 · `_teardownRealtime` 2 · filter `app_code` · handler ใช้ `id/job_id/document_id` (PK จริง 11 จุด · ไม่ใช้ index/DOM/JOB NO ตัดสั้น) · `clearInterval` 7 vs `setInterval` 5 (มี clear guard)
- ⚠️ **ยังไม่ยืนยัน:** subscription/timer ไม่ซ้ำ "ตอน runtime เปลี่ยนเมนูหลายครั้ง" → ต้อง DevTools (REGRESSION §16/17)

### Hash (SHA-256) รอบนี้
| ไฟล์ | หลัง |
|---|---|
| index.html | `065e386221fbfb92fac9b924aab4101d06d2adfb1de476c42050792e3355faa4` |
| js/app.js | `27c61a749edac6ed40e38e7a816601ce86e0a5bc4a36bdf8d8d78c331e1927ab` |
| js/utils/format.js | `05e607ed2901310da18f73265a9dcc912552bd7a5e4568a7773aaf2c3dc3361a` |
| js/core/runtime.js | `82b534f7f0e60763db3131a45ea981bd4acb12d44f7c68bab9112265344cf41d` (ไม่เปลี่ยน) |
| css/app.css · config | ไม่เปลี่ยน |

---
## Fix ล่าสุด (การใช้งานจริง)
1. **config/runtime-config.js:** `READ_ONLY: true → false` (เปิดเขียนข้อมูล live)
2. **js/app.js:** `MASSENGER_READ_ONLY = getRuntimeBoolean(...) → false` — guard ไม่ติดตั้ง → รับ/ปิดงานได้ทั้ง SHIPPING/MESSENGER (แม้ config ไม่โหลด) · แก้อาการ "กดแล้วไม่อัปเดต"
3. **css/app.css:** หน้า "ปล่อยเสร็จวันนี้" (tbl-doc-completed) — คอลัมน์ บริษัท(3)/วัน-เวลา(5)/ท่านำเข้า(7)/USER(8)/ชิปปิ้ง(9)/สถานะเอกสาร(11) แสดงบรรทัดเดียว + ellipsis (scope เฉพาะ view นี้)
- ยืนยัน: guard write มีตัวเดียว · ฟังก์ชันรับ/ปิดงานถูกต้อง (PK จริง, error handling ครบ) · node --check ผ่านทุกไฟล์
- ยังไม่รัน browser จริง → ต้อง hard refresh + ทดสอบบนเครื่องจริง
