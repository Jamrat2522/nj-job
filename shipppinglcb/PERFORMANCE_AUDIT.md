# PERFORMANCE AUDIT — MASSENGER / MASSERGER (Mass Dispatch Enterprise)

**วันที่:** 2026-08-03
**ขอบเขต:** ตรวจจากซอร์สโค้ดจริง 12 ไฟล์ · **ยังไม่แก้โค้ดใด ๆ** (MD5 ทุกไฟล์คงเดิม)
**หมายเหตุสำคัญ:** โปรเจกต์นี้ **ไม่ใช่ SHIPPINGLCB V.30** — เป็น MASSENGER V3 / MASSERGER v8.14

---

## 0. ไฟล์ที่ตรวจ + ค่าที่วัดได้จริง (Baseline)

| ไฟล์ | raw | gzip | โหลดตอน boot | MD5 |
|---|---|---|---|---|
| `index.html` | 43,676 | 9,918 | ✅ | `2c2a4f2fccd1a132314a55c28b016547` |
| `css/app.css` | 131,934 | 24,436 | ✅ (render-blocking) | `cf55753c993c88e21104e97ac84d32e8` |
| `config/runtime-config.js` | 1,930 | 981 | ✅ defer | `df3252feb327ec0848ccb48700dbedb0` |
| `js/utils/format.js` | 1,186 | 686 | ✅ defer | `89964afe77b2ec20dc456d7c0fb50757` |
| `js/core/runtime.js` | 5,412 | 2,236 | ✅ defer | `173d1b27bf53b45831d1cbf8a50ac23d` |
| `js/app.js` | 477,739 | **115,514** | ✅ defer | `d2c319d83bad1aaa983fcf17140ea8de` |
| `js/heavy-export.js` | 40,637 | 9,810 | ❌ lazy | `70c72d2a3cdd0f356ed59cc48f776f98` |
| `js/heavy-dash.js` | 29,391 | 8,293 | ❌ lazy | `2f2bc6475547206d4e1f4423ede65975` |
| `js/heavy-jobs.js` | 18,402 | 5,306 | ❌ lazy | `c75b43f4f9bd3eb7206a4d6dacff4ff0` |
| `js/heavy-ot.js` | 11,860 | 4,060 | ❌ lazy | `74ac8a1fcb0ba15639dfda8f5229126a` |
| `js/heavy-users.js` | 5,615 | 2,315 | ❌ lazy | `836c7c9740a937ff8c3c705b0834fe77` |
| `js/app.monolithic.js` | 559,483 | — | ❌ ไม่ถูกเรียกใช้ (rollback) | `c3967be2bbfc96d298525464be36d6e4` |

**Boot payload (ไม่รวม CDN):** raw 660,151 B · **gzip ≈ 153,335 B**
**CDN เพิ่ม:** `@supabase/supabase-js@2` + `lucide@0.460.0` (defer) + Google Fonts CSS (render-blocking)

**ตัวเลขนับจากซอร์สจริง**

| ตัวชี้วัด | app.js | heavy-jobs.js | app.css |
|---|---|---|---|
| function declarations | 508 | 3 | — |
| `.innerHTML =` | 122 | 4 | — |
| `getElementById(` | 170 | — | — |
| `querySelectorAll(` | 26 | — | — |
| `.filter(` | 99 | 19 | — |
| `.from(` (Supabase) | 169 | 0 | — |
| `.rpc(` | 8 | 0 | — |
| `select("*")` | 12 | 0 | — |
| `.range(` (server pagination) | **1** | 0 | — |
| `setTimeout` / `setInterval` | 53 / 5 | — | — |
| `addEventListener` / `removeEventListener` | 36 / 4 | 0 | — |
| `.channel(` / `removeChannel(` | 3 / 6 | — | — |
| rule blocks / `!important` / `box-shadow` | — | — | 1,381 / **676** / 132 |
| `@media` / deep selector (≥4 ระดับ) | — | — | 93 / 52 |

---

## 1. สรุปความรุนแรง

| ระดับ | จำนวน | นิยาม |
|---|---|---|
| **P0** | 8 | กระทบเวลาเปิดระบบ / ปริมาณ query โดยตรง · ขัดข้อกำหนดที่ระบุไว้ |
| **P1** | 8 | กระทบ interaction / render / realtime |
| **P2** | 8 | กระทบขนาดไฟล์ / cache / บำรุงรักษา |
| **ตรวจไม่ได้** | 3 หมวด | Supabase Index/Query Plan · Hosting Header · Lighthouse จริง |

---

# P0 — วิกฤต

---

## P0-1 · Boot ยิง API 13–16 requests ก่อนผู้ใช้ใช้งานได้

**1. ไฟล์/Function**
`js/app.js` → `init()` → `boot()` → `renderApp()` → `loadAll()`

**2. สาเหตุ**
ลำดับจริงที่นับจากโค้ด:

| # | จุด | Query |
|---|---|---|
| 1 | `checkFirstSetup()` | `rpc("has_super_admin")` |
| 2 | `_restoreSessionAfterLogin()` | `from("users").select(USER_COLS)` |
| 3 | `boot()` | **`await` `users.update({online:true})`** |
| 4 | `loadAll()` → `loadUsers()` | `from("users").select(USER_COLS+",terminals")` |
| 5 | `_mergeUserTerminals()` | อาจ +1 query (fallback) |
| 6–9 | `loadDocuments()` | 2 query (`_open` 800 rows + `_win` 800 rows) + `loadDocWorkStatus()` + `loadDocSysStatus()` (desktop) |
| 10 | `loadRoutes()` | `from("shipping_location_routes")` |
| 11 | `loadJobs()` → `loadJobsForStatus()` | 1 query ต่อ status |
| 12–16 | `loadStatusCounts()` | **5 count query แยกกัน** |

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- Desktop: 13–16 round-trip ต่อ Supabase (สิงคโปร์) ก่อนเห็นข้อมูลจริง
- Mobile 4G: RTT สูงกว่า 3–5 เท่า → เวลารอเพิ่มเป็นทวีคูณ
- **ขัดข้อกำหนด "หน้าแรกก่อนใช้งานไม่เกิน 4–6 API Requests" โดยตรง**

