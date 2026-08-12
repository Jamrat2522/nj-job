# BILLING — REAL SYSTEM BACKUP (Layer 2 · Independent Backup)

Pipeline: `Supabase Production → GitHub Actions → Backup → Verify → Google Drive → Docker Restore Test`

ทุกสคริปต์ในชุดนี้ **ทดสอบจริงแล้วบน PostgreSQL 16.14** (ผลอยู่ท้ายไฟล์) ไม่ได้เดา CLI syntax

---

## 1. โครงสร้างไฟล์ใน Private Repo

```
.github/workflows/billing-backup.yml
scripts/collect_metrics.sh
scripts/backup.sh
scripts/verify.sh
scripts/restore_test.sh
scripts/upload_gdrive.sh
sql/billing_backup_runs.sql        ← ยังไม่รัน รออนุมัติ
.gitignore                          ← กัน dump หลุดเข้า repo
```

**`.gitignore` ต้องมีอย่างน้อย:**
```
backup-out/
*.dump
*.sql.sha256
*.dump.sha256
metrics.json
backup.json
verification.json
restore_test.json
```

---

## 2. GitHub Actions Secrets (3 ตัว)

Settings → Secrets and variables → Actions → New repository secret

| Secret | ค่าที่ใส่ | หาได้จาก |
| --- | --- | --- |
| `SUPABASE_DB_URL` | connection string เต็มพร้อมรหัสผ่าน | Supabase Dashboard → Connect → **Session pooler** (URI) |
| `GDRIVE_SA_JSON` | เนื้อหา JSON ของ Service Account **ทั้งไฟล์** | Google Cloud Console → IAM → Service Accounts → Keys |
| `GDRIVE_ROOT_FOLDER_ID` | ID โฟลเดอร์ปลายทางใน Drive | URL ของโฟลเดอร์: `drive.google.com/drive/folders/<ID>` |

### ⚠ ทำไมต้องใช้ Session pooler ไม่ใช่ Direct connection

GitHub Actions runner เป็น **IPv4 เท่านั้น** ส่วน `db.<ref>.supabase.co` ปัจจุบันเป็น IPv6-only ในหลาย project
→ ต้องคัดลอกจากแท็บ **Session pooler** (host ลงท้าย `pooler.supabase.com`, user รูปแบบ `postgres.<project-ref>`)

> ถ้าใช้ Direct แล้วเชื่อมไม่ได้ อาการจะเป็น connection timeout — เปลี่ยนเป็น Session pooler

### ⚠ Google Drive Service Account

Service Account ไม่มี Drive storage ของตัวเอง → ต้อง **แชร์โฟลเดอร์ปลายทางให้อีเมลของ Service Account** (สิทธิ์ Editor) ก่อน ไม่งั้นอัปโหลดจะ 404

---

## 3. ยืนยัน Schedule

| ตั้งค่า | ค่า |
| --- | --- |
| Cron ใน workflow | `30 10 * * *` (UTC) |
| เวลาไทย | **17:30 Asia/Bangkok** |
| DST | ไทยไม่มี → เวลาคงที่ตลอดปี ไม่ต้องแก้ 2 ครั้ง/ปี |
| Manual run | Actions → Billing Daily Backup → Run workflow |

> GitHub cron อาจดีเลย์ 5–20 นาทีในช่วง peak — เป็นข้อจำกัดของ GitHub ไม่ใช่ bug

---

## 4. ปลายทางใน Google Drive

```
Billing/2026/08/11/173015/
  ├── schema.sql              ← DDL ครบ: table, column, default, sequence,
  │                             constraint, PK/FK/unique, function, RPC,
  │                             trigger, view, index, RLS, policy, grant
  ├── schema.sql.sha256
  ├── data.dump               ← ข้อมูลทั้งหมด (custom format · compress 9)
  ├── data.dump.sha256
  ├── backup.json             ← metadata (§12)
  ├── metrics.json            ← row count + financial aggregate
  ├── verification.json       ← ผล 8 ข้อ
  └── restore_test.json       ← PASS / FAIL
```

**ไม่มี dump เก็บใน Git repo** — ไฟล์อยู่ใน runner ชั่วคราวและถูก `rm -rf` ทุกครั้งใน step สุดท้าย

---

## 5. Verification 8 ข้อ (§14)

| # | ตรวจอะไร | Critical | ไม่ผ่าน = |
| --- | --- | --- | --- |
| 1 | `pg_dump` exit code = 0 ทั้ง schema และ data | ✅ | FAILED |
| 2 | `schema.sql` มีอยู่จริง | ✅ | FAILED |
| 3 | `data.dump` มีอยู่จริง | ✅ | FAILED |
| 4 | ขนาดไฟล์ > 0 ทั้งคู่ | ✅ | FAILED |
| 5 | `sha256sum -c` ผ่านทั้ง 2 ไฟล์ | ✅ | FAILED |
| 6 | critical tables อยู่ครบ **ทั้งใน schema.sql และใน TOC ของ data.dump** | ✅ | FAILED |
| 7 | row count ถูกบันทึกครบ | ⚠ | WARNING ถ้ามีตาราง count=0 |
| 8 | function/RPC/policy/RLS/trigger/index/grant อยู่ใน schema backup | ✅ | FAILED |

**`SUCCESS` เกิดขึ้นได้เมื่อผ่านครบ 8 ข้อเท่านั้น** — มี WARNING 1 ข้อ → status = `WARNING` · มี FAIL 1 ข้อ → status = `FAILED` และ job แดง

---

## 6. Restore Test — Docker (§20)

