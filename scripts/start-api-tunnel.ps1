param(
  [switch]$UpdateSecret
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$apiOk = $false
try {
  Invoke-WebRequest -Uri "http://localhost:3001/api" -UseBasicParsing -TimeoutSec 3 | Out-Null
  $apiOk = $true
} catch {
  Write-Host "Backend belum jalan di port 3001. Jalankan: npm run dev:backend"
  exit 1
}

Write-Host "Memulai Cloudflare Quick Tunnel ke localhost:3001 ..."
$log = Join-Path $env:TEMP "e-insight-tunnel.log"
if (Test-Path $log) { Remove-Item $log }

$proc = Start-Process -FilePath "cloudflared" -ArgumentList "tunnel","--url","http://localhost:3001","--logfile",$log,"--loglevel","info" -PassThru -WindowStyle Hidden
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

Write-Host "Tunnel aktif: $url"
Write-Host "PID tunnel: $($proc.Id) (hentikan: Stop-Process -Id $($proc.Id))"

if ($UpdateSecret) {
  Write-Host "Update BACKEND_URL di Cloudflare Pages ..."
  $tmp = Join-Path $env:TEMP "e-insight-backend-url.txt"
  [System.IO.File]::WriteAllText($tmp, $url)
  Get-Content $tmp -Raw | npx wrangler pages secret put BACKEND_URL --project-name=e-insight
  Write-Host "Secret diupdate. Redeploy: npm run deploy:pages"
}

Write-Host ""
Write-Host "Catatan: URL berubah tiap restart tunnel. Jalankan lagi dengan -UpdateSecret setelah restart."
