# MASSENGER V3 — ARCHITECTURE

> เอกสารอ้างอิงสถาปัตยกรรม (Source of Truth) — ใช้ตลอดทุก Phase
> ที่มา: วิเคราะห์จากไฟล์ Production Clone จริง `massenger-clean_min__62__edit-header.html`
> (`APP_VERSION = "MASSERGER v8.14"` · 715 KB · 671 บรรทัด minified · 522 ฟังก์ชัน)
> อัปเดตล่าสุด: Phase 1

---

## 0. หลักการสูงสุด

MASSENGER V3 = **บ้านหลังใหม่ · ทุกห้องเหมือนเดิม 100%**
เปลี่ยนได้เฉพาะ **การจัดระเบียบภายในโค้ด** ให้สะอาด/เร็ว/ดูแลง่าย
UI / UX / เมนู / ปุ่ม / Modal / Responsive / Workflow / Permission **ต้องเหมือน Production 100% ทั้ง Desktop และ Mobile**
(ดูกฎถาวรใน `MASSENGER_V3_RULES.md`)

---

## 1. ภาพรวมระบบเดิม (ที่ต้องคงพฤติกรรม)

| ส่วน | ข้อเท็จจริงจากไฟล์จริง |
|---|---|
| รูปแบบ | Single-file HTML PWA (CSS + HTML + JS รวมไฟล์เดียว) |
| ขนาด | CSS ~127 KB · HTML markup ~36 KB · JS inline ~545 KB (1 `<script>`) |
| Version | `MASSERGER v8.14` |
| app_code | `"massenger"` |
| Supabase project | `sytgqjglcnsabcszbngg` |
| Build system | ไม่มี (V3 จะเพิ่ม dev structure แบบ multi-file) |
| Service Worker | ปิดใน Clone (`if(false&&...)` + auto-unregister ของเก่า) |
| READ_ONLY guard | มีที่ชั้น Supabase client (ตอนนี้ `READ_ONLY=false`) |

**Library ภายนอก**
- Eager: `supabase-js@2`, `lucide@0.460.0`
- Lazy (โหลดเมื่อใช้): `chart.js@4.4.1`, `html2canvas@1.4.1`, `xlsx-js-style@1.2.0`, `jszip@3.10.1`, `jsPDF`

**Session / Storage key (แยกจาก Production แล้ว — ต้องคงไว้)**
- localStorage user key: `massenger_clean_user`
- Supabase auth storageKey: `mass-dispatch-auth-clean`

---

## 2. State Management

ปัจจุบันมี **2 object กลาง** (เป็น array — V3 จะ normalize เป็น Map ใน store ภายใน แต่พฤติกรรมภายนอกเหมือนเดิม)

### 2.1 `S` — Core / Jobs
```
S = {
  user, authUser,
  view: "jobs",
  jobs: [], users: [], messengers: [],
  filters: { search, status, category, messenger, company,
             dateFrom, dateTo, terminal, user, dateGroup, fzOnly, doneTodayOnly },
  dashFilters: { from, to },
  sortKey: "job_number", sortDir: "desc",
  page: 1, pageSize: PAGE_SIZE,
  currentJob, currentUser,
  sigCtx, sigDrawing, sigDirty, sigStrokes, sigPathLen,
  loadedStatuses: Set, statusCountsRemote, searchExtra,
  messengerKpiFilterByView, editingJob
}
```

### 2.2 `DOC` — Documents / Shipping
```
DOC = {
  documents: [], routes: [],
  view: "all",
  filters: { search, status, terminal, docCat, leadtimeOver },
  page: 1, pageSize: 50, currentDoc, loaded,
  _sessionStart, _alerted:Set, _overdueAlerted:Map,
  _overdueTimer, _completedAlerted, _completedTimer,
  _sysStatus, _workStatus, searchExtra
}
```

### 2.3 กติกา State (V3)
- ห้ามเก็บข้อมูลซ้ำหลายตัวแปร — jobs/documents/users/logs อยู่ที่ store เดียว
- cache-busting ผูกกับ `_jobsVersion` (เพิ่มด้วย `_bumpJobsVersion()`) — **ต้องย้ายเป็นชุดเดียวกับ store**
- Cache ปัจจุบัน: `_filterCache`, `_visibleJobsCache`, `_statusCountCache`, `_detailCache` (TTL 30s), `_docVisCache`, `_docCountsCache`

**เป้า V3 (store ภายใน):**
```
Store = {
  currentUser, currentView,
  jobsById: Map, documentsById: Map,
  logsById: Map, usersById: Map
}
```

