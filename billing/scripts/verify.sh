#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# verify.sh — Verification บังคับ 8 ข้อ (§14)
# ───────────────────────────────────────────────────────────────────────────
# ผ่านครบ 8 → SUCCESS
# ไม่ผ่านข้อ non-critical → WARNING
# ไม่ผ่านข้อ critical     → FAILED
# ไม่มีทางที่ status = SUCCESS ถ้ามีข้อใดไม่ผ่าน
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

OUT_DIR="${OUT_DIR:-./backup-out}"
PG_RESTORE="${PG_RESTORE:-pg_restore}"
CRITICAL_TABLES="${CRITICAL_TABLES:-service_charge_records,advance_charge_records,app_users}"
REQUIRED_FUNCS="${REQUIRED_FUNCS:-}"     # เว้นว่าง = ตรวจว่ามี function อย่างน้อย 1 ตัว

PASS=0; FAIL=0; WARN=0
RESULTS=()

chk(){  # chk <name> <critical:yes|no> <status:PASS|FAIL|WARN> <detail>
  local n="$1" c="$2" s="$3" d="$4"
  RESULTS+=("$(printf '{"check":"%s","critical":"%s","status":"%s","detail":"%s"}' "$n" "$c" "$s" "${d//\"/\'}")")
  case "$s" in
    PASS) PASS=$((PASS+1)); echo "  ✅ $n — $d";;
    WARN) WARN=$((WARN+1)); echo "  ⚠  $n — $d";;
    *)    FAIL=$((FAIL+1)); echo "  ❌ $n — $d";;
  esac
}

echo "═══ VERIFICATION (8 ข้อ) ═══"

# ── 1) exit code ของ backup process ────────────────────────────────────────
if [ -f "$OUT_DIR/backup.json" ]; then
  rc_s=$(grep -o '"schema_dump_exit_code": *[0-9]*' "$OUT_DIR/backup.json" | grep -o '[0-9]*$')
  rc_d=$(grep -o '"data_dump_exit_code": *[0-9]*'   "$OUT_DIR/backup.json" | grep -o '[0-9]*$')
  if [ "${rc_s:-1}" = "0" ] && [ "${rc_d:-1}" = "0" ]; then
    chk "1_exit_code" yes PASS "schema=0 data=0"
  else
    chk "1_exit_code" yes FAIL "schema=${rc_s:-?} data=${rc_d:-?}"
  fi
else
  chk "1_exit_code" yes FAIL "ไม่พบ backup.json"
fi

# ── 2) schema file exists ──────────────────────────────────────────────────
[ -f "$OUT_DIR/schema.sql" ] \
  && chk "2_schema_exists" yes PASS "schema.sql พบ" \
  || chk "2_schema_exists" yes FAIL "ไม่พบ schema.sql"

# ── 3) data file exists ────────────────────────────────────────────────────
[ -f "$OUT_DIR/data.dump" ] \
  && chk "3_data_exists" yes PASS "data.dump พบ" \
  || chk "3_data_exists" yes FAIL "ไม่พบ data.dump"

