import { Route } from 'react-router-dom'
import { HelpLayout } from './components/HelpLayout'
import { HelpHomePage } from './pages/HelpHomePage'
import { HelpTourPage } from './pages/HelpTourPage'
import { HelpGuidesPage } from './pages/HelpGuidesPage'
import { HelpArticlePage } from './pages/HelpArticlePage'
import { HelpFaqPage } from './pages/HelpFaqPage'
import { HelpVideosPage } from './pages/HelpVideosPage'
import { HelpAboutPage } from './pages/HelpAboutPage'
import { HelpReleaseNotesPage } from './pages/HelpReleaseNotesPage'
import { HelpSearchPage } from './pages/HelpSearchPage'

export function helpCenterRoutes() {
  return (
    <Route path="bantuan" element={<HelpLayout />}>
      <Route index element={<HelpHomePage />} />
      <Route path="tur" element={<HelpTourPage />} />
      <Route path="panduan" element={<HelpGuidesPage />} />
      <Route path="panduan/:slug" element={<HelpArticlePage />} />
      <Route path="faq" element={<HelpFaqPage />} />
      <Route path="video" element={<HelpVideosPage />} />
      <Route path="tentang" element={<HelpAboutPage />} />
      <Route path="release-notes" element={<HelpReleaseNotesPage />} />
      <Route path="cari" element={<HelpSearchPage />} />
    </Route>
  )
}
