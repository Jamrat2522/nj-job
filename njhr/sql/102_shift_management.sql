-- 102_shift_management.sql
-- Scope: shift management only
-- - Add explicit NO_SHIFT read state for the logged-in employee.
-- - Auto-assign NEW employees to NJLOGISTIC 08:30-17:30 from insert time onward.
-- - No backfill, no UPDATE/DELETE of existing employee_shifts or attendance history.

DO $$
DECLARE
  v_count integer;
BEGIN
  IF to_regclass('public.employees') IS NULL
     OR to_regclass('public.employee_shifts') IS NULL
     OR to_regclass('public.work_shifts') IS NULL THEN
    RAISE EXCEPTION 'Shift schema is incomplete';
  END IF;

  SELECT count(*)::int INTO v_count
    FROM public.work_shifts w
   WHERE lower(btrim(w.shift_name)) = 'njlogistic'
     AND w.start_time = time '08:30'
     AND w.end_time = time '17:30'
     AND w.is_active IS TRUE;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Default shift NJLOGISTIC 08:30-17:30 must exist exactly once and be active (found %)', v_count;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.njhr_shift_my_state(
  p_token text,
  p_date date DEFAULT NULL::date
)
RETURNS TABLE(
  status text,
  shift_id uuid,
  shift_name text,
  start_time time without time zone,
  end_time time without time zone,
  effective_date date,
  attendance_required boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  c record;
  st record;
  w record;
  v_date date := coalesce(p_date, (now() at time zone 'Asia/Bangkok')::date);
BEGIN
  SELECT * INTO c FROM public.njhr_ctx(p_token);
  IF c IS NULL OR c.app_user_id IS NULL THEN
    RAISE EXCEPTION 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' USING errcode='28000';
  END IF;
  IF c.employee_id IS NULL THEN
    RAISE EXCEPTION 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน' USING errcode='28000';
  END IF;

  SELECT * INTO st FROM public.njhr_shift_state_at(c.employee_id, v_date);
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'UNASSIGNED'::text, NULL::uuid, NULL::text,
                        NULL::time, NULL::time, NULL::date, TRUE;
    RETURN;
  END IF;

  IF upper(coalesce(st.status,'')) = 'NO_SHIFT' THEN
    RETURN QUERY SELECT 'NO_SHIFT'::text, NULL::uuid, 'ไม่มีกะ'::text,
                        NULL::time, NULL::time, st.effective_date, FALSE;
    RETURN;
  END IF;

  IF upper(coalesce(st.status,'')) = 'ACTIVE' AND st.shift_id IS NOT NULL THEN
    SELECT * INTO w FROM public.work_shifts ws WHERE ws.id = st.shift_id;
    IF FOUND THEN
      RETURN QUERY SELECT 'ACTIVE'::text, w.id, w.shift_name,
                          w.start_time, w.end_time, st.effective_date, TRUE;
      RETURN;
    END IF;
  END IF;

  -- REMOVED/other non-NO_SHIFT states preserve the existing attendance behavior.
  RETURN QUERY SELECT upper(coalesce(st.status,'UNASSIGNED'))::text,
                      NULL::uuid, NULL::text, NULL::time, NULL::time,
                      st.effective_date, TRUE;
END
$function$;

REVOKE ALL ON FUNCTION public.njhr_shift_my_state(text,date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.njhr_shift_my_state(text,date) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njhr_shift_my_state(text,date) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.njhr_shift_default_new_employee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_shift uuid;
  v_count integer;
  v_date date := (now() at time zone 'Asia/Bangkok')::date;
BEGIN
  -- New active/probation employees only. Existing employees are never touched by this trigger.
  IF upper(coalesce(NEW.status::text,'')) NOT IN ('ACTIVE','PROBATION') THEN
    RETURN NEW;
  END IF;

  -- Defensive: another insert path may already have written a shift for this NEW employee.
  IF EXISTS (SELECT 1 FROM public.employee_shifts es WHERE es.employee_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::int INTO v_count
    FROM public.work_shifts w
   WHERE lower(btrim(w.shift_name)) = 'njlogistic'
     AND w.start_time = time '08:30'
     AND w.end_time = time '17:30'
     AND w.is_active IS TRUE;
  SELECT w.id INTO v_shift
    FROM public.work_shifts w
   WHERE lower(btrim(w.shift_name)) = 'njlogistic'
     AND w.start_time = time '08:30'
     AND w.end_time = time '17:30'
     AND w.is_active IS TRUE
   LIMIT 1;

  IF v_count <> 1 OR v_shift IS NULL THEN
    RAISE EXCEPTION 'ไม่พบกะเริ่มต้น NJLOGISTIC 08:30–17:30 ที่เปิดใช้งานเพียงรายการเดียว'
      USING errcode='P0002';
  END IF;

  INSERT INTO public.employee_shifts(
    employee_id, shift_id, effective_date, status, assigned_by, assigned_at
  ) VALUES (
    NEW.id, v_shift, v_date, 'ACTIVE', 'AUTO_DEFAULT:NJLOGISTIC', now()
  );

  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.njhr_shift_default_new_employee() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.njhr_shift_default_new_employee() FROM anon, authenticated;

DROP TRIGGER IF EXISTS njhr_employee_default_shift_ai ON public.employees;
CREATE TRIGGER njhr_employee_default_shift_ai
AFTER INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.njhr_shift_default_new_employee();

COMMENT ON FUNCTION public.njhr_shift_my_state(text,date) IS
  'Current logged-in employee shift state. attendance_required=false only for effective NO_SHIFT.';
COMMENT ON FUNCTION public.njhr_shift_default_new_employee() IS
  'Assigns newly inserted ACTIVE/PROBATION employees to active NJLOGISTIC 08:30-17:30 from insert date; no backfill.';
