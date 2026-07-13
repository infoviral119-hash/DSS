# Help Center — setup database Supabase

## Otomatis (disarankan)

```powershell
npm run help:setup
```

Script ini menjalankan `supabase/help_center.sql` ke project Supabase via Management API.
Token dibaca dari `supabase.token.env.txt` atau `supabase.env`.

## Manual

Jalankan SQL di **Supabase Dashboard → SQL Editor**:

```
supabase/help_center.sql
```

Dashboard: https://supabase.com/dashboard/project/vnfndvbxhvpikjxvnkmc/sql/new

Setelah SQL dijalankan, deploy aplikasi jika ada perubahan frontend:

```powershell
npm run deploy:pages
```

## Storage bucket

Di Supabase Dashboard → Storage → buat bucket `help-center` (public) untuk lampiran PDF/gambar/video.

## Akses

| Peran | Bantuan | CMS Admin |
|-------|---------|-----------|
| Semua user login | `/bantuan` | — |
| Admin | `/bantuan` | `/admin/help-cms` |

## API

- `GET /api/help/*` — baca konten (authenticated)
- `GET/POST/PATCH/DELETE /api/help/admin/*` — CMS (admin only)
