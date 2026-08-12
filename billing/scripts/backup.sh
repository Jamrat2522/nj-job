#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# backup.sh — Independent Backup (Layer 2)  ·  Supabase Production → dump files
# ───────────────────────────────────────────────────────────────────────────
# READ-ONLY ต่อ Production : pg_dump ไม่เขียนอะไรลง DB
# ห้าม log secret          : ไม่ echo $DB_URL · psql/pg_dump รับผ่าน env เท่านั้น
# Output:
#   schema.sql          — DDL ครบ: tables, columns, defaults, sequences,
#                          constraints, PK/FK/unique, functions, RPC, triggers,
#                          views, indexes, RLS, policies, grants
#   data.dump           — ข้อมูลทั้งหมด (custom format · restore ได้จริง)
#   *.sha256            — checksum
#   metrics.json        — row count + financial aggregate (จาก collect_metrics.sh)
#   backup.json         — metadata
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

: "${DB_URL:?DB_URL not set}"
OUT_DIR="${OUT_DIR:-./backup-out}"
SCHEMAS="${SCHEMAS:-public}"
PROJECT_ID="${PROJECT_ID:-unknown}"
RUNNER="${RUNNER:-github-actions}"
BACKUP_TYPE="${BACKUP_TYPE:-daily}"
PG_DUMP="${PG_DUMP:-pg_dump}"
PSQL="${PSQL:-psql}"

mkdir -p "$OUT_DIR"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

SCHEMA_ARGS=()
IFS=',' read -ra _S <<< "$SCHEMAS"
for s in "${_S[@]}"; do SCHEMA_ARGS+=( --schema="$(echo "$s" | xargs)" ); done

# ── 0) ตรวจ version compatibility — pg_dump ต้อง >= server ──────────────────
SERVER_VER="$("$PSQL" "$DB_URL" -X -A -t -c "SHOW server_version_num;" | tr -d '[:space:]')"
DUMP_VER="$("$PG_DUMP" --version | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)"
SERVER_MAJOR=$(( SERVER_VER / 10000 ))
echo "→ server major=$SERVER_MAJOR · pg_dump major=$DUMP_VER"
if [ "$DUMP_VER" -lt "$SERVER_MAJOR" ]; then
  echo "❌ pg_dump ($DUMP_VER) เก่ากว่า server ($SERVER_MAJOR) — dump ไม่ได้ หยุดทันที" >&2
  exit 1
fi

# ── 1) SCHEMA DUMP (เก็บ grants/policies ไว้ด้วย — ห้ามใส่ -x) ──────────────
echo "→ dump schema…"
SCHEMA_RC=0
"$PG_DUMP" "$DB_URL" \
  --schema-only \
  "${SCHEMA_ARGS[@]}" \
  --no-publications \
  --no-subscriptions \
  --file="$OUT_DIR/schema.sql" || SCHEMA_RC=$?

# ── 2) DATA DUMP (custom format · บีบอัด · restore เลือกส่วนได้) ────────────
echo "→ dump data…"
DATA_RC=0
"$PG_DUMP" "$DB_URL" \
  --data-only \
  "${SCHEMA_ARGS[@]}" \
  --format=custom \
  --compress=9 \
  --file="$OUT_DIR/data.dump" || DATA_RC=$?

COMPLETED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ── 3) CHECKSUM ────────────────────────────────────────────────────────────
( cd "$OUT_DIR" && sha256sum schema.sql > schema.sql.sha256 || true )
( cd "$OUT_DIR" && sha256sum data.dump  > data.dump.sha256  || true )

SCHEMA_SIZE=$(stat -c%s "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
DATA_SIZE=$(stat -c%s "$OUT_DIR/data.dump"  2>/dev/null || echo 0)
SCHEMA_SHA=$(cut -d' ' -f1 "$OUT_DIR/schema.sql.sha256" 2>/dev/null || echo "")
DATA_SHA=$(cut -d' ' -f1 "$OUT_DIR/data.dump.sha256"  2>/dev/null || echo "")
DB_SIZE=$("$PSQL" "$DB_URL" -X -A -t -c "SELECT pg_database_size(current_database());" | tr -d '[:space:]')

# ── 4) METADATA (§12) — ห้ามมี secret ──────────────────────────────────────
cat > "$OUT_DIR/backup.json" <<JSON
{
  "project_id": "$PROJECT_ID",
  "backup_type": "$BACKUP_TYPE",
  "runner": "$RUNNER",
  "started_at": "$STARTED_AT",
  "completed_at": "$COMPLETED_AT",
  "database_version": "$($PSQL "$DB_URL" -X -A -t -c 'SHOW server_version;' | tr -d '\n')",
  "backup_tool": "pg_dump",
  "backup_tool_version": "$($PG_DUMP --version | head -1)",
  "schemas": "$SCHEMAS",
  "database_size_bytes": ${DB_SIZE:-0},
  "schema_file_size_bytes": $SCHEMA_SIZE,
  "data_file_size_bytes": $DATA_SIZE,
  "schema_sha256": "$SCHEMA_SHA",
  "data_sha256": "$DATA_SHA",
  "schema_dump_exit_code": $SCHEMA_RC,
  "data_dump_exit_code": $DATA_RC
}
JSON

echo "→ schema=${SCHEMA_SIZE}B rc=$SCHEMA_RC · data=${DATA_SIZE}B rc=$DATA_RC"
if [ "$SCHEMA_RC" -ne 0 ] || [ "$DATA_RC" -ne 0 ]; then
  echo "❌ pg_dump exit code ไม่เป็น 0 — ถือว่า FAILED" >&2
  exit 1
fi
echo "✅ dump เสร็จ"
