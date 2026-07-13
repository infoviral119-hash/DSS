import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AboutApp, FaqItem, HelpArticle, HelpCategory, HelpSearchResult,
  ReleaseNote, TourStep, VideoTutorial,
} from '../types'

const HELP_KEY = ['help'] as const

const helpQueryOpts = { staleTime: 60_000, retry: false } as const

export function useHelpCategories() {
  return useQuery<HelpCategory[]>({
    queryKey: [...HELP_KEY, 'categories'],
    queryFn: async () => (await api.get('/api/help/categories')).data,
    ...helpQueryOpts,
  })
}

export function useHelpArticles(category?: string) {
  return useQuery<HelpArticle[]>({
    queryKey: [...HELP_KEY, 'articles', category],
    queryFn: async () => (await api.get('/api/help/articles', { params: category ? { category } : {} })).data,
    ...helpQueryOpts,
    staleTime: 30_000,
  })
}

export function useHelpArticle(slug: string) {
  return useQuery<HelpArticle>({
    queryKey: [...HELP_KEY, 'article', slug],
    queryFn: async () => (await api.get(`/api/help/articles/${slug}`)).data,
    enabled: Boolean(slug),
  })
}

export function useHelpFaq() {
  return useQuery<FaqItem[]>({
    queryKey: [...HELP_KEY, 'faq'],
    queryFn: async () => (await api.get('/api/help/faq')).data,
    ...helpQueryOpts,
    staleTime: 30_000,
  })
}

export function useHelpVideos() {
  return useQuery<VideoTutorial[]>({
    queryKey: [...HELP_KEY, 'videos'],
    queryFn: async () => (await api.get('/api/help/videos')).data,
    ...helpQueryOpts,
    staleTime: 30_000,
  })
}

export function useHelpReleaseNotes() {
  return useQuery<ReleaseNote[]>({
    queryKey: [...HELP_KEY, 'release-notes'],
    queryFn: async () => (await api.get('/api/help/release-notes')).data,
    ...helpQueryOpts,
  })
}

export function useHelpAbout() {
  return useQuery<AboutApp | null>({
    queryKey: [...HELP_KEY, 'about'],
    queryFn: async () => (await api.get('/api/help/about')).data,
    ...helpQueryOpts,
  })
}

export function useProductTour(page?: string) {
  return useQuery<TourStep[]>({
    queryKey: [...HELP_KEY, 'tour', page],
    queryFn: async () => (await api.get('/api/help/tour', { params: page ? { page } : {} })).data,
    ...helpQueryOpts,
  })
}

export function useHelpSearch(q: string) {
  return useQuery<HelpSearchResult>({
    queryKey: [...HELP_KEY, 'search', q],
    queryFn: async () => (await api.get('/api/help/search', { params: { q } })).data,
    enabled: q.trim().length >= 2,
  })
}

// Admin CMS
export function useAdminHelpArticles() {
  return useQuery<HelpArticle[]>({
    queryKey: [...HELP_KEY, 'admin', 'articles'],
    queryFn: async () => (await api.get('/api/help/admin/articles')).data,
  })
}

export function useAdminHelpMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: HELP_KEY })

  const saveArticle = useMutation({
    mutationFn: async (payload: Partial<HelpArticle> & { id?: string }) => {
      if (payload.id) return (await api.patch(`/api/help/admin/articles/${payload.id}`, payload)).data
      return (await api.post('/api/help/admin/articles', payload)).data
    },
    onSuccess: invalidate,
  })

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/help/admin/articles/${id}`)).data,
    onSuccess: invalidate,
  })

  const saveFaq = useMutation({
    mutationFn: async (payload: Partial<FaqItem> & { id?: string }) => {
      if (payload.id) return (await api.patch(`/api/help/admin/faq/${payload.id}`, payload)).data
      return (await api.post('/api/help/admin/faq', payload)).data
    },
    onSuccess: invalidate,
  })

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/help/admin/faq/${id}`)).data,
    onSuccess: invalidate,
  })

  const saveTour = useMutation({
    mutationFn: async (payload: Partial<TourStep> & { id?: string }) => {
      if (payload.id) return (await api.patch(`/api/help/admin/tour/${payload.id}`, payload)).data
      return (await api.post('/api/help/admin/tour', payload)).data
    },
    onSuccess: invalidate,
  })

  const deleteTour = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/help/admin/tour/${id}`)).data,
    onSuccess: invalidate,
  })

  const saveAbout = useMutation({
    mutationFn: async (payload: Partial<AboutApp>) =>
      (await api.patch('/api/help/admin/about', payload)).data,
    onSuccess: invalidate,
  })

  return { saveArticle, deleteArticle, saveFaq, deleteFaq, saveTour, deleteTour, saveAbout }
}

export function useAdminFaq() {
  return useQuery<FaqItem[]>({
    queryKey: [...HELP_KEY, 'admin', 'faq'],
    queryFn: async () => (await api.get('/api/help/admin/faq')).data,
  })
}

export function useAdminTour() {
  return useQuery<TourStep[]>({
    queryKey: [...HELP_KEY, 'admin', 'tour'],
    queryFn: async () => (await api.get('/api/help/admin/tour')).data,
  })
}
