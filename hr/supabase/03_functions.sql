-- ⛔ ห้ามรันไฟล์นี้: อ้างตาราง leaves ที่ยังไม่ถูกสร้าง และชนิด id ยังไม่สรุป
-- ============================================================
-- ธุรกรรมสำคัญ: ส่งใบลา / อนุมัติ — ทำงานเป็น Transaction เดียว rollback อัตโนมัติถ้าขั้นตอนใดล้ม
-- ❗ ยังไม่ถูกรันจริง
-- ============================================================
create or replace function submit_leave(
  p_id text, p_type_id text, p_mode text, p_start date, p_end date,
  p_days numeric, p_hours numeric, p_reason text, p_idem text)
returns leaves language plpgsql security definer as $$
declare v_emp text := my_emp(); v_row leaves; v_rem numeric;
begin
  if v_emp is null then raise exception 'ไม่พบสิทธิ์ผู้ใช้งาน'; end if;
  select * into v_row from leaves where idempotency_key = p_idem;
  if found then return v_row; end if;                      -- กดซ้ำ/queue ซ้ำ → คืนใบเดิม ไม่สร้างซ้ำ
  if exists (select 1 from leaves where emp_id = v_emp and status in ('PENDING','APPROVED')
             and daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[]'))
    then raise exception 'มีคำขอลาในช่วงวันที่นี้อยู่แล้ว'; end if;
  select (b.quota - b.used) into v_rem from leave_balances b
    where b.emp_id = v_emp and b.type_id = p_type_id and b.year = extract(year from p_start);
  if v_rem is not null and v_rem < coalesce(p_days,0) + coalesce(p_hours,0)/8
    then raise exception 'วันลาคงเหลือไม่พอ'; end if;
  insert into leaves(id, emp_id, type_id, mode, start_date, end_date, days, hours, reason, status, idempotency_key)
    values (p_id, v_emp, p_type_id, p_mode, p_start, p_end, p_days, p_hours, p_reason, 'PENDING', p_idem)
    returning * into v_row;
  insert into leave_timeline(leave_id, by_name, action) values (p_id, v_emp, 'ส่งคำขอ');
  insert into audit_log(by_name, action, detail, after_json) values (v_emp, 'LEAVE_REQ', p_id, to_jsonb(v_row));
  return v_row;
end $$;

create or replace function approve_leave(p_id text, p_action text, p_note text default null)
returns leaves language plpgsql security definer as $$
declare v_row leaves; v_before jsonb; v_new text; v_by text := my_emp();
begin
  if not can_approve() then raise exception 'ไม่มีสิทธิ์อนุมัติ'; end if;
  select * into v_row from leaves where id = p_id for update;      -- ล็อกแถว กันสองคนกดพร้อมกัน
  if not found then raise exception 'ไม่พบคำขอ'; end if;
  if v_row.status not in ('PENDING','NEED_MORE_INFO') then return v_row; end if;  -- กดซ้ำ = ไม่เปลี่ยนซ้ำ
  v_before := to_jsonb(v_row);
  v_new := case p_action when 'APPROVE' then 'APPROVED' when 'REJECT' then 'REJECTED' else 'NEED_MORE_INFO' end;
  update leaves set status = v_new where id = p_id returning * into v_row;
  if v_new = 'APPROVED' then
    update leave_balances set used = used + coalesce(v_row.days,0) + coalesce(v_row.hours,0)/8
      where emp_id = v_row.emp_id and type_id = v_row.type_id and year = extract(year from v_row.start_date);
    if not found then raise exception 'ไม่พบยอดวันลาของพนักงาน'; end if;         -- ล้ม → rollback ทั้งชุด
  end if;
  insert into leave_timeline(leave_id, by_name, action, note)
    values (p_id, v_by, case v_new when 'APPROVED' then 'อนุมัติ' when 'REJECTED' then 'ไม่อนุมัติ' else 'ขอข้อมูลเพิ่ม' end, p_note);
  insert into notifications(id, user_id, title, body, link)
    select gen_random_uuid()::text, u.id, 'ผลการอนุมัติ', p_id || ' ' || v_new, '#/leave'
    from app_users u where u.emp_id = v_row.emp_id;
  insert into audit_log(by_name, action, detail, before_json, after_json)
    values (v_by, v_new, p_id, v_before, to_jsonb(v_row));
  return v_row;
end $$;
