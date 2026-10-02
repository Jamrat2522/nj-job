-- ============================================================
-- TRANSPORT NJ — RUN-02 RPC  (all SECURITY DEFINER, search_path public,extensions)
-- Every public RPC takes p_token first and calls tnj_auth(); role/driver come from the
-- server-side session only (never from the client).
-- Error codes (message prefix): TNJ_MAINTENANCE, TNJ_SESSION_INVALID, TNJ_VERSION_MISMATCH,
--   TNJ_FORBIDDEN, TNJ_VALIDATION:<thai text>
-- ============================================================

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.tnj_now_th() RETURNS timestamptz
LANGUAGE sql STABLE AS $$ SELECT now() $$;

CREATE OR REPLACE FUNCTION public.tnj_status_order(p_status text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_status
    WHEN 'NEW' THEN 1 WHEN 'ASSIGNED' THEN 2 WHEN 'ACCEPTED' THEN 3 WHEN 'GOING_TO_PICKUP' THEN 4
    WHEN 'ARRIVED_PICKUP' THEN 5 WHEN 'CONTAINER_PICKED_UP' THEN 6 WHEN 'GOING_TO_FACTORY' THEN 7
    WHEN 'ARRIVED_FACTORY' THEN 8 WHEN 'LEAVING_FACTORY' THEN 9 WHEN 'GOING_TO_RETURN' THEN 10
    WHEN 'ARRIVED_RETURN' THEN 11 WHEN 'CONTAINER_RETURNED' THEN 12 WHEN 'COMPLETED' THEN 13
    WHEN 'PROBLEM' THEN 90 WHEN 'CANCELLED' THEN 99 ELSE 0 END $$;

CREATE OR REPLACE FUNCTION public.tnj_status_th(p_status text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_status
    WHEN 'NEW' THEN 'สร้างงาน' WHEN 'ASSIGNED' THEN 'มอบหมายงาน' WHEN 'ACCEPTED' THEN 'คนขับรับงาน'
    WHEN 'GOING_TO_PICKUP' THEN 'ออกเดินทางไปรับตู้' WHEN 'ARRIVED_PICKUP' THEN 'ถึงท่ารับตู้'
    WHEN 'CONTAINER_PICKED_UP' THEN 'รับตู้แล้ว' WHEN 'GOING_TO_FACTORY' THEN 'ออกจากท่า ไปโรงงาน'
    WHEN 'ARRIVED_FACTORY' THEN 'ถึงโรงงาน' WHEN 'LEAVING_FACTORY' THEN 'ออกจากโรงงาน'
    WHEN 'GOING_TO_RETURN' THEN 'ไปคืนตู้' WHEN 'ARRIVED_RETURN' THEN 'ถึงลานคืนตู้'
    WHEN 'CONTAINER_RETURNED' THEN 'คืนตู้สำเร็จ' WHEN 'COMPLETED' THEN 'ปิดงาน'
    WHEN 'PROBLEM' THEN 'แจ้งปัญหา' WHEN 'CANCELLED' THEN 'ยกเลิกงาน' ELSE p_status END $$;

CREATE OR REPLACE FUNCTION public.tnj_is_active_status(p_status text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT p_status IN ('ACCEPTED','GOING_TO_PICKUP','ARRIVED_PICKUP','CONTAINER_PICKED_UP','GOING_TO_FACTORY',
                      'ARRIVED_FACTORY','LEAVING_FACTORY','GOING_TO_RETURN','ARRIVED_RETURN','CONTAINER_RETURNED','PROBLEM') $$;

CREATE OR REPLACE FUNCTION public.tnj_setting(p_key text, p_default text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
  SELECT COALESCE((SELECT value FROM public.transport_settings WHERE key = p_key), p_default) $$;

-- broadcast ping only (ids/events, never job data); tolerant if realtime.send is absent
CREATE OR REPLACE FUNCTION public.tnj_broadcast(p_topic text, p_event text, p_payload jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
BEGIN
  BEGIN
    PERFORM realtime.send(p_payload, p_event, p_topic, false);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.tnj_audit_write(p_table text, p_record_id text, p_job_id uuid, p_action text,
  p_field text, p_old text, p_new text, p_user_id uuid, p_user_name text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
BEGIN
  IF p_action IN ('UPDATE','TIMELINE_EDIT','MILEAGE_EDIT','FUEL_EDIT') AND p_old IS NOT DISTINCT FROM p_new THEN RETURN; END IF;
  INSERT INTO public.transport_audit_logs(table_name, record_id, job_id, action, field, old_value, new_value, user_id, user_name, created_by)
  VALUES (p_table, p_record_id, p_job_id, p_action, p_field, p_old, p_new, p_user_id, p_user_name, p_user_id);
END $$;

-- ---------- version / maintenance (shared source: system_settings key 'transportnj_release') ----------
CREATE OR REPLACE FUNCTION public.tnj_version_status() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE v jsonb;
BEGIN
  SELECT s.value INTO v FROM public.system_settings s WHERE s.key = 'transportnj_release';
  IF v IS NULL THEN
    RETURN jsonb_build_object('version', NULL, 'maintenance_active', false, 'server_time', now());
  END IF;
  IF COALESCE((v->'maintenance'->>'active')::boolean, false)
     AND (v->'maintenance'->>'ends_at') IS NOT NULL
     AND now() >= (v->'maintenance'->>'ends_at')::timestamptz THEN
    v := jsonb_set(v, '{maintenance,active}', 'false');
    UPDATE public.system_settings s SET value = v, updated_at = now(), updated_by = 'tnj-auto-expire' WHERE s.key = 'transportnj_release';
  END IF;
  RETURN jsonb_build_object(
    'version', v->>'version',
    'maintenance_active', COALESCE((v->'maintenance'->>'active')::boolean, false),
    'maintenance_message', COALESCE(v->'maintenance'->>'message', 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที'),
    'maintenance_started_at', v->'maintenance'->>'started_at',
    'maintenance_ends_at', v->'maintenance'->>'ends_at',
    'server_time', now());
END $$;

-- ---------- auth ----------
CREATE OR REPLACE FUNCTION public.tnj_role_of(p_user public.app_users) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE r text;
BEGIN
  SELECT tnj_role INTO r FROM public.transport_user_roles WHERE app_user_id = p_user.id;
  IF r IS NOT NULL THEN RETURN r; END IF;
  IF upper(p_user.role::text) = 'SUPER_ADMIN' THEN RETURN 'SUPER_ADMIN'; END IF;
  IF upper(p_user.role::text) = 'ADMIN' THEN RETURN 'ADMIN'; END IF;
  IF EXISTS (SELECT 1 FROM public.transport_drivers d WHERE d.app_user_id = p_user.id) THEN RETURN 'DRIVER'; END IF;
  RETURN 'TRANSPORT';
END $$;

CREATE OR REPLACE FUNCTION public.tnj_login(p_username text, p_password text, p_app_version text DEFAULT NULL, p_device text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE u public.app_users; v_role text; v_driver uuid; v_token text; vs jsonb; v_ok boolean := false;
BEGIN
  vs := public.tnj_version_status();
  IF (vs->>'maintenance_active')::boolean THEN RAISE EXCEPTION 'TNJ_MAINTENANCE'; END IF;

  SELECT * INTO u FROM public.app_users a
   WHERE lower(a.username) = lower(trim(COALESCE(p_username,''))) AND a.app_code = 'transport' LIMIT 1;
  IF u.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'; END IF;
  IF u.is_active IS FALSE OR lower(COALESCE(u.status,'active')) <> 'active' OR u.approved IS FALSE THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:บัญชีนี้ถูกปิดการใช้งาน';
  END IF;
  IF COALESCE(u.password_hash,'') <> '' THEN
    v_ok := (u.password_hash = extensions.crypt(COALESCE(p_password,''), u.password_hash));
  END IF;
  IF NOT v_ok AND COALESCE(u.password,'') <> '' THEN
    v_ok := (u.password = COALESCE(p_password,''));
  END IF;
  IF NOT v_ok THEN RAISE EXCEPTION 'TNJ_VALIDATION:ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'; END IF;

  v_role := public.tnj_role_of(u);
  IF v_role = 'DRIVER' THEN
    SELECT id INTO v_driver FROM public.transport_drivers WHERE app_user_id = u.id AND is_active;
    IF v_driver IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:บัญชีคนขับนี้ยังไม่ได้เปิดใช้งาน'; END IF;
  END IF;
  -- version enforcement: only SUPER_ADMIN may log in from a build that differs from the announced version
  IF vs->>'version' IS NOT NULL AND p_app_version IS NOT NULL AND p_app_version <> (vs->>'version') AND v_role <> 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'TNJ_VERSION_MISMATCH';
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.transport_sessions(app_user_id, token_hash, tnj_role, driver_id, app_version, device_info)
  VALUES (u.id, encode(extensions.digest(v_token,'sha256'),'hex'), v_role, v_driver, p_app_version, left(p_device, 300));

  RETURN jsonb_build_object('token', v_token, 'user_id', u.id, 'username', u.username, 'full_name', COALESCE(u.full_name, u.username),
    'role', v_role, 'driver_id', v_driver, 'server_version', vs->>'version', 'server_time', now());
END $$;

CREATE OR REPLACE FUNCTION public.tnj_auth(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE s public.transport_sessions; u public.app_users; vs jsonb; h text;
BEGIN
  vs := public.tnj_version_status();
  IF (vs->>'maintenance_active')::boolean THEN RAISE EXCEPTION 'TNJ_MAINTENANCE'; END IF;
  h := encode(extensions.digest(COALESCE(p_token,''),'sha256'),'hex');
  SELECT * INTO s FROM public.transport_sessions WHERE token_hash = h AND revoked_at IS NULL AND expires_at > now();
  IF s.id IS NULL THEN RAISE EXCEPTION 'TNJ_SESSION_INVALID'; END IF;
  SELECT * INTO u FROM public.app_users WHERE id = s.app_user_id AND app_code = 'transport' AND is_active IS NOT FALSE
    AND lower(COALESCE(status,'active')) = 'active';
  IF u.id IS NULL THEN RAISE EXCEPTION 'TNJ_SESSION_INVALID'; END IF;
  IF vs->>'version' IS NOT NULL AND s.app_version IS NOT NULL AND s.app_version <> (vs->>'version') AND s.tnj_role <> 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'TNJ_VERSION_MISMATCH';
  END IF;
  IF s.last_seen_at < now() - interval '5 minutes' THEN
    UPDATE public.transport_sessions SET last_seen_at = now(), expires_at = now() + interval '12 hours' WHERE id = s.id;
  END IF;
  RETURN jsonb_build_object('user_id', u.id, 'username', u.username, 'full_name', COALESCE(u.full_name, u.username),
    'role', s.tnj_role, 'driver_id', s.driver_id, 'session_id', s.id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_session_check(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb;
BEGIN
  c := public.tnj_auth(p_token);
  RETURN c || jsonb_build_object('server_version', public.tnj_version_status()->>'version', 'server_time', now(),
    'gps_interval_sec', public.tnj_setting('gps_interval_sec','30')::int,
    'gps_stale_min', public.tnj_setting('gps_stale_min','5')::int);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_logout(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
BEGIN
  UPDATE public.transport_sessions SET revoked_at = now()
   WHERE token_hash = encode(extensions.digest(COALESCE(p_token,''),'sha256'),'hex') AND revoked_at IS NULL;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_require_office(c jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF c->>'role' NOT IN ('SUPER_ADMIN','ADMIN','TRANSPORT') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.tnj_require_admin(c jsonb) RETURNS void
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF c->>'role' NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
END $$;

-- version announce (SUPER_ADMIN): one-shot maintenance per version, revokes all sessions
CREATE OR REPLACE FUNCTION public.tnj_version_set(p_token text, p_version text, p_maintenance_minutes integer DEFAULT 10, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v jsonb; old_ver text; s public.transport_sessions; h text;
BEGIN
  -- auth without maintenance gate (announce is allowed while a previous maintenance is still running)
  h := encode(extensions.digest(COALESCE(p_token,''),'sha256'),'hex');
  SELECT * INTO s FROM public.transport_sessions WHERE token_hash = h AND revoked_at IS NULL AND expires_at > now();
  IF s.id IS NULL THEN RAISE EXCEPTION 'TNJ_SESSION_INVALID'; END IF;
  IF s.tnj_role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF COALESCE(btrim(p_version),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:ต้องระบุ version'; END IF;

  SELECT value INTO v FROM public.system_settings WHERE key = 'transportnj_release' FOR UPDATE;
  IF v IS NULL THEN
    v := jsonb_build_object('version', NULL, 'maintenance', jsonb_build_object('active', false));
    INSERT INTO public.system_settings(key, value, category, is_public, updated_by)
    VALUES ('transportnj_release', v, 'transportnj', false, 'tnj') ON CONFLICT (key) DO NOTHING;
  END IF;
  old_ver := v->>'version';
  IF btrim(p_version) = COALESCE(old_ver,'') THEN
    RETURN public.tnj_version_status();
  END IF;
  v := jsonb_set(v, '{version}', to_jsonb(btrim(p_version)));
  IF p_note IS NOT NULL THEN v := jsonb_set(v, '{note}', to_jsonb(p_note)); END IF;
  IF p_maintenance_minutes > 0 AND COALESCE(v->'maintenance'->>'for_version','') <> btrim(p_version) THEN
    v := jsonb_set(v, '{maintenance}', jsonb_build_object(
      'active', true, 'for_version', btrim(p_version),
      'started_at', to_jsonb(now()), 'ends_at', to_jsonb(now() + make_interval(mins => p_maintenance_minutes)),
      'message', 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ ' || p_maintenance_minutes || ' นาที'));
  END IF;
  UPDATE public.system_settings SET value = v, updated_at = now(), updated_by = 'tnj:' || s.app_user_id::text WHERE key = 'transportnj_release';
  -- invalidate ALL sessions (mandatory fresh login after maintenance)
  UPDATE public.transport_sessions SET revoked_at = now() WHERE revoked_at IS NULL;
  PERFORM public.tnj_audit_write('system_settings', 'transportnj_release', NULL, 'VERSION_SET', 'version', old_ver, btrim(p_version), s.app_user_id, NULL);
  PERFORM public.tnj_broadcast('tnj:office', 'version', jsonb_build_object('version', btrim(p_version)));
  RETURN public.tnj_version_status();
END $$;

-- ---------- timeline ----------
CREATE OR REPLACE FUNCTION public.tnj_timeline_add(c jsonb, p_job_id uuid, p_event_type text, p_status text, p_title text,
  p_note text, p_lat double precision, p_lng double precision, p_acc double precision,
  p_problem_type text DEFAULT NULL, p_problem_detail text DEFAULT NULL, p_event_at timestamptz DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE v_id uuid; v_seq int;
BEGIN
  SELECT COALESCE(max(seq),0)+1 INTO v_seq FROM public.transport_job_timeline WHERE job_id = p_job_id;
  INSERT INTO public.transport_job_timeline(job_id, seq, event_type, status, title, event_at, actor_user_id, actor_name, actor_role,
    latitude, longitude, accuracy, note, problem_type, problem_detail, created_by)
  VALUES (p_job_id, v_seq, p_event_type, p_status, p_title, COALESCE(p_event_at, now()), (c->>'user_id')::uuid, c->>'full_name', c->>'role',
    p_lat, p_lng, p_acc, NULLIF(p_note,''), p_problem_type, p_problem_detail, (c->>'user_id')::uuid)
  RETURNING id INTO v_id;
  PERFORM public.tnj_broadcast('tnj:job:' || p_job_id::text, 'timeline', jsonb_build_object('job_id', p_job_id));
  RETURN v_id;
END $$;

-- ---------- job no ----------
CREATE OR REPLACE FUNCTION public.tnj_next_job_no(p_date date) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE n int;
BEGIN
  INSERT INTO public.transport_job_seq(seq_date, last_no) VALUES (p_date, 1)
  ON CONFLICT (seq_date) DO UPDATE SET last_no = public.transport_job_seq.last_no + 1
  RETURNING last_no INTO n;
  RETURN 'NJ' || to_char(p_date, 'YYMMDD') || '-' || lpad(n::text, 3, '0');
END $$;

-- ---------- job: office ----------
CREATE OR REPLACE FUNCTION public.tnj_job_create(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; v_date date; v_cust uuid; v_veh public.transport_vehicles; v_drv public.transport_drivers;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  IF COALESCE(btrim(p->>'customer_name'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อลูกค้า'; END IF;
  IF COALESCE(btrim(p->>'bl_no'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุ B/L'; END IF;
  IF COALESCE(btrim(p->>'pickup_location_text'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุท่ารับตู้'; END IF;
  IF (p->>'pickup_date') IS NULL OR (p->>'pickup_time') IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุวันที่/เวลารับตู้'; END IF;
  IF COALESCE(btrim(p->>'factory_location_text'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุสถานที่ส่งโรงงาน'; END IF;
  IF COALESCE(btrim(p->>'return_location_text'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุสถานที่คืนตู้'; END IF;
  IF (p->>'return_date') IS NULL OR (p->>'return_time') IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุวันที่/เวลาคืนตู้'; END IF;

  v_date := COALESCE((p->>'job_date')::date, (now() AT TIME ZONE 'Asia/Bangkok')::date);
  -- customer: by id or auto-create by name
  v_cust := NULLIF(p->>'customer_id','')::uuid;
  IF v_cust IS NULL THEN
    SELECT id INTO v_cust FROM public.transport_customers WHERE lower(name) = lower(btrim(p->>'customer_name'));
    IF v_cust IS NULL THEN
      INSERT INTO public.transport_customers(name, created_by) VALUES (btrim(p->>'customer_name'), (c->>'user_id')::uuid) RETURNING id INTO v_cust;
    END IF;
  END IF;
  IF NULLIF(p->>'vehicle_id','') IS NOT NULL THEN SELECT * INTO v_veh FROM public.transport_vehicles WHERE id = (p->>'vehicle_id')::uuid; END IF;
  IF NULLIF(p->>'driver_id','') IS NOT NULL THEN SELECT * INTO v_drv FROM public.transport_drivers WHERE id = (p->>'driver_id')::uuid; END IF;

  INSERT INTO public.transport_jobs(job_no, job_date, customer_id, customer_name, bl_no, booking_no, container_no, container_size, seal_no,
    vehicle_id, vehicle_name, license_plate, driver_id, driver_name, status,
    pickup_location_id, pickup_location_text, pickup_date, pickup_time, pickup_note,
    factory_location_id, factory_location_text, factory_date, factory_time, factory_contact, factory_phone, factory_note,
    return_location_id, return_location_text, return_date, return_time, return_note, job_note, created_by, updated_by)
  VALUES (public.tnj_next_job_no(v_date), v_date, v_cust, btrim(p->>'customer_name'), btrim(p->>'bl_no'), NULLIF(p->>'booking_no',''),
    NULLIF(p->>'container_no',''), NULLIF(p->>'container_size',''), NULLIF(p->>'seal_no',''),
    v_veh.id, v_veh.vehicle_name, v_veh.license_plate, v_drv.id, v_drv.full_name, 'NEW',
    NULLIF(p->>'pickup_location_id','')::uuid, btrim(p->>'pickup_location_text'), (p->>'pickup_date')::date, (p->>'pickup_time')::time, NULLIF(p->>'pickup_note',''),
    NULLIF(p->>'factory_location_id','')::uuid, btrim(p->>'factory_location_text'), NULLIF(p->>'factory_date','')::date, NULLIF(p->>'factory_time','')::time,
    NULLIF(p->>'factory_contact',''), NULLIF(p->>'factory_phone',''), NULLIF(p->>'factory_note',''),
    NULLIF(p->>'return_location_id','')::uuid, btrim(p->>'return_location_text'), (p->>'return_date')::date, (p->>'return_time')::time, NULLIF(p->>'return_note',''),
    NULLIF(p->>'job_note',''), (c->>'user_id')::uuid, (c->>'user_id')::uuid)
  RETURNING * INTO j;

  PERFORM public.tnj_timeline_add(c, j.id, 'SYSTEM', 'NEW', 'สร้างงาน', NULL, NULL, NULL, NULL);
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'create'));
  IF COALESCE((p->>'assign_now')::boolean, false) AND j.driver_id IS NOT NULL THEN
    RETURN public.tnj_job_assign(p_token, j.id, j.vehicle_id, j.driver_id);
  END IF;
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_job_assign(p_token text, p_job_id uuid, p_vehicle_id uuid, p_driver_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; v public.transport_vehicles; d public.transport_drivers; old_driver uuid;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF j.status NOT IN ('NEW','ASSIGNED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานนี้คนขับรับงานแล้ว ไม่สามารถมอบหมายใหม่ได้'; END IF;
  SELECT * INTO d FROM public.transport_drivers WHERE id = p_driver_id AND is_active;
  IF d.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาเลือกคนขับ'; END IF;
  IF p_vehicle_id IS NOT NULL THEN SELECT * INTO v FROM public.transport_vehicles WHERE id = p_vehicle_id; END IF;
  old_driver := j.driver_id;
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'driver', j.driver_name, d.full_name, (c->>'user_id')::uuid, c->>'full_name');
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'vehicle', j.vehicle_name, v.vehicle_name, (c->>'user_id')::uuid, c->>'full_name');
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'license_plate', j.license_plate, v.license_plate, (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_jobs SET vehicle_id = v.id, vehicle_name = v.vehicle_name, license_plate = v.license_plate,
    driver_id = d.id, driver_name = d.full_name, status = 'ASSIGNED', assigned_at = now(), assigned_by = (c->>'user_id')::uuid,
    updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'STATUS', 'ASSIGNED', 'มอบหมายงานให้ ' || d.full_name ||
    CASE WHEN v.license_plate IS NOT NULL THEN ' (' || v.license_plate || ')' ELSE '' END, NULL, NULL, NULL, NULL);
  PERFORM public.tnj_broadcast('tnj:driver:' || d.id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'assigned'));
  IF old_driver IS NOT NULL AND old_driver <> d.id THEN
    PERFORM public.tnj_broadcast('tnj:driver:' || old_driver::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'unassigned'));
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'assigned'));
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

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
  IF p ? 'pickup_location_id' THEN n.pickup_location_id := NULLIF(p->>'pickup_location_id','')::uuid; END IF;
  IF p ? 'pickup_location_text' THEN n.pickup_location_text := btrim(p->>'pickup_location_text'); END IF;
  IF p ? 'pickup_date' THEN n.pickup_date := (p->>'pickup_date')::date; END IF;
  IF p ? 'pickup_time' THEN n.pickup_time := (p->>'pickup_time')::time; END IF;
  IF p ? 'pickup_note' THEN n.pickup_note := NULLIF(p->>'pickup_note',''); END IF;
  IF p ? 'factory_location_id' THEN n.factory_location_id := NULLIF(p->>'factory_location_id','')::uuid; END IF;
  IF p ? 'factory_location_text' THEN n.factory_location_text := btrim(p->>'factory_location_text'); END IF;
  IF p ? 'factory_date' THEN n.factory_date := NULLIF(p->>'factory_date','')::date; END IF;
  IF p ? 'factory_time' THEN n.factory_time := NULLIF(p->>'factory_time','')::time; END IF;
  IF p ? 'factory_contact' THEN n.factory_contact := NULLIF(p->>'factory_contact',''); END IF;
  IF p ? 'factory_phone' THEN n.factory_phone := NULLIF(p->>'factory_phone',''); END IF;
  IF p ? 'factory_note' THEN n.factory_note := NULLIF(p->>'factory_note',''); END IF;
  IF p ? 'return_location_id' THEN n.return_location_id := NULLIF(p->>'return_location_id','')::uuid; END IF;
  IF p ? 'return_location_text' THEN n.return_location_text := btrim(p->>'return_location_text'); END IF;
  IF p ? 'return_date' THEN n.return_date := (p->>'return_date')::date; END IF;
  IF p ? 'return_time' THEN n.return_time := (p->>'return_time')::time; END IF;
  IF p ? 'return_note' THEN n.return_note := NULLIF(p->>'return_note',''); END IF;
  IF p ? 'job_note' THEN n.job_note := NULLIF(p->>'job_note',''); END IF;
  IF COALESCE(n.customer_name,'') = '' OR COALESCE(n.bl_no,'') = '' OR COALESCE(n.pickup_location_text,'') = ''
     OR COALESCE(n.factory_location_text,'') = '' OR COALESCE(n.return_location_text,'') = '' THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:ข้อมูลบังคับ (*) ไม่ครบ';
  END IF;
  -- audit every changed field
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'customer_name', j.customer_name, n.customer_name, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'bl_no', j.bl_no, n.bl_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'booking_no', j.booking_no, n.booking_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'container_no', j.container_no, n.container_no, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'container_size', j.container_size, n.container_size, uid, un);
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'UPDATE', 'seal_no', j.seal_no, n.seal_no, uid, un);
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
  n.updated_at := now(); n.updated_by := uid;
  UPDATE public.transport_jobs SET customer_id = n.customer_id, customer_name = n.customer_name, bl_no = n.bl_no, booking_no = n.booking_no,
    container_no = n.container_no, container_size = n.container_size, seal_no = n.seal_no,
    pickup_location_id = n.pickup_location_id, pickup_location_text = n.pickup_location_text, pickup_date = n.pickup_date, pickup_time = n.pickup_time, pickup_note = n.pickup_note,
    factory_location_id = n.factory_location_id, factory_location_text = n.factory_location_text, factory_date = n.factory_date, factory_time = n.factory_time,
    factory_contact = n.factory_contact, factory_phone = n.factory_phone, factory_note = n.factory_note,
    return_location_id = n.return_location_id, return_location_text = n.return_location_text, return_date = n.return_date, return_time = n.return_time, return_note = n.return_note,
    job_note = n.job_note, updated_at = n.updated_at, updated_by = n.updated_by
  WHERE id = j.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'NOTE', NULL, 'แก้ไขข้อมูลงาน', NULLIF(p->>'edit_note',''), NULL, NULL, NULL);
  IF j.driver_id IS NOT NULL THEN
    PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'updated'));
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'updated'));
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_job_cancel(p_token text, p_job_id uuid, p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิด/ยกเลิกแล้ว'; END IF;
  IF COALESCE(btrim(p_reason),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุเหตุผลการยกเลิก'; END IF;
  PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'CANCEL', 'status', j.status, 'CANCELLED', (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_jobs SET status = 'CANCELLED', cancelled_at = now(), cancelled_by = (c->>'user_id')::uuid, cancel_reason = btrim(p_reason),
    updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'STATUS', 'CANCELLED', 'ยกเลิกงาน', btrim(p_reason), NULL, NULL, NULL);
  IF j.driver_id IS NOT NULL THEN
    PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'cancelled'));
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'job', jsonb_build_object('job_id', j.id, 'event', 'cancelled'));
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

-- ---------- status engine (driver + office) ----------
CREATE OR REPLACE FUNCTION public.tnj_status_update(p_token text, p_job_id uuid, p_status text, p_note text DEFAULT NULL,
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL, p_acc double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; cur int; nxt int; is_driver boolean; m public.transport_job_mileage; v_title text;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  is_driver := (c->>'role' = 'DRIVER');
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF is_driver AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิด/ยกเลิกแล้ว'; END IF;
  IF p_status IN ('NEW','ASSIGNED','PROBLEM','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:สถานะไม่ถูกต้อง'; END IF;
  cur := public.tnj_status_order(j.status); nxt := public.tnj_status_order(p_status);
  IF nxt = 0 THEN RAISE EXCEPTION 'TNJ_VALIDATION:สถานะไม่ถูกต้อง'; END IF;
  IF j.status = 'PROBLEM' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานอยู่ในสถานะมีปัญหา กรุณากด "แก้ไขแล้ว" ก่อน'; END IF;

  IF p_status = 'ACCEPTED' THEN
    IF j.status <> 'ASSIGNED' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานนี้ไม่ได้อยู่ในสถานะรอรับงาน'; END IF;
    IF is_driver AND EXISTS (SELECT 1 FROM public.transport_jobs x WHERE x.driver_id = j.driver_id AND x.id <> j.id AND public.tnj_is_active_status(x.status)) THEN
      RAISE EXCEPTION 'TNJ_VALIDATION:คุณมีงานที่กำลังทำอยู่ กรุณาปิดงานเดิมก่อนรับงานใหม่';
    END IF;
    UPDATE public.transport_jobs SET status = 'ACCEPTED', accepted_at = now(), accepted_lat = p_lat, accepted_lng = p_lng,
      updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
    PERFORM public.tnj_timeline_add(c, j.id, 'STATUS', 'ACCEPTED', 'คนขับรับงาน', p_note, p_lat, p_lng, p_acc);
  ELSE
    IF cur < 3 THEN RAISE EXCEPTION 'TNJ_VALIDATION:คนขับยังไม่ได้รับงาน'; END IF;
    IF is_driver AND nxt <> cur + 1 THEN RAISE EXCEPTION 'TNJ_VALIDATION:ต้องอัปเดตสถานะตามลำดับ'; END IF;
    IF p_status = 'COMPLETED' THEN
      SELECT * INTO m FROM public.transport_job_mileage WHERE job_id = j.id;
      IF m.end_mileage IS NULL THEN
        v_title := 'ปิดงาน (ยังไม่ได้บันทึกไมล์หลัง)';
      ELSE v_title := 'ปิดงาน'; END IF;
      UPDATE public.transport_jobs SET status = 'COMPLETED', completed_at = now(), completed_by = (c->>'user_id')::uuid,
        updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
      UPDATE public.transport_job_mileage SET status = CASE WHEN end_mileage IS NULL THEN 'INCOMPLETE' ELSE 'CLOSED' END, updated_at = now() WHERE job_id = j.id;
    ELSE
      v_title := public.tnj_status_th(p_status);
      UPDATE public.transport_jobs SET status = p_status, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
    END IF;
    IF NOT is_driver AND nxt <> cur + 1 THEN
      PERFORM public.tnj_audit_write('transport_jobs', j.id::text, j.id, 'STATUS_SKIP', 'status', j.status, p_status, (c->>'user_id')::uuid, c->>'full_name');
    END IF;
    PERFORM public.tnj_timeline_add(c, j.id, 'STATUS', p_status, v_title, p_note, p_lat, p_lng, p_acc);
  END IF;
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    UPDATE public.transport_jobs SET last_gps_at = now(), last_lat = p_lat, last_lng = p_lng WHERE id = j.id;
  END IF;
  PERFORM public.tnj_broadcast('tnj:office', 'status', jsonb_build_object('job_id', j.id, 'status', p_status));
  IF NOT is_driver AND j.driver_id IS NOT NULL THEN
    PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'status'));
  END IF;
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_driver_accept(p_token text, p_job_id uuid, p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL, p_acc double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
  SELECT public.tnj_status_update(p_token, p_job_id, 'ACCEPTED', NULL, p_lat, p_lng, p_acc) $$;

CREATE OR REPLACE FUNCTION public.tnj_problem_report(p_token text, p_job_id uuid, p_type text, p_detail text,
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL, p_acc double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; tl uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF j.status IN ('NEW','ASSIGNED','COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:แจ้งปัญหาได้เฉพาะงานที่กำลังทำอยู่'; END IF;
  IF p_type NOT IN ('รถเสีย','รถติด','ท่าล่าช้า','รับตู้ไม่ได้','โรงงานไม่รับสินค้า','คืนตู้ไม่ได้','เอกสารไม่ครบ','อุบัติเหตุ','อื่น ๆ') THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:ประเภทปัญหาไม่ถูกต้อง';
  END IF;
  IF j.status <> 'PROBLEM' THEN
    UPDATE public.transport_jobs SET problem_prev_status = j.status, status = 'PROBLEM', problem_flag = true, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
  END IF;
  tl := public.tnj_timeline_add(c, j.id, 'PROBLEM', 'PROBLEM', 'แจ้งปัญหา: ' || p_type, p_detail, p_lat, p_lng, p_acc, p_type, p_detail);
  PERFORM public.tnj_broadcast('tnj:office', 'problem', jsonb_build_object('job_id', j.id, 'job_no', j.job_no, 'type', p_type));
  RETURN jsonb_build_object('ok', true, 'timeline_id', tl, 'job', public.tnj_job_get(p_token, j.id));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_problem_resolve(p_token text, p_job_id uuid, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL OR j.status <> 'PROBLEM' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานนี้ไม่ได้อยู่ในสถานะมีปัญหา'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  UPDATE public.transport_jobs SET status = COALESCE(j.problem_prev_status, 'ACCEPTED'), problem_prev_status = NULL,
    updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = j.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'PROBLEM', COALESCE(j.problem_prev_status,'ACCEPTED'), 'แก้ไขปัญหาแล้ว กลับสู่สถานะ ' || public.tnj_status_th(COALESCE(j.problem_prev_status,'ACCEPTED')), p_note, NULL, NULL, NULL);
  PERFORM public.tnj_broadcast('tnj:office', 'status', jsonb_build_object('job_id', j.id, 'status', j.problem_prev_status));
  IF j.driver_id IS NOT NULL THEN PERFORM public.tnj_broadcast('tnj:driver:' || j.driver_id::text, 'job', jsonb_build_object('job_id', j.id, 'event', 'status')); END IF;
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

-- ---------- job read ----------
CREATE OR REPLACE FUNCTION public.tnj_job_get(p_token text, p_job_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; r record; stale int;
BEGIN
  c := public.tnj_auth(p_token);
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  stale := public.tnj_setting('gps_stale_min','5')::int;
  SELECT * INTO r FROM public.v_transport_job_report WHERE job_id = j.id;
  RETURN to_jsonb(j) - 'problem_prev_status' || jsonb_build_object(
    'status_th', public.tnj_status_th(j.status),
    'status_order', public.tnj_status_order(j.status),
    'is_active', public.tnj_is_active_status(j.status),
    'gps_stale', (j.last_gps_at IS NULL OR j.last_gps_at < now() - make_interval(mins => stale)),
    'gps_age_min', CASE WHEN j.last_gps_at IS NULL THEN NULL ELSE floor(extract(epoch FROM (now() - j.last_gps_at))/60)::int END,
    'pickup_loc', (SELECT to_jsonb(l) FROM public.transport_locations l WHERE l.id = j.pickup_location_id),
    'factory_loc', (SELECT to_jsonb(l) FROM public.transport_locations l WHERE l.id = j.factory_location_id),
    'return_loc', (SELECT to_jsonb(l) FROM public.transport_locations l WHERE l.id = j.return_location_id),
    'mileage', (SELECT to_jsonb(m) FROM public.transport_job_mileage m WHERE m.job_id = j.id),
    'mileage_status', r.mileage_status, 'fuel_liters', r.fuel_liters, 'fuel_amount', r.fuel_amount, 'km_per_liter', r.km_per_liter,
    'incomplete_flag', r.incomplete_flag,
    'fuel', COALESCE((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.fuel_date) FROM public.transport_fuel_logs f WHERE f.job_id = j.id AND f.is_deleted = false), '[]'::jsonb),
    'timeline', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'seq', t.seq, 'event_type', t.event_type, 'status', t.status, 'title', t.title,
        'event_at', t.event_at, 'actor_name', t.actor_name, 'actor_role', t.actor_role, 'latitude', t.latitude, 'longitude', t.longitude,
        'note', t.note, 'problem_type', t.problem_type, 'problem_detail', t.problem_detail,
        'files', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'file_name', f.file_name, 'file_type', f.file_type, 'mime_type', f.mime_type))
                  FROM public.transport_job_files f WHERE f.timeline_id = t.id AND f.is_deleted = false), '[]'::jsonb)) ORDER BY t.seq)
      FROM public.transport_job_timeline t WHERE t.job_id = j.id AND t.is_deleted = false), '[]'::jsonb),
    'files', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'file_name', f.file_name, 'file_type', f.file_type, 'mime_type', f.mime_type,
        'size_bytes', f.size_bytes, 'uploaded_by', f.uploaded_by, 'uploaded_by_name', f.uploaded_by_name, 'uploaded_at', f.uploaded_at, 'timeline_id', f.timeline_id) ORDER BY f.uploaded_at DESC)
      FROM public.transport_job_files f WHERE f.job_id = j.id AND f.is_deleted = false), '[]'::jsonb),
    'driver_phone', (SELECT phone FROM public.transport_drivers d WHERE d.id = j.driver_id)
  );
END $$;

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
      AND (NULLIF(p->>'factory','') IS NULL OR j.factory_location_text ILIKE '%' || (p->>'factory') || '%')
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
      AND (NULLIF(p->>'factory','') IS NULL OR j.factory_location_text ILIKE '%' || (p->>'factory') || '%')
      AND (COALESCE((p->>'active_only')::boolean,false) = false OR public.tnj_is_active_status(j.status))
      AND (v_q IS NULL OR j.job_no ILIKE '%'||v_q||'%' OR j.bl_no ILIKE '%'||v_q||'%' OR j.customer_name ILIKE '%'||v_q||'%'
           OR COALESCE(j.container_no,'') ILIKE '%'||v_q||'%' OR COALESCE(j.driver_name,'') ILIKE '%'||v_q||'%' OR COALESCE(j.license_plate,'') ILIKE '%'||v_q||'%')
    ORDER BY j.job_date DESC, j.job_no DESC
    LIMIT v_size OFFSET (v_page-1)*v_size
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', b.id, 'job_no', b.job_no, 'job_date', b.job_date, 'customer_name', b.customer_name, 'bl_no', b.bl_no,
      'container_no', b.container_no, 'container_size', b.container_size, 'vehicle_name', b.vehicle_name, 'license_plate', b.license_plate,
      'driver_id', b.driver_id, 'driver_name', b.driver_name, 'pickup_location_text', b.pickup_location_text, 'factory_location_text', b.factory_location_text,
      'return_location_text', b.return_location_text, 'pickup_date', b.pickup_date, 'pickup_time', b.pickup_time, 'factory_date', b.factory_date, 'factory_time', b.factory_time,
      'return_date', b.return_date, 'return_time', b.return_time,
      'status', b.status, 'status_th', public.tnj_status_th(b.status), 'status_order', public.tnj_status_order(b.status), 'problem_flag', b.problem_flag,
      'last_gps_at', b.last_gps_at, 'last_lat', b.last_lat, 'last_lng', b.last_lng,
      'gps_stale', (b.last_gps_at IS NULL OR b.last_gps_at < now() - make_interval(mins => stale)),
      'gps_age_min', CASE WHEN b.last_gps_at IS NULL THEN NULL ELSE floor(extract(epoch FROM (now() - b.last_gps_at))/60)::int END)), '[]'::jsonb)
  INTO v_rows FROM base b;
  RETURN jsonb_build_object('rows', v_rows, 'total', v_total, 'page', v_page, 'page_size', v_size, 'server_time', now());
END $$;

CREATE OR REPLACE FUNCTION public.tnj_driver_jobs(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_driver uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' <> 'DRIVER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  v_driver := (c->>'driver_id')::uuid;
  RETURN jsonb_build_object(
    'active', (SELECT public.tnj_job_get(p_token, j.id) FROM public.transport_jobs j WHERE j.driver_id = v_driver AND public.tnj_is_active_status(j.status) ORDER BY j.accepted_at DESC NULLS LAST LIMIT 1),
    'assigned', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', j.id, 'job_no', j.job_no, 'job_date', j.job_date, 'customer_name', j.customer_name, 'bl_no', j.bl_no,
        'container_no', j.container_no, 'container_size', j.container_size, 'pickup_location_text', j.pickup_location_text, 'factory_location_text', j.factory_location_text,
        'return_location_text', j.return_location_text, 'pickup_date', j.pickup_date, 'pickup_time', j.pickup_time, 'factory_date', j.factory_date, 'factory_time', j.factory_time,
        'return_date', j.return_date, 'return_time', j.return_time, 'pickup_note', j.pickup_note, 'job_note', j.job_note, 'license_plate', j.license_plate,
        'status', j.status, 'status_th', public.tnj_status_th(j.status)) ORDER BY j.pickup_date, j.pickup_time)
      FROM public.transport_jobs j WHERE j.driver_id = v_driver AND j.status = 'ASSIGNED'), '[]'::jsonb),
    'recent', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', j.id, 'job_no', j.job_no, 'job_date', j.job_date, 'customer_name', j.customer_name, 'status', j.status, 'status_th', public.tnj_status_th(j.status)) ORDER BY j.completed_at DESC)
      FROM (SELECT * FROM public.transport_jobs x WHERE x.driver_id = v_driver AND x.status IN ('COMPLETED','CANCELLED') ORDER BY x.updated_at DESC LIMIT 10) j), '[]'::jsonb),
    'gps_interval_sec', public.tnj_setting('gps_interval_sec','30')::int, 'server_time', now());
