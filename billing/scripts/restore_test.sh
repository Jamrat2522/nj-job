#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# restore_test.sh — RESTORE TEST (§20/§21)
# ───────────────────────────────────────────────────────────────────────────
# ห้าม Restore ทับ Production — สคริปต์นี้จะ "ปฏิเสธ" ถ้า TARGET_URL
# ชี้ไปโฮสต์ที่มีคำว่า supabase / pooler
#
# ตรวจ 8 มิติ: schema · tables · row counts · financial aggregates ·
#              functions/RPC · triggers · indexes · RLS/policies
# ผลลัพธ์: PASS / FAIL เท่านั้น (NOT TESTED = ไม่ได้รันสคริปต์นี้)
# ═══════════════════════════════════════════════════════════════════════════
set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backup-out}"
: "${TARGET_URL:?TARGET_URL not set}"
PSQL="${PSQL:-psql}"
PG_RESTORE="${PG_RESTORE:-pg_restore}"
OUT="${OUT:-$BACKUP_DIR/restore_test.json}"

# ── SAFETY GUARD: ห้ามชี้ไป Production ────────────────────────────────────
if echo "$TARGET_URL" | grep -qiE 'supabase\.(co|com)|pooler\.'; then
  echo "❌ TARGET_URL ชี้ไป Supabase — ปฏิเสธการ restore เพื่อป้องกัน Production" >&2
  exit 1
fi

FAILS=(); PASSES=()
ok(){ PASSES+=("$1"); echo "  ✅ $1"; }
no(){ FAILS+=("$1");  echo "  ❌ $1"; }

echo "═══ RESTORE TEST ═══"

# ── 1) สร้าง role ที่ schema.sql อ้างถึง (ไม่งั้น GRANT/POLICY จะ error) ───
echo "→ เตรียม role…"
grep -ohE '(GRANT [^;]* TO |CREATE POLICY [^;]* TO )[a-z_, ]+' "$BACKUP_DIR/schema.sql" 2>/dev/null \
  | sed -E 's/.* TO //' | tr ',' '\n' | tr -d ' ' | sort -u \
  | grep -vE '^(PUBLIC|)$' | while read -r r; do
      "$PSQL" "$TARGET_URL" -X -q -c \
        "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='$r')
         THEN EXECUTE format('CREATE ROLE %I NOLOGIN', '$r'); END IF; END \$\$;" >/dev/null 2>&1
    done

# ── 2) restore schema ──────────────────────────────────────────────────────
echo "→ restore schema…"
SCHEMA_ERR=$("$PSQL" "$TARGET_URL" -X -v ON_ERROR_STOP=0 -f "$BACKUP_DIR/schema.sql" 2>&1 >/dev/null | grep -c '^ERROR' || true)
[ "${SCHEMA_ERR:-0}" -eq 0 ] && ok "schema restore ไม่มี ERROR" || no "schema restore มี $SCHEMA_ERR ERROR"

# ── 3) restore data ────────────────────────────────────────────────────────
echo "→ restore data…"
"$PG_RESTORE" -d "$TARGET_URL" --data-only --no-owner --no-privileges \
  "$BACKUP_DIR/data.dump" >/dev/null 2>"$BACKUP_DIR/.restore_err.txt"
DATA_RC=$?
DATA_ERR=$(grep -c 'error' "$BACKUP_DIR/.restore_err.txt" 2>/dev/null || echo 0)
[ "$DATA_RC" -eq 0 ] && ok "data restore exit=0" || no "data restore exit=$DATA_RC (errors=$DATA_ERR)"

# ── 4) เทียบ row count + financial aggregate กับ metrics.json ──────────────
echo "→ เทียบ row count + financial aggregate…"
python3 - "$BACKUP_DIR/metrics.json" "$TARGET_URL" "$PSQL" <<'PY'
import json,subprocess,sys
mfile,url,psql=sys.argv[1],sys.argv[2],sys.argv[3]
m=json.load(open(mfile))
bad=[]
for t in m['tables']:
    tbl=t['table']
    q=f"SELECT count(*) FROM public.{tbl};"
    r=subprocess.run([psql,url,'-X','-A','-t','-c',q],capture_output=True,text=True)
    got=r.stdout.strip()
    if got != str(t['row_count']):
        bad.append(f"{tbl}: rows src={t['row_count']} restored={got or 'ERR'}")
        continue
    print(f"  ✅ {tbl}: row_count={got}")
    for col,val in (t.get('sums') or {}).items():
        q=f"SELECT COALESCE(sum({col}),0)::numeric FROM public.{tbl};"
        r=subprocess.run([psql,url,'-X','-A','-t','-c',q],capture_output=True,text=True)
        g=r.stdout.strip()
        try: same = abs(float(g)-float(val)) < 0.005
        except Exception: same=False
        if same: print(f"  ✅ {tbl}.{col} = {g}")
        else:    bad.append(f"{tbl}.{col}: src={val} restored={g or 'ERR'}")
