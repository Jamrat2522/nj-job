-- [C/4] ความสัมพันธ์ + Function/View/Trigger/RLS · อ่านอย่างเดียว · ผลลัพธ์เดียว
select jsonb_pretty(jsonb_build_object(
 'fk_to_employees', (select coalesce(jsonb_agg(r.relname||' : '||pg_get_constraintdef(con.oid) order by r.relname),'[]')
   from pg_constraint con join pg_class r on r.oid=con.conrelid join pg_class f on f.oid=con.confrelid
   join pg_namespace n on n.oid=r.relnamespace
   where n.nspname='public' and con.contype='f' and f.relname='employees'),
 'employee_like_columns', (select coalesce(jsonb_agg(c.table_name||'.'||c.column_name||' ('||c.udt_name||')'
     order by c.table_name,c.column_name),'[]')
   from information_schema.columns c where c.table_schema='public'
     and (c.column_name ilike '%employee%' or c.column_name ilike 'emp\_%')),
 'functions_njhr', (select coalesce(jsonb_agg(p.proname order by p.proname),'[]')
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'njhr\_%'),
 'functions_other', (select coalesce(jsonb_agg(p.proname order by p.proname),'[]')
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname not like 'njhr\_%' and p.prokind='f'),
 'views', (select coalesce(jsonb_agg(table_name order by table_name),'[]')
   from information_schema.views where table_schema='public'),
 'triggers', (select coalesce(jsonb_agg(event_object_table||' : '||trigger_name||' ('||event_manipulation||')'
     order by event_object_table,trigger_name),'[]')
   from information_schema.triggers where trigger_schema='public'),
 'rls_policies', (select coalesce(jsonb_agg(tablename||' | '||policyname||' | '||cmd||' | using='||coalesce(qual,'-')
     order by tablename,policyname),'[]') from pg_policies where schemaname='public')
)) as "C_Relation_Function_RLS";
