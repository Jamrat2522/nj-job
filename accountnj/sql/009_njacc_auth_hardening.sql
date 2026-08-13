-- =====================================================================
-- BILLING NJ — 009_njacc_auth_hardening.sql   (v1.2.0)
-- Auth / Profile Security Hardening
--   1. auth_identity แบบ opaque (njacc-auth-<uuid>) แทนการใช้ ...80@billing.app
--   2. ปิด direct SELECT บน njacc_profiles / njacc_user_access จากเบราว์เซอร์
--   3. ถอน njacc_resolve_login ทิ้งจาก runtime (เบราว์เซอร์ห้าม resolve ตัวตนภายใน)
--   4. RPC ฝั่ง server เท่านั้น: njacc_auth_lookup /
--      njacc_admin_auth_identity  → GRANT ให้ service_role เท่านั้น
--   5. njacc_admin_upsert_user ไม่รับ internal identity จาก client อีกต่อไป
--
-- ► สำคัญสำหรับระบบที่ติดตั้งไปแล้ว (upgrade):
--   ผู้ใช้เดิมยังผูกกับอีเมล Auth แบบเก่า (เช่น jamrat80@billing.app) ซึ่งจะยังติดอยู่ใน JWT
--   หลังรันไฟล์นี้ ให้เข้า Dashboard → Authentication → Users → แก้ Email ของแต่ละคน
--   เป็นค่าที่ได้จาก VERIFICATION ข้อ 6 (njacc-auth-<uuid>@auth.billing.local)
--   auth_user_id ไม่เปลี่ยน จึงไม่ต้อง link ใหม่ และรหัสผ่านเดิมยังใช้ได้
--
-- ► ใช้กับระบบที่ติดตั้ง 001–008 ไปแล้ว
--   Fresh Install (001→008 เวอร์ชันในชุดนี้) ปลอดภัยตั้งแต่ต้นอยู่แล้ว — รันไฟล์นี้ซ้ำได้
-- ไม่แตะตาราง BILLING เดิม (service_charge_records / advance_charge_records / app_users)
-- =====================================================================

-- ► PREFLIGHT (ดูสถานะก่อนแก้ — read only)
SELECT 'profiles_grants' AS check, grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_name='njacc_profiles' AND grantee IN ('anon','authenticated');
SELECT 'resolve_login_exists' AS check, count(*) FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_resolve_login';

BEGIN;

-- ---------------------------------------------------------------
-- 1) auth_identity (opaque) + internal_username เป็น metadata ที่ไม่บังคับ
-- ---------------------------------------------------------------
ALTER TABLE public.njacc_profiles
  ADD COLUMN IF NOT EXISTS auth_identity text;

UPDATE public.njacc_profiles
   SET auth_identity = 'njacc-auth-'||gen_random_uuid()::text
 WHERE auth_identity IS NULL;

ALTER TABLE public.njacc_profiles
  ALTER COLUMN auth_identity SET DEFAULT ('njacc-auth-'||gen_random_uuid()::text),
  ALTER COLUMN auth_identity SET NOT NULL,
  ALTER COLUMN internal_username DROP NOT NULL;

DO $c$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='njacc_profiles_authid_uq') THEN
    ALTER TABLE public.njacc_profiles ADD CONSTRAINT njacc_profiles_authid_uq UNIQUE (auth_identity);
  END IF;
END $c$;

-- ---------------------------------------------------------------
-- 2) ปิด direct table access จากเบราว์เซอร์
--    (เดิม authenticated มี GRANT SELECT + policy self → อ่าน internal_username ได้ = FAIL)
-- ---------------------------------------------------------------
REVOKE ALL ON public.njacc_profiles     FROM authenticated, anon;
REVOKE ALL ON public.njacc_user_access  FROM authenticated, anon;
DROP POLICY IF EXISTS njacc_profiles_self_sel ON public.njacc_profiles;
-- ไม่มี policy ใด ๆ เหลือบนสองตารางนี้สำหรับ authenticated → เข้าถึงได้เฉพาะผ่าน RPC

-- ---------------------------------------------------------------
-- 3) ถอน njacc_resolve_login ออกจากระบบ
--    Dependency check: runtime ปัจจุบันไม่มีผู้เรียก (Edge Function ใช้ njacc_auth_lookup)
-- ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.njacc_resolve_login(text);

