import type { GlobalFilters } from '@/types'

const TREEMAP_DEPTH: (keyof GlobalFilters)[] = ['kabupaten', 'jenisKekerasan', 'status']
const SUNBURST_DEPTH: (keyof GlobalFilters)[] = ['kabupaten', 'jenisKekerasan', 'jenisKelamin', 'status']

export function drillFromPath(
  depth: (keyof GlobalFilters)[],
  path: { name: string }[],
  setFilters: (f: Partial<GlobalFilters>) => void,
) {
  const patch: Partial<GlobalFilters> = {}
  path.slice(1).forEach((node, i) => {
    const key = depth[i]
    if (key) (patch as Record<string, string>)[key] = node.name
  })
  if (Object.keys(patch).length) setFilters(patch)
}

export function drillTreemap(path: { name: string }[], setFilters: (f: Partial<GlobalFilters>) => void) {
  drillFromPath(TREEMAP_DEPTH, path, setFilters)
}

export function drillSunburst(path: { name: string }[], setFilters: (f: Partial<GlobalFilters>) => void) {
  drillFromPath(SUNBURST_DEPTH, path, setFilters)
}

export function drillSimple(
  field: keyof GlobalFilters,
  value: string,
  setFilters: (f: Partial<GlobalFilters>) => void,
) {
  if (value && value !== 'Kasus' && value !== 'Tidak diketahui') {
    setFilters({ [field]: value })
  }
}
