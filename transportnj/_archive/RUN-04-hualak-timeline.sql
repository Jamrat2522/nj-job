-- ============================================================
-- TRANSPORT NJ — RUN-04  เปิดงานหัวลาก + Timeline OFFICE 12 สถานะ
-- Additive only: ADD COLUMN IF NOT EXISTS / DROP NOT NULL (5 approved columns) / CREATE OR REPLACE / INSERT WHERE NOT EXISTS
-- No DROP TABLE / DROP COLUMN / DELETE / TRUNCATE. RLS unchanged (deny-all, RPC only).
-- ============================================================

-- 1) columns
ALTER TABLE public.transport_jobs ADD COLUMN IF NOT EXISTS trailer_plate text;
ALTER TABLE public.transport_jobs ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE public.transport_jobs ADD COLUMN IF NOT EXISTS tl_status text;
ALTER TABLE public.transport_jobs ADD COLUMN IF NOT EXISTS tl_status_at timestamptz;
ALTER TABLE public.transport_vehicles ADD COLUMN IF NOT EXISTS trailer_plate text;
ALTER TABLE public.transport_drivers ADD COLUMN IF NOT EXISTS default_vehicle_id uuid REFERENCES public.transport_vehicles(id);

-- 2) approved: new form has no factory / pickup date-time / return date-time fields
ALTER TABLE public.transport_jobs ALTER COLUMN factory_location_text DROP NOT NULL;
ALTER TABLE public.transport_jobs ALTER COLUMN pickup_date DROP NOT NULL;
ALTER TABLE public.transport_jobs ALTER COLUMN pickup_time DROP NOT NULL;
ALTER TABLE public.transport_jobs ALTER COLUMN return_date DROP NOT NULL;
ALTER TABLE public.transport_jobs ALTER COLUMN return_time DROP NOT NULL;

