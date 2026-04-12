import Link from 'next/link'
import { redirect } from 'next/navigation'

import AdminSectionNav from '@/components/admin/AdminSectionNav'
import CustomDatePicker from '@/components/shared/CustomDatePicker'
import { buildAdminAnalytics, resolveAdminAnalyticsFilters, type AdminAnalyticsQuery } from '@/lib/admin/analytics'
import { getCurrentUserAccess } from '@/lib/admin/access'

type AdminPageProps = {
  searchParams?: Promise<AdminAnalyticsQuery> | AdminAnalyticsQuery
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function dateRangeLabel(from: string, to: string): string {
  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toDate = new Date(`${to}T00:00:00.000Z`)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return `${from} to ${to}`
  }

  const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${formatter.format(fromDate)} to ${formatter.format(toDate)}`
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const access = await getCurrentUserAccess()

  if (!access) {
    redirect('/auth/login')
  }

  if (!access.isAdmin) {
    redirect('/')
  }

  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  const filters = resolveAdminAnalyticsFilters(resolvedSearchParams)
  const analytics = await buildAdminAnalytics(filters)
  const maxSeriesValue = Math.max(1, ...analytics.trend.map((entry) => entry.visits))
  const totalTrendVisits = analytics.trend.reduce((sum, entry) => sum + entry.visits, 0)
  const averageTrendVisits = analytics.trend.length ? Math.round(totalTrendVisits / analytics.trend.length) : 0
  const peakTrendEntry = analytics.trend.reduce<(typeof analytics.trend)[number] | null>(
    (peak, entry) => (peak === null || entry.visits > peak.visits ? entry : peak),
    null
  )
  const trendChartWidth = 760
  const trendChartHeight = 260
  const trendChartPaddingX = 24
  const trendChartPaddingTop = 34
  const trendChartPaddingBottom = 50
  const trendInnerWidth = trendChartWidth - trendChartPaddingX * 2
  const trendInnerHeight = trendChartHeight - trendChartPaddingTop - trendChartPaddingBottom
  const trendPoints = analytics.trend.map((entry, index) => {
    const x =
      analytics.trend.length <= 1
        ? trendChartWidth / 2
        : trendChartPaddingX + (index / (analytics.trend.length - 1)) * trendInnerWidth
    const y = trendChartPaddingTop + (1 - entry.visits / maxSeriesValue) * trendInnerHeight

    return {
      ...entry,
      x,
      y,
    }
  })
  const trendLinePath = trendPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const trendAreaPath = trendPoints.length
    ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1]!.x} ${trendChartHeight - trendChartPaddingBottom} L ${trendPoints[0]!.x} ${trendChartHeight - trendChartPaddingBottom} Z`
    : ''
  const trendTickValues = Array.from(new Set([1, 0.75, 0.5, 0.25].map((ratio) => Math.round(maxSeriesValue * ratio))))

  return (
    <>
      <main className="relative mx-auto flex max-w-345 flex-col px-4 pb-16 pt-6 text-slate-900 transition-colors duration-300 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full py-6 lg:py-10">
        <AdminSectionNav current="stats" />

        {/* Dashboard Controls */}
        <section className="mb-10 flex flex-col gap-6 rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/8 bg-[#f8f6f3] text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Filter Insights</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{dateRangeLabel(filters.from, filters.to)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 rounded-xl border border-black/8 bg-[#f8f6f3] p-1.5 dark:border-white/8 dark:bg-white/6">
              <Link
                href="/admin?preset=month"
                className={`flex h-full items-center justify-center rounded-xl px-5 text-xs font-black uppercase tracking-widest transition-all ${filters.preset === 'month'
                  ? 'bg-[#8a6a43] text-white dark:bg-[#d7b37a] dark:text-[#151515]'
                  : 'text-slate-400 hover:text-[#8a6a43] dark:hover:text-[#d7b37a]'
                  }`}
              >
                Monthly
              </Link>
              <Link
                href="/admin?preset=year"
                className={`flex h-full items-center justify-center rounded-xl px-5 text-xs font-black uppercase tracking-widest transition-all ${filters.preset === 'year'
                  ? 'bg-[#8a6a43] text-white dark:bg-[#d7b37a] dark:text-[#151515]'
                  : 'text-slate-400 hover:text-[#8a6a43] dark:hover:text-[#d7b37a]'
                  }`}
              >
                Yearly
              </Link>
            </div>

            <form className="flex flex-wrap items-center gap-3" method="get">
              <input type="hidden" name="preset" value="custom" />
              <div className="flex h-12 items-center gap-4 rounded-xl border border-black/8 bg-[#f8f6f3] px-6 dark:border-white/8 dark:bg-white/6">
                <CustomDatePicker
                  name="from"
                  defaultValue={filters.from}
                />
                <span className="text-slate-400 font-black">-</span>
                <CustomDatePicker
                  name="to"
                  defaultValue={filters.to}
                />
              </div>
              <button
                type="submit"
                className="flex h-12 items-center justify-center rounded-xl border border-[#8a6a43] bg-[#8a6a43] px-6 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-[#765936] hover:bg-[#765936] active:scale-95 dark:border-[#d7b37a] dark:bg-[#d7b37a] dark:text-[#151515] dark:hover:border-[#c9a15e] dark:hover:bg-[#c9a15e]"
              >
                Apply
              </button>
            </form>
          </div>
        </section>

        {/* Core Metrics Grid */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Website Visits', value: analytics.summary.websiteVisits, icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              )
            },
            {
              label: 'Vacancy Visits', value: analytics.summary.vacancyVisits, icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.148l.857-3.611 3.611-.857m0 0a12.01 12.01 0 005.747-8.115m-.232 4.673a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-5.25" />
              )
            },
            {
              label: 'Tracked Positions', value: analytics.summary.trackedPositions, icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              )
            },
            {
              label: 'Tracked Companies', value: analytics.summary.trackedCompanies, icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              )
            },
          ].map((stat) => (
            <div key={stat.label} className="group relative rounded-3xl border border-black/8 bg-white p-6 transition-colors duration-300 hover:border-[#8a6a43]/30 dark:border-white/8 dark:bg-[#151515] dark:hover:border-[#d7b37a]/30">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f6f3] text-[#8a6a43] transition-colors group-hover:bg-[#8a6a43] group-hover:text-white dark:bg-white/6 dark:text-[#d7b37a] dark:group-hover:bg-[#d7b37a] dark:group-hover:text-[#151515]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {stat.icon}
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(stat.value)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trend Analysis */}
        <section className="mb-10 rounded-3xl border border-black/8 bg-white p-10 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Trend Insight</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-slate-500">
                {filters.granularity === 'month' ? 'Sequential monthly' : 'Detailed daily'} activity
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-3 dark:border-white/8 dark:bg-white/6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Total Visits</p>
                <p className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(totalTrendVisits)}</p>
              </div>
              <div className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-3 dark:border-white/8 dark:bg-white/6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Average</p>
                <p className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(averageTrendVisits)}</p>
              </div>
              <div className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-3 dark:border-white/8 dark:bg-white/6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Peak {filters.granularity === 'month' ? 'Period' : 'Day'}</p>
                <p className="mt-1 truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {peakTrendEntry ? peakTrendEntry.label : '—'}
                </p>
              </div>
            </div>
          </div>

          {analytics.trend.length ? (
            <div className="space-y-3">
              {peakTrendEntry ? (
                <div className="rounded-2xl border border-black/8 bg-[#f8f6f3] px-5 py-4 dark:border-white/8 dark:bg-white/6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Highest Activity</p>
                      <p className="mt-1 text-base font-black tracking-tight text-slate-900 dark:text-white">{peakTrendEntry.label}</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-black tracking-tight text-[#8a6a43] dark:border-white/8 dark:bg-[#151515] dark:text-[#d7b37a]">
                      {formatNumber(peakTrendEntry.visits)} visits
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.25rem] border border-black/8 bg-[#f8f6f3] p-4 dark:border-white/8 dark:bg-white/6">
                <div className="overflow-x-auto custom-scrollbar pb-3">
                    <svg
                      viewBox={`0 0 ${trendChartWidth} ${trendChartHeight}`}
                      className="h-120 min-w-180 w-full overflow-visible lg:min-w-0"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Trend insight chart"
                    >
                      {trendTickValues.map((tickValue, index) => {
                        const y = trendChartPaddingTop + (1 - tickValue / maxSeriesValue) * trendInnerHeight

                        return (
                          <g key={`${tickValue}-${index}`}>
                            <line
                              x1={trendChartPaddingX}
                              y1={y}
                              x2={trendChartWidth - trendChartPaddingX}
                              y2={y}
                              className="stroke-black/8 dark:stroke-white/10"
                              strokeDasharray="4 6"
                            />
                            <text
                              x={trendChartPaddingX - 10}
                              y={y + 3}
                              textAnchor="end"
                              className="fill-slate-400 text-[9px] font-black uppercase tracking-[0.16em] dark:fill-slate-500"
                            >
                              {formatNumber(tickValue)}
                            </text>
                          </g>
                        )
                      })}

                      <path d={trendAreaPath} fill="url(#trendAreaFill)" />
                      <path
                        d={trendLinePath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#8a6a43] dark:text-[#d7b37a]"
                      />

                      {trendPoints.map((point) => (
                        <g key={point.key}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="5"
                            className="fill-white stroke-[#8a6a43] dark:fill-[#151515] dark:stroke-[#d7b37a]"
                            strokeWidth="2.5"
                          />
                          <text
                            x={point.x}
                            y={point.y - 12}
                            textAnchor="middle"
                            className="fill-slate-700 text-[10px] font-black dark:fill-slate-200"
                          >
                            {formatNumber(point.visits)}
                          </text>
                          <text
                            x={point.x}
                            y={trendChartHeight - 8}
                            textAnchor="middle"
                            className="fill-slate-400 text-[9px] font-black uppercase tracking-[0.12em] dark:fill-slate-500"
                          >
                            {point.label}
                          </text>
                        </g>
                      ))}

                      <defs>
                        <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" className="text-[#8a6a43] dark:text-[#d7b37a]" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-[#8a6a43] dark:text-[#d7b37a]" />
                        </linearGradient>
                      </defs>
                    </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800/50">
                <svg className="h-8 w-8 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Empty Dataset</p>
            </div>
          )}
        </section>

        <div className="mb-10 grid grid-cols-1 gap-10 xl:grid-cols-2">
          {/* Top Positions Table */}
          <section className="rounded-3xl border border-black/8 bg-white p-10 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Engagement Rank</h2>
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#8a6a43] dark:border-white/8 dark:bg-white/6 dark:text-[#d7b37a]">Positions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                    <th className="px-3 py-4">Rank</th>
                    <th className="px-3 py-4 text-center">Visits</th>
                    <th className="px-3 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20">
                  {analytics.topPositions.length ? (
                    analytics.topPositions.map((item, index) => (
                      <tr key={`${item.source}-${item.vacancyId}`} className="group transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-6">
                          <span className={`text-2xl font-black tracking-tighter ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' :
                            index === 1 ? 'text-slate-400 dark:text-slate-500' :
                              index === 2 ? 'text-slate-300 dark:text-slate-600' :
                                'text-slate-200 dark:text-slate-700'
                            }`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-3 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(item.total)}</span>
                            <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              Total Engagement
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="max-w-56 truncate text-sm font-bold text-slate-900 group-hover:text-[#8a6a43] dark:text-white dark:group-hover:text-[#d7b37a]" title={item.title}>
                              {item.title}
                            </span>
                            <div className="mt-1.5 flex items-center justify-end gap-2">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500">{item.company}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${item.source === 'jobsearch' ? 'text-[#8a6a43] dark:text-[#d7b37a]' : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                {item.source}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-3 py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Data Available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Companies Table */}
          <section className="rounded-3xl border border-black/8 bg-white p-10 transition-colors duration-300 dark:border-white/8 dark:bg-[#151515]">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Active Market</h2>
              <span className="rounded-xl border border-black/8 bg-[#f8f6f3] px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:border-white/8 dark:bg-white/6 dark:text-slate-400">Companies</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                    <th className="px-3 py-4">Rank</th>
                    <th className="px-3 py-4 text-center">Visits</th>
                    <th className="px-3 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/20">
                  {analytics.topCompanies.length ? (
                    analytics.topCompanies.map((item, index) => (
                      <tr key={`${item.company}-${index}`} className="group transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-6">
                          <span className={`text-2xl font-black tracking-tighter ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' :
                            index === 1 ? 'text-slate-400 dark:text-slate-500' :
                              index === 2 ? 'text-slate-300 dark:text-slate-600' :
                                'text-slate-200 dark:text-slate-700'
                            }`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-3 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatNumber(item.total)}</span>
                            <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              Market Presence
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="max-w-56 truncate text-sm font-black text-slate-900 group-hover:text-[#8a6a43] dark:text-white dark:group-hover:text-[#d7b37a]" title={item.company}>
                              {item.company}
                            </span>
                            <div className="mt-1.5 flex items-center justify-end gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Corporate Identity</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-3 py-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Data Available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>


  </div>
  </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 100 900;
          font-display: swap;
          src: url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyMZhrib2Bg-4.woff2) format('woff2');
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}} />
    </>
  )
}
