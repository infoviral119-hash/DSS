import type { GisMapPoint } from '@/features/gis/types/gis'

export function exportGeoJson(points: GisMapPoint[]) {
  const fc = {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: {
        id: p.id,
        register: p.nomorRegister,
        jenis: p.jenisKekerasan,
        status: p.status,
        kabupaten: p.kabupaten,
      },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
  downloadBlob(JSON.stringify(fc, null, 2), 'gis-kasus.geojson', 'application/geo+json')
}

export function exportCsv(points: GisMapPoint[]) {
  const headers = ['register', 'nama', 'jenis', 'status', 'gender', 'kabupaten', 'kecamatan', 'lat', 'lng']
  const rows = points.map((p) =>
    [p.nomorRegister, p.namaKorban, p.jenisKekerasan, p.status, p.jenisKelamin, p.kabupaten, p.kecamatan, p.lat, p.lng]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  downloadBlob([headers.join(','), ...rows].join('\n'), 'gis-kasus.csv', 'text/csv')
}

export function exportExcel(points: GisMapPoint[]) {
  exportCsv(points)
}

export async function exportPng(el: HTMLElement) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, { useCORS: true, allowTaint: true })
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gis-peta.png'
    a.click()
    URL.revokeObjectURL(url)
  })
}

export function exportPdf(_el: HTMLElement) {
  window.print()
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
