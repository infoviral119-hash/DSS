param(
  [string]$ProjectRef = "vnfndvbxhvpikjxvnkmc",
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

function Set-EnvKey([string]$file, [string]$key, [string]$value) {
  $lines = @()
  $found = $false
  if (Test-Path $file) {
    foreach ($line in Get-Content $file) {
      if ($line -match "^\s*$key\s*=") {
        $lines += "$key=$value"
        $found = $true
      } else {
        $lines += $line
      }
    }
  }
  if (-not $found) { $lines += "$key=$value" }
  Set-Content -Path $file -Value ($lines -join "`n") -Encoding UTF8
}

$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) { $token = Read-EnvValue (Join-Path $root "supabase.env") "SUPABASE_ACCESS_TOKEN" }
if (-not $token) {
  foreach ($file in @("supabase.token.env.txt", "supabase.token.env")) {
    $path = Join-Path $root $file
    if (-not (Test-Path $path)) { continue }
    $raw = (Get-Content $path -Raw).Trim()
    if ($raw -match '^\s*SUPABASE_ACCESS_TOKEN\s*=') {
      $token = ($raw -split '=', 2)[1].Trim().Trim('"')
    } elseif ($raw -match '^sbp_') {
      $token = $raw
    }
    if ($token) { break }
  }
}

if (-not $token) {
  Write-Host "SUPABASE_ACCESS_TOKEN tidak ditemukan. Jalankan npm run supabase:auth dulu atau isi supabase.token.env.txt" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== Setup Supabase Service Role Key ===" -ForegroundColor Cyan

$keys = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/api-keys" `
  -Headers @{ Authorization = "Bearer $token" }

$serviceKey = ($keys | Where-Object { $_.name -eq 'service_role' -and $_.type -eq 'legacy' } | Select-Object -First 1).api_key
if (-not $serviceKey) {
  $serviceKey = ($keys | Where-Object { $_.name -eq 'service_role' } | Select-Object -First 1).api_key
}
if (-not $serviceKey) {
  Write-Host "Service role key tidak ditemukan via API." -ForegroundColor Red
  exit 1
}

Set-EnvKey (Join-Path $root "backend\.env") "SUPABASE_SERVICE_ROLE_KEY" $serviceKey
Set-EnvKey (Join-Path $root ".env") "SUPABASE_SERVICE_ROLE_KEY" $serviceKey

Write-Host "backend/.env dan .env diupdate" -ForegroundColor Green

Write-Host "Menyimpan SUPABASE_SERVICE_ROLE_KEY ke Cloudflare Pages..." -ForegroundColor Yellow
$serviceKey | npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=$ProjectName
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Selesai! Import bulk dan operasi admin RLS siap." -ForegroundColor Green
Write-Host ""
