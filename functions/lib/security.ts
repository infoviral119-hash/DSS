import type { Env } from './shared'
import { dbClient } from './shared'

export async function listNotifications(env: Env, userId: string) {
  const db = dbClient(env)
  const { data } = await db
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    category: n.category,
    read: Boolean(n.read_at),
    createdAt: n.created_at,
  }))
}

export async function unreadCount(env: Env, userId: string) {
  const db = dbClient(env)
  const { count } = await db
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  return count ?? 0
}

export async function markRead(env: Env, id: string, userId: string) {
  const db = dbClient(env)
  await db.from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  return { ok: true }
}

export async function markAllRead(env: Env, userId: string) {
  const db = dbClient(env)
  await db.from('user_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
    .eq('user_id', userId)
  return { ok: true }
}
