# Regression Harness

ต้องมี Node.js 18+ และ Playwright พร้อม Chromium

```bash
npm i -D playwright && npx playwright install chromium
```

| คำสั่ง | ทำอะไร |
|--------|---------|
| `node compare.js <ทาง V1> <ทาง V2>` | เทียบ DOM 27 Route × 6 มิติ = 162 จุด |
| `node shots.js <ทางโปรเจกต์> <port> <โฟลเดอร์ผลลัพธ์>` | ถ่าย 8 หน้า × 5 ความกว้าง = 40 ภาพ แล้ว hash |
| `node perf.js <ทางโปรเจกต์> <port> <ป้ายกำกับ>` | วัด load / boot / requests / heap / เวลาเปลี่ยน Route |
| `node queries.js <ทางโปรเจกต์> <port> <ป้ายกำกับ>` | บันทึก RPC call ทุกครั้งพร้อม parameter หา query ซ้ำ |
| `node listeners.js <ทางโปรเจกต์> <port> <ป้ายกำกับ>` | นับ event listener ที่ค้างบน document/window |

ทุกตัวดัก request ที่ยิงไป Supabase แล้วตอบด้วย `fixtures.js` (108 พนักงาน / 10 แผนก / 111 ผู้ใช้)
**ไม่แตะข้อมูล Production เลย**

`rpc_read.txt` / `rpc_write.txt` = รายชื่อ RPC 58 อ่าน / 55 เขียน ใช้กรองใน Network tab ระหว่างทดสอบ Read-Only
