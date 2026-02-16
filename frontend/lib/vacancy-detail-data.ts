import { createClient } from '@/lib/supabase/server'

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

type JsVacancyRow = {
  id: number
  title: string | null
  created_at: string | null
  slug: string | null
  salary: number | string | null
  deadline_at: string | null
  text: string | null
  tech_stack: unknown
  company_id: number | null
}

type JsCompanyRow = {
  id: number
  title: string | null
  logo: string | null
  logo_mini: string | null
  created_at: string | null
  text: string | null
  address: string | null
  phones: unknown
  sites: unknown
  email: unknown
  cover: string | null
  coordinates: unknown
}

type GlorriVacancyRow = {
  id: number
  title: string | null
  slug: string | null
  postedDate: string | null
  location: string | null
  type: string | null
  detail_url: string | null
  text: string | null
  vacancy_about: unknown
  benefits: unknown
  apply_url: string | null
  company_id: number | null
  tech_stack: unknown
  created_at: string | null
}

type GlorriCompanyRow = {
  id: number
  name: string | null
  slug: string | null
  logo: string | null
  created_at: string | null
}

type DuplicateRow = {
  glorri_id: number | null
  jobsearch_id: number | null
  score: number | null
}

type GlorriDuplicateLookupRow = {
  id: number
  slug: string | null
  detail_url: string | null
  apply_url: string | null
  company_id: number | null
}

type JobSearchDuplicateLookupRow = {
  id: number
  slug: string | null
}

type SupabaseSingleResponse<T> = {
  data: T | null
  error: {
    message: string
  } | null
}

type SupabaseSingleQuery<T> = {
  eq: (column: string, value: unknown) => SupabaseSingleQuery<T>
  limit: (count: number) => {
    maybeSingle: () => Promise<SupabaseSingleResponse<T>>
  }
}

type SupabaseLikeClient = {
  from: <T>(table: string) => {
    select: (columns: string) => SupabaseSingleQuery<T>
  }
}

const SOURCE_META: Record<VacancyRouteSource, { label: string; icon: string; rank: number }> = {
  jobsearch: {
    label: 'JobSearch.az',
    icon: 'https://jobsearch.az/favicon.ico',
    rank: 1,
  },
  glorri: {
    label: 'Glorri',
    icon: 'https://jobs.glorri.com/favicon.ico',
    rank: 2,
  },
}

