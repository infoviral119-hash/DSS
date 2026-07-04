export function normalizeProsesPenerimaan(catatan?: string | null): string {
  const raw = String(catatan ?? '').trim()
  if (!raw) return 'Tidak diketahui'
  const tagged = raw.match(/penerimaan\s*:\s*([^|]+)/i)
  if (tagged) {
    const v = tagged[1].trim().toLowerCase()
    if (v.includes('website')) return 'Website'
    if (v.includes('hotline')) return 'Hotline'
    if (v.includes('datang') || v.includes('tatap') || v.includes('home visit')) return 'Datang Langsung'
  }
  const text = raw.toLowerCase()
  if (/\bwebsite\b/.test(text)) return 'Website'
  if (/\bhotline\b/.test(text)) return 'Hotline'
  if (/datang\s*langsung|tatap\s*muka|home\s*visit/.test(text)) return 'Datang Langsung'
  return 'Tidak diketahui'
}

export function isDirujuk(catatan?: string | null, outcome?: string | null): boolean {
  return `${catatan ?? ''} ${outcome ?? ''}`.toLowerCase().includes('rujuk')
}
