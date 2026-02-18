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
    text: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#1e293b' : '#f1f5f9',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipText: isDark ? '#f1f5f9' : '#020617',
    tooltipBorder: isDark ? '#1e293b' : '#e2e8f0',
    activeBar: isDark ? '#6366f1' : '#4f46e5',
    bar: isDark ? '#4f46e5' : '#6366f1',
    barHover: isDark ? '#818cf8' : '#4338ca',
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
    padding: 12,
    displayColors: false,
    cornerRadius: 12,
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

        // Use gradients for bars
        const gradient = context.createLinearGradient(0, 0, 0, 400)
        gradient.addColorStop(0, colors.bar)
        gradient.addColorStop(1, colors.activeBar)

        const barColors = labels.map((label) =>
          activeTech?.toLowerCase() === label.toLowerCase() ? colors.barHover : gradient
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
                borderRadius: 8,
                hoverBackgroundColor: colors.barHover,
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
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: colors.text,
                  font: {
                    weight: 'bold',
                    size: 10,
                  }
                },
              },
              y: {
                grid: {
                  color: colors.grid,
                  drawTicks: false,
                },
                border: { display: false },
                ticks: {
                  color: colors.text,
                  stepSize: Math.ceil(Math.max(...values) / 5),
                  font: {
                    weight: '800',
                    size: 9,
                  }
                },
              },
            },
          },
        })

        if (chartRef.current) {
          chartRef.current.data.labels = labels
          chartRef.current.data.datasets[0].data = values
          chartRef.current.data.datasets[0].backgroundColor = barColors
          chartRef.current.options.plugins.tooltip = getTooltipConfig(theme)
          chartRef.current.options.scales.x.ticks.color = colors.text
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
    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
                />
              </svg>
            </span>
            Technology Landscape
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-slate-500 ml-13">Market prevalence of core technologies</p>
        </div>
      </div>

      <div className="relative">
        {topTechs.length ? (
          <>
            <div className="h-72 w-full">
              <canvas ref={chartCanvasRef} className="h-full w-full cursor-pointer" />
            </div>
            {chartError ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                Could not render insight: {chartError}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800/50">
              <svg className="h-8 w-8 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Empty Technology Record</p>
          </div>
        )}
      </div>
    </section>
  )
}
