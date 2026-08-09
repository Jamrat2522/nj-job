# HR V2 — CHANGELOG

## Role Consolidation — เสร็จสิ้น (ฐานข้อมูล)

**ผลลัพธ์**

```
USER        : 105
ADMIN       :   4
SUPER_ADMIN :   2
รวม         : 111
```

**Mapping ที่เกิดขึ้น**

| Role เดิม | Role ใหม่ | บัญชี |
|-----------|-----------|-------|
| `USER` | `USER` | 95 |
| `ACCOUNT` | **`USER`** | 9 |
| `EMPLOYEE` | **`USER`** | 1 |
| `ADMIN` | `ADMIN` | 4 |
| `SUPER_ADMIN` | `SUPER_ADMIN` | 2 |

**ยืนยันว่าไม่กระทบแอปอื่น** — เทียบก่อน/หลังแล้วเหมือนเดิมทุกค่า

```
amend:user 104 · amend:admin 6 · amend:super_admin 2
advance:USER 92 · advance:ACCOUNT 11 · advance:ADMIN 7 · advance:SUPER_ADMIN 2
billing:user 9 · billing:admin 2 · billing:admin_mid 1
transport:user 9 · transport:super_admin 2
timeline:SUPER_ADMIN 3 · pdf:super_admin 1
```

`advance:ACCOUNT 11` และ `billing:admin_mid 1` ยังอยู่ครบ — พิสูจน์ว่าเงื่อนไข `app_code = 'salary'`
ในทุก `UPDATE` ทำงานถูกต้อง และ **ไม่ได้แตะ enum `user_role`**

---

## Pre-migration Backup — พบแล้ว

ตรวจฐานข้อมูลครบทุกแหล่งแล้วพบตารางสำรองก่อนแปลง **2 ตัว**

| ตาราง | `USER` | `ACCOUNT` | `ADMIN` | `SUPER_ADMIN` | รวม |
|-------|--------|-----------|---------|----------------|-----|
| `njhr_appusers_backup_20260727` | 96 | **9** | 4 | 2 | 111 |
| `njhr_bk_app_users_20260802` | 96 | **9** | 4 | 2 | 111 |

ระบุบัญชีที่เคยเป็น `ACCOUNT` ได้ครบทั้ง 9 รายการ · ทุกบัญชี `is_active = true` และผูกพนักงานครบ

**ผลกระทบจริงมีเพียง 1 บัญชี** — มี session ภายใน 90 วันแค่รายเดียว อีก 8 รายไม่ได้เข้าใช้งานเลย

Migration รันเมื่อ `2026-08-05 10:15:37 UTC`

### แก้ข้อความที่เคยบันทึกผิด

CHANGELOG ฉบับก่อนหน้าระบุว่า "ไม่มี Pre-migration Backup" และ "ระบุ ACCOUNT 9 คนไม่ได้"
**ทั้งสองข้อไม่ถูกต้อง** — เกิดจากการตรวจเฉพาะตารางที่สร้างขึ้นระหว่างงานและ `audit_log`
โดยยังไม่ได้ค้นหาตารางสำรองอื่นในฐานข้อมูล

### หมายเหตุเรื่อง `ACCOUNT`

`ACCOUNT` เป็น **ชื่อแผนก** ไม่ใช่ Role — ระบบใช้ Role เพียง `SUPER_ADMIN` · `ADMIN` · `USER`

### ตารางสำรองที่ต้องเก็บไว้

`njhr_appusers_backup_20260727` และ `njhr_bk_app_users_20260802` — **ห้ามลบ**
RLS เปิดอยู่แล้ว แต่ `anon` ยังมีสิทธิ์ระดับตาราง ควร `revoke` เพิ่มอีกชั้น

`njhr_role_snapshot_post_consolidation_v1` เป็น Snapshot หลังแปลง ใช้ย้อน Role ไม่ได้
ปิดสิทธิ์และใส่ COMMENT เรียบร้อยแล้ว

---

## Frontend — รองรับ 3 Role แล้ว

| จุด | ค่า |
|-----|-----|
| `ROLE_TH` | `SUPER_ADMIN` · `ADMIN` · `USER` |
| `ALL` | `['SUPER_ADMIN','ADMIN','USER']` |
| `US_ROLES` (Dropdown) | 3 ค่า |
| `normRole()` | `SUPER_ADMIN`/`ADMIN` คงเดิม · ค่าอื่นทั้งหมด → `USER` |
| อาเรย์สิทธิ์ | 37 จุด — `['SUPER_ADMIN','ADMIN','USER']` 2 · `['SUPER_ADMIN','ADMIN']` 34 · `['SUPER_ADMIN']` 1 |