**5. วิธีแก้แนะนำ**
- รวม `loadStatusCounts()` 5 query เป็น **RPC เดียว** (`massenger_status_counts`) → ลด 4 request
- `checkFirstSetup()` — cache ผลลง `localStorage` (มี SUPER_ADMIN แล้วไม่ต้องถามซ้ำ)
- ตัด query #2 หรือ #4 ที่ซ้ำ (ทั้งคู่ `select` จาก `users`) — ใช้ผลจาก `loadUsers()` หา `S.user` เอง
- เลื่อน `loadDocuments()` ไปโหลดตอนเปิดเมนูเอกสารครั้งแรกเท่านั้น
- **ผลคาดหมาย: 13–16 → 5–6 requests**

**6. ความเสี่ยง**
- ต่ำ–กลาง · ต้องสร้าง RPC ใหม่บน Supabase (additive ไม่แตะตารางเดิม)
- ต้องระวัง `_msgCountTerminalFilter()` ที่ใส่เงื่อนไข MESSENGER — RPC ต้องรับ terminals เป็นพารามิเตอร์

**7. ลำดับแก้:** ทำเป็นอันดับ 1 (ผลสูงสุด ความเสี่ยงต่ำ)
**8. ค่าก่อนแก้:** 13–16 requests · 5 count query ที่รวมได้เป็น 1

---

## P0-2 · `boot()` `await` การเขียน DB ก่อน render

**1. ไฟล์/Function:** `js/app.js` → `boot()`

**2. สาเหตุ (โค้ดจริง)**
```js
try{ await sb.from("users").update({online:true,last_seen:(new Date).toISOString()})
       .eq("app_code",APP_CODE).eq("id",user.id) }catch(e){}
await renderApp()
```
เป็น **write บน critical path** — ผลลัพธ์ไม่ถูกใช้เลย (`catch` ว่าง) แต่บล็อก `renderApp()`

**3. ความรุนแรง:** P0
**4. ผลกระทบ:** เพิ่ม 1 RTT เต็ม ๆ ก่อน First Meaningful Paint · มือถือ 4G ประมาณ 200–600 ms
**5. วิธีแก้:** เปลี่ยนเป็น fire-and-forget (ลบ `await`) — `startHeartbeat()` ก็ update `online` อยู่แล้วทุก 5 นาที
**6. ความเสี่ยง:** ต่ำมาก · ไม่มีโค้ดใดพึ่งผลลัพธ์นี้
**7. ลำดับแก้:** อันดับ 2 (แก้ 1 บรรทัด)
**8. ค่าก่อนแก้:** 1 blocking write request บน boot path

---

## P0-3 · `loadAll()` เป็น sequential chain — เอกสารบล็อกงาน

**1. ไฟล์/Function:** `js/app.js` → `loadAll()`

**2. สาเหตุ (โค้ดจริง)**
```js
async function loadAll(){
  const _pj=loadJobs(), _pr=loadRoutes().catch(()=>{});
  await loadUsers();
  await loadDocuments().catch(()=>{});
  await Promise.all([_pj,_pr])
}
```
`loadJobs()` เริ่มขนานก็จริง แต่ **ถูก `await` เป็นตัวสุดท้าย** → หน้ารายการงานต้องรอ `loadUsers()` + `loadDocuments()` เสร็จก่อน ทั้งที่ผู้ใช้เห็นหน้างานเป็นหน้าแรก
`loadDocuments()` ดึง **800 + 800 rows** (desktop) หรือ 800 + 300 (mobile) พร้อม `DOC_COLS` 34 คอลัมน์

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- Desktop: ข้อมูลงานปรากฏช้ากว่าที่ควร 1–2 RTT
- Mobile: หนักกว่า — 800 rows × 34 columns เข้า memory ทั้งที่ยังไม่เปิดเมนูเอกสาร
- **ขัดข้อกำหนด "ห้ามโหลดข้อมูลที่ผู้ใช้ยังไม่ได้เปิด" และ "ห้ามเรียก `loadAll()` หลัง Login"**

**5. วิธีแก้**
- `await Promise.all([loadJobs(), loadUsers()])` ก่อน → render ทันที
- `loadRoutes()` + `loadDocuments()` ย้ายไป `requestIdleCallback` หรือ lazy ตอนเปิดเมนูเอกสาร
- ลด limit เอกสาร: `_open` 800 → 200, `_win` 800 → เฉพาะเมื่อเปิดหน้า

**6. ความเสี่ยง**
- กลาง · `loadDocWorkStatus()` / `loadDocSysStatus()` พึ่ง `S.users` และ `DOC.documents` → ต้องคง dependency order
- badge เอกสารใน sidebar จะขึ้นช้ากว่าเดิมเล็กน้อย (ต้องยืนยันว่ายอมรับได้)

**7. ลำดับแก้:** อันดับ 3
**8. ค่าก่อนแก้:** 800+800 rows × 34 cols โหลดทุกครั้งที่ boot (ถ้า `docMenuVisible()` = true)

---

## P0-4 · `loadStatusCounts()` = 5 count query แยกกัน

**1. ไฟล์/Function:** `js/app.js` → `loadStatusCounts()`

**2. สาเหตุ (โค้ดจริง)**
```js
const queries=["WAIT","GOING","DONE","CANCELED"].map(st=>
  sb.from("jobs").select("id",{count:"exact",head:true})
    .eq("app_code",APP_CODE).eq("status",st).neq("category",TONREN_TYPE));
queries.push(... status DONE + closed_at ช่วงวันนี้ ...);
await Promise.all(queries)
```
`count:"exact"` บังคับ Postgres ทำ full count ทุกครั้ง · 5 ครั้งต่อการ refresh หนึ่งรอบ
ถูกเรียกจาก `loadJobs()`, `refreshAll()`, `_mergeUserTerminals()` (MESSENGER), `scheduleStatusCounts()`

**3. ความรุนแรง:** P0
**4. ผลกระทบ:** ทั้ง Desktop และ Mobile · ยิ่งตาราง `jobs` โตยิ่งช้าแบบเชิงเส้น (`count exact` = seq scan ถ้าไม่มี index ที่เหมาะ)
**5. วิธีแก้**
- RPC เดียว: `SELECT status, count(*) FROM jobs WHERE app_code=$1 AND category<>$2 GROUP BY status` + 1 แถวสำหรับ DONE_TODAY
- ถ้าตารางใหญ่มาก พิจารณา `count:"planned"` หรือ materialized counter

**6. ความเสี่ยง**
- ต่ำ ถ้า RPC คืนโครงสร้างเดียวกับ `S.statusCountsRemote`
- ต้องรองรับ `_msgCountTerminalFilter()` (MESSENGER filter `import_terminal`)

