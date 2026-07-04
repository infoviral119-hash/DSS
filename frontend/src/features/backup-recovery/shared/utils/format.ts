export function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatDuration(ms: number) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const content = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function repoHealthLabel(usagePercent: number, status: string) {
  if (status === 'offline') return 'Critical'
  if (usagePercent >= 90) return 'Critical'
  if (usagePercent >= 75) return 'Warning'
  if (usagePercent >= 50) return 'Healthy'
  return 'Excellent'
}
