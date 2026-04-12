import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

function renderInfoCards(detail: VacancyDetail) {
  const locationValue = String(detail.location ?? '').trim()
  const addressValue = String(detail.company.address ?? '').trim()
  const salaryValue = String(detail.salaryText ?? '').trim()
  const shouldHideLocation =
    Boolean(locationValue) &&
    Boolean(addressValue) &&
    normalizeTextForCompare(locationValue) === normalizeTextForCompare(addressValue)

  const infoEntries: Array<{ label: string; value: string; valueClass?: string }> = [
    { label: 'Posted', value: formatDateLabel(detail.postedAt) },
    { label: 'Deadline', value: formatDateLabel(detail.deadlineAt), valueClass: 'text-red-500 dark:text-red-400' },
    { label: 'Salary', value: salaryValue },
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
          className="rounded-xl border border-black/8 bg-white p-4 transition-colors hover:bg-[#f8f6f3] dark:border-white/8 dark:bg-white/6 dark:hover:bg-white/8"
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
    <section className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
      <div className="p-6">
        <h3 className="mb-6 text-sm font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">About Company</h3>

        <div className="flex flex-col gap-3">
          {companyCreatedAt ? (
            <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Created At
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{companyCreatedAt}</p>
            </div>
          ) : null}

          {phones.length ? (
            <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Phones</p>
              <div className="mt-2 flex flex-col gap-1.5 break-words text-sm font-semibold text-slate-900 dark:text-white">
                {phones.map((phone, index) => {
                  const href = normalizeSafeUrl(`tel:${phone}`)
                  return (
                    <span key={`phone-${phone}-${index}`}>
                      {href ? (
                        <a href={href} className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">
                          {phone}
                        </a>
                      ) : (
                        phone
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          ) : null}

          {emails.length ? (
            <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Emails</p>
              <div className="mt-2 flex flex-col gap-1.5 break-words text-sm font-semibold text-slate-900 dark:text-white">
                {emails.map((email, index) => {
                  const href = normalizeSafeUrl(`mailto:${email}`)
                  return (
                    <span key={`email-${email}-${index}`}>
                      {href ? (
                        <a href={href} className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">
                          {email}
                        </a>
                      ) : (
                        email
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          ) : null}

          {sites.length ? (
            <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Sites</p>
              <div className="mt-2 flex flex-col gap-1.5 break-words text-sm font-semibold text-slate-900 dark:text-white">
                {sites.map((site, index) => (
                  <span key={`site-${site.url}-${index}`}>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">
                      {site.label}
                    </a>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {company.address ? (
            <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">Address</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{company.address}</p>
            </div>
          ) : null}
        </div>

        {hasCoordinates ? (
          <div className="mt-5">
            <div className="h-64 w-full overflow-hidden rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] dark:border-white/8 dark:bg-white/6">
              <iframe
                src={osmEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Company map"
              />
            </div>
            {googleMapsUrl ? (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">
                Open in Google Maps
              </a>
            ) : null}
          </div>
        ) : null}

        {hasCompanyDescription ? (
          companyDescriptionIsHtml ? (
            <div
              className="job-description mt-5 border-t border-black/8 pt-5 text-base leading-relaxed text-slate-700 dark:border-white/8 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: companyDescriptionHtml }}
            />
          ) : (
            <p className="job-description mt-5 whitespace-pre-line border-t border-black/8 pt-5 text-base leading-relaxed text-slate-700 dark:border-white/8 dark:text-slate-300">
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
    <main className="relative mx-auto flex max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <section className="px-0 py-2 transition-colors duration-300 sm:p-4">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[0.85rem] border border-black/8 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-[#f8f6f3] hover:text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-[#d7b37a]"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hub
          </Link>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Main Content (Left) */}
          <div className="flex-1 space-y-8">
            <article className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
              {detail.source === 'jobsearch' && detail.company.cover ? (
                <div className="relative h-44 md:h-56 lg:h-64">
                  <Image
                    src={detail.company.cover}
                    alt={`${detail.company.name} cover`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 896px, 896px"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                </div>
              ) : null}

              <div className="p-6 md:p-8">
                <h1 className="mb-6 text-2xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl dark:text-white">
                  {detail.title}
                </h1>

                <div className="mb-8 flex items-center gap-5">
                  {detail.company.logo ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-2 dark:border-white/8 dark:bg-white/6">
                      <Image
                        src={detail.company.logo}
                        alt={detail.company.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[0.85rem] border border-indigo-100 bg-indigo-50 text-2xl font-black uppercase text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {(detail.company.name.slice(0, 1) || 'U').toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{detail.company.name}</h2>
                  </div>
                </div>

                {detail.techStack.length ? (
                  <div className="mt-8 border-t border-black/8 pt-8 dark:border-white/8">
                    <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Essential Tech Stack</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {detail.techStack.map((tech) => (
                        <span
                          key={`tech-${tech}`}
                          className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 transition-colors hover:bg-white dark:border-white/8 dark:bg-white/6 dark:text-slate-400 dark:hover:bg-white/10"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>

            <section className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white p-8 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] md:p-10">
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
              <section className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white p-8 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] md:p-10">
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
              <section className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white p-8 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] md:p-10">
                <h2 className="mb-8 flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Benefits
                </h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 text-sm font-bold text-slate-700 transition-colors hover:bg-white dark:border-white/8 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/10">
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
              <section className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#151515] transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
                <div className="divide-y divide-white/8 md:flex md:flex-row md:divide-x md:divide-y-0">
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
                          <Image src={link.icon} className="h-5 w-5 rounded-sm brightness-110" alt="" width={20} height={20} unoptimized />
                        </div>
                        <span className="transition-colors group-hover:text-[#d7b37a]">Quick Apply on {link.label}</span>
                      </a>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {/* Sidebar (Right) */}
          <aside className="sticky top-[108px] w-full space-y-8 lg:w-80">
            <section className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
              <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Job Details</h3>
              {renderInfoCards(detail)}
            </section>

            {renderCompanyMeta(detail)}
          </aside>
        </div>
        </section>
    </main>
  )
}