# ── 4) file size > 0 ───────────────────────────────────────────────────────
ss=$(stat -c%s "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
ds=$(stat -c%s "$OUT_DIR/data.dump"  2>/dev/null || echo 0)
if [ "$ss" -gt 0 ] && [ "$ds" -gt 0 ]; then
  chk "4_file_size" yes PASS "schema=${ss}B data=${ds}B"
else
  chk "4_file_size" yes FAIL "schema=${ss}B data=${ds}B"
fi

# ── 5) checksum valid ──────────────────────────────────────────────────────
cs_ok=1
for f in schema.sql data.dump; do
  if [ -f "$OUT_DIR/$f.sha256" ]; then
    ( cd "$OUT_DIR" && sha256sum -c "$f.sha256" >/dev/null 2>&1 ) || cs_ok=0
  else cs_ok=0; fi
done
[ "$cs_ok" = "1" ] \
  && chk "5_checksum" yes PASS "sha256 ตรงทั้ง 2 ไฟล์" \
  || chk "5_checksum" yes FAIL "checksum ไม่ตรง หรือไม่มีไฟล์ .sha256"

# ── 6) critical tables อยู่ใน backup จริง (ตรวจทั้ง schema + data TOC) ─────
missing=""
toc="$OUT_DIR/.toc.txt"
"$PG_RESTORE" -l "$OUT_DIR/data.dump" > "$toc" 2>/dev/null || true
IFS=',' read -ra TBLS <<< "$CRITICAL_TABLES"
for t in "${TBLS[@]}"; do
  t="$(echo "$t" | xargs)"
  in_schema=0; in_data=0
  grep -qE "CREATE TABLE (public\.)?\"?$t\"?" "$OUT_DIR/schema.sql" 2>/dev/null && in_schema=1
  grep -qE "TABLE DATA public $t( |$)" "$toc" 2>/dev/null && in_data=1
  [ "$in_schema" = "1" ] && [ "$in_data" = "1" ] || missing="$missing $t(schema=$in_schema,data=$in_data)"
done
[ -z "$missing" ] \
  && chk "6_critical_tables" yes PASS "ครบทุกตาราง: $CRITICAL_TABLES" \
  || chk "6_critical_tables" yes FAIL "ขาด:$missing"

# ── 7) row counts ถูกบันทึก ────────────────────────────────────────────────
if [ -f "$OUT_DIR/metrics.json" ] && grep -q '"row_count"' "$OUT_DIR/metrics.json"; then
  zero=$(grep -c '"row_count": *0' "$OUT_DIR/metrics.json" || true)
  if [ "${zero:-0}" -gt 0 ]; then
    chk "7_row_counts" no WARN "บันทึกแล้ว แต่มี $zero ตารางที่ count=0 — ตรวจสอบ"
  else
    chk "7_row_counts" yes PASS "บันทึก row count ครบ"
  fi
else
  chk "7_row_counts" yes FAIL "ไม่พบ metrics.json หรือไม่มี row_count"
fi

# ── 8) functions / RPC / policies อยู่ใน schema backup ──────────────────────
n_func=$(grep -cE '^CREATE (OR REPLACE )?FUNCTION' "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
n_pol=$(grep -cE '^CREATE POLICY'                  "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
n_rls=$(grep -cE 'ENABLE ROW LEVEL SECURITY'       "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
n_trg=$(grep -cE '^CREATE TRIGGER'                 "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
n_idx=$(grep -cE '^CREATE (UNIQUE )?INDEX'         "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
n_grant=$(grep -cE '^GRANT '                       "$OUT_DIR/schema.sql" 2>/dev/null || echo 0)
missing_fn=""
if [ -n "$REQUIRED_FUNCS" ]; then
  IFS=',' read -ra FNS <<< "$REQUIRED_FUNCS"
  for f in "${FNS[@]}"; do
    f="$(echo "$f" | xargs)"
    grep -qE "FUNCTION (public\.)?\"?$f\"?\(" "$OUT_DIR/schema.sql" || missing_fn="$missing_fn $f"
  done
fi
if [ "$n_func" -gt 0 ] && [ "$n_pol" -gt 0 ] && [ -z "$missing_fn" ]; then
  chk "8_logic_objects" yes PASS "func=$n_func policy=$n_pol rls=$n_rls trigger=$n_trg index=$n_idx grant=$n_grant"
elif [ -n "$missing_fn" ]; then
  chk "8_logic_objects" yes FAIL "RPC ที่ต้องมีแต่ไม่อยู่ใน backup:$missing_fn"
else
  chk "8_logic_objects" yes FAIL "func=$n_func policy=$n_pol — schema backup ไม่ครบ"
fi

# ── สรุป ───────────────────────────────────────────────────────────────────
if [ "$FAIL" -gt 0 ]; then STATUS="FAILED"
elif [ "$WARN" -gt 0 ]; then STATUS="WARNING"
else STATUS="SUCCESS"; fi

{
  printf '{"verification_status":"%s","pass":%d,"warn":%d,"fail":%d,"checks":[' "$STATUS" "$PASS" "$WARN" "$FAIL"
  printf '%s' "$(IFS=,; echo "${RESULTS[*]}")"
  printf ']}\n'
} > "$OUT_DIR/verification.json"

echo "═══ STATUS = $STATUS (pass=$PASS warn=$WARN fail=$FAIL) ═══"
[ "$STATUS" = "FAILED" ] && exit 1
exit 0