**7. ลำดับแก้:** อันดับ 1 (ทำพร้อม P0-1)
**8. ค่าก่อนแก้:** 5 request → เป้าหมาย 1

---

## P0-5 · เมนู "งานทั้งหมด" โหลดอัตโนมัติ + แบ่งหน้าฝั่ง Browser

**1. ไฟล์/Function**
`js/app.js` → `_currentJobStatuses()`, `renderView()`
`js/heavy-jobs.js` → `renderJobsView()`

**2. สาเหตุ (โค้ดจริง)**
```js
// app.js
if(v==="jobs"||v==="fz"||v==="tomorrow"||v==="future") return ["WAIT","GOING"];
if(v==="jobs"){ S.filters.dateGroup=null; return renderJobsView("งานทั้งหมด","OPEN") }

// heavy-jobs.js
const _ALLJOBS_PAGE=150,_ALLJOBS_INIT=300;
const _jobsPaged=_allWorkView?jobs.slice(0,_ALLJOBS_INIT):jobs;
const pageJobs=_jobsPaged.slice(start,end);
```
เปิดเมนู → โหลด WAIT + GOING อัตโนมัติ (`MODE_CAP=200` ต่อ status) → แล้ว **`slice()` แบ่งหน้าใน browser**
`.range(` ปรากฏใน `app.js` เพียง **1 จุด** และอยู่ใน `_docChunkFetch` เท่านั้น — หน้ารายการงาน **ไม่มี server-side pagination เลย**

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- Mobile: array 400 งานใน memory + `filter/sort` ทุกครั้งที่เปลี่ยนหน้า
- Desktop: เหมือนกัน แต่รู้สึกน้อยกว่า
- **ขัดข้อกำหนด 3 ข้อ:** "ห้ามโหลด WAIT/GOING อัตโนมัติ" · "ห้ามนำข้อมูลจาก Memory ทั้งหมดมา Render" · "ทุกหน้ารายการต้องใช้ Server-side Pagination"

**5. วิธีแก้**
- `_currentJobStatuses()` — ให้ `v==="jobs"` คืน `[]`
- `renderJobsView("งานทั้งหมด","OPEN")` — แสดงตัวกรอง + ข้อความ "กรุณาระบุเงื่อนไขแล้วกดค้นหา" แทนการ render ทันที
- สร้าง `searchJobsServer()` ใหม่ที่ใช้ `.range(from,to)` + `count:"exact"` + Loading/Empty/Error state + AbortController

**6. ความเสี่ยง**
- **สูง** — เปลี่ยนพฤติกรรมผู้ใช้ที่คุ้นเคย · ต้องได้รับอนุมัติชัดเจน (คุณยืนยันแล้วว่าให้ถามก่อน)
- ต้องระวังไม่ให้กระทบเมนู `wait` / `going` / `done-today` / `fz` / `tomorrow` / `future` ที่ใช้ `renderJobsView` ตัวเดียวกัน
- `_workAllCount()` และ badge sidebar พึ่ง `S.jobs` ที่โหลดมา → ต้องเปลี่ยนไปใช้ค่าจาก `S.statusCountsRemote` แทน

**7. ลำดับแก้:** Phase 2 (หลัง P0 ที่เสี่ยงต่ำเสร็จ)
**8. ค่าก่อนแก้:** `MODE_CAP=200` × 2 status = สูงสุด 400 rows · `_ALLJOBS_INIT=300` · `.range()` = 0 จุดในหน้ารายการงาน

---

## P0-6 · `_ensureDateRangeLoaded()` ดึงได้ถึง 10,000 แถว

**1. ไฟล์/Function:** `js/app.js` → `_ensureDateRangeLoaded()`

**2. สาเหตุ (โค้ดจริง)**
```js
var q=sb.from("jobs").select(getJobCols()).eq("app_code",APP_CODE);
if(from)q=q.gte("pickup_time",from);
if(to)q=q.lt("pickup_time",_ymdPlus1(to));
q=q.order("pickup_time",{ascending:false}).limit(1e4);
```
`limit(1e4)` = **10,000 แถว × 29 คอลัมน์** เข้า browser ในคำขอเดียว เมื่อผู้ใช้เลือกช่วงวันที่กว้าง
`getJobCols()` = `COLS_BASE` (25 คอลัมน์) + `COLS_GPS` — รวม description ซึ่งเป็น text ยาว

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- **Mobile: เสี่ยง OOM / แท็บค้าง** — payload อาจถึงหลายสิบ MB
- Desktop: Long Task ยาวมากตอน parse JSON + `_preprocessJob()` ต่อทุกแถว
- ขัดข้อกำหนด "ห้ามดึงข้อมูลหลายร้อยหลายพันรายการเข้ามาเก็บใน Browser"

**5. วิธีแก้**
- เปลี่ยนเป็น `.range(0, pageSize-1)` + `count:"exact"` แล้วแบ่งหน้าจาก server
- ลด column: หน้ารายการไม่ต้องใช้ `description` เต็ม
- บนมือถือ บังคับช่วงวันที่สูงสุด (เช่น 31 วัน) พร้อมข้อความแจ้ง

**6. ความเสี่ยง**
- กลาง · ต้องแน่ใจว่า `_lastDateRangeKey` guard และการ merge เข้า `S.jobs` ยังทำงานถูก
- ผลการกรองที่ผู้ใช้เคยเห็น "ครบทั้งช่วง" จะกลายเป็นแบ่งหน้า → ต้องยืนยัน

**7. ลำดับแก้:** Phase 2 (ทำพร้อม P0-5 เพราะแตะระบบ pagination เดียวกัน)
**8. ค่าก่อนแก้:** `limit(1e4)` · ไม่มี `.range()` · ไม่มี count

---

## P0-7 · Search — `select("*")`, ไม่มี pagination, และปิดบนมือถือ

**1. ไฟล์/Function:** `js/app.js` → `_serverSearchJobs()`

**2. สาเหตุ (โค้ดจริง)**
```js
async function _serverSearchJobs(raw){
  if(_IW<=768)return;                       // ← ปิดบนมือถือทั้งหมด
  ...
  sb.from("jobs").select("*")               // ← ทุกคอลัมน์
    .or(`job_no.ilike.${pat},company.ilike.${pat},job_nj.ilike.${pat},
         description.ilike.${pat},pickup_location.ilike.${pat}`)
    .order("created_at",{ascending:false}).limit(100)   // ← ไม่มี range/count
```

