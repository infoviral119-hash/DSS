param(
  [string]$TunnelUrl = "",
  [string]$DashboardPath = "",
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

if (-not $TunnelUrl) {
  foreach ($file in @("metabase.env", "METABASE.env")) {
    $TunnelUrl = Read-EnvValue (Join-Path $root $file) "METABASE_TUNNEL_URL"
    if ($TunnelUrl) { break }
  }
}

if (-not $TunnelUrl) {
  Write-Host "Tunnel URL wajib. Contoh:" -ForegroundColor Yellow
  Write-Host "  .\scripts\sync-metabase-url.ps1 -TunnelUrl https://xxx.trycloudflare.com -DashboardPath /public/dashboard/uuid"
  exit 1
}

$TunnelUrl = $TunnelUrl.TrimEnd('/')

if (-not $DashboardPath) {
  $DashboardPath = Read-EnvValue (Join-Path $root "metabase.env") "METABASE_DASHBOARD_PATH"
}

$PublicUrl = $TunnelUrl
$DashboardUrl = ""

if ($DashboardPath) {
  if (-not $DashboardPath.StartsWith('/')) { $DashboardPath = "/$DashboardPath" }
  $DashboardUrl = "$TunnelUrl$DashboardPath"
}

Write-Host ""
Write-Host "=== Sync Metabase URL ===" -ForegroundColor Cyan
Write-Host "METABASE_PUBLIC_URL     : $PublicUrl"
if ($DashboardUrl) { Write-Host "METABASE_DASHBOARD_URL  : $DashboardUrl" }

& (Join-Path $root "scripts\setup-metabase.ps1") -DashboardUrl $DashboardUrl -PublicUrl $PublicUrl -ProjectName $ProjectName
