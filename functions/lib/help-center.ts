import type { Env, AuthUser } from './shared'
import { dbClient } from './shared'

function isAdmin(user: AuthUser) {
  return user.role === 'admin' || user.role === 'super_admin' || user.role === 'system_admin'
}

function now() {
  return new Date().toISOString()
}

async function listCategories(env: Env) {
  const db = dbClient(env)
  const { data, error } = await db.from('help_categories').select('*').eq('is_active', true).order('sort_order')
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listArticles(env: Env, opts: { category?: string; publishedOnly?: boolean }) {
  const db = dbClient(env)
  let q = db.from('help_articles').select('*, help_categories(name, slug)').order('sort_order')
  if (opts.publishedOnly !== false) q = q.eq('published', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  let rows = data ?? []
  if (opts.category) {
    rows = rows.filter((r: { help_categories?: { slug?: string } }) =>
      r.help_categories?.slug === opts.category || (r as { category_slug?: string }).category_slug === opts.category,
    )
  }
  return rows
}

async function getArticleBySlug(env: Env, slug: string, publishedOnly = true) {
  const db = dbClient(env)
  let q = db.from('help_articles').select('*, help_categories(name, slug)').eq('slug', slug)
  if (publishedOnly) q = q.eq('published', true)
  const { data, error } = await q.maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function listFaq(env: Env, admin = false) {
  const db = dbClient(env)
  let q = db.from('faq').select('*').order('sort_order')
  if (!admin) q = q.eq('published', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listVideos(env: Env, admin = false) {
  const db = dbClient(env)
  let q = db.from('video_tutorials').select('*').order('sort_order')
  if (!admin) q = q.eq('published', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

async function listReleaseNotes(env: Env) {
  const db = dbClient(env)
  const { data, error } = await db.from('release_notes').select('*').order('release_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

async function getAbout(env: Env) {
  const db = dbClient(env)
  const { data, error } = await db.from('about_application').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

async function listTour(env: Env, page?: string) {
  const db = dbClient(env)
  const { data, error } = await db.from('product_tour').select('*').eq('is_active', true).order('step')
  if (error) throw new Error(error.message)
  const rows = data ?? []
  if (!page) return rows
  return rows.filter((s: { page?: string }) => !s.page || s.page === '*' || s.page === page)
}

async function searchHelp(env: Env, query: string) {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return { articles: [], faq: [], videos: [], releaseNotes: [] }

  const [articles, faq, videos, notes] = await Promise.all([
    listArticles(env, { publishedOnly: true }),
    listFaq(env),
    listVideos(env),
    listReleaseNotes(env),
  ])

  const match = (text: string | null | undefined) => (text ?? '').toLowerCase().includes(q)

  return {
    articles: articles.filter((a: { title?: string; summary?: string; content?: string; tags?: string[] }) =>
      match(a.title) || match(a.summary) || match(a.content) || (a.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    ),
    faq: faq.filter((f: { question?: string; answer?: string }) => match(f.question) || match(f.answer)),
    videos: videos.filter((v: { title?: string }) => match(v.title)),
    releaseNotes: notes.filter((n: { title?: string; description?: string; version?: string }) =>
      match(n.title) || match(n.description) || match(n.version),
    ),
  }
}

async function upsertRow(env: Env, table: string, body: Record<string, unknown>, id?: string) {
  const db = dbClient(env)
  const payload = { ...body, updated_at: now() }
  if (id) {
    const { data, error } = await db.from(table).update(payload).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await db.from(table).insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

async function deleteRow(env: Env, table: string, id: string) {
  const db = dbClient(env)
  const { error } = await db.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function handleHelpCenter(
  path: string,
  method: string,
  env: Env,
  user: AuthUser,
  url: URL,
  body?: Record<string, unknown>,
): Promise<unknown | null> {
  const admin = isAdmin(user)

  // Public read (authenticated)
  if (path === '/api/help/categories' && method === 'GET') return listCategories(env)
  if (path === '/api/help/articles' && method === 'GET') {
    return listArticles(env, { category: url.searchParams.get('category') ?? undefined, publishedOnly: true })
  }
  if (path.match(/^\/api\/help\/articles\/[^/]+$/) && method === 'GET') {
    const slug = path.split('/').pop()!
    const article = await getArticleBySlug(env, slug, true)
    if (!article) throw new Error('Artikel tidak ditemukan')
    return article
  }
  if (path === '/api/help/faq' && method === 'GET') return listFaq(env)
  if (path === '/api/help/videos' && method === 'GET') return listVideos(env)
  if (path === '/api/help/release-notes' && method === 'GET') return listReleaseNotes(env)
  if (path === '/api/help/about' && method === 'GET') return getAbout(env)
  if (path === '/api/help/tour' && method === 'GET') {
    return listTour(env, url.searchParams.get('page') ?? undefined)
  }
  if (path === '/api/help/search' && method === 'GET') {
    return searchHelp(env, url.searchParams.get('q') ?? '')
  }

  // Admin CMS
  if (!path.startsWith('/api/help/admin/')) return null
  if (!admin) throw new Error('Hanya administrator yang dapat mengelola CMS Bantuan')

  if (path === '/api/help/admin/articles' && method === 'GET') {
    return listArticles(env, { category: url.searchParams.get('category') ?? undefined, publishedOnly: false })
  }
  if (path === '/api/help/admin/articles' && method === 'POST') {
    return upsertRow(env, 'help_articles', body ?? {})
  }
  if (path.match(/^\/api\/help\/admin\/articles\/[^/]+$/) && method === 'PATCH') {
    const id = path.split('/').pop()!
    return upsertRow(env, 'help_articles', body ?? {}, id)
  }
  if (path.match(/^\/api\/help\/admin\/articles\/[^/]+$/) && method === 'DELETE') {
    return deleteRow(env, 'help_articles', path.split('/').pop()!)
  }

  if (path === '/api/help/admin/faq' && method === 'GET') return listFaq(env, true)
  if (path === '/api/help/admin/faq' && method === 'POST') return upsertRow(env, 'faq', body ?? {})
  if (path.match(/^\/api\/help\/admin\/faq\/[^/]+$/) && method === 'PATCH') {
    return upsertRow(env, 'faq', body ?? {}, path.split('/').pop()!)
  }
  if (path.match(/^\/api\/help\/admin\/faq\/[^/]+$/) && method === 'DELETE') {
    return deleteRow(env, 'faq', path.split('/').pop()!)
  }

  if (path === '/api/help/admin/tour' && method === 'GET') return listTour(env)
  if (path === '/api/help/admin/tour' && method === 'POST') return upsertRow(env, 'product_tour', body ?? {})
  if (path.match(/^\/api\/help\/admin\/tour\/[^/]+$/) && method === 'PATCH') {
    return upsertRow(env, 'product_tour', body ?? {}, path.split('/').pop()!)
  }
  if (path.match(/^\/api\/help\/admin\/tour\/[^/]+$/) && method === 'DELETE') {
    return deleteRow(env, 'product_tour', path.split('/').pop()!)
  }

  if (path === '/api/help/admin/videos' && method === 'GET') return listVideos(env, true)
  if (path === '/api/help/admin/videos' && method === 'POST') return upsertRow(env, 'video_tutorials', body ?? {})
  if (path.match(/^\/api\/help\/admin\/videos\/[^/]+$/) && method === 'PATCH') {
    return upsertRow(env, 'video_tutorials', body ?? {}, path.split('/').pop()!)
  }
  if (path.match(/^\/api\/help\/admin\/videos\/[^/]+$/) && method === 'DELETE') {
    return deleteRow(env, 'video_tutorials', path.split('/').pop()!)
  }

  if (path === '/api/help/admin/release-notes' && method === 'GET') return listReleaseNotes(env)
  if (path === '/api/help/admin/release-notes' && method === 'POST') return upsertRow(env, 'release_notes', body ?? {})
  if (path.match(/^\/api\/help\/admin\/release-notes\/[^/]+$/) && method === 'PATCH') {
    return upsertRow(env, 'release_notes', body ?? {}, path.split('/').pop()!)
  }
  if (path.match(/^\/api\/help\/admin\/release-notes\/[^/]+$/) && method === 'DELETE') {
    return deleteRow(env, 'release_notes', path.split('/').pop()!)
  }

  if (path === '/api/help/admin/about' && method === 'GET') return getAbout(env)
  if (path === '/api/help/admin/about' && method === 'PATCH') {
    const existing = await getAbout(env)
    if (existing?.id) return upsertRow(env, 'about_application', body ?? {}, existing.id)
    return upsertRow(env, 'about_application', body ?? {})
  }

  if (path === '/api/help/admin/categories' && method === 'GET') {
    const db = dbClient(env)
    const { data, error } = await db.from('help_categories').select('*').order('sort_order')
    if (error) throw new Error(error.message)
    return data ?? []
  }

  return null
}
