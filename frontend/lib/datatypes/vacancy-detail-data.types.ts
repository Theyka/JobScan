export type VacancyRouteSource = 'jobsearch' | 'glorri'

export type VacancySourceBadge = {
  source: VacancyRouteSource
  label: string
  icon: string
}

export type VacancySourceLink = VacancySourceBadge & {
  url: string
}

export type VacancyAboutEntry = {
  key: string
  label: string
  value: string
}

export type VacancyCompanySite = {
  label: string
  url: string
}

export type VacancyCompany = {
  id: number | null
  name: string
  createdAt: string
  logo: string
  cover: string
  coordinates: { lat: number; lng: number } | null
  descriptionHtml: string
  address: string
  phones: string[]
  sites: VacancyCompanySite[]
  emails: string[]
}

export type VacancyDetail = {
  source: VacancyRouteSource
  sourceLabel: string
  title: string
  slug: string
  postedAt: string
  deadlineAt: string
  salaryText: string
  location: string
  jobType: string
  techStack: string[]
  descriptionHtml: string
  requirementsHtml: string
  benefits: string[]
  applyUrl: string
  externalUrl: string
  sourceBadges: VacancySourceBadge[]
  sourceLinks: VacancySourceLink[]
  isDuplicate: boolean
  duplicateScore: number | null
  about: VacancyAboutEntry[]
  company: VacancyCompany
}
