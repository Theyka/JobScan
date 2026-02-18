import { createAdminClient } from '@/lib/supabase/admin'

export type AnalyticsPreset = 'month' | 'year' | 'custom'
export type AnalyticsGranularity = 'day' | 'month'
type VacancySource = 'jobsearch' | 'glorri'

type QueryValue = string | string[] | undefined
export type AdminAnalyticsQuery = Record<string, QueryValue>

export type AdminAnalyticsFilters = {
  preset: AnalyticsPreset
  from: string
  to: string
  granularity: AnalyticsGranularity
}

export type AnalyticsTrendPoint = {
  key: string
  label: string
  visits: number
  clicks: number
}

export type TopPositionMetric = {
  source: VacancySource
  vacancyId: number
  title: string
  company: string
  visits: number
  clicks: number
  total: number
}

export type TopCompanyMetric = {
  company: string
  visits: number
  clicks: number
  total: number
}

export type AdminAnalyticsData = {
  filters: AdminAnalyticsFilters
  summary: {
    websiteVisits: number
    vacancyVisits: number
    interactionClicks: number
    trackedPositions: number
    trackedCompanies: number
  }
  trend: AnalyticsTrendPoint[]
  topPositions: TopPositionMetric[]
  topCompanies: TopCompanyMetric[]
}

type VisitRow = {
  source: string | null
  vacancy_id: number | null
  visit_day: string | null
  visitor_hash: string | null
}

type ClickRow = {
  source: string | null
  vacancy_id: number | null
  clicked_at: string | null
}

type JsVacancyRow = {
  id: number | null
  title: string | null
  company_id: number | null
}

type JsCompanyRow = {
  id: number | null
  title: string | null
}

type GlorriVacancyRow = {
  id: number | null
  title: string | null
  company_id: number | null
}

type GlorriCompanyRow = {
  id: number | null
  name: string | null
}

type SupabaseResponse<T> = {
  data: T[] | null
  error: {
    message: string
  } | null
}

type BucketTemplate = {
  key: string
  label: string
}

function pickQueryValue(value: QueryValue): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim()
  }
  return String(value ?? '').trim()
}

function parseDateOnly(value: string): Date | null {
  const raw = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

function toDateOnlyString(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const output = new Date(date)
  output.setUTCDate(output.getUTCDate() + days)
  return output
}

function firstDayOfCurrentMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function firstDayOfCurrentYearUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
}

function daysBetweenInclusive(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.floor(ms / 86400000) + 1
}

function normalizeSource(value: unknown): VacancySource | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'jobsearch' || normalized === 'jobsearch.az') {
    return 'jobsearch'
  }
  if (normalized === 'glorri') {
    return 'glorri'
  }
  return null
}

function toId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function vacancyKey(source: VacancySource, vacancyId: number): string {
  return `${source}|${vacancyId}`
}

function parseVacancyKey(key: string): { source: VacancySource; vacancyId: number } | null {
  const [rawSource, rawId] = String(key ?? '').split('|')
  const source = normalizeSource(rawSource)
  const vacancyId = toId(rawId)

  if (!source || vacancyId === null) {
    return null
  }

  return { source, vacancyId }
}