| ปัญหา | รายละเอียด |
|---|---|
| `if(_IW<=768) return` | **มือถือค้นหางานเก่าจากฐานข้อมูลไม่ได้เลย** — ค้นได้เฉพาะจาก `S.jobs` ใน memory |
| `select("*")` | ดึงทุกคอลัมน์ รวม `description` ยาว |
| `.limit(100)` ไม่มี `.range()` | ไม่มีหน้าก่อนหน้า/ถัดไป · ไม่มีจำนวนรวม |
| `ilike` 5 คอลัมน์ พร้อม `%...%` นำหน้า | **B-tree index ใช้ไม่ได้เลย** → sequential scan ทุกครั้ง |

มี `_srvSearchSeq` guard กันผลเก่าทับผลใหม่แล้ว ✅ แต่ **ไม่มี AbortController** — request เก่ายังวิ่งจนจบ

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- Mobile: ฟีเจอร์หลักใช้ไม่ได้ (ขัดข้อกำหนด "ต้องค้นหางานเก่าจากฐานข้อมูลจริงได้ครบ · มือถือครั้งละ 30 รายการ")
- Desktop: query ช้าเมื่อ `jobs` โต · payload ใหญ่เกินจำเป็น

**5. วิธีแก้**
- เปิดใช้บนมือถือ (เอา `if(_IW<=768) return` ออก) พร้อม page size 30
- `select(COLS_BASE)` แทน `select("*")`
- `.range(from,to)` + `count:"exact"` + prev/next + total
- ใส่ `AbortController` ยกเลิก request เก่า
- ฝั่ง DB: `pg_trgm` GIN index บน `job_no`, `company`, `job_nj` — **ต้องยืนยันจาก Query Plan ก่อนสร้าง**

**6. ความเสี่ยง**
- กลาง · การเปิดค้นหาบนมือถือจะเพิ่ม query load — ต้อง debounce (ปัจจุบัน `setFilterDebounced` 220 ms ใช้ได้)
- `S.searchExtra` merge เข้า `filteredJobs()` — ต้องคง logic เดิม

**7. ลำดับแก้:** Phase 2
**8. ค่าก่อนแก้:** `select("*")` · `limit(100)` · `.range()` = 0 · mobile = ปิด

---

## P0-8 · `refreshIconsIn(scope)` สแกน DOM ทั้งหน้าเสมอ

**1. ไฟล์/Function:** `js/app.js` → `refreshIcons()`, `refreshIconsIn()`

**2. สาเหตุ (โค้ดจริง)**
```js
function refreshIcons(){ if(_iconsPending)return; _iconsPending=true;
  requestAnimationFrame(()=>{ _iconsPending=false;
    try{ if(document.querySelector("[data-lucide]")) lucide.createIcons() }catch(e){} }) }

function refreshIconsIn(scope){ if(!scope)return refreshIcons();
  try{ const pending=scope.querySelectorAll("[data-lucide]");
       if(pending.length===0)return;
       refreshIcons()                        // ← ทิ้ง scope แล้วสแกนทั้ง document
  }catch(_){ refreshIcons() } }
```
`refreshIconsIn()` ตรวจ scope เพียงเพื่อ **ตัดสินใจว่าจะเรียกหรือไม่** แล้วเรียก `refreshIcons()` ที่สแกนทั้ง `document` อยู่ดี
ถูกเรียกจาก `diffJobsTbody()` ทุกครั้งที่มีแถวถูกสร้างใหม่ · จาก `otAddRow()` ทุกครั้งที่เพิ่มแถว

**3. ความรุนแรง:** P0
**4. ผลกระทบ**
- Desktop: Long Task ทุกครั้งที่ patch แถวเดียวจาก realtime
- **Mobile: หนักกว่ามาก** — DOM ใหญ่ + CPU ช้า → INP เกิน 200 ms ได้ง่าย
- ขัดข้อกำหนด "Icon Library ต้องประมวลผลเฉพาะ Container ใหม่ ห้ามสแกนทั้ง Document ทุกครั้ง"

**5. วิธีแก้**
```js
lucide.createIcons({ nameAttr:"data-lucide", attrs:{}, root: scope })
```
Lucide UMD รองรับพารามิเตอร์จำกัด scope — ต้อง**ตรวจ API เวอร์ชัน 0.460.0 จริงก่อน** ถ้าไม่รองรับ ให้เขียน replace ทีละ element ใน scope
คง `requestAnimationFrame` debounce เดิมไว้ แต่ทำเป็น queue ของ scope

**6. ความเสี่ยง**
- ต่ำ–กลาง · ถ้า scope ผิด ไอคอนจะไม่ขึ้นในบาง container
- ต้องทดสอบทุกจุดที่เรียก: sidebar, tbody, modal, OT grid, doc view

**7. ลำดับแก้:** อันดับ 4 (ผลสูง เสี่ยงต่ำ ทำได้เร็ว)
**8. ค่าก่อนแก้:** `lucide.createIcons()` เรียกแบบไม่มี root · `refreshIcons` 1 นิยาม ถูกเรียกจากทั่วทั้งไฟล์

---

# P1 — สูง

---

## P1-1 · `renderJobsView()` วน `filter()` ซ้ำบน array เดียวกันหลายสิบครั้ง

**1. ไฟล์/Function:** `js/heavy-jobs.js` → `renderJobsView()`, `getWorkViewBase()`

**2. สาเหตุ (นับจากโค้ดจริง)**

| การทำงาน | จำนวนรอบ |
|---|---|
| `filteredJobs()` | เรียกได้ถึง **4 ครั้ง** ต่อการ render 1 ครั้ง (`_kpiBase`, `jobs`, `_bj`, `_base`) |
| นับ status `cAll/cActive/cW/cG/cD/cC` | **6 passes** |
| `catCounts` วน `CATEGORIES` | **8 passes** + OT + ALL_LCB = **10 passes** |
| `getWorkViewBase()` | 2–3 `.filter()` ต่อการเรียก |
| รวม `.filter(` ในไฟล์ | **19 จุด** |

`filteredJobs()` มี `_filterCache` แต่ **cache key มี `S.filters.user` และ `messengerKpiFilterByView` อยู่ด้วย** — โค้ดจงใจสลับค่าไปมา (`S.filters.user=""` แล้วเรียกซ้ำ) เพื่อคำนวณ dropdown → **ทำให้ cache miss ทุกครั้ง**

