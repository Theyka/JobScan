/* eslint-disable @next/next/no-img-element */
import { memo, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

import type { LandingJob } from '@/lib/datatypes/landing-data.types'
import type { PageSizeOption } from '@/lib/datatypes/landing-page.types'

type SortOption = 'latest' | 'oldest' | 'salary-desc' | 'salary-asc' | 'company-asc'

const SORT_OPTIONS: Array<{ value: SortOption; label: string; hint: string }> = [
  { value: 'latest', label: 'Latest updated', hint: 'Newest listings first' },
  { value: 'oldest', label: 'Oldest first', hint: 'Earlier listings first' },
  { value: 'salary-desc', label: 'Salary high to low', hint: 'Highest salary first' },
  { value: 'salary-asc', label: 'Salary low to high', hint: 'Lowest salary first' },
  { value: 'company-asc', label: 'Company A-Z', hint: 'Alphabetical by company' },
]

type JobsSectionProps = {
  filteredJobs: LandingJob[]
  pageJobs: LandingJob[]
  activeTech: string | null
  normalizedSearch: string
  search: string
  onSearchChange: (value: string) => void
  onOpenMobileFilters: () => void
  pageSizeOptions: PageSizeOption[]
  itemsPerPage: PageSizeOption
  isSelectOpen: boolean
  onTogglePageSizeMenu: () => void
  onSetPageSize: (value: PageSizeOption) => void
  selectRef: RefObject<HTMLDivElement | null>
  safeCurrentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  favoriteVacancyIds?: Set<string>
  onToggleFavorite?: (source: string, vacancyId: number) => void
}

function formatCardDate(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value || 'Recently added'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function hasVacancyDatePassed(value: string): boolean {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return false
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    parsed.setHours(23, 59, 59, 999)
  }

  return parsed.getTime() < Date.now()
}

function buildResultsLabel(activeTech: string | null, normalizedSearch: string): string {
  if (normalizedSearch) {
    return `Results for “${normalizedSearch}”`
  }

  if (activeTech) {
    return `${activeTech} roles`
  }

  return 'Curated opportunities updated daily'
}

function JobsSection({
  filteredJobs,
  pageJobs,
  activeTech,
  normalizedSearch,
  search,
  onSearchChange,
  onOpenMobileFilters,
  pageSizeOptions,
  itemsPerPage,
  isSelectOpen,
  onTogglePageSizeMenu,
  onSetPageSize,
  selectRef,
  safeCurrentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  sortBy,
  onSortChange,
  favoriteVacancyIds,
  onToggleFavorite,
}: JobsSectionProps) {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement | null>(null)
  const activeSort = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0]

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-0 py-4 text-slate-900 transition-colors duration-300 dark:border-white/8 dark:bg-white/3 dark:text-white sm:px-5 sm:py-6">
      <div className="lg:hidden">
        <div className="rounded-xl border border-black/8 bg-[#151515] px-4 py-4 text-white">
          <p className="corporate-kicker text-white/58!">Search</p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Title, company, or technology"
                className="h-13 w-full rounded-full border border-white/10 bg-white/6 px-5 pl-12 text-sm text-white outline-none placeholder:text-white/34 focus:border-white/20"
              />
            </label>
            <button
              type="button"
              onClick={onOpenMobileFilters}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white text-[11px] font-semibold uppercase tracking-[0.18em] text-[#151515]"
            >
              Open filters
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5 border-b border-black/6 pb-5 dark:border-white/8 sm:mt-0 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[#161616] dark:text-white">
              Jobs
            </h2>
            <span className="inline-flex h-10 items-center rounded-full border border-black/8 bg-[#f8f6f3] px-4 text-sm font-semibold text-[#161616] dark:border-white/10 dark:bg-white/6 dark:text-white">
              {filteredJobs.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-black/52 dark:text-white/50">{buildResultsLabel(activeTech, normalizedSearch)}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div ref={sortMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortMenuOpen((open) => !open)}
              className="group inline-flex h-10 min-w-43 items-center justify-between gap-2.5 rounded-lg border border-black/10 bg-[#f7f6f4] px-3.5 text-left hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:hover:border-white/18 dark:hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={isSortMenuOpen}
            >
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#151515] dark:text-white">
                <span className="mr-1.5 text-[10px] uppercase tracking-[0.16em] text-black/42 dark:text-white/40">Sort</span>
                {activeSort.label}
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white text-black/56 transition group-hover:border-black/12 group-hover:text-black dark:border-white/10 dark:bg-white/8 dark:text-white/58 dark:group-hover:text-white">
                <svg className={`h-3 w-3 transition-transform duration-200 ${isSortMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <div
              className={`absolute right-0 top-full z-70 mt-2.5 w-56 origin-top-right rounded-lg border border-black/10 bg-white p-1.5 transition-all duration-200 dark:border-white/10 dark:bg-[#151515] ${
                isSortMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
              role="menu"
            >
              {SORT_OPTIONS.map((option) => {
                const isActive = option.value === sortBy

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSortChange(option.value)
                      setIsSortMenuOpen(false)
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      isActive
                        ? 'bg-[#f7efe5] text-[#151515] dark:bg-white dark:text-[#151515]'
                        : 'text-black/68 hover:bg-[#f8f6f3] hover:text-black dark:text-white/72 dark:hover:bg-white/8 dark:hover:text-white'
                    }`}
                    role="menuitem"
                  >
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold">{option.label}</span>
                      <span className={`mt-0.5 block text-[10px] ${isActive ? 'text-black/54' : 'text-black/44 dark:text-white/42'}`}>
                        {option.hint}
                      </span>
                    </span>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {isActive ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {pageJobs.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {pageJobs.map((job) => {
              const jobSlug = String(job.slug ?? '').trim()
              const routeSource = job.source === 'glorri' ? 'glorri' : 'jobsearch'
              const internalDetailPath = jobSlug ? `/vacancies/${routeSource}/${encodeURIComponent(jobSlug)}` : ''
              const href = internalDetailPath || job.detail_url || '#'
              const isExternalDetail = !internalDetailPath && Boolean(job.detail_url)
              const visibleTechnologies = job.technologies.slice(0, 3)
              const remainingTechnologies = Math.max(job.technologies.length - visibleTechnologies.length, 0)
              const hasSalary = Boolean(job.salary && job.salary !== 'Not specified')
              const isExpired = hasVacancyDatePassed(job.deadline_at)
              const favoriteKey = `${job.source === 'glorri' ? 'glorri' : 'jobsearch'}-${job.id}`
              const isFavorite = favoriteVacancyIds?.has(favoriteKey) ?? false

              return (
                <a
                  key={job.uid}
                  href={href}
                  target={isExternalDetail ? '_blank' : undefined}
                  rel={isExternalDetail ? 'noopener noreferrer' : undefined}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(17,17,17,0.08)] dark:hover:shadow-none ${
                    isExpired
                      ? 'border-red-300 bg-red-50/90 hover:border-red-400 dark:border-red-500/35 dark:bg-red-950/20 dark:hover:border-red-400/60'
                      : 'border-black/8 bg-[#fcfbfa] hover:border-[#b69263]/45 dark:border-white/8 dark:bg-[#151515] dark:hover:border-[#b69263]/45'
                  }`}
                >
                  <div className="relative mb-5 flex items-start justify-between gap-4">
                    <h3
                      className={`flex-1 text-[1rem] leading-tight font-semibold tracking-[-0.03em] wrap-break-word transition-colors sm:text-[1.05rem] ${
                        isExpired
                          ? 'text-red-900 group-hover:text-red-700 dark:text-red-100 dark:group-hover:text-red-300'
                          : 'text-[#161616] group-hover:text-[#8a6a43] dark:text-white dark:group-hover:text-[#d7b37a]'
                      }`}
                    >
                      {job.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {onToggleFavorite ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onToggleFavorite(job.source, job.id)
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                            isFavorite
                              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                              : 'border-black/8 bg-white text-black/30 hover:border-red-200 hover:bg-red-50 hover:text-red-400 dark:border-white/10 dark:bg-white/8 dark:text-white/30 dark:hover:border-red-500/30 dark:hover:text-red-400'
                          }`}
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      ) : null}
                      <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isExpired
                          ? 'border-red-200 bg-white text-red-500 group-hover:border-red-300 group-hover:text-red-600 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300 dark:group-hover:text-red-200'
                          : 'border-black/8 bg-white text-black/52 group-hover:border-[#b69263]/35 group-hover:text-[#8a6a43] dark:border-white/10 dark:bg-white/8 dark:text-white/62 dark:group-hover:text-[#d7b37a]'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    </div>
                  </div>

                  <div className="relative mb-5 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-1.5 transition-colors ${
                        isExpired
                          ? 'border-red-200 bg-white group-hover:bg-red-100 dark:border-red-500/25 dark:bg-red-900/20 dark:group-hover:bg-red-900/30'
                          : 'border-black/8 bg-[#f8f6f3] group-hover:bg-white dark:border-white/10 dark:bg-white/6 dark:group-hover:bg-white/10'
                      }`}
                    >
                      {job.company_logo ? (
                        <img src={job.company_logo} alt={job.company} className="h-full w-full object-contain" />
                      ) : (
                        <span className={`text-sm font-semibold ${isExpired ? 'text-red-700 dark:text-red-200' : 'text-black/60 dark:text-white/60'}`}>{job.company.slice(0, 1) || 'C'}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-semibold leading-4 wrap-break-word ${isExpired ? 'text-red-900 dark:text-red-100' : 'text-[#161616] dark:text-white'}`}>
                        {job.company}
                      </p>
                      <p
                        className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          isExpired ? 'text-red-600 dark:text-red-400' : 'text-black/40 dark:text-white/42'
                        }`}
                        title={isExpired ? `Expired on ${formatCardDate(job.deadline_at)}` : undefined}
                      >
                        {formatCardDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-5 mt-auto flex flex-wrap gap-2">
                    {visibleTechnologies.map((tech) => (
                      <span
                        key={`${job.uid}-${tech}`}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] transition-colors ${
                          isExpired
                            ? 'border-red-200 bg-white text-red-700 group-hover:bg-red-100 dark:border-red-500/25 dark:bg-red-900/20 dark:text-red-200 dark:group-hover:bg-red-900/30'
                            : 'border-black/10 bg-[#f8f6f3] text-black/58 group-hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white/62 dark:group-hover:bg-white/10'
                        }`}
                        title={tech}
                      >
                        {tech}
                      </span>
                    ))}

                    {remainingTechnologies > 0 ? (
                      <span
                        className={`flex items-center justify-center rounded-lg px-2.5 text-[10px] font-semibold tracking-[0.04em] transition-colors ${
                          isExpired
                            ? 'bg-red-100 text-red-600 group-hover:bg-red-200 group-hover:text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:group-hover:bg-red-900/30 dark:group-hover:text-red-200'
                            : 'bg-[#f1ede7] text-black/44 group-hover:bg-white group-hover:text-black/60 dark:bg-white/6 dark:text-white/48 dark:group-hover:bg-white/10 dark:group-hover:text-white/72'
                        }`}
                      >
                        +{remainingTechnologies}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className={`relative flex items-center justify-between border-t pt-4 transition-colors ${
                      isExpired
                        ? 'border-red-200 group-hover:border-red-300 dark:border-red-500/20 dark:group-hover:border-red-500/35'
                        : 'border-black/6 group-hover:border-black/10 dark:border-white/8 dark:group-hover:border-white/12'
                    }`}
                  >
                    {hasSalary ? (
                      <div className="min-w-0 pr-3">
                        <p className={`text-sm font-semibold ${isExpired ? 'text-red-900 dark:text-red-100' : 'text-[#161616] dark:text-white'}`}>{job.salary}</p>
                      </div>
                    ) : <span />}

                    {isExpired ? (
                      <span className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-all group-hover:bg-red-700 dark:bg-red-500 dark:text-white dark:group-hover:bg-red-400">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex h-9 items-center rounded-lg bg-[#151515] px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-all group-hover:bg-[#8a6a43] dark:bg-white dark:text-[#151515] dark:group-hover:bg-[#d7b37a]">
                        Details
                      </span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-[#f8f6f3] py-24 dark:border-white/8 dark:bg-white/4">
            <p className="text-sm text-black/50 dark:text-white/50">No vacancies matched this view</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <div ref={selectRef} className="relative shrink-0">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTogglePageSizeMenu()
            }}
            className="inline-flex h-10 w-30 items-center justify-between rounded-lg border border-black/10 bg-[#f8f6f3] px-3.5 text-[12px] font-semibold text-[#151515] hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:border-white/18 dark:hover:bg-white/10 sm:min-w-43 sm:w-auto"
          >
            <span>
              <span className="mr-1.5 text-[10px] uppercase tracking-[0.16em] text-black/42 dark:text-white/40">Show</span>
              {itemsPerPage}
              <span className="hidden sm:inline"> entries</span>
            </span>
            <svg className={`h-3 w-3 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`absolute bottom-full left-0 z-70 mb-3 w-full origin-bottom rounded-lg border border-black/10 bg-white p-2 transition-all duration-200 dark:border-white/10 dark:bg-[#151515] ${
              isSelectOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
            }`}
          >
            {pageSizeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSetPageSize(option)}
                className="flex w-full items-center rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/62 hover:bg-[#f8f6f3] hover:text-black dark:text-white/68 dark:hover:bg-white/8 dark:hover:text-white"
              >
                {option} entries
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-lg border border-black/10 bg-[#f8f6f3] p-0 dark:border-white/10 dark:bg-white/6 sm:flex-initial sm:justify-normal sm:gap-2">
          <button
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={onPrevPage}
            className="inline-flex h-10 items-center rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/62 hover:bg-white hover:text-black disabled:opacity-35 dark:text-white/68 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Prev
          </button>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#151515] dark:text-white">
            {safeCurrentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={onNextPage}
            className="inline-flex h-10 items-center rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/62 hover:bg-white hover:text-black disabled:opacity-35 dark:text-white/68 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

export default memo(JobsSection)
