param(
  [ValidateSet('openai', 'groq')]
  [string]$Provider = 'groq',
  [string]$ApiKey = "",
  [string]$Model = "",
  [string]$ProjectName = "e-insight"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$presets = @{
  openai = @{
    Label    = 'OpenAI'
    Model    = 'gpt-4o-mini'
    BaseUrl  = 'https://api.openai.com/v1'
    EnvFiles = @('openai.env', 'llm.env')
    Pattern  = '^sk-'
    KeyUrl   = 'https://platform.openai.com/api-keys'
  }
  groq = @{
    Label    = 'Groq'
    Model    = 'llama-3.3-70b-versatile'
    BaseUrl  = 'https://api.groq.com/openai/v1'
    EnvFiles = @('groq.env', 'llm.env')
    Pattern  = '^gsk_'
    KeyUrl   = 'https://console.groq.com/keys'
  }
}

$p = $presets[$Provider]
if (-not $Model) { $Model = $p.Model }

if (-not $ApiKey) {
  foreach ($file in $p.EnvFiles) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
      $candidate = (Get-Content $path -Raw).Trim()
      if ($candidate -match $p.Pattern) {
        $ApiKey = $candidate
        Write-Host "Key loaded from $file" -ForegroundColor DarkGray
        break
      }
    }
  }
}

if (-not $ApiKey -or $ApiKey -notmatch $p.Pattern) {
  Write-Host ""
  Write-Host "$($p.Label) API key belum ditemukan." -ForegroundColor Yellow
  Write-Host "  1. Buat key: $($p.KeyUrl)"
  Write-Host "  2. Simpan satu baris di groq.env (Groq) atau openai.env (OpenAI)"
  Write-Host "  3. Jalankan: .\scripts\setup-llm.ps1 -Provider $Provider"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "=== Setup LLM ($($p.Label)) - Cloudflare Pages ===" -ForegroundColor Cyan
Write-Host "Model   : $Model"
Write-Host "Base URL: $($p.BaseUrl)"
Write-Host ""

Write-Host "Menyimpan OPENAI_API_KEY..." -ForegroundColor Yellow
$ApiKey | npx wrangler pages secret put OPENAI_API_KEY --project-name=$ProjectName
if ($LASTEXITCODE -ne 0) { exit 1 }

$wranglerPath = Join-Path $root "wrangler.toml"
$wrangler = Get-Content $wranglerPath -Raw
foreach ($pair in @(
  @{ Name = 'AI_MODEL'; Value = $Model },
  @{ Name = 'OPENAI_BASE_URL'; Value = $p.BaseUrl },
  @{ Name = 'AI_PROVIDER'; Value = $Provider }
)) {
  $name = $pair.Name
  $value = $pair.Value
  if ($wrangler -match "${name}\s*=") {
    $wrangler = $wrangler -replace "${name}\s*=\s*""[^""]*""", "${name} = `"$value`""
  } else {
    $wrangler = $wrangler -replace '(\[vars\])', "`$1`n${name} = `"$value`""
  }
}
Set-Content -Path $wranglerPath -Value $wrangler -NoNewline
Write-Host "wrangler.toml updated (AI_MODEL, OPENAI_BASE_URL, AI_PROVIDER)" -ForegroundColor Green

Write-Host ""
Write-Host "Redeploy Pages (vars wrangler.toml)..." -ForegroundColor Yellow
npm run build:frontend
if ($LASTEXITCODE -ne 0) { exit 1 }
npx wrangler pages deploy frontend/dist --project-name=$ProjectName --branch=main --commit-dirty=true
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Selesai! Coba chat di https://e-insight.pages.dev/ai-insight" -ForegroundColor Green
Write-Host ""
