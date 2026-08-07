# SHIPPING FZ — คอลัมน์ "การจัดการ" เฉพาะโหมด 🔵 ดำเนินตรวจปล่อย

| | |
|---|---|
| `index.html` MD5 | `9efac1da172032ef6aa44d95c7578b5d` |
| `SHIPPING FZ.exe` SHA-256 | `9dcff85b2c6a3abc47ed9154c9cf42811bc673da2f4f0a6c99e182978c1aeb95` |
| ขนาด EXE | 811,006 bytes |

---

## 1. ตรวจ Source จริงก่อนแก้ (ไม่ได้เดา)

| สิ่งที่ต้องรู้ | ค่าจริงในระบบ | หลักฐาน |
|---|---|---|
| Status ของโหมดนี้ | `'RECEIVED'` | บรรทัด 1283 `RECEIVED: { title:'🔵 ดำเนินตรวจปล่อย', test:d=>d.doc_status==='RECEIVED' }` |
| ตัวแปรโหมดปัจจุบัน | `S.view` (ค่า `'RECEIVED'`) | บรรทัด 1101 `DOC_MODES` |
| Route / Tab | `menu-item` + `tab('RECEIVED',…)` | บรรทัด 1792, 1841 |
| Function render แถว | `docRow(d)` | บรรทัด 1982 |
| Function ปุ่มการจัดการ | `_saReceivedActions(d)` | บรรทัด 1988 |
| Container ตาราง | `<table class="tbl tbl-doc tbl-recv">` | บรรทัด 2083 |
| Modal เลื่อน | `openPostponePrompt(id)` → status `'POSTPONED'` | มีอยู่เดิม |
| Modal ปิดงาน | `openClearedPrompt(id)` → status `'CLEARED'` | มีอยู่เดิม |
| ลบงาน | `docDelete(id)` + `canDeleteDoc(d)` | มีอยู่เดิม |
| Storage bucket | `shipping-fz-attachments` (`STORAGE_BUCKET`) | มีอยู่เดิม |
| ตารางไฟล์แนบ | `sfz_attachments` (`ATTACH_TABLE`) | มีอยู่เดิม |
| Signed URL | `_sfzSignPaths()` / `_sfzOpenRef()` | มีอยู่เดิม |

**ไม่ได้สร้าง status / bucket / ตารางใหม่แม้แต่ตัวเดียว**

---

## 2. การแยก Scope

```js
function isInProgressReleaseMode(d){
  return S.view === 'RECEIVED' && !!d && d.doc_status === 'RECEIVED';
}
function _saReceivedActions(d){
  if(isInProgressReleaseMode(d)) return renderInProgressReleaseActions(d);
  return _saReceivedActionsOriginal(d);      // โค้ดเดิมทั้งก้อน ไม่ถูกแตะ
}
```

- ตรวจด้วย **Status Code จริง** (`'RECEIVED'`) ไม่ได้ตรวจจากข้อความภาษาไทย
- `_saReceivedActionsOriginal` = ฟังก์ชันเดิมทั้งหมด เปลี่ยนแค่ชื่อ ไม่แก้เนื้อใน
- โหมด `all` / `NEW` / `COMPLETED_TODAY` / `POSTPONED` / `TOMORROW` / `ADVANCE` / `EDIT` ไม่ผ่านเงื่อนไขนี้เลย → ใช้ปุ่มเดิม 100%
- ไม่มีการ `addEventListener` ใหม่ ใช้ `onclick` inline แบบเดียวกับโค้ดเดิม → ไม่มี event ซ้ำซ้อน

---

## 3. ปุ่มใหม่ 4 ปุ่ม

| ปุ่ม | สี | เรียกฟังก์ชัน | สถานะปลายทาง |
|---|---|---|---|
| 📅 เลื่อน | ส้ม `#EA580C` | `openPostponePrompt(id)` (เดิม) | `POSTPONED` (เดิม) |
| 📎 แนบเอกสาร | ม่วง `#7C3AED` | `openAttachDocs(id)` (ใหม่) | — |
| ✅ ปิดงาน | เขียว `#0EA672` | `ripCloseJob(id)` → `openClearedPrompt(id)` (เดิม) | `CLEARED` (เดิม) |
| 🗑️ ลบ | แดง `#DC2626` | `docDelete(id)` (เดิม) | ตามวิธีเดิม |

