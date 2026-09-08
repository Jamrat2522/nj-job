-- ═══════════════════════════════════════════════════════════════════════════
-- SET_DEPLOY_BUILD_local343.sql
-- ตั้ง Deploy Build = 1.4.1-local343  (Force Update ระดับ BUILD KEY · RUN-46)
--
-- *** ไม่ใช่ Migration *** เขียนค่าเดียว : njacc_settings คีย์ 'deploy_build'
-- ไม่สร้าง/ไม่แก้ ฟังก์ชัน · ตาราง · Business Logic ใด ๆ
--
-- ── ทำไมต้องมี DO block ครอบ ────────────────────────────────────────────────
--   njacc_set_deploy_build() -> njacc_req_profile() -> auth.uid()
--   auth.uid() อ่านจาก current_setting('request.jwt.claim.sub')
--   Supabase SQL Editor รันด้วย role postgres และไม่มี JWT ของผู้ใช้
--   -> auth.uid() = NULL -> RAISE 'NJACC_NO_PROFILE'
--   จึงต้อง set_config(..., true) ประกาศตัวตนเฉพาะใน transaction นี้ก่อนเรียก
--   (ทดสอบแล้วว่า resolve เป็น SUPER_ADMIN ได้จริง · หมดผลทันทีที่จบ block)
--
--   *** ใส่ auth_user_id ของตัวเอง ***
--     Jamrat Phathep       (0001 · jamrat30)    f1edba74-b608-437d-9c82-aafa7bcf3b34
--     SOONTAREE TIRANUKUL  (0002 · soontaree30) 3d9b7b2b-5072-48e1-922d-7930bd85bc32
--
-- ╔═════════════════════════════════════════════════════════════════════════╗
-- ║  ⚠️  รันหลังอัปโหลดไฟล์ครบแล้วเท่านั้น                                    ║
-- ║   1) DEPLOY_BATCH_1 (5 ไฟล์ assets) -> Commit                           ║
-- ║   2) DEPLOY_BATCH_2 (index.html · ต้องเป็นตัวสุดท้าย) -> Commit          ║
-- ║   3) จึงรันไฟล์นี้                                                        ║
-- ╚═════════════════════════════════════════════════════════════════════════╝
--
-- idempotent : รันซ้ำได้ · ไม่มี DROP / DELETE / TRUNCATE / ALTER
-- ═══════════════════════════════════════════════════════════════════════════

-- ── ขั้นที่ 1 · ค่าก่อนตั้ง (READ ONLY) ──────────────────────────────────────
SELECT 'BEFORE · deploy_build' AS check_name,
  coalesce((SELECT value FROM public.njacc_settings WHERE key='deploy_build'),'(ยังไม่เคยตั้ง)') AS result
UNION ALL SELECT 'BEFORE · app_status() ที่ Frontend อ่านจริง',
  public.njacc_app_status()::text;

-- ── ขั้นที่ 2 · ตั้งค่า ──────────────────────────────────────────────────────
DO $$
DECLARE
  v_uid   uuid := 'f1edba74-b608-437d-9c82-aafa7bcf3b34';  -- << Jamrat Phathep
  v_build text := '1.4.1-local343';
  pr      public.njacc_profiles;
  v_out   text;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', v_uid::text, true);
  pr := public.njacc_req_profile();
  IF pr.role <> 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'หยุด : % ไม่ใช่ SUPER_ADMIN (role=%)', pr.full_name, pr.role;
  END IF;
  v_out := public.njacc_set_deploy_build(v_build);
  RAISE NOTICE 'ตั้ง deploy_build = % โดย % (%)', v_out, pr.full_name, pr.role;
END $$;

-- ── ขั้นที่ 3 · VERIFY (READ ONLY) — ต้อง PASS ทุกข้อ ───────────────────────
SELECT 'V1 deploy_build = 1.4.1-local343' AS check_name,
  CASE WHEN (SELECT value FROM public.njacc_settings WHERE key='deploy_build')='1.4.1-local343'
       THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'V2 njacc_app_status() คืน deploy_build ตัวใหม่',
  CASE WHEN (public.njacc_app_status() ->> 'deploy_build')='1.4.1-local343'
       THEN 'PASS'
       ELSE 'FAIL — ได้ "' || coalesce(public.njacc_app_status() ->> 'deploy_build','(null)') || '"' END
