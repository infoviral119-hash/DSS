export const GIS_COLORS = {
  blue: '#2563EB',
  green: '#16A34A',
  orange: '#F59E0B',
  red: '#DC2626',
  gray: '#6B7280',
} as const

export const HOTSPOT_GRADIENT: Record<number, string> = {
  0.0: '#16A34A',
  0.35: '#F59E0B',
  0.65: '#F97316',
  1.0: '#DC2626',
}

export function choroplethColor(value: number, max: number): string {
  if (max <= 0) return GIS_COLORS.gray
  const ratio = value / max
  if (ratio > 0.75) return GIS_COLORS.red
  if (ratio > 0.5) return GIS_COLORS.orange
  if (ratio > 0.25) return '#FCD34D'
  return GIS_COLORS.green
}

export function clusterColor(index: number): string {
  const palette = [GIS_COLORS.blue, GIS_COLORS.green, GIS_COLORS.orange, GIS_COLORS.red, '#7C3AED', '#0891B2']
  return palette[index % palette.length]
}

export function legendBuckets(max: number) {
  return [
    { label: `>${Math.round(max * 0.75)}`, color: GIS_COLORS.red },
    { label: `${Math.round(max * 0.5)}–${Math.round(max * 0.75)}`, color: GIS_COLORS.orange },
    { label: `<${Math.round(max * 0.25)}`, color: GIS_COLORS.green },
  ]
}
