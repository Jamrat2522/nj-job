# MASSENGER V3 — DEPENDENCY MAP (Phase 1)

> วิเคราะห์จากไฟล์จริงหลังแก้ · classic scripts (ไม่ใช่ ES module) · อ้าง global scope ร่วมกัน

## 1. index.html โหลดอะไร (ลำดับจริง หลัง Phase 2)
```
<head>
  preconnect: supabase.co, fonts.googleapis, fonts.gstatic
  preload as=script: supabase-js@2, lucide@0.460.0
  <link rel="stylesheet" href="css/app.css?v=3.1.0">
<body> ... markup ...
  <script defer src="…supabase-js@2" onerror=…>
  <script defer src="…lucide@0.460.0" onerror=…>
  <script defer src="config/runtime-config.js?v=3.1.0">
  <script defer src="js/utils/format.js?v=3.1.0">
  <script defer src="js/core/runtime.js?v=3.1.0">
  <script defer src="js/app.js?v=3.1.0">
```

## 2. ลำดับ Dependency (บังคับ)
`supabase-js` → `lucide` → `runtime-config.js` (สร้าง `window.RUNTIME_CONFIG`, `window.FEATURES`) → `js/utils/format.js` (pure formatters: esc/fmtDate/fmtDateTime/_fmtBytes/_fmtDtShort) → `js/core/runtime.js` (reader + feature gate; นิยาม `getRuntimeBoolean/Number/Feature`, `_featureForView/_viewFeatureEnabled/_safeLandingView/_renderFeatureUnavailable`) → `js/app.js` (ทุกอย่างที่เหลือ)
- ทั้งหมด `defer` → รันตามลำดับหลัง parse · `window.supabase` พร้อมก่อน app.js เสมอ
- app.js top-level เรียก `getRuntimeBoolean/Number` (จาก runtime.js) → ต้องโหลด runtime.js ก่อน ✅
- runtime.js เรียก `_defaultLandingView/_isShippingOnly/canSeeAdminDashboard/esc/refreshIconsIn/hideAppLoader` (ใน app.js) เฉพาะ **ตอน runtime** (นำทาง/kill) → app.js โหลดแล้ว ✅ ไม่มี load-time forward-ref

## 3. Global / onclick
- **inline `onclick` = 233 จุด** → เรียก global function declaration (classic scope) · **ต้องคง classic script · ห้ามแปลง ES module** (จะทำให้ 233 ปุ่มหาย)
- `window.X=` (ตั้งใจ export) = 5: `_dashboardGraphCache`, `dashboardCharts`, `_deskRowMenuFiring`, `testGps`, (อ่าน `window.visualViewport`)
- State กลางจุดเดียว: `const S={…}` (jobs/core), `const DOC={…}` (documents) — ไม่มี copy ข้ามไฟล์

## 4. Supabase / Auth / Realtime / Boot
- **createClient:** 1 จุด — `_initSupabaseClient()` → `window.supabase.createClient(SUPA_URL, ANON_KEY)` (URL project `sytgqjglcnsabcszbngg`, anon key — ไม่มี service_role)
- **Auth เริ่ม:** `boot()` → `checkFirstSetup()` → login flow (RPC `login_plain`) · session restore จาก localStorage `massenger_clean_user`, auth storageKey `mass-dispatch-auth-clean`
- **Boot:** `readyState==="loading"? DOMContentLoaded→_bootWhenReady : _bootWhenReady()` → `_rcValidate()` → KILL check → `init()` → `_initSupabaseClient()` → `boot()`
- **Realtime (3 channel):** `"jobs-rt-"+APP_CODE` (jobs, job_logs) · `"users-rt-"+APP_CODE` (users) · `"documents-rt-"+APP_CODE` (documents) — filter `app_code` · teardown ตอน hidden

## 5. Timer / Event
- `setInterval` ×5 (doc overdue 60s · doc completed 60s · heartbeat 60s · boot poll · watchdog) · `setTimeout` ×64 (ส่วนใหญ่ debounce)
- ⚠️ ตรวจซ้ำ: ยังไม่ยืนยันได้จาก static ว่า interval/subscription ถูกกันซ้ำครบทุกเส้นทาง → ต้อง browser DevTools (ดู REGRESSION §16/17)

## 6. Initial Query ตอนเปิด (หลัง login)
- `loadJobs()` (jobs) · `loadUsers()` (users) · doc counts ตาม view · realtime subscribe ตาม role
- ⚠️ ยังโหลดข้อมูลหน้าแรกตาม role เดิม (ไม่เปลี่ยนใน Phase นี้)

## 7. Module ที่จำเป็นตอน Login vs Lazy ได้ (วิเคราะห์)
- **ต้องมีตั้งแต่ต้น:** runtime-config, core/runtime.js, supabase client, auth, permission, router (`setView/renderView`), shared state (S/DOC), shared UI (modal/toast), login
- **Lazy ได้ (ในทางทฤษฎี):** dashboard/graphs, users, export, บาง doc view — **แต่** โค้ดปัจจุบันเป็น minified single-file + onclick global → การ lazy (dynamic import ES module) = เสี่ยงสูง ยังไม่ทำ (ดู PENDING_FIX)

## 8. CSS class ที่สร้างจาก JS (ห้ามลบ CSS พวกนี้)
- ตาราง/การ์ด/badge/modal/toast/menu-item ถูก build ผ่าน template string ใน `innerHTML` จำนวนมาก → **ห้ามลบ selector จาก app.css โดยไม่ยืนยันว่าไม่มีใน template string** (ดู PERFORMANCE_AUDIT §CSS — ยังไม่ลบ)
