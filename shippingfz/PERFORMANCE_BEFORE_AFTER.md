# SHIPPING FZ — Performance BEFORE / AFTER

| | |
|---|---|
| `index.html` MD5 | `d09b4261881b25ce9eaf598a08aa8488` |
| `SHIPPING FZ.exe` SHA-256 | `233477e735f57b9c84e2ff222787621ca764dfab9e830c0d748ff9d990411348` |
| ขนาด EXE | 1,635,884 bytes |
| SQL ที่ต้องรัน | **`010_perf_all_sfz.sql`** (RPC 3 ตัว + index 4 ตัว · รันซ้ำได้) |
| แก้ `index.html` | เพิ่ม 108 บรรทัด · แก้/ลบ 27 บรรทัด |

---

## ⚠️ ยืนยัน 10/10 ไม่ได้

ไม่มี Chrome ไม่มี Lighthouse ไม่มีมือถือ และต่อ Supabase project ของคุณไม่ได้
**จึงไม่รายงานตัวเลข ms ของ Login / Tab switch / Search / Export และไม่ให้คะแนน Performance**

สิ่งที่รายงานได้ทั้งหมดด้านล่างคือ **จำนวน query และ rows ที่นับจาก Source จริง** + **ผลรัน SQL จริงบน PostgreSQL 16** + **ผลรัน EXE จริงผ่าน Wine**

---

## ตารางสรุป BEFORE / AFTER (นับจาก Source จริง)

### 1. เปิดโหมด 🔵 ดำเนินตรวจปล่อย (100 งาน · timeline เฉลี่ย 30 entry/งาน)

| | BEFORE | AFTER |
|---|---|---|
| Query โหลดเอกสาร | 1 | 1 |
| Query สถานะลูกค้า (`_loadJobStatus`) | 1 | 0 |
| Query สถานะชิปปิ้ง (`_loadSysStatus`) | 1 | 0 |
| Query จำนวนไฟล์แนบ (`_ripLoadAttachCounts`) | 1 | 0 |
| **RPC `sfz_row_meta` (รวม 3 อย่าง)** | — | **1** |
| **รวม request** | **4** | **2** |
| **Rows ที่ DB ส่งกลับสำหรับสถานะ** | **~3,000** (log ทั้งหมดของ 100 งาน) | **≤200** (ล่าสุด 1 แถว/งาน × 2 สาย) |
| Rows สำหรับไฟล์แนบ | 1 แถวต่อ 1 ไฟล์ (เช่น 300 ไฟล์ = 300 แถว) | **นับมาจาก DB แล้ว** (≤100 แถว) |

**สำคัญ:** ข้อความที่แสดงยังผ่าน `_jobStatusText()` / `_sysMsg()` เดิมทุกบรรทัด → **สิ่งที่เห็นบนจอเหมือนเดิม 100%**

### 2. Refresh Count badge

| | BEFORE | AFTER |
|---|---|---|
| Request | **8** (`DOC_MODES` 8 โหมด × `_ensureCount()`) | **1** (`sfz_mode_counts`) |
| Coalescing | มีอยู่แล้ว `_recountSoon()` debounce 1200 ms | คงเดิม |

### 3. Reset งานเลื่อนหมดอายุ

| งานที่ครบกำหนด | BEFORE | AFTER |
|---|---|---|
| 5 งาน | 1 + 5×2 = **11** | **1** |
| 20 งาน | 1 + 20×2 = **41** | **1** |
| 20 งาน · 10 เครื่องเปิดพร้อมกัน | สูงสุด **410** | **10** (ทำจริงเครื่องเดียว · `FOR UPDATE SKIP LOCKED`) |

### 4. Health Check ตอน Login

| | BEFORE | AFTER |
|---|---|---|
| Round-trip ที่ต้องรอเรียงกัน | **4 คิว** | **1 คิว** (`Promise.allSettled`) |
| Realtime block login | **รอได้ถึง 8,000 ms** | **0 ms** (non-critical · ตรวจโดย `subscribeRealtime()` หลังเข้าระบบ) |

ตรวจในไฟล์: `'หมดเวลารอ 8 วินาที'` = **0 จุด**

