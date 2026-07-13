Nama Aplikasi Anda

Deskripsi singkat aplikasi / sistem informasi Anda

Version 1.0 • [Bulan Tahun]

Platform  
https://[subdomain-anda].example.com

Development Team  
@[pengembang-1]  
@[pengembang-2]

---

# Node Modules — Daftar Dependensi npm

Dokumen ini merangkum seluruh paket npm (`node_modules`) yang dipakai di proyek **Nama Aplikasi Anda**.

Salin file ini ke `doc/NODE-MODULES.md` di repositori baru, lalu sesuaikan header, tabel, dan hapus section yang tidak dipakai.

| Workspace | Path | Peran |
|-----------|------|-------|
| Root | `/package.json` | Script orkestrasi & dependensi shared |
| Frontend | `/frontend/package.json` | UI web, chart, GIS (jika ada) |
| Backend | `/backend/package.json` | API server Node (opsional) |

> **Petunjuk adopsi**
> - Hapus baris workspace yang tidak dipakai.
> - Hapus section opsional (Grafik, GIS, Backend) jika modul tersebut tidak ada.
> - Isi versi dari `package.json` proyek baru — jangan mengandalkan angka di dokumen ini.
> - Perbarui dokumen setiap menambah/menghapus dependensi.

> **Catatan non-npm (sesuaikan):**
> - Layanan Python: `services/ml/requirements.txt` *(jika ada)*
> - Edge/serverless: `functions/` — dependensi dibundel saat deploy
> - Bahasa lain: *(kosongkan jika tidak ada)*

---

## Instalasi

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend   # hapus baris ini jika tanpa backend
```

---

## 1. Root (`/package.json`)

### Dependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| *(contoh)* `@supabase/supabase-js` | ^2.x | Client database / auth untuk script |
| *(contoh)* `xlsx` | ^0.18.x | Baca/tulis Excel |
| *(tambahkan baris per paket)* | | |

### DevDependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| *(contoh)* `concurrently` | ^9.x | Jalankan beberapa service paralel (`npm run dev`) |
| *(tambahkan baris per paket)* | | |

---

## 2. Frontend (`/frontend/package.json`)

> Hapus section 2 jika tidak memakai frontend terpisah.

### Dependencies — Core & UI

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `react` | ^19.x | Library UI utama |
| `react-dom` | ^19.x | Render React ke DOM |
| `react-router-dom` | ^7.x | Routing halaman SPA |
| `@tanstack/react-query` | ^5.x | Fetch & cache data API |
| `axios` | ^1.x | HTTP client ke backend |
| *(tambahkan baris per paket)* | | |

### Dependencies — Komponen UI

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@radix-ui/react-dialog` | ^1.x | Modal / dialog |
| `@radix-ui/react-dropdown-menu` | ^2.x | Menu dropdown |
| `lucide-react` | ^1.x | Ikon SVG |
| `clsx` | ^2.x | Gabung className kondisional |
| `tailwind-merge` | ^3.x | Merge class Tailwind |
| *(tambahkan baris per paket)* | | |

### Dependencies — Grafik & Visualisasi

> **Opsional** — hapus jika aplikasi tidak punya modul chart/dashboard grafik.

