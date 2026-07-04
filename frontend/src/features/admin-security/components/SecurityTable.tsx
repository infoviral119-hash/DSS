import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface SecurityTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  keyField?: string
  onRowClick?: (row: T) => void
  emptyText?: string
}

export function SecurityTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField = 'id',
  onRowClick,
  emptyText = 'Tidak ada data',
}: SecurityTableProps<T>) {
  return (
    <div className="glass-panel overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-left text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-3 py-2.5 font-medium', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className={cn(
                    'border-b border-border/50 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-secondary/40',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-3 py-2.5', col.className)}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
