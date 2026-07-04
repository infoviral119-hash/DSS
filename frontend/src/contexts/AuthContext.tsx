import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const syncToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('e-insight-token', token)
      api.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      localStorage.removeItem('e-insight-token')
      delete api.defaults.headers.common.Authorization
    }
  }

  const loadUser = async (token: string, track = false) => {
    syncToken(token)
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data)
      if (track) {
        api.post('/api/auth/track-login').catch(() => {})
      }
    } catch {
      setUser(null)
      syncToken(null)
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) loadUser(session.access_token).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) loadUser(session.access_token)
      else {
        setUser(null)
        syncToken(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    if (!supabase) return 'Supabase belum dikonfigurasi'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return 'Session tidak tersedia'
    syncToken(session.access_token)
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data)
      api.post('/api/auth/track-login').catch(() => {})
      return null
    } catch {
      await supabase.auth.signOut()
      syncToken(null)
      return 'Backend tidak merespons. Pastikan server API jalan di port 3001.'
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return 'Supabase belum dikonfigurasi'
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return error?.message ?? null
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    syncToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
