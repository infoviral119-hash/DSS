e-Insight

Integrated Violence Case Management & Decision Support System

Version 1.0 • July 2026

Platform  
https://e-insight.pages.dev

Development Team  
@budi  
@Henokhvita

---

# Node Modules — Daftar Dependensi npm

> **Template untuk proyek baru:** salin [`doc/templates/NODE-MODULES.md`](templates/NODE-MODULES.md) (dan [`doc/templates/GIS-NODE-MODULES.md`](templates/GIS-NODE-MODULES.md) jika ada modul peta).

Dokumen ini merangkum seluruh paket npm (`node_modules`) yang dipakai di monorepo e-Insight. Proyek ini memiliki **3 workspace** dengan `package.json` terpisah.

| Workspace | Path | Peran |
|-----------|------|-------|
| Root | `/package.json` | Script orkestrasi, import logbook, Supabase tooling |
| Frontend | `/frontend/package.json` | UI React, chart, GIS, deploy Pages |
| Backend | `/backend/package.json` | API NestJS lokal, import, geocode, worker |

> **Catatan:** Layanan ML (`ml-service/`) memakai **Python** (`requirements.txt`), bukan npm. Cloudflare Pages Functions (`functions/`) memakai `@supabase/supabase-js` dari `node_modules` root saat bundling Wrangler.

---

## Instalasi

```powershell
# Root (script + shared deps)
npm install

# Frontend
npm install --prefix frontend

# Backend
npm install --prefix backend
```

Atau jalankan sekaligus dari root:

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend
```

---

## 1. Root (`/package.json`)

### Dependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@supabase/supabase-js` | ^2.110.0 | Client Supabase untuk script setup & import |
| `xlsx` | ^0.18.5 | Baca/tulis file Excel (logbook import) |

### DevDependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `concurrently` | ^9.1.2 | Menjalankan frontend + backend + ML secara paralel (`npm run dev`) |

---

## 2. Frontend (`/frontend/package.json`)

### Dependencies — Core & UI

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `react` | ^19.2.7 | Library UI utama |
| `react-dom` | ^19.2.7 | Render React ke DOM |
| `react-router-dom` | ^7.18.1 | Routing halaman SPA |
| `@tanstack/react-query` | ^5.101.2 | Fetch & cache data API |
| `axios` | ^1.18.1 | HTTP client ke `/api/*` |
| `framer-motion` | ^12.42.2 | Animasi transisi UI |
| `lucide-react` | ^1.22.0 | Ikon SVG |
| `clsx` | ^2.1.1 | Gabung className kondisional |
| `class-variance-authority` | ^0.7.1 | Variant styling komponen |
| `tailwind-merge` | ^3.6.0 | Merge class Tailwind tanpa konflik |
| `date-fns` | ^4.4.0 | Format & manipulasi tanggal |

### Dependencies — Radix UI (komponen aksesibel)

| Paket | Versi | Komponen UI |
|-------|-------|-------------|
| `@radix-ui/react-avatar` | ^1.2.1 | Avatar profil |
| `@radix-ui/react-dialog` | ^1.1.18 | Modal / dialog |
| `@radix-ui/react-dropdown-menu` | ^2.1.19 | Menu dropdown |
| `@radix-ui/react-label` | ^2.1.11 | Label form |
| `@radix-ui/react-popover` | ^1.1.18 | Popover |
| `@radix-ui/react-scroll-area` | ^1.2.13 | Area scroll custom |
| `@radix-ui/react-select` | ^2.3.2 | Select / combobox |
| `@radix-ui/react-separator` | ^1.1.11 | Garis pemisah |
| `@radix-ui/react-slot` | ^1.3.0 | Pola komposisi slot |
| `@radix-ui/react-switch` | ^1.3.2 | Toggle switch |
| `@radix-ui/react-tabs` | ^1.1.16 | Tab navigasi |
| `@radix-ui/react-tooltip` | ^1.2.11 | Tooltip |

