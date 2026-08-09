# P3_BUNDLE_SIZE_REPORT

Build `njhr-v2-ad12da59` → `njhr-v2-eed72c68` · gzip วัดด้วย zlib level 9 บนไฟล์จริง

| ไฟล์ | ก่อน raw | หลัง raw | ก่อน gzip | หลัง gzip |
|---|---:|---:|---:|---:|
| `runtime/namespace.js` | 5249 | 5281 | 2065 | 2075 |
| `runtime/core.js` | 72839 | 70184 | 21445 | 20521 |
| `views/dashboard.js` | 16540 | 16540 | 5222 | 5222 |
| `runtime/shared/emp-meta.js` | 4264 | 4264 | 1394 | 1394 |
| `runtime/shared/hr-meta.js` | 2806 | 2806 | 1167 | 1167 |
| `runtime/shared/report-export.js` | 6079 | 6079 | 2000 | 2000 |
| `runtime/shared/requests.js` | 9481 | 9481 | 3482 | 3482 |
| `runtime/shared/leave-meta.js` | — | 1499 | — | 739 |
| `runtime/shared/attachments.js` | — | 1436 | — | 805 |
| `views/employees/list.js` | 46785 | 11834 | 11953 | 3634 |
| `views/employees/form.js` | — | 19583 | — | 5408 |
| `views/employees/documents.js` | — | 17991 | — | 5547 |
| `views/employees/import.js` | 16876 | 16876 | 5337 | 5337 |
| `views/employees/export.js` | 3197 | 3197 | 1490 | 1490 |
| `views/attendance/main.js` | 19049 | 17400 | 6256 | 5782 |
| `views/attendance/correction.js` | — | 2841 | — | 1283 |
| `views/attendance/report.js` | 30621 | 30621 | 8636 | 8636 |
| `views/leave/main.js` | 28253 | 15296 | 8489 | 5234 |
| `views/leave/form.js` | — | 10690 | — | 3881 |
| `views/leave/detail.js` | — | 4387 | — | 1785 |
| `views/ot/main.js` | 18558 | 4074 | 6159 | 1855 |
| `views/ot/form.js` | — | 15716 | — | 5360 |
| `compat/app-legacy.js` | 513344 | 513344 | 122419 | 122417 |
| `styles.css` | 77240 | 77240 | 15134 | 15134 |
| `mobile.css` | 41277 | 41277 | 7435 | 7435 |
| `index.html` | 15429 | 15429 | 5128 | 5128 |
| `config.js` | 5378 | 5378 | 1878 | 1878 |
| `asset-manifest.js` | 3327 | 4954 | 963 | 1176 |
| `sw.js` | 5284 | 5370 | 2169 | 2204 |

**Compatibility Bundle** 513,344 B raw / 122,419 → 122,417 B gzip — ไม่ได้ย้ายโค้ดออกเพิ่มในรอบนี้ตามขอบเขตที่กำหนด

**Runtime Core** 72,839 → 70,184 B raw (gzip 21,445 → 20,521) จากการย้าย leave-meta และ attachments ออก

`styles.css` และ `mobile.css` MD5 เดิมทุกไบต์ — ไม่แตะ CSS
