-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-13_REPORT_KPI_POSTED_FIX.sql
-- REPORT — KPI ตก Invoice สถานะ POSTED
--
-- ═══ CURRENT LOGIC (จาก pg_get_functiondef จริง) ═══════════════════════════
--   njacc_report(p jsonb) สร้าง temp table _njacc_r แล้วสรุป KPI ด้วย:
--     'total_invoice',  count(*)              FILTER (WHERE status='ISSUED')
--     'invoice_amount', sum(total_amount)     FILTER (WHERE status='ISSUED')
--     'received',       sum(received)         FILTER (WHERE status='ISSUED')
--     'outstanding',    sum(outstanding)      FILTER (WHERE status='ISSUED')
--     'partial',        count(*)              FILTER (WHERE status='ISSUED' AND payment_status='PARTIAL')
--     'paid',           count(*)              FILTER (WHERE status='ISSUED' AND payment_status='PAID')
--   และคอลัมน์ overdue:
--     (i.status='ISSUED' AND i.payment_status<>'PAID' AND i.due_date<current_date)
--
-- ═══ ปัญหา ════════════════════════════════════════════════════════════════
--   njacc_invoices CHECK: status IN ('DRAFT','ISSUED','POSTED','VOID')
--   njacc_inv_is_final(p_status) = status IN ('ISSUED','POSTED')
--     -> *** ระบบนิยามไว้ชัดแล้วว่า "ใบที่มีผลทางบัญชี" = ISSUED + POSTED ***
--        ใช้เป็น gate ของคิว pending_invoice ใน njacc_build_charge_set ด้วย
--   แต่ KPI ของ njacc_report ยังกรอง status='ISSUED' อย่างเดียวทั้ง 6 จุด
--   -> *** Invoice ที่ POST แล้วหายจากทุกยอด KPI ***
--      จำนวนใบ · ยอดออกบิล · รับชำระแล้ว · คงค้าง · ชำระครบ/บางส่วน · เกินกำหนด
--      ตัวเลขบนหน้ารายงานจึงต่ำกว่าความจริง และ Table กับ KPI ใช้เงื่อนไขคนละชุด
--      (Table แสดงทุกสถานะที่ผ่าน filter · KPI นับเฉพาะ ISSUED)
--
-- ═══ EXPECTED LOGIC ═══════════════════════════════════════════════════════
--   เปลี่ยน 6 จุด + overdue จาก status='ISSUED'
--   เป็น public.njacc_inv_is_final(status)
--   *** ไม่ได้ตั้งนิยามใหม่ *** ใช้ฟังก์ชันเดิมที่ระบบใช้ตัดสินอยู่แล้ว
--   -> KPI ตรงกับคิว/Logic ส่วนอื่นของระบบ และ DRAFT/VOID ยังไม่ถูกนับเหมือนเดิม
--
-- ═══ ขอบเขต ═══════════════════════════════════════════════════════════════
--   *** แก้ฟังก์ชันเดียว: njacc_report *** Signature เดิม (p jsonb)
--   -> CREATE OR REPLACE ทับได้ ไม่เกิด overload ไม่ต้อง DROP
--   ไม่แตะ: WHERE/filter · pagination · ลำดับคอลัมน์ · rows · total ·
--           njacc_inv_is_final · njacc_build_charge_set · ตาราง · ข้อมูล ·
--           receipt_count (คนละตาราง njacc_receipts มีสถานะของตัวเอง)
--   ไม่มี DO block · ไม่มี DROP TABLE/COLUMN/FUNCTION · ไม่มี DELETE/TRUNCATE
--   (DROP TABLE IF EXISTS _njacc_r เป็น temp table ของฟังก์ชันเดิม — ยกมาตามเดิม)
--   รันซ้ำได้ปลอดภัย
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. PREFLIGHT (อ่านอย่างเดียว) ─────────────────────────────────────────
SELECT 'P1 njacc_report มีตัวเดียว signature (p jsonb)' AS check_item,
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_report') = 1
            THEN 'PASS' ELSE 'STOP — มี overload ให้แจ้งก่อน' END AS result
