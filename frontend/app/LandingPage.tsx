'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Chart from '@/components/landing/Chart'
import FiltersSidebar from '@/components/landing/FiltersSidebar'
import Footer from '@/components/shared/Footer'
import JobsSection from '@/components/landing/JobsSection'
import SourceBreakdown from '@/components/landing/SourceBreakdown'
import StatsCards from '@/components/landing/StatsCards'
import SiteHeader from '@/components/shared/SiteHeader'
import type { LandingData, LandingJob } from '@/lib/datatypes/landing-data.types'
import type { CountItem, PageSizeOption, SalaryRange, SourceFilter } from '@/lib/datatypes/landing-page.types'

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [18, 36, 54, 72]

const SALARY_RANGES: SalaryRange[] = [
  { id: 'salary-all', label: 'All Salaries', min: null, max: null },
  { id: 'salary-0-1000', label: '0 - 1,000 AZN', min: 0, max: 1000 },
  { id: 'salary-1000-2000', label: '1,000 - 2,000 AZN', min: 1000, max: 2000 },
  { id: 'salary-2000-3000', label: '2,000 - 3,000 AZN', min: 2000, max: 3000 },
  { id: 'salary-3000-5000', label: '3,000 - 5,000 AZN', min: 3000, max: 5000 },
  { id: 'salary-5000-up', label: '5,000+ AZN', min: 5000, max: null },
]

function isPageSizeOption(value: number): value is PageSizeOption {
  return PAGE_SIZE_OPTIONS.includes(value as PageSizeOption)
}

function parseSalaryRange(salaryText: string): { min: number | null; max: number | null } {
  const raw = String(salaryText || '').trim()
  if (!raw || raw === 'Not specified') {
    return { min: null, max: null }
  }

  const matches = raw.match(/[\d,]+/g)
  if (!matches?.length) {
    return { min: null, max: null }
  }

  const numbers = matches
    .map((value) => Number.parseInt(value.replace(/,/g, ''), 10))
    .filter((value) => Number.isFinite(value))

  if (!numbers.length) {
    return { min: null, max: null }
  }

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  return { min, max }
}

function collectCounts(values: string[]): CountItem[] {
  const counts = new Map<string, { name: string; count: number }>()

  for (const value of values) {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      continue
    }

    const key = trimmed.toLowerCase()
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { name: trimmed, count: 1 })
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function hasSource(job: LandingJob, source: SourceFilter): boolean {
  if (source === 'duplicates') {
    return job.sources.length > 1
  }

  return job.sources.some((entry) => entry.key === source)
}

function sourceLabelForBadge(source: SourceFilter): string {
  if (source === 'duplicates') {
    return 'Duplicates'
  }

  return source === 'glorri' ? 'Glorri' : 'JS.AZ'
}

