# Document Dependency Map — MASSENGER V3
> วิเคราะห์จากไฟล์ Production จริง (`app.js` 559KB · doc functions **140 ตัว ~152KB**) · ไม่แก้โค้ด/ไม่ย้าย/ไม่แตะ production

## ⚠️ ข้อสรุปชี้ขาด (อ่านก่อน)
**Document เป็น "หน้าแรกหลัง Login" ของ role SHIPPING** → **ห้ามนับ 152KB เป็นการลด Initial แบบเต็มจำนวน** · แยกทั้งก้อนไม่ได้ (มี Startup + Cross-feature dependency)

---

## 1. Document เป็นหน้าแรกหลัง Login หรือไม่
**ใช่ — สำหรับ SHIPPING**
```js
function _defaultLandingView(){ return _isShippingOnly() ? "doc-new" : canSeeAdminDashboard() ? "jobs" : "wait" }
```
- SHIPPING-only → **`doc-new` (Document = หน้าแรก)**
- ADMIN/SUPER_ADMIN → `jobs` · role อื่น → `wait`

## 2. Role ใดถูกพาเข้า Document อัตโนมัติ
- **SHIPPING (status active)** → เข้า Document ทันทีหลัง login (`_isShippingOnly()` = role==="SHIPPING")
- `_docIsSuper()`/SUPER_ADMIN เห็น Document ได้ แต่ landing = jobs (ไม่ auto)

## 3. Startup Function ที่เรียกโค้ด Document ก่อนเปิดเมนู
- `renderView()` → **`renderDocView()`** (core อ้าง **14 จุด**) — เมื่อ view เป็น doc-* (SHIPPING = ตั้งแต่ landing)
- `renderApp()` → อ้าง `DOC.pageSize` (DOC state)
- **setInterval (หลัง login ทุก role):** `_docUpdateDesktopOverduePopup()` + `_docUpdateCompletedTodayPopup()` → เรียก `_docOverdueOpenDocs`, `_docShowDesktopOverduePopup`, `_docCompletedTodayCardCounts`, `_docShowCompletedTodayPopup`
- `setupDocRealtime()` เรียกหลัง login (core อ้าง 1 จุด)
→ **โค้ด Document ส่วนหนึ่งจำเป็นทันทีหลัง login แม้ไม่เปิดเมนู** (popup timer + realtime + landing สำหรับ SHIPPING)

## 4. Inline `onclick` Document — **49 จุด** (จริงมากกว่าที่ประเมิน 36)
`_docClearedPickCard, _docCloseCompletedTodayAlert, _docCloseOverdueAlert, _docOpenMobileAttachmentPreview, _docOverlayClose, _docScrollToCompletedToday, _docScrollToOverdue, _docSpCpAttach, _docSpCpDone, _docSpCustomAttach, _docSpFdaAttach, _docSpFdaSave, _docSpMobPick, _docSpOther, _docSpOtherAttach, _docSpOtherDone, _docSpOtherSubmit, _docSpPrevAddMore, _docSpPrevCancel, _docSpPrevConfirm, _docSpPrevDeleteAt, _docSpPrevZoom, _docSpSaveCustom, _docV2CancelHeader, _docV2CopyTimeline, _docV2DeleteConfirm, _docV2DeleteEntry, _docV2EditEntry, _docV2EditHeader, _docV2EditSave, _docV2ImgPreview, _docV2SaveHeader, _docV2Status, _docV2StatusSave, _docV2SysLoadMore, _docV2Tab, docClearedSubmit, docCloseHistoryDialog, docEditSubmit, docExportExcel, docGotoPage, docPostponeSubmit, docReassignSubmit, docRefresh, docSetCategory, docSetHistoryWindow, docSetStatusFilter, docSetTerminal, docToggleLeadtimeOver`

## 5. Global Variables + Shared Helpers ที่ Document ใช้
**DOC state (37 fields):** `documents, currentDoc, filters, view, page, pageSize, cardStatuses, routes, searchExtra, mobileWindowDays, _sysTL, _sysTLCache, _sysStatus, _workStatus, _spFile(s), _spSel, _spPending, _cpFiles, _fdaFiles, _editId, _postponeId, _clearedId/Card/Mode/Opts, _overdueTimer, _completedTimer, _overdueAlerted, _completedAlerted, _lastNotified*, _sessionStart, _cssInjected, ...`
**Module vars (13):** `_docChannel, _docCountSig, _docSearchTimer, _docSearching, _docRtRenderTimer, _docVisCache, _docStructKey, _docViewStructureKey, _docExist, _docMob, _docMsg, _docs, _doc`
**Shared helpers (จาก core):** `esc(138), toast(93), APP_CODE(52), _IW(41), fmtDateTime(8), refreshIconsIn(8), roleIsAdmin(6), getRuntimeFeature(1), sb, S.user`

