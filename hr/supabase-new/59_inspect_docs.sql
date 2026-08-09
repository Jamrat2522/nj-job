-- [F] ตรวจระบบเอกสารเดิมก่อนทำ "แฟ้มประวัติพนักงาน" · อ่านอย่างเดียว · ผลลัพธ์เดียว
-- โปรเจกต์นี้แชร์กับอีกหลายแอป จึงต้องรู้ก่อนว่าตารางเอกสารที่มีอยู่เป็นของระบบใด
-- ถ้าเป็นของ HR อยู่แล้วต้องนำกลับมาใช้ · ถ้าเป็นของแอปอื่นห้ามแตะเด็ดขาด
select jsonb_pretty(jsonb_object_agg(t, info)) as "F_ตรวจระบบเอกสารเดิม"
from (
  select t,
         jsonb_build_object(
           'columns', (select jsonb_agg(
                ordinal_position || '. ' || column_name || ' : ' || udt_name ||
                case when is_nullable='NO' then ' NOT NULL' else '' end ||
                coalesce(' DEFAULT ' || left(column_default, 40), '')
                order by ordinal_position)
              from information_schema.columns c
             where c.table_schema='public' and c.table_name=t),
           'constraints', (select coalesce(jsonb_agg(conname || ' : ' || pg_get_constraintdef(oid)), '[]')
              from pg_constraint where conrelid = to_regclass('public.'||t)),
           'rows', (xpath('/row/c/text()',
              query_to_xml(format('select count(*) c from public.%I', t), false, true, '')))[1]::text::bigint,
           -- ตัวอย่าง 2 แถวเพื่อดูว่าเป็นข้อมูลของระบบใด (ปิดบังค่าที่อาจอ่อนไหว)
           'sample', (xpath('/row/j/text()', query_to_xml(
              format('select coalesce(jsonb_agg(to_jsonb(x))::text,''[]'') j from (select %s from public.%I limit 2) x',
                (select string_agg(
                    case when c.column_name ~* '(url|path|base64|data|signature|content|body|national|bank)'
                         then format('''***'' as %I', c.column_name) else format('%I', c.column_name) end,
                    ', ' order by c.ordinal_position)
                   from information_schema.columns c
                  where c.table_schema='public' and c.table_name=t),
                t), false, true, '')))[1]::text
         ) info
    from unnest(array['documents','document_logs','employee_documents',
                      'sa_documents','sa_document_logs','signatures']) t
   where to_regclass('public.'||t) is not null
) s;