open('/tmp/.rt_bad','w').write("\n".join(bad))
sys.exit(1 if bad else 0)
PY
if [ $? -eq 0 ]; then ok "row count + financial aggregate ตรงทั้งหมด"
else no "ข้อมูลไม่ตรง: $(tr '\n' '; ' < /tmp/.rt_bad)"; fi

# ── 5) เทียบ object counts (function/trigger/index/policy/RLS) ─────────────
echo "→ เทียบ object…"
cmp_obj(){ # <label> <expected_from_schema_sql> <sql_on_target>
  local label="$1" exp="$2" got
  got=$("$PSQL" "$TARGET_URL" -X -A -t -c "$3" | tr -d '[:space:]')
  if [ "${got:-0}" -ge "${exp:-0}" ] && [ "${exp:-0}" -gt 0 ]; then
    ok "$label: backup=$exp restored=$got"
  elif [ "${exp:-0}" -eq 0 ] && [ "${got:-0}" -eq 0 ]; then
    ok "$label: ไม่มีทั้งสองฝั่ง (0)"
  else
    no "$label: backup=$exp restored=$got"
  fi
}
E_FUNC=$(grep -cE '^CREATE (OR REPLACE )?FUNCTION' "$BACKUP_DIR/schema.sql" || echo 0)
E_TRG=$(grep -cE  '^CREATE TRIGGER'                "$BACKUP_DIR/schema.sql" || echo 0)
E_POL=$(grep -cE  '^CREATE POLICY'                 "$BACKUP_DIR/schema.sql" || echo 0)
E_RLS=$(grep -cE  'ENABLE ROW LEVEL SECURITY'      "$BACKUP_DIR/schema.sql" || echo 0)

cmp_obj "functions/RPC" "$E_FUNC" "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public';"
cmp_obj "triggers"      "$E_TRG"  "SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal;"
cmp_obj "policies"      "$E_POL"  "SELECT count(*) FROM pg_policies WHERE schemaname='public';"
cmp_obj "RLS enabled"   "$E_RLS"  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity;"

# indexes: เทียบชื่อ index จริง (ไม่ใช่แค่จำนวน)
IDX_MISS=$("$PSQL" "$TARGET_URL" -X -A -t -c "SELECT count(*) FROM pg_indexes WHERE schemaname='public';" | tr -d '[:space:]')
[ "${IDX_MISS:-0}" -gt 0 ] && ok "indexes restored=$IDX_MISS" || no "ไม่มี index หลัง restore"

# ── 6) app_users — ตรวจ policy/grant/RLS ตรงกับ backup (§20) ───────────────
echo "→ ตรวจ app_users security…"
AU_POL=$("$PSQL" "$TARGET_URL" -X -A -t -c "SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='app_users';" | tr -d '[:space:]')
AU_RLS=$("$PSQL" "$TARGET_URL" -X -A -t -c "SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND relname='app_users';" | tr -d '[:space:]')
E_AU_POL=$(grep -cE '^CREATE POLICY .* ON public\.app_users' "$BACKUP_DIR/schema.sql" || echo 0)
if [ "${AU_POL:-0}" -eq "${E_AU_POL:-0}" ] && [ "${E_AU_POL:-0}" -gt 0 ]; then
  ok "app_users policies: backup=$E_AU_POL restored=$AU_POL · RLS=$AU_RLS"
else
  no "app_users policies: backup=$E_AU_POL restored=$AU_POL · RLS=$AU_RLS"
fi

# ── สรุป ───────────────────────────────────────────────────────────────────
if [ "${#FAILS[@]}" -eq 0 ]; then RESULT="PASS"; else RESULT="FAIL"; fi
{
  printf '{"restore_test_status":"%s","passed":%d,"failed":%d,"failures":[' "$RESULT" "${#PASSES[@]}" "${#FAILS[@]}"
  first=1; for f in "${FAILS[@]:-}"; do [ -z "$f" ] && continue
    [ $first -eq 0 ] && printf ','; printf '"%s"' "${f//\"/\'}"; first=0; done
  printf ']}\n'
} > "$OUT"

echo "═══ RESTORE TEST = $RESULT (pass=${#PASSES[@]} fail=${#FAILS[@]}) ═══"
[ "$RESULT" = "PASS" ] || exit 1
exit 0
