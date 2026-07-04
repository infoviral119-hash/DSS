import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const { user, login, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const err =
      mode === 'login'
        ? await login(email, password)
        : await signUp(email, password, fullName)

    setSubmitting(false)
    if (err) setError(err)
    else if (mode === 'signup') setInfo('Akun dibuat. Cek email untuk konfirmasi atau langsung login.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === 'login' ? 'Login e-Insight' : 'Daftar Akun'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <Input
                placeholder="Nama lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            {info && <p className="text-xs text-green-600">{info}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setInfo('')
            }}
          >
            {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
