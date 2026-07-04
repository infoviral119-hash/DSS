import type { GisMapPoint } from '@/features/gis/types/gis'
import { clusterColor } from '@/features/gis/utils/colors'

export interface ClusterGroup {
  id: number
  color: string
  count: number
  center: [number, number]
  points: GisMapPoint[]
}

function distDeg(a: [number, number], b: [number, number]) {
  const dlat = a[0] - b[0]
  const dlng = a[1] - b[1]
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

export function dbscanCluster(points: GisMapPoint[], epsDeg = 0.015, minPts = 3): ClusterGroup[] {
  const visited = new Set<string>()
  const clusters: ClusterGroup[] = []
  let clusterId = 0

  const neighbors = (p: GisMapPoint) =>
    points.filter((q) => q.id !== p.id && distDeg([p.lat, p.lng], [q.lat, q.lng]) <= epsDeg)

  for (const p of points) {
    if (visited.has(p.id)) continue
    visited.add(p.id)
    const nbs = neighbors(p)
    if (nbs.length + 1 < minPts) continue

    const group: GisMapPoint[] = [p]
    const queue = [...nbs]
    while (queue.length) {
      const cur = queue.pop()!
      if (!visited.has(cur.id)) {
        visited.add(cur.id)
        const curNbs = neighbors(cur)
        if (curNbs.length + 1 >= minPts) queue.push(...curNbs)
      }
      if (!group.some((g) => g.id === cur.id)) group.push(cur)
    }

    const lat = group.reduce((s, x) => s + x.lat, 0) / group.length
    const lng = group.reduce((s, x) => s + x.lng, 0) / group.length
    clusters.push({ id: clusterId++, color: clusterColor(clusterId), count: group.length, center: [lat, lng], points: group })
  }
  return clusters
}

export function kmeansCluster(points: GisMapPoint[], k = 5, maxIter = 20): ClusterGroup[] {
  if (points.length === 0) return []
  const kk = Math.min(k, points.length)
  const centroids: [number, number][] = points.slice(0, kk).map((p) => [p.lat, p.lng])

  for (let iter = 0; iter < maxIter; iter++) {
    const groups: GisMapPoint[][] = Array.from({ length: kk }, () => [])
    for (const p of points) {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < kk; i++) {
        const d = distDeg([p.lat, p.lng], centroids[i])
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      groups[best].push(p)
    }
    let moved = false
    for (let i = 0; i < kk; i++) {
      if (groups[i].length === 0) continue
      const lat = groups[i].reduce((s, x) => s + x.lat, 0) / groups[i].length
      const lng = groups[i].reduce((s, x) => s + x.lng, 0) / groups[i].length
      if (distDeg(centroids[i], [lat, lng]) > 0.0001) moved = true
      centroids[i] = [lat, lng]
    }
    if (!moved) break
  }

  const final: GisMapPoint[][] = Array.from({ length: kk }, () => [])
  for (const p of points) {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < kk; i++) {
      const d = distDeg([p.lat, p.lng], centroids[i])
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    final[best].push(p)
  }

  return final
    .filter((g) => g.length > 0)
    .map((g, i) => ({
      id: i,
      color: clusterColor(i),
      count: g.length,
      center: centroids[i],
      points: g,
    }))
}

export function gridCluster(points: GisMapPoint[], cellDeg = 0.05): ClusterGroup[] {
  const grid = new Map<string, GisMapPoint[]>()
  for (const p of points) {
    const gx = Math.floor(p.lat / cellDeg)
    const gy = Math.floor(p.lng / cellDeg)
    const key = `${gx}:${gy}`
    const arr = grid.get(key) ?? []
    arr.push(p)
    grid.set(key, arr)
  }
  return [...grid.entries()].map(([key, pts], i) => {
    const lat = pts.reduce((s, x) => s + x.lat, 0) / pts.length
    const lng = pts.reduce((s, x) => s + x.lng, 0) / pts.length
    return { id: i, color: clusterColor(i), count: pts.length, center: [lat, lng], points: pts, key }
  }) as ClusterGroup[]
}
