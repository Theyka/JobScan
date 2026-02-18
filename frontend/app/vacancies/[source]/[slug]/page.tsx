import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
import { incrementVacancyVisitCounter } from '@/lib/vacancy-visit-tracker'
import { getVacancyDetail, normalizeRouteSource } from '@/lib/vacancy-detail-data'
import type { VacancyDetail } from '@/lib/datatypes/vacancy-detail-data.types'
import type { VacancyPageProps } from '@/lib/datatypes/vacancy-page.types'

function decodeParam(value: string): string {
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

function normalizeIpCandidate(value: string | null): string {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const first = raw.split(',')[0]?.trim() ?? ''
  if (!first) {
    return ''
  }

  if (first.startsWith('::ffff:')) {
    return first.slice(7)
  }

  return first
}

function getVisitorIpFromHeaders(requestHeaders: Headers): string {
  const candidates = [
    requestHeaders.get('cf-connecting-ip'),
    requestHeaders.get('x-forwarded-for'),
    requestHeaders.get('x-real-ip'),
    requestHeaders.get('x-client-ip'),
    requestHeaders.get('true-client-ip'),
    requestHeaders.get('x-vercel-forwarded-for'),
  ]

  for (const candidate of candidates) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) {
      return normalized
    }
  }

  return ''
}

function isPrefetchRequest(requestHeaders: Headers): boolean {
  const purpose = requestHeaders.get('purpose')?.toLowerCase() ?? ''
  const secPurpose = requestHeaders.get('sec-purpose')?.toLowerCase() ?? ''
  const nextRouterPrefetch = requestHeaders.get('next-router-prefetch')
  const middlewarePrefetch = requestHeaders.get('x-middleware-prefetch')

  return (
    purpose.includes('prefetch') ||
    secPurpose.includes('prefetch') ||
    nextRouterPrefetch !== null ||
    middlewarePrefetch !== null
  )
}

