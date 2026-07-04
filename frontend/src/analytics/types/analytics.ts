export interface ParetoItem {
  name: string
  count: number
  cumulativePct: number
}

export interface ParetoResponse {
  connected: boolean
  total: number
  items: ParetoItem[]
}

export interface TreeNode {
  name: string
  value?: number
  children?: TreeNode[]
}

export interface TreemapResponse {
  connected: boolean
  tree: TreeNode
}

export interface HeatmapResponse {
  connected: boolean
  months: string[]
  jenis: string[]
  data: [number, number, number][]
  max: number
}

export interface StackedAreaResponse {
  connected: boolean
  months: string[]
  aktif: number[]
  selesai: number[]
  dirujuk: number[]
}

export type AnalyticsChartKey =
  | 'pareto' | 'treemap' | 'sunburst' | 'heatmap' | 'stacked-area'
  | 'sankey' | 'funnel' | 'waterfall' | 'scatter' | 'bubble'

export interface SankeyResponse {
  connected: boolean
  nodes: { name: string }[]
  links: { source: string; target: string; value: number }[]
}

export interface FunnelResponse {
  connected: boolean
  stages: { name: string; value: number }[]
  note?: string
}

export interface WaterfallResponse {
  connected: boolean
  points: { name: string; value: number; isTotal?: boolean }[]
}

export interface ScatterResponse {
  connected: boolean
  points: { usia: number; lama: number; jenis: string; pendampingan: number }[]
}

export interface BubbleResponse {
  connected: boolean
  bubbles: { name: string; usiaAvg: number; count: number }[]
}
