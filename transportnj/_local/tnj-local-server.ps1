# TRANSPORT NJ - local launcher / static HTTP server (Windows PowerShell 5.1+ / PowerShell 7)
# Serves the extracted "Open check" folder over http://localhost (never file://).
# The app still talks to the real Supabase project; this server only serves HTML/JS/CSS.
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [string]$Ports = '8080,8081,8082,8083,8084,8085,8086,8087,8088,8089',
  [switch]$NoBrowser,
  [switch]$NoPause
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$APP = 'TRANSPORT NJ'
$Root = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/')
$PageRel = 'transportnj/index.html'
$PortList = @($Ports -split '[,; ]+' | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ })
if ($PortList.Count -eq 0) { $PortList = @(8080) }

function Fail([string]$msg, [int]$code = 1) {
  Write-Host ''
  Write-Host ('❌ ' + $msg) -ForegroundColor Red
  Write-Host ''
  if (-not $NoPause) { Read-Host 'กด Enter เพื่อปิดหน้าต่าง' | Out-Null }
  exit $code
}
function Info([string]$msg) { Write-Host $msg -ForegroundColor Cyan }
function Ok([string]$msg) { Write-Host ('✅ ' + $msg) -ForegroundColor Green }

# ---- 1) environment check: required files ----
$required = @('transportnj/index.html', 'transportnj/sw.js', 'transportnj/manifest.webmanifest',
  'transportnj/assets/css/app.css', 'transportnj/assets/js/config.js', 'transportnj/assets/js/core.js',
  'transportnj/assets/js/office.js', 'transportnj/assets/js/driver.js')
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $Root $_)) })
if ($missing.Count -gt 0) { Fail ("เปิด $APP ไม่สำเร็จ: ไม่พบไฟล์ระบบ`n   " + ($missing -join "`n   ") + "`n   (โฟลเดอร์: $Root)") 2 }
$cfg = Get-Content -LiteralPath (Join-Path $Root 'transportnj/assets/js/config.js') -Raw -Encoding UTF8
$m = [regex]::Match($cfg, "APP_VERSION:\s*'([^']+)'")
$LocalVersion = if ($m.Success) { $m.Groups[1].Value } else { 'unknown' }
Info "$APP LOCAL VERSION: $LocalVersion"
Info "โฟลเดอร์: $Root"

# ---- 2) port: reuse an existing TRANSPORT NJ server for this same folder, else pick a free port ----
function Probe([int]$port) {
  # returns: 'self' (our server, same folder) | 'other' (port used by something else) | 'free'
  try {
    $r = Invoke-WebRequest -Uri ("http://localhost:{0}/__tnj_local__" -f $port) -UseBasicParsing -TimeoutSec 2
    $j = $r.Content | ConvertFrom-Json
    if ($j.app -eq $APP -and ([string]$j.root).TrimEnd('\', '/') -ieq $Root) { return 'self' }
    return 'other'
  } catch {
    $resp = $_.Exception.Response
    if ($null -ne $resp) { return 'other' }      # something answered (404 etc.) -> port in use
    try { $c = New-Object System.Net.Sockets.TcpClient; $iar = $c.BeginConnect('127.0.0.1', $port, $null, $null); $okc = $iar.AsyncWaitHandle.WaitOne(300); if ($okc -and $c.Connected) { $c.Close(); return 'other' }; $c.Close() } catch { }
    return 'free'
  }
}
function OpenBrowser([string]$url) {
  if ($NoBrowser) { Info "URL: $url"; return }
  try { Start-Process $url | Out-Null; Ok "เปิด Browser: $url" }
  catch { Write-Host ("⚠ เปิด Browser อัตโนมัติไม่ได้ กรุณาเปิดเองที่: " + $url) -ForegroundColor Yellow }
}

$listener = $null; $port = $null
foreach ($p in $PortList) {
  $st = Probe $p
  if ($st -eq 'self') {
    Ok "$APP กำลังทำงานอยู่แล้วที่ http://localhost:$p/ (ไม่เปิด Server ซ้ำ)"
    OpenBrowser ("http://localhost:{0}/{1}" -f $p, $PageRel)
    exit 0
  }
  if ($st -eq 'other') { Write-Host ("Port $p ถูกโปรแกรมอื่นใช้อยู่ → ลอง Port ถัดไป") -ForegroundColor Yellow; continue }
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add(("http://localhost:{0}/" -f $p))
    $l.Start(); $listener = $l; $port = $p; break
  } catch { Write-Host ("Port $p เริ่มไม่ได้ (" + $_.Exception.Message + ") → ลอง Port ถัดไป") -ForegroundColor Yellow }
}
if ($null -eq $listener) { Fail ("Local Server ไม่สามารถเริ่มทำงานได้ (Port " + ($PortList -join ', ') + " ถูกใช้งานทั้งหมด)") 3 }

$base = "http://localhost:$port/"
Ok "Local Server เริ่มทำงานแล้ว: $base"
Write-Host '   ⚠ อย่าปิดหน้าต่างนี้ระหว่างใช้งาน TRANSPORT NJ (ปิดหน้าต่าง = หยุด Server)' -ForegroundColor Yellow
Write-Host '   ข้อมูลทั้งหมดยังอ่าน/บันทึกจาก Supabase จริง — Server นี้ส่งเฉพาะไฟล์หน้าเว็บ' -ForegroundColor Gray
OpenBrowser ($base + $PageRel)

# ---- 3) serve ----
$mime = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json; charset=utf-8'; '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.jpg' = 'image/jpeg';
  '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.md' = 'text/plain; charset=utf-8' }
$rootFull = [System.IO.Path]::GetFullPath($Root + [System.IO.Path]::DirectorySeparatorChar)
function Send($ctx, [int]$code, [byte[]]$bytes, [string]$type) {
  $res = $ctx.Response; $res.StatusCode = $code; $res.ContentType = $type
  $res.Headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
  $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length); $res.OutputStream.Close()
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/__tnj_local__') {
      $j = @{ app = $APP; root = $Root; version = $LocalVersion; port = $port } | ConvertTo-Json -Compress
      Send $ctx 200 ($utf8.GetBytes($j)) 'application/json; charset=utf-8'; continue
    }
    if ($path -eq '/' -or $path -eq '/transportnj' -or $path -eq '/transportnj/') { $ctx.Response.Redirect('/' + $PageRel); $ctx.Response.Close(); continue }
    $rel = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
      Send $ctx 404 ($utf8.GetBytes('404 Not Found')) 'text/plain; charset=utf-8'; continue
    }
    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    if ($ext -eq '.sql' -or $ext -eq '.ps1' -or $ext -eq '.bat') { Send $ctx 403 ($utf8.GetBytes('403 Forbidden')) 'text/plain; charset=utf-8'; continue }
    $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    Send $ctx 200 ([System.IO.File]::ReadAllBytes($full)) $type
  } catch { try { $ctx.Response.Abort() } catch { } }
}
