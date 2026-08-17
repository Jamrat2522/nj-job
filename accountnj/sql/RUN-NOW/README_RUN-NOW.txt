BILLING NJ — SQL RUN ORDER
ตรวจสภาพ Production จริงเมื่อ 17/08/2026 (READ ONLY)
═══════════════════════════════════════════════════════════════════

*** รันเฉพาะโฟลเดอร์นี้ ***
*** sql/LEGACY-DO-NOT-RUN/ ห้ามรัน ***
*** sql/ และ sql/dev/ ที่เหลือ = migration เก่าที่รันไปแล้ว ห้ามรันซ้ำ ***


═══════════════════════════════════════════════════════════════════
สรุปสถานะแต่ละไฟล์
═══════════════════════════════════════════════════════════════════
  01_RUN_3B_CREDIT_NOTE_FIX_GRANTS.sql   ✅ ALREADY APPLIED — VERIFY ONLY / SKIP
  02_RUN-01_FINAL_DOCUMENT_NUMBERS.sql   ▶ RUN NOW  (ลำดับ 1)
  03_RUN-03_FINAL_RECEIPT_PAYMENT.sql    ▶ RUN NOW  (ลำดับ 2 · ต้องหลัง 02)
  04_RUN-02_FINAL_CREDIT_NOTE.sql        ▶ RUN NOW  (ลำดับ 3)
  05_RUN-04_FINAL_RECEIPT_FIELDS.sql     ▶ RUN NOW  (ลำดับ 4 · อิสระ)

  => ไฟล์ที่ต้องรันจริงมี 4 ไฟล์ :  02 -> 03 -> 04 -> 05


═══════════════════════════════════════════════════════════════════
01_RUN_3B_CREDIT_NOTE_FIX_GRANTS.sql   ✅ ALREADY APPLIED
═══════════════════════════════════════════════════════════════════
  ตรวจ Production จริงแล้วพบว่าสิทธิ์ถูกถอนเรียบร้อยแล้ว :
      njacc_next_credit_note_no     anon=false  authenticated=false
      njacc_credit_item_remaining   anon=false  authenticated=false

  => ไม่ต้องรันซ้ำ

  ถ้าต้องการยืนยันเอง ให้รันเฉพาะคำสั่งนี้ (READ ONLY · ไม่เปลี่ยนอะไร) :

      SELECT p.proname,
             has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public'
         AND p.proname IN ('njacc_next_credit_note_no','njacc_credit_item_remaining');

  ได้ false ทั้ง 4 ช่อง -> ข้ามไฟล์ 01 ไปเริ่มที่ 02 ได้เลย
  ถ้ามีช่องใดเป็น true  -> ค่อยรันไฟล์ 01 (มีแต่ REVOKE 2 บรรทัด · รันซ้ำได้)


═══════════════════════════════════════════════════════════════════
ลำดับ 1 · 02_RUN-01_FINAL_DOCUMENT_NUMBERS.sql
═══════════════════════════════════════════════════════════════════
  ได้อะไร      เลขเอกสารแยก scope รายเดือน · 5 หลัก
                 INVOICE          NJ{YYYYMM}-#####
                 ADVANCE PAYMENT  ADV{YYYYMM}-#####
                 CREDIT NOTE      CN{YYYYMM}-#####
               + helper njacc_next_month_doc_no() ที่ไฟล์ 03 ต้องใช้
  Dependency   ไม่มี
  ความเสี่ยง   ต่ำ · ไม่ ALTER TABLE · ไม่แตะข้อมูล · ไม่ rewrite เลขเก่า
  รันซ้ำ       ได้ · ไม่แตะ njacc_receive_payment -> ไม่ย้อน Logic ของไฟล์ 03

  ⚠️ การอ่านผล VERIFY ของไฟล์นี้ — อ่านให้ถูก
      V1 V2 V4 V5 V6 V7 V8 V9 V10 V11 V12 V13   ต้อง PASS
      V3 (RECEIPT ใช้ RCP)                       = EXPECTED PENDING
         ตั้งใจให้ยังไม่ PASS เพราะเลขใบเสร็จอยู่ในไฟล์ 03
         ข้อความที่ขึ้นจะเป็น
           "ยังไม่ได้รัน RUN-03_FINAL_RECEIPT_PAYMENT.sql — ใบเสร็จยังใช้เลขเก่า"
         ไม่ใช่ FAIL · ให้รันไฟล์ 03 ต่อได้เลย
         V3 จะกลายเป็น PASS หลังรันไฟล์ 03 แล้ว (ดูหัวข้อ FINAL VERIFICATION)


