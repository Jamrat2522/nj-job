/* BILLING NJ — central config · APP_VERSION ต้องตรงกับ deploy_version ใน njacc_settings ทุก Release */
export const APP_VERSION = '1.4.0';
export const APP_NAME = 'BILLING NJ';
export const SUPABASE_URL = 'https://sytgqjglcnsabcszbngg.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp'; /* publishable เท่านั้น */
/* ไม่มี mapping ตัวตนภายในในฝั่งเบราว์เซอร์ — การ resolve ทำที่ Edge Function เท่านั้น */
export const PAGE_SIZES = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
export const MAINT_MESSAGE = 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที';
export const v = (p) => p + '?v=' + APP_VERSION; /* cache-bust ทุก dynamic import */
