#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# upload_gdrive.sh — อัปโหลด backup ไป Google Drive (นอก Supabase Production)
# ───────────────────────────────────────────────────────────────────────────
# โครงสร้างปลายทาง : Billing/YYYY/MM/DD/
# Secret            : รับผ่าน env var เท่านั้น — ไม่เขียน rclone.conf ลงดิสก์
#                     (ยืนยันแล้วว่า RCLONE_CONFIG_GD_TYPE=drive ใช้ได้จริง
#                      โดยไม่ต้องมีไฟล์ config — rclone v1.68.2)
# ห้าม log secret   : ไม่ echo credentials · ใช้ -q
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

OUT_DIR="${OUT_DIR:-./backup-out}"
: "${GDRIVE_SA_JSON:?GDRIVE_SA_JSON not set}"          # Service Account JSON (GitHub Secret)
: "${GDRIVE_ROOT_FOLDER_ID:?GDRIVE_ROOT_FOLDER_ID not set}"
RCLONE="${RCLONE:-rclone}"
BASE_DIR="${GDRIVE_BASE_DIR:-Billing}"

DATE_PATH="$(TZ=Asia/Bangkok date +%Y/%m/%d)"
STAMP="$(TZ=Asia/Bangkok date +%H%M%S)"
DEST="gd:${BASE_DIR}/${DATE_PATH}/${STAMP}"

export RCLONE_CONFIG_GD_TYPE="drive"
export RCLONE_CONFIG_GD_SERVICE_ACCOUNT_CREDENTIALS="$GDRIVE_SA_JSON"
export RCLONE_CONFIG_GD_ROOT_FOLDER_ID="$GDRIVE_ROOT_FOLDER_ID"
export RCLONE_CONFIG_GD_SCOPE="drive"

echo "→ upload → ${BASE_DIR}/${DATE_PATH}/${STAMP}/"

# อัปโหลดเฉพาะไฟล์ที่ต้องเก็บ (ไม่รวมไฟล์ชั่วคราว .toc.txt / .restore_err.txt)
for f in schema.sql schema.sql.sha256 data.dump data.dump.sha256 \
         backup.json metrics.json verification.json restore_test.json; do
  [ -f "$OUT_DIR/$f" ] || continue
  "$RCLONE" copyto -q "$OUT_DIR/$f" "$DEST/$f" \
    --drive-chunk-size 32M --retries 3 --low-level-retries 5
done

# ── VERIFY ปลายทาง: ไฟล์ขึ้นครบและขนาดตรง ────────────────────────────────
echo "→ ตรวจไฟล์ปลายทาง…"
REMOTE_LIST="$("$RCLONE" lsf --format "ps" "$DEST" 2>/dev/null || true)"
MISSING=""
for f in schema.sql data.dump backup.json metrics.json verification.json; do
  [ -f "$OUT_DIR/$f" ] || continue
  local_size=$(stat -c%s "$OUT_DIR/$f")
  remote_size=$(echo "$REMOTE_LIST" | awk -F';' -v n="$f" '$1==n{print $2}')
  if [ -z "$remote_size" ]; then MISSING="$MISSING $f(หาย)"
  elif [ "$remote_size" != "$local_size" ]; then MISSING="$MISSING $f(ขนาดไม่ตรง $local_size≠$remote_size)"
  else echo "  ✅ $f ($local_size B)"; fi
done

if [ -n "$MISSING" ]; then
  echo "❌ อัปโหลดไม่ครบ:$MISSING" >&2
  exit 1
fi

echo "✅ อัปโหลดครบ → ${BASE_DIR}/${DATE_PATH}/${STAMP}/"
echo "GDRIVE_PATH=${BASE_DIR}/${DATE_PATH}/${STAMP}" >> "${GITHUB_ENV:-/dev/null}"