-- 3) job create (same signature; required = ลูกค้า, B/L, ท่านำเข้า, คืนตู้เปล่า)
CREATE OR REPLACE FUNCTION public.tnj_job_create(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; v_date date; v_cust uuid; v_veh public.transport_vehicles; v_drv public.transport_drivers;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  IF COALESCE(btrim(p->>'customer_name'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อลูกค้า'; END IF;
  IF COALESCE(btrim(p->>'bl_no'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุ B/L'; END IF;
  IF COALESCE(btrim(p->>'pickup_location_text'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุท่านำเข้า'; END IF;
  IF COALESCE(btrim(p->>'return_location_text'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุจุดคืนตู้เปล่า'; END IF;

  v_date := COALESCE(NULLIF(p->>'job_date','')::date, (now() AT TIME ZONE 'Asia/Bangkok')::date);
  v_cust := NULLIF(p->>'customer_id','')::uuid;
  IF v_cust IS NULL THEN
    SELECT id INTO v_cust FROM public.transport_customers WHERE lower(name) = lower(btrim(p->>'customer_name'));
    IF v_cust IS NULL THEN
      INSERT INTO public.transport_customers(name, created_by) VALUES (btrim(p->>'customer_name'), (c->>'user_id')::uuid) RETURNING id INTO v_cust;
    END IF;
  END IF;
  IF NULLIF(p->>'driver_id','') IS NOT NULL THEN SELECT * INTO v_drv FROM public.transport_drivers WHERE id = (p->>'driver_id')::uuid; END IF;
  IF NULLIF(p->>'vehicle_id','') IS NOT NULL THEN SELECT * INTO v_veh FROM public.transport_vehicles WHERE id = (p->>'vehicle_id')::uuid;
  ELSIF v_drv.default_vehicle_id IS NOT NULL THEN SELECT * INTO v_veh FROM public.transport_vehicles WHERE id = v_drv.default_vehicle_id; END IF;

  INSERT INTO public.transport_jobs(job_no, job_date, customer_id, customer_name, bl_no, booking_no, container_no, container_size, seal_no,
    vehicle_id, vehicle_name, license_plate, trailer_plate, driver_id, driver_name, status,
    pickup_location_id, pickup_location_text, pickup_date, pickup_time, pickup_note,
    factory_location_id, factory_location_text, factory_date, factory_time, factory_contact, factory_phone, factory_note,
    return_location_id, return_location_text, return_date, return_time, return_note, job_note, billing_address, created_by, updated_by)
  VALUES (public.tnj_next_job_no(v_date), v_date, v_cust, btrim(p->>'customer_name'), btrim(p->>'bl_no'), NULLIF(p->>'booking_no',''),
    NULLIF(p->>'container_no',''), NULLIF(p->>'container_size',''), NULLIF(p->>'seal_no',''),
    v_veh.id, v_veh.vehicle_name, v_veh.license_plate, COALESCE(NULLIF(p->>'trailer_plate',''), v_veh.trailer_plate), v_drv.id, v_drv.full_name, 'NEW',
    NULLIF(p->>'pickup_location_id','')::uuid, btrim(p->>'pickup_location_text'), NULLIF(p->>'pickup_date','')::date, NULLIF(p->>'pickup_time','')::time, NULLIF(p->>'pickup_note',''),
    NULLIF(p->>'factory_location_id','')::uuid, NULLIF(btrim(p->>'factory_location_text'),''), NULLIF(p->>'factory_date','')::date, NULLIF(p->>'factory_time','')::time,
    NULLIF(p->>'factory_contact',''), NULLIF(p->>'factory_phone',''), NULLIF(p->>'factory_note',''),
    NULLIF(p->>'return_location_id','')::uuid, btrim(p->>'return_location_text'), NULLIF(p->>'return_date','')::date, NULLIF(p->>'return_time','')::time, NULLIF(p->>'return_note',''),
    NULLIF(p->>'job_note',''), NULLIF(p->>'billing_address',''), (c->>'user_id')::uuid, (c->>'user_id')::uuid)
  RETURNING * INTO j;

  PERFORM public.tnj_timeline_add(c, j.id, 'SYSTEM', 'NEW', 'สร้างงาน', NULL, NULL, NULL, NULL);
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'create'));
  IF COALESCE((p->>'assign_now')::boolean, false) AND j.driver_id IS NOT NULL THEN
    RETURN public.tnj_job_assign(p_token, j.id, j.vehicle_id, j.driver_id);
  END IF;
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

-- 4) job update (same signature; nullable dates/times; + trailer_plate / billing_address; every changed field audited)
CREATE OR REPLACE FUNCTION public.tnj_job_update(p_token text, p_job_id uuid, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; n public.transport_jobs; uid uuid; un text;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  uid := (c->>'user_id')::uuid; un := c->>'full_name';
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิด/ยกเลิกแล้ว แก้ไขไม่ได้'; END IF;
  n := j;
  IF p ? 'customer_name' THEN n.customer_name := btrim(p->>'customer_name'); END IF;
  IF p ? 'customer_id' THEN n.customer_id := NULLIF(p->>'customer_id','')::uuid; END IF;
  IF p ? 'bl_no' THEN n.bl_no := btrim(p->>'bl_no'); END IF;
  IF p ? 'booking_no' THEN n.booking_no := NULLIF(p->>'booking_no',''); END IF;
  IF p ? 'container_no' THEN n.container_no := NULLIF(p->>'container_no',''); END IF;
  IF p ? 'container_size' THEN n.container_size := NULLIF(p->>'container_size',''); END IF;
  IF p ? 'seal_no' THEN n.seal_no := NULLIF(p->>'seal_no',''); END IF;
  IF p ? 'trailer_plate' THEN n.trailer_plate := NULLIF(p->>'trailer_plate',''); END IF;
  IF p ? 'billing_address' THEN n.billing_address := NULLIF(p->>'billing_address',''); END IF;
  IF p ? 'pickup_location_id' THEN n.pickup_location_id := NULLIF(p->>'pickup_location_id','')::uuid; END IF;
  IF p ? 'pickup_location_text' THEN n.pickup_location_text := btrim(p->>'pickup_location_text'); END IF;
  IF p ? 'pickup_date' THEN n.pickup_date := NULLIF(p->>'pickup_date','')::date; END IF;
  IF p ? 'pickup_time' THEN n.pickup_time := NULLIF(p->>'pickup_time','')::time; END IF;
  IF p ? 'pickup_note' THEN n.pickup_note := NULLIF(p->>'pickup_note',''); END IF;
  IF p ? 'factory_location_id' THEN n.factory_location_id := NULLIF(p->>'factory_location_id','')::uuid; END IF;
  IF p ? 'factory_location_text' THEN n.factory_location_text := NULLIF(btrim(p->>'factory_location_text'),''); END IF;
  IF p ? 'factory_date' THEN n.factory_date := NULLIF(p->>'factory_date','')::date; END IF;
  IF p ? 'factory_time' THEN n.factory_time := NULLIF(p->>'factory_time','')::time; END IF;
  IF p ? 'factory_contact' THEN n.factory_contact := NULLIF(p->>'factory_contact',''); END IF;
  IF p ? 'factory_phone' THEN n.factory_phone := NULLIF(p->>'factory_phone',''); END IF;
  IF p ? 'factory_note' THEN n.factory_note := NULLIF(p->>'factory_note',''); END IF;
  IF p ? 'return_location_id' THEN n.return_location_id := NULLIF(p->>'return_location_id','')::uuid; END IF;
  IF p ? 'return_location_text' THEN n.return_location_text := btrim(p->>'return_location_text'); END IF;
  IF p ? 'return_date' THEN n.return_date := NULLIF(p->>'return_date','')::date; END IF;
  IF p ? 'return_time' THEN n.return_time := NULLIF(p->>'return_time','')::time; END IF;
  IF p ? 'return_note' THEN n.return_note := NULLIF(p->>'return_note',''); END IF;
  IF p ? 'job_note' THEN n.job_note := NULLIF(p->>'job_note',''); END IF;
  IF COALESCE(n.customer_name,'') = '' OR COALESCE(n.bl_no,'') = '' OR COALESCE(n.pickup_location_text,'') = '' OR COALESCE(n.return_location_text,'') = '' THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:ข้อมูลบังคับ (*) ไม่ครบ';
  END IF;
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'customer_name', j.customer_name, n.customer_name, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'bl_no', j.bl_no, n.bl_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'booking_no', j.booking_no, n.booking_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'container_no', j.container_no, n.container_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'container_size', j.container_size, n.container_size, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'seal_no', j.seal_no, n.seal_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'trailer_plate', j.trailer_plate, n.trailer_plate, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'billing_address', j.billing_address, n.billing_address, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'pickup_location', j.pickup_location_text, n.pickup_location_text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'pickup_date', j.pickup_date::text, n.pickup_date::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'pickup_time', j.pickup_time::text, n.pickup_time::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'pickup_note', j.pickup_note, n.pickup_note, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_location', j.factory_location_text, n.factory_location_text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_date', j.factory_date::text, n.factory_date::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_time', j.factory_time::text, n.factory_time::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_contact', j.factory_contact, n.factory_contact, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_phone', j.factory_phone, n.factory_phone, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'factory_note', j.factory_note, n.factory_note, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'return_location', j.return_location_text, n.return_location_text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'return_date', j.return_date::text, n.return_date::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'return_time', j.return_time::text, n.return_time::text, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'return_note', j.return_note, n.return_note, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'job_note', j.job_note, n.job_note, uid, un);
  UPDATE public.transport_jobs SET customer_id = n.customer_id, customer_name = n.customer_name, bl_no = n.bl_no, booking_no = n.booking_no,
    container_no = n.container_no, container_size = n.container_size, seal_no = n.seal_no, trailer_plate = n.trailer_plate, billing_address = n.billing_address,
    pickup_location_id = n.pickup_location_id, pickup_location_text = n.pickup_location_text, pickup_date = n.pickup_date, pickup_time = n.pickup_time, pickup_note = n.pickup_note,
    factory_location_id = n.factory_location_id, factory_location_text = n.factory_location_text, factory_date = n.factory_date, factory_time = n.factory_time,
    factory_contact = n.factory_contact, factory_phone = n.factory_phone, factory_note = n.factory_note,
    return_location_id = n.return_location_id, return_location_text = n.return_location_text, return_date = n.return_date, return_time = n.return_time, return_note = n.return_note,
    job_note = n.job_note, updated_at = now(), updated_by = uid
  WHERE id = j.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'NOTE', NULL, 'แก้ไขข้อมูลงาน', NULLIF(p->>'edit_note',''), NULL, NULL, NULL);
  IF j.driver_id IS NOT NULL THEN
    PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'updated'));
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'updated'));
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

-- 5) job list (same signature; + trailer_plate, seal_no, tl_status, tl_status_at, driver_phone)
CREATE OR REPLACE FUNCTION public.tnj_job_list(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_page int; v_size int; v_total int; v_rows jsonb; v_q text; stale int; v_driver uuid;
  d_from date; d_to date; st text[];
BEGIN
  c := public.tnj_auth(p_token);
  v_page := GREATEST(COALESCE((p->>'page')::int, 1), 1);
  v_size := LEAST(GREATEST(COALESCE((p->>'page_size')::int, 50), 1), 500);
  v_q := NULLIF(btrim(p->>'q'),'');
  stale := public.tnj_setting('gps_stale_min','5')::int;
  v_driver := CASE WHEN c->>'role' = 'DRIVER' THEN (c->>'driver_id')::uuid ELSE NULLIF(p->>'driver_id','')::uuid END;
  d_from := NULLIF(p->>'date_from','')::date; d_to := NULLIF(p->>'date_to','')::date;
  IF p ? 'statuses' AND jsonb_typeof(p->'statuses') = 'array' THEN
    SELECT array_agg(x) INTO st FROM jsonb_array_elements_text(p->'statuses') x;
  ELSIF NULLIF(p->>'status','') IS NOT NULL THEN st := ARRAY[p->>'status'];
  END IF;

  WITH base AS (
    SELECT j.* FROM public.transport_jobs j
    WHERE (v_driver IS NULL OR j.driver_id = v_driver)
      AND (d_from IS NULL OR j.job_date >= d_from) AND (d_to IS NULL OR j.job_date <= d_to)
      AND (NULLIF(p->>'job_date','') IS NULL OR j.job_date = (p->>'job_date')::date)
      AND (st IS NULL OR j.status = ANY(st))
      AND (NULLIF(p->>'customer','') IS NULL OR j.customer_name ILIKE '%' || (p->>'customer') || '%')
      AND (NULLIF(p->>'vehicle_id','') IS NULL OR j.vehicle_id = (p->>'vehicle_id')::uuid)
      AND (NULLIF(p->>'license_plate','') IS NULL OR j.license_plate ILIKE '%' || (p->>'license_plate') || '%')
      AND (NULLIF(p->>'pickup','') IS NULL OR j.pickup_location_text ILIKE '%' || (p->>'pickup') || '%')
      AND (NULLIF(p->>'factory','') IS NULL OR COALESCE(j.factory_location_text,'') ILIKE '%' || (p->>'factory') || '%')
      AND (COALESCE((p->>'active_only')::boolean,false) = false OR public.tnj_is_active_status(j.status))
      AND (v_q IS NULL OR j.job_no ILIKE '%'||v_q||'%' OR j.bl_no ILIKE '%'||v_q||'%' OR j.customer_name ILIKE '%'||v_q||'%'
           OR COALESCE(j.container_no,'') ILIKE '%'||v_q||'%' OR COALESCE(j.driver_name,'') ILIKE '%'||v_q||'%' OR COALESCE(j.license_plate,'') ILIKE '%'||v_q||'%')
  )
  SELECT count(*) INTO v_total FROM base;

  WITH base AS (
    SELECT j.* FROM public.transport_jobs j
    WHERE (v_driver IS NULL OR j.driver_id = v_driver)
      AND (d_from IS NULL OR j.job_date >= d_from) AND (d_to IS NULL OR j.job_date <= d_to)
      AND (NULLIF(p->>'job_date','') IS NULL OR j.job_date = (p->>'job_date')::date)
      AND (st IS NULL OR j.status = ANY(st))
      AND (NULLIF(p->>'customer','') IS NULL OR j.customer_name ILIKE '%' || (p->>'customer') || '%')
      AND (NULLIF(p->>'vehicle_id','') IS NULL OR j.vehicle_id = (p->>'vehicle_id')::uuid)
      AND (NULLIF(p->>'license_plate','') IS NULL OR j.license_plate ILIKE '%' || (p->>'license_plate') || '%')
      AND (NULLIF(p->>'pickup','') IS NULL OR j.pickup_location_text ILIKE '%' || (p->>'pickup') || '%')
      AND (NULLIF(p->>'factory','') IS NULL OR COALESCE(j.factory_location_text,'') ILIKE '%' || (p->>'factory') || '%')
      AND (COALESCE((p->>'active_only')::boolean,false) = false OR public.tnj_is_active_status(j.status))
      AND (v_q IS NULL OR j.job_no ILIKE '%'||v_q||'%' OR j.bl_no ILIKE '%'||v_q||'%' OR j.customer_name ILIKE '%'||v_q||'%'
           OR COALESCE(j.container_no,'') ILIKE '%'||v_q||'%' OR COALESCE(j.driver_name,'') ILIKE '%'||v_q||'%' OR COALESCE(j.license_plate,'') ILIKE '%'||v_q||'%')
    ORDER BY j.job_date DESC, j.job_no DESC
    LIMIT v_size OFFSET (v_page-1)*v_size
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', b.id, 'job_no', b.job_no, 'job_date', b.job_date, 'customer_name', b.customer_name, 'bl_no', b.bl_no,
      'container_no', b.container_no, 'container_size', b.container_size, 'seal_no', b.seal_no, 'vehicle_name', b.vehicle_name, 'license_plate', b.license_plate, 'trailer_plate', b.trailer_plate,
      'driver_id', b.driver_id, 'driver_name', b.driver_name, 'driver_phone', (SELECT d.phone FROM public.transport_drivers d WHERE d.id = b.driver_id),
      'pickup_location_text', b.pickup_location_text, 'factory_location_text', b.factory_location_text,
      'return_location_text', b.return_location_text, 'pickup_date', b.pickup_date, 'pickup_time', b.pickup_time, 'factory_date', b.factory_date, 'factory_time', b.factory_time,
      'return_date', b.return_date, 'return_time', b.return_time,
      'status', b.status, 'status_th', public.tnj_status_th(b.status), 'status_order', public.tnj_status_order(b.status), 'problem_flag', b.problem_flag,
      'tl_status', b.tl_status, 'tl_status_at', b.tl_status_at,
      'last_gps_at', b.last_gps_at, 'last_lat', b.last_lat, 'last_lng', b.last_lng,
      'gps_stale', (b.last_gps_at IS NULL OR b.last_gps_at < now() - make_interval(mins => stale)),
      'gps_age_min', CASE WHEN b.last_gps_at IS NULL THEN NULL ELSE floor(extract(epoch FROM (now() - b.last_gps_at))/60)::int END)), '[]'::jsonb)
  INTO v_rows FROM base b;
  RETURN jsonb_build_object('rows', v_rows, 'total', v_total, 'page', v_page, 'page_size', v_size, 'server_time', now());
