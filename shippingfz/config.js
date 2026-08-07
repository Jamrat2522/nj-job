/* ============================================================
   SHIPPING FZ — Config
   ============================================================
   ใช้ไฟล์ชุดเดียวกันได้ทั้ง Local และ Production
   index.html จะอ่านค่าจากไฟล์นี้ · ถ้าไฟล์นี้หายจะใช้ค่า fallback ที่ฝังไว้ใน index.html

   ⚠️ ใส่ได้เฉพาะ Publishable key (sb_publishable_... / anon key) เท่านั้น
      ห้ามใส่ Service Role Key เด็ดขาด — ไฟล์นี้ผู้ใช้ทุกคนดาวน์โหลดอ่านได้
   ============================================================ */
window.SFZ_CONFIG = {
  supabaseUrl:            'https://sytgqjglcnsabcszbngg.supabase.co',
  supabasePublishableKey: 'sb_publishable_e2yN3kPpkQ0dzi-K2EBa8g_hlo1gUYp'
};
