# Setup ML + LLM production for e-Insight (Cloudflare Pages)
# Usage:
#   .\scripts\setup-ml-production.ps1
#   .\scripts\setup-ml-production.ps1 -MlServiceUrl "https://e-insight-ml.onrender.com" -OpenAiKey "sk-..."

param(
  [string]$MlServiceUrl = "https://e-insight-ml.onrender.com",
  [string]$OpenAiKey = "",
  [string]$PowerBiShareUrl = "",
  [string]$ProjectName = "e-insight"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host ""
Write-Host "=== e-Insight Tahap 5 — Production Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Render Blueprint (manual one-time)
$renderDeploy = "https://render.com/deploy?repo=https://github.com/infoviral119-hash/DSS"
Write-Host "[1/4] Deploy ML service di Render (sekali saja)" -ForegroundColor Yellow
Write-Host "      Buka: $renderDeploy"
Write-Host "      - Pilih Blueprint render.yaml"
Write-Host "      - Service name: e-insight-ml"
Write-Host "      - Tunggu build selesai (~5-10 menit first deploy)"
Write-Host "      - Test: $MlServiceUrl/health"
Write-Host ""

# 2. Update wrangler.toml ML_SERVICE_URL
$wranglerPath = Join-Path $RepoRoot "wrangler.toml"
$wrangler = Get-Content $wranglerPath -Raw
if ($wrangler -match 'ML_SERVICE_URL\s*=') {
  $wrangler = $wrangler -replace 'ML_SERVICE_URL\s*=\s*"[^"]*"', "ML_SERVICE_URL = `"$MlServiceUrl`""
} else {
  $wrangler = $wrangler -replace '(\[vars\])', "`$1`nML_SERVICE_URL = `"$MlServiceUrl`""
}
Set-Content -Path $wranglerPath -Value $wrangler -NoNewline
Write-Host "[2/4] wrangler.toml updated: ML_SERVICE_URL = $MlServiceUrl" -ForegroundColor Green

# 3. Cloudflare Pages secrets (optional)
Write-Host "[3/4] Cloudflare Pages secrets" -ForegroundColor Yellow
if ($OpenAiKey) {
  $OpenAiKey | npx wrangler pages secret put OPENAI_API_KEY --project-name=$ProjectName
  Write-Host "      OPENAI_API_KEY disimpan" -ForegroundColor Green
} else {
  Write-Host "      Lewati OPENAI_API_KEY (pass -OpenAiKey untuk set LLM)" -ForegroundColor DarkGray
}

if ($PowerBiShareUrl) {
  $PowerBiShareUrl | npx wrangler pages secret put POWERBI_SHARE_URL --project-name=$ProjectName
  Write-Host "      POWERBI_SHARE_URL disimpan" -ForegroundColor Green
}

# 4. Redeploy Pages (pick up wrangler.toml vars)
Write-Host "[4/4] Redeploy Cloudflare Pages..." -ForegroundColor Yellow
npm run build:frontend
if ($LASTEXITCODE -ne 0) { throw "Frontend build gagal" }
npx wrangler pages deploy frontend/dist --project-name=$ProjectName --branch=main --commit-dirty=true
Write-Host ""
Write-Host "Selesai! Verifikasi:" -ForegroundColor Green
Write-Host "  ML health : $MlServiceUrl/health"
Write-Host "  Forecast  : https://e-insight.pages.dev/forecasting"
Write-Host "  AI Insight: https://e-insight.pages.dev/ai-insight"
Write-Host "  Power BI  : https://e-insight.pages.dev/powerbi"
Write-Host ""
