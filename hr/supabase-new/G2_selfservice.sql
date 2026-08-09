-- ═══════════════════════════════════════════════════════════════════
--  G2_selfservice.sql — Employee Self Service (Migration)
--  Build: NJ HR V2
--
--  ทำ 8 อย่าง ไม่มีมากกว่านี้:
--    1) ALTER TABLE employees ADD COLUMN emergency_phone text   (nullable)
--    2) CREATE  njhr_me_guard(p_token)        — บริบทผู้ใช้ + employee_id ของตนเอง
--    3) CREATE  njhr_me_get(p_token)          — อ่าน Employee ตัวเอง + สรุปความครบถ้วน
--    4) CREATE  njhr_me_save(p_token, jsonb)  — บันทึกเฉพาะ 7 field (Allowlist)
--    5) REPLACE njhr_empfile_guard            — ให้เจ้าของเขียนเอกสารตัวเองได้
--    6) REPLACE njhr_empfile_upload_path      — เจ้าของอัปโหลดได้เฉพาะ PERSONAL
--    7) REPLACE njhr_empfile_save             — เจ้าของบันทึกได้เฉพาะ PERSONAL
--    8) REPLACE njhr_empfile_list             — perm.can_write สะท้อนสิทธิ์เจ้าของ
--
--  ข้อ 5–8 คัดลอกเนื้อในของจริงจาก DB (ดึงด้วย pg_get_functiondef เมื่อ 2026-08-08)
--  มาทั้งดุ้น แล้วแก้เฉพาะบรรทัดที่เกี่ยวกับสิทธิ์เท่านั้น
--  ตรรกะเดิม (versioning · audit · soft delete · ตั้งชื่อ path) ไม่ถูกแตะ
--
--  ไม่ทำ:
--    · ไม่สร้างตาราง verification · ไม่มี status / submitted / locked / ปุ่มส่งตรวจ
--    · ไม่แตะ Payroll / REPORT ALL / Settings / Users / Departments / Shifts / SSO
--    · ไม่แก้ enum user_role · ไม่ลดสิทธิ์ ADMIN ทั้งระบบ
--    · ไม่แตะ RLS policy ใด ๆ (nj_v6_anon_all / njhr_sig_no_public แยกเป็นงานต่างหาก)
--    · ไม่แตะ njhr_empfile_delete (ลบยังเป็น SUPER_ADMIN เท่านั้นตามเดิม)
--    · ไม่แตะ njhr_empfile_access (สิทธิ์อ่านผ่าน guard อยู่แล้ว)
--
--  รันทั้งไฟล์ครั้งเดียว · idempotent (รันซ้ำได้ ผลเหมือนเดิม)
--  statement สุดท้ายเป็น Verification คืน JSON — Supabase จะแสดงผลก้อนนั้น
-- ═══════════════════════════════════════════════════════════════════


-- ─── PREFLIGHT: ของที่ต้องมีอยู่ก่อน ───────────────────────────────
do $$
begin
  if to_regclass('public.employees') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง public.employees';
  end if;
  if to_regclass('public.njhr_emp_files') is null then
    raise exception 'PREFLIGHT: ไม่พบตาราง public.njhr_emp_files — รัน 73_emp_files.sql ก่อน';
  end if;
  -- to_regprocedure รับ signature พร้อมชนิดพารามิเตอร์ได้ (to_regproc รับได้แค่ชื่อ)
  if to_regprocedure('public.njhr_ctx(text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_ctx — รัน 41_leave_rpc.sql ก่อน';
  end if;
  if to_regprocedure('public.njhr_norm_role(text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_norm_role';
  end if;
  if to_regprocedure('public.njhr_empfile_kind_ok(text,text)') is null then
    raise exception 'PREFLIGHT: ไม่พบ njhr_empfile_kind_ok';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'njhr_audit_write') then
    raise exception 'PREFLIGHT: ไม่พบ njhr_audit_write — รัน 42_core_migration.sql ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน';
end $$;


-- ═══ 1) คอลัมน์ใหม่: เบอร์โทรติดต่อฉุกเฉิน ═══════════════════════
--   nullable · ไม่มี default · ไม่แตะข้อมูลเดิมของพนักงาน 108 คน
alter table public.employees add column if not exists emergency_phone text;

