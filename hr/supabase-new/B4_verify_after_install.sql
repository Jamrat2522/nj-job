-- B4_verify_after_install.sql  — READ-ONLY ทั้งไฟล์ · คำสั่งเดียว
-- ตรวจว่าจำนวนบัญชีที่ลบได้ลดจาก 54 → 17 เพราะอะไร
select jsonb_pretty(jsonb_build_object(
  'checked_at', now(),
  '1_salary_totals', jsonb_build_object(
     'total',    (select count(*) from public.app_users where app_code='salary'),
     'linked',   (select count(*) from public.app_users where app_code='salary' and employee_id is not null),
     'unlinked', (select count(*) from public.app_users where app_code='salary' and employee_id is null)),
  '2_unlinked_by_role',
     (select coalesce(jsonb_agg(x.o order by (x.o->>'n')::int desc),'[]'::jsonb) from
        (select jsonb_build_object('raw_role', u.role::text, 'n', count(*)) o
           from public.app_users u
          where u.app_code='salary' and u.employee_id is null
          group by u.role::text) x),
  '3_user_delete_ever_run', jsonb_build_object(
     'audit_rows', (select count(*) from public.audit_log
                     where app_code='salary' and action='USER_DELETE'),
     'recent',     (select coalesce(jsonb_agg(jsonb_build_object(
                      'at', a.created_at, 'by', a.actor, 'detail', a.detail)
                    order by a.created_at desc),'[]'::jsonb)
                     from (select * from public.audit_log
                            where app_code='salary' and action='USER_DELETE'
                            order by created_at desc limit 10) a)),
  '4_recent_link_activity', jsonb_build_object(
     'user_link_last_2h',  (select count(*) from public.audit_log
                             where app_code='salary' and action in ('USER_LINK','USER_EDIT')
                               and created_at > now() - interval '2 hours'),
     'activation_approved_last_2h', (select count(*) from public.njhr_activation_requests
                                      where decided_at > now() - interval '2 hours')),
  '5_backup_tables_present',
     (select coalesce(jsonb_agg(c.relname order by c.relname),'[]'::jsonb)
        from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relkind='r' and c.relname like 'njhr_%backup%'
          or (n.nspname='public' and c.relkind='r' and c.relname like 'njhr_bk_%')),
  '6_function_state', jsonb_build_object(
     'njhr_user_delete_installed', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                                           where n.nspname='public' and p.proname='njhr_user_delete'),
     'schema_version', (select note from public.njhr_schema_version where version='v11.9-user-delete'))
)) as verify_report;