export default function LandingPage({ data }: { data: LandingData }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [hasExplicitTheme, setHasExplicitTheme] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTech, setActiveTech] = useState<string | null>(null)
  const [activeCompanyTag, setActiveCompanyTag] = useState<string | null>(null)
  const [activeSource, setActiveSource] = useState<SourceFilter | null>(null)
  const [companyInput, setCompanyInput] = useState('')
  const [techInput, setTechInput] = useState('')
  const [salaryMin, setSalaryMin] = useState<number | null>(null)
  const [salaryMax, setSalaryMax] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeOption>(18)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [showAllTechs, setShowAllTechs] = useState(true)
  const [showAllCompanies, setShowAllCompanies] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [prefsHydrated, setPrefsHydrated] = useState(false)

  const selectRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme')
    const hasSavedTheme = savedTheme === 'dark' || savedTheme === 'light'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const resolvedTheme = hasSavedTheme ? savedTheme : systemTheme

    const savedItems = Number.parseInt(window.localStorage.getItem('itemsPerPage') || '', 10)

    window.requestAnimationFrame(() => {
      setTheme(resolvedTheme)
      setHasExplicitTheme(hasSavedTheme)
      if (isPageSizeOption(savedItems)) {
        setItemsPerPage(savedItems)
      }
      setPrefsHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!prefsHydrated) {
      return
    }

    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.style.colorScheme = theme
    if (hasExplicitTheme) {
      window.localStorage.setItem('theme', theme)
    } else {
      window.localStorage.removeItem('theme')
    }
  }, [hasExplicitTheme, prefsHydrated, theme])

  useEffect(() => {
    if (!prefsHydrated || hasExplicitTheme) {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applySystemTheme = (isDark: boolean) => {
      setTheme(isDark ? 'dark' : 'light')
    }

    applySystemTheme(media.matches)

    const onChange = (event: MediaQueryListEvent) => {
      applySystemTheme(event.matches)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [hasExplicitTheme, prefsHydrated])

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!selectRef.current) {
        return
      }

      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (!selectRef.current.contains(target)) {
        setIsSelectOpen(false)
      }
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [])

  const normalizedSearch = search.trim().toLowerCase()
  const normalizedCompanyInput = companyInput.trim().toLowerCase()
  const normalizedTechInput = techInput.trim().toLowerCase()

  const filteredJobs = useMemo(() => {
    return data.recent_jobs.filter((job) => {
      if (
        activeTech &&
        !job.technologies.some((tech) => tech.toLowerCase() === activeTech.toLowerCase())
      ) {
        return false
      }

      if (activeCompanyTag && job.company !== activeCompanyTag) {
        return false
      }

      if (activeSource && !hasSource(job, activeSource)) {
        return false
      }

      if (salaryMin !== null || salaryMax !== null) {
        const salary = parseSalaryRange(job.salary)
        const resolvedMin = Number.isFinite(salary.min) ? salary.min : null
        const resolvedMax = Number.isFinite(salary.max) ? salary.max : null

        if (resolvedMin === null && resolvedMax === null) {
          return false
        }

        if (salaryMin !== null && (resolvedMax ?? resolvedMin ?? 0) < salaryMin) {
          return false
        }

        if (salaryMax !== null && (resolvedMin ?? resolvedMax ?? Number.MAX_SAFE_INTEGER) > salaryMax) {
          return false
        }
      }

      if (normalizedCompanyInput && !job.company.toLowerCase().includes(normalizedCompanyInput)) {
        return false
      }

      if (normalizedSearch) {
        const inTitle = job.title.toLowerCase().includes(normalizedSearch)
        const inCompany = job.company.toLowerCase().includes(normalizedSearch)
        const inTech = job.technologies.some((tech) => tech.toLowerCase().includes(normalizedSearch))

        if (!inTitle && !inCompany && !inTech) {
          return false
        }
      }

      return true
    })
  }, [
    activeCompanyTag,
    activeSource,
    activeTech,
    data.recent_jobs,
    normalizedCompanyInput,
    normalizedSearch,
    salaryMax,
    salaryMin,
  ])

  const availableTechs = useMemo(() => {
    const allTechs = collectCounts(filteredJobs.flatMap((job) => job.technologies))

    if (activeTech && !allTechs.some((item) => item.name.toLowerCase() === activeTech.toLowerCase())) {
      return [...allTechs, { name: activeTech, count: 0 }].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name)
      )
    }

    return allTechs
  }, [activeTech, filteredJobs])

  const availableCompanies = useMemo(() => {
    const allCompanies = collectCounts(filteredJobs.map((job) => job.company || 'Unknown'))

    if (
      activeCompanyTag &&
      !allCompanies.some((item) => item.name.toLowerCase() === activeCompanyTag.toLowerCase())
    ) {
      return [...allCompanies, { name: activeCompanyTag, count: 0 }].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name)
      )
    }

    return allCompanies
  }, [activeCompanyTag, filteredJobs])

  const displayTechs = useMemo(() => {
    if (!normalizedTechInput) {
      return availableTechs
    }

    return availableTechs.filter((item) => item.name.toLowerCase().includes(normalizedTechInput))
  }, [availableTechs, normalizedTechInput])

  const displayCompanies = useMemo(() => {
    if (!normalizedCompanyInput) {
      return availableCompanies
    }

    return availableCompanies.filter((item) => item.name.toLowerCase().includes(normalizedCompanyInput))
  }, [availableCompanies, normalizedCompanyInput])

  const topTechs = useMemo(() => availableTechs.slice(0, 15), [availableTechs])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)

  const pageJobs = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage
    return filteredJobs.slice(start, start + itemsPerPage)
  }, [filteredJobs, itemsPerPage, safeCurrentPage])

  const activeFilterParts = [
    activeTech ? `Tech: ${activeTech}` : null,
    activeCompanyTag ? `Company: ${activeCompanyTag}` : null,
    activeSource ? `Source: ${sourceLabelForBadge(activeSource)}` : null,
  ].filter((part): part is string => part !== null)

  const toggleTechFilter = useCallback((techName: string) => {
    setActiveTech((prev) => (prev?.toLowerCase() === techName.toLowerCase() ? null : techName))
    setCurrentPage(1)
  }, [])

  const setPageSize = (nextSize: PageSizeOption) => {
    setItemsPerPage(nextSize)
    setCurrentPage(1)
    setIsSelectOpen(false)
    window.localStorage.setItem('itemsPerPage', String(nextSize))
  }

  const setSalaryRange = (min: number | null, max: number | null) => {
    setSalaryMin(min)
    setSalaryMax(max)
    setCurrentPage(1)
  }

  const toggleTheme = () => {
    setHasExplicitTheme(true)
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const clearFilter = () => {
    setActiveTech(null)
    setActiveCompanyTag(null)
    setActiveSource(null)
    setCurrentPage(1)
  }

  const setSearchValue = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const openMobileSidebar = () => {
    setIsMobileSidebarOpen(true)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  const setSourceFilter = (value: SourceFilter | null) => {
    setActiveSource(value)
    setCurrentPage(1)
  }

  const toggleCompanyFilter = (value: string) => {
    setActiveCompanyTag((prev) => (prev === value ? null : value))
    setCurrentPage(1)
  }

  const setCompanyFilterInput = (value: string) => {
    setCompanyInput(value)
    setCurrentPage(1)
  }

  const setTechFilterInput = (value: string) => {
    setTechInput(value)
    setCurrentPage(1)
  }

  const togglePageSizeMenu = () => {
    setIsSelectOpen((open) => !open)
  }

  const goToPrevPage = () => {
    setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))
  }

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, Math.max(1, page) + 1))
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#020617] dark:text-slate-100">
      {/* Sticky Full-Width Header */}
      {/* NOTE: backdrop-blur is on a child div, NOT the wrapper. backdrop-filter creates a new
          stacking context which would trap the profile dropdown inside it. By isolating the blur
          to a pseudo-background child, the wrapper remains a normal stacking context. */}
      <div className="relative z-[100] sm:sticky top-0 w-full shadow-sm">
        {/* Blurred background layer */}
        <div className="absolute inset-0 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#0f172a]/80" />
        {/* Content layer (above the blur, no stacking context issues) */}
        <div className="relative container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-2 sm:!pb-4 !pt-3 sm:!pt-4"
            onToggleTheme={toggleTheme}
          />
        </div>
      </div>


      <div className="container mx-auto flex max-w-7xl grow flex-col px-4 py-12">
        <div className="w-full">
          {data.error ? (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              Could not load landing data from database: {data.error}
            </div>
          ) : null}

          <StatsCards data={data} />
          <SourceBreakdown data={data} />

          <div className="mt-12 flex flex-col gap-8 lg:flex-row">
            <main className="grow lg:w-3/4">
              <div className="mb-8 grid grid-cols-1 gap-8">
                <Chart topTechs={topTechs} theme={theme} activeTech={activeTech} onToggleTech={toggleTechFilter} />
              </div>
              <JobsSection
                filteredJobs={filteredJobs}
                pageJobs={pageJobs}
                activeFilterParts={activeFilterParts}
                clearFilter={clearFilter}
                activeTech={activeTech}
                normalizedSearch={normalizedSearch}
                search={search}
                onSearchChange={setSearchValue}
                onOpenMobileFilters={openMobileSidebar}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                itemsPerPage={itemsPerPage}
                isSelectOpen={isSelectOpen}
                onTogglePageSizeMenu={togglePageSizeMenu}
                onSetPageSize={setPageSize}
                selectRef={selectRef}
                safeCurrentPage={safeCurrentPage}
                totalPages={totalPages}
                onPrevPage={goToPrevPage}
                onNextPage={goToNextPage}
              />
            </main>
            <FiltersSidebar
              isMobileSidebarOpen={isMobileSidebarOpen}
              onCloseMobileSidebar={closeMobileSidebar}
              search={search}
              onSearchChange={setSearchValue}
              activeSource={activeSource}
              onSetActiveSource={setSourceFilter}
              salaryRanges={SALARY_RANGES}
              salaryMin={salaryMin}
              salaryMax={salaryMax}
              onSetSalaryRange={setSalaryRange}
              showAllCompanies={showAllCompanies}
              onToggleShowAllCompanies={() => setShowAllCompanies((open) => !open)}
              companyInput={companyInput}
              onCompanyInputChange={setCompanyFilterInput}
              displayCompanies={displayCompanies}
              activeCompanyTag={activeCompanyTag}
              onToggleCompanyTag={toggleCompanyFilter}
              showAllTechs={showAllTechs}
              onToggleShowAllTechs={() => setShowAllTechs((open) => !open)}
              techInput={techInput}
              onTechInputChange={setTechFilterInput}
              displayTechs={displayTechs}
              activeTech={activeTech}
              onToggleTech={toggleTechFilter}
            />
          </div>
        </div>
      </div>

      {/* Full-Width Footer Container */}
      <div className="w-full bg-white border-t border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
        <Footer />
      </div>
    </div>
  )
}
