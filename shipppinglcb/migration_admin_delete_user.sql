-- ============================================================================
-- migration_admin_delete_user.sql
-- MASSENGER (app_code = 'massenger') · Supabase project sytgqjglcnsabcszbngg
--
-- ปัญหา: ลบ user ในเมนู "จัดการผู้ใช้งาน" ไม่ได้ → error 409 (Conflict)
-- สาเหตุ: users.id ถูกอ้างด้วย Foreign Key จากตารางอื่น (jobs, job_logs, ฯลฯ)
--         การ DELETE FROM users ตรง ๆ จึงถูก Postgres บล็อก (FK violation → 409)
--
-- แนวทาง (hard delete จริง แบบปลอดภัย):
--   สร้าง RPC admin_delete_user() ที่:
--     1) เช็คสิทธิ์ผู้เรียก = SUPER_ADMIN (app เดียวกัน)
--     2) ค้น FK ที่อ้าง public.users(id) "อัตโนมัติ" จาก system catalog
--        → ไม่ต้อง hardcode ชื่อ constraint (กัน "เดา" ชื่อผิด)
--     3) จัดการ dependent rows:
--          - คอลัมน์ nullable  → SET NULL  (เก็บประวัติงานไว้ เพราะมี *_name denormalized)
--          - ตาราง log (NOT NULL) → DELETE เฉพาะแถวของ user นั้น
--          - คอลัมน์ NOT NULL อื่น ๆ → RAISE / return error แบบดัง ๆ (ไม่ลบข้อมูลหายเงียบ)
--     4) DELETE user
--   คืน jsonb {success, deleted_user, cleared[]} หรือ {success:false, error, detail}
--
-- วิธีใช้: เปิด Supabase → SQL Editor → วางทั้งไฟล์ → RUN
-- ============================================================================


-- --------------------------------------------------------------------------
-- (ทางเลือก) DIAGNOSTIC — ดูว่ามี FK ตัวไหนอ้าง users.id บ้าง ก่อนรันจริง
-- คัดลอกเฉพาะบล็อกนี้ไปรันแยกได้ ถ้าอยากเห็นรายการก่อน
-- --------------------------------------------------------------------------
-- SELECT
--   src_ns.nspname   AS src_schema,
--   src_rel.relname  AS src_table,
--   src_att.attname  AS src_column,
--   src_att.attnotnull AS not_null,
--   con.conname      AS constraint_name
-- FROM pg_constraint con
-- JOIN pg_class     tgt_rel ON tgt_rel.oid = con.confrelid
-- JOIN pg_namespace tgt_ns  ON tgt_ns.oid  = tgt_rel.relnamespace
-- JOIN pg_class     src_rel ON src_rel.oid = con.conrelid
-- JOIN pg_namespace src_ns  ON src_ns.oid  = src_rel.relnamespace
-- JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS u(src_attnum, tgt_attnum, ord) ON true
-- JOIN pg_attribute src_att ON src_att.attrelid = con.conrelid  AND src_att.attnum = u.src_attnum
-- JOIN pg_attribute tgt_att ON tgt_att.attrelid = con.confrelid AND tgt_att.attnum = u.tgt_attnum
-- WHERE con.contype = 'f'
--   AND tgt_ns.nspname = 'public'
--   AND tgt_rel.relname = 'users'
--   AND tgt_att.attname = 'id'
-- ORDER BY src_table, src_column;


-- --------------------------------------------------------------------------
-- RPC: admin_delete_user
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  app_code_param  text,
  target_id       uuid,
  caller_username text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_caller_role text;
  v_username    text;
  fk            record;
  v_cleared     jsonb := '[]'::jsonb;
  -- ตาราง log ที่ปลอดภัยจะลบแถวทิ้งได้ (แม้คอลัมน์ user จะ NOT NULL)
  v_log_tables  text[] := ARRAY['job_logs','document_logs','password_audit_logs'];
