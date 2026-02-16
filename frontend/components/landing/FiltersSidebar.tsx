import type { CountItem, SalaryRange, SourceFilter } from '@/lib/datatypes/landing-page.types'

type FiltersSidebarProps = {
  isMobileSidebarOpen: boolean
  onCloseMobileSidebar: () => void
  search: string
  onSearchChange: (value: string) => void
  activeSource: SourceFilter | null
  onSetActiveSource: (value: SourceFilter | null) => void
  salaryRanges: SalaryRange[]
  salaryMin: number | null
  salaryMax: number | null
  onSetSalaryRange: (min: number | null, max: number | null) => void
  showAllCompanies: boolean
  onToggleShowAllCompanies: () => void
  companyInput: string
  onCompanyInputChange: (value: string) => void
  displayCompanies: CountItem[]
  activeCompanyTag: string | null
  onToggleCompanyTag: (value: string) => void
  showAllTechs: boolean
  onToggleShowAllTechs: () => void
  techInput: string
  onTechInputChange: (value: string) => void
  displayTechs: CountItem[]
  activeTech: string | null
  onToggleTech: (value: string) => void
}

export default function FiltersSidebar({
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  search,
  onSearchChange,
  activeSource,
  onSetActiveSource,
  salaryRanges,
  salaryMin,
  salaryMax,
  onSetSalaryRange,
  showAllCompanies,
  onToggleShowAllCompanies,
  companyInput,
  onCompanyInputChange,
  displayCompanies,
  activeCompanyTag,
  onToggleCompanyTag,
  showAllTechs,
  onToggleShowAllTechs,
  techInput,
  onTechInputChange,
  displayTechs,
  activeTech,
  onToggleTech,
}: FiltersSidebarProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-80 transform flex-col gap-8 overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl transition-transform duration-300 dark:border-gray-700 dark:bg-gray-900 lg:static lg:h-auto lg:w-1/4 lg:translate-x-0 lg:overflow-visible lg:border-l-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
          isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-xl font-bold dark:text-white">Filters</h2>
          <button
            type="button"
            onClick={onCloseMobileSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:block">
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

        <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <span className="rounded-lg bg-gray-100 p-1 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </span>
            Sources
          </h2>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onSetActiveSource(null)}
              className={`source-filter-btn flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeSource === null
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <span>All Sources</span>
              {activeSource === null ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
            </button>

            <button
              type="button"
              onClick={() => onSetActiveSource('duplicates')}
              className={`source-filter-btn flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeSource === 'duplicates'
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  D
                </span>
                <span>Duplicates</span>
              </div>
              {activeSource === 'duplicates' ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
            </button>

            <button
              type="button"
              onClick={() => onSetActiveSource('jobsearch.az')}
              className={`source-filter-btn flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeSource === 'jobsearch.az'
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <img src="https://jobsearch.az/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
                <span>JobSearch.az</span>
              </div>
              {activeSource === 'jobsearch.az' ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
            </button>

            <button
              type="button"
              onClick={() => onSetActiveSource('glorri')}
              className={`source-filter-btn flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeSource === 'glorri'
                  ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <img src="https://jobs.glorri.com/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
                <span>Glorri</span>
              </div>
              {activeSource === 'glorri' ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
            </button>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <span className="rounded-lg bg-gray-100 p-1 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            Salary Range
          </h2>
          <div className="flex flex-col gap-2">
            {salaryRanges.map((range) => {
              const isActive = salaryMin === range.min && salaryMax === range.max
              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => onSetSalaryRange(range.min, range.max)}
                  className={`salary-filter-btn flex cursor-pointer items-center justify-between rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{range.label}</span>
                  {isActive ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex h-auto max-h-80 flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:max-h-none">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span className="rounded-lg bg-gray-100 p-1 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </span>
              Companies
            </h2>
            <button
              type="button"
              onClick={onToggleShowAllCompanies}
              className="cursor-pointer rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {showAllCompanies ? 'Hide All' : 'Show All'}
            </button>
          </div>

          {showAllCompanies ? (
            <div className="mb-4 relative shrink-0 transition-all duration-300">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={companyInput}
                onChange={(event) => onCompanyInputChange(event.target.value)}
                placeholder="Filter company..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-1.5 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
          ) : null}

          {showAllCompanies ? (
            <div className="custom-scrollbar flex flex-wrap gap-2 overflow-y-auto pr-2 transition-all duration-300 lg:max-h-80">
              {displayCompanies.length ? (
                displayCompanies.map((company) => {
                  const isActive = activeCompanyTag === company.name

                  return (
                    <button
                      key={company.name}
                      type="button"
                      onClick={() => onToggleCompanyTag(company.name)}
                      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-purple-200 bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-1 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-100 dark:ring-offset-gray-800'
                          : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {company.name}
                      <span className="ml-1.5 text-xs opacity-60">({company.count})</span>
                    </button>
                  )
                })
              ) : (
                <span className="text-sm text-gray-500">No companies found</span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex h-auto max-h-80 flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:max-h-none">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span className="rounded-lg bg-gray-100 p-1 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </span>
              Techs
            </h2>
            <button
              type="button"
              onClick={onToggleShowAllTechs}
              className="cursor-pointer rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {showAllTechs ? 'Hide All' : 'Show All'}
            </button>
          </div>

          {showAllTechs ? (
            <div className="mb-4 relative shrink-0 transition-all duration-300">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={techInput}
                onChange={(event) => onTechInputChange(event.target.value)}
                placeholder="Filter tech..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-1.5 pr-3 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
          ) : null}

          {showAllTechs ? (
            <div className="custom-scrollbar flex flex-wrap gap-2 overflow-y-auto pr-2 transition-all duration-300 lg:max-h-80">
              {displayTechs.length ? (
                displayTechs.map((tech) => {
                  const isActive = activeTech === tech.name

                  return (
                    <button
                      key={tech.name}
                      type="button"
                      onClick={() => onToggleTech(tech.name)}
                      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-blue-200 bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-1 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:ring-offset-gray-800'
                          : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tech.name}
                      <span className="ml-1.5 text-xs opacity-60">({tech.count})</span>
                    </button>
                  )
                })
              ) : (
                <span className="text-sm text-gray-500">No technologies found</span>
              )}
            </div>
          ) : null}
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileSidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={onCloseMobileSidebar}
      />
    </>
  )
}
