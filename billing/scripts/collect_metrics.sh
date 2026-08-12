#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# collect_metrics.sh — เก็บ row count + financial aggregate จาก Production
# ───────────────────────────────────────────────────────────────────────────
# READ-ONLY : ใช้เฉพาะ SELECT · ไม่แตะข้อมูล
# ห้ามเดา column : สร้าง SQL จาก information_schema ตอน runtime
#                  column ไหนไม่มีจริง = ไม่ถูก SUM (ไม่ error)
# Output    : $OUT_DIR/metrics.json
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

: "${DB_URL:?DB_URL not set}"
OUT_DIR="${OUT_DIR:-./backup-out}"
PSQL="${PSQL:-psql}"
mkdir -p "$OUT_DIR"

# ── ตารางที่ต้องเก็บ metrics (เพิ่มได้เมื่อ inventory พบ billing table อื่น) ──
CRITICAL_TABLES="${CRITICAL_TABLES:-service_charge_records,advance_charge_records,app_users}"

# ── คอลัมน์การเงินที่ "สนใจ" — จะถูกใช้ก็ต่อเมื่อมีอยู่จริงใน information_schema ──
MONEY_COLS="${MONEY_COLS:-service_charge,advance,vat,amount,wht,total_amount}"

# ── สร้าง SQL แบบ dynamic: SUM เฉพาะคอลัมน์ที่มีจริง ──
read -r -d '' GEN_SQL <<'SQL' || true
WITH want_tbl AS (
  SELECT trim(t) AS tbl FROM unnest(string_to_array(:'tables', ',')) t
), want_col AS (
  SELECT trim(c) AS col FROM unnest(string_to_array(:'moneycols', ',')) c
), present AS (
  SELECT c.table_name, c.column_name
  FROM information_schema.columns c
  JOIN want_tbl  wt ON wt.tbl = c.table_name
  JOIN want_col  wc ON wc.col = c.column_name
  WHERE c.table_schema = 'public'
    AND c.data_type IN ('numeric','double precision','real','integer','bigint','smallint')
), agg AS (
  SELECT table_name,
         string_agg(format('%L, COALESCE(sum(%I),0)', column_name, column_name),
                    ', ' ORDER BY column_name) AS sums
  FROM present GROUP BY table_name
)
SELECT string_agg(
  CASE WHEN a.sums IS NULL THEN
    format('SELECT %L AS table_name, (SELECT count(*) FROM public.%I) AS row_count, '
           '''{}''::json AS sums', wt.tbl, wt.tbl)
  ELSE
    format('SELECT %L AS table_name, (SELECT count(*) FROM public.%I) AS row_count, '
           '(SELECT json_build_object(%s) FROM public.%I) AS sums',
           wt.tbl, wt.tbl, a.sums, wt.tbl)
  END,
  E'\nUNION ALL\n' ORDER BY wt.tbl)
FROM want_tbl wt
LEFT JOIN agg a ON a.table_name = wt.tbl
WHERE EXISTS (SELECT 1 FROM information_schema.tables it
              WHERE it.table_schema='public' AND it.table_name = wt.tbl);
SQL

echo "→ ตรวจคอลัมน์จริงและสร้าง aggregate SQL…"
INNER_SQL=$(printf '%s\n' "$GEN_SQL" | "$PSQL" "$DB_URL" -X -A -t \
  -v tables="$CRITICAL_TABLES" -v moneycols="$MONEY_COLS" -f -)

if [ -z "${INNER_SQL// }" ]; then
  echo "❌ ไม่พบตารางใดใน CRITICAL_TABLES เลย — หยุด" >&2
  exit 1
fi

echo "→ เก็บ row count + financial aggregate…"
"$PSQL" "$DB_URL" -X -A -t -c "
WITH m AS ($INNER_SQL)
SELECT json_build_object(
  'collected_at', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'),
  'server_version', current_setting('server_version'),
  'database_size_bytes', pg_database_size(current_database()),
  'tables', json_agg(json_build_object(
      'table', table_name, 'row_count', row_count, 'sums', sums) ORDER BY table_name),
  'object_counts', (SELECT json_build_object(
      'tables',    (SELECT count(*) FROM information_schema.tables    WHERE table_schema='public' AND table_type='BASE TABLE'),
      'views',     (SELECT count(*) FROM information_schema.views     WHERE table_schema='public'),
      'functions', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
      'triggers',  (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal),
      'indexes',   (SELECT count(*) FROM pg_indexes WHERE schemaname='public'),
      'policies',  (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
      'sequences', (SELECT count(*) FROM information_schema.sequences WHERE sequence_schema='public')))
) FROM m;" > "$OUT_DIR/metrics.json"

if [ ! -s "$OUT_DIR/metrics.json" ]; then
  echo "❌ metrics.json ว่าง — หยุด" >&2
  exit 1
fi

echo "✅ metrics.json สร้างแล้ว"
