#!/usr/bin/env bash
# ============================================================
# verify-netlify.sh — ตรวจ Response Header จากเว็บจริงหลัง Deploy
#
# ใช้:  ./verify-netlify.sh https://yourdomain.netlify.app <BUILD>
# เช่น: ./verify-netlify.sh https://nj-hr.netlify.app 64e9dacd
#
# อ่านอย่างเดียว ไม่เปลี่ยนอะไรบนเซิร์ฟเวอร์
# ============================================================
set -u
URL="${1:-}"; BUILD="${2:-}"
if [ -z "$URL" ] || [ -z "$BUILD" ]; then
  echo "ใช้: $0 <https://โดเมน> <BUILD>"; exit 1
fi
URL="${URL%/}"

hdr() { curl -sI -H "Accept-Encoding: $2" "$1" | tr -d '\r'; }
get() { echo "$1" | grep -i "^$2:" | head -1 | cut -d' ' -f2- ; }

check() {
  local path="$1" enc="$2" want_enc="$3" want_cc="$4"
  local h; h="$(hdr "$URL$path" "$enc")"
  local st ce cc cl
  st="$(echo "$h" | head -1)"
  ce="$(get "$h" content-encoding)"; cc="$(get "$h" cache-control)"; cl="$(get "$h" content-length)"
  printf "%-34s %s\n" "$path" "$st"
  printf "   content-encoding : %-12s %s\n" "${ce:-(ไม่มี)}" \
    "$( [ -n "$want_enc" ] && { [ "${ce:-}" = "$want_enc" ] && echo 'ผ่าน' || echo "ไม่ผ่าน (ต้องการ $want_enc)"; } )"
  printf "   cache-control    : %-40s %s\n" "${cc:-(ไม่มี)}" \
    "$( [ -n "$want_cc" ] && { case "${cc:-}" in *"$want_cc"*) echo 'ผ่าน';; *) echo "ไม่ผ่าน (ต้องมี $want_cc)";; esac; } )"
  [ -n "$cl" ] && printf "   content-length   : %s ไบต์\n" "$cl"
  echo
}

echo "=== 1) การบีบอัด — Brotli ==="
check "/app.js?v=$BUILD"     "br" "br" "immutable"
check "/styles.css?v=$BUILD" "br" "br" "immutable"
check "/mobile.css?v=$BUILD" "br" "br" "immutable"

echo "=== 2) การบีบอัด — gzip (เบราว์เซอร์เก่า) ==="
check "/app.js?v=$BUILD" "gzip" "gzip" "immutable"

echo "=== 3) ไฟล์ที่ห้ามแคช ==="
check "/"          "br" "" "no-store"
check "/config.js" "br" "" "no-store"
check "/sw.js"     "br" "" "no-cache"

echo "=== 4) เทียบขนาดก่อน/หลังบีบอัด (app.js) ==="
RAW="$(get "$(hdr "$URL/app.js?v=$BUILD" identity)" content-length)"
BR="$(get "$(hdr "$URL/app.js?v=$BUILD" br)" content-length)"
GZ="$(get "$(hdr "$URL/app.js?v=$BUILD" gzip)" content-length)"
echo "   ไม่บีบอัด : ${RAW:-?} ไบต์"
echo "   brotli    : ${BR:-?} ไบต์"
echo "   gzip      : ${GZ:-?} ไบต์"
if [ -n "${RAW:-}" ] && [ -n "${BR:-}" ] && [ "$RAW" -gt 0 ] 2>/dev/null; then
  echo "   ลดลง (br) : $(( 100 - BR * 100 / RAW ))%"
fi
