/**
 * TCP proxy: Docker Metabase -> host.docker.internal:15432 -> Supabase Postgres
 * Needed because db.*.supabase.co is IPv6-only and Docker Desktop often lacks IPv6 routing.
 */
import net from 'node:net'

const LISTEN_HOST = process.env.METABASE_DB_PROXY_HOST ?? '0.0.0.0'
const LISTEN_PORT = Number(process.env.METABASE_DB_PROXY_PORT ?? 15432)
const REMOTE_HOST = process.env.SUPABASE_DB_HOST ?? 'db.vnfndvbxhvpikjxvnkmc.supabase.co'
const REMOTE_PORT = Number(process.env.SUPABASE_DB_PORT ?? 5432)

const server = net.createServer((client) => {
  const remote = net.connect({ host: REMOTE_HOST, port: REMOTE_PORT })
  client.on('error', () => remote.destroy())
  remote.on('error', () => client.destroy())
  client.pipe(remote)
  remote.pipe(client)
})

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`Metabase DB proxy listening on ${LISTEN_HOST}:${LISTEN_PORT} -> ${REMOTE_HOST}:${REMOTE_PORT}`)
})

process.on('SIGINT', () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
