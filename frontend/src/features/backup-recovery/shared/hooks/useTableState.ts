import { useMemo, useState } from 'react'

export function useTableState<T extends Record<string, unknown>>(
  rows: T[],
  searchKeys: string[],
  pageSize = 10,
) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = [...rows]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)),
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((row) => String(row.status ?? '').toLowerCase() === statusFilter.toLowerCase())
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [rows, search, statusFilter, sortKey, sortDir, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const toggleColumn = (key: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page: safePage,
    setPage,
    totalPages,
    paginated,
    filtered,
    sortKey,
    sortDir,
    toggleSort,
    hiddenCols,
    toggleColumn,
  }
}
