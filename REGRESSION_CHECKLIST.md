# REGRESSION CHECKLIST — Browser Test (15 ข้อ)
> เปิด DevTools → Network (Disable cache) + Console · paste `chunk-test-console.js` → `CT.watch()`

| # | ทดสอบ | ผลคาดหวัง | ผล |
|---|---|---|---|
| 1 | Login ทุก role (USER/MESSENGER/SHIPPING/SUPER_ADMIN) | เข้าได้ · landing: SHIPPING=Document, ADMIN=jobs, อื่น=wait | ☐ |
| 2 | Network ตอนเปิดแอป | ไม่มี heavy-* (`CT.loaded()`=0) | ☐ |
| 3 | กด Export | heavy-export.js โหลด 1 ครั้ง · ไฟล์ออกเหมือนเดิม | ☐ |
| 4 | เปิด Dashboard + กราฟ | heavy-dash.js โหลด 1 ครั้ง (กราฟใช้ตัวเดิม) | ☐ |
| 5 | สร้างงาน OT | heavy-ot.js โหลด 1 ครั้ง · modal ทำงาน | ☐ |
| 6 | เปิด User Management | heavy-users.js โหลด 1 ครั้ง | ☐ |
| 7 | กดเมนูเดิมซ้ำ | ไม่โหลด chunk ซ้ำ (`CT.dupes()`=none) | ☐ |
| 8 | สร้าง/รับ/อัปเดตสถานะ/ปิดงาน | ปกติ | ☐ |
| 9 | Document + Timeline | ปกติ (ไม่ถูกแยก) | ☐ |
| 10 | Realtime 2 เครื่อง | อัปเดต realtime | ☐ |
| 11 | ทุก Permission | USER/MESSENGER ไม่เห็น Dashboard/Users | ☐ |
| 12 | Console | ไม่มี error ใหม่ | ☐ |
| 13 | จำลอง chunk พัง (rename heavy-dash.js) | error message · ไม่ค้าง · เมนูอื่นปกติ | ☐ |
| 14 | Refresh + Login ใหม่ | ปกติ · ข้อ 2 ยังจริง | ☐ |
| 15 | มือถือ + Desktop | ปกติทั้งสอง | ☐ |
