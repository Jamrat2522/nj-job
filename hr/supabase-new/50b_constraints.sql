-- [B/4] Constraint + Index + Enum · อ่านอย่างเดียว · ผลลัพธ์เดียว
select jsonb_pretty(jsonb_build_object(
 'constraints', (select coalesce(jsonb_agg(r.relname||' | '||con.conname||' | '||pg_get_constraintdef(con.oid)
     order by r.relname, con.contype),'[]')
   from pg_constraint con join pg_class r on r.oid=con.conrelid
   join pg_namespace n on n.oid=r.relnamespace
   where n.nspname='public' and r.relname in
     ('attendance','ot_requests','payroll','payslips','work_shifts','employee_shifts','system_settings')),
 'indexes', (select coalesce(jsonb_agg(indexdef order by tablename,indexname),'[]')
   from pg_indexes where schemaname='public' and tablename in
     ('attendance','ot_requests','payroll','payslips','work_shifts','employee_shifts','system_settings')),
 'enums', (select jsonb_object_agg(typname, vals) from (
     select t.typname, jsonb_agg(e.enumlabel order by e.enumsortorder) vals
     from pg_type t join pg_enum e on e.enumtypid=t.oid
     join pg_namespace n on n.oid=t.typnamespace where n.nspname='public'
     group by t.typname) x),
 'enum_columns', (select coalesce(jsonb_agg(c.table_name||'.'||c.column_name||' = '||c.udt_name
     order by c.table_name,c.column_name),'[]')
   from information_schema.columns c join pg_type t on t.typname=c.udt_name
   join pg_namespace n on n.oid=t.typnamespace and n.nspname='public'
   where c.table_schema='public' and t.typtype='e')
)) as "B_Constraint_Index_Enum";
