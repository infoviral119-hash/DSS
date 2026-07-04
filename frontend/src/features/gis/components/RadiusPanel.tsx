import { useGis } from '@/features/gis/context/GisContext'
import type { RadiusResult } from '@/features/gis/types/gis'
import { formatNumber } from '@/lib/utils'

const RADIUS_OPTIONS = [500, 1000, 2000, 5000, 10000]

export function RadiusPanel({ result }: { result: RadiusResult }) {
  const { radiusM, setRadiusM } = useGis()

  return (
    <section className="rounded border border-border p-2 text-xs">
      <p className="mb-2 font-semibold">Kasus Radius</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {RADIUS_OPTIONS.map((m) => (
          <button
            key={m}
            type="button"
            className={`rounded px-2 py-0.5 ${radiusM === m ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setRadiusM(m)}
          >
            {m >= 1000 ? `${m / 1000} km` : `${m} m`}
          </button>
        ))}
      </div>
      <p className="font-medium">{formatNumber(result.count)} kasus dalam radius</p>
      <div className="mt-2 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground">Jenis</p>
        {Object.entries(result.byJenis).slice(0, 5).map(([k, v]) => (
          <div key={k} className="flex justify-between"><span>{k}</span><span>{v}</span></div>
        ))}
      </div>
      <div className="mt-2 max-h-24 overflow-y-auto">
        {result.cases.slice(0, 8).map((c) => (
          <p key={c.id} className="truncate text-[10px]">{c.nomorRegister} — {c.jenisKekerasan}</p>
        ))}
      </div>
    </section>
  )
}