-- ---------------------------------------------------------------
-- 4) RPC ฝั่ง server เท่านั้น (service_role)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_auth_lookup(p_login text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_identity text;
BEGIN
  IF coalesce(trim(p_login),'') = '' THEN RAISE EXCEPTION 'NJACC_LOGIN_NOT_FOUND'; END IF;
  -- login ได้เฉพาะโปรไฟล์ที่ provision สมบูรณ์เท่านั้น (PENDING/AUTH_CREATED/FAILED_CLEANUP ห้ามผ่าน)
  SELECT auth_identity INTO v_identity FROM public.njacc_profiles
   WHERE lower(login_name) = lower(trim(p_login))
     AND active = true AND provisioning_status = 'ACTIVE' AND auth_user_id IS NOT NULL
   LIMIT 1;
  IF v_identity IS NULL THEN RAISE EXCEPTION 'NJACC_LOGIN_NOT_FOUND'; END IF;
  RETURN v_identity;
END $$;
REVOKE ALL ON FUNCTION public.njacc_auth_lookup(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_auth_lookup(text) TO service_role;

-- njacc_admin_link_auth ถูกถอนออก: ไม่มี runtime caller และเป็นช่อง link auth นอก state machine
-- การ link ทำได้ทางเดียวผ่าน njacc_admin_complete_user() ซึ่งตรวจ ownership + auth.users จริง
DROP FUNCTION IF EXISTS public.njacc_admin_link_auth(uuid,uuid);

CREATE OR REPLACE FUNCTION public.njacc_admin_auth_identity(p_profile uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v text;
BEGIN
  SELECT auth_identity INTO v FROM public.njacc_profiles WHERE id = p_profile;
  IF v IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_auth_identity(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_auth_identity(uuid) TO service_role;

-- ---------------------------------------------------------------
-- 4b) AUDIT SANITIZER + LOGIN AUDIT (server-only)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_sanitize_detail(p jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN p IS NULL THEN NULL ELSE
    p - 'password' - 'temp_password' - 'new_password' - 'auth_identity' - 'auth_email'
      - 'internal_username' - 'internal_email' - 'auth_user_id' - 'provisioning_auth_user_id'
      - 'tracked_auth_user_id' - 'access_token' - 'refresh_token' - 'service_role'
      - 'secret' - 'apikey' - 'token'
  END
$$;
REVOKE ALL ON FUNCTION public.njacc_sanitize_detail(jsonb) FROM public, anon, authenticated;

-- LOGIN audit: ครั้งเดียวหลัง authenticate สำเร็จ (Edge Function njacc-login เรียก · best-effort)
CREATE OR REPLACE FUNCTION public.njacc_log_login_success(p_login text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.njacc_profiles
   WHERE lower(login_name) = lower(trim(coalesce(p_login,''))) AND active = true LIMIT 1;
  IF v_id IS NULL THEN RETURN; END IF;
  PERFORM public.njacc_audit(v_id,'LOGIN','profile',v_id::text,
    jsonb_build_object('login_name', p_login));
END $$;
REVOKE ALL ON FUNCTION public.njacc_log_login_success(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_log_login_success(text) TO service_role;

-- list_audit: sanitize detail ก่อนส่งเบราว์เซอร์
CREATE OR REPLACE FUNCTION public.njacc_list_audit(p_page int DEFAULT 1, p_size int DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_size int; v_off int;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role NOT IN ('SUPER_ADMIN','ADMIN') THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  v_size := least(greatest(coalesce(p_size,50),1),200);
  v_off := (greatest(coalesce(p_page,1),1)-1)*v_size;
  RETURN jsonb_build_object(
    'total',(SELECT count(*) FROM public.njacc_audit_logs),
    'rows',(SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (
      SELECT a.id,a.action,a.entity_type,a.entity_id,
             public.njacc_sanitize_detail(a.detail) AS detail,
             a.created_at,p.full_name
        FROM public.njacc_audit_logs a LEFT JOIN public.njacc_profiles p ON p.id=a.profile_id
       ORDER BY a.id DESC OFFSET v_off LIMIT v_size) t));
END $$;
REVOKE ALL ON FUNCTION public.njacc_list_audit(int,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_list_audit(int,int) TO authenticated;

-- ---------------------------------------------------------------
-- 5) Safe profile RPC (ยืนยันชุด field ที่คืน — ไม่มี internal identity)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_my_profile()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.njacc_profiles; v_acc jsonb;
BEGIN
  p := public.njacc_req_profile();
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'charge_type',charge_type,'company_group',company_group,
      'can_view',can_view,'can_create',can_create,'can_edit',can_edit,
      'can_invoice',can_invoice,'can_receive_payment',can_receive_payment,
      'can_issue_receipt',can_issue_receipt,'can_export',can_export,
      'can_void',can_void,'can_delete',can_delete,
      'can_manage_users',can_manage_users)),'[]'::jsonb)
  INTO v_acc FROM public.njacc_user_access WHERE profile_id = p.id;
  -- READ-ONLY: ไม่เขียน audit ที่นี่ (LOGIN audit เกิดครั้งเดียวตอน login สำเร็จ ผ่าน njacc_log_login_success)
  -- SAFE FIELDS ONLY: ไม่คืน auth_identity / internal_username / auth_user_id
  RETURN jsonb_build_object('id',p.id,'employee_code',p.employee_code,
    'full_name',p.full_name,'department',p.department,'login_name',p.login_name,
    'role',p.role,'active',p.active,'access',v_acc);
END $$;
REVOKE ALL ON FUNCTION public.njacc_my_profile() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_my_profile() TO authenticated;

-- ---------------------------------------------------------------
-- 6) admin upsert = **EDIT ONLY** (ห้ามสร้างผู้ใช้ใหม่ทางนี้)
--    การสร้างผู้ใช้มีทางเดียว: Edge Function njacc-admin-user → njacc_admin_begin_user
--    (เพื่อไม่ให้ bypass state machine / auth provisioning / idempotency / orphan protection)
--    อัปเดตเฉพาะ whitelist field: full_name, department, role, active, access
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.njacc_admin_upsert_user(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid; v_old public.njacc_profiles;
        v_role text; v_active boolean; v_super int;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF p->>'id' IS NULL THEN RAISE EXCEPTION 'NJACC_CREATE_USER_USE_EDGE'; END IF;

  v_id := (p->>'id')::uuid;
  SELECT * INTO v_old FROM public.njacc_profiles WHERE id = v_id FOR UPDATE;
  IF v_old.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;

  v_role   := coalesce(p->>'role', v_old.role);
  IF v_role NOT IN ('SUPER_ADMIN','ADMIN','USER') THEN RAISE EXCEPTION 'NJACC_BAD_ROLE'; END IF;
  IF p ? 'active' AND jsonb_typeof(p->'active') <> 'boolean' THEN RAISE EXCEPTION 'NJACC_BAD_INPUT'; END IF;
  v_active := coalesce((p->>'active')::boolean, v_old.active);
  -- เปิดใช้งานได้เฉพาะโปรไฟล์ที่ provision สำเร็จแล้วเท่านั้น
  IF v_active AND (v_old.provisioning_status <> 'ACTIVE' OR v_old.auth_user_id IS NULL) THEN
    RAISE EXCEPTION 'NJACC_USER_NOT_PROVISIONED';
  END IF;

  -- กันระบบไม่เหลือ SUPER_ADMIN ที่ใช้งานได้ (ตรวจที่ DB ไม่พึ่ง UI)
  IF v_old.role = 'SUPER_ADMIN' AND v_old.active
     AND (v_role <> 'SUPER_ADMIN' OR v_active = false) THEN
    -- นับเฉพาะ SUPER_ADMIN ที่ใช้งานได้จริง (provision สมบูรณ์ + link แล้ว)
    SELECT count(*) INTO v_super FROM public.njacc_profiles
     WHERE role='SUPER_ADMIN' AND active = true AND provisioning_status='ACTIVE'
       AND auth_user_id IS NOT NULL AND id <> v_id;
    IF v_super = 0 THEN RAISE EXCEPTION 'NJACC_LAST_SUPER_ADMIN'; END IF;
  END IF;

  -- whitelist เท่านั้น: auth_user_id / auth_identity / internal_username / provisioning_*
  -- ไม่อยู่ในคำสั่ง UPDATE นี้ → Browser inject ไม่ได้
  UPDATE public.njacc_profiles
     SET full_name  = coalesce(nullif(trim(p->>'full_name'),''), full_name),
         department = CASE WHEN p ? 'department' THEN nullif(trim(p->>'department'),'') ELSE department END,
         role       = v_role,
         active     = v_active
   WHERE id = v_id;

  IF p ? 'access' THEN
    DELETE FROM public.njacc_user_access WHERE profile_id=v_id;
    INSERT INTO public.njacc_user_access(profile_id,charge_type,company_group,can_view,can_create,
      can_edit,can_invoice,can_receive_payment,can_issue_receipt,can_export,can_void,
      can_delete,can_manage_users)
    SELECT v_id, x->>'charge_type', x->>'company_group',
      coalesce((x->>'can_view')::boolean,false),coalesce((x->>'can_create')::boolean,false),
      coalesce((x->>'can_edit')::boolean,false),coalesce((x->>'can_invoice')::boolean,false),
      coalesce((x->>'can_receive_payment')::boolean,false),coalesce((x->>'can_issue_receipt')::boolean,false),
      coalesce((x->>'can_export')::boolean,false),coalesce((x->>'can_void')::boolean,false),
      coalesce((x->>'can_delete')::boolean,false),coalesce((x->>'can_manage_users')::boolean,false)
    FROM jsonb_array_elements(p->'access') AS t(x);
  END IF;

  PERFORM public.njacc_audit(pr.id,'EDIT_USER','profile',v_id::text,
    jsonb_build_object('login_name',v_old.login_name,'role',v_role,'active',v_active,
      'access_changed',(p ? 'access')));
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_upsert_user(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_admin_upsert_user(jsonb) TO authenticated;

-- ---------------------------------------------------------------
-- 7) CREATE USER: Atomic / Idempotent / Retry-safe
--    กลยุทธ์ = PENDING state + compensating rollback (Option A+B ผสม)
--    เหตุผล: Supabase Auth Admin API อยู่นอก transaction ของ Postgres
--            จึงครอบ BEGIN/COMMIT ร่วมกันไม่ได้จริง
-- ---------------------------------------------------------------
ALTER TABLE public.njacc_profiles
  ADD COLUMN IF NOT EXISTS provisioning_status     text NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS provisioning_request_id text,
  ADD COLUMN IF NOT EXISTS provisioning_auth_user_id uuid;   -- SERVER-ONLY: ติดตาม auth user ระหว่าง provision
ALTER TABLE public.njacc_profiles ALTER COLUMN provisioning_status SET DEFAULT 'PENDING';
ALTER TABLE public.njacc_profiles ALTER COLUMN active SET DEFAULT false;

-- backfill ให้สอดคล้อง invariant ก่อนติดตั้ง CHECK (ระบบเก่า: แถวที่ link แล้ว = ACTIVE)
UPDATE public.njacc_profiles
   SET provisioning_status = 'ACTIVE',
       provisioning_auth_user_id = coalesce(provisioning_auth_user_id, auth_user_id)
 WHERE auth_user_id IS NOT NULL AND provisioning_status <> 'ACTIVE';
UPDATE public.njacc_profiles
   SET provisioning_status = 'PENDING', active = false
 WHERE auth_user_id IS NULL AND provisioning_status = 'ACTIVE';
UPDATE public.njacc_profiles
   SET active = false
 WHERE active = true AND (auth_user_id IS NULL OR provisioning_status <> 'ACTIVE');

DO $ps$
BEGIN
  ALTER TABLE public.njacc_profiles DROP CONSTRAINT IF EXISTS njacc_profiles_prov_ck;
  ALTER TABLE public.njacc_profiles ADD CONSTRAINT njacc_profiles_prov_ck
    CHECK (provisioning_status IN ('PENDING','AUTH_CREATED','ACTIVE','FAILED_CLEANUP'));
  -- INVARIANT A/B/C บังคับที่ DB (ไม่พึ่ง application layer)
  ALTER TABLE public.njacc_profiles DROP CONSTRAINT IF EXISTS njacc_profiles_prov_active_ck;
  ALTER TABLE public.njacc_profiles ADD CONSTRAINT njacc_profiles_prov_active_ck
    CHECK (provisioning_status <> 'ACTIVE' OR auth_user_id IS NOT NULL);
  ALTER TABLE public.njacc_profiles DROP CONSTRAINT IF EXISTS njacc_profiles_prov_authid_ck;
  ALTER TABLE public.njacc_profiles ADD CONSTRAINT njacc_profiles_prov_authid_ck
    CHECK (provisioning_status <> 'AUTH_CREATED' OR provisioning_auth_user_id IS NOT NULL);
  ALTER TABLE public.njacc_profiles DROP CONSTRAINT IF EXISTS njacc_profiles_active_ck;
  ALTER TABLE public.njacc_profiles ADD CONSTRAINT njacc_profiles_active_ck
    CHECK (active = false OR (provisioning_status = 'ACTIVE' AND auth_user_id IS NOT NULL));
END $ps$;

-- 7.1 BEGIN: จองโปรไฟล์ + สิทธิ์ในทรานแซกชันเดียว (ยังไม่มี auth user)
--     - ตรวจสิทธิ์ผู้เรียกฝั่ง server (SUPER_ADMIN เท่านั้น — ไม่เชื่อ role จาก Browser)
--     - idempotency: request_id ซ้ำ → คืนผลเดิม ไม่สร้างใหม่
--     - concurrency: UNIQUE(login_name) + PK(request_id) เป็นตัวกันซ้ำจริงที่ DB
CREATE OR REPLACE FUNCTION public.njacc_admin_begin_user(p jsonb, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pr public.njacc_profiles; v_id uuid; v_prev record; v_login text; v_code text;
BEGIN
  pr := public.njacc_req_profile();
  IF pr.role <> 'SUPER_ADMIN' THEN RAISE EXCEPTION 'NJACC_FORBIDDEN'; END IF;
  IF coalesce(p_request_id,'') !~ '^[A-Za-z0-9_-]{8,64}$' THEN RAISE EXCEPTION 'NJACC_BAD_REQUEST_ID'; END IF;

  v_login := lower(trim(coalesce(p->>'login_name','')));
  v_code  := nullif(trim(coalesce(p->>'employee_code','')),'');
  IF v_login = '' OR coalesce(trim(p->>'full_name'),'') = '' THEN RAISE EXCEPTION 'NJACC_BAD_INPUT'; END IF;
  IF coalesce(p->>'role','USER') NOT IN ('USER','ADMIN','SUPER_ADMIN') THEN RAISE EXCEPTION 'NJACC_BAD_ROLE'; END IF;

  -- REPLAY: request เดิมทำสำเร็จ/ค้างอยู่ → คืนผลเดิม ห้ามสร้างซ้ำ
  SELECT i.result_id AS pid, x.provisioning_status AS st, (x.auth_user_id IS NOT NULL) AS linked,
         x.provisioning_auth_user_id AS prov_auth
    INTO v_prev
    FROM public.njacc_idempotency_requests i
    LEFT JOIN public.njacc_profiles x ON x.id = i.result_id
   WHERE i.request_id = p_request_id AND i.operation = 'CREATE_USER';
  IF FOUND THEN
    -- REPLAY: ไม่สร้างอะไรใหม่ · คืน state ให้ผู้เรียกทำต่อจากขั้นที่ค้าง
    RETURN jsonb_build_object('profile_id',v_prev.pid,'status','REPLAY',
      'provisioning_status',coalesce(v_prev.st,'MISSING'),
      'auth_linked',coalesce(v_prev.linked,false),
      'provisioning_auth_user_id',v_prev.prov_auth);
  END IF;

  IF EXISTS (SELECT 1 FROM public.njacc_profiles WHERE lower(login_name)=v_login) THEN
    RAISE EXCEPTION 'NJACC_LOGIN_EXISTS'; END IF;
  IF v_code IS NOT NULL AND EXISTS (SELECT 1 FROM public.njacc_profiles WHERE employee_code=v_code) THEN
    RAISE EXCEPTION 'NJACC_EMPCODE_EXISTS'; END IF;

  -- auth_identity มาจาก DEFAULT (opaque) — client กำหนดไม่ได้
  INSERT INTO public.njacc_profiles(employee_code,full_name,department,login_name,role,active,
    provisioning_status,provisioning_request_id)
  -- ระหว่าง provision ต้องเป็น active=false + PENDING เสมอ (ไม่รับค่า active จาก client)
  VALUES (v_code, trim(p->>'full_name'), nullif(trim(coalesce(p->>'department','')),''),
    trim(p->>'login_name'), coalesce(p->>'role','USER'),
    false, 'PENDING', p_request_id)
  RETURNING id INTO v_id;

  IF p ? 'access' THEN
    INSERT INTO public.njacc_user_access(profile_id,charge_type,company_group,can_view,can_create,
      can_edit,can_invoice,can_receive_payment,can_issue_receipt,can_export,can_void,
      can_delete,can_manage_users)
    SELECT v_id, x->>'charge_type', x->>'company_group',
      coalesce((x->>'can_view')::boolean,false),coalesce((x->>'can_create')::boolean,false),
      coalesce((x->>'can_edit')::boolean,false),coalesce((x->>'can_invoice')::boolean,false),
      coalesce((x->>'can_receive_payment')::boolean,false),coalesce((x->>'can_issue_receipt')::boolean,false),
      coalesce((x->>'can_export')::boolean,false),coalesce((x->>'can_void')::boolean,false),
      coalesce((x->>'can_delete')::boolean,false),coalesce((x->>'can_manage_users')::boolean,false)
    FROM jsonb_array_elements(p->'access') AS t(x);
  END IF;

  INSERT INTO public.njacc_idempotency_requests(request_id,operation,profile_id,result_type,result_id)
  VALUES (p_request_id,'CREATE_USER',pr.id,'profile',v_id);

  PERFORM public.njacc_audit(pr.id,'CREATE_USER_BEGIN','profile',v_id::text,
    jsonb_build_object('request_id',p_request_id,'login_name',p->>'login_name',
      'employee_code',v_code,'role',coalesce(p->>'role','USER'),'result','PENDING'));
  RETURN jsonb_build_object('profile_id',v_id,'status','CREATED',
    'provisioning_status','PENDING','auth_linked',false,
    'provisioning_auth_user_id',NULL);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_begin_user(jsonb,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.njacc_admin_begin_user(jsonb,text) TO authenticated;

-- 7.1b MARK AUTH CREATED: บันทึก auth user ที่เพิ่งสร้าง "ก่อน" activate
--      → ทุก auth user ที่ระบบสร้างมี record อ้างอิงเสมอ (กัน orphan ที่ตามไม่เจอ)
CREATE OR REPLACE FUNCTION public.njacc_admin_mark_auth_created(p_profile uuid, p_auth uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles;
BEGIN
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile FOR UPDATE;
  IF v.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id THEN RAISE EXCEPTION 'NJACC_REQUEST_MISMATCH'; END IF;
  IF v.provisioning_auth_user_id IS NOT NULL AND v.provisioning_auth_user_id <> p_auth THEN
    RAISE EXCEPTION 'NJACC_AUTH_ALREADY_TRACKED'; END IF;
  UPDATE public.njacc_profiles
     SET provisioning_auth_user_id = p_auth,
         provisioning_status = CASE WHEN provisioning_status='PENDING' THEN 'AUTH_CREATED'
                                    ELSE provisioning_status END
   WHERE id = p_profile;
  RETURN jsonb_build_object('profile_id',p_profile,'provisioning_status','AUTH_CREATED');
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_mark_auth_created(uuid,uuid,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_mark_auth_created(uuid,uuid,text) TO service_role;

-- 7.1c PROVISION STATE: ใช้ reconcile เมื่อ HTTP timeout/ตอบกลับไม่ชัด (service_role only)
CREATE OR REPLACE FUNCTION public.njacc_admin_provision_state(p_profile uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles;
BEGIN
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile;
  IF v.id IS NULL THEN RETURN jsonb_build_object('exists',false); END IF;
  RETURN jsonb_build_object('exists',true,
    'owned', (v.provisioning_request_id IS NOT DISTINCT FROM p_request_id),
    'provisioning_status', v.provisioning_status,
    'auth_user_id', v.auth_user_id,
    'provisioning_auth_user_id', v.provisioning_auth_user_id);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_provision_state(uuid,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_provision_state(uuid,text) TO service_role;

-- 7.1d MARK FAILED_CLEANUP: ลบ auth user ไม่สำเร็จ → คงแถวไว้พร้อม auth id ที่ติดตามได้
--      ห้ามลบ profile ทิ้งจนตาม auth user ไม่เจอ
CREATE OR REPLACE FUNCTION public.njacc_admin_mark_failed_cleanup(p_profile uuid, p_request_id text, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles; v_actor uuid;
BEGIN
  SELECT profile_id INTO v_actor FROM public.njacc_idempotency_requests
   WHERE request_id = p_request_id AND operation='CREATE_USER';
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile FOR UPDATE;
  IF v.id IS NULL THEN RETURN jsonb_build_object('marked',false,'reason','PROFILE_NOT_FOUND'); END IF;
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id THEN
    RETURN jsonb_build_object('marked',false,'reason','NOT_OWNED'); END IF;
  IF v.auth_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('marked',false,'reason','ALREADY_ACTIVE'); END IF;
  UPDATE public.njacc_profiles SET provisioning_status='FAILED_CLEANUP', active=false
   WHERE id = p_profile;
  -- ไม่บันทึก auth uuid ลง audit — ค่าที่ใช้ repair อยู่ใน column provisioning_auth_user_id เท่านั้น
  PERFORM public.njacc_audit(v_actor,'CREATE_USER_FAILED_CLEANUP','profile',p_profile::text,
    jsonb_build_object('request_id',p_request_id,'result','FAILED_CLEANUP',
      'auth_user_tracked',true,
      'reason',left(coalesce(p_reason,'-'),200)));
  RETURN jsonb_build_object('marked',true);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_mark_failed_cleanup(uuid,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_mark_failed_cleanup(uuid,text,text) TO service_role;

-- 7.1e FIND AUTH USER (reconciliation): หา auth user จาก opaque identity ของโปรไฟล์
--      ใช้เมื่อ Auth Admin API timeout / คืน 422 duplicate → ต้องเช็คของเดิมก่อนสร้างใหม่
--      match ได้ 0 หรือ 1 เท่านั้น · >1 → NJACC_AUTH_IDENTITY_AMBIGUOUS (ต้อง manual review)
--      คืนเฉพาะ UUID — ไม่คืนอีเมล/identity ออกไป
CREATE OR REPLACE FUNCTION public.njacc_admin_find_auth_user(p_profile uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles; v_email text; v_n int; v_uid uuid;
BEGIN
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile;
  IF v.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id THEN RAISE EXCEPTION 'NJACC_REQUEST_MISMATCH'; END IF;
  v_email := lower(v.auth_identity)||'@auth.billing.local';
  SELECT count(*) INTO v_n FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_n > 1 THEN RAISE EXCEPTION 'NJACC_AUTH_IDENTITY_AMBIGUOUS'; END IF;
  IF v_n = 0 THEN RETURN jsonb_build_object('found',false); END IF;
  SELECT u.id INTO v_uid FROM auth.users u WHERE lower(u.email) = v_email;
  -- ownership: auth user นี้ต้องไม่ถูก link กับโปรไฟล์อื่น
  IF EXISTS (SELECT 1 FROM public.njacc_profiles x
              WHERE x.auth_user_id = v_uid AND x.id <> p_profile) THEN
    RAISE EXCEPTION 'NJACC_AUTH_IDENTITY_CONFLICT';
  END IF;
  RETURN jsonb_build_object('found',true,'auth_user_id',v_uid);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_find_auth_user(uuid,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_find_auth_user(uuid,text) TO service_role;

-- 7.1f MARK AUTH DELETED (recovery): auth user ถูกลบแล้วแต่ rollback ไม่สำเร็จ
--      → เคลียร์ tracking กลับเป็น PENDING เพื่อให้ retry สร้าง/reconcile ใหม่ได้
--      ห้ามใช้กับโปรไฟล์ที่ ACTIVE แล้ว
CREATE OR REPLACE FUNCTION public.njacc_admin_mark_auth_deleted(p_profile uuid, p_request_id text, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles; v_actor uuid;
BEGIN
  SELECT profile_id INTO v_actor FROM public.njacc_idempotency_requests
   WHERE request_id = p_request_id AND operation='CREATE_USER';
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile FOR UPDATE;
  IF v.id IS NULL THEN RETURN jsonb_build_object('cleared',false,'reason','PROFILE_NOT_FOUND'); END IF;
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id THEN
    RETURN jsonb_build_object('cleared',false,'reason','NOT_OWNED'); END IF;
  IF v.auth_user_id IS NOT NULL OR v.provisioning_status = 'ACTIVE' THEN
    RETURN jsonb_build_object('cleared',false,'reason','ALREADY_ACTIVE'); END IF;
  UPDATE public.njacc_profiles
     SET provisioning_auth_user_id = NULL, provisioning_status = 'PENDING', active = false
   WHERE id = p_profile;
  PERFORM public.njacc_audit(v_actor,'CREATE_USER_AUTH_DELETED','profile',p_profile::text,
    jsonb_build_object('request_id',p_request_id,'result','AUTH_DELETED',
      'reason',left(coalesce(p_reason,'-'),200)));
  RETURN jsonb_build_object('cleared',true);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_mark_auth_deleted(uuid,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_mark_auth_deleted(uuid,text,text) TO service_role;

-- 7.2 COMPLETE: link auth user + เปลี่ยนเป็น ACTIVE (service_role only)
CREATE OR REPLACE FUNCTION public.njacc_admin_complete_user(p_profile uuid, p_auth uuid, p_request_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles; v_actor uuid; v_n int;
BEGIN
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile FOR UPDATE;
  IF v.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  SELECT profile_id INTO v_actor FROM public.njacc_idempotency_requests
   WHERE request_id = p_request_id AND operation='CREATE_USER';
  -- ownership: ต้องเป็นแถวที่ request นี้สร้างเท่านั้น (ห้ามยึดแถวเก่าของคนอื่น)
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id THEN RAISE EXCEPTION 'NJACC_REQUEST_MISMATCH'; END IF;
  IF v.auth_user_id IS NOT NULL AND v.auth_user_id <> p_auth THEN RAISE EXCEPTION 'NJACC_ALREADY_LINKED'; END IF;
  IF v.auth_user_id = p_auth AND v.provisioning_status = 'ACTIVE' THEN
    RETURN jsonb_build_object('profile_id',p_profile,'provisioning_status','ACTIVE','idempotent',true);
  END IF;
  -- defence-in-depth: ห้ามเชื่อ UUID จาก Edge Function อย่างเดียว
  -- auth user ต้องมีอยู่จริง และอีเมลต้องตรง opaque identity ของโปรไฟล์นี้ (match เดียว)
  SELECT count(*) INTO v_n FROM auth.users u
   WHERE u.id = p_auth AND lower(u.email) = lower(v.auth_identity)||'@auth.billing.local';
  IF v_n <> 1 THEN RAISE EXCEPTION 'NJACC_AUTH_IDENTITY_CONFLICT'; END IF;
  UPDATE public.njacc_profiles
     SET auth_user_id = p_auth, provisioning_auth_user_id = coalesce(provisioning_auth_user_id,p_auth),
         provisioning_status = 'ACTIVE', active = true
   WHERE id = p_profile;
  PERFORM public.njacc_audit(v_actor,'CREATE_USER_COMPLETE','profile',p_profile::text,
    jsonb_build_object('request_id',p_request_id,'login_name',v.login_name,
      'employee_code',v.employee_code,'role',v.role,'result','SUCCESS'));
  RETURN jsonb_build_object('profile_id',p_profile,'provisioning_status','ACTIVE');
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_complete_user(uuid,uuid,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_complete_user(uuid,uuid,text) TO service_role;

-- 7.3 ROLLBACK: ล้างเฉพาะแถวที่ request นี้สร้าง (compensating transaction)
--     เงื่อนไขครบทุกข้อ: request_id ตรง + ยังไม่ link + state ยัง provision ไม่จบ
--     + ไม่มี dependency + auth user ที่ track ไว้ถูกลบแล้ว (p_auth_deleted)
DROP FUNCTION IF EXISTS public.njacc_admin_rollback_user(uuid,text,text);
CREATE OR REPLACE FUNCTION public.njacc_admin_rollback_user(p_profile uuid, p_request_id text,
  p_reason text, p_auth_deleted boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles; v_dep boolean; v_actor uuid;
BEGIN
  SELECT profile_id INTO v_actor FROM public.njacc_idempotency_requests
   WHERE request_id = p_request_id AND operation='CREATE_USER';
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile FOR UPDATE;
  IF v.id IS NULL THEN
    DELETE FROM public.njacc_idempotency_requests
     WHERE request_id = p_request_id AND operation='CREATE_USER';
    RETURN jsonb_build_object('rolled_back',false,'reason','PROFILE_NOT_FOUND');
  END IF;
  IF v.provisioning_request_id IS DISTINCT FROM p_request_id
     OR v.provisioning_status NOT IN ('PENDING','AUTH_CREATED','FAILED_CLEANUP')
     OR v.auth_user_id IS NOT NULL THEN
    -- ไม่ใช่ของ request นี้ / ใช้งานจริงแล้ว → ห้ามลบเด็ดขาด
    PERFORM public.njacc_audit(v_actor,'CREATE_USER_ROLLBACK_SKIPPED','profile',p_profile::text,
      jsonb_build_object('request_id',p_request_id,'reason','NOT_OWNED_OR_ACTIVE'));
    RETURN jsonb_build_object('rolled_back',false,'reason','NOT_OWNED_OR_ACTIVE');
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.njacc_jobs WHERE created_by=p_profile OR updated_by=p_profile)
      OR EXISTS (SELECT 1 FROM public.njacc_invoices WHERE issued_by=p_profile OR voided_by=p_profile)
      OR EXISTS (SELECT 1 FROM public.njacc_payments WHERE created_by=p_profile OR voided_by=p_profile)
    INTO v_dep;
  IF v_dep THEN
    PERFORM public.njacc_audit(v_actor,'CREATE_USER_ROLLBACK_SKIPPED','profile',p_profile::text,
      jsonb_build_object('request_id',p_request_id,'reason','HAS_DEPENDENCY'));
    RETURN jsonb_build_object('rolled_back',false,'reason','HAS_DEPENDENCY');
  END IF;

  -- ต้องไม่มี auth user ที่ยังติดตามค้างอยู่ (ผู้เรียกต้องลบ auth user ให้เรียบร้อยก่อน)
  -- ผู้เรียกต้องยืนยันว่าได้ลบ auth user ที่ track ไว้แล้ว (p_auth_deleted = true)
  IF v.provisioning_auth_user_id IS NOT NULL AND NOT coalesce(p_auth_deleted,false) THEN
    PERFORM public.njacc_audit(v_actor,'CREATE_USER_ROLLBACK_SKIPPED','profile',p_profile::text,
      jsonb_build_object('request_id',p_request_id,'reason','AUTH_USER_STILL_TRACKED'));
    RETURN jsonb_build_object('rolled_back',false,'reason','AUTH_USER_STILL_TRACKED');
  END IF;

  DELETE FROM public.njacc_user_access WHERE profile_id = p_profile;
  DELETE FROM public.njacc_profiles WHERE id = p_profile;
  DELETE FROM public.njacc_idempotency_requests
   WHERE request_id = p_request_id AND operation='CREATE_USER';   -- ปลดล็อกให้ retry ใหม่ได้
  PERFORM public.njacc_audit(v_actor,'CREATE_USER_ROLLBACK','profile',p_profile::text,
    jsonb_build_object('request_id',p_request_id,'login_name',v.login_name,
      'employee_code',v.employee_code,'result','FAILED',
      'reason',left(coalesce(p_reason,'-'),200),'rollback','DONE'));
  RETURN jsonb_build_object('rolled_back',true);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_rollback_user(uuid,text,text,boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_rollback_user(uuid,text,text,boolean) TO service_role;

-- 7.4 SAFE PROFILE ของผู้ใช้ที่เพิ่งสร้าง (คืนให้ Frontend — ไม่มี identity/auth email)
CREATE OR REPLACE FUNCTION public.njacc_admin_safe_profile(p_profile uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.njacc_profiles;
BEGIN
  SELECT * INTO v FROM public.njacc_profiles WHERE id = p_profile;
  IF v.id IS NULL THEN RAISE EXCEPTION 'NJACC_NO_PROFILE'; END IF;
  RETURN jsonb_build_object('employee_code',v.employee_code,'full_name',v.full_name,
    'department',v.department,'login_name',v.login_name,'role',v.role,'active',v.active,
    'provisioning_status',v.provisioning_status);
END $$;
REVOKE ALL ON FUNCTION public.njacc_admin_safe_profile(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.njacc_admin_safe_profile(uuid) TO service_role;

COMMIT;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- 1) เบราว์เซอร์อ่านตาราง profile ตรงไม่ได้ (ต้องได้ 0 rows)
SELECT grantee, privilege_type FROM information_schema.role_table_grants
 WHERE table_name IN ('njacc_profiles','njacc_user_access')
   AND grantee IN ('anon','authenticated');

-- 2) ไม่มี policy บน profiles/user_access สำหรับ authenticated (ต้องได้ 0 rows)
SELECT tablename, policyname, cmd FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('njacc_profiles','njacc_user_access');

-- 3) njacc_resolve_login ถูกถอนแล้ว (ต้องได้ 0)
SELECT count(*) AS resolve_login_left FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='njacc_resolve_login';

-- 4) RPC ฝั่ง server GRANT ให้ service_role เท่านั้น
SELECT routine_name, grantee FROM information_schema.routine_privileges
 WHERE routine_name IN ('njacc_auth_lookup','njacc_admin_auth_identity','njacc_admin_find_auth_user')
 ORDER BY routine_name, grantee;

-- 5) auth_identity opaque ครบทุกคน และไม่มีคำว่า 80 / ชื่อจริงอยู่ในนั้น
SELECT employee_code, login_name, role,
       (auth_identity LIKE 'njacc-auth-%') AS identity_is_opaque,
       (auth_user_id IS NOT NULL) AS linked
  FROM public.njacc_profiles ORDER BY employee_code;

-- 6) อีเมล Auth ที่ต้องมีใน Dashboard (แสดงเฉพาะใน SQL Editor)
SELECT login_name, auth_identity||'@auth.billing.local' AS auth_email
  FROM public.njacc_profiles ORDER BY employee_code;

-- 7) SECURITY DEFINER ทุกตัวมี search_path
SELECT p.proname, p.prosecdef,
       (SELECT string_agg(x,' ') FROM unnest(p.proconfig) x) AS config
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'njacc\_%' ESCAPE '\'
 ORDER BY p.proname;

-- 7b) Create User: ไม่มีโปรไฟล์ค้าง PENDING (orphan) — ถ้ามี ให้ตรวจ audit CREATE_USER_*
SELECT id, login_name, provisioning_status, provisioning_request_id,
       (auth_user_id IS NOT NULL) AS linked, created_at
  FROM public.njacc_profiles
 WHERE provisioning_status <> 'ACTIVE' OR auth_user_id IS NULL
 ORDER BY created_at;

-- 7c) RPC create-user ครบและ grant ถูกชั้น
SELECT routine_name, grantee FROM information_schema.routine_privileges
 WHERE routine_name IN ('njacc_admin_begin_user','njacc_admin_complete_user',
                        'njacc_admin_rollback_user','njacc_admin_safe_profile')
 ORDER BY routine_name, grantee;
-- Expected: begin_user → authenticated · อีก 3 ตัว → service_role เท่านั้น

-- 8) ตาราง BILLING เดิมยังอยู่ครบ ไม่ถูกแตะ (REFERENCE ONLY)
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public'
   AND table_name IN ('service_charge_records','advance_charge_records','app_users');

-- =====================================================================
-- ROLLBACK
-- =====================================================================
-- หมายเหตุ: การย้อนกลับจะเปิดช่องอ่าน internal identity อีกครั้ง — ทำเฉพาะกรณีจำเป็น
-- GRANT SELECT ON public.njacc_profiles TO authenticated;
-- CREATE POLICY njacc_profiles_self_sel ON public.njacc_profiles
--   FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
-- DROP FUNCTION IF EXISTS public.njacc_auth_lookup(text);
-- DROP FUNCTION IF EXISTS public.njacc_admin_auth_identity(uuid);
-- (ผู้ใช้เดิมที่ผูกกับอีเมลแบบเก่ายังใช้ได้ ถ้า auth.users ยังมีอีเมลนั้นอยู่)
