/* ============================================================
   HR V2 — Environment Configuration (กฎข้อ 50)

   ไฟล์นี้เป็น "ไฟล์เดียว" ที่ต้องแก้เมื่อสลับระหว่าง Staging กับ Production
   ห้าม Hardcode ค่าเหล่านี้ลงใน index.html, app.js, Module, Service,
   Repository, CSS หรือ Inline Script ใด ๆ

   ⚠ ไฟล์นี้เบราว์เซอร์และผู้ใช้เปิดอ่านได้โดยตรง
   ห้ามใส่: Service Role Key · Database Password · Secret Key ·
            Access Token · Refresh Token
   ใส่ได้เฉพาะค่า Public / Publishable ที่ออกแบบมาให้ใช้ในเบราว์เซอร์

   การแก้ไฟล์นี้ไม่ต้อง Build ใหม่ — อัปโหลดทับไฟล์เดียวแล้วรีเฟรช
   ============================================================ */

/* ---------- 1) ชื่อ Environment ---------- */
/* ค่าที่รับได้: 'staging' | 'production' */
window.NJHR_ENV_NAME = 'production';

/* ---------- 2) Build Version ---------- */
/* ใช้แสดงในหน้า Diagnostic เท่านั้น ห้ามแสดงบน Sidebar/Header */
window.NJHR_BUILD_VERSION = 'njhr-v2-61e98b2b';

/* ---------- 3) Supabase ---------- */
window.NJHR_SUPABASE_URL      = 'https://sytgqjglcnsabcszbngg.supabase.co';
window.NJHR_SUPABASE_ANON_KEY = 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp';

/* ---------- 4) API Base URL ---------- */
/* เว้นว่าง = ใช้ Edge Function ใต้ NJHR_SUPABASE_URL ตามพฤติกรรมเดิมของ V1 */
window.NJHR_API_BASE_URL = '';

/* ---------- 5) Feature Flag (เฉพาะที่ไม่ใช่ข้อมูลลับ) ---------- */
/* รอบ Clone Baseline: ว่างไว้ ไม่มี Flag ใดถูกใช้งานจริง */
window.NJHR_FEATURE_FLAGS = {};

/* ---------- 6) การกันต่อผิด Environment (ข้อ 50.11 / 50.12) ---------- */
/* Project ID ที่อนุญาตของแต่ละ Environment — เป็นค่าที่เปิดเผยได้ ไม่ใช่ความลับ
   Gate จะยอมให้ต่อได้เฉพาะ Project ที่ตรงกับ NJHR_ENV_NAME เท่านั้น */
window.NJHR_STAGING_PROJECT_ID    = '__STAGING_PROJECT_ID__';
window.NJHR_PRODUCTION_PROJECT_ID = 'sytgqjglcnsabcszbngg';

/* ต้องตั้งเป็น true เท่านั้นจึงจะยอมให้เชื่อมต่อ Production ได้
   ถ้า NJHR_ENV_NAME = 'staging' แต่ URL ชี้ไป Production ระบบจะหยุดทันที */
window.NJHR_ALLOW_PRODUCTION = true;

/* ---------- 7) alias อ่านอย่างเดียวสำหรับ Diagnostic ---------- */
/* ค่าจริงที่ระบบใช้คือ window.NJHR_* ข้างบน (app.js อ่านจากตัวแปรเหล่านั้นโดยตรง)
   ตัวนี้เป็นสำเนาไว้ดูใน Console เท่านั้น ไม่มีโค้ดใดพึ่งพา แก้ที่นี่ไม่มีผล */
window.NJHR_CONFIG = {
  env:                 window.NJHR_ENV_NAME,
  build:               window.NJHR_BUILD_VERSION,
  supabaseUrl:         window.NJHR_SUPABASE_URL,
  supabaseAnonKey:     window.NJHR_SUPABASE_ANON_KEY,
  apiBaseUrl:          window.NJHR_API_BASE_URL,
  featureFlags:        window.NJHR_FEATURE_FLAGS,
  stagingProjectId:    window.NJHR_STAGING_PROJECT_ID,
  productionProjectId: window.NJHR_PRODUCTION_PROJECT_ID,
  allowProduction:     window.NJHR_ALLOW_PRODUCTION
};

/* ---------- 8) ตัวยืนยันว่าไฟล์นี้ถูกโหลดและทำงานครบ ---------- */
/* ต้องเป็นบรรทัดสุดท้ายเสมอ — ถ้าไฟล์โหลดไม่สำเร็จหรือถูกตัดกลางคัน
   ค่านี้จะไม่ถูกตั้ง แล้ว Safety Gate ใน index.html จะหยุดระบบด้วยรหัส CFG-001 */
window.NJHR_CONFIG_FILE_OK = true;


/* ============================================================
   PRODUCTION — เมื่อ Baseline ผ่านและได้รับอนุมัติแล้ว
   ให้แก้ 4 บรรทัดนี้แทน โดยไม่ต้องแตะไฟล์อื่นเลย
   (NJHR_STAGING_PROJECT_ID ปล่อยไว้ตามเดิมได้ Gate จะไม่ใช้เมื่อ ENV = production)

   window.NJHR_ENV_NAME         = 'production';
   window.NJHR_SUPABASE_URL     = 'https://sytgqjglcnsabcszbngg.supabase.co';
   window.NJHR_SUPABASE_ANON_KEY= '__PRODUCTION_PUBLISHABLE_KEY__';
   window.NJHR_ALLOW_PRODUCTION = true;
   ============================================================ */

/* ---------- Web Push (VAPID) ----------
   ใส่ "Public Key" อย่างเดียว — คีย์นี้เปิดเผยได้ตามสเปก Web Push
   ⚠ Private Key ห้ามอยู่ในไฟล์นี้เด็ดขาด · เก็บที่ Supabase Edge Function Secrets
     (VAPID_PRIVATE_KEY) เท่านั้น
   ปล่อยว่างไว้ = ปุ่มเปิดการแจ้งเตือนจะแจ้งว่า "ยังไม่ได้ตั้งค่า Push" และระบบทำงานปกติ */
window.NJHR_VAPID_PUBLIC_KEY = 'BPlHZfh9omJ9HQQ4MsUXlsGsc4KCeMPjfqQA63OD6n4AF9lwflsCxFLopbkvMhmUIYnT9FQ96UcXH6uNv5_PkH4';
