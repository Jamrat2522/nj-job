# NJ HR V2 — ชุดไฟล์สำหรับอัปโหลดขึ้น GitHub (ไม่เกิน 100 ไฟล์)

Build ปัจจุบัน: **`njhr-v2-9ff9d43b`**
จำนวนไฟล์ในชุดนี้: **97 ไฟล์** (หน้าเว็บ GitHub อัปโหลดได้ครั้งละ 100 ไฟล์)

---

## 1. ชุดนี้ต่างจากชุดเต็มอย่างไร

ชุดเต็ม (`nj-hr-v2-github.zip`) มี 337 ไฟล์ ซึ่งเกินขีดจำกัดการอัปโหลดผ่านหน้าเว็บ GitHub
ชุดนี้จึงย้าย 3 โฟลเดอร์ที่มีไฟล์จำนวนมากไปเก็บเป็นไฟล์บีบอัดใน `_archive/`
**ไม่มีไฟล์ใดถูกลบทิ้ง** — ทุกไฟล์ยังอยู่ครบในไฟล์บีบอัด

| ไฟล์บีบอัด | เนื้อหา | จำนวนไฟล์ข้างใน |
|---|---|---:|
| `_archive/supabase-sql.zip` | `supabase/` + `supabase-new/` — SQL ทั้งหมด | 129 |
| `_archive/harness.zip` | `harness/` — ชุดทดสอบทั้งหมด | 96 |
| `_archive/docs.zip` | `docs/` + `thaitest.js` — เอกสารและรายงาน | 27 |

แตกไฟล์เหล่านี้ที่ราก Repo เมื่อต้องการใช้งาน

```bash
cd nj-hr-v2
unzip _archive/supabase-sql.zip
unzip _archive/harness.zip
unzip _archive/docs.zip
```

`.gitignore` ถูกเพิ่มบรรทัดยกเว้นให้ `_archive/*.zip` ถูกเก็บใน Git ได้
(ของเดิมตั้ง `*.zip` ไว้ทั้งหมด) และยังคง ignore `rollback/` · `node_modules/` เหมือนเดิม

**ถ้าต้องการประวัติ Git ครบทุก commit** ให้ใช้ `nj-hr-v2-github.zip` ซึ่งมีโฟลเดอร์ `.git`
แล้ว `git push` ขึ้น Remote แทนการอัปโหลดผ่านหน้าเว็บ

---

## 2. โครงสร้างในชุดนี้

| ส่วน | ไฟล์ | บทบาท |
|---|---:|---|
| ไฟล์ที่เว็บใช้จริง | 39 | `index.html` · `config.js` · `sw.js` · `styles.css` · `mobile.css` · `asset-manifest.js` · `runtime/` · `views/` · `compat/` · `assets/` · `face.*` · `master-salary.js` · `report-template.js` · `netlify.toml` |
| ต้นทาง | 39 | `src/*.js` · `src/css/*.css` · `src/README.md` |
| ต้นทาง runtime | 1 | `runtime-src/namespace.js` |
| Edge Function | 6 | `edge-functions/` |
| เครื่องมือ build | 4 | `build.js` · `package.json` · `package-lock.json` · `verify-netlify.sh` |
| ค่า Checksum | 3 | `DEPLOY_MD5.txt` · `WEB_FILES_CHECKSUM.md` · `ZIP_MD5.txt` |
| ไฟล์บีบอัด | 3 | `_archive/*.zip` |
| อื่น ๆ | 2 | `README.md` · `.gitignore` |

**ไฟล์ที่เว็บใช้จริงทั้ง 39 ไฟล์ถูกเก็บไว้ในรีโปโดยเจตนา** เพราะ `netlify.toml` ตั้ง
`publish = "."` และ `command = ""` — Netlify ไม่ build ให้ จึงต้องมีไฟล์ที่ build เสร็จแล้วในรีโป

---

## 3. วิธี build ใหม่

```bash
npm ci                 # ติดตั้ง terser · clean-css · jsdom
node build.js          # สร้างไฟล์ deploy จาก src/ และเขียน Build ID ให้อัตโนมัติ
node build.js --check  # ตรวจว่าไฟล์ deploy ตรงกับ src/ (ไม่เขียนทับ)
```

`build.js` เขียน Build ID ลง `config.js` · `sw.js` · `index.html` · `asset-manifest.js`
ให้เองทุกครั้ง ไม่ต้องแก้ด้วยมือ

## 4. วิธีทดสอบ

แตก `_archive/harness.zip` ก่อน แล้วรัน

```bash
node harness/check-all-js.js          # ตรวจ syntax · manifest · deps · Build ID · MD5
node harness/dash_leave_test.js .     # การ์ด "คำขอลาล่าสุด" บน Dashboard
node harness/dash_leave_xcheck.js .   # เทียบ Dashboard กับ REPORT ลางาน
node harness/report_menu_test.js .    # REPORT ลางาน / REPORT OT
node harness/desk_table_test.js .     # ตารางเดียวหน้าคอม OT / ลางาน
```

## 5. ฐานข้อมูล

แตก `_archive/supabase-sql.zip` แล้วรันไฟล์ SQL บน Supabase Dashboard → SQL Editor
ลำดับการรันและสถานะของแต่ละไฟล์อยู่ใน `supabase/00_INDEX.md` และ `supabase/00_READ_FIRST.md`

ไฟล์ล่าสุดที่ต้องรันคือ `supabase-new/S1_report_menu.sql`
(สร้าง `njhr_rpt_leave_list` · `njhr_rpt_ot_list` · `njhr_rptmenu_guard` — เพิ่มอย่างเดียว)
ถ้ายังไม่รัน เมนู REPORT ลางาน / REPORT OT และการ์ด "คำขอลาล่าสุด" บน Dashboard
จะขึ้นข้อความให้ไปรัน SQL ก่อน

## 6. ความปลอดภัย

`config.js` มีเฉพาะค่า Public ที่เบราว์เซอร์อ่านได้อยู่แล้ว
(`NJHR_SUPABASE_URL` และ publishable key) จึงเก็บใน Git ได้

**ห้ามใส่ลง Git เด็ดขาด**: Service Role Key · Database Password · Secret Key ·
Access Token · Refresh Token · JWT Secret
