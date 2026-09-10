DEPLOY ORDER  ·  BILLING NJ  ·  1.4.1-local351
═══════════════════════════════════════════════════════════════════════

  รวมไฟล์ที่ต้องอัปขึ้น GitHub ทั้งหมด :  63 ไฟล์
  แบ่งเป็น 4 PART  ·  ทุก PART <= 100 ไฟล์

  *** หมายเหตุสำคัญ ***
  63 ไฟล์ *** ไม่เกินเพดาน 100 ไฟล์ *** จึงไม่ได้ถูกบังคับให้แบ่ง
  แต่แบ่งเป็น PART ตามลำดับ Dependency เพื่อความปลอดภัยของการ Deploy
  (ไฟล์ที่ถูกอ้างถึงขึ้นก่อน · ไฟล์ที่ชี้ไปหาไฟล์ใหม่ขึ้นทีหลัง)
  ถ้าต้องการอัปรวดเดียวก็ทำได้ แต่ต้องเรียงลำดับตามนี้เสมอ


═══════════════════════════════════════════════════════════════════════
ลำดับการอัปโหลด — ห้ามสลับ
═══════════════════════════════════════════════════════════════════════

STEP 1
Upload PART 1
Files: 29
Contains:
  assets/js/app/chunk-*.js   (Shared / Vendor / Dependency chunks)

  ชั้นล่างสุดของกราฟการอ้างอิง — ไม่มีไฟล์ไหนใน PART นี้อ้างถึง PART อื่นเลย
  ใน 10 ไฟล์ของ Static Graph ที่ app.js ต้องใช้ *** 9 ไฟล์อยู่ใน PART นี้ ***


STEP 2
Upload PART 2
Files: 30
Contains:
  assets/js/app/<feature>-<hash>.js   (Page / Feature module 27 ไฟล์)
  assets/vendor/pdf.min.js
  assets/vendor/pdf.worker.min.js
  assets/img/nj-logo.png

  โมดูลของแต่ละหน้า ถูกโหลดแบบ dynamic import ตอนเปิดหน้านั้นจริง
  vendor/pdf.* ถูกเรียกโดย job-form-*.js  ·  nj-logo.png ถูกเรียกโดย chunk-UWAYW6DC.js
  จึงต้องขึ้นก่อน entry


STEP 3
Upload PART 3
Files: 2
Contains:
  assets/js/app/app.js          (Main Entry)
  assets/css/app.bundle.css     (CSS ที่ index.html เรียก)

  *** ห้ามขึ้นก่อน PART 1 และ PART 2 ***
  ถ้า app.js ขึ้นก่อน chunk จะเกิด 404 ตอน import -> หน้าขาว / Spinner ค้าง


STEP 4 — FINAL
Upload PART 4
Files: 2
Contains:
  preview-doc.html
  index.html                    *** ตัวเปิดใช้งาน Build ใหม่ ***

  index.html เรียก :
    assets/css/app.bundle.css?v=1.4.1-local351   -> อยู่ PART 3 แล้ว
    assets/js/app/app.js?v=1.4.1-local351        -> อยู่ PART 3 แล้ว
  *** ห้ามอัป index.html ก่อน PART 1-3 ขึ้นครบ ***


STEP 5
รัน SQL/SET_DEPLOY_BUILD_local351.sql บน Supabase   *** ขั้นสุดท้าย ***
  -> deploy_build = 1.4.1-local351 -> Maintenance 10 นาที + Login ใหม่


═══════════════════════════════════════════════════════════════════════
ห้ามทดสอบกลางทาง
═══════════════════════════════════════════════════════════════════════

  ระหว่าง PART 1 -> PART 4 ระบบอยู่ในสภาพ Mixed Version
  *** ห้ามสรุปว่าใช้งานได้หรือไม่ได้ ***
  ให้ทดสอบหลังอัปครบทุก PART และรัน STEP 5 แล้วเท่านั้น

  ถ้าจำเป็นต้องเปิดเว็บระหว่างทาง : ถือว่าสถานะยังไม่สมบูรณ์
  (index.html เก่ายังชี้ไป app.js เก่า ซึ่งยังอยู่บน Repo -> ระบบเดิมยังทำงานได้ปกติ)


