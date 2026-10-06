// TRANSPORT NJ — runtime config (loaded by index.html AND sw.js via importScripts)
// APP_VERSION: build label (display / audit info only — never blocks login)
// — change it on every release, then announce from ตั้งค่า → ประกาศเวอร์ชัน (SUPER_ADMIN).
self.TNJ_CONFIG = {
  APP_NAME: 'TRANSPORT NJ',
  APP_CODE: 'transport',
  APP_VERSION: 'local134',
  SUPABASE_URL: 'https://sytgqjglcnsabcszbngg.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp',
  FILES_FN: 'https://sytgqjglcnsabcszbngg.supabase.co/functions/v1/transportnj-files',
  VERSION_CHECK_SEC: 60,
  SESSION_KEY: 'tnj.session.v1',
};
