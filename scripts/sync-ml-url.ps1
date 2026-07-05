param(
  [Parameter(Mandatory = $true)]
  [string]$Url,
  [string]$ProjectName = "e-insight",
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$Url = $Url.TrimEnd('/')
Write-Host "ML_SERVICE_URL -> $Url" -ForegroundColor Cyan

$wranglerPath = Join-Path $root "wrangler.toml"
$wrangler = Get-Content $wranglerPath -Raw
if ($wrangler -match 'ML_SERVICE_URL\s*=') {
  $wrangler = $wrangler -replace 'ML_SERVICE_URL\s*=\s*"[^"]*"', "ML_SERVICE_URL = `"$Url`""
} else {
  $wrangler = $wrangler -replace '(\[vars\])', "`$1`nML_SERVICE_URL = `"$Url`""
}
Set-Content -Path $wranglerPath -Value $wrangler -NoNewline

if ($SkipDeploy) {
  Write-Host "wrangler.toml updated (SkipDeploy)." -ForegroundColor Green
  exit 0
}

Write-Host "Building frontend + deploying Pages..." -ForegroundColor Yellow
npm run build:frontend
if ($LASTEXITCODE -ne 0) { exit 1 }
npx wrangler pages deploy frontend/dist --project-name=$ProjectName --branch=main --commit-dirty=true
Write-Host "Done. Test: $Url/health" -ForegroundColor Green