comment on column public.employees.emergency_phone is
  'เบอร์โทรติดต่อฉุกเฉิน — พนักงานกรอกเองผ่าน Self Service (njhr_me_save)';


-- ═══ 2) njhr_me_guard — บริบทของ "ตัวเอง" ════════════════════════
--   ต่างจาก njhr_emp_guard ตรงที่ไม่ต้องมีสิทธิ์บริหารใด ๆ
--   ขอแค่ session ใช้ได้ และบัญชีนี้ผูกกับพนักงานจริง
--
--   self_role = การ Normalize สำหรับ Self Service เท่านั้น (ไม่แตะ enum เดิม)
--     EMPLOYEE / HR / ACCOUNT / อื่น ๆ → USER
--     MANAGER / ADMIN                  → ADMIN
--     SUPER_ADMIN                      → SUPER_ADMIN
--   หมายเหตุ: njhr_norm_role แปลง 'USER'/'user'/'STAFF' → 'EMPLOYEE' มาก่อนแล้ว
create or replace function public.njhr_me_guard(p_token text)
returns table (app_user_id uuid, username text, role text, self_role text,
               employee_id uuid, emp_name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record;
begin
  select * into c from public.njhr_ctx(p_token);

  if c.employee_id is null then
    raise exception 'บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลพนักงาน กรุณาติดต่อผู้ดูแลระบบ'
      using errcode = '28000';
  end if;
  if not exists (select 1 from public.employees e where e.id = c.employee_id) then
    raise exception 'ไม่พบข้อมูลพนักงานที่ผูกกับบัญชีนี้' using errcode = 'P0002';
  end if;

  return query select c.app_user_id, c.username, c.role,
    case c.role
      when 'SUPER_ADMIN' then 'SUPER_ADMIN'
      when 'ADMIN'       then 'ADMIN'
      when 'MANAGER'     then 'ADMIN'
      else 'USER'
    end,
    c.employee_id, c.emp_name;
end $$;

comment on function public.njhr_me_guard(text) is
  'Self Service: บริบทผู้ใช้ + employee_id ของตนเอง — ไม่ต้องมีสิทธิ์บริหาร';


-- ═══ 3) njhr_me_get — อ่าน Employee ของตัวเอง 1 คน ═══════════════
--   Scope ที่ Query ตั้งแต่ต้น: where e.id = c.employee_id เท่านั้น
--   ไม่มีทางดึงพนักงานคนอื่น เพราะ employee_id มาจาก token ไม่ใช่จาก browser
--   ไม่คืนข้อมูลเงินเดือน / บัญชีธนาคาร / ประกันสังคม เลยแม้แต่ field เดียว
create or replace function public.njhr_me_get(p_token text)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record;
        v_missing jsonb := '[]'::jsonb;
        v_docs jsonb; v_missing_docs jsonb;
        v_personal_ok boolean; v_docs_ok boolean;
