import type { LandingData, LandingJob, LandingLanguage, SourceBadge, SourceKey } from '@/lib/datatypes/landing-data.types'
import { createClient } from '@/lib/supabase/server'

type JsVacancyRow = {
  id: number
  title: string | null
  created_at: string | null
  slug: string | null
  salary: number | null
  deadline_at: string | null
  tech_stack: unknown
  company_id: number | null
}

type JsCompanyRow = {
  id: number
  title: string | null
  logo: string | null
  logo_mini: string | null
}

type GlorriVacancyRow = {
  id: number
  title: string | null
  slug: string | null
  postedDate: string | null
  location: string | null
  type: string | null
  company_id: number | null
  vacancy_about: unknown
  detail_url: string | null
  apply_url: string | null
  tech_stack: unknown
  created_at: string | null
}

type GlorriCompanyRow = {
  id: number
  name: string | null
  slug: string | null
  logo: string | null
}

type DuplicateRow = {
  glorri_id: number
  jobsearch_id: number
  score: number | null
}

type InternalJob = LandingJob & {
  source_id: number
  sort_time: number
}

type SupabaseResponse<T> = {
  data: T[] | null
  error: {
    message: string
  } | null
}

type SupabaseLikeClient = {
  from: <T>(table: string) => {
    select: (columns: string) => {
      order: (
        column: string,
        options: {
          ascending: boolean
        }
      ) => {
        range: (from: number, to: number) => Promise<SupabaseResponse<T>>
      }
    }
  }
}

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

const SOURCE_RANK: Record<SourceKey, number> = {
  'jobsearch.az': 1,
  glorri: 2,
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function parseSalaryText(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified'
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Math.round(value) === 0) {
      return ''
    }

    const rounded = Math.round(value)
    return `${formatNumber(rounded)} AZN`
  }

  const raw = String(value).trim()
  if (!raw) {
    return 'Not specified'
  }

  const numericMatches = raw.match(/\d+/g) ?? []
  const numbers = numericMatches
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item))

  if (!numbers.length) {
    return raw
  }

  if (numbers.every((item) => item === 0)) {
    return ''
  }

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  if (min === max) {
    return `${formatNumber(min)} AZN`
  }

  return `${formatNumber(min)} - ${formatNumber(max)} AZN`
}

