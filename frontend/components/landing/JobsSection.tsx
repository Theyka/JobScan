import type { RefObject } from 'react'

import type { LandingJob } from '@/lib/datatypes/landing-data.types'
import type { PageSizeOption } from '@/lib/datatypes/landing-page.types'

type JobsSectionProps = {
  filteredJobs: LandingJob[]
  pageJobs: LandingJob[]
  activeFilterParts: string[]
  clearFilter: () => void
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
}

export default function JobsSection({
  filteredJobs,
  pageJobs,
  activeFilterParts,
  clearFilter,
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
}: JobsSectionProps) {
  return (
    <div className="mt-10">
      {/* Mobile Search - Redesigned */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 lg:hidden">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Search</h2>
        </div>

        <div className="relative group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Title, company, or tech..."
            className="w-full h-14 rounded-2xl border border-slate-200 bg-slate-50 px-6 pl-14 text-sm font-bold text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-500/50"
          />
        </div>

        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-indigo-200 bg-indigo-50/30 px-4 py-4 text-xs font-black uppercase tracking-widest text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 active:scale-95 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="truncate">Show Companies & Techs Filters</span>
        </button>

      </div>

      <div className="mb-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Jobs ({new Intl.NumberFormat('en-US').format(filteredJobs.length)})</h2>
          </div>

          <div
            className={`items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 ${activeFilterParts.length ? 'flex' : 'hidden'
              }`}
          >
            <span>{activeFilterParts.join(' • ')}</span>
            <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-500/20" />
            <button
              type="button"
              onClick={clearFilter}
              className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-100 transition-colors hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pageJobs.length ? (
            pageJobs.map((job) => {
              const jobSlug = String(job.slug ?? '').trim()
              const routeSource = job.source === 'glorri' ? 'glorri' : 'jobsearch'
              const internalDetailPath = jobSlug ? `/vacancies/${routeSource}/${encodeURIComponent(jobSlug)}` : ''
              const href = internalDetailPath || job.detail_url || '#'
              const isExternalDetail = !internalDetailPath && Boolean(job.detail_url)

              return (
                <a
                  key={job.uid}
                  href={href}
                  target={isExternalDetail ? '_blank' : undefined}
                  rel={isExternalDetail ? 'noopener noreferrer' : undefined}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-300/60 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-indigo-500/50"
                >
                  <div className="relative mb-5 flex items-start justify-between">
                    <h3 className="line-clamp-2 min-h-[3rem] text-lg font-black leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {job.title}
                    </h3>
                  </div>

                  <div className="relative mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-1.5 shadow-sm transition-all group-hover:bg-white dark:border-slate-800 dark:bg-slate-900">
                      {job.company_logo ? (
                        <img src={job.company_logo} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">{job.company}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{job.created_at}</span>
                    </div>
                  </div>

                  <div className="relative mb-6 mt-auto flex flex-wrap gap-2">
                    {job.technologies.slice(0, 4).map((tech) => {
                      const isActive =
                        (activeTech && tech.toLowerCase() === activeTech.toLowerCase()) ||
                        (normalizedSearch && tech.toLowerCase().includes(normalizedSearch))

                      return (
                        <span
                          key={`${job.uid}-${tech}`}
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${isActive
                            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-500/20'
                            : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:group-hover:bg-slate-700'
                            }`}
                        >
                          {tech}
                        </span>
                      )
                    })}
                    {job.technologies.length > 4 && (
                      <span className="flex items-center justify-center rounded-lg bg-slate-50 px-2 text-[10px] font-black tracking-tighter text-slate-400 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700">
                        +{job.technologies.length - 4}
                      </span>
                    )}

                  </div>

                  <div className="relative flex items-center justify-between border-t border-slate-50 pt-5 transition-colors group-hover:border-slate-100 dark:border-slate-800/50">
                    <div className="flex gap-2">
                      {job.sources.map((source) => (
                        <div key={`${job.uid}-${source.key}`} className="relative h-6 w-6 rounded-lg border border-slate-100 bg-white p-1 shadow-sm transition-transform group-hover:scale-110 dark:border-slate-800 dark:bg-slate-900">
                          <img src={source.icon} className="h-full w-full object-contain" alt="" title={source.name} />
                        </div>
                      ))}
                    </div>
                    <span className="flex h-9 items-center rounded-xl bg-indigo-600 px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-indigo-700 group-hover:shadow-lg group-hover:shadow-indigo-500/20 active:scale-95">
                      Details
                    </span>
                  </div>
                </a>
              )
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800/30">
              <p className="text-xs font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">Null Results Found</p>
            </div>
          )}
        </div>

        {/* Pagination - Redesigned */}
        <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <div ref={selectRef} className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onTogglePageSizeMenu()
              }}
              className="group flex h-14 min-w-[10rem] items-center justify-between rounded-2xl border border-slate-300/60 bg-white px-6 shadow-sm transition-all hover:border-indigo-500/30 hover:ring-4 hover:ring-indigo-500/5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Show</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{itemsPerPage}</span>
              </div>
              <svg className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`absolute bottom-full left-0 z-[70] mb-3 w-full origin-bottom rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${isSelectOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}>
              {pageSizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSetPageSize(option)}
                  className="flex w-full items-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                >
                  {option} Entries
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-300/60 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={onPrevPage}
              className="flex h-full items-center rounded-xl bg-slate-50 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Prev
            </button>
            <div className="flex h-full items-center px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {safeCurrentPage} / {totalPages}
              </span>
            </div>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={onNextPage}
              className="flex h-full items-center rounded-xl bg-slate-50 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