begin
  select * into c from public.njhr_me_guard(p_token);
  select * into e from public.employees emp where emp.id = c.employee_id;

  -- ---- ตรวจความครบถ้วนของ 7 ช่อง (ตัดช่องว่างก่อนตรวจ) ----
  if coalesce(btrim(e.nickname),'')        = '' then v_missing := v_missing || jsonb_build_object('field','nickname',        'label','ชื่อเล่น'); end if;
  if e.birth_date is null                       then v_missing := v_missing || jsonb_build_object('field','birth_date',      'label','วันเกิด'); end if;
  if coalesce(btrim(e.national_id),'')     = '' then v_missing := v_missing || jsonb_build_object('field','national_id',     'label','เลขบัตรประชาชน'); end if;
  if coalesce(btrim(e.phone),'')           = '' then v_missing := v_missing || jsonb_build_object('field','phone',           'label','เบอร์โทร'); end if;
  if coalesce(btrim(e.email),'')           = '' then v_missing := v_missing || jsonb_build_object('field','email',           'label','อีเมล'); end if;
  if coalesce(btrim(e.address),'')         = '' then v_missing := v_missing || jsonb_build_object('field','address',         'label','ที่อยู่'); end if;
  if coalesce(btrim(e.emergency_phone),'') = '' then v_missing := v_missing || jsonb_build_object('field','emergency_phone', 'label','เบอร์โทรติดต่อฉุกเฉิน'); end if;
  v_personal_ok := (jsonb_array_length(v_missing) = 0);

  -- ---- เอกสารบังคับ 3 รายการ (PERSONAL) ----
  --      ใช้ doc_kind จริงที่ njhr_empfile_kind_ok อนุญาตอยู่แล้ว ไม่สร้างประเภทใหม่
  select jsonb_agg(jsonb_build_object(
           'doc_kind', r.kind, 'label', r.label,
           'uploaded', (f.id is not null),
           'file', case when f.id is null then null else jsonb_build_object(
             'id', f.id, 'file_name', f.file_name, 'mime_type', coalesce(f.mime_type,''),
             'file_size', f.file_size, 'version', f.version,
             'uploaded_at', f.uploaded_at, 'updated_at', f.updated_at) end)
         order by r.ord)
    into v_docs
    from (values (1,'ID_CARD','บัตรประชาชน'),
                 (2,'HOUSE_REG','ทะเบียนบ้าน'),
                 (3,'EDUCATION','วุฒิการศึกษา')) r(ord, kind, label)
    left join lateral (
      select x.* from public.njhr_emp_files x
       where x.employee_id = c.employee_id and x.category = 'PERSONAL'
         and x.doc_kind = r.kind and x.deleted_at is null
       order by x.uploaded_at desc limit 1) f on true;

  select coalesce(jsonb_agg(d->>'label' order by d->>'label'), '[]'::jsonb)
    into v_missing_docs
    from jsonb_array_elements(v_docs) d
   where (d->>'uploaded')::boolean is not true;
  v_docs_ok := (jsonb_array_length(v_missing_docs) = 0);

  return query select jsonb_build_object(
    'perm', jsonb_build_object(
      'role', c.role, 'self_role', c.self_role, 'username', c.username,
      'can_edit_personal', true,
      'editable_fields', jsonb_build_array('nickname','birth_date','national_id',
                                           'phone','email','address','emergency_phone')),

    -- ข้อมูลบริษัท = แสดงได้ แต่แก้ไม่ได้ (ไม่มีทางบันทึกกลับผ่าน njhr_me_save)
    'employee', jsonb_build_object(
      'id', e.id, 'emp_code', e.emp_code, 'photo_url', e.photo_url,
      'prefix', coalesce(e.prefix,''),
      'first_name', e.first_name, 'last_name', e.last_name,
      'first_name_en', coalesce(e.first_name_en,''), 'last_name_en', coalesce(e.last_name_en,''),
      'full_name', coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
      'department_name', coalesce(e.department_name,''),
      'position_name', coalesce(e.position_name,''),
      'level', coalesce(e.level,''),
      'start_date', e.start_date, 'emp_type', coalesce(e.emp_type,''),
      'status', e.status::text,
      'work_start', e.work_start, 'work_end', e.work_end,
      -- 7 ช่องที่แก้ได้
      'nickname', coalesce(e.nickname,''), 'birth_date', e.birth_date,
      'national_id', coalesce(e.national_id,''), 'phone', coalesce(e.phone,''),
      'email', coalesce(e.email,''), 'address', coalesce(e.address,''),
      'emergency_phone', coalesce(e.emergency_phone,'')),

    'personal', jsonb_build_object(
      'complete', v_personal_ok,
      'filled', 7 - jsonb_array_length(v_missing), 'total', 7,
      'missing', v_missing),

    'documents', jsonb_build_object(
      'complete', v_docs_ok,
      'filled', 3 - jsonb_array_length(v_missing_docs), 'total', 3,
      'missing', v_missing_docs,
      'items', coalesce(v_docs, '[]'::jsonb)),

    'overall_complete', (v_personal_ok and v_docs_ok)
  );
end $$;

comment on function public.njhr_me_get(text) is
  'Self Service: อ่าน Employee ของตนเอง 1 คน + สรุปความครบถ้วน 7 ช่อง / 3 เอกสาร';


