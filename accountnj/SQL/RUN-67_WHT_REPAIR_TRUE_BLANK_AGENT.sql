-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-67  ·  V.343  ·  ซ่อม Historical Data : has_acting_agent = true แต่ agent_* ว่าง
-- ═══════════════════════════════════════════════════════════════════════════
-- ที่มาของปัญหา (พิสูจน์จาก Source จริง)
--   ก่อน V.340 : withholding-page.js ตั้ง ed.has_agent = true ให้เอกสารโหมด
--   ACTING_AGENT ตั้งแต่เปิดฟอร์ม แต่ค่า Default ของ N.J. ถูกเติมเฉพาะ
--   "ตอนผู้ใช้ติ๊ก checkbox เอง" (applyAgentDefaults ใน onchange · V.309)
--   -> ผู้ใช้ที่ไม่ได้แตะ checkbox เลย บันทึกออกมาเป็น
--        has_acting_agent = true  แต่  agent_name/tax_id/branch/address = NULL
--   V.340 แก้ฝั่งฟอร์มสำหรับ "เอกสารใหม่" · V.343 แก้ให้ครอบ "เอกสารเดิม" ด้วย
--   ไฟล์นี้ซ่อมข้อมูลที่ค้างอยู่ใน Database ให้ตรงกับที่ฟอร์มแสดง
--
-- *** ขอบเขตที่อนุญาตให้แก้ (แคบที่สุด) ***
--   has_acting_agent IS TRUE
--   AND ทั้ง 4 ช่องว่าง *** ครบทุกช่อง *** :
--       agent_name · agent_tax_id · agent_branch · agent_address
--   -> แถวที่มีข้อมูลแม้เพียงช่องเดียว *** ไม่ถูกแตะเด็ดขาด ***
--      (ตัวแทนที่ผู้ใช้กรอกเอง ปลอดภัย 100% · ไม่มีการเดาว่าเป็น N.J.)
--
-- *** สิ่งที่ไฟล์นี้ไม่ทำ ***
--   ไม่มี DELETE / DROP / TRUNCATE / ALTER TABLE
--   ไม่แตะ has_acting_agent (ค่าเดิมเป็น true อยู่แล้ว ไม่เปลี่ยน)
--   ไม่แตะ certificate_no · reference_no · วันที่ · จำนวนเงิน · status
--   ไม่แตะ payer_* / payee_* / items / RUN-66 / njacc_list_wht
--   ไม่แตะแถวที่ has_acting_agent = false หรือ NULL
--
-- ค่าที่เติม  : ตรงกับ ISSUER ใน assets/js/config/company-doc.js ทุกตัวอักษร
-- Idempotent : รันซ้ำได้ · รอบที่ 2 จะไม่มีแถวเข้าเงื่อนไขแล้ว (UPDATE 0 แถว)
-- Transaction: PREFLIGHT/APPLY/VERIFY อยู่ใน BEGIN...COMMIT เดียวกัน
-- ═══════════════════════════════════════════════════════════════════════════


-- ══ 1. PREFLIGHT (READ ONLY — รันก่อน แล้วดูตัวเลขก่อนตัดสินใจ) ═════════════
SELECT 'P1 ตารางมีคอลัมน์ครบ 5 ตัวที่ต้องใช้' AS check_item,
  CASE WHEN (SELECT count(*) FROM information_schema.columns
              WHERE table_schema='public' AND table_name='njacc_withholding_docs'
                AND column_name IN ('has_acting_agent','agent_name','agent_tax_id',
                                    'agent_branch','agent_address')) = 5
  THEN 'PASS' ELSE 'STOP — โครงสร้างไม่ตรง ห้ามรันต่อ' END AS result
UNION ALL
SELECT 'P2 แถวที่เข้าเกณฑ์ซ่อม (true + ว่างครบ 4 ช่อง)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs
    WHERE has_acting_agent IS TRUE
      AND coalesce(btrim(agent_name),'')    = ''
      AND coalesce(btrim(agent_tax_id),'')  = ''
      AND coalesce(btrim(agent_branch),'')  = ''
      AND coalesce(btrim(agent_address),'') = '')
