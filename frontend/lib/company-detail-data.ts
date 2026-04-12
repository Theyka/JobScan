import type { CompanyDetail } from '@/lib/datatypes/companies.types'
import type { LandingJob, SourceBadge } from '@/lib/datatypes/landing-data.types'
import { createClient } from '@/lib/supabase/server'

const SOURCE_BADGE_JS: SourceBadge = {
  key: 'jobsearch.az',
  name: 'JobSearch.az',
  icon: 'https://jobsearch.az/favicon.ico',
}

const SOURCE_BADGE_GLORRI: SourceBadge = {
  key: 'glorri',
  name: 'Glorri',
  icon: 'https://jobs.glorri.com/favicon.ico',
}

function parseSalaryText(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not specified'
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Math.round(value) === 0) return ''
    return `${Math.round(value).toLocaleString('en-US')} AZN`
  }
  return String(value).trim() || 'Not specified'
}

function toTechStack(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return []
}

function toAbsoluteJobSearchLogo(path: string | null): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `https://jobsearch.az${path.startsWith('/') ? '' : '/'}${path}`
}

function toAbsoluteGlorriLogo(path: string | null): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `https://glorri.s3.eu-central-1.amazonaws.com/${path}`
}

export async function getCompanyDetail(source: string, slug: string): Promise<CompanyDetail | null> {
  const supabase = await createClient()

  if (source === 'jobsearch') {
    // For JobSearch, slug is URL-encoded company title
    const decodedName = decodeURIComponent(slug).replace(/-/g, ' ')

    const { data: companies } = await supabase
      .from('js_companies')
      .select('id,title,logo,logo_mini,text,address,phones,sites,email,cover,coordinates')
      .ilike('title', decodedName)
      .limit(1)

    if (!companies || companies.length === 0) return null
    const company = companies[0]

    const { count } = await supabase
      .from('js_vacancies')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)

    const phones = Array.isArray(company.phones) ? company.phones.map(String) : []
    const emails = Array.isArray(company.email) ? company.email.map(String) : []
    const sites = Array.isArray(company.sites)
      ? company.sites.map((s: unknown) => {
          if (typeof s === 'string') return { label: s, url: s }
          if (typeof s === 'object' && s !== null) {
            const obj = s as Record<string, unknown>
            return { label: String(obj.label || obj.url || ''), url: String(obj.url || obj.label || '') }
          }
          return { label: '', url: '' }
        }).filter((s: { url: string }) => s.url)
      : []

    return {
      source: 'jobsearch',
      companyId: company.id,
      name: company.title || '',
      logo: toAbsoluteJobSearchLogo(company.logo_mini || company.logo),
      cover: company.cover ? toAbsoluteJobSearchLogo(company.cover) : '',
      description: company.text || '',
      address: company.address || '',
      phones,
      sites,
      emails,
      slug,
      vacancyCount: count ?? 0,
    }
  }

  if (source === 'glorri') {
    const { data: companies } = await supabase
      .from('glorri_companies')
      .select('id,name,slug,logo')
      .eq('slug', slug)
      .limit(1)

    if (!companies || companies.length === 0) return null
    const company = companies[0]

    const { count } = await supabase
      .from('glorri_vacancies')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)

    return {
      source: 'glorri',
      companyId: company.id,
      name: company.name || '',
      logo: toAbsoluteGlorriLogo(company.logo),
      cover: '',
      description: '',
      address: '',
      phones: [],
      sites: [],
      emails: [],
      slug: company.slug || slug,
      vacancyCount: count ?? 0,
    }
  }

  return null
}

export async function getCompanyVacancies(source: string, companyId: number): Promise<LandingJob[]> {
  const supabase = await createClient()

  if (source === 'jobsearch') {
    const { data } = await supabase
      .from('js_vacancies')
      .select('id,title,slug,salary,deadline_at,created_at,tech_stack,company_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (!data) return []

    const { data: companyData } = await supabase
      .from('js_companies')
      .select('id,title,logo,logo_mini')
      .eq('id', companyId)
      .limit(1)

    const company = companyData?.[0]
    const companyName = company?.title || ''
    const companyLogo = toAbsoluteJobSearchLogo(company?.logo_mini || company?.logo || null)

    return data.map((row: Record<string, unknown>) => ({
      uid: `js-${row.id}`,
      source: 'jobsearch.az' as const,
      id: row.id as number,
      slug: String(row.slug ?? ''),
      title: String(row.title ?? ''),
      company: companyName,
      company_logo: companyLogo,
      created_at: String(row.created_at ?? ''),
      deadline_at: String(row.deadline_at ?? ''),
      salary: parseSalaryText(row.salary),
      technologies: toTechStack(row.tech_stack),
      detail_url: `/vacancies/jobsearch/${row.slug}`,
      sources: [SOURCE_BADGE_JS],
    }))
  }

  if (source === 'glorri') {
    const { data } = await supabase
      .from('glorri_vacancies')
      .select('id,title,slug,postedDate,created_at,tech_stack,company_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (!data) return []

    const { data: companyData } = await supabase
      .from('glorri_companies')
      .select('id,name,logo')
      .eq('id', companyId)
      .limit(1)

    const company = companyData?.[0]
    const companyName = company?.name || ''
    const companyLogo = toAbsoluteGlorriLogo(company?.logo || null)

    return data.map((row: Record<string, unknown>) => ({
      uid: `glorri-${row.id}`,
      source: 'glorri' as const,
      id: row.id as number,
      slug: String(row.slug ?? ''),
      title: String(row.title ?? ''),
      company: companyName,
      company_logo: companyLogo,
      created_at: String(row.postedDate ?? row.created_at ?? ''),
      deadline_at: '',
      salary: 'Not specified',
      technologies: toTechStack(row.tech_stack),
      detail_url: `/vacancies/glorri/${row.slug}`,
      sources: [SOURCE_BADGE_GLORRI],
    }))
  }

  return []
}
