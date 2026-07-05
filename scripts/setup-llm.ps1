param(
  [string]$OpenAiKey = "",
  [string]$Model = "gpt-4o-mini",
  [string]$ProjectName = "e-insight"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $OpenAiKey) {
  foreach ($file in @("openai.env", "llm.env")) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
      $OpenAiKey = (Get-Content $path -Raw).Trim()
      Write-Host "Key loaded from $file" -ForegroundColor DarkGray
      break
    }
  }
}

if (-not $OpenAiKey -or $OpenAiKey -notmatch '^sk-') {
  Write-Host ""
  Write-Host "OpenAI API key belum ditemukan." -ForegroundColor Yellow
  Write-Host "  1. Buat key: https://platform.openai.com/api-keys"
  Write-Host "  2. Simpan satu baris di openai.env (root repo), contoh:"
  Write-Host "       sk-proj-..."
  Write-Host "  3. Jalankan lagi: .\scripts\setup-llm.ps1"
  Write-Host ""
  Write-Host "Atau: .\scripts\setup-llm.ps1 -OpenAiKey 'sk-...'"
  exit 1
}

Write-Host ""
Write-Host "=== Setup LLM (OpenAI) - Cloudflare Pages ===" -ForegroundColor Cyan
Write-Host "Model: $Model"
Write-Host ""

Write-Host "Menyimpan OPENAI_API_KEY..." -ForegroundColor Yellow
$OpenAiKey | npx wrangler pages secret put OPENAI_API_KEY --project-name=$ProjectName
if ($LASTEXITCODE -ne 0) { exit 1 }

$wranglerPath = Join-Path $root "wrangler.toml"
$wrangler = Get-Content $wranglerPath -Raw
if ($wrangler -match 'AI_MODEL\s*=') {
  $wrangler = $wrangler -replace 'AI_MODEL\s*=\s*"[^"]*"', "AI_MODEL = `"$Model`""
} else {
  $wrangler = $wrangler -replace '(\[vars\])', "`$1`nAI_MODEL = `"$Model`""
}
Set-Content -Path $wranglerPath -Value $wrangler -NoNewline
Write-Host "wrangler.toml: AI_MODEL = $Model" -ForegroundColor Green

Write-Host ""
Write-Host "Selesai! Secret aktif tanpa redeploy." -ForegroundColor Green
Write-Host "Verifikasi: login -> https://e-insight.pages.dev/ai-insight"
Write-Host "  Panel LLM harus menampilkan narasi AI (bukan pesan belum dikonfigurasi)."
Write-Host ""