---

## 3. Repository Layer

รวม `sb.from(...)` ทั้งหมดไว้ที่ชั้น Repository (ห้ามเรียก Supabase กระจายทั่วระบบใน V3)

| Repository | ตารางหลัก | หน้าที่ |
|---|---|---|
| `JobRepository` | `jobs`, `job_logs` | list/detail/create/update/close/cancel/delete/count/backfill |
| `DocumentRepository` | `documents`, `document_logs`, `doc_card_statuses` | list/detail/status-flow/routes-link |
| `UserRepository` | `users`, `password_audit_logs` | login/register/CRUD/sync/terminals |
| `TimelineRepository` | `job_logs`, `document_logs` | log write + timeline read |
| `AttachmentRepository` | `attachments`, `signatures` + storage | upload/list/delete |
| `RouteRepository` | `shipping_location_routes` | terminal → shipping routing |

**Query แยกชั้น (คงไว้):** List · Detail (`_fetchDetailPack`) · Timeline · Graph · Export
**Cap เดิม:** `JOBS_CAP=100` · `ACTIVE_CAP=2000` · `TIMEOUT_QUERY/BOOT=8000ms`
**Column scoping เดิม:** `COLS_BASE`, `COLS_GPS`, `USER_COLS`, `DOC_COLS`, `getJobCols()` (มี GPS fallback)
**RPC 6 ตัว:** `generate_job_number`, `login_plain`, `self_register_user`, `admin_create_user`, `sync_seed_user`, `has_super_admin`

---

## 4. Database Mapping (11 ตาราง · isolate ด้วย app_code ทุกตาราง)

| ตาราง | ใช้งาน | บทบาท |
|---|---|---|
| `jobs` | 44 | งานหลัก (WAIT/GOING/DONE/CANCELED) |
| `documents` | 29 | งานเอกสาร/ชิปปิ้ง (doc_status flow) |
| `document_logs` | 23 | timeline เอกสาร |
| `job_logs` | 13 | timeline งาน + document_status_update |
| `users` | 16 | ผู้ใช้ + role + terminals + online |
| `attachments` | 14 | ไฟล์แนบงาน (bucket `job-attachments`) |
| `signatures` | 9 | ลายเซ็นปิดงาน (bucket `job-signatures`) |
| `shipping_location_routes` | 3 | ท่านำเข้า → shipping user |
| `doc_card_statuses` | 3 | สถานะการ์ดเอกสาร |
| `password_audit_logs` | 1 | log การดูรหัสผ่าน (SUPER_ADMIN) |
| `backups` | 1 | log การ export backup |

**Storage buckets:** `job-attachments`, `job-signatures`
**doc_status flow:** `NEW → RECEIVED → (POSTPONED ↔ RECEIVED) → CLEARED → COMPLETED` (+ OFFICE/BOXED/TRUCK/CLOSED/DOCUMENT_STATUS)
**delivery_status:** `MESSENGER_PENDING`, `READY_FOR_SHIPPING`

---

## 5. Realtime (3 channel — ตรงเป้า V3 อยู่แล้ว · ห้ามแตะ logic)

| Channel | ตารางที่ subscribe | handler |
|---|---|---|
| `jobs-rt-{APP_CODE}` | `jobs`, `job_logs` | `_scheduleJobsReload`, `_scheduleDetailReload` |
| `users-rt-{APP_CODE}` | `users` | `_scheduleUsersReload` |
| `documents-rt-{APP_CODE}` | `documents` | `_onDocRealtime` |

**กติกา Realtime (V3 บังคับ):**
- filter ทุก channel: `app_code=eq.{APP_CODE}`
- อ้างอิงเฉพาะ **id / job_id / document_id** — ห้ามใช้ array index, company, import_terminal, currentDoc, JOB NO ตัดสั้น, ตำแหน่ง DOM
- ห้าม reload ทั้งหน้า — patch เฉพาะแถวที่เปลี่ยน (INSERT/UPDATE/DELETE → แก้ store แล้ว light render)
- Teardown ตอน `visibilitychange` hidden (`_teardownRealtime`) · re-subscribe ตอนกลับมา
- Debounce render: 200ms (desktop) / 800ms (mobile) ผ่าน `_scheduleLightRender`

---

## 6. Module Map (แผนแยก — deploy แบบ Multi-file เท่านั้น)

