CANDY FUN ADVENTURE — local004 (ตัวการ์ตูนประจำเกม)
===================================================
เปิดเล่นทันที : ดับเบิลคลิก candyfun/index.html

รอบนี้ (ต่อจาก local003)
  เพิ่ม   : assets/candy3d/character/  profile-256.webp, game-600.webp, win-600.webp
            ตัวการ์ตูน 3D ออกแบบเอง (สาวผมยาวมัดจุก เสื้อเทา ถือมือถือ) 3 ท่า: โปรไฟล์ / เล่นเกม / ฉลองผ่านด่าน
  แก้ไข  : js/photo.js (ใช้ตัวการ์ตูนเป็นค่าเริ่มต้นเมื่อยังไม่อัปโหลดรูป), css/style.css, version.json
  ไม่แตะ : js/engine.js, js/levels.js, js/save.js, js/audio.js, js/art.js, js/ui.js, index.html

การทำงาน
  ยังไม่อัปโหลดรูป → HOME / GAME / ผ่านด่าน แสดงตัวการ์ตูนประจำเกม
  อัปโหลดรูปของตัวเอง → ใช้รูปนั้นแทน · ลบรูป → กลับเป็นตัวการ์ตูน
  ตัวการ์ตูนเป็นงานออกแบบใหม่ ไม่ใช่การแปลงรูปถ่ายบุคคล และไม่มีรูปถ่ายใดถูกฝังใน ZIP

ต้นฉบับ (เฉพาะ Open check): candyfun/_source_art/  ภาพ PNG ความละเอียดสูง + สคริปต์เรนเดอร์

Deploy (GitHub.com → Add file → Upload files → Commit changes)
  แตก "Deploy github local004.zip" แล้วลากโฟลเดอร์ candyfun ทับที่เดิม (28 ไฟล์)