function formatDateLabel(value: string): string {
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

function normalizeSafeUrl(url: string): string {
  const raw = String(url ?? '').trim()
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

function buildTrackedClickUrl(source: string, vacancyId: number | null, slug: string, targetUrl: string): string {
  if (!vacancyId || vacancyId <= 0) {
    return targetUrl
  }

  const params = new URLSearchParams({
    source,
    vacancy_id: String(vacancyId),
    slug: String(slug ?? '').trim(),
    target: targetUrl,
  })

  return `/track/click?${params.toString()}`
}

function sanitizeHtml(html: string): string {
  const source = String(html ?? '').trim()
  if (!source) {
    return ''
  }

  return source
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)=("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, '')
}

function hasHtmlTags(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(String(value ?? ''))
}

function hasRenderableContent(html: string): boolean {
  return (
    String(html ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().length > 0
  )
}

function normalizeTextForCompare(value: string): string {
  return String(value ?? '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function duplicateScoreLabel(score: number | null): string {
  if (score === null || !Number.isFinite(score)) {
    return 'Duplicate Match'
  }

  return `Duplicate Match ${Math.round(score * 100)}%`
}

function renderInfoCards(detail: VacancyDetail) {
  const locationValue = String(detail.location ?? '').trim()
  const addressValue = String(detail.company.address ?? '').trim()
  const shouldHideLocation =
    Boolean(locationValue) &&
    Boolean(addressValue) &&
    normalizeTextForCompare(locationValue) === normalizeTextForCompare(addressValue)

  const infoEntries: Array<{ label: string; value: string; valueClass?: string }> = [
    { label: 'Posted', value: formatDateLabel(detail.postedAt) },
    { label: 'Deadline', value: formatDateLabel(detail.deadlineAt), valueClass: 'text-red-500 dark:text-red-400' },
    { label: 'Salary', value: detail.salaryText || 'Not specified' },
    { label: 'Location', value: shouldHideLocation ? '' : locationValue },
    { label: 'Type', value: detail.jobType },
    ...detail.about.map((entry) => ({ label: entry.label, value: entry.value })),
  ].filter((entry) => String(entry.value ?? '').trim())

  if (!infoEntries.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {infoEntries.map((entry) => (
        <div
          key={`${entry.label}-${entry.value}`}
          className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {entry.label}
            </span>
            <p className={`text-sm font-bold text-right break-words text-slate-900 dark:text-white ${entry.valueClass ?? ''}`}>
              {entry.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function renderCompanyMeta(detail: VacancyDetail) {
  if (detail.source === 'glorri') {
    return null
  }

  const company = detail.company
  const companyCreatedAt = formatDateLabel(company.createdAt)
  const companyDescriptionHtml = sanitizeHtml(company.descriptionHtml)
  const companyDescriptionIsHtml = hasHtmlTags(companyDescriptionHtml)
  const hasCompanyDescription = hasRenderableContent(companyDescriptionHtml)

  const phones = company.phones.filter((item) => item.trim())
  const emails = company.emails.filter((item) => item.trim())
  const sites = company.sites
    .map((site) => ({ label: site.label, url: normalizeSafeUrl(site.url) || normalizeSafeUrl(`https://${site.url}`) }))
    .filter((site) => site.url)

  const coords = company.coordinates
  const hasCoordinates =
    Boolean(coords) &&
    Number.isFinite(coords!.lat) &&
    Number.isFinite(coords!.lng) &&
    (Math.abs(coords!.lat) > 0.000001 || Math.abs(coords!.lng) > 0.000001)
  const marker = hasCoordinates ? `${coords!.lat},${coords!.lng}` : ''
  const osmBBox = hasCoordinates
    ? `${coords!.lng - 0.01},${coords!.lat - 0.01},${coords!.lng + 0.01},${coords!.lat + 0.01}`
    : ''
  const osmEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(osmBBox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`
    : ''
  const googleMapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${encodeURIComponent(marker)}` : ''

  const hasCompanyMeta =
    Boolean(company.address) ||
    Boolean(companyCreatedAt) ||
    phones.length > 0 ||
    emails.length > 0 ||
    sites.length > 0 ||
    hasCoordinates ||
    hasCompanyDescription

  if (!hasCompanyMeta) {
    return null
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="p-6">
        <h3 className="mb-6 text-sm font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">About Company</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {companyCreatedAt ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Created At
              </p>
              <p className="mt-2 text-sm font-semibold break-words text-gray-900 dark:text-white">{companyCreatedAt}</p>
            </div>
          ) : null}

          {phones.length ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Phones</p>
              <p className="mt-2 text-sm font-semibold break-words text-gray-900 dark:text-white">
                {phones.map((phone, index) => {
                  const href = normalizeSafeUrl(`tel:${phone}`)
                  return (
                    <span key={`phone-${phone}-${index}`}>
                      {index ? <span className="text-gray-400 dark:text-gray-500">, </span> : null}
                      {href ? (
                        <a href={href} className="text-blue-600 hover:underline dark:text-blue-300">
                          {phone}
                        </a>
                      ) : (
                        phone
                      )}
                    </span>
                  )
                })}
              </p>
            </div>
          ) : null}

          {emails.length ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Emails</p>
              <p className="mt-2 text-sm font-semibold break-words text-gray-900 dark:text-white">
                {emails.map((email, index) => {
                  const href = normalizeSafeUrl(`mailto:${email}`)
                  return (
                    <span key={`email-${email}-${index}`}>
                      {index ? <span className="text-gray-400 dark:text-gray-500">, </span> : null}
                      {href ? (
                        <a href={href} className="text-blue-600 hover:underline dark:text-blue-300">
                          {email}
                        </a>
                      ) : (
                        email
                      )}
                    </span>
                  )
                })}
              </p>
            </div>
          ) : null}

          {sites.length ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Sites</p>
              <p className="mt-2 text-sm font-semibold break-words text-gray-900 dark:text-white">
                {sites.map((site, index) => (
                  <span key={`site-${site.url}-${index}`}>
                    {index ? <span className="text-gray-400 dark:text-gray-500">, </span> : null}
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-300">
                      {site.label}
                    </a>
                  </span>
                ))}
              </p>
            </div>
          ) : null}

          {company.address ? (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4 md:col-span-2 dark:border-gray-700 dark:bg-gray-950/50">
              <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Address</p>
              <p className="mt-2 text-sm font-semibold break-words text-gray-900 dark:text-white">{company.address}</p>
            </div>
          ) : null}
        </div>

        {hasCoordinates ? (
          <div className="mt-5">
            <div className="h-64 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <iframe
                src={osmEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Company map"
              />
            </div>
            {googleMapsUrl ? (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-300">
                Open in Google Maps
              </a>
            ) : null}
          </div>
        ) : null}

        {hasCompanyDescription ? (
          companyDescriptionIsHtml ? (
            <div
              className="job-description mt-5 border-t border-gray-200 pt-5 text-base leading-relaxed text-gray-700 dark:border-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: companyDescriptionHtml }}
            />
          ) : (
            <p className="job-description mt-5 border-t border-gray-200 pt-5 text-base leading-relaxed whitespace-pre-line text-gray-700 dark:border-gray-700 dark:text-gray-300">
              {companyDescriptionHtml}
            </p>
          )
        ) : null}
      </div>
    </section>
  )
}

export default async function VacancyPage({ params }: VacancyPageProps) {
  const resolved = await Promise.resolve(params)
  const sourceParam = decodeParam(resolved.source)
  const slugParam = decodeParam(resolved.slug).trim()
  const normalizedSource = normalizeRouteSource(sourceParam)

  if (!normalizedSource || !slugParam) {
    notFound()
  }

  const detail = await getVacancyDetail(normalizedSource, slugParam)
  if (!detail) {
    notFound()
  }

  const requestHeaders = await headers()
  if (!isPrefetchRequest(requestHeaders)) {
    const visitorIp = getVisitorIpFromHeaders(requestHeaders)
    if (visitorIp) {
      await incrementVacancyVisitCounter({
        source: detail.source,
        vacancyId: detail.vacancyId,
        slug: detail.slug,
        visitorIp,
      })
    }
  }

  const descriptionHtml = sanitizeHtml(detail.descriptionHtml)
  const descriptionIsHtml = hasHtmlTags(descriptionHtml)
  const requirementsHtml = sanitizeHtml(detail.requirementsHtml)
  const requirementsIsHtml = hasHtmlTags(requirementsHtml)
  const benefits = detail.benefits.filter((item) => item.trim())
  const sourceLinks = detail.sourceLinks
    .map((entry) => ({ ...entry, url: normalizeSafeUrl(entry.url) }))
    .filter((entry) => entry.url)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* Sticky Header Wrapper */}
      <div className="relative z-[100] sm:sticky top-0 w-full shadow-sm">
        <div className="absolute inset-0 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#0f172a]/80" />
        <div className="relative container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-2 sm:!pb-4 !pt-3 sm:!pt-4"
            title="JobScan"
            subtitle="Vacancy Intelligence"
          />
        </div>
      </div>


      <div className="container mx-auto max-w-7xl grow px-4 py-8 lg:py-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 dark:hover:text-indigo-400"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hub
          </Link>

          {detail.isDuplicate ? (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-amber-900/30 dark:text-amber-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.334-.398-1.817a1 1 0 00-1.514-.857 7.028 7.028 0 00-2.73 5.154 4.635 4.635 0 001.222 3.296 4.645 4.645 0 00.318.308c.5.447 1.053.939 1.585 1.47 1.078 1.073 2.224 2.146 3.603 2.146a4.474 4.474 0 003.51-1.747 4.472 4.472 0 001.19-3.007c0-1.136-.212-2.17-.556-2.796a4.411 4.411 0 00-1.259-1.518c-.147-.113-.318-.23-.51-.358a1 1 0 00-1.263.15c-.242.238-.428.525-.567.8a1 1 0 001.766.947c.1-.2.204-.377.302-.512.166.113.338.252.5.39.426.362.805.811 1.042 1.238.243.438.38 1.07.38 1.81 0 1.135-.352 2.206-1.235 2.594-.598.262-1.235.034-1.77-.5a15.723 15.723 0 01-1.391-1.584c-.45-.58-.848-1.166-1.225-1.725-.378-.56-.693-1.071-.933-1.518-.112-.208-.204-.395-.278-.564.444-.453.935-.893 1.456-1.312.441-.355.885-.68 1.309-.968.455-.308.868-.54 1.189-.663A1 1 0 0012.395 2.553z" clipRule="evenodd" />
              </svg>
              {duplicateScoreLabel(detail.duplicateScore)}
            </div>
          ) : null}
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Main Content (Left) */}
          <div className="flex-1 space-y-8">
            <article className="overflow-hidden rounded-[2.5rem] border border-slate-300/60 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-none">
              {detail.source === 'jobsearch' && detail.company.cover ? (
                <div className="relative h-44 md:h-56 lg:h-64">
                  <img
                    src={detail.company.cover}
                    alt={`${detail.company.name} cover`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
                </div>
              ) : null}

              <div className="p-6 md:p-8">
                <h1 className="mb-6 text-2xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl dark:text-white">
                  {detail.title}
                </h1>

                <div className="mb-8 flex items-center gap-5">
                  {detail.company.logo ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                      <img
                        src={detail.company.logo}
                        alt={detail.company.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-2xl font-black text-indigo-600 uppercase dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {(detail.company.name.slice(0, 1) || 'U').toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{detail.company.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detail.sourceBadges.map((badge) => (
                        <div
                          key={`${badge.source}-${badge.label}`}
                          className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 dark:border-slate-700/50 dark:bg-slate-800/50"
                          title={badge.label}
                        >
                          <img src={badge.icon} className="h-3.5 w-3.5 rounded-sm" alt="" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {badge.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {detail.techStack.length ? (
                  <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800/50">
                    <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Essential Tech Stack</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {detail.techStack.map((tech) => (
                        <span
                          key={`tech-${tech}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>

            <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 md:p-10">
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Job Description
              </h2>
              <div className="job-description prose prose-slate max-w-none prose-sm sm:prose-base dark:prose-invert text-slate-600 dark:text-slate-400">
                {hasRenderableContent(descriptionHtml) ? (
                  descriptionIsHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">{descriptionHtml}</p>
                  )
                ) : (
                  <p className="italic text-slate-400 dark:text-slate-500">Description is not available.</p>
                )}
              </div>
            </section>

            {hasRenderableContent(requirementsHtml) ? (
              <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 md:p-10">
                <h2 className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  Requirements
                </h2>
                <div className="job-description prose prose-slate max-w-none prose-sm sm:prose-base dark:prose-invert text-slate-600 dark:text-slate-400">
                  {requirementsIsHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: requirementsHtml }} />
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">{requirementsHtml}</p>
                  )}
                </div>
              </section>
            ) : null}

            {benefits.length ? (
              <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 md:p-10">
                <h2 className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Benefits
                </h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 transition-all hover:bg-slate-50">
                      <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {sourceLinks.length ? (
              <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl shadow-indigo-500/10 dark:border-slate-700 dark:bg-[#0f172a]">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 dark:divide-slate-700">
                  {sourceLinks.map((link) => {
                    const trackedHref = buildTrackedClickUrl(link.source, detail.vacancyId, detail.slug, link.url)
                    return (
                      <a
                        key={`${link.source}-${link.url}`}
                        href={trackedHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-1 items-center justify-center gap-4 px-6 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/5 active:scale-95"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                          <img src={link.icon} className="h-5 w-5 rounded-sm brightness-110" alt="" />
                        </div>
                        <span>Quick Apply on {link.label}</span>
                      </a>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {/* Sidebar (Right) */}
          <aside className="sticky top-[108px] w-full space-y-8 lg:w-80">
            <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Job Details</h3>
              {renderInfoCards(detail)}
            </section>

            {renderCompanyMeta(detail)}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}
