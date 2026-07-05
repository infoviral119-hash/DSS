param(
  [string]$DashboardUrl = "",
  [string]$PublicUrl = "",
  [string]$ProjectName = "e-insight"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-EnvValue([string]$file, [string]$key) {
  if (-not (Test-Path $file)) { return "" }
  foreach ($line in Get-Content $file) {
    if ($line -match "^\s*$key\s*=\s*(.+)$") { return $Matches[1].Trim().Trim('"') }
  }
  return ""
}

if (-not $DashboardUrl -and -not $PublicUrl) {
  foreach ($file in @("metabase.env", "METABASE.env")) {
    $path = Join-Path $root $file
    if (-not $DashboardUrl) { $DashboardUrl = Read-EnvValue $path "METABASE_DASHBOARD_URL" }
    if (-not $PublicUrl) { $PublicUrl = Read-EnvValue $path "METABASE_PUBLIC_URL" }
    if ($DashboardUrl -or $PublicUrl) {
      Write-Host "Config loaded from $file" -ForegroundColor DarkGray
      break
    }
  }
}

if (-not $DashboardUrl -and -not $PublicUrl) {
  Write-Host ""
  Write-Host "Metabase URL belum ditemukan." -ForegroundColor Yellow
  Write-Host "  1. npm run metabase:start"
  Write-Host "  2. Buat dashboard -> Share -> Public link"
  Write-Host "  3. Simpan di metabase.env:"
  Write-Host "       METABASE_DASHBOARD_URL=https://.../public/dashboard/..."
  Write-Host "  4. Jalankan: npm run metabase:setup"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "=== Setup Metabase - Cloudflare Pages ===" -ForegroundColor Cyan

if ($DashboardUrl) {
  Write-Host "Menyimpan METABASE_DASHBOARD_URL..." -ForegroundColor Yellow
  $DashboardUrl | npx wrangler pages secret put METABASE_DASHBOARD_URL --project-name=$ProjectName
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

if ($PublicUrl) {
  Write-Host "Menyimpan METABASE_PUBLIC_URL..." -ForegroundColor Yellow
  $PublicUrl | npx wrangler pages secret put METABASE_PUBLIC_URL --project-name=$ProjectName
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host ""
Write-Host "Selesai! Cek https://e-insight.pages.dev/metabase" -ForegroundColor Green
Write-Host ""
