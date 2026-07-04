param(
  [string]$Repo = "infoviral119-hash/DSS"
)

$ErrorActionPreference = "Stop"
$accountId = "e37870c5d69733b6015c82a740cb3b7f"

Write-Host "Setup GitHub Secrets untuk $Repo"
Write-Host ""
Write-Host "1. Buat Cloudflare API Token:"
Write-Host "   https://dash.cloudflare.com/profile/api-tokens"
Write-Host "   Template: Edit Cloudflare Workers + Pages"
Write-Host ""
Write-Host "2. Jalankan perintah berikut (ganti TOKEN dan ANON_KEY):"
Write-Host ""
Write-Host "gh secret set CLOUDFLARE_API_TOKEN --repo $Repo"
Write-Host "gh secret set CLOUDFLARE_ACCOUNT_ID --body `"$accountId`" --repo $Repo"
Write-Host "gh secret set VITE_SUPABASE_URL --body `"https://vnfndvbxhvpikjxvnkmc.supabase.co`" --repo $Repo"
Write-Host "gh secret set VITE_SUPABASE_ANON_KEY --repo $Repo"
Write-Host ""
Write-Host "3. Push ke branch main:"
Write-Host "git push -u origin main"
