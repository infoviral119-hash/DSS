param(
  [Parameter(Mandatory = $true)]
  [string]$Hostname,
  [string]$TunnelName = "e-insight-ml",
  [int]$MlPort = 8000,
  [switch]$SyncPages
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "=== Named Cloudflare Tunnel (URL tetap) ===" -ForegroundColor Cyan
Write-Host "Hostname: $Hostname -> localhost:$MlPort"
Write-Host ""

# Health check
try {
  Invoke-WebRequest -Uri "http://localhost:$MlPort/health" -UseBasicParsing -TimeoutSec 3 | Out-Null
} catch {
  Write-Host "Jalankan ML service dulu (port $MlPort):" -ForegroundColor Yellow
  Write-Host "  cd ml-service && python -m uvicorn main:app --host 0.0.0.0 --port $MlPort"
  exit 1
}

Write-Host "[1/5] Login Cloudflare (browser)..." -ForegroundColor Yellow
cloudflared tunnel login
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[2/5] Buat tunnel '$TunnelName'..." -ForegroundColor Yellow
$createOut = cloudflared tunnel create $TunnelName 2>&1 | Out-String
Write-Host $createOut

$credPath = $null
if ($createOut -match 'credentials file at (.+\.json)') {
  $credPath = $Matches[1].Trim()
} else {
  $credPath = Join-Path $env:USERPROFILE ".cloudflared\$TunnelName.json"
  if (-not (Test-Path $credPath)) {
    $jsonFiles = Get-ChildItem (Join-Path $env:USERPROFILE ".cloudflared") -Filter "*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($jsonFiles) { $credPath = $jsonFiles[0].FullName }
  }
}

if (-not $credPath -or -not (Test-Path $credPath)) {
  Write-Host "Credentials tidak ditemukan. Cek folder $env:USERPROFILE\.cloudflared\" -ForegroundColor Red
  exit 1
}

Write-Host "[3/5] Route DNS $Hostname ..." -ForegroundColor Yellow
cloudflared tunnel route dns $TunnelName $Hostname
if ($LASTEXITCODE -ne 0) {
  Write-Host "Route DNS gagal. Pastikan domain ada di Cloudflare DNS zone yang sama dengan akun login." -ForegroundColor Red
  exit 1
}

$configPath = Join-Path $root "cloudflared\config-ml.yml"
$credEsc = $credPath -replace '\\', '/'
@"
tunnel: $TunnelName
credentials-file: $credEsc

ingress:
  - hostname: $Hostname
    service: http://localhost:$MlPort
  - service: http_status:404
"@ | Set-Content -Path $configPath -Encoding UTF8

Write-Host "[4/5] Config: $configPath" -ForegroundColor Green

Write-Host "[5/5] Jalankan tunnel (terminal terpisah, biarkan jalan):" -ForegroundColor Yellow
Write-Host "  cloudflared tunnel --config cloudflared/config-ml.yml run $TunnelName"
Write-Host ""

$publicUrl = "https://$Hostname"
Write-Host "URL tetap: $publicUrl" -ForegroundColor Green
Write-Host "Health    : $publicUrl/health"

if ($SyncPages) {
  & (Join-Path $root "scripts\sync-ml-url.ps1") -Url $publicUrl
}

Write-Host ""
Write-Host "Setelah tunnel running, sync Pages:" -ForegroundColor Cyan
Write-Host "  .\scripts\sync-ml-url.ps1 -Url `"$publicUrl`""