### Dependencies — Grafik & Visualisasi

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `echarts` | ^6.1.0 | **Apache ECharts** — engine chart interaktif |
| `echarts-for-react` | ^3.0.6 | Wrapper React (`<ReactECharts />`) |
| `html2canvas` | ^1.4.1 | Screenshot DOM → PNG (export laporan) |

**Jenis chart yang dipakai:** bar, line, pie, gauge, heatmap, treemap, sunburst, sankey, funnel, waterfall, scatter, bubble, pareto, stacked area.

### Dependencies — GIS / Peta

> **Dokumen lengkap GIS Intelligence:** [`doc/GIS-NODE-MODULES.md`](GIS-NODE-MODULES.md)

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `leaflet` | ^1.9.4 | Peta interaktif open-source |
| `react-leaflet` | ^5.0.0 | Integrasi Leaflet ke React (mini map laporan) |
| `leaflet-draw` | ^1.0.4 | Gambar polygon/area di peta |
| `leaflet.heat` | ^0.2.0 | Heatmap layer |
| `leaflet.markercluster` | ^1.5.3 | Kluster marker |
| `@turf/turf` | ^7.3.5 | Analisis geospasial (buffer, jarak, dll.) |

### Dependencies — Konten & Auth

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@supabase/supabase-js` | ^2.110.0 | Auth client (login Supabase) |
| `react-markdown` | ^10.1.0 | Render Markdown (Help Center) |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown |

### DevDependencies — Build & Tooling

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `vite` | ^8.1.1 | Bundler & dev server |
| `@vitejs/plugin-react` | ^6.0.3 | Plugin React untuk Vite |
| `typescript` | ~6.0.2 | Type checking |
| `tailwindcss` | ^4.3.2 | Utility-first CSS |
| `@tailwindcss/vite` | ^4.3.2 | Integrasi Tailwind + Vite |
| `oxlint` | ^1.71.0 | Linter cepat |
| `@types/react` | ^19.2.17 | Type definitions React |
| `@types/react-dom` | ^19.2.3 | Type definitions React DOM |
| `@types/node` | ^24.13.2 | Type definitions Node |
| `@types/leaflet` | ^1.9.21 | Type definitions Leaflet |
| `@types/leaflet-draw` | ^1.0.13 | Type definitions Leaflet Draw |

---

## 3. Backend (`/backend/package.json`)

### Dependencies — NestJS Framework

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@nestjs/common` | ^11.0.1 | Decorator, DI, utilitas NestJS |
| `@nestjs/core` | ^11.0.1 | Runtime inti NestJS |
| `@nestjs/platform-express` | ^11.0.1 | HTTP server Express |
| `@nestjs/config` | ^4.0.4 | Konfigurasi environment |
| `@nestjs/swagger` | ^11.4.5 | Dokumentasi API OpenAPI |
| `@nestjs/microservices` | ^11.1.27 | Pola microservice |
| `@nestjs/websockets` | ^11.1.27 | WebSocket gateway |
| `reflect-metadata` | ^0.2.2 | Metadata untuk decorator |
| `rxjs` | ^7.8.1 | Reactive streams |

### Dependencies — Auth & Keamanan

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@nestjs/jwt` | ^11.0.2 | JWT token |
| `@nestjs/passport` | ^11.0.5 | Integrasi Passport |
| `passport` | ^0.7.0 | Middleware autentikasi |
| `passport-jwt` | ^4.0.1 | Strategi JWT |
| `otplib` | ^13.4.1 | OTP / 2FA |

### Dependencies — Database & Data

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@supabase/supabase-js` | ^2.110.0 | Client Supabase |
| `pg` | ^8.22.0 | Driver PostgreSQL langsung |
| `csv-parse` | ^7.0.0 | Parse file CSV |
| `xlsx` | ^0.18.5 | Baca file Excel logbook |
| `uuid` | ^14.0.1 | Generate UUID |
| `class-validator` | ^0.15.1 | Validasi DTO |
| `class-transformer` | ^0.5.1 | Transformasi objek request |
| `dotenv` | ^17.4.2 | Load variabel `.env` |