**ค้นหา `ACCOUNT` `EMPLOYEE` `STAFF` `HR` `MANAGER` ทั้งโปรเจกต์** — เหลือ 8 จุดและ
**ไม่ใช่ Role แม้แต่จุดเดียว**

| จุด | คืออะไร |
|-----|---------|
| `08-view-employees.js:534` | `department_name: 'ACCOUNT'` — ชื่อแผนกในเทมเพลตนำเข้า |
| `12-view-reports-settings.js` 7 จุด | `w.scope === 'EMPLOYEE'` — ขอบเขตของ Workflow |

---

## สถานะ

| รายการ | สถานะ |
|--------|--------|
| Role Migration (Database) | **DONE** |
| Frontend รองรับ 3 Role | **DONE — ยังไม่ Deploy** |
| ช่องโหว่ตารางสำรอง | **ปิดแล้ว** |
| Pre-migration Backup | **มีอยู่ 2 ตัว** — `njhr_appusers_backup_20260727` · `njhr_bk_app_users_20260802` |
| ระบุบัญชีที่เคยเป็น `ACCOUNT` 9 คน | **ทำได้** — กระทบผู้ใช้จริง 1 บัญชี |
| ทดสอบ Login 3 Role | **NOT TESTED** |
| Production Real Data | **NOT TESTED** |

---


## Build `64e9dacd` — รอบที่ 2 (Error Handling ในกล่องยืนยัน)

**ไฟล์ที่เปลี่ยน**

`src/12-view-reports-settings.js` · `src/13-view-admin-users.js`

**รายการแก้ไข**

- ถอด `.catch` ที่แสดงข้อความอย่างเดียวออกจาก callback ของ `confirmDialog` **14 จุด**
  Error จึงถูกส่งกลับให้ `confirmDialog` จัดการ — Modal ค้างไว้ · แสดงข้อความใน `#cf-err` ·
  ปุ่มยืนยันกลับมากดใหม่ได้ · ปุ่มยกเลิกใช้ได้
- ข้อความผิดพลาดเดิมคงไว้ทั้งหมด (มาจาก `e.message` แหล่งเดียวกัน)
- คงไว้ 1 จุดโดยเจตนา — ปิดใช้งานกะที่ยังมีพนักงานใช้อยู่ (`12-view-reports-settings.js:649`)
  `.catch` ตัวนี้ไม่ได้แสดงข้อความอย่างเดียว แต่เปิดกล่องยืนยันซ้ำเพื่อ **บังคับปิด** (`p_force = true`)
  ถ้าถอดออกจะเสียเส้นทางบังคับปิดกะทั้งหมด

**MD5 ของไฟล์ Deploy**

| ไฟล์ | MD5 |
|------|-----|
| `app.js` | `95c8b81c856dfcba58276ceec1c1aeb1` |
| `styles.css` | `b00c290bc01396fd6edb1c70e5a6aa91` |
| `mobile.css` | `319b5a7affb218b933f76d1b7e449d91` |
| `index.html` | `bcb937ffb715f59919b4217bcd31f81f` |
| `sw.js` | `e524b4f6c96a3278f6a8abdfd0135ca4` |
| `config.js` | `5c517c0de521c0862d56bbd3d9f97eac` |
| `face.js` | `aaa22b51db0a01e822fbb75b323b6aaf` |
| `face.css` | `972e97c4839966ea70a7d8e2579288fa` |

**สถานะ**

| หัวข้อ | ผล |
|--------|-----|
| Regression 162 จุด | ต่าง 5 จุด — ความต่างโดยเจตนาที่อนุมัติแล้ว |
| Error → Modal ค้าง + แสดงข้อความ | ผ่าน |
| กดยืนยันใหม่หลัง Error | ผ่าน — ข้อความถูกล้าง ทำงานต่อได้ สำเร็จแล้ว Modal ปิด |
| กดยืนยันรัว 4 ครั้ง | RPC ยิง 1 ครั้ง |
| Console Error | ไม่มี |
| **gzip / Brotli** | **ยังไม่สามารถยืนยันจาก Production Response Header ได้** |
| Production Real Data | NOT TESTED |

