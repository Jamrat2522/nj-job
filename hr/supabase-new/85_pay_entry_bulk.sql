-- ============================================================
-- NJ HR V.10 — 85_pay_entry_bulk.sql
-- เลือกหลายรายการแล้วลบ / ปิดใช้งาน พร้อมกัน ในหน้า "กำหนดให้พนักงาน"
--
-- ใช้โครงสร้างและตรรกะเดิมทั้งหมดจาก 84_pay_entry_recurring.sql
--   njhr_pay_guard · njhr_pay_period_locked · njhr_pay_entry_in_period
--   njhr_pay_entries (entry_mode · effective_start · effective_end · is_active · deleted_at)
-- ไม่สร้างตารางใหม่ · ไม่แตะสูตรคำนวณเงินเดือน · ไม่แตะตาราง payroll
--
-- พฤติกรรมสำคัญ
--   · ทำทีละรายการใน loop พร้อมดัก exception รายตัว
--     → รายการที่ล้มเหลวไม่ทำให้รายการอื่นถูก rollback (ตามข้อ 12)
--   · DELETE   = Soft Delete และถูกบล็อกถ้ารายการเคยถูกใช้ในงวด CALCULATED/PAID
--   · DEACTIVATE = ตั้ง is_active=false เท่านั้น
--     รายการประจำจะหยุดมีผลตั้งแต่งวดถัดไป งวดที่คำนวณ/ปิดไปแล้วไม่ถูกแตะเลย
--     เพราะยอดของงวดเก่าเก็บอยู่ในตาราง payroll ไม่ได้คำนวณสดจาก njhr_pay_entries
--   · เขียน audit_log ทุกรายการ + 1 บรรทัดสรุปของทั้งชุด
--
-- ต้องรัน 43 · 84 มาก่อน · รันซ้ำได้
-- ============================================================

-- ─── 0) PREFLIGHT ───────────────────────────────────────────
do $$
declare miss text;
begin
  select string_agg(f, ', ') into miss from unnest(array[
    'njhr_pay_guard','njhr_pay_period_locked','njhr_pay_entry_in_period']) f
   where not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.proname = f);
  if miss is not null then
    raise exception 'PREFLIGHT: ไม่พบฟังก์ชัน [%] — รัน 84_pay_entry_recurring.sql ก่อน', miss;
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='njhr_pay_entries'
                    and column_name='entry_mode') then
    raise exception 'PREFLIGHT: njhr_pay_entries ยังไม่มีคอลัมน์ entry_mode — รัน 84 ก่อน';
  end if;
  raise notice 'PREFLIGHT ผ่าน · njhr_pay_entries % แถวที่ยังไม่ถูกลบ',
    (select count(*) from public.njhr_pay_entries where deleted_at is null);
end $$;


-- ─── 1) njhr_pay_entry_bulk ─────────────────────────────────
--  p_action = 'DELETE' | 'DEACTIVATE' | 'ACTIVATE'
--  คืนผลรายบรรทัด เพื่อให้หน้าจอสรุป "สำเร็จ X · ไม่สำเร็จ X พร้อมเหตุผล" ได้ตรงตัว
create or replace function public.njhr_pay_entry_bulk(
  p_token text, p_ids uuid[], p_action text)
