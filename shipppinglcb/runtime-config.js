/* ============================================================
   MASSENGER V3 — RUNTIME CONFIG  (Phase 2 scaffold)
   ------------------------------------------------------------
   ควบคุมค่าโดยไม่ต้อง build/deploy ใหม่ — แก้ไฟล์นี้ที่ hosting ได้ทันที
   ⚠️ Phase 2: ประกาศค่าเท่านั้น "ยังไม่ wire เข้า app.js"
       (การเชื่อม guard/kill-switch/pagination เข้า logic = Phase ถัดไป)
       จึงไม่กระทบพฤติกรรมเดิมของระบบใด ๆ
   ============================================================ */
window.RUNTIME_CONFIG = {
  ENVIRONMENT:        "uat",     // uat | production
  READ_ONLY:          false,     // false = เขียนข้อมูลได้ (live) · true = อ่านอย่างเดียว (UAT)
  KILL_SWITCH:        false,     // true = ปิด V3 + ปิด realtime + แจ้งเตือน + redirect
  KILL_REDIRECT_URL:  "",        // ปลายทางเมื่อ KILL_SWITCH (ว่าง = หน้า maintenance ในตัว)
  DESKTOP_PAGE_SIZE:  100,
  MOBILE_PAGE_SIZE:   30,
  ADMIN_MOBILE_PAGE_SIZE: 50,
  LOG_LEVEL:          "info"      // debug | info | warn | error | silent
};

// Feature flag — เปิด/ปิด module รายส่วน (ยังไม่ wire ใน Phase 2)
window.FEATURES = {
  dashboard: true,
  export:    true,
  users:     true,
  documents: true
};

/* READ_ONLY allowlist (อ้างอิงสำหรับ Phase ถัดไปตอน wire guard):
   อนุญาต : select · login · dashboard · search · timeline · export
   บล็อก  : insert · update · delete · upsert · upload · RPC ที่เขียนข้อมูล  */
