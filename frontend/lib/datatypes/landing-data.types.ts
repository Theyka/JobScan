export type SourceKey = 'jobsearch.az' | 'glorri'

export type SourceBadge = {
  key: SourceKey
  name: string
  icon: string
}

export type LandingJob = {
  uid: string
  source: SourceKey
  id: number
  slug: string
  title: string
  company: string
  company_logo: string
  created_at: string
  salary: string
  technologies: string[]
  detail_url: string
  sources: SourceBadge[]
}

export type LandingLanguage = {
  name: string
  count: number
}

export type LandingData = {
  total_jobs: number
  jobs_with_tech: number
  languages: LandingLanguage[]
  top_language: string
  total_techs: number
  last_updated: string | null
  recent_jobs: LandingJob[]
  stats: {
    total_glorri: number
    total_jsaz: number
    overlap: number
    unique_glorri: number
    unique_jsaz: number
  }
  error: string | null
}
