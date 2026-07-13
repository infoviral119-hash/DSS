export type HelpCategory = {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
}

export type HelpArticle = {
  id: string
  category_id: string | null
  title: string
  slug: string
  summary: string | null
  content: string | null
  thumbnail: string | null
  video_url: string | null
  attachment: string | null
  tags: string[]
  author: string | null
  version: string | null
  sort_order: number
  published: boolean
  help_categories?: { name: string; slug: string } | null
}

export type FaqItem = {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  published: boolean
}

export type VideoTutorial = {
  id: string
  title: string
  youtube_url: string
  thumbnail: string | null
  duration: string | null
  category: string
  published: boolean
  sort_order: number
}

export type ReleaseNote = {
  id: string
  version: string
  release_date: string
  title: string
  description: string | null
}

export type AboutApp = {
  id: string
  application_name: string
  version: string
  developer: string | null
  website: string | null
  email: string | null
  description: string | null
}

export type TourStep = {
  id: string
  step: number
  target_selector: string
  title: string
  description: string | null
  placement: string
  page: string
  icon: string | null
  is_active: boolean
}

export type HelpSearchResult = {
  articles: HelpArticle[]
  faq: FaqItem[]
  videos: VideoTutorial[]
  releaseNotes: ReleaseNote[]
}