522 ฟังก์ชันแยกกลุ่มตาม prefix ที่ชัดอยู่แล้ว (กลุ่ม `_doc*` = 113 fn แยกเป็นก้อนอิสระได้ทันที)

```
/js
  /core          app.js(init/boot/showOnly) · dom.js($/el/esc) · modal.js · toast.js · confirm.js
  /stores        store.js (S, DOC, version, caches)
  /repositories  JobRepo · DocRepo · UserRepo · TimelineRepo · AttachmentRepo · RouteRepo
  /modules
    /auth          login/register/logout · checkFirstSetup · setup
    /jobs          loadJobs · filteredJobs · renderJobsView · jobRowFull · accept/close/cancel/delete · OT
    /documents     (_doc* 113) loadDocuments · renderDocView · docShippingAccept · docSetStatus · cleared/postpone/complete · routes
    /dashboard     renderDashboard · renderGraphsPage · _graphLoad · _drawStaffGraph
    /users         renderUsersView · submitUserAdd/Edit · sync
    /export        exportExcel · _buildPlacesWorkbook · PDF · PNG
    /realtime      setupRealtime · _onDocRealtime · schedule*
    /timeline      renderTimeline · _docLoadTimeline
    /notification  alert/beep/vibrate/SW-notify
  /permission      PERM · can* · _hasPerm
  /utils           date/format/haversine/terminal
/components         autocomplete · signature · priority
/css               base · desktop · mobile · modal · dashboard · table · animation · theme
/assets            icons · fonts
/config            config.js (ดูข้อ 10)
```

**ข้อบังคับ Multi-file (คำสั่งผู้ใช้):**
- Deploy แบบ **Multi-file เท่านั้น** — โครง `/css /js /modules /components /assets`
- **ห้าม Bundle กลับเป็น HTML ไฟล์เดียวใน Source Code**
- inline `onclick=` **233 จุด** เรียก global fn ตรง ๆ → module ต้อง export public fn ขึ้น `window`/namespace ชื่อเดิม **ห้ามแก้ string ใน onclick**

---

## 7. เมนูทั้งหมด (จาก renderSidebar + renderView router)

Router: `S.view` → `renderView()` (differentiated) · landing ตาม role

**WORK** (ซ่อนสำหรับ shipping-only)
- `jobs` งานทั้งหมด (SUPER_ADMIN) · `wait` รอรับงาน · `going` กำลังดำเนินการ · `done-today` เสร็จแล้ววันนี้ · `canceled` ยกเลิก

**DOCUMENT** (แสดงเมื่อ department/role = SHIPPING หรือ admin หรือ own-docs-viewer)
- `doc-all` เอกสารทั้งหมด (SUPER) · `doc-new` รอรับงาน · `doc-received` ดำเนินตรวจปล่อย · `doc-completed-today` ปล่อยเสร็จวันนี้ · `doc-postponed` เลื่อนตรวจปล่อย · `doc-edit` งานแก้ไข

**PENDING**
- `tomorrow` งานพรุ่งนี้ · `future` งานล่วงหน้า · `fz` งานตรวจปล่อย FZ

**SYSTEM**
- `graphs` กราฟงานทั้งหมด (admin) · `users` ผู้ใช้งาน (admin) · `backup` (admin) · logout

**Mobile tabbar:** โหมด shipping-only (6 ปุ่ม smt-*) และโหมดทั่วไป (wait/going/done-today/canceled + เมนู)

---

## 8. Modal ทั้งหมด (~15)

**Static (ใน HTML — 9):**
`modal-create` · `modal-detail` · `modal-close` · `modal-cancel` · `modal-assign` · `modal-confirm` · `modal-print` · `modal-user` · `modal-user-add`

**Document-injected (`_docInjectModals` — 5):**
`modal-doc-detail` · `modal-doc-edit` · `modal-doc-postpone` · `modal-doc-cleared` · `modal-doc-routes`

**สร้าง on-demand:**
`ot-modal` (สร้างงาน OT + ค่าธรรมเนียม) · `register-success-popup`

**กลไก modal:** `openModal/closeModal` + `_modalStack` + `history.pushState`/`popstate` (กดปุ่ม back ปิด modal)

---

## 9. Render Functions + กติกา Rendering

**Render fns:** renderApp · renderSidebar · renderJobsView · jobRowFull · renderDocView · renderDocDetail · renderDashboard · renderGraphsPage · renderUsersView · renderDetail · renderTimeline · renderBackupView · renderJobPDFHtml · renderOTPDFHtml · renderSkeletonView