UNION ALL
SELECT 'P3 แถวที่ true แต่มีข้อมูลบางช่อง *** ห้ามแตะ ***',
  (SELECT count(*)::text FROM public.njacc_withholding_docs
    WHERE has_acting_agent IS TRUE
      AND NOT (coalesce(btrim(agent_name),'')    = ''
           AND coalesce(btrim(agent_tax_id),'')  = ''
           AND coalesce(btrim(agent_branch),'')  = ''
           AND coalesce(btrim(agent_address),'') = ''))
UNION ALL
SELECT 'P4 แถวที่ has_acting_agent = false *** ห้ามแตะ ***',
  (SELECT count(*)::text FROM public.njacc_withholding_docs WHERE has_acting_agent IS FALSE)
UNION ALL
SELECT 'P5 แถวที่ has_acting_agent = NULL (Legacy) *** ห้ามแตะ ***',
  (SELECT count(*)::text FROM public.njacc_withholding_docs WHERE has_acting_agent IS NULL)
UNION ALL
SELECT 'P6 จำนวนเอกสารทั้งหมด (ต้องเท่าเดิมหลังรัน)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs)
UNION ALL
SELECT 'P7 ลายเซ็นข้อมูลของแถวที่ *** ห้ามแตะ *** (ต้องเท่าเดิมหลังรัน)',
  (SELECT coalesce(md5(string_agg(
      id::text||'|'||coalesce(has_acting_agent::text,'N')||'|'||coalesce(agent_name,'')||'|'
      ||coalesce(agent_tax_id,'')||'|'||coalesce(agent_branch,'')||'|'||coalesce(agent_address,''),
      E'\n' ORDER BY id)),'(ไม่มีแถว)')
     FROM public.njacc_withholding_docs
    WHERE has_acting_agent IS NOT TRUE
       OR NOT (coalesce(btrim(agent_name),'')    = ''
           AND coalesce(btrim(agent_tax_id),'')  = ''
           AND coalesce(btrim(agent_branch),'')  = ''
           AND coalesce(btrim(agent_address),'') = ''));


-- ══ 2. APPLY (Transaction · Guarded · Idempotent) ══════════════════════════
BEGIN;

DO $repair$
DECLARE
  c_name   constant text := 'N.J. LOGISTICS & FRUITS CO., LTD.';
  c_tax    constant text := '0205557004651';
  c_branch constant text := '00000';
  c_addr   constant text := '62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)';
  n_before int;
  n_keep   int;
  sig_before text;
  sig_after  text;
  n_upd    int;
  n_total_before int;
  n_total_after  int;