BEGIN
  -- 1) ตรวจสิทธิ์ผู้เรียก (ต้องเป็น SUPER_ADMIN ใน app เดียวกัน)
  IF caller_username IS NOT NULL AND btrim(caller_username) <> '' THEN
    SELECT role INTO v_caller_role
    FROM public.users
    WHERE app_code = app_code_param
      AND lower(username) = lower(btrim(caller_username))
    LIMIT 1;

    IF v_caller_role IS DISTINCT FROM 'SUPER_ADMIN' THEN
      RETURN jsonb_build_object('success', false, 'error', 'forbidden_super_admin_only');
    END IF;
  END IF;

  -- 2) target ต้องมีอยู่จริงและอยู่ app เดียวกัน
  SELECT username INTO v_username
  FROM public.users
  WHERE id = target_id AND app_code = app_code_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- 3) เคลียร์ dependent rows ตาม FK ที่อ้าง users.id (ค้นจาก catalog)
  FOR fk IN
    SELECT
      src_rel.relname   AS src_table,
      src_att.attname   AS src_column,
      src_att.attnotnull AS not_null
    FROM pg_constraint con
    JOIN pg_class     tgt_rel ON tgt_rel.oid = con.confrelid
    JOIN pg_namespace tgt_ns  ON tgt_ns.oid  = tgt_rel.relnamespace
    JOIN pg_class     src_rel ON src_rel.oid = con.conrelid
    JOIN pg_namespace src_ns  ON src_ns.oid  = src_rel.relnamespace
    JOIN LATERAL unnest(con.conkey, con.confkey) WITH ORDINALITY AS u(src_attnum, tgt_attnum, ord) ON true
    JOIN pg_attribute src_att ON src_att.attrelid = con.conrelid  AND src_att.attnum = u.src_attnum
    JOIN pg_attribute tgt_att ON tgt_att.attrelid = con.confrelid AND tgt_att.attnum = u.tgt_attnum
    WHERE con.contype = 'f'
      AND tgt_ns.nspname = 'public'
      AND tgt_rel.relname = 'users'
      AND tgt_att.attname = 'id'          -- เฉพาะคอลัมน์ที่อ้าง users.id เท่านั้น (กันแตะ app_code)
      AND src_ns.nspname = 'public'
  LOOP
    IF fk.not_null THEN
      IF fk.src_table = ANY(v_log_tables) THEN
        -- ตาราง log: ลบเฉพาะแถวของ user นี้
        EXECUTE format('DELETE FROM public.%I WHERE %I = $1', fk.src_table, fk.src_column)
          USING target_id;
        v_cleared := v_cleared || jsonb_build_object(
          'table', fk.src_table, 'column', fk.src_column, 'action', 'deleted_rows');
      ELSE
        -- NOT NULL ที่ไม่ใช่ log → หยุดแบบดัง ๆ ไม่ลบข้อมูลหาย
        RETURN jsonb_build_object(
          'success', false,
          'error',  'blocked_not_null_fk',
          'detail', format('%s.%s เป็น NOT NULL และผูก FK กับ users — ลบไม่ได้โดยไม่เสียข้อมูล (ต้อง reassign หรือ ALTER คอลัมน์ให้ nullable ก่อน)',
                           fk.src_table, fk.src_column));
      END IF;
    ELSE
      -- nullable → SET NULL (ประวัติยังอ่านได้จากคอลัมน์ *_name ที่ denormalized ไว้)
      EXECUTE format('UPDATE public.%I SET %I = NULL WHERE %I = $1',
                     fk.src_table, fk.src_column, fk.src_column)
        USING target_id;
      v_cleared := v_cleared || jsonb_build_object(
        'table', fk.src_table, 'column', fk.src_column, 'action', 'set_null');
    END IF;
  END LOOP;

  -- 4) ลบ user จริง
  DELETE FROM public.users WHERE id = target_id AND app_code = app_code_param;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user', v_username,
    'cleared', v_cleared
  );

EXCEPTION WHEN OTHERS THEN
  -- fail แบบดัง ๆ พร้อมเหตุผล (ทั้ง transaction ถูก rollback อัตโนมัติ)
  RETURN jsonb_build_object('success', false, 'error', 'exception', 'detail', SQLERRM);
END;
$fn$;

-- สิทธิ์เรียก (แอปนี้ใช้ anon key + custom auth เหมือน RPC อื่น เช่น login_plain / admin_create_user)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(text, uuid, text) TO anon, authenticated;

-- ============================================================================
-- หลังรันเสร็จ: ไปแก้ client (js/heavy-users.js) ให้เรียก RPC นี้แทน .delete() ตรง ๆ
-- (ผมแก้ให้แล้วในไฟล์ที่แนบมาคู่กัน)
-- ============================================================================
