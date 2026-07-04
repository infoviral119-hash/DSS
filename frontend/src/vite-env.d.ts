/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const content: string
  export default content
}

declare module 'leaflet.markercluster' {
  import * as L from 'leaflet'
  export = L
}

declare module 'leaflet-draw' {
  import * as L from 'leaflet'
  export = L
}

declare namespace L {
  function markerClusterGroup(options?: Record<string, unknown>): MarkerClusterGroup
  interface MarkerClusterGroup extends FeatureGroup {
    addLayer(layer: Layer): this
  }

  namespace Draw {
    const Event: { CREATED: string }
  }

  namespace DrawEvents {
    interface Created extends LeafletEvent {
      layer: Layer
      layerType: string
    }
  }

  namespace Control {
    class Draw extends Control {
      constructor(options?: Record<string, unknown>)
    }
  }
}
