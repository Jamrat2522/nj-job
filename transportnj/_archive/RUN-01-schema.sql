-- ============================================================
-- TRANSPORT NJ — RUN-01 SCHEMA  (idempotent, no DO blocks, no DROP)
-- Supabase project: sytgqjglcnsabcszbngg
-- All tables prefix transport_ ; access ONLY via tnj_* RPC (RLS deny-all)
-- ============================================================

-- ---------- master ----------
CREATE TABLE IF NOT EXISTS public.transport_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  name text NOT NULL,
  contact text, phone text, address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE UNIQUE INDEX IF NOT EXISTS transport_customers_name_ux ON public.transport_customers (lower(name));

CREATE TABLE IF NOT EXISTS public.transport_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id uuid UNIQUE REFERENCES public.app_users(id),
  driver_code text,
  full_name text NOT NULL,
  phone text, license_no text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code text,
  vehicle_name text NOT NULL,
  license_plate text NOT NULL,
  vehicle_type text,
  last_mileage numeric(12,1),
  last_mileage_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE UNIQUE INDEX IF NOT EXISTS transport_vehicles_plate_ux ON public.transport_vehicles (lower(license_plate));

CREATE TABLE IF NOT EXISTS public.transport_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'OTHER' CHECK (location_type IN ('PORT','FACTORY','RETURN_YARD','OTHER')),
  address text, latitude double precision, longitude double precision,
  contact text, phone text, google_maps_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);

-- app-level role for TRANSPORT NJ (app_users.role enum is shared → not modified)
CREATE TABLE IF NOT EXISTS public.transport_user_roles (
  app_user_id uuid PRIMARY KEY REFERENCES public.app_users(id),
  tnj_role text NOT NULL CHECK (tnj_role IN ('SUPER_ADMIN','ADMIN','TRANSPORT','DRIVER','VIEWER')),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);

-- ---------- sessions / settings ----------
CREATE TABLE IF NOT EXISTS public.transport_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id uuid NOT NULL REFERENCES public.app_users(id),
  token_hash text NOT NULL UNIQUE,
  tnj_role text NOT NULL,
  driver_id uuid REFERENCES public.transport_drivers(id),
  app_version text,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '12 hours',
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS transport_sessions_user_ix ON public.transport_sessions (app_user_id);

CREATE TABLE IF NOT EXISTS public.transport_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.transport_job_seq (
  seq_date date PRIMARY KEY,
  last_no integer NOT NULL DEFAULT 0
);

-- ---------- jobs ----------
CREATE TABLE IF NOT EXISTS public.transport_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no text NOT NULL UNIQUE,
  job_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Bangkok')::date,
  customer_id uuid REFERENCES public.transport_customers(id),
  customer_name text NOT NULL,
  bl_no text NOT NULL,
  booking_no text,
  container_no text, container_size text, seal_no text,
  vehicle_id uuid REFERENCES public.transport_vehicles(id),
  vehicle_name text, license_plate text,
  driver_id uuid REFERENCES public.transport_drivers(id),
  driver_name text,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','ASSIGNED','ACCEPTED','GOING_TO_PICKUP','ARRIVED_PICKUP','CONTAINER_PICKED_UP','GOING_TO_FACTORY','ARRIVED_FACTORY','LEAVING_FACTORY','GOING_TO_RETURN','ARRIVED_RETURN','CONTAINER_RETURNED','COMPLETED','PROBLEM','CANCELLED')),
  problem_prev_status text,
  problem_flag boolean NOT NULL DEFAULT false,
  -- pickup
  pickup_location_id uuid REFERENCES public.transport_locations(id),
  pickup_location_text text NOT NULL,
  pickup_date date NOT NULL, pickup_time time NOT NULL, pickup_note text,
  -- factory
  factory_location_id uuid REFERENCES public.transport_locations(id),
  factory_location_text text NOT NULL,
  factory_date date, factory_time time, factory_contact text, factory_phone text, factory_note text,
  -- return
  return_location_id uuid REFERENCES public.transport_locations(id),
  return_location_text text NOT NULL,
  return_date date NOT NULL, return_time time NOT NULL, return_note text,
  job_note text,
  assigned_at timestamptz, assigned_by uuid,
  accepted_at timestamptz, accepted_lat double precision, accepted_lng double precision,
  completed_at timestamptz, completed_by uuid,
  cancelled_at timestamptz, cancelled_by uuid, cancel_reason text,
  last_gps_at timestamptz, last_lat double precision, last_lng double precision, last_speed double precision,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE INDEX IF NOT EXISTS transport_jobs_date_ix   ON public.transport_jobs (job_date DESC);
CREATE INDEX IF NOT EXISTS transport_jobs_driver_ix ON public.transport_jobs (driver_id, status);
CREATE INDEX IF NOT EXISTS transport_jobs_status_ix ON public.transport_jobs (status);

CREATE TABLE IF NOT EXISTS public.transport_job_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.transport_jobs(id),
  seq integer NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('STATUS','MILEAGE','FUEL','PROBLEM','FILE','NOTE','SYSTEM')),
  status text,
  title text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid, actor_name text, actor_role text,
  latitude double precision, longitude double precision, accuracy double precision,
  note text,
  problem_type text, problem_detail text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE INDEX IF NOT EXISTS transport_job_timeline_job_ix ON public.transport_job_timeline (job_id, seq);

CREATE TABLE IF NOT EXISTS public.transport_job_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.transport_jobs(id),
  timeline_id uuid REFERENCES public.transport_job_timeline(id),
  file_type text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text, size_bytes bigint,
  uploaded_by uuid, uploaded_by_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE INDEX IF NOT EXISTS transport_job_files_job_ix ON public.transport_job_files (job_id);

