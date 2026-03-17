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
    text: isDark ? '#90a2b5' : '#5f7286',
    grid: isDark ? '#183044' : '#dbe4ee',
    tooltipBg: isDark ? '#0d1b29' : '#ffffff',
    tooltipText: isDark ? '#edf3f8' : '#0f2235',
    tooltipBorder: isDark ? '#1e3548' : '#d4dde6',
    activeBar: isDark ? '#d4b06f' : '#ba9551',
    bar: isDark ? '#7ea8cf' : '#153758',
    barHover: isDark ? '#99bbdc' : '#0f2840',
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

        const gradient = context.createLinearGradient(0, 0, 0, 420)
        gradient.addColorStop(0, colors.bar)
        gradient.addColorStop(1, colors.barHover)

        const barColors = labels.map((label) =>
          activeTech?.toLowerCase() === label.toLowerCase() ? colors.activeBar : gradient
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
                borderRadius: 10,
                hoverBackgroundColor: colors.activeBar,
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
                    weight: '600',
                    size: 10,
                  },
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
                  stepSize: Math.max(1, Math.ceil(Math.max(...values) / 5)),
                  font: {
                    weight: '600',
                    size: 10,
                  },
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
    <section className="corporate-panel overflow-hidden rounded-2xl px-6 py-7 sm:px-8 sm:py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="corporate-kicker">Demand Index</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]">
            Technology landscape by mention volume
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_66%,transparent)]">
            Use the bars to focus the vacancy feed by technology. The gold state marks the currently selected demand
            signal.
          </p>
        </div>
        <div className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--foreground)_56%,transparent)]">
          Click any bar to filter
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--surface-strong)_78%,white_22%)] p-4 sm:p-6">
        {topTechs.length ? (
          <>
            <div className="h-80 w-full">
              <canvas ref={chartCanvasRef} className="h-full w-full cursor-pointer" />
            </div>
            {chartError ? (
              <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                Could not render insight: {chartError}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-[color:var(--line)] bg-[color:var(--surface-muted)]/60">
            <div className="rounded-full bg-[color:var(--accent-soft)] p-4 text-[color:var(--accent)]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:color-mix(in_srgb,var(--foreground)_44%,transparent)]">
              No technology signal available
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