END $$;

-- 6) NEW: OFFICE timeline status (12 fixed statuses, user-chosen datetime, append-only; ✅ ปิดงาน closes job with audit)
CREATE OR REPLACE FUNCTION public.tnj_timeline_status(p_token text, p_job_id uuid, p_event_at timestamptz, p_status text, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; tl uuid; v_close boolean;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  IF p_status IS NULL OR p_status NOT IN ('รถถึงโรงงานเรียบร้อย รอคิวลงสินค้า','รอคิวลงสินค้า','ลงสินค้าได้ครึ่งตู้','ลงสินค้าเรียบร้อย ออกจากโรงงาน',
      'รอรับตู้เปล่า','รถรับตู้หนาแน่น','รถติดในท่าเรือ','รถติดในลานตู้','บรรจุตู้เรียบร้อย ออกจากโรงงาน','คืนตู้เรียบร้อย',
      '⏱️ เกิน Free Time เริ่มคิดค่าเสียเวลา','✅ ปิดงาน') THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:สถานะไม่ถูกต้อง';
  END IF;
  IF p_event_at IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุวันที่และเวลา'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิด/ยกเลิกแล้ว'; END IF;
  v_close := (p_status = '✅ ปิดงาน');
  tl := public.tnj_timeline_add(c, j.id, 'STATUS', CASE WHEN v_close THEN 'COMPLETED' ELSE NULL END, p_status, NULLIF(btrim(COALESCE(p_note,'')),''), NULL, NULL, NULL, NULL, NULL, p_event_at);
  UPDATE public.transport_jobs SET tl_status = p_status, tl_status_at = p_event_at, updated_at = now(), updated_by = (c->>'user_id')::uuid
   WHERE id = j.id AND (tl_status_at IS NULL OR tl_status_at <= p_event_at);
  IF v_close THEN
    PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'CLOSE_JOB', 'status', j.status, 'COMPLETED', (c->>'user_id')::uuid, c->>'full_name');
    UPDATE public.transport_jobs SET status = 'COMPLETED', completed_at = now(), completed_by = (c->>'user_id')::uuid, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
    UPDATE public.transport_job_mileage SET status = CASE WHEN end_mileage IS NULL THEN 'INCOMPLETE' ELSE 'CLOSED' END, updated_at = now() WHERE job_id = j.id;
    IF j.driver_id IS NOT NULL THEN
      PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'status'));
    END IF;
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'status', jsonb_build_object('job_id', j.id, 'tl_status', p_status));
  RETURN jsonb_build_object('ok', true, 'timeline_id', tl, 'job', public.tnj_job_get(p_token, j.id));