**กติกา (V3):**
- ห้าม render ตารางทั้งก้อนซ้ำ · ห้าม innerHTML ตารางใหญ่
- Render ครั้งแรกครั้งเดียว → หลังจากนั้นแก้เฉพาะ status/badge/leadtime/timeline/shipping/company
- ของเดิมมี `diffJobsTbody()` (reuse แถวจาก `data-job-ver`) + row-level helper (`_afterAcceptJobRowLevel`, `_afterCloseJobRowLevel`, `_docRemoveRowLeavingView`) — **คงกลไกนี้**

---

## 10. Config (ค่าเริ่มต้น V3 — เก็บใน `/config/config.js` เปลี่ยนภายหลังได้)

| Key | ค่า V3 | หมายเหตุ |
|---|---|---|
| `PAGE_SIZE_DESKTOP` | **100** | ค่าเริ่มต้นใหม่ตามคำสั่ง (เดิม prod = 50) |
| `PAGE_SIZE_MOBILE` | **40** | ค่าเริ่มต้นใหม่ตามคำสั่ง (เดิม prod ops = 20) |
| `MOBILE_BREAKPOINT` | 768 | `innerWidth<=768` |
| `JOBS_CAP` | 100 | คงเดิม |
| `ACTIVE_CAP` | 2000 | คงเดิม |
| `TIMEOUT_QUERY` | 8000 | คงเดิม |
| `TIMEOUT_BOOT` | 8000 | คงเดิม |
| `READ_ONLY` | true (UAT) | เปิดตลอดช่วง UAT |
| `APP_CODE` | "massenger" | ใช้ DB เดิม |
| `SESSION_KEY` | "massenger_clean_user" | แยกจาก prod |
| `AUTH_STORAGE_KEY` | "mass-dispatch-auth-clean" | แยกจาก prod |

> **หมายเหตุ Pagination:** prod เดิมใช้ 50/20. V3 ตั้ง 100/40 เป็นค่าเริ่มต้นตามคำสั่งผู้ใช้ (deviation ที่อนุมัติแล้ว) และเก็บใน Config เพื่อปรับกลับได้ทันทีหากพบผลกระทบ UX ตอน regression

---

## 11. Role / Permission (คงเดิม 100%)

**Role ที่ V3 รองรับอย่างเป็นทางการ (verified Production DB · 5 role):** `SUPER_ADMIN` · `ADMIN` · `SHIPPING` · `MESSENGER` · `STAFF`

**✅ Production DB verified (SELECT role,count FROM app_users · read-only):** SUPER_ADMIN=3 · ADMIN=12 · SHIPPING=35 · MESSENGER=12 · STAFF=115 · **ADMIN_MID = Not Found in Production Database** (ไม่มีทั้งโค้ดและ DB → ไม่รองรับ · ปิด PF-04) · USER / MESSENGER_PENDING = ไม่พบใน prod DB → ถอดจาก active matrix รอบนี้ · **Legacy Code Reference — Not Present in Current Production Data** (โค้ดเดิมยังไม่ลบ · freeze · วิเคราะห์ใน Phase Refactor) · ⚠️ query ไม่ได้ filter `app_code` (โค้ดใช้ตาราง `users`) — แนะนำ re-run `app_code='massenger'`

**PERM map (คงเดิม):**
```
dashboard      : SUPER_ADMIN, ADMIN
manageUsers    : SUPER_ADMIN, ADMIN
deleteJob      : SUPER_ADMIN
closeJob       : SUPER_ADMIN, ADMIN, MESSENGER, USER, STAFF
closeDocument  : SUPER_ADMIN, ADMIN, SHIPPING
createJob      : SUPER_ADMIN, ADMIN, STAFF, MESSENGER
```
**Helper:** `canCreateJob/canCloseJob/canDeleteJob/canEditJob/canCloseDocument/canManageUsers/canViewDashboard/canViewJob`
**Landing logic:** `_isShippingOnly`, `_isOwnDocsViewer`, `_defaultLandingView`, `_ADMIN_ONLY_VIEWS`

---

## 12. Timer / Cleanup / Concurrency

- `setInterval` ×5: doc overdue 60s · doc completed 60s · heartbeat 60s · (SW-update ปิด)
- `setTimeout` ×64 (debounce ส่วนใหญ่)
- Concurrency guard: `withTimeout` · `withInflight`
- **V3 บังคับ cleanup ตอนเปลี่ยนเมนู:** setInterval / setTimeout / event listener / realtime channel / cache ชั่วคราว
- Offline/Cache: IndexedDB (`cacheJobs`/`readCachedJobs`) · offline banner · visibility-resync