---


## Build `f837637a` — รอบที่ 2 (แก้ 4 จุดที่ยังไม่ผ่าน)

**ไฟล์ที่เปลี่ยน**

`face.js` · `src/01-core-icons-utils.js` · `src/09-view-attendance.js` ·
`src/11-view-approvals-payroll.js` · `src/12-view-reports-settings.js` ·
`src/14-view-profile-hrdocs.js`

**รายการแก้ไข**

- callback ของ `confirmDialog` อีก 4 จุดคืน Promise แล้ว — ปิดใช้งานรายการเงินเดือน · ลบรายการเงินเดือน ·
  อนุมัติคำขอลา · ดำเนินการเอกสาร HR · ย้ายข้อมูลลงเวลา
  (`piBulkRun` · `send` · `fire` เพิ่ม `return` ให้คืน Promise · `run` คืนอยู่แล้ว)
- `face.js` ใช้ `loadStyleOnce` ตัวเดียวกับ `app.js` ผ่าน `window.NJHR_loadStyleOnce`
  ไม่มี `createElement('link')` เหลือใน `face.js` แล้ว
- เปิด `window.NJHR_loadStyleOnce` · `window.NJHR_loadScriptOnce` · `window.NJHR_asset`
  ให้โมดูลนอก IIFE ใช้ตัวโหลดชุดเดียวกัน
- ไฟล์ในโปรเจกต์ทุกตัวมี `?v=BUILD` ครบ — `face.js` · `face.css` · `master-salary.js` · `report-template.js`

**MD5 ของไฟล์ Deploy**

| ไฟล์ | MD5 |
|------|-----|
| `app.js` | `3c548251688f8f8828fd636c09c9e6b3` |
| `styles.css` | `b00c290bc01396fd6edb1c70e5a6aa91` |
| `mobile.css` | `319b5a7affb218b933f76d1b7e449d91` |
| `index.html` | `93dcca1fd0d9236592b56064037a43a0` |
| `sw.js` | `e572985cc450ec4ab82aaf8647dde2b1` |
| `config.js` | `b051f3886f08fba55dc92dcbb8053929` |
| `face.js` | `aaa22b51db0a01e822fbb75b323b6aaf` |
| `face.css` | `972e97c4839966ea70a7d8e2579288fa` |
| `master-salary.js` | `f64184805450a817bf70653a293f184f` |
| `report-template.js` | `a4067da78b7d4ad779d9c1259bccb03b` |

**สถานะ**

| หัวข้อ | ผล |
|--------|-----|
| Regression 162 จุด | ต่าง 5 จุด — ความต่างโดยเจตนาที่อนุมัติแล้ว |
| Screenshot | ไม่ต่างจากรอบก่อน |
| `app.js` โหลด | 1 ครั้ง |
| Console Error | ไม่มี |
| กดยืนยันรัว 4 ครั้ง | RPC ยิง 1 ครั้ง |
| Horizontal overflow | ไม่มี |
| **gzip / Brotli** | **ยังไม่สามารถยืนยันจาก Production Response Header ได้** |
| Production Real Data | NOT TESTED |

---


## Build `a56344e3` — รอบที่ 2 (แก้ 5 จุดที่ยังไม่ผ่าน)

**ไฟล์ที่เปลี่ยน**

`sw.js` · `face.js` · `src/01-core-icons-utils.js` · `src/03-ui-toast-modal.js` ·
`src/08-view-employees.js` · `src/09-view-attendance.js` · `src/10-view-requests-leave-ot.js` ·
`src/11-view-approvals-payroll.js` · `src/12-view-reports-settings.js` · `src/13-view-admin-users.js`

**รายการแก้ไข**

- `confirmDialog` รองรับ `onOk` ที่คืน Promise — แสดง Loading ที่ปุ่มยืนยัน ไม่ปิด Modal จนกว่าจะสำเร็จ
  ปิดปุ่มยกเลิกระหว่างทำงาน · เพิ่มช่อง `#cf-err` แสดงข้อความผิดพลาด · งาน synchronous ทำงานเหมือนเดิม
- callback ของ `confirmDialog` **22 จุด** คืน Promise แล้ว
- Service Worker เลิกใช้ `ignoreSearch: true` — เทียบ URL ตรงตัวรวม `?v=`
  และค้นเฉพาะ cache ของ build ปัจจุบันด้วย `caches.open(V).then(c => c.match(...))`
