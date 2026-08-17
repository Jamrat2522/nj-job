LEGACY — DO NOT RUN
═══════════════════════════════════════════════════════════════════
*** ห้ามรันไฟล์ในโฟลเดอร์นี้ ***
เก็บไว้เพื่ออ้างอิง / ROLLBACK / ตรวจย้อนหลังเท่านั้น

ไฟล์ที่ต้องรันจริงอยู่ที่  sql/RUN-NOW/  เท่านั้น

───────────────────────────────────────────────────────────────────
RUN_3_CREDIT_NOTE.sql
    รันไปแล้ว 17/08/2026 · PREFLIGHT จะหยุดเองถ้ารันซ้ำ
    ⚠️ ใช้ prefix เก่า CD{YYYYMM}-#####
       ถูกแทนที่ด้วย CN{YYYYMM}-##### ใน RUN-NOW/02

RUN_1_INVOICE.sql · RUN_4_ADVANCE.sql
    เพิ่มฟิลด์บนเอกสาร (Decl No. / Master B/L / Tel. / NOTE / Created By)
    ไม่เกี่ยวกับเลขเอกสารและการเงิน · ยังไม่ได้รัน
    ถ้าต้องการฟิลด์เหล่านี้ ให้สั่งแยกรอบ จะย้ายเข้า RUN-NOW ให้

RUN_2_RECEIPT.sql   *** ถูกแทนที่ทั้งตัวด้วย sql/RUN-NOW/05_RUN-04_FINAL_RECEIPT_FIELDS.sql ***
    *** ห้ามรันไฟล์นี้ *** ให้รัน 05_RUN-04 แทน (มีเนื้อหาเดิมครบ + wht_breakdown)
    เพิ่มฟิลด์ภาษีในผลลัพธ์ njacc_list_receipts
    (customer_tax_id / branch / address / phone / invoice_date /
     charge_type / subtotal / vat_amount / vat_rate / wht_amount / description)
    ⚠️ เอกสารใบเสร็จต้องใช้ฟิลด์เหล่านี้จึงจะแสดง SubTotal/VAT/WHT ได้
       ยังไม่รัน -> ใบเสร็จจะแสดง "-" ในช่องภาษี (ไม่เดาค่า)
    ยังไม่ได้รัน และจะไม่รันแล้ว — ใช้ 05_RUN-04 แทน

RUN-01_027_invoice_doc_fields.sql · RUN-01_028_receipt_doc_fields.sql
    ฉบับก่อนหน้าของ RUN_1/RUN_4 และ RUN_2 · เนื้อหาซ้ำกัน
    เก็บไว้อ้างอิงเท่านั้น

RUN-01_025 · RUN-01_026 · RUN-02_026
    ⚠️ 026 ใช้ njacc_next_doc_no แบบ 4 พารามิเตอร์ ซึ่งขัดกับ RUN-NOW/02
       *** ห้ามรันเด็ดขาด *** จะทำให้ระบบเลขเอกสารพัง
    025 = ปุ่มปิดงาน DOCUMENT -> ACCOUNTING (ยังไม่รัน · คนละเรื่องกับรอบนี้)
