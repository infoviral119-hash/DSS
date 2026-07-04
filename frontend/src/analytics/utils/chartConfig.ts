export const CHART_TOOLBOX = {
  right: 12,
  feature: {
    saveAsImage: { title: 'PNG', type: 'png' },
    dataView: { readOnly: true, title: 'Data' },
    restore: { title: 'Reset' },
    dataZoom: { title: { zoom: 'Zoom', back: 'Reset zoom' } },
  },
}

export const CHART_ANIMATION = { animationDuration: 400, animationEasing: 'cubicOut' as const }

export function chartHeight(rows = 1) {
  return Math.max(280, rows * 80)
}
