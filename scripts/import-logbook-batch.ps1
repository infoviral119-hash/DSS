param(
  [string]$DocDir = "",
  [int]$MinYear = 2021,
  [string]$ApiBase = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $DocDir) { $DocDir = Join-Path $root "doc" }

function Read-EnvFile([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$') {
      $map[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
  }
  return $map
}

$auth = Read-EnvFile (Join-Path $root "import.auth.env")
$email = $auth['EINSIGHT_EMAIL']
$password = $auth['EINSIGHT_PASSWORD']
$anonKey = $auth['SUPABASE_ANON_KEY']
if (-not $anonKey) {
  $rootEnv = Read-EnvFile (Join-Path $root ".env")
  $anonKey = $rootEnv['SUPABASE_ANON_KEY']
  if (-not $anonKey) { $anonKey = $rootEnv['VITE_SUPABASE_ANON_KEY'] }
}
if (-not $ApiBase) { $ApiBase = $auth['API_BASE'] }
if (-not $ApiBase) { $ApiBase = "https://e-insight.pages.dev" }

$supabaseUrl = "https://vnfndvbxhvpikjxvnkmc.supabase.co"
if (-not $anonKey) {
  Write-Host "SUPABASE_ANON_KEY tidak ditemukan (.env atau import.auth.env)" -ForegroundColor Yellow
  exit 1
}
if (-not $email -or -not $password) {
  Write-Host "Untuk import via API, isi EINSIGHT_EMAIL + EINSIGHT_PASSWORD di import.auth.env" -ForegroundColor Yellow
  Write-Host "Atau jalankan import lokal: npm run import:logbook:local" -ForegroundColor Cyan
  exit 1
}

if (-not (Test-Path $DocDir)) {
  Write-Host "Folder tidak ditemukan: $DocDir" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== Import Logbook Batch ===" -ForegroundColor Cyan
Write-Host "API: $ApiBase"
Write-Host "Folder: $DocDir"
Write-Host ""

Write-Host "Login Supabase..." -ForegroundColor Yellow
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method POST `
  -Headers @{ apikey = $anonKey; "Content-Type" = "application/json" } -Body $loginBody
$token = $login.access_token
if (-not $token) { throw "Login gagal" }
Write-Host "Login OK" -ForegroundColor Green

$authHeader = "Authorization: Bearer $token"

$files = Get-ChildItem $DocDir -File | Where-Object {
  $_.Name -match 'logbook' -and $_.Extension -match '^\.xlsx?$'
} | ForEach-Object {
  $tahun = 0
  if ($_.Name -match '(20\d{2}|201\d)') { $tahun = [int]$Matches[1] }
  [PSCustomObject]@{ File = $_; Tahun = $tahun }
} | Where-Object { $_.Tahun -ge $MinYear } | Sort-Object Tahun

if (-not $files.Count) {
  Write-Host "Tidak ada file logbook >= $MinYear di $DocDir" -ForegroundColor Yellow
  exit 0
}

Write-Host "File: $($files.Count)" -ForegroundColor DarkGray
$totalImported = 0

foreach ($item in $files) {
  $f = $item.File
  Write-Host ""
  Write-Host ">> $($f.Name) (tahun $($item.Tahun))" -ForegroundColor Cyan
  if ($DryRun) { continue }

  $previewJson = curl.exe -s -X POST "$ApiBase/api/import/preview" `
    -H $authHeader `
    -F "file=@$($f.FullName)"
  $preview = $previewJson | ConvertFrom-Json
  if (-not $preview.batchId) { throw "Preview gagal untuk $($f.Name): $previewJson" }

  $batchId = $preview.batchId
  $mapping = $preview.suggestedMapping
  $tahun = if ($preview.detectedTahun) { $preview.detectedTahun } else { $item.Tahun }

  $validateBody = (@{ batchId = $batchId; mapping = $mapping; tahun = $tahun } | ConvertTo-Json -Depth 8 -Compress)
  $validation = Invoke-RestMethod -Uri "$ApiBase/api/import/validate" -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $validateBody

  $executeBody = (@{ batchId = $batchId; skipDuplicates = $true } | ConvertTo-Json -Compress)
  $execution = Invoke-RestMethod -Uri "$ApiBase/api/import/execute" -Method POST `
    -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body $executeBody

  Write-Host "   valid: $($validation.validRows) / $($preview.totalRows) -> imported: $($execution.imported)" -ForegroundColor Green
  $totalImported += [int]$execution.imported
}

Write-Host ""
Write-Host "Selesai. Total imported: $totalImported baris" -ForegroundColor Green
Write-Host ""