### Dependencies — Cloudflare

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@mridang/nestjs-platform-cloudflare` | ^1.2.0 | Deploy NestJS ke Cloudflare Worker |

### DevDependencies — Testing & Lint

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@nestjs/cli` | ^11.0.0 | CLI NestJS |
| `@nestjs/schematics` | ^11.0.0 | Generator scaffold |
| `@nestjs/testing` | ^11.0.1 | Utilitas unit test |
| `typescript` | ^5.7.3 | Type checking |
| `jest` | ^30.0.0 | Test runner |
| `ts-jest` | ^29.2.5 | Jest + TypeScript |
| `supertest` | ^7.0.0 | HTTP assertion test |
| `eslint` | ^9.18.0 | Linter |
| `typescript-eslint` | ^8.20.0 | ESLint rules TypeScript |
| `eslint-config-prettier` | ^10.0.1 | Nonaktifkan rule bentrok Prettier |
| `eslint-plugin-prettier` | ^5.2.2 | Integrasi Prettier |
| `prettier` | ^3.4.2 | Formatter kode |
| `ts-node` | ^10.9.2 | Jalankan TS langsung (script import/geocode) |
| `tsconfig-paths` | ^4.2.0 | Resolve path alias TS |
| `ts-loader` | ^9.5.2 | Loader webpack/TS |
| `source-map-support` | ^0.5.21 | Stack trace yang lebih jelas |
| `globals` | ^17.0.0 | Global variables ESLint |
| `@types/express` | ^5.0.0 | Types Express |
| `@types/jest` | ^30.0.0 | Types Jest |
| `@types/node` | ^24.0.0 | Types Node |
| `@types/pg` | ^8.20.0 | Types PostgreSQL |
| `@types/multer` | ^2.1.0 | Types file upload |
| `@types/supertest` | ^7.0.0 | Types Supertest |
| `@types/uuid` | ^10.0.0 | Types UUID |
| `@eslint/eslintrc` | ^3.2.0 | Config ESLint flat |
| `@eslint/js` | ^9.18.0 | Core ESLint JS |

---

## 4. Cloudflare Pages Functions (`/functions/`)

Tidak memiliki `package.json` sendiri. Saat deploy (`npm run deploy:pages`), Wrangler membundel kode TypeScript dan meng-resolve dependensi dari root:

| Paket (transitif) | Fungsi |
|-------------------|--------|
| `@supabase/supabase-js` | Query database & auth di edge API |

---

## 5. Tooling CLI (bukan di package.json, dipanggil via npx)

| Tool | Dipakai untuk |
|------|---------------|
| `wrangler` | Deploy Cloudflare Pages & Workers |
| `node` | Script PowerShell setup, import, e2e smoke test |

---

## 6. Ringkasan per Kategori

| Kategori | Paket utama |
|----------|-------------|
| **UI Framework** | React 19, React Router 7, Tailwind CSS 4 |
| **Komponen UI** | Radix UI, Lucide, Framer Motion |
| **State & Data** | TanStack Query, Axios |
| **Grafik** | Apache ECharts 6 + echarts-for-react |
| **GIS** | Leaflet, react-leaflet, Turf.js |
| **Backend API** | NestJS 11, Passport JWT |
| **Database** | Supabase JS, node-postgres (`pg`) |
| **Auth** | Supabase Auth, JWT, OTP (otplib) |
| **Import Data** | xlsx, csv-parse |
| **Build** | Vite 8, TypeScript 5–6 |
| **Deploy** | Wrangler, Cloudflare adapter |

---

## 7. Lisensi Umum

Sebagian besar dependensi bersifat **open-source** (MIT, Apache 2.0, ISC). Tidak ada lisensi berbayar seperti Power BI atau Metabase di stack npm ini.

Untuk detail lisensi per paket:

```powershell
npm ls --prefix frontend --all
npm ls --prefix backend --all
```

---

*Terakhir diperbarui: Juli 2026 — sesuai `package.json` di root, frontend, dan backend.*
