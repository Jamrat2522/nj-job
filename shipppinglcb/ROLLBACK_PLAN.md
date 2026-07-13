# ROLLBACK PLAN (100% · ไม่แตะ DB)
## ไฟล์ rollback
`js/app.monolithic.js` = app.js Production เดิม (559,483 bytes · SHA256 `5c7e15fd...`) เป๊ะ

## วิธี Rollback (เลือก 1)
**วิธี A — ในโคลนนี้:**
1. ลบ/เปลี่ยนชื่อ `js/app.js` (ตัว lazy)
2. เปลี่ยนชื่อ `js/app.monolithic.js` → `js/app.js`
3. ลบ `js/heavy-export.js`, `heavy-dash.js`, `heavy-ot.js`, `heavy-users.js`
4. Hard refresh → กลับเป็น monolithic เดิม

**วิธี B — deploy Production เดิม:**
- ใช้โฟลเดอร์ Production (`MASSENGER_V3.zip`) ทับ

## ยืนยัน
- ไม่แก้ Database / Supabase schema / permission → rollback ได้ทันทีไม่กระทบข้อมูล
- `index.html`, `css/app.css`, `config/runtime-config.js` เหมือน Production (rollback ไม่ต้องแก้)