### 5. Export Excel

| | BEFORE | AFTER |
|---|---|---|
| แหล่งไฟล์ | `cdn.jsdelivr.net` (425 KB) | **`assets/xlsx.bundle.js` จาก Local Server** (CDN เป็น fallback) |
| ต้องมีเน็ต | ใช่ | **ไม่** |
| กดครั้งที่ 2+ | อาจโหลดซ้ำ | **0** (cache `_xlsxPromise`) |
| โหลดตอน startup | ไม่ | ไม่ (lazy เหมือนเดิม) |

### 6. External origin ตอนเปิดระบบ

| | BEFORE (2 รอบก่อน) | AFTER |
|---|---|---|
| Google Fonts / jsdelivr / unpkg | 4 โดเมน · ~11 request | **0** |

---

## สิ่งที่ตรวจแล้ว "ดีอยู่แล้ว" — ไม่แก้ (ตามที่สั่ง: ห้ามแก้ถ้าเร็วอยู่แล้ว)

| ข้อที่สั่ง | ผลตรวจจาก Source |
|---|---|
| ห้ามมี N+1 | ✅ ไม่มี — ทุกจุดใช้ `.in()` chunk 100–200 · ตอนนี้เหลือ 1 RPC |
| Realtime 1 event ไม่ reload ทั้ง dataset | ✅ `_patchDocumentStatusCells()` patch เฉพาะเซลล์ · coalesce ด้วย `requestAnimationFrame` |
| รวม event burst | ✅ `_recountSoon()` debounce 1200 ms |
| ป้องกัน channel/listener ซ้ำ | ✅ `subscribeRealtime()` เรียก `sb.removeChannel(S._rt)` ก่อน subscribe ใหม่ทุกครั้ง |
| Search debounce ~200 ms | ✅ 200 ms (`S._searchTimer`) — คงไว้ ไม่ลด |
| ignore request เก่าเมื่อพิมพ์ใหม่ | ✅ `_statusRenderTok` + `S._viewReqToken[view]` ทิ้งผลที่มาช้า |
| กันกดซ้ำ / request ซ้อน | ✅ `S._viewLoadPromises[view]` (promise lock), `_jsInflight`/`_ssInflight`, `btn.disabled` ในปุ่มบันทึก/อัปโหลด, `inp.disabled` ตอนอัปโหลด |
| Cache | ✅ cache เฉพาะ `_shipSetsCache` (user map) · `_sfzUrlCache` (signed URL หมดอายุก่อน 2 นาที) · per-mode doc cache ที่ realtime patch ให้ — **ไม่ cache count/สถานะจน stale** · localStorage เก็บเฉพาะ session |
| `setInterval` | ✅ 0 ตัวทั้งไฟล์ |
| Virtual scroll / code splitting | ❌ **ยังไม่ทำ** ตามที่สั่ง — ต้องมีผลวัดก่อนว่า 100 rows เป็นคอขวดจริง |

---

## ผลทดสอบจริง

### SQL — PostgreSQL 16
| # | รายการ | ผล |
|---|---|---|
| 1 | รัน `010_perf_all_sfz.sql` `ON_ERROR_STOP=1` | ✅ rc=0 |
| 2 | **รันซ้ำรอบ 2** | ✅ rc=0 (idempotent) |
| 3 | Function ที่ได้ | ✅ `sfz_mode_counts`, `sfz_reset_expired_postponed`, `sfz_row_meta` |
| 4 | `sfz_mode_counts` · ข้อมูลทดสอบ 10 แถวครบทุกโหมด | ✅ `{all:10,new:2,received:1,postponed:2,tomorrow:1,advance:1,edit:1,completed_today:1}` ตรงกับ `_applyViewFilter` ทุกช่อง |
| 5 | `sfz_reset_expired_postponed` ครั้งที่ 1 / ครั้งที่ 2 | ✅ `count:1` / **`count:0`** — idempotent จริง · timeline 1 แถว · ข้อความตรงของเดิมทุกตัวอักษร |
| 6 | **`sfz_row_meta` กับเคสกรองครบทุกแบบ** | ✅ ข้ามแถวที่มีรูป (`sfz:`) · ข้าม `SYSTEM` · ข้าม note ว่าง · ข้ามผู้บันทึกที่ไม่ใช่ SHIPPING · เลือกแถวล่าสุดถูกต้องทั้ง 2 สาย · `att` นับได้ 3 ไฟล์ |

