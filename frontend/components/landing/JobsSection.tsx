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
    <>
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:hidden">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <span className="rounded-lg bg-gray-100 p-1 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          Search
        </h2>
        <div className="relative">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Title, company, or tech..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-4 pl-10 text-gray-900 transition-all placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="mb-8 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Show Companies &amp; Techs Filters
        </button>
      </div>

      <div className="mb-12 border-t border-gray-200 pt-8 dark:border-gray-700">
        <div className="mb-6 flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs ({filteredJobs.length})</h2>
          <div
            className={`items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ${
              activeFilterParts.length ? 'flex' : 'hidden'
            }`}
          >
            <span className="mr-2">{activeFilterParts.join(' | ')}</span>
            <button
              type="button"
              onClick={clearFilter}
              className="text-lg leading-none hover:text-blue-800 focus:outline-none dark:hover:text-blue-200"
            >
              &times;
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
                  className="group flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700 dark:hover:bg-gray-700"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3
                      className="line-clamp-2-custom text-lg leading-tight font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
                      title={job.title}
                    >
                      {job.title}
                    </h3>
                    <span className="ml-3 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-500 transition-colors group-hover:bg-white group-hover:text-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-gray-600 dark:group-hover:text-gray-200">
                      {job.created_at}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {job.company_logo ? (
                      <img
                        src={job.company_logo}
                        alt=""
                        className="h-6 w-6 rounded-md border border-gray-100 bg-white p-0.5 object-contain"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="truncate">{job.company}</span>
                  </div>

                  <div className="mb-3 mt-auto flex flex-wrap gap-2">
                    {job.technologies.slice(0, 5).map((tech) => {
                      const isActive =
                        (activeTech && tech.toLowerCase() === activeTech.toLowerCase()) ||
                        (normalizedSearch && tech.toLowerCase().includes(normalizedSearch))

                      return (
                        <span
                          key={`${job.uid}-${tech}`}
                          className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? 'border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200'
                              : 'border-gray-200 bg-gray-100 text-gray-600 transition-colors group-hover:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600'
                          }`}
                        >
                          {tech}
                        </span>
                      )
                    })}
                    {job.technologies.length > 5 ? (
                      <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        +{job.technologies.length - 5}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400 transition-colors group-hover:border-gray-200 dark:border-gray-700 dark:text-gray-500 dark:group-hover:border-gray-600">
                    <div className="flex max-w-[70%] flex-wrap gap-1.5">
                      {job.sources.map((source) => (
                        <div
                          key={`${job.uid}-${source.key}`}
                          className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2 py-1 dark:border-gray-600 dark:bg-gray-700/50"
                          title={source.name}
                        >
                          <img src={source.icon} className="h-3.5 w-3.5 rounded-sm" alt="" />
                          <span className="hidden text-[10px] font-medium text-gray-500 sm:inline dark:text-gray-400">
                            {source.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="inline-block rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium whitespace-nowrap text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                      Details
                    </span>
                  </div>
                </a>
              )
            })
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
              No jobs match your filters.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <div ref={selectRef} className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onTogglePageSizeMenu()
              }}
              className="group flex h-11 min-w-32.5 cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 shadow-sm transition-all hover:ring-2 hover:ring-blue-300 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:ring-blue-800"
            >
              <div className="pointer-events-none flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase dark:text-gray-400">
                  Show
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">{itemsPerPage}</span>
              </div>
              <div className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-lg bg-gray-50 transition-colors group-hover:bg-blue-50 dark:bg-gray-700/50 dark:group-hover:bg-blue-900/30">
                <svg
                  className="h-3 w-3 text-gray-400 transition-colors group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <div
              className={`custom-scrollbar absolute bottom-full left-0 z-60 mb-2 w-full origin-bottom overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 ${
                isSelectOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              <div className="p-1">
                {pageSizeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onSetPageSize(option)}
                    className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-bold text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                  >
                    {option} per page
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex h-11 items-center gap-2">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={onPrevPage}
              className="h-full cursor-pointer rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:bg-gray-700"
            >
              Prev
            </button>
            <div className="flex h-full items-center rounded-xl border border-gray-200 bg-white px-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <span className="text-sm font-bold whitespace-nowrap text-gray-800 dark:text-gray-100">
                Page {safeCurrentPage} of {totalPages}
              </span>
            </div>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={onNextPage}
              className="h-full cursor-pointer rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
