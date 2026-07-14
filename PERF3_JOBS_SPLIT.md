# PERF3 — แยกโมดูล JOB (heavy-jobs.js) · lazy-load

> โคลนจาก MASSENGER_V3_PERF2 (ห้ามแตะ PERF2) · แก้ js/ เท่านั้น · ยังไม่ผ่าน Browser Test

## ย้ายไป js/heavy-jobs.js (lazy chunk)
- `renderJobsView(title,statusFilter)` — 15,948 chars (มี stub self-replacing ใน app.js)
- `diffJobsTbody(tbody,pageJobs)` — 550 chars (เรียกโดย renderJobsView เท่านั้น)
- `getWorkViewBase()` — 347 chars (เรียกโดย renderJobsView เท่านั้น)

## กลไก (ตาม pattern เดิมของ heavy-users/heavy-dash)
- app.js มี stub: `function renderJobsView(){return _lazyRender("jobs","renderJobsView",arguments);}`
- เปิด view jobs ครั้งแรก → `_lazyRender("jobs",...)` inject `js/heavy-jobs.js?v=3.1.0` (promise cache `_chunkP`, dedup, fallback)
- heavy-jobs.js ประกาศ `function renderJobsView(){...จริง...}` ที่ global scope → **ทับ stub** → ครั้งถัดไปเรียกตัวจริงตรงๆ (ไม่มี spinner ซ้ำ)
- `renderView()` dispatch ไม่ต้องแก้ (เรียกผ่านชื่อ renderJobsView เหมือนเดิม)

## ห้ามย้าย (คงใน app.js) — เหตุผลจาก dependency จริง
- `jobRowFull` — realtime รอบ 1 เรียก (`_rtPatchOneJobRow`, `_afterAcceptJobRowLevel`) → ย้ายจะผูก realtime กับ chunk
- `filteredJobs` — **heavy-export.js เรียก** → ย้ายจะพัง export
- `_trFromHtml` — `diffDocTbody` (DOC) เรียก → shared
- `countStatuses / _visibleJobs / updateSidebarCounts / getWorkViewBase*` — KPI/sidebar (always-loaded)
  *getWorkViewBase ย้ายได้เพราะ renderJobsView เรียกที่เดียว; KPI sidebar ใช้ _visibleJobs ไม่ใช่ getWorkViewBase

## Realtime รอบ 1 — ไม่แตะ
- `_scheduleJobsReload`, `_rtRowRefresh`, `_rtPatchOneJobRow` เหมือนเดิมทุกตัว
- ปลอดภัยเพราะเรียก renderJobsView/jobRowFull เฉพาะตอน `_rtOnJobsListView()` จริง = อยู่หน้า jobs = chunk โหลดแล้ว

## Rollback
1. หาก Browser Test ไม่ผ่านแม้ข้อเดียว → ห้าม patch production, ห้ามแตะ PERF2
2. กลับไปใช้ MASSENGER_V3_PERF2_ORIGINAL.zip ทันที (คือ PERF2 เดิม 100%)
3. ลบ js/heavy-jobs.js + คืน js/app.js จาก PERF2 = จบ (ไม่มี dependency อื่นค้าง)