### EXE — รันจริงผ่าน Wine
| # | รายการ | ผล |
|---|---|---|
| 7 | `/__sfz_health` | ✅ `{"ok":true,"app":"shipping_fz","server":"local","mode":"single-exe"}` |
| 8 | `GET /` | ✅ 200 · 774,588 bytes · **10 ms** · MD5 ตรงกับ `index.html` |
| 9 | `GET /assets/xlsx.bundle.js` | ✅ 200 · 425,020 bytes · **6 ms** |
| 10 | `GET /config.js` | ✅ 200 · 982 bytes · 1 ms |
| 11 | RPC ทั้ง 3 อยู่ในไฟล์ที่เสิร์ฟจริง | ✅ `sfz_row_meta` / `sfz_mode_counts` / `sfz_reset_expired_postponed` พบครบ |
| 12 | JavaScript syntax | ✅ `node --check` ผ่าน |
| 13 | สมดุล `<div>` | ✅ 344 / 344 |

### ❌ ไม่ได้ทดสอบ — จึงไม่รายงานว่า PASS
เปิด EXE บน Windows · Login · โหลดรายการงาน · เปลี่ยนโหมด · Search · Realtime · แนบเอกสาร · ปิดงาน · Export Excel ปลายทาง · Console error · มือถือ
**ทั้งหมดต้องทดสอบบนเครื่องคุณกับ Supabase จริง**

---

## Fallback — ถ้ายังไม่ได้รัน SQL

ทั้ง 3 RPC มีสวิตช์ตรวจอัตโนมัติ (`_cntRpcOK` / `_resetRpcOK` / `_metaRpcOK`)
ถ้าเรียกไม่สำเร็จจะ **กลับไปใช้วิธีเดิมทันทีและไม่ลองซ้ำ** → ระบบไม่พัง ไม่มี error loop เพียงแต่จะไม่ได้ความเร็วที่เพิ่มขึ้น

---

## ยังไม่ได้ทำ — และเหตุผล

| ข้อ | สถานะ |
|---|---|
| **`pg_trgm` + GIN index สำหรับ Search** | ❌ ยังไม่ทำ — คุณสั่งว่า "ตรวจ index จริงก่อน" แต่ผม query ฐานข้อมูลคุณไม่ได้ · รัน 3 คำสั่งด้านล่างแล้วส่งผลมา ผมจะเขียน index ให้ตรงของจริง |
| **Virtual Scroll / Code Splitting / Critical CSS** | ❌ ยังไม่ทำ — ตามที่คุณสั่งว่าต้องวัดก่อนว่าเป็นคอขวดจริง |

```sql
select extname from pg_extension where extname='pg_trgm';
select indexname, indexdef from pg_indexes where tablename='sfz_documents';
select count(*) from public.sfz_documents;
```

---

## ลำดับติดตั้ง

1. รัน **`010_perf_all_sfz.sql`** ใน Supabase SQL Editor → ท้ายไฟล์มี query ตรวจว่าได้ function ครบ
2. เปลี่ยน `SHIPPING FZ.exe` เป็นตัวใหม่
3. เปิดใช้งาน · ถ้ายังไม่รัน SQL ระบบยังทำงานปกติด้วย fallback

### วิธีวัดจริงเพื่อพิสูจน์ (5 นาที)
- F12 → **Network** → กรอง `supabase.co` → เปิดโหมด 🔵 ดำเนินตรวจปล่อย → **ต้องเห็น ~2 request** (เดิม 4) และมี `rpc/sfz_row_meta`
- สลับโหมดไปมา → badge refresh ต้องเห็น `rpc/sfz_mode_counts` **1 ครั้ง** (เดิม 8 request `sfz_documents?select=id`)
- F12 → **Lighthouse** → Mobile / Desktop → ส่งผลมา ผมจะแก้คอขวดที่เหลือให้ตรงจุด
