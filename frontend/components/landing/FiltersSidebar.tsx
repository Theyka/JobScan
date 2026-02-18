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
        className={`fixed inset-y-0 right-0 z-40 flex w-85 transform flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white p-8 shadow-2xl transition-transform duration-500 ease-out dark:border-slate-800 dark:bg-slate-950 lg:static lg:h-auto lg:w-1/4 lg:translate-x-0 lg:overflow-visible lg:border-l-0 lg:bg-transparent lg:p-0 lg:shadow-none ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between lg:hidden mb-4">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Filters</h2>
          <button
            type="button"
            onClick={onCloseMobileSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Global Search in Sidebar for Desktop */}
        <div className="hidden rounded-[2rem] border border-slate-300 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 lg:block">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Search</h2>
          </div>
          <div className="relative group">
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Title, company, or tech..."
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-indigo-500/30 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-600"
            />
          </div>
        </div>

        {/* Sources Selection */}
        <div className="rounded-[2rem] border border-slate-300 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sources</h2>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: null, label: 'All Sources' },
              { id: 'duplicates', label: 'Duplicates', char: 'D' },
              { id: 'jobsearch.az', label: 'JobSearch.az', icon: 'https://jobsearch.az/favicon.ico' },
              { id: 'glorri', label: 'Glorri', icon: 'https://jobs.glorri.com/favicon.ico' },
            ].map((source) => {
              const isActive = activeSource === source.id
              return (
                <button
                  key={String(source.id)}
                  type="button"
                  onClick={() => onSetActiveSource(source.id as any)}
                  className={`group flex items-center justify-between rounded-xl border px-4 h-11 transition-all ${isActive
                    ? 'border-indigo-500/20 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {source.icon && <img src={source.icon} className="h-4 w-4 rounded-sm" alt="" />}
                    {source.char && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-indigo-100 text-[10px] font-black text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {source.char}
                      </span>
                    )}
                    <span className="text-xs font-bold tracking-tight">{source.label}</span>
                  </div>
                  <div className={`h-1.5 w-1.5 rounded-full transition-transform ${isActive ? 'scale-100 bg-indigo-500' : 'scale-0 bg-slate-300'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Salary Projections */}
        <div className="rounded-[2rem] border border-slate-300 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Salary Range</h2>
          </div>
          <div className="flex flex-col gap-2">
            {salaryRanges.map((range) => {
              const isActive = salaryMin === range.min && salaryMax === range.max
              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => onSetSalaryRange(range.min, range.max)}
                  className={`group flex items-center justify-between rounded-xl border px-4 h-11 transition-all ${isActive
                    ? 'border-indigo-500/20 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                >
                  <span className="text-xs font-bold tracking-tight">{range.label}</span>
                  <div className={`h-1.5 w-1.5 rounded-full transition-transform ${isActive ? 'scale-100 bg-indigo-500' : 'scale-0 bg-slate-300'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Aggregations (Companies & Techs) */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[2.5rem] border border-slate-300 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Companies</h2>
              <button
                type="button"
                onClick={onToggleShowAllCompanies}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              >
                {showAllCompanies ? 'Hide All' : 'Show All'}
              </button>
            </div>

            {showAllCompanies && (
              <div className="mb-6">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(event) => onCompanyInputChange(event.target.value)}
                  placeholder="Filter company..."
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            {showAllCompanies && (
              <div className="custom-scrollbar flex flex-wrap gap-2 overflow-y-auto max-h-60 pr-2">
                {displayCompanies.map((company) => {
                  const isActive = activeCompanyTag === company.name
                  return (
                    <button
                      key={company.name}
                      type="button"
                      onClick={() => onToggleCompanyTag(company.name)}
                      className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${isActive
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/30'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                    >
                      {company.name}
                      <span className={`ml-1.5 opacity-60 ${isActive ? 'text-white' : ''}`}>({company.count})</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-slate-300/60 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Techs</h2>
              <button
                type="button"
                onClick={onToggleShowAllTechs}
                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              >
                {showAllTechs ? 'Hide All' : 'Show All'}
              </button>
            </div>

            {showAllTechs && (
              <div className="mb-6">
                <input
                  type="text"
                  value={techInput}
                  onChange={(event) => onTechInputChange(event.target.value)}
                  placeholder="Filter tech..."
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            {showAllTechs && (
              <div className="custom-scrollbar flex flex-wrap gap-2 overflow-y-auto max-h-60 pr-2">
                {displayTechs.map((tech) => {
                  const isActive = activeTech === tech.name
                  return (
                    <button
                      key={tech.name}
                      type="button"
                      onClick={() => onToggleTech(tech.name)}
                      className={`rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${isActive
                        ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                    >
                      {tech.name}
                      <span className={`ml-1.5 opacity-60 ${isActive ? 'text-white' : ''}`}>({tech.count})</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 lg:hidden ${isMobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={onCloseMobileSidebar}
      />
    </>
  )
}
