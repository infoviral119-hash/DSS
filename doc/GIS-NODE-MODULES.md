e-Insight

Integrated Violence Case Management & Decision Support System

Version 1.0 • July 2026

Platform  
https://e-insight.pages.dev

Development Team  
@budi  
@Henokhvita

---

# GIS Intelligence — Review Library & Node Modules

Modul **GIS Intelligence** (`/gis`) menampilkan peta interaktif kasus kekerasan berbasis koordinat GPS. Tidak memakai Mapbox, Google Maps SDK berbayar, atau ArcGIS API — seluruh visualisasi peta dirender **di browser** dengan stack open-source.

Dokumen ini merangkum:
1. Library / plugin yang dipakai (review teknis)
2. Node modules npm khusus GIS
3. Layanan eksternal (bukan npm)
4. Arsitektur modul & fitur

> Lihat juga: [`doc/NODE-MODULES.md`](NODE-MODULES.md) untuk daftar lengkap dependensi seluruh proyek.

---

## 1. Ringkasan Stack GIS

| Lapisan | Teknologi | Peran |
|---------|-----------|-------|
| **Peta interaktif** | Leaflet 1.9 | Engine peta utama |
| **Integrasi React** | Leaflet imperative (refs) | `GisMap.tsx` — bukan react-leaflet |
| **Analisis spasial** | Turf.js 7 | Jarak, buffer, point-in-polygon |
| **Clustering** | Custom JS | DBSCAN, K-Means, Grid |
| **Heatmap** | leaflet.heat | Layer density kasus |
| **Marker cluster** | leaflet.markercluster | Kluster titik GPS |
| **Gambar area** | leaflet-draw | Polygon analisis |
| **Basemap** | OpenStreetMap + Esri | Tile layer gratis |
| **Geocoding** | Nominatim (OSM) | Search & reverse geocode |
| **Data kasus** | Supabase via API | `/api/gis/*` |
| **Export** | html2canvas + native | PNG, GeoJSON, CSV |

---

## 2. Node Modules — Dependensi npm GIS

Semua paket GIS berada di **`frontend/package.json`**. Tidak ada dependensi GIS khusus di root atau backend npm (backend memakai koordinat dari Supabase + lookup statis).

### 2.1 Dependencies (production)

| Paket | Versi | Fungsi di GIS Intelligence |
|-------|-------|------------------------------|
| `leaflet` | ^1.9.4 | **Engine peta utama** — `L.map`, tile layer, circle, GeoJSON, popup |
| `leaflet.markercluster` | ^1.5.3 | Mengelompokkan marker GPS saat zoom out (`L.markerClusterGroup`) |
| `leaflet.heat` | ^0.2.0 | Heatmap & hotspot layer (`L.heatLayer`) |
| `leaflet-draw` | ^1.0.4 | Menggambar polygon untuk analisis area (`L.Control.Draw`) |
| `@turf/turf` | ^7.3.5 | **Analisis geospasial** — `distance`, `circle`, `booleanPointInPolygon`, `point` |
| `react-leaflet` | ^5.0.0 | Wrapper React untuk Leaflet — **terpasang, dipakai di mini map laporan** (`GisMiniMap.tsx`); halaman GIS utama memakai Leaflet langsung |
| `@tanstack/react-query` | ^5.101.2 | Cache data peta dari API (`useGisMapData`, boundaries, services) |
| `axios` | ^1.18.1 | HTTP client ke `/api/gis/*` |
| `html2canvas` | ^1.4.1 | Export screenshot peta ke PNG |
| `lucide-react` | ^1.22.0 | Ikon toolbar GIS (MapPin, Flame, Circle, dll.) |

