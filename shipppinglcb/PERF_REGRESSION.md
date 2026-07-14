# REGRESSION TEST — PERFORMANCE_SAFE
## ✅ Static (ตรวจแล้ว)
- js/app.js เหมือน rev.3 เป๊ะ (diff = ไม่ต่าง) → สิทธิ์/flow/realtime/JOB/export ไม่เปลี่ยนแน่นอน
- css/app.css วงเล็บสมดุล · #10 อยู่ใน @media max-width:768px (desktop ไม่กระทบ)
- ไม่แตะ Supabase/schema/RLS/created_by/assigned_to/status/JOB number/export format

## ⚠️ Browser Test (ต้องรันจริง — Claude รัน browser ไม่ได้)
ทุกบทบาท × ทุกเมนู:
1. SUPER_ADMIN/ADMIN → jobs, dashboard, กราฟ, users, export, documents ครบ
2. STAFF/USER → jobs (งานตัวเอง), wait/going/done
3. MESSENGER → wait ตามท่า, รับงาน/ปิดงาน
4. SHIPPING → documents ตาม terminals, รับ/ตรวจปล่อย/แนบรูป/ปิด
5. มือถือ: เปิด modal (overlay ไม่มี blur แต่มืดปกติ) · scroll ตาราง (ลื่นขึ้น) · หน้าตาเหมือนเดิม
6. Desktop: หน้าตา/เงา/ blur เหมือนเดิมทุกจุด (#10 ไม่ยิงบน desktop)
7. Realtime 2 เครื่อง · KPI · export ไฟล์ · เลข JOB — ไม่เปลี่ยน

## ถ้าข้อใดไม่ผ่าน → Rollback ทั้งโคลน (ห้าม patch ทีละจุด)
