import { useGis } from '@/features/gis/context/GisContext'
import { useGisServices } from '@/features/gis/hooks/useGisData'

export function BufferPanel() {
  const { bufferService, setBufferService, bufferKm, setBufferKm, layers, setLayers } = useGis()
  const { data: services } = useGisServices()
  const shelters = (services ?? []).filter((s) => s.category === 'shelter')

  return (
    <section className="rounded border border-border p-2 text-xs">
      <p className="mb-2 font-semibold">Buffer Analysis</p>
      <select
        className="mb-2 w-full rounded border border-border bg-background px-2 py-1"
        value={bufferService?.id ?? ''}
        onChange={(e) => {
          const svc = shelters.find((s) => s.id === e.target.value) ?? null
          setBufferService(svc)
          setLayers((p) => ({ ...p, buffer: Boolean(svc) }))
        }}
      >
        <option value="">Pilih layanan...</option>
        {shelters.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <div className="flex flex-wrap gap-1">
        {[1, 3, 5, 10].map((km) => (
          <button
            key={km}
            type="button"
            className={`rounded px-2 py-0.5 ${bufferKm === km ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setBufferKm(km)}
          >
            {km} km
          </button>
        ))}
      </div>
      {bufferService && layers.buffer && (
        <p className="mt-2 text-muted-foreground">
          Buffer {bufferKm} km dari {bufferService.name}
        </p>
      )}
    </section>
  )
}