---

## 13. Image Pipeline (ตรงเป้า V3 อยู่แล้ว)

`compressImageIfNeeded`: resize max 1280 · JPEG q0.65 · HEIC 2-layer decode · `URL.revokeObjectURL` ทุกครั้ง · loud failure (ไม่ให้ output ผิดเงียบ ๆ)

---

## 14. Runtime Config (ยืนยันแล้ว — `/config/runtime-config.js`)

ควบคุมค่าโดยไม่ต้อง build/deploy ใหม่ (แก้ไฟล์ที่ hosting ได้ทันที)

```js
window.RUNTIME_CONFIG = {
  ENVIRONMENT: "uat",      // uat | production
  READ_ONLY: true,         // UAT default
  KILL_SWITCH: false,
  KILL_REDIRECT_URL: "",
  DESKTOP_PAGE_SIZE: 100,
  MOBILE_PAGE_SIZE: 40,
  LOG_LEVEL: "info"
};
window.FEATURES = { dashboard:true, export:true, users:true, documents:true };
```

**KILL_SWITCH = true → ต้อง:** ปิด write ทั้งหมด · ปิด Realtime V3 · แสดงข้อความแจ้งเตือน · redirect กลับ Production/หน้า Maintenance · **ห้ามกระทบ Production**

**READ_ONLY = true → บล็อก:** insert · update · delete · upsert · upload · RPC ที่เขียนข้อมูล
**READ_ONLY อนุญาต:** select · login · dashboard · search · timeline · export

**FEATURE_FLAG:** เปิด/ปิด module รายส่วน (dashboard/export/users/documents)

**Deployment:** hosting รองรับ Runtime Config → ใช้เป็นหลัก · ถ้าไม่รองรับ → deploy flag ชั่วคราว แต่โครงต้องรองรับ Runtime Config

> ⚠️ สถานะ Phase 2: ประกาศค่าใน scaffold แล้ว **ยังไม่ wire เข้า app.js** (การเชื่อม guard/kill/pagination/feature เข้า logic = Phase 2.5/3) จึงไม่กระทบพฤติกรรมเดิม

---

## 15. Phase 2 Output — File Map (byte-exact extraction)

```
/index.html                 (44K) shell: head+body เดิม · swap <style>→<link> · swap app<script>→src refs
/css/app.css                (124K) CSS เดิมทั้งก้อน byte-exact  md5 6081e654...
/js/app.js                  (536K) JS เดิมทั้งก้อน byte-exact   md5 9af23b69...
/config/runtime-config.js   (4K)  RUNTIME_CONFIG + FEATURES scaffold (ไม่ wire)
/modules /components /assets       reserved — Phase 3 (per-module migration)
```

**พิสูจน์ integrity:** ประกอบ css+js กลับเข้า index → md5 = `026a094e269a23306c0f8717b07cd5bf` = ตรงกับไฟล์ต้นฉบับ 100%
**External libs** (supabase-js@2, lucide) คงอยู่ตำแหน่งเดิมใน index.html · lazy libs (chart/html2canvas/xlsx/jszip/jsPDF) ยังโหลดจาก app.js เหมือนเดิม

---

## 16. Phase 2.5 — Runtime Config wired (แก้ `js/app.js` เท่านั้น)

จุดเชื่อม (ผ่าน reader กลาง `getRuntimeBoolean/Number/Feature`):
- **READ_ONLY** → `const MASSENGER_READ_ONLY=getRuntimeBoolean("READ_ONLY",true)` → guard เดิม `__installReadOnlyGuard`
- **KILL_SWITCH** → ต้นทาง `_bootWhenReady` → `_rcShowKill()` หยุดก่อน `init()`
- **PAGINATION** → `PAGE_SIZE=getRuntimeNumber("DESKTOP_PAGE_SIZE",100)` + mobile-ops `getRuntimeNumber("MOBILE_PAGE_SIZE",40)` (2 จุด)
- **FEATURE** → menu graphs(dashboard)/users/doc-section(documents) + ปุ่ม Export(export)
- **ยังไม่ wire (รายงาน):** `DOC.pageSize=50` (docs desktop), `_ALLJOBS_PAGE=150`, feature `messenger`

app.js md5: `9af23b69…` → `98bce794…` · css/index/config ไม่เปลี่ยน · รายละเอียดใน `MASSENGER_V3_PHASE_2_5_CHANGES.md`


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
