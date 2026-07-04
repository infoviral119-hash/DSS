import type { Env } from './shared'
import { json, queryParams } from './shared'
import { authMe } from './auth'
import { findAll, getFilterOptions, getMaster, getStats } from './cases'
import { getDemographics, getOverview, getTrends } from './analytics'
import { listNotifications, markAllRead, markRead, unreadCount } from './security'
import { requireAuth } from './auth'
import {
  getPareto, getTreemap, getSunburst, getHeatmap, getStackedArea,
  getSankey, getFunnel, getWaterfall, getScatter, getBubble,
} from './charts'
import { getMapData, getInsights as getGisInsights, getStats as getGisStats, getServices, getBoundaries } from './gis'
import {
  getKpis, listCases, getDetail, getQuality, getQuickAnalytics,
  getSavedFilters, saveFilter, deleteSavedFilter, getPreferences, savePreferences,
  exportCases, bulkAction,
} from './case-mgmt'
import { getIntelligence as getAiIntelligence, getLlmNarrative, getLlmStatus, chat, getInsights as getAiInsights } from './ai-simple'
import { getIntelligence as getForecastIntelligence, getMlStatus } from './forecast-simple'

export async function handleLocal(
  path: string,
  request: Request,
  env: Env,
  url: URL,
  cors: Record<string, string>,
): Promise<Response | null> {
  if (path === '/api' || path === '/api/health') {
    return json({ status: 'ok', app: 'e-Insight DSS', version: '1.0.0', timestamp: new Date().toISOString() }, 200, cors)
  }

  if (path === '/api/auth/me' && request.method === 'GET') {
    const header = request.headers.get('Authorization')
    if (!header?.startsWith('Bearer ')) return json({ message: 'Token tidak ada' }, 401, cors)
    const user = await authMe(env, header.slice(7))
    if (!user) return json({ message: 'Token tidak valid' }, 401, cors)
    return json(user, 200, cors)
  }

  if (path === '/api/auth/track-login' && request.method === 'POST') {
    return json({ ok: true, sessionId: `sess-${Date.now().toString(36)}` }, 200, cors)
  }

  const q = queryParams(url)
  const authResult = await requireAuth(request, env)
  if (authResult instanceof Response) {
    Object.entries(cors).forEach(([k, v]) => authResult.headers.set(k, v))
    return authResult
  }
  const user = authResult

  if (path === '/api/cases/stats' && request.method === 'GET') {
    return json(await getStats(env, q, user), 200, cors)
  }
  if (path === '/api/cases/filter-options' && request.method === 'GET') {
    return json(await getFilterOptions(env, user), 200, cors)
  }
  if (path === '/api/cases' && request.method === 'GET') {
    return json(await findAll(env, q, user), 200, cors)
  }
  if (path === '/api/master' && request.method === 'GET') {
    return json(await getMaster(env, user), 200, cors)
  }
  if (path === '/api/analytics/overview' && request.method === 'GET') {
    return json(await getOverview(env, q), 200, cors)
  }
  if (path === '/api/analytics/demographics' && request.method === 'GET') {
    return json(await getDemographics(env, q), 200, cors)
  }
  if (path === '/api/analytics/trends' && request.method === 'GET') {
    return json(await getTrends(env, q), 200, cors)
  }

  const chartRoutes: Record<string, (e: Env, q: Record<string, string | undefined>) => Promise<unknown>> = {
    '/api/analytics/pareto': getPareto,
    '/api/analytics/treemap': getTreemap,
    '/api/analytics/sunburst': getSunburst,
    '/api/analytics/heatmap': getHeatmap,
    '/api/analytics/stacked-area': getStackedArea,
    '/api/analytics/sankey': getSankey,
    '/api/analytics/funnel': getFunnel,
    '/api/analytics/waterfall': getWaterfall,
    '/api/analytics/scatter': getScatter,
    '/api/analytics/bubble': getBubble,
  }
  if (chartRoutes[path] && request.method === 'GET') {
    return json(await chartRoutes[path](env, q), 200, cors)
  }

  if (path === '/api/gis/map' && request.method === 'GET') {
    return json(await getMapData(env, q, user), 200, cors)
  }
  if (path === '/api/gis/stats' && request.method === 'GET') {
    return json(await getGisStats(env, q, user), 200, cors)
  }
  if (path === '/api/gis/insights' && request.method === 'GET') {
    return json(await getGisInsights(env, q, user), 200, cors)
  }
  if (path === '/api/gis/services' && request.method === 'GET') {
    return json(getServices(), 200, cors)
  }
  const boundaryMatch = path.match(/^\/api\/gis\/boundaries\/(provinsi|kabupaten|kecamatan)$/)
  if (boundaryMatch && request.method === 'GET') {
    return json(getBoundaries(boundaryMatch[1] as 'provinsi' | 'kabupaten' | 'kecamatan'), 200, cors)
  }

  if (path === '/api/cases/management/kpis' && request.method === 'GET') {
    return json(await getKpis(env, q, user), 200, cors)
  }
  if (path === '/api/cases/management/list' && request.method === 'GET') {
    return json(await listCases(env, q, user), 200, cors)
  }
  if (path === '/api/cases/management/quality' && request.method === 'GET') {
    return json(await getQuality(env, q, user), 200, cors)
  }
  if (path === '/api/cases/management/analytics' && request.method === 'GET') {
    return json(await getQuickAnalytics(env, q, user), 200, cors)
  }
  if (path === '/api/cases/management/saved-filters' && request.method === 'GET') {
    return json(await getSavedFilters(env, user.id), 200, cors)
  }
  if (path === '/api/cases/management/saved-filters' && request.method === 'POST') {
    const body = await request.json() as { name: string; filters: Record<string, unknown> }
    return json(await saveFilter(env, user.id, body.name, body.filters), 200, cors)
  }
  const delFilter = path.match(/^\/api\/cases\/management\/saved-filters\/([^/]+)$/)
  if (delFilter && request.method === 'DELETE') {
    return json(await deleteSavedFilter(env, user.id, delFilter[1]), 200, cors)
  }
  if (path === '/api/cases/management/preferences' && request.method === 'GET') {
    return json(await getPreferences(env, user.id), 200, cors)
  }
  if (path === '/api/cases/management/preferences' && request.method === 'POST') {
    const body = await request.json() as { visibleColumns: string[]; columnOrder: string[] }
    return json(await savePreferences(env, user.id, body.visibleColumns, body.columnOrder), 200, cors)
  }
  if (path === '/api/cases/management/export' && request.method === 'POST') {
    const body = await request.json() as { ids?: string[]; format?: string }
    return json(await exportCases(env, body, q, user), 200, cors)
  }
  if (path === '/api/cases/management/bulk' && request.method === 'POST') {
    const body = await request.json() as { action: string; ids: string[] }
    return json(await bulkAction(body), 200, cors)
  }
  const caseDetail = path.match(/^\/api\/cases\/management\/([^/]+)$/)
  if (caseDetail && request.method === 'GET' && !['kpis', 'list', 'quality', 'analytics', 'saved-filters', 'preferences', 'export', 'bulk'].includes(caseDetail[1])) {
    try {
      return json(await getDetail(env, caseDetail[1], user), 200, cors)
    } catch (e) {
      return json({ message: (e as Error).message }, 404, cors)
    }
  }

  if (path === '/api/ai/intelligence' && request.method === 'GET') {
    return json(await getAiIntelligence(env, q), 200, cors)
  }
  if (path === '/api/ai/insights' && request.method === 'GET') {
    return json(await getAiInsights(env, q), 200, cors)
  }
  if (path === '/api/ai/llm-narrative' && request.method === 'GET') {
    return json(await getLlmNarrative(env, q), 200, cors)
  }
  if (path === '/api/ai/llm-status' && request.method === 'GET') {
    return json(await getLlmStatus(), 200, cors)
  }
  if (path === '/api/ai/chat' && request.method === 'POST') {
    const body = await request.json() as { message: string }
    return json(await chat(env, q, body.message), 200, cors)
  }

  if (path === '/api/forecast/intelligence' && request.method === 'GET') {
    return json(await getForecastIntelligence(env, q), 200, cors)
  }
  if (path === '/api/forecast/ml-status' && request.method === 'GET') {
    return json(await getMlStatus(), 200, cors)
  }

  if (path === '/api/security/notifications/unread-count' && request.method === 'GET') {
    return json(await unreadCount(env, user.id), 200, cors)
  }
  if (path === '/api/security/notifications' && request.method === 'GET') {
    return json(await listNotifications(env, user.id), 200, cors)
  }
  if (path === '/api/security/notifications/read-all' && request.method === 'POST') {
    return json(await markAllRead(env, user.id), 200, cors)
  }
  const notifRead = path.match(/^\/api\/security\/notifications\/([^/]+)\/read$/)
  if (notifRead && request.method === 'PATCH') {
    return json(await markRead(env, notifRead[1], user.id), 200, cors)
  }

  return null
}