END $$;

-- 7) master data: 5 drivers (no login) + their tractor / trailer
INSERT INTO public.transport_vehicles(vehicle_name, license_plate, trailer_plate, vehicle_type)
SELECT 'หัวลาก ' || v.h, v.h, v.t, 'หัวลาก' FROM (VALUES ('74-2271','74-2272'),('74-2275','74-2276'),('74-3116','74-9078'),('74-3114','74-9079'),('74-2273','74-2274')) v(h,t)
WHERE NOT EXISTS (SELECT 1 FROM public.transport_vehicles x WHERE lower(x.license_plate) = lower(v.h));
INSERT INTO public.transport_drivers(full_name, phone, default_vehicle_id, is_active)
SELECT d.n, d.ph, (SELECT x.id FROM public.transport_vehicles x WHERE lower(x.license_plate) = lower(d.h)), true
FROM (VALUES ('เจนชัย สมจิตร','74-2271','097-975-2381'),('น้อย สำรวมจิต','74-2275','093-056-8943'),('มนตรี สิงห์โต','74-3116','080-687-1036'),
             ('สมบูรณ์ สอนศรี','74-3114','091-271-8428'),('ก้องเกียรติ เจริญศิริ','74-2273','092-549-0108')) d(n,h,ph)
WHERE NOT EXISTS (SELECT 1 FROM public.transport_drivers x WHERE x.full_name = d.n);
