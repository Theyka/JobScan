import type { CompaniesData, CompanyListItem } from '@/lib/datatypes/companies.types'
import { createClient } from '@/lib/supabase/server'

type JsCompanyRow = {
  id: number
  title: string | null
  logo: string | null
  logo_mini: string | null
  text: string | null
  address: string | null
}

type GlorriCompanyRow = {
  id: number
  name: string | null
  slug: string | null
  logo: string | null
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

export async function getCompaniesData(): Promise<CompaniesData> {
  try {
    const supabase = await createClient()

    // Fetch all companies from both sources
    const [jsCompaniesRes, glorriCompaniesRes, jsVacanciesRes, glorriVacanciesRes] = await Promise.all([
      supabase.from('js_companies').select('id,title,logo,logo_mini'),
      supabase.from('glorri_companies').select('id,name,slug,logo'),
      supabase.from('js_vacancies').select('company_id'),
      supabase.from('glorri_vacancies').select('company_id'),
    ])

    const jsCompanies = (jsCompaniesRes.data ?? []) as JsCompanyRow[]
    const glorriCompanies = (glorriCompaniesRes.data ?? []) as GlorriCompanyRow[]

    // Build vacancy count maps
    const jsVacancyCounts = new Map<number, number>()
    for (const v of (jsVacanciesRes.data ?? []) as { company_id: number | null }[]) {
      if (v.company_id != null) {
        jsVacancyCounts.set(v.company_id, (jsVacancyCounts.get(v.company_id) ?? 0) + 1)
      }
    }

    const glorriVacancyCounts = new Map<number, number>()
    for (const v of (glorriVacanciesRes.data ?? []) as { company_id: number | null }[]) {
      if (v.company_id != null) {
        glorriVacancyCounts.set(v.company_id, (glorriVacancyCounts.get(v.company_id) ?? 0) + 1)
      }
    }

    // Merge companies by normalized name
    const mergedMap = new Map<string, CompanyListItem>()

    for (const js of jsCompanies) {
      const name = (js.title ?? '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const logo = toAbsoluteJobSearchLogo(js.logo_mini || js.logo)
      const vacancyCount = jsVacancyCounts.get(js.id) ?? 0

      const existing = mergedMap.get(key)
      if (existing) {
        existing.sources.push({ key: 'jobsearch', name: 'JobSearch.az', companyId: js.id })
        existing.vacancyCount += vacancyCount
        if (!existing.logo && logo) existing.logo = logo
      } else {
        mergedMap.set(key, {
          uid: `js-${js.id}`,
          name,
          logo,
          vacancyCount,
          sources: [{ key: 'jobsearch', name: 'JobSearch.az', companyId: js.id }],
          slug: encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-')),
          primarySource: 'jobsearch',
        })
      }
    }

    for (const g of glorriCompanies) {
      const name = (g.name ?? '').trim()
      if (!name) continue
      const key = name.toLowerCase()
      const logo = toAbsoluteGlorriLogo(g.logo)
      const vacancyCount = glorriVacancyCounts.get(g.id) ?? 0
      const slug = g.slug || encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))

      const existing = mergedMap.get(key)
      if (existing) {
        existing.sources.push({ key: 'glorri', name: 'Glorri', companyId: g.id })
        existing.vacancyCount += vacancyCount
        if (!existing.logo && logo) existing.logo = logo
      } else {
        mergedMap.set(key, {
          uid: `glorri-${g.id}`,
          name,
          logo,
          vacancyCount,
          sources: [{ key: 'glorri', name: 'Glorri', companyId: g.id }],
          slug,
          primarySource: 'glorri',
        })
      }
    }

    const companies = Array.from(mergedMap.values()).sort((a, b) => b.vacancyCount - a.vacancyCount)

    return {
      companies,
      total: companies.length,
      error: null,
    }
  } catch (err) {
    return {
      companies: [],
      total: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
