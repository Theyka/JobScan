'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { LandingData, LandingJob, SourceKey } from '@/lib/landing-data'

type PageSizeOption = 20 | 40 | 60 | 80

type CountItem = {
  name: string
  count: number
}

type SalaryRange = {
  id: string
  label: string
  min: number | null
  max: number | null
}

type SourceFilter = SourceKey | 'duplicates'

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [20, 40, 60, 80]

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

function salaryRangeIsActive(
  salaryMin: number | null,
  salaryMax: number | null,
  range: SalaryRange
): boolean {
  return salaryMin === range.min && salaryMax === range.max
}

function sourceLabelForBadge(source: SourceFilter): string {
  if (source === 'duplicates') {
    return 'Duplicates'
  }

  return source === 'glorri' ? 'Glorri' : 'JS.AZ'
}

type ChartTooltipOptions = {
  backgroundColor: string
  titleColor: string
  bodyColor: string
  borderColor: string
  borderWidth: number
  padding: number
}

type ChartOptions = {
  responsive: boolean
  maintainAspectRatio: boolean
  onClick: (event: unknown, elements: Array<{ index: number }>) => void
  plugins: {
    legend: {
      display: boolean
    }
    tooltip: ChartTooltipOptions
  }
  scales: {
    x: {
      grid: {
        display: boolean
        drawBorder: boolean
        drawTicks: boolean
      }
      border: {
        display: boolean
      }
      ticks: {
        color: string
      }
    }
    y: {
      grid: {
        display: boolean
        color: string
        drawBorder: boolean
        drawTicks: boolean
      }
      border: {
        display: boolean
      }
      ticks: {
        color: string
        stepSize: number
      }
    }
  }
}

type ChartDataset = {
  label: string
  data: number[]
  backgroundColor: string | string[]
  borderRadius: number
}

type ChartData = {
  labels: string[]
  datasets: ChartDataset[]
}

type ChartConfig = {
  type: 'bar'
  data: ChartData
  options: ChartOptions
}

type ChartInstance = {
  data: ChartData
  options: ChartOptions
  update: () => void
  destroy: () => void
}

type ChartConstructor = new (context: CanvasRenderingContext2D, config: ChartConfig) => ChartInstance

declare global {
  interface Window {
    Chart?: ChartConstructor
    __landingChartScriptPromise?: Promise<void>
  }
}

function getChartColors(theme: 'light' | 'dark') {
  const isDark = theme === 'dark'
  return {
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#1f2937',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
    activeBar: isDark ? '#3b82f6' : '#1d4ed8',
    bar: '#2563eb',
  }
}

function getTooltipConfig(theme: 'light' | 'dark'): ChartTooltipOptions {
  const colors = getChartColors(theme)
  return {
    backgroundColor: colors.tooltipBg,
    titleColor: colors.tooltipText,
    bodyColor: colors.tooltipText,
    borderColor: colors.tooltipBorder,
    borderWidth: 1,
    padding: 10,
  }
}

function ensureChartScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.Chart) {
    return Promise.resolve()
  }

  if (window.__landingChartScriptPromise) {
    return window.__landingChartScriptPromise
  }

  window.__landingChartScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-landing-chartjs="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load chart script')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
    script.async = true
    script.dataset.landingChartjs = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load chart script'))
    document.head.appendChild(script)
  })

  return window.__landingChartScriptPromise
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
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeOption>(20)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [showAllTechs, setShowAllTechs] = useState(true)
  const [showAllCompanies, setShowAllCompanies] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)
  const [prefsHydrated, setPrefsHydrated] = useState(false)

  const selectRef = useRef<HTMLDivElement | null>(null)
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartInstance | null>(null)

  useEffect(() => {
    const cookieThemeMatch = window.document.cookie.match(/(?:^|;\s*)theme=(dark|light)(?:;|$)/)
    const cookieTheme = cookieThemeMatch?.[1]
    const savedTheme = window.localStorage.getItem('theme')
    const hasSavedTheme = savedTheme === 'dark' || savedTheme === 'light'
    const hasCookieTheme = cookieTheme === 'dark' || cookieTheme === 'light'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const resolvedTheme = hasSavedTheme ? savedTheme : hasCookieTheme ? cookieTheme : systemTheme

    const savedItems = Number.parseInt(window.localStorage.getItem('itemsPerPage') || '', 10)

    window.requestAnimationFrame(() => {
      setTheme(resolvedTheme)
      setHasExplicitTheme(hasSavedTheme || hasCookieTheme)
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
      window.document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`
    } else {
      window.localStorage.removeItem('theme')
      window.document.cookie = 'theme=; path=/; max-age=0; samesite=lax'
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

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }

    media.addListener(onChange)
    return () => media.removeListener(onChange)
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
  ].filter(Boolean)

  const uniqueStat = data.stats.unique_glorri + data.stats.unique_jsaz

  const toggleTechFilter = useCallback((techName: string) => {
    setActiveTech((prev) => (prev?.toLowerCase() === techName.toLowerCase() ? null : techName))
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    let cancelled = false

    const renderChart = async () => {
      if (!topTechs.length) {
        if (chartRef.current) {
          chartRef.current.destroy()
          chartRef.current = null
        }
        setChartError(null)
        return
      }

      try {
        await ensureChartScript()

        if (cancelled || !chartCanvasRef.current || !window.Chart) {
          return
        }

        const context = chartCanvasRef.current.getContext('2d')
        if (!context) {
          return
        }

        const labels = topTechs.map((item) => item.name)
        const values = topTechs.map((item) => item.count)
        const colors = getChartColors(theme)
        const barColors = labels.map((label) =>
          activeTech?.toLowerCase() === label.toLowerCase() ? colors.activeBar : colors.bar
        )

        const buildConfig = (): ChartConfig => ({
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Mentions',
                data: values,
                backgroundColor: barColors,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (_event, elements) => {
              const index = elements[0]?.index
              if (typeof index !== 'number') {
                return
              }
              const selected = labels[index]
              if (!selected) {
                return
              }
              toggleTechFilter(selected)
            },
            plugins: {
              legend: { display: false },
              tooltip: getTooltipConfig(theme),
            },
            scales: {
              x: {
                grid: { display: false, drawBorder: false, drawTicks: false },
                border: { display: false },
                ticks: { color: colors.text },
              },
              y: {
                grid: { display: false, color: colors.grid, drawBorder: false, drawTicks: false },
                border: { display: false },
                ticks: { color: colors.text, stepSize: 1 },
              },
            },
          },
        })

        if (chartRef.current) {
          chartRef.current.data.labels = labels
          chartRef.current.data.datasets[0].data = values
          chartRef.current.data.datasets[0].backgroundColor = barColors
          chartRef.current.options.plugins.tooltip = getTooltipConfig(theme)
          chartRef.current.options.scales.x.grid.display = false
          chartRef.current.options.scales.x.grid.drawBorder = false
          chartRef.current.options.scales.x.grid.drawTicks = false
          chartRef.current.options.scales.x.border.display = false
          chartRef.current.options.scales.x.ticks.color = colors.text
          chartRef.current.options.scales.y.grid.display = false
          chartRef.current.options.scales.y.grid.drawBorder = false
          chartRef.current.options.scales.y.grid.drawTicks = false
          chartRef.current.options.scales.y.border.display = false
          chartRef.current.options.scales.y.ticks.color = colors.text
          chartRef.current.options.scales.y.grid.color = colors.grid
          chartRef.current.update()
        } else {
          const Chart = window.Chart
          chartRef.current = new Chart(context, buildConfig())
        }

        setChartError(null)
      } catch (error) {
        if (cancelled) {
          return
        }
        const message = error instanceof Error ? error.message : String(error)
        setChartError(message)
      }
    }

    void renderChart()

    return () => {
      cancelled = true
    }
  }, [activeTech, theme, toggleTechFilter, topTechs])

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-50">
      <div className="container mx-auto flex max-w-7xl grow px-4 py-8">
        <div className="w-full">
          <header className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">JobScan Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Merged vacancies from JobSearch.az and Glorri
                </p>
              </div>

              <div className="mt-2 flex flex-row items-center gap-4 sm:mt-0 sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  aria-label="Toggle theme"
                >
                  <span className={`text-xl ${theme === 'dark' ? 'block' : 'hidden'}`}>☀️</span>
                  <span className={`text-xl ${theme === 'dark' ? 'hidden' : 'block'}`}>🌙</span>
                </button>
              </div>
            </div>
          </header>

          {data.error ? (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              Could not load landing data from database: {data.error}
            </div>
          ) : null}

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{data.total_jobs}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Jobs Analyzed</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{data.top_language || '-'}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Popular</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{data.jobs_with_tech}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Jobs with Tech Stack</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <span className="block text-2xl font-bold text-gray-900 dark:text-white">{data.total_techs}</span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Technologies Found</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                Source Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-center gap-1.5">
                    <img src="https://jobs.glorri.com/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Glorri</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total_glorri}</span>
                </div>

                <div className="flex flex-col items-center gap-2 rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center gap-1.5">
                    <img src="https://jobsearch.az/favicon.ico" className="h-4 w-4 rounded-sm" alt="" />
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">JobSearch.az</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.total_jsaz}</span>
                </div>

                <div className="flex flex-col items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Overlap</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.overlap}</span>
                </div>

                <div className="flex flex-col items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Unique</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueStat}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row">
            <main className="grow lg:w-3/4">
              <div className="mb-8 grid grid-cols-1 gap-8">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <span className="rounded-lg bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                        />
                      </svg>
                    </span>
                    Top Programming Languages &amp; Technologies
                  </h2>

                  <div className="space-y-2">
                    {topTechs.length ? (
                      <>
                        <div className="chart-wrapper">
                          <canvas ref={chartCanvasRef} className="h-full w-full cursor-pointer" />
                        </div>
                        {chartError ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Could not render chart: {chartError}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No technologies found.</p>
                    )}
                  </div>
                </div>
              </div>

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
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Title, company, or tech..."
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-4 pl-10 text-gray-900 transition-all placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-8 lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
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
                      const internalDetailPath = jobSlug
                        ? `/vacancies/${routeSource}/${encodeURIComponent(jobSlug)}`
                        : ''
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
                        setIsSelectOpen((open) => !open)
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
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPageSize(option)}
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
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))
                      }
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
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, Math.max(1, page) + 1))
                      }
                      className="h-full cursor-pointer rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </main>

            <aside
              className={`fixed inset-y-0 right-0 z-50 flex w-80 transform flex-col gap-8 overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl transition-transform duration-300 dark:border-gray-700 dark:bg-gray-900 lg:static lg:h-auto lg:w-1/4 lg:translate-x-0 lg:overflow-visible lg:border-l-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
                isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="flex items-center justify-between lg:hidden">
                <h2 className="text-xl font-bold dark:text-white">Filters</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
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
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setCurrentPage(1)
                    }}
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
                    onClick={() => {
                      setActiveSource(null)
                      setCurrentPage(1)
                    }}
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
                    onClick={() => {
                      setActiveSource('duplicates')
                      setCurrentPage(1)
                    }}
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
                    onClick={() => {
                      setActiveSource('jobsearch.az')
                      setCurrentPage(1)
                    }}
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
                    onClick={() => {
                      setActiveSource('glorri')
                      setCurrentPage(1)
                    }}
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
                  {SALARY_RANGES.map((range) => {
                    const isActive = salaryRangeIsActive(salaryMin, salaryMax, range)
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setSalaryRange(range.min, range.max)}
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
                    onClick={() => setShowAllCompanies((open) => !open)}
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
                      onChange={(event) => {
                        setCompanyInput(event.target.value)
                        setCurrentPage(1)
                      }}
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
                            onClick={() => {
                              setActiveCompanyTag((prev) => (prev === company.name ? null : company.name))
                              setCurrentPage(1)
                            }}
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
                    onClick={() => setShowAllTechs((open) => !open)}
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
                      onChange={(event) => {
                        setTechInput(event.target.value)
                        setCurrentPage(1)
                      }}
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
                            onClick={() => {
                              toggleTechFilter(tech.name)
                            }}
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
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      </div>

      <footer className="mt-auto border-t border-gray-200 py-6 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data source:{' '}
            <a
              href="https://jobsearch.az"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              JobSearch
            </a>{' '}
            and{' '}
            <a
              href="https://glorri.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Glorri
            </a>{' '}
            | IT Category
          </p>
        </div>
      </footer>
    </div>
  )
}
