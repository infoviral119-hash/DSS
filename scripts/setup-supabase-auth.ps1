param(
  [string]$SiteUrl = "https://e-insight.pages.dev",
  [string]$ProjectRef = "vnfndvbxhvpikjxvnkmc",
  [string]$AllowList = "https://e-insight.pages.dev/**,http://localhost:5173/**,http://127.0.0.1:5173/**"
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

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) { $token = Read-EnvValue (Join-Path $root "supabase.env") "SUPABASE_ACCESS_TOKEN" }

if (-not $token) {
  Write-Host ""
  Write-Host "=== Setup Supabase Auth (redirect URLs) ===" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Token Management API belum ada." -ForegroundColor Yellow
  Write-Host "  1. Buka: https://supabase.com/dashboard/account/tokens"
  Write-Host "  2. Generate token -> simpan di supabase.env:"
  Write-Host "       SUPABASE_ACCESS_TOKEN=sbp_..."
  Write-Host "  3. Jalankan lagi: npm run supabase:auth"
  Write-Host ""
  Write-Host "Atau manual di dashboard:" -ForegroundColor Yellow
  Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/auth/url-configuration"
  Write-Host "  Site URL     : $SiteUrl"
  Write-Host "  Redirect URLs: $AllowList"
  Write-Host ""
  exit 1
}

$body = @{
  site_url       = $SiteUrl
  uri_allow_list = $AllowList
} | ConvertTo-Json -Compress

Write-Host ""
Write-Host "=== Update Supabase Auth URLs ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef"
Write-Host "Site URL: $SiteUrl"
Write-Host ""

try {
  $res = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/config/auth" `
    -Method PATCH `
    -Headers @{
      Authorization = "Bearer $token"
      "Content-Type" = "application/json"
    } `
    -Body $body
  Write-Host "Berhasil!" -ForegroundColor Green
  Write-Host "Site URL     : $($res.site_url)"
  Write-Host "Redirect list: $($res.uri_allow_list)"
} catch {
  Write-Host "Gagal update via API: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  Write-Host ""
  Write-Host "Fallback manual:" -ForegroundColor Yellow
  Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/auth/url-configuration"
  exit 1
}

Write-Host ""
Write-Host "Login mobile/production siap di $SiteUrl" -ForegroundColor Green
Write-Host ""
