-- [D/4] ตัวอย่างข้อมูล + ช่วงวันที่ · อ่านอย่างเดียว · ผลลัพธ์เดียว
-- ปิดบัง: national_id · bank_account · bank_account_name · password · token · เงินเดือน/ยอดเงิน
select jsonb_pretty(jsonb_build_object(
 'samples', (select jsonb_object_agg(tbl, coalesce(s::jsonb,'[]'::jsonb)) from (
   select t.table_name tbl,
    (xpath('/row/j/text()', query_to_xml(
      format('select coalesce(jsonb_agg(to_jsonb(x))::text,''[]'') j from (select %s from public.%I limit 3) x',
        (select string_agg(case when c.column_name ~* '(national_id|bank_account|password|token|salary|amount|net_pay|base_pay)'
             then format('''***'' as %I',c.column_name) else format('%I',c.column_name) end,
             ', ' order by c.ordinal_position)
         from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name),
        t.table_name), false,true,'')))[1]::text s
   from information_schema.tables t where t.table_schema='public' and t.table_type='BASE TABLE'
     and t.table_name in ('attendance','ot_requests','payroll','payslips','work_shifts','employee_shifts','system_settings')) q),
 'date_ranges', (select coalesce(jsonb_agg(c.table_name||'.'||c.column_name||' : '||
     coalesce((xpath('/row/v/text()', query_to_xml(format('select min(%I)::text v from public.%I',c.column_name,c.table_name),false,true,'')))[1]::text,'ว่าง')||
     ' ถึง '||coalesce((xpath('/row/v/text()', query_to_xml(format('select max(%I)::text v from public.%I',c.column_name,c.table_name),false,true,'')))[1]::text,'ว่าง')
     order by c.table_name,c.column_name),'[]')
   from information_schema.columns c where c.table_schema='public'
     and c.table_name in ('attendance','ot_requests','payroll','payslips','work_shifts','employee_shifts','system_settings')
     and c.data_type in ('date','timestamp with time zone','timestamp without time zone'))
)) as "D_ตัวอย่างและช่วงวันที่";
