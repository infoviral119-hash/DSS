param(
  [string]$ShareUrl = "",
  [string]$EmbedUrl = "",
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

if (-not $ShareUrl -and -not $EmbedUrl) {
  foreach ($file in @("powerbi.env", "POWERBI.env")) {
    $path = Join-Path $root $file
    if (-not $ShareUrl) { $ShareUrl = Read-EnvValue $path "POWERBI_SHARE_URL" }
    if (-not $EmbedUrl) { $EmbedUrl = Read-EnvValue $path "POWERBI_EMBED_URL" }
    if ($ShareUrl -or $EmbedUrl) {
      Write-Host "Config loaded from $file" -ForegroundColor DarkGray
      break
    }
  }
}

if (-not $ShareUrl -and -not $EmbedUrl) {
  Write-Host ""
  Write-Host "Power BI URL belum ditemukan." -ForegroundColor Yellow
  Write-Host "  1. Buka report di Power BI -> copy URL address bar"
  Write-Host "  2. Simpan di powerbi.env:"
  Write-Host "       POWERBI_SHARE_URL=https://app.powerbi.com/..."
  Write-Host "  3. Jalankan: .\scripts\setup-powerbi.ps1"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "=== Setup Power BI - Cloudflare Pages ===" -ForegroundColor Cyan

if ($ShareUrl) {
  Write-Host "Menyimpan POWERBI_SHARE_URL..." -ForegroundColor Yellow
  $ShareUrl | npx wrangler pages secret put POWERBI_SHARE_URL --project-name=$ProjectName
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

if ($EmbedUrl) {
  Write-Host "Menyimpan POWERBI_EMBED_URL..." -ForegroundColor Yellow
  $EmbedUrl | npx wrangler pages secret put POWERBI_EMBED_URL --project-name=$ProjectName
  if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host ""
Write-Host "Selesai! Cek https://e-insight.pages.dev/powerbi" -ForegroundColor Green
Write-Host ""
