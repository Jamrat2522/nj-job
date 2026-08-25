BILLING NJ — SQL RUN STATUS
ตรวจสภาพ Production จริงเมื่อ 17/08/2026 (READ ONLY · has_function_privilege /
information_schema / pg_proc)
═══════════════════════════════════════════════════════════════════

*** ไม่มี SQL ที่ต้องรันแล้ว — 01–07 APPLIED ครบทั้งหมด ห้ามรันซ้ำ ***
*** sql/LEGACY-DO-NOT-RUN/ ห้ามรัน ***
*** sql/ และ sql/dev/ ที่เหลือ = migration เก่าที่รันไปแล้ว ห้ามรันซ้ำ ***


═══════════════════════════════════════════════════════════════════
สถานะแต่ละไฟล์
═══════════════════════════════════════════════════════════════════
  01_RUN_3B_CREDIT_NOTE_FIX_GRANTS.sql   ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  02_RUN-01_FINAL_DOCUMENT_NUMBERS.sql   ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  03_RUN-03_FINAL_RECEIPT_PAYMENT.sql    ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  04_RUN-02_FINAL_CREDIT_NOTE.sql        ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  05_RUN-04_FINAL_RECEIPT_FIELDS.sql     ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  06_RUN-05_WHT_CERTIFICATE.sql          ✅ ALREADY APPLIED (17/08/2026) — VERIFY ONLY
  07_RUN-01_025_DOCUMENT_QUEUE_AND_CLOSE.sql
                                         ✅ ALREADY APPLIED (18/08/2026) — VERIFY ONLY

  => *** ไม่มีไฟล์ที่ต้องรันแล้ว *** ทุกไฟล์ APPLIED ครบ
     ห้ามรันซ้ำทุกไฟล์

  ⚠️ หมายเหตุการรัน 06 :
     SECTION 2 (MIGRATION) รันสำเร็จและ COMMIT แล้ว
     แต่ SECTION 3 (VERIFY) เดิมมีบั๊ก syntax ที่ V13 :
         ERROR 42601: subquery must return only one column
     สาเหตุ: เขียน  (a, b) IS DISTINCT FROM (SELECT x, y FROM ...)
             PostgreSQL ไม่รับ row-comparison กับ subquery หลายคอลัมน์
     *** VERIFY อยู่หลัง COMMIT จึงไม่กระทบข้อมูลและไม่ rollback ***
     ไฟล์ในชุดนี้แก้ V13 เป็น scalar subquery แยกคอลัมน์แล้ว
     ต้องการยืนยันผลให้รันเฉพาะ SECTION 3 ซ้ำได้ (READ ONLY)

     ผล VERIFY จริงหลังแก้ (รันบน Production แล้ว 17/08/2026) :
       V1–V12 · V11a–V11h   PASS ทุกแถว
       V13 · V14 · V16       PASS (mismatched = 0 ทั้งหมด)
       V15 ข้อมูล            wht_docs=0 items=0 wht_counter=ยังไม่มี


═══════════════════════════════════════════════════════════════════
หลักฐานว่า 01–05 รันไปแล้ว (ตรวจสดบน Production)
═══════════════════════════════════════════════════════════════════
  01  njacc_next_credit_note_no      anon=false  authenticated=false
      njacc_credit_item_remaining    anon=false  authenticated=false
  02  ฟังก์ชัน njacc_next_month_doc_no          มีอยู่จริง
  03  ฟังก์ชัน njacc_invoice_outstanding        มีอยู่จริง
      ฟังก์ชัน njacc_receipt_chargeable         มีอยู่จริง
  04  คอลัมน์ njacc_credit_note_items.original_amount  มีอยู่จริง
  05  njacc_list_receipts คืน wht_breakdown     มีอยู่จริง

  ตรวจซ้ำเองได้ด้วยคำสั่งนี้ (READ ONLY · ไม่เปลี่ยนอะไร) :

      SELECT 'njacc_next_month_doc_no'  AS obj,
             to_regprocedure('public.njacc_next_month_doc_no(text,text,date)') IS NOT NULL AS present
      UNION ALL SELECT 'njacc_invoice_outstanding',
             to_regprocedure('public.njacc_invoice_outstanding(uuid)') IS NOT NULL
      UNION ALL SELECT 'njacc_receipt_chargeable',
             to_regprocedure('public.njacc_receipt_chargeable(text)') IS NOT NULL
      UNION ALL SELECT 'credit_note_items.original_amount',
             EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema='public' AND table_name='njacc_credit_note_items'
                        AND column_name='original_amount')
      UNION ALL SELECT 'list_receipts.wht_breakdown',
             (SELECT pg_get_functiondef(p.oid) LIKE '%wht_breakdown%'
                FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
               WHERE n.nspname='public' AND p.proname='njacc_list_receipts');

  ได้ true ครบทุกแถว -> ข้าม 01–05 ไปที่ 06 ได้เลย


