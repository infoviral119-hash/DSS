import type { Env } from './shared'

type EmbedResponse =
  | { mode: 'metabase'; embedUrl: string; provider: 'metabase' }
  | { mode: 'iframe'; embedUrl: string; provider?: 'powerbi' }
  | { mode: 'link'; shareUrl: string; provider?: 'metabase' | 'powerbi' }
  | {
    mode: 'embed'
    reportId: string
    embedUrl: string
    accessToken: string
    expiration: string
    provider?: 'powerbi'
  }
  | { mode: 'none'; message: string; setup: string[]; provider?: 'none' }

function metabaseDashboardUrl(env: Env) {
  return env.METABASE_DASHBOARD_URL?.trim() || ''
}

function metabasePublicUrl(env: Env) {
  return env.METABASE_PUBLIC_URL?.trim() || ''
}

function metabaseConfigured(env: Env) {
  return Boolean(metabaseDashboardUrl(env) || metabasePublicUrl(env))
}

function hasServicePrincipal(env: Env) {
  return Boolean(
    env.POWER_BI_CLIENT_ID?.trim() &&
    env.POWER_BI_CLIENT_SECRET?.trim() &&
    env.POWER_BI_TENANT_ID?.trim(),
  )
}

export function getStatus(env: Env) {
  const mbDashboard = metabaseDashboardUrl(env)
  const mbPublic = metabasePublicUrl(env)
  if (metabaseConfigured(env)) {
    return {
      configured: true,
      provider: 'metabase' as const,
      mode: mbDashboard ? 'metabase' : 'link',
      shareUrl: mbPublic || mbDashboard || null,
      reportId: null,
      workspaceId: null,
    }
  }

  const embedUrl = env.POWERBI_EMBED_URL?.trim()
  const shareUrl = env.POWERBI_SHARE_URL?.trim()
  const reportId = env.POWER_BI_REPORT_ID?.trim()
  const workspaceId = env.POWER_BI_WORKSPACE_ID?.trim()
  const hasSp = hasServicePrincipal(env)

  return {
    configured: Boolean(embedUrl || shareUrl || (hasSp && reportId && workspaceId)),
    provider: embedUrl || shareUrl || (hasSp && reportId && workspaceId) ? 'powerbi' as const : 'none' as const,
    mode: embedUrl ? 'iframe' : shareUrl ? 'link' : hasSp && reportId && workspaceId ? 'embed' : 'none',
    shareUrl: shareUrl ?? null,
    reportId: reportId ?? null,
    workspaceId: workspaceId ?? null,
  }
}

async function getAzureToken(env: Env): Promise<string> {
  const tenantId = env.POWER_BI_TENANT_ID!
  const clientId = env.POWER_BI_CLIENT_ID!
  const clientSecret = env.POWER_BI_CLIENT_SECRET!

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://analysis.windows.net/powerbi/api/.default',
    }),
  })

  const data = await res.json() as { access_token?: string; error_description?: string }
  if (!data.access_token) throw new Error(data.error_description ?? 'Azure token gagal')
  return data.access_token
}

export async function getEmbedConfig(env: Env): Promise<EmbedResponse> {
  const mbDashboard = metabaseDashboardUrl(env)
  if (mbDashboard) return { mode: 'metabase', embedUrl: mbDashboard, provider: 'metabase' }

  const mbPublic = metabasePublicUrl(env)
  if (mbPublic) return { mode: 'link', shareUrl: mbPublic, provider: 'metabase' }

  const embedUrl = env.POWERBI_EMBED_URL?.trim()
  if (embedUrl) return { mode: 'iframe', embedUrl, provider: 'powerbi' }

  const shareUrl = env.POWERBI_SHARE_URL?.trim()
  if (shareUrl) return { mode: 'link', shareUrl, provider: 'powerbi' }

  const workspaceId = env.POWER_BI_WORKSPACE_ID?.trim()
  const reportId = env.POWER_BI_REPORT_ID?.trim()

  if (!hasServicePrincipal(env) || !workspaceId || !reportId) {
    return {
      mode: 'none',
      provider: 'none',
      message: 'Metabase / Power BI belum dikonfigurasi',
      setup: [
        'Metabase (gratis): npm run metabase:start → public dashboard → METABASE_DASHBOARD_URL',
        'Atau set METABASE_PUBLIC_URL untuk link ke instance Metabase',
        'Power BI: set POWERBI_SHARE_URL atau POWERBI_EMBED_URL di Cloudflare Pages secrets',
        'Power BI advanced: set POWER_BI_* untuk embed token via Service Principal',
      ],
    }
  }

  const aadToken = await getAzureToken(env)
  const reportRes = await fetch(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
    { headers: { Authorization: `Bearer ${aadToken}` } },
  )

  if (!reportRes.ok) {
    const err = await reportRes.text()
    return { mode: 'none', message: `Gagal ambil report: ${err}`, setup: [] }
  }

  const report = await reportRes.json() as { id: string; embedUrl: string }
  const tokenRes = await fetch(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${aadToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessLevel: 'View', allowSaveAs: false }),
    },
  )

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return { mode: 'none', message: `Gagal generate token: ${err}`, setup: [] }
  }

  const tokenData = await tokenRes.json() as { token: string; expiration: string }
  return {
    mode: 'embed',
    provider: 'powerbi',
    reportId: report.id,
    embedUrl: report.embedUrl,
    accessToken: tokenData.token,
    expiration: tokenData.expiration,
  }
}

export async function handlePowerBi(path: string, method: string, env: Env): Promise<unknown | null> {
  if (path === '/api/powerbi/status' && method === 'GET') return getStatus(env)
  if (path === '/api/powerbi/embed' && method === 'GET') return getEmbedConfig(env)
  return null
}
