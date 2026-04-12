import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getCompanyDetail, getCompanyVacancies } from '@/lib/company-detail-data'
import type { LandingJob } from '@/lib/datatypes/landing-data.types'

function formatCardDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value || 'Recently added'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

function normalizeSafeUrl(url: string): string {
  const raw = String(url ?? '').trim()
  if (!raw || /^javascript:/i.test(raw)) return ''
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
  if (/^www\./i.test(raw)) return `https://${raw}`
  return ''
}

function VacancyCard({ job }: { job: LandingJob }) {
  return (
    <Link
      href={job.detail_url}
      className="flex items-center gap-4 rounded-[0.85rem] border border-black/8 bg-white p-4 transition-colors hover:border-black/14 hover:bg-[#f8f6f3] dark:border-white/8 dark:bg-white/4 dark:hover:border-white/14 dark:hover:bg-white/8"
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{job.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {job.salary && job.salary !== 'Not specified' ? (
            <span className="font-semibold text-[#8a6a43] dark:text-[#d7b37a]">{job.salary}</span>
          ) : null}
          <span>{formatCardDate(job.created_at)}</span>
        </div>
        {job.technologies.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.technologies.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-black/6 bg-[#f8f6f3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-white/8 dark:bg-white/6 dark:text-slate-400"
              >
                {tech}
              </span>
            ))}
            {job.technologies.length > 5 ? (
              <span className="px-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                +{job.technologies.length - 5}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <svg className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

type PageProps = {
  params: Promise<{ source: string; slug: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const resolved = await Promise.resolve(params)
  const source = decodeURIComponent(resolved.source)
  const slug = decodeURIComponent(resolved.slug)

  if (source !== 'jobsearch' && source !== 'glorri') {
    notFound()
  }

  const detail = await getCompanyDetail(source, slug)
  if (!detail) {
    notFound()
  }

  const vacancies = await getCompanyVacancies(source, detail.companyId)

  return (
    <main className="relative mx-auto flex max-w-345 grow flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/companies"
            className="inline-flex h-11 items-center gap-2 rounded-[0.85rem] border border-black/8 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-[#f8f6f3] hover:text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-[#d7b37a]"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Companies
          </Link>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Company Header Card */}
            <article className="overflow-hidden rounded-3xl border border-black/8 bg-white transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
              {detail.cover ? (
                <div className="relative h-44 md:h-56">
                  <Image
                    src={detail.cover}
                    alt={`${detail.name} cover`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                </div>
              ) : null}

              <div className="p-6 md:p-8">
                <div className="flex items-center gap-5">
                  {detail.logo ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-2 dark:border-white/8 dark:bg-white/6">
                      <Image
                        src={detail.logo}
                        alt={detail.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[0.85rem] border border-indigo-100 bg-indigo-50 text-3xl font-black uppercase text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                      {(detail.name.charAt(0) || 'C').toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl dark:text-white">
                      {detail.name}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {detail.vacancyCount} open {detail.vacancyCount === 1 ? 'vacancy' : 'vacancies'}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Vacancies List */}
            <section className="overflow-hidden rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] md:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Open Positions ({vacancies.length})
              </h2>

              {vacancies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {vacancies.map((job) => (
                    <VacancyCard key={job.uid} job={job} />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No open positions at this time.
                </p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="sticky top-27 w-full space-y-8 lg:w-80">
            {(detail.address || detail.phones.length > 0 || detail.emails.length > 0 || detail.sites.length > 0) ? (
              <section className="overflow-hidden rounded-3xl border border-black/8 bg-white transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
                <div className="p-6">
                  <h3 className="mb-6 text-sm font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                    Company Info
                  </h3>

                  <div className="flex flex-col gap-3">
                    {detail.phones.length > 0 ? (
                      <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
                        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Phones
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                          {detail.phones.map((phone, i) => {
                            const href = normalizeSafeUrl(`tel:${phone}`)
                            return (
                              <span key={`phone-${i}`}>
                                {href ? (
                                  <a href={href} className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">{phone}</a>
                                ) : phone}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {detail.emails.length > 0 ? (
                      <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
                        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Emails
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                          {detail.emails.map((email, i) => {
                            const href = normalizeSafeUrl(`mailto:${email}`)
                            return (
                              <span key={`email-${i}`}>
                                {href ? (
                                  <a href={href} className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">{email}</a>
                                ) : email}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {detail.sites.length > 0 ? (
                      <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
                        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Websites
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                          {detail.sites.map((site, i) => (
                            <span key={`site-${i}`}>
                              <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-[#8a6a43] transition-colors hover:underline dark:text-[#d7b37a]">
                                {site.label}
                              </a>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {detail.address ? (
                      <div className="rounded-[0.85rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
                        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                          Address
                        </p>
                        <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-900 dark:text-white">{detail.address}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {/* Source badge */}
            <section className="overflow-hidden rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
              <h3 className="mb-4 text-sm font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                Source
              </h3>
              <span className="inline-flex items-center rounded-lg border border-black/8 bg-[#f8f6f3] px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:border-white/8 dark:bg-white/6 dark:text-slate-300">
                {detail.source === 'jobsearch' ? 'JobSearch.az' : 'Glorri'}
              </span>
            </section>
          </aside>
        </div>
    </main>
  )
}