### 2.2 DevDependencies (types & build)

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@types/leaflet` | ^1.9.21 | TypeScript types untuk Leaflet |
| `@types/leaflet-draw` | ^1.0.13 | TypeScript types untuk Leaflet Draw |

### 2.3 Transitif (otomatis dari npm)

| Paket | Asal | Fungsi |
|-------|------|--------|
| `@react-leaflet/core` | `react-leaflet` | Core react-leaflet |
| `@types/geojson` | `@turf/turf` | Type GeoJSON `FeatureCollection` |
| `@turf/*` (100+ sub-paket) | `@turf/turf` | Modul Turf individual (distance, circle, polygon, dll.) |

### 2.4 Perintah instalasi

```powershell
npm install --prefix frontend
```

Paket GIS terpasang otomatis bersama dependensi frontend lainnya.

---

## 3. Layanan Eksternal (bukan node_modules)

| Layanan | URL | Dipakai untuk |
|---------|-----|---------------|
| **OpenStreetMap** | `tile.openstreetmap.org` | Basemap standar |
| **Esri World Imagery** | `server.arcgisonline.com` | Basemap satelit |
| **Nominatim** | `nominatim.openstreetmap.org` | Geocode search & reverse (klik peta → alamat) |
| **Google Maps** | `google.com/maps/dir` | Link navigasi ke layanan terdekat (bukan SDK) |

Semua layanan di atas **gratis** untuk penggunaan demo/rendah volume. Nominatim memiliki rate limit — untuk produksi skala besar disarankan self-host atau provider geocoding berbayar.

---

## 4. Cara Library Dipakai per Fitur

### 4.1 Peta & layer (`GisMap.tsx`)

```tsx
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.heat/dist/leaflet-heat.js'
// leaflet-draw — dynamic import
```

| Fitur UI | Library / implementasi |
|----------|------------------------|
| Basemap OSM | `L.tileLayer(OSM_URL)` |
| Basemap satelit | `L.tileLayer(SAT_URL)` — Esri |
| Marker kasus GPS | `L.circleMarker` + popup |
| Marker cluster | `L.markerClusterGroup` |
| Heatmap | `L.heatLayer` + gradient custom |
| Hotspot (intensitas) | `L.heatLayer` + slider kontrol |
| Choropleth kabupaten | `L.geoJSON` + warna dari statistik |
| Batas provinsi/kabupaten | `L.geoJSON` dari API boundaries |
| Analisis radius | `L.circle` + Turf `pointsInRadius` |
| Analisis polygon | `leaflet-draw` + Turf `pointsInPolygon` |
| Buffer layanan | Turf `circle` + `L.geoJSON` |
| Layanan publik (RS, Polsek, LBH, dll.) | `L.circleMarker` hijau |

### 4.2 Analisis spasial (`utils/spatial.ts`)

| Fungsi | Library |
|--------|---------|
| Jarak antar titik | `@turf/turf` → `distance` |
| Titik dalam radius | `turf.circle` + `booleanPointInPolygon` |
| Titik dalam polygon | `turf.polygon` + `booleanPointInPolygon` |
| Layanan terdekat | `turf.distance` (loop manual) |

### 4.3 Clustering (`utils/clustering.ts`)

| Metode | Implementasi |
|--------|--------------|
| **DBSCAN** | Custom JavaScript (epsilon 0.015°, min 3 titik) |
| **K-Means** | Custom JavaScript (iterasi centroid) |
| **Grid** | Custom JavaScript (grid sel 0.05°) |
| **Marker cluster** | `leaflet.markercluster` (bukan algoritma custom) |

### 4.4 Geocoding (`hooks/useGisData.ts`)

| Fungsi | Sumber |
|--------|--------|
| `geocodeForward(query)` | Nominatim search API |
| `geocodeReverse(lat, lng)` | Nominatim reverse API |

### 4.5 Export (`utils/export.ts`)

| Format | Teknologi |
|--------|-----------|
| GeoJSON | Native `JSON.stringify` + Blob download |
| CSV | Native string builder |
| PNG | `html2canvas` screenshot container peta |
| PDF | `window.print()` |

### 4.6 Backend API (`functions/lib/gis.ts`)

Tidak memakai library GIS di server — hanya query Supabase + lookup koordinat statis (`coords.ts`, `gis-static.ts`):

| Endpoint | Output |
|----------|--------|
| `GET /api/gis/map` | Titik GPS, statistik kabupaten/kecamatan, cluster |
| `GET /api/gis/insights` | Narasi insight spasial otomatis |
| `GET /api/gis/stats` | KPI GIS (coverage GPS, completion rate) |
| `GET /api/gis/services` | Daftar layanan publik (RS, shelter, dll.) |
| `GET /api/gis/boundaries/{level}` | GeoJSON batas wilayah (simplified box) |

---

## 5. Struktur File Modul GIS

```
frontend/src/features/gis/
├── pages/
│   └── GISPage.tsx              # Layout halaman utama
├── components/
│   ├── GisMap.tsx               # Peta Leaflet (inti)
│   ├── GISToolbar.tsx           # Toolbar alat spasial
│   ├── LayerControl.tsx         # Toggle layer
│   ├── Legend.tsx               # Legenda warna
│   ├── SpatialInsight.tsx       # Panel insight kanan
│   ├── MiniStats.tsx            # KPI ringkas atas
│   ├── ClusterAnalysisMenu.tsx  # Pilih DBSCAN/K-Means/Grid
│   ├── HotspotControls.tsx      # Slider hotspot
│   ├── RadiusPanel.tsx          # Hasil analisis radius
│   ├── BufferPanel.tsx          # Buffer layanan publik
│   ├── NearestPanel.tsx         # Layanan terdekat
│   ├── GeocodeSearch.tsx        # Pencarian lokasi
│   └── ExportControl.tsx        # Export GeoJSON/CSV/PNG
├── hooks/
│   └── useGisData.ts            # React Query + Nominatim
├── context/
│   └── GisContext.tsx           # State layer, tool, hasil analisis
├── utils/
│   ├── spatial.ts               # Turf.js helpers
│   ├── clustering.ts            # DBSCAN, K-Means, Grid
│   ├── colors.ts                # Palet choropleth & cluster
│   └── export.ts                # Download file
└── types/
    └── gis.ts                   # TypeScript interfaces

frontend/src/lib/leaflet-setup.ts  # Fix icon marker Vite
frontend/src/styles/leaflet-heatmap.css

functions/lib/
├── gis.ts                         # API GIS (production)
├── gis-static.ts                  # Layanan publik & boundary GeoJSON
└── coords.ts                      # Lookup koordinat kabupaten/kota
```

---

## 6. Fitur GIS Intelligence

| Kategori | Fitur |
|----------|-------|
| **Visualisasi** | Marker GPS, cluster, heatmap, hotspot, choropleth |
| **Basemap** | OpenStreetMap, citra satelit Esri |
| **Wilayah** | Layer batas provinsi & kabupaten |
| **Analisis** | Radius, polygon draw, buffer layanan, nearest service |
| **Clustering** | DBSCAN, K-Means, Grid, MarkerCluster |
| **Geocoding** | Search lokasi, reverse geocode (klik peta) |
| **Layanan** | RS, Polsek, LBH, Shelter, Psikolog, P2TP2A, Kejaksaan, Pengadilan, Puskesmas |
| **Insight** | Panel statistik + rekomendasi otomatis dari API |
| **Export** | GeoJSON, CSV, PNG |
| **Filter** | Terintegrasi filter global aplikasi (tahun, wilayah, dll.) |

---

## 7. Perbandingan dengan Stack Grafik

| Aspek | Grafik (Analitik) | GIS Intelligence |
|-------|-------------------|------------------|
| Engine utama | Apache ECharts 6 | Leaflet 1.9 |
| Wrapper React | echarts-for-react | Leaflet imperative (+ react-leaflet di mini map) |
| Analisis | Agregasi statistik | Turf.js + clustering custom |
| Data source | Supabase `/api/analytics/*` | Supabase `/api/gis/*` |
| Tile / basemap | — | OSM + Esri (eksternal) |
| Geocoding | — | Nominatim (eksternal) |
| Lisensi | Apache 2.0 (gratis) | BSD / MIT (gratis) |

---

## 8. Catatan Implementasi

1. **react-leaflet** ada di `package.json` tetapi halaman GIS utama (`GisMap.tsx`) memakai **Leaflet API langsung** via `useRef` — pola ini memberi kontrol penuh atas layer dinamis (heatmap, draw, cluster).
2. **Boundary GeoJSON** saat ini berupa **kotak simplified** per wilayah (`gis-static.ts`), bukan shapefile resmi BPS — cukup untuk demo choropleth.
3. **Koordinat fallback** — kasus tanpa GPS bisa di-resolve ke centroid kabupaten/kota via `coords.ts` + jitter hash.
4. **Geocode backfill** — script backend `npm run geocode` mengisi `latitude`/`longitude` di Supabase (NestJS, bukan library GIS npm).

---

## 9. Lisensi Paket GIS

| Paket | Lisensi |
|-------|---------|
| Leaflet | BSD 2-Clause |
| leaflet.markercluster | MIT |
| leaflet.heat | BSD |
| leaflet-draw | MIT |
| @turf/turf | MIT |
| react-leaflet | Hippocratic-2.1 |
| html2canvas | MIT |

Semua **gratis** untuk penggunaan komersial/non-komersial sesuai lisensi masing-masing.

---

*Terakhir diperbarui: Juli 2026 — sesuai `frontend/package.json` dan kode di `frontend/src/features/gis/`.*
