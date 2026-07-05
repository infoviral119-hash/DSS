import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppProvider } from '@/contexts/AppContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { adminSecurityRoutes } from '@/features/admin-security/routes'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DataHistorisPage } from '@/pages/DataHistorisPage'
import { ImportDataPage } from '@/pages/ImportDataPage'
import { AnalitikPage } from '@/pages/AnalitikPage'
import { PendampinganPage } from '@/pages/PendampinganPage'
import { AIInsightPage } from '@/pages/AIInsightPage'
import { ForecastingPage } from '@/pages/ForecastingPage'
import { LaporanPage } from '@/pages/LaporanPage'
import { PowerBiPage } from '@/pages/PowerBiPage'
import { MasterDataPage } from '@/pages/MasterDataPage'
import { PengaturanPage } from '@/pages/PengaturanPage'

const GISPage = lazy(() => import('@/pages/GISPage').then((m) => ({ default: m.GISPage })))

function GisFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
      Memuat GIS Intelligence...
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 2000,
      refetchOnWindowFocus: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="pendampingan" element={<PendampinganPage />} />
                  <Route path="data-historis" element={<DataHistorisPage />} />
                  <Route path="import" element={<ImportDataPage />} />
                  <Route path="analitik" element={<AnalitikPage />} />
                  <Route path="gis" element={<Suspense fallback={<GisFallback />}><GISPage /></Suspense>} />
                  <Route path="metabase" element={<PowerBiPage />} />
                  <Route path="powerbi" element={<PowerBiPage />} />
                  <Route path="ai-insight" element={<AIInsightPage />} />
                  <Route path="forecasting" element={<ForecastingPage />} />
                  <Route path="laporan" element={<LaporanPage />} />
                  <Route path="master-data" element={<MasterDataPage />} />
                  <Route path="pengaturan" element={<PengaturanPage />} />
                  {adminSecurityRoutes()}
                </Route>
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
