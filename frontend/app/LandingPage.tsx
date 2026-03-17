'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import FiltersSidebar from '@/components/landing/FiltersSidebar'
import LandingTopBar from '@/components/landing/LandingTopBar'
import Footer from '@/components/shared/Footer'
import JobsSection from '@/components/landing/JobsSection'
import type { LandingData, LandingJob } from '@/lib/datatypes/landing-data.types'
import type { CountItem, PageSizeOption, SalaryRange, SourceFilter } from '@/lib/datatypes/landing-page.types'

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [18, 36, 54, 72]
type SortOption = 'latest' | 'oldest' | 'salary-desc' | 'salary-asc' | 'company-asc'

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

type IndexedLandingJob = {
  job: LandingJob
  companyLower: string
  titleLower: string
  technologiesLower: string[]
  salaryRange: { min: number | null; max: number | null }
  createdAtTs: number
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
}

export default function LandingPage({ data }: { data: LandingData }) {
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
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [showAllTechs, setShowAllTechs] = useState(true)
  const [showAllCompanies, setShowAllCompanies] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const selectRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('theme')
    const resolvedTheme = savedTheme === 'dark' ? 'dark' : 'light'

    const savedItems = Number.parseInt(window.localStorage.getItem('itemsPerPage') || '', 10)

    window.requestAnimationFrame(() => {
      applyTheme(resolvedTheme)
      if (isPageSizeOption(savedItems)) {
        setItemsPerPage(savedItems)
      }
    })
  }, [])

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

  const indexedJobs = useMemo<IndexedLandingJob[]>(() => {
    return data.recent_jobs.map((job) => {
      const createdAtTs = Date.parse(job.created_at || '')

      return {
        job,
        companyLower: job.company.toLowerCase(),
        titleLower: job.title.toLowerCase(),
        technologiesLower: job.technologies.map((tech) => tech.toLowerCase()),
        salaryRange: parseSalaryRange(job.salary),
        createdAtTs: Number.isNaN(createdAtTs) ? 0 : createdAtTs,
      }
    })
  }, [data.recent_jobs])

  const filteredJobs = useMemo(() => {
    const activeTechLower = activeTech?.toLowerCase() ?? null

    const matches = indexedJobs.filter(({ job, companyLower, titleLower, technologiesLower, salaryRange }) => {
      if (
        activeTechLower &&
        !technologiesLower.some((tech) => tech === activeTechLower)
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
        const resolvedMin = Number.isFinite(salaryRange.min) ? salaryRange.min : null
        const resolvedMax = Number.isFinite(salaryRange.max) ? salaryRange.max : null

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

      if (normalizedCompanyInput && !companyLower.includes(normalizedCompanyInput)) {
        return false
      }

      if (normalizedSearch) {
        const inTitle = titleLower.includes(normalizedSearch)
        const inCompany = companyLower.includes(normalizedSearch)
        const inTech = technologiesLower.some((tech) => tech.includes(normalizedSearch))

        if (!inTitle && !inCompany && !inTech) {
          return false
        }
      }

      return true
    })

    const sorted = [...matches]

    sorted.sort((left, right) => {
      const leftJob = left.job
      const rightJob = right.job

      if (sortBy === 'company-asc') {
        return leftJob.company.localeCompare(rightJob.company)
      }

      if (sortBy === 'salary-desc' || sortBy === 'salary-asc') {
        const leftSalary = left.salaryRange
        const rightSalary = right.salaryRange
        const leftValue = leftSalary.max ?? leftSalary.min ?? -1
        const rightValue = rightSalary.max ?? rightSalary.min ?? -1

        return sortBy === 'salary-desc' ? rightValue - leftValue : leftValue - rightValue
      }

      return sortBy === 'oldest' ? left.createdAtTs - right.createdAtTs : right.createdAtTs - left.createdAtTs
    })

    return sorted.map((entry) => entry.job)
  }, [
    activeCompanyTag,
    activeSource,
    activeTech,
    indexedJobs,
    normalizedCompanyInput,
    normalizedSearch,
    salaryMax,
    salaryMin,
    sortBy,
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

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)

  const pageJobs = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage
    return filteredJobs.slice(start, start + itemsPerPage)
  }, [filteredJobs, itemsPerPage, safeCurrentPage])

  const toggleTechFilter = useCallback((techName: string) => {
    setActiveTech((prev) => (prev?.toLowerCase() === techName.toLowerCase() ? null : techName))
    setCurrentPage(1)
  }, [])

  const setPageSize = useCallback((nextSize: PageSizeOption) => {
    setItemsPerPage(nextSize)
    setCurrentPage(1)
    setIsSelectOpen(false)
    window.localStorage.setItem('itemsPerPage', String(nextSize))
  }, [])

  const setSalaryRange = useCallback((min: number | null, max: number | null) => {
    setSalaryMin(min)
    setSalaryMax(max)
    setCurrentPage(1)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    applyTheme(nextTheme)
    window.localStorage.setItem('theme', nextTheme)
  }, [])

  const clearFilter = useCallback(() => {
    setActiveTech(null)
    setActiveCompanyTag(null)
    setActiveSource(null)
    setSearch('')
    setCompanyInput('')
    setTechInput('')
    setSalaryMin(null)
    setSalaryMax(null)
    setCurrentPage(1)
  }, [])

  const setSearchValue = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true)
  }, [])

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  const setSourceFilter = useCallback((value: SourceFilter | null) => {
    setActiveSource(value)
    setCurrentPage(1)
  }, [])

  const toggleCompanyFilter = useCallback((value: string) => {
    setActiveCompanyTag((prev) => (prev === value ? null : value))
    setCurrentPage(1)
  }, [])

  const setCompanyFilterInput = useCallback((value: string) => {
    setCompanyInput(value)
    setCurrentPage(1)
  }, [])

  const setTechFilterInput = useCallback((value: string) => {
    setTechInput(value)
    setCurrentPage(1)
  }, [])

  const togglePageSizeMenu = useCallback(() => {
    setIsSelectOpen((open) => !open)
  }, [])

  const goToPrevPage = useCallback(() => {
    setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))
  }, [totalPages])

  const goToNextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(totalPages, Math.max(1, page) + 1))
  }, [totalPages])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-foreground transition-colors duration-300 dark:bg-[#111111]">
      <div className="sticky top-0 z-50 w-full bg-[#151515] border-b border-black/20">
        <div className="mx-auto max-w-345 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <LandingTopBar onToggleTheme={toggleTheme} />
        </div>
      </div>

      <main className="relative mx-auto flex max-w-345 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
        {data.error ? (
          <div className="mb-8 rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            Could not load landing data from database: {data.error}
          </div>
        ) : null}

        <section className="px-0 py-2 transition-colors duration-300 max-sm:dark:rounded-2xl max-sm:dark:px-2 max-sm:dark:py-3 sm:rounded-2xl sm:p-4">
          <div className="grid h-full gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
            <div className="min-w-0 lg:overflow-hidden lg:rounded-xl lg:transition-colors lg:duration-300 dark:lg:bg-transparent">
              <FiltersSidebar
                isMobileSidebarOpen={isMobileSidebarOpen}
                onCloseMobileSidebar={closeMobileSidebar}
                onClearFilters={clearFilter}
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

            <div className="min-w-0 rounded-xl p-0 transition-colors duration-300 sm:p-4">
              <div id="open-roles">
                <JobsSection
                  filteredJobs={filteredJobs}
                  pageJobs={pageJobs}
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
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
