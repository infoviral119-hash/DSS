import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

type Props = {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  loadingText?: string
  empty?: boolean
  emptyText?: string
  children: ReactNode
}

export function HelpLoadState({
  isLoading,
  isError,
  error,
  loadingText = 'Memuat...',
  empty,
  emptyText,
  children,
}: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{loadingText}</p>
  }

  if (isError) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      ?? error?.message
      ?? 'Gagal memuat data'
    const setupHint = /relation|does not exist|help_/i.test(msg)
      ? ' Jalankan npm run help:setup atau paste supabase/help_center.sql di Supabase SQL Editor.'
      : ''
    return (
      <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Tidak dapat memuat konten bantuan</p>
          <p className="mt-1 text-destructive/80">{msg}{setupHint}</p>
        </div>
      </div>
    )
  }

  if (empty && emptyText) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return <>{children}</>
}