returns table (id uuid, ok boolean, emp_code text, item_name text, message text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c record; e record; v_act text := upper(btrim(coalesce(p_action,'')));
        v_id uuid; v_ok int := 0; v_fail int := 0; v_code text; v_item text;
begin
  select * into c from public.njhr_pay_guard(p_token, true);

  if v_act not in ('DELETE','DEACTIVATE','ACTIVATE') then
    raise exception 'คำสั่งไม่ถูกต้อง (DELETE / DEACTIVATE / ACTIVATE)' using errcode='22023';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    raise exception 'กรุณาเลือกรายการอย่างน้อย 1 รายการ' using errcode='22023';
  end if;
  if array_length(p_ids, 1) > 500 then
    raise exception 'เลือกได้ครั้งละไม่เกิน 500 รายการ' using errcode='22023';
  end if;

  foreach v_id in array p_ids loop
    v_code := ''; v_item := '';
    begin
      select en.*, em.emp_code ecode, i.name_th iname into e
        from public.njhr_pay_entries en
        join public.employees em on em.id = en.employee_id
        join public.njhr_pay_items i on i.code = en.item_code
       where en.id = v_id and en.deleted_at is null
       for update of en;

      if not found then
        v_fail := v_fail + 1;
        return query select v_id, false, ''::text, ''::text, 'ไม่พบรายการนี้ หรือถูกลบไปแล้ว'::text;
        continue;
      end if;
      v_code := e.ecode; v_item := e.iname;

      -- ── ลบ ────────────────────────────────────────────────
      if v_act = 'DELETE' then
        if exists (select 1 from public.payroll p
                    where p.employee_id = e.employee_id
                      and upper(coalesce(p.status::text,'DRAFT')) in ('CALCULATED','PAID')
                      and public.njhr_pay_entry_in_period(e.entry_mode, e.is_active,
                            e.period_year, e.period_month, e.effective_start, e.effective_end,
                            p.period_year, p.period_month)) then
          v_fail := v_fail + 1;
          return query select v_id, false, v_code, v_item,
            'ถูกใช้ในงวดเงินเดือนที่ยืนยันหรือปิดแล้ว ลบไม่ได้ — ให้ปิดใช้งานแทน'::text;
          continue;
        end if;

        update public.njhr_pay_entries
           set deleted_at = now(), updated_at = now(), updated_by = c.username
         where njhr_pay_entries.id = v_id;

        perform public.njhr_audit_write(p_token, 'PAYENTRY_DELETE', 'payroll',
          'njhr_pay_entries', v_id::text,
          'ลบรายการ (เลือกหลายรายการ) · ' || v_code || ' · ' || v_item ||
          ' · ' || e.amount::text, to_jsonb(e), null, null);

        v_ok := v_ok + 1;
        return query select v_id, true, v_code, v_item, 'ลบแล้ว'::text;
        continue;
      end if;

      -- ── ปิด / เปิดใช้งาน ──────────────────────────────────
      if coalesce(e.is_active,true) = (v_act = 'ACTIVATE') then
        v_fail := v_fail + 1;
        return query select v_id, false, v_code, v_item,
          ('รายการนี้อยู่ในสถานะ ' ||
           case when v_act = 'ACTIVATE' then 'ใช้งาน' else 'ปิดใช้งาน' end ||
           ' อยู่แล้ว')::text;
        continue;
      end if;

      update public.njhr_pay_entries
         set is_active = (v_act = 'ACTIVATE'), updated_at = now(), updated_by = c.username
       where njhr_pay_entries.id = v_id;

      perform public.njhr_audit_write(p_token,
        case when v_act = 'ACTIVATE' then 'PAYENTRY_ENABLE' else 'PAYENTRY_DISABLE' end,
        'payroll', 'njhr_pay_entries', v_id::text,
        case when v_act = 'ACTIVATE' then 'เปิดใช้งาน' else 'ปิดใช้งาน' end ||
        'รายการ (เลือกหลายรายการ) · ' || v_code || ' · ' || v_item ||
        case when coalesce(e.entry_mode,'ONE_TIME') = 'RECURRING'
             then ' · รายการประจำ มีผลตั้งแต่งวดถัดไป งวดที่คำนวณแล้วไม่เปลี่ยน' else '' end,
        to_jsonb(e),
        (select to_jsonb(x) from public.njhr_pay_entries x where x.id = v_id), null);

      v_ok := v_ok + 1;
      return query select v_id, true, v_code, v_item,
        (case when v_act = 'ACTIVATE' then 'เปิดใช้งานแล้ว' else 'ปิดใช้งานแล้ว' end)::text;

    exception when others then
      -- ล้มเหลวรายการเดียว ไม่กระทบรายการอื่น
      v_fail := v_fail + 1;
      return query select v_id, false, v_code, v_item, SQLERRM::text;
    end;
  end loop;

  perform public.njhr_audit_write(p_token, 'PAYENTRY_BULK', 'payroll', 'njhr_pay_entries', null,
    'ดำเนินการหลายรายการ: ' || v_act || ' · เลือก ' || array_length(p_ids,1) ||
    ' · สำเร็จ ' || v_ok || ' · ไม่สำเร็จ ' || v_fail, null, null, null);
end $$;

grant execute on function public.njhr_pay_entry_bulk(text, uuid[], text) to anon, authenticated;

insert into public.njhr_schema_version(version, note)
values ('v13.6-pay-entry-bulk', 'รายการเงินเดือน: ลบ/ปิดใช้งานหลายรายการพร้อมกัน + สรุปผลรายบรรทัด')
on conflict (version) do nothing;


-- ─── 2) VERIFICATION ───────────────────────────────────────
select jsonb_pretty(jsonb_build_object(
  'function', (select jsonb_build_object('name', p.proname,
                 'args', pg_get_function_arguments(p.oid),
                 'returns', pg_get_function_result(p.oid))
                 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname='njhr_pay_entry_bulk'),
  'anon_can_execute', (select has_function_privilege('anon', p.oid, 'EXECUTE')
                         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                        where n.nspname='public' and p.proname='njhr_pay_entry_bulk'),
  'entries_live', (select count(*) from public.njhr_pay_entries where deleted_at is null),
  'entries_active', (select count(*) from public.njhr_pay_entries
                      where deleted_at is null and coalesce(is_active,true))
)) as install_report;
