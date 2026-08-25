BILLING NJ — วิธีอัปโหลดขึ้น GitHub   (build 1.4.1-local209 · REPORT V.205)

╔══════════════════════════════════════════════════════════════════╗
║  ⚠️ ขั้นที่ 0 — ต้องรัน SQL ก่อนอัปโหลดไฟล์เสมอ                          ║
╚══════════════════════════════════════════════════════════════════╝
เปิด Supabase > SQL Editor แล้วรัน:

  sql/RUN-NOW/RUN-17_WHT_HAS_ACTING_AGENT.sql
  sql/RUN-NOW/RUN-18_WHT_HAS_FUND.sql          <- ต้องรันหลัง RUN-17
  sql/RUN-NOW/RUN-19_WHT_CITIZEN_ID.sql        <- ต้องรันหลัง RUN-18
  sql/RUN-NOW/RUN-20_WHT_PARTY_CODE_MASTER.sql <- ใหม่ · ต้องรันหลัง RUN-19
     *** อ่าน PREFLIGHT P1 ก่อน *** ถ้ามี CODE ซ้ำใน njacc_customers ต้องแก้ก่อน

  เพิ่มคอลัมน์ njacc_withholding_docs.has_acting_agent (nullable)
  และแก้ njacc_save_wht_draft ให้รับค่านี้
  SECTION 3 (VERIFY) ต้องได้ PASS ครบ V1-V3 และ V5
  *** ไม่ UPDATE ข้อมูลเดิม *** เอกสารเก่าคงค่า NULL ไว้และยังพิมพ์เหมือนเดิม
  รันซ้ำได้ปลอดภัย · ไม่มี DROP/DELETE/TRUNCATE · ROLLBACK อยู่ท้ายไฟล์

*** ถ้ายังไม่ได้รัน RUN-16 ของ V.190 ให้รันก่อน ***
    sql/RUN-NOW/RUN-16_JOB_CLOSE_AND_QUEUE_FLOW.sql

────────────────────────────────────────────────────────────
ขั้นที่ 1 — อัปโหลดไฟล์  (DEPLOY_V189_GITHUB_local192.zip)

*** ห้ามสลับลำดับ *** index.html คือ cache key (__BUILD=1.4.1-local209)
ถ้า index.html ขึ้นก่อน assets/ เบราว์เซอร์จะขอไฟล์ใหม่ที่ยังไม่มี -> พังกลางคัน

  COMMIT ที่ 1   ลากขึ้นพร้อมกัน  (โฟลเดอร์ assets/ ทั้งก้อน)
      assets/js/app.bundle.js          <- build ใหม่
      assets/css/app.bundle.css        <- build ใหม่
      assets/css/pages/report.css      <- แก้
      assets/js/withholding/withholding-page.js  <- แก้
      assets/js/withholding/wht-doc.js           <- แก้ (เนื้อหา 50 ทวิ · V.194)
      assets/css/pages/withholding.css           <- แก้
      assets/css/pages/wht-doc.css               <- แก้
      assets/js/reports/report-defs.js    <- ไฟล์ใหม่
      assets/js/reports/report-export.js  <- ไฟล์ใหม่
      assets/js/reports/report-home.js    <- แก้
      assets/js/config/routes.js          <- แก้
      (ไฟล์อื่นใน assets/ ในแพ็กเกจนี้เหมือนเดิม อัปทับได้ปลอดภัย)

  COMMIT ที่ 2   ไฟล์เดียว
      index.html                       <- __BUILD=1.4.1-local209

จำนวนไฟล์ในแพ็กเกจนี้อยู่ต่ำกว่า 100 ไฟล์ อัปผ่าน GitHub เว็บได้ทั้งชุด

────────────────────────────────────────────────────────────
Force Update / Maintenance

APP_VERSION ยังเป็น 1.4.1 (ตรงกับ deploy_version ใน njacc_settings เหมือนเดิม)
รอบนี้เปลี่ยนเฉพาะ __BUILD cache key -> เบราว์เซอร์โหลด JS/CSS ชุดใหม่
*** ไม่ trigger Maintenance 10 นาที และไม่บังคับ re-login ***
ถ้าต้องการบังคับ Maintenance + re-login ให้ขึ้น APP_VERSION พร้อมอัปเดต
deploy_version ใน njacc_settings ตามระบบเดิม (แจ้งก่อน จะทำให้ในรอบถัดไป)

────────────────────────────────────────────────────────────
สำคัญสำหรับการแก้ครั้งต่อไป — อ่าน build.md ก่อน

    ./build.sh          (build-css.js + esbuild minify + node --check)
หรือ  npx esbuild app-boot.js --bundle --format=iife --outfile=assets/js/app.bundle.js

ห้ามแก้ app.bundle.js ด้วยมือทีละ module เด็ดขาด
build 1.4.1-local35 ถึง local38 เกิดบั๊กจากวิธีนั้นจริง:
esbuild tree-shake ฟังก์ชัน firstAllowedRoute() ออกไปตอน copy module
ผลคือเปิดแอปแล้วขึ้น "เปิดระบบไม่สำเร็จ" ทั้งที่ syntax ถูกต้องทุกบรรทัด
