param(
  [string]$ProjectRef = "vnfndvbxhvpikjxvnkmc"
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
  Write-Host ""
  Write-Host "=== Setup Help Center (Supabase) ===" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "SUPABASE_ACCESS_TOKEN tidak ditemukan." -ForegroundColor Red
  Write-Host "  1. Buka: https://supabase.com/dashboard/account/tokens"
  Write-Host "  2. Simpan token di supabase.token.env.txt (baris: sbp_...)"
  Write-Host "  3. Jalankan: npm run help:setup"
  Write-Host ""
  Write-Host "Atau jalankan manual di SQL Editor:" -ForegroundColor Yellow
  Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/sql/new"
  Write-Host "  File: supabase/help_center.sql"
  Write-Host ""
  exit 1
}

$sqlPath = Join-Path $root "supabase\help_center.sql"
if (-not (Test-Path $sqlPath)) {
  Write-Host "File tidak ditemukan: $sqlPath" -ForegroundColor Red
  exit 1
}

$query = Get-Content $sqlPath -Raw

Write-Host ""
Write-Host "=== Setup Help Center Database ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef"
Write-Host "SQL    : supabase/help_center.sql"
Write-Host ""

try {
  $nodeScript = @'
const fs = require('fs');
const https = require('https');
const projectRef = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const sql = fs.readFileSync('supabase/help_center.sql', 'utf8');
const body = JSON.stringify({ query: sql });
const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (c) => { data += c; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('OK');
      process.exit(0);
    }
    console.error(data || res.statusMessage);
    process.exit(1);
  });
});
req.on('error', (e) => { console.error(e.message); process.exit(1); });
req.write(body);
req.end();
'@

  $env:SUPABASE_PROJECT_REF = $ProjectRef
  $env:SUPABASE_ACCESS_TOKEN = $token
  $out = node -e $nodeScript 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw $out
  }

  Write-Host "Berhasil! Tabel Help Center dan data awal sudah dibuat." -ForegroundColor Green
  Write-Host ""
  Write-Host "Verifikasi di dashboard:" -ForegroundColor Cyan
  Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/editor"
  Write-Host ""
  Write-Host "Refresh halaman Bantuan di aplikasi untuk melihat konten." -ForegroundColor Green
} catch {
  $msg = $_.Exception.Message
  if ($_.ErrorDetails.Message) {
    try {
      $err = $_.ErrorDetails.Message | ConvertFrom-Json
      if ($err.message) { $msg = $err.message }
      if ($err.error) { $msg = $err.error }
    } catch { $msg = $_.ErrorDetails.Message }
  }
  Write-Host "Gagal menjalankan SQL: $msg" -ForegroundColor Red
  Write-Host ""
  Write-Host "Coba manual di SQL Editor:" -ForegroundColor Yellow
  Write-Host "  https://supabase.com/dashboard/project/$ProjectRef/sql/new"
  exit 1
}
