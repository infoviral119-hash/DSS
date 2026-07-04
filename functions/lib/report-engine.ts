type CountItem = { name: string; count: number }

const ROLE_SECTIONS: Record<string, string[]> = {
  operator: ['kpi', 'tables', 'charts'],
  supervisor: ['kpi', 'charts', 'tables', 'narrative'],
  admin: ['kpi', 'charts', 'tables', 'gis', 'forecast', 'ai', 'audit'],
  kepala_bidang: ['kpi', 'charts', 'gis', 'forecast', 'ai', 'recommendations'],
  kepala_dinas: ['kpi', 'charts', 'gis', 'forecast', 'ai', 'executive', 'recommendations'],
  direktur: ['executive', 'kpi', 'charts', 'forecast', 'ai', 'recommendations'],
  ketua_yayasan: ['executive', 'kpi', 'charts', 'forecast', 'ai', 'recommendations'],
}

const TEMPLATE_BRANDING: Record<string, { primary: string; header: string; footer: string }> = {
  kementerian: { primary: '#1e3a8a', header: 'Kementerian Pemberdayuan Perempuan dan Perlindungan Anak', footer: 'Dokumen Resmi Kementerian' },
  pemda: { primary: '#047857', header: 'Pemerintah Daerah', footer: 'Dokumen Resmi Pemda' },
  rs: { primary: '#0e7490', header: 'Rumah Sakit Rujukan', footer: 'Dokumen Klinis' },
  lbh: { primary: '#7c3aed', header: 'Lembaga Bantuan Hukum', footer: 'Dokumen LBH' },
  internal: { primary: '#1e40af', header: 'e-Insight Decision Support System', footer: 'Internal Use Only' },
  publik: { primary: '#374151', header: 'Laporan Publik SIMPATI.KK', footer: 'Dokumen Publik' },
}

export function periodLabelFromQuery(query: Record<string, string | undefined>) {
  const period = query.period || 'custom'
  const map: Record<string, string> = {
    today: 'Hari Ini', weekly: 'Minggu Ini', monthly: 'Bulan Ini', quarterly: 'Triwulan Ini',
    semester: 'Semester Ini', yearly: 'Tahun Ini', custom: 'Periode Filter Aktif',
  }
  if (query.tahun) return `Tahun ${query.tahun}`
  if (query.tanggal_from && query.tanggal_to) return `${query.tanggal_from} s/d ${query.tanggal_to}`
  return map[period] ?? map.custom
}

function topItem(items: CountItem[] | undefined) {
  return items?.[0]?.name ?? '-'
}

function dominantGender(gender: Record<string, number> | undefined) {
  if (!gender) return 'tidak diketahui'
  const sorted = Object.entries(gender).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'tidak diketahui'
}

function dominantAge(ageGroups: Record<string, number> | undefined) {
  if (!ageGroups) return ''
  const sorted = Object.entries(ageGroups).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  if (!top) return ''
  if (['18-25', '26-40'].includes(top[0])) return 'usia produktif'
  return `kelompok usia ${top[0]}`
}

type AiShape = {
  yoyGrowthPct: number
  executiveSummary: string[]
  decisionScore: number
  priorities?: { name: string; score: number; explain: string[] }[]
  recommendations?: { title: string; actions?: string[]; priority: string }[]
  riskMatrix?: { name: string; score: number; level: string }[]
  actionPlan?: { phase: string; items?: string[] }[]
  narrative?: string
  executiveBrief?: string
  insightCards?: unknown[]
}