function toDateLabel(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function toTimestamp(...values: unknown[]): number {
  for (const value of values) {
    const raw = String(value ?? '').trim()
    if (!raw) {
      continue
    }

    const parsed = new Date(raw)
    const ts = parsed.getTime()
    if (Number.isFinite(ts)) {
      return ts
    }
  }

  return 0
}

function toAbsoluteJobSearchLogo(logo: unknown): string {
  const raw = String(logo ?? '').trim()
  if (!raw) {
    return ''
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  if (raw.startsWith('//')) {
    return `https:${raw}`
  }

  return `https://jobsearch.az/${raw.replace(/^\/+/, '')}`
}

function toAbsoluteGlorriLogo(logo: unknown): string {
  const raw = String(logo ?? '').trim()
  if (!raw) {
    return ''
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  const cleaned = raw.replace(/^\/+/, '')
  if (!cleaned) {
    return ''
  }

  if (cleaned.startsWith('public/')) {
    return `https://glorri.s3.eu-central-1.amazonaws.com/${cleaned}`
  }

  return `https://glorri.s3.eu-central-1.amazonaws.com/public/${cleaned}`
}

function normalizeTechStack(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const output: string[] = []

  for (const entry of value) {
    const tech = String(entry ?? '').trim()
    if (!tech) {
      continue
    }

    const key = tech.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    output.push(tech)
  }

  return output
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function dedupeSourceBadges(items: SourceBadge[]): SourceBadge[] {
  const byKey = new Map<SourceKey, SourceBadge>()

  for (const item of items) {
    if (!byKey.has(item.key)) {
      byKey.set(item.key, item)
    }
  }

  return [...byKey.values()].sort((a, b) => SOURCE_RANK[a.key] - SOURCE_RANK[b.key])
}

function mergeTechnologies(primary: string[], secondary: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  const addList = (list: string[]) => {
    for (const item of list) {
      const tech = String(item ?? '').trim()
      if (!tech) {
        continue
      }

      const key = tech.toLowerCase()
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      output.push(tech)
    }
  }

  addList(primary)
  addList(secondary)

  return output
}

function normalizeForFingerprint(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeUrlForFingerprint(value: unknown): string {
  const normalized = normalizeForFingerprint(value)
  if (!normalized) {
    return ''
  }

  return normalized.replace(/\/+$/, '')
}

function buildJobFingerprint(job: InternalJob): string {
  const sources = [...job.sources]
    .map((item) => item.key)
    .sort((a, b) => SOURCE_RANK[a] - SOURCE_RANK[b])
    .join('|')

  const technologies = [...job.technologies]
    .map((tech) => normalizeForFingerprint(tech))
    .filter(Boolean)
    .sort()
    .join('|')

  const title = normalizeForFingerprint(job.title)
  const company = normalizeForFingerprint(job.company)
  const createdAt = normalizeForFingerprint(job.created_at)
  const salary = normalizeForFingerprint(job.salary)
  const slug = normalizeForFingerprint(job.slug)
  const detailUrl = normalizeUrlForFingerprint(job.detail_url)

  if (detailUrl) {
    return `${sources}::${title}::${company}::${detailUrl}::${technologies}::${salary}`
  }

  if (slug) {
    return `${sources}::${title}::${company}::${slug}::${createdAt}::${technologies}::${salary}`
  }

  return `${sources}::${title}::${company}::${createdAt}::${technologies}::${salary}`
}

function dedupeJobs(jobs: InternalJob[]): InternalJob[] {
  const seen = new Set<string>()
  const output: InternalJob[] = []

  for (const job of jobs) {
    const fingerprint = buildJobFingerprint(job)
    if (seen.has(fingerprint)) {
      continue
    }

    seen.add(fingerprint)
    output.push(job)
  }

  return output
}

function buildLanguageStats(jobs: LandingJob[]): LandingLanguage[] {
  const counts = new Map<string, { name: string; count: number }>()

  for (const job of jobs) {
    for (const tech of job.technologies) {
      const key = tech.toLowerCase()
      const existing = counts.get(key)
      if (existing) {
        existing.count += 1
      } else {
        counts.set(key, { name: tech, count: 1 })
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

async function fetchAllRows<T>(
  supabase: SupabaseLikeClient,
  table: string,
  select: string,
  orderColumn: string
): Promise<T[]> {
  const pageSize = 1000
  const allRows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from<T>(table)
      .select(select)
      .order(orderColumn, { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) {
      throw new Error(`${table}: ${error.message}`)
    }

    const rows = Array.isArray(data) ? (data as T[]) : []
    allRows.push(...rows)

    if (rows.length < pageSize) {
      break
    }

    from += pageSize
    if (from > 200000) {
      throw new Error(`${table}: pagination guard triggered`)
    }
  }

  return allRows
}

export async function getLandingData(): Promise<LandingData> {
  try {
    const supabaseClient = await createClient()
    const supabase = supabaseClient as unknown as SupabaseLikeClient

    const [jsVacancies, jsCompanies, glorriVacancies, glorriCompanies, duplicateRows] = await Promise.all([
      fetchAllRows<JsVacancyRow>(
        supabase,
        'js_vacancies',
        'id,title,created_at,slug,salary,deadline_at,tech_stack,company_id',
        'id'
      ),
      fetchAllRows<JsCompanyRow>(supabase, 'js_companies', 'id,title,logo,logo_mini', 'id'),
      fetchAllRows<GlorriVacancyRow>(
        supabase,
        'glorri_vacancies',
        'id,title,slug,postedDate,location,type,company_id,vacancy_about,detail_url,apply_url,tech_stack,created_at',
        'id'
      ),
      fetchAllRows<GlorriCompanyRow>(supabase, 'glorri_companies', 'id,name,slug,logo', 'id'),
      fetchAllRows<DuplicateRow>(supabase, 'duplicate_jobs', 'glorri_id,jobsearch_id,score', 'glorri_id').catch(() => []),
    ])

    const jsCompanyMap = new Map<number, { name: string; logo: string }>()
    for (const company of jsCompanies) {
      const id = Number.parseInt(String(company.id), 10)
      if (!Number.isFinite(id)) {
        continue
      }

      jsCompanyMap.set(id, {
        name: String(company.title ?? '').trim() || 'Unknown',
        logo: toAbsoluteJobSearchLogo(company.logo_mini || company.logo),
      })
    }

    const glorriCompanyMap = new Map<number, { name: string; slug: string; logo: string }>()
    for (const company of glorriCompanies) {
      const id = Number.parseInt(String(company.id), 10)
      if (!Number.isFinite(id)) {
        continue
      }

      glorriCompanyMap.set(id, {
        name: String(company.name ?? '').trim() || 'Unknown',
        slug: String(company.slug ?? '').trim(),
        logo: String(company.logo ?? '').trim(),
      })
    }

    const normalizedJsJobs: InternalJob[] = jsVacancies.map((vacancy) => {
      const id = Number.parseInt(String(vacancy.id), 10)
      const company = jsCompanyMap.get(Number.parseInt(String(vacancy.company_id), 10))
      const slug = String(vacancy.slug ?? '').trim()

      return {
        uid: `jobsearch-${id}`,
        source: 'jobsearch.az',
        source_id: id,
        id,
        slug,
        title: String(vacancy.title ?? '').trim() || 'Untitled',
        company: company?.name || 'Unknown',
        company_logo: company?.logo || '',
        created_at: toDateLabel(vacancy.created_at),
        salary: parseSalaryText(vacancy.salary),
        technologies: normalizeTechStack(vacancy.tech_stack),
        detail_url: slug ? `https://jobsearch.az/vacancies/${encodeURIComponent(slug)}` : '',
        sources: [SOURCE_BADGE_JS],
        sort_time: toTimestamp(vacancy.created_at),
      }
    })

    const normalizedGlorriJobs: InternalJob[] = glorriVacancies.map((vacancy) => {
      const id = Number.parseInt(String(vacancy.id), 10)
      const company = glorriCompanyMap.get(Number.parseInt(String(vacancy.company_id), 10))
      const slug = String(vacancy.slug ?? '').trim()
      const vacancyAbout = isObjectRecord(vacancy.vacancy_about) ? vacancy.vacancy_about : {}
      const salarySource = vacancyAbout.salary

      const fallbackDetailUrl =
        company?.slug && slug
          ? `https://jobs.glorri.com/vacancies/${encodeURIComponent(company.slug)}/${encodeURIComponent(slug)}`
          : ''

      const detailUrl = String(vacancy.detail_url ?? '').trim() || String(vacancy.apply_url ?? '').trim() || fallbackDetailUrl

      return {
        uid: `glorri-${id}`,
        source: 'glorri',
        source_id: id,
        id,
        slug,
        title: String(vacancy.title ?? '').trim() || 'Untitled',
        company: company?.name || 'Unknown',
        company_logo: toAbsoluteGlorriLogo(company?.logo),
        created_at: toDateLabel(vacancy.postedDate || vacancy.created_at),
        salary: parseSalaryText(salarySource),
        technologies: normalizeTechStack(vacancy.tech_stack),
        detail_url: detailUrl,
        sources: [SOURCE_BADGE_GLORRI],
        sort_time: toTimestamp(vacancy.postedDate, vacancy.created_at),
      }
    })

    const jsById = new Map<number, InternalJob>()
    for (const job of normalizedJsJobs) {
      jsById.set(job.source_id, job)
    }

    const glorriById = new Map<number, InternalJob>()
    for (const job of normalizedGlorriJobs) {
      glorriById.set(job.source_id, job)
    }

    const usedJsIds = new Set<number>()
    const usedGlorriIds = new Set<number>()
    const mergedJobs: InternalJob[] = []

    for (const pair of duplicateRows) {
      const jsId = Number.parseInt(String(pair.jobsearch_id), 10)
      const glorriId = Number.parseInt(String(pair.glorri_id), 10)

      if (!Number.isFinite(jsId) || !Number.isFinite(glorriId)) {
        continue
      }

      const jsJob = jsById.get(jsId)
      const glorriJob = glorriById.get(glorriId)

      if (!jsJob && !glorriJob) {
        continue
      }

      if (jsJob) {
        usedJsIds.add(jsId)
      }

      if (glorriJob) {
        usedGlorriIds.add(glorriId)
      }

      const primary = (() => {
        if (!jsJob) {
          return glorriJob!
        }
        if (!glorriJob) {
          return jsJob
        }
        return jsJob.sort_time >= glorriJob.sort_time ? jsJob : glorriJob
      })()

      const secondary = primary.uid === jsJob?.uid ? glorriJob : jsJob

      const merged: InternalJob = {
        ...primary,
        uid: `merged-${jsId}-${glorriId}`,
        sources: dedupeSourceBadges([...(jsJob?.sources || []), ...(glorriJob?.sources || [])]),
        technologies: mergeTechnologies(primary.technologies, secondary?.technologies || []),
        company: primary.company || secondary?.company || 'Unknown',
        company_logo: primary.company_logo || secondary?.company_logo || '',
        salary:
          primary.salary !== 'Not specified'
            ? primary.salary
            : secondary?.salary || 'Not specified',
        detail_url: primary.detail_url || secondary?.detail_url || '',
      }

      mergedJobs.push(merged)
    }

    for (const job of normalizedJsJobs) {
      if (!usedJsIds.has(job.source_id)) {
        mergedJobs.push(job)
      }
    }

    for (const job of normalizedGlorriJobs) {
      if (!usedGlorriIds.has(job.source_id)) {
        mergedJobs.push(job)
      }
    }

    mergedJobs.sort((a, b) => b.sort_time - a.sort_time)
    const uniqueJobs = dedupeJobs(mergedJobs)

    const recentJobs: LandingJob[] = uniqueJobs.map((job) => ({
      uid: job.uid,
      source: job.source,
      id: job.id,
      slug: job.slug,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo,
      created_at: job.created_at,
      salary: job.salary,
      technologies: job.technologies,
      detail_url: job.detail_url,
      sources: job.sources,
    }))
    const languages = buildLanguageStats(recentJobs)
    const jobsWithTech = recentJobs.filter((job) => job.technologies.length > 0).length

    const jsTimes = jsVacancies.map((row) => toTimestamp(row.created_at)).filter((ts) => ts > 0)
    const glorriTimes = glorriVacancies.map((row) => toTimestamp(row.created_at)).filter((ts) => ts > 0)
    const allTimes = [...jsTimes, ...glorriTimes]
    const lastUpdated = allTimes.length ? new Date(Math.max(...allTimes)).toISOString() : null

    const overlapCount = duplicateRows.length
    const totalGlorri = glorriVacancies.length
    const totalJsAz = jsVacancies.length

    return {
      total_jobs: recentJobs.length,
      jobs_with_tech: jobsWithTech,
      languages,
      top_language: languages[0]?.name || '-',
      total_techs: languages.length,
      last_updated: lastUpdated,
      recent_jobs: recentJobs,
      stats: {
        total_glorri: totalGlorri,
        total_jsaz: totalJsAz,
        overlap: overlapCount,
        unique_glorri: Math.max(0, totalGlorri - overlapCount),
        unique_jsaz: Math.max(0, totalJsAz - overlapCount),
      },
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return {
      total_jobs: 0,
      jobs_with_tech: 0,
      languages: [],
      top_language: '-',
      total_techs: 0,
      last_updated: null,
      recent_jobs: [],
      stats: {
        total_glorri: 0,
        total_jsaz: 0,
        overlap: 0,
        unique_glorri: 0,
        unique_jsaz: 0,
      },
      error: message,
    }
  }
}
