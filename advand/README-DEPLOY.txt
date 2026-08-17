==========================================================
 ADVANCE — FINAL SECURE (รอบ 6)
 ⚠️ ไฟล์ชุดนี้ = ใช้โยนขึ้น GitHub (DEPLOY)
==========================================================
GitHub.com -> repo Advance -> Add file -> Upload files
-> ลาก index.html -> Commit changes        (1 ไฟล์)

SHA-256 : a0576658f4f0247670364895eda61326e3f79a73393887f1b8f41e24ece12ce2
ขนาด    : 394808 bytes

⚠️ index.html รอบนี้ "ไม่มีการแก้ไข" — ไบต์ต่อไบต์เท่ากับรอบ 5 ที่ผ่าน 203/203
   งานรอบนี้เกิดฝั่ง Database ทั้งหมด (RUN-01/02/03 + VERIFY)
   จะอัปโหลดซ้ำหรือไม่ก็ได้ — ผลลัพธ์เหมือนเดิมทุกประการ

Frontend Cutover ไป njadv_* RPC = ยังไม่ทำ (รอบถัดไป)
เหตุผล: RUN-04 ถูกบล็อกด้วย dependency 4 แอป การ cutover ตอนนี้
        จึงยังไม่ให้ผลด้าน security จริง แต่แบกความเสี่ยง login ของ 112 คน
        ดูรายละเอียดใน ADVANCE-FINAL-SECURITY-SQL.zip / RUN-04
