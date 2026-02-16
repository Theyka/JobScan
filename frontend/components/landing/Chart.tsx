'use client'

import { useEffect, useRef, useState } from 'react'

import type {
  ChartConfig,
  ChartConstructor,
  ChartInstance,
  ChartTooltipOptions,
  CountItem,
} from '@/lib/datatypes/landing-page.types'

type ChartProps = {
  topTechs: CountItem[]
  theme: 'light' | 'dark'
  activeTech: string | null
  onToggleTech: (techName: string) => void
}

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

export default function Chart({ topTechs, theme, activeTech, onToggleTech }: ChartProps) {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartInstance | null>(null)
  const [chartError, setChartError] = useState<string | null>(null)

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
              onToggleTech(selected)
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
          const ChartFactory = window.Chart
          chartRef.current = new ChartFactory(context, buildConfig())
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
  }, [activeTech, onToggleTech, theme, topTechs])

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [])

  return (
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
              <p className="text-xs text-amber-600 dark:text-amber-400">Could not render chart: {chartError}</p>
            ) : null}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No technologies found.</p>
        )}
      </div>
    </div>
  )
}