-- ═══ 4) njhr_me_save — บันทึกเฉพาะ 7 field (Allowlist) ═══════════
--   · รับเฉพาะ key ที่อยู่ใน Allowlist · key อื่นถูกทิ้งทั้งหมดฝั่งเซิร์ฟเวอร์
--     (ส่ง base_salary / role / department_id / status / emp_code มาก็ไม่มีผล)
--   · เขียนได้เฉพาะแถวของ c.employee_id เท่านั้น — ไม่รับ p_id จาก browser
--   · บันทึกบางส่วนได้ (ยังไม่ครบก็บันทึกไว้ก่อนได้) แต่ถ้ากรอกมาแล้วต้องถูก Format
create or replace function public.njhr_me_save(p_token text, p_data jsonb)
returns table (data jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; oldrow jsonb;
        v_nick text; v_birth date; v_nid text; v_phone text;
        v_mail text; v_addr text; v_emg text;
        v_birth_raw text;
begin
  select * into c from public.njhr_me_guard(p_token);

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'ข้อมูลไม่ถูกต้อง' using errcode = '22023';
  end if;

  -- ---- ALLOWLIST: อ่านได้แค่ 7 key นี้เท่านั้น ----
  v_nick      := nullif(btrim(coalesce(p_data->>'nickname','')), '');
  v_birth_raw := nullif(btrim(coalesce(p_data->>'birth_date','')), '');
  v_nid       := nullif(btrim(coalesce(p_data->>'national_id','')), '');
  v_phone     := nullif(btrim(coalesce(p_data->>'phone','')), '');
  v_mail      := nullif(lower(btrim(coalesce(p_data->>'email',''))), '');
  v_addr      := nullif(btrim(coalesce(p_data->>'address','')), '');
  v_emg       := nullif(btrim(coalesce(p_data->>'emergency_phone','')), '');

  -- ---- ตรวจ Format เฉพาะช่องที่กรอกมา (เว้นว่าง = ยังไม่กรอก บันทึกไว้ก่อนได้) ----
  if v_birth_raw is not null then
    begin
      v_birth := v_birth_raw::date;
    exception when others then
      raise exception 'รูปแบบวันเกิดไม่ถูกต้อง' using errcode = '22023';
    end;
    if v_birth > current_date then
      raise exception 'วันเกิดต้องไม่เป็นวันในอนาคต' using errcode = '22023';
    end if;
  end if;

  -- เลขบัตรประชาชน: ใช้กฎเดียวกับ njhr_emp_save ทุกตัวอักษร
  if v_nid is not null and v_nid !~ '^[0-9]{13}$' then
    raise exception 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' using errcode = '22023';
  end if;
  if v_nid is not null and exists (
       select 1 from public.employees x
        where x.national_id = v_nid and x.id <> c.employee_id) then
    raise exception 'เลขบัตรประชาชนนี้ถูกใช้ไปแล้ว' using errcode = '23505';
  end if;

  -- อีเมล: ใช้ regex เดียวกับ njhr_emp_save ทุกตัวอักษร
  if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'รูปแบบอีเมลไม่ถูกต้อง' using errcode = '22023';
  end if;
  if v_mail is not null and exists (
       select 1 from public.employees x
        where lower(x.email) = v_mail and x.id <> c.employee_id) then
    raise exception 'อีเมล % ถูกใช้ไปแล้ว', v_mail using errcode = '23505';
  end if;

  select to_jsonb(x) into oldrow from public.employees x where x.id = c.employee_id;

  -- ---- UPDATE เฉพาะ 7 คอลัมน์ · ผูกด้วย c.employee_id จาก token ----
  update public.employees
     set nickname        = v_nick,
         birth_date      = v_birth,
         national_id     = v_nid,
         phone           = v_phone,
         email           = v_mail,
         address         = v_addr,
         emergency_phone = v_emg,
         updated_at      = now()
   where employees.id = c.employee_id;

  perform public.njhr_audit_write(p_token, 'ME_PROFILE_EDIT', 'employee', 'employees',
    c.employee_id::text, 'พนักงานแก้ไขข้อมูลส่วนตัวของตนเอง (7 ช่อง)',
    oldrow, (select to_jsonb(x) from public.employees x where x.id = c.employee_id), null);

  -- คืนสถานะล่าสุดชุดเดียวกับ njhr_me_get เพื่อให้หน้าจออัปเดตได้ทันทีโดยไม่ต้องยิงซ้ำ
  return query select d.data from public.njhr_me_get(p_token) d;
end $$;

comment on function public.njhr_me_save(text, jsonb) is
  'Self Service: บันทึกเฉพาะ 7 field (nickname, birth_date, national_id, phone, email, address, emergency_phone) — key อื่นถูกทิ้งทั้งหมด';


-- ═══ 5) njhr_empfile_guard — ให้เจ้าของเขียนเอกสารตัวเองได้ ═══════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · แก้เฉพาะเงื่อนไข p_write
--   Signature และคอลัมน์ที่คืน เหมือนเดิมทุกตัว → ผู้เรียกเดิมไม่กระทบ
--   is_manager ยังหมายถึง "สิทธิ์บริหาร" เหมือนเดิม (ใช้กรอง hr_docs ใน list)
--   can_delete ยังเป็น SUPER_ADMIN เท่านั้นเหมือนเดิม
create or replace function public.njhr_empfile_guard(
  p_token text, p_employee uuid, p_write boolean default false)
