# DEPLOY / ROLLBACK GUIDE — LAZY FINAL CANDIDATE

## โครงไฟล์ที่ต้อง Deploy (path ต้องตรง)
```
/ (web root)
├── index.html
├── config/runtime-config.js
├── css/app.css
└── js/
    ├── app.js            (489 KB · lazy loader ข้างใน)
    ├── heavy-export.js   (โหลดเมื่อกด Export)
    ├── heavy-dash.js     (โหลดเมื่อเปิด Dashboard/กราฟ)
    ├── heavy-ot.js       (โหลดเมื่อสร้างงาน OT)
    ├── heavy-users.js    (โหลดเมื่อเปิด Users)
    └── app.monolithic.js (เก็บไว้เฉย ๆ สำหรับ Rollback · ไม่ถูกโหลด)
```
> **สำคัญ:** ต้องอัปโหลด `js/heavy-*.js` ทั้ง 4 ไฟล์ให้อยู่โฟลเดอร์ `js/` เดียวกับ app.js (app.js inject ด้วย path `js/heavy-*.js`)

## Deploy (staging → production)
1. อัปโหลดทั้งโฟลเดอร์ทับของเดิม (index.html, config/, css/, js/ + heavy-*)
2. ถ้ามี cache/CDN → purge (หรือ path มี `?v=3.1.0` อยู่แล้ว)
3. **Hard refresh (Ctrl+Shift+R)** ทดสอบ
4. เปิด DevTools → Network: เปิดแอปเปล่า **ไม่มี** heavy-* · กดเมนู → heavy-* โหลด 1 ครั้ง

## Rollback (100% · ไม่แตะ Database)
**ถ้าต้องกลับ monolithic เดิมทันที:**
1. `js/app.js` → ลบ/เปลี่ยนชื่อ
2. `js/app.monolithic.js` → เปลี่ยนชื่อเป็น `js/app.js`
3. ลบ `js/heavy-export.js`, `heavy-dash.js`, `heavy-ot.js`, `heavy-users.js`
4. Hard refresh → กลับเป็นเวอร์ชันเดิม 100%

ยืนยัน: `app.monolithic.js` SHA256 `5c7e15fda309bf17` = app.js Production เดิมเป๊ะ · ไม่แก้ DB/schema/permission → rollback ปลอดภัยทันที

## หมายเหตุ
- Document / Timeline / รับ-ปิดงาน / Realtime **ไม่ถูกแยก** (คงใน app.js)
- Modal "สร้างงานใหม่" +20% (desktop) รวมอยู่ใน css/app.css
- ตรวจ hash ทุกไฟล์ได้ที่ FREEZE_MANIFEST.md