- `face.css` ใช้ Build Version เดียวกับ `face.js` จาก `window.NJHR_BUILD_VERSION`
  โหลดไม่สำเร็จจะลบ `<link>` และรีเซ็ต `S.cssAdded` ให้ลองใหม่ได้
- `loadStyleOnce()` เลิกกลืน Error — `onerror` reject จริง · timeout 20 วินาที · ลบ link ที่เสีย · ลองใหม่ได้

**MD5 ของไฟล์ Deploy**

| ไฟล์ | MD5 |
|------|-----|
| `app.js` | `59bc799cddccde96cdb52ba8787ab5d1` |
| `styles.css` | `b00c290bc01396fd6edb1c70e5a6aa91` |
| `mobile.css` | `319b5a7affb218b933f76d1b7e449d91` |
| `index.html` | `291a1b193b0702b6762cab3290af7f74` |
| `sw.js` | `1dbf7f3801b8994461f1d01e0035b503` |
| `config.js` | `65b2fd064d8c856ce7696e4f99d8958e` |
| `face.js` | `4273ab1b22ef9a05c43a851a43c9cd56` |
| `face.css` | `972e97c4839966ea70a7d8e2579288fa` |

**สถานะ**

| หัวข้อ | ผล |
|--------|-----|
| Regression 162 จุด | ต่าง 5 จุด — ความต่างโดยเจตนาที่อนุมัติแล้ว |
| `app.js` โหลด | 1 ครั้ง |
| Console Error | ไม่มี |
| กดยืนยันรัว 4 ครั้ง | RPC ยิง 1 ครั้ง |
| **gzip / Brotli** | **ยังไม่สามารถยืนยันจาก Production Response Header ได้** |
| Production Real Data | NOT TESTED |

---


## Build `8c90a997` — รอบที่ 2 (ปรับประสิทธิภาพความเสี่ยงต่ำ)

**ไฟล์ที่เปลี่ยน**

`index.html` · `sw.js` · `build.js` · `config.js` (build เขียนให้) ·
`src/01-core-icons-utils.js` · `src/03-ui-toast-modal.js` · `src/08-view-employees.js` ·
`src/09-view-attendance.js` · `src/11-view-approvals-payroll.js` ·
`src/12-view-reports-settings.js` · `src/14-view-profile-hrdocs.js` ·
`src/15-view-salary-merge-boot.js` · `src/css/styles.css`

**รายการแก้ไข**

- เลิกล็อกปุ่มทั้งหน้า — เหลือเฉพาะ `cursor: progress` · `SB_INFLIGHT` ยังกัน RPC ซ้ำ
- เพิ่ม `withButtonLoading()` ล็อกเฉพาะปุ่มที่กด คืนสถานะเสมอ
- เลิกใช้ `document.write` — เปลี่ยนเป็น `NJHR_loadBootScript()` (`script.async = false`)
- แก้ bootstrap ให้ตรวจ `document.readyState` กันระบบไม่เริ่มเมื่อ `DOMContentLoaded` ยิงไปก่อน
- เพิ่ม `loadScriptOnce()` / `loadStyleOnce()` — Promise cache · timeout 20 วินาที · ลองใหม่ได้
- Loader ทั้ง 8 จุดใช้ Helper กลางแล้ว ลบ Loader เดิมออกหมด
- เพิ่ม `njAsset()` ใส่ `?v=BUILD` ให้ไฟล์ในโปรเจกต์
- `build.js` เขียน Build Version ลง `sw.js` · `config.js` · `index.html` จากแหล่งเดียว
- Service Worker แบ่ง Core / Lazy / Network-only · เลิกกลืน Install Error · เพิ่ม `mobile.css` ที่ขาด

**MD5 ของไฟล์ Deploy**

| ไฟล์ | MD5 |
|------|-----|
| `app.js` | `4ebae007c0e49e9f871ee7a3c7933962` |
| `styles.css` | `b00c290bc01396fd6edb1c70e5a6aa91` |
| `mobile.css` | `319b5a7affb218b933f76d1b7e449d91` |
| `index.html` | `eafa913c373a85f77b04478af2a919f2` |
| `sw.js` | `5f0195ece1925537d7f47f5f225d2feb` |
| `config.js` | `632af6f1c3ebcf6ba07d0f3db63e12fb` |

**สถานะ**