Stack yang direkomendasikan (open-source, tanpa lisensi BI berbayar):

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `echarts` | ^6.x | [Apache ECharts](https://echarts.apache.org/) — engine chart |
| `echarts-for-react` | ^3.x | Wrapper React (`<ReactECharts />`) |
| `html2canvas` | ^1.x | Export elemen DOM ke PNG |

**Alternatif lain (pilih salah satu, jangan campur tanpa alasan):**

| Library | npm | Kapan dipakai |
|---------|-----|---------------|
| Chart.js | `chart.js`, `react-chartjs-2` | Chart sederhana, ekosistem besar |
| Recharts | `recharts` | Komponen React deklaratif |
| Plotly | `plotly.js`, `react-plotly.js` | Chart ilmiah / 3D |
| Vega-Lite | `vega`, `vega-lite`, `react-vega` | Grammar of graphics |

**Jenis chart yang direncanakan:** bar, line, pie, gauge, heatmap *(sesuaikan kebutuhan)*

---

### Dependencies — GIS / Peta

> **Opsional** — hapus jika tidak ada modul peta.
> Dokumentasi GIS terpisah: salin [`doc/templates/GIS-NODE-MODULES.md`](GIS-NODE-MODULES.md) ke `doc/GIS-NODE-MODULES.md`.

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `leaflet` | ^1.9.x | [Leaflet](https://leafletjs.com/) — engine peta |
| `leaflet.heat` | ^0.2.x | Heatmap layer |
| `leaflet.markercluster` | ^1.5.x | Kluster marker |
| `leaflet-draw` | ^1.0.x | Gambar polygon *(opsional)* |
| `@turf/turf` | ^7.x | [Turf.js](https://turfjs.org/) — analisis geospasial |
| `html2canvas` | ^1.x | Export screenshot peta |

---

### Dependencies — Auth & Konten

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@supabase/supabase-js` | ^2.x | Auth & database *(jika pakai Supabase)* |
| `react-markdown` | ^10.x | Render Markdown *(help/docs)* |
| `remark-gfm` | ^4.x | GitHub Flavored Markdown |
| *(tambahkan baris per paket)* | | |

### DevDependencies — Build & Tooling

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `vite` | ^8.x | Bundler & dev server |
| `@vitejs/plugin-react` | ^6.x | Plugin React untuk Vite |
| `typescript` | ^5.x / ^6.x | Type checking |
| `tailwindcss` | ^4.x | Utility-first CSS |
| `@tailwindcss/vite` | ^4.x | Integrasi Tailwind + Vite |
| `oxlint` / `eslint` | ^1.x / ^9.x | Linter |
| `@types/react` | ^19.x | Types React |
| `@types/node` | ^24.x | Types Node |
| *(tambahkan baris per paket)* | | |

---

## 3. Backend (`/backend/package.json`)

> Hapus section 3 jika tidak memakai backend Node terpisah.

### Dependencies — Framework

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@nestjs/common` | ^11.x | Framework NestJS *(atau Express/Fastify)* |
| `@nestjs/core` | ^11.x | Runtime inti |
| `@nestjs/platform-express` | ^11.x | HTTP server |
| `reflect-metadata` | ^0.2.x | Metadata decorator |
| `rxjs` | ^7.x | Reactive streams |
| *(tambahkan baris per paket)* | | |

### Dependencies — Database & Data

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@supabase/supabase-js` | ^2.x | Client Supabase |
| `pg` | ^8.x | Driver PostgreSQL |
| `class-validator` | ^0.15.x | Validasi DTO |
| `class-transformer` | ^0.5.x | Transformasi request |
| `dotenv` | ^17.x | Load `.env` |
| *(tambahkan baris per paket)* | | |

### Dependencies — Auth

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@nestjs/jwt` | ^11.x | JWT |
| `passport-jwt` | ^4.x | Strategi JWT |
| *(tambahkan baris per paket)* | | |

### DevDependencies — Testing & Lint

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `typescript` | ^5.x | Type checking |
| `jest` | ^30.x | Test runner |
| `eslint` | ^9.x | Linter |
| `prettier` | ^3.x | Formatter |
| *(tambahkan baris per paket)* | | |

---

## 4. Edge / Serverless (`functions/`)

> Opsional — sesuaikan nama folder (mis. `api/`, `serverless/`).

Tidak memiliki `package.json` sendiri. Dependensi di-resolve saat deploy bundler (Wrangler, Vercel, dll.):

| Paket (transitif) | Fungsi |
|-------------------|--------|
| *(contoh)* `@supabase/supabase-js` | Query database di edge |
| *(tambahkan baris per paket)* | |

---

## 5. Tooling CLI (via npx / global)

| Tool | Dipakai untuk |
|------|---------------|
| `wrangler` | Deploy Cloudflare Pages / Workers |
| `vercel` | Deploy Vercel *(alternatif)* |
| `node` | Script otomasi & tooling |

---

## 6. Ringkasan per Kategori

| Kategori | Paket utama *(isi sesuai proyek)* |
|----------|-----------------------------------|
| **UI Framework** | React, React Router, Tailwind CSS |
| **Komponen UI** | Radix UI, Lucide |
| **State & Data** | TanStack Query, Axios |
| **Grafik** | Apache ECharts — atau — Chart.js / Recharts |
| **GIS** | Leaflet, Turf.js — atau — *(tidak dipakai)* |
| **Backend API** | NestJS — atau — *(serverless saja)* |
| **Database** | Supabase, PostgreSQL |
| **Build** | Vite, TypeScript |
| **Deploy** | Wrangler, Vercel CLI, dll. |

---

## 7. Lisensi

Sebagian besar dependensi open-source (MIT, Apache 2.0, BSD). Verifikasi sebelum produksi:

```powershell
npm ls --prefix frontend --all
npm ls --prefix backend --all
```

| Paket | Lisensi | Catatan |
|-------|---------|---------|
| `echarts` | Apache 2.0 | Grafik |
| `leaflet` | BSD 2-Clause | Peta |
| `@turf/turf` | MIT | Analisis spasial |
| *(tambahkan jika ada lisensi khusus)* | | |

---

## Checklist adopsi ke proyek baru

- [ ] Salin `doc/templates/NODE-MODULES.md` → `doc/NODE-MODULES.md`
- [ ] Ganti header (nama app, URL produksi, tim)
- [ ] Generate baris tabel dari `package.json` aktual
- [ ] Hapus section Grafik / GIS / Backend yang tidak dipakai
- [ ] Jika ada GIS, salin `doc/templates/GIS-NODE-MODULES.md`
- [ ] Commit bersama perubahan dependensi

**Generate baris tabel dari terminal:**

```powershell
node -e "const p=require('./frontend/package.json'); Object.entries({...p.dependencies,...p.devDependencies}).forEach(([k,v])=>console.log('| `'+k+'` | '+v+' | |'))"
```

---

*Template adopsi — perbarui tanggal & versi setelah disesuaikan ke proyek aktual.*
