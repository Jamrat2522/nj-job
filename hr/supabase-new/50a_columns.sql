-- [A/4] คอลัมน์ + ตารางทั้งหมด · อ่านอย่างเดียว · ผลลัพธ์เดียว
select jsonb_pretty(jsonb_build_object(
 'tables', (select jsonb_agg(jsonb_build_object(
     'name', t.table_name,
     'rows', (xpath('/row/c/text()', query_to_xml(format('select count(*) c from public.%I',t.table_name),false,true,'')))[1]::text::bigint,
     'rls', (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
              where n.nspname='public' and c.relname=t.table_name)) order by t.table_name)
   from information_schema.tables t where t.table_schema='public' and t.table_type='BASE TABLE'),
 'columns', (select jsonb_object_agg(tbl, cols) from (
     select c.table_name tbl, jsonb_agg(
       c.ordinal_position || '. ' || c.column_name || ' : ' || c.udt_name ||
       case when c.is_nullable='NO' then ' NOT NULL' else '' end ||
       coalesce(' DEFAULT ' || c.column_default,'') order by c.ordinal_position) cols
     from information_schema.columns c
     where c.table_schema='public' and c.table_name in
       ('attendance','ot_requests','payroll','payslips','work_shifts','employee_shifts','system_settings')
     group by c.table_name) s)
)) as "A_ตารางและคอลัมน์";
