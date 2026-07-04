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

export function normalizeKonselingMode(statusPendampingan?: string | null, catatan?: string | null): string {
  for (const src of [String(catatan ?? ''), String(statusPendampingan ?? '')]) {
    const tagged = src.match(/konseling\s*:\s*(online|offline)/i)
    if (tagged) return tagged[1].toLowerCase() === 'online' ? 'Online' : 'Offline'
  }
  const text = `${statusPendampingan ?? ''} ${catatan ?? ''}`.toLowerCase()
  if (/\boffline\b|tatap\s*muka|\btatap\b|luring/.test(text) && !/\bonline\b|daring/.test(text)) return 'Offline'
  if (/\bonline\b|daring|zoom|virtual/.test(text)) return 'Online'
  return 'Tidak diketahui'
}

export function normalizePendidikan(value?: string | null): string {
  const raw = String(value ?? '').trim()
  if (!raw || raw.toLowerCase().includes('tidak')) return 'Tidak diketahui'
  const u = raw.toUpperCase()
  if (u === 'SD' || u.startsWith('TK')) return 'SD / TK'
  if (u === 'SMP') return 'SMP'
  if (u === 'SMA' || u === 'SMK' || u.includes('SMA')) return 'SMA / SMK'
  if (u === 'PT' || u === 'S1' || u === 'S2' || u.includes('SARJANA')) return 'Perguruan Tinggi'
  if (u.startsWith('D') || u === 'DIPLOMA') return 'Diploma'
  if (u === 'PAKET C') return 'Paket C'
  return raw
}

export function isDirujuk(catatan?: string | null, outcome?: string | null): boolean {
  return `${catatan ?? ''} ${outcome ?? ''}`.toLowerCase().includes('rujuk')
}

function roleToSecuritySlug(role: string) {
  const map: Record<string, string> = {
    admin: 'super_admin', operator: 'operator', supervisor: 'supervisor',
    auditor: 'auditor', psikolog: 'analyst', direktur: 'executive', ketua_yayasan: 'executive',
  }
  return map[role] ?? role
}

export { roleToSecuritySlug }