**ปุ่มที่หายไปจากโหมดนี้:** 📋 งาน · 🖥️ ระบบ · เมนู ⋮ — ตามที่สั่ง
**ปุ่มลบ** แสดงเฉพาะเมื่อ `canDeleteDoc(d)` = สิทธิ์เดิม (โหมดนี้เฉพาะ SUPER_ADMIN) ไม่ได้เพิ่มสิทธิ์ใหม่

### ปิดงาน — เงื่อนไขไฟล์แนบ
- `_ripLoadAttachCounts(rows)` นับไฟล์จาก `sfz_attachments` เฉพาะแถวที่แสดงอยู่ (แบ่ง chunk 100)
- ยังไม่มีไฟล์ → ปุ่มเป็นสถานะจาง (`is-disabled`) · กดแล้วขึ้น **"กรุณาแนบเอกสารก่อนปิดงาน"**
- มีไฟล์ ≥1 → ปุ่มใช้งานได้ · `openClearedPrompt` ทำ confirm + บันทึกเวลา/ผู้ทำ/Timeline ตามเดิม
- อัปเดตปุ่มด้วย **DOM patch เฉพาะปุ่ม** (`_ripPatchButtons`) ไม่ re-render ทั้งตาราง

### Modal แนบเอกสาร
รองรับหลายไฟล์ · แสดงชื่อไฟล์ + ขนาด + ผู้แนบ · แสดงความคืบหน้าอัปโหลด · เปิดดูผ่าน Signed URL เดิม ·
ลบไฟล์ได้เฉพาะ `isAdmin()` · เขียน Timeline (`logDoc`) และ Audit (`sfz_audit_logs` ผ่าน `AUDIT_ACTIONS`) ·
ไม่ reload ทั้งหน้า · `input` ถูก disable ระหว่างอัปโหลดกันกดซ้ำ

---

## 4. CSS

เพิ่มเฉพาะ selector ที่ scope แล้ว: `.sfz-rip …` และ `#rip-att …`
**ไม่มี** selector กว้างอย่าง `button`, `table`, `.action-button`, `.management`, `.row-act`
มือถือ (`max-width:768px` / `pointer:coarse`) → 2 ปุ่มต่อแถว สูง 44px ไม่ซ่อนในเมนู ⋮

---

## 5. ไฟล์ที่แก้จริง

**ไฟล์เดียว: `index.html`**

| การเปลี่ยนแปลง | จำนวน |
|---|---|
| บรรทัดเพิ่ม | 163 |
| บรรทัดเดิมที่ถูกแก้ | **3** |

บรรทัดเดิมที่ถูกแก้ทั้ง 3 บรรทัด:
1. `const AUDIT_ACTIONS = [...]` — เพิ่ม `'attachment'`, `'attachment_deleted'`
2. `if(S.view==='RECEIVED') _loadStatusForRows(rows);` — เพิ่มการเรียก `_ripLoadAttachCounts(rows)`
3. `_loadStatusForRows(rows);  // #5` — เพิ่มการเรียกเดียวกัน (มี guard `S.view==='RECEIVED'`)

ทั้ง 2 และ 3 มี guard `S.view==='RECEIVED'` → โหมดอื่นไม่เกิด query เพิ่มแม้แต่ครั้งเดียว

diff ฉบับเต็มอยู่ในไฟล์ `index_html.diff`

**ไม่ได้แตะ:** HTML อื่น · เว็บไซต์อื่น · CSS/JS ส่วนกลาง · Supabase config · Launcher (`single.c`) · SQL

---

## 6. ทดสอบแล้วจริง

