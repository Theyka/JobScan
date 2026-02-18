import { createAdminClient } from '@/lib/supabase/admin'

type JsVacancyRow = {
  id: number
  title: string | null
  slug: string | null
  created_at: string | null
  salary: number | null
  deadline_at: string | null
  text: string | null
  tech_stack: unknown
  company_id: number | null
}

type JsCompanyRow = {
  id: number
  title: string | null
}

type GlorriVacancyRow = {
  id: number
  title: string | null
  slug: string | null
  postedDate: string | null
  created_at: string | null
  location: string | null
  type: string | null
  jobFunction: string | null
  careerLevel: string | null
  detail_url: string | null
  apply_url: string | null
  vacancy_about: unknown
  benefits: unknown
  text: string | null
  tech_stack: unknown
  company_id: number | null
}

type GlorriCompanyRow = {
  id: number
  name: string | null
}

type VacancyVisitUniqueDailyRow = {
  source: string | null
  vacancy_id: number | null
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

const CSV_HEADERS = [
  'source',
  'vacancy_id',
  'views_count',
  'title',
  'company',
  'slug',
  'posted_date',
  'created_at',
  'deadline_at',
  'location',
  'type',
  'job_function',
  'career_level',
  'salary',
  'detail_url',
  'apply_url',
  'tech_stack',
  'text',
  'vacancy_about',
  'benefits',
] as const

type CsvHeader = (typeof CSV_HEADERS)[number]
type CsvRow = Record<CsvHeader, string>

export type JobsCsvPreview = {
  csv: string
  rows: CsvRow[]
  totalRows: number
  previewRows: number
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toJsonText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function extractGlorriSalary(vacancyAbout: unknown): string {
  if (!isObjectRecord(vacancyAbout) || !('salary' in vacancyAbout)) {
    return ''
  }

  return toJsonText(vacancyAbout.salary)
}

function toId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function buildJobSearchDetailUrl(slug: string): string {
  if (!slug) {
    return ''
  }

  return `https://jobsearch.az/vacancies/${encodeURIComponent(slug)}`
}

function toTimestamp(value: string): number {
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function toInt(value: string): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function toVisitSource(value: unknown): 'jobsearch' | 'glorri' | '' {
  const normalized = toText(value).toLowerCase()
  if (normalized === 'jobsearch' || normalized === 'jobsearch.az') {
    return 'jobsearch'
  }

  if (normalized === 'glorri') {
    return 'glorri'
  }

  return ''
}

function buildVisitMapKey(source: 'jobsearch' | 'glorri', vacancyId: number): string {
  return `${source}|${vacancyId}`
}

function getViewsCount(
  visitCountByVacancy: Map<string, number>,
  source: 'jobsearch' | 'glorri',
  vacancyId: number
): string {
  return String(visitCountByVacancy.get(buildVisitMapKey(source, vacancyId)) ?? 0)
}

function escapeCsv(value: string): string {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
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

    const rows = Array.isArray(data) ? data : []
    allRows.push(...rows)

    if (rows.length < pageSize) {
      break
    }

    from += pageSize
    if (from > 500000) {
      throw new Error(`${table}: pagination guard triggered`)
    }
  }

  return allRows
}

function rowsToCsv(rows: CsvRow[], withBom = true): string {
  const headerLine = CSV_HEADERS.join(',')
  const rowLines = rows.map((row) => CSV_HEADERS.map((header) => escapeCsv(row[header])).join(','))
  return [withBom ? `\uFEFF${headerLine}` : headerLine, ...rowLines].join('\n')
}

async function buildJobsRows(): Promise<CsvRow[]> {
  const adminSupabase = await createAdminClient()
  const supabase = adminSupabase as unknown as SupabaseLikeClient

  const [jsVacancies, jsCompanies, glorriVacancies, glorriCompanies, vacancyVisitUniqueDaily] = await Promise.all([
    fetchAllRows<JsVacancyRow>(
      supabase,
      'js_vacancies',
      'id,title,slug,created_at,salary,deadline_at,text,tech_stack,company_id',
      'id'
    ),
    fetchAllRows<JsCompanyRow>(supabase, 'js_companies', 'id,title', 'id'),
    fetchAllRows<GlorriVacancyRow>(
      supabase,
      'glorri_vacancies',
      'id,title,slug,postedDate,created_at,location,type,jobFunction,careerLevel,detail_url,apply_url,vacancy_about,benefits,text,tech_stack,company_id',
      'id'
    ),
    fetchAllRows<GlorriCompanyRow>(supabase, 'glorri_companies', 'id,name', 'id'),
    fetchAllRows<VacancyVisitUniqueDailyRow>(supabase, 'vacancy_visits', 'source,vacancy_id', 'vacancy_id').catch(
      () => []
    ),
  ])

  const visitCountByVacancy = new Map<string, number>()
  for (const stat of vacancyVisitUniqueDaily) {
    const source = toVisitSource(stat.source)
    const vacancyId = toId(stat.vacancy_id)
    if (!source || vacancyId === null) {
      continue
    }

    const key = buildVisitMapKey(source, vacancyId)
    const existing = visitCountByVacancy.get(key) ?? 0
    visitCountByVacancy.set(key, existing + 1)
  }

  const jsCompanyById = new Map<number, string>()
  for (const company of jsCompanies) {
    const companyId = toId(company.id)
    if (companyId === null) {
      continue
    }

    jsCompanyById.set(companyId, toText(company.title))
  }

  const glorriCompanyById = new Map<number, string>()
  for (const company of glorriCompanies) {
    const companyId = toId(company.id)
    if (companyId === null) {
      continue
    }

    glorriCompanyById.set(companyId, toText(company.name))
  }

  const rows: CsvRow[] = []

  for (const vacancy of jsVacancies) {
    const id = toId(vacancy.id)
    if (id === null) {
      continue
    }

    const companyId = toId(vacancy.company_id)
    const slug = toText(vacancy.slug)

    rows.push({
      source: 'jobsearch.az',
      vacancy_id: String(id),
      views_count: getViewsCount(visitCountByVacancy, 'jobsearch', id),
      title: toText(vacancy.title),
      company: (companyId !== null ? jsCompanyById.get(companyId) : '') || '',
      slug,
      posted_date: toText(vacancy.created_at),
      created_at: toText(vacancy.created_at),
      deadline_at: toText(vacancy.deadline_at),
      location: '',
      type: '',
      job_function: '',
      career_level: '',
      salary: toText(vacancy.salary),
      detail_url: buildJobSearchDetailUrl(slug),
      apply_url: '',
      tech_stack: toJsonText(vacancy.tech_stack),
      text: toText(vacancy.text),
      vacancy_about: '',
      benefits: '',
    })
  }

  for (const vacancy of glorriVacancies) {
    const id = toId(vacancy.id)
    if (id === null) {
      continue
    }

    const companyId = toId(vacancy.company_id)

    rows.push({
      source: 'glorri',
      vacancy_id: String(id),
      views_count: getViewsCount(visitCountByVacancy, 'glorri', id),
      title: toText(vacancy.title),
      company: (companyId !== null ? glorriCompanyById.get(companyId) : '') || '',
      slug: toText(vacancy.slug),
      posted_date: toText(vacancy.postedDate),
      created_at: toText(vacancy.created_at),
      deadline_at: '',
      location: toText(vacancy.location),
      type: toText(vacancy.type),
      job_function: toText(vacancy.jobFunction),
      career_level: toText(vacancy.careerLevel),
      salary: extractGlorriSalary(vacancy.vacancy_about),
      detail_url: toText(vacancy.detail_url),
      apply_url: toText(vacancy.apply_url),
      tech_stack: toJsonText(vacancy.tech_stack),
      text: toText(vacancy.text),
      vacancy_about: toJsonText(vacancy.vacancy_about),
      benefits: toJsonText(vacancy.benefits),
    })
  }

  rows.sort((a, b) => {
    const createdDiff = toTimestamp(b.created_at) - toTimestamp(a.created_at)
    if (createdDiff !== 0) {
      return createdDiff
    }

    const sourceDiff = a.source.localeCompare(b.source)
    if (sourceDiff !== 0) {
      return sourceDiff
    }

    return toInt(b.vacancy_id) - toInt(a.vacancy_id)
  })

  return rows
}

export async function buildJobsCsv(): Promise<string> {
  const rows = await buildJobsRows()
  return rowsToCsv(rows, true)
}

export async function buildJobsCsvPreview(maxRows = 10): Promise<JobsCsvPreview> {
  const rows = await buildJobsRows()
  const safeMaxRows = Number.isFinite(maxRows) ? Math.max(0, Math.floor(maxRows)) : 0
  const previewRows = rows.slice(0, safeMaxRows)

  return {
    csv: rowsToCsv(previewRows, false),
    rows: previewRows,
    totalRows: rows.length,
    previewRows: previewRows.length,
  }
}