function buildBucketTemplate(from: Date, to: Date, granularity: AnalyticsGranularity): BucketTemplate[] {
  const output: BucketTemplate[] = []

  if (granularity === 'day') {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
    })

    let cursor = new Date(from)
    while (cursor.getTime() <= to.getTime()) {
      const key = toDateOnlyString(cursor)
      output.push({
        key,
        label: formatter.format(cursor),
      })
      cursor = addDays(cursor, 1)
    }

    return output
  }

  const includeYear = from.getUTCFullYear() !== to.getUTCFullYear()
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    ...(includeYear ? { year: '2-digit' as const } : {}),
  })

  let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1))
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1))

  while (cursor.getTime() <= end.getTime()) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`
    output.push({
      key,
      label: formatter.format(cursor),
    })
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }

  return output
}

function dayToBucket(day: string, granularity: AnalyticsGranularity): string {
  const normalized = String(day ?? '').trim()
  if (granularity === 'month') {
    return normalized.slice(0, 7)
  }
  return normalized
}

function toUtcDayFromTimestamp(value: string): string {
  const parsed = new Date(String(value ?? ''))
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  return parsed.toISOString().slice(0, 10)
}

async function fetchAllRows<T>(fetchPage: (from: number, to: number) => PromiseLike<SupabaseResponse<T>>): Promise<T[]> {
  const pageSize = 1000
  const output: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) {
      throw new Error(error.message)
    }

    const rows = Array.isArray(data) ? data : []
    output.push(...rows)

    if (rows.length < pageSize) {
      break
    }

    from += pageSize
    if (from > 1000000) {
      throw new Error('Pagination guard triggered')
    }
  }

  return output
}

export function resolveAdminAnalyticsFilters(query: AdminAnalyticsQuery): AdminAnalyticsFilters {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const presetRaw = pickQueryValue(query.preset).toLowerCase()
  const preset: AnalyticsPreset = presetRaw === 'year' || presetRaw === 'custom' ? (presetRaw as AnalyticsPreset) : 'month'

  let fromDate = firstDayOfCurrentMonthUtc(today)
  let toDate = today

  if (preset === 'year') {
    fromDate = firstDayOfCurrentYearUtc(today)
    toDate = today
  } else if (preset === 'custom') {
    const parsedFrom = parseDateOnly(pickQueryValue(query.from))
    const parsedTo = parseDateOnly(pickQueryValue(query.to))

    if (parsedFrom && parsedTo && parsedFrom.getTime() <= parsedTo.getTime()) {
      fromDate = parsedFrom
      toDate = parsedTo
    }
  }

  const totalDays = daysBetweenInclusive(fromDate, toDate)
  const granularity: AnalyticsGranularity = preset === 'year' || totalDays > 62 ? 'month' : 'day'

  return {
    preset,
    from: toDateOnlyString(fromDate),
    to: toDateOnlyString(toDate),
    granularity,
  }
}

export async function buildAdminAnalytics(filters: AdminAnalyticsFilters): Promise<AdminAnalyticsData> {
  const adminSupabase = await createAdminClient()
  const fromDate = parseDateOnly(filters.from) ?? new Date(`${filters.from}T00:00:00.000Z`)
  const toDate = parseDateOnly(filters.to) ?? new Date(`${filters.to}T00:00:00.000Z`)
  const toExclusive = addDays(toDate, 1).toISOString()

  const [visitRows, clickRows, jsVacancies, jsCompanies, glorriVacancies, glorriCompanies] = await Promise.all([
    fetchAllRows<VisitRow>((from, to) =>
      adminSupabase
        .from('vacancy_visits')
        .select('source,vacancy_id,visit_day,visitor_hash')
        .gte('visit_day', filters.from)
        .lte('visit_day', filters.to)
        .order('visit_day', { ascending: true })
        .range(from, to)
    ).catch(() => []),
    fetchAllRows<ClickRow>((from, to) =>
      adminSupabase
        .from('vacancy_clicks')
        .select('source,vacancy_id,clicked_at')
        .gte('clicked_at', `${filters.from}T00:00:00.000Z`)
        .lt('clicked_at', toExclusive)
        .order('clicked_at', { ascending: true })
        .range(from, to)
    ).catch(() => []),
    fetchAllRows<JsVacancyRow>((from, to) =>
      adminSupabase.from('js_vacancies').select('id,title,company_id').order('id', { ascending: true }).range(from, to)
    ).catch(() => []),
    fetchAllRows<JsCompanyRow>((from, to) =>
      adminSupabase.from('js_companies').select('id,title').order('id', { ascending: true }).range(from, to)
    ).catch(() => []),
    fetchAllRows<GlorriVacancyRow>((from, to) =>
      adminSupabase.from('glorri_vacancies').select('id,title,company_id').order('id', { ascending: true }).range(from, to)
    ).catch(() => []),
    fetchAllRows<GlorriCompanyRow>((from, to) =>
      adminSupabase.from('glorri_companies').select('id,name').order('id', { ascending: true }).range(from, to)
    ).catch(() => []),
  ])

  const jsCompanyById = new Map<number, string>()
  for (const company of jsCompanies) {
    const id = toId(company.id)
    if (id === null) {
      continue
    }
    jsCompanyById.set(id, toText(company.title))
  }

  const glorriCompanyById = new Map<number, string>()
  for (const company of glorriCompanies) {
    const id = toId(company.id)
    if (id === null) {
      continue
    }
    glorriCompanyById.set(id, toText(company.name))
  }

  const vacancyMetaByKey = new Map<string, { title: string; company: string }>()

  for (const vacancy of jsVacancies) {
    const id = toId(vacancy.id)
    if (id === null) {
      continue
    }

    const companyId = toId(vacancy.company_id)
    const company = (companyId !== null ? jsCompanyById.get(companyId) : '') || 'Unknown'
    vacancyMetaByKey.set(vacancyKey('jobsearch', id), {
      title: toText(vacancy.title) || `Vacancy #${id}`,
      company,
    })
  }

  for (const vacancy of glorriVacancies) {
    const id = toId(vacancy.id)
    if (id === null) {
      continue
    }

    const companyId = toId(vacancy.company_id)
    const company = (companyId !== null ? glorriCompanyById.get(companyId) : '') || 'Unknown'
    vacancyMetaByKey.set(vacancyKey('glorri', id), {
      title: toText(vacancy.title) || `Vacancy #${id}`,
      company,
    })
  }

  const visitCountByVacancy = new Map<string, number>()
  const clickCountByVacancy = new Map<string, number>()
  const websiteVisitorSet = new Set<string>()
  const visitBucketVisitors = new Map<string, Set<string>>()

  for (const row of visitRows) {
    const source = normalizeSource(row.source)
    const vacancyId = toId(row.vacancy_id)
    const visitDay = toText(row.visit_day).slice(0, 10)

    if (!source || vacancyId === null || !visitDay) {
      continue
    }

    const visitorHash = toText(row.visitor_hash)
    const websiteVisitorKey = visitorHash || `fallback:${source}|${vacancyId}|${visitDay}`
    websiteVisitorSet.add(`${visitDay}|${websiteVisitorKey}`)

    const key = vacancyKey(source, vacancyId)
    visitCountByVacancy.set(key, (visitCountByVacancy.get(key) ?? 0) + 1)

    const bucketKey = dayToBucket(visitDay, filters.granularity)
    if (!visitBucketVisitors.has(bucketKey)) {
      visitBucketVisitors.set(bucketKey, new Set<string>())
    }
    visitBucketVisitors.get(bucketKey)!.add(websiteVisitorKey)
  }

  const clickBucketCount = new Map<string, number>()
  let clickCount = 0

  for (const row of clickRows) {
    const source = normalizeSource(row.source)
    const vacancyId = toId(row.vacancy_id)
    const day = toUtcDayFromTimestamp(toText(row.clicked_at))

    if (!source || vacancyId === null || !day) {
      continue
    }

    const key = vacancyKey(source, vacancyId)
    clickCountByVacancy.set(key, (clickCountByVacancy.get(key) ?? 0) + 1)
    clickCount += 1

    const bucketKey = dayToBucket(day, filters.granularity)
    clickBucketCount.set(bucketKey, (clickBucketCount.get(bucketKey) ?? 0) + 1)
  }

  const bucketTemplate = buildBucketTemplate(fromDate, toDate, filters.granularity)
  const trend: AnalyticsTrendPoint[] = bucketTemplate.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    visits: visitBucketVisitors.get(bucket.key)?.size ?? 0,
    clicks: clickBucketCount.get(bucket.key) ?? 0,
  }))

  const unionKeys = new Set<string>([...visitCountByVacancy.keys(), ...clickCountByVacancy.keys()])
  const allPositionMetrics: TopPositionMetric[] = []

  for (const key of unionKeys) {
    const parsed = parseVacancyKey(key)
    if (!parsed) {
      continue
    }

    const meta = vacancyMetaByKey.get(key)
    const visits = visitCountByVacancy.get(key) ?? 0
    const clicks = clickCountByVacancy.get(key) ?? 0
    const total = visits + clicks

    allPositionMetrics.push({
      source: parsed.source,
      vacancyId: parsed.vacancyId,
      title: meta?.title || `Vacancy #${parsed.vacancyId}`,
      company: meta?.company || 'Unknown',
      visits,
      clicks,
      total,
    })
  }

  allPositionMetrics.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total
    }
    if (b.visits !== a.visits) {
      return b.visits - a.visits
    }
    if (b.clicks !== a.clicks) {
      return b.clicks - a.clicks
    }
    return a.title.localeCompare(b.title)
  })

  const companyAggregates = new Map<string, TopCompanyMetric>()
  for (const item of allPositionMetrics) {
    const company = toText(item.company) || 'Unknown'
    const key = company.toLowerCase()
    const existing = companyAggregates.get(key)

    if (existing) {
      existing.visits += item.visits
      existing.clicks += item.clicks
      existing.total += item.total
      continue
    }

    companyAggregates.set(key, {
      company,
      visits: item.visits,
      clicks: item.clicks,
      total: item.total,
    })
  }

  const topCompanies = [...companyAggregates.values()]
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total
      }
      if (b.visits !== a.visits) {
        return b.visits - a.visits
      }
      if (b.clicks !== a.clicks) {
        return b.clicks - a.clicks
      }
      return a.company.localeCompare(b.company)
    })
    .slice(0, 10)

  return {
    filters,
    summary: {
      websiteVisits: websiteVisitorSet.size,
      vacancyVisits: visitRows.length,
      interactionClicks: clickCount,
      trackedPositions: allPositionMetrics.length,
      trackedCompanies: companyAggregates.size,
    },
    trend,
    topPositions: allPositionMetrics.slice(0, 10),
    topCompanies,
  }
}