| หัวข้อ | ผล |
|--------|-----|
| Regression 162 จุด | ต่าง 5 จุด — ความต่างโดยเจตนาที่อนุมัติแล้วทั้งหมด |
| `app.js` โหลด | 1 ครั้ง |
| Console Error | ไม่มี |
| Library ตอน Login | ไม่โหลดเลย |
| Cache | Core/Lazy แยกกลุ่ม · Asset ใช้ Build เดียวกัน |
| **gzip / Brotli** | **ยังไม่สามารถยืนยันจาก Production Response Header ได้** |
| Production Real Data | NOT TESTED |

---


## v2.2.0 — Build `29108eaf` (รอบสุดท้าย)

### เพิ่ม — กรอบการ์ด Workflow ตามสถานะ

หน้า `#/approval-settings` · การ์ดชุด Workflow (`.wf-set`)

| สถานะ | กรอบ | พื้นหลัง |
|-------|------|----------|
| มีขั้นอนุมัติและมีผู้อนุมัติครบแล้ว | 2px `#16A34A` เขียว | เดิม |
| 0 ขั้น **หรือ** ผู้อนุมัติ 0 คน | 2px `#FCA5A5` แดงอ่อน | `#FEF6F6` แดงอ่อนมาก |
| ปิดใช้งาน | 2px `#CBD5E1` เทา | เดิม |

มุมโค้งเดิม (Desktop 14px · Mobile 12px) · ขนาดการ์ดไม่เปลี่ยน · ลำดับการ์ดไม่เปลี่ยน

**ไฟล์ที่แก้ 3 ไฟล์**

| ไฟล์ | เปลี่ยน |
|------|---------|
| `src/12-view-reports-settings.js` | +3 บรรทัด — คำนวณ `wfStat` แล้วเติมเป็น class |
| `src/css/styles.css` | +4 บรรทัด (1091–1094) |
| `src/css/mobile.css` | +4 บรรทัด (619–622) |

---

## v2.1.0 — Build `c659103d`

- Build system: terser + clean-css (`mangle:false` · `compress:false` · CSS `level 2:false`)
- ย้ายต้นฉบับ CSS ไป `src/css/` · ไฟล์ที่รากเป็นผลลัพธ์ build
- Cache Version ใน `sw.js` ผูกกับ hash ของ build อัตโนมัติ
- `build.js` portable — `require('terser')` / `require('clean-css')` + `package.json` + `package-lock.json`
- Initial Payload 1,234,527 → 870,247 B (−29.5%) · Initial load 330 → 210 ms

## v2.0.x — Clone Baseline และหมวด D

| เวอร์ชัน | เปลี่ยน |
|----------|---------|
| v2.0.0 | Clone Baseline จาก NJ-HR-V10 (102 ไฟล์) |
| v2.0.1 | แยก Environment เป็น `config.js` |
| v2.0.2 | Environment Safety Gate + รหัส CFG-001…007 |
| v2.0.3 | รองรับ `file://` (ตัด query string ออกจาก config loader) |
| v2.0.4 | unregister Service Worker เฉพาะ scope ของ V2 |
| v2.0.5 | **แก้บั๊ก** `dRow is not defined` — หน้าโปรไฟล์พังทั้งหน้าใน V1 |
| v2.1.0-a | แยก `app.js` เป็น 15 Source Modules + `build.js` |
| v2.1.0-b | **แก้บั๊ก** `docContractProbationTemplate` ประกาศซ้ำ (36 บรรทัด dead code) |
| v2.1.0-c | **แก้บั๊ก** `njhr_att_report` ยิงซ้ำที่ `#/reports` (in-flight dedup) |
| v2.1.0-d | ลบ CSS declaration ที่ซ้ำ 4 จุด |
| v2.1.0-e | ลบ dead code 10 function + 4 ตัวแปร (−101 บรรทัด) |

## สิ่งที่ไม่เคยเปลี่ยนเลยตลอดทุกเวอร์ชัน

UI · DOM · Class · ID · Route ทั้ง 28 · Menu 5 หมวด · Role และ Permission · Workflow · สูตรคำนวณ · RPC Contract · Data Contract · Import / Export / Print · Database Schema · SQL · Storage Bucket

**V1 ไม่ถูกแก้และไม่ถูกกระทบ** — hash รวมทรี V1 `04fc2c8054257be3e3a3d3d1a6212b4c` เท่าเดิมตลอด
