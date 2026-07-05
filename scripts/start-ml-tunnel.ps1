param(
  [switch]$UpdateSecret,
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$mlOk = $false
try {
  Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 3 | Out-Null
  $mlOk = $true
} catch {
  Write-Host "ML service belum jalan di port $Port."
  Write-Host "Jalankan di terminal terpisah:"
  Write-Host "  cd ml-service"
  Write-Host "  python -m uvicorn main:app --host 0.0.0.0 --port $Port"
  Write-Host "  (atau: ml-service\start.bat)"
  exit 1
}

Write-Host "Memulai Cloudflare Quick Tunnel ke localhost:$Port ..."
$log = Join-Path $env:TEMP "e-insight-ml-tunnel.log"
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
Write-Host "ML tunnel aktif: $url"
Write-Host "Health check   : $url/health"
Write-Host "PID tunnel     : $($proc.Id)  (hentikan: Stop-Process -Id $($proc.Id))"
Write-Host ""

if ($UpdateSecret) {
  & (Join-Path $root "scripts\sync-ml-url.ps1") -Url $url
} else {
  Write-Host "Opsional — sync ke production:"
  Write-Host "  .\scripts\start-ml-tunnel.ps1 -UpdateSecret"
}

Write-Host ""
Write-Host "Catatan: URL berubah tiap restart tunnel. PC harus nyala + ml-service running."
