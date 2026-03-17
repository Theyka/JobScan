/* eslint-disable @next/next/no-img-element */

import { memo } from 'react'

import type { CountItem, SalaryRange, SourceFilter } from '@/lib/datatypes/landing-page.types'

type FiltersSidebarProps = {
  isMobileSidebarOpen: boolean
  onCloseMobileSidebar: () => void
  onClearFilters: () => void
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

function FiltersSidebar({
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  onClearFilters,
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
  const visibleCompanies = displayCompanies
  const visibleTechs = displayTechs

  return (
    <>
      <aside
        className={`fixed inset-x-3 bottom-3 top-3 z-200 flex transform flex-col rounded-xl bg-[#f6f4f0] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] dark:bg-[#151515] sm:left-auto sm:w-100 lg:static lg:top-6 lg:z-auto lg:w-full lg:translate-x-0 lg:bg-transparent dark:lg:bg-transparent xl:sticky ${
          isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-[110%] pointer-events-none lg:pointer-events-auto'
        }`}
      >
        {/* Mobile header – never scrolls away */}
        <div className="flex shrink-0 items-center justify-between p-4 pb-0 lg:hidden">
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-foreground">Filters</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-11 items-center rounded-xl border border-black/10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/54 hover:border-black/20 hover:bg-white hover:text-black dark:border-white/10 dark:text-white/58 dark:hover:border-white/18 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onCloseMobileSidebar}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-black/5 text-foreground dark:border-white/10 dark:bg-white/8"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-scroll overscroll-contain p-4 lg:overflow-visible lg:p-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="rounded-xl border border-black/8 bg-white px-5 pb-5 pt-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
          <div className="rounded-lg bg-[#f8f6f3] p-4 transition-colors duration-300 dark:bg-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/46 dark:text-white/48">Search</p>
              <label className="relative mt-3 block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35 dark:text-white/34">
                  <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search jobs"
                  className="h-11 w-full rounded-xl border border-black/8 bg-white px-4 pl-10 text-sm text-[#151515] outline-none placeholder:text-black/32 focus:border-black/16 dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/32 dark:focus:border-white/18"
                />
              </label>
            </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/46 dark:text-white/48">Source filter</p>
            <div className="mt-3 flex flex-col gap-2">
            {[
              { id: null, label: 'All sources' },
              { id: 'duplicates', label: 'Duplicates', char: 'D' },
              { id: 'jobsearch.az', label: 'JobSearch.az', icon: 'https://jobsearch.az/favicon.ico' },
              { id: 'glorri', label: 'Glorri', icon: 'https://jobs.glorri.com/favicon.ico' },
            ].map((source) => {
              const isActive = activeSource === source.id
              return (
                <button
                  key={String(source.id)}
                  type="button"
                  onClick={() => onSetActiveSource(source.id as SourceFilter | null)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-[#151515] bg-[#151515] text-white dark:border-white/16 dark:bg-white dark:text-[#151515]'
                      : 'border-black/8 bg-[#f8f6f3] text-black/66 hover:border-black/14 hover:bg-white hover:text-black dark:border-white/8 dark:bg-white/5 dark:text-white/72 dark:hover:border-white/14 dark:hover:bg-white/8 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {source.icon ? <img src={source.icon} className="h-4 w-4 rounded-sm" alt="" /> : null}
                    {source.char ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/14 text-[9px] font-semibold">
                        {source.char}
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold">{source.label}</span>
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-white dark:bg-[#151515]' : 'bg-black/18 dark:bg-white/20'}`} />
                </button>
              )
            })}
          </div>
        </div>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/46 dark:text-white/48">Salary range</p>
            <div className="mt-3 flex flex-col gap-2">
            {salaryRanges.map((range) => {
              const isActive = salaryMin === range.min && salaryMax === range.max

              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => onSetSalaryRange(range.min, range.max)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'border-[#151515] bg-[#151515] text-white dark:border-white/16 dark:bg-white dark:text-[#151515]'
                      : 'border-black/8 bg-[#f8f6f3] text-black/66 hover:border-black/14 hover:bg-white hover:text-black dark:border-white/8 dark:bg-white/5 dark:text-white/72 dark:hover:border-white/14 dark:hover:bg-white/8 dark:hover:text-white'
                  }`}
                >
                  <span className="text-sm font-semibold">{range.label}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-white dark:bg-[#151515]' : 'bg-black/18 dark:bg-white/20'}`} />
                </button>
              )
            })}
          </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/46 dark:text-white/48">Companies</p>
            <button
              type="button"
              onClick={onToggleShowAllCompanies}
              className="rounded-xl border border-black/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/56 transition hover:border-black/20 hover:bg-[#f8f6f3] hover:text-black dark:border-white/8 dark:text-white/58 dark:hover:border-white/14 dark:hover:bg-white/6 dark:hover:text-white"
            >
              {showAllCompanies ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showAllCompanies ? (
            <>
              <input
                type="text"
                value={companyInput}
                onChange={(event) => onCompanyInputChange(event.target.value)}
                placeholder="Filter company"
                className="mt-4 h-11 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm text-foreground outline-none placeholder:text-black/34 focus:border-black/16 dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/32 dark:focus:border-white/18"
              />
              <div className="custom-scrollbar mt-4 flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
                {visibleCompanies.map((company) => {
                  const isActive = activeCompanyTag === company.name

                  return (
                    <button
                      key={company.name}
                      type="button"
                      onClick={() => onToggleCompanyTag(company.name)}
                          className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                        isActive
                            ? 'border-[#151515] bg-[#151515] text-white dark:border-white/16 dark:bg-white dark:text-[#151515]'
                            : 'border-black/8 bg-[#f8f6f3] text-black/60 hover:border-black/14 hover:bg-white hover:text-black dark:border-white/8 dark:bg-white/5 dark:text-white/72 dark:hover:border-white/14 dark:hover:bg-white/8 dark:hover:text-white'
                      }`}
                    >
                      {company.name}
                      <span className="ml-1.5 opacity-70">({company.count})</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/46 dark:text-white/48">Technology</p>
            <button
              type="button"
              onClick={onToggleShowAllTechs}
              className="rounded-xl border border-black/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/56 transition hover:border-black/20 hover:bg-[#f8f6f3] hover:text-black dark:border-white/8 dark:text-white/58 dark:hover:border-white/14 dark:hover:bg-white/6 dark:hover:text-white"
            >
              {showAllTechs ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showAllTechs ? (
            <>
              <input
                type="text"
                value={techInput}
                onChange={(event) => onTechInputChange(event.target.value)}
                placeholder="Filter technology"
                className="mt-4 h-11 w-full rounded-xl border border-black/8 bg-[#f8f6f3] px-4 text-sm text-foreground outline-none placeholder:text-black/34 focus:border-black/16 dark:border-white/10 dark:bg-white/6 dark:text-white dark:placeholder:text-white/32 dark:focus:border-white/18"
              />
              <div className="custom-scrollbar mt-4 flex max-h-60 flex-wrap gap-2 overflow-y-auto pr-1">
                {visibleTechs.map((tech) => {
                  const isActive = activeTech === tech.name

                  return (
                    <button
                      key={tech.name}
                      type="button"
                      onClick={() => onToggleTech(tech.name)}
                          className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                        isActive
                            ? 'border-[#151515] bg-[#151515] text-white dark:border-white/16 dark:bg-white dark:text-[#151515]'
                            : 'border-black/8 bg-[#f8f6f3] text-black/60 hover:border-black/14 hover:bg-white hover:text-black dark:border-white/8 dark:bg-white/5 dark:text-white/72 dark:hover:border-white/14 dark:hover:bg-white/8 dark:hover:text-white'
                      }`}
                    >
                      {tech.name}
                      <span className="ml-1.5 opacity-70">({tech.count})</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>
        </div>
      </aside>
    </>
  )
}

export default memo(FiltersSidebar)
