import { useGis } from '@/features/gis/context/GisContext'

export function HotspotControls() {
  const { hotspot, setHotspot, layers, toggleLayer } = useGis()

  return (
    <section className="rounded border border-border p-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold">Hotspot (KDE)</p>
        <label className="flex items-center gap-1 text-[10px]">
          <input type="checkbox" checked={layers.hotspot} onChange={() => toggleLayer('hotspot')} />
          Aktif
        </label>
      </div>
      <div className="space-y-2 text-xs">
        <SliderRow label="Intensity" value={hotspot.intensity} min={0.3} max={2} step={0.1}
          onChange={(v) => setHotspot((p) => ({ ...p, intensity: v }))} />
        <SliderRow label="Radius" value={hotspot.radius} min={20} max={80} step={2}
          onChange={(v) => setHotspot((p) => ({ ...p, radius: v }))} />
        <SliderRow label="Opacity" value={hotspot.opacity} min={0.2} max={1} step={0.05}
          onChange={(v) => setHotspot((p) => ({ ...p, opacity: v }))} />
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded">
        {['#16A34A', '#F59E0B', '#F97316', '#DC2626'].map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Hijau → Merah = konsentrasi tinggi</p>
    </section>
  )
}

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
