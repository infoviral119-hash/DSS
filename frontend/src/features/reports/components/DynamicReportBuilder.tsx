import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REPORT_WIDGETS, type ReportWidgetId } from '@/features/reports/types/workflow'
import { useReportLayouts, useReportMutations } from '@/features/reports/hooks/useReport'
import { GripVertical, Plus, Save } from 'lucide-react'

interface DynamicReportBuilderProps {
  widgets: ReportWidgetId[]
  onChange: (widgets: ReportWidgetId[]) => void
}

export function DynamicReportBuilder({ widgets, onChange }: DynamicReportBuilderProps) {
  const { data: layouts } = useReportLayouts()
  const { saveLayout } = useReportMutations()
  const [name, setName] = useState('Layout Custom')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addWidget = (id: ReportWidgetId) => {
    if (!widgets.includes(id)) onChange([...widgets, id])
  }

  const move = (from: number, to: number) => {
    const next = [...widgets]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const remove = (id: ReportWidgetId) => onChange(widgets.filter((w) => w !== id))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Dynamic Report Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {REPORT_WIDGETS.map((w) => (
            <Button key={w.id} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => addWidget(w.id)}>
              <Plus className="mr-1 h-3 w-3" />{w.label}
            </Button>
          ))}
        </div>

        <div className="rounded border border-dashed border-border p-2">
          <p className="mb-2 text-[10px] text-muted-foreground">Susunan laporan (drag untuk urutkan)</p>
          {widgets.map((id, i) => {
            const label = REPORT_WIDGETS.find((w) => w.id === id)?.label ?? id
            return (
              <div
                key={`${id}-${i}`}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIdx != null && dragIdx !== i) move(dragIdx, i); setDragIdx(null) }}
                className="mb-1 flex items-center gap-2 rounded bg-muted/50 px-2 py-1 text-xs"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <span className="flex-1">{label}</span>
                <button type="button" className="text-red-500" onClick={() => remove(id)}>×</button>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            className="rounded border border-border bg-background px-2 py-1 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama layout"
          />
          <Button size="sm" className="gap-1" onClick={() => saveLayout.mutate({ name, widgets })}>
            <Save className="h-3 w-3" /> Simpan Layout
          </Button>
          {layouts?.map((l) => (
            <Button key={l.id} size="sm" variant="secondary" className="text-[10px]" onClick={() => onChange(l.widgets as ReportWidgetId[])}>
              Muat: {l.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
