# P3_CLEAN_REBUILD_REPORT

ทดสอบ Build ใหม่จาก `hr-v2-source.zip` ในโฟลเดอร์เปล่า (ไม่มี `node_modules` ติดมา) — **รันจริง ไม่ใช่การอ้าง**

## 1. สภาพแวดล้อม

| รายการ | ค่า |
|---|---|
| Node | `v22.22.2` |
| npm | `10.9.7` |
| OS | Ubuntu 24.04.4 LTS |
| Kernel | Linux 6.18.5-fc-v18 |
| Chromium (สำหรับชุดทดสอบ) | `/opt/google/chrome/chrome` |

## 2. ขั้นตอนและผล

```bash
unzip -q hr-v2-source.zip          # 546 ไฟล์
unzip -q hr-v2-deploy.zip          #  35 ไฟล์
cd hr-v2-source
npm ci                             # added 12 packages · audited 13 · found 0 vulnerabilities
npm run check                      # CHECK PASSED
rm -rf runtime/shared views/employees views/attendance views/leave views/ot
rm -f  runtime/*.js views/dashboard.js compat/*.js asset-manifest.js styles.css mobile.css
node build.js                      # Build eed72c68
node build.js --check              # ตรงกัน  ไฟล์ deploy = src/  (build eed72c68)
```

| ขั้น | ผล |
|---|---|
| แตก `hr-v2-source.zip` | **PASS** — 546 ไฟล์ |
| แตก `hr-v2-deploy.zip` | **PASS** — 35 ไฟล์ |
| `unzip -t` ทั้งสอง ZIP | **PASS** — No errors detected |
| `npm ci` | **PASS** — exit 0 · 12 packages · 0 vulnerabilities |
| `npm run check` (syntax + duplicate + manifest + build id + md5) | **PASS** — exit 0 · ตรวจ DEPLOY_MD5 35 ค่า |
| ลบ Output เดิมทั้งหมดแล้ว `node build.js` | **PASS** — Build `eed72c68` |
| `node build.js --check` | **PASS** — ตรงกัน |
| จำนวนไฟล์ Output | **35 ไฟล์** |

## 3. เทียบผลลัพธ์กับ Deploy ZIP

```
MATCH 35 · DIFF 0
```

**ตรงกันทุกไฟล์แบบ byte-for-byte** — ไม่มีไฟล์ใดต่างจาก Timestamp หรือสาเหตุอื่น
Build เป็น deterministic เพราะ `build.js` ไม่ฝังวันเวลาลงใน Output และ Build ID มาจาก md5 ของเนื้อไฟล์เท่านั้น

## 4. ตรวจ `DEPLOY_MD5.txt` กับไฟล์ที่แตกจาก Deploy ZIP

```
md5sum -c DEPLOY_MD5.txt  →  35/35 OK
```

## 5. Boot จริงจาก Deploy ZIP ที่แตกแล้ว

```
ZIPTEST4 [http]  CFG_OK=true · brand=NJ LOGISTIC · loginForm=true · NJHR_DIAG=function · error: ไม่มี
ZIPTEST4 [file]  CFG_OK=true · SW=false · brand=NJ LOGISTIC · error: ไม่มี
```

ทำงานได้ทั้ง `http://` และ `file://` ไม่มี console error

## 6. ตรวจความสะอาดของ Deploy ZIP

ค้นหา `src/` `harness/` `rollback/` `node_modules/` `supabase*/` `edge-functions/` `fixtures/`
และไฟล์ `build.js` `package*.json` `*.md` `*.sql` `app.js` `*.map` `fixtures.js` `*.xlsx`

```
(ไม่พบรายการใดเลย)
```

## 7. เนื้อหา Source ZIP

| ต้องมี | สถานะ |
|---|---|
| Source (`src/` 31 ไฟล์ + `src/css/`) | มี |
| Build Script (`build.js`) | มี |
| `package.json` + `package-lock.json` | มี |
| Runtime Source (`runtime-src/namespace.js`) | มี |
| View Source + Compatibility Source | มี |
| Harness (27 สคริปต์ รวม `check-all-js.js` `p3_feature.js` `p3_perf.js` `p3_analyze.js`) | มี |
| รายงานทั้งหมด (`P3_*.md`) | มี |
| Rollback (`before_runtime_dashboard_split` · `before_feature_split_p3` · `before_p3_completion_fix` + ZIP ของแต่ละรอบ) | มี |
| วิธี Build / Deploy / Verify / Rollback | มีใน `P3_COMPLETION_REPORT.md` และ `ROLLBACK.md` แต่ละรอบ |
| `DEPLOY_MD5.txt` (35 ค่า) | มี |

| ยังไม่มี | หมายเหตุ |
|---|---|
| `harness/fixtures/*.xlsx` | **NOT DONE** — ไฟล์ทดสอบ Import ตามข้อ 12.1 ยังไม่ได้สร้างในรอบนี้ |
