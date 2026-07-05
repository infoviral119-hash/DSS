param(
  [switch]$Down
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$compose = Join-Path $root "docker\metabase\docker-compose.yml"
$proxyScript = Join-Path $root "scripts\metabase-db-proxy.mjs"
$proxyPort = 15432

function Read-DatabaseHint {
  $backendEnv = Join-Path $root "backend\.env"
  if (-not (Test-Path $backendEnv)) { return $null }
  foreach ($line in Get-Content $backendEnv) {
    if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)$') {
      $url = $Matches[1].Trim().Trim('"')
      if ($url -match '@([^:/]+)') { return $Matches[1] }
    }
    if ($line -match '^\s*SUPABASE_URL\s*=\s*https://([^.]+)\.') {
      return "db.$($Matches[1]).supabase.co"
    }
  }
  return $null
}

function Start-DbProxy {
  $existing = Get-NetTCPConnection -LocalPort $proxyPort -State Listen -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "DB proxy sudah jalan di port $proxyPort" -ForegroundColor DarkGray
    return
  }
  Write-Host "Memulai DB proxy (Docker -> Supabase) di port $proxyPort..." -ForegroundColor Yellow
  Start-Process -FilePath "node" -ArgumentList $proxyScript -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

function Stop-DbProxy {
  Get-NetTCPConnection -LocalPort $proxyPort -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
      if ($proc -and $proc.Path -match 'node') { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    }
}

if ($Down) {
  docker compose -f $compose down
  Stop-DbProxy
  Write-Host "Metabase + DB proxy dihentikan." -ForegroundColor Yellow
  exit 0
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  Write-Host "Docker belum terpasang. Install Docker Desktop lalu jalankan ulang." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== Metabase OSS - e-Insight ===" -ForegroundColor Cyan
Start-DbProxy
Write-Host "Memulai container..." -ForegroundColor Yellow
docker compose -f $compose up -d
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Menunggu Metabase siap (bisa 1-2 menit pertama kali)..." -ForegroundColor DarkGray
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
  try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Seconds 3
  }
}

Write-Host ""
if ($ready) {
  Write-Host "Metabase aktif: http://localhost:3000" -ForegroundColor Green
} else {
  Write-Host "Metabase masih booting - buka http://localhost:3000 dalam beberapa menit." -ForegroundColor Yellow
}

$dbHost = Read-DatabaseHint
Write-Host ""
Write-Host "Setup database Supabase di Metabase (via Docker proxy):" -ForegroundColor Cyan
Write-Host "  Database type : PostgreSQL"
Write-Host "  Host            : host.docker.internal"
Write-Host "  Port            : $proxyPort"
Write-Host "  Database name   : postgres"
Write-Host "  Username        : postgres"
Write-Host "  Password        : (dari backend/.env DATABASE_URL)"
Write-Host "  SSL             : ON, mode require"
Write-Host "  JDBC options    : sslmode=require"
if ($dbHost) { Write-Host "  (Proxy forwards ke $dbHost:5432 - IPv6 fix untuk Docker)" -ForegroundColor DarkGray }
Write-Host ""
Write-Host "Setelah dashboard siap:" -ForegroundColor Cyan
Write-Host "  1. Share -> Public link -> salin URL"
Write-Host "  2. Simpan di metabase.env -> METABASE_DASHBOARD_URL=..."
Write-Host "  3. npm run metabase:setup"
Write-Host ""
Write-Host "Hentikan: npm run metabase:stop" -ForegroundColor DarkGray
Write-Host ""
