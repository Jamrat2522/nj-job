-- ═══════════════════════════════════════════════════════════════════════════
-- RUN-04_charge_bundle_skip_kpi.sql
-- ข้าม aggregate ของ KPI เมื่อหน้าจอไม่ได้ใช้ (ACCOUNTING SERVICE / ADVANCE)
--
-- ═══ ที่มา ════════════════════════════════════════════════════════════════
--   njacc_charge_page_bundle เป็น RPC เดียวที่คืน rows + total + kpi + options
--   KPI ถูกคำนวณเป็น aggregate เต็มชุดบน _njacc_l (13 ตัว: count/sum/FILTER)
--   ทุกครั้งที่โหลดหน้า · เปลี่ยนหน้า · Search · Filter · Refresh
--   หน้า ACCOUNTING ไม่แสดง KPI แล้ว -> คำนวณทิ้งเปล่า
--
-- ═══ ขอบเขต — แก้บรรทัดเดียว ══════════════════════════════════════════════
--   ห่อ block ที่คำนวณ v_kpi ด้วย  IF coalesce((p->>'with_kpi')::boolean, true)
--   · ค่าเริ่มต้น = true -> ผู้เรียกเดิมที่ไม่ส่ง key นี้ได้ผลเหมือนเดิมเป๊ะ
--     (FINANCE > Advance · Close Job · route เดิม #/charges/:charge/:group)
--   · ส่ง false -> v_kpi = NULL, คีย์ 'kpi' ยังอยู่ใน response (ไม่ทำ contract พัง)
--   ไม่แตะ: rows · total · filter_options · njacc_build_charge_set · สิทธิ์ ·
--           ตาราง · RLS · policy · RPC อื่น
--   ไม่มี DROP / DELETE / TRUNCATE / ALTER TABLE / UPDATE ข้อมูล
--
--   *** ไฟล์นี้เป็น "ตัวเลือกเชิงประสิทธิภาพ" ***
--   ถ้ายังไม่รัน: server ไม่รู้จัก with_kpi -> คำนวณ KPI เหมือนเดิม
--   แต่หน้าจอ ACCOUNTING ก็ไม่แสดง KPI อยู่ดี (Frontend ตัดออกแล้ว) -> ไม่พัง
--
-- ลำดับ:  RUN-04 (ไฟล์นี้)  ->  RUN-05 (verify)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='njacc_charge_page_bundle') THEN
    RAISE EXCEPTION 'PREFLIGHT FAIL — ไม่พบ njacc_charge_page_bundle';
  END IF;
  RAISE NOTICE 'PREFLIGHT PASS';
END $$;

CREATE OR REPLACE FUNCTION public.njacc_charge_page_bundle(p jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE pr public.njacc_profiles; v_total bigint; v_rows jsonb; v_kpi jsonb; v_opts jsonb := NULL;
        v_off int; v_size int; v_order text;
        v_charge text := p->>'charge_type'; v_group text := p->>'company_group';
BEGIN
  pr := public.njacc_req_profile();
  IF NOT public.njacc_can(v_charge,v_group,'view') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce((p->>'size')::int,20),1),100);
  v_off  := (greatest(coalesce((p->>'page')::int,1),1)-1) * v_size;
  v_order := CASE WHEN p->>'sort'='invoice_no'
    THEN 'invoice_sort_class, coalesce(invoice_acc_key, invoice_src_key) ' ELSE 'date ' END
    || CASE WHEN lower(coalesce(p->>'dir','desc'))='asc' THEN 'ASC NULLS LAST' ELSE 'DESC NULLS LAST' END;

  PERFORM public.njacc_build_charge_set(p);
  SELECT count(*) INTO v_total FROM _njacc_l;
  EXECUTE format('SELECT coalesce(jsonb_agg(t),''[]''::jsonb) FROM
    (SELECT * FROM _njacc_l ORDER BY %s OFFSET %s LIMIT %s) t', v_order, v_off, v_size) INTO v_rows;

  /* ▼▼ เปลี่ยนเฉพาะบล็อกนี้ — เดิมคำนวณเสมอ ▼▼ */
  IF coalesce((p->>'with_kpi')::boolean, true) THEN
    SELECT jsonb_build_object(
      'total_job', count(*),
      -- จำนวนงานแยกตาม Data Type (นับจากข้อมูลจริงใน njacc_jobs.data_type)
      'total_import', count(*) FILTER (WHERE upper(coalesce(data_type,'')) = 'IMPORT'),
      'total_export', count(*) FILTER (WHERE upper(coalesce(data_type,'')) = 'EXPORT'),
      'total_overdue', count(*) FILTER (WHERE is_receivable AND due_date < current_date),
      'job_overdue_no_invoice', count(*) FILTER (
          WHERE invoice_status IS DISTINCT FROM 'ISSUED'
            AND operational_status <> 'CANCELED' AND due_date < current_date),
      'service_charge', coalesce(sum(service_amount),0),
      'advance_charge', coalesce(sum(advance_amount),0),
      'vat', coalesce(sum(vat_amount),0),
      'total_amount', coalesce(sum(net_payable),0),
      'gross_total', coalesce(sum(gross_total),0),
      'wht_total', coalesce(sum(wht_amount),0),
      'open_jobs', count(*) FILTER (WHERE operational_status='OPEN'),
      'close_jobs', count(*) FILTER (WHERE operational_status='CLOSE'))
    INTO v_kpi FROM _njacc_l;
  END IF;
  /* ▲▲ จบส่วนที่เปลี่ยน ▲▲ */

  IF coalesce((p->>'with_options')::boolean,false) THEN
    v_opts := public.njacc_charge_filter_options(p);
  END IF;
  RETURN jsonb_build_object('total',v_total,'rows',v_rows,'kpi',v_kpi,'filter_options',v_opts);
END $function$;

GRANT EXECUTE ON FUNCTION public.njacc_charge_page_bundle(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.njacc_charge_page_bundle(jsonb) FROM PUBLIC, anon;

-- ═══ ROLLBACK ══════════════════════════════════════════════════════════════
-- เอา IF ... END IF; ที่ครอบบล็อก v_kpi ออก (ให้คำนวณเสมอเหมือนเดิม)
-- แล้วรัน CREATE OR REPLACE FUNCTION njacc_charge_page_bundle ใหม่ทั้งตัว
-- Frontend ไม่ต้องแก้ — ส่ง with_kpi มาก็ถูกมองข้ามไปเฉย ๆ