**3. ความรุนแรง:** P1
**4. ผลกระทบ**
- ที่ 400 งาน: ประมาณ 20+ full array passes ต่อการ render 1 ครั้ง
- Mobile: สังเกตได้ชัดตอนเปลี่ยนหน้า/เปลี่ยนตัวกรอง
- Desktop: อยู่ในระดับที่ยังพอรับได้ แต่จะแย่ลงเมื่อข้อมูลโต

**5. วิธีแก้**
- คำนวณ `catCounts` + status counts ใน **loop เดียว** (single pass reduce)
- `_userFilterOpts` — เก็บเป็น Set ระหว่าง loop เดียวกัน แทนการเรียก `filteredJobs()` ซ้ำ
- `_goingKpiHtml` — ใช้ผลจาก loop เดียวกัน

**6. ความเสี่ยง**
- กลาง · ต้องได้ตัวเลขทุกตัวเท่าเดิมเป๊ะ (badge, pill count, dropdown)
- ต้องทำ regression เทียบตัวเลขก่อน/หลังทุกเมนู ทุก role

**7. ลำดับแก้:** Phase 3
**8. ค่าก่อนแก้:** `filteredJobs()` × 4 · `.filter(` 19 จุด · 16+ full passes

---

## P1-2 · Realtime เปลี่ยน status → re-render ทั้งหน้า

**1. ไฟล์/Function:** `js/app.js` → `_scheduleJobsReload()`, `_rtRowRefresh()`

**2. สาเหตุ (โค้ดจริง)**
```js
if(oldSt===newSt){ _rtPatchOneJobRow(payload.new.id) }   // ✅ patch แถวเดียว
else { _rtRowRefresh("job status "+oldSt+"->"+newSt) }   // ❌ render ทั้งหน้า

function _rtRowRefresh(reason){
  updateSidebarCounts();
  if(_rtOnJobsListView()&&_rtLastJobsArgs){ renderJobsView(_rtLastJobsArgs.t,_rtLastJobsArgs.s) }
  else { renderView() } }
```
กรณีที่เกิดบ่อยที่สุดในระบบ dispatch คือ **การเปลี่ยนสถานะ** (WAIT→GOING→DONE) ซึ่งไปเข้าเส้นทาง re-render ทั้งหน้า
`diffJobsTbody()` ช่วยได้ระดับหนึ่ง (reuse `<tr>` ที่ `updated_at` ไม่เปลี่ยน) แต่ยังต้องรัน `renderJobsView()` ทั้งฟังก์ชัน = P1-1 ทั้งชุด

**3. ความรุนแรง:** P1
**4. ผลกระทบ**
- ช่วงเวลาที่มีงานเข้าเยอะ (เช้า) — หน้าจอกระตุกทุกครั้งที่มีใครกดรับงาน
- Mobile หนักกว่าเพราะ CPU ช้ากว่า

**5. วิธีแก้**
- เปลี่ยนสถานะ = ย้ายแถวระหว่างกลุ่ม → ลบ `<tr>` เดิม + insert ตำแหน่งใหม่ + update badge เท่านั้น
- ถ้าแถวหลุดจากหน้าปัจจุบัน → แค่ลบออก + ปรับตัวเลข total
- คง `_rtRowRefresh` ไว้เป็น fallback เมื่อ patch ไม่สำเร็จ

**6. ความเสี่ยง**
- กลาง–สูง · ลำดับการเรียง (`S.sortKey`/`S.sortDir`) ต้องถูกต้อง ไม่งั้นแถวไปอยู่ผิดที่
- ต้องไม่กระทบ pill count / KPI chips ที่คำนวณจาก array เดียวกัน

**7. ลำดับแก้:** Phase 3 (หลัง P1-1 เพราะพึ่งโครงเดียวกัน)
**8. ค่าก่อนแก้:** เปลี่ยน status 1 ครั้ง = `renderJobsView()` เต็ม 1 รอบ

---

## P1-3 · กลับจาก Background > 30 วินาที → `loadJobs()` ใหม่ทั้งหมด

**1. ไฟล์/Function:** `js/app.js` → `document.addEventListener("visibilitychange", ...)`

**2. สาเหตุ (โค้ดจริง)**
```js
if(document.hidden){ _lastHiddenAt=Date.now(); _teardownRealtime() }
else { setupRealtime();
  const hiddenMs=Date.now()-_lastHiddenAt;
  if(hiddenMs>3e4){ await loadJobs(); renderSidebar(); renderView() }
  else { _scheduleJobsReload() } }
```
`loadJobs()` → `loadJobsForStatus(st,true)` **force=true** → ดึงใหม่ทั้ง status + `loadStatusCounts()` 5 query

**3. ความรุนแรง:** P1
**4. ผลกระทบ**
- **Mobile: รุนแรงที่สุด** — มือถือ suspend แท็บตลอดเวลา ผู้ใช้สลับแอปกลับมาทีก็โหลดใหม่ทั้งชุด (6+ requests)
- Desktop: เกิดเมื่อสลับแท็บนาน ๆ
- ขัดข้อกำหนด "ให้ Sync เฉพาะข้อมูลที่เปลี่ยนหลัง `updated_at` ล่าสุด ห้ามโหลดทุกอย่างใหม่โดยอัตโนมัติ"

**5. วิธีแก้**
- เก็บ `_lastSyncAt` แล้วยิง delta: `.gt("updated_at", _lastSyncAt)` → merge เฉพาะแถวที่เปลี่ยน
- `loadStatusCounts()` เรียกได้ (ถ้ารวมเป็น RPC เดียวแล้วจะเหลือ 1 request)

**6. ความเสี่ยง**
- กลาง · ถ้ามีแถวถูก **ลบ** ระหว่าง background จะไม่ถูกจับด้วย delta → ต้องมี full resync แบบมีเงื่อนไข (เช่น ทุก 10 นาที)
- ต้องแน่ใจว่า `updated_at` ถูก set ทุกครั้งที่ update (ต้องยืนยันจาก schema/trigger)

**7. ลำดับแก้:** Phase 3
**8. ค่าก่อนแก้:** กลับจาก background 1 ครั้ง = 1 job query + 5 count query

---

## P1-4 · กลับมา Online → `loadJobs()` ใหม่ทั้งหมด

