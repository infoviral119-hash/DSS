Nama Aplikasi Anda

Deskripsi singkat modul peta / spasial aplikasi Anda

Version 1.0 • [Bulan Tahun]

---

# GIS — Review Library & Node Modules

> Salin ke `doc/GIS-NODE-MODULES.md` di repositori baru.
> Hapus file ini jika aplikasi **tidak** memiliki fitur peta.

Modul **Peta / GIS** (`/peta` atau `/maps`) menampilkan data berbasis koordinat di peta interaktif browser.

Tidak memakai Mapbox GL, Google Maps SDK berbayar, atau ArcGIS API — stack di bawah ini **open-source** dan berjalan di client.

---

## 1. Ringkasan Stack GIS

| Lapisan | Teknologi | Peran |
|---------|-----------|-------|
| **Peta interaktif** | [Leaflet](https://leafletjs.com/) | Engine peta (`L.map`, tile, marker) |
| **Integrasi React** | Leaflet imperative atau `react-leaflet` | Render di komponen React |
| **Analisis spasial** | [Turf.js](https://turfjs.org/) | Jarak, buffer, point-in-polygon |
| **Heatmap / cluster** | `leaflet.heat`, `leaflet.markercluster` | Visualisasi kepadatan titik |
| **Gambar area** | `leaflet-draw` | Polygon untuk analisis *(opsional)* |
| **Basemap** | OpenStreetMap, Esri, Carto, dll. | Tile layer *(pilih provider)* |
| **Geocoding** | Nominatim, Pelias, atau provider lain | Search & reverse geocode |
| **Data** | API backend Anda (`/api/maps/*`) | Titik, statistik wilayah |
| **Export** | `html2canvas`, GeoJSON native | PNG, GeoJSON, CSV |

---

## 2. Node Modules — Dependensi npm GIS

Semua paket GIS biasanya berada di **`frontend/package.json`**.

### Dependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `leaflet` | ^1.9.x | Engine peta utama |
| `leaflet.markercluster` | ^1.5.x | Kluster marker saat zoom out |
| `leaflet.heat` | ^0.2.x | Heatmap & hotspot layer |
| `leaflet-draw` | ^1.0.x | Gambar polygon *(opsional)* |
| `@turf/turf` | ^7.x | `distance`, `circle`, `booleanPointInPolygon` |
| `html2canvas` | ^1.x | Export screenshot peta ke PNG |
| `react-leaflet` | ^5.x | *(opsional)* wrapper React — alternatif Leaflet langsung |
| *(tambahkan baris per paket)* | | |

### DevDependencies

| Paket | Versi | Fungsi |
|-------|-------|--------|
| `@types/leaflet` | ^1.9.x | TypeScript types Leaflet |
| `@types/leaflet-draw` | ^1.0.x | Types Leaflet Draw *(jika dipakai)* |

### Perintah instalasi

```powershell
npm install leaflet leaflet.markercluster leaflet.heat @turf/turf --prefix frontend
npm install -D @types/leaflet --prefix frontend
```

---

## 3. Layanan Eksternal (bukan node_modules)

Ganti URL dengan provider yang Anda pilih. **Jangan** mengandalkan domain produksi proyek lain.

| Layanan | URL contoh | Dipakai untuk |
|---------|------------|---------------|
| **OpenStreetMap** | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Basemap standar |
| **Esri World Imagery** | `https://server.arcgisonline.com/.../World_Imagery/...` | Basemap satelit |
| **Nominatim** | `https://nominatim.openstreetmap.org/` | Geocode & reverse *(hormati rate limit)* |
| **Google Maps** | `https://www.google.com/maps/dir/...` | Hanya **link** navigasi, bukan SDK |

> Untuk produksi skala besar: pertimbangkan self-host tile server atau geocoding berbayar (MapTiler, LocationIQ, dll.).

---

## 4. Library per Fitur

| Fitur UI | Library / implementasi |
|----------|------------------------|
| Basemap | `L.tileLayer(urlTemplate)` |
| Marker data | `L.circleMarker` / `L.marker` + popup |
| Marker cluster | `L.markerClusterGroup()` |
| Heatmap | `L.heatLayer([[lat, lng, intensity], ...])` |
| Choropleth wilayah | `L.geoJSON(geojson, { style })` |
| Analisis radius | `turf.circle` + filter titik |
| Analisis polygon | `leaflet-draw` + `turf.booleanPointInPolygon` |
| Jarak terdekat | `turf.distance` |
| Export GeoJSON | `JSON.stringify` FeatureCollection |
| Export PNG | `html2canvas` pada container peta |

**Clustering custom (tanpa plugin):** DBSCAN, K-Means, atau grid — implementasi JavaScript murni di `utils/clustering.ts`.

---

## 5. API Backend GIS

Sesuaikan prefix route dengan konvensi proyek baru (`/api/maps`, `/api/spatial`, dll.):

| Endpoint | Output |
|----------|--------|
| `GET /api/maps/points` | Daftar titik + metadata |
| `GET /api/maps/stats` | KPI spasial (coverage koordinat, agregat wilayah) |
| `GET /api/maps/insights` | Narasi insight otomatis *(opsional)* |
| `GET /api/maps/boundaries/:level` | GeoJSON batas provinsi/kabupaten |
| `GET /api/maps/services` | Titik layanan publik *(opsional)* |

Backend **tidak wajib** memakai library GIS npm — cukup query database + kembalikan JSON/GeoJSON.

---

## 6. Struktur Folder Modul GIS (contoh)

```
src/features/maps/
├── pages/
│   └── MapsPage.tsx
├── components/
│   ├── MapView.tsx          # Leaflet utama
│   ├── MapToolbar.tsx
│   ├── LayerControl.tsx
│   └── SpatialPanel.tsx
├── hooks/
│   └── useMapData.ts
├── utils/
│   ├── spatial.ts           # Turf helpers
│   ├── clustering.ts        # DBSCAN / K-Means *(opsional)*
│   └── export.ts
└── types/
    └── maps.ts
```

---

## 7. Fitur GIS (centang yang direncanakan)

| Kategori | Fitur |
|----------|-------|
| **Visualisasi** | Marker, cluster, heatmap, choropleth |
| **Basemap** | OSM, satelit, ganti layer |
| **Wilayah** | Batas provinsi / kabupaten |
| **Analisis** | Radius, polygon, buffer, nearest point |
| **Geocoding** | Cari lokasi, klik → alamat |
| **Export** | GeoJSON, CSV, PNG |
| **Filter** | Terintegrasi filter global aplikasi |

---

## 8. Perbandingan dengan Modul Grafik

| Aspek | Grafik (dashboard) | GIS (peta) |
|-------|-------------------|------------|
| Engine | Apache ECharts, Chart.js, dll. | Leaflet, MapLibre GL |
| Data | Agregasi statistik | Koordinat + GeoJSON |
| Render | Canvas/SVG di chart | Tile map + layer |
| Analisis | Sum, avg, trend | Jarak, buffer, cluster spasial |
| Docs grafik | https://echarts.apache.org/ | https://leafletjs.com/ |

---

## 9. Lisensi Paket GIS

| Paket | Lisensi |
|-------|---------|
| Leaflet | BSD 2-Clause |
| leaflet.markercluster | MIT |
| leaflet.heat | BSD |
| leaflet-draw | MIT |
| @turf/turf | MIT |
| html2canvas | MIT |

Semua **gratis** untuk penggunaan umum sesuai lisensi masing-masing.

---

## Checklist adopsi

- [ ] Salin file ini ke `doc/GIS-NODE-MODULES.md`
- [ ] Ganti nama modul & route (`/peta`, `/maps`, dll.)
- [ ] Pasang npm packages di `frontend/package.json`
- [ ] Tentukan tile provider & kebijakan geocoding
- [ ] Definisikan endpoint API di backend baru
- [ ] Hapus referensi ke domain / data wilayah proyek lain

---

*Template adopsi — perbarui setelah disesuaikan ke proyek aktual.*
