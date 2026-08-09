# P3_LISTENER_REPORT

Build `njhr-v2-eed72c68`

วิธีวัด: hook `EventTarget.prototype.addEventListener` ก่อนสคริปต์แรกทำงาน นับเฉพาะ `window` / `document` / `body`
จับค่าฐานหลังเปิดครบทุกหน้า แล้ววน 5 หน้า × 3 รอบ + Back/Forward + Logout แล้ว Login ใหม่

| | ค่า |
|---|---|
| Listener ระดับ window/document | `{load:1, hashchange:1, keydown:1, resize:1}` |
| เพิ่มขึ้นหลังใช้งานหนัก | **0** |

Action Module (Form/Documents/Correction/Detail) ผูก handler บน element ใน Modal
ซึ่งถูกทำลายพร้อม `closeModal()` จึงไม่สะสม — ยืนยันด้วยการเปิด/ปิด Modal ซ้ำในชุดทดสอบ

## ผลจากชุดทดสอบ

| Test Case | ผล | หลักฐาน |
|---|---|---|
| P3 · Listener ไม่เพิ่มหลังวน 5 หน้า × 3 รอบ + Back/Forward + Logout/Login | PASS | {"window:load":1,"window:hashchange":1,"window:keydown":1,"window:resize":1} |
| P3 · Responsive 360x740 — 5 หน้าใหม่ไม่ล้นจอ | PASS | ทั้ง 5 หน้าไม่ล้น |
| P3 · Responsive 768x1024 — 5 หน้าใหม่ไม่ล้นจอ | PASS | ทั้ง 5 หน้าไม่ล้น |
| P3 · Responsive 1440x900 — 5 หน้าใหม่ไม่ล้นจอ | PASS | ทั้ง 5 หน้าไม่ล้น |
| P3 · iPhone Safari (WebKit จริง) | NOT TESTED | ยังไม่ได้ทดสอบบนอุปกรณ์ iPhone Safari จริง — สภาพแวดล้อมนี้มีเฉพาะ Chromium |

**PASS 76 · FAIL 0 · NOT TESTED 10**

## ผลชุด Prompt 2 (รันซ้ำบน build นี้)

| LISTENER · window/document listener ไม่เพิ่มหลังเปิดหน้าซ้ำ 3 รอบ + Back/Forward | PASS | {"window:load":1,"window:hashchange":1,"window:keydown":1,"window:resize":1,"window:afterprint":2} |
| LISTENER · ไม่เพิ่มหลัง Logout แล้ว Login ใหม่ | PASS | คงที่ {"window:load":1,"window:hashchange":1,"window:keydown":1,"window:resize":1,"window:afterprint":2} |
| LISTENER · รายการ listener ระดับ window/document | PASS | `{"window:load":1,"window:hashchange":1,"window:keydown":1,"window:resize":1,"window:afterprint":2}` |