**1. ไฟล์/Function:** `js/app.js` → `window.addEventListener("online", ...)`
**2. สาเหตุ:** `await loadJobs(); renderSidebar(); renderView()` — ปัญหาเดียวกับ P1-3
**3. ความรุนแรง:** P1
**4. ผลกระทบ:** Mobile หนักกว่า (เน็ตหลุด/ต่อบ่อยกว่า) · เน็ตกระพริบ = โหลดใหม่ทุกครั้ง
**5. วิธีแก้:** ใช้ delta sync ตัวเดียวกับ P1-3
**6. ความเสี่ยง:** ต่ำ (ใช้ฟังก์ชันร่วมกับ P1-3)
**7. ลำดับแก้:** Phase 3 (แก้พร้อม P1-3)
**8. ค่าก่อนแก้:** 1 job query + 5 count query ต่อการ reconnect 1 ครั้ง

---

## P1-5 · `_scheduleUsersReload()` fallback ดึงผู้ใช้ทั้งหมดใหม่

**1. ไฟล์/Function:** `js/app.js` → `_scheduleUsersReload()`

**2. สาเหตุ (โค้ดจริง)**
มี fast path patch ราย record แล้ว ✅ แต่ถ้า payload ไม่มี `eventType`/`new` จะตกไป:
```js
_rtUsersTimer=setTimeout(async()=>{ await loadUsers();
  if(S.view==="users"||S.view==="messengers")renderView() },1500)
```
`loadUsers()` ดึง users ทุกคน + `_mergeUserTerminals()` (อาจ +1 query) ทุกครั้ง

**3. ความรุนแรง:** P1
**4. ผลกระทบ:** ทุกแพลตฟอร์ม · ผู้ใช้ online/offline เปลี่ยนบ่อย (heartbeat ทุก 5 นาที × จำนวนผู้ใช้) → trigger บ่อยกว่าที่คาด
**5. วิธีแก้:** ใส่ `filter` ที่ระดับ channel ให้รับเฉพาะ event ที่จำเป็น หรือ ignore การเปลี่ยนเฉพาะ `online`/`last_seen`
**6. ความเสี่ยง:** ต่ำ · แต่ต้องคงการอัปเดตจุดเขียว online ใน sidebar
**7. ลำดับแก้:** Phase 3
**8. ค่าก่อนแก้:** 1–2 query ต่อ 1.5 วินาที ในกรณี fallback

---

## P1-6 · `.innerHTML =` 126 จุด — เขียนทับ container ใหญ่

**1. ไฟล์/Function:** `js/app.js` (122 จุด) · `js/heavy-jobs.js` (4 จุด) · `js/heavy-users.js` (`renderUsersView`)

**2. สาเหตุ**
- `renderUsersView()`: `container.innerHTML = ... arr.map(userRow).join("")` — สร้าง HTML ผู้ใช้ทั้งหมดในสตริงเดียว ไม่มี pagination เลย
- `renderSidebar()`: `card.innerHTML` + `menu` ทั้งก้อน (มี `_lastSidebarSig` guard ✅ ช่วยได้มาก)
- `renderJobsView()`: มี `sameStruct` guard + `diffJobsTbody()` ✅ แต่กรณี structure เปลี่ยนก็ยังเขียนทับทั้ง `view-root`

**3. ความรุนแรง:** P1
**4. ผลกระทบ:** parse HTML + reflow + relayout · Mobile รู้สึกชัดที่สุด · ตามด้วย `refreshIcons()` ที่สแกนทั้ง document (P0-8)
**5. วิธีแก้**
- `renderUsersView()` — ใส่ pagination หรือ virtualization
- จุดที่เขียนทับ `view-root` ทั้งก้อน — แยกเป็น header / filter / tbody แล้ว patch เฉพาะส่วน
**6. ความเสี่ยง:** กลาง · หน้าตาต้องเหมือนเดิม 100%
**7. ลำดับแก้:** Phase 4
**8. ค่าก่อนแก้:** `.innerHTML =` รวม 126 จุด · `renderUsersView` = 0 pagination

---

## P1-7 · `loadDocuments()` ดึง 800+800 rows × 34 คอลัมน์

**1. ไฟล์/Function:** `js/app.js` → `loadDocuments()`, `DOC_COLS`

**2. สาเหตุ (โค้ดจริง)**
```js
const _open = await _fetchDocs(q=>q.in("doc_status",_OPEN_STATUSES), 800);
_win = _docMob ? await _fetchDocs(...COMPLETED วันนี้..., 300)
               : await _fetchDocs(...created_at >= 7 วัน..., 800);
```
`DOC_COLS` = **34 คอลัมน์** รวม `description`, `note`
Desktop เพิ่ม `loadDocWorkStatus()` + `loadDocSysStatus()` ซึ่งยิง `job_logs` แบบ chunked (`_docChunkFetch`) อีก

**3. ความรุนแรง:** P1
**4. ผลกระทบ**
- Desktop: สูงสุด 1,600 rows × 34 cols ตอน boot
- Mobile: 1,100 rows — memory + JSON parse หนัก
- โหลดแม้ผู้ใช้ยังไม่เปิดเมนูเอกสาร (ถ้า `docMenuVisible()` = true)

**5. วิธีแก้**
- แยกคอลัมน์: หน้า list ใช้ ~12 คอลัมน์ · หน้ารายละเอียดค่อยดึงเต็ม
- ลด `_open` limit → 200 พร้อม pagination
- `loadDocWorkStatus()`/`loadDocSysStatus()` → เรียกเมื่อเปิดหน้าเอกสารจริง

**6. ความเสี่ยง**
- กลาง–สูง · โมดูลเอกสารมี logic สถานะซับซ้อน (`_docResolveStatus`, overdue, card status)
- ต้องตรวจว่าไม่มีที่ไหนอ่านคอลัมน์ที่ถูกตัดออก

**7. ลำดับแก้:** Phase 4
**8. ค่าก่อนแก้:** limit 800+800 (desktop) / 800+300 (mobile) · DOC_COLS 34 คอลัมน์

---

## P1-8 · `app.js` 477 KB (115 KB gzip) — parse บน Main Thread

**1. ไฟล์:** `js/app.js` · 508 function declarations

**2. สาเหตุ**
แยก lazy chunk ออกไปแล้ว 5 ก้อน (105 KB raw) ✅ แต่ core ยังเหลือ 477 KB
โมดูลที่ยังอยู่ใน core ทั้งที่ไม่จำเป็นตอน boot:
- โมดูลเอกสาร (DOC) ทั้งชุด — `_docV2*`, `_docInjectModals`, `_docInjectCss`, timeline, overdue popup
- ระบบ print/ใบสั่งงาน (`openPrintJob`, HTML template 3.1 KB)
- ระบบ signature, attachment, GPS/distance backfill
- Backup / admin tools