function safeDecodeURIComponent(value: string): string {
  const raw = String(value ?? '')
  if (!raw) {
    return ''
  }

  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function normalizeRouteSource(value: string): VacancyRouteSource | null {
  const normalized = safeDecodeURIComponent(value).trim().toLowerCase()
  if (normalized === 'jobsearch' || normalized === 'jobsearch.az') {
    return 'jobsearch'
  }
  if (normalized === 'glorri') {
    return 'glorri'
  }
  return null
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function parseSalaryText(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified'
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${formatNumber(Math.round(value))} AZN`
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

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  if (min === max) {
    return `${formatNumber(min)} AZN`
  }

  return `${formatNumber(min)} - ${formatNumber(max)} AZN`
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function toInt(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function toFloat(value: unknown): number | null {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : null
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

function normalizeListItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim()
      }

      if (isObjectRecord(entry)) {
        const candidate = entry.value ?? entry.phone ?? entry.number ?? entry.title ?? entry.name ?? ''
        return String(candidate).trim()
      }

      return ''
    })
    .filter(Boolean)
}

function normalizeSites(value: unknown): VacancyCompanySite[] {
  if (!Array.isArray(value)) {
    return []
  }

  const output: VacancyCompanySite[] = []
  for (const entry of value) {
    if (typeof entry === 'string') {
      const trimmed = entry.trim()
      if (!trimmed) {
        continue
      }
      output.push({ label: trimmed, url: trimmed })
      continue
    }

    if (!isObjectRecord(entry)) {
      continue
    }

    const url = String(entry.url ?? entry.href ?? '').trim()
    if (!url) {
      continue
    }

    const label = String(entry.title ?? entry.name ?? url).trim() || url
    output.push({ label, url })
  }

  return output
}

function normalizeCoordinates(value: unknown): { lat: number; lng: number } | null {
  if (!isObjectRecord(value)) {
    return null
  }

  const lat = Number(value.lat)
  const lng = Number(value.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

function formatAboutEntries(value: unknown, skipKeys: string[] = []): VacancyAboutEntry[] {
  if (!isObjectRecord(value)) {
    return []
  }

  const skipSet = new Set(skipKeys.map((item) => item.toLowerCase()))

  return Object.entries(value)
    .filter(([key, rawValue]) => {
      if (skipSet.has(key.toLowerCase())) {
        return false
      }
      if (rawValue === null || rawValue === undefined) {
        return false
      }

      return String(rawValue).trim() !== ''
    })
    .map(([key, rawValue]) => ({
      key,
      label: key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      value: String(rawValue).trim(),
    }))
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

  const cleaned = raw.replace(/^\/+/, '')
  return cleaned ? `https://jobsearch.az/${cleaned}` : ''
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

function normalizeExternalUrl(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw || /^javascript:/i.test(raw)) {
    return ''
  }

  if (/^(https?:|mailto:|tel:)/i.test(raw)) {
    return raw
  }

  if (/^www\./i.test(raw)) {
    return `https://${raw}`
  }

  return ''
}

function createSourceBadge(source: VacancyRouteSource): VacancySourceBadge {
  const meta = SOURCE_META[source]
  return {
    source,
    label: meta.label,
    icon: meta.icon,
  }
}

function createSourceLink(source: VacancyRouteSource, url: unknown): VacancySourceLink | null {
  const safeUrl = normalizeExternalUrl(url)
  if (!safeUrl) {
    return null
  }

  const badge = createSourceBadge(source)
  return {
    ...badge,
    url: safeUrl,
  }
}

function dedupeSourceBadges(items: VacancySourceBadge[]): VacancySourceBadge[] {
  const bySource = new Map<VacancyRouteSource, VacancySourceBadge>()

  for (const item of items) {
    if (!bySource.has(item.source)) {
      bySource.set(item.source, item)
    }
  }

  return [...bySource.values()]
}

function dedupeSourceLinks(items: VacancySourceLink[]): VacancySourceLink[] {
  const seen = new Set<string>()
  const output: VacancySourceLink[] = []

  for (const item of items) {
    const key = `${item.source}|${item.url}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(item)
  }

  return output
}

function sortSourceBadges(items: VacancySourceBadge[]): VacancySourceBadge[] {
  return [...items].sort((a, b) => SOURCE_META[a.source].rank - SOURCE_META[b.source].rank)
}

function sortSourceLinks(items: VacancySourceLink[]): VacancySourceLink[] {
  return [...items].sort((a, b) => SOURCE_META[a.source].rank - SOURCE_META[b.source].rank)
}

async function fetchSingleRow<T>(
  supabase: SupabaseLikeClient,
  table: string,
  select: string,
  filters: Record<string, unknown>
): Promise<T | null> {
  let query = supabase.from<T>(table).select(select)

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    query = query.eq(key, value)
  }

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }

  return (data as T | null) ?? null
}

async function fetchDuplicatePairBySource(
  supabase: SupabaseLikeClient,
  source: VacancyRouteSource,
  vacancyId: number | null
): Promise<DuplicateRow | null> {
  if (!Number.isFinite(vacancyId)) {
    return null
  }

  const filterKey = source === 'jobsearch' ? 'jobsearch_id' : 'glorri_id'
  try {
    return await fetchSingleRow<DuplicateRow>(supabase, 'duplicate_jobs', 'glorri_id,jobsearch_id,score', {
      [filterKey]: vacancyId,
    })
  } catch {
    return null
  }
}

async function getJobSearchDetail(supabase: SupabaseLikeClient, slug: string): Promise<VacancyDetail | null> {
  const vacancy = await fetchSingleRow<JsVacancyRow>(
    supabase,
    'js_vacancies',
    'id,title,created_at,slug,salary,deadline_at,text,tech_stack,company_id',
    { slug }
  )

  if (!vacancy) {
    return null
  }

  const vacancyId = toInt(vacancy.id)
  const companyId = toInt(vacancy.company_id)
  const company =
    companyId !== null
      ? await fetchSingleRow<JsCompanyRow>(
          supabase,
          'js_companies',
          'id,title,logo,logo_mini,created_at,text,address,phones,sites,email,cover,coordinates',
          { id: companyId }
        )
      : null

  const normalizedSlug = String(vacancy.slug ?? slug).trim()
  const encodedSlug = encodeURIComponent(normalizedSlug)
  const externalUrl = normalizedSlug ? `https://jobsearch.az/vacancies/${encodedSlug}` : ''

  const sourceBadges: VacancySourceBadge[] = [createSourceBadge('jobsearch')]
  const sourceLinks: VacancySourceLink[] = []
  const primaryLink = createSourceLink('jobsearch', externalUrl)
  if (primaryLink) {
    sourceLinks.push(primaryLink)
  }

  let duplicateScore: number | null = null
  const duplicatePair = await fetchDuplicatePairBySource(supabase, 'jobsearch', vacancyId)

  const duplicateGlorriId = toInt(duplicatePair?.glorri_id)
  if (duplicateGlorriId !== null) {
    sourceBadges.push(createSourceBadge('glorri'))
    duplicateScore = toFloat(duplicatePair?.score)

    const duplicateGlorri = await fetchSingleRow<GlorriDuplicateLookupRow>(
      supabase,
      'glorri_vacancies',
      'id,slug,detail_url,apply_url,company_id',
      { id: duplicateGlorriId }
    )

    if (duplicateGlorri) {
      let glorriUrl = String(duplicateGlorri.apply_url ?? duplicateGlorri.detail_url ?? '').trim()
      const duplicateSlug = String(duplicateGlorri.slug ?? '').trim()

      if (!glorriUrl && duplicateSlug) {
        const duplicateCompanyId = toInt(duplicateGlorri.company_id)
        if (duplicateCompanyId !== null) {
          const duplicateCompany = await fetchSingleRow<GlorriCompanyRow>(
            supabase,
            'glorri_companies',
            'id,slug',
            { id: duplicateCompanyId }
          )
          const companySlug = String(duplicateCompany?.slug ?? '').trim()
          if (companySlug) {
            glorriUrl = `https://jobs.glorri.com/vacancies/${encodeURIComponent(companySlug)}/${encodeURIComponent(duplicateSlug)}`
          }
        }
      }

      const duplicateLink = createSourceLink('glorri', glorriUrl)
      if (duplicateLink) {
        sourceLinks.push(duplicateLink)
      }
    }
  }

  const normalizedBadges = sortSourceBadges(dedupeSourceBadges(sourceBadges))
  const normalizedLinks = sortSourceLinks(dedupeSourceLinks(sourceLinks))

  const companyName = String(company?.title ?? '').trim() || 'Unknown'
  const companyAddress = String(company?.address ?? '').trim()

  return {
    source: 'jobsearch',
    sourceLabel: 'JobSearch.az',
    title: String(vacancy.title ?? '').trim() || 'Untitled',
    slug: normalizedSlug,
    postedAt: String(vacancy.created_at ?? '').trim(),
    deadlineAt: String(vacancy.deadline_at ?? '').trim(),
    salaryText: parseSalaryText(vacancy.salary),
    location: companyAddress,
    jobType: '',
    techStack: normalizeTechStack(vacancy.tech_stack),
    descriptionHtml: String(vacancy.text ?? '').trim(),
    requirementsHtml: '',
    benefits: [],
    applyUrl: externalUrl,
    externalUrl,
    sourceBadges: normalizedBadges,
    sourceLinks: normalizedLinks,
    isDuplicate: normalizedBadges.length > 1,
    duplicateScore,
    about: [],
    company: {
      id: toInt(company?.id),
      name: companyName,
      createdAt: String(company?.created_at ?? '').trim(),
      logo: toAbsoluteJobSearchLogo(company?.logo_mini ?? company?.logo ?? ''),
      cover: toAbsoluteJobSearchLogo(company?.cover ?? ''),
      coordinates: normalizeCoordinates(company?.coordinates),
      descriptionHtml: String(company?.text ?? '').trim(),
      address: companyAddress,
      phones: normalizeListItems(company?.phones),
      sites: normalizeSites(company?.sites),
      emails: normalizeListItems(company?.email),
    },
  }
}

async function getGlorriDetail(supabase: SupabaseLikeClient, slug: string): Promise<VacancyDetail | null> {
  const vacancy = await fetchSingleRow<GlorriVacancyRow>(
    supabase,
    'glorri_vacancies',
    'id,title,slug,postedDate,location,type,detail_url,text,vacancy_about,benefits,apply_url,company_id,tech_stack,created_at',
    { slug }
  )

  if (!vacancy) {
    return null
  }

  const vacancyId = toInt(vacancy.id)
  const companyId = toInt(vacancy.company_id)
  const company =
    companyId !== null
      ? await fetchSingleRow<GlorriCompanyRow>(supabase, 'glorri_companies', 'id,name,slug,logo,created_at', { id: companyId })
      : null

  const normalizedSlug = String(vacancy.slug ?? slug).trim()
  const vacancyAbout = isObjectRecord(vacancy.vacancy_about) ? vacancy.vacancy_about : {}
  const salaryText = parseSalaryText(vacancyAbout.salary ?? '')
  const companySlug = String(company?.slug ?? '').trim()
  const externalUrl =
    String(vacancy.detail_url ?? '').trim() ||
    (companySlug && normalizedSlug
      ? `https://jobs.glorri.com/vacancies/${encodeURIComponent(companySlug)}/${encodeURIComponent(normalizedSlug)}`
      : '')

  const sourceBadges: VacancySourceBadge[] = [createSourceBadge('glorri')]
  const sourceLinks: VacancySourceLink[] = []

  const primaryUrl = String(vacancy.apply_url ?? '').trim() || externalUrl
  const primaryLink = createSourceLink('glorri', primaryUrl)
  if (primaryLink) {
    sourceLinks.push(primaryLink)
  }

  let duplicateScore: number | null = null
  const duplicatePair = await fetchDuplicatePairBySource(supabase, 'glorri', vacancyId)

  const duplicateJobSearchId = toInt(duplicatePair?.jobsearch_id)
  if (duplicateJobSearchId !== null) {
    sourceBadges.push(createSourceBadge('jobsearch'))
    duplicateScore = toFloat(duplicatePair?.score)

    const duplicateJobSearch = await fetchSingleRow<JobSearchDuplicateLookupRow>(
      supabase,
      'js_vacancies',
      'id,slug',
      { id: duplicateJobSearchId }
    )

    const duplicateSlug = String(duplicateJobSearch?.slug ?? '').trim()
    const jobSearchUrl = duplicateSlug ? `https://jobsearch.az/vacancies/${encodeURIComponent(duplicateSlug)}` : ''
    const duplicateLink = createSourceLink('jobsearch', jobSearchUrl)
    if (duplicateLink) {
      sourceLinks.push(duplicateLink)
    }
  }

  const normalizedBadges = sortSourceBadges(dedupeSourceBadges(sourceBadges))
  const normalizedLinks = sortSourceLinks(dedupeSourceLinks(sourceLinks))

  const postedAt =
    String(vacancyAbout.posted ?? '').trim() || String(vacancy.postedDate ?? '').trim() || String(vacancy.created_at ?? '').trim()
  const deadlineAt = String(vacancyAbout.deadline ?? '').trim()
  const requirementsHtml = String(vacancyAbout.requirements ?? '').trim()
  const jobType = String(vacancy.type ?? '').trim() || String(vacancyAbout.job_type ?? '').trim()

  return {
    source: 'glorri',
    sourceLabel: 'Glorri',
    title: String(vacancy.title ?? '').trim() || 'Untitled',
    slug: normalizedSlug,
    postedAt,
    deadlineAt,
    salaryText,
    location: String(vacancy.location ?? '').trim(),
    jobType,
    techStack: normalizeTechStack(vacancy.tech_stack),
    descriptionHtml: String(vacancy.text ?? '').trim(),
    requirementsHtml,
    benefits: normalizeListItems(vacancy.benefits),
    applyUrl: String(vacancy.apply_url ?? '').trim() || externalUrl,
    externalUrl,
    sourceBadges: normalizedBadges,
    sourceLinks: normalizedLinks,
    isDuplicate: normalizedBadges.length > 1,
    duplicateScore,
    about: formatAboutEntries(vacancyAbout, ['posted', 'salary', 'deadline', 'job_type', 'requirements']),
    company: {
      id: toInt(company?.id),
      name: String(company?.name ?? '').trim() || 'Unknown',
      createdAt: String(company?.created_at ?? '').trim(),
      logo: toAbsoluteGlorriLogo(company?.logo ?? ''),
      cover: '',
      coordinates: null,
      descriptionHtml: '',
      address: '',
      phones: [],
      sites: [],
      emails: [],
    },
  }
}

export async function getVacancyDetail(routeSourceInput: string, routeSlugInput: string): Promise<VacancyDetail | null> {
  const source = normalizeRouteSource(routeSourceInput)
  const slug = safeDecodeURIComponent(routeSlugInput).trim()

  if (!source || !slug) {
    return null
  }

  const supabase = (await createClient()) as unknown as SupabaseLikeClient

  if (source === 'jobsearch') {
    return getJobSearchDetail(supabase, slug)
  }

  return getGlorriDetail(supabase, slug)
}