export function buildReportIntelligence(input: {
  query: Record<string, string | undefined>
  overview: Record<string, unknown>
  trends: Record<string, unknown>
  demographics: Record<string, unknown>
  ai: AiShape
  gisStats?: Record<string, unknown>
  forecast?: Record<string, unknown>
  createdBy?: string
  approval?: { status: string; reviewer: string | null; reviewedAt: string | null; note: string; history?: unknown[] }
  version?: string
  docHash?: string
}): Record<string, unknown> {
  const { query, overview, trends, demographics, ai, gisStats, forecast, createdBy } = input
  const role = query.role || 'direktur'
  const category = query.category || 'executive'
  const template = query.template || 'internal'
  const watermark = query.watermark || 'INTERNAL'
  const periodLabel = periodLabelFromQuery(query)

  const total = Number(overview.total ?? 0)
  const aktif = Number(overview.aktif ?? 0)
  const selesai = Number(overview.selesai ?? 0)
  const completionRate = Number(overview.completionRate ?? 0)
  const topKab = topItem(overview.topKabupaten as CountItem[])
  const topJenis = topItem(overview.topJenisKekerasan as CountItem[])
  const topKec = topItem(overview.topKecamatan as CountItem[])
  const gender = demographics.gender as Record<string, number> | undefined
  const ageGroups = demographics.ageGroups as Record<string, number> | undefined

  const executiveSummary = [
    `Periode ${periodLabel}`,
    `${total} kasus dianalisis`,
    `${selesai} selesai · ${aktif} aktif`,
    `Completion Rate ${completionRate}%`,
    topKab !== '-' ? `${topKab} menjadi wilayah dengan kasus tertinggi.` : '',
    topJenis !== '-' ? `Jenis kekerasan terbanyak adalah ${topJenis}.` : '',
    `Mayoritas korban ${dominantGender(gender)} ${dominantAge(ageGroups)}.`.trim(),
  ].filter(Boolean)

  const narrative = [
    `Selama ${periodLabel.toLowerCase()} terjadi ${total} kasus pendampingan.`,
    ai.yoyGrowthPct > 0
      ? `Terjadi peningkatan ${ai.yoyGrowthPct}% dibanding periode sebelumnya.`
      : ai.yoyGrowthPct < 0
        ? `Terjadi penurunan ${Math.abs(ai.yoyGrowthPct)}% dibanding periode sebelumnya.`
        : 'Volume kasus relatif stabil.',
    topKab !== '-' ? `Kasus terkonsentrasi di ${topKab}.` : '',
    `Mayoritas korban ${dominantGender(gender)}.`,
    forecast ? 'Forecast menunjukkan potensi perubahan volume pada periode mendatang.' : '',
  ].filter(Boolean).join(' ')

  const aiSummary = ai.executiveSummary.length
    ? ai.executiveSummary
    : [
      `Sepanjang ${periodLabel.toLowerCase()} terjadi ${total} kasus.`,
      topJenis !== '-' ? `Mayoritas kasus merupakan ${topJenis}.` : '',
      topKab !== '-' ? `${topKab} menjadi penyumbang terbesar.` : '',
      `Penyelesaian mencapai ${completionRate}%.`,
      'Disarankan meningkatkan kapasitas pendamping dan mempercepat penyelesaian kasus aktif.',
    ].filter(Boolean)

  const yearlyLabels = (trends.labels as string[]) ?? []
  const yearlyValues = (trends.yearly as number[]) ?? []
  const comparison = yearlyLabels.length >= 2
    ? {
      label: `${yearlyLabels[yearlyLabels.length - 2]} vs ${yearlyLabels[yearlyLabels.length - 1]}`,
      before: yearlyValues[yearlyValues.length - 2] ?? 0,
      after: yearlyValues[yearlyValues.length - 1] ?? 0,
      deltaPct: yearlyValues[yearlyValues.length - 2]
        ? Math.round(((yearlyValues[yearlyValues.length - 1] - yearlyValues[yearlyValues.length - 2]) / yearlyValues[yearlyValues.length - 2]) * 100)
        : 0,
    }
    : null

  const reportId = query.reportId || `RPT-${Date.now().toString(36).toUpperCase()}`
  const version = input.version ?? '1.0'
  const now = new Date()
  const branding = TEMPLATE_BRANDING[template] ?? TEMPLATE_BRANDING.internal
  const docHash = input.docHash ?? 'pending'
  const verificationUrl = `e-insight://verify/${reportId}/${docHash}`

  return {
    generatedAt: now.toISOString(),
    reportId,
    version,
    category,
    role,
    template,
    watermark,
    periodLabel,
    templateConfig: branding,
    digitalSignature: {
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`,
      verificationUrl,
      hash: docHash,
      signedAt: now.toISOString(),
    },
    metadata: {
      period: periodLabel,
      createdAt: now.toISOString(),
      createdBy: createdBy ?? 'system',
      version,
      dataCount: total,
      filters: query,
      source: 'Supabase cases + e-Insight Analytics',
    },
    approval: input.approval ?? {
      status: 'draft' as const,
      reviewer: null,
      reviewedAt: null,
      note: 'Menunggu review',
      history: [],
    },
    executiveSummary,
    narrative,
    aiSummary,
    roleSections: ROLE_SECTIONS[role] ?? ROLE_SECTIONS.direktur,
    kpi: {
      total, aktif, selesai, completionRate,
      topKabupaten: topKab, topJenis, topKecamatan: topKec,
      forecastNextMonth: (forecast as { nextMonth?: { predicted?: number } })?.nextMonth?.predicted ?? null,
      decisionScore: ai.decisionScore,
    },
    recommendations: {
      priorities: (ai.priorities?.slice(0, 5) ?? []).map((p) => ({ name: p.name, score: p.score, explain: p.explain })),
      items: (ai.recommendations?.slice(0, 5) ?? []).map((r) => ({ title: r.title, actions: r.actions, priority: r.priority })),
      risks: (ai.riskMatrix?.slice(0, 5) ?? []).map((r) => ({ name: r.name, score: r.score, level: r.level })),
      actionPlan: (ai.actionPlan?.slice(0, 5) ?? []).map((a) => ({ step: a.phase, owner: a.items?.[0] ?? '-', timeline: a.items?.[1] ?? '-' })),
    },
    comparison,
    charts: {
      status: { aktif, selesai },
      yearly: { labels: yearlyLabels, values: yearlyValues },
      jenis: overview.topJenisKekerasan ?? [],
      kabupaten: overview.topKabupaten ?? [],
      kecamatan: overview.topKecamatan ?? [],
      gender,
      ageGroups,
      monthly: trends.monthly ?? [],
    },
    tables: {
      kabupaten: overview.topKabupaten ?? [],
      kecamatan: overview.topKecamatan ?? [],
      jenis: overview.topJenisKekerasan ?? [],
      kategori: overview.topKategori ?? [],
    },
    gis: {
      ...(gisStats ?? {}),
      hotspots: (gisStats as { kabupatenStats?: unknown[] })?.kabupatenStats?.slice?.(0, 5) ?? [],
      clusters: (gisStats as { clusters?: unknown[] })?.clusters?.slice?.(0, 8) ?? [],
    },
    forecast: forecast ?? null,
    ai: {
      decisionScore: ai.decisionScore,
      narrative: ai.narrative,
      executiveBrief: ai.executiveBrief,
      insightCards: ai.insightCards?.slice(0, 6) ?? [],
    },
    sections: [
      'Cover', 'Executive Summary', 'KPI', 'Trend', 'Demografi', 'Jenis Kekerasan',
      'Wilayah', 'GIS', 'Forecast', 'AI Insight', 'Kesimpulan', 'Rekomendasi', 'Lampiran',
    ],
    auditTrail: [{ action: 'create', user: createdBy ?? 'system', at: now.toISOString() }],
  }
}

export function buildPrintHtml(report: Record<string, unknown>) {
  const executiveSummary = (report.executiveSummary as string[]) ?? []
  const aiSummary = (report.aiSummary as string[]) ?? []
  const kpi = report.kpi as { total: number; aktif: number; selesai: number; completionRate: number }
  const recommendations = report.recommendations as { items: { title: string; actions?: string[] }[] }
  const metadata = report.metadata as { createdBy: string }
  const summary = executiveSummary.map((s) => `<li>${s}</li>`).join('')
  const recs = (recommendations?.items ?? [])
    .map((r) => `<li><strong>${r.title}</strong>: ${r.actions?.join(', ') ?? ''}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.reportId}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#222}
  h1{color:#1e40af;font-size:22px}
  .cover{text-align:center;padding:60px 0;border-bottom:2px solid #1e40af}
  .watermark{position:fixed;top:45%;left:20%;font-size:64px;color:rgba(0,0,0,.06);transform:rotate(-30deg)}
  .meta{font-size:11px;color:#666;margin:12px 0}
  .kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
  .kpi div{border:1px solid #ddd;padding:12px;border-radius:8px}
  footer{position:fixed;bottom:0;left:0;right:0;text-align:center;font-size:10px;color:#888}
  @media print{footer{position:fixed}}
</style></head><body>
<div class="watermark">${report.watermark}</div>
<div class="cover">
  <h1>e-Insight Decision Support System</h1>
  <h2>Laporan ${String(report.category).replace(/_/g, ' ').toUpperCase()}</h2>
  <p>${report.periodLabel}</p>
  <p class="meta">No: ${report.reportId} · Versi ${report.version} · ${new Date(String(report.generatedAt)).toLocaleString('id-ID')}</p>
</div>
<h3>Executive Summary</h3><ul>${summary}</ul>
<div class="kpi">
  <div><small>Total</small><br><strong>${kpi.total}</strong></div>
  <div><small>Aktif</small><br><strong>${kpi.aktif}</strong></div>
  <div><small>Selesai</small><br><strong>${kpi.selesai}</strong></div>
  <div><small>Completion</small><br><strong>${kpi.completionRate}%</strong></div>
</div>
<h3>AI Summary</h3><ul>${aiSummary.map((s) => `<li>${s}</li>`).join('')}</ul>
<h3>Narasi</h3><p>${report.narrative}</p>
<h3>Rekomendasi</h3><ul>${recs || '<li>Pertahankan monitoring rutin.</li>'}</ul>
<footer>e-Insight DSS · ${metadata.createdBy} · Halaman 1</footer>
</body></html>`
}

export async function docHashForReport(reportId: string, version: string, total: number) {
  const payload = `${reportId}|${version}|${total}|${new Date().toISOString()}`
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
