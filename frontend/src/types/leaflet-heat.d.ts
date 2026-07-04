import 'leaflet'

declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number
    maxZoom?: number
    radius?: number
    blur?: number
    max?: number
    gradient?: Record<number, string>
  }

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: [number, number, number][]): this
    redraw(): this
  }

  function heatLayer(latlngs: [number, number, number][], options?: HeatLayerOptions): HeatLayer
}

declare module 'leaflet.heat'