## 6. Realtime Channel
- Channel: **`documents-rt-<app>`**
- Subscribe: `setupDocRealtime()` (มี `.subscribe()`), `setupRealtime()` — **เรียกหลัง login**
- Unsubscribe: `_teardownRealtime()` (removeChannel), `setupDocRealtime` (teardown ก่อน sub ใหม่)
- Handler: `_onDocRealtime()` (1.3KB), `_docRealtimeRefresh()` (1.3KB) → เรียก render/refresh

## 7. Timer / setInterval
- **2 setInterval หลัง login (ทุก role):** `_docUpdateDesktopOverduePopup` (60s), `_docUpdateCompletedTodayPopup` (60s) — มี `document.hidden` guard
- **DOC timers:** `DOC._overdueTimer`, `DOC._completedTimer` (setTimeout ภายใน popup flow)
- `_docSearchTimer`, `_docRtRenderTimer` (debounce)

## 8. จุดผูกกับ Job / Messenger / Timeline / Pending
- **Job/Messenger (เบา):** `S.jobs` (3), `messenger_received` (3) — doc อ่านข้อมูล job บางส่วน
- **Timeline (แน่น-ภายใน doc):** `Timeline/timeline` (39) — `_docV2*` = ระบบ timeline ของ doc เอง (ไม่ผูก messenger timeline)
- **Pending:** ใช้ pattern `_perfCutoffISO`/pending ร่วมกับ core query (แชร์ helper)
- **สำคัญ:** `jobRowFull` (core, render แถว job) เรียก `_otSummary` — ไม่ผูก doc โดยตรง · doc ↔ job coupling **เบา** แต่ `renderDocView` ผูกกับ core render แน่น (14 refs)

## 9. กลุ่มที่แยกเป็น Lazy Chunk ได้ (บนกระดาษ — ต้อง verify ต่อ)
| กลุ่ม | fns | ~ขนาด | เปิดเมื่อ | ความเสี่ยง |
|---|---|---|---|---|
| **Timeline `_docV2*`** | 23 | **~39KB** | เปิด timeline ใน doc detail | 🟠 กลาง (onclick 13, ผูก DOC._sysTL*) |
| **Shipping-process `_docSp*`** | 27 | **~17KB** | กดขั้นตอน shipping/แนบไฟล์ | 🟠 กลาง (onclick 20, ผูก DOC._sp*) |
| **Edit/CRUD modals** (`docEditSubmit/Postpone/Reassign/ClearedSubmit`) | 5 | ~10KB | เปิด modal แก้ไข | 🟡 ต่ำ-กลาง |
| รวมแยกได้ (on-demand จาก doc **detail**) | 55 | **~66KB** | | |

## 10. กลุ่มที่ต้องคงใน `app.js` + เหตุผล
| กลุ่ม | fns | ~ขนาด | เหตุผล |
|---|---|---|---|
| `renderDocView` + render list | 3 | ~19KB | **landing SHIPPING** + core อ้าง 14 จุด (render entry) |
| Popup/Alert timer | 13 | ~6KB | **setInterval หลัง login ทุก role** |
| Realtime (`setupDocRealtime/_onDocRealtime/_docRealtimeRefresh`) | 3 | ~3KB | subscribe หลัง login |
| Cache/Counts/Vis | 4 | ~1KB | ใช้โดย render + counts ตั้งแต่ landing |
| Pagination/Filter/Category | ~8 | ~1KB | ใช้ในหน้า list (landing) |
| Other (ต้องวิเคราะห์ราย fn) | 71 | ~67KB | ⚠️ ยังไม่ยืนยัน — ปนทั้ง must-stay และ on-demand |

---

## ข้อมูลเพิ่มเติม

### 140 Document functions แบ่งตามหน้าที่
- Render/View: 3 (~19KB) · Shipping `_docSp*`: 27 (~17KB) · Timeline `_docV2*`: 23 (~39KB) · Realtime: 3 (~3KB) · Cache/Counts: 4 · Popup/Alert: 13 (~6KB) · Pagination: 2 · Filter/Category: 4 · Export/PDF: 1 (~3KB, แยกไป heavy-export แล้ว) · Edit/CRUD: 5 (~10KB) · Mobile: 2 · **Other: 53 (~50KB)** ← ต้องวิเคราะห์รายตัวก่อนแยก

