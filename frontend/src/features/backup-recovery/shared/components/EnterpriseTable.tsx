import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface EnterpriseTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  keyField?: string
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  page?: number
  totalPages?: number
  onPageChange?: (p: number) => void
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  hiddenCols?: Set<string>
  stickyHeader?: boolean
}

export function EnterpriseTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField = 'id',
  onRowClick,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Belum ada record untuk ditampilkan.',
  page,
  totalPages,
  onPageChange,
  sortKey,
  sortDir,
  onSort,
  hiddenCols,
  stickyHeader = true,
}: EnterpriseTableProps<T>) {
  const visibleCols = columns.filter((c) => !hiddenCols?.has(c.key))

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="glass-panel overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className={cn(stickyHeader && 'sticky top-0 z-[1]')}>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground backdrop-blur">
              {visibleCols.map((col) => (
                <th key={col.key} className={cn('px-3 py-2.5 font-medium whitespace-nowrap', col.className)}>
                  {col.sortable && onSort ? (
                    <button type="button" className="inline-flex items-center gap-0.5 hover:text-foreground" onClick={() => onSort(col.key)}>
                      {col.label}
                      {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-secondary/40',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {visibleCols.map((col) => (
                  <td key={col.key} className={cn('px-3 py-2.5 whitespace-nowrap', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {page != null && totalPages != null && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          <span>Halaman {page} / {totalPages}</span>
          <div className="flex gap-1">
            <button type="button" disabled={page <= 1} className="rounded px-2 py-1 hover:bg-secondary disabled:opacity-40" onClick={() => onPageChange(page - 1)}>Prev</button>
            <button type="button" disabled={page >= totalPages} className="rounded px-2 py-1 hover:bg-secondary disabled:opacity-40" onClick={() => onPageChange(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