**3. ความรุนแรง:** P1
**4. ผลกระทบ**
- Mobile ระดับกลาง: parse + compile JS 477 KB = Long Task หลายร้อย ms → กระทบ TBT/INP โดยตรง
- Desktop: กระทบน้อยกว่าแต่ยังนับใน TBT
- ขัดข้อกำหนด "ห้ามมี JavaScript ขนาดใหญ่ไฟล์เดียวทำงานทั้งหมด"

**5. วิธีแก้**
- แยก `heavy-doc.js` (โมดูลเอกสารทั้งชุด) — น่าจะลดได้มากที่สุด
- แยก `heavy-print.js`, `heavy-detail.js` (modal รายละเอียด + timeline + attachment + signature)
- ใช้รูปแบบ stub เดิม (`_lazyCall`/`_lazyRender`) ที่พิสูจน์แล้วว่าใช้ได้กับ 5 chunk

**6. ความเสี่ยง**
- **สูง** — โมดูลเอกสารผูกกับ realtime (`setupDocRealtime`) และ boot (`initDocModule`)
- ต้องทำทีละก้อน + regression เทียบ `app.monolithic.js` ทุกรอบ

**7. ลำดับแก้:** Phase 5 (ทำท้ายสุด เสี่ยงสูงสุด)
**8. ค่าก่อนแก้:** app.js 477,739 B / gzip 115,514 B · 508 functions

---

# P2 — ปานกลาง

| # | จุด | ไฟล์/Function | สาเหตุ | ผลกระทบ | วิธีแก้ | ความเสี่ยง |
|---|---|---|---|---|---|---|
| P2-1 | `app.monolithic.js` 559 KB อยู่บน hosting | — | ไฟล์ rollback ไม่ถูกโหลด แต่เข้าถึงได้จาก URL สาธารณะ | ไม่กระทบความเร็ว · เสี่ยงด้าน security (มี logic + endpoint ครบ) | ย้ายออกนอก public root หรือบล็อกด้วย hosting rule · **ห้ามลบ** | ต่ำ |
| P2-2 | CSS 131 KB · 676 `!important` · 132 `box-shadow` · 52 deep selector | `css/app.css` | render-blocking ทั้งไฟล์ · shadow/blur เพิ่ม paint cost | Mobile: paint ช้าลง · CLS จาก font | แยก Critical CSS (login+layout) inline · ส่วนที่เหลือ `media="print"` + onload swap | กลาง (หน้าตาต้องเหมือนเดิม) |
| P2-3 | Font 8 weight จาก Google Fonts | `index.html` บรรทัด 95 | `Inter` 400/600/700/800 + `Sarabun` 400/600/700/800 = **render-blocking `<link>`** | FCP ช้าลงทุกแพลตฟอร์ม · Mobile หนักกว่า | ตัดเหลือ weight ที่ใช้จริง · self-host + `preload` + `font-display:swap` (มี `&display=swap` แล้ว ✅) | ต่ำ–กลาง |
| P2-4 | Service Worker ปิดสนิท | `app.js` `if(false&&"serviceWorker"...)` | ตั้งใจปิดช่วง UAT · ไม่มี precache/offline/versioned cache | เปิดซ้ำต้องโหลดใหม่หมด (ยกเว้น HTTP cache) · ไม่มี Force Update ระดับ SW | ตัดสินใจว่าจะเปิดกลับหรือไม่ — **ต้องขออนุมัติ** | สูง (กระทบ cache ทุกเครื่อง) |
| P2-5 | `?v=3.1.0` hard-code 5 จุด | `index.html` + `_loadChunk` + `_loadHeavyExport` | ต้องแก้มือ 7 จุดทุก deploy · ถ้าลืม = ไฟล์คนละเวอร์ชัน | เสี่ยง mixed-version สูง | รวมเป็นตัวแปรเดียว (`window.__BUILD__`) อ่านจาก `runtime-config.js` | ต่ำ |
| P2-6 | Heartbeat `setInterval` 60 วิ | `startHeartbeat()` | ทุก 5 tick (5 นาที) ยิง `users.update` | เล็กน้อย · มี BroadcastChannel leader election ✅ และ `document.hidden` guard ✅ | คงไว้ · อาจขยายเป็น 10 นาที | ต่ำมาก |
| P2-7 | `getElementById` 170 จุด ไม่ cache | `app.js` ทั่วไฟล์ | DOM query ซ้ำใน render loop | เล็กน้อยแต่สะสม | cache element ที่ใช้บ่อยใน render function | ต่ำ |
| P2-8 | `ADMIN_MOBILE_PAGE_SIZE` ไม่มี default | `runtime.js` `_RC_DEFAULTS` | ถ้าลบออกจาก config → `getRuntimeNumber` คืน 0 | ADMIN บนมือถือจะเห็น 0 แถว | เพิ่ม `ADMIN_MOBILE_PAGE_SIZE:50` ใน `_RC_DEFAULTS` | ต่ำมาก |

**หมายเหตุ P2 เพิ่มเติม**
- `runtime.js` default `READ_ONLY:true` แต่ `runtime-config.js` ตั้ง `false` — ถ้าไฟล์ config โหลดไม่สำเร็จ ระบบจะกลายเป็น read-only ทั้งหมด (เป็น fail-safe ที่ดี แต่ต้องรู้)
- `ENVIRONMENT:"uat"` ยังเป็น uat → `_rcWarn()` จะ `console.warn` ทุกครั้งที่อ่านค่าผิดชนิด

---

# 2. หมวดที่ **ตรวจไม่ได้** ด้วยข้อมูลปัจจุบัน

| หมวด | เหตุผล | ต้องการ |
|---|---|---|
| **Supabase Index / Query Plan** | ไม่มีสิทธิ์เข้า DB | schema + `pg_indexes` + `EXPLAIN ANALYZE` ของ query หลัก 5 ตัว + จำนวนแถวจริงใน `jobs`/`documents` |
| **Hosting / Compression / Cache-Control** | ไม่มี URL deploy | URL จริง + ชื่อ hosting (Netlify/Vercel/Cloudflare/Firebase) |
| **Lighthouse / Waterfall / Core Web Vitals** | รันเบราว์เซอร์กับเว็บจริงไม่ได้ในสภาพแวดล้อมนี้ | ผู้ใช้รัน Lighthouse เอง 3 รอบ (mobile + desktop) แล้วส่งผลมา — **ผมจะไม่รายงานคะแนนที่ไม่ได้วัดจริง** |
| **รูปภาพ / Icon assets** | โฟลเดอร์ `assets/` ยังไม่ส่งมา | รายชื่อไฟล์ + ขนาดในโฟลเดอร์ `assets/` |

