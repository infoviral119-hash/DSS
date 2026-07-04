import { cn } from '@/lib/utils'

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-secondary/80', className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-56" />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-full max-w-md" />
      <SkeletonBlock className="h-64 w-full" />
    </div>
  )
}
