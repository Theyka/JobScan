import Link from 'next/link'
import { redirect } from 'next/navigation'

import AdminSectionNav from '@/components/admin/AdminSectionNav'
import Footer from '@/components/shared/Footer'
import SiteHeader from '@/components/shared/SiteHeader'
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#020617] dark:text-slate-100">
      {/* Sticky Full-Width Header */}
      <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-[#0f172a]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <SiteHeader
            className="border-none !pb-4 !pt-4"
            title="Analytics Hub"
            subtitle={`Platform performance for ${dateRangeLabel(filters.from, filters.to)}`}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        <AdminSectionNav current="stats" />

        {/* Dashboard Controls */}
        <section className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between rounded-3xl border border-slate-300/50 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Filter Insights</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Adjust temporal range for precise analysis</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
              <Link
                href="/admin?preset=month"
                className={`flex h-full items-center justify-center rounded-xl px-5 text-xs font-black uppercase tracking-widest transition-all ${filters.preset === 'month'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                Monthly
              </Link>
              <Link
                href="/admin?preset=year"
                className={`flex h-full items-center justify-center rounded-xl px-5 text-xs font-black uppercase tracking-widest transition-all ${filters.preset === 'year'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
              >
                Yearly
              </Link>
            </div>

            <form className="flex flex-wrap items-center gap-3" method="get">
              <input type="hidden" name="preset" value="custom" />
              <div className="flex h-12 items-center gap-4 rounded-2xl bg-slate-50 border border-slate-200 px-6 dark:bg-slate-800 dark:border-slate-700">
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
                className="flex h-12 items-center justify-center rounded-2xl bg-indigo-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/30 active:scale-95"
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
            <div key={stat.label} className="group relative rounded-3xl border border-slate-300/50 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex flex-col gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-indigo-400 dark:group-hover:bg-indigo-500">
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
        <section className="mb-10 rounded-[2.5rem] border border-slate-300/50 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Trend Insight</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-slate-500">
                {filters.granularity === 'month' ? 'Sequential monthly' : 'Detailed daily'} activity
              </p>
            </div>
            <div className="flex items-center gap-6 rounded-2xl bg-slate-50 p-2.5 px-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Visits</span>
              </div>
            </div>
          </div>

          {analytics.trend.length ? (
            <div className="pb-6">
              <div className="flex items-end gap-2 px-2">
                {analytics.trend.map((entry) => {
                  const visitsPercent = (entry.visits / maxSeriesValue) * 100

                  return (
                    <div key={entry.key} className="group flex flex-1 flex-col items-center gap-4">
                      <div className="relative flex h-64 w-full flex-row items-end justify-center rounded-2xl bg-slate-200 p-1 dark:bg-slate-800/30 sm:p-2">
                        {/* Visits bar */}
                        <div
                          title={`Visits: ${formatNumber(entry.visits)}`}
                          style={{ height: `${visitsPercent}%`, minHeight: '6px' }}
                          className="relative w-full max-w-[2.5rem] rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm transition-all group-hover:from-indigo-700 group-hover:to-indigo-500"
                        />
                      </div>
                      <p className="max-w-full truncate text-[8px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500 sm:text-[9px] sm:tracking-widest">
                        {entry.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
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
          <section className="rounded-[2.5rem] border border-slate-300/50 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Engagement Rank</h2>
              <span className="rounded-xl bg-indigo-50 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">Positions</span>
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
                            <span className="max-w-[14rem] truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400" title={item.title}>
                              {item.title}
                            </span>
                            <div className="mt-1.5 flex items-center justify-end gap-2">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500">{item.company}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${item.source === 'jobsearch' ? 'text-blue-500' : 'text-purple-500'
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
          <section className="rounded-[2.5rem] border border-slate-300/50 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Active Market</h2>
              <span className="rounded-xl bg-slate-100 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">Companies</span>
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
                            <span className="max-w-[14rem] truncate text-sm font-black text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400" title={item.company}>
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

      {/* Full-Width Footer Container */}
      <div className="w-full bg-white border-t border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
        <Footer />
      </div>

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
    </div>
  )
}