═══════════════════════════════════════════════════════════════════
✅ ALREADY APPLIED · 06_RUN-05_WHT_CERTIFICATE.sql  (17/08/2026)
   DO NOT RUN AGAIN — SECTION 3 (VERIFY) รันซ้ำได้ READ-ONLY
═══════════════════════════════════════════════════════════════════
  ได้อะไร      หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) — RECEIVED WHT
                 ก. ผู้มีหน้าที่หักภาษี = Customer (ผู้จ่ายเงิน)
                 ข. ผู้ถูกหักภาษี       = N.J. (Company Config กลาง)
                 + ตาราง njacc_wht_items -> หลายรายการเงินได้ต่อ 1 ใบ
                 + สถานะ DRAFT (เดิมมีแค่ ISSUED/VOID)
                 + certificate_no = เลขหนังสือรับรองจริงที่ Customer ออก (ผู้ใช้กรอก)
                   แยกจาก document_no = เลขอ้างอิงภายในของ N.J. (WHT{YY}-####)
                 + direction ล็อกที่ 'RECEIVED'
                 + RPC ใหม่ 5 ตัว + njacc_list_wht คืนข้อมูลผู้หักครบ
                 + วันที่จ่ายเงินจริงจาก njacc_payments.payment_date
                   ผ่าน njacc_payment_allocations (status='POSTED')
                   *** ห้ามใช้ invoice_date แทน *** ไม่มี Payment -> null
                   มีหลาย Payment -> คืนทั้งรายการให้ผู้ใช้เลือก (ไม่เดา)
                 + บังคับ pay_date ครบก่อนบันทึกจริง
                   NJACC_WHT_PAY_DATE_REQUIRED / NJACC_WHT_ITEM_PAY_DATE_REQUIRED
                 + *** ปิด Legacy njacc_create_wht *** (REVOKE จาก authenticated)
                   -> เหลือทางออกเอกสารทางเดียว: save_draft -> post
                   -> กำจัด Default 3% ที่ฝังอยู่ใน RPC เดิม
  Dependency   ต้องมี njacc_invoice_items.wht_rate (migration 018 — รันแล้ว)
               ไม่ผูกกับ 01–05
  สถานะ        *** รันไปแล้ว 17/08/2026 · ห้ามรัน SECTION 2 ซ้ำ ***
               เก็บไฟล์ไว้เพื่อ Reference / Fresh Install เท่านั้น
  VERIFY       V1–V12 ต้อง PASS · V13/V14 ต้องได้ 0 · V15 เป็นตารางข้อมูล
               V8   ยืนยันไม่มี RPC ใดเขียนลง njacc_invoices/njacc_invoice_items
               V11e ยืนยัน Legacy njacc_create_wht ถูกปิด (anon/auth = false)
               V11f invoice_options คืน payment_date จาก Payment จริง
               V11g post_wht บังคับวันที่จ่ายเงินจริง
               V11h save_draft ไม่ fallback pay_date เป็น document_date
               V16  ใบที่บันทึกจริงต้องมี pay_date ครบทุกบรรทัด

  ⚠️ BACKEND REQUIRED — OUTBOUND WHT / SUPPLIER MASTER
     ตรวจแล้ว Production ไม่มี Supplier / Vendor / AP / Supplier Invoice Master
     จึงยังทำ Flow ที่ N.J. เป็นผู้หัก (จ่ายให้ Supplier) ไม่ได้ในรอบนี้
     direction ถูกล็อกที่ 'RECEIVED' ไว้ก่อน — เปิด OUTBOUND ต้องมี migration แยก

  ⚠️ รูปแบบเลขอ้างอิงภายใน WHT{YY}-#### ต่างจากตระกูล NJ/RCP/CN/ADV {YYYYMM}-#####
     เก็บของเดิมไว้ตามหลัก "มีระบบอยู่แล้วให้ใช้ของเดิม"
     ต้องการเปลี่ยนให้สั่งแยกรอบ (ตอนนี้ยังมี 0 แถว เปลี่ยนได้ปลอดภัย)


═══════════════════════════════════════════════════════════════════
✅ ALREADY APPLIED · 07_RUN-01_025_DOCUMENT_QUEUE_AND_CLOSE.sql (18/08/2026)
   DO NOT RUN AGAIN — SECTION 3 (VERIFY) รันซ้ำได้ READ-ONLY
═══════════════════════════════════════════════════════════════════
  ผลตรวจหลังรันจริงบน Production:
    V1 queue=document PASS · V2 <> 'CLOSE' PASS · V3 pending_invoice = 'CLOSE' PASS
    V4 njacc_document_close_job(p_id uuid, p_note text) PASS
    V5 authenticated=true anon=false PASS · V6 SECURITY DEFINER PASS
    V7 ข้อมูลครบ jobs=2 OPEN=1 CLOSE=1 PASS
    JSNJ26-0002 OPEN  -> DOCUMENT เห็น · ACCOUNTING ไม่เห็น
    JSNJ26-0001 CLOSE -> DOCUMENT ไม่เห็น · ACCOUNTING เห็น

  ทำไมต้องรัน — ตรวจ Production จริงแล้วพบว่า
    njacc_build_charge_set   ไม่มีเงื่อนไข queue='document'   -> NO
    njacc_document_close_job ไม่มีฟังก์ชันนี้เลย              -> NO
  แต่ Frontend ส่ง queue='document' และเรียก njacc_document_close_job อยู่แล้ว
  => งานที่เพิ่งเปิด (operational_status='OPEN') จึงไม่แสดงในหน้า DOCUMENT
     และปุ่ม "ปิดงาน" ทำงานไม่ได้

  ข้อมูลจริงตอนตรวจ (17/08/2026):
    OPEN SERVICE 1 · OPEN ADVANCE 0 · CLOSE SERVICE 1 · CLOSE ADVANCE 0
    รวม njacc_jobs 2 แถว · สถานะที่มีจริง: OPEN, CLOSE
    -> มีงาน OPEN SERVICE 1 งานที่ผู้ใช้มองไม่เห็นอยู่ตอนนี้

  ไฟล์นี้ทำอะไร (ตรวจครบทุกบรรทัดแล้ว)
    1) njacc_build_charge_set + สาขา queue='document'
         operational_status <> 'CLOSE'  -> อยู่ DOCUMENT
       ฝั่ง pending_invoice ยังเป็น operational_status = 'CLOSE' เหมือนเดิม
       -> ฟิลด์เดียวกัน 2 คิวตรงข้ามกันเสมอ ไม่มีงานหายทั้งสองฝั่ง
          และไม่มีงานอยู่ทั้งสองฝั่งพร้อมกัน (ไม่เกิด Record ซ้ำ)
    2) njacc_document_close_job(p_id uuid, p_note text DEFAULT NULL) ใหม่
       ล็อกแถว FOR UPDATE · ตรวจสิทธิ์ njacc_can(charge, group, 'edit')
       ปิดได้เฉพาะ OPEN / PROCESSING (CANCELED เข้า ACCOUNTING ไม่ได้)
       ใบที่มีผลทางบัญชีแล้ว -> NJACC_JOB_ALREADY_INVOICED
       กดซ้ำ -> คืน already_closed=true ไม่สร้าง Audit ซ้ำ
       เรียก njacc_set_job_status(p_id,'CLOSE',note) ตัวเดิม (Audit เดิมครบ)
       แล้ว "ตรวจรับ" ว่างานเข้าคิว pending_invoice จริง
       ถ้าไม่เข้า -> NJACC_ACCOUNTING_HANDOFF_FAILED (rollback ทั้ง transaction)
       -> ไม่มีสภาพ "หายจาก DOCUMENT แต่ ACCOUNTING ไม่รับ"

  ความปลอดภัย (ตรวจหลังตัดคอมเมนต์ออกแล้ว)
    DROP TABLE   1 ครั้ง = DROP TABLE IF EXISTS _njacc_l
                 *** เป็น TEMP TABLE ภายใน session ของ RPC เอง ***
                 ไม่ใช่ตารางข้อมูลจริง (ของเดิมในฟังก์ชันนี้ก็ทำแบบนี้อยู่แล้ว)
    TRUNCATE     0 · DELETE FROM 0 · UPDATE ข้อมูลเดิม 0
    GRANT authenticated · REVOKE PUBLIC/anon ครบทั้ง 2 ฟังก์ชัน
    ไม่สร้างคอลัมน์/สถานะ/ตารางใหม่ · ไม่แก้ njacc_set_job_status เดิม

  Dependency  ต้องมี njacc_set_job_status + njacc_inv_is_final (มีอยู่แล้ว)
  รันซ้ำ      ได้ (CREATE OR REPLACE ล้วน)
  VERIFY      SECTION 3 ในไฟล์ (READ ONLY) V1–V… ต้อง PASS