UNION ALL SELECT 'V3 deploy_version เดิมไม่ถูกแตะ (ต้องยังเป็น 1.4.1)',
  CASE WHEN (SELECT value FROM public.njacc_settings WHERE key='deploy_version')='1.4.1'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V4 maintenance_active ไม่ถูกแตะ (ต้องยังเป็น false)',
  CASE WHEN (SELECT value FROM public.njacc_settings WHERE key='maintenance_active')='false'
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'V5 njacc_settings ต้องมี 5 คีย์',
  CASE WHEN (SELECT count(*) FROM public.njacc_settings)=5
       THEN 'PASS' ELSE 'ตรวจเพิ่ม — มี '||(SELECT count(*)::text FROM public.njacc_settings)||' คีย์' END
UNION ALL SELECT 'V6 audit log SET_DEPLOY_BUILD ล่าสุด',
  coalesce((SELECT to_char(a.created_at,'YYYY-MM-DD HH24:MI:SS')
              ||' · '||coalesce(a.entity_id,'-')
              ||' · โดย '||coalesce(p.full_name,'(ไม่ทราบ)')
     FROM public.njacc_audit_logs a
     LEFT JOIN public.njacc_profiles p ON p.id=a.profile_id
    WHERE a.action='SET_DEPLOY_BUILD' ORDER BY a.created_at DESC LIMIT 1),'(ไม่พบ)')
UNION ALL SELECT 'V7 คีย์ทั้งหมดใน njacc_settings',
  (SELECT string_agg(key||' = '||left(value,30),'  ·  ' ORDER BY key) FROM public.njacc_settings);

-- ── หลังรัน ตรวจที่หน้าเว็บ ─────────────────────────────────────────────────
--   1) Hard Refresh (Ctrl+F5)
--   2) ป้ายเวอร์ชันมุมบนซ้ายต้องเป็น  v1.4.1-local343
--   3) เปิดงานใหม่ (DOCUMENT) : ต่อจาก "ชื่อใบอนุญาต" ต้องมีกรอบ "ออกใบเสร็จ"
--      ที่มี Checkbox 2 ตัว (Lift On / Wharf · Storage Charge)
--      และช่องหมายเหตุ 2 ช่องเดิมในแถวที่ 3 ต้องหายไปแล้ว
--      ติ๊ก -> บันทึก -> เปิดงานเดิมใหม่ ค่าต้องยังอยู่
--   4) เปิดงานใหม่ > ช่อง "ลูกค้า *" : พิมพ์ CODE แล้วเลือกลูกค้า
--      กล่องข้อมูลลูกค้าต้อง "ลอยทับ" — ช่องด้านล่างต้องไม่ขยับแม้แต่แถวเดียว
--   4) ปุ่มสลับโหมดทั้ง 3 หน้า (REPORT ใบหัก ณ ที่จ่าย · CLOSE JOB · RECEIPT)
--      ปุ่มที่เลือก = วงกลมจุดกลางสีทอง · ที่ไม่ได้เลือก = วงกลมโปร่งขอบขาว
--      CLOSE JOB : SERVICE น้ำเงิน / ADVANCE ม่วง และ Badge จำนวนต้องยังอยู่
--      RECEIPT   : รอรับชำระ น้ำเงิน / ใบเสร็จที่ออกแล้ว เขียว
--      เปิดเอกสาร 50 ทวิ -> ต้องเห็นปุ่ม พิมพ์หน้า 1-4 และ Print / Save PDF ทั้งหมด
--      กด "พิมพ์หน้า 2" -> Print Preview ของเบราว์เซอร์ต้องมี 1 หน้า และเป็นหน้า 2
--   4) Console ต้องไม่มี 404 / undefined / missing RPC
