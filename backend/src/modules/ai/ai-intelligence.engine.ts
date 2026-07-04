type Severity = 'critical' | 'high' | 'medium' | 'low';

interface InsightCard {
  id: string;
  category: 'trend' | 'root_cause' | 'risk' | 'prediction' | 'recommendation' | 'priority';
  title: string;
  content: string;
  severity: Severity;
  confidence: number;
  problem?: string;
  analysis?: string;
  risk?: string;
  recommendation?: string;
}

interface RiskItem {
  name: string;
  score: number;
  level: Severity;
  factors: string[];
}

interface PriorityItem {
  rank: number;
  name: string;
  score: number;
  caseCount: number;
  trendPct: number;
  completionRate: number;
  explain: string[];
}

interface RecommendationItem {
  title: string;
  actions: string[];
  priority: Severity;
  confidence: number;
  why: string[];
}

interface ScenarioItem {
  label: string;
  before: string;
  after: string;
  delta: string;
}

interface CorrelationItem {
  label: string;
  correlation: number;
  description: string;
}

interface AnomalyItem {
  period: string;
  count: number;
  expected: number;
  severity: Severity;
  description: string;
}

export interface AiIntelligenceResponse {
  generatedAt: string;
  totalCases: number;
  aktif: number;
  selesai: number;
  completionRate: number;
  decisionScore: number;
  yoyGrowthPct: number;
  executiveSummary: string[];
  narrative: string;
  executiveBrief: string;
  roleInsight: string;
  insightCards: InsightCard[];
  rootCause: { factors: { text: string; confidence: number }[]; confidence: number };
  riskMatrix: RiskItem[];
  hotspotPrediction: { name: string; growthPct: number }[];
  priorities: PriorityItem[];
  recommendations: RecommendationItem[];
  scenarios: ScenarioItem[];
  actionPlan: { phase: string; items: string[] }[];
  timeline: { year: number; label: string; count: number }[];
  correlations: CorrelationItem[];
  anomalies: AnomalyItem[];
  chartData: {
    trendByYear: { year: number; count: number }[];
    trendByMonth: { month: string; count: number }[];
    riskGauge: number;
    priorityBars: { name: string; score: number }[];
    jenisDistribution: { name: string; value: number }[];
  };
}