**Safety guard ในสคริปต์:** ถ้า `TARGET_URL` มีคำว่า `supabase.co` / `supabase.com` / `pooler.` → **ปฏิเสธและ exit 1 ทันที** ก่อนแตะอะไรทั้งสิ้น (ทดสอบแล้ว)

ตรวจ 8 มิติหลัง restore:

1. schema restore ไม่มี ERROR
2. data restore exit = 0
3. **row count** ตรงกับ `metrics.json` ทุกตาราง
4. **financial aggregate** ตรงทุกคอลัมน์ (tolerance 0.005)
5. functions / RPC ครบ
6. triggers ครบ
7. indexes ครบ
8. **RLS + policies ครบ** — โดยเฉพาะ `app_users` เทียบจำนวน policy กับ backup

ผลลัพธ์: `PASS` / `FAIL` เท่านั้น · `NOT TESTED` = ไม่ได้รันสคริปต์

---

## 7. ห้ามเดา column (§16)

`collect_metrics.sh` **ไม่มี column name ฝังตายในโค้ด**
สร้าง SQL ตอน runtime จาก `information_schema.columns` → SUM เฉพาะคอลัมน์ที่มีจริงและเป็น numeric
ตารางที่ไม่มีคอลัมน์การเงินเลย (เช่น `app_users`) จะได้ `"sums": {}` ไม่ error

`CRITICAL_TABLES` ตอนนี้ตั้งไว้ 3 ตารางเป็นค่าเริ่มต้น — **จะขยายหลัง PHASE 1/2 (Inventory) ยืนยัน billing table อื่นแล้ว** แก้ที่ `env:` ใน workflow ไม่ต้องแตะสคริปต์

---

## 8. Version compatibility

`backup.sh` อ่าน `SHOW server_version_num` แล้วเทียบกับ `pg_dump --version`
ถ้า `pg_dump` เก่ากว่า server → **หยุดทันที exit 1** ไม่ยอม dump ครึ่ง ๆ กลาง ๆ

`PG_MAJOR` ตั้งค่าเริ่มต้น `17` เปลี่ยนได้ตอน manual run

---

## 9. Secret hygiene (§11)

- ทุก secret มาจาก GitHub Actions Secrets → env var → GitHub มาสก์ใน log อัตโนมัติ
- `rclone` ใช้ **env-var backend config** (`RCLONE_CONFIG_GD_*`) → **ไม่มี `rclone.conf` เขียนลงดิสก์** (ยืนยันกับ rclone v1.68.2 แล้ว)
- `backup.json` / `metrics.json` / `verification.json` **ไม่มี** connection string, password, token
- ไม่มี `set -x` ในสคริปต์ใด
- `restore_test.sh` ใช้รหัส `testonly` กับ container ชั่วคราวที่ถูกลบทิ้งทุกครั้ง

---

## 10. ผลทดสอบจริง (PostgreSQL 16.14 · fixture 8,120 rows)

```
→ server major=16 · pg_dump major=16
✅ 1_exit_code · 2_schema_exists · 3_data_exists · 4_file_size
✅ 5_checksum · 6_critical_tables · 7_row_counts · 8_logic_objects
═══ STATUS = SUCCESS (pass=8 warn=0 fail=0) ═══

RESTORE TEST
✅ schema restore ไม่มี ERROR      ✅ data restore exit=0
✅ service_charge_records: 5000     ✅ advance_charge_records: 3000
✅ app_users: 120
✅ sum ทุกคอลัมน์ตรง (service_charge 21,961,500 · total_amount 29,674,500 ฯลฯ)
✅ functions=3  triggers=1  policies=3  RLS=1  indexes=9
✅ app_users policies: backup=3 restored=3 · RLS=t
═══ RESTORE TEST = PASS (pass=9 fail=0) ═══
```

**Negative test ผ่านครบ 3 ข้อ:**

| ทดสอบ | ผล |
| --- | --- |
| แก้ไข `data.dump` 1 ไบต์ | checksum FAIL → status `FAILED` exit 1 ✅ |
| ชี้ `TARGET_URL` ไป supabase.co | ปฏิเสธ exit 1 ก่อนแตะ DB ✅ |
| ลบ 49 แถวหลัง restore | ตรวจพบ `src=5000 restored=4951 MISMATCH` ✅ |

---

## 11. ลำดับการติดตั้ง

1. สร้าง Private Repo + วางไฟล์ตามโครงสร้างข้อ 1
2. ใส่ Secrets 3 ตัว (ข้อ 2)
3. แชร์โฟลเดอร์ Drive ให้ Service Account (Editor)
4. **Manual run ก่อน** — Actions → Run workflow
5. ตรวจ Job Summary: `verification_status` และ `restore_test_status`
6. ตรวจไฟล์ใน Drive ครบ 8 ไฟล์
7. ปล่อยให้ schedule 17:30 ทำงานเอง

---

## 12. ยังไม่ได้ทำ (ต้องรอ PHASE 1 = Production access)

- `SCHEMAS` ตอนนี้ = `public` เท่านั้น — ยังไม่ยืนยันว่ามี schema อื่นที่ต้อง backup
- `REQUIRED_FUNCS` ว่างอยู่ — ยังไม่ยืนยันว่า RPC ตัวไหนมีจริงใน Production
- `CRITICAL_TABLES` = 3 ตาราง — ยังไม่ได้ทำ Inventory (§5)
- Storage bucket — ยังไม่ยืนยันว่ามีหรือไม่ → `NOT VERIFIED`
- Managed Backup / Plan / PITR → `NOT VERIFIED`
- `billing_backup_runs` → SQL เตรียมไว้แล้ว **ยังไม่รัน รออนุมัติ**
