-- ============================================================
-- TRANSPORT NJ — RUN-03 SEED (settings / release / storage bucket) — idempotent, no business data
-- ============================================================

-- app settings
INSERT INTO public.transport_settings(key, value) VALUES ('gps_interval_sec', '30') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.transport_settings(key, value) VALUES ('gps_stale_min', '5') ON CONFLICT (key) DO NOTHING;

-- centralized deployment version (shared source for Version / Maintenance / timers)
INSERT INTO public.system_settings(key, value, category, is_public, updated_by)
VALUES ('transportnj_release', '{"version":"local101","note":"initial release","maintenance":{"active":false}}'::jsonb, 'transportnj', false, 'tnj-seed')
ON CONFLICT (key) DO NOTHING;

-- private storage bucket (access only through Edge Function transportnj-files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('transportnj', 'transportnj', false, 20971520,
  ARRAY['application/pdf','image/jpeg','image/png','application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- master locations (ท่า/ลาน ที่ใช้ประจำ — แก้ไขได้ในเมนู สถานที่)
INSERT INTO public.transport_locations(name, location_type, address, google_maps_url)
SELECT 'ท่าเรือแหลมฉบัง', 'PORT', 'ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', 'https://maps.google.com/?q=Laem+Chabang+Port'
WHERE NOT EXISTS (SELECT 1 FROM public.transport_locations WHERE name = 'ท่าเรือแหลมฉบัง');
INSERT INTO public.transport_locations(name, location_type, address, google_maps_url)
SELECT 'ท่าเรือกรุงเทพ (คลองเตย)', 'PORT', 'ถ.อาจณรงค์ คลองเตย กรุงเทพฯ', 'https://maps.google.com/?q=Bangkok+Port+Klong+Toey'
WHERE NOT EXISTS (SELECT 1 FROM public.transport_locations WHERE name = 'ท่าเรือกรุงเทพ (คลองเตย)');
INSERT INTO public.transport_locations(name, location_type, address, google_maps_url)
SELECT 'ลาดกระบัง ICD', 'RETURN_YARD', 'ถ.เจ้าคุณทหาร ลาดกระบัง กรุงเทพฯ', 'https://maps.google.com/?q=Lat+Krabang+ICD'
WHERE NOT EXISTS (SELECT 1 FROM public.transport_locations WHERE name = 'ลาดกระบัง ICD');