**Index ที่ *น่าจะ* จำเป็น (ต้องยืนยันจาก Query Plan ก่อนสร้างจริง — ห้ามสร้างมั่ว):**

| Query ที่พบในโค้ด | คอลัมน์ที่กรอง |
|---|---|
| `loadJobsForStatus` | `(app_code, status, created_at DESC)` |
| `loadJobsForStatus` DONE | `(app_code, status, closed_at DESC)` |
| `loadStatusCounts` | `(app_code, status)` + `category` |
| `_ensureDateRangeLoaded` | `(app_code, pickup_time DESC)` |
| `_serverSearchJobs` | `pg_trgm` GIN บน `job_no`, `company`, `job_nj` |
| `loadDocuments` | `(app_code, doc_status, created_at DESC)`, `(app_code, completed_at)` |
| `_docChunkFetch` job_logs | `(app_code, job_id, action)` |

---

# 3. แผนแก้เป็น Phase

> เรียงตาม **ผลด้านความเร็วสูงสุด × ความเสี่ยงต่ำสุด** ก่อน

## Phase 1 — Quick Win (เสี่ยงต่ำมาก · ไม่แตะ business logic)

| ลำดับ | รายการ | ไฟล์ | ผลคาดหมาย |
|---|---|---|---|
| 1.1 | รวม `loadStatusCounts()` 5 query → 1 RPC | `app.js` + Supabase RPC ใหม่ | **−4 requests** ทุกครั้งที่ refresh |
| 1.2 | ตัด `await` จาก `users.update({online})` ใน `boot()` | `app.js` | **−1 blocking RTT** บน boot path |
| 1.3 | `refreshIconsIn()` ให้ scope จริง | `app.js` | ลด Long Task ทุกครั้งที่ patch แถว |
| 1.4 | เพิ่ม `ADMIN_MOBILE_PAGE_SIZE` ใน `_RC_DEFAULTS` | `runtime.js` | กัน bug ค่า 0 |
| 1.5 | รวม `?v=` เป็นตัวแปรเดียว | `index.html` + `app.js` | กัน mixed-version |

**เป้าหมาย Phase 1:** boot requests 13–16 → **8–10** · ไม่มีการเปลี่ยนพฤติกรรมใด ๆ ที่ผู้ใช้สังเกตได้

---

## Phase 2 — Boot Path (เสี่ยงต่ำ–กลาง · ต้องยืนยัน 1 จุด)

| ลำดับ | รายการ | ต้องขออนุมัติ |
|---|---|---|
| 2.1 | `loadAll()` — `Promise.all([loadJobs, loadUsers])` ก่อน render · เลื่อน `loadRoutes`/`loadDocuments` ไป idle | ❌ ไม่ต้อง |
| 2.2 | cache ผล `checkFirstSetup()` | ❌ ไม่ต้อง |
| 2.3 | ตัด query `users` ที่ซ้ำระหว่าง `_restoreSessionAfterLogin` กับ `loadUsers` | ❌ ไม่ต้อง |
| 2.4 | ลด limit `loadDocuments` + แยกคอลัมน์ list/detail | ⚠️ ต้องยืนยัน (badge เอกสารขึ้นช้าลง) |

**เป้าหมาย Phase 2:** boot requests → **5–6** ตามข้อกำหนด

---

## Phase 3 — Pagination + Search (เสี่ยงสูง · ต้องอนุมัติชัดเจน)

| ลำดับ | รายการ | ต้องขออนุมัติ |
|---|---|---|
| 3.1 | เปิด server search บนมือถือ + `select(COLS_BASE)` แทน `select("*")` | ⚠️ |
| 3.2 | `.range()` + `count:"exact"` + prev/next + total + AbortController | ⚠️ |
| 3.3 | `_ensureDateRangeLoaded` — เลิกใช้ `limit(1e4)` | ⚠️ |
| 3.4 | เมนู "งานทั้งหมด" = ค้นหาก่อนจึงแสดง | ⚠️⚠️ **เปลี่ยนพฤติกรรมผู้ใช้** |

---

## Phase 4 — Render / Realtime (เสี่ยงกลาง–สูง)

| ลำดับ | รายการ |
|---|---|
| 4.1 | `renderJobsView()` single-pass counting |
| 4.2 | เปลี่ยน status → patch แถวแทน re-render |
| 4.3 | delta sync ตอนกลับจาก background / online |
| 4.4 | `renderUsersView()` pagination |

---

## Phase 5 — Bundle / CSS / Cache (เสี่ยงสูงสุด · ทำท้ายสุด)

| ลำดับ | รายการ |
|---|---|
| 5.1 | แยก `heavy-doc.js` ออกจาก `app.js` |
| 5.2 | แยก `heavy-print.js` / `heavy-detail.js` |
| 5.3 | Critical CSS + defer ส่วนที่เหลือ |
| 5.4 | ลด font weight |
| 5.5 | ตัดสินใจเรื่อง Service Worker |

---

# 4. ข้อจำกัดของรายงานนี้

1. **ไม่มีตัวเลข Lighthouse / FCP / LCP / INP / TBT** — สภาพแวดล้อมนี้รันเบราว์เซอร์กับเว็บจริงไม่ได้ ผมจะไม่รายงานตัวเลขที่ไม่ได้วัดจริง ตามที่คุณกำหนด
2. **ไม่มี Query Plan / Index จริง** — ข้อเสนอ index ทั้งหมดเป็นสมมติฐานจาก query ในโค้ด **ห้ามนำไปสร้างก่อนตรวจ `EXPLAIN ANALYZE`**
3. **ไม่มีข้อมูล Hosting** — หมวด compression / cache-control / HTTP2 / CDN ยังตรวจไม่ได้
4. **ตัวเลขทั้งหมดในรายงานนี้นับจากซอร์สโค้ดจริง** (`grep`/AST scan/`gzip`) ไม่มีการประมาณ

---

**ยังไม่มีการแก้ไขไฟล์ใด ๆ — MD5 ทุกไฟล์ตรงกับต้นฉบับที่อัปโหลด**
