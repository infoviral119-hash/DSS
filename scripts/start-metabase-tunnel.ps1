param(
  [switch]$UpdateSecret,
  [string]$DashboardPath = "",
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$mbOk = $false
try {
  Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
  $mbOk = $true
} catch {
  Write-Host "Metabase belum jalan di port $Port."
  Write-Host "Jalankan: npm run metabase:start"
  exit 1
}

Write-Host "Memulai Cloudflare Quick Tunnel ke localhost:$Port ..."
$log = Join-Path $env:TEMP "e-insight-metabase-tunnel.log"
if (Test-Path $log) { Remove-Item $log }

$proc = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:$Port","--logfile",$log,"--loglevel","info" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 8

$url = $null
if (Test-Path $log) {
  $match = Select-String -Path $log -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1
  if ($match) { $url = $match.Matches[0].Value }
}

if (-not $url) {
  Write-Host "Tunnel URL belum terdeteksi. Cek log: $log"
  Write-Host "PID tunnel: $($proc.Id)"
  exit 1
}

Write-Host ""
Write-Host "Metabase tunnel aktif: $url"
Write-Host "Admin UI            : $url"
Write-Host "PID tunnel          : $($proc.Id)  (hentikan: Stop-Process -Id $($proc.Id))"
Write-Host ""

if (-not $DashboardPath) {
  Write-Host "Setelah publish dashboard, sync embed URL:" -ForegroundColor Cyan
  Write-Host "  .\scripts\sync-metabase-url.ps1 -TunnelUrl $url -DashboardPath /public/dashboard/<uuid>"
  Write-Host ""
}

if ($UpdateSecret) {
  if (-not $DashboardPath) {
    Write-Host "UpdateSecret butuh -DashboardPath (path public dashboard dari Metabase)." -ForegroundColor Yellow
    Write-Host "Contoh: .\scripts\start-metabase-tunnel.ps1 -UpdateSecret -DashboardPath /public/dashboard/abc-123"
    exit 1
  }
  & (Join-Path $root "scripts\sync-metabase-url.ps1") -TunnelUrl $url -DashboardPath $DashboardPath
} else {
  Write-Host "Opsional - sync ke production:" -ForegroundColor DarkGray
  Write-Host "  .\scripts\start-metabase-tunnel.ps1 -UpdateSecret -DashboardPath /public/dashboard/<uuid>"
}

Write-Host ""
Write-Host "Catatan: URL berubah tiap restart tunnel. PC + Docker harus nyala."