BEGIN
  /* ── นับ/บันทึกลายเซ็นก่อนแก้ ── */
  SELECT count(*) INTO n_before FROM public.njacc_withholding_docs
   WHERE has_acting_agent IS TRUE
     AND coalesce(btrim(agent_name),'')='' AND coalesce(btrim(agent_tax_id),'')=''
     AND coalesce(btrim(agent_branch),'')='' AND coalesce(btrim(agent_address),'')='';

  SELECT count(*) INTO n_total_before FROM public.njacc_withholding_docs;

  SELECT count(*), coalesce(md5(string_agg(
           id::text||'|'||coalesce(has_acting_agent::text,'N')||'|'||coalesce(agent_name,'')||'|'
           ||coalesce(agent_tax_id,'')||'|'||coalesce(agent_branch,'')||'|'||coalesce(agent_address,''),
           E'\n' ORDER BY id)),'(none)')
    INTO n_keep, sig_before
    FROM public.njacc_withholding_docs
   WHERE has_acting_agent IS NOT TRUE
      OR NOT (coalesce(btrim(agent_name),'')='' AND coalesce(btrim(agent_tax_id),'')=''
          AND coalesce(btrim(agent_branch),'')='' AND coalesce(btrim(agent_address),'')='');

  RAISE NOTICE 'RUN-67 BEFORE : เข้าเกณฑ์ซ่อม % แถว · ห้ามแตะ % แถว · ทั้งหมด % แถว',
    n_before, n_keep, n_total_before;

  IF n_before = 0 THEN
    RAISE NOTICE 'RUN-67 : ไม่มีแถวเข้าเงื่อนไข — ข้าม (idempotent)';
  ELSE
    /* ── UPDATE ด้วย predicate เดียวกันเป๊ะกับตอนนับ ──
       *** เขียนเฉพาะ 4 คอลัมน์นี้ *** ไม่แตะ has_acting_agent และคอลัมน์อื่นเลย */
    UPDATE public.njacc_withholding_docs
       SET agent_name    = c_name,
           agent_tax_id  = c_tax,
           agent_branch  = c_branch,
           agent_address = c_addr
     WHERE has_acting_agent IS TRUE
       AND coalesce(btrim(agent_name),'')    = ''
       AND coalesce(btrim(agent_tax_id),'')  = ''
       AND coalesce(btrim(agent_branch),'')  = ''
       AND coalesce(btrim(agent_address),'') = '';

    GET DIAGNOSTICS n_upd = ROW_COUNT;
    RAISE NOTICE 'RUN-67 : ซ่อมไป % แถว', n_upd;

    IF n_upd <> n_before THEN
      RAISE EXCEPTION 'RUN-67 : แก้ไป % แถว แต่คาดไว้ % แถว — ยกเลิกทั้งหมด', n_upd, n_before;
    END IF;
  END IF;

  /* ── Guard 1 : แถวที่ห้ามแตะ ต้องเหมือนเดิมทุกตัวอักษร ── */
  SELECT coalesce(md5(string_agg(
           id::text||'|'||coalesce(has_acting_agent::text,'N')||'|'||coalesce(agent_name,'')||'|'
           ||coalesce(agent_tax_id,'')||'|'||coalesce(agent_branch,'')||'|'||coalesce(agent_address,''),
           E'\n' ORDER BY id)),'(none)')
    INTO sig_after
    FROM public.njacc_withholding_docs
   WHERE id IN (SELECT id FROM public.njacc_withholding_docs
                 WHERE has_acting_agent IS NOT TRUE
                    OR agent_name IS DISTINCT FROM c_name
                    OR agent_tax_id IS DISTINCT FROM c_tax);

  /* ── Guard 2 : จำนวนแถวรวมต้องเท่าเดิม (พิสูจน์ว่าไม่มีการลบ/เพิ่ม) ── */
  SELECT count(*) INTO n_total_after FROM public.njacc_withholding_docs;
  IF n_total_after <> n_total_before THEN
    RAISE EXCEPTION 'RUN-67 : จำนวนแถวเปลี่ยนจาก % เป็น % — ยกเลิกทั้งหมด',
      n_total_before, n_total_after;
  END IF;

  /* ── Guard 3 : ต้องไม่เหลือแถว true + ว่างครบอีก ── */
  IF EXISTS (SELECT 1 FROM public.njacc_withholding_docs
              WHERE has_acting_agent IS TRUE
                AND coalesce(btrim(agent_name),'')='' AND coalesce(btrim(agent_tax_id),'')=''
                AND coalesce(btrim(agent_branch),'')='' AND coalesce(btrim(agent_address),'')='') THEN
    RAISE EXCEPTION 'RUN-67 : ยังเหลือแถว true + ว่างครบ — ยกเลิกทั้งหมด';
  END IF;

  RAISE NOTICE 'RUN-67 : ผ่าน Guard ครบ — พร้อม COMMIT';
END $repair$;

COMMIT;


-- ══ 3. VERIFY (READ ONLY · รันหลัง COMMIT) ═════════════════════════════════
SELECT 'V1 ไม่เหลือแถว true + ว่างครบ 4 ช่อง' AS check_name,
  CASE WHEN (SELECT count(*) FROM public.njacc_withholding_docs
              WHERE has_acting_agent IS TRUE
                AND coalesce(btrim(agent_name),'')='' AND coalesce(btrim(agent_tax_id),'')=''
                AND coalesce(btrim(agent_branch),'')='' AND coalesce(btrim(agent_address),'')='') = 0
  THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 แถวที่ถูกซ่อม (ได้ค่า N.J. ครบ 4 ช่อง)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs
    WHERE has_acting_agent IS TRUE
      AND agent_name    = 'N.J. LOGISTICS & FRUITS CO., LTD.'
      AND agent_tax_id  = '0205557004651'
      AND agent_branch  = '00000'
      AND agent_address = '62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)')