returns table (app_user_id uuid, username text, role text, employee_id uuid,
               is_manager boolean, can_delete boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_mgr boolean; v_own boolean;
begin
  select * into c from public.njhr_ctx(p_token);
  v_mgr := c.role in ('SUPER_ADMIN','ADMIN','HR');
  -- เจ้าของ = บัญชีนี้ผูกกับพนักงานคนนี้จริง (employee_id มาจาก token ไม่ใช่ browser)
  v_own := (c.employee_id is not null and p_employee is not null and p_employee = c.employee_id);

  if p_write and not (v_mgr or v_own) then
    raise exception 'คุณไม่มีสิทธิ์จัดการเอกสารพนักงาน' using errcode = '42501';
  end if;
  if not (v_mgr or v_own) then
    raise exception 'คุณดูได้เฉพาะเอกสารของตนเองเท่านั้น' using errcode = '42501';
  end if;

  return query select c.app_user_id, c.username, c.role, c.employee_id,
                      v_mgr, (c.role = 'SUPER_ADMIN');
end $$;


-- ═══ 6) njhr_empfile_upload_path — เจ้าของอัปโหลดได้เฉพาะ PERSONAL ═
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · เพิ่มการกัน 1 บล็อกเท่านั้น
--   เหตุผล: หมวด COMPANY คือเอกสารที่บริษัทออกให้ (สัญญาจ้าง หนังสือเตือน หนังสือพักงาน)
--           พนักงานต้องอัปโหลดเองไม่ได้เด็ดขาด
create or replace function public.njhr_empfile_upload_path(
  p_token text, p_employee uuid, p_category text, p_doc_kind text, p_file_name text)
returns table (storage_path text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_cat text := upper(btrim(coalesce(p_category,'')));
        v_kind text := upper(btrim(coalesce(p_doc_kind,'')));
        v_ext text; v_stem text;
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, true);

  -- เพิ่มใหม่: ผู้ที่ไม่มีสิทธิ์บริหาร (= เจ้าของเอกสาร) อัปโหลดได้เฉพาะหมวด PERSONAL
  if not c.is_manager and v_cat <> 'PERSONAL' then
    raise exception 'คุณอัปโหลดได้เฉพาะเอกสารส่วนตัวของตนเองเท่านั้น' using errcode = '42501';
  end if;

  if not public.njhr_empfile_kind_ok(v_cat, v_kind) then
    raise exception 'หมวดเอกสารไม่ถูกต้อง (%/%)', v_cat, v_kind using errcode = '22023';
  end if;
  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode = 'P0002';
  end if;

  v_ext  := lower(coalesce((regexp_match(coalesce(p_file_name,''), '(\.[A-Za-z0-9]{1,8})$'))[1], ''));
  v_stem := left(regexp_replace(regexp_replace(coalesce(p_file_name,'file'), '\.[^.]*$', ''),
                                '[^A-Za-z0-9ก-๙_-]+', '_', 'g'), 40);
  if btrim(coalesce(v_stem,'')) = '' then v_stem := 'file'; end if;

  return query select p_employee::text || '/' || lower(v_cat) || '/' || lower(v_kind) || '/' ||
                      to_char(now() at time zone 'Asia/Bangkok', 'YYYYMMDDHH24MISS') || '-' ||
                      replace(gen_random_uuid()::text, '-', '') || '-' || v_stem || v_ext;
end $$;


