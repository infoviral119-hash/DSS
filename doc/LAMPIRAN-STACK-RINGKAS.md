e-Insight

Integrated Violence Case Management & Decision Support System

Version 1.0 • July 2026

Platform  
https://e-insight.pages.dev

Development Team  
@budi  
@Henokhvita

---

## 1. Layanan Cloud & Hosting

| Software / Layanan | Status | Manfaat & Fungsi |
|--------------------|--------|------------------|
| Cloudflare Pages | ✅ Aktif 24/7 | Hosting frontend React, CDN global, HTTPS otomatis |
| Cloudflare Pages Functions | ✅ Aktif 24/7 | Backend API serverless (`/api/*`) tanpa VPS |
| Supabase | ✅ Aktif 24/7 | Database PostgreSQL cloud + autentikasi user |
| Groq API (Llama 3.3 70B) | ✅ Aktif 24/7 | LLM untuk AI Insight, narasi, dan chat analitik |
| Hugging Face Spaces | ✅ Aktif 24/7 | Hosting layanan ML forecast Python |
| Wrangler CLI | ✅ Aktif | Deploy ke Cloudflare & pengelolaan secret |

---

## 2. Framework & Bahasa

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| React 19 | ✅ Aktif | Antarmuka pengguna interaktif |
| TypeScript | ✅ Aktif | Type safety di frontend, API, dan Functions |
| Vite 8 | ✅ Aktif | Build tool & dev server frontend |
| FastAPI + Uvicorn | ✅ Aktif | Framework API layanan machine learning |
| NestJS 11 | ⚙️ Dev lokal | Backend lengkap untuk pengembangan lokal |
| Python 3 | ✅ Aktif | Runtime layanan ML forecast |

---

## 3. Frontend & UI

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Tailwind CSS 4 | ✅ Aktif | Styling responsif & tema modern |
| Radix UI | ✅ Aktif | Komponen aksesibel (dialog, tabs, dropdown) |
| Apache ECharts | ✅ Aktif | Chart interaktif — pengganti Metabase |
| TanStack React Query | ✅ Aktif | Cache & refresh data API otomatis |
| React Router 7 | ✅ Aktif | Navigasi antar modul aplikasi |
| Axios | ✅ Aktif | HTTP client dengan autentikasi JWT |
| Framer Motion | ✅ Aktif | Animasi transisi halaman |
| Lucide React | ✅ Aktif | Ikon navigasi & KPI |

---

## 4. Database & Autentikasi

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Supabase Auth | ✅ Aktif | Login, registrasi, session JWT |
| PostgreSQL (Supabase) | ✅ Aktif | Penyimpanan data kasus SIMPATI.KK |
| @supabase/supabase-js | ✅ Aktif | Klien database & auth |
| Role-Based Access Control | ✅ Aktif | Kontrol akses admin / operator / auditor |

---

## 5. AI & Machine Learning

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Groq — Llama 3.3 70B | ✅ Aktif | Ringkasan eksekutif & rekomendasi strategis |
| scikit-learn | ✅ Aktif | Random Forest & model neural network |
| XGBoost | ✅ Aktif | Regresi prediksi kasus time-series |
| Hybrid Forecast Model | ✅ Aktif | Gabungan multi-model, pilih terbaik otomatis |
| Prophet | ⚙️ Opsional | Forecast musiman (jika library tersedia) |
| pandas & numpy | ✅ Aktif | Pra-pemrosesan data time-series |

---

## 6. Analitik & Visualisasi

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Modul Dashboard | ✅ Aktif | KPI total kasus, aktif, selesai, tren |
| Modul Analitik | ✅ Aktif | Pareto, treemap, Sankey, funnel, heatmap |
| Modul Laporan | ✅ Aktif | Report builder & export PDF |
| Metabase OSS | ❌ Tidak aktif | Menu disembunyikan; tidak di-deploy cloud |
| Power BI | ❌ Tidak aktif | Alternatif berbayar; belum dikonfigurasi |

---

## 7. GIS & Pemetaan

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Leaflet + react-leaflet | ✅ Aktif | Peta interaktif modul GIS Intelligence |
| leaflet.markercluster | ✅ Aktif | Cluster titik kasus di peta |
| leaflet.heat | ✅ Aktif | Heatmap kepadatan kasus |
| @turf/turf | ✅ Aktif | Analisis geospasial |
| OpenStreetMap | ✅ Aktif | Basemap peta gratis |
| Nominatim | ✅ Aktif | Geocoding alamat Indonesia |

---

## 8. Keamanan & Data

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| RBAC & Data Scope | ✅ Aktif | Pembatasan akses per peran & wilayah |
| PII Masking | ✅ Aktif | Perlindungan data sensitif korban |
| Audit Trail | ✅ Aktif | Pencatatan aktivitas pengguna |
| xlsx (SheetJS) | ✅ Aktif | Import logbook Excel SIMPATI.KK |
| html2canvas | ✅ Aktif | Export laporan ke gambar/PDF |
| MFA (TOTP/Email) | ⚙️ UI saja | Antarmuka ada; verifikasi belum aktif |

---

## 9. DevOps & Tooling Lokal

| Software / Plugin | Status | Manfaat & Fungsi |
|-------------------|--------|------------------|
| Docker + Docker Compose | ⚙️ Opsional lokal | Menjalankan Metabase lokal saat ujicoba |
| cloudflared | ⚙️ Opsional | Quick tunnel Cloudflare untuk demo lokal |
| concurrently | ⚙️ Dev | Jalankan frontend + backend + ML sekaligus |
| Git + GitHub | ✅ Aktif | Version control & kolaborasi kode |

