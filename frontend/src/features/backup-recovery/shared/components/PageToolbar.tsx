import { RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '../utils/format'

export function PageToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onExport,
  extra,
  showSearch = true,
}: {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  statusFilter?: string
  onStatusFilterChange?: (v: string) => void
  statusOptions?: { value: string; label: string }[]
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdated?: string
  onExport?: () => void
  extra?: React.ReactNode
  showSearch?: boolean
}) {
  return (
    <div className="sticky top-0 z-10 -mx-1 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/95 px-2 py-2 backdrop-blur">
      {showSearch && (
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {statusOptions && onStatusFilterChange && (
        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {extra}
      {onExport && (
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onExport}>Export</Button>
      )}
      {onRefresh && (
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
      {lastUpdated && (
        <span className="ml-auto text-[10px] text-muted-foreground">
          Updated: {formatDate(lastUpdated)}
        </span>
      )}
    </div>
  )
}