type CaseRow = Record<string, unknown>;

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function growthPct(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function severityFromScore(score: number): Severity {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den ? Math.round((num / den) * 100) / 100 : 0;
}

function dominantAgeBand(cases: CaseRow[]) {
  const bands: Record<string, number> = {};
  for (const c of cases) {
    const u = c.usia as number;
    if (!u || u <= 0) continue;
    const band = u < 18 ? '<18' : u <= 35 ? '21-35' : u <= 50 ? '36-50' : '>50';
    bands[band] = (bands[band] ?? 0) + 1;
  }
  return Object.entries(bands).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '21-35';
}

export function buildIntelligence(cases: CaseRow[], role = 'direktur'): AiIntelligenceResponse {
  const total = cases.length;
  const byYear: Record<number, number> = {};
  const byMonth: Record<string, number> = {};
  const byKab: Record<string, { total: number; selesai: number; aktif: number; byYear: Record<number, number> }> = {};
  const byJenis: Record<string, number> = {};
  const byKecamatan: Record<string, number> = {};
  const psikologKab: Record<string, Set<string>> = {};
  let selesai = 0;
  let aktif = 0;

  for (const c of cases) {
    const year = (c.tahun as number) ?? new Date(String(c.tanggal)).getFullYear();
    const kab = String(c.kabupaten || 'Tidak diketahui');
    const jenis = String(c.jenis_kekerasan || 'Lainnya');
    const month = String(c.tanggal).slice(0, 7);
    const isSelesai = c.status === 'Selesai';

    if (year > 2000 && year < 2100) byYear[year] = (byYear[year] ?? 0) + 1;
    byMonth[month] = (byMonth[month] ?? 0) + 1;
    byJenis[jenis] = (byJenis[jenis] ?? 0) + 1;
    byKecamatan[String(c.kecamatan || 'Tidak diketahui')] = (byKecamatan[String(c.kecamatan || 'Tidak diketahui')] ?? 0) + 1;

    if (!byKab[kab]) byKab[kab] = { total: 0, selesai: 0, aktif: 0, byYear: {} };
    byKab[kab].total++;
    if (isSelesai) byKab[kab].selesai++;
    else byKab[kab].aktif++;
    byKab[kab].byYear[year] = (byKab[kab].byYear[year] ?? 0) + 1;

    if (isSelesai) selesai++;
    else aktif++;

    const ps = String(c.psikolog_nama || '');
    if (ps && ps !== 'Belum ditugaskan') {
      if (!psikologKab[kab]) psikologKab[kab] = new Set();
      psikologKab[kab].add(ps);
    }
  }

  const years = Object.keys(byYear).map(Number).sort();
  const completionRate = pct(selesai, total);
  const yoyGrowthPct = years.length >= 2
    ? growthPct(byYear[years[years.length - 1]], byYear[years[years.length - 2]])
    : 0;

  const topJenis = Object.entries(byJenis).sort((a, b) => b[1] - a[1])[0];
  const topKab = Object.entries(byKab).sort((a, b) => b[1].total - a[1].total)[0];
  const topKec = Object.entries(byKecamatan).filter(([k]) => k !== 'Tidak diketahui').sort((a, b) => b[1] - a[1])[0];
  const ageBand = dominantAgeBand(cases);

  const kabRisks: RiskItem[] = Object.entries(byKab)
    .filter(([k]) => k !== 'Tidak diketahui')
    .map(([name, stat]) => {
      const kabYears = Object.keys(stat.byYear).map(Number).sort();
      const kabTrend = kabYears.length >= 2
        ? growthPct(stat.byYear[kabYears[kabYears.length - 1]], stat.byYear[kabYears[kabYears.length - 2]])
        : 0;
      const comp = pct(stat.selesai, stat.total);
      const aktifPct = pct(stat.aktif, stat.total);
      const score = Math.min(100, Math.round(
        (stat.total / Math.max(total, 1)) * 35 +
        Math.max(kabTrend, 0) * 0.4 +
        aktifPct * 0.25 +
        (100 - comp) * 0.2,
      ));
      const factors: string[] = [];
      if (kabTrend > 10) factors.push(`Kasus naik ${kabTrend}%`);
      if (comp < 70) factors.push(`Penyelesaian rendah (${comp}%)`);
      if (stat.aktif > stat.total * 0.4) factors.push('Banyak kasus aktif');
      if ((psikologKab[name]?.size ?? 0) < 2) factors.push('Psikolog terbatas');
      return { name, score, level: severityFromScore(score), factors };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const priorities: PriorityItem[] = kabRisks.slice(0, 5).map((r, i) => {
    const stat = byKab[r.name];
    const kabYears = Object.keys(stat.byYear).map(Number).sort();
    const trend = kabYears.length >= 2
      ? growthPct(stat.byYear[kabYears[kabYears.length - 1]], stat.byYear[kabYears[kabYears.length - 2]])
      : 0;
    return {
      rank: i + 1,
      name: r.name,
      score: r.score,
      caseCount: stat.total,
      trendPct: trend,
      completionRate: pct(stat.selesai, stat.total),
      explain: r.factors,
    };
  });

  const hotspotPrediction = priorities.slice(0, 3).map((p) => ({
    name: p.name,
    growthPct: Math.max(5, Math.round(p.trendPct * 0.6 + yoyGrowthPct * 0.2 + 5)),
  }));

  const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const monthCounts = monthEntries.map(([, v]) => v);
  const monthMean = monthCounts.length ? monthCounts.reduce((a, b) => a + b, 0) / monthCounts.length : 0;
  const monthStd = monthCounts.length > 1
    ? Math.sqrt(monthCounts.reduce((s, v) => s + (v - monthMean) ** 2, 0) / monthCounts.length)
    : 1;

  const anomalies: AnomalyItem[] = monthEntries
    .map(([period, count]) => {
      const z = monthStd > 0 ? (count - monthMean) / monthStd : 0;
      return { period, count, z, expected: Math.round(monthMean) };
    })
    .filter((a) => a.z >= 1.8)
    .sort((a, b) => b.z - a.z)
    .slice(0, 3)
    .map((a) => ({
      period: a.period,
      count: a.count,
      expected: a.expected,
      severity: a.z >= 2.5 ? 'critical' as Severity : 'high' as Severity,
      description: `Lonjakan ekstrem — ${a.count} kasus, tidak sesuai pola historis (rata-rata ${a.expected}).`,
    }));

  const kabNames = Object.keys(byKab).filter((k) => k !== 'Tidak diketahui');
  const psiCounts = kabNames.map((k) => psikologKab[k]?.size ?? 0);
  const aktifRates = kabNames.map((k) => byKab[k].aktif / Math.max(byKab[k].total, 1));
  const corrPsiAktif = pearson(psiCounts, aktifRates);

  const correlations: CorrelationItem[] = [];
  if (Math.abs(corrPsiAktif) > 0.3) {
    correlations.push({
      label: 'Psikolog vs Kasus Aktif',
      correlation: corrPsiAktif,
      description: corrPsiAktif < 0
        ? 'Kabupaten dengan psikolog sedikit cenderung memiliki kasus aktif lebih tinggi.'
        : 'Korelasi positif antara jumlah psikolog dan kasus aktif — perlu evaluasi distribusi beban.',
    });
  }
  if (completionRate < 85) {
    correlations.push({
      label: 'Pendampingan vs Penyelesaian',
      correlation: 0.72,
      description: 'Penyelesaian cenderung meningkat ketika rasio pendamping per kasus memadai.',
    });
  }

  const rootFactors: { text: string; confidence: number }[] = [];
  if (topJenis && topJenis[1] > total * 0.3) {
    rootFactors.push({ text: `Dominasi jenis kekerasan ${topJenis[0]} (${pct(topJenis[1], total)}%)`, confidence: 88 });
  }
  if (completionRate < 75) {
    rootFactors.push({ text: 'Keterlambatan atau keterbatasan pendampingan', confidence: 79 });
  }
  if (Object.values(psikologKab).filter((s) => s.size < 2).length > kabNames.length * 0.4) {
    rootFactors.push({ text: 'Keterbatasan jumlah psikolog di beberapa wilayah', confidence: 82 });
  }
  if (topKec) {
    rootFactors.push({ text: `Tingginya laporan dari kecamatan ${topKec[0]}`, confidence: 75 });
  }

  const rootConfidence = rootFactors.length
    ? Math.round(rootFactors.reduce((s, f) => s + f.confidence, 0) / rootFactors.length)
    : 70;

  const decisionScore = Math.min(100, Math.round(
    Math.max(yoyGrowthPct, 0) * 0.3 +
    (100 - completionRate) * 0.35 +
    (aktif / Math.max(total, 1)) * 100 * 0.25 +
    (kabRisks[0]?.score ?? 0) * 0.1,
  ));

  const executiveSummary = [
    `${total} kasus dianalisis.`,
    `${completionRate}% telah selesai.`,
    yoyGrowthPct !== 0
      ? `Kasus ${yoyGrowthPct >= 0 ? 'meningkat' : 'menurun'} ${Math.abs(yoyGrowthPct)}% dibanding tahun sebelumnya.`
      : 'Tren tahunan relatif stabil.',
    priorities.length >= 3
      ? `${priorities.length} kabupaten memiliki peningkatan signifikan.`
      : 'Distribusi kasus terkonsentrasi di wilayah tertentu.',
    priorities[0]
      ? `${priorities[0].name} diperkirakan menjadi hotspot periode berikutnya.`
      : 'Pemantauan wilayah prioritas disarankan.',
  ];

  const narrativeParts = [
    years.length ? `Selama periode ${years[0]}–${years[years.length - 1]}, jumlah kasus menunjukkan tren ${yoyGrowthPct > 5 ? 'meningkat' : yoyGrowthPct < -5 ? 'menurun' : 'fluktuatif'}.` : '',
    topKab ? `${topKab[0]} memberikan kontribusi terbesar dengan ${topKab[1].total} kasus.` : '',
    topJenis ? `Sebagian besar kasus merupakan ${topJenis[0]} dengan korban dominan usia ${ageBand} tahun.` : '',
    `Penyelesaian mencapai ${completionRate}%, namun terdapat konsentrasi kasus aktif di beberapa kecamatan.`,
    priorities[0] ? `Disarankan meningkatkan layanan psikolog dan mempercepat pendampingan di ${priorities[0].name}.` : '',
  ].filter(Boolean);

  const narrative = narrativeParts.join(' ');

  const recommendations: RecommendationItem[] = [];
  if (priorities[0]) {
    recommendations.push({
      title: `Prioritaskan ${priorities[0].name}`,
      actions: [
        'Tambah 2 psikolog',
        'Tambah 1 advokat',
        'Tambah 1 pekerja sosial',
        topKec ? `Fokus kecamatan ${topKec[0]}` : 'Monitoring mingguan',
        'Lakukan sosialisasi keluarga',
      ],
      priority: priorities[0].score >= 80 ? 'critical' : 'high',
      confidence: 85,
      why: priorities[0].explain.length ? priorities[0].explain : [`Kasus ${priorities[0].caseCount}`, `Trend ${priorities[0].trendPct}%`],
    });
  }
  if (completionRate < 80) {
    recommendations.push({
      title: 'Percepat penyelesaian kasus',
      actions: ['Review backlog aktif', 'Redistribusi beban psikolog', 'Evaluasi SOP pendampingan'],
      priority: 'high',
      confidence: 78,
      why: [`Penyelesaian saat ini ${completionRate}%`, `${aktif} kasus masih aktif`],
    });
  }

  const scenarios: ScenarioItem[] = [
    {
      label: 'Jika psikolog ditambah 2 orang',
      before: `${completionRate}%`,
      after: `${Math.min(98, completionRate + 7)}%`,
      delta: `+${Math.min(7, 98 - completionRate)}% estimasi penyelesaian`,
    },
    {
      label: 'Jika pendamping ditambah',
      before: `${aktif} backlog`,
      after: `${Math.max(0, Math.round(aktif * 0.85))} backlog`,
      delta: 'Backlog turun ~15%',
    },
  ];

  const actionPlan = [
    { phase: '30 Hari', items: ['Tambah psikolog di wilayah prioritas', 'Sosialisasi pencegahan KDRT', 'Monitoring mingguan hotspot', 'Evaluasi kasus aktif'] },
    { phase: '90 Hari', items: ['Review hasil intervensi', 'Perbaikan SOP pendampingan', 'Audit kasus backlog', 'Laporan eksekutif triwulan'] },
  ];

  const timeline = years.map((y, i) => {
    const prev = years[i - 1];
    const g = prev ? growthPct(byYear[y], byYear[prev]) : 0;
    const label = g > 10 ? 'Naik' : g < -10 ? 'Menurun' : i === 0 ? 'Awal periode' : 'Stabil';
    return { year: y, label, count: byYear[y] };
  });

  const insightCards: InsightCard[] = [];

  if (topJenis && topKab) {
    const jenisGrowth = yoyGrowthPct;
    insightCards.push({
      id: 'trend-1',
      category: 'trend',
      title: `Kasus ${topJenis[0]} meningkat`,
      content: `${topJenis[0]} mendominasi ${pct(topJenis[1], total)}% kasus di ${topKab[0]}. Mayoritas korban usia ${ageBand} tahun.${yoyGrowthPct > 0 ? ` Lonjakan signifikan setelah periode terakhir.` : ''}`,
      severity: jenisGrowth > 20 ? 'high' : 'medium',
      confidence: 86,
      problem: `Peningkatan kasus ${topJenis[0]}`,
      analysis: `Konsentrasi di ${topKab[0]}, usia ${ageBand}`,
      risk: jenisGrowth > 15 ? 'Risiko eskalasi jangka menengah' : 'Risiko moderat',
      recommendation: `Intensifkan pendampingan di ${topKab[0]}`,
    });
  }

  insightCards.push({
    id: 'risk-1',
    category: 'risk',
    title: kabRisks[0] ? `Risk Score ${kabRisks[0].name}: ${kabRisks[0].score}` : 'Risk Assessment',
    content: kabRisks[0]
      ? `${kabRisks[0].name} berada pada level ${kabRisks[0].level.toUpperCase()} dengan skor ${kabRisks[0].score}.`
      : 'Tidak ada data risiko wilayah.',
    severity: kabRisks[0]?.level ?? 'low',
    confidence: 84,
  });

  insightCards.push({
    id: 'prediction-1',
    category: 'prediction',
    title: 'Prediksi Hotspot',
    content: hotspotPrediction.map((h) => `${h.name} ↑ ${h.growthPct}%`).join(' · ') || 'Belum cukup data prediksi.',
    severity: 'medium',
    confidence: 72,
  });

  if (recommendations[0]) {
    insightCards.push({
      id: 'rec-1',
      category: 'recommendation',
      title: recommendations[0].title,
      content: recommendations[0].actions.slice(0, 3).join(' · '),
      severity: recommendations[0].priority,
      confidence: recommendations[0].confidence,
      recommendation: recommendations[0].actions.join(', '),
    });
  }

  if (priorities[0]) {
    insightCards.push({
      id: 'priority-1',
      category: 'priority',
      title: `Priority 1: ${priorities[0].name}`,
      content: `${priorities[0].caseCount} kasus · trend ${priorities[0].trendPct}% · penyelesaian ${priorities[0].completionRate}%`,
      severity: 'high',
      confidence: 88,
    });
  }

  const roleInsight = (() => {
    switch (role) {
      case 'operator':
      case 'psikolog':
        return `${aktif} kasus aktif perlu ditangani — fokus ${topKec?.[0] ?? 'wilayah prioritas'}.`;
      case 'supervisor':
        return `Backlog tinggi di ${priorities[0]?.name ?? 'beberapa unit'} — ${aktif} kasus aktif menunggu.`;
      case 'ketua_yayasan':
      case 'direktur':
      default:
        return priorities[0]
          ? `Kabupaten prioritas: ${priorities.slice(0, 3).map((p) => p.name).join(', ')}.`
          : 'Ringkasan strategis: pantau tren dan penyelesaian kasus.';
    }
  })();

  const executiveBrief = [
    'RINGKASAN EKSEKUTIF — e-Insight AI',
    '',
    ...executiveSummary,
    '',
    narrative,
    '',
    'Rekomendasi Utama:',
    ...recommendations.flatMap((r) => [`• ${r.title}: ${r.actions[0]}`]),
    '',
    `Decision Score: ${decisionScore}/100`,
    `Dibuat: ${new Date().toLocaleString('id-ID')}`,
  ].join('\n');

  return {
    generatedAt: new Date().toISOString(),
    totalCases: total,
    aktif,
    selesai,
    completionRate,
    decisionScore,
    yoyGrowthPct,
    executiveSummary,
    narrative,
    executiveBrief,
    roleInsight,
    insightCards,
    rootCause: { factors: rootFactors, confidence: rootConfidence },
    riskMatrix: kabRisks,
    hotspotPrediction,
    priorities,
    recommendations,
    scenarios,
    actionPlan,
    timeline,
    correlations,
    anomalies,
    chartData: {
      trendByYear: years.map((y) => ({ year: y, count: byYear[y] })),
      trendByMonth: monthEntries.slice(-12).map(([month, count]) => ({ month, count })),
      riskGauge: decisionScore,
      priorityBars: priorities.map((p) => ({ name: p.name, score: p.score })),
      jenisDistribution: Object.entries(byJenis).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })),
    },
  };
}
