interface Env {
  BACKEND_URL: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const backend = context.env.BACKEND_URL?.replace(/\/$/, '')
  if (!backend) {
    return new Response(JSON.stringify({ message: 'BACKEND_URL belum dikonfigurasi di Cloudflare' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(context.request.url)
  const target = `${backend}${url.pathname}${url.search}`

  const headers = new Headers(context.request.headers)
  headers.delete('host')

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: 'manual',
  }

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body
  }

  const response = await fetch(target, init)
  const outHeaders = new Headers(response.headers)
  outHeaders.delete('content-encoding')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  })
}