-- ═══ 7) njhr_empfile_save — เจ้าของบันทึกได้เฉพาะ PERSONAL ════════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · เพิ่มการกัน 2 บล็อก
--   versioning / audit / ตรวจวันหมดอายุ / การย้ายไฟล์เก่าเข้าประวัติ — เหมือนเดิมทุกบรรทัด
create or replace function public.njhr_empfile_save(
  p_token text, p_employee uuid, p_category text, p_doc_kind text,
  p_file jsonb default null, p_id uuid default null,
  p_document_date date default null, p_expiry_date date default null,
  p_note text default null)
returns table (id uuid, version integer)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; old record; v_cat text := upper(btrim(coalesce(p_category,'')));
        v_kind text := upper(btrim(coalesce(p_doc_kind,''))); v_id uuid; v_ver int;
        v_path text := btrim(coalesce(p_file->>'path',''));
        v_name text := btrim(coalesce(p_file->>'name',''));
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, true);

  -- เพิ่มใหม่: เจ้าของเอกสารบันทึกได้เฉพาะหมวด PERSONAL
  if not c.is_manager and v_cat <> 'PERSONAL' then
    raise exception 'คุณบันทึกได้เฉพาะเอกสารส่วนตัวของตนเองเท่านั้น' using errcode = '42501';
  end if;

  if not exists (select 1 from public.employees e where e.id = p_employee) then
    raise exception 'ไม่พบพนักงานรายนี้' using errcode = 'P0002';
  end if;
  if not public.njhr_empfile_kind_ok(v_cat, v_kind) then
    raise exception 'หมวดเอกสารไม่ถูกต้อง (%/%)', v_cat, v_kind using errcode = '22023';
  end if;
  if p_expiry_date is not null and p_document_date is not null
     and p_expiry_date < p_document_date then
    raise exception 'วันที่หมดอายุต้องไม่น้อยกว่าวันที่ออกเอกสาร' using errcode = '22023';
  end if;

  -- เพิ่มใหม่
  if p_id is null then
    if v_path = '' or v_name = '' then
      raise exception 'กรุณาแนบไฟล์' using errcode = '22023';
    end if;
    insert into public.njhr_emp_files(
      employee_id, category, doc_kind, file_name, storage_path, mime_type, file_size,
      document_date, expiry_date, note, uploaded_by)
    values (p_employee, v_cat, v_kind, v_name, v_path,
            nullif(p_file->>'mime',''), nullif(p_file->>'size','')::bigint,
            p_document_date, p_expiry_date, nullif(btrim(coalesce(p_note,'')),''), c.username)
    returning njhr_emp_files.id, njhr_emp_files.version into v_id, v_ver;

    perform public.njhr_audit_write(p_token, 'EMPFILE_ADD', 'employee', 'njhr_emp_files',
      v_id::text, v_cat || '/' || v_kind || ' · ' || v_name, null,
      (select to_jsonb(x) from public.njhr_emp_files x where x.id = v_id), null);

    return query select v_id, v_ver;
    return;
  end if;

  -- แก้ไข / เปลี่ยนไฟล์
  select * into old from public.njhr_emp_files
   where njhr_emp_files.id = p_id and deleted_at is null;
  if not found then
    raise exception 'ไม่พบเอกสารนี้ หรือถูกลบไปแล้ว' using errcode = 'P0002';
  end if;
  if old.employee_id <> p_employee then
    raise exception 'เอกสารนี้ไม่ได้เป็นของพนักงานรายที่เลือก' using errcode = '42501';
  end if;
  -- เพิ่มใหม่: เจ้าของแก้เอกสารหมวด COMPANY ที่บริษัทออกให้ไม่ได้
  if not c.is_manager and old.category <> 'PERSONAL' then
    raise exception 'คุณแก้ไขได้เฉพาะเอกสารส่วนตัวของตนเองเท่านั้น' using errcode = '42501';
  end if;

  if v_path <> '' and v_path <> old.storage_path then
    -- เก็บไฟล์เดิมไว้ในประวัติก่อนเสมอ (ไม่ทำลายของเดิม)
    insert into public.njhr_emp_file_versions(
      file_id, version, file_name, storage_path, mime_type, file_size, replaced_by)
    values (old.id, old.version, old.file_name, old.storage_path,
            old.mime_type, old.file_size, c.username);
    update public.njhr_emp_files
       set file_name = v_name, storage_path = v_path,
           mime_type = nullif(p_file->>'mime',''),
           file_size = nullif(p_file->>'size','')::bigint,
           version = old.version + 1,
           category = v_cat, doc_kind = v_kind,
           document_date = p_document_date, expiry_date = p_expiry_date,
           note = nullif(btrim(coalesce(p_note,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_emp_files.id = p_id;
  else
    update public.njhr_emp_files
       set category = v_cat, doc_kind = v_kind,
           document_date = p_document_date, expiry_date = p_expiry_date,
           note = nullif(btrim(coalesce(p_note,'')),''),
           updated_at = now(), updated_by = c.username
     where njhr_emp_files.id = p_id;
  end if;

  perform public.njhr_audit_write(p_token, 'EMPFILE_EDIT', 'employee', 'njhr_emp_files',
    p_id::text, v_cat || '/' || v_kind || ' · ' || coalesce(nullif(v_name,''), old.file_name),
    to_jsonb(old), (select to_jsonb(x) from public.njhr_emp_files x where x.id = p_id), null);

  return query select f.id, f.version from public.njhr_emp_files f where f.id = p_id;
end $$;


-- ═══ 8) njhr_empfile_list — perm.can_write สะท้อนสิทธิ์เจ้าของ ════
--   คัดลอกของจริงจาก DB มาทั้งดุ้น · แก้บรรทัดเดียวคือ can_write
--   ตัวกรอง hr_docs ยังใช้ c.is_manager เหมือนเดิม (พนักงานยังเห็นเฉพาะที่ออกให้แล้ว)
create or replace function public.njhr_empfile_list(p_token text, p_employee uuid)
returns table (data jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c record; v_own boolean;
begin
  select * into c from public.njhr_empfile_guard(p_token, p_employee, false);
  v_own := (c.employee_id is not null and c.employee_id = p_employee);

  return query
  select jsonb_build_object(
    'employee', (
      select jsonb_build_object(
        'id', e.id, 'emp_code', e.emp_code,
        'full_name', coalesce(e.prefix,'') || e.first_name || ' ' || coalesce(e.last_name,''),
        'department_name', coalesce(e.department_name,''),
        'position_name', coalesce(e.position_name,''),
        'status', e.status::text)
        from public.employees e where e.id = p_employee),
    'perm', jsonb_build_object(
      'role', c.role,
      'can_write', (c.is_manager or v_own),      -- แก้ไขบรรทัดนี้บรรทัดเดียว
      'can_delete', c.can_delete,
      'is_manager', c.is_manager,
      'is_owner', v_own),
    'files', coalesce((
      select jsonb_agg(x order by x->>'uploaded_at' desc) from (
        select jsonb_build_object(
          'id', f.id, 'category', f.category, 'doc_kind', f.doc_kind,
          'file_name', f.file_name, 'mime_type', coalesce(f.mime_type,''),
          'file_size', f.file_size, 'version', f.version,
          'document_date', f.document_date, 'expiry_date', f.expiry_date,
          'note', coalesce(f.note,''),
          'uploaded_by', f.uploaded_by, 'uploaded_at', f.uploaded_at,
          'updated_by', coalesce(f.updated_by,''), 'updated_at', f.updated_at) x
          from public.njhr_emp_files f
         where f.employee_id = p_employee and f.deleted_at is null) s), '[]'::jsonb),
    'hr_docs', coalesce((
      select jsonb_agg(y order by y->>'issued_at' desc) from (
        select jsonb_build_object(
          'id', d.id, 'doc_no', d.doc_no, 'version', d.version,
          'doc_type', d.doc_type, 'title', d.title,
          'issued_at', d.issued_at, 'effective_date', d.effective_date,
          'status', d.status, 'issued_by', coalesce(d.issued_by,'')) y
          from public.njhr_emp_documents d
         where d.employee_id = p_employee
           and d.deleted_at is null
           and (c.is_manager or d.status in
                ('SENT','VIEWED','ACKNOWLEDGED','SIGNED','REJECTED','ARCHIVED'))) t), '[]'::jsonb)
  );
end $$;


-- ═══ 9) GRANT ═══════════════════════════════════════════════════
--   njhr_me_get / njhr_me_save → เปิดให้เรียกจาก client ได้ (ตรวจสิทธิ์จาก p_token ภายใน)
--   njhr_me_guard              → ปิด เหมือน njhr_ctx เพราะเป็นตัวช่วยภายในเท่านั้น
revoke all on function public.njhr_me_guard(text)        from public, anon, authenticated;
grant execute on function public.njhr_me_get(text)         to anon, authenticated;
grant execute on function public.njhr_me_save(text, jsonb) to anon, authenticated;


-- ═══ ROLLBACK (ไม่รันอัตโนมัติ — คัดลอกไปรันเองเมื่อจำเป็น) ═══════
-- drop function if exists public.njhr_me_save(text, jsonb);
-- drop function if exists public.njhr_me_get(text);
-- drop function if exists public.njhr_me_guard(text);
-- alter table public.employees drop column if exists emergency_phone;
--
-- คืน njhr_empfile_guard / _upload_path / _save / _list กลับเป็นของเดิม:
--   รันไฟล์ supabase-new/73_emp_files.sql ส่วนข้อ 3, 4, 5, 8 ใหม่
--   (เนื้อในตรงกับที่ดึงจาก DB เมื่อ 2026-08-08 ทุกตัวอักษร)


-- ═══ VERIFICATION — statement สุดท้าย คืน JSON ก้อนเดียว ═════════
select jsonb_pretty(jsonb_build_object(

  '1_emergency_phone_column', (
    select case when count(*) = 1 then '✅ เพิ่มแล้ว · ' || max(data_type) ||
                     ' · nullable=' || max(is_nullable)
                else '❌ ไม่พบคอลัมน์' end
      from information_schema.columns
     where table_schema = 'public' and table_name = 'employees'
       and column_name = 'emergency_phone'),

  '2_new_functions', (
    select coalesce(jsonb_object_agg(p.proname,
             '✅ ' || pg_get_function_identity_arguments(p.oid)), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in ('njhr_me_guard','njhr_me_get','njhr_me_save')),

  '3_replaced_functions_owner_logic', (
    select coalesce(jsonb_object_agg(p.proname, chk), '{}'::jsonb) from (
      select p.proname,
             case when pg_get_functiondef(p.oid) like '%v_own%'
                    or pg_get_functiondef(p.oid) like '%is_manager and%'
                  then '✅ มีตรรกะเจ้าของแล้ว' else '❌ ยังเป็นของเดิม' end chk
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('njhr_empfile_guard','njhr_empfile_upload_path',
                           'njhr_empfile_save','njhr_empfile_list')) p),

  '4_untouched_functions', (
    select coalesce(jsonb_object_agg(p.proname,
             case when pg_get_functiondef(p.oid) like '%v_own%'
                  then '⚠ ถูกแก้โดยไม่ตั้งใจ' else '✅ ไม่ถูกแตะ' end), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('njhr_empfile_delete','njhr_empfile_access',
                         'njhr_emp_guard','njhr_emp_save','njhr_emp_list','njhr_ctx')),

  '5_grants', (
    select coalesce(jsonb_object_agg(p.proname,
             coalesce(array_to_string(p.proacl::text[], ' | '), 'default')), '{}'::jsonb)
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname in ('njhr_me_guard','njhr_me_get','njhr_me_save')),

  '6_no_overload', (
    select coalesce(jsonb_object_agg(proname, n), '{}'::jsonb) from (
      select p.proname, count(*) n
        from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
       where ns.nspname = 'public'
         and (p.proname like 'njhr\_me\_%' or p.proname like 'njhr\_empfile\_%')
       group by p.proname) s),

  '7_data_untouched', (
    select jsonb_build_object(
             'employees_total', (select count(*) from public.employees),
             'emergency_phone_filled',
               (select count(*) from public.employees where coalesce(btrim(emergency_phone),'') <> ''),
             'emp_files_total', (select count(*) from public.njhr_emp_files),
             'enum_user_role_values',
               (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
                 where t.typname = 'user_role'))),

  '8_not_created', (
    select jsonb_build_object(
             'verification_table', case when to_regclass('public.njhr_emp_verification') is null
                                        then '✅ ไม่ได้สร้าง' else '⚠ มีอยู่' end,
             'review_columns_on_emp_files', coalesce((
               select jsonb_agg(column_name) from information_schema.columns
                where table_schema='public' and table_name='njhr_emp_files'
                  and column_name in ('status','submitted_at','reviewed_by','locked')), '[]'::jsonb))),

  'meta', jsonb_build_object('file','G2_selfservice.sql','applied_at', now())
)) as result;