UNION ALL
SELECT 'V3 แถว true ที่เป็นตัวแทนของผู้ใช้เอง (ต้องเท่ากับ P3 เดิม)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs
    WHERE has_acting_agent IS TRUE
      AND agent_name IS DISTINCT FROM 'N.J. LOGISTICS & FRUITS CO., LTD.')
UNION ALL
SELECT 'V4 has_acting_agent = false (ต้องเท่ากับ P4 เดิม)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs WHERE has_acting_agent IS FALSE)
UNION ALL
SELECT 'V5 has_acting_agent = NULL (ต้องเท่ากับ P5 เดิม)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs WHERE has_acting_agent IS NULL)
UNION ALL
SELECT 'V6 จำนวนเอกสารทั้งหมด (ต้องเท่ากับ P6 เดิม)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs)
UNION ALL
SELECT 'V7 ไม่มีแถวไหนถูกเปลี่ยน has_acting_agent (true คงเป็น true)',
  (SELECT count(*)::text FROM public.njacc_withholding_docs WHERE has_acting_agent IS TRUE);

-- ตัวอย่างผลลัพธ์ที่หน้ารายการจะแสดง (READ ONLY)
SELECT coalesce(has_acting_agent::text,'NULL') AS flag,
       CASE WHEN coalesce(btrim(agent_name),'')='' THEN 'ว่าง' ELSE 'มีชื่อ' END AS agent_name_ใน_db,
       CASE WHEN has_acting_agent IS TRUE  THEN coalesce(nullif(btrim(agent_name),''),'(fallback ISSUER)')
            WHEN has_acting_agent IS FALSE THEN '-'
            ELSE coalesce(nullif(btrim(agent_name),''),'-') END AS หน้ารายการแสดง,
       count(*) AS จำนวน
  FROM public.njacc_withholding_docs
 GROUP BY 1,2,3
 ORDER BY 1,2;


-- ══ 4. RECOVERY NOTE ══════════════════════════════════════════════════════
-- ถ้า APPLY หยุดกลางทางด้วย RAISE EXCEPTION :
--   ทั้ง Transaction ถูก ROLLBACK อัตโนมัติ -> ข้อมูลกลับเป็นเหมือนเดิมทุกแถว
--   ให้ส่งข้อความ EXCEPTION กลับมาก่อน *** ห้ามแก้ SQL เองเพื่อให้ผ่าน ***
--
-- ถ้ารันสำเร็จแล้วต้องการย้อนกลับ :
--   แถวที่ถูกแก้คือแถวที่ตอนนี้มีค่าตรงกับ N.J. ทั้ง 4 ช่องพอดี
--   ย้อนกลับได้ด้วยการตั้ง 4 ช่องนั้นกลับเป็น NULL เฉพาะแถวที่ตรงทั้งชุด :
--     UPDATE public.njacc_withholding_docs
--        SET agent_name=NULL, agent_tax_id=NULL, agent_branch=NULL, agent_address=NULL
--      WHERE has_acting_agent IS TRUE
--        AND agent_name    = 'N.J. LOGISTICS & FRUITS CO., LTD.'
--        AND agent_tax_id  = '0205557004651'
--        AND agent_branch  = '00000'
--        AND agent_address = '62/165 Moo 10, T. Thungsukla, A. Sriracha, Chonburi 20230 (HEAD OFFICE)';
--   *** ข้อควรระวัง *** คำสั่งย้อนกลับนี้จะกระทบเอกสารที่ผู้ใช้เลือก N.J.
--   เป็นตัวแทนเองด้วย (ค่าเหมือนกันทุกช่อง แยกจากกันไม่ได้หลัง COMMIT)
--   -> ถ้าจะย้อนกลับ ควรทำทันทีหลังรัน และเทียบกับ V2 ว่าจำนวนตรงกัน
--
-- ฝั่ง Frontend :
--   V.343 มี fallback ISSUER ที่หน้ารายการอยู่แล้ว (whtAgentView)
--   -> ไม่รัน RUN-67 ก็ไม่พัง หน้าจอแสดงถูกต้อง แต่ *** ข้อมูลใน Database
--      ยังว่างอยู่ *** ซึ่งจะไปโผล่ที่ Export / รายงาน / เอกสารพิมพ์
--   -> แนะนำให้รัน เพื่อให้ Database ตรงกับสิ่งที่ผู้ใช้เห็น
