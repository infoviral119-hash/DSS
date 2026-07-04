import { useState, useEffect } from 'react'

import { Loader2 } from 'lucide-react'

import { useApp } from '@/contexts/AppContext'

import { useReportIntelligence, type ReportParams } from '@/features/reports/hooks/useReport'

import { ExecutiveSummary } from '@/features/reports/components/ExecutiveSummary'

import { QuickReport, ReportCategories } from '@/features/reports/components/QuickReport'

import { ReportExporter } from '@/features/reports/components/ReportExporter'

import { ReportHistory, MetadataPanel } from '@/features/reports/components/ReportHistory'

import { DynamicReportBuilder } from '@/features/reports/components/DynamicReportBuilder'

import { ReportViewer } from '@/features/reports/components/ReportViewer'

import {

  ScheduleManagerFull, ApprovalWorkflow, DigitalSignature,

  ReportSharing, VersionControl, AuditTrail,

} from '@/features/reports/components/WorkflowPanels'

import { TEMPLATE_OPTIONS, WATERMARK_OPTIONS, type QuickPeriod } from '@/features/reports/types/report'

import type { ReportWidgetId } from '@/features/reports/types/workflow'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'



const DEFAULT_WIDGETS: ReportWidgetId[] = ['kpi', 'chart_status', 'chart_trend', 'chart_jenis', 'table_kab', 'gis', 'forecast', 'ai', 'comparison']



export function ReportPage() {

  const { setFilters } = useApp()

  const [params, setParams] = useState<ReportParams>({

    category: 'executive',

    period: 'custom',

    template: 'internal',

    watermark: 'INTERNAL',

  })

  const [widgets, setWidgets] = useState<ReportWidgetId[]>(DEFAULT_WIDGETS)



  const { data, isLoading, isError } = useReportIntelligence(params)

  useEffect(() => {
    if (data?.reportId && params.reportId !== data.reportId) {
      setParams((p) => ({ ...p, reportId: data.reportId }))
    }
  }, [data?.reportId, params.reportId])



  const onDrill = (field: 'kabupaten' | 'kecamatan', value: string) => {

    setFilters({ [field]: value })

  }



  if (isLoading) {

    return (

      <div className="flex min-h-[320px] items-center justify-center gap-2 text-sm text-muted-foreground">

        <Loader2 className="h-5 w-5 animate-spin" />

        Menyusun laporan...

      </div>

    )

  }



  if (isError || !data) {

    return <p className="text-sm text-red-600">Gagal memuat laporan. Pastikan backend berjalan.</p>

  }



  const sig = data.digitalSignature as { qrUrl: string; hash: string; verificationUrl: string; signedAt: string } | undefined

  const tpl = data.templateConfig as { header: string; primary: string; footer: string } | undefined



  return (

    <div id="report-viewer-root" className="space-y-4">

      <div

        className="rounded-lg border px-4 py-3 text-white"

        style={{ backgroundColor: tpl?.primary ?? '#1e40af' }}

      >

        <p className="text-sm font-semibold">{tpl?.header ?? 'e-Insight DSS'}</p>

        <p className="text-xs opacity-90">

          {data.reportId} · v{data.version} · {data.watermark} · {new Date(data.generatedAt).toLocaleString('id-ID')}

        </p>

      </div>



      <div className="flex flex-wrap gap-2">

        <select className="rounded border border-border bg-background px-2 py-1 text-xs" value={params.template} onChange={(e) => setParams((p) => ({ ...p, template: e.target.value }))}>

          {TEMPLATE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}

        </select>

        <select className="rounded border border-border bg-background px-2 py-1 text-xs" value={params.watermark} onChange={(e) => setParams((p) => ({ ...p, watermark: e.target.value }))}>

          {WATERMARK_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}

        </select>

      </div>



      <QuickReport period={(params.period ?? 'custom') as QuickPeriod} onChange={(period) => setParams((p) => ({ ...p, period }))} />

      <ReportCategories category={params.category ?? 'executive'} onChange={(category) => setParams((p) => ({ ...p, category }))} />

      <DynamicReportBuilder widgets={widgets} onChange={setWidgets} />



      <ExecutiveSummary data={data} />



      <Card>

        <CardHeader className="pb-2"><CardTitle className="text-sm">Interactive Report Viewer</CardTitle></CardHeader>

        <CardContent>

          <ReportViewer data={data} widgets={widgets} onDrill={onDrill} />

        </CardContent>

      </Card>



      <div className="grid gap-4 lg:grid-cols-2">

        <ReportExporter params={{ ...params, reportId: data.reportId }} />

        <MetadataPanel metadata={data.metadata} approval={data.approval} watermark={data.watermark} />

      </div>



      <div className="grid gap-4 lg:grid-cols-2">

        <ApprovalWorkflow reportId={data.reportId} approval={data.approval} />

        <DigitalSignature sig={sig} />

      </div>



      <div className="grid gap-4 lg:grid-cols-2">

        <ReportSharing reportId={data.reportId} />

        <VersionControl reportId={data.reportId} versions={data.versionHistory} />

      </div>



      <ScheduleManagerFull />

      <AuditTrail />

      <ReportHistory />

    </div>

  )

}