═══════════════════════════════════════════════════════════════════
ลำดับ 2 · 03_RUN-03_FINAL_RECEIPT_PAYMENT.sql
═══════════════════════════════════════════════════════════════════
  ได้อะไร      Single Payment Rule เดียวกันทั้งระบบ
                 ใบที่รับชำระได้ = status IN ('ISSUED','POSTED')
                 Net Receivable  = total_amount − wht_amount
                 Outstanding     = Net − paid (นับ payment status='POSTED')
               + เลขใบเสร็จ RCP{YYYYMM}-#####
               + *** กัน ADVANCE เข้า Receipt *** (helper njacc_receipt_chargeable)
                 njacc_customer_open_invoices  กรอง charge_type='SERVICE'
                 njacc_receive_payment         reject -> NJACC_RECEIPT_SERVICE_ONLY
                 njacc_receipt_pending         ใช้ helper ตัวเดียวกัน
                 -> ยิง RPC ตรงก็กันได้ · ถ้ามี ADVANCE ปนแม้ใบเดียว rollback ทั้งก้อน
                 งานสำรองจ่ายต้องใช้ Flow FINANCE > Advance เท่านั้น
               แก้ 4 RPC : njacc_receipt_pending · njacc_customer_open_invoices ·
                           njacc_receive_payment · njacc_void_receipt
  Dependency   *** ต้องรัน 02 ก่อน *** (PREFLIGHT จะหยุดเองถ้ายังไม่มี helper)
  ความเสี่ยง   ปานกลาง · แก้ Business Logic การรับชำระ
               ไม่ ALTER TABLE · ไม่ UPDATE ข้อมูลเดิม
  รันซ้ำ       ได้
  VERIFY       V1–V14 ต้อง PASS ทุกแถว (รวม V5a / V5b / V5c ที่ตรวจ SERVICE guard)
               V15 / V16 / V17 เป็นตารางข้อมูลให้ดูด้วยตา
               V17 ต้องได้ advance_in_receipt = 0 และ advance_in_payment = 0


═══════════════════════════════════════════════════════════════════
ลำดับ 3 · 04_RUN-02_FINAL_CREDIT_NOTE.sql
═══════════════════════════════════════════════════════════════════
  ได้อะไร      + คอลัมน์ njacc_credit_note_items.original_amount (snapshot)
               + njacc_credit_note_view คืน prior_credited / cumulative_credited /
                 correct_amount -> Correct Amount คิด Credit สะสมถูกต้อง
                 (10,000 -> CN1 2,000 = 8,000 -> CN2 1,500 = 6,500)
  Dependency   ต้องรัน RUN_3_CREDIT_NOTE.sql มาก่อน ← รันไปแล้ว 17/08/2026
               ไม่ผูกกับ 02 / 03
  ความเสี่ยง   ต่ำ · ADD COLUMN อย่างเดียว (ตารางมี 0 แถว)
  รันซ้ำ       ได้ (ADD COLUMN IF NOT EXISTS)
  VERIFY       V1–V7 ต้อง PASS · V9 no over-credit ต้อง PASS


═══════════════════════════════════════════════════════════════════
ลำดับ 4 · 05_RUN-04_FINAL_RECEIPT_FIELDS.sql
═══════════════════════════════════════════════════════════════════
  ได้อะไร      njacc_list_receipts ส่งฟิลด์ที่เอกสารใบเสร็จต้องใช้ :
                 ลูกค้า : tax_id · branch_code · address · phone
                 ใบแจ้งหนี้ : invoice_date · charge_type · subtotal ·
                              vat_amount · vat_rate · wht_amount ·
                              total_amount · description
                 *** wht_breakdown = [{rate, amount}] แยกตามอัตราจริง ***
                     อ่านจาก njacc_invoice_items.wht_rate
                     รองรับ 1 ใบมีหลายอัตรา เช่น ขนส่ง 1% + บริการ 3%
  Dependency   ต้องมี njacc_invoice_items.wht_rate (migration 018 — รันแล้ว)
               ไม่ผูกกับ 02 / 03 / 04 · รันก่อนหรือหลังก็ได้
  ความเสี่ยง   ต่ำมาก · READ PATH ล้วน
               ไม่ ALTER TABLE / INSERT / UPDATE / DELETE / DROP / TRUNCATE
  รันซ้ำ       ได้
  VERIFY       V1–V10 ต้อง PASS · V11 ตรวจ wht_breakdown ตรงกับ wht_amount ของใบ

  *** ไฟล์นี้แทนที่ LEGACY-DO-NOT-RUN/RUN_2_RECEIPT.sql ทั้งตัว ***
      ห้ามรัน RUN_2_RECEIPT.sql


═══════════════════════════════════════════════════════════════════
FINAL VERIFICATION — รันหลังครบทั้ง 4 ไฟล์แล้วเท่านั้น
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