═══════════════════════════════════════════════════════════════════
FINAL VERIFICATION — READ ONLY (รันซ้ำได้ทุกเมื่อ)
═══════════════════════════════════════════════════════════════════
  รัน SECTION 3 ของไฟล์ 02 ซ้ำอีกครั้ง (READ ONLY)
  คราวนี้ V3 ต้องขึ้น PASS แล้ว

  หรือรันคำสั่งเดียวนี้ตรวจ prefix ทั้ง 4 ชุด :

      SELECT p.proname,
             pg_get_functiondef(p.oid) LIKE '%''INVOICE_MONTH'', ''NJ''%'  AS nj_ok,
             pg_get_functiondef(p.oid) LIKE '%''ADVANCE_MONTH'', ''ADV''%' AS adv_ok,
             pg_get_functiondef(p.oid) LIKE '%''RECEIPT_MONTH'',''RCP''%'  AS rcp_ok,
             pg_get_functiondef(p.oid) LIKE '%''CREDIT_NOTE_MONTH'', ''CN''%' AS cn_ok
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname IN ('njacc_post_draft_invoice','njacc_issue_invoice',
                           'njacc_receive_payment','njacc_next_credit_note_no')
       ORDER BY 1;

  ผลที่ควรได้หลังรันครบ :
      Invoice POST  ->  NJ202608-00001    (ใบถัดไป -00002)
      Advance POST  ->  ADV202608-00001   (ไม่กิน counter ของ INVOICE)
      Receipt       ->  RCP202608-00001
      Credit Note   ->  CN202608-00001
      DRAFT ยังใช้ DRAFT-xxxx -> ไม่กินเลขจริง
      POST -> UNPOST -> POST ใหม่ ใช้เลขเดิม ไม่กินเลขใหม่

      Invoice 1,605 · WHT 45 -> Net 1,560
        รับ 1,560 -> PAID    · Outstanding 0
        รับ   780 -> PARTIAL · Outstanding 780