### Call Graph (Login → หน้าแรก → เปิด Document)
```
boot() → loadCurrentUser() → renderApp() [อ้าง DOC.pageSize]
  → S.view = _defaultLandingView()   // SHIPPING → "doc-new"
  → renderView() → renderDocView()   // ← Document โหลดทันที (SHIPPING)
  → setupRealtime()/setupDocRealtime() [subscribe documents-rt]
  → setInterval(_docUpdate*Popup)    // ทุก role หลัง login
[ผู้ใช้กด doc detail] → _docV2*/_docSp* (timeline/shipping) ← จุดที่ lazy ได้
```

### Circular dependency (ที่พบ)
- `renderDocView` ↔ `docGotoPage/docRefresh/docSet*/docToggle*` (เรียก renderDocView กลับ) — วงจร render↔filter/paginate
- `_onDocRealtime` → `_docRealtimeRefresh` → render → (อาจ) trigger realtime debounce

### Event Listeners ติดตั้งตอน Startup (top-level รวมทั้งแอป)
`resize×2, popstate, error, unhandledrejection, load, visibilitychange×3, online, offline, click×4, scroll, beforeunload, afterprint` — บางตัว (click/scroll) เกี่ยว doc popup/overlay

### DOM id/class ที่ Document อ้าง
- **ids:** `doc-detail-body, doc-v2-detail/edit/fields/status/del/imgview/rowmenu, doc-sp-custom/hidden/prev-pop, doc-status-pop, doc-hist-pop, doc-other-pop/detail/file/save/err, doc-cleared-done-alert, doc-generic-overlay, doc-mobile-att-preview`
- **classes:** `tbl-doc-*, doc-NEW/RECEIVED/COMPLETED/COMPLETED_TODAY/POSTPONED/CLEARED/CLOSED/TONREN/FZDOC, doc-attachments, doc-catchip, doc-adv-row, doc-cleared-*`

---

## ผลที่คาดว่าจะลด Initial JS ได้จริง (ไม่นับโค้ดที่ต้องโหลดทันทีหลัง Login)
| Role | Document เป็นหน้าแรก? | ลด Initial ได้จริง |
|---|---|---|
| **SHIPPING** | ✅ ใช่ | **~0KB** (doc = home · แยกได้แค่ sub-feature detail ที่เปิดวินาทีถัดมา) |
| ADMIN/SUPER | ❌ (home=jobs) | ~40–66KB (เลื่อน render doc + detail sub-features) **แต่** popup timer/realtime ยังดึง doc บางส่วนหลัง login |
| MESSENGER/STAFF | ❌ (home=wait) | คล้าย ADMIN |

**สรุปตรงๆ:** แยก Document ทั้ง 152KB **ไม่ได้** · ที่แยกได้จริงคือ **sub-feature ใน doc detail** (`_docV2*` timeline ~39KB + `_docSp*` shipping ~17KB = ~56KB) โหลดตอนเปิด detail — **แต่ SHIPPING (เจ้าของงาน doc) เปิด detail แทบจะทันที → ประโยชน์ต่อ initial น้อยมาก + เสี่ยงกลาง**

## ข้อเสนอการแบ่ง Chunk (ให้ตรวจก่อน — ยังไม่ทำ)
- **แนะนำ: ยังไม่แยก Document** — Round 1 (Export/Dashboard/OT/Users ~74KB) เก็บ win ที่ปลอดภัยไปแล้ว · Document เป็น home ของ SHIPPING = แยกแล้วแค่ย้ายเวลารอ
- **ถ้าจะแยกจริง (เสี่ยงกลาง):** ทำเฉพาะ 2 sub-chunk จาก doc **detail** เท่านั้น:
  - `doc-timeline.js` = `_docV2*` (~39KB) โหลดตอนเปิด timeline
  - `doc-shipping.js` = `_docSp*` (~17KB) โหลดตอนกดขั้นตอน shipping
  - **ต้องวิเคราะห์ 53 "Other" + 71 unclassified รายตัวก่อน** เพื่อยืนยันไม่มี must-stay ปน · แล้ว browser-test หนัก
- **ห้าม** แตะ renderDocView / popup timer / realtime / cache (startup deps)