UNION ALL
SELECT 'P2 njacc_inv_is_final = ISSUED + POSTED (นิยามเดิมของระบบ)',
       CASE WHEN public.njacc_inv_is_final('ISSUED')
             AND public.njacc_inv_is_final('POSTED')
             AND NOT public.njacc_inv_is_final('DRAFT')
             AND NOT public.njacc_inv_is_final('VOID')
            THEN 'PASS' ELSE 'STOP — นิยามเปลี่ยนไป ให้ตรวจก่อน' END
UNION ALL
SELECT 'P3 ยืนยันบั๊ก: KPI ปัจจุบันกรอง ISSUED อย่างเดียว',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%FILTER (WHERE status=''ISSUED'')%'
            THEN 'CONFIRMED — มีบั๊กจริง' ELSE 'แก้ไปแล้ว (รันซ้ำ)' END
UNION ALL
SELECT 'P4 ข้อมูลที่จะเปลี่ยนตัวเลข (จำนวนใบ POSTED ที่เคยถูกตก)',
       (SELECT count(*)::text FROM public.njacc_invoices WHERE status='POSTED') || ' ใบ';


-- ── 2. njacc_report — ยกนิยามจริงมาทั้งดุ้น เปลี่ยนเฉพาะ 7 จุด ────────────
CREATE OR REPLACE FUNCTION public.njacc_report(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_kpi jsonb;
        v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(nullif(p->>'charge_type',''),nullif(p->>'company_group',''),'view') THEN
    RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce((p->>'size')::int,20),1),100);
  v_off := (greatest(coalesce((p->>'page')::int,1),1)-1)*v_size;

  DROP TABLE IF EXISTS _njacc_r;
  CREATE TEMP TABLE _njacc_r ON COMMIT DROP AS
  SELECT i.id, i.invoice_no, i.invoice_date, i.due_date, i.charge_type, i.company_group,
         i.status, i.payment_status, i.subtotal, i.vat_amount, i.wht_amount, i.total_amount,
         c.customer_name, j.job_no, j.customer_job_no,
         coalesce(pp.paid,0) AS received, i.total_amount-coalesce(pp.paid,0) AS outstanding,
         /* (1) overdue — เดิม i.status='ISSUED' ทำให้ใบที่ POST แล้วเลยกำหนดไม่ถูกนับ */
         (public.njacc_inv_is_final(i.status)
            AND i.payment_status<>'PAID' AND i.due_date<current_date) AS overdue
    FROM public.njacc_invoices i
    JOIN public.njacc_customers c ON c.id=i.customer_id
    JOIN public.njacc_jobs j ON j.id=i.job_id
    LEFT JOIN (SELECT pa.invoice_id, sum(pa.allocated_amount) AS paid
        FROM public.njacc_payment_allocations pa
        JOIN public.njacc_payments pm ON pm.id=pa.payment_id AND pm.status='POSTED'
       GROUP BY pa.invoice_id) pp ON pp.invoice_id=i.id
   WHERE (nullif(p->>'charge_type','') IS NULL OR i.charge_type=p->>'charge_type')
     AND (nullif(p->>'company_group','') IS NULL OR i.company_group=p->>'company_group')
     AND (nullif(p->>'customer_id','') IS NULL OR i.customer_id=(p->>'customer_id')::uuid)
     AND (nullif(p->>'status','') IS NULL OR i.status=p->>'status')
     AND (nullif(p->>'payment_status','') IS NULL OR i.payment_status=p->>'payment_status')
     AND (nullif(p->>'from','') IS NULL OR i.invoice_date >= (p->>'from')::date)
     AND (nullif(p->>'to','') IS NULL OR i.invoice_date <= (p->>'to')::date);

  SELECT count(*) INTO v_total FROM _njacc_r;
  /* (2)-(7) KPI — ใช้ njacc_inv_is_final(status) แทน status='ISSUED'
     = "ใบที่มีผลทางบัญชี" ตามนิยามเดิมของระบบ (ISSUED + POSTED)
     DRAFT / VOID ยังไม่ถูกนับเหมือนเดิมทุกประการ */
  SELECT jsonb_build_object(
    'total_invoice', count(*) FILTER (WHERE public.njacc_inv_is_final(status)),
    'invoice_amount', coalesce(sum(total_amount) FILTER (WHERE public.njacc_inv_is_final(status)),0),
    'received', coalesce(sum(received) FILTER (WHERE public.njacc_inv_is_final(status)),0),
    'outstanding', coalesce(sum(outstanding) FILTER (WHERE public.njacc_inv_is_final(status)),0),
    'overdue', count(*) FILTER (WHERE overdue),
    'partial', count(*) FILTER (WHERE public.njacc_inv_is_final(status) AND payment_status='PARTIAL'),
    'paid', count(*) FILTER (WHERE public.njacc_inv_is_final(status) AND payment_status='PAID'),
    /* receipt_count — คนละตาราง (njacc_receipts มีสถานะของตัวเอง) *** ไม่แตะ *** */
    'receipt_count', (SELECT count(*) FROM public.njacc_receipts WHERE status='ISSUED'))
  INTO v_kpi FROM _njacc_r;
  SELECT coalesce(jsonb_agg(t),'[]'::jsonb) INTO v_rows FROM (
    SELECT * FROM _njacc_r ORDER BY invoice_date DESC, invoice_no DESC
    OFFSET v_off LIMIT v_size) t;
  RETURN jsonb_build_object('total',v_total,'kpi',v_kpi,'rows',v_rows);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_report(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_report(jsonb) FROM PUBLIC, anon;


-- ── VERIFY (อ่านอย่างเดียว) ───────────────────────────────────────────────
SELECT 'V1 KPI ไม่เหลือ FILTER (WHERE status=''ISSUED'') แล้ว' AS check_item,
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   NOT LIKE '%FILTER (WHERE status=''ISSUED'')%'
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'V2 KPI 6 จุดใช้ njacc_inv_is_final',
       CASE WHEN (SELECT count(*) FROM regexp_matches(
                    pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure),
                    'njacc_inv_is_final\(status\)', 'g')) = 6
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V3 overdue ใช้ njacc_inv_is_final(i.status)',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%njacc_inv_is_final(i.status)%'
            AND (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   NOT LIKE '%(i.status=''ISSUED'' AND i.payment_status%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V4 receipt_count ไม่ถูกแตะ (คนละตาราง)',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%FROM public.njacc_receipts WHERE status=''ISSUED''%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V5 filter / pagination / rows / total ไม่ถูกแตะ',
       CASE WHEN (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%ORDER BY invoice_date DESC, invoice_no DESC%'
            AND (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%v_size := least(greatest(coalesce((p->>''size'')::int,20),1),100)%'
            AND (SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure))
                   LIKE '%OR i.status=p->>''status''%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V6 Signature เดิม — ไม่มี overload',
       CASE WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_report') = 1
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V7 njacc_inv_is_final / njacc_build_charge_set ไม่ถูกแตะ',
       CASE WHEN public.njacc_inv_is_final('POSTED')
             AND (SELECT pg_get_functiondef('public.njacc_build_charge_set(jsonb)'::regprocedure))
                   LIKE '%p->>''queue'' = ''document''%'
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'V8 SECURITY DEFINER + search_path + สิทธิ์เดิม',
       CASE WHEN (SELECT p.prosecdef AND p.proconfig::text LIKE '%search_path%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                   WHERE n.nspname='public' AND p.proname='njacc_report')
             AND has_function_privilege('authenticated','public.njacc_report(jsonb)','EXECUTE')
             AND NOT has_function_privilege('anon','public.njacc_report(jsonb)','EXECUTE')
            THEN 'PASS' ELSE 'FAIL' END;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
--   เก็บนิยามเดิมก่อนรัน:
--     SELECT pg_get_functiondef('public.njacc_report(jsonb)'::regprocedure);
--   แล้ว EXECUTE ข้อความเดิมกลับ (Signature เดียวกัน ทับได้ทันที)
--   ไม่มีการเปลี่ยนโครงตารางหรือข้อมูล จึงไม่มีอะไรต้องกู้คืน
