import { formatNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Target, Gauge, Brain, Calendar, BarChart3 } from 'lucide-react'

interface ForecastSummaryProps {
  data: {
    executiveSummary: string[]
    nextMonth: { month: string; predicted: number }
    metrics: { accuracy: number; mape: number }
    modelName: string
    trendClass: string
    seasonality: { detected: boolean }
    forecastQuality: { score: number; label: string }
    nextQuarter: number
    nextYear: number
    confidenceLevel: number
  }
}

export function ForecastSummary({ data }: ForecastSummaryProps) {
  const kpis = [
    { label: 'Bulan Depan', value: formatNumber(data.nextMonth.predicted), sub: data.nextMonth.month, icon: Calendar },
    { label: 'Triwulan', value: formatNumber(data.nextQuarter), sub: 'total prediksi', icon: BarChart3 },
    { label: 'Akurasi', value: `${data.metrics.accuracy}%`, sub: `MAPE ${data.metrics.mape}%`, icon: Target },
    { label: 'Model', value: data.modelName, sub: data.trendClass, icon: Brain },
    { label: 'Confidence', value: `${data.confidenceLevel}%`, sub: data.forecastQuality.label, icon: Gauge },
    { label: 'Quality', value: `${data.forecastQuality.score}`, sub: '/100', icon: TrendingUp },
  ]

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Executive Forecast Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {data.executiveSummary.map((line, i) => (
            <p key={i} className="text-sm">{line}</p>
          ))}
          <p className="text-xs text-muted-foreground">
            Seasonality: {data.seasonality.detected ? 'Ya' : 'Tidak ditemukan'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 text-center">
              <k.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
              <p className="truncate text-sm font-bold">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
