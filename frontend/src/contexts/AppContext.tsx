import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_FILTERS, type GlobalFilters } from '@/types'

interface AppContextValue {
  filters: GlobalFilters
  setFilters: (filters: Partial<GlobalFilters>) => void
  resetFilters: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(DEFAULT_FILTERS)

  const setFilters = (partial: Partial<GlobalFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }

  const resetFilters = () => setFiltersState(DEFAULT_FILTERS)

  return (
    <AppContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
