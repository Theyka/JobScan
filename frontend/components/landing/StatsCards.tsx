import type { LandingData } from '@/lib/datatypes/landing-data.types'

type StatsCardsProps = {
  data: LandingData
}

export default function StatsCards({ data }: StatsCardsProps) {
  const stats = [
    {
      label: 'Jobs Analyzed',
      value: data.total_jobs,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      ),
    },
    {
      label: 'Most Popular',
      value: data.top_language || '-',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      ),
    },
    {
      label: 'Jobs with Tech Stack',
      value: data.jobs_with_tech,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      ),
    },
    {
      label: 'Technologies Found',
      value: data.total_techs,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      ),
    },
  ]

  return (
    <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="group relative rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-indigo-600 transition-colors group-hover:border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:group-hover:bg-indigo-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {stat.icon}
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                {typeof stat.value === 'number' ? new Intl.NumberFormat('en-US').format(stat.value) : stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