CREATE TABLE IF NOT EXISTS public.transport_gps_logs (
  id bigserial PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.transport_jobs(id),
  driver_id uuid NOT NULL REFERENCES public.transport_drivers(id),
  vehicle_id uuid REFERENCES public.transport_vehicles(id),
  latitude double precision NOT NULL, longitude double precision NOT NULL,
  accuracy double precision, speed double precision, heading double precision,
  recorded_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transport_gps_logs_job_ix ON public.transport_gps_logs (job_id, recorded_at);
CREATE INDEX IF NOT EXISTS transport_gps_logs_vehicle_ix ON public.transport_gps_logs (vehicle_id, recorded_at);

CREATE TABLE IF NOT EXISTS public.transport_job_mileage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.transport_jobs(id),
  vehicle_id uuid REFERENCES public.transport_vehicles(id),
  driver_id uuid REFERENCES public.transport_drivers(id),
  start_mileage numeric(12,1), start_mileage_image uuid,
  start_latitude double precision, start_longitude double precision, start_at timestamptz,
  end_mileage numeric(12,1), end_mileage_image uuid,
  end_latitude double precision, end_longitude double precision, end_at timestamptz,
  total_distance numeric(12,1),
  status text NOT NULL DEFAULT 'OPEN',
  warning_flag boolean NOT NULL DEFAULT false, warning_note text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.transport_fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.transport_jobs(id),
  vehicle_id uuid REFERENCES public.transport_vehicles(id),
  driver_id uuid REFERENCES public.transport_drivers(id),
  fuel_date timestamptz NOT NULL DEFAULT now(),
  fuel_station text, fuel_type text,
  mileage numeric(12,1),
  liters numeric(10,2) NOT NULL CHECK (liters > 0),
  price_per_liter numeric(10,2) NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric(12,2) NOT NULL,
  receipt_no text, receipt_file uuid,
  latitude double precision, longitude double precision,
  note text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid
);
CREATE INDEX IF NOT EXISTS transport_fuel_logs_job_ix ON public.transport_fuel_logs (job_id);

CREATE TABLE IF NOT EXISTS public.transport_audit_logs (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id text NOT NULL,
  job_id uuid,
  action text NOT NULL,
  field text,
  old_value text, new_value text,
  user_id uuid, user_name text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transport_audit_logs_job_ix ON public.transport_audit_logs (job_id, changed_at);

-- ---------- RLS: deny-all (no policies) ; access only via SECURITY DEFINER RPC ----------
ALTER TABLE public.transport_customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_drivers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_user_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_job_seq      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_job_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_job_files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_gps_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_job_mileage  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_fuel_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_audit_logs   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.transport_customers, public.transport_drivers, public.transport_vehicles,
  public.transport_locations, public.transport_user_roles, public.transport_sessions,
  public.transport_settings, public.transport_job_seq, public.transport_jobs,
  public.transport_job_timeline, public.transport_job_files, public.transport_gps_logs,
  public.transport_job_mileage, public.transport_fuel_logs, public.transport_audit_logs
  FROM anon, authenticated;

-- ---------- report view (used only inside RPC) ----------
CREATE OR REPLACE VIEW public.v_transport_job_report AS
SELECT j.id AS job_id, j.job_no, j.job_date, j.bl_no, j.customer_id, j.customer_name, j.container_no,
       j.vehicle_id, j.vehicle_name, j.license_plate, j.driver_id, j.driver_name, j.status, j.problem_flag,
       j.pickup_location_text, j.factory_location_text, j.return_location_text,
       m.id AS mileage_id, m.start_mileage, m.end_mileage, m.total_distance, m.warning_flag, m.start_at, m.end_at,
       f.fuel_liters, f.fuel_amount,
       CASE WHEN COALESCE(m.total_distance,0) > 0 AND COALESCE(f.fuel_liters,0) > 0
            THEN round(m.total_distance / f.fuel_liters, 2) ELSE NULL END AS km_per_liter,
       CASE
         WHEN m.start_mileage IS NULL AND j.status = 'COMPLETED' THEN 'ข้อมูลไม่ครบ'
         WHEN m.start_mileage IS NULL THEN 'รอบันทึกไมล์ก่อน'
         WHEN m.end_mileage IS NULL AND j.status = 'COMPLETED' THEN 'ข้อมูลไม่ครบ'
         WHEN m.end_mileage IS NULL AND j.status = 'CONTAINER_RETURNED' THEN 'รอบันทึกไมล์หลัง'
         WHEN m.end_mileage IS NULL THEN 'กำลังวิ่งงาน'
         WHEN m.warning_flag THEN 'ตรวจสอบ'
         WHEN j.status = 'COMPLETED' THEN 'ปิดงานแล้ว'
         ELSE 'รอบันทึกไมล์หลัง' END AS mileage_status,
       (j.status = 'COMPLETED' AND (m.start_mileage IS NULL OR m.end_mileage IS NULL)) AS incomplete_flag
FROM public.transport_jobs j
LEFT JOIN public.transport_job_mileage m ON m.job_id = j.id
LEFT JOIN LATERAL (
  SELECT sum(liters) AS fuel_liters, sum(total_amount) AS fuel_amount
  FROM public.transport_fuel_logs fl WHERE fl.job_id = j.id AND fl.is_deleted = false
) f ON true;
REVOKE ALL ON public.v_transport_job_report FROM anon, authenticated;