| # | รายการ | ผล |
|---|---|---|
| 1 | JavaScript syntax | ✅ `node --check` ผ่าน |
| 2 | สมดุล `<div>` | ✅ 346 / 346 |
| 3 | สมดุล CSS brace | ✅ เพิ่ม 14 `{` / 14 `}` สมดุลเท่าเดิม |
| 4 | บรรทัดเดิมถูกแตะน้อยที่สุด | ✅ 3 บรรทัด (ยืนยันด้วย `diff`) |
| 5 | Rebuild EXE | ✅ 811,006 bytes · PE32+ GUI |
| 6 | **EXE เสิร์ฟไฟล์ใหม่จริง** | ✅ รันผ่าน Wine → `GET /` ได้ 374,644 bytes · MD5 ตรงกับ `index.html` ใหม่เป๊ะ |
| 7 | โค้ดใหม่อยู่ในไฟล์ที่เสิร์ฟ | ✅ พบ `isInProgressReleaseMode` / `renderInProgressReleaseActions` / `openAttachDocs` / `ripCloseJob` / `sfz-rip` รวม 18 จุด |
| 8 | Health endpoint | ✅ `{"ok":true,"app":"shipping_fz",...}` |

---

## 7. ❌ สิ่งที่ผมทดสอบไม่ได้ — ไม่รายงานว่าผ่าน

| ข้อที่สั่ง | สถานะ |
|---|---|
| Screenshot โหมดดำเนินตรวจปล่อยหลังแก้ | ❌ **ทำไม่ได้** — ไม่มีเบราว์เซอร์และไม่มีหน้าจอ |
| Screenshot โหมดอื่นเพื่อยืนยันว่าไม่เปลี่ยน | ❌ **ทำไม่ได้** |
| ทดสอบกดปุ่มจริง (เลื่อน / แนบ / ปิดงาน / ลบ) | ❌ **ทำไม่ได้** — ต่อ Supabase project ของคุณไม่ได้ |
| ทดสอบ Permission จริง 3 role | ❌ **ทำไม่ได้** — ตรวจได้แค่ระดับโค้ดว่าเรียก `canDeleteDoc()` / `isAdmin()` เดิม |
| ยืนยันว่าโหมดอื่นหน้าตาไม่เปลี่ยน | ⚠️ ยืนยันได้ระดับโค้ดเท่านั้น (โหมดอื่นไม่เข้าเงื่อนไข `isInProgressReleaseMode`) |

**ผมไม่ทำ screenshot ปลอม**

---

## 8. เรื่องที่ต้องตัดสินใจ — "ปิดงาน" หมายถึงสถานะไหน

Flow เดิมของระบบคือ `NEW → RECEIVED → CLEARED → COMPLETED`

ผมเลือกให้ปุ่ม **✅ ปิดงาน** เรียก `openClearedPrompt()` → สถานะ **`CLEARED` (ตรวจปล่อยเสร็จ)**
เพราะเป็น transition เดิมที่ออกจาก `RECEIVED` ได้ตรง ๆ

ถ้าคุณต้องการให้ปุ่มนี้ข้ามไปเป็น **`COMPLETED` (ปล่อยเสร็จ/ปิดงานสมบูรณ์)** เลย
สั่งได้ — แก้บรรทัดเดียวใน `ripCloseJob()` แต่จะเป็นการข้ามสถานะ `CLEARED` ซึ่งเปลี่ยน flow เดิม
ผมจึงไม่ทำเองโดยไม่ถาม

---

## 9. ทดสอบฝั่งคุณ

1. เปิด `SHIPPING FZ.exe` → Login → เข้าโหมด 🔵 ดำเนินตรวจปล่อย
   → ต้องเห็น **4 ปุ่ม** ไม่มี 📋 งาน / 🖥️ ระบบ / ⋮
2. กด 📎 แนบเอกสาร → อัปโหลด 2–3 ไฟล์ → ปุ่ม ✅ ปิดงาน ต้องเปลี่ยนจากจางเป็นใช้งานได้ และขึ้นจำนวนไฟล์
3. กด ✅ ปิดงาน ก่อนแนบไฟล์ → ต้องขึ้น "กรุณาแนบเอกสารก่อนปิดงาน"
4. สลับไปโหมดอื่นทุกโหมด → ปุ่มต้องเหมือนเดิมทุกประการ
5. ทดสอบบนมือถือ → 2 ปุ่มต่อแถว กดง่าย
