import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getVacancyDetail, normalizeRouteSource, type VacancyDetail } from '@/lib/vacancy-detail-data'

export const dynamic = 'force-dynamic'

type VacancyPageParams = {
  source: string
  slug: string
}

type VacancyPageProps = {
  params: VacancyPageParams | Promise<VacancyPageParams>
}

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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {infoEntries.map((entry) => (
        <div
          key={`${entry.label}-${entry.value}`}
          className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
        >
          <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            {entry.label}
          </p>
          <p className={`text-sm font-medium break-words text-gray-900 dark:text-gray-100 ${entry.valueClass ?? ''}`}>
            {entry.value}
          </p>
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
    <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/80">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-teal-500 to-orange-400" />
      <div className="p-4 md:p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">About Company</h3>

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

  const descriptionHtml = sanitizeHtml(detail.descriptionHtml)
  const descriptionIsHtml = hasHtmlTags(descriptionHtml)
  const requirementsHtml = sanitizeHtml(detail.requirementsHtml)
  const requirementsIsHtml = hasHtmlTags(requirementsHtml)
  const benefits = detail.benefits.filter((item) => item.trim())
  const sourceLinks = detail.sourceLinks
    .map((entry) => ({ ...entry, url: normalizeSafeUrl(entry.url) }))
    .filter((entry) => entry.url)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v4H4v-4zm10 0h6v4h-6v-4z"
              />
            </svg>
            Back to Dashboard
          </Link>

          {detail.isDuplicate ? (
            <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {duplicateScoreLabel(detail.duplicateScore)}
            </span>
          ) : null}
        </header>

        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
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
            <h1 className="mb-4 text-2xl leading-tight font-bold break-words text-gray-900 md:text-3xl dark:text-white">
              {detail.title}
            </h1>

            <div className="mb-6 flex items-center gap-4">
              {detail.company.logo ? (
                <img
                  src={detail.company.logo}
                  alt={detail.company.name}
                  className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-1 object-contain md:h-16 md:w-16 dark:border-gray-600"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-100 text-xl font-bold text-blue-600 uppercase md:h-16 md:w-16 md:text-2xl dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {(detail.company.name.slice(0, 1) || 'U').toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold break-words text-gray-800 md:text-xl dark:text-gray-100">{detail.company.name}</h2>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.sourceBadges.map((badge) => (
                    <div
                      key={`${badge.source}-${badge.label}`}
                      className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700/50"
                      title={badge.label}
                    >
                      <img src={badge.icon} className="h-3.5 w-3.5 rounded-sm" alt="" />
                      <span className="hidden text-[10px] font-medium text-gray-500 sm:inline dark:text-gray-400">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {renderInfoCards(detail)}

            {detail.techStack.length ? (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.techStack.map((tech) => (
                    <span
                      key={`tech-${tech}`}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {renderCompanyMeta(detail)}
          </div>
        </article>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-8">
          <h2 className="mb-6 border-b border-gray-200 pb-4 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
            Job Description
          </h2>

          <div className="job-description text-base leading-relaxed break-words text-gray-700 dark:text-gray-300">
            {hasRenderableContent(descriptionHtml) ? (
              descriptionIsHtml ? (
                <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
              ) : (
                <p className="whitespace-pre-line">{descriptionHtml}</p>
              )
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Description is not available.</p>
            )}
          </div>
        </section>

        {hasRenderableContent(requirementsHtml) ? (
          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-8">
            <h2 className="mb-6 border-b border-gray-200 pb-4 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              Requirements
            </h2>
            <div
              className="job-description text-base leading-relaxed break-words text-gray-700 dark:text-gray-300"
            >
              {requirementsIsHtml ? (
                <div dangerouslySetInnerHTML={{ __html: requirementsHtml }} />
              ) : (
                <p className="whitespace-pre-line">{requirementsHtml}</p>
              )}
            </div>
          </section>
        ) : null}

        {benefits.length ? (
          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-8">
            <h2 className="mb-6 border-b border-gray-200 pb-4 text-xl font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              Benefits
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {sourceLinks.length ? (
          <section className="mt-8 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-col md:flex-row">
              {sourceLinks.map((link, index) => (
                <a
                  key={`${link.source}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex flex-1 items-center justify-center gap-3 px-8 py-5 text-base font-bold text-white transition-all hover:bg-white/10 active:opacity-90 ${
                    index < sourceLinks.length - 1 ? 'border-b border-gray-800 md:border-r md:border-b-0 dark:border-gray-700' : ''
                  }`}
                >
                  <img src={link.icon} className="h-6 w-6 rounded-sm brightness-125" alt="" />
                  <span>Apply on {link.label}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