═══════════════════════════════════════════════════════════════════════
ห้ามลบ chunk เก่าในรอบนี้
═══════════════════════════════════════════════════════════════════════

  Deploy รอบนี้เป็นแบบ Additive  —  ไฟล์ใหม่ขึ้นทับ/เพิ่ม ไม่มีการลบ
  ผู้ใช้บางเครื่องอาจยังถือ index.html เก่าใน Cache และยังต้องใช้ chunk เก่า
  *** ห้ามลบ chunk เก่าจนกว่าทุกเครื่องจะได้ Build ใหม่ครบ ***
  (Force Update ของระบบจะบังคับให้ทุกเครื่องโหลดใหม่หลัง STEP 5 อยู่แล้ว)


═══════════════════════════════════════════════════════════════════════
SQL  —  ต้องรัน "หลัง Deploy"
═══════════════════════════════════════════════════════════════════════

  V.351 (งานแก้ Boot Timeout) *** ไม่มี SQL ใหม่ ***
  ไม่มี RPC ใหม่ · ไม่มี Column ใหม่ -> Source ใหม่ไม่พึ่ง SQL ใด ๆ

  ไฟล์ใน SQL/ เป็นของงานก่อนหน้าที่ยังไม่ได้รัน :

    RUN-70_CHARGE_SET_DROP_NOOP_ANALYZE.sql   (V.346 Performance)
      รันก่อนหรือหลัง Deploy ก็ได้ — ไม่เกี่ยวกับ Source
    RUN-71_IMPORT_COMPANY_INVOICES.sql        (V.349 Import บริษัท)
      *** ต้องรันก่อนใช้ปุ่ม UPLOAD EXCEL ในหน้าตั้งค่าบริษัท Invoice ***
      ถ้ายังไม่รัน หน้าอื่นทำงานปกติ แต่กดปุ่มนั้นจะไม่สำเร็จ
    SET_DEPLOY_BUILD_local351.sql             *** รันเป็นขั้นสุดท้ายเสมอ ***

  *** โฟลเดอร์ SQL/ ห้ามอัปขึ้น GitHub *** ข้างในมี auth_user_id (repo เป็น public)


═══════════════════════════════════════════════════════════════════════
Service Worker / Manifest
═══════════════════════════════════════════════════════════════════════

  ตรวจชุด Deploy จริงแล้ว :
    service worker   ไม่มี
    manifest.json    ไม่มี
    version.json / build.json / cache manifest   ไม่มี
  -> ไม่มี precache list ที่ต้องกันไม่ให้ cache 404

  ตัวเปิดใช้งาน Build ใหม่ของระบบนี้คือ :
    window.__BUILD ใน index.html  (PART 4)
    + njacc_settings.deploy_build (STEP 5)
  ทั้งคู่จึงอยู่ท้ายสุดตามกฎ


═══════════════════════════════════════════════════════════════════════
ไฟล์ Critical อยู่ PART ไหน
═══════════════════════════════════════════════════════════════════════

  index.html          -> PART 4  (สุดท้าย)
  preview-doc.html    -> PART 4
  app.js (entry)      -> PART 3
  app.bundle.css      -> PART 3
  shared chunks       -> PART 1
  feature modules     -> PART 2
  vendor / images     -> PART 2
  service worker      -> ไม่มีในระบบ
  manifest.json       -> ไม่มีในระบบ

  router.js · app-boot.js · version-guard.js · session.js
  *** ไม่ได้อยู่เป็นไฟล์เดี่ยวบน Production ***
  ถูก bundle รวมเข้าไปใน app.js และ chunk-*.js แล้ว (esbuild --splitting)
  -> อยู่ใน PART 1 และ PART 3 โดยปริยาย


═══════════════════════════════════════════════════════════════════════
ตรวจหลังอัปครบทุก PART
═══════════════════════════════════════════════════════════════════════

  1. ป้ายเวอร์ชันมุมบนซ้าย = v1.4.1-local351
  2. เปิดระบบปกติ -> ต้องไม่ค้างที่ "กำลังเปิดระบบ…"
  3. F12 > Network > Offline แล้ว Reload
     -> ต้องขึ้น "เปิดระบบไม่สำเร็จ" + ปุ่ม [ลองใหม่]  *** ไม่หมุนค้าง ***
  4. เปิดเน็ตกลับ กด [ลองใหม่] -> เข้าระบบได้ปกติ
  5. F12 > Console -> ต้องไม่มี 404 ของไฟล์ .js หรือ .css
