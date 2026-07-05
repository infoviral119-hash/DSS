param(
  [Parameter(Mandatory = $true)]
  [string]$SpaceName,
  [string]$Org = "",
  [switch]$Lite,
  [switch]$SyncPages
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$mlDir = Join-Path $root "ml-service"
Set-Location $root

if (-not $env:HF_TOKEN) {
  $envFile = Join-Path $root "hugging2.env"
  if (Test-Path $envFile) {
    $env:HF_TOKEN = (Get-Content $envFile -Raw).Trim()
    Write-Host "Token loaded from hugging2.env" -ForegroundColor DarkGray
  }
}

if (-not $env:HF_TOKEN) {
  Write-Host "Set token Hugging Face:" -ForegroundColor Yellow
  Write-Host "  1. Buat token: https://huggingface.co/settings/tokens (Write)"
  Write-Host "  2. Simpan di hugging2.env atau `$env:HF_TOKEN = 'hf_...'"
  Write-Host ""
  Write-Host "Buat Space Docker kosong dulu:" -ForegroundColor Yellow
  Write-Host "  https://huggingface.co/new-space?sdk=docker&name=$SpaceName"
  exit 1
}

Write-Host ""
Write-Host "=== Deploy ML ke Hugging Face Space ===" -ForegroundColor Cyan

Write-Host "Installing huggingface_hub..." -ForegroundColor Yellow
python -m pip install -q huggingface_hub

$hfUser = $Org
if (-not $hfUser) {
  $hfUser = python -c "from huggingface_hub import HfApi; print(HfApi(token=__import__('os').environ['HF_TOKEN']).whoami()['name'])"
  if ($LASTEXITCODE -ne 0 -or -not $hfUser) {
    Write-Host "Gagal membaca username HF dari token." -ForegroundColor Red
    exit 1
  }
}

$repoId = "$hfUser/$SpaceName"
Write-Host "Space: $repoId (repo-type: space)"
Write-Host ""

python -c @"
from huggingface_hub import HfApi
api = HfApi(token=__import__('os').environ['HF_TOKEN'])
api.create_repo(
    repo_id='$repoId',
    repo_type='space',
    space_sdk='docker',
    private=False,
    exist_ok=True,
)
print('Space ready')
"@

$staging = Join-Path $env:TEMP "e-insight-ml-hf-upload"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

Copy-Item -Path (Join-Path $mlDir "*") -Destination $staging -Recurse -Force

if ($Lite) {
  Copy-Item (Join-Path $mlDir "requirements-hf.txt") (Join-Path $staging "requirements.txt") -Force
  Write-Host "Mode Lite: tanpa Prophet (build lebih cepat)" -ForegroundColor DarkGray
}

Copy-Item (Join-Path $mlDir "README.md") (Join-Path $staging "README.md") -Force

Write-Host "Upload ke Hugging Face Space..." -ForegroundColor Yellow
$uploadScript = Join-Path $env:TEMP "e-insight-hf-upload.py"
@'
import os
from huggingface_hub import HfApi

api = HfApi(token=os.environ["HF_TOKEN"])
api.upload_folder(
    folder_path=os.environ["HF_STAGING"],
    repo_id=os.environ["HF_REPO_ID"],
    repo_type="space",
    commit_message="Deploy e-Insight ML from monorepo",
)
print("OK")
'@ | Set-Content -Path $uploadScript -Encoding UTF8

$env:HF_STAGING = $staging
$env:HF_REPO_ID = $repoId
python $uploadScript
Remove-Item $uploadScript -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
  Write-Host "Upload gagal. Pastikan token Write dan nama Space benar." -ForegroundColor Red
  exit 1
}

$publicUrl = "https://$hfUser-$SpaceName.hf.space".ToLower() -replace '_', '-'

Write-Host ""
Write-Host "Upload OK. Tunggu build (~5-15 menit) di:" -ForegroundColor Green
Write-Host "  https://huggingface.co/spaces/$repoId"
Write-Host "API URL (setelah build hijau): $publicUrl" -ForegroundColor Green
Write-Host "Health: $publicUrl/health"

if ($SyncPages) {
  Write-Host ""
  Write-Host "Sync ke Cloudflare..." -ForegroundColor Yellow
  & (Join-Path $root "scripts\sync-ml-url.ps1") -Url $publicUrl
} else {
  Write-Host ""
  Write-Host "Setelah build selesai:" -ForegroundColor Cyan
  Write-Host "  .\scripts\sync-ml-url.ps1 -Url `"$publicUrl`""
}

Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
