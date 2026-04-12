export type CompanySource = {
  key: 'jobsearch' | 'glorri'
  name: string
  companyId: number
}

export type CompanyListItem = {
  uid: string
  name: string
  logo: string
  vacancyCount: number
  sources: CompanySource[]
  slug: string
  primarySource: 'jobsearch' | 'glorri'
}

export type CompaniesData = {
  companies: CompanyListItem[]
  total: number
  error: string | null
}

export type CompanyDetail = {
  source: 'jobsearch' | 'glorri'
  companyId: number
  name: string
  logo: string
  cover: string
  description: string
  address: string
  phones: string[]
  sites: { label: string; url: string }[]
  emails: string[]
  slug: string
  vacancyCount: number
}
