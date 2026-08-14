-- 103_shift_move_reliable.sql
-- Scope: shift movement only.
-- Production verification before this change proved the existing batch functions work when
-- invoked inside PostgreSQL (including repeated calls in one transaction), while the browser
-- path was returning HTTP 400. This endpoint removes the fragile PostgREST uuid[] binding
-- boundary by accepting employee ids as JSONB, validating them inside PostgreSQL, and using
-- an atomic UPSERT for exactly one effective-date row per employee.
-- It never UPDATEs/DELETEs shift rows for other dates and never touches attendance history.

CREATE OR REPLACE FUNCTION public.njhr_shift_move_many(
  p_token text,
  p_employees jsonb,
  p_shift text,
  p_effective_date text,
  p_no_shift boolean DEFAULT false
)
RETURNS TABLE(
  employee_id uuid,
  emp_code text,
  old_shift_name text,
  result text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  c record;
  r record;
  v_ids uuid[] := ARRAY[]::uuid[];
  v_emp uuid;
  v_shift uuid;
  v_date date;
  v_target_status text := CASE WHEN coalesce(p_no_shift, false) THEN 'NO_SHIFT' ELSE 'ACTIVE' END;
  v_target_name text;
  v_old_shift text;
  v_same_shift uuid;
  v_same_status text;
  v_had_row boolean;
  v_changed int := 0;
  v_codes text := '';
  v_json_count int;
BEGIN
  SELECT * INTO c FROM public.njhr_shift_guard(p_token, true);

  IF p_employees IS NULL OR jsonb_typeof(p_employees) <> 'array' THEN
    RAISE EXCEPTION 'ข้อมูลพนักงานไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง' USING errcode='22023';
  END IF;

  v_json_count := jsonb_array_length(p_employees);
  IF v_json_count < 1 THEN
    RAISE EXCEPTION 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' USING errcode='22023';
  END IF;
  IF v_json_count > 1000 THEN
    RAISE EXCEPTION 'เลือกพนักงานได้สูงสุด 1,000 คนต่อครั้ง' USING errcode='22023';
  END IF;

  FOR r IN
    SELECT x.value AS raw_id, x.ord
      FROM jsonb_array_elements_text(p_employees) WITH ORDINALITY AS x(value, ord)
     ORDER BY x.ord
  LOOP
    IF r.raw_id IS NULL OR r.raw_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'รหัสพนักงานในรายการไม่ถูกต้อง (ลำดับที่ %)', r.ord USING errcode='22023';
    END IF;
    v_emp := r.raw_id::uuid;
    IF NOT (v_emp = ANY(v_ids)) THEN
      v_ids := array_append(v_ids, v_emp);
    END IF;
  END LOOP;

  IF cardinality(v_ids) < 1 THEN
    RAISE EXCEPTION 'กรุณาเลือกพนักงานอย่างน้อย 1 คน' USING errcode='22023';
  END IF;

  IF (SELECT count(*) FROM public.employees e WHERE e.id = ANY(v_ids)) <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'พบพนักงานบางรายการที่ไม่มีอยู่ในระบบ กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง' USING errcode='P0002';
  END IF;

  IF p_effective_date IS NULL OR btrim(p_effective_date) !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'วันที่มีผลไม่ถูกต้อง' USING errcode='22023';
  END IF;
  BEGIN
    v_date := btrim(p_effective_date)::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'วันที่มีผลไม่ถูกต้อง' USING errcode='22023';
  END;
  IF to_char(v_date, 'YYYY-MM-DD') <> btrim(p_effective_date) THEN
    RAISE EXCEPTION 'วันที่มีผลไม่ถูกต้อง' USING errcode='22023';
  END IF;

  IF coalesce(p_no_shift, false) THEN
    v_shift := NULL;
    v_target_name := 'ไม่มีกะ';
  ELSE
    IF p_shift IS NULL OR btrim(p_shift) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'กะปลายทางไม่ถูกต้อง กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง' USING errcode='22023';
    END IF;
    v_shift := btrim(p_shift)::uuid;
    SELECT w.shift_name INTO v_target_name
      FROM public.work_shifts w
     WHERE w.id = v_shift AND w.is_active IS TRUE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ไม่พบกะปลายทางที่เปิดใช้งาน กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง' USING errcode='P0002';
    END IF;
  END IF;

  FOREACH v_emp IN ARRAY v_ids
  LOOP
    v_old_shift := NULL;
    SELECT ws.shift_name INTO v_old_shift
      FROM public.njhr_shift_state_at(v_emp, v_date) st
      JOIN public.work_shifts ws ON ws.id = st.shift_id
     WHERE st.status = 'ACTIVE';

    v_same_shift := NULL;
    v_same_status := NULL;
    SELECT es.shift_id, coalesce(es.status, 'ACTIVE')
      INTO v_same_shift, v_same_status
      FROM public.employee_shifts es
     WHERE es.employee_id = v_emp
       AND es.effective_date = v_date;
    v_had_row := FOUND;

    SELECT e.emp_code INTO emp_code FROM public.employees e WHERE e.id = v_emp;

    IF v_had_row
       AND v_same_shift IS NOT DISTINCT FROM v_shift
       AND v_same_status = v_target_status THEN
      result := 'UNCHANGED';
    ELSE
      INSERT INTO public.employee_shifts(
        employee_id, shift_id, effective_date, status, assigned_by, assigned_at
      ) VALUES (
        v_emp, v_shift, v_date, v_target_status, c.username, now()
      )
      ON CONFLICT (employee_id, effective_date)
        WHERE employee_id IS NOT NULL AND effective_date IS NOT NULL
      DO UPDATE SET
        shift_id = EXCLUDED.shift_id,
        status = EXCLUDED.status,
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = EXCLUDED.assigned_at;

      result := CASE WHEN v_had_row THEN 'REPLACED' ELSE 'INSERTED' END;
      v_changed := v_changed + 1;
      v_codes := v_codes || CASE WHEN v_codes = '' THEN '' ELSE ', ' END || coalesce(emp_code, v_emp::text);
    END IF;

    employee_id := v_emp;
    old_shift_name := v_old_shift;
    RETURN NEXT;
  END LOOP;

  IF v_changed > 0 THEN
    PERFORM public.njhr_audit_write(
      p_token,
      CASE WHEN coalesce(p_no_shift, false) THEN 'SHIFT_NO_SHIFT' ELSE 'SHIFT_ASSIGN' END,
      'shift',
      'employee_shifts',
      NULL,
      CASE WHEN coalesce(p_no_shift, false) THEN 'ย้ายไปไม่มีกะ ' ELSE 'ย้ายเข้ากะ ' || v_target_name || ' ' END ||
        v_changed || ' คน มีผล ' || to_char(v_date, 'DD/MM/YYYY') ||
        CASE WHEN v_codes <> '' THEN ' · ' || v_codes ELSE '' END,
      NULL, NULL, NULL
    );
  END IF;
END
$function$;

REVOKE ALL ON FUNCTION public.njhr_shift_move_many(text,jsonb,text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.njhr_shift_move_many(text,jsonb,text,text,boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njhr_shift_move_many(text,jsonb,text,text,boolean) TO anon, authenticated;

COMMENT ON FUNCTION public.njhr_shift_move_many(text,jsonb,text,text,boolean) IS
  'Reliable batch shift move endpoint for browser/PostgREST. JSONB employee ids are validated inside PostgreSQL; one effective-date row per employee is UPSERTed without touching other shift or attendance history.';

NOTIFY pgrst, 'reload schema';