END $$;

CREATE OR REPLACE FUNCTION public.tnj_dashboard_counts(p_token text, p_date date DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; d date; r jsonb;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  d := COALESCE(p_date, (now() AT TIME ZONE 'Asia/Bangkok')::date);
  SELECT jsonb_build_object(
    'date', d,
    'total', count(*) FILTER (WHERE status <> 'CANCELLED'),
    'waiting', count(*) FILTER (WHERE status IN ('NEW','ASSIGNED')),
    'going_pickup', count(*) FILTER (WHERE status IN ('ACCEPTED','GOING_TO_PICKUP','ARRIVED_PICKUP')),
    'picked', count(*) FILTER (WHERE status = 'CONTAINER_PICKED_UP'),
    'going_factory', count(*) FILTER (WHERE status = 'GOING_TO_FACTORY'),
    'arrived_factory', count(*) FILTER (WHERE status IN ('ARRIVED_FACTORY','LEAVING_FACTORY')),
    'returning', count(*) FILTER (WHERE status IN ('GOING_TO_RETURN','ARRIVED_RETURN')),
    'returned', count(*) FILTER (WHERE status = 'CONTAINER_RETURNED'),
    'completed', count(*) FILTER (WHERE status = 'COMPLETED'),
    'problem', count(*) FILTER (WHERE status = 'PROBLEM'),
    'cancelled', count(*) FILTER (WHERE status = 'CANCELLED'),
    'problem_open', (SELECT count(*) FROM public.transport_jobs WHERE status = 'PROBLEM'),
    'server_time', now())
  INTO r FROM public.transport_jobs WHERE job_date = d;
  RETURN r;
END $$;

-- ---------- GPS ----------
CREATE OR REPLACE FUNCTION public.tnj_gps_insert(p_token text, p_job_id uuid, p_points jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; n int := 0; pt jsonb; last_pt jsonb; v_driver uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' <> 'DRIVER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  v_driver := (c->>'driver_id')::uuid;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL OR j.driver_id IS DISTINCT FROM v_driver THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF NOT public.tnj_is_active_status(j.status) THEN RETURN jsonb_build_object('ok', false, 'reason', 'JOB_NOT_ACTIVE', 'inserted', 0); END IF;
  IF jsonb_typeof(p_points) <> 'array' THEN RAISE EXCEPTION 'TNJ_VALIDATION:points'; END IF;
  FOR pt IN SELECT * FROM jsonb_array_elements(p_points) LOOP
    IF (pt->>'lat') IS NULL OR (pt->>'lng') IS NULL THEN CONTINUE; END IF;
    INSERT INTO public.transport_gps_logs(job_id, driver_id, vehicle_id, latitude, longitude, accuracy, speed, heading, recorded_at, created_by)
    VALUES (j.id, v_driver, j.vehicle_id, (pt->>'lat')::double precision, (pt->>'lng')::double precision, (pt->>'acc')::double precision,
      (pt->>'speed')::double precision, (pt->>'heading')::double precision, COALESCE((pt->>'t')::timestamptz, now()), (c->>'user_id')::uuid);
    n := n + 1;
    IF last_pt IS NULL OR COALESCE((pt->>'t')::timestamptz, now()) >= COALESCE((last_pt->>'t')::timestamptz, now()) THEN last_pt := pt; END IF;
  END LOOP;
  IF last_pt IS NOT NULL THEN
    UPDATE public.transport_jobs SET last_gps_at = COALESCE((last_pt->>'t')::timestamptz, now()), last_lat = (last_pt->>'lat')::double precision,
      last_lng = (last_pt->>'lng')::double precision, last_speed = (last_pt->>'speed')::double precision WHERE id = j.id
      AND (last_gps_at IS NULL OR last_gps_at <= COALESCE((last_pt->>'t')::timestamptz, now()));
    PERFORM public.tnj_broadcast('tnj:gps', 'gps', jsonb_build_object('job_id', j.id));
  END IF;
  RETURN jsonb_build_object('ok', true, 'inserted', n, 'server_time', now());
END $$;

CREATE OR REPLACE FUNCTION public.tnj_gps_route(p_token text, p_job_id uuid, p_limit int DEFAULT 5000) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs;
BEGIN
  c := public.tnj_auth(p_token);
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  RETURN jsonb_build_object('job_id', j.id, 'points', COALESCE((SELECT jsonb_agg(jsonb_build_object('lat', g.latitude, 'lng', g.longitude, 'acc', g.accuracy, 'speed', g.speed, 't', g.recorded_at) ORDER BY g.recorded_at)
    FROM (SELECT * FROM public.transport_gps_logs WHERE job_id = j.id ORDER BY recorded_at DESC LIMIT LEAST(p_limit, 20000)) g), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_live_vehicles(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; stale int;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  stale := public.tnj_setting('gps_stale_min','5')::int;
  RETURN jsonb_build_object('stale_min', stale, 'server_time', now(), 'vehicles', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'job_id', j.id, 'job_no', j.job_no, 'customer_name', j.customer_name, 'container_no', j.container_no, 'license_plate', j.license_plate,
      'vehicle_name', j.vehicle_name, 'driver_name', j.driver_name, 'driver_phone', d.phone, 'status', j.status, 'status_th', public.tnj_status_th(j.status),
      'lat', j.last_lat, 'lng', j.last_lng, 'speed', j.last_speed, 'last_gps_at', j.last_gps_at,
      'gps_stale', (j.last_gps_at IS NULL OR j.last_gps_at < now() - make_interval(mins => stale)),
      'gps_age_min', CASE WHEN j.last_gps_at IS NULL THEN NULL ELSE floor(extract(epoch FROM (now() - j.last_gps_at))/60)::int END,
      'map_group', CASE WHEN j.status = 'PROBLEM' THEN 'problem'
                        WHEN j.status IN ('ACCEPTED','GOING_TO_PICKUP','ARRIVED_PICKUP') THEN 'pickup'
                        WHEN j.status IN ('CONTAINER_PICKED_UP','GOING_TO_FACTORY','ARRIVED_FACTORY','LEAVING_FACTORY') THEN 'factory'
                        ELSE 'return' END) ORDER BY j.job_no)
    FROM public.transport_jobs j LEFT JOIN public.transport_drivers d ON d.id = j.driver_id
    WHERE public.tnj_is_active_status(j.status)), '[]'::jsonb));
END $$;

-- ---------- timeline edit (office, audited) ----------
CREATE OR REPLACE FUNCTION public.tnj_timeline_note(p_token text, p_job_id uuid, p_status text, p_note text,
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; tl uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF NULLIF(p_status,'') IS NOT NULL AND p_status <> j.status THEN
    RETURN jsonb_build_object('ok', true, 'job', public.tnj_status_update(p_token, p_job_id, p_status, p_note, p_lat, p_lng, NULL));
  END IF;
  IF COALESCE(btrim(p_note),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุหมายเหตุ'; END IF;
  tl := public.tnj_timeline_add(c, j.id, 'NOTE', NULL, 'หมายเหตุ', p_note, p_lat, p_lng, NULL);
  RETURN jsonb_build_object('ok', true, 'timeline_id', tl, 'job', public.tnj_job_get(p_token, j.id));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_timeline_edit(p_token text, p_timeline_id uuid, p_note text, p_event_at timestamptz DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; t public.transport_job_timeline;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_admin(c);
  SELECT * INTO t FROM public.transport_job_timeline WHERE id = p_timeline_id AND is_deleted = false FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบรายการ'; END IF;
  PERFORM public.tnj_audit_write('transport_job_timeline', t.id::text, t.job_id, 'TIMELINE_EDIT', 'note', t.note, p_note, (c->>'user_id')::uuid, c->>'full_name');
  PERFORM public.tnj_audit_write('transport_job_timeline', t.id::text, t.job_id, 'TIMELINE_EDIT', 'event_at', t.event_at::text, COALESCE(p_event_at, t.event_at)::text, (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_job_timeline SET note = p_note, event_at = COALESCE(p_event_at, event_at), updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = t.id;
  PERFORM public.tnj_broadcast('tnj:job:' || t.job_id::text, 'timeline', jsonb_build_object('job_id', t.job_id));
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_timeline_delete(p_token text, p_timeline_id uuid, p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; t public.transport_job_timeline;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_admin(c);
  SELECT * INTO t FROM public.transport_job_timeline WHERE id = p_timeline_id AND is_deleted = false FOR UPDATE;
  IF t.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบรายการ'; END IF;
  IF t.event_type = 'STATUS' THEN RAISE EXCEPTION 'TNJ_VALIDATION:ลบรายการเปลี่ยนสถานะไม่ได้'; END IF;
  PERFORM public.tnj_audit_write('transport_job_timeline', t.id::text, t.job_id, 'DELETE', 'is_deleted', t.title, COALESCE(p_reason,''), (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_job_timeline SET is_deleted = true, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = t.id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- ---------- mileage ----------
CREATE OR REPLACE FUNCTION public.tnj_mileage_start(p_token text, p_job_id uuid, p_mileage numeric, p_image_id uuid DEFAULT NULL,
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; v public.transport_vehicles; m public.transport_job_mileage; warn boolean := false; wnote text; tl uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF j.status IN ('NEW','ASSIGNED','COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:บันทึกไมล์ได้หลังรับงานและก่อนปิดงาน'; END IF;
  IF p_mileage IS NULL OR p_mileage < 0 THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุเลขไมล์'; END IF;
  SELECT * INTO m FROM public.transport_job_mileage WHERE job_id = j.id;
  IF m.start_mileage IS NOT NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:บันทึกไมล์ก่อนไปแล้ว'; END IF;
  IF j.vehicle_id IS NOT NULL THEN
    SELECT * INTO v FROM public.transport_vehicles WHERE id = j.vehicle_id;
    IF v.last_mileage IS NOT NULL AND p_mileage < v.last_mileage THEN
      warn := true; wnote := '⚠ เลขไมล์ต่ำกว่าข้อมูลล่าสุดของรถคันนี้ (' || to_char(v.last_mileage,'FM999,999,999') || ')';
    END IF;
  END IF;
  IF m.id IS NULL THEN
    INSERT INTO public.transport_job_mileage(job_id, vehicle_id, driver_id, start_mileage, start_mileage_image, start_latitude, start_longitude, start_at, status, warning_flag, warning_note, created_by, updated_by)
    VALUES (j.id, j.vehicle_id, j.driver_id, p_mileage, p_image_id, p_lat, p_lng, now(), 'RUNNING', warn, wnote, (c->>'user_id')::uuid, (c->>'user_id')::uuid);
  ELSE
    UPDATE public.transport_job_mileage SET vehicle_id = j.vehicle_id, driver_id = j.driver_id, start_mileage = p_mileage, start_mileage_image = p_image_id,
      start_latitude = p_lat, start_longitude = p_lng, start_at = now(), status = 'RUNNING', warning_flag = warn, warning_note = wnote, updated_at = now(), updated_by = (c->>'user_id')::uuid
    WHERE id = m.id;
  END IF;
  tl := public.tnj_timeline_add(c, j.id, 'MILEAGE', NULL, 'บันทึกไมล์ก่อน ' || to_char(p_mileage,'FM999,999,999') || ' กม.', wnote, p_lat, p_lng, NULL);
  IF p_image_id IS NOT NULL THEN UPDATE public.transport_job_files SET timeline_id = tl WHERE id = p_image_id AND job_id = j.id; END IF;
  RETURN jsonb_build_object('ok', true, 'warning', warn, 'warning_note', wnote, 'job', public.tnj_job_get(p_token, j.id));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_mileage_end(p_token text, p_job_id uuid, p_mileage numeric, p_image_id uuid DEFAULT NULL,
  p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; m public.transport_job_mileage; tl uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id FOR UPDATE;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF c->>'role' = 'DRIVER' AND j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิดแล้ว ติดต่อเจ้าหน้าที่เพื่อแก้ไข'; END IF;
  IF j.status = 'CANCELLED' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานถูกยกเลิก'; END IF;
  SELECT * INTO m FROM public.transport_job_mileage WHERE job_id = j.id FOR UPDATE;
  IF m.start_mileage IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาบันทึกไมล์ก่อนเริ่มงานก่อน'; END IF;
  IF m.end_mileage IS NOT NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:บันทึกไมล์หลังไปแล้ว'; END IF;
  IF p_mileage IS NULL OR p_mileage < m.start_mileage THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไมล์หลังต้องไม่ต่ำกว่าไมล์ก่อน (%)', to_char(m.start_mileage,'FM999,999,999'); END IF;
  UPDATE public.transport_job_mileage SET end_mileage = p_mileage, end_mileage_image = p_image_id, end_latitude = p_lat, end_longitude = p_lng, end_at = now(),
    total_distance = p_mileage - m.start_mileage, status = CASE WHEN j.status = 'COMPLETED' THEN 'CLOSED' ELSE 'DONE' END, updated_at = now(), updated_by = (c->>'user_id')::uuid
  WHERE id = m.id;
  IF j.vehicle_id IS NOT NULL THEN
    UPDATE public.transport_vehicles SET last_mileage = p_mileage, last_mileage_at = now(), updated_at = now()
     WHERE id = j.vehicle_id AND (last_mileage IS NULL OR last_mileage <= p_mileage);
  END IF;
  tl := public.tnj_timeline_add(c, j.id, 'MILEAGE', NULL, 'บันทึกไมล์หลัง ' || to_char(p_mileage,'FM999,999,999') || ' กม. (ระยะทาง ' || to_char(p_mileage - m.start_mileage,'FM999,999,999.#') || ' กม.)', NULL, p_lat, p_lng, NULL);
  IF p_image_id IS NOT NULL THEN UPDATE public.transport_job_files SET timeline_id = tl WHERE id = p_image_id AND job_id = j.id; END IF;
  RETURN jsonb_build_object('ok', true, 'distance', p_mileage - m.start_mileage, 'job', public.tnj_job_get(p_token, j.id));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_mileage_edit(p_token text, p_job_id uuid, p_start numeric, p_end numeric, p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; m public.transport_job_mileage;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_admin(c);
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  SELECT * INTO m FROM public.transport_job_mileage WHERE job_id = j.id FOR UPDATE;
  IF m.id IS NULL THEN
    INSERT INTO public.transport_job_mileage(job_id, vehicle_id, driver_id, created_by) VALUES (j.id, j.vehicle_id, j.driver_id, (c->>'user_id')::uuid) RETURNING * INTO m;
  END IF;
  IF p_start IS NOT NULL AND p_end IS NOT NULL AND p_end < p_start THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไมล์หลังต้องไม่ต่ำกว่าไมล์ก่อน'; END IF;
  IF COALESCE(btrim(p_reason),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุเหตุผลการแก้ไข'; END IF;
  PERFORM public.tnj_audit_write('transport_job_mileage', m.id::text, j.id, 'MILEAGE_EDIT', 'start_mileage', m.start_mileage::text, p_start::text, (c->>'user_id')::uuid, c->>'full_name');
  PERFORM public.tnj_audit_write('transport_job_mileage', m.id::text, j.id, 'MILEAGE_EDIT', 'end_mileage', m.end_mileage::text, p_end::text, (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_job_mileage SET start_mileage = p_start, end_mileage = p_end,
    start_at = COALESCE(start_at, CASE WHEN p_start IS NOT NULL THEN now() END), end_at = COALESCE(end_at, CASE WHEN p_end IS NOT NULL THEN now() END),
    total_distance = CASE WHEN p_start IS NOT NULL AND p_end IS NOT NULL THEN p_end - p_start ELSE NULL END,
    status = CASE WHEN p_end IS NOT NULL THEN (CASE WHEN j.status = 'COMPLETED' THEN 'CLOSED' ELSE 'DONE' END) WHEN p_start IS NOT NULL THEN 'RUNNING' ELSE 'OPEN' END,
    updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = m.id;
  PERFORM public.tnj_timeline_add(c, j.id, 'MILEAGE', NULL, 'แก้ไขข้อมูลไมล์ (ก่อน ' || COALESCE(to_char(p_start,'FM999,999,999'),'-') || ' / หลัง ' || COALESCE(to_char(p_end,'FM999,999,999'),'-') || ')', p_reason, NULL, NULL, NULL);
  RETURN public.tnj_job_get(p_token, j.id);
END $$;

-- ---------- fuel ----------
CREATE OR REPLACE FUNCTION public.tnj_fuel_add(p_token text, p_job_id uuid, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; m public.transport_job_mileage; f public.transport_fuel_logs; v_l numeric; v_p numeric; v_m numeric; wn text; tl uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = p_job_id;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF c->>'role' = 'DRIVER' AND j.status IN ('NEW','ASSIGNED','COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_VALIDATION:บันทึกน้ำมันได้เฉพาะงานที่กำลังทำอยู่'; END IF;
  v_l := NULLIF(p->>'liters','')::numeric; v_p := NULLIF(p->>'price_per_liter','')::numeric; v_m := NULLIF(p->>'mileage','')::numeric;
  IF v_l IS NULL OR v_l <= 0 THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุจำนวนลิตร'; END IF;
  IF v_p IS NULL OR v_p < 0 THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุราคาต่อลิตร'; END IF;
  SELECT * INTO m FROM public.transport_job_mileage WHERE job_id = j.id;
  IF v_m IS NOT NULL AND m.start_mileage IS NOT NULL AND (v_m < m.start_mileage OR (m.end_mileage IS NOT NULL AND v_m > m.end_mileage)) THEN
    wn := '⚠ เลขไมล์ตอนเติมอยู่นอกช่วงไมล์ก่อน-หลังของงานนี้';
  END IF;
  INSERT INTO public.transport_fuel_logs(job_id, vehicle_id, driver_id, fuel_date, fuel_station, fuel_type, mileage, liters, price_per_liter, total_amount,
    receipt_no, receipt_file, latitude, longitude, note, created_by, updated_by)
  VALUES (j.id, j.vehicle_id, j.driver_id, COALESCE(NULLIF(p->>'fuel_date','')::timestamptz, now()), NULLIF(p->>'fuel_station',''), NULLIF(p->>'fuel_type',''), v_m, v_l, v_p,
    round(v_l * v_p, 2), NULLIF(p->>'receipt_no',''), NULLIF(p->>'receipt_file','')::uuid, NULLIF(p->>'lat','')::double precision, NULLIF(p->>'lng','')::double precision,
    NULLIF(p->>'note',''), (c->>'user_id')::uuid, (c->>'user_id')::uuid)
  RETURNING * INTO f;
  tl := public.tnj_timeline_add(c, j.id, 'FUEL', NULL, 'เติมน้ำมัน ' || to_char(v_l,'FM999,999.##') || ' ลิตร ' || to_char(f.total_amount,'FM999,999,999.00') || ' บาท' ||
    CASE WHEN f.fuel_station IS NOT NULL THEN ' (' || f.fuel_station || ')' ELSE '' END, COALESCE(wn || E'\n', '') || COALESCE(f.note,''), f.latitude, f.longitude, NULL);
  IF f.receipt_file IS NOT NULL THEN UPDATE public.transport_job_files SET timeline_id = tl WHERE id = f.receipt_file AND job_id = j.id; END IF;
  RETURN jsonb_build_object('ok', true, 'fuel_id', f.id, 'warning_note', wn, 'job', public.tnj_job_get(p_token, j.id));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_fuel_edit(p_token text, p_fuel_id uuid, p jsonb, p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; f public.transport_fuel_logs; j public.transport_jobs; v_l numeric; v_p numeric; v_m numeric; uid uuid; un text;
BEGIN
  c := public.tnj_auth(p_token); uid := (c->>'user_id')::uuid; un := c->>'full_name';
  SELECT * INTO f FROM public.transport_fuel_logs WHERE id = p_fuel_id AND is_deleted = false FOR UPDATE;
  IF f.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบรายการ'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = f.job_id;
  IF c->>'role' = 'DRIVER' THEN
    IF j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid OR j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  ELSIF c->>'role' NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  v_l := COALESCE(NULLIF(p->>'liters','')::numeric, f.liters); v_p := COALESCE(NULLIF(p->>'price_per_liter','')::numeric, f.price_per_liter);
  v_m := CASE WHEN p ? 'mileage' THEN NULLIF(p->>'mileage','')::numeric ELSE f.mileage END;
  IF v_l <= 0 THEN RAISE EXCEPTION 'TNJ_VALIDATION:จำนวนลิตรไม่ถูกต้อง'; END IF;
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'liters', f.liters::text, v_l::text, uid, un);
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'price_per_liter', f.price_per_liter::text, v_p::text, uid, un);
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'mileage', f.mileage::text, v_m::text, uid, un);
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'fuel_station', f.fuel_station, COALESCE(p->>'fuel_station', f.fuel_station), uid, un);
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'receipt_no', f.receipt_no, COALESCE(p->>'receipt_no', f.receipt_no), uid, un);
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'FUEL_EDIT', 'note', f.note, COALESCE(p->>'note', f.note), uid, un);
  UPDATE public.transport_fuel_logs SET liters = v_l, price_per_liter = v_p, total_amount = round(v_l * v_p, 2), mileage = v_m,
    fuel_station = COALESCE(p->>'fuel_station', fuel_station), fuel_type = COALESCE(p->>'fuel_type', fuel_type), receipt_no = COALESCE(p->>'receipt_no', receipt_no),
    note = COALESCE(p->>'note', note), fuel_date = COALESCE(NULLIF(p->>'fuel_date','')::timestamptz, fuel_date), updated_at = now(), updated_by = uid WHERE id = f.id;
  PERFORM public.tnj_timeline_add(c, f.job_id, 'FUEL', NULL, 'แก้ไขรายการน้ำมัน (' || to_char(v_l,'FM999,999.##') || ' ลิตร ' || to_char(round(v_l*v_p,2),'FM999,999,999.00') || ' บาท)', p_reason, NULL, NULL, NULL);
  RETURN public.tnj_job_get(p_token, f.job_id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_fuel_delete(p_token text, p_fuel_id uuid, p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; f public.transport_fuel_logs; j public.transport_jobs;
BEGIN
  c := public.tnj_auth(p_token);
  SELECT * INTO f FROM public.transport_fuel_logs WHERE id = p_fuel_id AND is_deleted = false FOR UPDATE;
  IF f.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบรายการ'; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = f.job_id;
  IF c->>'role' = 'DRIVER' THEN
    IF j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid OR j.status IN ('COMPLETED','CANCELLED') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  ELSIF c->>'role' NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  PERFORM public.tnj_audit_write('transport_fuel_logs', f.id::text, f.job_id, 'DELETE', 'is_deleted', f.liters::text || ' L / ' || f.total_amount::text, COALESCE(p_reason,''), (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_fuel_logs SET is_deleted = true, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = f.id;
  PERFORM public.tnj_timeline_add(c, f.job_id, 'FUEL', NULL, 'ลบรายการน้ำมัน ' || to_char(f.liters,'FM999,999.##') || ' ลิตร', p_reason, NULL, NULL, NULL);
  RETURN public.tnj_job_get(p_token, f.job_id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_mileage_table(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_rows jsonb; v_total int; v_page int; v_size int; v_driver uuid; d_from date; d_to date; v_q text;
BEGIN
  c := public.tnj_auth(p_token);
  v_page := GREATEST(COALESCE((p->>'page')::int,1),1); v_size := LEAST(GREATEST(COALESCE((p->>'page_size')::int,50),1),500);
  v_driver := CASE WHEN c->>'role' = 'DRIVER' THEN (c->>'driver_id')::uuid ELSE NULLIF(p->>'driver_id','')::uuid END;
  d_from := NULLIF(p->>'date_from','')::date; d_to := NULLIF(p->>'date_to','')::date; v_q := NULLIF(btrim(p->>'q'),'');
  SELECT count(*) INTO v_total FROM public.v_transport_job_report r
   WHERE (v_driver IS NULL OR r.driver_id = v_driver) AND (d_from IS NULL OR r.job_date >= d_from) AND (d_to IS NULL OR r.job_date <= d_to)
     AND r.status <> 'CANCELLED' AND (NULLIF(p->>'vehicle_id','') IS NULL OR r.vehicle_id = (p->>'vehicle_id')::uuid)
     AND (NULLIF(p->>'mileage_status','') IS NULL OR r.mileage_status = (p->>'mileage_status'))
     AND (v_q IS NULL OR r.job_no ILIKE '%'||v_q||'%' OR r.bl_no ILIKE '%'||v_q||'%' OR COALESCE(r.license_plate,'') ILIKE '%'||v_q||'%' OR COALESCE(r.driver_name,'') ILIKE '%'||v_q||'%');
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.job_date DESC, r.job_no DESC), '[]'::jsonb) INTO v_rows FROM (
    SELECT * FROM public.v_transport_job_report r
     WHERE (v_driver IS NULL OR r.driver_id = v_driver) AND (d_from IS NULL OR r.job_date >= d_from) AND (d_to IS NULL OR r.job_date <= d_to)
       AND r.status <> 'CANCELLED' AND (NULLIF(p->>'vehicle_id','') IS NULL OR r.vehicle_id = (p->>'vehicle_id')::uuid)
       AND (NULLIF(p->>'mileage_status','') IS NULL OR r.mileage_status = (p->>'mileage_status'))
       AND (v_q IS NULL OR r.job_no ILIKE '%'||v_q||'%' OR r.bl_no ILIKE '%'||v_q||'%' OR COALESCE(r.license_plate,'') ILIKE '%'||v_q||'%' OR COALESCE(r.driver_name,'') ILIKE '%'||v_q||'%')
     ORDER BY r.job_date DESC, r.job_no DESC LIMIT v_size OFFSET (v_page-1)*v_size) r;
  RETURN jsonb_build_object('rows', v_rows, 'total', v_total, 'page', v_page, 'page_size', v_size);
END $$;

-- ---------- files (metadata; bytes via Edge Function transportnj-files) ----------
CREATE OR REPLACE FUNCTION public.tnj_file_authorize(p_token text, p_action text, p_job_id uuid DEFAULT NULL, p_file_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; j public.transport_jobs; f public.transport_job_files; v_job uuid;
BEGIN
  c := public.tnj_auth(p_token);
  IF p_action = 'read' THEN
    SELECT * INTO f FROM public.transport_job_files WHERE id = p_file_id AND is_deleted = false;
    IF f.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบไฟล์'; END IF;
    v_job := f.job_id;
  ELSE v_job := p_job_id; END IF;
  SELECT * INTO j FROM public.transport_jobs WHERE id = v_job;
  IF j.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบงาน'; END IF;
  IF c->>'role' = 'DRIVER' AND j.driver_id IS DISTINCT FROM (c->>'driver_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF p_action = 'upload' THEN
    IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
    IF j.status = 'CANCELLED' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานถูกยกเลิก'; END IF;
    IF c->>'role' = 'DRIVER' AND j.status = 'COMPLETED' THEN RAISE EXCEPTION 'TNJ_VALIDATION:งานปิดแล้ว'; END IF;
  ELSIF p_action = 'delete' THEN
    SELECT * INTO f FROM public.transport_job_files WHERE id = p_file_id AND job_id = j.id AND is_deleted = false;
    IF f.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบไฟล์'; END IF;
    IF c->>'role' = 'VIEWER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
    IF c->>'role' = 'DRIVER' AND (f.uploaded_by IS DISTINCT FROM (c->>'user_id')::uuid OR j.status = 'COMPLETED') THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
    IF c->>'role' = 'TRANSPORT' AND j.status = 'COMPLETED' AND f.uploaded_by IS DISTINCT FROM (c->>'user_id')::uuid THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  ELSIF p_action <> 'read' THEN RAISE EXCEPTION 'TNJ_VALIDATION:action';
  END IF;
  RETURN jsonb_build_object('ok', true, 'user_id', c->>'user_id', 'full_name', c->>'full_name', 'role', c->>'role', 'job_id', j.id, 'job_no', j.job_no,
    'file', CASE WHEN f.id IS NULL THEN NULL ELSE jsonb_build_object('id', f.id, 'storage_path', f.storage_path, 'file_name', f.file_name, 'mime_type', f.mime_type) END);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_file_register(p_token text, p_job_id uuid, p_file_type text, p_file_name text, p_storage_path text,
  p_mime text, p_size bigint, p_timeline_id uuid DEFAULT NULL, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; a jsonb; v_id uuid; tl uuid;
BEGIN
  a := public.tnj_file_authorize(p_token, 'upload', p_job_id, NULL);
  c := public.tnj_auth(p_token);
  IF p_file_type NOT IN ('B/L','Booking','ใบรับตู้','EIR รับตู้','เอกสารโรงงาน','POD','EIR คืนตู้','ใบเสร็จ','รูปตู้','รูปซีล','รูปเลขไมล์','รูปปัญหา','อื่น ๆ') THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:ประเภทไฟล์ไม่ถูกต้อง';
  END IF;
  IF p_timeline_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.transport_job_timeline WHERE id = p_timeline_id AND job_id = p_job_id) THEN
    RAISE EXCEPTION 'TNJ_VALIDATION:timeline';
  END IF;
  tl := p_timeline_id;
  IF tl IS NULL THEN
    tl := public.tnj_timeline_add(c, p_job_id, 'FILE', NULL, 'แนบไฟล์ ' || p_file_type || ': ' || p_file_name, p_note, NULL, NULL, NULL);
  END IF;
  INSERT INTO public.transport_job_files(job_id, timeline_id, file_type, file_name, storage_path, mime_type, size_bytes, uploaded_by, uploaded_by_name, created_by)
  VALUES (p_job_id, tl, p_file_type, p_file_name, p_storage_path, p_mime, p_size, (c->>'user_id')::uuid, c->>'full_name', (c->>'user_id')::uuid)
  RETURNING id INTO v_id;
  PERFORM public.tnj_broadcast('tnj:job:' || p_job_id::text, 'file', jsonb_build_object('job_id', p_job_id));
  RETURN jsonb_build_object('ok', true, 'file_id', v_id, 'timeline_id', tl);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_file_delete(p_token text, p_file_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; f public.transport_job_files; a jsonb;
BEGIN
  SELECT * INTO f FROM public.transport_job_files WHERE id = p_file_id AND is_deleted = false;
  IF f.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบไฟล์'; END IF;
  a := public.tnj_file_authorize(p_token, 'delete', f.job_id, f.id);
  c := public.tnj_auth(p_token);
  PERFORM public.tnj_audit_write('transport_job_files', f.id::text, f.job_id, 'DELETE', 'file', f.file_type || ': ' || f.file_name, NULL, (c->>'user_id')::uuid, c->>'full_name');
  UPDATE public.transport_job_files SET is_deleted = true, updated_at = now(), updated_by = (c->>'user_id')::uuid WHERE id = f.id;
  PERFORM public.tnj_timeline_add(c, f.job_id, 'FILE', NULL, 'ลบไฟล์ ' || f.file_type || ': ' || f.file_name, NULL, NULL, NULL, NULL);
  RETURN jsonb_build_object('ok', true, 'storage_path', f.storage_path);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_file_list(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_driver uuid; v_q text;
BEGIN
  c := public.tnj_auth(p_token);
  v_driver := CASE WHEN c->>'role' = 'DRIVER' THEN (c->>'driver_id')::uuid ELSE NULL END;
  v_q := NULLIF(btrim(p->>'q'),'');
  RETURN jsonb_build_object('rows', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'job_id', f.job_id, 'job_no', j.job_no, 'bl_no', j.bl_no, 'customer_name', j.customer_name,
      'file_type', f.file_type, 'file_name', f.file_name, 'mime_type', f.mime_type, 'size_bytes', f.size_bytes, 'uploaded_by_name', f.uploaded_by_name, 'uploaded_at', f.uploaded_at) ORDER BY f.uploaded_at DESC)
    FROM (SELECT f.* FROM public.transport_job_files f JOIN public.transport_jobs j ON j.id = f.job_id
          WHERE f.is_deleted = false AND (v_driver IS NULL OR j.driver_id = v_driver)
            AND (NULLIF(p->>'job_id','') IS NULL OR f.job_id = (p->>'job_id')::uuid)
            AND (NULLIF(p->>'file_type','') IS NULL OR f.file_type = (p->>'file_type'))
            AND (NULLIF(p->>'date_from','') IS NULL OR j.job_date >= (p->>'date_from')::date) AND (NULLIF(p->>'date_to','') IS NULL OR j.job_date <= (p->>'date_to')::date)
            AND (v_q IS NULL OR j.job_no ILIKE '%'||v_q||'%' OR j.bl_no ILIKE '%'||v_q||'%' OR f.file_name ILIKE '%'||v_q||'%' OR j.customer_name ILIKE '%'||v_q||'%')
          ORDER BY f.uploaded_at DESC LIMIT LEAST(COALESCE((p->>'limit')::int, 300), 1000)) f
    JOIN public.transport_jobs j ON j.id = f.job_id), '[]'::jsonb));
END $$;

-- ---------- reports ----------
CREATE OR REPLACE FUNCTION public.tnj_report_rows(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_page int; v_size int; d_from date; d_to date; v_driver uuid; v_out jsonb;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'DRIVER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  v_page := COALESCE((p->>'page')::int, 0); v_size := LEAST(GREATEST(COALESCE((p->>'page_size')::int,50),1),500);
  d_from := NULLIF(p->>'date_from','')::date; d_to := NULLIF(p->>'date_to','')::date; v_driver := NULLIF(p->>'driver_id','')::uuid;
  WITH f AS (
    SELECT * FROM public.v_transport_job_report r
     WHERE (d_from IS NULL OR r.job_date >= d_from) AND (d_to IS NULL OR r.job_date <= d_to)
       AND (NULLIF(p->>'job_no','') IS NULL OR r.job_no ILIKE '%'||(p->>'job_no')||'%')
       AND (NULLIF(p->>'bl_no','') IS NULL OR r.bl_no ILIKE '%'||(p->>'bl_no')||'%')
       AND (NULLIF(p->>'customer','') IS NULL OR r.customer_name ILIKE '%'||(p->>'customer')||'%')
       AND (NULLIF(p->>'vehicle_id','') IS NULL OR r.vehicle_id = (p->>'vehicle_id')::uuid)
       AND (NULLIF(p->>'license_plate','') IS NULL OR COALESCE(r.license_plate,'') ILIKE '%'||(p->>'license_plate')||'%')
       AND (v_driver IS NULL OR r.driver_id = v_driver)
       AND (NULLIF(p->>'status','') IS NULL OR r.status = (p->>'status'))
       AND (COALESCE((p->>'include_cancelled')::boolean,false) OR r.status <> 'CANCELLED')
  )
  SELECT jsonb_build_object(
    'rows', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.job_date DESC, r.job_no DESC) FROM (
              SELECT * FROM f ORDER BY job_date DESC, job_no DESC
              LIMIT CASE WHEN v_page <= 0 THEN NULL ELSE v_size END OFFSET CASE WHEN v_page <= 0 THEN 0 ELSE (v_page-1)*v_size END) r), '[]'::jsonb),
    'total', (SELECT count(*) FROM f),
    'summary', (SELECT jsonb_build_object('jobs', count(*), 'vehicles', count(DISTINCT vehicle_id), 'drivers', count(DISTINCT driver_id),
       'distance', COALESCE(sum(total_distance),0), 'liters', COALESCE(sum(fuel_liters),0), 'amount', COALESCE(sum(fuel_amount),0),
       'kml', CASE WHEN COALESCE(sum(fuel_liters),0) > 0 AND COALESCE(sum(total_distance),0) > 0 THEN round(sum(total_distance)/sum(fuel_liters),2) ELSE NULL END,
       'incomplete', count(*) FILTER (WHERE incomplete_flag), 'completed', count(*) FILTER (WHERE status='COMPLETED'), 'problem', count(*) FILTER (WHERE status='PROBLEM')) FROM f),
    'page', v_page, 'page_size', v_size, 'server_time', now())
  INTO v_out;
  RETURN v_out;
END $$;

CREATE OR REPLACE FUNCTION public.tnj_report_vehicle(p_token text, p_vehicle_id uuid, p_from date DEFAULT NULL, p_to date DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v public.transport_vehicles;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'DRIVER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO v FROM public.transport_vehicles WHERE id = p_vehicle_id;
  IF v.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบรถ'; END IF;
  RETURN (SELECT jsonb_build_object('vehicle', to_jsonb(v), 'jobs', count(*), 'drivers', COALESCE(jsonb_agg(DISTINCT r.driver_name) FILTER (WHERE r.driver_name IS NOT NULL), '[]'::jsonb),
    'first_mileage', min(r.start_mileage), 'last_mileage', max(r.end_mileage), 'distance', COALESCE(sum(r.total_distance),0), 'liters', COALESCE(sum(r.fuel_liters),0), 'amount', COALESCE(sum(r.fuel_amount),0),
    'kml', CASE WHEN COALESCE(sum(r.fuel_liters),0) > 0 AND COALESCE(sum(r.total_distance),0) > 0 THEN round(sum(r.total_distance)/sum(r.fuel_liters),2) ELSE NULL END,
    'rows', COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.job_date DESC, r.job_no DESC), '[]'::jsonb))
   FROM public.v_transport_job_report r WHERE r.vehicle_id = v.id AND r.status <> 'CANCELLED' AND (p_from IS NULL OR r.job_date >= p_from) AND (p_to IS NULL OR r.job_date <= p_to));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_report_driver(p_token text, p_driver_id uuid, p_from date DEFAULT NULL, p_to date DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; d public.transport_drivers;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'DRIVER' AND (c->>'driver_id')::uuid IS DISTINCT FROM p_driver_id THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  SELECT * INTO d FROM public.transport_drivers WHERE id = p_driver_id;
  IF d.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบคนขับ'; END IF;
  RETURN (SELECT jsonb_build_object('driver', jsonb_build_object('id', d.id, 'full_name', d.full_name, 'driver_code', d.driver_code, 'phone', d.phone), 'jobs', count(*),
    'vehicles', COALESCE(jsonb_agg(DISTINCT r.license_plate) FILTER (WHERE r.license_plate IS NOT NULL), '[]'::jsonb),
    'distance', COALESCE(sum(r.total_distance),0), 'liters', COALESCE(sum(r.fuel_liters),0), 'amount', COALESCE(sum(r.fuel_amount),0),
    'kml', CASE WHEN COALESCE(sum(r.fuel_liters),0) > 0 AND COALESCE(sum(r.total_distance),0) > 0 THEN round(sum(r.total_distance)/sum(r.fuel_liters),2) ELSE NULL END,
    'completed', count(*) FILTER (WHERE r.status = 'COMPLETED'), 'problem', count(*) FILTER (WHERE r.status = 'PROBLEM'), 'incomplete', count(*) FILTER (WHERE r.incomplete_flag),
    'rows', COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.job_date DESC, r.job_no DESC), '[]'::jsonb))
   FROM public.v_transport_job_report r WHERE r.driver_id = d.id AND r.status <> 'CANCELLED' AND (p_from IS NULL OR r.job_date >= p_from) AND (p_to IS NULL OR r.job_date <= p_to));
END $$;

CREATE OR REPLACE FUNCTION public.tnj_audit_list(p_token text, p_job_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'DRIVER' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object('id', a.id, 'table_name', a.table_name, 'action', a.action, 'field', a.field, 'old_value', a.old_value, 'new_value', a.new_value,
    'user_name', a.user_name, 'changed_at', a.changed_at) ORDER BY a.changed_at DESC, a.id DESC) FROM public.transport_audit_logs a WHERE a.job_id = p_job_id), '[]'::jsonb);
END $$;

-- ---------- master data ----------
CREATE OR REPLACE FUNCTION public.tnj_master_list(p_token text, p_kind text, p_include_inactive boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' = 'DRIVER' AND p_kind <> 'locations' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  IF p_kind = 'customers' THEN
    RETURN COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM public.transport_customers x WHERE p_include_inactive OR x.is_active), '[]'::jsonb);
  ELSIF p_kind = 'drivers' THEN
    RETURN COALESCE((SELECT jsonb_agg((to_jsonb(x) || jsonb_build_object('username', u.username,
      'active_job', (SELECT jsonb_build_object('id', j.id, 'job_no', j.job_no, 'status', j.status, 'status_th', public.tnj_status_th(j.status)) FROM public.transport_jobs j WHERE j.driver_id = x.id AND public.tnj_is_active_status(j.status) LIMIT 1)))
      ORDER BY x.full_name) FROM public.transport_drivers x LEFT JOIN public.app_users u ON u.id = x.app_user_id WHERE p_include_inactive OR x.is_active), '[]'::jsonb);
  ELSIF p_kind = 'vehicles' THEN
    RETURN COALESCE((SELECT jsonb_agg((to_jsonb(x) || jsonb_build_object(
      'active_job', (SELECT jsonb_build_object('id', j.id, 'job_no', j.job_no, 'status', j.status, 'driver_name', j.driver_name) FROM public.transport_jobs j WHERE j.vehicle_id = x.id AND public.tnj_is_active_status(j.status) LIMIT 1)))
      ORDER BY x.license_plate) FROM public.transport_vehicles x WHERE p_include_inactive OR x.is_active), '[]'::jsonb);
  ELSIF p_kind = 'locations' THEN
    RETURN COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.location_type, x.name) FROM public.transport_locations x WHERE p_include_inactive OR x.is_active), '[]'::jsonb);
  END IF;
  RAISE EXCEPTION 'TNJ_VALIDATION:kind';
END $$;

CREATE OR REPLACE FUNCTION public.tnj_master_save(p_token text, p_kind text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; v_id uuid; uid uuid; v_user uuid; v_username text; v_pw text; d public.transport_drivers;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_office(c);
  uid := (c->>'user_id')::uuid; v_id := NULLIF(p->>'id','')::uuid;
  IF p_kind = 'customers' THEN
    IF COALESCE(btrim(p->>'name'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อลูกค้า'; END IF;
    IF v_id IS NULL THEN
      INSERT INTO public.transport_customers(code, name, contact, phone, address, is_active, created_by, updated_by)
      VALUES (NULLIF(p->>'code',''), btrim(p->>'name'), NULLIF(p->>'contact',''), NULLIF(p->>'phone',''), NULLIF(p->>'address',''), COALESCE((p->>'is_active')::boolean,true), uid, uid) RETURNING id INTO v_id;
    ELSE
      UPDATE public.transport_customers SET code = NULLIF(p->>'code',''), name = btrim(p->>'name'), contact = NULLIF(p->>'contact',''), phone = NULLIF(p->>'phone',''),
        address = NULLIF(p->>'address',''), is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now(), updated_by = uid WHERE id = v_id;
    END IF;
  ELSIF p_kind = 'vehicles' THEN
    IF COALESCE(btrim(p->>'license_plate'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุทะเบียนรถ'; END IF;
    IF v_id IS NULL THEN
      INSERT INTO public.transport_vehicles(vehicle_code, vehicle_name, license_plate, vehicle_type, last_mileage, is_active, created_by, updated_by)
      VALUES (NULLIF(p->>'vehicle_code',''), COALESCE(NULLIF(btrim(p->>'vehicle_name'),''), btrim(p->>'license_plate')), btrim(p->>'license_plate'), NULLIF(p->>'vehicle_type',''),
        NULLIF(p->>'last_mileage','')::numeric, COALESCE((p->>'is_active')::boolean,true), uid, uid) RETURNING id INTO v_id;
    ELSE
      PERFORM public.tnj_audit_write('transport_vehicles', v_id::text, NULL, 'UPDATE', 'last_mileage', (SELECT last_mileage::text FROM public.transport_vehicles WHERE id = v_id), p->>'last_mileage', uid, c->>'full_name');
      UPDATE public.transport_vehicles SET vehicle_code = NULLIF(p->>'vehicle_code',''), vehicle_name = COALESCE(NULLIF(btrim(p->>'vehicle_name'),''), btrim(p->>'license_plate')),
        license_plate = btrim(p->>'license_plate'), vehicle_type = NULLIF(p->>'vehicle_type',''),
        last_mileage = CASE WHEN p ? 'last_mileage' THEN NULLIF(p->>'last_mileage','')::numeric ELSE last_mileage END,
        is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now(), updated_by = uid WHERE id = v_id;
    END IF;
  ELSIF p_kind = 'locations' THEN
    IF COALESCE(btrim(p->>'name'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อสถานที่'; END IF;
    IF v_id IS NULL THEN
      INSERT INTO public.transport_locations(name, location_type, address, latitude, longitude, contact, phone, google_maps_url, is_active, created_by, updated_by)
      VALUES (btrim(p->>'name'), COALESCE(NULLIF(p->>'location_type',''),'OTHER'), NULLIF(p->>'address',''), NULLIF(p->>'latitude','')::double precision, NULLIF(p->>'longitude','')::double precision,
        NULLIF(p->>'contact',''), NULLIF(p->>'phone',''), NULLIF(p->>'google_maps_url',''), COALESCE((p->>'is_active')::boolean,true), uid, uid) RETURNING id INTO v_id;
    ELSE
      UPDATE public.transport_locations SET name = btrim(p->>'name'), location_type = COALESCE(NULLIF(p->>'location_type',''), location_type), address = NULLIF(p->>'address',''),
        latitude = NULLIF(p->>'latitude','')::double precision, longitude = NULLIF(p->>'longitude','')::double precision, contact = NULLIF(p->>'contact',''), phone = NULLIF(p->>'phone',''),
        google_maps_url = NULLIF(p->>'google_maps_url',''), is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now(), updated_by = uid WHERE id = v_id;
    END IF;
  ELSIF p_kind = 'drivers' THEN
    PERFORM public.tnj_require_admin(c);
    IF COALESCE(btrim(p->>'full_name'),'') = '' THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อคนขับ'; END IF;
    v_username := lower(btrim(COALESCE(p->>'username',''))); v_pw := NULLIF(p->>'password','');
    IF v_id IS NULL THEN
      IF v_username = '' OR v_pw IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อผู้ใช้และรหัสผ่านสำหรับคนขับ'; END IF;
      IF EXISTS (SELECT 1 FROM public.app_users WHERE lower(username) = v_username AND app_code = 'transport') THEN RAISE EXCEPTION 'TNJ_VALIDATION:ชื่อผู้ใช้นี้มีอยู่แล้ว'; END IF;
      INSERT INTO public.app_users(username, full_name, role, app_code, password_hash, is_active, status, approved, created_by)
      VALUES (v_username, btrim(p->>'full_name'), 'USER', 'transport', extensions.crypt(v_pw, extensions.gen_salt('bf')), true, 'active', true, uid) RETURNING id INTO v_user;
      INSERT INTO public.transport_user_roles(app_user_id, tnj_role, created_by, updated_by) VALUES (v_user, 'DRIVER', uid, uid);
      INSERT INTO public.transport_drivers(app_user_id, driver_code, full_name, phone, license_no, is_active, created_by, updated_by)
      VALUES (v_user, NULLIF(p->>'driver_code',''), btrim(p->>'full_name'), NULLIF(p->>'phone',''), NULLIF(p->>'license_no',''), COALESCE((p->>'is_active')::boolean,true), uid, uid) RETURNING id INTO v_id;
    ELSE
      SELECT * INTO d FROM public.transport_drivers WHERE id = v_id;
      IF d.id IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบคนขับ'; END IF;
      UPDATE public.transport_drivers SET driver_code = NULLIF(p->>'driver_code',''), full_name = btrim(p->>'full_name'), phone = NULLIF(p->>'phone',''), license_no = NULLIF(p->>'license_no',''),
        is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now(), updated_by = uid WHERE id = v_id;
      IF d.app_user_id IS NOT NULL THEN
        UPDATE public.app_users SET full_name = btrim(p->>'full_name'), is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now() WHERE id = d.app_user_id;
        IF v_pw IS NOT NULL THEN
          UPDATE public.app_users SET password_hash = extensions.crypt(v_pw, extensions.gen_salt('bf')), password = NULL, updated_at = now() WHERE id = d.app_user_id;
          UPDATE public.transport_sessions SET revoked_at = now() WHERE app_user_id = d.app_user_id AND revoked_at IS NULL;
        END IF;
      END IF;
    END IF;
  ELSE RAISE EXCEPTION 'TNJ_VALIDATION:kind';
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

-- ---------- users (SUPER_ADMIN) ----------
CREATE OR REPLACE FUNCTION public.tnj_users_list(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name, 'base_role', u.role::text, 'tnj_role', public.tnj_role_of(u),
    'is_active', u.is_active, 'status', u.status, 'driver_id', d.id, 'has_hash', (COALESCE(u.password_hash,'') <> '')) ORDER BY u.username)
    FROM public.app_users u LEFT JOIN public.transport_drivers d ON d.app_user_id = u.id WHERE u.app_code = 'transport'), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_users_save(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; uid uuid; v_id uuid; v_username text; v_pw text; v_role text;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  uid := (c->>'user_id')::uuid; v_id := NULLIF(p->>'id','')::uuid; v_username := lower(btrim(COALESCE(p->>'username',''))); v_pw := NULLIF(p->>'password','');
  v_role := COALESCE(NULLIF(p->>'tnj_role',''), 'TRANSPORT');
  IF v_role NOT IN ('SUPER_ADMIN','ADMIN','TRANSPORT','DRIVER','VIEWER') THEN RAISE EXCEPTION 'TNJ_VALIDATION:role'; END IF;
  IF v_id IS NULL THEN
    IF v_username = '' OR v_pw IS NULL THEN RAISE EXCEPTION 'TNJ_VALIDATION:กรุณาระบุชื่อผู้ใช้และรหัสผ่าน'; END IF;
    IF EXISTS (SELECT 1 FROM public.app_users WHERE lower(username) = v_username AND app_code = 'transport') THEN RAISE EXCEPTION 'TNJ_VALIDATION:ชื่อผู้ใช้นี้มีอยู่แล้ว'; END IF;
    INSERT INTO public.app_users(username, full_name, role, app_code, password_hash, is_active, status, approved, created_by)
    VALUES (v_username, COALESCE(NULLIF(btrim(p->>'full_name'),''), v_username), 'USER', 'transport', extensions.crypt(v_pw, extensions.gen_salt('bf')), true, 'active', true, uid) RETURNING id INTO v_id;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = v_id AND app_code = 'transport') THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่พบผู้ใช้'; END IF;
    IF v_id = uid AND v_role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'TNJ_VALIDATION:ไม่สามารถลดสิทธิ์ตัวเองได้'; END IF;
    UPDATE public.app_users SET full_name = COALESCE(NULLIF(btrim(p->>'full_name'),''), full_name), is_active = COALESCE((p->>'is_active')::boolean, is_active), updated_at = now() WHERE id = v_id;
    IF v_pw IS NOT NULL THEN
      UPDATE public.app_users SET password_hash = extensions.crypt(v_pw, extensions.gen_salt('bf')), password = NULL, updated_at = now() WHERE id = v_id;
      UPDATE public.transport_sessions SET revoked_at = now() WHERE app_user_id = v_id AND revoked_at IS NULL AND app_user_id <> uid;
    END IF;
  END IF;
  INSERT INTO public.transport_user_roles(app_user_id, tnj_role, created_by, updated_by) VALUES (v_id, v_role, uid, uid)
  ON CONFLICT (app_user_id) DO UPDATE SET tnj_role = EXCLUDED.tnj_role, updated_at = now(), updated_by = EXCLUDED.updated_by;
  IF v_role = 'DRIVER' AND NOT EXISTS (SELECT 1 FROM public.transport_drivers WHERE app_user_id = v_id) THEN
    INSERT INTO public.transport_drivers(app_user_id, full_name, phone, is_active, created_by, updated_by)
    VALUES (v_id, COALESCE(NULLIF(btrim(p->>'full_name'),''), v_username), NULLIF(p->>'phone',''), true, uid, uid);
  END IF;
  PERFORM public.tnj_audit_write('app_users', v_id::text, NULL, 'USER_SAVE', 'tnj_role', NULL, v_role, uid, c->>'full_name');
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.tnj_settings_get(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb;
BEGIN
  c := public.tnj_auth(p_token); PERFORM public.tnj_require_admin(c);
  RETURN jsonb_build_object('settings', COALESCE((SELECT jsonb_object_agg(key, value) FROM public.transport_settings), '{}'::jsonb), 'release', public.tnj_version_status());
END $$;

CREATE OR REPLACE FUNCTION public.tnj_settings_set(p_token text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','extensions' AS $$
DECLARE c jsonb; k text; v text;
BEGIN
  c := public.tnj_auth(p_token);
  IF c->>'role' <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'TNJ_FORBIDDEN'; END IF;
  FOR k, v IN SELECT * FROM jsonb_each_text(p) LOOP
    IF k NOT IN ('gps_interval_sec','gps_stale_min') THEN CONTINUE; END IF;
    IF v !~ '^[0-9]+$' THEN RAISE EXCEPTION 'TNJ_VALIDATION:ค่าต้องเป็นตัวเลข'; END IF;
    INSERT INTO public.transport_settings(key, value, updated_by) VALUES (k, v, (c->>'user_id')::uuid)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by;
  END LOOP;
  RETURN public.tnj_settings_get(p_token);
END $$;

-- ---------- grants ----------
REVOKE ALL ON FUNCTION public.tnj_auth(text), public.tnj_role_of(public.app_users), public.tnj_broadcast(text,text,jsonb),
  public.tnj_audit_write(text,text,uuid,text,text,text,text,uuid,text), public.tnj_next_job_no(date),
  public.tnj_timeline_add(jsonb,uuid,text,text,text,text,double precision,double precision,double precision,text,text,timestamptz),
  public.tnj_require_office(jsonb), public.tnj_require_admin(jsonb), public.tnj_setting(text,text)
  FROM PUBLIC, anon, authenticated;
